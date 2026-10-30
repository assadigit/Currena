/**
 * validate.ts — M1 of the Layer-2 narrator build (spec §7): the
 * deterministic validation every narrative must pass before it is stored,
 * and every news note must pass before it is shown. Pure, unit-tested.
 *
 *   validateStateNarrative — V1..V11 (a failed check = one regeneration
 *                            attempt with the failed check names appended;
 *                            a second failure = the template for that unit)
 *   validateNewsNote       — W1..W10 (any failure = part 3 omitted for that
 *                            section; no retry)
 *
 * Word lists come from wordlists.ts (the Layer-1 canon shared with
 * layer1.test.ts, plus the narrator's own seed lists). The vocabulary
 * subset is derived from the unit's own state — the model only meets items
 * it was told about, and the validators hold it to exactly those.
 *
 * Pure: no I/O, no clock, no model calls. Failing texts are reported with
 * check ids + details, never thrown.
 */

import {
  VOCABULARY_IDS,
  getNarratorVocabulary,
  type NarratorVocabulary,
} from './vocabulary';
import {
  alarmList,
  allClearList,
  attributionList,
  bannedHits,
  faLatinViolations,
  normalizeDigits,
  outOfDateList,
  phraseHits,
  predictionList,
  sentences,
  wordCount,
  words,
  ARABIC_KAF,
  ARABIC_YEH,
  ASCII_DIGIT,
  DOUBLE_SPACE,
  EM_DASH,
  JARGON,
  type JargonSpec,
} from './wordlists';
import type { NarratorSectionId, SectionNarrationState } from './section-state';
import type { OverallNarrationState } from './overall-state';

/* ------------------------------------------------------------------ *
 * The units + limits
 * ------------------------------------------------------------------ */

/** What is being narrated: one section, or the whole page. */
export type NarratorUnit =
  | { kind: 'section'; section: NarratorSectionId }
  | { kind: 'overall' };

/** The per-prompt length limits (PROMPT_VERSION 5: 3–9 sentences ≤ 190 words for sections; 4–11 ≤ 240 for overall; 35 words per sentence). */
export interface StateNarrativeLimits {
  minSentences: number;
  maxSentences: number;
  maxWords: number;
  maxSentenceWords: number;
}

export const SECTION_LIMITS: StateNarrativeLimits = { minSentences: 3, maxSentences: 9, maxWords: 190, maxSentenceWords: 35 };
export const OVERALL_LIMITS: StateNarrativeLimits = { minSentences: 4, maxSentences: 11, maxWords: 240, maxSentenceWords: 35 };

export function narrativeLimitsFor(unit: NarratorUnit): StateNarrativeLimits {
  return unit.kind === 'overall' ? OVERALL_LIMITS : SECTION_LIMITS;
}

/** One failed check (check id + where + why). */
export interface NarratorValidationFailure {
  check: string;
  lang: 'en' | 'fa' | 'both';
  detail: string;
}

/* ------------------------------------------------------------------ *
 * The state ids + vocabulary subset a unit may speak about
 * ------------------------------------------------------------------ */

type AnyState = SectionNarrationState | OverallNarrationState;

/** Every id the unit's state carries (items, alerts, patterns, excluded). Exported: the prompt builder + tests share the one derivation. */
export function stateIdsOf(state: AnyState): string[] {
  const ids = new Set<string>();
  const walk = (value: unknown, key: string): void => {
    if (value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const v of value) walk(v, key);
      return;
    }
    const obj = value as Record<string, unknown>;
    if (typeof obj['id'] === 'string' && (key === 'items' || key === 'alerts' || key === 'patterns' || key === 'excluded')) {
      ids.add(obj['id']);
    }
    for (const k of Object.keys(obj)) walk(obj[k], k);
  };
  walk(state, 'root');
  return [...ids].sort();
}

function vocabularyOf(state: AnyState): { en: NarratorVocabulary; fa: NarratorVocabulary; ids: string[] } {
  const ids = stateIdsOf(state);
  return { en: getNarratorVocabulary(ids, 'en'), fa: getNarratorVocabulary(ids, 'fa'), ids };
}

