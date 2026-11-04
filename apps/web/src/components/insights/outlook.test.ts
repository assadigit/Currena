/**
 * outlook.test.ts — the 2026-10-21 owner directive ("Gold Market Outlook —
 * Complete State List"): the seven-state classification that replaced the
 * old up/down/flat verdict words (whose EN "Works against" and fa sentence
 * had drifted into saying different things — the bug being fixed).
 *
 * Covered here:
 *   - `outlookOf`'s mapping of the condition tally onto the owner's seven
 *     states (SILVER's leg since the GB-S6 flip — the flag-off gold
 *     legacy path retired with the flip), including the owner's
 *     distinctions: Neutral (no directional bias) ≠ Range-Bound (an
 *     affirmative range read that needs the quiet-price evidence) ≠
 *     Mixed Signals (the indicators disagree).
 *   - the shared "strong" bar: the Strong states sit at the card lean's
 *     own LEAN_STRONG threshold (4 conditions on one side).
 *   - copy parity + the owner's verbatim sentences (gold, EN + fa) —
 *     pinned so the two locales can never drift apart again.
 */

import { describe, expect, it } from 'vitest';
import {
  GOLD_LANE_STRONG,
  GOLD_LANES,
  LEAN_STRONG,
  type GoldBalanceLane,
  type GoldBalanceReading,
  type GoldBalanceSide,
  type SignalConditionKey,
  type SignalConditionState,
  type SignalReading,
} from '@currena/insights';
import { RANGE_SPEED_PCT, goldOutlookOf, outlookOf } from './signals/verdict';
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

/* ------------------------------------------------------------------ *
 * goldOutlookOf — the consolidated gold Outlook (GB-S5, P3: 01 §5.2;
 * since the GB-S6 flip THE gold derivation for every visitor). The
 * table test 04 §4.2 mandates: every branch over (L, A, unread, speed,
 * band), plus the footing-decoupling pin (AC-7). outlookOf above now
 * serves SILVER ONLY (the flag-off gold legacy path retired with the
 * flip); OI-4 — silver's own footing circularity — is a recorded
 * follow-up.
 * ------------------------------------------------------------------ */

type Band = 'low' | 'typical' | 'high';
const pos = (band: Band) => ({ band, percentile: band === 'low' ? 0.1 : band === 'high' ? 0.95 : 0.5 });
const QUIET = 1.2; // |30-day change| well under the 2% bar
const MOVING = 6.4; // well above it

/** A minimal but VALID GoldBalanceReading: `L` lanes for, `A` against,
 * `U` unread, the rest neutral — the counts roll up exactly as
 * goldBalance() does (the engine's own rollup is pinned by its tests;
 * this builder lets the table test walk every (L, A, unread) branch
 * without 21-voter fixtures). goldOutlookOf reads only the rollup. */
const laneBalance = (L: number, A: number, U: number): GoldBalanceReading => {
  const neutral = 4 - L - A - U;
  const sides: GoldBalanceSide[] = [
    ...Array<GoldBalanceSide>(L).fill('for'),
    ...Array<GoldBalanceSide>(A).fill('against'),
    ...Array<GoldBalanceSide>(neutral).fill('neutral'),
    ...Array<GoldBalanceSide>(U).fill('unread'),
  ];
  const lanes: GoldBalanceLane[] = GOLD_LANES.map((lane, i) => ({
    lane,
    side: sides[i]!,
    split: false,
    readable: sides[i] === 'unread' ? 0 : 1,
    firing: 0,
    supports: 0,
    pressures: 0,
    members: [],
  }));
  return {
    lanes,
    counts: { for: L, against: A, neutral, unread: U },
    net: L - A,
    readable: L + A + neutral,
  };
};

const outlookAt = (
  L: number,
  A: number,
  U: number,
  speed: number | null,
  band: Band | null,
): ReturnType<typeof goldOutlookOf> => goldOutlookOf(laneBalance(L, A, U), speed, band === null ? null : pos(band));

