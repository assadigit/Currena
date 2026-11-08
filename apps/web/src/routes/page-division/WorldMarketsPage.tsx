/**
 * WorldMarketsPage — `/world-markets` (page-division S7, 2026-11-08 —
 * spec §6, D-43 · D-47 · D-48).
 *
 * The S1 placeholder is superseded: the page renders the D-43 hero (the
 * REUSED world-index map + the status summary — the board's own §5.3
 * rollup beside the RAW ≥10%/≥20% counts and the stated rule), the
 * three region grids (Asia 7 · Europe 4 · Americas 5 — every row chg
 * 1d/1w/1m/3m/1y, 52-wk range position, trend band, correction −10% /
 * bear −20% statuses) and the world risk & liquidity section (the 9
 * placement homes), every value through the SAME board + engines the
 * legacy /insights section reads (world-markets-tiles — never a second
 * arithmetic). Data arrives on the S2 contract: ONE curated projection
 * (GET /api/insights/pages/world-markets — fetchPageProjection, the 9
 * world-risk readings) + the markets board attachment at its own cached
 * route (the same GET /api/insights/markets the legacy section and the
 * Global tile read). The last-good localStorage pattern paints instantly
 * from cache on a slow connection and survives a feed outage, clearly
 * labelled (M-17) — a provider outage never reaches this page (the
 * board's writers run on the markets worker's own crons; a page request
 * can never call a provider, the fail-closed ladder).
 *
 * Platform: browser only — this module lives in the lazy World Markets
 * route chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { MarketId, PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { fetchMarketsSnapshot, readCachedMarkets } from '../../lib/markets';
import { WorldMarketsHero } from './WorldMarketsHero';
import type { WorldMarketsBoardState } from './WorldMarketsHero';
import { WorldMarketsGrids } from './WorldMarketsGrids';
import { WorldRiskCards } from './WorldRiskCards';
import { worldMarketsStatus, worldRiskCards } from './world-markets-tiles';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

export function WorldMarketsPage(): React.JSX.Element {
  const { t, locale } = useI18n();

  /* ---------------- the projection (the S2 contract — the 9 risk
   * readings) ---------------- */
  const [state, setState] = useState<ProjectionState>(() => {
    try {
      const cached = readCachedPageProjection('world-markets');
      return { kind: 'loading', cached };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  const load = useCallback(() => {
    // The S3 defect note's discipline: the projection call is
    // deliberately SIGNAL-FREE (an unmount must not abort a promise
    // other mounts share — the client's cache poison fix); the effect
    // below owns cancellation with a local flag.
    let settled = false;
    fetchPageProjection('world-markets')
      .then((projection) => {
        if (settled) return;
        settled = true;
        setState({ kind: 'ready', projection });
      })
      .catch((err: unknown) => {
        if (settled) return;
        settled = true;
        setState((prev) => ({
          kind: 'error',
          error: err instanceof ApiError ? err : new ApiError('parse', 'Unexpected projection failure'),
          // A failed refresh keeps the LAST GOOD copy on screen (the
          // M-17 pattern) — or the boot-time cache when the first fetch
          // fails.
          cached: prev.kind === 'ready' ? prev.projection : prev.kind === 'loading' || prev.kind === 'error' ? prev.cached : null,
        }));
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- the markets board attachment (the same cached
   * route the legacy section reads; the M-17 keep-flagged discipline —
   * a failed refresh keeps the last good copy, never an error surface)
   * ---------------- */
  const [boardState, setBoardState] = useState<WorldMarketsBoardState>(() => {
    try {
      const cached = readCachedMarkets();
      return cached ? { kind: 'ready', snapshot: cached, fromCache: true } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchMarketsSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      // M-17 (the S4 pattern): a failed refresh keeps the LAST GOOD copy
      // on screen, flagged with its stored generation; only with no cache
      // at all is the honest empty kind the answer (fail-closed, Rule 5).
      setBoardState((prev) => {
        if (snapshot !== null) return { kind: 'ready', snapshot };
        const cached = prev.kind === 'ready' ? prev.snapshot : null;
        if (cached !== null) return { kind: 'ready', snapshot: cached, fromCache: true };
        return { kind: 'empty' };
      });
    });
    return () => controller.abort();
  }, []);

  /* ---------------- the derivations (pure, engine-side) ---------------- */
  const projection: PageProjection | null =
    state.kind === 'ready' ? state.projection : state.kind === 'loading' || state.kind === 'error' ? state.cached : null;
  const readings = projection?.readings;
  // The M-17 label: the cached copy paints exactly when it renders — the
  // boot paint from localStorage while loading, and the outage path that
  // kept the last good copy when a refresh failed.
  const fromCache = state.kind !== 'ready' && projection !== null;

  const status = useMemo(
    () => (boardState.kind === 'ready' ? worldMarketsStatus(boardState.snapshot) : null),
    [boardState],
  );
  const riskEntries = useMemo(() => (readings !== undefined ? worldRiskCards(readings) : []), [readings]);

  // The map-callout → region-grid-row scroll (the on-page answer to the
  // legacy detail panel; the rows carry #wm-row-{id} in both layouts).
  const onOpenMarket = useCallback((id: MarketId) => {
    document.getElementById(`wm-row-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  // The grids' honest-age clock (the client-side R6 reads it; one
  // viewer-clock sample per mount — the map's own discipline).
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10));

  /* ---------------- the data-as-of line (the H4/R12 pattern — the
   * risk cards' snapshot stamp; the board's own stamp rides the status
   * box) ---------------- */
  const dataAsOf = useMemo(() => {
    if (projection === null) return null;
    const dateText = locale === 'fa' ? formatJalaliDate(projection.generatedAt, 'fa-IR') : formatDateWords(projection.generatedAt, 'en-US');
    return { date: dateText };
  }, [projection, locale]);

  /* ---------------- render ---------------- */

  // The honest load state before any data exists (no cache, first paint).
  if (projection === null && state.kind === 'loading') {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-5 py-16 sm:max-w-[680px] lg:max-w-[1080px]" role="status">
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.worldMarkets.loadingLine')}</p>
        <span className="mt-4 flex justify-center gap-2.5" aria-hidden="true">
          <span className="loader-dot" />
          <span className="loader-dot" />
          <span className="loader-dot" />
        </span>
      </div>
    );
  }

  // The honest error state: no data, no cache — say so, offer the retry.
  // Nothing is faked (Agent Rule 5); the retry re-enters the same loader.
  if (projection === null && state.kind === 'error') {
    return (
      <div className="mx-auto w-full max-w-[560px] px-5 py-16 sm:max-w-[680px]">
        <h1 className="mb-2 text-2xl font-extrabold text-currena-dark">{t('pd.worldMarkets.errorTitle')}</h1>
        <p className="mb-5 text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.worldMarkets.errorText')}</p>
        <button
          type="button"
          onClick={() => load()}
          className="insights-focusable min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
        >
          {t('pd.worldMarkets.errorRetry')}
        </button>
      </div>
    );
  }

  // Ready (fresh or cached): the complete world-markets picture.
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1080px] lg:px-8 lg:py-6">
      {/* The heading block: title + the one-line purpose + the risk
          cards' data-as-of line + the M-17 cached-copy label when it
          paints (the S4/BD-S5a one-sentence rule). */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.worldMarkets.title')}</h1>
        <p className="m-0 mt-0.5 line-clamp-2 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">
          {t('pd.worldMarkets.purpose')}
        </p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            {fromCache ? (
              <bdi className="text-[var(--color-text-tertiary)]">{interpolate(t('pd.global.fromCache'), { date: dataAsOf.date })}</bdi>
            ) : (
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf.date })}</bdi>
            )}
          </p>
        ) : null}
      </header>

      {/* The absent-note honesty line (public mode's licence-hidden ids —
          the projection's own honest report; none ride this page today,
          but the discipline renders whatever the payload reports). */}
      {projection !== null && projection.absentIds.length > 0 ? (
        <p className="m-0 mb-2.5 text-[10.5px] text-currena-muted sm:mb-3 sm:text-[length:var(--type-caption)]" data-absent-note>
          <bdi>{interpolate(t('pd.global.absentLine'), { n: projection.absentIds.length })}</bdi>
        </p>
      ) : null}

      {/* Spec §6 item 1 — the hero: the REUSED world map + the status
          summary (the S7 gates' "map dots interactive" live here). */}
      <WorldMarketsHero status={status} boardState={boardState} onOpenMarket={onOpenMarket} />

      {/* Spec §6 item 2 — the region grids (16 indexes with the full
          metrics; the S7 gates' "16 indexes render with full metrics"). */}
      <div className="mt-3 sm:mt-5">
        {boardState.kind === 'ready' ? <WorldMarketsGrids snapshot={boardState.snapshot} todayIso={todayIso} /> : null}
      </div>

      {/* Spec §6 item 3 — the world risk & liquidity cards (the 9
          placement homes). */}
      <div className="mt-3 sm:mt-5">
        {riskEntries.length > 0 ? <WorldRiskCards entries={riskEntries} /> : null}
      </div>
    </div>
  );
}
