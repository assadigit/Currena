/**
 * usa-tiles tests (S9, 2026-11-09) — the pure-derivation pins.
 *
 * What is pinned here:
 *
 *   - the tier lists are the placement table's own groups, byte-for-byte
 *     (pageGroupIds — never a hand-copied list; the AF-2 tier-2 count
 *     story is pinned at 19, the placement's authority);
 *   - the lean display mirror matches the DISPLAY registry's own
 *     decimals + units + scales + ranges for all 26 ids;
 *   - the value render is EQUIVALENT to the DISPLAY registry's own
 *     `formatReadingValue`, output-for-output, over every id × both
 *     locales × both fed-target range shapes (the strongest pin: the
 *     restated join can never drift from the legacy renderer);
 *   - the card entries ride the projection in placement order, absent
 *     readings stay absent (fail-closed, never a guess);
 *   - the D-30 verdict strip's derivation IS global-tiles' own
 *     (one arithmetic, both pages — D-48) and behaves the engine's way
 *     over a synthetic voter set.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading } from '@currena/core';
import { GAUGES, gaugeReading, labelForVerdictStep } from '@currena/insights';
import { THEMATIC_GAUGE_IDS, THEMATIC_GAUGE_MEMBER_IDS, pageGroupIds, PAGE_PLACEMENTS_BY_PAGE } from '@currena/insights/page-division';
import { DISPLAY, formatReadingValue, type UnitLabels } from '../../components/insights/config/display';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { globalGaugeTiles } from './global-tiles';
import {
  USA_CARD_DISPLAY,
  USA_CARD_IDS,
  USA_TIER1_IDS,
  USA_TIER2_IDS,
  usaCards,
  usaCardValueText,
  usaGaugeVerdicts,
  type UsaCardId,
  type UsaUnitLabels,
} from './usa-tiles';

/** The corpus units, typed as the display registry's own labels shape. */
const EN_UNITS = insightsCopyEn.units as unknown as UnitLabels;
const FA_UNITS = insightsCopyFa.units as unknown as UnitLabels;
const enUsaUnits: UsaUnitLabels = {
  percent: insightsCopyEn.units.percent,
  points: insightsCopyEn.units.points,
  ratio: insightsCopyEn.units.ratio,
  usd: insightsCopyEn.units.usd,
  'usd-tr': insightsCopyEn.units['usd-tr'],
  'usd-bn': insightsCopyEn.units['usd-bn'],
};
const faUsaUnits: UsaUnitLabels = {
  percent: insightsCopyFa.units.percent,
  points: insightsCopyFa.units.points,
  ratio: insightsCopyFa.units.ratio,
  usd: insightsCopyFa.units.usd,
  'usd-tr': insightsCopyFa.units['usd-tr'],
  'usd-bn': insightsCopyFa.units['usd-bn'],
};

/** A representative value per id family (real-world magnitudes — the
 *  equivalence pin runs the SAME reading through both renderers). */
const FIXTURE_VALUE: Readonly<Record<UsaCardId, number>> = {
  'fed-target': 3.875,
  'fed-expectations': 0.48,
  'us-cpi-yoy': 3.7,
  'us-pce-core-yoy': 2.9,
  'us-nfp': 165,
  'us-unemployment': 4.1,
  us10y: 4.24,
  'yield-curve-10y2y': 0.19,
  'yield-curve-10y3m': -0.32,
  'real-yield-10y': 1.86,
  'real-yield-5y': 1.71,
  'real-curve-10y5y': 0.15,
  us30y: 4.51,
  'us-2y': 4.05,
  sofr: 4.3,
  'mortgage-30y': 6.85,
  'nyfed-custody': 3_450_000,
  'us-deficit-monthly': 84_921,
  'us-deficit-12m': 1_840_000,
  'treasury-auction-10y': 2.63,
  'treasury-auction-10y-indirect': 71.4,
  'treasury-auction-30y': 2.41,
  'treasury-auction-30y-indirect': 68.9,
  'rstar-us': 1.19,
  'debt-to-gdp': 121.3,
  'govt-interest-revenue': 18.7,
};

/** One fixture reading for an id (fed-target gains true bounds in the
 *  `withBounds` variant — the A1 preferred shape). */
function fixtureReading(id: UsaCardId, withBounds: boolean): IndicatorReading {
  const base: IndicatorReading = {
    id,
    value: FIXTURE_VALUE[id],
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: id === 'us-nfp' ? 'context' : 'normal',
  } as IndicatorReading;
  if (id === 'fed-target' && withBounds) {
    base.rangeLow = 3.75;
    base.rangeHigh = 4;
  }
  return base;
}

