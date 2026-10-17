/**
 * PricesBoard — round-2 Block R10, re-anatomised by R30 (roast 11 Oct),
 * re-drawn by the owner's sketch (17 Oct 2026).
 *
 * THE OWNER'S SKETCH ANATOMY (one anatomy, every tile, mobile AND desktop):
 *   1. the artwork BESIDE the unit name and price (price + unit at the
 *      start, the tinted icon box at the row's far end — no more stacked
 *      face);
 *   2. FOUR percentage rows under the price — daily / weekly / monthly /
 *      quarterly (the feed carries 7d/30d/90d on every price reading; the
 *      daily row and the fact bullets derive from the stored history —
 *      price-stats.ts, the R30 honesty rules: nearest-point ≤3 days,
 *      history-internal numbers, absent never fabricated);
 *   3. the description and the verdict — a "Description" label row whose
 *      far end carries the price-position verdict word (its status ink:
 *      expensive = the alert red, cheap = the supportive green — R31
 *      decree) above the hedged consequence line;
 *   4. the "more percentages and details" BULLET list — the derived facts
 *      (6-month change, 1-year change, 52-week range) then the context
 *      lines (the futures note, gold's A$ companion, Bitcoin's ratios,
 *      the 200-day gap, the record distance);
 *   5. the "as of" date in VERY small tertiary text, pinned to the tile's
 *      bottom (mt-auto) so the four tiles' footers align.
 *
 * Kept from R30: ONE anatomy for all four tiles, the stretch grid so the
 * containers share one width/height, the whole tile clickable (details
 * panel), honest "—" for a change that does not exist, and the alignment
 * decree (name in a fixed two-line slot; values end-aligned per row; the
 * fa unit on its own small line under the digits so every fa tile has the
 * SAME price-block height — beside-artifact wrapping is impossible).
 */

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { Coins } from 'lucide-react';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fetchIndicatorHistory } from '../../lib/insights';
import { IconImg, indicatorIconUrl } from '../icons/currena';
import {
  PRICE_ROWS,
  bandToneClass,
  bandWordsOf,
  consequenceLine,
  definitionFor,
  formatChange,
  formatIndicatorValue,
  indicatorValueParts,
  positionBand, formatPeakDistance } from './config';
import { formatAsOf } from './HistoryChart';
import { deriveTileStats, type TileStats } from './price-stats';

/* ------------------------------------------------------------------ *
 * The tile's icon box — gold wears the brand-gold accent (round 24),
 * the rest the quiet context tint (money-panel language). Owner sketch
 * (17 Oct 2026): the artwork sits BESIDE the name+price at the row's
 * far end — 96px on mobile (the full-width tile affords it), 72px on
 * ≥640px screens (the 4-across grid keeps a wide price column beside
 * it; the 256px sources downscale cleanly).
 * ------------------------------------------------------------------ */
function PriceIconBox({ id }: { id: IndicatorId }) {
  const isGold = id === 'gold-usd';
  const icon = indicatorIconUrl(id);
  return (
    <span
      aria-hidden="true"
      className={`grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] ring-1 ring-[var(--color-border)] sm:h-[72px] sm:w-[72px] ${
        isGold ? 'bg-[var(--color-accent-gold)]/25' : 'bg-currena-soft/70'
      }`}
    >
      {icon !== null ? (
        <IconImg src={icon} size={96} desktopSize={72} />
      ) : (
        <Coins
          aria-hidden
          strokeWidth={1.2}
          className="currena-icon text-[var(--color-status-context)]"
          style={{ '--icon-size': '96px', '--icon-size-sm': '72px' } as CSSProperties}
        />
      )}
    </span>
  );
}

/**
 * Client-side derived tile statistics (the daily % row + the fact bullets)
 * for tiles whose history the browser still has to fetch. Every value is
 * computed from the stored history ALONE (price-stats.ts); a failed fetch
 * is honest absence — the row shows "—", the bullet stays off the card.
 */
