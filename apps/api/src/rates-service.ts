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

/**
 * Logical single-flight lock TTL (KV cleanup TTL is clamped to KV's 60s min).
 * Must exceed SCRAPE_DEADLINE_MS + persist time so a healthy scrape never
 * overruns its own lock (a takeover mid-scrape used to admit a 2nd scrape).
 */
export const LOCK_TTL_SEC = 30;

/**
 * Overall budget for ONE scrape attempt (ajax + 16-page fallback chain).
 * Without it the TGJU fallback could run ~2.5 minutes (16 pages × 3 attempts
 * × 12 s at 4-concurrency) — far past the lock TTL and past any sane request
 * latency; the ladder now falls through to stale-cache after this budget.
 */
export const SCRAPE_DEADLINE_MS = 25_000;

/** Scraper registry — one function per snapshot source. */
export type Scrapers = { [S in SnapshotSource]: () => Promise<Snapshot> };

export interface RatesServiceOptions {
  store: RateStore;
  scrapers: Scrapers;
  /** Injectable clock (tests). Default: real time. */
  now?: () => Date;
  lockTtlSec?: number;
  /** Overall scrape budget. Default: SCRAPE_DEADLINE_MS. 0 disables (tests). */
  scrapeDeadlineMs?: number;
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

/** Resolve `promise` within `deadlineMs`, else reject (Promise.race attaches
 *  a handler to the loser, so its eventual rejection is never unhandled). */
async function raceWithDeadline<T>(promise: Promise<T>, deadlineMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`scrape deadline exceeded (${deadlineMs}ms)`)), deadlineMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export class RatesService {
  private readonly store: RateStore;
  private readonly scrapers: Scrapers;
  private readonly now: () => Date;
  private readonly lockTtlSec: number;
  private readonly scrapeDeadlineMs: number;

  constructor(opts: RatesServiceOptions) {
    this.store = opts.store;
    this.scrapers = opts.scrapers;
    this.now = opts.now ?? (() => new Date());
    this.lockTtlSec = opts.lockTtlSec ?? LOCK_TTL_SEC;
    this.scrapeDeadlineMs = opts.scrapeDeadlineMs ?? SCRAPE_DEADLINE_MS;
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
      const lockToken = await this.store.tryAcquireLock(source, this.lockTtlSec);
      if (lockToken !== false) {
        const startedAt = this.now();
        let snapshot: Snapshot | undefined;
        let scrapeError: unknown;
        try {
          const scraped = this.scrapers[source]();
          // Deadline race: a pathological chain (ajax + 16-page fallback) must
          // never hold the request (and the lock) for minutes — fall through
          // to stale-cache instead.
          const parsed = this.scrapeDeadlineMs > 0
            ? await raceWithDeadline(scraped, this.scrapeDeadlineMs)
            : await scraped;
          snapshot = SnapshotSchema.parse(parsed); // belt-and-braces re-validation
        } catch (err) {
          scrapeError = err;
        }
        const finishedAt = this.now();

        // Persist outcome; a KV write failure must NEVER mask the ladder:
        // with fresh data in hand we still serve it live (uncached), and a
        // failed status write must not abort the fall-through to stale.
        try {
          if (snapshot !== undefined) {
            await this.store.putSnapshot(source, snapshot, CACHE_HARD_TTL_SEC);
            await this.store.putStatus(source, {
              source,
              lastScrapeAt: startedAt.toISOString(),
              lastSuccessAt: finishedAt.toISOString(),
              lastDurationMs: finishedAt.getTime() - startedAt.getTime(),
              ...(previousStatus?.lastError ? { lastError: previousStatus.lastError } : {}),
            });
          } else {
            const { code, message } = errorToCodeMessage(scrapeError);
            await this.store.putStatus(source, {
              source,
              lastScrapeAt: startedAt.toISOString(),
              ...(previousStatus?.lastSuccessAt ? { lastSuccessAt: previousStatus.lastSuccessAt } : {}),
              lastError: { code, message, at: finishedAt.toISOString() },
              lastDurationMs: finishedAt.getTime() - startedAt.getTime(),
            });
          }
        } catch (persistErr) {
          console.warn(`[rates] persist failed for ${source} — degrading gracefully:`, persistErr);
        }

        // Best-effort release; a failure leaves the lock to its TTL.
        try {
          await this.store.releaseLock(source, lockToken);
        } catch (releaseErr) {
          console.warn(`[rates] lock release failed for ${source} (TTL will reclaim):`, releaseErr);
        }

        if (snapshot !== undefined) {
          return { snapshot, stale: false, servedFrom: 'live' };
        }
        // fall through to step 3
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
