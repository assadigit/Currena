/**
 * Render-time formatting (AGENTS.md rule 5).
 *
 * - Locale is ALWAYS a parameter; formatted output is NEVER stored
 *   (localStorage/API payloads keep canonical numbers and ISO strings).
 * - 'fa-IR' renders Persian digits (Intl default numbering system) and
 *   uses fa separators: group '٬' (U+066C), decimal '٫' (U+066B).
 * - Jalali dates come from Intl's built-in persian calendar — no jalaali
 *   dependency (checklist #8/#19).
 * - `normalizeDigits` / `parseAmount` / `thousandSeparateInput` cover the
 *   legacy amount-input behavior plus the fa-locale digit normalization
 *   the mission adds; the scraper reuses `normalizeDigits` because TGJU
 *   pages serve Persian digits in some elements (FEATURE_MAP §4).
 */

import { CoreError } from './errors';
import { getCurrency } from './currencies';

/** Locales the product renders. */
export type Locale = 'en-US' | 'fa-IR';

/* ------------------------------------------------------------------ *
 * Digit normalization (pure, shared with the scraper)
 * ------------------------------------------------------------------ */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Map Persian (U+06F0–06F9) and Arabic-Indic (U+0660–0669) digits to ASCII,
 * and the Persian decimal separator '٫' (U+066B) to '.'. Everything else
 * passes through unchanged. Group separators (',' and '٬') are NOT touched
 * here — see `parseAmount`.
 */
export function normalizeDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const persian = PERSIAN_DIGITS.indexOf(ch);
    if (persian >= 0) {
      out += String(persian);
      continue;
    }
    const arabic = ARABIC_DIGITS.indexOf(ch);
    if (arabic >= 0) {
      out += String(arabic);
      continue;
    }
    out += ch === '٫' ? '.' : ch;
  }
  return out;
}

/**
 * Tolerant numeric parse for user input (legacy `parseFloat(v.replace(/,/g,''))`
 * parity, extended for the fa locale): accepts thousands separators (',' and
 * Arabic '٬'), Persian/Arabic-Indic digits and the Persian decimal separator.
 * Returns null when no valid number is present — never NaN.
 */
export function parseAmount(input: string): number | null {
  const normalized = normalizeDigits(input).replace(/[,٬\s]/g, '');
  if (normalized === '' || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/* ------------------------------------------------------------------ *
 * Number formatting
 * ------------------------------------------------------------------ */

export interface NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** false → plain digits, no thousands separators (years, codes). */
  useGrouping?: boolean;
}

/* ------------------------------------------------------------------ *
 * Formatter caches
 *
 * `Intl.NumberFormat`/`DateTimeFormat` construction is 100–40,000× slower
 * than a cached `.format()` call (measured 2026-09-24: 19.5 ms vs 0.49 µs
 * per call for 'fa-IR' on Node 24 — browsers are kinder but still 10–100×).
 * The Odometer formats ~60×/s and History builds formatters per row, so
 * every formatter is memoized by its full option set. Formatters are
 * immutable; the cache is unbounded because the option space is tiny
 * (2 locales × a handful of digit settings).
 * ------------------------------------------------------------------ */

const numberFormatCache = new Map<string, Intl.NumberFormat>();

function cachedNumberFormat(locale: Locale, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${options.minimumFractionDigits ?? '-'}|${options.maximumFractionDigits ?? '-'}|${options.useGrouping === false ? 'nog' : 'grp'}`;
  let formatter = numberFormatCache.get(key);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatCache.set(key, formatter);
  }
  return formatter;
}

const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

function cachedDateTimeFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${options.year ?? ''}|${options.month ?? ''}|${options.day ?? ''}|${options.hour ?? ''}|${options.minute ?? ''}|${options.second ?? ''}`;
  let formatter = dateTimeFormatCache.get(key);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Locale-aware number with grouping. Defaults mirror the legacy helper
 * `formatNumber(num, decimals = 2)` → { minimumFractionDigits: 0,
 * maximumFractionDigits: 2 } — override per call site as needed. If a caller
 * raises minimumFractionDigits above maximumFractionDigits the maximum is
 * lifted to match (Intl would otherwise throw RangeError).
 */
export function formatNumber(value: number, locale: Locale, opts: NumberFormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new CoreError('invalid_number', `cannot format non-finite number: ${String(value)}`);
  }
  const resolved: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...opts,
  };
  if (
    resolved.minimumFractionDigits !== undefined &&
    resolved.maximumFractionDigits !== undefined &&
    resolved.minimumFractionDigits > resolved.maximumFractionDigits
  ) {
    resolved.maximumFractionDigits = resolved.minimumFractionDigits;
  }
  return cachedNumberFormat(locale, resolved).format(value);
}

/**
 * Format an amount at its currency's precision (minorUnits from
 * currencies.ts — 0 for IRR/JPY/KRW/IDR/VND, else 2). Returns the bare
 * localized number (Persian digits + fa separators for 'fa-IR'); appending
 * code/symbol/flag is UI composition. Unknown codes default to 2 decimals.
 */
export function formatCurrencyAmount(
  value: number,
  code: string,
  locale: Locale,
  opts: NumberFormatOptions = {},
): string {
  const minorUnits = getCurrency(code)?.minorUnits ?? 2;
  return formatNumber(value, locale, { maximumFractionDigits: minorUnits, ...opts });
}

/* ------------------------------------------------------------------ *
 * Date formatting
 * ------------------------------------------------------------------ */

