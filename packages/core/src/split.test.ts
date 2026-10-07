import { describe, expect, it } from 'vitest';
import { splitEvenly, SplitError } from './split';

describe('splitEvenly (BACKLOG #30 — promoted from the Splitter route)', () => {
  it('sums to EXACTLY the total after rounding — no cent drift', () => {
    for (const [total, people, decimals] of [
      [100, 3, 2],
      [10, 4, 0],
      [0.05, 3, 2],
      [99.99, 7, 2],
      [1_234.56, 5, 2],
    ] as const) {
      const shares = splitEvenly(total, people, decimals);
      expect(shares).toHaveLength(people);
      const sum = shares.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(Math.round(total * 10 ** decimals) / 10 ** decimals, 10);
    }
  });

  it('distributes the remainder to the earliest people (largest remainder)', () => {
    // 100 over 3 at 2 decimals: 33.34, 33.33, 33.33.
    expect(splitEvenly(100, 3, 2)).toEqual([33.34, 33.33, 33.33]);
    // 10 over 4 at 0 decimals: 3, 3, 2, 2.
    expect(splitEvenly(10, 4, 0)).toEqual([3, 3, 2, 2]);
  });

  it('shares differ by at most one unit of the last decimal place', () => {
    const shares = splitEvenly(99.99, 7, 2);
    const min = Math.min(...shares);
    const max = Math.max(...shares);
    expect(max - min).toBeLessThanOrEqual(0.01);
  });

  it('handles the single-person and exact-division cases', () => {
    expect(splitEvenly(41.25, 1, 2)).toEqual([41.25]);
    expect(splitEvenly(9, 3, 2)).toEqual([3, 3, 3]);
  });

  it('rounds the TOTAL to the requested precision first', () => {
    // 0.1 + 0.2 style float noise must not leak into the shares.
    const shares = splitEvenly(0.30000000000000004, 3, 2);
    expect(shares).toEqual([0.1, 0.1, 0.1]);
  });

  it('throws typed SplitError on invalid arguments', () => {
    expect(() => splitEvenly(10, 0, 2)).toThrow(SplitError);
    expect(() => splitEvenly(10, 0, 2)).toThrow(/people/);
    expect(() => splitEvenly(10, 2.5, 2)).toThrow(SplitError);
    expect(() => splitEvenly(10, 3, -1)).toThrow(SplitError);
    expect(() => splitEvenly(10, 3, 7)).toThrow(SplitError);
    expect(() => splitEvenly(Number.POSITIVE_INFINITY, 3, 2)).toThrow(SplitError);
    let code = '';
    try {
      splitEvenly(10, 0, 2);
    } catch (err) {
      code = err instanceof SplitError ? err.code : String(err);
    }
    expect(code).toBe('invalid_people');
  });
});
