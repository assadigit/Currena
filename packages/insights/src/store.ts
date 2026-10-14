/**
 * Insights storage contract (roadmap §2 "Contracts and storage") — the twin
 * of `RateStore` (packages/scraper/src/store.ts): everything that touches the
 * Insights KV keys goes through these interfaces, so a KV→D1 migration is a
 * swap of one adapter.
 *
 * This module is a SEPARATE export entry ("./store") — the SPA-facing root
 * export (".") never pulls it. It is platform-free in the AGENTS.md rule-2
 * sense: web-standard `fetch` only (injected, so tests never touch the
 * network), no node:* imports, no clock reads, no KVNamespace type.
 *
 * KV layout (inside the existing RATES namespace, domain-separated by the
 * `insights:` prefix — namespace id in apps/api/wrangler.jsonc):
 *   insights:snapshot   — InsightsSnapshot JSON   (written by the runner)
 *   insights:hist:<id>  — IndicatorHistory JSON   (downsampled 10-year series)
 *   insights:status     — InsightsStatus JSON     (per-source freshness, /admin)
 *
 * No expirationTtl on any Insights key: freshness is carried by the data
 * (generatedAt / asOf / the status vocabulary) and history must never expire
 * (same reasoning as apps/api/src/history.ts).
 *
 * Free-tier write budget (verified live 2026-10-06, GraphQL analytics):
 * the account saturates its 1,000 KV writes/day before midnight UTC through
 * the ever-green rates cron (~1,000/day) + a second worker (~450/day), so
 * the runner schedules itself at 04:20 UTC — inside the fresh post-midnight
 * budget — and `RestInsightsStore` retries writes that bounce off the daily
 * cap (HTTP 429 / error 10048) instead of failing the run instantly.
 */

import {
  IndicatorHistorySchema,
  InsightsSnapshotSchema,
  InsightsStatusSchema,
} from '@currena/core';
import type { IndicatorHistory, InsightsSnapshot, InsightsStatus, IndicatorId } from '@currena/core';

export const INSIGHTS_SNAPSHOT_KEY = 'insights:snapshot';
export const INSIGHTS_STATUS_KEY = 'insights:status';

/**
 * Fix spec A-05 (2026-10-14): the daily snapshot archive — one dated file
 * per day (`insights:archive:v1:<YYYY-MM-DD>`), the exact snapshot the page
 * showed that day (values, statuses, calendar and rule version). The
 * ingest writes today's archive once per run; two years of daily files
 * keep the history the spec asks for (the per-indicator history keys keep
 * the 10-year series). Read via GET /api/insights/archive/:date.
 */
export const INSIGHTS_ARCHIVE_PREFIX = 'insights:archive:v1:';

/** `insights:archive:v1:<date>` — the archived snapshot of that day. */
export function insightsArchiveKey(date: string): string {
  return `${INSIGHTS_ARCHIVE_PREFIX}${date}`;
}

/** `insights:hist:<id>` — one history file per indicator. */
export function insightsHistoryKey(id: IndicatorId): string {
  return `insights:hist:${id}`;
}

/** Read halves — what the Worker's KV adapter implements (serve path). */
export interface InsightsReader {
  getSnapshot(): Promise<InsightsSnapshot | undefined>;
  getHistory(id: IndicatorId): Promise<IndicatorHistory | undefined>;
  getStatus(): Promise<InsightsStatus | undefined>;
  /** Fix spec A-05: a past day's archived snapshot (404-ish undefined when absent). */
  getArchive(date: string): Promise<InsightsSnapshot | undefined>;
}

/** Write halves — what the runner's REST adapter implements. */
export interface InsightsWriter {
  putSnapshot(snapshot: InsightsSnapshot): Promise<void>;
  putHistory(history: IndicatorHistory): Promise<void>;
  putStatus(status: InsightsStatus): Promise<void>;
  /** Fix spec A-05: archive one day's snapshot under its dated key. */
  putArchive(date: string, snapshot: InsightsSnapshot): Promise<void>;
}

export interface InsightsStore extends InsightsReader, InsightsWriter {}

/**
 * Parse a stored JSON value with the poisoned-entry defense (rule #3: a KV
 * value that fails validation is treated as absent — never trusted, never
 * rendered). Returns undefined for null/invalid.
 */
export function parseStoredValue<T>(
  raw: string | null | undefined,
  parse: (value: unknown) => T,
  label: string,
): T | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    return parse(JSON.parse(raw));
  } catch {
    console.warn(`[insights-store] ${label} failed validation — ignoring stored value`);
    return undefined;
  }
}

/* ------------------------------------------------------------------ *
 * In-memory adapter (tests, local dry-runs)
 * ------------------------------------------------------------------ */

/** Simple Map-backed store — the fake every test injects. */
export class InMemoryInsightsStore implements InsightsStore {
  private readonly entries = new Map<string, string>();

  async getSnapshot(): Promise<InsightsSnapshot | undefined> {
    return parseStoredValue(this.entries.get(INSIGHTS_SNAPSHOT_KEY), (v) => InsightsSnapshotSchema.parse(v), INSIGHTS_SNAPSHOT_KEY);
  }

