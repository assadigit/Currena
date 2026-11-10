/**
 * currencies-tiles tests (S18, 2026-11-12) — the pure-derivation pins.
 *
 * What is pinned here (the S9 usa-tiles.test.ts / S12 europe-tiles.test.ts /
 * S14 asia-tiles.test.ts / S16 australia-tiles.test.ts / S17
 * commodities-tiles.test.ts pattern, scoped to Currencies' 14 placed ids):
 *
 *   - the two section lists ↔ the placement table's own groups
 *     (pageGroupIds), byte-for-byte, and the full card list is group
 *     order (7 + 7 = 14), no duplicates, and equals the page's own homes;
 *   - the 14 display configs (decimals + unit) ↔ the DISPLAY registry
 *     (config/display.ts), byte-for-byte, and the 14 ids span the ELEVEN
 *     unit families;
 *   - the value render (currenciesCardValueText) ↔ `formatReadingValue`,
 *     output-for-output, over every id × both locales (the strongest pin:
 *     the lean restatement can never drift from the legacy renderer —
 *     including the percent bind, the EN currency prefixes (₺ · ¥ · € ·
 *     CHF · CN¥ · US$ · NZ$), the fa suffix words, and the word units
 *     index · pts · AED);
 *   - the pair board (D-42): the 11 board pair ids ↔ the fx engine's own
 *     FX_PAIR_IDS, byte-for-byte (audnzd last);
 *   - the rule lights (D-41): the 7 rule ids ↔ the fx engine's own
 *     FX_RULES order, and the copy-key mapping r1…r7;
 *   - the card entries — placement order, absent stays absent.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { FX_PAIR_IDS, FX_RULES } from '@currena/insights/fx/definitions';
import { pageGroupIds, pageHomeIds } from '@currena/insights/page-division';
import { DISPLAY, formatReadingValue, type UnitLabels } from '../../components/insights/config/display';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import {
  CURRENCIES_BOARD_PAIR_IDS,
  CURRENCIES_CARD_DISPLAY,
  CURRENCIES_CARD_IDS,
  CURRENCIES_DOLLAR_STANDING_IDS,
  CURRENCIES_PAIRS_IDS,
  CURRENCIES_RULE_IDS,
  currenciesCardValueText,
  currenciesCards,
  currenciesRuleCopyKey,
  type CurrenciesCardId,
  type CurrenciesUnitLabels,
} from './currencies-tiles';

/** The corpus units, typed as the display registry's own labels shape. */
const EN_UNITS = insightsCopyEn.units as unknown as UnitLabels;
const FA_UNITS = insightsCopyFa.units as unknown as UnitLabels;
const enCuUnits: CurrenciesUnitLabels = {
  percent: insightsCopyEn.units.percent,
  points: insightsCopyEn.units.points,
  index: insightsCopyEn.units.index,
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
  percent: insightsCopyFa.units.percent,
  points: insightsCopyFa.units.points,
  index: insightsCopyFa.units.index,
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
 *  pin runs the SAME reading through both renderers). */
const FIXTURE_VALUE: Readonly<Record<CurrenciesCardId, number>> = {
  'dollar-basket': 101.85,
  'dollar-broad': 121.3,
  'dollar-eme': 1720.5,
  'us-japan-10y-gap': 3.02,
  usdtry: 34.55,
  usdaed: 3.67,
  'usd-reserve-share': 56.7,
  usdjpy: 157.95,
  'eur-usd': 1.1193,
  usdchf: 0.8812,
  usdcny: 7.2345,
  audusd: 0.6578,
  audjpy: 103.9,
  audnzd: 1.0988,
};

/** One fixture reading for an id. */
function fixtureReading(id: CurrenciesCardId): IndicatorReading {
  return {
    id,
    value: FIXTURE_VALUE[id],
    asOf: '2026-11-09',
    percentile10y: 0.5,
    status: 'normal',
  } as IndicatorReading;
}

describe('the section lists — the placement table’s own groups (D-32/D-42)', () => {
  it('the dollar-standing section is pageGroupIds("currencies", "dollar-standing") byte-for-byte (§12 item 3, D-32: the seven cards)', () => {
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

  it('the pairs section is pageGroupIds("currencies", "pairs") byte-for-byte (§14’s pairs group: the seven decade cards)', () => {
    expect(CURRENCIES_PAIRS_IDS).toEqual(pageGroupIds('currencies', 'pairs'));
    expect(CURRENCIES_PAIRS_IDS).toEqual(['usdjpy', 'eur-usd', 'usdchf', 'usdcny', 'audusd', 'audjpy', 'audnzd']);
    expect(CURRENCIES_PAIRS_IDS).toHaveLength(7);
  });

  it('the full card list is group order (7 + 7 = 14), no duplicates, and equals the page’s own homes', () => {
    expect(CURRENCIES_CARD_IDS).toEqual([...CURRENCIES_DOLLAR_STANDING_IDS, ...CURRENCIES_PAIRS_IDS]);
    expect(CURRENCIES_CARD_IDS).toHaveLength(14);
    expect(new Set(CURRENCIES_CARD_IDS).size).toBe(14);
    // The placement table's own count: the currencies page carries 14
    // registry cards (the §14 spec list, reconciled by the generator).
    expect(pageHomeIds('currencies')).toHaveLength(14);
    expect(pageHomeIds('currencies')).toEqual(CURRENCIES_CARD_IDS as readonly IndicatorId[]);
  });
});

describe('the pair board + the rule lights — the fx engine’s own lists (D-41/D-42)', () => {
  it('the 11 board pair ids are the fx engine’s FX_PAIR_IDS byte-for-byte (D-42: AUDNZD last)', () => {
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
    ]);
    expect(CURRENCIES_BOARD_PAIR_IDS).toHaveLength(11);
  });

  it('the 7 rule ids are the fx engine’s FX_RULES order (D-41: R1–R7)', () => {
    expect(CURRENCIES_RULE_IDS).toEqual(FX_RULES.map((r) => r.id));
    expect(CURRENCIES_RULE_IDS).toEqual([
      'r1_risk_mood',
      'r2_carry_trade',
      'r3_dollar_strength',
      'r4_money_hiding',
      'r5_china_link',
      'r6_europe_worry',
      'r7_dollar_or_euro',
    ]);
    expect(CURRENCIES_RULE_IDS).toHaveLength(7);
  });

  it('the rule copy-key mapping: every engine id → its r1…r7 corpus key', () => {
    expect(currenciesRuleCopyKey('r1_risk_mood')).toBe('r1');
    expect(currenciesRuleCopyKey('r7_dollar_or_euro')).toBe('r7');
  });
});