/* ------------------------------------------------------------------ *
 * V3 — the allowed numbers, derived from the unit's own state
 * ------------------------------------------------------------------ */

/** Collect every number the state carries, with the roundings + signs a plain sentence may use. */
function allowedNumbersOf(state: AnyState, vocab: { en: NarratorVocabulary; fa: NarratorVocabulary }): Set<number> {
  const allowed = new Set<number>();
  const add = (n: number): void => {
    if (!Number.isFinite(n)) return;
    for (const v of [n, Math.round(n), Math.round(n * 10) / 10, Math.round(n * 100) / 100]) {
      allowed.add(v);
      allowed.add(-v);
      allowed.add(Math.abs(v));
    }
  };
  // The walk is RECURSIVE and field-name agnostic — it picks up every number
  // anywhere in the state, including the PROMPT_VERSION-2 enrichments on
  // SectionAlert (`value`, `valueUnit` carries no number, `delta.value`,
  // `context.fromHigh`, `context.chg3m`) and every number on the items
  // themselves. The VOCABULARY walk below adds the model-provided text's
  // own numbers (tenor tokens etc.). The Persian/Arabic decimal-separator
  // normalization for the OUTPUT side lives in `numberTokensOf` (V3's
  // consumer): "۴٫۳" → 4.3 there, and 4.3 (with its roundings) is here.
  const walk = (value: unknown, key: string): void => {
    if (typeof value === 'number') {
      add(value);
      // ages may be spoken in days
      if (key === 'ageHours' && Number.isFinite(value)) {
        add(Math.floor(value / 24));
        add(Math.round(value / 24));
      }
      return;
    }
    if (typeof value === 'string') {
      // the PROVIDED VOCABULARY's own numbers (tenor names inside plainName /
      // oneLine, e.g. "10-year") — the model was given that text verbatim,
      // so restating it is never an invented number
      for (const t of numberTokensOf(value)) add(t);
      return;
    }
    if (value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const v of value) walk(v, key);
      return;
    }
    const obj = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) walk(v, k);
    return;
  };
  walk(state, 'root');
  walk(vocab.en, 'root');
  walk(vocab.fa, 'root');
  // calendar numbers of every date the state carries (a date IS in the state)
  const dateRe = /(\d{4})-(\d{2})-(\d{2})/g;
  const serialized = JSON.stringify(state);
  for (const m of serialized.matchAll(dateRe)) {
    for (const part of m.slice(1)) add(Number(part));
  }
  return allowed;
}

