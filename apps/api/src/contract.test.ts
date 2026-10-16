/**
 * The API↔display golden contract suite (Phase 2 — the owner's TLDR:
 * "always live, reliable, accurate").
 *
 * Three contracts in one place, so drift can never silently break the SPA:
 *
 *  1. GOLDEN BODIES — every public GET route driven through its REAL
 *     handler (injected in-memory stores, fake scrapers — no Workers, no
 *     live sites), the response body validated against THE zod contract
 *     from packages/core. If a schema changes without the route following
 *     (or vice versa), this file fails before the display ever can.
 *
 *  2. THE CACHE-CHAIN MATRIX — the exact Cache-Control + ETag + 304
 *     discipline per route, per the spec rules (world-markets §4 rule 5,
 *     world-currencies §5 rule 4 — both `max-age=300, s-maxage=300` since
 *     D-13) plus the rates/history/insights ladder. The KV-side
 *     cacheTtl-must-match-s-maxage half of the chain is pinned in
 *     adapters/insights-store.test.ts.
 *
 *  3. /api/convert AMOUNT PINNING (audit A-11) — the exotic Number()
 *     forms the validation accepts/rejects, pinned as the contract.
 */

import type { FxSnapshot, IndicatorHistory, InsightsSnapshot, LivePricesSnapshot, MarketsSnapshot, Snapshot } from '@currena/core';
import {
  FxSnapshotSchema,
  IndicatorHistorySchema,
  InsightsSnapshotSchema,
  MarketsSnapshotSchema,
  RatesResponseSchema,
} from '@currena/core';
import { InMemoryRateStore } from '@currena/scraper';
import { InMemoryInsightsStore } from '@currena/insights/store';
import { InMemoryMarketsStore } from '@currena/insights/markets';
import { InMemoryFxStore } from '@currena/insights/fx';
import { InMemoryPricesStore } from '@currena/insights/prices';
import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createApp, type Bindings } from './index';
import { INSIGHTS_SESSION_COOKIE, sessionTokenFor } from './insights-auth';
import { MetaResponseSchema } from '@currena/core';
import { RatesService } from './rates-service';

/* ------------------------------- fixtures ------------------------------- */

const T0_MS = Date.parse('2026-10-14T10:00:00.000Z');
let clockMs = T0_MS;

function tgjuSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 1 / 266_300 },
    ],
  };
}

function frankfurterSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'USD',
    source: 'frankfurter',
    fetchedAt,
    rates: [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.86678 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.74317 },
    ],
  };
}

const insightsSnapshot: InsightsSnapshot = {
  generatedAt: '2026-10-07T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'relaxed', warningCount: 0, votingCount: 2, excludedCount: 0 },
    australia: { section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 0 },
  },
  readings: [
    { id: 'us10y', value: 3.9, asOf: '2026-10-06', status: 'normal', sourceName: 'FRED (DGS10)', updatedAt: '2026-10-07T04:20:00.000Z' },
    { id: 'rba-cash-rate', value: null, asOf: null, status: 'unavailable', sourceName: 'RBA F1.1', updatedAt: '2026-10-07T04:20:00.000Z' },
  ],
  changedThisWeek: [],
  calendar: [],
};

const indicatorHistory: IndicatorHistory = { v: 1, id: 'us10y', points: [[19723, 3.88], [19730, 3.97]] };

