/**
 * Client snapshot layer (mission §8 performance model, checklist #6).
 *
 * THE rule: the network is touched ONCE per freshness window per source
 * (FRESH_TTL_SEC from @currena/core). Everything else — amount edits, swaps,
 * currency changes, reverse conversions, live-rates cards — is local math over
 * the in-memory snapshot.
 *
 * Behavior:
 *   - boot(): hydrate last-good snapshots from localStorage
 *     (`currena:snapshot:tgju` / `:frankfurter`, validated with the core
 *     SnapshotSchema), then fetch BOTH sources in parallel — but only the
 *     ones that are missing or older than the freshness window.
 *   - refresh(source?): re-fetch only when stale/missing (single-flight per
 *     source). On 503/no-network: keep serving the last-good snapshot with a
 *     stale/degraded notice. With nothing persisted → hard error state.
 *   - GOLD HEAL: a tgju snapshot WITHOUT the gold/coin section (a pre-gold
 *     legacy snapshot persisted across the gold-board deploy, or a scrape
 *     where TGJU's gold symbols went missing) is treated as NOT usable —
 *     the store forces a network re-fetch so the gold board self-heals on
 *     the very next load/poll instead of waiting out the freshness window
 *     with a dash-filled panel. The forced attempt is throttled to one per
 *     freshness window (failed attempts included) so it can never storm.
 *   - online/offline tracked via navigator.onLine events.
 *   - Rate intelligence: each source also keeps the PREVIOUS distinct
 *     snapshot (`currena:prev-snapshot:*`, persisted) so the UI can show
 *     ▲/▼ rate-change deltas between updates.
 *
 * Numbers and timestamps inside the store stay canonical (raw doubles, ISO
 * strings) — staleness is DERIVED from fetchedAt at render time, never stored.
 */

import { FRESH_TTL_SEC, SnapshotSchema } from '@currena/core';
import type { Snapshot, SnapshotSource } from '@currena/core';
import { useSyncExternalStore } from 'react';
import { ApiError, fetchRates } from './api';
import { recordGeneration } from './rate-history';

const SOURCES: readonly SnapshotSource[] = ['tgju', 'frankfurter'];

const lsKey = (source: SnapshotSource): string => `currena:snapshot:${source}`;
const lsPrevKey = (source: SnapshotSource): string => `currena:prev-snapshot:${source}`;

/** Where the currently-served snapshot physically came from. */
export type ServedFrom = 'live' | 'cache' | 'local-store';

export interface SourceState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  snapshot: Snapshot | null;
  /** The prior DISTINCT snapshot (different fetchedAt) — powers ▲/▼ deltas. */
  previous: Snapshot | null;
  /** Age of the served snapshot beyond FRESH_TTL_SEC (derived, never stored). */
  stale: boolean;
  servedFrom: ServedFrom | null;
  /** API notice string (e.g. 'Using cached rates — last updated …'). */
  notice: string | null;
  /** Last failure — kept even while serving last-good data (degraded mode). */
  error: ApiError | null;
  /** True when a refresh failed but a last-good snapshot keeps being served. */
  degraded: boolean;
}

export interface StoreState {
  tgju: SourceState;
  frankfurter: SourceState;
  online: boolean;
}

const idleSource = (): SourceState => ({
  status: 'idle',
  snapshot: null,
  previous: null,
  stale: false,
  servedFrom: null,
  notice: null,
  error: null,
  degraded: false,
});

function isStale(snapshot: Snapshot, now = Date.now()): boolean {
  const fetchedAt = Date.parse(snapshot.fetchedAt);
  return Number.isNaN(fetchedAt) || now - fetchedAt > FRESH_TTL_SEC * 1000;
}

