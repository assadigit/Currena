/**
 * Default service construction (Phase 3 split of the former index.ts
 * monolith): the KvRateStore-backed RatesService with the isolate-lifetime
 * snapshot micro-cache.
 *
 * Isolate-lifetime micro-cache for snapshot reads: Workers reuses isolates
 * across requests, and every /api/rates request inside the fresh window pays
 * a KV read for the SAME unchanged snapshot — a 5s memo removes almost all
 * of those reads (KV reads are billed and eventually consistent). Writes
 * refresh the memo so a just-scraped snapshot is served immediately.
 */

import type { Snapshot, SnapshotSource } from '@currena/core';
import { scrapeFrankfurter, scrapeTgju } from '@currena/scraper';
import { KvRateStore } from './adapters/kv-store';
import { RatesService } from './rates-service';
import type { Bindings } from './index';

const SNAPSHOT_MEMO_TTL_MS = 5_000;
const snapshotMemo = new Map<SnapshotSource, { snapshot: Snapshot | undefined; readAtMs: number }>();
let defaultStore: KvRateStore | undefined;

export function makeDefaultService(env: Bindings): RatesService {
  defaultStore ??= new KvRateStore(env.RATES);
  const store = {
    getSnapshot: async (source: SnapshotSource): Promise<Snapshot | undefined> => {
      const hit = snapshotMemo.get(source);
      if (hit !== undefined && Date.now() - hit.readAtMs < SNAPSHOT_MEMO_TTL_MS) return hit.snapshot;
      const snapshot = await defaultStore!.getSnapshot(source);
      snapshotMemo.set(source, { snapshot, readAtMs: Date.now() });
      return snapshot;
    },
    putSnapshot: async (source: SnapshotSource, snapshot: Snapshot, ttlSec: number): Promise<void> => {
      snapshotMemo.set(source, { snapshot, readAtMs: Date.now() });
      await defaultStore!.putSnapshot(source, snapshot, ttlSec);
    },
    getStatus: (source: SnapshotSource) => defaultStore!.getStatus(source),
    putStatus: (source: SnapshotSource, status: Parameters<KvRateStore['putStatus']>[1]) =>
      defaultStore!.putStatus(source, status),
    tryAcquireLock: (source: SnapshotSource, ttlSec: number) => defaultStore!.tryAcquireLock(source, ttlSec),
    releaseLock: (source: SnapshotSource, token: string) => defaultStore!.releaseLock(source, token),
  };
  return new RatesService({
    store,
    scrapers: {
      tgju: () => scrapeTgju(),
      frankfurter: () => scrapeFrankfurter(),
    },
  });
}

/**
 * Test-only: reset the isolate-local snapshot memo + store singleton
 * (the scheduled-handler tests drive `runScheduled` per case with their own
 * fake KV bindings — both singletons would otherwise leak the first case's
 * store into every later one, exactly like the rate limiter).
 */
export function __resetSnapshotMemoForTests(): void {
  snapshotMemo.clear();
  defaultStore = undefined;
}
