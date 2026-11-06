/**
 * The gold-directional scoring engine (the Gold Program, session S1).
 *
 * ONE question: do the classic macro drivers currently lean WITH gold or
 * AGAINST it? The engine re-cuts the EXISTING gauge voters — the same
 * readings the page already holds — into a single directional score:
 *
 *   - 5 LANES (sub-gauges): borrowing costs (tight/relief), the dollar
 *     (strong/under stress), market stress (elevated/calm), inflation
 *     (running hot/cooling) and — since GF-P2, the owner's recorded
 *     answer B (OI-GA-2 ADD, 2026-11-05) — flows & demand (crowded /
 *     capitulating positioning). Each lane's reading comes from its
 *     firing voters, never from a new fetch; the inflation lane carries
 *     five voters since the D-5 promotion (Session 6 — breakeven-tilt);
 *   - FIRING VOTERS: a voter fires when the shared signals evaluator
 *     (connections.ts evalLeg — direction over 30 days with a per-leg
 *     minimum move, else the 10-year position) leans ±1, and its lean is
 *     mapped onto gold through a fixed polarity table below;
 *   - THE NET SCORE: tailwind voters − headwind voters, labelled on a
 *     5-step scale (strong tailwind → strong headwind) with the same
 *     share-based philosophy as the question gauges;
 *   - MODEL VS REALITY: the score's direction compared with what gold
 *     ACTUALLY did over the past 30 days (aligned / diverging / neutral).
 *
 * Descriptive, hedged, never advice (the signals-card contract): the
 * words say "the drivers lean", never "buy" or "sell", and no green/red
 * — words and counts only.
 *
 * Pure, platform-free (AGENTS.md rule 2): reads the snapshot the page or
 * the runner already holds; zero new fetches, zero KV ops. The ingest
 * writes the COMPACT summary (goldSummaryOf — the numbers, not the
 * voter list) onto the snapshot (~0.5 KB); the SPA re-derives the full
 * reading client-side through this SAME module (the gauges.ts contract:
 * one pure function, both sides, no drift).
 *
 * Copy note (S2.1, owner round 2026-10-31 — "must be bilingual"): the
 * panel copy NO LONGER lives in this package. It moved to the web i18n
 * dictionaries (apps/web/src/i18n/insights-copy-{en,fa}.ts under
 * signals.goldScore / signals.goldModelVsReality) so both locales render
 * through the same reviewed-copy path as every other insights panel,
 * behind the Persian-copy audit gate. This module keeps ONLY the pure
 * engine + the explainer-key selection.
 */

import type { GoldSummary, IndicatorId, IndicatorReading } from '@currena/core';
import { evalLeg } from './connections';

/* ------------------------------------------------------------------ *
 * The vocabulary
 * ------------------------------------------------------------------ */

/** The five driver lanes, in display order (the fifth — `flows` — added at
 * GF-P2, 2026-11-05: the owner's recorded answer B, OI-GA-2's ADD scenario). */
export const GOLD_LANES = ['borrowing-costs', 'dollar', 'stress', 'inflation', 'flows'] as const;
export type GoldLane = (typeof GOLD_LANES)[number];

/** What a firing voter does to gold. */
export type GoldVoterImpact = 'tailwind' | 'headwind';

/**
 * WHY a voter fired — the shared evaluator's own evidence: a 30-day
 * direction beyond the per-leg minimum move ('rising'/'falling'), or a
 * decade-extreme LEVEL when the series is steady ('high'/'low').
 */
export type GoldVoterEvidence = 'rising' | 'falling' | 'high' | 'low';

/** One firing voter. */
export interface GoldVoter {
  id: IndicatorId;
  lane: GoldLane;
  impact: GoldVoterImpact;
  evidence: GoldVoterEvidence;
}

/**
 * A lane's word — the four directional pairs plus the honest shared pair
 * (the flows lane shares the stress pair's words — demand elevated / calm —
 * the harness's own recorded mapping).
 * 'unreadable' = no voter in the lane could fire (never a guess).
 */
