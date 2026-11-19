/**
 * XAU crosses — manual runner / KV seeder (GPE R26, 2026-11-19; the
 * gold-xau-run twin). Runs the SAME job the currena-api Worker's rung4
 * gold-xau-crosses source runs (runGoldXauCrossesIngest — the two
 * cannot drift) and writes through the Cloudflare REST API
 * (RestGoldCrossesStore; the gold-xau key reads through
 * RestGoldXauStore — the derivation needs the SAME series the chart
 * reads).
 *
 * Why: the currency grid ships with a deploy, but the rung4 first fires
 * the next weekday 04:35 UTC — this runner lands the series right after
 * the deploy instead of serving the "not ready" line for the gap (the
 * M5.4 bootstrap lesson).
 *
 * Modes:
 *   default   live EODHD fetch, merge, write
 *   --dry-run fetch + report only — no KV writes
 *
 * Environment:
 *   EODHD_API_TOKEN             (the fetch — the plan key)
 *   CLOUDFLARE_API_TOKEN        (writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes — the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights gold-crosses-run --dry-run
 *   pnpm --filter @currena/insights gold-crosses-run
 */

import { RestGoldCrossesStore, runGoldXauCrossesIngest } from '../src/domains/gold/xau-crosses';
import { RestGoldXauStore } from '../src/domains/gold/xau-ohlc';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const eodhdToken = process.env.EODHD_API_TOKEN ?? '';
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (eodhdToken === '') {
  console.error('\n[gold-crosses-run] FATAL: a real run needs EODHD_API_TOKEN (the plan key — never in the repo).');
  process.exit(1);
}
if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[gold-crosses-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

const rest = { apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! };
const store = dryRun
  ? { getGoldCrosses: async () => undefined, writeGoldCrosses: async () => undefined }
  : new RestGoldCrossesStore(rest);
const goldXau = dryRun
  ? { getGoldXau: async () => undefined, writeGoldXau: async () => undefined }
  : new RestGoldXauStore(rest);

const result = await runGoldXauCrossesIngest(store, { apiToken: eodhdToken, goldXau });

if (result.outcome.ok) {
  console.log(`[gold-crosses-run] OK — ${result.outcome.note ?? 'done'}`);
  if (result.snapshot !== undefined) {
    for (const cross of result.snapshot.crosses) {
      const last = cross.series[cross.series.length - 1]!;
      console.log(
        `[gold-crosses-run]   ${cross.id.toUpperCase()} ${cross.kind} (${cross.formula}) · ${cross.series.length} pts · last ${last.close.toFixed(2)} @ ${last.date}`,
      );
    }
    if (dryRun) console.log('[gold-crosses-run]   DRY RUN (nothing written)');
    else console.log('[gold-crosses-run]   written to KV');
  }
} else {
  console.error(`[gold-crosses-run] FAILED (${result.outcome.kind}) — ${result.outcome.note}`);
  process.exit(1);
}
