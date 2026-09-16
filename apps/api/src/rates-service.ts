/**
 * RatesService — the fallback ladder (mission §5/§6, verbatim semantics):
 *
 *  1. Cached snapshot exists && age < FRESH_TTL_SEC (300s)
 *     → serve {snapshot, stale: false, servedFrom: 'cache'} — ZERO network.
 *  2. Else, if lock free && status.lastScrapeAt older than
 *     MIN_SCRAPE_INTERVAL_SEC (60s) → best-effort single-flight lock
 *     (~25s TTL), scrape, zod-validate, store, update status →
 *     serve {stale: false, servedFrom: 'live'}. Scrape failure: record
 *     status, fall through to 3. `force` (internal/refresh) bypasses the
 *     min-interval guard, not the single-flight lock.
 *  3. Cached snapshot (age < CACHE_HARD_TTL_SEC, 7d)
 *     → serve {snapshot, stale: true, servedFrom: 'cache', notice}.
 *  4. Nothing usable → RatesServiceError('source_unavailable', retryAfterSec 60)
 *     → HTTP 503 RatesError at the route layer.
 *
 * Platform-free (AGENTS.md rule 2): RateStore + scraper functions are
 * injected, so the whole ladder is unit-testable with the in-memory store
 * fake and fake scrapers — no Workers, no live sites.
 */

import {
  CACHE_HARD_TTL_SEC,
  FRESH_TTL_SEC,
  MIN_SCRAPE_INTERVAL_SEC,
  SnapshotSchema,
} from '@currena/core';
import type { RatesResponse, Snapshot, SnapshotSource } from '@currena/core';
import { errorToCodeMessage, type RateStore, type SourceStatus } from '@currena/scraper';

/** Logical single-flight lock TTL (KV cleanup TTL is clamped to KV's 60s min). */
export const LOCK_TTL_SEC = 25;

/** Scraper registry — one function per snapshot source. */
export type Scrapers = { [S in SnapshotSource]: () => Promise<Snapshot> };

export interface RatesServiceOptions {
  store: RateStore;
  scrapers: Scrapers;
  /** Injectable clock (tests). Default: real time. */
  now?: () => Date;
  lockTtlSec?: number;
}

/** Ladder step 4 — surfaces as HTTP 503 RatesError at the route layer. */
export class RatesServiceError extends Error {
  readonly code: string;
  readonly retryAfterSec: number;

  constructor(code: string, message: string, retryAfterSec = MIN_SCRAPE_INTERVAL_SEC) {
    super(message);
    this.name = 'RatesServiceError';
    this.code = code;
    this.retryAfterSec = retryAfterSec;
  }
}

export interface GetRatesOptions {
  /** internal/refresh: bypass step 1 (fresh cache) + MIN_SCRAPE_INTERVAL_SEC; still single-flight. */
  force?: boolean;
}

function ageSec(iso: string, now: Date): number {
  return (now.getTime() - Date.parse(iso)) / 1000;
}

/** '5 minutes' / '3 hours' / '2 days' — used in the stale notice. */
export function humanizeAge(sec: number): string {
  if (sec < 60) return `${Math.max(0, Math.round(sec))} second${plural(sec)}`;
  if (sec < 3600) return `${Math.round(sec / 60)} minute${plural(sec / 60)}`;
  if (sec < 86_400) return `${Math.round(sec / 3600)} hour${plural(sec / 3600)}`;
  return `${Math.round(sec / 86_400)} day${plural(sec / 86_400)}`;
}

function plural(value: number): string {
  return Math.round(value) === 1 ? '' : 's';
}

export class RatesService {
  private readonly store: RateStore;
  private readonly scrapers: Scrapers;
  private readonly now: () => Date;
  private readonly lockTtlSec: number;

  constructor(opts: RatesServiceOptions) {
    this.store = opts.store;
    this.scrapers = opts.scrapers;
    this.now = opts.now ?? (() => new Date());
    this.lockTtlSec = opts.lockTtlSec ?? LOCK_TTL_SEC;
  }

