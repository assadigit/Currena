/**
 * gf-p1-verify.ts — the GF-P1 recalibration verification (D-GF-6: the
 * C1/C2 verdicts + the lane stats re-derived over the corpus BEFORE any
 * new seat counts — the owner's recorded answers A/H/I/J executed at
 * GF-P1, 2026-11-05; docs/specs/gold-meter-gapfill/).
 *
 * WHAT IT RUNS (read-only: no product edits, no KV writes, no deploy):
 *
 *  A. the POST-BASIS WINDOW ASSEMBLY — the gf-p0-calibration.ts
 *     replication over the frozen corpus + the GF-P0 fixtures: the same
 *     2512-window gold trading-day grid, the same frozen clock, the same
 *     no-lookahead truncation, the same D-6 real-yield cross-fill, the
 *     D-4 CFTC backfill swapped in for cftc-gold-positioning and the
 *     derived gap history for us-japan-10y-gap (the exact POST basis the
 *     committed calibration measured).
 *  B. the PRODUCTION ≡ SCENARIO PIN, window-for-window — the PRODUCTION
 *     engine (`goldBalance` — the 19-seat table, the D-18 rule, the
 *     production `SIGNAL_LEG_MOVE` with the executed five) vs the
 *     measured POST-P1-DEMOTE scenario (`gfLaneBalance` over
 *     GF_VOTERS_P1_DEMOTE + gfMoveMapWith(GF_MOVE_P1_PROPOSED) +
 *     inputPresence, MIN2): every lane's side/split/readable/firing/
 *     supports/pressures and the counts/net/readable must agree in ALL
 *     2512 windows — the shipped meter and the measured scenario are the
 *     same object.
 *  C. the COMMITTED-NUMBER DRIFT GATE — the POST-P1-DEMOTE stats must
 *     reproduce the committed calibration report's §4 row (MIN2/MIN1 ×
 *     all/mature). A mismatch means something drifted; the run stops.
 *  D. the EVIDENCE — the re-derived C1/C2 verdicts under the owner's
 *     recorded answer A ((a) keep the criteria + MIN2 on judgment), the
 *     per-lane state tables, the D-18 rule's measured rendering, and the
 *     beam-state shares — written to
 *     docs/specs/gold-meter-gapfill/evidence/gf-p1-verify-2026-11-05.md
 *     (+ the run record .txt).
 *
 * NO FORECASTING CLAIM ANYWHERE (D-GF-3): firing statistics and lane
 * behaviour only — the standing no-edge record is untouched.
 *
 * Manual (the gf-p0-calibration discipline):
 *   pnpm --filter @currena/insights gf-p1-verify
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IndicatorDefinition, IndicatorId, IndicatorReading } from '@currena/core';

import { DEFINITIONS, computeReading } from '../src/index';
import { goldBalance } from '../src/gold-balance';
import { GOLD_LANE_VOTERS } from '../src/gold-score';
import { realYieldScoringSeries } from '../src/real-yield-fill';
import { combineSeries, fromEpochDay, type SeriesPoint } from '../src/series';
import { seriesUpTo } from '../src/gold-backtest-core';
import { GF_MOVE_P1_PROPOSED, GF_VOTERS_P1_DEMOTE, gfCalibrationStats, gfLaneBalance, gfMoveMapWith, gfNetScore, GF_LANES_4, type GfLaneBalance } from '../src/gf-p0-proposed';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = join(HERE, '..', 'fixtures', 'gold-backtest-corpus.json');
const CANDIDATES_PATH = join(HERE, '..', 'fixtures', 'gf-p0-candidates.json');
const CFTC_PATH = join(HERE, '..', 'fixtures', 'gf-p0-cftc-backfill.json');
const OUT_MD = join(HERE, '..', '..', '..', 'docs', 'specs', 'gold-meter-gapfill', 'evidence', 'gf-p1-verify-2026-11-05.md');
const OUT_RUN = join(HERE, '..', '..', '..', 'docs', 'specs', 'gold-meter-gapfill', 'evidence', 'gf-p1-run-2026-11-05.txt');

/* ------------------------------------------------------------------ *
 * The fixtures (recorded, offline, read-only — the calibration's own)
 * ------------------------------------------------------------------ */

interface Corpus {
  recordedAt: string;
  series: Record<string, Array<[number, number]>>;
  goldHist: { points: Array<[number, number]> };
}
interface CandidatesFixture {
  v: number;
  recordedAt: string;
  series: Record<string, Array<[number, number]>>;
}
interface CftcFixture {
  v: number;
  weeks: Array<{ date: string; netSharePct: number }>;
}

