/**
 * validate.test.ts — M1 gates (spec §7): every check V1–V11 and W1–W10
 * rejects its deliberately bad fixture and accepts its good one. The good
 * baselines are the template outputs (already pinned by template.test.ts);
 * the bad ones are hand-mutated to trip exactly one intended check.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { templateNarrative, type TemplateState } from './template';
import { narrativeLimitsFor, validateNewsNote, validateStateNarrative, type NarratorUnit } from './validate';
import { getNarratorVocabulary } from './vocabulary';
import type { SectionNarrationState } from './section-state';

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

function unitOf(fixture: FixtureFile): NarratorUnit {
  return fixture.section === 'overall'
    ? { kind: 'overall' }
    : { kind: 'section', section: fixture.section as SectionNarrationState['section'] };
}

/** The good baseline (the template) for a fixture + language. */
function baseline(fixture: FixtureFile): { en: string; fa: string } {
  return {
    en: templateNarrative(fixture.output, unitOf(fixture), 'en'),
    fa: templateNarrative(fixture.output, unitOf(fixture), 'fa'),
  };
}

const globalLive = loadFixture('global-live');
const globalUnit = unitOf(globalLive);
const excludedFx = loadFixture('australia-excluded');
const excludedUnit = unitOf(excludedFx);

const calmFx = loadFixture('australia-calm');
const calmUnit = unitOf(calmFx);

const currenciesFx = loadFixture('world-currencies-live');
/** Mutate one language of the baseline; validate; return the failure checks. */
function checksFor(fixture: FixtureFile, unit: NarratorUnit, mutate: (baselineText: { en: string; fa: string }) => { en: string; fa: string }): string[] {
  const text = mutate(baseline(fixture));
  // The baseline IS the template (deterministic, names a fixed set of alerts);
  // V11 (AI-completeness) is exempt for the template — pass skipCoverage.
  return validateStateNarrative({ text, unit, state: fixture.output, skipCoverage: true }).map((f) => f.check);
}

/* ------------------------------------------------------------------ *
 * The good baselines pass (re-pinned here for the validator's own sake)
 * ------------------------------------------------------------------ */

describe('M1 validateStateNarrative — the good baselines pass', () => {
  for (const scenario of ['global-live', 'australia-live', 'australia-calm', 'australia-excluded', 'world-markets-live', 'world-currencies-live', 'overall-live'] as const) {
    it(`${scenario}: the template output passes with zero failures`, () => {
      const fixture = loadFixture(scenario);
      const failures = validateStateNarrative({ text: baseline(fixture), unit: unitOf(fixture), state: fixture.output, skipCoverage: true });
      expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    });
  }
});

/* ------------------------------------------------------------------ *
 * V1–V11 — each bad fixture trips its intended check
 * ------------------------------------------------------------------ */

