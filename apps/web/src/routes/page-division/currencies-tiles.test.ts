/**
 * currencies-tiles tests (S18, 2026-11-11) — the pure-derivation pins.
 *
 * What is pinned here (the S9 usa-tiles.test.ts / S12 europe-tiles.test.ts /
 * S14 asia-tiles.test.ts / S16 australia-tiles.test.ts / S17
 * commodities-tiles.test.ts pattern, scoped to Currencies' 14 placed ids):
 *
 *   - the two group lists ↔ the placement table's own groups
 *     (pageGroupIds), byte-for-byte, and the full card list is group
 *     order (7 + 7 = 14), no duplicates, and equals the page's own homes;
 *   - the 14 display configs (decimals + unit) ↔ the DISPLAY registry
 *     (config/display.ts), byte-for-byte;
 *   - the value render (currenciesCardValueText) ↔ `formatReadingValue`,
 *     output-for-output, over every id × both locales (the strongest pin:
 *     the lean restatement can never drift from the legacy renderer —
 *     including the eight PREFIXED currency units' prefix/suffix split,
 *     the tight percent join, and the word-unit suffix joins);
 *   - the 11-pair board order (D-42) ↔ the engine table's own
 *     FX_PAIR_IDS — the S18 11th pair audnzd last, never hand-copied;
 *   - the card entries — placement order, absent stays absent.
 */

import { describe, expect, it } from 'vitest';
import type { FxPairId, IndicatorId, IndicatorReading } from '@currena/core';
import { FX_PAIR_IDS } from '@currena/insights/fx/definitions';
import { pageGroupIds, pageHomeIds } from '@currena/insights/page-division';
import { DISPLAY, formatReadingValue, type UnitLabels } from '../../components/insights/config/display';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import {
  CURRENCIES_BOARD_PAIR_IDS,
  CURRENCIES_CARD_DISPLAY,
  CURRENCIES_CARD_IDS,
  CURRENCIES_DOLLAR_STANDING_IDS,
  CURRENCIES_PAIR_CARD_IDS,
  currenciesCardValueText,
  currenciesCards,
  type CurrenciesCardId,
  type CurrenciesUnitLabels,
} from './currencies-tiles';

/** The corpus units, typed as the display registry's own labels shape. */
const EN_UNITS = insightsCopyEn.units as unknown as UnitLabels;
const FA_UNITS = insightsCopyFa.units as unknown as UnitLabels;
const enCuUnits: CurrenciesUnitLabels = {
  index: insightsCopyEn.units.index,
  points: insightsCopyEn.units.points,
  percent: insightsCopyEn.units.percent,
  try: insightsCopyEn.units.try,
  aed: insightsCopyEn.units.aed,
  jpy: insightsCopyEn.units.jpy,
  eur: insightsCopyEn.units.eur,
  chf: insightsCopyEn.units.chf,
  cny: insightsCopyEn.units.cny,
  usd: insightsCopyEn.units.usd,
  nzd: insightsCopyEn.units.nzd,
};
const faCuUnits: CurrenciesUnitLabels = {
  index: insightsCopyFa.units.index,
  points: insightsCopyFa.units.points,
  percent: insightsCopyFa.units.percent,
  try: insightsCopyFa.units.try,
  aed: insightsCopyFa.units.aed,
  jpy: insightsCopyFa.units.jpy,
  eur: insightsCopyFa.units.eur,
  chf: insightsCopyFa.units.chf,
  cny: insightsCopyFa.units.cny,
  usd: insightsCopyFa.units.usd,
  nzd: insightsCopyFa.units.nzd,
};

/** A representative value per id (real-world magnitudes — the equivalence
 *  pin runs the SAME reading through both renderers; 4dp pairs carry
 *  4-decimal values, 2dp rows carry 2-decimal values). */
const FIXTURE_VALUE: Readonly<Record<CurrenciesCardId, number>> = {
  'dollar-basket': 101.852,
  'dollar-broad': 120.44,
  'dollar-eme': 2310.55,
  'us-japan-10y-gap': 3.41,
  usdtry: 34.56,
  usdaed: 3.67,
  'usd-reserve-share': 56.7,
  usdjpy: 150.23,
  'eur-usd': 0.9012,
  usdchf: 0.8795,
  usdcny: 7.1025,
  audusd: 0.6585,
  audjpy: 98.94,
  audnzd: 1.2283,
};

/** One fixture reading for an id. */
function fixtureReading(id: CurrenciesCardId): IndicatorReading {
  return {
    id,
    value: FIXTURE_VALUE[id],
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: 'normal',
  } as IndicatorReading;
}

