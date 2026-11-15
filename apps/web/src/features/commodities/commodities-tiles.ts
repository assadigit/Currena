/**
 * commodities-tiles — the Commodities page's derivations, PURE (page-division
 * S17, 2026-11-11 — docs/page-division/02-PAGE-DIVISION-SPEC.md §11 items;
 * D-2/D-19/D-27/D-28/D-38/D-39/D-40; the session prompt's S17 scope).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles / S7 world-markets-tiles / S9 usa-tiles /
 * S12 europe-tiles / S14 asia-tiles / S16 australia-tiles contract): every
 * value the page renders is a DISPLAY of an engine-computed reading,
 * re-derived here through the SAME pure engine functions the other
 * surfaces read — never a second arithmetic, never an invented composite.
 *
 *   - The four commodity groups + the supply group (§11, D-38/D-39): each
 *     group's ids via `pageGroupIds` (never hand-copied) — energy (9) ·
 *     metals (4) · agriculture (3) · digital (2) · trade-routes-supply (6)
 *     = 24 placed cards. No gauges, no verdict lines (every commodity id
 *     is context-only per G-5 — the page reads the engine's own readings,
 *     never a second scoring).
 *   - The cards' value render restates the DISPLAY registry's own
 *     decimals/units/scale (the S9/S12/S14/S16 pattern), pinned
 *     byte-for-byte against `config/display.ts`'s `formatReadingValue` by
 *     commodities-tiles.test.ts — including the five commodity unit
 *     families: usd (the prefixed EN 'US$113.96' / the fa suffix
 *     '۱۱۳٫۹۶ دلار'), index ('109.87 index'), barrels ('416.7m barrels'
 *     scaled 1e-3), barrels-per-day ('13.99m barrels a day' scaled 1e-3)
 *     and transits ('45.3 transits a day').
 *   - The gold cross-links (§11 "Cross-links", D-19/D-27): gold and its
 *     ratios live on /gold — the ONE commodity exception. The metals
 *     group carries a single cross-link chip to /gold (the gold/silver,
 *     gold/platinum, gold/oil ratios are on the Gold page, never
 *     re-rendered here).
 *
 * Pure + platform-free so the unit tests drive it directly
 * (commodities-tiles.test.ts) and the §21 backtest can pin it against the
 * engine without importing this module through the page
 * (commodities-backtest-core.ts).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';

/* ------------------------------------------------------------------ *
 * The four commodity groups + the supply group (spec §11; D-38/D-39)
 * ------------------------------------------------------------------ */

/** The Energy section (§11, D-38): the nine cards — oil, gas, LNG, coal,
 *  crude stocks, the SPR and US production. Derived from the placement
 *  table's own group, never a hand-copied list. */
export const COMMODITIES_ENERGY_IDS: readonly IndicatorId[] = pageGroupIds('commodities', 'energy');

/** The Metals section (§11, D-19/D-27/D-38): the four commodity PRICE
 *  cards — silver, platinum, copper, iron ore. Their gold RATIOS stay on
 *  /gold (D-27 — the cross-link below). */
export const COMMODITIES_METALS_IDS: readonly IndicatorId[] = pageGroupIds('commodities', 'metals');

/** The Agriculture section (§11, D-2/D-38): the three cards — the world
 *  food index, wheat, maize. */
export const COMMODITIES_AGRICULTURE_IDS: readonly IndicatorId[] = pageGroupIds('commodities', 'agriculture');

/** The Digital section (§11, D-28/D-38/D-40): the two cards — Bitcoin and
 *  the Crypto Fear & Greed index. */
export const COMMODITIES_DIGITAL_IDS: readonly IndicatorId[] = pageGroupIds('commodities', 'digital');

/** The Trade routes & supply section (§11, D-39): the six cards — the five
 *  chokepoints (Suez, Panama, Bab el-Mandeb, Malacca, Taiwan) and the
 *  GSCPI. */
export const COMMODITIES_TRADE_ROUTES_IDS: readonly IndicatorId[] = pageGroupIds('commodities', 'trade-routes-supply');