export type GoldSubGaugeWord =
  | 'tight' | 'relief' // borrowing-costs: relief = tailwind for gold
  | 'strong' | 'stress' // dollar: strong = headwind, under stress = tailwind
  | 'elevated' | 'calm' // market stress: elevated = tailwind (safe haven)
  | 'hot' | 'cool' // inflation: running hot = tailwind (hedge demand)
  | 'mixed' | 'unreadable'; // any lane: disagreement / nothing firing

/** One lane's reading (voter counts are the lane's own firing detail). */
export interface GoldSubGaugeReading {
  lane: GoldLane;
  reading: GoldSubGaugeWord;
  tailwindVoters: number;
  headwindVoters: number;
}

/** The 5-step label (null when nothing could fire — never invented). */
export type GoldTailwindLabel =
  | 'strong-tailwind'
  | 'tailwind'
  | 'balanced'
  | 'headwind'
  | 'strong-headwind';

/** The engine's full reading (the compact wire shape minus the voters). */
export interface GoldTailwindReading {
  /** tailwind voters − headwind voters (signed). */
  netScore: number;
  label: GoldTailwindLabel | null;
  /** Voters that fired (either direction). */
  firingVoters: number;
  tailwindVoters: number;
  headwindVoters: number;
  /** How many of the five LANES read tailwind / headwind / mixed. */
  laneCounts: { tailwind: number; headwind: number; mixed: number };
  /** The five lane readings, in GOLD_LANES order. */
  subGauges: readonly GoldSubGaugeReading[];
  /** The firing voters, in lane order then table order. */
  voters: readonly GoldVoter[];
}

/* ------------------------------------------------------------------ *
 * The voter table — the classic driver relationships, one polarity each
 * ------------------------------------------------------------------ */

/**
 * The gold polarity of one voter's lean: gold direction = lean × polarity.
 * +1: the lean's positive direction (rising/high) is a TAILWIND for gold.
 * −1: the lean's positive direction is a HEADWIND.
 *
 * Curated from the gauge voters — NOT every gauge member rides along:
 * govt-interest-revenue stays out (a fiscal-sustainability share whose
 * gold signal is contested — high interest costs argue both ways), and
 * the growth-health lane stays out entirely (its members' gold relation
 * is weak or two-sided; copper-gold is already a ratio ABOUT gold).
 * Brent stays out of the inflation lane (supply shocks are not the
 * hedge-demand channel the lane measures). The 21st seat went to
 * breakeven-tilt (D-5, Session 6) — the expectations tilt the panel
 * already reads beside the lane's word, promoted on the owner's call.
 */
export interface GoldLaneVoter {
  lane: GoldLane;
  id: IndicatorId;
  polarity: 1 | -1;
}

