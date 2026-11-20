/**
 * outlook-five-state.ts — the five-state PRESENTATION wording over the
 * protected 7-state classifier (GUX-S7 M1, the owner's Q1 answer B,
 * 2026-11-20): 08 §8.1's reviewed drafts, executed inside the
 * S5-shipped container. * S5-shipped container. Lives beside outlook-core in shared/components
 * because BOTH lean consumers (the gold page's BriefingCard and the
 * /global Gold Balance tile) render the word: one vocabulary, one home,
 * no gold-feature import across the chunk boundary.
 *
 * THE CONTRACT (08 §8.1's mapping note + S3-D7, now the owner's
 * decision): the engine's 7-state `OutlookState` (goldOutlookOf, the
 * GB-S5 same-engine contract) is a CONDITIONS-DIRECTION classifier —
 * PROTECTED (§9.3, never touched here). What changes is the WORD the
 * visitor reads: the seven states fold into 08 §8.1's five plain
 * conditions-language states, so the line can never read as a market
 * forecast ("Bearish") — it reads as what it is (what conditions do to
 * gold):
 *
 *   strong-bullish            → strongly-support  ("Conditions strongly support gold")
 *   bullish                   → moderately-support ("Conditions moderately support gold")
 *   neutral | range-bound | mixed → mixed-or-unclear ("Conditions are mixed or unclear")
 *   bearish                   → moderately-pressure("Conditions moderately pressure gold")
 *   strong-bearish            → strongly-pressure  ("Conditions strongly pressure gold")
 *
 * The neutral/range-bound/mixed fold is the honest one: all three are
 * "the evidence does not lean", and 08 §8.1's five-state vocabulary has
 * exactly one word for that. The classifier keeps distinguishing them
 * (the engine, the lanes and every test still see seven states); only
 * the presentation folds — and the fold is PURE, testable, and shared
 * by every surface that renders the word (the gold page's
 * BriefingCard + the /global Gold Balance tile — one vocabulary, never
 * two).
 *
 * THE Q2 GATE (unchanged, still closed): no horizon chip, no scenario
 * row — nothing here touches the BriefingCard's empty slot. The
 * not-a-forecast caveat rides the word, always (both locales).
 */

import type { TranslationKey } from '../lib/locale';
import type { OutlookState } from './outlook-core';

/** The five presentation states (08 §8.1's own names). */
export type FiveStateWord =
  | 'strongly-support'
  | 'moderately-support'
  | 'mixed-or-unclear'
  | 'moderately-pressure'
  | 'strongly-pressure';

/** The 7→5 fold — pure, the single source of the mapping. */
export function fiveStateOf(outlook: OutlookState): FiveStateWord {
  switch (outlook) {
    case 'strong-bullish':
      return 'strongly-support';
    case 'bullish':
      return 'moderately-support';
    case 'neutral':
    case 'range-bound':
    case 'mixed':
      return 'mixed-or-unclear';
    case 'bearish':
      return 'moderately-pressure';
    case 'strong-bearish':
      return 'strongly-pressure';
  }
}

/** The five-state word's dictionary key (the shared vocabulary — both
 *  surfaces, both locales, one set of keys). */
export const FIVE_STATE_KEY: Readonly<Record<FiveStateWord, TranslationKey>> = {
  'strongly-support': 'pd.gold.fiveStateStronglySupport',
  'moderately-support': 'pd.gold.fiveStateModeratelySupport',
  'mixed-or-unclear': 'pd.gold.fiveStateMixedOrUnclear',
  'moderately-pressure': 'pd.gold.fiveStateModeratelyPressure',
  'strongly-pressure': 'pd.gold.fiveStateStronglyPressure',
};

/** The word's ink (the two-channel rule at presentation level: the ink
 *  carries the relationship to gold — supports normal, pressures alert,
 *  unclear neutral). */
export const FIVE_STATE_TONE: Readonly<Record<FiveStateWord, string>> = {
  'strongly-support': 'text-[var(--color-status-normal)]',
  'moderately-support': 'text-[var(--color-status-normal)]',
  'mixed-or-unclear': 'text-[var(--color-text-secondary)]',
  'moderately-pressure': 'text-[var(--color-status-alert)]',
  'strongly-pressure': 'text-[var(--color-status-alert)]',
};
