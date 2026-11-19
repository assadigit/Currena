/**
 * correlation.ts — GPE R22 / F11 (2026-11-19): the correlation
 * companion's pure computation — the mandated Zone K design's engine
 * (docs/specs/gold-page-elevation: s7/01 §3 in full · s7/03 §4.2 the
 * pre-registered-window registry · s8/01 R22).
 *
 * THE PRE-REGISTERED WINDOWS (S7-D7, LOCKED AT CP-C — binding; a change
 * is a recorded decision, never a silent re-tune):
 *   - the rolling correlation: 52-week rolling Pearson over weekly
 *     FRIDAY closes, LEVELS (not returns);
 *   - the display window: trailing 10 years (the honest render is the
 *     stored span — the S13-D1 posture: the free tier stores ~1 year of
 *     the gold leg today, the span named at point of use, self-widening);
 *   - gold = XAUUSD daily closes (EODHD — the R18 leg's own series);
 *   - real yield = the 10-year TIPS yield (DFII10 / Treasury-direct —
 *     the existing real-yield-10y series).
 *
 * The scatter stays rejected (s7/01 §3's weighed record — it compresses
 * time out of the relationship); the strip carries the quantitative
 * claim so the axes never argue causation. Fail-closed when either
 * series is stale (the universal rider, C6). Display-only — nothing
 * here joins the voter table.
 *
 * Platform-free (AGENTS.md rule 2): no fetch, no clock, no node:*.
 */

import type { GoldXauCandle } from '@currena/core';

/** The rolling-correlation window, in weekly Friday closes (registered). */
export const CORRELATION_WINDOW_WEEKS = 52;

/** The display window, in days (registered: trailing 10 years). */
export const CORRELATION_DISPLAY_DAYS = 3_653;

/** The staleness bound for either leg (calendar days past the last point). */
export const CORRELATION_STALE_AFTER_DAYS = 7;

/** The 2022 rotation marker — the reserve freeze (2022-02-24), the dated
 * fact s7/01 §3 annotates («چرخش خریدار ۲۰۲۲» / "2022: the buyer rotated"). */
export const ROTATION_DATE = '2022-02-24';

/** One daily observation of the joined pair. */
export interface CorrelationDailyPoint {
  date: string;
  gold: number;
  yield10y: number;
}

/** One weekly Friday-close sample (the registered sampling). */
export interface FridayClose {
  /** The week's Friday, YYYY-MM-DD (the sample's stamp). */
  friday: string;
  gold: number;
  yield10y: number;
}

/** One point of the 52-week rolling-correlation strip. */
export interface CorrelationStripPoint {
  /** The Friday the window ends on. */
  friday: string;
  /** The Pearson r over the trailing 52 weekly closes (levels). */
  r: number;
}

export interface CorrelationStaleness {
  /** The gold leg's last date + its age in days at the reference now. */
  gold: { last: string; ageDays: number };
  /** The yield leg's last date + its age in days. */
  yield10y: { last: string; ageDays: number };
  /** True when either leg is past the staleness bound (fail-closed). */
  stale: boolean;
}

/** The panel's full model, built over the two stored legs. */
export interface CorrelationPanel {
  /** The inner-joined daily pairs, ascending, sliced to the display
   *  window (min(stored span, trailing 10y) — the honest basis). */
  daily: CorrelationDailyPoint[];
  /** The Friday-close samples underlying the strip (same window). */
  fridays: FridayClose[];
  /** The computable strip points (empty when fewer than 52 pairs). */
  strip: CorrelationStripPoint[];
  /** The honest span the panel actually renders (named at point of use). */
  window: { from: string; to: string } | null;
  /** The 2022 marker's presence in the rendered window. */
  rotationInWindow: boolean;
  /** Staleness, honestly carried (the caller renders the fail-closed line). */
  staleness: CorrelationStaleness;
  /** How many MORE Friday pairs the strip needs before its first point
   *  (the R19 "no crossover in the stored window yet" honesty pattern). */
  fridaysUntilFirstStripPoint: number;
}

/* ------------------------------------------------------------------ *
 * The sampling (pure)
 * ------------------------------------------------------------------ */

function isoDate(epochDay: number): string {
  return new Date(epochDay * 86_400_000).toISOString().slice(0, 10);
}

