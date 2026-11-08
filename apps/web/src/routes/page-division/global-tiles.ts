/**
 * global-tiles — the Global page's verdict arithmetic, PURE (page-division
 * S3, 2026-11-08 — docs/page-division/02-PAGE-DIVISION-SPEC.md §4, the
 * D-21 10-tile board).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5): every tile
 * is a DISPLAY of an engine-computed value, re-derived here through the
 * SAME pure engine functions the legacy /insights page and the destination
 * pages use — `gauges.ts` / `gold-balance.ts` / `signals.ts` from
 * @currena/insights, the extracted `outlook-core` / `verdict-core`
 * classifiers, and the fx board's own §9.3 status table. Nothing is
 * computed twice and nothing is invented: no new composites, no new
 * thresholds, no averages-of-averages. A tile that cannot read says so
 * (step 0 → the unread state); a reading that is absent from the served
 * projection stays absent (the caller renders the honest "not published"
 * note from `absentIds`).
 *
 * The inputs are the S2 contract's own: the Global projection
 * (fetchPageProjection('global') — the 52 mirror-input readings, the
 * live-prices serve-time merge already applied) + the two board
 * attachments (the markets board and the fx board, fetched at their own
 * cached routes). Pure + platform-free so the unit tests drive it
 * directly (global-tiles.test.ts) and the S4 backtest can pin it
 * byte-for-byte against the engine's stored snapshot values.
 */

import type { FxSnapshot, IndicatorId, IndicatorReading, MarketsSnapshot } from '@currena/core';
import { GAUGES, gaugeReading, labelForVerdictStep } from '@currena/insights';
import type { GaugeReading } from '@currena/insights';
import { goldBalance } from '@currena/insights';
import type { GoldBalanceReading } from '@currena/insights';
import { evaluateSignal } from '@currena/insights';
import { BEAR_PCT } from '@currena/insights/markets/definitions';
import { THEMATIC_GAUGE_IDS } from '@currena/insights/page-division';
import { goldOutlookOf, type OutlookState } from '../../components/insights/signals/outlook-core';
import { marketsInCorrectionCount, marketsVerdictStep } from '../../components/insights/world-markets/verdict-core';
import type { MarketsVerdictStep } from '../../components/insights/world-markets/verdict-core';
import { fxRuleView } from '../../lib/fx-presentation/rules';

/* ------------------------------------------------------------------ *
 * Tiles ②–⑥ — the five thematic gauge verdicts (D-21)
 * ------------------------------------------------------------------ */

/** One gauge tile: the engine's own GaugeReading + its verdict word.
 *  `word === null` is the honest unread state (step 0 — no fresh voter
 *  could vote), rendered as "Cannot read yet", never a guess. */
export interface GlobalGaugeTile {
  /** The gauge's id — one of the 5 thematic ids, in D-21's board order. */
  gauge: (typeof THEMATIC_GAUGE_IDS)[number];
  reading: GaugeReading;
  /** labelForVerdictStep(step) — the shared 4-word verdict language. */
  word: 'relaxed' | 'cautious' | 'stressed' | 'alarmed' | null;
}

/** The five thematic gauges in GAUGES order, filtered to the D-21 set —
 *  the gauge LIST itself derives from the placement's engine-side constant
 *  (never a hand-copied duplicate), and each reading comes from the same
 *  pure gaugeReading() the ingest and the hero use. */
export function globalGaugeTiles(readings: readonly IndicatorReading[]): GlobalGaugeTile[] {
  const thematic = new Set<string>(THEMATIC_GAUGE_IDS);
  return GAUGES.filter((g) => thematic.has(g.id)).map((g) => {
    const reading = gaugeReading(g, readings);
    return {
      gauge: g.id as (typeof THEMATIC_GAUGE_IDS)[number],
      reading,
      word: labelForVerdictStep(reading.step),
    };
  });
}

/* ------------------------------------------------------------------ *
 * Tile ① — the Gold Balance (D-21: compact 7-state outlook + the
 * 37-voter meter's for/against counts)
 * ------------------------------------------------------------------ */

