/**
 * gf-p0-calibration.ts — the GF-P0 recalibration pre-registration runner
 * (docs/specs/gold-meter-gapfill/01-FILL-SPEC.md — GF-P0; the audit report
 * §6.1's P0 row; the GB-S1 protocol: gold-balance-consolidation 02 §6).
 *
 * WHAT IT RUNS (read-only: no product code, no KV writes, no deploy —
 * D-GF-1; the GB-S1 precedent, gold-backtest.ts's own discipline):
 *
 *  A. the WINDOW ASSEMBLY — the gold-backtest.ts replication over the
 *     frozen corpus (fixtures/gold-backtest-corpus.json, recorded
 *     2026-11-03): the same 2512-window gold trading-day grid, the same
 *     frozen clock, the same no-lookahead truncation, the same D-6
 *     real-yield cross-fill — PLUS the GF-P0 fixtures recorded beside it
 *     (gf-p0-candidates.json + gf-p0-cftc-backfill.json, recorded
 *     2026-11-05): the promotion candidates' readings, the D-4 backfill
 *     measurement (the F1/F2 seats over the CFTC historical archive) and
 *     the D-6 gap-derivation simulation (us10y × jgb-10y, the persisted
 *     history the repair would stage).
 *  B. the FROZEN BASELINE ASSERTION — the FROZEN scenario's stats MUST
 *     reproduce BACKTEST-GOLD-LANES.md's committed numbers (MIN2/MIN1 ×
 *     all/mature). A mismatch means the harness drifted — the run stops.
 *  C. the D-1 THRESHOLD DERIVATION — the anchors' measured firing band
 *     (the four frozen gold-lane thresholds), the pre-stated derivation
 *     rule, the per-seat walk (the 17 level-only seats + the new daily
 *     promotions), the derived values asserted against
 *     gf-p0-proposed.ts's GF_MOVE_P1_PROPOSED constants.
 *  D. the SCENARIOS — gfScenarios() (FROZEN · POST-P1 · POST-P1-DEMOTE ·
 *     POST-P2-4LANE · POST-P2-5LANE, each × MIN2/MIN1, all windows + the
 *     mature base): the C1/C2 re-derivation per scenario, the lane
 *     tables, the per-seat firing tables (the owner's go/no-go evidence).
 *  E. THE REPORT — docs/specs/gold-meter-gapfill/evidence/
 *     gf-p0-calibration-2026-11-05.md, every table labelled with its
 *     scenario, every cell carrying n.
 *
 * HONESTY RULES (inherited, D-GF-2/D-GF-3): firing statistics and lane
 * behaviour ONLY — never predictive power, never forward returns. No
 * forecasting claim is claimed, implied or tested for any scenario, seat
 * or threshold; the standing no-edge record (GOLD_BACKTEST_SPEC §5)
 * stands. The C1/C2 criteria are GB 02 §6's own, unchanged: C1 (not
 * degenerate: level ≤ 70% of windows AND fully-tipped ≤ 60%), C2
 * (smoother than the same set's raw net sign: lane-verdict flips per 60
 * trading days not higher than the net-sign figure).
 *
 * Flags: --derive-only runs phase C and exits (the constants-update loop).
 *
 * MANUAL script (the gold-backtest discipline): never part of the test
 * suite. No credentials, no writes outside the evidence folder.
 *
 * Run: pnpm --filter @currena/insights gf-p0-calibration
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IndicatorDefinition, IndicatorId, IndicatorReading } from '@currena/core';

import { DEFINITIONS, computeReading } from '../src/index';
import { GF_VOTERS_FROZEN_21 } from '../src/gf-p0-proposed';
import { realYieldScoringSeries } from '../src/real-yield-fill';
import { combineSeries, fromEpochDay, type SeriesPoint } from '../src/series';
import { seriesUpTo } from '../src/gold-backtest-core';
import {
  GF_F2_PROXY_ID,
  GF_MOVE_FROZEN_BASE,
  GF_MOVE_P1_PROPOSED,
  GF_MOVE_P3_PROPOSED,
  GF_VOTERS_5LANE,
  GF_VOTERS_P2_4LANE,
  GF_VOTERS_P3_5LANE,
  GF_VOTERS_P4_5LANE,
  GF_VOTERS_REALCURVE_PLUS,
  GF_VOTERS_REALCURVE_MINUS,
  gfCalibrationStats,
  gfEvalLeg,
  gfLaneBalance,
  gfNetScore,
  gfScenarios,
  type GfCalibrationStats,
  type GfLaneBalance,
  type GfScenario,
  type GfVoter,
} from '../src/gf-p0-proposed';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = join(HERE, '..', 'fixtures', 'gold-backtest-corpus.json');
const CANDIDATES_PATH = join(HERE, '..', 'fixtures', 'gf-p0-candidates.json');
const CFTC_PATH = join(HERE, '..', 'fixtures', 'gf-p0-cftc-backfill.json');
const OUT_PATH = join(HERE, '..', '..', '..', 'docs', 'specs', 'gold-meter-gapfill', 'evidence', 'gf-p0-calibration-2026-11-05.md');

const DERIVE_ONLY = process.argv.includes('--derive-only');

/* ------------------------------------------------------------------ *
 * The fixtures (recorded, offline, read-only)
 * ------------------------------------------------------------------ */

interface Corpus {
  recordedAt: string;
  series: Record<string, Array<[number, number]>>;
  goldHist: { points: Array<[number, number]> };
}
interface CandidatesFixture {
  v: number;
  recordedAt: string;
  stageWrittenAt: string;
  venues: Record<string, string>;
  series: Record<string, Array<[number, number]>>;
}
interface CftcFixture {
  v: number;
  recordedAt: string;
  weeks: Array<{ date: string; netSharePct: number; grossLongSharePct: number; grossShortSharePct: number; openInterest: number }>;
  files: Array<{ year: number; url: string; weeks: number; bytes: number }>;
  failures: Array<{ year: number; error: string }>;
}

const corpus: Corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));
const candidates: CandidatesFixture = JSON.parse(readFileSync(CANDIDATES_PATH, 'utf8'));
const cftc: CftcFixture = JSON.parse(readFileSync(CFTC_PATH, 'utf8'));

const asPairs = (pairs: Array<[number, number]>): SeriesPoint[] => pairs.map(([day, value]) => ({ date: fromEpochDay(day), value }));

const SERIES: Record<string, SeriesPoint[]> = {};
for (const [id, pairs] of Object.entries(corpus.series)) SERIES[id] = asPairs(pairs);
const GOLD: SeriesPoint[] = asPairs(corpus.goldHist.points);

/** The promotion candidates' series (the candidates fixture; ids NOT in the corpus). */
const CAND_SERIES: Record<string, SeriesPoint[]> = {};
for (const [id, pairs] of Object.entries(candidates.series)) CAND_SERIES[id] = asPairs(pairs);

/* ------------------------------------------------------------------ *
 * The D-6 gap-derivation simulation + the D-4 backfill series
 * ------------------------------------------------------------------ */

/** The derived US−Japan gap: inner join on common dates, 4dp quantized (run.ts's quantizedGap, replicated). */
function quantizedGap(us: SeriesPoint[], jp: SeriesPoint[]): SeriesPoint[] {
  const gap = combineSeries(us, jp, (a, b) => a - b);
  const f = 10_000;
  return gap.map((p) => ({ date: p.date, value: Math.round(p.value * f) / f }));
}

/** The post-P1 gap series: the D-6 repair's persisted history, simulated over the corpus's own us10y. */
const GAP_DERIVED = quantizedGap(SERIES['us10y']!, CAND_SERIES['jgb-10y']!);
/** GF-S10: the D-11/D-12 derived real curve — DFII10 − DFII5, 4dp quantized
 * (the derived.ts production twin; the corpus DFII10 × the candidates DFII5). */
const REAL_CURVE_DERIVED: SeriesPoint[] =
  CAND_SERIES['real-yield-5y'] !== undefined
    ? SERIES['real-yield-10y'] !== undefined
      ? combineSeries(SERIES['real-yield-10y']!, CAND_SERIES['real-yield-5y']!, (ten, five) => Math.round((ten - five) * 10_000) / 10_000)
      : []
    : [];

/** The post-P1 F1 series: the D-4 backfill (the CFTC historical archive's net-share weeks). */
const CFTC_BACKFILL_NET: SeriesPoint[] = cftc.weeks.map((w) => ({ date: w.date, value: w.netSharePct }));
/** The F2 proxy series: the gross noncommercial long share (the scenario's stand-in object). */
const CFTC_BACKFILL_GROSS_LONG: SeriesPoint[] = cftc.weeks.map((w) => ({ date: w.date, value: w.grossLongSharePct }));

