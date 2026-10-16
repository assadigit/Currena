/**
 * The ingest watchdog (2026-10-16c) — the Worker-side self-heal for a
 * silent GitHub-scheduler outage.
 *
 * What happened: the insights-ingest GHA's 04:20 UTC schedule had been
 * firing hours late for days (GitHub's documented schedule-delay under
 * load), then stopped firing ENTIRELY (three consecutive days produced
 * zero attempted runs, while push-triggered CI kept firing instantly —
 * so not a minutes quota, not a workflow-file problem). The snapshot
 * quietly aged; nothing surfaced it beyond the /admin staleness pill.
 * A manual `workflow_dispatch` restored the data in one pass — this
 * watchdog makes that response AUTOMATIC.
 *
 * Design: the API Worker's own cron is Cloudflare-side and fires every
 * minute reliably. On the :40 hourly rung it reads the ingest status
 * key (`insights:status` → generatedAt) and, when the daily snapshot is
 * older than STALE_AFTER_HOURS, re-dispatches the insights-ingest
 * workflow through the GitHub API. The dispatch token is a Worker
 * secret (`GH_INGEST_DISPATCH_TOKEN` — a GitHub token with repo +
 * Actions write; set via `wrangler secret put`). WITHOUT the secret the
 * watchdog is an honest no-op that only logs (the same graceful shape
 * as the ingest workflow's optional Telegram alerter) — it never
 * crashes the cron and never invents data. A KV marker
 * (`insights:ingest-nudge:v1`) bounds the nudging to one attempt per
 * NUDGE_EVERY_HOURS, so a persistent outage costs at most a handful of
 * dispatches a day, and the workflow's own `concurrency` group
 * serialises any overlap. The KV write budget is untouched in the
 * healthy path (one read/hour, zero writes).
 */

import type { Bindings } from './index';

/** The KV key the ingest runner writes after every publish (its
 * generatedAt is the freshness signal). */
const INGEST_STATUS_KEY = 'insights:status';
/** The nudge marker — the epoch ms of the last dispatch, so a persistent
 * outage cannot machine-gun GitHub. */
const NUDGE_MARKER_KEY = 'insights:ingest-nudge:v1';
/** One missed daily ingest + margin (the /admin pill flips past 36 h). */
export const STALE_AFTER_HOURS = 26;
/** Minimum spacing between dispatches during a persistent outage. */
export const NUDGE_EVERY_HOURS = 6;
/** The cron minute this watchdog rides (offset from the :13 prices rung
 * and the :15 Frankfurter rung). */
export const WATCHDOG_MINUTE = 40;
/** The workflow lives on the default branch (where the schedule lives). */
const GH_DISPATCH_URL =
  'https://api.github.com/repos/assadigit/Currena/actions/workflows/insights-ingest.yml/dispatches';

export type IngestWatchdogOutcome =
  | 'fresh'
  | 'dispatched'
  | 'recent-nudge'
  | 'no-token'
  | 'dispatch-failed'
  | 'status-unreadable';

interface IngestWatchdogDeps {
  now?: Date;
  fetchFn?: typeof fetch;
}

/** Parse the ingest status record's generatedAt; null when the key is
 * missing or malformed (which counts as maximally stale). */
async function ingestGeneratedAt(kv: KVNamespace): Promise<Date | null> {
  try {
    const raw = await kv.get(INGEST_STATUS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('generatedAt' in parsed) ||
      typeof (parsed as { generatedAt: unknown }).generatedAt !== 'string'
    ) {
      return null;
    }
    const at = new Date((parsed as { generatedAt: string }).generatedAt);
    return Number.isNaN(at.getTime()) ? null : at;
  } catch {
    return null;
  }
}

async function lastNudgeAt(kv: KVNamespace): Promise<number | null> {
  try {
    const raw = await kv.get(NUDGE_MARKER_KEY);
    if (!raw) return null;
    const ms = Number(raw);
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  } catch {
    return null;
  }
}

/**
 * The hourly staleness check (cron.ts calls this on the :40 rung):
 * snapshot fresh → nothing; stale + token + no recent nudge → dispatch
 * the ingest workflow. Every outcome is a logged, bounded, no-throw
 * result — the cron's other work never depends on GitHub.
 */
export async function runIngestWatchdog(
  env: Pick<Bindings, 'RATES' | 'GH_INGEST_DISPATCH_TOKEN'>,
  deps: IngestWatchdogDeps = {},
): Promise<IngestWatchdogOutcome> {
  const now = deps.now ?? new Date();

  const generatedAt = await ingestGeneratedAt(env.RATES);
  if (generatedAt !== null) {
    const ageHours = (now.getTime() - generatedAt.getTime()) / 3_600_000;
    if (ageHours < STALE_AFTER_HOURS) return 'fresh';
  }

  const nudge = await lastNudgeAt(env.RATES);
  if (nudge !== null && now.getTime() - nudge < NUDGE_EVERY_HOURS * 3_600_000) {
    return 'recent-nudge';
  }

  const token = env.GH_INGEST_DISPATCH_TOKEN;
  if (!token) {
    console.warn(
      `[ingest-watchdog] the daily snapshot is stale (generatedAt=${generatedAt?.toISOString() ?? 'missing'}) but GH_INGEST_DISPATCH_TOKEN is not set — set it with \`wrangler secret put GH_INGEST_DISPATCH_TOKEN\` to enable the auto re-dispatch.`,
    );
    return 'no-token';
  }

  const fetchFn = deps.fetchFn ?? fetch;
  let ok = false;
  try {
    const response = await fetchFn(GH_DISPATCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'currena-ingest-watchdog',
      },
      body: JSON.stringify({ ref: 'main' }),
    });
    ok = response.status === 204;
    if (!ok) {
      // Drain the body so the connection frees, then log the code.
      await response.text().catch(() => '');
      console.warn(`[ingest-watchdog] GitHub dispatch answered HTTP ${response.status} — will retry on the next hourly rung.`);
    }
  } catch (err) {
    console.warn(
      '[ingest-watchdog] GitHub dispatch request failed:',
      err instanceof Error ? err.message : err,
    );
  }

  if (!ok) return 'dispatch-failed';

  // The marker only lands on a ACCEPTED dispatch — a failed request
  // retries on the very next rung, an accepted one waits NUDGE_EVERY_HOURS.
  await env.RATES.put(NUDGE_MARKER_KEY, String(now.getTime()));
  console.log(`[ingest-watchdog] snapshot stale — dispatched insights-ingest (workflow_dispatch, ref=main).`);
  return 'dispatched';
}