/**
 * The 37 voters (7 borrowing costs · 7 dollar · 11 stress · 10 inflation ·
 * 2 flows).
 *
 * Session 6 (2026-10-31, the D-5 promotion — the owner's "we can have 21"
 * on S4's B4 evidence): `breakeven-tilt` joined the inflation lane as the
 * 21st voter, EXACTLY the variant B4 measured — polarity +1 (a building
 * tilt is the tailwind side, like the lane's own hot-inflation reading) and
 * LEVEL-LEG ONLY (the shared evaluator carries no 30-day move threshold for
 * it, so it fires on the decade position alone). The promotion is a scope
 * choice the owner is entitled to make, not an edge claim the harness
 * supports (the B4 delta: sign-agreements moved +0.4/+0.7/+0.0pp — no
 * material difference); the panel's measured-reality note (S5, C4a) stays
 * the operative description.
 *
 * GF-P1 (2026-11-05, the owner's recorded decision H — the D-7/D-8 sign
 * question, option (b) context demotion; the audit report §4 row 3 / R4
 * the justification attached per the per-seat approval rule D-GF-1):
 * `yield-curve-10y2y` and `yield-curve-10y3m` LEAVE the voter set — the
 * fixed −1 polarity sat on a regime-dependent claim (02 R4's own locked
 * treatment: "context / secondary"), so both seats demote to context
 * (the indicators keep their own cards on the page; they simply never
 * vote). The sign question RE-OPENS with the correct object — the REAL
 * curve — when R2's DFII5 lands (GF-P3, D-11/D-12's derived curve). The
 * pre-demotion 21-seat table is preserved VERBATIM as the harness lineage
 * snapshots `HARNESS_GOLD_VOTERS_21` (gold-backtest-core.ts) and
 * `GF_VOTERS_FROZEN_21` (gf-p0-proposed.ts) — the FROZEN/POST-P1
 * calibration scenarios and the BACKTEST-GOLD-LANES.md lineage keep
 * their measured basis.
 *
 * GF-P2 (2026-11-05, the owner's recorded answers B/C/K — the GF-S7
 * answer sheet, docs/specs/gold-meter-gapfill/README.md; every seat line
 * below cites its audit-report §4 row per the per-seat approval rule
 * D-GF-1): the twelve zero-new-fetch promotions + the COBD pair + the
 * fifth `flows` lane. The composition IS the calibration's measured
 * POST-P2-5LANE table (32 seats: 6/5/10/9/2 — evidence/
 * gf-p0-calibration-2026-11-05.md §7; the harness twin
 * `GF_VOTERS_5LANE`, pinned equivalent modulo the F2 seat's recorded
 * id mapping — the F2 design decision, PROGRESS's GF-S8 block). The
 * pre-P2 19-seat table stays preserved as `GF_VOTERS_P1_DEMOTE`.
 *
 * GF-P3 (2026-11-06, the new free sources — the standing delegation "go
 * full autonomously"; every seat line below cites its audit-report §4
 * row per D-GF-1): the four FRED-sourced voter-candidates seated (R2
 * real-yield-5y · D2 dollar-broad · D9 dollar-eme · S9 bank-stress) —
 * owner-gated through the MEASURED POST-P3-5LANE scenario (the F2
 * precedent: the harness seat and the production seat agree by
 * construction; evidence/gf-p0-calibration-2026-11-05.md §7's new
 * POST-P3-5LANE rows; the harness twin `GF_VOTERS_P3_5LANE`). The
 * composition was 36 seats: 7/7/11/9/2. The D-11/D-12 real-curve
 * sign question (unlocked by R2's fill) is a DECISION LIST item — both
 * variants measured, never seated silently. The P2 verify
 * (gf-p2-verify) is superseded by gf-p3-verify as the live pin (the P2
 * evidence stays as the dated record, like P1's before it).
 *
 * GF-S10 (2026-11-06, the remaining P3 sources — the standing delegation
 * riding the MEASURED POST-P4-5LANE scenario, the GF-P3 precedent): the
 * I4 5–10y household anchor seated (michigan-5y-expectations, the
 * inflation lane — "the slow version of R7"; the audit report §4 rank
 * 32 the justification per D-GF-1; the harness twin `GF_VOTERS_P4_5LANE`;
 * the UoM SIE series' full monthly history recorded in the candidates
 * fixture). The composition is now 37 seats: 7/7/11/10/2. The F6
 * Shanghai premium lands as a CONTEXT CARD (its seat unmeasurable over
 * the corpus — the SGE archive reaches only to ~2024; the seat question
 * recorded-open with the coverage fact printed). The D-11/D-12
 * real-curve sign question stays a DECISION LIST item (both variants
 * measured, never seated silently). The P3 verify (gf-p3-verify) is
 * superseded by gf-p4-verify as the live pin (the P3 evidence stays as
 * the dated record, like P2's before it).
 */
