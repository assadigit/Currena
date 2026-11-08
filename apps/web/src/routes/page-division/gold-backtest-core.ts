/**
 * gold-backtest-core — the S5 seat-level diff's pure comparison core
 * (page-division S5, 2026-11-08 — spec §21's Gold gate: "meter counts
 * match /api/insights exactly (seat-level diff); all 37 seats render
 * with lean + evidence").
 *
 * TWO PATHS, ONE TRUTH (the S4 global-backtest pattern). The "page
 * side" is exactly what the Gold page derives: `goldHero` /
 * `goldSeatLanes` / `goldContextCards` over the SERVED PROJECTION's
 * readings (GET /api/insights/pages/gold). The "engine side" is the
 * engine's own arithmetic spelled out directly over the SERVED SNAPSHOT
 * (GET /api/insights — the same stored document the projection derives
 * from): `goldBalance` + `evaluateSignal` + `goldOutlookOf`, member
 * line by member line, NEVER through the page module — so a drift in
 * gold-tiles.ts surfaces as a red check here, never as two copies of
 * the same bug agreeing.
 *
 * Fail-closed (Agent Rule 5): every check reports ✓/✗ with both values
 * printed; the caller decides presentation.
 *
 * Pure + platform-free so the offline suite test (gold-backtest.test)
 * drives it on fixtures and the live script (apps/web/scripts/
 * pd-s5-backtest.ts) drives it over the wire. Nothing here ships in the
 * app bundle — no route imports it (test/script seams only).
 */

import type { IndicatorReading } from '@currena/core';
import { evaluateSignal, goldBalance, GOLD_LANES } from '@currena/insights';
import type { GoldBalanceReading } from '@currena/insights';
import { GOLD_VOTER_IDS } from '@currena/insights/page-division';
import {
  GF_F2_PROXY_ID,
  GF_MOVE_P1_PROPOSED,
  GF_VOTERS_P4_5LANE,
  gfLaneBalance,
  gfMoveMapWith,
} from '@currena/insights/gf-p0-proposed';
import { goldOutlookOf } from '../../components/insights/signals/outlook-core';
import { GOLD_CONTEXT_IDS, goldContextCards, goldHero, goldSeatLanes } from './gold-tiles';
import { balanceTilt, balanceVerdictOf } from '../../components/insights/signals/BalanceScale';

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
 * Compare the page's derivations (over the projection's readings) with
 * the engine's (over the served snapshot's readings). Returns one check
 * per comparable value; any `ok: false` is a §21 red finding.
 */
