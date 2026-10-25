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

/**
 * 2026-10-22 reliability round — the intra-day SWEEP rungs (10:10 and
 * 20:10 UTC). The 04:10 collect runs ONCE a day and F-11 keeps every
 * fetch single-attempt, so one transient edge blip at 04:10 (venue-
 * verified live 2026-10-22: FRED's Akamai edge served unparseable bodies
 * to all five bulk groups while serving healthy bodies to other venues
 * within the hour) used to cost a full day of public staleness. The
 * sweeps re-run the ingest when — and ONLY when — the last rung recorded
 * genuine fetch failures, healing the blip within hours at near-zero
 * cost on healthy days (the gate is one KV read). No new cron trigger:
 * the minute cron's hour+minute gates do the scheduling (the account's
 * 5-cron budget is full). Sweep mode trims the write chain for the
 * subrequest ceiling (see run.ts).
 */
export const INGEST_SWEEP_TIMES: readonly { hour: number; minute: number }[] = [
  { hour: 10, minute: 10 },
  { hour: 20, minute: 10 },
  // (2026-10-26 M7 publish rungs — captured + reverted, the M4 15:40
  // pattern: the 18:05 main-shaped rung + the 18:07 periodic-history rung
  // landed the first 89-reading snapshot family + the china pair's stored
  // accumulations from the Worker venue, all verified live (status
  // generatedAt 18:05:18Z, 89 readings, the 4 NBS fetch rows all ok —
  // the index page-2 fallback fired — insights:hist:china-cpi 13 points
  // -0.3@2025-09-30 → +0.9@2026-09-30, insights:hist:china-pmi 10 → 13
  // points with the fetched Table-1's Sep-Nov 2025 rows. The first M7
  // attempt in this GATED list honestly SKIPPED — the status was healthy
  // and only 7.6h old, the gate working as designed — so the publish rode
  // the UNGATED main-shaped rungs instead, both now reverted. The 20:10
  // designed sweep then found the fresh 18:05 status and skipped, exactly
  // as designed; the 04:10 main rung owns the day from here.)
  // (2026-10-23 22:35 diagnostic rung — captured + reverted: the epochDay
  // memoization (series.ts, same date) brought the sweep shape's real
  // cpuTime from 2050 ms (the 20:10 exceededCpu death) to 617 ms, with the
  // snapshot + status + stage + public projection all written and the page
  // healed. Margin restored: the main 04:10 shape carries ~7 more writes
  // and now sits ~3.3× under the free-plan ceiling — the rung-split
  // follow-up recorded in the M1† note is no longer needed.)
  // (2026-10-23 M1† note: temporary hourly :05 diagnostic rungs served their
  // purpose — three exceededCpu deaths captured at exactly 2050 ms
  // (13:05/14:05/15:05 UTC), the baseReadingCache fix deployed 15:34, and
  // the 16:05 rung completed healthy at cpu 1831 ms with the snapshot +
  // stage + public projection all written (tail-captured). Reverted to the
  // designed 10:10/20:10 pair. The 04:10 MAIN rung carries ~7 more writes
  // than the sweep shape — the margin is thin (~140–220 ms); if it dies at
  // the write tail, the 10:10 sweep heals the page (proven today) and the
  // rung-split refinement is the recorded follow-up.)
];

/** A sweep fires when the last status is older than this (a dead main rung). */
export const INGEST_SWEEP_STALE_MS = 10 * 3_600_000;

/** The insights:status blob's shape (the fields the gate reads). */
interface InsightsStatusBlob {
  generatedAt?: string;
  sources?: Array<{ source?: string; ok?: boolean; kind?: string }>;
}

/**
 * Should the sweep run? True when the last ingest status shows a genuine
 * fetch failure (kind failed/blocked/format-changed — NOT the honest
 * 'disabled' rows like the venue-skipped RBA F2 path, and not the
 * informational 'manual'/'cross-check' rows) or is so old the main rung
 * likely never landed (worker outage at 04:10 — the sweep then IS the
 * day's ingest).
 */
export function sweepShouldFire(status: InsightsStatusBlob | undefined, now: Date): boolean {
  if (status === undefined || typeof status.generatedAt !== 'string') return true; // no status at all — run
  const generated = Date.parse(status.generatedAt);
  if (!Number.isFinite(generated) || now.getTime() - generated > INGEST_SWEEP_STALE_MS) return true;
  const rows = Array.isArray(status.sources) ? status.sources : [];
  return rows.some(
    (r) =>
      r.ok === false &&
      (r.kind === 'failed' || r.kind === 'blocked' || r.kind === 'format-changed'),
  );
}

/** Read + parse the insights:status blob (one KV read; malformed → undefined). */
async function readInsightsStatus(kv: KVNamespace): Promise<InsightsStatusBlob | undefined> {
  try {
    const raw = await kv.get('insights:status');
    if (raw === null) return undefined;
    return JSON.parse(raw) as InsightsStatusBlob;
  } catch {
    return undefined;
  }
}

/** The main ingest rung (04:10 UTC daily). */
export async function runScheduledInsightsIngest(env: Bindings): Promise<void> {
  const store = new KvInsightsStore(env.RATES);
  const result = await runInsightsUpdate({
    store,
    stageKv: env.RATES,
    mode: 'scheduled',
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

/** One sweep rung (10:10 / 20:10 UTC): gated re-run of the full ingest. */
export async function runScheduledInsightsSweep(env: Bindings): Promise<'skipped' | 'ran'> {
  const status = await readInsightsStatus(env.RATES);
  if (!sweepShouldFire(status, new Date())) {
    console.log('[ingest-sweep] last rung healthy — skipping (1 subrequest)');
    return 'skipped';
  }
  console.log(
    `[ingest-sweep] ${status === undefined ? 'no status found' : `generatedAt=${status.generatedAt}`} — failures present or stale: re-running the ingest`,
  );
  const store = new KvInsightsStore(env.RATES);
  const result = await runInsightsUpdate({
    store,
    stageKv: env.RATES,
    mode: 'scheduled',
    skipRbaCsvTables: true,
    hiddenPublicIds: HIDDEN_PUBLIC_IDS,
    sweep: true,
  });
  if (result.failedSources.length === 0) {
    console.log('[ingest-sweep] all sources healthy again — snapshot restored');
  } else {
    console.warn(`[ingest-sweep] still failing after re-run: ${result.failedSources.join(', ')}`);
  }
  return 'ran';
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
): { kind: 'main' } | { kind: 'history-daily' } | { kind: 'history-periodic' } | { kind: 'sweep' } | undefined {
  const date = new Date(scheduledTimeMs);
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  // F2 (2026-10-21 stage-write fix): the TEMPORARY 05:10 verification rung
  // (hour === INGEST_CRON_HOUR + 1) is retired — the cosd trim landed and
  // was verified live; the main rung fires once a day at 04:10 again.
  if (hour === INGEST_CRON_HOUR) {
    if (minute === INGEST_MAIN_MINUTE) return { kind: 'main' };
    if (minute === INGEST_HIST_DAILY_MINUTE) return { kind: 'history-daily' };
    if (minute === INGEST_HIST_PERIODIC_MINUTE) return { kind: 'history-periodic' };
    return undefined;
  }
  // 2026-10-22 reliability round: the failure-gated intra-day sweeps.
  if (INGEST_SWEEP_TIMES.some((t) => t.hour === hour && t.minute === minute)) {
    return { kind: 'sweep' };
  }
  return undefined;
}
