/**
 * Collision-safe IDs for user-created entities (receipt items, settle
 * groups/expenses, batch rows).
 *
 * Bare `Date.now()` collides on same-millisecond clicks — two rapid "add"
 * taps produced duplicate React keys and `patchItem` mutated two rows at
 * once. A per-tab monotonic counter disambiguates same-ms calls while
 * staying numeric and chronologically sortable. `Date.now() * 1000` stays
 * far below Number.MAX_SAFE_INTEGER (~9e15 vs ~1.8e15).
 *
 * Persisted entities created before this helper used bare `Date.now()`
 * values; they remain valid (uniqueness only ever gets stronger).
 */

let counter = 0;

export function uniqueId(): number {
  counter = (counter + 1) % 1_000;
  return Date.now() * 1_000 + counter;
}
