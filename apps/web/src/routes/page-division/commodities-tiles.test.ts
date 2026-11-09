/**
 * commodities-tiles tests (S17, 2026-11-11) — the pure-derivation pins.
 *
 * What is pinned here (the S9 usa-tiles.test.ts / S12 europe-tiles.test.ts /
 * S14 asia-tiles.test.ts / S16 australia-tiles.test.ts pattern, scoped to
 * Commodities' 24 placed ids):
 *
 *   - the five group lists ↔ the placement table's own groups
 *     (pageGroupIds), byte-for-byte, and the full card list is group
 *     order (9 + 4 + 3 + 2 + 6 = 24), no duplicates, and equals the
 *     page's own homes;
 *   - the 24 display configs (decimals + unit + scale) ↔ the DISPLAY
 *     registry (config/display.ts), byte-for-byte;
 *   - the value render (commoditiesCardValueText) ↔ `formatReadingValue`,
 *     output-for-output, over every id × both locales (the strongest pin:
 *     the lean restatement can never drift from the legacy renderer —
 *     including the usd prefix/suffix split, the index/barrels/transits
 *     suffix joins, and the 1e-3 scales on the barrels family);
 *   - the gold cross-link href ↔ /gold (D-19/D-27 — the one commodity
 *     exception's home);
 *   - the card entries — placement order, absent stays absent.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { pageGroupIds, pageHomeIds } from '@currena/insights/page-division';
import { DISPLAY, formatReadingValue, type UnitLabels } from '../../components/insights/config/display';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import {
  COMMODITIES_CARD_DISPLAY,
  COMMODITIES_CARD_IDS,
  COMMODITIES_ENERGY_IDS,
  COMMODITIES_METALS_IDS,
  COMMODITIES_AGRICULTURE_IDS,
  COMMODITIES_DIGITAL_IDS,
  COMMODITIES_TRADE_ROUTES_IDS,
  COMMODITIES_GOLD_HREF,
  commoditiesCardValueText,
  commoditiesCards,
  type CommoditiesCardId,
  type CommoditiesUnitLabels,
} from './commodities-tiles';

/** The corpus units, typed as the display registry's own labels shape. */
const EN_UNITS = insightsCopyEn.units as unknown as UnitLabels;
const FA_UNITS = insightsCopyFa.units as unknown as UnitLabels;
const enCoUnits: CommoditiesUnitLabels = {
  usd: insightsCopyEn.units.usd,
  index: insightsCopyEn.units.index,
  barrels: insightsCopyEn.units.barrels,
  'barrels-per-day': insightsCopyEn.units['barrels-per-day'],
  transits: insightsCopyEn.units.transits,
};
const faCoUnits: CommoditiesUnitLabels = {
  usd: insightsCopyFa.units.usd,
  index: insightsCopyFa.units.index,
  barrels: insightsCopyFa.units.barrels,
  'barrels-per-day': insightsCopyFa.units['barrels-per-day'],
  transits: insightsCopyFa.units.transits,
};

/** A representative value per id (real-world magnitudes — the equivalence
 *  pin runs the SAME reading through both renderers). The barrels family
 *  carries the RAW thousands-of-barrels value (the display scale 1e-3 →
 *  millions): eia-crude-stocks 416700 → "416.7m barrels", us-spr 387000
 *  → "387.0m barrels", us-crude-production 13990 → "13.99m barrels a
 *  day". */
const FIXTURE_VALUE: Readonly<Record<CommoditiesCardId, number>> = {
  brent: 73.45,
  wti: 69.87,
  natgas: 2.84,
  'gas-europe': 13.5,
  'lng-japan': 12.3,
  'coal-aus': 113.5,
  'eia-crude-stocks': 416700,
  'us-spr': 387000,
  'us-crude-production': 13990,
  'silver-usd': 31.27,
  platinum: 995.4,
  'copper-usd': 9540,
  'iron-ore': 109.8,
  'food-index': 121.3,
  wheat: 5.67,
  maize: 4.32,
  'btc-usd': 67250,
  'crypto-fng': 72,
  'chokepoint-suez': 65.3,
  'chokepoint-panama': 27.1,
  'chokepoint-bab-el-mandeb': 12.4,
  'chokepoint-malacca': 230.5,
  'chokepoint-taiwan': 88.7,
  gscpi: -0.42,
};

/** One fixture reading for an id. */
function fixtureReading(id: CommoditiesCardId): IndicatorReading {
  return {
    id,
    value: FIXTURE_VALUE[id],
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: 'normal',
  } as IndicatorReading;
}

