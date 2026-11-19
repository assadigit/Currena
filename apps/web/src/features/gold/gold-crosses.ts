/**
 * gold-crosses.ts — GPE R26 / F10 (2026-11-19): the XAU crosses series'
 * web client — GET /api/insights/gold-crosses (the gold-xau discipline,
 * verbatim as the pattern: zod-validated with THE contract from
 * @currena/core, last-good localStorage snapshot for the instant/offline
 * paint, module-cached so the grid shares ONE fetch — never two).
 *
 * This feed NEVER surfaces an error state to the caller as a throw —
 * the designed fallbacks are "loading" and the calm unavailable line;
 * any failure resolves to null. Staleness is data-carried (the
 * snapshot's own asOf date + the fetchedAt stamp).
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy /gold
 * route chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import { GoldXauCrossesSnapshotSchema } from '@currena/core';
import type { GoldXauCrossesSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const CACHE_KEY = 'currena:insights:gold-crosses';

/** The module-level in-flight promise — one fetch serves every caller. */
let inFlight: Promise<GoldXauCrossesSnapshot | null> | null = null;

/** GET /api/insights/gold-crosses — null when anything at all goes wrong. */
export function fetchGoldCrosses(signal?: AbortSignal): Promise<GoldXauCrossesSnapshot | null> {
  if (inFlight !== null) return inFlight;
  inFlight = (async () => {
    const url = '/api/insights/gold-crosses';
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(url, {
        signal: combined,
        headers: { accept: 'application/json' },
        cache: 'default',
      });
      if (!response.ok) {
        // 503 gold_crosses_not_ready is the EXPECTED "being prepared"
        // answer; every other failure is equally non-fatal for the page.
        return null;
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return null;
      }
      const parsed = GoldXauCrossesSnapshotSchema.safeParse(body);
      if (!parsed.success) return null; // poisoned payload — treat as absent
      writeCache(parsed.data);
      return parsed.data;
    } catch {
      return null; // Network/timeout/abort — null, never an error state.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Last-good snapshot from localStorage, zod-validated on read. */
export function readCachedGoldCrosses(): GoldXauCrossesSnapshot | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = GoldXauCrossesSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCache(snapshot: GoldXauCrossesSnapshot): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* best-effort */
  }
}

/** The test seam (the clearGoldXauCacheForTests pattern). */
export function clearGoldCrossesCacheForTests(): void {
  inFlight = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best-effort */
  }
}

export type GoldCrossesState =
  | { kind: 'loading'; cached: GoldXauCrossesSnapshot | null }
  | { kind: 'ready'; snapshot: GoldXauCrossesSnapshot }
  | { kind: 'none' };

/** The shared hook (the useGoldXauOhlc pattern — one fetch per page). */
export function useGoldCrosses(): GoldCrossesState {
  const [state, setState] = useState<GoldCrossesState>(() => {
    try {
      return { kind: 'loading', cached: readCachedGoldCrosses() };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchGoldCrosses()
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

  if (state.kind === 'loading' && state.cached !== null) {
    return { kind: 'ready', snapshot: state.cached };
  }
  return state;
}
