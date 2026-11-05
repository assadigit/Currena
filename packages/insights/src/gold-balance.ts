/**
 * gold-balance.ts — the gold balance consolidation's pure engine
 * (docs/specs/gold-balance-consolidation/02-ENGINE-AND-DECISION-TABLE.md
 * §2–§3; rollout phase P1 per 04 §3).
 *
 * ONE question, ONE instrument (01 §2): which of the five macro
 * conditions lean FOR gold's price today, which lean AGAINST it, and
 * which do not lean. Conditions today — never a forecast (01 §8; the
 * backtest's measured no-edge record, BACKTEST-GOLD.md, stands).
 *
 * The engine is ADDITIVE (D-GB-9): it imports the FROZEN sources and
 * edits nothing —
 *   - `GOLD_LANES`, `GoldLane` and the voter table `GOLD_LANE_VOTERS`
 *     (the lane memberships and polarities — 32 seats since GF-P2: the
 *     owner's recorded answers B/C/K, 2026-11-05, the five-lane
 *     POST-P2-5LANE composition the calibration measured) from
 *     `gold-score.ts`;
 *   - `evalLeg`, the ONE shared evaluator, from `connections.ts`
 *     (D-GB-4: one rule per indicator; the Balance's bespoke stress and
 *     expectations rules are retired).
 * The frozen engine (`goldTailwindScore`, `goldSummaryOf`,
 * `GoldSummarySchema`), the snapshot adapter and the backtest harness
 * keep running untouched; the equivalence with the harness's
 * laneBalanceOverVoters (the P0 calibration's frozen measurement of this
 * same algorithm) is PINNED BY TEST (gold-balance.test.ts).
 *
 * The voter-readable rule mirrors gold-score.ts's own private `readable`
 * (stale / check-pending / unavailable never fire; the rule is not
 * exported there and D-GB-9 forbids editing it — gold-backtest-core.ts
 * carries the same copy, and the equivalence pin holds all three to one
 * semantics). GF-P1 (2026-11-05, the owner's recorded decision I — the
 * D-18 readable-rule question): the INPUT-PRESENCE rule — a readable
 * seat with NEITHER evalLeg input (no finite change30d where a move
 * threshold exists, no percentile10y) counts as UNREAD, never
 * 'steady' — the fake-steady class (audit finding D-18) manufactured
 * false confidence for ~30 weeks; the rule prevents the class, the
 * D-4 backfill fixed the instance.
 *
 * Platform-free (AGENTS.md rule 2): pure over the readings the page
 * already holds; zero fetches, zero KV, zero wire fields, zero clock.
 * The SPA derives the balance client-side exactly as it re-derives the
 * voter list today (the "one function, no drift" contract).
 *
 * Vocabulary (02 §2's naming note): the engine speaks the Balance's own
 * words — supports / pressures / steady / unread. The tailwind /
 * headwind vocabulary remains ONLY inside the frozen engine and
 * `goldSummary`.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { evalLeg } from './connections';
import { GOLD_LANES, GOLD_LANE_VOTERS, type GoldLane } from './gold-score';

/* ------------------------------------------------------------------ *
 * The vocabulary (02 §2)
 * ------------------------------------------------------------------ */

/** A lane's side in the consolidated balance (the pan / tray it lands in). */
export type GoldBalanceSide = 'for' | 'against' | 'neutral' | 'unread';

