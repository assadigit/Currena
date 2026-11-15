/**
 * region-zoom-backtest-core — the S8 §21 diff, PURE (spec §21's
 * verdict-consistency rule applied to the regional zoom maps: a zoomed
 * market's numbers and colours are byte-identical to the world map's
 * own for the same board — zero tolerance).
 *
 * THE TWO SIDES (the S7 world-markets-backtest-core shape, so drift
 * surfaces red rather than a tautology):
 *
 *   PAGE side — what the drawing renders: `deriveWorldMapRows` over the
 *   served board (the EXACT function the WorldMap component calls,
 *   imported from world-map-rows.ts), once per period (the row's own
 *   direction field is period-selected), restricted to REGION_ZOOMS'
 *   seated indices.
 *
 *   ENGINE side — spelled out here WITHOUT the page module: each zoomed
 *   index's six lenses read straight off the stored board row's own
 *   fields (the honest old-data rule applied through the section's
 *   shared isOld helper — the display word both sides must agree on),
 *   and each colour weight recomputed through the config's own
 *   primitives with the scale normalised over ALL SIXTEEN MAP_INDICES
 *   rows (the naive-subset scale is the exact bug this backtest exists
 *   to catch — a zoom must never re-normalise).
 *
 * Both sides stay pure + platform-free; the offline suite
 * (region-zoom-backtest.test.ts) drives a synthetic board and the
 * fail-closed proofs; the LIVE script (apps/web/scripts/pd-s8-backtest
 * .ts) drives the production board.
 */

import type { MarketEntry, MarketId, MarketsSnapshot } from '@currena/core';
import { MARKETS } from '@currena/insights/markets/definitions';
import { MAP_INDICES, MAP_PERIODS, REGION_ZOOMS, mapScaleOf, mapWeightOf } from '../../components/insights/world-markets/world-map-config';
import type { MapPeriod, MapRegionId } from '../../components/insights/world-markets/world-map-config';
import { deriveWorldMapRows } from '../../components/insights/world-markets/world-map-rows';
import type { MapRow } from '../../components/insights/world-markets/world-map-rows';
import { isOld } from '../../components/insights/world-markets/shared';

/** One zoomed index's expected reading — the ENGINE side's shape. */
export interface ZoomExpectedRow {
  id: MarketId;
  pcts: Record<MapPeriod, number | null>;
  wts: Record<MapPeriod, number>;
}

/**
 * The ENGINE side, spelled out. `scaleBasis` selects which rows feed the
 * relative colour scale's normaliser: 'all16' (the honest rule) or
 * 'subset' (the drift simulation for the fail-closed proof — a zoom that
 * normalised over only its own indices would colour a mid-size move as
 * the biggest on screen).
 */
export function engineZoomRows(
  board: MarketsSnapshot,
  region: MapRegionId,
  opts: { todayIso: string; scaleBasis?: 'all16' | 'subset' },
): ZoomExpectedRow[] {
  const byId = new Map(board.markets.map((m) => [m.id as string, m]));
  const entryOf = (id: MarketId): MarketEntry | undefined => byId.get(id);
  // The lenses straight off the stored row's own fields — never through
  // the page module's pctOf (the two-path rule).
  const pctOfEntry = (e: MarketEntry | undefined, p: MapPeriod): number | null =>
    e === undefined
      ? null
      : p === '1D'
        ? e.chg1d
        : p === '1W'
          ? (e.chg1w ?? null)
          : p === '1M'
            ? (e.chg1m ?? null)
            : p === '3M'
              ? e.chg3m
              : p === '5Y'
                ? (e.chg5y ?? null)
                : (e.chg1y ?? null);
  const zoom = REGION_ZOOMS[region];
  // The honest old-data rule (the shared display helper both sides read):
  // an old row's lenses render null — grey pin, grey card, honest words.
  const freshPct = (id: MarketId, p: MapPeriod): number | null => {
    const e = entryOf(id);
    if (e === undefined || isOld(e, opts.todayIso)) return null;
    return pctOfEntry(e, p);
  };
  // The scale basis: all sixteen registry indices (the honest rule) or
  // the zoom's own subset (the drift simulation).
  const basisIds: readonly MarketId[] = opts.scaleBasis === 'subset' ? zoom.indices : MAP_INDICES.map((c) => c.id);
  const scales = {} as Record<MapPeriod, number>;
  for (const p of MAP_PERIODS) {
    scales[p] = mapScaleOf(basisIds.map((id) => freshPct(id, p)));
  }
  return zoom.indices.map((id) => {
    const pcts = Object.fromEntries(MAP_PERIODS.map((p) => [p, freshPct(id, p)])) as Record<MapPeriod, number | null>;
    const wts = Object.fromEntries(
      MAP_PERIODS.map((p) => [p, pcts[p] === null ? 0 : mapWeightOf(pcts[p]!, p, scales[p])]),
    ) as Record<MapPeriod, number>;
    return { id, pcts, wts };
  });
}

