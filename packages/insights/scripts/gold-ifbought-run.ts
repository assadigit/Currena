/**
 * gold-ifbought-run.ts — GPE R33 / F26 (2026-11-19, S17): the "if you'd
 * bought" calculator's ONE-TIME backfill runner (the gold-premium-run
 * --backfill twin).
 *
 * Reads the ingest stage blob (`insights:ingest-stage:v1` — ONE KV REST
 * read carrying the daily series) for the gold/silver/btc month-end
 * anchors since 2016-11, fetches the S&P 500's own 10-year series
 * through the markets board's OWN keyless Yahoo provider
 * (fetchYahooSeries('sp500') — range=10y&interval=1d, the chg5y
 * supplement's own polite request — ONE fetch, the world board's own
 * venue, recorded in the s17 M1 §5 reality check), seeds the running
 * month's current points from each series' own freshest close, and
 * writes the ONE key (`insights:gold-ifbought:v1`).
 *
 * MANUAL script (the gold-premium-run pattern): never part of the test
 * suite. Credentials come from the environment ONLY
 * (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID — the same names wrangler
 * uses); they are never logged, echoed or written anywhere.
 *
 * Run: pnpm --filter @currena/insights gold-ifbought-run [--dry-run]
 */

import type { GoldIfBoughtAssetSeries, GoldIfBoughtMonth, GoldIfBoughtSnapshot } from '@currena/core';
import { fromEpochDay, type SeriesPoint } from '../src/shared/series';
import { fetchYahooSeries } from '../src/domains/world-markets/markets/providers';
import { GOLD_IF_BOUGHT_KV_KEY, parseStoredGoldIfBought, type GoldIfBoughtStore } from '../src/domains/gold/if-bought';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
if (apiToken === undefined || apiToken === '' || accountId === undefined || accountId === '') {
  console.error(
    '[gold-ifbought-run] CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set (read-only KV credentials). Nothing was read or written.',
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
  const response = await fetch(`${BASE}/values/${encodeURIComponent(key)}`, { headers: authHeaders() });
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

/** The REST write-side store twin (the gold-premium-run pattern). */
const restStore: GoldIfBoughtStore = {
  async getGoldIfBought() {
    return parseStoredGoldIfBought(await kvGetValue(GOLD_IF_BOUGHT_KV_KEY));
  },
  async writeGoldIfBought(snapshot: GoldIfBoughtSnapshot) {
    await kvPutValue(GOLD_IF_BOUGHT_KV_KEY, JSON.stringify(snapshot));
  },
};

interface StageBlob {
  v: number;
  writtenAt: string;
  series: Record<string, Array<[number, number]>>;
}

const asPairs = (pairs: Array<[number, number]>): SeriesPoint[] =>
  pairs.map(([day, value]) => ({ date: fromEpochDay(day), value }));

/**
 * The month-end extraction from a daily series: the LAST point of each
 * month is that month's anchor, EXCEPT the freshest point's own month —
 * that freshest point IS the running month's current close (the 04:49
 * rung keeps it current; the month-turn freezes it as the anchor).
 */
function monthEnds(points: readonly SeriesPoint[]): { monthly: GoldIfBoughtMonth[]; current: { ym: string; close: number } } {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length === 0) throw new Error('an empty series — no month-end to extract');
  const byMonth = new Map<string, SeriesPoint>();
  for (const p of sorted) byMonth.set(p.date.slice(0, 7), p); // the LAST point of each month wins
  const yms = [...byMonth.keys()].sort();
  const runningYm = yms[yms.length - 1]!;
  const last = byMonth.get(runningYm)!;
  const monthly: GoldIfBoughtMonth[] = yms
    .filter((ym) => ym !== runningYm)
    .map((ym) => ({ ym, close: byMonth.get(ym)!.value }));
  return { monthly, current: { ym: runningYm, close: last.value } };
}

async function main(): Promise<void> {
  const startedAt = new Date();
  const fetchedAt = startedAt.toISOString();
  console.log(`[gold-ifbought-run] the calculator backfill — ${dryRun ? 'DRY RUN' : 'LIVE'} (started ${fetchedAt})`);

  // 1. The stage blob — the gold/silver/btc legs.
  const stageRaw = await kvGetValue('insights:ingest-stage:v1');
  if (stageRaw === null) {
    throw new Error('the stage blob (insights:ingest-stage:v1) is absent — nothing to backfill from');
  }
  const stage: StageBlob = JSON.parse(stageRaw);
  console.log(`[gold-ifbought-run] stage read: ${Object.keys(stage.series).length} series, writtenAt ${stage.writtenAt}`);

  const legs: Array<{ id: 'gold' | 'silver' | 'btc'; seriesId: string }> = [
    { id: 'gold', seriesId: 'gold-usd' },
    { id: 'silver', seriesId: 'silver-usd' },
    { id: 'btc', seriesId: 'btc-usd' },
  ];
  const assets: Partial<Record<'gold' | 'silver' | 'btc' | 'sp500', GoldIfBoughtAssetSeries>> = {};
  for (const leg of legs) {
    const staged = stage.series[leg.seriesId];
    if (staged === undefined || staged.length === 0) {
      throw new Error(`the stage carries no ${leg.seriesId} series — the ${leg.id} leg cannot be backfilled`);
    }
    const { monthly, current } = monthEnds(asPairs(staged));
    assets[leg.id] = { monthly, current: { ...current, updatedAt: fetchedAt } };
    console.log(`[gold-ifbought-run] ${leg.id}: ${monthly.length} month-end anchors (${monthly[0]!.ym} → ${monthly[monthly.length - 1]!.ym}) + the running ${current.ym}`);
  }

  // 2. The S&P leg — the markets board's own keyless Yahoo provider (ONE
  //    polite request; the R33 row's "all series in-repo" claim rides
  //    this venue, recorded in the s17 M1 §5 reality check).
  const sp500 = await fetchYahooSeries('sp500');
  console.log(`[gold-ifbought-run] sp500 via Yahoo (${sp500.source}): ${sp500.points.length} points, ${sp500.points[0]?.date} → ${sp500.points[sp500.points.length - 1]?.date}`);
  const spMonths = monthEnds(sp500.points);
  assets.sp500 = { monthly: spMonths.monthly, current: { ...spMonths.current, updatedAt: fetchedAt } };
  console.log(`[gold-ifbought-run] sp500: ${spMonths.monthly.length} month-end anchors + the running ${spMonths.current.ym}`);

  // 3. Assemble + validate the snapshot (the schema's own honesty rules
  //    — ascending anchors, the running month after the last anchor).
  const goldSeries = assets.gold!;
  const snapshot: GoldIfBoughtSnapshot = {
    v: 1,
    asOf: goldSeries.current.ym + '-28', // hmm — replaced below with the honest running day
    fetchedAt,
    backfill: {
      from: goldSeries.monthly[0]!.ym,
      to: goldSeries.monthly[goldSeries.monthly.length - 1]!.ym,
      months: goldSeries.monthly.length,
      sp500Source: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=10y&interval=1d',
      fetchedAt,
    },
    assets: {
      gold: goldSeries,
      silver: assets.silver!,
      btc: assets.btc!,
      sp500: assets.sp500!,
    },
  } as unknown as GoldIfBoughtSnapshot;

  // The asOf date: the freshest day the gold leg speaks (the running
  // month's own last point date from the stage — the honest stamp).
  const goldPoints = asPairs(stage.series['gold-usd']!);
  snapshot.asOf = goldPoints[goldPoints.length - 1]!.date;

  // Validate through the schema before writing (fail-closed on shape).
  const { GoldIfBoughtSnapshotSchema } = await import('@currena/core');
  const parsed = GoldIfBoughtSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    throw new Error(`the assembled if-bought snapshot failed validation: ${JSON.stringify(parsed.error.issues.slice(0, 3))}`);
  }
  const doc = parsed.data;
  console.log(
    `[gold-ifbought-run] snapshot valid — asOf ${doc.asOf}, legs: ` +
      Object.entries(doc.assets)
        .map(([id, a]) => `${id} (${a.monthly.length} anchors)`)
        .join(' · '),
  );

  if (!dryRun) {
    await restStore.writeGoldIfBought(doc);
    console.log(`[gold-ifbought-run] wrote ${GOLD_IF_BOUGHT_KV_KEY} (${JSON.stringify(doc).length} bytes)`);
  } else {
    console.log('[gold-ifbought-run] (dry-run) no write');
  }
  console.log(`[gold-ifbought-run] done in ${Math.round((Date.now() - startedAt.getTime()) / 1000)}s — the 04:49 rung takes the daily refresh from here.`);
}

main().catch((err: unknown) => {
  console.error('[gold-ifbought-run] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