const corpus: Corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));
const candidates: CandidatesFixture = JSON.parse(readFileSync(CANDIDATES_PATH, 'utf8'));
const cftc: CftcFixture = JSON.parse(readFileSync(CFTC_PATH, 'utf8'));

const asPairs = (pairs: Array<[number, number]>): SeriesPoint[] => pairs.map(([day, value]) => ({ date: fromEpochDay(day), value }));

const SERIES: Record<string, SeriesPoint[]> = {};
for (const [id, pairs] of Object.entries(corpus.series)) SERIES[id] = asPairs(pairs);
const GOLD: SeriesPoint[] = asPairs(corpus.goldHist.points);
const CAND_SERIES: Record<string, SeriesPoint[]> = {};
for (const [id, pairs] of Object.entries(candidates.series)) CAND_SERIES[id] = asPairs(pairs);

/** The D-6 gap derivation (run.ts's quantizedGap, replicated). */
function quantizedGap(us: SeriesPoint[], jp: SeriesPoint[]): SeriesPoint[] {
  const gap = combineSeries(us, jp, (a, b) => a - b);
  const f = 10_000;
  return gap.map((p) => ({ date: p.date, value: Math.round(p.value * f) / f }));
}
const GAP_DERIVED = quantizedGap(SERIES['us10y']!, CAND_SERIES['jgb-10y']!);
const CFTC_BACKFILL_NET: SeriesPoint[] = cftc.weeks.map((w) => ({ date: w.date, value: w.netSharePct }));

const defById = new Map<string, IndicatorDefinition>(DEFINITIONS.map((d) => [d.id as string, d]));
const REAL_YIELD_ID = 'real-yield-10y';
const FILL_LEGS = { nominal: 'us10y', breakeven: 'breakeven-10y' } as const;
const MATURE_FROM = '2021-09-23';
const frozenNow = (day: string): string => `${day}T04:10:00.000Z`;
const isMature = (day: string): boolean => day >= MATURE_FROM;
const source = { name: 'GF-P1 verify (the GF-P0 fixtures, the POST basis)' };

/* The POST-basis readings for the 19 PRODUCTION voters only (the shipped
 * meter's own inputs): the corpus series, with the D-4 backfill swapped
 * in for cftc-gold-positioning and the derived gap for us-japan-10y-gap. */
const PRODUCTION_IDS: readonly IndicatorId[] = GOLD_LANE_VOTERS.map((v) => v.id);

/* ------------------------------------------------------------------ *
 * A. The window assembly (the POST basis, the production voters)
 * ------------------------------------------------------------------ */

interface Window {
  date: string;
  readings: IndicatorReading[];
}

const gridDates = GOLD.map((p) => p.date);
const windows: Window[] = [];
for (const day of gridDates) {
  const now = frozenNow(day);
  const fill = realYieldScoringSeries(
    seriesUpTo(SERIES[REAL_YIELD_ID]!, day),
    seriesUpTo(SERIES[FILL_LEGS.nominal]!, day),
    seriesUpTo(SERIES[FILL_LEGS.breakeven]!, day),
    now,
  );
  const readings: IndicatorReading[] = [];
  for (const id of PRODUCTION_IDS) {
    const def = defById.get(id);
    if (def === undefined) throw new Error(`No DEFINITIONS entry for ${id}`);
    let series: SeriesPoint[] | undefined;
    if (id === REAL_YIELD_ID) {
      series = fill.series !== undefined && fill.fills > 0 ? fill.series : seriesUpTo(SERIES[id]!, day);
    } else if (id === 'cftc-gold-positioning') {
      series = seriesUpTo(CFTC_BACKFILL_NET, day); // the D-4 backfill (the POST basis)
    } else if (id === 'us-japan-10y-gap') {
      series = seriesUpTo(GAP_DERIVED, day); // the D-6 persisted history (the POST basis)
    } else if (SERIES[id] !== undefined) {
      series = seriesUpTo(SERIES[id]!, day);
    } else if (CAND_SERIES[id] !== undefined) {
      series = seriesUpTo(CAND_SERIES[id]!, day);
    }
    if (series !== undefined) readings.push(computeReading(def, series, now, source));
  }
  windows.push({ date: day, readings });
}

