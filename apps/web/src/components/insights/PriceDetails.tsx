/**
 * PriceDetails — the asset cards' expanded-detail sections, rendered in the
 * DETAILS SIDE PANEL (2026-10-26c, owner directive: "The more details must
 * show up in side bar"). What used to expand inline inside the tile — the
 * five semantic sections behind «جزئیات بیشتر» — now lives in the F5 side
 * sheet (desktop: inline-end sheet; phones: bottom sheet) that the button
 * opens, keeping the four cards compact and equal-height.
 *
 * The sections (2026-10-25b round, unchanged in content):
 *   A تغییرات قیمت                      — 7d/30d/90d/6m/1y, one «X گذشته»
 *                                        label family, shortest → longest;
 *   B محدودهٔ قیمت در ۵۲ هفتهٔ گذشته     — «۳٬۹۶۱ تا ۵٬۳۱۸ دلار» with «تا»
 *                                        between the endpoints, in the
 *                                        locale's own direction;
 *   C سوابق تاریخی قیمت                 — the 10-YEAR high + date + basis
 *                                        (computePeaks reads the 10-year
 *                                        window — never an all-time claim);
 *   D جایگاه قیمت نسبت به شاخص‌های مرجع — the 10-year price LEVEL (the
 *                                        clarified «بالا»), the 200-day
 *                                        average gap, the distance below the
 *                                        10-year high, the companion ratios;
 *   E منبع داده و زمان به‌روزرسانی      — provider + instrument attribution,
 *                                        observation date vs fetch time, and
 *                                        the futures/blend coverage notes —
 *                                        shown ONLY when the SERVED
 *                                        attribution actually is that
 *                                        instrument (a futures note on a
 *                                        gold-api XAU spot price would be
 *                                        false).
 *
 * Data discipline (unchanged): every derived value comes from the stored
 * history ALONE via the module-cached fetch (the same fetch the card's
 * sparkline and the panel's chart use — one network request, three
 * consumers). A failed fetch is an honest absence: "—" rows, no sections
 * that need the history. Missing values are never fabricated.
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatDate, formatJalaliDate, formatNumber } from '@currena/core';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fetchIndicatorHistory } from '../../lib/insights';
import { formatAsOf } from './HistoryChart';
import {
  changeToneClass,
  definitionFor,
  formatChange,
  formatIndicatorValue,
  indicatorValueParts,
  positionBand,
} from './config';
import { deriveTileStats, type TileStats } from './price-stats';
import { cleanPriceSeries, window7d, type TrendWindow } from './price-trend';

/* ------------------------------------------------------------------ *
 * Shared atoms (the card face reuses ChangeValue for its 7-day and
 * daily-change values; the sections are panel-only)
 * ------------------------------------------------------------------ */

/** One signed change: sign + arrow + tone together (never colour alone). */
export function ChangeValue({
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

/** One label : value row of the detail sections. */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="min-w-0 text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="m-0 min-w-0 text-end text-[var(--color-text-primary)]">{children}</dd>
    </div>
  );
}

/** One quiet context line of the detail sections (the notes block). */
function NoteLine({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-1.5 leading-relaxed text-[var(--color-text-secondary)]">
      <span aria-hidden className="select-none text-[var(--color-text-tertiary)]">•</span>
      <bdi className="min-w-0">{children}</bdi>
    </li>
  );
}

/**
 * One semantic section of the details. The latin-only heading treatments
 * (uppercase + letter-spacing) are applied in en ONLY — tracking visually
 * separates the joined strokes of Persian script.
 */
