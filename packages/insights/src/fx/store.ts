/**
 * World currencies storage contract — the fx twin of ../markets/store.ts.
 *
 * ONE KV key (`insights:fx:v1`, spec §5 rule 1) inside the existing RATES
 * namespace, domain-separated by the `insights:` prefix:
 *
 *   insights:fx:v1 — FxSnapshot JSON
 *
 * The serve path (currena-api Worker) implements FxReader over the KV
 * binding; the write path is the currena-markets Worker (the fx job rides
 * its two cron triggers — spec §4.4's fallback) or the Cloudflare REST API
 * (RestFxStore — the seed/manual runner's "Path B"). No TTL: freshness is
 * carried by the data (asOf/stale/generatedAt).
 *
 * WRITE-ONLY-IF-CHANGED (spec §5 rule 2): putFxIfChanged compares the
 * content hash (dollarMeasure+pairs+rules+summary, never generatedAt) and
 * skips the write — weekends, holidays and unchanged days cost ZERO writes.
 *
 * The CROSS-SECTION READS (spec §6.3): the rules also read three things
 * that are ALREADY stored — the markets snapshot (S&P 500 / Nikkei / Stoxx
 * 1-month changes + weekly charts), the gold history (the R3/R4 legs) and
 * the main insights snapshot (the market-stress gauges for R1's fear leg,
 * D-05). FxCrossReader is that read port; ONE implementation per platform
 * (KV binding in the Worker, REST in the runner, in-memory in tests) — the
 * page route NEVER reads any of them (spec §5 rule 3: the analysis is done
 * in the scheduled job).
 */

import {
  FxSnapshotSchema,
  IndicatorHistorySchema,
  InsightsSnapshotSchema,
  MarketsSnapshotSchema,
} from '@currena/core';
import type { FxSnapshot, IndicatorHistory, IndicatorId, InsightsSnapshot, MarketsSnapshot } from '@currena/core';
import { FX_KV_KEY } from './definitions';
import { fxContentEqual } from './compute';
import { insightsHistoryKey } from '../store';
import { CLOUDFLARE_API_BASE } from '../markets/store';

/** Read half — what the serve path implements. */
export interface FxReader {
  getFx(): Promise<FxSnapshot | undefined>;
}

/** Write half — what the cron worker / seed runner implements. */
export interface FxWriter {
  /**
   * Write the snapshot only when its content differs from the stored one.
   * Resolves 'written' | 'unchanged'; rejections carry the failure verbatim
   * (the caller decides whether a bounced write is fatal — for the fx job
   * it is NOT: the markets retry run lands it two hours later).
   */
  putFxIfChanged(next: FxSnapshot): Promise<'written' | 'unchanged'>;
}

/**
 * The cross-section reads the rules need (spec §6.3). All three answers are
 * allowed to be undefined — every rule input degrades to "not enough data"
 * honestly, never a guess.
 */
export interface FxCrossReader {
  /** `insights:markets:v1` — the stock legs + weekly charts. */
  getMarkets(): Promise<MarketsSnapshot | undefined>;
  /** `insights:hist:gold-usd` — the R3/R4 gold legs. */
  getGoldHistory(): Promise<IndicatorHistory | undefined>;
  /** `insights:snapshot` — the stress gauges (R1's fear leg, D-05). */
  getInsightsSnapshot(): Promise<InsightsSnapshot | undefined>;
}

/** Parse a stored JSON value with the poisoned-entry defense (rule #3). */
export function parseStoredFx(raw: string | null | undefined): FxSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    return FxSnapshotSchema.parse(JSON.parse(raw));
  } catch {
    console.warn(`[fx-store] ${FX_KV_KEY} failed validation — ignoring stored value`);
    return undefined;
  }
}

/* ------------------------------------------------------------------ *
 * In-memory adapter (tests, local dry-runs)
 * ------------------------------------------------------------------ */

export class InMemoryFxStore implements FxReader, FxWriter {
  private value: string | null = null;
  /** Test-visible counters — the budget test asserts on these. */
  readonly ops = { reads: 0, writes: 0 };

  async getFx(): Promise<FxSnapshot | undefined> {
    this.ops.reads++;
    return parseStoredFx(this.value);
  }

  async putFxIfChanged(next: FxSnapshot): Promise<'written' | 'unchanged'> {
    this.ops.reads++; // the write gate itself needs the stored value
    const stored = parseStoredFx(this.value);
    if (fxContentEqual(stored, next)) return 'unchanged';
    this.ops.writes++;
    this.value = JSON.stringify(next);
    return 'written';
  }
}

/* ------------------------------------------------------------------ *
 * KV-binding adapter (the currena-markets Worker's store)
 * ------------------------------------------------------------------ */

/**
 * The minimal KV surface the store needs (the markets module's KVLike —
 * duplicated here so the fx tree is self-contained; Cloudflare's
 * KVNamespace satisfies it structurally, keeping this package
 * platform-free per AGENTS.md rule 2).
 */
