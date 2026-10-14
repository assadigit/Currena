import type { IndicatorReading, InsightsSnapshot, LivePriceEntry, LivePricesSnapshot, PriceAssetId } from '@currena/core';
import { InsightsSnapshotSchema } from '@currena/core';
import { describe, expect, it } from 'vitest';
import { buildLivePriceEntry, round2 } from './providers';
import { withinInterval, runPricesUpdate, type PricesJobFetchers } from './job';
import {
  InMemoryPricesStore,
  livePricesContentEqual,
  parseStoredLivePrices,
  RestPricesStore,
} from './store';
import { mergeLivePricesIntoSnapshot } from './merge';
import { LIVE_PRICE_ASSETS, PRICE_ASSET_IDS } from './definitions';
import type { SeriesPoint } from '../series';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const NOW = new Date('2026-10-12T12:13:00.000Z');

/** ~35 days of Brent closes ending 2026-10-12 (the live session's bar included). */
function brentPoints(): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  // 2026-09-07 .. 2026-10-09, one point every ~2 days (weekend skipping).
  const stamps = [
    '2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14', '2026-09-16',
    '2026-09-18', '2026-09-21', '2026-09-23', '2026-09-25', '2026-09-28',
    '2026-09-30', '2026-10-02', '2026-10-05', '2026-10-07', '2026-10-09',
  ];
  stamps.forEach((date, i) => out.push({ date, value: 100 + i }));
  out.push({ date: '2026-10-12', value: 106.0 });
  return out;
}

const entry = (overrides: Partial<LivePriceEntry>): LivePriceEntry => ({
  value: 107.14,
  asOf: '2026-10-12',
  change7d: 5.2,
  change30d: 6.8,
  sourceSymbol: 'BZ=F',
  updatedAt: '2026-10-12T12:13:00.000Z',
  ...overrides,
});

function liveSnapshot(assets: Partial<Record<PriceAssetId, LivePriceEntry>>): LivePricesSnapshot {
  return { v: 1, generatedAt: '2026-10-12T12:13:00.000Z', assets: assets as Record<PriceAssetId, LivePriceEntry> };
}

const reading = (id: IndicatorReading['id'], overrides: Partial<IndicatorReading> = {}): IndicatorReading => ({
  id,
  value: 100,
  asOf: '2026-10-06',
  status: 'normal',
  sourceName: 'FRED (DGS10)',
  updatedAt: '2026-10-12T04:20:00.000Z',
  ...overrides,
});

function snapshotFixture(readings: IndicatorReading[]): InsightsSnapshot {
  return {
    generatedAt: '2026-10-12T04:20:00.000Z',
    summary: {
      global: { section: 'global', label: 'cautious', warningCount: 3, votingCount: 11, excludedCount: 1 },
      australia: { section: 'australia', label: 'relaxed', warningCount: 0, votingCount: 6, excludedCount: 2 },
    },
    readings,
    changedThisWeek: [{ id: 'us10y', from: 'normal', to: 'warning', asOf: '2026-10-05' }],
    calendar: [],
  };
}

/** The board's eight readings in their live/EOD states on 2026-10-12. */
function boardReadings(): IndicatorReading[] {
  return [
    reading('brent', { value: 125.44, status: 'warning', sourceName: 'FRED (EIA Brent)', change7d: 10.07, change30d: 22.69 }),
    reading('gold-usd', { value: 4169.8, asOf: '2026-10-12', status: 'context', sourceName: 'gold-api.com (XAU)' }),
    reading('silver-usd', { value: 60.73, asOf: '2026-10-12', status: 'context', sourceName: 'gold-api.com (XAG)' }),
    reading('btc-usd', { value: 83268.1, asOf: '2026-10-12', status: 'context', sourceName: 'gold-api.com (BTC)' }),
    reading('gold-btc', { value: 0.0501, asOf: '2026-10-12', status: 'context', sourceName: 'gold-api.com (XAU ÷ BTC)' }),
    reading('silver-btc', { value: 0.0007, asOf: '2026-10-12', status: 'context', sourceName: 'gold-api.com (XAG ÷ BTC)' }),
    reading('gold-aud', { value: 5972.82, asOf: '2026-10-12', status: 'context', sourceName: 'gold-api.com × Frankfurter (ECB)' }),
    reading('audusd', { value: 0.698129, asOf: '2026-10-09', sourceName: 'Frankfurter (ECB)' }),
    reading('us10y', { value: 5.22 }),
  ];
}

