import { describe, expect, it } from 'vitest';

import {
  formatCurrencyAmount,
  formatDate,
  formatJalaliDate,
  formatNumber,
  formatRelative,
  normalizeDigits,
  parseAmount,
  thousandSeparateInput,
} from './format';
import { CoreError } from './errors';

/** Local-noon ISO strings (no Z) keep these tests timezone-independent. */
const SEP16_NOON = '2026-09-16T12:00:00';

describe('normalizeDigits (scraper + fa input parity)', () => {
  it('maps Persian and Arabic-Indic digits to ASCII', () => {
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(normalizeDigits('۱۲۳ USD')).toBe('123 USD');
  });

  it('maps the Persian decimal separator and passes everything else through', () => {
    expect(normalizeDigits('۳٫۵')).toBe('3.5');
    expect(normalizeDigits('a,b')).toBe('a,b');
  });
});

describe('parseAmount (tolerant parse-back)', () => {
  it('accepts plain numbers, commas and Persian digits/separators', () => {
    expect(parseAmount('1234.56')).toBe(1234.56);
    expect(parseAmount('1,234.56')).toBe(1234.56);
    expect(parseAmount('1٬234')).toBe(1234); // Arabic thousands separator
    expect(parseAmount('۱۲۳۴')).toBe(1234);
    expect(parseAmount('۱٬۲۳۴')).toBe(1234);
    expect(parseAmount('۳٫۵')).toBe(3.5);
    expect(parseAmount('.5')).toBe(0.5);
    expect(parseAmount(' 42 ')).toBe(42);
    expect(parseAmount('-7')).toBe(-7);
  });

  it('returns null (never NaN) for garbage', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('12.3.4')).toBeNull();
    expect(parseAmount('1,')).toBe(1); // trailing separator tolerated (legacy replace(/,/g,'') parity)
  });
});

describe('formatNumber', () => {
  it('formats en-US with grouping and legacy default decimals', () => {
    expect(formatNumber(1234567.89, 'en-US')).toBe('1,234,567.89');
    expect(formatNumber(1234567.891, 'en-US')).toBe('1,234,567.89'); // max 2 default
    expect(formatNumber(1234567.891, 'en-US', { maximumFractionDigits: 0 })).toBe('1,234,568');
    expect(formatNumber(5.5, 'en-US', { minimumFractionDigits: 2 })).toBe('5.50');
  });

  it('formats fa-IR with Persian digits and fa separators', () => {
    expect(formatNumber(1234567, 'fa-IR', { maximumFractionDigits: 0 })).toBe('۱٬۲۳۴٬۵۶۷');
    expect(formatNumber(1234.5, 'fa-IR')).toBe('۱٬۲۳۴٫۵');
  });

  it('throws a typed error for non-finite values', () => {
    expect(() => formatNumber(Number.NaN, 'en-US')).toThrow(CoreError);
  });
});

describe('formatCurrencyAmount (minorUnits-aware)', () => {
  it('uses 0 decimals for IRR (Toman) and 2 for USD by default', () => {
    expect(formatCurrencyAmount(23050000, 'IRR', 'en-US')).toBe('23,050,000');
    expect(formatCurrencyAmount(1234.5, 'USD', 'en-US')).toBe('1,234.5');
    expect(formatCurrencyAmount(1234.5, 'USD', 'en-US', { minimumFractionDigits: 2 })).toBe('1,234.50');
  });

  it('renders Persian digits for fa-IR', () => {
    expect(formatCurrencyAmount(23050000, 'IRR', 'fa-IR')).toBe('۲۳٬۰۵۰٬۰۰۰');
    expect(formatCurrencyAmount(1234.5, 'USD', 'fa-IR')).toBe('۱٬۲۳۴٫۵');
  });

  it('falls back to 2 decimals for unknown codes', () => {
    expect(formatCurrencyAmount(1234.567, 'XAU', 'en-US')).toBe('1,234.57'); // unknown → max 2
  });

  it('lifts maximumFractionDigits when a caller raises the minimum (no Intl RangeError)', () => {
    expect(formatNumber(5.5, 'en-US', { minimumFractionDigits: 4 })).toBe('5.5000');
    expect(formatCurrencyAmount(5.5, 'IRR', 'en-US', { minimumFractionDigits: 2 })).toBe('5.50');
  });
});

describe('formatDate (Gregorian — must NOT leak the persian calendar)', () => {
  it('formats en-US Gregorian', () => {
    expect(formatDate(SEP16_NOON, 'en-US')).toBe('09/16/2026');
    expect(formatDate(SEP16_NOON, 'en-US', { withTime: true })).toBe('09/16/2026, 12:00:00 PM');
  });

  it('formats fa-IR GREGORIAN (not Jalali) with Persian digits', () => {
    const fa = formatDate(SEP16_NOON, 'fa-IR');
    expect(fa).toBe('۲۰۲۶/۰۹/۱۶');
    expect(fa).not.toContain('۱۴۰۵'); // would appear if the persian calendar leaked
  });

  it('throws a typed error for invalid ISO strings', () => {
    expect(() => formatDate('not-a-date', 'en-US')).toThrow(CoreError);
  });
});