const marketsSnapshot: MarketsSnapshot = {
  v: 1 as const,
  generatedAt: '2026-10-12T23:31:00Z',
  markets: [
    {
      id: 'sp500', asOf: '2026-10-12', close: 5000, chg1d: 0.5, chg1m: 1.2, chg3m: 3,
      high52w: 5100, low52w: 4500, fromHigh: -2, rangePos: 85, trend: 'up',
      status: 'normal', source: 'eodhd', stale: false, weekly: [[0, 4500], [7, 4600]],
    },
  ],
  summary: { count: 1, roseToday: 1, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
};

const fxSnapshot: FxSnapshot = {
  v: 1 as const,
  generatedAt: '2026-10-13T17:01:00Z',
  dollarMeasure: {
    asOf: '2026-10-13', value: 100,
    chg: { d1: 0, m1: 0, m3: 0, y1: 0 }, weekly: [[0, 100], [7, 101]],
  },
  pairs: [
    {
      id: 'eurusd', asOf: '2026-10-13', rate: 1.08,
      chg: { d1: 0.1, m1: -1, m3: -2, y1: 3 }, moveRank: 40, bigMove: false,
      source: 'frankfurter', stale: false, weekly: [[0, 1.05], [7, 1.06]],
    },
  ],
  rules: [
    {
      id: 'r1_risk_mood', outcome: 'quiet', counted: false, numbers: {}, confirmedBy: [],
      progress: 0, legs: [],
      pattern: { status: 'nodata', agreeWeeks: 0, ofWeeks: 13, weeks: [] },
      chart: { expect: 'together', series: [] },
    },
  ],
  summary: { signal: 'normal', countedWarnings: 0, headlineRule: null },
};

const livePrices: LivePricesSnapshot = {
  v: 1 as const,
  generatedAt: '2026-10-12T12:13:00Z',
  assets: {
    brent: { value: 107.5, asOf: '2026-10-12', sourceSymbol: 'BZ=F', updatedAt: '2026-10-12T12:13:00Z' },
  },
};

/* --------------------------------- app ---------------------------------- */

// SITE_MODE 'public': these payload/cache-shape tests exercise the data
// routes with the gate OFF — the gate itself is covered in insights-auth.test.ts.
const env: Bindings = {
  RATES: { get: async () => null } as unknown as KVNamespace,
  SITE_MODE: 'public',
};

/* The authed-PRIVATE venue (2026-10-19, AC-08/LR-02): the private-feed
 * payload/cache-shape tests ride a real signed cookie — public mode now
 * refuses the Yahoo-backed boards and skips the Yahoo live-prices merge. */
const PASSWORD = 'the-contract-test-password';
const authedEnv: Bindings = {
  RATES: { get: async () => null } as unknown as KVNamespace,
  INSIGHTS_PASSWORD: PASSWORD,
};
async function authedCookie(): Promise<string> {
  const { token } = await sessionTokenFor(PASSWORD, Date.now());
  return `${INSIGHTS_SESSION_COOKIE}=${token}`;
}
function authed(app: ReturnType<typeof createApp>) {
  const wrapper = new Hono<{ Bindings: Bindings }>();
  wrapper.all('*', async (c, next) => {
    c.req.raw.headers.set('cookie', await authedCookie());
    await next();
  });
  wrapper.route('/', app);
  return wrapper;
}
let store: InMemoryRateStore;
let insightsStore: InMemoryInsightsStore;
let marketsStore: InMemoryMarketsStore;
let fxStore: InMemoryFxStore;
let pricesStore: InMemoryPricesStore;

function makeApp() {
  const service = new RatesService({
    store,
    scrapers: {
      tgju: async () => tgjuSnapshot(new Date(clockMs).toISOString()),
      frankfurter: async () => frankfurterSnapshot(new Date(clockMs).toISOString()),
    },
    now: () => new Date(clockMs),
  });
  return createApp({
    makeService: () => service,
    makeInsightsReader: () => insightsStore,
    makeMarketsReader: () => marketsStore,
    makeFxReader: () => fxStore,
    makePricesReader: () => pricesStore,
    // A-8: pin the serve-time staleness clock near the fixtures' asOf
    // (markets 2026-10-12, fx 2026-10-13) so the golden bodies stay
    // deterministic regardless of the wall clock.
    now: () => new Date('2026-10-13T12:00:00Z'),
  });
}

beforeEach(() => {
  clockMs = T0_MS;
  store = new InMemoryRateStore(() => clockMs);
  insightsStore = new InMemoryInsightsStore();
  marketsStore = new InMemoryMarketsStore();
  fxStore = new InMemoryFxStore();
  pricesStore = new InMemoryPricesStore();
});

/* --------------- 1. Golden bodies vs packages/core schemas -------------- */

describe('golden bodies validate against the packages/core contracts', () => {
  it('GET /api/rates (tgju) → RatesResponseSchema', async () => {
    const res = await makeApp().request('/api/rates?source=tgju', undefined, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => RatesResponseSchema.parse(body)).not.toThrow();
  });

  it('GET /api/rates (frankfurter) → RatesResponseSchema', async () => {
    const res = await makeApp().request('/api/rates?source=frankfurter', undefined, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => RatesResponseSchema.parse(body)).not.toThrow();
  });

  it('GET /api/insights (with the live-prices overlay) → InsightsSnapshotSchema', async () => {
    await insightsStore.putSnapshot(insightsSnapshot);
    await pricesStore.putLivePricesIfChanged(livePrices);
    const res = await makeApp().request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => InsightsSnapshotSchema.parse(body)).not.toThrow();
  });

  it('GET /api/insights/markets → MarketsSnapshotSchema (authed-private: the board is licence-hidden publicly)', async () => {
    await marketsStore.putMarketsIfChanged(marketsSnapshot, undefined);
    const res = await authed(makeApp()).request('/api/insights/markets', undefined, authedEnv);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => MarketsSnapshotSchema.parse(body)).not.toThrow();
  });

  it('GET /api/insights/fx → FxSnapshotSchema (authed-private)', async () => {
    await fxStore.putFxIfChanged(fxSnapshot, undefined);
    const res = await authed(makeApp()).request('/api/insights/fx', undefined, authedEnv);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => FxSnapshotSchema.parse(body)).not.toThrow();
  });

  it('GET /api/insights/:id/history → IndicatorHistorySchema', async () => {
    await insightsStore.putHistory(indicatorHistory);
    const res = await makeApp().request('/api/insights/us10y/history', undefined, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => IndicatorHistorySchema.parse(body)).not.toThrow();
  });

  it('GET /api/meta → MetaResponseSchema (the api-side twin of the web client copy)', async () => {
    const res = await makeApp().request('/api/meta', undefined, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => MetaResponseSchema.parse(body)).not.toThrow();
  });

  it('GET /api/convert → the ConversionResult shape the SPA renders', async () => {
    const res = await makeApp().request('/api/convert?from=USD&to=EUR&amount=100', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number; rate: number; source: string; fetchedAt: string };
    expect(body.rate).toBeGreaterThan(0);
    expect(body.amount).toBeCloseTo(100 * body.rate, 6); // amount = the CONVERTED result
    expect(body.source).toBe('frankfurter');
    expect(Number.isNaN(Date.parse(body.fetchedAt))).toBe(false);
  });
});

