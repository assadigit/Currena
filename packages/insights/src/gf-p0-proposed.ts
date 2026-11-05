/**
 * gf-p0-proposed.ts — the GF-P0 proposed-voter harness tables + the
 * parameterized scenario engines
 * (docs/specs/gold-meter-gapfill/01-FILL-SPEC.md — GF-P0; the audit report
 * §6.1's P0 row; the GB-S1 precedent: gold-balance-consolidation 02 §6).
 *
 * NEW TABLES BESIDE THE FROZEN ONES — **no product code** (D-GF-1):
 * this module ADDS the fill program's proposed voter set to the read-only
 * harness; it imports the frozen sources (`gold-score.ts`,
 * `gold-backtest-core.ts`, `connections.ts`) and edits NOTHING. The
 * proposed set executes in production only on the owner's recorded go,
 * per seat change, with the audit report's §4 row as the justification.
 *
 * What lives here:
 *  - `GF_LANES_5` — the proposed fifth lane (`flows`, OI-GA-2's ADD
 *    scenario) beside the frozen `GOLD_LANES` (4);
 *  - `GF_VOTERS_P2_4LANE` / `GF_VOTERS_P2_5LANE` — the proposed post-P2
 *    voter tables (the audit's recommended composition — every seat
 *    change cites the report's §4 row in its comment);
 *  - `GF_MOVE_P1_PROPOSED` — the proposed `SIGNAL_LEG_MOVE` additions
 *    (D-2/D-3's repairs + the D-1 calibration's derived thresholds),
 *    beside the frozen map — a PROPOSAL, not a product edit;
 *  - the PARAMETERIZED scenario engines — faithful copies of the frozen
 *    evaluators with the lane list / voter table / threshold map /
 *    crowd minimum / D-18 input-presence rule as parameters:
 *      `gfEvalLeg`           ≡ `connections.ts evalLeg` (threshold map parameterized),
 *      `gfLaneBalance`       ≡ `gold-backtest-core.ts laneBalanceOverVoters`
 *                             (lanes + thresholds + the D-18 rule parameterized),
 *      `gfNetScore`          ≡ `gold-backtest-core.ts scoreOverVoters`
 *                             (thresholds parameterized) — C2's net-sign figure,
 *      `gfCalibrationStats`  ≡ `gold-backtest-core.ts laneCalibrationStats`
 *                             (lane list parameterized).
 *    Each equivalence is PINNED BY TEST (gf-p0-proposed.test.ts) on the
 *    frozen configuration — the copies cannot drift from the engines
 *    (the scoreOverVoters discipline).
 *
 * HONESTY RULES (inherited, D-GF-2/D-GF-3): the engines here measure
 * firing statistics and lane behaviour ONLY — never predictive power; no
 * forecasting claim accompanies any table in this module. The beam
 * formula (D-GB-8) is inherited UNCHANGED: |net| / (for + against) × 10
 * degrees, clamped to [3, 10], level at net = 0 — the formula is
 * lane-count-agnostic and this module does not touch it.
 *
 * Platform-free (AGENTS.md rule 2): pure, offline, no clock reads — the
 * calibration script passes every date explicitly. Tested in
 * gf-p0-proposed.test.ts. Never imported by production paths.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';

import type { LegDirection, LegLevel } from './connections';
import { GOLD_LANE_VOTERS, GOLD_LANES } from './gold-score';
import type { GoldLane, GoldLaneVoter } from './gold-score';
import type { GoldLaneSide, HarnessLaneBalance } from './gold-backtest-core';
import {
  LANE_CALIB_FULLTIP_MAX_SHARE,
  LANE_CALIB_LEVEL_MAX_SHARE,
  medianFlipsPer60,
} from './gold-backtest-core';

/* ------------------------------------------------------------------ *
 * The proposed lane vocabulary (OI-GA-2)
 * ------------------------------------------------------------------ */

