/**
 * lean.test.ts — the balance card's pure rules (owner spec
 * docs/insights/gold-card/03-LOGIC-AND-DATA-SPEC.md). Ports the pack's
 * reference lean-logic.test.js (all 13 checks keep their vectors) plus
 * the acceptance additions from 05-ACCEPTANCE-AND-TESTS.md §A.2:
 *   - all-unread gives verdict 'none'
 *   - silver with industrial demand unread and the other 4 read is enough
 *   - a missing flip hides the flip line
 *   - a stale reading becomes unread (fixture-side mapping; see the last
 *     block for the pure-rule consequence)
 */

import { describe, expect, it } from 'vitest';
import { computeLean, type LeanFactor } from './lean';

const mk = (P: number, S: number, N: number, U: number): LeanFactor[] => {
  const out: LeanFactor[] = [];
  let i = 0;
  const add = (n: number, state: LeanFactor['state']): void => {
    for (let k = 0; k < n; k++) out.push({ id: `f${i++}`, state });
  };
  add(P, 'pressures');
  add(S, 'supports');
  add(N, 'neutral');
  add(U, 'unread');
  return out;
};

describe('computeLean — the 10 spec vectors (gold total 4 / silver total 5)', () => {
  // P, S, N, U, enough, net, tilt, verdict, confidence
  const cases: [number, number, number, number, boolean, number, number, string, string][] = [
    [1, 0, 0, 3, false, 1, 0, 'insufficient', 'low'],
    [1, 0, 2, 1, true, 1, 3, 'slight_against', 'medium'],
    [2, 1, 1, 0, true, 1, 3, 'slight_against', 'high'],
    [3, 1, 0, 0, true, 2, 4.5, 'lean_against', 'high'],
    [4, 0, 0, 0, true, 4, 7, 'strong_against', 'high'],
    [2, 2, 0, 0, true, 0, 0, 'balanced', 'high'],
    [0, 3, 0, 1, true, -3, -6, 'strong_for', 'medium'],
    [0, 0, 0, 4, false, 0, 0, 'none', 'low'],
    [2, 1, 1, 1, true, 1, 3, 'slight_against', 'medium'], // silver, total 5
    [1, 1, 1, 2, false, 0, 0, 'insufficient', 'low'], // silver, total 5
  ];
  cases.forEach((c, i) => {
    it(`vector #${i + 1}`, () => {
      const r = computeLean(mk(c[0], c[1], c[2], c[3]));
      expect(r.enough).toBe(c[4]);
      expect(r.net).toBe(c[5]);
      expect(Math.abs(r.tilt - c[6])).toBeLessThan(1e-9);
      expect(r.verdict).toBe(c[7]);
      expect(r.confidence).toBe(c[8]);
    });
  });
});

describe('computeLean — the flip line', () => {
  it('picks the closest threshold and keys it flip_balance at |net| = 1', () => {
    const withFlip = mk(1, 0, 2, 1);
    withFlip[0]!.value = 2.78;
    withFlip[0]!.flip = { dir: 'below', at: 2.5 };
    const r = computeLean(withFlip);
    expect(r.flip).not.toBeNull();
    expect(r.flip!.factorId).toBe('f0');
    expect(r.flip!.key).toBe('flip_balance');
    expect(r.flip!.dir).toBe('below');
    expect(r.flip!.at).toBe(2.5);
  });

  it('keys flip_ease when |net| ≥ 2', () => {
    const fs = mk(3, 0, 1, 0);
    fs[0]!.value = 2.9;
    fs[0]!.flip = { dir: 'below', at: 2.5 };
    expect(computeLean(fs).flip!.key).toBe('flip_ease');
  });

  it('hides the line when no threshold exists (spec 05 A.2)', () => {
    expect(computeLean(mk(1, 0, 2, 1)).flip).toBeNull();
  });

  it('hides the line when coverage is insufficient (spec 05 A.2)', () => {
    expect(computeLean(mk(1, 0, 0, 3)).flip).toBeNull();
  });

  it('only considers heavier-side factors with a numeric value', () => {
    // A supports-side flip must never fire while pressures are heavier.
    const fs = mk(2, 1, 1, 0);
    fs[2]!.value = 2.2; // the supports factor
    fs[2]!.flip = { dir: 'above', at: 2.4 };
    expect(computeLean(fs).flip).toBeNull();
    // …and a heavier-side factor without a value does not qualify either.
    const noValue = mk(2, 1, 1, 0);
    noValue[0]!.flip = { dir: 'below', at: 2.5 };
    expect(computeLean(noValue).flip).toBeNull();
  });

  it('picks the RELATIVELY closest threshold (near-zero thresholds do not win by being small)', () => {
    const fs = mk(2, 0, 2, 0);
    fs[0]!.value = 2.78;
    fs[0]!.flip = { dir: 'below', at: 2.5 }; // |2.78−2.5| / 2.5 = 0.112
    fs[1]!.value = 0.05;
    fs[1]!.flip = { dir: 'below', at: 0 }; // |0.05−0| / 1e-9 → huge
    expect(computeLean(fs).flip!.factorId).toBe('f0');
  });
});

describe('computeLean — acceptance additions (05 §A.2)', () => {
  it('all-unread gives verdict none (and the beam stays level)', () => {
    const r = computeLean(mk(0, 0, 0, 4));
    expect(r.verdict).toBe('none');
    expect(r.tilt).toBe(0);
    expect(r.read).toBe(0);
    expect(r.confidence).toBe('low');
  });

  it('a stale reading counts as unread: the rule sees state "unread" (the repo maps stale → unread upstream), silver with industrial unread and 4 read is enough', () => {
    // Silver: 5 drivers, need ceil(0.75 × 5) = 4. Industrial unread, the
    // other four read (2 pressures, 1 support, 1 neutral).
    const silver = [
      { id: 'real', state: 'pressures' as const },
      { id: 'infl', state: 'neutral' as const },
      { id: 'stress', state: 'supports' as const },
      { id: 'usd', state: 'pressures' as const },
      { id: 'ind', state: 'unread' as const }, // ← the stale/unread driver
    ];
    const r = computeLean(silver);
    expect(r.total).toBe(5);
    expect(r.need).toBe(4);
    expect(r.read).toBe(4);
    expect(r.enough).toBe(true);
    expect(r.net).toBe(1);
    expect(r.tilt).toBe(3);
    expect(r.verdict).toBe('slight_against');
    expect(r.confidence).toBe('medium');
  });

  it('the tilt caps at 7° and stays 0 for balanced/insufficient', () => {
    expect(computeLean(mk(5, 0, 0, 0)).tilt).toBe(7);
    expect(computeLean(mk(0, 5, 0, 0)).tilt).toBe(-7);
    expect(computeLean(mk(2, 2, 1, 0)).tilt).toBe(0);
  });

  it('empty factor list: none, level, coverage 0', () => {
    const r = computeLean([]);
    expect(r.verdict).toBe('none');
    expect(r.coverage).toBe(0);
    expect(r.total).toBe(0);
  });
});