export function backtestGoldPage(pageReadings: readonly IndicatorReading[], engineReadings: readonly IndicatorReading[]): BacktestCheck[] {
  const checks: BacktestCheck[] = [];
  const engineById = new Map(engineReadings.map((r) => [r.id as string, r]));

  /* ---- 0. Input completeness: every engine input rides the projection ---- */
  const pageById = new Map(pageReadings.map((r) => [r.id as string, r]));
  for (const id of [...GOLD_VOTER_IDS, ...GOLD_CONTEXT_IDS]) {
    const present = pageById.has(id);
    checks.push({
      label: `input ${id} rides the projection`,
      ok: present,
      page: present ? 'present' : 'MISSING',
      engine: engineById.has(id) ? 'present in snapshot' : 'absent in snapshot',
    });
  }

  /* ---- 1. The hero — balance counts, net, readable, verdict, beam, outlook ---- */
  const pageHero = goldHero(pageReadings);
  // ENGINE SIDE — the balance + the outlook + the presentation math,
  // exactly as the legacy card and the ingest derive them.
  const engineBalance = goldBalance(engineReadings);
  const engineGold = evaluateSignal('gold', engineReadings);
  const engineOutlook = goldOutlookOf(engineBalance, engineGold.speed, engineGold.position);
  const engineCounts = { ...engineBalance.counts, total: engineBalance.lanes.length, net: engineBalance.net, readable: engineBalance.readable };

  checks.push({
    label: 'gold balance counts (for/against/neutral/unread)',
    ok:
      pageHero.balance.counts.for === engineBalance.counts.for &&
      pageHero.balance.counts.against === engineBalance.counts.against &&
      pageHero.balance.counts.neutral === engineBalance.counts.neutral &&
      pageHero.balance.counts.unread === engineBalance.counts.unread,
    page: show([pageHero.balance.counts.for, pageHero.balance.counts.against, pageHero.balance.counts.neutral, pageHero.balance.counts.unread]),
    engine: show([engineBalance.counts.for, engineBalance.counts.against, engineBalance.counts.neutral, engineBalance.counts.unread]),
  });
  checks.push({
    label: 'gold balance net + readable',
    ok: pageHero.balance.net === engineBalance.net && pageHero.balance.readable === engineBalance.readable,
    page: show([pageHero.balance.net, pageHero.balance.readable]),
    engine: show([engineBalance.net, engineBalance.readable]),
  });
  checks.push({
    label: 'gold outlook (7-state)',
    ok: pageHero.outlook === engineOutlook,
    page: show(pageHero.outlook),
    engine: show(engineOutlook),
  });

  /* ---- 2. THE SEAT-LEVEL DIFF — the S5 gate's own: every one of the
   * 37 seats renders the engine's own impact + evidence, per lane ---- */
  const pageLanes = goldSeatLanes(pageHero.balance);
  for (const engineLane of engineBalance.lanes) {
    const pageLane = pageLanes.find((l) => l.lane === engineLane.lane);
    checks.push({
      label: `lane ${engineLane.lane} side/split/readable/firing`,
      ok:
        pageLane !== undefined &&
        pageLane.side === engineLane.side &&
        pageLane.split === engineLane.split &&
        pageLane.readable === engineLane.readable &&
        pageLane.firing === engineLane.firing &&
        pageLane.supports === engineLane.supports &&
        pageLane.pressures === engineLane.pressures,
      page: show(pageLane && [pageLane.side, pageLane.split, pageLane.readable, pageLane.firing, pageLane.supports, pageLane.pressures]),
      engine: show([engineLane.side, engineLane.split, engineLane.readable, engineLane.firing, engineLane.supports, engineLane.pressures]),
    });
    for (const engineMember of engineLane.members) {
      const pageSeat = pageLane?.seats.find((s) => s.id === engineMember.id);
      checks.push({
        label: `seat ${engineLane.lane}/${engineMember.id} impact`,
        ok: pageSeat !== undefined && pageSeat.impact === engineMember.impact,
        page: show(pageSeat?.impact),
        engine: show(engineMember.impact),
      });
      checks.push({
        label: `seat ${engineLane.lane}/${engineMember.id} evidence`,
        ok: pageSeat !== undefined && pageSeat.evidence === engineMember.evidence,
        page: show(pageSeat?.evidence),
        engine: show(engineMember.evidence),
      });
    }
  }

  /* ---- 3. The hero's verdict word + beam angle (the BalanceScale's own
   *      presentation math over the same counts) ---- */
  const pageCounts = { ...pageHero.balance.counts, total: pageHero.balance.lanes.length, net: pageHero.balance.net, readable: pageHero.balance.readable };
  checks.push({
    label: 'hero verdict word (balanceVerdictOf over the same counts)',
    ok: balanceVerdictOf(pageCounts) === balanceVerdictOf(engineCounts),
    page: show(balanceVerdictOf(pageCounts)),
    engine: show(balanceVerdictOf(engineCounts)),
  });
  checks.push({
    label: 'hero beam tilt (balanceTilt over the same counts)',
    ok: balanceTilt(pageCounts, 320).angleDeg === balanceTilt(engineCounts, 320).angleDeg,
    page: show(balanceTilt(pageCounts, 320).angleDeg),
    engine: show(balanceTilt(engineCounts, 320).angleDeg),
  });

  /* ---- 4. The hero price + the context readings, byte-identical ---- */
  const pageGoldReading = pageById.get('gold-usd');
  const engineGoldReading = engineById.get('gold-usd');
  checks.push({
    label: 'hero price reading gold-usd byte-identical to the snapshot',
    ok: engineGoldReading !== undefined && stableStringify(pageGoldReading) === stableStringify(engineGoldReading),
    page: stableStringify(pageGoldReading),
    engine: stableStringify(engineGoldReading),
  });
  const pageContext = goldContextCards(pageReadings);
  for (const entry of pageContext) {
    const engineReading = engineById.get(entry.id);
    checks.push({
      label: `context reading ${entry.id} byte-identical to the snapshot`,
      ok: engineReading !== undefined && stableStringify(entry.reading) === stableStringify(engineReading),
      page: stableStringify(entry.reading),
      engine: stableStringify(engineReading),
    });
  }

  return checks;
}

