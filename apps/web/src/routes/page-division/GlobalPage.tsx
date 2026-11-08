/**
 * GlobalPage — `/`, the landing page (page-division S3, 2026-11-08 —
 * D-20: Global becomes the landing page; spec §4: the one-screen world
 * scan).
 *
 * The S1 skeleton (GlobalPlaceholder) is superseded: the page now renders
 * the D-21 10-tile verdict board, the D-22 prices ribbon, the D-23 region
 * chips, the D-24 narrator line and the D-25 dedollarization context
 * tile — every verdict re-derived CLIENT-SIDE through the same pure
 * engines (global-tiles.ts → gauges.ts / gold-balance.ts / outlook-core /
 * verdict-core / the fx status table), never an invented composite
 * (D-48). Data arrives on the S2 contract: ONE curated projection
 * (GET /api/insights/pages/global — fetchPageProjection) + the two board
 * attachments at their existing cached routes (markets + fx) + the
 * narrative endpoint. The last-good localStorage pattern (the snapshot
 * store's own) paints instantly from cache on a slow connection and
 * survives a feed outage, clearly labelled.
 *
 * STRICTLY ONE SCREEN (D-11): the page's content fits 1440×900 AND
 * 360×844 without scrolling — the heading block, the board, the chips
 * and the narrator line are the whole page; everything deep is one click
 * away. Platform: browser only — this module lives in the lazy Global
 * route chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { fetchMarketsSnapshot, readCachedMarkets } from '../../lib/markets';
import { fetchFxSnapshot, readCachedFx } from '../../lib/fx';
import { fetchNarrativeDoc, readCachedNarrative } from '../../lib/narrative';
import type { NarrativeDoc } from '../../lib/narrative';
import type { MarketsSnapshot, FxSnapshot } from '@currena/core';
import { GlobalBoard, NarratorLine, RegionChips } from './GlobalBoard';
import type { InsightsLoadStateLike } from './global-page-states';
import { globalDedollarTile, globalFxTile, globalGaugeTiles, globalGoldTile, globalMarketsTile, globalRibbon } from './global-tiles';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection; fromCache: boolean }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

/** The boards' load states (the markets/fx discipline: last-good cache,
 *  never an error surface — a failed fetch keeps the cached copy flagged,
 *  no cache resolves to the honest empty kind). */
type BoardState<T> = InsightsLoadStateLike<T> & { fromCache?: boolean };

