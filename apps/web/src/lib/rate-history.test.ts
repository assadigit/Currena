/**
 * rate-history unit tests (BACKLOG #29 remainder — first tests for the
 * sparkline window). House pattern: in-memory window/localStorage stubs,
 * vi.stubGlobal + vi.unstubAllGlobals — never a real fetch
 * (hydrateServerHistory's fetch is stubbed).
 *
 * The module keeps singletons (per-source windows, the hydrated set, the
 * listener set), so every test re-imports it fresh via vi.resetModules() —
 * the same module-state reset the api-package tests use.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snapshot, SnapshotSource } from '@currena/core';

import { MAX_GENERATIONS } from './rate-history';
import type { RateGeneration } from './rate-history';

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

let storage: Storage;

/** Install (or re-install) the window stub; optionally replace fetch. */
function installGlobals(overrides: { localStorage?: Storage; fetch?: unknown } = {}): void {
  storage = overrides.localStorage ?? stubLocalStorage();
  vi.stubGlobal('window', {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  if (overrides.fetch !== undefined) vi.stubGlobal('fetch', overrides.fetch);
}

beforeEach(() => {
  vi.resetModules();
  installGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const T = (n: number): string => new Date(1_760_000_000_000 + n * 60_000).toISOString();

/** A minimal contract-valid snapshot: base USD, rates quoted per 1 USD. */
const snapshot = (source: SnapshotSource, at: string, rates: Record<string, number>): Snapshot => ({
  base: 'USD',
  source,
  fetchedAt: at,
  rates: Object.entries(rates).map(([code, rate]) => ({ code, name: code, rate })),
});

/** The persisted file form (v:1 + compact generations). */
interface HistoryFile {
  v: 1;
  gens: RateGeneration[];
}

const persistedFile = (source: SnapshotSource): HistoryFile | null => {
  const raw = storage.getItem(`currena:rate-history:${source}`);
  return raw === null ? null : (JSON.parse(raw) as HistoryFile);
};

describe('recordGeneration — window + persistence', () => {
  it('appends distinct generations (oldest → newest) in a v:1 file', async () => {
    const { recordGeneration } = await import('./rate-history');
    recordGeneration('frankfurter', snapshot('frankfurter', T(0), { USD: 1, EUR: 0.9 }));
    recordGeneration('frankfurter', snapshot('frankfurter', T(1), { USD: 1, EUR: 0.91 }));
    const file = persistedFile('frankfurter');
    expect(file?.v).toBe(1);
    expect(file?.gens.map((g) => g.at)).toEqual([T(0), T(1)]);
    expect(file?.gens[1]?.rates.EUR).toBe(0.91);
  });

  it('is a no-op when the newest generation repeats (same fetchedAt)', async () => {
    const { recordGeneration } = await import('./rate-history');
    recordGeneration('frankfurter', snapshot('frankfurter', T(1), { USD: 1, EUR: 0.9 }));
    // Same `at`, different rates — the early return keeps the FIRST version.
    recordGeneration('frankfurter', snapshot('frankfurter', T(1), { USD: 1, EUR: 9.99 }));
    const file = persistedFile('frankfurter');
    expect(file?.gens).toHaveLength(1);
    expect(file?.gens[0]?.rates.EUR).toBe(0.9);
  });

  it('replaces (not duplicates) an OLDER `at` — clock-skew defense', async () => {
    const { recordGeneration } = await import('./rate-history');
    recordGeneration('frankfurter', snapshot('frankfurter', T(0), { USD: 1, EUR: 0.9 }));
    recordGeneration('frankfurter', snapshot('frankfurter', T(1), { USD: 1, EUR: 0.91 }));
    // A delayed write for T(0): deduped from its old position, re-appended.
    recordGeneration('frankfurter', snapshot('frankfurter', T(0), { USD: 1, EUR: 0.95 }));
    const file = persistedFile('frankfurter');
    expect(file?.gens).toHaveLength(2);
    expect(file?.gens.map((g) => g.at)).toEqual([T(1), T(0)]);
    expect(file?.gens[1]?.rates.EUR).toBe(0.95);
  });

  it('caps the window at MAX_GENERATIONS — oldest drop off the front', async () => {
    const { recordGeneration } = await import('./rate-history');
    for (let i = 0; i < MAX_GENERATIONS + 5; i++) {
      recordGeneration('frankfurter', snapshot('frankfurter', T(i), { USD: 1 }));
    }
    const gens = persistedFile('frankfurter')?.gens ?? [];
    expect(gens).toHaveLength(MAX_GENERATIONS);
    expect(gens[0]?.at).toBe(T(5)); // the first five fell off
    expect(gens[gens.length - 1]?.at).toBe(T(MAX_GENERATIONS + 4));
  });

  it('keeps the in-memory window when a persist throws (quota)', async () => {
    // First write fails, the second succeeds — the failed generation must
    // still be in the in-memory window (and therefore in the later file).
    let quotaExceeded = true;
    const base = stubLocalStorage();
    installGlobals({
      localStorage: {
        ...base,
        setItem: (k: string, v: string) => {
          if (quotaExceeded) throw new DOMException('quota exceeded', 'QuotaExceededError');
          base.setItem(k, v);
        },
      },
    });
    const { recordGeneration } = await import('./rate-history');
    recordGeneration('frankfurter', snapshot('frankfurter', T(0), { USD: 1, EUR: 0.9 }));
    expect(persistedFile('frankfurter')).toBeNull();
    quotaExceeded = false;
    recordGeneration('frankfurter', snapshot('frankfurter', T(1), { USD: 1, EUR: 0.91 }));
    expect(persistedFile('frankfurter')?.gens.map((g) => g.at)).toEqual([T(0), T(1)]);
  });

  it('discards corrupt stored files on hydration (never renders garbage)', async () => {
    const corrupt = [
      'not json {{{',
      JSON.stringify({ v: 2, gens: [] }), // future version — refused
      JSON.stringify({ v: 1, gens: 'nope' }),
      // Infinity parses from 1e999 — a non-finite rate must be dropped:
      `{"v":1,"gens":[{"at":"${T(0)}","source":"tgju","base":"USD","rates":{"USD":1e999}}]}`,
    ];
    for (const raw of corrupt) {
      vi.resetModules();
      installGlobals();
      storage.setItem('currena:rate-history:tgju', raw);
      const { recordGeneration } = await import('./rate-history');
      recordGeneration('tgju', snapshot('tgju', T(4), { USD: 1 }));
      expect(persistedFile('tgju')?.gens.map((g) => g.at)).toEqual([T(4)]);
    }
  });

  it('drops structurally invalid entries from a mixed stored file, keeps the valid', async () => {
    storage.setItem(
      'currena:rate-history:tgju',
      JSON.stringify({
        v: 1,
        gens: [
          { at: T(0), source: 'manual', base: 'USD', rates: { USD: 1 } }, // bad source
          { at: T(1), source: 'tgju', base: 'USD', rates: { USD: 0 } }, // zero rate
          { at: T(2), source: 'tgju', base: 'USD', rates: { USD: null } }, // JSON null
          { at: T(3), source: 'tgju', base: 'USD', rates: { USD: 1 } }, // VALID
        ],
      }),
    );
    const { recordGeneration } = await import('./rate-history');
    recordGeneration('tgju', snapshot('tgju', T(4), { USD: 1 }));
    expect(persistedFile('tgju')?.gens.map((g) => g.at)).toEqual([T(3), T(4)]);
  });
});

describe('seriesForPair — core conversion math over the window', () => {
  it('converts each generation (rate(to) / rate(from), sig-digit rounding)', async () => {
    const { seriesForPair } = await import('./rate-history');
    const gens: RateGeneration[] = [
      { at: T(0), source: 'frankfurter', base: 'USD', rates: { USD: 1, EUR: 0.9 } },
      { at: T(1), source: 'frankfurter', base: 'USD', rates: { USD: 1, EUR: 0.91 } },
    ];
    expect(seriesForPair(gens, 'USD', 'EUR')).toEqual([0.9, 0.91]);
    expect(seriesForPair(gens, 'EUR', 'USD')[0]).toBeCloseTo(1 / 0.9, 10);
  });

  it('crosses the snapshot base (TGJU: 1 USD → Toman at the quoted rate)', async () => {
    const { seriesForPair } = await import('./rate-history');
    // base IRR with USD quoted per 1 IRR → convert() inverts it exactly.
    const gens: RateGeneration[] = [
      { at: T(0), source: 'tgju', base: 'IRR', rates: { IRR: 1, USD: 1 / 230_500 } },
      { at: T(1), source: 'tgju', base: 'IRR', rates: { IRR: 1, USD: 1 / 230_000 } },
    ];
    expect(seriesForPair(gens, 'USD', 'IRR')).toEqual([230_500, 230_000]);
  });

  it('skips generations where the pair is unresolvable (valid observations only)', async () => {
    const { seriesForPair } = await import('./rate-history');
    const gens: RateGeneration[] = [
      { at: T(0), source: 'frankfurter', base: 'USD', rates: { USD: 1, EUR: 0.9 } },
      { at: T(1), source: 'frankfurter', base: 'USD', rates: { USD: 1 } }, // no EUR quote
      { at: T(2), source: 'frankfurter', base: 'USD', rates: { USD: 1, EUR: 0.92 } },
    ];
    expect(seriesForPair(gens, 'USD', 'EUR')).toEqual([0.9, 0.92]);
    expect(seriesForPair(gens, 'GBP', 'EUR')).toEqual([]); // unknown everywhere
  });
});

describe('trendOf — first→last sparkline caption', () => {
  it('returns null for series with fewer than 2 points', async () => {
    const { trendOf } = await import('./rate-history');
    expect(trendOf([])).toBeNull();
    expect(trendOf([100])).toBeNull();
  });

  it('returns null when the first point is not positive (bad data)', async () => {
    const { trendOf } = await import('./rate-history');
    expect(trendOf([0, 5])).toBeNull();
  });

  it('computes direction + signed percent, first → last', async () => {
    const { trendOf } = await import('./rate-history');
    expect(trendOf([100, 110])).toEqual({ dir: 'up', pct: 10 });
    expect(trendOf([7, 7])).toEqual({ dir: 'flat', pct: 0 });
    const down = trendOf([110, 100]);
    expect(down?.dir).toBe('down');
    expect(down?.pct).toBeCloseTo(-100 / 11, 10); // (100−110)/110 × 100
  });
});

describe('hydrateServerHistory — server merge (fetch stubbed, no network)', () => {
  const gen = (at: string, eur: number): RateGeneration => ({
    at,
    source: 'frankfurter',
    base: 'USD',
    rates: { USD: 1, EUR: eur },
  });

  const okResponse = (generations: unknown): unknown => ({
    ok: true,
    json: async () => ({
      source: 'frankfurter',
      count: Array.isArray(generations) ? generations.length : 0,
      generations,
    }),
  });

  it('merges the server window: union by `at`, server wins, sorted oldest→newest', async () => {
    installGlobals({
      fetch: vi.fn(async (url: string) =>
        String(url).includes('source=frankfurter')
          ? okResponse([gen(T(0), 0.9), gen(T(5), 0.95), gen(T(2), 0.99)])
          : okResponse([]),
      ),
    });
    vi.resetModules();
    const { recordGeneration, hydrateServerHistory } = await import('./rate-history');
    // Local has T(2) with EUR 0.91 — the server's T(2) (0.99) must win.
    recordGeneration('frankfurter', snapshot('frankfurter', T(2), { USD: 1, EUR: 0.91 }));
    await hydrateServerHistory();
    expect(persistedFile('frankfurter')?.gens).toEqual([
      gen(T(0), 0.9),
      gen(T(2), 0.99),
      gen(T(5), 0.95),
    ]);
  });

  it('filters structurally invalid server generations before merging', async () => {
    installGlobals({
      fetch: vi.fn(async (url: string) =>
        String(url).includes('source=frankfurter')
          ? okResponse([
              { at: T(1), source: 'manual', base: 'USD', rates: { USD: 1 } },
              { at: T(2), source: 'frankfurter', base: 'USD', rates: { USD: -1 } },
              'garbage',
              gen(T(3), 0.93),
            ])
          : okResponse([]),
      ),
    });
    vi.resetModules();
    const { hydrateServerHistory } = await import('./rate-history');
    await hydrateServerHistory();
    expect(persistedFile('frankfurter')?.gens).toEqual([gen(T(3), 0.93)]);
  });

  it('is one-shot per session — a second call never refetches', async () => {
    const fetchMock = vi.fn(async () => okResponse([]));
    installGlobals({ fetch: fetchMock });
    vi.resetModules();
    const { hydrateServerHistory } = await import('./rate-history');
    await hydrateServerHistory();
    expect(fetchMock).toHaveBeenCalledTimes(2); // tgju + frankfurter, once each
    await hydrateServerHistory();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stays silent on HTTP errors, network failure, and malformed payloads', async () => {
    // HTTP error for tgju; network rejection for frankfurter.
    installGlobals({
      fetch: vi.fn(async (url: string) => {
        if (String(url).includes('source=tgju')) return { ok: false, json: async () => ({}) };
        throw new TypeError('fetch failed');
      }),
    });
    vi.resetModules();
    const { hydrateServerHistory, recordGeneration } = await import('./rate-history');
    recordGeneration('frankfurter', snapshot('frankfurter', T(0), { USD: 1, EUR: 0.9 }));
    await expect(hydrateServerHistory()).resolves.toBeUndefined();
    expect(persistedFile('frankfurter')?.gens).toHaveLength(1); // local window intact
    expect(persistedFile('tgju')).toBeNull();

    // generations is not an array → no merge, no throw.
    installGlobals({ fetch: vi.fn(async () => okResponse('nope')) });
    vi.resetModules();
    const fresh = await import('./rate-history');
    await expect(fresh.hydrateServerHistory()).resolves.toBeUndefined();
  });
});
