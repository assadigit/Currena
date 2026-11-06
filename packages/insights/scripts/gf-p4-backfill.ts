/**
 * gf-p4-backfill.ts — the GF-S10 one-off Shanghai-premium history seeder
 * (2026-11-06, the remaining P3 sources — the audit report §4 rank 22 /
 * F6, "the classic scarcity tell"; the rung-2 wiring persists the derived
 * premium under the D-6 merge pattern, so this seeds the base the venue
 * offers).
 *
 * ONE one-off `insights:hist:*` write through the Cloudflare REST API (the
 * gf-p1/gf-p2-backfill Path-B pattern; the SHARED PURE DERIVATION —
 * `shanghaiPremiumSeries` in adapters/derived.ts, the same function the
 * rung-2 phase and the inline build call — the venues cannot drift):
 *
 *  - **shanghai-gold-premium (F6, the context card)** — the SGE Au99.99
 *    daily closes (CNY/gram) walked page-by-page from the exchange's own
 *    daily-report archive (the venue serves ~2024-10 onward, measured live
 *    2026-11-06: the 2024-10 window serves, the 2023-10 window does not)
 *    inner-joined on common dates with the STORED legs — `insights:hist:
 *    gold-usd` (the Yahoo spot series) × `insights:hist:usdcny` (the
 *    Frankfurter ECB reference rate) ÷ 31.1034768 g/oz, in percent, 2dp.
 *
 * The pagination walk (measured live 2026-11-06): each page carries ~21
 * rows ≈ 1.4 trading days, newest first; a PAST-THE-END page serves page
 * 1's content again (no empty-page signal exists), so the walk stops on
 * the first page whose dates do not advance past everything already
 * collected. ~2 years ≈ 360-500 pages, paced 200 ms apart (the one-off
 * backfill discipline — polite to the exchange's free endpoint).
 *
 * Collision policy, stated: the fresh archive fetch wins on collision
 * (mergeSeries(fetched, stored) — the gf-p1/gf-p2-backfill discipline).
 *
 * Modes:
 *   default   fetch + report only (no writes)
 *   --write   also write the `insights:hist:shanghai-gold-premium` key via
 *             the Cloudflare REST API (idempotent — re-running re-writes
 *             the same content)
 *
 * Environment (with --write):
 *   CLOUDFLARE_API_TOKEN · CLOUDFLARE_ACCOUNT_ID · INSIGHTS_KV_NAMESPACE_ID
 *   (credentials live in the environment ONLY — never logged, never written)
 *
 * Manual:
 *   pnpm --filter @currena/insights gf-p4-backfill
 *   pnpm --filter @currena/insights gf-p4-backfill --write
 */

import { fetchSgeAu9999, SGE_AU9999, type SgeAu9999Point } from '../src/adapters/sge';
import { shanghaiPremiumSeries, mergeSeries } from '../src/adapters/derived';
import { buildHistoryFile, historyToSeries } from '../src/adapters/snapshot';
import { RestInsightsStore } from '../src/store';
import type { SeriesPoint } from '../src/series';
import type { IndicatorId } from '@currena/core';

const args = process.argv.slice(2);
const write = args.includes('--write');

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const NAMESPACE_ID = process.env.INSIGHTS_KV_NAMESPACE_ID ?? '4627ac33a4b148ff9fc2189266b1890e';

if (write && (!API_TOKEN || !ACCOUNT_ID || !NAMESPACE_ID)) {
  console.error(
    '\n[gf-p4-backfill] FATAL: --write needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID. Nothing was written.',
  );
  process.exit(1);
}

console.log(`# GF-P4 backfill — ${new Date().toISOString()} (${write ? 'WRITE' : 'report only'})`);

/** The store: REST when writing, a read-only REST view when reporting. */
const store = new RestInsightsStore({
  apiToken: API_TOKEN ?? '',
  accountId: ACCOUNT_ID ?? '',
  namespaceId: NAMESPACE_ID,
  retryDelaysMs: [],
});

