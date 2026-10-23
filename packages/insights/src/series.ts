/**
 * Canonical time series for Insights — the shape every parser, the scoring
 * engine and the future I2 adapters exchange. Platform-free (AGENTS.md rule 2).
 */

export interface SeriesPoint {
  /** Observation date, YYYY-MM-DD (ISO calendar date, no time part). */
  date: string;
  /** The observed value. Parsers drop missing markers (FRED '.', WB '…'). */
  value: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * 2026-10-23 CPU round (the 20:10 UTC sweep died `exceededCpu` at exactly
 * 2050 ms — the M1† cache left only ~220 ms of headroom and run-to-run
 * variance ate it): epochDay was the top self-time function of the whole
 * ingest (~0.84 s + GC pressure, profiled locally). Root cause: the debug
 * invariant `assertAscending` re-walks an entire series (one epochDay per
 * point) on EVERY pointAtOrBefore / sliceBetween / combineSeries /
 * yoyPctSeries call, so a 2,600-point daily series pays thousands of full
 * O(n) Date.parse+string-concat passes per run. The date domain is tiny —
 * ISO calendar days, a few thousand distinct strings across the 10-year
 * window — so a memo turns every walk after the first into Map lookups.
 * Values are bit-identical to Date.parse's; invalid dates still throw on
 * every call (nothing caches on the throw path); growth is bounded by the
 * rolling calendar (~2 k entries/year, trivially small for a long-lived
 * isolate).
 */
const epochDayCache = new Map<string, number>();

/** Epoch-day index of an ISO calendar date — the only date math we need. */
export function epochDay(date: string): number {
  const cached = epochDayCache.get(date);
  if (cached !== undefined) return cached;
  const t = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(t)) throw new Error(`Not an ISO calendar date: ${date}`);
  const day = Math.round(t / MS_PER_DAY);
  epochDayCache.set(date, day);
  return day;
}

/** Inverse of {@link epochDay}. */
export function fromEpochDay(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** `date` shifted by `days` calendar days (may be negative). */
export function addDays(date: string, days: number): string {
  return fromEpochDay(epochDay(date) + days);
}

/**
 * `date` shifted by `months` CALENDAR months (may be negative): the same
 * day-of-month, clamped to the target month's length when it does not exist
 * (Jan 31 − 1 month = Dec 31). The "on or before the same date one period
 * earlier" anchors in the fx changes (currencies spec §6.1) and the market
 * rows' chg1m ride this rule.
 */
export function addMonths(date: string, months: number): string {
  const t = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(t)) throw new Error(`Not an ISO calendar date: ${date}`);
  const d = new Date(t);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + months;
  const target = new Date(Date.UTC(year, month, 1));
  const targetYear = target.getUTCFullYear();
  const targetMonth = target.getUTCMonth();
  // Days in the target month (0 = last day of previous month → +1).
  const daysInMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(d.getUTCDate(), daysInMonth);
  return new Date(Date.UTC(targetYear, targetMonth, day)).toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (negative when b precedes a). */
export function daysBetween(a: string, b: string): number {
  return epochDay(b) - epochDay(a);
}

/**
 * Latest point dated on or before `date` (binary search; series must be
 * ascending by date — {@link assertAscending}). Undefined when no such point.
 */
export function pointAtOrBefore(series: readonly SeriesPoint[], date: string): SeriesPoint | undefined {
  assertAscending(series);
  const target = epochDay(date);
  let lo = 0;
  let hi = series.length - 1;
  let best: SeriesPoint | undefined;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const point = series[mid]!;
    const d = epochDay(point.date);
    if (d <= target) {
      best = point;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/** All points with dates in [`from`, `to`] inclusive. Ascending input assumed. */
export function sliceBetween(
  series: readonly SeriesPoint[],
  from: string,
  to: string,
): SeriesPoint[] {
  assertAscending(series);
  const lo = epochDay(from);
  const hi = epochDay(to);
  return series.filter((p) => {
    const d = epochDay(p.date);
    return d >= lo && d <= hi;
  });
}

/** Throws unless dates are strictly ascending (duplicates are a bug upstream). */
export function assertAscending(series: readonly SeriesPoint[]): void {
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1]!;
    const cur = series[i]!;
    if (epochDay(prev.date) >= epochDay(cur.date)) {
      throw new Error(`Series dates must be strictly ascending: ${prev.date} then ${cur.date}`);
    }
  }
}

/**
 * Element-wise combination of two series on their common dates (inner join).
 * Used by the backtest now and the I2 adapters later for ratios and crosses
 * (gold/silver, interest/receipts, AUD/JPY from USD legs).
 */
export function combineSeries(
  a: readonly SeriesPoint[],
  b: readonly SeriesPoint[],
  fn: (av: number, bv: number) => number,
): SeriesPoint[] {
  assertAscending(a);
  assertAscending(b);
  const out: SeriesPoint[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const pa = a[i]!;
    const pb = b[j]!;
    const da = epochDay(pa.date);
    const db = epochDay(pb.date);
    if (da === db) {
      out.push({ date: pa.date, value: fn(pa.value, pb.value) });
      i++;
      j++;
    } else if (da < db) {
      i++;
    } else {
      j++;
    }
  }
  return out;
}

/**
 * Year-on-year percentage series derived from a level/index series
 * (`au-cpi`, `au-trimmed-mean`): each point becomes the % change versus the
 * latest point 350–380 days earlier. Points without a year-ago anchor are
 * dropped — a first-year yoy is never guessed.
 */
export function yoyPctSeries(series: readonly SeriesPoint[]): SeriesPoint[] {
  assertAscending(series);
  const out: SeriesPoint[] = [];
  for (let i = 0; i < series.length; i++) {
    const cur = series[i]!;
    const target = epochDay(cur.date) - 365;
    let then: SeriesPoint | undefined;
    for (let k = i - 1; k >= 0; k--) {
      const cand = series[k]!;
      const d = epochDay(cand.date);
      if (d >= target - 15 && d <= target + 15) then = cand;
      if (d < target - 15) break;
    }
    if (!then || then.value <= 0) continue;
    out.push({ date: cur.date, value: ((cur.value - then.value) / then.value) * 100 });
  }
  assertAscending(out);
  return out;
}
