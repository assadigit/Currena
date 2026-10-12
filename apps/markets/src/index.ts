/**
 * @currena/markets — the world stock markets cron Worker
 * (insights-world-markets-spec.md §3.4, §4).
 *
 * Surface: scheduled ONLY — this Worker deliberately exposes no fetch
 * handler, so a page request can NEVER reach a provider. The two cron
 * triggers are this section's own (spec §4 rule 3), keeping each
 * invocation far under the 50-subrequest cap:
 *
 *   "30 23 * * 1-5"  main  — every market has closed by 23:30 UTC; fetch
 *                            all 14, EODHD first, Yahoo as fallback.
 *   "30 1 * * 2-6"   retry — re-fetch only failed/old markets; when the
 *                            whole snapshot is old (the main run's write
 *                            bounced off the saturated daily KV budget),
 *                            re-fetch through Yahoo — the closes are
 *                            immutable, so the data is identical and the
 *                            EODHD quota the main run already spent is
 *                            protected — and land the day's one write in
 *                            the fresh post-midnight budget slice.
 *
 * The whole job is the SHARED runMarketsUpdate orchestration (the manual
 * markets-run script uses the same code path — the two cannot drift).
 * A missing EODHD_API_TOKEN secret is degraded-but-working: EODHD calls
 * fail fast and Yahoo serves everything.
 */

import { defaultFetchers } from '@currena/insights/markets';
import type { MarketJobFetchers, KVLike } from '@currena/insights/markets';
import { formatRunReport, runMarketsUpdate } from '@currena/insights/markets';
import type { RunMarketsUpdateResult } from '@currena/insights/markets';
import { KvMarketsStore } from '@currena/insights/markets';
import { MAIN_CRON } from './crons';

/**
 * The Worker's bindings. RATES is typed as the structural KV surface the
 * store needs — the real KVNamespace binding satisfies it (and the tests'
 * fake implements it).
 */
export interface MarketsEnv {
  RATES: KVLike;
  /** EODHD free-plan key (wrangler secret / .dev.vars). Optional — see header. */
  EODHD_API_TOKEN?: string;
}

/**
 * One scheduled run. `deps` lets the 24-hour budget test drive the exact
 * production path with a fake KV and fake providers (nothing here touches
 * the network by itself).
 */
export async function runScheduledMarkets(
  env: MarketsEnv,
  kind: 'main' | 'retry',
  deps: { fetchers?: MarketJobFetchers; now?: Date } = {},
): Promise<RunMarketsUpdateResult> {
  const store = new KvMarketsStore(env.RATES);
  const fetchers =
    deps.fetchers ??
    defaultFetchers({
      // Missing secret → empty token → every EODHD call fails fast and the
      // chain falls to Yahoo. Prefer skipping EODHD entirely in that case
      // (no wasted subrequests), exactly like the spec's calm degradation.
      apiToken: env.EODHD_API_TOKEN ?? '',
    });
  const explicitOrder = !env.EODHD_API_TOKEN ? ('yahoo-first' as const) : undefined;

  const result = await runMarketsUpdate({ store, fetchers, now: deps.now }, kind, {
    ...(explicitOrder !== undefined ? { providerOrder: explicitOrder } : {}),
  });
  console.log(formatRunReport(result));
  return result;
}

export default {
  async scheduled(
    event: ScheduledController,
    env: MarketsEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    const kind = event.cron === MAIN_CRON ? 'main' : 'retry';
    const work = runScheduledMarkets(env, kind).then(
      () => undefined,
      (err: unknown) => {
        // One run's failure must never crash the Worker or future runs —
        // the stored snapshot survives (R7) and the next cron retries.
        console.error(`[markets] ${kind} run failed: ${err instanceof Error ? err.message : String(err)}`);
      },
    );
    ctx.waitUntil(work);
  },
};
