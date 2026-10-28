/**
 * section-state.test.ts — M1 gates (spec §3): the section narration
 * contract, pinned by the golden fixtures under fixtures/narration/sections/
 * (live captures + the prep fixtures' constructed inputs), plus the
 * shape/invariant checks and the stateHash behaviour (spec §4) the
 * generation cycle relies on.
 *
 * The tests NEVER hit live sites (AGENTS.md rule 7): they re-derive the
 * output from the committed input and compare byte-semantics against the
 * committed output.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSectionNarrationState, stateHashOf, NARRATOR_SECTIONS, type SectionNarrationSnapshot, type SectionNarrationState } from './section-state';
import { buildOverallNarrationState, type OverallNarrationState } from './overall-state';
import { getNarratorSectionLabels } from './vocabulary';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../fixtures/narration/sections');

interface SectionFixtureFile {
  scenario: string;
  section: string;
  description: string;
  provenance: string;
  now: string;
  input: SectionNarrationSnapshot;
  output: SectionNarrationState;
}

function loadFixture(scenario: string): SectionFixtureFile {
  return JSON.parse(readFileSync(resolve(FIXTURES_DIR, `${scenario}.json`), 'utf8')) as SectionFixtureFile;
}

const SECTION_SCENARIOS = [
  'global-live',
  'australia-live',
  'australia-calm',
  'australia-excluded',
  'world-markets-live',
  'world-currencies-live',
] as const;

/* ------------------------------------------------------------------ *
 * The golden fixtures — the contract, pinned
 * ------------------------------------------------------------------ */

describe('M1 buildSectionNarrationState — the golden fixtures', () => {
  for (const scenario of SECTION_SCENARIOS) {
    it(`${scenario}: re-deriving the committed input reproduces the committed output exactly`, () => {
      const fixture = loadFixture(scenario);
      expect(buildSectionNarrationState(fixture.input, fixture.section as SectionNarrationState['section'], fixture.now)).toEqual(fixture.output);
    });
  }

  it('overall-live: re-deriving the committed input reproduces the committed output exactly', () => {
    const fixture = JSON.parse(readFileSync(resolve(FIXTURES_DIR, 'overall-live.json'), 'utf8'));
    expect(buildOverallNarrationState(fixture.input, fixture.now)).toEqual(fixture.output);
  });

  it('the scenarios really are different stories', () => {
    expect(loadFixture('global-live').output.alerts).toHaveLength(9);
    expect(loadFixture('australia-live').output.alerts).toHaveLength(7);
    expect(loadFixture('australia-calm').output.alerts).toHaveLength(0);
    expect(loadFixture('australia-excluded').output.excluded.map((e) => e.id)).toEqual([
      'au-10y',
      'au-us-10y-gap',
      'rba-expectations',
    ]);
    const markets = loadFixture('world-markets-live').output;
    expect(markets.tiers).toEqual({ normal: 9, correction: 6, bear: 1 });
    expect(markets.alerts[0]).toMatchObject({ id: 'kospi', tier: 'bear' });
    const currencies = loadFixture('world-currencies-live').output;
    expect(currencies.verdict?.label).toBe('attention');
    expect(currencies.patterns.map((p) => p.id)).toEqual(['r6_europe_worry']);
    expect(currencies.alerts.map((a) => a.id)).toEqual(['r6_europe_worry', 'eurchf']);
  });
});

/* ------------------------------------------------------------------ *
 * The invariants
 * ------------------------------------------------------------------ */

