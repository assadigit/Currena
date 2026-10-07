/**
 * Insights — the /insights page (Phase I4, docs/insights/02-page-design-spec.md).
 *
 * Structure top to bottom: title/subtitle + snapshot date → summary block
 * (two LED-count lines + explainer + disclaimer bar) → jump links → what
 * changed this week → coming up → GLOBAL section (4 groups) → AUSTRALIA
 * section (3 groups) → about the data + full disclaimer. Global comes
 * before Australia (owner Gate I4 feedback, 2026-10-07 — overrides the
 * original spec §4 reader-location ordering).
 *
 * Data: GET /api/insights (zod-validated in lib/insights.ts), last-good
 * localStorage snapshot first for instant/offline paint, fresh fetch
 * revalidating behind it. History charts load per-card on first expand.
 *
 * Card expansion: several cards open at once on desktop; on phones
 * (<768px) opening one closes the previous (spec §5). Language switches
 * keep scroll position and open cards — both live in this component's
 * state and survive the re-render.
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
import { ComingUp } from '../components/insights/ComingUp';
import { FilterBar } from '../components/insights/FilterBar';
import { IndicatorCard } from '../components/insights/IndicatorCard';
import { JumpNav, type JumpTarget } from '../components/insights/JumpNav';
import { SummaryBlock } from '../components/insights/SummaryBlock';
import { WhatChanged } from '../components/insights/WhatChanged';
import { Skeleton } from '../components/ui';
import { Button } from '../components/ui';
import { useInsightsCopy } from '../components/insights/useInsightsCopy';
import {
  GROUP_ORDER,
  PINNED_STORAGE_KEY,
  SECTION_ORDER,
  definitionFor,
  definitionsForGroup,
  filterVisibleIds,
  formatPinnedStorage,
  groupCounts,
  parsePinnedIds,
  statusCounts,
  type StatusFilter,
} from '../components/insights/config';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; snapshot: InsightsSnapshot; fromCache: boolean }
  | { kind: 'error'; message: string; cached: InsightsSnapshot | null };

/** Small integers in prose — Persian digits in fa (I10 digit sweep). */
function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

