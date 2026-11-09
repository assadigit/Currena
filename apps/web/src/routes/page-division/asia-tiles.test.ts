/**
 * asia-tiles tests (S14, 2026-11-09) — the pure-derivation pins.
 *
 * What is pinned here (the S9 usa-tiles.test.ts / S12 europe-tiles.test.ts
 * pattern, scoped to Asia's 11 placed ids):
 *
 *   - the five section lists ↔ the placement table's own groups
 *     (pageGroupIds), byte-for-byte, and the full card list is section
 *     order (7 + 2 + 2 = 11 — the two index-only groups contribute NO
 *     registry cards), no duplicates, and equals the page's own homes;
 *   - the two index-only groups (korea-taiwan-hk, india) are EMPTY —
 *     the honest index-only contract (their markets ride the zoom, the
 *     §15 CPI fills are verified-pending-ingest, never a silently-empty
 *     card grid);
 *   - the 11 display configs (decimals + unit + scale) ↔ the DISPLAY
 *     registry (config/display.ts), byte-for-byte;
 *   - the value render (asiaCardValueText) ↔ `formatReadingValue`,
 *     output-for-output, over every id × both locales (the strongest
 *     pin: the lean restatement can never drift from the legacy
 *     renderer — including china-steel-output's tonnes+scale, the ONE
 *     Asia id beyond Europe's three-unit lean render);
 *   - the card entries — placement order, absent stays absent.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { pageGroupIds, pageHomeIds, PAGE_PLACEMENTS_BY_PAGE } from '@currena/insights/page-division';
import { DISPLAY, formatReadingValue, type UnitLabels } from '../../components/insights/config/display';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import {
  ASIA_CARD_DISPLAY,
  ASIA_CARD_IDS,
  ASIA_CHINA_IDS,
  ASIA_JAPAN_IDS,
  ASIA_KOREA_TAIWAN_HK_IDS,
  ASIA_INDIA_IDS,
  ASIA_PACIFIC_NZ_IDS,
  asiaCardValueText,
  asiaCards,
  type AsiaCardId,
  type AsiaUnitLabels,
} from './asia-tiles';

/** The corpus units, typed as the display registry's own labels shape. */
const EN_UNITS = insightsCopyEn.units as unknown as UnitLabels;
const FA_UNITS = insightsCopyFa.units as unknown as UnitLabels;
const enAsiaUnits: AsiaUnitLabels = {
  percent: insightsCopyEn.units.percent,
  points: insightsCopyEn.units.points,
  index: insightsCopyEn.units.index,
  tonnes: insightsCopyEn.units.tonnes,
};
const faAsiaUnits: AsiaUnitLabels = {
  percent: insightsCopyFa.units.percent,
  points: insightsCopyFa.units.points,
  index: insightsCopyFa.units.index,
  tonnes: insightsCopyFa.units.tonnes,
};

/** A representative value per id (real-world magnitudes — the equivalence
 *  pin runs the SAME reading through both renderers). china-steel-output's
 *  raw value (7359) is in the NBS's own 10,000-ton unit; the display scale
 *  1e-2 → 73.6 m tonnes. */
const FIXTURE_VALUE: Readonly<Record<AsiaCardId, number>> = {
  'china-pmi': 49.5,
  'china-cpi': 0.4,
  'oecd-cli-cn': 99.2,
  'gpr-china': 109.87,
  'gpr-taiwan': 131.45,
  'china-property-investment': -9.3,
  'china-steel-output': 7359,
  'jgb-10y': 1.07,
  'boj-rate': 0.25,
  'nz-short-rate': 4.75,
  'nz-10y': 4.55,
};

/** One fixture reading for an id. */
function fixtureReading(id: AsiaCardId): IndicatorReading {
  return {
    id,
    value: FIXTURE_VALUE[id],
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: 'normal',
  } as IndicatorReading;
}

