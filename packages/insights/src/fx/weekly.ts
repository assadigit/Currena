/**
 * Weekly series + the shared week grid + the 13-week pattern check (Phase 3
 * split of the former compute.ts monolith; spec §6.4, §9.3 Level 2).
 */

import type { FxPatternCheck } from '@currena/core';
import type { SeriesPoint } from '../series';
import { epochDay } from '../series';
import {
  FX_WEEKLY_POINTS,
  PATTERN_HOLDING_MIN,
  PATTERN_MIXED_MIN,
  PATTERN_WEEKS,
  WEEKLY_EPOCH_BASE_DAY,
} from './definitions';
import { round2, round5 } from './maths';

/** Week start (Monday) of an epoch day. */
function weekStartOf(day: number): number {
  return day - ((day + 3) % 7);
}

/** ≤52 weekly closes as [dayDelta, close] pairs (5-dp precision — fx rates are small). */
export function fxWeeklySeries(points: readonly SeriesPoint[]): [number, number][] {
  const byWeek = new Map<number, SeriesPoint>();
  for (const p of points) {
    byWeek.set(weekStartOf(epochDay(p.date)), p); // ascending input → last write wins
  }
  const weeks = [...byWeek.values()].slice(-FX_WEEKLY_POINTS);
  const out: [number, number][] = [];
  let prevDay = WEEKLY_EPOCH_BASE_DAY;
  for (const p of weeks) {
    const day = epochDay(p.date);
    out.push([day - prevDay, round5(p.value)]);
    prevDay = day;
  }
  return out;
}

/**
 * The shared week grid: `n` consecutive Monday-start weeks ending at the
 * anchor's week. Each series' value at a slot = its last point on or
 * before the slot's week END (forward-fill across a holiday gap; undefined
 * before its first point). Charts and pattern checks read this grid so
 * "week k" means the same week for every series.
 */
export function weekGrid(
  seriesList: readonly (readonly SeriesPoint[])[],
  slots: number,
): { weekStarts: number[]; values: Array<(number | undefined)[]> } {
  let anchorDay = 0;
  for (const s of seriesList) {
    if (s.length > 0) anchorDay = Math.max(anchorDay, epochDay(s[s.length - 1]!.date));
  }
  const anchorWeek = weekStartOf(anchorDay);
  const weekStarts: number[] = [];
  for (let i = slots - 1; i >= 0; i--) weekStarts.push(anchorWeek - i * 7);
  // One forward walk per series (slots ascend, series ascend): the pointer
  // only ever moves forward, so the grid is linear — no per-slot binary
  // search with its O(n) ascending assert.
  const values = seriesList.map((s) => {
    const out: Array<number | undefined> = [];
    let idx = 0;
    for (const ws of weekStarts) {
      const weekEndDay = ws + 6;
      while (idx < s.length && epochDay(s[idx]!.date) <= weekEndDay) idx++;
      out.push(idx === 0 ? undefined : s[idx - 1]!.value);
    }
    return out;
  });
  return { weekStarts, values };
}

/** Rebase a value list to 100 at its first defined value (chart lines, spec §9.3). */
export function rebaseTo100(values: readonly (number | undefined)[]): number[] {
  const first = values.find((v) => v !== undefined);
  if (first === undefined) return [];
  const base = first as number;
  return values.filter((v) => v !== undefined).map((v) => round2(((v as number) / base) * 100));
}

/**
 * The 13-week pattern check (spec §6.4): count the weeks the two series
 * moved the way the pattern expects (together/opposite). Weeks with no
 * change on either side are skipped (null). Holding ≥ 9 of 13 · Mixed 7–8 ·
 * Not holding ≤ 6 · nodata when either series is absent or the whole window
 * is skipped (no evidence).
 */
export function patternCheck(
  a: readonly SeriesPoint[] | undefined,
  b: readonly SeriesPoint[] | undefined,
  expect: 'together' | 'opposite',
): FxPatternCheck {
  const empty: FxPatternCheck = { status: 'nodata', agreeWeeks: 0, ofWeeks: PATTERN_WEEKS, weeks: [] };
  if (a === undefined || b === undefined || a.length === 0 || b.length === 0) return empty;
  // 13 weekly changes need 14 week slots.
  const { values } = weekGrid([a, b], PATTERN_WEEKS + 1);
  const va = values[0]!;
  const vb = values[1]!;
  const weeks: Array<boolean | null> = [];
  let agree = 0;
  let skipped = 0;
  for (let i = 1; i <= PATTERN_WEEKS; i++) {
    const a0 = va[i - 1];
    const a1 = va[i];
    const b0 = vb[i - 1];
    const b1 = vb[i];
    if (a0 === undefined || a1 === undefined || b0 === undefined || b1 === undefined) {
      weeks.push(null);
      skipped++;
      continue;
    }
    const da = a1 - a0;
    const db = b1 - b0;
    if (da === 0 || db === 0) {
      weeks.push(null); // a week with no change is skipped (§6.4)
      skipped++;
      continue;
    }
    const sameDirection = (da > 0 && db > 0) || (da < 0 && db < 0);
    const held = expect === 'together' ? sameDirection : !sameDirection;
    weeks.push(held);
    if (held) agree++;
  }
  if (skipped === PATTERN_WEEKS) return empty; // no evidence at all
  const status: FxPatternCheck['status'] =
    agree >= PATTERN_HOLDING_MIN ? 'holding' : agree >= PATTERN_MIXED_MIN ? 'mixed' : 'not_holding';
  return { status, agreeWeeks: agree, ofWeeks: PATTERN_WEEKS, weeks };
}
