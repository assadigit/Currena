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
 *   → indicators: visible Global|Australia switch (Global default, R1),
 *     signals-first groups (R7), rows without truncation (R8)
 *   → "Next up" calendar (once, below the indicators, R16)
 *   → footer: "About this data" (quiet, collapsible, R25)
 *
 * Data: GET /api/insights (zod-validated in lib/insights.ts), last-good
 * localStorage snapshot first for instant/offline paint, fresh fetch
 * revalidating behind it. Deep links ('#/insights?card=<id>') open the
 * details panel for that indicator.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IndicatorId, InsightsSnapshot, InsightsSection, IndicatorGroupId } from '@currena/core';
import type { IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatDateWords, formatNumber, formatRelative } from '@currena/core';
import { Search, TriangleAlert } from 'lucide-react';
import { interpolate } from '../i18n';
import { useI18n } from '../lib/locale';
import { routeQuery } from '../router';
import { ApiError, fetchInsightsSnapshot, readCachedSnapshot } from '../lib/insights';
import { AboutTheData } from '../components/insights/AboutTheData';
import { AlertCard } from '../components/insights/AlertCard';
import { CompactRow } from '../components/insights/CompactRow';
import { DetailsPanel } from '../components/insights/DetailsPanel';
import { HeroBlock } from '../components/insights/HeroBlock';
import { JumpNav, type JumpTarget } from '../components/insights/JumpNav';
import { LaneSwitch } from '../components/insights/LaneSwitch';
import { MoneyPanel } from '../components/insights/MoneyPanel';
import { NextUpStrip } from '../components/insights/NextUpStrip';
import { PricesBoard } from '../components/insights/PricesBoard';
import { Signals } from '../components/insights/Signals';
import { Together } from '../components/insights/Together';
import { ToolsMenu } from '../components/insights/ToolsMenu';
import { Skeleton } from '../components/ui';
import { Button } from '../components/ui';
import { useInsightsCopy } from '../components/insights/useInsightsCopy';
import {
  GROUP_ORDER,
  PINNED_STORAGE_KEY,
  SIGNALS_ENABLED,
  definitionFor,
  definitionsForGroup,
  filterVisibleIds,
  formatPinnedStorage,
  groupVisibility,
  parsePinnedIds,
  readStoredLane,
  statusCounts,
  tierIsCard,
  tierOf,
  type StatusFilter,
} from '../components/insights/config';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; snapshot: InsightsSnapshot; fromCache: boolean }
  | { kind: 'error'; message: string; cached: InsightsSnapshot | null };

/**
 * The calendar's event-kind → indicator mapping (H6: link events to the
 * indicators they move). Calendar ids are dated (fomc-2026-10, …) — the
 * event KIND is the stable join key.
 */
const EVENT_TARGETS: Readonly<Record<string, IndicatorId | undefined>> = {
  rba: 'rba-cash-rate',
  'abs-cpi': 'au-cpi',
  fed: 'fed-target',
};

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2" aria-hidden="true">
      <Skeleton className="h-44 rounded-[18px]" />
      <Skeleton className="h-44 rounded-[18px]" />
    </div>
  );
}

/**
 * L2/L3/R5/R7: one question group — the question heading, the gauge reading
 * (step + word + count), the one-line answer, then the items: needs-attention
 * AND unusual cards first (L3, extremity-sorted), then normal rows — with
 * the R7 signals-first collapse: everything not in the first GROUP_MIN_VISIBLE
 * items hides behind "See all {n} indicators" (needs-attention is never
 * hidden). Deep links, tile clicks and Tools search reveal hidden items
 * (revealIds / searchActive).
 */
