/**
 * signals/verdict — the metals' seven-state outlook CLASSIFIER (2026-10-21
 * owner directive, "Gold Market Outlook — Complete State List") + its
 * icons/ink. (Phase: WS-4 module split of the former Signals.tsx
 * monolith.)
 *
 * Since the "Balance Rework" (docs/insights/gold-card/) the EXPANDED card
 * speaks the balance card's own lean vocabulary (BalanceCard.tsx +
 * copy.signals.balanceCard); this module keeps what still speaks the
 * seven-state outlook: the Signals section's COLLAPSED summary line and
 * anything else that imports `outlookOf`. The seven-state copy corpus
 * lives on in the dictionaries (signals.verdictStates / verdictStateNames
 * — pinned by outlook.test.ts as the owner's verbatim).
 */

import type { SignalReading } from '@currena/insights';
import { LEAN_STRONG } from '@currena/insights';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg } from '../../icons/currena';

/* ------------------------------------------------------------------ *
 * The gold/silver OUTLOOK (2026-10-21 owner directive, "Gold Market
 * Outlook — Complete State List"): SEVEN states, mapped onto the
 * condition tally (S supportive vs A against; gold 5 conditions, silver 6):
 *   strong-bullish / strong-bearish — STRONG signals favor the move: the
 *     same bar the card's lean already speaks (LEAN_STRONG = 4 conditions
 *     on one side; ≥4 implies the majority, so no second check needed).
 *   bullish / bearish — a majority of the directional conditions favors
 *     the move.
 *   mixed — the directional conditions conflict with no majority (S = A).
 *   range-bound — no clear driver edge (the split within one) AND the
 *     price itself consolidates: |30-day speed| < RANGE_SPEED_PCT with
 *     the price in the typical band of its 10-year range.
 *   neutral — readable conditions, none directional.
 * `null` stays "nothing could be read" (every condition unreadable).
 * ------------------------------------------------------------------ */

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

export function VerdictIcon({
  verdict,
  size = 28,
  desktopSize = 36,
}: {
  verdict: OutlookState | null;
  size?: number;
  desktopSize?: number;
}) {
  /* Round 28 (owner artwork): the metals' up/down arrows wear the owner's
   * green zigzag / red zigzag PNGs — their fixed colours match this card's
   * valence by construction (up = the holder's gain). The flat dash stays
   * a stroke glyph in the neutral ink (there is no "flat" artwork); the
   * outlook's calm states (neutral / range-bound / mixed) and the unread
   * null share it. */
  if (verdict === 'strong-bullish' || verdict === 'bullish')
    return <IconImg src={DIRECTION_UP_URL} size={size} desktopSize={desktopSize} />;
  if (verdict === 'strong-bearish' || verdict === 'bearish')
    return <IconImg src={DIRECTION_DOWN_URL} size={size} desktopSize={desktopSize} />;
  return (
    <svg
      className="currena-icon shrink-0"
      style={{ '--icon-size': `${size}px`, '--icon-size-sm': `${desktopSize}px` } as React.CSSProperties}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
      focusable={false}
    >
      <path d="M3 8h10" />
    </svg>
  );
}

/** The outlook's ink: the bullish family wears the normal (green) ink, the
 * bearish family the alert (red) ink — colour never rides alone, the
 * zigzag icon leads every sentence — and the calm no-direction states
 * (neutral / range-bound / mixed) stay in the muted stale ink. */
export const verdictTone: Record<OutlookState, string> = {
  'strong-bullish': 'text-[var(--color-status-normal)]',
  bullish: 'text-[var(--color-status-normal)]',
  neutral: 'text-[var(--color-status-stale)]',
  'range-bound': 'text-[var(--color-status-stale)]',
  mixed: 'text-[var(--color-status-stale)]',
  bearish: 'text-[var(--color-status-alert)]',
  'strong-bearish': 'text-[var(--color-status-alert)]',
};
