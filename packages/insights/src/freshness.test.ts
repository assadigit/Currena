/**
 * freshness.test.ts — P1 gates (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md
 * §3.5): fixtures for each cadence at the boundary (just fresh, just
 * stale), a weekend case, a missing-timestamp case — plus the AU-trio
 * cadence refinement, the per-change never-stale rule, the
 * override-import agreement with the status engine, and the hour math.
 */

import { describe, expect, it } from 'vitest';
import { GRACE_DAYS, staleAfterDaysFor } from './scoring';
import { DEFINITIONS } from './definitions';
import {
  FRESHNESS_CADENCE_REFINEMENTS,
  FRESHNESS_STALE_DAYS,
  freshnessCadenceOf,
  freshnessOf,
  freshnessStaleDaysFor,
  type FreshnessDefInput,
} from './freshness';
import type { IndicatorDefinition } from '@currena/core';

const defOf = (id: string): IndicatorDefinition => {
  const found = DEFINITIONS.find((d) => d.id === id);
  if (found === undefined) throw new Error(`no definition for ${id}`);
  return found;
};

const NOW = '2026-10-28T04:10:00.000Z';

/** A minimal definition shape for pure-cadence cases. */
function cadenceDef(
  cadence: IndicatorDefinition['cadence'],
  overrides: Partial<Pick<FreshnessDefInput, 'id' | 'staleAfterDays'>> = {},
): FreshnessDefInput {
  return { id: 'test-id', cadence, ...overrides };
}

