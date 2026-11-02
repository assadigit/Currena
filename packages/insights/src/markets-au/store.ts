/**
 * @currena/insights/markets-au/store — the Australian markets board's
 * storage contract (gap-closure S5-M5.4).
 *
 * ONE KV key (`insights:markets-au:v1`, the constants in ./definitions)
 * inside the existing RATES namespace, domain-separated by the
 * `insights:` prefix — exactly the world markets twin:
 *
 *   insights:markets-au:v1 — AuMarketsSnapshot JSON
 *
 * The serve path (currena-api Worker) implements AuMarketsReader over the
 * KV binding; the write path is the currena-markets Worker's 4th cron (the
 * account's free 5-cron limit's last slot — the S5-M5.4 venue decision;
 * rung3/rung4 are full at 45/50 after M5.2, see apps/markets/src/index.ts).
 * No TTL: freshness is carried by the data (asOf/stale/generatedAt).
 *
 * WRITE-ONLY-IF-CHANGED: putAuMarketsIfChanged compares the content hash
 * (markets+summary, never generatedAt) and skips the write — weekends,
 * holidays and failed-provider days cost ZERO writes.
 */

import { AuMarketsSnapshotSchema } from '@currena/core';
import type { AuMarketsSnapshot } from '@currena/core';
import { MARKETS_AU_KV_KEY } from './definitions';
import { auMarketsContentEqual } from './compute';

/** Read half — what the serve path implements. */
export interface AuMarketsReader {
  getAuMarkets(): Promise<AuMarketsSnapshot | undefined>;
}

/** Write half — what the cron worker implements. */
export interface AuMarketsWriter {
  /**
   * Write the snapshot only when its content differs from the stored one.
   * `prev` is the value the caller read at the start of THIS run (undefined
   * = nothing stored) — the gate compares against it instead of re-reading,
   * saving one same-invocation KV op. Resolves 'written' | 'unchanged'.
   */
  putAuMarketsIfChanged(
    next: AuMarketsSnapshot,
    prev: AuMarketsSnapshot | undefined,
  ): Promise<'written' | 'unchanged'>;
}

/** Parse a stored JSON value with the poisoned-entry defense (rule #3). */
export function parseStoredAuMarkets(raw: string | null | undefined): AuMarketsSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    return AuMarketsSnapshotSchema.parse(JSON.parse(raw));
  } catch {
    console.warn(`[markets-au-store] ${MARKETS_AU_KV_KEY} failed validation — ignoring stored value`);
    return undefined;
  }
}

/* ------------------------------------------------------------------ *
 * In-memory adapter (tests, local dry-runs)
 * ------------------------------------------------------------------ */

export class InMemoryAuMarketsStore implements AuMarketsReader, AuMarketsWriter {
  private value: string | null = null;
  /** Test-visible counters — the budget test asserts on these. */
  readonly ops = { reads: 0, writes: 0 };

  async getAuMarkets(): Promise<AuMarketsSnapshot | undefined> {
    this.ops.reads++;
    return parseStoredAuMarkets(this.value);
  }

  async putAuMarketsIfChanged(
    next: AuMarketsSnapshot,
    prev: AuMarketsSnapshot | undefined,
  ): Promise<'written' | 'unchanged'> {
    if (auMarketsContentEqual(prev, next)) return 'unchanged';
    this.ops.writes++;
    this.value = JSON.stringify(next);
    return 'written';
  }
}

/* ------------------------------------------------------------------ *
 * KV-binding adapter (the currena-markets Worker's store)
 * ------------------------------------------------------------------ */

/**
 * The minimal KV surface the store needs — Cloudflare's KVNamespace
 * satisfies it structurally, so the platform-free insights package can
 * host the adapter without importing workers-types (AGENTS.md rule 2).
 */