describe('the section lists — the placement table’s own groups (D-35)', () => {
  it('the China section is pageGroupIds("asia-pacific", "china") byte-for-byte (§9 item 1: the seven China cards)', () => {
    expect(ASIA_CHINA_IDS).toEqual(pageGroupIds('asia-pacific', 'china'));
    expect(ASIA_CHINA_IDS).toEqual(['china-pmi', 'china-cpi', 'oecd-cli-cn', 'gpr-china', 'gpr-taiwan', 'china-property-investment', 'china-steel-output']);
    expect(ASIA_CHINA_IDS).toHaveLength(7);
  });

  it('the Japan section is pageGroupIds("asia-pacific", "japan") byte-for-byte (§9 item 2: jgb-10y · boj-rate)', () => {
    expect(ASIA_JAPAN_IDS).toEqual(pageGroupIds('asia-pacific', 'japan'));
    expect(ASIA_JAPAN_IDS).toEqual(['jgb-10y', 'boj-rate']);
    expect(ASIA_JAPAN_IDS).toHaveLength(2);
  });

  it('the Korea/Taiwan/HK section is INDEX-ONLY today (§9 item 3 — the placement group is empty; KOSPI · TAIEX · HSI ride the markets board)', () => {
    expect(ASIA_KOREA_TAIWAN_HK_IDS).toEqual(pageGroupIds('asia-pacific', 'korea-taiwan-hk'));
    expect(ASIA_KOREA_TAIWAN_HK_IDS).toEqual([]);
    // The placement group's own note carries the index-only story.
    const group = PAGE_PLACEMENTS_BY_PAGE.get('asia-pacific')?.groups.find((g) => g.id === 'korea-taiwan-hk');
    expect(group?.note).toContain('Index-only');
  });

  it('the India section is INDEX-ONLY today (§9 item 4 — the placement group is empty; NIFTY50 rides the markets board)', () => {
    expect(ASIA_INDIA_IDS).toEqual(pageGroupIds('asia-pacific', 'india'));
    expect(ASIA_INDIA_IDS).toEqual([]);
    const group = PAGE_PLACEMENTS_BY_PAGE.get('asia-pacific')?.groups.find((g) => g.id === 'india');
    expect(group?.note).toContain('Index-only');
  });

  it('the Pacific NZ section is pageGroupIds("asia-pacific", "pacific-nz") byte-for-byte (§9 item 5: nz-short-rate · nz-10y)', () => {
    expect(ASIA_PACIFIC_NZ_IDS).toEqual(pageGroupIds('asia-pacific', 'pacific-nz'));
    expect(ASIA_PACIFIC_NZ_IDS).toEqual(['nz-short-rate', 'nz-10y']);
    expect(ASIA_PACIFIC_NZ_IDS).toHaveLength(2);
  });

  it('the full card list is section order (7 + 2 + 2 = 11 — the two index-only groups contribute NO registry cards), no duplicates, and equals the page’s own homes', () => {
    expect(ASIA_CARD_IDS).toEqual([...ASIA_CHINA_IDS, ...ASIA_JAPAN_IDS, ...ASIA_PACIFIC_NZ_IDS]);
    expect(ASIA_CARD_IDS).toHaveLength(11);
    expect(new Set(ASIA_CARD_IDS).size).toBe(11);
    // The placement table's own count: the asia-pacific page carries 11
    // registry cards (the §15 FRED-only CPI fills land in a later session
    // after live verification — Rule 5).
    expect(pageHomeIds('asia-pacific')).toHaveLength(11);
  });
});

describe('the display configs — the DISPLAY registry’s own values for the 11 ids', () => {
  it('every one of the 11 ids matches decimals + unit (+ scale)', () => {
    for (const id of ASIA_CARD_IDS as readonly AsiaCardId[]) {
      const registry = DISPLAY[id as IndicatorId];
      expect(registry, `${id} exists in the DISPLAY registry`).toBeDefined();
      const lean = ASIA_CARD_DISPLAY[id];
      expect(lean.decimals, `${id} decimals`).toBe(registry.decimals);
      expect(lean.unit, `${id} unit`).toBe(registry.unit);
      // The scale: china-steel-output is the ONE Asia id with a display
      // scale (1e-2 — the NBS 10,000-ton unit → millions of tonnes).
      expect(lean.scale, `${id} scale`).toBe(registry.scale);
    }
  });

  it('the 11 ids span the percent / index / tonnes families (points kept for parity, no Asia id uses it today)', () => {
    const units = new Set(ASIA_CARD_IDS.map((id) => ASIA_CARD_DISPLAY[id as AsiaCardId].unit));
    expect(units).toEqual(new Set(['percent', 'index', 'tonnes']));
  });

  it('china-steel-output is the ONE scaled id (tonnes, scale 1e-2 — the NBS 10,000-ton unit → millions of tonnes)', () => {
    expect(ASIA_CARD_DISPLAY['china-steel-output']).toEqual({ decimals: 1, unit: 'tonnes', scale: 1e-2 });
  });
});