/**
 * The proposed fifth lane — `flows` (OI-GA-2's ADD scenario, the audit
 * report §5's recommendation: "Add a flows & demand lane" — D-14's
 * evidence: the F-family's 16 rows hold exactly one voter anywhere,
 * seated in market stress where it can never tip the lane alone). A
 * proposal only: the lane ships on the owner's recorded go; until then
 * production speaks `GOLD_LANES` (the frozen four).
 */
export const GF_FLOWS_LANE = 'flows' as const;

/** The frozen four (an alias for readability — never a second source). */
export const GF_LANES_4: readonly GoldLane[] = GOLD_LANES;

/** The proposed five: the frozen four + `flows`. */
export const GF_LANES_5: readonly string[] = [...GOLD_LANES, GF_FLOWS_LANE];

/** A voter of a PROPOSED table — the lane may be the proposed fifth. */
export interface GfVoter {
  lane: GoldLane | typeof GF_FLOWS_LANE;
  /** A production id, or the F2 scenario proxy (a harness-local id, never a DEFINITIONS entry). */
  id: GfCandidateId;
  polarity: 1 | -1;
}

/** The F2 scenario proxy's harness-local id (never a production IndicatorId — the P2 design will name the real object). */
export type GfCandidateId = IndicatorId | typeof GF_F2_PROXY_ID;

/* ------------------------------------------------------------------ *
 * The proposed move-threshold map (D-2 / D-3 / the D-1 calibration)
 * ------------------------------------------------------------------ */

/**
 * The frozen `SIGNAL_LEG_MOVE`'s gold-lane entries, copied VERBATIM from
 * connections.ts:575-585 (the original is private; the copy is pinned to
 * the original by test — gfEvalLeg(id, r, {}) === evalLeg(id, r) on the
 * four anchor seats). The five non-gold-lane entries of the original map
 * (gold-usd · silver-usd · brent · copper-gold · china-pmi) are not
 * consumed by any lane engine and are not carried here — the pin covers
 * the gold-lane seats the calibration can reach.
 */
export const GF_MOVE_FROZEN_BASE: Readonly<Partial<Record<IndicatorId, number>>> = {
  'real-yield-10y': 0.1, // points
  'dollar-basket': 1.0, // points
  'breakeven-5y5y': 0.1, // points
  us10y: 0.15, // points
};

/**
 * The proposed `SIGNAL_LEG_MOVE` ADDITIONS — the GF-P1 threshold
 * proposals (the audit report §5's D-1 answer: "derive, don't assume").
 * Every value is DERIVED from the corpus (the anchors' firing band, the
 * derivation stated + measured in
 * docs/specs/gold-meter-gapfill/evidence/gf-p0-calibration-2026-11-05.md
 * §3) — a PROPOSAL beside the frozen map, executed on the owner's
 * recorded go per seat:
 *
 *  - `fed-expectations` (D-2, rank 1 → GF-P1): R6's change-led claim
 *    ("the priced path is what MOVES gold"; 02 R6's treatment "change +
 *    level vs decade range") — points;
 *  - `usdjpy` (D-3, rank 2 → GF-P1): D4's "change emphasis" treatment —
 *    pct units (the only pct-changeKind seat);
 *  - `fed-target` (R5's "level + step direction" treatment): the derived
 *    value measured against the 0.25-point step grid — see the report;
 *  - `term-premium-10y` (R9's promotion, rank 6 → GF-P2): 02 R9's
 *    treatment is "level + change" — the promotion's threshold derives
 *    by the same rule;
 *  - `t5yie` (R8's promotion, rank 9 → GF-P2): 02 R8's treatment is
 *    "level + change".
 *
 * Every other level-only seat is accept-with-note (02 treatment
 * level-led, monthly cadence exempt, or the promotion's own recorded
 * level-only variant — the per-seat walk with the numbers: the report
 * §4).
 */
