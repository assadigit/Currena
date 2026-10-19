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

/**
 * One leg's phrase for a connection's right-now line (telegraphic,
 * bilingual-safe): "real yields: rising" / «طلا: در حال رشد».
 * Fix spec B-04 (2026-10-14): the v2 leg method is direction over a window
 * with a minimum move — the phrase names the qualifying window when the leg
 * moved on a longer one ("gold: rising over 90 days").
 */
export function legPhrase(
  leg: LegEval,
  shortName: string,
  copy: Pick<InsightsCopy, 'together'>,
): string {
  const t = copy.together;
  const direction = leg.direction !== null ? t.direction[leg.direction] : null;
  const windowWord =
    leg.moved && leg.moveWindow !== null && leg.moveWindow !== 30
      ? interpolate(t.phrases.overWindow, { days: String(leg.moveWindow) })
      : null;
  if (direction !== null && windowWord !== null) {
    return `${interpolate(t.phrases.dirOnly, { name: shortName, direction })} ${windowWord}`;
  }
  if (direction !== null) return interpolate(t.phrases.dirOnly, { name: shortName, direction });
  return interpolate(t.phrases.none, { name: shortName });
}

/* ------------------------------------------------------------------ *
 * Status metadata — tone (icons live in StatusChip; never colour alone)
 * ------------------------------------------------------------------ */

export type StatusTone = 'danger' | 'success' | 'info' | 'muted';

/* ------------------------------------------------------------------ *
 * v3 UI_SPEC §8 (2026-10-20, task PH6-B): the card's NEUTRAL summary
 * line — one pure selector for the face line (ConnectionCard) and the
 * collapsed chips (Together), so the two can never drift apart.
 * ------------------------------------------------------------------ */

/** Which neutral summary line a relationship card speaks (UI-33/35/37). */
export type ConnectionSummaryKind =
  | 'match' // "{n} of {m} readings match the usual pattern" — counts exist
  | 'trigger-absent' // "Trigger not present" — readable card, no trigger move
  | 'pending' // "Pass-through pending" + the decided date line
  | 'not-enough' // "Not enough fresh data to read"
  /** The RBA pass-through card in its active/inactive states: no engine
   * summary exists (evaluatePassThrough carries none), so the card speaks
   * its pass-through numbers line instead. */
  | 'pass-through';

export interface ConnectionSummaryInfo {
  kind: ConnectionSummaryKind;
  /** Only on 'match': the N and M of "N of M readings match". */
  matchCount?: number;
  movedCount?: number;
}

/**
 * Select the neutral summary a connection card shows (UI-33/35/37):
 * pending and unknown states win first, then the engine's summary — a
 * missing trigger beats any count, counts need every scored leg readable.
 * Cards without a summary (the pass-through card's active/inactive) fall
 * through to their own numbers line.
 */
export function connectionSummaryInfo(reading: ConnectionReading): ConnectionSummaryInfo {
  if (reading.state === 'pending') return { kind: 'pending' };
  if (reading.state === 'unknown') return { kind: 'not-enough' };
  const summary = reading.summary;
  if (summary === undefined) return { kind: 'pass-through' };
  if (!summary.triggerPresent) return { kind: 'trigger-absent' };
  if (summary.matchCount === undefined || summary.movedCount === undefined) {
    // Trigger moved but a scored leg is unreadable — no counts over what
    // cannot be read (the engine only produces this with state unknown,
    // kept here so the selector is total and honest on its own).
    return { kind: 'not-enough' };
  }
  return { kind: 'match', matchCount: summary.matchCount, movedCount: summary.movedCount };
}

/* ------------------------------------------------------------------ *
 * Round-2 R7b: the collapsed Together/Signals summaries.
 * ------------------------------------------------------------------ */

const TOGETHER_STATE_ORDER: readonly ConnectionState[] = ['active', 'partly', 'pending', 'disagree', 'inactive', 'unknown'];

interface TogetherSummary {
  /** One line: "2 active, 3 show signals that disagree, 1 partly active". */
  line: string;
  /** One chip per connection (short title + state). */
  chips: readonly { connection: string; name: string; state: ConnectionState }[];
}

export function togetherSummary(
  connections: readonly ConnectionReading[],
  nameOf: (connection: string) => string,
  templates: { active: string; partly: string; pending: string; inactive: string; disagree: string; unknown: string },
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

/* ------------------------------------------------------------------ *
 * Round-2 R26: the merged gold-and-silver signals card.
 * ------------------------------------------------------------------ */

interface MergedSignals {
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
