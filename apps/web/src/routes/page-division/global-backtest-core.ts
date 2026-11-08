/**
 * global-backtest-core — the S4 verdict-consistency backtest's pure
 * comparison core (page-division S4, 2026-11-08 — spec §21's
 * zero-tolerance gate: "page-rendered verdicts byte-identical to the
 * engine's stored verdicts for the same snapshot").
 *
 * TWO PATHS, ONE TRUTH. The "page side" is exactly what the landing page
 * derives: `globalGaugeTiles` / `globalGoldTile` / `globalMarketsTile` /
 * `globalFxTile` / `globalRibbon` / `globalDedollarTile` over the SERVED
 * PROJECTION's readings (GET /api/insights/pages/global). The "engine
 * side" is the engine's own arithmetic spelled out directly over the
 * SERVED SNAPSHOT (GET /api/insights — the same stored document the
 * projections derive from) and the boards' own stored summaries —
 * `gaugeReading` + `labelForVerdictStep`, `goldBalance` +
 * `evaluateSignal` + `goldOutlookOf`, `marketsVerdictStep` +
 * `summarizeMarkets` + the RAW ≥10%/≥20% rules, `summarizeFxRules` +
 * the §9.3 status table. Deriving the engine side WITHOUT going through
 * global-tiles.ts is the point: a drift in the page module surfaces as a
 * red check here, never as two copies of the same bug agreeing.
 *
 * Fail-closed (Agent Rule 5): every check reports ✓/✗ with both values
 * printed; the caller decides presentation. The ONE designed divergence
 * — the markets board's BUFFERED status counts (summary.nAttention /
 * nUnusual carry the exit-buffer memory) vs the page's RAW
 * fromHigh-≤-threshold counts (the S1-M1.6 #2 audit rule: no summary
 * count may cite the buffered tag against the visible evidence) — is
 * REPORTED as a note, never failed: both numbers are honest, they answer
 * different questions, and the pages speak the RAW one by recorded
 * decision.
 *
 * Pure + platform-free so the offline suite test (global-backtest.test)
 * drives it on fixtures and the live script (apps/web/scripts/
 * pd-s4-backtest.ts) drives it over the wire. Nothing here ships in the
 * app bundle — no route imports it (test/script seams only).
 */

import type { FxSnapshot, IndicatorReading, MarketsSnapshot } from '@currena/core';
import { GAUGES, gaugeReading, goldBalance, labelForVerdictStep, evaluateSignal } from '@currena/insights';
import { summarizeMarkets } from '@currena/insights/markets';
import { summarizeFxRules } from '@currena/insights/fx';
import { GOLD_VOTER_IDS, THEMATIC_GAUGE_IDS, THEMATIC_GAUGE_MEMBER_IDS } from '@currena/insights/page-division';
import { BEAR_PCT, CORRECTION_PCT } from '@currena/insights/markets/definitions';
import { goldOutlookOf } from '../../components/insights/signals/outlook-core';
import { marketsVerdictStep } from '../../components/insights/world-markets/verdict-core';
import { fxRuleView } from '../../lib/fx-presentation/rules';
import {
  GLOBAL_RIBBON_IDS,
  globalDedollarTile,
  globalFxTile,
  globalGaugeTiles,
  globalGoldTile,
  globalMarketsTile,
  globalRibbon,
} from './global-tiles';

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

/* ------------------------------------------------------------------ *
 * The input-completeness pin (the GLOBAL_TILE_INPUT_IDS basis)
 * ------------------------------------------------------------------ */

/**
 * Every reading id the verdict board consumes — the union the S2
 * projection must carry for the page's derivations to equal the
 * engine's: the five gauges' members (GLOBAL_TILE_INPUT_IDS), the gold
 * meter's 37 voters, the ribbon trio and the dedollar pair. In public
 * mode NONE of these is licence-hidden (the blocked quartet are context
 * cards, not voters), so a missing id here is a RED finding — a missing
 * mirror input would silently change a verdict.
 */
export function backtestGlobalInputIds(): readonly string[] {
  return [...new Set([...THEMATIC_GAUGE_MEMBER_IDS, ...GOLD_VOTER_IDS, ...GLOBAL_RIBBON_IDS, 'usd-reserve-share', 'nyfed-custody'])];
}

/* ------------------------------------------------------------------ *
 * The comparison core
 * ------------------------------------------------------------------ */

/**
 * Compare the page's derivations (over the projection's readings) with
 * the engine's (over the served snapshot's readings + the boards' stored
 * summaries). Returns one check per comparable value; any `ok: false` is
 * a §21 red finding.
 */
