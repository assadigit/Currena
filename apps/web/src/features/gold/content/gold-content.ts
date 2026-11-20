/**
 * gold-content.ts — the gold indicator content module's PUBLIC ACCESSOR
 * (S5 M1, the GUX program's content foundation).
 *
 *   - `goldBrief(locale)` — the EAGER tier: the 37-voter brief map
 *     (plainLabel + defaultCopy), synchronously available; both locale
 *     files are tiny and statically imported, the way the app
 *     dictionaries are.
 *   - `loadGoldDeep(locale)` — the LAZY tier: all 52 records (the ten
 *     content dimensions of 09), behind TWO static dynamic-import
 *     branches so each locale's deep file is its own chunk, fetched only
 *     when a details panel opens.
 *   - `GOLD_VOTER_IDS` (37) + `GOLD_RECORD_IDS` (52) — the canonical id
 *     arrays (and their derived unions), the engine's own voter order.
 *
 * Everything is transcribed byte-faithful from
 * docs/gold-redesign/09-indicator-explanations-fa-en.md under the field
 * contract of docs/gold-redesign/08-indicator-content-schema.md §3/§9 —
 * one mechanical pass, no re-authoring; the fa strings ride the
 * Persian-copy manifest (round 91) through the audit's two en↔fa parity
 * pairs. Runtime renders ONLY the selected locale (08 §9.2).
 *
 * NOT YET CONSUMED: no component imports this module yet — the M3/M4
 * milestones (the hero rebuild, the five-force overview) wire it. Until
 * then the module must stay OUT of the bundle (gold-content.test.ts and
 * the bundle check both pin its absence).
 */

import { briefEn } from './gold-content-brief-en';
import { briefFa } from './gold-content-brief-fa';
import type { GoldBriefMap, GoldDeepMap, GoldLocale } from './gold-content-core';

export {
  GOLD_VOTER_IDS,
  GOLD_CONTEXT_RECORD_IDS,
  GOLD_BLOCKED_RECORD_IDS,
  GOLD_RECORD_IDS,
} from './gold-content-core';
export type {
  GoldVoterId,
  GoldContextRecordId,
  GoldBlockedRecordId,
  GoldRecordId,
  GoldBriefRecord,
  GoldBriefMap,
  GoldVoterDeepRecord,
  GoldContextDeepRecord,
  GoldBlockedDeepRecord,
  GoldDeepRecord,
  GoldDeepMap,
  GoldLocale,
} from './gold-content-core';

/** The eager brief map for the selected locale (the closed cards' tier). */
export function goldBrief(locale: GoldLocale): GoldBriefMap {
  return locale === 'fa' ? briefFa : briefEn;
}

/**
 * The lazy deep map for the selected locale — two static dynamic-import
 * branches (never a computed path), so the bundler splits each locale's
 * full record set into its own chunk that loads only on demand.
 */
export async function loadGoldDeep(locale: GoldLocale): Promise<GoldDeepMap> {
  if (locale === 'fa') {
    const { deepFa } = await import('./gold-content-deep-fa');
    return deepFa;
  }
  const { deepEn } = await import('./gold-content-deep-en');
  return deepEn;
}
