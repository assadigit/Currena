/**
 * rung4-inputs.ts — the type-only contract for the fourth-rung series the
 * gap-closure S3 build (2026-11-01, M3.2) feeds into buildIndicatorSeries
 * (see adapters/rung4.ts for the collection + the phase). Type-only so both
 * derived.ts (pure) and rung4.ts (fetching) can import it without cycles.
 */

import type { SeriesPoint } from '../series';

/**
 * The rung-4 series buildIndicatorSeries consumes (all optional). The MAIN
 * rung (04:10 Worker) passes nothing — the rung-4 ids' readings carry
 * forward (carryForwardIds) until the 04:35 phase patches them; the Node
 * venue + selfcheck pass the fetched map so ONE build derives everything.
 */
export interface Rung4SeriesInputs {
  /**
   * The S3 bulk-group fetches (the two FRED_S3_GROUPS requests), keyed by
   * FRED series id (THREEFYTP10, WTREGEN, RRPONTSYD, WRESBAL, IORB, CCSA,
   * GDPNOW, …). IORB arrives FUTURE-TRIMMED (trimFutureDated — the series
   * carries administratively announced rows past today).
   */
  fredS3?: Partial<Record<string, SeriesPoint[]>>;
}
