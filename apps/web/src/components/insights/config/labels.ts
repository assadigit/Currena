/**
 * Card date/change labels + plain-language rule text (Phase 3-c split of
 * the former config.ts monolith — see ./index.ts). Pure, platform-free.
 */

import { formatNumber, formatDateWords } from '@currena/core';
import type { IndicatorId, WarningRule, WarningRuleAtom } from '@currena/core';
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

/**
 * "Data for August 2026" for monthly/quarterly observations (the asOf
 * month/quarter), "as of {date}" for daily ones. Locale-aware, UTC-safe
 * (formatDateWords' date-only fix).
 */
export function dataPeriodText(
  id: IndicatorId,
  asOf: string,
  locale: 'en' | 'fa',
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const def = definitionFor(id);
  if (def.cadence === 'quarterly') {
    // Fix spec B-07 (2026-10-14): quarterly data is labelled by QUARTER NAME
    // and period end ("June quarter 2026") — never a bare month name.
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
  const monthName = new Intl.DateTimeFormat(
    locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory',
    { month: 'long', timeZone: 'UTC' },
  ).format(new Date(Date.UTC(endYear, endMonth - 1, 1)));
  const yearText = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory', {
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(endYear, 0, 1)));
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
