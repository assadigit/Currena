/**
 * australia-tiles tests (S16, 2026-11-10) — the pure-derivation pins.
 *
 * What is pinned here (the S9 usa-tiles.test.ts / S12 europe-tiles.test.ts /
 * S14 asia-tiles.test.ts pattern, scoped to Australia's 28 placed ids):
 *
 *   - the six group lists ↔ the placement table's own groups
 *     (pageGroupIds), byte-for-byte, and the full card list is section
 *     order (6 + 11 + 2 + 1 + 7 + 1 = 28), no duplicates, and equals the
 *     page's own homes;
 *   - the 28 display configs (decimals + unit + scale) ↔ the DISPLAY
 *     registry (config/display.ts), byte-for-byte;
 *   - the value render (australiaCardValueText) ↔ `formatReadingValue`,
 *     output-for-output, over every id × both locales (the strongest pin:
 *     the lean restatement can never drift from the legacy renderer —
 *     including the AU money joins, the billion/million rows binding
 *     "A$97.6bn" / "A$495m" tight in EN and keeping the fa suffix word);
 *   - the moved-out seat chips: the registry's own AU display-group
 *     membership minus the placement's home ids = the spec §10 "Moved
 *     out" 11 (8 in au-trade-currency + 3 in au-external), each chip's
 *     href derived from homePageOfIndicator (the S5 seat-chip discipline);
 *   - the gauge verdicts: the SAME pure gaugeReading + labelForVerdictStep
 *     + isShadowGauge the legacy AU section reads (the globalGaugeTiles
 *     pattern over the AU gauges), with the G-5 shadow discipline;
 *   - the card entries — placement order, absent stays absent.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { gaugeReading, isShadowGauge, GAUGES } from '@currena/insights';
import { pageGroupIds, pageHomeIds, homePageOfIndicator, PAGE_PLACEMENTS_BY_PAGE } from '@currena/insights/page-division';
import { DISPLAY, formatReadingValue, type UnitLabels } from '../../components/insights/config/display';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import {
  AUSTRALIA_CARD_DISPLAY,
  AUSTRALIA_CARD_IDS,
  AUSTRALIA_GAUGE_IDS,
  AUSTRALIA_INFLATION_RATES_IDS,
  AUSTRALIA_HOUSEHOLDS_IDS,
  AUSTRALIA_TRADE_CURRENCY_IDS,
  AUSTRALIA_EXTERNAL_IDS,
  AUSTRALIA_ACTIVITY_IDS,
  AUSTRALIA_WORLD_RISK_IDS,
  AUSTRALIA_SEAT_IDS,
  AUSTRALIA_MOVED_OUT_IDS,
  australiaCardValueText,
  australiaCards,
  australiaGaugeVerdicts,
  australiaSeatHref,
  type AustraliaCardId,
  type AustraliaUnitLabels,
} from './australia-tiles';

/** The corpus units, typed as the display registry's own labels shape. */
const EN_UNITS = insightsCopyEn.units as unknown as UnitLabels;
const FA_UNITS = insightsCopyFa.units as unknown as UnitLabels;
const enAuUnits: AustraliaUnitLabels = {
  percent: insightsCopyEn.units.percent,
  points: insightsCopyEn.units.points,
  index: insightsCopyEn.units.index,
  aud: insightsCopyEn.units.aud,
  'aud-bn': insightsCopyEn.units['aud-bn'],
  'aud-m': insightsCopyEn.units['aud-m'],
  vacancies: insightsCopyEn.units.vacancies,
  dwellings: insightsCopyEn.units.dwellings,
  'persons-k': insightsCopyEn.units['persons-k'],
};
const faAuUnits: AustraliaUnitLabels = {
  percent: insightsCopyFa.units.percent,
  points: insightsCopyFa.units.points,
  index: insightsCopyFa.units.index,
  aud: insightsCopyFa.units.aud,
  'aud-bn': insightsCopyFa.units['aud-bn'],
  'aud-m': insightsCopyFa.units['aud-m'],
  vacancies: insightsCopyFa.units.vacancies,
  dwellings: insightsCopyFa.units.dwellings,
  'persons-k': insightsCopyFa.units['persons-k'],
};

/** A representative value per id (real-world magnitudes — the equivalence
 *  pin runs the SAME reading through both renderers). au-housing-finance's
 *  raw value (97,613) is in $ millions; the display scale 0.001 →
 *  "A$97.6bn". au-trade-balance's raw 495 → "A$495m". */