export interface AuKVLike {
  get(key: string, options?: { cacheTtl?: number }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * The markets Worker's AU store over the RATES namespace binding. Reads
 * are uncached (the write gate must compare against the truth); the SERVE
 * path (currena-api's route) applies its own cacheTtl.
 */
export class KvAuMarketsStore implements AuMarketsReader, AuMarketsWriter {
  constructor(private readonly kv: AuKVLike) {}

  async getAuMarkets(): Promise<AuMarketsSnapshot | undefined> {
    return parseStoredAuMarkets(await this.kv.get(MARKETS_AU_KV_KEY));
  }

  async putAuMarketsIfChanged(
    next: AuMarketsSnapshot,
    prev: AuMarketsSnapshot | undefined,
  ): Promise<'written' | 'unchanged'> {
    if (auMarketsContentEqual(prev, next)) return 'unchanged';
    await this.kv.put(MARKETS_AU_KV_KEY, JSON.stringify(next));
    return 'written';
  }
}

/* ------------------------------------------------------------------ *
 * Cloudflare REST adapter (gap-closure S6-M6.1, 2026-11-02) — the
 * markets-run.ts "Path B" twin for the AU board: the manual runner
 * (packages/insights/scripts/markets-au-run.ts) writes the AU key through
 * the KV REST API, so a post-deploy verification or a fresh index can
 * land WITHOUT waiting for the 07:00 UTC cron tick (the M5.4 board's
 * original bootstrap had to wait a day). Mirrors RestMarketsStore's
 * request/retry shape verbatim (the proven class).
 * ------------------------------------------------------------------ */

export const AU_CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export interface RestAuMarketsOptions {
  /** Cloudflare API token (KV write permission on the RATES namespace). */
  apiToken: string;
  accountId: string;
  /** The RATES namespace id (apps/api/wrangler.jsonc kv_namespaces[0].id). */
  namespaceId: string;
  /** Injected for tests — defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** REST base override (tests). */
  baseUrl?: string;
  /** Daily-cap (429/10048) retry ladder in ms; [] disables (tests). */
  retryDelaysMs?: readonly number[];
}

export class RestAuMarketsStore implements AuMarketsReader, AuMarketsWriter {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly retryDelaysMs: readonly number[];
  readonly ops = { reads: 0, writes: 0, retriedWrites: 0 };

  constructor(private readonly opts: RestAuMarketsOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
    this.baseUrl = opts.baseUrl ?? AU_CLOUDFLARE_API_BASE;
    this.retryDelaysMs = opts.retryDelaysMs ?? [60_000, 120_000];
  }

  private url(): string {
    return (
      `${this.baseUrl}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(MARKETS_AU_KV_KEY)}`
    );
  }

  private async request(init: RequestInit): Promise<Response> {
    return this.fetchImpl(this.url(), {
      ...init,
      headers: {
        Authorization: `Bearer ${this.opts.apiToken}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers ?? {}),
      },
    });
  }

  /** Daily-cap detection: HTTP 429 with CF error 10048 (verified 2026-10-06). */
  private isDailyCap(status: number, body: string): boolean {
    return status === 429 && body.includes('10048');
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getAuMarkets(): Promise<AuMarketsSnapshot | undefined> {
    this.ops.reads++;
    const res = await this.request({ method: 'GET' });
    if (res.status === 404) return undefined;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`[markets-au-store] GET ${MARKETS_AU_KV_KEY} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return parseStoredAuMarkets(await res.text());
  }

  async putAuMarketsIfChanged(
    next: AuMarketsSnapshot,
    prev: AuMarketsSnapshot | undefined,
  ): Promise<'written' | 'unchanged'> {
    if (auMarketsContentEqual(prev, next)) return 'unchanged';
    const payload = JSON.stringify(next);
    for (let attempt = 0; ; attempt++) {
      const res = await this.request({ method: 'PUT', body: payload });
      if (res.ok) {
        this.ops.writes++;
        return 'written';
      }
      const body = await res.text().catch(() => '');
      if (this.isDailyCap(res.status, body) && attempt < this.retryDelaysMs.length) {
        this.ops.retriedWrites++;
        await this.sleep(this.retryDelaysMs[attempt]!);
        continue;
      }
      throw new Error(`[markets-au-store] PUT ${MARKETS_AU_KV_KEY} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
  }
}
