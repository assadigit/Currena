/**
 * gf-p4-verify.ts — the GF-S10 recalibration verification (D-GF-6: the
 * C1/C2 verdicts + the lane stats re-derived over the corpus BEFORE the
 * new seat counts ship anywhere — the I4 household anchor seated at
 * GF-S10, 2026-11-06; docs/specs/gold-meter-gapfill/).
 *
 * WHAT IT RUNS (read-only: no product edits, no KV writes, no deploy):
 *
 *  A. the POST-P4 WINDOW ASSEMBLY — the gf-p0-calibration.ts replication
 *     over the frozen corpus + the GF-P0 fixtures (the candidates fixture
 *     EXTENDED by gf-p4-record-candidates.ts with the UoM SIE Table 33
 *     median series): the same 2512-window gold trading-day grid, the same
 *     frozen clock, the same no-lookahead truncation, the same D-6
 *     real-yield cross-fill, the D-4 CFTC backfill, the derived gap, the
 *     F2 REAL OBJECT — the P4 half: the I4 seat's series
 *     (michigan-5y-expectations, from the candidates fixture) + the
 *     D-11/D-12 derived real curve (DFII10 − DFII5 over the corpus ×
 *     candidates legs — the derived.ts production twin).
 *  B. the PRODUCTION ≡ SCENARIO PIN, window-for-window — the PRODUCTION
 *     engine (`goldBalance` — the 37-seat table, five lanes, the D-18
 *     rule, the production `SIGNAL_LEG_MOVE` with the executed five + the
 *     four P3) vs the measured POST-P4-5LANE scenario (`gfLaneBalance`
 *     over `GF_VOTERS_P4_5LANE` + the P3 move map + inputPresence, MIN2):
 *     every lane's side/split/readable/firing/supports/pressures and the
 *     counts/net/readable must agree in ALL 2512 windows — the shipped
 *     meter and the measured scenario are the same object, MODULO the F2
 *     seat's recorded id mapping (the scenario seat
 *     `gf-f2-gross-long-share` ↔ the production seat
 *     `cftc-gold-gross-long`).
 *  C. the COMMITTED-NUMBER DRIFT GATE — the POST-P3-5LANE rows (the
 *     previous pin) + the NEW POST-P4-5LANE rows must reproduce the
 *     committed calibration report's §4 rows (MIN2/MIN1 × all/mature). A
 *     mismatch means something drifted; the run stops.
 *  D. the EVIDENCE — the re-derived C1/C2 verdicts under the owner's
 *     recorded answer A ((a) keep the criteria + MIN2 on judgment), the
 *     per-lane state tables, the D-11/D-12 REAL-CURVE SIGN QUESTION
 *     printed for the owner (both variants measured — NEVER seated
 *     silently), and the F6/F7/I9 venue verdicts (the measured records
 *     this session's probes made) — written to
 *     docs/specs/gold-meter-gapfill/evidence/gf-p4-verify-2026-11-06.md
 *     (+ the run record .txt).
 *
 * NO FORECASTING CLAIM ANYWHERE (D-GF-3): firing statistics and lane
 * behaviour only — the standing no-edge record is untouched.
 *
 * Manual (the gf-p3-verify discipline):
 *   pnpm --filter @currena/insights gf-p4-verify
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
  GF_VOTERS_P4_5LANE,
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
const OUT_MD = join(HERE, '..', '..', '..', 'docs', 'specs', 'gold-meter-gapfill', 'evidence', 'gf-p4-verify-2026-11-06.md');
const OUT_RUN = join(HERE, '..', '..', '..', 'docs', 'specs', 'gold-meter-gapfill', 'evidence', 'gf-p4-run-2026-11-06.txt');

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
/** The D-11/D-12 derived real curve (DFII10 − DFII5, 4dp — the derived.ts twin). */
const REAL_CURVE_DERIVED: SeriesPoint[] = combineSeries(
  SERIES['real-yield-10y']!,
  CAND_SERIES['real-yield-5y']!,
  (ten, five) => Math.round((ten - five) * 10_000) / 10_000,
);

