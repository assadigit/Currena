/**
 * Gold Program S4 — the backtest harness (GOLD_BACKTEST_SPEC.md §3).
 *
 * Re-runs the FROZEN 20-voter gold table (B1) over the recorded KV corpus
 * at a frozen clock, joins realized forward gold returns (B2), and
 * evaluates the tilt-augmented 21-voter variant (B4 — the D-5 evidence)
 * through a HARNESS-LOCAL copy of the table. Writes
 * docs/insights/BACKTEST-GOLD.md in BACKTEST.md's format.
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
 * the report. Manual script (the backtest.ts pattern), never part of the
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
  HARNESS_GOLD_VOTERS_21,
  bucketModelLabel,
  classifyReturn,
  flatBandPct,
  forwardTradingDayReturn,
  scoreOverVoters,
  seriesUpTo,
  signAgreement,
  type GoldBacktestHorizon,
} from '../src/gold-backtest-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = join(HERE, '..', 'fixtures', 'gold-backtest-corpus.json');
const OUT_PATH = join(HERE, '..', '..', '..', 'docs', 'insights', 'BACKTEST-GOLD.md');

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
const VOTER_IDS = GOLD_LANE_VOTERS.map((v) => v.id as string);
const TILT_ID = 'breakeven-tilt';
const REAL_YIELD_ID = 'real-yield-10y';
/** The D-6 cross-fill legs (derived.ts passthroughs: us10y = DGS10, breakeven-10y = T10YIE). */
const FILL_LEGS = { nominal: 'us10y', breakeven: 'breakeven-10y' } as const;

const missing = [...VOTER_IDS, TILT_ID].filter((id) => SERIES[id] === undefined);
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
  score20: ReturnType<typeof scoreOverVoters>;
  score21: ReturnType<typeof scoreOverVoters>;
  voterState: Map<string, VoterState>;
  tiltState: VoterState;
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

