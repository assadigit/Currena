/**
 * europe-tiles tests (S12, 2026-11-09) — the pure-derivation pins.
 *
 * What is pinned here (the S9 usa-tiles.test.ts pattern, scoped to
 * Europe's 8 placed ids):
 *
 *   - the EU + UK section lists ↔ the placement table's own groups
 *     (pageGroupIds), byte-for-byte, and the full card list is section
 *     order (6 + 2 = 8), no duplicates, and equals the page's own homes;
 *   - the 8 display configs (decimals + unit) ↔ the DISPLAY registry
 *     (config/display.ts), byte-for-byte;
 *   - the value render (europeCardValueText) ↔ `formatReadingValue`,
 *     output-for-output, over every id × both locales (the strongest pin:
 *     the lean restatement can never drift from the legacy renderer);
 *   - the card entries — placement order, absent stays absent.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { pageGroupIds, pageHomeIds, PAGE_PLACEMENTS_BY_PAGE } from '@currena/insights/page-division';
import { DISPLAY, formatReadingValue, type UnitLabels } from '../../components/insights/config/display';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import {
  EUROPE_CARD_DISPLAY,
  EUROPE_CARD_IDS,
  EUROPE_EU_IDS,
  EUROPE_UK_IDS,
  europeCardValueText,
  europeCards,
  type EuropeCardId,
  type EuropeUnitLabels,
} from './europe-tiles';

/** The corpus units, typed as the display registry's own labels shape. */
const EN_UNITS = insightsCopyEn.units as unknown as UnitLabels;
const FA_UNITS = insightsCopyFa.units as unknown as UnitLabels;
const enEuropeUnits: EuropeUnitLabels = {
  percent: insightsCopyEn.units.percent,
  points: insightsCopyEn.units.points,
  index: insightsCopyEn.units.index,
};
const faEuropeUnits: EuropeUnitLabels = {
  percent: insightsCopyFa.units.percent,
  points: insightsCopyFa.units.points,
  index: insightsCopyFa.units.index,
};

/** A representative value per id (real-world magnitudes — the equivalence
 *  pin runs the SAME reading through both renderers). */
const FIXTURE_VALUE: Readonly<Record<EuropeCardId, number>> = {
  'ecb-dfr': 3.5,
  'euro-hicp': 2.4,
  'euro-aaa-10y': 2.71,
  'bund-10y': 2.35,
  'btp-bund-spread': 1.28,
  'oecd-cli-de': 99.2,
  'gilt-10y': 4.18,
  'boe-rate': 4.75,
};

/** One fixture reading for an id. */
function fixtureReading(id: EuropeCardId): IndicatorReading {
  return {
    id,
    value: FIXTURE_VALUE[id],
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: 'normal',
  } as IndicatorReading;
}

describe('the section lists — the placement table’s own groups (D-33)', () => {
  it('the EU section is pageGroupIds("europe", "eu-members") byte-for-byte (§8 item 1: the six euro-area cards)', () => {
    expect(EUROPE_EU_IDS).toEqual(pageGroupIds('europe', 'eu-members'));
    expect(EUROPE_EU_IDS).toEqual(['ecb-dfr', 'euro-hicp', 'euro-aaa-10y', 'bund-10y', 'btp-bund-spread', 'oecd-cli-de']);
    expect(EUROPE_EU_IDS).toHaveLength(6);
  });

  it('the UK section is pageGroupIds("europe", "non-eu-uk") byte-for-byte (§8 item 2: gilt-10y · boe-rate)', () => {
    expect(EUROPE_UK_IDS).toEqual(pageGroupIds('europe', 'non-eu-uk'));
    expect(EUROPE_UK_IDS).toEqual(['gilt-10y', 'boe-rate']);
    expect(EUROPE_UK_IDS).toHaveLength(2);
    // The placement group's own note carries the FTSE-on-the-map story.
    const group = PAGE_PLACEMENTS_BY_PAGE.get('europe')?.groups.find((g) => g.id === 'non-eu-uk');
    expect(group?.note).toContain('FTSE');
  });

  it('the full card list is section order (6 + 2 = 8), no duplicates, and equals the page’s own homes', () => {
    expect(EUROPE_CARD_IDS).toEqual([...EUROPE_EU_IDS, ...EUROPE_UK_IDS]);
    expect(EUROPE_CARD_IDS).toHaveLength(8);
    expect(new Set(EUROPE_CARD_IDS).size).toBe(8);
    // The placement table's own count: the europe page carries 8 registry
    // cards (the §15 fills land in a later session after live verification).
    expect(pageHomeIds('europe')).toHaveLength(8);
  });
});