describe('the value render — EQUIVALENT to formatReadingValue, output-for-output', () => {
  it('every id × both locales (byte-identical joins)', () => {
    for (const id of ASIA_CARD_IDS as readonly AsiaCardId[]) {
      const reading = fixtureReading(id);
      const enRegistry = formatReadingValue(reading, 'en-US', EN_UNITS);
      const enLean = asiaCardValueText(id, reading, 'en-US', enAsiaUnits);
      expect(enLean, `${id} en`).toBe(enRegistry);
      const faRegistry = formatReadingValue(reading, 'fa-IR', FA_UNITS);
      const faLean = asiaCardValueText(id, reading, 'fa-IR', faAsiaUnits);
      expect(faLean, `${id} fa`).toBe(faRegistry);
    }
  });

  it('the family conventions hold (the fixture’s own renders)', () => {
    // percent binds tight; index and tonnes suffix with a space.
    expect(asiaCardValueText('china-cpi', fixtureReading('china-cpi'), 'en-US', enAsiaUnits)).toBe('0.4%');
    expect(asiaCardValueText('china-pmi', fixtureReading('china-pmi'), 'en-US', enAsiaUnits)).toBe('49.5 index');
    expect(asiaCardValueText('gpr-china', fixtureReading('gpr-china'), 'en-US', enAsiaUnits)).toBe('109.87 index');
    // china-steel-output: the raw 7359 × scale 1e-2 → 73.6 m tonnes.
    expect(asiaCardValueText('china-steel-output', fixtureReading('china-steel-output'), 'en-US', enAsiaUnits)).toBe('73.6 m tonnes');
    expect(asiaCardValueText('jgb-10y', fixtureReading('jgb-10y'), 'en-US', enAsiaUnits)).toBe('1.07%');
    // The fa percent binds tight (Persian digits).
    expect(asiaCardValueText('china-cpi', fixtureReading('china-cpi'), 'fa-IR', faAsiaUnits)).toBe('۰٫۴٪');
    // The fa tonnes suffix with a space (the suffix-with-space join).
    expect(asiaCardValueText('china-steel-output', fixtureReading('china-steel-output'), 'fa-IR', faAsiaUnits)).toBe('۷۳٫۶ میلیون تن');
  });

  it('absent readings and null values stay null (the honest unavailable word, never a guess)', () => {
    expect(asiaCardValueText('china-pmi', undefined, 'en-US', enAsiaUnits)).toBeNull();
    const unavailable = { id: 'china-pmi', value: null, asOf: null, status: 'unavailable' } as IndicatorReading;
    expect(asiaCardValueText('china-pmi', unavailable, 'en-US', enAsiaUnits)).toBeNull();
  });
});

describe('the card entries — placement order, absent stays absent', () => {
  it('asiaCards: the 11 entries in section order; missing readings stay undefined', () => {
    const pmi = fixtureReading('china-pmi');
    const jgb = fixtureReading('jgb-10y');
    const entries = asiaCards([pmi, jgb], ASIA_CARD_IDS);
    expect(entries.map((e) => e.id)).toEqual([...ASIA_CHINA_IDS, ...ASIA_JAPAN_IDS, ...ASIA_PACIFIC_NZ_IDS]);
    expect(entries.find((e) => e.id === 'china-pmi')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'jgb-10y')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'china-cpi')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'nz-10y')!.reading).toBeUndefined();
  });
});
