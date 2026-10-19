/**
 * markets.test.ts — the world stock markets API client, pinned to the same
 * bar as insights.test.ts (audit C-6): contract validation, last-good
 * localStorage cache, and every failure shape of this feed's NULL surface
 * (spec §6.6: the section's designed fallbacks are "loading" and the calm
 * "being prepared" line — any failure resolves to null, never an error
 * state). House pattern: stub globals per test, no React rendering.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MarketsSnapshot } from '@currena/core';
import { MarketsSnapshotSchema } from '@currena/core';
import { fetchMarketsSnapshot, readCachedMarkets } from './markets';

/* ------------------------------------------------------------------ *
 * Fixtures — minimal contract-valid snapshots (verified against the
 * schema inside the tests so a fixture drift fails loudly)
 * ------------------------------------------------------------------ */

function marketEntry(id: 'dax' | 'sp500', asOf = '2026-10-09'): MarketsSnapshot['markets'][number] {
  return {
    id,
    asOf,
    close: 19624,
    chg1d: 0.5,
    chg1w: 0.4,
    chg1m: 1.2,
    chg3m: 3,
    high52w: 20000,
    low52w: 17000,
    fromHigh: -1.9,
    rangePos: 87,
    trend: 'flat',
    status: 'normal',
    source: 'eodhd',
    stale: false,
    weekly: [
      [0, 19000],
      [7, 19100],
    ],
  };
}

const SNAPSHOT: MarketsSnapshot = {
  v: 1,
  generatedAt: '2026-10-12T23:31:00Z',
  markets: [marketEntry('dax'), marketEntry('sp500')],
  summary: { count: 2, roseToday: 1, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => void storage.set(k, v),
      removeItem: (k: string) => void storage.delete(k),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * fetchMarketsSnapshot — the null error surface
 * ------------------------------------------------------------------ */

describe('fetchMarketsSnapshot', () => {
  it('validates a contract-shaped payload and returns it', async () => {
    // Fixture sanity: the wire format must satisfy the core contract.
    expect(() => MarketsSnapshotSchema.parse(SNAPSHOT)).not.toThrow();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    const result = await fetchMarketsSnapshot();
    expect(result?.generatedAt).toBe(SNAPSHOT.generatedAt);
    expect(result?.markets).toHaveLength(2);
    expect(result?.markets[0]?.id).toBe('dax');
  });

  it('asks the route with the browser-HTTP-cache discipline (accept + cache: default — the ETag/304 path)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(SNAPSHOT));
    vi.stubGlobal('fetch', fetchMock);
    await fetchMarketsSnapshot();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0]! as unknown as [string, RequestInit];
    expect(input).toBe('/api/insights/markets');
    expect((init.headers as Record<string, string>).accept).toBe('application/json');
    expect(init.cache).toBe('default'); // the browser revalidates via ETag — never manual
  });

  it('persists the last-good snapshot to localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    await fetchMarketsSnapshot();
    expect(storage.has('currena:insights:markets')).toBe(true);
    const round = readCachedMarkets();
    expect(round?.summary.signal).toBe('normal');
  });

  it('a 503 markets_not_ready envelope resolves null (the expected "being prepared" answer)', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: { code: 'markets_not_ready', message: 'not ready' } }, 503),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchMarketsSnapshot()).resolves.toBeNull();
    expect(storage.has('currena:insights:markets')).toBe(false); // nothing cached off an error
  });

  it('a non-503 failure (KV outage 503 markets_unavailable, gateway 500) is equally non-fatal → null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'markets_unavailable', message: 'kv down' } }, 503)),
    );
    await expect(fetchMarketsSnapshot()).resolves.toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    await expect(fetchMarketsSnapshot()).resolves.toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    await expect(fetchMarketsSnapshot()).resolves.toBeNull();
    expect(storage.size).toBe(0);
  });

  it('a 2xx body that is not JSON resolves null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>oops</html>', { status: 200, headers: { 'content-type': 'text/html' } })),
    );
    await expect(fetchMarketsSnapshot()).resolves.toBeNull();
  });

  it('a 2xx body that breaks the contract (poisoned payload) resolves null and caches nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ generatedAt: 'nope' })));
    await expect(fetchMarketsSnapshot()).resolves.toBeNull();
    expect(storage.has('currena:insights:markets')).toBe(false);
  });

  it('a network rejection resolves null (offline — the PWA serves the cached paint instead)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    await expect(fetchMarketsSnapshot()).resolves.toBeNull();
  });

  it('an aborted request (caller signal) resolves null, never throws', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(
      (_input: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const pending = fetchMarketsSnapshot(controller.signal);
    controller.abort();
    await expect(pending).resolves.toBeNull();
  });

  it('caching is best-effort: a localStorage write failure (private mode) never fails the fetch', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new DOMException('private mode', 'SecurityError');
        },
        removeItem: () => undefined,
      },
    });
    const result = await fetchMarketsSnapshot();
    expect(result?.markets).toHaveLength(2); // the data still flows
  });
});

/* ------------------------------------------------------------------ *
 * readCachedMarkets — the last-good offline paint
 * ------------------------------------------------------------------ */

describe('readCachedMarkets', () => {
  it('returns null when nothing is stored', () => {
    expect(readCachedMarkets()).toBeNull();
  });

  it('round-trips a stored snapshot (zod-validated on read)', () => {
    storage.set('currena:insights:markets', JSON.stringify(SNAPSHOT));
    const round = readCachedMarkets();
    expect(round).toEqual(SNAPSHOT);
  });

  it('discards corrupted JSON silently', () => {
    storage.set('currena:insights:markets', '{not json');
    expect(readCachedMarkets()).toBeNull();
  });

  it('discards contract-invalid snapshots (an older contract never renders)', () => {
    storage.set('currena:insights:markets', JSON.stringify({ v: 1, generatedAt: 42 }));
    expect(readCachedMarkets()).toBeNull();
  });

  it('localStorage access failures (private mode) resolve null, never throw', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new DOMException('private mode', 'SecurityError');
        },
        setItem: () => undefined,
        removeItem: () => undefined,
      },
    });
    expect(readCachedMarkets()).toBeNull();
  });
});
