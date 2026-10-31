/**
 * TIC storage (gap-closure S2-M2.2) — the ONE-key contract, the markets
 * twin of ../markets/store.ts:
 *
 *   insights:tic:v1 — TicSnapshot JSON (no TTL; freshness is carried by
 *                     dataMonth + the serve-time stale gate)
 *
 * Written by the rung3 extra-source (Worker KV binding), read by
 * GET /api/insights/tic. Zod-validated on write AND on read — a poisoned
 * key degrades calmly to "absent", never renders garbage.
 */

import { TicSnapshotSchema, type TicSnapshot } from '@currena/core';

/** The KV key (inside the existing RATES namespace, `insights:` prefix). */
export const TIC_KV_KEY = 'insights:tic:v1';

/** Read half — the serve path. */
export interface TicReader {
  getTic(): Promise<TicSnapshot | undefined>;
}

/** Write half — the rung. */
export interface TicWriter {
  putTic(snapshot: TicSnapshot): Promise<void>;
}

/** The rung's store: both ports on one binding. */
export interface TicStore extends TicReader, TicWriter {}

/** The structural KV surface (the real KVNamespace binding satisfies it). */
export interface TicKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

/** Parse a stored JSON value with the poisoned-entry defense. */
export function parseStoredTic(raw: string | null | undefined): TicSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    return TicSnapshotSchema.parse(JSON.parse(raw));
  } catch {
    console.warn(`[tic-store] ${TIC_KV_KEY} failed validation — ignoring stored value`);
    return undefined;
  }
}

/** KV-binding adapter (the Worker's RATES binding; the ingest + serve paths). */
export class KvTicStore implements TicStore {
  constructor(private readonly kv: TicKv) {}

  async getTic(): Promise<TicSnapshot | undefined> {
    return parseStoredTic(await this.kv.get(TIC_KV_KEY));
  }

  async putTic(snapshot: TicSnapshot): Promise<void> {
    await this.kv.put(TIC_KV_KEY, JSON.stringify(snapshot));
  }
}

/** In-memory adapter (tests, local dry-runs) with visible op counters. */
export class InMemoryTicStore implements TicReader, TicWriter {
  private value: string | null = null;
  readonly ops = { reads: 0, writes: 0 };

  async getTic(): Promise<TicSnapshot | undefined> {
    this.ops.reads++;
    return parseStoredTic(this.value);
  }

  async putTic(snapshot: TicSnapshot): Promise<void> {
    this.ops.writes++;
    this.value = JSON.stringify(snapshot);
  }
}
