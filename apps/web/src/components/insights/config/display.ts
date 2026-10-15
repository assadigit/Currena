/**
 * Per-indicator value formatting (Phase 3-c split of the former config.ts
 * monolith — see ./index.ts). Pure, platform-free.
 */

import { formatNumber } from '@currena/core';
import type { IndicatorId, IndicatorReading } from '@currena/core';

/* ------------------------------------------------------------------ *
 * Value formatting — canonical numbers, formatted ONLY at render
 * ------------------------------------------------------------------ */

export type UnitToken =
  | 'none'
  | 'percent'
  | 'points'
  | 'usd'
  | 'aud'
  | 'usd-bn'
  | 'usd-tr'
  | 'eur'
  | 'index'
  | 'jpy'
  | 'cny'
  | 'ratio';

/** Locale-dependent unit labels (from the copy dictionaries). */
export interface UnitLabels {
  none: string;
  percent: string;
  points: string;
  usd: string;
  aud: string;
  'usd-bn': string;
  'usd-tr': string;
  eur: string;
  index: string;
  jpy: string;
  cny: string;
  ratio: string;
}

interface DisplayConfig {
  /** Fraction digits for the value. */
  decimals: number;
  /** Unit label token (rendered per-locale). */
  unit: UnitToken;
  /** Multiplicative display scale (e.g. fractions → percent). */
  scale?: number;
  /** I15 fed-target: render the 25bp corridor around the midpoint (Block PB/H1 spec §3). */
  range?: boolean;
}

/** Units rendered as a prefix in English (suffix everywhere in Farsi). */
const PREFIXED_UNITS: ReadonlySet<UnitToken> = new Set(['usd', 'aud', 'usd-bn', 'usd-tr', 'eur', 'jpy', 'cny']);

export const DISPLAY: Readonly<Record<IndicatorId, DisplayConfig>> = {
  'yield-curve-10y2y': { decimals: 2, unit: 'points' },
  'fed-expectations': { decimals: 2, unit: 'points' },
  us30y: { decimals: 2, unit: 'percent' },
  'philly-fed': { decimals: 1, unit: 'points' },
  'rba-expectations': { decimals: 2, unit: 'points' },
  'real-yield-10y': { decimals: 2, unit: 'percent' },
  us10y: { decimals: 2, unit: 'percent' },
  'fed-target': { decimals: 2, unit: 'percent', range: true },
  'ecb-dfr': { decimals: 2, unit: 'percent' },
  'govt-interest-revenue': { decimals: 1, unit: 'percent', scale: 100 },
  'us-cpi-yoy': { decimals: 1, unit: 'percent' },
  // Step-1 audit item A3: the core-CPI companion (rendered INSIDE the
  // us-cpi-yoy card, never as its own row).
  'us-cpi-core-yoy': { decimals: 1, unit: 'percent' },
  'breakeven-5y5y': { decimals: 2, unit: 'percent' },
  'stress-stlfsi': { decimals: 2, unit: 'index' },
  nfci: { decimals: 2, unit: 'index' },
  // Step-2 add-list §B5: the VIX prints to two decimals like the other
  // market-stress indices (14.84).
  vix: { decimals: 2, unit: 'index' },
  'gold-silver': { decimals: 1, unit: 'ratio' },
  'dollar-basket': { decimals: 2, unit: 'index' },
  usdjpy: { decimals: 2, unit: 'jpy' },
  // Step-1 audit item C4: EUR per USD — the € symbol, not "US$".
  'eur-usd': { decimals: 4, unit: 'eur' },
  'china-pmi': { decimals: 1, unit: 'index' },
  // Step-1 audit item C7: "US$23.3 trillion", not "bn23,343".
  'm2-us': { decimals: 1, unit: 'usd-tr', scale: 0.001 },
  // Step-2 add-list §B3/§B4: the US labour-market pair (both in percentage
  // points — a rate and a points gap, never percent-of-percent).
  'us-unemployment': { decimals: 1, unit: 'percent' },
  'sahm-rule': { decimals: 2, unit: 'points' },
  'copper-gold': { decimals: 2, unit: 'ratio' },
  usdcny: { decimals: 4, unit: 'cny' },
  brent: { decimals: 2, unit: 'usd' },
  'gold-usd': { decimals: 0, unit: 'usd' },
  'silver-usd': { decimals: 2, unit: 'usd' },
  'copper-usd': { decimals: 0, unit: 'usd' },
  'btc-usd': { decimals: 0, unit: 'usd' },
  'gold-btc': { decimals: 4, unit: 'ratio' },
  'silver-btc': { decimals: 5, unit: 'ratio' },
  'au-cpi': { decimals: 1, unit: 'percent' },
  'au-trimmed-mean': { decimals: 1, unit: 'percent' },
  // Step-2 add-list §B2: the AU 10-year yield, rendered like the US one.
  'au-10y': { decimals: 2, unit: 'percent' },
  'au-us-10y-gap': { decimals: 2, unit: 'points' },
  'rba-cash-rate': { decimals: 2, unit: 'percent' },
  // Step-2 add-list §B7: the real savings rate (new household term deposits).
  'au-deposit-rate': { decimals: 2, unit: 'percent' },
  'au-petrol-yoy': { decimals: 1, unit: 'percent' },
  'au-home-loan': { decimals: 2, unit: 'percent' },
  'au-wage-growth': { decimals: 1, unit: 'percent' },
  'au-rent-yoy': { decimals: 1, unit: 'percent' },
  'au-unemployment': { decimals: 1, unit: 'percent' },
  // R13: the ABS series is a price INDEX (not a dollar amount) — the word
  // "index" is the honest unit; a dollar figure would be fabricated.
  'au-home-values': { decimals: 1, unit: 'index' },
  'au-household-debt-arrears': { decimals: 1, unit: 'percent' },
  audusd: { decimals: 4, unit: 'usd' },
  audjpy: { decimals: 2, unit: 'jpy' },
  'terms-of-trade': { decimals: 1, unit: 'index' },
  'iron-ore': { decimals: 1, unit: 'usd' },
  'gold-aud': { decimals: 0, unit: 'aud' },
};

