/**
 * history.ts tests (QA audit C-1 — this module had zero coverage).
 *
 * Pins the Task-24 write discipline (content-dedup, same-generation replace,
 * the 240-generation cap) and the poisoned-entry read defense, plus the KV
 * failure contract the /api/history route relies on (readHistory REJECTS on
 * a KV read failure — the route turns that into the calm 503; see
 * index.test.ts "rate history" block).
 *
 * No Workers, no live sites: KVNamespace is faked with an in-memory Map.
 */

import type { Snapshot } from '@currena/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { HISTORY_MAX_GENERATIONS, readHistory, recordHistory, toHistoryGeneration } from './history';

/** Minimal in-memory KV fake — string values, `get`/`put`/`delete`. */
function makeKv(opts: { failReads?: boolean } = {}) {
  const map = new Map<string, string>();
  return {
    map,
    kv: {
      get: async (key: string): Promise<string | null> => {
        if (opts.failReads) throw new Error('KV unavailable');
        return map.get(key) ?? null;
      },
      put: async (key: string, value: string): Promise<void> => {
        map.set(key, value);
      },
      delete: async (key: string): Promise<void> => {
        map.delete(key);
      },
    } as unknown as KVNamespace,
  };
}

function tgjuSnapshot(fetchedAt: string, usdToman: number): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / usdToman },
    ],
  };
}

describe('recordHistory — the Task-24 write discipline', () => {
  let harness: ReturnType<typeof makeKv>;

  beforeEach(() => {
    harness = makeKv();
  });

  it('appends a generation when the rate VALUES changed', async () => {
    const wrote = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    expect(wrote).toBe(true);
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(1);
    expect(gens[0]!.at).toBe('2026-10-14T10:00:00Z');
    expect(gens[0]!.rates.USD).toBe(1 / 230_500);
  });

  it('a same-value re-quote (different fetchedAt, identical rates) is a NO-OP', async () => {
    await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    const wrote = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:05:00Z', 230_500));
    expect(wrote).toBe(false);
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(1);
    expect(gens[0]!.at).toBe('2026-10-14T10:00:00Z'); // original kept
  });

  it('re-recording the SAME generation (same fetchedAt) replaces, never duplicates', async () => {
    await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    const wrote = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 231_000));
    expect(wrote).toBe(true);
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(1);
    expect(gens[0]!.rates.USD).toBe(1 / 231_000);
  });

  it('order-independent fingerprint: rate key order must not create a phantom change', async () => {
    const a = toHistoryGeneration(tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    const reversedRates = Object.fromEntries(Object.entries(a.rates).reverse());
    await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    // Manually write a file whose last entry has reversed key order but identical values.
    harness.map.set(
      'history:tgju',
      JSON.stringify({ v: 1, gens: [{ ...a, rates: reversedRates }] }),
    );
    const wrote = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:05:00Z', 230_500));
    expect(wrote).toBe(false); // same values → no write, despite key order
  });

  it('caps the rolling window at HISTORY_MAX_GENERATIONS (oldest drop off)', async () => {
    for (let i = 0; i < HISTORY_MAX_GENERATIONS + 10; i++) {
      await recordHistory(harness.kv, 'tgju', tgjuSnapshot(`2026-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`, 230_000 + i));
    }
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(HISTORY_MAX_GENERATIONS);
    // The newest survives; the very first 10 entries dropped off the front.
    expect(gens[0]!.at).toBe('2026-10-11T10:00:00Z');
    expect(gens[gens.length - 1]!.at).toBe('2026-10-250T10:00:00Z');
  });

  it('a KV put failure propagates (the caller already treats recording as best-effort)', async () => {
    const kv = {
      get: async () => null,
      put: async () => {
        throw new Error('write cap exceeded');
      },
    } as unknown as KVNamespace;
    await expect(recordHistory(kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500))).rejects.toThrow(
      'write cap exceeded',
    );
  });
});

describe('readHistory — poisoned-entry defense', () => {
  it('missing key → empty list', async () => {
    const { kv } = makeKv();
    expect(await readHistory(kv, 'tgju')).toEqual([]);
  });

  it('malformed JSON → empty list (never a 500)', async () => {
    const { kv, map } = makeKv();
    map.set('history:tgju', 'not json at all');
    expect(await readHistory(kv, 'tgju')).toEqual([]);
  });

  it('drops structurally-invalid generations, keeps the valid ones', async () => {
    const { kv, map } = makeKv();
    const good = toHistoryGeneration(tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    map.set(
      'history:tgju',
      JSON.stringify({
        v: 1,
        gens: [
          good,
          { at: '2026-10-14T11:00:00Z', source: 'tgju', base: 'IRR', rates: { USD: -5 } }, // non-positive
          { at: '2026-10-14T12:00:00Z', source: 'nope', base: 'IRR', rates: { USD: 1 } }, // bad source
          { at: 123, source: 'tgju', base: 'IRR', rates: { USD: 1 } }, // non-string at
          null, // not an object
        ],
      }),
    );
    const gens = await readHistory(kv, 'tgju');
    expect(gens).toHaveLength(1);
    expect(gens[0]!.at).toBe('2026-10-14T10:00:00Z');
  });

  it('a wrong file version → empty list', async () => {
    const { kv, map } = makeKv();
    map.set('history:tgju', JSON.stringify({ v: 2, gens: [] }));
    expect(await readHistory(kv, 'tgju')).toEqual([]);
  });

  it('a KV read failure REJECTS (the route converts this into the calm 503)', async () => {
    const { kv } = makeKv({ failReads: true });
    await expect(readHistory(kv, 'tgju')).rejects.toThrow('KV unavailable');
  });
});
