/**
 * PricesBoard — the prices strip, re-drawn by the financial-asset-cards
 * spec pack (17 Oct 2026; supersedes the owner-sketch anatomy of
 * 2026-10-17b while preserving every statistic it introduced) and polished
 * by the 2026-10-25b asset-cards round (title/unit header, one-line price
 * + currency, semantic detail sections, verified instrument notes).
 *
 * THE CARD ANATOMY (one anatomy, every tile, mobile AND desktop):
 *   1. ASSET HEADER — the tinted icon box vertically centred against the
 *      title block: the plain asset TITLE (semibold, ~18px) over the
 *      MEASUREMENT-BASIS SUBTITLE (~13px secondary — «هر اونس تروی» /
 *      "per troy ounce", verified against the served instrument). The
 *      unit no longer rides inside the title ("Gold price (ounce)");
 *   2. PRICE LINE — the current price and its currency on ONE baseline:
 *      the digits dominant (~28px bold, tabular) with the currency
 *      secondary beside it (fa «۴٬۱۶۶ دلار», en "US$4,166") — never on
 *      separate lines, never split apart by direction changes;
 *   3. FRESHNESS — the compact per-card "as of" date; never implies the
 *      four assets are synchronised;
 *   4. SEVEN-DAY TREND — THE movement story: the horizon label, the net
 *      percentage, a real-data day-spaced sparkline (PriceSparkline +
 *      price-trend.ts — the same window the percentage measures, never a
 *      fabricated line), and the documented trend word; an incomplete
 *      window says so;
 *   5. DAILY CHANGE — supporting information, explicitly labelled with
 *      its own period (vs the previous stored observation) so it can never
 *      be mistaken for the seven-day story;
 *   6. BRIEFING — one or two deterministic, evidence-grounded sentences
 *      (price-trend.ts briefingText: observed movement + an explicit
 *      hedge; Bitcoin volatility-aware; oil gets the drivers-evidence
 *      caveat; no causes, forecasts, probabilities or advice);
 *   7. «جزئیات بیشتر» / "More details" — opens the DETAILS SIDE PANEL
 *      (2026-10-26c, owner directive: "The more details must show up
 *      in side bar"). What used to expand inline inside the tile — the
 *      five semantic sections (2026-10-25b, unchanged in content) — now
 *      renders INSIDE the F5 side sheet (desktop: inline-end sheet; RTL:
 *      the start side; phones: bottom sheet) via PriceDetails.tsx, so
 *      the four cards stay compact and equal-height and the details get
 *      the panel's focus trap, Escape, scrim and focus-return for free:
 *        A تغییرات قیمت          — 7d/30d/90d/6m/1y, one «X گذشته» label family;
 *        B محدودهٔ قیمت در ۵۲ هفتهٔ گذشته — the range «۳٬۹۶۱ تا ۵٬۳۱۸ دلار»
 *                                  with «تا» between the endpoints, rendered
 *                                  in the locale's own direction;
 *        C سوابق تاریخی قیمت     — the 10-YEAR high with its date + basis
 *                                  (computePeaks reads the 10-year window —
 *                                  the label never claims an all-time record);
 *        D جایگاه قیمت نسبت به شاخص‌های مرجع — the 10-year price LEVEL (the
 *                                  clarified «بالا»), the 200-day average
 *                                  gap, the distance below the 10-year high,
 *                                  and the companion ratios;
 *        E منبع داده و زمان به‌روزرسانی — provider + instrument attribution,
 *                                  observation date vs fetch time, and the
 *                                  futures/blend coverage notes — shown ONLY
 *                                  when the SERVED attribution actually is
 *                                  that instrument (the live merge rewrites
 *                                  sourceName to the Yahoo futures attribution
 *                                  when a fresher quote wins; the EOD snapshot
 *                                  serves gold-api XAU/XAG spot — a futures
 *                                  note on a spot price would be false).
 *                                  (2026-10-26b: the former section F
 *                                  «دربارهٔ این اعداد» — the methodology
 *                                  note — was removed at the owner's
 *                                  direction; the methodology itself is
 *                                  unchanged and stays documented in
 *                                  price-trend.ts / price-stats.ts and
 *                                  the QA docs, just not on the card.)
 *
 * «بالا» CLARIFIED: the bare position word left the card face. The
 * metric it stood for — the reading's percentile inside its own 10-year
 * history — stays, in section D, named precisely ("Price level vs
 * 10-year range: High — top 20% of the decade") with a note that it
 * describes a LEVEL, not a direction.
 *
 * PERSIAN TYPOGRAPHY (2026-10-25b): section headings drop the latin-only
 * uppercase/letter-spacing treatments in fa (tracking breaks the visual
 * joining of Persian script); every mixed-direction value (the price
 * line, the range, the record row) is built from isolated <bdi> parts in
 * the locale's own flow — never reversed substrings.
 *
 * Kept from the previous anatomy: ONE anatomy for all four tiles, the
 * stretch grid, the whole-body click-through to the details panel (the
 * full chart, rule text and source live there — the «جزئیات بیشتر»
 * button now opens the SAME panel, with the price sections inside it),
 * honest "—" for a change that does not exist, and the failure-state
 * discipline — an unavailable/stale/failed fetch is a system message in
 * neutral ink, never an adverse market signal, and a missing trend is
 * never a flat line.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { Coins, PanelLeft, PanelRight } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fetchIndicatorHistory } from '../../lib/insights';
import { IconImg, indicatorIconUrl } from '../icons/currena';
import {
  PRICE_ROWS,
  definitionFor,
  formatChange,
  priceValueParts,
} from './config';
import { formatAsOf } from './HistoryChart';
import { ChangeValue } from './PriceDetails';
import { deriveTileStats, type TileStats } from './price-stats';
import {
  briefingText,
  cleanPriceSeries,
  PRICE_WINDOW_DAYS,
  windowFor,
  window7d,
  type TrendWindow,
} from './price-trend';
import { PriceSparkline } from './PriceSparkline';

/* ------------------------------------------------------------------ *
 * The board's period lenses — 2026-10-21 owner round ("add the same
 * option for prices in the prices section, for example oil silver gold
 * and bitcoin can be seen in different time formats by those toggle"):
 * the SAME lenses the world map's switch speaks. The trend row, the
 * sparkline, the trend word and the briefing all measure the SELECTED
 * window — never a hardcoded seven-day story beside a switch that says
 * something else. The Today lens rides the 1-day change (vs the previous
 * stored observation, price-stats' c1): a one-day window has no path to
 * draw, so it shows the signed change with its explicit basis instead of
 * a sparkline.
 * 2026-10-27 owner round ("add five year and 3 months to all view
 * points"): '3m' (90 days) and '5y' (1826 days) join — six lenses, the
 * same closed set the map's switch and the markets section speak.
 * ------------------------------------------------------------------ */

