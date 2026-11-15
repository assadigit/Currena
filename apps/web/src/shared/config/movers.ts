/**
 * The big-mover callout, alerting chips, the v3 state-tier model, and
 * the card filter (Phase 3-c split of the former config.ts monolith —
 * see ./index.ts). Pure, platform-free.
 *
 * v3 UI_SPEC §4 state language (2026-10-20, UI-15/UI-17/U-04):
 *   warning        → Needs attention (unchanged)
 *   normal         → Normal (the former "Unusual" DISPLAY word is retired —
 *                    the unusual tier stays internal for sorting/movers/
 *                    exports; the card shows "Normal" and the 10-year
 *                    position bar carries the extremity)
 *   context        → Context (unchanged; no-history now DISPLAYS as Context
 *                    too — its value stays, with a reason line on the face)
 *   stale          → Stale (+ age on the card's meta row)
 *   check-pending  → Can't tell right now (value hidden on the face, reason
 *                    from flag.reason, last good value inside the details only)
 *   unavailable    → Can't tell right now (reason one-liner on the face)
 *   delayed (NEW)  → Delayed — a daily reading whose asOf is ≥1 trading day
 *                    behind the snapshot's newest daily asOf while still
 *                    within its max age (computed client-side from the
 *                    readings set, DailyPeers below; the markets board keeps
 *                    its own row-level delayedTag per UI-32).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { MOVE_SCORE_THRESHOLD } from './bands';
import { PRICE_ROWS, definitionFor } from './sections';

/* ------------------------------------------------------------------ *
 * The big-mover callout (Block H3 + data spec §4 + v3 UI-18/19)
 * ------------------------------------------------------------------ */

interface BigMoverRow {
  id: IndicatorId;
  /** |z| ≥ 2 items only — the callout hides otherwise (Block H3). */
  change30d: number;
  /** The 7-day change for the moves strip ("7-day change", UI-19 states the
   * period it shows). Falls back to change30d at render when absent. */
  change7d?: number;
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
    rows.push({
      id: r.id,
      change30d: r.change30d,
      change7d: r.change7d !== undefined && Number.isFinite(r.change7d) ? r.change7d : undefined,
      changeKind: def.changeKind,
      moveScore: r.moveScore,
    });
  }
  return rows
    .sort((a, b) => Math.abs(b.moveScore) - Math.abs(a.moveScore))
    .slice(0, limit)
    .map(({ id, change30d, change7d, changeKind, moveScore }) => ({ id, change30d, change7d, changeKind, moveScore }));
}

/* ------------------------------------------------------------------ *
 * v3 Delayed (UI_SPEC §4): daily readings behind the snapshot's peers
 *
 * The peer benchmark is the snapshot's NEWEST daily asOf. "≥1 trading day
 * behind" counts the weekdays strictly after the reading's asOf, up to and
 * including the newest daily asOf (so Friday→Monday is 1 trading day; the
 * weekend itself never counts). A reading past its max age is 'stale'
 * already and never delayed. Because "live" price sources can carry today's
 * date while FRED dailies publish at T-1/T-2 by nature, the literal rule
 * flags those as Delayed — that is the honest reading of the spec's
 * "behind its peers" (the same rule the stock board applies, UI-32); the
 * OWNER can relax the cutoff here if it reads too noisy in practice.
 * ------------------------------------------------------------------ */

/** The peer context one reading needs to know its own delay. */
export interface DailyPeers {
  /** The newest asOf among the snapshot's daily-cadence readings, if any. */
  newestDailyAsOf: string | null;
}

/** UTC epoch days of a YYYY-MM-DD date (NaN on malformed input). */
function epochDayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined) return Number.NaN;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Weekdays strictly after `asOf`, up to and including `newest`
 * (trading days the reading sits behind its freshest daily peer). Epoch
 * day 0 (1970-01-01) was a THURSDAY, so (day + 4) % 7 gives the weekday
 * index with Sunday = 0 — the trading days are indices 1..5 (Mon..Fri). */
export function tradingDaysBehind(asOf: string, newest: string): number {
  const a = epochDayOf(asOf);
  const b = epochDayOf(newest);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  let trading = 0;
  for (let day = a + 1; day <= b; day += 1) {
    const weekday = (day + 4) % 7;
    if (weekday >= 1 && weekday <= 5) trading += 1;
  }
  return trading;
}

