/**
 * "Together" connection cards (2026-10-08 UI spec Block T1) — REWRITTEN by
 * fix spec B-04 (2026-10-14): every relationship is an EXPLICIT RULE in this
 * registry, evaluated with ONE uniform method per leg:
 *
 *   a leg MOVES when its window change reaches the leg's minimum move, in
 *   the indicator's own units (points vs percent), over ANY of its windows;
 *   the leg's direction is the sign of the largest qualifying move.
 *
 * Card states (uniform):
 *   active    — every required leg moved, and the moves satisfy the
 *               structure ('same': all one direction; 'inverse': the first
 *               leg against the rest)
 *   partly    — at least one required leg moved in a structure-satisfying
 *               way, and no leg violates the structure
 *   disagree  — a required move violates the structure (opposite legs)
 *   inactive  — no required leg moved at all
 *   pending    — the RBA pass-through card: the cash-rate decision is newer
 *               than the loan data (the pass-through window has not
 *               produced data yet)
 *   unknown   — a required leg is stale, absent or unmeasurable (honest
 *               discipline: never compute over data the page would grey out)
 *
 * Fix spec B-04's specific rewrites:
 *  - oil→expectations→costs: the oil leg checks several windows (7/30/90
 *    days) so a +65%-a-year move hidden behind a calm month still counts;
 *    a card may be 'active' ONLY when every required leg meets its rule.
 *  - dollar→gold/oil: uniform leg method (direction over the same window
 *    with a minimum move) — the dollar rising while gold falls is the
 *    structure WORKING, not a disagreement.
 *  - RBA→loans→debt: compares the cash-rate decision with the loan rate
 *    1–3 months later and shows 'pending' until the loan data exists; the
 *    debt leg is CONTEXT, labelled correctly as a debt-to-income level
 *    (not a debt-servicing measure).
 *  - copper/gold→China: the weak US-money-supply leg is REMOVED (the link
 *    is documented as weak; two legs stay).
 *  - iron ore→terms of trade→AUD: the US dollar rides along as a CONTEXT
 *    leg (an AUD fall is often mostly dollar strength), displayed but never
 *    gating the state.
 *
 * Pure, platform-free (AGENTS.md rule 2): everything derives from the
 * snapshot readings the page already holds — no ingest change beyond the
 * loan reading's `sinceDecision` field (the ingest computes the loan
 * change since the latest RBA decision; see snapshot.ts).
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

export type ConnectionState = 'active' | 'partly' | 'inactive' | 'disagree' | 'pending' | 'unknown';

/** The plain direction vocabulary the card phrases reuse (F3 words). */
export type LegDirection = 'rising' | 'falling' | 'steady';

/**
 * One leg's explicit rule: direction measured as a window change with a
 * minimum move, in the indicator's changeKind units.
 */
export interface ConnectionLegRule {
  id: IndicatorId;
  /**
   * 'required' — the leg gates the state. 'context' — the leg displays
   * (with its live value and words) but never gates.
   */
  role: 'required' | 'context';
  /** The windows checked (days): 7 uses change7d, 30 change30d, 90 change90d. */
  windows: readonly { days: 7 | 30 | 90; minMove: number }[];
  /**
   * A display-only caveat for the leg's label (B-04): the debt leg is a
   * debt-to-income LEVEL, not a servicing ratio.
   */
  caveat?: 'debt-level';
}

export interface ConnectionDef {
  id: ConnectionId;
  /**
   * How the legs usually move RELATIVE TO EACH OTHER when the relationship
   * is working:
   *   'same'    — the legs co-move (oil → expectations → costs chains);
   *   'inverse' — the FIRST leg usually moves against the rest (the
   *               real-yield/gold see-saw; the dollar vs dollar-priced
   *               commodities).
   */
  polarity: 'same' | 'inverse';
  legs: readonly ConnectionLegRule[];
  /**
   * The RBA pass-through card (fix B-04): compares the cash-rate decision
   * with the loan-rate change since that decision, and shows 'pending'
   * until the loan data postdates the decision by the pass-through window.
   */
  passThrough?: boolean;
}

/** One evaluated leg for display. */
export interface LegEval {
  id: IndicatorId;
  role: 'required' | 'context';
  direction: LegDirection | null;
  /** The move that satisfied the rule (largest qualifying window move). */
  move: number | null;
  /** The window (days) the satisfying move came from. */
  moveWindow: 7 | 30 | 90 | null;
  /** Did this leg MEET its rule (move ≥ minMove over any window)? */
  moved: boolean;
  caveat?: 'debt-level';
}