/** The number tokens a text carries (Persian/Arabic digits normalised, the Persian/Arabic decimal separator U+066B treated as '.', thousands unseparated). */
function numberTokensOf(text: string): number[] {
  const normalized = normalizeDigits(text)
    // PROMPT_VERSION 2 (D-42): the Persian/Arabic decimal separator (U+066B
    // ٫) MUST be normalised to the ASCII dot — otherwise "۴٫۳" parses as
    // two separate numbers (4 and 3) and a correct model output ("۴٫۳ درصد")
    // fails V3 because 4 and 3 alone are not both in the allowed set. The
    // owner's "much much much weaker than my worst imagination" complaint
    // traces partly to this: every decimal in the FA model output tripped V3
    // and the template fell back in its place.
    .replace(/\u066B/g, '.')
    .replace(/(\d),(\d{3})\b/g, '$1$2');
  const out: number[] = [];
  for (const m of normalized.matchAll(/\d+(?:[.]\d+)?/g)) {
    const n = Number(m[0]);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * V7 — invented drivers (names from the FULL vocabulary not in this state)
 * ------------------------------------------------------------------ */

const FULL_NAMES: { id: string; en: string; fa: string }[] = VOCABULARY_IDS.map((id) => {
  const en = getNarratorVocabulary([id], 'en').entries[id];
  const fa = getNarratorVocabulary([id], 'fa').entries[id];
  return { id, en: en?.plainName ?? '', fa: fa?.plainName ?? '' };
});

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Does a name appear in a text? Latin: word-boundary, case-insensitive; Persian: substring. */
function nameInText(name: string, text: string): boolean {
  if (name.length < 2) return false;
  if (/[\u0600-\u06FF]/.test(name)) return text.includes(name);
  const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
  return re.test(text);
}

function inventedNamesIn(text: string, stateIds: ReadonlySet<string>): string[] {
  const hits: string[] = [];
  for (const { id, en, fa } of FULL_NAMES) {
    if (stateIds.has(id)) continue;
    if ((en !== '' && nameInText(en, text)) || (fa !== '' && nameInText(fa, text))) {
      hits.push(id);
    }
  }
  return hits;
}

/* ------------------------------------------------------------------ *
 * V5 — jargon must be covered by the unit's provided glossary
 *
 * Exemption: a jargon phrase that appears VERBATIM in the unit's own
 * STATE (its approved words — verdict words, status words, tier names)
 * may be restated. The page's own labels for its own computed statuses
 * ("Correction", "Bear market") are facts, not invented jargon; the
 * Layer-1 copy itself stays jargon-clean (G3), so the vocabulary subset's
 * glossary covers every term its own text uses.
 * ------------------------------------------------------------------ */

function jargonViolations(text: string, lang: 'en' | 'fa', glossary: ReadonlySet<string>, stateSerialized: string): string[] {
  const violations: string[] = [];
  for (const j of JARGON as JargonSpec) {
    const phrase = lang === 'fa' ? j.fa : j.en;
    if (!phrase) continue;
    const found = lang === 'fa' ? text.includes(phrase) : new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i').test(text);
    if (!found) continue;
    // the state's own words may be restated (see the block comment)
    const inState = lang === 'fa' ? stateSerialized.includes(phrase) : stateSerialized.toLowerCase().includes(phrase.toLowerCase());
    if (inState) continue;
    if (j.termId === null) {
      violations.push(j.en);
    } else if (!glossary.has(j.termId)) {
      violations.push(`${j.en} (term "${j.termId}" not in the provided glossary)`);
    }
  }
  return violations;
}

/* ------------------------------------------------------------------ *
 * V8 / W8 — tone consistency
 * ------------------------------------------------------------------ */

type Tone = 'calm' | 'middle' | 'fired';

const VERDICT_TONE: Record<string, Tone> = {
  relaxed: 'calm',
  cautious: 'middle',
  stressed: 'fired',
  alarmed: 'fired',
  normal: 'calm',
  attention: 'middle',
  unusual: 'fired',
};

function toneOf(state: AnyState): Tone {
  const tones: Tone[] = [];
  if ('section' in state) {
    const verdict = state.verdict;
    if (verdict !== null && verdict.label in VERDICT_TONE) tones.push(VERDICT_TONE[verdict.label]!);
    else tones.push(state.alerts.length > 0 ? 'fired' : 'calm');
  } else {
    for (const entry of state.sections) {
      if (!entry.present || entry.verdict === null) continue;
      if (entry.verdict.label in VERDICT_TONE) tones.push(VERDICT_TONE[entry.verdict.label]!);
    }
    if (tones.length === 0) tones.push(state.alerts.length > 0 ? 'fired' : 'calm');
  }
  const rank = (t: Tone): number => (t === 'fired' ? 2 : t === 'middle' ? 1 : 0);
  return tones.reduce((worst, t) => (rank(t) > rank(worst) ? t : worst), 'calm');
}

function toneViolations(text: string, lang: 'en' | 'fa', tone: Tone): string[] {
  if (tone === 'fired') return phraseHits(text, allClearList(lang), lang);
  if (tone === 'calm') return phraseHits(text, alarmList(lang), lang);
  // middle: both extremes contradict a cautious/attention reading
  return [...phraseHits(text, alarmList(lang), lang), ...phraseHits(text, allClearList(lang), lang)];
}

/* ------------------------------------------------------------------ *
 * V9 / W9 — language check
 * ------------------------------------------------------------------ */

const PERSIAN_LETTER = /[\u0600-\u06FF]/g;
const LATIN_LETTER = /[A-Za-z]/g;
// CJK + Hiragana/Katakana + Hangul — the Workers AI model occasionally
// hallucinates a Chinese character (e.g. 借 for "قرض"/borrow) in the Farsi
// output. V9's Persian-vs-Latin count is blind to it (Chinese is neither),
// so a broken Farsi text like "هزینه ی 借ری ۱۰ ساله" passed V9. This ban
// catches any CJK/Hangul/kana code-point in either language's text.
const CJK_SCRIPT = /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u3400-\u4DBF]/g;

function languageViolations(text: string, lang: 'en' | 'fa'): string | null {
  const cjk = text.match(CJK_SCRIPT) ?? [];
  if (cjk.length > 0) {
    return `CJK characters in the ${lang === 'fa' ? 'Farsi' : 'English'} text (${cjk.length}: ${cjk.slice(0, 5).join(' ')})`;
  }
  const persian = (text.match(PERSIAN_LETTER) ?? []).length;
  const latin = (text.match(LATIN_LETTER) ?? []).length;
  if (lang === 'en') {
    return persian > 0 ? `Persian script in the English text (${persian} letters)` : null;
  }
  if (text.trim().length === 0) return 'empty';
  return persian <= latin ? `not mostly Persian script (persian=${persian}, latin=${latin})` : null;
}

/* ------------------------------------------------------------------ *
 * V10 — the out-of-date clause
 * ------------------------------------------------------------------ */

function outOfDateViolations(text: string, lang: 'en' | 'fa', mustMention: boolean): string | null {
  const present = phraseHits(text, outOfDateList(lang), lang).length > 0;
  if (mustMention && !present) return 'the state lists excluded items but the text never says some data is out of date';
  if (!mustMention && present) return 'the state lists no excluded items but the text claims data is out of date';
  return null;
}

/* ------------------------------------------------------------------ *
 * The sanitizer (PROMPT_VERSION 5) — fixes common model errors before
 * validation so the rich multi-reading AI output passes V1–V11 reliably.
 * The model (temperature 0.2) non-deterministically:
 *   - adds "Some data is out of date and was left out" even when
 *     STATE.excluded is empty (V10 false positive), AND
 *   - occasionally hallucinates a CJK character in the Farsi output
 *     (V9 fail — the CJK ban added in PROMPT_VERSION 4 catches it, but
 *     the retry ladder then falls back to the template, losing the rich
 *     AI paragraph the model actually wrote).
 * The sanitizer strips the spurious out-of-date SENTENCE (when excluded
 * is empty) and removes stray CJK characters (when present), then returns
 * the cleaned text. Pure; never adds content; never runs when the state
 * lists excluded items (the out-of-date clause is REQUIRED then).
 * ------------------------------------------------------------------ */

const CJK_SCRIPT_STRIP = /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u3400-\u4DBF]/g;