describe('the tier lists — the placement table’s own groups', () => {
  it('tier 1 is pageGroupIds("usa", "tier-1-world-watches") byte-for-byte (D-29: the seven the planet reacts to)', () => {
    expect(USA_TIER1_IDS).toEqual(pageGroupIds('usa', 'tier-1-world-watches'));
    expect(USA_TIER1_IDS).toEqual(['fed-target', 'fed-expectations', 'us-cpi-yoy', 'us-pce-core-yoy', 'us-nfp', 'us-unemployment', 'us10y']);
    expect(USA_TIER1_IDS).toHaveLength(7);
  });

  it('tier 2 is pageGroupIds("usa", "tier-2-rates-fed") byte-for-byte (the placement’s 19 — AF-2’s "(22)" label is the recorded drift)', () => {
    expect(USA_TIER2_IDS).toEqual(pageGroupIds('usa', 'tier-2-rates-fed'));
    expect(USA_TIER2_IDS).toHaveLength(19);
    expect(USA_TIER2_IDS).toContain('govt-interest-revenue');
    // The placement group's own note carries the AF-2 story.
    const group = PAGE_PLACEMENTS_BY_PAGE.get('usa')?.groups.find((g) => g.id === 'tier-2-rates-fed');
    expect(group?.note).toContain('AF-2');
  });

  it('the full card list is tier order (7 then 19 = 26), no duplicates', () => {
    expect(USA_CARD_IDS).toEqual([...USA_TIER1_IDS, ...USA_TIER2_IDS]);
    expect(USA_CARD_IDS).toHaveLength(26);
    expect(new Set(USA_CARD_IDS).size).toBe(26);
  });
});

describe('the lean display mirror — the DISPLAY registry’s own configs', () => {
  it('every one of the 26 ids matches decimals + unit + scale + range', () => {
    for (const id of USA_CARD_IDS) {
      const registry = DISPLAY[id as keyof typeof DISPLAY];
      const lean = USA_CARD_DISPLAY[id as UsaCardId];
      expect(lean.decimals, `${id} decimals`).toBe(registry.decimals);
      expect(lean.unit, `${id} unit`).toBe(registry.unit);
      expect(lean.scale ?? 1, `${id} scale`).toBe(registry.scale ?? 1);
      expect(lean.range ?? false, `${id} range`).toBe(registry.range ?? false);
    }
  });

  it('the scaled trio renders in its displayed magnitude (nyfed-custody + the two deficits)', () => {
    expect(USA_CARD_DISPLAY['nyfed-custody'].scale).toBe(1e-6);
    expect(USA_CARD_DISPLAY['us-deficit-12m'].scale).toBe(1e-6);
    expect(USA_CARD_DISPLAY['us-deficit-monthly'].scale).toBe(1e-3);
  });
});

describe('the value render — EQUIVALENT to formatReadingValue, output-for-output', () => {
  it('every id × both locales × both fed-target range shapes (byte-identical joins)', () => {
    for (const id of USA_CARD_IDS as readonly UsaCardId[]) {
      for (const withBounds of id === 'fed-target' ? [true, false] : [false]) {
        const reading = fixtureReading(id, withBounds);
        const enRegistry = formatReadingValue(reading, 'en-US', EN_UNITS);
        const enLean = usaCardValueText(id, reading, 'en-US', enUsaUnits);
        expect(enLean, `${id} bounds=${withBounds} en`).toBe(enRegistry);
        const faRegistry = formatReadingValue(reading, 'fa-IR', FA_UNITS);
        const faLean = usaCardValueText(id, reading, 'fa-IR', faUsaUnits);
        expect(faLean, `${id} bounds=${withBounds} fa`).toBe(faRegistry);
      }
    }
  });

  it('the family conventions hold (the fixture’s own renders)', () => {
    // percent binds tight; fed-target renders the true corridor; the
    // trillion family prefixes US$ in EN and suffixes in fa; points and
    // ratio take the word; nfp renders whole.
    expect(usaCardValueText('us10y', fixtureReading('us10y', false), 'en-US', enUsaUnits)).toBe('4.24%');
    expect(usaCardValueText('fed-target', fixtureReading('fed-target', true), 'en-US', enUsaUnits)).toBe('3.75–4.00%');
    expect(usaCardValueText('fed-target', fixtureReading('fed-target', false), 'en-US', enUsaUnits)).toBe('3.75–3.88%');
    expect(usaCardValueText('nyfed-custody', fixtureReading('nyfed-custody', false), 'en-US', enUsaUnits)).toBe('US$3.45 trillion');
    expect(usaCardValueText('nyfed-custody', fixtureReading('nyfed-custody', false), 'fa-IR', faUsaUnits)).toBe('۳٫۴۵ تریلیون دلار');
    expect(usaCardValueText('us-deficit-monthly', fixtureReading('us-deficit-monthly', false), 'en-US', enUsaUnits)).toBe('US$84.9bn');
    expect(usaCardValueText('us-nfp', fixtureReading('us-nfp', false), 'en-US', enUsaUnits)).toBe('165 pts');
    expect(usaCardValueText('treasury-auction-10y', fixtureReading('treasury-auction-10y', false), 'en-US', enUsaUnits)).toBe('2.63 ratio');
  });

  it('absent readings and null values stay null (the honest unavailable word, never a guess)', () => {
    expect(usaCardValueText('us10y', undefined, 'en-US', enUsaUnits)).toBeNull();
    const unavailable = { id: 'us10y', value: null, asOf: null, status: 'unavailable' } as IndicatorReading;
    expect(usaCardValueText('us10y', unavailable, 'en-US', enUsaUnits)).toBeNull();
  });
});

