/**
 * Bundled ingest data (2026-10-21 data-integrity round) — the repo's
 * hand-maintained data files as STATIC IMPORTS so the ingest runs from BOTH
 * venues: the GitHub Actions runner (scripts/ingest.ts, Node) and the
 * currena-api Worker (src/ingest/run.ts — where readFileSync does not
 * exist). Wrangler/esbuild, tsx and vitest all resolve these JSON imports;
 * every file keeps its loud zod/parse discipline — a malformed file fails
 * the run, never renders garbage.
 *
 * The owner edits these files in the repo and redeploys (the Worker bundle
 * carries them); the GHA runner reads them from its checkout as before.
 */

import { z } from 'zod';
import { CalendarEventSchema, type CalendarEvent } from '@currena/core';
import type { SeriesPoint } from '../series';
import { parseManualSeries } from '../adapters/manual';
import {
  parseContextNotes,
  parsePolicyDecisions,
  parseReleaseSchedule,
} from '../adapters/snapshot';
import type { ContextNote, PolicyDecision, ReleaseScheduleEntry } from '../adapters/snapshot';
import type { RegressionEpisode } from '../validation';

// JSON modules outside the package root: every tool in the chain resolves
// them (wrangler/esbuild, tsx, vitest) and resolveJsonModule covers tsc.
import calendarRaw from '../../../../data/insights-calendar.json';
import chinaPmiRaw from '../../../../data/manual/china-pmi.json';
import policyDecisionsRaw from '../../../../data/policy-decisions.json';
import releaseScheduleRaw from '../../../../data/insights-release-schedule.json';
import contextNotesRaw from '../../../../data/insights-context-notes.json';
import indicatorAuditRaw from '../../../../data/indicator-audit.json';
import siteModeOverridesRaw from '../../../../data/site-mode-overrides.json';
import regressionEpisodesRaw from '../../fixtures/regression-episodes.json';

/** The calendar (release dates feed the NextUpStrip + T-03 date checks). */
export const CALENDAR: readonly CalendarEvent[] = z.array(CalendarEventSchema).parse(calendarRaw);

/** The hand-entered China PMI observations (enteredOn/expires bookkeeping). */
const pmiParsed = parseManualSeries(chinaPmiRaw, 'china-pmi');
export const CHINA_PMI: SeriesPoint[] | undefined = pmiParsed?.points;
/** The manual file's expiry — an entry older than its next release reads stale. */
export const MANUAL_EXPIRES: Readonly<Record<string, string>> = pmiParsed
  ? { 'china-pmi': pmiParsed.expires }
  : {};

/** Policy decision dates (decided vs effective) for the rate cards. */
export const POLICY_DECISIONS: readonly PolicyDecision[] | undefined = parsePolicyDecisions(
  policyDecisionsRaw,
);

/** The hand-maintained release schedule (official publication dates). */
export const RELEASE_SCHEDULE: readonly ReleaseScheduleEntry[] | undefined = parseReleaseSchedule(
  releaseScheduleRaw,
);

/**
 * Context notes (A-06: expired ones never leave the snapshot builder).
 * The optional file ships as an empty array (the pre-bundle absent-file
 * semantics preserved exactly): no notes show, exactly as before.
 */
export const CONTEXT_NOTES: readonly ContextNote[] = parseContextNotes(contextNotesRaw);

/**
 * v3 M-6: the ids whose source legs are disabled in the risk register (the
 * kill switch) — from the generated audit sidecar, the SAME file the
 * registry sync pins (data/indicator-audit.json carries per-indicator
 * `enabled`, generated from packages/insights/src/sources.ts).
 */
export function auditDisabledIds(): string[] {
  try {
    const raw = indicatorAuditRaw as { indicators?: Array<{ id: string; enabled: boolean }> };
    return (raw.indicators ?? []).filter((i) => !i.enabled).map((i) => i.id);
  } catch {
    return []; // malformed sidecar → no extra hiding (the licence walk still governs)
  }
}

/** The saved regression episodes (fixtures/regression-episodes.json). */
export const REGRESSION_EPISODES: readonly RegressionEpisode[] | undefined = (() => {
  const parsed = regressionEpisodesRaw as unknown;
  return Array.isArray(parsed)
    ? (parsed as RegressionEpisode[])
    : Array.isArray((parsed as { episodes?: unknown }).episodes)
      ? ((parsed as { episodes: RegressionEpisode[] }).episodes)
      : undefined;
})();

/**
 * The PUBLIC projection's hidden ids (the generated site-mode-overrides
 * file — what SITE_MODE=public must hide). Both venues read the SAME
 * bundled value; the registry sync test pins the file against the code.
 */
export const HIDDEN_PUBLIC_IDS: ReadonlySet<string> = new Set<string>(
  (siteModeOverridesRaw as { hiddenIndicatorIds?: string[] }).hiddenIndicatorIds ?? [],
);