/** Strip stray CJK characters from a text (replace with empty, collapse runs of spaces). */
function stripCjk(text: string): string {
  if (!CJK_SCRIPT_STRIP.test(text)) return text;
  CJK_SCRIPT_STRIP.lastIndex = 0;
  return text.replace(CJK_SCRIPT_STRIP, '').replace(/\s{2,}/g, ' ').trim();
}

/** Strip any sentence containing an out-of-date phrase (EN + FA). */
function stripOutOfDateSentences(text: string, lang: 'en' | 'fa'): string {
  const phrases = outOfDateList(lang);
  const hits = phraseHits(text, phrases, lang);
  if (hits.length === 0) return text;
  // Split into sentences; drop any sentence containing an out-of-date phrase.
  // sentences() consumes the terminators (. ! ? ۔ ؟), so re-add a period when
  // joining — otherwise the next sentences() call sees one run-on sentence
  // and V2 fails ("1 sentences").
  const sents = sentences(text);
  const kept = sents.filter((s) => {
    const lower = lang === 'fa' ? s : s.toLowerCase();
    return !phrases.some((p) => (lang === 'fa' ? lower.includes(p) : lower.includes(p.toLowerCase())));
  });
  if (kept.length === 0) return text; // never strip to empty
  return kept.map((s) => {
    const t = s.trim();
    return /[.!?۔؟]$/.test(t) ? t : `${t}.`;
  }).join(' ');
}

