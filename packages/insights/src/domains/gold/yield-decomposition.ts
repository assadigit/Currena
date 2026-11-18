/**
 * yield-decomposition.ts — GPE R12 / F5 (2026-11-18): the
 * yield-decomposition card's pure math — "yields are 5%, why is gold
 * not collapsing?" finally has an answer on the page (the Chain-3
 * flagship, s7/01 §4; the S3 verdict's assembled-macro-reading demand).
 *
 * THE CARD'S ARITHMETIC (honest-first — the owner's rule 5: never
 * present wrong arithmetic on a financial page): the four rows are the
 * spec's stack (nominal 10y · real 10y · breakeven · term premium), and
 * the EXACT relation rendered is real + breakeven = nominal — the
 * breakeven is DERIVED as nominal − real (the s4/04 §2f verification:
 * 2.20 = 5.12 − 2.92, matching the T10YIE family). The term premium is
 * the ACM model's estimate of the compensation component INSIDE the
 * nominal — a model estimate beside the market legs, never an additive
 * fourth leg (the spec's four-row identity rendered with its true sum;
 * the Kim–Wright provenance + revision disclosure ride the leg, s7/01
 * §4 item 1's binding note).
 *
 * Fail-closed (Agent Rule 5): a missing leg renders dashes, never a
 * guess; the DERIVED breakeven exists only when BOTH market legs carry
 * the SAME as-of date (mismatched dates skew the subtraction — the row
 * stays dark rather than print a mixed-date number).
 *
 * Platform-free (AGENTS.md rule 2): pure over the readings; zero
 * fetches, zero KV, zero clock.
 */

import type { IndicatorReading } from '@currena/core';

/** The four legs, fixed order (the card's stack). */
export type YieldLegId = 'nominal-10y' | 'real-10y' | 'breakeven-10y' | 'term-premium-10y';

export interface YieldLeg {
  id: YieldLegId;
  /** The leg's value; null = not readable (the row renders dashes). */
  value: number | null;
  /** The leg's own as-of (the derived leg: the shared date of both
   * market legs — present only when they match). */
  asOf: string | null;
  /** The leg's own source line (the reading's sourceName; the derived
   * leg names its method: the two legs it subtracts). */
  sourceName: string | null;
  sourceUrl: string | null;
  /** The leg's signed 30-day change (the "which piece moved" line). */
  delta30d: number | null;
  /** true for the derived breakeven (the method note renders). */
  derived: boolean;
}

export interface YieldDecomposition {
  /** [nominal, real, breakeven, term premium] — fixed order. */
  legs: readonly [YieldLeg, YieldLeg, YieldLeg, YieldLeg];
  /** true when every leg carries a value (the card's complete stack). */
  complete: boolean;
  /** The exact sum check, when both market legs are readable:
   * real + breakeven = nominal (by the derivation, to the cent). */
  identityHolds: boolean;
}

/** Quantize to 2 decimals — the float discipline (derived.ts's
 * combineSeries rule: raw IEEE subtraction prints 2.1999999999999997). */
function q2(v: number): number {
  return Math.round(v * 100) / 100;
}

function marketLeg(id: YieldLegId, reading: IndicatorReading | undefined): YieldLeg {
  return {
    id,
    value: reading?.value ?? null,
    asOf: reading?.asOf ?? null,
    sourceName: reading?.sourceName ?? null,
    sourceUrl: reading?.sourceUrl ?? null,
    delta30d: reading?.change30d !== undefined && Number.isFinite(reading.change30d) ? reading.change30d : null,
    derived: false,
  };
}

/**
 * The decomposition over the page projection's readings. The legs:
 * us10y (nominal, Treasury-direct per R07) · real-yield-10y (real,
 * Treasury-direct per R07) · the derived breakeven (nominal − real, only
 * on matching as-ofs) · term-premium-10y (the ACM series via FRED).
 */
export function yieldDecomposition(readings: readonly IndicatorReading[]): YieldDecomposition {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const nominal = marketLeg('nominal-10y', byId.get('us10y'));
  const real = marketLeg('real-10y', byId.get('real-yield-10y'));
  const termPremium = marketLeg('term-premium-10y', byId.get('term-premium-10y'));

  /* The derived breakeven: nominal − real at the 2-decimal presentation
   * (FRED's T10YIE family's own convention), ONLY on matching as-ofs —
   * a mixed-date subtraction is skew, not data (fail-closed). */
  const sameDate =
    nominal.value !== null && real.value !== null && nominal.asOf !== null && nominal.asOf === real.asOf;
  const breakeven: YieldLeg = {
    id: 'breakeven-10y',
    value: sameDate ? q2(nominal.value! - real.value!) : null,
    asOf: sameDate ? nominal.asOf : null,
    sourceName:
      nominal.sourceName !== null && real.sourceName !== null
        ? `derived: nominal − real (${nominal.sourceName} − ${real.sourceName})`
        : null,
    sourceUrl: nominal.sourceUrl,
    delta30d:
      nominal.delta30d !== null && real.delta30d !== null ? q2(nominal.delta30d - real.delta30d) : null,
    derived: true,
  };

  const legs = [nominal, real, breakeven, termPremium] as const;
  const complete = legs.every((leg) => leg.value !== null);
  const identityHolds =
    nominal.value !== null && real.value !== null && breakeven.value !== null
      ? q2(real.value + breakeven.value) === q2(nominal.value)
      : false;

  return { legs, complete, identityHolds };
}
