/**
 * real-yield-fill.ts — the bounded DGS10 − T10YIE cross-fill for the
 * real-yield-10y SCORING input (Session 3, GOLD_FRED_GAPFILL_SPEC.md §2 G1b,
 * decision D-6).
 *
 * DGS10 − T10YIE is a second measurement of the same object as DFII10 — on
 * the audit's evidence (2026-10-30, the stored stage series) the two agree
 * EXACTLY on all 2,524 common days of the last decade (max |diff| 0.0000:
 * FRED derives DFII10 from the nominal minus the breakeven). The cross-fill
 * uses that identity to add DENSITY inside the decade window when DFII10's
 * own fetch lags or fails while both legs arrived (e.g. the Session-3 trio
 * split's DFII10 group failing while the nominal pair's group and the
 * breakevens' decade group succeeded).
 *
 * THE HONESTY RULES (the spec's own, enforced here):
 *  - The fill happens ONLY at the scoring-input assembly (the reading's
 *    value/change/percentile math). The STORED HISTORY, the chart, the
 *    peaks and the highest-since math all keep the PURE DFII10 series —
 *    fills never reach KV (the caller guarantees it; run.ts's wiring).
 *  - Fill ONLY days inside the decade window (PERCENTILE_WINDOW_DAYS, the
 *    percentile base's own window) where DFII10 is absent and BOTH legs
 *    are present on that exact date.
 *  - NEVER extend backwards: the fill's dates are also bounded at
 *    2003-01-02, the pair's own first observation (the same wall DFII10
 *    has — the fill adds DENSITY, not DEPTH).
 *  - COUNTED ALOUD: the caller logs the fill count in the ingest report
 *    (`realYieldFill: N`) — never silent.
 *  - CAPPED: if the fillable set exceeds ~5% of the window's observations,
 *    DFII10 is treated as DEGRADED — no fills are applied at all and the
 *    reading ages through the normal stale path, instead of quietly
 *    half-filling a broken series.
 *
 * Pure, platform-free (AGENTS.md rule 2). Tested in real-yield-fill.test.ts.
 */

import type { SeriesPoint } from './series';
import { addDays, epochDay } from './series';
import { PERCENTILE_WINDOW_DAYS } from './scoring';

/** The pair's first observation date on FRED — the fill never reaches past it. */
export const REAL_YIELD_FILL_NOT_BEFORE = '2003-01-02';

/**
 * The degraded cap: fills may not exceed this share of the window's
 * observations (pure points in window + fills). Above it the series is
 * treated as broken, not gappy — no fill.
 */
export const REAL_YIELD_FILL_CAP = 0.05;

/** What the assembly learned (the caller reports the count aloud). */
export interface RealYieldFillResult {
  /**
   * The scoring-input series (pure DFII10 + the fills), or undefined when
   * there is no pure series at all — the caller then scores nothing (the
   * reading reads unavailable through the normal path).
   */
  series: SeriesPoint[] | undefined;
  /** How many days the cross-fill ADDED (0 on a healthy day — the audit's finding; 0 when capped). */
  fills: number;
  /** How many days were FILLABLE (the candidate count, reported even when the cap rejects them). */
  fillable: number;
  /** True when the fillable set exceeded the cap: DFII10 treated as degraded, no fills applied. */
  capped: boolean;
}

/**
 * Build the real-yield scoring input: the pure DFII10 series with the
 * DGS10 − T10YIE cross-fill applied inside the decade window. When there
 * is nothing to fill (or the cap fired) the returned series is a plain
 * copy of the pure series — `fills === 0` always means "the pure series
 * stands as-is".
 */
export function realYieldScoringSeries(
  pure: readonly SeriesPoint[] | undefined,
  dgs10: readonly SeriesPoint[] | undefined,
  t10yie: readonly SeriesPoint[] | undefined,
  now: string,
): RealYieldFillResult {
  if (pure === undefined || pure.length === 0 || dgs10 === undefined || t10yie === undefined) {
    return { series: pure === undefined ? undefined : [...pure], fills: 0, fillable: 0, capped: false };
  }

  // The fill window: the percentile base's own decade window, anchored on
  // today (the same anchor computeReading uses), floored at 2003-01-02.
  const today = now.slice(0, 10);
  const windowStart = addDays(today, -PERCENTILE_WINDOW_DAYS);
  const windowFloor = windowStart > REAL_YIELD_FILL_NOT_BEFORE ? windowStart : REAL_YIELD_FILL_NOT_BEFORE;
  const windowStartDay = epochDay(windowFloor);
  const todayDay = epochDay(today);

  // The fill candidates: exact-date inner join of the two legs, on days the
  // pure series lacks, inside the window.
  const pureDays = new Set(pure.map((p) => epochDay(p.date)));
  const t10yieByDay = new Map<number, number>();
  for (const p of t10yie) t10yieByDay.set(epochDay(p.date), p.value);

  const candidates: SeriesPoint[] = [];
  for (const p of dgs10) {
    const day = epochDay(p.date);
    if (day < windowStartDay || day > todayDay) continue;
    if (pureDays.has(day)) continue;
    const be = t10yieByDay.get(day);
    if (be === undefined) continue;
    // F4 quantization discipline: raw subtraction prints float noise
    // (2.6699999999999997); the other points-based derived gaps quantize
    // to 4 decimals — the fill values do the same.
    candidates.push({ date: p.date, value: Math.round((p.value - be) * 1e4) / 1e4 });
  }

  if (candidates.length === 0) {
    return { series: [...pure], fills: 0, fillable: 0, capped: false };
  }

  // The cap: the fillable set against the window's observations (the pure
  // points inside the window + the fills themselves).
  const pureInWindow = pure.filter((p) => {
    const d = epochDay(p.date);
    return d >= windowStartDay && d <= todayDay;
  }).length;
  if (candidates.length / (pureInWindow + candidates.length) > REAL_YIELD_FILL_CAP) {
    return { series: [...pure], fills: 0, fillable: candidates.length, capped: true };
  }

  // Merge (the pure series wins on its own dates by construction — the
  // candidates only carry days it lacks) and keep ascending order.
  const merged = [...pure, ...candidates].sort((a, b) => epochDay(a.date) - epochDay(b.date));
  return { series: merged, fills: candidates.length, fillable: candidates.length, capped: false };
}
