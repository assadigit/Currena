/**
 * tic.test.ts — the foreign-holders API client, pinned to the same bar as
 * markets.test.ts (audit C-6): contract validation, last-good localStorage
 * cache, and every failure shape of this feed's NULL surface (the section's
 * designed fallbacks are "loading" and the calm "being prepared" line —
 * any failure resolves to null, never an error state). House pattern: stub
 * globals per test, no React rendering.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TicSnapshot } from '@currena/core';
import { TicSnapshotSchema } from '@currena/core';
import { fetchTicSnapshot, readCachedTic } from './tic';

/* ------------------------------------------------------------------ *
 * Fixture — a minimal contract-valid snapshot (verified against the
 * schema inside the tests so a fixture drift fails loudly). Every number
 * is the provider's own (2026-08 rows of the committed fixtures).
 * ------------------------------------------------------------------ */

const SNAPSHOT: TicSnapshot = {
  v: 1,
  dataMonth: '2026-08',
  releasedAt: '2026-10-16T20:07:27.000Z',
  fetchedAt: '2026-10-31T21:40:20.370Z',
  totalBn: 9331.7,
  officialBn: 3755.6,
  privateBn: 5576.1,
  holders: [
    {
      id: 'japan',
      name: 'Japan',
      holdingsBn: 1068.283,
      months: [
        { ym: '2026-06', v: 1116.683 },
        { ym: '2026-07', v: 1103.943 },
        { ym: '2026-08', v: 1068.283 },
      ],
      netSalesBn: [
        { ym: '2026-06', v: -26.858 },
        { ym: '2026-07', v: 0.891 },
        { ym: '2026-08', v: -37.02 },
      ],
      isCustodyHub: false,
    },
    {
      id: 'belgium',
      name: 'Belgium',
      holdingsBn: 490.508,
      months: [
        { ym: '2026-07', v: 488.7 },
        { ym: '2026-08', v: 490.508 },
      ],
      isCustodyHub: true,
    },
  ],
  sourceUrls: [
    'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt',
    'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table3.txt',
  ],
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
 * fetchTicSnapshot — the null error surface
 * ------------------------------------------------------------------ */

describe('fetchTicSnapshot', () => {
  it('validates a contract-shaped payload and returns it', async () => {
    // Fixture sanity: the wire format must satisfy the core contract.
    expect(() => TicSnapshotSchema.parse(SNAPSHOT)).not.toThrow();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    const result = await fetchTicSnapshot();
    expect(result?.dataMonth).toBe('2026-08');
    expect(result?.holders).toHaveLength(2);
    expect(result?.holders[0]?.id).toBe('japan');
    expect(result?.holders[1]?.isCustodyHub).toBe(true);
  });

  it('asks the route with the browser-HTTP-cache discipline (accept + cache: default — the ETag/304 path)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(SNAPSHOT));
    vi.stubGlobal('fetch', fetchMock);
    await fetchTicSnapshot();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0]! as unknown as [string, RequestInit];
    expect(input).toBe('/api/insights/tic');
    expect((init.headers as Record<string, string>).accept).toBe('application/json');
    expect(init.cache).toBe('default'); // the browser revalidates via ETag — never manual
  });

  it('caches the last-good snapshot to localStorage for the offline paint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    await fetchTicSnapshot();
    expect(storage.get('currena:insights:tic')).toBe(JSON.stringify(SNAPSHOT));
  });

  it('resolves null on the EXPECTED 503 tic_not_ready (the calm "being prepared" answer)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: { code: 'tic_not_ready', message: 'No foreign-holdings snapshot stored yet.' } }, 503),
      ),
    );
    expect(await fetchTicSnapshot()).toBeNull();
  });

  it('resolves null on any other non-200 (and drains the error envelope quietly)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { code: 'hidden_site_mode' } }, 404)));
    expect(await fetchTicSnapshot()).toBeNull();
  });

  it('resolves null on a poisoned payload (contract violation — never rendered)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ v: 1, dataMonth: '2026-13', holders: [] })));
    expect(await fetchTicSnapshot()).toBeNull();
  });

  it('resolves null when the body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>gateway</html>', { status: 200, headers: { 'content-type': 'text/html' } })),
    );
    expect(await fetchTicSnapshot()).toBeNull();
  });

  it('resolves null on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('network down'))));
    expect(await fetchTicSnapshot()).toBeNull();
  });

  it('propagates caller-initiated aborts (unmount/retry), collapsing only its own timeout', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(fetchTicSnapshot(controller.signal)).resolves.toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * readCachedTic — the last-good localStorage paint
 * ------------------------------------------------------------------ */

describe('readCachedTic', () => {
  it('returns the cached snapshot, zod-validated', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    await fetchTicSnapshot();
    const cached = readCachedTic();
    expect(cached?.dataMonth).toBe('2026-08');
    expect(cached).toEqual(SNAPSHOT);
  });

  it('returns null when nothing is cached', () => {
    expect(readCachedTic()).toBeNull();
  });

  it('discards a cache entry that fails the CURRENT contract (an older schema never renders)', () => {
    storage.set('currena:insights:tic', JSON.stringify({ v: 1, dataMonth: 'not-a-month' }));
    expect(readCachedTic()).toBeNull();
  });

  it('returns null on corrupted JSON in storage', () => {
    storage.set('currena:insights:tic', '{not json');
    expect(readCachedTic()).toBeNull();
  });
});