function readPersisted(source: SnapshotSource): Snapshot | null {
  try {
    const raw = window.localStorage.getItem(lsKey(source));
    if (!raw) return null;
    const parsed = SnapshotSchema.safeParse(JSON.parse(raw));
    // Corrupt storage fails loudly into console and is discarded, never rendered.
    if (!parsed.success) {
      console.warn(`[snapshot-store] discarding invalid persisted snapshot for ${source}:`, parsed.error.message);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.warn(`[snapshot-store] cannot read persisted snapshot for ${source}:`, err);
    return null;
  }
}

function persist(source: SnapshotSource, snapshot: Snapshot): void {
  try {
    window.localStorage.setItem(lsKey(source), JSON.stringify(snapshot));
  } catch (err) {
    // Quota/private-mode: in-memory serving continues; offline boot loses data.
    console.warn(`[snapshot-store] cannot persist snapshot for ${source}:`, err);
  }
}

function persistPrevious(source: SnapshotSource, snapshot: Snapshot | null): void {
  if (snapshot === null) return; // nothing to keep — leave any old value alone
  try {
    window.localStorage.setItem(lsPrevKey(source), JSON.stringify(snapshot));
  } catch {
    // Best-effort only: deltas simply won't survive a reload.
  }
}

function readPrevious(source: SnapshotSource): Snapshot | null {
  try {
    const raw = window.localStorage.getItem(lsPrevKey(source));
    if (!raw) return null;
    const parsed = SnapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

class SnapshotStore {
  private state: StoreState = {
    tgju: idleSource(),
    frankfurter: idleSource(),
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
  };

  /** Epoch ms of the last network attempt made BECAUSE the served tgju
   *  snapshot lacked the gold section — throttles the forced gold heal to
   *  one attempt per freshness window (failed attempts included). */
  private lastGoldlessAttemptAt = 0;

  private readonly listeners = new Set<() => void>();
  private readonly pending = new Map<SnapshotSource, Promise<void>>();
  private booted = false;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getState = (): StoreState => this.state;

  private setSource(source: SnapshotSource, patch: Partial<SourceState>): void {
    this.state = { ...this.state, [source]: { ...this.state[source], ...patch } };
    for (const listener of this.listeners) listener();
  }

  private setOnline(online: boolean): void {
    if (this.state.online !== online) {
      this.state = { ...this.state, online };
      for (const listener of this.listeners) listener();
    }
  }

  /** App boot: hydrate from localStorage, watch connectivity, fetch the stale. */
  boot(): void {
    if (this.booted || typeof window === 'undefined') return;
    this.booted = true;

    for (const source of SOURCES) {
      const snapshot = readPersisted(source);
      const previous = readPrevious(source);
      if (snapshot) {
        // A stale persisted previous (older than the current one, or a
        // different generation) is still a valid delta baseline — but never
        // newer than what we serve.
        const usablePrevious = previous && previous.fetchedAt !== snapshot.fetchedAt ? previous : null;
        this.setSource(source, {
          status: 'ready',
          snapshot,
          previous: usablePrevious,
          stale: isStale(snapshot),
          servedFrom: 'local-store',
        });
      }
    }

    window.addEventListener('online', () => {
      this.setOnline(true);
      // Came back online: catch up anything that went stale while offline.
      void this.refresh('tgju');
      void this.refresh('frankfurter');
    });
    window.addEventListener('offline', () => this.setOnline(false));

    // Boot fetch — both sources in parallel; refresh() skips the fresh ones
    // (network once per freshness window, even across app restarts).
    void this.refresh('tgju');
    void this.refresh('frankfurter');
  }

  /**
   * Re-fetch `source` unless a fresh snapshot is already being served.
   * `force` bypasses the client freshness guard for explicit user actions
   * (the manual refresh button) — the SERVER ladder still applies its own
   * min-interval/fresh-cache rules, so a forced refresh is one cheap request
   * that surfaces any newer cached generation, never an extra scrape storm.
   *
   * The guard also refuses a FRESH-but-gold-less tgju snapshot (see the
   * GOLD HEAL note in the header): the currency half may be perfectly live
   * while the gold board sits on dashes because the snapshot predates the
   * gold field — one throttled re-fetch replaces it with a gold-bearing
   * generation instead of waiting out the freshness window.
   */
  refresh(source: SnapshotSource, options: { force?: boolean } = {}): Promise<void> {
    const current = this.state[source];
    const goldHealPending =
      current.snapshot !== null &&
      SnapshotStore.isGoldless(source, current.snapshot) &&
      Date.now() - this.lastGoldlessAttemptAt > FRESH_TTL_SEC * 1000;
    const usable =
      current.snapshot !== null &&
      !isStale(current.snapshot) &&
      current.status !== 'error' &&
      !goldHealPending;
    if (usable && !options.force) return Promise.resolve();
    return this.fetch(source);
  }

  /** Force both sources through refresh (staleness rules still apply). */
  refreshAll(): Promise<void> {
    return Promise.all([this.refresh('tgju'), this.refresh('frankfurter')]).then(() => undefined);
  }

  /** A tgju snapshot without ANY gold/coin quotes — a pre-gold legacy
   *  snapshot (deploy transition) or a scrape that lost the gold section.
   *  The gold board honestly degrades to dashes for these; the store
   *  additionally treats them as heal-pending rather than trusting the
   *  client freshness window. Per-ITEM absences (TGJU unpublished a single
   *  symbol) are NOT this — those are TGJU's own honest state. */
  private static isGoldless(source: SnapshotSource, snapshot: Snapshot): boolean {
    return source === 'tgju' && (snapshot.gold?.length ?? 0) === 0;
  }

  private fetch(source: SnapshotSource): Promise<void> {
    const existing = this.pending.get(source);
    if (existing) return existing;

    const run = (async () => {
      // Stamp the heal attempt up-front: even a failed attempt (offline,
      // 5xx) must throttle the forced gold re-fetch to once per window,
      // so the 30s LiveRates poll can never turn it into a request storm.
      const preSnapshot = this.state[source].snapshot;
      if (preSnapshot !== null && SnapshotStore.isGoldless(source, preSnapshot)) {
        this.lastGoldlessAttemptAt = Date.now();
      }
      this.setSource(source, { status: 'loading' });
      try {
        const response = await fetchRates(source);
        const current = this.state[source].snapshot;
        const isNewGeneration = current === null || current.fetchedAt !== response.snapshot.fetchedAt;
        persist(source, response.snapshot);
        if (isNewGeneration) {
          // Keep the replaced snapshot as the delta baseline (persisted so
          // ▲/▼ chips survive reloads and offline boots).
          persistPrevious(source, current);
          // Rolling trend window for the sparklines (rate-history feature).
          recordGeneration(source, response.snapshot);
          this.setSource(source, {
            status: 'ready',
            snapshot: response.snapshot,
            previous: current,
            stale: response.stale || isStale(response.snapshot),
            servedFrom: response.servedFrom,
            notice: response.notice ?? null,
            error: null,
            degraded: false,
          });
        } else {
          // Same generation served from cache — keep the existing baseline.
          this.setSource(source, {
            status: 'ready',
            stale: response.stale || isStale(response.snapshot),
            servedFrom: response.servedFrom,
            notice: response.notice ?? null,
            error: null,
            degraded: false,
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError('network', err instanceof Error ? err.message : 'Snapshot fetch failed');
        const snapshot = this.state[source].snapshot;
        if (snapshot) {
          // Ladder bottom rung client-side: serve last-good, flagged.
          this.setSource(source, {
            status: 'ready',
            stale: true,
            degraded: true,
            error: apiError,
          });
        } else {
          this.setSource(source, {
            status: 'error',
            snapshot: null,
            stale: false,
            servedFrom: null,
            error: apiError,
            degraded: false,
          });
        }
      }
    })();

    this.pending.set(source, run);
    void run.finally(() => this.pending.delete(source));
    return run;
  }

  /**
   * Converter entry point: resolve a usable snapshot for `source`, fetching
   * only when the freshness window demands it. Resolves null when nothing is
   * obtainable (state carries the typed error).
   */
  async ensureSnapshot(source: SnapshotSource): Promise<Snapshot | null> {
    await this.refresh(source);
    return this.state[source].snapshot;
  }
}

export const snapshotStore = new SnapshotStore();

/** React binding — re-renders on any store change (immutable state swap). */
export function useSnapshotStore(): StoreState {
  return useSyncExternalStore(snapshotStore.subscribe, snapshotStore.getState);
}

/**
 * CONFIRMED staleness — the semantics every "cached data" surface (stale
 * banners, board status LEDs) must render on.
 *
 * `state.stale` alone is DERIVED: at boot, `hydrate()` stamps it from the
 * persisted snapshot's age, so it is true for every returning visitor whose
 * last visit is older than the freshness window — even though the boot
 * fetch is already in flight and (with the every-minute cron keeping the
 * worker fresh) lands a moment later. Rendering banners/LEDs on that
 * transient derivation made the "⚠️ Using cached rates" box appear for a
 * blink of an eye and vanish as soon as fresh data arrived (owner report
 * 2026-09-19).
 *
 * Staleness is only CONFIRMED when a fetch cycle actually SETTLED on
 * non-fresh data: either the server itself served a stale generation
 * (`servedFrom: 'cache'` + stale — notice included), or a fetch FAILED and
 * the store keeps serving the last-good snapshot in degraded mode. The
 * boot-local derivation (`servedFrom: 'local-store'`, fetch in flight)
 * never raises a banner on its own.
 */
export function isConfirmedStale(state: SourceState): boolean {
  return (
    state.snapshot !== null &&
    (state.degraded || (state.stale && state.servedFrom !== 'local-store'))
  );
}
