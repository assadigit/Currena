/**
 * ta-levels.ts — GPE R19 / F8 (2026-11-18): the minimal TA band's pure
 * computation — SMA 20/50/100/200, the distance-from-200DMA decile, the
 * dated 50/200 cross events, and the classic daily/weekly pivots
 * (docs/specs/gold-page-elevation: s1/13 §2–§3 the D8 scope · s6/02 C5
 * the honesty rules · s6/03 zone H's module naming · s8/01 R19).
 *
 * PURE over the R18 OHLC leg (the XAUUSD daily bars) — imported by the
 * SPA (the gold-balance/narrative precedent: one series, one engine, no
 * arithmetic in components). Every rule the C5 family binds:
 *   1. every level is a DESCRIPTIVE reference (the components carry the
 *      "not a guarantee" labels — this module computes, never judges);
 *   2. crossovers are DATED EVENTS with what followed INCLUDING the
 *      whipsaws (the followedBy20d move is stated signed, never worded);
 *   3. the decile treatment anchors the band in the page's statistical
 *      framework — the SAME percentileOf the meter's voters use
 *      (imported, never restated), computed over the stored basis with
 *      the basis window carried out for the honest sentence (S13-D1:
 *      the free tier stores ~1 year today; the basis self-widens when
 *      the plan does);
 *   4. display-only — no output here joins the 37-voter meter;
 *   5. classic pivots ONLY (P = (H+L+C)/3 family) — the s1/13 §4 scope
 *      guard; the variants stay out by construction (nothing here
 *      computes them).
 *
 * Platform-free (AGENTS.md rule 2): no fetch, no clock, no node:*.
 */

import type { GoldXauCandle } from '@currena/core';
import { percentileOf } from '../../shared/scoring';

/* ------------------------------------------------------------------ *
 * The SMA family (s1/13 §2)
 * ------------------------------------------------------------------ */

/** The four standard windows the D8 scope ships (a deliberate subset — «چهار بازهٔ استاندارد»). */
export type TaWindow = 20 | 50 | 100 | 200;
export const TA_WINDOWS: readonly TaWindow[] = [20, 50, 100, 200];

/** The simple moving average of the last `window` closes ending at
 * `end` (inclusive) — null when fewer than `window` bars exist. */
export function smaAt(closes: readonly number[], window: TaWindow, end: number): number | null {
  if (end + 1 < window) return null;
  let sum = 0;
  for (let i = end - window + 1; i <= end; i += 1) sum += closes[i]!;
  return sum / window;
}

/** One SMA reference row — the LATEST average for its window. */
export interface TaSmaRow {
  window: TaWindow;
  /** The date the average ends on (the last bar's date). */
  date: string;
  value: number;
}

/** The latest SMA per window, in TA_WINDOWS order — a window with
 * insufficient history is simply absent (fail-closed, never a guess). */
export function smaRows(series: readonly GoldXauCandle[]): TaSmaRow[] {
  const closes = series.map((c) => c.close);
  const out: TaSmaRow[] = [];
  for (const window of TA_WINDOWS) {
    const value = smaAt(closes, window, closes.length - 1);
    if (value !== null) {
      out.push({ window, date: series[series.length - 1]!.date, value });
    }
  }
  return out;
}

/** One point of a trailing SMA series (the chart overlay's data). */
export interface TaSmaPoint {
  date: string;
  value: number;
}

/** The full trailing SMA series for one window (for the F7 chart's DMA
 * overlay lines — one point per bar where the window has enough
 * history). */