export const GOLD_LANE_VOTERS: readonly GoldLaneVoter[] = [
  // ——— Borrowing costs (7): TIGHT is the classic gold headwind (real rates
  // ——— are gold's opportunity cost); RELIEF (falling/low rates) the tailwind.
  // ——— GF-P1 (the owner's recorded H, 2026-11-05): the two yield-curve
  // ——— seats demoted to context cards (D-7/D-8, R4) — 8 → 6 (unchanged at P2).
  // ——— GF-P3 (2026-11-06): R2's 5y real yield seated (the real-yield-10y's
  // ——— twin, the belly where policy bites first) — 6 → 7.
  { lane: 'borrowing-costs', id: 'real-yield-10y', polarity: -1 }, // R1 COVERED — THE textbook driver
  { lane: 'borrowing-costs', id: 'us10y', polarity: -1 }, // R1's belt-and-braces (D-9 accept-with-note)
  { lane: 'borrowing-costs', id: 'us30y', polarity: -1 }, // R1's belt-and-braces (D-10)
  { lane: 'borrowing-costs', id: 'fed-target', polarity: -1 }, // R5 COVERED — high policy rate = tight
  { lane: 'borrowing-costs', id: 'fed-expectations', polarity: -1 }, // R6 PARTIAL → repaired at P1 (D-2 threshold)
  { lane: 'borrowing-costs', id: 'ecb-dfr', polarity: -1 }, // R10's ECB leg
  { lane: 'borrowing-costs', id: 'real-yield-5y', polarity: -1 }, // GF-P3 (the standing delegation): R2 MISSING-FREE → promote (§4 rank 19 — the 5y real yield, the belly where policy bites first; the real-yield-10y's twin. Owner-gated through the MEASURED POST-P3-5LANE scenario — the F2 precedent: the harness seat and the production seat agree by construction. Unlocks D-11/D-12's derived real curve — the sign question is a DECISION LIST item, never seated silently)
  // ——— The dollar (7): STRONG is the headwind (gold is priced in USD); a
  // ——— dollar under STRESS (falling/low) is the tailwind. GF-P2 adds the
  // ——— COBD pair (the owner's recorded C + K: D5 and G4, OI-GA-3's
  // ——— territory — §4 rows 13 and 18). GF-P3: the trade-weighted dollar
  // ——— pair (D2 broad + D9 EME) seated — 5 → 7.
  { lane: 'dollar', id: 'dollar-basket', polarity: -1 }, // D1 COVERED
  { lane: 'dollar', id: 'usdjpy', polarity: -1 }, // D4 PARTIAL → repaired at P1 (D-3 threshold) — the funding currency
  { lane: 'dollar', id: 'us-japan-10y-gap', polarity: -1 }, // R10 PARTIAL → repaired at P1 (D-6 persistence) — carry fuel, dollar-positive
  { lane: 'dollar', id: 'usd-reserve-share', polarity: -1 }, // GF-P2 (C): D5 ★ COBD → promote (§4 rank 13 — a rising USD reserve share = headwind, the dedollarisation inverse; the classic long-run channel)
  { lane: 'dollar', id: 'nyfed-custody', polarity: -1 }, // GF-P2 (K): G4 ★ COBD → promote (§4 rank 18 — rising foreign custody = dollar-asset demand = headwind, the D5 pairing)
  { lane: 'dollar', id: 'dollar-broad', polarity: -1 }, // GF-P3 (the standing delegation): D2 MISSING-FREE → promote (§4 rank 20 — the broad trade-weighted dollar, "the honest inverse"; the dollar-basket's own family. Owner-gated through the MEASURED POST-P3-5LANE scenario — the F2 precedent)
  { lane: 'dollar', id: 'dollar-eme', polarity: -1 }, // GF-P3 (the standing delegation): D9 MISSING-FREE → promote (§4 rank 21 — the EME dollar, the marginal buyer's leg; the dollar-basket's EME complement. Owner-gated through the MEASURED POST-P3-5LANE scenario — the F2 precedent)
  // ——— Market stress (11): ELEVATED usually supports gold (the safe-haven
  // ——— bid); CALM removes it. GF-P2: the six zero-new-fetch stress
  // ——— promotions (the owner's recorded K; §4 rows 6/7/10/11/15) + S6
  // ——— (C, §4 rank 17); cftc LEAVES for the new flows lane (B, D-14).
  // ——— GF-P3: S9's bank-facility rate seated — 10 → 11.
  { lane: 'stress', id: 'stress-stlfsi', polarity: 1 }, // S5 COVERED
  { lane: 'stress', id: 'nfci', polarity: 1 }, // S5 COVERED
  { lane: 'stress', id: 'vix', polarity: 1 }, // S1 COVERED
  { lane: 'stress', id: 'gold-silver', polarity: 1 }, // X1 PARTIAL → base deepened at P1 (D-5) — a high ratio IS the monetary-stress read
  { lane: 'stress', id: 'term-premium-10y', polarity: 1 }, // GF-P2 (K): R9 MISSING-FREE → promote (§4 rank 6 — rises with fiscal/inflation-risk fear, gold-positive; the 0.07-pt move threshold executed at P1 now ACTIVATES)
  { lane: 'stress', id: 'ebp', polarity: 1 }, // GF-P2 (K): S4 MISSING-FREE → promote (§4 rank 7 — the literature's PREFERRED risk-appetite signal)
  { lane: 'stress', id: 'michigan-sentiment', polarity: -1 }, // GF-P2 (K): S13 MISSING-FREE → promote (§4 rank 10 — pessimism is gold-POSITIVE: low sentiment = the tailwind side, the polarity note recorded)
  { lane: 'stress', id: 'gpr-daily', polarity: 1 }, // GF-P2 (K): S7 → promote the DAILY object (§4 rank 11 — the event-risk channel; the owner's object choice: the monthly gpr-index alternative fires 1114 vs the daily's 1316)
  { lane: 'stress', id: 'epu-us', polarity: 1 }, // GF-P2 (K): S8 MISSING-FREE → promote (§4 rank 15 — regime uncertainty raises the hedging premium; the tpu-us alternative fires 1259 — a one-seat swap recorded as the alternative)
  { lane: 'stress', id: 'sp500-breadth-ratio', polarity: -1 }, // GF-P2 (C): S6 ★ COBD → promote (§4 rank 17 — falling breadth = risk-off = the tailwind side; one-directional and measured)
  { lane: 'stress', id: 'bank-stress', polarity: 1 }, // GF-P3 (the standing delegation): S9 MISSING-FREE → promote (§4 rank 28 — the Fed's discount window primary credit rate, the standing facility's own price; the GF-S10 name repair: the GF-S9 comment's "commercial paper" description was wrong for DPCREDIT, the seat itself untouched. Owner-gated through the MEASURED POST-P3-5LANE scenario — the F2 precedent)
  // ——— Inflation (10): RUNNING HOT usually supports the hedge demand.
  // ——— GF-P2: the four promotions (the owner's recorded K; §4 rows 8/9/16 + I7).
  // ——— GF-S10: the I4 5–10y household anchor seated — 9 → 10.
  { lane: 'inflation', id: 'us-cpi-yoy', polarity: 1 }, // I1 COVERED
  { lane: 'inflation', id: 'us-pce-core-yoy', polarity: 1 }, // I2 COVERED
  { lane: 'inflation', id: 'euro-hicp', polarity: 1 }, // N-1 — AMENDED (the owner's recorded G, 2026-11-05): the v1.2 taxonomy amendment records the euro-area realised-inflation row; the seat stays, the denominator becomes 86
  { lane: 'inflation', id: 'breakeven-5y5y', polarity: 1 }, // R7 COVERED — rising inflation expectations
  { lane: 'inflation', id: 'breakeven-tilt', polarity: 1 }, // the D-5 promotion's own recorded level-only variant (unchanged)
  { lane: 'inflation', id: 't5yie', polarity: 1 }, // GF-P2 (K): R8 PARTIAL → promote (§4 rank 9 — the SPOT level's own claim; the 0.10-pt move threshold executed at P1 now ACTIVATES)
  { lane: 'inflation', id: 'michigan-1y-expectations', polarity: 1 }, // GF-P2 (K): I3 MISSING-FREE → promote (§4 rank 16 — households price inflation in before the market does)
  { lane: 'inflation', id: 'm2-us', polarity: 1 }, // GF-P2 (K): I7 ★ COBD → promote (§4 rank 14 — the debasement channel, YoY percentile basis)
  { lane: 'inflation', id: 'us-deficit-12m', polarity: 1 }, // GF-P2 (K): G1 MISSING-FREE → promote (§4 rank 8 — fiscal dominance, the debasement channel's fiscal leg)
  { lane: 'inflation', id: 'michigan-5y-expectations', polarity: 1 }, // GF-S10 (the standing delegation): I4 MISSING-FREE → promote (§4 rank 32 — the 5–10y household anchor, "the slow version of R7": households price inflation in before the market does, and the 5–10y horizon is the regime label the long-run breakeven prices. LEVEL-LEG ONLY (the I3 precedent — monthly cadence, no move threshold). Owner-gated through the MEASURED POST-P4-5LANE scenario — the GF-P3 precedent: the harness seat and the production seat agree by construction (the UoM SIE monthly history rides the candidates fixture))
  // ——— Flows & demand (2 — the owner's recorded B, OI-GA-2's ADD scenario,
  // ——— §4 rows 5 and 12 + D-14's repair): the crowded-positioning family
  // ——— gets its own lane. CFTC re-seated from market stress (F1, the
  // ——— D-4-backfilled net-share seat) + F2's REAL OBJECT — the gross
  // ——— noncommercial long share of open interest (the in-session design
  // ——— decision under the standing delegation: the production parse of
  // ——— the same deafut.txt gold row, NOT the harness proxy promoted
  // ——— as-is — the recorded reason in PROGRESS's GF-S8 block).
  { lane: 'flows', id: 'cftc-gold-positioning', polarity: -1 }, // F1 PARTIAL → backfilled at P1 (D-4) — crowded longs are fragile (the squeeze-then-slump zone — contrarian); re-seated to flows at GF-P2 (B, D-14)
  { lane: 'flows', id: 'cftc-gold-gross-long', polarity: -1 }, // GF-P2 (K): F2 MISSING-FREE → promote the REAL OBJECT (§4 rank 12 — the gross legs richer than net; rides F1's backfill — the same deafut.txt row's NonComm Long ÷ OI)
];

