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
import type {
  IndicatorHistory,
  InsightsSnapshot,
  InsightsStatus,
  IndicatorId,
  MarketsSnapshot,
} from '@currena/core';
import {
  INSIGHTS_SNAPSHOT_KEY,
  INSIGHTS_STATUS_KEY,
  insightsHistoryKey,
  parseStoredValue,
  type InsightsReader,
} from '@currena/insights/store';
import { MARKETS_KV_KEY, parseStoredMarkets } from '@currena/insights/markets';
import type { MarketsReader } from '@currena/insights/markets';

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

/**
 * World stock markets serve path (insights-world-markets-spec.md §4 rule 5):
 * ONE KV read for the section's ONE key, with the spec's 1-hour KV edge
 * cache so page traffic never re-reads KV more than hourly. The value is
 * written by the dedicated currena-markets Worker cron — read-only here,
 * and a page request can never reach a provider.
 */
export class KvMarketsReader implements MarketsReader {
  constructor(private readonly kv: KVNamespace) {}

  async getMarkets(): Promise<MarketsSnapshot | undefined> {
    return parseStoredMarkets(await this.kv.get(MARKETS_KV_KEY, { cacheTtl: 3600 }));
  }
}