/** The snapshot's peer set for delay detection (pure; computed once per
 * render and threaded to tierOf via DailyPeers). */
export function dailyPeersOf(readings: readonly IndicatorReading[]): DailyPeers {
  let newest: string | null = null;
  for (const r of readings) {
    if (r.asOf === null) continue;
    if (definitionFor(r.id).cadence !== 'daily') continue;
    if (newest === null || r.asOf > newest) newest = r.asOf;
  }
  return { newestDailyAsOf: newest };
}

/** Is this reading one trading day (or more) behind its daily peers? */
export function isDelayedReading(reading: IndicatorReading, peers: DailyPeers): boolean {
  if (reading.status !== 'normal') return false; // warnings/stale/etc. keep their own words
  if (reading.asOf === null) return false;
  const newest = peers.newestDailyAsOf;
  if (newest === null) return false;
  if (definitionFor(reading.id).cadence !== 'daily') return false;
  return tradingDaysBehind(reading.asOf, newest) >= 1;
}

/* ------------------------------------------------------------------ *
 * The display-tier model (R5 + v3 §4). The unusual tier stays internal
 * (sorting/movers/filter/export); its card now shows the Normal word.
 * ------------------------------------------------------------------ */

export type IndicatorTier =
  | 'needs-attention'
  | 'unusual'
  | 'normal'
  | 'context'
  | 'stale'
  | 'unavailable'
  | 'delayed';

/** The unusual band: top or bottom 10% of the indicator's own 10y range. */
const UNUSUAL_CUTOFF = 0.1;

/** Is this reading in the unusual band? (Normal-status readings only.) */
function isUnusual(reading: IndicatorReading): boolean {
  if (reading.status !== 'normal') return false;
  if (reading.percentile10y === undefined) return false;
  return reading.percentile10y <= UNUSUAL_CUTOFF || reading.percentile10y >= 1 - UNUSUAL_CUTOFF;
}

/** The one display tier for a reading (precedence: needs-attention wins).
 *  `peers` (the snapshot's daily peers) unlocks the v3 Delayed tier — pass
 *  it wherever the readings set is known (cards, the lane). Without it the
 *  function behaves exactly as before (no reading can be delayed). */
export function tierOf(reading: IndicatorReading, peers?: DailyPeers): IndicatorTier {
  if (reading.status === 'warning') return 'needs-attention';
  // v3 §4: no-history displays as Context (value kept, reason line on face).
  if (reading.status === 'context' || reading.status === 'no-history') return 'context';
  if (reading.status === 'unavailable') return 'unavailable';
  // Fix spec A-03/A-04: a validation-flagged reading renders like a stale
  // row (muted, compact, never counted) with its own word: Can't tell.
  if (reading.status === 'stale' || reading.status === 'check-pending') return 'stale';
  // Precedence: the unusual tier outranks Delayed (a reading in its own
  // top/bottom 10% keeps its full card + position bar — a one-day lag is
  // the softer, less informative fact; the Delayed chip rides normal rows).
  if (isUnusual(reading)) return 'unusual';
  if (peers !== undefined && isDelayedReading(reading, peers)) return 'delayed';
  return 'normal';
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
 * The 'unusual' chip filters on the internal tier, not the internal status. */
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

/** Live per-status counts for the filter chips (I9) — tier-aware. Delayed
 * rows count under 'normal' (they carry a Normal status and the 'normal'
 * filter matches them); no-history rows count under 'context' (that is the
 * word their chip now shows). */
export function statusCounts(
  readings: readonly IndicatorReading[],
): { all: number; warning: number; unusual: number; normal: number; context: number } {
  const counts = { all: readings.length, warning: 0, unusual: 0, normal: 0, context: 0 };
  for (const r of readings) {
    const tier = tierOf(r);
    if (tier === 'needs-attention') counts.warning += 1;
    else if (tier === 'unusual') counts.unusual += 1;
    else if (tier === 'normal' || tier === 'delayed') counts.normal += 1;
    else if (tier === 'context') counts.context += 1;
  }
  return counts;
}
