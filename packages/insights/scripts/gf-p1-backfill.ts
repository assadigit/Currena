/**
 * gf-p1-backfill.ts — the GF-P1 one-off history seeder (2026-11-05, the
 * owner's recorded go — the GF-S7 answer sheet, docs/specs/gold-meter-gapfill/
 * README.md; the audit report §4 rows 4/5/29: D-4/F1, D-6/R10, D-5/X1).
 *
 * Three one-off `insights:hist:*` writes through the Cloudflare REST API
 * (the nbs-backfill Path-B pattern; the production parses — the venues
 * cannot drift):
 *
 *  1. **cftc-gold-positioning (D-4/F1)** — the CFTC legacy futures-only
 *     historical archive (deacot2016..2026.zip, annual.txt) parsed by the
 *     PRODUCTION adapter (fetchCftcGoldArchiveYear) — the same site the
 *     weekly deafut.txt fetch reads; 565 gold weeks were validated by the
 *     GF-P0 recorder with 0 failures and the calibration measured the
 *     seat's firing statistics over them. The weekly rung keeps appending
 *     (the stored merge already exists in run.ts); this seeds the decade
 *     base so the percentile leg works from the next Saturday rung.
 *  2. **us-japan-10y-gap (D-6/R10)** — the persisted derived history:
 *     FRED DGS10 × the MOF all-file (fetchMofJgb10y, includeHistory),
 *     inner-joined and 4dp-quantized exactly as run.ts's quantizedGap —
 *     the exact series the calibration simulated (2375 points
 *     2016-09-26 → 2026-10-30). The rung-2 phase now MERGES its derive
 *     with this accumulation (the GF-P1 run.ts repair) instead of
 *     resetting to the stage window.
 *  3. **gold-silver (D-5/X1)** — the base deepening: the free daily
 *     ratio history from Yahoo (XAU=X ÷ XAG=X, the repo's own adapter —
 *     the audit's named source, L2 owner-accepted), merged into the
 *     stored history as the DEEPENING layer (stored production values
 *     win on collision — the backfill fills the decade BEFORE the live
 *     seeds began, it never re-venues the tail; the live tail and the
 *     move leg keep ageing through the normal 04:10 build).
 *
 * Collision policies, stated: (1) and (2) merge with the FRESH FETCH
 * winning (mergeSeries(stored, fetched) — the same discipline the ingest
 * merges use); (3) merges with the STORED history winning
 * (mergeSeries(backfill, stored)) — the Yahoo layer only deepens.
 *
 * Modes:
 *   default   fetch + derive + report only (no writes)
 *   --write   also write the three `insights:hist:*` keys via the
 *             Cloudflare REST API (idempotent — re-running re-writes the
 *             same content)
 *
 * Environment (with --write):
 *   CLOUDFLARE_API_TOKEN · CLOUDFLARE_ACCOUNT_ID · INSIGHTS_KV_NAMESPACE_ID
 *   (credentials live in the environment ONLY — never logged, never written)
 *
 * Manual:
 *   pnpm --filter @currena/insights gf-p1-backfill
 *   pnpm --filter @currena/insights gf-p1-backfill --write
 */

import { fetchCftcGoldArchiveYear } from '../src/adapters/cftc';
import { fetchMofJgb10y } from '../src/adapters/mof';
import { fetchFredSeries } from '../src/adapters/fred';
import { fetchYahooQuote } from '../src/adapters/yahoo';
import { buildHistoryFile, historyToSeries } from '../src/adapters/snapshot';
import { mergeSeries } from '../src/adapters/derived';
import { combineSeries, type SeriesPoint } from '../src/series';
import { RestInsightsStore } from '../src/store';
import type { IndicatorId } from '@currena/core';

const args = process.argv.slice(2);
const write = args.includes('--write');

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const NAMESPACE_ID = process.env.INSIGHTS_KV_NAMESPACE_ID ?? '4627ac33a4b148ff9fc2189266b1890e';

if (write && (!API_TOKEN || !ACCOUNT_ID || !NAMESPACE_ID)) {
  console.error(
    '\n[gf-p1-backfill] FATAL: --write needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID. Nothing was written.',
  );
  process.exit(1);
}

console.log(`# GF-P1 backfill — ${new Date().toISOString()} (${write ? 'WRITE' : 'report only'})`);

/** The store: REST when writing, a read-only REST view when reporting. */
const store = new RestInsightsStore({
  apiToken: API_TOKEN ?? '',
  accountId: ACCOUNT_ID ?? '',
  namespaceId: NAMESPACE_ID,
  retryDelaysMs: [],
});

