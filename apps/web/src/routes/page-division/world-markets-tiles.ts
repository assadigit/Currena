/**
 * world-markets-tiles — the World Markets page's derivations, PURE
 * (page-division S7, 2026-11-08 — docs/page-division/02-PAGE-DIVISION-SPEC.md
 * §6, D-43 · D-47 · D-48).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles contract): every value the page renders is
 * a DISPLAY of a board-computed or engine-computed reading, re-derived
 * here through the SAME pure helpers the legacy /insights section, the
 * Global World-Markets tile and the runner use — `marketsVerdictStep` /
 * `marketsInCorrectionCount` (verdict-core, the S3 extraction), the
 * world-markets section's own shared display helpers (`trendOf`,
 * `statusWordKeyOf`, `statusToneOf`, `isOld`, `tradingDaysBehind`) and
 * the board KV's own §5.3 summary rollup. Nothing is computed twice and
 * nothing is invented: no new composites, no new thresholds, no second
 * arithmetic. A market whose row is absent from the board renders the
 * honest no-data row (the map's own M17 discipline); a reading absent
 * from the served projection stays absent (the caller renders the honest
 * note from `absentIds`).
 *
 * The inputs are the S2 contract's own: the markets board attachment
 * (GET /api/insights/markets — the same cached route the legacy section
 * and the Global tile read) + the World Markets projection
 * (fetchPageProjection('world-markets') — the 9 world-risk home
 * readings). Pure + platform-free so the unit tests drive it directly
 * (world-markets-tiles.test.ts) and the S7 §21 diff can pin it against
 * the board's own stored values — the backtest core spells the engine
 * side out WITHOUT this module, so drift surfaces red
 * (world-markets-backtest-core.ts).
 */

import type {
  IndicatorId,
  IndicatorReading,
  MarketEntry,
  MarketGroupId,
  MarketId,
  MarketsSnapshot,
} from '@currena/core';
import {
  BEAR_PCT,
  MARKETS,
  MARKET_GROUP_ORDER,
} from '@currena/insights/markets/definitions';
import { pageHomeIds } from '@currena/insights/page-division';
import {
  marketsInCorrectionCount,
  marketsVerdictStep,
} from '../../components/insights/world-markets/verdict-core';
import type { MarketsVerdictStep } from '../../components/insights/world-markets/verdict-core';
import {
  isOld,
  statusToneOf,
  statusWordKeyOf,
  tradingDaysBehind,
  trendOf,
} from '../../components/insights/world-markets/shared';
import type { StockStateWordKey } from '../../components/insights/world-markets/shared';

/* The §5.3 signal's count thresholds, re-exported for DISPLAY (the page's
 * rule line names them; the signal itself always arrives computed inside
 * the board's own summary — never re-derived here). */
export { ATTENTION_COUNT, UNUSUAL_COUNT } from '@currena/insights/markets/definitions';

/* ------------------------------------------------------------------ *
 * The hero's status summary (spec §6 item 1: "status summary — unusual
 * ≥8 stressed · attention ≥4")
 * ------------------------------------------------------------------ */

/**
 * The §5.3 signal's own tier vocabulary, as the word keys the page pins
 * to the corpus (the MarketsVerdict box's own words: step 1 Bullish ·
 * 2/3 Mixed — the Step-1 audit E2 rule: the attention tier says "Mixed"
 * with the count, never a section-wide "Correcting" · 4 Bearish).
 */
export type MarketsVerdictWordKey = 'verdictBullish' | 'verdictMixed' | 'verdictBearish';

export const WM_VERDICT_WORD: Readonly<Record<MarketsVerdictStep, MarketsVerdictWordKey>> = {
  1: 'verdictBullish',
  2: 'verdictMixed',
  3: 'verdictMixed',
  4: 'verdictBearish',
};

/** The hero's status summary — every number is the board's own or the
 * section's shared RAW rule, never a re-computation. */
