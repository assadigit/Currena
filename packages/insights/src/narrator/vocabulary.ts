/**
 * vocabulary.ts — P3 of the Layer-2 prep (docs/insights/layer2/
 * INSIGHTS-L2-PREP-SPEC.md §5): `getNarratorVocabulary(ids, lang)` — the
 * compact, SUBSET vocabulary the future narrator (Layer 2) receives.
 *
 * ONE source of truth: the web dictionaries
 * (apps/web/src/i18n/insights-copy-{en,fa}.ts) are the only hand-edited
 * copy; this module reads their GENERATED snapshot
 * (vocabulary.generated.json, produced by
 * scripts/generate-narrator-vocabulary.ts, drift-gated by
 * scripts/check-narrator-vocabulary.ts inside `pnpm gates`). The web app
 * never imports this file — zero bundle impact, zero duplicated text,
 * zero drift (D-23).
 *
 * The subset contract (spec §5.2): for ONLY the requested indicator ids —
 *   plainName, oneLine, ifRising, ifFalling (null + skipReason for the
 *   7 pattern cards, D-09), the connections BETWEEN the requested ids
 *   (a link whose target is outside the requested set is dropped — the
 *   model only meets items it is told about), australiaAngle where
 *   written — plus ONLY the glossary terms those entries use.
 * Both languages, typed, with the same en↔fa parity the web pair has
 * (enforced at generation time + by the tests here).
 *
 * Pure data access: no I/O, no clock, no KV, no fetch (G10). NO AI runs
 * here — Layer 2 decides what to do with the vocabulary.
 */

import raw from './vocabulary.generated.json';

/** The narrator's language pair (the site's two locales). */
export type NarratorLang = 'en' | 'fa';

/** One connection between two requested indicators (the Layer-1 link). */
export interface NarratorConnection {
  with: string;
  text: string;
  strength: 'reliable' | 'usually' | 'sometimes';
}

/**
 * The compact fields the narrator needs for one indicator (spec §5.2).
 * `skipReason` rides along when both directions are null (the 7 FX
 * pattern cards — a relationship, not a level; D-09).
 */
export interface NarratorEntry {
  plainName: string;
  oneLine: string;
  ifRising: string | null;
  ifFalling: string | null;
  connections: NarratorConnection[];
  australiaAngle?: string;
  glossaryTerms: string[];
  skipReason?: string;
}

/** One glossary term the requested entries actually use. */
export interface NarratorGlossaryTerm {
  term: string;
  plain: string;
  example?: string;
}

/** The subset vocabulary result (spec §5.2). */
export interface NarratorVocabulary {
  lang: NarratorLang;
  /** The requested ids that have Layer-1 copy, in request order. */
  ids: string[];
  /** The requested ids that have NO Layer-1 copy (reported, never guessed). */
  missing: string[];
  entries: Record<string, NarratorEntry>;
  /** Only the glossary terms the included entries use. */
  glossary: Record<string, NarratorGlossaryTerm>;
}

/* ------------------------------------------------------------------ *
 * The generated snapshot's static shape (kept structurally identical to
 * the web dictionaries' Layer1 types — the generator is the typed bridge).
 * ------------------------------------------------------------------ */

interface GeneratedLayer1Entry {
  plainName: string;
  oneLine: string;
  ifRising: string | null;
  ifFalling: string | null;
  connections: NarratorConnection[];
  australiaAngle?: string;
  glossaryTerms: string[];
  skipReason?: string;
}

interface GeneratedVocabularyFile {
  v: 1;
  source: {
    enPath: string;
    faPath: string;
    enSha256: string;
    faSha256: string;
    indicatorCount: number;
    glossaryCount: number;
  };
  en: { indicators: Record<string, GeneratedLayer1Entry>; glossary: Record<string, NarratorGlossaryTerm>; ui: Record<string, string>; sections: GeneratedSectionLabels };
  fa: { indicators: Record<string, GeneratedLayer1Entry>; glossary: Record<string, NarratorGlossaryTerm>; ui: Record<string, string>; sections: GeneratedSectionLabels };
}

