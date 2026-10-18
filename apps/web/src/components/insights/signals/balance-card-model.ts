/**
 * signals/balance-card-model — the PURE model behind the gold/silver
 * balance card (owner spec docs/insights/gold-card/, "Balance Rework").
 *
 * Everything here is plain data shaping over what the page already holds:
 *   - buildBalanceFactors maps an evaluateSignal() result onto the spec's
 *     Factor shape (state mapping 1:1: supportive→supports, against→
 *     pressures, unknown→unread; footing NEVER a factor — price is
 *     context, not a weight, spec 00 §4);
 *   - beamGeometry is the spec-02 §"Beam geometry" math (viewBox 680,
 *     hairline beam, pivot, tokens, dy travel; RTL flips the ends);
 *   - footingPhrase derives the price-context wording from the metal's own
 *     10-year position + 30-day change;
 *   - FLIP_THRESHOLDS carries ONLY the thresholds the existing indicator
 *     config already defines (spec 03: "only if the existing config
 *     defines the threshold" — nothing invented; see ASSUMPTIONS.md §4).
 *
 * No DOM, no fetch, no clock: `now` is always an explicit parameter.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionKey, SignalConditionReading, SignalReading } from '@currena/insights';
import type { FactorState, LeanFactor } from '@currena/insights';

/** The driver keys (footing is never a factor — price is context). */
export type BalanceDriverKey = Exclude<SignalConditionKey, 'footing'>;

/** The card's own factor: the lean input plus everything a row needs. */
export interface BalanceFactor extends LeanFactor {
  /** The signal condition key ('real-yield' | …). */
  key: BalanceDriverKey;
  /** All input readings whose values the row shows. */
  inputs: readonly IndicatorReading[];
  /** The primary input (token value, flip value, as-of, source). */
  primary: IndicatorReading | null;
  /** 0..1 position of the primary input inside its usual range. */
  rangePos: number | null;
  /** Why an unread factor could not be read (spec 03 "unreadReason"). */
  unreadReason: 'source_unavailable' | 'stale' | 'not_available_yet' | null;
  /** The reading's age in days (stale rows say "last data {n} days ago"). */
  staleDays: number | null;
}

/** The condition state → balance state mapping (1:1, evaluation untouched). */
export function balanceStateOf(state: SignalConditionReading['state']): FactorState {
  switch (state) {
    case 'supportive':
      return 'supports';
    case 'against':
      return 'pressures';
    case 'neutral':
      return 'neutral';
    default:
      return 'unread';
  }
}

/**
 * Why a condition came back unread, from its PRIMARY input's reading
 * status. Missing reading → not_available_yet; unavailable → source
 * unavailable; stale → stale (with its age); check-pending (the value is
 * held on its last good copy by validation) → source unavailable.
 */
function unreadReasonOf(
  primary: IndicatorReading | null,
  now: number,
): { reason: BalanceFactor['unreadReason']; days: number | null } {
  if (primary === null) return { reason: 'not_available_yet', days: null };
  if (primary.status === 'stale') {
    const days = primary.asOf !== null ? Math.max(0, Math.floor((now - Date.parse(primary.asOf)) / 86_400_000)) : null;
    return { reason: 'stale', days };
  }
  return { reason: 'source_unavailable', days: null };
}

/**
 * The flip thresholds the EXISTING config defines (ASSUMPTIONS.md §4):
 *   - expectations: the breakeven's own scored rule — "above 2.4%
 *     sustained 4 weeks" (packages/insights definitions, breakeven-5y5y).
 *     The driver reads supportive exactly when that warning state holds,
 *     so "fell below 2.4" is the config-defined flip point.
 *   - stress: both stress indices' scored rule — "above 0" (STLFSI4,
 *     NFCI). The driver reads supportive when either index is above zero.
 * Real yields (percentile rule), the dollar basket (any-of) and
 * industrial demand carry no fixed value threshold — no flip line.
 * Both flips apply in the SUPPORTS state (the boundary the evaluator
 * itself uses), keyed by the primary input whose value is measured.
 */
export const FLIP_THRESHOLDS: Readonly<
  Partial<Record<SignalConditionKey, { dir: 'below' | 'above'; at: number; input: IndicatorId }>>
> = {
  expectations: { dir: 'below', at: 2.4, input: 'breakeven-5y5y' },
  stress: { dir: 'below', at: 0, input: 'stress-stlfsi' },
};

