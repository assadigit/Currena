/**
 * Foreign holders of US Treasuries API client — GET /api/insights/tic
 * (gap-closure S2-M2.3; the owner's top-priority feature).
 *
 * Follows lib/markets.ts discipline exactly: zod-validated with THE
 * contract from @currena/core, last-good localStorage snapshot for
 * instant/offline paint, and this feed NEVER surfaces an error state —
 * the section's designed fallbacks are "loading" and the calm "being
 * prepared" line, so any failure resolves to null and the caller decides
 * which of those two to show.
 *
 * Staleness is derived at RENDER time from dataMonth (the shared pure
 * ticIsStale) — the endpoint serves the snapshot verbatim, and the UI
 * never presents a >70-day-old table as current.
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy
 * /insights route chunk, never the entry graph.
 */

import { TicSnapshotSchema } from '@currena/core';
import type { TicSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const TIC_CACHE_KEY = 'currena:insights:tic';

/** GET /api/insights/tic — null when anything at all goes wrong. */
export async function fetchTicSnapshot(signal?: AbortSignal): Promise<TicSnapshot | null> {
  const url = '/api/insights/tic';
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const response = await fetch(url, {
      signal: combined,
      headers: { accept: 'application/json' },
      // The route answers public, max-age=300 s-maxage=300 + ETag — the
      // browser's HTTP cache does revalidation for us.
      cache: 'default',
    });
    if (!response.ok) {
      // 503 tic_not_ready is the EXPECTED "being prepared" answer; every
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
    const parsed = TicSnapshotSchema.safeParse(body);
    if (!parsed.success) return null; // poisoned payload — treat as absent
    writeCachedTic(parsed.data);
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
export function readCachedTic(): TicSnapshot | null {
  try {
    const raw = window.localStorage.getItem(TIC_CACHE_KEY);
    if (!raw) return null;
    const parsed = TicSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCachedTic(snapshot: TicSnapshot): void {
  try {
    window.localStorage.setItem(TIC_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode or quota — caching is best-effort only.
  }
}
