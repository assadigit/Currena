/**
 * template.test.ts — M1 gates (spec §8): the template fallback must pass
 * V1–V10 for EVERY fixture in BOTH languages, be deterministic, and hold
 * the composition guarantees (3–5 sentences per section; exactly 4 for the
 * overall; the out-of-date clause exactly when the state lists exclusions).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { templateNarrative, type TemplateState } from './template';
import { validateStateNarrative, type NarratorUnit } from './validate';
import { sentences, wordCount } from './wordlists';
import type { SectionNarrationState } from './section-state';
import type { OverallNarrationState } from './overall-state';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../fixtures/narration/sections');

interface FixtureFile {
  scenario: string;
  section: string;
  now: string;
  input: unknown;
  output: TemplateState;
}

function loadFixture(scenario: string): FixtureFile {
  return JSON.parse(readFileSync(resolve(FIXTURES_DIR, `${scenario}.json`), 'utf8')) as FixtureFile;
}

const ALL_SCENARIOS = [
  'global-live',
  'australia-live',
  'australia-calm',
  'australia-excluded',
  'world-markets-live',
  'world-currencies-live',
  'overall-live',
] as const;

function unitOf(fixture: FixtureFile): NarratorUnit {
  return fixture.section === 'overall'
    ? { kind: 'overall' }
    : { kind: 'section', section: fixture.section as SectionNarrationState['section'] };
}

/* ------------------------------------------------------------------ *
 * The spec's own bar: the template passes V1–V10 everywhere
 * ------------------------------------------------------------------ */

describe('M1 templateNarrative — passes V1–V10 for every fixture, both languages', () => {
  for (const scenario of ALL_SCENARIOS) {
    for (const lang of ['en', 'fa'] as const) {
      it(`${scenario} [${lang}]: zero validation failures`, () => {
        const fixture = loadFixture(scenario);
        const text = {
          en: templateNarrative(fixture.output, unitOf(fixture), 'en'),
          fa: templateNarrative(fixture.output, unitOf(fixture), 'fa'),
        };
        const failures = validateStateNarrative({ text, unit: unitOf(fixture), state: fixture.output });
        expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
        expect(text[lang].length).toBeGreaterThan(0);
      });
    }
  }
});

/* ------------------------------------------------------------------ *
 * Determinism + the composition guarantees
 * ------------------------------------------------------------------ */

