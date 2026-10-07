/**
 * SnapshotStore unit tests (I12 — first store tests; backlog #29's web-test
 * sweep partially closes here).
 *
 * Everything the store touches is faked: fetchRates (vi.mock of ./api),
 * recordGeneration (vi.mock of ./rate-history — it writes localStorage),
 * window/localStorage/navigator (in-memory stubs), and the clock
 * (vi.useFakeTimers) for the self-healing retry ladder.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snapshot, SnapshotSource } from '@currena/core';

const fetchRates = vi.hoisted(() => vi.fn());
const recordGeneration = vi.hoisted(() => vi.fn());

vi.mock('./api', () => ({ ApiError: class extends Error {}, fetchRates }));
vi.mock('./rate-history', () => ({ recordGeneration }));

import { SnapshotStore } from './snapshot-store';

/* ------------------------------------------------------------------ *
 * Environment stubs
 * ------------------------------------------------------------------ */

function stubLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length(): number {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => void map.clear(),
  } as Storage;
}

const listeners = new Map<string, EventListener>();
let storage: Storage;
let online: boolean;

function installGlobals(): void {
  storage = stubLocalStorage();
  listeners.clear();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: storage,
      addEventListener: (type: string, handler: EventListener) =>
        listeners.set(type, handler),
    },
  });
  // Node ≥ 20 ships a getter-only global navigator — defineProperty it away.
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    get: () => ({ onLine: online }),
  });
  online = true;
}

const snap = (source: SnapshotSource, fetchedAt: string): Snapshot => ({
  base: source === 'tgju' ? 'IRR' : 'USD',
  source,
  fetchedAt,
  rates: [
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: source === 'tgju' ? 1 / 230_500 : 1 },
  ],
});

const ratesResponse = (snapshot: Snapshot) => ({
  snapshot,
  stale: false,
  servedFrom: 'live' as const,
  notice: undefined,
});

const networkError = () => new TypeError('fetch failed');

/** Calls of fetchRates that targeted `source` (boot fetches BOTH sources). */
const callsFor = (source: SnapshotSource): number =>
  fetchRates.mock.calls.filter((args) => args[0] === source).length;

/** Persist a snapshot as the boot-time last-good for `source`. */
function seedLocal(source: SnapshotSource, snapshot: Snapshot): void {
  storage.setItem(`currena:snapshot:${source}`, JSON.stringify(snapshot));
}

beforeEach(() => {
  vi.useFakeTimers();
  installGlobals();
  fetchRates.mockReset();
  recordGeneration.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).navigator;
});

describe('boot + per-source freshness window (I12)', () => {
  it('hydrates persisted snapshots and fetches only the stale/missing ones', async () => {
    const now = Date.now();
    // tgju: 6 min old — STALE for its 5-min window → refetched.
    seedLocal('tgju', snap('tgju', new Date(now - 6 * 60_000).toISOString()));
    // frankfurter: 12 min old — FRESH inside its 15-min window → NOT fetched.
    seedLocal('frankfurter', snap('frankfurter', new Date(now - 12 * 60_000).toISOString()));
    fetchRates.mockImplementation(async (source: SnapshotSource) =>
      ratesResponse(snap(source, new Date(now).toISOString())),
    );

    const store = new SnapshotStore();
    store.boot();
    await vi.runAllTimersAsync();

    expect(fetchRates).toHaveBeenCalledTimes(1);
    expect(fetchRates).toHaveBeenCalledWith('tgju');
    const state = store.getState();
    expect(state.tgju.snapshot).not.toBeNull();
    expect(state.frankfurter.stale).toBe(false); // 12-min ECB snapshot: still fresh
    expect(state.frankfurter.servedFrom).toBe('local-store');
    expect(state.online).toBe(true);
  });

  it('a 6-min-old frankfurter snapshot crosses into honest staleness and refetches', async () => {
    const now = Date.now();
    seedLocal('frankfurter', snap('frankfurter', new Date(now - 16 * 60_000).toISOString()));
    fetchRates.mockImplementation(async (source: SnapshotSource) =>
      ratesResponse(snap(source, new Date(now).toISOString())),
    );

    const store = new SnapshotStore();
    store.boot();
    await vi.runAllTimersAsync();

    expect(fetchRates).toHaveBeenCalledWith('frankfurter');
    expect(store.getState().frankfurter.servedFrom).toBe('live');
  });
});

