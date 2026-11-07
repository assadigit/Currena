/**
 * Page-division projection routes (S2, 2026-11-08) — the S2 gate's serve
 * half: "projection endpoints return complete data for every page's
 * membership".
 *
 * Route coverage: the index (shape + cache), every page's projection
 * completeness over a full snapshot, the public-projection honesty (the
 * licence-hidden quartet → absentIds), the live-prices overlay merge, the
 * fail-closed surfaces (404 unknown_page · 503 not_ready/unavailable ·
 * the private gate's 401) and the ETag/304 discipline.
 *
 * Patterns inherited from routes/insights.test.ts: in-memory stores, the
 * public-mode env (gate off — the gate itself is insights-auth.test.ts's)
 * and the authed wrapper for private-mode behaviour.
 */

import type { IndicatorId, IndicatorReading, InsightsSnapshot, LivePriceEntry, LivePricesSnapshot, PageProjection } from '@currena/core';
import { DEFINITIONS } from '@currena/insights';
import { InMemoryInsightsStore } from '@currena/insights/store';
import { InMemoryPricesStore } from '@currena/insights/prices';
import { pageHomeIds, pageReadingIds } from '@currena/insights/page-division';
import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createApp, type Bindings } from '../index';
import { INSIGHTS_SESSION_COOKIE, sessionTokenFor } from '../insights-auth';

/* Contract-valid fixtures (the runner's exact output shapes). */
const reading = (id: IndicatorId): IndicatorReading => ({
  id,
  value: 3.9,
  asOf: '2026-11-06',
  status: 'normal',
  sourceName: 'FRED (fixture)',
  sourceUrl: 'https://example.test/series',
  updatedAt: '2026-11-08T04:20:00.000Z',
});

/** The full 184-id snapshot (one reading per registry id). */
const fullSnapshot: InsightsSnapshot = {
  generatedAt: '2026-11-08T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'cautious', warningCount: 3, votingCount: 11, excludedCount: 1 },
    australia: { section: 'australia', label: 'relaxed', warningCount: 0, votingCount: 6, excludedCount: 2 },
  },
  readings: DEFINITIONS.map((d) => reading(d.id)),
  changedThisWeek: [],
  calendar: [],
};

const HIDDEN_QUARTET = ['etf-short-interest', 'official-gold-demand', 'wgc-cb-demand', 'wgc-etf-holdings'] as const;

/** The public projection's shape: the licence-hidden quartet absent + the stamp. */
const publicSnapshot: InsightsSnapshot = {
  ...fullSnapshot,
  displayMode: 'public',
  readings: fullSnapshot.readings.filter((r) => !(HIDDEN_QUARTET as readonly string[]).includes(r.id)),
};

// SITE_MODE 'public': these payload/cache-shape tests exercise the data
// routes with the gate OFF — the gate itself is covered in insights-auth.test.ts.
const env: Bindings = {
  RATES: { get: async () => null } as unknown as KVNamespace,
  SITE_MODE: 'public',
};

const PASSWORD = 'the-pages-gate-test-password';
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