export interface GlobalGoldTile {
  /** The consolidated balance over the five lanes (gold-balance.ts — the
   *  SAME engine the Gold page's balance scale reads; counts.for/against
   *  are the voter tallies the tile displays). */
  balance: GoldBalanceReading;
  /** The 7-state outlook derived from that SAME balance (outlook-core's
   *  goldOutlookOf — the GB-S5 contract: the outlook and the balance can
   *  never contradict each other). null = nothing could be read. */
  outlook: OutlookState | null;
}

export function globalGoldTile(readings: readonly IndicatorReading[]): GlobalGoldTile {
  const balance = goldBalance(readings);
  // The gold SignalReading's own speed/position (signals.ts — the same
  // pure evaluator the Signals card uses) feed the outlook's range-bound
  // evidence, exactly as the legacy page's derivation does.
  const gold = evaluateSignal('gold', readings);
  return { balance, outlook: goldOutlookOf(balance, gold.speed, gold.position) };
}

/* ------------------------------------------------------------------ *
 * Tile ⑨ — the prices ribbon (D-22: gold · brent · BTC, live hourly)
 * ------------------------------------------------------------------ */

/** The ribbon's three assets, D-22's own order (silver's story lives on
 *  Gold/Commodities). The ids are the placement's ribbon inputs; brent
 *  arrives as a prices-heat voter, gold-usd + btc-usd as the added ribbon
 *  inputs (placement.ts's global mirrors). */
export const GLOBAL_RIBBON_IDS = ['gold-usd', 'brent', 'btc-usd'] as const;
export type RibbonAssetId = (typeof GLOBAL_RIBBON_IDS)[number];

export interface GlobalRibbonEntry {
  id: RibbonAssetId;
  /** The reading from the served projection (live-prices merge applied at
   *  serve time — the ribbon's own "live hourly" values). undefined = the
   *  id is absent from the served payload (honest unread, never a guess). */
  reading: IndicatorReading | undefined;
}