describe('M1 validateStateNarrative — the deliberately bad fixtures', () => {
  it('V1: an empty language fails', () => {
    const checks = checksFor(globalLive, globalUnit, (b) => ({ ...b, fa: '   ' }));
    expect(checks).toContain('V1');
  });

  it('V2: too few sentences fails', () => {
    const checks = checksFor(globalLive, globalUnit, () => ({
      en: 'One sentence only.',
      fa: 'فقط یک جمله است.',
    }));
    expect(checks).toContain('V2');
  });

  it('V2: a sentence over 35 words fails', () => {
    const long = 'This is a very long sentence that keeps going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going.';
    const checks = checksFor(globalLive, globalUnit, (b) => ({ ...b, en: long }));
    expect(checks).toContain('V2');
  });

  it('V3: an invented number fails (EN digits + FA Persian digits)', () => {
    const checks = checksFor(globalLive, globalUnit, (b) => ({
      en: `${b.en} The move was 77.7 points.`,
      fa: `${b.fa} این حرکت ۷۷٫۷ واحد بود.`,
    }));
    expect(checks).toContain('V3');
    // and a state number in Persian digits passes (77.7 replaced by a real count)
    const ok = validateStateNarrative({
      text: {
        en: baseline(globalLive).en,
        fa: `${baseline(globalLive).fa} امروز ۹ شاخص هشدار دارند.`,
      },
      unit: globalUnit,
      state: globalLive.output,
      skipCoverage: true,
    });
    expect(ok.map((f) => f.check)).not.toContain('V3');
  });

  it('V4: an advice word fails (EN "should"/"buy" + FA)', () => {
    const en = checksFor(globalLive, globalUnit, (b) => ({ ...b, en: `${b.en} You should buy gold now.` }));
    expect(en).toContain('V4');
    const fa = checksFor(globalLive, globalUnit, (b) => ({ ...b, fa: `${b.fa} حتماً طلا بخرید.` }));
    expect(fa).toContain('V4');
  });

  it('V5: jargon with no glossary term fails; the state\u2019s own status words pass', () => {
    const bad = checksFor(globalLive, globalUnit, (b) => ({ ...b, en: `${b.en} Momentum is building.` }));
    expect(bad).toContain('V5');
    // the markets status words ("a correction", "bear market") are the
    // state's own: the markets template passes (pinned in template.test.ts)
    const markets = loadFixture('world-markets-live');
    const marketsChecks = validateStateNarrative({
      text: baseline(markets),
      unit: unitOf(markets),
      state: markets.output,
    }).map((f) => f.check);
    expect(marketsChecks).not.toContain('V5');
  });

  it('V6: Farsi hygiene — ASCII digits, Arabic ي, em dash, stray Latin, double spaces each fail', () => {
    expect(checksFor(globalLive, globalUnit, (b) => ({ ...b, fa: `${b.fa} عدد 5 اینجا است.` }))).toContain('V6');
    expect(checksFor(globalLive, globalUnit, (b) => ({ ...b, fa: `${b.fa} این كلمه عربی است.` }))).toContain('V6');
    expect(checksFor(globalLive, globalUnit, (b) => ({ ...b, fa: `${b.fa} یک جمله — با خط تیره.` }))).toContain('V6');
    expect(checksFor(globalLive, globalUnit, (b) => ({ ...b, fa: `${b.fa} این hello است.` }))).toContain('V6');
    expect(checksFor(globalLive, globalUnit, (b) => ({ ...b, fa: `${b.fa} اینجا  فاصله دوبار است.` }))).toContain('V6');
  });

  it('V7: naming an indicator that is not in this unit\u2019s state fails', () => {
    // cftc-gold-positioning ("The gold crowd gauge") is a GLOBAL-section
    // reading; it is not in the AUSTRALIA state
    const au = loadFixture('australia-live');
    const checks = checksFor(au, unitOf(au), (b) => ({
      en: `${b.en} Also watch The gold crowd gauge.`,
      fa: b.fa,
    }));
    expect(checks).toContain('V7');
    // and naming one that IS in the state passes (the template does, pinned)
  });

  it('V8: a fired section rejects all-clear language; a calm section rejects alarm language', () => {
    const fired = checksFor(globalLive, globalUnit, (b) => ({ ...b, en: `${b.en} Everything is fine and completely calm.` }));
    expect(fired).toContain('V8');
    const calm = checksFor(calmFx, calmUnit, (b) => ({ ...b, en: `${b.en} This looks like a panic and a crisis.` }));
    expect(calm).toContain('V8');
    // the fired template's own words pass (pinned in the baseline sweep)
  });

  it('V9: Persian script in the English text fails; Latin-only Farsi fails', () => {
    expect(checksFor(globalLive, globalUnit, (b) => ({ ...b, en: `${b.en} بخش جهانی است.` }))).toContain('V9');
    expect(checksFor(globalLive, globalUnit, (b) => ({ ...b, fa: 'The section is stressed today and several indicators are in warning.' }))).toContain('V9');
  });

  it('V10: exclusions require the out-of-date clause; no exclusions forbid it', () => {
    const missing = checksFor(excludedFx, excludedUnit, (b) => ({
      en: b.en.replace('Some data is out of date and has been left out.', ''),
      fa: b.fa.replace('برخی داده‌ها به‌روز نیست و کنار گذاشته شده‌اند.', ''),
    }));
    expect(missing).toContain('V10');
    const invented = checksFor(calmFx, calmUnit, (b) => ({
      en: `${b.en} Some data is out of date and has been left out.`,
      fa: `${b.fa} برخی داده‌ها به‌روز نیست و کنار گذاشته شده‌اند.`,
    }));
    expect(invented).toContain('V10');
  });

  it('V11: an AI output that mentions too few of the section\u2019s alerts fails; one that mentions enough passes', () => {
    // global-live has multiple alerts; a text that names only ONE of them
    // (the first alert's plainName) trips V11 (need ≥min(3, alerts.length)).
    const firstAlert = globalLive.output.alerts[0]!;
    const firstEntry = getNarratorVocabulary([firstAlert.id], 'en').entries[firstAlert.id]!;
    const tooFew = {
      en: `${firstEntry.plainName} is in warning today. The section is stressed. Some context applies. This is not advice.`,
      fa: 'بخش جهانی امروز پرتنش است. هیچ مورد خاصی برجسته نیست. این توصیه‌ای نیست.',
    };
    const tooFewChecks = validateStateNarrative({ text: tooFew, unit: globalUnit, state: globalLive.output }).map((f) => f.check);
    expect(tooFewChecks).toContain('V11');
    // skipCoverage=true exempts the template; V11 does not fire on the same text.
    const exempt = validateStateNarrative({ text: tooFew, unit: globalUnit, state: globalLive.output, skipCoverage: true }).map((f) => f.check);
    expect(exempt).not.toContain('V11');
  });

  it('the overall limits differ from the section limits (4\u201311 vs 3\u20139; 240 vs 190 words)', () => {
    expect(narrativeLimitsFor({ kind: 'overall' })).toEqual({ minSentences: 4, maxSentences: 11, maxWords: 240, maxSentenceWords: 35 });
    expect(narrativeLimitsFor({ kind: 'section', section: 'global' })).toEqual({ minSentences: 3, maxSentences: 9, maxWords: 190, maxSentenceWords: 35 });
  });
});

