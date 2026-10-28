/**
 * prompt.test.ts — M2 gates (spec §6): the prompt texts are PINNED. A
 * prompt is product behaviour: any change — even punctuation — must be a
 * deliberate act that bumps PROMPT_VERSION and updates these snapshots.
 * The user-message builder is pinned too: the four labelled lines, the
 * SCOPE naming, the JSON round-trip, determinism.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASE_RULES,
  NEWS_PROMPT,
  OVERALL_TASK,
  PROMPT_VERSION,
  SECTION_TASK,
  buildNarratorUserMessage,
  newsSystemPrompt,
  overallSystemPrompt,
  sectionSystemPrompt,
  systemPromptFor,
  type PromptState,
} from './prompt';
import { getNarratorVocabulary } from './vocabulary';
import { stateIdsOf } from './validate';
import type { NarratorUnit } from './validate';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../fixtures/narration/sections');

function loadState(scenario: string): { unit: NarratorUnit; state: PromptState } {
  const fixture = JSON.parse(readFileSync(resolve(FIXTURES_DIR, `${scenario}.json`), 'utf8'));
  const unit: NarratorUnit =
    fixture.section === 'overall' ? { kind: 'overall' } : { kind: 'section', section: fixture.section };
  return { unit, state: fixture.output };
}

/* ------------------------------------------------------------------ *
 * The pinned texts (drift = failure)
 * ------------------------------------------------------------------ */

describe('M2 prompt — the pinned texts', () => {
  it('PROMPT_VERSION is a positive integer (bump on ANY prompt change)', () => {
    expect(PROMPT_VERSION).toBe(1);
  });

  it('the base rules carry the spec\u2019s nine hard rules verbatim', () => {
    expect(BASE_RULES).toContain('You never see the internet.');
    expect(BASE_RULES).toContain('1. Use only facts in STATE.');
    expect(BASE_RULES).toContain('2. Describe a relationship between indicators only if it appears in VOCABULARY');
    expect(BASE_RULES).toContain('3. Never advise. Never say buy, sell, invest, should or must.');
    expect(BASE_RULES).toContain('4. Any verdict label in STATE is given.');
    expect(BASE_RULES).toContain('5. Use plain words and the plain names from VOCABULARY.');
    expect(BASE_RULES).toContain('6. If STATE lists excluded items, say once, in one short clause');
    expect(BASE_RULES).toContain('7. Short sentences, one idea each.');
    expect(BASE_RULES).toContain('8. Write the Farsi natively');
    expect(BASE_RULES).toContain('9. Output only JSON matching {"en": string, "fa": string}.');
    // the full pinned text (spec §6.1 verbatim)
    expect(BASE_RULES).toMatchInlineSnapshot(`
      "You write plain-language explanations for a financial dashboard, for ordinary readers with no finance education. You receive STATE (facts the dashboard's own math has already computed), VOCABULARY (approved plain wording for the indicators involved) and GLOSSARY (approved plain definitions). You never see the internet. Your only job is to explain STATE in plain words.

      Hard rules:
      1. Use only facts in STATE. Never add numbers, dates, causes, forecasts or events that are not in STATE or VOCABULARY.
      2. Describe a relationship between indicators only if it appears in VOCABULARY (ifRising, ifFalling, connections). Never invent a reason why something moved.
      3. Never advise. Never say buy, sell, invest, should or must. Never predict. Use hedged words: usually, often, tends to.
      4. Any verdict label in STATE is given. Do not contradict, soften or exaggerate it. Describe it calmly in everyday words. No alarm, no drama.
      5. Use plain words and the plain names from VOCABULARY. If you must use a term from GLOSSARY, explain it in the same sentence with its plain definition. Never use other finance jargon.
      6. If STATE lists excluded items, say once, in one short clause, that some data is out of date and left out. Never state values of excluded items. For monthly items, say "latest monthly reading".
      7. Short sentences, one idea each. Never name an indicator that is not in STATE.
      8. Write the Farsi natively, as a clear Iranian finance explainer would for ordinary readers: spoken-formal register, Persian digits, correct half-spaces, no Latin letters except allowed symbols (VIX, S&P, ASX, ECB, RBA, USD, AUD, EUR, JPY, CNY, BTC, PMI). It must say the same thing as the English, not mirror its sentences.
      9. Output only JSON matching {"en": string, "fa": string}. No markdown, no extra text."
    `);
  });

  it('the section task is pinned (spec §6.2 verbatim)', () => {
    expect(SECTION_TASK).toMatchInlineSnapshot(
      `"TASK: Explain what this one section shows today. 3 to 5 sentences, at most 90 words per language. Start with the big picture of the section (calm, mixed or under pressure, according to the tier counts and any verdict label in STATE), then name at most the two most important readings and what each usually means for everyday life, using VOCABULARY."`,
    );
  });

  it('the overall task is pinned (spec §6.3 verbatim)', () => {
    expect(OVERALL_TASK).toMatchInlineSnapshot(
      `"TASK: Write the overall summary of the whole page. 4 to 6 sentences, at most 120 words per language. State the overall verdict(s) given in STATE in everyday words, then the one or two themes that stand out across sections, using only STATE and VOCABULARY. End with one sentence reminding the reader this explains data and is not a recommendation."`,
    );
  });

  it('the news prompt is pinned (spec §6.4 verbatim) and carries NONE + the EN:/FA: block', () => {
    expect(NEWS_PROMPT).toContain('You may search the web.');
    expect(NEWS_PROMPT).toContain('output exactly NONE');
    expect(NEWS_PROMPT).toContain('EN: <text>');
    expect(NEWS_PROMPT).toContain('FA: <text>');
    expect(NEWS_PROMPT).toContain('No numbers or digits at all.');
    expect(NEWS_PROMPT).toMatchInlineSnapshot(`
      "You add a short "what is being reported" note to one section of a financial dashboard, for ordinary readers with no finance education. You receive SECTION (its id and plain label), STATE (what the dashboard's own math shows today) and VOCABULARY. You may search the web.

      Rules:
      1. Use only recent reports (this week). If you find nothing relevant and recent, output exactly NONE.
      2. Report what reputable news and official sources are saying about the topics in this section, in your own words. Never quote. Never copy sentences. Never name individual people.
      3. Attribute everything: use phrases like "reports suggest", "analysts commonly point to", "news coverage this week focuses on". Never state anything as certain.
      4. No numbers or digits at all. No predictions. No advice. Never say buy, sell, invest, should or must.
      5. Do not contradict STATE, and do not explain STATE; add context only. Stay on the section's topics.
      6. Plain words only; if you use a finance term, explain it in the same sentence. Maximum 2 short sentences, at most 45 words per language.
      7. Write the Farsi natively (spoken-formal, Persian letters and digits, correct half-spaces). It must carry the same meaning as the English.
      8. Output exactly:
      EN: <text>
      FA: <text>
      or the single word NONE."
    `);
  });

  it('the assembled prompts compose base + task; the news prompt stands alone', () => {
    expect(sectionSystemPrompt()).toBe(`${BASE_RULES}\n\n${SECTION_TASK}`);
    expect(overallSystemPrompt()).toBe(`${BASE_RULES}\n\n${OVERALL_TASK}`);
    expect(newsSystemPrompt()).toBe(NEWS_PROMPT);
    expect(newsSystemPrompt()).not.toContain('Output only JSON');
  });

  it('systemPromptFor routes by unit', () => {
    expect(systemPromptFor({ kind: 'overall' })).toBe(overallSystemPrompt());
    expect(systemPromptFor({ kind: 'section', section: 'global' })).toBe(sectionSystemPrompt());
  });
});

