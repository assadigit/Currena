import { describe, expect, it } from 'vitest';

import type { IndicatorReading } from '@currena/core';

import { GAUGES, gaugeReading, gaugesForSection, isShadowGauge, labelForVerdictStep, sectionVerdictStep, summarizeByGauges } from './gauges';

const NOW = '2026-10-07T04:20:00.000Z';
const NOW_DAY = '2026-10-07';

function reading(id: IndicatorReading['id'], status: IndicatorReading['status']): IndicatorReading {
  const unavailable = status === 'unavailable';
  return {
    id,
    value: unavailable ? null : 1,
    asOf: unavailable ? null : NOW_DAY,
    status,
    sourceName: 't',
    updatedAt: NOW,
  };
}

/** Readings map for one gauge: warning / normal / excluded counts per member. */
function readingsFor(gaugeId: (typeof GAUGES)[number]['id'], warnings: number, normals: number, excluded: number): IndicatorReading[] {
  const gauge = GAUGES.find((g) => g.id === gaugeId)!;
  const out: IndicatorReading[] = [];
  let i = 0;
  for (; i < warnings && i < gauge.members.length; i++) out.push(reading(gauge.members[i]!, 'warning'));
  for (; i < warnings + normals && i < gauge.members.length; i++) out.push(reading(gauge.members[i]!, 'normal'));
  for (; i < warnings + normals + excluded && i < gauge.members.length; i++) {
    out.push(reading(gauge.members[i]!, 'stale'));
  }
  return out;
}

describe('gauge step mapping (data spec §4)', () => {
  it('share 0 → step 1; ≤⅓ → 2; ≤⅔ → 3; >⅔ → 4', () => {
    const g = GAUGES.find((gg) => gg.id === 'market-stress')!; // 3 members
    expect(gaugeReading(g, readingsFor('market-stress', 0, 3, 0)).step).toBe(1);
    expect(gaugeReading(g, readingsFor('market-stress', 1, 2, 0)).step).toBe(2); // 1/3 = ⅓ boundary
    expect(gaugeReading(g, readingsFor('market-stress', 2, 1, 0)).step).toBe(3); // 2/3 boundary
    expect(gaugeReading(g, readingsFor('market-stress', 3, 0, 0)).step).toBe(4);
  });

  it('no voters → step 0 (cannot read, never a guess)', () => {
    const g = GAUGES.find((gg) => gg.id === 'prices-heat')!;
    expect(gaugeReading(g, readingsFor('prices-heat', 0, 0, 2)).step).toBe(0);
    expect(gaugeReading(g, []).step).toBe(0);
  });

  it('excluded (stale) members do not vote — and their silence never inflates the share (S1-M1.4)', () => {
    const g = GAUGES.find((gg) => gg.id === 'dollar-strength')!; // 3 members
    const r = gaugeReading(g, [...readingsFor('dollar-strength', 1, 0, 0), reading(g.members[1]!, 'stale')]);
    // 1 fresh warning + 1 stale member: the share is 1/(1+1) = 0.5 → step 3.
    // (Before S1-M1.4 the stale member left the denominator and 1/1 = 1.0
    // read step 4 “alarmed” — a calmer-looking member going STALE made the
    // gauge look WORSE. The stale member now dilutes instead: it never
    // votes, and it never shrinks the base.)
    expect(r).toMatchObject({ step: 3, votingCount: 1, warningCount: 1, staleCount: 1 });
  });

  it('context/price readings never vote (gold-usd on the prices board)', () => {
    const g = GAUGES.find((gg) => gg.id === 'borrowing-costs')!;
    const r = gaugeReading(g, [...readingsFor('borrowing-costs', 0, 6, 0), reading('gold-usd', 'context')]);
    expect(r.votingCount).toBe(6);
  });
});