/**
 * Sanitize the model's narrative output before validation (PROMPT_VERSION 5).
 *   - When `state.excluded` is empty: strip any sentence claiming data is
 *     out of date (the model non-deterministically adds it; V10 would fail).
 *   - Always: strip stray CJK characters from both languages (the model
 *     occasionally hallucinates 借/仍/따 etc. in Farsi; V9 would fail).
 * Pure; never adds content; the sanitizer only REMOVES the model's mistakes.
 * When `state.excluded` is non-empty, the out-of-date clause is REQUIRED
 * (V10 enforces it) so the sanitizer leaves it alone.
 */
export function sanitizeStateNarrative(
  text: { en: string; fa: string },
  state: AnyState,
): { en: string; fa: string } {
  const excludedEmpty = state.excluded.length === 0;
  const en = excludedEmpty ? stripOutOfDateSentences(text.en, 'en') : text.en;
  const fa = excludedEmpty ? stripOutOfDateSentences(text.fa, 'fa') : text.fa;
  return { en: stripCjk(en), fa: stripCjk(fa) };
}

/* ------------------------------------------------------------------ *
 * The shared per-language checks (V2/V4/V5/V6/V7/V8/V9)
 * ------------------------------------------------------------------ */

/** The roundings of a number a plain sentence may use (matches allowedNumbersOf's `add`). */
function valueRoundings(n: number): number[] {
  const out: number[] = [];
  for (const v of [n, Math.round(n), Math.round(n * 10) / 10, Math.round(n * 100) / 100]) {
    out.push(v, -v, Math.abs(v));
  }
  return out;
}

interface LangCheckContext {
  limits: StateNarrativeLimits;
  vocab: NarratorVocabulary;
  stateIds: ReadonlySet<string>;
  stateSerialized: string;
  tone: Tone;
  excludedNonEmpty: boolean;
  /** V11 — the ids of the unit's alerts (warning readings); the AI must mention enough of them by plainName or value. */
  alertIds: readonly string[];
  /** V11 — the alerts keyed by id (to look up each alert's value for the value-mention check). */
  alertsById: ReadonlyMap<string, { value: number | null }>;
  /** V11 — the unit kind ('overall' has a higher coverage threshold). */
  unitKind: NarratorUnit['kind'];
  /** V11 — when true (the template fallback), skip the coverage check. */
  skipCoverage: boolean;
}