/* ------------------------------------------------------------------ *
 * W1–W10 — the news-note checks
 * ------------------------------------------------------------------ */

const GOOD_NEWS = {
  en: 'News coverage this week focuses on the euro and the Swiss franc, reports suggest.',
  fa: 'به گزارش خبرهای این هفته، یورو و فرانک سوئیس در کانون توجه بوده است.',
};
const GOOD_SOURCES = [{ title: 'Markets wrap', url: 'https://example.com/markets-wrap' }];

function newsChecks(text: { en: string; fa: string }, sources: typeof GOOD_SOURCES = GOOD_SOURCES): string[] {
  return validateNewsNote({
    text,
    section: 'world-currencies',
    state: currenciesFx.output as SectionNarrationState,
    sources,
  }).map((f) => f.check);
}

describe('M1 validateNewsNote — the good baseline passes, each bad fixture trips its check', () => {
  it('the good note passes with zero failures', () => {
    expect(newsChecks(GOOD_NEWS), 'the good news note').toEqual([]);
  });

  it('W1: no grounding source fails', () => {
    expect(newsChecks(GOOD_NEWS, [])).toContain('W1');
    expect(newsChecks(GOOD_NEWS, [{ title: '', url: '' }])).toContain('W1');
  });

  it('W2: any digit fails (EN + FA)', () => {
    expect(newsChecks({ ...GOOD_NEWS, en: `${GOOD_NEWS.en} The euro moved 2%.` })).toContain('W2');
    expect(newsChecks({ ...GOOD_NEWS, fa: `${GOOD_NEWS.fa} یورو ۲ درصد جابه‌جا شد.` })).toContain('W2');
  });

  it('W3: prediction words fail (Layer-1 list + the narrator extension)', () => {
    expect(newsChecks({ ...GOOD_NEWS, en: `${GOOD_NEWS.en} The euro will rise.` })).toContain('W3');
    expect(newsChecks({ ...GOOD_NEWS, fa: `${GOOD_NEWS.fa} یورو بالا خواهد رفت.` })).toContain('W3');
  });

  it('W4: no attribution phrase fails', () => {
    expect(newsChecks({ en: 'The euro and the franc are moving this week.', fa: 'یورو و فرانک سوئیس این هفته در حال حرکت است.' })).toContain('W4');
  });

  it('W5: jargon without the glossary fails', () => {
    expect(newsChecks({ ...GOOD_NEWS, en: `${GOOD_NEWS.en} Momentum is building.` })).toContain('W5');
  });

  it('W6: Farsi hygiene fails on em dash', () => {
    expect(newsChecks({ ...GOOD_NEWS, fa: `${GOOD_NEWS.fa} یک جمله — دیگر.` })).toContain('W6');
  });

  it('W7: three sentences fail; over 45 words fail', () => {
    expect(newsChecks({ ...GOOD_NEWS, en: 'One. Two reports suggest the euro. Three.' })).toContain('W7');
    // 2 + 44 + 5 = 51 words — over the 45-word cap
    const long45 = `Reports suggest ${'very '.repeat(44)}strong euro interest this week.`;
    expect(newsChecks({ ...GOOD_NEWS, en: long45 })).toContain('W7');
  });

  it('W8: quotation marks fail; tone words contradicting the section fail', () => {
    expect(newsChecks({ ...GOOD_NEWS, en: `${GOOD_NEWS.en} One report said "the euro is sliding".` })).toContain('W8');
    expect(newsChecks({ ...GOOD_NEWS, en: `${GOOD_NEWS.en} Everything is completely calm.` })).toContain('W8');
  });

  it('W9: language check fails for Latin-only Farsi', () => {
    expect(newsChecks({ ...GOOD_NEWS, fa: 'The euro is in the news this week, reports suggest.' })).toContain('W9');
  });

  it('W10: a note about nothing from this section\u2019s topics fails', () => {
    expect(newsChecks({ en: 'Reports suggest the weather was pleasant this week.', fa: 'به گزارش خبرها، هوا این هفته خوب بوده است.' })).toContain('W10');
  });
});
