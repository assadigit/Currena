/**
 * The pairs table (§9.3 item 6) + the pair detail panel (§9.4): the desktop
 * table behind "Show all currency pairs", the mobile list variant, the
 * one-open-pair detail panel with its 1-year chart, and the tbody-safe
 * group header row injector (Phase 3-d split of the former
 * WorldCurrencies.tsx monolith — see the slim section shell
 * ../WorldCurrencies.tsx).
 */

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { formatNumber } from '@currena/core';
import type { FxPairEntry, FxPairId, FxSnapshot } from '@currena/core';
import { decodeWeeklySeries } from '@currena/insights/markets/definitions';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { interpolate } from '../../../i18n';
import { fxMoneyLine, fxPairRows, fxRuleCopyKey, fxTrendOf } from '../../../lib/fx-presentation';
import { formatAsOf } from '../HistoryChart';
import { GlossaryTip } from './GlossaryTip';
import { isOld, signedPct } from './display';

/* ------------------------------------------------------------------ *
 * The pairs table (§9.3 item 6) + the pair detail panel (§9.4)
 * ------------------------------------------------------------------ */

export function PairDetail({
  entry,
  snapshot,
  copy,
  locale,
  numberLocale,
  onClose,
}: {
  entry: FxPairEntry;
  snapshot: FxSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onClose: () => void;
}) {
  const entryCopy = copy.fx.entries[entry.id];
  const weekly = useMemo(() => decodeWeeklySeries(entry.weekly), [entry.weekly]);
  const num = (n: number, dp = 4): string => formatNumber(n, numberLocale, { maximumFractionDigits: dp });
  // v1.3 (CR §4.2 S5): the "what it means in money" line — the same line
  // in every pair's panel, using that pair's currencies.
  const moneyLine = useMemo(() => fxMoneyLine(entry, copy.fx, numberLocale), [entry, copy, numberLocale]);
  // §9.4: the patterns that use this pair, each linking back to its card.
  const usingRules = snapshot.rules.filter((r) => r.chart.series.some((s) => s.id === entry.id));
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
      <p className="m-0 mb-1 flex flex-wrap items-baseline justify-between gap-2 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        <span>{entryCopy.name}</span>
        <button
          type="button"
          onClick={onClose}
          className="insights-focusable inline-flex min-h-[36px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
        >
          {copy.fx.hideTable}
        </button>
      </p>
      <dl className="m-0 mb-2 flex flex-col gap-1">
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailWhat}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi>{entryCopy.what}</bdi>
          </dd>
        </div>
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailYou}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            <bdi>{entryCopy.you}</bdi>
          </dd>
        </div>
        {moneyLine !== null ? (
          <div>
            <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
              {copy.fx.moneyLabel}
            </dt>
            <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
              <bdi>{moneyLine}</bdi>
            </dd>
          </div>
        ) : null}
      </dl>
      {/* §9.4/§9.6: the 1-year line chart, time left to right even in Farsi. */}
      <div dir="ltr" className="not-prose">
        <PairYearChart weekly={weekly} copy={copy} />
      </div>
      <dl className="m-0 mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.csvColRate}</dt>
          <dd className="m-0">
            <bdi dir="ltr" className="type-number font-semibold tabular-nums text-[var(--color-text-primary)]">
              {num(entry.rate)}
            </bdi>
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.thToday}</dt>
          <dd className="m-0"><bdi dir="ltr">{signedPct(entry.chg.d1, numberLocale, locale)}</bdi></dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.thM1}</dt>
          <dd className="m-0"><bdi dir="ltr">{signedPct(entry.chg.m1, numberLocale, locale)}</bdi></dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.thM3}</dt>
          <dd className="m-0"><bdi dir="ltr">{signedPct(entry.chg.m3, numberLocale, locale)}</bdi></dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.fx.thY1}</dt>
          <dd className="m-0"><bdi dir="ltr">{signedPct(entry.chg.y1, numberLocale, locale)}</bdi></dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dd className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(copy.fx.asOf, { date: formatAsOf(entry.asOf, locale) })}</bdi>
          </dd>
        </div>
      </dl>
      {usingRules.length > 0 ? (
        <p className="m-0 mt-2 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
          <bdi>
            {copy.fx.pairsUsed}: {usingRules.map((r) => copy.fx.rules[fxRuleCopyKey(r.id)].name).join(' · ')}
          </bdi>
        </p>
      ) : null}
    </div>
  );
}