export const GF_MOVE_P1_PROPOSED: Readonly<Partial<Record<IndicatorId, number>>> = {
  // The values below are the calibration's derived proposals (derived by the
  // GF-S1 run over the recorded corpus, 2026-11-05 — the derivation rule, the
  // anchors' measured band and each value's measured firing share: the report
  // §3; the per-seat firing effect: §4/§6). They override nothing until the
  // owner's recorded go executes GF-P1.
  'fed-expectations': 0.13, // points (D-2) — derived §3 (share 50.7%, n=2512); measured §6
  usdjpy: 1.38, // pct (D-3) — derived §3 (share 51.4%, n=2494); measured §6
  'fed-target': 0.25, // points (R5 step-direction) — derived §3 (share 7.0%, n=2512 — the one-FOMC-step grid); measured §6
  'term-premium-10y': 0.07, // points (R9, level+change) — derived §3 (share 49.2%, n=2512); measured §6
  t5yie: 0.1, // points (R8, level+change) — derived §3 (share 50.7%, n=2512); measured §6
};

/** The merged map the post-P1 scenarios evaluate with (a copy, never a mutation of the base). */
export function gfMoveMapWith(
  additions: Readonly<Partial<Record<IndicatorId, number>>>,
): Readonly<Partial<Record<GfCandidateId, number>>> {
  return { ...GF_MOVE_FROZEN_BASE, ...additions };
}

/* ------------------------------------------------------------------ *
 * The proposed voter tables (the audit report §4's ranks → §6.1 P2)
 * ------------------------------------------------------------------ */

/**
 * The proposed post-P2 voter set — the 4-LANE variant (OI-GA-2's fold
 * alternative). The audit's recommended composition: the frozen 21 − the
 * D-7/D-8 yield-curve demotion (the report §5's recommendation (b), per
 * 02 R4's own "context / secondary" treatment) + the zero-new-fetch
 * promotions (ranks 6–18) + the COBD promotions (OI-GA-3's territory).
 * Every seat change cites its §4 row; every promotion executes only on
 * the owner's recorded go (D-GF-1).
 */
