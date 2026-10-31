/**
 * breakeven-tilt.test.ts — the G2 interplay (Session 3,
 * GOLD_FRED_GAPFILL_SPEC §3): the derived series (T5YIFR − T5YIE on common
 * dates, zero new fetches) and the pure lean selection the gold panel's
 * inflation-lane phrase reads. The card stayed context-only through S3–S5
 * (the 20-voter freeze); Session 6 (the D-5 promotion, the owner's "we can
 * have 21") promoted it to the 21st GOLD VOTER — the phrase feature below
 * is UNCHANGED (it still renders beside the lane word), and this file's
 * D-5 block now pins the PROMOTED membership so a future edit cannot
 * silently drop or duplicate it.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading } from '@currena/core';
import { BREAKEVEN_TILT_DEADBAND_PT, breakevenTiltLean } from './breakeven-tilt';
import { GOLD_LANE_VOTERS } from './gold-score';
import { buildIndicatorSeries } from './adapters/derived';
import type { SeriesPoint } from './series';

function pts(spec: Record<string, number>): SeriesPoint[] {
  return Object.entries(spec).map(([date, value]) => ({ date, value }));
}

function reading(extra: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: 'breakeven-tilt',
    value: 0,
    asOf: '2026-10-29',
    status: 'normal',
    sourceName: 't',
    updatedAt: '2026-10-30T04:10:00.000Z',
    ...extra,
  };
}

describe('the derived series (buildIndicatorSeries)', () => {
  it('T5YIFR − T5YIE on their common dates, 4dp quantized — zero new fetches', () => {
    const out = buildIndicatorSeries({
      today: '2026-10-30',
      fx: {},
      fred: {
        T5YIFR: pts({ '2026-10-27': 2.20, '2026-10-28': 2.21, '2026-10-29': 2.23 }),
        T5YIE: pts({ '2026-10-27': 2.42, '2026-10-28': 2.47, '2026-10-30': 2.50 }),
      },
    });
    // 10-27 and 10-28 are common; 10-29 lacks the spot leg, 10-30 the
    // forward leg — the inner join drops both, never a carried guess.
    expect(out['breakeven-tilt']).toEqual([
      { date: '2026-10-27', value: -0.22 },
      { date: '2026-10-28', value: Math.round((2.21 - 2.47) * 1e4) / 1e4 },
    ]);
  });

  it('either leg absent → no series (the reading reads unavailable, never half-derived)', () => {
    expect(
      buildIndicatorSeries({ today: '2026-10-30', fx: {}, fred: { T5YIFR: pts({ '2026-10-27': 2.2 }) } })['breakeven-tilt'],
    ).toBeUndefined();
    expect(
      buildIndicatorSeries({ today: '2026-10-30', fx: {}, fred: { T5YIE: pts({ '2026-10-27': 2.4 }) } })['breakeven-tilt'],
    ).toBeUndefined();
  });

  it('the float-noise class is quantized away (F4)', () => {
    const out = buildIndicatorSeries({
      today: '2026-10-30',
      fx: {},
      fred: {
        T5YIFR: pts({ '2026-10-27': 2.47 }),
        T5YIE: pts({ '2026-10-27': 2.32 }),
      },
    });
    expect(out['breakeven-tilt']![0]!.value).toBe(0.15); // not 0.15000000000000013
  });
});

describe('breakevenTiltLean — the pure phrase selection', () => {
  it('positive beyond the deadband → building (the spec\'s own definition)', () => {
    expect(breakevenTiltLean(reading({ value: 0.24 }))).toBe('building');
    expect(breakevenTiltLean(reading({ value: 0.1 }))).toBe('building'); // exactly at the band → reads
  });

  it('negative beyond the deadband → fading', () => {
    expect(breakevenTiltLean(reading({ value: -0.24 }))).toBe('fading');
    expect(breakevenTiltLean(reading({ value: -0.1 }))).toBe('fading');
  });

  it('inside the deadband → steady', () => {
    expect(breakevenTiltLean(reading({ value: 0.05 }))).toBe('steady');
    expect(breakevenTiltLean(reading({ value: -0.05 }))).toBe('steady');
    expect(breakevenTiltLean(reading({ value: 0 }))).toBe('steady');
    expect(BREAKEVEN_TILT_DEADBAND_PT).toBe(0.1);
  });

  it('unreadable statuses → null (the phrase renders nowhere, never a guess)', () => {
    expect(breakevenTiltLean(undefined)).toBeNull();
    expect(breakevenTiltLean(reading({ status: 'stale', value: 0.3 }))).toBeNull();
    expect(breakevenTiltLean(reading({ status: 'unavailable' }))).toBeNull();
    expect(breakevenTiltLean(reading({ status: 'check-pending', value: 0.3 }))).toBeNull();
  });

  it('a null value → null', () => {
    expect(breakevenTiltLean(reading({ value: null }))).toBeNull();
  });

  it('the live snapshot\'s actual tilt (T5YIFR 2.23 − T5YIE 2.47) reads fading', () => {
    expect(breakevenTiltLean(reading({ value: -0.24 }))).toBe('fading');
  });
});

describe('D-5 — the promotion pinned (Session 6)', () => {
  it('breakeven-tilt IS the 21st gold voter: exactly one entry, inflation lane, polarity +1, the last seat', () => {
    expect(GOLD_LANE_VOTERS).toHaveLength(21);
    const tilt = GOLD_LANE_VOTERS.filter((v) => v.id === 'breakeven-tilt');
    expect(tilt).toHaveLength(1);
    expect(tilt[0]).toEqual({ lane: 'inflation', id: 'breakeven-tilt', polarity: 1 });
    expect(GOLD_LANE_VOTERS[GOLD_LANE_VOTERS.length - 1]!.id).toBe('breakeven-tilt'); // the B4-measured shape: the frozen 20 + the tilt at the end
  });

  it('the phrase selector stays the level-deadband read it always was (context phrase, not the voter lean)', () => {
    // The panel phrase (building/fading/steady at the 0.1pt deadband) and
    // the voter lean (the shared evaluator's decade position) are DIFFERENT
    // reads of the same card — both kept, neither aliased to the other.
    expect(breakevenTiltLean(reading({ value: 0.24 }))).toBe('building');
    expect(breakevenTiltLean(reading({ value: -0.24 }))).toBe('fading');
    expect(breakevenTiltLean(reading({ value: 0 }))).toBe('steady');
  });
});
