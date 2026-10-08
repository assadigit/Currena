import { describe, expect, it } from 'vitest';

import type { IndicatorReading } from '@currena/core';

import { GAUGES, gaugeReading, gaugesForSection, labelForVerdictStep, sectionVerdictStep, summarizeByGauges } from './gauges';

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

  it('excluded (stale) members do not vote but are not warnings', () => {
    const g = GAUGES.find((gg) => gg.id === 'dollar-strength')!; // 2 members
    const r = gaugeReading(g, [...readingsFor('dollar-strength', 1, 0, 0), reading(g.members[1]!, 'stale')]);
    expect(r).toMatchObject({ step: 4, votingCount: 1, warningCount: 1 });
  });

  it('context/price readings never vote (gold-usd on the prices board)', () => {
    const g = GAUGES.find((gg) => gg.id === 'borrowing-costs')!;
    const r = gaugeReading(g, [...readingsFor('borrowing-costs', 0, 6, 0), reading('gold-usd', 'context')]);
    expect(r.votingCount).toBe(6);
  });
});

describe('sectionVerdictStep (rounded average + escalation)', () => {
  it('is the rounded average of readable gauge steps', () => {
    // Australia: 3 gauges at steps (readings drive them) — build mixed statuses.
    const readings = [
      ...readingsFor('au-inflation-rates', 2, 1, 0), // 2/3 → step 3
      ...readingsFor('au-households', 0, 6, 0), // 0 → step 1
      ...readingsFor('au-trade-currency', 1, 3, 0), // 1/4 = 0.25 → step 2
    ];
    // Average = 2.0 → verdict 2.
    expect(sectionVerdictStep('australia', readings)).toBe(2);
  });

  it('escalates to at least 3 when any gauge sits at step 4', () => {
    const readings = [
      ...readingsFor('au-inflation-rates', 3, 0, 0), // 3/3 → step 4
      ...readingsFor('au-households', 0, 6, 0), // step 1
      ...readingsFor('au-trade-currency', 0, 4, 0), // step 1
    ];
    // Average 2 → but the step-4 gauge escalates to 3.
    expect(sectionVerdictStep('australia', readings)).toBe(3);
  });

  it('unreadable gauges lower nothing; nothing readable → 0', () => {
    expect(sectionVerdictStep('global', [])).toBe(0);
    // Only price-board context readings (no gauge members) → 0.
    expect(sectionVerdictStep('global', [reading('gold-usd', 'context'), reading('brent', 'warning')])).toBe(0);
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

describe('summarizeByGauges (the summary wire shape)', () => {
  it('counts describe GAUGE members only; label comes from the verdict step', () => {
    const readings = [
      ...readingsFor('au-inflation-rates', 1, 2, 0), // step 2
      ...readingsFor('au-households', 0, 5, 1), // step 1
      ...readingsFor('au-trade-currency', 0, 4, 0), // step 1
      // Non-member readings must not leak into the counts:
      reading('gold-usd', 'context'),
      reading('brent', 'warning'),
      reading('rba-cash-rate', 'context'),
    ];
    const s = summarizeByGauges(readings);
    // Average (2+1+1)/3 = 1.33 → round 1 → relaxed.
    expect(s.australia).toEqual({
      section: 'australia',
      label: 'relaxed',
      warningCount: 1,
      votingCount: 12,
      excludedCount: 1,
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
  it('has 8 gauges — 5 global + 3 australia — in lane order', () => {
    expect(GAUGES.map((g) => g.id)).toEqual([
      'borrowing-costs',
      'prices-heat',
      'market-stress',
      'dollar-strength',
      'growth-health',
      'au-inflation-rates',
      'au-households',
      'au-trade-currency',
    ]);
    expect(GAUGES.filter((g) => g.section === 'global')).toHaveLength(5);
    expect(GAUGES.filter((g) => g.section === 'australia')).toHaveLength(3);
  });

  it('16 global scored + 13 australia scored = 29 voting members', () => {
    expect(GAUGES.filter((g) => g.section === 'global').flatMap((g) => g.members)).toHaveLength(16);
    expect(GAUGES.filter((g) => g.section === 'australia').flatMap((g) => g.members)).toHaveLength(13);
  });

  it('no member appears in two gauges', () => {
    const all = GAUGES.flatMap((g) => g.members);
    expect(new Set(all).size).toBe(all.length);
  });

  it('prices-board group is NOT a gauge (price rows never vote)', () => {
    expect(GAUGES.map((g) => g.id)).not.toContain('prices-board');
  });

  it('gaugesForSection returns readings in GAUGES order', () => {
    const readings = [...readingsFor('borrowing-costs', 0, 6, 0), ...readingsFor('growth-health', 0, 3, 0)];
    const out = gaugesForSection('global', readings);
    expect(out.map((g) => g.gauge)).toEqual(GAUGES.filter((g) => g.section === 'global').map((g) => g.id));
  });
});
