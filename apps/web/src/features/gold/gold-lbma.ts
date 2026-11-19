/**
 * gold-lbma.ts — GPE R24 / F22 (2026-11-19): the LBMA London vault +
 * clearing families' web client — GET /api/insights/gold-lbma (the
 * gold-xau/gold-cb discipline, verbatim as the pattern: zod-validated
 * with THE contract from @currena/core, last-good localStorage
 * snapshot, module-cached so the two cards share ONE fetch).
 *
 * This feed NEVER surfaces an error state as a throw — the designed
 * fallbacks are "loading" and the calm unavailable line. Staleness is
 * data-carried (the families' own asOf months + the fetchedAt stamp).
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy /gold
 * route chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import { GoldLbmaSnapshotSchema } from '@currena/core';
import type { GoldLbmaSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const CACHE_KEY = 'currena:insights:gold-lbma';

/** The module-level in-flight promise — one fetch serves every caller. */
let inFlight: Promise<GoldLbmaSnapshot | null> | null = null;

/** GET /api/insights/gold-lbma — null when anything at all goes wrong. */
export function fetchGoldLbma(signal?: AbortSignal): Promise<GoldLbmaSnapshot | null> {
  if (inFlight !== null) return inFlight;
  inFlight = (async () => {
    const url = '/api/insights/gold-lbma';
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(url, {
        signal: combined,
        headers: { accept: 'application/json' },
        cache: 'default',
      });
      if (!response.ok) return null; // 503 gold_lbma_not_ready = being prepared
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return null;
      }
      const parsed = GoldLbmaSnapshotSchema.safeParse(body);
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
export function readCachedGoldLbma(): GoldLbmaSnapshot | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = GoldLbmaSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache(snapshot: GoldLbmaSnapshot): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* best-effort */
  }
}

/** The test seam (the clearGoldXauCacheForTests pattern). */
export function clearGoldLbmaCacheForTests(): void {
  inFlight = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best-effort */
  }
}

export type GoldLbmaState =
  | { kind: 'loading'; cached: GoldLbmaSnapshot | null }
  | { kind: 'ready'; snapshot: GoldLbmaSnapshot }
  | { kind: 'none' };

/** The shared hook (the useGoldXauOhlc pattern — one fetch, two cards). */
export function useGoldLbma(): GoldLbmaState {
  const [state, setState] = useState<GoldLbmaState>(() => {
    try {
      return { kind: 'loading', cached: readCachedGoldLbma() };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchGoldLbma()
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
