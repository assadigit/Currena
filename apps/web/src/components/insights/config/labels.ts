/**
 * Card date/change labels + plain-language rule text (Phase 3-c split of
 * the former config.ts monolith — see ./index.ts). Pure, platform-free.
 */

import { formatNumber, formatDateWords } from '@currena/core';
import type { IndicatorId, MarketEntry, WarningRule, WarningRuleAtom } from '@currena/core';
import { cadenceUsesPreviousRelease } from '@currena/insights';
import { interpolate } from '../../../i18n';
import { DISPLAY } from './display';
import type { UnitLabels, UnitToken } from './display';
import { definitionFor } from './sections';

/* ------------------------------------------------------------------ *
 * Step-1 audit items B5/C6: the card's data-date line and the change
 * label — every card shows WHEN its data is from, and monthly/quarterly
 * changes say "since the previous release", never "30-day".
 * ------------------------------------------------------------------ */

/** Which change window label a reading's cadence demands. */
type ChangeWindowLabel = '7d' | '30d' | 'since-previous';

export function changeWindowLabel(id: IndicatorId): ChangeWindowLabel {
  const def = definitionFor(id);
  if (cadenceUsesPreviousRelease(def.cadence)) return 'since-previous';
  return '30d';
}

/* ------------------------------------------------------------------ *
 * Defect E-22 (2026-10-16) — Step 3 L2-01: the stock-market STATE words.
 * From the distance below the 52-week high (CLOSING basis — fromHigh is
 * last close vs the 52-week closing high): within 5%: Near its high ·
 * 5–10%: Pullback · 10–20%: Correction · 20% or more: Bear market. Common
 * market conventions, stated in the section's how-it-is-calculated copy.
 * The stored coarse band (m.status) keeps driving the summary counts; the
 * word the reader sees is this one.
 * ------------------------------------------------------------------ */

/** Correction → the needs-attention tone; Bear → the unusual tone (§8.2). */
export const STATUS_TONE: Record<MarketEntry['status'], string> = {
  normal: 'bg-currena-muted/15 text-[var(--color-text-secondary)]',
  correction: 'bg-currena-warning/15 text-[var(--color-status-alert)]',
  bear: 'bg-currena-warning/10 text-[var(--color-status-watch)]',
};

export type StockStateWordKey = 'statusNearHigh' | 'statusPullback' | 'statusCorrection' | 'statusBear';

export function statusWordKeyOf(fromHigh: number): StockStateWordKey {
  if (fromHigh > -5) return 'statusNearHigh';
  if (fromHigh > -10) return 'statusPullback';
  if (fromHigh > -20) return 'statusCorrection';
  return 'statusBear';
}

/** The tone follows the same L2-01 line the word reads from (E-22). */
export function statusToneOf(fromHigh: number): string {
  if (fromHigh > -10) return STATUS_TONE.normal;
  if (fromHigh > -20) return STATUS_TONE.correction;
  return STATUS_TONE.bear;
}

/**
 * "Data for August 2026" for monthly/quarterly observations (the asOf
 * month/quarter), "as of {date}" for daily ones. Locale-aware, UTC-safe
 * (formatDateWords' date-only fix).
 *
 * Defect E-07 (2026-10-16): when the reading carries its STORED period end
 * (snapshot.ts stamps periodStart/periodEnd on every quarterly reading),
 * the quarter is named from that end month — the sources disagree on the
 * dating basis (ABS/FRED quarter-start, RBA E2 quarter-end) and both must
 * label identically (2026-04-01 and 2026-06-30 are both "June quarter 2026").
 */
