/**
 * CurrenciesPage — `/currencies`, the currency pairs page (page-division
 * S18, 2026-11-11 — spec §12; D-18/D-32/D-41/D-42; the session prompt's
 * S18 scope).
 *
 * The page renders its own layers, rules FIRST (the delegated layout
 * decision, confirmed as F21-A / D-41):
 *
 *   1. the 7 rule lights hero (D-41) — the fx snapshot's stored rule
 *      states through the SAME §9.3 mapping the legacy page reads
 *      (fxRuleView), with the corpus's own names, headlines and everyday
 *      explanations;
 *   2. the 11-pair board (D-42) — EURUSD · USDJPY · GBPUSD · USDCHF ·
 *      USDCNY · AUDUSD · AUDJPY · EURJPY · EURCHF · AUDCNY · AUDNZD, each
 *      with rate, d1/m1/m3/y1, moveRank 0–100, the bigMove flag and the
 *      52-week closes;
 *   3. the registry-card sections (D-32) — the 7 pair-context cards + the
 *      7 dollar-standing cards, each with the §21 trio (value · 10-year
 *      position · freshness), every card context-only (no gauges, no
 *      verdict lines — G-5; the dollar-strength gauge itself stays on the
 *      USA page, D-30).
 *
 * TWO feeds, one page (the FX-board payload wiring):
 *
 *   - the S2 projection (GET /api/insights/pages/currencies) for the 14
 *     registry cards — the last-good localStorage pattern (M-17) paints
 *     instantly from cache on a slow connection and survives a feed
 *     outage, clearly labelled;
 *   - the fx board (GET /api/insights/fx, lib/fx.ts) for the hero + the
 *     board — the markets/fx discipline: own last-good cache, never an
 *     error surface (loading skeletons and the calm "being prepared" line
 *     are the designed fallbacks, so a missing fx feed can never break
 *     the page; a page request can never reach a provider).
 *
 * The honest "In build" chip rides the BUILD phase and RETIRES at the S18
 * gates pass (the S16/S17 one-session trajectory): once the §21 diff, the
 * freshness audit, the render audit and the browser pass are green, the
 * chip comes off before the deploy and the render audit asserts it
 * ABSENT.
 *
 * Platform: browser only — this module lives in the lazy Currencies route
 * chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { FxSnapshot, PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { fetchFxSnapshot, readCachedFx } from '../../lib/fx';
import { destinationFor } from './destinations';
import { CurrenciesRuleLights } from './CurrenciesRuleLights';
import { CurrenciesPairBoard } from './CurrenciesPairBoard';
import { CurrenciesTierCards } from './CurrenciesTierCards';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

/** The fx board's load state (lib/fx.ts discipline: never an error
 *  surface — 'empty' is the calm "being prepared" answer). */
type FxState =
  | { kind: 'loading'; cached: FxSnapshot | null }
  | { kind: 'ready'; snapshot: FxSnapshot }
  | { kind: 'empty' };