  async putSnapshot(snapshot: InsightsSnapshot): Promise<void> {
    this.entries.set(INSIGHTS_SNAPSHOT_KEY, JSON.stringify(snapshot));
  }

  async getHistory(id: IndicatorId): Promise<IndicatorHistory | undefined> {
    const key = insightsHistoryKey(id);
    return parseStoredValue(this.entries.get(key), (v) => IndicatorHistorySchema.parse(v), key);
  }

  async putHistory(history: IndicatorHistory): Promise<void> {
    this.entries.set(insightsHistoryKey(history.id), JSON.stringify(history));
  }

  async getStatus(): Promise<InsightsStatus | undefined> {
    return parseStoredValue(this.entries.get(INSIGHTS_STATUS_KEY), (v) => InsightsStatusSchema.parse(v), INSIGHTS_STATUS_KEY);
  }

  async putStatus(status: InsightsStatus): Promise<void> {
    this.entries.set(INSIGHTS_STATUS_KEY, JSON.stringify(status));
  }

  async getArchive(date: string): Promise<InsightsSnapshot | undefined> {
    const key = insightsArchiveKey(date);
    return parseStoredValue(this.entries.get(key), (v) => InsightsSnapshotSchema.parse(v), key);
  }

  async putArchive(date: string, snapshot: InsightsSnapshot): Promise<void> {
    this.entries.set(insightsArchiveKey(date), JSON.stringify(snapshot));
  }
}

/* ------------------------------------------------------------------ *
 * Cloudflare REST adapter (the runner's writer + previous-snapshot reader)
 * ------------------------------------------------------------------ */

export const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/** Operation counters for the free-tier write-budget report. */
export interface RestInsightsOps {
  reads: number;
  writes: number;
  retriedWrites: number;
}

export interface RestInsightsOptions {
  /** Cloudflare API token (KV write permission on the Insights namespace). */
  apiToken: string;
  accountId: string;
  /** The RATES namespace id (apps/api/wrangler.jsonc kv_namespaces[0].id). */
  namespaceId: string;
  /** Injected for tests — defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** REST base override (tests). */
  baseUrl?: string;
  /**
   * Delay ladder for daily-cap (429/10048) write retries, in ms. The runner
   * keeps the default [60s, 120s]; tests pass [] to disable retries.
   */
  retryDelaysMs?: readonly number[];
}

/**
 * KV access through the Cloudflare REST API — the "Path B" writer from
 * AGENTS.md rule 8. The token is held privately and never appears in error
 * messages; failures carry status + response excerpt only.
 */
export class RestInsightsStore implements InsightsStore {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly retryDelaysMs: readonly number[];
  readonly ops: RestInsightsOps = { reads: 0, writes: 0, retriedWrites: 0 };

  constructor(private readonly opts: RestInsightsOptions) {
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

  private static excerpt(body: string): string {
    return body.slice(0, 200).replace(/\s+/g, ' ');
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
      throw new Error(`[insights-store] GET ${key} → HTTP ${res.status}: ${RestInsightsStore.excerpt(await res.text())}`);
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
        console.warn(`[insights-store] PUT ${key} hit the daily KV write cap — retry ${attempt + 1}/${this.retryDelaysMs.length} in ${Math.round(delay / 1000)}s`);
        await this.sleep(delay);
        attempt++;
        continue;
      }
      throw new Error(`[insights-store] PUT ${key} → HTTP ${res.status}: ${RestInsightsStore.excerpt(body)}`);
    }
  }

  async getSnapshot(): Promise<InsightsSnapshot | undefined> {
    return parseStoredValue(await this.getText(INSIGHTS_SNAPSHOT_KEY), (v) => InsightsSnapshotSchema.parse(v), INSIGHTS_SNAPSHOT_KEY);
  }

  async putSnapshot(snapshot: InsightsSnapshot): Promise<void> {
    await this.put(INSIGHTS_SNAPSHOT_KEY, JSON.stringify(snapshot));
  }

  async getHistory(id: IndicatorId): Promise<IndicatorHistory | undefined> {
    const key = insightsHistoryKey(id);
    return parseStoredValue(await this.getText(key), (v) => IndicatorHistorySchema.parse(v), key);
  }

  async putHistory(history: IndicatorHistory): Promise<void> {
    await this.put(insightsHistoryKey(history.id), JSON.stringify(history));
  }

  async getStatus(): Promise<InsightsStatus | undefined> {
    return parseStoredValue(await this.getText(INSIGHTS_STATUS_KEY), (v) => InsightsStatusSchema.parse(v), INSIGHTS_STATUS_KEY);
  }

  async putStatus(status: InsightsStatus): Promise<void> {
    await this.put(INSIGHTS_STATUS_KEY, JSON.stringify(status));
  }

  async getArchive(date: string): Promise<InsightsSnapshot | undefined> {
    const key = insightsArchiveKey(date);
    return parseStoredValue(await this.getText(key), (v) => InsightsSnapshotSchema.parse(v), key);
  }

  async putArchive(date: string, snapshot: InsightsSnapshot): Promise<void> {
    await this.put(insightsArchiveKey(date), JSON.stringify(snapshot));
  }
}
