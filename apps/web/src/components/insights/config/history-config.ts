/**
 * Chart range zoom, the pinned watchlist, and the epoch-day history
 * helpers (Phase 3-c split of the former config.ts monolith — see
 * ./index.ts). Pure, platform-free.
 */

import type { IndicatorId } from '@currena/core';
import { DEFINITIONS } from '@currena/insights';

/* ------------------------------------------------------------------ *
 * Chart range (I9) — view-level zoom of the 10-year chart
 * ------------------------------------------------------------------ */

export type ChartRange = '10y' | '5y' | '1y';

const RANGE_DAYS: Readonly<Record<ChartRange, number>> = {
  '10y': 3653, // 10 years + leap-day slack
  '5y': 1827,
  '1y': 366,
};

export function sliceHistoryToRange(
  points: readonly [number, number][],
  range: ChartRange,
): readonly [number, number][] {
  if (!rangeIsPlottable(points, range)) return points.length >= 2 ? points : [];
  const lastDay = points[points.length - 1]![0];
  const cutoff = lastDay - RANGE_DAYS[range];
  return points.filter((p) => p[0] >= cutoff);
}

/** Would this range show at least 2 points? (Drives the disabled state.) */
export function rangeIsPlottable(points: readonly [number, number][], range: ChartRange): boolean {
  if (points.length === 0) return false;
  const lastDay = points[points.length - 1]![0];
  const cutoff = lastDay - RANGE_DAYS[range];
  return points.filter((p) => p[0] >= cutoff).length >= 2;
}

/* ------------------------------------------------------------------ *
 * Pinned watchlist (I10) — view-level personalization, localStorage only
 * ------------------------------------------------------------------ */

/** localStorage key (versioned so a future shape change can migrate). */
export const PINNED_STORAGE_KEY = 'currena.insights.pinned.v1';

/** Parse a stored pinned list (unknown ids drop silently, malformed degrades). */
export function parsePinnedIds(json: string): IndicatorId[] {
  let raw: unknown = null;
  if (json.trim() !== '') {
    try {
      raw = JSON.parse(json);
    } catch {
      raw = null;
    }
  }
  if (!Array.isArray(raw)) return [];
  const known = new Set(DEFINITIONS.map((d) => d.id));
  const out: IndicatorId[] = [];
  for (const v of raw) {
    if (typeof v !== 'string') continue;
    const id = v as IndicatorId;
    if (!known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

/** Serialize pinned ids for storage (inverse of parsePinnedIds). */
export function formatPinnedStorage(ids: readonly IndicatorId[]): string {
  return JSON.stringify([...ids]);
}

/* ---------------------------------------------------------------- *
 * Owner request (sources off the cards): the card faces no longer
 * show ANY source label. Sources are named and linked in exactly two
 * places — the details panel footer (full sourceName, raw series ids
 * and all) and the About/sources section at the foot of the page.
 * The old publisher-only `friendlySource` trimmer died with the card
 * labels; nothing else needed it.
 * ---------------------------------------------------------------- */

/* ------------------------------------------------------------------ *
 * History helpers (epoch-day math for the 10-year chart)
 * ------------------------------------------------------------------ */

/** Epoch-day → 'YYYY-MM-DD' (UTC — the wire format's canonical day). */
export function epochDayToIso(day: number): string {
  const d = new Date(day * 86_400_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export interface HistoryRow {
  iso: string;
  value: number;
}

/** Sample a long series for the screen-reader data table (unchanged, I4). */
export function sampleHistoryRows(
  points: readonly [number, number][],
  maxRows = 12,
): HistoryRow[] {
  if (points.length === 0) return [];
  const at = (i: number): HistoryRow => {
    const p = points[i]!;
    return { iso: epochDayToIso(p[0]), value: p[1] };
  };
  if (points.length <= maxRows) {
    return points.map((_, i) => at(i));
  }
  const indices = new Set<number>([0, points.length - 1]);
  let minIdx = 0;
  let maxIdx = 0;
  points.forEach((p, i) => {
    if (p[1] < points[minIdx]![1]) minIdx = i;
    if (p[1] > points[maxIdx]![1]) maxIdx = i;
  });
  indices.add(minIdx);
  indices.add(maxIdx);
  const interior = maxRows - indices.size;
  if (interior > 0) {
    const step = (points.length - 1) / (interior + 1);
    for (let i = 1; i <= interior; i++) indices.add(Math.round(i * step));
  }
  return [...indices]
    .sort((a, b) => a - b)
    .slice(0, maxRows)
    .map((i) => at(i));
}
