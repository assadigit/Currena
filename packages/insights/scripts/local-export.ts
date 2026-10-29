/**
 * local-export — the PREVIEW data generator (2026-10-29): runs the REAL
 * pipelines (insights ingest + world markets + world currencies + live
 * prices) against the live providers and writes their outputs to JSON
 * files under data/local-preview/, so the Next.js preview host can serve
 * the SPA with fresh, honest data through its own tiny data service.
 *
 * MANUAL, like live-run: it hits live sites by design, writes NOTHING to
 * production KV, and never touches the EODHD key (the markets job runs
 * YAHOO-FIRST — the owner's free-plan quota belongs to production).
 *
 * Files written (all under data/local-preview/):
 *   insights.json      the PRIVATE snapshot, live prices MERGED (the serve
 *                      path of GET /api/insights in private mode)
 *   status.json        the ingest status document
 *   markets.json       the world-markets snapshot (Yahoo legs)
 *   fx.json            the world-currencies snapshot
 *   histories/<id>.json  every indicator history (GET /api/insights/:id/history)
 *
 * Run: pnpm --filter @currena/insights local-export
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import type {
  IndicatorHistory,
  IndicatorId,
  InsightsSnapshot,
  InsightsStatus,
  MarketsSnapshot,
  FxSnapshot,
} from '@currena/core';

import { runInsightsUpdate, writeAllHistoriesInline } from '../src/ingest/run';
import { HIDDEN_PUBLIC_IDS } from '../src/ingest/data';
import { collectRung2Sources, rung2FetchPlanFor, RUNG2_IDS } from '../src/adapters/rung2';
import type { InsightsStore } from '../src/store';
import type { SeriesPoint } from '../src/series';
import type { IndicatorId as Id } from '@currena/core';

import { runMarketsUpdate } from '../src/markets/run';
import { defaultFetchers as defaultMarketsFetchers } from '../src/markets/job';
import type { MarketsReader, MarketsWriter } from '../src/markets/store';

import { runFxUpdate } from '../src/fx/run';
import { defaultFxFetchers } from '../src/fx/job';
import type { FxReader, FxWriter, FxCrossReader } from '../src/fx/store';

import { runPricesUpdate } from '../src/prices/job';
import { defaultPricesFetchers } from '../src/prices/job';
import { mergeLivePricesIntoSnapshot } from '../src/prices/merge';
import type { PricesReader, PricesWriter } from '../src/prices/store';
import type { LivePricesSnapshot } from '@currena/core';

const OUT_DIR = new URL('../../../data/local-preview/', import.meta.url).pathname;

function readJson<T>(file: string): T | undefined {
  const p = join(OUT_DIR, file);
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as T;
  } catch {
    return undefined;
  }
}

function writeJson(file: string, value: unknown): void {
  writeFileSync(join(OUT_DIR, file), `${JSON.stringify(value)}\n`);
}

/* ------------------------------------------------------------------ *
 * File-backed stores
 * ------------------------------------------------------------------ */

/** The insights store: snapshot + status + histories as files (archives and
 * the public projection are no-ops — the preview serves the private view). */
function makeFileInsightsStore(): InsightsStore {
  return {
    async getSnapshot() {
      return readJson<InsightsSnapshot>('insights-private.json');
    },
    async putSnapshot(snapshot: InsightsSnapshot) {
      writeJson('insights-private.json', snapshot);
    },
    async getHistory(id: IndicatorId) {
      return readJson<IndicatorHistory>(`histories/${id}.json`);
    },
    async putHistory(history: IndicatorHistory) {
      writeJson(`histories/${history.id}.json`, history);
    },
    async getStatus() {
      return readJson<InsightsStatus>('status-raw.json');
    },
    async putStatus(status: InsightsStatus) {
      writeJson('status-raw.json', status);
    },
    async getArchive() {
      return undefined; // the preview keeps no dated archives
    },
    async getPublicSnapshot() {
      return undefined; // the preview serves the private family
    },
    async getPublicArchive() {
      return undefined;
    },
    async putArchive() {
      /* the preview keeps no dated archives */
    },
    async putPublicSnapshot() {
      /* the preview serves the private family */
    },
    async putPublicArchive() {
      /* the preview keeps no dated archives */
    },
  } as unknown as InsightsStore;
}

function makeFileMarketsStore(): MarketsReader & MarketsWriter {
  let prev: MarketsSnapshot | undefined;
  return {
    async getMarkets() {
      prev = readJson<MarketsSnapshot>('markets.json');
      return prev;
    },
    async putMarketsIfChanged(next) {
      // Always write (the file IS the store; no KV budget to protect).
      writeJson('markets.json', next);
      return 'written';
    },
  };
}

function makeFileFxStore(): FxReader & FxWriter {
  return {
    async getFx() {
      return readJson<FxSnapshot>('fx.json');
    },
    async putFxIfChanged(next) {
      writeJson('fx.json', next);
      return 'written';
    },
  } as FxReader & FxWriter;
}

function makeFilePricesStore(): PricesReader & PricesWriter {
  return {
    async getLivePrices() {
      return readJson<LivePricesSnapshot>('prices.json');
    },
    async putLivePricesIfChanged(next) {
      writeJson('prices.json', next);
      return 'written';
    },
  } as PricesReader & PricesWriter;
}