console.log(`# GF-P1 verify — ${new Date().toISOString()}`);
console.log(`windows: ${windows.length} (${gridDates[0]} → ${gridDates[gridDates.length - 1]}); mature ≥ ${MATURE_FROM}: ${windows.filter((w) => isMature(w.date)).length}`);
console.log(`production voters: ${PRODUCTION_IDS.length} (GOLD_LANE_VOTERS, GF-P1's 19-seat table)`);

/* ------------------------------------------------------------------ *
 * B. The production ≡ scenario pin, window-for-window
 * ------------------------------------------------------------------ */

const P1_MOVE_MAP = gfMoveMapWith(GF_MOVE_P1_PROPOSED);
let mismatches = 0;
const scenarioBalances: GfLaneBalance[] = [];
const netScores: number[] = [];
const dates: string[] = [];
for (const w of windows) {
  const production = goldBalance(w.readings);
  const scenario = gfLaneBalance(w.readings, GF_VOTERS_P1_DEMOTE, GF_LANES_4, 2, P1_MOVE_MAP, true);
  // The lane-level fields + the rollups must agree exactly.
  let equal =
    production.net === scenario.net &&
    production.readable === scenario.readable &&
    production.counts.for === scenario.counts.for &&
    production.counts.against === scenario.counts.against &&
    production.counts.neutral === scenario.counts.neutral &&
    production.counts.unread === scenario.counts.unread &&
    production.lanes.length === scenario.lanes.length;
  if (equal) {
    for (let i = 0; i < production.lanes.length; i++) {
      const a = production.lanes[i]!;
      const b = scenario.lanes[i]!;
      if (
        a.lane !== (b.lane as typeof a.lane) ||
        a.side !== b.side ||
        a.split !== b.split ||
        a.readable !== b.readable ||
        a.firing !== b.firing ||
        a.supports !== b.supports ||
        a.pressures !== b.pressures
      ) {
        equal = false;
        break;
      }
    }
  }
  if (!equal) {
    mismatches++;
    if (mismatches <= 5) {
      console.error(`  ✗ MISMATCH @ ${w.date}: production net ${production.net} vs scenario net ${scenario.net}`);
    }
  }
  scenarioBalances.push(scenario);
  netScores.push(gfNetScore(w.readings, GF_VOTERS_P1_DEMOTE, P1_MOVE_MAP));
  dates.push(w.date);
}
if (mismatches > 0) {
  throw new Error(
    `[gf-p1-verify] FATAL: the production engine and the measured POST-P1-DEMOTE scenario disagree in ${mismatches} of ${windows.length} windows — the shipped meter is NOT the measured scenario. Nothing written.`,
  );
}
console.log(`✓ the production engine ≡ the POST-P1-DEMOTE scenario in ALL ${windows.length} windows (every lane field + the rollups)`);

/* ------------------------------------------------------------------ *
 * C. The committed-number drift gate (the calibration report §4)
 * ------------------------------------------------------------------ */

const matureIdx = windows.map((w, i) => (isMature(w.date) ? i : -1)).filter((i) => i >= 0);
const all = gfCalibrationStats(scenarioBalances, netScores, GF_LANES_4);
const mature = gfCalibrationStats(
  matureIdx.map((i) => scenarioBalances[i]!),
  matureIdx.map((i) => netScores[i]!),
  GF_LANES_4,
);

/** The committed POST-P1-DEMOTE row (evidence/gf-p0-calibration-2026-11-05.md §4 — the shares AS COMMITTED, one decimal) — the drift gate. */
const COMMITTED: Record<string, { levelShare: number; fullTipShare: number; flips: number; netFlips: number }> = {
  'MIN2|all': { levelShare: 0.206, fullTipShare: 0.481, flips: 8, netFlips: 7 },
  'MIN2|mature': { levelShare: 0.192, fullTipShare: 0.627, flips: 6, netFlips: 7 },
  'MIN1|all': { levelShare: 0.267, fullTipShare: 0.227, flips: 9, netFlips: 7 },
  'MIN1|mature': { levelShare: 0.3, fullTipShare: 0.274, flips: 6.5, netFlips: 7 },
};

/** MIN1 twin run (the pre-registered fallback rule, measured beside). */
const scenarioBalancesMin1 = windows.map((w) => gfLaneBalance(w.readings, GF_VOTERS_P1_DEMOTE, GF_LANES_4, 1, P1_MOVE_MAP, true));
const allMin1 = gfCalibrationStats(scenarioBalancesMin1, netScores, GF_LANES_4);
const matureMin1 = gfCalibrationStats(
  matureIdx.map((i) => scenarioBalancesMin1[i]!),
  matureIdx.map((i) => netScores[i]!),
  GF_LANES_4,
);

