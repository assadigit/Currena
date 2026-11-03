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

import type { IndicatorReading } from '@currena/core';
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
 * The voter tables the harness re-runs (B4, post-promotion)
 * ------------------------------------------------------------------ */

/**
 * The PROMOTED production table (D-5, Session 6): the harness's 21-voter
 * table IS the production `GOLD_LANE_VOTERS` since the promotion landed —
 * `breakeven-tilt` (T5YIFR − T5YIE) as the 5th member of the inflation
 * lane, polarity +1, level-leg only (the shared evaluator carries no
 * 30-day move threshold for it — exactly the variant S4's B4 measured).
 * The EQUALITY is pinned by test (gold-backtest-core.test.ts): this alias
 * exists so the harness's own references stay named, and can never drift
 * from the engine.
 */
export const HARNESS_GOLD_VOTERS_21: readonly GoldLaneVoter[] = GOLD_LANE_VOTERS;

/**
 * The S4 FROZEN 20-voter table — the pre-promotion production table, kept
 * VERBATIM for lineage (the promotion-delta tables need the table the S4
 * report measured). Do not edit: it is a historical snapshot, not a living
 * config; the promotion (Session 6) is the only change between it and
 * production, which its own pin asserts.
 */
export const HARNESS_GOLD_VOTERS_20: readonly GoldLaneVoter[] = [
  { lane: 'borrowing-costs', id: 'real-yield-10y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'us10y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'us30y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'fed-target', polarity: -1 },
  { lane: 'borrowing-costs', id: 'fed-expectations', polarity: -1 },
  { lane: 'borrowing-costs', id: 'ecb-dfr', polarity: -1 },
  { lane: 'borrowing-costs', id: 'yield-curve-10y2y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'yield-curve-10y3m', polarity: -1 },
  { lane: 'dollar', id: 'dollar-basket', polarity: -1 },
  { lane: 'dollar', id: 'usdjpy', polarity: -1 },
  { lane: 'dollar', id: 'us-japan-10y-gap', polarity: -1 },
  { lane: 'stress', id: 'stress-stlfsi', polarity: 1 },
  { lane: 'stress', id: 'nfci', polarity: 1 },
  { lane: 'stress', id: 'vix', polarity: 1 },
  { lane: 'stress', id: 'gold-silver', polarity: 1 },
  { lane: 'stress', id: 'cftc-gold-positioning', polarity: -1 },
  { lane: 'inflation', id: 'us-cpi-yoy', polarity: 1 },
  { lane: 'inflation', id: 'us-pce-core-yoy', polarity: 1 },
  { lane: 'inflation', id: 'euro-hicp', polarity: 1 },
  { lane: 'inflation', id: 'breakeven-5y5y', polarity: 1 },
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

/* ------------------------------------------------------------------ *
 * The lane tables — the gold-balance consolidation P0 calibration
 * (docs/specs/gold-balance-consolidation/02-ENGINE-AND-DECISION-TABLE.md §6)
 * ------------------------------------------------------------------ */

/**
 * One lane-rule configuration for the P0 calibration: the SAME frozen
 * 21-voter production table, paired with a lane-vote crowd minimum
 * (`GOLD_LANE_MIN_FIRING` per D-GB-3; the pre-registered fallback is 1).
 * These sit BESIDE the frozen voter tables (`HARNESS_GOLD_VOTERS_21` /
 * `_20`) and change nothing about them: the voters, their lanes and their
 * polarities come from `gold-score.ts`'s `GOLD_LANE_VOTERS` — the single
 * source of truth (D-GB-9). The consolidated balance's production engine
 * (`gold-balance.ts`, rollout phase P1) will import the same source; this
 * harness-local copy exists so the calibration can run BEFORE any UI work,
 * exactly as 02 §6 pre-registered.
 */
export interface HarnessGoldLanes {
  /** The voter table the lanes group — always GOLD_LANE_VOTERS here. */
  readonly voters: readonly GoldLaneVoter[];
  /** The crowd minimum: how many firing voters a lane needs before it may vote. */
  readonly minFiring: number;
}

/** D-GB-3's default rule: a lane votes only when at least 2 of its voters fire. */
export const HARNESS_GOLD_LANES_MIN2: HarnessGoldLanes = { voters: GOLD_LANE_VOTERS, minFiring: 2 };

/** The pre-registered calibration fallback (02 §6): one firing voter can tip a lane. */
export const HARNESS_GOLD_LANES_MIN1: HarnessGoldLanes = { voters: GOLD_LANE_VOTERS, minFiring: 1 };

/** A lane's side in the consolidated balance (02 §2's GoldBalanceSide). */
export type GoldLaneSide = 'for' | 'against' | 'neutral' | 'unread';

/** One lane's vote under a min-firing rule. */
export interface HarnessLaneVote {
  lane: GoldLane;
  side: GoldLaneSide;
  /** true when side is 'neutral' because supports === pressures > 0 (02 §3). */
  split: boolean;
  /** Voters readable (not missing/stale/check-pending/unavailable). */
  readable: number;
  /** supports + pressures. */
  firing: number;
  supports: number;
  pressures: number;
}

/** The balance's verdict state (01 §5.1): 'none' = all four lanes unread. */
export type HarnessBalanceState = 'tipped-for' | 'tipped-against' | 'level' | 'none';

/** The consolidated balance over the four lanes, as the harness computes it. */
export interface HarnessLaneBalance {
  /** The four lane votes, GOLD_LANES order. */
  lanes: HarnessLaneVote[];
  counts: { for: number; against: number; neutral: number; unread: number };
  /** lanesFor − lanesAgainst. */
  net: number;
  /** for + against + neutral lane counts (01 §5.1's readable). */
  readable: number;
  state: HarnessBalanceState;
  /**
   * The beam angle in degrees (D-GB-8, unchanged formula):
   * |net| / (for + against) × 10, clamped to [3, 10]; 0 when level.
   */
  beamAngle: number;
  /** |net| === for + against — the one-sided, full 10-degree tip. */
  fullyTipped: boolean;
}

/**
 * The consolidated lane balance over an arbitrary voter table + crowd
 * minimum — the harness-local lane engine (02 §3's algorithm, the same
 * one the P1 `gold-balance.ts` engine will implement from the same
 * imports). Pure, offline, order-independent; never throws on missing
 * readings. `unread` (nothing readable) and `neutral` (readable, nothing
 * firing or split) are never merged — problem P5's fix.
 */
export function laneBalanceOverVoters(
  readings: readonly IndicatorReading[],
  voters: readonly GoldLaneVoter[],
  minFiring: number,
): HarnessLaneBalance {
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  const lanes: HarnessLaneVote[] = GOLD_LANES.map((lane) => {
    let readableCount = 0;
    let supports = 0;
    let pressures = 0;
    for (const def of voters) {
      if (def.lane !== lane) continue;
      const r = byId.get(def.id);
      if (!readable(r)) continue;
      readableCount++;
      const leg = evalLeg(def.id, r);
      if (leg.lean === 0) continue; // steady AND typical — honestly not firing
      if (leg.lean * def.polarity === 1) supports++;
      else pressures++;
    }
    const firing = supports + pressures;
    let side: GoldLaneSide;
    let split = false;
    if (readableCount === 0) side = 'unread';
    else if (firing < minFiring) side = 'neutral';
    else if (supports > pressures) side = 'for';
    else if (pressures > supports) side = 'against';
    else {
      side = 'neutral';
      split = true;
    }
    return { lane, side, split, readable: readableCount, firing, supports, pressures };
  });

  const counts = {
    for: lanes.filter((l) => l.side === 'for').length,
    against: lanes.filter((l) => l.side === 'against').length,
    neutral: lanes.filter((l) => l.side === 'neutral').length,
    unread: lanes.filter((l) => l.side === 'unread').length,
  };
  const net = counts.for - counts.against;
  const tipped = counts.for + counts.against;
  const beamAngle = net === 0 || tipped === 0 ? 0 : Math.min(10, Math.max(3, (Math.abs(net) / tipped) * 10));
  const state: HarnessBalanceState =
    counts.unread === 4 ? 'none' : net > 0 ? 'tipped-for' : net < 0 ? 'tipped-against' : 'level';

  return {
    lanes,
    counts,
    net,
    readable: counts.for + counts.against + counts.neutral,
    state,
    beamAngle,
    fullyTipped: net !== 0 && Math.abs(net) === tipped,
  };
}

/* ------------------------------------------------------------------ *
 * The calibration statistics (02 §6 — C1 and C2, pre-registered)
 * ------------------------------------------------------------------ */

/** C1's level ceiling: the balance is level in at most 70% of all windows. */
export const LANE_CALIB_LEVEL_MAX_SHARE = 0.7;
/** C1's full-tip ceiling: fully tipped (10°, one-sided) in at most 60% of all windows. */
export const LANE_CALIB_FULLTIP_MAX_SHARE = 0.6;
/** C2's stability window: flips per 60 trading days. */
export const LANE_CALIB_FLIP_WINDOW = 60;

/**
 * The median number of day-to-day side changes inside every window of
 * `LANE_CALIB_FLIP_WINDOW` consecutive entries (C2's "verdict flips per 60
 * trading days"). Sliding windows, step 1; the median across all of them.
 * Null when the sequence is shorter than the window (n stated, never guessed).
 */
export function medianFlipsPer60(sides: readonly string[]): number | null {
  const w = LANE_CALIB_FLIP_WINDOW;
  if (sides.length < w) return null;
  const counts: number[] = [];
  for (let i = 0; i + w <= sides.length; i++) {
    let c = 0;
    for (let j = i + 1; j < i + w; j++) {
      if (sides[j] !== sides[j - 1]) c++;
    }
    counts.push(c);
  }
  counts.sort((a, b) => a - b);
  const mid = counts.length >> 1;
  return counts.length % 2 === 1 ? counts[mid]! : (counts[mid - 1]! + counts[mid]!) / 2;
}

/** The per-rule calibration figures (02 §6 items 1–3 + the C1/C2 verdicts). */
export interface LaneCalibrationStats {
  n: number;
  tippedFor: number;
  tippedAgainst: number;
  /** net === 0 (level beam) — INCLUDES the all-unread 'none' windows, which noneCount states separately. */
  level: number;
  /** all four lanes unread (the verdictNone state). */
  none: number;
  /** Beam-angle bands: 0 (level) · (0, 6] · (6, 10]. */
  beam: { level: number; mid: number; full: number };
  /** |net| === for+against — the one-sided full tip (the 10° band). */
  fullyTipped: number;
  /** Per lane: windows in which the lane's side is 'unread'. */
  laneUnread: Record<GoldLane, number>;
  /** Per lane: windows in which the lane is a SPLIT neutral (supports === pressures > 0). */
  laneSplit: Record<GoldLane, number>;
  /** C2's lane figure: median verdict (state) flips per 60 trading days. */
  flipsMedianPer60: number | null;
  /** C2's comparison figure: the same statistic on the 21-voter net sign. */
  netSignFlipsMedianPer60: number | null;
  /** C1 (not degenerate): level share <= 70% AND fully-tipped share <= 60%. */
  c1: boolean;
  /** C2 (smoother): lane flips median <= the 21-voter net-sign figure. */
  c2: boolean;
}

/**
 * The pre-registered calibration statistics over one window set. `balances`
 * and `netScores` must be aligned (one entry per window, chronological
 * order); the caller slices for the mature base. Pure; every field derives
 * from the inputs alone (no thresholds, no tuning).
 */
export function laneCalibrationStats(
  balances: readonly HarnessLaneBalance[],
  netScores: readonly number[],
): LaneCalibrationStats {
  const n = balances.length;
  let tippedFor = 0;
  let tippedAgainst = 0;
  let level = 0;
  let none = 0;
  let beamLevel = 0;
  let beamMid = 0;
  let beamFull = 0;
  let fullyTipped = 0;
  const laneUnread: Record<GoldLane, number> = { 'borrowing-costs': 0, dollar: 0, stress: 0, inflation: 0 };
  const laneSplit: Record<GoldLane, number> = { 'borrowing-costs': 0, dollar: 0, stress: 0, inflation: 0 };

  for (const b of balances) {
    if (b.state === 'tipped-for') tippedFor++;
    else if (b.state === 'tipped-against') tippedAgainst++;
    else if (b.state === 'none') {
      none++;
      level++;
    } else level++;
    if (b.beamAngle === 0) beamLevel++;
    else if (b.beamAngle <= 6) beamMid++;
    else beamFull++;
    if (b.fullyTipped) fullyTipped++;
    for (const l of b.lanes) {
      if (l.side === 'unread') laneUnread[l.lane]++;
      if (l.split) laneSplit[l.lane]++;
    }
  }

  const flipsMedianPer60 = medianFlipsPer60(balances.map((b) => b.state as string));
  const netSignFlipsMedianPer60 = medianFlipsPer60(netScores.map((s) => (s > 0 ? '+' : s < 0 ? '-' : '0')));

  const levelShare = n > 0 ? level / n : 1;
  const fullTipShare = n > 0 ? fullyTipped / n : 1;
  const c1 = n > 0 && levelShare <= LANE_CALIB_LEVEL_MAX_SHARE && fullTipShare <= LANE_CALIB_FULLTIP_MAX_SHARE;
  const c2 =
    flipsMedianPer60 !== null && netSignFlipsMedianPer60 !== null && flipsMedianPer60 <= netSignFlipsMedianPer60;

  return {
    n,
    tippedFor,
    tippedAgainst,
    level,
    none,
    beam: { level: beamLevel, mid: beamMid, full: beamFull },
    fullyTipped,
    laneUnread,
    laneSplit,
    flipsMedianPer60,
    netSignFlipsMedianPer60,
    c1,
    c2,
  };
}
