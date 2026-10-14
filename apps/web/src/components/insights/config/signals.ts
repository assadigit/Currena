/**
 * The "Together" connection cards + the signals cards: the feature flag,
 * leg phrases, StatusTone, the collapsed summaries, and the merged
 * gold-and-silver card (Phase 3-c split of the former config.ts monolith —
 * see ./index.ts). Pure, platform-free.
 */

import type { IndicatorId } from '@currena/core';
import type { ConnectionReading, ConnectionState, LegEval } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';

/* ------------------------------------------------------------------ *
 * I17 (v2): the "Together" connection cards + the signals cards
 * ------------------------------------------------------------------ */

/**
 * The SIGNALS_ENABLED feature flag (UI spec Block S1 note). The signals
 * cards are fully built; the flag is the one-flip off-switch for the whole
 * section. Set true at I17 with the owner's full approval of the wording
 * review gate — flip to false to hide the section instantly.
 */
export const SIGNALS_ENABLED = true;

/** One leg's phrase for a connection's right-now line (telegraphic,
 * bilingual-safe): "real yields: high and rising" / «طلا: بالا و ثابت». */
export function legPhrase(
  leg: LegEval,
  shortName: string,
  copy: Pick<InsightsCopy, 'together'>,
): string {
  const t = copy.together;
  const level = leg.level !== null ? t.level[leg.level] : null;
  const direction = leg.direction !== null ? t.direction[leg.direction] : null;
  if (level !== null && direction !== null) {
    return interpolate(t.phrases.levelDir, { name: shortName, level, direction });
  }
  if (level !== null) return interpolate(t.phrases.levelOnly, { name: shortName, level });
  if (direction !== null) return interpolate(t.phrases.dirOnly, { name: shortName, direction });
  return interpolate(t.phrases.none, { name: shortName });
}

/* ------------------------------------------------------------------ *
 * Status metadata — tone (icons live in StatusChip; never colour alone)
 * ------------------------------------------------------------------ */

export type StatusTone = 'danger' | 'success' | 'info' | 'muted';

/* ------------------------------------------------------------------ *
 * Round-2 R7b: the collapsed Together/Signals summaries.
 * ------------------------------------------------------------------ */

const TOGETHER_STATE_ORDER: readonly ConnectionState[] = ['active', 'partly', 'disagree', 'inactive', 'unknown'];

export interface TogetherSummary {
  /** One line: "2 active, 3 show signals that disagree, 1 partly active". */
  line: string;
  /** One chip per connection (short title + state). */
  chips: readonly { connection: string; name: string; state: ConnectionState }[];
}

export function togetherSummary(
  connections: readonly ConnectionReading[],
  nameOf: (connection: string) => string,
  templates: { active: string; partly: string; inactive: string; disagree: string; unknown: string },
  fmt: (n: number) => string = String,
  joiner = ', ',
): TogetherSummary {
  const counts = new Map<ConnectionState, number>();
  for (const c of connections) counts.set(c.state, (counts.get(c.state) ?? 0) + 1);
  const parts: string[] = [];
  for (const state of TOGETHER_STATE_ORDER) {
    const n = counts.get(state) ?? 0;
    if (n > 0) parts.push(interpolate(templates[state], { n: fmt(n) }));
  }
  return {
    line: parts.join(joiner),
    chips: connections.map((c) => ({ connection: c.connection, name: nameOf(c.connection), state: c.state })),
  };
}

/** Expanded-Together card order (spec R7b): active → partly → disagree →
 * not active → unreadable. */
export const TOGETHER_CARD_ORDER: readonly ConnectionState[] = TOGETHER_STATE_ORDER;

/** Collapsed-Signals line per metal: position top/bottom percent or ''. */
export function signalSummaryPosition(percentile: number | null): { word: 'top' | 'bottom'; pct: number } | null {
  if (percentile === null || !Number.isFinite(percentile)) return null;
  if (percentile >= 0.9) return { word: 'top', pct: Math.round((1 - percentile) * 100) };
  if (percentile <= 0.1) return { word: 'bottom', pct: Math.round(percentile * 100) };
  return null;
}

/* ------------------------------------------------------------------ *
 * Round-2 R26: the merged gold-and-silver signals card.
 * ------------------------------------------------------------------ */

export interface MergedSignals {
  /** The four global conditions (identical for both metals by construction). */
  shared: readonly { key: string; state: string }[];
  /** Per-metal footing rows. */
  footing: readonly { metal: 'gold' | 'silver'; state: string; priceId: IndicatorId }[];
  /** The silver-only condition rows. */
  silverOnly: readonly { key: string; state: string }[];
}

export function mergeSignals(gold: { conditions: readonly { key: string; state: string }[]; priceId: IndicatorId }, silver: { conditions: readonly { key: string; state: string }[]; priceId: IndicatorId }): MergedSignals {
  const shared = gold.conditions.filter((c) => c.key !== 'footing' && c.key !== 'industrial');
  const goldFooting = gold.conditions.find((c) => c.key === 'footing');
  const silverFooting = silver.conditions.find((c) => c.key === 'footing');
  const footing: { metal: 'gold' | 'silver'; state: string; priceId: IndicatorId }[] = [];
  if (goldFooting) footing.push({ metal: 'gold', state: goldFooting.state, priceId: gold.priceId });
  if (silverFooting) footing.push({ metal: 'silver', state: silverFooting.state, priceId: silver.priceId });
  return {
    shared,
    footing,
    silverOnly: silver.conditions.filter((c) => c.key === 'industrial'),
  };
}