function checkCommitted(
  label: string,
  s: { n: number; level: number; fullyTipped: number; flipsMedianPer60: number | null; netSignFlipsMedianPer60: number | null },
  c: { levelShare: number; fullTipShare: number; flips: number; netFlips: number },
): void {
  const levelShare = Math.round((s.level / s.n) * 1000) / 1000;
  const fullTipShare = Math.round((s.fullyTipped / s.n) * 1000) / 1000;
  const ok =
    levelShare === c.levelShare &&
    fullTipShare === c.fullTipShare &&
    s.flipsMedianPer60 === c.flips &&
    s.netSignFlipsMedianPer60 === c.netFlips;
  if (!ok) {
    throw new Error(
      `[gf-p1-verify] FATAL: POST-P1-DEMOTE drift at ${label}: measured (level ${(levelShare * 100).toFixed(1)}%, fullTip ${(fullTipShare * 100).toFixed(1)}%, flips ${s.flipsMedianPer60} vs ${s.netSignFlipsMedianPer60}) vs committed (${(c.levelShare * 100).toFixed(1)}%, ${(c.fullTipShare * 100).toFixed(1)}%, ${c.flips} vs ${c.netFlips}) — the harness drifted; investigate before writing anything.`,
    );
  }
  console.log(
    `✓ ${label}: level ${s.level}/${s.n} (${(levelShare * 100).toFixed(1)}%) · full-tip ${s.fullyTipped} (${(fullTipShare * 100).toFixed(1)}%) · flips ${s.flipsMedianPer60} vs net-sign ${s.netSignFlipsMedianPer60} — matches the committed report`,
  );
}

checkCommitted('MIN2|all', all, COMMITTED['MIN2|all']!);
checkCommitted('MIN2|mature', mature, COMMITTED['MIN2|mature']!);
checkCommitted('MIN1|all', allMin1, COMMITTED['MIN1|all']!);
checkCommitted('MIN1|mature', matureMin1, COMMITTED['MIN1|mature']!);

/* ------------------------------------------------------------------ *
 * D. The evidence
 * ------------------------------------------------------------------ */

const pct = (n: number, d: number): string => `${((n / d) * 100).toFixed(1)}%`;
const emit = (...lines: string[]): void => console.log(lines.join('\n'));

const laneUnreadLines = GF_LANES_4.map((lane) => `| ${lane} | ${all.laneUnread[lane] ?? 0} (${pct(all.laneUnread[lane] ?? 0, all.n)}) | ${all.laneSplit[lane] ?? 0} (${pct(all.laneSplit[lane] ?? 0, all.n)}) |`);

emit(
  '',
  `## The re-derived verdict (MIN2 — the owner's recorded answer A: keep the criteria + MIN2 on judgment)`,
  `all windows (n=${all.n}): level ${all.level} (${pct(all.level, all.n)}) · full-tip ${all.fullyTipped} (${pct(all.fullyTipped, all.n)}) · C1 ${all.c1 ? 'PASS' : 'FAIL'} · lane flips ${all.flipsMedianPer60} vs the set's own net-sign ${all.netSignFlipsMedianPer60} → C2 ${all.c2 ? 'PASS' : 'FAIL'}`,
  `mature base (n=${mature.n}): level ${mature.level} (${pct(mature.level, mature.n)}) · full-tip ${mature.fullyTipped} (${pct(mature.fullyTipped, mature.n)}) · C1 ${mature.c1 ? 'PASS' : 'FAIL'} · flips ${mature.flipsMedianPer60} vs ${mature.netSignFlipsMedianPer60} → C2 ${mature.c2 ? 'PASS' : 'FAIL'}`,
);