describe('sectionVerdictStep (the Step-1 E1 count rule — one mapping, both regions)', () => {
  it('a majority of areas at step ≥ 2 → stressed (was a rounded average)', () => {
    const readings = [
      ...readingsFor('au-inflation-rates', 2, 1, 0), // 2/3 → step 3
      ...readingsFor('au-households', 0, 6, 0), // 0 → step 1
      ...readingsFor('au-trade-currency', 1, 3, 0), // 1/4 = 0.25 → step 2
    ];
    // Steps [3,1,2]: not two areas ≥ 3, but a majority (2 of 3) ≥ 2 → 3.
    expect(sectionVerdictStep('australia', readings)).toBe(3);
  });

  it('ONE critical area with the rest calm → cautious (the audit\'s Global case)', () => {
    const readings = [
      ...readingsFor('au-inflation-rates', 3, 0, 0), // 3/3 → step 4
      ...readingsFor('au-households', 0, 6, 0), // step 1
      ...readingsFor('au-trade-currency', 0, 4, 0), // step 1
    ];
    // Steps [4,1,1]: only one area ≥ 3 and not a majority ≥ 2 → 2. The
    // reason line still names the critical area; the word no longer
    // overstates one hot gauge into a region-wide "stressed".
    expect(sectionVerdictStep('australia', readings)).toBe(2);
  });

  it('the audit\'s exact snapshot words: Australia [3,3,1] → stressed, Global [4,1,1,1,1] → cautious', () => {
    // Australia 2026-10-12: au-inflation 2/3 warning → 3, au-households 3/6 → 3,
    // au-trade 0/4 → 1. Two areas ≥ 3 → STRESSED (the page said Cautious).
    const au = [
      ...readingsFor('au-inflation-rates', 2, 1, 0), // step 3
      ...readingsFor('au-households', 3, 3, 0), // 0.5 → step 3
      ...readingsFor('au-trade-currency', 0, 4, 0), // step 1
    ];
    expect(sectionVerdictStep('australia', au)).toBe(3);
    // Global 2026-10-12: prices-heat 2/2 → 4, everything else calm → CAUTIOUS
    // (the page said Stressed — one critical area is not a region-wide stress).
    const global = [
      ...readingsFor('borrowing-costs', 0, 4, 2), // step 1
      ...readingsFor('prices-heat', 2, 0, 0), // step 4
      ...readingsFor('market-stress', 0, 3, 0), // step 1
      ...readingsFor('dollar-strength', 0, 2, 0), // step 1
      ...readingsFor('growth-health', 0, 3, 0), // step 1
    ];
    expect(sectionVerdictStep('global', global)).toBe(2);
  });

  it('alarmed only for two critical areas, or every area stressed-or-worse', () => {
    const twoCritical = [
      ...readingsFor('au-inflation-rates', 3, 0, 0), // step 4
      ...readingsFor('au-households', 5, 1, 0), // 5/6 > 2/3 → step 4
      ...readingsFor('au-trade-currency', 0, 4, 0), // step 1
    ];
    expect(sectionVerdictStep('australia', twoCritical)).toBe(4);
    const allStressed = [
      ...readingsFor('au-inflation-rates', 2, 1, 0), // step 3
      ...readingsFor('au-households', 4, 2, 0), // 4/6 → step 3
      ...readingsFor('au-trade-currency', 2, 2, 0), // 0.5 → step 3
    ];
    expect(sectionVerdictStep('australia', allStressed)).toBe(4);
  });

  it('unreadable gauges lower nothing; nothing readable → 0', () => {
    expect(sectionVerdictStep('global', [])).toBe(0);
    // Only non-gauge readings → 0 (brent now votes in prices-heat — fix
    // B-14 — so the context rows alone still read nothing).
    expect(sectionVerdictStep('global', [reading('gold-usd', 'context')])).toBe(0);
  });

  it('clamps to 1–4 when readable', () => {
    const allCalm = [
      ...readingsFor('au-inflation-rates', 0, 3, 0),
      ...readingsFor('au-households', 0, 6, 0),
      ...readingsFor('au-trade-currency', 0, 4, 0),
    ];
    expect(sectionVerdictStep('australia', allCalm)).toBe(1);
    const allAlert = [
      ...readingsFor('au-inflation-rates', 3, 0, 0),
      ...readingsFor('au-households', 6, 0, 0),
      ...readingsFor('au-trade-currency', 4, 0, 0),
    ];
    expect(sectionVerdictStep('australia', allAlert)).toBe(4);
  });
});

describe('labelForVerdictStep (the existing four label words, Block H1)', () => {
  it('maps steps 1–4 onto the existing labels; 0 → null (never invented)', () => {
    expect(labelForVerdictStep(1)).toBe('relaxed');
    expect(labelForVerdictStep(2)).toBe('cautious');
    expect(labelForVerdictStep(3)).toBe('stressed');
    expect(labelForVerdictStep(4)).toBe('alarmed');
    expect(labelForVerdictStep(0)).toBeNull();
  });
});

