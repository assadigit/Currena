/**
 * Phase I3 ingestion runner — the Node twin of the Worker's ingest rungs.
 * Since the 2026-10-21 data-integrity round this script delegates to the
 * SHARED orchestration (src/ingest/run.ts runInsightsUpdate + the inline
 * history writes), so the GitHub Actions venue, the manual runner and the
 * currena-api Worker cron rungs can never drift apart (the live-run/ingest
 * discipline).
 *
 * Venues:
 *   - GitHub Actions (.github/workflows/insights-ingest.yml, daily 04:20
 *     UTC — belt-and-braces since the Worker became the primary venue on
 *     2026-10-20 when the account's Actions minutes died; the writes are
 *     idempotent so a double-run is harmless).
 *   - Manual: `pnpm --filter @currena/insights ingest` (writes KV via the
 *     Cloudflare REST API) or `ingest --dry-run` (fetch + score, no writes).
 *
 * The Node venue writes every history INLINE (read-compared) in its own
 * process — no subrequest ceiling applies — so it passes no stageKv.
 *
 * Exit semantics follow the shared run: the snapshot ALWAYS writes (one
 * dead source no longer freezes the page); P1 unavailability/held-stale
 * still exits 1 so the red run surfaces the degradation (the Telegram
 * alerter rides the workflow's failure path).
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN        (required for writes)
 *   CLOUDFLARE_ACCOUNT_ID       (required for writes)
 *   INSIGHTS_KV_NAMESPACE_ID    (required for writes — the RATES namespace)
 *   INSIGHTS_RUN_MODE           scheduled | manual (default manual)
 *   RBA_SKIP_CSV_TABLES         '1' to skip the f2 daily path (venue flag)
 */

import { readFileSync } from 'node:fs';
import { z } from 'zod';

import { RestInsightsStore } from '../src/store';
import { runInsightsUpdate, writeAllHistoriesInline } from '../src/ingest/run';
import { HIDDEN_PUBLIC_IDS } from '../src/ingest/data';

const dryRun = process.argv.includes('--dry-run');

function fail(message: string): never {
  console.error(`\n[ingest] FATAL: ${message}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Environment
 * ------------------------------------------------------------------ */

const mode = z.enum(['scheduled', 'manual']).catch('manual').parse(process.env.INSIGHTS_RUN_MODE);

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  fail(
    'missing environment — a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run)',
  );
}

/* ------------------------------------------------------------------ *
 * The run (the shared orchestration — collect, derive, validate, write)
 * ------------------------------------------------------------------ */

const store = dryRun
  ? undefined
  : new RestInsightsStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

// Fix spec T-07: the Node venue scans the copy corpus from its checkout
// (the Worker omits it — the CI corpus tests cover the templates there).
const repoRoot = new URL('../../../', import.meta.url);
const copyTexts: string[] = [];
for (const dictPath of ['apps/web/src/i18n/insights-copy-en.ts', 'apps/web/src/i18n/insights-copy-fa.ts']) {
  try {
    const raw = readFileSync(new URL(dictPath, repoRoot), 'utf8');
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '');
    for (const match of stripped.matchAll(/'((?:[^'\\]|\\.)*)'/g)) copyTexts.push(match[1]!);
    for (const match of stripped.matchAll(/"((?:[^"\\]|\\.)*)"/g)) copyTexts.push(match[1]!);
  } catch {
    // Shallow clone without apps/ — the CI corpus tests cover the templates.
  }
}

const skipRbaCsvTables = process.env.RBA_SKIP_CSV_TABLES === '1' || undefined;

const result = await runInsightsUpdate({
  // The dry-run path passes a no-op store: runInsightsUpdate skips every
  // write when dryRun is set, so the store is only dereferenced on a real
  // run — the undefined-vs-store split keeps the env checks honest.
  store: dryRun ? ({ getSnapshot: async () => undefined, getHistory: async () => undefined } as never) : store!,
  mode,
  ...(skipRbaCsvTables !== undefined ? { skipRbaCsvTables: true } : {}),
  dryRun,
  ...(copyTexts.length > 0 ? { copyTexts } : {}),
  hiddenPublicIds: HIDDEN_PUBLIC_IDS,
});

/* ------------------------------------------------------------------ *
 * The Node venue's inline history writes (read-compared, no staging)
 * ------------------------------------------------------------------ */

if (!dryRun) {
  const history = await writeAllHistoriesInline(store!, result.series);
  const { reads, writes, retriedWrites } = store!.ops;
  console.log(
    `  KV ops this run: ${reads} reads, ${writes} writes (${retriedWrites} retried after the daily cap) — free limits: 100,000 reads / 1,000 writes per day.`,
  );
  if (history.failed > 0) {
    console.warn(`  ⚠ ${history.failed} history writes failed (held; the next run retries)`);
  }
}

/* ------------------------------------------------------------------ *
 * Exit criterion: every P1 indicator must have data (the red-run signal)
 * ------------------------------------------------------------------ */

if (result.p1Unavailable.length > 0) {
  fail(`P1 indicators unavailable (product degraded): ${result.p1Unavailable.join(', ')}`);
}
if (result.heldP1.length > 0) {
  fail(`P1 fetch failures held on last good values (marked stale): ${result.heldP1.join(', ')}`);
}
if (!result.ok) {
  fail('a critical write failed — snapshot/status not stored');
}
if (result.failedSources.length > 0) {
  console.warn(`\n[ingest] WARNING — failing sources: ${result.failedSources.join(', ')}`);
}
console.log(`\n[ingest] ${dryRun ? 'dry-run complete' : 'run complete'} — P1 COMPLETE.`);
