/**
 * usa-tiles — the USA page's derivations, PURE (page-division S9,
 * 2026-11-09 — docs/page-division/02-PAGE-DIVISION-SPEC.md §7 items 1–3,
 * D-29/D-30; the session prompt's S9 scope).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles / S7 world-markets-tiles contract): every
 * value the page renders is a DISPLAY of an engine-computed reading,
 * re-derived here through the SAME pure functions the other surfaces read
 * — never a second arithmetic, never an invented composite.
 *
 *   - The D-30 verdict strip: `usaGaugeVerdicts` IS `globalGaugeTiles`
 *     (the S3 module, re-exported — one derivation, both pages): the five
 *     thematic gauges through the engine's own `gaugeReading` +
 *     `labelForVerdictStep`. The USA projection carries the gauges' full
 *     voter sets by construction (homes + the D-30 mirror inputs), so the
 *     strip's verdicts are Global's own verdicts, byte-for-byte — the §21
 *     backtest (usa-backtest-core.ts) proves it on three sides: page ≡
 *     Global's page derivation ≡ the engine over the served snapshot.
 *   - The tier cards (D-29): the placement table's own groups via
 *     `pageGroupIds` (never hand-copied), the readings straight off the
 *     served projection, and the value render restating the DISPLAY
 *     registry's own decimals/units/scales — pinned byte-for-byte against
 *     `config/display.ts`'s `formatReadingValue` by usa-tiles.test.ts, so
 *     the lean restatement can never drift from the legacy renderer.
 *
 * Pure + platform-free so the unit tests drive it directly
 * (usa-tiles.test.ts) and the §21 backtest can pin it against the engine
 * without importing this module through the page (usa-backtest-core.ts).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';
import { globalGaugeTiles } from './global-tiles';
import type { GlobalGaugeTile } from './global-tiles';

/* ------------------------------------------------------------------ *
 * The D-30 verdict strip — the SAME five computed verdicts as Global
 * ------------------------------------------------------------------ */

/**
 * The verdict strip's derivation — `globalGaugeTiles` itself, re-exported
 * under the USA page's own name (the S8 world-map-copy pattern: ONE
 * derivation, both pages; a second copy of the arithmetic is exactly what
 * D-48 forbids). The readings the Global board and this page feed it are
 * the same voter sets (both projections carry THEMATIC_GAUGE_MEMBER_IDS —
 * Global as mirrors, USA as homes + the D-30 mirrors), so every strip
 * value equals the Global tile's value by construction.
 */
export const usaGaugeVerdicts: (readings: readonly IndicatorReading[]) => GlobalGaugeTile[] = globalGaugeTiles;

/** One strip entry's shape (the S3 GlobalGaugeTile contract, re-named). */
export type UsaGaugeVerdict = GlobalGaugeTile;

/* ------------------------------------------------------------------ *
 * The tiers (spec §7 items 2–3) — D-29 tier 1 · tier 2 rates & the Fed
 * ------------------------------------------------------------------ */

/**
 * Tier 1 — "the world watches" (D-29, §7 item 2): the seven numbers the
 * planet reacts to first. Derived from the placement table's own group,
 * never a hand-copied list (the S7 WORLD_RISK_IDS discipline, per-group).
 */
export const USA_TIER1_IDS: readonly IndicatorId[] = pageGroupIds('usa', 'tier-1-world-watches');

/**
 * Tier 2 — rates & the Fed (§7 item 3): the placement's authoritative 19
 * ids (the spec's own "(22)" label is the recorded AF-2 hand-count drift —
 * PLACEMENT.generated.md is the authority).
 */
export const USA_TIER2_IDS: readonly IndicatorId[] = pageGroupIds('usa', 'tier-2-rates-fed');

/** Every S9-scope card id, tier order (tier 1 then tier 2). */
export const USA_CARD_IDS: readonly IndicatorId[] = [...USA_TIER1_IDS, ...USA_TIER2_IDS];