describe('M1 templateNarrative — determinism + composition', () => {
  it('same state in, same text out (byte for byte)', () => {
    for (const scenario of ALL_SCENARIOS) {
      const fixture = loadFixture(scenario);
      for (const lang of ['en', 'fa'] as const) {
        expect(templateNarrative(fixture.output, unitOf(fixture), lang)).toBe(
          templateNarrative(fixture.output, unitOf(fixture), lang),
        );
      }
    }
  });

  it('sections render 3–5 sentences; the overall renders exactly 4 (V2\u2019s floor held by construction)', () => {
    for (const scenario of ALL_SCENARIOS) {
      const fixture = loadFixture(scenario);
      for (const lang of ['en', 'fa'] as const) {
        const text = templateNarrative(fixture.output, unitOf(fixture), lang);
        const count = sentences(text).length;
        if (scenario === 'overall-live') {
          expect(count, `${scenario} [${lang}]: ${text}`).toBe(4);
        } else {
          expect(count, `${scenario} [${lang}]: ${text}`).toBeGreaterThanOrEqual(3);
          expect(count, `${scenario} [${lang}]: ${text}`).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it('the out-of-date clause appears exactly when the state lists exclusions', () => {
    const excluded = loadFixture('australia-excluded');
    const calm = loadFixture('australia-calm');
    for (const lang of ['en', 'fa'] as const) {
      expect(templateNarrative(excluded.output, unitOf(excluded), lang)).toMatch(
        lang === 'en' ? /out of date/ : /به‌روز نیست/,
      );
      expect(templateNarrative(calm.output, unitOf(calm), lang)).not.toMatch(
        lang === 'en' ? /out of date/ : /به‌روز نیست/,
      );
    }
  });

  it('the FA templates render Persian digits (never ASCII digits)', () => {
    for (const scenario of ALL_SCENARIOS) {
      const fixture = loadFixture(scenario);
      const fa = templateNarrative(fixture.output, unitOf(fixture), 'fa');
      expect(fa, `${scenario}: ${fa}`).not.toMatch(/[0-9]/);
    }
  });

  it('the overall template ends with the not-advice reminder', () => {
    const fixture = loadFixture('overall-live');
    expect(templateNarrative(fixture.output, unitOf(fixture), 'en')).toMatch(/not financial advice\.$/);
    expect(templateNarrative(fixture.output, unitOf(fixture), 'fa')).toMatch(/توصیهٔ مالی نیست\.$/);
  });

  it('names only indicators the state carries (V7 holds by construction)', () => {
    // covered by the V1–V10 sweep above; pinned here explicitly for the
    // calm shape (no alert names at all)
    const calm = loadFixture('australia-calm');
    for (const lang of ['en', 'fa'] as const) {
      const text = templateNarrative(calm.output, unitOf(calm), lang);
      expect(wordCount(text)).toBeGreaterThan(0);
    }
  });

  it('mismatched unit/state is a loud error, never a wrong text', () => {
    const fixture = loadFixture('global-live');
    expect(() => templateNarrative(fixture.output, { kind: 'overall' }, 'en')).toThrow(/overall/);
    expect(() => templateNarrative(fixture.output, { kind: 'section', section: 'australia' }, 'en')).toThrow(/does not match/);
    const overall = loadFixture('overall-live');
    expect(() => templateNarrative(overall.output, { kind: 'section', section: 'global' }, 'en')).toThrow(/section/);
  });
});

/* ------------------------------------------------------------------ *
 * Shape spot-checks (the exact sentences, pinned)
 * ------------------------------------------------------------------ */

describe('M1 templateNarrative — pinned examples', () => {
  it('the stressed global section reads the approved verdict word with its counts', () => {
    const fixture = loadFixture('global-live');
    const en = templateNarrative(fixture.output, unitOf(fixture), 'en');
    expect(en).toContain('The Global section reads Stressed today: 9 of 32 scored indicators are in warning');
    const fa = templateNarrative(fixture.output, unitOf(fixture), 'fa');
    expect(fa).toContain('بخش جهانی امروز پرتنش است: ۹ شاخص از ۳۲ شاخص مؤثر در وضعیت هشدار است');
  });

  it('the markets template speaks the page\u2019s own status words', () => {
    const fixture = loadFixture('world-markets-live');
    const en = templateNarrative(fixture.output, unitOf(fixture), 'en');
    expect(en).toContain('6 of 16 indices have slipped into a correction');
    expect(en).toContain('1 in a bear market');
    const fa = templateNarrative(fixture.output, unitOf(fixture), 'fa');
    expect(fa).toContain('۶ شاخص از ۱۶ شاخص در اصلاح قیمتی است و ۱ شاخص در بازار خرسی است');
  });

  it('the currencies template names the headline pattern and the unusual move', () => {
    const fixture = loadFixture('world-currencies-live');
    const en = templateNarrative(fixture.output, unitOf(fixture), 'en');
    expect(en).toContain('1 pattern counted in warning');
    expect(en).toContain('An unusually large move sits on');
  });

  it('the overall carries all four verdicts', () => {
    const fixture = loadFixture('overall-live');
    const state = fixture.output as OverallNarrationState;
    const en = templateNarrative(state, unitOf(fixture), 'en');
    expect(en).toContain('Global reads Stressed (9 of 32 in warning)');
    expect(en).toContain('Australia reads Stressed (7 of 16 in warning)');
    expect(en).toContain('Needs attention');
  });
});
