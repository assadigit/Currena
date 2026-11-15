/**
 * Insights API client — GET /api/insights and GET /api/insights/:id/history
 * (Phase I4, docs/insights/04-roadmap.md).
 *
 * Follows lib/api.ts discipline: everything crossing the trust boundary is
 * zod-validated with THE contracts from @currena/core (rule 3) and errors
 * collapse into the shared typed ApiError. Deliberate differences from the
 * rates client:
 *
 *  - `cache: 'default'` — the insights endpoints answer with
 *    `Cache-Control: public, max-age=60|300` plus content-addressed ETags
 *    (apps/api/src/routes/insights.ts), so the browser's HTTP cache does
 *    revalidation for us. Forcing no-store would needlessly refetch.
 *  - A 404 `history_not_found` is an EXPECTED answer (single-point cards
 *    carry no history key by design) — it resolves to null, never an error
 *    surface. Any other failure throws loudly.
 *  - The last-good snapshot persists to localStorage (PWA offline ethos —
 *    the same pattern as snapshot-store/rate-history) so the page renders
 *    offline or during a feed outage, clearly labelled with its date.
 *
 * Platform: browser only (fetch/localStorage) — this module lives in the
 * lazy Insights route chunk, never the entry graph.
 */

import { InsightsSnapshotSchema, IndicatorHistorySchema, RatesErrorSchema } from '@currena/core';
import type { InsightsSnapshot, IndicatorHistory, IndicatorId } from '@currena/core';
import { ApiError } from './api';

export { ApiError };

const TIMEOUT_MS = 20_000;
const SNAPSHOT_CACHE_KEY = 'currena:insights:snapshot';

/** Shared request core (requestJson in api.ts, adapted for HTTP caching). */
async function requestInsightsJson(url: string, signal?: AbortSignal): Promise<Response> {
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

/* ------------------------------------------------------------------ *
 * Snapshot
 * ------------------------------------------------------------------ */

/** GET /api/insights — the full precomputed page payload. */
export async function fetchInsightsSnapshot(signal?: AbortSignal): Promise<InsightsSnapshot> {
  const url = '/api/insights';
  const response = await requestInsightsJson(url, signal);
  if (!response.ok) throw await responseError(url, response);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('parse', `Non-JSON response from ${url} (status ${response.status})`, {
      status: response.status,
    });
  }
  const parsed = InsightsSnapshotSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('parse', `Invalid insights payload: ${parsed.error.message}`, { status: 200 });
  }
  writeCachedSnapshot(parsed.data);
  return parsed.data;
}

/**
 * Last-good snapshot from localStorage, zod-validated on read (garbage from
 * an older contract fails loudly and is discarded, never rendered). Returns
 * null when absent/unparseable — callers treat it as the offline fallback.
 */
export function readCachedSnapshot(): InsightsSnapshot | null {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_CACHE_KEY);
    if (!raw) return null;
    const parsed = InsightsSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCachedSnapshot(snapshot: InsightsSnapshot): void {
  try {
    window.localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode or quota — snapshot caching is best-effort only.
  }
}

/* ------------------------------------------------------------------ *
 * History
 * ------------------------------------------------------------------ */

/**
 * Per-card 10-year history. Module-level promise cache: expanding a card a
 * second time is instant and a 304 revalidation never re-parses. A 404
 * (history_not_found — single-point cards) resolves to null and is cached
 * the same way; network/parse failures reject so the card shows its error
 * row and a retry re-enters through the same function.
 */
const historyCache = new Map<IndicatorId, Promise<IndicatorHistory | null>>();

export function fetchIndicatorHistory(
  id: IndicatorId,
  signal?: AbortSignal,
): Promise<IndicatorHistory | null> {
  const cached = historyCache.get(id);
  if (cached) return cached;
  const url = `/api/insights/${encodeURIComponent(id)}/history`;
  const promise = (async (): Promise<IndicatorHistory | null> => {
    const response = await requestInsightsJson(url, signal);
    if (response.status === 404) return null; // Expected for single-point cards.
    if (!response.ok) throw await responseError(url, response);
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ApiError('parse', `Non-JSON response from ${url} (status ${response.status})`, {
        status: response.status,
      });
    }
    const parsed = IndicatorHistorySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('parse', `Invalid history payload for ${id}: ${parsed.error.message}`, {
        status: 200,
      });
    }
    if (parsed.data.id !== id) {
      throw new ApiError('parse', `History payload id mismatch: asked ${id}, got ${parsed.data.id}`, {
        status: 200,
      });
    }
    return parsed.data;
  })();
  // A failed fetch must be retryable — drop the rejected promise from the cache.
  promise.catch(() => historyCache.delete(id));
  historyCache.set(id, promise);
  return promise;
}

/** Test seam — clears the in-memory history cache. */
export function clearHistoryCacheForTests(): void {
  historyCache.clear();
}