export interface FxKVLike {
  get(key: string, options?: { cacheTtl?: number }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/** The fx job's store + cross-section reads over the RATES namespace binding. */
export class KvFxStore implements FxReader, FxWriter, FxCrossReader {
  constructor(private readonly kv: FxKVLike) {}

  async getFx(): Promise<FxSnapshot | undefined> {
    return parseStoredFx(await this.kv.get(FX_KV_KEY));
  }

  async putFxIfChanged(next: FxSnapshot): Promise<'written' | 'unchanged'> {
    const stored = await this.getFx();
    if (fxContentEqual(stored, next)) return 'unchanged';
    await this.kv.put(FX_KV_KEY, JSON.stringify(next));
    return 'written';
  }

  async getMarkets(): Promise<MarketsSnapshot | undefined> {
    return parseStoredKey(this.kv, 'insights:markets:v1', MarketsSnapshotSchema);
  }

  async getGoldHistory(): Promise<IndicatorHistory | undefined> {
    return parseStoredKey(this.kv, insightsHistoryKey('gold-usd' as IndicatorId), IndicatorHistorySchema);
  }

  async getInsightsSnapshot(): Promise<InsightsSnapshot | undefined> {
    return parseStoredKey(this.kv, 'insights:snapshot', InsightsSnapshotSchema);
  }
}

/** One guarded KV read + zod parse (the poisoned-entry defense, rule #3). */
async function parseStoredKey<T>(
  kv: FxKVLike,
  key: string,
  parse: { parse(value: unknown): T },
): Promise<T | undefined> {
  let raw: string | null;
  try {
    raw = await kv.get(key);
  } catch (err) {
    console.warn(`[fx-store] reading ${key} failed: ${err instanceof Error ? err.message : err}`);
    return undefined;
  }
  if (raw === null) return undefined;
  try {
    return parse.parse(JSON.parse(raw));
  } catch {
    console.warn(`[fx-store] ${key} failed validation — ignoring stored value`);
    return undefined;
  }
}

/* ------------------------------------------------------------------ *
 * Cloudflare REST adapter (seed / manual runner — "Path B")
 * ------------------------------------------------------------------ */

export interface RestFxOptions {
  /** Cloudflare API token (KV read/write on the RATES namespace). */
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

/** The fx job's REST store — same shape as RestMarketsStore, plus the cross reads. */
export class RestFxStore implements FxReader, FxWriter, FxCrossReader {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly retryDelaysMs: readonly number[];
  readonly ops = { reads: 0, writes: 0, retriedWrites: 0 };

  constructor(private readonly opts: RestFxOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
    this.baseUrl = opts.baseUrl ?? CLOUDFLARE_API_BASE;
    this.retryDelaysMs = opts.retryDelaysMs ?? [60_000, 120_000];
  }

  private url(key: string): string {
    return (
      `${this.baseUrl}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(key)}`
    );
  }

  private async request(key: string, init: RequestInit): Promise<Response> {
    return this.fetchImpl(this.url(key), {
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

  private async getText(key: string): Promise<string | null> {
    this.ops.reads++;
    const res = await this.request(key, { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`[fx-store] GET ${key} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.text();
  }

  private async put(key: string, value: string): Promise<void> {
    let attempt = 0;
    for (;;) {
      this.ops.writes++;
      const res = await this.request(key, { method: 'PUT', body: value });
      if (res.ok) return;
      const body = await res.text();
      if (this.isDailyCap(res.status, body) && attempt < this.retryDelaysMs.length) {
        const delay = this.retryDelaysMs[attempt]!;
        this.ops.retriedWrites++;
        console.warn(
          `[fx-store] PUT ${key} hit the daily KV write cap — retry ${attempt + 1}/${this.retryDelaysMs.length} in ${Math.round(delay / 1000)}s`,
        );
        await this.sleep(delay);
        attempt++;
        continue;
      }
      throw new Error(`[fx-store] PUT ${key} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
  }

  async getFx(): Promise<FxSnapshot | undefined> {
    return parseStoredFx(await this.getText(FX_KV_KEY));
  }

  async putFxIfChanged(next: FxSnapshot): Promise<'written' | 'unchanged'> {
    const stored = await this.getFx();
    if (fxContentEqual(stored, next)) return 'unchanged';
    await this.put(FX_KV_KEY, JSON.stringify(next));
    return 'written';
  }

  async getMarkets(): Promise<MarketsSnapshot | undefined> {
    const raw = await this.getText('insights:markets:v1');
    if (raw === null) return undefined;
    try {
      return MarketsSnapshotSchema.parse(JSON.parse(raw));
    } catch {
      console.warn('[fx-store] insights:markets:v1 failed validation — ignoring stored value');
      return undefined;
    }
  }

  async getGoldHistory(): Promise<IndicatorHistory | undefined> {
    const raw = await this.getText(insightsHistoryKey('gold-usd' as IndicatorId));
    if (raw === null) return undefined;
    try {
      return IndicatorHistorySchema.parse(JSON.parse(raw));
    } catch {
      console.warn('[fx-store] gold history failed validation — ignoring stored value');
      return undefined;
    }
  }

  async getInsightsSnapshot(): Promise<InsightsSnapshot | undefined> {
    const raw = await this.getText('insights:snapshot');
    if (raw === null) return undefined;
    try {
      return InsightsSnapshotSchema.parse(JSON.parse(raw));
    } catch {
      console.warn('[fx-store] insights:snapshot failed validation — ignoring stored value');
      return undefined;
    }
  }
}
