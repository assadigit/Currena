/**
 * state.test.ts — P4 gates (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md
 * §6): the narration-input contract, pinned by the three golden fixtures
 * (a stressed live day, a calm day, a day with excluded stale data) plus
 * shape-freeze assertions that fail if the contract changes unnoticed.
 *
 * The fixtures live in packages/insights/fixtures/narration/*.json —
 * {scenario, description, provenance, now, input, output} records. The
 * tests NEVER hit live sites (AGENTS.md rule 7): they re-derive the
 * output from the committed input and compare byte-semantics against the
 * committed output.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { InsightsSnapshot } from '@currena/core';
import { buildNarrationState, type NarrationSnapshot, type NarrationState } from './state';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../fixtures/narration');

interface FixtureFile {
  scenario: string;
  description: string;
  provenance: string;
  now: string;
  input: NarrationSnapshot;
  output: NarrationState;
}

function loadFixture(scenario: string): FixtureFile {
  return JSON.parse(readFileSync(resolve(FIXTURES_DIR, `${scenario}.json`), 'utf8')) as FixtureFile;
}

const SCENARIOS = ['stressed-live', 'calm', 'stale-excluded'] as const;

/* ------------------------------------------------------------------ *
 * The golden fixtures — the contract, pinned
 * ------------------------------------------------------------------ */