export interface WorldMarketsStatusModel {
  /** The section verdict step (verdict-core — the same pure function the
   * legacy MarketsVerdict box and the Global World-Markets tile read). */
  step: MarketsVerdictStep;
  /** The §5.3 section signal — the board KV's OWN rollup (summarizeMarkets
   * at write time; the US-override rule lives there, never here). */
  signal: MarketsSnapshot['summary']['signal'];
  /** The board's own status-band counts (nAttention = correction rows,
   * nUnusual = bear rows — the stored status keeps its exit buffer). */
  nAttention: number;
  nUnusual: number;
  /** Total market rows in the board (16 once every market has spoken). */
  count: number;
  /** The board's own worst-group answer (the §5.3 rollup's field). */
  worstGroup: MarketGroupId | null;
  /** RAW ≥10%-below-52-week-high count (marketsInCorrectionCount — the
   * S1-M1.6 #2 rule: the same number the rows' distances show). */
  inCorrection: number;
  /** RAW ≥20%-below-high count (BEAR_PCT — the bear tier of the same rule). */
  inBear: number;
}

export function worldMarketsStatus(snapshot: MarketsSnapshot): WorldMarketsStatusModel {
  const { summary, markets } = snapshot;
  return {
    step: marketsVerdictStep(snapshot),
    signal: summary.signal,
    nAttention: summary.nAttention,
    nUnusual: summary.nUnusual,
    count: summary.count,
    worstGroup: summary.worstGroup,
    inCorrection: marketsInCorrectionCount(markets),
    inBear: markets.filter((m) => m.fromHigh <= BEAR_PCT).length,
  };
}

/* ------------------------------------------------------------------ *
 * The region grids (spec §6 item 2: Asia 7 · Europe 4 · Americas 5 —
 * each row chg 1d/1w/1m/3m/1y, 52-wk range position, trend band, the
 * correction −10% / bear −20% statuses)
 * ------------------------------------------------------------------ */

/** One region-grid row — the stored entry's own numbers through the
 * section's shared display helpers, with the honest no-data shape for a
 * market the board has no row for (the map's M17 discipline: absent is
 * absent — never a zero, never a guess). */
export interface WorldMarketsRowModel {
  id: MarketId;
  group: MarketGroupId;
  /** The stored board row — undefined when the market has not spoken yet. */
  entry: MarketEntry | undefined;
  /** The five return lenses (null = the row carries no honest reading). */
  chg1d: number | null;
  chg1w: number | null;
  chg1m: number | null;
  chg3m: number | null;
  chg1y: number | null;
  /** Last close vs the 52-week high, percent (≤ 0 by construction). */
  fromHigh: number | null;
  /** Position inside the 52-week range, 0–100 (the range-position cell). */
  rangePos: number | null;
  /** The 3-month trend band (trendOf — the ±1% rule, the same word the
   * legacy table's Trend column shows). null = no stored row. */
  trend: 'up' | 'flat' | 'down' | null;
  /** The state word key (statusWordKeyOf — the L2-01 convention: within
   * 5% Near its high · 5–10% Pullback · 10–20% Correction · ≥20% Bear). */
  statusKey: StockStateWordKey | null;
  /** The state tone class (statusToneOf — the same ring the legacy
   * table's Status column wears). */
  statusToneClass: string | null;
  /** The honest old-data evaluation (client-side R6 — whatever the stored
   * flag says, the age rule re-checks it at view time). */
  old: boolean;
  /** Trading days behind the board's freshest close (the A7 delayed tag). */
  daysBehind: number;
}

export interface WorldMarketsRegionModel {
  group: MarketGroupId;
  rows: readonly WorldMarketsRowModel[];
}

/**
 * The three region grids in MARKET_GROUP_ORDER (east to west — the
 * trading day's own order), every registry market rendered in its
 * group's table order. The membership rides MARKETS +
 * MARKET_GROUP_ORDER (the engine's own registry — never a hand-copied
 * list), so a registry change surfaces as visible drift, not a silent
 * mismatch.
 */