export const GF_VOTERS_P2_4LANE: readonly GfVoter[] = [
  // ——— Borrowing costs (6): the frozen eight − the two yield-curve seats
  // ——— (D-7/D-8 context demotion, R4 rank 3) — the demotion variant is
  // ——— measured beside the keep variant (the owner's sign decision).
  { lane: 'borrowing-costs', id: 'real-yield-10y', polarity: -1 }, // R1 COVERED — the textbook driver
  { lane: 'borrowing-costs', id: 'us10y', polarity: -1 }, // R1's belt-and-braces (D-9 accept-with-note)
  { lane: 'borrowing-costs', id: 'us30y', polarity: -1 }, // R1's belt-and-braces (D-10)
  { lane: 'borrowing-costs', id: 'fed-target', polarity: -1 }, // R5 COVERED
  { lane: 'borrowing-costs', id: 'fed-expectations', polarity: -1 }, // R6 PARTIAL → repaired (D-2 threshold)
  { lane: 'borrowing-costs', id: 'ecb-dfr', polarity: -1 }, // R10's ECB leg
  // ——— The dollar (5): the frozen three + D5 + G4 (OI-GA-3's promotions)
  { lane: 'dollar', id: 'dollar-basket', polarity: -1 }, // D1 COVERED
  { lane: 'dollar', id: 'usdjpy', polarity: -1 }, // D4 PARTIAL → repaired (D-3 threshold)
  { lane: 'dollar', id: 'us-japan-10y-gap', polarity: -1 }, // R10 PARTIAL → repaired (D-6 persistence simulated)
  { lane: 'dollar', id: 'usd-reserve-share', polarity: -1 }, // D5 ★ COBD → promote (rank 13; a rising USD share = headwind, the dedollarisation inverse)
  { lane: 'dollar', id: 'nyfed-custody', polarity: -1 }, // G4 ★ COBD → promote (rank 18; rising foreign custody = dollar-asset demand = headwind — the D5 pairing)
  // ——— Market stress (11): the frozen five (cftc stays here in the 4-lane
  // ——— variant) + the six promotions
  { lane: 'stress', id: 'stress-stlfsi', polarity: 1 }, // S5 COVERED
  { lane: 'stress', id: 'nfci', polarity: 1 }, // S5 COVERED
  { lane: 'stress', id: 'vix', polarity: 1 }, // S1 COVERED
  { lane: 'stress', id: 'gold-silver', polarity: 1 }, // X1 PARTIAL → base deepened (D-5)
  { lane: 'stress', id: 'cftc-gold-positioning', polarity: -1 }, // F1 PARTIAL → backfilled (D-4; crowded longs fragile — contrarian)
  { lane: 'stress', id: 'term-premium-10y', polarity: 1 }, // R9 MISSING-FREE → promote (rank 6; 02 R9 "+": rises with fiscal/inflation-risk fear, gold-positive)
  { lane: 'stress', id: 'ebp', polarity: 1 }, // S4 MISSING-FREE → promote (rank 7; the literature's preferred risk-appetite signal)
  { lane: 'stress', id: 'michigan-sentiment', polarity: -1 }, // S13 MISSING-FREE → promote (rank 10; pessimism is gold-POSITIVE — low sentiment = the tailwind side)
  { lane: 'stress', id: 'gpr-daily', polarity: 1 }, // S7 MISSING-FREE → promote (rank 11; the daily 7d-MA object proposed, gpr-index the owner's alternative)
  { lane: 'stress', id: 'epu-us', polarity: 1 }, // S8 MISSING-FREE → promote (rank 15; regime uncertainty raises the hedging premium)
  { lane: 'stress', id: 'sp500-breadth-ratio', polarity: -1 }, // S6 ★ COBD → promote (rank 17; falling breadth = risk-off = the tailwind side)
  // ——— Inflation (9): the frozen five + the four promotions
  { lane: 'inflation', id: 'us-cpi-yoy', polarity: 1 }, // I1 COVERED
  { lane: 'inflation', id: 'us-pce-core-yoy', polarity: 1 }, // I2 COVERED
  { lane: 'inflation', id: 'euro-hicp', polarity: 1 }, // N-1 — AMEND recommended (the seat stays; the denominator becomes 86 on the owner's go)
  { lane: 'inflation', id: 'breakeven-5y5y', polarity: 1 }, // R7 COVERED
  { lane: 'inflation', id: 'breakeven-tilt', polarity: 1 }, // the D-5 promotion's own recorded level-only variant (unchanged)
  { lane: 'inflation', id: 't5yie', polarity: 1 }, // R8 PARTIAL → promote (rank 9; the SPOT level's own claim, rising = near-horizon hedge demand)
  { lane: 'inflation', id: 'michigan-1y-expectations', polarity: 1 }, // I3 MISSING-FREE → promote (rank 16; households price inflation in before the market does)
  { lane: 'inflation', id: 'm2-us', polarity: 1 }, // I7 ★ COBD → promote (rank 14; the debasement channel, YoY percentile basis)
  { lane: 'inflation', id: 'us-deficit-12m', polarity: 1 }, // G1 MISSING-FREE → promote (rank 8; fiscal dominance — the debasement channel's fiscal leg; a borrowing-costs seating is the recorded alternative, the owner calls)
];

/**
 * The proposed post-P2 voter set — the 5-LANE variant (OI-GA-2's ADD
 * recommendation): the same composition with `cftc-gold-positioning`
 * RE-SEATED from market stress to the new `flows` lane (D-14's repair)
 * + the F2 proxy seat. The F2 seat here is the SCENARIO'S PROXY for F2's
 * P2-designable object (rank 12: "the gross CFTC legs — richer than
 * net"): the gross noncommercial LONG share of open interest, polarity
 * −1 (crowded longs fragile — the same contrarian read as F1's net
 * seat). The one-seat-or-two question and the gross-SHORT complement
 * are the P2 design questions the owner's go decides; the fixture
 * records both gross legs.
 */