export function smaSeries(series: readonly GoldXauCandle[], window: TaWindow): TaSmaPoint[] {
  const closes = series.map((c) => c.close);
  const out: TaSmaPoint[] = [];
  let sum = 0;
  for (let i = 0; i < closes.length; i += 1) {
    sum += closes[i]!;
    if (i >= window) sum -= closes[i - window]!;
    if (i + 1 >= window) out.push({ date: series[i]!.date, value: sum / window });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The distance-from-200DMA decile (C5 rule 3 — the page's
 * statistical grammar applied to the classic trend gauge)
 * ------------------------------------------------------------------ */

export interface TaDistance {
  /** (lastClose − SMA200) / SMA200, as a percent. */
  pct: number;
  /** The SMA200 the distance is measured from. */
  sma200: number;
  /** The date the SMA200 ends on. */
  date: string;
  /**
   * The current distance's percentile among the stored basis (the same
   * percentileOf the voters use — strictly-below share, base EXCLUDING
   * the current point). Null when the basis is too small to speak.
   */
  decile: number | null;
  /** The honest basis window the decile was computed over (null with the decile). */
  basis: { from: string; to: string; points: number } | null;
}

/** The minimum basis points before the decile speaks (a single-point
 * "percentile" is noise, not statistics). */
export const TA_DECILE_MIN_BASE = 30;

/**
 * The distance from the 200-day average, with its decile over the
 * stored basis. The basis is the distance series at every bar where the
 * SMA200 exists, EXCLUDING the current point (the meter's own
 * percentile-base convention) — the window the rendered sentence must
 * name (S13-D1's honest-basis posture).
 */
export function distanceFromSma200(series: readonly GoldXauCandle[]): TaDistance | null {
  const closes = series.map((c) => c.close);
  const last = closes.length - 1;
  const sma200 = smaAt(closes, 200, last);
  if (sma200 === null || sma200 <= 0) return null;
  const pct = ((closes[last]! - sma200) / sma200) * 100;

  // The distance series at every SMA200-eligible bar (the current point
  // excluded from the base — the scoring convention).
  const baseDates: string[] = [];
  const baseValues: number[] = [];
  for (let i = 199; i < last; i += 1) {
    const sma = smaAt(closes, 200, i);
    if (sma === null || sma <= 0) continue;
    baseDates.push(series[i]!.date);
    baseValues.push(((closes[i]! - sma) / sma) * 100);
  }
  if (baseValues.length < TA_DECILE_MIN_BASE) {
    return { pct, sma200, date: series[last]!.date, decile: null, basis: null };
  }
  return {
    pct,
    sma200,
    date: series[last]!.date,
    decile: percentileOf(baseValues, pct),
    basis: {
      from: baseDates[0]!,
      to: baseDates[baseDates.length - 1]!,
      points: baseValues.length,
    },
  };
}

/* ------------------------------------------------------------------ *
 * The dated 50/200 cross events (C5 rule 2 — events, never signals)
 * ------------------------------------------------------------------ */

export interface TaCross {
  /** The bar date the 50-day average crossed the 200-day average. */
  date: string;
  kind: 'golden' | 'death';
  /**
   * The close's percent move over the following 20 BARS (null when the
   * stored window ends first — the honest truncation). Stated signed,
   * whipsaws included: a cross that preceded an adverse move renders
   * exactly that.
   */
  followedBy20d: number | null;
}

/**
 * Every 50/200 crossover in the stored window, newest first — the dated
 * events list with what followed. A cross is the first bar where the
 * two averages' comparison flips (the averages are computed on complete
 * windows only — the same smaAt).
 */
export function crossEvents(series: readonly GoldXauCandle[]): TaCross[] {
  const closes = series.map((c) => c.close);
  const out: TaCross[] = [];
  let prev: 'golden' | 'death' | null = null;
  for (let i = 199; i < closes.length; i += 1) {
    const fast = smaAt(closes, 50, i);
    const slow = smaAt(closes, 200, i);
    if (fast === null || slow === null) continue;
    const side: 'golden' | 'death' = fast > slow ? 'golden' : 'death';
    if (prev !== null && side !== prev) {
      const followedBy20d = i + 20 < closes.length ? ((closes[i + 20]! - closes[i]!) / closes[i]!) * 100 : null;
      out.push({ date: series[i]!.date, kind: side, followedBy20d });
    }
    prev = side;
  }
  return out.reverse(); // newest first
}

/* ------------------------------------------------------------------ *
 * The classic pivots (s1/13 §3 — the standard formulas ONLY)
 * ------------------------------------------------------------------ */

export interface TaPivotSet {
  /** The label date of the reference bar(s) the levels derive from. */
  date: string;
  /** The prior session's OHLC the arithmetic reads (disclosed per C1). */
  high: number;
  low: number;
  close: number;
  pp: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

/** The classic pivot arithmetic: P = (H+L+C)/3; R1 = 2P−L; S1 = 2P−H;
 * R2 = P+(H−L); S2 = P−(H−L); R3 = H+2(P−L); S3 = L−2(H−P). */
function classicPivotArithmetic(bar: { date: string; high: number; low: number; close: number }): TaPivotSet {
  const { high: h, low: l, close: c } = bar;
  const pp = (h + l + c) / 3;
  return {
    date: bar.date,
    high: h,
    low: l,
    close: c,
    pp,
    r1: 2 * pp - l,
    s1: 2 * pp - h,
    r2: pp + (h - l),
    s2: pp - (h - l),
    r3: h + 2 * (pp - l),
    s3: l - 2 * (h - pp),
  };
}

/** Yesterday's classic pivots (the previous bar's OHLC). */
export function classicDailyPivots(series: readonly GoldXauCandle[]): TaPivotSet | null {
  if (series.length < 2) return null;
  return classicPivotArithmetic(series[series.length - 2]!);
}

/** The Monday a date's ISO week starts on (UTC). */
function isoWeekStart(dateStr: string): number {
  const ms = Date.parse(`${dateStr}T00:00:00Z`);
  const d = new Date(ms);
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const shift = day === 0 ? -6 : 1 - day; // back to this week's Monday
  return ms + shift * 86_400_000;
}

/**
 * The bars of the PREVIOUS completed ISO week (the week before the last
 * bar's week), aggregated — the classic weekly pivots' input. Null when
 * the stored window carries none of that week (fail-closed).
 */
export function previousWeekBars(series: readonly GoldXauCandle[]): GoldXauCandle[] | null {
  if (series.length === 0) return null;
  const lastWeekStart = isoWeekStart(series[series.length - 1]!.date);
  const prevWeekStart = lastWeekStart - 7 * 86_400_000;
  const prevWeekEnd = prevWeekStart + 6 * 86_400_000;
  const bars = series.filter((c) => {
    const ms = Date.parse(`${c.date}T00:00:00Z`);
    return ms >= prevWeekStart && ms <= prevWeekEnd;
  });
  if (bars.length === 0) return null;
  return bars;
}

/** The previous week's classic pivots (the aggregate OHLC of that week). */
export function classicWeeklyPivots(series: readonly GoldXauCandle[]): TaPivotSet | null {
  const bars = previousWeekBars(series);
  if (bars === null) return null;
  const high = Math.max(...bars.map((b) => b.high));
  const low = Math.min(...bars.map((b) => b.low));
  const close = bars[bars.length - 1]!.close;
  return classicPivotArithmetic({ date: bars[0]!.date, high, low, close });
}