function QuestionGroup({
  group,
  section,
  snapshot,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  renderableIds,
  revealIds,
  searchActive,
}: {
  group: IndicatorGroupId;
  section: InsightsSection;
  snapshot: InsightsSnapshot;
  copy: ReturnType<typeof useInsightsCopy>['copy'];
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: ReadonlySet<IndicatorId>;
  renderableIds: ReadonlySet<IndicatorId> | null;
  /** R7: ids explicitly opened (deep link, tile click) — always visible. */
  revealIds: ReadonlySet<IndicatorId>;
  /** R7: while the Tools search is active, nothing collapses. */
  searchActive: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const readings = useMemo(() => {
    const defs = definitionsForGroup(section, group);
    return snapshot.readings.filter((r) => defs.some((d) => d.id === r.id) && (renderableIds === null || renderableIds.has(r.id)));
  }, [snapshot, section, group, renderableIds]);

  const gauge = useMemo(() => {
    return gaugesForSectionCached(section, snapshot.readings).find((g) => g.gauge === group);
  }, [section, snapshot]);

  if (readings.length === 0) return null;

  const question = copy.groups[group];
  const answer = copy.gaugeAnswers[group];
  // L2: the gauge reading (this group IS a gauge).
  const step = gauge?.step ?? 0;
  const stepWord =
    step === 0 ? copy.ui.gaugeNoReading : step === 1 ? copy.label.relaxed : step === 2 ? copy.label.cautious : step === 3 ? copy.label.stressed : copy.label.alarmed;
  const countText = interpolate(copy.ui.inAlert, {
    warnings: num(gauge?.warningCount ?? 0, numberLocale),
    voting: num(gauge?.votingCount ?? 0, numberLocale),
  });

  // R5 ordering: needs-attention cards first (extremity-sorted), unusual
  // cards next, then the compact rows (normal, context, stale) in snapshot
  // order — one tier per card, the tier decides the layout.
  const sorted = [...readings].sort((a, b) => {
    const rank = (r: IndicatorReading): number => {
      const tier = tierOf(r);
      return tier === 'needs-attention' ? 0 : tier === 'unusual' ? 1 : tier === 'normal' || tier === 'context' ? 2 : 3;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) {
      // Both needs-attention: deeper into the watched tail first.
      const pa = a.percentile10y ?? 0;
      const pb = b.percentile10y ?? 0;
      return pb - pa;
    }
    return 0; // stable — snapshot order within tiers
  });

  // R7: the signals-first split — needs-attention + unusual always visible,
  // normal rows fill up to the minimum, the rest collapse behind "See all".
  const visibility = groupVisibility(sorted);
  const hidden = visibility.collapsed.filter(
    (r) => !revealIds.has(r.id) && !pinned.has(r.id),
  );
  const hiddenIds = new Set(hidden.map((r) => r.id));
  const collapsed = !searchActive && !showAll && hidden.length > 0;
  const visibleList = collapsed ? sorted.filter((r) => !hiddenIds.has(r.id)) : sorted;
  const cardList = visibleList.filter((r) => tierIsCard(tierOf(r)));
  const rowList = visibleList.filter((r) => !tierIsCard(tierOf(r)));

  return (
    <section id={`insights-group-${group}`} aria-labelledby={`insights-group-${group}-title`} className="scroll-mt-24">
      <header className="mb-2.5">
        <h3 id={`insights-group-${group}-title`} className="m-0 text-[var(--type-label)] font-extrabold text-[var(--color-text-primary)]">
          {question}
        </h3>
        <p className="m-0 mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[var(--type-caption)] text-[var(--color-text-secondary)]">
          {/* L2: the gauge reading + count. */}
          <span
            className="verdict-meter !h-1.5 max-w-[120px]"
            role="img"
            aria-label={interpolate(copy.ui.gaugeStepAria, { question, label: stepWord, step: num(step, numberLocale) })}
          >
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`verdict-meter-seg ${step >= i ? `on-${i}` : ''}`} />
            ))}
          </span>
          <span className="font-bold text-[var(--color-text-primary)]">{stepWord}</span>
          <span className="font-semibold">{countText}</span>
          {/* L2 answer: no min-w-0 — the flex item keeps its min-content width
           * (the longest word) so the flex-wrap row moves it to its own line on
           * narrow phones instead of squeezing it below word width, which bled
           * ~50px of horizontal scroll onto the whole page at 375px (I18). */}
          <span className="flex-1">{answer}</span>
        </p>
      </header>
      {/* R5/R7: needs-attention AND unusual cards in a responsive auto-fit
       * grid (never stretching neighbours). */}
      {cardList.length > 0 ? (
        <div className="mb-2 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-2.5">
          {cardList.map((r) => (
            <AlertCard
              key={r.id}
              reading={r}
              copy={copy}
              numberLocale={numberLocale}
              onOpenDetails={onOpenDetails}
              pinned={pinned.has(r.id)}
            />
          ))}
        </div>
      ) : null}
      {rowList.length > 0 ? (
        <div className="grid grid-cols-1 items-start gap-1.5 lg:grid-cols-2">
          {rowList.map((r) => (
            <CompactRow
              key={r.id}
              reading={r}
              copy={copy}
              numberLocale={numberLocale}
              onOpenDetails={onOpenDetails}
              pinned={pinned.has(r.id)}
              showMixedTag={r.id === 'gold-silver'}
            />
          ))}
        </div>
      ) : null}
      {/* R7: the "See all {n} indicators" collapse — per session state. */}
      {collapsed ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="insights-focusable mt-2 inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-currena-blue/40 bg-currena-blue/15 px-5 text-[var(--type-caption)] font-bold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/25"
        >
          {interpolate(copy.ui.seeAll, { n: num(hidden.length, numberLocale) })}
        </button>
      ) : null}
      {!collapsed && showAll && hidden.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="insights-focusable mt-2 inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-4 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)] underline decoration-[var(--color-border)] underline-offset-4 transition-colors hover:text-[var(--color-status-context)]"
        >
          {copy.ui.showFewer}
        </button>
      ) : null}
    </section>
  );
}

