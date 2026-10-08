/**
 * "What the signals say" cards (2026-10-08 UI spec Blocks S1–S3, the
 * v2-gated wave, shipped as I17 with the owner's full approval — the
 * SIGNALS_ENABLED flag stays one flip away from off).
 *
 * One card per metal (gold, silver): a checklist of the five usual
 * conditions with live values, a lean in words (mostly supportive / mixed /
 * mostly unsupportive), the count line ("n of m conditions met"), and the
 * three plain checks (10-year position, usual drivers, 30-day speed).
 * The fixed "before you act" box (S3) is copy, not computation — it renders
 * beside this data, never behind a click.
 *
 * The cards DESCRIBE CONDITIONS. They never recommend an action, never say
 * buy or sell, and use no green/red for supportive/against — icons and words
 * only (spec Block S1 note). Conditions are hedged ("usually") by contract:
 * every state word is authored copy, not generated advice.
 *
 * Five gold conditions (spec S1):
 *   1. real yield level and direction
 *   2. inflation expectations (5y5y forward)
 *   3. market stress (STLFSI4 + NFCI)
 *   4. the Currena dollar basket
 *   5. the metal's own position in its 10-year range and its 30-day speed
 * Silver (S2) reuses the five and adds industrial demand (China PMI +
 * copper-to-gold), always tagged "mixed" (silver is half industrial).
 *
 * Pure, platform-free (AGENTS.md rule 2) — reads the snapshot the page
 * already holds; no ingest or snapshot-format change.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { evalLeg } from './connections';

export type SignalMetal = 'gold' | 'silver';

export type SignalConditionKey =
  | 'real-yield'
  | 'expectations'
  | 'stress'
  | 'dollar'
  | 'footing'
  | 'industrial';

export type SignalConditionState = 'supportive' | 'against' | 'neutral' | 'unknown';

export type SignalLean = 'mostly-supportive' | 'mixed' | 'mostly-unsupportive';

export interface SignalConditionReading {
  key: SignalConditionKey;
  state: SignalConditionState;
  /** The indicators whose live values the checklist row shows. */
  inputs: readonly IndicatorId[];
}

export interface SignalReading {
  metal: SignalMetal;
  /** The metal's prices-board row (gold-usd / silver-usd). */
  priceId: IndicatorId;
  conditions: readonly SignalConditionReading[];
  /** Rows currently in their supportive configuration. */
  metCount: number;
  lean: SignalLean | null;
  /** Check 1: where the price sits in its 10-year range. */
  position: { band: 'low' | 'typical' | 'high'; percentile: number } | null;
  /** Check 3: the 30-day speed (null while the daily history accrues). */
  speed: number | null;
}

/** The metal's price-row id and its checklist order. */
const METAL_PRICE: Readonly<Record<SignalMetal, IndicatorId>> = {
  gold: 'gold-usd',
  silver: 'silver-usd',
};

const readable = (r: IndicatorReading | undefined): r is IndicatorReading =>
  r !== undefined && r.status !== 'stale' && r.status !== 'unavailable';

function byIdMap(readings: readonly IndicatorReading[]): Map<string, IndicatorReading> {
  return new Map(readings.map((r) => [r.id as string, r]));
}

/* ------------------------------------------------------------------ *
 * Condition evaluators — each returns the ROW state, never advice
 * ------------------------------------------------------------------ */

/** 1. Real yields: low or falling usually supports gold; high/rising against. */
function conditionRealYield(byId: Map<string, IndicatorReading>): SignalConditionState {
  const r = byId.get('real-yield-10y');
  if (!readable(r)) return 'unknown';
  const leg = evalLeg('real-yield-10y', r);
  if (leg.lean < 0) return 'supportive';
  if (leg.lean > 0) return 'against';
  return 'neutral';
}

/** 2. Inflation expectations (5y5y): elevated/rising usually supports gold. */
function conditionExpectations(byId: Map<string, IndicatorReading>): SignalConditionState {
  const r = byId.get('breakeven-5y5y');
  if (!readable(r)) return 'unknown';
  const leg = evalLeg('breakeven-5y5y', r);
  if (leg.lean > 0) return 'supportive';
  if (leg.lean < 0) return 'against';
  return 'neutral';
}

/** 3. Market stress: above-average stress (either index > 0) usually supports gold. */
function conditionStress(byId: Map<string, IndicatorReading>): SignalConditionState {
  const stlfsi = byId.get('stress-stlfsi');
  const nfci = byId.get('nfci');
  if (!readable(stlfsi) || !readable(nfci)) return 'unknown';
  if (stlfsi.value !== null && stlfsi.value > 0) return 'supportive';
  if (nfci.value !== null && nfci.value > 0) return 'supportive';
  if (stlfsi.value !== null && stlfsi.value < 0 && nfci.value !== null && nfci.value < 0) {
    return 'against'; // both calm — the safe-haven bid is absent
  }
  return 'neutral';
}