describe('the section lists — the placement table’s own groups (D-38/D-39)', () => {
  it('the Energy section is pageGroupIds("commodities", "energy") byte-for-byte (§11: the nine cards)', () => {
    expect(COMMODITIES_ENERGY_IDS).toEqual(pageGroupIds('commodities', 'energy'));
    expect(COMMODITIES_ENERGY_IDS).toEqual([
      'brent',
      'wti',
      'natgas',
      'gas-europe',
      'lng-japan',
      'coal-aus',
      'eia-crude-stocks',
      'us-spr',
      'us-crude-production',
    ]);
    expect(COMMODITIES_ENERGY_IDS).toHaveLength(9);
  });

  it('the Metals section is pageGroupIds("commodities", "metals") byte-for-byte (§11: the four price cards — D-27 gold ratios stay on /gold)', () => {
    expect(COMMODITIES_METALS_IDS).toEqual(pageGroupIds('commodities', 'metals'));
    expect(COMMODITIES_METALS_IDS).toEqual(['silver-usd', 'platinum', 'copper-usd', 'iron-ore']);
    expect(COMMODITIES_METALS_IDS).toHaveLength(4);
  });

  it('the Agriculture section is pageGroupIds("commodities", "agriculture") byte-for-byte (§11: the three cards)', () => {
    expect(COMMODITIES_AGRICULTURE_IDS).toEqual(pageGroupIds('commodities', 'agriculture'));
    expect(COMMODITIES_AGRICULTURE_IDS).toEqual(['food-index', 'wheat', 'maize']);
    expect(COMMODITIES_AGRICULTURE_IDS).toHaveLength(3);
  });

  it('the Digital section is pageGroupIds("commodities", "digital") byte-for-byte (§11: the two cards — D-28/D-40)', () => {
    expect(COMMODITIES_DIGITAL_IDS).toEqual(pageGroupIds('commodities', 'digital'));
    expect(COMMODITIES_DIGITAL_IDS).toEqual(['btc-usd', 'crypto-fng']);
    expect(COMMODITIES_DIGITAL_IDS).toHaveLength(2);
  });

  it('the Trade routes & supply section is pageGroupIds("commodities", "trade-routes-supply") byte-for-byte (§11, D-39: the six cards)', () => {
    expect(COMMODITIES_TRADE_ROUTES_IDS).toEqual(pageGroupIds('commodities', 'trade-routes-supply'));
    expect(COMMODITIES_TRADE_ROUTES_IDS).toEqual([
      'chokepoint-suez',
      'chokepoint-panama',
      'chokepoint-bab-el-mandeb',
      'chokepoint-malacca',
      'chokepoint-taiwan',
      'gscpi',
    ]);
    expect(COMMODITIES_TRADE_ROUTES_IDS).toHaveLength(6);
  });

  it('the full card list is group order (9 + 4 + 3 + 2 + 6 = 24), no duplicates, and equals the page’s own homes', () => {
    expect(COMMODITIES_CARD_IDS).toEqual([
      ...COMMODITIES_ENERGY_IDS,
      ...COMMODITIES_METALS_IDS,
      ...COMMODITIES_AGRICULTURE_IDS,
      ...COMMODITIES_DIGITAL_IDS,
      ...COMMODITIES_TRADE_ROUTES_IDS,
    ]);
    expect(COMMODITIES_CARD_IDS).toHaveLength(24);
    expect(new Set(COMMODITIES_CARD_IDS).size).toBe(24);
    // The placement table's own count: the commodities page carries 24
    // registry cards (the §11 spec list, reconciled by the generator).
    expect(pageHomeIds('commodities')).toHaveLength(24);
    expect(pageHomeIds('commodities')).toEqual(COMMODITIES_CARD_IDS as readonly IndicatorId[]);
  });
});

describe('the display configs — the DISPLAY registry’s own values for the 24 ids', () => {
  it('every one of the 24 ids matches decimals + unit (+ scale)', () => {
    for (const id of COMMODITIES_CARD_IDS as readonly CommoditiesCardId[]) {
      const registry = DISPLAY[id as IndicatorId];
      expect(registry, `${id} exists in the DISPLAY registry`).toBeDefined();
      const lean = COMMODITIES_CARD_DISPLAY[id];
      expect(lean.decimals, `${id} decimals`).toBe(registry.decimals);
      expect(lean.unit, `${id} unit`).toBe(registry.unit);
      expect(lean.scale, `${id} scale`).toBe(registry.scale);
    }
  });

  it('the 24 ids span the FIVE unit families (usd · index · barrels · barrels-per-day · transits)', () => {
    const units = new Set(COMMODITIES_CARD_IDS.map((id) => COMMODITIES_CARD_DISPLAY[id as CommoditiesCardId].unit));
    expect(units).toEqual(new Set(['usd', 'index', 'barrels', 'barrels-per-day', 'transits']));
  });

  it('the barrels family: the THREE scaled ids (1e-3 — the raw thousands-of-barrels → millions)', () => {
    expect(COMMODITIES_CARD_DISPLAY['eia-crude-stocks']).toEqual({ decimals: 1, unit: 'barrels', scale: 1e-3 });
    expect(COMMODITIES_CARD_DISPLAY['us-spr']).toEqual({ decimals: 1, unit: 'barrels', scale: 1e-3 });
    expect(COMMODITIES_CARD_DISPLAY['us-crude-production']).toEqual({ decimals: 2, unit: 'barrels-per-day', scale: 1e-3 });
  });
});

