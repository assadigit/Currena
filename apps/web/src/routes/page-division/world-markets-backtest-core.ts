/**
 * world-markets-backtest-core — the S7 §21 diff's pure comparison core
 * (page-division S7, 2026-11-08 — spec §21's verdict-consistency rule:
 * "page-rendered verdicts byte-identical to the engine's stored verdicts
 * for the same snapshot — zero tolerance").
 *
 * TWO PATHS, ONE TRUTH (the S4 global / S5 gold pattern). The "page
 * side" is exactly what the World Markets page derives:
 * `worldMarketsStatus` + `worldMarketsRegionGrids` over the SERVED BOARD
 * (GET /api/insights/markets — the same cached route the page, the
 * legacy section and the Global tile read) + `worldRiskCards` over the
 * SERVED PROJECTION (GET /api/insights/pages/world-markets). The
 * "engine side" is the engine's own arithmetic spelled out directly —
 * `summarizeMarkets` + `marketsVerdictStep` over the board's own rows
 * and the section's shared helpers (trendOf / statusWordKeyOf) computed
 * line by line, NEVER through the page module — so a drift in
 * world-markets-tiles.ts surfaces as a red check here, never as two
 * copies of the same bug agreeing.
 *
 * Fail-closed (Agent Rule 5): every check reports ✓/✗ with both values
 * printed; the caller decides presentation.
 *
 * Pure + platform-free so the offline suite test
 * (world-markets-backtest.test) drives it on fixtures and the live
 * script (apps/web/scripts/pd-s7-backtest.ts) drives it over the wire.
 * Nothing here ships in the app bundle — no route imports it
 * (test/script seams only).
 */

import type { IndicatorReading, MarketsSnapshot } from '@currena/core';
import { summarizeMarkets } from '@currena/insights/markets';
import { BEAR_PCT, CORRECTION_PCT, MARKETS, MARKET_GROUP_ORDER } from '@currena/insights/markets/definitions';
import { statusWordKeyOf, trendOf } from '../../components/insights/world-markets/shared';
import { marketsInCorrectionCount, marketsVerdictStep } from '../../components/insights/world-markets/verdict-core';
import { WORLD_RISK_IDS, worldMarketsRegionGrids, worldMarketsRows, worldMarketsStatus, worldRiskCards } from './world-markets-tiles';

/** One comparison's verdict — `ok` false is a RED finding (§21: zero tolerance). */
export interface BacktestCheck {
  /** What is compared (stable, human-readable). */
  label: string;
  ok: boolean;
  /** The page-side value, rendered. */
  page: string;
  /** The engine-side value, rendered. */
  engine: string;
  /** A designed divergence or context note — reported, never a failure. */
  note?: string;
}

/** Render a value for the check table (stable, JSON-ish). */
function show(value: unknown): string {
  return value === undefined ? 'absent' : JSON.stringify(value) ?? 'undefined';
}

/**
 * Stable serialize with SORTED keys — the byte-identity basis for whole
 * readings (zod re-parsing can reorder keys; sorted-key JSON cannot be
 * fooled by insertion order).
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

/**
 * Compare the page's derivations (over the served board + projection)
 * with the engine's (the board's own stored rows + summarizeMarkets +
 * the served snapshot's readings). Returns one check per comparable
 * value; any `ok: false` is a §21 red finding.
 */
