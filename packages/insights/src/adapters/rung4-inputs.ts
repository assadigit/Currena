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
  /**
   * gap-closure S3-M3.3 (2026-11-01): the credit pair's files (the Fed
   * Board EBP CSV + the OFR FSI aggregate CSV, decade-trimmed) — direct
   * series, no derivation. The Worker's 04:35 phases patch them per file;
   * the Node venue passes both so ONE build derives everything.
   */
  credit?: { ebp?: SeriesPoint[]; ofrFsi?: SeriesPoint[] };
  /**
   * gap-closure S3-M3.5 (2026-11-01): the Treasury FiscalData auction
   * families, PRE-DERIVED by the Node venue's inline collect
   * (adapters/auctions.ts) — direct series, no derivation here. The
   * Worker's 04:10 main rung + 04:35 phase pass NOTHING (api.fiscaldata.
   * treasury.gov is BLOCKED from Worker egress — the S1 probe ×3): the
   * ids carry forward until the Node venue's inline build writes them.
   */
  auctions?: {
    btc10y?: SeriesPoint[];
    indirect10y?: SeriesPoint[];
    btc30y?: SeriesPoint[];
    indirect30y?: SeriesPoint[];
  };
}
