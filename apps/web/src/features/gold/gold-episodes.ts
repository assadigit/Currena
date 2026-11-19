/**
 * gold-episodes.ts — GPE R25 / F6 (2026-11-19): the Episode Explorer's
 * data-plane web client — GET /api/insights/gold-episodes (the
 * gold-lbma/gold-cb discipline, verbatim as the pattern: zod-validated
 * with THE contract from @currena/core, last-good localStorage
 * snapshot for the instant/offline paint, module-cached so the
 * Explorer shares ONE fetch — never two).
 *
 * THE SPINE IS DROP-GATED (S15-D4): until the WGC prices workbook drop
 * lands and the gold-episodes-run runner writes the key, the route
 * answers the calm 503 and this client resolves null — the card
 * renders its honest waiting state, NEVER an interim series.
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy
 * /gold route chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import { GoldEpisodesSnapshotSchema } from '@currena/core';
import type { GoldEpisodesSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const CACHE_KEY = 'currena:insights:gold-episodes';

/** The module-level in-flight promise — one fetch serves every caller. */
let inFlight: Promise<GoldEpisodesSnapshot | null> | null = null;

/** GET /api/insights/gold-episodes — null when anything at all goes wrong. */
export function fetchGoldEpisodes(signal?: AbortSignal): Promise<GoldEpisodesSnapshot | null> {
  if (inFlight !== null) return inFlight;
  inFlight = (async () => {
    const url = '/api/insights/gold-episodes';
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(url, {
        signal: combined,
        headers: { accept: 'application/json' },
        cache: 'default',
      });
      if (!response.ok) {
        // 503 gold_episodes_not_ready is the EXPECTED pre-drop answer
        // (the workbook drop has not landed); every other failure is
        // equally non-fatal for the page.
        return null;
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return null;
      }
      const parsed = GoldEpisodesSnapshotSchema.safeParse(body);
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
export function readCachedGoldEpisodes(): GoldEpisodesSnapshot | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = GoldEpisodesSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCache(snapshot: GoldEpisodesSnapshot): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* best-effort */
  }
}

/** The test seam (the clearGoldLbmaCacheForTests pattern). */
export function clearGoldEpisodesCacheForTests(): void {
  inFlight = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best-effort */
  }
}

export type GoldEpisodesState =
  | { kind: 'loading'; cached: GoldEpisodesSnapshot | null }
  | { kind: 'ready'; snapshot: GoldEpisodesSnapshot }
  | { kind: 'none' };

/** The shared hook (the useGoldLbma pattern — one fetch, whole zone). */
export function useGoldEpisodes(): GoldEpisodesState {
  const [state, setState] = useState<GoldEpisodesState>(() => {
    try {
      return { kind: 'loading', cached: readCachedGoldEpisodes() };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchGoldEpisodes()
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