/* --------------- 2. The cache-chain contract matrix --------------------- */

describe('cache-chain matrix (spec rules + D-13; every layer pinned)', () => {
  it('/api/rates: 200 no-store + content ETag; 304 keeps no-store + ETag; a new generation re-tags', async () => {
    const app = makeApp();
    const first = await app.request('/api/rates?source=tgju', undefined, env);
    expect(first.headers.get('cache-control')).toBe('no-store');
    const etag = first.headers.get('etag');
    expect(etag).toBe(`"tgju:${new Date(T0_MS).toISOString()}"`);

    const revalidated = await app.request('/api/rates?source=tgju', {
      headers: { 'if-none-match': etag! },
    }, env);
    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get('cache-control')).toBe('no-store');
    expect(revalidated.headers.get('etag')).toBe(etag);

    // A new scrape generation (clock + window passed) changes the ETag.
    clockMs = T0_MS + 10 * 60_000;
    const next = await app.request('/api/rates?source=tgju', undefined, env);
    expect(next.status).toBe(200);
    expect(next.headers.get('etag')).toBe(`"tgju:${new Date(clockMs).toISOString()}"`);
  });

  it('/api/history: 200 public,max-age=60 + ETag; 304 mirrors both', async () => {
    const app = makeApp();
    const first = await app.request('/api/history?source=tgju', undefined, env);
    expect(first.headers.get('cache-control')).toBe('public, max-age=60');
    const etag = first.headers.get('etag');
    const revalidated = await app.request('/api/history?source=tgju', {
      headers: { 'if-none-match': etag! },
    }, env);
    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get('cache-control')).toBe('public, max-age=60');
  });

  it('/api/meta: public,max-age=300 (static payload, no ETag needed)', async () => {
    const res = await makeApp().request('/api/meta', undefined, env);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it('/api/status and /api/health: no-store (operational surfaces)', async () => {
    const status = await makeApp().request('/api/status', undefined, env);
    expect(status.headers.get('cache-control')).toBe('no-store');
    const health = await makeApp().request('/api/health', undefined, env);
    expect(health.headers.get('cache-control')).toBe('no-store');
  });

  it('/api/insights: the AC-05 private stamp + dual-generation ETag; 304 mirrors; a new price generation re-tags (authed-private)', async () => {
    await insightsStore.putSnapshot(insightsSnapshot);
    await pricesStore.putLivePricesIfChanged(livePrices);
    const app = authed(makeApp());

    const first = await app.request('/api/insights', undefined, authedEnv);
    expect(first.headers.get('cache-control')).toBe('private, no-store');
    const etag = first.headers.get('etag');
    expect(etag).toBe('"insights:2026-10-07T04:20:00.000Z+prices:2026-10-12T12:13:00Z"');

    const revalidated = await app.request('/api/insights', {
      headers: { 'if-none-match': etag! },
    }, authedEnv);
    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get('cache-control')).toBe('private, no-store');

    // A new live-prices generation busts the cache the same way a new
    // daily snapshot does (the hourly :13 rung's visibility guarantee).
    await pricesStore.putLivePricesIfChanged({
      ...livePrices,
      generatedAt: '2026-10-12T13:13:00Z',
      assets: {
        brent: {
          value: 108.1,
          asOf: livePrices.assets.brent!.asOf,
          sourceSymbol: livePrices.assets.brent!.sourceSymbol,
          updatedAt: '2026-10-12T13:13:00Z',
        },
      },
    });
    const next = await app.request('/api/insights', undefined, authedEnv);
    expect(next.status).toBe(200);
    expect(next.headers.get('etag')).toBe('"insights:2026-10-07T04:20:00.000Z+prices:2026-10-12T13:13:00Z"');
  });

  it.each([
    { route: '/api/insights/markets', store: 'markets' },
    { route: '/api/insights/fx', store: 'fx' },
  ] as const)(
    '$route: the AC-05 private stamp + ETag on 200 AND 304 (authed-private; the boards are licence-hidden publicly)',
    async ({ route, store: which }) => {
      if (which === 'markets') await marketsStore.putMarketsIfChanged(marketsSnapshot, undefined);
      else await fxStore.putFxIfChanged(fxSnapshot, undefined);
      const app = authed(makeApp());

      const first = await app.request(route, undefined, authedEnv);
      expect(first.status).toBe(200);
      expect(first.headers.get('cache-control')).toBe('private, no-store');
      const etag = first.headers.get('etag');
      expect(etag).not.toBeNull();

      const revalidated = await app.request(route, {
        headers: { 'if-none-match': etag! },
      }, authedEnv);
      expect(revalidated.status).toBe(304);
      expect(revalidated.headers.get('cache-control')).toBe('private, no-store');
      expect(revalidated.headers.get('etag')).toBe(etag);
    },
  );

  it('/api/insights/:id/history: public,max-age=300 + ETag on 200 and 304', async () => {
    await insightsStore.putHistory(indicatorHistory);
    const app = makeApp();
    const first = await app.request('/api/insights/us10y/history', undefined, env);
    expect(first.headers.get('cache-control')).toBe('public, max-age=300');
    const etag = first.headers.get('etag');
    const revalidated = await app.request('/api/insights/us10y/history', {
      headers: { 'if-none-match': etag! },
    }, env);
    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it('every error path is no-store (400 validation + the authed 503 not-ready)', async () => {
    const app = makeApp();
    const bad = await app.request('/api/rates?source=nope', undefined, env);
    expect(bad.status).toBe(400);
    expect(bad.headers.get('cache-control')).toBe('no-store');
    const notReady = await authed(makeApp()).request('/api/insights/markets', undefined, authedEnv);
    expect(notReady.status).toBe(503);
    expect(notReady.headers.get('cache-control')).toBe('private, no-store');
  });
});

/* --------------- 3. /api/convert amount pinning (A-11) ------------------ */

describe('/api/convert amount forms (audit A-11 — pinned, not changed)', () => {
  it.each([
    { amount: '1e2', expectAmount: 100 }, // scientific notation
    { amount: '0x10', expectAmount: 16 }, // hex
    { amount: '0b101', expectAmount: 5 }, // binary
    { amount: ' 5 ', expectAmount: 5 }, // surrounding whitespace
    { amount: '1e15', expectAmount: 1e15 }, // the exact cap
  ])('$amount is ACCEPTED and converts the parsed value', async ({ amount, expectAmount }) => {
    const res = await makeApp().request(`/api/convert?from=USD&to=EUR&amount=${encodeURIComponent(amount)}`, undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number; rate: number };
    // amount = the CONVERTED result: the parsed input × the USD→EUR rate.
    expect(body.amount).toBeCloseTo(expectAmount * body.rate, 6);
  });

  it.each([
    { amount: 'Infinity' },
    { amount: 'NaN' },
    { amount: '' },
    { amount: '0' },
    { amount: '-5' },
    { amount: '1e16' }, // one past the cap
    { amount: 'abc' },
    { amount: '۵' }, // Persian digits — Number() yields NaN, honestly rejected
  ])('$amount is REJECTED with 400 invalid_amount', async ({ amount }) => {
    const res = await makeApp().request(`/api/convert?from=USD&to=EUR&amount=${encodeURIComponent(amount)}`, undefined, env);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('invalid_amount');
  });
});
