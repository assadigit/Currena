/**
 * The gold backtest harness's pure core (Session 4, GOLD_BACKTEST_SPEC.md §3).
 *
 * Everything here is PURE and OFFLINE: series helpers, the frozen-clock
 * window assembly, the B2 realized-move join, and the HARNESS-LOCAL
 * parameterized copy of the gold score arithmetic (scoreOverVoters) plus
 * the tilt-augmented 21-voter table (B4's D-5 evaluation copy).
 *
 * HONESTY RULES enforced by this module's shape (B3):
 *  - No wall-clock reads anywhere — every function takes its dates as
 *    explicit parameters (the runner passes the frozen clock).
 *  - No lookahead — seriesUpTo() truncates every series at the as-of date
 *    BEFORE the scoring math sees it, so a future observation can never
 *    leak into a percentile, a change window or a staleness verdict.
 *    (computeReading itself is already anchored at its `now` parameter;
 *    the truncation is the belt-and-braces guarantee, and the test
 *    asserts the two agree.)
 *  - scoreOverVoters() is a COPY of goldTailwindScore's arithmetic with
 *    the voter table parameterized. Production's GOLD_LANE_VOTERS stays
 *    untouched (D-5 discipline); the equivalence is PINNED BY TEST
 *    (scoreOverVoters(r, GOLD_LANE_VOTERS) === goldTailwindScore(r) on
 *    synthetic batteries), so the harness cannot drift from the engine.
 *
 * Tested in gold-backtest-core.test.ts (window joins, the no-lookahead
 * percentile, the flat band, the pin). Platform-free (AGENTS.md rule 2).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { GoldLane, GoldLaneVoter, GoldSubGaugeWord, GoldTailwindLabel, GoldTailwindReading, GoldVoter } from './gold-score';
import {
  GOLD_LANE_VOTERS,
  GOLD_LANES,
  GOLD_STRONG_MIN_FIRING,
  GOLD_STRONG_SHARE,
  GOLD_REALITY_SPEED_PCT,
} from './gold-score';
import { evalLeg } from './connections';
import type { SeriesPoint } from './series';

/* ------------------------------------------------------------------ *
 * B4 — the tilt-augmented 21-voter table (HARNESS-LOCAL copy)
 * ------------------------------------------------------------------ */

/**
 * The D-5 evaluation table: the FROZEN 20 voters plus `breakeven-tilt`
 * (T5YIFR − T5YIE) as a 5th member of the inflation lane, polarity +1 —
 * a building tilt (rising/high) is the tailwind side, matching the lane's
 * hot-inflation-supports-hedge-demand reading. This copy exists ONLY in
 * the harness: production's GOLD_LANE_VOTERS is untouched and stays
 * pinned at 20 by its own test.
 */
export const HARNESS_GOLD_VOTERS_21: readonly GoldLaneVoter[] = [
  ...GOLD_LANE_VOTERS,
  { lane: 'inflation' as const, id: 'breakeven-tilt' as IndicatorId, polarity: 1 as const },
];

/* ------------------------------------------------------------------ *
 * The score arithmetic, parameterized over a voter table
 * ------------------------------------------------------------------ */

/** The readable-voter rule (gold-score.ts's own: stale/check-pending/unavailable never fire). */
function readable(r: IndicatorReading | undefined): r is IndicatorReading {
  return r !== undefined && r.status !== 'stale' && r.status !== 'check-pending' && r.status !== 'unavailable';
}

const LANE_TAILWIND_WORD: Record<GoldLane, GoldSubGaugeWord> = {
  'borrowing-costs': 'relief',
  dollar: 'stress',
  stress: 'elevated',
  inflation: 'hot',
};
const LANE_HEADWIND_WORD: Record<GoldLane, GoldSubGaugeWord> = {
  'borrowing-costs': 'tight',
  dollar: 'strong',
  stress: 'calm',
  inflation: 'cool',
};

/**
 * goldTailwindScore's arithmetic over an arbitrary voter table — the
 * harness-local copy B4 needs. Equivalent to the production engine when
 * handed GOLD_LANE_VOTERS (pinned by test; never call this in production
 * paths — import goldTailwindScore there).
 */