describe('the section lists — the placement table’s own groups (D-32/D-42)', () => {
  it('the Dollar standing section is pageGroupIds("currencies", "dollar-standing") byte-for-byte (§12 item 3, D-32: the seven cards)', () => {
    expect(CURRENCIES_DOLLAR_STANDING_IDS).toEqual(pageGroupIds('currencies', 'dollar-standing'));
    expect(CURRENCIES_DOLLAR_STANDING_IDS).toEqual([
      'dollar-basket',
      'dollar-broad',
      'dollar-eme',
      'us-japan-10y-gap',
      'usdtry',
      'usdaed',
      'usd-reserve-share',
    ]);
    expect(CURRENCIES_DOLLAR_STANDING_IDS).toHaveLength(7);
  });

  it('the Pair context section is pageGroupIds("currencies", "pairs") byte-for-byte (§12 item 2’s registry leg, D-32/D-42)', () => {
    expect(CURRENCIES_PAIR_CARD_IDS).toEqual(pageGroupIds('currencies', 'pairs'));
    expect(CURRENCIES_PAIR_CARD_IDS).toEqual(['usdjpy', 'eur-usd', 'usdchf', 'usdcny', 'audusd', 'audjpy', 'audnzd']);
    expect(CURRENCIES_PAIR_CARD_IDS).toHaveLength(7);
  });

  it('the full card list is group order (7 + 7 = 14), no duplicates, and equals the page’s own homes', () => {
    expect(CURRENCIES_CARD_IDS).toEqual([...CURRENCIES_DOLLAR_STANDING_IDS, ...CURRENCIES_PAIR_CARD_IDS]);
    expect(CURRENCIES_CARD_IDS).toHaveLength(14);
    expect(new Set(CURRENCIES_CARD_IDS).size).toBe(14);
    // The placement table's own count: the currencies page carries 14
    // registry cards (the §14 spec list, reconciled by the generator).
    expect(pageHomeIds('currencies')).toHaveLength(14);
    expect(pageHomeIds('currencies')).toEqual(CURRENCIES_CARD_IDS as readonly IndicatorId[]);
  });
});

describe('the 11-pair board order — the engine table’s own FX_PAIR_IDS (D-42)', () => {
  it('the board order is FX_PAIR_IDS byte-for-byte, 11 pairs, audnzd last (the S18 11th pair)', () => {
    expect(CURRENCIES_BOARD_PAIR_IDS).toEqual(FX_PAIR_IDS);
    expect(CURRENCIES_BOARD_PAIR_IDS).toEqual([
      'eurusd',
      'usdjpy',
      'gbpusd',
      'usdchf',
      'usdcny',
      'audusd',
      'audjpy',
      'eurjpy',
      'eurchf',
      'audcny',
      'audnzd',
    ] satisfies readonly FxPairId[]);
    expect(CURRENCIES_BOARD_PAIR_IDS).toHaveLength(11);
    expect(new Set(CURRENCIES_BOARD_PAIR_IDS).size).toBe(11);
  });
});

describe('the display configs — the DISPLAY registry’s own values for the 14 ids', () => {
  it('every one of the 14 ids matches decimals + unit (+ scale)', () => {
    for (const id of CURRENCIES_CARD_IDS as readonly CurrenciesCardId[]) {
      const registry = DISPLAY[id as IndicatorId];
      expect(registry, `${id} exists in the DISPLAY registry`).toBeDefined();
      const lean = CURRENCIES_CARD_DISPLAY[id];
      expect(lean.decimals, `${id} decimals`).toBe(registry.decimals);
      expect(lean.unit, `${id} unit`).toBe(registry.unit);
      // No id on this page is rescaled (no barrels-style family here) — the
      // registry's own scale must be absent for every one of the 14.
      expect(registry.scale ?? null, `${id} registry scale`).toBeNull();
    }
  });

  it('the 14 ids span the ELEVEN unit families (index · points · percent + the eight currency units)', () => {
    const units = new Set(CURRENCIES_CARD_IDS.map((id) => CURRENCIES_CARD_DISPLAY[id as CurrenciesCardId].unit));
    expect(units).toEqual(
      new Set(['index', 'points', 'percent', 'try', 'aed', 'jpy', 'eur', 'chf', 'cny', 'usd', 'nzd']),
    );
  });
});

