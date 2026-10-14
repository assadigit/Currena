/**
 * Shared numeric helpers for the fx engine (Phase 3 split of the former
 * compute.ts monolith). Pure, dependency-free.
 */

/** A change that rounds to zero from below must not serialize as -0 (JSON). */
function normalizeZero(n: number): number {
  return n === 0 ? 0 : n;
}

/** 2-dp rounding for percent-like numbers. */
export function round2(n: number): number {
  return normalizeZero(Math.round(n * 100) / 100);
}

/** 5-dp rounding for fx rates (small numbers — chart/weekly precision). */
export function round5(n: number): number {
  return normalizeZero(Math.round(n * 100000) / 100000);
}

/** Percent change (null on unusable bases — never fabricate). */
export function pctChange(last: number, base: number | undefined | null): number | null {
  if (base === undefined || base === null || !Number.isFinite(base) || base <= 0) return null;
  return ((last - base) / base) * 100;
}
