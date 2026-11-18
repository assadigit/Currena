/**
 * coin-premium.test.ts — GPE R13 / F3a: the Iran bridge's premium engine
 * tests. The FROZEN SCENARIO is the live observation of 2026-11-18
 * ~16:55 UTC (call1.tgju.org/ajax.json, verified in-session — the s12
 * M1 record §5): the arithmetic a reader can reproduce from the card's
 * own parity line (C2 rule 2's standard). Also pins: the fail-closed
 * legs, the constants table's shape (the gerami band, the آبشده
 * convention), and the monotone-ladder property on the frozen scenario
 * (the s8/02 §2b discipline: full < half < quarter ≈ gerami).
 */

import { describe, expect, it } from 'vitest';
import type { GoldQuote } from '@currena/core';
import { COIN_SPECS, GERAMI_BAND, TROY_OZ_GRAMS, coinPremium, type BridgeCoinId } from './coin-premium';

/** The 2026-11-18 live snapshot (Rial ÷10 = toman, as the scraper serves). */
const LIVE_2026_11_18: readonly GoldQuote[] = [
  { id: 'gold-ounce', unit: 'USD', price: 3744.68 },
  { id: 'gold-18k', unit: 'TOMAN', price: 24_459_600 },
  { id: 'gold-24k', unit: 'TOMAN', price: 32_612_400 },
  { id: 'gold-used', unit: 'TOMAN', price: 24_133_439 },
  { id: 'coin-emami', unit: 'TOMAN', price: 250_740_000 },
  { id: 'coin-bahar', unit: 'TOMAN', price: 240_745_000 },
  { id: 'coin-half', unit: 'TOMAN', price: 132_260_000 },
  { id: 'coin-quarter', unit: 'TOMAN', price: 70_920_000 },
  { id: 'coin-gram', unit: 'TOMAN', price: 36_000_000 },
  { id: 'gold-mesghal', unit: 'TOMAN', price: 105_954_000 },
];
const LIVE_DOLLAR_TOMAN = 266_330; // price_dollar_rl 2,663,300 Rial ÷ 10

function quote(id: BridgeCoinId, price: number): GoldQuote {
  return { id, unit: 'TOMAN', price };
}

describe('COIN_SPECS (the constants table, CBI-primary)', () => {
  it('carries the eight bridge instruments in board order', () => {
    expect(COIN_SPECS.map((s) => s.id)).toEqual([
      'coin-emami',
      'coin-bahar',
      'coin-half',
      'coin-quarter',
      'coin-gram',
      'gold-18k',
      'gold-24k',
      'gold-mesghal',
    ]);
  });

  it('the Bahar family: CBI 8.136 g × 0.900; halves derive by weight', () => {
    const emami = COIN_SPECS.find((s) => s.id === 'coin-emami')!;
    expect(emami.totalGrams).toBeCloseTo(8.136, 10);
    expect(emami.fineness).toBe(0.9);
    expect(emami.pureGrams).toBeCloseTo(7.3224, 10);
    const half = COIN_SPECS.find((s) => s.id === 'coin-half')!;
    expect(half.pureGrams).toBeCloseTo(emami.pureGrams / 2, 10);
    const quarter = COIN_SPECS.find((s) => s.id === 'coin-quarter')!;
    expect(quarter.pureGrams).toBeCloseTo(emami.pureGrams / 4, 10);
  });

  it('the gerami band of record: 0.90–0.92 g pure, midpoint computes', () => {
    const gerami = COIN_SPECS.find((s) => s.id === 'coin-gram')!;
    expect(GERAMI_BAND).toEqual({ low: 0.9, high: 0.92 });
    expect(gerami.band).toEqual(GERAMI_BAND);
    expect(gerami.pureGrams).toBe(0.91); // the midpoint — both candidate readings inside
    expect(0.909).toBeGreaterThanOrEqual(GERAMI_BAND.low);
    expect(0.9134).toBeLessThanOrEqual(GERAMI_BAND.high);
  });

  it('the mesghal آبشده convention: 4.6083 g × 0.705 = 3.249 g pure', () => {
    const mesghal = COIN_SPECS.find((s) => s.id === 'gold-mesghal')!;
    expect(mesghal.totalGrams).toBeCloseTo(4.6083, 10);
    expect(mesghal.fineness).toBeCloseTo(0.705, 10);
    expect(mesghal.pureGrams).toBeCloseTo(3.2488, 3);
  });
});

