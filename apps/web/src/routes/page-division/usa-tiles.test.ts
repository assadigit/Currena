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
import { THEMATIC_GAUGE_IDS, THEMATIC_GAUGE_MEMBER_IDS, pageGroupIds, pageHomeIds, PAGE_PLACEMENTS_BY_PAGE } from '@currena/insights/page-division';
import { DISPLAY, formatReadingValue, type UnitLabels } from '../../components/insights/config/display';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { globalGaugeTiles } from './global-tiles';
import {
  USA_CARD_DISPLAY,
  USA_CARD_IDS,
  USA_TIER1_IDS,
  USA_TIER2_IDS,
  USA_TIER3_IDS,
  USA_TIER4_IDS,
  USA_TIER5_IDS,
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
  index: insightsCopyEn.units.index,
  claims: insightsCopyEn.units.claims,
  permits: insightsCopyEn.units.permits,
  openings: insightsCopyEn.units.openings,
};
const faUsaUnits: UsaUnitLabels = {
  percent: insightsCopyFa.units.percent,
  points: insightsCopyFa.units.points,
  ratio: insightsCopyFa.units.ratio,
  usd: insightsCopyFa.units.usd,
  'usd-tr': insightsCopyFa.units['usd-tr'],
  'usd-bn': insightsCopyFa.units['usd-bn'],
  index: insightsCopyFa.units.index,
  claims: insightsCopyFa.units.claims,
  permits: insightsCopyFa.units.permits,
  openings: insightsCopyFa.units.openings,
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
  // ---- Tier 3 — inflation (the live 2026-11-08 projection's own
  // magnitudes, so the family-convention asserts speak real renders) ----
  'us-cpi-core-yoy': 2.5643583511686696,
  'median-cpi': 2.8081575376,
  'sticky-cpi': 3.401271558,
  'us-wages': 3.3123028391167217,
  t5yie: 2.29,
  'breakeven-5y5y': 2.17,
  'breakeven-10y': 2.23,
  'breakeven-tilt': -0.12,
  'cpi-nowcast': 0.19,
  'cpi-surprise': 0.05,
  'michigan-5y-expectations': 3.4,
  'michigan-1y-expectations': 4.6,
  // ---- Tier 4 — labor & growth ----
  'initial-jobless-claims': 189000,
  'continuing-claims': 1718000,
  'job-openings': 7523,
  'sahm-rule': 0,
  'recession-probability': 0.4,
  'michigan-sentiment': 48.1,
  'oecd-cli-us': 100.9993,
  'philly-fed': 20.9,
  'empire-state': 25.5,
  cfnai: 0.07,
  gdpnow: 3.4408,
  'us-gdp-growth': 3.4,
  'retail-sales': 745021,
  'housing-permits': 1398,
  'epu-us': 187.92078198152723,
  'tpu-us': 1326.419349465307,
  'm2-us': 23413.9,
  // ---- Tier 5 — liquidity, stress & valuation ----
  walcl: 6748145,
  tga: 957175,
  'reverse-repo': 0.15,
  'bank-reserves': 2930088,
  'repo-stress': 0.02,
  'net-liquidity': 5790745,
  'stress-stlfsi': -0.5224,
  nfci: -0.459,
  vix: 28.18,
  'bank-stress': 4,
  ebp: -0.26533114775416333,
  'ofr-fsi': -2.162,
  'sloos-ci-tightening': 1.7,
  'term-premium-10y': 0.9089,
  'shiller-cape': 40.71,
  'shiller-ecy': 0.5599999999999999,
  'sp500-breadth-ratio': 0.2938,
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

  it('tier 3 is pageGroupIds("usa", "tier-3-inflation") byte-for-byte (the placement’s 12 — michigan-1y-expectations is AF-3, owner ratification pending)', () => {
    expect(USA_TIER3_IDS).toEqual(pageGroupIds('usa', 'tier-3-inflation'));
    expect(USA_TIER3_IDS).toHaveLength(12);
    // The spec §7 item 4 list (11 named) + the AF-3 twin.
    expect(USA_TIER3_IDS).toEqual([
      'us-cpi-core-yoy',
      'median-cpi',
      'sticky-cpi',
      'us-wages',
      't5yie',
      'breakeven-5y5y',
      'breakeven-10y',
      'breakeven-tilt',
      'cpi-nowcast',
      'cpi-surprise',
      'michigan-5y-expectations',
      'michigan-1y-expectations',
    ]);
    const group = PAGE_PLACEMENTS_BY_PAGE.get('usa')?.groups.find((g) => g.id === 'tier-3-inflation');
    expect(group?.note).toContain('AF-3');
  });

  it('tier 4 is pageGroupIds("usa", "tier-4-labor-growth") byte-for-byte (the placement’s 17 — AF-2’s "(19)" label is the recorded drift)', () => {
    expect(USA_TIER4_IDS).toEqual(pageGroupIds('usa', 'tier-4-labor-growth'));
    expect(USA_TIER4_IDS).toHaveLength(17);
    expect(USA_TIER4_IDS[0]).toBe('initial-jobless-claims');
    expect(USA_TIER4_IDS).toContain('m2-us');
  });

  it('tier 5 is pageGroupIds("usa", "tier-5-liquidity-stress-valuation") byte-for-byte (the spec’s own 17)', () => {
    expect(USA_TIER5_IDS).toEqual(pageGroupIds('usa', 'tier-5-liquidity-stress-valuation'));
    expect(USA_TIER5_IDS).toHaveLength(17);
    expect(USA_TIER5_IDS[0]).toBe('walcl');
    expect(USA_TIER5_IDS).toContain('sp500-breadth-ratio');
  });

  it('the full card list is tier order (7+19+12+17+17 = 72), no duplicates, and equals the page’s own homes', () => {
    expect(USA_CARD_IDS).toEqual([...USA_TIER1_IDS, ...USA_TIER2_IDS, ...USA_TIER3_IDS, ...USA_TIER4_IDS, ...USA_TIER5_IDS]);
    expect(USA_CARD_IDS).toHaveLength(72);
    expect(new Set(USA_CARD_IDS).size).toBe(72);
    // The placement table’s own count: the usa page carries 72 registry
    // cards (tier 6 is the TIC BOARD, not registry cards).
    expect(pageHomeIds('usa')).toHaveLength(72);
    expect([...USA_CARD_IDS]).toEqual([...pageHomeIds('usa')]);
  });
});