/** §9.4's 1-year line chart — the house stretched-SVG pattern, zero deps. */
function PairYearChart({ weekly, copy }: { weekly: readonly [number, number][]; copy: InsightsCopy }) {
  if (weekly.length < 2) {
    return <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">{copy.ui.na}</p>;
  }
  const PLOT_W = 320;
  const PLOT_H = 72;
  let min = Infinity;
  let max = -Infinity;
  for (const [, v] of weekly) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const pad = (max - min) * 0.05 || max * 0.001 || 1;
  min -= pad;
  max += pad;
  const firstDay = weekly[0]![0];
  const lastDay = weekly[weekly.length - 1]![0];
  const span = Math.max(1, lastDay - firstDay);
  const scaleY = (v: number): number => PLOT_H - ((v - min) / (max - min)) * PLOT_H;
  const scaleX = (day: number): number => ((day - firstDay) / span) * PLOT_W;
  const line = weekly
    .map(([day, v], i) => `${i === 0 ? 'M' : 'L'}${scaleX(day).toFixed(2)} ${Math.max(1, Math.min(PLOT_H - 1, scaleY(v))).toFixed(2)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: 72 }}
      role="img"
      aria-label={copy.fx.dollarChartAria}
    >
      <path d={line} fill="none" stroke="var(--color-text-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function PairsTable({
  snapshot,
  copy,
  locale,
  numberLocale,
  todayIso,
  onOpenPair,
}: {
  snapshot: FxSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  todayIso: string;
  onOpenPair: (id: FxPairId) => void;
}) {
  const rows = useMemo(() => fxPairRows(snapshot.pairs, 'group'), [snapshot.pairs]);
  const trendWord = { up: copy.fx.trendUp, flat: copy.fx.trendFlat, down: copy.fx.trendDown } as const;
  const trendGlyph = { up: '▲', flat: '→', down: '▼' } as const;
  let lastGroup: string | null = null;

  return (
    <>
      {/* Desktop (≥900px): the real table (§9.7). */}
      <div className="hidden min-[900px]:block">
        {/* §9.3: the one-line legend under the header (v1.3 §4.6: the
         * stronger/weaker term carries its glossary tip). */}
        <p className="m-0 mb-1 flex flex-wrap items-baseline text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {copy.fx.directionLegend}
          <GlossaryTip def={copy.fx.glossary.stronger.def} srLabel={copy.fx.glossary.stronger.term} />
        </p>
        <table className="w-full border-collapse text-[length:var(--type-caption)]">
          <caption className="sr-only">{copy.fx.tableLabel}</caption>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">
                <span className="inline-flex items-baseline">
                  {copy.fx.thPair}
                  <GlossaryTip def={copy.fx.glossary.pair.def} srLabel={copy.fx.glossary.pair.term} />
                </span>
              </th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thToday}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thM1}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thM3}</th>
              <th scope="col" className="px-2 py-1.5 text-end font-bold text-[var(--color-text-secondary)]">{copy.fx.thY1}</th>
              <th scope="col" className="px-2 py-1.5 text-start font-bold text-[var(--color-text-secondary)]">{copy.fx.thTrend}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry, group }) => {
              const groupHeader = group !== lastGroup ? copy.fx.groups[group] : null;
              lastGroup = group;
              const trend = fxTrendOf(entry);
              const old = isOld(entry, todayIso);
              return (
                <FragmentByKey key={entry.id} groupHeader={groupHeader} groupCount={rows.filter((r) => r.group === group).length}>
                  <tr
                    onClick={() => onOpenPair(entry.id)}
                    className="cursor-pointer border-b border-[var(--color-border)]/60 transition-colors last:border-b-0 hover:bg-currena-soft/50"
                  >
                    <th scope="row" className="px-2 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">
                      {copy.fx.entries[entry.id].name}
                      {entry.bigMove ? (
                        <span className="ms-1.5 inline-flex items-center rounded-full bg-currena-warning/10 px-2 py-0.5 text-[0.66rem] font-bold text-[var(--color-status-watch)]">
                          {copy.fx.bigMoveTag}
                        </span>
                      ) : null}
                      {old ? (
                        <span className="ms-1.5 inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.66rem] font-semibold text-[var(--color-text-stale)]">
                          {interpolate(copy.fx.oldData, { date: formatAsOf(entry.asOf, locale) })}
                        </span>
                      ) : null}
                    </th>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.d1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.m1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.m3, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 text-end tabular-nums"><bdi dir="ltr" className="font-semibold">{signedPct(entry.chg.y1, numberLocale, locale)}</bdi></td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-[var(--color-text-secondary)]">
                      <span aria-hidden="true" className="me-1">{trendGlyph[trend]}</span>
                      {trendWord[trend]}
                    </td>
                  </tr>
                </FragmentByKey>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile (<900px): rows show the 1-month change; tapping shows the
       * detail panel with all four periods (§9.3 item 6). */}
      <ul className="m-0 grid list-none gap-1 p-0 min-[900px]:hidden">
        {rows.map(({ entry, group }) => {
          const groupHeader = copy.fx.groups[group];
          const showGroup = entry.id === rows.find((r) => r.group === group)!.entry.id;
          return (
            <li key={entry.id}>
              {showGroup ? (
                <p className="m-0 mb-0.5 mt-2 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
                  {groupHeader}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => onOpenPair(entry.id)}
                className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-2.5 py-2 text-start ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-soft/50"
              >
                <span className="min-w-0 flex-1 font-semibold text-[var(--color-text-primary)]">
                  {copy.fx.entries[entry.id].name}
                </span>
                <span className="text-[length:var(--type-caption)] font-semibold tabular-nums">
                  <bdi dir="ltr">{signedPct(entry.chg.m1, numberLocale, locale)}</bdi>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="m-0 mt-2 text-[0.66rem] text-[var(--color-text-tertiary)]">
        {copy.fx.footerLine}
      </p>
    </>
  );
}

/** A tbody-safe group header row injector (keeps the <table> semantic). */
function FragmentByKey({
  children,
  groupHeader,
  groupCount,
}: {
  children: ReactElement;
  groupHeader: string | null;
  groupCount: number;
}) {
  if (groupHeader === null) return children;
  return (
    <>
      <tr className="border-b border-[var(--color-border)]/40">
        <th scope="colgroup" colSpan={6} className="px-2 py-1 text-start text-[0.7rem] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {groupHeader} ({groupCount})
        </th>
      </tr>
      {children}
    </>
  );
}