describe('formatJalaliDate (Intl persian calendar — no jalaali dependency)', () => {
  it('formats a known ISO date correctly: 2026-09-16 → 1405/06/25', () => {
    expect(formatJalaliDate(SEP16_NOON, 'fa-IR')).toBe('۱۴۰۵/۰۶/۲۵');
    expect(formatJalaliDate(SEP16_NOON, 'en-US')).toContain('1405');
    expect(formatJalaliDate(SEP16_NOON, 'en-US')).toContain('06/25');
  });

  it('roundtrips a Nowruz boundary date: 1405 Farvardin 1 = 2026-03-21', () => {
    expect(formatJalaliDate('2026-03-21T12:00:00', 'fa-IR')).toBe('۱۴۰۵/۰۱/۰۱');
  });
});

describe('formatRelative (legacy getTimeAgo parity + fa)', () => {
  const now = new Date('2026-09-16T12:00:00').getTime();

  it('en: just now / minutes / hours / days with pluralization', () => {
    expect(formatRelative('2026-09-16T11:59:30', 'en-US', now)).toBe('just now'); // 30s
    expect(formatRelative('2026-09-16T11:59:01', 'en-US', now)).toBe('just now'); // < 1 full minute
    expect(formatRelative('2026-09-16T11:30:00', 'en-US', now)).toBe('30 minutes ago');
    expect(formatRelative('2026-09-16T11:59:00', 'en-US', now)).toBe('1 minute ago'); // singular
    expect(formatRelative('2026-09-16T11:58:30', 'en-US', now)).toBe('1 minute ago'); // 90s floor → 1
    expect(formatRelative('2026-09-16T09:00:00', 'en-US', now)).toBe('3 hours ago');
    expect(formatRelative('2026-09-16T11:00:00', 'en-US', now)).toBe('1 hour ago');
    expect(formatRelative('2026-09-13T12:00:00', 'en-US', now)).toBe('3 days ago');
    expect(formatRelative('2026-09-15T12:00:00', 'en-US', now)).toBe('1 day ago');
  });

  it('fa: localized strings with Persian digits (matches apps/web i18n)', () => {
    expect(formatRelative('2026-09-16T11:59:30', 'fa-IR', now)).toBe('همین حالا');
    expect(formatRelative('2026-09-16T11:30:00', 'fa-IR', now)).toBe('۳۰ دقیقه پیش');
    expect(formatRelative('2026-09-16T09:00:00', 'fa-IR', now)).toBe('۳ ساعت پیش');
    expect(formatRelative('2026-09-13T12:00:00', 'fa-IR', now)).toBe('۳ روز پیش');
  });

  it('throws a typed error for invalid ISO strings', () => {
    expect(() => formatRelative('garbage', 'en-US', now)).toThrow(CoreError);
  });
});

describe('thousandSeparateInput (legacy amount-input behavior)', () => {
  it('groups the integer part every 3 digits as you type', () => {
    expect(thousandSeparateInput('1234567')).toBe('1,234,567');
    expect(thousandSeparateInput('1234567.891')).toBe('1,234,567.891');
    expect(thousandSeparateInput('1234')).toBe('1,234');
    expect(thousandSeparateInput('123')).toBe('123');
    expect(thousandSeparateInput('.5')).toBe('.5');
    expect(thousandSeparateInput('1234.')).toBe('1,234.');
    expect(thousandSeparateInput('')).toBe('');
    expect(thousandSeparateInput(',,')).toBe('');
  });

  it('re-groups already-separated input (idempotent while typing)', () => {
    expect(thousandSeparateInput('1,234,567')).toBe('1,234,567');
    expect(thousandSeparateInput('1,23,4567')).toBe('1,234,567'); // odd grouping fixed
  });

  it('normalizes Persian digits before grouping', () => {
    expect(thousandSeparateInput('۱۲۳۴۵۶۷')).toBe('1,234,567');
  });

  it('collapses multiple dots (documented improvement over the legacy converter)', () => {
    expect(thousandSeparateInput('12.34.56')).toBe('12.3456');
  });

  it('leaves non-numeric input untouched (legacy parity)', () => {
    expect(thousandSeparateInput('abc')).toBe('abc');
    expect(thousandSeparateInput('12abc')).toBe('12abc');
  });

  it('round-trips through parseAmount', () => {
    expect(parseAmount(thousandSeparateInput('9876543.21'))).toBe(9876543.21);
    expect(parseAmount(thousandSeparateInput('۱۲۳۴۵'))).toBe(12345);
  });
});