function useDerivedTileStats(ids: readonly IndicatorId[]): Partial<Record<string, TileStats>> {
  const [derived, setDerived] = useState<Partial<Record<string, TileStats>>>({});
  const needed = ids.filter((id) => PRICE_ROWS.includes(id)).join(',');
  useEffect(() => {
    if (!needed) return;
    let cancelled = false;
    for (const id of needed.split(',')) {
      void fetchIndicatorHistory(id as IndicatorId)
        .then((history) => {
          if (cancelled || !history) return;
          const stats = deriveTileStats(history.points, definitionFor(id as IndicatorId).changeKind);
          setDerived((prev) => (prev[id] ? prev : { ...prev, [id]: stats }));
        })
        .catch(() => {
          /* honest absence — "—" on the daily row, no fact bullets */
        });
    }
    return () => {
      cancelled = true;
    };
  }, [needed]);
  return derived;
}

/**
 * The 52-week range in the tile's own units — EN prefixes the currency on
 * both ends ('US$2,895 – US$4,305'), fa says it once («۲٬۸۹۵ تا ۴٬۳۰۵
 * دلار آمریکا»). Pure formatting; both parts ride in one <bdi dir="ltr">.
 */
function formatPriceRange(
  id: IndicatorId,
  low: number,
  high: number,
  numberLocale: 'en-US' | 'fa-IR',
  copy: InsightsCopy,
): string {
  const lo = indicatorValueParts(id, low, numberLocale, copy.units);
  const hi = indicatorValueParts(id, high, numberLocale, copy.units);
  const join = copy.ui.rangeJoin;
  if (numberLocale === 'fa-IR') {
    const unit = lo.unit ?? hi.unit ?? '';
    return `${lo.value} ${join} ${hi.value}${unit !== '' ? ` ${unit}` : ''}`;
  }
  const pre = lo.unit ?? '';
  return `${pre}${lo.value} ${join} ${pre}${hi.value}`;
}