/**
 * The section-label block (M1 of the narrator build, spec §3): the plain
 * labels + the approved verdict/signal/status words, per language, from
 * the existing UI strings (never new copy — the generator curates them
 * from the web dictionaries and the drift gate pins them).
 */
export interface NarratorSectionLabels {
  /** The four narrated sections' plain labels. */
  label: Record<'global' | 'australia' | 'world-markets' | 'world-currencies', string>;
  /** The indicator verdicts' approved words (copy.label). */
  verdictWord: Record<'relaxed' | 'cautious' | 'stressed' | 'alarmed', string>;
  /** The markets/fx signals' approved words (copy.fx.chip*). */
  signalWord: Record<'normal' | 'attention' | 'unusual', string>;
  /** The markets groups' approved words, east to west. */
  marketGroup: Record<'asia' | 'europe' | 'americas', string>;
  /** The alerting market statuses' approved words. */
  marketStatus: Record<'correction' | 'bear', string>;
}

type GeneratedSectionLabels = NarratorSectionLabels;

const VOCABULARY = raw as GeneratedVocabularyFile;

/** Provenance of the generated snapshot (the source dictionaries' sha256). */
export const VOCABULARY_SOURCE = VOCABULARY.source;

/** All indicator ids that carry Layer-1 copy (both languages, one list). */
export const VOCABULARY_IDS: readonly string[] = Object.keys(VOCABULARY.en.indicators);

/** The Layer-1 UI labels for a language (block labels incl. noDirection). */
export function getNarratorUi(lang: NarratorLang): Record<string, string> {
  return VOCABULARY[lang].ui;
}

/** The section labels + approved verdict/signal words for a language (M1). */
export function getNarratorSectionLabels(lang: NarratorLang): NarratorSectionLabels {
  return VOCABULARY[lang].sections;
}

/**
 * The narrator's vocabulary subset (spec §5.2). Pure: no I/O, no clock.
 *
 * @param ids the indicator ids relevant to today's state (deduplicated,
 *            order preserved in `ids`; unknown ids land in `missing`)
 * @param lang the narration language
 */
export function getNarratorVocabulary(ids: readonly string[], lang: NarratorLang): NarratorVocabulary {
  const table = VOCABULARY[lang].indicators;
  const glossaryTable = VOCABULARY[lang].glossary;
  const requested = [...new Set(ids)];
  const present: string[] = [];
  const missing: string[] = [];
  const entries: Record<string, NarratorEntry> = {};
  const wantedTerms = new Set<string>();

  for (const id of requested) {
    const entry = table[id];
    if (entry === undefined) {
      missing.push(id);
      continue;
    }
    present.push(id);
    // The connections BETWEEN the requested ids only: a link naming an
    // indicator the model was not given would be a dangling reference.
    const requestedSet = new Set(requested);
    const connections = entry.connections.filter((c) => requestedSet.has(c.with));
    for (const term of entry.glossaryTerms) wantedTerms.add(term);
    entries[id] = {
      plainName: entry.plainName,
      oneLine: entry.oneLine,
      ifRising: entry.ifRising,
      ifFalling: entry.ifFalling,
      connections,
      ...(entry.australiaAngle !== undefined ? { australiaAngle: entry.australiaAngle } : {}),
      glossaryTerms: [...entry.glossaryTerms],
      ...(entry.skipReason !== undefined ? { skipReason: entry.skipReason } : {}),
    };
  }

  // Only the glossary terms the included entries use — and only terms that
  // actually exist (a copy bug naming a missing term is dropped here and
  // caught by the vocabulary tests).
  const glossary: Record<string, NarratorGlossaryTerm> = {};
  for (const term of [...wantedTerms].sort()) {
    const glossaryEntry = glossaryTable[term];
    if (glossaryEntry !== undefined) glossary[term] = glossaryEntry;
  }

  return { lang, ids: present, missing, entries, glossary };
}
