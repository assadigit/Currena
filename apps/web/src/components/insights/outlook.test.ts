/**
 * outlook.test.ts — the 2026-10-21 owner directive ("Gold Market Outlook —
 * Complete State List"): the seven-state classification that replaced the
 * old up/down/flat verdict words (whose EN "Works against" and fa sentence
 * had drifted into saying different things — the bug being fixed).
 *
 * Covered here:
 *   - `outlookOf`'s mapping of the condition tally onto the owner's seven
 *     states, including the owner's distinctions: Neutral (no directional
 *     bias) ≠ Range-Bound (an affirmative range read that needs the
 *     quiet-price evidence) ≠ Mixed Signals (the indicators disagree).
 *   - the shared "strong" bar: the Strong states sit at the card lean's
 *     own LEAN_STRONG threshold (4 conditions on one side).
 *   - copy parity + the owner's verbatim sentences (gold, EN + fa) —
 *     pinned so the two locales can never drift apart again.
 */

import { describe, expect, it } from 'vitest';
import { LEAN_STRONG, type SignalConditionKey, type SignalConditionState, type SignalReading } from '@currena/insights';
import { RANGE_SPEED_PCT, outlookOf } from './signals/verdict';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';

const KEYS: SignalConditionKey[] = ['real-yield', 'expectations', 'stress', 'dollar', 'footing', 'industrial'];

const reading = (
  states: SignalConditionState[],
  extra: Partial<SignalReading> = {},
): SignalReading => ({
  metal: 'gold',
  priceId: 'gold-usd',
  conditions: states.map((state, i) => ({ key: KEYS[i]!, state, inputs: [] })),
  metCount: states.filter((s) => s === 'supportive').length,
  lean: null,
  position: null,
  speed: null,
  ...extra,
});

const quietMidRange = {
  speed: 1.2,
  position: { band: 'typical' as const, percentile: 0.5 },
};

describe('outlookOf — the owner\'s seven-state classification', () => {
  it('nothing readable at all stays null (verdictNone)', () => {
    expect(outlookOf(reading(['unknown', 'unknown', 'unknown', 'unknown', 'unknown']))).toBeNull();
  });

  it(`strong states sit at the shared LEAN_STRONG bar (${LEAN_STRONG} conditions on one side)`, () => {
    expect(LEAN_STRONG).toBe(4);
    // gold: 4 supportive + 1 neutral → Strong Bullish
    expect(outlookOf(reading(['supportive', 'supportive', 'supportive', 'supportive', 'neutral']))).toBe(
      'strong-bullish',
    );
    // silver-like 6 rows: 4 supportive even WITH 2 against → Strong Bullish
    expect(
      outlookOf(reading(['supportive', 'supportive', 'supportive', 'supportive', 'against', 'against'])),
    ).toBe('strong-bullish');
    // mirror: 4 against → Strong Bearish
    expect(outlookOf(reading(['against', 'against', 'against', 'against', 'neutral']))).toBe('strong-bearish');
    // 3 on one side is a majority, not a strong one
    expect(outlookOf(reading(['supportive', 'supportive', 'supportive', 'neutral', 'neutral']))).toBe('bullish');
    expect(outlookOf(reading(['against', 'against', 'against', 'neutral', 'neutral']))).toBe('bearish');
  });

  it('a majority favors the move (Bullish / Bearish)', () => {
    expect(outlookOf(reading(['supportive', 'supportive', 'against', 'neutral', 'neutral']))).toBe('bullish');
    expect(outlookOf(reading(['against', 'against', 'supportive', 'neutral', 'neutral']))).toBe('bearish');
  });

  it('an equal split of directional conditions conflicts → Mixed Signals', () => {
    expect(outlookOf(reading(['supportive', 'supportive', 'against', 'against', 'neutral']))).toBe('mixed');
  });

  it('all readable conditions sit neutral → Neutral (no directional bias)', () => {
    expect(outlookOf(reading(['neutral', 'neutral', 'neutral', 'neutral', 'neutral']))).toBe('neutral');
    // neutral conditions plus unreadable ones still read as Neutral
    expect(outlookOf(reading(['neutral', 'neutral', 'unknown', 'unknown', 'unknown']))).toBe('neutral');
  });

  describe('range-bound — quiet price mid-range beats a thin driver edge', () => {
    it('fires with no driver edge + |30-day speed| below the bar + typical band', () => {
      expect(outlookOf(reading(['neutral', 'neutral', 'neutral', 'neutral', 'neutral'], quietMidRange))).toBe(
        'range-bound',
      );
      // even a 3v2 edge is "no clear breakout direction" while the price consolidates mid-range
      expect(
        outlookOf(reading(['supportive', 'supportive', 'supportive', 'against', 'against'], quietMidRange)),
      ).toBe('range-bound');
    });

    it('does NOT fire when the price is moving (no range evidence)', () => {
      expect(
        outlookOf(reading(['supportive', 'supportive', 'supportive', 'against', 'against'], {
          ...quietMidRange,
          speed: 6.4,
        })),
      ).toBe('bullish');
      expect(
        outlookOf(reading(['supportive', 'supportive', 'against', 'against', 'neutral'], {
          ...quietMidRange,
          speed: -3.1,
        })),
      ).toBe('mixed');
    });

    it('does NOT fire away from the typical band (edge of the decade range is a breakout setup)', () => {
      expect(
        outlookOf(reading(['supportive', 'supportive', 'supportive', 'against', 'against'], {
          ...quietMidRange,
          position: { band: 'high', percentile: 0.97 },
        })),
      ).toBe('bullish');
      expect(
        outlookOf(reading(['neutral', 'neutral', 'neutral', 'neutral', 'neutral'], {
          ...quietMidRange,
          position: { band: 'low', percentile: 0.08 },
        })),
      ).toBe('neutral');
    });

    it('a clear driver edge (≥2) keeps its direction regardless of a quiet month', () => {
      expect(
        outlookOf(reading(['supportive', 'supportive', 'supportive', 'supportive', 'against'], quietMidRange)),
      ).toBe('strong-bullish');
      expect(
        outlookOf(reading(['supportive', 'supportive', 'supportive', 'against', 'against'], {
          ...quietMidRange,
          speed: -1.5,
        })),
      ).toBe('range-bound'); // edge exactly 1 + quiet price: still range-bound
    });

    it(`the speed bar is ${RANGE_SPEED_PCT}% over 30 days (boundary excluded)`, () => {
      expect(RANGE_SPEED_PCT).toBe(2);
      expect(
        outlookOf(reading(['neutral', 'neutral', 'neutral', 'neutral', 'neutral'], {
          ...quietMidRange,
          speed: RANGE_SPEED_PCT,
        })),
      ).toBe('neutral');
    });
  });
});

