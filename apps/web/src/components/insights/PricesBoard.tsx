/**
 * PricesBoard — the prices strip, re-drawn by the financial-asset-cards
 * spec pack (17 Oct 2026; supersedes the owner-sketch anatomy of
 * 2026-10-17b while preserving every statistic it introduced).
 *
 * THE SPEC-PACK ANATOMY (one anatomy, every tile, mobile AND desktop —
 * spec 02 §2):
 *   1. IDENTITY ROW — the tinted icon box + the asset's plain name (the
 *      card's identifying label; the icon stays supportive, never larger
 *      than the name and price);
 *   2. PRICE ROW — the current price as the dominant numeric element,
 *      the unit attached as smaller secondary text on its own line under
 *      the digits (the established fa-safe convention: every tile's price
 *      block shares one height, beside-artifact wrapping is impossible);
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
 *   7. DISCLOSURE — «جزئیات بیشتر» / "More details": the secondary
 *      statistics (30/90-day, 6-month, 1-year changes, the 52-week range,
 *      the clarified 10-year price LEVEL, the record high with its date
 *      and basis, the 200-day gap, the futures note, the companion lines)
 *      behind an accessible per-card expand/collapse — preserved, not
 *      deleted.
 *
 * «بالا» CLARIFIED: the bare position word left the card face. The
 * metric it stood for — the reading's percentile inside its own 10-year
 * history — stays, in the expanded section, named precisely ("Price
 * level vs 10-year range: High — top 20% of the decade") with a note
 * that it describes a LEVEL, not a direction.
 *
 * Kept from the previous anatomy: ONE anatomy for all four tiles, the
 * stretch grid, the whole-body click-through to the details panel (the
 * full chart, rule text and source live there), honest "—" for a change
 * that does not exist, and the failure-state discipline — an
 * unavailable/stale/failed fetch is a system message in neutral ink,
 * never an adverse market signal, and a missing trend is never a flat
 * line.
 */

import { useEffect, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { ArrowDown, ArrowUp, ChevronDown, Coins, Minus } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fetchIndicatorHistory } from '../../lib/insights';
import { IconImg, indicatorIconUrl } from '../icons/currena';
import {
  PRICE_ROWS,
  changeToneClass,
  definitionFor,
  formatChange,
  formatIndicatorValue,
  formatPeakDistance,
  indicatorValueParts,
  positionBand,
} from './config';
import { formatAsOf } from './HistoryChart';
import { deriveTileStats, type TileStats } from './price-stats';
import { briefingText, cleanPriceSeries, window7d, type TrendWindow } from './price-trend';
import { PriceSparkline } from './PriceSparkline';