/** Phones: opening a card closes the previous one (spec §5). */
function useIsPhone(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia('(max-width: 767px)');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(max-width: 767px)').matches,
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2" aria-hidden="true">
      <Skeleton className="h-16 rounded-[18px]" />
      <Skeleton className="h-16 rounded-[18px]" />
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-44 rounded-[18px]" />
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  snapshot,
  openCards,
  onToggle,
  copy,
  locale,
  numberLocale,
  onPinChange,
  renderableIds,
}: {
  section: InsightsSection;
  snapshot: InsightsSnapshot;
  openCards: ReadonlySet<IndicatorId>;
  onToggle: (id: IndicatorId) => void;
  copy: ReturnType<typeof useInsightsCopy>['copy'];
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onPinChange: (id: IndicatorId, next: boolean) => void;
  /** I8+I10: ids surviving the FilterBar AND not pinned to the watchlist
   * (null = everything renders here). Empty sections hide. Count lines
   * still describe the FULL group data — the filter is a view tool and
   * pinned cards belong to the same group, they just render elsewhere. */
  renderableIds: ReadonlySet<IndicatorId> | null;
}) {
  const line = snapshot.summary[section];
  const sectionId = `insights-section-${section}`;
  const renderable = (id: IndicatorId): boolean =>
    renderableIds === null || renderableIds.has(id);
  const hasRenderable = snapshot.readings.some(
    (r) => renderable(r.id) && definitionFor(r.id).section === section,
  );
  if (!hasRenderable) return null;
  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-title`} className="scroll-mt-24">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={`${sectionId}-title`} className="m-0 text-lg font-extrabold">
          {copy.sections[section]}
        </h2>
        <p className="m-0 text-xs font-semibold text-currena-muted">
          {interpolate(copy.ui.inWarning, {
            warnings: num(line.warningCount, numberLocale),
            voting: num(line.votingCount, numberLocale),
          })}
        </p>
      </header>
      <div className="flex flex-col gap-6">
        {GROUP_ORDER[section].map((group: IndicatorGroupId) => {
          const defs = definitionsForGroup(section, group);
          const counts = groupCounts(snapshot.readings, section, group);
          const readings = snapshot.readings.filter(
            (r) => defs.some((d) => d.id === r.id) && renderable(r.id),
          );
          if (readings.length === 0) return null;
          return (
            <div key={group}>
              <header className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="m-0 text-[0.9rem] font-bold text-currena-blue-deep">{copy.groups[group]}</h3>
                {counts.votingCount > 0 ? (
                  <p className="m-0 text-[0.7rem] font-semibold text-currena-muted">
                    {interpolate(copy.ui.inWarning, {
                      warnings: num(counts.warningCount, numberLocale),
                      voting: num(counts.votingCount, numberLocale),
                    })}
                  </p>
                ) : null}
              </header>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {defs.map((def) => {
                  if (!renderable(def.id)) return null;
                  const reading = snapshot.readings.find((r) => r.id === def.id);
                  if (!reading) return null;
                  return (
                    <IndicatorCard
                      key={def.id}
                      reading={reading}
                      copy={copy}
                      locale={locale}
                      numberLocale={numberLocale}
                      open={openCards.has(def.id)}
                      onToggle={onToggle}
                      pinned={false}
                      onPinChange={onPinChange}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * I10: the personal watchlist — pinned cards render in their own section
 * above the groups ("stay on top"), in snapshot order. The count line
 * describes the pinned set itself (same semantics as a group header —
 * the status of the cards you actually see here).
 */
function PinnedSection({
  readings,
  openCards,
  onToggle,
  copy,
  locale,
  numberLocale,
  onPinChange,
}: {
  readings: readonly IndicatorReading[];
  openCards: ReadonlySet<IndicatorId>;
  onToggle: (id: IndicatorId) => void;
  copy: ReturnType<typeof useInsightsCopy>['copy'];
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onPinChange: (id: IndicatorId, next: boolean) => void;
}) {
  const voting = readings.filter((r) => r.status === 'warning' || r.status === 'normal');
  const warnings = voting.filter((r) => r.status === 'warning');
  return (
    <section id="insights-pinned" aria-labelledby="insights-pinned-title" className="scroll-mt-24">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="insights-pinned-title" className="m-0 text-lg font-extrabold">
          <span aria-hidden="true">★ </span>
          {copy.ui.pinnedTitle}
        </h2>
        {voting.length > 0 ? (
          <p className="m-0 text-xs font-semibold text-currena-muted">
            {interpolate(copy.ui.inWarning, {
              warnings: num(warnings.length, numberLocale),
              voting: num(voting.length, numberLocale),
            })}
          </p>
        ) : null}
      </header>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {readings.map((r) => (
          <IndicatorCard
            key={r.id}
            reading={r}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            open={openCards.has(r.id)}
            onToggle={onToggle}
            pinned
            onPinChange={onPinChange}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * I10: a thin reading-progress bar pinned above the app header — on a page
 * this long, "how far through am I?" is orientation, not decoration.
 * rAF-throttled passive listeners (the JumpNav scrollspy pattern); fills
 * from the inline-start edge in both directions (RTL grows it from the
 * right — block flow handles that natively); hidden on paper.
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
  const [openCards, setOpenCards] = useState<ReadonlySet<IndicatorId>>(new Set());
  // I8: card-grid filter (view tool only — counts and summaries keep
  // describing the full snapshot). Survives language switches (same mount).
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  // I10: the personal watchlist — pinned cards render in their own section
  // above the groups. Pins persist across visits (localStorage) and sync
  // across tabs (the storage event); like the filter, this is a VIEW tool —
  // group count lines keep describing the full data.
  const [pinned, setPinned] = useState<ReadonlySet<IndicatorId>>(() => {
    try {
      return new Set(parsePinnedIds(window.localStorage.getItem(PINNED_STORAGE_KEY) ?? ''));
    } catch {
      return new Set(); // storage unavailable (privacy mode) — session-only
    }
  });
  const isPhone = useIsPhone();
  const hadCache = useRef(false);
  // I7 #50: a share link ('#/insights?card=<id>') opens + scrolls to that
  // card once, when the first snapshot is on screen (cached or fresh).
  const shareLinkHandled = useRef(false);
  // I9: the "/" key focuses the filter search (see the keydown effect below).
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
          err instanceof ApiError && err.kind === 'rates'
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Insights feed unavailable';
        setState((prev) =>
          prev.kind === 'ready'
            ? prev // A cached render already on screen stays; banner shows the age.
            : { kind: 'error', message, cached },
        );
      });
    return () => controller.abort();
  }, [retryToken]);

  const onToggle = useCallback(
    (id: IndicatorId) => {
      setOpenCards((prev) => {
        if (isPhone) {
          return prev.has(id) ? new Set() : new Set([id]);
        }
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [isPhone],
  );

  // I10: pin/unpin — persisted below, synced across tabs via 'storage'.
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

  // Shared "go look at this card" behaviour (I7 share links + I8 WhatChanged
  // rows): open the card (single-open on phones) then scroll + focus it.
  // I9 fix: if the active filter hides the target card, the reader's intent
  // ("show me THIS card") wins — the filter resets before scrolling, so a
  // WhatChanged row never silently does nothing.
  const focusCard = useCallback(
    (id: IndicatorId) => {
      setOpenCards((prev) => (isPhone ? new Set([id]) : new Set([...prev, id])));
      requestAnimationFrame(() => {
        const el = document.getElementById(`insights-card-${id}`);
        if (!el) {
          // Hidden by the current filter — clear it and retry once (the
          // reader asked for this card; the view filter must not eat it).
          setStatusFilter('all');
          setQuery('');
          requestAnimationFrame(() => {
            const retry = document.getElementById(`insights-card-${id}`);
            if (!retry) return;
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            retry.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
            retry.setAttribute('tabindex', '-1');
            retry.focus({ preventScroll: true });
          });
          return;
        }
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      });
    },
    [isPhone],
  );

  // Share-link deep link (I7 #50, spec §10): '?card=<id>' opens exactly
  // that card (single-open discipline on phones) and scrolls to it. Unknown
  // or missing ids are ignored — the page just loads normally.
  useEffect(() => {
    if (state.kind !== 'ready' || shareLinkHandled.current) return;
    shareLinkHandled.current = true;
    const cardParam = routeQuery().get('card');
    if (!cardParam) return;
    let id: IndicatorId;
    try {
      id = definitionFor(cardParam as IndicatorId).id;
    } catch {
      return; // not a known indicator id — ignore the param
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

  // I9: the summary lines jump to their sections (reuses the JumpNav pattern).
  const jumpToSection = useCallback((section: 'global' | 'australia') => {
    const el = document.getElementById(`insights-section-${section}`);
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, []);

  // I9: "/" focuses the filter search (desktop muscle memory — Gmail,
  // GitHub, YouTube). Never fires while typing in any field, and ignores
  // modifier combos so it never swallows browser shortcuts (Cmd+/ etc.).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // I8: ids surviving the current filter (null = no filtering active).
  const visibleIds = useMemo(() => {
    if (state.kind !== 'ready') return null;
    return filterVisibleIds(state.snapshot.readings, { status: statusFilter, query }, (id) => ({
      name: copy.indicators[id].name,
      ticker: copy.indicators[id].ticker,
    }));
  }, [state, statusFilter, query, copy]);

  // I9: live per-status counts for the FilterBar chips (full snapshot —
  // same semantics as the filter itself).
  const chipCounts = useMemo(() => {
    if (state.kind !== 'ready') return { all: 0, warning: 0, normal: 0, context: 0 };
    return statusCounts(state.snapshot.readings);
  }, [state]);

  // I10: cards rendering inside their GROUP sections — visible under the
  // filter AND not pinned (pinned cards render in the watchlist section
  // above). null = nothing to exclude (fast path, same as I8's null).
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

  // I10: pinned cards that survive the current filter (the watchlist respects
  // the view — a hidden card is hidden everywhere, and focusCard clears the
  // filter when a reader asks for a hidden one, pins included).
  const pinnedReadings = useMemo<readonly IndicatorReading[]>(() => {
    if (state.kind !== 'ready') return [];
    return state.snapshot.readings.filter(
      (r) => pinned.has(r.id) && (visibleIds === null || visibleIds.has(r.id)),
    );
  }, [state, pinned, visibleIds]);

  // Sections with at least one visible card (drives hiding + JumpNav pills).
  const sectionVisible = useMemo<Record<InsightsSection, boolean>>(() => {
    const out: Record<InsightsSection, boolean> = { global: false, australia: false };
    if (state.kind === 'ready') {
      for (const r of state.snapshot.readings) {
        if (sectionIds !== null && !sectionIds.has(r.id)) continue;
        out[definitionFor(r.id).section] = true;
      }
    }
    return out;
  }, [state, sectionIds]);

  const jumpTargets = useMemo<JumpTarget[]>(() => {
    const targets: JumpTarget[] = [
      { id: 'insights-what-changed', label: copy.ui.whatChangedTitle },
      { id: 'insights-coming-up', label: copy.ui.comingUpTitle },
    ];
    // I8: a pill whose section is fully filtered out would jump nowhere.
    // I10: the watchlist pill mirrors its section's place in the page.
    if (pinnedReadings.length > 0) {
      targets.push({ id: 'insights-pinned', label: copy.ui.pinnedTitle });
    }
    if (sectionVisible.global) targets.push({ id: 'insights-section-global', label: copy.sections.global });
    if (sectionVisible.australia) {
      targets.push({ id: 'insights-section-australia', label: copy.sections.australia });
    }
    targets.push({ id: 'insights-about', label: copy.ui.aboutTitle });
    return targets;
  }, [copy, sectionVisible]);

  const generatedLine = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const iso = state.snapshot.generatedAt;
    const dateText =
      locale === 'fa'
        ? formatJalaliDate(iso, 'fa-IR', { withTime: true })
        : formatDate(iso, 'en-US', { withTime: true });
    // I10: freshness at a glance — relative first ("3 hours ago"), exact
    // datetime second; formatted at render only, never stored.
    const ago = formatRelative(iso, locale === 'fa' ? 'fa-IR' : 'en-US');
    return interpolate(copy.ui.updatedAgo, { ago, date: dateText });
  }, [state, locale, copy.ui.updatedAgo]);

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-5 sm:max-w-2xl md:max-w-3xl lg:max-w-6xl lg:px-8">
      {/* I10: reading progress — fixed above the app header, print-hidden. */}
      <ReadingProgress label={copy.ui.progressLabel} />
      <header className="mb-4">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight">{t('insights.title')}</h1>
        <p className="mt-1 mb-0 text-sm text-currena-muted">{copy.ui.subtitle}</p>
        {generatedLine ? (
          <p className="mt-1 mb-0 text-[0.7rem] text-currena-muted">
            <bdi>{generatedLine}</bdi>
          </p>
        ) : null}
      </header>

      {state.kind === 'loading' ? (
        <div className="flex flex-col gap-6" role="status" aria-live="polite">
          <SummarySkeleton />
          <CardsSkeleton />
        </div>
      ) : null}

      {state.kind === 'error' ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-[18px] bg-currena-warning/10 px-5 py-6 text-center ring-1 ring-currena-warning/30">
            <p className="m-0 text-base font-bold text-currena-warning">⚠️ {copy.ui.loadError}</p>
            <p className="mt-1 mb-3 text-sm text-currena-muted">{state.message}</p>
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
              className="slide-down flex items-center gap-3 rounded-[15px] border-s-4 border-currena-warning bg-currena-warning/15 px-4 py-3"
            >
              <span className="text-xl" aria-hidden="true">
                ⚠️
              </span>
              <p className="m-0 text-sm font-semibold text-currena-warning">
                {/* I10: the cache banner leads with the relative age — the
                    exact timestamp is one line above, in the header. */}
                {interpolate(copy.ui.dataFrom, {
                  date: formatRelative(
                    state.snapshot.generatedAt,
                    locale === 'fa' ? 'fa-IR' : 'en-US',
                  ),
                })}
              </p>
            </div>
          ) : null}

          <SummaryBlock
            summary={state.snapshot.summary}
            copy={copy}
            numberLocale={numberLocale}
            onJumpAbout={jumpAbout}
            onJumpSection={jumpToSection}
          />
          <JumpNav targets={jumpTargets} copy={copy} />
          <WhatChanged
            snapshot={state.snapshot}
            copy={copy}
            numberLocale={numberLocale}
            locale={locale}
            onFocusCard={focusCard}
          />
          <ComingUp
            events={state.snapshot.calendar}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
          />
          {/* I8: the card-grid toolbar — after the story blocks, right where
              the grid begins. View tool only (see FilterBar.tsx). */}
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
            <div className="rounded-[18px] bg-currena-soft/60 px-5 py-8 text-center ring-1 ring-black/[0.05] dark:bg-white/[0.04] dark:ring-white/[0.07]">
              <p className="m-0 text-base" aria-hidden="true">
                🔍
              </p>
              <p className="mt-1 mb-0 text-sm font-semibold text-currena-dark">{copy.ui.noMatches}</p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setQuery('');
                }}
                className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-currena-blue/40 bg-currena-blue/15 px-5 text-xs font-bold text-currena-blue-deep transition-colors hover:bg-currena-blue/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
              >
                {copy.ui.clearFilters}
              </button>
            </div>
          ) : (
            <>
              {/* I10: the personal watchlist — pinned cards, right where the
                  grid begins (self-hides when empty or fully filtered out). */}
              {pinnedReadings.length > 0 ? (
                <PinnedSection
                  readings={pinnedReadings}
                  openCards={openCards}
                  onToggle={onToggle}
                  copy={copy}
                  locale={locale}
                  numberLocale={numberLocale}
                  onPinChange={togglePin}
                />
              ) : null}
              {SECTION_ORDER.map((section) => (
                <SectionBlock
                  key={section}
                  section={section}
                  snapshot={state.snapshot}
                  openCards={openCards}
                  onToggle={onToggle}
                  copy={copy}
                  locale={locale}
                  numberLocale={numberLocale}
                  onPinChange={togglePin}
                  renderableIds={sectionIds}
                />
              ))}
            </>
          )}
          <AboutTheData copy={copy} />
        </div>
      ) : null}
    </div>
  );
}