const FIXTURE_VALUE: Readonly<Record<AustraliaCardId, number>> = {
  'au-cpi': 2.8,
  'au-trimmed-mean': 2.9,
  'rba-expectations': 0.13,
  'au-10y': 4.35,
  'au-us-10y-gap': -0.22,
  'au-petrol-yoy': -3.4,
  'au-home-loan': 6.32,
  'au-wage-growth': 3.9,
  'au-rent-yoy': 2.4,
  'au-household-debt-arrears': 184.7,
  'au-unemployment': 4.3,
  'au-home-values': 137.2,
  'au-housing-finance': 97613,
  'rba-cash-rate': 3.85,
  'au-deposit-rate': 4.55,
  'au-saving-ratio': 3.2,
  'au-job-vacancies': 325,
  'terms-of-trade': 114.6,
  'rba-fed-gap': 1.05,
  'au-trade-balance': 495,
  'au-gdp-growth': 1.8,
  'au-household-spending': 2.1,
  'au-building-approvals': 18264,
  'au-population-growth': 1.8,
  'au-nom': 101,
  'au-participation': 66.6,
  'au-underemployment': 6.0,
  'gpr-australia': 91.24,
};

/** One fixture reading for an id. */
function fixtureReading(id: AustraliaCardId): IndicatorReading {
  return {
    id,
    value: FIXTURE_VALUE[id],
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: 'normal',
  } as IndicatorReading;
}

describe('the section lists — the placement table’s own groups (D-37)', () => {
  it('the Inflation & rates section is pageGroupIds("australia", "au-inflation-rates") byte-for-byte (§10 item 2: the six cards)', () => {
    expect(AUSTRALIA_INFLATION_RATES_IDS).toEqual(pageGroupIds('australia', 'au-inflation-rates'));
    expect(AUSTRALIA_INFLATION_RATES_IDS).toEqual(['au-cpi', 'au-trimmed-mean', 'rba-expectations', 'au-10y', 'au-us-10y-gap', 'au-petrol-yoy']);
    expect(AUSTRALIA_INFLATION_RATES_IDS).toHaveLength(6);
  });

  it('the Households section is pageGroupIds("australia", "au-households") byte-for-byte (§10 item 2: the eleven cards)', () => {
    expect(AUSTRALIA_HOUSEHOLDS_IDS).toEqual(pageGroupIds('australia', 'au-households'));
    expect(AUSTRALIA_HOUSEHOLDS_IDS).toHaveLength(11);
  });

  it('the Trade & currency section is pageGroupIds("australia", "au-trade-currency") byte-for-byte (§10 item 2: terms-of-trade · rba-fed-gap — the moved-out ids are seat chips, never cards)', () => {
    expect(AUSTRALIA_TRADE_CURRENCY_IDS).toEqual(pageGroupIds('australia', 'au-trade-currency'));
    expect(AUSTRALIA_TRADE_CURRENCY_IDS).toEqual(['rba-fed-gap', 'terms-of-trade']);
    expect(AUSTRALIA_TRADE_CURRENCY_IDS).toHaveLength(2);
  });

  it('the Trade & partners section is pageGroupIds("australia", "au-external") byte-for-byte (§10 item 2, SHADOW: au-trade-balance)', () => {
    expect(AUSTRALIA_EXTERNAL_IDS).toEqual(pageGroupIds('australia', 'au-external'));
    expect(AUSTRALIA_EXTERNAL_IDS).toEqual(['au-trade-balance']);
  });

  it('the Activity section is pageGroupIds("australia", "au-activity") byte-for-byte (§10 item 2, SHADOW: the seven cards)', () => {
    expect(AUSTRALIA_ACTIVITY_IDS).toEqual(pageGroupIds('australia', 'au-activity'));
    expect(AUSTRALIA_ACTIVITY_IDS).toHaveLength(7);
  });

  it('the World risk group is pageGroupIds("australia", "au-world-risk") byte-for-byte (§10 item 2’s "plus gpr-australia"; AF-4)', () => {
    expect(AUSTRALIA_WORLD_RISK_IDS).toEqual(pageGroupIds('australia', 'au-world-risk'));
    expect(AUSTRALIA_WORLD_RISK_IDS).toEqual(['gpr-australia']);
  });

  it('the full card list is section order (6 + 11 + 2 + 1 + 7 + 1 = 28), no duplicates, and equals the page’s own homes', () => {
    expect(AUSTRALIA_CARD_IDS).toEqual([
      ...AUSTRALIA_INFLATION_RATES_IDS,
      ...AUSTRALIA_HOUSEHOLDS_IDS,
      ...AUSTRALIA_TRADE_CURRENCY_IDS,
      ...AUSTRALIA_EXTERNAL_IDS,
      ...AUSTRALIA_ACTIVITY_IDS,
      ...AUSTRALIA_WORLD_RISK_IDS,
    ]);
    expect(AUSTRALIA_CARD_IDS).toHaveLength(28);
    expect(new Set(AUSTRALIA_CARD_IDS).size).toBe(28);
    // The placement table's own count: the australia page carries 28
    // registry cards (the §10 spec list, reconciled by the generator).
    expect(pageHomeIds('australia')).toHaveLength(28);
    expect(pageHomeIds('australia')).toEqual(AUSTRALIA_CARD_IDS as readonly IndicatorId[]);
  });
});

