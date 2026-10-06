import type { IndicatorReading, InsightsSnapshot, InsightsStatus, IndicatorHistory, IndicatorId } from '@currena/core';
import { InMemoryInsightsStore } from '@currena/insights/store';
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
    expect(res.headers.get('etag')).toBe('"insights:2026-10-07T04:20:00.000Z"');
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
    expect(await res.json()).toEqual(snapshot);
  });

  it('answers 304 on a matching If-None-Match', async () => {
    await store.putSnapshot(snapshot);
    const res = await makeApp().request('/api/insights', {
      headers: { 'if-none-match': '"insights:2026-10-07T04:20:00.000Z"' },
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
    const res = await makeApp().request('/api/insights/vix/history', undefined, env);
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