describe('the display configs — the DISPLAY registry’s own values for the 8 ids', () => {
  it('every one of the 8 ids matches decimals + unit', () => {
    for (const id of EUROPE_CARD_IDS as readonly EuropeCardId[]) {
      const registry = DISPLAY[id as IndicatorId];
      expect(registry, `${id} exists in the DISPLAY registry`).toBeDefined();
      const lean = EUROPE_CARD_DISPLAY[id];
      expect(lean.decimals, `${id} decimals`).toBe(registry.decimals);
      expect(lean.unit, `${id} unit`).toBe(registry.unit);
      // Europe's 8 ids are all percent / points / index — no scale, no
      // range (the lean EuropeCardDisplayConfig type carries neither
      // field by design; the render handles exactly these three units).
    }
  });

  it('the 8 ids are the percent / points / index families only', () => {
    const units = new Set(EUROPE_CARD_IDS.map((id) => EUROPE_CARD_DISPLAY[id as EuropeCardId].unit));
    expect(units).toEqual(new Set(['percent', 'points', 'index']));
  });
});

describe('the value render — EQUIVALENT to formatReadingValue, output-for-output', () => {
  it('every id × both locales (byte-identical joins)', () => {
    for (const id of EUROPE_CARD_IDS as readonly EuropeCardId[]) {
      const reading = fixtureReading(id);
      const enRegistry = formatReadingValue(reading, 'en-US', EN_UNITS);
      const enLean = europeCardValueText(id, reading, 'en-US', enEuropeUnits);
      expect(enLean, `${id} en`).toBe(enRegistry);
      const faRegistry = formatReadingValue(reading, 'fa-IR', FA_UNITS);
      const faLean = europeCardValueText(id, reading, 'fa-IR', faEuropeUnits);
      expect(faLean, `${id} fa`).toBe(faRegistry);
    }
  });

  it('the family conventions hold (the fixture’s own renders)', () => {
    // percent binds tight; points and index suffix with a space.
    expect(europeCardValueText('ecb-dfr', fixtureReading('ecb-dfr'), 'en-US', enEuropeUnits)).toBe('3.50%');
    expect(europeCardValueText('euro-hicp', fixtureReading('euro-hicp'), 'en-US', enEuropeUnits)).toBe('2.4%');
    expect(europeCardValueText('btp-bund-spread', fixtureReading('btp-bund-spread'), 'en-US', enEuropeUnits)).toBe('1.28 pts');
    expect(europeCardValueText('oecd-cli-de', fixtureReading('oecd-cli-de'), 'en-US', enEuropeUnits)).toBe('99.2 index');
    expect(europeCardValueText('ecb-dfr', fixtureReading('ecb-dfr'), 'fa-IR', faEuropeUnits)).toBe('۳٫۵۰٪');
  });

  it('absent readings and null values stay null (the honest unavailable word, never a guess)', () => {
    expect(europeCardValueText('ecb-dfr', undefined, 'en-US', enEuropeUnits)).toBeNull();
    const unavailable = { id: 'ecb-dfr', value: null, asOf: null, status: 'unavailable' } as IndicatorReading;
    expect(europeCardValueText('ecb-dfr', unavailable, 'en-US', enEuropeUnits)).toBeNull();
  });
});

describe('the card entries — placement order, absent stays absent', () => {
  it('europeCards: the 8 entries in section order; missing readings stay undefined', () => {
    const dfr = fixtureReading('ecb-dfr');
    const gilt = fixtureReading('gilt-10y');
    const entries = europeCards([dfr, gilt], EUROPE_CARD_IDS);
    expect(entries.map((e) => e.id)).toEqual([...EUROPE_EU_IDS, ...EUROPE_UK_IDS]);
    expect(entries.find((e) => e.id === 'ecb-dfr')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'gilt-10y')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'euro-hicp')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'boe-rate')!.reading).toBeUndefined();
  });
});
