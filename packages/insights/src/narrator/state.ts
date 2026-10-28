/**
 * state.ts — P4 of the Layer-2 prep (docs/insights/layer2/
 * INSIGHTS-L2-PREP-SPEC.md §6): `buildNarrationState(snapshot, now)` —
 * the pure, typed, tested function that turns the ALREADY-COMPUTED page
 * state into the small JSON the future narrator (Layer 2) will receive.
 *
 * Design rules (spec §1 + §6):
 *   - The math decides; the AI only explains. This module NEVER
 *     re-derives a verdict, a status or a change: it reads the snapshot's
 *     own computed values (summary lines, reading statuses, change
 *     windows) and the fx document's own rule outcomes. The only thing it
 *     computes is P1 freshness — from the same thresholds the status
 *     engine uses (freshness.ts, D-20/D-21).
 *   - No raw API dumps: an alert carries one plain magnitude (a rounded
 *     number, its unit, its window), never the full reading payload.
 *   - Items that are stale or unavailable are NEVER mixed into the facts:
 *     they land in `excluded` with a reason; `items` carries only fresh
 *     readings.
 *   - `dataAsOf` spans the FRESH items only (the spec's oldest/newest
 *     fresh timestamp) — excluded data never masquerades as the page's
 *     data horizon.
 *
 * Pure: no I/O, no clock (every time reference is an explicit parameter),
 * no KV, no fetch, NO model calls (G10 + the session rules).
 *
 * The exact wire shape — field by field, with three real examples — is
 * documented in docs/insights/layer2/NARRATION-STATE.md and pinned by
 * the golden fixtures in packages/insights/fixtures/narration/.
 */

import type {
  FxRuleState,
  FxSummary,
  IndicatorDefinition,
  IndicatorReading,
  InsightsSnapshot,
  SummaryLine,
} from '@currena/core';
import { DEFINITIONS } from '../definitions';
import { GAUGES } from '../gauges';
import { freshnessOf } from '../freshness';
import { cadenceUsesPreviousRelease } from '../scoring';
import type { FreshnessInfo } from '../freshness';

/* ------------------------------------------------------------------ *
 * Input — the existing computed page state
 * ------------------------------------------------------------------ */

/** The fx board's computed state (the `/api/insights/fx` document's own fields).
 * Only the three fields the narration reads are required — the full live
 * document satisfies this structurally (Layer 2 can pass it as-is). */
export interface NarrationFxState {
  generatedAt: string;
  rules: readonly Pick<FxRuleState, 'id' | 'outcome' | 'counted'>[];
  summary: FxSummary;
}

/**
 * The narration input: the Insights snapshot (`/api/insights` — summary,
 * readings, calendar) plus, when available, the fx board's computed state
 * (`/api/insights/fx`). Both are ALREADY-COMPUTED documents; this module
 * only projects them.
 */
export interface NarrationSnapshot {
  insights: InsightsSnapshot;
  fx?: NarrationFxState;
}

/* ------------------------------------------------------------------ *
 * Output — the small JSON the narrator receives
 * ------------------------------------------------------------------ */

/** One alert currently firing (a voting reading whose status is warning). */
export interface NarrationAlert {
  id: string;
  /** The page's alerting tier word for a firing warning (v3 §4). */
  tier: 'needs-attention';
  direction: 'rising' | 'falling' | 'flat';
  /** The plain magnitude: one rounded number, its unit, its window. Never a raw dump. */
  magnitude: { value: number; unit: 'points' | 'percent'; window: '30d' | 'since-previous-release' } | null;
}

/** One active FX pattern (rule outcome warning or watch — D-24). */
export interface NarrationPattern {
  id: string;
  tier: 'warning' | 'watch';
  /** Whether the rule counts toward the fx section signal (post-downgrade). */
  counted: boolean;
}

/** One fresh item's compact projection (freshness included, per spec §6). */
export interface NarrationItem {
  id: string;
  status: IndicatorReading['status'];
  section: 'global' | 'australia';
  /** Gauge membership (a voting item) — the verdict arithmetic's electorate. */
  voting: boolean;
  value: number | null;
  asOf: string;
  ageHours: number;
  cadence: IndicatorDefinition['cadence'];
}

/** One excluded item — stale or unavailable data, never mixed into the facts. */
export interface NarrationExcluded {
  id: string;
  reason: 'stale' | 'unavailable';
  status: IndicatorReading['status'];
  asOf: string | null;
  ageHours: number | null;
  cadence: IndicatorDefinition['cadence'];
}

