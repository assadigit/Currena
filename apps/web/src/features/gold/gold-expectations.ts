/**
 * gold-expectations.ts — GPE R28 / F24 (2026-11-19): the Fed-meeting
 * market-implied expectations' web client — GET
 * /api/insights/gold-expectations (the gold-lbma/gold-cb discipline,
 * verbatim as the pattern: zod-validated with THE contract from
 * @currena/core, last-good localStorage snapshot for the instant/offline
 * paint, module-cached so the card shares ONE fetch — never two).
 *
 * This feed NEVER surfaces an error state to the caller as a throw —
 * the designed fallbacks are "loading" and the calm unavailable line;
 * any failure resolves to null. Staleness is data-carried (the
 * snapshot's own fetchedAt stamp — the card labels it).
 *
 * Platform: browser only (fetch/localStorage) — lives in the lazy /gold
 * route chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import { GoldExpectationsSnapshotSchema } from '@currena/core';
import type { GoldExpectationsSnapshot } from '@currena/core';

const TIMEOUT_MS = 20_000;
const CACHE_KEY = 'currena:insights:gold-expectations';

/** The module-level in-flight promise — one fetch serves every caller. */
let inFlight: Promise<GoldExpectationsSnapshot | null> | null = null;

/** GET /api/insights/gold-expectations — null when anything at all goes wrong. */
export function fetchGoldExpectations(signal?: AbortSignal): Promise<GoldExpectationsSnapshot | null> {
  if (inFlight !== null) return inFlight;
  inFlight = (async () => {
    const url = '/api/insights/gold-expectations';
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(url, {
        signal: combined,
        headers: { accept: 'application/json' },
        cache: 'default',
      });
      if (!response.ok) {
        // 503 gold_expectations_not_ready is the EXPECTED pre-rung answer;
        // every other failure is equally non-fatal for the page.
        return null;
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return null;
      }
      const parsed = GoldExpectationsSnapshotSchema.safeParse(body);
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
export function readCachedGoldExpectations(): GoldExpectationsSnapshot | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = GoldExpectationsSnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // Private mode / quota / corrupted JSON — no fallback.
  }
}

function writeCache(snapshot: GoldExpectationsSnapshot): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    /* best-effort */
  }
}

/** The test seam (the clearGoldLbmaCacheForTests pattern). */
export function clearGoldExpectationsCacheForTests(): void {
  inFlight = null;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* best-effort */
  }
}

export type GoldExpectationsState =
  | { kind: 'loading'; cached: GoldExpectationsSnapshot | null }
  | { kind: 'ready'; snapshot: GoldExpectationsSnapshot }
  | { kind: 'none' };

/** The shared hook (the useGoldLbma pattern — one fetch per page). */
export function useGoldExpectations(): GoldExpectationsState {
  const [state, setState] = useState<GoldExpectationsState>(() => {
    try {
      return { kind: 'loading', cached: readCachedGoldExpectations() };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchGoldExpectations()
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
