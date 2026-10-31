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

  it('the quarterly lens exists everywhere (views, table, CSV)', () => {
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      expect(copy.markets.viewQuarterly.length).toBeGreaterThan(0);
      expect(copy.markets.th3m.length).toBeGreaterThan(0);
      expect(copy.markets.csvCol3m.length).toBeGreaterThan(0);
    }
  });

  it('round 46: the weekly and monthly lens labels exist everywhere (table, CSV)', () => {
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      for (const key of ['thWeek', 'thMonth', 'csvColWeek', 'csvColMonth'] as const) {
        expect(copy.markets[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('round 47: the yearly lens labels exist everywhere (table, CSV)', () => {
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      for (const key of ['thYear', 'csvColYear'] as const) {
        expect(copy.markets[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('the 2026-10-21 unification: the section speaks the MAP\'s four switch lenses; the old five-option radiogroup keys retire', () => {
    for (const copy of [insightsCopyEn, insightsCopyFa]) {
      // The map\'s own period keys drive every surface now (periodWord reads
      // them; the map\'s switch renders them).
      for (const key of ['periodToday', 'periodWeek', 'periodMonth', 'periodYear'] as const) {
        expect(copy.markets.map[key].length).toBeGreaterThan(0);
      }
      // viewQuarterly stays as the typed '3m' fallback word ONLY.
      expect(copy.markets.viewQuarterly.length).toBeGreaterThan(0);
      // The retired switch\'s keys are GONE (en is the shape source of truth).
      for (const gone of ['viewDaily', 'viewWeekly', 'viewMonthly', 'viewYearly', 'viewSwitchAria'] as const) {
        expect(gone in copy.markets).toBe(false);
      }
      // YTD still does not exist in the contract and must never be offered
      // (no year-start date; see briefing.ts).
      expect('viewYtd' in copy.markets).toBe(false);
      // The 52-week-high distance is secondary context, NOT a period lens.
      expect('viewFromHigh' in copy.markets).toBe(false);
      // The 52-week distance still lives where it belongs: the table column.
      expect(copy.markets.thFromHigh.length).toBeGreaterThan(0);
    }
  });

  it('the world-indices round: the editorial header, breadth, movers and view-switch copy exist in both locales', () => {
    const keys = [
      'title', 'sectionLabel', 'subtitle', 'lastCloseBadge',
      'breadthPeriod', 'breadthUp', 'breadthDown', 'breadthFlat', 'coverageNote', 'belowHighLine',
      'moverGain', 'moverLoss', 'moverPeriodLabel', 'moversNone',
      'displaySwitchAria', 'viewList', 'viewHeatmap', 'heatmapLegendLabel', 'heatmapValueAria', 'noReadingAria',
    ] as const;
    for (const key of keys) {
      expect(insightsCopyEn.markets[key].length).toBeGreaterThan(0);
      expect(insightsCopyFa.markets[key].length).toBeGreaterThan(0);
    }
    // Token parity on the interpolated strings.
    const tokens = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]! as string).sort();
    for (const key of ['breadthPeriod', 'coverageNote', 'belowHighLine', 'moverPeriodLabel', 'heatmapValueAria'] as const) {
      expect(tokens(insightsCopyFa.markets[key])).toEqual(tokens(insightsCopyEn.markets[key]));
    }
    // The owner-directed editorial title, verbatim.
    expect(insightsCopyFa.markets.title).toBe('نبض بازارهای جهان');
    expect(insightsCopyFa.markets.sectionLabel).toBe('شاخص‌های بورسی جهان');
  });

  it('the world-indices round: every index entry names its country/market in both locales', () => {
    const ids = [
      'n225', 'asx200', 'kospi', 'hsi', 'ssec', 'taiex', 'nifty50',
      'stoxx50', 'dax', 'cac', 'ftse', 'sp500', 'ndx', 'dow', 'tsx', 'ibov',
    ] as const;
    for (const id of ids) {
      expect(insightsCopyEn.markets.entries[id].country.length).toBeGreaterThan(0);
      expect(insightsCopyFa.markets.entries[id].country.length).toBeGreaterThan(0);
    }
    // EURO STOXX 50 is a eurozone index — its market label says so (the
    // ASSET-MAP distinction, preserved).
    expect(insightsCopyEn.markets.entries.stoxx50.country).toBe('Eurozone');
    expect(insightsCopyFa.markets.entries.stoxx50.country).toBe('منطقهٔ یورو');
    // Hong Kong is a market label, not a country — it stays visible as such.
    expect(insightsCopyEn.markets.entries.hsi.country).toBe('Hong Kong');
    expect(insightsCopyFa.markets.entries.hsi.country).toBe('هنگ‌کنگ');
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
    // S1-M1.6 #2: the up-count now derives from the rows' own banded
    // chg1d (> +1% counts as up) — 11 of the 16 rows carry a >1% day.
    const rows = breadth(16, 9).map((m, i) => ({ ...m, chg1d: i < 11 ? 1.2 : -0.4 }));
    const line = marketsTakeaway(snapshot(rows, { roseToday: 11 }), insightsCopyEn, 'en-US');
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

/* ------------------------------------------------------------------ *
 * Gap-closure S1-M1.6 #2 (2026-10-31 audit): the markets summary counts.
 * One shared computed value for every sentence and the stat box; the
 * up/down/flat vocabulary reads the ±1% band everywhere it is spoken.
 * ------------------------------------------------------------------ */

describe('S1-M1.6 #2 — the correction count and the up-count speak one rule', () => {
  it('marketsInCorrectionCount reads the RAW ≥10% rule — a buffered status never pads the sentence', async () => {
    const { marketsInCorrectionCount } = await import('./world-markets/MarketsVerdict');
    const markets = [
      entry({ id: 'sp500', fromHigh: -12.5, status: 'correction' }), // counts (raw ≥10%)
      entry({ id: 'ndx', fromHigh: -22, status: 'bear' }), // counts (bear IS ≥10% below)
      entry({ id: 'taiex', fromHigh: -9.2, status: 'correction' }), // buffered tag, raw −9.2% — NOT counted
      entry({ id: 'dax', fromHigh: -4, status: 'normal' }),
    ];
    // The audit's case: the sentence said 7 while six cards showed ≥10%.
    expect(marketsInCorrectionCount(markets)).toBe(2);
    // And the below-high line (the same rule) agrees by construction.
    const { belowHighCount } = await import('./world-markets/briefing');
    expect(belowHighCount(markets)).toBe(2);
  });

  it('the takeaway up-count is the ±1% BANDED today breadth, never the raw any-positive count', () => {
    const markets = [
      entry({ id: 'sp500', chg1d: 1.4 }), // up (> +1%)
      entry({ id: 'ndx', chg1d: 0.3 }), // flat (inside the band) — the old count said "rose"
      entry({ id: 'dax', chg1d: -0.2 }), // flat
      entry({ id: 'cac', chg1d: -1.5 }), // down
    ];
    const line = marketsTakeaway({ markets, summary: summary({ roseToday: 3, signal: 'normal' }) }, insightsCopyEn, 'en-US');
    // The banded up count is 1 — the box beside the sentence says 1 up · 1 down · 2 flat.
    expect(line).toContain('1');
    expect(line).not.toMatch(/\b3\b.*rose/);
  });
});
