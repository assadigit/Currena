/**
 * AustraliaPage — `/australia`, the home market (page-division S16,
 * 2026-11-10 — spec §10 items 1–3; D-6/D-37; the session prompt's S16
 * scope).
 *
 * The S8 zoom section stays ON TOP (RegionIndexSection, the region
 * shell's own D-44 section — the ASX 200 zoom, the one world-map index
 * seated in the AU zoom); below it the page renders its own layers:
 * the AU Markets board (§10 item 1 — the REUSED AustralianMarkets
 * drawing, the SAME drawing /insights renders, fed the corpus-pinned
 * words through the lean pd.australia adapter and with the ASX 200
 * anchor linking to its home board /world-markets, its own board feed
 * governing its own surface), then the five gauge sections + the
 * world-risk group (§10 item 2, D-37: the unchanged 3-voting + 2-shadow
 * structure) — 28 cards with the §21 trio (value · 10-year position ·
 * freshness), the voting gauges' verdict lines (the SAME pure
 * gaugeReading the engine reads), and the 11 moved-out seat chips
 * linking to their new homes (§10 "Moved out": audusd · audjpy · audnzd
 * → /currencies; nz-short-rate · nz-10y · china-property-investment ·
 * china-steel-output → /asia-pacific; iron-ore · coal-aus · lng-japan →
 * /commodities; gold-aud → /gold).
 *
 * Every value is re-derived CLIENT-SIDE through the same pure engine
 * display (australia-tiles → config/display.ts's formatReadingValue,
 * pinned output-for-output by australia-tiles.test.ts — D-48). Data
 * arrives on the S2 contract: ONE curated projection (GET
 * /api/insights/pages/australia — fetchPageProjection) + the two board
 * feeds (the zoom's markets board + the AU Markets board), each at its
 * existing cached route. The last-good localStorage pattern (the
 * GoldPage / UsaPage / EuropePage / AsiaPage container) paints instantly
 * from cache on a slow connection and survives a feed outage, clearly
 * labelled (M-17, the BD-S5a sentence).
 *
 * The honest "In build" chip is PRESENT at the S16 build (the S9/S10/
 * S12/S14 build-session trajectory) and RETIRES at the S16 gates pass —
 * the build and the gates ship in this one session (the roadmap's Phase
 * G is a single S16), so once the §21 diff, the freshness audit, the
 * render audit and the browser pass are green, keeping the chip would
 * be dishonest in the other direction (BD-S15c's reasoning); it is
 * removed before the deploy and the render audit asserts it ABSENT.
 *
 * Platform: browser only — this module lives in the lazy Australia route
 * chunk, never the entry graph.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDateWords, formatJalaliDate } from '@currena/core';
import type { AuMarketsSnapshot, PageProjection } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { ApiError, fetchPageProjection, readCachedPageProjection } from '../../lib/page-division';
import { fetchAuMarketsSnapshot, readCachedAuMarkets } from '../../lib/markets-au';
import { destinationFor } from './destinations';
import { RegionIndexSection } from './RegionIndexSection';
import { AustraliaTierCards } from './AustraliaTierCards';
import { useAustraliaBoardCopy } from './australia-board-copy';
import { AustralianMarkets } from '../../components/insights/AustralianMarkets';
import type { AuMarketsLoadState } from '../../components/insights/AustralianMarkets';
import { MoneyPanel } from '../../components/insights/MoneyPanel';
import { useInsightsCopy } from '../../components/insights/useInsightsCopy';
import { navigate } from '../../router';
import { PageBreadcrumbs } from '../../components/PageBreadcrumbs';

type ProjectionState =
  | { kind: 'loading'; cached: PageProjection | null }
  | { kind: 'ready'; projection: PageProjection }
  | { kind: 'error'; error: ApiError; cached: PageProjection | null };

/** The AU Markets board's load state — the markets/fx discipline (the S10
 *  useTicBoard shape): a failed refresh keeps the LAST GOOD copy on
 *  screen, flagged fromCache; no cache at all → the calm "being prepared"
 *  line. The board NEVER surfaces an error state for the page (its own
 *  feed governs its own surface — the BD-S9c discipline). */
