/**
 * World currencies API client — GET /api/insights/fx
 * (insights-world-currencies-spec.md §5 rule 3: the page only reads a stored
 * copy; providers are never called from a page request).
 *
 * Follows lib/markets.ts discipline verbatim: zod-validated with THE
 * contract from @currena/core, last-good localStorage snapshot for
 * instant/offline paint, and this feed NEVER surfaces an error state — the
 * section's designed fallbacks are "loading" and the calm "being prepared"
 * line (spec §9.5), so any failure resolves to null and the caller decides
 * which of those two to show.
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy
 * /insights route chunk, never the entry graph.
 */

import { FxSnapshotSchema } from '@currena/core';
import type { FxSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const FX_CACHE_KEY = 'currena:insights:fx';

/** GET /api/insights/fx — null when anything at all goes wrong. */
export async function fetchFxSnapshot(signal?: AbortSignal): Promise<FxSnapshot | null> {
  const url = '/api/insights/fx';
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
      // 503 fx_not_ready is the EXPECTED "being prepared" answer; every
      // other failure is equally non-fatal for the page.
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
    const parsed = FxSnapshotSchema.safeParse(body);
    if (!parsed.success) return null; // poisoned payload — treat as absent
    writeCachedFx(parsed.data);
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
export function readCachedFx(): FxSnapshot | null {
  try {
    const raw = window.localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = FxSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCachedFx(snapshot: FxSnapshot): void {
  try {
    window.localStorage.setItem(FX_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode or quota — caching is best-effort only.
  }
}