/* ------------------------------------------------------------------ *
 * The thresholds (documented, shared where they exist elsewhere)
 * ------------------------------------------------------------------ */

/**
 * The "strong" bar as a SHARE of firing voters (the gauge-step
 * philosophy): at least half the firing evidence on one side. With
 * 1–2 drivers firing even unanimously, the honest word stays
 * tailwind/headwind — "strong" needs a crowd.
 */
export const GOLD_STRONG_SHARE = 0.5;

/** The minimum FIRING count before a label may say "strong". */
export const GOLD_STRONG_MIN_FIRING = 3;

/**
 * The reality bar: |30-day move| ≥ 2% is a real rise/fall — the SAME
 * 2%-over-30-days bar the outlook classifier's range-bound state uses
 * (apps/web …/signals/verdict.ts RANGE_SPEED_PCT; restated here because
 * the package cannot import the app).
 */
export const GOLD_REALITY_SPEED_PCT = 2;

/* ------------------------------------------------------------------ *
 * The engine
 * ------------------------------------------------------------------ */

/** The readable-voter rule (the signals cards' own): stale, check-pending
 * and unavailable readings never fire. */
function readable(r: IndicatorReading | undefined): r is IndicatorReading {
  return r !== undefined && r.status !== 'stale' && r.status !== 'check-pending' && r.status !== 'unavailable';
}