/* ------------------------------------------------------------------ *
 * The run
 * ------------------------------------------------------------------ */

mkdirSync(join(OUT_DIR, 'histories'), { recursive: true });
const startedAt = Date.now();

/* 1 — the insights ingest (collect → derive → validate → write), with the
 * rung-2 feeds collected inline (the Node venue pattern from ingest.ts). */
console.log('[local-export] phase 1 — insights ingest…');

const store = makeFileInsightsStore();
const rung2Missing = new Set<string>();
for (const id of RUNG2_IDS) {
  if (store.getHistory === undefined || (await store.getHistory(id as Id)) === undefined) {
    rung2Missing.add(id);
  }
}
const rung2Plan = rung2FetchPlanFor(new Date(), rung2Missing);
console.log(`[local-export] rung-2 inline plan — mof=${rung2Plan.mof} eiaWeekly=${rung2Plan.eiaWeekly} cftcWeekly=${rung2Plan.cftcWeekly} monthly=${rung2Plan.monthly}`);
const rung2 = await collectRung2Sources(rung2Plan);
for (const row of rung2.reports) console.log(`  ${row.ok ? 'OK' : 'FAIL'} ${row.source} — ${row.detail}`);
const rung2Series = rung2.series as Partial<Record<IndicatorId, SeriesPoint[]>>;

const ingest = await runInsightsUpdate({
  store,
  mode: 'manual',
  // The build sandbox's egress is Akamai-403'd on the RBA CSV table paths
  // (docs/insights/03-data-sources.md) — the HTML cash-rate page remains.
  skipRbaCsvTables: true,
  hiddenPublicIds: HIDDEN_PUBLIC_IDS,
  rung2Series,
});
console.log(
  `[local-export] ingest — ok=${ingest.ok} readings=${ingest.snapshot?.readings.length ?? 0} p1Unavailable=[${ingest.p1Unavailable.join(',')}] heldP1=[${ingest.heldP1.join(',')}] failedSources=[${ingest.failedSources.join(',')}]`,
);

/* The inline history writes (the Node venue twin). */
const mergedSeries: Record<string, SeriesPoint[]> = {
  ...Object.fromEntries(Object.entries(rung2Series).filter(([, v]) => v !== undefined)),
  ...ingest.series,
};
const histWrite = await writeAllHistoriesInline(store, mergedSeries);
console.log(`[local-export] histories — written=${histWrite.written} failed=${histWrite.failed}`);

/* 2 — world markets (YAHOO-FIRST: the owner's EODHD free-plan quota
 * belongs to production; the preview must never spend it). */
console.log('[local-export] phase 2 — world markets (yahoo-first)…');
const marketsResult = await runMarketsUpdate(
  { store: makeFileMarketsStore(), fetchers: defaultMarketsFetchers({ apiToken: 'unused-yahoo-first' }) },
  'main',
  { providerOrder: 'yahoo-first' },
);
console.log(`[local-export] markets — wrote=${marketsResult.wroteSnapshot} rows=${marketsResult.snapshot?.markets.length ?? 0} providers=${JSON.stringify(marketsResult.providerCalls)}`);

/* 3 — world currencies (Frankfurter primary, Yahoo fallback). */
console.log('[local-export] phase 3 — world currencies…');
const crossReader: FxCrossReader = {
  async getMarkets() {
    return readJson<MarketsSnapshot>('markets.json');
  },
  async getGoldHistory() {
    return readJson<IndicatorHistory>('histories/gold-usd.json');
  },
  async getInsightsSnapshot() {
    return readJson<InsightsSnapshot>('insights-private.json');
  },
};
const fxResult = await runFxUpdate({ store: makeFileFxStore(), fetchers: defaultFxFetchers(), cross: crossReader });
console.log(`[local-export] fx — wrote=${fxResult.wroteSnapshot} pairs=${fxResult.snapshot?.pairs.length ?? 0} nothing=${fxResult.nothingToStore}`);

/* 4 — live prices (Yahoo only) + the serve-time merge (the private-mode
 * GET /api/insights path). */
console.log('[local-export] phase 4 — live prices…');
const pricesStore = makeFilePricesStore();
const pricesResult = await runPricesUpdate({ store: pricesStore, fetchers: defaultPricesFetchers() });
console.log(`[local-export] prices — wrote=${pricesResult.wroteSnapshot} unchanged=${pricesResult.unchanged} assets=${Object.keys(pricesResult.snapshot?.assets ?? {}).length}`);
for (const row of pricesResult.reports) console.log(`  ${row.assetId}: ${row.outcome}${row.note !== undefined ? ` — ${row.note}` : ''}`);

const live = await pricesStore.getLivePrices();
const base = readJson<InsightsSnapshot>('insights-private.json');
if (base !== undefined) {
  const served = live !== undefined ? mergeLivePricesIntoSnapshot(base, live) : base;
  writeJson('insights.json', served);
  const brent = served.readings.find((r) => r.id === 'brent');
  const aed = served.readings.find((r) => r.id === 'usdaed');
  console.log(`[local-export] served snapshot — brent=${brent?.value ?? '—'} (${brent?.sourceName ?? '—'}) usdaed=${aed?.value ?? '—'} (${aed?.status})`);
}

console.log(`[local-export] done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s — files in data/local-preview/`);
