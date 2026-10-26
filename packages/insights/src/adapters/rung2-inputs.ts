/**
 * rung2-inputs.ts — the type-only contract for the second-rung series the
 * gap-audit build (2026-10-26) feeds into buildIndicatorSeries (see
 * adapters/rung2.ts for the phase and the fetch plan). Type-only so both
 * derived.ts (pure) and rung2.ts (fetching) can import it without cycles.
 */

import type { IndicatorId } from '@currena/core';
import type { SeriesPoint } from '../series';

/** The second-rung series buildIndicatorSeries consumes (all optional). */
export interface Rung2SeriesInputs {
  /**
   * A-2: the MOF's own DAILY 10-year JGB yield (jgbcme.csv + the monthly
   * all-file) — the jgb-10y primary. Absent on the 04:10 main rung by
   * design (the reading carries forward until the 04:20 phase).
   */
  jgb10y?: SeriesPoint[];
  /**
   * A-2: the OECD monthly mirror (FRED IRLTLT01JPM156N) armed as the
   * LABELLED fallback for MOF outages (the spec's fix-or-retire terms:
   * keep the mirror; retire it after two clean weeks). Only the rung-2
   * contexts arm it — the main rung never silently substitutes.
   */
  jgbMirror?: SeriesPoint[];
  /**
   * The fetched weekly/monthly additions, keyed by indicator id (A-6..A-10
   * join here as they land; the phase merges them with the stored
   * accumulations before this point).
   */
  series?: Partial<Record<IndicatorId, SeriesPoint[]>>;
}
