/**
 * LBMA London vault + clearing — manual runner / KV seeder (GPE R24,
 * 2026-11-19; the gold-xau-run twin). The COMMON path runs the SAME job
 * the currena-api Worker's rung3 gold-lbma source runs
 * (runGoldLbmaIngest — the two cannot drift) and writes through the
 * Cloudflare REST API (RestGoldLbmaStore).
 *
 * The BOOTSTRAP fallback: the rung probes ONE candidate month per file
 * (the S14-D3 subrequest arithmetic: vault currentMonth−1, clearing
 * currentMonth−2); when the freshest published file is OLDER than those
 * candidates (a fresh deploy in the publication gap), the job answers
 * the calm not-published note — and this runner walks a WIDER ladder
 * (vault: m−1..m−3; clearing: m−2..m−4), assembles the snapshot with
 * the SAME builder the job uses, and seeds it. The runner is a Node
 * script outside the rung's subrequest budget.
 *
 * Modes:
 *   default   live LBMA fetch, merge, write
 *   --dry-run fetch + report only — no KV writes
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (writes; not needed with --dry-run)
 *   CLOUDFLARE_ACCOUNT_ID       (writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (writes — the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights gold-lbma-run --dry-run
 *   pnpm --filter @currena/insights gold-lbma-run
 */

import {
  RestGoldLbmaStore,
  buildGoldLbmaSnapshot,
  minusMonths,
  runGoldLbmaIngest,
} from '../src/domains/gold/lbma';
import { fetchLbmaVault, LbmaVaultNotPublished } from '../src/domains/gold/adapters/lbma-vault';
import { fetchLbmaClearing } from '../src/domains/gold/adapters/lbma-clearing';
import type { GoldLbmaVaultRow, GoldLbmaClearingRow, GoldLbmaSnapshot } from '@currena/core';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[gold-lbma-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

const store = dryRun
  ? { getGoldLbma: async () => undefined, writeGoldLbma: async () => undefined }
  : new RestGoldLbmaStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

const now = new Date();

/** The widest window the publication rhythms allow, newest-first. */
const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
async function ladder<T>(fetchOne: (m: string) => Promise<T[]>, candidates: string[]): Promise<T[] | undefined> {
  for (const month of candidates) {
    try {
      const rows = await fetchOne(month);
      return rows; // the first 200 IS the freshest published file
    } catch (err) {
      if (err instanceof LbmaVaultNotPublished) continue; // the calm pre-publication answer
      throw err;
    }
  }
  return undefined;
}

// The common path: THE JOB (its own clock-derived candidates).
const job = await runGoldLbmaIngest(store, { now });
if (job.outcome.ok && job.snapshot !== undefined) {
  console.log(`[gold-lbma-run] OK — ${job.outcome.note ?? 'done'}`);
  console.log(
    `[gold-lbma-run]   vault ${job.snapshot.vault.asOf} · ${job.snapshot.vault.rows.length} rows` +
      ` | clearing ${job.snapshot.clearing.asOf} · ${job.snapshot.clearing.rows.length} rows` +
      (dryRun ? ' · DRY RUN (nothing written)' : ' · in KV'),
  );
  process.exit(0);
}
if (!job.outcome.ok) {
  console.error(`[gold-lbma-run] the job failed (${job.outcome.kind}) — ${job.outcome.note}`);
  process.exit(1);
}

// The bootstrap fallback: the job answered "not published / nothing
// stored" — the ladder looks wider than the job's single candidates.
console.log(`[gold-lbma-run] the job's candidates are not published yet (${job.outcome.note}) — the bootstrap ladder:`);
const vaultRows = await ladder((m) => fetchLbmaVault({ dataMonth: m }), [
  minusMonths(ym, 1),
  minusMonths(ym, 2),
  minusMonths(ym, 3),
]);
const clearingRows = await ladder((m) => fetchLbmaClearing({ dataMonth: m }), [
  minusMonths(ym, 2),
  minusMonths(ym, 3),
  minusMonths(ym, 4),
]);
if (vaultRows === undefined || clearingRows === undefined) {
  console.error('[gold-lbma-run] FAILED — no published workbook found in the ladder window either (the venue has nothing newer).');
  process.exit(1);
}
const snapshot: GoldLbmaSnapshot = buildGoldLbmaSnapshot(vaultRows, clearingRows, now);
if (!dryRun) await store.writeGoldLbma(snapshot);
console.log(
  `[gold-lbma-run] OK — ladder bootstrap · vault ${snapshot.vault.asOf} (${vaultRows.length} rows)` +
    ` · clearing ${snapshot.clearing.asOf} (${clearingRows.length} rows)` +
    (dryRun ? ' · DRY RUN (nothing written)' : ' · written to KV'),
);