/* ------------------------------------------------------------------ *
 * S6 — THE FROZEN-SCENARIO SUITE (the §21 zero-tolerance standard over
 * every recorded corpus window): the frozen harness's OWN arithmetic
 * (gf-p0-proposed.ts — gfLaneBalance over the frozen scenario tables)
 * beside the PAGE renderer's derivations (gold-tiles), window by
 * window, so a drift in either surface's composition, thresholds,
 * evaluator or presentation math surfaces red over HISTORY — not just
 * on today's snapshot (the S5 live run).
 * ------------------------------------------------------------------ */

/**
 * The frozen harness's PRODUCTION composition — GF_VOTERS_P4_5LANE with
 * the F2 scenario proxy mapped to its recorded production seat
 * (gf-f2-gross-long-share ↔ cftc-gold-gross-long, the GF-S8 design
 * decision; the set-equality with GOLD_LANE_VOTERS is pinned by
 * gf-p0-proposed.test.ts). The mapping lives HERE, at the consumer, so
 * the frozen tables stay untouched.
 */
export const GF_PRODUCTION_VOTERS = GF_VOTERS_P4_5LANE.map((v) =>
  v.id === GF_F2_PROXY_ID ? { ...v, id: 'cftc-gold-gross-long' as const } : v,
);

/** The harness's own GoldBalanceReading-shaped result — the pure
 * classifier inputs (goldOutlookOf reads counts only; members are never
 * consulted) rebuilt from the frozen engine's numbers, never the page's. */
function harnessBalanceOf(readings: readonly IndicatorReading[]): GoldBalanceReading {
  const h = gfLaneBalance(readings, GF_PRODUCTION_VOTERS, GOLD_LANES, 2, gfMoveMapWith(GF_MOVE_P1_PROPOSED), true);
  return {
    lanes: h.lanes.map((l) => ({ ...l, lane: l.lane as GoldBalanceReading['lanes'][number]['lane'], members: [] })),
    counts: h.counts,
    net: h.net,
    readable: h.readable,
  };
}

/**
 * The S6 frozen-scenario window sweep: the PAGE renderer (gold-tiles'
 * goldHero + goldSeatLanes + the BalanceScale's own presentation math)
 * vs the FROZEN HARNESS (gfLaneBalance over the production scenario
 * composition, MIN2, the D-18 input-presence rule, the executed
 * threshold map). `harnessReadings` defaults to the page's own readings
 * (the sweep's semantics: both surfaces over the SAME recorded window);
 * the fail-closed proofs pass a divergent copy — the S5 core's two-path
 * shape, so a drift in EITHER surface's code path surfaces red. Every
 * check must hold on EVERY recorded window — meter counts, lane votes,
 * beam angle, outlook, verdict (§21: byte-identical, zero tolerance).
 */