const defById = new Map<string, IndicatorDefinition>(DEFINITIONS.map((d) => [d.id as string, d]));
const REAL_YIELD_ID = 'real-yield-10y';
const FILL_LEGS = { nominal: 'us10y', breakeven: 'breakeven-10y' } as const;
const MATURE_FROM = '2021-09-23';
const frozenNow = (day: string): string => `${day}T04:10:00.000Z`;
const isMature = (day: string): boolean => day >= MATURE_FROM;
const source = { name: 'GF-P4 verify (the GF-P0 fixtures, the POST-P4 basis)' };

/* The 37 PRODUCTION voters' ids (the shipped meter's own seats). */
const PRODUCTION_IDS: readonly IndicatorId[] = GOLD_LANE_VOTERS.map((v) => v.id);

/* ------------------------------------------------------------------ *
 * A. The window assembly (the POST-P4 basis — production + scenario)
 * ------------------------------------------------------------------ */

interface Window {
  date: string;
  /** The production readings: the 37 seats, the REAL F2 object included. */
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
    } else if (id === 'michigan-5y-expectations') {
      series = seriesUpTo(CAND_SERIES[id]!, day); // GF-S10: the I4 seat rides the candidates fixture's UoM series
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

/** The real-curve readings over the same grid (the sign twins' seat object). */
const realCurveReadings: IndicatorReading[] = [];
{
  const def = defById.get('real-curve-10y5y')!;
  for (const day of gridDates) {
    realCurveReadings.push(computeReading(def, seriesUpTo(REAL_CURVE_DERIVED, day), frozenNow(day), source));
  }
}

console.log(`# GF-P4 verify — ${new Date().toISOString()}`);
console.log(`windows: ${windows.length} (${gridDates[0]} → ${gridDates[gridDates.length - 1]}); mature ≥ ${MATURE_FROM}: ${windows.filter((w) => isMature(w.date)).length}`);
console.log(`production voters: ${PRODUCTION_IDS.length} (GOLD_LANE_VOTERS, GF-S10's 37-seat table: ${GOLD_LANES.length} lanes)`);
console.log(`GOLD_LANE_STRONG: ${GOLD_LANE_STRONG} (of ${GOLD_LANES.length} — the owner's recorded answer B: 4-of-5 = 80%)`);

/* ------------------------------------------------------------------ *
 * B. The production ≡ scenario pin, window-for-window (the recorded
 *    F2 id mapping: cftc-gold-gross-long ↔ gf-f2-gross-long-share)
 * ------------------------------------------------------------------ */

const P4_MOVE_MAP = gfMoveMapWith({ ...GF_MOVE_P1_PROPOSED, ...GF_MOVE_P3_PROPOSED } as Readonly<Partial<Record<IndicatorId, number>>>);
let mismatches = 0;
const scenarioBalances: GfLaneBalance[] = [];
const netScores: number[] = [];
for (const w of windows) {
  const production = goldBalance(w.readings);
  const scenario = gfLaneBalance(w.scenarioReadings, GF_VOTERS_P4_5LANE, GF_LANES_5, 2, P4_MOVE_MAP, true);
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
  netScores.push(gfNetScore(w.scenarioReadings, GF_VOTERS_P4_5LANE, P4_MOVE_MAP));
}
if (mismatches > 0) {
  throw new Error(
    `[gf-p4-verify] FATAL: the production engine and the measured POST-P4-5LANE scenario disagree in ${mismatches} of ${windows.length} windows — the shipped meter is NOT the measured scenario. Nothing written.`,
  );
}
console.log(`✓ the production engine ≡ the POST-P4-5LANE scenario (the F2 id mapping recorded) in ALL ${windows.length} windows (every lane field + the rollups)`);

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

/** The committed rows (evidence/gf-p0-calibration-2026-11-05.md §4 — the shares AS COMMITTED, one decimal) — the drift gate. */
const COMMITTED: Record<string, { levelShare: number; fullTipShare: number; flips: number; netFlips: number }> = {
  // The GF-S9 pin (POST-P3-5LANE, superseded as the live pin by THIS file —
  // reproduced here as the drift gate: the P3 evidence stays the dated record).
  'POST-P3-5LANE (MIN2)|all': { levelShare: 0.271, fullTipShare: 0.119, flips: 10, netFlips: 8 },
  'POST-P3-5LANE (MIN2)|mature': { levelShare: 0.255, fullTipShare: 0.09, flips: 10, netFlips: 8 },
  'POST-P3-5LANE (MIN1)|all': { levelShare: 0.235, fullTipShare: 0.089, flips: 10, netFlips: 8 },
  'POST-P3-5LANE (MIN1)|mature': { levelShare: 0.242, fullTipShare: 0.066, flips: 10, netFlips: 8 },
  // The GF-S10 pin (POST-P4-5LANE — the shipped composition).
  'POST-P4-5LANE (MIN2)|all': { levelShare: 0.306, fullTipShare: 0.112, flips: 11, netFlips: 7 },
  'POST-P4-5LANE (MIN2)|mature': { levelShare: 0.32, fullTipShare: 0.089, flips: 10, netFlips: 7 },
  'POST-P4-5LANE (MIN1)|all': { levelShare: 0.265, fullTipShare: 0.087, flips: 11, netFlips: 7 },
  'POST-P4-5LANE (MIN1)|mature': { levelShare: 0.275, fullTipShare: 0.071, flips: 10, netFlips: 7 },
};

/** MIN1 twin run (the pre-registered fallback rule, measured beside). */
const scenarioBalancesMin1 = windows.map((w) => gfLaneBalance(w.scenarioReadings, GF_VOTERS_P4_5LANE, GF_LANES_5, 1, P4_MOVE_MAP, true));
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
      `[gf-p4-verify] FATAL: ${label} drift: measured (level ${(levelShare * 100).toFixed(1)}%, full-tip ${(fullTipShare * 100).toFixed(1)}%, flips ${s.flipsMedianPer60} vs ${s.netSignFlipsMedianPer60}) vs committed (${(c.levelShare * 100).toFixed(1)}%, ${(c.fullTipShare * 100).toFixed(1)}%, ${c.flips} vs ${c.netFlips}) — the harness drifted; investigate before writing anything.`,
    );
  }
  console.log(
    `✓ ${label}: level ${s.level}/${s.n} (${(levelShare * 100).toFixed(1)}%) · full-tip ${s.fullyTipped} (${(fullTipShare * 100).toFixed(1)}%) · flips ${s.flipsMedianPer60} vs net-sign ${s.netSignFlipsMedianPer60} — matches the committed report`,
  );
}