describe('stale-voter honesty (gap-closure S1-M1.4)', () => {
  it('a calm member going stale never makes the gauge more severe', () => {
    const g = GAUGES.find((gg) => gg.id === 'market-stress')!; // 5 members
    // 2 warnings + 3 normals: share 0.4 → step 3.
    const fresh = gaugeReading(g, readingsFor('market-stress', 2, 3, 0));
    expect(fresh.step).toBe(3);
    // Two of the calm members go stale: fresh 2W of 2 votable, 2 stale →
    // share 2/(2+2) = 0.5 → step 3 — NOT the old 2/2 = 1.0 → step 4.
    const readings = readingsFor('market-stress', 2, 1, 2); // 2W + 1N fresh, 2 stale
    const withStale = gaugeReading(g, readings);
    expect(withStale).toMatchObject({ step: 3, votingCount: 3, warningCount: 2, staleCount: 2 });
    expect(withStale.step).toBeLessThanOrEqual(fresh.step);
  });

  it('a WARNING member going stale only makes the gauge milder', () => {
    const g = GAUGES.find((gg) => gg.id === 'dollar-strength')!; // 3 members
    const fresh = gaugeReading(g, readingsFor('dollar-strength', 2, 1, 0)); // 0.67 → step 3
    expect(fresh.step).toBe(3);
    const withStale = gaugeReading(g, readingsFor('dollar-strength', 1, 1, 1)); // 1W+1N fresh, 1 stale → 1/3 → step 2
    expect(withStale.step).toBe(2);
    expect(withStale.staleCount).toBe(1);
  });

  it('an all-stale gauge stays unreadable (step 0) and reports its staleCount', () => {
    const g = GAUGES.find((gg) => gg.id === 'au-inflation-rates')!;
    const r = gaugeReading(g, readingsFor('au-inflation-rates', 0, 0, 5));
    expect(r).toMatchObject({ step: 0, votingCount: 0, warningCount: 0, staleCount: 5 });
  });

  it('unavailable members still do not dilute — only a READING past its window does', () => {
    const g = GAUGES.find((gg) => gg.id === 'dollar-strength')!; // 3 members
    const r = gaugeReading(g, [
      reading(g.members[0]!, 'warning'),
      reading(g.members[1]!, 'unavailable'),
      reading(g.members[2]!, 'stale'),
    ]);
    // 1 fresh warning + 1 stale dilutes (1/2 = 0.5 → step 3); the missing
    // member contributes nothing at all — no reading exists to dilute with.
    expect(r).toMatchObject({ step: 3, votingCount: 1, staleCount: 1 });
  });

  it('the summary reports staleCount and the stale voter ids (the RBA trio case)', () => {
    const readings = [
      reading('au-cpi', 'warning'),
      reading('au-trimmed-mean', 'warning'),
      reading('rba-expectations', 'stale'),
      reading('au-10y', 'stale'),
      reading('au-us-10y-gap', 'stale'),
      // The other two AU gauges, fully fresh and calm:
      ...readingsFor('au-households', 0, 7, 0),
      ...readingsFor('au-trade-currency', 0, 4, 0),
    ];
    const s = summarizeByGauges(readings);
    expect(s.australia).toMatchObject({
      staleCount: 3,
      staleVoters: ['rba-expectations', 'au-10y', 'au-us-10y-gap'],
      excludedCount: 3, // stale members are still excluded from voting
    });
    // The inflation gauge itself: 2 fresh warnings + 3 stale → 2/5 = 0.4 →
    // step 3 (the old fresh-only 2/2 = 1.0 → step 4 read worse than the
    // data supports).
    expect(gaugeReading(GAUGES.find((gg) => gg.id === 'au-inflation-rates')!, readings).step).toBe(3);
  });

  it('the section verdict never rises when members go stale (end-to-end guard)', () => {
    const fresh = [
      ...readingsFor('au-inflation-rates', 4, 1, 0), // 0.8 → step 4
      ...readingsFor('au-households', 3, 4, 0), // 0.43 → step 3
      ...readingsFor('au-trade-currency', 1, 3, 0), // 0.25 → step 2
    ];
    expect(sectionVerdictStep('australia', fresh)).toBe(3); // [4,3,2]
    const withStale = [
      // The RBA trio goes stale: 2 fresh warnings + 3 stale → 0.4 → step 3.
      reading('au-cpi', 'warning'),
      reading('au-trimmed-mean', 'warning'),
      reading('rba-expectations', 'stale'),
      reading('au-10y', 'stale'),
      reading('au-us-10y-gap', 'stale'),
      ...readingsFor('au-households', 3, 4, 0),
      ...readingsFor('au-trade-currency', 1, 3, 0),
    ];
    expect(sectionVerdictStep('australia', withStale)).toBeLessThanOrEqual(3);
  });
});