export function worldMarketsRegionGrids(snapshot: MarketsSnapshot, todayIso: string): readonly WorldMarketsRegionModel[] {
  const byId = new Map(snapshot.markets.map((m) => [m.id as string, m]));
  // Step-1 A7: the delayed tag's baseline — the freshest close in the board.
  const freshestIso = snapshot.markets.reduce(
    (max, m) => (m.asOf > max ? m.asOf : max),
    snapshot.markets[0]?.asOf ?? '',
  );
  return MARKET_GROUP_ORDER.map((group) => ({
    group,
    rows: MARKETS.filter((m) => m.group === group).map((m) => {
      const entry = byId.get(m.id);
      if (entry === undefined) {
        return {
          id: m.id,
          group,
          entry: undefined,
          chg1d: null,
          chg1w: null,
          chg1m: null,
          chg3m: null,
          chg1y: null,
          fromHigh: null,
          rangePos: null,
          trend: null,
          statusKey: null,
          statusToneClass: null,
          old: false,
          daysBehind: 0,
        };
      }
      return {
        id: m.id,
        group,
        entry,
        chg1d: entry.chg1d,
        chg1w: entry.chg1w ?? null,
        chg1m: entry.chg1m ?? null,
        chg3m: entry.chg3m,
        chg1y: entry.chg1y ?? null,
        fromHigh: entry.fromHigh,
        rangePos: entry.rangePos,
        trend: trendOf(entry),
        statusKey: statusWordKeyOf(entry.fromHigh),
        statusToneClass: statusToneOf(entry.fromHigh),
        old: isOld(entry, todayIso),
        daysBehind: tradingDaysBehind(entry.asOf, freshestIso),
      };
    }),
  }));
}

/** Every region-grid row across the three groups (16 once every registry
 * market is seated) — the §21 gate's per-row diff basis. */
export function worldMarketsRows(snapshot: MarketsSnapshot, todayIso: string): readonly WorldMarketsRowModel[] {
  return worldMarketsRegionGrids(snapshot, todayIso).flatMap((region) => [...region.rows]);
}

/* ------------------------------------------------------------------ *
 * The world risk & liquidity cards (spec §6 item 3 — the 9 placement
 * homes: gpr-index · gpr-threats · gpr-acts · gpr-daily · gpr-russia ·
 * gpr-ukraine · gpr-israel · gpr-saudi · global-liquidity)
 * ------------------------------------------------------------------ */

/** The World Markets page's detail-card homes, in placement order —
 * derived from the placement table (pageHomeIds('world-markets')),
 * never hand-copied. */
export const WORLD_RISK_IDS: readonly IndicatorId[] = pageHomeIds('world-markets');

/** The 9 world-risk card ids (the placement's own homes) — the literal
 * union that keeps the display + copy maps TOTAL (a missing key is a
 * typecheck error, never a runtime undefined). world-markets-tiles.test.ts
 * pins this list against pageHomeIds('world-markets') byte-for-byte. */
export type WorldRiskId =
  | 'gpr-index'
  | 'gpr-threats'
  | 'gpr-acts'
  | 'gpr-daily'
  | 'gpr-russia'
  | 'gpr-ukraine'
  | 'gpr-israel'
  | 'gpr-saudi'
  | 'global-liquidity';

/** One risk card's reading (undefined = the id is absent from the served
 * projection — public mode's honest gap, never a guess). */
export interface WorldRiskEntry {
  id: WorldRiskId;
  reading: IndicatorReading | undefined;
}

/** The 9 risk cards in placement order, straight off the projection. */
export function worldRiskCards(readings: readonly IndicatorReading[]): readonly WorldRiskEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return WORLD_RISK_IDS.map((id) => ({ id: id as WorldRiskId, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * The risk cards' display configs — the DISPLAY registry's own values
 * for the 9 world-risk ids, restated here so the lean World Markets
 * chunk does not pull the config module chain (the S3 GlobalBoard /
 * S5 gold-tiles pattern). The decimals are pinned against
 * config/display.ts by world-markets-tiles.test.ts.
 * ------------------------------------------------------------------ */

export type WorldRiskUnitToken = 'index' | 'usd-tr';

export interface WorldRiskDisplayConfig {
  decimals: number;
  unit: WorldRiskUnitToken;
}

export const WORLD_RISK_DISPLAY: Readonly<Record<WorldRiskId, WorldRiskDisplayConfig>> = {
  'gpr-index': { decimals: 1, unit: 'index' },
  'gpr-threats': { decimals: 1, unit: 'index' },
  'gpr-acts': { decimals: 1, unit: 'index' },
  'gpr-daily': { decimals: 1, unit: 'index' },
  'gpr-russia': { decimals: 2, unit: 'index' },
  'gpr-ukraine': { decimals: 2, unit: 'index' },
  'gpr-israel': { decimals: 2, unit: 'index' },
  'gpr-saudi': { decimals: 2, unit: 'index' },
  'global-liquidity': { decimals: 2, unit: 'usd-tr' },
};
