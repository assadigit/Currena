/**
 * Gold Program — the backtest harness (GOLD_BACKTEST_SPEC.md §3; S4
 * built it, Session 6 re-ran it over the PROMOTED table; the 2026-11-03
 * re-check re-ran it over the GROWN corpus — GOLD_RECHECK_SPEC.md §3,
 * the manual stand-in for the missed 2026-11-02 armed check).
 *
 * Re-runs the PRODUCTION 21-voter gold table (B1 — the D-5 promotion,
 * Session 6: breakeven-tilt joined the inflation lane, exactly the variant
 * S4's B4 measured) over the recorded KV corpus at a frozen clock, joins
 * realized forward gold returns (B2), and carries the S4-frozen 20-voter
 * table as the lineage baseline (the promotion-delta tables: did the
 * promotion change the measured story?). Writes
 * docs/insights/BACKTEST-GOLD.md in BACKTEST.md's format, plus — since the
 * 2026-11-03 P0 calibration (gold-balance-consolidation 02 §6) — the lane
 * calibration report docs/insights/BACKTEST-GOLD-LANES.md over the same
 * windows (HARNESS_GOLD_LANES_MIN2 / _MIN1 beside the frozen tables).
 *
 * HONESTY RULES (B3), enforced by construction:
 *  - NO WALL-CLOCK READS anywhere — every date comes from the corpus
 *    (the report's own "generated" line is the corpus recording time).
 *  - NO LOOKAHEAD — every series is truncated at the window's as-of date
 *    before any scoring math runs (seriesUpTo; pinned by test).
 *  - The D-6 cross-fill is applied to the real-yield SCORING INPUT exactly
 *    as in production (realYieldScoringSeries), and its fill count is
 *    reported aloud.
 *  - Every cell carries n; gaps are stated per series, never interpolated.
 *  - The conclusion is MECHANICAL: a stated-in-advance rule (binomial
 *    2-SE departure from 50% + sign-consistency of the mean spread across
 *    horizons), computed from the tables — never narrated into existence.
 *
 * OFFLINE by design: reads ONLY the recorded corpus fixture
 * (fixtures/gold-backtest-corpus.json — the read-only KV dump produced by
 * scripts/gold-corpus-dump.ts). No live sites, no KV, no writes except
 * the reports. Manual script (the backtest.ts pattern), never part of the
 * test suite.
 *
 * Run: pnpm --filter @currena/insights gold-backtest
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IndicatorDefinition, IndicatorId, IndicatorReading } from '@currena/core';

import { DEFINITIONS, computeReading } from '../src/index';
import { GOLD_LANE_VOTERS } from '../src/gold-score';
import { realYieldScoringSeries } from '../src/real-yield-fill';
import { fromEpochDay, type SeriesPoint } from '../src/series';
import {
  GOLD_BACKTEST_HORIZONS,
  HARNESS_GOLD_LANES_MIN1,
  HARNESS_GOLD_LANES_MIN2,
  HARNESS_GOLD_VOTERS_20,
  bucketModelLabel,
  classifyReturn,
  flatBandPct,
  forwardTradingDayReturn,
  laneBalanceOverVoters,
  laneCalibrationStats,
  scoreOverVoters,
  seriesUpTo,
  signAgreement,
  type GoldBacktestHorizon,
  type HarnessLaneBalance,
} from '../src/gold-backtest-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = join(HERE, '..', 'fixtures', 'gold-backtest-corpus.json');
const OUT_PATH = join(HERE, '..', '..', '..', 'docs', 'insights', 'BACKTEST-GOLD.md');
const LANES_OUT_PATH = join(HERE, '..', '..', '..', 'docs', 'insights', 'BACKTEST-GOLD-LANES.md');

/* ------------------------------------------------------------------ *
 * The corpus (recorded, offline, read-only)
 * ------------------------------------------------------------------ */

interface CorpusArchiveReading {
  id: string;
  value: number | null;
  asOf: string | null;
  status: string;
  percentile10y?: number;
  change30d?: number;
}
interface CorpusArchive {
  generatedAt: string;
  goldSummary: { present: boolean; netScore?: number; label?: string };
  readings: CorpusArchiveReading[];
}
interface Corpus {
  v: number;
  recordedAt: string;
  venues: {
    stage: { key: string; writtenAt: string; seriesCount: number };
    goldHist: { key: string; points: number };
    archives: { keyPrefix: string; days: number };
  };
  series: Record<string, Array<[number, number]>>;
  goldHist: { id: string; points: Array<[number, number]> };
  archives: Record<string, CorpusArchive>;
  seriesIds: string[];
}

const corpus: Corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf-8'));
const asPairs = (pairs: Array<[number, number]>): SeriesPoint[] =>
  pairs.map(([day, value]) => ({ date: fromEpochDay(day), value }));

const SERIES: Record<string, SeriesPoint[]> = {};
for (const [id, pairs] of Object.entries(corpus.series)) SERIES[id] = asPairs(pairs);
const GOLD: SeriesPoint[] = asPairs(corpus.goldHist.points);

const defById = new Map<string, IndicatorDefinition>(DEFINITIONS.map((d) => [d.id as string, d]));
/** The PRODUCTION voter ids — 21 since the D-5 promotion (the tilt included). */
const VOTER_IDS = GOLD_LANE_VOTERS.map((v) => v.id as string);
/** The S4-frozen lineage baseline's ids — 20 (the tilt's absence IS the promotion). */
const LEGACY_IDS = HARNESS_GOLD_VOTERS_20.map((v) => v.id as string);
const TILT_ID = 'breakeven-tilt';
const REAL_YIELD_ID = 'real-yield-10y';
/** The D-6 cross-fill legs (derived.ts passthroughs: us10y = DGS10, breakeven-10y = T10YIE). */
const FILL_LEGS = { nominal: 'us10y', breakeven: 'breakeven-10y' } as const;

const missing = [...new Set([...VOTER_IDS, ...LEGACY_IDS])].filter((id) => SERIES[id] === undefined);
if (missing.length > 0) throw new Error(`Corpus is missing series: ${missing.join(', ')}`);

/** The frozen clock anchor of a window (the production main rung's time-of-day; day-boundary only). */
const frozenNow = (day: string): string => `${day}T04:10:00.000Z`;

/** The readable rule, gold-score.ts's own. */
const isReadable = (status: string): boolean => status !== 'stale' && status !== 'check-pending' && status !== 'unavailable';

/* ------------------------------------------------------------------ *
 * B1 — the historical re-run (frozen clock, no lookahead)
 * ------------------------------------------------------------------ */

interface VoterState {
  readable: boolean;
  impact: 'tailwind' | 'headwind' | null;
  evidence: 'rising' | 'falling' | 'high' | 'low' | null;
}
interface WindowResult {
  date: string;
  goldIndex: number;
  /** The PRODUCTION 21-voter reading (the promoted table). */
  scoreProd: ReturnType<typeof scoreOverVoters>;
  /** The S4-frozen 20-voter reading (the lineage baseline). */
  scoreLegacy: ReturnType<typeof scoreOverVoters>;
  /** The consolidated lane balance under MIN2 (D-GB-3's default rule). */
  laneMin2: HarnessLaneBalance;
  /** The consolidated lane balance under MIN1 (the pre-registered fallback). */
  laneMin1: HarnessLaneBalance;
  voterState: Map<string, VoterState>;
  realYieldFills: number;
  realYieldCapped: boolean;
}

const gridDates = GOLD.map((p) => p.date);
const goldIndexOf = new Map<string, number>(gridDates.map((d, i) => [d, i]));

/** One voter's state at one window, via the shared evaluator over one reading. */
function voterStateOf(reading: IndicatorReading, def: { lane: 'borrowing-costs' | 'dollar' | 'stress' | 'inflation'; id: IndicatorId; polarity: 1 | -1 }): VoterState {
  if (!isReadable(reading.status)) return { readable: false, impact: null, evidence: null };
  const leg = scoreOverVoters([reading], [def]).voters[0];
  return leg === undefined
    ? { readable: true, impact: null, evidence: null }
    : { readable: true, impact: leg.impact, evidence: leg.evidence };
}

let crossFillTotal = 0;
let crossFillCappedWindows = 0;
const windows: WindowResult[] = [];