describe('summarizeByGauges (the summary wire shape)', () => {
  it('counts describe GAUGE members only; label comes from the verdict step', () => {
    const readings = [
      ...readingsFor('au-inflation-rates', 1, 2, 0), // step 2 (4 members, 3 voting: 1 warning)
      ...readingsFor('au-households', 0, 5, 1), // step 1
      ...readingsFor('au-trade-currency', 0, 5, 0), // step 1 (4 members since iron-ore went context; A-5 adds rba-fed-gap)
      // Non-member readings must not leak into the counts:
      reading('gold-usd', 'context'),
      reading('rba-cash-rate', 'context'),
      reading('iron-ore', 'context'),
      reading('au-deposit-rate', 'context'),
    ];
    const s = summarizeByGauges(readings);
    // Steps [2,1,1]: any area ≥ 2 → cautious (the E1 count rule).
    expect(s.australia).toEqual({
      section: 'australia',
      label: 'cautious',
      warningCount: 1,
      votingCount: 12,
      excludedCount: 1,
      // S1-M1.4 additive fields: the au-households stale member (the 6th
      // member, au-home-values) is now named, not just counted.
      staleCount: 1,
      staleVoters: ['au-home-values'],
    });
    // Global has no votable readings here → honest null label.
    expect(s.global).toMatchObject({ label: null, votingCount: 0, warningCount: 0 });
  });

  it('empty readings → both lines null with zero counts', () => {
    const s = summarizeByGauges([]);
    expect(s.global).toMatchObject({ label: null, votingCount: 0 });
    expect(s.australia).toMatchObject({ label: null, votingCount: 0 });
  });
});

describe('GAUGES table shape (v1 membership, data spec §4)', () => {
  it('has 9 gauges — 6 global + 3 australia — in lane order (gap-closure S4-M4.3: the geo-fragmentation shadow gauge joins global, last)', () => {
    expect(GAUGES.map((g) => g.id)).toEqual([
      'borrowing-costs',
      'prices-heat',
      'market-stress',
      'dollar-strength',
      'growth-health',
      'au-inflation-rates',
      'au-households',
      'au-trade-currency',
      'geo-fragmentation',
    ]);
    expect(GAUGES.filter((g) => g.section === 'global')).toHaveLength(6);
    expect(GAUGES.filter((g) => g.section === 'australia')).toHaveLength(3);
  });

  it('32 global scored + 16 australia scored = 48 voting members (fix B-14: +brent in prices-heat; 2026-10-23 OD-7: m2-us demoted out of growth-health; 2026-10-24 M4 Wave 1: +claims +recession-probability +michigan-sentiment +us-pce-core-yoy; 2026-10-25 M6 Wave 3: +euro-hicp in prices-heat, +au-housing-finance in au-households; 2026-10-26 M7: +china-cpi in growth-health; the 2026-10-26 gap-audit build adds yield-curve-10y3m in borrowing-costs (A-1), cftc-gold-positioning in market-stress (A-7), us-japan-10y-gap in dollar-strength (A-3) and oecd-cli-us in growth-health (A-8, the licensed-PMI replacement); gap-closure S4-M4.3 (2026-11-01): the geo-fragmentation members are context-only — counted in the 40 GLOBAL members below but NOT in the 48 voters; S4-M4.5 adds the three supply members of the lane — gscpi, us-spr, us-crude-production — the same context-only class)', () => {
    expect(GAUGES.filter((g) => g.section === 'global').flatMap((g) => g.members)).toHaveLength(40);
    expect(GAUGES.filter((g) => g.section === 'australia').flatMap((g) => g.members)).toHaveLength(16);
    // gap-closure S4-M4.3: the shadow gauge never votes — every member
    // context-only, the step stays 0, the region verdict EXCLUDES it (the
    // summary counts are unchanged by design).
    const shadow = GAUGES.find((g) => g.id === 'geo-fragmentation')!;
    expect(isShadowGauge(shadow)).toBe(true);
    expect(GAUGES.filter((g) => !isShadowGauge(g)).flatMap((g) => g.members)).toHaveLength(48);
  });

  it('no member appears in two gauges', () => {
    const all = GAUGES.flatMap((g) => g.members);
    expect(new Set(all).size).toBe(all.length);
  });

  it('prices-board group is NOT a gauge (the strip rows stay out of the lanes; oil counts in prices-heat — fix B-14)', () => {
    expect(GAUGES.map((g) => g.id)).not.toContain('prices-board');
    expect(GAUGES.find((g) => g.id === 'prices-heat')!.members).toContain('brent');
  });

  it('gaugesForSection returns readings in GAUGES order', () => {
    const readings = [...readingsFor('borrowing-costs', 0, 6, 0), ...readingsFor('growth-health', 0, 3, 0)];
    const out = gaugesForSection('global', readings);
    expect(out.map((g) => g.gauge)).toEqual(GAUGES.filter((g) => g.section === 'global').map((g) => g.id));
  });
});
