/**
 * IndicatorCard — one expandable indicator card (02-page-design-spec.md §5).
 *
 * Collapsed (always visible): name + ticker, current value, 7/30-day signed
 * changes with direction arrows, status chip (icon + word), 10-year position
 * bar with the rule's watched zone, the plain-language one-liner, and the
 * "Updated {date} · Source {name}" footer.
 *
 * Expanded: the five explainer sections, the rule in plain language, the
 * 10-year chart (fetched on first expand, module-cached), the linked
 * source, and the stale/no-history notes.
 *
 * A11y: the expand control is a real <button> inside the card's <h3>
 * (APG accordion pattern) with aria-expanded + aria-controls; the panel is
 * a labelled region. Stale/unavailable cards grey out and never mislead.
 * Mobile closes the previous card (handled by the route's open-state).
 */

import { useEffect, useId, useState } from 'react';
import type { IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import { fetchIndicatorHistory, ApiError } from '../../lib/insights';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { formatAsOf } from './HistoryChart';
import { HistoryChart } from './HistoryChart';
import {
  definitionFor,
  formatChange,
  formatIndicatorValue,
  formatRuleText,
  warningZone,
} from './config';
import { PositionBar } from './PositionBar';
import { StatusChip } from './StatusChip';

export interface IndicatorCardProps {
  reading: IndicatorReading;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  open: boolean;
  onToggle: (id: IndicatorReading['id']) => void;
}

/** One signed change run — dir="ltr" so ± never scrambles inside RTL text. */
function ChangeRun({
  change,
  changeKind,
  label,
  numberLocale,
  copy,
}: {
  change: number | undefined;
  changeKind: 'pct' | 'points';
  label: string;
  numberLocale: 'en-US' | 'fa-IR';
  copy: InsightsCopy;
}) {
  if (change === undefined || !Number.isFinite(change)) return null;
  const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '▬';
  return (
    <span className="inline-flex items-center gap-1 text-xs text-currena-muted">
      <span aria-hidden="true">{arrow}</span>
      <span className="flex flex-col leading-tight">
        <bdi dir="ltr" className="font-semibold tabular-nums">
          {formatChange(change, changeKind, numberLocale, copy.units)}
        </bdi>
        <span className="text-[0.6rem] opacity-80">{label}</span>
      </span>
    </span>
  );
}

/** The expanded panel's chart block — fetches on first mount, cached module-wide. */
function CardHistory({
  id,
  copy,
  locale,
  numberLocale,
}: {
  id: IndicatorReading['id'];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const [state, setState] = useState<
    { kind: 'loading' } | { kind: 'ready'; points: [number, number][] } | { kind: 'error' } | { kind: 'none' }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchIndicatorHistory(id)
      .then((history) => {
        if (cancelled) return;
        setState(history && history.points.length > 0 ? { kind: 'ready', points: history.points } : { kind: 'none' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === 'history_not_found') {
          setState({ kind: 'none' });
          return;
        }
        setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === 'loading') {
    return <p className="mt-2 text-sm text-currena-muted">{copy.ui.historyLoading}</p>;
  }
  if (state.kind === 'error') {
    return <p className="mt-2 text-sm text-currena-warning">{copy.ui.historyError}</p>;
  }
  if (state.kind === 'none') {
    return <p className="mt-2 text-sm text-currena-muted">{copy.ui.noHistory}</p>;
  }
  return <HistoryChart id={id} points={state.points} copy={copy} locale={locale} numberLocale={numberLocale} />;
}

function CopySection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      {/* I6 audit F2: blue-deep — the brand blue failed AA (3.3:1) at this size.
       * F11: 0.75rem + a touch more lead-in so the five titles scan as
       * anchors rather than a wall of text. */}
      <h5 className="m-0 text-[0.75rem] font-bold uppercase tracking-wide text-currena-blue-deep">{title}</h5>
      <p className="mt-1 mb-0 text-sm leading-relaxed text-currena-dark/90 dark:text-currena-dark/90">{body}</p>
    </div>
  );
}

export function IndicatorCard({ reading, copy, locale, numberLocale, open, onToggle }: IndicatorCardProps) {
  const autoId = useId();
  const headingId = `${autoId}-heading`;
  const panelId = `${autoId}-panel`;
  // I6 audit F10: the expand button's accessible name used to be the ENTIRE
  // collapsed card (~33 words — name, value, changes, chip, one-liner, footer).
  // Both the heading and the button are now labelled by name (+ticker) + status
  // word — e.g. "US 10Y minus 2Y yield, Normal" — so heading lists and the tab
  // order stay scannable; value/changes are still read inside the button.
  const nameId = `${autoId}-name`;
  const chipId = `${autoId}-chip`;
  const def = definitionFor(reading.id);
  const ind = copy.indicators[reading.id];
  const isUnavailable = reading.status === 'unavailable';
  const isStale = reading.status === 'stale';
  const greyed = isStale || isUnavailable;

  const valueText =
    reading.value !== null
      ? formatIndicatorValue(reading.id, reading.value, numberLocale, copy.units)
      : null;

  return (
    <article
      className={`rounded-[18px] p-4 ring-1 shadow-[0_4px_18px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] ${
        greyed
          ? // I6 audit F5: the old blanket opacity-60 sank body text to 2.3:1
            // (light) / 2.0:1 (dark). Grey-out now = softened surface + muted
            // value colour; every string stays ≥4.5:1.
            'bg-currena-soft/40 ring-black/[0.06] dark:bg-white/[0.03] dark:ring-white/[0.08]'
          : 'bg-white ring-black/[0.06] dark:bg-[#1A222E] dark:ring-white/[0.08]'
      }`}
      data-status={reading.status}
    >
      <h4 className="m-0 text-[0.95rem] font-bold leading-snug" aria-labelledby={`${nameId} ${chipId}`}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-labelledby={`${nameId} ${chipId}`}
          onClick={() => onToggle(reading.id)}
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
        >
          <span className="flex items-start justify-between gap-2">
            <span id={nameId}>
              {ind.name}
              {ind.ticker ? (
                <span className="ms-1.5 text-[0.7rem] font-semibold text-currena-muted" dir="ltr">
                  {ind.ticker}
                </span>
              ) : null}
            </span>
            <span id={chipId}>
              <StatusChip status={reading.status} copy={copy} />
            </span>
          </span>

          {isUnavailable ? (
            <span className="mt-2 block text-sm text-currena-muted">{copy.ui.unavailableCard}</span>
          ) : (
            <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <bdi className={`text-xl font-extrabold tabular-nums ${greyed ? 'text-currena-muted' : ''}`}>{valueText}</bdi>
              <ChangeRun
                change={reading.change7d}
                changeKind={def.changeKind}
                label={copy.ui.days7}
                numberLocale={numberLocale}
                copy={copy}
              />
              <ChangeRun
                change={reading.change30d}
                changeKind={def.changeKind}
                label={copy.ui.days30}
                numberLocale={numberLocale}
                copy={copy}
              />
            </span>
          )}

          {!isUnavailable && ind.oneLiner ? (
            <span className="mt-2 block text-[0.82rem] leading-relaxed text-currena-muted">{ind.oneLiner}</span>
          ) : null}

          {!isUnavailable && reading.percentile10y !== undefined ? (
            <PositionBar
              percentile={reading.percentile10y}
              zone={warningZone(def.rule)}
              copy={copy}
              numberLocale={numberLocale}
            />
          ) : null}

          <span className="mt-3 flex items-center justify-between gap-2 text-[0.7rem] text-currena-muted">
            <span>
              {reading.asOf ? interpolate(copy.ui.updatedOn, { date: formatAsOf(reading.asOf, locale) }) : '—'}
              <span className="mx-1.5 opacity-50">·</span>
              {copy.ui.sourceLabel}: {reading.sourceName}
            </span>
            <span
              aria-hidden="true"
              className={`shrink-0 text-xs transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </span>
        </button>
      </h4>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          className="mt-3 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]"
        >
          <h4 id={headingId} className="sr-only">
            {ind.name}
          </h4>

          <p className="m-0 mb-3 rounded-xl bg-currena-soft/70 px-3 py-2.5 text-sm font-medium text-currena-dark dark:bg-white/[0.05]">
            <span className="font-bold">{copy.ui.ruleTitle}: </span>
            <span>{formatRuleText(def.rule, reading.id, copy.rule, copy.units, numberLocale)}</span>
          </p>

          {isStale && reading.asOf ? (
            <p className="m-0 mb-3 text-xs font-semibold text-currena-warning-deep">
              {interpolate(copy.ui.staleSince, { date: formatAsOf(reading.asOf, locale) })}
            </p>
          ) : null}
          {reading.status === 'no-history' ? (
            <p className="m-0 mb-3 text-xs font-semibold text-currena-muted">{copy.ui.noHistoryStatus}</p>
          ) : null}
          {def.rule.kind === 'info' ? (
            <p className="m-0 mb-3 text-xs font-semibold text-currena-blue-deep">{copy.ui.infoOnly}</p>
          ) : null}

          <div className="flex flex-col gap-4">
            <CopySection title={copy.ui.whatItIs} body={ind.whatItIs} />
            <CopySection title={copy.ui.whyItMatters} body={ind.whyItMatters} />
            <CopySection title={copy.ui.tendedToMean} body={ind.tendedToMean} />
            <CopySection title={copy.ui.cantTell} body={ind.cantTell} />
            <CopySection title={copy.ui.forYou} body={ind.forYou} />
          </div>

          {!isUnavailable ? (
            <CardHistory id={reading.id} copy={copy} locale={locale} numberLocale={numberLocale} />
          ) : null}

          {reading.sourceUrl ? (
            <p className="mb-0 mt-3 text-xs">
              <a
                href={reading.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-currena-blue/10 px-3 py-1 font-semibold text-currena-blue-deep transition-colors duration-300 hover:bg-currena-blue/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
              >
                {reading.sourceName}
                <span aria-hidden="true">↗</span>
                <span className="sr-only">{copy.ui.viewSource}</span>
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