const tiltDefEntry = HARNESS_GOLD_VOTERS_21[HARNESS_GOLD_VOTERS_21.length - 1]!;

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

  // B4's 21st voter (evaluated exactly as production would: the shared
  // evaluator, level-leg only, like every voter without a move threshold).
  const tiltDef = defById.get(TILT_ID)!;
  const tiltReading = computeReading(tiltDef, seriesUpTo(SERIES[TILT_ID]!, day), now, { name: 'stored history (stage blob)' });
  const tiltState = voterStateOf(tiltReading, tiltDefEntry);

  windows.push({
    date: day,
    goldIndex: goldIndexOf.get(day)!,
    score20: scoreOverVoters(readings, GOLD_LANE_VOTERS),
    score21: scoreOverVoters([...readings, tiltReading], HARNESS_GOLD_VOTERS_21),
    voterState,
    tiltState,
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
  model: 'score20' | 'score21',
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
function labelConditional(selected: readonly WindowResult[], horizon: GoldBacktestHorizon, model: 'score20' | 'score21') {
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

function archiveScore(day: string, model: 'score20' | 'score21'): { netScore: number; label: string | null } {
  const a = corpus.archives[day]!;
  const ids = model === 'score20' ? VOTER_IDS : [...VOTER_IDS, TILT_ID];
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
  const score = scoreOverVoters(readings, model === 'score20' ? GOLD_LANE_VOTERS : HARNESS_GOLD_VOTERS_21);
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

emit('# Gold-score backtest — Session 4');
emit();
emit(
  `Generated from the recorded KV corpus (\`packages/insights/fixtures/gold-backtest-corpus.json\`, recorded ${corpus.recordedAt} read-only via \`pnpm --filter @currena/insights gold-corpus-dump\`; the stage blob it froze was written ${corpus.venues.stage.writtenAt}). No live sites are touched; the harness reads recorded data only, at a frozen clock (no wall-clock reads anywhere). The voter table, thresholds and labels are the frozen S1–S3 production values — NOTHING here changes them. This report is the D-5 evidence the owner reads; every cell carries its n.`,
);
emit();
emit('## Method');
emit();
emit('- Engine: the FROZEN 20-voter table (`gold-score.ts` `GOLD_LANE_VOTERS`) evaluated through the shared signals evaluator (`connections.ts` `evalLeg` — a 30-day direction beyond the per-leg minimum move, else the decade-extreme level), the same `computeReading` percentile/change/stale math the ingest runs, and `scoreOverVoters` — a harness-local parameterized copy of the score arithmetic **pinned equal to the production engine by test** (`gold-backtest-core.test.ts`).');
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
emit('- Live API `https://currena.ir/api/insights` (checked at session start, 2026-10-31 ~12:15 UTC): `goldSummary` PRESENT (netScore −2, label `headwind`, the 04:20 rung) and `breakeven-tilt` present among the 102 readings — the S2.1+S3 state stands.');
emit(
  `- Read-only KV: **${archiveDays.length} full archive days** (\`insights:archive:v1:*\`, ${archiveDays[0]} → ${archiveDays[archiveDays.length - 1]}; 2026-10-20 absent — a rung outage day, the only gap). The newest (${archiveDays[archiveDays.length - 1]}) carries \`goldSummary\` (present on: ${archiveGoldSummaryDays.join(', ')} — the field shipped with S2.1/S3 and the 10-31 rung was the first to stamp it).`,
);
emit(`- The stored-history span: the daily FRED family's stage series start ${SERIES[REAL_YIELD_ID]![0]!.date} — the harness's depth is ~10.1 years, exactly the depth production's percentile window sees.`);
emit(`- Venue note: the stage blob's gold-usd copy carries ${SERIES['gold-usd']!.length} points; the realized-move series (\`insights:hist:gold-usd\`, the spec's venue) carries ${GOLD.length} — 2 points fewer at the head (${GOLD[0]!.date} vs ${SERIES['gold-usd']![0]!.date}); both end ${GOLD[GOLD.length - 1]!.date}. The join uses the hist key; the difference is recorded, not silently reconciled.`);
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
  const newest = archiveDays[archiveDays.length - 1]!;
  const prev = archiveDays[archiveDays.length - 2]!;
  const newestArch = corpus.archives[newest]!;
  const prevArch = corpus.archives[prev]!;
  const trioNewest = newestArch.readings.find((r) => r.id === 'us10y')?.asOf ?? '—';
  const trioPrev = prevArch.readings.find((r) => r.id === 'us10y')?.asOf ?? '—';
  const decadeNewest = newestArch.readings.find((r) => r.id === 'breakeven-5y5y')?.asOf ?? '—';
  const decadePrev = prevArch.readings.find((r) => r.id === 'breakeven-5y5y')?.asOf ?? '—';
  emit(
    `**Verdict:** day 1 (the ${newest} archive — the first S3 rung) shows the trio and the decade group advancing in lockstep, both +1 trading day at the same rung (trio ${trioPrev} → ${trioNewest}, decade group ${decadePrev} → ${decadeNewest}; values moved too: us10y ${prevArch.readings.find((r) => r.id === 'us10y')?.value} → ${newestArch.readings.find((r) => r.id === 'us10y')?.value}). Days 2–3 are NOT YET OBSERVABLE: the corpus ends ${newest} at the S4 run time (2026-10-31 ~12:20 UTC — the 11-01/11-02 rungs have not fired). The watch stays open; nothing here claims it proven.`,
  );
}
emit();

/* --- Coverage --- */
emit('## Coverage — the 20 voters over the stored histories (+ the tilt under evaluation)');
emit();
emit('| Voter | Cadence | Span | Obs | Readable windows | Firing windows | Tailwind | Headwind | First firing | Gap notes |');
emit('|---|---|---|---|---|---|---|---|---|---|');
{
  const gapNotes: Record<string, string> = {
    'cftc-gold-positioning':
      'stored history = 1 point (2026-10-27 — the CFTC series only began accumulating): never fires in the re-run era; the stress lane effectively ran 4-voter',
    'us-japan-10y-gap':
      'jgb-10y was monthly until the 2026-10-26 MOF daily upgrade — 97 sparse points; a daily-cadence reading over a monthly-density series is stale most windows (fires only near each observation)',
    'gold-silver':
      'percentile history is the World Bank monthly backfill; daily seed points only since 2026-10-08 — a daily-cadence reading over a monthly-density series is stale most windows',
    'ecb-dfr': 'forward-filled daily series (per-decision levels) — the percentile base weights long-held rates by calendar days; production semantics inherited',
    'fed-target': 'forward-filled daily series (per-decision levels) — production semantics inherited',
  };
  for (const id of [...VOTER_IDS, TILT_ID]) {
    const s = SERIES[id]!;
    const def = defById.get(id)!;
    const isVoter = VOTER_IDS.includes(id);
    let readableN = 0;
    let firingN = 0;
    let tailwindN = 0;
    let headwindN = 0;
    let firstFire: string | null = null;
    for (const w of windows) {
      const st = isVoter ? w.voterState.get(id)! : w.tiltState;
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
      `| \`${id}\`${isVoter ? '' : ' (B4)'} | ${def.cadence} | ${s[0]!.date} → ${s[s.length - 1]!.date} | ${s.length} | ${readableN} | ${firingN} | ${tailwindN} | ${headwindN} | ${firstFire ?? '—'} | ${note} |`,
    );
  }
}
emit();
{
  const avgFiring = windows.reduce((s, w) => s + w.score20.firingVoters, 0) / windows.length;
  emit(
    `**The effective table:** cftc-gold-positioning never fires, and us-japan-10y-gap / gold-silver fire only near their sparse observation dates — the re-run era's real voter pool averaged **${avgFiring.toFixed(1)} firing voters per window** (of 20). Every denominator is stated; nothing is silently interpolated.`,
  );
}
emit();

/* --- B1 summary --- */
emit('## B1 — the historical re-run (frozen clock)');
emit();
{
  const labelDist = new Map<string, number>();
  for (const w of windows) {
    const l = w.score20.label ?? 'null';
    labelDist.set(l, (labelDist.get(l) ?? 0) + 1);
  }
  const avgFiring = windows.reduce((s, w) => s + w.score20.firingVoters, 0) / windows.length;
  const avgNet = windows.reduce((s, w) => s + w.score20.netScore, 0) / windows.length;
  const netMin = Math.min(...windows.map((w) => w.score20.netScore));
  const netMax = Math.max(...windows.map((w) => w.score20.netScore));
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
    const lanes = w.score20.subGauges.map((g) => `${g.lane}:${g.reading}`).join(' · ');
    emit(`| ${w.date} | ${w.score20.label ?? '—'} | ${w.score20.netScore >= 0 ? '+' : ''}${w.score20.netScore} | ${w.score20.firingVoters} (${w.score20.tailwindVoters}/${w.score20.headwindVoters}) | ${lanes} |`);
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
  const full = joinStats(windows, horizon, 'score20');
  const mature = joinStats(windows.filter((w) => isMature(w.date)), horizon, 'score20');
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
  for (const row of labelConditional(windows, horizon, 'score20')) {
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
    const s = archiveScore(day, 'score20');
    const ret = archiveForwardReturn(day, 5);
    emit(
      `| ${day} | ${s.netScore >= 0 ? '+' : ''}${s.netScore} | ${s.label ?? '—'} | ${ret === undefined ? '— (past the series end)' : `${fmtNum(ret)}%`} | ${ret === undefined ? '—' : classifyReturn(ret, band)} |`,
    );
  }
  const joined = archiveDays
    .map((day) => ({ day, s: archiveScore(day, 'score20'), ret: archiveForwardReturn(day, 5) }))
    .filter((x) => x.ret !== undefined);
  const testable = joined.filter((x) => signAgreement(x.s.netScore, x.ret!, band) !== undefined);
  const agree = testable.filter((x) => signAgreement(x.s.netScore, x.ret!, band) === true).length;
  emit();
  emit(
    `Joinable at 5td: **${joined.length}** of ${archiveDays.length} days (the last 5 trading days of the corpus have no forward observation). Sign-agreement: ${agree}/${testable.length}${testable.length > 0 ? ` = ${((agree / testable.length) * 100).toFixed(0)}%` : ''}. At 20td and 60td: **0 joinable days** (the archive era began ${archiveDays[0]} — no archive day has 20 trading days of forward gold inside a corpus ending ${GOLD[GOLD.length - 1]!.date}). **n is too small for any claim — this slice verifies the live path produces the same shape as the re-run, nothing more.**`,
  );
  const gsDay = archiveGoldSummaryDays[0];
  if (gsDay !== undefined) {
    const rederived = archiveScore(gsDay, 'score20');
    const stamped = corpus.archives[gsDay]!.goldSummary;
    emit();
    emit(
      `\`goldSummary\` as the rungs stamped it (the wire field) exists on ${gsDay} — netScore ${stamped.netScore}, label ${stamped.label}; the re-derivation above produces netScore ${rederived.netScore}, label ${rederived.label}. The two agree${rederived.netScore === stamped.netScore ? '' : ' — DIFFERS, investigate'}, as the S1 contract (one pure function, ingest and SPA, no drift) requires.`,
    );
  }
}
emit();

/* --- B4 --- */
emit('## B4 — the tilt-augmented 21-voter variant (the D-5 evidence)');
emit();
{
  const tiltFired = windows.filter((w) => w.tiltState.impact !== null);
  const tiltTail = windows.filter((w) => w.tiltState.impact === 'tailwind').length;
  const tiltHead = windows.filter((w) => w.tiltState.impact === 'headwind').length;
  const flips = windows.filter((w) => bucketModelLabel(w.score20.label) !== bucketModelLabel(w.score21.label));
  const netDeltas = new Map<number, number>();
  for (const w of windows) {
    const d = w.score21.netScore - w.score20.netScore;
    netDeltas.set(d, (netDeltas.get(d) ?? 0) + 1);
  }
  const labelDist21 = new Map<string, number>();
  for (const w of windows) {
    const l = w.score21.label ?? 'null';
    labelDist21.set(l, (labelDist21.get(l) ?? 0) + 1);
  }
  emit(
    `The 21-voter table (\`HARNESS_GOLD_VOTERS_21\` — the frozen 20 + \`breakeven-tilt\` in the inflation lane, polarity +1, evaluated by the SAME shared evaluator: level-leg only, like every voter without a 30-day move threshold) over the same ${windows.length} windows:`,
  );
  emit();
  emit(`- The tilt voter fired in **${tiltFired.length}** of ${windows.length} windows (${fmtPct(tiltFired.length / windows.length)}): tailwind ${tiltTail} · headwind ${tiltHead}.`);
  emit(`- Label distribution: ${[...labelDist21.entries()].map(([l, n]) => `${l} ×${n}`).join(', ')}.`);
  emit(`- Net-score delta (21-voter − 20-voter): ${[...netDeltas.entries()].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d >= 0 ? '+' : ''}${d} ×${n}`).join(', ')}.`);
  emit(`- Label-bucket flips (tailwind/mixed/headwind changing side): **${flips.length}** windows (${fmtPct(flips.length / windows.length)}).`);
  emit();
  for (const horizon of GOLD_BACKTEST_HORIZONS) {
    const t20 = b2Stats[horizon]!.full;
    const t21 = joinStats(windows, horizon, 'score21');
    emit(
      `- Horizon ${horizon}td: sign-agreement ${t21.signAgree.agree}/${t21.signAgree.n} = ${t21.signAgree.n > 0 ? ((t21.signAgree.agree / t21.signAgree.n) * 100).toFixed(1) : '—'}% (20-voter: ${t20.signAgree.agree}/${t20.signAgree.n} = ${t20.signAgree.n > 0 ? ((t20.signAgree.agree / t20.signAgree.n) * 100).toFixed(1) : '—'}%) · tailwind mean return ${fmtNum(t21.rows.tailwind.mean)}% vs ${fmtNum(t20.rows.tailwind.mean)}% · headwind mean return ${fmtNum(t21.rows.headwind.mean)}% vs ${fmtNum(t20.rows.headwind.mean)}% (n: ${t21.rows.tailwind.n}/${t20.rows.tailwind.n} tailwind, ${t21.rows.headwind.n}/${t20.rows.headwind.n} headwind).`,
    );
  }
  emit();
  for (const horizon of GOLD_BACKTEST_HORIZONS) {
    const t21 = joinStats(windows, horizon, 'score21');
    emit(`**${horizon}td, 21-voter confusion table (±${flatBandPct(horizon).toFixed(2)}% band):**`);
    emit();
    emit('| Model ↓ / Move → | up | flat | down | n |');
    emit('|---|---|---|---|---|');
    for (const bucket of ['tailwind', 'mixed', 'headwind'] as const) {
      const r = t21.rows[bucket];
      emit(`| **${bucket}** | ${r.up} | ${r.flat} | ${r.down} | ${r.n} |`);
    }
    emit();
  }
  emit(
    `**The honest delta:** the tilt fired in ${fmtPct(tiltFired.length / windows.length)} of windows (mostly headwind: ${tiltHead} of ${tiltFired.length} — the tilt sat at decade lows, i.e. fading, for most of the corpus) and moved the label bucket in ${fmtPct(flips.length / windows.length)}${flips.length === 0 ? ' — the label buckets NEVER flipped' : ''}. The measured associations barely moved: ` +
      GOLD_BACKTEST_HORIZONS.map((h) => {
        const t20 = b2Stats[h]!.full;
        const t21 = joinStats(windows, h, 'score21');
        const d = t20.signAgree.n > 0 && t21.signAgree.n > 0 ? (t21.signAgree.agree / t21.signAgree.n - t20.signAgree.agree / t20.signAgree.n) * 100 : null;
        return `${h}td ${d === null ? '—' : `${d >= 0 ? '+' : ''}${d.toFixed(1)}pp`}`;
      }).join(' · ') +
      ` — ` +
      (() => {
        const deltas = GOLD_BACKTEST_HORIZONS.map((h) => {
          const t20 = b2Stats[h]!.full;
          const t21 = joinStats(windows, h, 'score21');
          return t20.signAgree.n > 0 && t21.signAgree.n > 0
            ? Math.abs(t21.signAgree.agree / t21.signAgree.n - t20.signAgree.agree / t20.signAgree.n)
            : 0;
        });
        return Math.max(...deltas) < 0.02
          ? '**no material difference in the measured association** — the 21-voter variant is not better or worse on this corpus, only noisier in its label vocabulary'
          : 'the sign-agreements moved by more than noise — read the per-horizon lines above';
      })() +
      `. Whether promotion is worth it is the owner's D-5 call; the evidence here is the delta, not a recommendation.`,
  );
  emit();
  emit(
    `Archive era: the tilt's reading exists only from the ${archiveGoldSummaryDays[0] ?? '—'} archive (it shipped in S3) — the 21-voter archive slice has n ≤ 1 and is NOT a meaningful table; stated rather than computed into significance.`,
  );
}
emit();

/* --- B3 honesty --- */
emit('## Honesty rules (B3) — the known gaps, stated');
emit();
emit(`1. **Every cell carries n.** All 9 confusion cells per horizon per table-set are reported (all-windows AND mature-base), plus the 6-row label-conditional tables and both models' sign-agreements — nothing picked.`);
emit(`2. **The corpus depth is ~10.1 years, not decades.** The stored histories begin ${SERIES[REAL_YIELD_ID]![0]!.date} (the FRED family's stage window). Windows before ~${MATURE_FROM} ride percentile bases shorter than 5 years — on a young base a value near the running max reads "high" more easily, which is exactly why the mature-base tables sit BESIDE the all-windows tables rather than replacing them.`);
emit(`3. **Three voters are structurally thin in the re-run era:** cftc-gold-positioning (1 stored point — never fires), us-japan-10y-gap (97 sparse points — jgb-10y was monthly until the 2026-10-26 MOF upgrade; the reading is stale most windows), gold-silver (monthly percentile history + daily seed points only since 2026-10-08). The stress lane therefore ran 4-voter — stated, not interpolated.`);
emit(`4. **The cross-fill cannot be replayed historically** (${crossFillTotal} fills across ${windows.length} windows): the stored series are the accumulated dense fetches; the fill earns its keep on TRANSIENT degraded days the stored corpus no longer shows. Its production effect is freshness, not a historical score change.`);
emit(`5. **The realized series is one venue, two provenances:** the backfill is the Yahoo GC=F ~10-year daily record; the tail points are the accumulated live-price seed appends (gold-api spot at append time). The join treats them identically; the mix is recorded here.`);
emit(`6. **Multiple testing:** 3 horizons × 3 buckets × 2 table-sets × 2 models + the archive slice is ~110 reported numbers; with these n's, ±2–3 percentage-point wobbles are noise. The conclusion below only claims what a stated-in-advance rule can see — the tables themselves make no claim.`);
emit(`7. **The archive era is plumbing, not power:** ${archiveDays.length} days, ${archiveDays.filter((d) => archiveForwardReturn(d, 5) !== undefined).length} joinable at 5td, 0 at 20td/60td. It verifies the live path's shape; it cannot verify an edge.`);
emit(`8. **The asOf-watch (S3's known gap):** day 1 in lockstep; days 2–3 pending the 11-01/11-02 rungs — the corpus ends ${archiveDays[archiveDays.length - 1]} at the S4 run time. Carried to spec §5.`);
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
    const m = joinStats(mature, horizon, 'score20');
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
      const m = joinStats(mature, horizon, 'score20');
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
    const m60 = joinStats(mature, 60, 'score20');
    emit(
      `By the stated rule: **no edge in the table's own direction — the measurable association runs the OTHER way over this corpus.** Every horizon's sign-agreement departs BELOW 50% and the tailwind-minus-headwind mean spread is negative at every horizon: over ${MATURE_FROM} → ${gridDates[gridDates.length - 1]}, headwind labels preceded LARGER forward rises than tailwind labels did (the 60td spread is ${m60.rows.tailwind.mean !== null && m60.rows.headwind.mean !== null ? (m60.rows.tailwind.mean - m60.rows.headwind.mean).toFixed(2) : '—'}%: headwind windows rose ${fmtNum(m60.rows.headwind.mean)}% on average against tailwind's ${fmtNum(m60.rows.tailwind.mean)}%, mature base). This decade's gold advance ran THROUGH tight real rates and a strong dollar — the classical headwinds — so a conditions-reading table built on those relationships reads persistently against the move it lived through. The panel's caption ("conditions, not advice") is not just a disclaimer here; it is the operative description: the table reads the macro regime, and in this regime the regime's direction and gold's direction diverged.`,
    );
  } else {
    emit(
      `By the stated rule: **no measurable edge at these horizons over this corpus** — the sign-agreements sit within (or straddle) the 2-SE band and/or the mean spread flips sign across horizons. The frozen table remains what its caption says — a reading of conditions, not advice — and D-5's promotion question is answered by the B4 delta above on operational grounds, not by any backtest power.`,
    );
  }
  emit();
  emit(
    `The ex-ante test, answered honestly: the 20-voter table and its thresholds were authored from classical driver relationships BEFORE this harness computed anything (S1, 2026-10-31; zero threshold changes since), so the numbers above are what an observer with the same table and the same stored histories would have measured at each window — no fitted parameters, no selection. The honest caveat runs the other way: the FLAT BAND, the three horizons and the bucket folds were chosen by the harness author in this session; the stated-in-advance rule above is the guard against that freedom, and the mature-base/all-windows split is reported so the short-base effect is visible, not hidden.`,
  );
}
emit();

writeFileSync(OUT_PATH, `${LINES.join('\n')}\n`, 'utf-8');
console.log(`Wrote ${OUT_PATH} (${LINES.length} lines)`);
console.log(`Windows: ${windows.length} · cross-fill days: ${crossFillTotal} · tilt fired: ${windows.filter((w) => w.tiltState.impact !== null).length}`);
for (const horizon of GOLD_BACKTEST_HORIZONS) {
  const t = joinStats(windows, horizon, 'score20');
  const t21 = joinStats(windows, horizon, 'score21');
  console.log(
    `  ${horizon}td: sign-agree ${t.signAgree.agree}/${t.signAgree.n} (${t.signAgree.n > 0 ? ((t.signAgree.agree / t.signAgree.n) * 100).toFixed(1) : '—'}%) · tailwind mean ${fmtNum(t.rows.tailwind.mean)}% (n=${t.rows.tailwind.n}) · headwind mean ${fmtNum(t.rows.headwind.mean)}% (n=${t.rows.headwind.n}) · all mean ${fmtNum(t.all.mean)}% · 21v sign-agree ${t21.signAgree.agree}/${t21.signAgree.n}`,
  );
}
