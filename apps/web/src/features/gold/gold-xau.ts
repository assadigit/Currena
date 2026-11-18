/**
 * gold-xau.ts — GPE R18 / F7 + R19 / F8 (2026-11-18): the XAUUSD daily
 * OHLC series' web client — GET /api/insights/gold-ohlc (the gold-cb/tic
 * discipline, verbatim as the pattern: zod-validated with THE contract
 * from @currena/core, last-good localStorage snapshot for the
 * instant/offline paint, module-cached so the interactive chart (R18)
 * and the TA band (R19) share ONE fetch — never two).
 *
 * This feed NEVER surfaces an error state to the caller as a throw —
 * the designed fallbacks are "loading" and the calm unavailable line;
 * any failure resolves to null and the caller decides which of those two
 * to show. Staleness is data-carried (the snapshot's own asOf date + the
 * fetchedAt stamp — the components label the series and its window).
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy /gold
 * route chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import { GoldXauOhlcSnapshotSchema } from '@currena/core';
import type { GoldXauOhlcSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const GOLD_XAU_CACHE_KEY = 'currena:insights:gold-xau';

/** The module-level in-flight promise — one fetch serves every caller. */
let inFlight: Promise<GoldXauOhlcSnapshot | null> | null = null;

/** GET /api/insights/gold-ohlc — null when anything at all goes wrong. */
export function fetchGoldXauOhlc(signal?: AbortSignal): Promise<GoldXauOhlcSnapshot | null> {
  if (inFlight !== null) return inFlight;
  inFlight = (async () => {
    const url = '/api/insights/gold-ohlc';
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
        // 503 gold_ohlc_not_ready is the EXPECTED "being prepared" answer
        // (the rung has not landed yet); every other failure is equally
        // non-fatal for the page.
        return null;
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return null;
      }
      const parsed = GoldXauOhlcSnapshotSchema.safeParse(body);
      if (!parsed.success) return null; // poisoned payload — treat as absent
      writeCachedGoldXau(parsed.data);
      return parsed.data;
    } catch {
      // Network/timeout/abort — null, never an error state.
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/**
 * Last-good snapshot from localStorage, zod-validated on read (an older
 * contract fails validation and is discarded, never rendered).
 */
export function readCachedGoldXau(): GoldXauOhlcSnapshot | null {
  try {
    const raw = window.localStorage.getItem(GOLD_XAU_CACHE_KEY);
    if (!raw) return null;
    const parsed = GoldXauOhlcSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCachedGoldXau(snapshot: GoldXauOhlcSnapshot): void {
  try {
    window.localStorage.setItem(GOLD_XAU_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode or quota — caching is best-effort only.
  }
}

/** The test seam (the clearHistoryCacheForTests pattern). */
export function clearGoldXauCacheForTests(): void {
  inFlight = null;
  try {
    window.localStorage.removeItem(GOLD_XAU_CACHE_KEY);
  } catch {
    /* best-effort */
  }
}

export type GoldXauState =
  | { kind: 'loading'; cached: GoldXauOhlcSnapshot | null }
  | { kind: 'ready'; snapshot: GoldXauOhlcSnapshot }
  | { kind: 'none' };

/**
 * The shared hook — ONE module-cached fetch for the whole page (the chart
 * AND the TA band call this; the second caller reuses the first's
 * promise). Boots from the last-good localStorage copy (the instant
 * M-17 paint), refreshes in the background, and resolves to the honest
 * 'none' state when nothing could be read (first visit before the rung
 * has ever landed, or a network failure with no cache) — never a guess.
 */
export function useGoldXauOhlc(): GoldXauState {
  const [state, setState] = useState<GoldXauState>(() => {
    try {
      return { kind: 'loading', cached: readCachedGoldXau() };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchGoldXauOhlc()
      .then((snapshot) => {
        if (cancelled) return;
        setState(snapshot !== null ? { kind: 'ready', snapshot } : { kind: 'none' });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'none' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The boot-from-cache paint resolves the moment the fetch answers — or
  // keeps the cached copy on a failed refresh (the last-good path).
  if (state.kind === 'loading' && state.cached !== null) {
    return { kind: 'ready', snapshot: state.cached };
  }
  return state;
}
