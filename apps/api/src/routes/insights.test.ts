import type { IndicatorReading, InsightsSnapshot, InsightsStatus, IndicatorHistory, IndicatorId, LivePriceEntry, LivePricesSnapshot } from '@currena/core';
import { InMemoryInsightsStore } from '@currena/insights/store';
import { InMemoryPricesStore } from '@currena/insights/prices';
import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createApp, type Bindings } from '../index';
import { INSIGHTS_SESSION_COOKIE, sessionTokenFor } from '../insights-auth';
import { KvInsightsReader } from '../adapters/insights-store';

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

// SITE_MODE 'public': these payload/cache-shape tests exercise the data
// routes with the gate OFF — the gate itself is covered in insights-auth.test.ts.
const env: Bindings = {
  RATES: { get: async () => null } as unknown as KVNamespace,
  SITE_MODE: 'public',
};

/* ------------------------------------------------------------------ *
 * The authed-PRIVATE venue (2026-10-19, AC-08/LR-02): the private-feed
 * payload/cache-shape tests ride a real signed session cookie — public
 * mode now REFUSES the fx board (404 hidden_site_mode; the markets board
 * rides the 2026-10-18b owner directive and serves publicly) and skips
 * the Yahoo live-prices merge, so the private behaviour is only
 * reachable authenticated.
 * ------------------------------------------------------------------ */
