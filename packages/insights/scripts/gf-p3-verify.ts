/**
 * gf-p3-verify.ts — the GF-P3 recalibration verification (D-GF-6: the
 * C1/C2 verdicts + the lane stats re-derived over the corpus BEFORE the
 * new seat counts ship anywhere — the four FRED-sourced voter-candidates
 * seated at GF-P3, 2026-11-06; docs/specs/gold-meter-gapfill/).
 *
 * WHAT IT RUNS (read-only: no product edits, no KV writes, no deploy):
 *
 *  A. the POST-P3 WINDOW ASSEMBLY — the gf-p0-calibration.ts replication
 *     over the frozen corpus + the GF-P0 fixtures (the candidates fixture
 *     EXTENDED by gf-p3-record-candidates.ts with the four P3 FRED series):
 *     the same 2512-window gold trading-day grid, the same frozen clock,
 *     the same no-lookahead truncation, the same D-6 real-yield cross-fill,
 *     the D-4 CFTC backfill, the derived gap, the F2 REAL OBJECT — and the
 *     P3 half: the four FRED-sourced seats' series (real-yield-5y ·
 *     dollar-broad · dollar-eme · bank-stress, from the candidates fixture).
 *  B. the PRODUCTION ≡ SCENARIO PIN, window-for-window — the PRODUCTION
 *     engine (`goldBalance` — the 36-seat table, five lanes, the D-18
 *     rule, the production `SIGNAL_LEG_MOVE` with the executed five + the
 *     four P3) vs the measured POST-P3-5LANE scenario (`gfLaneBalance` over
 *     `GF_VOTERS_P3_5LANE` + the P3 move map + inputPresence, MIN2): every
 *     lane's side/split/readable/firing/supports/pressures and the
 *     counts/net/readable must agree in ALL 2512 windows — the shipped
 *     meter and the measured scenario are the same object, MODULO the F2
 *     seat's recorded id mapping (the scenario seat
 *     `gf-f2-gross-long-share` ↔ the production seat `cftc-gold-gross-long`).
 *  C. the COMMITTED-NUMBER DRIFT GATE — the POST-P3-5LANE stats must
 *     reproduce the committed calibration report's §4 rows (MIN2/MIN1 ×
 *     all/mature). A mismatch means something drifted; the run stops.
 *  D. the EVIDENCE — the re-derived C1/C2 verdicts under the owner's
 *     recorded answer A ((a) keep the criteria + MIN2 on judgment), the
 *     per-lane state tables, the D-18 rule's measured rendering, and the
 *     beam-state shares — written to
 *     docs/specs/gold-meter-gapfill/evidence/gf-p3-verify-2026-11-06.md
 *     (+ the run record .txt).
 *
 * NO FORECASTING CLAIM ANYWHERE (D-GF-3): firing statistics and lane
 * behaviour only — the standing no-edge record is untouched.
 *
 * Manual (the gf-p0-calibration discipline):
 *   pnpm --filter @currena/insights gf-p3-verify
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IndicatorDefinition, IndicatorId, IndicatorReading } from '@currena/core';

import { DEFINITIONS, computeReading } from '../src/index';
import { goldBalance, GOLD_LANE_STRONG } from '../src/gold-balance';
import { GOLD_LANE_VOTERS, GOLD_LANES } from '../src/gold-score';
import { realYieldScoringSeries } from '../src/real-yield-fill';
import { combineSeries, fromEpochDay, type SeriesPoint } from '../src/series';
import { seriesUpTo } from '../src/gold-backtest-core';
import {
  GF_F2_PROXY_ID,
  GF_LANES_5,
  GF_MOVE_P1_PROPOSED,
  GF_MOVE_P3_PROPOSED,
  GF_VOTERS_P3_5LANE,
  gfCalibrationStats,
  gfLaneBalance,
  gfMoveMapWith,
  gfNetScore,
  type GfLaneBalance,
} from '../src/gf-p0-proposed';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = join(HERE, '..', 'fixtures', 'gold-backtest-corpus.json');
const CANDIDATES_PATH = join(HERE, '..', 'fixtures', 'gf-p0-candidates.json');
const CFTC_PATH = join(HERE, '..', 'fixtures', 'gf-p0-cftc-backfill.json');
const OUT_MD = join(HERE, '..', '..', '..', 'docs', 'specs', 'gold-meter-gapfill', 'evidence', 'gf-p3-verify-2026-11-06.md');
const OUT_RUN = join(HERE, '..', '..', '..', 'docs', 'specs', 'gold-meter-gapfill', 'evidence', 'gf-p3-run-2026-11-06.txt');

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
  recordedAt: string;
  weeks: Array<{ date: string; netSharePct: number; grossLongSharePct: number; grossShortSharePct: number; openInterest: number }>;
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
const CFTC_BACKFILL_GROSS_LONG: SeriesPoint[] = cftc.weeks.map((w) => ({ date: w.date, value: w.grossLongSharePct }));

const defById = new Map<string, IndicatorDefinition>(DEFINITIONS.map((d) => [d.id as string, d]));
const REAL_YIELD_ID = 'real-yield-10y';
const FILL_LEGS = { nominal: 'us10y', breakeven: 'breakeven-10y' } as const;
const MATURE_FROM = '2021-09-23';
const frozenNow = (day: string): string => `${day}T04:10:00.000Z`;
const isMature = (day: string): boolean => day >= MATURE_FROM;
const source = { name: 'GF-P3 verify (the GF-P0 fixtures, the POST-P3 basis)' };

/* The 36 PRODUCTION voters' ids (the shipped meter's own seats). */
const PRODUCTION_IDS: readonly IndicatorId[] = GOLD_LANE_VOTERS.map((v) => v.id);