/* ------------------------------------------------------------------ *
 * providers
 * ------------------------------------------------------------------ */

describe('buildLivePriceEntry', () => {
  it('computes the 7/30-day changes from the quote series (2 dp)', () => {
    const e = buildLivePriceEntry('brent', { livePrice: 107.14, points: brentPoints() }, NOW);
    expect(e.value).toBe(107.14);
    expect(e.asOf).toBe('2026-10-12');
    expect(e.sourceSymbol).toBe('BZ=F');
    expect(e.updatedAt).toBe(NOW.toISOString());
    // 7 days back from 2026-10-12 = 2026-10-05 → nearest point 2026-10-05 (value 112).
    expect(e.change7d).toBe(round2(((107.14 - 112) / 112) * 100));
    // 30 days back = 2026-09-12 → nearest point 2026-09-11 (value 102).
    expect(e.change30d).toBe(round2(((107.14 - 102) / 102) * 100));
  });

  it('leaves changes absent when the window has no near point (honest absence)', () => {
    const short: SeriesPoint[] = [
      { date: '2026-10-11', value: 100 },
      { date: '2026-10-12', value: 101 },
    ];
    const e = buildLivePriceEntry('brent', { livePrice: 107.14, points: short }, NOW);
    expect(e.change7d).toBeUndefined();
    expect(e.change30d).toBeUndefined();
    expect(e.value).toBe(107.14);
  });

  it('throws on an empty points list and on a non-positive live price', () => {
    expect(() => buildLivePriceEntry('brent', { livePrice: 1, points: [] }, NOW)).toThrow();
    expect(() =>
      buildLivePriceEntry('brent', { livePrice: 0, points: brentPoints() }, NOW),
    ).toThrow();
  });
});

/* ------------------------------------------------------------------ *
 * job
 * ------------------------------------------------------------------ */

function fakeFetchers(map: Partial<Record<PriceAssetId, LivePriceEntry | Error>>): PricesJobFetchers & { calls: PriceAssetId[] } {
  const calls: PriceAssetId[] = [];
  return {
    calls,
    fetchAsset: async (assetId) => {
      calls.push(assetId);
      const value = map[assetId];
      if (value instanceof Error) throw value;
      if (value === undefined) throw new Error(`unexpected fetch for ${assetId}`);
      return value;
    },
  };
}

