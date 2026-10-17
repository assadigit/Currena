/**
 * price-stats — client-side derived statistics for the prices board tiles
 * (owner's card redesign, 17 Oct 2026: "Daily / Weekly / Monthly / Quarterly
 * Percentages" + "more meta data facts and percentages" as bullet points).
 *
 * The FEED already carries change7d/change30d/change90d on every price
 * reading (verified against production 2026-10-17), so weekly/monthly/
 * quarterly render straight from the reading. What the feed does NOT carry
 * — the 1-day change and the bullet facts (6-month change, 1-year change,
 * the 52-week range) — is derived here from the SAME history endpoint the
 * sparklines fetch, with the same honesty rules the R30 derivation used:
 *
 *   - a window's reference point is the stored point NEAREST to N days
 *     back, and only when it is really NEAR (≤ 3 days): a sparse series
 *     must yield "absent", never one number stretched over every window;
 *   - everything is computed from the history series ALONE (last stored
 *     point vs an earlier stored point) — never the live value mixed with
 *     a stored one, so every number on the tile is internally consistent;
 *   - the "52-week" range is only NAMED when the window actually spans
 *     ≥ 300 days — a shorter window keeps the bullet off the card rather
 *     than mislabel a smaller span.
 *
 * Pure, platform-free. Tested in price-stats.test.ts.
 */

/** The derived statistics for one tile. Every field is honest-absent. */
export interface TileStats {
  /** 1-day change (the sketch's "daily %"). Absent when unmeasurable. */
  c1?: number;
  /** 7-day change — feed fallback only (the feed carries it today). */
  c7?: number;
  /** 30-day change — feed fallback only. */
  c30?: number;
  /** 90-day change — feed fallback only (the sketch's "quarterly %"). */
  c90?: number;
  /** ~6-month (182-day) change — a fact bullet. */
  c6m?: number;
  /** 1-year (365-day) change — a fact bullet. */
  c1y?: number;
  /** Lowest stored value of the last ~365 days — the 52-week range bullet. */
  low52?: number;
  /** Highest stored value of the last ~365 days. */
  high52?: number;
}

/** A history point as the history endpoint serves it (value may be null). */
export type HistoryPoint = readonly [number, number | null];

/** How far the "nearest point to N days back" may sit from the target. */
const DAY_TOLERANCE = 3;

/** The 52-week window must actually cover this many days to be named so. */
const MIN_52W_SPAN_DAYS = 300;

/** The ~6-month window in days. */
const DAYS_6M = 182;

/** The 1-year / 52-week window in days. */
const DAYS_1Y = 365;

/**
 * Derive one tile's statistics from its stored history series.
 * `points` are [dayNumber, value] pairs in ascending day order (any value
 * may be null); `changeKind` matches the indicator definition — prices
 * speak in percent, everything else in points.
 */
export function deriveTileStats(points: readonly HistoryPoint[], changeKind: 'pct' | 'points'): TileStats {
  const pts = points.filter((p): p is [number, number] => typeof p[1] === 'number');
  if (pts.length < 2) return {};
  const last = pts[pts.length - 1]!;

  // The nearest stored point to N days back — but only when it is really
  // near (≤3 days): a sparse series yields null, never a stretched number.
  // The LAST point itself is never a candidate: it is the reference the
  // windows measure FROM, and letting it stand in for "N days back" would
  // fabricate a 0% change out of a missing window.
  const pick = (back: number): [number, number] | null => {
    const target = last[0] - back;
    let best: [number, number] | null = null;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p = pts[i]!;
      if (best === null || Math.abs(p[0] - target) < Math.abs(best[0] - target)) best = p;
    }
    return best !== null && Math.abs(best[0] - target) <= DAY_TOLERANCE ? best : null;
  };

  // The change from `then` to the last point, in the series' own units.
  const conv = (then: [number, number] | null): number | undefined => {
    if (!then || then[1] === 0 || last[1] === undefined) return undefined;
    return changeKind === 'pct' ? ((last[1] - then[1]) / then[1]) * 100 : last[1] - then[1];
  };

  const stats: TileStats = {
    c1: conv(pick(1)),
    c7: conv(pick(7)),
    c30: conv(pick(30)),
    c90: conv(pick(90)),
    c6m: conv(pick(DAYS_6M)),
    c1y: conv(pick(DAYS_1Y)),
  };

  // The 52-week range: min/max over the last ~365 days — but only when the
  // stored window really spans that span (a 3-month-old series is not a
  // "52-week range", however honestly it was measured).
  let low52: number | undefined;
  let high52: number | undefined;
  let oldest: number | undefined;
  for (const p of pts) {
    if (p[0] < last[0] - DAYS_1Y) continue;
    if (oldest === undefined) oldest = p[0];
    low52 = low52 === undefined || p[1] < low52 ? p[1] : low52;
    high52 = high52 === undefined || p[1] > high52 ? p[1] : high52;
  }
  if (low52 !== undefined && high52 !== undefined && oldest !== undefined && last[0] - oldest >= MIN_52W_SPAN_DAYS) {
    stats.low52 = low52;
    stats.high52 = high52;
  }
  return stats;
}