/**
 * The literal union that keeps the display + copy maps TOTAL (a missing
 * key is a typecheck error, never a runtime undefined). usa-tiles.test.ts
 * pins this list against the placement's own groups byte-for-byte.
 */
export type UsaCardId =
  | 'fed-target'
  | 'fed-expectations'
  | 'us-cpi-yoy'
  | 'us-pce-core-yoy'
  | 'us-nfp'
  | 'us-unemployment'
  | 'us10y'
  | 'yield-curve-10y2y'
  | 'yield-curve-10y3m'
  | 'real-yield-10y'
  | 'real-yield-5y'
  | 'real-curve-10y5y'
  | 'us30y'
  | 'us-2y'
  | 'sofr'
  | 'mortgage-30y'
  | 'nyfed-custody'
  | 'us-deficit-monthly'
  | 'us-deficit-12m'
  | 'treasury-auction-10y'
  | 'treasury-auction-10y-indirect'
  | 'treasury-auction-30y'
  | 'treasury-auction-30y-indirect'
  | 'rstar-us'
  | 'debt-to-gdp'
  | 'govt-interest-revenue';

/** One tier card's reading (undefined = the id is absent from the served
 *  projection — public mode's honest gap, never a guess). */
export interface UsaCardEntry {
  id: UsaCardId;
  reading: IndicatorReading | undefined;
}

/**
 * One tier's cards in placement order, straight off the projection (the S7
 * worldRiskCards pattern: the readings arrive already in placement order —
 * the projection is built from `pageReadingIds` — this only joins them).
 */