/** Loud structural checks on every merged series before any write. */
function assertAscending(series: SeriesPoint[], label: string): void {
  for (let i = 1; i < series.length; i++) {
    if (series[i]!.date <= series[i - 1]!.date) {
      throw new Error(`${label}: dates not ascending at index ${i} (${series[i - 1]!.date} → ${series[i]!.date})`);
    }
    if (!Number.isFinite(series[i]!.value)) throw new Error(`${label}: non-finite value at ${series[i]!.date}`);
  }
}

/** Read the stored history (undefined when absent — a first-ever write). */
async function storedOf(id: IndicatorId): Promise<SeriesPoint[] | undefined> {
  const history = await store.getHistory(id);
  return history !== undefined ? historyToSeries(history) : undefined;
}

/** One backfill's outcome row. */
interface BackfillRow {
  id: IndicatorId;
  stored: number;
  fetched: number;
  merged: number;
  firstDate: string;
  lastDate: string;
  written: boolean;
  note: string;
}

const rows: BackfillRow[] = [];

async function runOne(
  id: IndicatorId,
  fetched: SeriesPoint[],
  merge: (stored: SeriesPoint[], fetched: SeriesPoint[]) => SeriesPoint[],
  note: string,
): Promise<void> {
  const stored = await storedOf(id);
  const merged = stored !== undefined ? merge(stored, fetched) : fetched;
  assertAscending(merged, id);
  const history = buildHistoryFile(id, merged);
  if (history === undefined) throw new Error(`${id}: the merged series produced no history file (too short?)`);
  rows.push({
    id,
    stored: stored?.length ?? 0,
    fetched: fetched.length,
    merged: history.points.length,
    firstDate: history.points[0] ? new Date(history.points[0]![0] * 86_400_000).toISOString().slice(0, 10) : '—',
    lastDate: history.points.at(-1)
      ? new Date(history.points.at(-1)![0] * 86_400_000).toISOString().slice(0, 10)
      : '—',
    written: false,
    note,
  });
  if (write) {
    await store.putHistory(history);
    rows[rows.length - 1]!.written = true;
    console.log(`  ✍ insights:hist:${id} — ${history.points.length} points written`);
  } else {
    console.log(`  · ${id}: ${stored?.length ?? 0} stored ∪ ${fetched.length} fetched → ${history.points.length} points (report only)`);
  }
}

/* ------------------------------------------------------------------ *
 * 1. The CFTC historical archive (D-4/F1) — the production parse
 * ------------------------------------------------------------------ */

const CFTC_YEARS: readonly number[] = Array.from({ length: 2026 - 2016 + 1 }, (_, i) => 2016 + i);
console.log('\n## 1. cftc-gold-positioning — the legacy futures-only archive (D-4/F1)');
const cftcWeeks: SeriesPoint[] = [];
const cftcFiles: Array<{ year: number; weeks: number; bytes: number }> = [];
const cftcFailures: Array<{ year: number; error: string }> = [];
for (const year of CFTC_YEARS) {
  try {
    const file = await fetchCftcGoldArchiveYear(year);
    cftcWeeks.push(...file.weeks.map((w) => ({ date: w.date, value: w.netSharePct })));
    cftcFiles.push({ year, weeks: file.weeks.length, bytes: file.bytes });
    console.log(`  deacot${year}.zip: ${file.bytes} B → ${file.weeks.length} gold weeks (${file.weeks[0]!.date} → ${file.weeks.at(-1)!.date})`);
  } catch (err) {
    cftcFailures.push({ year, error: err instanceof Error ? err.message : String(err) });
    console.log(`  deacot${year}.zip: FAILED — ${cftcFailures.at(-1)!.error}`);
  }
}
if (cftcFailures.length > 0) {
  throw new Error(`[gf-p1-backfill] FATAL: ${cftcFailures.length} archive file(s) failed — nothing written (never a partial backfill).`);
}
cftcWeeks.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
for (let i = 1; i < cftcWeeks.length; i++) {
  if (cftcWeeks[i]!.date === cftcWeeks[i - 1]!.date) {
    throw new Error(`duplicate gold week ${cftcWeeks[i]!.date} across the archive files`);
  }
}
await runOne(
  'cftc-gold-positioning',
  cftcWeeks,
  (stored, fetched) => mergeSeries(fetched, stored), // the fresh archive fetch wins on collision
  `D-4/F1: ${cftcFiles.length} archive files, ${cftcWeeks.length} gold weeks ${cftcWeeks[0]!.date} → ${cftcWeeks.at(-1)!.date}`,
);

