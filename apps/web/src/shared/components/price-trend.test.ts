/**
 * price-trend.test.ts — the seven-day window, the documented trend
 * classification and the evidence-based briefing behind the prices-board
 * redesign (financial-asset-cards spec pack 04 §5 + 03 §3).
 *
 * Covered here:
 *   - cleanPriceSeries: nulls/non-finite/non-positive values drop,
 *     duplicate days keep the LAST observation (revisions), ascending;
 *   - window7d: the reference point is the last observation at-or-before
 *     (latest − 7 days) within the 3-day tolerance — the SAME convention
 *     as the API's change7d, so the chart and the number share
 *     boundaries; no honest window ⇒ null (never a fabricated one);
 *   - classifyTrend: the documented thresholds — insufficient below 4
 *     points; |net| < 1% ⇒ range/mixed by the traveled path; |net| ≥ 1%
 *     ⇒ up/down ONLY when the net dominates the path (a crash-and-bounce
 *     week with a dominant net is honestly directional; a small net
 *     inside a big chop is honestly mixed);
 *   - briefingText: deterministic templates — hedge sentence, Bitcoin's
 *     volatility-aware wording (fluctuated ONLY on a mixed window), oil's
 *     drivers-evidence caveat, the honest unavailable fallback, and the
 *     stale qualifier.
 */

import { describe, expect, it } from 'vitest';
import { briefingText, cleanPriceSeries, classifyTrend, window7d, type BriefingCopy } from './price-trend';
import type { HistoryPoint } from './price-stats';

/** Day numbers are the history endpoint's own unit (days since epoch) —
 * the tests use plain small numbers; only DIFFERENCES matter. */
const D = (day: number, value: number | null): HistoryPoint => [day, value];

const EN: BriefingCopy = {
  sumUp: '{asset} has risen over the past seven days.',
  sumDown: '{asset} has declined over the past seven days.',
  sumRange: '{asset} has moved mostly within a range over the past seven days; the available data shows no clear direction.',
  sumMixed: 'Movement of {asset} has been uneven over this period, so the available data does not show a clear direction.',
  sumHedge: 'This describes the selected period and does not, by itself, establish the next move.',
  sumBtcHedge: 'This movement may not persist, and short-term volatility can remain high.',
  sumBtcMixed: '{asset} has fluctuated over the past seven days.',
  sumOilDrivers: 'Explaining the drivers would require supporting evidence about supply, demand, and market conditions.',
  sumUnavailable: 'There is not enough data to provide a reliable summary.',
  dataDelayed: 'Data may be delayed.',
};

describe('cleanPriceSeries', () => {
  it('drops nulls and invalid values, keeps the last revision per day, sorts ascending', () => {
    const pts = cleanPriceSeries([
      D(10, 105),
      D(8, null),
      D(9, NaN),
      D(10, 110), // revision of day 10 — last wins
      D(7, -3), // non-positive price — dropped (day 7 contributes nothing)
      D(8, 100),
    ]);
    expect(pts).toEqual([
      { day: 8, value: 100 },
      { day: 10, value: 110 },
    ]);
  });
});

describe('window7d', () => {
  it('anchors at the last point at-or-before (latest − 7d) and measures the net', () => {
    // Days 100→107 (7-day span): 100 → 110 is +10%.
    const pts = cleanPriceSeries([D(100, 100), D(101, 101), D(103, 104), D(105, 106), D(107, 110)]);
    const w = window7d(pts);
    expect(w).not.toBeNull();
    expect(w!.startDay).toBe(100);
    expect(w!.endDay).toBe(107);
    expect(w!.netPct).toBeCloseTo(10, 6);
    expect(w!.incomplete).toBe(false);
  });

  it('accepts a reference up to 3 days past the target (the API tolerance)', () => {
    // Latest day 107 → target 100; the stored point at 97 is 3 days off → OK.
    const pts = cleanPriceSeries([D(90, 100), D(97, 100), D(104, 104), D(105, 105), D(107, 108)]);
    const w = window7d(pts);
    expect(w).not.toBeNull();
    expect(w!.startDay).toBe(97);
    expect(w!.netPct).toBeCloseTo(8, 6);
  });

  it('yields null when the only candidate is farther than the tolerance', () => {
    const pts = cleanPriceSeries([D(80, 100), D(104, 104), D(105, 105), D(107, 108)]);
    expect(window7d(pts)).toBeNull();
  });

  it('yields null for a series with fewer than two usable points', () => {
    expect(window7d(cleanPriceSeries([D(100, 100)]))).toBeNull();
    expect(window7d([])).toBeNull();
  });

  it('marks a sparse window incomplete (disclosed, never hidden)', () => {
    // A full 7-day span but only 3 observations — too thin to trust.
    const sparse = window7d(cleanPriceSeries([D(100, 100), D(104, 101), D(107, 102)]));
    expect(sparse).not.toBeNull();
    expect(sparse!.incomplete).toBe(true);
    expect(sparse!.trend).toBe('insufficient');
  });
});

