/**
 * split.ts — even-split arithmetic next to the settlement solver
 * (BACKLOG #30: was a private helper inside apps/web Splitter.tsx since
 * the migration; settling it in core gives it the same unit-test
 * guarantee as settleDebts and lets future consumers reuse it).
 *
 * Largest-remainder split: floor every share at `decimals`, then hand the
 * leftover units to the earliest people — the shares sum to EXACTLY total
 * (rounded to `decimals`), no drift, and the per-person difference is at
 * most one unit of the last decimal place.
 */

/** Machine-readable failure codes for splitEvenly. */
export type SplitErrorCode = 'invalid_people' | 'invalid_decimals' | 'invalid_total';

/** Typed error thrown by splitEvenly (mirrors settleDebts' discipline). */
export class SplitError extends Error {
  readonly code: SplitErrorCode;

  constructor(code: SplitErrorCode, message: string) {
    super(message);
    this.name = 'SplitError';
    this.code = code;
  }
}

/**
 * Split `total` across `people` shares, each rounded to `decimals` places,
 * such that the shares sum to exactly round(total, decimals).
 *
 *   splitEvenly(100, 3, 2)  → [33.34, 33.33, 33.33]
 *   splitEvenly(10, 4, 0)   → [3, 3, 2, 2]
 *
 * Throws SplitError on people < 1, decimals outside 0–6, or a non-finite
 * total (the UI validates, but the arithmetic must be safe by construction).
 */
export function splitEvenly(total: number, people: number, decimals: number): number[] {
  if (!Number.isInteger(people) || people < 1) {
    throw new SplitError('invalid_people', `people must be an integer ≥ 1, got ${people}`);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) {
    throw new SplitError('invalid_decimals', `decimals must be an integer 0–6, got ${decimals}`);
  }
  if (!Number.isFinite(total)) {
    throw new SplitError('invalid_total', `total must be finite, got ${total}`);
  }
  const scale = 10 ** decimals;
  const totalUnits = Math.round(total * scale);
  const base = Math.floor(totalUnits / people);
  let remainder = totalUnits - base * people;
  const shares = Array.from({ length: people }, () => base);
  for (let i = 0; remainder > 0; i = (i + 1) % people, remainder--) {
    shares[i] = (shares[i] ?? 0) + 1;
  }
  return shares.map((units) => units / scale);
}