/** The ribbon entries in D-22 order, straight off the projection. */
export function globalRibbon(readings: readonly IndicatorReading[]): GlobalRibbonEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return GLOBAL_RIBBON_IDS.map((id) => ({ id, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * Tile ⑩ — the dedollarization context tile (D-25: display-only)
 * ------------------------------------------------------------------ */

export interface GlobalDedollarTile {
  /** USD share of world FX reserves — the LEVEL (a percent), display-only. */
  reserveShare: IndicatorReading | undefined;
  /** Foreign official holdings at the New York Fed — its 30-day change
   *  carries the DIRECTION (signed percent, shown as a number, never a
   *  coined word). Both ids are gold-meter dollar-lane voters that ride
   *  the Global projection as mirrors. */
  custody: IndicatorReading | undefined;
}

export function globalDedollarTile(readings: readonly IndicatorReading[]): GlobalDedollarTile {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return {
    reserveShare: byId.get('usd-reserve-share'),
    custody: byId.get('nyfed-custody'),
  };
}

/* ------------------------------------------------------------------ *
 * Tile ⑧ — the World Markets status (D-21: stressed/correction/bear
 * counts over the 16 indexes)
 * ------------------------------------------------------------------ */

export interface GlobalMarketsTile {
  /** The section verdict step (verdict-core — the same pure function the
   *  World Markets page's focal box reads; 1 Bullish · 2/3 Mixed · 4 Bearish). */
  step: MarketsVerdictStep;
  /** The §5.3 section signal (the board KV's own rollup). */
  signal: 'normal' | 'attention' | 'unusual';
  /** RAW ≥10%-below-52-week-high count (marketsInCorrectionCount — the
   *  S1-M1.6 #2 rule: the same number the cards' distances show). */
  inCorrection: number;
  /** RAW ≥20%-below-high count (BEAR_PCT — the bear tier of the same rule). */
  inBear: number;
  /** Total market rows (16 once every market has spoken once). */
  total: number;
}

export function globalMarketsTile(snapshot: MarketsSnapshot): GlobalMarketsTile {
  return {
    step: marketsVerdictStep(snapshot),
    signal: snapshot.summary.signal,
    inCorrection: marketsInCorrectionCount(snapshot.markets),
    inBear: snapshot.markets.filter((m) => m.fromHigh <= BEAR_PCT).length,
    total: snapshot.markets.length,
  };
}

/* ------------------------------------------------------------------ *
 * Tile ⑦ — the FX Lights (D-21: unusual/attention status + count of
 * active rules R1–R7)
 * ------------------------------------------------------------------ */

export interface GlobalFxTile {
  /** The section rollup (spec §6.5 — the board KV's own summary.signal). */
  signal: 'normal' | 'attention' | 'unusual';
  /** Counted Warnings after the §6.4 downgrade pass (summary.countedWarnings —
   *  the engine's own "needs attention" count). */
  countedWarnings: number;
  /** How many of the seven rules read ACTIVE on the §9.3 status table
   *  (fxRuleView status 'active' — warning / supportive / context rows;
   *  watching/quiet/nodata stay out). */
  activeRules: number;
  /** Total rule rows (7). */
  totalRules: number;
}

export function globalFxTile(snapshot: FxSnapshot): GlobalFxTile {
  return {
    signal: snapshot.summary.signal,
    countedWarnings: snapshot.summary.countedWarnings,
    activeRules: snapshot.rules.filter((r) => fxRuleView(r).status === 'active').length,
    totalRules: snapshot.rules.length,
  };
}

/* ------------------------------------------------------------------ *
 * The region chips' status dots (D-23)
 * ------------------------------------------------------------------ */

/**
 * A chip dot's honest state. `verdict` mirrors a REAL engine verdict the
 * Global payload carries (the destination's own headline); `none` is the
 * fail-closed rest: no engine verdict exists at the Global layer for that
 * destination yet (its page builds in a later session — S1's placeholder
 * note: "status dots arriving with real verdicts"). NEVER a composite:
 * D-48 excludes invented aggregates, so a region chip does not average its
 * gauges or voters into a fake status.
 */
export type ChipDotState =
  | { kind: 'verdict'; step: 1 | 2 | 3 | 4 }
  | { kind: 'attention'; signal: 'attention' | 'unusual' }
  | { kind: 'none' };

/** The markets chip's dot: the section verdict step (1 Bullish → calm;
 *  2 Mixed → the neutral watch; 3 Correcting-tier signal → attention;
 *  4 Bearish → alert). A display mapping of the SAME verdict the tile and
 *  the /world-markets page show — colour + label, never colour alone. */
export function marketsChipDot(tile: GlobalMarketsTile): ChipDotState {
  if (tile.signal === 'unusual') return { kind: 'attention', signal: 'unusual' };
  if (tile.signal === 'attention') return { kind: 'attention', signal: 'attention' };
  if (tile.step === 1) return { kind: 'verdict', step: 1 };
  if (tile.step === 4) return { kind: 'verdict', step: 4 };
  return { kind: 'verdict', step: 2 };
}

/** The currencies chip's dot: the fx section signal (normal → calm;
 *  attention/unusual → raised). Same mapping the fx hero's chip speaks. */
export function fxChipDot(tile: GlobalFxTile): ChipDotState {
  if (tile.signal !== 'normal') return { kind: 'attention', signal: tile.signal };
  return { kind: 'verdict', step: 1 };
}

/** The reading ids the tiles consume (test seam + the S4 backtest's pin
 *  basis): every mirror input the verdict board reads, in one list. */
export const GLOBAL_TILE_INPUT_IDS: readonly IndicatorId[] = [
  ...THEMATIC_GAUGE_IDS.flatMap((gaugeId) => {
    const gauge = GAUGES.find((g) => g.id === gaugeId);
    return gauge ? [...gauge.members] : [];
  }),
];
