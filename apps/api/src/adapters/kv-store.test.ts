import type { Snapshot } from '@currena/core';
import { describe, expect, it, vi } from 'vitest';
import { KvRateStore } from './kv-store';

/** Minimal in-memory KVNamespace fake (get/put/delete + expirationTtl). */
class FakeKV {
  private readonly entries = new Map<string, { value: string; expiresAtMs: number | null }>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAtMs !== null && this.now() >= entry.expiresAtMs) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  async put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void> {
    this.entries.set(key, {
      value,
      expiresAtMs: opts?.expirationTtl !== undefined ? this.now() + opts.expirationTtl * 1000 : null,
    });
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  ttlOf(key: string): number | null {
    const entry = this.entries.get(key);
    if (!entry || entry.expiresAtMs === null) return null;
    return Math.round((entry.expiresAtMs - this.now()) / 1000);
  }
}

const snapshot: Snapshot = {
  base: 'IRR',
  source: 'tgju',
  fetchedAt: '2026-09-16T12:00:00.000Z',
  rates: [
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
  ],
};

function store(kv: FakeKV): KvRateStore {
  return new KvRateStore(kv as unknown as KVNamespace);
}

describe('KvRateStore (over FakeKV)', () => {
  it('round-trips a snapshot as JSON under snapshot:<source>', async () => {
    const kv = new FakeKV();
    await store(kv).putSnapshot('tgju', snapshot);

    const cached = await store(kv).getSnapshot('tgju');
    expect(cached).toEqual(snapshot); // JSON round-trip preserves the contract
    expect(await store(kv).getSnapshot('frankfurter')).toBeUndefined();
  });

  it('defaults putSnapshot TTL to CACHE_HARD_TTL_SEC (7d, KV floor 60s)', async () => {
    const kv = new FakeKV();
    await store(kv).putSnapshot('tgju', snapshot);
    expect(kv.ttlOf('snapshot:tgju')).toBe(7 * 24 * 3600);

    await store(kv).putSnapshot('tgju', snapshot, 25); // below KV's 60s minimum
    expect(kv.ttlOf('snapshot:tgju')).toBe(60);
  });

  it('treats a poisoned/invalid cache entry as absent', async () => {
    const kv = new FakeKV();
    await kv.put('snapshot:tgju', '{"base":not json');
    expect(await store(kv).getSnapshot('tgju')).toBeUndefined();
  });

  it('round-trips status under status:<source>', async () => {
    const kv = new FakeKV();
    const status = {
      source: 'tgju' as const,
      lastScrapeAt: '2026-09-16T12:00:00.000Z',
      lastSuccessAt: '2026-09-16T12:00:00.000Z',
      lastError: { code: 'tgju_scrape_failed', message: 'boom', at: '2026-09-16T11:00:00.000Z' },
      lastDurationMs: 321,
    };
    await store(kv).putStatus('tgju', status);
    expect(await store(kv).getStatus('tgju')).toEqual(status);
    expect(await store(kv).getStatus('frankfurter')).toBeUndefined();
  });

  it('treats a poisoned/invalid status entry as absent (same defense as snapshots)', async () => {
    const kv = new FakeKV();
    await kv.put('status:tgju', 'not json at all');
    expect(await store(kv).getStatus('tgju')).toBeUndefined();
  });

  it('rejects a structurally invalid status (bad source, negative duration, bad dates)', async () => {
    const kv = new FakeKV();
    // Wrong source enum.
    await kv.put('status:tgju', JSON.stringify({ source: 'bogus' }));
    expect(await store(kv).getStatus('tgju')).toBeUndefined();
    // Negative duration — impossible from the ladder, poison if present.
    await kv.put('status:tgju', JSON.stringify({ source: 'tgju', lastDurationMs: -5 }));
    expect(await store(kv).getStatus('tgju')).toBeUndefined();
    // Non-ISO datetime.
    await kv.put('status:tgju', JSON.stringify({ source: 'tgju', lastScrapeAt: 'yesterday' }));
    expect(await store(kv).getStatus('tgju')).toBeUndefined();
    // lastError with a missing field.
    await kv.put('status:tgju', JSON.stringify({ source: 'tgju', lastError: { code: 'x' } }));
    expect(await store(kv).getStatus('tgju')).toBeUndefined();
  });

  it('strips unknown keys from a status entry (strip mode, no passthrough)', async () => {
    const kv = new FakeKV();
    await kv.put(
      'status:tgju',
      JSON.stringify({ source: 'tgju', lastDurationMs: 42, injected: '<script>' }),
    );
    const status = await store(kv).getStatus('tgju');
    expect(status).toEqual({ source: 'tgju', lastDurationMs: 42 });
  });

  it('best-effort lock: acquire / block / token-scoped release', async () => {
    const kv = new FakeKV();
    const s = store(kv);

    const token = await s.tryAcquireLock('tgju', 25);
    expect(typeof token).toBe('string');
    expect(await s.tryAcquireLock('tgju', 25)).toBe(false);
    const other = await s.tryAcquireLock('frankfurter', 25); // per-source isolation
    expect(typeof other).toBe('string');

    // A stale token (from an overran holder) must not release the current lock.
    await s.releaseLock('tgju', 'stale-token');
    expect(await s.tryAcquireLock('tgju', 25)).toBe(false); // still held

    await s.releaseLock('tgju', token as string);
    expect(await s.tryAcquireLock('tgju', 25)).not.toBe(false);
  });

  it('lock self-expires after its logical TTL (value timestamp, not the KV TTL)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const t0 = Date.parse('2026-09-16T12:00:00.000Z');
      vi.setSystemTime(t0);
      const kv = new FakeKV();
      const s = store(kv);

      expect(await s.tryAcquireLock('tgju', 25)).not.toBe(false);
      vi.setSystemTime(t0 + 26_000); // past the 25s logical TTL
      expect(await s.tryAcquireLock('tgju', 25)).not.toBe(false); // take over the leaked lock
    } finally {
      vi.useRealTimers();
    }
  });

  it('accepts legacy-format lock markers (no token suffix) and still honors their expiry', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const t0 = Date.parse('2026-09-16T12:00:00.000Z');
      vi.setSystemTime(t0);
      const kv = new FakeKV();
      const s = store(kv);

      // Marker written by the pre-token KV writer: bare ISO datetime.
      await kv.put('lock:tgju', new Date(t0 + 25_000).toISOString());
      expect(await s.tryAcquireLock('tgju', 25)).toBe(false); // still held

      vi.setSystemTime(t0 + 26_000); // expired
      expect(await s.tryAcquireLock('tgju', 25)).not.toBe(false); // takeover
    } finally {
      vi.useRealTimers();
    }
  });
});