/* ------------------------------------------------------------------ *
 * A. The window assembly (the POST-P3 basis — production + scenario)
 * ------------------------------------------------------------------ */

interface Window {
  date: string;
  /** The production readings: the 36 seats, the REAL F2 object included. */
  readings: IndicatorReading[];
  /** The scenario readings: the same set with the F2 seat RELABELLED to the
   * harness proxy id, computed with the cftc-gold-positioning definition's
   * semantics — exactly the calibration's own proxy construction. */
  scenarioReadings: IndicatorReading[];
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
    } else if (id === 'cftc-gold-gross-long') {
      series = seriesUpTo(CFTC_BACKFILL_GROSS_LONG, day); // F2's REAL OBJECT — the same recorded weeks
    } else if (id === 'us-japan-10y-gap') {
      series = seriesUpTo(GAP_DERIVED, day); // the D-6 persisted history (the POST basis)
    } else if (SERIES[id] !== undefined) {
      series = seriesUpTo(SERIES[id]!, day);
    } else if (CAND_SERIES[id] !== undefined) {
      // GF-P3: the four FRED-sourced seats (real-yield-5y · dollar-broad ·
      // dollar-eme · bank-stress) ride the candidates fixture's P3 series.
      series = seriesUpTo(CAND_SERIES[id]!, day);
    }
    if (series !== undefined) readings.push(computeReading(def, series, now, source));
  }
  // The scenario twin: the F2 seat relabelled to the harness proxy, computed
  // with the cftc-gold-positioning definition over the SAME gross-long series
  // (the calibration's own proxy construction, cell-for-cell).
  const scenarioReadings: IndicatorReading[] = [];
  for (const r of readings) {
    if (r.id !== 'cftc-gold-gross-long') {
      scenarioReadings.push(r);
      continue;
    }
    const proxy = computeReading(defById.get('cftc-gold-positioning')!, seriesUpTo(CFTC_BACKFILL_GROSS_LONG, day), now, source);
    scenarioReadings.push({ ...proxy, id: GF_F2_PROXY_ID } as unknown as IndicatorReading);
  }
  windows.push({ date: day, readings, scenarioReadings });
}

console.log(`# GF-P3 verify — ${new Date().toISOString()}`);
console.log(`windows: ${windows.length} (${gridDates[0]} → ${gridDates[gridDates.length - 1]}); mature ≥ ${MATURE_FROM}: ${windows.filter((w) => isMature(w.date)).length}`);
console.log(`production voters: ${PRODUCTION_IDS.length} (GOLD_LANE_VOTERS, GF-P3's 36-seat table: ${GOLD_LANES.length} lanes)`);
console.log(`GOLD_LANE_STRONG: ${GOLD_LANE_STRONG} (of ${GOLD_LANES.length} — the owner's recorded answer B: 4-of-5 = 80%)`);

