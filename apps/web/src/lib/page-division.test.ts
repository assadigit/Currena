/**
 * Page-division projection client tests (S2, 2026-11-08) — the web side of
 * the contract between engine and pages. House pattern (insights.test.ts):
 * stub globals per test, no React rendering, contract-shaped fixtures.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearProjectionCacheForTests, fetchPageIndex, fetchPageProjection } from './page-division';
import { ApiError } from './api';
import type { IndicatorReading, PageIndex, PageProjection } from '@currena/core';

/* ------------------------------------------------------------------ *
 * Fixtures — minimal contract-valid payloads
 * ------------------------------------------------------------------ */

function reading(partial: Partial<IndicatorReading> & { id: IndicatorReading['id'] }): IndicatorReading {
  return {
    value: 4102.5,
    asOf: '2026-11-08',
    status: 'normal',
    sourceName: 'Yahoo Finance: COMEX gold futures (GC=F)',
    sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
    updatedAt: '2026-11-08T04:20:00.000Z',
    ...partial,
  };
}

const GOLD_PROJECTION: PageProjection = {
  page: 'gold',
  generatedAt: '2026-11-08T04:20:00.000Z',
  pricesAsOf: '2026-11-08T12:13:00.000Z',
  readings: [
    reading({ id: 'gold-usd', value: 4102.5 }),
    reading({ id: 'gold-silver', value: 88.1 }),
  ],
  absentIds: [],
  boards: [],
};

const INDEX: PageIndex = {
  pages: [
    { page: 'gold', registryCards: 14, mirrorInputs: 34, boards: [], decisions: 'D-5 · D-26…D-29' },
    { page: 'usa', registryCards: 72, mirrorInputs: 14, boards: ['markets', 'tic'], decisions: 'D-14 · D-29…D-32 · D-44' },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  clearProjectionCacheForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * lib/page-division.ts — the index
 * ------------------------------------------------------------------ */

describe('fetchPageIndex', () => {
  it('validates a contract-shaped index and returns it', async () => {
    const fetchMock = vi.fn(async (url: string) => jsonResponse(url === '/api/insights/pages' ? INDEX : {}));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchPageIndex();
    expect(result.pages).toHaveLength(2);
    expect(result.pages[1]?.boards).toEqual(['markets', 'tic']);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/insights/pages');
  });

  it('throws parse ApiError on a 2xx body that breaks the contract', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ pages: 'nope' })));
    await expect(fetchPageIndex()).rejects.toMatchObject({ kind: 'parse' });
  });
});

/* ------------------------------------------------------------------ *
 * lib/page-division.ts — one page's projection
 * ------------------------------------------------------------------ */

describe('fetchPageProjection', () => {
  it('validates a contract-shaped projection and returns it', async () => {
    const fetchMock = vi.fn(async (url: string) => jsonResponse(url === '/api/insights/pages/gold' ? GOLD_PROJECTION : {}));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchPageProjection('gold');
    expect(result.page).toBe('gold');
    expect(result.pricesAsOf).toBe('2026-11-08T12:13:00.000Z');
    expect(result.readings[0]?.id).toBe('gold-usd');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/insights/pages/gold');
  });

  it('caches the promise per page — a second visit never refetches', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(GOLD_PROJECTION));
    vi.stubGlobal('fetch', fetchMock);
    await fetchPageProjection('gold');
    await fetchPageProjection('gold');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('a failed fetch drops from the cache so a retry re-enters', async () => {
    let fail = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        fail
          ? jsonResponse({ error: { code: 'pages_not_ready', message: 'Not ready' } }, 503)
          : jsonResponse(GOLD_PROJECTION),
      ),
    );
    await expect(fetchPageProjection('gold')).rejects.toMatchObject({ kind: 'rates', code: 'pages_not_ready' });
    fail = false;
    await expect(fetchPageProjection('gold')).resolves.toMatchObject({ page: 'gold' });
  });

  it('throws a typed rates ApiError for a 404 unknown_page envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'unknown_page', message: 'No such page' } }, 404)),
    );
    await expect(fetchPageProjection('currencies')).rejects.toMatchObject({
      kind: 'rates',
      code: 'unknown_page',
      status: 404,
    });
  });

  it('throws parse ApiError on a 2xx body that breaks the contract', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ page: 'gold', readings: 'nope' })));
    await expect(fetchPageProjection('gold')).rejects.toMatchObject({ kind: 'parse' });
  });

  it('throws parse ApiError when the payload names a different page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ ...GOLD_PROJECTION, page: 'usa' })));
    await expect(fetchPageProjection('gold')).rejects.toMatchObject({ kind: 'parse' });
  });

  it('throws network ApiError when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    await expect(fetchPageProjection('gold')).rejects.toBeInstanceOf(ApiError);
  });
});
