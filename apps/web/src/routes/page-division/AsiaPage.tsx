/**
 * AsiaPage — `/asia-pacific`, the Asia & Pacific picture (page-division
 * S14, 2026-11-09 — spec §9 items 1–6; D-16/D-17/D-35/D-36; the session
 * prompt's S14 scope).
 *
 * The S8 zoom section stays ON TOP (RegionIndexSection, the region
 * shell's own D-44 section — the N225 · KOSPI · HSI · SSEC · TAIEX ·
 * NIFTY50 zoom the S8 map already renders; the page's own layers seat
 * under it); below it the page renders the REAL layers: the five
 * sub-regions organized by sub-region NOT by theme (D-35) — China
 * (§9 item 1: seven cards) · Japan (§9 item 2: two cards) · Korea/
 * Taiwan/HK (§9 item 3: index-only today, the §15 Korea CPI fill
 * verified-pending-ingest) · India (§9 item 4: index-only today, the
 * §15 India CPI fill verified-pending-ingest) · Pacific New Zealand
 * (§9 item 5: two registry cards + the S21 NZX50 mirror card) — each
 * card with the §21 trio (value · 10-year position · freshness), and
 * the cross-links strip (§9: usdcny · usdjpy → /currencies; the SGE
 * Shanghai gold link → /gold). Every value is
 * re-derived CLIENT-SIDE through the same pure engine display (asia-
 * tiles → config/display.ts's formatReadingValue, pinned output-for-
 * output by asia-tiles.test.ts — D-48). Data arrives on the S2
 * contract: ONE curated projection (GET /api/insights/pages/asia-
 * pacific — fetchPageProjection) + the markets board the zoom reads,
 * each at its existing cached route. The last-good localStorage pattern
 * (the GoldPage / UsaPage / EuropePage container) paints instantly
 * from cache on a slow connection and survives a feed outage, clearly
 * labelled (M-17, the BD-S5a sentence).
 *
 * The honest "In build" chip is RETIRED (S15's gate pass — BD-S14b's
 * completion; the USA S11 / Europe S13 trajectory: build-session chip
 * → gates-session retirement). The page's 11 placed cards are complete
 * and the §21 diff is green; the §15 FRED-only CPI fills (D-36: Japan ·
 * Korea · India CPI YoY) are verified-pending-ingest (Rule 5 — BD-S14a)
 * and their absence does not make the 11 placed cards "in build" — they
 * are an ENGINE-layer change that deserves its own focused session. The
 * two index-only sections (Korea/Taiwan/HK, India) render an honest
 * note — their markets ride the zoom map above, and the CPI fills are
 * pending. The `pd.statusBuilding` key stays in both dictionaries —
 * `PagePlaceholder` (Commodities/Currencies) still carries the honest
 * chip for its own in-build state (S16 built Australia — its own chip
 * retired at its gates pass).
 *
 * Platform: browser only — this module lives in the lazy Asia route
 * chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { navigate } from '../../router';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { destinationFor } from './destinations';
import { RegionIndexSection } from './RegionIndexSection';
import { AsiaTierCards } from './AsiaTierCards';
import { PageBreadcrumbs } from '../../components/PageBreadcrumbs';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

/** The cross-links (§9: usdcny · usdjpy live on Currency Pairs, D-32;
 *  the SGE Shanghai gold link → /gold, §9 item 1's note). Their detail
 *  cards live on /currencies + /gold; this is the navigation aid, not a
 *  data card. Each carries its own destination + link-text key (the
 *  EuropePage pattern, extended for the /gold leg). */
const CROSS_LINKS: ReadonlyArray<{ id: string; code: string; href: string; linkTextKey: 'seePairs' | 'seeGold' }> = [
  { id: 'usdcny', code: 'USD/CNY', href: '/currencies', linkTextKey: 'seePairs' },
  { id: 'usdjpy', code: 'USD/JPY', href: '/currencies', linkTextKey: 'seePairs' },
  { id: 'sge-gold', code: 'XAU/CNY', href: '/gold', linkTextKey: 'seeGold' },
];