/** Loud structural checks on the merged series before any write. */
function assertAscending(series: SeriesPoint[], label: string): void {
  for (let i = 1; i < series.length; i++) {
    if (series[i]!.date <= series[i - 1]!.date) {
      throw new Error(`${label}: dates not ascending at index ${i} (${series[i - 1]!.date} → ${series[i]!.date})`);
    }
    if (!Number.isFinite(series[i]!.value)) throw new Error(`${label}: non-finite value at ${series[i]!.date}`);
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ *
 * 1. The SGE Au99.99 archive walk (the venue's own daily report)
 * ------------------------------------------------------------------ */

const PREMIUM_ID: IndicatorId = 'shanghai-gold-premium';
/** The archive's measured floor: the 2024-10 window serves, 2023-10 does not. */
const ARCHIVE_START = '2024-10-01';
const ARCHIVE_END = new Date().toISOString().slice(0, 10);
/** The venue serves EMPTY tables for ranges beyond ~45 days (measured
 * live 2026-11-06) — the walk uses 31-day windows, well under the cap. */
const WINDOW_DAYS = 31;

console.log(`\n## the SGE Au99.99 archive walk (${ARCHIVE_START} → ${ARCHIVE_END}, ${WINDOW_DAYS}-day windows, page-paced 200 ms)`);
const byDate = new Map<string, number>();
let pages = 0;
let failures = 0;

/** One window's pagination: pages advance until they add no new date. */
const walkWindow = async (winStart: string, winEnd: string): Promise<void> => {
  for (let page = 1; page <= 20; page++) {
    let points: SgeAu9999Point[];
    try {
      points = await fetchSgeAu9999(winStart, winEnd, {}, page, SGE_AU9999);
    } catch (err) {
      failures++;
      console.log(`  ${winStart}→${winEnd} p=${page}: FAILED (${err instanceof Error ? err.message : String(err)}) — skipping the page`);
      return; // fail the whole window loudly in the report; never a silent hole
    }
    pages++;
    const before = byDate.size;
    for (const p of points) {
      if (!byDate.has(p.date)) byDate.set(p.date, p.close);
    }
    const advanced = byDate.size > before;
    if (!advanced) return; // the venue serves page 1's content past the end — this window is complete
  }
  throw new Error(`[gf-p4-backfill] FATAL: the window ${winStart}→${winEnd} needed >20 pages — the venue reshaped. Nothing written.`);
};

for (let winEndMs = Date.parse(ARCHIVE_END); winEndMs >= Date.parse(ARCHIVE_START); winEndMs -= WINDOW_DAYS * 86_400_000) {
  const winEnd = new Date(winEndMs).toISOString().slice(0, 10);
  const winStartMs = Math.max(Date.parse(ARCHIVE_START), winEndMs - (WINDOW_DAYS - 1) * 86_400_000);
  const winStart = new Date(winStartMs).toISOString().slice(0, 10);
  await walkWindow(winStart, winEnd);
  console.log(`  window ${winStart} → ${winEnd}: ${byDate.size} days collected (after ${pages} pages)`);
  await sleep(200);
}
if (failures > 0) {
  throw new Error(`[gf-p4-backfill] FATAL: ${failures} window fetch(es) failed — nothing written (never a partial backfill).`);
}
if (byDate.size < 200) {
  throw new Error(`[gf-p4-backfill] FATAL: only ${byDate.size} trading days collected over ${pages} pages — the venue's archive shrank or reshaped. Nothing written.`);
}
const sgeSeries: SeriesPoint[] = [...byDate.entries()]
  .map(([date, value]) => ({ date, value }))
  .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
assertAscending(sgeSeries, 'sge-au9999');
console.log(`  the walk: ${pages} pages → ${sgeSeries.length} Au99.99 trading days (${sgeSeries[0]!.date} → ${sgeSeries.at(-1)!.date})`);

/* ------------------------------------------------------------------ *
 * 2. The stored legs (the same series the rung-2 derivation joins)
 * ------------------------------------------------------------------ */

console.log('\n## the stored legs (production KV, read via the REST store)');
const goldUsdHist = await store.getHistory('gold-usd');
const usdcnyHist = await store.getHistory('usdcny');
if (goldUsdHist === undefined || usdcnyHist === undefined) {
  throw new Error('[gf-p4-backfill] FATAL: a leg history is absent from production KV (gold-usd / usdcny) — nothing written.');
}
const goldUsd = historyToSeries(goldUsdHist);
const usdCny = historyToSeries(usdcnyHist);
console.log(`  gold-usd: ${goldUsd.length} points (${goldUsd[0]!.date} → ${goldUsd.at(-1)!.date})`);
console.log(`  usdcny: ${usdCny.length} points (${usdCny[0]!.date} → ${usdCny.at(-1)!.date})`);

/* ------------------------------------------------------------------ *
 * 3. The derivation — the shared pure function (the rung-2 twin)
 * ------------------------------------------------------------------ */

const premium = shanghaiPremiumSeries(sgeSeries, goldUsd, usdCny);
if (premium.length < 200) {
  throw new Error(`[gf-p4-backfill] FATAL: only ${premium.length} premium points survived the inner join — the legs share too few dates with the SGE calendar. Nothing written.`);
}
console.log(`\n## the derivation (shanghaiPremiumSeries — the rung-2 twin): ${premium.length} premium points (${premium[0]!.date} → ${premium.at(-1)!.date})`);
console.log(`  latest: ${premium.at(-1)!.value}% @ ${premium.at(-1)!.date} · min ${Math.min(...premium.map((p) => p.value))}% · max ${Math.max(...premium.map((p) => p.value))}%`);
const minP = premium.reduce((a, b) => (b.value < a.value ? b : a));
const maxP = premium.reduce((a, b) => (b.value > a.value ? b : a));
console.log(`  extremes: min ${minP.value}% @ ${minP.date} · max ${maxP.value}% @ ${maxP.date}`);

/* ------------------------------------------------------------------ *
 * 4. The merge + the write (idempotent)
 * ------------------------------------------------------------------ */

const stored = await store.getHistory(PREMIUM_ID);
const storedSeries = stored !== undefined ? historyToSeries(stored) : undefined;
const merged = storedSeries !== undefined ? mergeSeries(premium, storedSeries) : premium; // the fresh archive fetch wins on collision
assertAscending(merged, PREMIUM_ID);
const history = buildHistoryFile(PREMIUM_ID, merged);
if (history === undefined) throw new Error(`${PREMIUM_ID}: the merged series produced no history file (too short?)`);

const row = {
  id: PREMIUM_ID,
  stored: storedSeries?.length ?? 0,
  fetched: premium.length,
  merged: history.points.length,
  firstDate: new Date(history.points[0]![0] * 86_400_000).toISOString().slice(0, 10),
  lastDate: new Date(history.points.at(-1)![0] * 86_400_000).toISOString().slice(0, 10),
};

if (write) {
  await store.putHistory(history);
  console.log(`  ✍ insights:hist:${PREMIUM_ID} — ${history.points.length} points written`);
} else {
  console.log(`  · ${PREMIUM_ID}: ${row.stored} stored ∪ ${row.fetched} fetched → ${row.merged} points (report only)`);
}

/* ------------------------------------------------------------------ *
 * The report
 * ------------------------------------------------------------------ */

console.log('\n## The GF-P4 backfill report');
console.log(
  `  ${row.id.padEnd(24)} stored ${String(row.stored).padStart(5)} · fetched ${String(row.fetched).padStart(5)} → ${String(row.merged).padStart(5)} pts` +
    ` (${row.firstDate} → ${row.lastDate}) ${write ? '✍ WRITTEN' : '· report only'} — F6: the SGE archive walk (${pages} pages, ${sgeSeries.length} Au99.99 days) × the stored legs, the shared pure derivation`,
);
if (!write) {
  console.log('\nReport only — re-run with --write to write the history key.');
  console.log('The card reads from the next rung-2 phase (the D-6 merge pattern: the stored base + the');
  console.log('fresh daily derivation, fetched-wins-on-collision).');
}
