/**
 * The TA band's pure computation — ported from the upstream Currena
 * monorepo (packages/insights/src/domains/gold/ta-levels.ts, GPE R19/F8,
 * commit e45397b) so the deployed gold page carries the same technical-
 * analysis numbers the site's previous version carried: SMA 20/50/100/200,
 * the distance-from-200DMA decile, the dated 50/200 cross events, and the
 * classic daily/weekly pivots.
 *
 * The C5 honesty rules ride along verbatim: every level is a DESCRIPTIVE
 * reference (never a guarantee); crossovers are DATED EVENTS with what
 * followed, whipsaws included; the decile is the strictly-below share over
 * the stored basis with the basis window carried out (S13-D1's honest
 * posture — the stored span is named, and it self-widens when the source
 * plan does); display-only — nothing here joins the 37-voter meter; and
 * classic pivots ONLY (P = (H+L+C)/3 family).
 *
 * Platform-free: no fetch, no clock, no node:* (the routes own those).
 */

/** One daily OHLC bar of the XAUUSD series (the upstream leg's shape). */
export interface GoldXauCandle {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

/* ------------------------------------------------------------------ *
 * The percentile (the meter's own convention — strictly-below share)
 * ------------------------------------------------------------------ */

export function percentileOf(base: readonly number[], value: number): number {
  if (base.length === 0) return 0;
  let below = 0;
  for (const v of base) if (v < value) below++;
  return below / base.length;
}

/* ------------------------------------------------------------------ *
 * The SMA family
 * ------------------------------------------------------------------ */

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

/** The latest SMA per window, in TA_WINDOWS order (fail-closed when a
 * window lacks history). */
export function smaRows(series: readonly GoldXauCandle[]): Array<{ window: TaWindow; date: string; value: number }> {
  const closes = series.map((c) => c.close);
  const out: Array<{ window: TaWindow; date: string; value: number }> = [];
  for (const window of TA_WINDOWS) {
    const value = smaAt(closes, window, closes.length - 1);
    if (value !== null) out.push({ window, date: series[series.length - 1]!.date, value });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The distance-from-200DMA decile
 * ------------------------------------------------------------------ */

export interface TaDistance {
  pct: number;
  sma200: number;
  date: string;
  decile: number | null;
  basis: { from: string; to: string; points: number } | null;
}

export const TA_DECILE_MIN_BASE = 30;

export function distanceFromSma200(series: readonly GoldXauCandle[]): TaDistance | null {
  const closes = series.map((c) => c.close);
  const last = closes.length - 1;
  const sma200 = smaAt(closes, 200, last);
  if (sma200 === null || sma200 <= 0) return null;
  const pct = ((closes[last]! - sma200) / sma200) * 100;

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
 * The dated 50/200 cross events
 * ------------------------------------------------------------------ */

export interface TaCross {
  date: string;
  kind: "golden" | "death";
  followedBy20d: number | null;
}

export function crossEvents(series: readonly GoldXauCandle[]): TaCross[] {
  const closes = series.map((c) => c.close);
  const out: TaCross[] = [];
  let prev: "golden" | "death" | null = null;
  for (let i = 199; i < closes.length; i += 1) {
    const fast = smaAt(closes, 50, i);
    const slow = smaAt(closes, 200, i);
    if (fast === null || slow === null) continue;
    const side: "golden" | "death" = fast > slow ? "golden" : "death";
    if (prev !== null && side !== prev) {
      const followedBy20d = i + 20 < closes.length ? ((closes[i + 20]! - closes[i]!) / closes[i]!) * 100 : null;
      out.push({ date: series[i]!.date, kind: side, followedBy20d });
    }
    prev = side;
  }
  return out.reverse(); // newest first
}

/* ------------------------------------------------------------------ *
 * The classic pivots (the standard formulas only)
 * ------------------------------------------------------------------ */

export interface TaPivotSet {
  date: string;
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

/** The previous session's classic pivots — the last stored completed bar. */
export function classicDailyPivots(series: readonly GoldXauCandle[]): TaPivotSet | null {
  if (series.length < 2) return null;
  return classicPivotArithmetic(series[series.length - 1]!);
}

/** The Monday a date's ISO week starts on (UTC). */
function isoWeekStart(dateStr: string): number {
  const ms = Date.parse(`${dateStr}T00:00:00Z`);
  const d = new Date(ms);
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const shift = day === 0 ? -6 : 1 - day; // back to this week's Monday
  return ms + shift * 86_400_000;
}

/** The Monday of the ISO week containing an instant (UTC). */
function isoWeekStartOfMs(ms: number): number {
  const d = new Date(ms);
  const day = d.getUTCDay();
  const shift = day === 0 ? -6 : 1 - day;
  return ms - (ms % 86_400_000) + shift * 86_400_000;
}

/** The bars of the PREVIOUS completed ISO week relative to `nowMs`. */
export function previousWeekBars(series: readonly GoldXauCandle[], nowMs?: number): GoldXauCandle[] | null {
  if (series.length === 0) return null;
  const lastWeekStart = isoWeekStart(series[series.length - 1]!.date);
  const currentWeekStart = nowMs === undefined ? null : isoWeekStartOfMs(nowMs);
  const prevWeekStart =
    currentWeekStart !== null && lastWeekStart < currentWeekStart
      ? lastWeekStart // the last bar's week already completed → it IS the previous week
      : lastWeekStart - 7 * 86_400_000; // the last bar's week is current (or future) → the one before it
  const prevWeekEnd = prevWeekStart + 6 * 86_400_000;
  const bars = series.filter((c) => {
    const ms = Date.parse(`${c.date}T00:00:00Z`);
    return ms >= prevWeekStart && ms <= prevWeekEnd;
  });
  if (bars.length === 0) return null;
  return bars;
}

/** The previous completed week's classic pivots (the aggregate OHLC of
 * that week), relative to `nowMs`. */
export function classicWeeklyPivots(series: readonly GoldXauCandle[], nowMs?: number): TaPivotSet | null {
  const bars = previousWeekBars(series, nowMs);
  if (bars === null) return null;
  const high = Math.max(...bars.map((b) => b.high));
  const low = Math.min(...bars.map((b) => b.low));
  const close = bars[bars.length - 1]!.close;
  return classicPivotArithmetic({ date: bars[0]!.date, high, low, close });
}