describe('goldOutlookOf — the consolidated gold Outlook (01 §5.2, GB-S5 P3)', () => {
  it('the strong bar sits at GOLD_LANE_STRONG = 3 of 4 lanes (mirroring the old 4-of-5 bar)', () => {
    expect(GOLD_LANE_STRONG).toBe(3);
    // 2 of 4 is a majority, not a strong one
    expect(outlookAt(2, 0, 0, MOVING, 'typical')).toBe('bullish');
    expect(outlookAt(0, 2, 0, MOVING, 'typical')).toBe('bearish');
  });

  it('all four lanes unread → null (verdictNone — nothing could be read)', () => {
    expect(outlookAt(0, 0, 4, null, null)).toBeNull();
    // rule 1 precedes everything, even complete range evidence
    expect(outlookAt(0, 0, 4, QUIET, 'typical')).toBeNull();
  });

  it('L >= 3 → strong-bullish; A >= 3 → strong-bearish (L=3, L=4 both pin)', () => {
    expect(outlookAt(3, 0, 0, MOVING, 'typical')).toBe('strong-bullish');
    expect(outlookAt(3, 1, 0, MOVING, 'typical')).toBe('strong-bullish');
    expect(outlookAt(4, 0, 0, MOVING, 'typical')).toBe('strong-bullish');
    // the strong states outrank the range rule even on a quiet, typical month
    expect(outlookAt(3, 0, 0, QUIET, 'typical')).toBe('strong-bullish');
    expect(outlookAt(4, 0, 0, QUIET, 'typical')).toBe('strong-bullish');
    expect(outlookAt(0, 3, 0, MOVING, 'typical')).toBe('strong-bearish');
    expect(outlookAt(1, 3, 0, MOVING, 'typical')).toBe('strong-bearish');
    expect(outlookAt(0, 4, 0, MOVING, 'typical')).toBe('strong-bearish');
    expect(outlookAt(0, 3, 0, QUIET, 'typical')).toBe('strong-bearish');
  });

  it('range-bound: quiet price mid-range plus |L - A| <= 1 beats a thin driver edge', () => {
    // all neutral, quiet and typical
    expect(outlookAt(0, 0, 0, QUIET, 'typical')).toBe('range-bound');
    // a 2v1 / 1v2 / 1v1 edge is "no clear breakout direction" while the price consolidates
    expect(outlookAt(2, 1, 0, QUIET, 'typical')).toBe('range-bound');
    expect(outlookAt(1, 2, 0, QUIET, 'typical')).toBe('range-bound');
    expect(outlookAt(1, 1, 0, QUIET, 'typical')).toBe('range-bound');
    // a single voting lane (1v0) with the rest quiet
    expect(outlookAt(1, 0, 0, QUIET, 'typical')).toBe('range-bound');
    // the negative quiet month is as quiet as the positive one
    expect(outlookAt(2, 1, 0, -QUIET, 'typical')).toBe('range-bound');
    // the rules' order: range evidence precedes the L==A/else ladder, so a
    // thin readable read (1 for, 3 unread) on a quiet month still reads
    // consolidation (01 §5.2 rule 3 before rules 4-5)
    expect(outlookAt(1, 0, 3, QUIET, 'typical')).toBe('range-bound');
  });

  it('NOT range-bound when the price is moving (no range evidence, whatever the lanes)', () => {
    expect(outlookAt(0, 0, 0, MOVING, 'typical')).toBe('neutral');
    expect(outlookAt(0, 0, 0, -3.1, 'typical')).toBe('neutral');
    // the thin edge keeps its direction when the price moves
    expect(outlookAt(2, 1, 0, MOVING, 'typical')).toBe('bullish');
    expect(outlookAt(1, 2, 0, -3.1, 'typical')).toBe('bearish');
    expect(outlookAt(1, 1, 0, MOVING, 'typical')).toBe('mixed');
  });

  it('NOT range-bound away from the typical band, without a position, or without a speed', () => {
    // the edge of the decade range is a breakout setup
    expect(outlookAt(2, 1, 0, QUIET, 'high')).toBe('bullish');
    expect(outlookAt(1, 2, 0, QUIET, 'low')).toBe('bearish');
    expect(outlookAt(0, 0, 0, QUIET, 'high')).toBe('neutral');
    expect(outlookAt(0, 0, 0, QUIET, 'low')).toBe('neutral');
    // honest absence: no position / no speed → no range evidence
    expect(outlookAt(2, 1, 0, QUIET, null)).toBe('bullish');
    expect(outlookAt(0, 0, 0, null, 'typical')).toBe('neutral');
  });

  it(`the speed bar is |30-day change| < ${RANGE_SPEED_PCT}% (boundary excluded, either sign)`, () => {
    expect(RANGE_SPEED_PCT).toBe(2);
    expect(outlookAt(0, 0, 0, RANGE_SPEED_PCT, 'typical')).toBe('neutral');
    expect(outlookAt(0, 0, 0, -RANGE_SPEED_PCT, 'typical')).toBe('neutral');
    expect(outlookAt(0, 0, 0, 1.99, 'typical')).toBe('range-bound');
    expect(outlookAt(0, 0, 0, -1.99, 'typical')).toBe('range-bound');
  });

  it('a clear driver edge (|L - A| >= 2) keeps its direction regardless of a quiet month', () => {
    expect(outlookAt(2, 0, 0, QUIET, 'typical')).toBe('bullish');
    expect(outlookAt(0, 2, 0, QUIET, 'typical')).toBe('bearish');
    expect(outlookAt(3, 1, 0, QUIET, 'typical')).toBe('strong-bullish');
  });

  it('L == A → mixed when L > 0, else neutral', () => {
    expect(outlookAt(1, 1, 0, MOVING, 'typical')).toBe('mixed');
    expect(outlookAt(2, 2, 0, MOVING, 'typical')).toBe('mixed');
    // no speed at all → honest mixed, no range claim
    expect(outlookAt(1, 1, 0, null, null)).toBe('mixed');
    // equal to zero → neutral
    expect(outlookAt(0, 0, 0, MOVING, 'typical')).toBe('neutral');
    expect(outlookAt(0, 0, 2, MOVING, 'typical')).toBe('neutral');
    // neutral conditions plus unreadable lanes still read as Neutral
    expect(outlookAt(0, 0, 1, MOVING, 'typical')).toBe('neutral');
  });

  it('otherwise: bullish if L > A, bearish if A > L (unread lanes do not vote)', () => {
    expect(outlookAt(1, 0, 0, MOVING, 'typical')).toBe('bullish');
    expect(outlookAt(2, 1, 0, MOVING, 'typical')).toBe('bullish');
    expect(outlookAt(0, 1, 0, MOVING, 'typical')).toBe('bearish');
    expect(outlookAt(0, 1, 3, MOVING, 'typical')).toBe('bearish'); // the sparse shape: 1 against, 3 unread
  });

  it('the footing-decoupling pin (AC-7, 04 §4.2): gold change30d of -9% and +9% give the SAME state unless the range evidence differs', () => {
    // The old gold path counted the move itself as a 5th condition
    // (falling = bearish evidence). The lane derivation reads price ONLY
    // as range evidence — the sign of a large move can never flip a state.
    for (const [L, A, U, expected] of [
      [2, 1, 0, 'bullish'],
      [1, 2, 0, 'bearish'],
      [0, 0, 0, 'neutral'],
      [1, 1, 0, 'mixed'],
      [0, 1, 3, 'bearish'],
      [3, 0, 0, 'strong-bullish'],
      [0, 3, 0, 'strong-bearish'],
    ] as const) {
      expect(outlookAt(L, A, U, -9, 'typical'), `L${L} A${A} U${U} at -9%`).toBe(expected);
      expect(outlookAt(L, A, U, 9, 'typical'), `L${L} A${A} U${U} at +9%`).toBe(expected);
    }
    // The ONLY way price changes the state is the range evidence: the same
    // lanes at ±1.5% (quiet, typical) read range-bound where ±9% does not.
    expect(outlookAt(0, 0, 0, -9, 'typical')).toBe('neutral');
    expect(outlookAt(0, 0, 0, 9, 'typical')).toBe('neutral');
    expect(outlookAt(0, 0, 0, -1.5, 'typical')).toBe('range-bound');
    expect(outlookAt(0, 0, 0, 1.5, 'typical')).toBe('range-bound');
    // And a move big enough to leave the range bar is the same in both directions
    expect(outlookAt(2, 1, 0, -1.5, 'typical')).toBe('range-bound');
    expect(outlookAt(2, 1, 0, 1.5, 'typical')).toBe('range-bound');
  });
});
