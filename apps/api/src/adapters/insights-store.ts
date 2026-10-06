/**
 * Workers KV adapter for the InsightsReader port (the twin of kv-store.ts —
 * AGENTS.md rule 2: all storage access goes through the store interfaces, so
 * a KV→D1 migration is a swap of this file).
 *
 * KV layout (written by the ingestion runner via the Cloudflare REST API —
 * see @currena/insights/store.ts; keys share the RATES namespace, separated
 * by the `insights:` prefix):
 *   insights:snapshot   — InsightsSnapshot JSON (serve path: ONE KV read)
 *   insights:hist:<id>  — IndicatorHistory JSON (ONE KV read per request)
 *   insights:status     — InsightsStatus JSON (/admin freshness rows)
 *
 * No TTLs: freshness is carried by the data itself. Poisoned entries fail
 * validation and read as absent (never rendered) — same defense as kv-store.ts.
 */

import {
  IndicatorHistorySchema,
  InsightsSnapshotSchema,
  InsightsStatusSchema,
} from '@currena/core';
import type { IndicatorHistory, InsightsSnapshot, InsightsStatus, IndicatorId } from '@currena/core';
import {
  INSIGHTS_SNAPSHOT_KEY,
  INSIGHTS_STATUS_KEY,
  insightsHistoryKey,
  parseStoredValue,
  type InsightsReader,
} from '@currena/insights/store';

export class KvInsightsReader implements InsightsReader {
  constructor(private readonly kv: KVNamespace) {}

  async getSnapshot(): Promise<InsightsSnapshot | undefined> {
    return parseStoredValue(
      await this.kv.get(INSIGHTS_SNAPSHOT_KEY),
      (v) => InsightsSnapshotSchema.parse(v),
      INSIGHTS_SNAPSHOT_KEY,
    );
  }

  async getHistory(id: IndicatorId): Promise<IndicatorHistory | undefined> {
    const key = insightsHistoryKey(id);
    return parseStoredValue(await this.kv.get(key), (v) => IndicatorHistorySchema.parse(v), key);
  }

  async getStatus(): Promise<InsightsStatus | undefined> {
    return parseStoredValue(
      await this.kv.get(INSIGHTS_STATUS_KEY),
      (v) => InsightsStatusSchema.parse(v),
      INSIGHTS_STATUS_KEY,
    );
  }
}
