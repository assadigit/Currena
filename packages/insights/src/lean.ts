/**
 * lean.ts — the gold/silver balance card's PURE presentation rules (owner
 * spec docs/insights/gold-card/03-LOGIC-AND-DATA-SPEC.md, "Balance
 * Rework"). Port of the pack's reference `lean-logic.js` (its tests live
 * in lean.test.ts and keep the same 13 checks plus the spec's additions).
 *
 * Reads the factor states the page already computes — it does NOT change
 * how those states are computed, adds no fields, no fetch, no clock: pure
 * counts and thresholds over an input array (AGENTS.md rule 2).
 *
 * Rules (spec §"Derived values"):
 *   read     = total − unread
 *   need     = ceil(0.75 × total)        — the coverage rule
 *   enough   = read ≥ need               — below it the beam stays level
 *   net      = pressures − supports      — > 0 means pressures heavier
 *   tilt     = sign(net) × min(7°, 3° + 1.5° × (|net| − 1)), only when
 *              enough and net ≠ 0; else 0
 *   verdict  = none (nothing read) → insufficient (not enough) → balanced
 *              (net 0) → slight/lean/strong + for/against
 *   confidence = high (full coverage) / medium (≥ 0.75) / low
 * `none` beats `insufficient` (spec: "none takes priority"); `insufficient`
 * beats the lean.
 */

/** A driver's state on the balance (spec file 03 "Fields"). */
export type FactorState = 'supports' | 'pressures' | 'neutral' | 'unread';

/** The one input shape computeLean needs — the card fills the rest. */
export interface LeanFactor {
  id: string;
  state: FactorState;
  /** Current value; the flip line only considers factors with one. */
  value?: number;
  /**
   * The flip threshold the EXISTING config defines (spec 03: "only if the
   * existing config defines the threshold" — do not invent): the point at
   * which this driver's state would change.
   */
  flip?: { dir: 'below' | 'above'; at: number };
}

/** The computed lean of one asset's factor list. */
export interface LeanResult {
  total: number;
  /** Counts per state. */
  S: number;
  P: number;
  N: number;
  U: number;
  /** Readable drivers (total − U). */
  read: number;
  /** Drivers needed before the beam may tilt. */
  need: number;
  /** Coverage rule satisfied (read ≥ need). */
  enough: boolean;
  /** Pressures − supports (> 0 = pressures heavier). */
  net: number;
  /** Beam tilt in degrees, positive = pressuring end lower. */
  tilt: number;
  /** read / total (0 when total is 0). */
  coverage: number;
  confidence: 'high' | 'medium' | 'low';
  verdict:
    | 'slight_for'
    | 'lean_for'
    | 'strong_for'
    | 'balanced'
    | 'slight_against'
    | 'lean_against'
    | 'strong_against'
    | 'insufficient'
    | 'none';
  /** The chosen flip-line candidate, or null when the line hides. */
  flip: {
    factorId: string;
    dir: 'below' | 'above';
    at: number;
    /** "flip_balance" when |net| = 1 (one flip levels the beam), else "flip_ease". */
    key: 'flip_balance' | 'flip_ease';
  } | null;
}

/** Minimum share of drivers that must be readable before the beam tilts. */
export const MIN_COVERAGE = 0.75;
/** Tilt for a net lean of 1 (degrees). */
export const MIN_TILT_DEG = 3;
/** Extra degrees per extra net point. */
export const STEP_TILT_DEG = 1.5;
/** Hard cap (degrees). */
export const MAX_TILT_DEG = 7;

/**
 * The pure rules (spec file 03). Reference implementation:
 * docs/insights/gold-card/reference/lean-logic.js.
 */
export function computeLean(factors: readonly LeanFactor[]): LeanResult {
  const total = factors.length;
  const count = (s: FactorState): number => factors.filter((f) => f.state === s).length;
  const S = count('supports');
  const P = count('pressures');
  const N = count('neutral');
  const U = count('unread');
  const read = total - U;
  const need = Math.ceil(MIN_COVERAGE * total);
  const enough = read >= need;
  const net = P - S;
  const mag =
    enough && net !== 0
      ? Math.min(MAX_TILT_DEG, MIN_TILT_DEG + STEP_TILT_DEG * (Math.abs(net) - 1))
      : 0;
  const tilt = Math.sign(net) * mag;
  const coverage = total === 0 ? 0 : read / total;
  const confidence: LeanResult['confidence'] =
    coverage === 1 ? 'high' : coverage >= MIN_COVERAGE ? 'medium' : 'low';

  let verdict: LeanResult['verdict'];
  if (read === 0) verdict = 'none';
  else if (!enough) verdict = 'insufficient';
  else if (net === 0) verdict = 'balanced';
  else {
    const side = net > 0 ? 'against' : 'for';
    const strength = Math.abs(net) === 1 ? 'slight' : Math.abs(net) === 2 ? 'lean' : 'strong';
    verdict = `${strength}_${side}` as LeanResult['verdict'];
  }

  // The flip line (spec §"Flip line"): only with enough coverage and a
  // real lean; only heavier-side factors that carry BOTH a config-defined
  // threshold and a numeric value; pick the one whose value sits closest
  // to its threshold (relative distance — thresholds near zero must not
  // win just for being small).
  let flip: LeanResult['flip'] = null;
  if (enough && net !== 0) {
    const heavier = factors.filter(
      (f) =>
        f.state === (net > 0 ? 'pressures' : 'supports') &&
        f.flip !== undefined &&
        typeof f.value === 'number',
    );
    heavier.sort(
      (a, b) =>
        Math.abs(a.value! - a.flip!.at) / Math.max(Math.abs(a.flip!.at), 1e-9) -
        Math.abs(b.value! - b.flip!.at) / Math.max(Math.abs(b.flip!.at), 1e-9),
    );
    const best = heavier[0];
    if (best !== undefined) {
      flip = {
        factorId: best.id,
        dir: best.flip!.dir,
        at: best.flip!.at,
        key: Math.abs(net) === 1 ? 'flip_balance' : 'flip_ease',
      };
    }
  }

  return { total, S, P, N, U, read, need, enough, net, tilt, coverage, confidence, verdict, flip };
}
