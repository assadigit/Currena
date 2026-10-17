/**
 * markets-verdict.test.ts — the world-markets section's focal verdict
 * (owner round 44): the pure step mapping + copy parity.
 *
 * marketsVerdictStep is the verdict box's word-decider, computed from the
 * stored numbers like every other verdict on the page:
 *   unusual signal   → 4 (Bearish)
 *   attention signal → 3 (Correcting)
 *   normal signal    → breadth over the NORMAL 3-month window:
 *                       more than half the markets up → 1 (Bullish),
 *                       otherwise → 2 (Mixed)
 *
 * The fa copy module satisfies InsightsCopy at compile time; the tests
 * guard the runtime parity the compiler cannot (matching token sets on
 * every interpolated string, the verdict word keys present in both).
 */

import { describe, expect, it } from 'vitest';
import type { MarketEntry, MarketsSummary } from '@currena/core';
import { marketsVerdictStep, marketsTakeaway } from './WorldMarkets';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';

const entry = (fields: Partial<MarketEntry>): MarketEntry => ({
  id: 'sp500',
  asOf: '2026-10-09',
  close: 5000,
  chg1d: 0.5,
  chg3m: 2,
  high52w: 5200,
  low52w: 4500,
  fromHigh: -3.8,
  rangePos: 71,
  trend: 'up',
  status: 'normal',
  source: 'eodhd',
  stale: false,
  weekly: [[300, 5000]],
  ...fields,
});

const summary = (fields: Partial<MarketsSummary>): MarketsSummary => ({
  count: 16,
  roseToday: 9,
  nAttention: 0,
  nUnusual: 0,
  signal: 'normal',
  worstGroup: null,
  ...fields,
});

const snapshot = (markets: MarketEntry[], fields: Partial<MarketsSummary> = {}) => ({
  markets,
  summary: summary({ count: markets.length, ...fields }),
});

/** n markets split up/down by chg3m (the rest exactly flat — never "up"). */
function breadth(total: number, up: number): MarketEntry[] {
  return Array.from({ length: total }, (_, i) =>
    entry({ id: (i === 0 ? 'sp500' : `m${i}`) as MarketEntry['id'], chg3m: i < up ? 1 : i < total ? -1 : 0 }),
  );
}

describe('marketsVerdictStep — the focal verdict word', () => {
  it('normal signal + majority up over 3 months → 1 (Bullish)', () => {
    expect(marketsVerdictStep(snapshot(breadth(16, 9), { signal: 'normal' }))).toBe(1);
    expect(marketsVerdictStep(snapshot(breadth(16, 16), { signal: 'normal' }))).toBe(1);
  });

  it('normal signal without a majority → 2 (Mixed); exactly half is not a majority', () => {
    expect(marketsVerdictStep(snapshot(breadth(16, 8), { signal: 'normal' }))).toBe(2);
    expect(marketsVerdictStep(snapshot(breadth(16, 3), { signal: 'normal' }))).toBe(2);
    // A flat chg3m never counts as up.
    expect(marketsVerdictStep(snapshot(breadth(16, 9).map((m, i) => (i === 8 ? { ...m, chg3m: 0 } : m)), { signal: 'normal' }))).toBe(2);
  });

  it('attention signal → 3 (Correcting) even when 3-month breadth is positive', () => {
    expect(marketsVerdictStep(snapshot(breadth(16, 12), { signal: 'attention', nAttention: 4 }))).toBe(3);
  });

  it('unusual signal → 4 (Bearish)', () => {
    expect(marketsVerdictStep(snapshot(breadth(16, 12), { signal: 'unusual', nAttention: 6, nUnusual: 2 }))).toBe(4);
  });

  it('an empty snapshot never crashes — Mixed is the honest default', () => {
    expect(marketsVerdictStep(snapshot([], { count: 0, roseToday: 0 }))).toBe(2);
  });
});

