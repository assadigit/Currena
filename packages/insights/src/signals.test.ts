/**
 * signals.test.ts — the "What the signals say" card logic (I17, UI spec
 * Blocks S1–S3). Synthetic readings only (AGENTS.md rule 7); the live-like
 * case pins the shipped reading against the 2026-10-08 production snapshot
 * (2 of 5 conditions met, lean mixed).
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { evaluateSignal, evaluateSignals } from './signals';

const BASE = '2026-10-08T04:20:11Z';

function reading(id: IndicatorId, fields: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: '2026-10-07',
    status: 'normal',
    sourceName: 'test',
    updatedAt: BASE,
    ...fields,
  } as IndicatorReading;
}

/** The live-like production snapshot inputs (2026-10-08). */
function liveReadings(): IndicatorReading[] {
  return [
    reading('real-yield-10y', { value: 2.91, change30d: 0.48, percentile10y: 0.998, status: 'warning' }),
    reading('breakeven-5y5y', { value: 2.35, change30d: 0.02, percentile10y: 0.901, status: 'warning' }),
    reading('stress-stlfsi', { value: -0.4681, change30d: 0.38 }),
    reading('nfci', { value: -0.494, change30d: 0.055 }),
    reading('dollar-basket', { value: 102.41, change30d: 3.44, percentile10y: 0.748 }),
    reading('gold-usd', { value: 4125.8, status: 'context', percentile10y: 0.925 }),
    reading('silver-usd', { value: 49.6, status: 'context', percentile10y: 0.93 }),
    reading('china-pmi', { value: 50.1, change30d: 0.3 }),
    reading('copper-gold', { value: 3.35, change30d: 0.103, percentile10y: 0.212 }),
  ];
}

describe('evaluateSignal — gold (S1)', () => {
  it('live-like: 2 of 5 met, lean mixed, footing via position fallback, speed accruing', () => {
    const r = evaluateSignal('gold', liveReadings());
    expect(r.priceId).toBe('gold-usd');
    expect(r.conditions.map((c) => [c.key, c.state])).toEqual([
      ['real-yield', 'against'], // 2.91 high and rising
      ['expectations', 'supportive'], // 90th percentile, steady
      ['stress', 'against'], // both indices below zero
      ['dollar', 'against'], // basket rising
      ['footing', 'supportive'], // no change30d yet, 92.5th percentile
    ]);
    expect(r.metCount).toBe(2);
    expect(r.lean).toBe('mixed');
    expect(r.position).toEqual({ band: 'high', percentile: 0.925 });
    expect(r.speed).toBeNull();
  });

  it('all five supportive → mostly supportive', () => {
    const r = evaluateSignal('gold', [
      reading('real-yield-10y', { change30d: -0.4, percentile10y: 0.1 }),
      reading('breakeven-5y5y', { change30d: 0.3, percentile10y: 0.95 }),
      reading('stress-stlfsi', { value: 0.5 }),
      reading('nfci', { value: -0.2 }),
      reading('dollar-basket', { change30d: -2, percentile10y: 0.2 }),
      reading('gold-usd', { change30d: 4, percentile10y: 0.9 }),
    ]);
    expect(r.metCount).toBe(5);
    expect(r.lean).toBe('mostly-supportive');
  });

  it('four against (one neutral) → mostly unsupportive; neutral counts toward neither', () => {
    const r = evaluateSignal('gold', [
      reading('real-yield-10y', { change30d: 0.4, percentile10y: 0.95 }),
      reading('breakeven-5y5y', { change30d: 0.02, percentile10y: 0.5 }), // neutral
      reading('stress-stlfsi', { value: -0.4 }),
      reading('nfci', { value: -0.4 }),
      reading('dollar-basket', { change30d: 2, percentile10y: 0.9 }),
      reading('gold-usd', { change30d: -4, percentile10y: 0.6 }),
    ]);
    expect(r.metCount).toBe(0);
    expect(r.lean).toBe('mostly-unsupportive');
  });

  it('footing uses change30d once the daily history accrues (negative → against)', () => {
    const r = evaluateSignal('gold', [
      ...liveReadings(),
      reading('gold-usd', { value: 3900, status: 'context', percentile10y: 0.925, change30d: -5.5 }),
    ]);
    expect(r.conditions.find((c) => c.key === 'footing')?.state).toBe('against');
    expect(r.speed).toBe(-5.5);
  });

  it('stale inputs freeze their condition as unknown without breaking the rest', () => {
    const readings = liveReadings();
    const ry = readings.find((x) => x.id === 'real-yield-10y')!;
    ry.status = 'stale';
    const r = evaluateSignal('gold', readings);
    expect(r.conditions.find((c) => c.key === 'real-yield')?.state).toBe('unknown');
    expect(r.metCount).toBe(2); // expectations + footing still readable
    expect(r.lean).toBe('mixed');
  });

  it('nothing readable at all → null lean, honest zeros', () => {
    const r = evaluateSignal('gold', [
      reading('gold-usd', { status: 'unavailable', value: null, asOf: null }),
    ]);
    expect(r.lean).toBeNull();
    expect(r.metCount).toBe(0);
    expect(r.position).toBeNull();
  });
});