export function backtestGlobalTiles(
  pageReadings: readonly IndicatorReading[],
  engineReadings: readonly IndicatorReading[],
  markets: MarketsSnapshot,
  fx: FxSnapshot,
): BacktestCheck[] {
  const checks: BacktestCheck[] = [];
  const byId = (readings: readonly IndicatorReading[]): Map<string, IndicatorReading> =>
    new Map(readings.map((r) => [r.id as string, r]));

  /* ---- 0. Input completeness: every engine input rides the projection ---- */
  const pageById = byId(pageReadings);
  const engineById = byId(engineReadings);
  for (const id of backtestGlobalInputIds()) {
    const present = pageById.has(id);
    checks.push({
      label: `input ${id} rides the projection`,
      ok: present,
      page: present ? 'present' : 'MISSING',
      engine: engineById.has(id) ? 'present in snapshot' : 'absent in snapshot',
    });
  }

  /* ---- 1. Tiles ②–⑥ — the five gauge verdicts, engine-path vs page-path ---- */
  const pageGauges = globalGaugeTiles(pageReadings);
  for (const gauge of GAUGES.filter((g) => (THEMATIC_GAUGE_IDS as readonly string[]).includes(g.id))) {
    // ENGINE SIDE — the ingest and the legacy hero's own call, spelled out.
    const engineReading = gaugeReading(gauge, engineReadings);
    const engineWord = labelForVerdictStep(engineReading.step);
    // PAGE SIDE — what the landing page renders.
    const tile = pageGauges.find((t) => t.gauge === gauge.id);
    const pageStep = tile?.reading.step;
    const pageWord = tile?.word ?? undefined;
    checks.push({
      label: `gauge ${gauge.id} step`,
      ok: pageStep === engineReading.step,
      page: show(pageStep),
      engine: show(engineReading.step),
    });
    checks.push({
      label: `gauge ${gauge.id} word`,
      ok: pageWord === engineWord,
      page: show(pageWord),
      engine: show(engineWord),
    });
    checks.push({
      label: `gauge ${gauge.id} counts (warnings/voting)`,
      ok: tile?.reading.warningCount === engineReading.warningCount && tile?.reading.votingCount === engineReading.votingCount,
      page: show(tile && [tile.reading.warningCount, tile.reading.votingCount]),
      engine: show([engineReading.warningCount, engineReading.votingCount]),
    });
  }

  /* ---- 2. Tile ① — the Gold Balance counts + the 7-state outlook ---- */
  const pageGold = globalGoldTile(pageReadings);
  // ENGINE SIDE — the balance + the outlook exactly as the Gold page's
  // own scale derives them over the full snapshot.
  const engineBalance = goldBalance(engineReadings);
  const engineGoldSignal = evaluateSignal('gold', engineReadings);
  const engineOutlook = goldOutlookOf(engineBalance, engineGoldSignal.speed, engineGoldSignal.position);
  checks.push({
    label: 'gold balance counts (for/against/neutral/unread)',
    ok:
      pageGold.balance.counts.for === engineBalance.counts.for &&
      pageGold.balance.counts.against === engineBalance.counts.against &&
      pageGold.balance.counts.neutral === engineBalance.counts.neutral &&
      pageGold.balance.counts.unread === engineBalance.counts.unread,
    page: show([
      pageGold.balance.counts.for,
      pageGold.balance.counts.against,
      pageGold.balance.counts.neutral,
      pageGold.balance.counts.unread,
    ]),
    engine: show([
      engineBalance.counts.for,
      engineBalance.counts.against,
      engineBalance.counts.neutral,
      engineBalance.counts.unread,
    ]),
  });
  checks.push({
    label: 'gold balance net + readable',
    ok: pageGold.balance.net === engineBalance.net && pageGold.balance.readable === engineBalance.readable,
    page: show([pageGold.balance.net, pageGold.balance.readable]),
    engine: show([engineBalance.net, engineBalance.readable]),
  });
  checks.push({
    label: 'gold outlook (7-state)',
    ok: pageGold.outlook === engineOutlook,
    page: show(pageGold.outlook),
    engine: show(engineOutlook),
  });

  /* ---- 3. Tile ⑧ — the markets verdict + the RAW counts ---- */
  const pageMarkets = globalMarketsTile(markets);
  // ENGINE SIDE — the board's own pure arithmetic: the §5.3 rollup
  // recomputed over the rows, the verdict step, the RAW rules.
  const engineSummary = summarizeMarkets(markets.markets);
  const engineStep = marketsVerdictStep(markets);
  const rawCorrection = markets.markets.filter((m) => m.fromHigh <= CORRECTION_PCT).length;
  const rawBear = markets.markets.filter((m) => m.fromHigh <= BEAR_PCT).length;
  checks.push({
    label: 'markets signal (the stored §5.3 rollup)',
    ok: pageMarkets.signal === markets.summary.signal && engineSummary.signal === markets.summary.signal,
    page: show(pageMarkets.signal),
    engine: show(markets.summary.signal),
  });
  checks.push({
    label: 'markets verdict step',
    ok: pageMarkets.step === engineStep,
    page: show(pageMarkets.step),
    engine: show(engineStep),
  });
  checks.push({
    label: 'markets RAW ≥10%-below-high count',
    ok: pageMarkets.inCorrection === rawCorrection,
    page: show(pageMarkets.inCorrection),
    engine: show(rawCorrection),
    note:
      markets.summary.nAttention !== rawCorrection
        ? `the buffered status count (summary.nAttention ${markets.summary.nAttention}) differs from the RAW count by design — the exit-buffer memory (S1-M1.6 #2); the pages speak the RAW rule`
        : 'the buffered status count agrees with the RAW count today',
  });
  checks.push({
    label: 'markets RAW ≥20%-below-high (bear) count',
    ok: pageMarkets.inBear === rawBear,
    page: show(pageMarkets.inBear),
    engine: show(rawBear),
    note:
      markets.summary.nUnusual !== rawBear
        ? `the buffered bear count (summary.nUnusual ${markets.summary.nUnusual}) differs from the RAW count by design (the exit-buffer memory)`
        : 'the buffered bear count agrees with the RAW count today',
  });
  checks.push({
    label: 'markets total rows',
    ok: pageMarkets.total === markets.markets.length && markets.summary.count === markets.markets.length,
    page: show(pageMarkets.total),
    engine: show(markets.markets.length),
  });

  /* ---- 4. Tile ⑦ — the fx signal + the active count ---- */
  const pageFx = globalFxTile(fx);
  // ENGINE SIDE — the fx engine's own summary recomputed over the rules.
  const engineFx = summarizeFxRules(fx.rules);
  const engineActive = fx.rules.filter((r) => fxRuleView(r).status === 'active').length;
  checks.push({
    label: 'fx signal (the stored rollup)',
    ok: pageFx.signal === fx.summary.signal && engineFx.signal === fx.summary.signal,
    page: show(pageFx.signal),
    engine: show(fx.summary.signal),
  });
  checks.push({
    label: 'fx counted warnings',
    ok: pageFx.countedWarnings === fx.summary.countedWarnings && engineFx.countedWarnings === fx.summary.countedWarnings,
    page: show(pageFx.countedWarnings),
    engine: show(fx.summary.countedWarnings),
  });
  checks.push({
    label: 'fx active rules (the §9.3 status table)',
    ok: pageFx.activeRules === engineActive,
    page: show(pageFx.activeRules),
    engine: show(engineActive),
  });
  checks.push({
    label: 'fx total rules',
    ok: pageFx.totalRules === fx.rules.length,
    page: show(pageFx.totalRules),
    engine: show(fx.rules.length),
  });

  /* ---- 5. Tiles ⑨/⑩ — the ribbon + dedollar readings, byte-identical ---- */
  const pageRibbon = globalRibbon(pageReadings);
  for (const entry of pageRibbon) {
    const pageReading = entry.reading;
    const engineReading = engineById.get(entry.id);
    checks.push({
      label: `ribbon reading ${entry.id} byte-identical to the snapshot`,
      ok: engineReading !== undefined && stableStringify(pageReading) === stableStringify(engineReading),
      page: stableStringify(pageReading),
      engine: stableStringify(engineReading),
    });
  }
  const pageDedollar = globalDedollarTile(pageReadings);
  for (const [name, reading] of [
    ['usd-reserve-share', pageDedollar.reserveShare],
    ['nyfed-custody', pageDedollar.custody],
  ] as const) {
    const engineReading = engineById.get(name);
    checks.push({
      label: `dedollar reading ${name} byte-identical to the snapshot`,
      ok: engineReading !== undefined && stableStringify(reading) === stableStringify(engineReading),
      page: stableStringify(reading),
      engine: stableStringify(engineReading),
    });
  }

  return checks;
}
