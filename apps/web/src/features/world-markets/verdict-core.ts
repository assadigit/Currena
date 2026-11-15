/**
 * world-markets/verdict-core — the section's verdict arithmetic, PURE (S3
 * extraction, 2026-11-08).
 *
 * `MarketsVerdictStep`, `marketsVerdictStep` and `marketsInCorrectionCount`
 * moved VERBATIM from ./MarketsVerdict.tsx (display-layer module split,
 * zero behavior change — MarketsVerdict.tsx re-exports them, so the
 * existing tests and imports keep working). Reason: the page-division
 * Global route (S3) needs the markets verdict + correction counts for its
 * World Markets tile WITHOUT MarketsVerdict.tsx's view imports
 * (VerdictMeter, SectionVerdictLine, the icons, the copy corpus).
 *
 * Sources (unchanged): the section verdict (owner round 44 — the §5.3
 * signal sets the band, a calm signal splits on 3-month breadth) and
 * S1-M1.6 #2 (2026-10-31 audit — the RAW ≥10%-below-high rule, so every
 * sentence and stat box shares ONE computed value).
 */

import type { MarketEntry, MarketsSnapshot } from '@currena/core';
import { CORRECTION_PCT } from '@currena/insights/markets/definitions';

export type MarketsVerdictStep = 1 | 2 | 3 | 4;

export function marketsVerdictStep(snapshot: Pick<MarketsSnapshot, 'markets' | 'summary'>): MarketsVerdictStep {
  const { summary, markets } = snapshot;
  if (summary.signal === 'unusual') return 4;
  if (summary.signal === 'attention') return 3;
  if (markets.length === 0) return 2;
  const up = markets.filter((m) => m.chg3m > 0).length;
  return up > markets.length / 2 ? 1 : 2;
}

/** How many of the snapshot's markets sit in correction or a bear market.
 * S1-M1.6 #2 (2026-10-31 audit): the RAW ≥10%-below-high rule — the same
 * number belowHighCount reads and the cards' distances show — so every
 * sentence and the stat box share ONE computed value. The stored STATUS
 * keeps its exit-buffer memory for the per-card tags (a −9% market that
 * was ≤ −10% still reads "Correcting"), but no summary count may cite the
 * buffered tag against the visible evidence (the audit saw "7 of 16 in
 * correction" beside six ≥10% distances). */
export function marketsInCorrectionCount(markets: readonly MarketEntry[]): number {
  return markets.filter((m) => m.fromHigh <= CORRECTION_PCT).length;
}
