/**
 * The ever-green cron entrypoint (Phase 3 split of the former index.ts
 * monolith; wrangler.jsonc `triggers.crons`, 1/min).
 *
 * The ladder used to be pull-only: with no visitors the KV snapshot aged
 * unboundedly, and a failed scrape served the stale-cache rung — the
 * "last updated 3 hours ago" symptom. The cron re-runs the SAME ladder
 * (not a private path): getRates() honors the per-source fresh window
 * (tgju 300s / frankfurter 900s — fresh cache → zero scrapes) and
 * MIN_SCRAPE_INTERVAL_SEC, so the effective TGJU cadence is ~1 scrape /
 * 5 min. Frankfurter is ECB reference data (updates ~once per business
 * day), runs on the quarter hour, and its 15-min fresh window keeps the
 * fetch-context requests on the fresh-cache rung between cron ticks.
 * Failures are logged (observability) and never rethrow — a thrown
 * handler marks the whole cron invocation failed in the CF dashboard.
 */

import { runPricesUpdate, formatPricesReport, defaultPricesFetchers } from '@currena/insights/prices';
import { KvPricesStore } from '@currena/insights/prices';
import type { PricesJobFetchers } from '@currena/insights/prices';
import { runIngestWatchdog, WATCHDOG_MINUTE } from './ingest-watchdog';
import { recordHistory } from './history';
import { makeDefaultService } from './default-service';
import type { SnapshotSource } from '@currena/core';
import type { Bindings } from './index';

/** Minutes (UTC) on which the cron also refreshes the Frankfurter source. */
const FRANKFURTER_CRON_MOD_MIN = 15;

/**
 * The minute (UTC) on which the cron refreshes the Insights live prices
 * (2026-10-12, the stale-oil fix): ONE hourly rung that fetches Yahoo
 * quotes for the Prices board (Brent BZ=F, gold GC=F, silver SI=F, Bitcoin
 * BTC-USD) and writes them to the insights:prices-live:v1 KV key —
 * write-only-if-changed, so a quiet market costs ZERO writes. GET
 * /api/insights merges the quotes over the daily EOD snapshot at serve
 * time. Per-asset refresh intervals (volatility scaling) live in
 * @currena/insights/prices definitions — oil at 60 min is 24× the owner's
 * "at least once a day" bar. :13 avoids the Frankfurter quarter-hours.
 */
export const PRICES_CRON_MINUTE = 13;

/** The hourly live-prices refresh (exported for tests; the cron calls it). */
export async function runScheduledPricesRefresh(
  env: Bindings,
  deps: { fetchers?: PricesJobFetchers; now?: Date } = {},
): Promise<void> {
  const store = new KvPricesStore(env.RATES);
  const result = await runPricesUpdate({
    store,
    fetchers: deps.fetchers ?? defaultPricesFetchers(),
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  });
  console.log(formatPricesReport(result));
}

export async function runScheduled(env: Bindings, scheduledTimeMs: number): Promise<void> {
  const service = makeDefaultService(env);
  const minute = new Date(scheduledTimeMs).getUTCMinutes();
  const sources: SnapshotSource[] = minute % FRANKFURTER_CRON_MOD_MIN === 0
    ? ['tgju', 'frankfurter']
    : ['tgju'];
  await Promise.all([
    ...sources.map(async (source) => {
      try {
        const response = await service.getRates(source);
        // Task 24: record every live-scraped generation — the content
        // fingerprint inside recordHistory makes unchanged re-quotes no-ops.
        if (response.servedFrom === 'live') {
          try {
            const recorded = await recordHistory(env.RATES, source, response.snapshot);
            if (recorded) {
              console.log(`[history] ${source} recorded generation ${response.snapshot.fetchedAt}`);
            }
          } catch (err) {
            console.warn(`[history] record ${source} failed:`, err instanceof Error ? err.message : err);
          }
        }
        console.log(
          `[cron] ${source} ok — servedFrom=${response.servedFrom} fetchedAt=${response.snapshot.fetchedAt}${response.stale ? ' (STALE)' : ''}`,
        );
      } catch (err) {
        // Ladder bottom rung (no usable cache): logged, retried next tick.
        console.warn(`[cron] ${source} failed:`, err instanceof Error ? err.message : err);
      }
    }),
    // The hourly live-prices rung — fault-isolated inside runPricesUpdate
    // (one asset failing never fails the run); this catch is belt-and-braces
    // so a prices hiccup can never mark the whole cron invocation failed.
    ...(minute === PRICES_CRON_MINUTE
      ? [
          runScheduledPricesRefresh(env).catch((err: unknown) => {
            console.warn('[cron] prices refresh failed:', err instanceof Error ? err.message : err);
          }),
        ]
      : []),
    // The hourly ingest-watchdog rung (2026-10-16c): when the daily GHA
    // ingest silently stops firing (GitHub schedule delays/skips — observed
    // live over a 3-day outage), the Worker re-dispatches it. Fault-isolated
    // like every other rung; a GitHub hiccup never fails the cron.
    ...(minute === WATCHDOG_MINUTE
      ? [
          runIngestWatchdog(env).catch((err: unknown) => {
            console.warn('[cron] ingest watchdog failed:', err instanceof Error ? err.message : err);
          }),
        ]
      : []),
  ]);
}