export type PriceLens = 'today' | '1w' | '1m' | '3m' | '1y' | '5y';

export const PRICE_LENSES: readonly PriceLens[] = ['today', '1w', '1m', '3m', '1y', '5y'];

/** The lens's own row label (the «X گذشته» family; Today for the daily
 * lens). */
function lensRowLabel(lens: PriceLens, copy: InsightsCopy): string {
  if (lens === 'today') return copy.ui.pastToday;
  if (lens === '1w') return copy.ui.past7days;
  if (lens === '1m') return copy.ui.change30dLabel;
  if (lens === '3m') return copy.ui.past90days;
  if (lens === '5y') return copy.ui.past5y;
  return copy.ui.stat1yChange;
}

/** The switch pill's own label (mirrors the map's periodToday… keys). */
function lensSwitchLabel(lens: PriceLens, copy: InsightsCopy): string {
  if (lens === 'today') return copy.ui.pricePeriodToday;
  if (lens === '1w') return copy.ui.pricePeriodWeek;
  if (lens === '1m') return copy.ui.pricePeriodMonth;
  if (lens === '3m') return copy.ui.pricePeriod3M;
  if (lens === '5y') return copy.ui.pricePeriod5Y;
  return copy.ui.pricePeriodYear;
}

/** The localized period phrase the briefing templates and the sparkline
 * aria interpolate ("over the past seven days" / "today"). */
function lensPeriodWord(lens: PriceLens, copy: InsightsCopy): string {
  if (lens === 'today') return copy.ui.sumPeriodToday;
  if (lens === '1w') return copy.ui.sumPeriod7d;
  if (lens === '1m') return copy.ui.sumPeriod30d;
  if (lens === '3m') return copy.ui.sumPeriod3M;
  if (lens === '5y') return copy.ui.sumPeriod5Y;
  return copy.ui.sumPeriod1y;
}