export function scoreOverVoters(
  readings: readonly IndicatorReading[],
  voters: readonly GoldLaneVoter[],
): GoldTailwindReading {
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  const fired: GoldVoter[] = [];
  for (const def of voters) {
    const r = byId.get(def.id);
    if (!readable(r)) continue;
    const leg = evalLeg(def.id, r);
    if (leg.lean === 0) continue; // steady AND typical — honestly not firing
    const impact = leg.lean * def.polarity === 1 ? 'tailwind' : 'headwind';
    const evidence = leg.direction === 'rising' ? 'rising' : leg.direction === 'falling' ? 'falling' : leg.level === 'high' ? 'high' : 'low';
    fired.push({
      id: def.id,
      lane: def.lane,
      impact,
      evidence,
    });
  }

  const tailwindVoters = fired.filter((v) => v.impact === 'tailwind').length;
  const headwindVoters = fired.filter((v) => v.impact === 'headwind').length;
  const firingVoters = tailwindVoters + headwindVoters;
  const netScore = tailwindVoters - headwindVoters;

  let label: GoldTailwindLabel | null;
  if (firingVoters === 0) label = null;
  else if (netScore > 0 && firingVoters >= GOLD_STRONG_MIN_FIRING && netScore / firingVoters >= GOLD_STRONG_SHARE) {
    label = 'strong-tailwind';
  } else if (netScore > 0) label = 'tailwind';
  else if (netScore === 0) label = 'balanced';
  else if (netScore < 0 && firingVoters >= GOLD_STRONG_MIN_FIRING && -netScore / firingVoters >= GOLD_STRONG_SHARE) {
    label = 'strong-headwind';
  } else label = 'headwind';

  const subGauges = GOLD_LANES.map((lane) => {
    const laneVoters = fired.filter((v) => v.lane === lane);
    const t = laneVoters.filter((v) => v.impact === 'tailwind').length;
    const h = laneVoters.filter((v) => v.impact === 'headwind').length;
    let reading: GoldSubGaugeWord;
    if (t === 0 && h === 0) reading = 'unreadable';
    else if (t > 0 && h > 0) reading = 'mixed';
    else if (t > 0) reading = LANE_TAILWIND_WORD[lane];
    else reading = LANE_HEADWIND_WORD[lane];
    return { lane, reading, tailwindVoters: t, headwindVoters: h };
  });
  const laneCounts = {
    tailwind: subGauges.filter((g) => g.reading === LANE_TAILWIND_WORD[g.lane]).length,
    headwind: subGauges.filter((g) => g.reading === LANE_HEADWIND_WORD[g.lane]).length,
    mixed: subGauges.filter((g) => g.reading === 'mixed').length,
  };

  return {
    netScore,
    label,
    firingVoters,
    tailwindVoters,
    headwindVoters,
    laneCounts,
    subGauges,
    voters: fired,
  };
}

/* ------------------------------------------------------------------ *
 * The frozen-clock window (no lookahead)
 * ------------------------------------------------------------------ */

/**
 * The series' prefix at or before `asOfDay` — the no-lookahead guarantee
 * made physical: everything after the as-of date is cut away BEFORE any
 * scoring math runs. Binary search; ascending input assumed (asserted by
 * the scoring engine the moment it walks the series).
 */
export function seriesUpTo(series: readonly SeriesPoint[], asOfDay: string): SeriesPoint[] {
  let lo = 0;
  let hi = series.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid]!.date <= asOfDay) lo = mid + 1;
    else hi = mid;
  }
  return series.slice(0, lo);
}

/* ------------------------------------------------------------------ *
 * B2 — the realized-move join
 * ------------------------------------------------------------------ */

/** The forward-return horizons (trading days), per the spec. */
export const GOLD_BACKTEST_HORIZONS = [5, 20, 60] as const;
export type GoldBacktestHorizon = (typeof GOLD_BACKTEST_HORIZONS)[number];

/**
 * The calendar length of N trading days (≈ 7 calendar days per 5 trading
 * days) — the flat band's scaling basis.
 */
export function horizonCalendarDays(nTradingDays: number): number {
  return (nTradingDays * 7) / 5;
}

/**
 * The flat band for one horizon: the engine's OWN reality bar
 * (GOLD_REALITY_SPEED_PCT = ±2% over 30 calendar days — the same bar the
 * model-vs-reality panel uses), linearly scaled to the horizon's calendar
 * length. One constant, one scaling rule — no per-horizon tuning.
 */
export function flatBandPct(nTradingDays: number): number {
  return (GOLD_REALITY_SPEED_PCT * horizonCalendarDays(nTradingDays)) / 30;
}

/** The realized-move bucket: up / flat / down against the horizon's band. */
export function classifyReturn(retPct: number, bandPct: number): 'up' | 'flat' | 'down' {
  if (retPct > bandPct) return 'up';
  if (retPct < -bandPct) return 'down';
  return 'flat';
}

/** The model-side bucket: the 5-step label folded to 3 (mixed = balanced ∪ nothing-firing). */
export function bucketModelLabel(label: GoldTailwindLabel | null): 'tailwind' | 'mixed' | 'headwind' {
  if (label === 'strong-tailwind' || label === 'tailwind') return 'tailwind';
  if (label === 'strong-headwind' || label === 'headwind') return 'headwind';
  return 'mixed'; // balanced, or null (nothing could fire)
}

/**
 * The forward N-TRADING-DAY return from index `i` of the gold series, in
 * percent — EXACTLY N observations ahead, never interpolated, never a
 * calendar window. Undefined when the horizon reaches past the series'
 * end (the tail windows — excluded from that horizon's tables, n stated).
 */
export function forwardTradingDayReturn(gold: readonly SeriesPoint[], i: number, n: number): number | undefined {
  const j = i + n;
  if (j >= gold.length) return undefined;
  const from = gold[i]!.value;
  const to = gold[j]!.value;
  if (from <= 0) return undefined;
  return ((to - from) / from) * 100;
}

/** Sign agreement between the model lean and the realized move (both must be readable). */
export function signAgreement(netScore: number, retPct: number, bandPct: number): boolean | undefined {
  if (netScore === 0) return undefined; // no lean either way — not a testable window
  if (Math.abs(retPct) <= bandPct) return undefined; // flat — not a testable window
  return netScore > 0 ? retPct > 0 : retPct < 0;
}