/** The narration state (the exact wire shape; see NARRATION-STATE.md). */
export interface NarrationState {
  /** The narration state's own clock — the `now` the caller passed. */
  generatedAt: string;
  /** The oldest/newest asOf among the FRESH items (null when none). */
  dataAsOf: { oldest: string | null; newest: string | null };
  /** The existing summary lines, verbatim (existing verdict labels). */
  verdict: { global: SummaryLine; australia: SummaryLine };
  /** The fx board's own signal rollup, verbatim (null when fx was not provided). */
  fxSignal: { signal: FxSummary['signal']; countedWarnings: number; headlineRule: string | null } | null;
  /** Alerts currently firing (warning-status readings), sorted by id. */
  alerts: NarrationAlert[];
  /** Active FX patterns (warning/watch outcomes), sorted by id. */
  patterns: NarrationPattern[];
  /** Fresh readings only, sorted by id. */
  items: NarrationItem[];
  /** Stale/unavailable readings with their reason, sorted by id. */
  excluded: NarrationExcluded[];
}

/* ------------------------------------------------------------------ *
 * The builder
 * ------------------------------------------------------------------ */

const DEFINITION_BY_ID = new Map<string, IndicatorDefinition>(DEFINITIONS.map((d) => [d.id, d]));

/** The electorate: every id that is a member of some gauge. */
const VOTING_IDS = new Set<string>(
  GAUGES.flatMap((g) => [...g.members]),
);

/** The plain magnitude of one alert (one rounded number + unit + window). */
function magnitudeOf(
  reading: IndicatorReading,
  def: IndicatorDefinition,
): NarrationAlert['magnitude'] {
  const change = reading.change30d;
  if (change === undefined || !Number.isFinite(change)) return null;
  return {
    value: Math.round(change * 100) / 100,
    unit: def.changeKind === 'pct' ? 'percent' : 'points',
    window: cadenceUsesPreviousRelease(def.cadence) ? 'since-previous-release' : '30d',
  };
}

/** The direction of one alert from its own change (fallbacks: flat). */
function directionOf(reading: IndicatorReading): 'rising' | 'falling' | 'flat' {
  const change = reading.change30d ?? reading.moveScore;
  if (change === undefined || !Number.isFinite(change) || change === 0) return 'flat';
  return change > 0 ? 'rising' : 'falling';
}

/**
 * Build the narration state (spec §6). Pure, deterministic (arrays sorted
 * by id; the golden fixtures pin the exact serialization).
 *
 * @param snapshot the existing computed page state (insights + optional fx)
 * @param now      the narrator's clock (ISO datetime; Layer 2 will pass
 *                 its run time, tests pass frozen clocks)
 */
export function buildNarrationState(snapshot: NarrationSnapshot, now: string): NarrationState {
  const { insights, fx } = snapshot;
  const items: NarrationItem[] = [];
  const excluded: NarrationExcluded[] = [];
  const alerts: NarrationAlert[] = [];

  for (const reading of insights.readings) {
    const def = DEFINITION_BY_ID.get(reading.id);
    if (def === undefined) {
      throw new Error(`buildNarrationState: no definition for reading id "${reading.id}"`);
    }
    const info: FreshnessInfo = freshnessOf(def, reading.asOf, now);
    if (info.freshness === 'fresh') {
      items.push({
        id: reading.id,
        status: reading.status,
        section: def.section,
        voting: VOTING_IDS.has(reading.id),
        value: reading.value,
        asOf: reading.asOf!,
        ageHours: info.ageHours ?? 0,
        cadence: info.cadence,
      });
      if (reading.status === 'warning') {
        alerts.push({
          id: reading.id,
          tier: 'needs-attention',
          direction: directionOf(reading),
          magnitude: magnitudeOf(reading, def),
        });
      }
    } else {
      excluded.push({
        id: reading.id,
        reason: info.freshness === 'stale' ? 'stale' : 'unavailable',
        status: reading.status,
        asOf: reading.asOf,
        ageHours: info.ageHours,
        cadence: info.cadence,
      });
    }
  }

  items.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  excluded.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  alerts.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // Active patterns: the alerting fx rule outcomes (D-24 — warning and
  // watch; supportive/quiet/nodata are not alerts).
  const patterns: NarrationPattern[] = [];
  for (const rule of fx?.rules ?? []) {
    const tier = rule.outcome === 'warning' || rule.outcome === 'watch' ? rule.outcome : null;
    if (tier !== null) patterns.push({ id: rule.id, tier, counted: rule.counted });
  }
  patterns.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // dataAsOf spans the FRESH items only.
  let oldest: string | null = null;
  let newest: string | null = null;
  for (const item of items) {
    if (oldest === null || item.asOf < oldest) oldest = item.asOf;
    if (newest === null || item.asOf > newest) newest = item.asOf;
  }

  return {
    generatedAt: now,
    dataAsOf: { oldest, newest },
    verdict: { global: insights.summary.global, australia: insights.summary.australia },
    fxSignal:
      fx !== undefined
        ? {
            signal: fx.summary.signal,
            countedWarnings: fx.summary.countedWarnings,
            headlineRule: fx.summary.headlineRule,
          }
        : null,
    alerts,
    patterns,
    items,
    excluded,
  };
}
