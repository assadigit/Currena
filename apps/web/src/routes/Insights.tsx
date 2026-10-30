/**
 * Insights — the /insights page (Phase I4 → I15 restructure → ROUND-2 UX
 * pass, 2026-10-10 spec docs/insights/06-ux-round-2-spec.md).
 *
 * Structure top to bottom (round-2 target order, spec §3):
 *   header (title, subtitle, "Data as of {date}" + the Tools disclosure, R15)
 *   → hero: Global verdict FIRST then Australia (D7), each with meter,
 *     gauges, computed reason line and needs-attention tiles (R1–R3), one
 *     biggest-move line (R4)
 *   → sticky section pills: Status · Prices · Together · Signals ·
 *     Indicators · About (R19; Signals expands its section, R7b)
 *   → prices strip: four identical tiles (R10)
 *   → "What it means for my money": at most 4 lines (R11)
 *   → "Together" (collapsed by default, R7b) → "What the signals say"
 *     (collapsed, merged card R26)
 *   → indicators: BOTH dedicated sections stacked (round 33 — the
 *     Global|Australia switcher is retired), each with its big region icon
 *   → "Next up" calendar (once, below the indicators, R16)
 *   → footer: "About this data" (quiet, collapsible, R25)
 *
 * Data: GET /api/insights (zod-validated in lib/insights.ts), last-good
 * localStorage snapshot first for instant/offline paint, fresh fetch
 * revalidating behind it. Deep links ('#/insights?card=<id>') open the
 * details panel for that indicator.
 *
 * Phase 3-e (2026-10-15) route split: this file stays the slim page shell
 * (the lazy route entry — named export `Insights` for App.tsx) and the
 * page-level section compositions moved to routes/insights-sections/, all
 * verbatim (no JSX, hook, handler or copy change):
 *   InsightsHeader.tsx        — header + Tools disclosure + data-as-of + CSV/.ics
 *   InsightsStatusBlocks.tsx  — LoadState + reading progress + loading/error/stale shells
 *   QuestionGroup.tsx         — one question group of the lane (+ the shared `num`)
 *   SectionLane.tsx           — the indicator lane (watchlist strip + region sections)
 *   world-feeds.ts            — the markets/fx section fetch hooks + hero indicators
 *   useInsightsToolsNav.ts    — Tools state + "/" and j/k shortcuts + filtering
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IndicatorId, InsightsSection } from '@currena/core';
import type { IndicatorReading } from '@currena/core';
// The generated public-mode hidden set (2026-10-18b): the SAME file the API
// worker and the T-15 build gate consume — bundling it here keeps the web's
// section gating and the API's route gating driven by one source of truth.
// The markets board rides the owner directive and is NOT in hiddenBoards;
// the fx board is.
import siteModeOverrides from '../../../../data/site-mode-overrides.json';
import { useI18n } from '../lib/locale';
import { routeQuery } from '../router';
import { ApiError, fetchInsightsSnapshot, readCachedSnapshot } from '../lib/insights';
import { AboutTheData } from '../components/insights/AboutTheData';
import { DetailsPanel } from '../components/insights/DetailsPanel';
import { HeroBlock } from '../components/insights/HeroBlock';
import { JumpNav, type JumpTarget } from '../components/insights/JumpNav';
import { TopMoversStrip } from '../components/insights/TopMoversStrip';
import { MoneyPanel } from '../components/insights/MoneyPanel';
import { NextUpStrip } from '../components/insights/NextUpStrip';
import { PricesBoard } from '../components/insights/PricesBoard';
import { Signals } from '../components/insights/Signals';
import { Together } from '../components/insights/Together';
import { WorldMarkets } from '../components/insights/WorldMarkets';
import { CompaniesTable } from '../components/insights/CompaniesTable';
import { WorldCurrencies } from '../components/insights/WorldCurrencies';
import { DollarStrengthCards } from '../components/insights/world-currencies/DollarStrength';
import { useInsightsCopy } from '../components/insights/useInsightsCopy';
import {
  PINNED_STORAGE_KEY,
  SIGNALS_ENABLED,
  definitionFor,
  formatPinnedStorage,
  parsePinnedIds,
} from '../components/insights/config';
import { InsightsHeader } from './insights-sections/InsightsHeader';
import {
  InsightsErrorState,
  InsightsLoadingState,
  InsightsPrivateState,
  ReadingProgress,
  StaleCacheNotice,
  type LoadState,
} from './insights-sections/InsightsStatusBlocks';
import { SectionLane } from './insights-sections/SectionLane';
import {
  useNarrative,
  useNarrativePreview,
  useWorldCurrenciesSection,
  useWorldMarketsSection,
  useWorldSectionIndicators,
} from './insights-sections/world-feeds';
import { useInsightsToolsNav } from './insights-sections/useInsightsToolsNav';
import { NarrativeBlock } from '../components/insights/NarrativeBlock';
import { InTheNews } from '../components/insights/InTheNews';

/**
 * The calendar's event-kind → indicator mapping (H6: link events to the
 * indicators they move). Calendar ids are dated (fomc-2026-10, …) — the
 * event KIND is the stable join key.
 */