describe('M1 buildSectionNarrationState — invariants', () => {
  it('items + excluded partition the section\u2019s own readings (indicator sections)', () => {
    const global = loadFixture('global-live');
    const australia = loadFixture('australia-live');
    const globalIds = new Set(global.output.items.map((i) => i.id));
    const australiaIds = new Set(australia.output.items.map((i) => i.id));
    // no overlap between the two sections
    for (const id of globalIds) expect(australiaIds.has(id)).toBe(false);
    // the two sections together are the full fresh set of the stressed day (100)
    expect(globalIds.size + australiaIds.size).toBe(100);
  });

  it('every alert id is one of the section\u2019s items or (currencies) an active rule id \u2014 never excluded', () => {
    for (const scenario of SECTION_SCENARIOS) {
      const { output } = loadFixture(scenario);
      const ids = new Set(output.items.map((i) => i.id));
      const ruleIds = new Set(output.patterns.map((p) => p.id));
      for (const alert of output.alerts) {
        expect(ids.has(alert.id) || ruleIds.has(alert.id), `${scenario}: ${alert.id}`).toBe(true);
      }
    }
  });

  it('excluded items never appear in items, alerts or patterns', () => {
    for (const scenario of SECTION_SCENARIOS) {
      const { output } = loadFixture(scenario);
      const itemIds = new Set(output.items.map((i) => i.id));
      const alertIds = new Set(output.alerts.map((a) => a.id));
      for (const ex of output.excluded) {
        expect(itemIds.has(ex.id), `${scenario}: ${ex.id}`).toBe(false);
        expect(alertIds.has(ex.id), `${scenario}: ${ex.id}`).toBe(false);
      }
    }
  });

  it('arrays are deterministically ordered (id-sorted; markets/fx alerts tier-first)', () => {
    const sorted = (xs: string[]): boolean => xs.every((x, i) => i === 0 || xs[i - 1]! <= x);
    for (const scenario of SECTION_SCENARIOS) {
      const { output } = loadFixture(scenario);
      expect(sorted(output.excluded.map((e) => e.id)), scenario).toBe(true);
      if (output.section === 'world-currencies') {
        // the dollar measure rides FIRST as 'dollar-basket', then the pairs id-sorted
        expect(output.items[0]?.id).toBe('dollar-basket');
        expect(sorted(output.items.slice(1).map((i) => i.id)), scenario).toBe(true);
        // the warning rule leads the fx alerts, then the big movers
        expect(output.alerts[0]?.tier).toBe('needs-attention');
      } else {
        expect(sorted(output.items.map((i) => i.id)), scenario).toBe(true);
      }
      if (output.section === 'global' || output.section === 'australia') {
        expect(sorted(output.alerts.map((a) => a.id)), scenario).toBe(true);
      }
    }
    // markets: bear before correction, then id
    const markets = loadFixture('world-markets-live').output;
    if (markets.section === 'world-markets') {
      const tiers = markets.alerts.map((a) => a.tier);
      expect(tiers.lastIndexOf('bear')).toBeLessThan(tiers.indexOf('correction'));
    }
  });

  it('labels + verdict words come from the generated vocabulary snapshot (existing UI strings)', () => {
    const en = getNarratorSectionLabels('en');
    const fa = getNarratorSectionLabels('fa');
    for (const scenario of SECTION_SCENARIOS) {
      const { output } = loadFixture(scenario);
      expect(output.label.en).toBe(en.label[output.section]);
      expect(output.label.fa).toBe(fa.label[output.section]);
      if (output.verdict !== null) {
        expect([Object.values(en.verdictWord), Object.values(en.signalWord)].flat()).toContain(output.verdict.word.en);
        expect([Object.values(fa.verdictWord), Object.values(fa.signalWord)].flat()).toContain(output.verdict.word.fa);
      }
    }
  });

  it('verdicts are the documents\u2019 own computed values, verbatim', () => {
    const markets = loadFixture('world-markets-live');
    if (markets.output.section !== 'world-markets') throw new Error('unreachable');
    expect(markets.output.verdict?.label).toBe(markets.input.markets!.summary.signal);
    expect(markets.output.verdict?.counts).toEqual({
      count: markets.input.markets!.summary.count,
      roseToday: markets.input.markets!.summary.roseToday,
      nAttention: markets.input.markets!.summary.nAttention,
      nUnusual: markets.input.markets!.summary.nUnusual,
    });
    const currencies = loadFixture('world-currencies-live');
    if (currencies.output.section !== 'world-currencies') throw new Error('unreachable');
    expect(currencies.output.verdict?.label).toBe(currencies.input.fx!.summary.signal);
    expect(currencies.output.verdict?.headlineRule).toBe(currencies.input.fx!.summary.headlineRule);
    const global = loadFixture('global-live');
    if (global.output.section !== 'global') throw new Error('unreachable');
    expect(global.output.verdict?.label).toBe(global.input.insights.summary.global.label);
    expect(global.output.verdict?.counts).toEqual({
      warningCount: global.input.insights.summary.global.warningCount,
      votingCount: global.input.insights.summary.global.votingCount,
      excludedCount: global.input.insights.summary.global.excludedCount,
    });
  });

  it('the AU trio rides as monthly data with its own asOf (D-21 preserved through the slice)', () => {
    const { output } = loadFixture('australia-live');
    if (output.section !== 'australia') throw new Error('unreachable');
    const au10y = output.items.find((i) => i.id === 'au-10y');
    expect(au10y).toBeDefined();
    expect(au10y!.cadence).toBe('monthly');
    expect(au10y!.asOf).toBe('2026-09-30');
  });

  it('the dollar measure rides as the dollar-basket item (first, id-ordered after)', () => {
    const { output } = loadFixture('world-currencies-live');
    if (output.section !== 'world-currencies') throw new Error('unreachable');
    expect(output.items[0]?.id).toBe('dollar-basket');
    expect(output.items).toHaveLength(11); // 10 pairs + the dollar measure
  });

  it('a stale markets row lands in excluded, never in items (synthetic)', () => {
    const base = loadFixture('world-markets-live');
    const markets = JSON.parse(JSON.stringify(base.input.markets));
    markets.markets[0].stale = true;
    const state = buildSectionNarrationState({ ...base.input, markets }, 'world-markets', base.now);
    if (state.section !== 'world-markets') throw new Error('unreachable');
    expect(state.excluded.map((e) => e.id)).toContain(markets.markets[0].id);
    expect(state.items.map((i) => i.id)).not.toContain(markets.markets[0].id);
    expect((state.tiers['normal'] ?? 0) + (state.tiers['correction'] ?? 0) + (state.tiers['bear'] ?? 0)).toBe(15);
  });

  it('a missing feed throws a loud error for the section that needs it', () => {
    const { input } = loadFixture('global-live'); // insights only
    expect(() => buildSectionNarrationState(input, 'world-markets', '2026-10-28T00:00:00.000Z')).toThrow(/markets/);
    expect(() => buildSectionNarrationState(input, 'world-currencies', '2026-10-28T00:00:00.000Z')).toThrow(/fx/);
  });
});

