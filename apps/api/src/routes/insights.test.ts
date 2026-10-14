import type { IndicatorReading, InsightsSnapshot, InsightsStatus, IndicatorHistory, IndicatorId, LivePriceEntry, LivePricesSnapshot } from '@currena/core';
import { InMemoryInsightsStore } from '@currena/insights/store';
import { InMemoryPricesStore } from '@currena/insights/prices';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp, type Bindings } from '../index';

/* Contract-valid fixtures (the runner's exact output shapes). */
const reading = (id: IndicatorId, status: IndicatorReading['status'] = 'normal'): IndicatorReading => ({
  id,
  value: status === 'unavailable' ? null : 3.9,
  asOf: status === 'unavailable' ? null : '2026-10-06',
  status,
  sourceName: 'FRED (DGS10)',
  sourceUrl: 'https://fred.stlouisfed.org/series/DGS10',
  updatedAt: '2026-10-07T04:20:00.000Z',
});

const snapshot: InsightsSnapshot = {
  generatedAt: '2026-10-07T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'cautious', warningCount: 3, votingCount: 11, excludedCount: 1 },
    australia: { section: 'australia', label: 'relaxed', warningCount: 0, votingCount: 6, excludedCount: 2 },
  },
  readings: [reading('us10y'), reading('rba-cash-rate')],
  changedThisWeek: [{ id: 'us10y', from: 'normal', to: 'warning', asOf: '2026-10-05' }],
  calendar: [{ id: 'rba-2026-11', date: '2026-11-03', titleEn: 'RBA meeting', titleFa: 'جلسه RBA', kind: 'rba' }],
};

const history: IndicatorHistory = { v: 1, id: 'us10y', points: [[19723, 3.88], [19730, 3.97]] };

const status: InsightsStatus = {
  v: 1,
  generatedAt: '2026-10-07T04:21:00.000Z',
  mode: 'scheduled',
  dryRun: false,
  sources: [{ source: 'fred', ok: true, detail: '10/10 series' }],
};

const env: Bindings = {
  RATES: { get: async () => null } as unknown as KVNamespace,
};