describe('P1 freshness — boundary fixtures per cadence', () => {
  for (const cadence of ['daily', 'weekly', 'monthly', 'quarterly'] as const) {
    const window = FRESHNESS_STALE_DAYS[cadence]!;
    it(`${cadence}: exactly ${window} days old is fresh, ${window + 1} days is stale`, () => {
      const asOf = '2026-09-01';
      const atWindowIso = new Date(Date.parse('2026-09-01T00:00:00Z') + window * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const pastWindowIso = new Date(Date.parse('2026-09-01T00:00:00Z') + (window + 1) * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const justFresh = freshnessOf(cadenceDef(cadence), asOf, `${atWindowIso}T00:00:00Z`);
      const justStale = freshnessOf(cadenceDef(cadence), asOf, `${pastWindowIso}T00:00:00Z`);
      expect(justFresh.freshness).toBe('fresh');
      expect(justStale.freshness).toBe('stale');
      expect(justFresh.cadence).toBe(cadence);
    });
  }

  it('per-change levels never go stale by age', () => {
    const old = freshnessOf(cadenceDef('per-change'), '2016-10-31', NOW);
    expect(old.freshness).toBe('fresh');
    expect(old.ageHours).toBeGreaterThan(80_000);
  });

  it('manual data rides the monthly window (45 days)', () => {
    expect(FRESHNESS_STALE_DAYS.manual).toBe(45);
    const at45 = freshnessOf(cadenceDef('manual'), '2026-09-13', '2026-10-28T00:00:00Z');
    const at46 = freshnessOf(cadenceDef('manual'), '2026-09-12', '2026-10-28T00:00:00Z');
    expect(at45.freshness).toBe('fresh');
    expect(at46.freshness).toBe('stale');
  });
});

describe('P1 freshness — the weekend case', () => {
  it('a Friday daily print read on Sunday (2 days) is fresh; read on the following Wednesday (5 days) is stale', () => {
    // 2026-10-23 is a Friday; 2026-10-25 Sunday; 2026-10-28 Wednesday.
    const friday = '2026-10-23';
    expect(freshnessOf(cadenceDef('daily'), friday, '2026-10-25T12:00:00Z').freshness).toBe('fresh');
    expect(freshnessOf(cadenceDef('daily'), friday, '2026-10-28T00:00:00Z').freshness).toBe('stale');
    expect(freshnessOf(cadenceDef('daily'), friday, '2026-10-27T00:00:00Z').freshness).toBe('fresh');
  });

  it('a Monday weekly print read 10 days later (the next Monday + weekend) is fresh, 11 days stale', () => {
    const monday = '2026-10-19';
    expect(freshnessOf(cadenceDef('weekly'), monday, '2026-10-29T00:00:00Z').freshness).toBe('fresh');
    expect(freshnessOf(cadenceDef('weekly'), monday, '2026-10-30T00:00:00Z').freshness).toBe('stale');
  });
});

describe('P1 freshness — the missing-timestamp case', () => {
  it('a reading without asOf is unavailable, with null age and the refined cadence', () => {
    const info = freshnessOf(cadenceDef('daily'), null, NOW);
    expect(info).toEqual({ asOf: null, ageHours: null, cadence: 'daily', freshness: 'unavailable' });
  });
});

describe('P1 freshness — hour math', () => {
  it('ageHours counts whole hours from the asOf date midnight UTC, never negative', () => {
    expect(freshnessOf(cadenceDef('daily'), '2026-10-27', NOW).ageHours).toBe(28); // 1 day + 4h
    expect(freshnessOf(cadenceDef('daily'), '2026-10-28', NOW).ageHours).toBe(4); // same day, 04:10 UTC
    expect(freshnessOf(cadenceDef('daily'), '2026-10-28', '2026-10-28T00:00:00Z').ageHours).toBe(0);
    expect(freshnessOf(cadenceDef('daily'), '2026-10-29', NOW).ageHours).toBe(0); // future-dated: clamped
  });

  it('ageHours for a month-old reading is ~28×24 (the live AU case shape)', () => {
    expect(freshnessOf(cadenceDef('daily'), '2026-09-30', NOW).ageHours).toBe(28 * 24 + 4);
  });
});

describe('P1 freshness — agreement with the status engine (D-20)', () => {
  it('FRESHNESS_STALE_DAYS equals GRACE_DAYS for every cadence', () => {
    expect(FRESHNESS_STALE_DAYS).toEqual(GRACE_DAYS);
  });

  it('every non-refined definition keeps the same threshold the status engine uses', () => {
    for (const def of DEFINITIONS) {
      if (FRESHNESS_CADENCE_REFINEMENTS[def.id] !== undefined) continue; // the trio: tested below
      expect(freshnessStaleDaysFor(def)).toEqual(staleAfterDaysFor(def));
    }
  });
});

describe('P1 freshness — the AU trio cadence refinement (D-21)', () => {
  const trio = ['au-10y', 'rba-expectations', 'au-us-10y-gap'] as const;

  it('reports the real served cadence (monthly, the F2.1 fallback) while the daily path is venue-blocked', () => {
    for (const id of trio) {
      const def = defOf(id);
      expect(def.cadence).toBe('daily'); // the definition stays daily…
      expect(freshnessCadenceOf(def)).toBe('monthly'); // …but the served series is monthly
    }
  });

  it('the threshold still rides the definition override (40) — one tripwire with the status engine', () => {
    for (const id of trio) {
      expect(freshnessStaleDaysFor(defOf(id))).toBe(40);
    }
  });

  it('the live 2026-09-30 readings (28 days old) are fresh — the monthly fallback is current, not frozen', () => {
    for (const id of trio) {
      const info = freshnessOf(defOf(id), '2026-09-30', NOW);
      expect(info.freshness).toBe('fresh');
      expect(info.cadence).toBe('monthly');
      expect(info.ageHours).toBe(28 * 24 + 4);
    }
  });

  it('a frozen F2.1 feed (past the 40-day window) reads stale — the freeze tripwire', () => {
    for (const id of trio) {
      expect(freshnessOf(defOf(id), '2026-09-30', '2026-11-15T00:00:00Z').freshness).toBe('stale');
    }
  });

  it('no other definition is refined', () => {
    expect(Object.keys(FRESHNESS_CADENCE_REFINEMENTS)).toEqual([...trio]);
  });
});

describe('P1 freshness — documented override import (D-20)', () => {
  it('quarterly GDP (override 215) is fresh at 210 days — the BEA release cycle, not staleness', () => {
    const info = freshnessOf(defOf('us-gdp-growth'), '2026-04-01', NOW);
    expect(info.freshness).toBe('fresh');
    expect(info.cadence).toBe('quarterly');
  });

  it('a monthly ABS series (override 95) is fresh at 57 days and stale past 95', () => {
    expect(freshnessOf(defOf('au-cpi'), '2026-09-01', NOW).freshness).toBe('fresh');
    expect(freshnessOf(defOf('au-cpi'), '2026-06-01', NOW).freshness).toBe('stale');
  });

  it('an unrefined daily with no override uses the 4-day default', () => {
    expect(freshnessStaleDaysFor(cadenceDef('daily'))).toBe(4);
  });
});
