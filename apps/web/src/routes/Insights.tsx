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
import { formatJalaliDate, formatDate } from '@currena/core';
import { interpolate } from '../i18n';
import { useI18n } from '../lib/locale';
import { ApiError, fetchInsightsSnapshot, readCachedSnapshot } from '../lib/insights';
import { AboutTheData } from '../components/insights/AboutTheData';
import { ComingUp } from '../components/insights/ComingUp';
import { IndicatorCard } from '../components/insights/IndicatorCard';
import { JumpNav, type JumpTarget } from '../components/insights/JumpNav';
import { SummaryBlock } from '../components/insights/SummaryBlock';
import { WhatChanged } from '../components/insights/WhatChanged';
import { Skeleton } from '../components/ui';
import { Button } from '../components/ui';
import { useInsightsCopy } from '../components/insights/useInsightsCopy';
import {
  GROUP_ORDER,
  SECTION_ORDER,
  definitionsForGroup,
  groupCounts,
} from '../components/insights/config';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; snapshot: InsightsSnapshot; fromCache: boolean }
  | { kind: 'error'; message: string; cached: InsightsSnapshot | null };

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
}: {
  section: InsightsSection;
  snapshot: InsightsSnapshot;
  openCards: ReadonlySet<IndicatorId>;
  onToggle: (id: IndicatorId) => void;
  copy: ReturnType<typeof useInsightsCopy>['copy'];
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const line = snapshot.summary[section];
  const sectionId = `insights-section-${section}`;
  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-title`}>
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={`${sectionId}-title`} className="m-0 text-lg font-extrabold">
          {copy.sections[section]}
        </h2>
        <p className="m-0 text-xs font-semibold text-currena-muted">
          {interpolate(copy.ui.inWarning, {
            warnings: line.warningCount,
            voting: line.votingCount,
          })}
        </p>
      </header>
      <div className="flex flex-col gap-6">
        {GROUP_ORDER[section].map((group: IndicatorGroupId) => {
          const defs = definitionsForGroup(section, group);
          const counts = groupCounts(snapshot.readings, section, group);
          const readings = snapshot.readings.filter((r) => defs.some((d) => d.id === r.id));
          if (readings.length === 0) return null;
          return (
            <div key={group}>
              <header className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="m-0 text-[0.9rem] font-bold text-currena-blue">{copy.groups[group]}</h3>
                {counts.votingCount > 0 ? (
                  <p className="m-0 text-[0.68rem] font-semibold text-currena-muted">
                    {interpolate(copy.ui.inWarning, {
                      warnings: counts.warningCount,
                      voting: counts.votingCount,
                    })}
                  </p>
                ) : null}
              </header>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {defs.map((def) => {
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

export function Insights() {
  const { t, locale } = useI18n();
  const { copy, numberLocale } = useInsightsCopy();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [openCards, setOpenCards] = useState<ReadonlySet<IndicatorId>>(new Set());
  const isPhone = useIsPhone();
  const hadCache = useRef(false);

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

  const jumpAbout = useCallback(() => {
    const el = document.getElementById('insights-about');
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, []);

  const jumpTargets = useMemo<JumpTarget[]>(
    () => [
      { id: 'insights-what-changed', label: copy.ui.whatChangedTitle },
      { id: 'insights-coming-up', label: copy.ui.comingUpTitle },
      { id: 'insights-section-global', label: copy.sections.global },
      { id: 'insights-section-australia', label: copy.sections.australia },
      { id: 'insights-about', label: copy.ui.aboutTitle },
    ],
    [copy],
  );

  const generatedLine = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const iso = state.snapshot.generatedAt;
    const dateText =
      locale === 'fa'
        ? formatJalaliDate(iso, 'fa-IR', { withTime: true })
        : formatDate(iso, 'en-US', { withTime: true });
    return `${copy.ui.updated}: ${dateText}`;
  }, [state, locale, copy.ui.updated]);

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-5 sm:max-w-2xl md:max-w-3xl lg:max-w-6xl lg:px-8">
      <header className="mb-4">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight">{t('insights.title')}</h1>
        <p className="mt-1 mb-0 text-sm text-currena-muted">{copy.ui.subtitle}</p>
        {generatedLine ? (
          <p className="mt-1 mb-0 text-[0.68rem] text-currena-muted">
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
                {interpolate(copy.ui.dataFrom, {
                  date:
                    locale === 'fa'
                      ? formatJalaliDate(state.snapshot.generatedAt, 'fa-IR', { withTime: true })
                      : formatDate(state.snapshot.generatedAt, 'en-US', { withTime: true }),
                })}
              </p>
            </div>
          ) : null}

          <SummaryBlock summary={state.snapshot.summary} copy={copy} onJumpAbout={jumpAbout} />
          <JumpNav targets={jumpTargets} copy={copy} />
          <WhatChanged snapshot={state.snapshot} copy={copy} numberLocale={numberLocale} />
          <ComingUp events={state.snapshot.calendar} copy={copy} locale={locale} />
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
            />
          ))}
          <AboutTheData copy={copy} />
        </div>
      ) : null}
    </div>
  );
}
