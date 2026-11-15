/**
 * au-markets/briefing — the pure decision layer for the Australian markets
 * board (gap-closure S5-M5.4): the per-group breadth and the
 * leading/lagging extrema that drive the one-line plain-language summary.
 *
 * Pure: snapshot + copy → text. No news, no causes (RULES.md §5 wording —
 * describe conditions only). The summary reads the per-group chg1d
 * extrema and names the leading/lagging group from the numbers, never a
 * forecast.
 */

import type { AuMarketEntry, AuMarketGroupId, AuMarketsSnapshot } from '@currena/core';
import { auMarketDefinition } from '@currena/insights/markets-au/definitions';
import type { AuMarketsView } from './shared';
import { auViewValue } from './shared';

/** A per-group breadth rollup. */
export interface AuGroupBreadth {
  group: AuMarketGroupId;
  up: number;
  down: number;
  flat: number;
  valid: number;
  total: number;
  /** The best (highest) change in this group under the view, or null. */
  best: number | null;
  /** The worst (lowest) change in this group under the view, or null. */
  worst: number | null;
}

/** The per-group breadth under the given view lens.
 *
 * The group list is the FOUR Australian groups by design: the one-line
 * summary describes the Australian market (its copy says so), and the
 * S6-M6.1 `newzealand` rider group — a single NZD row — deliberately stays
 * OUT of the leading/lagging extrema (a one-row group would also break the
 * plural grammar of the summary sentences). The NZX row renders in its own
 * labelled group below; its own numbers carry its story. */
export function auGroupBreadth(
  markets: readonly AuMarketEntry[],
  view: AuMarketsView,
): AuGroupBreadth[] {
  const groups: AuMarketGroupId[] = ['broad', 'sectors', 'banks', 'volatility'];
  return groups.map((group) => {
    const rows = markets.filter((m) => auMarketDefinition(m.id).group === group);
    let up = 0;
    let down = 0;
    let flat = 0;
    let valid = 0;
    let best: number | null = null;
    let worst: number | null = null;
    for (const m of rows) {
      const v = auViewValue(m, view);
      if (v === null) continue;
      valid++;
      if (v >= 1) up++;
      else if (v <= -1) down++;
      else flat++;
      if (best === null || v > best) best = v;
      if (worst === null || v < worst) worst = v;
    }
    return { group, up, down, flat, valid, total: rows.length, best, worst };
  });
}

/** The group id holding the highest best-under-view reading (the leader). */
export function auLeadingGroup(breadths: readonly AuGroupBreadth[]): AuGroupBreadth | null {
  let leader: AuGroupBreadth | null = null;
  for (const b of breadths) {
    if (b.valid === 0) continue;
    if (leader === null) {
      leader = b;
      continue;
    }
    if ((b.best ?? -Infinity) > (leader.best ?? -Infinity)) leader = b;
  }
  return leader;
}

/** The group id holding the lowest worst-under-view reading (the laggard). */
export function auLaggingGroup(breadths: readonly AuGroupBreadth[]): AuGroupBreadth | null {
  let laggard: AuGroupBreadth | null = null;
  for (const b of breadths) {
    if (b.valid === 0) continue;
    if (laggard === null) {
      laggard = b;
      continue;
    }
    if ((b.worst ?? Infinity) < (laggard.worst ?? Infinity)) laggard = b;
  }
  return laggard;
}

/** The section's descriptive signal (mirrors the summary.signal). */
export type AuMarketsSignal = 'normal' | 'attention' | 'unusual';

export function auMarketsSignal(snapshot: AuMarketsSnapshot): AuMarketsSignal {
  return snapshot.summary.signal;
}