function useAuMarketsBoard(): AuMarketsLoadState {
  const [boardState, setBoardState] = useState<AuMarketsLoadState>(() => {
    try {
      const cached = readCachedAuMarkets();
      return cached ? { kind: 'ready', snapshot: cached, fromCache: true } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchAuMarketsSnapshot(controller.signal).then((snapshot: AuMarketsSnapshot | null) => {
      if (controller.signal.aborted) return;
      // M-17: a failed refresh keeps the LAST GOOD copy on screen,
      // flagged with its stored generation; no cache at all → the calm
      // "being prepared" line.
      setBoardState((prev) => {
        if (snapshot !== null) return { kind: 'ready', snapshot };
        const cached = prev.kind === 'ready' ? prev.snapshot : null;
        if (cached !== null) return { kind: 'ready', snapshot: cached, fromCache: true };
        return { kind: 'empty' };
      });
    });
    return () => controller.abort();
  }, []);

  return boardState;
}

export function AustraliaPage(): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  // The Insights copy corpus — the MoneyPanel (moved from /insights in TM7)
  // reads its area labels + the AU indicator names from the same corpus.
  const { copy } = useInsightsCopy();
  const boardCopy = useAustraliaBoardCopy(t);
  const boardState = useAuMarketsBoard();

  /* ---------------- the projection (the S2 contract) ---------------- */
  const [state, setState] = useState<ProjectionState>(() => {
    try {
      const cached = readCachedPageProjection('australia');
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
    fetchPageProjection('australia')
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
  // component on /australia, but a future refactor must never see a
  // blank page — say so honestly.
  const spec = destinationFor('/australia');
  if (spec === undefined) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-5 py-8">
        <p className="text-sm text-currena-muted">{t('pd.unknownRoute')}</p>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  // The honest load state before any data exists (no cache, first paint).
  // The S8 zoom section + the AU Markets board are REAL data of their own
  // (each its own feed, M-17 on its own tracks) — they render through
  // EVERY state below, so a slow or dead PROJECTION never takes the
  // honest map or the board away with it.
  if (projection === null && state.kind === 'loading') {
    return (
      <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
        <div className="flex w-full flex-col items-center py-16" role="status">
          <p className="m-0 text-[length:var(--type-label)] font-semibold text-currena-muted">{t('pd.australia.loadingLine')}</p>
          <span className="mt-4 flex justify-center gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
        <RegionIndexSection region="australia" />
        <AustraliaBoardSection state={boardState} copy={boardCopy} locale={locale} numberLocale={numberLocale} />
      </div>
    );
  }

  // The honest error state: no data, no cache — say so, offer the retry.
  // Nothing is faked (Agent Rule 5); the retry re-enters the same loader.
  // The projection outage only takes the gauge sections away, never the
  // map or the board (each board feed governs its own surface).
  if (projection === null && state.kind === 'error') {
    return (
      <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
        <div className="mx-auto w-full max-w-[560px] px-5 py-16 sm:max-w-[680px]">
          <h1 className="mb-2 text-2xl font-extrabold text-currena-dark">{t('pd.australia.errorTitle')}</h1>
          <p className="mb-5 text-[length:var(--type-label)] leading-relaxed text-currena-muted">{t('pd.australia.errorText')}</p>
          <button
            type="button"
            onClick={() => load()}
            className="insights-focusable min-h-[44px] cursor-pointer rounded-xl bg-currena-blue px-5 text-sm font-bold text-white transition-colors hover:bg-currena-blue/90"
          >
            {t('pd.australia.errorRetry')}
          </button>
        </div>
        <RegionIndexSection region="australia" />
        <AustraliaBoardSection state={boardState} copy={boardCopy} locale={locale} numberLocale={numberLocale} />
      </div>
    );
  }

  // Ready (fresh or cached): the zoom section on top, the AU Markets
  // board, then the five gauge sections + the world-risk group — only
  // when the projection has spoken (fresh or cached).
  return (
    <div className="mx-auto w-full max-w-[560px] px-3 py-1.5 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1280px] lg:px-8 lg:py-6">
      {/* The heading block: title + the one-line purpose + the data-as-of
          line (the BD-S5a sentence replaces the plain line when the copy
          is the cached one). */}
      <header className="mb-2.5 sm:mb-4 lg:mb-5">
        <div className="mb-1 flex flex-wrap items-center gap-2.5 sm:mb-2">
          {/* S19 (2026-11-12): the wayfinding row — Home › Australia (BD-S19b). */}
          <PageBreadcrumbs pageKey="pd.australia.title" />
          <h1 className="m-0 text-lg font-extrabold leading-tight text-currena-dark sm:text-2xl lg:text-[1.75rem]">{t('pd.australia.title')}</h1>
          {/* The In-build chip is RETIRED (BD-S16c — the S16 gates pass:
           * the §21 backtest 28/28 green vs production, the freshness
           * audit honest, the render audit 7/7 green). The page's cards
           * are complete and verified; no honest "in build" claim
           * remains. The pd.statusBuilding key stays for the
           * not-yet-built pages (PagePlaceholder — Commodities +
           * Currencies). Mirrors the S13 Europe / S15 Asia retirement
           * trajectory (BD-S15c). */}
        </div>
        <p className="m-0 mt-0.5 line-clamp-2 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:mt-1 sm:line-clamp-none sm:text-[length:var(--type-label)]">
          {t('pd.australia.purpose')}
        </p>
        {dataAsOf !== null ? (
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[10.5px] font-semibold text-currena-muted sm:mt-1.5 sm:gap-x-3 sm:text-[length:var(--type-caption)]">
            {fromCache ? (
              <bdi className="text-[var(--color-text-tertiary)]" data-australia-cached>
                {interpolate(t('pd.global.fromCache'), { date: dataAsOf.date })}
              </bdi>
            ) : (
              <bdi>{interpolate(t('pd.global.dataAsOf'), { date: dataAsOf.date })}</bdi>
            )}
          </p>
        ) : null}
      </header>

      {/* The absent-note honesty line (public mode's licence-hidden ids —
          the Australia projection's own honest report). */}
      {projection !== null && projection.absentIds.length > 0 ? (
        <p className="m-0 mb-2.5 text-[10.5px] text-currena-muted sm:mb-3 sm:text-[length:var(--type-caption)]" data-absent-note>
          <bdi>{interpolate(t('pd.global.absentLine'), { n: projection.absentIds.length })}</bdi>
        </p>
      ) : null}

      {/* The S8 zoom section — stays on top (BD-S8b's recorded page
          order: the index/map section first, the page's own layers under
          it). Its board feed is independent of the projection. */}
      <RegionIndexSection region="australia" />

      {/* The AU Markets board (§10 item 1): the REUSED drawing, its own
          feed, the ASX 200 anchor linking to /world-markets. */}
      <AustraliaBoardSection state={boardState} copy={boardCopy} locale={locale} numberLocale={numberLocale} />

      {/* The five gauge sections + the world-risk group (§10 item 2,
          D-37) — 28 cards with the §21 trio, the verdict lines, and the
          moved-out seat chips. Only when the projection has spoken
          (fresh or cached). */}
      {readings !== undefined ? <AustraliaTierCards readings={readings} /> : null}

      {/* The "What it means for my money" panel (TM7: moved from /insights'
          Australia section slot — it's an AU-household-costs panel by content,
          so it lives here now). The panel reads the same AU readings the
          projection carries; a tap navigates to /insights for the full detail
          (the Australia page has no side panel of its own). */}
      {readings !== undefined ? (
        <MoneyPanel
          readings={readings}
          copy={copy}
          numberLocale={numberLocale}
          onFocusCard={() => navigate('/insights')}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The AU Markets board section (§10 item 1): the section's own heading
 * + the REUSED AustralianMarkets drawing. The drawing carries its own
 * h3 sub-heading + provenance + loading/empty states inside (one
 * drawing, one vocabulary — D-48); the section heading is the page's
 * own. A dead projection never takes the board away (its own feed).
 * ------------------------------------------------------------------ */

function AustraliaBoardSection({
  state,
  copy,
  locale,
  numberLocale,
}: {
  state: AuMarketsLoadState;
  copy: ReturnType<typeof useAustraliaBoardCopy>;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}): React.JSX.Element {
  const { t } = useI18n();
  return (
    <section aria-label={t('pd.australia.board.title')} data-australia-board className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.australia.board.title')}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t('pd.australia.board.intro')}</p>
      </div>
      {/* The REUSED drawing — the SAME AustralianMarkets the legacy
       *  /insights page renders, fed the corpus-pinned words through the
       *  lean adapter, with the ASX 200 anchor navigating to the world
       *  board (the market's home board, G-3). The drawing carries no own
       *  container shell (it lives inside the /insights section's mother
       *  container there) — the soft tint + ring wrapper here is that
       *  mother container's own discipline, restated lean. */}
      <div className="rounded-[var(--radius-lg)] bg-currena-soft/60 p-3 ring-1 ring-[var(--color-border)] sm:p-4">
        <AustralianMarkets state={state} copy={copy} locale={locale} numberLocale={numberLocale} asx200AnchorTo="/world-markets" />
      </div>
    </section>
  );
}