  /** Run the ladder for one source. */
  async getRates(source: SnapshotSource, options: GetRatesOptions = {}): Promise<RatesResponse> {
    // Step 1 — fresh cache, zero network (force skips it: refresh must scrape).
    const cached = await this.store.getSnapshot(source);
    if (!options.force && cached && ageSec(cached.fetchedAt, this.now()) < FRESH_TTL_SEC) {
      return { snapshot: cached, stale: false, servedFrom: 'cache' };
    }

    // Step 2 — live scrape (guarded by min-interval + best-effort single-flight).
    const previousStatus = await this.store.getStatus(source);
    const lastScrapeMs = previousStatus?.lastScrapeAt ? Date.parse(previousStatus.lastScrapeAt) : Number.NaN;
    const intervalElapsed =
      Number.isFinite(lastScrapeMs) === false ||
      (this.now().getTime() - lastScrapeMs) / 1000 >= MIN_SCRAPE_INTERVAL_SEC;
    if (options.force || intervalElapsed) {
      const acquired = await this.store.tryAcquireLock(source, this.lockTtlSec);
      if (acquired) {
        const startedAt = this.now();
        try {
          const scraped = await this.scrapers[source]();
          const snapshot = SnapshotSchema.parse(scraped); // belt-and-braces re-validation
          const finishedAt = this.now();
          await this.store.putSnapshot(source, snapshot, CACHE_HARD_TTL_SEC);
          await this.store.putStatus(source, {
            source,
            lastScrapeAt: startedAt.toISOString(),
            lastSuccessAt: finishedAt.toISOString(),
            lastDurationMs: finishedAt.getTime() - startedAt.getTime(),
            ...(previousStatus?.lastError ? { lastError: previousStatus.lastError } : {}),
          });
          return { snapshot, stale: false, servedFrom: 'live' };
        } catch (err) {
          const finishedAt = this.now();
          const { code, message } = errorToCodeMessage(err);
          await this.store.putStatus(source, {
            source,
            lastScrapeAt: startedAt.toISOString(),
            ...(previousStatus?.lastSuccessAt ? { lastSuccessAt: previousStatus.lastSuccessAt } : {}),
            lastError: { code, message, at: finishedAt.toISOString() },
            lastDurationMs: finishedAt.getTime() - startedAt.getTime(),
          });
          // fall through to step 3
        } finally {
          await this.store.releaseLock(source);
        }
      }
    }

    // Step 3 — stale cache with notice.
    if (cached && ageSec(cached.fetchedAt, this.now()) < CACHE_HARD_TTL_SEC) {
      const age = ageSec(cached.fetchedAt, this.now());
      return {
        snapshot: cached,
        stale: true,
        servedFrom: 'cache',
        notice: `Using cached rates — last updated ${humanizeAge(age)} ago`,
      };
    }

    // Step 4 — nothing usable.
    throw new RatesServiceError(
      'source_unavailable',
      `Live rates for source '${source}' are unavailable and no usable cached snapshot exists. Please retry shortly.`,
    );
  }

  /** Read-only cached-snapshot access (admin page). No ladder, no network. */
  async snapshot(source: SnapshotSource): Promise<Snapshot | undefined> {
    return this.store.getSnapshot(source);
  }

  /** /api/status payload: SourceStatus + cache age/freshness per source. */
  async status(): Promise<StatusReport> {
    const now = this.now();
    const sources: StatusReportSource[] = [];
    for (const source of ['tgju', 'frankfurter'] as const) {
      const status: SourceStatus | undefined = await this.store.getStatus(source);
      const snapshot = await this.store.getSnapshot(source);
      const cacheAgeSec = snapshot ? Math.max(0, ageSec(snapshot.fetchedAt, now)) : undefined;
      sources.push({
        source,
        ...(status ? { status } : {}),
        cache: {
          present: snapshot !== undefined,
          ...(snapshot ? { fetchedAt: snapshot.fetchedAt } : {}),
          ...(cacheAgeSec !== undefined ? { ageSec: Math.round(cacheAgeSec) } : {}),
          fresh: cacheAgeSec !== undefined && cacheAgeSec < FRESH_TTL_SEC,
        },
      });
    }
    return { now: now.toISOString(), sources };
  }
}

export interface StatusReportSource {
  source: SnapshotSource;
  status?: SourceStatus;
  cache: {
    present: boolean;
    fetchedAt?: string;
    ageSec?: number;
    fresh: boolean;
  };
}

export interface StatusReport {
  now: string;
  sources: StatusReportSource[];
}
