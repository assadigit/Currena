/**
 * briefing.test.ts — the pure decision layer of the editorial market
 * briefing (the 2026-10-18 world-indices handoff round, 02-ui-spec §3.2–
 * §3.6, §8, and 03-agent-rules §F's required test list):
 *
 *   - period selection / value consistency across the surfaces
 *   - top-gainer/top-loser behavior on positive / negative / mixed /
 *     partial / missing data
 *   - the 52-week-high threshold count from RAW values, including the
 *     rounding boundary (−9.96% displays as −10% but is NOT counted)
 *   - period-label semantics: exactly the five lenses the stored contract
 *     carries (round 47 added the yearly chg1y lens), no YTD lens, the
 *     52-week distance not offered as a period
 *   - the heatmap's dynamic scale and tone buckets
 *
 * Fixture-backed only — no live site, no provider (AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';
import type { MarketEntry } from '@currena/core';
import {
  PERIOD_VIEWS,
  belowHighCount,
  heatToneOf,
  heatmapScale,
  marketBreadth,
  periodValueOf,
  topMovers,
} from './briefing';
import { viewValue } from './shared';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const entry = (fields: Partial<MarketEntry>): MarketEntry => ({
  id: 'sp500',
  asOf: '2026-10-16',
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

/** n rows with the given chg3m values, ids in trading-day order. */
function rows(values: number[]): MarketEntry[] {
  return values.map((v, i) => entry({ id: (i === 0 ? 'sp500' : `m${i}`) as MarketEntry['id'], chg3m: v }));
}

/** Rows carrying explicit per-lens values (undefined = the row predates
 * the lens — the pre-round-46/47 back-compat case). */
function lensRows(lens: '1w' | '1m' | '1y', values: Array<number | undefined>): MarketEntry[] {
  return values.map((v, i) => {
    const fields: Partial<MarketEntry> = { id: (i === 0 ? 'sp500' : `m${i}`) as MarketEntry['id'] };
    if (v !== undefined) {
      if (lens === '1w') fields.chg1w = v;
      else if (lens === '1m') fields.chg1m = v;
      else fields.chg1y = v;
    }
    return entry(fields);
  });
}

/* ------------------------------------------------------------------ *
 * The period lenses (§3.3)
 * ------------------------------------------------------------------ */

describe('PERIOD_VIEWS — the closed lens list', () => {
  it('offers exactly the five horizons the contract carries, ascending', () => {
    expect(PERIOD_VIEWS).toEqual(['today', '1w', '1m', '3m', '1y']);
  });

  it('offers no YTD or 52-week-distance lens (the data gap is a gap)', () => {
    // Round 47 added chg1y to the stored contract, so the yearly lens is
    // real — but there is still no YTD field and fromHigh is a context
    // metric; neither may pose as a period (02-ui-spec §3.3).
    expect(PERIOD_VIEWS).not.toContain('ytd');
    expect(PERIOD_VIEWS).not.toContain('high');
  });
});

describe('periodValueOf / viewValue — the lens read the whole section shares', () => {
  it('reads each lens from its own canonical field', () => {
    const m = entry({ chg1d: 1.2, chg1w: -5.4, chg1m: 2.2, chg3m: 1.8, chg1y: 12.6 });
    expect(periodValueOf(m, 'today')).toBe(1.2);
    expect(periodValueOf(m, '1w')).toBe(-5.4);
    expect(periodValueOf(m, '1m')).toBe(2.2);
    expect(periodValueOf(m, '3m')).toBe(1.8);
    expect(periodValueOf(m, '1y')).toBe(12.6);
  });

  it('a pre-lens row without chg1w/chg1m/chg1y reads null — never 0, never fromHigh', () => {
    const m = entry({ chg1w: undefined, chg1m: undefined, chg1y: undefined });
    expect(periodValueOf(m, '1w')).toBeNull();
    expect(periodValueOf(m, '1m')).toBeNull();
    expect(periodValueOf(m, '1y')).toBeNull();
    expect(viewValue(m, '1w').pct).toBeNull();
    // The 52-week distance must NOT leak into a period read.
    expect(periodValueOf(m, 'today')).not.toBe(m.fromHigh);
  });
});

/* ------------------------------------------------------------------ *
 * Market breadth (§3.2)
 * ------------------------------------------------------------------ */