describe('the display configs — the DISPLAY registry’s own values for the 14 ids', () => {
  it('every one of the 14 ids matches decimals + unit', () => {
    for (const id of CURRENCIES_CARD_IDS as readonly CurrenciesCardId[]) {
      const registry = DISPLAY[id as IndicatorId];
      expect(registry, `${id} exists in the DISPLAY registry`).toBeDefined();
      const lean = CURRENCIES_CARD_DISPLAY[id];
      expect(lean.decimals, `${id} decimals`).toBe(registry.decimals);
      expect(lean.unit, `${id} unit`).toBe(registry.unit);
      // The 14 Currencies ids carry no display scale (no barrels-style
      // families here) — the registry's own scale, when present, must
      // stay 1 or absent.
      expect(registry.scale ?? 1, `${id} scale`).toBe(1);
    }
  });

  it('the 14 ids span the ELEVEN unit families', () => {
    const units = new Set(CURRENCIES_CARD_IDS.map((id) => CURRENCIES_CARD_DISPLAY[id as CurrenciesCardId].unit));
    expect(units).toEqual(
      new Set(['percent', 'points', 'index', 'try', 'aed', 'jpy', 'eur', 'chf', 'cny', 'usd', 'nzd']),
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
    // The percent unit binds tight in both locales.
    expect(currenciesCardValueText('usd-reserve-share', fixtureReading('usd-reserve-share'), 'en-US', enCuUnits)).toBe('56.70%');
    expect(currenciesCardValueText('usd-reserve-share', fixtureReading('usd-reserve-share'), 'fa-IR', faCuUnits)).toBe('۵۶٫۷۰٪');
    // The EN currency PREFIXES (no space): ₺ · ¥ · € · CHF · CN¥ · US$ · NZ$.
    expect(currenciesCardValueText('usdtry', fixtureReading('usdtry'), 'en-US', enCuUnits)).toBe('₺34.55');
    expect(currenciesCardValueText('usdjpy', fixtureReading('usdjpy'), 'en-US', enCuUnits)).toBe('¥157.95');
    expect(currenciesCardValueText('eur-usd', fixtureReading('eur-usd'), 'en-US', enCuUnits)).toBe('€1.1193');
    expect(currenciesCardValueText('usdchf', fixtureReading('usdchf'), 'en-US', enCuUnits)).toBe('CHF0.8812');
    expect(currenciesCardValueText('usdcny', fixtureReading('usdcny'), 'en-US', enCuUnits)).toBe('CN¥7.2345');
    expect(currenciesCardValueText('audusd', fixtureReading('audusd'), 'en-US', enCuUnits)).toBe('US$0.6578');
    expect(currenciesCardValueText('audnzd', fixtureReading('audnzd'), 'en-US', enCuUnits)).toBe('NZ$1.0988');
    // The fa suffix words ('۳۴٫۵۵ لیر ترکیه' — the number then the word).
    expect(currenciesCardValueText('usdtry', fixtureReading('usdtry'), 'fa-IR', faCuUnits)).toBe('۳۴٫۵۵ لیر ترکیه');
    expect(currenciesCardValueText('audnzd', fixtureReading('audnzd'), 'fa-IR', faCuUnits)).toBe('۱٫۰۹۸۸ دلار نیوزیلند');
    // The word units suffix with a space in both locales ('101.85 index'
    // · '3.02 pts' · '3.67 AED' — aed is NOT prefixed).
    expect(currenciesCardValueText('dollar-basket', fixtureReading('dollar-basket'), 'en-US', enCuUnits)).toBe('101.85 index');
    expect(currenciesCardValueText('us-japan-10y-gap', fixtureReading('us-japan-10y-gap'), 'en-US', enCuUnits)).toBe('3.02 pts');
    expect(currenciesCardValueText('usdaed', fixtureReading('usdaed'), 'en-US', enCuUnits)).toBe('3.67 AED');
    // The fa word units.
    expect(currenciesCardValueText('dollar-basket', fixtureReading('dollar-basket'), 'fa-IR', faCuUnits)).toBe('۱۰۱٫۸۵ به‌صورت شاخص');
    expect(currenciesCardValueText('us-japan-10y-gap', fixtureReading('us-japan-10y-gap'), 'fa-IR', faCuUnits)).toBe('۳٫۰۲ واحد درصد');
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
      ...CURRENCIES_PAIRS_IDS,
    ] as CurrenciesCardId[]);
    expect(entries.find((e) => e.id === 'dollar-basket')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'audnzd')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'dollar-broad')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'usdjpy')!.reading).toBeUndefined();
  });
});
