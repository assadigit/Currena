/**
 * KV-binding Insights store (2026-10-21 data-integrity round) — the ingest's
 * writer for the currena-api Worker venue. Same keys, same JSON payloads,
 * same poisoned-entry defense as the REST twin (store.ts): only the
 * transport differs (the RATES KV binding instead of the REST API), which
 * is exactly the KvMarketsStore/KvFxStore pattern the markets worker uses.
 *
 * No TTL: freshness is carried by the data (asOf/stale/generatedAt). Reads
 * use no cacheTtl — the ingest needs the stored truth, not an edge-cached
 * copy.
 */

import {
  InsightsSnapshotSchema,
  InsightsStatusSchema,
  IndicatorHistorySchema,
  type InsightsSnapshot,
  type InsightsStatus,
  type IndicatorHistory,
  type IndicatorId,
} from '@currena/core';
import {
  parseStoredValue,
  insightsHistoryKey,
  insightsArchiveKey,
  insightsArchivePublicKey,
  INSIGHTS_SNAPSHOT_KEY,
  INSIGHTS_SNAPSHOT_PUBLIC_KEY,
  INSIGHTS_STATUS_KEY,
  type InsightsStore,
} from '../store';

/** The structural KV surface (the real KVNamespace binding satisfies it). */
export interface KVLike {
  get(key: string, options?: { cacheTtl?: number }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/** KV-binding implementation of the full InsightsStore contract. */
export class KvInsightsStore implements InsightsStore {
  constructor(private readonly kv: KVLike) {}

  async getSnapshot(): Promise<InsightsSnapshot | undefined> {
    return parseStoredValue(
      await this.kv.get(INSIGHTS_SNAPSHOT_KEY),
      (v) => InsightsSnapshotSchema.parse(v),
      INSIGHTS_SNAPSHOT_KEY,
    );
  }

  async putSnapshot(snapshot: InsightsSnapshot): Promise<void> {
    await this.kv.put(INSIGHTS_SNAPSHOT_KEY, JSON.stringify(snapshot));
  }

  async getHistory(id: IndicatorId): Promise<IndicatorHistory | undefined> {
    const key = insightsHistoryKey(id);
    return parseStoredValue(await this.kv.get(key), (v) => IndicatorHistorySchema.parse(v), key);
  }

  async putHistory(history: IndicatorHistory): Promise<void> {
    await this.kv.put(insightsHistoryKey(history.id), JSON.stringify(history));
  }

  async getStatus(): Promise<InsightsStatus | undefined> {
    return parseStoredValue(
      await this.kv.get(INSIGHTS_STATUS_KEY),
      (v) => InsightsStatusSchema.parse(v),
      INSIGHTS_STATUS_KEY,
    );
  }

  async putStatus(status: InsightsStatus): Promise<void> {
    await this.kv.put(INSIGHTS_STATUS_KEY, JSON.stringify(status));
  }

  async getArchive(date: string): Promise<InsightsSnapshot | undefined> {
    const key = insightsArchiveKey(date);
    return parseStoredValue(await this.kv.get(key), (v) => InsightsSnapshotSchema.parse(v), key);
  }

  async putArchive(date: string, snapshot: InsightsSnapshot): Promise<void> {
    await this.kv.put(insightsArchiveKey(date), JSON.stringify(snapshot));
  }

  async getPublicSnapshot(): Promise<InsightsSnapshot | undefined> {
    return parseStoredValue(
      await this.kv.get(INSIGHTS_SNAPSHOT_PUBLIC_KEY),
      (v) => InsightsSnapshotSchema.parse(v),
      INSIGHTS_SNAPSHOT_PUBLIC_KEY,
    );
  }

  async putPublicSnapshot(snapshot: InsightsSnapshot): Promise<void> {
    await this.kv.put(INSIGHTS_SNAPSHOT_PUBLIC_KEY, JSON.stringify(snapshot));
  }

  async getPublicArchive(date: string): Promise<InsightsSnapshot | undefined> {
    const key = insightsArchivePublicKey(date);
    return parseStoredValue(await this.kv.get(key), (v) => InsightsSnapshotSchema.parse(v), key);
  }

  async putPublicArchive(date: string, snapshot: InsightsSnapshot): Promise<void> {
    await this.kv.put(insightsArchivePublicKey(date), JSON.stringify(snapshot));
  }
}
