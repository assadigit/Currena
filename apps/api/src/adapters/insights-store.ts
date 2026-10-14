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
  LivePricesSnapshot,
  FxSnapshot,
} from '@currena/core';
import {
  INSIGHTS_SNAPSHOT_KEY,
  INSIGHTS_STATUS_KEY,
  insightsArchiveKey,
  insightsHistoryKey,
  parseStoredValue,
  type InsightsReader,
} from '@currena/insights/store';
import { MARKETS_KV_KEY, parseStoredMarkets } from '@currena/insights/markets';
import type { MarketsReader } from '@currena/insights/markets';
import { FX_KV_KEY, parseStoredFx } from '@currena/insights/fx';
import type { FxReader } from '@currena/insights/fx';
import { PRICES_KV_KEY, parseStoredLivePrices } from '@currena/insights/prices';
import type { PricesReader } from '@currena/insights/prices';

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

  /** Fix spec A-05: a past day's archived snapshot (one KV read). */
  async getArchive(date: string): Promise<InsightsSnapshot | undefined> {
    const key = insightsArchiveKey(date);
    return parseStoredValue(await this.kv.get(key), (v) => InsightsSnapshotSchema.parse(v), key);
  }
}

/**
 * World stock markets serve path (insights-world-markets-spec.md §4 rule 5):
 * ONE KV read for the section's ONE key, with the spec's 5-minute KV edge
 * cache (the 2026-10-14 tightening, D-13 — was 1 hour) so page traffic
 * never re-reads KV more than once per 5 minutes. The value is written by
 * the dedicated currena-markets Worker cron — read-only here, and a page
 * request can never reach a provider.
 */
export class KvMarketsReader implements MarketsReader {
  constructor(private readonly kv: KVNamespace) {}

  async getMarkets(): Promise<MarketsSnapshot | undefined> {
    return parseStoredMarkets(await this.kv.get(MARKETS_KV_KEY, { cacheTtl: 300 }));
  }
}

/**
 * World currencies serve path (insights-world-currencies-spec.md §5 rules
 * 3–4): ONE KV read for the section's ONE key, with the spec's 5-minute
 * KV edge cache (the 2026-10-14 tightening, D-13 — was 1 hour) — exactly
 * the markets twin. The value is written by the fx job riding the
 * currena-markets Worker cron — read-only here, and a page request can
 * never reach a provider.
 */
export class KvFxReader implements FxReader {
  constructor(private readonly kv: KVNamespace) {}

  async getFx(): Promise<FxSnapshot | undefined> {
    return parseStoredFx(await this.kv.get(FX_KV_KEY, { cacheTtl: 300 }));
  }
}

/**
 * Live-prices serve path (the 2026-10-12 volatility refresh): ONE KV read
 * for the quotes key, with a 60-second KV edge cache matching the route's
 * `max-age=60` — page traffic never re-reads KV more than once a minute
 * while the quotes themselves turn hourly. The value is written by the
 * currena-api Worker's own :13 minute rung (KvPricesStore) — read-only
 * here, and a page request can never reach a provider.
 */
export class KvPricesReader implements PricesReader {
  constructor(private readonly kv: KVNamespace) {}

  async getLivePrices(): Promise<LivePricesSnapshot | undefined> {
    return parseStoredLivePrices(await this.kv.get(PRICES_KV_KEY, { cacheTtl: 60 }));
  }
}
