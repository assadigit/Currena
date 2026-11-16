/**
 * gold-frozen-scenarios.test — the S6 frozen-scenario suite, OFFLINE
 * (page-division S6, 2026-11-08 — the §21 zero-tolerance standard over
 * every recorded corpus window).
 *
 * THE S6 GATE'S OWN (the session roadmap: "frozen-scenario suite re-run
 * against the page renderer"): the frozen harness's scenario tables
 * (packages/insights/src/gf-p0-proposed.ts — the read-only calibration
 * compositions) drive the PAGE renderer window by window over the
 * RECORDED CORPUS (packages/insights/fixtures/gold-backtest-corpus.json
 * — 19 archive days, the read-only KV dump), and the outputs are pinned
 * BYTE-IDENTICAL to the frozen harness's own arithmetic:
 *
 *   1. EVERY archive day: the page side (gold-tiles' goldHero +
 *      goldSeatLanes + the BalanceScale's own tilt/verdict math) ≡ the
 *      frozen harness (gfLaneBalance over the PRODUCTION scenario
 *      composition — GF_VOTERS_P4_5LANE with the recorded F2 mapping,
 *      MIN2, the D-18 input-presence rule, the executed threshold map)
 *      on the meter counts, every lane vote, the beam angle, the
 *      verdict state and the 7-state outlook;
 *   2. EVERY archive day: the S5 seat-level diff (backtestGoldPage)
 *      re-run over the historical window — green over history, not just
 *      today's snapshot;
 *   3. EVERY scenario of the frozen family (gfScenarios — 9
 *      compositions × 2 crowd rules): the harness re-run is
 *      DETERMINISTIC (two independent runs byte-identical) and the
 *      production scenario's composition is the production table modulo
 *      the recorded F2 seat mapping;
 *   4. FAIL-CLOSED PROOFS: a mutated window reading flips the suite
 *      red (the suite can fail — never a rubber stamp).
 *
 * Nothing here hits a live site (Agent Rule 7): the corpus is the
 * recorded, committed fixture; the frozen clock is the recorded
 * generatedAt stamps. Pure + offline so `pnpm -r test` runs it.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { IndicatorReading } from '@currena/core';
import { GOLD_LANE_VOTERS } from '@currena/insights';
import { gfLaneBalance, gfScenarios } from '@currena/insights/gf-p0-proposed';
import { backtestGoldPage, backtestGoldPageVsHarness, GF_PRODUCTION_VOTERS } from './gold-backtest-core';

/* ------------------------------------------------------------------ *
 * The recorded corpus — the read-only KV dump (gold-corpus-dump.ts)
 * ------------------------------------------------------------------ */

interface CorpusArchive {
  generatedAt: string;
  readings: Array<{
    id: IndicatorReading['id'];
    value: number;
    asOf: string;
    status: IndicatorReading['status'];
    percentile10y?: number;
    change30d?: number;
  }>;
}

const corpus = JSON.parse(
  readFileSync(new URL('../../../../../packages/insights/fixtures/gold-backtest-corpus.json', import.meta.url), 'utf8'),
) as { recordedAt: string; archives: Record<string, CorpusArchive> };

/** Every recorded archive day, in order — the frozen windows. */
const DAYS = Object.keys(corpus.archives).sort();

/** One day's readings as the page-shaped IndicatorReading array (the
 * gold-balance.test fixtureReadings pattern — the archive's own values
 * and stamps, sourceName the archive day, updatedAt the rung's
 * generatedAt). */
function dayReadings(day: string): IndicatorReading[] {
  const archive = corpus.archives[day]!;
  return archive.readings.map((r) => ({
    id: r.id,
    value: r.value,
    asOf: r.asOf,
    status: r.status,
    percentile10y: r.percentile10y,
    change30d: r.change30d,
    sourceName: `archive ${day}`,
    updatedAt: archive.generatedAt,
  })) as IndicatorReading[];
}

/* ------------------------------------------------------------------ *
 * 1 + 2 — the window sweep: page ≡ frozen harness, day by day
 * ------------------------------------------------------------------ */

