/**
 * history.ts tests (QA audit C-1 — this module had zero coverage).
 *
 * Pins the Task-24 write discipline (the 2026-10-16 relative deadband —
 * sub-noise re-quotes are no-ops, genuine moves record; same-generation
 * replace, the 240-generation cap) and the poisoned-entry read defense,
 * plus the KV failure contract the /api/history route relies on (readHistory
 * REJECTS on a KV read failure — the route turns that into the calm 503; see
 * index.test.ts "rate history" block).
 *
 * No Workers, no live sites: KVNamespace is faked with an in-memory Map.
 */

import type { Snapshot } from '@currena/core';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  HISTORY_MAX_GENERATIONS,
  HISTORY_RECORD_DEADBAND,
  readHistory,
  recordHistory,
  toHistoryGeneration,
} from './history';

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

function tgjuSnapshot(fetchedAt: string, usdToman: number, extra?: Snapshot['rates']): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / usdToman },
      ...(extra ?? []),
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

  it('a SUB-DEADBAND re-quote is a no-op even though the value changed (the 2026-10-16 jitter fix)', async () => {
    // 230,500 → 230,600 = +0.0434% < HISTORY_RECORD_DEADBAND (0.05%) —
    // the per-tick TGJU jitter that used to record every 6 minutes.
    expect(230_600 / 230_500 - 1).toBeLessThan(HISTORY_RECORD_DEADBAND);
    await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    const wrote = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:05:00Z', 230_600));
    expect(wrote).toBe(false);
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(1);
    expect(gens[0]!.rates.USD).toBe(1 / 230_500); // recorded LEVEL kept
  });

  it('a move at/above the deadband records (real market moves always append)', async () => {
    // 230,500 → 230,700 = +0.0868% ≥ 0.05%.
    expect(230_700 / 230_500 - 1).toBeGreaterThanOrEqual(HISTORY_RECORD_DEADBAND);
    await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    const wrote = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:05:00Z', 230_700));
    expect(wrote).toBe(true);
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(2);
    expect(gens[1]!.rates.USD).toBe(1 / 230_700);
  });

  it('hysteresis vs the last RECORDED level: oscillating jitter never accumulates, drift records at its first crossing', async () => {
    await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    // ±0.02% wiggle around the recorded level — every tick sub-deadband.
    for (const [i, tomans] of [230_540, 230_460, 230_540, 230_460].entries()) {
      const wrote = await recordHistory(
        harness.kv,
        'tgju',
        tgjuSnapshot(`2026-10-14T10:0${i + 1}:00Z`, tomans),
      );
      expect(wrote).toBe(false);
    }
    expect(await readHistory(harness.kv, 'tgju')).toHaveLength(1);
    // A genuine drift step crosses the band vs the RECORDED level (230,500).
    const wrote = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:10:00Z', 230_620));
    expect(wrote).toBe(true); // +0.0521% vs the recorded level
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(2);
    // ...and the next sub-deadband wiggle is a no-op vs the NEW level.
    const wrote2 = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:15:00Z', 230_660));
    expect(wrote2).toBe(false); // +0.0174% vs the recorded 230,620
  });

  it('a rate joining/leaving the snapshot is always a material change', async () => {
    await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    const withEur: Snapshot['rates'] = [
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 1 / 250_000 },
    ];
    const wrote = await recordHistory(
      harness.kv,
      'tgju',
      tgjuSnapshot('2026-10-14T10:05:00Z', 230_500, withEur),
    );
    expect(wrote).toBe(true);
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(2);
    expect(gens[1]!.rates.EUR).toBe(1 / 250_000);
  });

  it('re-recording the SAME generation (same fetchedAt) replaces, never duplicates', async () => {
    await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 230_500));
    const wrote = await recordHistory(harness.kv, 'tgju', tgjuSnapshot('2026-10-14T10:00:00Z', 231_000));
    expect(wrote).toBe(true);
    const gens = await readHistory(harness.kv, 'tgju');
    expect(gens).toHaveLength(1);
    expect(gens[0]!.rates.USD).toBe(1 / 231_000);
  });

  it('order-independent comparison: rate key order must not create a phantom change', async () => {
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
    // +500 tomans per step = +0.217% — every step crosses the record
    // deadband, so every scrape appends and the CAP is what gets exercised.
    for (let i = 0; i < HISTORY_MAX_GENERATIONS + 10; i++) {
      await recordHistory(
        harness.kv,
        'tgju',
        tgjuSnapshot(`2026-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`, 230_000 + i * 500),
      );
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