/** The lane's directional word for its tailwind / headwind side. */
const LANE_TAILWIND_WORD: Record<GoldLane, GoldSubGaugeWord> = {
  'borrowing-costs': 'relief',
  dollar: 'stress',
  stress: 'elevated',
  inflation: 'hot',
  // The flows lane's tailwind word (GF-P2, the owner's recorded B): the
  // harness's own mapping (gf-p0-proposed.ts gfScoreOverVoters) — demand
  // ELEVATED reads the lane's for-side, the same vocabulary family as the
  // stress lane's safe-haven bid.
  flows: 'elevated',
};
const LANE_HEADWIND_WORD: Record<GoldLane, GoldSubGaugeWord> = {
  'borrowing-costs': 'tight',
  dollar: 'strong',
  stress: 'calm',
  inflation: 'cool',
  // The flows lane's headwind word: positioning CALM — the harness's own
  // mapping (gfScoreOverVoters), kept identical so the frozen-engine twin
  // cannot drift from the measured scenario.
  flows: 'calm',
};

/**
 * The gold tailwind score — pure over the readings (the ingest's writer
 * and the SPA's re-derivation call the SAME function).
 */
export function goldTailwindScore(readings: readonly IndicatorReading[]): GoldTailwindReading {
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  const voters: GoldVoter[] = [];
  for (const def of GOLD_LANE_VOTERS) {
    const r = byId.get(def.id);
    if (!readable(r)) continue;
    const leg = evalLeg(def.id, r);
    if (leg.lean === 0) continue; // steady AND typical — honestly not firing
    const impact: GoldVoterImpact = leg.lean * def.polarity === 1 ? 'tailwind' : 'headwind';
    // The evidence that produced the lean, in the evaluator's own order:
    // a qualifying 30-day direction first, else the decade-extreme level.
    const evidence: GoldVoterEvidence =
      leg.direction === 'rising' ? 'rising' : leg.direction === 'falling' ? 'falling' : leg.level === 'high' ? 'high' : 'low';
    voters.push({ id: def.id, lane: def.lane, impact, evidence });
  }

  const tailwindVoters = voters.filter((v) => v.impact === 'tailwind').length;
  const headwindVoters = voters.filter((v) => v.impact === 'headwind').length;
  const firingVoters = tailwindVoters + headwindVoters;
  const netScore = tailwindVoters - headwindVoters;

  // The label: share-based like the gauge steps, with the crowd minimum.
  let label: GoldTailwindLabel | null;
  if (firingVoters === 0) label = null;
  else if (netScore > 0 && firingVoters >= GOLD_STRONG_MIN_FIRING && netScore / firingVoters >= GOLD_STRONG_SHARE) {
    label = 'strong-tailwind';
  } else if (netScore > 0) label = 'tailwind';
  else if (netScore === 0) label = 'balanced';
  else if (netScore < 0 && firingVoters >= GOLD_STRONG_MIN_FIRING && -netScore / firingVoters >= GOLD_STRONG_SHARE) {
    label = 'strong-headwind';
  } else label = 'headwind';

  // The four lane readings + the lane counts.
  const subGauges: GoldSubGaugeReading[] = GOLD_LANES.map((lane) => {
    const laneVoters = voters.filter((v) => v.lane === lane);
    const t = laneVoters.filter((v) => v.impact === 'tailwind').length;
    const h = laneVoters.filter((v) => v.impact === 'headwind').length;
    let reading: GoldSubGaugeWord;
    if (t === 0 && h === 0) reading = 'unreadable';
    else if (t > 0 && h > 0) reading = 'mixed'; // the lane's evidence disagrees
    else if (t > 0) reading = LANE_TAILWIND_WORD[lane];
    else reading = LANE_HEADWIND_WORD[lane];
    return { lane, reading, tailwindVoters: t, headwindVoters: h };
  });
  const laneCounts = {
    tailwind: subGauges.filter((g) => g.reading === LANE_TAILWIND_WORD[g.lane]).length,
    headwind: subGauges.filter((g) => g.reading === LANE_HEADWIND_WORD[g.lane]).length,
    mixed: subGauges.filter((g) => g.reading === 'mixed').length,
  };

  return {
    netScore,
    label,
    firingVoters,
    tailwindVoters,
    headwindVoters,
    laneCounts,
    subGauges,
    voters,
  };
}

