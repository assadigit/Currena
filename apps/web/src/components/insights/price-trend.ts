/**
 * price-trend — the seven-day trend story for the prices board tiles
 * (financial-asset-cards spec pack, 04-data-trend-and-sparkline-spec.md).
 *
 * The card's PRIMARY movement display is a seven-day window computed from
 * the SAME stored history endpoint the details panel charts fetch — real
 * observations only, never a synthetic point or a flat placeholder line.
 *
 * WINDOW CONVENTION (documented, spec 04 §3): seven calendar days ending
 * at the latest stored observation. The reference point is the last
 * observation AT OR BEFORE (latest − 7 days), accepted only when it sits
 * within a 3-day tolerance — the SAME convention the API's `change7d`
 * uses (pointAtOrBefore + CHANGE7D_TOLERANCE_DAYS = 3), so the chart and
 * the percentage beside it share exact boundaries and the number agrees
 * with the feed's semantics.
 *
 * HONESTY RULES (inherited from price-stats.ts, the R30 derivation):
 *  - every value is computed from the stored history ALONE;
 *  - a sparse series yields "absent", never a number stretched over the
 *    gap — a missing window is a missing window;
 *  - invalid/non-finite values and duplicate days are cleaned before use
 *    (last observation wins per day — revisions);
 *  - a stale or unavailable reading contributes NO trend story: the
 *    window would describe an old market as if it were current.
 *
 * Pure, platform-free. Tested in price-trend.test.ts.
 */

import type { HistoryPoint } from './price-stats';

/* ------------------------------------------------------------------ *
 * The seven-day window
 * ------------------------------------------------------------------ */

/** One validated daily observation (days since epoch, ascending). */
export interface TrendPoint {
  day: number;
  value: number;
}

/** The trend classification — the documented method (see classifyTrend). */
export type TrendState = 'up' | 'down' | 'range' | 'mixed' | 'insufficient';

/** A computed seven-day window. Every field is honest — or absent. */
export interface TrendWindow {
  /** The real observations inside [startDay, endDay], ascending. */
  points: TrendPoint[];
  startDay: number;
  endDay: number;
  /** (end / start − 1) × 100 — undefined when not measurable. */
  netPct: number | undefined;
  trend: TrendState;
  /** True when the window is short or sparse — disclosed, never hidden. */
  incomplete: boolean;
}

/** How far the reference point may sit from its target day (same as the API). */
const DAY_TOLERANCE = 3;

/** The window length in calendar days. */
const WINDOW_7D = 7;

/** A window whose span is shorter than this is flagged incomplete. */
const MIN_WINDOW_SPAN_DAYS = 6;

/* ------------------------------------------------------------------ *
 * The documented trend classification thresholds
 * ------------------------------------------------------------------ */

/** Minimum valid observations before any trend claim is made. */
const MIN_TREND_POINTS = 4;

/** |net| ≥ this percent (window start → end) counts as a directional move. */
const NET_DIRECTIONAL_PCT = 1.0;

/** Within a weak net, a traveled range ≥ this percent reads as "mixed". */
const MIXED_RANGE_PCT = 3.0;

/** Direction is claimed only when the net move is at least this share of
 * the path's total traveled range — a net that its own swings dwarf is
 * not a clear direction. */
const NET_DOMINANCE_SHARE = 0.5;

/** Clean the raw history: nulls/non-finite values drop, duplicates keep the
 * last observation (revisions), ascending by day. Prices must be positive. */
export function cleanPriceSeries(raw: readonly HistoryPoint[]): TrendPoint[] {
  const byDay = new Map<number, number>();
  for (const p of raw) {
    const day = p[0];
    const value = p[1];
    if (!Number.isInteger(day) || day < 0) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue;
    byDay.set(day, value);
  }
  return [...byDay.entries()]
    .map(([day, value]) => ({ day, value }))
    .sort((a, b) => a.day - b.day);
}

/** Percent change `then → now`, undefined when not measurable. */
function pctChange(now: number, then: number): number | undefined {
  if (!(then > 0) || !Number.isFinite(now) || !Number.isFinite(then)) return undefined;
  return ((now - then) / then) * 100;
}

/**
 * The seven-day window (see module doc). Returns null when no honest
 * window exists (empty series, or no reference point within tolerance).
 */
export function window7d(points: readonly TrendPoint[]): TrendWindow | null {
  const pts = points;
  if (pts.length < 2) return null;
  const last = pts[pts.length - 1]!;

  // Reference: the last point AT OR BEFORE (latest − 7 days)…
  const target = last.day - WINDOW_7D;
  let ref: TrendPoint | null = null;
  for (const p of pts) {
    if (p.day <= target) ref = p;
    else break;
  }
  // …accepted only within the 3-day tolerance, and never the last point itself.
  if (!ref || ref.day === last.day || target - ref.day > DAY_TOLERANCE) return null;

  const inWindow = pts.filter((p) => p.day >= ref!.day);
  if (inWindow.length < 2) return null;

  const netPct = pctChange(last.value, ref.value);
  const span = last.day - ref.day;

  return {
    points: inWindow,
    startDay: ref.day,
    endDay: last.day,
    netPct,
    trend: classifyTrend(inWindow, netPct),
    incomplete: span < MIN_WINDOW_SPAN_DAYS || inWindow.length < MIN_TREND_POINTS,
  };
}

