/**
 * Central-bank gold tracker — manual runner / KV seeder (GPE R14,
 * 2026-11-18; the markets-au-run "Path B" twin). Runs the SAME job the
 * currena-api Worker's rung3 gold-cb source runs (runGoldCbIngest — the
 * two cannot drift) and writes through the Cloudflare REST API
 * (RestGoldCbStore).
 *
 * Why: the section ships with a deploy, but the rung's day-1–5 gate
 * next fires on the 1st of the FOLLOWING month — this runner lands the
 * data right after the deploy instead of serving the "not ready" line
 * for the gap (the M5.4 bootstrap lesson).
 *
 * Modes:
 *   default   live IMF fetch (the 4 SDMX dataflows), compute, write
 *   --dry-run fetch + compute + report only — no KV writes
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes — the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights gold-cb-run --dry-run
 *   pnpm --filter @currena/insights gold-cb-run
 */

import { RestGoldCbStore, runGoldCbIngest } from '../src/domains/gold/cb-demand';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[gold-cb-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

const store = dryRun
  ? { getGoldCb: async () => undefined, writeGoldCb: async () => undefined }
  : new RestGoldCbStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

const result = await runGoldCbIngest(store);

if (result.outcome.ok) {
  console.log(`[gold-cb-run] OK — ${result.outcome.note ?? 'done'}`);
  if (result.snapshot !== undefined) {
    console.log(
      `[gold-cb-run]   series ${result.snapshot.series.length} points (${result.snapshot.series[0]!.month} → ${result.snapshot.series.at(-1)!.month})` +
        ` · buyers: ${result.snapshot.buyers.map((b) => `${b.code} ${b.sum12m >= 0 ? '+' : ''}${b.sum12m.toFixed(1)}t`).join(', ')}` +
        ` · reported world ${result.snapshot.reportedWorld.tonnes} t / ${result.snapshot.reportedWorld.reporters} reporters` +
        (dryRun ? ' · DRY RUN (nothing written)' : ' · written to KV'),
    );
  }
} else {
  console.error(`[gold-cb-run] FAILED (${result.outcome.kind}) — ${result.outcome.note}`);
  process.exit(1);
}