export function backtestWorldMarketsPage(
  board: MarketsSnapshot,
  projectionReadings: readonly IndicatorReading[],
  snapshotReadings: readonly IndicatorReading[],
  todayIso: string,
): BacktestCheck[] {
  const checks: BacktestCheck[] = [];
  const engineSummary = summarizeMarkets(board.markets);

  /* ---- 0. Input completeness: every world-risk home rides the
   * projection (or is honestly absent on BOTH sides — public mode's
   * licence-hidden ids ride absentIds as the §16 notes they render as;
   * a projection that drops an id the snapshot still serves is RED). ---- */
  const projectionById = new Map(projectionReadings.map((r) => [r.id as string, r]));
  for (const id of WORLD_RISK_IDS) {
    const present = projectionById.has(id);
    const engineHas = snapshotReadings.some((r) => r.id === id);
    checks.push({
      label: `risk input ${id} rides the projection`,
      ok: present === engineHas,
      page: present ? 'present' : 'MISSING',
      engine: engineHas ? 'present in snapshot' : 'absent in snapshot',
      note: present || engineHas ? undefined : 'absent on both sides — the §16 honest note, never a card',
    });
  }

  /* ---- 1. The status summary — the board's own rollup + the verdict
   * step + the RAW counts, each re-derived on the engine side. ---- */
  const status = worldMarketsStatus(board);
  checks.push({
    label: 'the §5.3 signal (page reads the board summary; engine re-runs summarizeMarkets)',
    ok: status.signal === engineSummary.signal,
    page: show(status.signal),
    engine: show(engineSummary.signal),
  });
  checks.push({
    label: 'the §5.3 counts (nAttention · nUnusual · count · worstGroup)',
    ok:
      status.nAttention === engineSummary.nAttention &&
      status.nUnusual === engineSummary.nUnusual &&
      status.count === engineSummary.count &&
      status.worstGroup === engineSummary.worstGroup,
    page: show([status.nAttention, status.nUnusual, status.count, status.worstGroup]),
    engine: show([engineSummary.nAttention, engineSummary.nUnusual, engineSummary.count, engineSummary.worstGroup]),
  });
  const engineStep = marketsVerdictStep({ markets: board.markets, summary: engineSummary });
  checks.push({
    label: 'the verdict step (verdict-core over the engine summary)',
    ok: status.step === engineStep,
    page: show(status.step),
    engine: show(engineStep),
  });
  const engineInCorrection = marketsInCorrectionCount(board.markets);
  const engineInBear = board.markets.filter((m) => m.fromHigh <= BEAR_PCT).length;
  checks.push({
    label: 'the RAW ≥10%-below-high count',
    ok: status.inCorrection === engineInCorrection,
    page: show(status.inCorrection),
    engine: show(engineInCorrection),
  });
  checks.push({
    label: 'the RAW ≥20%-below-high count',
    ok: status.inBear === engineInBear,
    page: show(status.inBear),
    engine: show(engineInBear),
  });
  if (status.nAttention + status.nUnusual !== status.inCorrection) {
    checks.push({
      label: 'the buffered-vs-RAW divergence (the designed S1-M1.6 #2 note)',
      ok: true,
      page: `summary status counts ${status.nAttention + status.nUnusual}`,
      engine: `RAW ≥${CORRECTION_PCT}% count ${status.inCorrection}`,
      note:
        'the stored STATUS keeps its 2-point exit buffer (a staying rule); the page counts the RAW distances beside it — both honest, both shown, never mixed (the S4 backtest recorded the same designed divergence)',
    });
  }

  /* ---- 2. THE PER-ROW DIFF — every registry market's row carries the
   * board's own stored values through the shared helpers. ---- */
  const rows = worldMarketsRows(board, todayIso);
  const engineById = new Map(board.markets.map((m) => [m.id as string, m]));
  for (const market of MARKETS) {
    const row = rows.find((r) => r.id === market.id);
    const entry = engineById.get(market.id);
    if (row === undefined) {
      checks.push({
        label: `row ${market.id} renders in its region grid`,
        ok: false,
        page: 'MISSING',
        engine: 'the registry lists it',
      });
      continue;
    }
    if (entry === undefined) {
      checks.push({
        label: `row ${market.id} (no board row) renders the honest no-data shape`,
        ok: row.entry === undefined && row.chg1d === null && row.fromHigh === null && row.statusKey === null,
        page: show([row.entry === undefined, row.chg1d, row.fromHigh, row.statusKey]),
        engine: 'no stored row — the map shows No data, the grid shows the dash',
        note: `${market.id} has no stored board row (the board's ${board.markets.length} rows)`,
      });
      continue;
    }
    const valueTrio = (r: typeof row): string =>
      show([r.chg1d, r.chg1w, r.chg1m, r.chg3m, r.chg1y, r.fromHigh, r.rangePos]);
    const engineTrio = show([entry.chg1d, entry.chg1w ?? null, entry.chg1m ?? null, entry.chg3m, entry.chg1y ?? null, entry.fromHigh, entry.rangePos]);
    checks.push({
      label: `row ${market.id}: the five lenses + fromHigh + rangePos (byte-identical to the stored row)`,
      ok: valueTrio(row) === engineTrio,
      page: valueTrio(row),
      engine: engineTrio,
    });
    checks.push({
      label: `row ${market.id}: trend band + status word (the shared helpers' own answers)`,
      ok: row.trend === trendOf(entry) && row.statusKey === statusWordKeyOf(entry.fromHigh),
      page: show([row.trend, row.statusKey]),
      engine: show([trendOf(entry), statusWordKeyOf(entry.fromHigh)]),
    });
  }
  // The region structure itself: 3 groups, every registry market seated.
  const grids = worldMarketsRegionGrids(board, todayIso);
  checks.push({
    label: 'the region structure (3 groups × the registry membership, 7/4/5)',
    ok:
      grids.length === MARKET_GROUP_ORDER.length &&
      grids.every((g) => g.rows.map((r) => r.id).join(',') === MARKETS.filter((m) => m.group === g.group).map((m) => m.id).join(',')),
    page: show(grids.map((g) => `${g.group}:${g.rows.length}`)),
    engine: show(MARKET_GROUP_ORDER.map((group) => `${group}:${MARKETS.filter((m) => m.group === group).length}`)),
  });

  /* ---- 3. The risk cards — the projection's readings byte-identical
   * to the served snapshot's own readings for the same 9 ids. ---- */
  const cards = worldRiskCards(projectionReadings);
  const snapshotById = new Map(snapshotReadings.map((r) => [r.id as string, r]));
  for (const card of cards) {
    const engineReading = snapshotById.get(card.id);
    const pageReading = card.reading;
    checks.push({
      label: `risk card ${card.id}: the reading byte-identical (stableStringify)`,
      ok: stableStringify(pageReading) === stableStringify(engineReading),
      page: stableStringify(pageReading),
      engine: stableStringify(engineReading),
    });
  }

  return checks;
}