export interface ConnectionReading {
  connection: ConnectionId;
  state: ConnectionState;
  legs: readonly LegEval[];
  /**
   * The pass-through card's numbers (B-04): the decision (date + points)
   * and the loan change since it, when both exist.
   */
  passThrough?: {
    decisionDate: string;
    decisionPoints: number;
    loanPoints: number;
  };
}

/** The reading statuses that cannot vote (held / absent / too little data). */
const UNREADABLE_STATUS = new Set(['stale', 'check-pending', 'unavailable']);

/**
 * The v2 leg rule registry — every threshold in one place, per leg, in the
 * indicator's own units. Magnitudes stay small fractions of each series'
 * typical swing so noise reads 'steady'.
 */
export const CONNECTIONS: readonly ConnectionDef[] = [
  // (1) real yields and gold — the classic see-saw (inverse co-movement).
  {
    id: 'real-yields-gold',
    polarity: 'inverse',
    legs: [
      { id: 'real-yield-10y', role: 'required', windows: [{ days: 30, minMove: 0.1 }] },
      { id: 'gold-usd', role: 'required', windows: [{ days: 30, minMove: 3 }] },
    ],
  },
  // (2) the dollar and gold and oil — a strong dollar tends to weigh on
  // dollar-priced commodities (inverse co-movement, three legs). Uniform
  // method (B-04): direction over the same window with a minimum move —
  // dollar up + gold down is the pattern WORKING.
  {
    id: 'dollar-gold-oil',
    polarity: 'inverse',
    legs: [
      { id: 'dollar-basket', role: 'required', windows: [{ days: 30, minMove: 1 }] },
      { id: 'gold-usd', role: 'required', windows: [{ days: 30, minMove: 3 }] },
      // B-04: check several windows for oil — a +65%-a-year move can hide
      // behind a calm month (30-day noise band) — the 90-day leg mirrors
      // the Brent card's own scored rule (25% over 13 weeks).
      { id: 'brent', role: 'required', windows: [{ days: 30, minMove: 5 }, { days: 90, minMove: 25 }] },
    ],
  },
  // (3) oil and inflation expectations and borrowing costs — the chain
  // (same-direction co-movement). A card may be Active only if every
  // required leg meets its rule (B-04).
  {
    id: 'oil-expectations-costs',
    polarity: 'same',
    legs: [
      { id: 'brent', role: 'required', windows: [{ days: 30, minMove: 5 }, { days: 90, minMove: 25 }] },
      { id: 'breakeven-5y5y', role: 'required', windows: [{ days: 30, minMove: 0.1 }] },
      { id: 'us10y', role: 'required', windows: [{ days: 30, minMove: 0.15 }] },
    ],
  },
  // (4) copper-to-gold and China factory activity — the growth mix. B-04:
  // the US money-supply leg is REMOVED (the link is weak); the card keeps
  // its two strong legs.
  {
    id: 'copper-china-growth',
    polarity: 'same',
    legs: [
      { id: 'copper-gold', role: 'required', windows: [{ days: 30, minMove: 0.08 }] },
      { id: 'china-pmi', role: 'required', windows: [{ days: 30, minMove: 0.25 }] },
    ],
  },
  // (5) iron ore and terms of trade and the Australian dollar — the export
  // chain, with the US dollar as a CONTEXT leg (B-04: an AUD fall is often
  // mostly dollar strength — displayed, never gating).
  {
    id: 'iron-terms-aud',
    polarity: 'same',
    legs: [
      { id: 'iron-ore', role: 'required', windows: [{ days: 30, minMove: 5 }] },
      { id: 'terms-of-trade', role: 'required', windows: [{ days: 30, minMove: 1 }] },
      { id: 'audusd', role: 'required', windows: [{ days: 30, minMove: 2 }] },
      { id: 'dollar-basket', role: 'context', windows: [{ days: 30, minMove: 1 }] },
    ],
  },
  // (6) the RBA cash rate and the home-loan rate and household debt — the
  // pass-through card (B-04): the decision is compared with the loan rate
  // 1–3 months LATER; 'pending' until that data exists. The debt leg is
  // context, labelled as a debt-to-income level (not a servicing cost).
  {
    id: 'rba-loan-debt',
    polarity: 'same',
    passThrough: true,
    legs: [
      { id: 'rba-cash-rate', role: 'required', windows: [{ days: 30, minMove: 0.1 }] },
      { id: 'au-home-loan', role: 'required', windows: [{ days: 30, minMove: 0.05 }] },
      { id: 'au-household-debt-arrears', role: 'context', windows: [{ days: 30, minMove: 0.5 }], caveat: 'debt-level' },
    ],
  },
] as const;

/** The change field a window reads (monthly/quarterly legs ride change30d
 *  = the since-previous-release change — the engine's cadence-aware field). */
