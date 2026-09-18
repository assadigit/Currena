import { describe, expect, it } from 'vitest';

import type { Snapshot } from './schemas';
import {
  COMPUTE_SIGNIFICANT_DIGITS,
  convert,
  convertWithManualRate,
  getRate,
  reverseRate,
  roundSignificant,
} from './math';
import { CoreError } from './errors';

/**
 * TGJU-style snapshot, base USD (matches the live legacy observation
 * 2026-09-16: 1 USD = 230,500 Toman, i.e. rate(IRR) = 230500 with unit TOMAN).
 */
const snapshot: Snapshot = {
  base: 'USD',
  source: 'tgju',
  fetchedAt: '2026-09-16T17:26:10.906Z',
  rates: [
    { code: 'USD', name: 'US Dollar', rate: 1 },
    { code: 'IRR', name: 'Iranian Rial', rate: 230500, unit: 'TOMAN' },
    { code: 'EUR', name: 'Euro', rate: 0.92 },
    { code: 'TRY', name: 'Turkish Lira', rate: 42.85 },
  ],
};

describe('roundSignificant (precision strategy)', () => {
  it('suppresses IEEE-754 noise without losing real precision', () => {
    expect(roundSignificant(0.1 + 0.2)).toBe(0.3);
    expect(roundSignificant(100 * (1 / 230500) * 230500)).toBe(100);
    expect(roundSignificant(230500)).toBe(230500);
    expect(roundSignificant(230500.123456789012345)).toBe(230500.123457); // 12 sig digits
  });

  it('passes through zero and non-finite values untouched', () => {
    expect(roundSignificant(0)).toBe(0);
    expect(roundSignificant(Number.NaN)).toBeNaN();
    expect(roundSignificant(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
  });

  it('handles values needing integer-side rounding', () => {
    // 12 significant digits of 1234567890123.456 → 1234567890120
    expect(roundSignificant(1234567890123.456)).toBe(1234567890120);
    expect(COMPUTE_SIGNIFICANT_DIGITS).toBe(12);
  });

  it('rejects non-positive sigDigits', () => {
    expect(() => roundSignificant(1.23, 0)).toThrow(CoreError);
  });
});

describe('getRate', () => {
  it('finds a rate by code', () => {
    expect(getRate(snapshot, 'IRR')).toEqual({
      code: 'IRR',
      name: 'Iranian Rial',
      rate: 230500,
      unit: 'TOMAN',
    });
  });

  it('throws a typed rate_not_found error for an absent code', () => {
    try {
      getRate(snapshot, 'GBP');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(CoreError);
      expect((error as CoreError).code).toBe('rate_not_found');
    }
  });
});

describe('convert', () => {
  it('reproduces the live legacy conversion: 100 USD → 23,050,000 IRR (Toman) at rate 230,500', () => {
    const result = convert(snapshot, 'USD', 'IRR', 100);
    expect(result.amount).toBe(23050000);
    expect(result.rate).toBe(230500);
    expect(result.source).toBe('tgju');
    expect(result.fetchedAt).toBe('2026-09-16T17:26:10.906Z');
  });

  it('converts the reverse direction (IRR → USD)', () => {
    const result = convert(snapshot, 'IRR', 'USD', 230500);
    expect(result.amount).toBe(1);
    expect(result.rate).toBeCloseTo(1 / 230500, 12);
    expect(result.source).toBe('tgju');
  });

  it('converts international pairs cross-base (EUR → TRY)', () => {
    const result = convert(snapshot, 'EUR', 'TRY', 100);
    expect(result.rate).toBeCloseTo(42.85 / 0.92, 10);
    expect(result.amount).toBeCloseTo((100 * 42.85) / 0.92, 8);
  });

  it('is coherent with the base when converting from the base currency', () => {
    const result = convert(snapshot, 'USD', 'EUR', 250);
    expect(result.amount).toBe(230); // 250 × 0.92
    expect(result.rate).toBe(0.92);
  });

  it("same-currency short-circuits locally: rate 1, source 'local', no rate lookup needed (Gate 1 decision #5)", () => {
    // Snapshot deliberately has NO EUR-only duplicate trick: use a code absent
    // from the snapshot to prove no lookup happens on the short-circuit path.
    const result = convert(snapshot, 'XYZ', 'XYZ', 41.5);
    expect(result).toEqual({
      amount: 41.5,
      rate: 1,
      source: 'local',
      fetchedAt: '2026-09-16T17:26:10.906Z',
    });
  });

  it('propagates a typed rate_not_found error when a side is missing from the snapshot', () => {
    expect(() => convert(snapshot, 'USD', 'GBP', 10)).toThrowError(CoreError);
    expect(() => convert(snapshot, 'GBP', 'USD', 10)).toThrow(CoreError);
  });

  it('rejects non-finite amounts with a typed error', () => {
    expect(() => convert(snapshot, 'USD', 'EUR', Number.NaN)).toThrow(CoreError);
    expect(() => convert(snapshot, 'USD', 'EUR', Number.POSITIVE_INFINITY)).toThrow(CoreError);
  });

  it('rounds cross-rate noise to 12 significant digits', () => {
    const result = convert(snapshot, 'IRR', 'EUR', 123456);
    // 123456 × (0.92 / 230500) = 0.4927956… — raw float has trailing noise
    expect(String(result.amount)).not.toMatch(/\d{15,}/);
    expect(result.amount).toBeCloseTo(123456 * (0.92 / 230500), 9);
  });
});

describe('reverseRate', () => {
  it('returns 1/rate', () => {
    expect(reverseRate(4)).toBe(0.25);
    expect(reverseRate(0.5)).toBe(2);
    expect(reverseRate(230500)).toBeCloseTo(1 / 230500, 12);
  });

  it('rejects zero, negative and non-finite rates with typed errors', () => {
    expect(() => reverseRate(0)).toThrow(CoreError);
    expect(() => reverseRate(-2)).toThrow(CoreError);
    expect(() => reverseRate(Number.NaN)).toThrow(CoreError);
  });
});

describe('convertWithManualRate (legacy "Manual" source parity)', () => {
  it('multiplies by the custom rate and reports source manual', () => {
    expect(convertWithManualRate(100, 230500)).toEqual({
      amount: 23050000,
      rate: 230500,
      source: 'manual',
    });
    expect(convertWithManualRate(0.1, 3)).toEqual({ amount: 0.3, rate: 3, source: 'manual' });
  });

  it('rejects invalid rates and amounts with typed errors', () => {
    expect(() => convertWithManualRate(100, 0)).toThrow(CoreError);
    expect(() => convertWithManualRate(100, -1)).toThrow(CoreError);
    expect(() => convertWithManualRate(Number.NaN, 2)).toThrow(CoreError);
  });
});

describe('roundSignificant — symmetric tie rounding (regression: negative ties rounded toward +∞)', () => {
  it('rounds .5 ties AWAY FROM ZERO for both signs at ≥1e12 magnitudes', () => {
    // 15000000000150 at 12 sig digits: tie at the 10s place.
    expect(roundSignificant(15_000_000_000_150, 12)).toBe(15_000_000_000_200);
    // The pre-fix negative branch rounded this to ...100 (toward +∞) while
    // the positive branch rounded to ...200 — same magnitude, opposite
    // directions, a full factor unit apart.
    expect(roundSignificant(-15_000_000_000_150, 12)).toBe(-15_000_000_000_200);
  });

  it('non-tie values are unaffected', () => {
    expect(roundSignificant(-15_000_000_000_160, 12)).toBe(-15_000_000_000_200);
    expect(roundSignificant(-15_000_000_000_140, 12)).toBe(-15_000_000_000_100);
    expect(roundSignificant(-123_456_789_012_345, 12)).toBe(-123_456_789_012_000);
  });
});
