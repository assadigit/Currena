/**
 * Central-bank gold demand API client — GET /api/insights/gold-cb
 * (GPE R14 / F2a Tier-1, 2026-11-18; the usa/tic.ts discipline, verbatim
 * as the pattern: zod-validated with THE contract from @currena/core,
 * last-good localStorage snapshot for instant/offline paint, and this
 * feed NEVER surfaces an error state — the section's designed fallbacks
 * are "loading" and the calm unavailable line, so any failure resolves
 * to null and the caller decides which of those two to show).
 *
 * Staleness is derived at RENDER time from the snapshot's own asOf month
 * (the card labels it) — the endpoint serves the document verbatim.
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy /gold
 * route chunk, never the entry graph.
 */

import { GoldCbSnapshotSchema } from '@currena/core';
import type { GoldCbSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const GOLD_CB_CACHE_KEY = 'currena:insights:gold-cb';

/** GET /api/insights/gold-cb — null when anything at all goes wrong. */
export async function fetchGoldCbSnapshot(signal?: AbortSignal): Promise<GoldCbSnapshot | null> {
  const url = '/api/insights/gold-cb';
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
      // 503 gold_cb_not_ready is the EXPECTED "being prepared" answer
      // (the rung has not landed yet); every other failure is equally
      // non-fatal for the page.
      if (response.status !== 503) {
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
    const parsed = GoldCbSnapshotSchema.safeParse(body);
    if (!parsed.success) return null; // poisoned payload — treat as absent
    writeCachedGoldCb(parsed.data);
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
export function readCachedGoldCb(): GoldCbSnapshot | null {
  try {
    const raw = window.localStorage.getItem(GOLD_CB_CACHE_KEY);
    if (!raw) return null;
    const parsed = GoldCbSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCachedGoldCb(snapshot: GoldCbSnapshot): void {
  try {
    window.localStorage.setItem(GOLD_CB_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode or quota — caching is best-effort only.
  }
}
