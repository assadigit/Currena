/**
 * chart-range.ts — the reader's preferred chart zoom, remembered
 * (I13, follows I9's range control).
 *
 * One localStorage key holds the last range a reader CHOSE (10y/5y/1y);
 * every chart on the page then opens there on the next visit. Readers who
 * always zoom to 5 years stop re-clicking 30 times per page-load. The
 * remembered value is only a DEFAULT — plottability still rules per
 * series (a 1y-only series disables 10y regardless of what is stored),
 * and every explicit click updates the memory.
 *
 * Fail-open by design: private-mode/blocked localStorage reads return the
 * plain default, writes are dropped silently — a preference must never
 * break the page (same discipline as the theme/pin stores).
 */

import type { ChartRange } from './config';

const STORAGE_KEY = 'currena:insights:chart-range';
const RANGES: readonly string[] = ['10y', '5y', '1y'];

/** Parse a stored value; anything unknown (or absent) → the '10y' default. */
export function parseChartRange(value: string | null): ChartRange {
  return value === '5y' || value === '1y' ? value : '10y';
}

/** The remembered range, or '10y' when nothing readable is stored. */
export function readChartRange(): ChartRange {
  try {
    return parseChartRange(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return '10y';
  }
}

/** Remember a reader-chosen range (best-effort; never throws). */
export function writeChartRange(range: ChartRange): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, range);
  } catch {
    // Private mode / storage full — the default simply wins next time.
  }
}

/** Test seam: the valid-token list (kept in one place for the tests). */
export const CHART_RANGE_VALUES: readonly string[] = RANGES;
