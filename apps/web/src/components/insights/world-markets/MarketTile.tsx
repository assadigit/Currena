/**
 * world-markets/MarketTile + MarketDetail — one market's tile (§6.3, the
 * quiet-by-default button) and its detail panel (§6.5: three plain
 * lines + the 52-week chart). Split from WorldMarkets.tsx; code moved
 * verbatim.
 */

import { useMemo } from 'react';
import type { MarketEntry, MarketId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { decodeWeeklySeries } from '@currena/insights/markets/definitions';
import { MarketsChart } from '../MarketsChart';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { formatAsOf } from '../HistoryChart';
import {
  DirectionGlyph,
  fmtClose,
  isOld,
  signedPct,
  statusToneOf,
  statusWordKeyOf,
  TREND_WORD_OF,
  tradingDaysBehind,
  trendOf,
  viewValue,
  type MarketsView,
} from './shared';

/* ------------------------------------------------------------------ *
 * One market tile (§6.3): quiet by default, real button, aria-expanded
 * ------------------------------------------------------------------ */

export function MarketTile({
  entry,
  view,
  open,
  copy,
  locale,
  numberLocale,
  todayIso,
  freshestIso,
  onToggle,
}: {
  entry: MarketEntry;
  view: MarketsView;
  open: boolean;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  todayIso: string;
  /** Step-1 A7: the snapshot's freshest close — the delayed tag's baseline. */
  freshestIso: string;
  onToggle: (id: MarketId, opener: HTMLElement | null) => void;
}) {
  const marketCopy = copy.markets.entries[entry.id];
  const { pct, arrow } = viewValue(entry, view);
  const old = isOld(entry, todayIso);
  const delayed = !old && tradingDaysBehind(entry.asOf, freshestIso) > 1;
  // Step-1 F5: EVERY tile shows its distance from the 52-week high
  // (S&P 500 and Nasdaq included — not only the correcting markets).
  const tagX = formatNumber(Math.abs(entry.fromHigh), numberLocale, { maximumFractionDigits: 0 });
  const oldDate = formatAsOf(entry.asOf, locale);
  const trendWord = copy.markets[TREND_WORD_OF[trendOf(entry)]];

  return (
    <button
      type="button"
      id={`insights-market-tile-${entry.id}`}
      aria-expanded={open}
      onClick={(e) => onToggle(entry.id, e.currentTarget)}
      className={`insights-focusable flex min-h-[44px] w-full cursor-pointer flex-col items-start gap-0.5 rounded-[var(--radius-md)] px-2.5 py-2 text-start ring-1 transition-colors ${
        entry.status === 'correction'
          ? 'ring-currena-warning/30 hover:bg-currena-warning/[0.06]'
          : entry.status === 'bear'
            ? 'ring-currena-warning/40 hover:bg-currena-warning/[0.06]'
            : 'ring-[var(--color-border)] hover:bg-currena-soft/60'
      } ${old ? 'opacity-80' : ''} bg-[var(--color-surface)]`}
    >
      {/* §6.3 "short name" — the full name wraps to at most two lines
       * ("Shanghai Composite"); never truncated into guesswork. */}
      <span className="w-full text-[length:var(--type-caption)] font-bold leading-snug text-[var(--color-text-secondary)]">
        {marketCopy.name}
      </span>
      {/* The number + the owner's up/down artwork: the signed number
       * carries the meaning, the green/red zigzags ride beside it (round
       * 44) — direction is never colour alone (§6.8). */}
      <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
        <bdi dir="ltr" className="type-number tabular-nums">
          {signedPct(pct, numberLocale, locale)}
        </bdi>
        <DirectionGlyph arrow={arrow} />
      </span>
      {/* Step-1 F5: the 52-week distance rides EVERY tile — the correcting
       * markets keep their warning tone; a market at its high says so. */}
      {entry.fromHigh > -0.5 ? (
        <span className="inline-flex items-center rounded-full bg-currena-success/10 px-2 py-0.5 text-[0.68rem] font-bold text-[var(--color-status-normal)]">
          {copy.markets.atHighTag}
        </span>
      ) : (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${
            statusToneOf(entry.fromHigh)
          }`}
        >
          {interpolate(copy.markets.tileTagBelow, { x: tagX })}
        </span>
      )}
      {delayed ? (
        <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)]">
          {copy.markets.delayedTag}
        </span>
      ) : null}
      {old ? (
        <span className="inline-flex items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-stale)]">
          {interpolate(copy.markets.oldData, { date: oldDate })}
        </span>
      ) : null}
      <span className="sr-only">
        {trendWord}, {copy.markets[statusWordKeyOf(entry.fromHigh)]}, {interpolate(copy.markets.asOf, { date: oldDate })}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The detail panel (§6.5): three plain-language lines, the 52-week chart
 * (always left-to-right), and the numbers.
 * ------------------------------------------------------------------ */

export function MarketDetail({
  entry,
  copy,
  locale,
  numberLocale,
}: {
  entry: MarketEntry;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const marketCopy = copy.markets.entries[entry.id];
  const weekly = useMemo(() => decodeWeeklySeries(entry.weekly), [entry.weekly]);
  const rows: Array<[string, string]> = [
    [copy.markets.lastCloseLabel, fmtClose(entry.close, numberLocale)],
    [copy.markets.high52wLabel, fmtClose(entry.high52w, numberLocale)],
    [copy.markets.low52wLabel, fmtClose(entry.low52w, numberLocale)],
  ];
  return (
    <div
      id={`insights-market-detail-${entry.id}`}
      className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
    >
      <p className="m-0 mb-1 flex flex-wrap items-baseline gap-x-2 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {marketCopy.name}
        {locale === 'fa' ? (
          <span dir="ltr" className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
            {marketCopy.latin}
          </span>
        ) : null}
        <span className={`ms-auto inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${statusToneOf(entry.fromHigh)}`}>
          {copy.markets[statusWordKeyOf(entry.fromHigh)]}
        </span>
      </p>
      <dl className="m-0 mb-2 flex flex-col gap-1">
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailWhat}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {marketCopy.what}
          </dd>
        </div>
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailWhy}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {marketCopy.why}
          </dd>
        </div>
        <div>
          <dt className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">
            {copy.markets.detailYou}
          </dt>
          <dd className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90">
            {marketCopy.you}
          </dd>
        </div>
      </dl>
      {/* §6.5: time runs left to right on the chart in Farsi too. */}
      <div dir="ltr" className="not-prose">
        <MarketsChart
          weekly={weekly}
          close={entry.close}
          high52w={entry.high52w}
          low52w={entry.low52w}
          copy={copy}
          numberLocale={numberLocale}
        />
      </div>
      <dl className="m-0 mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dt className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{label}</dt>
            <dd className="m-0">
              <bdi dir="ltr" className="type-number font-semibold tabular-nums text-[var(--color-text-primary)]">
                {value}
              </bdi>
            </dd>
          </div>
        ))}
        <div className="flex items-baseline gap-1.5">
          <dd className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(copy.markets.asOf, { date: formatAsOf(entry.asOf, locale) })}</bdi>
          </dd>
        </div>
      </dl>
    </div>
  );
}