describe('the display configs — the DISPLAY registry’s own values for the 28 ids', () => {
  it('every one of the 28 ids matches decimals + unit (+ scale)', () => {
    for (const id of AUSTRALIA_CARD_IDS as readonly AustraliaCardId[]) {
      const registry = DISPLAY[id as IndicatorId];
      expect(registry, `${id} exists in the DISPLAY registry`).toBeDefined();
      const lean = AUSTRALIA_CARD_DISPLAY[id];
      expect(lean.decimals, `${id} decimals`).toBe(registry.decimals);
      expect(lean.unit, `${id} unit`).toBe(registry.unit);
      expect(lean.scale, `${id} scale`).toBe(registry.scale);
    }
  });

  it('the 28 ids span the EIGHT unit families (percent · points · index · aud-bn · aud-m · vacancies · dwellings · persons-k)', () => {
    const units = new Set(AUSTRALIA_CARD_IDS.map((id) => AUSTRALIA_CARD_DISPLAY[id as AustraliaCardId].unit));
    expect(units).toEqual(new Set(['percent', 'points', 'index', 'aud-bn', 'aud-m', 'vacancies', 'dwellings', 'persons-k']));
  });

  it('the AU money pair: au-housing-finance is the ONE scaled id (aud-bn, scale 0.001 — the raw $m series → billions of dollars)', () => {
    expect(AUSTRALIA_CARD_DISPLAY['au-housing-finance']).toEqual({ decimals: 1, unit: 'aud-bn', scale: 0.001 });
    expect(AUSTRALIA_CARD_DISPLAY['au-trade-balance']).toEqual({ decimals: 0, unit: 'aud-m' });
  });
});

describe('the value render — EQUIVALENT to formatReadingValue, output-for-output', () => {
  it('every id × both locales (byte-identical joins)', () => {
    for (const id of AUSTRALIA_CARD_IDS as readonly AustraliaCardId[]) {
      const reading = fixtureReading(id);
      const enRegistry = formatReadingValue(reading, 'en-US', EN_UNITS);
      const enLean = australiaCardValueText(id, reading, 'en-US', enAuUnits);
      expect(enLean, `${id} en`).toBe(enRegistry);
      const faRegistry = formatReadingValue(reading, 'fa-IR', FA_UNITS);
      const faLean = australiaCardValueText(id, reading, 'fa-IR', faAuUnits);
      expect(faLean, `${id} fa`).toBe(faRegistry);
    }
  });

  it('the family conventions hold (the fixture’s own renders)', () => {
    // percent binds tight; points and index suffix with a space.
    expect(australiaCardValueText('au-cpi', fixtureReading('au-cpi'), 'en-US', enAuUnits)).toBe('2.8%');
    expect(australiaCardValueText('rba-expectations', fixtureReading('rba-expectations'), 'en-US', enAuUnits)).toBe('0.13 pts');
    expect(australiaCardValueText('gpr-australia', fixtureReading('gpr-australia'), 'en-US', enAuUnits)).toBe('91.24 index');
    // The AU money joins: EN prefixes the currency and binds the magnitude
    // word tight (the raw $m 97,613 × scale 0.001 → "A$97.6bn"; 495 →
    // "A$495m"); fa keeps its suffix word.
    expect(australiaCardValueText('au-housing-finance', fixtureReading('au-housing-finance'), 'en-US', enAuUnits)).toBe('A$97.6bn');
    expect(australiaCardValueText('au-trade-balance', fixtureReading('au-trade-balance'), 'en-US', enAuUnits)).toBe('A$495m');
    expect(australiaCardValueText('au-housing-finance', fixtureReading('au-housing-finance'), 'fa-IR', faAuUnits)).toBe('۹۷٫۶ میلیارد دلار استرالیا');
    expect(australiaCardValueText('au-trade-balance', fixtureReading('au-trade-balance'), 'fa-IR', faAuUnits)).toBe('۴۹۵ میلیون دلار استرالیا');
    // The counted trio suffixes with a space (the registry's own default
    // join — the unit word itself carries the 'k' scale).
    expect(australiaCardValueText('au-job-vacancies', fixtureReading('au-job-vacancies'), 'en-US', enAuUnits)).toBe('325 k vacancies');
    expect(australiaCardValueText('au-building-approvals', fixtureReading('au-building-approvals'), 'en-US', enAuUnits)).toBe('18,264 dwellings approved');
    expect(australiaCardValueText('au-nom', fixtureReading('au-nom'), 'en-US', enAuUnits)).toBe('101 k people');
    // The fa percent binds tight (Persian digits).
    expect(australiaCardValueText('au-cpi', fixtureReading('au-cpi'), 'fa-IR', faAuUnits)).toBe('۲٫۸٪');
    // The fa counted join (Persian digits + the suffix word).
    expect(australiaCardValueText('au-nom', fixtureReading('au-nom'), 'fa-IR', faAuUnits)).toBe('۱۰۱ هزار نفر');
  });

  it('absent readings and null values stay null (the honest unavailable word, never a guess)', () => {
    expect(australiaCardValueText('au-cpi', undefined, 'en-US', enAuUnits)).toBeNull();
    const unavailable = { id: 'au-cpi', value: null, asOf: null, status: 'unavailable' } as IndicatorReading;
    expect(australiaCardValueText('au-cpi', unavailable, 'en-US', enAuUnits)).toBeNull();
  });
});

