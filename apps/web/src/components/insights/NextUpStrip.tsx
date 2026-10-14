/**
 * NextUpStrip — Block H6: "Show only the next three events in a strip under
 * the hero. Show the days left in bold and the date in a smaller size. Link
 * each event to the indicator it affects. Add a 'full calendar' link. In
 * the full list, group events by month and merge duplicate titles."
 * Gregorian date on hover/long-press (RBA and Fed news use Gregorian).
 * The .ics export (I10) rides the full list.
 */

import { useMemo, useState } from 'react';
import type { CalendarEvent, IndicatorId } from '@currena/core';
import { formatJalaliDate, formatDateWords, formatNumber } from '@currena/core';
import { CalendarDays } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { downloadBlob } from '../../lib/download';
import { buildInsightsIcs } from './ics';

const KIND_CLASS: Record<CalendarEvent['kind'], string> = {
  rba: 'bg-currena-coral/20 text-[var(--color-text-secondary)]',
  'abs-cpi': 'bg-currena-success/15 text-[var(--color-text-secondary)]',
  // Step-2 add-list §D: the two jobs-report kinds wear their region's tint.
  'abs-jobs': 'bg-currena-success/15 text-[var(--color-text-secondary)]',
  fed: 'bg-currena-blue/15 text-[var(--color-status-context)]',
  'us-cpi': 'bg-currena-blue/15 text-[var(--color-status-context)]',
  'us-jobs': 'bg-currena-blue/15 text-[var(--color-status-context)]',
  other: 'bg-currena-muted/15 text-[var(--color-text-secondary)]',
};

const KIND_BADGE: Record<CalendarEvent['kind'], string> = {
  rba: 'RBA',
  'abs-cpi': 'CPI',
  'abs-jobs': 'JOBS',
  fed: 'FED',
  'us-cpi': 'CPI',
  'us-jobs': 'JOBS',
  other: '',
};

function daysUntil(dateIso: string): number {
  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const [y, m, d] = dateIso.split('-').map((part) => Number(part));
  if (y === undefined || m === undefined || d === undefined) return Number.NaN;
  const target = Date.UTC(y, m - 1, d);
  return Math.round((target - today) / 86_400_000);
}