/** Cached per-call gauges helper (the package function is pure). */
import { gaugesForSection } from '@currena/insights';
function gaugesForSectionCached(
  section: InsightsSection,
  readings: readonly IndicatorReading[],
) {
  return gaugesForSection(section, readings);
}

/** The I10 watchlist strip (pinned items, snapshot order) — inside the lane. */
function PinnedSection({
  readings,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
}: {
  readings: readonly IndicatorReading[];
  copy: ReturnType<typeof useInsightsCopy>['copy'];
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: ReadonlySet<IndicatorId>;
}) {
  const voting = readings.filter((r) => r.status === 'warning' || r.status === 'normal');
  const attention = voting.filter((r) => r.status === 'warning');
  return (
    <section id="insights-pinned" aria-labelledby="insights-pinned-title" className="scroll-mt-24">
      <header className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="insights-pinned-title" className="m-0 text-[var(--type-label)] font-extrabold text-[var(--color-text-primary)]">
          <span aria-hidden="true">★ </span>
          {copy.ui.pinnedTitle}
        </h2>
        {voting.length > 0 ? (
          <p className="m-0 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
            {interpolate(copy.ui.inAlert, {
              warnings: num(attention.length, numberLocale),
              voting: num(voting.length, numberLocale),
            })}
          </p>
        ) : null}
      </header>
      <div className="grid grid-cols-1 items-start gap-1.5 lg:grid-cols-2">
        {readings.map((r) => (
          <CompactRow
            key={r.id}
            reading={r}
            copy={copy}
            numberLocale={numberLocale}
            onOpenDetails={onOpenDetails}
            pinned={pinned.has(r.id)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * I10: a thin reading-progress bar pinned above the app header — on a page
 * this long, "how far through am I?" is orientation, not decoration.
 * rAF-throttled passive listeners; fills from the inline-start edge in
 * both directions; hidden on paper.
 */
function ReadingProgress({ label }: { label: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setPct(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0);
    };
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="no-print fixed inset-x-0 top-0 z-[1001] h-[3px]"
    >
      <div className="h-full bg-currena-blue" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Insights() {
  const { t, locale } = useI18n();
  const { copy, numberLocale } = useInsightsCopy();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  // I8/R15: the tier filter + search now live inside the Tools disclosure.
  const [toolsOpen, setToolsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
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
  // R1: the lane switch — remembered, GLOBAL default (D7), fail-open.
  const [lane, setLane] = useState<InsightsSection>(() => readStoredLane());
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const toolsButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const cached = readCachedSnapshot();
    if (cached) {
      hadCache.current = true;
      setState({ kind: 'ready', snapshot: cached, fromCache: true });
    } else {
      setState({ kind: 'loading' });
    }
    fetchInsightsSnapshot(controller.signal)
      .then((snapshot) => {
        setState({ kind: 'ready', snapshot, fromCache: false });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof ApiError && err.kind === 'rates' ? err.message : err instanceof Error ? err.message : 'Insights feed unavailable';
        setState((prev) => (prev.kind === 'ready' ? prev : { kind: 'error', message, cached }));
      });
    return () => controller.abort();
  }, [retryToken]);

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
    focusCard(id);
  }, [state, focusCard]);

  const jumpAbout = useCallback(() => {
    setAboutToken((n) => n + 1);
  }, []);

  const jumpToSection = useCallback((section: InsightsSection) => {
    // Jumping to a region's lane also selects that lane (R1 synergy).
    setLane(section);
    try {
      window.localStorage.setItem('currena.insights.lane.v1', section);
    } catch {
      /* session-only */
    }
  }, []);

  // I9/R15: "/" opens Tools and focuses the search (the old inline focus).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setToolsOpen(true);
      requestAnimationFrame(() => searchInputRef.current?.focus());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // I13: j/k walks the visible items (rows + cards, lane order).
  const visibleIds = useMemo(() => {
    if (state.kind !== 'ready') return null;
    return filterVisibleIds(state.snapshot.readings, { status: statusFilter, query }, (id) => ({
      name: copy.indicators[id].name,
      ticker: copy.indicators[id].ticker,
    }));
  }, [state, statusFilter, query, copy]);

  const lastNavIdRef = useRef<IndicatorId | null>(null);
  useEffect(() => {
    if (state.kind !== 'ready') return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.key !== 'j' && e.key !== 'k') || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)
      ) {
        return;
      }
      // Walk the CURRENT lane's items (prices-board ids ride along).
      const order: IndicatorId[] = state.snapshot.readings
        .map((r) => r.id)
        .filter((id) => (visibleIds === null || visibleIds.has(id)));
      if (order.length === 0) return;
      e.preventDefault();
      let anchor = lastNavIdRef.current !== null && order.includes(lastNavIdRef.current) ? order.indexOf(lastNavIdRef.current) : -1;
      if (anchor === -1) {
        for (let i = 0; i < order.length; i++) {
          const el = document.getElementById(`insights-card-${order[i]}`);
          if (el && el.getBoundingClientRect().bottom > 96) {
            anchor = i;
            break;
          }
        }
      }
      const next = e.key === 'j' ? Math.min(anchor + 1, order.length - 1) : Math.max(anchor - 1, 0);
      const id = order[next];
      if (id === undefined) return;
      lastNavIdRef.current = id;
      focusCard(id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state, visibleIds, focusCard]);

  // R15: the Tools counts describe ONLY the current lane (the old row
  // described the whole snapshot while one lane was on screen).
  const laneCounts = useMemo(() => {
    if (state.kind !== 'ready') return { all: 0, warning: 0, unusual: 0, normal: 0, context: 0 };
    const laneReadings = state.snapshot.readings.filter((r) => {
      const def = definitionFor(r.id);
      return def.section === lane;
    });
    return statusCounts(laneReadings);
  }, [state, lane]);

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

  // H4/R12: "Data as of {date}" — the unambiguous word-date (no seconds:
  // a daily snapshot) with the relative age beside it.
  const dataAsOfLine = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const iso = state.snapshot.generatedAt;
    const dateText = locale === 'fa' ? formatJalaliDate(iso, 'fa-IR') : formatDateWords(iso, 'en-US');
    return { date: dateText, tooltip: copy.ui.dataAsOfTooltip };
  }, [state, locale, copy.ui.dataAsOfTooltip]);

  const searchActive = statusFilter !== 'all' || query.trim() !== '';

  // Downloads (R15: they live in Tools now).
  const downloadCsv = useCallback(() => {
    if (state.kind !== 'ready') return;
    void import('../components/insights/insights-csv').then(({ buildInsightsCsv, insightsCsvFilename }) => {
      const csv = buildInsightsCsv(state.snapshot, copy);
      void import('../lib/download').then(({ downloadBlob }) => {
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), insightsCsvFilename(state.snapshot.generatedAt));
      });
    });
  }, [state, copy]);

  const downloadIcs = useCallback(() => {
    if (state.kind !== 'ready') return;
    void Promise.all([import('../components/insights/ics'), import('../lib/download')]).then(
      ([{ buildInsightsIcs }, { downloadBlob }]) => {
        const ics = buildInsightsIcs(state.snapshot.calendar, locale);
        downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'currena-insights-calendar.ics');
      },
    );
  }, [state, locale]);

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

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-5 sm:max-w-2xl md:max-w-3xl lg:max-w-6xl lg:px-8">
      <ReadingProgress label={copy.ui.progressLabel} />
      <header className="mb-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="m-0 text-2xl font-extrabold tracking-tight">{t('insights.title')}</h1>
            <p className="mt-1 mb-0 text-[var(--type-label)] text-[var(--color-text-secondary)]">{copy.ui.subtitle}</p>
            {dataAsOfLine ? (
              <p className="mt-1 mb-0 text-[var(--type-caption)] text-[var(--color-text-secondary)]" title={dataAsOfLine.tooltip}>
                <bdi>
                  {interpolate(copy.ui.dataAsOf, { date: dataAsOfLine.date })}
                  <span aria-hidden="true"> ⓘ</span>
                </bdi>
                <span className="sr-only"> — {dataAsOfLine.tooltip}</span>
              </p>
            ) : null}
          </div>
          {/* R15: ONE Tools disclosure — search, filter, shortcuts, .ics, CSV. */}
          {state.kind === 'ready' ? (
            <ToolsMenu
              copy={copy}
              numberLocale={numberLocale}
              open={toolsOpen}
              onOpenChange={setToolsOpen}
              counts={laneCounts}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              query={query}
              onQueryChange={setQuery}
              searchInputRef={searchInputRef}
              buttonRef={toolsButtonRef}
              onDownloadCsv={downloadCsv}
              onDownloadIcs={downloadIcs}
            />
          ) : null}
        </div>
      </header>

      {state.kind === 'loading' ? (
        <div className="flex flex-col gap-6" role="status" aria-live="polite">
          <SummarySkeleton />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2.5" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-28 rounded-[18px]" />
            ))}
          </div>
        </div>
      ) : null}

      {state.kind === 'error' ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-lg)] bg-currena-warning/10 px-5 py-6 text-center ring-1 ring-currena-warning/30">
            <p className="m-0 text-[var(--type-label)] font-bold text-[var(--color-status-alert)]">
              <TriangleAlert aria-hidden size={16} strokeWidth={1.9} className="me-1 inline-block align-[-3px]" />
              {copy.ui.loadError}
            </p>
            <p className="mt-1 mb-3 text-[var(--type-label)] text-[var(--color-text-secondary)]">{state.message}</p>
            <Button variant="cta" onClick={() => setRetryToken((n) => n + 1)}>
              {copy.ui.retry}
            </Button>
          </div>
        </div>
      ) : null}

      {state.kind === 'ready' ? (
        <div className="flex flex-col gap-7">
          {state.fromCache ? (
            <div
              role="status"
              className="slide-down flex items-center gap-3 rounded-[var(--radius-md)] border-s-4 border-currena-warning bg-currena-warning/15 px-4 py-3"
            >
              <TriangleAlert aria-hidden size={20} strokeWidth={1.9} className="shrink-0 text-[var(--color-status-alert)]" />
              <p className="m-0 text-[var(--type-label)] font-semibold text-[var(--color-status-alert)]">
                {interpolate(copy.ui.dataFrom, {
                  date: formatRelative(state.snapshot.generatedAt, locale === 'fa' ? 'fa-IR' : 'en-US'),
                })}
              </p>
            </div>
          ) : null}

          {/* The hero (R1–R4) — Global first, both verdicts above the fold. */}
          <div id="insights-hero" className="scroll-mt-24">
            <HeroBlock
              readings={state.snapshot.readings}
              changedThisWeek={state.snapshot.changedThisWeek}
              copy={copy}
              numberLocale={numberLocale}
              onJumpSection={jumpToSection}
              onJumpAbout={jumpAbout}
              onFocusCard={focusCard}
            />
          </div>

          {/* P1/R19: the sticky section pills. */}
          <JumpNav targets={jumpTargets} copy={copy} onWillNavigate={onWillNavigate} />

          {/* R10: the prices strip — four identical tiles. */}
          <PricesBoard
            readings={state.snapshot.readings}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
          />

          {/* R11: "What it means for my money" — at most 4 lines. */}
          <MoneyPanel
            readings={state.snapshot.readings}
            copy={copy}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
          />

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

          {/* L1–L4 + R7: the indicator lanes (Global default, R1). */}
          <div id="insights-section-lane" className="scroll-mt-24 flex flex-col gap-5">
            <LaneSwitch lane={lane} onLaneChange={setLane} copy={copy} />
            {visibleIds !== null && visibleIds.size === 0 ? (
              <div className="rounded-[var(--radius-lg)] bg-currena-soft/60 px-5 py-8 text-center ring-1 ring-[var(--color-border)]">
                <div
                  aria-hidden="true"
                  className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-currena-blue/10 text-[var(--color-status-context)]"
                >
                  <Search size={22} strokeWidth={1.8} />
                </div>
                <p className="mt-1 mb-0 text-[var(--type-label)] font-semibold text-[var(--color-text-primary)]">
                  {copy.ui.noMatches}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setQuery('');
                  }}
                  className="insights-focusable mt-3 inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-currena-blue/40 bg-currena-blue/15 px-5 text-[var(--type-caption)] font-bold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/25"
                >
                  {copy.ui.clearFilters}
                </button>
              </div>
            ) : (
              /* L1: only the chosen lane renders; the section anchor switches
               * with it so jump links stay honest. */
              <section
                id={`insights-section-${lane}`}
                aria-labelledby={`insights-section-${lane}-title`}
                className="scroll-mt-24 flex flex-col gap-6"
              >
                <h2 id={`insights-section-${lane}-title`} className="m-0 text-lg font-extrabold">
                  {copy.sections[lane]}
                </h2>
                {pinnedReadings.length > 0 ? (
                  <PinnedSection
                    readings={pinnedReadings}
                    copy={copy}
                    numberLocale={numberLocale}
                    onOpenDetails={openDetails}
                    pinned={pinned}
                  />
                ) : null}
                {GROUP_ORDER[lane].map((group: IndicatorGroupId) => (
                  <QuestionGroup
                    key={group}
                    group={group}
                    section={lane}
                    snapshot={state.snapshot}
                    copy={copy}
                    numberLocale={numberLocale}
                    onOpenDetails={openDetails}
                    pinned={pinned}
                    renderableIds={sectionIds}
                    revealIds={revealIds}
                    searchActive={searchActive}
                  />
                ))}
              </section>
            )}
          </div>

          {/* R16: the calendar — once, below the indicators, before About. */}
          <NextUpStrip
            events={state.snapshot.calendar}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
            eventTargets={EVENT_TARGETS}
          />

          {/* R25: "About this data" — quiet and collapsible. */}
          <AboutTheData copy={copy} expandToken={aboutToken} />
        </div>
      ) : null}

      {/* F5: the details panel (side sheet / bottom sheet). */}
      {panelReading && panel ? (
        <DetailsPanel
          reading={panelReading}
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