function langChecks(text: string, lang: 'en' | 'fa', ctx: LangCheckContext): NarratorValidationFailure[] {
  const failures: NarratorValidationFailure[] = [];
  const add = (check: string, detail: string): void => {
    failures.push({ check, lang, detail });
  };

  // V2 — length limits per prompt; no sentence over the word cap
  const sents = sentences(text);
  const wc = wordCount(text);
  if (sents.length < ctx.limits.minSentences || sents.length > ctx.limits.maxSentences) {
    add('V2', `${sents.length} sentences (limit ${ctx.limits.minSentences}\u2013${ctx.limits.maxSentences})`);
  }
  if (wc > ctx.limits.maxWords) add('V2', `${wc} words (limit ${ctx.limits.maxWords})`);
  const longSentence = sents.find((s) => wordCount(s) > ctx.limits.maxSentenceWords);
  if (longSentence !== undefined) {
    add('V2', `a sentence over ${ctx.limits.maxSentenceWords} words: "${longSentence.slice(0, 60)}"`);
  }

  // V4 — banned advice/certainty words
  const banned = bannedHits(text, lang);
  if (banned.length > 0) add('V4', `banned words: ${banned.join(', ')}`);

  // V5 — jargon only with the provided glossary (or the state's own words)
  const glossary = new Set(Object.keys(ctx.vocab.glossary));
  const jargon = jargonViolations(text, lang, glossary, ctx.stateSerialized);
  if (jargon.length > 0) add('V5', `jargon without the provided glossary: ${jargon.join('; ')}`);

  // V6 — Farsi hygiene (fa side only)
  if (lang === 'fa') {
    if (ASCII_DIGIT.test(text)) add('V6', 'ASCII digits in the Farsi text (Persian digits only)');
    if (ARABIC_YEH.test(text) || ARABIC_KAF.test(text)) add('V6', 'Arabic ي/ك in the Farsi text (Persian ی/ک only)');
    if (EM_DASH.test(text)) add('V6', 'em dash in the Farsi text');
    if (DOUBLE_SPACE.test(text)) add('V6', 'double space in the Farsi text');
    const latin = faLatinViolations(text);
    if (latin.length > 0) add('V6', `Latin outside the allow-list: ${latin.join(', ')}`);
  }

  // V7 — invented drivers (names not in this unit's state)
  const invented = inventedNamesIn(text, ctx.stateIds);
  if (invented.length > 0) add('V7', `names indicators not in this state: ${invented.join(', ')}`);

  // V8 — tone consistency
  const tone = toneViolations(text, lang, ctx.tone);
  if (tone.length > 0) add('V8', `tone contradicts the verdict (tone=${ctx.tone}): ${tone.join(', ')}`);

  // V9 — language check
  const language = languageViolations(text, lang);
  if (language !== null) add('V9', language);

  // V10 — the out-of-date clause
  const exclusion = outOfDateViolations(text, lang, ctx.excludedNonEmpty);
  if (exclusion !== null) add('V10', exclusion);

  // V11 — coverage: the AI must mention enough of the unit's flagged readings
  // (the alerts) — by EITHER their plainName OR their actual value. V7 checks
  // the AI didn't INVENT names; V11 checks the AI DID name the readings the
  // section actually flags. This closes the gap the owner identified: the v4
  // model could pass V1–V10 while mentioning only 1 reading + "Australia is
  // also Stressed" (no Australian facts). V11 forces consolidation — mention
  // ≥min(3, alerts.length) of the alerts (≥5 for the overall), or fail + retry.
  //
  // The match is name-OR-value: the model often paraphrases the plainName
  // (e.g. "US 10-year yield" instead of the exact "US 10-year borrowing cost")
  // but ALWAYS mentions the reading's value (5.05, 4.34, 6.2). Counting a
  // mention when EITHER the plainName OR the value appears keeps V11 robust
  // against paraphrase while still enforcing that the reading's FACT landed.
  // ctx.vocab is already the per-language subset (EN entries for 'en', FA
  // entries for 'fa'), so entry.plainName is the right name to match.
  // The template fallback (skipCoverage=true) is exempt — it names a FIXED
  // set of alerts by design; V11 is the AI-completeness check.
  if (!ctx.skipCoverage && ctx.alertIds.length > 0) {
    const threshold = Math.min(ctx.unitKind === 'overall' ? 5 : 3, ctx.alertIds.length);
    const tokens = new Set(numberTokensOf(text));
    const mentioned: string[] = [];
    const missed: string[] = [];
    for (const id of ctx.alertIds) {
      const entry = ctx.vocab.entries[id];
      const name = entry?.plainName ?? '';
      const alert = ctx.alertsById.get(id);
      const value = alert?.value ?? null;
      const nameHit = name.length >= 2 && nameInText(name, text);
      const valueHit = value !== null && Number.isFinite(value) && valueRoundings(value).some((r) => tokens.has(r));
      if (nameHit || valueHit) {
        mentioned.push(id);
      } else {
        missed.push(name || id);
      }
    }
    if (mentioned.length < threshold) {
      add('V11', `only ${mentioned.length} of ${ctx.alertIds.length} flagged readings mentioned (need ${threshold}); missed: ${missed.slice(0, 6).join(', ')}`);
    }
  }

  return failures;
}

/* ------------------------------------------------------------------ *
 * validateStateNarrative — V1..V11
 * ------------------------------------------------------------------ */