describe('outlook copy — the owner\'s verbatim sentences, both locales', () => {
  const en = insightsCopyEn.signals;
  const fa = insightsCopyFa.signals;

  /** The owner's table, gold column, exactly as written (the bug report's fix). */
  const OWNER_GOLD_EN = {
    'strong-bullish': 'Signs point to a potential significant rise in gold prices.',
    bullish: 'Signs point to a potential rise in gold prices.',
    neutral: 'Signs point to a neutral outlook for gold prices.',
    'range-bound': 'Signs point to gold prices trading within a defined range.',
    bearish: 'Signs point to a potential decline in gold prices.',
    'strong-bearish': 'Signs point to a potential significant decline in gold prices.',
    mixed: 'Market signals for gold prices are mixed.',
  } as const;
  const OWNER_GOLD_FA = {
    'strong-bullish': 'نشانه‌ها حاکی از احتمال رشد قابل‌توجه قیمت طلاست.',
    bullish: 'نشانه‌ها حاکی از احتمال رشد قیمت طلاست.',
    neutral: 'نشانه‌ها حاکی از چشم‌اندازی خنثی برای قیمت طلاست.',
    'range-bound': 'نشانه‌ها حاکی از نوسان قیمت طلا در محدوده‌ای مشخص است.',
    bearish: 'نشانه‌ها حاکی از احتمال افت قیمت طلاست.',
    'strong-bearish': 'نشانه‌ها حاکی از احتمال افت قابل‌توجه قیمت طلاست.',
    mixed: 'نشانه‌های بازار درباره جهت حرکت قیمت طلا یکدست نیستند.',
  } as const;

  const STATES = Object.keys(OWNER_GOLD_EN) as (keyof typeof OWNER_GOLD_EN)[];

  it('every state carries gold + silver sentences in BOTH locales', () => {
    for (const state of STATES) {
      for (const metal of ['gold', 'silver'] as const) {
        expect(en.verdictStates[state][metal], `${state}/${metal}/en`).toBeTruthy();
        expect(fa.verdictStates[state][metal], `${state}/${metal}/fa`).toBeTruthy();
      }
    }
    expect(sorted(Object.keys(en.verdictStates))).toEqual(sorted(Object.keys(fa.verdictStates)));
    expect(sorted(Object.keys(en.verdictStateNames))).toEqual(sorted(Object.keys(fa.verdictStateNames)));
  });

  it('the gold sentences are the owner\'s exact strings (EN + fa)', () => {
    for (const state of STATES) {
      expect(en.verdictStates[state].gold).toBe(OWNER_GOLD_EN[state]);
      expect(fa.verdictStates[state].gold).toBe(OWNER_GOLD_FA[state]);
    }
  });

  it('the silver sentences mirror the gold structure', () => {
    for (const state of STATES) {
      expect(en.verdictStates[state].silver).toContain('silver prices');
      expect(fa.verdictStates[state].silver).toContain('نقره');
      expect(fa.verdictStates[state].silver).not.toContain('طلا');
    }
  });

  it('the strip heading and collapsed template speak the outlook', () => {
    expect(en.verdictTitle).toBe('Outlook');
    expect(fa.verdictTitle).toBe('چشم‌انداز');
    expect(en.collapsedVerdict).toBe('Outlook: {verdict}');
    expect(fa.collapsedVerdict).toBe('چشم‌انداز: {verdict}');
  });

  it('the retired mismatched words are gone', () => {
    const enRecord = en as unknown as Record<string, unknown>;
    const faRecord = fa as unknown as Record<string, unknown>;
    for (const key of ['verdictUp', 'verdictDown', 'verdictFlat']) {
      expect(enRecord[key]).toBeUndefined();
      expect(faRecord[key]).toBeUndefined();
    }
    // the bug's exact mismatch never returns
    expect(JSON.stringify(insightsCopyFa)).not.toContain('شرایط موجود با الگوی معمول هم‌خوانی ندارد');
  });
});

function sorted(xs: readonly string[]): string[] {
  return [...xs].sort();
}