export const GF_F2_PROXY_ID = 'gf-f2-gross-long-share' as const;

export const GF_VOTERS_5LANE: readonly GfVoter[] = [
  ...GF_VOTERS_P2_4LANE.filter((v) => v.id !== 'cftc-gold-positioning'),
  // ——— The proposed flows lane (OI-GA-2 ADD): F1 re-seated (D-14) + the
  // ——— F2 proxy (rank 12; the P2 design question recorded)
  { lane: GF_FLOWS_LANE, id: 'cftc-gold-positioning', polarity: -1 }, // F1 — the backfilled net-share seat
  { lane: GF_FLOWS_LANE, id: GF_F2_PROXY_ID, polarity: -1 }, // F2's scenario proxy — the gross-long share
];

/* ------------------------------------------------------------------ *
 * gfEvalLeg — the threshold-parameterized evaluator copy
 * ------------------------------------------------------------------ */

export interface GfLegEval {
  id: GfCandidateId;
  direction: LegDirection | null;
  level: LegLevel | null;
  lean: 1 | 0 | -1;
}

/**
 * `connections.ts evalLeg`'s arithmetic with the threshold map
 * parameterized — a faithful copy (the original reads the private
 * SIGNAL_LEG_MOVE; the equivalence on the frozen map is PINNED BY TEST:
 * gfEvalLeg(id, r, GF_MOVE_FROZEN_BASE) === evalLeg(id, r)). Pure; no
 * product path ever calls this.
 */
export function gfEvalLeg(
  id: GfCandidateId,
  reading: IndicatorReading,
  moveMap: Readonly<Partial<Record<GfCandidateId, number>>>,
): GfLegEval {
  const threshold = moveMap[id];
  let direction: LegDirection | null = null;
  if (
    threshold !== undefined &&
    reading.change30d !== undefined &&
    Number.isFinite(reading.change30d)
  ) {
    if (reading.change30d > threshold) direction = 'rising';
    else if (reading.change30d < -threshold) direction = 'falling';
    else direction = 'steady';
  }
  const level =
    reading.percentile10y !== undefined
      ? reading.percentile10y < 0.2
        ? ('low' as const)
        : reading.percentile10y > 0.8
          ? ('high' as const)
          : ('typical' as const)
      : null;
  let lean: 1 | 0 | -1 = 0;
  if (direction === 'rising') lean = 1;
  else if (direction === 'falling') lean = -1;
  else if (level === 'high') lean = 1;
  else if (level === 'low') lean = -1;
  return { id, direction, level, lean };
}

/* ------------------------------------------------------------------ *
 * The parameterized lane engine (02 §3's algorithm, the GB-S1 precedent)
 * ------------------------------------------------------------------ */

/** One lane's vote under a parameterized configuration. */
export interface GfLaneVote {
  lane: string;
  side: GoldLaneSide;
  split: boolean;
  readable: number;
  firing: number;
  supports: number;
  pressures: number;
}

/** The balance over a parameterized lane list. */
export interface GfLaneBalance {
  lanes: GfLaneVote[];
  counts: { for: number; against: number; neutral: number; unread: number };
  net: number;
  readable: number;
  state: 'tipped-for' | 'tipped-against' | 'level' | 'none';
  /** D-GB-8's formula, UNCHANGED and lane-count-agnostic. */
  beamAngle: number;
  fullyTipped: boolean;
}

/** The readable-voter rule, gold-balance.ts's own (verbatim semantics). */
function readable(r: IndicatorReading | undefined): r is IndicatorReading {
  return r !== undefined && r.status !== 'stale' && r.status !== 'check-pending' && r.status !== 'unavailable';
}

