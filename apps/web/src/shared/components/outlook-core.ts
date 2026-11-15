/**
 * signals/outlook-core — the seven-state outlook classifier, PURE (S3
 * extraction, 2026-11-08).
 *
 * `OutlookState`, `RANGE_SPEED_PCT`, `outlookOf` and `goldOutlookOf` moved
 * VERBATIM from ./verdict.tsx (display-layer module split, zero behavior
 * change — verdict.tsx re-exports them, so every existing import and test
 * keeps working). Reason: the page-division Global route (S3) needs the
 * gold outlook for its Gold Balance tile WITHOUT verdict.tsx's heavy view
 * imports (TrendChart, config, icons) — the classifier is engine-faithful
 * display logic and must stay importable from a lean chunk.
 *
 * Sources (unchanged): the 2026-10-21 owner directive ("Gold Market
 * Outlook — Complete State List") and the gold balance consolidation P3
 * (GB-S5, 01-SPEC §5.2 — the gold state derives from the SAME
 * goldBalance() result that drives the lane balance, so the card and the
 * balance can never contradict each other).
 */

import { GOLD_LANES, GOLD_LANE_STRONG, LEAN_STRONG, type GoldBalanceReading, type SignalReading } from '@currena/insights';

export type OutlookState =
  | 'strong-bullish'
  | 'bullish'
  | 'neutral'
  | 'range-bound'
  | 'bearish'
  | 'strong-bearish'
  | 'mixed';

/** A 30-day move under this many PERCENT is a consolidation for the metals
 * (trending months run well above it) — half of the range-bound evidence,
 * beside the price sitting in the typical band of its 10-year range.
 * Percent units by construction: change30d on price rows is % (scoring). */
export const RANGE_SPEED_PCT = 2;

/** The silver path (verdict.tsx's own contract, unchanged): the state over a
 * SignalReading's condition tally. */
export function outlookOf(reading: SignalReading): OutlookState | null {
  const supportive = reading.conditions.filter((c) => c.state === 'supportive').length;
  const against = reading.conditions.filter((c) => c.state === 'against').length;
  const unknown = reading.conditions.filter((c) => c.state === 'unknown').length;
  if (unknown === reading.conditions.length) return null; // nothing could be read
  if (supportive >= LEAN_STRONG) return 'strong-bullish'; // ≥4 of ≤6 ⇒ majority
  if (against >= LEAN_STRONG) return 'strong-bearish';
  const rangeEvidence =
    reading.speed !== null &&
    Math.abs(reading.speed) < RANGE_SPEED_PCT &&
    reading.position !== null &&
    reading.position.band === 'typical';
  if (rangeEvidence && Math.abs(supportive - against) <= 1) return 'range-bound';
  if (supportive === against) return supportive > 0 ? 'mixed' : 'neutral';
  return supportive > against ? 'bullish' : 'bearish';
}

/* ------------------------------------------------------------------ *
 * Gold balance consolidation P3 (GB-S5, 01-SPEC §5.2 — the gold
 * Outlook card DERIVED from the consolidated balance): the gold state
 * is computed from the SAME goldBalance() result that drives the lane
 * balance, so the card and the balance can never contradict each
 * other (D-GB-6, AC-3 — today the Outlook's 5th "footing" condition is
 * gold's own 30-day move, the circularity that read Bearish beside a
 * Balanced balance).
 *
 * The contract (01 §5.2), in engine terms — L = lanes for, A = lanes
 * against, over the five lanes (GF-P2, the owner's recorded answer B:
 * the flows lane, 2026-11-05):
 *   1. all five lanes unread → null (the existing "nothing could be
 *      read", verdictNone);
 *   2. L ≥ GOLD_LANE_STRONG (4) → strong-bullish; A ≥ 4 →
 *      strong-bearish (4 of 5 = 80% — preserves the old 3-of-4 = 75%
 *      strictness; the owner's recorded reason);
 *   3. range evidence — UNCHANGED from outlookOf: |30-day change| <
 *      RANGE_SPEED_PCT (2%) AND the 10-year position in the typical
 *      band AND |L − A| ≤ 1 → range-bound. Price enters ONLY here,
 *      describing consolidation — never direction (AC-7: footing
 *      counts nowhere else in this function);
 *   4. L == A → mixed if L > 0, else neutral;
 *   5. otherwise bullish if L > A, else bearish.
 *
 * `speed`/`position` are the gold SignalReading's own fields — the
 * exact range evidence outlookOf reads today (rule 3 verbatim), so the
 * consolidation read stays honest without re-deriving price inputs.
 * Since the GB-S6 flip this is THE gold derivation (the flag-off
 * legacy path retired with the flag); outlookOf stays for silver ONLY
 * (OI-4 is a recorded follow-up, not this change).
 * ------------------------------------------------------------------ */
export function goldOutlookOf(
  balance: GoldBalanceReading,
  speed: number | null,
  position: SignalReading['position'],
): OutlookState | null {
  const L = balance.counts.for;
  const A = balance.counts.against;
  // GF-P2 (the owner's recorded answer B): the five-lane set — the null
  // check reads the lane count, never a hardcoded four.
  if (balance.counts.unread === GOLD_LANES.length) return null; // nothing could be read
  if (L >= GOLD_LANE_STRONG) return 'strong-bullish';
  if (A >= GOLD_LANE_STRONG) return 'strong-bearish';
  const rangeEvidence =
    speed !== null &&
    Math.abs(speed) < RANGE_SPEED_PCT &&
    position !== null &&
    position.band === 'typical';
  if (rangeEvidence && Math.abs(L - A) <= 1) return 'range-bound';
  if (L === A) return L > 0 ? 'mixed' : 'neutral';
  return L > A ? 'bullish' : 'bearish';
}