export function dataPeriodText(
  id: IndicatorId,
  asOf: string,
  locale: 'en' | 'fa',
  numberLocale: 'en-US' | 'fa-IR',
  periodEnd?: string,
): string {
  const def = definitionFor(id);
  if (def.cadence === 'quarterly') {
    // Fix spec B-07 (2026-10-14): quarterly data is labelled by QUARTER NAME
    // and period end ("June quarter 2026") — never a bare month name.
    if (periodEnd !== undefined) return quarterLabelFromPeriodEnd(periodEnd, locale);
    return quarterPeriodText(asOf, locale);
  }
  if (def.cadence === 'monthly' || def.cadence === 'manual') {
    const month = new Intl.DateTimeFormat(
      locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory',
      { month: 'long', year: 'numeric', timeZone: 'UTC' },
    ).format(new Date(`${asOf}T00:00:00Z`));
    return month;
  }
  return formatDateWords(asOf, numberLocale === 'fa-IR' ? 'fa-IR' : 'en-US');
}

/**
 * Fix spec B-07 (2026-10-14): "June quarter 2026" / «سه‌ماههٔ ژوئن ۲۰۲۶» —
 * the quarter named by its period END month (the Australian convention).
 * Quarterly observations are quarter-start dated (1 Apr → the June quarter).
 */
export function quarterPeriodText(asOf: string, locale: 'en' | 'fa'): string {
  const [y, m] = asOf.split('-').map(Number) as [number, number, number];
  const endMonth = m + 2 > 12 ? m - 10 : m + 2;
  const endYear = m + 2 > 12 ? y + 1 : y;
  return quarterLabelFromPeriodEnd(`${endYear}-${String(endMonth).padStart(2, '0')}-01`, locale);
}

/**
 * The quarter label from the period's END month (defect E-07, 2026-10-16):
 * "June quarter 2026" / «سه‌ماههٔ ژوئن ۲۰۲۶» — the Australian convention,
 * identical for both source dating bases.
 */
export function quarterLabelFromPeriodEnd(periodEnd: string, locale: 'en' | 'fa'): string {
  const [y, m] = periodEnd.split('-').map(Number) as [number, number, number];
  const monthName = new Intl.DateTimeFormat(
    locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory',
    { month: 'long', timeZone: 'UTC' },
  ).format(new Date(Date.UTC(y, m - 1, 1)));
  const yearText = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory', {
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, 0, 1)));
  return locale === 'fa' ? `سه‌ماههٔ ${monthName} ${yearText}` : `${monthName} quarter ${yearText}`;
}

