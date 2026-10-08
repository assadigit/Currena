/**
 * Insights — the /insights page (Phase I4 → the I15 owner restructure,
 * 2026-10-08 specs).
 *
 * Structure top to bottom: title + "Data as of {date}" (H4 — no seconds,
 * honest daily snapshot) → hero (two verdict meters + big-mover callout +
 * the what-changed one-liner + the one disclaimer line, H1–H5 + N2) →
 * sticky section nav (P1: Status · Prices · Indicators · About) → next-up
 * strip (H6) → prices board (PB1–3) → the indicator LANES (L1: the
 * Global|Australia switch, remembered; L2: question groups with gauge
 * readings + one-line answers; L3: alert cards first, compact rows after;
 * L4: auto-fit grids, no stretch) → about the data + full disclaimer +
 * the required source notices (N1). Details open in the side panel /
 * bottom sheet (F5) — never in-grid.
 *
 * Data: GET /api/insights (zod-validated in lib/insights.ts), last-good
 * localStorage snapshot first for instant/offline paint, fresh fetch
 * revalidating behind it. Deep links ('#/insights?card=<id>') open the
 * details panel for that indicator.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import type { IndicatorId, InsightsSnapshot, InsightsSection, IndicatorGroupId } from '@currena/core';
import type { IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatDate, formatNumber, formatRelative } from '@currena/core';
import { interpolate } from '../i18n';
import { useI18n } from '../lib/locale';
import { routeQuery } from '../router';
import { ApiError, fetchInsightsSnapshot, readCachedSnapshot } from '../lib/insights';
import { AboutTheData } from '../components/insights/AboutTheData';
import { AlertCard } from '../components/insights/AlertCard';
import { CompactRow } from '../components/insights/CompactRow';
import { DetailsPanel } from '../components/insights/DetailsPanel';
import { FilterBar } from '../components/insights/FilterBar';
import { HeroBlock } from '../components/insights/HeroBlock';
import { JumpNav, type JumpTarget } from '../components/insights/JumpNav';
import { LaneSwitch } from '../components/insights/LaneSwitch';
import { NextUpStrip } from '../components/insights/NextUpStrip';
import { PricesBoard } from '../components/insights/PricesBoard';
import { Signals } from '../components/insights/Signals';
import { Together } from '../components/insights/Together';
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
  parsePinnedIds,
  readStoredLane,
  statusCounts,
  type StatusFilter,
} from '../components/insights/config';
import { gaugesForSection } from '@currena/insights';

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
 * L2: one question group — the question heading, the gauge reading (step +
 * word + count), the one-line answer, then the items: alert cards first
 * (L3, sorted by 10-year range height), normal rows after, context rows
 * last.
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
}: {
  group: IndicatorGroupId;
  section: InsightsSection;
  snapshot: InsightsSnapshot;
  copy: ReturnType<typeof useInsightsCopy>['copy'];
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: ReadonlySet<IndicatorId>;
  renderableIds: ReadonlySet<IndicatorId> | null;
}) {
  const readings = useMemo(() => {
    const defs = definitionsForGroup(section, group);
    return snapshot.readings.filter((r) => defs.some((d) => d.id === r.id) && (renderableIds === null || renderableIds.has(r.id)));
  }, [snapshot, section, group, renderableIds]);
  if (readings.length === 0) return null;

  const question = copy.groups[group];
  const answer = copy.gaugeAnswers[group];
  // L2: the gauge reading (this group IS a gauge).
  const gauge = gaugesForSection(section, snapshot.readings).find((g) => g.gauge === group);
  const step = gauge?.step ?? 0;
  const stepWord =
    step === 0 ? copy.ui.gaugeNoReading : step === 1 ? copy.label.relaxed : step === 2 ? copy.label.cautious : step === 3 ? copy.label.stressed : copy.label.alarmed;
  const countText = interpolate(copy.ui.inAlert, {
    warnings: num(gauge?.warningCount ?? 0, numberLocale),
    voting: num(gauge?.votingCount ?? 0, numberLocale),
  });

  // L3: alerts first as full cards (sorted by 10y-range height), normal
  // rows after, context rows last with the context chip.
  const sorted = [...readings].sort((a, b) => {
    const rank = (r: IndicatorReading): number =>
      r.status === 'warning' ? 0 : r.status === 'stale' || r.status === 'unavailable' || r.status === 'no-history' ? 2 : 1;
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) {
      // Both warnings: higher percentile first (H2's ordering rule).
      const pa = a.percentile10y ?? 0;
      const pb = b.percentile10y ?? 0;
      return pb - pa;
    }
    return 0; // stable enough — snapshot order within tiers
  });
  const alertReadings = sorted.filter((r) => r.status === 'warning');
  const otherReadings = sorted.filter((r) => r.status !== 'warning');

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
      {/* L3/L4: alert cards in a responsive auto-fit grid (never stretching
       * neighbours — the details are in the panel, so no in-grid expansion). */}
      {alertReadings.length > 0 ? (
        <div className="mb-2 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-2.5">
          {alertReadings.map((r) => (
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
      {otherReadings.length > 0 ? (
        <div className="grid grid-cols-1 items-start gap-1.5 lg:grid-cols-2">
          {otherReadings.map((r) => (
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
    </section>
  );
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
  const alerts = voting.filter((r) => r.status === 'warning');
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
              warnings: num(alerts.length, numberLocale),
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
  // I8/I15: card-grid filter (view tool only — counts and summaries keep
  // describing the full snapshot). Survives language switches (same mount).
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
  // I15 L1: the lane switch — remembered, Australia default, fail-open.
  const [lane, setLane] = useState<InsightsSection>(() => readStoredLane());
  // F5: the details panel state — the id + the control that opened it
  // (focus returns there on close). Deep links open it too.
  const [panel, setPanel] = useState<{ id: IndicatorId; opener: HTMLElement | null } | null>(null);
  const hadCache = useRef(false);
  const shareLinkHandled = useRef(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  /** "Go look at this indicator" (hero chips, rows, prices, share links):
   * scroll the item into view AND open its panel (the opener carries back
   * into the panel for focus-return on close). */
  const focusCard = useCallback(
    (id: IndicatorId, opener?: HTMLElement | null) => {
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
    const el = document.getElementById('insights-about');
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, []);

  const jumpToSection = useCallback((section: InsightsSection) => {
    // Jumping to a region's lane also selects that lane (L1 synergy).
    setLane(section);
    try {
      window.localStorage.setItem('currena.insights.lane.v1', section);
    } catch {
      /* session-only */
    }
    const el = document.getElementById(`insights-section-${section}`);
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, []);

  // I9: "/" focuses the filter search (desktop muscle memory).
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
      searchInputRef.current?.focus();
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

  const chipCounts = useMemo(() => {
    if (state.kind !== 'ready') return { all: 0, warning: 0, normal: 0, context: 0 };
    return statusCounts(state.snapshot.readings);
  }, [state]);

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

  // H4: "Data as of {date}" — date only (no seconds: a daily snapshot).
  const dataAsOfLine = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const iso = state.snapshot.generatedAt;
    const dateText = locale === 'fa' ? formatJalaliDate(iso, 'fa-IR') : formatDate(iso, 'en-US', { withTime: true });
    return { date: dateText, tooltip: copy.ui.dataAsOfTooltip };
  }, [state, locale, copy.ui.dataAsOfTooltip]);

  // P1: the sticky section nav — Together joins the row with the v2 wave
  // (I17); the Signals block sits between Together and the lanes, so its
  // scroll region stays under the Together pill.
  const jumpTargets = useMemo<JumpTarget[]>(
    () => [
      { id: 'insights-hero', label: copy.ui.navStatus },
      { id: 'insights-prices', label: copy.ui.navPrices },
      { id: 'insights-together', label: copy.ui.navTogether },
      { id: 'insights-section-lane', label: copy.ui.navIndicators },
      { id: 'insights-about', label: copy.ui.navAbout },
    ],
    [copy],
  );

  const panelReading = useMemo(() => {
    if (!panel || state.kind !== 'ready') return null;
    return state.snapshot.readings.find((r) => r.id === panel.id) ?? null;
  }, [panel, state]);

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-5 sm:max-w-2xl md:max-w-3xl lg:max-w-6xl lg:px-8">
      <ReadingProgress label={copy.ui.progressLabel} />
      <header className="mb-3">
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
              <span aria-hidden="true">⚠️ </span>
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
              <span className="text-xl" aria-hidden="true">
                ⚠️
              </span>
              <p className="m-0 text-[var(--type-label)] font-semibold text-[var(--color-status-alert)]">
                {interpolate(copy.ui.dataFrom, {
                  date: formatRelative(state.snapshot.generatedAt, locale === 'fa' ? 'fa-IR' : 'en-US'),
                })}
              </p>
            </div>
          ) : null}

          {/* The hero (H1–H5, N2) — always above the fold. */}
          <div id="insights-hero" className="scroll-mt-24">
            <HeroBlock
              readings={state.snapshot.readings}
              changedThisWeek={state.snapshot.changedThisWeek}
              calendar={state.snapshot.calendar}
              copy={copy}
              locale={locale}
              numberLocale={numberLocale}
              onJumpSection={jumpToSection}
              onJumpAbout={jumpAbout}
              onFocusCard={focusCard}
            />
          </div>

          {/* P1: the sticky section nav. */}
          <JumpNav targets={jumpTargets} copy={copy} />

          {/* H6: the next-up strip. */}
          <NextUpStrip
            events={state.snapshot.calendar}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
            eventTargets={EVENT_TARGETS}
          />

          {/* PB1–3: the prices board. */}
          <PricesBoard
            readings={state.snapshot.readings}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
          />

          {/* T1 (v2): the "Together" connection cards. */}
          <Together
            readings={state.snapshot.readings}
            copy={copy}
            numberLocale={numberLocale}
            onFocusCard={focusCard}
          />

          {/* S1–S3 (v2-gated, I17): "What the signals say" — behind the
           * SIGNALS_ENABLED one-flip flag (config.ts). */}
          {SIGNALS_ENABLED ? (
            <Signals
              readings={state.snapshot.readings}
              copy={copy}
              numberLocale={numberLocale}
            />
          ) : null}

          {/* L1–L4: the indicator lanes. */}
          <div id="insights-section-lane" className="scroll-mt-24 flex flex-col gap-5">
            <LaneSwitch lane={lane} onLaneChange={setLane} copy={copy} />
            <FilterBar
              copy={copy}
              numberLocale={numberLocale}
              total={state.snapshot.readings.length}
              shown={visibleIds !== null ? visibleIds.size : state.snapshot.readings.length}
              counts={chipCounts}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              query={query}
              onQueryChange={setQuery}
              searchInputRef={searchInputRef}
            />
            {visibleIds !== null && visibleIds.size === 0 ? (
              <div className="rounded-[var(--radius-lg)] bg-currena-soft/60 px-5 py-8 text-center ring-1 ring-[var(--color-border)]">
                <p className="m-0 text-[var(--type-label)]" aria-hidden="true">
                  🔍
                </p>
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
              <>
                {/* L1: only the chosen lane renders; the section anchor
                 * switches with it so jump links stay honest. */}
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
                    />
                  ))}
                </section>
              </>
            )}
          </div>

          <AboutTheData copy={copy} snapshot={state.snapshot} />
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