const md = `# GF-P1 verify — the production ≡ scenario pin + the recalibrated lane rule (2026-11-05)

**Generated by \`packages/insights/scripts/gf-p1-verify.ts\` (this file IS the committed run).** The GF-P1 repairs executed on the owner's recorded answers (GF-S7, 2026-11-05 — the answer sheet: docs/specs/gold-meter-gapfill/README.md): **A** (a) keep the criteria + MIN2 on judgment — the P1 go; **H** (b) the D-7/D-8 context demotion (the 21-voter table became 19); **I** the D-18 input-presence rule; **J** the five derived thresholds (fed-expectations 0.13 · usdjpy 1.38 · fed-target 0.25 · term-premium-10y 0.07 · t5yie 0.10). The measured basis: the frozen gold-backtest corpus + the GF-P0 fixtures (the D-4 CFTC backfill, the D-6 derived gap — the exact POST basis the committed calibration measured), 2512 windows 2016-11-07 → 2026-11-03, the frozen clock, no lookahead, the D-6 real-yield cross-fill.

## 1. The production ≡ scenario pin (D-GF-6's first half)

The PRODUCTION engine (\`goldBalance\` — the 19-seat \`GOLD_LANE_VOTERS\`, the D-18 rule, the production \`SIGNAL_LEG_MOVE\` carrying the executed five) and the measured POST-P1-DEMOTE scenario (\`gfLaneBalance\` over \`GF_VOTERS_P1_DEMOTE\` + \`gfMoveMapWith(GF_MOVE_P1_PROPOSED)\` + inputPresence, MIN2) agree in **ALL ${windows.length} windows** — every lane's side/split/readable/firing/supports/pressures and the counts/net/readable. **The shipped meter and the measured scenario are the same object.** The composition equality (GOLD_LANE_VOTERS ≡ GF_VOTERS_P1_DEMOTE) and the threshold-map equality (SIGNAL_LEG_MOVE ≡ the frozen four + the executed five) are pinned by test (gf-p0-proposed.test.ts).

## 2. The recalibrated lane rule (D-GF-6's second half — the C1/C2 re-derivation over the corpus)

The pre-registered criteria are the GB 02 §6 protocol's own, unchanged: **C1** (not degenerate: level ≤ 70% AND fully-tipped ≤ 60%), **C2** (the lane verdict's median flips per 60 trading days ≤ the same set's own raw net-sign figure). The owner's recorded answer A resolves the C2 STOP branch **on judgment: keep the criteria + MIN2** — the measured verdicts below are stated honestly, never narrated away (the calibration report §4's reading, now the owner's recorded position: the C2 failure is the price of the coverage; the absolute smoothness stays comparable to the frozen 8 flips/60td).

| Rule | Scope | n | level | full-tip | C1 | lane flips / 60td | net-sign flips / 60td | C2 |
|---|---|---|---|---|---|---|---|---|
| MIN2 (production) | all windows | ${all.n} | ${pct(all.level, all.n)} | ${pct(all.fullyTipped, all.n)} | ${all.c1 ? 'PASS' : 'FAIL'} | ${all.flipsMedianPer60} | ${all.netSignFlipsMedianPer60} | ${all.c2 ? 'PASS' : 'FAIL'} |
| MIN2 (production) | mature (≥ ${MATURE_FROM}) | ${mature.n} | ${pct(mature.level, mature.n)} | ${pct(mature.fullyTipped, mature.n)} | ${mature.c1 ? 'PASS' : 'FAIL'} | ${mature.flipsMedianPer60} | ${mature.netSignFlipsMedianPer60} | ${mature.c2 ? 'PASS' : 'FAIL'} |
| MIN1 (the fallback, measured beside) | all windows | ${allMin1.n} | ${pct(allMin1.level, allMin1.n)} | ${pct(allMin1.fullyTipped, allMin1.n)} | ${allMin1.c1 ? 'PASS' : 'FAIL'} | ${allMin1.flipsMedianPer60} | ${allMin1.netSignFlipsMedianPer60} | ${allMin1.c2 ? 'PASS' : 'FAIL'} |
| MIN1 (the fallback, measured beside) | mature (≥ ${MATURE_FROM}) | ${matureMin1.n} | ${pct(matureMin1.level, matureMin1.n)} | ${pct(matureMin1.fullyTipped, matureMin1.n)} | ${matureMin1.c1 ? 'PASS' : 'FAIL'} | ${matureMin1.flipsMedianPer60} | ${matureMin1.netSignFlipsMedianPer60} | ${matureMin1.c2 ? 'PASS' : 'FAIL'} |

**The verdict, stated plainly:** the production set (19 seats, MIN2) passes C1 on the all-windows scope; C2 reads FAIL (the lane verdict's ${all.flipsMedianPer60} flips vs the set's own smoothed net-sign ${all.netSignFlipsMedianPer60}) — **exactly the committed calibration's POST-P1-DEMOTE row, reproduced** (the drift gate asserted above). The owner's recorded answer A stands as the resolution: the criteria stay, MIN2 stays, the failure is the recorded price of the coverage (richer evidence votes more; the absolute smoothness ${all.flipsMedianPer60} flips/60td stays comparable to the frozen set's 8).

## 3. The per-lane state tables (MIN2, all windows, n = ${all.n})

| Lane | unread | split |
|---|---|---|
${laneUnreadLines.join('\n')}

Balance: for ${all.tippedFor} (${pct(all.tippedFor, all.n)}) · level ${all.level} (${pct(all.level, all.n)}) · against ${all.tippedAgainst} (${pct(all.tippedAgainst, all.n)}) · all-unread ${all.none}. Beam: 0° ${all.beam.level} · 3–6° ${all.beam.mid} · 6–10° ${all.beam.full} (fully tipped ${all.fullyTipped}).

## 4. The D-18 rule's rendering (the owner's recorded answer I)

The input-presence rule is IN the production engine: a readable seat with neither evalLeg input reads \`unread\`, never \`steady\`. Over this POST basis the cftc seat's inputs exist from the first backfilled window (the §6 measured row: readable 2512/2512, firing 1008 = 40.1%) — the rule and the D-4 repair are complements, exactly as the audit stated: the repair fixed the instance, the rule prevents the class (the dollar lane's first 2 windows read \`unread\` under the rule — the FX seats' 30-day-back points do not exist yet at 2016-11-07/08; today's rule would have read them \`steady\`).

## 5. Honesty notes

1. **No forecasting claim, anywhere.** C1/C2 measure legibility and stability only; nothing here was selected on returns; the no-edge record (BACKTEST-GOLD.md) stands untouched.
2. **Every cell carries n.** The window basis (2512), the mature split (≥ ${MATURE_FROM}, ${mature.n} windows) and the per-lane counts are stated beside their numbers.
3. **The fixtures are the record.** The corpus and the GF-P0 fixtures are the committed recordings; the committed calibration report (\`gf-p0-calibration-2026-11-05.md\`) reproduces byte-for-byte beside this file — re-verified on this run's eve.
4. **What this file is NOT:** it is not a new measurement of the promotions (the POST-P2 scenarios stay the calibration's own); it is the D-GF-6 re-derivation over the corpus for the set that SHIPPED at GF-P1, pinned window-for-window to the measured scenario.

---

*The program: GF-S7 (the owner's answers A–K recorded; GF-P1 executed). The GF-P2 promotions (the recorded answers B/C/K) are next — the recalibration re-runs again before those seat counts (D-GF-6).*
`;

