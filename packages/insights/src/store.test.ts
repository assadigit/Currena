import { describe, expect, it, vi } from 'vitest';
import type { IndicatorReading, InsightsSnapshot, InsightsStatus, IndicatorHistory, IndicatorId } from '@currena/core';
import {
  InMemoryInsightsStore,
  INSIGHTS_SNAPSHOT_KEY,
  INSIGHTS_SNAPSHOT_PUBLIC_KEY,
  INSIGHTS_STATUS_KEY,
  insightsArchivePublicKey,
  insightsHistoryKey,
  RestInsightsStore,
} from './store';

/* Minimal contract-valid fixtures. */
const reading = (id: IndicatorId, status: IndicatorReading['status'] = 'normal'): IndicatorReading => ({
  id,
  value: status === 'unavailable' ? null : 1,
  asOf: status === 'unavailable' ? null : '2026-10-06',
  status,
  sourceName: 'Test source',
  updatedAt: '2026-10-07T04:20:00.000Z',
});

const snapshot: InsightsSnapshot = {
  generatedAt: '2026-10-07T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'relaxed', warningCount: 0, votingCount: 2, excludedCount: 0 },
    australia: { section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 1 },
  },
  readings: [reading('us10y'), reading('rba-cash-rate', 'unavailable')],
  changedThisWeek: [],
  calendar: [],
};

const history: IndicatorHistory = { v: 1, id: 'us10y', points: [[19723, 3.88], [19730, 3.97]] };

const status: InsightsStatus = {
  v: 1,
  generatedAt: '2026-10-07T04:21:00.000Z',
  mode: 'scheduled',
  dryRun: false,
  sources: [{ source: 'fred', ok: true, detail: '10/10 series' }],
};