describe('GET /api/insights/pages (the index)', () => {
  it('serves the 9 destinations with counts, boards and decisions, cached an hour', async () => {
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const res = await app.request('/api/insights/pages', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    const etag = res.headers.get('etag');
    expect(etag).toMatch(/^"insights-pages-index:[0-9a-f]{16}"$/);
    const body = (await res.json()) as { pages: { page: string; registryCards: number; mirrorInputs: number; boards: string[] }[] };
    expect(body.pages.map((p) => p.page)).toEqual([
      'global', 'gold', 'world-markets', 'usa', 'europe', 'asia-pacific', 'australia', 'commodities', 'currencies',
    ]);
    const byPage = Object.fromEntries(body.pages.map((p) => [p.page, p]));
    expect(byPage['global']).toMatchObject({ registryCards: 0, mirrorInputs: 52, boards: ['markets', 'fx'] });
    expect(byPage['gold']).toMatchObject({ registryCards: 14, mirrorInputs: 34, boards: [] });
    expect(byPage['usa']).toMatchObject({ registryCards: 72, mirrorInputs: 14, boards: ['markets', 'tic'] });
    expect(byPage['australia']).toMatchObject({ registryCards: 28, mirrorInputs: 5, boards: ['markets-au'] });
    expect(byPage['currencies']).toMatchObject({ registryCards: 14, mirrorInputs: 0, boards: ['fx'] });
    // 304 on a matching If-None-Match (the static index's own ETag).
    const revalidated = await app.request('/api/insights/pages', { headers: { 'if-none-match': etag ?? '' } }, env);
    expect(revalidated.status).toBe(304);
  });

  it('answers 304 with the same etag across instances (content-addressed, not random)', async () => {
    const first = await createApp({ makeInsightsReader: () => new InMemoryInsightsStore() }).request('/api/insights/pages', undefined, env);
    const second = await createApp({ makeInsightsReader: () => new InMemoryInsightsStore() }).request('/api/insights/pages', undefined, env);
    expect(second.headers.get('etag')).toBe(first.headers.get('etag'));
  });
});

describe('GET /api/insights/pages/:page — the completeness gate (full snapshot)', () => {
  let store: InMemoryInsightsStore;

  beforeEach(() => {
    store = new InMemoryInsightsStore();
  });

  function makeApp() {
    return createApp({ makeInsightsReader: () => store });
  }

  it('every one of the 9 pages returns COMPLETE data for its membership (the S2 gate)', async () => {
    await store.putSnapshot(fullSnapshot);
    for (const page of ['global', 'gold', 'world-markets', 'usa', 'europe', 'asia-pacific', 'australia', 'commodities', 'currencies'] as const) {
      const res = await makeApp().request(`/api/insights/pages/${page}`, undefined, env);
      expect(res.status, `page ${page}`).toBe(200);
      const body = (await res.json()) as PageProjection;
      expect(body.page).toBe(page);
      expect(body.readings.map((r) => r.id), `page ${page} readings`).toEqual([...pageReadingIds(page)]);
      expect(body.absentIds, `page ${page} absentIds`).toEqual([]);
      expect(body.generatedAt).toBe(fullSnapshot.generatedAt);
      expect(res.headers.get('cache-control')).toBe('public, max-age=60');
    }
  });

  it('serves gold with homes first (group order), then mirrors, then the blocked quartet', async () => {
    await store.putSnapshot(fullSnapshot);
    const res = await makeApp().request('/api/insights/pages/gold', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as PageProjection;
    expect(body.readings).toHaveLength(52);
    expect(body.readings.slice(0, 14).map((r) => r.id)).toEqual([...pageHomeIds('gold')]);
    expect(body.readings.slice(-4).map((r) => r.id).sort()).toEqual([...HIDDEN_QUARTET].sort());
  });

  it('carries the standard security headers (shared middleware)', async () => {
    await store.putSnapshot(fullSnapshot);
    const res = await makeApp().request('/api/insights/pages/gold', undefined, env);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });

  it('answers 304 on a matching If-None-Match (both generations in the ETag)', async () => {
    await store.putSnapshot(fullSnapshot);
    const app = makeApp();
    const first = await app.request('/api/insights/pages/gold', undefined, env);
    const etag = first.headers.get('etag');
    expect(etag).toBe('"insights-page:gold:2026-11-08T04:20:00.000Z+prices:none"');
    const revalidated = await app.request('/api/insights/pages/gold', { headers: { 'if-none-match': etag ?? '' } }, env);
    expect(revalidated.status).toBe(304);
  });

  it('answers 503 pages_not_ready (RatesError envelope) before the first run', async () => {
    const res = await makeApp().request('/api/insights/pages/gold', undefined, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('pages_not_ready');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('a rejecting reader is the calm 503 pages_unavailable, not a crash', async () => {
    const poisoned = {
      getSnapshot: (): Promise<InsightsSnapshot | undefined> => {
        throw new Error('KV unreachable');
      },
    };
    const res = await createApp({ makeInsightsReader: () => poisoned as unknown as InMemoryInsightsStore }).request(
      '/api/insights/pages/gold',
      undefined,
      env,
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('pages_unavailable');
  });

  it('answers 404 unknown_page (fail closed, zero data) for ids that are not destinations', async () => {
    await store.putSnapshot(fullSnapshot);
    for (const bad of ['insights', 'converter', 'pages', 'gold-US']) {
      const res = await makeApp().request(`/api/insights/pages/${bad}`, undefined, env);
      expect(res.status, `page ${JSON.stringify(bad)}`).toBe(404);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).toBe('unknown_page');
    }
  });
});

describe('GET /api/insights/pages/:page — the public projection (honest absentIds)', () => {
  let store: InMemoryInsightsStore;

  beforeEach(() => {
    store = new InMemoryInsightsStore();
  });

  it('gold reports the licence-hidden quartet as absent, stamps displayMode, stays complete otherwise', async () => {
    await store.putSnapshot(publicSnapshot);
    const res = await createApp({ makeInsightsReader: () => store }).request('/api/insights/pages/gold', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as PageProjection;
    expect(body.displayMode).toBe('public');
    expect(body.absentIds.sort()).toEqual([...HIDDEN_QUARTET].sort());
    expect(body.readings).toHaveLength(48);
  });

  it('every other page stays complete under the public projection', async () => {
    await store.putSnapshot(publicSnapshot);
    const app = createApp({ makeInsightsReader: () => store });
    for (const page of ['usa', 'australia', 'currencies', 'global'] as const) {
      const res = await app.request(`/api/insights/pages/${page}`, undefined, env);
      const body = (await res.json()) as PageProjection;
      expect(body.absentIds, `page ${page}`).toEqual([]);
      expect(body.readings.map((r) => r.id)).toEqual([...pageReadingIds(page)]);
    }
  });
});

describe('GET /api/insights/pages/:page — the live-prices overlay', () => {
  it('merges the live quote into the page readings and stamps pricesAsOf (the GET / twin)', async () => {
    const store = new InMemoryInsightsStore();
    const prices = new InMemoryPricesStore();
    await store.putSnapshot(fullSnapshot);
    await prices.putLivePricesIfChanged({
      v: 1,
      generatedAt: '2026-11-08T12:13:00.000Z',
      assets: {
        'gold-usd': {
          value: 4102.5,
          asOf: '2026-11-08',
          change7d: 1.2,
          change30d: 3.4,
          sourceSymbol: 'GC=F',
          updatedAt: '2026-11-08T12:13:00.000Z',
        } satisfies LivePriceEntry,
      },
    } satisfies LivePricesSnapshot);
    const app = createApp({ makeInsightsReader: () => store, makePricesReader: () => prices });
    const res = await app.request('/api/insights/pages/gold', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights-page:gold:2026-11-08T04:20:00.000Z+prices:2026-11-08T12:13:00.000Z"');
    const body = (await res.json()) as PageProjection;
    expect(body.pricesAsOf).toBe('2026-11-08T12:13:00.000Z');
    const goldUsd = body.readings.find((r) => r.id === 'gold-usd');
    expect(goldUsd?.value).toBe(4102.5);
    expect(goldUsd?.sourceName).toContain('GC=F');
  });

  it('a poisoned live-prices key degrades calmly to the plain EOD projection', async () => {
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(fullSnapshot);
    const poisoned = {
      getLivePrices: (): Promise<LivePricesSnapshot | undefined> => {
        throw new Error('KV unreachable');
      },
    };
    const app = createApp({ makeInsightsReader: () => store, makePricesReader: () => poisoned });
    const res = await app.request('/api/insights/pages/gold', undefined, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"insights-page:gold:2026-11-08T04:20:00.000Z+prices:none"');
    const body = (await res.json()) as PageProjection;
    expect(body.readings).toHaveLength(52);
    expect(body.absentIds).toEqual([]);
  });
});

describe('GET /api/insights/pages/:page — the private gate (AC-01…AC-08)', () => {
  it('private mode answers 401 without a session (the shared gate covers the new family)', async () => {
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(fullSnapshot);
    const res = await createApp({ makeInsightsReader: () => store }).request('/api/insights/pages/gold', undefined, authedEnv);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('private_page');
  });

  it('a valid session serves the private projection (complete membership)', async () => {
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(fullSnapshot);
    const res = await authed(createApp({ makeInsightsReader: () => store })).request('/api/insights/pages/usa', undefined, authedEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as PageProjection;
    expect(body.readings.map((r) => r.id)).toEqual([...pageReadingIds('usa')]);
    expect(body.displayMode).toBeUndefined();
  });
});
