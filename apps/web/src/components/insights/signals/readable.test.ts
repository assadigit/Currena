/**
 * signals/readable.test.ts — pins the per-condition readability rule the
 * gold/silver balance weighs by (UI_SPEC §9 UI-40, task PH6-B, 2026-10-20).
 *
 * The rule mirrors each S1–S3 evaluator's own inputs (see signals/readable.ts):
 * a condition is readable when its driver reading exists, is not
 * stale/check-pending/unavailable, AND the condition actually computed —
 * a fresh reading with too little data to compute a lean is NOT readable
 * (it renders as a dashed token and never enters the tilt).
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { isConditionReadable } from './readable';

function reading(id: IndicatorId, fields: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: '2026-10-07',
    status: 'normal',
    sourceName: 't',
    updatedAt: '2026-10-08T00:00:00Z',
    ...fields,
  } as IndicatorReading;
}

const byIdOf = (rows: IndicatorReading[]): ReadonlyMap<string, IndicatorReading> =>
  new Map(rows.map((r) => [r.id as string, r]));

describe("isConditionReadable (the balance UI-40 rule)", () => {
  it('real-yield: fresh + a lean input is readable; stale or dataless is not', () => {
    expect(
      isConditionReadable('real-yield', byIdOf([reading('real-yield-10y', { change30d: 0.06, percentile10y: 0.62 })]), 'gold-usd'),
    ).toBe(true);
    // fresh but nothing to compute a lean from → not readable
    expect(isConditionReadable('real-yield', byIdOf([reading('real-yield-10y')]), 'gold-usd')).toBe(false);
    // level alone still computes (a decade extreme leans while steady)
    expect(
      isConditionReadable('real-yield', byIdOf([reading('real-yield-10y', { percentile10y: 0.95 })]), 'gold-usd'),
    ).toBe(true);
    expect(
      isConditionReadable(
        'real-yield',
        byIdOf([reading('real-yield-10y', { status: 'stale', change30d: 0.06 })]),
        'gold-usd',
      ),
    ).toBe(false);
    expect(isConditionReadable('real-yield', byIdOf([]), 'gold-usd')).toBe(false);
  });

  it('expectations: rides the breakeven reading alone', () => {
    expect(isConditionReadable('expectations', byIdOf([reading('breakeven-5y5y')]), 'gold-usd')).toBe(true);
    expect(
      isConditionReadable('expectations', byIdOf([reading('breakeven-5y5y', { status: 'check-pending' })]), 'gold-usd'),
    ).toBe(false);
    expect(
      isConditionReadable('expectations', byIdOf([reading('breakeven-5y5y', { status: 'unavailable' })]), 'gold-usd'),
    ).toBe(false);
  });

  it('stress: BOTH indices must be fresh and at least one value present', () => {
    const fresh = [reading('stress-stlfsi', { value: 0.42 }), reading('nfci', { value: -0.98 })];
    expect(isConditionReadable('stress', byIdOf(fresh), 'gold-usd')).toBe(true);
    // one index held → unreadable (the engine folds it into 'unknown')
    expect(
      isConditionReadable('stress', byIdOf([reading('stress-stlfsi', { status: 'check-pending', value: 0.42 }), reading('nfci')]), 'gold-usd'),
    ).toBe(false);
    // both fresh but valueless → nothing computed
    expect(
      isConditionReadable('stress', byIdOf([reading('stress-stlfsi', { value: null }), reading('nfci', { value: null })]), 'gold-usd'),
    ).toBe(false);
  });

  it('dollar: fresh + a lean input (mirrors the real-yield rule)', () => {
    expect(
      isConditionReadable('dollar', byIdOf([reading('dollar-basket', { change30d: 2.86, percentile10y: 0.79 })]), 'gold-usd'),
    ).toBe(true);
    expect(
      isConditionReadable('dollar', byIdOf([reading('dollar-basket', { status: 'stale', change30d: 2.86 })]), 'gold-usd'),
    ).toBe(false);
  });

  it('footing: reads the METAL OWN price row — gold and silver are independent', () => {
    const goldFresh = [reading('gold-usd', { change30d: 2.9 })];
    expect(isConditionReadable('footing', byIdOf(goldFresh), 'gold-usd')).toBe(true);
    // silver unreadable while gold is fine — and the other way round
    expect(isConditionReadable('footing', byIdOf([...goldFresh, reading('silver-usd', { status: 'stale' })]), 'silver-usd')).toBe(false);
    // no change30d, no percentile → nothing computed (the I16 case)
    expect(isConditionReadable('footing', byIdOf([reading('gold-usd')]), 'gold-usd')).toBe(false);
  });

  it('industrial: both China PMI + copper-to-gold fresh, at least one with a lean input', () => {
    const both = [reading('china-pmi', { change30d: 0.3 }), reading('copper-gold', { percentile10y: 0.5 })];
    expect(isConditionReadable('industrial', byIdOf(both), 'silver-usd')).toBe(true);
    // PMI unavailable (the fixture's manual-entry expiry) → unreadable
    expect(
      isConditionReadable('industrial', byIdOf([reading('china-pmi', { status: 'unavailable', value: null }), reading('copper-gold', { percentile10y: 0.5 })]), 'silver-usd'),
    ).toBe(false);
    // both fresh but neither carries a lean input → not computed
    expect(isConditionReadable('industrial', byIdOf([reading('china-pmi'), reading('copper-gold')]), 'silver-usd')).toBe(false);
  });
});
