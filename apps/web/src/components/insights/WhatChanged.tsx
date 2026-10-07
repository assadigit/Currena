/**
 * WhatChanged — "What changed this week" (02-page-design-spec.md §4):
 * state changes from the snapshot's changedThisWeek, then the five biggest
 * 30-day moves. A week with no state changes renders the quiet-week state
 * pointing at the calendar (spec §6) — empty is normal and says so.
 *
 * I8: every row (state change + mover) is now a button that opens and
 * scrolls to its indicator card — the story blocks stop being a dead end
 * and become the fastest path into the grid. The accessible name carries
 * "View card" so the link-like behaviour is announced; the chevron glyph
 * mirrors per locale (→ in LTR, ← in RTL).
 */

import type { InsightsSnapshot, IndicatorId } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { bigMovers, formatChange } from './config';

export function WhatChanged({
  snapshot,
  copy,
  numberLocale,
  locale,
  onFocusCard,
}: {
  snapshot: InsightsSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  locale: 'en' | 'fa';
  onFocusCard: (id: IndicatorId) => void;
}) {
  const changed = snapshot.changedThisWeek;
  const movers = bigMovers(snapshot.readings, 5);
  const chevron = locale === 'fa' ? '←' : '→';

  return (
    <section id="insights-what-changed" aria-labelledby="insights-what-changed-title" className="scroll-mt-24">
      <h2 id="insights-what-changed-title" className="m-0 mb-3 text-lg font-extrabold">
        {copy.ui.whatChangedTitle}
      </h2>

      {changed.length === 0 ? (
        <div className="rounded-[18px] bg-currena-soft/60 px-4 py-3.5 dark:bg-white/[0.04]">
          <p className="m-0 text-sm font-semibold text-currena-dark">{copy.ui.quietWeek}</p>
          <p className="mt-1 mb-0 text-xs text-currena-muted">{copy.ui.quietWeekHint}</p>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-2 grid-cols-1 p-0">
          {changed.map((event: { id: IndicatorId; to: string }) => {
            const name = copy.indicators[event.id].name;
            const text =
              event.to === 'warning'
                ? interpolate(copy.ui.movedToWarning, { name })
                : interpolate(copy.ui.movedToNormal, { name });
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onFocusCard(event.id)}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-[18px] px-4 py-3 text-start text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                    event.to === 'warning'
                      ? 'bg-currena-warning/10 text-currena-warning-deep hover:bg-currena-warning/15'
                      : 'bg-currena-success/10 text-currena-success-deep hover:bg-currena-success/15'
                  }`}
                >
                  <span aria-hidden="true" className="shrink-0">
                    {event.to === 'warning' ? '⚠️' : '✓'}
                  </span>
                  <span className="min-w-0 flex-1">{text}</span>
                  <span aria-hidden="true" className="shrink-0 opacity-60">
                    {chevron}
                  </span>
                  <span className="sr-only">{copy.ui.viewCard}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {movers.length > 0 ? (
        <div className="mt-3">
          <h3 className="m-0 mb-1.5 text-sm font-bold text-currena-muted">{copy.ui.bigMoversTitle}</h3>
          <ul className="m-0 grid list-none gap-1 grid-cols-1 p-0">
            {movers.map((mover) => {
              return (
                <li key={mover.id}>
                  <button
                    type="button"
                    onClick={() => onFocusCard(mover.id)}
                    className="flex w-full cursor-pointer items-baseline justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 text-start text-sm ring-1 ring-black/[0.05] transition-colors duration-200 hover:bg-currena-soft/50 hover:ring-currena-blue/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue dark:bg-[#1A222E] dark:ring-white/[0.07] dark:hover:bg-[#202A38]"
                  >
                    <span className="min-w-0 font-semibold">{copy.indicators[mover.id].name}</span>
                    <bdi dir="ltr" className="shrink-0 font-bold tabular-nums text-currena-dark">
                      {formatChange(mover.change30d, mover.changeKind, numberLocale, copy.units)}
                      <span className="ms-1 text-[0.6rem] font-semibold text-currena-muted">
                        {copy.ui.days30}
                      </span>
                    </bdi>
                    <span aria-hidden="true" className="shrink-0 text-currena-muted opacity-60">
                      {chevron}
                    </span>
                    <span className="sr-only">{copy.ui.viewCard}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 mb-0 text-[0.7rem] text-currena-muted">{copy.ui.moversUnitNote}</p>
        </div>
      ) : null}
    </section>
  );
}