export function AsiaPage(): React.JSX.Element {
  const { t, locale } = useI18n();

  /* ---------------- the projection (the S2 contract) ---------------- */
  const [state, setState] = useState<ProjectionState>(() => {
    try {
      const cached = readCachedPageProjection('asia-pacific');
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
    fetchPageProjection('asia-pacific')
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
  // component on /asia-pacific, but a future refactor must never see a
  // blank page — say so honestly.
  const spec = destinationFor('/asia-pacific');
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
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.asiaPacific.loadingLine')}</p>
          <span className="mt-4 flex justify-center gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
        <RegionIndexSection region="asia" />
      </div>
    );
  }

  // The honest error state: no data, no cache — say so, offer the retry.
  // Nothing is faked (Agent Rule 5); the retry re-enters the same loader.
  // The projection outage only takes the sections + the cross-links away,
  // never the map (the zoom's own feed governs the zoom).
  if (projection === null && state.kind === 'error') {
    return (
      <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
        <div className="mx-auto w-full max-w-[560px] px-5 py-16 sm:max-w-[680px]">
          <h1 className="mb-2 text-2xl font-extrabold text-currena-dark">{t('pd.asiaPacific.errorTitle')}</h1>
          <p className="mb-5 text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.asiaPacific.errorText')}</p>
          <button
            type="button"
            onClick={() => load()}
            className="insights-focusable min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
          >
            {t('pd.asiaPacific.errorRetry')}
          </button>
        </div>
        <RegionIndexSection region="asia" />
      </div>
    );
  }

  // Ready (fresh or cached): the zoom section on top, the five sub-region
  // sections (each with the §21 trio) + the cross-links strip — only
  // when the projection has spoken (fresh or cached).
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* The heading block: title + the one-line purpose + the data-as-of
          line (the BD-S5a sentence replaces the plain line when the copy
          is the cached one). The In-build chip retired at S15's gate pass
          — the page's 11 placed cards are complete and verified. */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          {/* S19 (2026-11-12): the wayfinding row — Home › Asia (BD-S19b). */}
          <PageBreadcrumbs pageKey="pd.asiaPacific.title" />
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.asiaPacific.title')}</h1>
          {/* The In-build chip is RETIRED (BD-S14b's completion — S15's
           * gates passed: the §21 card audit 11/11 green, the freshness
           * audit honest, the mobile/ARIA polish landed). The page's
           * 11 placed cards are complete and verified; no honest "in
           * build" claim remains. The pd.statusBuilding key stays for
           * the not-yet-built pages (PagePlaceholder — Commodities + Currencies; S16 built Australia). The
           * §15 FRED-only CPI fills (D-36) stay verified-pending-ingest
           * (Rule 5 — BD-S14a/BD-S15d): a separate engine-layer change
           * that deserves its own session, and their absence does not
           * make the 11 placed cards "in build" (the USA S11 / Europe
           * S13 trajectory: build-session chip → gates-session
           * retirement on the gates pass). */}
        </div>
        <p className="m-0 mt-0.5 line-clamp-2 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">
          {t('pd.asiaPacific.purpose')}
        </p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            {fromCache ? (
              <bdi className="text-[var(--color-text-tertiary)]" data-asia-cached>
                {interpolate(t('pd.global.fromCache'), { date: dataAsOf.date })}
              </bdi>
            ) : (
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf.date })}</bdi>
            )}
          </p>
        ) : null}
      </header>

      {/* The absent-note honesty line (public mode's licence-hidden ids —
          the Asia projection's own honest report). */}
      {projection !== null && projection.absentIds.length > 0 ? (
        <p className="m-0 mb-2.5 text-[10.5px] text-currena-muted sm:mb-3 sm:text-[length:var(--type-caption)]" data-absent-note>
          <bdi>{interpolate(t('pd.global.absentLine'), { n: projection.absentIds.length })}</bdi>
        </p>
      ) : null}

      {/* The S8 zoom section — stays on top (BD-S8b's recorded page
          order: the index/map section first, the page's own layers under
          it). Its board feed is independent of the projection. */}
      <RegionIndexSection region="asia" />

      {/* The five sub-region sections (D-35: by sub-region, not by theme),
          each card with the §21 trio — only when the projection has
          spoken (fresh or cached). The two index-only sections (Korea/
          Taiwan/HK, India) render an honest note, never an empty grid. */}
      {readings !== undefined ? <AsiaTierCards readings={readings} /> : null}

      {/* The cross-links strip (§9: usdcny · usdjpy → /currencies; the
          SGE Shanghai gold link → /gold). Their detail cards live on the
          Currency Pairs + Gold pages; this is the navigation aid. */}
      <section aria-label={t('pd.asiaPacific.crossLinks.title')} data-asia-cross-links className="mt-3 scroll-mt-24 sm:mt-5">
        <div className="mb-1.5 sm:mb-2">
          <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.asiaPacific.crossLinks.title')}</h2>
          <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t('pd.asiaPacific.crossLinks.intro')}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5">
          {CROSS_LINKS.map((pair) => (
            <a
              key={pair.id}
              href={pair.href}
              data-asia-cross-link={pair.id}
              onClick={(e) => {
                e.preventDefault();
                navigate(pair.href);
              }}
              className="insights-focusable flex min-h-[44px] min-w-0 items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 no-underline ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] motion-safe:transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.10)] sm:p-3"
            >
              <span className="min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)] tabular-nums">{pair.code}</span>
              <span className="shrink-0 text-[length:var(--type-caption)] font-semibold text-currena-blue">{t(`pd.asiaPacific.crossLinks.${pair.linkTextKey}`)}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