/* The F2 proxy's reading is computed with the cftc-gold-positioning definition's own
 * cadence/staleness semantics over the gross-long series (the percentile + change legs
 * derive from the series, never the rule; the status word rides the net-share rule's
 * bands — readable() admits every non-stale status, so the lean is unaffected), then
 * RELABELLED to the harness-local proxy id. A scenario proxy, disclosed in the report —
 * the P2 design names the real object. */

const defById = new Map<string, IndicatorDefinition>(DEFINITIONS.map((d) => [d.id as string, d]));
const REAL_YIELD_ID = 'real-yield-10y';
const FILL_LEGS = { nominal: 'us10y', breakeven: 'breakeven-10y' } as const;
const MATURE_FROM = '2021-09-23'; // gold-backtest.ts's own mature-base split
const frozenNow = (day: string): string => `${day}T04:10:00.000Z`;
const isReadable = (status: string): boolean => status !== 'stale' && status !== 'check-pending' && status !== 'unavailable';
const isMature = (day: string): boolean => day >= MATURE_FROM;

/* The ids whose readings the calibration computes per window:
 *  - the frozen 21 (the corpus series — the FROZEN scenario's basis);
 *  - the POST-P1 swapped seats: cftc-gold-positioning (the backfill), us-japan-10y-gap (the derived gap);
 *  - the promotion candidates (the candidates fixture; t5yie rides the corpus's own series);
 *  - the F2 proxy (the synthetic definition). */
const VOTER_IDS = GF_VOTERS_FROZEN_21.map((v) => v.id as string);
const CANDIDATE_READ_IDS: readonly string[] = [
  'term-premium-10y',
  'ebp',
  'us-deficit-12m',
  'michigan-sentiment',
  'gpr-daily',
  'gpr-index',
  'epu-us',
  'tpu-us',
  'michigan-1y-expectations',
  'm2-us',
  'usd-reserve-share',
  'nyfed-custody',
  'sp500-breadth-ratio',
  't5yie', // R8's promotion seat — a corpus series (the frozen basis), listed here so its readings compute
  // GF-P3 (GF-S9, 2026-11-06): the four FRED-sourced voter-candidates —
  // the candidates fixture's P3 series (recorded by gf-p3-record-candidates.ts;
  // the POST-P3-5LANE scenario seats these beside the 32).
  'real-yield-5y', // R2 (rank 19) — DFII5
  'dollar-broad', // D2 (rank 20) — DTWEXBGS
  'dollar-eme', // D9 (rank 21) — DTWEXEMEGS
  'bank-stress', // S9 (rank 28) — DPCREDIT
  // GF-S10 (2026-11-06): the I4 household anchor — the candidates
  // fixture's UoM SIE series (recorded by gf-p4-record-candidates.ts; the
  // POST-P4-5LANE scenario seats it beside the 36).
  'michigan-5y-expectations', // I4 (rank 32) — the UoM 5–10y median
];
const ALL_IDS: readonly string[] = [...new Set([...VOTER_IDS, ...CANDIDATE_READ_IDS, GF_F2_PROXY_ID])];

/* ------------------------------------------------------------------ *
 * A. The window assembly (the gold-backtest.ts replication)
 * ------------------------------------------------------------------ */

interface WindowReadings {
  date: string;
  /** The FROZEN basis: the 21 voter readings over the corpus series (the current production truth). */
  frozen: Map<string, IndicatorReading>;
  /** The POST-P1 basis: the 21 with the cftc-backfill + the derived gap swapped in, + the candidates + the F2 proxy. */
  post: Map<string, IndicatorReading>;
}

const gridDates = GOLD.map((p) => p.date);
const windows: WindowReadings[] = [];
const source = { name: 'GF-P0 calibration (frozen corpus + the GF-P0 fixtures)' };

for (const day of gridDates) {
  const now = frozenNow(day);
  // The D-6 cross-fill for the real-yield SCORING INPUT, exactly as in gold-backtest.ts.
  const fill = realYieldScoringSeries(
    seriesUpTo(SERIES[REAL_YIELD_ID]!, day),
    seriesUpTo(SERIES[FILL_LEGS.nominal]!, day),
    seriesUpTo(SERIES[FILL_LEGS.breakeven]!, day),
    now,
  );

  const frozen = new Map<string, IndicatorReading>();
  const post = new Map<string, IndicatorReading>();
  for (const id of ALL_IDS) {
    if (id === GF_F2_PROXY_ID) continue; // the proxy rides the cftc definition below
    const def = defById.get(id);
    if (def === undefined) throw new Error(`No DEFINITIONS entry for ${id} (the fixture recorded it — the definition is missing?)`);
    // The series per basis.
    let frozenSeries: SeriesPoint[] | undefined;
    let postSeries: SeriesPoint[] | undefined;
    if (id === REAL_YIELD_ID) {
      frozenSeries = fill.series !== undefined && fill.fills > 0 ? fill.series : seriesUpTo(SERIES[id]!, day);
      postSeries = frozenSeries;
    } else if (SERIES[id] !== undefined) {
      frozenSeries = seriesUpTo(SERIES[id]!, day);
      postSeries = frozenSeries;
    } else if (CAND_SERIES[id] !== undefined) {
      frozenSeries = undefined; // not a frozen voter
      postSeries = seriesUpTo(CAND_SERIES[id]!, day);
    }
    if (frozenSeries !== undefined) frozen.set(id, computeReading(def, frozenSeries, now, source));
    if (postSeries !== undefined) post.set(id, computeReading(def, postSeries, now, source));
  }
  // The POST swaps: cftc → the backfill; the gap → the derived history (the D-4/D-6 repairs).
  post.set('cftc-gold-positioning', computeReading(defById.get('cftc-gold-positioning')!, seriesUpTo(CFTC_BACKFILL_NET, day), now, source));
  post.set('us-japan-10y-gap', computeReading(defById.get('us-japan-10y-gap')!, seriesUpTo(GAP_DERIVED, day), now, source));
  // The F2 proxy: the cftc definition's semantics over the gross-long series, relabelled
  // to the harness-local proxy id (the cast is the relabel — the reading is never a
  // production reading; the proxy is a scenario object, disclosed in the report).
  post.set(
    GF_F2_PROXY_ID,
    { ...computeReading(defById.get('cftc-gold-positioning')!, seriesUpTo(CFTC_BACKFILL_GROSS_LONG, day), now, source), id: GF_F2_PROXY_ID } as unknown as IndicatorReading,
  );
  // GF-S10 (2026-11-06): the D-11/D-12 derived real curve — DFII10 − DFII5
  // over the corpus + candidates series (the exact production derivation,
  // 4dp quantized — the derived.ts twin), under its PRODUCTION definition
  // (real-curve-10y5y, rule: info — the sign variants measure over these
  // readings; the sign question is the decision-list item).
  if (CAND_SERIES['real-yield-5y'] !== undefined) {
    const realCurve = REAL_CURVE_DERIVED.length > 0 ? seriesUpTo(REAL_CURVE_DERIVED, day) : undefined;
    if (realCurve !== undefined) {
      post.set('real-curve-10y5y', computeReading(defById.get('real-curve-10y5y')!, realCurve, now, source));
    }
  }

  windows.push({ date: day, frozen, post });
}

console.log(`# GF-P0 calibration — ${new Date().toISOString()}`);
console.log(`windows: ${windows.length} (${gridDates[0]} → ${gridDates[gridDates.length - 1]}); mature base ≥ ${MATURE_FROM}: ${windows.filter((w) => isMature(w.date)).length}`);
console.log(`corpus: recorded ${corpus.recordedAt}; candidates: recorded ${candidates.recordedAt} (stage ${candidates.stageWrittenAt}); cftc backfill: ${cftc.weeks.length} weeks ${cftc.weeks[0]!.date} → ${cftc.weeks.at(-1)!.date} (${cftc.files.length} files, ${cftc.failures.length} failures)`);
console.log(`D-6 gap derivation: ${GAP_DERIVED.length} points ${GAP_DERIVED[0]!.date} → ${GAP_DERIVED.at(-1)!.date}`);

/* ------------------------------------------------------------------ *
 * The scenario runner (per scenario: per-window balances + net signs)
 * ------------------------------------------------------------------ */

interface ScenarioRun {
  scenario: GfScenario;
  all: GfCalibrationStats;
  mature: GfCalibrationStats;
}