/* ------------------------------------------------------------------ *
 * Model vs reality
 * ------------------------------------------------------------------ */

export type GoldModelDirection = 'tailwind' | 'headwind' | 'neutral';
export type GoldRealityDirection = 'rising' | 'falling' | 'flat';

/** The comparison chip (the panel's one-word state). */
export type ModelVsRealityChip =
  | 'aligned-tailwind'
  | 'aligned-headwind'
  | 'diverging-up'
  | 'diverging-down'
  | 'neutral'
  | 'no-read';

export interface ModelVsRealityReading {
  chip: ModelVsRealityChip;
  /** The model's lean (from the tailwind label; null = cannot read). */
  modelDirection: GoldModelDirection | null;
  /** What gold actually did (null = no readable price evidence). */
  realityDirection: GoldRealityDirection | null;
  /** Which price field the reality read. */
  realityBasis: 'change30d' | 'ma200GapPct' | null;
  /** The signed percent the reality read (for the explainer sentence). */
  realityValue: number | null;
}

/**
 * Compare the model with the market: the tailwind label's direction vs
 * gold's own recent move. Reality prefers the 30-day change (the
 * outlook's own window); a missing change30d falls back to the 200-day
 * average gap; neither exists → 'no-read', never a guess.
 *
 * NOTE (the honest one-tick skew): the ingest stamps this at build time
 * from the stored readings; the serve path's live-prices overlay can
 * refresh gold-usd's change fields afterwards, so the chip can lag the
 * page's tile by one hourly tick. The ±2% bar makes a flip rare, and the
 * panel's driver list always derives from the page's current readings.
 */