function PanelSection({
  title,
  locale,
  children,
}: {
  title: string;
  locale: 'en' | 'fa';
  children: ReactNode;
}) {
  return (
    <section>
      <h4
        className={`m-0 mb-2 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] ${
          locale === 'en' ? 'uppercase tracking-wide' : ''
        }`}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

/**
 * The 52-week range in the asset's own units — EN prefixes the currency on
 * both ends ('US$2,895 – US$4,305'), fa says it once («۲٬۸۹۵ تا ۴٬۳۰۵
 * دلار» — «تا» BETWEEN the endpoints, the currency attached to the whole
 * range). Pure formatting; the caller renders it in the locale's own
 * direction so the RTL flow — not a forced LTR island — orders the parts.
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

/** The reading's fetch time — Jalali + clock in fa, Gregorian + clock in en. */
function formatUpdatedAt(iso: string, locale: 'en' | 'fa'): string {
  return locale === 'fa'
    ? formatJalaliDate(iso, 'fa-IR', { withClock: true })
    : formatDate(iso, 'en-US', { withClock: true });
}

/* ------------------------------------------------------------------ *
 * The panel-side data (module-cached fetch — shared with the card's
 * sparkline and the panel's own chart)
 * ------------------------------------------------------------------ */

interface PricePanelData {
  stats: TileStats;
  trend: TrendWindow | null;
}

function usePricePanelData(id: IndicatorId): PricePanelData | undefined {
  // Keyed by id (not reset synchronously in the effect): the panel can
  // switch readings while mounted, and stale data must never render under
  // a new asset's sections — a mismatched key reads as "not yet loaded".
  const [entry, setEntry] = useState<{ id: IndicatorId; data: PricePanelData } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchIndicatorHistory(id)
      .then((history) => {
        if (cancelled || !history) return;
        setEntry({
          id,
          data: {
            stats: deriveTileStats(history.points, definitionFor(id).changeKind),
            trend: window7d(cleanPriceSeries(history.points)),
          },
        });
      })
      .catch(() => {
        /* honest absence — the sections degrade to the feed's own values */
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return entry?.id === id ? entry.data : undefined;
}

/* ------------------------------------------------------------------ *
 * The sections
 * ------------------------------------------------------------------ */

export function PriceDetailsSections({
  id,
  reading,
  copy,
  locale,
  numberLocale,
  byId,
}: {
  id: IndicatorId;
  reading: IndicatorReading;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  /** The full snapshot's readings — the companion lines read other assets. */
  byId: Map<string, IndicatorReading>;
}) {
  const data = usePricePanelData(id);
  const def = definitionFor(id);

  const isUnavailable = reading.status === 'unavailable' || reading.value === null;
  // An unavailable reading carries no story to tell: the panel's own status
  // lines already say so plainly — no empty sections below them.
  if (isUnavailable) return null;

  const stats = data?.stats;
  const trend = data?.trend ?? null;

  /* -------------------- the section facts -------------------- */

  // Feed First (every price reading carries 7d/30d/90d today), the
  // stored-history derivation second — EXCEPT the 7-day number, which
  // prefers the window the chart draws so the two can never disagree.
  const c7 = trend?.netPct ?? reading.change7d ?? stats?.c7;
  const c30 = reading.change30d ?? stats?.c30;
  const c90 = reading.change90d ?? stats?.c90;
  const c6m = stats?.c6m;
  const c1y = stats?.c1y;
  const has52 = stats?.low52 !== undefined && stats?.high52 !== undefined;

  // The clarified «بالا»: the reading's percentile band inside its own
  // 10-year history — a LEVEL, named precisely, explained in a note.
  const band =
    reading.percentile10y !== undefined ? positionBand(reading.percentile10y) : null;
  const levelWord =
    band === 'high'
      ? copy.ui.priceLevelHigh
      : band === 'low'
        ? copy.ui.priceLevelLow
        : band === 'typical'
            ? copy.ui.priceLevelTypical
            : null;

  // Section C — the record. computePeaks (packages/insights) reads the
  // 10-YEAR window: the label says exactly that, never "all-time".
  const peak = reading.peak;
  const peakParts = peak !== undefined ? indicatorValueParts(id, peak.value, numberLocale, copy.units) : null;

  // Section D — the distance below the 10-year high (the record's own
  // value and date live in section C; this line does not repeat them).
  const fromRecord =
    reading.fromPeak10y !== undefined && reading.fromPeak10y < 0 && peak !== undefined
      ? interpolate(copy.ui.priceBelow10yHigh, {
          // The gap is a percentage — the sign is carried by the wording
          // («پایین‌تر» / "below"), so the placeholder takes the magnitude
          // with the locale's percent glyph.
          pct: `${formatNumber(Math.abs(reading.fromPeak10y), numberLocale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}${numberLocale === 'fa-IR' ? '٪' : '%'}`,
        })
      : null;

  const ma200 =
    reading.ma200GapPct !== undefined && Math.abs(reading.ma200GapPct) >= 0.05
      ? interpolate(reading.ma200GapPct >= 0 ? copy.ui.ma200Above : copy.ui.ma200Below, {
          // The gap is a percentage — the sign rides INSIDE the {pct}
          // placeholder (locale percent glyph), per the template's intent.
          pct: `${formatNumber(Math.abs(reading.ma200GapPct), numberLocale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}${numberLocale === 'fa-IR' ? '٪' : '%'}`,
        })
      : null;

  // Section D — the companion lines, computed FROM THE SAME DISPLAYED
  // SNAPSHOT (gold's A$ line; Bitcoin's two metal ratios as ONE sentence —
  // fa's second ratio is a continuation of the first, and two separate
  // bullets read as a fragment).
  const companions: string[] = [];
  const goldAud = byId.get('gold-aud');
  if (id === 'gold-usd' && goldAud && goldAud.value !== null) {
    companions.push(
      interpolate(copy.ui.goldAudLine, {
        value: formatIndicatorValue('gold-aud', goldAud.value, numberLocale, copy.units),
      }),
    );
  }
  const goldReading = byId.get('gold-usd');
  const silverReading = byId.get('silver-usd');
  const btcReading = byId.get('btc-usd');
  if (
    id === 'btc-usd' &&
    btcReading?.value != null &&
    goldReading?.value != null &&
    goldReading.value > 0 &&
    silverReading?.value != null &&
    silverReading.value > 0
  ) {
    companions.push(
      interpolate(copy.ui.btcCompanions, {
        gold: formatNumber(btcReading.value / goldReading.value, numberLocale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
        silver: formatNumber(btcReading.value / silverReading.value, numberLocale, {
          maximumFractionDigits: 0,
        }),
      }),
    );
  }

  // Section E — the instrument coverage notes, shown ONLY when the SERVED
  // attribution actually is that instrument. The serve-time live merge
  // (packages/insights/prices) rewrites sourceName to the Yahoo futures
  // attribution when a fresher quote wins; the EOD snapshot serves
  // gold-api XAU/XAG spot. Matching the attribution string is the card's
  // honest way to know which instrument the number is.
  const sourceName = reading.sourceName ?? '';
  const servedFutures = /futures/i.test(sourceName);
  const servedBrentBlend = id === 'brent' && !servedFutures && /BZ=F/.test(sourceName);

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-md)] bg-currena-muted/[0.06] p-3.5 text-[length:var(--type-label)] dark:bg-white/[0.05]">
      {/* A — تغییرات قیمت: every window labelled with its own period, one
       * «X گذشته» label family, shortest → longest. */}
      <PanelSection title={copy.ui.sectionChanges} locale={locale}>
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
      </PanelSection>

      {/* B — محدودهٔ قیمت در ۵۲ هفتهٔ گذشته: the range as the section's
       * own display value, «۳٬۹۶۱ تا ۵٬۳۱۸ دلار» with «تا» between the
       * endpoints, rendered in the locale's own direction (a forced LTR
       * island is what scrambles mixed ranges). Only shown when the stored
       * window really spans the year (price-stats' 300-day guard). */}
      {has52 ? (
        <PanelSection title={copy.ui.section52w} locale={locale}>
          <p className="m-0">
            <bdi
              dir={numberLocale === 'fa-IR' ? 'rtl' : 'ltr'}
              className="text-[15px] font-semibold tabular-nums leading-relaxed text-[var(--color-text-primary)]"
            >
              {formatPriceRange(id, stats!.low52!, stats!.high52!, numberLocale, copy)}
            </bdi>
          </p>
        </PanelSection>
      ) : null}

      {/* C — سوابق تاریخی قیمت: the 10-year high, its date and its basis
       * (daily high vs daily close) — structured parts, each isolated,
       * flowing in the locale's own direction. */}
      {peak !== undefined && peakParts !== null ? (
        <PanelSection title={copy.ui.sectionRecords} locale={locale}>
          <dl className="m-0 flex flex-col gap-1.5">
            <DetailRow label={copy.ui.statRecordHigh}>
              <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                <bdi className="font-semibold tabular-nums">
                  {peakParts.value}
                  {peakParts.unit !== null ? ` ${peakParts.unit}` : ''}
                </bdi>
                <span aria-hidden className="text-[var(--color-text-tertiary)]">·</span>
                <bdi>{formatAsOf(peak.date, locale === 'fa' ? 'fa' : 'en')}</bdi>
                <span className="text-[length:var(--type-caption)] font-normal text-[var(--color-text-tertiary)]">
                  ({peak.basis === 'daily-high' ? copy.ui.peakBasisHigh : copy.ui.peakBasisClose})
                </span>
              </span>
            </DetailRow>
          </dl>
        </PanelSection>
      ) : null}

      {/* D — جایگاه قیمت نسبت به شاخص‌های مرجع: the 10-year LEVEL (the
       * clarified «بالا», with its level-not-direction note), the 200-day
       * average gap, the distance below the 10-year high, and the companion
       * ratios. */}
      {levelWord !== null || ma200 !== null || fromRecord !== null || companions.length > 0 ? (
        <PanelSection title={copy.ui.sectionReferences} locale={locale}>
          {levelWord !== null ? (
            <>
              <dl className="m-0 flex flex-col gap-1.5">
                <DetailRow label={copy.ui.priceLevelLabel}>
                  <span className="font-semibold">{levelWord}</span>
                </DetailRow>
              </dl>
              <p className="m-0 mt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
                {copy.ui.priceLevelNote}
              </p>
            </>
          ) : null}
          {ma200 !== null ? (
            <p className="m-0 mt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
              <bdi>{ma200}</bdi>
            </p>
          ) : null}
          {fromRecord !== null ? (
            <p className="m-0 mt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
              <bdi>{fromRecord}</bdi>
            </p>
          ) : null}
          {companions.length > 0 ? (
            <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
              {companions.map((n) => (
                <NoteLine key={n}>{n}</NoteLine>
              ))}
            </ul>
          ) : null}
        </PanelSection>
      ) : null}

      {/* E — منبع داده و زمان به‌روزرسانی: the provider + instrument
       * attribution (the source link), the observation date, the app's
       * fetch time (distinct from the observation when they differ), and
       * the honest coverage notes — the futures note ONLY when the served
       * price IS the futures quote, the blend note for Brent's EOD series.
       * The card FACE stays source-free — the owner's decree; the sidebar
       * and the panel footer carry the attribution. */}
      <PanelSection title={copy.ui.sectionSource} locale={locale}>
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
        {reading.updatedAt ? (
          <p className="m-0 mt-1 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
            <bdi>{interpolate(copy.ui.priceFetchedAt, { time: formatUpdatedAt(reading.updatedAt, locale) })}</bdi>
          </p>
        ) : null}
        {servedFutures ? (
          <p className="m-0 mt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            <bdi>{copy.ui.priceFuturesNote}</bdi>
          </p>
        ) : null}
        {servedBrentBlend ? (
          <p className="m-0 mt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
            <bdi>{copy.ui.priceBrentBlendNote}</bdi>
          </p>
        ) : null}
      </PanelSection>
    </div>
  );
}
