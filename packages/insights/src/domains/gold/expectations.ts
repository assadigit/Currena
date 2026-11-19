/**
 * expectations.ts — GPE R28 / F24 (2026-11-19): the Fed-meeting
 * market-implied expectations' store + rung job — the lbma/cb-demand
 * twin (docs/specs/gold-page-elevation: s8/01 R28 · the s15 M1 §7
 * S15-D1/S15-D2 records).
 *
 * ONE KV key (`insights:gold-expectations:v1`): the Polymarket
 * fed-decision event + its five outcome markets' implied probabilities
 * (THE KALSHI LEG DOES NOT SHIP — S15-D1: the Developer Agreement
 * v1.1 §3/§3.1 prohibit non-own-trading use, collecting/caching/
 * storing, and third-party sharing; the card renders this ONE venue,
 * honestly named).
 *
 * THE JOB (the :23/:53 minute-cron rung — the 30-minute card refresh,
 * the PRICES_CRON_MINUTE pattern; NO new cron trigger): read the
 * stored snapshot, ONE gamma discovery fetch, write-if-changed. The
 * event-close → next-market roll rides the adapter's pick rule. A
 * fetch failure keeps the stored snapshot (the last-good
 * discipline); staleness is data-carried (the snapshot's own
 * fetchedAt — the card labels it).
 *
 * The manual runner (gold-expectations-run, the gold-lbma-run twin)
 * seeds the key through the KV REST API for post-deploy landings.
 *
 * Platform boundary: the store + job touch KV through the narrow
 * tic/lbma-style port (AGENTS.md rule 2). Exported via the
 * "@currena/insights/expectations" subpath so the SPA-facing root
 * export never pulls the fetch halves.
 */

import type { GoldExpectationsSnapshot, FedOutcomeMarket } from '@currena/core';
import { GoldExpectationsSnapshotSchema } from '@currena/core';
import { classifySourceError } from '../../shared/adapters/fetch-policy';
import {
  fetchPolymarketFedExpectations,
  type PolymarketFedEvent,
} from './adapters/polymarket';

export { polymarketEventUrl, polymarketFomcEventsUrl } from './adapters/polymarket';

/* ------------------------------------------------------------------ *
 * The store (the ONE KV key)
 * ------------------------------------------------------------------ */

export const GOLD_EXPECTATIONS_KV_KEY = 'insights:gold-expectations:v1';

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldExpectationsKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredGoldExpectations(
  raw: string | null | undefined,
): GoldExpectationsSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldExpectationsSnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-expectations-store] ${GOLD_EXPECTATIONS_KV_KEY} failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldExpectationsReader {
  getGoldExpectations(): Promise<GoldExpectationsSnapshot | undefined>;
}

export interface GoldExpectationsStore extends GoldExpectationsReader {
  writeGoldExpectations(snapshot: GoldExpectationsSnapshot): Promise<void>;
}

export class KvGoldExpectationsStore implements GoldExpectationsStore {
  constructor(private readonly kv: GoldExpectationsKv) {}

  async getGoldExpectations(): Promise<GoldExpectationsSnapshot | undefined> {
    return parseStoredGoldExpectations(await this.kv.get(GOLD_EXPECTATIONS_KV_KEY));
  }

  async writeGoldExpectations(snapshot: GoldExpectationsSnapshot): Promise<void> {
    await this.kv.put(GOLD_EXPECTATIONS_KV_KEY, JSON.stringify(snapshot));
  }
}

/** The REST adapter (the manual runner's landing lever — the
 *  RestGoldLbmaStore twin: writes through the Cloudflare KV REST API). */