describe('runPricesUpdate', () => {
  it('first run: fetches all four assets and writes ONE snapshot', async () => {
    const store = new InMemoryPricesStore();
    const fetchers = fakeFetchers({
      brent: entry({}),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD' }),
    });
    const result = await runPricesUpdate({ store, fetchers, now: NOW });
    expect(result.wroteSnapshot).toBe(true);
    expect(result.nothingToStore).toBe(false);
    expect(Object.keys(result.snapshot!.assets)).toHaveLength(4);
    expect(store.ops.writes).toBe(1);
    expect(fetchers.calls).toEqual(PRICE_ASSET_IDS);
  });

  it('second run with identical content: no write spent (updatedAt excluded from equality)', async () => {
    const store = new InMemoryPricesStore();
    const same = {
      brent: entry({}),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD' }),
    };
    await runPricesUpdate({ store, fetchers: fakeFetchers(same), now: NOW });
    const writesAfterFirst = store.ops.writes;
    // One hour later, same prices, fresh updatedAt stamps.
    const later = new Date('2026-10-12T13:13:00.000Z');
    const sameLater = Object.fromEntries(
      Object.entries(same).map(([k, v]) => [k, { ...v, updatedAt: later.toISOString() }]),
    ) as typeof same;
    const result = await runPricesUpdate({ store, fetchers: fakeFetchers(sameLater), now: later });
    expect(result.unchanged).toBe(true);
    expect(store.ops.writes).toBe(writesAfterFirst);
  });

  it('skips assets still inside their volatility interval (no fetch)', async () => {
    const store = new InMemoryPricesStore();
    await store.putLivePricesIfChanged(liveSnapshot({
      brent: entry({ updatedAt: '2026-10-12T12:13:00.000Z' }),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD' }),
    }));
    // 30 minutes later — every entry is fresh (interval 60, slack 2).
    const fetchers = fakeFetchers({});
    const result = await runPricesUpdate({ store, fetchers, now: new Date('2026-10-12T12:43:00.000Z') });
    expect(fetchers.calls).toEqual([]);
    expect(result.reports.every((r) => r.outcome === 'skipped-fresh')).toBe(true);
    expect(result.unchanged).toBe(true);
  });

  it('re-fetches once the interval has elapsed', async () => {
    const store = new InMemoryPricesStore();
    // Brent was stored an hour ago (past its interval); the others a moment
    // ago (fresh) — only brent should hit the fetcher.
    await store.putLivePricesIfChanged(liveSnapshot({
      brent: entry({ updatedAt: '2026-10-12T11:13:00.000Z' }),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD' }),
    }));
    const fetchers = fakeFetchers({
      brent: entry({}),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD' }),
    });
    const result = await runPricesUpdate({ store, fetchers, now: new Date('2026-10-12T12:13:00.000Z') });
    expect(fetchers.calls).toEqual(['brent']);
    expect(result.reports[0]!.outcome).toBe('fetched');
  });

  it('fault isolation: a failing asset is held while the others proceed', async () => {
    const store = new InMemoryPricesStore();
    const fetchers = fakeFetchers({
      brent: new Error('[yahoo BZ=F] HTTP 429'),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD' }),
    });
    const result = await runPricesUpdate({ store, fetchers, now: NOW });
    expect(result.wroteSnapshot).toBe(true);
    expect(Object.keys(result.snapshot!.assets)).toHaveLength(3);
    expect(result.snapshot!.assets.brent).toBeUndefined();
    expect(result.reports.find((r) => r.assetId === 'brent')!.outcome).toBe('held');
    // And the report carries the failure note for the run log.
    expect(result.reports.find((r) => r.assetId === 'brent')!.note).toContain('429');
  });

  it('hold-on-failure: a stored quote survives a failed re-fetch', async () => {
    const store = new InMemoryPricesStore();
    // Stored an hour ago — every asset is past its interval, so all four are
    // re-fetched (the interval gate must not mask the failure path).
    await store.putLivePricesIfChanged(liveSnapshot({
      brent: entry({ value: 107.14, updatedAt: '2026-10-12T11:13:00.000Z' }),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F', updatedAt: '2026-10-12T11:13:00.000Z' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F', updatedAt: '2026-10-12T11:13:00.000Z' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD', updatedAt: '2026-10-12T11:13:00.000Z' }),
    }));
    const fetchers = fakeFetchers({
      brent: new Error('transport failure'),
      'gold-usd': entry({ value: 4195.0, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD' }),
    });
    const result = await runPricesUpdate({ store, fetchers, now: NOW });
    expect(result.wroteSnapshot).toBe(true);
    expect(result.snapshot!.assets.brent!.value).toBe(107.14); // held
    expect(result.snapshot!.assets['gold-usd']!.value).toBe(4195.0); // refreshed
  });

  it('all fetches failed + nothing stored → nothingToStore, zero writes', async () => {
    const store = new InMemoryPricesStore();
    const fetchers = fakeFetchers({
      brent: new Error('x'),
      'gold-usd': new Error('x'),
      'silver-usd': new Error('x'),
      'btc-usd': new Error('x'),
    });
    const result = await runPricesUpdate({ store, fetchers, now: NOW });
    expect(result.nothingToStore).toBe(true);
    expect(store.ops.writes).toBe(0);
  });

  it('a bounced KV write is non-fatal and reported as writeError', async () => {
    const backing = new InMemoryPricesStore();
    const broken = {
      getLivePrices: () => backing.getLivePrices(),
      putLivePricesIfChanged: async (): Promise<'written' | 'unchanged'> => {
        throw new Error('PUT insights:prices-live:v1 → HTTP 429: daily limit exceeded');
      },
    };
    const fetchers = fakeFetchers({
      brent: entry({}),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
      'btc-usd': entry({ value: 82510.08, sourceSymbol: 'BTC-USD' }),
    });
    const result = await runPricesUpdate({ store: broken, fetchers, now: NOW });
    expect(result.writeError).toContain('429');
    expect(result.wroteSnapshot).toBe(false);
    expect(result.snapshot).toBeDefined(); // computed — the next rung retries
  });

  it('withinInterval: 60-minute interval with 2-minute slack', () => {
    const e = entry({ updatedAt: '2026-10-12T11:14:30.000Z' });
    // 57:59 elapsed (58:00 = 60 − 2 slack, strict) → still fresh.
    expect(withinInterval(e, 'brent', new Date('2026-10-12T12:12:29.000Z'))).toBe(true);
    // 58:01 → stale, re-fetch.
    expect(withinInterval(e, 'brent', new Date('2026-10-12T12:12:31.000Z'))).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * store
 * ------------------------------------------------------------------ */

describe('store', () => {
  it('parseStoredLivePrices: poisoned JSON reads as absent', () => {
    expect(parseStoredLivePrices('{"v":1,"generatedAt":"yesterday","assets":')).toBeUndefined();
    expect(parseStoredLivePrices(null)).toBeUndefined();
    expect(parseStoredLivePrices(JSON.stringify(liveSnapshot({ brent: entry({}) })))).toBeDefined();
  });

  it('content equality ignores updatedAt/generatedAt, compares quote substance', () => {
    const a = liveSnapshot({ brent: entry({ updatedAt: '2026-10-12T11:00:00.000Z' }) });
    const b = liveSnapshot({ brent: entry({ updatedAt: '2026-10-12T12:13:00.000Z' }) });
    expect(livePricesContentEqual(a, b)).toBe(true);
    const c = liveSnapshot({ brent: entry({ value: 108 }) });
    expect(livePricesContentEqual(a, c)).toBe(false);
    const d = liveSnapshot({ brent: entry({}), 'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }) });
    expect(livePricesContentEqual(a, d)).toBe(false);
    expect(livePricesContentEqual(undefined, undefined)).toBe(true);
    expect(livePricesContentEqual(a, undefined)).toBe(false);
  });

  it('RestPricesStore: PUT bounces off the daily cap once, retries, lands', async () => {
    const calls: Array<{ method: string; body?: string }> = [];
    let putCount = 0;
    const store = new RestPricesStore({
      apiToken: 't',
      accountId: 'a',
      namespaceId: 'n',
      baseUrl: 'https://cf.test',
      retryDelaysMs: [1],
      fetchImpl: (async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ method: init?.method ?? 'GET', body: init?.body as string | undefined });
        if (init?.method === 'GET') return new Response(null, { status: 404 });
        putCount++;
        if (putCount === 1) {
          return new Response('{"errors":[{"code":10048}]}', { status: 429 });
        }
        return new Response(null, { status: 200 });
      }) as unknown as typeof fetch,
    });
    const outcome = await store.putLivePricesIfChanged(liveSnapshot({ brent: entry({}) }));
    expect(outcome).toBe('written');
    expect(store.ops.retriedWrites).toBe(1);
    expect(putCount).toBe(2);
  });

  it('RestPricesStore: a hard failure propagates (caller decides fatality)', async () => {
    const store = new RestPricesStore({
      apiToken: 't',
      accountId: 'a',
      namespaceId: 'n',
      baseUrl: 'https://cf.test',
      retryDelaysMs: [],
      fetchImpl: (async (_url: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'GET') return new Response(null, { status: 404 });
        return new Response('boom', { status: 500 });
      }) as unknown as typeof fetch,
    });
    await expect(store.putLivePricesIfChanged(liveSnapshot({ brent: entry({}) }))).rejects.toThrow('HTTP 500');
  });
});

/* ------------------------------------------------------------------ *
 * merge
 * ------------------------------------------------------------------ */

describe('mergeLivePricesIntoSnapshot', () => {
  const live = liveSnapshot({
    brent: entry({ value: 107.14, change7d: -4.35, change30d: 5.0 }),
    'gold-usd': entry({ value: 4190.6, asOf: '2026-10-12', sourceSymbol: 'GC=F' }),
    'silver-usd': entry({ value: 60.67, asOf: '2026-10-12', sourceSymbol: 'SI=F' }),
    'btc-usd': entry({ value: 82510.08, asOf: '2026-10-12', sourceSymbol: 'BTC-USD' }),
  });

  it('the stale-oil case: brent 125.44 @ 10-06 becomes 107.14 @ 10-12 with live changes', () => {
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(boardReadings()), live);
    const brent = merged.readings.find((r) => r.id === 'brent')!;
    expect(brent.value).toBe(107.14);
    expect(brent.asOf).toBe('2026-10-12');
    expect(brent.change7d).toBe(-4.35);
    expect(brent.change30d).toBe(5.0);
    expect(brent.sourceName).toContain('Yahoo Finance');
    expect(brent.updatedAt).toBe(live.generatedAt);
    // 'warning' is a voting verdict — the merge only heals freshness states.
    expect(brent.status).toBe('warning');
  });

  it('an equal-date live quote still wins (intraday freshness)', () => {
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(boardReadings()), live);
    const gold = merged.readings.find((r) => r.id === 'gold-usd')!;
    expect(gold.value).toBe(4190.6);
    expect(gold.asOf).toBe('2026-10-12');
    expect(gold.status).toBe('context');
  });

  it('status healing: stale → the row’s natural status (context for info rows, normal for voting)', () => {
    const readings = boardReadings();
    readings[0] = { ...readings[0]!, status: 'stale' }; // brent
    const goldIdx = readings.findIndex((r) => r.id === 'gold-usd');
    readings[goldIdx] = { ...readings[goldIdx]!, status: 'stale' };
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(readings), live);
    expect(merged.readings.find((r) => r.id === 'brent')!.status).toBe('normal');
    expect(merged.readings.find((r) => r.id === 'gold-usd')!.status).toBe('context');
  });

  it('status healing: an unavailable reading comes back to life (schema-consistent)', () => {
    const readings = boardReadings();
    const goldIdx = readings.findIndex((r) => r.id === 'gold-usd');
    readings[goldIdx] = { ...readings[goldIdx]!, status: 'unavailable', value: null, asOf: null };
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(readings), live);
    const gold = merged.readings.find((r) => r.id === 'gold-usd')!;
    expect(gold.value).toBe(4190.6);
    expect(gold.asOf).toBe('2026-10-12');
    expect(gold.status).toBe('context');
    // The merged snapshot stays contract-valid.
    expect(() => InsightsSnapshotSchema.parse(merged)).not.toThrow();
  });

  it('never rewinds: an older live quote does not touch a fresher reading', () => {
    const olderLive = liveSnapshot({ brent: entry({ value: 120, asOf: '2026-10-05' }) });
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(boardReadings()), olderLive);
    const brent = merged.readings.find((r) => r.id === 'brent')!;
    expect(brent.value).toBe(125.44); // untouched
    expect(brent.asOf).toBe('2026-10-06');
  });

  it('recomputes the companions from the live bases (gold-btc, silver-btc, gold-aud)', () => {
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(boardReadings()), live);
    const goldBtc = merged.readings.find((r) => r.id === 'gold-btc')!;
    expect(goldBtc.value).toBeCloseTo(4190.6 / 82510.08, 3);
    expect(goldBtc.asOf).toBe('2026-10-12');
    const silverBtc = merged.readings.find((r) => r.id === 'silver-btc')!;
    // Fix spec B-16 (2026-10-14): 6-dp precision — the inverted display
    // (₿ per oz) must match the prices shown: 0.0007353… stays precise.
    expect(silverBtc.value).toBe(Math.round((60.67 / 82510.08) * 1_000_000) / 1_000_000);
    const goldAud = merged.readings.find((r) => r.id === 'gold-aud')!;
    expect(goldAud.value).toBeCloseTo(4190.6 / 0.698129, 2);
  });

  it('a missing live base leaves the companion untouched', () => {
    const noBtc = liveSnapshot({
      brent: entry({}),
      'gold-usd': entry({ value: 4190.6, sourceSymbol: 'GC=F' }),
      'silver-usd': entry({ value: 60.67, sourceSymbol: 'SI=F' }),
    });
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(boardReadings()), noBtc);
    expect(merged.readings.find((r) => r.id === 'gold-btc')!.value).toBe(0.0501); // daily value kept
    expect(merged.readings.find((r) => r.id === 'silver-btc')!.value).toBe(0.0007);
    // gold-aud still recomputes from live gold alone.
    expect(merged.readings.find((r) => r.id === 'gold-aud')!.value).toBeCloseTo(4190.6 / 0.698129, 2);
  });

  it('an unavailable audusd leaves gold-aud untouched', () => {
    const readings = boardReadings();
    const audIdx = readings.findIndex((r) => r.id === 'audusd');
    readings[audIdx] = { ...readings[audIdx]!, status: 'unavailable', value: null, asOf: null };
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(readings), live);
    expect(merged.readings.find((r) => r.id === 'gold-aud')!.value).toBe(5972.82); // daily value kept
  });

  it('keeps the reading’s change when the live entry lacks its own (never removes information)', () => {
    const partialLive = liveSnapshot({ brent: entry({ change7d: undefined, change30d: undefined }) });
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(boardReadings()), partialLive);
    const brent = merged.readings.find((r) => r.id === 'brent')!;
    expect(brent.change7d).toBe(10.07); // the ingest’s own change kept
    expect(brent.change30d).toBe(22.69);
    expect(brent.value).toBe(107.14);
  });

  it('the summary, untouched readings, changedThisWeek and calendar stay verbatim', () => {
    const fixture = snapshotFixture(boardReadings());
    const merged = mergeLivePricesIntoSnapshot(fixture, live);
    expect(merged.summary).toEqual(fixture.summary);
    expect(merged.changedThisWeek).toEqual(fixture.changedThisWeek);
    expect(merged.calendar).toEqual(fixture.calendar);
    expect(merged.generatedAt).toBe(fixture.generatedAt);
    const us10y = merged.readings.find((r) => r.id === 'us10y')!;
    const us10yBefore = fixture.readings.find((r) => r.id === 'us10y')!;
    expect(us10y).toEqual(us10yBefore);
  });

  it('an empty live snapshot is the identity', () => {
    const fixture = snapshotFixture(boardReadings());
    expect(mergeLivePricesIntoSnapshot(fixture, undefined)).toBe(fixture);
    expect(mergeLivePricesIntoSnapshot(fixture, liveSnapshot({}))).toBe(fixture);
  });

  it('the full merged snapshot passes the contract schema', () => {
    const merged = mergeLivePricesIntoSnapshot(snapshotFixture(boardReadings()), live);
    expect(() => InsightsSnapshotSchema.parse(merged)).not.toThrow();
  });
});

/* ------------------------------------------------------------------ *
 * definitions
 * ------------------------------------------------------------------ */

describe('definitions', () => {
  it('every asset has a Yahoo symbol, an interval ≥ 30 minutes and attribution', () => {
    for (const id of PRICE_ASSET_IDS) {
      const config = LIVE_PRICE_ASSETS[id];
      expect(config.yahooSymbol.length).toBeGreaterThan(0);
      expect(config.intervalMinutes).toBeGreaterThanOrEqual(30); // "at least once a day", far above
      expect(config.sourceName.length).toBeGreaterThan(0);
      expect(config.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('the board’s four tiles are covered in render order', () => {
    expect(PRICE_ASSET_IDS).toEqual(['brent', 'gold-usd', 'silver-usd', 'btc-usd']);
  });
});
