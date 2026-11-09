/**
 * europe-backtest-core — the S12 §21 diff, PURE (spec §21's
 * verdict-consistency rule applied to the Europe page: "page-rendered
 * values must match engine values byte-for-byte" — the §21 per-page trio
 * over the 8 placed cards: value · 10-year position · freshness).
 *
 * TWO SIDES, ONE TRUTH (the S9/S10 two/three-side shape, without the
 * verdict-strip and TIC-board legs Europe doesn't carry):
 *
 *   PAGE side — what /europe renders: the 8 cards' readings straight
 *   off the Europe projection (GET /api/insights/pages/europe).
 *
 *   ENGINE side — the engine's own document, the served snapshot
 *   (GET /api/insights — the same stored document the projection
 *   derives from).
 *
 * The cards are pinned two ways: each card's reading over the Europe
 * projection must be byte-identical (stableStringify, key-order-immune)
 * to the served snapshot's own reading on the §21 trio inputs — value,
 * range bounds, percentile10y, asOf, status. An id absent from BOTH
 * sides stays green (the public-mode twin, the §16 note); an id absent
 * from only one side is RED (a licence-hidden id must be reported in
 * absentIds, never silently dropped).
 *
 * The freshness audit (spec §21's "Data audit" leg) rides the S11 pure
 * `auditUsaFreshness` — a generic function over (readings, registry,
 * cardIds, now), reused with EUROPE_CARD_IDS so the Europe gate speaks
 * the SAME freshness discipline the USA gate does (no logic drift, one
 * audit function).
 *
 * The `drop*Input` / `mutate*` seams exist ONLY for the offline suite's
 * fail-closed proofs — they simulate a corrupted feed and must turn the
 * affected checks red (never silently green).
 *
 * Pure + platform-free so the offline suite (europe-backtest.test.ts)
 * drives it on fixtures with the fail-closed proofs, and the LIVE script
 * (apps/web/scripts/pd-s12-backtest.ts) drives it over the wire. Nothing
 * here ships in the app bundle — no route imports it (test/script seams
 * only).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { stableStringify, auditUsaFreshness, type UsaBacktestCheck, type FreshnessRegistryEntry } from './usa-backtest-core';
import { EUROPE_CARD_IDS } from './europe-tiles';

// Re-exports for the live script + the offline suite (the S9/S10 pattern:
// the backtest's own name for the card list, never hand-copied).
export { stableStringify, auditUsaFreshness, type UsaBacktestCheck, type FreshnessRegistryEntry };
export { EUROPE_CARD_IDS as EUROPE_BACKTEST_CARD_IDS };

/** The §21 trio inputs a Europe card renders — the picked-fields basis
 *  (the S9 usa-backtest-core cardTrioInputs, restated lean so the Europe
 *  backtest stays self-contained — same fields, same shape). */
function cardTrioInputs(reading: IndicatorReading | undefined): string {
  if (reading === undefined) return 'absent';
  return stableStringify({
    value: reading.value,
    rangeLow: reading.rangeLow,
    rangeHigh: reading.rangeHigh,
    percentile10y: reading.percentile10y,
    asOf: reading.asOf,
    status: reading.status,
  });
}

export interface EuropeBacktestOverrides {
  /** Drop an id from the PAGE side (a missing projection reading would
   *  silently drop a card). */
  dropPageInput?: string;
  /** Drop an id from the ENGINE side (the snapshot). */
  dropEngineInput?: string;
  /** Mutate a PAGE-side card reading's trio inputs AFTER the join (the
   *  fail-closed proof — the diff must go red, never silently green). */
  mutatePageCard?: (id: IndicatorId, reading: IndicatorReading) => void;
}

const minusId = (readings: readonly IndicatorReading[], drop: string | undefined): readonly IndicatorReading[] =>
  drop === undefined ? readings : readings.filter((r) => (r.id as string) !== drop);

/**
 * The S12 §21 diff. Returns one check per comparable value; any
 * `ok: false` is a §21 red finding. The drop/mutate seams simulate
 * corrupted feeds for the offline fail-closed proofs.
 */
export function backtestEuropePage(
  pageReadings: readonly IndicatorReading[],
  engineReadings: readonly IndicatorReading[],
  overrides: EuropeBacktestOverrides = {},
): { checks: UsaBacktestCheck[]; green: number; red: number } {
  const checks: UsaBacktestCheck[] = [];

  // The effective feeds (the proof seams act HERE, before any derivation).
  const pageFeed = minusId(pageReadings, overrides.dropPageInput);
  const engineFeed = minusId(engineReadings, overrides.dropEngineInput);
  const pageById = new Map(pageFeed.map((r) => [r.id as string, r]));
  const engineById = new Map(engineFeed.map((r) => [r.id as string, r]));

  /* ---- The 8 cards: the projection ≡ the served snapshot ---- */
  for (const id of EUROPE_CARD_IDS) {
    const pageReading = pageById.get(id);
    const engineReading = engineById.get(id);
    if (pageReading !== undefined && overrides.mutatePageCard !== undefined) {
      overrides.mutatePageCard(id, pageReading);
    }
    const pageTrio = cardTrioInputs(pageReading);
    const engineTrio = cardTrioInputs(engineReading);
    // Absent on BOTH sides stays green (the public-mode twin, §16);
    // absent on ONE side is red (silently dropped, never reported).
    const bothAbsent = pageReading === undefined && engineReading === undefined;
    checks.push({
      label: `card ${id}: the §21 trio inputs ≡ the snapshot's own reading`,
      ok: bothAbsent || pageTrio === engineTrio,
      detail: `page ${pageTrio} · engine ${engineTrio}`,
      note: bothAbsent ? 'absent on both sides — the honest public-mode twin' : undefined,
    });
  }

  return { checks, green: checks.filter((c) => c.ok).length, red: checks.filter((c) => !c.ok).length };
}
