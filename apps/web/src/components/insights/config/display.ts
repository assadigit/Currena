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
  | 'ratio'
  // M4 Wave 1 (2026-10-24): a counted quantity — claims counts people
  // newly filing (a plain grouped number plus the count word; 'none'
  // renders an empty label, which R13 forbids).
  | 'claims'
  // M5 Wave 2 (2026-10-24): the Turkish lira (the usdtry pair).
  | 'try'
  // M6 Wave 3 (2026-10-25): the leading-edge batch — Australian billions
  // ("A$97.6bn" EN), US permits and job openings scaled to millions
  // ("1.40m permits a year"), AU vacancies in thousands ("325k").
  | 'aud-bn'
  | 'permits'
  | 'openings'
  | 'vacancies';

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
  claims: string;
  try: string;
  'aud-bn': string;
  permits: string;
  openings: string;
  vacancies: string;
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
const PREFIXED_UNITS: ReadonlySet<UnitToken> = new Set(['usd', 'aud', 'usd-bn', 'usd-tr', 'eur', 'jpy', 'cny', 'try']);

export const DISPLAY: Readonly<Record<IndicatorId, DisplayConfig>> = {
  'yield-curve-10y2y': { decimals: 2, unit: 'points' },
  // 2026-10-26 gap-audit build, A-1: the 10y−3m curve leg, rendered like
  // its 10y−2y sibling.
  'yield-curve-10y3m': { decimals: 2, unit: 'points' },
  'fed-expectations': { decimals: 2, unit: 'points' },
  us30y: { decimals: 2, unit: 'percent' },
  'philly-fed': { decimals: 1, unit: 'points' },
  'rba-expectations': { decimals: 2, unit: 'points' },
  'real-yield-10y': { decimals: 2, unit: 'percent' },
  us10y: { decimals: 2, unit: 'percent' },
  'fed-target': { decimals: 2, unit: 'percent', range: true },
  'ecb-dfr': { decimals: 2, unit: 'percent' },
  // Defect E-11 (2026-10-16): the engine now stores the share as a true
  // percentage (33.55) — no display-scale compensation any more.
  'govt-interest-revenue': { decimals: 1, unit: 'percent' },
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
  // Step 3 L1-18: the crypto Fear and Greed index is the publisher's own
  // 0-100 scale — whole numbers, like the source shows.
  'crypto-fng': { decimals: 0, unit: 'index' },
  'shiller-cape': { decimals: 2, unit: 'ratio' },
  'shiller-ecy': { decimals: 2, unit: 'percent' },
  'gold-silver': { decimals: 1, unit: 'ratio' },
  // M4 Wave 1 (OD-8/D-42, 2026-10-24) — the early-warning pack: claims
  // counts people (whole numbers with locale grouping plus the count word),
  // the recession probability is stored as a fraction and renders scaled
  // ×100 ('62%'), and the rest render like their lane siblings.
  'initial-jobless-claims': { decimals: 0, unit: 'claims' },
  'recession-probability': { decimals: 0, unit: 'percent', scale: 100 },
  'michigan-sentiment': { decimals: 1, unit: 'index' },
  'michigan-1y-expectations': { decimals: 1, unit: 'percent' },
  'us-pce-core-yoy': { decimals: 1, unit: 'percent' },
  sofr: { decimals: 2, unit: 'percent' },
  'us-2y': { decimals: 2, unit: 'percent' },
  'breakeven-10y': { decimals: 2, unit: 'percent' },
  // M5 Wave 2 (2026-10-24) — the euro long end + the household-cost staples
  // + the EM-pressure pair. The Food index is the publisher's own 2010=100
  // basis (1dp, 'index' like the other publisher indexes); the grains are
  // $/mt prices (the wti/natgas precedent — the unit word says US$, the
  // copy says per metric ton); TRY renders with the lira sign in EN.
  'euro-aaa-10y': { decimals: 2, unit: 'percent' },
  'food-index': { decimals: 1, unit: 'index' },
  wheat: { decimals: 1, unit: 'usd' },
  maize: { decimals: 1, unit: 'usd' },
  usdtry: { decimals: 2, unit: 'try' },
  // M6 Wave 3 (OD-8/D-42, 2026-10-25) — the leading-edge batch: the
  // mortgage/liquidity/spending family. WALCL is $ millions → 'usd-tr'
  // ×1e-6 ("US$6.8 trillion"); retail sales $ millions → 'usd-bn' ×1e-3
  // ("US$745.0bn"); permits SAAR thousands → 'permits' ×1e-3 ("1.40m
  // permits a year"); JOLTS thousands → 'openings' ×1e-3; the AU trio
  // reads $ millions → 'aud-bn' ×1e-3 ("A$97.6bn") for housing finance,
  // percent for the saving ratio, and whole thousands for vacancies
  // ("325k vacancies", 0dp — the raw unit is already thousand).
  'mortgage-30y': { decimals: 2, unit: 'percent' },
  walcl: { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  'retail-sales': { decimals: 1, unit: 'usd-bn', scale: 0.001 },
  'housing-permits': { decimals: 2, unit: 'permits', scale: 0.001 },
  cfnai: { decimals: 2, unit: 'index' },
  'job-openings': { decimals: 2, unit: 'openings', scale: 0.001 },
  t5yie: { decimals: 2, unit: 'percent' },
  'us-wages': { decimals: 1, unit: 'percent' },
  'euro-hicp': { decimals: 1, unit: 'percent' },
  'au-housing-finance': { decimals: 1, unit: 'aud-bn', scale: 0.001 },
  'au-saving-ratio': { decimals: 1, unit: 'percent' },
  'au-job-vacancies': { decimals: 0, unit: 'vacancies' },
  'dollar-basket': { decimals: 2, unit: 'index' },
  usdjpy: { decimals: 2, unit: 'jpy' },
  // 2026-10-26 gap-audit build, A-3: the yield gap, points 2dp.
  'us-japan-10y-gap': { decimals: 2, unit: 'points' },
  // Step-1 audit item C4: EUR per USD — the € symbol, not "US$".
  'eur-usd': { decimals: 4, unit: 'eur' },
  'china-pmi': { decimals: 1, unit: 'index' },
  // M7 (2026-10-26): the NBS CPI card — the us-cpi-yoy percent convention.
  'china-cpi': { decimals: 1, unit: 'percent' },
  // Step-1 audit item C7: "US$23.3 trillion", not "bn23,343".
  'm2-us': { decimals: 1, unit: 'usd-tr', scale: 0.001 },
  // Step-2 add-list §B3/§B4: the US labour-market pair (both in percentage
  // points — a rate and a points gap, never percent-of-percent).
  'us-unemployment': { decimals: 1, unit: 'percent' },
  'sahm-rule': { decimals: 2, unit: 'points' },
  'copper-gold': { decimals: 2, unit: 'ratio' },
  usdcny: { decimals: 4, unit: 'cny' },
  // 2026-10-21 data-integrity round — the coverage additions (recovered
  // verbatim from the deployed round's labels chunk: nfp counts jobs in
  // whole thousands on the 'points' unit, platinum carries 2 decimals).
  'bund-10y': { decimals: 2, unit: 'percent' },
  'jgb-10y': { decimals: 2, unit: 'percent' },
  'gilt-10y': { decimals: 2, unit: 'percent' },
  'boj-rate': { decimals: 2, unit: 'percent' },
  'boe-rate': { decimals: 2, unit: 'percent' },
  // 2026-10-26 gap-audit build, A-4: barrels of Brent per ounce of gold.
  'gold-oil-ratio': { decimals: 1, unit: 'ratio' },
  'wti': { decimals: 2, unit: 'usd' },
  'natgas': { decimals: 2, unit: 'usd' },
  'platinum': { decimals: 2, unit: 'usd' },
  'us-gdp-growth': { decimals: 1, unit: 'percent' },
  'us-nfp': { decimals: 0, unit: 'points' },
  brent: { decimals: 2, unit: 'usd' },
  'gold-usd': { decimals: 0, unit: 'usd' },
  'silver-usd': { decimals: 2, unit: 'usd' },
  'copper-usd': { decimals: 0, unit: 'usd' },
  'btc-usd': { decimals: 0, unit: 'usd' },
  'gold-btc': { decimals: 4, unit: 'ratio' },
  'au-cpi': { decimals: 1, unit: 'percent' },
  'au-trimmed-mean': { decimals: 1, unit: 'percent' },
  // Step-2 add-list §B2: the AU 10-year yield, rendered like the US one.
  'au-10y': { decimals: 2, unit: 'percent' },
  'au-us-10y-gap': { decimals: 2, unit: 'points' },
  // 2026-10-26 gap-audit build, A-5: the policy-rate gap, rendered like
  // the 10y gap (points, 2dp).
  'rba-fed-gap': { decimals: 2, unit: 'points' },
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
 * ('۱۲۵٫۴۴ دلار') never pushes the value onto a second row.
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
  // M6 Wave 3 (2026-10-25): the billion-scale money rows — EN prefixes the
  // currency and suffixes the magnitude word ("US$745.0bn" / "A$97.6bn",
  // the usd-tr pattern minus the space); fa keeps its suffix word
  // ("۹۷٫۶ میلیارد دلار استرالیا").
  if (cfg.unit === 'usd-bn' || cfg.unit === 'aud-bn') {
    if (numberLocale === 'en-US') {
      const prefix = cfg.unit === 'aud-bn' ? units.aud : units.usd;
      return { value: `${prefix}${num}${unit}`, unit: null };
    }
    return { value: num, unit };
  }
  if (numberLocale === 'en-US' && PREFIXED_UNITS.has(cfg.unit)) return { value: `${unit}${num}`, unit: null }; // 'US$113.96'
  return { value: num, unit }; // '۱۱۳٫۹۶ دلار' / '0.48 pts'
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
 * 2026-10-25b (asset-cards polish, task §5): the prices cards' PRICE LINE
 * — the number and its currency on ONE baseline, as separate elements so
 * the digits stay dominant (≈28px bold) while the currency renders
 * secondary (≈14px). Built from the SAME DISPLAY config as
 * indicatorValueParts (no string surgery on its output): plain-unit
 * assets split into {number, prefix|suffix}; the special compositions
 * (percent, ranges, usd-tr) fall back to the joined form in `number`
 * with no currency element — the four board assets (usd unit) always
 * take the split path.
 */
export interface PriceValueParts {
  /** The formatted number alone ('4,166' / '۴٬۱۶۶'). */
  number: string;
  /** Currency rendered BEFORE the number (en: 'US$'). Null when none. */
  prefix: string | null;
  /** Currency rendered AFTER the number (fa: 'دلار'). Null when none. */
  suffix: string | null;
}

export function priceValueParts(
  id: IndicatorId,
  value: number,
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
): PriceValueParts {
  const cfg = DISPLAY[id];
  const num = formatNumber(value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  // Compositions the price line never splits (not the board assets).
  if (!unit || cfg.range || cfg.unit === 'percent' || cfg.unit === 'usd-tr') {
    return { number: indicatorValueParts(id, value, numberLocale, units).value, prefix: null, suffix: null };
  }
  if (numberLocale === 'en-US' && PREFIXED_UNITS.has(cfg.unit)) {
    return { number: num, prefix: unit, suffix: null };
  }
  return { number: num, prefix: null, suffix: unit };
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

/** Signed change rendering, in PARTS: the isolated signed number plus the
 * WORD-like unit ('pts' / «واحد درصد») when the unit is a word. A percent
 * binds tight and rides INSIDE the number island ('+0.62%'), a word unit
 * rides OUTSIDE as its own element — so an RTL page can render
 * «+۰٫۲۵» right next to «واحد درصد» instead of an ltr bdi visually
 * scattering it into «واحد درصد … +۰٫۲۵» (the 2026-10-17 hero glitch).
 * Step-1 audit item C5: `scale` lets percentage-point changes of fraction-
 * valued series (govt-interest-revenue) render in their displayed units. */
export function formatChangeParts(
  change: number,
  changeKind: 'pct' | 'points',
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
  scale = 1,
): { value: string; unit: string | null } {
  const num = formatNumber(Math.abs(change) * scale, numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  // Percent binds tight ('+0.62%'); word-like units take a space ('+0.11 pts').
  return changeKind === 'pct'
    ? { value: `${sign}${num}${units.percent}`, unit: null }
    : { value: `${sign}${num}`, unit: units.points };
}

/** Signed 7/30-day change rendering ('+0.62%' / '+۰٫۱۱ نقطه'). Render the
 * returned string inside dir="ltr" ONLY when it is a pure number island
 * (percent); word-unit strings must be split via formatChangeParts so the
 * RTL word never lands inside the ltr bdi. */
export function formatChange(
  change: number,
  changeKind: 'pct' | 'points',
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
  scale = 1,
): string {
  const parts = formatChangeParts(change, changeKind, numberLocale, units, scale);
  return parts.unit === null ? parts.value : `${parts.value} ${parts.unit}`;
}

/** Owner convention (2026-10-17): signed changes speak in a directional ink —
 * positive green, negative red, zero/absent stays neutral. 2026-10-27 owner
 * round ("write the positive indexes with more clear and bright green …
 * and do the same for red, down and brighter red"): the pair moves to the
 * vivid RETURN tokens (brighter siblings of the calm status hues) so every
 * signed value on the page — the prices cards' changes and the world
 * markets' returns — speaks the SAME loud vocabulary (states and verdict
 * words keep the status hues). */
export function changeToneClass(change: number | undefined | null): string {
  if (change === undefined || change === null || !Number.isFinite(change)) return '';
  if (change > 0) return 'text-[var(--color-return-up)]';
  if (change < 0) return 'text-[var(--color-return-down)]';
  return '';
}

/** The display scale of one indicator's changes (fraction series ×100). */
export function changeScaleOf(id: IndicatorId): number {
  return DISPLAY[id].scale ?? 1;
}
