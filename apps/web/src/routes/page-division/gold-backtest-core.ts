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
import { evaluateSignal, goldBalance } from '@currena/insights';
import { GOLD_VOTER_IDS } from '@currena/insights/page-division';
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
