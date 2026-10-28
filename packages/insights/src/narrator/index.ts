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
