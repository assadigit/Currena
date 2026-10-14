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
  const month = new Intl.DateTimeFormat(
    locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory',
    { month: 'long', year: 'numeric', timeZone: 'UTC' },
  ).format(new Date(`${asOf}T00:00:00Z`));
  if (def.cadence === 'monthly' || def.cadence === 'quarterly' || def.cadence === 'manual') {
    return month;
  }
  return formatDateWords(asOf, numberLocale === 'fa-IR' ? 'fa-IR' : 'en-US');
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
