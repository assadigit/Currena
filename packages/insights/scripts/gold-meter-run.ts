/**
 * gold-meter-run.ts — GPE R31 / F12 (2026-11-19, S17): the gold meter's
 * TIME MACHINE backfill runner (the gold-premium-run --backfill twin).
 *
 * The ONE-TIME era backfill: reads the ingest stage blob
 * (`insights:ingest-stage:v1` — ONE KV REST read carrying every derived
 * series) + the per-id HISTORY fallbacks for exactly the voter ids the
 * stage lacks (the corpus-dump histFallback precedent — `ebp` rides
 * `insights:hist:ebp`, not the stage), reconstructs every meter-era grid
 * day (the gold-usd series' dates ≥ GOLD_METER_ERA_START — the backtest's
 * own windows) at the frozen clock under the THEN-CURRENT versioned voter
 * table (the dated registry), and writes the YEAR shards
 * (`insights:gold-meter-history:v1:<YYYY>`) through the KV REST API —
 * sequential, write-if-changed, a live row never overwritten by a
 * backfill row (upsertMeterRow's own rule).
 *
 * MANUAL script (the gold-premium-run pattern): never part of the test
 * suite. Credentials come from the environment ONLY
 * (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID — the same names wrangler
 * uses); they are never logged, echoed or written anywhere.
 *
 * Run: pnpm --filter @currena/insights gold-meter-run [--dry-run]
 */

import { GOLD_METER_ERA_START } from '@currena/core';
import { fromEpochDay, type SeriesPoint } from '../src/shared/series';
import { DEFINITIONS } from '../src/index';
import {
  GOLD_METER_TABLE_VERSIONS,
  meterTableFor,
  meterTableRowOf,
  reconstructMeterReadings,
  upsertMeterRow,
  goldMeterYearKey,
  type GoldMeterYearDoc,
} from '../src/domains/gold/meter-history';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
if (apiToken === undefined || apiToken === '' || accountId === undefined || accountId === '') {
  console.error(
    '[gold-meter-run] CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set (read-only KV credentials). Nothing was read or written.',
  );
  process.exit(1);
}

/** The RATES KV namespace id (apps/api/wrangler.jsonc — public config, not a secret). */
const RATES_NAMESPACE_ID = '4627ac33a4b148ff9fc2189266b1890e';

const BASE = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${RATES_NAMESPACE_ID}`;

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${apiToken}` };
}

async function kvGetValue(key: string): Promise<string | null> {
  const response = await fetch(`${BASE}/values/${encodeURIComponent(key)}`, {
    headers: authHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`KV REST read ${key} → HTTP ${response.status}`);
  }
  return response.text();
}