describe('the moved-out seat chips — the registry’s display groups minus the placement’s own homes (§10 "Moved out")', () => {
  it('au-trade-currency lost 8 members (the spec §10 "Moved out" list: audusd · audjpy · gold-aud · iron-ore · coal-aus · lng-japan · china-property-investment · china-steel-output)', () => {
    expect([...AUSTRALIA_SEAT_IDS['au-trade-currency']].sort()).toEqual(
      ['audusd', 'audjpy', 'gold-aud', 'iron-ore', 'coal-aus', 'lng-japan', 'china-property-investment', 'china-steel-output'].sort(),
    );
    expect(AUSTRALIA_SEAT_IDS['au-trade-currency']).toHaveLength(8);
  });

  it('au-external lost 3 members (audnzd · nz-short-rate · nz-10y — D-17/D-35/D-42)', () => {
    expect([...AUSTRALIA_SEAT_IDS['au-external']].sort()).toEqual(['audnzd', 'nz-short-rate', 'nz-10y'].sort());
    expect(AUSTRALIA_SEAT_IDS['au-external']).toHaveLength(3);
  });

  it('the other three gauges kept all their members (no seat chips)', () => {
    expect(AUSTRALIA_SEAT_IDS['au-inflation-rates']).toEqual([]);
    expect(AUSTRALIA_SEAT_IDS['au-households']).toEqual([]);
    expect(AUSTRALIA_SEAT_IDS['au-activity']).toEqual([]);
  });

  it('the full moved-out list is the spec §10’s 11, no duplicates, and disjoint from the 28 cards', () => {
    expect(AUSTRALIA_MOVED_OUT_IDS).toHaveLength(11);
    expect(new Set(AUSTRALIA_MOVED_OUT_IDS).size).toBe(11);
    const cards = new Set<string>(AUSTRALIA_CARD_IDS as readonly string[]);
    for (const id of AUSTRALIA_MOVED_OUT_IDS) {
      expect(cards.has(id as string), `${id} is not also a card`).toBe(false);
    }
  });

  it('every seat chip links to its placement home (australiaSeatHref ↔ homePageOfIndicator, the S5 seat-chip discipline)', () => {
    expect(australiaSeatHref('audusd')).toBe('/currencies');
    expect(australiaSeatHref('audjpy')).toBe('/currencies');
    expect(australiaSeatHref('audnzd')).toBe('/currencies');
    expect(australiaSeatHref('nz-short-rate')).toBe('/asia-pacific');
    expect(australiaSeatHref('nz-10y')).toBe('/asia-pacific');
    expect(australiaSeatHref('china-property-investment')).toBe('/asia-pacific');
    expect(australiaSeatHref('china-steel-output')).toBe('/asia-pacific');
    expect(australiaSeatHref('iron-ore')).toBe('/commodities');
    expect(australiaSeatHref('coal-aus')).toBe('/commodities');
    expect(australiaSeatHref('lng-japan')).toBe('/commodities');
    expect(australiaSeatHref('gold-aud')).toBe('/gold');
    for (const id of AUSTRALIA_MOVED_OUT_IDS) {
      const home = homePageOfIndicator(id);
      expect(home, `${id} has a placement home`).not.toBeNull();
    }
  });

  it('the 5 that still vote in the AU gauges ride the projection as the placement’s own mirrors (the engine-derived set)', () => {
    const placement = PAGE_PLACEMENTS_BY_PAGE.get('australia')!;
    const mirrors = new Set<string>(placement.mirrors as readonly string[]);
    // The engine’s AU gauge members minus the 28 homes = the mirrors.
    const engineMembers = new Set(GAUGES.filter((g) => g.section === 'australia').flatMap((g) => [...g.members]) as readonly string[]);
    const cards = new Set<string>(AUSTRALIA_CARD_IDS as readonly string[]);
    const engineMovedOut = [...engineMembers].filter((id) => !cards.has(id));
    expect(engineMovedOut.sort()).toEqual([...mirrors].sort());
    expect(engineMovedOut.sort()).toEqual(['audnzd', 'audjpy', 'audusd', 'nz-10y', 'nz-short-rate'].sort());
  });
});

