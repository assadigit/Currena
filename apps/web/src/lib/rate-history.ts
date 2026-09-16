/**
 * Rolling per-source rate history — powers the trend sparklines.
 *
 * The snapshot store keeps only the current + previous generation (for ▲/▼
 * deltas). This module extends that into a small rolling window of DISTINCT
 * generations persisted to localStorage, so the Live Rates board and the
 * converter result can draw an honest micro-trend of what the app has seen.
 *
 * Honesty rules (mission §5 limitations):
 *   - Points only exist for snapshots the app actually served — while it was
 *     open and a refresh happened. The sparkline is a "recent checks" view,
 *     NOT a market history. UI labels must say so.
 *   - Capped (MAX_GENERATIONS) — old points drop off the front.
 *   - Corrupt storage is discarded, never rendered.
 *
 * Numbers stay raw doubles; timestamps stay ISO strings. The history is
 * append-only via `recordGeneration` (called from the snapshot store when a
 * new distinct generation arrives) and read via `readHistory` /
 * `useRateHistory` (useSyncExternalStore over a tiny emitter).
 */

import { convert } from '@currena/core';
import type { Snapshot, SnapshotSource } from '@currena/core';
import { useSyncExternalStore } from 'react';

/** How many distinct generations to keep per source (~3h at 5-min windows). */
export const MAX_GENERATIONS = 36;

const LS_KEY = (source: SnapshotSource): string => `currena:rate-history:${source}`;

export interface RateGeneration {
  /** Snapshot.fetchedAt — identifies the generation. */
  at: string;
  /** Snapshot.source — needed to faithfully rebuild a Snapshot for convert(). */
  source: SnapshotSource;
  /** Snapshot.base — the currency all `rates` are quoted against. */
  base: string;
  /** code → rate vs the snapshot base (compact map form of Snapshot.rates). */
  rates: Record<string, number>;
}

interface HistoryFile {
  v: 1;
  gens: RateGeneration[];
}

function toGeneration(snapshot: Snapshot): RateGeneration {
  const rates: Record<string, number> = {};
  for (const r of snapshot.rates) rates[r.code] = r.rate;
  return { at: snapshot.fetchedAt, source: snapshot.source, base: snapshot.base, rates };
}

function read(source: SnapshotSource): RateGeneration[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY(source));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryFile;
    if (typeof parsed !== 'object' || parsed === null || parsed.v !== 1 || !Array.isArray(parsed.gens)) {
      return [];
    }
    // Defensive: keep only structurally-valid entries (finite positive rates).
    const gens = parsed.gens.filter(
      (g) =>
        typeof g?.at === 'string' &&
        typeof g?.base === 'string' &&
        (g?.source === 'tgju' || g?.source === 'frankfurter') &&
        typeof g?.rates === 'object' &&
        g.rates !== null &&
        Object.values(g.rates).every((v) => typeof v === 'number' && Number.isFinite(v) && v > 0),
    );
    return gens.slice(-MAX_GENERATIONS);
  } catch {
    return [];
  }
}

function write(source: SnapshotSource, gens: RateGeneration[]): void {
  try {
    const file: HistoryFile = { v: 1, gens: gens.slice(-MAX_GENERATIONS) };
    window.localStorage.setItem(LS_KEY(source), JSON.stringify(file));
  } catch {
    // Quota/private mode: in-memory window keeps working for this session.
  }
}

/* ------------------------------- emitter ------------------------------- */

const listeners = new Set<() => void>();
const emit = (): void => {
  for (const l of listeners) l();
};

/** In-memory window (hydrated lazily on first access, kept fresh on record). */
const windows = new Map<SnapshotSource, RateGeneration[]>();

function windowFor(source: SnapshotSource): RateGeneration[] {
  let w = windows.get(source);
  if (!w) {
    w = read(source);
    windows.set(source, w);
  }
  return w;
}

/* ------------------------------- public API ---------------------------- */

/**
 * Append a new distinct snapshot generation (snapshot-store calls this right
 * where it persists the previous-generation baseline). Dedupes by `at`,
 * trims to MAX_GENERATIONS, persists, and notifies subscribers.
 */
export function recordGeneration(source: SnapshotSource, snapshot: Snapshot): void {
  const w = windowFor(source);
  const gen = toGeneration(snapshot);
  const newest = w[w.length - 1];
  if (newest !== undefined && newest.at === gen.at) return; // already recorded
  // Also drop any older duplicate (defensive against clock skew).
  const deduped = w.filter((g) => g.at !== gen.at);
  deduped.push(gen);
  const next = deduped.slice(-MAX_GENERATIONS);
  windows.set(source, next);
  write(source, next);
  emit();
}

/** Current rolling window for a source (oldest → newest). */
export function readHistory(source: SnapshotSource): RateGeneration[] {
  return windowFor(source).slice();
}

/**
 * The rate for `from → to` at each recorded generation, via the same core
 * math the UI uses (handles base crossing and IRR/Toman semantics).
 * Generations where the pair was unresolvable are skipped — the series stays
 * a contiguous set of valid observations.
 */
export function seriesForPair(gens: RateGeneration[], from: string, to: string): number[] {
  const series: number[] = [];
  for (const gen of gens) {
    try {
      const snapshot: Snapshot = {
        source: gen.source,
        base: gen.base as Snapshot['base'],
        fetchedAt: gen.at,
        rates: toRates(gen),
      };
      series.push(convert(snapshot, from, to, 1).rate);
    } catch {
      // Pair unknown in that generation — skip it.
    }
  }
  return series;
}

function toRates(gen: RateGeneration): Snapshot['rates'] {
  // `name` is required by the Rate schema but never read by convert() (it
  // only matches on `code` and multiplies `rate`) — the compact history
  // stores just code→rate, so the placeholder below is type-only filler.
  return Object.entries(gen.rates).map(([code, rate]) => ({
    code: code as Snapshot['rates'][number]['code'],
    name: code,
    rate,
  }));
}

/** First→last trend over a series (sparkline caption + a11y summary). */
export interface TrendInfo {
  dir: 'up' | 'down' | 'flat';
  /** Signed percent change, first → last. */
  pct: number;
}

export function trendOf(series: number[]): TrendInfo | null {
  if (series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  if (first === undefined || last === undefined || !(first > 0)) return null;
  const pct = ((last - first) / first) * 100;
  return { dir: last > first ? 'up' : last < first ? 'down' : 'flat', pct };
}

/** Stable empty window (getSnapshot must keep referential equality). */
const EMPTY: RateGeneration[] = [];

/** React binding — re-renders when any source records a new generation. Null → always empty. */
export function useRateHistory(source: SnapshotSource | null): RateGeneration[] {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => (source === null ? EMPTY : windowFor(source)),
    () => EMPTY,
  );
}