/** 4. The Currena dollar basket: a weak/falling dollar usually supports gold. */
function conditionDollar(byId: Map<string, IndicatorReading>): SignalConditionState {
  const r = byId.get('dollar-basket');
  if (!readable(r)) return 'unknown';
  const leg = evalLeg('dollar-basket', r);
  if (leg.lean < 0) return 'supportive';
  if (leg.lean > 0) return 'against';
  return 'neutral';
}

/**
 * 5. The metal's own footing: position in the 10-year range + 30-day speed.
 * Supportive when the metal is holding or rising (change30d ≥ 0); while the
 * daily history is still accruing (change30d undefined — the I16 timeline),
 * the position carries it (upper half = firm). Honest fallback, values shown.
 */
function conditionFooting(
  priceId: IndicatorId,
  byId: Map<string, IndicatorReading>,
): SignalConditionState {
  const r = byId.get(priceId);
  if (!readable(r)) return 'unknown';
  if (r.change30d !== undefined && Number.isFinite(r.change30d)) {
    return r.change30d >= 0 ? 'supportive' : 'against';
  }
  if (r.percentile10y !== undefined) {
    return r.percentile10y >= 0.5 ? 'supportive' : 'against';
  }
  return 'unknown';
}

/**
 * 6. Industrial demand (silver only, S2): China PMI + the copper-to-gold
 * ratio firming together. Always carries the fixed "mixed" tag in the UI —
 * silver is half industrial metal, so this driver pulls both ways.
 */
function conditionIndustrial(byId: Map<string, IndicatorReading>): SignalConditionState {
  const pmi = byId.get('china-pmi');
  const cg = byId.get('copper-gold');
  if (!readable(pmi) || !readable(cg)) return 'unknown';
  const l1 = evalLeg('china-pmi', pmi);
  const l2 = evalLeg('copper-gold', cg);
  if (l1.lean > 0 || l2.lean > 0) return 'supportive';
  if (l1.lean < 0 && l2.lean < 0) return 'against';
  return 'neutral';
}

/* ------------------------------------------------------------------ *
 * The card
 * ------------------------------------------------------------------ */

/** Lean thresholds: ≥4 supportive → mostly supportive; ≥4 against → mostly
 * unsupportive; anything between is honestly "mixed" (gold: 5 conditions,
 * silver: 6 — the count stays legible either way). */
const LEAN_STRONG = 4;

export function evaluateSignal(
  metal: SignalMetal,
  readings: readonly IndicatorReading[],
): SignalReading {
  const byId = byIdMap(readings);
  const priceId = METAL_PRICE[metal];

  const conditions: SignalConditionReading[] = [
    { key: 'real-yield', state: conditionRealYield(byId), inputs: ['real-yield-10y'] },
    { key: 'expectations', state: conditionExpectations(byId), inputs: ['breakeven-5y5y'] },
    {
      key: 'stress',
      state: conditionStress(byId),
      inputs: ['stress-stlfsi', 'nfci'],
    },
    { key: 'dollar', state: conditionDollar(byId), inputs: ['dollar-basket'] },
    { key: 'footing', state: conditionFooting(priceId, byId), inputs: [priceId] },
  ];
  if (metal === 'silver') {
    conditions.push({
      key: 'industrial',
      state: conditionIndustrial(byId),
      inputs: ['china-pmi', 'copper-gold'],
    });
  }

  const metCount = conditions.filter((c) => c.state === 'supportive').length;
  const againstCount = conditions.filter((c) => c.state === 'against').length;
  const unknownCount = conditions.filter((c) => c.state === 'unknown').length;
  let lean: SignalLean | null;
  if (unknownCount === conditions.length) lean = null; // nothing could be read
  else if (metCount >= LEAN_STRONG) lean = 'mostly-supportive';
  else if (againstCount >= LEAN_STRONG) lean = 'mostly-unsupportive';
  else lean = 'mixed';

  const priceRow = byId.get(priceId);
  const position =
    priceRow !== undefined && priceRow.percentile10y !== undefined
      ? {
          band: (priceRow.percentile10y < 0.2
            ? 'low'
            : priceRow.percentile10y > 0.8
              ? 'high'
              : 'typical') as 'low' | 'typical' | 'high',
          percentile: priceRow.percentile10y,
        }
      : null;
  const speed =
    priceRow !== undefined &&
    priceRow.change30d !== undefined &&
    Number.isFinite(priceRow.change30d)
      ? priceRow.change30d
      : null;

  return { metal, priceId, conditions, metCount, lean, position, speed };
}

/** Both cards in one call (gold first, silver after — S1 then S2). */
export function evaluateSignals(readings: readonly IndicatorReading[]): {
  gold: SignalReading;
  silver: SignalReading;
} {
  return { gold: evaluateSignal('gold', readings), silver: evaluateSignal('silver', readings) };
}
