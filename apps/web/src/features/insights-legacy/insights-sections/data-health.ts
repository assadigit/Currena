/**
 * data-health.ts — v3 UI_SPEC §10 UI-50 (2026-10-20, PH6-C): the header's
 * data-health chip, computed from the page's OWN readings (never a guess
 * from the status endpoint).
 *
 * The chip speaks the page's own six-word vocabulary:
 *   - Stale cards (status 'stale') count toward "N stale";
 *   - cards whose value cannot be read right now — 'check-pending' and
 *     'unavailable', both of which display "Can't tell right now" on the
 *     card face — count toward "N unavailable".
 *
 * Worst wins: any unreadable card outranks a merely stale one, and when
 * both exist the chip shows the unavailable count while its title carries
 * the stale count (the About section's two lead lines list the same two
 * groups, so the chip and the section can never disagree). "All data
 * current" only when neither count exists. Static per snapshot — the chip
 * never changes on the page, so it carries no aria-live.
 */

export type DataHealthKind = 'all-current' | 'stale' | 'unavailable';

export interface DataHealth {
  kind: DataHealthKind;
  /** Readings with status 'stale'. */
  stale: number;
  /** Readings with status 'check-pending' or 'unavailable' (the page's
   * "Can't tell right now" face — UI-49(c) lists the same group). */
  unavailable: number;
}

/** The chip state for one snapshot's readings. Pure; pinned by test. */
export function dataHealthOf(readings: readonly { status: string }[]): DataHealth {
  let stale = 0;
  let unavailable = 0;
  for (const r of readings) {
    if (r.status === 'stale') stale += 1;
    else if (r.status === 'check-pending' || r.status === 'unavailable') unavailable += 1;
  }
  const kind: DataHealthKind = unavailable > 0 ? 'unavailable' : stale > 0 ? 'stale' : 'all-current';
  return { kind, stale, unavailable };
}