describe('marketBreadth — up/down/flat over the selected period', () => {
  it('counts meaningful moves with the section flat band (±1%), from raw values', () => {
    // 8 up (>+1), 4 down (<−1), 4 flat (|v| ≤ 1 — including exactly +1).
    const markets = rows([2, 1.5, 5, -3, 1.01, 0.4, -0.9, -1.2, 9, -2, 3, 0, 1, -4, 6, 1.2]);
    const b = marketBreadth(markets, '3m');
    expect(b).toEqual({ up: 8, down: 4, flat: 4, valid: 16, total: 16 });
  });

  it('missing lens readings join no bucket and lower the denominator honestly', () => {
    const markets = lensRows('1w', [3, undefined, -2, undefined, 1.5, 0.2, -4, undefined]);
    const b = marketBreadth(markets, '1w');
    expect(b.valid).toBe(5);
    expect(b.total).toBe(8);
    expect(b.up + b.down + b.flat).toBe(5);
    expect(b.up).toBe(2);
    expect(b.down).toBe(2);
    expect(b.flat).toBe(1);
  });

  it('exactly ±1% is flat (the band is inclusive on the flat side)', () => {
    const b = marketBreadth(rows([1, -1, 1.0001, -1.0001, 0]), '3m');
    expect(b.flat).toBe(3); // +1, −1, 0
    expect(b.up).toBe(1);
    expect(b.down).toBe(1);
  });

  it('an empty snapshot is empty, not zeros-with-denominator', () => {
    const b = marketBreadth([], '3m');
    expect(b).toEqual({ up: 0, down: 0, flat: 0, valid: 0, total: 0 });
  });

  it('round 47: the yearly lens reads chg1y — missing rows lower the denominator, movers rank only carriers', () => {
    // 4 rows carry chg1y (1 up, 2 down, 1 flat); the 5th predates the lens.
    const markets = lensRows('1y', [14.2, undefined, -22.5, 0.4, -9.1]);
    expect(marketBreadth(markets, '1y')).toMatchObject({ up: 1, down: 2, flat: 1, valid: 4, total: 5 });
    const { gainer, decliner, valid } = topMovers(markets, '1y');
    expect(valid).toBe(4);
    expect(gainer?.id).toBe('sp500'); // +14.2
    expect(decliner?.id).toBe('m2'); // −22.5
    // A yearly lens is often WIDER than the quarterly one — the heatmap
    // scale re-reads the lens's own extrema, never chg3m's.
    expect(heatmapScale(markets, '1y')).toBe(50);
  });
});

/* ------------------------------------------------------------------ *
 * The below-52-week-high count (§3.2, §8)
 * ------------------------------------------------------------------ */

describe('belowHighCount — the raw-value 10% threshold', () => {
  it('counts only indices at least 10% below their high (raw fromHigh)', () => {
    const markets = [
      entry({ id: 'n225', fromHigh: -10.0 }), // exactly at the line → counted
      entry({ id: 'asx200', fromHigh: -9.999 }), // just above → NOT counted
      entry({ id: 'kospi', fromHigh: -25 }), // bear → counted
      entry({ id: 'hsi', fromHigh: -0.4 }), // at high → not counted
    ];
    expect(belowHighCount(markets)).toBe(2);
  });

  it('the rounding boundary: −9.96% DISPLAYS as −10% but is NOT counted (§3.2)', () => {
    const markets = [entry({ id: 'n225', fromHigh: -9.96 })];
    expect(belowHighCount(markets)).toBe(0);
    // …while −10.04% both displays as −10% and IS counted.
    expect(belowHighCount([entry({ id: 'asx200', fromHigh: -10.04 })])).toBe(1);
  });

  it('the threshold reads the config block constant, not a local number', () => {
    // CORRECTION_PCT is −10: a market at exactly −10 sits in the count.
    expect(belowHighCount([entry({ fromHigh: -10 })])).toBe(1);
    expect(belowHighCount([entry({ fromHigh: -9.5 })])).toBe(0);
  });
});

/* ------------------------------------------------------------------ *
 * The movers (§3.4)
 * ------------------------------------------------------------------ */

