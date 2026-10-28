/**
 * overall-state.ts — M1 of the Layer-2 narrator build (spec §3):
 * `buildOverallNarrationState(snapshot, now)` — the whole-page state the
 * overall narrative is generated from. Built from the four section states
 * (one derivation path; nothing is re-derived here).
 *
 * Contents (spec §3): the page's existing verdict labels with their counts
 * (all four sections), every firing alert across sections (each tagged
 * with its section — "the top few" is what the PROMPT asks the model to
 * name; the state carries all of them so the choice is the model's, from
 * facts), the active FX patterns, and the overall exclusions (the union
 * across sections). RULE (spec §3): the AI never reads AI output — the
 * overall narrative is generated from THIS state, never from section texts.
 *
 * Pure: no I/O, no clock reads, no KV, no fetch, no model calls.
 */

import { getNarratorSectionLabels } from './vocabulary';
import {
  NARRATOR_SECTIONS,
  buildSectionNarrationState,
  type NarratorSectionId,
  type SectionAlert,
  type SectionExcluded,
  type SectionNarrationSnapshot,
  type SectionNarrationState,
  type SectionPattern,
  type SectionVerdict,
} from './section-state';

/** One section's rollup inside the overall state. */
export interface OverallSectionEntry {
  section: NarratorSectionId;
  /** The section's plain label, both languages (existing UI strings). */
  label: { en: string; fa: string };
  /** False when the section's feed document was not provided (the section is absent from the page). */
  present: boolean;
  /** The section's existing verdict with its counts, when it has one. */
  verdict: SectionVerdict | null;
  /** Firing alerts inside the section. */
  alertCount: number;
  /** Fresh items in the section. */
  itemCount: number;
  /** Stale/unavailable items in the section. */
  excludedCount: number;
}

/** An alert across sections, tagged with its section. */
export type OverallAlert = SectionAlert & { section: NarratorSectionId };

/** The whole-page narration state (the exact wire shape; see SECTION-STATE.md). */
export interface OverallNarrationState {
  generatedAt: string;
  /** The four sections' rollups, in page order (D-32). */
  sections: OverallSectionEntry[];
  /** Every firing alert across sections (each tagged with its section), section order then the section's own alert order. */
  alerts: OverallAlert[];
  /** The active FX patterns (world-currencies), id-sorted. */
  patterns: SectionPattern[];
  /** The union of all sections' exclusions. */
  excluded: SectionExcluded[];
  /** The oldest/newest asOf across ALL sections' fresh items (the page's data horizon). */
  dataAsOf: { oldest: string | null; newest: string | null };
}

/** The static section labels (existing UI strings, via the generated vocabulary snapshot). */
function sectionLabels(): Record<NarratorSectionId, { en: string; fa: string }> {
  const en = getNarratorSectionLabels('en');
  const fa = getNarratorSectionLabels('fa');
  return {
    global: { en: en.label.global, fa: fa.label.global },
    australia: { en: en.label.australia, fa: fa.label.australia },
    'world-markets': { en: en.label['world-markets'], fa: fa.label['world-markets'] },
    'world-currencies': { en: en.label['world-currencies'], fa: fa.label['world-currencies'] },
  };
}

/**
 * Build the overall narration state (spec §3). Pure and deterministic.
 * The insights document is required; the markets/fx documents are optional
 * (their sections roll up as absent, exactly as the page would show them).
 *
 * @param snapshot the computed page documents
 * @param now      the narrator's clock (ISO datetime)
 */
export function buildOverallNarrationState(snapshot: SectionNarrationSnapshot, now: string): OverallNarrationState {
  const labels = sectionLabels();

  const sectionStates: SectionNarrationState[] = [];
  for (const section of NARRATOR_SECTIONS) {
    try {
      sectionStates.push(buildSectionNarrationState(snapshot, section, now));
    } catch {
      // The section's feed document was not provided — it is absent from
      // the page, and the overall state says so (present: false).
    }
  }
  const bySection = new Map<NarratorSectionId, SectionNarrationState>(sectionStates.map((s) => [s.section, s]));

  const sections: OverallSectionEntry[] = NARRATOR_SECTIONS.map((section) => {
    const state = bySection.get(section);
    return {
      section,
      label: labels[section],
      present: state !== undefined,
      verdict: state?.verdict ?? null,
      alertCount: state?.alerts.length ?? 0,
      itemCount: state?.items.length ?? 0,
      excludedCount: state?.excluded.length ?? 0,
    };
  });

  const alerts: OverallAlert[] = [];
  for (const section of NARRATOR_SECTIONS) {
    const state = bySection.get(section);
    if (state === undefined) continue;
    for (const alert of state.alerts) alerts.push({ ...alert, section });
  }

  const excluded: SectionExcluded[] = [];
  const asOfDates: string[] = [];
  for (const section of NARRATOR_SECTIONS) {
    const state = bySection.get(section);
    if (state === undefined) continue;
    excluded.push(...state.excluded);
    for (const item of state.items) asOfDates.push(item.asOf);
  }
  excluded.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  let oldest: string | null = null;
  let newest: string | null = null;
  for (const d of asOfDates) {
    if (oldest === null || d < oldest) oldest = d;
    if (newest === null || d > newest) newest = d;
  }

  return {
    generatedAt: now,
    sections,
    alerts,
    patterns: bySection.get('world-currencies')?.patterns ?? [],
    excluded,
    dataAsOf: { oldest, newest },
  };
}