describe('classifyTrend — the documented thresholds', () => {
  const pts = (values: number[], startDay = 100) =>
    values.map((v, i) => ({ day: startDay + i * 2, value: v }));

  it('insufficient below 4 observations', () => {
    expect(classifyTrend(pts([100, 101, 102]), 2)).toBe('insufficient');
    expect(classifyTrend(pts([100, 101]), 1)).toBe('insufficient');
  });

  it('a weak net over a calm path is range-bound', () => {
    // Net +0.4%; path range ~0.6% — calm.
    expect(classifyTrend(pts([100, 100.2, 100.4, 100.3, 100.4]), 0.4)).toBe('range');
  });

  it('a weak net over big swings is mixed', () => {
    // Net +0.5% but the path swings ±1.5% (a 3% traveled range) — chop
    // that cancels out crosses the documented MIXED_RANGE_PCT threshold.
    expect(classifyTrend(pts([100, 103, 100.5, 103, 100.5]), 0.5)).toBe('mixed');
  });

  it('a dominant net move is honestly directional', () => {
    // Steady climb: net +10%, path range 10% — the net IS the path.
    expect(classifyTrend(pts([100, 102, 104, 106, 110]), 10)).toBe('up');
    expect(classifyTrend(pts([100, 98, 96, 94, 90]), -10)).toBe('down');
  });

  it('a net that its own swings dwarf is mixed, not directional', () => {
    // Crash-and-bounce: −15.5% net inside a 30% traveled range? No —
    // a REAL crash dominates its bounce: net −15.5%, range 16% ⇒ down.
    expect(classifyTrend(pts([100, 90, 84.5, 86, 84.5]), -15.5)).toBe('down');
    // But a −1.2% net inside a ±2.5% chop does not get to say "downward".
    expect(classifyTrend(pts([100, 102.5, 100.3, 101.2, 98.8]), -1.2)).toBe('mixed');
  });
});

describe('briefingText — deterministic, hedged, never causal', () => {
  const base = { asset: 'gold-usd', subject: 'Gold', historyUnavailable: false };

  it('observed up movement + the horizon hedge', () => {
    expect(briefingText({ ...base, trend: 'up', stale: false }, EN)).toBe(
      'Gold has risen over the past seven days. This describes the selected period and does not, by itself, establish the next move.',
    );
  });

  it('the unavailable fallback when there is no honest window', () => {
    expect(briefingText({ ...base, trend: null, stale: false }, EN)).toBe(EN.sumUnavailable);
    expect(briefingText({ ...base, trend: 'insufficient', stale: false }, EN)).toBe(EN.sumUnavailable);
  });

  it('Bitcoin: volatility-aware hedge; "fluctuated" only on a mixed window', () => {
    const btc = { asset: 'btc-usd', subject: 'Bitcoin', historyUnavailable: false, stale: false };
    expect(briefingText({ ...btc, trend: 'up' }, EN)).toBe(
      'Bitcoin has risen over the past seven days. This movement may not persist, and short-term volatility can remain high.',
    );
    expect(briefingText({ ...btc, trend: 'mixed' }, EN)).toBe(
      'Bitcoin has fluctuated over the past seven days. This movement may not persist, and short-term volatility can remain high.',
    );
  });

  it('Oil: directional moves get the drivers-evidence caveat, not a story', () => {
    const oil = { asset: 'brent', subject: 'Oil', historyUnavailable: false, stale: false };
    expect(briefingText({ ...oil, trend: 'up' }, EN)).toBe(
      'Oil has risen over the past seven days. Explaining the drivers would require supporting evidence about supply, demand, and market conditions.',
    );
    // A non-directional oil window keeps the plain mixed wording.
    expect(briefingText({ ...oil, trend: 'mixed' }, EN)).toBe(
      'Movement of Oil has been uneven over this period, so the available data does not show a clear direction.',
    );
  });

  it('a stale reading qualifies the whole summary', () => {
    expect(briefingText({ ...base, trend: 'up', stale: true }, EN)).toBe(
      `Gold has risen over the past seven days. This describes the selected period and does not, by itself, establish the next move. ${EN.dataDelayed}`,
    );
  });
});