describe('GET /api/insights (injected in-memory store)', () => {
  let store: InMemoryInsightsStore;

  beforeEach(() => {
    store = new InMemoryInsightsStore();
  });

  function makeApp() {
    return createApp({
      makeInsightsReader: () => store,
    });
  }

  it('serves the stored snapshot with ETag + short public cache', async () => {
    await store.putSnapshot(snapshot);
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights:2026-10-07T04:20:00.000Z+prices:none"');
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
    expect(await res.json()).toEqual(snapshot);
  });

  it('answers 304 on a matching If-None-Match', async () => {
    await store.putSnapshot(snapshot);
    const res = await makeApp().request('/api/insights', {
      headers: { 'if-none-match': '"insights:2026-10-07T04:20:00.000Z+prices:none"' },
    }, env);
    expect(res.status).toBe(304);
  });

  it('answers 503 insights_not_ready (RatesError envelope) before the first run', async () => {
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('insights_not_ready');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('carries the standard security headers (shared middleware)', async () => {
    await store.putSnapshot(snapshot);
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });
});

describe('GET /api/insights/:id/history', () => {
  let store: InMemoryInsightsStore;

  beforeEach(() => {
    store = new InMemoryInsightsStore();
  });

  function makeApp() {
    return createApp({ makeInsightsReader: () => store });
  }

  it('serves a stored history file with a content-addressed ETag', async () => {
    await store.putHistory(history);
    const res = await makeApp().request('/api/insights/us10y/history', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
    expect(res.headers.get('etag')).toBe('"insights-hist:us10y:2:19730"');
    expect(await res.json()).toEqual(history);
  });

  it('answers 304 on a matching If-None-Match', async () => {
    await store.putHistory(history);
    const res = await makeApp().request('/api/insights/us10y/history', {
      headers: { 'if-none-match': '"insights-hist:us10y:2:19730"' },
    }, env);
    expect(res.status).toBe(304);
  });

  it('rejects unknown indicator ids with 400 invalid_indicator', async () => {
    // 'vix' joined the indicator set in Step 2 — an actually-unknown id rejects.
    const res = await makeApp().request('/api/insights/cape/history', undefined, env);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('invalid_indicator');
  });

  it('answers an honest 404 for a known id with no stored history (single-point card)', async () => {
    const res = await makeApp().request('/api/insights/gold-btc/history', undefined, env);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('history_not_found');
  });
});

/* ------------------------------------------------------------------ *
 * Live-prices overlay (2026-10-12 — the volatility refresh)
 * ------------------------------------------------------------------ */

const liveEntry = (value: number, overrides: Partial<LivePriceEntry> = {}): LivePriceEntry => ({
  value,
  asOf: '2026-10-12',
  change7d: -4.35,
  change30d: 5.0,
  sourceSymbol: 'BZ=F',
  updatedAt: '2026-10-12T12:13:00.000Z',
  ...overrides,
});

describe('GET /api/insights — live-prices merge', () => {
  let insightsStore: InMemoryInsightsStore;
  let pricesStore: InMemoryPricesStore;

  beforeEach(() => {
    insightsStore = new InMemoryInsightsStore();
    pricesStore = new InMemoryPricesStore();
  });

  /** The stale-oil fixture: brent 125.44 @ 2026-10-06 in the EOD snapshot. */
  const staleOilSnapshot: InsightsSnapshot = {
    ...snapshot,
    readings: [reading('brent'), reading('us10y')],
  };

  function makeApp() {
    return createApp({
      makeInsightsReader: () => insightsStore,
      makePricesReader: () => pricesStore,
    });
  }

  it('merges a fresher live quote over the EOD reading (the stale-oil fix)', async () => {
    await insightsStore.putSnapshot(staleOilSnapshot);
    await pricesStore.putLivePricesIfChanged({
      v: 1,
      generatedAt: '2026-10-12T12:13:00.000Z',
      assets: { brent: liveEntry(107.14) },
    });
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as InsightsSnapshot;
    const brent = body.readings.find((r) => r.id === 'brent')!;
    expect(brent.value).toBe(107.14);
    expect(brent.asOf).toBe('2026-10-12');
    expect(brent.sourceName).toContain('Yahoo Finance');
    expect(brent.updatedAt).toBe('2026-10-12T12:13:00.000Z');
    // The other reading is untouched.
    expect(body.readings.find((r) => r.id === 'us10y')!.value).toBe(3.9);
  });

  it('the ETag covers BOTH generations — a new hourly quote busts caches', async () => {
    await insightsStore.putSnapshot(staleOilSnapshot);
    await pricesStore.putLivePricesIfChanged({
      v: 1,
      generatedAt: '2026-10-12T12:13:00.000Z',
      assets: { brent: liveEntry(107.14) },
    });
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.headers.get('etag')).toBe('"insights:2026-10-07T04:20:00.000Z+prices:2026-10-12T12:13:00.000Z"');
    const revalidate = await makeApp().request('/api/insights', {
      headers: { 'if-none-match': '"insights:2026-10-07T04:20:00.000Z+prices:2026-10-12T12:13:00.000Z"' },
    }, env);
    expect(revalidate.status).toBe(304);
    // The next hourly rung writes a new generation → the old ETag no longer matches.
    await pricesStore.putLivePricesIfChanged({
      v: 1,
      generatedAt: '2026-10-12T13:13:00.000Z',
      assets: { brent: liveEntry(107.9) },
    });
    const fresh = await makeApp().request('/api/insights', {
      headers: { 'if-none-match': '"insights:2026-10-07T04:20:00.000Z+prices:2026-10-12T12:13:00.000Z"' },
    }, env);
    expect(fresh.status).toBe(200);
  });

  it('a poisoned live-prices key degrades calmly to the plain EOD snapshot', async () => {
    await insightsStore.putSnapshot(staleOilSnapshot);
    const poisoned = {
      getLivePrices: async (): Promise<LivePricesSnapshot | undefined> => {
        throw new Error('KV unreachable');
      },
    };
    const app = createApp({ makeInsightsReader: () => insightsStore, makePricesReader: () => poisoned });
    const res = await app.request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights:2026-10-07T04:20:00.000Z+prices:none"');
    expect(await res.json()).toEqual(staleOilSnapshot);
  });

  it('an empty live key serves the plain snapshot (prices:none)', async () => {
    await insightsStore.putSnapshot(staleOilSnapshot);
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights:2026-10-07T04:20:00.000Z+prices:none"');
    expect(await res.json()).toEqual(staleOilSnapshot);
  });

  it('an older live quote never rewinds a fresher EOD reading', async () => {
    await insightsStore.putSnapshot({
      ...snapshot,
      readings: [reading('brent'), reading('us10y')],
    });
    await pricesStore.putLivePricesIfChanged({
      v: 1,
      generatedAt: '2026-10-12T12:13:00.000Z',
      assets: { brent: liveEntry(120, { asOf: '2026-10-05' }) },
    });
    const res = await makeApp().request('/api/insights', undefined, env);
    const body = (await res.json()) as InsightsSnapshot;
    expect(body.readings.find((r) => r.id === 'brent')!.value).toBe(3.9); // the EOD reading untouched
    // The stored quotes' generation still rides the ETag (the key exists).
    expect(res.headers.get('etag')).toContain('prices:2026-10-12T12:13:00.000Z');
  });
});

describe('admin console insights card', () => {
  // The /admin route itself is covered by admin.test.ts as a pure renderer;
  // here we verify the render includes the freshness rows when the status
  // key exists (the integration point added in Phase I3).
  it('renderAdminPage shows the Insights section with per-source rows when status exists', async () => {
    const { renderAdminPage } = await import('../admin');
    const html = renderAdminPage({
      report: {
        now: '2026-10-07T06:00:00.000Z',
        sources: [
          {
            source: 'tgju',
            status: { source: 'tgju', lastScrapeAt: '2026-10-07T05:59:00.000Z', lastSuccessAt: '2026-10-07T05:59:00.000Z', lastDurationMs: 120 },
            cache: { present: true, fetchedAt: '2026-10-07T05:59:00.000Z', ageSec: 60, fresh: false },
          },
        ],
      },
      snapshots: {},
      insights: status,
      now: new Date('2026-10-07T06:00:00.000Z'),
    });
    expect(html).toContain('>Insights <span class="pill ok">healthy</span>');
    expect(html).toContain('fred');
    expect(html).toContain('10/10 series');
    expect(html).toContain('/api/insights');
  });

  it('omits the Insights section entirely before the first ingestion run', async () => {
    const { renderAdminPage } = await import('../admin');
    const html = renderAdminPage({
      report: {
        now: '2026-10-07T06:00:00.000Z',
        sources: [
          {
            source: 'tgju',
            status: { source: 'tgju', lastScrapeAt: '2026-10-07T05:59:00.000Z', lastSuccessAt: '2026-10-07T05:59:00.000Z', lastDurationMs: 120 },
            cache: { present: true, fetchedAt: '2026-10-07T05:59:00.000Z', ageSec: 60, fresh: false },
          },
        ],
      },
      snapshots: {},
      now: new Date('2026-10-07T06:00:00.000Z'),
    });
    expect(html).not.toContain('<h2>Insights');
  });
});

/* ------------------------------------------------------------------ *
 * World stock markets route (insights-world-markets-spec.md §4/§9 step 4)
 * ------------------------------------------------------------------ */

import { InMemoryMarketsStore } from '@currena/insights/markets';
import {
  buildMarketsSnapshot,
  runMarketsJob,
} from '@currena/insights/markets';
import type { MarketsSnapshot } from '@currena/core';

/** A REAL-shaped snapshot: the full 16-market pipeline over synthetic series. */
async function realisticSnapshot(): Promise<MarketsSnapshot> {
  const job = await runMarketsJob(
    {
      fetchEodhd: async (id) => {
        const points: { date: string; value: number }[] = [];
        let t = new Date('2026-10-09T00:00:00Z').getTime();
        let made = 0;
        while (made < 260) {
          const date = new Date(t).toISOString().slice(0, 10);
          const dow = new Date(t).getUTCDay();
          if (dow !== 0 && dow !== 6) {
            points.push({ date, value: 20000 + made * 7 + (made % 5) });
            made++;
          }
          t -= 86_400_000;
        }
        points.reverse();
        return { id, source: 'eodhd', points };
      },
      fetchYahoo: async () => {
        throw new Error('yahoo not needed in this fixture');
      },
    },
    { kind: 'main', providerOrder: 'eodhd-first' },
    undefined,
    '2026-10-12',
  );
  const snap = buildMarketsSnapshot({
    resolutions: job.resolutions,
    prev: undefined,
    runDate: '2026-10-12',
    generatedAt: '2026-10-12T23:31:00Z',
  });
  if (snap === undefined) throw new Error('fixture snapshot failed to build');
  return snap;
}

describe('GET /api/insights/markets', () => {
  let store: InMemoryMarketsStore;

  beforeEach(() => {
    store = new InMemoryMarketsStore();
  });

  function makeApp() {
    return createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeMarketsReader: () => store,
    });
  }

  it('serves the stored snapshot with ETag + the spec §4 rule 5 cache headers', async () => {
    const snap = await realisticSnapshot();
    await store.putMarketsIfChanged(snap);
    const res = await makeApp().request('/api/insights/markets', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights-markets:2026-10-12T23:31:00Z"');
    expect(res.headers.get('cache-control')).toBe('public, max-age=300, s-maxage=300');
    expect(await res.json()).toEqual(snap);
  });

  it('answers 304 on a matching If-None-Match', async () => {
    const snap = await realisticSnapshot();
    await store.putMarketsIfChanged(snap);
    const res = await makeApp().request(
      '/api/insights/markets',
      { headers: { 'if-none-match': '"insights-markets:2026-10-12T23:31:00Z"' } },
      env,
    );
    expect(res.status).toBe(304);
  });

  it('answers 503 markets_not_ready (calm, no-store) when KV is empty', async () => {
    const res = await makeApp().request('/api/insights/markets', undefined, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('markets_not_ready');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('keeps the full 16-market response under the 12 KB budget (spec §9 step 4)', async () => {
    const snap = await realisticSnapshot();
    expect(snap.markets.length).toBe(16);
    expect(snap.markets.every((m) => m.weekly.length === 52)).toBe(true);
    const bytes = JSON.stringify(snap).length;
    expect(bytes).toBeLessThan(12 * 1024);
  });

  it('one KV read per request (the store counts its own ops)', async () => {
    const snap = await realisticSnapshot();
    await store.putMarketsIfChanged(snap);
    const readsBefore = store.ops.reads;
    await makeApp().request('/api/insights/markets', undefined, env);
    expect(store.ops.reads - readsBefore).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * World currencies route (insights-world-currencies-spec.md §5 rules
 * 3–4 / §9 build step 6)
 * ------------------------------------------------------------------ */

import { runFxJob } from '@currena/insights/fx';
import { InMemoryFxStore } from '@currena/insights/fx';
import type { FxJobFetchers } from '@currena/insights/fx';
import type { FxSnapshot } from '@currena/core';

/** A REAL-shaped fx snapshot: the full 10-pair pipeline over a synthetic
 * ECB world (8 currencies × 420 working days, gentle drift). */
async function realisticFxSnapshot(): Promise<FxSnapshot> {
  const base: Record<string, number> = {
    EUR: 0.9, JPY: 150, GBP: 0.76, CHF: 0.88, CNY: 7.1, AUD: 1.52, CAD: 1.37, SEK: 9.5,
  };
  const dates: string[] = [];
  let t = new Date('2026-10-12T00:00:00Z').getTime();
  while (dates.length < 420) {
    const date = new Date(t).toISOString().slice(0, 10);
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) dates.push(date);
    t -= 86_400_000;
  }
  dates.reverse();
  const quotes: Record<string, { date: string; value: number }[]> = Object.fromEntries(
    Object.entries(base).map(([code, start]) => [
      code,
      dates.map((date, i) => ({ date, value: start * (1.0002) ** i })),
    ]),
  );
  const fetchers: FxJobFetchers = {
    fetchFrankfurter: async () => ({ source: 'frankfurter', quotes: quotes as never }),
    fetchYahoo: async () => {
      throw new Error('yahoo not needed in this fixture');
    },
  };
  const cross = {
    getMarkets: async () => undefined,
    getGoldHistory: async () => undefined,
    getInsightsSnapshot: async () => undefined,
  };
  const job = await runFxJob(fetchers, undefined, cross, '2026-10-13', '2026-10-13T17:01:00Z');
  if (job.snapshot === undefined) throw new Error('fixture fx snapshot failed to build');
  return job.snapshot;
}

describe('GET /api/insights/fx', () => {
  let store: InMemoryFxStore;

  beforeEach(() => {
    store = new InMemoryFxStore();
  });

  function makeApp() {
    return createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeFxReader: () => store,
    });
  }

  it('serves the stored snapshot with ETag + the spec §5 rule 4 cache headers', async () => {
    const snap = await realisticFxSnapshot();
    await store.putFxIfChanged(snap);
    const res = await makeApp().request('/api/insights/fx', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights-fx:2026-10-13T17:01:00Z"');
    expect(res.headers.get('cache-control')).toBe('public, max-age=300, s-maxage=300');
    expect(await res.json()).toEqual(snap);
  });

  it('answers 304 on a matching If-None-Match', async () => {
    const snap = await realisticFxSnapshot();
    await store.putFxIfChanged(snap);
    const res = await makeApp().request(
      '/api/insights/fx',
      { headers: { 'if-none-match': '"insights-fx:2026-10-13T17:01:00Z"' } },
      env,
    );
    expect(res.status).toBe(304);
  });

  it('answers 503 fx_not_ready (calm, no-store) when KV is empty', async () => {
    const res = await makeApp().request('/api/insights/fx', undefined, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('fx_not_ready');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('keeps the full 10-pair response under the 20 KB budget (spec §5 rule 5)', async () => {
    const snap = await realisticFxSnapshot();
    expect(snap.pairs.length).toBe(10);
    const bytes = JSON.stringify(snap).length;
    expect(bytes).toBeLessThan(20 * 1024);
  });

  it('one KV read per request (the store counts its own ops)', async () => {
    const snap = await realisticFxSnapshot();
    await store.putFxIfChanged(snap);
    const readsBefore = store.ops.reads;
    await makeApp().request('/api/insights/fx', undefined, env);
    expect(store.ops.reads - readsBefore).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * KV-failure honesty (QA audit A-2): a reader rejection surfaces as   *
 * the calm 503 with a distinct machine code — never a raw 500         *
 * internal_error. (The prices-reader twin was already covered.)       *
 * ------------------------------------------------------------------ */

describe('KV-failure honesty (audit A-2 — reader throws, route stays calm)', () => {
  const kvFailure = new Error('KV unavailable');

  it('GET /api/insights → 503 insights_unavailable (no-store) when the reader rejects', async () => {
    const app = createApp({
      makeInsightsReader: () => ({
        getSnapshot: () => Promise.reject(kvFailure),
        getHistory: () => Promise.reject(kvFailure),
        getStatus: () => Promise.reject(kvFailure),
      }),
    });
    const res = await app.request('/api/insights', undefined, env);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('insights_unavailable');
    expect(body.error.message).toContain('temporarily unavailable');
  });

  it('GET /api/insights/markets → 503 markets_unavailable when the reader rejects', async () => {
    const app = createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeMarketsReader: () => ({ getMarkets: () => Promise.reject(kvFailure) }),
    });
    const res = await app.request('/api/insights/markets', undefined, env);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('markets_unavailable');
  });

  it('GET /api/insights/fx → 503 fx_unavailable when the reader rejects', async () => {
    const app = createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeFxReader: () => ({ getFx: () => Promise.reject(kvFailure) }),
    });
    const res = await app.request('/api/insights/fx', undefined, env);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('fx_unavailable');
  });

  it('GET /api/insights/:id/history → 503 indicator_history_unavailable when the reader rejects', async () => {
    const app = createApp({
      makeInsightsReader: () => ({
        getSnapshot: () => Promise.resolve(undefined),
        getHistory: () => Promise.reject(kvFailure),
        getStatus: () => Promise.resolve(undefined),
      }),
    });
    const res = await app.request('/api/insights/us10y/history', undefined, env);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('indicator_history_unavailable');
  });

  it('a KV failure on the MARKETS reader must not take down /api/insights (route isolation)', async () => {
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = createApp({
      makeInsightsReader: () => store,
      makeMarketsReader: () => ({ getMarkets: () => Promise.reject(kvFailure) }),
    });
    const res = await app.request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(snapshot);
  });
});