describe('the gauge verdicts — the SAME pure engine functions the legacy AU section reads', () => {
  it('the five AU gauges in GAUGES order, the shadow discipline intact (G-5: au-activity + au-external are the shadows)', () => {
    expect(AUSTRALIA_GAUGE_IDS).toEqual(['au-inflation-rates', 'au-households', 'au-trade-currency', 'au-activity', 'au-external']);
    expect(AUSTRALIA_GAUGE_IDS).toHaveLength(5);
    const empty: IndicatorReading[] = [];
    const verdicts = australiaGaugeVerdicts(empty);
    expect(verdicts.map((v) => v.gauge)).toEqual([
      'au-inflation-rates',
      'au-households',
      'au-trade-currency',
      'au-activity',
      'au-external',
    ]);
    for (const v of verdicts) {
      const gauge = GAUGES.find((g) => g.id === v.gauge)!;
      expect(v.shadow, `${v.gauge} shadow flag ↔ isShadowGauge`).toBe(isShadowGauge(gauge));
      expect(v.reading, `${v.gauge} reading ↔ gaugeReading`).toEqual(gaugeReading(gauge, empty));
    }
    expect(verdicts.find((v) => v.gauge === 'au-activity')!.shadow).toBe(true);
    expect(verdicts.find((v) => v.gauge === 'au-external')!.shadow).toBe(true);
    expect(verdicts.find((v) => v.gauge === 'au-trade-currency')!.shadow).toBe(false);
  });

  it('a voting gauge over a mixed projection reads the engine’s own step + word (the mirrored voters included)', () => {
    // The projection carries every AU gauge member: 21 home voters + the
    // 5 mirrors. au-trade-currency votes on audusd · rba-fed-gap · audjpy
    // · terms-of-trade — all four arrive.
    const readings: IndicatorReading[] = [
      ...pageHomeIds('australia'),
      ...PAGE_PLACEMENTS_BY_PAGE.get('australia')!.mirrors,
    ].map(
      (id) =>
        ({
          id,
          value: 1,
          asOf: '2026-11-07',
          percentile10y: 0.5,
          status: 'normal',
        }) as IndicatorReading,
    );
    const verdicts = australiaGaugeVerdicts(readings);
    const trade = verdicts.find((v) => v.gauge === 'au-trade-currency')!;
    const gauge = GAUGES.find((g) => g.id === 'au-trade-currency')!;
    expect(trade.reading).toEqual(gaugeReading(gauge, readings));
    expect(trade.reading.votingCount).toBe(4); // audusd + rba-fed-gap + audjpy + terms-of-trade — the mirrors included
    expect(trade.word).toBe('relaxed'); // 0 warnings of 4 voting → step 1
  });
});

describe('the card entries — placement order, absent stays absent', () => {
  it('australiaCards: the 28 entries in section order; missing readings stay undefined', () => {
    const cpi = fixtureReading('au-cpi');
    const tot = fixtureReading('terms-of-trade');
    const entries = australiaCards([cpi, tot], AUSTRALIA_CARD_IDS);
    expect(entries.map((e) => e.id)).toEqual([
      ...AUSTRALIA_INFLATION_RATES_IDS,
      ...AUSTRALIA_HOUSEHOLDS_IDS,
      ...AUSTRALIA_TRADE_CURRENCY_IDS,
      ...AUSTRALIA_EXTERNAL_IDS,
      ...AUSTRALIA_ACTIVITY_IDS,
      ...AUSTRALIA_WORLD_RISK_IDS,
    ] as AustraliaCardId[]);
    expect(entries.find((e) => e.id === 'au-cpi')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'terms-of-trade')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'au-10y')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'gpr-australia')!.reading).toBeUndefined();
  });
});
