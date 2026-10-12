/**
 * Live prices — manual runner / KV seeder (the prices twin of markets-run).
 * Runs the SAME orchestration as the currena-api Worker's hourly :13 cron
 * rung (runPricesUpdate — the two cannot drift) and writes through the
 * Cloudflare REST API (RestPricesStore, "Path B").
 *
 * Use cases:
 *   - post-deploy initial seed (the board turns live immediately, no need
 *     to wait for the next :13);
 *   - an operator-driven refresh after a provider outage;
 *   - `--dry-run` for a connectivity probe (fetch + report, no writes).
 *
 * Modes:
 *   default    live Yahoo fetch, compute, write-if-changed
 *   --dry-run  fetch + report only — no KV writes
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes — the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights prices-run --dry-run
 *   pnpm --filter @currena/insights prices-run
 */

import { runPricesUpdate, formatPricesReport, defaultPricesFetchers } from '../src/prices/job';
import { RestPricesStore } from '../src/prices/store';
import type { PricesReader, PricesWriter } from '../src/prices/store';

const dryRun = process.argv.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[prices-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

/* ---------------- store ---------------- */

let store: PricesReader & PricesWriter;
if (dryRun) {
  const memory: { value: string | null } = { value: null };
  store = {
    getLivePrices: async () => {
      try {
        return memory.value === null ? undefined : (JSON.parse(memory.value) as never);
      } catch {
        return undefined;
      }
    },
    putLivePricesIfChanged: async () => 'written',
  };
} else {
  store = new RestPricesStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });
}

/* ---------------- run ---------------- */

console.log(`# prices-run — live Yahoo fetch${dryRun ? ' (DRY-RUN — no KV writes)' : ''}\n`);
const result = await runPricesUpdate({ store, fetchers: defaultPricesFetchers() });
console.log(formatPricesReport(result));
console.log();

if (result.snapshot !== undefined) {
  for (const [id, entry] of Object.entries(result.snapshot.assets)) {
    console.log(
      `  ${id.padEnd(10)} ${String(entry.value).padEnd(10)} asOf=${entry.asOf}` +
        ` 7d=${entry.change7d !== undefined ? `${entry.change7d}%` : '—'}` +
        ` 30d=${entry.change30d !== undefined ? `${entry.change30d}%` : '—'}` +
        ` (${entry.sourceSymbol})`,
    );
  }
}

if (dryRun) {
  console.log('\nDRY-RUN — no KV writes were made.');
}

if (result.writeError !== undefined) {
  // A bounced write is not fatal for the data (the next hourly rung lands
  // it), but a manual runner should still exit non-zero so the operator sees it.
  console.error(`\n[prices-run] KV write failed: ${result.writeError}`);
  process.exit(1);
}
