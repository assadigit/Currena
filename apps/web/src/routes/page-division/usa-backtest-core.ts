/**
 * usa-backtest-core — the S9 §21 diff, PURE (spec §21's
 * verdict-consistency rule applied to the USA page: "the verdicts match
 * Global's engine values byte-for-byte" — the D-30 contract — plus the
 * §21 per-page trio over the tier cards).
 *
 * THREE SIDES, ONE TRUTH (the S4/S7/S8 two-path shape, extended by the
 * session gate's own wording):
 *
 *   PAGE side — what /usa renders: `usaGaugeVerdicts` over the USA
 *   projection's readings (the EXACT derivation the strip renders) and
 *   the 26 tier cards' readings straight off the same projection.
 *
 *   GLOBAL side — what the landing page renders for the SAME gauges:
 *   `globalGaugeTiles` over the GLOBAL projection's readings (the S3
 *   module the USA derivation re-exports; D-30 says the strip's verdicts
 *   are "the same computed verdicts as Global", so this side is pinned
 *   literally, not assumed).
 *
 *   ENGINE side — the engine's own arithmetic spelled out directly over
 *   the SERVED SNAPSHOT (GET /api/insights — the same stored document both
 *   projections derive from): `gaugeReading` + `labelForVerdictStep`,
 *   NEVER through a page module. Deriving this side without the page
 *   modules is the point: a drift in either page surfaces as a red check
 *   here, never as two copies of the same bug agreeing.
 *
 * The tier cards are pinned two ways: each card's reading over the USA
 * projection must be byte-identical (stableStringify, key-order-immune)
 * to the served snapshot's own reading on the §21 trio inputs — value,
 * range bounds, percentile10y, asOf, status. An id absent from BOTH
 * sides stays green (the public-mode twin, the §16 note); an id absent
 * from only one side is RED (a licence-hidden id must be reported in
 * absentIds, never silently dropped).
 *
 * The `drop*Input` / `mutate*` seams exist ONLY for the offline suite's
 * fail-closed proofs — they simulate a corrupted feed and must turn the
 * affected checks red (never silently green).
 *
 * Pure + platform-free so the offline suite (usa-backtest.test.ts)
 * drives it on fixtures with the fail-closed proofs, and the LIVE script
 * (apps/web/scripts/pd-s9-backtest.ts) drives it over the wire. Nothing
 * here ships in the app bundle — no route imports it (test/script seams
 * only).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { GAUGES, gaugeReading, labelForVerdictStep } from '@currena/insights';
import { THEMATIC_GAUGE_IDS, THEMATIC_GAUGE_MEMBER_IDS } from '@currena/insights/page-division';
import { globalGaugeTiles, type GlobalGaugeTile } from './global-tiles';
import { USA_CARD_IDS, usaGaugeVerdicts } from './usa-tiles';

/** One comparison's verdict — `ok` false is a RED finding (§21: zero tolerance). */
export interface UsaBacktestCheck {
  label: string;
  ok: boolean;
  /** The rendered values, one per side (stable, JSON-ish). */
  detail: string;
  /** A designed divergence or context note — reported, never a failure. */
  note?: string;
}

/** stableStringify — the key-order-immune comparison basis (the S4
 * discipline; a re-ordered JSON must never read as a diff). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

/** Render a strip entry's verdict for the check table. */
function showVerdict(tile: GlobalGaugeTile | undefined): string {
  if (tile === undefined) return 'absent';
  return stableStringify({ step: tile.reading.step, voting: tile.reading.votingCount, warnings: tile.reading.warningCount, stale: tile.reading.staleCount, word: tile.word });
}

/** The §21 trio inputs a tier card renders — the picked-fields basis. */
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

/** A deep-enough copy of a strip entry for the proof seams. */
function copyVerdict(tile: GlobalGaugeTile): GlobalGaugeTile {
  return { gauge: tile.gauge, word: tile.word, reading: { ...tile.reading } };
}

