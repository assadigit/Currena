/**
 * CommoditiesPage — `/commodities`, the commodities & energy page
 * (page-division S17, 2026-11-11 — spec §11; D-2/D-19/D-27/D-28/
 * D-38/D-39/D-40; the session prompt's S17 scope).
 *
 * The page renders its own layers: the four commodity groups (Energy ·
 * Metals · Agriculture · Digital) + the Trade routes & supply group
 * (§11, D-38/D-39) — 24 cards with the §21 trio (value · 10-year
 * position · freshness), every card a context-only reading (no gauges,
 * no verdict lines — G-5). The metals group carries the gold cross-link
 * to /gold (§11 "Cross-links", D-19/D-27: gold and its ratios stay on
 * the Gold page — the ONE commodity exception).
 *
 * Every value is re-derived CLIENT-SIDE through the same pure engine
 * display (commodities-tiles → config/display.ts's formatReadingValue,
 * pinned output-for-output by commodities-tiles.test.ts — D-48). Data
 * arrives on the S2 contract: ONE curated projection (GET
 * /api/insights/pages/commodities — fetchPageProjection). The last-good
 * localStorage pattern (the GoldPage / UsaPage / EuropePage / AsiaPage /
 * AustraliaPage container) paints instantly from cache on a slow
 * connection and survives a feed outage, clearly labelled (M-17, the
 * BD-S5a sentence).
 *
 * The honest "In build" chip is RETIRED at the S17 gates pass (BD-S17c —
 * the S13 Europe / S15 Asia / S16 Australia retirement trajectory): the
 * build and the gates ship in this one session (the roadmap's Phase H is
 * a single S17), so once the §21 diff, the freshness audit, the render
 * audit and the browser pass are green, keeping the chip would be
 * dishonest in the other direction (BD-S15c/BD-S16c's reasoning); it is
 * removed before the deploy and the render audit asserts it ABSENT.
 *
 * Platform: browser only — this module lives in the lazy Commodities route
 * chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { destinationFor } from './destinations';
import { CommoditiesTierCards } from './CommoditiesTierCards';
import { PageBreadcrumbs } from '../../components/PageBreadcrumbs';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

export function CommoditiesPage(): React.JSX.Element {
  const { t, locale } = useI18n();

  /* ---------------- the projection (the S2 contract) ---------------- */
  const [state, setState] = useState<ProjectionState>(() => {
    try {
      const cached = readCachedPageProjection('commodities');
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
    fetchPageProjection('commodities')
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
  // kept the last good copy when a refresh failed (the BD-S5a sentence
  // REPLACES the plain data-as-of line — the GoldPage discipline).
  const fromCache = state.kind !== 'ready' && projection !== null;

  /* ---------------- the data-as-of line (the H4/R12 pattern) ---------------- */
  const dataAsOf = useMemo(() => {
    if (projection === null) return null;
    const dateText = locale === 'fa' ? formatJalaliDate(projection.generatedAt, 'fa-IR') : formatDateWords(projection.generatedAt, 'en-US');
    return { date: dateText };
  }, [projection, locale]);

  // Fail-closed (the RegionPage discipline): the router only mounts this
  // component on /commodities, but a future refactor must never see a
  // blank page — say so honestly.
  const spec = destinationFor('/commodities');
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
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.commodities.loadingLine')}</p>
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
          <h1 className="mb-2 text-2xl font-extrabold text-currena-dark">{t('pd.commodities.errorTitle')}</h1>
          <p className="mb-5 text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.commodities.errorText')}</p>
          <button
            type="button"
            onClick={() => load()}
            className="insights-focusable min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
          >
            {t('pd.commodities.errorRetry')}
          </button>
        </div>
      </div>
    );
  }

  // Ready (fresh or cached): the heading block, then the five group
  // sections — only when the projection has spoken (fresh or cached).
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* The heading block: title + the one-line purpose + the data-as-of
          line (the BD-S5a sentence replaces the plain line when the copy
          is the cached one). */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          {/* S19 (2026-11-12): the wayfinding row — Home › Commodities (BD-S19b). */}
          <PageBreadcrumbs pageKey="pd.commodities.title" />
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.commodities.title')}</h1>
          {/* The In-build chip is RETIRED (BD-S17c — the S17 gates pass:
           * the §21 backtest 24/24 green vs production, the freshness
           * audit honest, the render audit 7/7 green). The page's cards
           * are complete and verified; no honest "in build" claim
           * remains. The pd.statusBuilding key stays for the
           * not-yet-built page (PagePlaceholder — Currencies). Mirrors
           * the S13 Europe / S15 Asia / S16 Australia retirement
           * trajectory (BD-S16c). */}
        </div>
        <p className="m-0 mt-0.5 line-clamp-2 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">
          {t('pd.commodities.purpose')}
        </p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            {fromCache ? (
              <bdi className="text-[var(--color-text-tertiary)]" data-commodities-cached>
                {interpolate(t('pd.global.fromCache'), { date: dataAsOf.date })}
              </bdi>
            ) : (
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf.date })}</bdi>
            )}
          </p>
        ) : null}
      </header>

      {/* The absent-note honesty line (public mode's licence-hidden ids —
          the Commodities projection's own honest report). */}
      {projection !== null && projection.absentIds.length > 0 ? (
        <p className="m-0 mb-2.5 text-[10.5px] text-currena-muted sm:mb-3 sm:text-[length:var(--type-caption)]" data-absent-note>
          <bdi>{interpolate(t('pd.global.absentLine'), { n: projection.absentIds.length })}</bdi>
        </p>
      ) : null}

      {/* The five group sections (§11, D-38/D-39) — 24 cards with the
          §21 trio, the gold cross-link on the metals group. Only when
          the projection has spoken (fresh or cached). */}
      {readings !== undefined ? <CommoditiesTierCards readings={readings} /> : null}
    </div>
  );
}