export function modelVsReality(readings: readonly IndicatorReading[]): ModelVsRealityReading {
  const score = goldTailwindScore(readings);
  const modelDirection: GoldModelDirection | null =
    score.label === 'strong-tailwind' || score.label === 'tailwind'
      ? 'tailwind'
      : score.label === 'strong-headwind' || score.label === 'headwind'
        ? 'headwind'
        : score.label === 'balanced'
          ? 'neutral'
          : null;

  const gold = readings.find((r) => r.id === 'gold-usd');
  let realityDirection: GoldRealityDirection | null = null;
  let realityBasis: 'change30d' | 'ma200GapPct' | null = null;
  let realityValue: number | null = null;
  if (readable(gold)) {
    if (gold.change30d !== undefined && Number.isFinite(gold.change30d)) {
      realityBasis = 'change30d';
      realityValue = gold.change30d;
    } else if (gold.ma200GapPct !== undefined && Number.isFinite(gold.ma200GapPct)) {
      realityBasis = 'ma200GapPct';
      realityValue = gold.ma200GapPct;
    }
    if (realityValue !== null) {
      if (realityValue >= GOLD_REALITY_SPEED_PCT) realityDirection = 'rising';
      else if (realityValue <= -GOLD_REALITY_SPEED_PCT) realityDirection = 'falling';
      else realityDirection = 'flat';
    }
  }

  let chip: ModelVsRealityChip;
  if (modelDirection === null || realityDirection === null) chip = 'no-read';
  else if (modelDirection === 'neutral' || realityDirection === 'flat') chip = 'neutral';
  else if (modelDirection === 'tailwind') chip = realityDirection === 'rising' ? 'aligned-tailwind' : 'diverging-down';
  else chip = realityDirection === 'falling' ? 'aligned-headwind' : 'diverging-up';

  return { chip, modelDirection, realityDirection, realityBasis, realityValue };
}

/**
 * The explainer KEY for a comparison (pure so the panel never chooses
 * copy): the 'neutral' chip splits into its two honest causes — the model
 * has no lean, or the price has not moved.
 */
export function modelVsRealityExplainerKey(
  mvr: ModelVsRealityReading,
): 'aligned-tailwind' | 'aligned-headwind' | 'diverging-up' | 'diverging-down' | 'model-neutral' | 'reality-flat' | 'no-read' {
  if (mvr.chip === 'no-read') return 'no-read';
  if (mvr.chip === 'neutral') return mvr.modelDirection === 'neutral' ? 'model-neutral' : 'reality-flat';
  return mvr.chip;
}

/* ------------------------------------------------------------------ *
 * The compact wire shape (what rides the snapshot / the KV write)
 * ------------------------------------------------------------------ */

/**
 * The ingest's writer: the full reading's numbers + the comparison,
 * WITHOUT the voter list (the SPA re-derives the voters client-side —
 * the same pure module). ~0.5 KB of JSON, zero new fetches; validated
 * by InsightsSnapshotSchema's optional goldSummary field (core).
 */
export function goldSummaryOf(readings: readonly IndicatorReading[]): GoldSummary {
  const t = goldTailwindScore(readings);
  return {
    netScore: t.netScore,
    label: t.label,
    firingVoters: t.firingVoters,
    tailwindVoters: t.tailwindVoters,
    headwindVoters: t.headwindVoters,
    laneCounts: t.laneCounts,
    subGauges: t.subGauges.map((g) => ({
      lane: g.lane,
      reading: g.reading,
      tailwindVoters: g.tailwindVoters,
      headwindVoters: g.headwindVoters,
    })),
    modelVsReality: modelVsReality(readings),
  };
}