/**
 * The D-18 input-presence question, measured: when `inputPresence` is
 * true, a readable seat with NEITHER evalLeg input (no change30d, no
 * percentile10y) counts as UNREAD for the lane's readable count — the
 * audit's recommended rule (the report §5: "a seat with neither evalLeg
 * input reads `unread`"). The member's impact word in the report tables
 * follows the same rule.
 */
function seatReadable(
  r: IndicatorReading | undefined,
  inputPresence: boolean,
  moveMap: Readonly<Partial<Record<GfCandidateId, number>>>,
): r is IndicatorReading {
  if (!readable(r)) return false;
  if (!inputPresence) return true;
  const hasMoveInput = r.change30d !== undefined && Number.isFinite(r.change30d) && moveMap[r.id] !== undefined;
  const hasLevelInput = r.percentile10y !== undefined && Number.isFinite(r.percentile10y);
  return hasMoveInput || hasLevelInput;
}

/**
 * `gold-backtest-core.ts laneBalanceOverVoters` with the lane list, the
 * threshold map and the D-18 rule parameterized. On the frozen
 * configuration (GOLD_LANES, GOLD_LANE_VOTERS, GF_MOVE_FROZEN_BASE,
 * inputPresence = false, any minFiring) the output is IDENTICAL to the
 * frozen engine's — PINNED BY TEST.
 */
export function gfLaneBalance(
  readings: readonly IndicatorReading[],
  voters: readonly GfVoter[],
  lanes: readonly string[],
  minFiring: number,
  moveMap: Readonly<Partial<Record<GfCandidateId, number>>> = GF_MOVE_FROZEN_BASE,
  inputPresence = false,
): GfLaneBalance {
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  const laneVotes: GfLaneVote[] = lanes.map((lane) => {
    let readableCount = 0;
    let supports = 0;
    let pressures = 0;
    for (const def of voters) {
      if (def.lane !== lane) continue;
      const r = byId.get(def.id);
      if (!seatReadable(r, inputPresence, moveMap)) continue;
      readableCount++;
      const leg = gfEvalLeg(def.id, r, moveMap);
      if (leg.lean === 0) continue; // steady AND typical — honestly not firing
      if (leg.lean * def.polarity === 1) supports++;
      else pressures++;
    }
    const firing = supports + pressures;
    let side: GoldLaneSide;
    let split = false;
    if (readableCount === 0) side = 'unread';
    else if (firing < minFiring) side = 'neutral';
    else if (supports > pressures) side = 'for';
    else if (pressures > supports) side = 'against';
    else {
      side = 'neutral';
      split = true;
    }
    return { lane, side, split, readable: readableCount, firing, supports, pressures };
  });

  const counts = {
    for: laneVotes.filter((l) => l.side === 'for').length,
    against: laneVotes.filter((l) => l.side === 'against').length,
    neutral: laneVotes.filter((l) => l.side === 'neutral').length,
    unread: laneVotes.filter((l) => l.side === 'unread').length,
  };
  const net = counts.for - counts.against;
  const tipped = counts.for + counts.against;
  const beamAngle = net === 0 || tipped === 0 ? 0 : Math.min(10, Math.max(3, (Math.abs(net) / tipped) * 10));
  const state: GfLaneBalance['state'] =
    counts.unread === lanes.length ? 'none' : net > 0 ? 'tipped-for' : net < 0 ? 'tipped-against' : 'level';
  return {
    lanes: laneVotes,
    counts,
    net,
    readable: counts.for + counts.against + counts.neutral,
    state,
    beamAngle,
    fullyTipped: net !== 0 && Math.abs(net) === tipped,
  };
}

/* ------------------------------------------------------------------ *
 * gfNetScore — the net-sign figure with thresholds parameterized
 * ------------------------------------------------------------------ */

/**
 * The raw voter net sign under a parameterized threshold map (C2's
 * comparison figure — the "old count" of the SAME voter set, exactly as
 * GB-S1 used the 21-voter net sign). Pure; tailwind − headwind.
 */
