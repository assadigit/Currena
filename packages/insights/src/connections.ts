/**
 * "Together" connection cards (2026-10-08 UI spec Block T1, the v2 wave,
 * shipped as I17 after the owner's full approval).
 *
 * A connection = "X usually goes with Y": 2–3 indicators whose legs tend to
 * lean the same way (or, for the see-saw, opposite ways) when the described
 * relationship is working. The state is one uniform rule over the legs'
 * leans, so every card explains itself the same way:
 *
 *   active    — every leg leans (all non-zero leans point ONE way; for the
 *               inverse see-saw that means visibly opposite legs)
 *   partly    — some legs lean, none opposes, the rest sit neutral
 *   inactive  — no leg leans (all mid-range and steady — too quiet to read)
 *   disagree  — non-zero leans point BOTH ways (the pattern is mixed/broken)
 *   unknown   — a required leg is stale or absent (honest ST2 discipline:
 *               never compute over data the page itself would grey out)
 *
 * Pure, platform-free (AGENTS.md rule 2): everything derives from the
 * snapshot readings the page already holds — no ingest change, no snapshot
 * format change, so the read-side contract is untouched.
 *
 * Lean derivation per leg (uniform):
 *   - direction from change30d with a per-leg threshold in the definition's
 *     own units (points vs pct — thresholds must be per-leg);
 *   - level from percentile10y with the page's existing position bands
 *     (< 0.2 low · > 0.8 high, the F3 vocabulary);
 *   - lean = direction lean when clearly rising/falling, else the LEVEL
 *     lean (high → +1, low → −1): a steady series parked at a decade high
 *     still leans — flatness at an extreme is not neutrality.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';

/** The six v1 connections (spec Block T1 note) — order = card order. */
export type ConnectionId =
  | 'real-yields-gold'
  | 'dollar-gold-oil'
  | 'oil-expectations-costs'
  | 'copper-china-growth'
  | 'iron-terms-aud'
  | 'rba-loan-debt';

export type ConnectionState = 'active' | 'partly' | 'inactive' | 'disagree' | 'unknown';

/** The plain direction/level vocabulary the card phrases reuse (F3 words). */
export type LegDirection = 'rising' | 'falling' | 'steady';
export type LegLevel = 'high' | 'typical' | 'low';

export interface LegEval {
  id: IndicatorId;
  direction: LegDirection | null;
  level: LegLevel | null;
  /** −1 · 0 · +1 — the co-movement lean (see module doc). */
  lean: 1 | 0 | -1;
}

export interface ConnectionLeg extends LegEval {}

export interface ConnectionDef {
  id: ConnectionId;
  legs: readonly IndicatorId[];
  /**
   * How the legs usually lean RELATIVE TO EACH OTHER when the relationship
   * is working:
   *   'same'    — the legs co-move (oil → expectations → costs chains);
   *   'inverse' — the FIRST leg usually leans against the rest (the real-
   *               yield/gold see-saw; the dollar vs dollar-priced commodities).
   * The polarity only adjusts the STATE computation — the cards always
   * display each leg's own raw lean.
   */
  polarity: 'same' | 'inverse';
}

export interface ConnectionReading {
  connection: ConnectionId;
  state: ConnectionState;
  legs: readonly ConnectionLeg[];
}

/** The legs of every connection are known indicator ids (compile-checked). */
export const CONNECTIONS: readonly ConnectionDef[] = [
  // (1) real yields and gold — the classic see-saw (inverse co-movement).
  { id: 'real-yields-gold', polarity: 'inverse', legs: ['real-yield-10y', 'gold-usd'] },
  // (2) the dollar and gold and oil — a strong dollar tends to weigh on
  // dollar-priced commodities (inverse co-movement, three legs).
  { id: 'dollar-gold-oil', polarity: 'inverse', legs: ['dollar-basket', 'gold-usd', 'brent'] },
  // (3) oil and inflation expectations and borrowing costs — the chain
  // (same-direction co-movement, three legs).
  { id: 'oil-expectations-costs', polarity: 'same', legs: ['brent', 'breakeven-5y5y', 'us10y'] },
  // (4) copper-to-gold and China PMI and growth — the growth mix.
  { id: 'copper-china-growth', polarity: 'same', legs: ['copper-gold', 'china-pmi', 'm2-us'] },
  // (5) iron ore and terms of trade and the Australian dollar — the export chain.
  { id: 'iron-terms-aud', polarity: 'same', legs: ['iron-ore', 'terms-of-trade', 'audusd'] },
  // (6) the RBA cash rate and the home-loan rate and household debt — the
  // household rate chain.
  {
    id: 'rba-loan-debt',
    polarity: 'same',
    legs: ['rba-cash-rate', 'au-home-loan', 'au-household-debt-arrears'],
  },
] as const;

