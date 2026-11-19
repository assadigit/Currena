/**
 * gold-ifbought.ts — GPE R33 / F26 (2026-11-19, S17): the calculator's
 * data-plane web client — GET /api/insights/gold-ifbought (the
 * gold-episodes/gold-premium discipline, verbatim as the pattern:
 * zod-validated with THE contract from @currena/core, last-good
 * localStorage snapshot for the instant/offline paint, module-cached
 * so the card shares ONE fetch — never two).
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy /gold
 * route chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import { GoldIfBoughtSnapshotSchema } from '@currena/core';
import type { GoldIfBoughtSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const CACHE_KEY = 'currena:insights:gold-ifbought';

/** The module-level in-flight promise — one fetch serves every caller. */
let inFlight: Promise<GoldIfBoughtSnapshot | null> | null = null;

/** GET /api/insights/gold-ifbought — null when anything at all goes wrong. */
export function fetchGoldIfBought(signal?: AbortSignal): Promise<GoldIfBoughtSnapshot | null> {
  if (inFlight !== null) return inFlight;
  inFlight = (async () => {
    const url = '/api/insights/gold-ifbought';
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(url, {
        signal: combined,
        headers: { accept: 'application/json' },
        cache: 'default',
      });
      if (!response.ok) {
        // 503 gold_ifbought_not_ready is the EXPECTED pre-backfill answer;
        // every other failure is equally non-fatal for the page.
        return null;
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return null;
      }
      const parsed = GoldIfBoughtSnapshotSchema.safeParse(body);
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
export function readCachedGoldIfBought(): GoldIfBoughtSnapshot | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = GoldIfBoughtSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache(snapshot: GoldIfBoughtSnapshot): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* best-effort */
  }
}

/** The test seam (the clearGoldLbmaCacheForTests pattern). */
export function clearGoldIfBoughtCacheForTests(): void {
  inFlight = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best-effort */
  }
}

export type GoldIfBoughtState =
  | { kind: 'loading'; cached: GoldIfBoughtSnapshot | null }
  | { kind: 'ready'; snapshot: GoldIfBoughtSnapshot }
  | { kind: 'none' };

/** The shared hook (the useGoldLbma pattern — one fetch, one card). */
export function useGoldIfBought(): GoldIfBoughtState {
  const [state, setState] = useState<GoldIfBoughtState>(() => {
    try {
      return { kind: 'loading', cached: readCachedGoldIfBought() };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchGoldIfBought()
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