describe('P4 buildNarrationState — the golden fixtures', () => {
  for (const scenario of SCENARIOS) {
    it(`${scenario}: re-deriving the committed input reproduces the committed output exactly`, () => {
      const fixture = loadFixture(scenario);
      expect(buildNarrationState(fixture.input, fixture.now)).toEqual(fixture.output);
    });
  }

  it('the three scenarios really are three different stories', () => {
    const stressed = loadFixture('stressed-live').output;
    const calm = loadFixture('calm').output;
    const stale = loadFixture('stale-excluded').output;
    expect(stressed.alerts.length).toBe(16);
    expect(stressed.patterns).toEqual([{ id: 'r6_europe_worry', tier: 'warning', counted: true }]);
    expect(calm.alerts).toHaveLength(0);
    expect(calm.patterns).toHaveLength(0);
    expect(calm.verdict.global.label).toBe('relaxed');
    expect(calm.verdict.australia.label).toBe('relaxed');
    expect(stale.excluded.map((e) => [e.id, e.reason])).toEqual([
      ['au-10y', 'stale'],
      ['au-us-10y-gap', 'stale'],
      ['rba-expectations', 'stale'],
      ['wti', 'unavailable'],
    ]);
    expect(stale.alerts).toHaveLength(14); // the two AU warning voters left the electorate
    expect(stale.verdict.australia.excludedCount).toBe(3);
  });

  it('excluded items NEVER appear in the facts (the spec\'s core invariant)', () => {
    const { output } = loadFixture('stale-excluded');
    const itemIds = new Set(output.items.map((i) => i.id));
    for (const ex of output.excluded) {
      expect(itemIds.has(ex.id)).toBe(false);
      expect(output.alerts.some((a) => a.id === ex.id)).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------ *
 * The shape freeze — a contract change must fail a test
 * ------------------------------------------------------------------ */

describe('P4 buildNarrationState — the contract shape (frozen)', () => {
  const { output } = loadFixture('stressed-live');

  it('the top-level keys are exactly the documented eight', () => {
    expect(Object.keys(output).sort()).toEqual([
      'alerts',
      'dataAsOf',
      'excluded',
      'fxSignal',
      'generatedAt',
      'items',
      'patterns',
      'verdict',
    ]);
  });

  it('item keys are exactly the documented eight', () => {
    for (const item of output.items) {
      expect(Object.keys(item).sort()).toEqual([
        'ageHours',
        'asOf',
        'cadence',
        'id',
        'section',
        'status',
        'value',
        'voting',
      ]);
    }
  });

  it('alert keys are exactly the documented four; magnitude carries three', () => {
    for (const alert of output.alerts) {
      expect(Object.keys(alert).sort()).toEqual(['direction', 'id', 'magnitude', 'tier']);
      if (alert.magnitude !== null) {
        expect(Object.keys(alert.magnitude).sort()).toEqual(['unit', 'value', 'window']);
      }
    }
  });

  it('excluded keys are exactly the documented six; pattern keys the documented three', () => {
    const stale = loadFixture('stale-excluded').output;
    for (const ex of stale.excluded) {
      expect(Object.keys(ex).sort()).toEqual(['ageHours', 'asOf', 'cadence', 'id', 'reason', 'status']);
    }
    for (const p of loadFixture('stressed-live').output.patterns) {
      expect(Object.keys(p).sort()).toEqual(['counted', 'id', 'tier']);
    }
  });

  it('verdict carries the existing summary lines verbatim', () => {
    const { input, output } = loadFixture('stressed-live');
    expect(output.verdict.global).toEqual(input.insights.summary.global);
    expect(output.verdict.australia).toEqual(input.insights.summary.australia);
  });

  it('dataAsOf spans the FRESH items only', () => {
    const stale = loadFixture('stale-excluded').output;
    let oldest: string | null = null;
    let newest: string | null = null;
    for (const item of stale.items) {
      if (oldest === null || item.asOf < oldest) oldest = item.asOf;
      if (newest === null || item.asOf > newest) newest = item.asOf;
    }
    expect(stale.dataAsOf).toEqual({ oldest, newest });
    // the frozen AU data is NOT the page's data horizon
    expect(stale.dataAsOf.oldest).not.toBe('2026-08-14');
  });
});

/* ------------------------------------------------------------------ *
 * Unit behaviour
 * ------------------------------------------------------------------ */

describe('P4 buildNarrationState — unit behaviour', () => {
  it('alerts carry a plain magnitude (one rounded number + unit + window), never a dump', () => {
    const { output } = loadFixture('stressed-live');
    const withMagnitude = output.alerts.filter((a) => a.magnitude !== null);
    expect(withMagnitude.length).toBeGreaterThan(10);
    for (const alert of withMagnitude) {
      expect(alert.magnitude!.value).toBe(Math.round(alert.magnitude!.value * 100) / 100);
      expect(['points', 'percent']).toContain(alert.magnitude!.unit);
      expect(['30d', 'since-previous-release']).toContain(alert.magnitude!.window);
      expect(['rising', 'falling', 'flat']).toContain(alert.direction);
      expect(alert.tier).toBe('needs-attention');
    }
    // a monthly-series alert speaks "since the previous release"
    const auCpi = output.alerts.find((a) => a.id === 'au-cpi');
    expect(auCpi?.magnitude?.window).toBe('since-previous-release');
    // a daily-series alert speaks "30d"
    const us10y = output.alerts.find((a) => a.id === 'us10y');
    expect(us10y?.magnitude?.window).toBe('30d');
  });

  it('fx absent → patterns empty and fxSignal null (the honest minimum)', () => {
    const { input, now } = loadFixture('stressed-live');
    const { fx, ...withoutFx } = input;
    void fx;
    const state = buildNarrationState(withoutFx as NarrationSnapshot, now);
    expect(state.patterns).toEqual([]);
    expect(state.fxSignal).toBeNull();
    expect(state.alerts).toHaveLength(16); // the insights side is unaffected
  });

  it('voting marks exactly the gauge members', () => {
    const { output } = loadFixture('stressed-live');
    const voters = output.items.filter((i) => i.voting).map((i) => i.id);
    expect(voters).toHaveLength(48); // the electorate of record
    expect(voters).toContain('us10y');
    expect(voters).toContain('au-10y');
    expect(voters).not.toContain('gold-usd'); // context, never a voter
  });

  it('every reading lands in exactly one of items/excluded (partition)', () => {
    for (const scenario of SCENARIOS) {
      const { input, output } = loadFixture(scenario);
      const insights = input.insights as InsightsSnapshot;
      expect(output.items.length + output.excluded.length).toBe(insights.readings.length);
      const seen = new Set([...output.items.map((i) => i.id), ...output.excluded.map((e) => e.id)]);
      expect(seen.size).toBe(insights.readings.length);
    }
  });

  it('arrays are deterministically ordered (ids sorted — stable serialization)', () => {
    const { output } = loadFixture('stressed-live');
    const sorted = (xs: string[]): boolean => xs.every((x, i) => i === 0 || xs[i - 1]! <= x);
    expect(sorted(output.items.map((i) => i.id))).toBe(true);
    expect(sorted(output.alerts.map((a) => a.id))).toBe(true);
    expect(sorted(output.excluded.map((e) => e.id))).toBe(true);
    expect(sorted(output.patterns.map((p) => p.id))).toBe(true);
  });

  it('the AU trio is narrated as MONTHLY data with its own asOf (never as live daily prints)', () => {
    const { output } = loadFixture('stressed-live');
    const au10y = output.items.find((i) => i.id === 'au-10y');
    expect(au10y).toBeDefined();
    expect(au10y!.cadence).toBe('monthly'); // the refined, real served cadence (D-21)
    expect(au10y!.asOf).toBe('2026-09-30');
    expect(au10y!.ageHours).toBe(28 * 24 + 4); // now = generatedAt 04:20 → 28 days + 4h
  });
});