writeFileSync(OUT_MD, md);
writeFileSync(
  OUT_RUN,
  `${`# GF-P1 verify run record — ${new Date().toISOString()}\n\nwindows: ${windows.length} (${gridDates[0]} → ${gridDates[gridDates.length - 1]})\nproduction voters: ${PRODUCTION_IDS.length}\nproduction ≡ POST-P1-DEMOTE: ALL ${windows.length} windows equal (0 mismatches)\nMIN2 all: level ${all.level}/${all.n} (${pct(all.level, all.n)}) · full-tip ${all.fullyTipped} (${pct(all.fullyTipped, all.n)}) · C1 ${all.c1 ? 'PASS' : 'FAIL'} · flips ${all.flipsMedianPer60} vs ${all.netSignFlipsMedianPer60} · C2 ${all.c2 ? 'PASS' : 'FAIL'}\nMIN2 mature: level ${mature.level}/${mature.n} · full-tip ${mature.fullyTipped} · C1 ${mature.c1 ? 'PASS' : 'FAIL'} · flips ${mature.flipsMedianPer60} vs ${mature.netSignFlipsMedianPer60} · C2 ${mature.c2 ? 'PASS' : 'FAIL'}\nMIN1 all: level ${allMin1.level}/${allMin1.n} · full-tip ${allMin1.fullyTipped} · C1 ${allMin1.c1 ? 'PASS' : 'FAIL'} · flips ${allMin1.flipsMedianPer60} vs ${allMin1.netSignFlipsMedianPer60} · C2 ${allMin1.c2 ? 'PASS' : 'FAIL'}\nMIN1 mature: level ${matureMin1.level}/${matureMin1.n} · full-tip ${matureMin1.fullyTipped} · C1 ${matureMin1.c1 ? 'PASS' : 'FAIL'} · flips ${matureMin1.flipsMedianPer60} vs ${matureMin1.netSignFlipsMedianPer60} · C2 ${matureMin1.c2 ? 'PASS' : 'FAIL'}\ncommitted POST-P1-DEMOTE rows: reproduced (the drift gate held)\n`}\n`,
);
console.log(`\n✍ ${OUT_MD}`);
console.log(`✍ ${OUT_RUN}`);