export interface StateNarrativeInput {
  text: { en: string; fa: string };
  unit: NarratorUnit;
  state: AnyState;
  /** V11 (coverage) is the AI-completeness check — the AI must mention enough of
   * the unit's alerts by plainName. The deterministic template fallback names
   * a FIXED set of alerts by design (it's the safe fallback, not a consolidation);
   * pass `true` here to skip V11 for the template (the template.test.ts bar is
   * V1–V10 + the V11 exemption). AI output (the narrator-cron generateUnit path)
   * leaves this unset so V11 runs. */
  skipCoverage?: boolean;
}

/**
 * Validate one state narrative (spec §7). Pure; returns every failed check
 * (empty = the narrative passes V1–V11 and may be stored).
 */
export function validateStateNarrative(input: StateNarrativeInput): NarratorValidationFailure[] {
  const { text, unit, state, skipCoverage = false } = input;
  const failures: NarratorValidationFailure[] = [];

  // V1 — schema valid, both languages non-empty
  const en = typeof text.en === 'string' ? text.en.trim() : '';
  const fa = typeof text.fa === 'string' ? text.fa.trim() : '';
  if (en === '' || fa === '') {
    failures.push({ check: 'V1', lang: 'both', detail: 'both languages must be non-empty' });
    return failures;
  }

  const limits = narrativeLimitsFor(unit);
  const vocab = vocabularyOf(state);
  const stateIds = new Set(vocab.ids);
  const stateSerialized = JSON.stringify(state);
  const alertIds = state.alerts.map((a) => a.id);
  const alertsById = new Map<string, { value: number | null }>(state.alerts.map((a) => [a.id, { value: a.value }]));
  const ctx: LangCheckContext = {
    limits,
    vocab: vocab.en, // the glossary is language-paired; checked per language below
    stateIds,
    stateSerialized,
    tone: toneOf(state),
    excludedNonEmpty: state.excluded.length > 0,
    alertIds,
    alertsById,
    unitKind: unit.kind,
    skipCoverage,
  };

  // V3 — every number must come from this unit's state or its provided vocabulary
  const allowed = allowedNumbersOf(state, vocab);
  for (const [lang, t] of [['en', en], ['fa', fa]] as const) {
    const bad = numberTokensOf(t).filter((n) => !allowed.has(n));
    if (bad.length > 0) {
      failures.push({ check: 'V3', lang, detail: `numbers not in the state: ${bad.join(', ')}` });
    }
  }

  // V2/V4..V10 per language (the glossary check reads the language's own subset)
  const enCtx: LangCheckContext = { ...ctx, vocab: vocab.en };
  const faCtx: LangCheckContext = { ...ctx, vocab: vocab.fa };
  failures.push(...langChecks(en, 'en', enCtx));
  failures.push(...langChecks(fa, 'fa', faCtx));

  return failures;
}

/* ------------------------------------------------------------------ *
 * validateNewsNote — W1..W10
 * ------------------------------------------------------------------ */

export interface NewsNoteInput {
  text: { en: string; fa: string };
  section: NarratorSectionId;
  /** The section's own state (tone + the ids its topics come from). */
  state: SectionNarrationState;
  /** The grounding sources that came back with the response (title + url). */
  sources: ReadonlyArray<{ title: string; url: string }>;
}

/** The quotation marks the no-quoting rule (W8) bans. */
const QUOTE_CHARS = ['"', '\u201C', '\u201D', '\u2018', '\u2019', '\u00AB', '\u00BB'];

/**
 * Validate one news note (spec §7). Pure; ANY failure means part 3 is
 * simply omitted for that section (no retry, per the spec).
 */
