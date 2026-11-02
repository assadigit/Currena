/**
 * Australian markets board — manual runner / KV seeder (gap-closure
 * S6-M6.1, 2026-11-02; the markets-run.ts "Path B" twin for the AU board).
 * Runs the SAME orchestration as the currena-markets Worker's 07:00 UTC AU
 * cron (runAuMarketsUpdate — the two cannot drift) and writes through the
 * Cloudflare REST API (RestAuMarketsStore).
 *
 * Why: a fresh index on the board (the S6-M6.1 NZX 50 rider) can land
 * right after a deploy, without waiting for the next 07:00 UTC cron tick
 * (the M5.4 bootstrap waited a day by design — this runner is the
 * belt-and-braces lever for that class of change).
 *
 * Modes:
 *   default   live Yahoo fetch (the board is Yahoo-only), compute,
 *             write-only-if-changed
 *   --dry-run fetch + compute + report only — no KV writes
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes — the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights markets-au-run --dry-run
 *   pnpm --filter @currena/insights markets-au-run
 */

import { auDefaultFetcher } from '../src/markets-au/job';
import { runAuMarketsUpdate, formatAuRunReport } from '../src/markets-au/run';
import { RestAuMarketsStore } from '../src/markets-au/store';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[markets-au-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

const store = dryRun
  ? undefined
  : new RestAuMarketsStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

const result = await runAuMarketsUpdate(
  {
    store:
      store ?? {
        getAuMarkets: async () => undefined,
        putAuMarketsIfChanged: async () => 'unchanged' as const,
      },
    fetchers: auDefaultFetcher(),
  },
  'main',
);
console.log(formatAuRunReport(result));
console.log(
  result.wroteSnapshot
    ? `\n[markets-au-run] snapshot WRITTEN (${result.snapshot?.markets.length ?? 0} rows).`
    : result.unchanged
      ? '\n[markets-au-run] content unchanged — write skipped (zero KV cost).'
      : '\n[markets-au-run] nothing stored this run (see the report above).',
);
if (dryRun) console.log('[markets-au-run] DRY RUN — no KV writes.');
