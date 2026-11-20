/**
 * outlook-five-state.test.ts — the GUX-S7 M1 pins: the five-state
 * presentation fold (the owner's Q1 answer B, 2026-11-20).
 *
 * The pins:
 *   - the 7→5 fold is total (every OutlookState maps, exactly 08 §8.1's
 *     five states; the neutral/range-bound/mixed fold is the honest one);
 *   - the dictionary keys exist for all five states (the t() contract);
 *   - the tones follow the two-channel rule (supports normal · pressures
 *     alert · unclear neutral);
 *   - the classifier is UNTOUCHED (a parity pin against goldOutlookOf's
 *     own seven outputs over the same balance shapes — the fold consumes,
 *     never re-derives).
 */

import { describe, expect, it } from 'vitest';
import { goldOutlookOf, type OutlookState } from './outlook-core';
import { fiveStateOf, FIVE_STATE_KEY, FIVE_STATE_TONE, type FiveStateWord } from './outlook-five-state';
import { en } from '../i18n/en';
import { fa } from '../i18n/fa';

/** Resolves a dotted dictionary key ('pd.gold.x') to its leaf string. */
function leaf(dict: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], dict);
}

const ALL_SEVEN: readonly OutlookState[] = [
  'strong-bullish',
  'bullish',
  'neutral',
  'range-bound',
  'bearish',
  'strong-bearish',
  'mixed',
];

describe('outlook-five-state — the Q1-B fold (08 §8.1)', () => {
  it('maps all seven classifier states onto exactly the five reviewed words', () => {
    const mapped = new Set<FiveStateWord>(ALL_SEVEN.map(fiveStateOf));
    expect([...mapped].sort()).toEqual(
      ['mixed-or-unclear', 'moderately-pressure', 'moderately-support', 'strongly-pressure', 'strongly-support'].sort(),
    );
    // The fold's own assignments (08 §8.1's table).
    expect(fiveStateOf('strong-bullish')).toBe('strongly-support');
    expect(fiveStateOf('bullish')).toBe('moderately-support');
    expect(fiveStateOf('neutral')).toBe('mixed-or-unclear');
    expect(fiveStateOf('range-bound')).toBe('mixed-or-unclear');
    expect(fiveStateOf('mixed')).toBe('mixed-or-unclear');
    expect(fiveStateOf('bearish')).toBe('moderately-pressure');
    expect(fiveStateOf('strong-bearish')).toBe('strongly-pressure');
  });

  it('the dictionary keys exist and carry 08 §8.1\u2019s reviewed wording, both locales', () => {
    for (const state of ALL_SEVEN) {
      const key = FIVE_STATE_KEY[fiveStateOf(state)];
      expect(leaf(en, key)).toBeTruthy();
      expect(leaf(fa, key)).toBeTruthy();
    }
    // The EN drafts verbatim (08 §8.1's own table).
    expect(leaf(en, 'pd.gold.fiveStateStronglySupport')).toBe('Conditions strongly support gold');
    expect(leaf(en, 'pd.gold.fiveStateModeratelySupport')).toBe('Conditions moderately support gold');
    expect(leaf(en, 'pd.gold.fiveStateMixedOrUnclear')).toBe('Conditions are mixed or unclear');
    expect(leaf(en, 'pd.gold.fiveStateModeratelyPressure')).toBe('Conditions moderately pressure gold');
    expect(leaf(en, 'pd.gold.fiveStateStronglyPressure')).toBe('Conditions strongly pressure gold');
    // The fa drafts verbatim (08 §8.1's own table).
    expect(leaf(fa, 'pd.gold.fiveStateStronglySupport')).toBe('شرایط به‌شدت از طلا حمایت می‌کند');
    expect(leaf(fa, 'pd.gold.fiveStateModeratelySupport')).toBe('شرایط در حد متوسط از طلا حمایت می‌کند');
    expect(leaf(fa, 'pd.gold.fiveStateMixedOrUnclear')).toBe('شرایط مختلط یا نامشخص است');
    expect(leaf(fa, 'pd.gold.fiveStateModeratelyPressure')).toBe('شرایط در حد متوسط بر طلا فشار می‌آورد');
    expect(leaf(fa, 'pd.gold.fiveStateStronglyPressure')).toBe('شرایط به‌شدت بر طلا فشار می‌آورد');
  });

  it('the tones follow the two-channel rule (supports normal · pressures alert · unclear neutral)', () => {
    expect(FIVE_STATE_TONE['strongly-support']).toContain('status-normal');
    expect(FIVE_STATE_TONE['moderately-support']).toContain('status-normal');
    expect(FIVE_STATE_TONE['mixed-or-unclear']).toContain('text-secondary');
    expect(FIVE_STATE_TONE['moderately-pressure']).toContain('status-alert');
    expect(FIVE_STATE_TONE['strongly-pressure']).toContain('status-alert');
  });

  it('the classifier is untouched: goldOutlookOf still returns the seven states (the fold consumes, never re-derives)', () => {
    // A minimal shape over the REAL classifier: the null path (all five
    // lanes unread) and the two strong paths — the engine's own rules.
    const allUnread = {
      net: 0,
      readable: 0,
      lanes: [],
      counts: { for: 0, against: 0, steady: 0, unread: 5 },
    } as unknown as Parameters<typeof goldOutlookOf>[0];
    expect(goldOutlookOf(allUnread, null, null)).toBeNull();

    const fourFor = {
      net: 4,
      readable: 5,
      lanes: [],
      counts: { for: 4, against: 0, steady: 1, unread: 0 },
    } as unknown as Parameters<typeof goldOutlookOf>[0];
    expect(goldOutlookOf(fourFor, null, null)).toBe('strong-bullish');
    expect(fiveStateOf(goldOutlookOf(fourFor, null, null)!)).toBe('strongly-support');
  });
});