export interface DateFormatOptions {
  /** Append HH:mm:ss (local time). */
  withTime?: boolean;
  /** Append HH:mm (local time, MINUTE precision — no seconds). The
   * Insights header's "prices updated" line pairs this with the en
   * rendering (hour:minute) so both locales carry the same precision:
   * second-level digits on an hourly-refresh series read as false
   * precision (2026-10-16 UI/UX quirk pass). */
  withClock?: boolean;
}

function parseIso(iso: string): Date {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new CoreError('invalid_date', `not a valid ISO datetime: ${iso}`);
  }
  return date;
}

/**
 * Step-1 audit item B2: a DATE-ONLY ISO string ("2026-10-28", no time
 * component) denotes a calendar day, not a UTC-midnight instant —
 * `new Date('2026-10-28')` parses it as UTC midnight and formatting in a
 * timezone behind UTC shifted every printed date one day early (the
 * calendar showed the FOMC decision on 27 Oct and the RBA on 2 Nov).
 * Date-only inputs therefore ALWAYS format in UTC; datetimes with a time
 * component keep their existing local rendering.
 */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(iso: string): boolean {
  return DATE_ONLY_RE.test(iso);
}

/**
 * Gregorian date. NB: plain 'fa-IR' defaults to the PERSIAN calendar in
 * Intl, so the Gregorian rendering must force `-u-ca-gregory` — a raw
 * `Intl.DateTimeFormat('fa-IR')` would silently produce a Jalali date.
 */
export function formatDate(iso: string, locale: Locale, opts: DateFormatOptions = {}): string {
  const resolved = locale === 'fa-IR' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory';
  return cachedDateTimeFormat(resolved, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(opts.withTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {}),
    ...(opts.withClock ? { hour: '2-digit', minute: '2-digit' } : {}),
    ...(isDateOnly(iso) ? { timeZone: 'UTC' } : {}),
  }).format(parseIso(iso));
}

/**
 * Round-2 (Insights R12): unambiguous English dates — "3 Nov 2026"
 * (day, ABBREVIATED month name, year). "11/03/2026" reads as 11 March to
 * Australians but 3 November to the RBA; a month NAME kills the ambiguity.
 * Persian keeps its Jalali rendering via formatJalaliDate.
 */
export function formatDateWords(iso: string, locale: Locale): string {
  const resolved = locale === 'fa-IR' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory';
  return cachedDateTimeFormat(resolved, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(isDateOnly(iso) ? { timeZone: 'UTC' } : {}),
  }).format(parseIso(iso));
}

/**
 * Jalali (Solar Hijri) date via Intl's persian calendar — no jalaali-js
 * dependency. 'fa-IR' → Persian digits + Persian month names;
 * 'en-US' → "06/25/1405 AP" style (checklist #8/#19).
 */
export function formatJalaliDate(iso: string, locale: Locale, opts: DateFormatOptions = {}): string {
  const resolved = locale === 'fa-IR' ? 'fa-IR-u-ca-persian' : 'en-US-u-ca-persian';
  const formatted = cachedDateTimeFormat(resolved, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(opts.withTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {}),
    ...(opts.withClock ? { hour: '2-digit', minute: '2-digit' } : {}),
    ...(isDateOnly(iso) ? { timeZone: 'UTC' } : {}),
  }).format(parseIso(iso));
  // ICU joins a fa-IR persian date and time with a LATIN comma + space
  // ("۱۴۰۵/۰۷/۱۵, ۱۵:۴۶") — Persian typography uses «،» (I6 audit F14).
  // Date-only strings never contain the pattern, so this is a no-op there.
  return locale === 'fa-IR' ? formatted.replace(', ', '، ') : formatted;
}

/* ------------------------------------------------------------------ *
 * Relative time (legacy getTimeAgo parity + fa)
 * ------------------------------------------------------------------ */

/**
 * "X minutes ago"-style rendering, localized (en strings are verbatim
 * legacy; fa strings match apps/web/src/i18n). DETERMINISTIC when `now`
 * is passed — always pass it in tests. Legacy thresholds: <1min →
 * "just now", then minutes/hours/days (no months).
 */
export function formatRelative(iso: string, locale: Locale, now: number | Date = Date.now()): string {
  const then = parseIso(iso).getTime();
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const diffMins = Math.floor((nowMs - then) / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const count = (n: number): string => formatNumber(n, locale, { maximumFractionDigits: 0 });

  if (locale === 'fa-IR') {
    if (diffMins < 1) return 'همین حالا';
    if (diffMins < 60) return `${count(diffMins)} دقیقه پیش`;
    if (diffHours < 24) return `${count(diffHours)} ساعت پیش`;
    return `${count(diffDays)} روز پیش`;
  }

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/* ------------------------------------------------------------------ *
 * Amount input: thousand separators as you type (legacy parity)
 * ------------------------------------------------------------------ */

/**
 * The legacy converter's amount-input behavior: strip existing commas,
 * then group the integer part every 3 digits ("1234567" → "1,234,567"),
 * keeping the decimal portion untouched (".5" stays ".5"). Improvements
 * over the captured code (documented deviations):
 *   - Persian/Arabic digits are normalized first, so pasting "۱۲۳۴۵۶۷"
 *     yields "1,234,567".
 *   - A second '.' collapses into the first one (the legacy batch page did
 *     this; the converter kept "1.2.3" as-is, which could never parse).
 * Non-numeric input is returned unchanged (legacy parity).
 */
export function thousandSeparateInput(value: string): string {
  const raw = normalizeDigits(value).replace(/,/g, '');
  if (raw === '') return '';
  if (!/^[0-9.]*$/.test(raw)) return value;
  const parts = raw.split('.');
  const integerPart = parts[0] ?? '';
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rest = parts.slice(1).join('');
  return rest === '' && raw.includes('.') ? `${grouped}.` : rest === '' ? grouped : `${grouped}.${rest}`;
}