/* ------------------------------------------------------------------ *
 * B. The production ≡ scenario pin, window-for-window (the recorded
 *    F2 id mapping: cftc-gold-gross-long ↔ gf-f2-gross-long-share)
 * ------------------------------------------------------------------ */

const P3_MOVE_MAP = gfMoveMapWith({ ...GF_MOVE_P1_PROPOSED, ...GF_MOVE_P3_PROPOSED } as Readonly<Partial<Record<IndicatorId, number>>>);
let mismatches = 0;
const scenarioBalances: GfLaneBalance[] = [];
const netScores: number[] = [];
for (const w of windows) {
  const production = goldBalance(w.readings);
  const scenario = gfLaneBalance(w.scenarioReadings, GF_VOTERS_P3_5LANE, GF_LANES_5, 2, P3_MOVE_MAP, true);
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
  netScores.push(gfNetScore(w.scenarioReadings, GF_VOTERS_P3_5LANE, P3_MOVE_MAP));
}
if (mismatches > 0) {
  throw new Error(
    `[gf-p3-verify] FATAL: the production engine and the measured POST-P3-5LANE scenario disagree in ${mismatches} of ${windows.length} windows — the shipped meter is NOT the measured scenario. Nothing written.`,
  );
}
console.log(`✓ the production engine ≡ the POST-P3-5LANE scenario (the F2 id mapping recorded) in ALL ${windows.length} windows (every lane field + the rollups)`);

/* ------------------------------------------------------------------ *
 * C. The committed-number drift gate (the calibration report §4)
 * ------------------------------------------------------------------ */

const matureIdx = windows.map((w, i) => (isMature(w.date) ? i : -1)).filter((i) => i >= 0);
const all = gfCalibrationStats(scenarioBalances, netScores, GF_LANES_5);
const mature = gfCalibrationStats(
  matureIdx.map((i) => scenarioBalances[i]!),
  matureIdx.map((i) => netScores[i]!),
  GF_LANES_5,
);

/** The committed POST-P3-5LANE rows (evidence/gf-p0-calibration-2026-11-05.md §4 — the shares AS COMMITTED, one decimal) — the drift gate. */
const COMMITTED: Record<string, { levelShare: number; fullTipShare: number; flips: number; netFlips: number }> = {
  'MIN2|all': { levelShare: 0.271, fullTipShare: 0.119, flips: 10, netFlips: 8 },
  'MIN2|mature': { levelShare: 0.255, fullTipShare: 0.09, flips: 10, netFlips: 8 },
  'MIN1|all': { levelShare: 0.235, fullTipShare: 0.089, flips: 10, netFlips: 8 },
  'MIN1|mature': { levelShare: 0.242, fullTipShare: 0.066, flips: 10, netFlips: 8 },
};

