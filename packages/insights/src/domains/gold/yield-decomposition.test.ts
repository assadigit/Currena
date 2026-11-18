/**
 * yield-decomposition.test.ts — GPE R12 / F5: the decomposition's math,
 * pinned (s7/01 §4 Chain 3). The exact relation (real + breakeven =
 * nominal, the breakeven derived at the 2-decimal presentation), the
 * fail-closed rules (a missing leg → dashes; mismatched as-ofs → no
 * derived breakeven), the float discipline (no 2.1999999999999997), and
 * the recorded 2026-11-16/17 live values as the frozen scenario (the
 * s4/04 §2f verification: 5.12 − 2.92 = 2.20 = the T10YIE family).
 */

import { describe, expect, it } from 'vitest';

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { yieldDecomposition } from './yield-decomposition';

const NOW = '2026-11-18T04:10:00.000Z';

function reading(id: IndicatorId, extra: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: '2026-11-17',
    status: 'normal',
    sourceName: 't',
    updatedAt: NOW,
    ...extra,
  } as IndicatorReading;
}

describe('yieldDecomposition — the stack (s7/01 §4 item 1)', () => {
  it('four legs in fixed order: nominal · real · breakeven (derived) · term premium', () => {
    const d = yieldDecomposition([
      reading('us10y', { value: 5.12, asOf: '2026-11-17', sourceName: 'U.S. Department of the Treasury (daily par yield curve)', change30d: 0.03 }),
      reading('real-yield-10y', { value: 2.92, asOf: '2026-11-17', sourceName: 'U.S. Department of the Treasury (daily real yield curve)', change30d: 0.18 }),
      reading('term-premium-10y', { value: 0.9864, asOf: '2026-11-13', sourceName: 'Federal Reserve Board (Kim-Wright) via FRED (THREEFYTP10)', change30d: -0.0595 }),
    ]);
    expect(d.legs.map((l) => l.id)).toEqual(['nominal-10y', 'real-10y', 'breakeven-10y', 'term-premium-10y']);
    expect(d.complete).toBe(true);
    // The recorded live values (2026-11-16/17): 5.12 − 2.92 = 2.20.
    expect(d.legs[0]!.value).toBe(5.12);
    expect(d.legs[1]!.value).toBe(2.92);
    expect(d.legs[2]!.value).toBe(2.2); // NOT 2.1999999999999997 — the 2dp quantization
    expect(d.legs[2]!.derived).toBe(true);
    expect(d.legs[2]!.asOf).toBe('2026-11-17');
    expect(d.legs[2]!.sourceName).toContain('derived: nominal − real');
    expect(d.legs[3]!.value).toBe(0.9864);
    expect(d.legs[3]!.sourceName).toContain('Kim-Wright'); // the model provenance rides the leg
  });

  it('the EXACT identity: real + breakeven = nominal (by the derivation, to the cent)', () => {
    const d = yieldDecomposition([
      reading('us10y', { value: 5.12 }),
      reading('real-yield-10y', { value: 2.92 }),
      reading('term-premium-10y', { value: 0.99 }),
    ]);
    expect(d.identityHolds).toBe(true);
    expect(d.legs[1]!.value! + d.legs[2]!.value!).toBeCloseTo(d.legs[0]!.value!, 10);
  });

  it('"which piece moved this month": each leg carries its signed 30-day change; the derived leg is Δnominal − Δreal', () => {
    const d = yieldDecomposition([
      reading('us10y', { value: 5.12, change30d: 0.03 }),
      reading('real-yield-10y', { value: 2.92, change30d: 0.18 }),
      reading('term-premium-10y', { value: 0.99, change30d: -0.0595 }),
    ]);
    expect(d.legs[0]!.delta30d).toBe(0.03);
    expect(d.legs[1]!.delta30d).toBe(0.18);
    expect(d.legs[2]!.delta30d).toBeCloseTo(-0.15, 10); // 0.03 − 0.18, 2dp
    expect(d.legs[3]!.delta30d).toBe(-0.0595);
  });
});

describe('yieldDecomposition — the fail-closed rules (Agent Rule 5)', () => {
  it('a missing leg renders null (dashes), never a guess', () => {
    const d = yieldDecomposition([
      reading('us10y', { value: 5.12 }),
      reading('real-yield-10y', { value: 2.92 }),
      // term-premium-10y absent
    ]);
    expect(d.legs[3]!.value).toBeNull();
    expect(d.complete).toBe(false);
    // The market pair still decomposes.
    expect(d.legs[2]!.value).toBe(2.2);
    expect(d.identityHolds).toBe(true);
  });

  it('MISMATCHED as-ofs → NO derived breakeven (a mixed-date subtraction is skew, not data)', () => {
    const d = yieldDecomposition([
      reading('us10y', { value: 5.1, asOf: '2026-11-17' }), // the Treasury tail is fresher
      reading('real-yield-10y', { value: 2.92, asOf: '2026-11-16' }), // the mirror lags
      reading('term-premium-10y', { value: 0.99 }),
    ]);
    expect(d.legs[2]!.value).toBeNull();
    expect(d.legs[2]!.asOf).toBeNull();
    expect(d.complete).toBe(false);
    expect(d.identityHolds).toBe(false);
  });

  it('non-finite change windows render null deltas', () => {
    const d = yieldDecomposition([
      reading('us10y', { value: 5.12, change30d: Number.NaN }),
      reading('real-yield-10y', { value: 2.92 }),
    ]);
    expect(d.legs[0]!.delta30d).toBeNull();
    expect(d.legs[2]!.delta30d).toBeNull();
  });

  it('an absent pair renders all-dark market legs (the card is honest, never partial)', () => {
    const d = yieldDecomposition([]);
    expect(d.legs.every((l) => l.value === null)).toBe(true);
    expect(d.complete).toBe(false);
  });
});
