/**
 * MovesNextStrip — v3 UI_SPEC §5 (UI-18/UI-19, 2026-10-20): "Moves and
 * what is next" — ONE horizontal strip directly under the hero, wrapping
 * to rows under 640px, with up to five tappable items:
 *
 *   - the biggest moves since the last snapshot (bigMovers, |moveScore|
 *     ranked — the existing rule: the size of the change relative to the
 *     indicator's own history), each stating its period ("7-day change";
 *     the 30-day window is the stated fallback when no 7-day figure
 *     exists) — a tap opens the indicator's card;
 *   - the next calendar events filling the remaining slots, each with its
 *     relative days — a tap opens the indicator the event moves when the
 *     calendar maps one, otherwise it scrolls to the calendar section.
 *
 * Plain SVG/CSS only (UI-57): text, arrow glyphs and rings — no chart, no
 * new library. Every interactive element is ≥44px (UI-53) and carries the
 * focus ring (UI-54).
 */

import { useMemo } from 'react';
import type { CalendarEvent, IndicatorId, IndicatorReading } from '@currena/core';
import { formatJalaliDate, formatDateWords, formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import {
  bigMovers,
  changeScaleOf,
  definitionFor,
  formatChange,
} from './config';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

/** NextUpStrip's day math (UI-05 shares it): whole UTC days to the date. */
function daysUntil(dateIso: string): number {
  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const [y, m, d] = dateIso.split('-').map((part) => Number(part));
  if (y === undefined || m === undefined || d === undefined) return Number.NaN;
  const target = Date.UTC(y, m - 1, d);
  return Math.round((target - today) / 86_400_000);
}

type StripItem =
  | { kind: 'mover'; id: IndicatorId; change: number; window: '7d' | '30d' }
  | { kind: 'event'; event: CalendarEvent; days: number };

export function MovesNextStrip({
  readings,
  events,
  copy,
  locale,
  numberLocale,
  onFocusCard,
  onJumpCalendar,
  eventTargets,
}: {
  readings: readonly IndicatorReading[];
  events: readonly CalendarEvent[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId) => void;
  /** Scroll to the calendar section (events with no mapped indicator). */
  onJumpCalendar: () => void;
  /** The calendar kind → indicator mapping (H6: link events to the
   * indicators they move; the map lives in routes/Insights.tsx). */
  eventTargets: Readonly<Record<string, IndicatorId | undefined>>;
}) {
  const items = useMemo<StripItem[]>(() => {
    const out: StripItem[] = [];
    // UI-18/19: the biggest moves first, |moveScore| ranked, period stated.
    for (const mover of bigMovers(readings, 3)) {
      const reading = readings.find((r) => r.id === mover.id);
      const change =
        mover.change7d !== undefined ? mover.change7d : mover.change30d;
      if (reading === undefined || change === undefined) continue;
      out.push({ kind: 'mover', id: mover.id, change, window: mover.change7d !== undefined ? '7d' : '30d' });
    }
    // The next calendar events fill the strip to five.
    const upcoming = events
      .map((event) => ({ event, days: daysUntil(event.date) }))
      .filter((e) => Number.isFinite(e.days) && e.days >= 0)
      .sort((a, b) => a.event.date.localeCompare(b.event.date));
    for (const { event, days } of upcoming) {
      if (out.length >= 5) break;
      if (out.some((i) => i.kind === 'event' && i.event.id === event.id)) continue;
      out.push({ kind: 'event', event, days });
    }
    return out.slice(0, 5);
  }, [readings, events]);

  if (items.length === 0) return null;

  const when = (days: number): string => {
    if (days === 0) return copy.ui.today;
    if (days === 1) return copy.ui.tomorrow;
    return interpolate(copy.ui.daysAway, { n: num(days, numberLocale) });
  };

  return (
    <section aria-label={copy.ui.movesNextTitle} data-moves-strip>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((item) => {
          if (item.kind === 'mover') {
            const def = definitionFor(item.id);
            const entry = copy.indicators[item.id];
            return (
              <li key={`mover-${item.id}`} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onFocusCard(item.id)}
                  className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-start ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-muted/[0.08]"
                >
                  <span className="text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
                    {entry.name}
                  </span>
                  <bdi dir="ltr" className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                    <span aria-hidden="true" className="me-0.5">
                      {item.change > 0 ? '↑' : item.change < 0 ? '↓' : '→'}
                    </span>
                    {formatChange(item.change, def.changeKind, numberLocale, copy.units, changeScaleOf(item.id))}
                  </bdi>
                  {/* UI-19: the period is stated on the face. */}
                  <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                    {item.window === '7d' ? copy.ui.stripChange7d : copy.ui.stripChange30d}
                  </span>
                  <span className="sr-only">, {copy.ui.viewCard}</span>
                </button>
              </li>
            );
          }
          const target = eventTargets[item.event.kind];
          const dateText =
            locale === 'fa'
              ? formatJalaliDate(item.event.date, 'fa-IR')
              : formatDateWords(item.event.date, 'en-US');
          return (
            <li key={`event-${item.event.id}-${item.event.date}`} className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (target !== undefined) onFocusCard(target);
                  else onJumpCalendar();
                }}
                className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-start ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-muted/[0.08]"
              >
                <span className="text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
                  {locale === 'fa' ? item.event.titleFa : item.event.titleEn}
                </span>
                <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                  <bdi>{dateText}</bdi>
                </span>
                <span className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                  {when(item.days)}
                </span>
                <span className="sr-only">
                  , {target !== undefined ? copy.ui.viewCard : copy.ui.comingUpTitle}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
