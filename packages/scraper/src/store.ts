/**
 * RateStore — the ONLY way business logic touches storage (AGENTS.md rule 2).
 *
 * Platform-free by construction: no KV, no D1, no node:* — just async methods
 * over plain data. `apps/api/src/adapters/kv-store.ts` implements this over a
 * Workers KV binding; a KV→D1 (or any backend) migration is a swap of that
 * adapter, nothing else.
 *
 * `InMemoryRateStore` is a reference implementation used by tests and local dev.
 */

import type { Snapshot, SnapshotSource, SourceStatus } from '@currena/core';

// The SourceStatus contract lives in @currena/core (rule #3: contracts are
// zod schemas in core/schemas.ts) so the KV adapter can validate it on read.
export type { SourceStatus };

/** Storage port for snapshots, statuses and best-effort single-flight locks. */
export interface RateStore {
  /** Cached snapshot for a source, or undefined when absent/expired. */
  getSnapshot(source: SnapshotSource): Promise<Snapshot | undefined>;
  /** Persist a snapshot (JSON). `ttlSec` is a hard-expiry hint (cache eviction). */
  putSnapshot(source: SnapshotSource, snapshot: Snapshot, ttlSec: number): Promise<void>;
  /** Persisted status for a source, or undefined. */
  getStatus(source: SnapshotSource): Promise<SourceStatus | undefined>;
  putStatus(source: SnapshotSource, status: SourceStatus): Promise<void>;
  /**
   * Best-effort single-flight lock: returns true when the caller now owns the
   * lock for `ttlSec`, false when another in-flight scrape holds it. The
   * owner MUST call `releaseLock` when done (a TTL guards against leaked locks).
   */
  tryAcquireLock(source: SnapshotSource, ttlSec: number): Promise<boolean>;
  releaseLock(source: SnapshotSource): Promise<void>;
}

/**
 * In-memory RateStore — reference implementation for tests and local tooling.
 * Honors snapshot TTLs and lock TTLs logically (no background eviction needed).
 */
export class InMemoryRateStore implements RateStore {
  private readonly snapshots = new Map<string, { snapshot: Snapshot; expiresAtMs: number }>();
  private readonly statuses = new Map<string, SourceStatus>();
  private readonly locks = new Map<string, number>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  async getSnapshot(source: SnapshotSource): Promise<Snapshot | undefined> {
    const entry = this.snapshots.get(`snapshot:${source}`);
    if (!entry) return undefined;
    if (this.now() >= entry.expiresAtMs) {
      this.snapshots.delete(`snapshot:${source}`);
      return undefined;
    }
    return entry.snapshot;
  }

  async putSnapshot(source: SnapshotSource, snapshot: Snapshot, ttlSec: number): Promise<void> {
    this.snapshots.set(`snapshot:${source}`, {
      snapshot,
      expiresAtMs: this.now() + ttlSec * 1000,
    });
  }

  async getStatus(source: SnapshotSource): Promise<SourceStatus | undefined> {
    return this.statuses.get(`status:${source}`);
  }

  async putStatus(source: SnapshotSource, status: SourceStatus): Promise<void> {
    this.statuses.set(`status:${source}`, status);
  }

  async tryAcquireLock(source: SnapshotSource, ttlSec: number): Promise<boolean> {
    const key = `lock:${source}`;
    const heldUntil = this.locks.get(key);
    if (heldUntil !== undefined && this.now() < heldUntil) return false;
    this.locks.set(key, this.now() + ttlSec * 1000);
    return true;
  }

  async releaseLock(source: SnapshotSource): Promise<void> {
    this.locks.delete(`lock:${source}`);
  }
}