export interface UsaBacktestOverrides {
  /** Drop a voter/input from the PAGE side (a missing mirror would silently change a verdict). */
  dropPageInput?: string;
  /** Drop a voter/input from the GLOBAL side. */
  dropGlobalInput?: string;
  /** Drop an id from the ENGINE side (the snapshot). */
  dropEngineInput?: string;
  /** Flip/mutate a PAGE-side strip entry AFTER the derivation (the fail-closed proof). */
  mutatePageVerdict?: (tile: GlobalGaugeTile) => void;
  /** Mutate a PAGE-side card reading's trio inputs AFTER the join (the proof). */
  mutatePageCard?: (id: IndicatorId, reading: IndicatorReading) => void;
}

const minusId = (readings: readonly IndicatorReading[], drop: string | undefined): readonly IndicatorReading[] =>
  drop === undefined ? readings : readings.filter((r) => (r.id as string) !== drop);

/**
 * The S9 §21 diff. Returns one check per comparable value; any
 * `ok: false` is a §21 red finding. The drop/mutate seams simulate
 * corrupted feeds for the offline fail-closed proofs.
 */
export function backtestUsaPage(
  pageReadings: readonly IndicatorReading[],
  globalReadings: readonly IndicatorReading[],
  engineReadings: readonly IndicatorReading[],
  overrides: UsaBacktestOverrides = {},
): { checks: UsaBacktestCheck[]; green: number; red: number } {
  const checks: UsaBacktestCheck[] = [];

  // The effective feeds (the proof seams act HERE, before any derivation).
  const pageFeed = minusId(pageReadings, overrides.dropPageInput);
  const globalFeed = minusId(globalReadings, overrides.dropGlobalInput);
  const engineFeed = minusId(engineReadings, overrides.dropEngineInput);
  const pageById = new Map(pageFeed.map((r) => [r.id as string, r]));
  const engineById = new Map(engineFeed.map((r) => [r.id as string, r]));

  /* ---- 0. Input completeness: every gauge voter rides all three feeds ---- */
  for (const id of THEMATIC_GAUGE_MEMBER_IDS) {
    const pageHas = pageById.has(id);
    const globalHas = globalFeed.some((r) => (r.id as string) === id);
    const engineHas = engineById.has(id);
    checks.push({
      label: `input ${id} rides the USA projection, the Global projection and the snapshot`,
      ok: pageHas && globalHas && engineHas,
      detail: `page ${pageHas ? 'present' : 'MISSING'} · global ${globalHas ? 'present' : 'MISSING'} · engine ${engineHas ? 'present' : 'MISSING'}`,
    });
  }

  /* ---- 1. The D-30 strip: page ≡ Global's board ≡ the engine ---- */
  const pageStrip = usaGaugeVerdicts(pageFeed).map(copyVerdict);
  for (const tile of pageStrip) overrides.mutatePageVerdict?.(tile);
  const globalStrip = globalGaugeTiles(globalFeed);
  for (const gauge of GAUGES.filter((g) => (THEMATIC_GAUGE_IDS as readonly string[]).includes(g.id))) {
    // ENGINE SIDE — the ingest's own call, spelled out.
    const engineReading = gaugeReading(gauge, engineFeed);
    const engineWord = labelForVerdictStep(engineReading.step);
    // PAGE SIDE — what /usa renders (mutations applied).
    const pageTile = pageStrip.find((t) => t.gauge === gauge.id);
    // GLOBAL SIDE — what the landing page renders for the same gauge.
    const globalTile = globalStrip.find((t) => t.gauge === gauge.id);
    const pageJson = showVerdict(pageTile);
    const globalJson = showVerdict(globalTile);
    const engineJson = stableStringify({ step: engineReading.step, voting: engineReading.votingCount, warnings: engineReading.warningCount, stale: engineReading.staleCount, word: engineWord });
    checks.push({
      label: `gauge ${gauge.id}: the USA strip ≡ the Global board ≡ the engine (byte-for-byte)`,
      ok: pageJson === globalJson && pageJson === engineJson,
      detail: `page ${pageJson} · global ${globalJson} · engine ${engineJson}`,
    });
  }

  /* ---- 2. The tier cards: the projection ≡ the served snapshot ---- */
  for (const id of USA_CARD_IDS) {
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

/**
 * The LIVE script's card-membership sanity basis: the 26 S9-scope card
 * ids, in placement order (re-exported from usa-tiles — never
 * hand-copied).
 */
export { USA_CARD_IDS as USA_BACKTEST_CARD_IDS };