/* ------------------------------------------------------------------ *
 * 2. The derived US−Japan gap (D-6/R10) — the persisted history
 * ------------------------------------------------------------------ */

console.log('\n## 2. us-japan-10y-gap — the persisted derived history (D-6/R10)');
const dgs10 = await fetchFredSeries('DGS10');
const jgbAll = await fetchMofJgb10y({ includeHistory: true });
console.log(`  parents: DGS10 ${dgs10.length} pts (${dgs10[0]!.date} → ${dgs10.at(-1)!.date}) · jgb-10y ${jgbAll.length} pts (${jgbAll[0]!.date} → ${jgbAll.at(-1)!.date})`);
if (dgs10.length < 100 || jgbAll.length < 100) {
  throw new Error('[gf-p1-backfill] FATAL: a gap parent came back implausibly short — aborting (never a partial backfill).');
}
/** run.ts's quantizedGap, replicated exactly (inner join, 4dp). */
function quantizedGap(us: SeriesPoint[], jp: SeriesPoint[]): SeriesPoint[] {
  const gap = combineSeries(us, jp, (a, b) => a - b);
  const f = 10_000;
  return gap.map((p) => ({ date: p.date, value: Math.round(p.value * f) / f }));
}
const gapDerived = quantizedGap(dgs10, jgbAll);
if (gapDerived.length < 100) {
  throw new Error(`[gf-p1-backfill] FATAL: the derived gap holds only ${gapDerived.length} points — aborting.`);
}
console.log(`  derived gap: ${gapDerived.length} pts (${gapDerived[0]!.date} → ${gapDerived.at(-1)!.date})`);
await runOne(
  'us-japan-10y-gap',
  gapDerived,
  (stored, fetched) => mergeSeries(stored, fetched), // the fresh derivation wins on collision
  `D-6/R10: DGS10 × MOF all-file, inner join, 4dp — ${gapDerived.length} points`,
);

/* ------------------------------------------------------------------ *
 * 3. The gold-silver base deepening (D-5/X1) — the Yahoo daily ratio
 * ------------------------------------------------------------------ */

console.log('\n## 3. gold-silver — the daily ratio history (D-5/X1)');
const xau = await fetchYahooQuote('XAU=X', '10y');
const xag = await fetchYahooQuote('XAG=X', '10y');
console.log(`  parents: XAU=X ${xau.points.length} pts · XAG=X ${xag.points.length} pts (Yahoo, the repo's own adapter)`);
if (xau.points.length < 500 || xag.points.length < 500) {
  throw new Error('[gf-p1-backfill] FATAL: a Yahoo ratio leg came back implausibly short — aborting (never a partial backfill).');
}
const ratio = combineSeries(xau.points, xag.points, (g, s) => g / s);
if (ratio.length < 500) {
  throw new Error(`[gf-p1-backfill] FATAL: the ratio join holds only ${ratio.length} points — aborting.`);
}
console.log(`  ratio: ${ratio.length} pts (${ratio[0]!.date} → ${ratio.at(-1)!.date})`);
await runOne(
  'gold-silver',
  ratio,
  (stored, fetched) => mergeSeries(fetched, stored), // the STORED production values win — the Yahoo layer only deepens the base
  `D-5/X1: Yahoo XAU=X ÷ XAG=X, ${ratio.length} daily points (the audit's named source, L2 owner-accepted)`,
);

/* ------------------------------------------------------------------ *
 * The report
 * ------------------------------------------------------------------ */

console.log('\n## The GF-P1 backfill report');
for (const r of rows) {
  console.log(
    `  ${r.id.padEnd(24)} stored ${String(r.stored).padStart(5)} · fetched ${String(r.fetched).padStart(5)} → ${String(r.merged).padStart(5)} pts` +
      ` (${r.firstDate} → ${r.lastDate}) ${r.written ? '✍ WRITTEN' : '· report only'} — ${r.note}`,
  );
}
if (!write) {
  console.log('\nReport only — re-run with --write to write the three history keys.');
  console.log('The readings heal on their own cadences: gold-silver at the next 04:10 main build,');
  console.log('the gap at the next 04:20 MOF rung (the run.ts persistence merge), cftc at the next');
  console.log('Saturday rung (until then the D-18 rule renders the seat honestly unread).');
}