/** One voter's line in a lane's member list. */
export interface GoldBalanceMember {
  id: IndicatorId;
  /**
   * Gold-direction of this voter. 'steady' = readable, not firing.
   * 'unread' = missing / stale / check-pending / unavailable (never a
   * guess) — and, since GF-P1 (the D-18 input-presence rule, the owner's
   * recorded decision I, 2026-11-05), also a readable seat with NEITHER
   * evalLeg input (no finite change30d where a threshold exists, no
   * percentile10y): the evaluator had nothing to evaluate, so the member
   * never reads 'steady' on it (the fake-steady class, audit D-18);
   * 'supports' / 'pressures' = the lean mapped through the table's
   * polarity.
   */
  impact: 'supports' | 'pressures' | 'steady' | 'unread';
  /**
   * Evidence from evalLeg, only when impact is supports/pressures: the
   * evaluator's own word for WHY it leaned — a qualifying 30-day
   * direction ('rising'/'falling'), else the decade-extreme level
   * ('high'/'low'). Null for steady and unread members.
   */
  evidence: 'rising' | 'falling' | 'high' | 'low' | null;
}

/** One lane's vote (a pan item; its members are one tap away — 01 §4). */
export interface GoldBalanceLane {
  lane: GoldLane; // fixed order: GOLD_LANES
  side: GoldBalanceSide;
  /** true when side is 'neutral' because supports === pressures > 0. */
  split: boolean;
  /** Voters readable (not missing/stale/check-pending/unavailable). */
  readable: number;
  /** supports + pressures. */
  firing: number;
  supports: number;
  pressures: number;
  /** Every voter of the lane, in table order (unread ones included). */
  members: GoldBalanceMember[];
}

/** The consolidated balance over the five lanes. */
export interface GoldBalanceReading {
  /** Exactly 5, in GOLD_LANES order (GF-P2: the flows lane, the owner's
   * recorded answer B). */
  lanes: GoldBalanceLane[];
  counts: { for: number; against: number; neutral: number; unread: number };
  /** lanesFor − lanesAgainst (01 §5.1's net). */
  net: number;
  /** for + against + neutral lane counts (01 §5.1's readable). */
  readable: number;
}

/* ------------------------------------------------------------------ *
 * The thresholds (02 §2)
 * ------------------------------------------------------------------ */

/**
 * The crowd minimum (D-GB-3): a lane votes only when at least
 * GOLD_LANE_MIN_FIRING of its voters fire — one voter alone must not tip
 * a whole lane. The P0 calibration (02 §6, BACKTEST-GOLD-LANES.md,
 * 2026-11-03) chose the DEFAULT 2 on the pre-registered criteria over
 * all windows (MIN2: C1 PASS — level 25.0%, full-tip 49.7%; C2 PASS —
 * flips 8 vs the net-sign 9), measured twice independently over two
 * corpora. Reversing it means a dedicated gated session, never a silent
 * edit.
 */
export const GOLD_LANE_MIN_FIRING = 2;

/**
 * The Outlook card's strong bar (01 §5.2): L or A ≥ GOLD_LANE_STRONG of the
 * GOLD_LANES lanes. GF-P2 (2026-11-05, the owner's recorded answer B): with
 * five lanes the bar sits at **4 of 5** — today's 3-of-4 was 75%; 4-of-5 is
 * 80%, preserving that strictness (3-of-5 = 60% would quietly have loosened
 * it — the owner's recorded reason). Restated beside the gf-p2-verify pin.
 */
export const GOLD_LANE_STRONG = 4;

/* ------------------------------------------------------------------ *
 * The engine (02 §3)
 * ------------------------------------------------------------------ */

/**
 * The readable-voter rule — gold-score.ts's own (kept verbatim; the
 * original is private and frozen): stale, check-pending and unavailable
 * readings never fire, and a missing voter is simply absent.
 */
function readable(r: IndicatorReading | undefined): r is IndicatorReading {
  return r !== undefined && r.status !== 'stale' && r.status !== 'check-pending' && r.status !== 'unavailable';
}