/* ------------------------------------------------------------------ *
 * The tile's icon box — compact and supportive (spec 02 §5: never more
 * prominent than the name and price), same tinted-ring language as the
 * previous anatomy.
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

/** One tile's client-derived data: the bullet statistics + the 7-day window. */
interface TileData {
  stats: TileStats;
  trend: TrendWindow | null;
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
          const entry: TileData = {
            stats: deriveTileStats(history.points, definitionFor(id as IndicatorId).changeKind),
            trend: window7d(cleanPriceSeries(history.points)),
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

/**
 * The 52-week range in the tile's own units — EN prefixes the currency on
 * both ends ('US$2,895 – US$4,305'), fa says it once («۲٬۸۹۵ تا ۴٬۳۰۵
 * دلار»). Pure formatting; both parts ride in one <bdi dir="ltr">.
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

/** One signed change: sign + arrow + tone together (never colour alone). */
function ChangeValue({
  value,
  changeKind,
  numberLocale,
  copy,
  na,
}: {
  value: number | undefined;
  changeKind: 'pct' | 'points';
  numberLocale: 'en-US' | 'fa-IR';
  copy: InsightsCopy;
  na: string;
}) {
  if (value === undefined || !Number.isFinite(value)) {
    return <bdi dir="ltr" className="tabular-nums text-[var(--color-text-secondary)]">{na}</bdi>;
  }
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <bdi
      dir="ltr"
      className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
        changeToneClass(value) || 'text-[var(--color-text-primary)]'
      }`}
    >
      {formatChange(value, changeKind, numberLocale, copy.units)}
      <Icon aria-hidden size={12} strokeWidth={2.5} />
    </bdi>
  );
}

/** One label : value row of the expanded section. */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="min-w-0 text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="m-0 min-w-0 text-end text-[var(--color-text-primary)]">{children}</dd>
    </div>
  );
}

/** One quiet context line of the expanded section (the notes block). */
function NoteLine({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-1.5 leading-relaxed text-[var(--color-text-secondary)]">
      <span aria-hidden className="select-none text-[var(--color-text-tertiary)]">•</span>
      <bdi className="min-w-0">{children}</bdi>
    </li>
  );
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
  byId,
  data,
  onFocusCard,
}: {
  id: IndicatorId;
  reading: IndicatorReading;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  byId: Map<string, IndicatorReading>;
  data: TileData | undefined;
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
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
  const trend = isUnavailable ? null : (data?.trend ?? null);
  const netPct = trend?.netPct;

  const valueParts =
    reading.value !== null
      ? indicatorValueParts(id, reading.value, numberLocale, copy.units)
      : null;

  // The briefing (spec 03): deterministic templates, evidence only.
  const summary = briefingText(
    {
      asset: id,
      subject,
      trend: trend?.trend ?? null,
      stale: isStale,
      historyUnavailable: trend === null,
    },
    copy.ui,
  );

  // The sparkline's accessible description: asset + window + the signed
  // move (or the honest "insufficient" word when the window is too thin).
  const ariaChange =
    netPct !== undefined && trend?.trend !== 'insufficient'
      ? formatChange(netPct, def.changeKind, numberLocale, copy.units)
      : copy.ui.trendInsufficient;

  /* -------------------- the expanded-section facts -------------------- */

  // Feed first (every price reading carries 7d/30d/90d today), the
  // stored-history derivation second — EXCEPT the 7-day number, which
  // prefers the window the chart draws so the two can never disagree.
  const c1 = stats?.c1;
  const c7 = trend?.netPct ?? reading.change7d ?? stats?.c7;
  const c30 = reading.change30d ?? stats?.c30;
  const c90 = reading.change90d ?? stats?.c90;
  const c6m = stats?.c6m;
  const c1y = stats?.c1y;
  const has52 = stats?.low52 !== undefined && stats?.high52 !== undefined;

  // The clarified «بالا»: the reading's percentile band inside its own
  // 10-year history — a LEVEL, named precisely, explained in a note.
  const band =
    reading.percentile10y !== undefined && !isUnavailable ? positionBand(reading.percentile10y) : null;
  const levelWord =
    band === 'high'
      ? copy.ui.priceLevelHigh
      : band === 'low'
        ? copy.ui.priceLevelLow
        : band === 'typical'
          ? copy.ui.priceLevelTypical
          : null;

  const peak = reading.peak;
  const peakParts = peak !== undefined ? indicatorValueParts(id, peak.value, numberLocale, copy.units) : null;
  const fromRecord = !isUnavailable
    ? formatPeakDistance(
        reading,
        numberLocale,
        copy.ui,
        (iso: string) => formatAsOf(iso, numberLocale === 'fa-IR' ? 'fa' : 'en'),
        (value: number) => formatIndicatorValue(id, value, numberLocale, copy.units),
      )
    : null;

  const ma200 =
    !isUnavailable && reading.ma200GapPct !== undefined && Math.abs(reading.ma200GapPct) >= 0.05
      ? interpolate(reading.ma200GapPct >= 0 ? copy.ui.ma200Above : copy.ui.ma200Below, {
          // The gap is a percentage — the sign rides INSIDE the {pct}
          // placeholder (locale percent glyph), per the template's intent.
          pct: `${formatNumber(Math.abs(reading.ma200GapPct), numberLocale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}${numberLocale === 'fa-IR' ? '٪' : '%'}`,
        })
      : null;

  // The companion lines, computed FROM THE SAME DISPLAYED SNAPSHOT.
  const notes: string[] = [];
  if (!isUnavailable && (id === 'brent' || id === 'gold-usd' || id === 'silver-usd')) {
    notes.push(copy.ui.exportFuturesNote);
  }
  const goldAud = byId.get('gold-aud');
  if (id === 'gold-usd' && goldAud && goldAud.value !== null) {
    notes.push(
      interpolate(copy.ui.goldAudLine, {
        value: formatIndicatorValue('gold-aud', goldAud.value, numberLocale, copy.units),
      }),
    );
  }
  const goldReading = byId.get('gold-usd');
  const silverReading = byId.get('silver-usd');
  const btcReading = byId.get('btc-usd');
  if (id === 'btc-usd' && btcReading?.value != null && goldReading?.value != null && goldReading.value > 0) {
    const ozGold = formatNumber(btcReading.value / goldReading.value, numberLocale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    notes.push(interpolate(copy.ui.btcBuysGold, { value: ozGold }));
  }
  if (id === 'btc-usd' && btcReading?.value != null && silverReading?.value != null && silverReading.value > 0) {
    const ozSilver = formatNumber(btcReading.value / silverReading.value, numberLocale, {
      maximumFractionDigits: 0,
    });
    notes.push(interpolate(copy.ui.btcBuysSilver, { value: ozSilver }));
  }

  const hasDetails =
    !isUnavailable &&
    (c7 !== undefined ||
      c30 !== undefined ||
      c90 !== undefined ||
      c6m !== undefined ||
      c1y !== undefined ||
      has52 ||
      levelWord !== null ||
      peak !== undefined ||
      fromRecord !== null ||
      ma200 !== null ||
      notes.length > 0 ||
      reading.sourceName !== undefined);

  /* ---------------------------- render ---------------------------- */

  return (
    <article
      id={`insights-card-${id}`}
      className={`price-row scroll-mt-24 h-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] ${
        isStale ? 'opacity-90' : ''
      }`}
      data-status={reading.status}
    >
      {/* The card body — rows 1–6, still the whole-surface click-through to
       * the details panel (the full chart + rule + source live there). */}
      <button
        type="button"
        onClick={(e) => onFocusCard(id, e.currentTarget)}
        className="insights-focusable flex h-full w-full grow cursor-pointer flex-col border-0 bg-transparent p-0 text-start"
      >
        {/* 1. IDENTITY — icon + plain name (no tickers, no series ids). The
         * two-line min-height keeps the price rows aligned across tiles
         * even when a neighbour's name wraps. */}
        <span className="flex w-full items-center gap-2.5">
          <PriceIconBox id={id} />
          <span className="min-h-[2.75em] min-w-0 text-lg font-bold leading-snug text-[var(--color-text-primary)]">
            {entry.name}
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
            {/* 2. PRICE — the dominant numeric element; the unit rides in
             * its own small line under the digits (grouped, secondary,
             * fa-safe: every tile's price block shares one height). */}
            <span className="mt-3 flex w-full flex-col items-start gap-0.5">
              {valueParts !== null ? (
                <>
                  <bdi
                    className={`type-number tabular-nums text-[26px] font-bold leading-none tracking-tight ${
                      isStale ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'
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

            {/* 4. THE SEVEN-DAY TREND — the primary movement story. The
             * chart and the percentage share one window (price-trend.ts);
             * the trend word comes from the documented classification;
             * no window ⇒ an explicit unavailable line, never a fake
             * flat chart. */}
            <span className="mt-3 flex w-full flex-col gap-1 border-t border-[var(--color-border)] pt-3">
              <span className="flex w-full items-baseline justify-between gap-2">
                <span className="text-[length:var(--type-label)] font-medium text-[var(--color-text-secondary)]">
                  {copy.ui.past7days}
                </span>
                {trend && netPct !== undefined && trend.trend !== 'insufficient' ? (
                  <ChangeValue value={netPct} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
                ) : null}
              </span>
              {trend ? (
                <PriceSparkline
                  points={trend.points}
                  ariaLabel={interpolate(copy.ui.sparklineAria, { asset: subject, change: ariaChange })}
                  className="mt-1 w-full text-[var(--color-text-secondary)]"
                  height={46}
                />
              ) : (
                <span className="mt-1 flex h-[46px] items-center rounded-[var(--radius-md)] bg-currena-muted/[0.06] px-3 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                  {copy.ui.trendUnavailable}
                </span>
              )}
              {trend ? (
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
              {trend?.incomplete ? (
                <span className="text-[11px] leading-4 text-[var(--color-text-tertiary)]">
                  {copy.ui.trendIncomplete}
                </span>
              ) : null}
            </span>

            {/* 5. DAILY CHANGE — supporting info, its own explicit period,
             * measured against the previous stored observation (the feed
             * has no 1-day field). A coexisting opposite sign is fine:
             * different windows, both labelled. */}
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

            {/* 6. THE BRIEFING — deterministic, evidence-grounded, hedged
             * (price-trend.ts); never a cause, forecast or advice. */}
            <span className="mt-2.5 block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
              {summary}
            </span>
          </>
        )}
        <span className="sr-only">, {copy.ui.viewCard}</span>
      </button>

      {/* 7. «جزئیات بیشتر» — the per-card disclosure. Keyboard + touch,
       * state exposed (aria-expanded/aria-controls), focus stays on the
       * trigger, the chevron is the only thing that moves. */}
      {hasDetails ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="insights-focusable mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-secondary)]/60 hover:text-[var(--color-text-primary)]"
          >
            <span>{open ? copy.ui.lessDetails : copy.ui.moreDetails}</span>
            <ChevronDown
              aria-hidden
              size={15}
              strokeWidth={2}
              className={`shrink-0 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
          {open ? (
            <div
              id={panelId}
              className="mt-2.5 flex flex-col gap-3.5 rounded-[var(--radius-md)] bg-currena-muted/[0.06] p-3.5 text-[length:var(--type-label)] dark:bg-white/[0.05]"
            >
              {/* The changes — every window labelled with its own period. */}
              <section>
                <h4 className="m-0 mb-2 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {copy.ui.changesLabel}
                </h4>
                <dl className="m-0 flex flex-col gap-1.5">
                  <DetailRow label={copy.ui.past7days}>
                    <ChangeValue value={c7} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
                  </DetailRow>
                  <DetailRow label={copy.ui.change30dLabel}>
                    <ChangeValue value={c30} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
                  </DetailRow>
                  <DetailRow label={copy.ui.change90dLabel}>
                    <ChangeValue value={c90} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
                  </DetailRow>
                  <DetailRow label={copy.ui.stat6mChange}>
                    <ChangeValue value={c6m} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
                  </DetailRow>
                  <DetailRow label={copy.ui.stat1yChange}>
                    <ChangeValue value={c1y} changeKind={def.changeKind} numberLocale={numberLocale} copy={copy} na={copy.ui.na} />
                  </DetailRow>
                </dl>
              </section>

              {/* Ranges, records and the clarified price LEVEL. */}
              <section>
                <h4 className="m-0 mb-2 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {copy.ui.stat52wRange} · {copy.ui.statRecordHigh}
                </h4>
                <dl className="m-0 flex flex-col gap-1.5">
                  {has52 ? (
                    <DetailRow label={copy.ui.stat52wRange}>
                      <bdi dir="ltr" className="font-semibold tabular-nums">
                        {formatPriceRange(id, stats!.low52!, stats!.high52!, numberLocale, copy)}
                      </bdi>
                    </DetailRow>
                  ) : null}
                  {peak !== undefined && peakParts !== null ? (
                    <DetailRow label={copy.ui.statRecordHigh}>
                      <bdi dir="ltr" className="font-semibold tabular-nums">
                        {peakParts.value}
                        {peakParts.unit !== null ? ` ${peakParts.unit}` : ''} ·{' '}
                        {formatAsOf(peak.date, numberLocale === 'fa-IR' ? 'fa' : 'en')}{' '}
                        <span className="font-normal text-[var(--color-text-tertiary)]">
                          ({peak.basis === 'daily-high' ? copy.ui.peakBasisHigh : copy.ui.peakBasisClose})
                        </span>
                      </bdi>
                    </DetailRow>
                  ) : null}
                  {levelWord !== null ? (
                    <DetailRow label={copy.ui.priceLevelLabel}>
                      <span className="font-semibold">{levelWord}</span>
                    </DetailRow>
                  ) : null}
                </dl>
                {levelWord !== null ? (
                  <p className="m-0 mt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
                    {copy.ui.priceLevelNote}
                  </p>
                ) : null}
                {fromRecord !== null ? (
                  <p className="m-0 mt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
                    <bdi>{fromRecord}</bdi>
                  </p>
                ) : null}
                {ma200 !== null ? (
                  <p className="m-0 mt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
                    <bdi>{ma200}</bdi>
                  </p>
                ) : null}
              </section>

              {/* The context notes (futures basis, companions, ratios). */}
              {notes.length > 0 ? (
                <section>
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{notes.map((n) => <NoteLine key={n}>{n}</NoteLine>)}</ul>
                </section>
              ) : null}

              {/* Source + as-of + the method note (the card FACE stays
               * source-free — the owner's decree; the disclosure and the
               * details panel carry the attribution). */}
              <section>
                <h4 className="m-0 mb-2 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {copy.ui.priceSourceLabel}
                </h4>
                {reading.sourceUrl ? (
                  <a
                    href={reading.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="insights-focusable inline-flex items-center gap-1 rounded-full bg-currena-muted/10 px-3 py-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-currena-muted/20"
                  >
                    {reading.sourceName}
                    <span aria-hidden="true">↗</span>
                    <span className="sr-only">{copy.ui.viewSource}</span>
                  </a>
                ) : (
                  <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
                    {reading.sourceName}
                  </p>
                )}
                {reading.asOf ? (
                  <p className="m-0 mt-1.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
                    <bdi>{interpolate(copy.ui.pricesAsOf, { date: formatAsOf(reading.asOf, locale) })}</bdi>
                  </p>
                ) : null}
                <p className="m-0 mt-2.5 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
                  <span className="font-semibold">{copy.ui.aboutNumbersLabel}: </span>
                  {copy.ui.aboutNumbersBody}
                </p>
              </section>
            </div>
          ) : null}
        </>
      ) : null}
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

  return (
    <section id="insights-prices" aria-labelledby="insights-prices-title" className="scroll-mt-24">
      <h2 id="insights-prices-title" className="type-section m-0 mb-1">
        <span className="inline-flex items-center gap-1.5">
          <Coins aria-hidden size={26} strokeWidth={1.8} className="shrink-0 text-[var(--color-text-secondary)]" />
          {copy.ui.pricesTitle}
        </span>
      </h2>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.ui.pricesSubtitle}
      </p>
      {/* Four tiles, one grid, ONE anatomy (spec default order: Gold →
       * Silver → Oil → Bitcoin — PRICE_ROWS). Default stretch so the four
       * containers are the SAME height; each tile grows naturally when its
       * disclosure opens (spec 02 §5: never clip to force equal heights). */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ id, reading }) => (
          <PriceTile
            key={id}
            id={id}
            reading={reading}
            copy={copy}
            locale={locale}
            numberLocale={numberLocale}
            byId={byId}
            data={derived[id]}
            onFocusCard={onFocusCard}
          />
        ))}
      </div>
    </section>
  );
}