async function kvPutValue(key: string, value: string): Promise<void> {
  const response = await fetch(`${BASE}/values/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: value,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`KV REST write ${key} → HTTP ${response.status}: ${body.slice(0, 160)}`);
  }
}

interface StageBlob {
  v: number;
  writtenAt: string;
  series: Record<string, Array<[number, number]>>;
}

const asPairs = (pairs: Array<[number, number]>): SeriesPoint[] =>
  pairs.map(([day, value]) => ({ date: fromEpochDay(day), value }));

async function main(): Promise<void> {
  const startedAt = new Date();
  console.log(`[gold-meter-run] the meter-era backfill — ${dryRun ? 'DRY RUN' : 'LIVE'} (started ${startedAt.toISOString()})`);

  // 1. The stage blob — ONE read carrying every derived series.
  const stageRaw = await kvGetValue('insights:ingest-stage:v1');
  if (stageRaw === null) {
    throw new Error('the stage blob (insights:ingest-stage:v1) is absent — nothing to reconstruct from');
  }
  const stage: StageBlob = JSON.parse(stageRaw);
  console.log(`[gold-meter-run] stage read: ${Object.keys(stage.series).length} series, writtenAt ${stage.writtenAt}`);

  // 2. The union of every registry table's voter ids + the cross-fill legs
  //    + the gold grid series.
  const voterIds = new Set<string>();
  for (const entry of GOLD_METER_TABLE_VERSIONS) {
    for (const seat of entry.voters) voterIds.add(seat.id as string);
  }
  const neededIds = new Set<string>(voterIds);
  neededIds.add('us10y'); // the D-6 cross-fill's nominal leg (derived.ts passthrough)
  neededIds.add('breakeven-10y'); // the cross-fill's breakeven leg
  neededIds.add('gold-usd'); // the meter-era grid

  // 3. The series map — the stage first, the per-id HISTORY fallback for
  //    exactly the ids the stage lacks (the corpus-dump precedent).
  const seriesById = new Map<string, SeriesPoint[]>();
  const fallbackIds: string[] = [];
  for (const id of neededIds) {
    const staged = stage.series[id];
    if (staged !== undefined && staged.length > 0) {
      seriesById.set(id, asPairs(staged));
      continue;
    }
    const histRaw = await kvGetValue(`insights:hist:${id}`);
    if (histRaw === null) {
      console.warn(`[gold-meter-run] no series for ${id} — its seats read honestly unreadable (never a guess)`);
      continue;
    }
    try {
      const hist = JSON.parse(histRaw) as { points: Array<[number, number]> };
      seriesById.set(id, asPairs(hist.points));
      fallbackIds.push(id);
    } catch {
      console.warn(`[gold-meter-run] the history for ${id} failed to parse — its seats read honestly unreadable`);
    }
  }
  if (fallbackIds.length > 0) {
    console.log(`[gold-meter-run] history fallbacks: ${fallbackIds.join(', ')}`);
  }

  // 4. The grid — the gold series' dates ≥ the era start (the backtest's
  //    own windows), strictly ascending.
  const gold = seriesById.get('gold-usd');
  if (gold === undefined || gold.length === 0) {
    throw new Error('the gold-usd grid series is absent — the meter era cannot be reconstructed');
  }
  const grid = [...new Set(gold.map((p) => p.date))].filter((d) => d >= GOLD_METER_ERA_START).sort();
  console.log(`[gold-meter-run] the meter-era grid: ${grid.length} days, ${grid[0]} → ${grid[grid.length - 1]}`);

  // 5. The definitions map (computeReading's own inputs).
  const defsById = new Map(DEFINITIONS.map((d) => [d.id as string, d]));

  // 6. The rows — the frozen clock, no lookahead, the dated registry's
  //    then-current table per day.
  const rowsByYear = new Map<number, Array<ReturnType<typeof meterTableRowOf>>>();
  for (const day of grid) {
    const table = meterTableFor(day);
    const readings = reconstructMeterReadings(seriesById, day, table.voters, defsById);
    const row = meterTableRowOf(day, 'backfill', table.voters, table.id, readings);
    const year = Number(day.slice(0, 4));
    const list = rowsByYear.get(year) ?? [];
    list.push(row);
    rowsByYear.set(year, list);
  }

  // 7. The shard writes — sequential, merged with any stored shard (a
  //    live row never overwritten), write-if-changed.
  const fetchedAt = new Date().toISOString();
  let written = 0;
  let unchanged = 0;
  for (const year of [...rowsByYear.keys()].sort((a, b) => a - b)) {
    const rows = rowsByYear.get(year)!;
    const existingRaw = await kvGetValue(goldMeterYearKey(year));
    let base: GoldMeterYearDoc | undefined;
    if (existingRaw !== null) {
      try {
        base = JSON.parse(existingRaw);
      } catch {
        base = undefined;
      }
    }
    let doc =
      base !== undefined
        ? base
        : { v: 1 as const, year, fetchedAt, rows: [] as typeof rows };
    let changed = false;
    for (const row of rows) {
      const merged = upsertMeterRow(doc, row, fetchedAt);
      doc = merged.doc;
      if (merged.changed) changed = true;
    }
    if (!changed) {
      unchanged++;
      console.log(`[gold-meter-run] shard ${year}: no change (${rows.length} backfill rows already stored)`);
      continue;
    }
    if (!dryRun) {
      await kvPutValue(goldMeterYearKey(year), JSON.stringify(doc));
    }
    written++;
    console.log(`[gold-meter-run] shard ${year}: ${dryRun ? '(dry-run) ' : ''}wrote ${doc.rows.length} rows (${rows.length} backfill this run)`);
  }

  console.log(
    `[gold-meter-run] done in ${Math.round((Date.now() - startedAt.getTime()) / 1000)}s — ` +
      `${grid.length} era days reconstructed, ${written} shard(s) ${dryRun ? 'simulated' : 'written'}, ${unchanged} unchanged. ` +
      `The 04:47 rung takes the forward accumulation from here.`,
  );
}

main().catch((err: unknown) => {
  console.error('[gold-meter-run] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