function epochDayOf(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

/** The Friday (YYYY-MM-DD) of the ISO Mon–Sun week a date belongs to. */
export function fridayOf(date: string): string {
  const d = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  // 1970-01-01 was a Thursday: (day + 4) mod 7 maps it to 4. Sunday (0)
  // belongs to the week ENDING that day — its Friday is 2 days back, so
  // Sunday counts as the week's 7th day, never its 0th.
  const dow0 = ((d + 4) % 7 + 7) % 7; // 0=Sun, 1=Mon … 5=Fri, 6=Sat
  const dow = dow0 === 0 ? 7 : dow0;
  return isoDate(d - dow + 5);
}

/**
 * The weekly Friday-close samples of the joined daily pairs: one sample
 * per week, stamped with that week's FRIDAY, valued at the LAST close
 * ON OR BEFORE the Friday (a holiday Friday samples the week's latest
 * prior close — deterministic, and exactly what "weekly Friday closes"
 * means for a market with holidays; the methodology footer states the
 * sampling verbatim).
 */
export function fridayCloses(daily: readonly CorrelationDailyPoint[]): FridayClose[] {
  const byFriday = new Map<string, CorrelationDailyPoint>();
  for (const p of daily) {
    const friday = fridayOf(p.date);
    // Only bars dated ON OR BEFORE the week's Friday can sample the week
    // (a stray Saturday/Sunday bar belongs to a week whose Friday already
    // passed — it never re-values that week's close).
    if (p.date > friday) continue;
    const prior = byFriday.get(friday);
    if (prior === undefined || p.date > prior.date) byFriday.set(friday, p);
  }
  const out: FridayClose[] = [];
  for (const [friday, p] of byFriday) {
    out.push({ friday, gold: p.gold, yield10y: p.yield10y });
  }
  out.sort((a, b) => (a.friday < b.friday ? -1 : a.friday > b.friday ? 1 : 0));
  return out;
}

/* ------------------------------------------------------------------ *
 * The statistics (pure)
 * ------------------------------------------------------------------ */

/** The Pearson correlation of two equal-length samples (levels — the
 *  registered basis; returns were considered and NOT registered). */
export function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  const n = xs.length;
  if (n !== ys.length || n < 3) return null;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i += 1) {
    sx += xs[i]!;
    sy += ys[i]!;
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = xs[i]! - mx;
    const b = ys[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx <= 0 || dy <= 0) return null; // a flat sample carries no correlation — never a guess
  return num / Math.sqrt(dx * dy);
}

/** The 52-week rolling Pearson strip over the Friday-close levels — one
 *  point per week where the trailing window is full (the first point
 *  needs CORRELATION_WINDOW_WEEKS samples; fail-closed below that). */
export function rollingCorrelation(fridays: readonly FridayClose[]): CorrelationStripPoint[] {
  const out: CorrelationStripPoint[] = [];
  for (let i = CORRELATION_WINDOW_WEEKS; i <= fridays.length; i += 1) {
    const window = fridays.slice(i - CORRELATION_WINDOW_WEEKS, i);
    const r = pearson(window.map((f) => f.gold), window.map((f) => f.yield10y));
    if (r !== null) out.push({ friday: window[window.length - 1]!.friday, r });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The panel model (pure)
 * ------------------------------------------------------------------ */

/** Build the full panel model over the two stored legs. `nowMs` is the
 *  caller's clock (deterministic for a given now — the S13-D4 pattern).
 *  The gold leg is the R18 snapshot's series; the yield leg is the
 *  real-yield-10y history's [epochDay, value] pairs. */
export function correlationPanel(
  gold: readonly GoldXauCandle[],
  yieldPoints: readonly [number, number][],
  nowMs: number,
): CorrelationPanel | null {
  if (gold.length < 2 || yieldPoints.length < 2) return null;

  // The inner join on common dates (both legs must carry the day).
  const yieldByDay = new Map<number, number>();
  for (const [day, value] of yieldPoints) yieldByDay.set(day, value);
  const joined: CorrelationDailyPoint[] = [];
  for (const candle of gold) {
    const y = yieldByDay.get(epochDayOf(candle.date));
    if (y !== undefined) joined.push({ date: candle.date, gold: candle.close, yield10y: y });
  }

  const nowDay = Math.floor(nowMs / 86_400_000);
  const goldLast = gold[gold.length - 1]!.date;
  const yieldLastDate = yieldPoints[yieldPoints.length - 1]![0];
  const yieldLast = isoDate(yieldLastDate);
  const staleness: CorrelationStaleness = {
    gold: { last: goldLast, ageDays: nowDay - epochDayOf(goldLast) },
    yield10y: { last: yieldLast, ageDays: nowDay - yieldLastDate },
    stale: false,
  };
  staleness.stale =
    staleness.gold.ageDays > CORRELATION_STALE_AFTER_DAYS || staleness.yield10y.ageDays > CORRELATION_STALE_AFTER_DAYS;

  // The display window: trailing 10y from the join's last date, but never
  // wider than the stored span (the honest basis, named at point of use).
  if (joined.length < 2) {
    return {
      daily: [],
      fridays: [],
      strip: [],
      window: null,
      rotationInWindow: false,
      staleness,
      fridaysUntilFirstStripPoint: CORRELATION_WINDOW_WEEKS,
    };
  }
  const lastDate = joined[joined.length - 1]!.date;
  const windowFromDay = epochDayOf(lastDate) - CORRELATION_DISPLAY_DAYS;
  const daily = joined.filter((p) => epochDayOf(p.date) >= windowFromDay);
  const fridays = fridayCloses(daily);
  const strip = rollingCorrelation(fridays);
  return {
    daily,
    fridays,
    strip,
    window: { from: daily[0]!.date, to: lastDate },
    rotationInWindow: daily.length > 0 && daily[0]!.date <= ROTATION_DATE && lastDate >= ROTATION_DATE,
    staleness,
    fridaysUntilFirstStripPoint: Math.max(0, CORRELATION_WINDOW_WEEKS - fridays.length),
  };
}