/**
 * The consolidated balance — pure over the readings. For each lane in
 * GOLD_LANES, each voter in table order:
 *
 *   1. not readable (missing, stale, check-pending, unavailable) → an
 *      'unread' member;
 *   2. GF-P1's D-18 INPUT-PRESENCE rule (the owner's recorded decision
 *      I, 2026-11-05): a readable seat whose evaluator carries NEITHER
 *      input (evalLeg returns no direction — no threshold or no finite
 *      change30d — and no level — no percentile10y) → an 'unread'
 *      member: the evaluator had nothing to evaluate, never a steady
 *      word on an inputless seat (the fake-steady finding, audit D-18);
 *   3. `evalLeg` lean 0 → 'steady' (readable, honestly not firing);
 *   4. else 'supports' / 'pressures' by lean × polarity, with the
 *      evaluator's own evidence word.
 *
 * The lane then votes: 'unread' when nothing could be read; 'neutral'
 * when fewer than GOLD_LANE_MIN_FIRING voters fire (split = false);
 * else 'for' / 'against' by strict majority of the FIRING voters, a
 * supports === pressures tie reading 'neutral' with split = true (the
 * mixed chip, 01 §4). `unread` and `neutral` are NEVER merged — problem
 * P5's fix.
 *
 * Deterministic and order-independent for readings; never throws on
 * missing or empty input (every lane then reads 'unread'). The counts,
 * net and readable roll up over the five lane sides (01 §5.1).
 */
export function goldBalance(readings: readonly IndicatorReading[]): GoldBalanceReading {
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  const lanes: GoldBalanceLane[] = GOLD_LANES.map((lane) => {
    const members: GoldBalanceMember[] = [];
    let readableCount = 0;
    let supports = 0;
    let pressures = 0;
    for (const def of GOLD_LANE_VOTERS) {
      if (def.lane !== lane) continue;
      const r = byId.get(def.id);
      if (!readable(r)) {
        members.push({ id: def.id, impact: 'unread', evidence: null });
        continue;
      }
      const leg = evalLeg(def.id, r);
      // GF-P1's D-18 input-presence rule (the owner's recorded decision
      // I, 2026-11-05): neither evalLeg input exists — no direction (no
      // threshold for the seat, or no finite change30d) and no level (no
      // percentile10y) — so the evaluator had NOTHING to evaluate. The
      // member reads 'unread', never 'steady' (the fake-steady class,
      // audit D-18). The check rides the evaluator's own outputs, so the
      // rule and evalLeg cannot drift.
      if (leg.direction === null && leg.level === null) {
        members.push({ id: def.id, impact: 'unread', evidence: null });
        continue;
      }
      readableCount++;
      if (leg.lean === 0) {
        // steady AND typical — honestly not firing
        members.push({ id: def.id, impact: 'steady', evidence: null });
        continue;
      }
      const impact: 'supports' | 'pressures' = leg.lean * def.polarity === 1 ? 'supports' : 'pressures';
      // The evidence that produced the lean, in the evaluator's own
      // order: a qualifying 30-day direction first, else the extreme level.
      const evidence: 'rising' | 'falling' | 'high' | 'low' =
        leg.direction === 'rising' ? 'rising' : leg.direction === 'falling' ? 'falling' : leg.level === 'high' ? 'high' : 'low';
      members.push({ id: def.id, impact, evidence });
      if (impact === 'supports') supports++;
      else pressures++;
    }
    const firing = supports + pressures;
    let side: GoldBalanceSide;
    let split = false;
    if (readableCount === 0) side = 'unread';
    else if (firing < GOLD_LANE_MIN_FIRING) side = 'neutral';
    else if (supports > pressures) side = 'for';
    else if (pressures > supports) side = 'against';
    else {
      side = 'neutral';
      split = true; // the lane's evidence disagrees — the mixed chip
    }
    return { lane, side, split, readable: readableCount, firing, supports, pressures, members };
  });

  const counts = {
    for: lanes.filter((l) => l.side === 'for').length,
    against: lanes.filter((l) => l.side === 'against').length,
    neutral: lanes.filter((l) => l.side === 'neutral').length,
    unread: lanes.filter((l) => l.side === 'unread').length,
  };
  return {
    lanes,
    counts,
    net: counts.for - counts.against,
    readable: counts.for + counts.against + counts.neutral,
  };
}