/**
 * Every Commodities registry card id, group order (9 + 4 + 3 + 2 + 6 = 24
 * in all).
 */
export const COMMODITIES_CARD_IDS: readonly IndicatorId[] = [
  ...COMMODITIES_ENERGY_IDS,
  ...COMMODITIES_METALS_IDS,
  ...COMMODITIES_AGRICULTURE_IDS,
  ...COMMODITIES_DIGITAL_IDS,
  ...COMMODITIES_TRADE_ROUTES_IDS,
];

/**
 * The literal union that keeps the display + copy maps TOTAL (a missing
 * key is a typecheck error, never a runtime undefined).
 * commodities-tiles.test.ts pins this list against the placement's own
 * groups byte-for-byte.
 */
export type CommoditiesCardId =
  | 'brent'
  | 'wti'
  | 'natgas'
  | 'gas-europe'
  | 'lng-japan'
  | 'coal-aus'
  | 'eia-crude-stocks'
  | 'us-spr'
  | 'us-crude-production'
  | 'silver-usd'
  | 'platinum'
  | 'copper-usd'
  | 'iron-ore'
  | 'food-index'
  | 'wheat'
  | 'maize'
  | 'btc-usd'
  | 'crypto-fng'
  | 'chokepoint-suez'
  | 'chokepoint-panama'
  | 'chokepoint-bab-el-mandeb'
  | 'chokepoint-malacca'
  | 'chokepoint-taiwan'
  | 'gscpi';

/** One card's reading (undefined = the id is absent from the served
 *  projection — public mode's honest gap, never a guess). */
export interface CommoditiesCardEntry {
  id: CommoditiesCardId;
  reading: IndicatorReading | undefined;
}

/**
 * One group's cards in placement order, straight off the projection
 * (the S7/S9/S12/S14/S16 pattern: the readings arrive already in
 * placement order — the projection is built from `pageReadingIds` — this
 * only joins them).
 */
