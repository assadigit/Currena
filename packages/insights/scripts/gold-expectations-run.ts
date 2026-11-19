/**
 * gold-expectations-run.ts — GPE R28 / F24 (2026-11-19): the Fed-meeting
 * market-expectations manual runner / KV seeder (the gold-lbma-run twin).
 * The COMMON path runs the SAME job the currena-api Worker's :23/:53
 * minute-cron rung runs (runGoldExpectationsIngest — the two cannot
 * drift) and writes through the Cloudflare REST API
 * (RestGoldExpectationsStore).
 *
 * Use: the post-deploy landing lever (a fresh deploy's key is empty
 * until the next :23/:53 tick — this runner lands the first snapshot
 * immediately, exactly the gold-xau-run discipline).
 *
 * Modes:
 *   default   live Polymarket fetch, write
 *   --dry-run fetch + report only — no KV writes
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes — the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights gold-expectations-run --dry-run
 *   pnpm --filter @currena/insights gold-expectations-run
 */

import { runGoldExpectationsIngest, RestGoldExpectationsStore } from '../src/domains/gold/expectations';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[gold-expectations-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

const store = dryRun
  ? { getGoldExpectations: async () => undefined, writeGoldExpectations: async () => undefined }
  : new RestGoldExpectationsStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

const now = new Date();

const job = await runGoldExpectationsIngest(store, { now });
if (job.outcome.ok) {
  console.log(`[gold-expectations-run] OK — ${job.outcome.note ?? 'done'}`);
  if (job.snapshot !== undefined) {
    console.log(
      `[gold-expectations-run]   ${job.snapshot.event.title} (${job.snapshot.event.slug}) · market close ${job.snapshot.event.endDate}` +
        ` · ${job.snapshot.markets.length} outcomes: ${job.snapshot.markets
          .map((m) => `${m.move} ${(m.yesPrice * 100).toFixed(1)}%`)
          .join(' · ')}` +
        (dryRun ? ' · DRY RUN (nothing written)' : ' · in KV'),
    );
  }
  process.exit(0);
}
console.error(`[gold-expectations-run] FAILED (${job.outcome.kind}) — ${job.outcome.note}`);
process.exit(1);
