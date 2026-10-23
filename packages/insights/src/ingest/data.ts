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
import shillerRaw from '../../../../data/shiller/shiller-cape.json';
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

/**
 * The converted Shiller file (FS-06): monthly CAPE + Excess CAPE Yield rows
 * from data/shiller/shiller-cape.json, refreshed out-of-band by
 * scripts/shiller-fetch.ts (the Worker never fetches the source). Enabled
 * 2026-10-23 by the owner's OD-1/D-42 approval — the register row governs
 * (ingest/run.ts consults providerFetchEnabled('shiller') before passing
 * these through, so a future register flip still fails closed here).
 *
 * Unit note: the converted file stores ECY as a FRACTION (0.0056); every
 * percent-unit indicator in the registry stores percent-scaled values
 * (us-cpi-yoy 3.0 = 3%), so the parse scales ECY ×100 — the card then shows
 * the publisher's own "0.56%" verbatim (display.ts 'percent', 2dp).
 */
const ShillerFileSchema = z.object({
  latestDate: z.string(),
  rows: z.array(
    z.object({
      date: z.string(),
      cape: z.number().nullable(),
      ecy: z.number().nullable(),
    }),
  ),
});
const shillerParsed = ShillerFileSchema.safeParse(shillerRaw);
export const SHILLER: { cape: SeriesPoint[]; ecy: SeriesPoint[] } | undefined = shillerParsed
  .success
  ? {
      cape: shillerParsed.data.rows
        .filter((r) => r.cape !== null)
        .map((r) => ({ date: r.date, value: r.cape as number })),
      ecy: shillerParsed.data.rows
        .filter((r) => r.ecy !== null)
        .map((r) => ({ date: r.date, value: (r.ecy as number) * 100 })),
    }
  : undefined;
export const SHILLER_LATEST_DATE: string | undefined = shillerParsed.success
  ? shillerParsed.data.latestDate
  : undefined;

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