function changeForWindow(reading: IndicatorReading, days: 7 | 30 | 90): number | undefined {
  const value = days === 7 ? reading.change7d : days === 30 ? reading.change30d : reading.change90d;
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

/**
 * Evaluate one leg from its reading under the uniform method: the leg moves
 * when ANY window's change reaches that window's minimum. When several
 * windows qualify with conflicting signs (a recent fall inside a big
 * quarterly rise), the SHORTEST qualifying window carries the direction —
 * the leg's words speak about the most recent pressure, while the longer
 * windows still prove the leg has genuinely moved (B-04's "+65% a year
 * hidden behind a calm month" case).
 */
export function evalConnectionLeg(rule: ConnectionLegRule, reading: IndicatorReading): LegEval {
  const moves = rule.windows
    .map((w) => ({ days: w.days, minMove: w.minMove, change: changeForWindow(reading, w.days) }))
    .filter((m): m is { days: 7 | 30 | 90; minMove: number; change: number } => m.change !== undefined);
  const qualifying = moves
    .filter((m) => Math.abs(m.change) >= m.minMove)
    .sort((a, b) => a.days - b.days); // shortest first — recency wins
  const best = qualifying[0];
  if (best !== undefined) {
    return {
      id: rule.id,
      role: rule.role,
      direction: best.change > 0 ? 'rising' : 'falling',
      move: best.change,
      moveWindow: best.days,
      moved: true,
      ...(rule.caveat !== undefined ? { caveat: rule.caveat } : {}),
    };
  }
  // Steady: display the 30-day change's sign when it exists, else the
  // longest window with data, else nothing measurable.
  const display = moves.find((m) => m.days === 30) ?? moves[moves.length - 1];
  return {
    id: rule.id,
    role: rule.role,
    direction: display === undefined ? null : display.change > 0 ? 'rising' : display.change < 0 ? 'falling' : 'steady',
    move: display?.change ?? null,
    moveWindow: display?.days ?? null,
    moved: false,
    ...(rule.caveat !== undefined ? { caveat: rule.caveat } : {}),
  };
}

/** The unreadable leg (stale / absent / check-pending). */
function unreadableLeg(rule: ConnectionLegRule): LegEval {
  return {
    id: rule.id,
    role: rule.role,
    direction: null,
    move: null,
    moveWindow: null,
    moved: false,
    ...(rule.caveat !== undefined ? { caveat: rule.caveat } : {}),
  };
}

/** How many days a cash-rate decision stays inside the pass-through card's window (B-04: 1–3 months). */
export const PASS_THROUGH_WINDOW_DAYS = 90;

/** The loan data must postdate the decision by at least this long before the comparison is fair (1 month). */
const PASS_THROUGH_MIN_DAYS = 21;

/**
 * The RBA pass-through card (fix B-04): compare the cash-rate decision with
 * the loan-rate change 1–3 months later. State 'pending' until the loan
 * data postdates the decision by ~a month; then the loan leg's rule is the
 * since-decision change (reading.sinceDecision, computed by the ingest from
 * the loan series against the decision date).
 */
function evaluatePassThrough(
  def: ConnectionDef,
  byId: Map<string, IndicatorReading>,
): ConnectionReading {
  const legs = def.legs.map((rule) => {
    const r = byId.get(rule.id);
    return r !== undefined && !UNREADABLE_STATUS.has(r.status) ? evalConnectionLeg(rule, r) : unreadableLeg(rule);
  });
  const cash = byId.get('rba-cash-rate');
  const loan = byId.get('au-home-loan');
  if (
    cash === undefined ||
    loan === undefined ||
    UNREADABLE_STATUS.has(cash.status) ||
    UNREADABLE_STATUS.has(loan.status) ||
    cash.lastChange === undefined ||
    loan.asOf === null
  ) {
    return { connection: def.id, state: 'unknown', legs };
  }
  const decision = cash.lastChange;
  const sinceDecision = loan.sinceDecision;
  // Pending until the loan data covers the decision by ~a month (the
  // 1–3-month pass-through window's first leg).
  if (sinceDecision === undefined || loan.asOf < addDaysIso(decision.date, PASS_THROUGH_MIN_DAYS)) {
    return { connection: def.id, state: 'pending', legs };
  }
  const loanPoints = sinceDecision.points;
  const passThrough = { decisionDate: decision.date, decisionPoints: decision.points, loanPoints };
  // The loan leg meets its rule when it moved WITH the decision by at least
  // half its size (outstanding loan rates typically pass a 25bp hike
  // through as +15–25bp over 1–3 months), or its own 30-day move qualifies.
  const loanLeg = legs.find((l) => l.id === 'au-home-loan')!;
  const sameSign = Math.sign(loanPoints) === Math.sign(decision.points) && loanPoints !== 0;
  const enough = Math.abs(loanPoints) >= Math.max(0.05, Math.abs(decision.points) / 2);
  const loanMet = (sameSign && enough) || loanLeg.moved;
  if (!loanMet) {
    // The decision exists, the window has passed, the loan rate has not
    // moved with it — the pattern is not working.
    return { connection: def.id, state: 'inactive', legs, passThrough };
  }
  // The debt leg is context; the cash leg moved by definition (the
  // decision). The card reads as active when the pass-through is underway.
  return { connection: def.id, state: 'active', legs, passThrough };
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * One connection's state (see module doc): the uniform rule over the legs'
 * qualifying window moves, structure-aware. Legs still evaluate for display
 * when a sibling is stale — the state alone says "unknown", the chips keep
 * showing real values.
 */
export function evaluateConnection(
  def: ConnectionDef,
  readings: readonly IndicatorReading[],
): ConnectionReading {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  if (def.passThrough === true) return evaluatePassThrough(def, byId);

  const legs = def.legs.map((rule) => {
    const r = byId.get(rule.id);
    return r !== undefined && !UNREADABLE_STATUS.has(r.status) ? evalConnectionLeg(rule, r) : unreadableLeg(rule);
  });

  const requiredRules = def.legs.filter((l) => l.role === 'required');
  if (requiredRules.some((rule) => UNREADABLE_STATUS.has(byId.get(rule.id)?.status ?? 'unavailable'))) {
    return { connection: def.id, state: 'unknown', legs };
  }
  // A required leg with NO measurable change at all also blocks the read.
  if (legs.some((l) => l.role === 'required' && l.move === null)) {
    return { connection: def.id, state: 'unknown', legs };
  }

  // Relation-relative sign: for 'inverse' connections, legs after the first
  // count as satisfying the structure when they move AGAINST it.
  const relSign = (i: number): number | null => {
    const leg = legs.find((l) => l.id === requiredRules[i]!.id)!;
    if (!leg.moved) return null;
    const sign = leg.direction === 'rising' ? 1 : -1;
    return def.polarity === 'inverse' && i > 0 ? -sign : sign;
  };

  const signs: number[] = [];
  for (let i = 0; i < requiredRules.length; i++) {
    const s = relSign(i);
    if (s !== null) signs.push(s);
  }
  const movedCount = signs.length;
  if (movedCount === 0) return { connection: def.id, state: 'inactive', legs };
  const positive = signs.filter((s) => s > 0).length;
  const negative = signs.filter((s) => s < 0).length;
  if (positive > 0 && negative > 0) return { connection: def.id, state: 'disagree', legs };
  if (movedCount === requiredRules.length) return { connection: def.id, state: 'active', legs };
  return { connection: def.id, state: 'partly', legs };
}

/** All six connections in spec order (pure). */
export function evaluateConnections(readings: readonly IndicatorReading[]): ConnectionReading[] {
  return CONNECTIONS.map((def) => evaluateConnection(def, readings));
}

/* ------------------------------------------------------------------ *
 * Signals compatibility (S1–S2) — the metal cards' lean vocabulary
 * ------------------------------------------------------------------ */

export type LegLevel = 'high' | 'typical' | 'low';

/**
 * The SIGNALS cards' leg lean (kept from v1, used by signals.ts): direction
 * from the 30-day change with a per-leg threshold, level from the 10-year
 * position — a steady series parked at a decade extreme still leans.
 */
export interface SignalLegEval {
  id: IndicatorId;
  direction: LegDirection | null;
  level: LegLevel | null;
  /** −1 · 0 · +1 — the lean. */
  lean: 1 | 0 | -1;
}

/** Per-leg 30-day thresholds in each definition's changeKind units (signals vocabulary). */
const SIGNAL_LEG_MOVE: Partial<Record<IndicatorId, number>> = {
  'real-yield-10y': 0.1, // points
  'gold-usd': 3, // pct
  'silver-usd': 3, // pct
  brent: 5, // pct
  'dollar-basket': 1.0, // points
  'breakeven-5y5y': 0.1, // points
  us10y: 0.15, // points
  'copper-gold': 0.08, // points
  'china-pmi': 0.25, // points
};

/** The F3 position bands (one vocabulary with the page's position words). */
function levelOf(percentile10y: number): LegLevel {
  if (percentile10y < 0.2) return 'low';
  if (percentile10y > 0.8) return 'high';
  return 'typical';
}

/** The signals cards' leg evaluation (v1 semantics, kept for S1–S2). */
export function evalLeg(id: IndicatorId, reading: IndicatorReading): SignalLegEval {
  const threshold = SIGNAL_LEG_MOVE[id];
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
