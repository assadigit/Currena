/**
 * GoldPage — `/gold`, THE gold card (page-division S5, 2026-11-08 —
 * spec §5, D-26…D-29).
 *
 * The S1 placeholder is superseded: the page renders the hero (the live
 * gold price + the Balance Scale verdict + the 7-state outlook + the
 * for/against/neutral/unread counts), the 37 seats grouped by the five
 * lanes, the D-27 context cards, and the honest-record footnote — every
 * verdict re-derived
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
import { useI18n } from '../../shared/lib/locale';
import { interpolate } from '../../shared/i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../shared/lib/page-division';
import { fetchInsightsSnapshot, readCachedSnapshot } from '../../shared/lib/insights';
import type { InsightsSnapshot } from '@currena/core';
import { Signals } from './Signals';
import { useInsightsCopy } from '../../shared/hooks/useInsightsCopy';
import { GoldHero } from './GoldHero';
import { GoldNarrative } from './narrative/GoldNarrative';
import { GoldYieldDecomposition } from './GoldYieldDecomposition';
import { GoldOnRamp } from './GoldOnRamp';
import { GoldExpectations } from './GoldExpectations';
import { GoldIranBridge } from './GoldIranBridge';
import { GoldPremiumHistory } from './GoldPremiumHistory';
import { GoldCbDemand } from './GoldCbDemand';
import { GoldLondonVault } from './GoldLondonVault';
import { GoldCorrelation } from './GoldCorrelation';
import { GoldTaLevels } from './GoldTaLevels';
import { GoldSeats } from './GoldSeats';
import { GoldSectionNav } from './GoldSectionNav';
import { GoldContext } from './GoldContext';
import { GoldTail } from './GoldTail';
import { useIndicatorDetailsPanel } from '../../shared/hooks/useIndicatorDetails';
import { GoldPositions } from './GoldPositions';
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
  // The R-5 details-panel wiring (docs/page-division/07): the context
  // cards' click opens the ported panel over the page's own readings.
  const { openCard, panel } = useIndicatorDetailsPanel(readings);
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

      {/* D-26 item 1 — the hero, REBUILT (GUX-S5 M3b): the price block +
          the BriefingCard (the focal element) + the CompositionStack. The
          reason rows open the M4 record popover (the same details panel
          the context cards use — one canonical record presentation). */}
      {hero !== null ? (
        <GoldHero
          hero={hero}
          pricesAsOf={projection?.pricesAsOf}
          pricesCached={fromCache}
          onOpenRecord={(id) => openCard(id)}
        />
      ) : null}

      {/* GPE R11 / R12 — Zone D, the explanation band: F1 the daily
          narrative + F5 the yield-decomposition card (side by side from
          lg, stacked at 390 — s6/03 zone D). Both derive from the SAME
          projection as the hero (one truth, s7/03 §2.4); the band carries
          the #gold-zone-d anchor (R10's contract).
          GPE R20 / F4a (2026-11-18): the education on-ramp — the band's
          third element (collapsed accordion per s6/01 zone D), the five
          drivers each closing at its lane anchor, the two notes, the FAQ
          tail (s7/02's approved reference wording). */}
      {/* GUX-S5 M5: the sticky section nav — the master plan's
          "sticky section navigation foundation" (the F-03 fix). The
          chips carry the page's OWN anchors (R10's contract, native
          scroll); the spy is the foundation tier (see GoldSectionNav). */}
      <GoldSectionNav />

      {readings !== undefined ? (
        <div id="gold-zone-d" className="mt-2.5 flex flex-col gap-2.5 sm:mt-4 sm:gap-3" data-gold-zone-d-band>
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
            <GoldNarrative readings={readings} />
            <GoldYieldDecomposition readings={readings} />
          </div>
          <GoldOnRamp readings={readings} />
          {/* GPE R28 / R29 (2026-11-19): the expectations strip — the
              band's fourth element (s6/03 zone D "F24/F25 = ONE row").
              THE KALSHI LEG DOES NOT SHIP (S15-D1 — the wording read);
              the card renders Polymarket + the calendar. The calendar
              rides the SAME insights snapshot the Signals section reads
              (ZERO new fetches — R29's own constraint). */}
          <GoldExpectations calendar={insightsSnapshot?.calendar} />
        </div>
      ) : null}

      {/* GPE R13 / F3a — Zone F, THE IRAN BRIDGE (s6/01 §2a slot A:
          between the Signals section and the 37 seats — the page's second
          chapter, after the global verdict completes). The data plane is
          SHARED with LedGoldBoard (the App-boot snapshot store — zero new
          fetches); the #gold-zone-f anchor rides R10's contract. HARD
          GATE satisfied: Bridge-1 lands before Bridge-2/R30 (P3).
          GPE R30 / F3b — Bridge-2 EXTENDS the same zone (s1/11 §8's
          phase 2: the same zone, later wave, without moving it): the
          premium-history card rides below the bridge board — the
          strip's live side reads the SAME snapshot store; the history
          side reads the ONE-key /gold-premium route (one fetch). */}
      <div className="mt-3 flex flex-col gap-2.5 sm:mt-5 sm:gap-3" data-gold-zone-f-band>
        <GoldIranBridge />
        <GoldPremiumHistory />
      </div>

      {/* TM13: the Signals section (the gold + silver verdict strip with the
          price-trend chart + range buttons) — moved from /insights. Shows
          the gold verdict card (the outlook sentence, the 3m/1y/5y/10y
          trend chart, the delta) + the silver verdict card.
          GPE R06/#24 (GPE-S2-24): a cold-load skeleton reserves the
          section's slot while the second fetch (/api/insights) is in
          flight — the seats below no longer pop in above the signals
          block on a slow connection (the layout-jump the audit caught). */}
      {insightsSnapshot !== null ? (
        <div className="mt-3 sm:mt-5" data-gold-signals>
          <Signals
            readings={insightsSnapshot.readings}
            copy={copy}
            numberLocale={numberLocale}
            expandToken={0}
          />
        </div>
      ) : (
        <section
          className="mt-3 sm:mt-5"
          data-gold-signals-skeleton
          aria-label={copy.signals.title}
          role="status"
        >
          <h2 className="type-section m-0">{copy.signals.title}</h2>
          <p className="m-0 mt-1 text-[length:var(--type-label)] text-currena-muted">{t('pd.gold.loadingLine')}</p>
          <span className="mt-3 flex justify-start gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </section>
      )}

      {/* D-26 item 2 — the 37 seats, grouped by the five lanes. GPE R04:
          the projection's readings ride along so every dark seat can
          state WHY it is dark (the cause-class why-lines). */}
      <div className="mt-3 sm:mt-5">
        {seatLanes.length > 0 ? <GoldSeats lanes={seatLanes} readings={readings} /> : null}
      </div>

      {/* GPE R19 / F8 (2026-11-18) — Zone H, the minimal TA band
          (s6/01 §2c slot B: a "REFERENCE LEVELS" band immediately before
          the RATIOS block — the s2 §5c split: the overlay rides the F7
          chart in Zone E, the tables render here; the two renderings
          cross-link). Reads the SAME module-cached OHLC leg as the chart
          (one fetch, two surfaces). HARD GATE satisfied: R01 fixed at
          S10. */}
      <GoldTaLevels />

      {/* D-27 + §16 + D-29 — the context cards, the blocked notes, the
          honest-record footnote. GPE R14: Zone K (the central-bank demand
          section) rides INSIDE this block via the zoneK slot — between
          the flows cards and the licence wall (s6/01 §2b slot A), so the
          trust band (wall + honest record) stays contiguous behind it.
          GPE R24 + R22 (2026-11-19): the zone's own content order per
          s7/01 §6 — the tracker (R14), then the F22 riders (the London
          vault + clearing plumbing), then the F11 companion chart CLOSES
          the zone (the crossover lesson beside the data that explains
          it). */}
      <div className="mt-3 sm:mt-5">
        {contextEntries.length > 0 ? (
          <GoldContext
            entries={contextEntries}
            onOpenDetails={openCard}
            zoneK={
              readings !== undefined ? (
                <>
                  <GoldCbDemand price={hero?.price} />
                  <GoldLondonVault />
                  <GoldCorrelation />
                </>
              ) : null
            }
          />
        ) : null}
      </div>

      {/* TM23: the Gold Positions section — the CFTC trader positioning
          cards with a visual bar showing where the current positioning
          stands in its 0–100 range. */}
      {readings !== undefined ? <GoldPositions readings={readings} /> : null}

      {/* GPE R25 / F6 (2026-11-19) — Zone O, the history tail (s6/01
          zone 16). GUX-S5 M3b (the S4-D10 budget play): the three tail
          sections (the Episode Explorer + the if-you'd-bought calculator
          + the publication-notes disclosure) now render through the
          NEAR-VIEWPORT lazy boundary (GoldTail) — their bytes moved to
          the tail's own chunk so the briefing components fit the
          240/50 ceiling. The sections' own DOM, order, ids and
          collapsed-by-default shapes are UNCHANGED (gold-tail-content
          renders them verbatim); the boundary is invisible to the
          reader (600px prefetch, the anchor contract never hostage —
          GoldTail.tsx). */}
      <GoldTail absentCount={projection?.absentIds.length ?? 0} />

      {/* The R-5 details panel (docs/page-division/07) — rendered once at
          the page root; the context cards' stretched opener targets it. */}
      {panel}
    </div>
  );
}