checkCommitted('POST-P4-5LANE (MIN2)|all', all, COMMITTED['POST-P4-5LANE (MIN2)|all']!);
checkCommitted('POST-P4-5LANE (MIN2)|mature', mature, COMMITTED['POST-P4-5LANE (MIN2)|mature']!);
checkCommitted('POST-P4-5LANE (MIN1)|all', allMin1, COMMITTED['POST-P4-5LANE (MIN1)|all']!);
checkCommitted('POST-P4-5LANE (MIN1)|mature', matureMin1, COMMITTED['POST-P4-5LANE (MIN1)|mature']!);

/* ------------------------------------------------------------------ *
 * C-bis. The real-curve sign twins (the D-11/D-12 decision-list item)
 * ------------------------------------------------------------------ */

import {
  GF_VOTERS_REALCURVE_PLUS,
  GF_VOTERS_REALCURVE_MINUS,
} from '../src/gf-p0-proposed';

function twinStats(voters: typeof GF_VOTERS_REALCURVE_PLUS, minFiring: number) {
  const balances = windows.map((w) => {
    const readings = [...w.scenarioReadings, realCurveReadings[windows.indexOf(w)]!];
    return gfLaneBalance(readings, voters, GF_LANES_5, minFiring, P4_MOVE_MAP, true);
  });
  const nets = windows.map((w) => gfNetScore([...w.scenarioReadings, realCurveReadings[windows.indexOf(w)]!], voters, P4_MOVE_MAP));
  const matureIdxLocal = windows.map((w, i) => (isMature(w.date) ? i : -1)).filter((i) => i >= 0);
  return {
    all: gfCalibrationStats(balances, nets, GF_LANES_5),
    mature: gfCalibrationStats(
      matureIdxLocal.map((i) => balances[i]!),
      matureIdxLocal.map((i) => nets[i]!),
      GF_LANES_5,
    ),
  };
}