describe('markets copy parity (en/fa)', () => {
  const verdictKeys = ['verdictBullish', 'verdictMixed', 'verdictCorrecting', 'verdictBearish'] as const;

  it('the four verdict words + the aria template exist in both locales', () => {
    for (const key of verdictKeys) {
      expect(insightsCopyEn.markets[key].length).toBeGreaterThan(0);
      expect(insightsCopyFa.markets[key].length).toBeGreaterThan(0);
    }
    expect(insightsCopyEn.markets.verdictAria).toContain('{label}');
    expect(insightsCopyFa.markets.verdictAria).toContain('{label}');
  });

  it('the takeaway templates carry the same tokens in both locales', () => {
    const tokens = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]! as string).sort();
    for (const key of ['takeawayCalm', 'takeawaySome', 'takeawayHeavy'] as const) {
      expect(tokens(insightsCopyFa.markets[key])).toEqual(tokens(insightsCopyEn.markets[key]));
    }
    expect(insightsCopyEn.markets.takeawayCalm).toContain('{count}');
    expect(insightsCopyFa.markets.takeawayCalm).toContain('{count}');
  });

  it('the 3-month lens replaced the 1-month lens everywhere (views, table, CSV)', () => {
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      expect(copy.markets.view3m.length).toBeGreaterThan(0);
      expect(copy.markets.th3m.length).toBeGreaterThan(0);
      expect(copy.markets.csvCol3m.length).toBeGreaterThan(0);
    }
  });

  it('round 46: the weekly and monthly lens labels exist everywhere (views, table, CSV)', () => {
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      for (const key of ['viewWeek', 'viewMonth', 'thWeek', 'thMonth', 'csvColWeek', 'csvColMonth'] as const) {
        expect(copy.markets[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('the relocated source line lives in the About footer, not the section', () => {
    expect('footer' in insightsCopyEn.markets).toBe(false);
    expect('footer' in insightsCopyFa.markets).toBe(false);
    // The owner-quoted Persian line, verbatim, in the footer's attribution list.
    expect(insightsCopyFa.ui.attributionEodhd).toBe(
      'منبع: EODHD با پشتیبانی Yahoo Finance. ارقام بازارها، قیمت پایانی روز و بر اساس ارز محلی هر بازار هستند.',
    );
    expect(insightsCopyEn.ui.attributionEodhd).toBe(
      'Source: EODHD (Yahoo Finance as backup). End-of-day values in each market’s local currency.',
    );
  });

  it('the 16 markets each have context copy in both locales', () => {
    const ids = [
      'n225', 'asx200', 'kospi', 'hsi', 'ssec', 'taiex', 'nifty50',
      'stoxx50', 'dax', 'cac', 'ftse', 'sp500', 'ndx', 'dow', 'tsx', 'ibov',
    ] as const;
    for (const id of ids) {
      expect(insightsCopyEn.markets.entries[id].name.length).toBeGreaterThan(0);
      expect(insightsCopyFa.markets.entries[id].name.length).toBeGreaterThan(0);
      expect(insightsCopyFa.markets.entries[id].latin.length).toBeGreaterThan(0);
    }
  });
});

describe('marketsTakeaway — the verdict reason line', () => {
  it('calm line counts the live row total, not a hardcoded 14', () => {
    const line = marketsTakeaway(snapshot(breadth(16, 9), { roseToday: 11 }), insightsCopyEn, 'en-US');
    expect(line).toContain('11 of 16 markets rose today');
  });

  it('attention line carries n, count and the worst group', () => {
    const line = marketsTakeaway(
      snapshot(breadth(16, 9), { signal: 'attention', nAttention: 5, worstGroup: 'asia' }),
      insightsCopyEn,
      'en-US',
    );
    expect(line).toContain('5 of 16 markets');
    expect(line).toContain('Asia-Pacific');
  });

  it('fa renders with Persian digits and the live count', () => {
    const line = marketsTakeaway(snapshot(breadth(16, 9), { roseToday: 11 }), insightsCopyFa, 'fa-IR');
    expect(line).toContain('۱۶');
    expect(line).not.toContain('14');
  });
});
