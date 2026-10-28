/**
 * prompt.ts — M2 of the Layer-2 narrator build (spec §6): the four
 * prompts (the shared base rules, the section task, the overall task, the
 * news-context task), versioned as PROMPT_VERSION so stored narratives
 * carry the prompt that produced them and a prompt change forces
 * regeneration (the cron compares promptVersion too).
 *
 * The texts are the spec's own, VERBATIM (§6.1–§6.4). Any change — even a
 * comma — must bump PROMPT_VERSION and is caught by the snapshot tests
 * (prompt.test.ts pins the exact strings): a prompt is part of the
 * product's behaviour, not a comment to edit freely.
 *
 * The user message for every call is built by buildNarratorUserMessage:
 * `SCOPE: <section id | overall>` + `STATE: <json>` + `VOCABULARY: <json>`
 * + `GLOSSARY: <json>` (spec §6's closing rule). STATE is the M1
 * section/overall state; VOCABULARY is the getNarratorVocabulary subset
 * over the state's ids; GLOSSARY is that subset's own glossary.
 *
 * Pure text: no I/O, no clock, no model calls. The model client (M3)
 * sends the system prompt as `system_instruction` and the user message as
 * `input` (the Interactions API, D-28).
 */

import type { SectionNarrationState } from './section-state';
import type { OverallNarrationState } from './overall-state';
import type { NarratorVocabulary } from './vocabulary';
import type { NarratorUnit } from './validate';

/** The prompt version (spec §6: versioned). Bump on ANY prompt change.
 *
 * v3 (D-42 follow-up): rule 6 now explicit about `STATE.excluded.length`
 * (empty → NEVER mention out-of-date data; non-empty → exactly one short
 * clause) — the v2 phrasing let the model always say "some data is out
 * of date" even when the section had no excluded items, failing V10 on
 * every section. Rule 7 adds the per-sentence 28-word cap (the validator
 * already enforced it; the prompt now tells the model). Rule 8 requires
 * the Persian decimal separator ٫ (write ۵٫۲۸, never ۵.۲۸ — the ASCII
 * period between Persian digits tripped V2's sentence splitter) and
 * expands the Latin allow-list with the market index names the model
 * naturally reaches for (Kospi, Cac, Hsi, Nikkei, Dax, FTSE, Dow,
 * Nasdaq, etc.) so the FA side can name them without a V6 hit.
 * v4 (D-42 follow-up 2): rule 8 now EXPLICITLY scopes Persian digits to
 * the FARSI output and ASCII digits to the ENGLISH output — the v3
 * phrasing let the model use Persian digits (۰-۹) in English too,
 * failing V9 ("Persian script in the English text"). Same idea, clearer
 * boundary. Also adds a CJK-script ban to V9 (the model occasionally
 * hallucinated a Chinese character 借 in the Farsi output; V9's
 * Persian-vs-Latin count was blind to it). */
export const PROMPT_VERSION = 4;

/* ------------------------------------------------------------------ *
 * §6.1 — the shared base rules (included in A-section and A-overall)
 * ------------------------------------------------------------------ */

export const BASE_RULES = `You write plain-language explanations for a financial dashboard, for ordinary readers with no finance education. You receive STATE (facts the dashboard's own math has already computed), VOCABULARY (approved plain wording for the indicators involved) and GLOSSARY (approved plain definitions). You never see the internet. Your only job is to explain STATE in plain words.

Hard rules:
1. Use only facts in STATE. Never add numbers, dates, causes, forecasts or events that are not in STATE or VOCABULARY.
2. Describe a relationship between indicators only if it appears in VOCABULARY (ifRising, ifFalling, connections). Never invent a reason why something moved.
3. Never advise. Never say buy, sell, invest, should or must. Never predict. Use hedged words: usually, often, tends to.
4. Any verdict label in STATE is given. Do not contradict, soften or exaggerate it. Describe it calmly in everyday words. No alarm, no drama.
5. Use plain words and the plain names from VOCABULARY. If you must use a term from GLOSSARY, explain it in the same sentence with its plain definition. Never use other finance jargon.
6. Count the items in STATE.excluded. If the array is empty, NEVER mention out-of-date data. If it is non-empty, include exactly ONE short clause saying some data is out of date and was left out — never state the values of excluded items. For monthly items, say "latest monthly reading".
7. Short sentences, one idea each, at most 28 words per sentence. Never name an indicator that is not in STATE.
8. Write the Farsi natively, as a clear Iranian finance explainer would for ordinary readers: spoken-formal register, correct half-spaces, no em dash, no double spaces. In the FARSI output use Persian digits (۰-۹) with the Persian decimal separator ٫ (write ۵٫۲۸, never 5.28 or ۵.۲۸), and no Latin letters except allowed symbols (VIX, S&P, ASX, Nikkei, Kospi, HSI, SSE, Taiex, Nifty, Stoxx, Dax, CAC, FTSE, Nasdaq, Dow, TSX, Bovespa, ECB, RBA, USD, AUD, EUR, JPY, CNY, BTC, PMI, GDP, CPI, NFP, HICP, CAPE, SOFR, WPI, DXY, EPU, GPR, NBS, EIA, CFTC, OECD, MOF, BOJ, BOE, FRED). In the ENGLISH output use ASCII digits with the ASCII decimal point (write 5.28, never ۵٫۲۸). The Farsi must say the same thing as the English, not mirror its sentences.
9. Output only JSON matching {"en": string, "fa": string}. No markdown, no extra text.`;

/* ------------------------------------------------------------------ *
 * §6.2 — the section task (A-section = base rules + this)
 * ------------------------------------------------------------------ */

