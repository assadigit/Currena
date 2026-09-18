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

import { CACHE_HARD_TTL_SEC, SnapshotSchema, SourceStatusSchema } from '@currena/core';
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
      // Same poisoned-entry defense as snapshots (rule #3): an invalid
      // status is treated as absent, never trusted as-is.
      return SourceStatusSchema.parse(JSON.parse(raw));
    } catch {
      console.warn(`[kv-store] status:${source} failed validation — ignoring cached value`);
      return undefined;
    }
  }

  async putStatus(source: SnapshotSource, status: SourceStatus): Promise<void> {
    await this.kv.put(`status:${source}`, JSON.stringify(status));
  }

  async tryAcquireLock(source: SnapshotSource, ttlSec: number): Promise<string | false> {
    const key = `lock:${source}`;
    const raw = await this.kv.get(key);
    if (raw !== null) {
      // Expiry is the part before '|' (legacy markers written before the
      // token-suffix change have no '|' at all — still parseable).
      const pipeAt = raw.indexOf('|');
      const heldUntil = Date.parse(pipeAt === -1 ? raw : raw.slice(0, pipeAt));
      if (Number.isFinite(heldUntil) && heldUntil > Date.now()) return false; // held
      // expired marker — fall through and take over
    }
    // The stored marker IS the ownership token (expiry + random suffix);
    // releaseLock only deletes when it still matches, so an overran holder
    // cannot delete a successor's lock. (KV has no compare-and-delete, so the
    // release check is read-then-delete — a much narrower race than before.)
    const token = `${new Date(Date.now() + ttlSec * 1000).toISOString()}|${Math.random().toString(36).slice(2, 10)}`;
    await this.kv.put(key, token, {
      expirationTtl: Math.max(KV_MIN_TTL_SEC, ttlSec), // KV cleanup ≥ logical TTL
    });
    return token;
  }

  async releaseLock(source: SnapshotSource, token: string): Promise<void> {
    const key = `lock:${source}`;
    const raw = await this.kv.get(key);
    if (raw === token) {
      await this.kv.delete(key);
    }
  }
}
