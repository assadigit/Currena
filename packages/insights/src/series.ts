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

/** Epoch-day index of an ISO calendar date — the only date math we need. */
export function epochDay(date: string): number {
  const t = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(t)) throw new Error(`Not an ISO calendar date: ${date}`);
  return Math.round(t / MS_PER_DAY);
}

/** Inverse of {@link epochDay}. */
export function fromEpochDay(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** `date` shifted by `days` calendar days (may be negative). */
export function addDays(date: string, days: number): string {
  return fromEpochDay(epochDay(date) + days);
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