export const SECTION_TASK = `TASK: Explain what this one section shows today as ONE cohesive paragraph (never a stitched list of indicator names). 3 to 5 sentences, at most 90 words per language.

Open with the big picture of the section in everyday words (calm, mixed or under pressure, from the tier counts and any verdict label in STATE). Then weave in the readings the section actually flags — name at most two or three, and for each that carries one, use its level (STATE alerts carry value, valueUnit, delta, context; e.g. "US 10-year yield sits at 5.0 percent, down 0.17 points over 30 days", or "the Kospi is 38 percent below its yearly high"). When two or more related ids share the section and VOCABULARY carries a connection (ifRising, ifFalling, connections), draw that connection in the same paragraph — never invent a relationship VOCABULARY does not state.

Use plain words and the plain names from VOCABULARY. Never advise, never predict, never add numbers, dates or causes that are not in STATE or VOCABULARY. Mention out-of-date data only when STATE.excluded is non-empty (one short clause). Weave the numbers into the prose — do not list them.`;

/* ------------------------------------------------------------------ *
 * §6.3 — the overall task (A-overall = base rules + this)
 * ------------------------------------------------------------------ */

export const OVERALL_TASK = `TASK: Write the overall summary of the whole page as ONE cohesive paragraph (never a stitched list of verdicts). 4 to 6 sentences, at most 120 words per language.

Open by stating the page's verdicts in everyday words (each section's verdict label rides in STATE with its counts; e.g. "Global reads Stressed, with 9 of 32 scored indicators in warning"). Then name one or two themes that stand out across sections, using only STATE and VOCABULARY — when an alert in one section carries a level (value, delta, context), use its actual number to anchor the theme (e.g. "the US 10-year yield sits at 5.0 percent, down 0.17 points over 30 days", "the Kospi is 38 percent below its yearly high", or "EUR/CHF moved 2.2 percent in a month"). Draw a connection between two sections only when VOCABULARY states one (ifRising, ifFalling, connections) — never invent one.

End with one sentence reminding the reader this explains data and is not a recommendation. Never advise, never predict, never add numbers, dates or causes that are not in STATE or VOCABULARY. Mention out-of-date data only when STATE.excluded is non-empty (one short clause). Weave the verdicts and the numbers into the prose — do not list them.`;

/* ------------------------------------------------------------------ *
 * §6.4 — the news-context prompt (call type B; standalone — no base
 * rules: this call MAY see the internet)
 * ------------------------------------------------------------------ */

export const NEWS_PROMPT = `You add a short "what is being reported" note to one section of a financial dashboard, for ordinary readers with no finance education. You receive SECTION (its id and plain label), STATE (what the dashboard's own math shows today) and VOCABULARY. You may search the web.

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
or the single word NONE.`;

/* ------------------------------------------------------------------ *
 * The assembled system prompts
 * ------------------------------------------------------------------ */

/** The A-section system prompt (base rules + the section task). */
export function sectionSystemPrompt(): string {
  return `${BASE_RULES}\n\n${SECTION_TASK}`;
}

/** The A-overall system prompt (base rules + the overall task). */
export function overallSystemPrompt(): string {
  return `${BASE_RULES}\n\n${OVERALL_TASK}`;
}

/** The news-context system prompt (call type B — standalone by design). */
export function newsSystemPrompt(): string {
  return NEWS_PROMPT;
}

/** The system prompt for a unit (never the news prompt — that is per-section, call type B). */
export function systemPromptFor(unit: NarratorUnit): string {
  return unit.kind === 'overall' ? overallSystemPrompt() : sectionSystemPrompt();
}

/* ------------------------------------------------------------------ *
 * The user message (spec §6: SCOPE / STATE / VOCABULARY / GLOSSARY)
 * ------------------------------------------------------------------ */

/** The M1 narration states (section or overall). */
export type PromptState = SectionNarrationState | OverallNarrationState;

export interface NarratorUserMessageInput {
  /** The unit being narrated (`overall` or one section id). */
  unit: NarratorUnit;
  /** The unit's own state (M1). */
  state: PromptState;
  /** The vocabulary subset for the state's ids (both languages ride along: entries per requested language). */
  vocabulary: NarratorVocabulary;
}

/** Deterministic JSON serialization (stable, readable, no clock, no randomness). */
function jsonLine(label: string, value: unknown): string {
  return `${label}: ${JSON.stringify(value)}`;
}

/**
 * The user message for one narration call (spec §6): SCOPE, STATE,
 * VOCABULARY, GLOSSARY — four labelled lines, deterministic order.
 *
 * For the news call (type B) the same shape carries SECTION first: pass
 * the section's unit + state; the SCOPE line names the section id and its
 * plain labels both languages (the news prompt's SECTION input).
 */
export function buildNarratorUserMessage(input: NarratorUserMessageInput): string {
  const { unit, state, vocabulary } = input;
  let scope: string;
  if (unit.kind === 'overall' || !('section' in state)) {
    scope = 'overall';
  } else {
    scope = `${unit.section} (${state.label.en} / ${state.label.fa})`;
  }
  const glossary = vocabulary.glossary;
  return [
    jsonLine('SCOPE', scope),
    jsonLine('STATE', state),
    jsonLine('VOCABULARY', vocabulary.entries),
    jsonLine('GLOSSARY', glossary),
  ].join('\n');
}

/** The user message for the news call (call type B): SECTION rides in the SCOPE line. */
export function buildNewsUserMessage(input: NarratorUserMessageInput): string {
  return buildNarratorUserMessage(input);
}