const PASSWORD = 'the-gate-test-password';
const authedEnv: Bindings = {
  RATES: { get: async () => null } as unknown as KVNamespace,
  INSIGHTS_PASSWORD: PASSWORD,
};
async function authedCookie(): Promise<string> {
  const { token } = await sessionTokenFor(PASSWORD, Date.now());
  return `${INSIGHTS_SESSION_COOKIE}=${token}`;
}
/** Wrap the app so every request carries a valid session cookie. */
function authed(app: ReturnType<typeof createApp>) {
  const wrapper = new Hono<{ Bindings: Bindings }>();
  wrapper.all('*', async (c, next) => {
    c.req.raw.headers.set('cookie', await authedCookie());
    await next();
  });
  wrapper.route('/', app);
  return wrapper;
}

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
    const res = await authed(makeApp()).request('/api/insights', undefined, authedEnv);
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
    const res = await authed(makeApp()).request('/api/insights', undefined, authedEnv);
    expect(res.headers.get('etag')).toBe('"insights:2026-10-07T04:20:00.000Z+prices:2026-10-12T12:13:00.000Z"');
    const revalidate = await authed(makeApp()).request('/api/insights', {
      headers: { 'if-none-match': '"insights:2026-10-07T04:20:00.000Z+prices:2026-10-12T12:13:00.000Z"' },
    }, authedEnv);
    expect(revalidate.status).toBe(304);
    // The next hourly rung writes a new generation → the old ETag no longer matches.
    await pricesStore.putLivePricesIfChanged({
      v: 1,
      generatedAt: '2026-10-12T13:13:00.000Z',
      assets: { brent: liveEntry(107.9) },
    });
    const fresh = await authed(makeApp()).request('/api/insights', {
      headers: { 'if-none-match': '"insights:2026-10-07T04:20:00.000Z+prices:2026-10-12T12:13:00.000Z"' },
    }, authedEnv);
    expect(fresh.status).toBe(200);
  });

  it('a poisoned live-prices key degrades calmly to the plain EOD snapshot', async () => {
    await insightsStore.putSnapshot(staleOilSnapshot);
    const poisoned = {
      getLivePrices: async (): Promise<LivePricesSnapshot | undefined> => {
        throw new Error('KV unreachable');
      },
    };
    const app = authed(createApp({ makeInsightsReader: () => insightsStore, makePricesReader: () => poisoned }));
    const res = await app.request('/api/insights', undefined, authedEnv);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights:2026-10-07T04:20:00.000Z+prices:none"');
    expect(await res.json()).toEqual(staleOilSnapshot);
  });

  it('an empty live key serves the plain snapshot (prices:none)', async () => {
    await insightsStore.putSnapshot(staleOilSnapshot);
    const res = await authed(makeApp()).request('/api/insights', undefined, authedEnv);
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
    const res = await authed(makeApp()).request('/api/insights', undefined, authedEnv);
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
      // A-8: pin the serve-time staleness clock to the fixture world's
      // "today" (asOf 2026-10-12 + 1 day = fresh) so assertions stay
      // deterministic regardless of the wall clock.
      now: () => new Date('2026-10-13T12:00:00Z'),
    });
  }

  it('serves the stored snapshot with ETag + the AC-05 private cache stamp (licence-private feed)', async () => {
    const snap = await realisticSnapshot();
    await store.putMarketsIfChanged(snap, undefined);
    const res = await authed(makeApp()).request('/api/insights/markets', undefined, authedEnv);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights-markets:2026-10-12T23:31:00Z"');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(await res.json()).toEqual(snap);
  });

  it('answers 304 on a matching If-None-Match', async () => {
    const snap = await realisticSnapshot();
    await store.putMarketsIfChanged(snap, undefined);
    const res = await authed(makeApp()).request(
      '/api/insights/markets',
      { headers: { 'if-none-match': '"insights-markets:2026-10-12T23:31:00Z"' } },
      authedEnv,
    );
    expect(res.status).toBe(304);
  });

  it('A-8: an aged stale:false row serves stale:true (serve-time re-evaluation); fresh serves byte-identical', async () => {
    // asOf 2026-10-09 rows stored with stale:false (the write-time flag
    // froze — audit A-8: both crons failing for days would age KV silently).
    const snap = await realisticSnapshot();
    expect(snap.markets.every((m) => !m.stale)).toBe(true);
    await store.putMarketsIfChanged(snap, undefined);

    // Fresh serve (now = 2026-10-13): byte-identical to the stored snapshot.
    const freshRes = await authed(makeApp()).request('/api/insights/markets', undefined, authedEnv);
    expect(freshRes.status).toBe(200);
    expect(await freshRes.text()).toBe(JSON.stringify(snap));

    // Aged serve (now = 2026-10-16: asOf + 7 days = STALE_DAYS + 2): every
    // row flips to stale:true; everything else stays byte-identical.
    const agedApp = authed(createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeMarketsReader: () => store,
      now: () => new Date('2026-10-16T12:00:00Z'),
    }));
    const agedRes = await agedApp.request('/api/insights/markets', undefined, authedEnv);
    expect(agedRes.status).toBe(200);
    const body = (await agedRes.json()) as typeof snap;
    expect(body.markets.every((m) => m.stale)).toBe(true);
    expect(body).toEqual({
      ...snap,
      markets: snap.markets.map((m) => ({ ...m, stale: true })),
    });
    // The ETag still keys on generatedAt (the stored snapshot is unchanged).
    expect(agedRes.headers.get('etag')).toBe('"insights-markets:2026-10-12T23:31:00Z"');
  });

  it('answers 503 markets_not_ready (calm, no-store) when KV is empty', async () => {
    const res = await authed(makeApp()).request('/api/insights/markets', undefined, authedEnv);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('markets_not_ready');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('keeps the full 16-market response under the 13 KB budget (spec §9 step 4; raised from 12 KB by round 46)', async () => {
    const snap = await realisticSnapshot();
    expect(snap.markets.length).toBe(16);
    expect(snap.markets.every((m) => m.weekly.length === 52)).toBe(true);
    // Round 46 (the weekly lens) adds one ~14-byte field per row. Measured
    // live after the round-46 backfill (runDate 2026-10-17): 12,225 bytes —
    // under even the old 12,288 ceiling, but with 63 bytes of slack, so any
    // future contract field or a 17th market would breach it. 13 KB restores
    // real headroom (fixture 12,370; live 12,225).
    const bytes = JSON.stringify(snap).length;
    expect(bytes).toBeLessThan(13 * 1024);
  });

  it('one KV read per request (the store counts its own ops)', async () => {
    const snap = await realisticSnapshot();
    await store.putMarketsIfChanged(snap, undefined);
    const readsBefore = store.ops.reads;
    await authed(makeApp()).request('/api/insights/markets', undefined, authedEnv);
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
      // A-8: pinned staleness clock — the fx fixtures' asOf is 2026-10-12.
      now: () => new Date('2026-10-13T12:00:00Z'),
    });
  }

  it('serves the stored snapshot with ETag + the AC-05 private cache stamp (licence-private feed)', async () => {
    const snap = await realisticFxSnapshot();
    await store.putFxIfChanged(snap, undefined);
    const res = await authed(makeApp()).request('/api/insights/fx', undefined, authedEnv);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights-fx:2026-10-13T17:01:00Z"');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(await res.json()).toEqual(snap);
  });

  it('answers 304 on a matching If-None-Match', async () => {
    const snap = await realisticFxSnapshot();
    await store.putFxIfChanged(snap, undefined);
    const res = await authed(makeApp()).request(
      '/api/insights/fx',
      { headers: { 'if-none-match': '"insights-fx:2026-10-13T17:01:00Z"' } },
      authedEnv,
    );
    expect(res.status).toBe(304);
  });

  it('A-8: an aged stale:false pair serves stale:true (serve-time re-evaluation); fresh serves byte-identical', async () => {
    // Pairs asOf 2026-10-12 stored with stale:false (write-time freeze).
    const snap = await realisticFxSnapshot();
    expect(snap.pairs.every((p) => !p.stale)).toBe(true);
    await store.putFxIfChanged(snap, undefined);

    // Fresh serve (now = 2026-10-13): byte-identical to the stored snapshot.
    const freshRes = await authed(makeApp()).request('/api/insights/fx', undefined, authedEnv);
    expect(freshRes.status).toBe(200);
    expect(await freshRes.json()).toEqual(snap);

    // Aged serve (now = 2026-10-19: asOf + 7 days = FX_STALE_DAYS + 2):
    // every pair flips to stale:true; everything else stays byte-identical
    // (the dollar measure and rules carry no stale flag by schema).
    const agedApp = authed(createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeFxReader: () => store,
      now: () => new Date('2026-10-19T12:00:00Z'),
    }));
    const agedRes = await agedApp.request('/api/insights/fx', undefined, authedEnv);
    expect(agedRes.status).toBe(200);
    const body = (await agedRes.json()) as typeof snap;
    expect(body.pairs.every((p) => p.stale)).toBe(true);
    expect(body).toEqual({
      ...snap,
      pairs: snap.pairs.map((p) => ({ ...p, stale: true })),
    });
    expect(agedRes.headers.get('etag')).toBe('"insights-fx:2026-10-13T17:01:00Z"');
  });

  it('answers 503 fx_not_ready (calm, no-store) when KV is empty', async () => {
    const res = await authed(makeApp()).request('/api/insights/fx', undefined, authedEnv);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('fx_not_ready');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('keeps the full 10-pair response under the 20 KB budget (spec §5 rule 5)', async () => {
    const snap = await realisticFxSnapshot();
    expect(snap.pairs.length).toBe(10);
    const bytes = JSON.stringify(snap).length;
    expect(bytes).toBeLessThan(20 * 1024);
  });

  it('one KV read per request (the store counts its own ops)', async () => {
    const snap = await realisticFxSnapshot();
    await store.putFxIfChanged(snap, undefined);
    const readsBefore = store.ops.reads;
    await authed(makeApp()).request('/api/insights/fx', undefined, authedEnv);
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
    const app = authed(createApp({
      makeInsightsReader: () => ({
        getSnapshot: () => Promise.reject(kvFailure),
        getHistory: () => Promise.reject(kvFailure),
        getStatus: () => Promise.reject(kvFailure),
        getArchive: () => Promise.reject(kvFailure),
        getPublicSnapshot: () => Promise.reject(kvFailure),
        getPublicArchive: () => Promise.reject(kvFailure),
      }),
    }));
    const res = await app.request('/api/insights', undefined, authedEnv);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('insights_unavailable');
    expect(body.error.message).toContain('temporarily unavailable');
  });

  it('GET /api/insights/markets → 503 markets_unavailable when the reader rejects', async () => {
    const app = authed(createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeMarketsReader: () => ({ getMarkets: () => Promise.reject(kvFailure) }),
    }));
    const res = await app.request('/api/insights/markets', undefined, authedEnv);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('markets_unavailable');
  });

  it('GET /api/insights/fx → 503 fx_unavailable when the reader rejects', async () => {
    const app = authed(createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeFxReader: () => ({ getFx: () => Promise.reject(kvFailure) }),
    }));
    const res = await app.request('/api/insights/fx', undefined, authedEnv);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('fx_unavailable');
  });

  it('GET /api/insights/:id/history → 503 indicator_history_unavailable when the reader rejects', async () => {
    const app = authed(createApp({
      makeInsightsReader: () => ({
        getSnapshot: () => Promise.resolve(undefined),
        getHistory: () => Promise.reject(kvFailure),
        getStatus: () => Promise.resolve(undefined),
        getArchive: () => Promise.resolve(undefined),
        getPublicSnapshot: () => Promise.resolve(undefined),
        getPublicArchive: () => Promise.resolve(undefined),
      }),
    }));
    const res = await app.request('/api/insights/us10y/history', undefined, authedEnv);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('indicator_history_unavailable');
  });

  it('a KV failure on the MARKETS reader must not take down /api/insights (route isolation)', async () => {
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = authed(createApp({
      makeInsightsReader: () => store,
      makeMarketsReader: () => ({ getMarkets: () => Promise.reject(kvFailure) }),
    }));
    const res = await app.request('/api/insights', undefined, authedEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(snapshot);
  });
});