/** The Fed target corridor's half-width (the FOMC has used 25bp since 2008). */
const FED_CORRIDOR_HALF = 0.125;

/** R40: value/unit split for renderers that style the unit separately —
 * the hero attention tiles read the unit SMALL so a long word-unit label
 * ('۱۲۵٫۴۴ دلار آمریکا') never pushes the value onto a second row.
 * `unit` is null when the unit binds tight (percent, prefixed US$/¥/CN¥,
 * the fed corridor) or is absent. `formatIndicatorValue` below is the
 * exact join of these parts — outputs stay byte-identical everywhere. */
interface IndicatorValueParts {
  value: string;
  unit: string | null;
}

/** Optional true bounds for a range-rendered value (fed-target). */
interface ValueRangeBounds {
  low: number;
  high: number;
}

export function indicatorValueParts(
  id: IndicatorId,
  value: number,
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
  bounds?: ValueRangeBounds,
): IndicatorValueParts {
  const cfg = DISPLAY[id];
  const num = formatNumber(value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return { value: num, unit: null };
  if (cfg.range) {
    // Step-1 audit item A1: prefer the TRUE published bounds
    // (DFEDTARL/DFEDTARU → "3.75–4.00%"); the 25bp-corridor fallback
    // only renders for old payloads without rangeLow/rangeHigh.
    if (bounds) {
      const lo = formatNumber(bounds.low, numberLocale, {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      });
      const hi = formatNumber(bounds.high, numberLocale, {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      });
      return { value: `${lo}–${hi}${unit}`, unit: null };
    }
    const lo = formatNumber(value - FED_CORRIDOR_HALF, numberLocale, {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    });
    return { value: `${lo}–${num}${unit}`, unit: null };
  }
  if (cfg.unit === 'percent') return { value: `${num}${unit}`, unit: null }; // '5.31%' / '۵٫۳۱٪' — no space, both locales.
  // Step-1 C7: "US$23.3 trillion" — the EN render prefixes the currency and
  // suffixes the magnitude word; fa keeps its suffix-only form.
  if (cfg.unit === 'usd-tr') {
    if (numberLocale === 'en-US') return { value: `${units.usd}${num} ${unit}`, unit: null };
    return { value: num, unit };
  }
  if (numberLocale === 'en-US' && PREFIXED_UNITS.has(cfg.unit)) return { value: `${unit}${num}`, unit: null }; // 'US$113.96'
  return { value: num, unit }; // '۱۱۳٫۹۶ دلار آمریکا' / '0.48 pts'
}

/** Current-value rendering, e.g. '5.31%', 'US$23,343bn', '۰٫۴۸'. */
export function formatIndicatorValue(
  id: IndicatorId,
  value: number,
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
  bounds?: ValueRangeBounds,
): string {
  const parts = indicatorValueParts(id, value, numberLocale, units, bounds);
  return parts.unit === null ? parts.value : `${parts.value} ${parts.unit}`;
}

/**
 * Step-1: render a READING's value (the reading's own range bounds ride
 * along when present — fed-target). Null-safe for unavailable rows.
 */
export function formatReadingValue(
  reading: IndicatorReading,
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
): string | null {
  if (reading.value === null) return null;
  const bounds =
    reading.rangeLow !== undefined && reading.rangeHigh !== undefined
      ? { low: reading.rangeLow, high: reading.rangeHigh }
      : undefined;
  return formatIndicatorValue(reading.id, reading.value, numberLocale, units, bounds);
}

/** Signed 7/30-day change rendering ('+0.62%' / '+۰٫۱۱ نقطه'). Render inside dir="ltr".
 * Step-1 audit item C5: `scale` lets percentage-point changes of fraction-
 * valued series (govt-interest-revenue) render in their displayed units. */
export function formatChange(
  change: number,
  changeKind: 'pct' | 'points',
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
  scale = 1,
): string {
  const num = formatNumber(Math.abs(change) * scale, numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  const unit = changeKind === 'pct' ? units.percent : units.points;
  // Percent binds tight ('+0.62%'); word-like units take a space ('+0.11 pts').
  return changeKind === 'pct' ? `${sign}${num}${unit}` : `${sign}${num} ${unit}`;
}

/** The display scale of one indicator's changes (fraction series ×100). */
export function changeScaleOf(id: IndicatorId): number {
  return DISPLAY[id].scale ?? 1;
}