describe('S6 frozen-scenario suite — the page renderer over every recorded window', () => {
  it('the corpus carries the recorded archive days (the suite has windows to sweep)', () => {
    expect(DAYS.length).toBeGreaterThanOrEqual(10);
  });

  it('EVERY archive day: page ≡ frozen harness on counts, lane votes, beam, verdict, outlook (§21 zero tolerance)', () => {
    expect(DAYS.length).toBeGreaterThan(0);
    for (const day of DAYS) {
      const checks = backtestGoldPageVsHarness(dayReadings(day));
      const red = checks.filter((c) => !c.ok);
      expect(red, `${day}: ${red.map((c) => `${c.label} (page ${c.page} vs harness ${c.engine})`).join('; ')}`).toEqual([]);
    }
  });

  it('EVERY archive day: the S5 derivation families re-run green over the historical window (the seat-level half, filtered to the era the window records)', () => {
    // The S5 core (backtestGoldPage) is a LIVE-PROJECTION diff: its
    // check #0 demands every input rides the projection, and its
    // context byte-checks demand every home reading exists — both true
    // on the served projection, both honestly FALSE on the recorded
    // windows (the corpus's archives predate the P2/P3/P4 seat
    // promotions; the later seats are absent from BOTH sides — the
    // pre-promotion era, never a drift). The DERIVATION families —
    // the hero, the lane votes, the seat-level impacts, the beam, the
    // verdict — are era-independent: re-run those over history, and
    // let the input/context presence checks stay the live tool they
    // are (the pd-s5 live script, re-run against production at this
    // session's close).
    for (const day of DAYS) {
      const readings = dayReadings(day);
      const checks = backtestGoldPage(readings, readings).filter(
        (c) => !c.label.startsWith('input ') && !c.label.startsWith('context reading ') && c.label !== 'hero price reading gold-usd byte-identical to the snapshot',
      );
      expect(checks.length).toBeGreaterThan(40); // the derivation families are present
      const red = checks.filter((c) => !c.ok);
      expect(red, `${day}: ${red.map((c) => `${c.label} (page ${c.page} vs engine ${c.engine})`).join('; ')}`).toEqual([]);
    }
  });

  it('the windows carry DIVERSE verdict shapes (the sweep is not one repeated answer)', () => {
    const states = new Set<string>();
    for (const day of DAYS) {
      const checks = backtestGoldPageVsHarness(dayReadings(day));
      const counts = checks.find((c) => c.label.startsWith('frozen-scenario meter counts'))!;
      states.add(counts.engine);
    }
    // The recorded windows include at least the live shape and one other
    // (the corpus spans 2026-10-15 → 2026-11-03 — verdicts moved).
    expect(states.size).toBeGreaterThanOrEqual(2);
  });
});

/* ------------------------------------------------------------------ *
 * 3 — the frozen scenario family re-run (deterministic + production ≡)
 * ------------------------------------------------------------------ */

describe('S6 frozen-scenario suite — the frozen family over every window', () => {
  it('every scenario of the family re-runs DETERMINISTICALLY over every window (two runs, byte-identical)', () => {
    const scenarios = gfScenarios();
    expect(scenarios.length).toBe(18); // 9 compositions × 2 crowd rules
    for (const scenario of scenarios) {
      for (const day of DAYS) {
        const readings = dayReadings(day);
        const first = gfLaneBalance(readings, scenario.voters, scenario.lanes, scenario.minFiring, scenario.moveMap, scenario.inputPresence);
        const second = gfLaneBalance(readings, scenario.voters, scenario.lanes, scenario.minFiring, scenario.moveMap, scenario.inputPresence);
        expect(second, `${scenario.name} · ${day}`).toEqual(first);
      }
    }
  });

  it('the PRODUCTION scenario composition IS the production table modulo the recorded F2 seat mapping', () => {
    // The set-equality is pinned at the source (gf-p0-proposed.test.ts);
    // this pin holds the S6 consumer's OWN mapping constant — the
    // backtest core's harness side reads exactly the frozen table.
    const sortByLaneAndId = (a: { lane: string; id: string }, b: { lane: string; id: string }) =>
      a.lane.localeCompare(b.lane) || a.id.localeCompare(b.id);
    expect([...GF_PRODUCTION_VOTERS].sort(sortByLaneAndId)).toEqual([...GOLD_LANE_VOTERS].sort(sortByLaneAndId));
  });
});