export function validateNewsNote(input: NewsNoteInput): NarratorValidationFailure[] {
  const { text, state, sources } = input;
  const failures: NarratorValidationFailure[] = [];
  const add = (check: string, lang: 'en' | 'fa' | 'both', detail: string): void => {
    failures.push({ check, lang, detail });
  };

  const en = typeof text.en === 'string' ? text.en.trim() : '';
  const fa = typeof text.fa === 'string' ? text.fa.trim() : '';

  // W1 — at least one grounding source (url + title) came back
  const good = sources.filter((s) => s.title.trim() !== '' && s.url.trim() !== '');
  if (good.length === 0) {
    add('W1', 'both', 'no grounding source (title + url) came back with the response');
  }

  if (en === '' || fa === '') {
    add('W1', 'both', 'both languages must be non-empty');
    return failures;
  }

  const vocab = vocabularyOf(state);
  const stateIds = new Set(vocab.ids);
  const stateSerialized = JSON.stringify(state);
  const tone = toneOf(state);

  for (const [lang, t] of [['en', en], ['fa', fa]] as const) {
    // W2 — no digits at all
    const digitRuns = t.match(/[0-9\u06F0-\u06F9\u0660-\u0669]+/g);
    if (digitRuns !== null && digitRuns.length > 0) {
      add('W2', lang, `digits in the news text: ${digitRuns.join(', ')}`);
    }

    // W3 — no advice, certainty or prediction words
    const banned = [...bannedHits(t, lang), ...phraseHits(t, predictionList(lang), lang)];
    if (banned.length > 0) add('W3', lang, `advice/certainty/prediction words: ${banned.join(', ')}`);

    // W4 — an attribution phrase is present
    if (phraseHits(t, attributionList(lang), lang).length === 0) {
      add('W4', lang, 'no attribution phrase (e.g. "reports suggest")');
    }

    // W5 — jargon as V5 (the section's provided glossary; state words exempt)
    const glossary = new Set(Object.keys(vocab[lang].glossary));
    const jargon = jargonViolations(t, lang, glossary, stateSerialized);
    if (jargon.length > 0) add('W5', lang, `jargon without the provided glossary: ${jargon.join('; ')}`);

    // W6 — Farsi hygiene as V6 (fa side only)
    if (lang === 'fa') {
      if (ASCII_DIGIT.test(t)) add('W6', lang, 'ASCII digits in the Farsi text');
      if (ARABIC_YEH.test(t) || ARABIC_KAF.test(t)) add('W6', lang, 'Arabic ي/ك in the Farsi text');
      if (EM_DASH.test(t)) add('W6', lang, 'em dash in the Farsi text');
      if (DOUBLE_SPACE.test(t)) add('W6', lang, 'double space in the Farsi text');
      const latin = faLatinViolations(t);
      if (latin.length > 0) add('W6', lang, `Latin outside the allow-list: ${latin.join(', ')}`);
    }

    // W7 — at most 2 sentences and 45 words
    const sents = sentences(t);
    if (sents.length > 2) add('W7', lang, `${sents.length} sentences (limit 2)`);
    if (wordCount(t) > 45) add('W7', lang, `${wordCount(t)} words (limit 45)`);

    // W8 — no quotation marks; no tone words contradicting the section tone
    const quotes = QUOTE_CHARS.filter((q) => t.includes(q));
    if (quotes.length > 0) add('W8', lang, `quotation marks present: ${quotes.join(' ')}`);
    const toneWords = toneViolations(t, lang, tone);
    if (toneWords.length > 0) add('W8', lang, `tone contradicts the section (tone=${tone}): ${toneWords.join(', ')}`);

    // W9 — language check as V9
    const language = languageViolations(t, lang);
    if (language !== null) add('W9', lang, language);
  }

  // W10 — the text must be about the section (≥1 topic word from its
  // vocabulary plainNames), per language.
  for (const [lang, t] of [['en', en], ['fa', fa]] as const) {
    const topics = topicWordsOf(stateIds, lang);
    const hit = topics.some((w) => t.toLowerCase().includes(w.toLowerCase()));
    if (!hit) add('W10', lang, 'no topic word from the section\u2019s vocabulary plainNames');
  }

  return failures;
}

/** The significant words of the section ids' plainNames (W10's topic words). */
function topicWordsOf(stateIds: ReadonlySet<string>, lang: 'en' | 'fa'): string[] {
  const out = new Set<string>();
  for (const id of stateIds) {
    const entry = getNarratorVocabulary([id], lang).entries[id];
    if (entry === undefined) continue;
    for (const w of words(entry.plainName)) {
      const clean = w.replace(/[^\p{L}\p{N}&]+/gu, '');
      if (lang === 'fa' ? clean.length >= 3 : clean.length >= 4) out.add(clean);
    }
  }
  return [...out];
}