/** "X.X% below its 10-year peak" — the C9 distance line (≤ 0, 1 decimal). */
export function formatFromPeak(
  fromPeak10y: number,
  numberLocale: 'en-US' | 'fa-IR',
  template: (pct: string) => string,
): string {
  const pct = formatNumber(Math.abs(fromPeak10y), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return template(pct);
}

/**
 * Fix spec B-01 (2026-10-14): the record-distance line names the peak value
 * and its date ("33.5% below its record $126,272 on 6 Oct 2025 (highest
 * daily high)") — computed from the full stored price history on one stated
 * basis, never a silent 10-year window. Falls back to the old line when the
 * reading carries no peak.
 */
export function formatPeakDistance(
  reading: { fromPeak10y?: number; peak?: { value: number; date: string; basis: 'daily-high' | 'daily-close' } },
  numberLocale: 'en-US' | 'fa-IR',
  copy: { belowPeak: string; belowPeakRecord: string; peakBasisHigh: string; peakBasisClose: string },
  formatDate: (iso: string) => string,
  formatValue: (value: number) => string,
): string | null {
  if (reading.fromPeak10y === undefined || reading.fromPeak10y >= -0.05) return null;
  const pct = formatNumber(Math.abs(reading.fromPeak10y), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  if (reading.peak === undefined) {
    return copy.belowPeak.replace('{pct}', pct);
  }
  return copy.belowPeakRecord
    .replace('{pct}', pct)
    .replace('{value}', formatValue(reading.peak.value))
    .replace('{date}', formatDate(reading.peak.date))
    .replace('{basis}', reading.peak.basis === 'daily-high' ? copy.peakBasisHigh : copy.peakBasisClose);
}

/* ------------------------------------------------------------------ *
 * Plain-language rule text (01-indicator-spec.md §4: every threshold
 * shown on the card; no hidden math)
 * ------------------------------------------------------------------ */

/** Copy fragments for rendering a WarningRule in plain language. */
interface RuleCopy {
  info: string;
  thresholdAbove: string;
  thresholdAboveSustained: string;
  thresholdBelow: string;
  thresholdBelowSustained: string;
  percentileHigh: string;
  percentileLow: string;
  changeRisePct: string;
  changeFallPct: string;
  changeRisePoints: string;
  changeFallPoints: string;
  yoyNegative: string;
  consecutiveDecline: string;
  aboveLow: string;
  belowAux: string;
  or: string;
}

function fmt(value: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(value, numberLocale, { maximumFractionDigits: 2 });
}

function ruleAtomText(
  atom: WarningRuleAtom,
  copy: RuleCopy,
  units: UnitLabels,
  numberLocale: 'en-US' | 'fa-IR',
  unitToken: UnitToken,
): string {
  switch (atom.kind) {
    case 'info':
      return copy.info;
    case 'below-aux':
      return copy.belowAux;
    case 'threshold': {
      const unit =
        unitToken === 'percent' ? units.percent : unitToken === 'points' ? ` ${units.points}` : '';
      const value = `${fmt(atom.value, numberLocale)}${unit}`;
      const template = atom.sustainedWeeks
        ? atom.direction === 'above'
          ? copy.thresholdAboveSustained
          : copy.thresholdBelowSustained
        : atom.direction === 'above'
          ? copy.thresholdAbove
          : copy.thresholdBelow;
      return interpolate(template, { value, weeks: fmt(atom.sustainedWeeks ?? 0, numberLocale) });
    }
    case 'percentile': {
      const pct = `${fmt(atom.cutoff * 100, numberLocale)}${units.percent}`;
      return interpolate(atom.tail === 'high' ? copy.percentileHigh : copy.percentileLow, { pct });
    }
    case 'change': {
      const template =
        atom.direction === 'rise'
          ? atom.mode === 'pct'
            ? copy.changeRisePct
            : copy.changeRisePoints
          : atom.mode === 'pct'
            ? copy.changeFallPct
            : copy.changeFallPoints;
      const mag =
        atom.mode === 'pct'
          ? `${fmt(atom.magnitude, numberLocale)}${units.percent}`
          : `${fmt(atom.magnitude, numberLocale)} ${units.points}`;
      return interpolate(template, { magnitude: mag, weeks: fmt(atom.windowWeeks, numberLocale) });
    }
    case 'yoy-negative':
      return copy.yoyNegative;
    case 'consecutive-decline':
      return interpolate(copy.consecutiveDecline, { periods: fmt(atom.periods, numberLocale) });
    case 'above-low':
      return interpolate(copy.aboveLow, { rise: `${fmt(atom.rise, numberLocale)} ${units.points}` });
  }
}

/** Full plain-language rule sentence for one indicator's card. */
export function formatRuleText(
  rule: WarningRule,
  id: IndicatorId,
  copy: RuleCopy,
  units: UnitLabels,
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const unitToken = DISPLAY[id].unit;
  if (rule.kind === 'any-of') {
    return rule.of
      .map((atom) => ruleAtomText(atom, copy, units, numberLocale, unitToken))
      .join(` ${copy.or} `);
  }
  return ruleAtomText(rule, copy, units, numberLocale, unitToken);
}

/* ------------------------------------------------------------------ *
 * v3 UI-20/UI-22 (2026-10-20): "Updated {HH:mm UTC}" — the fetch time in
 * UTC, 24-hour, on every card's meta row and in the details facts block.
 * UTC is the page's stated clock (RULES §6: show the fetched time in UTC);
 * fa keeps Persian digits through the fa-IR formatter.
 * ------------------------------------------------------------------ */

export function formatUtcHm(iso: string, numberLocale: 'en-US' | 'fa-IR'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(numberLocale === 'fa-IR' ? 'fa-IR' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}