for (const day of gridDates) {
  const now = frozenNow(day);

  // The D-6 cross-fill for the real-yield SCORING INPUT, exactly as in
  // production: the truncated pure DFII10 + the exact-date DGS10 − T10YIE
  // fills inside the decade window anchored at the frozen date.
  const fill = realYieldScoringSeries(
    seriesUpTo(SERIES[REAL_YIELD_ID]!, day),
    seriesUpTo(SERIES[FILL_LEGS.nominal]!, day),
    seriesUpTo(SERIES[FILL_LEGS.breakeven]!, day),
    now,
  );
  if (fill.fills > 0) crossFillTotal += fill.fills;
  if (fill.capped) crossFillCappedWindows++;

  const readings: IndicatorReading[] = [];
  const voterState = new Map<string, VoterState>();
  for (const id of VOTER_IDS) {
    const def = defById.get(id)!;
    const tableEntry = GOLD_LANE_VOTERS.find((v) => v.id === id)!;
    const scoringSeries =
      id === REAL_YIELD_ID && fill.series !== undefined && fill.fills > 0 ? fill.series : seriesUpTo(SERIES[id]!, day);
    const reading = computeReading(def, scoringSeries, now, { name: 'stored history (stage blob)' });
    readings.push(reading);
    voterState.set(id, voterStateOf(reading, tableEntry));
  }

  // The promoted 21st voter rides the SAME loop as every voter (its
  // reading is already among `readings` — the shared evaluator, level-leg
  // only, like every voter without a move threshold). The lineage baseline
  // re-scores the 20 pre-promotion readings over the S4-frozen table.
  const legacyReadings = readings.filter((r) => (r.id as string) !== TILT_ID);

  windows.push({
    date: day,
    goldIndex: goldIndexOf.get(day)!,
    scoreProd: scoreOverVoters(readings, GOLD_LANE_VOTERS),
    scoreLegacy: scoreOverVoters(legacyReadings, HARNESS_GOLD_VOTERS_20),
    // The P0 lane calibration (02 §6): the SAME 21 readings, grouped into
    // the four lanes under each crowd-minimum rule. Additive only — the
    // frozen tables above are untouched.
    laneMin2: laneBalanceOverVoters(readings, HARNESS_GOLD_LANES_MIN2.voters, HARNESS_GOLD_LANES_MIN2.minFiring),
    laneMin1: laneBalanceOverVoters(readings, HARNESS_GOLD_LANES_MIN1.voters, HARNESS_GOLD_LANES_MIN1.minFiring),
    voterState,
    realYieldFills: fill.fills,
    realYieldCapped: fill.capped,
  });
}

/* ------------------------------------------------------------------ *
 * B2 — the realized-move join
 * ------------------------------------------------------------------ */

/** The mature-base split: windows ≥ 5 years after the corpus's common series start (2016-09-23). */
const MATURE_FROM = '2021-09-23';
const isMature = (date: string): boolean => date >= MATURE_FROM;