/** Build the card's factor list from one metal's signal evaluation. */
export function buildBalanceFactors(
  reading: SignalReading,
  byId: Map<string, IndicatorReading>,
  now: number,
): BalanceFactor[] {
  return reading.conditions
    .filter((c): c is SignalConditionReading & { key: BalanceDriverKey } => c.key !== 'footing')
    .map((c) => {
      const inputs = c.inputs.map((id) => byId.get(id as string)).filter((r): r is IndicatorReading => r !== undefined);
      const primary = inputs[0] ?? null;
      const state = balanceStateOf(c.state);
      const flipCfg = FLIP_THRESHOLDS[c.key];
      // The flip rides the state it belongs to (the evaluator's own
      // boundary) and needs the config's input to be the measured one.
      const flip =
        flipCfg !== undefined && state === 'supports' && flipCfg.input === (primary?.id as IndicatorId | undefined)
          ? { dir: flipCfg.dir, at: flipCfg.at }
          : undefined;
      const unread = unreadReasonOf(primary, now);
      return {
        key: c.key,
        id: c.key,
        state,
        value: primary !== null && primary.value !== null ? primary.value : undefined,
        flip,
        inputs,
        primary,
        rangePos: primary?.percentile10y ?? null,
        unreadReason: state === 'unread' ? unread.reason : null,
        staleDays: state === 'unread' ? unread.days : null,
      };
    });
}

/* ------------------------------------------------------------------ *
 * Beam geometry (spec 02 — SVG viewBox width 680, all units are user
 * units; the reference HTML is the authority)
 * ------------------------------------------------------------------ */

export const BEAM_CX = 340;
export const BEAM_HALF = 240;
export const TOKEN_W = 156;
export const TOKEN_H = 44;
export const TOKEN_GAP = 6;
export const TOKEN_LIFT = 10;

export interface BeamGeometry {
  /** viewBox width (fixed). */
  width: number;
  /** viewBox height = beamY + 72. */
  height: number;
  /** The beam's resting y. */
  beamY: number;
  /** End x of the supports side (inline-start). */
  xSupports: number;
  /** End x of the pressures side (inline-end). */
  xPressures: number;
  /** The beam group's rotation: tilt × dir (deg; dir −1 in RTL). */
  rotationDeg: number;
  /** Vertical travel of a beam end: HALF · sin(|tilt|) (user units). */
  dy: number;
  /** Token i's y on either end (stacked upward from the beam). */
  tokenY: (i: number) => number;
  /** Caption y under each end. */
  captionY: number;
  /** "None right now" baseline. */
  emptyY: number;
}

/**
 * The full beam layout. `dir` is +1 for LTR and −1 for RTL (the sides
 * mirror together — supports stays at the inline-start end).
 */
export function beamGeometry(supportsCount: number, pressuresCount: number, tiltDeg: number, dir: 1 | -1): BeamGeometry {
  const maxStack = Math.max(1, supportsCount, pressuresCount);
  const beamY = 44 + maxStack * TOKEN_H + (maxStack - 1) * TOKEN_GAP + TOKEN_LIFT;
  const height = beamY + 72;
  return {
    width: 680,
    height,
    beamY,
    xSupports: BEAM_CX - dir * BEAM_HALF,
    xPressures: BEAM_CX + dir * BEAM_HALF,
    rotationDeg: tiltDeg * dir,
    dy: tiltDeg === 0 ? 0 : BEAM_HALF * Math.sin((Math.abs(tiltDeg) * Math.PI) / 180),
    tokenY: (i: number) => beamY - TOKEN_LIFT - TOKEN_H - i * (TOKEN_H + TOKEN_GAP),
    captionY: beamY + 56,
    emptyY: beamY - 36,
  };
}

/* ------------------------------------------------------------------ *
 * Price context (spec 01 §E) — a phrase, never a weight
 * ------------------------------------------------------------------ */

export type FootingPhrase = 'ctxHolding' | 'ctxFading' | 'ctxMixed';

/**
 * The price-context phrase from the metal's own readings: high in its
 * 10-year range and not falling → holding; high but falling → fading;
 * anything else → moving sideways (spec 04 §"Price context"; the mapping
 * is ASSUMPTIONS.md §6).
 */
export function footingPhraseOf(price: IndicatorReading | null): FootingPhrase | null {
  if (price === null || price.value === null) return null;
  const high = price.percentile10y !== undefined && price.percentile10y > 0.8;
  const falling = price.change30d !== undefined && Number.isFinite(price.change30d) && price.change30d < 0;
  if (high) return falling ? 'ctxFading' : 'ctxHolding';
  return 'ctxMixed';
}

/** The asset's meta line: newest reading time + distinct source count
 * (drivers' inputs + the price reading — everything the card shows). */
export function cardMeta(
  factors: readonly BalanceFactor[],
  price: IndicatorReading | null,
): { newestUpdatedAt: string | null; sourcesCount: number } {
  const readings = [...factors.flatMap((f) => f.inputs), ...(price !== null ? [price] : [])];
  let newest: string | null = null;
  const sources = new Set<string>();
  for (const r of readings) {
    sources.add(r.sourceName);
    if (newest === null || r.updatedAt > newest) newest = r.updatedAt;
  }
  return { newestUpdatedAt: newest, sourcesCount: sources.size };
}

/** Row order (spec 01 §F.1): pressuring, supporting, neutral, unread. */
export function orderFactors(factors: readonly BalanceFactor[]): BalanceFactor[] {
  const rank: Record<FactorState, number> = { pressures: 0, supports: 1, neutral: 2, unread: 3 };
  return [...factors].sort((a, b) => rank[a.state] - rank[b.state]);
}