/**
 * The documented trend classification (spec 04 §5 — a trend label must
 * come from a documented method; these thresholds are deliberately
 * simple, conservative, and testable):
 *
 *  1. Fewer than MIN_TREND_POINTS observations ⇒ 'insufficient' — no claim.
 *  2. |net| < NET_DIRECTIONAL_PCT ⇒ the net is weak: 'range' when the path
 *     is also calm (< MIXED_RANGE_PCT), 'mixed' when swings ≥ 3% cancel
 *     out ("no clear direction is evident").
 *  3. |net| ≥ NET_DIRECTIONAL_PCT ⇒ directional (up/down) only when the
 *     net move dominates the path — |net| ≥ NET_DOMINANCE_SHARE × the
 *     traveled range. A net that the window's own swings dwarf is 'mixed',
 *     not a direction (a −1% week inside a ±3% chop is not "downward").
 *
 * A trend label describes THIS window only. It is never a forecast.
 */
export function classifyTrend(points: readonly TrendPoint[], netPct: number | undefined): TrendState {
  if (points.length < MIN_TREND_POINTS || netPct === undefined) return 'insufficient';

  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    if (p.value < min) min = p.value;
    if (p.value > max) max = p.value;
  }
  const start = points[0]!.value;
  const pathRangePct = start > 0 ? ((max - min) / start) * 100 : 0;

  if (Math.abs(netPct) < NET_DIRECTIONAL_PCT) {
    return pathRangePct >= MIXED_RANGE_PCT ? 'mixed' : 'range';
  }
  if (Math.abs(netPct) >= NET_DOMINANCE_SHARE * Math.max(pathRangePct, Math.abs(netPct))) {
    return netPct > 0 ? 'up' : 'down';
  }
  return 'mixed';
}

/* ------------------------------------------------------------------ *
 * The evidence-based briefing (spec 03 — deterministic templates only)
 * ------------------------------------------------------------------ */

/** Which hedged template family an asset's briefing uses. */
export type BriefingKind = 'plain' | 'volatile' | 'oil-drivers';

/** The briefing kind per prices-board asset. Bitcoin is the volatile
 * asset; Brent quotes oil (the drivers-evidence caveat applies). */
export const BRIEFING_KIND: Record<string, BriefingKind> = {
  'gold-usd': 'plain',
  'silver-usd': 'plain',
  brent: 'oil-drivers',
  'btc-usd': 'volatile',
};

/** What the briefing rule needs from the card. */
export interface BriefingInput {
  asset: string;
  subject: string;
  trend: TrendState | null;
  /** True when the reading itself is stale (the summary is qualified). */
  stale: boolean;
  /** True when history exists but yields no usable window. */
  historyUnavailable: boolean;
}

/** The copy templates the briefing interpolates (both dictionaries). */
export interface BriefingCopy {
  sumUp: string;
  sumDown: string;
  sumRange: string;
  sumMixed: string;
  sumHedge: string;
  sumBtcHedge: string;
  sumBtcMixed: string;
  sumOilDrivers: string;
  sumUnavailable: string;
  dataDelayed: string;
}

/** {token} interpolation — never concatenate translated fragments. */
export function interpolateBriefing(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
}

/**
 * The one- or two-sentence briefing. Deterministic templates only —
 * observed movement + an explicit hedge; a possible driver is never named
 * (the app holds no corroborating driver data on these cards, so none is
 * invented). Volatile assets (Bitcoin) get the volatility-aware wording,
 * and a move is never described as "fluctuating" unless the window really
 * is mixed. Stale data qualifies the whole summary. No causal claims, no
 * forecasts, no probabilities, no buy/sell wording (spec 03 §1, §4).
 */
export function briefingText(input: BriefingInput, copy: BriefingCopy): string {
  if (input.trend === null || input.trend === 'insufficient') {
    return copy.sumUnavailable;
  }

  const s = input.subject;
  const kind = BRIEFING_KIND[input.asset] ?? 'plain';
  let first: string;
  let second: string | null = null;

  switch (input.trend) {
    case 'up':
      first = interpolateBriefing(copy.sumUp, { asset: s });
      second = copy.sumHedge;
      break;
    case 'down':
      first = interpolateBriefing(copy.sumDown, { asset: s });
      second = copy.sumHedge;
      break;
    case 'range':
      first = interpolateBriefing(copy.sumRange, { asset: s });
      break;
    case 'mixed':
    default:
      first = interpolateBriefing(copy.sumMixed, { asset: s });
      break;
  }

  // Volatile assets (Bitcoin): the volatility-aware hedge — and the word
  // "fluctuated" only when the window really is mixed (spec 03 §3).
  if (kind === 'volatile') {
    if (input.trend === 'mixed') {
      first = interpolateBriefing(copy.sumBtcMixed, { asset: s });
    }
    second = copy.sumBtcHedge;
  }

  // Oil: an explicit evidence caveat instead of an invented driver story.
  if (kind === 'oil-drivers' && (input.trend === 'up' || input.trend === 'down')) {
    second = copy.sumOilDrivers;
  }

  let out = second !== null ? `${first} ${second}` : first;
  if (input.stale) {
    out = `${out} ${copy.dataDelayed}`;
  }
  return out;
}