/** Whole months from today — the full list groups by these. */
function monthKey(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export function NextUpStrip({
  events,
  copy,
  locale,
  numberLocale,
  onFocusCard,
  eventTargets,
}: {
  events: readonly CalendarEvent[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId) => void;
  /** H6: "Link each event to the indicator it affects" — keyed by event KIND (ids are dated). */
  eventTargets: Readonly<Record<string, IndicatorId | undefined>>;
}) {
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(
    () =>
      [...events]
        .filter((e) => Number.isFinite(daysUntil(e.date)))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );
  const upcoming = useMemo(() => sorted.filter((e) => daysUntil(e.date) >= 0), [sorted]);

  const downloadIcs = (): void => {
    const ics = buildInsightsIcs(upcoming, locale);
    downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'currena-insights-calendar.ics');
  };

  // H6 full list: group by month, merge duplicate titles (Fed's 8 rows).
  // NOTE (QA Phase 4-d): this useMemo MUST stay above the empty-upcoming
  // early return — a hook after a conditional return breaks the rules of
  // hooks (eslint-plugin-react-hooks caught the latent crash: an
  // upcoming→empty transition would render fewer hooks than the previous
  // render). Computing an empty group list is free.
  const grouped = useMemo(() => {
    const byMonth = new Map<string, CalendarEvent[]>();
    for (const e of upcoming) {
      const key = monthKey(e.date);
      byMonth.set(key, [...(byMonth.get(key) ?? []), e]);
    }
    return [...byMonth.entries()];
  }, [upcoming]);

  if (upcoming.length === 0) {
    return (
      <section id="insights-coming-up" aria-labelledby="insights-coming-up-title" className="scroll-mt-24">
        <h2 id="insights-coming-up-title" className="type-section m-0 mb-2">
          {copy.ui.comingUpTitle}
        </h2>
        <p className="m-0 rounded-[var(--radius-lg)] bg-currena-soft/60 px-4 py-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)] dark:bg-white/[0.04]">
          {copy.ui.noEvents}
        </p>
      </section>
    );
  }

  const when = (days: number): string => {
    if (days === 0) return copy.ui.today;
    if (days === 1) return copy.ui.tomorrow;
    return interpolate(copy.ui.daysAway, { n: formatNumber(days, numberLocale, { maximumFractionDigits: 0 }) });
  };

  const monthLabel = (key: string): string => {
    const [y, m] = key.split('-');
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  const strip = upcoming.slice(0, 3);
  const stripHasMore = upcoming.length > 3;

  return (
    <section id="insights-coming-up" aria-labelledby="insights-coming-up-title" className="scroll-mt-24">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="insights-coming-up-title" className="type-section m-0">
          {copy.ui.comingUpTitle}
        </h2>
        {upcoming.length > 0 ? (
          <button
            type="button"
            onClick={downloadIcs}
            className="no-print insights-focusable inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/10"
          >
            <CalendarDays aria-hidden size={16} strokeWidth={1.9} className="shrink-0" />
            {copy.ui.icsDownload}
          </button>
        ) : null}
      </div>

      {/* H6: the three-event strip. */}
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
        {strip.map((event) => {
          const days = daysUntil(event.date);
          const dateText = locale === 'fa' ? formatJalaliDate(event.date, 'fa-IR') : formatDateWords(event.date, 'en-US');
          const target = eventTargets[event.kind];
          return (
            <li
              key={`${event.id}-${event.date}`}
              className="flex flex-col gap-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="type-label font-bold text-[var(--color-text-primary)]">
                  {when(days)}
                </span>
                {KIND_BADGE[event.kind] ? (
                  <span className={`rounded-full px-2 py-0.5 text-[length:var(--type-caption)] font-bold ${KIND_CLASS[event.kind]}`}>
                    <bdi dir="ltr">{KIND_BADGE[event.kind]}</bdi>
                  </span>
                ) : null}
              </span>
              <span className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)]">
                {locale === 'fa' ? event.titleFa : event.titleEn}
              </span>
              <span
                className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]"
                title={interpolate(copy.ui.gregorianDate, { date: event.date })}
              >
                <bdi>{dateText}</bdi>
              </span>
              {target ? (
                <button
                  type="button"
                  onClick={() => onFocusCard(target!)}
                  className="insights-focusable -ms-1 mt-1 w-fit cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
                >
                  {copy.indicators[target].name}
                  <span className="sr-only">, {copy.ui.viewCard}</span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {stripHasMore ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="insights-focusable mt-2 inline-flex min-h-[36px] cursor-pointer items-center rounded-full border border-[var(--color-border)] bg-transparent px-3.5 py-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] transition-colors hover:bg-currena-blue/10"
        >
          {showAll ? copy.ui.hideCalendar : copy.ui.fullCalendar}
          <span aria-hidden="true" className={`ms-1 transition-transform ${showAll ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
      ) : null}

      {/* H6: the full list — grouped by month, duplicate titles merged. */}
      {showAll ? (
        <div className="mt-2 flex flex-col gap-3">
          {grouped.map(([key, monthEvents]) => {
            // Merge same-title events within a month (the Fed's meeting rows).
            const byTitle = new Map<string, { event: CalendarEvent; count: number }>();
            for (const e of monthEvents) {
              const t = locale === 'fa' ? e.titleFa : e.titleEn;
              const existing = byTitle.get(t);
              if (existing) existing.count += 1;
              else byTitle.set(t, { event: e, count: 1 });
            }
            return (
              <div key={key}>
                <h3 className="m-0 mb-1.5 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
                  <bdi>{monthLabel(key)}</bdi>
                </h3>
                <ul className="m-0 grid list-none gap-1.5 p-0">
                  {[...byTitle.values()].map(({ event, count }) => {
                    const days = daysUntil(event.date);
                    const dateText =
                      locale === 'fa' ? formatJalaliDate(event.date, 'fa-IR') : formatDateWords(event.date, 'en-US');
                    return (
                      <li
                        key={`${event.id}-${event.date}`}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-2.5 ring-1 ring-[var(--color-border)]"
                      >
                        <span className="min-w-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)]">
                          {locale === 'fa' ? event.titleFa : event.titleEn}
                          {count > 1 ? (
                            <bdi className="ms-1 font-bold text-[var(--color-text-secondary)]">
                              ×{formatNumber(count, numberLocale, { maximumFractionDigits: 0 })}
                            </bdi>
                          ) : null}
                        </span>
                        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                          <bdi>{dateText}</bdi>
                          <span className="mx-1.5 opacity-50">·</span>
                          <bdi className="font-bold">{when(days)}</bdi>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