export function gfNetScore(
  readings: readonly IndicatorReading[],
  voters: readonly GfVoter[],
  moveMap: Readonly<Partial<Record<GfCandidateId, number>>> = GF_MOVE_FROZEN_BASE,
): number {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  let net = 0;
  for (const def of voters) {
    const r = byId.get(def.id);
    if (!readable(r)) continue;
    const leg = gfEvalLeg(def.id, r, moveMap);
    if (leg.lean === 0) continue;
    net += leg.lean * def.polarity;
  }
  return net;
}

/* ------------------------------------------------------------------ *
 * gfCalibrationStats — the C1/C2 statistics over any lane list
 * ------------------------------------------------------------------ */

/** The per-rule calibration figures (02 §6 items 1–3 + the C1/C2 verdicts), lane-count-agnostic. */
export interface GfCalibrationStats {
  n: number;
  tippedFor: number;
  tippedAgainst: number;
  level: number;
  none: number;
  beam: { level: number; mid: number; full: number };
  fullyTipped: number;
  laneUnread: Record<string, number>;
  laneSplit: Record<string, number>;
  flipsMedianPer60: number | null;
  netSignFlipsMedianPer60: number | null;
  c1: boolean;
  c2: boolean;
}

/**
 * `gold-backtest-core.ts laneCalibrationStats` over an arbitrary lane
 * list (the original's per-lane maps are typed to the frozen four; the
 * arithmetic — C1's 70%/60% ceilings, C2's not-higher-than, the
 * 60-trading-day flip window — is IDENTICAL and pre-registered). On a
 * four-lane input the output matches the frozen function's — PINNED BY
 * TEST.
 */
export function gfCalibrationStats(
  balances: readonly GfLaneBalance[],
  netScores: readonly number[],
  lanes: readonly string[],
): GfCalibrationStats {
  const n = balances.length;
  let tippedFor = 0;
  let tippedAgainst = 0;
  let level = 0;
  let none = 0;
  let beamLevel = 0;
  let beamMid = 0;
  let beamFull = 0;
  let fullyTipped = 0;
  const laneUnread: Record<string, number> = {};
  const laneSplit: Record<string, number> = {};
  for (const lane of lanes) {
    laneUnread[lane] = 0;
    laneSplit[lane] = 0;
  }

  for (const b of balances) {
    if (b.state === 'tipped-for') tippedFor++;
    else if (b.state === 'tipped-against') tippedAgainst++;
    else if (b.state === 'none') {
      none++;
      level++;
    } else level++;
    if (b.beamAngle === 0) beamLevel++;
    else if (b.beamAngle <= 6) beamMid++;
    else beamFull++;
    if (b.fullyTipped) fullyTipped++;
    for (const l of b.lanes) {
      if (l.side === 'unread') laneUnread[l.lane] = (laneUnread[l.lane] ?? 0) + 1;
      if (l.split) laneSplit[l.lane] = (laneSplit[l.lane] ?? 0) + 1;
    }
  }

  const flipsMedianPer60 = medianFlipsPer60(balances.map((b) => b.state as string));
  const netSignFlipsMedianPer60 = medianFlipsPer60(netScores.map((s) => (s > 0 ? '+' : s < 0 ? '-' : '0')));

  const levelShare = n > 0 ? level / n : 1;
  const fullTipShare = n > 0 ? fullyTipped / n : 1;
  const c1 = n > 0 && levelShare <= LANE_CALIB_LEVEL_MAX_SHARE && fullTipShare <= LANE_CALIB_FULLTIP_MAX_SHARE;
  const c2 =
    flipsMedianPer60 !== null && netSignFlipsMedianPer60 !== null && flipsMedianPer60 <= netSignFlipsMedianPer60;

  return {
    n,
    tippedFor,
    tippedAgainst,
    level,
    none,
    beam: { level: beamLevel, mid: beamMid, full: beamFull },
    fullyTipped,
    laneUnread,
    laneSplit,
    flipsMedianPer60,
    netSignFlipsMedianPer60,
    c1,
    c2,
  };
}