interface BucketStats {
  n: number;
  up: number;
  flat: number;
  down: number;
  mean: number | null;
  median: number | null;
}
interface JoinResult {
  rows: Record<'tailwind' | 'mixed' | 'headwind', BucketStats>;
  all: BucketStats;
  signAgree: { n: number; agree: number };
  nJoined: number;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function joinStats(
  selected: readonly WindowResult[],
  horizon: GoldBacktestHorizon,
  model: 'scoreProd' | 'scoreLegacy',
): JoinResult {
  const band = flatBandPct(horizon);
  const emptyRow = (): BucketStats => ({ n: 0, up: 0, flat: 0, down: 0, mean: null, median: null });
  const rows = { tailwind: emptyRow(), mixed: emptyRow(), headwind: emptyRow() };
  const byBucketReturns: Record<'tailwind' | 'mixed' | 'headwind', number[]> = { tailwind: [], mixed: [], headwind: [] };
  const allReturns: number[] = [];
  let agreeN = 0;
  let agree = 0;

  for (const w of selected) {
    const ret = forwardTradingDayReturn(GOLD, w.goldIndex, horizon);
    if (ret === undefined) continue;
    allReturns.push(ret);
    const bucket = bucketModelLabel(w[model].label);
    const move = classifyReturn(ret, band);
    rows[bucket].n++;
    rows[bucket][move]++;
    byBucketReturns[bucket].push(ret);
    const a = signAgreement(w[model].netScore, ret, band);
    if (a !== undefined) {
      agreeN++;
      if (a) agree++;
    }
  }
  for (const key of ['tailwind', 'mixed', 'headwind'] as const) {
    const rets = byBucketReturns[key];
    rows[key].mean = rets.length > 0 ? rets.reduce((s, v) => s + v, 0) / rets.length : null;
    rows[key].median = median(rets);
  }
  const all: BucketStats = {
    n: allReturns.length,
    up: allReturns.filter((r) => classifyReturn(r, band) === 'up').length,
    flat: allReturns.filter((r) => classifyReturn(r, band) === 'flat').length,
    down: allReturns.filter((r) => classifyReturn(r, band) === 'down').length,
    mean: allReturns.length > 0 ? allReturns.reduce((s, v) => s + v, 0) / allReturns.length : null,
    median: median(allReturns),
  };
  return { rows, all, signAgree: { n: agreeN, agree }, nJoined: allReturns.length };
}

/** Label-conditional returns (the full 5-step vocabulary + the null row, every row kept). */
function labelConditional(selected: readonly WindowResult[], horizon: GoldBacktestHorizon, model: 'scoreProd' | 'scoreLegacy') {
  const labels = ['strong-tailwind', 'tailwind', 'balanced', 'headwind', 'strong-headwind', 'null'] as const;
  return labels.map((label) => {
    const rets = selected
      .map((w) => forwardTradingDayReturn(GOLD, w.goldIndex, horizon))
      .map((ret, i) => ({ ret, w: selected[i]! }))
      .filter(({ ret, w }) => ret !== undefined && (w[model].label ?? 'null') === label)
      .map(({ ret }) => ret!);
    return {
      label,
      n: rets.length,
      mean: rets.length > 0 ? rets.reduce((s, v) => s + v, 0) / rets.length : null,
      median: median(rets),
    };
  });
}

/** The last window of each calendar month (the month-end traces). */
function monthEndWindows(selected: readonly WindowResult[]): WindowResult[] {
  const out: WindowResult[] = [];
  for (let i = 0; i < selected.length; i++) {
    const cur = selected[i]!;
    const next = selected[i + 1];
    if (next === undefined || next.date.slice(0, 7) !== cur.date.slice(0, 7)) out.push(cur);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The archive era — the live out-of-sample slice (tiny-n, stated)
 * ------------------------------------------------------------------ */

const archiveDays = Object.keys(corpus.archives).sort();
const archiveGoldSummaryDays = archiveDays.filter((d) => corpus.archives[d]!.goldSummary.present);

function archiveScore(day: string, model: 'scoreProd' | 'scoreLegacy'): { netScore: number; label: string | null } {
  const a = corpus.archives[day]!;
  // The production ids include the tilt; the pre-S3 archives simply lack
  // its reading, so it stays silent there (readable() on undefined — the
  // honest as-rung state, stated in the report below).
  const ids = model === 'scoreProd' ? VOTER_IDS : LEGACY_IDS;
  const readings: IndicatorReading[] = a.readings
    .filter((r) => ids.includes(r.id))
    .map((r) => ({
      id: r.id as IndicatorId,
      sourceName: `archive ${day}`,
      updatedAt: a.generatedAt,
      value: r.value,
      asOf: r.asOf,
      status: r.status as IndicatorReading['status'],
      ...(r.percentile10y !== undefined ? { percentile10y: r.percentile10y } : {}),
      ...(r.change30d !== undefined ? { change30d: r.change30d } : {}),
    }));
  const score = scoreOverVoters(readings, model === 'scoreProd' ? GOLD_LANE_VOTERS : HARNESS_GOLD_VOTERS_20);
  return { netScore: score.netScore, label: score.label };
}

/** The archive grid join: the last gold observation at or before the archive day, +N trading days. */
function archiveForwardReturn(day: string, horizon: number): number | undefined {
  let idx = -1;
  for (let i = 0; i < GOLD.length; i++) {
    if (GOLD[i]!.date <= day) idx = i;
    else break;
  }
  return idx < 0 ? undefined : forwardTradingDayReturn(GOLD, idx, horizon);
}

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

const fmtPct = (x: number | null, digits = 1): string => (x === null ? '—' : `${(x * 100).toFixed(digits)}%`);
const fmtNum = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));

const LINES: string[] = [];
const emit = (s = '') => LINES.push(s);

function confusionTable(t: JoinResult): void {
  emit('| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |');
  emit('|---|---|---|---|---|---|---|');
  for (const bucket of ['tailwind', 'mixed', 'headwind'] as const) {
    const r = t.rows[bucket];
    const c = (x: number) => (r.n > 0 ? `${x} [${fmtPct(x / r.n, 0)}]` : '0');
    emit(`| **${bucket}** | ${c(r.up)} | ${c(r.flat)} | ${c(r.down)} | ${r.n} | ${fmtNum(r.mean)}% | ${fmtNum(r.median)}% |`);
  }
  emit(`| *all windows* | ${t.all.up} | ${t.all.flat} | ${t.all.down} | ${t.all.n} | ${fmtNum(t.all.mean)}% | ${fmtNum(t.all.median)}% |`);
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

emit('# Gold-score backtest — the 2026-11-03 re-check re-run (the promoted 21-voter table over the grown corpus)');
emit();
emit(
  `Generated from the recorded KV corpus (\`packages/insights/fixtures/gold-backtest-corpus.json\`, recorded ${corpus.recordedAt} read-only via \`pnpm --filter @currena/insights gold-corpus-dump\` — the 2026-11-03 re-check refresh this report records: ${archiveDays.length} archive days, the grown corpus the missed 2026-11-02 armed check was to carry; the stage blob it froze was written ${corpus.venues.stage.writtenAt}, and the two FX voters' histories were sourced read-only from their own \`insights:hist:*\` keys — the venue note below). No live sites are touched; the harness reads recorded data only, at a frozen clock (no wall-clock reads anywhere). The voter table re-run here is the PROMOTED production table (Session 6, D-5: 21 voters — the S4-frozen 20 carried beside it as the lineage baseline); the thresholds and labels are unchanged from S1. NOTHING here changes production. Every cell carries its n.`,
);
emit();
emit('## Method');
emit();
emit('- Engine: the PRODUCTION 21-voter table (`gold-score.ts` `GOLD_LANE_VOTERS` — the D-5 promotion, Session 6: `breakeven-tilt` in the inflation lane, polarity +1, level-leg only) evaluated through the shared signals evaluator (`connections.ts` `evalLeg` — a 30-day direction beyond the per-leg minimum move, else the decade-extreme level), the same `computeReading` percentile/change/stale math the ingest runs, and `scoreOverVoters` — a harness-local parameterized copy of the score arithmetic **pinned equal to the production engine by test** (`gold-backtest-core.test.ts`); the S4-frozen 20-voter table (`HARNESS_GOLD_VOTERS_20`, pinned to production-minus-the-tilt) rides beside it as the lineage baseline.');
emit('- Frozen clock: every window passes its own date (`<window-day>T04:10:00.000Z`, the main rung\u2019s time-of-day); nothing reads the wall clock.');
emit('- No lookahead: every series is truncated at the window day BEFORE any scoring math (`seriesUpTo`); percentiles are computed strictly from observations at or before the as-of date. Truncated-vs-full equality and a future-spike mutation test pin this.');
emit('- The D-6 cross-fill is applied to the real-yield-10y SCORING INPUT exactly as in production (`realYieldScoringSeries` over the truncated pure DFII10 + the DGS10/T10YIE legs, the same decade window, 2003 floor, 4dp quantization and 5% cap), and the fill count is reported aloud below.');
emit(
  `- Windows: EVERY gold trading day across the stored-history span (the realized series' own dates — the join needs no interpolation): ${gridDates[0]} → ${gridDates[gridDates.length - 1]}, **${windows.length} windows** (the daily grid; the compute budget allowed it).`,
);
emit(
  `- Realized moves: forward N-TRADING-DAY returns from \`insights:hist:gold-usd\` (the spec's B2 venue; ${GOLD.length} observations, ${GOLD[0]!.date} → ${GOLD[GOLD.length - 1]!.date}), EXACTLY N observations ahead — never interpolated. Horizons: 5 / 20 / 60 trading days.`,
);
emit(
  `- The flat band: the engine's OWN reality bar (±2% per 30 calendar days, \`GOLD_REALITY_SPEED_PCT\`) linearly scaled to each horizon's calendar length (5 trading days ≈ 7 calendar days → **±${flatBandPct(5).toFixed(2)}%**; 20td ≈ 28d → **±${flatBandPct(20).toFixed(2)}%**; 60td ≈ 84d → **±${flatBandPct(60).toFixed(2)}%**). One constant, one scaling rule — no per-horizon tuning.`,
);
emit('- The label axis folds the 5-step vocabulary to 3 buckets (tailwind / mixed / headwind; **mixed = balanced ∪ nothing-firing**); the move axis is up / flat / down against the band.');
emit(
  `- Multiple testing is named: 3 horizons × 3 label buckets is already 9 cells per table — ALL are reported, none picked. One sensitivity split is stated (the mature-base subsample: windows ≥ ${MATURE_FROM}, i.e. a percentile base of at least ~5 years for the daily voters) and reported BESIDE the all-windows tables, never selected from.`,
);
emit(
  `- Archive era: the ${archiveDays.length} archived days are re-scored from the readings the rungs ACTUALLY stamped (the live out-of-sample slice — the SPA's own re-derivation path), joined to the same forward returns. Tiny-n by construction; stated as such.`,
);
emit();

/* --- The corpus verification (spec §0) --- */
emit('## The corpus (the §0 verification, at harness run time)');
emit();
emit('- Live API `https://currena.ir/api/insights` (checked at this re-check\'s session start, 2026-11-03 ~04:37 UTC): `goldSummary` PRESENT (netScore −1, label `headwind`, 5 firing — the 04:35 rung, stamped by the PROMOTED engine; borrowing-costs mixed 2/2 · dollar unreadable · stress unreadable · inflation cool 0/1) and `breakeven-tilt` present among the 161 readings (−0.20, asOf 2026-11-02, percentile10y 0.234 — mid-range, silent today). `/api/health` answered `ok:true` (kv ok, 2026-11-03T04:37:30Z). These are the re-run\'s "today" anchors.');
emit(
  `- Read-only KV: **${archiveDays.length} full archive days** (\`insights:archive:v1:*\`, ${archiveDays[0]} → ${archiveDays[archiveDays.length - 1]}; 2026-10-20 absent — a rung outage day, the only gap). The newest (${archiveDays[archiveDays.length - 1]}) carries \`goldSummary\` (present on: ${archiveGoldSummaryDays.join(', ')} — the field shipped with S2.1/S3 and the 10-31 rung was the first to stamp it).`,
);
emit(`- The stored-history span: the daily FRED family's stage series start ${SERIES[REAL_YIELD_ID]![0]!.date} — the harness's depth is ~10.1 years, exactly the depth production's percentile window sees.`);
emit(`- Venue note: the stage blob's gold-usd copy carries ${SERIES['gold-usd']!.length} points (${SERIES['gold-usd']![0]!.date} → ${SERIES['gold-usd']![SERIES['gold-usd']!.length - 1]!.date}); the realized-move series (\`insights:hist:gold-usd\`, the spec's venue) carries ${GOLD.length} (${GOLD[0]!.date} → ${GOLD[GOLD.length - 1]!.date}) — ${SERIES['gold-usd']!.length - GOLD.length} points fewer at the head; both end ${GOLD[GOLD.length - 1]!.date}. The join uses the hist key; the difference is recorded, not silently reconciled. The KV history is a rolling ~10-year window: this refresh trimmed the head (2016-11-02…11-04 left the window) and dropped the 2026-10-31 Saturday seed point the S6 corpus carried at its tail while gaining 2026-11-02/11-03 — the net window count MOVED DOWN by 2 against the S6 run (2,514 → ${windows.length}), recorded, not softened. The FX voters' histories (dollar-basket, usdjpy) no longer ride the stage blob — the dump sourced them read-only from \`insights:hist:<id>\` (the gap-closure S5/S6 ingest rounds moved them); their values on common days are identical to the S6 corpus.`);
emit();
emit('The asOf-watch (the S3 known-gap — did the trio keep moving WITH the decade group after the D-4 split?), newest 6 archive days:');
emit();
emit('| archive day | us10y | us30y | real-yield-10y | T5YIFR (decade group) | t5yie | trio status |');
emit('|---|---|---|---|---|---|---|');
for (const day of archiveDays.slice(-6)) {
  const byId = new Map(corpus.archives[day]!.readings.map((r) => [r.id, r]));
  const cell = (id: string): string => byId.get(id)?.asOf ?? '—';
  emit(`| ${day} | ${cell('us10y')} | ${cell('us30y')} | ${cell('real-yield-10y')} | ${cell('breakeven-5y5y')} | ${cell('t5yie')} | ${byId.get('us10y')?.status ?? '—'} ×3 |`);
}
emit();
{
  // The watch verdict, DERIVED from the recorded asOf rows: the trio-vs-
  // decade-group offset in gold TRADING days (the realized grid's own dates),
  // per archive day. Offset 1 at every rung (including both groups HOLDING)
  // is LOCKSTEP per GOLD_RECHECK_SPEC §4; a wider offset is divergence.
  const gridSet = new Set(gridDates);
  const tradingDaysBetween = (a: string, b: string): number | null => {
    if (!gridSet.has(a) || !gridSet.has(b) || b <= a) return null;
    let n = 0;
    for (const d of gridDates) {
      if (d > a && d <= b) n++;
      if (d > b) break;
    }
    return n;
  };
  const watchRows = archiveDays.map((day) => {
    const byId = new Map(corpus.archives[day]!.readings.map((r) => [r.id, r]));
    const trio = byId.get('us10y')?.asOf ?? null;
    const decade = byId.get('breakeven-5y5y')?.asOf ?? null;
    return { day, trio, decade, off: trio !== null && decade !== null ? tradingDaysBetween(trio, decade) : null };
  });
  const postS6 = watchRows.filter((r) => r.day > '2026-10-31'); // the rungs after the S6 close — the watch's days 2+
  const lockstep = postS6.every((r) => r.off === 1);
  const offsetsText = watchRows.slice(-6).map((r) => `${r.day}: offset ${r.off === null ? '—' : r.off}`).join(' · ');
  emit(
    `**Verdict (days 2–3, measured from the archive rows):** ${postS6.map((r) => r.day).join(', ')} — the rungs after the S6 close. The trio-vs-decade-group offset in gold trading days at each of the last 6 archive days: ${offsetsText}. ${
      lockstep
        ? 'Every post-S6 rung holds the offset at EXACTLY 1 trading day — both groups HELD over the 11-01 weekend and at the 11-02 Monday rung, then both advanced exactly +1 trading day at the 11-03 rung (trio 2026-10-29 → 2026-10-30; decade group 2026-10-30 → 2026-11-02; values moved too: us10y 4.98 → 4.94). That is LOCKSTEP per GOLD_RECHECK_SPEC §4 (weekends and same-day holds are not divergence): **the watch closes as validated-by-watch — the honest wording, still not "proven"**. Days 4+ ride future re-checks.'
        : `The offset WIDENED beyond 1 trading day at one or more rungs — DIVERGENCE per GOLD_RECHECK_SPEC §4: escalate to the owner with the measured rows; make NO code change (the cross-fill does not silently extend to the trio).`
    }`,
  );
}
emit();

/* --- Coverage --- */
emit('## Coverage — the 21 voters over the stored histories');
emit();
emit('| Voter | Cadence | Span | Obs | Readable windows | Firing windows | Tailwind | Headwind | First firing | Gap notes |');
emit('|---|---|---|---|---|---|---|---|---|---|');
{
  const gapNotes: Record<string, string> = {
    'cftc-gold-positioning':
      'stored history = 1 point (2026-10-27 — the CFTC series only began accumulating): never fires in the re-run era; the stress lane effectively ran 4-voter',
    'us-japan-10y-gap':
      'the monthly jgb backfill LEFT the stored stage window between the S6 and this corpus (97 → 21 points; the remaining span is the 2026-10-01 → 2026-10-30 MOF daily-upgrade era) — unreadable in every re-run window before 2026-10, fired in 0 windows',
    'gold-silver':
      'percentile history is the World Bank monthly backfill; the 2026-10-08 → 10-31 daily seeds the S6 corpus carried are gone from the stage window (the current daily seeds are 2026-11-02/03) — a daily-cadence reading over a monthly-density series is stale most windows',
    'ecb-dfr': 'forward-filled daily series (per-decision levels) — the percentile base weights long-held rates by calendar days; production semantics inherited',
    'fed-target': 'forward-filled daily series (per-decision levels) — production semantics inherited',
    'breakeven-tilt':
      'derived series (T5YIFR − T5YIE inner join on common dates) — dense full-depth re-run; the 21st voter since the D-5 promotion (Session 6), level-leg only',
  };
  for (const id of VOTER_IDS) {
    const s = SERIES[id]!;
    const def = defById.get(id)!;
    let readableN = 0;
    let firingN = 0;
    let tailwindN = 0;
    let headwindN = 0;
    let firstFire: string | null = null;
    for (const w of windows) {
      const st = w.voterState.get(id)!;
      if (st.readable) readableN++;
      if (st.impact !== null) {
        firingN++;
        if (st.impact === 'tailwind') tailwindN++;
        else headwindN++;
        if (firstFire === null) firstFire = w.date;
      }
    }
    const note = gapNotes[id] ?? 'dense series — full-depth re-run';
    emit(
      `| \`${id}\` | ${def.cadence} | ${s[0]!.date} → ${s[s.length - 1]!.date} | ${s.length} | ${readableN} | ${firingN} | ${tailwindN} | ${headwindN} | ${firstFire ?? '—'} | ${note} |`,
    );
  }
}
emit();
{
  const avgFiring = windows.reduce((s, w) => s + w.scoreProd.firingVoters, 0) / windows.length;
  emit(
    `**The effective table:** cftc-gold-positioning never fires, us-japan-10y-gap never fires in this stored window (its monthly backfill left the stage — see the coverage note), and gold-silver fires only near its sparse observation dates — the re-run era's real voter pool averaged **${avgFiring.toFixed(1)} firing voters per window** (of 21). The stress lane therefore ran 4-voter and the dollar lane 2-voter. Every denominator is stated; nothing is silently interpolated.`,
  );
}
emit();

/* --- B1 summary --- */
emit('## B1 — the historical re-run (frozen clock)');
emit();
{
  const labelDist = new Map<string, number>();
  for (const w of windows) {
    const l = w.scoreProd.label ?? 'null';
    labelDist.set(l, (labelDist.get(l) ?? 0) + 1);
  }
  const avgFiring = windows.reduce((s, w) => s + w.scoreProd.firingVoters, 0) / windows.length;
  const avgNet = windows.reduce((s, w) => s + w.scoreProd.netScore, 0) / windows.length;
  const netMin = Math.min(...windows.map((w) => w.scoreProd.netScore));
  const netMax = Math.max(...windows.map((w) => w.scoreProd.netScore));
  emit(
    `Windows: **${windows.length}** (${gridDates[0]} → ${gridDates[gridDates.length - 1]}, every gold trading day). Label distribution: ${[...labelDist.entries()].map(([l, n]) => `${l} ×${n}`).join(', ')}.`,
  );
  emit(`Average firing voters ${avgFiring.toFixed(1)} · average netScore ${avgNet >= 0 ? '+' : ''}${avgNet.toFixed(2)} · netScore range ${netMin} to ${netMax}.`);
  emit();
  emit(
    `**The D-6 cross-fill, counted aloud:** ${crossFillTotal} fill day(s) applied across all ${windows.length} windows${crossFillCappedWindows > 0 ? `, ${crossFillCappedWindows} window(s) CAPPED (degraded — no fill applied)` : ''}. The stored series are dense (each healthy rung re-fetches the full decade window), so the historical re-run sees ~0 fills — the audit's healthy-day expectation (GOLD_FRED_GAPFILL_SPEC §5 G1a). The fill's production value is freshness-rescue on TRANSIENT degraded days, which a dense stored corpus cannot replay — stated, not hidden.`,
  );
  emit();
  emit('Month-end traces (the label + firing counts the frozen table produced):');
  emit();
  emit('| Window day | Label | Net | Firing (T/H) | Lane readings |');
  emit('|---|---|---|---|---|');
  for (const w of monthEndWindows(windows)) {
    const lanes = w.scoreProd.subGauges.map((g) => `${g.lane}:${g.reading}`).join(' · ');
    emit(`| ${w.date} | ${w.scoreProd.label ?? '—'} | ${w.scoreProd.netScore >= 0 ? '+' : ''}${w.scoreProd.netScore} | ${w.scoreProd.firingVoters} (${w.scoreProd.tailwindVoters}/${w.scoreProd.headwindVoters}) | ${lanes} |`);
  }
  emit();
}
emit();

/* --- B2 --- */
emit('## B2 — the realized-move join (5 / 20 / 60 trading days)');
emit();
const b2Stats: Record<number, { full: JoinResult; mature: JoinResult }> = {};
for (const horizon of GOLD_BACKTEST_HORIZONS) {
  const band = flatBandPct(horizon);
  const full = joinStats(windows, horizon, 'scoreProd');
  const mature = joinStats(windows.filter((w) => isMature(w.date)), horizon, 'scoreProd');
  b2Stats[horizon] = { full, mature };
  emit(`### Horizon ${horizon} trading days (flat band ±${band.toFixed(2)}%; ≈ ${((horizon * 7) / 5).toFixed(0)} calendar days)`);
  emit();
  emit(
    `Windows with a joinable forward return: **${full.nJoined}** of ${windows.length} (the last ${horizon} trading days have no forward observation — excluded, n stated). Mature-base subsample (≥ ${MATURE_FROM}): **${mature.nJoined}** windows.`,
  );
  emit();
  emit(
    `Sign-agreement (netScore sign vs forward-return sign, both readable — a model lean AND a move beyond the band): **${full.signAgree.agree}/${full.signAgree.n} = ${full.signAgree.n > 0 ? ((full.signAgree.agree / full.signAgree.n) * 100).toFixed(1) : '—'}%** (mature base: ${mature.signAgree.agree}/${mature.signAgree.n}${mature.signAgree.n > 0 ? ` = ${((mature.signAgree.agree / mature.signAgree.n) * 100).toFixed(1)}%` : ''}). A coin is 50%; the ALL-windows move split is up ${fmtPct(full.all.up / full.all.n)} · flat ${fmtPct(full.all.flat / full.all.n)} · down ${fmtPct(full.all.down / full.all.n)}.`,
  );
  emit();
  emit('Confusion table — all windows (n per cell; row share in brackets):');
  emit();
  confusionTable(full);
  emit();
  emit('Confusion table — mature-base windows (≥ 5 years of percentile base):');
  emit();
  confusionTable(mature);
  emit();
  emit('Label-conditional forward returns (the full 5-step vocabulary, every row kept):');
  emit();
  emit('| Label | n | mean | median |');
  emit('|---|---|---|---|');
  for (const row of labelConditional(windows, horizon, 'scoreProd')) {
    emit(`| ${row.label} | ${row.n} | ${fmtNum(row.mean)}% | ${fmtNum(row.median)}% |`);
  }
  emit();
}

/* --- Archive era --- */
emit('## B2 (archive era) — the live out-of-sample slice, tiny-n, stated as such');
emit();
emit(
  `The ${archiveDays.length} archived days re-scored from the readings the rungs actually stamped (the SPA's own re-derivation — the honest as-rung state, including the rung-time data lags the historical re-run cannot replay):`,
);
emit();
emit('| Archive day | netScore | label | 5td return | 5td bucket |');
emit('|---|---|---|---|---|');
{
  const band = flatBandPct(5);
  for (const day of archiveDays) {
    const s = archiveScore(day, 'scoreProd');
    const ret = archiveForwardReturn(day, 5);
    emit(
      `| ${day} | ${s.netScore >= 0 ? '+' : ''}${s.netScore} | ${s.label ?? '—'} | ${ret === undefined ? '— (past the series end)' : `${fmtNum(ret)}%`} | ${ret === undefined ? '—' : classifyReturn(ret, band)} |`,
    );
  }
  const joined = archiveDays
    .map((day) => ({ day, s: archiveScore(day, 'scoreProd'), ret: archiveForwardReturn(day, 5) }))
    .filter((x) => x.ret !== undefined);
  const testable = joined.filter((x) => signAgreement(x.s.netScore, x.ret!, band) !== undefined);
  const agree = testable.filter((x) => signAgreement(x.s.netScore, x.ret!, band) === true).length;
  emit();
  emit(
    `Joinable at 5td: **${joined.length}** of ${archiveDays.length} days (the last 5 trading days of the corpus have no forward observation). Sign-agreement: ${agree}/${testable.length}${testable.length > 0 ? ` = ${((agree / testable.length) * 100).toFixed(0)}%` : ''}. At 20td and 60td: **0 joinable days** (the archive era began ${archiveDays[0]} — no archive day has 20 trading days of forward gold inside a corpus ending ${GOLD[GOLD.length - 1]!.date}). **n is too small for any claim — this slice verifies the live path produces the same shape as the re-run, nothing more.**`,
  );
  const gsDays = archiveGoldSummaryDays;
  if (gsDays.length > 0) {
    // The stamped-vs-rederived no-drift contract, checked on EVERY archived
    // day that carries goldSummary: the 10-31 stamp came from the
    // PRE-promotion engine (the S6 deploy boundary is 2026-10-31 ~16:07 UTC —
    // the 04:10 rung stamped before it), every later stamp from the PROMOTED
    // engine. The check reports both re-derivations and which one the stamp
    // matches — drift would be a stamp matching NEITHER.
    emit();
    emit('The stamped-vs-rederived `goldSummary` no-drift contract, every stamped archive day:');
    emit();
    emit('| Archive day | stamped (netScore / label) | promoted re-derivation | S4-frozen re-derivation | reading |');
    emit('|---|---|---|---|---|');
    let drift = false;
    for (const gsDay of gsDays) {
      const stamped = corpus.archives[gsDay]!.goldSummary;
      const promoted = archiveScore(gsDay, 'scoreProd');
      const legacy = archiveScore(gsDay, 'scoreLegacy');
      const matchesPromoted = promoted.netScore === stamped.netScore && promoted.label === (stamped.label ?? null);
      const matchesLegacy = legacy.netScore === stamped.netScore && legacy.label === (stamped.label ?? null);
      const ok = matchesPromoted || matchesLegacy;
      if (!ok) drift = true;
      emit(
        `| ${gsDay} | ${stamped.netScore} / ${stamped.label} | ${promoted.netScore >= 0 ? '+' : ''}${promoted.netScore} / ${promoted.label} | ${legacy.netScore >= 0 ? '+' : ''}${legacy.netScore} / ${legacy.label} | ${
          ok
            ? matchesPromoted && matchesLegacy
              ? 'matches both (the tilt silent that day)'
              : matchesPromoted
                ? 'matches the promoted engine — no drift'
                : 'matches the S4-frozen engine (the pre-promotion stamp — the S6 deploy boundary)'
            : 'DIFFERS from BOTH — drift, investigate'
        } |`,
      );
    }
    emit();
    emit(
      drift
        ? '**The no-drift contract FAILED on at least one stamped day — escalation rule 4 fires: bring the measured rows to the owner; make NO code change.**'
        : `**The no-drift contract HOLDS on every stamped day** — the ${gsDays[0]} stamp is the pre-promotion engine's (the S6 deploy boundary, 2026-10-31 ~16:07 UTC) and every later stamp is the promoted engine's own re-derivation. The S1 contract (one pure function, ingest and SPA, no drift) is verified on the grown corpus.`,
    );
  }
}
emit();

/* --- B4: the promotion delta (Session 6) --- */
emit('## B4 — the promotion delta (the S4-frozen 20-voter baseline vs the promoted production 21)');
emit();
{
  const tiltFired = windows.filter((w) => w.voterState.get(TILT_ID)!.impact !== null);
  const tiltTail = windows.filter((w) => w.voterState.get(TILT_ID)!.impact === 'tailwind').length;
  const tiltHead = windows.filter((w) => w.voterState.get(TILT_ID)!.impact === 'headwind').length;
  const flips = windows.filter((w) => bucketModelLabel(w.scoreLegacy.label) !== bucketModelLabel(w.scoreProd.label));
  const netDeltas = new Map<number, number>();
  for (const w of windows) {
    const d = w.scoreProd.netScore - w.scoreLegacy.netScore;
    netDeltas.set(d, (netDeltas.get(d) ?? 0) + 1);
  }
  const labelDistLegacy = new Map<string, number>();
  for (const w of windows) {
    const l = w.scoreLegacy.label ?? 'null';
    labelDistLegacy.set(l, (labelDistLegacy.get(l) ?? 0) + 1);
  }
  emit(
    `The S4-frozen 20-voter baseline (\`HARNESS_GOLD_VOTERS_20\` — the pre-promotion production table, kept verbatim for lineage) over the same ${windows.length} windows:`,
  );
  emit();
  emit(`- Label distribution: ${[...labelDistLegacy.entries()].map(([l, n]) => `${l} ×${n}`).join(', ')}.`);
  emit(`- The promoted voter itself — \`breakeven-tilt\` (the shared evaluator, level-leg only, like every voter without a 30-day move threshold) — fired in **${tiltFired.length}** of ${windows.length} windows (${fmtPct(tiltFired.length / windows.length)}): tailwind ${tiltTail} · headwind ${tiltHead}.`);
  emit(`- Net-score delta (promoted − baseline): ${[...netDeltas.entries()].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d >= 0 ? '+' : ''}${d} ×${n}`).join(', ')}.`);
  emit(`- Label-bucket flips (tailwind/mixed/headwind changing side): **${flips.length}** windows (${fmtPct(flips.length / windows.length)}).`);
  emit();
  for (const horizon of GOLD_BACKTEST_HORIZONS) {
    const t20 = joinStats(windows, horizon, 'scoreLegacy');
    const t21 = joinStats(windows, horizon, 'scoreProd');
    emit(
      `- Horizon ${horizon}td: sign-agreement ${t21.signAgree.agree}/${t21.signAgree.n} = ${t21.signAgree.n > 0 ? ((t21.signAgree.agree / t21.signAgree.n) * 100).toFixed(1) : '—'}% (baseline: ${t20.signAgree.agree}/${t20.signAgree.n} = ${t20.signAgree.n > 0 ? ((t20.signAgree.agree / t20.signAgree.n) * 100).toFixed(1) : '—'}%) · tailwind mean return ${fmtNum(t21.rows.tailwind.mean)}% vs ${fmtNum(t20.rows.tailwind.mean)}% · headwind mean return ${fmtNum(t21.rows.headwind.mean)}% vs ${fmtNum(t20.rows.headwind.mean)}% (n: ${t21.rows.tailwind.n}/${t20.rows.tailwind.n} tailwind, ${t21.rows.headwind.n}/${t20.rows.headwind.n} headwind).`,
    );
  }
  emit();
  for (const horizon of GOLD_BACKTEST_HORIZONS) {
    const t20 = joinStats(windows, horizon, 'scoreLegacy');
    emit(`**${horizon}td, the S4-frozen baseline's confusion table (±${flatBandPct(horizon).toFixed(2)}% band) — the tables the S4 report carried as its primary:**`);
    emit();
    emit('| Model ↓ / Move → | up | flat | down | n |');
    emit('|---|---|---|---|---|');
    for (const bucket of ['tailwind', 'mixed', 'headwind'] as const) {
      const r = t20.rows[bucket];
      emit(`| **${bucket}** | ${r.up} | ${r.flat} | ${r.down} | ${r.n} |`);
    }
    emit();
  }
  emit(
    `**The honest delta:** the tilt fired in ${fmtPct(tiltFired.length / windows.length)} of windows (mostly headwind: ${tiltHead} of ${tiltFired.length} — the tilt sat at decade lows, i.e. fading, for most of the corpus) and moved the label bucket in ${fmtPct(flips.length / windows.length)}${flips.length === 0 ? ' — the label buckets NEVER flipped' : ''}. The measured associations barely moved: ` +
      GOLD_BACKTEST_HORIZONS.map((h) => {
        const t20 = joinStats(windows, h, 'scoreLegacy');
        const t21 = joinStats(windows, h, 'scoreProd');
        const d = t20.signAgree.n > 0 && t21.signAgree.n > 0 ? (t21.signAgree.agree / t21.signAgree.n - t20.signAgree.agree / t20.signAgree.n) * 100 : null;
        return `${h}td ${d === null ? '—' : `${d >= 0 ? '+' : ''}${d.toFixed(1)}pp`}`;
      }).join(' · ') +
      ` — ` +
      (() => {
        const deltas = GOLD_BACKTEST_HORIZONS.map((h) => {
          const t20 = joinStats(windows, h, 'scoreLegacy');
          const t21 = joinStats(windows, h, 'scoreProd');
          return t20.signAgree.n > 0 && t21.signAgree.n > 0
            ? Math.abs(t21.signAgree.agree / t21.signAgree.n - t20.signAgree.agree / t20.signAgree.n)
            : 0;
        });
        return Math.max(...deltas) < 0.02
          ? '**no material difference in the measured association** — the promoted table is not better or worse on this corpus, only noisier in its label vocabulary'
          : 'the sign-agreements moved by more than noise — read the per-horizon lines above';
      })() +
      `. The promotion is the owner's MADE call (D-5, decided-YES on this evidence in S4's B4); this section is its measured record — the delta, not a recommendation. The no-edge conclusion of the S4 report carries into the promoted primary tables above unchanged in substance.`,
  );
  emit();
  emit(
    `Archive era: the tilt's reading exists only from the ${archiveGoldSummaryDays[0] ?? '—'} archive (it shipped in S3) — earlier archives score the promoted table with the tilt SILENT (the reading is absent, readable() mutes it), so the two models agree there by construction; the one day that differs is stated in the archive table above, never averaged into significance.`,
  );
}
emit();