/** One bullet row: marker + "label: value" (value isolated dir="ltr"). */
function FactItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span role="listitem" className="flex items-baseline gap-1.5" data-price-fact>
      <span aria-hidden className="select-none text-[var(--color-text-tertiary)]">•</span>
      <span className="min-w-0">
        {label}: <bdi dir="ltr" className="font-semibold tabular-nums">{value}</bdi>
      </span>
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
  const byId = useMemo(() => new Map(readings.map((r) => [r.id as string, r])), [readings]);
  const rows = useMemo(
    () =>
      PRICE_ROWS.map((id) => ({ id, reading: byId.get(id) })).filter(
        (r): r is { id: IndicatorId; reading: IndicatorReading } => r.reading !== undefined,
      ),
    [byId],
  );
  const derived = useDerivedTileStats(PRICE_ROWS);
  if (rows.length === 0) return null;

  const goldAud = byId.get('gold-aud');

  return (
    <section id="insights-prices" aria-labelledby="insights-prices-title" className="scroll-mt-24">
      <h2 id="insights-prices-title" className="type-section m-0 mb-1">
        <span className="inline-flex items-center gap-1.5">
          <Coins aria-hidden size={26} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
          {copy.ui.pricesTitle}
        </span>
      </h2>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.ui.pricesSubtitle}
      </p>
      {/* R10: four tiles, one grid, ONE anatomy. Default stretch so the four
       * containers are the SAME width and height — ragged tile bottoms read
       * as a layout bug (owner, 11 Oct). h-full on the tile + button keeps
       * the whole box clickable; mt-auto pins every footer line down. */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
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
          const valueParts =
            reading.value !== null
              ? indicatorValueParts(id, reading.value, numberLocale, copy.units)
              : null;

          // The four sketch windows: feed first (every price reading carries
          // 7d/30d/90d today), the stored-history derivation second; the
          // daily row is always derived (the feed has no 1-day field).
          const stats = derived[id];
          const c1 = stats?.c1;
          const c7 = reading.change7d ?? stats?.c7;
          const c30 = reading.change30d ?? stats?.c30;
          const c90 = reading.change90d ?? stats?.c90;
          const changeRows: Array<{ label: string; value: number | undefined }> = [
            { label: copy.ui.priceChangeDaily, value: c1 },
            { label: copy.ui.priceChangeWeekly, value: c7 },
            { label: copy.ui.priceChangeMonthly, value: c30 },
            { label: copy.ui.priceChangeQuarterly, value: c90 },
          ];

          // Defect E-03 (2026-10-16): Brent/gold/silver quote FUTURES (the
          // front-month contract extends/leads the series) — the tile says
          // so, so a futures price is never mistaken for spot.
          const contextParts: string[] = [];
          if (id === 'brent' || id === 'gold-usd' || id === 'silver-usd') {
            contextParts.push(copy.ui.exportFuturesNote);
          }
          if (id === 'gold-usd' && goldAud && goldAud.value !== null) {
            contextParts.push(
              interpolate(copy.ui.goldAudLine, {
                value: formatIndicatorValue('gold-aud', goldAud.value, numberLocale, copy.units),
              }),
            );
          }
          // Step-1 audit item C2 + fix spec B-16 (2026-10-14): the ratios
          // are computed FROM THE SAME DISPLAYED PRICES (btc ÷ gold, btc ÷
          // silver — one snapshot, no stored rounding in between).
          // Defect E-13 (2026-10-16): the sentence belongs on the BITCOIN
          // tile only.
          const goldReading = byId.get('gold-usd');
          const silverReading = byId.get('silver-usd');
          const btcReading = byId.get('btc-usd');
          if (id === 'btc-usd' && btcReading?.value != null && goldReading?.value != null && goldReading.value > 0) {
            const ozGold = formatNumber(btcReading.value / goldReading.value, numberLocale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
            contextParts.push(interpolate(copy.ui.btcBuysGold, { value: ozGold }));
          }
          if (id === 'btc-usd' && btcReading?.value != null && silverReading?.value != null && silverReading.value > 0) {
            const ozSilver = formatNumber(btcReading.value / silverReading.value, numberLocale, {
              maximumFractionDigits: 0,
            });
            contextParts.push(interpolate(copy.ui.btcBuysSilver, { value: ozSilver }));
          }
          // Step 3 L2-02 (runbook Phase 4): the 200-day average gap — a
          // standard definition, conditions only ("X% above/below").
          if (reading.ma200GapPct !== undefined) {
            const pct = formatNumber(Math.abs(reading.ma200GapPct), numberLocale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
            contextParts.push(
              interpolate(reading.ma200GapPct >= 0 ? copy.ui.ma200Above : copy.ui.ma200Below, { pct }),
            );
          }
          // Step-1 audit item C9 + fix spec B-01: distance from the record —
          // the peak, its date and its basis are named.
          const peakLine = formatPeakDistance(
            reading,
            numberLocale,
            copy.ui,
            (iso: string) => formatAsOf(iso, numberLocale === 'fa-IR' ? 'fa' : 'en'),
            (value: number) => formatIndicatorValue(id, value, numberLocale, copy.units),
          );
          if (peakLine !== null) {
            contextParts.push(peakLine);
          }

          // The sketch's fact bullets: the derived percentages first, then
          // the tile's context lines. A missing fact stays OFF the card.
          const c6m = stats?.c6m;
          const c1y = stats?.c1y;
          const has52 = stats?.low52 !== undefined && stats?.high52 !== undefined;
          const hasFacts = c6m !== undefined || c1y !== undefined || has52 || contextParts.length > 0;

          return (
            <article
              key={id}
              id={`insights-card-${id}`}
              className={`price-row scroll-mt-24 h-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] ${isStale ? 'opacity-80' : ''}`}
              data-status={reading.status}
            >
              <button
                type="button"
                onClick={(e) => onFocusCard(id, e.currentTarget)}
                className="insights-focusable block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-start"
              >
                <span className="flex h-full w-full flex-col items-start gap-1.5">
                  {/* 1. THE SKETCH'S HEADER ROW — the artwork beside the
                   * price: price block (big digits, the fa unit on its own
                   * small line under them so EVERY fa tile has the same
                   * price-block height) at the start, the tinted icon box
                   * at the row's far end. */}
                  <span className="flex w-full items-start justify-between gap-3">
                    <span className="flex min-w-0 flex-col items-start gap-0.5">
                      {valueParts !== null ? (
                        <>
                          <bdi
                            className={`type-number tabular-nums text-[var(--color-text-primary)] ${
                              isStale ? 'text-[var(--color-text-secondary)]' : ''
                            }`}
                          >
                            {valueParts.value}
                          </bdi>
                          {valueParts.unit !== null ? (
                            <bdi className="whitespace-nowrap text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-secondary)]">
                              {valueParts.unit}
                            </bdi>
                          ) : null}
                        </>
                      ) : (
                        <span className="type-number text-[var(--color-text-secondary)]">{copy.ui.na}</span>
                      )}
                      {/* Plain name — no tickers, no series ids (R14). The
                       * two-line min-height keeps the rows under it aligned
                       * across tiles even when a neighbour's name wraps. */}
                      <span className="min-h-[2.75em] text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-secondary)]">
                        {entry.name}
                      </span>
                    </span>
                    <PriceIconBox id={id} />
                  </span>
                  {/* 2. THE FOUR PERCENTAGE ROWS — daily / weekly / monthly
                   * / quarterly, one per line, values end-aligned (they
                   * share one edge in every tile). A change that does not
                   * exist renders the quiet "—", never a fabricated number. */}
                  <span className="flex w-full flex-col gap-[3px] text-[length:var(--type-caption)] text-[var(--color-text-secondary)]" data-price-changes>
                    {changeRows.map(({ label, value }) => (
                      <span key={label} className="flex items-baseline justify-between gap-2">
                        <span className="opacity-80">{label}</span>
                        <bdi dir="ltr" className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                          {value !== undefined ? formatChange(value, def.changeKind, numberLocale, copy.units) : '—'}
                        </bdi>
                      </span>
                    ))}
                  </span>
                  {/* 3. DESCRIPTION + VERDICT — the sketch's "Description"
                   * heading; the verdict word (the price-position band's
                   * status ink) rides the heading's far end, the hedged
                   * consequence line below. */}
                  {reading.status !== 'unavailable' ? (
                    <>
                      <span className="flex w-full flex-wrap items-baseline justify-between gap-x-2">
                        <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
                          {copy.ui.descriptionLabel}
                        </span>
                        {band && positionWord ? (
                          <span
                            className={`whitespace-nowrap text-[length:var(--type-caption)] font-bold ${
                              bandToneClass(band) || 'text-[var(--color-text-primary)]'
                            }`}
                            data-price-position={band}
                          >
                            {positionWord}
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                        {consequenceLine(reading, entry, true, bandWordsOf(copy))}
                      </span>
                    </>
                  ) : (
                    <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
                      {copy.ui.unavailableCard}
                    </span>
                  )}
                  {/* 4. THE FACT BULLETS — "more percentages and details":
                   * the derived stats (6-month change, 1-year change, the
                   * 52-week range) then the tile's context lines. */}
                  {hasFacts ? (
                    <span
                      role="list"
                      className="flex w-full flex-col gap-1 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]"
                      data-price-facts
                    >
                      {c6m !== undefined ? (
                        <FactItem
                          label={copy.ui.stat6mChange}
                          value={formatChange(c6m, def.changeKind, numberLocale, copy.units)}
                        />
                      ) : null}
                      {c1y !== undefined ? (
                        <FactItem
                          label={copy.ui.stat1yChange}
                          value={formatChange(c1y, def.changeKind, numberLocale, copy.units)}
                        />
                      ) : null}
                      {has52 ? (
                        <FactItem
                          label={copy.ui.stat52wRange}
                          value={formatPriceRange(id, stats!.low52!, stats!.high52!, numberLocale, copy)}
                        />
                      ) : null}
                      {contextParts.map((line) => (
                        <span key={line} role="listitem" className="flex items-baseline gap-1.5" data-price-fact>
                          <span aria-hidden className="select-none text-[var(--color-text-tertiary)]">•</span>
                          <bdi className="min-w-0">{line}</bdi>
                        </span>
                      ))}
                    </span>
                  ) : null}
                  {/* 5. "AS OF" IN VERY SMALL TEXT — pinned to the tile's
                   * bottom so the four footers align on the stretch grid.
                   * Owner request (sources off the cards): the tile does
                   * not name its source — the details panel and the
                   * About/sources section do. */}
                  <span className="mt-auto flex w-full flex-wrap items-baseline gap-x-2 pt-1 text-[10px] leading-4 text-[var(--color-text-tertiary)]">
                    {reading.asOf ? <bdi>{interpolate(copy.ui.pricesAsOf, { date: formatAsOf(reading.asOf, locale) })}</bdi> : null}
                    {reading.status === 'stale' && reading.asOf ? (
                      <bdi className="font-semibold">{interpolate(copy.ui.staleSince, { date: formatAsOf(reading.asOf, locale) })}</bdi>
                    ) : null}
                  </span>
                  <span className="sr-only">, {copy.ui.viewCard}</span>
                </span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