export function GlobalPage(): React.JSX.Element {
  const { t, locale } = useI18n();

  /* ---------------- the projection (the S2 contract) ---------------- */
  const [state, setState] = useState<ProjectionState>(() => {
    try {
      const cached = readCachedPageProjection('global');
      return { kind: 'loading', cached };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  const load = useCallback(() => {
    // S3 defect note: the projection call is deliberately SIGNAL-FREE —
    // an unmount (React StrictMode double-mounts in dev) must not abort a
    // promise other mounts share (the client's cache poison fix). The
    // effect below owns cancellation with a local flag instead; the
    // client's internal 20s timeout bounds the wire.
    let settled = false;
    fetchPageProjection('global')
      .then((projection) => {
        if (settled) return;
        settled = true;
        setState({ kind: 'ready', projection, fromCache: false });
      })
      .catch((err: unknown) => {
        if (settled) return;
        settled = true;
        setState((prev) => ({
          kind: 'error',
          error: err instanceof ApiError ? err : new ApiError('parse', 'Unexpected projection failure'),
          // A failed refresh keeps the LAST GOOD copy on screen (the M17
          // pattern) — or the boot-time cache when the first fetch fails.
          cached: prev.kind === 'ready' ? prev.projection : prev.kind === 'loading' || prev.kind === 'error' ? prev.cached : null,
        }));
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- the two board attachments ---------------- */
  const [marketsState, setMarketsState] = useState<BoardState<MarketsSnapshot>>(() => {
    try {
      const cached = readCachedMarkets();
      return cached ? { kind: 'ready', value: cached, fromCache: true } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });
  const [fxState, setFxState] = useState<BoardState<FxSnapshot>>(() => {
    try {
      const cached = readCachedFx();
      return cached ? { kind: 'ready', value: cached, fromCache: true } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchMarketsSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      setMarketsState(snapshot !== null ? { kind: 'ready', value: snapshot } : { kind: 'empty' });
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchFxSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      setFxState(snapshot !== null ? { kind: 'ready', value: snapshot } : { kind: 'empty' });
    });
    return () => controller.abort();
  }, []);

  /* ---------------- the narrator (D-24) ---------------- */
  const [narrative, setNarrative] = useState<NarrativeDoc | null>(() => {
    try {
      return readCachedNarrative();
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetchNarrativeDoc(controller.signal).then((doc) => {
      if (controller.signal.aborted) return;
      if (doc !== null) setNarrative(doc);
    });
    return () => controller.abort();
  }, []);
  const narrativePreview = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('narrative') === 'preview';
    } catch {
      return false;
    }
  }, []);

  /* ---------------- the verdict derivations (pure, engine-side) ---------------- */
  const readings = state.kind === 'ready' ? state.projection.readings : state.kind === 'loading' || state.kind === 'error' ? state.cached?.readings : undefined;
  const gaugeTiles = useMemo(() => (readings !== undefined ? globalGaugeTiles(readings) : []), [readings]);
  const goldTile = useMemo(() => (readings !== undefined ? globalGoldTile(readings) : null), [readings]);
  const ribbon = useMemo(() => (readings !== undefined ? globalRibbon(readings) : []), [readings]);
  const dedollar = useMemo(() => (readings !== undefined ? globalDedollarTile(readings) : null), [readings]);
  const marketsTile = useMemo(
    () => (marketsState.kind === 'ready' ? globalMarketsTile(marketsState.value) : null),
    [marketsState],
  );
  const fxTile = useMemo(() => (fxState.kind === 'ready' ? globalFxTile(fxState.value) : null), [fxState]);

  const projection: PageProjection | null =
    state.kind === 'ready' ? state.projection : state.kind === 'loading' || state.kind === 'error' ? state.cached : null;
  const fromCache = state.kind === 'ready' && state.fromCache;

  /* ---------------- the data-as-of line (the H4/R12 pattern) ---------------- */
  const dataAsOf = useMemo(() => {
    if (projection === null) return null;
    const dateText = locale === 'fa' ? formatJalaliDate(projection.generatedAt, 'fa-IR') : formatDateWords(projection.generatedAt, 'en-US');
    const pricesText =
      projection.pricesAsOf !== undefined
        ? locale === 'fa'
          ? `${formatJalaliDate(projection.pricesAsOf, 'fa-IR', { withClock: true })} (UTC)`
          : `${new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(projection.pricesAsOf))} UTC`
        : null;
    return { date: dateText, prices: pricesText };
  }, [projection, locale]);

  /* ---------------- render ---------------- */

  // The honest load state before any data exists (no cache, first paint).
  if (projection === null && state.kind === 'loading') {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-5 py-16 sm:max-w-[680px] lg:max-w-[1280px]" role="status">
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.global.loadingLine')}</p>
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
        <h1 className="mb-2 text-2xl font-extrabold text-currena-dark">{t('pd.global.errorTitle')}</h1>
        <p className="mb-5 text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.global.errorText')}</p>
        <button
          type="button"
          onClick={() => load()}
          className="insights-focusable min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
        >
          {t('pd.global.errorRetry')}
        </button>
      </div>
    );
  }

  // Ready (fresh or cached): the one-screen world scan.
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:py-5 sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* The heading block — compact (D-11): title + the one-line purpose +
          the data-as-of line (the honest "daily snapshot + hourly prices"
          story, the InsightsHeader pattern). */}
      <header className="mb-1.5 sm:mb-3.5 lg:mb-4">
        <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.global.title')}</h1>
        <p className="m-0 mt-0.5 line-clamp-1 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">{t('pd.global.purpose')}</p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf.date })}</bdi>
            {dataAsOf.prices !== null ? <bdi>{interpolate(t('pd.global.pricesAsOf'), { time: dataAsOf.prices })}</bdi> : null}
            {fromCache ? <bdi className="text-[var(--color-text-tertiary)]">{interpolate(t('pd.global.fromCache'), { date: dataAsOf.date })}</bdi> : null}
          </p>
        ) : null}
      </header>

      {/* The absent-note honesty line (public mode's licence-hidden ids —
          the Global projection carries none today, but the discipline
          renders whatever the payload honestly reports). */}
      {projection !== null && projection.absentIds.length > 0 ? (
        <p className="m-0 mb-2.5 text-[10.5px] text-currena-muted sm:mb-3 sm:text-[length:var(--type-caption)]" data-absent-note>
          <bdi>{interpolate(t('pd.global.absentLine'), { n: projection.absentIds.length })}</bdi>
        </p>
      ) : null}

      {/* The D-21 verdict board (10 tiles). */}
      {readings !== undefined && goldTile !== null && dedollar !== null ? (
        <GlobalBoard
          gaugeTiles={gaugeTiles}
          goldTile={goldTile}
          ribbon={ribbon}
          dedollar={dedollar}
          marketsState={marketsTile !== null ? { kind: 'ready', value: marketsTile } : { kind: marketsState.kind === 'loading' ? 'loading' : 'empty' }}
          fxState={fxTile !== null ? { kind: 'ready', value: fxTile } : { kind: fxState.kind === 'loading' ? 'loading' : 'empty' }}
        />
      ) : null}

      {/* The D-23 region-chips row. */}
      <div className="mt-1.5 sm:mt-3.5 lg:mt-4">
        <RegionChips
          marketsState={marketsTile !== null ? { kind: 'ready', value: marketsTile } : { kind: marketsState.kind === 'loading' ? 'loading' : 'empty' }}
          fxState={fxTile !== null ? { kind: 'ready', value: fxTile } : { kind: fxState.kind === 'loading' ? 'loading' : 'empty' }}
        />
      </div>

      {/* The D-24 narrator line (renders nothing when the doc is absent or
          the staged-rollout gate is closed — spec §11: nothing breaks). */}
      <div className="mt-1.5 sm:mt-3.5 lg:mt-4">
        <NarratorLine doc={narrative} preview={narrativePreview} />
      </div>
    </div>
  );
}