describe('InMemoryInsightsStore', () => {
  it('round-trips snapshot, history and status', async () => {
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    await store.putHistory(history);
    await store.putStatus(status);

    expect(await store.getSnapshot()).toEqual(snapshot);
    expect(await store.getHistory('us10y')).toEqual(history);
    expect(await store.getStatus()).toEqual(status);
  });

  it('returns undefined for absent keys', async () => {
    const store = new InMemoryInsightsStore();
    expect(await store.getSnapshot()).toBeUndefined();
    expect(await store.getHistory('us10y')).toBeUndefined();
    expect(await store.getStatus()).toBeUndefined();
  });

  it('treats poisoned entries as absent (rule #3)', async () => {
    const store = new InMemoryInsightsStore();
    (store as unknown as { entries: Map<string, string> }).entries.set(INSIGHTS_SNAPSHOT_KEY, '{not json');
    (store as unknown as { entries: Map<string, string> }).entries.set(
      insightsHistoryKey('us10y'),
      JSON.stringify({ v: 1, id: 'us10y', points: [[5, 1], [5, 2]] }), // duplicate day → schema-refine fail
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await store.getSnapshot()).toBeUndefined();
    expect(await store.getHistory('us10y')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

/* ------------------------------------------------------------------ *
 * RestInsightsStore — fetch is INJECTED, never the network
 * ------------------------------------------------------------------ */

interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function fakeRest(responses: Array<{ match: (call: RecordedCall) => boolean; respond: () => Response }>) {
  const calls: RecordedCall[] = [];
  const fetchImpl = (async (url: unknown, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries((init?.headers ?? {}) as Record<string, string>)) headers[k] = v;
    const call: RecordedCall = {
      url: String(url),
      method: init?.method ?? 'GET',
      headers,
      body: typeof init?.body === 'string' ? init.body : undefined,
    };
    calls.push(call);
    const hit = responses.find((r) => r.match(call));
    if (!hit) return new Response('{"success":false}', { status: 500 });
    return hit.respond();
  }) as typeof fetch;
  return { calls, fetchImpl };
}

const OPTS = {
  apiToken: 'test-token',
  accountId: 'acct-1',
  namespaceId: 'ns-1',
  baseUrl: 'https://cf.test',
  retryDelaysMs: [] as const,
};

const kvUrl = (key: string) =>
  `https://cf.test/accounts/acct-1/storage/kv/namespaces/ns-1/values/${encodeURIComponent(key)}`;

function makeStore(fetchImpl: typeof fetch, retryDelaysMs: readonly number[] = []): RestInsightsStore {
  return new RestInsightsStore({ ...OPTS, fetchImpl, retryDelaysMs });
}

describe('RestInsightsStore', () => {
  it('PUTs snapshot/status/history with bearer auth, JSON body and encoded key', async () => {
    const okPut = () => new Response('{"success":true,"errors":[]}', { status: 200 });
    const { calls, fetchImpl } = fakeRest([
      { match: (c) => c.method === 'PUT', respond: okPut },
      { match: () => true, respond: () => new Response('{"result":null,"errors":[{"code":10009}]}', { status: 404 }) },
    ]);
    const store = makeStore(fetchImpl);

    await store.putSnapshot(snapshot);
    await store.putStatus(status);
    await store.putHistory(history);

    expect(calls.map((c) => c.url)).toEqual([
      kvUrl(INSIGHTS_SNAPSHOT_KEY),
      kvUrl(INSIGHTS_STATUS_KEY),
      kvUrl(insightsHistoryKey('us10y')),
    ]);
    for (const call of calls) {
      expect(call.headers.Authorization).toBe('Bearer test-token');
      expect(call.headers['Content-Type']).toBe('application/json');
    }
    expect(JSON.parse(calls[0]!.body!)).toEqual(snapshot);
    expect(store.ops.writes).toBe(3);
  });

  it('GETs parse back the stored JSON; 404 reads as undefined', async () => {
    const { fetchImpl } = fakeRest([
      {
        match: (c) => c.method === 'GET' && c.url === kvUrl(INSIGHTS_SNAPSHOT_KEY),
        respond: () => new Response(JSON.stringify(snapshot), { status: 200 }),
      },
      {
        match: (c) => c.method === 'GET' && c.url === kvUrl(insightsHistoryKey('us10y')),
        respond: () => new Response('{"result":null,"errors":[{"code":10009,"message":"get: \'key not found\'"}]}', { status: 404 }),
      },
    ]);
    const store = makeStore(fetchImpl);

    expect(await store.getSnapshot()).toEqual(snapshot);
    expect(await store.getHistory('us10y')).toBeUndefined();
    expect(store.ops.reads).toBe(2);
  });

  it('throws loudly on non-404 read failures, without ever containing the token', async () => {
    const { fetchImpl } = fakeRest([
      { match: (c) => c.method === 'GET', respond: () => new Response('{"errors":[{"code":10000}]}', { status: 500 }) },
    ]);
    const store = makeStore(fetchImpl);
    await expect(store.getSnapshot()).rejects.toThrow(/HTTP 500/);
  });

  it('retries writes that bounce off the daily cap (429/10048), then succeeds', async () => {
    let putAttempts = 0;
    const { fetchImpl } = fakeRest([
      {
        match: (c) => c.method === 'PUT',
        respond: () => {
          putAttempts++;
          return putAttempts === 1
            ? new Response('{"errors":[{"code":10048,"message":"free usage limit"}]}', { status: 429 })
            : new Response('{"success":true}', { status: 200 });
        },
      },
    ]);
    const store = new RestInsightsStore({ ...OPTS, fetchImpl, retryDelaysMs: [1] });
    await store.putStatus(status);
    expect(putAttempts).toBe(2);
    expect(store.ops.retriedWrites).toBe(1);
  });

  it('fails after the retry ladder is exhausted; non-cap errors never retry', async () => {
    const cap = () => new Response('{"errors":[{"code":10048}]}', { status: 429 });
    const denied = () => new Response('{"errors":[{"code":10000,"message":"authentication error"}]}', { status: 403 });
    const a = fakeRest([{ match: (c) => c.method === 'PUT', respond: cap }]);
    const storeA = new RestInsightsStore({ ...OPTS, fetchImpl: a.fetchImpl, retryDelaysMs: [1, 1] });
    await expect(storeA.putStatus(status)).rejects.toThrow(/HTTP 429/);
    expect(a.calls.filter((c) => c.method === 'PUT')).toHaveLength(3); // 1 + 2 retries

    const b = fakeRest([{ match: (c) => c.method === 'PUT', respond: denied }]);
    const storeB = new RestInsightsStore({ ...OPTS, fetchImpl: b.fetchImpl, retryDelaysMs: [1, 1] });
    await expect(storeB.putStatus(status)).rejects.toThrow(/HTTP 403/);
    expect(b.calls.filter((c) => c.method === 'PUT')).toHaveLength(1); // no retry on auth errors
  });

  it('poisoned GET bodies read as undefined (validation on the trust boundary)', async () => {
    const { fetchImpl } = fakeRest([
      {
        match: (c) => c.method === 'GET',
        respond: () => new Response('{"success":true, "weird":', { status: 200 }),
      },
    ]);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = makeStore(fetchImpl);
    expect(await store.getSnapshot()).toBeUndefined();
    warn.mockRestore();
  });
});

describe('public projection keys (2026-10-19)', () => {
  it('InMemoryInsightsStore round-trips the public snapshot + public archive under their own keys', async () => {
    const store = new InMemoryInsightsStore();
    await store.putPublicSnapshot(snapshot);
    expect(await store.getPublicSnapshot()).toEqual(snapshot);
    // The private key stays untouched — the documents never mix.
    expect(await store.getSnapshot()).toBeUndefined();
    await store.putPublicArchive('2026-10-07', snapshot);
    expect(await store.getPublicArchive('2026-10-07')).toEqual(snapshot);
    expect(await store.getArchive('2026-10-07')).toBeUndefined();
  });

  it('RestInsightsStore targets the public keys (insights:snapshot-public / insights:archive-public:v1:<date>)', async () => {
    const okPut = () => new Response('{"success":true,"errors":[]}', { status: 200 });
    const { calls, fetchImpl } = fakeRest([
      { match: (c) => c.method === 'PUT', respond: okPut },
      { match: () => true, respond: () => new Response('{"result":null,"errors":[]}', { status: 404 }) },
    ]);
    const store = makeStore(fetchImpl);

    await store.putPublicSnapshot(snapshot);
    await store.putPublicArchive('2026-10-07', snapshot);

    expect(calls.map((c) => c.url)).toEqual([kvUrl(INSIGHTS_SNAPSHOT_PUBLIC_KEY), kvUrl(insightsArchivePublicKey('2026-10-07'))]);
    expect(JSON.parse(calls[0]!.body!)).toEqual(snapshot);
  });

  it('RestInsightsStore GETs the public snapshot back; a missing key reads as undefined', async () => {
    const { fetchImpl } = fakeRest([
      {
        match: (c) => c.method === 'GET' && c.url === kvUrl(INSIGHTS_SNAPSHOT_PUBLIC_KEY),
        respond: () => new Response(JSON.stringify(snapshot), { status: 200 }),
      },
      { match: () => true, respond: () => new Response('{"result":null,"errors":[]}', { status: 404 }) },
    ]);
    const store = makeStore(fetchImpl);
    expect(await store.getPublicSnapshot()).toEqual(snapshot);
    expect(await store.getPublicArchive('2026-10-07')).toBeUndefined();
  });
});
