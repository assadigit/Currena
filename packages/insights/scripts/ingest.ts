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
import { collectRung2Sources, rung2FetchPlanFor, RUNG2_IDS } from '../src/adapters/rung2';
import { collectRung4Sources } from '../src/adapters/rung4';
import { collectCreditSources } from '../src/adapters/credit';
import { collectTreasuryAuctions } from '../src/adapters/auctions';
import type { IndicatorId } from '@currena/core';
import type { SeriesPoint } from '../src/series';

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

/* ------------------------------------------------------------------ *
 * The run (the shared orchestration — collect, derive, validate, write)
 * ------------------------------------------------------------------ */

// 2026-10-26b (the reconciliation round): the dry-run uses a REAL READ-ONLY
// store whenever the credentials exist — the stored-history legs (the NBS
// seed∪stored∪fetched union, the Treasury fallback fills) must read the
// true KV state or the dry-run misreports what the next rung will build
// ("stored accumulation empty" while the KV carries 41/30-point histories,
// held cards as unavailable). Only a credential-less dry-run falls back to
// the no-op store.
const store = apiToken && accountId && namespaceId
  ? new RestInsightsStore({ apiToken, accountId, namespaceId })
  : undefined;
if (!dryRun && store === undefined) {
  fail(
    'missing environment — a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run)',
  );
}

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


/* ------------------------------------------------------------------ *
 * The inline rung-2 collection (2026-10-26 gap-audit build) - the Node
 * venue has no subrequest ceiling, so the MOF/weekly/monthly feeds ride
 * THIS run directly (one snapshot, no patching): the same collect the
 * Worker's 04:20 phase performs, shared code. The plan is date-gated with
 * the same bootstrap rule (anything missing from the store fetches now).
 * ------------------------------------------------------------------ */

const rung2Missing = new Set<string>();
if (store !== undefined) {
  for (const id of RUNG2_IDS) {
    try {
      const stored = await store.getHistory(id);
      if (stored === undefined) rung2Missing.add(id);
    } catch {
      rung2Missing.add(id); // a poisoned key counts as missing (bootstrap)
    }
  }
} else {
  for (const id of RUNG2_IDS) rung2Missing.add(id);
}
const rung2Plan = rung2FetchPlanFor(new Date(), rung2Missing);
console.log(
  `[ingest] rung-2 inline plan - mof=${rung2Plan.mof} eiaWeekly=${rung2Plan.eiaWeekly} cftcWeekly=${rung2Plan.cftcWeekly} monthly=${rung2Plan.monthly}`,
);
const rung2 = await collectRung2Sources(rung2Plan);
for (const row of rung2.reports) console.log(`  ${row.ok ? 'OK' : 'FAIL'} ${row.source} - ${row.detail}`);
const rung2Series = rung2.series as Partial<Record<IndicatorId, SeriesPoint[]>>;

/* ------------------------------------------------------------------ *
 * The inline rung-4 collection (gap-closure S3-M3.2, 2026-11-01) — the
 * S3 FRED liquidity/funding/macro groups. fred.stlouisfed.org serves
 * GHA egress fine (the main rung's groups already ride this venue); the
 * Worker's 04:35 phase performs the same collect (shared code), so the
 * venues cannot drift apart. IORB arrives future-trimmed.
 * ------------------------------------------------------------------ */

const rung4 = await collectRung4Sources();
for (const row of rung4.reports) console.log(`  ${row.ok ? 'OK' : 'FAIL'} ${row.source} - ${row.detail}`);
const rung4Series = rung4.fred;

/* ------------------------------------------------------------------
 * The inline credit collection (gap-closure S3-M3.3, 2026-11-01) — the
 * Fed Board EBP file + the OFR FSI file. Both hosts serve GHA egress
 * fine (the S1-M1.1 probe: ~270 ms / ~1.2 s); the Worker's 04:35 phases
 * perform the same collect per file (shared code), so the venues cannot
 * drift apart.
 * ------------------------------------------------------------------ */

const credit = await collectCreditSources();
for (const row of credit.reports) console.log(`  ${row.ok ? 'OK' : 'FAIL'} ${row.source} - ${row.detail}`);

/* ------------------------------------------------------------------
 * The inline Treasury-auction collection (gap-closure S3-M3.5,
 * 2026-11-01) — the FiscalData auctions_query families.
 * api.fiscaldata.treasury.gov is BLOCKED from Worker egress (timeout ×3
 * in the S1-M1.1 probe while a normal client gets 200 in <1 s), so THIS
 * venue is the families' ONLY production fetcher — the RBA precedent.
 * The Worker's rungs never fetch this host; the ids ride RUNG4_IDS (the
 * main rung carries them until this venue's build writes them).
 * ------------------------------------------------------------------ */

const auctions = await collectTreasuryAuctions();
for (const row of auctions.reports) console.log(`  ${row.ok ? 'OK' : 'FAIL'} ${row.source} - ${row.detail}`);

const result = await runInsightsUpdate({
  // A dry-run without credentials takes the no-op store: runInsightsUpdate
  // skips every write when dryRun is set, and only the real store's READS
  // (previous snapshot, stored histories) matter for fidelity.
  store: store ?? ({ getSnapshot: async () => undefined, getHistory: async () => undefined } as never),
  mode,
  ...(skipRbaCsvTables !== undefined ? { skipRbaCsvTables: true } : {}),
  dryRun,
  ...(copyTexts.length > 0 ? { copyTexts } : {}),
  hiddenPublicIds: HIDDEN_PUBLIC_IDS,
  // The inline rung-2 series (the 04:20 phase's twin; the mirror arms
  // itself inside when the MOF fetch failed).
  rung2Series,
  // gap-closure S3-M3.2: the inline rung-4 series (the 04:35 phase's
  // twin — the S3 FRED groups; one build derives everything on Node).
  rung4Series,
  // gap-closure S3-M3.3: the inline credit files (the 04:35 phases'
  // twin — the EBP + OFR FSI pair, fail-soft per file).
  creditSeries: credit.series,
  // gap-closure S3-M3.5: the inline Treasury-auction families (the
  // families' ONLY venue — the Worker cannot reach the host; fail-soft:
  // a failed fetch omits the four series and the readings carry).
  auctionsSeries: auctions.series,
});

/* ------------------------------------------------------------------ *
 * The Node venue's inline history writes (read-compared, no staging)
 * ------------------------------------------------------------------ */

if (!dryRun) {
  // The rung-2 series join the inline history writes (the main build's
  // series map already carries them when the inline collection ran).
  const mergedSeries: Record<string, SeriesPoint[]> = {
    ...Object.fromEntries(Object.entries(rung2Series).filter(([, v]) => v !== undefined)),
    ...result.series,
  };
  const history = await writeAllHistoriesInline(store!, mergedSeries);
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
