/**
 * gold-premium-run.ts — GPE R30 / F3b (2026-11-19): Bridge-2's manual
 * runner / KV seeder (the gold-expectations-run twin). TWO modes:
 *
 *   default        the rung twin — read the live `snapshot:tgju` KV entry
 *                  (the R13 plane, via the KV REST API), compute the day
 *                  row, upsert write-if-changed. The post-deploy landing
 *                  lever (a fresh deploy's key keeps its days; this mode
 *                  lands today's row immediately, exactly the
 *                  gold-expectations-run discipline).
 *
 *   --backfill     THE ONE-TIME BACKFILL (s8/01 R30 · s1/11 §6 item 2 ·
 *                  s4/03 §1e the verified route): fetch the four TGJU
 *                  profile-history pages SEQUENTIALLY (the off-hours
 *                  discipline), parse the 30 daily rows each, inner-join,
 *                  COMPUTE the premium history from the legs' own closes,
 *                  and MERGE into the store (backfill provenance — a live
 *                  row of the same date is never overwritten, S16-D2).
 *
 *   --dry-run      fetch + report only — no KV writes (works for both modes).
 *
 * Environment (writes; not needed with --dry-run):
 *   CLOUDFLARE_API_TOKEN · CLOUDFLARE_ACCOUNT_ID · INSIGHTS_KV_NAMESPACE_ID
 *
 * Manual:
 *   pnpm --filter @currena/insights gold-premium-run --dry-run --backfill
 *   pnpm --filter @currena/insights gold-premium-run --backfill
 *   pnpm --filter @currena/insights gold-premium-run
 */

import type { GoldPremiumHistorySnapshot } from '@currena/core';
import { fetchTgjuProfileHistory, tgjuProfileHistoryUrl } from '@currena/scraper';
import {
  RestGoldPremiumStore,
  assembleGoldPremiumHistory,
  buildPremiumBackfill,
  mergeDays,
  runGoldPremiumHistoryIngest,
  premiumSeries,
} from '../src/domains/gold/premium-history';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const backfill = args.includes('--backfill');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;

if (!dryRun && (!apiToken || !accountId || !namespaceId)) {
  console.error(
    '\n[gold-premium-run] FATAL: a real run needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID (or pass --dry-run).',
  );
  process.exit(1);
}

const store = dryRun
  ? {
      getGoldPremiumHistory: async (): Promise<GoldPremiumHistorySnapshot | undefined> => undefined,
      writeGoldPremiumHistory: async (): Promise<void> => undefined,
      readTgjuSnapshot: async (): Promise<undefined> => undefined,
    }
  : new RestGoldPremiumStore({ apiToken: apiToken!, accountId: accountId!, namespaceId: namespaceId! });

const now = new Date();

function report(snapshot: GoldPremiumHistorySnapshot): void {
  const emami = premiumSeries(snapshot.days, 'coin-emami');
  const last = emami[emami.length - 1];
  const first = emami[0];
  console.log(
    `[gold-premium-run]   ${snapshot.days.length} days ${first?.date} → ${snapshot.asOf}` +
      ` · Emami premium ${last ? `${last.premiumPct.toFixed(2)}%` : '—'} (${snapshot.days[snapshot.days.length - 1]?.source})` +
      (snapshot.backfill !== undefined
        ? ` · backfill ${snapshot.backfill.from} → ${snapshot.backfill.to} (${snapshot.backfill.days} days)`
        : '') +
      (dryRun ? ' · DRY RUN (nothing written)' : ' · in KV'),
  );
}

if (backfill) {
  // THE ONE-TIME BACKFILL — the four pages, SEQUENTIAL (never concurrent —
  // the off-hours one-time discipline, s4/04 §2a).
  console.log('[gold-premium-run] backfill mode — fetching the four profile-history pages sequentially…');
  try {
    const legsBySlug: Record<'sekee' | 'sekeb' | 'ons' | 'price_dollar_rl', Awaited<ReturnType<typeof fetchTgjuProfileHistory>>> = {
      sekee: [],
      sekeb: [],
      ons: [],
      price_dollar_rl: [],
    };
    for (const slug of ['sekee', 'sekeb', 'ons', 'price_dollar_rl'] as const) {
      const rows = await fetchTgjuProfileHistory(slug, { timeoutMs: 20_000 });
      legsBySlug[slug] = rows;
      console.log(`[gold-premium-run]   ${slug}: ${rows.length} rows ${rows[rows.length - 1]?.date} → ${rows[0]?.date}`);
    }
    const built = buildPremiumBackfill(
      { emami: legsBySlug.sekee, bahar: legsBySlug.sekeb, ounce: legsBySlug.ons, dollar: legsBySlug.price_dollar_rl },
      now,
      tgjuProfileHistoryUrl('sekee'),
    );
    if (built === null) {
      console.error('[gold-premium-run] FAILED — the four legs inner-join to fewer than 2 common days (upstream shape change?).');
      process.exit(1);
    }
    const stored = dryRun ? undefined : await store.getGoldPremiumHistory();
    const merged = mergeDays(stored?.days, built.days);
    const next = assembleGoldPremiumHistory(merged.days, now, stored?.backfill ?? built.info);
    if (next === null) {
      console.error('[gold-premium-run] FAILED — merged days below the 2-day floor.');
      process.exit(1);
    }
    console.log(
      `[gold-premium-run] backfill computed: ${built.info.days} common days ${built.info.from} → ${built.info.to}` +
        ` (merge ${merged.changed ? 'CHANGED' : 'no change'} → ${next.days.length} days total)`,
    );
    report(next);
    if (!dryRun) {
      await store.writeGoldPremiumHistory(next);
      console.log('[gold-premium-run] OK — backfill merged + written.');
    }
    process.exit(0);
  } catch (err) {
    console.error(`[gold-premium-run] FAILED — ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

// DEFAULT — the rung twin: the live day row over the R13 snapshot plane.
const job = await runGoldPremiumHistoryIngest(store, {
  getSnapshot: async () => store.readTgjuSnapshot(),
  now,
});
if (job.outcome.ok) {
  console.log(`[gold-premium-run] OK — ${job.outcome.note ?? 'done'}`);
  if (job.snapshot !== undefined) report(job.snapshot);
  process.exit(0);
}
console.error(`[gold-premium-run] FAILED (${job.outcome.kind}) — ${job.outcome.note}`);
process.exit(1);