function runScenario(scenario: GfScenario): ScenarioRun {
  const balances: GfLaneBalance[] = [];
  const netScores: number[] = [];
  const useFrozen = scenario.name.startsWith('FROZEN');
  for (const w of windows) {
    const readings = [...(useFrozen ? w.frozen : w.post).values()];
    balances.push(gfLaneBalance(readings, scenario.voters, scenario.lanes, scenario.minFiring, scenario.moveMap, scenario.inputPresence));
    netScores.push(gfNetScore(readings, scenario.voters, scenario.moveMap));
  }
  const matureIdx = windows.map((w, i) => (isMature(w.date) ? i : -1)).filter((i) => i >= 0);
  return {
    scenario,
    all: gfCalibrationStats(balances, netScores, scenario.lanes),
    mature: gfCalibrationStats(
      matureIdx.map((i) => balances[i]!),
      matureIdx.map((i) => netScores[i]!),
      scenario.lanes,
    ),
  };
}

/* ------------------------------------------------------------------ *
 * B. The FROZEN baseline assertion (BACKTEST-GOLD-LANES.md's committed numbers)
 * ------------------------------------------------------------------ */

/** The committed GB-S1 numbers (BACKTEST-GOLD-LANES.md, the 2026-11-03 corpus) — the drift gate. */
const GB_S1_COMMITTED: Record<string, { tippedFor: number; level: number; tippedAgainst: number; fullyTipped: number; flips: number; netFlips: number; laneSplit: Record<string, number> }> = {
  'FROZEN (MIN2)|all': { tippedFor: 885, level: 628, tippedAgainst: 999, fullyTipped: 1248, flips: 8, netFlips: 9, laneSplit: { 'borrowing-costs': 160, dollar: 458, stress: 91, inflation: 128 } },
  'FROZEN (MIN2)|mature': { tippedFor: 277, level: 249, tippedAgainst: 761, fullyTipped: 856, flips: 8, netFlips: 8, laneSplit: { 'borrowing-costs': 80, dollar: 358, stress: 44, inflation: 29 } },
  'FROZEN (MIN1)|all': { tippedFor: 902, level: 656, tippedAgainst: 954, fullyTipped: 567, flips: 8, netFlips: 9, laneSplit: { 'borrowing-costs': 160, dollar: 458, stress: 91, inflation: 128 } },
  'FROZEN (MIN1)|mature': { tippedFor: 254, level: 348, tippedAgainst: 685, fullyTipped: 395, flips: 6, netFlips: 8, laneSplit: { 'borrowing-costs': 80, dollar: 358, stress: 44, inflation: 29 } },
};