describe('the value render — EQUIVALENT to formatReadingValue, output-for-output', () => {
  it('every id × both locales (byte-identical joins)', () => {
    for (const id of CURRENCIES_CARD_IDS as readonly CurrenciesCardId[]) {
      const reading = fixtureReading(id);
      const enRegistry = formatReadingValue(reading, 'en-US', EN_UNITS);
      const enLean = currenciesCardValueText(id, reading, 'en-US', enCuUnits);
      expect(enLean, `${id} en`).toBe(enRegistry);
      const faRegistry = formatReadingValue(reading, 'fa-IR', FA_UNITS);
      const faLean = currenciesCardValueText(id, reading, 'fa-IR', faCuUnits);
      expect(faLean, `${id} fa`).toBe(faRegistry);
    }
  });

  it('the family conventions hold (the fixture’s own renders)', () => {
    // The currency units are PREFIXED in EN (no space, the unit before
    // the number)…
    expect(currenciesCardValueText('usdtry', fixtureReading('usdtry'), 'en-US', enCuUnits)).toBe('₺34.56');
    expect(currenciesCardValueText('usdjpy', fixtureReading('usdjpy'), 'en-US', enCuUnits)).toBe('¥150.23');
    expect(currenciesCardValueText('eur-usd', fixtureReading('eur-usd'), 'en-US', enCuUnits)).toBe('€0.9012');
    expect(currenciesCardValueText('usdchf', fixtureReading('usdchf'), 'en-US', enCuUnits)).toBe('CHF0.8795');
    expect(currenciesCardValueText('usdcny', fixtureReading('usdcny'), 'en-US', enCuUnits)).toBe('CN¥7.1025');
    expect(currenciesCardValueText('audusd', fixtureReading('audusd'), 'en-US', enCuUnits)).toBe('US$0.6585');
    expect(currenciesCardValueText('audnzd', fixtureReading('audnzd'), 'en-US', enCuUnits)).toBe('NZ$1.2283');
    // …while the AED dirham SUFFIXES with a space in both locales (the
    // registry's own non-prefixed set).
    expect(currenciesCardValueText('usdaed', fixtureReading('usdaed'), 'en-US', enCuUnits)).toBe('3.67 AED');
    expect(currenciesCardValueText('usdaed', fixtureReading('usdaed'), 'fa-IR', faCuUnits)).toBe('۳٫۶۷ درهم امارات');
    // …and the prefixed units are SUFFIXED in fa (the number then the word).
    expect(currenciesCardValueText('usdtry', fixtureReading('usdtry'), 'fa-IR', faCuUnits)).toBe('۳۴٫۵۶ لیر ترکیه');
    expect(currenciesCardValueText('audnzd', fixtureReading('audnzd'), 'fa-IR', faCuUnits)).toBe('۱٫۲۲۸۳ دلار نیوزیلند');
    // The percent binds tight in both locales.
    expect(currenciesCardValueText('usd-reserve-share', fixtureReading('usd-reserve-share'), 'en-US', enCuUnits)).toBe('56.70%');
    expect(currenciesCardValueText('usd-reserve-share', fixtureReading('usd-reserve-share'), 'fa-IR', faCuUnits)).toBe('۵۶٫۷۰٪');
    // The word units suffix with a space in both locales.
    expect(currenciesCardValueText('dollar-basket', fixtureReading('dollar-basket'), 'en-US', enCuUnits)).toBe('101.85 index');
    expect(currenciesCardValueText('us-japan-10y-gap', fixtureReading('us-japan-10y-gap'), 'en-US', enCuUnits)).toBe('3.41 pts');
    expect(currenciesCardValueText('dollar-basket', fixtureReading('dollar-basket'), 'fa-IR', faCuUnits)).toBe('۱۰۱٫۸۵ به‌صورت شاخص');
    expect(currenciesCardValueText('us-japan-10y-gap', fixtureReading('us-japan-10y-gap'), 'fa-IR', faCuUnits)).toBe('۳٫۴۱ واحد درصد');
  });

  it('absent readings and null values stay null (the honest unavailable word, never a guess)', () => {
    expect(currenciesCardValueText('dollar-basket', undefined, 'en-US', enCuUnits)).toBeNull();
    const unavailable = { id: 'dollar-basket', value: null, asOf: null, status: 'unavailable' } as IndicatorReading;
    expect(currenciesCardValueText('dollar-basket', unavailable, 'en-US', enCuUnits)).toBeNull();
  });
});

describe('the card entries — placement order, absent stays absent', () => {
  it('currenciesCards: the 14 entries in group order; missing readings stay undefined', () => {
    const basket = fixtureReading('dollar-basket');
    const audnzd = fixtureReading('audnzd');
    const entries = currenciesCards([basket, audnzd], CURRENCIES_CARD_IDS);
    expect(entries.map((e) => e.id)).toEqual([
      ...CURRENCIES_DOLLAR_STANDING_IDS,
      ...CURRENCIES_PAIR_CARD_IDS,
    ] as CurrenciesCardId[]);
    expect(entries.find((e) => e.id === 'dollar-basket')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'audnzd')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'dollar-broad')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'usdjpy')!.reading).toBeUndefined();
  });
});
