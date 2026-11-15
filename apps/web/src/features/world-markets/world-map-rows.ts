/**
 * world-map-rows — the WorldMap module's ONE pure row derivation
 * (page-division S8, 2026-11-08).
 *
 * EXTRACTED VERBATIM from the WorldMap component's rows useMemo (the
 * S6 BalanceStage / S7 verdict-core lineage: the derivation moves to a
 * pure module so the §21 zoom-consistency backtest can drive EXACTLY
 * the arithmetic the drawing renders — never a second arithmetic, D-48).
 * The component memo calls this function unchanged; zero behavior
 * change on the world view (the module is imported by the same chunk).
 *
 * The derivation owns the map's consistency contract: the relative
 * colour scale normalises over ALL SIXTEEN MAP_INDICES rows of the
 * served board — per period, never across periods — so a market's
 * colour weight is the SAME number on the world map and on every
 * region zoom (the S8 gate). Restricting the input to a region's
 * subset would silently re-normalise: forbidden, and pinned red by the
 * backtest's fail-closed proof.
 *
 * Platform-free pure data (AGENTS.md rule 2): no fetch, no clock, no
 * DOM — the caller passes the viewer's nowMs/todayIso samples.
 */

import type { MarketEntry, MarketId } from '@currena/core';
import { OPEN_MAX_AGE_MIN, marketDefinition } from '@currena/insights/markets/definitions';
import { MAP_INDICES, mapScaleOf, mapWeightOf, type MapDir, type MapPeriod } from './world-map-config';
import { isOld } from './shared';
import { sessionOpen } from './session';

/** One row of map data, derived purely from the snapshot (the SAME
 * shape the component has always rendered — moved, not restated). */
export interface MapRow {
  id: MarketId;
  /** The registry config row (iso, cc, band, card position). */
  cfg: (typeof MAP_INDICES)[number];
  /** The stored entry — absent when the market has no row at all. */
  entry: MarketEntry | undefined;
  /** Every period's percent change (the cards show D/W/M side by side);
   * null = no honest reading for that period. */
  pcts: Record<MapPeriod, number | null>;
  /** The RELATIVE colour weight per period, 0…1 (owner round
   * 2026-10-20f: more down = more red, more up = more saturated green). */
  wts: Record<MapPeriod, number>;
  /** The selected period's direction; null = flat / no data / old —
   * neutral grey pin and card (M17's honest rule). */
  dir: MapDir | null;
  /** The selected period's percent (the summary + sr words read it). */
  pct: number | null;
  /** Old data (last close older than STALE_AFTER_DAYS). */
  old: boolean;
  open: boolean;
}

/** D2 at view time: a stored provider "open" only shows while its quote
 * is still OPEN_MAX_AGE_MIN minutes old — the last refresh is the honest
 * clock, so a state frozen at write time can never go stale on screen. */
function openAtViewTime(entry: MarketEntry, nowMs: number): boolean {
  if (entry.open !== true || entry.quoteTime === undefined) return false;
  const age = nowMs - Date.parse(entry.quoteTime);
  return Number.isFinite(age) && age >= -60_000 && age <= OPEN_MAX_AGE_MIN * 60_000;
}

/** The stored entry's percent for one period (null = no honest reading).
 * The backtest's ENGINE side spells the same fields out directly from
 * the board rows — never through this function (the two-path rule). */
export function pctOf(entry: MarketEntry | undefined, period: MapPeriod): number | null {
  if (entry === undefined) return null;
  if (period === '1D') return entry.chg1d;
  if (period === '1W') return entry.chg1w ?? null;
  if (period === '1M') return entry.chg1m ?? null;
  if (period === '3M') return entry.chg3m;
  if (period === '5Y') return entry.chg5y ?? null;
  return entry.chg1y ?? null; // 2026-10-20h: yearly returns to the map
}

/**
 * The rows in §4.1 order (west to east = DOM order = tab order), pure
 * derivation — the EXACT function the WorldMap component renders and
 * the §21 zoom-consistency backtest drives. The relative colour scale
 * normalises on the FRESH readings of each period separately (the
 * strongest D mover and the strongest M mover each read weight 1 —
 * "relative" is per lens, never across lenses), over ALL SIXTEEN
 * registry indices regardless of which subset a view seats.
 */
export function deriveWorldMapRows(
  snapshot: { markets: readonly MarketEntry[] } | undefined,
  opts: { period: MapPeriod; loading: boolean; todayIso: string; nowMs: number },
): MapRow[] {
  const { period, loading, todayIso, nowMs } = opts;
  const pctsAll = MAP_INDICES.map((cfg) => {
    const entry = snapshot?.markets.find((m) => m.id === cfg.id);
    const old = !loading && entry !== undefined && isOld(entry, todayIso);
    const pcts = {
      '1D': loading || old ? null : pctOf(entry, '1D'),
      '1W': loading || old ? null : pctOf(entry, '1W'),
      '1M': loading || old ? null : pctOf(entry, '1M'),
      '3M': loading || old ? null : pctOf(entry, '3M'),
      '1Y': loading || old ? null : pctOf(entry, '1Y'),
      '5Y': loading || old ? null : pctOf(entry, '5Y'),
    } as Record<MapPeriod, number | null>;
    return { cfg, entry, old, pcts };
  });
  const scales = {
    '1D': mapScaleOf(pctsAll.map((r) => r.pcts['1D'])),
    '1W': mapScaleOf(pctsAll.map((r) => r.pcts['1W'])),
    '1M': mapScaleOf(pctsAll.map((r) => r.pcts['1M'])),
    '3M': mapScaleOf(pctsAll.map((r) => r.pcts['3M'])),
    '1Y': mapScaleOf(pctsAll.map((r) => r.pcts['1Y'])),
    '5Y': mapScaleOf(pctsAll.map((r) => r.pcts['5Y'])),
  } as Record<MapPeriod, number>;
  return pctsAll.map(({ cfg, entry, old, pcts }) => {
    const wts = {
      '1D': pcts['1D'] === null ? 0 : mapWeightOf(pcts['1D'], '1D', scales['1D']),
      '1W': pcts['1W'] === null ? 0 : mapWeightOf(pcts['1W'], '1W', scales['1W']),
      '1M': pcts['1M'] === null ? 0 : mapWeightOf(pcts['1M'], '1M', scales['1M']),
      '3M': pcts['3M'] === null ? 0 : mapWeightOf(pcts['3M'], '3M', scales['3M']),
      '1Y': pcts['1Y'] === null ? 0 : mapWeightOf(pcts['1Y'], '1Y', scales['1Y']),
      '5Y': pcts['5Y'] === null ? 0 : mapWeightOf(pcts['5Y'], '5Y', scales['5Y']),
    } as Record<MapPeriod, number>;
    const pct = pcts[period];
    const dir: MapDir | null = pct === null || pct === 0 ? null : pct > 0 ? 'u' : 'd';
    return {
      id: cfg.id,
      cfg,
      entry,
      pcts,
      wts,
      dir,
      pct,
      old,
      // 2026-10-29 owner round: the CALENDAR gates the pin too — a stored
      // "open" flag written before the weekend must never read "open"
      // on a Saturday (the quote-flow flag tracks the last refresh, not
      // the exchange's own clock; sessionOpen reads the definitions'
      // IANA timezone + session + holiday calendar).
      open:
        !loading &&
        entry !== undefined &&
        openAtViewTime(entry, nowMs) &&
        sessionOpen(marketDefinition(entry.id), new Date(nowMs)),
    };
  });
}