describe('evaluateSignal — silver (S2)', () => {
  it('reuses the five gold conditions and adds industrial demand (6 total)', () => {
    const r = evaluateSignal('silver', liveReadings());
    expect(r.priceId).toBe('silver-usd');
    expect(r.conditions).toHaveLength(6);
    expect(r.conditions[5]!.key).toBe('industrial');
    expect(r.conditions[5]!.inputs).toEqual(['china-pmi', 'copper-gold']);
    // copper-gold ratio rising 0.103 > 0.08 → supportive
    expect(r.conditions[5]!.state).toBe('supportive');
    expect(r.metCount).toBe(3); // expectations + footing + industrial
    expect(r.lean).toBe('mixed');
  });

  it('industrial demand: both legs soft → against; split or flat → neutral', () => {
    const soft = evaluateSignal('silver', [
      ...liveReadings(),
      reading('china-pmi', { value: 49.4, change30d: -0.5 }),
      reading('copper-gold', { value: 3.1, change30d: -0.2, percentile10y: 0.15 }),
    ]);
    expect(soft.conditions.find((c) => c.key === 'industrial')?.state).toBe('against');

    const flat = evaluateSignal('silver', [
      ...liveReadings(),
      reading('china-pmi', { value: 50.1, change30d: 0.1 }),
      reading('copper-gold', { value: 3.35, change30d: 0.02, percentile10y: 0.45 }),
    ]);
    expect(flat.conditions.find((c) => c.key === 'industrial')?.state).toBe('neutral');
  });

  it('silver reaches mostly supportive at 4 of 6 met', () => {
    const r = evaluateSignal('silver', [
      reading('real-yield-10y', { change30d: -0.4, percentile10y: 0.1 }),
      reading('breakeven-5y5y', { change30d: 0.3, percentile10y: 0.95 }),
      reading('stress-stlfsi', { value: 0.5 }),
      reading('nfci', { value: 0.2 }),
      reading('dollar-basket', { change30d: -2, percentile10y: 0.2 }),
      reading('gold-usd', { change30d: 4, percentile10y: 0.9 }),
      reading('silver-usd', { change30d: 5, percentile10y: 0.9 }),
      reading('china-pmi', { value: 50.1, change30d: 0.1 }), // neutral industrial
      reading('copper-gold', { value: 3.35, change30d: 0.02, percentile10y: 0.45 }),
    ]);
    // real-yield, expectations, stress, dollar, footing = 5 supportive
    expect(r.metCount).toBe(5);
    expect(r.lean).toBe('mostly-supportive');
  });
});

describe('evaluateSignals — both cards', () => {
  it('returns gold then silver', () => {
    const { gold, silver } = evaluateSignals(liveReadings());
    expect(gold.metal).toBe('gold');
    expect(silver.metal).toBe('silver');
    expect(gold.conditions).toHaveLength(5);
    expect(silver.conditions).toHaveLength(6);
  });
});
