/**
 * gf-p2-backfill.ts — the GF-P2 one-off history seeder (2026-11-05, the
 * owner's recorded answer K — the GF-S7 answer sheet, docs/specs/
 * gold-meter-gapfill/README.md; the audit report §4 row 12 / F2: "the gross
 * CFTC legs — richer than net", riding F1's backfill).
 *
 * ONE one-off `insights:hist:*` write through the Cloudflare REST API (the
 * gf-p1-backfill / nbs-backfill Path-B pattern; the PRODUCTION parse — the
 * venue cannot drift):
 *
 *  - **cftc-gold-gross-long (F2, the REAL OBJECT — the in-session design
 *    decision under the standing delegation, the reason recorded in
 *    docs/specs/gold-meter-gapfill/PROGRESS.md's GF-S8 block)** — the
 *    gross noncommercial LONG share of open interest (NonComm Long ÷ OI ×
 *    100, 4dp), parsed from the SAME CFTC legacy futures-only historical
 *    archive (deacot2016..2026.zip, annual.txt) the F1 net-share backfill
 *    read — the same site, the same gold row, the same arithmetic-identity
 *    assertions. The GF-P0 recorder recorded BOTH gross legs of every one
 *    of the 565 weeks (fixtures/gf-p0-cftc-backfill.json), and the
 *    calibration measured the seat's firing statistics over exactly this
 *    series (the F2 scenario proxy computed the identical value from the
 *    identical rows — evidence/gf-p0-calibration-2026-11-05.md §5–§6).
 *    The weekly rung keeps appending both shares (the same Saturday
 *    deafut.txt fetch, zero extra subrequests); this seeds the decade base
 *    so the percentile leg works from the next Saturday rung.
 *
 * Collision policy, stated: the fresh archive fetch wins on collision
 * (mergeSeries(fetched, stored) — the same discipline the F1 net-share
 * backfill used).
 *
 * Modes:
 *   default   fetch + report only (no writes)
 *   --write   also write the `insights:hist:cftc-gold-gross-long` key via
 *             the Cloudflare REST API (idempotent — re-running re-writes
 *             the same content)
 *
 * Environment (with --write):
 *   CLOUDFLARE_API_TOKEN · CLOUDFLARE_ACCOUNT_ID · INSIGHTS_KV_NAMESPACE_ID
 *   (credentials live in the environment ONLY — never logged, never written)
 *
 * Manual:
 *   pnpm --filter @currena/insights gf-p2-backfill
 *   pnpm --filter @currena/insights gf-p2-backfill --write
 */

import { fetchCftcGoldArchiveYear } from '../src/adapters/cftc';
import { buildHistoryFile, historyToSeries } from '../src/adapters/snapshot';
import { mergeSeries } from '../src/adapters/derived';
import type { SeriesPoint } from '../src/series';
import { RestInsightsStore } from '../src/store';
import type { IndicatorId } from '@currena/core';

const args = process.argv.slice(2);
const write = args.includes('--write');

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const NAMESPACE_ID = process.env.INSIGHTS_KV_NAMESPACE_ID ?? '4627ac33a4b148ff9fc2189266b1890e';

if (write && (!API_TOKEN || !ACCOUNT_ID || !NAMESPACE_ID)) {
  console.error(
    '\n[gf-p2-backfill] FATAL: --write needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID. Nothing was written.',
  );
  process.exit(1);
}

console.log(`# GF-P2 backfill — ${new Date().toISOString()} (${write ? 'WRITE' : 'report only'})`);

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

/* ------------------------------------------------------------------ *
 * The CFTC historical archive — the production parse (D-4/F1's own
 * venue, the F2 gross-long object riding the same rows)
 * ------------------------------------------------------------------ */

const ID: IndicatorId = 'cftc-gold-gross-long';
const CFTC_YEARS: readonly number[] = Array.from({ length: 2026 - 2016 + 1 }, (_, i) => 2016 + i);
console.log('\n## cftc-gold-gross-long — the legacy futures-only archive (F2, the real object)');
const weeks: SeriesPoint[] = [];
const files: Array<{ year: number; weeks: number; bytes: number }> = [];
const failures: Array<{ year: number; error: string }> = [];
for (const year of CFTC_YEARS) {
  try {
    const file = await fetchCftcGoldArchiveYear(year);
    weeks.push(...file.weeks.map((w) => ({ date: w.date, value: w.grossLongSharePct })));
    files.push({ year, weeks: file.weeks.length, bytes: file.bytes });
    console.log(`  deacot${year}.zip: ${file.bytes} B → ${file.weeks.length} gold weeks (${file.weeks[0]!.date} → ${file.weeks.at(-1)!.date})`);
  } catch (err) {
    failures.push({ year, error: err instanceof Error ? err.message : String(err) });
    console.log(`  deacot${year}.zip: FAILED — ${failures.at(-1)!.error}`);
  }
}
if (failures.length > 0) {
  throw new Error(`[gf-p2-backfill] FATAL: ${failures.length} archive file(s) failed — nothing written (never a partial backfill).`);
}
weeks.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
for (let i = 1; i < weeks.length; i++) {
  if (weeks[i]!.date === weeks[i - 1]!.date) {
    throw new Error(`duplicate gold week ${weeks[i]!.date} across the archive files`);
  }
}

// The stored history (undefined when absent — a first-ever write).
const stored = await store.getHistory(ID);
const storedSeries = stored !== undefined ? historyToSeries(stored) : undefined;
const merged = storedSeries !== undefined ? mergeSeries(weeks, storedSeries) : weeks; // the fresh archive fetch wins on collision
assertAscending(merged, ID);
const history = buildHistoryFile(ID, merged);
if (history === undefined) throw new Error(`${ID}: the merged series produced no history file (too short?)`);

const row = {
  id: ID,
  stored: storedSeries?.length ?? 0,
  fetched: weeks.length,
  merged: history.points.length,
  firstDate: new Date(history.points[0]![0] * 86_400_000).toISOString().slice(0, 10),
  lastDate: new Date(history.points.at(-1)![0] * 86_400_000).toISOString().slice(0, 10),
};

if (write) {
  await store.putHistory(history);
  console.log(`  ✍ insights:hist:${ID} — ${history.points.length} points written`);
} else {
  console.log(`  · ${ID}: ${row.stored} stored ∪ ${row.fetched} fetched → ${row.merged} points (report only)`);
}

/* ------------------------------------------------------------------ *
 * The report
 * ------------------------------------------------------------------ */

console.log('\n## The GF-P2 backfill report');
console.log(
  `  ${row.id.padEnd(24)} stored ${String(row.stored).padStart(5)} · fetched ${String(row.fetched).padStart(5)} → ${String(row.merged).padStart(5)} pts` +
    ` (${row.firstDate} → ${row.lastDate}) ${write ? '✍ WRITTEN' : '· report only'} — F2: ${files.length} archive files, the gross-long share over the same gold rows the F1 backfill read`,
);
if (!write) {
  console.log('\nReport only — re-run with --write to write the history key.');
  console.log('The reading heals on its own cadence: the gross-long seat joins the Saturday rung (until');
  console.log('then the D-18 rule renders it honestly unread — the same live shape as the net seat at GF-P1).');
}
