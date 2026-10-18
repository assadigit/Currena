/**
 * The "Together" connection cards + the signals cards: the feature flag,
 * leg phrases, StatusTone and the collapsed summaries (Phase 3-c split of
 * the former config.ts monolith — see ./index.ts). Pure, platform-free.
 */

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
 * R26 once merged the two metals' cards for the old presentation; the
 * "Balance Rework" (docs/insights/gold-card/) replaced it with ONE
 * template rendered per asset behind the Gold | Silver segmented control
 * (signals/BalanceCard.tsx + signals/balance-card-model.ts) — the merge
 * helper retired with the old card.
 * ------------------------------------------------------------------ */