export function CurrenciesPage(): React.JSX.Element {
  const { t, locale } = useI18n();

  /* ---------------- the projection (the S2 contract) ---------------- */
  const [state, setState] = useState<ProjectionState>(() => {
    try {
      const cached = readCachedPageProjection('currencies');
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
    fetchPageProjection('currencies')
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

  const projection: PageProjection | null =
    state.kind === 'ready' ? state.projection : state.kind === 'loading' || state.kind === 'error' ? state.cached : null;
  const readings = projection?.readings;
  // The M-17 label: the cached copy paints exactly when it renders — the
  // boot paint from localStorage while loading, and the outage path that
  // kept the last good copy when a refresh failed.
  const fromCache = state.kind !== 'ready' && projection !== null;

  /* ---------------- the fx board (the FX-board payload wiring) ---------------- */
  const [fxState, setFxState] = useState<FxState>(() => {
    try {
      const cached = readCachedFx();
      return cached !== null ? { kind: 'loading', cached } : { kind: 'loading', cached: null };
    } catch {
      return { kind: 'loading', cached: null };
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchFxSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      // M-17 for the fx board: a failed refresh keeps the LAST GOOD local
      // copy on screen (unflagged here — the pairs' own asOf dates speak);
      // with no cache at all, the calm empty state is the honest answer.
      setFxState((prev) => {
        if (snapshot !== null) return { kind: 'ready', snapshot };
        if (prev.kind === 'loading' && prev.cached !== null) return { kind: 'ready', snapshot: prev.cached };
        return { kind: 'empty' };
      });
    });
    return () => controller.abort();
  }, []);

  const fx: FxSnapshot | null = fxState.kind === 'ready' ? fxState.snapshot : null;
  // The fx board's own as-of line (its snapshot's clock, honestly
  // separate from the projection's).
  const fxDateText = useMemo(() => {
    if (fx === null) return null;
    return locale === 'fa' ? formatJalaliDate(fx.generatedAt, 'fa-IR') : formatDateWords(fx.generatedAt, 'en-US');
  }, [fx, locale]);
  // The stale evaluation's own clock, computed once per mount.
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  /* ---------------- the data-as-of line (the H4/R12 pattern) ---------------- */
  const dataAsOf = useMemo(() => {
    if (projection === null) return null;
    const dateText = locale === 'fa' ? formatJalaliDate(projection.generatedAt, 'fa-IR') : formatDateWords(projection.generatedAt, 'en-US');
    return { date: dateText };
  }, [projection, locale]);

  // Fail-closed (the RegionPage discipline): the router only mounts this
  // component on /currencies, but a future refactor must never see a
  // blank page — say so honestly.
  const spec = destinationFor('/currencies');
  if (spec === undefined) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-5 py-8">
        <p className="text-sm text-currena-muted">{t('pd.unknownRoute')}</p>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  // The honest load state before any data exists (no cache, first paint).
  if (projection === null && state.kind === 'loading') {
    return (
      <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
        <div className="flex w-full flex-col items-center py-16" role="status">
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.currencies.loadingLine')}</p>
          <span className="mt-4 flex justify-center gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
      </div>
    );
  }

  // The honest error state: no data, no cache — say so, offer the retry.
  // Nothing is faked (Agent Rule 5); the retry re-enters the same loader.
  if (projection === null && state.kind === 'error') {
    return (
      <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
        <div className="mx-auto w-full max-w-[560px] px-5 py-16 sm:max-w-[680px]">
          <h1 className="mb-2 text-2xl font-extrabold text-currena-dark">{t('pd.currencies.errorTitle')}</h1>
          <p className="mb-5 text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.currencies.errorText')}</p>
          <button
            type="button"
            onClick={() => load()}
            className="insights-focusable min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
          >
            {t('pd.currencies.errorRetry')}
          </button>
        </div>
      </div>
    );
  }

  // Ready (fresh or cached): the heading block, then the hero + the
  // board + the two registry-card sections — only when the projection has
  // spoken (fresh or cached).
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* The heading block: title + the one-line purpose + the data-as-of
          line (the BD-S5a sentence replaces the plain line when the copy
          is the cached one). */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.currencies.title')}</h1>
          {/* The honest In-build chip (the BUILD phase — the §21 diff, the
           * freshness audit, the render audit and the browser pass have
           * not yet run at this checkpoint). It RETIRES at the S18 gates
           * pass (the S16/S17 one-session trajectory mirrored). The
           * pd.statusBuilding key is the PagePlaceholder's own (the
           * build-session chip every later session retires). */}
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
            {t('pd.statusBuilding')}
          </span>
        </div>
        <p className="m-0 mt-0.5 line-clamp-2 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">
          {t('pd.currencies.purpose')}
        </p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            {fromCache ? (
              <bdi className="text-[var(--color-text-tertiary)]" data-currencies-cached>
                {interpolate(t('pd.global.fromCache'), { date: dataAsOf.date })}
              </bdi>
            ) : (
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf.date })}</bdi>
            )}
          </p>
        ) : null}
      </header>

      {/* The absent-note honesty line (public mode's licence-hidden ids —
          the Currencies projection's own honest report). */}
      {projection !== null && projection.absentIds.length > 0 ? (
        <p className="m-0 mb-2.5 text-[10.5px] text-currena-muted sm:mb-3 sm:text-[length:var(--type-caption)]" data-absent-note>
          <bdi>{interpolate(t('pd.global.absentLine'), { n: projection.absentIds.length })}</bdi>
        </p>
      ) : null}

      {/* The 7 rule lights hero (D-41) + the 11-pair board (D-42) — the
          fx board's sections. While the fx feed loads its skeleton
          speaks; empty (a dead feed with no cache) renders the calm
          "being prepared" line, never an error (the fx discipline). The
          board's own as-of line sits above its section (the S16 AU-board
          arrangement — the feed's clock, honestly separate from the
          projection's). */}
      {fx !== null ? (
        <>
          <CurrenciesRuleLights rules={fx.rules} />
          {fxDateText !== null ? (
            <p className="m-0 mt-3 text-[10.5px] font-semibold text-currena-muted sm:mt-5 sm:text-[length:var(--type-caption)]">
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: fxDateText })}</bdi>
            </p>
          ) : null}
          <CurrenciesPairBoard snapshot={fx} todayIso={todayIso} />
        </>
      ) : fxState.kind === 'loading' ? (
        <div className="flex w-full flex-col items-center py-10" role="status">
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.currencies.loadingLine')}</p>
          <span className="mt-3 flex justify-center gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
      ) : (
        <p className="m-0 mb-2.5 text-[length:var(--type-label)] leading-relaxed text-currena-muted" data-currencies-fx-empty>
          <bdi>{t('pd.currencies.fxEmpty')}</bdi>
        </p>
      )}

      {/* The two registry-card sections (D-32/D-42) — only when the
          projection has spoken (fresh or cached). */}
      {readings !== undefined ? <CurrenciesTierCards readings={readings} /> : null}
    </div>
  );
}
