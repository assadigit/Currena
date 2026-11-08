/**
 * Page-division projection client (S2, 2026-11-08).
 *
 * GET /api/insights/pages (the destination index) + GET
 * /api/insights/pages/:page (one destination's curated payload) — the
 * WEB side of the S2 contract between engine and pages. The placement
 * itself (which ids belong to which page) is shared engine-side
 * (`@currena/insights/page-division`) so the SPA's page builds (S3+)
 * never re-declare membership; this module only moves the wire bytes.
 *
 * Follows the lib/insights.ts discipline: everything crossing the trust
 * boundary is zod-validated with THE contracts from @currena/core
 * (rule 3); `cache: 'default'` because the endpoints answer with
 * content-addressed ETags + max-age; errors collapse into the shared
 * typed ApiError. A 404 `unknown_page` is a PROGRAMMING error (a page id
 * that is not in the placement) — it throws loudly, unlike the history
 * client's expected-404 discipline.
 *
 * Deliberately minimal for S2: fetch + validate + an in-memory promise
 * cache per page (revisiting a page is instant; a rejected fetch drops
 * from the cache so a retry re-enters). The last-good localStorage
 * offline pattern joins per-page when the page builds land (S3+) — the
 * contract is frozen today, the polish is not.
 *
 * Platform: browser only (fetch) — this module lives in the lazy
 * page-division route chunks, never the entry graph.
 */

import { PageIndexSchema, PageProjectionSchema, RatesErrorSchema } from '@currena/core';
import type { PageDivisionPageId, PageIndex, PageProjection } from '@currena/core';
import { ApiError } from './insights';

export { ApiError };

const TIMEOUT_MS = 20_000;

/** Shared request core (the insights client's, adapted for HTTP caching). */
async function requestPageJson(url: string, signal?: AbortSignal): Promise<Response> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    return await fetch(url, {
      signal: combined,
      headers: { accept: 'application/json' },
      cache: 'default',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError' && signal?.aborted) {
      throw err; // Caller-initiated aborts propagate untouched (unmount, retry).
    }
    throw new ApiError('network', err instanceof Error ? err.message : 'Network request failed');
  }
}

/** Parse a non-2xx response into a typed ApiError via the RatesError envelope. */
async function responseError(url: string, response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* non-JSON error body — fall through to the parse error below */
  }
  const envelope = RatesErrorSchema.safeParse(body);
  if (envelope.success) {
    return new ApiError('rates', envelope.data.error.message, {
      code: envelope.data.error.code,
      status: response.status,
      retryAfterSec: envelope.data.error.retryAfterSec,
    });
  }
  return new ApiError('parse', `Error response from ${url} (status ${response.status})`, {
    status: response.status,
  });
}

/** Parse + validate a 2xx JSON body against a projection contract. */
async function parsePageJson<T>(url: string, response: Response, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { message: string } } }, what: string): Promise<T> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('parse', `Non-JSON response from ${url} (status ${response.status})`, {
      status: response.status,
    });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('parse', `Invalid ${what} payload: ${parsed.error.message}`, { status: 200 });
  }
  return parsed.data;
}

/* ------------------------------------------------------------------ *
 * The projection index
 * ------------------------------------------------------------------ */

/** GET /api/insights/pages — the destination list (static per deploy). */
export async function fetchPageIndex(signal?: AbortSignal): Promise<PageIndex> {
  const url = '/api/insights/pages';
  const response = await requestPageJson(url, signal);
  if (!response.ok) throw await responseError(url, response);
  return parsePageJson(url, response, PageIndexSchema, 'page index');
}

/* ------------------------------------------------------------------ *
 * One destination's projection
 * ------------------------------------------------------------------ */

/** The per-page promise cache — a second visit resolves instantly. */
const projectionCache = new Map<PageDivisionPageId, Promise<PageProjection>>();

/**
 * GET /api/insights/pages/:page — one destination's data projection (the
 * page's home + mirror readings, the boards manifest, honest absentIds).
 * The served payload honours the site's access mode (public projections
 * omit the licence-hidden ids — read `absentIds` and display the honest
 * "not published" note, never a guess).
 */
export function fetchPageProjection(page: PageDivisionPageId, signal?: AbortSignal): Promise<PageProjection> {
  const cached = projectionCache.get(page);
  if (cached) return cached;
  const url = `/api/insights/pages/${encodeURIComponent(page)}`;
  const promise = (async (): Promise<PageProjection> => {
    const response = await requestPageJson(url, signal);
    if (!response.ok) throw await responseError(url, response);
    const projection = await parsePageJson(url, response, PageProjectionSchema, `page projection for ${page}`);
    if (projection.page !== page) {
      throw new ApiError('parse', `Projection page mismatch: asked ${page}, got ${projection.page}`, {
        status: 200,
      });
    }
    return projection;
  })();
  // A failed fetch must be retryable — drop the rejected promise from the cache.
  promise.catch(() => projectionCache.delete(page));
  projectionCache.set(page, promise);
  // S3: persist the last-good projection for the offline/outage fallback.
  void cacheProjectionOnSuccess(page, promise);
  return promise;
}

/** Test seam — clears the in-memory projection cache. */
export function clearProjectionCacheForTests(): void {
  projectionCache.clear();
}

/* ------------------------------------------------------------------ *
 * The last-good offline cache (S3, 2026-11-08 — the S2 doc's promised
 * per-page polish, the lib/insights.ts pattern: a fresh projection
 * persists to localStorage so the page renders offline or during a feed
 * outage, clearly labelled with its generation stamp; a poisoned or
 * older-contract payload fails validation and reads as absent).
 * ------------------------------------------------------------------ */

const pageCacheKey = (page: PageDivisionPageId): string => `currena:insights:page:${page}`;

function writeCachedProjection(page: PageDivisionPageId, projection: PageProjection): void {
  try {
    window.localStorage.setItem(pageCacheKey(page), JSON.stringify(projection));
  } catch {
    // Private mode or quota — projection caching is best-effort only.
  }
}

/**
 * Last-good projection from localStorage, zod-validated on read (garbage
 * from an older contract fails loudly and is discarded, never rendered).
 * Returns null when absent/unparseable — callers treat it as the offline
 * fallback and label its date (the snapshot-store discipline).
 */
export function readCachedPageProjection(page: PageDivisionPageId): PageProjection | null {
  try {
    const raw = window.localStorage.getItem(pageCacheKey(page));
    if (!raw) return null;
    const parsed = PageProjectionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

/** Wire the cache into the fetch path (called once by the page builds). */
function cacheProjectionOnSuccess(page: PageDivisionPageId, promise: Promise<PageProjection>): Promise<PageProjection> {
  promise.then((projection) => writeCachedProjection(page, projection)).catch(() => undefined);
  return promise;
}
