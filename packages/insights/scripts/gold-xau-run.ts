/**
 * XAUUSD daily OHLC — manual runner / KV seeder (GPE R18, 2026-11-18;
 * the gold-cb-run "Path B" twin). Runs the SAME job the currena-api
 * Worker's rung4 gold-xau source runs (runGoldXauIngest — the two
 * cannot drift) and writes through the Cloudflare REST API
 * (RestGoldXauStore).
 *
 * Why: the chart + the TA band ship with a deploy, but the rung4 first
 * fires the NEXT 04:35 UTC — this runner lands the series (the
 * free-tier ~1-year bootstrap: the s13 M1 §4a probe measured 361 rows)
 * right after the deploy instead of serving the "not ready" line for
 * the gap (the M5.4 bootstrap lesson).
 *
 * Modes:
 *   default   live EODHD fetch, merge, write
 *   --dry-run fetch + report only — no KV writes
 *
 * Environment:
 *   EODHD_API_TOKEN             (the fetch — the free plan key)
 *   CLOUDFLARE_API_TOKEN        (writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes — the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights gold-xau-run --dry-run
 *   pnpm --filter @currena/insights gold-xau-run
 */

import { RestGoldXauStore, runGoldXauIngest } from '../src/domains/gold/xau-ohlc';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const eodhdToken = process.env.EODHD_API_TOKEN ?? '';
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (eodhdToken === '') {
  console.error('\n[gold-xau-run] FATAL: a real run needs EODHD_API_TOKEN (the plan key — never in the repo).');
  process.exit(1);
}
if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[gold-xau-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

const store = dryRun
  ? { getGoldXau: async () => undefined, writeGoldXau: async () => undefined }
  : new RestGoldXauStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

const result = await runGoldXauIngest(store, { apiToken: eodhdToken });

if (result.outcome.ok) {
  console.log(`[gold-xau-run] OK — ${result.outcome.note ?? 'done'}`);
  if (result.snapshot !== undefined) {
    console.log(
      `[gold-xau-run]   bars ${result.snapshot.series.length} (${result.snapshot.series[0]!.date} → ${result.snapshot.series.at(-1)!.date})` +
        ` · last close ${result.snapshot.series.at(-1)!.close.toFixed(2)} USD/oz` +
        (dryRun ? ' · DRY RUN (nothing written)' : ' · written to KV'),
    );
  }
} else {
  console.error(`[gold-xau-run] FAILED (${result.outcome.kind}) — ${result.outcome.note}`);
  process.exit(1);
}
