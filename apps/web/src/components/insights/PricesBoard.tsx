/**
 * PricesBoard — round-2 Block R10: the prices STRIP.
 *
 * FOUR tiles with ONE identical anatomy: plain name, LARGE price with unit,
 * the 7-day and 30-day change (whichever exist, shown the same way for all),
 * a position word, one hedged practical consequence line, and "as of {date}".
 * Order: oil (Brent), gold (US$ with the A$ beside it), silver, Bitcoin.
 * No raw tickers or series ids anywhere. Copper and iron ore moved into the
 * indicator lanes (copper's definition group is growth-health; iron-ore was
 * always an au-trade-currency row).
 *
 * The Bitcoin ratios render as ONE small context line, labelled "context
 * only", placed BELOW the tile's anatomy so it can never overlap the price
 * (R17a — the old clipping bug dies with the tile grid).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import {
  BTC_RATIO_IDS,
  PRICE_ROWS,
  bandWordsOf,
  consequenceLine,
  definitionFor,
  formatChange,
  formatIndicatorValue,
  positionBand,
} from './config';
import { formatAsOf } from './HistoryChart';

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
      {/* R10: four tiles, one grid, identical anatomy. items-start so no
       * open item stretches its neighbours. */}
      <div className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
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

          // PB2 → R10: the Bitcoin tile's context ratios — one small line.
          const goldPerBtc = id === 'btc-usd' ? ratioRow('gold-btc') : undefined;
          const silverPerBtc = id === 'btc-usd' ? ratioRow('silver-btc') : undefined;

          return (
            <article
              key={id}
              id={`insights-card-${id}`}
              className={`price-row scroll-mt-24 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] ${isStale ? 'opacity-80' : ''}`}
              data-status={reading.status}
            >
              <button
                type="button"
                onClick={(e) => onFocusCard(id, e.currentTarget)}
                aria-expanded={false}
                className="insights-focusable block w-full cursor-pointer border-0 bg-transparent p-0 text-start"
              >
                <span className="flex w-full flex-col items-start gap-1">
                  {/* Plain name — no tickers, no series ids (R14). */}
                  <span className="text-[var(--type-label)] font-bold text-[var(--color-text-secondary)]">
                    {entry.name}
                  </span>
                  {/* The large price with unit — the largest text in the tile. */}
                  {valueText !== null ? (
                    <bdi dir="ltr" className={`type-number text-[var(--color-text-primary)] ${isStale ? 'text-[var(--color-text-secondary)]' : ''}`}>
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
                  {/* PB1: gold shows USD and AUD in the same tile. */}
                  {id === 'gold-usd' && goldAud && goldAud.value !== null ? (
                    <bdi className="text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                      {interpolate(copy.ui.goldAudLine, {
                        value: formatIndicatorValue('gold-aud', goldAud.value, numberLocale, copy.units),
                      })}
                    </bdi>
                  ) : null}
                  {/* Changes — whichever exist, rendered the same way. */}
                  {reading.change7d !== undefined || reading.change30d !== undefined ? (
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                      {reading.change7d !== undefined ? (
                        <bdi dir="ltr">
                          {formatChange(reading.change7d, def.changeKind, numberLocale, copy.units)}
                          <span className="ms-1 opacity-80">{copy.ui.days7}</span>
                        </bdi>
                      ) : null}
                      {reading.change30d !== undefined ? (
                        <bdi dir="ltr">
                          {formatChange(reading.change30d, def.changeKind, numberLocale, copy.units)}
                          <span className="ms-1 opacity-80">{copy.ui.days30}</span>
                        </bdi>
                      ) : null}
                    </span>
                  ) : null}
                  {band && positionWord ? (
                    <span className="text-[var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
                      {positionWord}
                    </span>
                  ) : null}
                  {/* One hedged practical consequence line. */}
                  {reading.status !== 'unavailable' ? (
                    <span className="block text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                      {consequenceLine(reading, entry, true, bandWordsOf(copy))}
                    </span>
                  ) : null}
                  {/* PB3: "as of {date}"; stale chips only past the limit. */}
                  <span className="flex flex-wrap items-baseline gap-x-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">
                    {reading.asOf ? <bdi>{interpolate(copy.ui.pricesAsOf, { date: formatAsOf(reading.asOf, locale) })}</bdi> : null}
                    {reading.status === 'stale' && reading.asOf ? (
                      <bdi className="font-semibold">{interpolate(copy.ui.staleSince, { date: formatAsOf(reading.asOf, locale) })}</bdi>
                    ) : null}
                  </span>
                  {/* The ratios: ONE small context line, BELOW the anatomy —
                   * it can never overlap the tile's price (R17a). */}
                  {id === 'btc-usd' && (goldPerBtc || silverPerBtc) ? (
                    <span className="block text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-btc-ratios>
                      <span className="font-bold">{copy.ui.btcRatiosLabel}</span>
                      {goldPerBtc && goldPerBtc.value !== null ? (
                        <span className="block">
                          <bdi>{interpolate(copy.ui.goldPerBtc, { value: formatIndicatorValue('gold-btc', goldPerBtc.value, numberLocale, copy.units) })}</bdi>
                        </span>
                      ) : null}
                      {silverPerBtc && silverPerBtc.value !== null ? (
                        <span className="block">
                          <bdi>{interpolate(copy.ui.silverPerBtc, { value: formatIndicatorValue('silver-btc', silverPerBtc.value, numberLocale, copy.units) })}</bdi>
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  <span className="sr-only"> — {copy.ui.viewCard}</span>
                </span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
