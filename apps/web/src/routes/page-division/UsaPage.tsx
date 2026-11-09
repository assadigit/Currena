/**
 * UsaPage — `/usa`, the American bulk (page-division S9 + S10,
 * 2026-11-09 — spec §7 items 1–7; D-29/D-30/D-31; the session prompts'
 * S9 + S10 scopes).
 *
 * The S8 zoom section stays ON TOP (RegionIndexSection, the region
 * shell's own D-44 section — BD-S8b recorded this page's build order);
 * below it the page renders the REAL layers: the D-30 verdict strip (the
 * same five computed verdicts as Global, US-framed questions), the five
 * tier sections (D-29's seven "the world watches" + the 19 rates & the
 * Fed + S10's inflation 12 · labor & growth 17 · liquidity/stress/
 * valuation 17 — 72 registry cards, each with the §21 trio: value ·
 * 10-year position · freshness) and the tier-6 TIC board "Who finances
 * America" (the REUSED legacy drawing over GET /api/insights/tic, its
 * own feed). Every verdict is re-derived CLIENT-SIDE through the same
 * pure engines (usa-tiles → global-tiles' globalGaugeTiles: one
 * derivation with Global, D-48). Data arrives on the S2 contract: ONE
 * curated projection (GET /api/insights/pages/usa — fetchPageProjection)
 * + the markets board the zoom reads + the TIC feed the tier-6 board
 * reads, each at its existing cached route. The last-good localStorage
 * pattern (the GoldPage container) paints instantly from cache on a slow
 * connection and survives a feed outage, clearly labelled (M-17, the
 * BD-S5a sentence).
 *
 * The S10 milestone retired the placeholder body (all 72 cards + the
 * TIC board are on-page); S11 retired the honest In-build chip (BD-S10b's
 * completion — the gates passed: the §21 card audit green, the freshness
 * audit formalized, the mobile/ARIA polish landed).
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
import { UsaVerdictStrip } from './UsaVerdictStrip';
import { UsaTierCards } from './UsaTierCards';
import { UsaTicSection } from './UsaTicSection';
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
  // the five tiers + the tier-6 TIC board (its own feed — it renders
  // through every projection state below, only the projection-gated
  // layers wait for their data).
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* The heading block: title + the one-line purpose + the data-as-of
          line (the BD-S5a sentence replaces the plain line when the copy
          is the cached one). The In-build chip retired at S11's gate
          pass — the page's layers are complete and verified. */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.usa.title')}</h1>
          {/* The In-build chip is RETIRED (BD-S10b's completion — S11's
           * gates passed: the §21 card audit 173/173 green, the freshness
           * audit formalized, the mobile/ARIA polish landed). The page's
           * layers are complete and verified; no honest "in build" claim
           * remains. The pd.statusBuilding key stays for the not-yet-built
           * pages (PagePlaceholder — Commodities + Currencies; S16 built Australia). */}
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

      {/* The D-30 verdict strip + the five tiers (each with the §21 trio)
          — only when the projection has spoken (fresh or cached). */}
      {readings !== undefined ? (
        <>
          <UsaVerdictStrip verdicts={verdicts} />
          <UsaTierCards readings={readings} />
        </>
      ) : null}

      {/* The tier-6 TIC board — "Who finances America" (D-31): the
          REUSED legacy drawing over its OWN feed, independent of the
          projection (a slow or dead projection never takes the board
          away — each feed governs its own surface). */}
      <UsaTicSection />
    </div>
  );
}
