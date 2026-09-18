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

    const token = await store.tryAcquireLock('tgju', 25);
    expect(typeof token).toBe('string'); // acquired → ownership token
    expect(await store.tryAcquireLock('tgju', 25)).toBe(false); // held
    await store.releaseLock('tgju', token as string);
    expect(await store.tryAcquireLock('tgju', 25)).not.toBe(false); // re-acquired after release

    const again = await store.tryAcquireLock('tgju', 25);
    await store.releaseLock('tgju', again as string);
    nowMs += 26_000; // past the lock TTL — a leaked lock self-expires
    expect(await store.tryAcquireLock('tgju', 25)).not.toBe(false);
  });

  it('releaseLock is token-scoped: an overran holder cannot delete a successor lock', async () => {
    let nowMs = 1_000_000;
    const store = new InMemoryRateStore(() => nowMs);

    const holderA = (await store.tryAcquireLock('tgju', 25)) as string;
    nowMs += 26_000; // A overruns its TTL
    const holderB = (await store.tryAcquireLock('tgju', 25)) as string; // B takes over
    expect(holderB).not.toBe(holderA);

    // A's late release must NOT delete B's lock (used to admit a 3rd scrape).
    await store.releaseLock('tgju', holderA);
    expect(await store.tryAcquireLock('tgju', 25)).toBe(false); // B still holds

    await store.releaseLock('tgju', holderB); // rightful release works
    expect(await store.tryAcquireLock('tgju', 25)).not.toBe(false);
  });

  it('keeps sources isolated (tgju lock does not block frankfurter)', async () => {
    const store = new InMemoryRateStore();
    expect(await store.tryAcquireLock('tgju', 25)).not.toBe(false);
    expect(await store.tryAcquireLock('frankfurter', 25)).not.toBe(false);
  });
});