/* ------------------------------------------------------------------ *
 * The overall state
 * ------------------------------------------------------------------ */

describe('M1 buildOverallNarrationState', () => {
  const overall = JSON.parse(readFileSync(resolve(FIXTURES_DIR, 'overall-live.json'), 'utf8')) as {
    now: string;
    input: SectionNarrationSnapshot;
    output: OverallNarrationState;
  };

  it('rolls up all four sections in page order with their verdicts + counts', () => {
    expect(overall.output.sections.map((s) => s.section)).toEqual([...NARRATOR_SECTIONS]);
    expect(overall.output.sections.every((s) => s.present)).toBe(true);
    const global = overall.output.sections[0]!;
    expect(global.verdict?.label).toBe('stressed');
    expect(global.verdict?.counts['votingCount']).toBe(32);
  });

  it('carries every alert across sections, each tagged with its section', () => {
    expect(overall.output.alerts).toHaveLength(25); // 9 global + 7 australia + 7 markets + 2 currencies
    const bySection = new Map<string, number>();
    for (const a of overall.output.alerts) bySection.set(a.section, (bySection.get(a.section) ?? 0) + 1);
    expect(Object.fromEntries(bySection)).toEqual({
      global: 9,
      australia: 7,
      'world-markets': 7,
      'world-currencies': 2,
    });
  });

  it('absent feeds roll up as present: false with their static labels intact', () => {
    const state = buildOverallNarrationState({ insights: overall.input.insights }, overall.now);
    const markets = state.sections.find((s) => s.section === 'world-markets')!;
    expect(markets.present).toBe(false);
    expect(markets.itemCount).toBe(0);
    expect(markets.label.en).toBe('The pulse of world markets');
    expect(markets.label.fa).toBe('نبض بازارهای جهان');
    expect(state.patterns).toEqual([]);
    // the insights-side rollups are unaffected
    expect(state.sections[0]!.alertCount).toBe(9);
  });

  it('the patterns are the currencies section\u2019s patterns (the AI never reads AI output)', () => {
    expect(overall.output.patterns.map((p) => p.id)).toEqual(['r6_europe_worry']);
  });
});

/* ------------------------------------------------------------------ *
 * The state hash (spec §4: "timestamps removed")
 * ------------------------------------------------------------------ */

describe('M1 stateHashOf', () => {
  it('is stable across runs with identical content', () => {
    const { output } = loadFixture('global-live');
    expect(stateHashOf(output)).toBe(stateHashOf(output));
  });

  it('ignores the run clock and the age hours (time passes, content unchanged)', () => {
    const { output } = loadFixture('global-live');
    const later = JSON.parse(JSON.stringify(output)) as SectionNarrationState;
    later.generatedAt = '2026-11-15T00:00:00.000Z';
    for (const item of later.items) item.ageHours += 24 * 18;
    expect(stateHashOf(later)).toBe(stateHashOf(output));
  });

  it('changes when content changes (a value, a status, a verdict, an exclusion)', () => {
    const base = loadFixture('global-live').output;
    const value = JSON.parse(JSON.stringify(base)) as SectionNarrationState;
    if (value.section === 'global' || value.section === 'australia') value.items[0]!.value = (value.items[0]!.value ?? 0) + 0.5;
    expect(stateHashOf(value)).not.toBe(stateHashOf(base));

    const status = JSON.parse(JSON.stringify(base)) as SectionNarrationState;
    if (status.section === 'global' || status.section === 'australia') status.items[1]!.status = 'normal';
    expect(stateHashOf(status)).not.toBe(stateHashOf(base));

    const exclusion = JSON.parse(JSON.stringify(base)) as SectionNarrationState;
    exclusion.excluded.push({ id: 'wti', reason: 'unavailable', section: exclusion.section, asOf: null, ageHours: null });
    expect(stateHashOf(exclusion)).not.toBe(stateHashOf(base));
  });

  it('different sections hash differently', () => {
    expect(stateHashOf(loadFixture('global-live').output)).not.toBe(stateHashOf(loadFixture('australia-live').output));
    expect(stateHashOf(loadFixture('world-markets-live').output)).not.toBe(stateHashOf(loadFixture('world-currencies-live').output));
  });
});
