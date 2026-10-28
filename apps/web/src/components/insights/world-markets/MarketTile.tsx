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
import { MarketLogo } from './MarketLogo';
import { Layer1Block } from '../layer1/Layer1Block';

import {
  DirTriangle,
  fmtClose,
  isOld,
  periodWord,
  returnToneClass,
  signOf,
  signedPct,
  signedPctOrDash,
  statusToneOf,
  statusWordKeyOf,
  TREND_WORD_OF,
  tradingDaysBehind,
  trendOf,
  viewValue,
  type MarketsView,
} from './shared';

/* ------------------------------------------------------------------ *
 * One market tile (§6.3 + the handoff round's explorer row, §3.5): quiet
 * by default, real button, aria-expanded. The index wordmark rides in
 * the standardized frame with the CANONICAL NAME as primary text and
 * the country/market as the secondary line (the logo is supplementary —
 * it can never replace the written name).
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
  const { pct } = viewValue(entry, view);
  // 2026-10-27: the VALUE's ink + triangle follow the number's own SIGN
  // (the owner's bright-positive/bright-negative ask); the section's trend
  // WORDS keep the honest ±1% band (audit F2/F3) — see signOf in shared.
  const dir = signOf(pct);
  const old = isOld(entry, todayIso);
  const delayed = !old && tradingDaysBehind(entry.asOf, freshestIso) > 1;
  // Step-1 F5: EVERY tile shows its distance from the 52-week high
  // (S&P 500 and Nasdaq included — not only the correcting markets).
  const tagX = formatNumber(Math.abs(entry.fromHigh), numberLocale, { maximumFractionDigits: 0 });
  const oldDate = formatAsOf(entry.asOf, locale);
  const trendWord = copy.markets[TREND_WORD_OF[trendOf(entry)]];
  // §9: the screen reader hears the name, country, selected period and
  // value (or the missing-reading phrase) in the same sentence.
  const srValue = pct === null ? copy.markets.noReadingAria : signedPct(pct, numberLocale, locale);

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
      {/* The identity row: logo (supplementary) + canonical name + the
       * country/market line (§3.5 — every index is named AND located).
       * 2026-10-18 owner follow-up ("at least 96×96 px"): the wordmark
       * renders at 96px and STACKS above the name — the explorer tiles
       * stay narrow (2→7 columns), so a 96px logo beside the text would
       * starve the name; stacked keeps both readable at every grid width. */}
      <span className="flex w-full flex-col gap-1.5">
        <MarketLogo id={entry.id} latin={marketCopy.latin} size={96} desktopSize={96} />
        <span className="min-w-0">
          <span className="block truncate text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-secondary)]">
            {marketCopy.name}
          </span>
          <span className="block truncate text-[0.68rem] leading-snug text-[var(--color-text-tertiary)]">
            {marketCopy.country}
          </span>
        </span>
      </span>
      {/* The number + the 2026-10-27 owner round's bright return ink and
       * crisp triangle ("write the positive indexes with more clear and
       * bright green please a triangle showing up for green, and do the
       * same for red, down and brighter red"): the signed number carries
       * the meaning in the vivid dedicated RETURN tokens — brighter than
       * the calm status hues — with ▲ up / ▼ down / the exactly-zero dash
       * bar; colour is never alone (§6.8). A lens the row does not carry
       * yet shows the honest dash and no triangle — never a zero, never a
       * guess. */}
      <span className={`inline-flex items-center gap-1 font-semibold ${returnToneClass(dir)}`}>
        <bdi dir="ltr" className="type-number tabular-nums">
          {signedPctOrDash(pct, numberLocale, locale)}
        </bdi>
        {pct === null ? null : <DirTriangle dir={dir} size={11} />}
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
        {interpolate(copy.markets.heatmapValueAria, {
          name: marketCopy.name,
          country: marketCopy.country,
          value: srValue,
          period: periodWord(view, copy),
        })}
        , {trendWord}, {copy.markets[statusWordKeyOf(entry.fromHigh)]}, {interpolate(copy.markets.asOf, { date: oldDate })}
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
      {/* 2026-10-18 owner follow-up: the detail heading carries the same
       * ≥96px wordmark beside the name block (the panel is full-width, so
       * the horizontal identity row has room) — the same logo + name +
       * country anatomy every surface wears. */}
      <p className="m-0 mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <MarketLogo id={entry.id} latin={marketCopy.latin} size={96} desktopSize={96} />
        <span className="min-w-0">
          <span className="block truncate text-[length:var(--type-number)] font-bold leading-tight text-[var(--color-text-primary)]">
            {marketCopy.name}
          </span>
          <span className="block truncate text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
            {marketCopy.country}
            {locale === 'fa' ? (
              <span lang="en" dir="ltr" className="ms-1.5">
                {marketCopy.latin}
              </span>
            ) : null}
          </span>
        </span>
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
      {/* Layer 1 — the plain-language block for this market (spec §6,
       * DECISIONS D-17): oneLine lead + ifRising/ifFalling, emphasised by
       * the sign of the 3-month change (the section's normal timeframe),
       * + connections + the glossary list. Renders nothing until the
       * market's Layer-1 copy exists (graceful batch roll-out). */}
      <Layer1Block id={entry.id} locale={locale} copy={copy} changeDir={entry.chg3m} />
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

