/**
 * WhatChanged — "What changed this week" (02-page-design-spec.md §4):
 * state changes from the snapshot's changedThisWeek, then the five biggest
 * 30-day moves. A week with no state changes renders the quiet-week state
 * pointing at the calendar (spec §6) — empty is normal and says so.
 */

import type { InsightsSnapshot, IndicatorId } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { bigMovers, definitionFor, formatChange } from './config';

export function WhatChanged({
  snapshot,
  copy,
  numberLocale,
}: {
  snapshot: InsightsSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const changed = snapshot.changedThisWeek;
  const movers = bigMovers(snapshot.readings, 5);

  return (
    <section id="insights-what-changed" aria-labelledby="insights-what-changed-title">
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
              <li
                key={event.id}
                className={`rounded-[18px] px-4 py-3 text-sm font-medium ${
                  event.to === 'warning'
                    ? 'bg-currena-warning/10 text-currena-warning-deep'
                    : 'bg-currena-success/10 text-currena-success-deep'
                }`}
              >
                <span aria-hidden="true" className="me-1.5">
                  {event.to === 'warning' ? '⚠️' : '✓'}
                </span>
                {text}
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
              const def = definitionFor(mover.id);
              return (
                <li
                  key={mover.id}
                  className="flex items-baseline justify-between gap-3 rounded-xl bg-white px-3.5 py-2 text-sm ring-1 ring-black/[0.05] dark:bg-[#1A222E] dark:ring-white/[0.07]"
                >
                  <span className="min-w-0 font-semibold">{copy.indicators[mover.id].name}</span>
                  <bdi dir="ltr" className="shrink-0 font-bold tabular-nums text-currena-dark">
                    {formatChange(mover.change30d, mover.changeKind, numberLocale, copy.units)}
                    <span className="ms-1 text-[0.6rem] font-semibold text-currena-muted">
                      {copy.ui.days30}
                    </span>
                  </bdi>
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
