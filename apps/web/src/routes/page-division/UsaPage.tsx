/**
 * UsaPage — `/usa`, the American bulk (page-division S9, 2026-11-09 —
 * spec §7 items 1–3; D-29/D-30; the session prompt's S9 scope).
 *
 * The S8 zoom section stays ON TOP (RegionIndexSection, the region
 * shell's own D-44 section — BD-S8b recorded this page's build order);
 * below it the page now renders the REAL S9 layers: the D-30 verdict
 * strip (the same five computed verdicts as Global, US-framed questions)
 * and the two tiers (D-29's seven "the world watches" + the 19 rates &
 * the Fed cards, each with the §21 trio: value · 10-year position ·
 * freshness). Every verdict is re-derived CLIENT-SIDE through the same
 * pure engines (usa-tiles → global-tiles' globalGaugeTiles: one
 * derivation with Global, D-48). Data arrives on the S2 contract: ONE
 * curated projection (GET /api/insights/pages/usa — fetchPageProjection)
 * + the markets board the zoom reads at its existing cached route. The
 * last-good localStorage pattern (the GoldPage container) paints
 * instantly from cache on a slow connection and survives a feed outage,
 * clearly labelled (M-17, the BD-S5a sentence).
 *
 * The page is still assembling (BD-S8b's recorded scope): tiers 3–6, the
 * TIC board and the S10 sections are the NEXT session's — the honest
 * "In build" chip and the placeholder body stay until then, saying so.
 *
 * Platform: browser only — this module lives in the lazy USA route
 * chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { destinationFor } from './destinations';
import { RegionIndexSection } from './RegionIndexSection';
import { DestinationBody } from './DestinationBody';
import { UsaVerdictStrip } from './UsaVerdictStrip';
import { UsaTierCards } from './UsaTierCards';
import { usaGaugeVerdicts } from './usa-tiles';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

export function UsaPage(): React.JSX.Element {
  const { t, locale } = useI18n();

  /* ---------------- the projection (the S2 contract) ---------------- */
  const [state, setState] = useState<ProjectionState>(() => {
    try {
      const cached = readCachedPageProjection('usa');
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
    fetchPageProjection('usa')
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

  /* ---------------- the derivations (pure, engine-side) ---------------- */
  const verdicts = useMemo(() => (readings !== undefined ? usaGaugeVerdicts(readings) : []), [readings]);

  /* ---------------- the data-as-of line (the H4/R12 pattern) ---------------- */
  const dataAsOf = useMemo(() => {
    if (projection === null) return null;
    const dateText = locale === 'fa' ? formatJalaliDate(projection.generatedAt, 'fa-IR') : formatDateWords(projection.generatedAt, 'en-US');
    return { date: dateText };
  }, [projection, locale]);

  // Fail-closed (the RegionPage discipline): the router only mounts this
  // component on /usa, but a future refactor must never see a blank page
  // — say so honestly.
  const spec = destinationFor('/usa');
  if (spec === undefined) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-5 py-8">
        <p className="text-sm text-currena-muted">{t('pd.unknownRoute')}</p>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  // The honest load state before any data exists (no cache, first paint).
  // The S8 zoom section is REAL data of its own (the board feed, M-17 on
  // its own tracks) — it renders through EVERY state below, so a slow or
  // dead PROJECTION never takes the honest map away with it.
  if (projection === null && state.kind === 'loading') {
    return (
      <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
        <div className="flex w-full flex-col items-center py-16" role="status">
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.usa.loadingLine')}</p>
          <span className="mt-4 flex justify-center gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
        <RegionIndexSection region="us" />
      </div>
    );
  }

  // The honest error state: no data, no cache — say so, offer the retry.
  // Nothing is faked (Agent Rule 5); the retry re-enters the same loader.
  // The projection outage only takes the verdicts + the tier cards away,
  // never the map (the zoom's own feed governs the zoom).
  if (projection === null && state.kind === 'error') {
    return (
      <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
        <div className="mx-auto w-full max-w-[560px] px-5 py-16 sm:max-w-[680px]">
          <h1 className="mb-2 text-2xl font-extrabold text-currena-dark">{t('pd.usa.errorTitle')}</h1>
          <p className="mb-5 text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.usa.errorText')}</p>
          <button
            type="button"
            onClick={() => load()}
            className="insights-focusable min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
          >
            {t('pd.usa.errorRetry')}
          </button>
        </div>
        <RegionIndexSection region="us" />
      </div>
    );
  }

  // Ready (fresh or cached): the zoom section on top, the D-30 strip,
  // the two tiers, then the honest still-building record.
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* The heading block: title + the honest In-build chip (tiers 3–6,
          the TIC board and the S10 sections are still the roadmap's) +
          the one-line purpose + the data-as-of line (the BD-S5a sentence
          replaces the plain line when the copy is the cached one). */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.usa.title')}</h1>
          {/* In-build status chip — the page is still assembling (S10
           * delivers tiers 3–6 + the TIC board + the index section's
           * cards); the S9 layers below are real from today. */}
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-900 sm:px-3 sm:py-1 sm:text-xs dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
            {t('pd.statusBuilding')}
          </span>
        </div>
        <p className="m-0 mt-0.5 line-clamp-2 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">
          {t('pd.usa.purpose')}
        </p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            {fromCache ? (
              <bdi className="text-[var(--color-text-tertiary)]" data-usa-cached>
                {interpolate(t('pd.global.fromCache'), { date: dataAsOf.date })}
              </bdi>
            ) : (
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf.date })}</bdi>
            )}
          </p>
        ) : null}
      </header>

      {/* The absent-note honesty line (public mode's licence-hidden ids —
          the USA projection's own honest report). */}
      {projection !== null && projection.absentIds.length > 0 ? (
        <p className="m-0 mb-2.5 text-[10.5px] text-currena-muted sm:mb-3 sm:text-[length:var(--type-caption)]" data-absent-note>
          <bdi>{interpolate(t('pd.global.absentLine'), { n: projection.absentIds.length })}</bdi>
        </p>
      ) : null}

      {/* The S8 zoom section — stays on top (BD-S8b's recorded page
          order: the index/map section first, the page's own layers under
          it). Its board feed is independent of the projection. */}
      <RegionIndexSection region="us" />

      {/* The D-30 verdict strip + the two S9 tiers (each with the §21
          trio) — only when the projection has spoken (fresh or cached). */}
      {readings !== undefined ? (
        <>
          <UsaVerdictStrip verdicts={verdicts} />
          <UsaTierCards readings={readings} />
        </>
      ) : null}

      {/* The honest still-building record (the S1 placeholder's own
          body — tiers 3–6, the TIC board and the S10 sections are the
          next sessions'; nothing is faked, nothing promised beyond the
          roadmap). */}
      <div className="mx-auto mt-4 w-full max-w-[680px] lg:max-w-[880px]">
        <DestinationBody spec={spec} />
      </div>
    </div>
  );
}