describe('coinPremium (the C2 computation)', () => {
  it('FROZEN 2026-11-18 live scenario: the parity line + the premiums a reader reproduces', () => {
    const result = coinPremium(LIVE_2026_11_18, LIVE_DOLLAR_TOMAN);
    // The named intermediate (C1): 3,744.68 USD × 266,330 toman.
    expect(result.ounceUsd).toBe(3744.68);
    expect(result.dollarToman).toBe(266_330);
    expect(result.tomanPerOunce).toBeCloseTo(997_320_624.4, -3);
    // Emami: intrinsic = 997.32M × 7.3224 ÷ 31.1034768 ≈ 234.79M; market 250.74M.
    const emami = result.rows.find((r) => r.id === 'coin-emami')!;
    expect(emami.intrinsicToman).toBeCloseTo(234_789_846, -4);
    expect(emami.premiumToman).toBeCloseTo(15_950_154, -4);
    expect(emami.premiumPct).toBeCloseTo(6.79, 1);
    // The gerami on the band midpoint: premium ≈ +23.5% (the ladder's top).
    const gerami = result.rows.find((r) => r.id === 'coin-gram')!;
    expect(gerami.premiumPct).toBeCloseTo(23.5, 0);
    // The mesghal آبشده row: ≈ +1.7% (the melt-market premium, like geram18/24).
    const mesghal = result.rows.find((r) => r.id === 'gold-mesghal')!;
    expect(mesghal.premiumPct).toBeCloseTo(1.7, 0);
    const g18 = result.rows.find((r) => r.id === 'gold-18k')!;
    const g24 = result.rows.find((r) => r.id === 'gold-24k')!;
    expect(g18.premiumPct).toBeCloseTo(1.7, 0);
    expect(g24.premiumPct).toBeCloseTo(1.7, 0);
  });

  it('the premium ladder is monotone on the frozen scenario (s8/02 §2b)', () => {
    const result = coinPremium(LIVE_2026_11_18, LIVE_DOLLAR_TOMAN);
    const pct = (id: BridgeCoinId) => result.rows.find((r) => r.id === id)!.premiumPct;
    expect(pct('coin-bahar')).toBeLessThan(pct('coin-emami'));
    expect(pct('coin-emami')).toBeLessThan(pct('coin-half'));
    expect(pct('coin-half')).toBeLessThan(pct('coin-quarter'));
    expect(pct('coin-quarter')).toBeLessThan(pct('coin-gram'));
  });

  it('fail-closed: no ounce → no parity, no rows (the quotes still arrive)', () => {
    const withoutOunce = LIVE_2026_11_18.filter((q) => q.id !== 'gold-ounce');
    const result = coinPremium(withoutOunce, LIVE_DOLLAR_TOMAN);
    expect(result.ounceUsd).toBeNull();
    expect(result.tomanPerOunce).toBeNull();
    expect(result.rows).toEqual([]);
  });

  it('fail-closed: no free-dollar leg → no parity, no rows', () => {
    const result = coinPremium(LIVE_2026_11_18, null);
    expect(result.dollarToman).toBeNull();
    expect(result.tomanPerOunce).toBeNull();
    expect(result.rows).toEqual([]);
  });

  it('a missing instrument quote omits only its row (per-item degradation)', () => {
    const partial = LIVE_2026_11_18.filter((q) => q.id !== 'coin-gram' && q.id !== 'gold-mesghal');
    const result = coinPremium(partial, LIVE_DOLLAR_TOMAN);
    expect(result.rows.map((r) => r.id)).toEqual([
      'coin-emami',
      'coin-bahar',
      'coin-half',
      'coin-quarter',
      'gold-18k',
      'gold-24k',
    ]);
  });

  it('the identity is reproducible per row: intrinsic = tomanPerOunce × pureGrams ÷ TROY_OZ_GRAMS', () => {
    const result = coinPremium(LIVE_2026_11_18, LIVE_DOLLAR_TOMAN);
    for (const row of result.rows) {
      const spec = COIN_SPECS.find((s) => s.id === row.id)!;
      expect(row.intrinsicToman).toBeCloseTo((result.tomanPerOunce! * spec.pureGrams) / TROY_OZ_GRAMS, 6);
      expect(row.premiumToman).toBeCloseTo(row.marketToman - row.intrinsicToman, 6);
      expect(row.premiumPct).toBeCloseTo((row.premiumToman / row.intrinsicToman) * 100, 6);
    }
  });

  it('a negative premium renders as a discount (the arithmetic never clamps)', () => {
    const belowMelt: readonly GoldQuote[] = [
      { id: 'gold-ounce', unit: 'USD', price: 3744.68 },
      quote('coin-emami', 200_000_000),
    ];
    const result = coinPremium(belowMelt, LIVE_DOLLAR_TOMAN);
    const emami = result.rows.find((r) => r.id === 'coin-emami')!;
    expect(emami.premiumToman).toBeLessThan(0);
    expect(emami.premiumPct).toBeLessThan(0);
  });

  it('an empty snapshot fail-closes to the empty result', () => {
    const result = coinPremium([], LIVE_DOLLAR_TOMAN);
    expect(result.ounceUsd).toBeNull();
    expect(result.tomanPerOunce).toBeNull();
    expect(result.rows).toEqual([]);
  });
});