/**
 * Per-leg change30d thresholds in each definition's changeKind units. Only
 * legs that can carry a 30-day change need one (quarterly legs never do —
 * their lean comes from the level). Magnitudes are deliberately small
 * fractions of each series' typical 30-day swing so noise stays 'steady'.
 */
const LEG_MOVE_THRESHOLDS: Partial<Record<IndicatorId, number>> = {
  'real-yield-10y': 0.1, // points
  'gold-usd': 3, // pct
  'silver-usd': 3, // pct
  brent: 5, // pct
  'dollar-basket': 1.0, // points (≈1% of a ~100 index)
  'breakeven-5y5y': 0.1, // points
  us10y: 0.15, // points
  'copper-gold': 0.08, // points on a ~2.5–4.5 ratio
  'china-pmi': 0.25, // points (PMI noise band is ±0.3)
  'm2-us': 0.5, // pct (~6%/yr pace)
  'iron-ore': 5, // pct
  audusd: 2, // pct
  'rba-cash-rate': 0.1, // points (a 25bp step is 0.25)
  'au-home-loan': 0.05, // points (loan rates move in small steps)
};

/** The F3 position bands (mirrors the SPA's positionBand — one vocabulary). */
function levelOf(percentile10y: number): LegLevel {
  if (percentile10y < 0.2) return 'low';
  if (percentile10y > 0.8) return 'high';
  return 'typical';
}

/**
 * Evaluate one leg from its reading. Missing/unreadable fields degrade to
 * nulls and lean 0 — never guessed. Staleness is handled at the CONNECTION
 * level (a stale leg forces 'unknown'), not here: the leg still renders its
 * last-known value and words.
 */
export function evalLeg(id: IndicatorId, reading: IndicatorReading): LegEval {
  const threshold = LEG_MOVE_THRESHOLDS[id];
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
  const level = reading.percentile10y !== undefined ? levelOf(reading.percentile10y) : null;
  let lean: 1 | 0 | -1 = 0;
  if (direction === 'rising') lean = 1;
  else if (direction === 'falling') lean = -1;
  else if (level === 'high') lean = 1;
  else if (level === 'low') lean = -1;
  return { id, direction, level, lean };
}

/** A leg whose reading could not vote at all (stale / absent). */
const unreadable = (id: IndicatorId): LegEval => ({ id, direction: null, level: null, lean: 0 });

const votableLeg = (r: IndicatorReading | undefined): boolean =>
  r !== undefined && r.status !== 'stale' && r.status !== 'unavailable';

/**
 * One connection's state (see module doc for the uniform rule, applied over
 * polarity-adjusted leans). Legs are still evaluated raw for display when a
 * sibling is stale — the state alone says "unknown", the chips keep showing
 * real values.
 */
export function evaluateConnection(
  def: ConnectionDef,
  readings: readonly IndicatorReading[],
): ConnectionReading {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const legs: LegEval[] = def.legs.map((id) => {
    const r = byId.get(id);
    return r !== undefined && votableLeg(r) ? evalLeg(id, r) : unreadable(id);
  });

  if (def.legs.some((id) => !votableLeg(byId.get(id)))) {
    return { connection: def.id, state: 'unknown', legs };
  }

  // The relation-relative lean: for 'inverse' connections the legs after the
  // first lean AGAINST it when the relationship is working, so their lean is
  // compared with its sign flipped. The legs' own displayed words never flip.
  const rel = (i: number): 1 | 0 | -1 => {
    const lean = legs[i]!.lean;
    if (def.polarity === 'inverse' && i > 0) return (lean === 0 ? 0 : -lean) as 1 | 0 | -1;
    return lean;
  };
  let positive = 0;
  let negative = 0;
  for (let i = 0; i < legs.length; i++) {
    const lean = rel(i);
    if (lean > 0) positive += 1;
    else if (lean < 0) negative += 1;
  }
  const nonZero = positive + negative;
  let state: ConnectionState;
  if (nonZero === 0) state = 'inactive';
  else if (positive > 0 && negative > 0) state = 'disagree';
  else if (nonZero === legs.length) state = 'active';
  else state = 'partly';
  return { connection: def.id, state, legs };
}

/** All six connections in spec order (pure). */
export function evaluateConnections(readings: readonly IndicatorReading[]): ConnectionReading[] {
  return CONNECTIONS.map((def) => evaluateConnection(def, readings));
}