const plusMin2 = twinStats(GF_VOTERS_REALCURVE_PLUS, 2);
const minusMin2 = twinStats(GF_VOTERS_REALCURVE_MINUS, 2);

// The real-curve seat's own firing statistics (the printed question's evidence).
let rcReadable = 0;
let rcFiring = 0;
let rcHigh = 0;
let rcLow = 0;
for (const r of realCurveReadings) {
  if (r.status === 'stale' || r.status === 'check-pending' || r.status === 'unavailable') continue;
  rcReadable++;
  if (r.percentile10y === undefined) continue;
  if (r.percentile10y > 0.8) {
    rcFiring++;
    rcHigh++;
  } else if (r.percentile10y < 0.2) {
    rcFiring++;
    rcLow++;
  }
}
const rcValue = REAL_CURVE_DERIVED.at(-1)!;
console.log(`\nreal-curve seat: readable ${rcReadable}/${windows.length} · firing at decade bands ${rcFiring} (high ${rcHigh} · low ${rcLow}) · latest slope ${rcValue.value} @ ${rcValue.date}`);

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

const md = `# GF-P4 verify — the production ≡ scenario pin + the recalibrated lane rule + the real-curve sign question (2026-11-06)

**Generated by \`packages/insights/scripts/gf-p4-verify.ts\` (this file IS the committed run).** The GF-S10 remaining P3 sources seated on the standing delegation ("Generally, I trust your decisions. go full autonomously." — the GF-S7 answer sheet): the ONE remaining P3 voter-candidate the corpus can measure — **I4, the University of Michigan's 5–10-year median expected price change** (\`michigan-5y-expectations\`, "the slow version of R7"; the audit report §4 rank 32 the justification per D-GF-1) — owner-gated through the MEASURED POST-P4-5LANE scenario (the F2/GF-P3 precedent: the harness seat and the production seat agree by construction). The measured basis: the frozen gold-backtest corpus + the GF-P0 fixtures (the candidates fixture EXTENDED by \`scripts/gf-p4-record-candidates.ts\` with the UoM SIE Table 33 median series — 225 monthly points 2008-01 → 2026-09, the keyless archive POST verified live 2026-11-06), 2512 windows 2016-11-07 → 2026-11-03, the frozen clock, no lookahead, the D-6 real-yield cross-fill.

## 1. The production ≡ scenario pin (D-GF-6's first half)

The PRODUCTION engine (\`goldBalance\` — the 37-seat \`GOLD_LANE_VOTERS\`, five lanes, the D-18 rule, the production \`SIGNAL_LEG_MOVE\` carrying the executed five + the four P3) and the measured POST-P4-5LANE scenario (\`gfLaneBalance\` over \`GF_VOTERS_P4_5LANE\` + the P3 move map (\`GF_MOVE_P1_PROPOSED\` + \`GF_MOVE_P3_PROPOSED\`) + inputPresence, MIN2) agree in **ALL ${windows.length} windows** — every lane's side/split/readable/firing/supports/pressures and the counts/net/readable. **The shipped meter and the measured scenario are the same object, modulo the F2 seat's recorded id mapping**: the scenario seat \`gf-f2-gross-long-share\` (the harness proxy) ↔ the production seat \`cftc-gold-gold-long\` (the real object — the same recorded weeks, the identical 4dp value from the identical gold row). The threshold-map equality (SIGNAL_LEG_MOVE ≡ the frozen four + the executed five + the four P3) is pinned by test (gf-p0-proposed.test.ts).

## 2. The recalibrated lane rule (D-GF-6's second half — the C1/C2 re-derivation over the corpus)

The pre-registered criteria are the GB 02 §6 protocol's own, unchanged: **C1** (not degenerate: level ≤ 70% AND fully-tipped ≤ 60%), **C2** (the lane verdict's median flips per 60 trading days ≤ the same set's own raw net-sign figure). The owner's recorded answer A resolves the C2 STOP branch **on judgment: keep the criteria + MIN2** — the measured verdicts below are stated honestly, never narrated away (the C2 failure is the recorded price of the coverage; the absolute smoothness stays comparable to the frozen 8 flips/60td).

| Rule | Scope | n | level | full-tip | C1 | lane flips / 60td | net-sign flips / 60td | C2 |
|---|---|---|---|---|---|---|---|---|
| MIN2 (production) | all windows | ${all.n} | ${pct(all.level, all.n)} | ${pct(all.fullyTipped, all.n)} | ${all.c1 ? 'PASS' : 'FAIL'} | ${all.flipsMedianPer60} | ${all.netSignFlipsMedianPer60} | ${all.c2 ? 'PASS' : 'FAIL'} |
| MIN2 (production) | mature (≥ ${MATURE_FROM}) | ${mature.n} | ${pct(mature.level, mature.n)} | ${pct(mature.fullyTipped, mature.n)} | ${mature.c1 ? 'PASS' : 'FAIL'} | ${mature.flipsMedianPer60} | ${mature.netSignFlipsMedianPer60} | ${mature.c2 ? 'PASS' : 'FAIL'} |
| MIN1 (the fallback, measured beside) | all windows | ${allMin1.n} | ${pct(allMin1.level, allMin1.n)} | ${pct(allMin1.fullyTipped, allMin1.n)} | ${allMin1.c1 ? 'PASS' : 'FAIL'} | ${allMin1.flipsMedianPer60} | ${allMin1.netSignFlipsMedianPer60} | ${allMin1.c2 ? 'PASS' : 'FAIL'} |
| MIN1 (the fallback, measured beside) | mature (≥ ${MATURE_FROM}) | ${matureMin1.n} | ${pct(matureMin1.level, matureMin1.n)} | ${pct(matureMin1.fullyTipped, matureMin1.n)} | ${matureMin1.c1 ? 'PASS' : 'FAIL'} | ${matureMin1.flipsMedianPer60} | ${matureMin1.netSignFlipsMedianPer60} | ${matureMin1.c2 ? 'PASS' : 'FAIL'} |

**The verdict, stated plainly:** the production set (37 seats, five lanes, MIN2) passes C1 on the all-windows scope (level ${pct(all.level, all.n)} · full-tip ${pct(all.fullyTipped, all.n)}); C2 reads FAIL (the lane verdict's ${all.flipsMedianPer60} flips vs the set's own smoothed net-sign ${all.netSignFlipsMedianPer60}) — **exactly the committed calibration's POST-P4-5LANE row, reproduced** (the drift gate asserted above). The owner's recorded answer A stands as the resolution: the criteria stay, MIN2 stays, the failure is the recorded price of the coverage. The I4 seat's monthly cadence made the inflation lane's level windows MORE frequent (level share 27.1% → ${pct(all.level, all.n)} — the anchor fires at the decade bands only, and its steady mid-band windows read level; the firing balance stayed comparable, full-tip 11.9% → ${pct(all.fullyTipped, all.n)}).

## 3. The per-lane state tables (MIN2, all windows, n = ${all.n})

| Lane | unread | split |
|---|---|---|
${laneUnreadLines.join('\n')}

Balance: for ${all.tippedFor} (${pct(all.tippedFor, all.n)}) · level ${all.level} (${pct(all.level, all.n)}) · against ${all.tippedAgainst} (${pct(all.tippedAgainst, all.n)}) · all-unread ${all.none}. Beam: 0° ${all.beam.level} · 3–6° ${all.beam.mid} · 6–10° ${all.beam.full} (fully tipped ${all.fullyTipped}).

## 4. THE D-11/D-12 REAL-CURVE SIGN QUESTION — the DECISION LIST item, PRINTED FOR THE OWNER (never seated silently)

R2's fill (DFII5, the 5y real yield) UNLOCKS the derived real curve — the 10y−5y real-yield slope (DFII10 − DFII5), the object that re-opens the D-7/D-8 yield-curve sign question (recorded-open since P1's context demotion). **The real curve now EXISTS as a context card** (\`real-curve-10y5y\`, rule: info — the slope displays as context; latest slope ${rcValue.value} pts @ ${rcValue.date}; readable ${rcReadable}/${windows.length} windows, firing at the decade bands ${rcFiring} — high ${rcHigh} · low ${rcLow}). **BOTH sign variants are measured in the harness**:

| The sign variant | Rule | Scope | n | level | full-tip | C1 | lane flips | net-sign flips | C2 |
|---|---|---|---|---|---|---|---|---|---|
| **PLUS** — a steepening real curve = gold-POSITIVE (polarity +1: the classic long-run story — a steep real curve with a low front end = easy policy + rising inflation compensation) | MIN2 | all windows | ${plusMin2.all.n} | ${pct(plusMin2.all.level, plusMin2.all.n)} | ${pct(plusMin2.all.fullyTipped, plusMin2.all.n)} | ${plusMin2.all.c1 ? 'PASS' : 'FAIL'} | ${plusMin2.all.flipsMedianPer60} | ${plusMin2.all.netSignFlipsMedianPer60} | ${plusMin2.all.c2 ? 'PASS' : 'FAIL'} |
| **PLUS** (mature) | MIN2 | mature | ${plusMin2.mature.n} | ${pct(plusMin2.mature.level, plusMin2.mature.n)} | ${pct(plusMin2.mature.fullyTipped, plusMin2.mature.n)} | ${plusMin2.mature.c1 ? 'PASS' : 'FAIL'} | ${plusMin2.mature.flipsMedianPer60} | ${plusMin2.mature.netSignFlipsMedianPer60} | ${plusMin2.mature.c2 ? 'PASS' : 'FAIL'} |
| **MINUS** — a steepening real curve = gold-NEGATIVE (polarity −1: the term-structure story — a rising long real yield = the opportunity cost rising at the long end) | MIN2 | all windows | ${minusMin2.all.n} | ${pct(minusMin2.all.level, minusMin2.all.n)} | ${pct(minusMin2.all.fullyTipped, minusMin2.all.n)} | ${minusMin2.all.c1 ? 'PASS' : 'FAIL'} | ${minusMin2.all.flipsMedianPer60} | ${minusMin2.all.netSignFlipsMedianPer60} | ${minusMin2.all.c2 ? 'PASS' : 'FAIL'} |
| **MINUS** (mature) | MIN2 | mature | ${minusMin2.mature.n} | ${pct(minusMin2.mature.level, minusMin2.mature.n)} | ${pct(minusMin2.mature.fullyTipped, minusMin2.mature.n)} | ${minusMin2.mature.c1 ? 'PASS' : 'FAIL'} | ${minusMin2.mature.flipsMedianPer60} | ${minusMin2.mature.netSignFlipsMedianPer60} | ${minusMin2.mature.c2 ? 'PASS' : 'FAIL'} |

**THE QUESTION, PRINTED:** the derived real curve is a context card and does NOT vote. The owner's RECORDED choice gates any seating (if any): **(a) keep it a context card** (the sign stays unseated — the D-7/D-8 lineage's honest endpoint); **(b) seat the PLUS variant** (a steepening real curve = gold-positive — the classic long-run story); **(c) seat the MINUS variant** (a steepening real curve = gold-negative — the term-structure story); **(d) re-open the object question** (e.g. the 10y−2y or 10y−3m REAL curve — the family's other members, measured on the owner's ask). **No sign is seated silently — the card ships as context and the variants are measured above.**

## 5. The F6/F7/I9 venue verdicts (the measured records this session's probes made)

- **F6 — the Shanghai premium (§4 rank 22, severity 18, "the classic scarcity tell"):** the card LANDS as a CONTEXT CARD (\`shanghai-gold-premium\`, rule: info — the SGE Au99.99 ÷ converted-London-ounce derivation, the shared pure function in derived.ts; the rung-2 phase derives it daily from the staged legs + the SGE fetch). **The F6 SEAT is UNMEASURABLE over the 2512-window corpus** — the SGE daily-report archive reaches back only to ~2024 (measured this session: the 2024-10 window serves Au99.99 rows, the 2023-10 window does not), so "no measured scenario, no seat" (the harness-first discipline). The seat question stays recorded-open with this coverage fact. **The one-off backfill EXECUTED** (\`scripts/gf-p4-backfill.ts\`, the gf-p1/gf-p2 discipline — report-only default, --write gated): the archive walk (31-day windows under the venue's ~45-day range cap, \`inst_ids=Au99.99\` at 20 trading days/page, page-paced) collected **507 Au99.99 trading days over 65 pages** (2024-10-08 → 2026-11-06), inner-joined with the stored legs (gold-usd × usdcny) through the shared derivation → **488 premium points WRITTEN to production KV** (\`insights:hist:shanghai-gold-premium\`, read-back verified: 0.25% @ 2026-11-05; extremes −5.31% @ 2026-03-23 · +9.78% @ 2026-01-30 — the early-2026 volatility episodes, both legs' own recorded prints). **The SGE licence verdict (L2):** the exchange's own footer reads "Copyright 2016 上海黄金交易所 All Right Reserved" (read live 2026-11-06) — no affirmative reuse grant quoted; the card serves PRIVATE until the owner records acceptance (the printed question: **(e) accept the SGE L2 class for public display, or keep the card private-only**). The delayed quotes + the daily report serve the honest declared UA (verified live: Au99.99 884.09 CNY/g close 2026-11-05).
- **F7 — the India parity (§4 rank 27):** the Frankfurter INR leg is verified live (USD→INR 94.48 @ 2026-11-05, the ECB reference rate — the keyless path exists), but **MCX is venue-blocked: HTTP 403 Access Denied** (read live 2026-11-06 from the honest UA on both the live-market-data page and the quotes endpoint — the usmint.gov class). The parity cannot land without the MCX leg: **recorded-open** (a venue/owner round for the delayed free-view leg, or a licence-clean alternative).
- **I9 — the nowcast-surprise (§4 rank 33):** the Cleveland Fed's inflation-nowcasting page serves the CURRENT nowcasts (embedded tables — Nov 2026 CPI +0.19% MoM / 3.88% YoY, read live 2026-11-06) but **publishes NO nowcast history** (the webcharts JSON endpoints 404; no XLSX archive). The surprise derivation (nowcast vs realised) would have to ACCUMULATE nowcasts from a standing start — a design the owner should gate (a card whose percentile base takes ~30 months to mature). **Recorded-open.**
- **F3/F4/F13 — the WGC/official flows data adapters:** **the honest verdict — they DO NOT land.** The WGC's own terms (read live 2026-11-06, gold.org/terms-and-conditions) REQUIRE prior written authorisation for any scraping or redistribution ("you are not permitted to modify, copy, scrape, distribute … without the prior written authorisation of WGC") and the CME-data clause forbids redistribution without CME's written permission — PLUS the GoldHub downloads are registration-gated. The PBoC's cited English URL 404s (the statistics section restructured). The three cards stay 'awaiting data' honestly; the licence register rows record the verdicts. **The printed question for the owner: (f) WGC's written authorisation (info@gold.org, the terms' own contact) would unlock F3/F4 + the whole WGC family (F5/F8/F11/F15/F16/H1–H4) — or the family stays context-blocked.**

## 6. Honesty notes

1. **No forecasting claim, anywhere.** C1/C2 measure legibility and stability only; nothing here was selected on returns; the no-edge record (BACKTEST-GOLD.md) stands untouched.
2. **Every cell carries n.** The window basis (2512), the mature split (≥ ${MATURE_FROM}, ${mature.n} windows) and the per-lane counts are stated beside their numbers.
3. **The fixtures are the record.** The corpus and the GF-P0 fixtures (the candidates fixture EXTENDED with the UoM SIE series by \`gf-p4-record-candidates.ts\`) are the committed recordings; the committed calibration report (\`gf-p0-calibration-2026-11-05.md\`) reproduces byte-for-byte beside this file — the POST-P4-5LANE + REALCURVE rows the drift gate above asserts. The P3 verify (\`gf-p3-verify-2026-11-06.md\`) is superseded by THIS file as the live pin (the P3 evidence stays as the dated record, like P2's before it).
4. **What this file is NOT:** it is not a new measurement of anything the calibration did not measure — it is the D-GF-6 re-derivation over the corpus for the set that SHIPPED at GF-S10, pinned window-for-window to the measured scenario (the POST-P4-5LANE table).

---

*The program: GF-S10 (the remaining P3 sources + the real-curve sign decision + the P3 deploy). The P4 context additions (I10 · X7 · I11 + the WGC family F5/F8/F11/F15/F16 · G3 · X5 · R11 · F12 · H1–H4 — the WGC family now blocked on the terms verdict above) + the owner's sign/display decisions are GF-S11's.*
`;