const EVENT_TARGETS: Readonly<Record<string, IndicatorId | undefined>> = {
  rba: 'rba-cash-rate',
  'abs-cpi': 'au-cpi',
  // Step-2 add-list §D: the two new jobs kinds link to their cards
  // (abs-cpi keeps no us-cpi target — the CPI events target the CPI cards).
  'abs-jobs': 'au-unemployment',
  fed: 'fed-target',
  // Fix spec C-07 (2026-10-14): the ECB decision links to the euro policy
  // rate card.
  ecb: 'ecb-dfr',
  'us-cpi': 'us-cpi-yoy',
  'us-jobs': 'us-unemployment',
};

export function Insights() {
  const { t, locale } = useI18n();
  const { copy, numberLocale } = useInsightsCopy();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  // I10: the personal watchlist — pinned items render in their own strip
  // inside the lane. Pins persist across visits (localStorage) and sync
  // across tabs (the storage event).
  const [pinned, setPinned] = useState<ReadonlySet<IndicatorId>>(() => {
    try {
      return new Set(parsePinnedIds(window.localStorage.getItem(PINNED_STORAGE_KEY) ?? ''));
    } catch {
      return new Set(); // storage unavailable (privacy mode) — session-only
    }
  });
  // R7b/R25: the collapsible sections — the route bumps their tokens when a
  // pill/hash/hero link targets them (R19: selecting a pill expands).
  const [togetherToken, setTogetherToken] = useState(0);
  const [signalsToken, setSignalsToken] = useState(0);
  const [aboutToken, setAboutToken] = useState(0);
  // R7: ids explicitly opened (deep link, tile click) stay visible even when
  // their group is collapsed.
  const [revealIds, setRevealIds] = useState<ReadonlySet<IndicatorId>>(new Set());
  // F5: the details panel state — the id + the control that opened it
  // (focus returns there on close). Deep links open it too.
  const [panel, setPanel] = useState<{ id: IndicatorId; opener: HTMLElement | null } | null>(null);
  const hadCache = useRef(false);
  const shareLinkHandled = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const cached = readCachedSnapshot();
    // R10-5: the synchronous setState hydrates from localStorage cache
    // (or falls back to 'loading') before the async fetch — the
    // documented "initialize from external store on mount" pattern.
    // The empty dep array is intentional: this runs once on mount.
    /* eslint-disable react-hooks/set-state-in-effect -- mount-time cache hydration (external store → local state) */
    if (cached) {
      hadCache.current = true;
      setState({ kind: 'ready', snapshot: cached, fromCache: true });
    } else {
      setState({ kind: 'loading' });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchInsightsSnapshot(controller.signal)
      .then((snapshot) => {
        setState({ kind: 'ready', snapshot, fromCache: false });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        // Step 3 §2.2 AC-03 (runbook Phase 3): the gate's 401 flips the page
        // to the neutral private state — even over a cached 'ready' (the
        // session has expired; nothing may read as current).
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setState({ kind: 'private' });
          return;
        }
        const message =
          err instanceof ApiError && err.kind === 'rates' ? err.message : err instanceof Error ? err.message : 'Insights feed unavailable';
        setState((prev) => (prev.kind === 'ready' ? prev : { kind: 'error', message, cached }));
      });
    return () => controller.abort();
  }, [retryToken]);

  // The two world-section feeds + the hero's section indicators — moved
  // verbatim to insights-sections/world-feeds.ts (Phase 3-e).
  // OWNER DIRECTIVE (2026-10-20, post-v3-merge): the PREVIOUS hero is
  // restored, so the raised-signal bullets (marketsAlert/fxAlert) and the
  // two world-section indicators return to the Global card — the v3-era
  // omission ("the sections carry their own verdict lines") is retired
  // with the v3 hero. The v3 DATA layer (new sources, connections,
  // reliability) feeds them unchanged.
  // PUBLIC MODE (2026-10-19, AC-08/LR-02 → 2026-10-18b owner directive,
  // kept through the v3 merge): each world board's public visibility is
  // the GENERATED overrides file's call. The markets board (the owner's
  // own EODHD key backs it) renders and its feed fetches; the fx board
  // (no owner directive) stays licence-hidden — no render, no fetch — and
  // the US-shares AUD view, which needs BOTH feeds, rides the stricter
  // of the two.
  const publicMarketsBoard = !(siteModeOverrides.hiddenBoards as readonly string[]).includes('markets');
  const publicFxBoard = !(siteModeOverrides.hiddenBoards as readonly string[]).includes('fx');
  const isPublicProjection = state.kind === 'ready' && state.snapshot.displayMode === 'public';
  const marketsFeedEnabled = !isPublicProjection || publicMarketsBoard;
  const fxFeedEnabled = !isPublicProjection || publicFxBoard;
  const { marketsState, marketsAlert, jumpToMarkets, downloadMarketsCsv } = useWorldMarketsSection(copy, marketsFeedEnabled);
  const { fxState, fxAlert, jumpToFxCurrencies, downloadFxCsv } = useWorldCurrenciesSection(copy, fxFeedEnabled);
  const sectionIndicators = useWorldSectionIndicators(marketsState, fxState, copy, jumpToMarkets, jumpToFxCurrencies);

  // Layer-2 narrator (M5, spec §11): the narrative document feed + the
  // staged-rollout visibility gate. The hook fetches the doc unconditionally
  // (the texts must be ready when the owner flips `NARRATOR_VISIBLE=true`);
  // the gate decides whether to RENDER. The preview marker works regardless
  // of `visible` (the owner's "read real text for a week before flipping"
  // path). D-34 + D-39.
  const narrativeDoc = useNarrative();
  const narrativePreview = useNarrativePreview();
  const narrativeVisible = narrativeDoc !== null && (narrativeDoc.visible || narrativePreview);

  const togglePin = useCallback((id: IndicatorId, next: boolean): void => {
    setPinned((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(PINNED_STORAGE_KEY, formatPinnedStorage([...pinned]));
    } catch {
      // Quota / privacy mode — the pins still work for this session.
    }
  }, [pinned]);
  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key !== PINNED_STORAGE_KEY) return;
      setPinned(new Set(parsePinnedIds(e.newValue ?? '')));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // F5: open the details panel (records the opener for focus return).
  const openDetails = useCallback((id: IndicatorId, opener: HTMLElement | null) => {
    setPanel({ id, opener });
  }, []);
  const closePanel = useCallback(() => setPanel(null), []);

  /** "Go look at this indicator" (hero tiles, rows, prices, share links):
   * reveal the card (R7), scroll it into view AND open its panel (the opener
   * carries back into the panel for focus-return on close). */
  const focusCard = useCallback(
    (id: IndicatorId, opener?: HTMLElement | null) => {
      setRevealIds((prev) => {
        if (prev.has(id)) return prev;
        const s = new Set(prev);
        s.add(id);
        return s;
      });
      setPanel({ id, opener: opener ?? null });
      requestAnimationFrame(() => {
        const el = document.getElementById(`insights-card-${id}`);
        if (el) {
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        }
      });
    },
    [],
  );

  // F5: deep links ('#/insights?card=<id>') open the panel once per mount.
  useEffect(() => {
    if (state.kind !== 'ready' || shareLinkHandled.current) return;
    shareLinkHandled.current = true;
    const cardParam = routeQuery().get('card');
    if (!cardParam) return;
    let id: IndicatorId;
    try {
      id = definitionFor(cardParam as IndicatorId).id;
    } catch {
      return; // unknown id — ignore the param
    }
    if (!state.snapshot.readings.some((r) => r.id === id)) return;
    // R10-5: focusCard opens the details panel for the deep-linked card.
    // The setState is the documented response to the URL param (an
    // external input) — the effect runs once per mount (the
    // shareLinkHandled ref guards against re-firing).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link card focus: URL param → local panel state
    focusCard(id);
  }, [state, focusCard]);

  // The Tools disclosure + the "/" and j/k shortcuts + the I13 filter
  // model — moved verbatim to insights-sections/useInsightsToolsNav.ts
  // (Phase 3-e).
  const {
    toolsOpen,
    setToolsOpen,
    statusFilter,
    setStatusFilter,
    query,
    setQuery,
    visibleIds,
    searchActive,
    searchInputRef,
    toolsButtonRef,
  } = useInsightsToolsNav({ state, copy, focusCard });

  const jumpAbout = useCallback(() => {
    setAboutToken((n) => n + 1);
    // Round 42: the hero's how-tip link now also SCROLLS to the section —
    // hidden behind a tip, a bare expand below the fold read as a dead
    // click (the same roast round 33 answered for the section jump).
    const el = document.getElementById('insights-about');
    if (el) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }, []);

  const jumpToSection = useCallback((section: InsightsSection) => {
    // Round 33: BOTH dedicated sections render stacked mid-page — a jump
    // SCROLLS to the region's own heading (the old click only flipped the
    // lane switch, which read as a dead click — owner round 33). The
    // section anchors are static now: insights-section-global / -australia.
    const el = document.getElementById(`insights-section-${section}`);
    if (el) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }, []);

  // I10: items rendering inside the lanes — visible under the filter and
  // not pinned (pinned items render in the watchlist strip).
  const sectionIds = useMemo<ReadonlySet<IndicatorId> | null>(() => {
    if (state.kind !== 'ready') return null;
    if (visibleIds === null && pinned.size === 0) return null;
    const s = new Set<IndicatorId>();
    for (const r of state.snapshot.readings) {
      if (pinned.has(r.id)) continue;
      if (visibleIds !== null && !visibleIds.has(r.id)) continue;
      s.add(r.id);
    }
    return s;
  }, [state, visibleIds, pinned]);

  const pinnedReadings = useMemo<readonly IndicatorReading[]>(() => {
    if (state.kind !== 'ready') return [];
    return state.snapshot.readings.filter((r) => pinned.has(r.id) && (visibleIds === null || visibleIds.has(r.id)));
  }, [state, pinned, visibleIds]);

  // P1/R19: the sticky section nav — the Signals pill joins the row (the
  // built page had the section but no pill) and every pill expands its
  // section if collapsed (R7b/R25).
  const jumpTargets = useMemo<JumpTarget[]>(() => {
    const targets: JumpTarget[] = [
      { id: 'insights-hero', label: copy.ui.navStatus },
      { id: 'insights-prices', label: copy.ui.navPrices },
      { id: 'insights-together', label: copy.ui.navTogether },
    ];
    if (SIGNALS_ENABLED) targets.push({ id: 'insights-signals', label: copy.signals.title });
    targets.push(
      { id: 'insights-section-lane', label: copy.ui.navIndicators },
      { id: 'insights-about', label: copy.ui.navAbout },
    );
    return targets;
  }, [copy]);

  const onWillNavigate = useCallback((id: string) => {
    if (id === 'insights-together') setTogetherToken((n) => n + 1);
    else if (id === 'insights-signals') setSignalsToken((n) => n + 1);
    else if (id === 'insights-about') setAboutToken((n) => n + 1);
  }, []);

  const panelReading = useMemo(() => {
    if (!panel || state.kind !== 'ready') return null;
    return state.snapshot.readings.find((r) => r.id === panel.id) ?? null;
  }, [panel, state]);

  // The panel's companion data (2026-10-26c): the full snapshot's
  // readings, empty until loaded — the price sections read other assets
  // from it (gold's A$ line, Bitcoin's metal ratios).
  const snapshotReadings = useMemo(
    () => (state.kind === 'ready' ? state.snapshot.readings : []),
    [state],
  );

  return (
    // UI-fidelity round (2026-10-19, the owner's correction brief §3
    // "Content width and spacing"): the old xl:max-w-[1440px] cap left
    // 80–160px dead margins beside the two regional cards on 1600–1760px
    // screens — the brief asks for ~95% of the available viewport with
    // 24–32px desktop side gutters. lg uses calc(100% − 40px) (20px outer
    // gutter + the 16px px-8 padding each side, spec §11's 1024–1199
    // "reduce outer gutter" band); xl is min(calc(100% − 56px), 1840px)
    // — 28px gutters (1600 → 1544px / 96.5%, 1760 → 1704px / 96.8%) with
    // the absolute 1840px ceiling folded into the SAME rule (a separate
    // 2xl: class would win the cascade at ≥1536px and flatten the calc,
    // as the first build proved) so ultra-wide desktops keep a sane
    // reading measure. Tablet (md:max-w-3xl) and the phone column are
    // untouched.
    <div className="insights-page mx-auto w-full max-w-[480px] px-4 py-5 sm:max-w-2xl md:max-w-3xl lg:max-w-[calc(100%-40px)] lg:px-8 xl:max-w-[min(calc(100%-56px),1840px)]">
      <ReadingProgress label={copy.ui.progressLabel} />
      <InsightsHeader
        t={t}
        copy={copy}
        locale={locale}
        numberLocale={numberLocale}
        state={state}
        toolsOpen={toolsOpen}
        setToolsOpen={setToolsOpen}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        query={query}
        setQuery={setQuery}
        searchInputRef={searchInputRef}
        toolsButtonRef={toolsButtonRef}
        marketsState={marketsState}
        downloadMarketsCsv={downloadMarketsCsv}
        fxState={fxState}
        downloadFxCsv={downloadFxCsv}
        onJumpAbout={jumpAbout}
      />

      {/* Round 33 (owner): the Global | Australia switch is GONE — it sat
       * above the fold doing invisible work (and read as broken). Both
       * dedicated sections render stacked mid-page instead, each with its
       * own big icon; the hero's "View section" links scroll to them. */}

      {state.kind === 'loading' ? <InsightsLoadingState /> : null}

      {state.kind === 'private' ? <InsightsPrivateState copy={copy} /> : null}

      {state.kind === 'error' ? (
        <InsightsErrorState copy={copy} message={state.message} onRetry={() => setRetryToken((n) => n + 1)} />
      ) : null}

      {state.kind === 'ready' ? (
        <div className="flex flex-col gap-7">
          {state.fromCache ? (
            <StaleCacheNotice copy={copy} locale={locale} generatedAt={state.snapshot.generatedAt} />
          ) : null}

          {/* The hero (R1–R4) — Global first, both verdicts above the fold.
           * OWNER DIRECTIVE (2026-10-20): the PREVIOUS (editorial) hero is
           * restored — the v3 UI-01..UI-14 card retired; the biggest-move
           * card (R4) returns here and the raised world-section bullets +
           * section indicators ride the Global card again. The v3 data
           * layer (readings, state words, delayed tier) feeds it unchanged. */}
          <div id="insights-hero" className="scroll-mt-24">
            <HeroBlock
              readings={state.snapshot.readings}
              copy={copy}
              numberLocale={numberLocale}
              onJumpSection={jumpToSection}
              onFocusCard={focusCard}
              marketsAlert={marketsAlert}
              onJumpMarkets={jumpToMarkets}
              fxAlert={fxAlert}
              onJumpFx={jumpToFxCurrencies}
              sectionIndicators={sectionIndicators}
            />
          </div>

          {/* Layer-2 narrator (M5, spec §11): the overall plain-language
           * narrative, anchored to the page's existing top verdict(s). The
           * gate is the staged rollout: `?narrative=preview` OR
           * `NARRATOR_VISIBLE=true` (D-34 + D-39). When the doc is absent
           * or the gate is closed, NarrativeBlock returns null and the
           * page renders exactly as before. */}
          {narrativeVisible ? (
            <NarrativeBlock
              unit={narrativeDoc?.overall}
              copy={copy}
              locale={locale}
            />
          ) : null}
          {narrativeVisible && narrativeDoc?.overall.news ? (
            <InTheNews
              news={narrativeDoc.overall.news}
              copy={copy}
              locale={locale}
            />
          ) : null}

          {/* 2026-10-21 owner round: the ContinueStrip (the one-line
           * «ادامهٔ صفحه» chevron row that named the sections below the
           * hero) is RETIRED — the sticky JumpNav pills one breath below
           * it already carry the same labels, the same expand-then-scroll
           * navigation and the scroll-spy highlight, so the quiet strip
           * read as a redundant second set of the same buttons (the
           * owner's own words: "it's redundant because already another
           * set have this same buttons"). */}

          {/* P1/R19: the sticky section pills — 2026-10-29 owner round: the
           * pills grew and WRAP, and the TOP-5 CHANGES strip rides inside
           * the sticky bar under them (the page's fastest "what is moving"
           * answer, never scrolled away). */}
          <JumpNav targets={jumpTargets} copy={copy} onWillNavigate={onWillNavigate}>
            <TopMoversStrip
              readings={state.snapshot.readings}
              copy={copy}
              numberLocale={numberLocale}
              onFocusCard={focusCard}
            />
          </JumpNav>

          {/* R10: the prices strip — four identical tiles. Gold Program S2:
           * the snapshot's compact goldSummary rides down to the board so
           * the two gold panels beside the gold-usd tile render the
           * ingest's stamp (they derive it client-side when absent). */}
          <PricesBoard
            readings={state.snapshot.readings}
            goldSummary={state.snapshot.goldSummary}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
          />

          {/* World stock markets (insights-world-markets-spec.md §6.2):
           * right after the commodity prices — both answer "what is moving";
           * never above the verdict or alerts. Self-contained feed: its own
           * loading/empty states, never an error surface for the page.
           * PUBLIC MODE: rides the generated overrides file — the markets
           * board is PUBLIC since the 2026-10-18b owner directive (the
           * owner's own EODHD key backs it); the fx twin below stays
           * licence-hidden. */}
          {marketsFeedEnabled && (
            <WorldMarkets
              state={marketsState}
              copy={copy}
              locale={locale}
              numberLocale={numberLocale}
              narrativeUnit={narrativeDoc?.sections['world-markets']}
              narrativeVisible={narrativeVisible}
            />
          )}

          {/* R10-3 (2026-10-28) — the global companies table behind a
           * feature flag (OFF by default). The owner's R9-09 directive
           * was BLOCKED on the EODHD free-plan quota (20 calls/day
           * total — the markets board already consumes ~16–18). This
           * component ships the table PRE-BUILT: the UI renders the
           * empty-state panel below the markets tiles, the cron rung
           * is NOT WIRED, no live calls fire. The flip procedure (one
           * line in apps/web/src/components/insights/config/companies.ts
           * + the future cron rung) lives in ROUND10_REPORT.md R10-3.
           * Bilingual EN + FA (RTL-safe, Latin names + exchange codes
           * stay Latin in both locales — proper nouns, RULES.md §5). */}
          <CompaniesTable copy={copy} locale={locale} />

          {/* R9-01 (2026-10-27 owner round): the US shares in AUD box is
           * RETIRED entirely — the owner asked for the «US shares to
           * Australian dollars» section to be removed from the page. It
           * answered a question the prices board and the world sections now
           * carry between them; no data or copy survives it (the usAud*
           * dictionary entries and their manifest fingerprints went with
           * it). The §7.1 notes box was already gone (owner, 2026-10-20). */}

          {/* World currencies (insights-world-currencies-spec.md §9.2):
           * right after the world stock markets — the two sections explain
           * each other, and each verdict names what it measures (§9.10), so
           * a calm stock section beside a warning currency pattern can never
           * read as one contradiction. Self-contained feed: its own
           * loading/empty states, never an error surface for the page.
           * PUBLIC MODE: licence-hidden entirely (no render, no fetch) —
           * the fx board carries no owner directive.
           *
           * R9-04 (2026-10-27 owner round — "merge 'Is the dollar strong?'
           * into the currencies section"): the dollar-strength question
           * group's six cards render INSIDE this container (composed from
           * the insights snapshot, not the fx feed, so they ride every
           * section state); the standalone lane group is retired
           * (LANE_GROUP_ORDER). The gauge computation is untouched. */}
          {fxFeedEnabled && (
            <WorldCurrencies state={fxState} copy={copy} locale={locale} numberLocale={numberLocale}
              dollarStrength={
                <DollarStrengthCards
                  snapshot={state.snapshot}
                  copy={copy}
                  numberLocale={numberLocale}
                  onOpenDetails={openDetails}
                  pinned={pinned}
                  renderableIds={sectionIds}
                />
              }
              narrativeUnit={narrativeDoc?.sections['world-currencies']}
              narrativeVisible={narrativeVisible}
            />
          )}

          {/* R11: "What it means for my money" — 2026-10-29 owner round
           * ("because it's related to Aussie living, relocate it to the
           * Australia section"): the panel MOVED into the Australia
           * section (SectionLane's australiaSlot) with its new AU-scope
           * notice; its old standalone spot here is retired. */}

          {/* T1 + R7b: the "Together" connection cards — collapsed default. */}
          <Together
            readings={state.snapshot.readings}
            copy={copy}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
            expandToken={togetherToken}
          />

          {/* S1–S3 + R26: "What the signals say" — the merged card, collapsed
           * default. */}
          {SIGNALS_ENABLED ? (
            <section id="insights-signals-wrap" className="scroll-mt-24">
              <Signals
                readings={state.snapshot.readings}
                copy={copy}
                numberLocale={numberLocale}
                expandToken={signalsToken}
              />
            </section>
          ) : null}

          {/* L1–L4 + R7 → round 33 (owner): both dedicated sections render
           * stacked — Global first (D7), then Australia — each wearing its
           * own BIG icon (96px mobile / 128×128 desktop) beside its heading:
           * the big region artwork's one rightful home (the hero keeps a
           * quiet 48/64 mark). The old switcher is gone. */}
          <SectionLane
            snapshot={state.snapshot}
            copy={copy}
            numberLocale={numberLocale}
            visibleIds={visibleIds}
            pinnedReadings={pinnedReadings}
            openDetails={openDetails}
            pinned={pinned}
            sectionIds={sectionIds}
            revealIds={revealIds}
            searchActive={searchActive}
            setStatusFilter={setStatusFilter}
            setQuery={setQuery}
            narrativeBySection={narrativeDoc?.sections}
            narrativeVisible={narrativeVisible}
            locale={locale}
            australiaSlot={
              <MoneyPanel
                readings={state.snapshot.readings}
                copy={copy}
                numberLocale={numberLocale}
                onFocusCard={focusCard}
              />
            }
          />

          {/* R16: the calendar — once, below the indicators, before About. */}
          <NextUpStrip
            events={state.snapshot.calendar}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
            eventTargets={EVENT_TARGETS}
          />

          {/* R25: "About this data" — quiet and collapsible. Fix spec A-08:
           * the run status (snapshot time + time zone, failed sources, stale
           * cards) renders from the page's own snapshot + /api/insights/status.
           * v3 UI-49 + M-7 (PH6-C): the per-source table (one row per
           * provider, from the audit sidecar), the tappable stale/unavailable
           * card list, the rule-version line and the contact line; the
           * listed cards open via the route's focusCard. */}
          <AboutTheData
            copy={copy}
            expandToken={aboutToken}
            snapshot={state.snapshot}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
          />
        </div>
      ) : null}

      {/* F5: the details panel (side sheet / bottom sheet). 2026-10-26c:
          the asset cards' «جزئیات بیشتر» sections render inside it. */}
      {panelReading && panel ? (
        <DetailsPanel
          reading={panelReading}
          readings={snapshotReadings}
          copy={copy}
          locale={locale}
          numberLocale={numberLocale}
          onClose={closePanel}
          onPinChange={togglePin}
          pinned={pinned.has(panelReading.id)}
          returnFocusTo={panel.opener}
        />
      ) : null}
    </div>
  );
}