describe('self-healing retry ladder (I12 — first-visit error state)', () => {
  it('schedules 15s → 30s → 60s backoff retries and clears them on success', async () => {
    fetchRates.mockRejectedValue(networkError());

    const store = new SnapshotStore();
    store.boot();
    await vi.advanceTimersByTimeAsync(0);

    const state0 = store.getState().tgju;
    expect(state0.status).toBe('error');
    expect(state0.snapshot).toBeNull();
    expect(state0.nextRetryAt).not.toBeNull();
    expect(callsFor('tgju')).toBe(1); // the boot attempt

    // Attempt 2 fires after 15 s.
    await vi.advanceTimersByTimeAsync(15_000);
    expect(callsFor('tgju')).toBe(2);

    // Attempt 3 after 30 s more.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(callsFor('tgju')).toBe(3);

    // Attempt 4 after 60 s more (capped backoff).
    await vi.advanceTimersByTimeAsync(60_000);
    expect(callsFor('tgju')).toBe(4);

    // The outage ends: the next retry succeeds and clears the ladder.
    const now = Date.now();
    fetchRates.mockImplementation(async (source: SnapshotSource) =>
      ratesResponse(snap(source, new Date(now).toISOString())),
    );
    await vi.advanceTimersByTimeAsync(60_000);

    const state1 = store.getState().tgju;
    expect(state1.status).toBe('ready');
    expect(state1.snapshot).not.toBeNull();
    expect(state1.nextRetryAt).toBeNull();

    // No zombie retries after success — a full backoff cycle passes silently.
    const calls = callsFor('tgju');
    await vi.advanceTimersByTimeAsync(180_000);
    expect(callsFor('tgju')).toBe(calls);
  });

  it('backoff caps at 60 s — never escalates beyond the steady poll rate', async () => {
    fetchRates.mockRejectedValue(networkError());
    const store = new SnapshotStore();
    store.boot();
    await vi.advanceTimersByTimeAsync(0);

    // Burn 10 failed attempts (15+30+60×8 s).
    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(60_000);
    }
    const attempts = callsFor('tgju');
    expect(attempts).toBeGreaterThanOrEqual(10);

    // The NEXT gap is still 60 s, not more.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(callsFor('tgju')).toBe(attempts + 1);
    const settledAt = Date.now();
    const nextRetryAt = store.getState().tgju.nextRetryAt;
    expect(nextRetryAt).toBeGreaterThan(settledAt);
    expect(nextRetryAt! - settledAt).toBeLessThanOrEqual(60_000);
  });

  it('degraded mode (last-good snapshot) does NOT auto-retry', async () => {
    const now = Date.now();
    seedLocal('tgju', snap('tgju', new Date(now - 10 * 60_000).toISOString()));
    fetchRates.mockRejectedValue(networkError());

    const store = new SnapshotStore();
    store.boot();
    await vi.advanceTimersByTimeAsync(0);

    const state = store.getState().tgju;
    expect(state.status).toBe('ready');
    expect(state.degraded).toBe(true);
    expect(state.snapshot).not.toBeNull(); // last-good keeps being served
    expect(state.nextRetryAt).toBeNull();  // no self-healing schedule

    const calls = callsFor('tgju');
    await vi.advanceTimersByTimeAsync(120_000);
    expect(callsFor('tgju')).toBe(calls); // silence
  });

  it('offline settles do not schedule retries — the online event takes over', async () => {
    online = false;
    fetchRates.mockRejectedValue(networkError());

    const store = new SnapshotStore();
    store.boot();
    await vi.advanceTimersByTimeAsync(0);

    const state = store.getState().tgju;
    expect(state.status).toBe('error');
    expect(state.nextRetryAt).toBeNull(); // offline: no timer

    // Back online: the captured 'online' handler refreshes both sources.
    online = true;
    const now = Date.now();
    fetchRates.mockImplementation(async (source: SnapshotSource) =>
      ratesResponse(snap(source, new Date(now).toISOString())),
    );
    listeners.get('online')?.(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);

    const healed = store.getState().tgju;
    expect(healed.status).toBe('ready');
    expect(healed.snapshot).not.toBeNull();
  });
});

describe('ensureSnapshot (converter entry point)', () => {
  it('resolves the served snapshot once the fetch settles', async () => {
    const now = Date.now();
    fetchRates.mockImplementation(async (source: SnapshotSource) =>
      ratesResponse(snap(source, new Date(now).toISOString())),
    );

    const store = new SnapshotStore();
    const pending = store.ensureSnapshot('frankfurter');
    const resolved = await pending;

    expect(resolved?.base).toBe('USD');
    expect(store.getState().frankfurter.status).toBe('ready');
  });

  it('resolves null and keeps the typed error when nothing is obtainable', async () => {
    fetchRates.mockRejectedValue(networkError());

    const store = new SnapshotStore();
    const resolved = await store.ensureSnapshot('tgju');

    expect(resolved).toBeNull();
    const state = store.getState().tgju;
    expect(state.status).toBe('error');
    expect(state.error).toBeInstanceOf(Error);
  });
});