describe('the card entries — placement order, absent stays absent', () => {
  it('usaCards: the 26 entries in tier order; missing readings stay undefined', () => {
    const present = fixtureReading('fed-target', true);
    const cpi = fixtureReading('us-cpi-yoy', false);
    const entries = usaCards([present, cpi], USA_CARD_IDS);
    expect(entries.map((e) => e.id)).toEqual([...USA_TIER1_IDS, ...USA_TIER2_IDS]);
    expect(entries.find((e) => e.id === 'fed-target')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'us-cpi-yoy')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'us10y')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'govt-interest-revenue')!.reading).toBeUndefined();
  });
});

describe('the D-30 verdict strip — ONE derivation with Global (D-48)', () => {
  it('usaGaugeVerdicts IS globalGaugeTiles (the same function object)', () => {
    expect(usaGaugeVerdicts).toBe(globalGaugeTiles);
  });

  it('the strip behaves the engine’s way over a synthetic voter set', () => {
    // All five gauges' members: mostly normal, one warning per a couple of
    // gauges, one stale (dilutes, never votes), usdjpy absent entirely.
    const readings: IndicatorReading[] = THEMATIC_GAUGE_MEMBER_IDS.map((id) => {
      if (id === 'usdjpy') return { id, value: null, asOf: null, status: 'unavailable' } as IndicatorReading;
      const status: IndicatorReading['status'] =
        id === 'yield-curve-10y2y' || id === 'us-cpi-yoy'
          ? 'warning'
          : id === 'vix'
            ? 'stale'
            : 'normal';
      return { id, value: 1, asOf: '2026-11-07', status } as IndicatorReading;
    });
    const strip = usaGaugeVerdicts(readings);
    expect(strip.map((t) => t.gauge)).toEqual([...THEMATIC_GAUGE_IDS]);
    // The engine's own arithmetic, spelled out here (the two-path rule).
    for (const gauge of GAUGES.filter((g) => (THEMATIC_GAUGE_IDS as readonly string[]).includes(g.id))) {
      const engine = gaugeReading(gauge, readings);
      const tile = strip.find((t) => t.gauge === gauge.id)!;
      expect(tile.reading.step, gauge.id).toBe(engine.step);
      expect(tile.reading.votingCount, gauge.id).toBe(engine.votingCount);
      expect(tile.reading.warningCount, gauge.id).toBe(engine.warningCount);
      expect(tile.reading.staleCount, gauge.id).toBe(engine.staleCount);
      expect(tile.word, gauge.id).toBe(labelForVerdictStep(engine.step));
    }
    // Spot checks the words a visitor would see: borrowing-costs 1/10
    // warnings (step 2 cautious), prices-heat 1/6 (step 2), market-stress
    // 0 fresh warnings + 1 stale voter (step 1 — the stale member dilutes,
    // never inflates), and the strip carries all five in GAUGES order.
    expect(strip.find((t) => t.gauge === 'borrowing-costs')!.reading.step).toBe(2);
    expect(strip.find((t) => t.gauge === 'market-stress')!.word).toBe('relaxed');
  });

  it('nothing fresh anywhere → every strip entry reads step 0 (cannot read), never invented', () => {
    const empty: IndicatorReading[] = [];
    const strip = usaGaugeVerdicts(empty);
    expect(strip).toHaveLength(5);
    for (const tile of strip) {
      expect(tile.reading.step).toBe(0);
      expect(tile.word).toBeNull();
    }
  });
});