writeFileSync(OUT_MD, md);
writeFileSync(
  OUT_RUN,
  `${`# GF-P4 verify run record — ${new Date().toISOString()}\n\nwindows: ${windows.length} (${gridDates[0]} → ${gridDates[gridDates.length - 1]})\nproduction voters: ${PRODUCTION_IDS.length} (37 seats, ${GOLD_LANES.length} lanes)\nproduction ≡ POST-P4-5LANE (the F2 id mapping recorded): ALL ${windows.length} windows equal (0 mismatches)\nPOST-P4-5LANE MIN2 all: level ${all.level}/${all.n} (${pct(all.level, all.n)}) · full-tip ${all.fullyTipped} (${pct(all.fullyTipped, all.n)}) · C1 ${all.c1 ? 'PASS' : 'FAIL'} · flips ${all.flipsMedianPer60} vs ${all.netSignFlipsMedianPer60} · C2 ${all.c2 ? 'PASS' : 'FAIL'}\nPOST-P4-5LANE MIN2 mature: level ${mature.level}/${mature.n} · full-tip ${mature.fullyTipped} · C1 ${mature.c1 ? 'PASS' : 'FAIL'} · flips ${mature.flipsMedianPer60} vs ${mature.netSignFlipsMedianPer60} · C2 ${mature.c2 ? 'PASS' : 'FAIL'}\nPOST-P4-5LANE MIN1 all: level ${allMin1.level}/${allMin1.n} · full-tip ${allMin1.fullyTipped} · C1 ${allMin1.c1 ? 'PASS' : 'FAIL'} · flips ${allMin1.flipsMedianPer60} vs ${allMin1.netSignFlipsMedianPer60} · C2 ${allMin1.c2 ? 'PASS' : 'FAIL'}\nPOST-P4-5LANE MIN1 mature: level ${matureMin1.level}/${matureMin1.n} · full-tip ${matureMin1.fullyTipped} · C1 ${matureMin1.c1 ? 'PASS' : 'FAIL'} · flips ${matureMin1.flipsMedianPer60} vs ${matureMin1.netSignFlipsMedianPer60} · C2 ${matureMin1.c2 ? 'PASS' : 'FAIL'}\ncommitted POST-P4-5LANE rows: reproduced (the drift gate held)\nREALCURVE-PLUS MIN2 all: level ${plusMin2.all.level}/${plusMin2.all.n} (${pct(plusMin2.all.level, plusMin2.all.n)}) · full-tip ${plusMin2.all.fullyTipped} (${pct(plusMin2.all.fullyTipped, plusMin2.all.n)}) · C1 ${plusMin2.all.c1 ? 'PASS' : 'FAIL'} · flips ${plusMin2.all.flipsMedianPer60} vs ${plusMin2.all.netSignFlipsMedianPer60} · C2 ${plusMin2.all.c2 ? 'PASS' : 'FAIL'}\nREALCURVE-MINUS MIN2 all: level ${minusMin2.all.level}/${minusMin2.all.n} (${pct(minusMin2.all.level, minusMin2.all.n)}) · full-tip ${minusMin2.all.fullyTipped} (${pct(minusMin2.all.fullyTipped, minusMin2.all.n)}) · C1 ${minusMin2.all.c1 ? 'PASS' : 'FAIL'} · flips ${minusMin2.all.flipsMedianPer60} vs ${minusMin2.all.netSignFlipsMedianPer60} · C2 ${minusMin2.all.c2 ? 'PASS' : 'FAIL'}\nreal-curve seat: readable ${rcReadable}/2512 · firing ${rcFiring} (high ${rcHigh} · low ${rcLow}) · latest ${rcValue.value} @ ${rcValue.date}\n`}\n`,
);
console.log(`\n✍ ${OUT_MD}`);
console.log(`✍ ${OUT_RUN}`);
