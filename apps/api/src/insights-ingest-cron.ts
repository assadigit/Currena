/**
 * The daily insights-ingest rungs (2026-10-21 data-integrity round) — the
 * currena-api Worker's minute-cron hosts the ingest since GitHub Actions
 * lost its ability to start jobs on 2026-10-20 (every workflow in the repo
 * fails at runner allocation — the account's Actions minutes). Three
 * hour-gated rungs, each far under the free plan's 50-subrequest ceiling:
 *
 *   04:10 UTC — runInsightsUpdate: collect every source (the RBA CSV
 *               attempts SKIPPED on this venue — the Akamai edge 403s those
 *               paths from Cloudflare egress; the HTML cash-rate page is
 *               fetched instead), derive, validate, write the snapshot +
 *               status + public projection + archives + seeds, and STAGE
 *               the series for the history rungs. 47 subrequests.
 *   04:25 UTC — the daily-cadence history rung (unconditional writes). 36.
 *   04:40 UTC — the monthly/quarterly history rung (read-compared). ~26.
 *
 * The GHA workflow stays as belt-and-braces (its writes are idempotent);
 * the ingest-watchdog rung keeps watching (the Worker rung keeps the
 * snapshot fresh, so the watchdog's 26h re-dispatch never fires while the
 * rungs are healthy). No new cron trigger: the account's free 5-cron
 * budget is full — the minute cron's hour+minute gates do the scheduling.
 *
 * Fault-isolated like every other rung: one failed ingest logs loudly
 * (console.error — visible in observability + `wrangler tail`) and never
 * marks the whole cron invocation failed.
 */

import {
  runInsightsUpdate,
  runInsightsHistoryPhase,
  KvInsightsStore,
  HIDDEN_PUBLIC_IDS,
} from '@currena/insights/ingest';
import type { Bindings } from './index';

/** The hour (UTC) whose minutes carry the ingest rungs. */
export const INGEST_CRON_HOUR = 4;
/** 04:10 — the main run (collect + snapshot + stage). */
export const INGEST_MAIN_MINUTE = 10;
/** 04:25 — the daily-cadence history rung. */
export const INGEST_HIST_DAILY_MINUTE = 25;
/** 04:40 — the periodic (monthly/quarterly) history rung. */
export const INGEST_HIST_PERIODIC_MINUTE = 40;

/** The main ingest rung (04:10 UTC daily). */
export async function runScheduledInsightsIngest(env: Bindings): Promise<void> {
  const store = new KvInsightsStore(env.RATES);
  const result = await runInsightsUpdate({
    store,
    stageKv: env.RATES,
    mode: 'scheduled',
    eodhdApiToken: env.EODHD_API_TOKEN,
    // The Worker venue: Akamai 403s the RBA CSV paths from Cloudflare
    // egress (venue-verified 2026-10-21) — skip the doomed attempts and
    // read the cash rate from the HTML decision table instead.
    skipRbaCsvTables: true,
    hiddenPublicIds: HIDDEN_PUBLIC_IDS,
  });
  // The always-write fix means the snapshot lands even with held P1s — the
  // alerts stay loud for observability (the /status panel carries them too).
  if (result.p1Unavailable.length > 0 || result.heldP1.length > 0) {
    console.error(
      `[ingest-cron] ALERT — P1 unavailable: [${result.p1Unavailable.join(', ')}] · held stale: [${result.heldP1.join(', ')}]`,
    );
  }
}

/** One history rung (04:25 daily-cadence / 04:40 periodic). */
export async function runScheduledInsightsHistories(
  env: Bindings,
  phase: 'daily' | 'periodic',
): Promise<import('@currena/insights/ingest').HistoryPhaseResult> {
  const result = await runInsightsHistoryPhase({ kv: env.RATES, phase });
  if (!result.ok) {
    console.error(`[ingest-cron] history phase '${phase}' had failed writes`);
  }
  return result;
}

/** True when the scheduled time carries an ingest rung (and which). */
export function insightsIngestRung(
  scheduledTimeMs: number,
): { kind: 'main' } | { kind: 'history-daily' } | { kind: 'history-periodic' } | undefined {
  const date = new Date(scheduledTimeMs);
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  // F2 (2026-10-21 stage-write fix): the TEMPORARY 05:10 verification rung
  // (hour === INGEST_CRON_HOUR + 1) is retired — the cosd trim landed and
  // was verified live; the main rung fires once a day at 04:10 again.
  if (hour !== INGEST_CRON_HOUR) return undefined;
  if (minute === INGEST_MAIN_MINUTE) return { kind: 'main' };
  if (minute === INGEST_HIST_DAILY_MINUTE) return { kind: 'history-daily' };
  if (minute === INGEST_HIST_PERIODIC_MINUTE) return { kind: 'history-periodic' };
  return undefined;
}
