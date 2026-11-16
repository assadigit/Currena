/**
 * breakeven-tilt.ts — the G2 interplay helper (Session 3,
 * GOLD_FRED_GAPFILL_SPEC.md §3): the pure lean selection for the gold
 * panel's inflation-lane context phrase.
 *
 * `breakeven-tilt` (the derived context card, T5YIFR − T5YIE) reads the
 * market's priced acceleration of inflation: a POSITIVE tilt = the market
 * prices inflation BUILDING into the second five years; NEGATIVE = FADING.
 * The GoldTailwindPanel shows the phrase beside the inflation lane's
 * hot/cool word — copy-keyed in both dictionaries, so the lean selection
 * stays PURE here (the modelVsRealityExplainerKey precedent: the panel
 * never chooses copy).
 *
 * Since Session 6 (the D-5 promotion) the card is ALSO the 21st gold
 * VOTER — but through the shared evaluator's own lean (the decade
 * position), NOT this phrase: the panel phrase (the ±0.1pt level
 * deadband) and the voter lean (percentile10y) are two different reads
 * of the same card, both kept. This module's selection is unchanged.
 *
 * Pure, platform-free (AGENTS.md rule 2). Tested in breakeven-tilt.test.ts.
 */

import type { IndicatorReading } from '@currena/core';

/**
 * The deadband: |tilt| below 0.1 points reads 'steady' — the phrase stays
 * quiet about moves a hundredth of a point wide (the same magnitude class
 * as the real-yield leg's SIGNAL_LEG_MOVE).
 */
export const BREAKEVEN_TILT_DEADBAND_PT = 0.1;

/** The inflation lane's tilt phrase (the panel maps it to dictionary copy). */
export type BreakevenTiltLean = 'building' | 'fading' | 'steady';

/** The statuses that never read (the readable() discipline, gold-score.ts). */
function readable(r: IndicatorReading | undefined): r is IndicatorReading {
  return r !== undefined && r.status !== 'stale' && r.status !== 'check-pending' && r.status !== 'unavailable';
}

/**
 * The tilt's lean from its reading's LEVEL (the spec's own definition —
 * positive = building, negative = fading), with the deadband. Null when the
 * reading is absent or unreadable: the phrase renders nowhere, never a
 * guess.
 */
export function breakevenTiltLean(reading: IndicatorReading | undefined): BreakevenTiltLean | null {
  if (!readable(reading)) return null;
  if (reading.value === null || !Number.isFinite(reading.value)) return null;
  if (reading.value >= BREAKEVEN_TILT_DEADBAND_PT) return 'building';
  if (reading.value <= -BREAKEVEN_TILT_DEADBAND_PT) return 'fading';
  return 'steady';
}
