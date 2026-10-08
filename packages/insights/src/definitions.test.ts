import { describe, expect, it } from 'vitest';

import { IndicatorDefinitionSchema, IndicatorIdSchema } from '@currena/core';

import { DEFINITIONS } from './definitions';
import { GAUGES } from './gauges';

describe('DEFINITIONS (the v2 indicator table, I15)', () => {
  it('every row parses against the shared zod contract (loud, never garbage)', () => {
    for (const def of DEFINITIONS) {
      const parsed = IndicatorDefinitionSchema.safeParse(def);
      expect(parsed.success, `definition ${def.id} failed validation`).toBe(true);
    }
  });

  it('covers every indicator id exactly once (41, retired ids absent)', () => {
    const ids = DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(IndicatorIdSchema.options.length);
    expect([...ids].sort()).toEqual([...IndicatorIdSchema.options].sort());
    // The retired slug must NOT come back (replaced by the Currena basket).
    expect(ids).not.toContain('dollar-broad');
  });

  it('splits 25 P1 / 16 P2', () => {
    expect(DEFINITIONS.filter((d) => d.phase === 'P1')).toHaveLength(25);
    expect(DEFINITIONS.filter((d) => d.phase === 'P2')).toHaveLength(16);
  });

  it('groups are the question groups (global 5 + prices-board, australia 3)', () => {
    const groups = new Set(DEFINITIONS.map((d) => d.group));
    expect([...groups].sort()).toEqual(
      [
        'borrowing-costs',
        'prices-heat',
        'market-stress',
        'dollar-strength',
        'growth-health',
        'prices-board',
        'au-inflation-rates',
        'au-households',
        'au-trade-currency',
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

  it('info-only cards never vote: exactly the eleven info rules', () => {
    const info = DEFINITIONS.filter((d) => d.rule.kind === 'info').map((d) => d.id).sort();
    expect(info).toEqual([
      'au-petrol-yoy',
      'btc-usd',
      'copper-usd',
      'eur-usd',
      'gold-aud',
      'gold-btc',
      'gold-usd',
      'rba-cash-rate',
      'silver-btc',
      'silver-usd',
      'usdcny',
    ]);
  });

  it('GAUGE membership is exactly the scored ids in gauged groups (29 voters, data spec §4)', () => {
    const gaugedGroups = new Set(GAUGES.map((g) => g.id));
    const memberIds = new Set(GAUGES.flatMap((g) => g.members));
    expect(memberIds.size).toBe(29);
    // Every gauge member is a scored (non-info) definition in that gauge's group.
    for (const g of GAUGES) {
      for (const id of g.members) {
        const def = DEFINITIONS.find((d) => d.id === id)!;
        expect(def.rule.kind, `${id} in gauge ${g.id} must be a voting rule`).not.toBe('info');
        expect(def.group, `${id} must live in its gauge's group`).toBe(g.id);
        expect(gaugedGroups.has(def.group)).toBe(true);
      }
    }
    // And the inverse: every scored definition in a gauged group is a member.
    for (const def of DEFINITIONS) {
      if (gaugedGroups.has(def.group) && def.rule.kind !== 'info') {
        const g = GAUGES.find((gg) => gg.id === def.group)!;
        expect(g.members, `${def.id} missing from gauge ${def.group}`).toContain(def.id);
      }
    }
  });

  it('I15 freshness overrides: the spec §3 "stale after" column, verbatim', () => {
    const byId = new Map(DEFINITIONS.map((d) => [d.id, d]));
    const expectStale = (id: string, days: number | undefined) =>
      expect(byId.get(id as never)?.staleAfterDays, `${id} staleAfterDays`).toBe(days);
    expectStale('us-cpi-yoy', 75);
    expectStale('fed-target', 5);
    expectStale('ecb-dfr', 7);
    expectStale('dollar-basket', 4);
    expectStale('nfci', 14);
    expectStale('au-home-loan', 70);
    expectStale('au-wage-growth', 200);
    expectStale('au-rent-yoy', 95);
    expectStale('au-petrol-yoy', 95);
    expectStale('brent', 12);
    expectStale('gold-usd', 2);
    expectStale('silver-usd', 2);
    expectStale('btc-usd', 2);
    expectStale('copper-usd', 2);
    expectStale('eur-usd', 4);
    expectStale('us10y', undefined); // cadence grace applies
    // Obs-date-reality adjustments (the spec's numbers assumed release-date
    // aging — see definitions.ts notes): ABS quarter-start items get 215.
    expectStale('au-cpi', 215);
    expectStale('au-trimmed-mean', 215);
    expectStale('terms-of-trade', 215);
    expectStale('au-home-values', 215);
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
    expect(byId.get('us-cpi-yoy')!.rule).toEqual({ kind: 'threshold', direction: 'above', value: 3 });
    expect(byId.get('nfci')!.rule).toEqual({ kind: 'threshold', direction: 'above', value: 0 });
    expect(byId.get('china-pmi')!.rule).toEqual({ kind: 'threshold', direction: 'below', value: 50 });
    expect(byId.get('fed-target')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('ecb-dfr')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('dollar-basket')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('au-home-loan')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('au-rent-yoy')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('au-wage-growth')!.rule).toEqual({ kind: 'below-aux' });
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