/* ------------------------------------------------------------------ *
 * 4 — fail-closed proofs (the suite can fail — never a rubber stamp):
 * the S5 pattern — a divergent harness-side copy must surface red.
 * ------------------------------------------------------------------ */

describe('S6 frozen-scenario suite — fail-closed proofs', () => {
  it('a MUTATED harness-side reading flips the sweep red (a flipped seat surfaces in its lane)', () => {
    const day = DAYS[DAYS.length - 1]!;
    const readings = dayReadings(day);
    // Mutate real-yield-10y's 30-day change on the HARNESS side only —
    // hard past the threshold in the opposite direction, so the seat's
    // lean flips and its lane's supports/pressures counts diverge.
    const mutated = readings.map((r) => ({ ...r }));
    const target = mutated.find(
      (r) => r.id === 'real-yield-10y' && r.change30d !== undefined && Number.isFinite(r.change30d),
    );
    expect(target, 'the corpus window carries real-yield-10y with a change30d').toBeDefined();
    target!.change30d = target!.change30d! > 0 ? -5 : 5;

    const checks = backtestGoldPageVsHarness(readings, mutated);
    const red = checks.filter((c) => !c.ok);
    expect(red.length).toBeGreaterThan(0);
    expect(red.some((c) => c.label.includes('lane borrowing-costs'))).toBe(true);
  });

  it('DROPPED harness-side lane readings flip the lane-vote check red (the page reads a lane the harness no longer sees)', () => {
    const day = DAYS[DAYS.length - 1]!;
    const readings = dayReadings(day);
    const dropped = readings.filter((r) => r.id !== 'us10y' && r.id !== 'us30y' && r.id !== 'real-yield-10y');
    const checks = backtestGoldPageVsHarness(readings, dropped);
    const laneCheck = checks.find((c) => c.label === 'frozen-scenario lane borrowing-costs side/split/readable/firing')!;
    expect(laneCheck.ok).toBe(false);
  });

  it('the mutation is VISIBLE in the meter (the window sweep answers a moved reading, not a rubber stamp)', () => {
    // Over the SAME mutated window on BOTH sides (one evaluator), the
    // mutation must move the derived meter off the recorded window's
    // own counts — the suite reads the reading, never a cached answer.
    const day = DAYS[DAYS.length - 1]!;
    const readings = dayReadings(day);
    const mutated = readings.map((r) => {
      if (r.id === 'real-yield-10y' && r.change30d !== undefined && Number.isFinite(r.change30d)) {
        return { ...r, change30d: r.change30d > 0 ? -5 : 5 };
      }
      return { ...r };
    });
    const baseline = backtestGoldPageVsHarness(readings).find((c) => c.label.startsWith('frozen-scenario meter counts'))!;
    const moved = backtestGoldPageVsHarness(mutated).find((c) => c.label.startsWith('frozen-scenario meter counts'))!;
    // The page ≡ harness relation HOLDS on the mutated window (one
    // evaluator, both sides moved together)…
    expect(moved.ok).toBe(true);
    expect(baseline.ok).toBe(true);
    // …and the mutation MOVED the derived lane votes (the seat-level
    // effect the fail-closed proof above surfaces when the sides
    // diverge). The seat's flip must be visible in its lane's counts.
    const laneBaseline = backtestGoldPageVsHarness(readings).find((c) => c.label === 'frozen-scenario lane borrowing-costs side/split/readable/firing')!;
    const laneMoved = backtestGoldPageVsHarness(mutated).find((c) => c.label === 'frozen-scenario lane borrowing-costs side/split/readable/firing')!;
    expect(laneMoved.engine === laneBaseline.engine).toBe(false);
  });
});