export function backtestGoldPageVsHarness(
  pageReadings: readonly IndicatorReading[],
  harnessReadings: readonly IndicatorReading[] = pageReadings,
): BacktestCheck[] {
  const checks: BacktestCheck[] = [];
  const harness = gfLaneBalance(harnessReadings, GF_PRODUCTION_VOTERS, GOLD_LANES, 2, gfMoveMapWith(GF_MOVE_P1_PROPOSED), true);
  const harnessBalance = harnessBalanceOf(harnessReadings);

  /* ---- 1. The meter counts — page vs the frozen harness ---- */
  const pageHero = goldHero(pageReadings);
  checks.push({
    label: 'frozen-scenario meter counts (for/against/neutral/unread)',
    ok:
      pageHero.balance.counts.for === harness.counts.for &&
      pageHero.balance.counts.against === harness.counts.against &&
      pageHero.balance.counts.neutral === harness.counts.neutral &&
      pageHero.balance.counts.unread === harness.counts.unread,
    page: show([pageHero.balance.counts.for, pageHero.balance.counts.against, pageHero.balance.counts.neutral, pageHero.balance.counts.unread]),
    engine: show([harness.counts.for, harness.counts.against, harness.counts.neutral, harness.counts.unread]),
  });
  checks.push({
    label: 'frozen-scenario net + readable',
    ok: pageHero.balance.net === harness.net && pageHero.balance.readable === harness.readable,
    page: show([pageHero.balance.net, pageHero.balance.readable]),
    engine: show([harness.net, harness.readable]),
  });

  /* ---- 2. The lane votes — side/split/readable/firing, lane by lane ---- */
  const pageLanes = goldSeatLanes(pageHero.balance);
  for (const harnessLane of harness.lanes) {
    const pageLane = pageLanes.find((l) => l.lane === harnessLane.lane);
    checks.push({
      label: `frozen-scenario lane ${harnessLane.lane} side/split/readable/firing`,
      ok:
        pageLane !== undefined &&
        pageLane.side === harnessLane.side &&
        pageLane.split === harnessLane.split &&
        pageLane.readable === harnessLane.readable &&
        pageLane.firing === harnessLane.firing &&
        pageLane.supports === harnessLane.supports &&
        pageLane.pressures === harnessLane.pressures,
      page: show(pageLane && [pageLane.side, pageLane.split, pageLane.readable, pageLane.firing, pageLane.supports, pageLane.pressures]),
      engine: show([harnessLane.side, harnessLane.split, harnessLane.readable, harnessLane.firing, harnessLane.supports, harnessLane.pressures]),
    });
  }

  /* ---- 3. The beam + the verdict — the presentation math over each
   *      side's OWN counts must agree (one formula: D-GB-8) ---- */
  const pageCounts = { ...pageHero.balance.counts, total: pageHero.balance.lanes.length, net: pageHero.balance.net, readable: pageHero.balance.readable };
  const harnessCounts = { ...harness.counts, total: harness.lanes.length, net: harness.net, readable: harness.readable };
  checks.push({
    label: 'frozen-scenario beam angle (harness D-GB-8 vs balanceTilt)',
    ok: harness.beamAngle === balanceTilt(pageCounts, 320).angleDeg && harness.beamAngle === balanceTilt(harnessCounts, 320).angleDeg,
    page: show(balanceTilt(pageCounts, 320).angleDeg),
    engine: show(harness.beamAngle),
  });
  const harnessVerdict = balanceVerdictOf(harnessCounts);
  checks.push({
    label: 'frozen-scenario verdict word state',
    ok: balanceVerdictOf(pageCounts) === harnessVerdict,
    page: show(balanceVerdictOf(pageCounts)),
    engine: show(harnessVerdict),
  });

  /* ---- 4. The 7-state outlook — the pure classifier over each side's
   *      own balance + its own gold signal evidence ---- */
  const gold = evaluateSignal('gold', harnessReadings);
  const harnessOutlook = goldOutlookOf(harnessBalance, gold.speed, gold.position);
  checks.push({
    label: 'frozen-scenario outlook (7-state)',
    ok: pageHero.outlook === harnessOutlook,
    page: show(pageHero.outlook),
    engine: show(harnessOutlook),
  });

  return checks;
}
