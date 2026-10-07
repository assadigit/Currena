/**
 * ComingUp — the key-dates calendar (RBA, ABS CPI, US Fed …) from the
 * hand-maintained data/insights-calendar.json served inside the snapshot.
 * Events within 7 days are highlighted (02-page-design-spec.md §4). The
 * calendar is populated during Phase I5 content work — until then the
 * empty state says so honestly instead of hiding the section.
 *
 * Dates: Gregorian in English, Jalali in Farsi (spec §7), always isolated
 * (<bdi>) so a Persian month next to a year can never scramble.
 */

import type { CalendarEvent } from '@currena/core';
import { formatJalaliDate, formatDate } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';

const KIND_CLASS: Record<CalendarEvent['kind'], string> = {
  rba: 'bg-currena-coral/20 text-currena-coral',
  'abs-cpi': 'bg-currena-success/15 text-currena-success',
  fed: 'bg-currena-blue/15 text-currena-blue',
  other: 'bg-currena-muted/15 text-currena-muted',
};

const KIND_BADGE: Record<CalendarEvent['kind'], string> = {
  rba: 'RBA',
  'abs-cpi': 'CPI',
  fed: 'FED',
  other: '',
};

/** Whole days from today (UTC midnight) until the event date. */
function daysUntil(dateIso: string): number {
  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const [y, m, d] = dateIso.split('-').map((part) => Number(part));
  if (y === undefined || m === undefined || d === undefined) return Number.NaN;
  const target = Date.UTC(y, m - 1, d);
  return Math.round((target - today) / 86_400_000);
}

export function ComingUp({
  events,
  copy,
  locale,
}: {
  events: readonly CalendarEvent[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
}) {
  const sorted = [...events]
    .filter((e) => Number.isFinite(daysUntil(e.date)))
    .sort((a, b) => a.date.localeCompare(b.date));
  // Only future events (and the recent past drops off naturally).
  const upcoming = sorted.filter((e) => daysUntil(e.date) >= 0);

  return (
    <section id="insights-coming-up" aria-labelledby="insights-coming-up-title">
      <h2 id="insights-coming-up-title" className="m-0 mb-3 text-lg font-extrabold">
        {copy.ui.comingUpTitle}
      </h2>

      {upcoming.length === 0 ? (
        <p className="m-0 rounded-[18px] bg-currena-soft/60 px-4 py-3.5 text-sm text-currena-muted dark:bg-white/[0.04]">
          {copy.ui.noEvents}
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-2 grid-cols-1 p-0">
          {upcoming.map((event) => {
            const days = daysUntil(event.date);
            const soon = days <= 7;
            const when =
              days === 0
                ? copy.ui.today
                : interpolate(copy.ui.daysAway, { n: days });
            const dateText =
              locale === 'fa' ? formatJalaliDate(event.date, 'fa-IR') : formatDate(event.date, 'en-US');
            return (
              <li
                key={`${event.id}-${event.date}`}
                className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-[18px] px-4 py-3 ${
                  soon
                    ? 'bg-currena-coral/15 ring-1 ring-currena-coral/40'
                    : 'bg-white ring-1 ring-black/[0.05] dark:bg-[#1A222E] dark:ring-white/[0.07]'
                }`}
              >
                <span className="min-w-0">
                  {KIND_BADGE[event.kind] ? (
                    <span
                      className={`me-2 rounded-full px-2 py-0.5 text-[0.62rem] font-bold tracking-wide ${KIND_CLASS[event.kind]}`}
                    >
                      <bdi dir="ltr">{KIND_BADGE[event.kind]}</bdi>
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold">{locale === 'fa' ? event.titleFa : event.titleEn}</span>
                </span>
                <span className="text-xs text-currena-muted">
                  <bdi>{dateText}</bdi>
                  <span className="mx-1.5 opacity-50">·</span>
                  <bdi className={soon ? 'font-bold text-currena-coral' : 'font-semibold'}>{when}</bdi>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
