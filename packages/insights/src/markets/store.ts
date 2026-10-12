/**
 * World stock markets storage contract — the markets twin of ../store.ts.
 *
 * ONE KV key (`insights:markets:v1`, spec §4 rule 1) inside the existing
 * RATES namespace, domain-separated by the `insights:` prefix:
 *
 *   insights:markets:v1 — MarketsSnapshot JSON
 *
 * The serve path (currena-api Worker) implements MarketsReader over the KV
 * binding; the write path is the currena-markets Worker (KV binding) or the
 * Cloudflare REST API (this module's RestMarketsStore — the seed/manual
 * runner's "Path B", exactly like RestInsightsStore). No TTL: freshness is
 * carried by the data (asOf/stale/generatedAt).
 *
 * WRITE-ONLY-IF-CHANGED (spec §4 rule 2): putMarketsIfChanged compares the
 * content hash (markets+summary, never generatedAt) and skips the write —
 * weekends, holidays and failed-provider days cost ZERO writes.
 */

import { MarketsSnapshotSchema } from '@currena/core';
import type { MarketsSnapshot } from '@currena/core';
import { MARKETS_KV_KEY } from './definitions';
import { marketsContentEqual } from './compute';

/** Read half — what the serve path implements. */
export interface MarketsReader {
  getMarkets(): Promise<MarketsSnapshot | undefined>;
}

/** Write half — what the cron worker / seed runner implements. */
export interface MarketsWriter {
  /**
   * Write the snapshot only when its content differs from the stored one.
   * Resolves 'written' | 'unchanged'; rejections carry the failure verbatim
   * (the caller decides whether a bounced write is fatal — for the markets
   * job it is NOT: the 01:30 retry run lands the day's write in the fresh
   * post-midnight budget slice).
   */
  putMarketsIfChanged(next: MarketsSnapshot): Promise<'written' | 'unchanged'>;
}

/** Parse a stored JSON value with the poisoned-entry defense (rule #3). */
export function parseStoredMarkets(raw: string | null | undefined): MarketsSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    return MarketsSnapshotSchema.parse(JSON.parse(raw));
  } catch {
    console.warn(`[markets-store] ${MARKETS_KV_KEY} failed validation — ignoring stored value`);
    return undefined;
  }
}

/* ------------------------------------------------------------------ *
 * In-memory adapter (tests, local dry-runs)
 * ------------------------------------------------------------------ */

export class InMemoryMarketsStore implements MarketsReader, MarketsWriter {
  private value: string | null = null;
  /** Test-visible counters — the budget test asserts on these. */
  readonly ops = { reads: 0, writes: 0 };

  async getMarkets(): Promise<MarketsSnapshot | undefined> {
    this.ops.reads++;
    return parseStoredMarkets(this.value);
  }

  async putMarketsIfChanged(next: MarketsSnapshot): Promise<'written' | 'unchanged'> {
    this.ops.reads++; // the write gate itself needs the stored value
    const stored = parseStoredMarkets(this.value);
    if (marketsContentEqual(stored, next)) return 'unchanged';
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
export interface KVLike {
  get(key: string, options?: { cacheTtl?: number }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * The markets Worker's store over the RATES namespace binding. Reads are
 * uncached (the write gate must compare against the truth); the SERVE path
 * (currena-api's route) applies its own cacheTtl per spec §4 rule 5.
 * putMarketsIfChanged rejections propagate to runMarketsUpdate, which
 * treats a bounced write as non-fatal (the 01:30 retry lands it).
 */
export class KvMarketsStore implements MarketsReader, MarketsWriter {
  constructor(private readonly kv: KVLike) {}

  async getMarkets(): Promise<MarketsSnapshot | undefined> {
    return parseStoredMarkets(await this.kv.get(MARKETS_KV_KEY));
  }

  async putMarketsIfChanged(next: MarketsSnapshot): Promise<'written' | 'unchanged'> {
    const stored = await this.getMarkets();
    if (marketsContentEqual(stored, next)) return 'unchanged';
    await this.kv.put(MARKETS_KV_KEY, JSON.stringify(next));
    return 'written';
  }
}

/* ------------------------------------------------------------------ *
 * Cloudflare REST adapter (seed / manual runner — "Path B")
 * ------------------------------------------------------------------ */

export const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export interface RestMarketsOptions {
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

export class RestMarketsStore implements MarketsReader, MarketsWriter {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly retryDelaysMs: readonly number[];
  readonly ops = { reads: 0, writes: 0, retriedWrites: 0 };

  constructor(private readonly opts: RestMarketsOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
    this.baseUrl = opts.baseUrl ?? CLOUDFLARE_API_BASE;
    this.retryDelaysMs = opts.retryDelaysMs ?? [60_000, 120_000];
  }

  private url(): string {
    return (
      `${this.baseUrl}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(MARKETS_KV_KEY)}`
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

  private async getText(): Promise<string | null> {
    this.ops.reads++;
    const res = await this.request({ method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`[markets-store] GET ${MARKETS_KV_KEY} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.text();
  }

  private async put(value: string): Promise<void> {
    let attempt = 0;
    for (;;) {
      this.ops.writes++;
      const res = await this.request({ method: 'PUT', body: value });
      if (res.ok) return;
      const body = await res.text();
      if (this.isDailyCap(res.status, body) && attempt < this.retryDelaysMs.length) {
        const delay = this.retryDelaysMs[attempt]!;
        this.ops.retriedWrites++;
        console.warn(
          `[markets-store] PUT ${MARKETS_KV_KEY} hit the daily KV write cap — retry ${attempt + 1}/${this.retryDelaysMs.length} in ${Math.round(delay / 1000)}s`,
        );
        await this.sleep(delay);
        attempt++;
        continue;
      }
      throw new Error(`[markets-store] PUT ${MARKETS_KV_KEY} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
  }

  async getMarkets(): Promise<MarketsSnapshot | undefined> {
    return parseStoredMarkets(await this.getText());
  }

  async putMarketsIfChanged(next: MarketsSnapshot): Promise<'written' | 'unchanged'> {
    const stored = await this.getMarkets();
    if (marketsContentEqual(stored, next)) return 'unchanged';
    await this.put(JSON.stringify(next));
    return 'written';
  }
}
