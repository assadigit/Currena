/**
 * @currena/markets — the world stock markets cron Worker
 * (insights-world-markets-spec.md §3.4, §4), and — since 2026-10-13 — the
 * world currencies job too (insights-world-currencies-spec.md §4.4's
 * fallback: the fx job rides this Worker's triggers as a separate function
 * with its own error handling; if a CPU-limit error ever appears, the fx
 * job moves to its own trigger).
 *
 * Surface: scheduled ONLY — this Worker deliberately exposes no fetch
 * handler, so a page request can NEVER reach a provider. The three cron
 * triggers are the stock section's own (spec §4 rule 3), keeping each
 * invocation far under the 50-subrequest cap (the combined worst case —
 * every market fetch bouncing to Yahoo AND the fx fallback firing — is
 * ≤48 subrequests INCLUDING the same-invocation KV ops, audit A-6: the
 * write gates compare against the runs' own start-of-run reads instead
 * of re-reading; see index.test.ts's combined budget test):
 *
 *   "30 23 * * 1-5"  main  — every market has closed by 23:30 UTC; fetch
 *                            all 16, EODHD first, Yahoo as fallback; then
 *                            the fx job (ONE Frankfurter call).
 *   "30 1 * * 2-6"   retry — re-fetch only failed/old markets; when the
 *                            whole snapshot is old (the main run's write
 *                            bounced off the saturated daily KV budget),
 *                            re-fetch through Yahoo — the closes are
 *                            immutable, so the data is identical and the
 *                            EODHD quota the main run already spent is
 *                            protected — and land the day's one write in
 *                            the fresh post-midnight budget slice. The fx
 *                            job runs again (its own write gate spends
 *                            nothing when nothing changed).
 *   "50 8 * * 2-6"   asia  — F1 (2026-10-21 session-finality round): the
 *                            01:30 retry now HOLDS an intraday Asian
 *                            point instead of freezing it as the day's
 *                            close; this rung re-fetches those markets
 *                            AFTER their sessions have closed (Tokyo
 *                            06:00, Sydney 06:00, Seoul 06:30, Taipei
 *                            05:30, Shanghai 07:00, Hong Kong 08:00 UTC)
 *                            and lands the day's rows. Mumbai (10:00 UTC
 *                            close) lands on the next rung or the 23:30
 *                            main. Retry-shaped: only failed/old markets.
 *
 * Both jobs are the SHARED runMarketsUpdate / runFxUpdate orchestrations
 * (the manual runner scripts use the same code paths — they cannot drift).
 * One job's failure never fails the other (the fx job is fault-isolated:
 * its stored snapshot survives and the next cron retries). A missing
 * EODHD_API_TOKEN secret is degraded-but-working: EODHD calls fail fast
 * and Yahoo serves everything (the fx job needs no secret at all).
 */

import { defaultFetchers } from '@currena/insights/markets';
import type { MarketJobFetchers, KVLike } from '@currena/insights/markets';
import { formatRunReport, runMarketsUpdate } from '@currena/insights/markets';
import type { RunMarketsUpdateResult } from '@currena/insights/markets';
import { KvMarketsStore } from '@currena/insights/markets';
import { defaultFxFetchers, formatFxRunReport, runFxUpdate } from '@currena/insights/fx';
import { KvFxStore } from '@currena/insights/fx';
import { MAIN_CRON, RETRY_CRON, ASIA_CRON } from './crons';

/**
 * The Worker's bindings. RATES is typed as the structural KV surface the
 * stores need — the real KVNamespace binding satisfies it (and the tests'
 * fake implements it).
 */
export interface MarketsEnv {
  RATES: KVLike;
  /** EODHD free-plan key (wrangler secret / .dev.vars). Optional — see header. */
  EODHD_API_TOKEN?: string;
}

/**
 * One scheduled markets run. `deps` lets the 24-hour budget test drive the
 * exact production path with a fake KV and fake providers (nothing here
 * touches the network by itself).
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

/**
 * One scheduled fx run (the currencies twin). Fault-isolated from the
 * markets job: its failures log and never rethrow into the Worker.
 */
export async function runScheduledFx(env: MarketsEnv, deps: { now?: Date } = {}): Promise<void> {
  const store = new KvFxStore(env.RATES);
  const result = await runFxUpdate({
    store,
    cross: store,
    fetchers: defaultFxFetchers(),
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  });
  console.log(formatFxRunReport(result));
}

export default {
  async scheduled(
    event: ScheduledController,
    env: MarketsEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    // Cron-kind selection is explicit (QA audit A-7): an unknown trigger
    // expression logs loudly and skips — never silently treated as 'retry'
    // (the old string-inequality fallback ran ANY unexpected cron as the
    // retry pass, which re-fetches through Yahoo and could burn quota on a
    // misconfigured trigger). The Asia rung (F1) is retry-SHAPED: it runs
    // the same retry orchestration (only failed/old markets), only its
    // trigger time differs — after the Asian closes.
    const kind: 'main' | 'retry' | undefined =
      event.cron === MAIN_CRON
        ? 'main'
        : event.cron === RETRY_CRON || event.cron === ASIA_CRON
          ? 'retry'
          : undefined;
    if (kind === undefined) {
      console.error(
        `[markets] unknown cron expression ${JSON.stringify(event.cron)} — skipping ` +
          `(expected ${JSON.stringify(MAIN_CRON)}, ${JSON.stringify(RETRY_CRON)} or ${JSON.stringify(ASIA_CRON)})`,
      );
      return;
    }
    const marketsWork = runScheduledMarkets(env, kind).then(
      () => undefined,
      (err: unknown) => {
        // One run's failure must never crash the Worker or future runs —
        // the stored snapshot survives (R7) and the next cron retries.
        console.error(`[markets] ${kind} run failed: ${err instanceof Error ? err.message : String(err)}`);
      },
    );
    // The fx job rides the same triggers (§4.4's fallback), fault-isolated:
    // it starts only after the markets job settles so the two never
    // interleave their provider calls inside one invocation.
    const fxWork = marketsWork.then(() => runScheduledFx(env)).then(
      () => undefined,
      (err: unknown) => {
        console.error(`[fx] run failed: ${err instanceof Error ? err.message : String(err)}`);
      },
    );
    ctx.waitUntil(fxWork);
  },
};
