/**
 * The seven-state conditions outlook — the classifier the previous gold
 * page's Signals verdict carried (upstream `outlook-core.ts`, ported
 * verbatim in logic): the state derives from the SAME balance the page
 * renders, so the verdict and the beam can never contradict each other.
 *
 * The contract (the upstream's own, in engine terms — L = lanes for,
 * A = lanes against, over the five lanes):
 *   1. all five lanes unread → null ("nothing could be read");
 *   2. L ≥ 4 → strong-bullish; A ≥ 4 → strong-bearish (4 of 5 = 80%);
 *   3. range evidence — |30-day change| < 2% AND the 10-year position in
 *      the typical band AND |L − A| ≤ 1 → range-bound (price enters ONLY
 *      here, describing consolidation — never direction);
 *   4. L == A → mixed if L > 0, else neutral;
 *   5. otherwise bullish if L > A, else bearish.
 *
 * Pure + platform-free. Display-only: the word describes current
 * conditions, never a forecast.
 */

/** The outlook's seven states. */
export type OutlookState =
  | "strong-bullish"
  | "bullish"
  | "neutral"
  | "range-bound"
  | "bearish"
  | "strong-bearish"
  | "mixed";

/** A 30-day move under this many percent is a consolidation. */
export const RANGE_SPEED_PCT = 2;

/** Lanes at-or-above this count read as the strong states (4 of 5). */
export const GOLD_LANE_STRONG = 4;

/** The balance counts the classifier reads (the page's own balance). */
export interface OutlookBalanceCounts {
  for: number;
  against: number;
  neutral: number;
  unread: number;
}

/**
 * The gold outlook over the consolidated balance. `speed` is the gold's
 * own 30-day change (percent, nullable); `typicalBand` is whether the
 * gold's 10-year position sits in its typical band (the projection's
 * own percentile10y reading, 20–80 → typical) — nullable when unread.
 */
export function goldOutlookOf(
  counts: OutlookBalanceCounts,
  speed: number | null,
  typicalBand: boolean | null,
): OutlookState | null {
  const L = counts.for;
  const A = counts.against;
  if (counts.unread === 5) return null; // nothing could be read
  if (L >= GOLD_LANE_STRONG) return "strong-bullish";
  if (A >= GOLD_LANE_STRONG) return "strong-bearish";
  const rangeEvidence =
    speed !== null &&
    Math.abs(speed) < RANGE_SPEED_PCT &&
    typicalBand === true;
  if (rangeEvidence && Math.abs(L - A) <= 1) return "range-bound";
  if (L === A) return L > 0 ? "mixed" : "neutral";
  return L > A ? "bullish" : "bearish";
}

/** The seven states' names (the upstream dictionary's own, EN + fa). */
export const OUTLOOK_STATE_NAMES: Record<OutlookState, [string, string]> = {
  "strong-bullish": ["Strong bullish", "صعودی قوی"],
  bullish: ["Bullish", "صعودی"],
  neutral: ["Neutral", "خنثی"],
  "range-bound": ["Range-bound", "محدوده‌ای"],
  bearish: ["Bearish", "نزولی"],
  "strong-bearish": ["Strong bearish", "نزولی قوی"],
  mixed: ["Mixed signals", "نشانه‌های مختلط"],
};