/* ------------------------------------------------------------------ *
 * PUBLIC mode (2026-10-19 owner decree; AC-08 + LR-02 + T-15): the
 * licence-legal projection is served with NO cookie; the private
 * document and the Yahoo-backed boards never leak.
 * ------------------------------------------------------------------ */
describe('PUBLIC mode — the public projection serve path', () => {
  let store: InMemoryInsightsStore;
  const publicSnapshot: InsightsSnapshot = { ...snapshot, displayMode: 'public' };

  beforeEach(() => {
    store = new InMemoryInsightsStore();
  });

  /**
   * The mode contract: a PUBLIC-mode reader (KvInsightsReader with mode
   * 'public') hands the request handlers the PUBLIC projection keys. The
   * injected fake models exactly that — getSnapshot/getArchive read the
   * public keys, and the private document behind putSnapshot is invisible.
   */
  function modePublicReader() {
    return {
      getSnapshot: () => store.getPublicSnapshot(),
      getPublicSnapshot: () => store.getPublicSnapshot(),
      getHistory: (id: IndicatorId) => store.getHistory(id),
      getStatus: () => store.getStatus(),
      getArchive: (date: string) => store.getPublicArchive(date),
      getPublicArchive: (date: string) => store.getPublicArchive(date),
    };
  }

  function makeApp() {
    return createApp({ makeInsightsReader: () => modePublicReader() });
  }

  it('serves the PUBLIC keys without any cookie (gate skipped, indexable cache headers)', async () => {
    await store.putPublicSnapshot(publicSnapshot);
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
    expect(res.headers.get('x-robots-tag')).toBeNull();
    const body = (await res.json()) as InsightsSnapshot;
    expect(body.displayMode).toBe('public');
    expect(body).toEqual(publicSnapshot);
  });

  it('NEVER falls back to the private snapshot when the public key is absent (fail closed)', async () => {
    await store.putSnapshot(snapshot);
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('insights_not_ready');
  });

  it('the fx board (no owner directive) answers 404 hidden_site_mode with zero data', async () => {
    const res = await makeApp().request('/api/insights/fx', undefined, env);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('hidden_site_mode');
  });

  it('the MARKETS board serves publicly (2026-10-18b owner directive) with the standard cache stamps', async () => {
    // The generated overrides file no longer declares 'markets' hidden —
    // the owner restored the world stock exchanges on their own EODHD key.
    // Public mode serves the stored snapshot exactly like private mode;
    // only the fx board keeps its licence refusal.
    const marketsStore = new InMemoryMarketsStore();
    const snap = await realisticSnapshot();
    await marketsStore.putMarketsIfChanged(snap, undefined);
    const app = createApp({
      makeInsightsReader: () => modePublicReader(),
      makeMarketsReader: () => marketsStore,
      // A-8: pin the serve-time staleness clock to the fixture world's
      // "today" so the stale re-evaluation is deterministic.
      now: () => new Date('2026-10-13T12:00:00Z'),
    });
    const res = await app.request('/api/insights/markets', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300, s-maxage=300');
    expect(res.headers.get('etag')).toBe('"insights-markets:2026-10-12T23:31:00Z"');
    expect(await res.json()).toEqual(snap);
  });

  it("a hidden indicator's history is refused before any KV read (LR-02)", async () => {
    // vix stays licence-hidden (Cboe copyright); brent/gold-usd/silver-usd/
    // btc-usd are BACK in public mode since the 2026-10-19e owner directive.
    const res = await makeApp().request('/api/insights/vix/history', undefined, env);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('hidden_site_mode');
  });

  it("a public-ok indicator's history still serves", async () => {
    await store.putHistory(history);
    const res = await makeApp().request('/api/insights/us10y/history', undefined, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(history);
  });

  it('the live-prices key is never consulted (Yahoo quotes never merge publicly)', async () => {
    const app = createApp({
      makeInsightsReader: () => modePublicReader(),
      makePricesReader: () => ({
        getLivePrices: async (): Promise<LivePricesSnapshot | undefined> => {
          throw new Error('the public serve path must not read the Yahoo quotes key');
        },
      }),
    });
    await store.putPublicSnapshot(publicSnapshot);
    const res = await app.request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(publicSnapshot);
  });
});

describe('KvInsightsReader — mode-aware keys (2026-10-19)', () => {
  const publicSnapshot: InsightsSnapshot = { ...snapshot, displayMode: 'public' };
  const makeKv = (expectedKeys: string[], payload: InsightsSnapshot): KVNamespace =>
    ({
      get: async (key: string) => (expectedKeys.includes(key) ? JSON.stringify(payload) : null),
    }) as unknown as KVNamespace;

  it('public mode reads insights:snapshot-public + insights:archive-public:v1:<date> — the private document never leaks', async () => {
    const reader = new KvInsightsReader(
      makeKv(['insights:snapshot-public', 'insights:archive-public:v1:2026-10-07'], publicSnapshot),
      'public',
    );
    const snap = await reader.getSnapshot();
    expect(snap?.displayMode).toBe('public');
    expect(await reader.getPublicArchive('2026-10-07')).toBeDefined();
    // In public mode the private ARCHIVE key is the same public document —
    // the reader only ever hands out the projection family.
    expect(await reader.getArchive('2026-10-07')).toBeDefined();
  });

  it('private mode keeps the private keys and the public reads come back empty', async () => {
    const reader = new KvInsightsReader(makeKv(['insights:snapshot', 'insights:archive:v1:2026-10-07'], snapshot), 'private');
    expect(await reader.getSnapshot()).toBeDefined();
    expect(await reader.getArchive('2026-10-07')).toBeDefined();
    expect(await reader.getPublicSnapshot()).toBeUndefined();
  });
});
