/**
 * gold-premium.ts — GPE R30 / F3b (2026-11-19): the Iran bridge's
 * premium-history web client — GET /api/insights/gold-premium (the
 * gold-lbma discipline, verbatim as the pattern: zod-validated with THE
 * contract from @currena/core, last-good localStorage snapshot,
 * module-cached so the card's blocks share ONE fetch).
 *
 * This feed NEVER surfaces an error state as a throw — the designed
 * fallbacks are "loading" and the calm unavailable line. Staleness is
 * data-carried (the series' own asOf day + the fetchedAt stamp — the
 * card labels its window).
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy /gold
 * route chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import { GoldPremiumHistorySnapshotSchema } from '@currena/core';
import type { GoldPremiumHistorySnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const CACHE_KEY = 'currena:insights:gold-premium';

/** The module-level in-flight promise — one fetch serves every caller. */
let inFlight: Promise<GoldPremiumHistorySnapshot | null> | null = null;

/** GET /api/insights/gold-premium — null when anything at all goes wrong. */
export function fetchGoldPremium(signal?: AbortSignal): Promise<GoldPremiumHistorySnapshot | null> {
  if (inFlight !== null) return inFlight;
  inFlight = (async () => {
    const url = '/api/insights/gold-premium';
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(url, {
        signal: combined,
        headers: { accept: 'application/json' },
        cache: 'default',
      });
      if (!response.ok) return null; // 503 gold_premium_not_ready = being prepared
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return null;
      }
      const parsed = GoldPremiumHistorySnapshotSchema.safeParse(body);
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
export function readCachedGoldPremium(): GoldPremiumHistorySnapshot | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = GoldPremiumHistorySnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache(snapshot: GoldPremiumHistorySnapshot): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* best-effort */
  }
}

/** The test seam (the clearGoldLbmaCacheForTests pattern). */
export function clearGoldPremiumCacheForTests(): void {
  inFlight = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best-effort */
  }
}

export type GoldPremiumState =
  | { kind: 'loading'; cached: GoldPremiumHistorySnapshot | null }
  | { kind: 'ready'; snapshot: GoldPremiumHistorySnapshot }
  | { kind: 'none' };

/** The shared hook (the useGoldLbma pattern — one fetch, one card). */
export function useGoldPremium(): GoldPremiumState {
  const [state, setState] = useState<GoldPremiumState>(() => {
    try {
      return { kind: 'loading', cached: readCachedGoldPremium() };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchGoldPremium()
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
