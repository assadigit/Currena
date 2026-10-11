/**
 * money-direction.test.ts — round 25: the stated estimation under every
 * "What it means for my money" row (owner request: a short "will go up /
 * will go down" line, computed from data). The guards:
 *
 *   - vote priority: published band breach > big move (|moveScore| ≥ 2)
 *     > 10-year extreme level;
 *   - growth-kind drivers NEVER earn a "cheaper" (down) vote from a low
 *     percentile — rent growth at its 10-year low still means rents
 *     RISING, just slower; a "cheaper" claim needs a level series
 *     actually falling;
 *   - inverse FX sign: a FALLING AUD pushes petrol and overseas costs UP;
 *   - the tally: majority wins, tie or silence → flat;
 *   - the valence ink: cost areas warn red on the way up and reassure
 *     green on the way down; savings flips (more interest is the good
 *     case); flat is neutral in every area;
 *   - the live-shaped regression: today's panel (oil at a 10-year high
 *     surging + a weak AUD, both inflation gauges above the RBA band,
 *     the cash rate at its 10-year high) reads up on the rows the owner
 *     sketched.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import {
  moneyAreaDirection,
  moneyDirectionToneClass,
  moneyDriverVote,
  MONEY_DRIVER_KIND,
} from './config';

function reading(partial: Partial<IndicatorReading> & { id: IndicatorReading['id'] }): IndicatorReading {
  return {
    value: 1,
    asOf: '2026-10-11',
    status: 'normal',
    sourceName: 't',
    updatedAt: '2026-10-11T04:20:00.000Z',
    ...partial,
  } as IndicatorReading;
}

const WORD_TONE = {
  alert: 'text-[var(--color-status-alert)]',
  normal: 'text-[var(--color-status-normal)]',
  neutral: '',
};

describe('moneyDriverVote — one driver, one vote, priority order', () => {
  it('band breach wins first (CPI above the RBA 2–3% band → up, even with a quiet moveScore)', () => {
    const r = reading({ id: 'au-cpi', value: 3.94, status: 'warning', moveScore: -0.24 });
    expect(moneyDriverVote('growth', r, { min: 2, max: 3 })).toBe('up');
  });

  it('a band breach on an inverse driver flips too (an AUD crashed under its floor → dearer imports → up)', () => {
    const r = reading({ id: 'audusd', value: 0.4 });
    expect(moneyDriverVote('inverse', r, { min: 0.5 })).toBe('up');
  });

  it('a statistically big move votes by sign for a direct driver', () => {
    const brent = reading({ id: 'brent', value: 125.44, moveScore: 7.16, percentile10y: 0.99 });
    expect(moneyDriverVote('direct', brent)).toBe('up');
    const falling = reading({ id: 'brent', value: 60, moveScore: -3.1 });
    expect(moneyDriverVote('direct', falling)).toBe('down');
  });

  it('the move vote respects the jumping threshold (|moveScore| < 2 does not vote)', () => {
    const quiet = reading({ id: 'brent', value: 80, moveScore: 1.99 });
    expect(moneyDriverVote('direct', quiet)).toBeNull();
  });

  it('an inverse driver flips the move sign (a falling AUD makes imports and travel dearer)', () => {
    const weakAud = reading({ id: 'audusd', value: 0.698, moveScore: -5.45 });
    expect(moneyDriverVote('inverse', weakAud)).toBe('up');
    const strongAud = reading({ id: 'audusd', value: 0.76, moveScore: 3.2 });
    expect(moneyDriverVote('inverse', strongAud)).toBe('down');
  });

  it('a 10-year extreme votes when there is no band and no big move', () => {
    const high = reading({ id: 'rba-cash-rate', value: 4.36, percentile10y: 1.0 });
    expect(moneyDriverVote('direct', high)).toBe('up');
    const low = reading({ id: 'brent', value: 35, percentile10y: 0.05 });
    expect(moneyDriverVote('direct', low)).toBe('down');
  });

  it('a growth series below its range stays SILENT — rents rising 3.6% yoy is not "rents will get cheaper"', () => {
    const rent = reading({ id: 'au-rent-yoy', value: 3.58, percentile10y: 0.08, moveScore: 0.43 });
    expect(MONEY_DRIVER_KIND['au-rent-yoy']).toBe('growth');
    expect(moneyDriverVote('growth', rent)).toBeNull();
  });

  it('a growth series never claims "cheaper", even on a big negative move (easing ≠ cheaper)', () => {
    const cooling = reading({ id: 'au-cpi', value: 2.4, moveScore: -2.6 });
    expect(moneyDriverVote('growth', cooling, { min: 2, max: 3 })).toBeNull();
    expect(moneyDriverVote('growth', cooling)).toBeNull();
  });

  it('a growth series still votes up on a big acceleration', () => {
    const surging = reading({ id: 'au-petrol-yoy', value: 13.5, moveScore: 2.4, percentile10y: 0.74 });
    expect(moneyDriverVote('growth', surging)).toBe('up');
  });

  it('consequence indicators (debt arrears) and unknown kinds abstain', () => {
    const arrears = reading({ id: 'au-household-debt-arrears', value: 178, percentile10y: 0.16 });
    expect(moneyDriverVote('none', arrears)).toBeNull();
    expect(moneyDriverVote(undefined, arrears)).toBeNull();
  });

  it('an unavailable reading never votes', () => {
    const r = reading({ id: 'brent', value: null, status: 'unavailable', moveScore: 5 });
    expect(moneyDriverVote('direct', r)).toBeNull();
  });
});

describe('moneyAreaDirection — the row verdict is the majority of its drivers', () => {
  const copy = insightsCopyEn;

  it('the owner\'s example, live-shaped: petrol reads UP (oil at a 10-year high and surging, weak AUD)', () => {
    const readings = [
      reading({ id: 'brent', value: 125.44, status: 'warning', percentile10y: 0.99, moveScore: 7.16, change30d: 22.7 }),
      reading({ id: 'au-petrol-yoy', value: 13.5, status: 'context', percentile10y: 0.74 }),
      reading({ id: 'audusd', value: 0.698, moveScore: -5.45, change30d: -3.37 }),
    ];
    expect(moneyAreaDirection('petrol', readings, copy)).toBe('up');
  });

  it('savings reads UP today (cash rate at its 10-year high, CPI above the band)', () => {
    const readings = [
      reading({ id: 'rba-cash-rate', value: 4.36, status: 'context', percentile10y: 1.0, change30d: 0.01 }),
      reading({ id: 'au-cpi', value: 3.94, status: 'warning', percentile10y: 0.76 }),
    ];
    expect(moneyAreaDirection('savings', readings, copy)).toBe('up');
  });

  it('home loan reads UP today (both rate drivers at 10-year extremes; the quiet rent growth stays silent)', () => {
    const readings = [
      reading({ id: 'rba-cash-rate', value: 4.36, status: 'context', percentile10y: 1.0 }),
      reading({ id: 'au-home-loan', value: 6.2, status: 'warning', percentile10y: 0.95, moveScore: -0.24, change30d: 0 }),
      reading({ id: 'au-rent-yoy', value: 3.58, percentile10y: 0.08, moveScore: 0.43, change30d: -0.051 }),
      reading({ id: 'au-household-debt-arrears', value: 178, percentile10y: 0.16 }),
    ];
    expect(moneyAreaDirection('homeLoan', readings, copy)).toBe('up');
  });

  it('a tie resolves to flat (overseas: weak AUD pushes up, a falling USD basket pushes down)', () => {
    const readings = [
      reading({ id: 'audusd', value: 0.7, moveScore: -5.45 }),
      reading({ id: 'audjpy', value: 95, percentile10y: 0.4 }),
      reading({ id: 'dollar-basket', value: 99, moveScore: -3.2 }),
    ];
    expect(moneyAreaDirection('overseas', readings, copy)).toBe('flat');
  });

  it('all-silent drivers → flat (jobs/pay never votes: mixed semantics, no direction claimed)', () => {
    const readings = [
      reading({ id: 'au-unemployment', value: 4.6, status: 'warning', percentile10y: 0.5 }),
      reading({ id: 'au-wage-growth', value: 3.2, status: 'warning', percentile10y: 0.62 }),
    ];
    expect(moneyAreaDirection('jobs', readings, copy)).toBe('flat');
  });

  it('a real falling regime reads DOWN (RBA cutting: the cash rate and the paid rate drop hard)', () => {
    const readings = [
      reading({ id: 'rba-cash-rate', value: 3.1, percentile10y: 0.4, moveScore: -2.8, change30d: -0.25 }),
      reading({ id: 'au-home-loan', value: 5.4, percentile10y: 0.5, moveScore: -2.9, change30d: -0.4 }),
      reading({ id: 'au-rent-yoy', value: 2.9, percentile10y: 0.3, moveScore: -0.4 }),
      reading({ id: 'au-household-debt-arrears', value: 150, percentile10y: 0.4 }),
    ];
    expect(moneyAreaDirection('homeLoan', readings, copy)).toBe('down');
  });
});

describe('moneyDirectionToneClass — the ink is VALENCE-coded', () => {
  it('cost areas: up is the squeeze (alert red), down is relief (green)', () => {
    expect(moneyDirectionToneClass('petrol', 'up')).toBe(WORD_TONE.alert);
    expect(moneyDirectionToneClass('petrol', 'down')).toBe(WORD_TONE.normal);
    expect(moneyDirectionToneClass('shop', 'up')).toBe(WORD_TONE.alert);
    expect(moneyDirectionToneClass('homeLoan', 'down')).toBe(WORD_TONE.normal);
    expect(moneyDirectionToneClass('overseas', 'up')).toBe(WORD_TONE.alert);
  });

  it('savings flips: more interest is the good case (up green, down red)', () => {
    expect(moneyDirectionToneClass('savings', 'up')).toBe(WORD_TONE.normal);
    expect(moneyDirectionToneClass('savings', 'down')).toBe(WORD_TONE.alert);
  });

  it('flat is neutral ink in every area', () => {
    for (const area of ['petrol', 'homeLoan', 'savings', 'shop', 'overseas', 'jobs'] as const) {
      expect(moneyDirectionToneClass(area, 'flat')).toBe(WORD_TONE.neutral);
    }
  });
});