/** The Today lens's honest trend classification: |c1| ≥ 1% is the same
 * NET_DIRECTIONAL_PCT floor the window classification uses — a smaller
 * daily move is a range day, an absent one is no story at all. */
function trendOfDaily(c1: number | undefined): 'up' | 'down' | 'range' | null {
  if (c1 === undefined || !Number.isFinite(c1)) return null;
  if (c1 >= 1) return 'up';
  if (c1 <= -1) return 'down';
  return 'range';
}

/* ------------------------------------------------------------------ *
 * The tile's icon box — compact and supportive (spec 02 §5: never more
 * prominent than the name and price), same tinted-ring language as the
 * previous anatomy. One consistent size across all asset cards.
 * ------------------------------------------------------------------ */
function PriceIconBox({ id }: { id: IndicatorId }) {
  const icon = indicatorIconUrl(id);
  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] bg-currena-muted/[0.08] ring-1 ring-[var(--color-border)]"
    >
      {icon !== null ? (
        <IconImg src={icon} size={44} desktopSize={44} />
      ) : (
        <Coins aria-hidden strokeWidth={1.2} className="currena-icon h-6 w-6 text-[var(--color-text-secondary)]" />
      )}
    </span>
  );
}

/** One tile's client-derived data: the bullet statistics + every lens's
 * window (the 2026-10-21 switch computes 1w/1m/1y from the SAME stored
 * history — the Today lens reads price-stats' c1, no window needed;
 * the 2026-10-27 round adds the 3m/5y windows from the same series). */
interface TileData {
  stats: TileStats;
  trends: { '1w': TrendWindow | null; '1m': TrendWindow | null; '3m': TrendWindow | null; '1y': TrendWindow | null; '5y': TrendWindow | null };
}

/**
 * Client-side derived tile data for tiles whose history the browser still
 * has to fetch (module-cached fetch — the details panel reuses it). Every
 * value is computed from the stored history ALONE; a failed fetch is an
 * honest absence — "—" rows, no trend story, no fact bullets.
 */
function useTileData(ids: readonly IndicatorId[]): Partial<Record<string, TileData>> {
  const [derived, setDerived] = useState<Partial<Record<string, TileData>>>({});
  const needed = ids.join(',');
  useEffect(() => {
    if (!needed) return;
    let cancelled = false;
    for (const id of needed.split(',')) {
      void fetchIndicatorHistory(id as IndicatorId)
        .then((history) => {
          if (cancelled || !history) return;
          const series = cleanPriceSeries(history.points);
          const entry: TileData = {
            stats: deriveTileStats(history.points, definitionFor(id as IndicatorId).changeKind),
            trends: {
              '1w': window7d(series),
              '1m': windowFor(series, PRICE_WINDOW_DAYS['1m']),
              '3m': windowFor(series, PRICE_WINDOW_DAYS['3m']),
              '1y': windowFor(series, PRICE_WINDOW_DAYS['1y']),
              '5y': windowFor(series, PRICE_WINDOW_DAYS['5y']),
            },
          };
          setDerived((prev) => (prev[id] ? prev : { ...prev, [id]: entry }));
        })
        .catch(() => {
          /* honest absence — "—" rows, no trend, no bullets */
        });
    }
    return () => {
      cancelled = true;
    };
  }, [needed]);
  return derived;
}

/* ------------------------------------------------------------------ *
 * The tile
 * ------------------------------------------------------------------ */