describe('the lean display mirror — the DISPLAY registry’s own configs', () => {
  it('every one of the 72 ids matches decimals + unit + scale + range', () => {
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

  it('the S10 scaled families ride the DISPLAY registry’s own magnitudes (the M4/M6 Wave conventions)', () => {
    // The liquidity trio + M2 read $ millions or $ billions as trillions;
    // the claims pair renders whole; job openings/permits/retail scale to
    // their magnitude words; the recession probability is a stored
    // fraction rendered ×100.
    expect(USA_CARD_DISPLAY.walcl.scale).toBe(1e-6);
    expect(USA_CARD_DISPLAY.tga.scale).toBe(1e-6);
    expect(USA_CARD_DISPLAY['bank-reserves'].scale).toBe(1e-6);
    expect(USA_CARD_DISPLAY['net-liquidity'].scale).toBe(1e-6);
    expect(USA_CARD_DISPLAY['m2-us'].scale).toBe(0.001);
    expect(USA_CARD_DISPLAY['job-openings'].scale).toBe(0.001);
    expect(USA_CARD_DISPLAY['housing-permits'].scale).toBe(0.001);
    expect(USA_CARD_DISPLAY['retail-sales'].scale).toBe(0.001);
    expect(USA_CARD_DISPLAY['recession-probability'].scale).toBe(100);
    expect(USA_CARD_DISPLAY['initial-jobless-claims'].decimals).toBe(0);
    // reverse-repo is ALREADY billions at the source — no scale (the RRP
    // family’s own convention).
    expect(USA_CARD_DISPLAY['reverse-repo'].scale).toBeUndefined();
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
    // The S10 families: the liquidity trillions, the claims whole
    // numbers with the count word, the magnitude-word units, the ×100
    // recession probability, the tight 4dp breadth ratio.
    expect(usaCardValueText('walcl', fixtureReading('walcl', false), 'en-US', enUsaUnits)).toBe('US$6.75 trillion');
    expect(usaCardValueText('reverse-repo', fixtureReading('reverse-repo', false), 'en-US', enUsaUnits)).toBe('US$0.15bn');
    expect(usaCardValueText('initial-jobless-claims', fixtureReading('initial-jobless-claims', false), 'en-US', enUsaUnits)).toBe('189,000 claims');
    expect(usaCardValueText('job-openings', fixtureReading('job-openings', false), 'en-US', enUsaUnits)).toBe('7.52 m job openings');
    expect(usaCardValueText('housing-permits', fixtureReading('housing-permits', false), 'en-US', enUsaUnits)).toBe('1.40 m permits a year');
    expect(usaCardValueText('retail-sales', fixtureReading('retail-sales', false), 'en-US', enUsaUnits)).toBe('US$745.0bn');
    expect(usaCardValueText('m2-us', fixtureReading('m2-us', false), 'en-US', enUsaUnits)).toBe('US$23.4 trillion');
    expect(usaCardValueText('recession-probability', fixtureReading('recession-probability', false), 'en-US', enUsaUnits)).toBe('40%');
    expect(usaCardValueText('vix', fixtureReading('vix', false), 'en-US', enUsaUnits)).toBe('28.18 index');
    expect(usaCardValueText('shiller-cape', fixtureReading('shiller-cape', false), 'en-US', enUsaUnits)).toBe('40.71 ratio');
    expect(usaCardValueText('sp500-breadth-ratio', fixtureReading('sp500-breadth-ratio', false), 'en-US', enUsaUnits)).toBe('0.2938 ratio');
    expect(usaCardValueText('michigan-sentiment', fixtureReading('michigan-sentiment', false), 'fa-IR', faUsaUnits)).toContain('شاخص');
    expect(usaCardValueText('initial-jobless-claims', fixtureReading('initial-jobless-claims', false), 'fa-IR', faUsaUnits)).toContain('مورد');
  });

  it('absent readings and null values stay null (the honest unavailable word, never a guess)', () => {
    expect(usaCardValueText('us10y', undefined, 'en-US', enUsaUnits)).toBeNull();
    const unavailable = { id: 'us10y', value: null, asOf: null, status: 'unavailable' } as IndicatorReading;
    expect(usaCardValueText('us10y', unavailable, 'en-US', enUsaUnits)).toBeNull();
  });
});

describe('the card entries — placement order, absent stays absent', () => {
  it('usaCards: the 72 entries in tier order; missing readings stay undefined', () => {
    const present = fixtureReading('fed-target', true);
    const cpi = fixtureReading('us-cpi-yoy', false);
    const vix = fixtureReading('vix', false);
    const entries = usaCards([present, cpi, vix], USA_CARD_IDS);
    expect(entries.map((e) => e.id)).toEqual([...USA_TIER1_IDS, ...USA_TIER2_IDS, ...USA_TIER3_IDS, ...USA_TIER4_IDS, ...USA_TIER5_IDS]);
    expect(entries.find((e) => e.id === 'fed-target')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'us-cpi-yoy')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'vix')!.reading).toBeDefined();
    expect(entries.find((e) => e.id === 'us10y')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'govt-interest-revenue')!.reading).toBeUndefined();
    expect(entries.find((e) => e.id === 'sp500-breadth-ratio')!.reading).toBeUndefined();
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
