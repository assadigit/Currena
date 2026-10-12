/**
 * World stock markets API client — GET /api/insights/markets
 * (insights-world-markets-spec.md §4 rule 4: the page only reads a stored
 * copy; providers are never called from a page request).
 *
 * Follows lib/insights.ts discipline: zod-validated with THE contract from
 * @currena/core, last-good localStorage snapshot for instant/offline paint.
 * One deliberate difference: this feed NEVER surfaces an error state — the
 * section's designed fallbacks are "loading" and the calm "being prepared"
 * line (spec §6.6), so any failure resolves to null and the caller decides
 * which of those two to show.
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy
 * /insights route chunk, never the entry graph.
 */

import { MarketsSnapshotSchema, RatesErrorSchema } from '@currena/core';
import type { MarketsSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const MARKETS_CACHE_KEY = 'currena:insights:markets';

/** GET /api/insights/markets — null when anything at all goes wrong. */
export async function fetchMarketsSnapshot(signal?: AbortSignal): Promise<MarketsSnapshot | null> {
  const url = '/api/insights/markets';
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const response = await fetch(url, {
      signal: combined,
      headers: { accept: 'application/json' },
      // The route answers public, max-age=300 s-maxage=3600 + ETag — the
      // browser's HTTP cache does revalidation for us.
      cache: 'default',
    });
    if (!response.ok) {
      // 503 markets_not_ready is the EXPECTED "being prepared" answer; every
      // other failure is equally non-fatal for the page.
      if (response.status !== 503) {
        // Drain the error envelope quietly (no diagnostics needed — null is
        // the whole error surface for this feed).
        await response.text().catch(() => '');
      }
      return null;
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return null;
    }
    const parsed = MarketsSnapshotSchema.safeParse(body);
    if (!parsed.success) return null; // poisoned payload — treat as absent
    writeCachedMarkets(parsed.data);
    return parsed.data;
  } catch {
    // Network/timeout/abort — null, never an error state.
    return null;
  }
}

/**
 * Last-good snapshot from localStorage, zod-validated on read (an older
 * contract fails validation and is discarded, never rendered).
 */
export function readCachedMarkets(): MarketsSnapshot | null {
  try {
    const raw = window.localStorage.getItem(MARKETS_CACHE_KEY);
    if (!raw) return null;
    const parsed = MarketsSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCachedMarkets(snapshot: MarketsSnapshot): void {
  try {
    window.localStorage.setItem(MARKETS_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode or quota — caching is best-effort only.
  }
}