/* --- B3 honesty --- */
emit('## Honesty rules (B3) — the known gaps, stated');
emit();
emit(`1. **Every cell carries n.** All 9 confusion cells per horizon per table-set are reported (all-windows AND mature-base), plus the 6-row label-conditional tables and both models' sign-agreements — nothing picked.`);
emit(`2. **The corpus depth is ~10.1 years, not decades.** The stored histories begin ${SERIES[REAL_YIELD_ID]![0]!.date} (the FRED family's stage window). Windows before ~${MATURE_FROM} ride percentile bases shorter than 5 years — on a young base a value near the running max reads "high" more easily, which is exactly why the mature-base tables sit BESIDE the all-windows tables rather than replacing them.`);
emit(`3. **Three voters are structurally thin in the re-run era:** cftc-gold-positioning (1 stored point — never fires), us-japan-10y-gap (the monthly jgb backfill left the stored window between the S6 and this corpus — 21 points over 2026-10 only; 0 firing windows), gold-silver (monthly percentile history + the newest daily seeds). The stress lane therefore ran 4-voter and the dollar lane 2-voter — stated, not interpolated.`);
emit(`4. **The cross-fill cannot be replayed historically** (${crossFillTotal} fills across ${windows.length} windows): the stored series are the accumulated dense fetches; the fill earns its keep on TRANSIENT degraded days the stored corpus no longer shows. Its production effect is freshness, not a historical score change.`);
emit(`5. **The realized series is one venue, two provenances:** the backfill is the Yahoo GC=F ~10-year daily record; the tail points are the accumulated live-price seed appends (gold-api spot at append time). The join treats them identically; the mix is recorded here.`);
emit(`6. **Multiple testing:** 3 horizons × 3 buckets × 2 table-sets × 2 models + the archive slice is ~110 reported numbers; with these n's, ±2–3 percentage-point wobbles are noise. The conclusion below only claims what a stated-in-advance rule can see — the tables themselves make no claim.`);
emit(`7. **The archive era is plumbing, not power:** ${archiveDays.length} days, ${archiveDays.filter((d) => archiveForwardReturn(d, 5) !== undefined).length} joinable at 5td, 0 at 20td/60td. It verifies the live path's shape; it cannot verify an edge.`);
emit(`8. **The asOf-watch (S3's known gap):** days 2–3 OBSERVED at this re-check — lockstep (the offset stayed exactly 1 trading day at every post-S6 rung, both groups holding over the weekend and advancing +1 together at the 11-03 rung): **validated-by-watch — the honest wording, still not "proven"**. Carried to GOLD_RECHECK_SPEC §5 / GOLD_BACKTEST_SPEC §5.`);
emit();