export function usaCards(readings: readonly IndicatorReading[], ids: readonly IndicatorId[]): UsaCardEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return ids.map((id) => ({ id: id as UsaCardId, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * The cards' display configs — the DISPLAY registry's own values for the
 * 26 S9 ids, restated here so the lean USA chunk does not pull the config
 * module chain (the S3 GlobalBoard / S5 GOLD_DISPLAY / S7 WORLD_RISK_
 * DISPLAY pattern). The decimals/units/scales/ranges are pinned against
 * config/display.ts by usa-tiles.test.ts — and the VALUE RENDER is pinned
 * against `formatReadingValue` output-for-output over every id × both
 * locales × both range shapes (a stronger pin than a table echo: the
 * restated join can never drift from the legacy renderer).
 * ------------------------------------------------------------------ */

export type UsaUnitToken = 'percent' | 'points' | 'ratio' | 'usd-tr' | 'usd-bn';

export interface UsaCardDisplayConfig {
  decimals: number;
  unit: UsaUnitToken;
  /** Multiplicative display scale (the DISPLAY registry's own — e.g. the
   *  deficit's raw millions → billions/trillions). */
  scale?: number;
  /** I15 fed-target: render the true published bounds (or the 25bp
   *  corridor fallback for old payloads without rangeLow/rangeHigh). */
  range?: boolean;
}

export const USA_CARD_DISPLAY: Readonly<Record<UsaCardId, UsaCardDisplayConfig>> = {
  'fed-target': { decimals: 2, unit: 'percent', range: true },
  'fed-expectations': { decimals: 2, unit: 'points' },
  'us-cpi-yoy': { decimals: 1, unit: 'percent' },
  'us-pce-core-yoy': { decimals: 1, unit: 'percent' },
  'us-nfp': { decimals: 0, unit: 'points' },
  'us-unemployment': { decimals: 1, unit: 'percent' },
  us10y: { decimals: 2, unit: 'percent' },
  'yield-curve-10y2y': { decimals: 2, unit: 'points' },
  'yield-curve-10y3m': { decimals: 2, unit: 'points' },
  'real-yield-10y': { decimals: 2, unit: 'percent' },
  'real-yield-5y': { decimals: 2, unit: 'percent' },
  'real-curve-10y5y': { decimals: 2, unit: 'points' },
  us30y: { decimals: 2, unit: 'percent' },
  'us-2y': { decimals: 2, unit: 'percent' },
  sofr: { decimals: 2, unit: 'percent' },
  'mortgage-30y': { decimals: 2, unit: 'percent' },
  'nyfed-custody': { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  'us-deficit-monthly': { decimals: 1, unit: 'usd-bn', scale: 1e-3 },
  'us-deficit-12m': { decimals: 2, unit: 'usd-tr', scale: 1e-6 },
  'treasury-auction-10y': { decimals: 2, unit: 'ratio' },
  'treasury-auction-10y-indirect': { decimals: 1, unit: 'percent' },
  'treasury-auction-30y': { decimals: 2, unit: 'ratio' },
  'treasury-auction-30y-indirect': { decimals: 1, unit: 'percent' },
  'rstar-us': { decimals: 2, unit: 'percent' },
  'debt-to-gdp': { decimals: 1, unit: 'percent' },
  'govt-interest-revenue': { decimals: 1, unit: 'percent' },
};

/** The locale-dependent unit labels the value render joins (the corpus's
 *  own units block, pinned by usa-copy-pin.test.ts). */
export interface UsaUnitLabels {
  percent: string;
  points: string;
  ratio: string;
  usd: string;
  'usd-tr': string;
  'usd-bn': string;
}

/** The Fed target corridor's half-width (the FOMC's 25bp since 2008 —
 *  display.ts's own constant, restated lean; the equivalence pin against
 *  `formatReadingValue` keeps the two from drifting). */
const FED_CORRIDOR_HALF = 0.125;

/**
 * One card's VALUE — the DISPLAY registry's own render, restated lean (the
 *  indicatorValueParts + formatIndicatorValue join): percent binds tight
 *  ('5.31%' / '۵٫۳۱٪'), word units suffix with a space ('0.48 pts'), the
 *  trillion family prefixes the currency and suffixes the magnitude word in
 *  EN ('US$3.45 trillion') while fa keeps its suffix form, the billion
 *  family renders 'US$84.9bn' in EN, and fed-target renders the true
 *  published corridor ('3.75–4.00%') with the 25bp fallback for old
 *  payloads. null = the reading is absent or carries no value (the honest
 *  unavailable word, never a guess).
 */
export function usaCardValueText(
  id: UsaCardId,
  reading: IndicatorReading | undefined,
  numberLocale: 'en-US' | 'fa-IR',
  units: UsaUnitLabels,
): string | null {
  if (reading === undefined || reading.value === null) return null;
  const cfg = USA_CARD_DISPLAY[id];
  const num = formatNumber(reading.value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return num;

  if (cfg.range === true) {
    // Step-1 audit item A1: prefer the TRUE published bounds (DFEDTARL/U);
    // the 25bp-corridor fallback only renders for old payloads.
    if (reading.rangeLow !== undefined && reading.rangeHigh !== undefined) {
      const lo = formatNumber(reading.rangeLow, numberLocale, {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      });
      const hi = formatNumber(reading.rangeHigh, numberLocale, {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      });
      return `${lo}–${hi}${unit}`;
    }
    const lo = formatNumber(reading.value - FED_CORRIDOR_HALF, numberLocale, {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    });
    return `${lo}–${num}${unit}`;
  }

  if (cfg.unit === 'percent') return `${num}${unit}`; // '5.31%' / '۵٫۳۱٪' — binds tight, both locales.
  if (cfg.unit === 'usd-tr') {
    // Step-1 C7: "US$3.45 trillion" — EN prefixes the currency and
    // suffixes the magnitude word; fa keeps its suffix-only form.
    return numberLocale === 'en-US' ? `${units.usd}${num} ${unit}` : `${num} ${unit}`;
  }
  if (cfg.unit === 'usd-bn') {
    // M6 Wave 3: "US$84.9bn" in EN (prefix + tight magnitude word); fa
    // keeps its suffix form ('۸۴٫۹ میلیارد').
    return numberLocale === 'en-US' ? `${units.usd}${num}${unit}` : `${num} ${unit}`;
  }
  return `${num} ${unit}`; // '0.48 pts' / '2.63 ratio' — the word units.
}