/* ------------------------------------------------------------------ *
 * The scenario configurations (the calibration's inputs, stated once)
 * ------------------------------------------------------------------ */

/** One calibration scenario: everything a run needs, stated explicitly. */
export interface GfScenario {
  /** The scenario's label (the report's headline name). */
  name: string;
  lanes: readonly string[];
  voters: readonly GfVoter[];
  moveMap: Readonly<Partial<Record<IndicatorId, number>>>;
  minFiring: number;
  /** The D-18 input-presence rule (the report §5's recommended variant). */
  inputPresence: boolean;
}

/**
 * The GF-P0 scenario family, stated once (the calibration script runs
 * exactly these; the report labels every table with its scenario name):
 *
 *  - **FROZEN** — the current production state (21 voters, 4 lanes, the
 *    frozen thresholds): the GB-S1 baseline re-derivation. MUST
 *    reproduce BACKTEST-GOLD-LANES.md's committed numbers (the script
 *    asserts them — a drift means the harness drifted, not the meter).
 *  - **POST-P1** — the repairs' state: the D-2/D-3 + D-1 thresholds +
 *    the F1 backfill + the D-18 rule; the yield-curve seats KEPT (the
 *    sign decision pending — measured both ways).
 *  - **POST-P1-DEMOTE** — POST-P1 with the D-7/D-8 context demotion
 *    (the audit's recommended variant, R4 rank 3).
 *  - **POST-P2-4LANE** — the promotions on the frozen four lanes.
 *  - **POST-P2-5LANE** — the promotions with the flows lane (OI-GA-2's
 *    ADD recommendation).
 *
 * Each scenario runs under BOTH crowd rules (MIN2 = D-GB-3's default,
 * MIN1 = the pre-registered fallback) and both window scopes (all
 * windows / the mature base ≥ 2021-09-23) — the GB-S1 protocol,
 * unchanged.
 */
export function gfScenarios(): GfScenario[] {
  const frozenVoters: readonly GfVoter[] = GOLD_LANE_VOTERS;
  const p1Voters = frozenVoters; // P1 repairs no seat: thresholds + the backfill only
  const p1DemoteVoters = frozenVoters.filter((v) => v.id !== 'yield-curve-10y2y' && v.id !== 'yield-curve-10y3m');
  const scenarios: GfScenario[] = [];
  const push = (
    name: string,
    lanes: readonly string[],
    voters: readonly GfVoter[],
    moveMap: Readonly<Partial<Record<IndicatorId, number>>>,
    inputPresence: boolean,
    minFiring: number,
  ): void => {
    scenarios.push({ name: `${name} (MIN${minFiring})`, lanes, voters, moveMap, minFiring, inputPresence });
  };
  for (const minFiring of [2, 1] as const) {
    push('FROZEN', GF_LANES_4, frozenVoters, GF_MOVE_FROZEN_BASE, false, minFiring);
    push('POST-P1', GF_LANES_4, p1Voters, gfMoveMapWith(GF_MOVE_P1_PROPOSED), true, minFiring);
    push('POST-P1-DEMOTE', GF_LANES_4, p1DemoteVoters, gfMoveMapWith(GF_MOVE_P1_PROPOSED), true, minFiring);
    push('POST-P2-4LANE', GF_LANES_4, GF_VOTERS_P2_4LANE, gfMoveMapWith(GF_MOVE_P1_PROPOSED), true, minFiring);
    push('POST-P2-5LANE', GF_LANES_5, GF_VOTERS_5LANE, gfMoveMapWith(GF_MOVE_P1_PROPOSED), true, minFiring);
  }
  return scenarios;
}

/** The types the calibration script's window records reuse (no duplication). */
export type { GoldLaneSide, HarnessLaneBalance, GoldLaneVoter, LegDirection, LegLevel };
