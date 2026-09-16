import type { Snapshot } from '@currena/core';
import { describe, expect, it } from 'vitest';
import { InMemoryRateStore } from './store';

const snapshot: Snapshot = {
  base: 'IRR',
  source: 'tgju',
  fetchedAt: '2026-09-16T12:00:00.000Z',
  rates: [
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
  ],
};

describe('InMemoryRateStore', () => {
  it('stores and returns snapshots per source', async () => {
    const store = new InMemoryRateStore();
    await store.putSnapshot('tgju', snapshot, 300);

    const cached = await store.getSnapshot('tgju');
    expect(cached?.base).toBe('IRR');
    expect(await store.getSnapshot('frankfurter')).toBeUndefined();
  });

  it('honors the snapshot TTL (hard eviction)', async () => {
    let nowMs = 1_000_000;
    const store = new InMemoryRateStore(() => nowMs);

    await store.putSnapshot('tgju', snapshot, 300); // 300s ttl
    nowMs += 299_000;
    expect(await store.getSnapshot('tgju')).toBeDefined();

    nowMs += 2_000; // past the TTL
    expect(await store.getSnapshot('tgju')).toBeUndefined();
  });

  it('stores and returns status per source', async () => {
    const store = new InMemoryRateStore();
    expect(await store.getStatus('tgju')).toBeUndefined();

    const status = {
      source: 'tgju' as const,
      lastScrapeAt: '2026-09-16T12:00:00.000Z',
      lastSuccessAt: '2026-09-16T12:00:00.000Z',
      lastDurationMs: 210,
    };
    await store.putStatus('tgju', status);
    expect(await store.getStatus('tgju')).toEqual(status);
  });

  it('implements best-effort single-flight locks with TTL', async () => {
    let nowMs = 1_000_000;
    const store = new InMemoryRateStore(() => nowMs);

    expect(await store.tryAcquireLock('tgju', 25)).toBe(true); // acquired
    expect(await store.tryAcquireLock('tgju', 25)).toBe(false); // held
    await store.releaseLock('tgju');
    expect(await store.tryAcquireLock('tgju', 25)).toBe(true); // re-acquired after release

    await store.releaseLock('tgju');
    nowMs += 26_000; // past the lock TTL — a leaked lock self-expires
    expect(await store.tryAcquireLock('tgju', 25)).toBe(true);
  });

  it('keeps sources isolated (tgju lock does not block frankfurter)', async () => {
    const store = new InMemoryRateStore();
    expect(await store.tryAcquireLock('tgju', 25)).toBe(true);
    expect(await store.tryAcquireLock('frankfurter', 25)).toBe(true);
  });
});