describe('the value render — EQUIVALENT to formatReadingValue, output-for-output', () => {
  it('every id × both locales (byte-identical joins)', () => {
    for (const id of COMMODITIES_CARD_IDS as readonly CommoditiesCardId[]) {
      const reading = fixtureReading(id);
      const enRegistry = formatReadingValue(reading, 'en-US', EN_UNITS);
      const enLean = commoditiesCardValueText(id, reading, 'en-US', enCoUnits);
      expect(enLean, `${id} en`).toBe(enRegistry);
      const faRegistry = formatReadingValue(reading, 'fa-IR', FA_UNITS);
      const faLean = commoditiesCardValueText(id, reading, 'fa-IR', faCoUnits);
      expect(faLean, `${id} fa`).toBe(faRegistry);
    }
  });

  it('the family conventions hold (the fixture’s own renders)', () => {
    // The usd unit is PREFIXED in EN ('US$113.96' — no space, the
    // currency before the number); suffixed in fa ('۱۱۳٫۹۶ دلار').
    expect(commoditiesCardValueText('brent', fixtureReading('brent'), 'en-US', enCoUnits)).toBe('US$73.45');
    expect(commoditiesCardValueText('iron-ore', fixtureReading('iron-ore'), 'en-US', enCoUnits)).toBe('US$109.8');
    expect(commoditiesCardValueText('btc-usd', fixtureReading('btc-usd'), 'en-US', enCoUnits)).toBe('US$67,250');
    expect(commoditiesCardValueText('brent', fixtureReading('brent'), 'fa-IR', faCoUnits)).toBe('۷۳٫۴۵ دلار');
    // The word units suffix with a space in both locales.
    expect(commoditiesCardValueText('food-index', fixtureReading('food-index'), 'en-US', enCoUnits)).toBe('121.3 index');
    expect(commoditiesCardValueText('gscpi', fixtureReading('gscpi'), 'en-US', enCoUnits)).toBe('-0.42 index');
    expect(commoditiesCardValueText('crypto-fng', fixtureReading('crypto-fng'), 'en-US', enCoUnits)).toBe('72 index');
    // The barrels family (scaled 1e-3 → millions).
    expect(commoditiesCardValueText('eia-crude-stocks', fixtureReading('eia-crude-stocks'), 'en-US', enCoUnits)).toBe('416.7 m barrels');
    expect(commoditiesCardValueText('us-spr', fixtureReading('us-spr'), 'en-US', enCoUnits)).toBe('387.0 m barrels');
    expect(commoditiesCardValueText('us-crude-production', fixtureReading('us-crude-production'), 'en-US', enCoUnits)).toBe('13.99 m barrels a day');
    // The transits family.
    expect(commoditiesCardValueText('chokepoint-suez', fixtureReading('chokepoint-suez'), 'en-US', enCoUnits)).toBe('65.3 transits a day');
    expect(commoditiesCardValueText('chokepoint-malacca', fixtureReading('chokepoint-malacca'), 'en-US', enCoUnits)).toBe('230.5 transits a day');
    // The fa barrels + transits joins (Persian digits + the suffix word).
    expect(commoditiesCardValueText('eia-crude-stocks', fixtureReading('eia-crude-stocks'), 'fa-IR', faCoUnits)).toBe('۴۱۶٫۷ میلیون بشکه');
    expect(commoditiesCardValueText('chokepoint-suez', fixtureReading('chokepoint-suez'), 'fa-IR', faCoUnits)).toBe('۶۵٫۳ تردد در روز');
  });

  it('absent readings and null values stay null (the honest unavailable word, never a guess)', () => {
    expect(commoditiesCardValueText('brent', undefined, 'en-US', enCoUnits)).toBeNull();
    const unavailable = { id: 'brent', value: null, asOf: null, status: 'unavailable' } as IndicatorReading;
    expect(commoditiesCardValueText('brent', unavailable, 'en-US', enCoUnits)).toBeNull();
  });
});

describe('the gold cross-link — the one commodity exception (§11 "Cross-links", D-19/D-27)', () => {
  it('the gold cross-link href is /gold (gold and its ratios live on the Gold page)', () => {
    expect(COMMODITIES_GOLD_HREF).toBe('/gold');
  });
});

describe('the card entries — placement order, absent stays absent', () => {
  it('commoditiesCards: the 24 entries in group order; missing readings stay undefined', () => {
    const brent = fixtureReading('brent');
    const gscpi = fixtureReading('gscpi');
    const entries = commoditiesCards([brent, gscpi], COMMODITIES_CARD_IDS);
    expect(entries.map((e) => e.id)).toEqual([
      ...COMMODITIES_ENERGY_IDS,
      ...COMMODITIES_METALS_IDS,
      ...COMMODITIES_AGRICULTURE_IDS,
      ...COMMODITIES_DIGITAL_IDS,
      ...COMMODITIES_TRADE_ROUTES_IDS,
    ] as CommoditiesCardId[]);
    expect(entries.find((e) => e.id === 'brent')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'gscpi')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'wti')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'silver-usd')!.reading).toBeUndefined();
  });
});
