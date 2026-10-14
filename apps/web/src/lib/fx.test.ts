/**
 * fx.test.ts — the world currencies API client, pinned to the same bar as
 * insights.test.ts (audit C-6): contract validation, last-good
 * localStorage cache, and every failure shape of this feed's NULL surface
 * (spec §9.5: the section's designed fallbacks are "loading" and the calm
 * "being prepared" line — any failure resolves to null, never an error
 * state). House pattern: stub globals per test, no React rendering.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FxSnapshot } from '@currena/core';
import { FxSnapshotSchema } from '@currena/core';
import { fetchFxSnapshot, readCachedFx } from './fx';

/* ------------------------------------------------------------------ *
 * Fixtures — a minimal contract-valid snapshot (verified against the
 * schema inside the tests so a fixture drift fails loudly)
 * ------------------------------------------------------------------ */

const PAIR: FxSnapshot['pairs'][number] = {
  id: 'eurusd',
  asOf: '2026-10-12',
  rate: 1.085,
  chg: { d1: 0.1, m1: -0.5, m3: 1.0, y1: 2.0 },
  moveRank: 55,
  bigMove: false,
  source: 'frankfurter',
  stale: false,
  weekly: [
    [0, 1.08],
    [7, 1.085],
  ],
};

const SNAPSHOT: FxSnapshot = {
  v: 1,
  generatedAt: '2026-10-13T17:01:00Z',
  dollarMeasure: {
    asOf: '2026-10-12',
    value: 100.25,
    chg: { d1: 0.1, m1: -0.5, m3: 1.2, y1: 2.0 },
    weekly: [
      [0, 100],
      [7, 100.5],
    ],
  },
  pairs: [PAIR],
  rules: [
    {
      id: 'r3_dollar_strength',
      outcome: 'quiet',
      counted: false,
      numbers: {},
      confirmedBy: [],
      progress: 0,
      legs: [],
      pattern: { status: 'nodata', agreeWeeks: 0, ofWeeks: 13, weeks: [] },
      chart: { expect: 'together', series: [] },
    },
  ],
  summary: { signal: 'normal', countedWarnings: 0, headlineRule: null },
  plain: { dollarYearExtreme: null, movers: { EUR: -0.5 } },
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
 * fetchFxSnapshot — the null error surface
 * ------------------------------------------------------------------ */

describe('fetchFxSnapshot', () => {
  it('validates a contract-shaped payload and returns it', async () => {
    // Fixture sanity: the wire format must satisfy the core contract.
    expect(() => FxSnapshotSchema.parse(SNAPSHOT)).not.toThrow();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    const result = await fetchFxSnapshot();
    expect(result?.generatedAt).toBe(SNAPSHOT.generatedAt);
    expect(result?.pairs).toHaveLength(1);
    expect(result?.pairs[0]?.id).toBe('eurusd');
    expect(result?.plain?.movers.EUR).toBe(-0.5);
  });

  it('a pre-v1.3 snapshot without `plain` still parses (optional field by design)', async () => {
    const { plain: _plain, ...preV13 } = SNAPSHOT;
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(preV13)));
    const result = await fetchFxSnapshot();
    expect(result?.generatedAt).toBe(SNAPSHOT.generatedAt);
    expect(result?.plain).toBeUndefined();
  });

  it('asks the route with the browser-HTTP-cache discipline (accept + cache: default — the ETag/304 path)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(SNAPSHOT));
    vi.stubGlobal('fetch', fetchMock);
    await fetchFxSnapshot();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0]! as unknown as [string, RequestInit];
    expect(input).toBe('/api/insights/fx');
    expect((init.headers as Record<string, string>).accept).toBe('application/json');
    expect(init.cache).toBe('default'); // the browser revalidates via ETag — never manual
  });

  it('persists the last-good snapshot to localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    await fetchFxSnapshot();
    expect(storage.has('currena:insights:fx')).toBe(true);
    const round = readCachedFx();
    expect(round?.summary.signal).toBe('normal');
  });

  it('a 503 fx_not_ready envelope resolves null (the expected "being prepared" answer)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: { code: 'fx_not_ready', message: 'not ready' } }, 503));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchFxSnapshot()).resolves.toBeNull();
    expect(storage.has('currena:insights:fx')).toBe(false); // nothing cached off an error
  });

  it('a non-503 failure (KV outage 503 fx_unavailable, gateway 500) is equally non-fatal → null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'fx_unavailable', message: 'kv down' } }, 503)),
    );
    await expect(fetchFxSnapshot()).resolves.toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    await expect(fetchFxSnapshot()).resolves.toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    await expect(fetchFxSnapshot()).resolves.toBeNull();
    expect(storage.size).toBe(0);
  });

  it('a 2xx body that is not JSON resolves null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>oops</html>', { status: 200, headers: { 'content-type': 'text/html' } })),
    );
    await expect(fetchFxSnapshot()).resolves.toBeNull();
  });

  it('a 2xx body that breaks the contract (poisoned payload) resolves null and caches nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ generatedAt: 'nope' })));
    await expect(fetchFxSnapshot()).resolves.toBeNull();
    expect(storage.has('currena:insights:fx')).toBe(false);
  });

  it('a network rejection resolves null (offline — the PWA serves the cached paint instead)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    await expect(fetchFxSnapshot()).resolves.toBeNull();
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
    const pending = fetchFxSnapshot(controller.signal);
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
    const result = await fetchFxSnapshot();
    expect(result?.pairs).toHaveLength(1); // the data still flows
  });
});

/* ------------------------------------------------------------------ *
 * readCachedFx — the last-good offline paint
 * ------------------------------------------------------------------ */

describe('readCachedFx', () => {
  it('returns null when nothing is stored', () => {
    expect(readCachedFx()).toBeNull();
  });

  it('round-trips a stored snapshot (zod-validated on read)', () => {
    storage.set('currena:insights:fx', JSON.stringify(SNAPSHOT));
    const round = readCachedFx();
    expect(round).toEqual(SNAPSHOT);
  });

  it('discards corrupted JSON silently', () => {
    storage.set('currena:insights:fx', '{not json');
    expect(readCachedFx()).toBeNull();
  });

  it('discards contract-invalid snapshots (an older contract never renders)', () => {
    storage.set('currena:insights:fx', JSON.stringify({ v: 1, generatedAt: 42 }));
    expect(readCachedFx()).toBeNull();
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
    expect(readCachedFx()).toBeNull();
  });
});
