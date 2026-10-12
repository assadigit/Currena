/**
 * Live prices storage contract — the prices twin of ../markets/store.ts.
 *
 * ONE KV key (`insights:prices-live:v1`) inside the existing RATES
 * namespace, domain-separated by the `insights:` prefix:
 *
 *   insights:prices-live:v1 — LivePricesSnapshot JSON
 *
 * The WRITER is the currena-api Worker's hourly :13 cron rung (KvPricesStore
 * over the KV binding) or the manual prices-run script (RestPricesStore over
 * the Cloudflare REST API — "Path B"). The READER is the serve path
 * (currena-api's GET /api/insights merges the quotes into the snapshot).
 *
 * WRITE-ONLY-IF-CHANGED: content equality compares each asset's
 * {value, asOf, change7d, change30d, sourceSymbol} — deliberately NOT
 * updatedAt/generatedAt, so an hourly re-fetch that returns the same numbers
 * (a quiet weekend) costs ZERO writes. With prices actually moving, the
 * expected steady-state is ≤ 24 writes/day — ~2 % of the account's 1,000
 * KV writes/day, which the ever-green rates cron saturates by ~18:30 UTC
 * anyway (a bounced evening write is non-fatal; the post-midnight rung
 * lands the next one in the fresh budget slice).
 */

import { LivePricesSnapshotSchema } from '@currena/core';
import type { LivePriceEntry, LivePricesSnapshot, PriceAssetId } from '@currena/core';
import { PRICES_KV_KEY } from './definitions';

/** Read half — what the serve path implements. */
export interface PricesReader {
  getLivePrices(): Promise<LivePricesSnapshot | undefined>;
}

/** Write half — what the cron rung / manual runner implements. */
export interface PricesWriter {
  /**
   * Write the snapshot only when its content differs from the stored one.
   * Resolves 'written' | 'unchanged'; rejections carry the failure verbatim
   * (the caller treats a bounced write as non-fatal — the next hourly rung
   * retries, and the stored quotes meanwhile stay last-known-good).
   */
  putLivePricesIfChanged(next: LivePricesSnapshot): Promise<'written' | 'unchanged'>;
}

/** Parse a stored JSON value with the poisoned-entry defense (rule #3). */
export function parseStoredLivePrices(raw: string | null | undefined): LivePricesSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    return LivePricesSnapshotSchema.parse(JSON.parse(raw));
  } catch {
    console.warn(`[prices-store] ${PRICES_KV_KEY} failed validation — ignoring stored value`);
    return undefined;
  }
}

/** Content equality: quote substance only (never updatedAt/generatedAt). */
export function livePriceEntriesEqual(a: LivePriceEntry, b: LivePriceEntry): boolean {
  return (
    a.value === b.value &&
    a.asOf === b.asOf &&
    a.change7d === b.change7d &&
    a.change30d === b.change30d &&
    a.sourceSymbol === b.sourceSymbol
  );
}

/** Snapshot-level content equality (same asset set + equal entries). */
export function livePricesContentEqual(a: LivePricesSnapshot | undefined, b: LivePricesSnapshot | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  const aKeys = Object.keys(a.assets);
  const bKeys = Object.keys(b.assets);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    const av = a.assets[key as PriceAssetId];
    const bv = b.assets[key as PriceAssetId];
    if (av === undefined || bv === undefined || !livePriceEntriesEqual(av, bv)) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ *
 * In-memory adapter (tests, local dry-runs)
 * ------------------------------------------------------------------ */

export class InMemoryPricesStore implements PricesReader, PricesWriter {
  private value: string | null = null;
  /** Test-visible counters — the budget test asserts on these. */
  readonly ops = { reads: 0, writes: 0 };

  async getLivePrices(): Promise<LivePricesSnapshot | undefined> {
    this.ops.reads++;
    return parseStoredLivePrices(this.value);
  }

  async putLivePricesIfChanged(next: LivePricesSnapshot): Promise<'written' | 'unchanged'> {
    this.ops.reads++; // the write gate itself needs the stored value
    const stored = parseStoredLivePrices(this.value);
    if (livePricesContentEqual(stored, next)) return 'unchanged';
    this.ops.writes++;
    this.value = JSON.stringify(next);
    return 'written';
  }
}

/* ------------------------------------------------------------------ *
 * KV-binding adapter (the currena-api cron rung's store)
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
 * The cron rung's store over the RATES namespace binding. Reads are
 * uncached (the write gate must compare against the truth).
 */
export class KvPricesStore implements PricesReader, PricesWriter {
  constructor(private readonly kv: KVLike) {}

  async getLivePrices(): Promise<LivePricesSnapshot | undefined> {
    return parseStoredLivePrices(await this.kv.get(PRICES_KV_KEY));
  }

  async putLivePricesIfChanged(next: LivePricesSnapshot): Promise<'written' | 'unchanged'> {
    const stored = await this.getLivePrices();
    if (livePricesContentEqual(stored, next)) return 'unchanged';
    await this.kv.put(PRICES_KV_KEY, JSON.stringify(next));
    return 'written';
  }
}

/* ------------------------------------------------------------------ *
 * Cloudflare REST adapter (manual runner — "Path B")
 * ------------------------------------------------------------------ */

export const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export interface RestPricesOptions {
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

export class RestPricesStore implements PricesReader, PricesWriter {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly retryDelaysMs: readonly number[];
  readonly ops = { reads: 0, writes: 0, retriedWrites: 0 };

  constructor(private readonly opts: RestPricesOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
    this.baseUrl = opts.baseUrl ?? CLOUDFLARE_API_BASE;
    this.retryDelaysMs = opts.retryDelaysMs ?? [60_000, 120_000];
  }

  private url(): string {
    return (
      `${this.baseUrl}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(PRICES_KV_KEY)}`
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
      throw new Error(`[prices-store] GET ${PRICES_KV_KEY} → HTTP ${res.status}: ${body.slice(0, 200)}`);
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
          `[prices-store] PUT ${PRICES_KV_KEY} hit the daily KV write cap — retry ${attempt + 1}/${this.retryDelaysMs.length} in ${Math.round(delay / 1000)}s`,
        );
        await this.sleep(delay);
        attempt++;
        continue;
      }
      throw new Error(`[prices-store] PUT ${PRICES_KV_KEY} → HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
  }

  async getLivePrices(): Promise<LivePricesSnapshot | undefined> {
    return parseStoredLivePrices(await this.getText());
  }

  async putLivePricesIfChanged(next: LivePricesSnapshot): Promise<'written' | 'unchanged'> {
    const stored = await this.getLivePrices();
    if (livePricesContentEqual(stored, next)) return 'unchanged';
    await this.put(JSON.stringify(next));
    return 'written';
  }
}
