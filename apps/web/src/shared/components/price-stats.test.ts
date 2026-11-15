/**
 * price-stats.test.ts — the client-side tile statistics behind the owner's
 * price-card redesign (17 Oct 2026): the daily % row and the fact bullets
 * (6-month change, 1-year change, 52-week range) that the feed does not
 * carry, derived from the same stored history the sparklines fetch.
 *
 * Covered here:
 *   - the change conversion in both units (pct for the price tiles, points
 *     for anything else) with the zero-baseline guard;
 *   - the ≤3-day nearest-point rule: a sparse series yields ABSENT windows,
 *     never one number stretched across every window (the R30 honesty rule);
 *   - the 52-week range: min/max over the last ~365 days, and the ≥300-day
 *     span gate that keeps a short series from wearing the "52-week" name;
 *   - the degenerate inputs (fewer than 2 readable points) → all absent.
 */

import { describe, expect, it } from 'vitest';
import { deriveTileStats, type HistoryPoint } from './price-stats';

/** Day numbers are the history endpoint's own unit (days since epoch) —
 * the tests use plain small numbers; only DIFFERENCES matter. */
const D = (day: number, value: number): HistoryPoint => [day, value];

describe('deriveTileStats', () => {
  it('derives every window from a dense daily series (pct)', () => {
    // 400 dense days ending at 200: day 0 → value 100 (a +100% year).
    const points: HistoryPoint[] = Array.from({ length: 401 }, (_, i) => D(i, 100 + i / 4));
    const stats = deriveTileStats(points, 'pct');
    const last = 200;
    const at = (back: number) => 100 + (400 - back) / 4;
    expect(stats.c1).toBeCloseTo(((last - at(1)) / at(1)) * 100, 6);
    expect(stats.c7).toBeCloseTo(((last - at(7)) / at(7)) * 100, 6);
    expect(stats.c30).toBeCloseTo(((last - at(30)) / at(30)) * 100, 6);
    expect(stats.c90).toBeCloseTo(((last - at(90)) / at(90)) * 100, 6);
    expect(stats.c6m).toBeCloseTo(((last - at(182)) / at(182)) * 100, 6);
    expect(stats.c1y).toBeCloseTo(((last - at(365)) / at(365)) * 100, 6);
    // The window starts 365 days back (day 35 in this 400-day series) —
    // the oldest IN-WINDOW value, not the series' first ever value.
    expect(stats.low52).toBe(100 + 35 / 4);
    expect(stats.high52).toBe(200); // the latest value
  });

  it('speaks in points when the series does (changeKind points)', () => {
    // Targets land exactly: last = day 100 → the 7-day target is 93, the
    // 30-day target is 70, the 1-day target 99 (nearest point: day 100's
    // predecessor at 98).
    const points: HistoryPoint[] = [D(0, 5), D(70, 8), D(93, 6), D(98, 8.5), D(100, 9)];
    const stats = deriveTileStats(points, 'points');
    expect(stats.c1).toBeCloseTo(9 - 8.5, 6);
    expect(stats.c7).toBe(3); // 6 → 9
    expect(stats.c30).toBe(1); // 8 → 9
  });

  it('the tolerance rule: near point picked, far point honest-absent', () => {
    const points: HistoryPoint[] = [D(0, 100), D(398, 150), D(400, 180)];
    const near = deriveTileStats(points, 'pct');
    expect(near.c1).toBeCloseTo(((180 - 150) / 150) * 100, 6); // 398 is 1 day off 399 ✓
    const sparse: HistoryPoint[] = [D(0, 100), D(385, 150), D(400, 180)];
    const far = deriveTileStats(sparse, 'pct');
    expect(far.c1).toBeUndefined(); // 385 is 14 days off 399 → absent
    expect(far.c7).toBeUndefined();
  });

  it('each window is judged on its own distance (390 sits 3 days off the 7-day target)', () => {
    // No point between day 200 and 390 — the in-window span (200→400) is
    // 200 days, short of the 52-week gate.
    const points: HistoryPoint[] = [D(0, 100), D(200, 120), D(390, 150), D(400, 180)];
    const stats = deriveTileStats(points, 'pct');
    expect(stats.c1).toBeUndefined(); // target 399: nearest is 390, 9 days off
    expect(stats.c7).toBeCloseTo(((180 - 150) / 150) * 100, 6); // target 393: 390 is 3 days off ✓
    expect(stats.c30).toBeUndefined(); // target 370: 390 is 20 days off
    expect(stats.c90).toBeUndefined(); // target 310: 390 is 80 days off
    expect(stats.c1y).toBeUndefined(); // target 35: 200 is 165 days off
    expect(stats.low52).toBeUndefined(); // the window spans only 200 days
  });

  it('a zero baseline yields an absent change, never Infinity', () => {
    const points: HistoryPoint[] = [D(0, 0), D(399, 0), D(400, 50)];
    const stats = deriveTileStats(points, 'pct');
    expect(stats.c1).toBeUndefined();
  });

  it('null values are skipped, and fewer than 2 readable points → all absent', () => {
    const nullish: HistoryPoint[] = [
      [0, null],
      [400, 10],
      [401, null],
    ];
    expect(deriveTileStats(nullish, 'pct')).toEqual({});
    expect(deriveTileStats([D(0, 5)], 'pct')).toEqual({});
    expect(deriveTileStats([], 'pct')).toEqual({});
  });

  it('the 52-week range covers the full window including the latest point', () => {
    // 400 days, a dip to 50 mid-window and the max at the end.
    const points: HistoryPoint[] = Array.from({ length: 401 }, (_, i) => D(i, i === 100 ? 50 : 100));
    const stats = deriveTileStats(points, 'pct');
    expect(stats.low52).toBe(50);
    expect(stats.high52).toBe(100);
  });

  it('a window shorter than 300 days keeps the 52-week name off (absent range)', () => {
    // 200 dense days only — a real range exists, but it is not "52-week".
    const points: HistoryPoint[] = Array.from({ length: 201 }, (_, i) => D(i, 100 + i / 2));
    const stats = deriveTileStats(points, 'pct');
    expect(stats.low52).toBeUndefined();
    expect(stats.high52).toBeUndefined();
    // The percentage windows that DO exist still derive:
    expect(stats.c1).toBeDefined();
    expect(stats.c6m).toBeDefined(); // 182 days back is still inside the 200-day series
    expect(stats.c1y).toBeUndefined(); // 365 days back predates the series
  });

  it('exactly 300 days of span still earns the 52-week range (boundary)', () => {
    const points: HistoryPoint[] = Array.from({ length: 301 }, (_, i) => D(i, 100 + (i === 150 ? -10 : 0)));
    const stats = deriveTileStats(points, 'pct');
    expect(stats.low52).toBe(90);
    expect(stats.high52).toBe(100);
  });
});