export function commoditiesCards(
  readings: readonly IndicatorReading[],
  ids: readonly IndicatorId[],
): CommoditiesCardEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return ids.map((id) => ({ id: id as CommoditiesCardId, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * The gold cross-links (§11 "Cross-links", D-19/D-27): gold and its
 * ratios live on /gold — the ONE commodity exception. The metals group
 * carries a single cross-link chip to /gold (the gold/silver,
 * gold/platinum, gold/oil ratios are on the Gold page, never
 * re-rendered here). Restated lean so this pure module never imports
 * the router (the GoldSeats PAGE_ROUTE discipline).
 * ------------------------------------------------------------------ */

/** The Gold page's route (D-46 — the one commodity exception's home). */
export const COMMODITIES_GOLD_HREF = '/gold';

/* ------------------------------------------------------------------ *
 * The cards' display configs — the DISPLAY registry's own values for the
 * 24 Commodities ids, restated here so the lean Commodities chunk does not
 * pull the config module chain (the S3/S5/S7/S9/S12/S14/S16 pattern). The
 * decimals/units/scale are pinned against config/display.ts by
 * commodities-tiles.test.ts — and the VALUE RENDER is pinned against
 * `formatReadingValue` output-for-output over every id × both locales.
 *
 * The 24 ids span FIVE unit families: usd (13 — the oil/gas/LNG/coal/
 * metals/agriculture/BTC prices), index (3 — the food index, the crypto
 * fear & greed, the GSCPI), barrels (2 — the crude stocks + the SPR,
 * both scaled 1e-3 to millions), barrels-per-day (1 — the US production
 * rate, scaled 1e-3) and transits (5 — the chokepoint 7-day averages).
 * The equivalence pin proves the join matches formatReadingValue over
 * all five shapes.
 * ------------------------------------------------------------------ */

export type CommoditiesUnitToken =
  | 'usd'
  | 'index'
  | 'barrels'
  | 'barrels-per-day'
  | 'transits';

export interface CommoditiesCardDisplayConfig {
  decimals: number;
  unit: CommoditiesUnitToken;
  /** The multiplicative display scale (the barrels family's 1e-3 — the
   *  raw thousands-of-barrels → millions). Absent → 1 (no scale). */
  scale?: number;
}

export const COMMODITIES_CARD_DISPLAY: Readonly<Record<CommoditiesCardId, CommoditiesCardDisplayConfig>> = {
  brent: { decimals: 2, unit: 'usd' },
  wti: { decimals: 2, unit: 'usd' },
  natgas: { decimals: 2, unit: 'usd' },
  'gas-europe': { decimals: 2, unit: 'usd' },
  'lng-japan': { decimals: 2, unit: 'usd' },
  'coal-aus': { decimals: 1, unit: 'usd' },
  'eia-crude-stocks': { decimals: 1, unit: 'barrels', scale: 1e-3 },
  'us-spr': { decimals: 1, unit: 'barrels', scale: 1e-3 },
  'us-crude-production': { decimals: 2, unit: 'barrels-per-day', scale: 1e-3 },
  'silver-usd': { decimals: 2, unit: 'usd' },
  platinum: { decimals: 2, unit: 'usd' },
  'copper-usd': { decimals: 0, unit: 'usd' },
  'iron-ore': { decimals: 1, unit: 'usd' },
  'food-index': { decimals: 1, unit: 'index' },
  wheat: { decimals: 1, unit: 'usd' },
  maize: { decimals: 1, unit: 'usd' },
  'btc-usd': { decimals: 0, unit: 'usd' },
  'crypto-fng': { decimals: 0, unit: 'index' },
  'chokepoint-suez': { decimals: 1, unit: 'transits' },
  'chokepoint-panama': { decimals: 1, unit: 'transits' },
  'chokepoint-bab-el-mandeb': { decimals: 1, unit: 'transits' },
  'chokepoint-malacca': { decimals: 1, unit: 'transits' },
  'chokepoint-taiwan': { decimals: 1, unit: 'transits' },
  gscpi: { decimals: 2, unit: 'index' },
};

/** The locale-dependent unit labels the value render joins (the corpus's
 *  own units block, pinned by commodities-copy-pin.test.ts). */
export interface CommoditiesUnitLabels {
  usd: string;
  index: string;
  barrels: string;
  'barrels-per-day': string;
  transits: string;
}

/**
 * One card's VALUE — the DISPLAY registry's own render, restated lean
 * (the indicatorValueParts + formatIndicatorValue join): the usd unit is
 * PREFIXED in EN ('US$113.96' — no space, the currency before the number)
 * and suffixed in fa ('۱۱۳٫۹۶ دلار' — the number then the word); the
 * word units (index · barrels · barrels-per-day · transits) suffix with
 * a space in both locales ('109.87 index' · '416.7m barrels' · '13.99m
 * barrels a day' · '45.3 transits a day'). null = the reading is absent
 * or carries no value (the honest unavailable word, never a guess).
 *
 * Pinned output-for-output against `formatReadingValue` over every id ×
 * both locales by commodities-tiles.test.ts — the lean restatement can
 * never drift from the legacy renderer.
 */
export function commoditiesCardValueText(
  id: CommoditiesCardId,
  reading: IndicatorReading | undefined,
  numberLocale: 'en-US' | 'fa-IR',
  units: CommoditiesUnitLabels,
): string | null {
  if (reading === undefined || reading.value === null) return null;
  const cfg = COMMODITIES_CARD_DISPLAY[id];
  const num = formatNumber(reading.value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return num;
  // The usd unit is PREFIXED in EN ('US$113.96'), suffixed in fa
  // ('۱۱۳٫۹۶ دلار') — the PREFIXED_UNITS discipline from
  // config/display.ts's indicatorValueParts, restated lean.
  if (cfg.unit === 'usd') {
    return numberLocale === 'en-US' ? `${unit}${num}` : `${num} ${unit}`;
  }
  // The word units suffix with a space in both locales.
  return `${num} ${unit}`;
}
