/**
 * GoldPage — `/gold`, THE gold card (page-division S5, 2026-11-08 —
 * spec §5, D-26…D-29).
 *
 * The S1 placeholder is superseded: the page renders the hero (the live
 * gold price + the Balance Scale verdict + the 7-state outlook + the
 * for/against/neutral/unread counts), the 37 seats grouped by the five
 * lanes, the D-27 context cards, the four blocked ids as honest notes
 * (§16), and the honest-record footnote — every verdict re-derived
 * CLIENT-SIDE through the same pure engines (gold-tiles.ts →
 * gold-balance.ts / outlook-core / evaluateSignal / the BalanceScale's
 * own tilt + verdict helpers), never a second arithmetic (D-48). Data
 * arrives on the S2 contract: ONE curated projection
 * (GET /api/insights/pages/gold — fetchPageProjection), no boards (the
 * placement's own manifest). The last-good localStorage pattern paints
 * instantly from cache on a slow connection and survives a feed outage,
 * clearly labelled (M-17).
 *
 * Platform: browser only — this module lives in the lazy Gold route
 * chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { fetchInsightsSnapshot, readCachedSnapshot } from '../../lib/insights';
import type { InsightsSnapshot } from '@currena/core';
import { Signals } from '../../components/insights/Signals';
import { useInsightsCopy } from '../../components/insights/useInsightsCopy';
import { GoldHero } from './GoldHero';
import { GoldSeats } from './GoldSeats';
import { GoldContext } from './GoldContext';
import { goldContextCards, goldHero, goldSeatLanes } from './gold-tiles';
import { PageBreadcrumbs } from '../../components/PageBreadcrumbs';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

export function GoldPage(): React.JSX.Element {
  const { t, locale } = useI18n();
  // TM13: the Signals section (the gold + silver verdict strip with the
  // price-trend chart + range buttons) moved from /insights. The Signals
  // component reads the full insights snapshot's readings (the gold-balance
  // conditions + the signal evaluations). Boot from the last-good cache
  // (instant), refresh in background — the same M-17 discipline.
  const { copy, numberLocale } = useInsightsCopy();
  const [insightsSnapshot, setInsightsSnapshot] = useState<InsightsSnapshot | null>(() => {
    try {
      return readCachedSnapshot();
    } catch {
      return null;
    }
  });
  useEffect(() => {
    const controller = new AbortController();
    void fetchInsightsSnapshot(controller.signal).then((s) => {
      if (controller.signal.aborted || s === null) return;
      setInsightsSnapshot(s);
    });
    return () => controller.abort();
  }, []);

  /* ---------------- the projection (the S2 contract) ---------------- */
  const [state, setState] = useState<ProjectionState>(() => {
    try {
      const cached = readCachedPageProjection('gold');
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
    fetchPageProjection('gold')
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
  // kept the last good copy when a refresh failed (the GlobalPage S4
  // discipline, inherited).
  const fromCache = state.kind !== 'ready' && projection !== null;

  /* ---------------- the derivations (pure, engine-side) ---------------- */
  const hero = useMemo(() => (readings !== undefined ? goldHero(readings) : null), [readings]);
  const seatLanes = useMemo(() => (hero !== null ? goldSeatLanes(hero.balance) : []), [hero]);
  const contextEntries = useMemo(() => (readings !== undefined ? goldContextCards(readings) : []), [readings]);

  /* ---------------- the data-as-of line (the H4/R12 pattern) ---------------- */
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
        <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.gold.loadingLine')}</p>
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
        <h1 className="mb-2 text-2xl font-extrabold text-currena-dark">{t('pd.gold.errorTitle')}</h1>
        <p className="mb-5 text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.gold.errorText')}</p>
        <button
          type="button"
          onClick={() => load()}
          className="insights-focusable min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
        >
          {t('pd.gold.errorRetry')}
        </button>
      </div>
    );
  }

  // Ready (fresh or cached): the complete gold picture.
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1080px] lg:px-8 lg:py-6">
      {/* The heading block: title + the one-line purpose + the data-as-of
          line (the honest "daily snapshot + hourly prices" story) + the
          M-17 cached-copy label when it paints. */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        {/* S19 (2026-11-12): the wayfinding row — Home › Gold (BD-S19b). */}
        <PageBreadcrumbs pageKey="pd.gold.title" />
        <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.gold.title')}</h1>
        <p className="m-0 mt-0.5 line-clamp-2 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">
          {t('pd.gold.purpose')}
        </p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            {/* BD-S5a (the S5 dark-mode VLM pass): when the page renders
             * the CACHED copy, the fromCache sentence REPLACES the plain
             * data-as-of line — the sentence already carries the date, and
             * printing both read as a garbled duplicate ("Data as of Nov 8
             * · Showing the last good copy — data as of Nov 8"). Same
             * information, one honest sentence. Global's header keeps the
             * S4 pattern until S19's polish pass aligns it. */}
            {fromCache ? (
              <bdi className="text-[var(--color-text-tertiary)]">{interpolate(t('pd.global.fromCache'), { date: dataAsOf.date })}</bdi>
            ) : (
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf.date })}</bdi>
            )}
          </p>
        ) : null}
      </header>

      {/* The absent-note honesty line (public mode's licence-hidden ids —
          the Gold projection's own honest report; the blocked quartet
          rides here, and the §16 notes below spell each one out). */}
      {projection !== null && projection.absentIds.length > 0 ? (
        <p className="m-0 mb-2.5 text-[10.5px] text-currena-muted sm:mb-3 sm:text-[length:var(--type-caption)]" data-absent-note>
          <bdi>{interpolate(t('pd.global.absentLine'), { n: projection.absentIds.length })}</bdi>
        </p>
      ) : null}

      {/* D-26 item 1 — the hero. */}
      {hero !== null ? <GoldHero hero={hero} pricesAsOf={projection?.pricesAsOf} /> : null}

      {/* TM13: the Signals section (the gold + silver verdict strip with the
          price-trend chart + range buttons) — moved from /insights. Shows
          the gold verdict card (the outlook sentence, the 3m/1y/5y/10y
          trend chart, the delta) + the silver verdict card. Renders
          nothing when the insights snapshot isn't loaded yet. */}
      {insightsSnapshot !== null ? (
        <div className="mt-3 sm:mt-5" data-gold-signals>
          <Signals
            readings={insightsSnapshot.readings}
            copy={copy}
            numberLocale={numberLocale}
            expandToken={0}
          />
        </div>
      ) : null}

      {/* D-26 item 2 — the 37 seats, grouped by the five lanes. */}
      <div className="mt-3 sm:mt-5">
        {seatLanes.length > 0 ? <GoldSeats lanes={seatLanes} /> : null}
      </div>

      {/* D-27 + §16 + D-29 — the context cards, the blocked notes, the
          honest-record footnote. */}
      <div className="mt-3 sm:mt-5">
        {contextEntries.length > 0 ? <GoldContext entries={contextEntries} /> : null}
      </div>
    </div>
  );
}