/* --- Conclusion: MECHANICAL, stated in advance --- */
emit('## Conclusion — would this have been visible ex-ante?');
emit();
emit(
  'The rule was fixed before the run: a directional edge is claimed ONLY if, on the MATURE-BASE subsample, the sign-agreement at some horizon departs from 50% by more than 2 binomial standard errors (2 × √(0.25/n)) AND the tailwind-minus-headwind mean-return spread keeps its sign at all three horizons. Anything else reads as "no measurable edge at these horizons over this corpus" — the outcome the spec explicitly permits.',
);
emit();
{
  const mature = windows.filter((w) => isMature(w.date));
  const parts: string[] = [];
  let allDepartAbove = true;
  let allDepartBelow = true;
  for (const horizon of GOLD_BACKTEST_HORIZONS) {
    const m = joinStats(mature, horizon, 'scoreProd');
    const p = m.signAgree.n > 0 ? m.signAgree.agree / m.signAgree.n : null;
    const se = m.signAgree.n > 0 ? Math.sqrt(0.25 / m.signAgree.n) : null;
    const spread =
      m.rows.tailwind.mean !== null && m.rows.headwind.mean !== null ? m.rows.tailwind.mean - m.rows.headwind.mean : null;
    const departs = p !== null && se !== null && Math.abs(p - 0.5) > 2 * se;
    const direction = departs ? (p! > 0.5 ? 'DEPARTS ABOVE 50%' : 'DEPARTS BELOW 50%') : 'within the band';
    if (!departs || p! <= 0.5) allDepartAbove = false;
    if (!departs || p! >= 0.5) allDepartBelow = false;
    parts.push(
      `${horizon}td: sign-agreement ${m.signAgree.agree}/${m.signAgree.n} = ${p === null ? '—' : `${(p * 100).toFixed(1)}%`} (2-SE band around 50%: ±${se === null ? '—' : `${(2 * se * 100).toFixed(1)}%`} — ${direction}) · tailwind−headwind mean spread ${spread === null ? '—' : `${spread >= 0 ? '+' : ''}${spread.toFixed(2)}%`}`,
    );
  }
  emit(`The mature-base measurements (${MATURE_FROM} → ${gridDates[gridDates.length - 1]}):`);
  emit();
  for (const p of parts) emit(`- ${p}`);
  emit();
  const spreadsKeepSign = (() => {
    const signs: boolean[] = [];
    for (const horizon of GOLD_BACKTEST_HORIZONS) {
      const m = joinStats(mature, horizon, 'scoreProd');
      if (m.rows.tailwind.mean === null || m.rows.headwind.mean === null) return false;
      signs.push(m.rows.tailwind.mean - m.rows.headwind.mean > 0);
    }
    return signs.every((s) => s === signs[0]);
  })();
  if (allDepartAbove && spreadsKeepSign) {
    emit(
      `By the stated rule: the departures hold ABOVE 50% at every horizon and the tailwind-minus-headwind spread keeps its positive sign — the frozen table's net direction showed a measurable POSITIVE association with forward gold moves over this corpus. The association's SIZE is in the tables above; it is evidence about the PAST decade, not a promise.`,
    );
  } else if (allDepartBelow && spreadsKeepSign) {
    const m60 = joinStats(mature, 60, 'scoreProd');
    emit(
      `By the stated rule: **no edge in the table's own direction — the measurable association runs the OTHER way over this corpus.** Every horizon's sign-agreement departs BELOW 50% and the tailwind-minus-headwind mean spread is negative at every horizon: over ${MATURE_FROM} → ${gridDates[gridDates.length - 1]}, headwind labels preceded LARGER forward rises than tailwind labels did (the 60td spread is ${m60.rows.tailwind.mean !== null && m60.rows.headwind.mean !== null ? (m60.rows.tailwind.mean - m60.rows.headwind.mean).toFixed(2) : '—'}%: headwind windows rose ${fmtNum(m60.rows.headwind.mean)}% on average against tailwind's ${fmtNum(m60.rows.tailwind.mean)}%, mature base). This decade's gold advance ran THROUGH tight real rates and a strong dollar — the classical headwinds — so a conditions-reading table built on those relationships reads persistently against the move it lived through. The panel's caption ("conditions, not advice") is not just a disclaimer here; it is the operative description: the table reads the macro regime, and in this regime the regime's direction and gold's direction diverged.`,
    );
  } else {
    emit(
      `By the stated rule: **no measurable edge at these horizons over this corpus** — the sign-agreements sit within (or straddle) the 2-SE band and/or the mean spread flips sign across horizons. The frozen table remains what its caption says — a reading of conditions, not advice — and the promotion (D-5, made) is recorded by the delta section above, not by any backtest power.`,
    );
  }
  emit();
  emit(
    `The ex-ante test, answered honestly: the voter table and its thresholds were authored from classical driver relationships BEFORE this harness computed anything (S1, 2026-10-31; the single change since — the 21st seat — was the owner's scope call on S4's B4 delta, not a parameter this harness tuned, and its measured effect is the promotion-delta section above), so the numbers are what an observer with the same table and the same stored histories would have measured at each window — no fitted parameters, no selection. The honest caveat runs the other way: the FLAT BAND, the three horizons and the bucket folds were chosen by the harness author in this session; the stated-in-advance rule above is the guard against that freedom, and the mature-base/all-windows split is reported so the short-base effect is visible, not hidden.`,
  );
}
emit();