/** One check's outcome (the S7 backtest's flat shape). */
export interface ZoomCheck {
  label: string;
  ok: boolean;
  detail: string;
}

/** stableStringify — the key-order-immune comparison basis (the S4
 * discipline; a re-ordered JSON must never read as a diff). */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * The S8 §21 diff: for every region, for every seated index, the PAGE
 * side's rendered derivation (deriveWorldMapRows, per period) must equal
 * the ENGINE side's spelled-out expectation — every lens value, every
 * colour weight, every selected direction — plus the board-presence
 * check (a zoomed index with no board row is reported, never silently
 * green).
 */
export function backtestRegionZoomsVsEngine(
  board: MarketsSnapshot,
  opts: { todayIso: string; nowMs: number },
  overrides: { engineScaleBasis?: 'all16' | 'subset'; mutateEngineRow?: (row: ZoomExpectedRow) => void; dropPageRow?: MarketId } = {},
): { checks: ZoomCheck[]; green: number; red: number } {
  const checks: ZoomCheck[] = [];
  const regions = Object.keys(REGION_ZOOMS) as MapRegionId[];

  // The board's own seat count — the honest denominator.
  checks.push({
    label: 'the board carries all 16 registry rows',
    ok: MARKETS.every((m) => board.markets.some((row) => row.id === m.id)),
    detail: `${board.markets.length} rows`,
  });

  // The PAGE side, once per period (the row's direction + selected pct
  // fields are period-selected; the full check covers all six lenses).
  const pageByPeriod = new Map<MapPeriod, Map<string, MapRow>>();
  for (const p of MAP_PERIODS) {
    pageByPeriod.set(
      p,
      new Map(deriveWorldMapRows(board, { period: p, loading: false, todayIso: opts.todayIso, nowMs: opts.nowMs }).map((r) => [r.id, r])),
    );
  }

  for (const region of regions) {
    const zoom = REGION_ZOOMS[region];
    const engineRows = engineZoomRows(board, region, { todayIso: opts.todayIso, scaleBasis: overrides.engineScaleBasis ?? 'all16' });

    let regionOk = true;
    const perIndex: string[] = [];
    for (const engine of engineRows) {
      const e: ZoomExpectedRow = { ...engine, pcts: { ...engine.pcts }, wts: { ...engine.wts } };
      overrides.mutateEngineRow?.(e);
      let same = true;
      for (const p of MAP_PERIODS) {
        const page = pageByPeriod.get(p)!.get(overrides.dropPageRow === engine.id ? '__dropped__' : engine.id) as MapRow | undefined;
        if (page === undefined) {
          same = false;
          continue;
        }
        if (stableStringify(page.pcts) !== stableStringify(e.pcts)) same = false;
        if (stableStringify(page.wts) !== stableStringify(e.wts)) same = false;
        // The selected period's direction (a pure function of the lens,
        // compared through the page's own per-period derivation).
        const pct = page.pcts[p];
        const dir = pct === null || pct === 0 ? null : pct > 0 ? 'u' : 'd';
        const ePct = e.pcts[p];
        const eDir = ePct === null || ePct === 0 ? null : ePct > 0 ? 'u' : 'd';
        if (dir !== eDir) same = false;
      }
      if (!same) regionOk = false;
      perIndex.push(`${engine.id}:${same ? '≡' : '≠'}`);
    }
    checks.push({
      label: `zoom ${region}: every seated index's six lenses + colour weights + directions ≡ the engine side (all-16 scale)`,
      ok: regionOk,
      detail: `${zoom.indices.length} indices · ${perIndex.join(' ')}`,
    });

    // The zoom's seats are all present in the board (a missing row is the
    // honest no-data card on screen — reported, never a silent green).
    const missing = zoom.indices.filter((id) => !board.markets.some((row) => row.id === id));
    checks.push({
      label: `zoom ${region}: every seated index carries a board row`,
      ok: missing.length === 0,
      detail: missing.length === 0 ? 'all seated' : `missing: ${missing.join(', ')}`,
    });
  }

  return { checks, green: checks.filter((c) => c.ok).length, red: checks.filter((c) => !c.ok).length };
}
