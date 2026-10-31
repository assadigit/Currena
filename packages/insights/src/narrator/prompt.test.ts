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
    expect(PROMPT_VERSION).toBe(9);
  });

  it('the base rules carry the spec\u2019s nine hard rules verbatim', () => {
    expect(BASE_RULES).toContain('You never see the internet.');
    expect(BASE_RULES).toContain('1. Use only facts in STATE.');
    expect(BASE_RULES).toContain('2. Describe a relationship between indicators only if it appears in VOCABULARY');
    expect(BASE_RULES).toContain('3. Never advise. Never say buy, sell, invest, should or must.');
    expect(BASE_RULES).toContain('4. Any verdict label in STATE is given.');
    expect(BASE_RULES).toContain('5. Use plain words and the plain names from VOCABULARY.');
    expect(BASE_RULES).toContain('6. Count the items in STATE.excluded.');
    expect(BASE_RULES).toContain('7. Short sentences, one idea each, at most 28 words per sentence');
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
      6. Count the items in STATE.excluded. If the array is empty, NEVER mention out-of-date data. If it is non-empty, include exactly ONE short clause saying some data is out of date and was left out — never state the values of excluded items. For monthly items, say "latest monthly reading".
      7. Short sentences, one idea each, at most 28 words per sentence. Never name an indicator that is not in STATE.
      8. Write the Farsi natively, as a clear Iranian finance explainer would for ordinary readers: spoken-formal register, correct half-spaces, no em dash, no double spaces. In the FARSI output use Persian digits (۰-۹) with the Persian decimal separator ٫ (write ۵٫۲۸, never 5.28 or ۵.۲۸), and no Latin letters except allowed symbols (VIX, S&P, ASX, Nikkei, Kospi, HSI, SSE, Taiex, Nifty, Stoxx, Dax, CAC, FTSE, Nasdaq, Dow, TSX, Bovespa, ECB, RBA, USD, AUD, EUR, JPY, CNY, BTC, PMI, GDP, CPI, NFP, HICP, CAPE, SOFR, WPI, DXY, EPU, GPR, NBS, EIA, CFTC, OECD, MOF, BOJ, BOE, FRED). In the ENGLISH output use ASCII digits with the ASCII decimal point (write 5.28, never ۵٫۲۸). The Farsi must say the same thing as the English, not mirror its sentences.
      9. Output only JSON matching {"en": string, "fa": string}. No markdown, no extra text."
    `);
  });

  it('the section task is pinned (spec §6.2 verbatim)', () => {
    expect(SECTION_TASK).toMatchInlineSnapshot(
      `
      "TASK: Explain what this one section shows today as ONE or TWO cohesive paragraphs (never a stitched list of indicator names). 3 to 9 sentences, at most 190 words per language.

      Open with the big picture of the section in everyday words (calm, mixed or under pressure, from the tier counts and any verdict label in STATE). Then weave in FIVE to SEVEN readings the section actually carries — draw from BOTH the alerts (warning-status readings, which carry value + delta + context) AND the items (every fresh reading, which carries value + cadence). For each reading: name its plainName from VOCABULARY, state its actual value from STATE, and weave its oneLine description from VOCABULARY into the prose. When a section has household-facing readings (home loans, rents, savings, deposit rates, inflation, jobs, wages, pay growth), prioritise those — they are what ordinary readers feel. When two or more related ids share the section and VOCABULARY carries a connection (ifRising, ifFalling, connections), draw that connection in the same paragraph — never invent a relationship VOCABULARY does not state. Write the readings into fluent sentences, not a list: "The mortgage rate people pay sits at 6.2 percent and Australian rent growth is 3.55 percent over the past year, so housing stays expensive. New term deposits pay 4.8 percent while Australian inflation is 4.34 percent, so savers barely keep up before tax."

      Use plain words and the plain names from VOCABULARY. Never advise, never predict, never add numbers, dates or causes that are not in STATE or VOCABULARY. Mention out-of-date data only when STATE.excluded is non-empty (one short clause). Weave the numbers into the prose — do not list them.

      When STATE carries a non-null "tic" block (foreign holdings of US government debt, GLOBAL only), weave ONE or TWO of its facts into the paragraph: the total (totalTn, trillion dollars), Japan's or China's six-month change (headline[].chg6mBn, billion dollars), or the largest 12-month net buyers/sellers (largestBuyers12m/largestSellers12m — these are TRANSACTIONS, real buying and selling, never just holdings changes). Name the data month exactly as STATE carries it (dataMonth). Keep the block's custodyNote honest: if you mention a custody-hub country (Belgium, Luxembourg, the Cayman Islands, Ireland, the UK, Switzerland, Bermuda), its holdings include much that belongs to investors elsewhere — holdings are recorded where securities are held, not who owns them. Never say WHY any country bought or sold — the reasons are not in STATE."
    `,
    );
  });

  it('the overall task is pinned (spec §6.3 verbatim)', () => {
    expect(OVERALL_TASK).toMatchInlineSnapshot(
      `
      "TASK: Write the overall summary of the whole page as ONE or TWO cohesive paragraphs (never a stitched list of verdicts or readings). 4 to 11 sentences, at most 240 words per language.

      Open by stating the page's verdicts in everyday words (each section's verdict label rides in STATE with its counts; e.g. "Global reads Stressed, with 9 of 32 scored indicators in warning"). Then weave a GLOBAL story that draws readings from ALL FOUR sections of the page — not just global macro + Australia. The STATE's alerts array carries every firing warning across sections, each tagged with its source section. You MUST mention at least one reading from EACH of: (a) global macro (yields, inflation, sentiment, recession odds), (b) Australia (household-facing: home loans, rents, savings, inflation, jobs, wages), (c) world markets (stock indices across regions — e.g. "Japan's biggest companies rose 0.5 percent while Hong Kong's fell 11 percent and South Korea's slipped 10 percent"), and (d) world currencies (e.g. "the euro slipped 2.5 percent against the franc"). This is a GLOBAL page — name readings from multiple regions (Japan, Hong Kong, South Korea, France, Brazil, the euro area, the US, Australia), not just the US and Australia.

      For each reading: use its plainName from VOCABULARY, state its actual value from STATE, and weave its oneLine description. DRAW CONNECTIONS between readings — when VOCABULARY states a connection (ifRising, ifFalling, connections), weave it into the prose: e.g. "With US 10-year yields falling, the Australia-US long-rate gap narrowed, pressuring the Australian dollar" or "East Asian markets fell while North American markets rose, and the euro weakened against the franc." Write fluent sentences that CONNECT the facts across regions and sections — never a list of separate readings each in their own sentence.

      End with one sentence reminding the reader this explains data and is not a recommendation. Never advise, never predict, never add numbers, dates or causes that are not in STATE or VOCABULARY. Mention out-of-date data only when STATE.excluded is non-empty (one short clause). Weave the verdicts and the numbers into the prose — do not list them."
    `,
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