function assertFrozenBaseline(run: ScenarioRun): void {
  for (const [scope, s] of [['all', run.all], ['mature', run.mature]] as const) {
    const key = `${run.scenario.name}|${scope}`;
    const c = GB_S1_COMMITTED[key];
    if (c === undefined) continue;
    const ok =
      s.tippedFor === c.tippedFor &&
      s.level === c.level &&
      s.tippedAgainst === c.tippedAgainst &&
      s.fullyTipped === c.fullyTipped &&
      s.flipsMedianPer60 === c.flips &&
      s.netSignFlipsMedianPer60 === c.netFlips &&
      Object.entries(c.laneSplit).every(([lane, n]) => s.laneSplit[lane] === n);
    if (!ok) {
      throw new Error(
        `FROZEN baseline DRIFT at ${key}: measured (${s.tippedFor}/${s.level}/${s.tippedAgainst}, fullTip ${s.fullyTipped}, flips ${s.flipsMedianPer60} vs ${s.netSignFlipsMedianPer60}) vs committed (${c.tippedFor}/${c.level}/${c.tippedAgainst}, fullTip ${c.fullyTipped}, flips ${c.flips} vs ${c.netFlips}) — the harness drifted; investigate before writing anything.`,
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * C. The D-1 threshold derivation (the anchors' band + the per-seat walk)
 * ------------------------------------------------------------------ */

/** One anchor's measured firing band. */
interface AnchorStat {
  id: string;
  threshold: number;
  n: number; // readable windows with a finite change30d
  firing: number; // |ch30d| > threshold
  share: number;
}

const ANCHOR_IDS: readonly string[] = ['real-yield-10y', 'us10y', 'dollar-basket', 'breakeven-5y5y'];

/** The anchors' band over the FROZEN basis (the corpus windows — the anchors are frozen seats). */
const anchors: AnchorStat[] = ANCHOR_IDS.map((id) => {
  const threshold = GF_MOVE_FROZEN_BASE[id as IndicatorId]!;
  let n = 0;
  let firing = 0;
  for (const w of windows) {
    const r = w.frozen.get(id);
    if (r === undefined || !isReadable(r.status) || r.change30d === undefined || !Number.isFinite(r.change30d)) continue;
    n++;
    if (Math.abs(r.change30d) > threshold) firing++;
  }
  return { id, threshold, n, firing, share: n > 0 ? firing / n : Number.NaN };
});
const anchorShares = anchors.map((a) => a.share).sort((a, b) => a - b);
const medianAnchorShare = (anchorShares[1]! + anchorShares[2]!) / 2;

/** The derived threshold for one seat: the smallest 2-decimal value (rounded UP, so the measured share sits at or under the median) whose exceedance share over the same basis is ≤ the anchors' median share. */
function deriveThreshold(id: string, basis: 'frozen' | 'post'): { n: number; value: number; shareAtValue: number } | null {
  const values: number[] = [];
  for (const w of windows) {
    const r = basis === 'frozen' ? w.frozen.get(id) : w.post.get(id);
    if (r === undefined || !isReadable(r.status) || r.change30d === undefined || !Number.isFinite(r.change30d)) continue;
    values.push(Math.abs(r.change30d));
  }
  if (values.length < 100) return null; // too thin a basis to derive from — stated, never guessed
  values.sort((a, b) => a - b);
  const n = values.length;
  const maxFiring = Math.floor(medianAnchorShare * n); // exceedance count must be ≤ this
  // The smallest POSITIVE array value t with (#values > t) ≤ maxFiring (ties walked as
  // runs; zero skipped — a zero threshold is degenerate: any nonzero move would fire,
  // which is exactly the trap a mostly-flat step series like the policy rate sets).
  let raw: number | undefined;
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && values[j + 1] === values[i]) j++;
    const exceed = n - (j + 1); // values strictly greater than values[i]
    if (exceed <= maxFiring && values[i]! > 0) {
      raw = values[i]!;
      break;
    }
    i = j + 1;
  }
  if (raw === undefined) raw = values[n - 1]!; // the max (a degenerate guard — cannot happen at a ≤50% median)
  const value = Math.ceil(raw * 100) / 100;
  let firing = 0;
  for (const v of values) if (v > value) firing++;
  return { n, value, shareAtValue: firing / n };
}

/** The D-1 walk rows (the pre-stated rule: a seat earns a threshold only where the 02 treatment is change-led or level+change AND the cadence is daily; the monthly/quarterly seats are cadence-exempt — previous-release semantics). */
interface WalkRow {
  id: string;
  row: string; // the taxonomy row (02 v1.1)
  treatment: string; // 02's own treatment text (abbreviated, cited)
  cadence: string;
  decision: 'DERIVE' | 'ACCEPT-WITH-NOTE';
  reason: string;
  basis: 'frozen' | 'post';
  n?: number;
  derived?: number;
  shareAtDerived?: number;
}

const DERIVED_SEATS: ReadonlyArray<{ id: string; basis: 'frozen' | 'post'; reason: string }> = [
  { id: 'fed-expectations', basis: 'frozen', reason: 'D-2 (rank 1, GF-P1): 02 R6 "change + level vs decade range" — the change-led claim; daily' },
  { id: 'usdjpy', basis: 'frozen', reason: 'D-3 (rank 2, GF-P1): 02 D4 "change emphasis" — the carry-unwind move story; daily, the only pct seat' },
  { id: 'fed-target', basis: 'frozen', reason: '02 R5 "level + step direction" — the step grid measured against the derived value; daily' },
  { id: 'term-premium-10y', basis: 'post', reason: '02 R9 "level + change" — the promotion\'s own treatment; daily' },
  { id: 't5yie', basis: 'frozen', reason: '02 R8 "level + change" — the spot level\'s own claim; daily' },
];

const ACCEPT_SEATS: ReadonlyArray<{ id: string; row: string; treatment: string; cadence: string; reason: string }> = [
  { id: 'us30y', row: 'R1 (proxy)', treatment: 'level vs decade range + 30–90d change (the REAL object)', cadence: 'daily', reason: 'belt-and-braces only while the real object carries the claim (D-9/D-10)' },
  { id: 'ecb-dfr', row: 'R10', treatment: 'level of gaps; context for the crosses', cadence: 'daily', reason: 'level-led; the R10 repair carries the gap family' },
  { id: 'yield-curve-10y2y', row: 'R4', treatment: 'context / secondary (regime-dependent sign)', cadence: 'daily', reason: 'the D-7/D-8 sign decision governs the seat — measured both ways' },
  { id: 'yield-curve-10y3m', row: 'R4', treatment: 'context / secondary (regime-dependent sign)', cadence: 'daily', reason: 'with 10y2y — one decision covers the pair' },
  { id: 'us-japan-10y-gap', row: 'R10', treatment: 'level of gaps', cadence: 'daily', reason: 'level-led; the D-6 persistence repair is the actionable half' },
  { id: 'stress-stlfsi', row: 'S5', treatment: 'level', cadence: 'weekly', reason: 'level-led by its own treatment' },
  { id: 'nfci', row: 'S5', treatment: 'level', cadence: 'weekly', reason: 'level-led by its own treatment' },
  { id: 'vix', row: 'S1', treatment: 'level vs range', cadence: 'daily', reason: 'level-led by its own treatment' },
  { id: 'gold-silver', row: 'X1', treatment: 'level vs decade range', cadence: 'daily', reason: 'level-led; the D-5 base deepening is the repair' },
  { id: 'cftc-gold-positioning', row: 'F1', treatment: 'z-score / decade percentile of net share', cadence: 'weekly', reason: 'percentile-led (the contrarian claim reads extremes, not moves); the D-4 backfill is the repair' },
  { id: 'us-cpi-yoy', row: 'I1', treatment: 'level + 3m annualised momentum', cadence: 'monthly', reason: 'cadence-exempt — previous-release change semantics' },
  { id: 'us-pce-core-yoy', row: 'I2', treatment: 'level + momentum', cadence: 'monthly', reason: 'cadence-exempt — previous-release change semantics' },
  { id: 'euro-hicp', row: 'N-1', treatment: 'realised euro-area inflation (the amendment candidate)', cadence: 'monthly', reason: 'cadence-exempt — previous-release change semantics' },
  { id: 'breakeven-tilt', row: 'R7 (variant)', treatment: 'the D-5 promotion\'s own recorded level-only variant', cadence: 'daily', reason: 'the promotion record fixed the variant — a threshold would reopen it' },
  { id: 'gpr-daily', row: 'S7', treatment: 'level vs own history', cadence: 'daily', reason: 'level-led by its own treatment' },
  { id: 'sp500-breadth-ratio', row: 'S6', treatment: 'drawdown depth', cadence: 'daily', reason: 'the drawdown-depth claim is not a 30-day-change claim' },
  { id: 'ebp', row: 'S4', treatment: 'level', cadence: 'monthly', reason: 'level-led + cadence-exempt' },
  { id: 'michigan-sentiment', row: 'S13', treatment: 'level + change; context-leaning', cadence: 'monthly', reason: 'cadence-exempt — previous-release change semantics' },
  { id: 'michigan-1y-expectations', row: 'I3', treatment: 'level + change', cadence: 'monthly', reason: 'cadence-exempt — previous-release change semantics' },
  { id: 'm2-us', row: 'I7', treatment: 'YoY level; context-leaning', cadence: 'monthly', reason: 'cadence-exempt + the YoY percentile basis is the level read' },
  { id: 'us-deficit-12m', row: 'G1', treatment: 'level; slow voter or context', cadence: 'monthly', reason: 'level-led + cadence-exempt' },
  { id: 'nyfed-custody', row: 'G4', treatment: 'trend; context-leaning', cadence: 'weekly', reason: 'the trend claim is a slow level read, not a 30-day move' },
  { id: 'usd-reserve-share', row: 'D5', treatment: 'slow trend', cadence: 'quarterly', reason: 'cadence-exempt + the slow-trend claim' },
  { id: 'epu-us', row: 'S8', treatment: 'level', cadence: 'monthly', reason: 'level-led + cadence-exempt' },
  { id: 'tpu-us', row: 'S8', treatment: 'level', cadence: 'monthly', reason: 'level-led + cadence-exempt (the S8 complement)' },
];

const walkRows: WalkRow[] = [];
for (const seat of DERIVED_SEATS) {
  const d = deriveThreshold(seat.id, seat.basis);
  walkRows.push({
    id: seat.id,
    row: seat.id === 'fed-expectations' ? 'R6' : seat.id === 'usdjpy' ? 'D4' : seat.id === 'fed-target' ? 'R5' : seat.id === 'term-premium-10y' ? 'R9' : 'R8',
    treatment: seat.id === 'fed-expectations' ? 'change + level vs decade range' : seat.id === 'usdjpy' ? 'change emphasis' : seat.id === 'fed-target' ? 'level + step direction' : seat.id === 'term-premium-10y' ? 'level + change' : 'level + change',
    cadence: 'daily',
    decision: 'DERIVE',
    reason: seat.reason,
    basis: seat.basis,
    n: d?.n,
    derived: d?.value,
    shareAtDerived: d?.shareAtValue,
  });
}
for (const seat of ACCEPT_SEATS) {
  walkRows.push({ id: seat.id, row: seat.row, treatment: seat.treatment, cadence: seat.cadence, decision: 'ACCEPT-WITH-NOTE', reason: seat.reason, basis: 'frozen' });
}

// The self-check: the module's proposed constants must equal the derived values (D-GF-5).
for (const seat of DERIVED_SEATS) {
  const row = walkRows.find((r) => r.id === seat.id)!;
  const proposed = GF_MOVE_P1_PROPOSED[seat.id as IndicatorId];
  if (DERIVE_ONLY) continue;
  if (row.derived === undefined) throw new Error(`The derivation returned no value for ${seat.id} — the basis is too thin (stated, never guessed)`);
  if (proposed !== row.derived) {
    throw new Error(
      `GF_MOVE_P1_PROPOSED['${seat.id}'] = ${String(proposed)} but the derivation measured ${row.derived} (share ${(row.shareAtDerived! * 100).toFixed(1)}%, n=${row.n}) — update the module constant from the run and re-run (every number from a run).`,
    );
  }
}

console.log('\n## The D-1 derivation (the anchors\' band)');
for (const a of anchors) console.log(`  anchor ${a.id.padEnd(18)} t=${String(a.threshold).padEnd(5)} n=${a.n} firing=${a.firing} share=${(a.share * 100).toFixed(1)}%`);
console.log(`  median anchor share: ${(medianAnchorShare * 100).toFixed(1)}%`);
for (const r of walkRows.filter((x) => x.decision === 'DERIVE')) {
  console.log(`  derived ${r.id.padEnd(20)} n=${r.n} value=${r.derived} share=${r.shareAtDerived !== undefined ? (r.shareAtDerived * 100).toFixed(1) + '%' : '—'}`);
}
if (DERIVE_ONLY) {
  console.log('\n(--derive-only: the constants self-check + the scenarios skipped.)');
  process.exit(0);
}

/* ------------------------------------------------------------------ *
 * D. The scenarios
 * ------------------------------------------------------------------ */

const scenarios = gfScenarios();
const runs: ScenarioRun[] = [];
for (const scenario of scenarios) {
  const run = runScenario(scenario);
  if (scenario.name.startsWith('FROZEN')) assertFrozenBaseline(run);
  runs.push(run);
  const s = run.all;
  const m = run.mature;
  console.log(
    `\n## ${scenario.name} — n=${s.n} (mature ${m.n})\n  all:    for ${s.tippedFor} · level ${s.level} · against ${s.tippedAgainst} · fullTip ${s.fullyTipped} · flips ${s.flipsMedianPer60} vs net ${s.netSignFlipsMedianPer60} · C1 ${s.c1 ? 'PASS' : 'FAIL'} · C2 ${s.c2 ? 'PASS' : 'FAIL'}\n  mature: for ${m.tippedFor} · level ${m.level} · against ${m.tippedAgainst} · fullTip ${m.fullyTipped} · flips ${m.flipsMedianPer60} vs net ${m.netSignFlipsMedianPer60} · C1 ${m.c1 ? 'PASS' : 'FAIL'} · C2 ${m.c2 ? 'PASS' : 'FAIL'}`,
  );
}

/* ------------------------------------------------------------------ *
 * The per-seat firing tables (the POST-P1 basis, the proposed thresholds)
 * ------------------------------------------------------------------ */

interface SeatStat {
  id: string;
  readable: number;
  firing: number;
  supports: number;
  pressures: number;
  firstFiring: string | null;
  evidence: Record<string, number>;
}

function seatStats(voters: readonly GfVoter[], moveMap: ScenarioRun['scenario']['moveMap']): Map<string, SeatStat> {
  const byId = new Map<string, SeatStat>();
  for (const v of voters) {
    byId.set(v.id, { id: v.id, readable: 0, firing: 0, supports: 0, pressures: 0, firstFiring: null, evidence: {} });
  }
  for (const w of windows) {
    for (const v of voters) {
      const s = byId.get(v.id)!;
      const r = w.post.get(v.id);
      if (r === undefined || !isReadable(r.status)) continue;
      s.readable++;
      const leg = gfEvalLeg(v.id, r, moveMap);
      if (leg.lean === 0) continue;
      s.firing++;
      if (s.firstFiring === null) s.firstFiring = w.date;
      const evidence = leg.direction === 'rising' ? 'rising' : leg.direction === 'falling' ? 'falling' : leg.level === 'high' ? 'high' : 'low';
      s.evidence[evidence] = (s.evidence[evidence] ?? 0) + 1;
      if (leg.lean * v.polarity === 1) s.supports++;
      else s.pressures++;
    }
  }
  return byId;
}

const p2MoveMap = { ...GF_MOVE_FROZEN_BASE, ...GF_MOVE_P1_PROPOSED } as const;
const seatStatsPostP2 = seatStats(GF_VOTERS_P2_4LANE, p2MoveMap);
const seatStatsF1 = seatStats([{ lane: 'flows', id: 'cftc-gold-positioning', polarity: -1 }, { lane: 'flows', id: GF_F2_PROXY_ID, polarity: -1 }], p2MoveMap);
const seatStatsGprTpu = seatStats(
  [
    { lane: 'stress', id: 'gpr-index', polarity: 1 },
    { lane: 'stress', id: 'tpu-us', polarity: 1 },
  ],
  p2MoveMap,
);

/* The D-18 rule's measured effect over the FROZEN basis: the staged cftc's inputless windows. */
let d18InputlessWindows = 0;
for (const w of windows) {
  const r = w.frozen.get('cftc-gold-positioning');
  if (r === undefined) continue;
  if (!isReadable(r.status)) continue;
  const hasInputs =
    (r.change30d !== undefined && Number.isFinite(r.change30d)) || (r.percentile10y !== undefined && Number.isFinite(r.percentile10y));
  if (!hasInputs) d18InputlessWindows++;
}

/* ------------------------------------------------------------------ *
 * E. The report
 * ------------------------------------------------------------------ */

const L: string[] = [];
const emit = (s = ''): void => {
  L.push(s);
};
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const fmt = (x: number | null | undefined): string => (x === null || x === undefined ? '—' : String(x));

emit('# GF-P0 calibration — the proposed voter set + the lane rule re-derivation (2026-11-05)');
emit();
emit(`**Generated by \`packages/insights/scripts/gf-p0-calibration.ts\` (this file IS the committed run; the module tables: \`packages/insights/src/gf-p0-proposed.ts\` — NEW read-only harness tables beside the frozen ones, no product code, D-GF-1).** The measured basis: the frozen gold-backtest corpus (\`fixtures/gold-backtest-corpus.json\`, recorded ${corpus.recordedAt} — the same ${windows.length} windows ${gridDates[0]} → ${gridDates[gridDates.length - 1]}, the same frozen clock, the same no-lookahead truncation as BACKTEST-GOLD.md) + the GF-P0 fixtures recorded beside it (\`fixtures/gf-p0-candidates.json\`, recorded ${candidates.recordedAt} — the promotion candidates' staged series from the live KV stage blob (written ${candidates.stageWrittenAt}) + two disclosed fresh fetches: \`ebp\` (the Fed Board file, absent from this week's stage) and \`jgb-10y\` (the MOF all-file, the D-6 derivation input) + \`fixtures/gf-p0-cftc-backfill.json\` (the D-4 backfill measurement input: the CFTC legacy futures-only historical archive, ${cftc.files.length} yearly files 2016–2026, ${cftc.weeks.length} gold weeks ${cftc.weeks[0]!.date} → ${cftc.weeks.at(-1)!.date}, ${cftc.failures.length} failed files, every row passing the production parse's own arithmetic-identity assertions).`);
emit();
emit(`**The purpose, and the honesty footer up front (D-GF-3):** this calibration measures **firing statistics and lane behaviour only — never predictive power.** No forecasting edge is claimed, implied or tested for any scenario, seat, threshold or lane count below; the standing no-edge record (GOLD_BACKTEST_SPEC §5, BACKTEST-GOLD.md's measured tables) is untouched and unchallenged. The C1/C2 criteria are the GB-S1 protocol's own (gold-balance-consolidation 02 §6), unchanged: **C1** (not degenerate: level ≤ 70% of all windows AND fully-tipped ≤ 60%), **C2** (smoother than the same set's raw net sign: median lane-verdict flips per 60 trading days ≤ the net-sign figure). The min-firing lane rule is **re-derived per scenario, not assumed** (D-GF-2).`);
emit();
emit('## 1. The scenario family (every table below is labelled with its scenario)');
emit();
emit('| Scenario | What it adds over FROZEN | Voters | Lanes | Thresholds | D-18 rule |');
emit('|---|---|---|---|---|---|');
emit(`| **FROZEN** | nothing — the current production state (the GB-S1 baseline, asserted equal to BACKTEST-GOLD-LANES.md's committed numbers — the assertion passed) | 21 | 4 | the frozen 4 | off (today's rule) |`);
emit(`| **POST-P1** | the D-2/D-3 + D-1-derived thresholds (§3); the D-4 CFTC backfill (the F1/F2 series); the D-6 gap persistence (the derived history, ${GAP_DERIVED.length} pts); the D-18 input-presence rule; the yield-curve seats KEPT | 21 | 4 | frozen + ${Object.keys(GF_MOVE_P1_PROPOSED).length} | on |`);
emit(`| **POST-P1-DEMOTE** | POST-P1 + the D-7/D-8 context demotion (the audit's recommended option (b): the two yield-curve seats leave the voter set — measured beside the KEEP variant; the owner's sign decision) | 19 | 4 | frozen + ${Object.keys(GF_MOVE_P1_PROPOSED).length} | on |`);
emit(`| **POST-P2-4LANE** | POST-P1 + the promotions (§7): R9 · S4 · G1 · R8 · S13 · S7 · S8 · I3 · F2-proxy-class promotions + D5 · I7 · S6 · G4 (the COBD promotions) — the yield-curve demotion INCLUDED (the audit's recommended composition; the KEEP variant's delta = the two seats) | ${GF_VOTERS_P2_4LANE.length} | 4 | frozen + ${Object.keys(GF_MOVE_P1_PROPOSED).length} | on |`);
emit(`| **POST-P2-5LANE** | POST-P2-4LANE with the flows lane (OI-GA-2's ADD scenario): \`cftc-gold-positioning\` re-seated from stress to \`flows\` (D-14) + the F2 proxy seat | ${GF_VOTERS_5LANE.length} | 5 | frozen + ${Object.keys(GF_MOVE_P1_PROPOSED).length} | on |`);
emit(`| **POST-P3-5LANE** | GF-P3 (GF-S9, 2026-11-06): the four FRED-sourced voter-candidates (R2 real-yield-5y · D2 dollar-broad · D9 dollar-eme · S9 bank-stress) seated beside the 32 | ${GF_VOTERS_P3_5LANE.length} | 5 | frozen + ${Object.keys(GF_MOVE_P1_PROPOSED).length} + ${Object.keys(GF_MOVE_P3_PROPOSED).length} | on |`);
emit(`| **POST-P4-5LANE** | GF-S10 (2026-11-06): the I4 household anchor (michigan-5y-expectations, the UoM SIE 5–10y median) seated beside the 36 — the ONE remaining P3 candidate the corpus can measure | ${GF_VOTERS_P4_5LANE.length} | 5 | frozen + ${Object.keys(GF_MOVE_P1_PROPOSED).length} + ${Object.keys(GF_MOVE_P3_PROPOSED).length} | on |`);
emit(`| **POST-P3-5LANE-REALCURVE-PLUS** | GF-S10: the D-11/D-12 derived real curve (DFII10 − DFII5) seated in borrowing-costs at polarity +1 (a steepening real curve = gold-positive) — the sign twin A, measured beside | ${GF_VOTERS_REALCURVE_PLUS.length} | 5 | frozen + ${Object.keys(GF_MOVE_P1_PROPOSED).length} + ${Object.keys(GF_MOVE_P3_PROPOSED).length} | on |`);
emit(`| **POST-P3-5LANE-REALCURVE-MINUS** | GF-S10: the same real-curve seat at polarity −1 (a steepening real curve = gold-negative) — the sign twin B, measured beside | ${GF_VOTERS_REALCURVE_MINUS.length} | 5 | frozen + ${Object.keys(GF_MOVE_P1_PROPOSED).length} + ${Object.keys(GF_MOVE_P3_PROPOSED).length} | on |`);
emit();
emit(`Each scenario runs under BOTH crowd rules — **MIN2** (D-GB-3's default) and **MIN1** (the pre-registered fallback) — and both window scopes (all windows; the mature base ≥ ${MATURE_FROM}), exactly as GB-S1 pre-registered. The beam formula (D-GB-8) is inherited unchanged and is lane-count-agnostic: |net| / (for + against) × 10°, clamped [3, 10].`);
emit();
emit(`**What POST-P1 cannot re-run, stated honestly (the forward-looking repairs):** the D-5 gold-silver base deepening and the D-6 gap persistence are *ingest* repairs — their historical effect over this corpus re-run is the staged series as recorded (the D-6 gap's derived history IS simulated here over the corpus's own us10y × the fetched jgb-10y, ${GAP_DERIVED.length} points ${GAP_DERIVED[0]!.date} → ${GAP_DERIVED.at(-1)!.date} — the exact series the repair would persist); the D-5 deepening would replace the 122-point union series with the free daily ratio history — its effect on X1's firing is measured only once the P1 ingest lands (the level leg already fires over the union base; the deepening widens the base, it does not change the rule).`);
emit();

emit('## 2. The FROZEN baseline — the GB-S1 reproduction (the drift gate)');
emit();
emit('The FROZEN scenario re-derived the committed BACKTEST-GOLD-LANES.md numbers **exactly** (the script asserts them cell-for-cell — the assertion passed on this run): MIN2 all windows: level 628/2512 = 25.0%, fully tipped 1248 = 49.7%, flips 8 vs the net sign\'s 9 (C1 PASS · C2 PASS); MIN2 mature: level 19.3%, full-tip 66.5% (C1 FAIL on the mature scope, as GB-S1 recorded — stated, not hidden); MIN1 all: level 26.1%, full-tip 22.6% (C1 PASS · C2 PASS); MIN1 mature: level 27.0%, full-tip 30.7% (C1 PASS · C2 PASS). **The pre-registered GB-S1 decision — MIN2 — still holds on the frozen set.** The lane tables are BACKTEST-GOLD-LANES.md\'s own and are not restated here; every scenario below is measured against this baseline.');
emit();

emit('## 3. The D-1 threshold derivation — the anchors\' band + the pre-stated rule');
emit();
emit(`**The derivation rule, fixed before the walk (pre-registration discipline):** the four FROZEN gold-lane thresholds are the anchors (the beam formula inherited — D-GF-2 — the derivation never touches them); each anchor's **move-firing share** is measured over all corpus windows (readable + a finite change30d: the share of windows where |change30d| exceeds the threshold); a seat earns a proposed threshold **only where** (a) its 02 v1.1 treatment is change-led or explicitly "level + change" and (b) its cadence is daily (the monthly/quarterly seats are cadence-exempt — \`cadenceUsesPreviousRelease\`, scoring.ts:425-427 — a threshold there would read "the release-to-release move", not a 30-day move); the derived VALUE = the smallest positive 2-decimal value (rounded UP, so the measured share sits at or under the median; zero excluded — a zero threshold is degenerate) whose exceedance share over the same basis is ≤ the anchors' median share (the new thresholds inherit the anchors' firing regime rather than inventing one). Everything else is **accept-with-note** with its reason stated per seat.`);
emit();
emit('**The anchors\' measured band (the FROZEN basis):**');
emit();
emit('| Anchor seat | Threshold (units) | n (readable, change30d present) | firing windows | share |');
emit('|---|---|---|---|---|');
for (const a of anchors) emit(`| \`${a.id}\` | ${a.threshold} (${a.id === 'dollar-basket' ? 'points' : 'points'}) | ${a.n} | ${a.firing} | ${pct(a.share)} |`);
emit();
emit(`**The anchors' median share: ${pct(medianAnchorShare)}** (the band: ${pct(anchorShares[0]!)}–${pct(anchorShares[3]!)}). The derived thresholds below are the values whose measured firing shares sit at or under this median.`);
emit();
emit('**The walk — the 17 level-only seats + the new daily promotions (the D-1 question answered per seat):**');
emit();
emit('| Seat | 02 row | The 02 treatment (cited) | Cadence | Decision | The derived value (units) | firing share at the value | The reason |');
emit('|---|---|---|---|---|---|---|---|');
for (const r of walkRows) {
  const units = r.id === 'usdjpy' ? 'pct' : 'points';
  emit(
    `| \`${r.id}\` | ${r.row} | ${r.treatment} | ${r.cadence} | **${r.decision === 'DERIVE' ? 'DERIVE' : 'accept-with-note'}** | ${r.decision === 'DERIVE' ? `${r.derived} (${units})` : '—'} | ${r.decision === 'DERIVE' && r.shareAtDerived !== undefined ? `${pct(r.shareAtDerived)} (n=${r.n})` : '—'} | ${r.reason} |`,
  );
}
emit();
emit(`**The five derived values (the GF-P1 proposal — \`GF_MOVE_P1_PROPOSED\`, executed on the owner's recorded go per seat):** ${DERIVED_SEATS.map((s) => `\`${s.id}\` ${walkRows.find((r) => r.id === s.id)!.derived}`).join(' · ')}. The \`fed-target\` value lands exactly on the policy step grid (0.25 pt = one FOMC step) — the "step direction" treatment expressed as a 30-day move beyond one step; the measurement and the grid agree, which is the honest cross-check the rule hoped for. Every other seat accepts its level-only read with its reason stated above — the lean check's own evidence (three level-only seats fired on the fresh wire at the decade bands) stands as the proof the level leg alone is a real fire path.`);
emit();

emit('## 4. The scenarios — the C1/C2 re-derivation (the tables)');
emit();
emit('Definitions as GB-S1 fixed them: "level" = net 0 across the lane votes (the all-unread `none` state counted within level and reported separately); "fully tipped" = |net| = for + against (the one-sided 10° tip); "verdict flip" = a day-to-day change of the balance state; "flips per 60 trading days" = the median over every 60-trading-day window. **The decision rule (GB 02 §6, unchanged): use MIN2 if C1 and C2 hold; else MIN1 if C1 and C2 hold; if neither passes, STOP and bring the numbers to the owner.** The net-sign comparison figure is the SAME scenario\'s own raw voter net sign over the same windows (GB-S1\'s basis — "the 21-voter net sign" was the calibrated set\'s own count — applied to each scenario\'s own set). One visible effect of the D-18 input-presence rule, stated before the tables: the POST rows\' dollar lane reads `unread` in the first 2 windows (2016-11-07/08 — the FX seats\' histories begin ~2016-11-05, so neither the move input (no 30-day-back point yet) nor the level input (base < 30) exists yet; today\'s rule would read those `steady`) — the rule\'s honest rendering of a young series, 2 of 2512 windows.');
emit();
emit('| Scenario | Rule | Scope | n | level | full-tip | C1 | lane flips / 60td | net-sign flips / 60td | C2 |');
emit('|---|---|---|---|---|---|---|---|---|---|');
for (const run of runs) {
  for (const [scope, s] of [['all', run.all], ['mature', run.mature]] as const) {
    emit(
      `| ${run.scenario.name.replace(/ \(MIN[12]\)$/, '')} | MIN${run.scenario.minFiring} | ${scope === 'all' ? 'all windows' : `mature (≥ ${MATURE_FROM})`} | ${s.n} | ${pct(s.level / s.n)} | ${pct(s.fullyTipped / s.n)} | ${s.c1 ? 'PASS' : 'FAIL'} | ${fmt(s.flipsMedianPer60)} | ${fmt(s.netSignFlipsMedianPer60)} | ${s.c2 ? 'PASS' : 'FAIL'} |`,
    );
  }
}
emit();
emit(`**The mechanical verdict, stated plainly (the STOP branch fires for the proposed sets):** the FROZEN set re-affirms GB-S1's decision — **MIN2 passes both C1 and C2 on the all-windows scope** (and the mature-base C1 failure GB-S1 already recorded stands, stated not hidden). **Every proposed set FAILS the pre-registered C2 on the all-windows scope under BOTH crowd rules** — the repairs and the promotions make each set's own raw net sign SMOOTHER (the frozen net sign flips 9 per 60td; the post-P1 sets' 7; the post-P2 sets' 7 all / 4 mature) while the lane verdict's flips hold at 8–10 — a lane verdict that flips more often than the raw count it consolidates is exactly what C2 was pre-registered to catch. Per the protocol's own decision rule (GB 02 §6: "if neither passes, STOP and bring the numbers to the owner. Do not ship."), **the min-firing rule for the proposed sets is NOT selectable on this corpus: the numbers come to the owner with this report.** The measured shape behind the C2 failure, stated honestly and not narrated away: richer lanes vote MORE (each lane holds more voters, so the min-2 bar is reached more often) and a 4–5-lane net over more voting lanes flips more — the price of the coverage the promotions buy. The single POST row that passes both criteria on the mature scope (POST-P1-DEMOTE under MIN1: flips 6.5 vs 7) is stated for completeness — a fallback rule on the mature scope only, not a selection (the pre-registered criteria apply to ALL windows; GB-S1's own precedent).`);
emit();
emit('**The per-scenario state + lane tables (all windows; the mature-base scope is in the run record and summarised in the C1/C2 table above):**');
emit();
for (const run of runs) {
  const s = run.all;
  emit(`### ${run.scenario.name} — all windows (n = ${s.n})`);
  emit();
  emit(`Balance: for ${s.tippedFor} (${pct(s.tippedFor / s.n)}) · level ${s.level} (${pct(s.level / s.n)}) · against ${s.tippedAgainst} (${pct(s.tippedAgainst / s.n)}) · all-unread ${s.none}. Beam: 0° ${s.beam.level} · 3–6° ${s.beam.mid} · 6–10° ${s.beam.full} (fully tipped ${s.fullyTipped}, ${pct(s.fullyTipped / s.n)}).`);
  emit();
  emit('| Lane | unread | split |');
  emit('|---|---|---|');
  for (const lane of run.scenario.lanes) {
    emit(`| ${lane} | ${s.laneUnread[lane] ?? 0} (${pct((s.laneUnread[lane] ?? 0) / s.n)}) | ${s.laneSplit[lane] ?? 0} (${pct((s.laneSplit[lane] ?? 0) / s.n)}) |`);
  }
  emit();
}

emit('## 5. The lane-count evidence — OI-GA-2 (4-lane vs 5-lane)');
emit();
{
  const p24 = runs.find((r) => r.scenario.name === 'POST-P2-4LANE (MIN2)')!;
  const p25 = runs.find((r) => r.scenario.name === 'POST-P2-5LANE (MIN2)')!;
  const f1 = seatStatsF1.get('cftc-gold-positioning')!;
  const f2 = seatStatsF1.get(GF_F2_PROXY_ID)!;
  emit(`**The F-family's measured truth over the backfilled history (the D-4 repair simulated):** \`cftc-gold-positioning\` (F1, the net-share seat) is readable in ${f1.readable}/${windows.length} windows and **fires in ${f1.firing}** (${pct(f1.firing / windows.length)}; supports ${f1.supports} / pressures ${f1.pressures} — the contrarian polarity: crowded-long extremes read pressures); the F2 proxy (the gross-long share) is readable in ${f2.readable} and fires in ${f2.firing} (${pct(f2.firing / windows.length)}; supports ${f2.supports} / pressures ${f2.pressures}). The staged truth today (1 point, 0 firing windows — D-4) becomes a live, extreme-driven pair once the backfill lands: **the F-family's firing statistics are real, not hypothetical.**`);
  emit();
  // The flows lane's own vote counts under each rule — the OI-GA-2 evidence.
  const flowsVoteCounts = (minFiring: number): { for: number; against: number; neutral: number; unread: number; split: number } => {
    const c = { for: 0, against: 0, neutral: 0, unread: 0, split: 0 };
    for (const w of windows) {
      const b = gfLaneBalance([...w.post.values()], GF_VOTERS_5LANE, ['flows'], minFiring, p2MoveMap, true);
      const lane = b.lanes[0]!;
      if (lane.side === 'for') c.for++;
      else if (lane.side === 'against') c.against++;
      else if (lane.side === 'unread') c.unread++;
      else {
        c.neutral++;
        if (lane.split) c.split++;
      }
    }
    return c;
  };
  const flowsMin2 = flowsVoteCounts(2);
  const flowsMin1 = flowsVoteCounts(1);
  emit(`**The 5-lane scenario's flows lane (F1 + the F2 proxy, over the backfilled history):** under MIN2 — for ${flowsMin2.for} · against ${flowsMin2.against} · neutral ${flowsMin2.neutral} (of which split ${flowsMin2.split}) · unread ${flowsMin2.unread} of ${windows.length} windows: **the lane votes in ${flowsMin2.for + flowsMin2.against} windows (${pct((flowsMin2.for + flowsMin2.against) / windows.length)})** — the crowded-long extremes read against (pressures, the contrarian polarity) and the capitulation lows read for. Under MIN1 the lane votes in ${flowsMin1.for + flowsMin1.against} windows. The lane-count comparison on the C1/C2 criteria: POST-P2-4LANE (MIN2, all): level ${pct(p24.all.level / p24.all.n)}, full-tip ${pct(p24.all.fullyTipped / p24.all.n)}, C1 ${p24.all.c1 ? 'PASS' : 'FAIL'}, C2 ${p24.all.c2 ? 'PASS' : 'FAIL'}; POST-P2-5LANE (MIN2, all): level ${pct(p25.all.level / p25.all.n)}, full-tip ${pct(p25.all.fullyTipped / p25.all.n)}, C1 ${p25.all.c1 ? 'PASS' : 'FAIL'}, C2 ${p25.all.c2 ? 'PASS' : 'FAIL'}.`);
  emit();
  emit('**The calibration\'s reading of OI-GA-2 (a measurement, not a forecast):** the 5th lane changes the C1/C2 verdicts by the measured deltas above and nothing else in the engine (the beam formula is lane-count-agnostic; the strong-bar re-statement for 5 lanes — GOLD_LANE_STRONG 3-of-4 → 3-of-5 or 4-of-5 — is an Outlook-copy question for the implementation phase, recorded here so it cannot be forgotten). The audit\'s structural evidence stands unchanged: a 16-row classic family with exactly one dead, solo seat (D-14) — a family muted structurally under the 4-lane fold. The owner decides; both compositions are now measured.');
  emit();
}

emit('## 6. The per-seat firing tables (the POST-P1 basis — the owner\'s go/no-go evidence per promotion)');
emit();
emit(`Every promoted seat, measured over the post-repair basis (the backfill, the derived gap, the proposed thresholds — readable = the status rule; firing = either leg; the evidence split is the evaluator's own word). n = ${windows.length} windows (mature base ≥ ${MATURE_FROM}: ${windows.filter((w) => isMature(w.date)).length}).`);
emit();
emit('| Seat (the §4 rank) | readable | firing | supports | pressures | first firing | evidence split |');
emit('|---|---|---|---|---|---|---|');
{
  const rankOf: Record<string, string> = {
    'term-premium-10y': 'R9 · rank 6',
    ebp: 'S4 · rank 7',
    'us-deficit-12m': 'G1 · rank 8',
    t5yie: 'R8 · rank 9',
    'michigan-sentiment': 'S13 · rank 10',
    'gpr-daily': 'S7 · rank 11',
    'epu-us': 'S8 · rank 15',
    'michigan-1y-expectations': 'I3 · rank 16',
    'sp500-breadth-ratio': 'S6 · rank 17 (OI-GA-3)',
    'usd-reserve-share': 'D5 · rank 13 (OI-GA-3)',
    'nyfed-custody': 'G4 · rank 18 (OI-GA-3)',
    'm2-us': 'I7 · rank 14 (OI-GA-3)',
    'cftc-gold-positioning': 'F1 · rank 5 (the backfill)',
    [GF_F2_PROXY_ID]: 'F2 · rank 12 (the proxy)',
  };
  const ids = [...GF_VOTERS_P2_4LANE.map((v) => v.id), 'gpr-index', 'tpu-us', GF_F2_PROXY_ID];
  for (const id of ids) {
    const s = seatStatsPostP2.get(id) ?? seatStatsF1.get(id) ?? seatStatsGprTpu.get(id);
    if (s === undefined) continue;
    const ev = Object.entries(s.evidence)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ');
    emit(`| \`${id}\` (${rankOf[id] ?? '—'}) | ${s.readable} | ${s.firing} (${pct(s.firing / Math.max(1, s.readable))} of readable) | ${s.supports} | ${s.pressures} | ${s.firstFiring ?? '—'} | ${ev} |`);
  }
}
emit();
emit(`**The object-choice alternatives, measured (the owner's S7/S8 calls):** \`gpr-index\` (the monthly GPR object) fires ${seatStatsGprTpu.get('gpr-index')!.firing} of ${seatStatsGprTpu.get('gpr-index')!.readable} readable windows; \`gpr-daily\` (the daily 7d-MA object) ${seatStatsPostP2.get('gpr-daily')!.firing} of ${seatStatsPostP2.get('gpr-daily')!.readable}; \`tpu-us\` fires ${seatStatsGprTpu.get('tpu-us')!.firing} of ${seatStatsGprTpu.get('tpu-us')!.readable} beside \`epu-us\`'s ${seatStatsPostP2.get('epu-us')!.firing} of ${seatStatsPostP2.get('epu-us')!.readable}. Both objects are on the wire; the scenarios seat the daily GPR and the EPU — the alternatives are one seat-swap each, owner-gated.`);
emit();
emit(`**The D-18 rule, measured:** over the FROZEN basis the staged cftc seat reads readable-but-inputless in ${d18InputlessWindows} of the ${windows.length} windows (the 1-point staged truth) — today's rule renders those \`steady\` (the fake-steady finding); the input-presence rule renders them \`unread\`. With the D-4 backfill landed, the seat's inputs exist from the first window (the §6 row) — **the rule and the repair are complements, exactly as the audit stated**: the repair fixes the instance, the rule prevents the class (any future inputless-but-fresh seat).`);
emit();

emit('## 7. The proposed voter set, stated for the owner\'s go');
emit();
emit(`**Nothing below executes without the owner's recorded go, per seat change, with the audit report §4 row as the justification (D-GF-1).** The proposed set (the audit's recommended composition, now measured): the composition tables per variant —`);
emit();
emit('| Lane | FROZEN (today) | POST-P2-4LANE | POST-P2-5LANE |');
emit('|---|---|---|---|');
{
  const lanesOf = (voters: readonly GfVoter[], lanes: readonly string[]): string[] =>
    lanes.map((lane) => `${lane}: ${voters.filter((v) => v.lane === lane).length}`);
  const frozen = lanesOf(GF_VOTERS_FROZEN_21, ['borrowing-costs', 'dollar', 'stress', 'inflation']);
  const p24 = lanesOf(GF_VOTERS_P2_4LANE, ['borrowing-costs', 'dollar', 'stress', 'inflation']);
  const p25 = lanesOf(GF_VOTERS_5LANE, ['borrowing-costs', 'dollar', 'stress', 'inflation', 'flows']);
  const rows = ['borrowing-costs', 'dollar', 'stress', 'inflation', 'flows'];
  for (let i = 0; i < rows.length; i++) {
    emit(`| ${rows[i]} | ${i < 4 ? frozen[i] : '—'} | ${i < 4 ? p24[i] : '—'} | ${p25[i]} |`);
  }
  emit(`| **total** | **${GF_VOTERS_FROZEN_21.length}** | **${GF_VOTERS_P2_4LANE.length}** | **${GF_VOTERS_5LANE.length}** |`);
}
emit();
emit('The seat-by-seat composition (polarities, justifications) is `gf-p0-proposed.ts`\'s own commented tables — every seat line cites its §4 row. The P1 repairs and the P2 promotions land phase by phase (01-FILL-SPEC §1); **P0 wraps around every voter-set change** (D-GF-6): the recalibration re-runs before any new seat counts.');
emit();

emit('## 8. The owner\'s decision list (re-issued — the GA lock-fallback precedent)');
emit();
emit('No decisions were recorded before this session; every item below is **recorded-open**. The calibration adds measured evidence to the items marked ⚙.');
emit();
emit('| # | The decision | The audit\'s recommendation | The calibration\'s measured addition |');
emit('|---|---|---|---|');
emit('| OI-GA-2 | A fifth lane — flows & demand? | **Add** | ⚙ §5: both compositions measured on C1/C2; the F1/F2 firing statistics are real over the backfilled history |');
emit('| OI-GA-3 | The D5/S6 shadow promotions | Fold into GF-P2 (D5 promote-leaning) | ⚙ §6: both seats\' firing statistics measured |');
emit('| OI-GA-4 | WGC quarterly: voters or context-first? | Context-first | unchanged (no WGC series in this calibration — the quarterly cadence\'s semantics are the in-repo precedent) |');
emit('| OI-GA-5 | EODHD per-item policy | No use proposed | unchanged (free-first; none proposed) |');
emit('| OI-GA-6 | Copy rounds 79+ | Standing | unchanged |');
emit('| N-1 | euro-hicp: amend or re-seat? | **Amend** (the denominator becomes 86) | unchanged (the seat\'s firing stats are in §6; the amendment is a taxonomy edit, not a seat change) |');
emit('| D-7/D-8 | The yield-curve sign decision | (b) context demotion | ⚙ §4: the DEMOTE variant measured beside the KEEP variant |');
emit(`| D-18 | The readable-rule question | Adopt the input-presence rule | ⚙ §6: the rule's measured effect (${d18InputlessWindows} windows over the frozen basis; nil once the backfill lands) |`);
emit('| D-1 | The threshold question | Derive, don\'t assume | ⚙ §3: five derived values + the 22-seat accept-with-note walk |');
emit('| The 12 go/no-gos | R9 · I3 · I10 · S4 · S7 · S8 · S13 · G1 · X7 · F2 · D7 · I11 | PROMOTE ×8 · CONTEXT ×3 · D7 seat-or-context | ⚙ §6: every promotion\'s firing statistics measured; I10/X7/I11 are P4 context adds (no seat) |');
emit();

emit('## 9. Honesty notes');
emit();
emit(`1. **No forecasting claim, anywhere in this report.** The C1/C2 criteria measure legibility and stability — level shares, full-tip shares, verdict flips — never forward returns. No realised-move table was computed for any scenario (nothing was selected on returns; the GB-S1 lineage tables stand in BACKTEST-GOLD-LANES.md, labelled "not used for selection").`);
emit(`2. **Every cell carries n.** The window basis (${windows.length} windows), the mature split (≥ ${MATURE_FROM}), the per-seat readable counts and the anchors' firing shares are all stated beside their numbers; the derivation rule was fixed before the walk (§3) and the scenario family before the runs (§1).`);
emit(`3. **The fixtures are the record.** The corpus is the frozen 2026-11-03 recording; the GF-P0 fixtures (the candidates + the CFTC backfill) are the 2026-11-05 recordings with their venues disclosed (the stage blob's writtenAt ${candidates.stageWrittenAt}; the ebp and jgb-10y fresh fetches). Re-running the recorder re-records; re-running the calibration over the committed fixtures reproduces this file byte-for-byte.`);
emit(`4. **The staged-truth boundaries, stated:** the promotion candidates' histories are the repo's own staged/fetched series (the data plane the meter actually holds); the CFTC backfill and the D-6 gap derivation are SIMULATIONS of the P1 repairs over free sources (the exact series the repairs would stage — the parses replicate the production adapters' own assertions). The F2 seat is a scenario PROXY for F2's P2-designable object (the gross-long share; the one-seat-or-two question and the gross-short complement are the P2 design questions).`);
emit(`5. **The known young-series effects, disclosed:** the candidates' percentile bases are young at the first windows (the staged series begin ${fromEpochDay(Object.values(candidates.series)[0]![0]![0])}-class dates, the same stage window as the corpus's own series); the monthly/quarterly candidates (michigan ×2 · m2-us · us-deficit-12m · epu-us · tpu-us · gpr-index · usd-reserve-share · ebp) read previous-release change semantics and their percentile bases are monthly-density (a decade of monthlies ≈ 120 points — the H2 bar's own reading). The mature-base scope carries the deep-base view beside the all-windows view, exactly as GB-S1 did.`);
emit();
emit('---');
emit();
emit('*The program: GF-S1 (this calibration — the P0 pre-registration). The proposed voter set awaits the owner\'s recorded go; the GF-S2 prompt (P1 repairs or the decision-list re-issue, per the owner\'s answer) is in PROMPTS.md.*');

writeFileSync(OUT_PATH, L.join('\n') + '\n');
console.log(`\n✍ ${OUT_PATH} (${L.length} lines)`);