export interface RestGoldExpectationsOptions {
  apiToken: string;
  accountId: string;
  namespaceId: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export class RestGoldExpectationsStore implements GoldExpectationsStore {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: RestGoldExpectationsOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private url(): string {
    return (
      `${CLOUDFLARE_API_BASE}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(GOLD_EXPECTATIONS_KV_KEY)}`
    );
  }

  async getGoldExpectations(): Promise<GoldExpectationsSnapshot | undefined> {
    const response = await this.fetchImpl(this.url(), {
      headers: { Authorization: `Bearer ${this.opts.apiToken}` },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`KV REST read failed: HTTP ${response.status}`);
    }
    return parseStoredGoldExpectations(await response.text());
  }

  async writeGoldExpectations(snapshot: GoldExpectationsSnapshot): Promise<void> {
    const response = await this.fetchImpl(this.url(), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.opts.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapshot),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`KV REST write failed: HTTP ${response.status}: ${body.slice(0, 160)}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * The job (the :23/:53 rung body)
 * ------------------------------------------------------------------ */

export interface GoldExpectationsJobDeps {
  /** Injectable fetch (tests replay saved payloads — never live sites). */
  fetchImpl?: typeof fetch;
  /** Clock (tests pin the rolling pick). */
  now?: Date;
}

export type GoldExpectationsJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

export interface GoldExpectationsJobResult {
  outcome: GoldExpectationsJobOutcome;
  snapshot?: GoldExpectationsSnapshot;
  kv: { reads: number; writes: number };
}

/** Build the snapshot over the venue's own event shape (the wire
 *  contract validates; the markets keep their display order by move —
 *  a stable reading order the card renders). */
export function buildGoldExpectationsSnapshot(
  event: PolymarketFedEvent,
  now: Date,
): GoldExpectationsSnapshot {
  const ORDER: Record<FedOutcomeMarket['move'], number> = {
    hike50plus: 0,
    hike25: 1,
    hold: 2,
    cut25: 3,
    cut50plus: 4,
  };
  const markets = [...event.markets].sort((a, b) => ORDER[a.move] - ORDER[b.move]);
  return GoldExpectationsSnapshotSchema.parse({
    v: 1,
    fetchedAt: now.toISOString(),
    source: 'polymarket',
    event: {
      slug: event.slug,
      title: event.title,
      endDate: event.endDate,
      url: event.url,
    },
    markets,
  });
}

/**
 * The rung body: read the stored snapshot, ONE discovery fetch, write
 * ONLY when the market content changed (the prices move continuously;
 * a genuinely identical half-hour is the quiet no-op). A fetch failure
 * keeps the stored snapshot (the last-good discipline) and records
 * the honest failure row — the sweeps/nothing else retries before the
 * next :23/:53 tick.
 */
export async function runGoldExpectationsIngest(
  store: GoldExpectationsStore,
  deps: GoldExpectationsJobDeps = {},
): Promise<GoldExpectationsJobResult> {
  const now = deps.now ?? new Date();
  const stored = await store.getGoldExpectations();

  let event: PolymarketFedEvent;
  try {
    event = await fetchPolymarketFedExpectations({ fetchImpl: deps.fetchImpl, now });
  } catch (err) {
    // A failure NEVER discards the stored snapshot — the last-good
    // discipline; the card labels the snapshot's own fetchedAt.
    return {
      outcome: {
        ok: false,
        kind: classifySourceError(err),
        note: err instanceof Error ? err.message : String(err),
      },
      ...(stored !== undefined ? { snapshot: stored } : {}),
      kv: { reads: 1, writes: 0 },
    };
  }

  const snapshot = buildGoldExpectationsSnapshot(event, now);
  if (
    stored !== undefined &&
    stored.event.slug === snapshot.event.slug &&
    JSON.stringify(stored.markets) === JSON.stringify(snapshot.markets)
  ) {
    return {
      outcome: { ok: true, note: `no change (${stored.event.slug} — prices identical)` },
      snapshot: stored,
      kv: { reads: 1, writes: 0 },
    };
  }
  await store.writeGoldExpectations(snapshot);
  const rolled = stored !== undefined && stored.event.slug !== snapshot.event.slug;
  return {
    outcome: {
      ok: true,
      note: rolled
        ? `rolled to ${snapshot.event.slug} (${snapshot.markets.length} markets)`
        : `${snapshot.event.slug} refreshed (${snapshot.markets.length} markets)`,
    },
    snapshot,
    kv: { reads: 1, writes: 1 },
  };
}
