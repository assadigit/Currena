/**
 * The big-mover callout, alerting chips, the two-tier status model, and
 * the card filter (Phase 3-c split of the former config.ts monolith —
 * see ./index.ts). Pure, platform-free.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { MOVE_SCORE_THRESHOLD } from './bands';
import { PRICE_ROWS, definitionFor } from './sections';

/* ------------------------------------------------------------------ *
 * The big-mover callout (Block H3 + data spec §4)
 * ------------------------------------------------------------------ */

interface BigMoverRow {
  id: IndicatorId;
  /** |z| ≥ 2 items only — the callout hides otherwise (Block H3). */
  change30d: number;
  changeKind: 'pct' | 'points';
  moveScore: number;
}

/** All readings whose |moveScore| clears the threshold, freshest data only.
 * Stale/unavailable rows never headline (R4): the engine omits moveScore for
 * them, and this guard keeps an old payload from resurrecting one. */
export function bigMovers(readings: readonly IndicatorReading[], limit = 3): BigMoverRow[] {
  const rows: BigMoverRow[] = [];
  for (const r of readings) {
    if (r.status === 'stale' || r.status === 'unavailable') continue;
    if (r.moveScore === undefined || !Number.isFinite(r.moveScore)) continue;
    if (Math.abs(r.moveScore) < MOVE_SCORE_THRESHOLD) continue;
    if (r.change30d === undefined || !Number.isFinite(r.change30d)) continue;
    const def = definitionFor(r.id);
    if (def.rule.kind === 'info' && !PRICE_ROWS.includes(r.id)) continue; // context cards never headline (price rows can)
    rows.push({ id: r.id, change30d: r.change30d, changeKind: def.changeKind, moveScore: r.moveScore });
  }
  return rows
    .sort((a, b) => Math.abs(b.moveScore) - Math.abs(a.moveScore))
    .slice(0, limit)
    .map(({ id, change30d, changeKind, moveScore }) => ({ id, change30d, changeKind, moveScore }));
}

/* ------------------------------------------------------------------ *
 * R5: the two-tier status model (round-2 spec §4 + Block R5)
 *                     only the user-facing word changes)
 *   unusual         — no rule fired, but the value sits in the top/bottom
 *                     10% of its own 10-year range (percentile ≤ 0.10 or
 *                     ≥ 0.90). percentile10y is only computed when the
 *                     base carries the engine's 30-observation floor
 *                     (MIN_PERCENTILE_OBS), so its presence IS the
 *                     history floor — no extra check needed.
 *   normal          — neither of the above
 *   context / stale / unavailable — unchanged
 *
 * ONE tier per card: needs-attention wins over unusual (details may add
 * "also unusual"). Internal ids and internal statuses stay unchanged.
 * ------------------------------------------------------------------ */

export type IndicatorTier =
  | 'needs-attention'
  | 'unusual'
  | 'normal'
  | 'context'
  | 'stale'
  | 'unavailable';

/** The unusual band: top or bottom 10% of the indicator's own 10y range. */
const UNUSUAL_CUTOFF = 0.1;

/** Is this reading in the unusual band? (Normal-status readings only.) */
function isUnusual(reading: IndicatorReading): boolean {
  if (reading.status !== 'normal') return false;
  if (reading.percentile10y === undefined) return false;
  return reading.percentile10y <= UNUSUAL_CUTOFF || reading.percentile10y >= 1 - UNUSUAL_CUTOFF;
}

/** The one display tier for a reading (precedence: needs-attention wins). */
export function tierOf(reading: IndicatorReading): IndicatorTier {
  if (reading.status === 'warning') return 'needs-attention';
  if (reading.status === 'context') return 'context';
  if (reading.status === 'unavailable') return 'unavailable';
  // Fix spec A-03/A-04: a validation-flagged reading renders like a stale
  // row (muted, compact, never counted) with its own word: Check pending.
  if (reading.status === 'stale' || reading.status === 'no-history' || reading.status === 'check-pending') return 'stale';
  return isUnusual(reading) ? 'unusual' : 'normal';
}

/** Card layout per tier: needs-attention AND unusual get the full card; the
 * rest are compact rows (R7: both tiers are the visible face of a group). */
export function tierIsCard(tier: IndicatorTier): boolean {
  return tier === 'needs-attention' || tier === 'unusual';
}

/* ------------------------------------------------------------------ *
 * Card filter (I8) — view-level narrowing of the rows/cards grid
 * ------------------------------------------------------------------ */

export type StatusFilter = 'all' | 'warning' | 'unusual' | 'normal' | 'context';

interface CardFilter {
  status: StatusFilter;
  query: string;
}

/** ZWNJ → word separator (first!), other zero-widths/bidi stripped, whitespace collapsed. */
function spacedNorm(s: string): string {
  return s
    .replace(/\u064A/g, '\u06CC')
    .replace(/\u0643/g, '\u06A9')
    .replace(/\u200C/g, ' ')
    .replace(/[\u200B\u200D-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Does one reading pass the status chips + text query? (Pure, unit-tested.)
 * The 'unusual' chip filters on the R5 tier, not the internal status. */
export function indicatorMatchesFilter(
  reading: IndicatorReading,
  filter: CardFilter,
  nameOf: (id: IndicatorId) => { name: string; ticker?: string },
): boolean {
  if (filter.status !== 'all') {
    if (filter.status === 'unusual') {
      if (tierOf(reading) !== 'unusual') return false;
    } else if (reading.status !== filter.status) {
      return false;
    }
  }
  const tokens = spacedNorm(filter.query).split(' ').filter((t) => t.length > 0);
  if (tokens.length === 0) return true;
  const entry = nameOf(reading.id);
  const hayA = spacedNorm(`${entry.name} ${entry.ticker ?? ''}`);
  const hayB = hayA.replace(/ /g, ''); // fused compounds (ZWNJ neighbours)
  return tokens.every((t) => hayA.includes(t) || hayB.includes(t));
}

/** Ids that survive the filter, in snapshot order. Empty query + 'all' → null (no filtering). */
export function filterVisibleIds(
  readings: readonly IndicatorReading[],
  filter: CardFilter,
  nameOf: (id: IndicatorId) => { name: string; ticker?: string },
): Set<IndicatorId> | null {
  if (filter.status === 'all' && filter.query.trim() === '') return null;
  const ids = new Set<IndicatorId>();
  for (const r of readings) {
    if (indicatorMatchesFilter(r, filter, nameOf)) ids.add(r.id);
  }
  return ids;
}

/** Live per-status counts for the filter chips (I9) — tier-aware. */
export function statusCounts(
  readings: readonly IndicatorReading[],
): { all: number; warning: number; unusual: number; normal: number; context: number } {
  const counts = { all: readings.length, warning: 0, unusual: 0, normal: 0, context: 0 };
  for (const r of readings) {
    const tier = tierOf(r);
    if (tier === 'needs-attention') counts.warning += 1;
    else if (tier === 'unusual') counts.unusual += 1;
    else if (tier === 'normal') counts.normal += 1;
    else if (tier === 'context') counts.context += 1;
  }
  return counts;
}
