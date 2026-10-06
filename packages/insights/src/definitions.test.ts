import { describe, expect, it } from 'vitest';

import { IndicatorDefinitionSchema, IndicatorIdSchema } from '@currena/core';

import { DEFINITIONS } from './definitions';

describe('DEFINITIONS (the v1 indicator table)', () => {
  it('every row parses against the shared zod contract (loud, never garbage)', () => {
    for (const def of DEFINITIONS) {
      const parsed = IndicatorDefinitionSchema.safeParse(def);
      expect(parsed.success, `definition ${def.id} failed validation`).toBe(true);
    }
  });

  it('covers every v1 indicator id exactly once (28, blocked ids absent)', () => {
    const ids = DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(IndicatorIdSchema.options.length);
    expect([...ids].sort()).toEqual([...IndicatorIdSchema.options].sort());
  });

  it('splits 17 P1 / 11 P2 as the roadmap promises', () => {
    expect(DEFINITIONS.filter((d) => d.phase === 'P1')).toHaveLength(17);
    expect(DEFINITIONS.filter((d) => d.phase === 'P2')).toHaveLength(11);
  });

  it('group membership matches the spec sections (global 4 groups, australia 3)', () => {
    const groups = new Set(DEFINITIONS.map((d) => d.group));
    expect([...groups].sort()).toEqual(
      [
        'rates-credit',
        'currencies',
        'metals-crypto',
        'stocks-growth',
        'interest-inflation',
        'currency-trade',
        'jobs-housing',
      ].sort(),
    );
    // Section/group coherence: a group belongs to exactly one section.
    const sectionOfGroup = new Map<string, Set<string>>();
    for (const d of DEFINITIONS) {
      const set = sectionOfGroup.get(d.group) ?? new Set<string>();
      set.add(d.section);
      sectionOfGroup.set(d.group, set);
    }
    for (const [group, sections] of sectionOfGroup) {
      expect(sections.size, `group ${group} spans multiple sections`).toBe(1);
    }
  });

  it('info-only cards never vote: exactly the five info rules the spec lists', () => {
    const info = DEFINITIONS.filter((d) => d.rule.kind === 'info').map((d) => d.id).sort();
    expect(info).toEqual(['gold-aud', 'gold-btc', 'rba-cash-rate', 'silver-btc', 'usdcny']);
  });

  it('key thresholds are spec-verbatim (backtest may propose changes, never silently)', () => {
    const byId = new Map(DEFINITIONS.map((d) => [d.id, d]));
    expect(byId.get('yield-curve-10y2y')!.rule).toEqual({ kind: 'threshold', direction: 'below', value: 0 });
    expect(byId.get('stress-stlfsi')!.rule).toEqual({
      kind: 'threshold',
      direction: 'above',
      value: 0,
      sustainedWeeks: 4,
    });
    expect(byId.get('au-cpi')!.rule).toEqual({ kind: 'threshold', direction: 'above', value: 3 });
    expect(byId.get('china-pmi')!.rule).toEqual({ kind: 'threshold', direction: 'below', value: 50 });
    expect(byId.get('usdjpy')!.rule).toEqual({
      kind: 'change',
      mode: 'pct',
      direction: 'fall',
      magnitude: 5,
      windowWeeks: 4,
    });
    expect(byId.get('brent')!.rule).toEqual({
      kind: 'change',
      mode: 'pct',
      direction: 'rise',
      magnitude: 25,
      windowWeeks: 13,
    });
    expect(byId.get('au-unemployment')!.rule).toEqual({ kind: 'above-low', rise: 0.5 });
    expect(byId.get('terms-of-trade')!.rule).toEqual({ kind: 'consecutive-decline', periods: 2 });
    expect(byId.get('au-home-values')!.rule).toEqual({ kind: 'consecutive-decline', periods: 3 });
    expect(byId.get('m2-us')!.rule).toEqual({ kind: 'yoy-negative' });
    expect(byId.get('us10y')!.rule).toEqual({
      kind: 'any-of',
      of: [
        { kind: 'percentile', tail: 'high', cutoff: 0.1 },
        { kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 },
      ],
    });
  });
});