function PriceTile({
  id,
  reading,
  copy,
  locale,
  numberLocale,
  data,
  lens,
  onFocusCard,
}: {
  id: IndicatorId;
  reading: IndicatorReading;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  data: TileData | undefined;
  /** The board's selected period lens (2026-10-21): every movement
   * surface on the card — the trend row, the sparkline, the trend word
   * and the briefing — measures THIS window. */
  lens: PriceLens;
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const def = definitionFor(id);
  const entry = copy.indicators[id];
  const subject = copy.ui.priceSubjects[id] ?? entry.name;

  const isUnavailable = reading.status === 'unavailable' || reading.value === null;
  const isStale = !isUnavailable && reading.status === 'stale';

  const stats = data?.stats;
  // A stale or unavailable reading contributes NO trend story: the window
  // would describe an old market as if it were current. A stale card still
  // renders its trend — qualified by the "data may be delayed" suffix in
  // the freshness row AND the briefing (spec 04 §8).
  // 2026-10-21: the window follows the SELECTED lens; the Today lens reads
  // the 1-day change (c1) instead of a window (it has no path to draw).
  const trend: TrendWindow | null = isUnavailable
    ? null
    : lens === 'today'
      ? null
      : (data?.trends[lens] ?? null);
  const netPct = lens === 'today' ? (isUnavailable ? undefined : stats?.c1) : trend?.netPct;
  const dailyTrend = lens === 'today' && !isUnavailable ? trendOfDaily(stats?.c1) : null;

  // The price line's split parts (task §5): number + currency on one
  // baseline, built from the display config — no string surgery.
  const price =
    reading.value !== null ? priceValueParts(id, reading.value, numberLocale, copy.units) : null;

  // The briefing (spec 03): deterministic templates, evidence only —
  // describing the SELECTED window through its {period} phrase (the
  // Today lens classifies the 1-day move with the same 1% floor).
  const summary = briefingText(
    {
      asset: id,
      subject,
      trend: lens === 'today' ? dailyTrend : (trend?.trend ?? null),
      stale: isStale,
      historyUnavailable: lens === 'today' ? dailyTrend === null : trend === null,
      period: lensPeriodWord(lens, copy),
    },
    copy.ui,
  );

  // The sparkline's accessible description: asset + window + the signed
  // move (or the honest "insufficient" word when the window is too thin).
  const ariaChange =
    netPct !== undefined && (lens === 'today' ? dailyTrend !== null : trend?.trend !== 'insufficient')
      ? formatChange(netPct, def.changeKind, numberLocale, copy.units)
      : copy.ui.trendInsufficient;

  /* -------------------- the collapsed-card facts -------------------- */

  // The daily change (feed first, stored-history derivation second — the
  // feed has no 1-day field, so this usually derives from the history).
  const c1 = stats?.c1;

  // 2026-10-29 owner round (the timeframe reference price): the selected
  // window's own STARTING PRICE, formatted through the same parts builder
  // as the main price — "when the user clicks another timeframe like 1
  // year, the main price must also update … or show that old price in a
  // parenthesis". The current price stays THE price; the window's basis
  // rides beside it in a muted parenthetical, so the net percentage's
  // denominator is on the card. Only for a real window (the Today lens
  // measures against the previous close — its own explicit-basis line
  // already says so).
  const lensRefPrice =
    lens !== 'today' && trend !== null && trend.trend !== 'insufficient'
      ? priceValueParts(id, trend.refValue, numberLocale, copy.units)
      : null;
  const lensRefText =
    lensRefPrice !== null
      ? interpolate(copy.ui.priceAtWindowStart, {
          period: lensRowLabel(lens, copy),
          // The parts join with the house spacing: prefix tight to the
          // number, the suffix word separated («۱۲۵٫۳۹ دلار»).
          value: `${lensRefPrice.prefix ?? ''}${lensRefPrice.number}${lensRefPrice.suffix !== null ? ` ${lensRefPrice.suffix}` : ''}`,
        })
      : null;

  /* ---------------------------- render ---------------------------- */

  // The card header's title + measurement-basis subtitle (2026-10-25b):
  // the unit is VERIFIED against the served instrument — gold/silver per
  // troy ounce (XAU/XAG spot and the GC=F/SI=F refresh both quote per
  // troy ounce), Brent per barrel (EIA spot / BZ=F), Bitcoin per coin.
  const cardTitle = copy.ui.priceCardTitles[id] ?? entry.name;
  const cardUnit = copy.ui.priceCardUnits[id] ?? null;

  return (
    <article
      id={`insights-card-${id}`}
      className={`price-row scroll-mt-24 flex h-full flex-col rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] ${
        isStale ? 'opacity-90' : ''
      }`}
      data-status={reading.status}
    >
      {/* The card body — rows 1–6, still the whole-surface click-through to
       * the details panel (the full chart + rule + source live there). The
       * article is a flex column and this button only GROWS into the space
       * the disclosure leaves it — a percentage height here would resolve
       * against the stretched grid item and push the disclosure + panel
       * out of the tile's box (the white-space bug the owner reported:
       * the panel rendered under the neighbouring cards). */}
      <button
        type="button"
        onClick={(e) => onFocusCard(id, e.currentTarget)}
        className="insights-focusable flex w-full grow cursor-pointer flex-col border-0 bg-transparent p-0 text-start"
      >
        {/* 1. ASSET HEADER — icon vertically centred against the title
         * block: plain title over the measurement-basis subtitle. No
         * tickers, no series ids, no unit inside the title. */}
        <span className="flex w-full items-center gap-2.5">
          <PriceIconBox id={id} />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold leading-snug text-[var(--color-text-primary)]">
              {cardTitle}
            </span>
            {cardUnit !== null ? (
              <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-text-secondary)]">
                {cardUnit}
              </span>
            ) : null}
          </span>
        </span>

        {isUnavailable ? (
          /* Honest unavailable state — a quiet system message, never a
           * market signal (spec 05 §5: no red, no alarm styling). */
          <span className="mt-4 block rounded-[var(--radius-md)] bg-currena-muted/[0.06] px-3 py-6 text-center text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
            {copy.ui.priceUnavailableCard}
          </span>
        ) : (
          <>
            {/* 2. THE PRICE LINE — price and currency on ONE baseline
             * (task §5): the digits dominant, the currency secondary,
             * grouped as a single semantic value. The parts ride in the
             * document's own direction (fa: «۴٬۱۶۶ دلار»; en: "US$4,166")
             * — each fragment isolated so a direction change can never
             * split or reorder them.
             *
             * 2026-10-29 owner round: when a period lens is selected, the
             * window's own STARTING price rides in a muted parenthetical
             * on the same row — the percentage's basis, on the card. */}
            <span className="mt-3 flex w-full flex-wrap items-baseline gap-x-1">
              {price !== null ? (
                <>
                  {price.prefix !== null ? (
                    <bdi className="type-number text-[15px] font-semibold leading-none text-[var(--color-text-secondary)]">
                      {price.prefix}
                    </bdi>
                  ) : null}
                  <bdi
                    className={`type-number tabular-nums text-[28px] font-bold leading-none tracking-tight ${
                      isStale ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'
                    }`}
                  >
                    {price.number}
                  </bdi>
                  {price.suffix !== null ? (
                    <bdi className="whitespace-nowrap text-[14px] font-semibold leading-none text-[var(--color-text-secondary)]">
                      {price.suffix}
                    </bdi>
                  ) : null}
                  {lensRefText !== null ? (
                    <bdi className="ms-1.5 whitespace-nowrap text-[12.5px] font-semibold leading-none text-[var(--color-text-tertiary)]">
                      ({lensRefText})
                    </bdi>
                  ) : null}
                </>
              ) : (
                <span className="type-number text-[var(--color-text-secondary)]">{copy.ui.na}</span>
              )}
            </span>

            {/* 3. FRESHNESS — per-card, compact; never implies the four
             * assets are synchronised. Stale data says so plainly. */}
            <span className="mt-1.5 flex w-full flex-wrap items-baseline gap-x-2 text-[11px] leading-4 text-[var(--color-text-tertiary)]">
              {reading.asOf ? (
                <bdi>{interpolate(copy.ui.pricesAsOf, { date: formatAsOf(reading.asOf, locale) })}</bdi>
              ) : (
                <bdi>{copy.ui.updatedUnknown}</bdi>
              )}
              {isStale ? <bdi className="font-semibold">{copy.ui.dataDelayed}</bdi> : null}
            </span>

            {/* 4. THE SELECTED-PERIOD TREND — the primary movement story
             * (2026-10-21: the lens the switch speaks — Today | 1 week |
             * 1 month | 1 year). The chart and the percentage share one
             * window (price-trend.ts); the trend word comes from the
             * documented classification; no window ⇒ an explicit
             * unavailable line, never a fake flat chart. The Today lens
             * rides the 1-day change with its EXPLICIT basis — a one-day
             * window has no path, so no sparkline and no trend word. */}
            <span className="mt-3 flex w-full flex-col gap-1 border-t border-[var(--color-border)] pt-3">
              <span className="flex w-full items-baseline justify-between gap-2">
                <span className="text-[length:var(--type-label)] font-medium text-[var(--color-text-secondary)]">
                  {lensRowLabel(lens, copy)}
                  {lens === 'today' ? (
                    <span
                      className="ms-1 whitespace-nowrap text-[11px] text-[var(--color-text-tertiary)]"
                      title={copy.ui.dailyChangeBasis}
                    >
                      ({copy.ui.dailyChangeBasis})
                    </span>
                  ) : null}
                </span>
                {lens === 'today' ? (
                  dailyTrend !== null && netPct !== undefined ? (
                    <ChangeValue value={netPct} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
                  ) : (
                    <bdi dir="ltr" className="tabular-nums text-[var(--color-text-secondary)]">{copy.ui.na}</bdi>
                  )
                ) : trend && netPct !== undefined && trend.trend !== 'insufficient' ? (
                  <ChangeValue value={netPct} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
                ) : null}
              </span>
              {lens === 'today' ? (
                /* The one-day lens has no path to draw: the honest
                 * unavailable line takes the sparkline's place when the
                 * previous close is not measurable either. */
                dailyTrend === null ? (
                  <span className="mt-1 flex h-[46px] items-center rounded-[var(--radius-md)] bg-currena-muted/[0.06] px-3 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                    {copy.ui.trendUnavailable}
                  </span>
                ) : null
              ) : trend ? (
                <PriceSparkline
                  points={trend.points}
                  ariaLabel={interpolate(copy.ui.sparklineAria, { asset: subject, period: lensPeriodWord(lens, copy), change: ariaChange })}
                  className="mt-1 w-full text-[var(--color-text-secondary)]"
                  height={46}
                />
              ) : (
                <span className="mt-1 flex h-[46px] items-center rounded-[var(--radius-md)] bg-currena-muted/[0.06] px-3 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                  {copy.ui.trendUnavailable}
                </span>
              )}
              {lens !== 'today' && trend ? (
                <span className="text-[length:var(--type-label)] leading-snug text-[var(--color-text-secondary)]">
                  {trend.trend === 'up'
                    ? copy.ui.trendUp
                    : trend.trend === 'down'
                      ? copy.ui.trendDown
                      : trend.trend === 'range'
                        ? copy.ui.trendRange
                        : trend.trend === 'mixed'
                          ? copy.ui.trendMixed
                          : copy.ui.trendInsufficient}
                </span>
              ) : null}
              {lens !== 'today' && trend?.incomplete ? (
                <span className="text-[11px] leading-4 text-[var(--color-text-tertiary)]">
                  {copy.ui.trendIncomplete}
                </span>
              ) : null}
            </span>

            {/* 5. DAILY CHANGE — supporting info, its own explicit period,
             * measured against the previous stored observation (the feed
             * has no 1-day field). A coexisting opposite sign is fine:
             * different windows, both labelled. HIDDEN in the Today lens —
             * that lens IS the daily story (the same number must never
             * render twice on one card). */}
            {lens === 'today' ? null : (
            <span className="mt-2.5 flex w-full items-baseline justify-between gap-2 text-[length:var(--type-label)]">
              <span className="min-w-0 text-[var(--color-text-secondary)]">
                {copy.ui.dailyChangeLabel}
                <span
                  className="ms-1 whitespace-nowrap text-[11px] text-[var(--color-text-tertiary)]"
                  title={copy.ui.dailyChangeBasis}
                >
                  ({copy.ui.dailyChangeBasis})
                </span>
              </span>
              <ChangeValue value={c1} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
            </span>
            )}

            {/* 6. THE BRIEFING — deterministic, evidence-grounded, hedged
             * (price-trend.ts); never a cause, forecast or advice. */}
            <span className="mt-2.5 block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
              {summary}
            </span>
          </>
        )}
        <span className="sr-only">, {copy.ui.viewCard}</span>
      </button>

      {/* 7. «جزئیات بیشتر» — opens the DETAILS SIDE PANEL (2026-10-26c,
       * owner directive: "The more details must show up in side bar").
       * Keyboard + touch, 44px target; the opener element carries back
       * into the panel for focus-return on close; the panel provides the
       * focus trap, Escape, the scrim and the responsive sheet (desktop
       * inline-end sheet / RTL start sheet / phone bottom sheet). The
       * panel-side affordance points toward the sheet's side. */}
      <button
        type="button"
        onClick={(e) => onFocusCard(id, e.currentTarget)}
        aria-haspopup="dialog"
        className="insights-focusable mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-secondary)]/60 hover:text-[var(--color-text-primary)]"
      >
        <span>{copy.ui.moreDetails}</span>
        {locale === 'fa' ? (
          <PanelLeft aria-hidden size={15} strokeWidth={2} className="shrink-0" />
        ) : (
          <PanelRight aria-hidden size={15} strokeWidth={2} className="shrink-0" />
        )}
      </button>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * The board
 * ------------------------------------------------------------------ */

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
  // 2026-10-21 owner round: the board's period lens — session-only state
  // (never stored, never fetched; the windows are all client-derived from
  // the SAME stored history). The default stays the card's classic primary
  // story, the seven-day window — the map's Today default is one tap away,
  // and every surface on the card re-measures when it is picked.
  const [lens, setLens] = useState<PriceLens>('1w');
  const byId = useMemo(() => new Map(readings.map((r) => [r.id as string, r])), [readings]);
  const rows = useMemo(
    () =>
      PRICE_ROWS.map((id) => ({ id, reading: byId.get(id) })).filter(
        (r): r is { id: IndicatorId; reading: IndicatorReading } => r.reading !== undefined,
      ),
    [byId],
  );
  const derived = useTileData(PRICE_ROWS);
  if (rows.length === 0) return null;

  /* The owner's post-deploy report (2026-10-24d): the prices block is the
   * densest strip on the page — a touch more air below it before the markets
   * section (the shared 28px page gap + this padding) so the two never read
   * as collided. */
  return (
    <section id="insights-prices" aria-labelledby="insights-prices-title" className="scroll-mt-24 pb-3">
      <h2 id="insights-prices-title" className="type-section m-0 mb-1">
        <span className="inline-flex items-center gap-1.5">
          <Coins aria-hidden size={26} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-secondary)]" />
          {copy.ui.pricesTitle}
        </span>
      </h2>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.ui.pricesSubtitle}
      </p>
      {/* The period switch (2026-10-21 owner round) — the SAME four lenses
       * the world map's segmented control speaks, in the map's own pill
       * style (including its 2026-10-21 −15% sizing): centred above the
       * grid, a real radiogroup with roving tabindex + arrow keys. */}
      <PricePeriodSwitch lens={lens} copy={copy} onChange={setLens} />
      {/* Four tiles, one grid, ONE anatomy (spec default order: Gold →
       * Silver → Oil → Bitcoin — PRICE_ROWS). Default stretch so the four
       * containers are the SAME height — the details no longer expand the
       * tile (they live in the side panel now), so the grid is stable. */}
      <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ id, reading }) => (
          <PriceTile
            key={id}
            id={id}
            reading={reading}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            data={derived[id]}
            lens={lens}
            onFocusCard={onFocusCard}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The period switch (2026-10-21 owner round) — the world map's segmented
 * control, on the prices board: Today | 1 week | 1 month | 1 year, the
 * map's pill styling (41px pills — its own 2026-10-21 −15% sizing — with
 * a <480px viewport step at 37px, matching the map's phone pills), a real
 * radiogroup, arrow keys ROVE focus + selection (the WAI-ARIA pattern the
 * map's switch already speaks).
 * ------------------------------------------------------------------ */

function PricePeriodSwitch({
  lens,
  copy,
  onChange,
}: {
  lens: PriceLens;
  copy: InsightsCopy;
  onChange: (l: PriceLens) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % PRICE_LENSES.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + PRICE_LENSES.length) % PRICE_LENSES.length;
    else return;
    e.preventDefault();
    onChange(PRICE_LENSES[next]!);
    requestAnimationFrame(() => {
      refs.current[next]?.focus();
    });
  };
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <div
        role="radiogroup"
        aria-label={copy.ui.pricePeriodSwitchAria}
        className="inline-flex max-w-full overflow-x-auto rounded-full bg-currena-soft/70 p-1 ring-1 ring-[var(--color-border)]"
      >
        {PRICE_LENSES.map((l, i) => {
          const selected = lens === l;
          return (
            <button
              key={l}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => onChange(l)}
              className={`insights-focusable min-h-[41px] cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1 text-[length:calc(var(--type-caption)*1.27)] font-semibold transition-colors max-[480px]:min-h-[37px] max-[480px]:px-2.5 max-[480px]:text-[length:calc(var(--type-caption)*1.06)] ${
                selected
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {lensSwitchLabel(l, copy)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
