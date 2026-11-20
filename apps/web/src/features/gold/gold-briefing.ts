/**
 * gold-briefing.ts — the BriefingCard's pure derivations (GUX-S5 M3,
 * 11 §10 + master plan §3.4 / 08 §8.4).
 *
 * Every rule here is the S5-D2 contract: existing engine fields only,
 * no new composite score, no weights touched, "highlighted" never
 * "predictive". The derivations read the hero model (the engine's own
 * balance output) and return plain data; the copy lookups happen in
 * the component (the content module + the dictionary).
 *
 *  - briefingReasonsOf: the dynamic highlights — the FIRING voters
 *    (the engine's own 30-day-move/decade-band rule), at most ONE per
 *    lane (group coverage first, never forcing a weak signal), ordered
 *    by the lane's firing count then the engine's lane order (stable —
 *    updates only with data cadence, no flicker), capped at 3.
 *  - briefingNarrowLaneOf: the "what could change this" line — the
 *    firing lane with the narrowest contest (the smallest
 *    |supports − pressures|); null when no lane is firing (the honest
 *    fallback line renders instead).
 *  - briefingEvidenceOf: the evidence-consistency word (08 §8.2's
 *    drafts over the locked §2.1 semantics) — 'aligned' when every
 *    firing lane leans the same way, 'mixed' when firing lanes
 *    disagree (or any firing lane is split/neutral), 'limited' when
 *    fewer than two voters fire.
 */

import type { GoldHeroModel } from './gold-tiles';
import type { GoldLane } from '@currena/insights';
import type { GoldVoterId } from './gold-tiles';

export interface BriefingReason {
  id: GoldVoterId;
  lane: GoldLane;
  impact: 'supports' | 'pressures';
}

/** The dynamic-highlight selection (S5-D2). */
export function briefingReasonsOf(hero: Pick<GoldHeroModel, 'balance'>): BriefingReason[] {
  const picked: Array<{ reason: BriefingReason; firing: number; laneOrder: number }> = [];
  hero.balance.lanes.forEach((lane, laneOrder) => {
    // At most ONE member per lane — the first firing member in the
    // engine's own member order (never forced, never ranked by a new
    // score: the lane's own firing count orders the LANES).
    const firing = lane.members.find((m) => m.impact === 'supports' || m.impact === 'pressures');
    if (firing === undefined || (firing.impact !== 'supports' && firing.impact !== 'pressures')) return;
    picked.push({
      reason: { id: firing.id as GoldVoterId, lane: lane.lane, impact: firing.impact },
      firing: lane.firing,
      laneOrder,
    });
  });
  return picked
    .sort((a, b) => (b.firing - a.firing) || (a.laneOrder - b.laneOrder))
    .slice(0, 3)
    .map((p) => p.reason);
}

/** The narrowest firing contest — the lane a small shift could move. */
export function briefingNarrowLaneOf(hero: Pick<GoldHeroModel, 'balance'>): GoldLane | null {
  let bestLane: GoldLane | null = null;
  let bestMargin = Number.POSITIVE_INFINITY;
  let bestOrder = Number.POSITIVE_INFINITY;
  hero.balance.lanes.forEach((lane, order) => {
    if (lane.firing === 0 || lane.side === 'unread') return;
    const margin = Math.abs(lane.supports - lane.pressures);
    if (margin < bestMargin || (margin === bestMargin && order < bestOrder)) {
      bestLane = lane.lane;
      bestMargin = margin;
      bestOrder = order;
    }
  });
  return bestLane;
}

export type BriefingEvidence = 'aligned' | 'mixed' | 'limited';

/** The evidence-consistency word (08 §8.2 drafts over §2.1's locked
 * semantics — present-tense evidence description, never a forecast). */
export function briefingEvidenceOf(hero: Pick<GoldHeroModel, 'balance'>): BriefingEvidence {
  let firingLanes = 0;
  const sides = new Set<'for' | 'against'>();
  for (const lane of hero.balance.lanes) {
    if (lane.firing === 0) continue;
    firingLanes += 1;
    if (lane.side === 'for' || lane.side === 'against') {
      sides.add(lane.side);
    } else {
      // A firing lane that still reads neutral/split IS mixed evidence.
      sides.add('for');
      sides.add('against');
    }
  }
  const totalFiring = hero.balance.lanes.reduce((n, l) => n + l.firing, 0);
  if (firingLanes === 0 || totalFiring < 2) return 'limited';
  return sides.size <= 1 ? 'aligned' : 'mixed';
}
