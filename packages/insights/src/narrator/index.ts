/**
 * @currena/insights/narrator — the Layer-2 narrator's import surface
 * (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md §5–§6, PREP-REPORT
 * "What Layer 2 can rely on").
 *
 *   - getNarratorVocabulary(ids, lang) — the compact per-state vocabulary
 *     subset (plainName / oneLine / ifRising / ifFalling / connections
 *     between the requested ids / only the glossary terms in use).
 *   - buildNarrationState(snapshot, now) — the small JSON the narrator
 *     receives (verdicts, alerts, patterns, fresh items, excluded items).
 *
 * Both are pure (no I/O, no clock reads, no KV, no fetch, no model
 * calls). The vocabulary rides the generated snapshot of the web
 * dictionaries (vocabulary.generated.json — regenerate with
 * `pnpm narrator:vocabulary`, drift-gated inside `pnpm gates`).
 */

export {
  getNarratorUi,
  getNarratorVocabulary,
  VOCABULARY_IDS,
  VOCABULARY_SOURCE,
} from './vocabulary';
export type {
  NarratorConnection,
  NarratorEntry,
  NarratorGlossaryTerm,
  NarratorLang,
  NarratorVocabulary,
} from './vocabulary';

export { buildNarrationState } from './state';
export type {
  NarrationAlert,
  NarrationExcluded,
  NarrationFxState,
  NarrationItem,
  NarrationPattern,
  NarrationSnapshot,
  NarrationState,
} from './state';

// ---- M1 of the narrator build (INSIGHTS-L2-NARRATOR-SPEC §3/§7/§8) ----
// The canonical Layer-1 word canon (shared with layer1.test.ts) + the
// narrator's own seed lists and text helpers.
export {
  ALARM_EN,
  ALARM_FA,
  ALL_CLEAR_EN,
  ALL_CLEAR_FA,
  ARABIC_KAF,
  ARABIC_YEH,
  ASCII_DIGIT,
  ATTRIBUTION_EN,
  ATTRIBUTION_FA,
  BANNED_EN,
  BANNED_FA,
  DOUBLE_SPACE,
  EM_DASH,
  FA_LATIN_ALLOW,
  JARGON,
  OUT_OF_DATE_EN,
  OUT_OF_DATE_FA,
  PREDICTION_EN,
  PREDICTION_FA,
  TENOR_TOKEN,
  alarmList,
  allClearList,
  attributionList,
  bannedHits,
  bannedList,
  faLatinViolations,
  normalizeDigits,
  outOfDateList,
  phraseHits,
  predictionList,
  residualDigits,
  sentences,
  toPersianDigits,
  wordCount,
  words,
} from './wordlists';
export type { JargonSpec } from './wordlists';

// The pure SHA-256 behind the narrator's stateHash (spec §4).
export { sha256Hex } from './hash';

// ---- M1: the section + overall narration states (spec §3) ----
export {
  NARRATOR_SECTIONS,
  buildSectionNarrationState,
  stateHashOf,
} from './section-state';
export type {
  CurrenciesSectionState,
  IndicatorSectionState,
  MarketsSectionState,
  NarratorSectionId,
  SectionAlert,
  SectionExcluded,
  SectionMarketItem,
  SectionNarrationSnapshot,
  SectionNarrationState,
  SectionPairItem,
  SectionPattern,
  SectionVerdict,
} from './section-state';

export { buildOverallNarrationState } from './overall-state';
export type {
  OverallAlert,
  OverallNarrationState,
  OverallSectionEntry,
} from './overall-state';

// ---- M1: the deterministic validators (spec §7) ----
export {
  OVERALL_LIMITS,
  SECTION_LIMITS,
  narrativeLimitsFor,
  stateIdsOf,
  validateNewsNote,
  validateStateNarrative,
} from './validate';
export type {
  NarratorUnit,
  NarratorValidationFailure,
  NewsNoteInput,
  StateNarrativeInput,
  StateNarrativeLimits,
} from './validate';

// ---- M1: the template fallback (spec §8) ----
export { templateNarrative } from './template';
export type { TemplateState } from './template';

// ---- M3: the Gemini REST client (spec §5; the Interactions API) ----
export { GeminiClient, STATE_NARRATIVE_SCHEMA, classifyHttpError, extractGrounding, extractOutputText } from './gemini-client';
export type { GeminiClientOptions, GeminiError, GeminiErrorKind, GeminiOutcome, NewsNoteText, StateNarrativeText } from './gemini-client';

// ---- M2: the prompts (spec §6, versioned) ----
export {
  BASE_RULES,
  NEWS_PROMPT,
  OVERALL_TASK,
  PROMPT_VERSION,
  SECTION_TASK,
  buildNarratorUserMessage,
  buildNewsUserMessage,
  newsSystemPrompt,
  overallSystemPrompt,
  sectionSystemPrompt,
  systemPromptFor,
} from './prompt';
export type { NarratorUserMessageInput, PromptState } from './prompt';