/* ------------------------------------------------------------------ *
 * The lane calibration report — docs/insights/BACKTEST-GOLD-LANES.md
 * (gold-balance-consolidation 02 §6, the P0 pre-registered run). A
 * SEPARATE output file: BACKTEST-GOLD.md above stays the frozen tables'
 * report, byte-identical to what the pre-calibration code produced on
 * this corpus.
 * ------------------------------------------------------------------ */

const LANE_LINES: string[] = [];
const lemit = (s = ''): void => {
  LANE_LINES.push(s);
};

/** The model-side bucket for a lane balance: tipped-for / level (incl. none) / tipped-against. */
const laneBucketOf = (b: HarnessLaneBalance): 'for' | 'level' | 'against' =>
  b.state === 'tipped-for' ? 'for' : b.state === 'tipped-against' ? 'against' : 'level';

/** The realized-move join for one lane rule (the lineage-only tables; NOT used for selection). */
function laneJoinStats(
  selected: readonly WindowResult[],
  key: 'laneMin2' | 'laneMin1',
  horizon: GoldBacktestHorizon,
): { rows: Record<'for' | 'level' | 'against', BucketStats>; all: BucketStats; signAgree: { n: number; agree: number }; nJoined: number } {
  const band = flatBandPct(horizon);
  const emptyRow = (): BucketStats => ({ n: 0, up: 0, flat: 0, down: 0, mean: null, median: null });
  const rows = { for: emptyRow(), level: emptyRow(), against: emptyRow() };
  const byBucketReturns: Record<'for' | 'level' | 'against', number[]> = { for: [], level: [], against: [] };
  const allReturns: number[] = [];
  let agreeN = 0;
  let agree = 0;
  for (const w of selected) {
    const ret = forwardTradingDayReturn(GOLD, w.goldIndex, horizon);
    if (ret === undefined) continue;
    allReturns.push(ret);
    const bucket = laneBucketOf(w[key]);
    const move = classifyReturn(ret, band);
    rows[bucket].n++;
    rows[bucket][move]++;
    byBucketReturns[bucket].push(ret);
    const a = signAgreement(w[key].net, ret, band);
    if (a !== undefined) {
      agreeN++;
      if (a) agree++;
    }
  }
  for (const key2 of ['for', 'level', 'against'] as const) {
    const rets = byBucketReturns[key2];
    rows[key2].mean = rets.length > 0 ? rets.reduce((s, v) => s + v, 0) / rets.length : null;
    rows[key2].median = median(rets);
  }
  const all: BucketStats = {
    n: allReturns.length,
    up: allReturns.filter((r) => classifyReturn(r, band) === 'up').length,
    flat: allReturns.filter((r) => classifyReturn(r, band) === 'flat').length,
    down: allReturns.filter((r) => classifyReturn(r, band) === 'down').length,
    mean: allReturns.length > 0 ? allReturns.reduce((s, v) => s + v, 0) / allReturns.length : null,
    median: median(allReturns),
  };
  return { rows, all, signAgree: { n: agreeN, agree }, nJoined: allReturns.length };
}

