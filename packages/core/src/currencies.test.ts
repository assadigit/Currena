import { describe, expect, it } from 'vitest';

import { CURRENCIES, getCurrency, isCurrencyCode, tgjuProfileUrl } from './currencies';

const EXPECTED_CODES = [
  'USD', 'IRR', 'EUR', 'GBP', 'AUD', 'CAD', 'AED', 'CNY', 'NZD', 'TRY',
  'CHF', 'JPY', 'KRW', 'MYR', 'IDR', 'PHP', 'VND',
] as const;

const EXPECTED_TGJU_PROFILES: Record<string, string> = {
  USD: 'price_dollar_rl',
  EUR: 'price_eur',
  GBP: 'price_gbp',
  AUD: 'price_aud',
  CAD: 'price_cad',
  TRY: 'price_try',
  AED: 'price_aed',
  CNY: 'price_cny',
  CHF: 'price_chf',
  JPY: 'price_jpy',
  KRW: 'price_krw',
  MYR: 'price_myr',
  IDR: 'price_idr',
  PHP: 'price_php',
  VND: 'price_vnd',
  NZD: 'price_nzd',
};

describe('CURRENCIES (FEATURE_MAP §5 — 17 legacy currencies, 16 TGJU profiles)', () => {
  it('has exactly the 17 legacy codes, no duplicates', () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(codes).toHaveLength(17);
    expect(new Set(codes).size).toBe(17);
    expect(codes).toEqual(expect.arrayContaining([...EXPECTED_CODES]));
  });

  it('carries the exact 16 TGJU profile slugs from the legacy currencyUrls map', () => {
    for (const [code, slug] of Object.entries(EXPECTED_TGJU_PROFILES)) {
      expect(getCurrency(code)?.tgjuProfile).toBe(slug);
    }
    expect(CURRENCIES.filter((c) => c.tgjuProfile !== undefined)).toHaveLength(16);
    expect(getCurrency('IRR')?.tgjuProfile).toBeUndefined(); // IRR is the base, no profile
  });

  it('uses international common names (Gate 1 decision #4): AED = UAE Dirham, IRR = Iranian Rial', () => {
    expect(getCurrency('AED')?.name).toBe('UAE Dirham');
    expect(getCurrency('IRR')?.name).toBe('Iranian Rial');
    expect(getCurrency('USD')?.name).toBe('US Dollar');
    expect(getCurrency('EUR')?.name).toBe('Euro');
  });

  it('uses 0 minor units for IRR/JPY/KRW/IDR/VND and 2 for the rest', () => {
    const zeroDecimal = ['IRR', 'JPY', 'KRW', 'IDR', 'VND'];
    for (const c of CURRENCIES) {
      expect(c.minorUnits).toBe(zeroDecimal.includes(c.code) ? 0 : 2);
    }
  });

  it('exposes absolute TGJU profile URLs', () => {
    expect(tgjuProfileUrl('USD')).toBe('https://www.tgju.org/profile/price_dollar_rl');
    expect(tgjuProfileUrl('NZD')).toBe('https://www.tgju.org/profile/price_nzd');
    expect(tgjuProfileUrl('IRR')).toBeUndefined();
    expect(tgjuProfileUrl('XXX')).toBeUndefined();
  });
});

describe('helpers', () => {
  it('isCurrencyCode is a case-sensitive membership check', () => {
    expect(isCurrencyCode('USD')).toBe(true);
    expect(isCurrencyCode('IRR')).toBe(true);
    expect(isCurrencyCode('usd')).toBe(false);
    expect(isCurrencyCode('XXX')).toBe(false);
    expect(isCurrencyCode('US')).toBe(false);
    expect(isCurrencyCode('')).toBe(false);
  });

  it('getCurrency returns undefined for unknown codes and narrows known ones', () => {
    expect(getCurrency('TRY')?.symbol).toBe('₺');
    expect(getCurrency('GBP')?.minorUnits).toBe(2);
    expect(getCurrency('ZZZ')).toBeUndefined();
  });
});