/* ------------------------------------------------------------------ *
 * The user message
 * ------------------------------------------------------------------ */

describe('M2 prompt — the user message', () => {
  it('carries the four labelled lines in order (SCOPE, STATE, VOCABULARY, GLOSSARY)', () => {
    const { unit, state } = loadState('global-live');
    const message = buildNarratorUserMessage({ unit, state, vocabulary: vocabFor(state) });
    const lines = message.split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toMatch(/^SCOPE: "global \(Global \/ جهانی\)"$/);
    expect(lines[1]).toMatch(/^STATE: \{/);
    expect(lines[2]).toMatch(/^VOCABULARY: \{/);
    expect(lines[3]).toMatch(/^GLOSSARY: \{/);
  });

  it('the SCOPE line for the overall unit is exactly "overall"', () => {
    const { unit, state } = loadState('overall-live');
    const message = buildNarratorUserMessage({ unit, state, vocabulary: vocabFor(state) });
    expect(message.split('\n')[0]).toBe('SCOPE: "overall"');
  });

  it('STATE round-trips as JSON and equals the state (byte-semantics)', () => {
    const { unit, state } = loadState('world-currencies-live');
    const message = buildNarratorUserMessage({ unit, state, vocabulary: vocabFor(state) });
    const stateLine = message.split('\n')[1]!;
    const parsed = JSON.parse(stateLine.slice('STATE: '.length));
    expect(parsed).toEqual(state);
  });

  it('VOCABULARY carries only the state\u2019s ids; GLOSSARY only their terms', () => {
    const { unit, state } = loadState('australia-excluded');
    const vocabulary = vocabFor(state);
    const message = buildNarratorUserMessage({ unit, state, vocabulary });
    const vocabLine = message.split('\n')[2]!;
    const parsed = JSON.parse(vocabLine.slice('VOCABULARY: '.length));
    expect(Object.keys(parsed).sort()).toEqual(vocabulary.ids.slice().sort());
    const glossaryLine = message.split('\n')[3]!;
    const glossary = JSON.parse(glossaryLine.slice('GLOSSARY: '.length));
    expect(Object.keys(glossary).sort()).toEqual(Object.keys(vocabulary.glossary).sort());
  });

  it('is deterministic (same inputs, same bytes)', () => {
    const { unit, state } = loadState('global-live');
    const a = buildNarratorUserMessage({ unit, state, vocabulary: vocabFor(state) });
    const b = buildNarratorUserMessage({ unit, state, vocabulary: vocabFor(state) });
    expect(a).toBe(b);
  });

  it('never contains a model key, a URL or a timestamp beyond the state\u2019s own', () => {
    const { unit, state } = loadState('global-live');
    const message = buildNarratorUserMessage({ unit, state, vocabulary: vocabFor(state) });
    expect(message).not.toMatch(/AIza[0-9A-Za-z_-]{35}/);
    expect(message).not.toMatch(/https?:\/\//);
  });
});

/** The vocabulary subset for a state's ids (the validators' own derivation). */
function vocabFor(state: PromptState): ReturnType<typeof getNarratorVocabulary> {
  return getNarratorVocabulary(stateIdsOf(state), 'en');
}