const laneStats = {
  min2All: laneCalibrationStats(
    windows.map((w) => w.laneMin2),
    windows.map((w) => w.scoreProd.netScore),
  ),
  min2Mature: laneCalibrationStats(
    windows.filter((w) => isMature(w.date)).map((w) => w.laneMin2),
    windows.filter((w) => isMature(w.date)).map((w) => w.scoreProd.netScore),
  ),
  min1All: laneCalibrationStats(
    windows.map((w) => w.laneMin1),
    windows.map((w) => w.scoreProd.netScore),
  ),
  min1Mature: laneCalibrationStats(
    windows.filter((w) => isMature(w.date)).map((w) => w.laneMin1),
    windows.filter((w) => isMature(w.date)).map((w) => w.scoreProd.netScore),
  ),
};

lemit('# Gold lane calibration — the P0 pre-registered run (gold-balance consolidation, 02 §6)');
lemit();
lemit(
  `Generated from the recorded KV corpus (\`packages/insights/fixtures/gold-backtest-corpus.json\`, recorded ${corpus.recordedAt} — the same corpus, the same ${windows.length} windows (${gridDates[0]} → ${gridDates[gridDates.length - 1]}), the same frozen clock and the same no-lookahead truncation as BACKTEST-GOLD.md; the mature base is the same ≥ ${MATURE_FROM} split). The lane engine evaluated here is the harness-local \`laneBalanceOverVoters\` — 02 §3's algorithm over the SAME frozen 21-voter production table (\`GOLD_LANE_VOTERS\`) and the SAME shared evaluator (\`evalLeg\`); the production engine (\`gold-balance.ts\`, rollout phase P1) will import the same sources. The frozen tables and their report are untouched: this file ADDS the two lane rules beside them.`,
);
lemit();
lemit('**The purpose, restated:** choose `GOLD_LANE_MIN_FIRING` (2 default, 1 fallback) on stated legibility criteria, NEVER on forward returns. NO FORECASTING EDGE IS CLAIMED OR IMPLIED for either rule or for the consolidated balance: the gold backtest\'s own measured record over this corpus (BACKTEST-GOLD.md: mature-base sign-agreements 46.8 / 42.2 / 32.7% at 5/20/60td, all departing below the coin) stands unchanged; the balance reads conditions today, not direction. The confusion tables at the end are LINEAGE ONLY — labelled "not used for selection" — exactly as 02 §6 pre-registered.');
lemit();
lemit('## The two rules under test');
lemit();
lemit('- **MIN2** (D-GB-3, the default): a lane votes only when at least 2 of its voters fire, then by strict majority of the firing voters; a tie reads split and sits in the neutral tray. One firing voter never moves a lane.');
lemit('- **MIN1** (the pre-registered fallback): a lane votes by majority of its firing voters with no crowd minimum — a single firing voter can tip the whole lane.');
lemit();
lemit('Both rules share everything else: the 21 voters, their lanes and polarities (the frozen production table), the evaluator, the beam-angle formula (D-GB-8, unchanged: |net| / (for + against) × 10 degrees, clamped to [3, 10], level at net = 0), the verdict words. The ONLY difference is the crowd minimum.');
lemit();
lemit('## The pre-registered criteria (fixed before the run)');
lemit();
lemit('- **C1 — not degenerate:** the balance is level in at most 70% of all windows AND fully tipped (10 degrees, one-sided) in at most 60% of all windows.');
lemit('- **C2 — smoother than the old count:** the median verdict flips per 60 trading days is not higher than the same figure for the 21-voter net sign.');
lemit('- **Decision rule:** use MIN2 if C1 and C2 hold; else use MIN1 if C1 and C2 hold; if neither passes, STOP and bring the numbers to the owner — do not ship.');
lemit();
lemit('Definitions used (stated so every cell is checkable): "level" = net 0 across the 4 lane votes (the all-unread `none` state is counted within level and ALSO reported separately — it never occurred beyond 0 windows in this corpus); "fully tipped" = |net| = for + against (the one-sided 10-degree tip); "verdict flip" = a day-to-day change of the balance state (tipped-for / level / tipped-against / none); "flips per 60 trading days" = the MEDIAN, over every window of 60 consecutive trading days, of the flip count inside that window; the beam-angle bands are 0 (level), (0, 6] and (6, 10] degrees.');
lemit();

/** One rule's section: the distribution tables for one window set. */
function emitLaneSection(ruleName: 'MIN2' | 'MIN1', scopeName: string, s: typeof laneStats.min2All): void {
  lemit(`### ${ruleName} — ${scopeName} (n = ${s.n})`);
  lemit();
  lemit('| Balance state | n | share |');
  lemit('|---|---|---|');
  lemit(`| tipped for gold | ${s.tippedFor} | ${fmtPct(s.tippedFor / s.n)} |`);
  lemit(`| level | ${s.level} | ${fmtPct(s.level / s.n)} |`);
  lemit(`| tipped against gold | ${s.tippedAgainst} | ${fmtPct(s.tippedAgainst / s.n)} |`);
  lemit(`| all four lanes unread (none) | ${s.none} | ${fmtPct(s.none / s.n)} |`);
  lemit();
  lemit('| Beam-angle band | n | share |');
  lemit('|---|---|---|');
  lemit(`| 0° (level) | ${s.beam.level} | ${fmtPct(s.beam.level / s.n)} |`);
  lemit(`| 3°–6° | ${s.beam.mid} | ${fmtPct(s.beam.mid / s.n)} |`);
  lemit(`| 6°–10° | ${s.beam.full} | ${fmtPct(s.beam.full / s.n)} |`);
  lemit(`| — of which fully tipped (10°, one-sided) | ${s.fullyTipped} | ${fmtPct(s.fullyTipped / s.n)} |`);
  lemit();
  lemit('| Lane | unread n | unread share | split n | split share |');
  lemit('|---|---|---|---|---|');
  for (const lane of ['borrowing-costs', 'dollar', 'stress', 'inflation'] as const) {
    lemit(
      `| ${lane} | ${s.laneUnread[lane]} | ${fmtPct(s.laneUnread[lane] / s.n)} | ${s.laneSplit[lane]} | ${fmtPct(s.laneSplit[lane] / s.n)} |`,
    );
  }
  lemit();
  lemit(
    `Stability: median verdict flips per 60 trading days **${s.flipsMedianPer60 === null ? '— (n too small)' : s.flipsMedianPer60}**, beside the 21-voter net-sign figure **${s.netSignFlipsMedianPer60 === null ? '—' : s.netSignFlipsMedianPer60}** over the same windows (C2's comparison; "not higher than" passes).`,
  );
  lemit();
}

emitLaneSection('MIN2', 'all windows', laneStats.min2All);
emitLaneSection('MIN2', `mature base (≥ ${MATURE_FROM})`, laneStats.min2Mature);
emitLaneSection('MIN1', 'all windows', laneStats.min1All);
emitLaneSection('MIN1', `mature base (≥ ${MATURE_FROM})`, laneStats.min1Mature);

