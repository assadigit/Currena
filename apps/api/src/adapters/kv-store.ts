/**
 * Workers KV adapter for the RateStore port (AGENTS.md rule 2: all storage
 * access goes through RateStore; a KV→D1 migration is a swap of this file).
 *
 * KV layout:
 *   snapshot:<source>  — JSON Snapshot, expirationTtl = CACHE_HARD_TTL_SEC (7d)
 *   status:<source>    — JSON SourceStatus, no expiry (operational history)
 *   lock:<source>      — lock owner marker; value = ISO expiry, KV TTL ≥ 60s
 *                        (KV's minimum) while the LOGICAL lock ttl can be 25s.
 *
 * KV has no atomic put-if-absent, so the lock is best-effort single-flight
 * (mission wording) — two concurrent cold-start requests may both scrape; the
 * ladder tolerates that (same data, idempotent writes).
 */

import { CACHE_HARD_TTL_SEC, SnapshotSchema } from '@currena/core';
import type { Snapshot, SnapshotSource } from '@currena/core';
import type { RateStore, SourceStatus } from '@currena/scraper';

/** KV rejects expirationTtl < 60s. */
const KV_MIN_TTL_SEC = 60;

export class KvRateStore implements RateStore {
  constructor(private readonly kv: KVNamespace) {}

  async getSnapshot(source: SnapshotSource): Promise<Snapshot | undefined> {
    const raw = await this.kv.get(`snapshot:${source}`);
    if (raw === null) return undefined;
    try {
      return SnapshotSchema.parse(JSON.parse(raw));
    } catch {
      // Poisoned cache entry — treat as absent so the ladder rescrapes.
      console.warn(`[kv-store] snapshot:${source} failed validation — ignoring cached value`);
      return undefined;
    }
  }

  async putSnapshot(source: SnapshotSource, snapshot: Snapshot, ttlSec: number = CACHE_HARD_TTL_SEC): Promise<void> {
    await this.kv.put(`snapshot:${source}`, JSON.stringify(snapshot), {
      expirationTtl: Math.max(KV_MIN_TTL_SEC, ttlSec),
    });
  }

  async getStatus(source: SnapshotSource): Promise<SourceStatus | undefined> {
    const raw = await this.kv.get(`status:${source}`);
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw) as SourceStatus;
    } catch {
      console.warn(`[kv-store] status:${source} is corrupt — ignoring`);
      return undefined;
    }
  }

  async putStatus(source: SnapshotSource, status: SourceStatus): Promise<void> {
    await this.kv.put(`status:${source}`, JSON.stringify(status));
  }

  async tryAcquireLock(source: SnapshotSource, ttlSec: number): Promise<boolean> {
    const key = `lock:${source}`;
    const raw = await this.kv.get(key);
    if (raw !== null) {
      const heldUntil = Date.parse(raw);
      if (Number.isFinite(heldUntil) && heldUntil > Date.now()) return false; // held
      // expired marker — fall through and take over
    }
    await this.kv.put(key, new Date(Date.now() + ttlSec * 1000).toISOString(), {
      expirationTtl: Math.max(KV_MIN_TTL_SEC, ttlSec), // KV cleanup ≥ logical TTL
    });
    return true;
  }

  async releaseLock(source: SnapshotSource): Promise<void> {
    await this.kv.delete(`lock:${source}`);
  }
}
