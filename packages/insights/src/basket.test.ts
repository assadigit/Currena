import { describe, expect, it } from 'vitest';

import { BASKET_CURRENCIES, BASKET_SCALING_CONSTANT, BASKET_WEIGHTS, computeBasketValue } from './basket';

/**
 * The python script's own selftest, transplanted (dollar_basket.py §run_selftest)
 * — the TS port must reproduce every invariant.
 */
describe('Currena dollar basket (dollar_basket.py recipe)', () => {
  it('flat 1:1 rates return the scaling constant exactly', () => {
    const flat: Record<string, number> = {};
    for (const c of BASKET_CURRENCIES) flat[c] = 1.0;
    expect(Math.abs(computeBasketValue(flat) - BASKET_SCALING_CONSTANT)).toBeLessThan(1e-9);
  });

  it('a stronger dollar (more yen per dollar) raises the index', () => {
    const base: Record<string, number> = { EUR: 0.86, JPY: 150.0, GBP: 0.75, CAD: 1.38, SEK: 9.4, CHF: 0.8 };
    const stronger = { ...base, JPY: 160.0 };
    expect(computeBasketValue(stronger)).toBeGreaterThan(computeBasketValue(base));
  });

  it('a weaker dollar (fewer euros per dollar) lowers the index', () => {
    const base: Record<string, number> = { EUR: 0.86, JPY: 150.0, GBP: 0.75, CAD: 1.38, SEK: 9.4, CHF: 0.8 };
    const weaker = { ...base, EUR: 0.8 };
    expect(computeBasketValue(weaker)).toBeLessThan(computeBasketValue(base));
  });

  it('the weights add up to 1 (DXY recipe invariant)', () => {
    const sum = Object.values(BASKET_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(1e-9);
  });

  it('a realistic 2026 rate set lands in the plausible DXY band', () => {
    const realistic = computeBasketValue({
      EUR: 0.86,
      JPY: 158.23,
      GBP: 0.75,
      CAD: 1.38,
      SEK: 9.4,
      CHF: 0.8,
    });
    expect(realistic).toBeGreaterThanOrEqual(90);
    expect(realistic).toBeLessThanOrEqual(110);
  });

  it('missing or non-positive rates throw loudly (never a silently wrong index)', () => {
    const base: Record<string, number> = { EUR: 0.86, JPY: 150.0, GBP: 0.75, CAD: 1.38, SEK: 9.4, CHF: 0.8 };
    expect(() => computeBasketValue({ ...base, JPY: undefined as unknown as number })).toThrow();
    expect(() => computeBasketValue({ ...base, JPY: 0 })).toThrow();
    expect(() => computeBasketValue({ ...base, JPY: -1 })).toThrow();
    expect(() => computeBasketValue({ ...base, JPY: Number.NaN })).toThrow();
  });

  it('the scaling constant matches the DXY 1973 base (50.14348112)', () => {
    expect(BASKET_SCALING_CONSTANT).toBe(50.14348112);
    expect(BASKET_WEIGHTS.EUR).toBe(0.576);
    expect(BASKET_WEIGHTS.JPY).toBe(0.136);
    expect(BASKET_WEIGHTS.GBP).toBe(0.119);
    expect(BASKET_WEIGHTS.CAD).toBe(0.091);
    expect(BASKET_WEIGHTS.SEK).toBe(0.042);
    expect(BASKET_WEIGHTS.CHF).toBe(0.036);
  });
});