lemit('## The C1 / C2 verdicts (mechanical, computed from the tables above)');
lemit();
lemit('| Rule | Scope | n | level share (≤ 70%) | full-tip share (≤ 60%) | C1 | lane flips / 60td | net-sign flips / 60td | C2 |');
lemit('|---|---|---|---|---|---|---|---|---|');
for (const [ruleName, scopeName, s] of [
  ['MIN2', 'all windows', laneStats.min2All],
  ['MIN2', 'mature base', laneStats.min2Mature],
  ['MIN1', 'all windows', laneStats.min1All],
  ['MIN1', 'mature base', laneStats.min1Mature],
] as const) {
  lemit(
    `| ${ruleName} | ${scopeName} | ${s.n} | ${fmtPct(s.level / s.n)} | ${fmtPct(s.fullyTipped / s.n)} | ${s.c1 ? 'PASS' : 'FAIL'} | ${s.flipsMedianPer60 === null ? '—' : s.flipsMedianPer60} | ${s.netSignFlipsMedianPer60 === null ? '—' : s.netSignFlipsMedianPer60} | ${s.c2 ? 'PASS' : 'FAIL'} |`,
  );
}
lemit();
{
  const min2 = laneStats.min2All;
  const min1 = laneStats.min1All;
  let decision: string;
  if (min2.c1 && min2.c2) {
    decision =
      '**DECISION: use MIN2 (`GOLD_LANE_MIN_FIRING = 2`, D-GB-3\'s default).** Both C1 and C2 hold over all windows — the pre-registered rule selects the default, no fallback needed.';
  } else if (min1.c1 && min1.c2) {
    decision =
      '**DECISION: use MIN1 (`GOLD_LANE_MIN_FIRING = 1`, the pre-registered fallback).** MIN2 failed a criterion over all windows; MIN1 satisfies both C1 and C2, so the fallback rule is selected exactly as 02 §6 pre-registered.';
  } else {
    decision =
      '**DECISION: STOP — NEITHER rule passes.** MIN2 and MIN1 each fail C1 and/or C2 over all windows. Per 02 §6: stop after committing this report, bring the numbers to the owner, and do not proceed to any UI work.';
  }
  if (min2.c1 && min2.c2) {
    const matureChosen = laneStats.min2Mature;
    decision += ` The mature base ${matureChosen.c1 && matureChosen.c2 ? 'AGREES (C1 and C2 both hold there too — see the table)' : `does NOT fully agree (C1 ${matureChosen.c1 ? 'holds' : 'fails'} · C2 ${matureChosen.c2 ? 'holds' : 'fails'} there) — stated, not hidden; the pre-registered criteria apply to ALL windows, and the mature-base row is context`}.`;
  }
  lemit(decision);
  lemit();
  lemit(
    'The selection used ONLY the legibility criteria above. Whatever the realised-move tables below show, they did not enter this decision — that is the point of the pre-registration.',
  );
}
lemit();
lemit('## Lineage only — realised-move confusion tables (NOT USED FOR SELECTION)');
lemit();
lemit(
  'These mirror BACKTEST-GOLD.md\'s B2 tables with the lane balance\'s state as the model side (tipped-for / level / tipped-against; the flat band is the same scaled ±2%/30d bar). They are recorded for lineage — the consolidated balance\'s measured association over the corpus — and are explicitly NOT used for the rule selection above. **No forecasting edge is claimed for the lane balance in either direction.**',
);
lemit();
for (const [ruleName, key] of [
  ['MIN2', 'laneMin2'],
  ['MIN1', 'laneMin1'],
] as const) {
  for (const horizon of GOLD_BACKTEST_HORIZONS) {
    const band = flatBandPct(horizon);
    const full = laneJoinStats(windows, key, horizon);
    const mature = laneJoinStats(
      windows.filter((w) => isMature(w.date)),
      key,
      horizon,
    );
    lemit(`### ${ruleName}, horizon ${horizon}td (flat band ±${band.toFixed(2)}%)`);
    lemit();
    lemit(
      `Joinable windows: **${full.nJoined}** of ${windows.length} (mature base: ${mature.nJoined}). Sign-agreement (lane net sign vs forward-return sign, both readable): ${full.signAgree.agree}/${full.signAgree.n}${full.signAgree.n > 0 ? ` = ${((full.signAgree.agree / full.signAgree.n) * 100).toFixed(1)}%` : ''} (mature base: ${mature.signAgree.agree}/${mature.signAgree.n}${mature.signAgree.n > 0 ? ` = ${((mature.signAgree.agree / mature.signAgree.n) * 100).toFixed(1)}%` : ''}).`,
    );
    lemit();
    for (const [scopeName, t] of [
      ['all windows', full],
      ['mature base', mature],
    ] as const) {
      lemit(`Confusion table — ${scopeName} (n per cell; row share in brackets):`);
      lemit();
      lemit('| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |');
      lemit('|---|---|---|---|---|---|---|');
      for (const bucket of ['for', 'level', 'against'] as const) {
        const r = t.rows[bucket];
        const c = (x: number): string => (r.n > 0 ? `${x} [${fmtPct(x / r.n, 0)}]` : '0');
        lemit(`| **${bucket}** | ${c(r.up)} | ${c(r.flat)} | ${c(r.down)} | ${r.n} | ${fmtNum(r.mean)}% | ${fmtNum(r.median)}% |`);
      }
      lemit(`| *all windows* | ${t.all.up} | ${t.all.flat} | ${t.all.down} | ${t.all.n} | ${fmtNum(t.all.mean)}% | ${fmtNum(t.all.median)}% |`);
      lemit();
    }
  }
}
lemit('## Honesty notes');
lemit();
{
  const s2 = laneStats.min2All;
  const s1 = laneStats.min1All;
  const thinLanes = (['borrowing-costs', 'dollar', 'stress', 'inflation'] as const).filter(
    (lane) => s1.laneUnread[lane] / s1.n > 0.5 || s2.laneUnread[lane] / s2.n > 0.5,
  );
  lemit(
    `1. **Thin lanes, stated (never interpolated):** ${
      thinLanes.length === 0
        ? `no lane is unread in most windows under either rule (the per-lane tables above carry the measured shares; the stress lane's sparse voters — gold-silver monthly, cftc 1 point — sit beside two dense weekly/daily voters, so the lane itself stays readable; the dollar lane ran 2-voter after us-japan-10y-gap's backfill left the stored window).`
        : `the following lanes are unread in MOST windows (see the per-lane tables): ${thinLanes.join(', ')} — said plainly, not interpolated: their lane vote is absent those windows and the balance runs on the lanes that ARE readable.`
    }`,
  );
  lemit(
    `2. **The corpus is the 2026-11-03 re-check refresh** (19 archive days; the rolling ~10-year history window trimmed the head and dropped the 2026-10-31 Saturday seed point — windows 2,514 → ${windows.length}, recorded in BACKTEST-GOLD.md). The us-japan-10y-gap monthly backfill left the stored stage window, so the dollar lane effectively ran 2-voter and us-japan-10y-gap fired in 0 windows.`,
  );
  lemit(
    '3. **No forecasting edge is claimed** — for either rule, for the consolidated balance, or for the frozen tables. The measured record over this corpus (BACKTEST-GOLD.md, mature base: sign-agreements 46.8 / 42.2 / 32.7% at 5/20/60td, all departing below the coin; headwind windows rose MORE than tailwind windows at 20td/60td) is the standing reality the round-55 honest note describes: the gold panel reads conditions, not direction.',
  );
  lemit(
    '4. **Every cell carries n.** The beam-angle band edges, the flip window and the two criteria were fixed before the run (02 §6 + this file\'s definitions paragraph); the decision above is mechanical, computed from the tables, and would fall the same way for any observer with the same corpus.',
  );
}
lemit();

writeFileSync(LANES_OUT_PATH, `${LANE_LINES.join('\n')}\n`, 'utf-8');
console.log(`Wrote ${LANES_OUT_PATH} (${LANE_LINES.length} lines)`);

writeFileSync(OUT_PATH, `${LINES.join('\n')}\n`, 'utf-8');
console.log(`Wrote ${OUT_PATH} (${LINES.length} lines)`);
console.log(`Windows: ${windows.length} · cross-fill days: ${crossFillTotal} · tilt fired: ${windows.filter((w) => w.voterState.get(TILT_ID)!.impact !== null).length}`);
for (const horizon of GOLD_BACKTEST_HORIZONS) {
  const t = joinStats(windows, horizon, 'scoreProd');
  const t20 = joinStats(windows, horizon, 'scoreLegacy');
  console.log(
    `  ${horizon}td: sign-agree ${t.signAgree.agree}/${t.signAgree.n} (${t.signAgree.n > 0 ? ((t.signAgree.agree / t.signAgree.n) * 100).toFixed(1) : '—'}%) · tailwind mean ${fmtNum(t.rows.tailwind.mean)}% (n=${t.rows.tailwind.n}) · headwind mean ${fmtNum(t.rows.headwind.mean)}% (n=${t.rows.headwind.n}) · all mean ${fmtNum(t.all.mean)}% · S4-frozen baseline sign-agree ${t20.signAgree.agree}/${t20.signAgree.n}`,
  );
}
console.log(
  `Lane calibration: MIN2 C1=${laneStats.min2All.c1 ? 'PASS' : 'FAIL'} C2=${laneStats.min2All.c2 ? 'PASS' : 'FAIL'} (level ${laneStats.min2All.level}/${laneStats.min2All.n}, fulltip ${laneStats.min2All.fullyTipped}/${laneStats.min2All.n}, flips ${laneStats.min2All.flipsMedianPer60} vs net-sign ${laneStats.min2All.netSignFlipsMedianPer60}) · MIN1 C1=${laneStats.min1All.c1 ? 'PASS' : 'FAIL'} C2=${laneStats.min1All.c2 ? 'PASS' : 'FAIL'} (level ${laneStats.min1All.level}/${laneStats.min1All.n}, fulltip ${laneStats.min1All.fullyTipped}/${laneStats.min1All.n}, flips ${laneStats.min1All.flipsMedianPer60} vs net-sign ${laneStats.min1All.netSignFlipsMedianPer60})`,
);
