/**
 * RatesService — the fallback ladder (mission §5/§6, verbatim semantics):
 *
 *  1. Cached snapshot exists && age < freshTtlSec(source) (tgju 300s /
 *     frankfurter 900s — per-source, see @currena/core)
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
 * Store-failure degradation (2026-10-07 production incident — KV writes
 * started failing mid-afternoon, e.g. free-tier daily write-budget
 * exhaustion, while a perfectly good 7-day snapshot sat in KV): the ladder
 * never lets a RateStore error escape as a 500. A snapshot READ failure
 * treats the cache as absent (the rungs continue); a status-read or
 * lock-acquire failure SKIPS the live rung entirely — single-flight is a
 * store guarantee, so when the store cannot provide it we do not scrape —
 * and falls to the cached rungs (stale-with-notice, or the honest 503 of
 * rung 4 when nothing is cached). Only RatesServiceError ever leaves here.
 *
 * Platform-free (AGENTS.md rule 2): RateStore + scraper functions are
 * injected, so the whole ladder is unit-testable with the in-memory store
 * fake and fake scrapers — no Workers, no live sites.
 */

import {
  CACHE_HARD_TTL_SEC,
  MIN_SCRAPE_INTERVAL_SEC,
  SnapshotSchema,
  freshTtlSec,
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
    // Step 1 — fresh cache, zero network (force skips it: refresh must
    // scrape). A snapshot READ failure is a degraded store, not a 500: treat
    // the cache as absent and continue down the ladder (2026-10-07 incident).
    let cached: Snapshot | undefined;
    try {
      cached = await this.store.getSnapshot(source);
    } catch (readErr) {
      console.warn(`[rates] snapshot read failed for ${source} — continuing without cache:`, readErr);
    }
    if (!options.force && cached && ageSec(cached.fetchedAt, this.now()) < freshTtlSec(source)) {
      return { snapshot: cached, stale: false, servedFrom: 'cache' };
    }

    // Step 2 — live scrape (guarded by min-interval + best-effort
    // single-flight). The live rung is strictly best-effort: a status-read
    // or lock-acquire failure skips it and falls to the cached rungs — the
    // single-flight lock is a STORE guarantee, so when the store cannot
    // provide it we do NOT scrape (2026-10-07 incident: failing lock puts
    // escaped as 500s while a good 7-day snapshot sat in KV).
    let statusReadOk = true;
    let previousStatus: SourceStatus | undefined;
    try {
      previousStatus = await this.store.getStatus(source);
    } catch (statusErr) {
      statusReadOk = false;
      console.warn(`[rates] status read failed for ${source} — skipping the live rung:`, statusErr);
    }
    const lastScrapeMs = previousStatus?.lastScrapeAt ? Date.parse(previousStatus.lastScrapeAt) : Number.NaN;
    const intervalElapsed =
      Number.isFinite(lastScrapeMs) === false ||
      (this.now().getTime() - lastScrapeMs) / 1000 >= MIN_SCRAPE_INTERVAL_SEC;
    if (options.force || (statusReadOk && intervalElapsed)) {
      let lockToken: string | false = false;
      try {
        lockToken = await this.store.tryAcquireLock(source, this.lockTtlSec);
      } catch (lockErr) {
        console.warn(`[rates] lock acquire failed for ${source} — skipping the live rung:`, lockErr);
      }
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
    // Parallel reads: 4 sequential KV round-trips used to gate this route
    // (and every /admin view) end to end.
    const sources = await Promise.all(
      (['tgju', 'frankfurter'] as const).map(async (source): Promise<StatusReportSource> => {
        const [status, snapshot] = await Promise.all([
          this.store.getStatus(source),
          this.store.getSnapshot(source),
        ]);
        const cacheAgeSec = snapshot ? Math.max(0, ageSec(snapshot.fetchedAt, now)) : undefined;
        return {
          source,
          ...(status ? { status } : {}),
          cache: {
            present: snapshot !== undefined,
            ...(snapshot ? { fetchedAt: snapshot.fetchedAt } : {}),
            ...(cacheAgeSec !== undefined ? { ageSec: Math.round(cacheAgeSec) } : {}),
            fresh: cacheAgeSec !== undefined && cacheAgeSec < freshTtlSec(source),
          },
        };
      }),
    );
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
