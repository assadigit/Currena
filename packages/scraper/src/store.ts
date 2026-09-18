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
   * Best-effort single-flight lock: returns an opaque ownership token when
   * the caller now owns the lock for `ttlSec`, or false when another
   * in-flight scrape holds it. The owner MUST call `releaseLock(token)` when
   * done; release only takes effect while the token still matches (an
   * overran holder can no longer delete a successor's lock). A TTL guards
   * against leaked locks.
   */
  tryAcquireLock(source: SnapshotSource, ttlSec: number): Promise<string | false>;
  /** Release the lock iff the stored marker still equals `token`. */
  releaseLock(source: SnapshotSource, token: string): Promise<void>;
}

/**
 * In-memory RateStore — reference implementation for tests and local tooling.
 * Honors snapshot TTLs and lock TTLs logically (no background eviction needed).
 */
export class InMemoryRateStore implements RateStore {
  private readonly snapshots = new Map<string, { snapshot: Snapshot; expiresAtMs: number }>();
  private readonly statuses = new Map<string, SourceStatus>();
  private readonly locks = new Map<string, { token: string; heldUntilMs: number }>();

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

  async tryAcquireLock(source: SnapshotSource, ttlSec: number): Promise<string | false> {
    const key = `lock:${source}`;
    const held = this.locks.get(key);
    if (held !== undefined && this.now() < held.heldUntilMs) return false;
    const heldUntilMs = this.now() + ttlSec * 1000;
    const token = `${heldUntilMs}:${Math.random().toString(36).slice(2, 10)}`;
    this.locks.set(key, { token, heldUntilMs });
    return token;
  }

  async releaseLock(source: SnapshotSource, token: string): Promise<void> {
    const key = `lock:${source}`;
    const held = this.locks.get(key);
    if (held !== undefined && held.token === token) {
      this.locks.delete(key);
    }
  }
}
