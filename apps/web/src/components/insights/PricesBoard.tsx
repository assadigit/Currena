/**
 * PricesBoard — Block PB1: "one compact row for each price. Show the plain
 * name, the price with unit, the 7-day and 30-day change, a position word
 * (low, typical, high versus the last 10 years), one consequence line, and
 * the 'as of' date." Order: oil (Brent), gold, silver, copper, iron ore,
 * Bitcoin. Gold shows USD and AUD in the same row (PB1). Bitcoin carries
 * the gold/silver-per-BTC ratios as context lines, "context only, not used
 * in signals" (PB2). Every row shows "as of {date}" (PB3) — the grey stale
 * chip appears only past the per-series freshness limit, which is where it
 * belongs (weekly EIA batches are normal, not stale).
 *
 * Prices are NOT scored cards (PB1 note) — plain rows, no vote framing.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import {
  BTC_RATIO_IDS,
  PRICE_ROWS,
  consequenceLine,
  definitionFor,
  formatChange,
  formatIndicatorValue,
  positionBand,
} from './config';
import { formatAsOf } from './HistoryChart';

function ChangeRuns({
  reading,
  def,
  copy,
  numberLocale,
}: {
  reading: IndicatorReading;
  def: ReturnType<typeof definitionFor>;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  if (reading.change7d === undefined && reading.change30d === undefined) return null;
  return (
    <span className="flex items-baseline gap-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">
      {reading.change7d !== undefined ? (
        <bdi dir="ltr" className="font-semibold tabular-nums">
          {formatChange(reading.change7d, def.changeKind, numberLocale, copy.units)}
          <span className="ms-1 opacity-80">{copy.ui.days7}</span>
        </bdi>
      ) : null}
      {reading.change30d !== undefined ? (
        <bdi dir="ltr" className="font-semibold tabular-nums">
          {formatChange(reading.change30d, def.changeKind, numberLocale, copy.units)}
          <span className="ms-1 opacity-80">{copy.ui.days30}</span>
        </bdi>
      ) : null}
    </span>
  );
}

export function PricesBoard({
  readings,
  copy,
  locale,
  numberLocale,
  onFocusCard,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const rows = PRICE_ROWS.map((id) => ({ id, reading: byId.get(id) })).filter(
    (r): r is { id: IndicatorId; reading: IndicatorReading } => r.reading !== undefined,
  );
  if (rows.length === 0) return null;

  const ratioRow = (id: IndicatorId): IndicatorReading | undefined =>
    BTC_RATIO_IDS.includes(id) ? byId.get(id) : undefined;
  const goldAud = byId.get('gold-aud');

  return (
    <section id="insights-prices" aria-labelledby="insights-prices-title" className="scroll-mt-24">
      <h2 id="insights-prices-title" className="m-0 mb-1 text-lg font-extrabold">
        {copy.ui.pricesTitle}
      </h2>
      <p className="m-0 mb-2 text-[var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.ui.pricesSubtitle}
      </p>
      <div className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]">
        {rows.map(({ id, reading }) => {
          const def = definitionFor(id);
          const entry = copy.indicators[id];
          const isStale = reading.status === 'stale' || reading.status === 'unavailable';
          const band =
            reading.percentile10y !== undefined
              ? positionBand(reading.percentile10y)
              : null;
          const positionWord = band
            ? band === 'low'
              ? copy.ui.pricePositionLow
              : band === 'high'
                ? copy.ui.pricePositionHigh
                : copy.ui.pricePositionTypical
            : null;
          const valueText =
            reading.value !== null ? formatIndicatorValue(id, reading.value, numberLocale, copy.units) : null;

          // PB2: the Bitcoin row's context ratios.
          const goldPerBtc = id === 'btc-usd' ? ratioRow('gold-btc') : undefined;
          const silverPerBtc = id === 'btc-usd' ? ratioRow('silver-btc') : undefined;

          return (
            <article
              key={id}
              id={`insights-card-${id}`}
              className={`price-row scroll-mt-24 ${isStale ? 'opacity-80' : ''}`}
              data-status={reading.status}
            >
              <button
                type="button"
                onClick={(e) => onFocusCard(id, e.currentTarget)}
                aria-expanded={false}
                className="insights-focusable block w-full cursor-pointer border-0 bg-transparent p-0 text-start"
              >
                <span className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">
                    {entry.name}
                  </span>
                  {entry.ticker ? (
                    <span dir="ltr" className="text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                      {entry.ticker}
                    </span>
                  ) : null}
                  {valueText !== null ? (
                    <bdi
                      dir={entry.ticker && copy.units.usd && numberLocale === 'en-US' ? 'ltr' : undefined}
                      className={`type-number ${isStale ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}
                    >
                      {valueText}
                    </bdi>
                  ) : (
                    <span className="type-number text-[var(--color-text-secondary)]">—</span>
                  )}
                  {reading.status === 'unavailable' ? (
                    <span className="text-[var(--type-caption)] text-[var(--color-text-secondary)]">
                      {copy.ui.unavailableCard}
                    </span>
                  ) : null}
                  {/* PB1: gold shows USD and AUD in the same row. */}
                  {id === 'gold-usd' && goldAud && goldAud.value !== null ? (
                    <bdi className="text-[var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
                      {interpolate(copy.ui.goldAudLine, {
                        value: formatIndicatorValue('gold-aud', goldAud.value, numberLocale, copy.units),
                      })}
                    </bdi>
                  ) : null}
                  {band && positionWord ? (
                    <span className="text-[var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
                      {positionWord}
                    </span>
                  ) : null}
                  <span className="ms-auto">
                    <ChangeRuns reading={reading} def={def} copy={copy} numberLocale={numberLocale} />
                  </span>
                </span>
                {/* PB1: the one consequence line + as-of. PB3: "as of {date}"
                 * — stale chips appear only past the freshness limit. */}
                {reading.status !== 'unavailable' ? (
                  <span className="mt-0.5 block text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                    {consequenceLine(reading, entry, true)}
                  </span>
                ) : null}
                <span className="mt-0.5 flex items-baseline gap-x-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">
                  {reading.asOf ? <bdi>{interpolate(copy.ui.pricesAsOf, { date: formatAsOf(reading.asOf, locale) })}</bdi> : null}
                  {reading.status === 'stale' && reading.asOf ? (
                    <bdi className="font-semibold">{interpolate(copy.ui.staleSince, { date: formatAsOf(reading.asOf, locale) })}</bdi>
                  ) : null}
                  {entry.unitNote ? <span aria-hidden="true">· {entry.unitNote}</span> : null}
                </span>
                {/* PB2: gold-per-Bitcoin + silver-per-Bitcoin context lines. */}
                {id === 'btc-usd' && (goldPerBtc || silverPerBtc) ? (
                  <span className="mt-1 block rounded-[var(--radius-sm)] bg-currena-soft/70 px-2.5 py-1.5 dark:bg-white/[0.05]">
                    <span className="block text-[var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
                      {copy.ui.btcRatiosLabel}
                    </span>
                    {goldPerBtc && goldPerBtc.value !== null ? (
                      <span className="block text-[var(--type-caption)] text-[var(--color-text-secondary)]">
                        <bdi>{interpolate(copy.ui.goldPerBtc, { value: formatIndicatorValue('gold-btc', goldPerBtc.value, numberLocale, copy.units) })}</bdi>
                      </span>
                    ) : null}
                    {silverPerBtc && silverPerBtc.value !== null ? (
                      <span className="block text-[var(--type-caption)] text-[var(--color-text-secondary)]">
                        <bdi>{interpolate(copy.ui.silverPerBtc, { value: formatIndicatorValue('silver-btc', silverPerBtc.value, numberLocale, copy.units) })}</bdi>
                      </span>
                    ) : null}
                  </span>
                ) : null}
                <span className="sr-only"> — {copy.ui.viewCard}</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