describe('topMovers — the true extrema of the selected period', () => {
  it('mixed data: the max is the gainer, the min is the decliner', () => {
    const markets = rows([2, -3, 5.5, -1.2, 0.4, 4, -8, 1]);
    const { gainer, decliner, valid } = topMovers(markets, '3m');
    expect(valid).toBe(8);
    expect(gainer?.id).toBe('m2'); // +5.5
    expect(decliner?.id).toBe('m6'); // −8
  });

  it('all-negative data: the least fall is still the maximum — signed truth, no fake winner', () => {
    const markets = rows([-1, -5, -2.2, -9, -0.5]);
    const { gainer, decliner } = topMovers(markets, '3m');
    expect(gainer?.id).toBe('m4'); // −0.5 is the max
    expect(decliner?.id).toBe('m3'); // −9 is the min
  });

  it('all-positive data: the smallest rise is still the minimum', () => {
    const markets = rows([1.2, 6, 3, 0.4]);
    const { gainer, decliner } = topMovers(markets, '3m');
    expect(gainer?.id).toBe('m1'); // +6
    expect(decliner?.id).toBe('m3'); // +0.4
  });

  it('partial data: rows missing the lens are excluded — never ranked as zero', () => {
    const markets = lensRows('1m', [3, undefined, -2, undefined]);
    const { gainer, decliner, valid } = topMovers(markets, '1m');
    expect(valid).toBe(2);
    expect(gainer?.id).toBe('sp500'); // +3
    expect(decliner?.id).toBe('m2'); // −2
  });

  it('a single valid row is both extrema — mathematically true, honestly shown', () => {
    const markets = lensRows('1m', [3, undefined, undefined]);
    const { gainer, decliner, valid } = topMovers(markets, '1m');
    expect(valid).toBe(1);
    expect(gainer?.id).toBe('sp500');
    expect(decliner?.id).toBe('sp500');
  });

  it('no valid values: no movers, no fake winners (the honest empty state)', () => {
    const markets = lensRows('1m', [undefined, undefined, undefined]);
    const { gainer, decliner, valid } = topMovers(markets, '1m');
    expect(valid).toBe(0);
    expect(gainer).toBeNull();
    expect(decliner).toBeNull();
  });

  it('ties keep the earlier row (trading-day order, like the table sort)', () => {
    const markets = rows([5, -8, 5, -8]);
    const { gainer, decliner } = topMovers(markets, '3m');
    expect(gainer?.id).toBe('sp500');
    expect(decliner?.id).toBe('m1');
  });

  it('an empty snapshot yields no movers', () => {
    const { gainer, decliner, valid } = topMovers([], '3m');
    expect(valid).toBe(0);
    expect(gainer).toBeNull();
    expect(decliner).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * The heatmap scale and tones (§3.6)
 * ------------------------------------------------------------------ */

describe('heatmapScale — the dynamic, period-relative scale', () => {
  it('rounds the largest |return| up to a nice step', () => {
    expect(heatmapScale(rows([1.9, -0.4]), '3m')).toBe(2);
    expect(heatmapScale(rows([4.2, -2]), '3m')).toBe(5);
    expect(heatmapScale(rows([12, -8]), '3m')).toBe(20);
    expect(heatmapScale(rows([54, 3]), '3m')).toBe(100);
    expect(heatmapScale(rows([250, -120]), '3m')).toBe(300);
  });

  it('scales per period: a daily ±2% and a quarterly ±20% get different axes', () => {
    const daily = [entry({ id: 'n225', chg1d: 1.8, chg3m: 18 }), entry({ id: 'asx200', chg1d: -1.2, chg3m: -14 })];
    expect(heatmapScale(daily, 'today')).toBe(2);
    expect(heatmapScale(daily, '3m')).toBe(20);
  });

  it('missing readings do not stretch the scale', () => {
    const markets = lensRows('1w', [1.5, undefined, -0.7, undefined]);
    expect(heatmapScale(markets, '1w')).toBe(2);
  });

  it('all-flat data keeps a degenerate neutral scale', () => {
    expect(heatmapScale(rows([0, 0, 0]), '3m')).toBe(1);
    expect(heatmapScale([], '3m')).toBe(1);
  });
});

describe('heatToneOf — the intensity buckets', () => {
  it('zero and missing stay neutral', () => {
    expect(heatToneOf(0, 10)).toBe('zero');
    expect(heatToneOf(null, 10)).toBe('zero');
  });

  it('splits each direction into thirds of the scale', () => {
    expect(heatToneOf(2, 12)).toBe('pos1'); // ratio 1/6
    expect(heatToneOf(6, 12)).toBe('pos2'); // 1/2 → mid bucket
    expect(heatToneOf(11, 12)).toBe('pos3');
    expect(heatToneOf(-2, 12)).toBe('neg1');
    expect(heatToneOf(-6, 12)).toBe('neg2');
    expect(heatToneOf(-11, 12)).toBe('neg3');
  });

  it('clamps beyond the scale to the strongest bucket', () => {
    expect(heatToneOf(50, 10)).toBe('pos3');
    expect(heatToneOf(-50, 10)).toBe('neg3');
  });
});

/* ------------------------------------------------------------------ *
 * Cross-surface consistency (§3.3: one period drives every surface)
 * ------------------------------------------------------------------ */

describe('period consistency — breadth, movers and scale read the same lens', () => {
  const markets = [
    entry({ id: 'n225', chg1w: 4.5, fromHigh: -12 }),
    entry({ id: 'asx200', chg1w: -3.5, fromHigh: -5 }),
    entry({ id: 'kospi', chg1w: 1.5, fromHigh: -11 }),
    entry({ id: 'hsi', chg1w: 0.2, fromHigh: -9.96 }), // displays −10%, not counted
  ];

  it('the weekly lens: breadth 2/1/1, mover gainer n225, decliner asx200, scale 5', () => {
    expect(marketBreadth(markets, '1w')).toMatchObject({ up: 2, down: 1, flat: 1, valid: 4 });
    expect(topMovers(markets, '1w').gainer?.id).toBe('n225');
    expect(topMovers(markets, '1w').decliner?.id).toBe('asx200');
    expect(heatmapScale(markets, '1w')).toBe(5);
    // The below-high count is period-INDEPENDENT secondary context.
    expect(belowHighCount(markets)).toBe(2); // −12 and −11 only
  });

  it('switching to the daily lens re-reads every surface from chg1d', () => {
    const daily = markets.map((m) => ({ ...m, chg1d: m.id === 'kospi' ? -2.6 : 0.8 }));
    expect(marketBreadth(daily, 'today')).toMatchObject({ up: 0, down: 1, flat: 3 });
    expect(topMovers(daily, 'today').decliner?.id).toBe('kospi');
    expect(topMovers(daily, 'today').gainer?.id).toBe('n225'); // first flat row is the max (0.8)
  });
});