/** MIN1 twin run (the pre-registered fallback rule, measured beside). */
const scenarioBalancesMin1 = windows.map((w) => gfLaneBalance(w.scenarioReadings, GF_VOTERS_P3_5LANE, GF_LANES_5, 1, P3_MOVE_MAP, true));
const allMin1 = gfCalibrationStats(scenarioBalancesMin1, netScores, GF_LANES_5);
const matureMin1 = gfCalibrationStats(
  matureIdx.map((i) => scenarioBalancesMin1[i]!),
  matureIdx.map((i) => netScores[i]!),
  GF_LANES_5,
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
      `[gf-p3-verify] FATAL: POST-P3-5LANE drift at ${label}: measured (level ${(levelShare * 100).toFixed(1)}%, fullTip ${(fullTipShare * 100).toFixed(1)}%, flips ${s.flipsMedianPer60} vs ${s.netSignFlipsMedianPer60}) vs committed (${(c.levelShare * 100).toFixed(1)}%, ${(c.fullTipShare * 100).toFixed(1)}%, ${c.flips} vs ${c.netFlips}) — the harness drifted; investigate before writing anything.`,
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

const laneUnreadLines = GF_LANES_5.map((lane) => `| ${lane} | ${all.laneUnread[lane] ?? 0} (${pct(all.laneUnread[lane] ?? 0, all.n)}) | ${all.laneSplit[lane] ?? 0} (${pct(all.laneSplit[lane] ?? 0, all.n)}) |`);

emit(
  '',
  `## The re-derived verdict (MIN2 — the owner's recorded answer A: keep the criteria + MIN2 on judgment)`,
  `all windows (n=${all.n}): level ${all.level} (${pct(all.level, all.n)}) · full-tip ${all.fullyTipped} (${pct(all.fullyTipped, all.n)}) · C1 ${all.c1 ? 'PASS' : 'FAIL'} · lane flips ${all.flipsMedianPer60} vs the set's own net-sign ${all.netSignFlipsMedianPer60} → C2 ${all.c2 ? 'PASS' : 'FAIL'}`,
  `mature base (n=${mature.n}): level ${mature.level} (${pct(mature.level, mature.n)}) · full-tip ${mature.fullyTipped} (${pct(mature.fullyTipped, mature.n)}) · C1 ${mature.c1 ? 'PASS' : 'FAIL'} · flips ${mature.flipsMedianPer60} vs ${mature.netSignFlipsMedianPer60} → C2 ${mature.c2 ? 'PASS' : 'FAIL'}`,
);

const md = `# GF-P3 verify — the production ≡ scenario pin + the recalibrated lane rule (2026-11-06)

**Generated by \`packages/insights/scripts/gf-p3-verify.ts\` (this file IS the committed run).** The GF-P3 new free sources seated on the standing delegation ("Generally, I trust your decisions. go full autonomously." — the GF-S7 answer sheet): the four FRED-sourced voter-candidates (R2 \`real-yield-5y\` DFII5 · D2 \`dollar-broad\` DTWEXBGS · D9 \`dollar-eme\` DTWEXEMEGS · S9 \`bank-stress\` DPCREDIT) — owner-gated through the MEASURED POST-P3-5LANE scenario (the F2 precedent: the harness seat and the production seat agree by construction; the audit report §4 ranks 19–21, 28 the justification per seat). The measured basis: the frozen gold-backtest corpus + the GF-P0 fixtures (the candidates fixture EXTENDED by \`scripts/gf-p3-record-candidates.ts\` with the four P3 FRED series — the existing 16 preserved; the D-4 CFTC backfill — both gross legs; the D-6 derived gap), 2512 windows 2016-11-07 → 2026-11-03, the frozen clock, no lookahead, the D-6 real-yield cross-fill.

## 1. The production ≡ scenario pin (D-GF-6's first half)

The PRODUCTION engine (\`goldBalance\` — the 36-seat \`GOLD_LANE_VOTERS\`, five lanes, the D-18 rule, the production \`SIGNAL_LEG_MOVE\` carrying the executed five + the four P3) and the measured POST-P3-5LANE scenario (\`gfLaneBalance\` over \`GF_VOTERS_P3_5LANE\` + the P3 move map (\`GF_MOVE_P1_PROPOSED\` + \`GF_MOVE_P3_PROPOSED\`) + inputPresence, MIN2) agree in **ALL ${windows.length} windows** — every lane's side/split/readable/firing/supports/pressures and the counts/net/readable. **The shipped meter and the measured scenario are the same object, modulo the F2 seat's recorded id mapping**: the scenario seat \`gf-f2-gross-long-share\` (the harness proxy) ↔ the production seat \`cftc-gold-gold-long\` (the real object — the same recorded weeks, the identical 4dp value from the identical gold row; the readings agree cell-for-cell except the card status word, which never votes). The threshold-map equality (SIGNAL_LEG_MOVE ≡ the frozen four + the executed five + the four P3) is pinned by test (gf-p0-proposed.test.ts).

## 2. The recalibrated lane rule (D-GF-6's second half — the C1/C2 re-derivation over the corpus)

The pre-registered criteria are the GB 02 §6 protocol's own, unchanged: **C1** (not degenerate: level ≤ 70% AND fully-tipped ≤ 60%), **C2** (the lane verdict's median flips per 60 trading days ≤ the same set's own raw net-sign figure). The owner's recorded answer A resolves the C2 STOP branch **on judgment: keep the criteria + MIN2** — the measured verdicts below are stated honestly, never narrated away (the C2 failure is the recorded price of the coverage; the absolute smoothness stays comparable to the frozen 8 flips/60td).

| Rule | Scope | n | level | full-tip | C1 | lane flips / 60td | net-sign flips / 60td | C2 |
|---|---|---|---|---|---|---|---|---|
| MIN2 (production) | all windows | ${all.n} | ${pct(all.level, all.n)} | ${pct(all.fullyTipped, all.n)} | ${all.c1 ? 'PASS' : 'FAIL'} | ${all.flipsMedianPer60} | ${all.netSignFlipsMedianPer60} | ${all.c2 ? 'PASS' : 'FAIL'} |
| MIN2 (production) | mature (≥ ${MATURE_FROM}) | ${mature.n} | ${pct(mature.level, mature.n)} | ${pct(mature.fullyTipped, mature.n)} | ${mature.c1 ? 'PASS' : 'FAIL'} | ${mature.flipsMedianPer60} | ${mature.netSignFlipsMedianPer60} | ${mature.c2 ? 'PASS' : 'FAIL'} |
| MIN1 (the fallback, measured beside) | all windows | ${allMin1.n} | ${pct(allMin1.level, allMin1.n)} | ${pct(allMin1.fullyTipped, allMin1.n)} | ${allMin1.c1 ? 'PASS' : 'FAIL'} | ${allMin1.flipsMedianPer60} | ${allMin1.netSignFlipsMedianPer60} | ${allMin1.c2 ? 'PASS' : 'FAIL'} |
| MIN1 (the fallback, measured beside) | mature (≥ ${MATURE_FROM}) | ${matureMin1.n} | ${pct(matureMin1.level, matureMin1.n)} | ${pct(matureMin1.fullyTipped, matureMin1.n)} | ${matureMin1.c1 ? 'PASS' : 'FAIL'} | ${matureMin1.flipsMedianPer60} | ${matureMin1.netSignFlipsMedianPer60} | ${matureMin1.c2 ? 'PASS' : 'FAIL'} |

**The verdict, stated plainly:** the production set (36 seats, five lanes, MIN2) passes C1 on the all-windows scope (level ${pct(all.level, all.n)} · full-tip ${pct(all.fullyTipped, all.n)} — the four new seats made the balance LESS one-sided than POST-P2-5LANE's 16.0% full-tip → ${pct(all.fullyTipped, all.n)}, exactly what fuller lanes buy); C2 reads FAIL (the lane verdict's ${all.flipsMedianPer60} flips vs the set's own smoothed net-sign ${all.netSignFlipsMedianPer60}) — **exactly the committed calibration's POST-P3-5LANE row, reproduced** (the drift gate asserted above). The owner's recorded answer A stands as the resolution: the criteria stay, MIN2 stays, the failure is the recorded price of the coverage.

## 3. The per-lane state tables (MIN2, all windows, n = ${all.n})

| Lane | unread | split |
|---|---|---|
${laneUnreadLines.join('\n')}

Balance: for ${all.tippedFor} (${pct(all.tippedFor, all.n)}) · level ${all.level} (${pct(all.level, all.n)}) · against ${all.tippedAgainst} (${pct(all.tippedAgainst, all.n)}) · all-unread ${all.none}. Beam: 0° ${all.beam.level} · 3–6° ${all.beam.mid} · 6–10° ${all.beam.full} (fully tipped ${all.fullyTipped}).

## 4. The D-11/D-12 real-curve sign question (the DECISION LIST item — never seated silently)

R2's fill (DFII5, the 5y real yield) UNLOCKS the derived real curve — the 10y−5y real-yield slope (DFII10 − DFII5), the object that re-opens the D-7/D-8 yield-curve sign question (recorded-open since P1's context demotion). **The sign question is a DECISION LIST item:** both sign variants (polarity +1: a steepening real curve = gold-positive; polarity −1: a steepening real curve = gold-negative) are measured in the harness, the question is printed for the owner, **never seated silently**. The real-curve CARD lands as a context card (rule: info — the slope displays as context; the sign is the owner's to call). This verify records the four FRED seats only — the real-curve seat is NOT in the production table (the sign stays owner-gated).

## 5. Honesty notes

1. **No forecasting claim, anywhere.** C1/C2 measure legibility and stability only; nothing here was selected on returns; the no-edge record (BACKTEST-GOLD.md) stands untouched.
2. **Every cell carries n.** The window basis (2512), the mature split (≥ ${MATURE_FROM}, ${mature.n} windows) and the per-lane counts are stated beside their numbers.
3. **The fixtures are the record.** The corpus and the GF-P0 fixtures (the candidates fixture EXTENDED with the four P3 FRED series by \`gf-p3-record-candidates.ts\`) are the committed recordings; the committed calibration report (\`gf-p0-calibration-2026-11-05.md\`) reproduces byte-for-byte beside this file — the POST-P3-5LANE rows the drift gate above asserts. The P2 verify (\`gf-p2-verify-2026-11-05.md\`) is superseded by THIS file as the live pin (the P2 evidence stays as the dated record, like P1's before it).
4. **What this file is NOT:** it is not a new measurement of anything the calibration did not measure — it is the D-GF-6 re-derivation over the corpus for the set that SHIPPED at GF-P3, pinned window-for-window to the measured scenario (the POST-P3-5LANE table).

---

*The program: GF-S9 (the new free sources seated on the standing delegation). The GF-P4 context additions (I10 · X7 · I11 + the WGC family F5/F8/F11/F15/F16 · G3 · X5 · R11 · F12 · H1–H4) are next — the remaining P3 sources (F6/F7 the derived premia · I4 UoM · I9 nowcast-surprise) ride GF-S10 with their adapters.*
`;

writeFileSync(OUT_MD, md);
writeFileSync(
  OUT_RUN,
  `${`# GF-P3 verify run record — ${new Date().toISOString()}\n\nwindows: ${windows.length} (${gridDates[0]} → ${gridDates[gridDates.length - 1]})\nproduction voters: ${PRODUCTION_IDS.length} (36 seats, ${GOLD_LANES.length} lanes)\nproduction ≡ POST-P3-5LANE (the F2 id mapping recorded): ALL ${windows.length} windows equal (0 mismatches)\nMIN2 all: level ${all.level}/${all.n} (${pct(all.level, all.n)}) · full-tip ${all.fullyTipped} (${pct(all.fullyTipped, all.n)}) · C1 ${all.c1 ? 'PASS' : 'FAIL'} · flips ${all.flipsMedianPer60} vs ${all.netSignFlipsMedianPer60} · C2 ${all.c2 ? 'PASS' : 'FAIL'}\nMIN2 mature: level ${mature.level}/${mature.n} · full-tip ${mature.fullyTipped} · C1 ${mature.c1 ? 'PASS' : 'FAIL'} · flips ${mature.flipsMedianPer60} vs ${mature.netSignFlipsMedianPer60} · C2 ${mature.c2 ? 'PASS' : 'FAIL'}\nMIN1 all: level ${allMin1.level}/${allMin1.n} · full-tip ${allMin1.fullyTipped} · C1 ${allMin1.c1 ? 'PASS' : 'FAIL'} · flips ${allMin1.flipsMedianPer60} vs ${allMin1.netSignFlipsMedianPer60} · C2 ${allMin1.c2 ? 'PASS' : 'FAIL'}\nMIN1 mature: level ${matureMin1.level}/${matureMin1.n} · full-tip ${matureMin1.fullyTipped} · C1 ${matureMin1.c1 ? 'PASS' : 'FAIL'} · flips ${matureMin1.flipsMedianPer60} vs ${matureMin1.netSignFlipsMedianPer60} · C2 ${matureMin1.c2 ? 'PASS' : 'FAIL'}\ncommitted POST-P3-5LANE rows: reproduced (the drift gate held)\n`}\n`,
);
console.log(`\n✍ ${OUT_MD}`);
console.log(`✍ ${OUT_RUN}`);
