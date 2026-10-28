/**
 * freshness.ts — P1 of the Layer-2 prep (docs/insights/layer2/
 * INSIGHTS-L2-PREP-SPEC.md §3): data age for EVERY reading, as a pure,
 * tested function the narrator (Layer 2) and the page honesty line share.
 *
 * What this is NOT: it is NOT the existing status/staleness engine
 * (scoring.ts `computeReading` owns the card's `status` and vote
 * exclusion — unchanged). This module DERIVES a structured freshness
 * verdict from the SAME definition thresholds the status engine uses, so
 * the two can never drift apart, and adds the cadence/age context a
 * narrator needs to explain a reading honestly ("a monthly series, last
 * print 30 Sep, 28 days old" — never "live" when it is not).
 *
 * Thresholds (spec §3.2 — conservative defaults, refined and logged in
 * docs/insights/layer2/DECISIONS.md D-20/D-21):
 *   daily 4 · weekly 10 · monthly 45 · quarterly 120 calendar days
 *   (identical to scoring.ts GRACE_DAYS by design — one discipline).
 *   per-change (a policy level) and manual data never go stale by age.
 *
 * Refinements:
 *   - A definition's documented `staleAfterDays` override (the real
 *     release-cycle record — e.g. ABS monthly CPI ages ~87 days between
 *     releases) is imported as-is, so freshness and the status engine read
 *     the same number for every indicator.
 *   - `FRESHNESS_CADENCE_REFINEMENTS`: while the Akamai edge 403s the
 *     daily f2-data.csv path from Cloudflare egress (venue-verified
 *     2026-10-21, re-verified live 2026-10-28 via the rba-probe worker),
 *     `au-10y`, `rba-expectations` and `au-us-10y-gap` ride the RBA F2.1
 *     MONTHLY table (fetched successfully by every ingest run since; the
 *     2026-10-21 F3 venue round). Their REPORTED cadence is therefore
 *     'monthly' — the real publishing cadence of the series actually
 *     served. When the daily path returns, delete the refinement and the
 *     definitions' own 4-day discipline re-tightens (see
 *     docs/insights/layer2/AU-DATA-OPTIONS.md).
 *
 * Zero I/O, zero clock reads (every time reference is an explicit
 * parameter — frozen-clock friendly, same rule as scoring.ts). Zero KV
 * operations, zero external calls (G10 free-tier safety).
 */

import type { IndicatorDefinition } from '@currena/core';
import { daysBetween } from './series';

/**
 * The minimal definition shape freshness needs (any IndicatorDefinition
 * satisfies it structurally; tests pass synthetic defs).
 */
export interface FreshnessDefInput {
  id: string;
  cadence: IndicatorDefinition['cadence'];
  staleAfterDays?: number;
}

/** The freshness tri-state (spec §3.1). */
export type Freshness = 'fresh' | 'stale' | 'unavailable';

/**
 * The per-reading freshness record (spec §3.1 — exactly these four
 * fields). `ageHours` is null exactly when `asOf` is (nothing to age).
 */
export interface FreshnessInfo {
  /** The reading's observation date (YYYY-MM-DD), or null when absent. */
  asOf: string | null;
  /** Whole hours between the asOf date (00:00 UTC) and `now`; null when asOf is null. */
  ageHours: number | null;
  /** The cadence the freshness was judged against (the refined, real one). */
  cadence: IndicatorDefinition['cadence'];
  freshness: Freshness;
}

/**
 * Conservative default staleness windows per cadence (spec §3.2 — the
 * same numbers as scoring.ts GRACE_DAYS, kept in one more place so the
 * narrator's discipline is visible on its own): daily series go stale
 * after 4 calendar days (covers weekends and short holidays), weekly
 * after 10, monthly after 45, quarterly after 120. `per-change` levels
 * never go stale by age; `manual` data rides the monthly window.
 */
export const FRESHNESS_STALE_DAYS: Readonly<Record<IndicatorDefinition['cadence'], number | null>> = {
  daily: 4,
  weekly: 10,
  monthly: 45,
  quarterly: 120,
  'per-change': null,
  manual: 45,
};

/**
 * D-21: while the daily RBA F2 path is venue-blocked, the three
 * F2.1-fed indicators are REPORTED at their real served cadence
 * (monthly). Their threshold still comes from the definition's own
 * documented `staleAfterDays` (40), so freshness agrees with the status
 * engine's existing tripwire bit-for-bit.
 */
export const FRESHNESS_CADENCE_REFINEMENTS: Readonly<Partial<Record<string, IndicatorDefinition['cadence']>>> = {
  'au-10y': 'monthly',
  'rba-expectations': 'monthly',
  'au-us-10y-gap': 'monthly',
};

/** The effective (refined) cadence one indicator is reported at (pure). */
export function freshnessCadenceOf(def: FreshnessDefInput): IndicatorDefinition['cadence'] {
  return FRESHNESS_CADENCE_REFINEMENTS[def.id] ?? def.cadence;
}

/**
 * The freshness threshold in whole calendar days for one definition
 * (override → refined-cadence default), or null when age never applies.
 * Identical inputs to scoring.ts `staleAfterDaysFor` for every
 * non-refined indicator — one discipline, two consumers.
 */
export function freshnessStaleDaysFor(def: FreshnessDefInput): number | null {
  const refined = freshnessCadenceOf(def);
  return def.staleAfterDays ?? FRESHNESS_STALE_DAYS[refined];
}

/** Whole hours from an ISO calendar date (00:00 UTC) to an ISO datetime. */
function ageHoursBetween(asOf: string, now: string): number {
  const from = Date.parse(`${asOf}T00:00:00Z`);
  const to = Date.parse(now);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 3_600_000));
}

/**
 * The freshness of one reading (spec §3.1). Pure: no I/O, no clock.
 *
 * - `asOf` null (the engine's `unavailable` readings) → `unavailable`.
 * - age (whole calendar days, the status engine's own arithmetic) past
 *   the threshold → `stale`; otherwise → `fresh`.
 */
export function freshnessOf(def: FreshnessDefInput, asOf: string | null, now: string): FreshnessInfo {
  const cadence = freshnessCadenceOf(def);
  if (asOf === null) {
    return { asOf: null, ageHours: null, cadence, freshness: 'unavailable' };
  }
  const ageHours = ageHoursBetween(asOf, now);
  const threshold = freshnessStaleDaysFor(def);
  const ageDays = daysBetween(asOf, now.slice(0, 10));
  const freshness: Freshness = threshold !== null && ageDays > threshold ? 'stale' : 'fresh';
  return { asOf, ageHours, cadence, freshness };
}

/**
 * Convenience: the freshness of an `IndicatorReading`-shaped object
 * (`{ id, asOf }`) against the DEFINITIONS table — the shape both the
 * page honesty line and the narration state feed it.
 */
export function freshnessOfReading(
  reading: { id: string; asOf: string | null },
  now: string,
  lookup: (id: string) => FreshnessDefInput,
): FreshnessInfo {
  return freshnessOf(lookup(reading.id), reading.asOf, now);
}
