/**
 * CurrenciesPage — `/currencies`, the currency pairs page (page-division
 * S18, 2026-11-12 — spec §12; D-18/D-32/D-41/D-42; the session prompt's
 * S18 scope).
 *
 * The page renders its own layers, rules first (D-41):
 *
 *   1. the 7 rule lights hero — R1 risk-mood · R2 carry unwind · R3
 *      dollar strength · R4 money-hiding · R5 China link · R6 Europe
 *      worry · R7 dollar-or-euro, each with its plain-language
 *      explanation (the corpus's own everyday lines);
 *   2. the 11-pair board (D-42 — EURUSD · USDJPY · GBPUSD · USDCHF ·
 *      USDCNY · AUDUSD · AUDJPY · EURJPY · EURCHF · AUDCNY · AUDNZD):
 *      rate, d1/m1/m3/y1 changes, moveRank 0–100, the bigMove flag and
 *      the 52-week closes;
 *   3. the dollar-standing section (D-32) + the pairs-over-the-decade
 *      section — the 14 registry cards with the §21 trio (value ·
 *      10-year position · freshness), every card context-only (G-5).
 *
 * TWO FEEDS, ONE PAGE (the FX-board payload wiring): the registry cards
 * arrive on the S2 projection contract (GET /api/insights/pages/
 * currencies — fetchPageProjection, the M-17 last-good localStorage
 * pattern) and the hero + board arrive on the fx snapshot (GET
 * /api/insights/fx — lib/fx.ts, the SAME zod-validated client + last-good
 * cache the legacy /insights page reads). The two feeds fail
 * INDEPENDENTLY and honestly: a dead projection takes only the cards
 * away (their own error block + retry), a dead fx feed shows the calm
 * "being prepared" line (the section's designed fallback — never an
 * error state), and only both-dead-with-no-cache renders the page-level
 * error.
 *
 * The honest "In build" chip rides the S17 trajectory (BD-S17c): the
 * build and the gates ship in this one session, so the chip comes off at
 * the gates pass — the render audit then asserts it ABSENT.
 *
 * Platform: browser only — this module lives in the lazy Currencies
 * route chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { FxSnapshot, PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { fetchFxSnapshot, readCachedFx } from '../../lib/fx';
import { destinationFor } from './destinations';
import { CurrenciesRuleHero } from './CurrenciesRuleHero';
import { CurrenciesPairBoard } from './CurrenciesPairBoard';
import { CurrenciesTierCards } from './CurrenciesTierCards';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

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

  /* ---------------- the fx snapshot (the board feed) ---------------- */
  // The fx client NEVER surfaces an error state (the section's designed
  // fallbacks are "loading" and the calm "being prepared" line): the
  // last-good localStorage copy paints at boot, a fresh fetch replaces
  // it, a dead feed keeps it. null = nothing to show yet.
  const [fx, setFx] = useState<FxSnapshot | null>(() => {
    try {
      return readCachedFx();
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let settled = false;
    void fetchFxSnapshot().then((snapshot) => {
      if (settled || snapshot === null) return;
      settled = true;
      setFx(snapshot);
    });
    return () => {
      settled = true;
    };
  }, []);

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

  // The honest load state before ANY data exists (no cache, first paint).
  if (projection === null && state.kind === 'loading' && fx === null) {
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

  // The honest page-level error: BOTH feeds dead with no cache — say so,
  // offer the retry. Nothing is faked (Agent Rule 5).
  if (projection === null && state.kind === 'error' && fx === null) {
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

  // Ready (fresh or cached, in either feed): the heading block, then the
  // hero + board + the two card sections — each layer only when its own
  // feed has spoken.
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* The heading block: title + the one-line purpose + the data-as-of
          line (the BD-S5a sentence replaces the plain line when the copy
          is the cached one). */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.currencies.title')}</h1>
          {/* The In-build chip rides the S17 trajectory (BD-S17c): the
           * S18 build + gates ship in one session — the chip retires at
           * the gates pass (the §21 diff + the render audit + the
           * browser pass green), before the deploy. */}
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200" data-currencies-in-build>
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

      {/* The 7 rule lights hero + the 11-pair board (the fx feed — the
          calm "being prepared" line while nothing exists, never an
          error state). */}
      {fx !== null ? (
        <>
          <CurrenciesRuleHero snapshot={fx} />
          <CurrenciesPairBoard snapshot={fx} />
        </>
      ) : (
        <p className="m-0 mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]" data-currencies-fx-preparing>
          <bdi>{t('pd.currencies.fxPreparing')}</bdi>
        </p>
      )}

      {/* The two registry sections (the S2 projection feed) — the §21
          trio cards. Only when the projection has spoken (fresh or
          cached); a dead projection with no cache renders its own honest
          error block + retry (the two feeds fail independently). */}
      {readings !== undefined ? (
        <CurrenciesTierCards readings={readings} />
      ) : (
        <section className="mt-3 sm:mt-5" data-currencies-cards-error>
          <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg">{t('pd.currencies.errorTitle')}</h2>
          <p className="m-0 mt-1 max-w-prose text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.currencies.errorText')}</p>
          <button
            type="button"
            onClick={() => load()}
            className="insights-focusable mt-3 min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
          >
            {t('pd.currencies.errorRetry')}
          </button>
        </section>
      )}
    </div>
  );
}
