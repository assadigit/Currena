/**
 * Fix spec Part D + A-03 (2026-10-14): the validation suite that runs after
 * the data is fetched and BEFORE anything is published. Every test has an
 * id (T-01 … T-14), a plain-language name, and writes its result to the
 * status file (InsightsStatus.validation) via the ingest runner.
 *
 * Safety contract (A-04): a reading flagged by a test is HELD on its last
 * good value with status `check-pending` — the fresh (bad) value never
 * reaches the live page, and the reason is recorded on the reading
 * (`reading.flag`). The snapshot builder applies the flags; this module
 * only computes them.
 *
 * Pure and platform-free (AGENTS.md rule 2): every input is an explicit
 * parameter, so the unit tests freeze the clock at will.
 */

import type {
  CalendarEvent,
  IndicatorDefinition,
  IndicatorId,
  IndicatorReading,
  ValidationTestResult,
} from '@currena/core';
import { DEFINITIONS } from './definitions';
import { GAUGES } from './gauges';
import { staleAfterDaysFor, computeReading } from './scoring';
import { CONNECTIONS, evaluateConnection } from './connections';
import { evaluateSignals } from './signals';
import { daysBetween, pointAtOrBefore, type SeriesPoint } from './series';
import { READING_SOURCES } from './adapters/derived';

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

/** A regression episode case for T-14 (expected results stored in the repo). */
export interface RegressionCase {
  defId: IndicatorId;
  /** [date, value] pairs — the saved past data fed to the engine. */
  points: readonly (readonly [string, number])[];
  /** The evaluation date (frozen clock). */
  asOf: string;
  /** The status the engine must produce (stored when the fixture was cut). */
  expected: IndicatorReading['status'];
}

/** One saved past episode (e.g. March 2020, 2022). */
export interface RegressionEpisode {
  id: string;
  description: string;
  cases: readonly RegressionCase[];
}

export interface ValidationInputs {
  /** The assembled indicator series (buildIndicatorSeries output). */
  series: Partial<Record<IndicatorId, SeriesPoint[]>>;
  /** The DRAFT readings computed from those series (pre-publish). */
  readings: readonly IndicatorReading[];
  /** Hand-maintained calendar entries. */
  calendar: readonly CalendarEvent[];
  /** The run's clock (ISO 8601 UTC). */
  now: string;
  /**
   * T-01 needs the 10-year breakeven (FRED T10YIE) — a validation-only
   * series the ingest fetches alongside the indicator set.
   */
  breakeven10y?: SeriesPoint[];
  /**
   * T-07 scans these texts (the registry templates and the web copy
   * corpus) for forbidden forecast wording. Absent → the test records a
   * skip note (the CI corpus tests cover the templates).
   */
  copyTexts?: readonly string[];
  /** T-14: the saved regression episodes (fixtures/regression-episodes.json). */
  episodes?: readonly RegressionEpisode[];
  /**
   * Defect E-04 (2026-10-16): the previous STORED snapshot's readings — the
   * cross-day half of the frozen-value check (a daily value identical to
   * six decimals across days is a stale cache shown as fresh). The ingest
   * passes the snapshot it just read from KV.
   */
  previousReadings?: readonly IndicatorReading[];
}

/** Why one reading was flagged (the snapshot builder turns this into `check-pending`). */
export interface SafetyFlag {
  test: string;
  reason: string;
  /** Hold the LAST GOOD value (true for wrong-value/wrong-date flags). */
  holdLastGood: boolean;
  /** Drop the peak claim instead of flagging the whole reading (T-05). */
  stripPeak?: boolean;
}

export interface ValidationOutcome {
  results: readonly ValidationTestResult[];
  /** Per-reading safety flags — what must NOT publish as fresh data. */
  flags: ReadonlyMap<IndicatorId, SafetyFlag>;
}

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

const defById = new Map<string, IndicatorDefinition>(DEFINITIONS.map((d) => [d.id as string, d]));

function result(
  test: string,
  name: string,
  flagged: readonly IndicatorId[],
  failures: readonly string[],
  notes: readonly string[] = [],
): ValidationTestResult {
  return { test, name, ok: failures.length === 0, flagged: [...flagged], failures: [...failures], notes: [...notes] };
}

/** A skip: the test could not run its full check — ok stays true, the note is recorded. */
function skipped(test: string, name: string, note: string): ValidationTestResult {
  return result(test, name, [], [], [note]);
}

function readingOf(
  readings: readonly IndicatorReading[],
  id: IndicatorId,
): IndicatorReading | undefined {
  return readings.find((r) => r.id === id);
}

function seriesOf(inputs: ValidationInputs, id: IndicatorId): SeriesPoint[] | undefined {
  return inputs.series[id];
}

/** The latest date on or before `nowDay` where BOTH series carry an observation. */
function latestCommonDate(
  a: SeriesPoint[],
  b: SeriesPoint[],
  nowDay: string,
): { date: string; a: number; b: number } | undefined {
  const pa = pointAtOrBefore(a, nowDay);
  if (!pa) return undefined;
  for (let i = a.findIndex((p) => p.date === pa.date); i >= 0; i--) {
    const candidate = a[i]!;
    const pb = pointAtOrBefore(b, candidate.date);
    if (pb && pb.date === candidate.date) {
      return { date: candidate.date, a: candidate.value, b: pb.value };
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ *
 * T-01 Reconciliation — real yield + 10y breakeven = nominal (± 0.05 pts)
 * ------------------------------------------------------------------ */

const T01_TOLERANCE = 0.05;

function t01Reconciliation(inputs: ValidationInputs): ValidationTestResult {
  const name = 'Reconciliation: real yield + breakeven = nominal yield';
  const nominal = seriesOf(inputs, 'us10y');
  const real = seriesOf(inputs, 'real-yield-10y');
  const breakeven = inputs.breakeven10y;
  if (nominal === undefined || real === undefined || breakeven === undefined) {
    // Missing legs are a fetch problem (the source reports carry it), not a
    // reconciliation failure — the test only judges data that exists.
    return skipped('T-01', name, 'nominal, real or 10-year breakeven series unavailable this run');
  }
  const pair = latestCommonDate(real, breakeven, inputs.now.slice(0, 10));
  const nominalAt = pair ? pointAtOrBefore(nominal, pair.date) : undefined;
  if (pair === undefined || nominalAt === undefined || nominalAt.date !== pair.date) {
    return skipped('T-01', name, 'no common date across the three series');
  }
  const sum = pair.a + pair.b;
  const gap = Math.abs(sum - nominalAt.value);
  if (gap > T01_TOLERANCE) {
    return result(
      'T-01',
      name,
      ['real-yield-10y', 'us10y'],
      [
        `real yield (${pair.a.toFixed(2)}) + 10-year breakeven (${pair.b.toFixed(2)}) = ${sum.toFixed(2)} ≠ nominal ${nominalAt.value.toFixed(2)} on ${pair.date} (gap ${gap.toFixed(2)} pts > ${T01_TOLERANCE})`,
      ],
    );
  }
  return result('T-01', name, [], []);
}

/* ------------------------------------------------------------------ *
 * T-02 Derived values — recomputed from the displayed inputs
 * ------------------------------------------------------------------ */

function t02DerivedValues(inputs: ValidationInputs): ValidationTestResult {
  const name = 'Derived values recomputed from displayed inputs';
  const failures: string[] = [];
  const flagged: IndicatorId[] = [];
  const byId = new Map(inputs.readings.map((r) => [r.id as string, r]));

  /** Recompute one ratio from its legs' series at the ratio's own asOf. */
  const ratio = (id: IndicatorId, legA: IndicatorId, legB: IndicatorId, build: (a: number, b: number) => number, tolerance: number): void => {
    const r = byId.get(id);
    const aS = seriesOf(inputs, legA);
    const bS = seriesOf(inputs, legB);
    if (!r || r.value === null || r.asOf === null || !aS || !bS) return;
    const a = pointAtOrBefore(aS, r.asOf);
    const b = pointAtOrBefore(bS, r.asOf);
    if (!a || !b) return;
    const recomputed = build(a.value, b.value);
    if (Math.abs(recomputed - r.value) > tolerance) {
      failures.push(`${id}: stored ${r.value.toFixed(4)} ≠ recomputed ${recomputed.toFixed(4)} from ${legA} and ${legB} at ${r.asOf}`);
      flagged.push(id);
    }
  };

  // Daily ratios over the same snapshot (tolerance = stored rounding).
  // silver-btc's ratio check retired with the card (2026-10-23, OD-7).
  ratio('gold-silver', 'gold-usd', 'silver-usd', (g, s) => g / s, 0.15);
  ratio('gold-btc', 'gold-usd', 'btc-usd', (g, b) => g / b, 0.0005);
  // Gold in AUD: gold ÷ the AUD/USD rate (audusd = USD per AUD).
  ratio('gold-aud', 'gold-usd', 'audusd', (g, aud) => g / aud, 0.75);
  // The AU−US gap: same-date subtraction.
  {
    const r = byId.get('au-us-10y-gap');
    const au = seriesOf(inputs, 'au-10y');
    const us = seriesOf(inputs, 'us10y');
    if (r && r.value !== null && r.asOf !== null && au && us) {
      const a = pointAtOrBefore(au, r.asOf);
      const u = pointAtOrBefore(us, r.asOf);
      if (a && u && a.date === r.asOf && u.date === r.asOf) {
        const recomputed = a.value - u.value;
        if (Math.abs(recomputed - r.value) > 0.005) {
          failures.push(`au-us-10y-gap: stored ${r.value.toFixed(3)} ≠ AU ${a.value.toFixed(3)} − US ${u.value.toFixed(3)} = ${recomputed.toFixed(3)} on ${r.asOf}`);
          flagged.push('au-us-10y-gap');
        }
      }
    }
  }
  return result('T-02', name, flagged, failures);
}

/* ------------------------------------------------------------------ *
 * T-03 Dates — trading days, no future dates, data ≤ release
 * ------------------------------------------------------------------ */

/**
 * Series whose observation dates are trading days (business days): a
 * Saturday/Sunday asOf means a parse landed on the wrong row. Policy rates
 * (Fed/ECB daily target series publish weekend rows) and monthly/quarterly
 * series are excluded — their dates legitimately fall on any calendar day.
 */
const TRADING_DATE_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>([
  'yield-curve-10y2y',
  'real-yield-10y',
  'us10y',
  'breakeven-5y5y',
  'vix',
  'gold-silver',
  'dollar-basket',
  'usdjpy',
  'eur-usd',
  'usdcny',
  'brent',
  'au-10y',
  'au-us-10y-gap',
  'audusd',
  'audjpy',
]);

function isWeekend(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

function t03Dates(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const flagged: IndicatorId[] = [];
  const nowDay = inputs.now.slice(0, 10);
  for (const r of inputs.readings) {
    if (r.asOf === null) continue;
    if (r.asOf > nowDay) {
      failures.push(`${r.id}: observation date ${r.asOf} is in the future`);
      flagged.push(r.id);
      continue;
    }
    if (TRADING_DATE_IDS.has(r.id) && isWeekend(r.asOf)) {
      failures.push(`${r.id}: observation date ${r.asOf} is a weekend for a trading-day series`);
      flagged.push(r.id);
    }
    if (r.releaseDate !== undefined) {
      if (r.releaseDate > nowDay) {
        failures.push(`${r.id}: release date ${r.releaseDate} is in the future`);
        flagged.push(r.id);
      } else if (r.releaseDate < r.asOf) {
        failures.push(`${r.id}: release date ${r.releaseDate} predates the observation ${r.asOf}`);
        flagged.push(r.id);
      }
    }
  }
  for (const e of inputs.calendar) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
      failures.push(`calendar event ${e.id}: bad date ${e.date}`);
    }
  }
  return result('T-03', 'Dates: trading days, nothing in the future, data on or before release', flagged, failures);
}

/* ------------------------------------------------------------------ *
 * T-04 Freshness — fresh-looking cards are actually fresh
 * ------------------------------------------------------------------ */

function t04Freshness(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const flagged: IndicatorId[] = [];
  const nowDay = inputs.now.slice(0, 10);
  for (const r of inputs.readings) {
    const def = defById.get(r.id as string);
    if (!def || r.asOf === null) continue;
    const grace = staleAfterDaysFor(def);
    if (grace === null) continue;
    const age = daysBetween(r.asOf, nowDay);
    const looksFresh =
      r.status === 'warning' || r.status === 'normal' || r.status === 'context' || r.status === 'no-history';
    if (looksFresh && age > grace) {
      failures.push(`${r.id}: status ${r.status} at age ${age} days (max ${grace}) — must carry a stale tag`);
      flagged.push(r.id);
    }
  }
  return result('T-04', 'Freshness: every card within its maximum age or tagged stale', flagged, failures);
}

/* ------------------------------------------------------------------ *
 * T-05 Known records — stored peaks at least the confirmed records
 * ------------------------------------------------------------------ */

/**
 * The record floors, each confirmed with two sources before hardcoding
 * (INSIGHTS_FIX_SPEC.md Part D + the live verification log, 2026-10-14):
 *  - Bitcoin 126,000: Bitstamp daily high 126,272 on 6 Oct 2025 and the
 *    audit's reference about $126,210 (6 Oct 2025).
 *  - Gold 5,300: Yahoo GC=F daily high 5,586.2 on 29 Jan 2026 and the
 *    audit's spot record about $5,590 on 28 Jan 2026.
 *  - Silver 89: Yahoo SI=F daily high 121.3 on 29 Jan 2026; the audit's
 *    conservative floor "at least $89.10 on 13 Jan 2026".
 *  - Brent 127: FRED DCOILBRENTEU daily-close peak 138.21 on 2026-04-07
 *    (the audit's "closing peak about $128" is exceeded by the stored data;
 *    the floor stays conservative).
 * Peaks use the daily-HIGH basis for the metals and Bitcoin and the
 * daily-CLOSE basis for Brent (see B-01).
 */
export const KNOWN_RECORD_FLOORS: Partial<Readonly<Record<IndicatorId, number>>> = {
  'btc-usd': 126_000,
  'gold-usd': 5_300,
  'silver-usd': 89,
  brent: 127,
};

function t05KnownRecords(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const flagged: IndicatorId[] = [];
  for (const [id, floor] of Object.entries(KNOWN_RECORD_FLOORS) as [IndicatorId, number][]) {
    const reading = readingOf(inputs.readings, id);
    // Unavailable/stale/held rows are the source reports' problem — T-05
    // only judges data that would display.
    if (!reading || reading.value === null || reading.status === 'unavailable' || reading.status === 'stale' || reading.status === 'check-pending') continue;
    if (reading.peak === undefined) {
      failures.push(`${id}: no stored peak — the record-history backfill is missing`);
      flagged.push(id);
      continue;
    }
    if (reading.peak.value < floor) {
      failures.push(`${id}: stored peak ${reading.peak.value} on ${reading.peak.date} is below the confirmed record floor ${floor}`);
      flagged.push(id);
    }
  }
  return result('T-05', 'Known records: stored peaks at least the confirmed record values', flagged, failures);
}

/* ------------------------------------------------------------------ *
 * T-06 Text matches status — no easing words on rising values
 * ------------------------------------------------------------------ */

/**
 * The engine-side half of T-06 (the web's consequenceState mirror runs in
 * CI): every reading that selects a directional template must have a
 * matching 30-day direction — highRising only with change30d > 0,
 * highEasing only with change30d < 0, and NO directional template at all
 * when the change is zero or unmeasurable (the +0.00% class of bug).
 */
function t06TextMatchesStatus(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const flagged: IndicatorId[] = [];
  for (const r of inputs.readings) {
    if (r.percentile10y === undefined || r.percentile10y <= 0.8) continue;
    // High band: a directional template needs a non-zero finite 30-day change.
    if (r.change30d === undefined || !Number.isFinite(r.change30d) || r.change30d === 0) {
      // The card must fall back to the NON-directional line; nothing to
      // flag here (the zero-change case itself is T-08's flag).
      continue;
    }
    // An easing selection with a statistically large UP move would be a
    // contradiction (the window anchor is broken): |z| ≥ 2 upward while the
    // 30-day window reads negative is legitimate (recent spike after a
    // decline); the opposite — "easing" text while the value ROSE over the
    // window — is impossible by construction and pinned by the unit tests.
    if (r.moveScore !== undefined && Number.isFinite(r.moveScore) && Math.abs(r.moveScore) > 10) {
      failures.push(`${r.id}: move score ${r.moveScore.toFixed(1)} is implausible (broken change window)`);
      flagged.push(r.id);
    }
  }
  return result('T-06', 'Text matches status: no easing text on a rising value', flagged, failures);
}

/* ------------------------------------------------------------------ *
 * T-07 Forbidden words — no forecasts in any generated sentence
 * ------------------------------------------------------------------ */

const FORBIDDEN_PHRASES: readonly string[] = [' will ', ' should ', ' time to ', ' expected to '];

/** Word-boundary scan of one text for the forbidden forecast wording. */
export function containsForbiddenWords(text: string): string[] {
  const normalised = ` ${text.replace(/\s+/g, ' ')} `;
  const hits: string[] = [];
  for (const phrase of FORBIDDEN_PHRASES) {
    if (normalised.includes(phrase)) hits.push(phrase.trim());
  }
  return hits;
}

function t07ForbiddenWords(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  if (inputs.copyTexts === undefined) {
    return skipped('T-07', 'Forbidden words: no forecast wording in generated sentences', 'no copy texts supplied (the CI corpus tests cover the templates)');
  }
  for (const text of inputs.copyTexts) {
    const hits = containsForbiddenWords(text);
    if (hits.length > 0) {
      failures.push(`forbidden wording "${hits.join('", "')}" in: ${text.slice(0, 90)}…`);
    }
  }
  return result('T-07', 'Forbidden words: no forecast wording in generated sentences', [], failures);
}

/* ------------------------------------------------------------------ *
 * T-08 Suspicious values — duplicates and exactly-zero monthly changes
 * ------------------------------------------------------------------ */

/**
 * How many consecutive unchanged observations a cadence tolerates before
 * the value is suspicious. Policy rates (per-change) hold constants between
 * decisions BY DESIGN and are never checked. Defect E-04 (2026-10-16):
 * DAILY series tolerate no exact repeat AT HIGH PRECISION — a daily print
 * identical to the previous day at three-plus decimals (the 15 Oct copper
 * row, 14772.999807) is the frozen-cache bug class, and both halves below
 * (in-series and cross-day) flag it. v3 refinement (2026-10-20, found by
 * the live self-check): a daily repeat at NATURAL QUOTE PRECISION (≤2
 * decimals — yields 5.43, VIX 15.27) is a plausible coincidence, so the
 * daily rule is precision-aware: ≤2dp values tolerate a short repeat run
 * (2), ≥3dp values tolerate none. Monthly/quarterly keep the one-repeat
 * rule — a monthly series printing the same value twice in a row is the
 * "+0.00% since previous release" bug class (B-02).
 */
const MAX_UNCHANGED_RUN: Readonly<Record<IndicatorDefinition['cadence'], number | null>> = {
  daily: 0,
  weekly: 3,
  monthly: 1,
  quarterly: 1,
  'per-change': null,
  manual: 1,
};

/** The decimal places a value's own representation carries (15.27 → 2; 14772.999807 → 6). */
function decimalsOf(value: number): number {
  const text = String(value);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * v3 (2026-10-20): the daily unchanged-run tolerance by precision —
 * natural-quote (≤2dp) values may repeat briefly; high-precision (≥3dp)
 * values may not repeat at all.
 */
function dailyUnchangedTolerance(value: number): number {
  return decimalsOf(value) <= 2 ? 2 : 0;
}

/**
 * Administrative rate series whose flat prints are the NORMAL state, not
 * the "+0.00%" duplicate bug class (live-run evidence 2026-10-15, both
 * venues):
 *  - Policy targets SET at decision meetings (fed-target, ecb-dfr,
 *    rba-cash-rate): a target legitimately sits unchanged for months or
 *    years (the Fed's 2008–15 hold ran seven years; the 2026 evidence was
 *    28 unchanged daily prints). Judged by the decision calendar
 *    (data/insights-calendar.json + data/policy-decisions.json), not the
 *    observation cadence.
 *  - Monthly average rates that reprice only as the loan/deposit stock
 *    rolls (au-home-loan F6 FLRHOOTA, au-deposit-rate F4.1 PDRNTH): the
 *    recorded venue history prints 6.21 for three straight months — the
 *    2026-07→08 repetition is the series being itself, not a failed fetch.
 * T-04 freshness still guards every one of them for staleness.
 */
const UNCHANGED_NORMAL_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>([
  'fed-target',
  'ecb-dfr',
  'rba-cash-rate',
  'au-home-loan',
  'au-deposit-rate',
]);

function t08SuspiciousValues(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const flagged: IndicatorId[] = [];
  const nowDay = inputs.now.slice(0, 10);
  for (const def of DEFINITIONS) {
    const series = seriesOf(inputs, def.id);
    if (!series || series.length < 2) continue;
    const maxRun = MAX_UNCHANGED_RUN[def.cadence];
    if (maxRun === null || UNCHANGED_NORMAL_IDS.has(def.id)) continue;
    const current = pointAtOrBefore(series, nowDay);
    if (!current) continue;
    const idx = series.findIndex((p) => p.date === current.date);
    // (a) the latest value repeats the previous observation exactly — for a
    // monthly/quarterly series this is the "+0.00% since previous release"
    // bug class (a duplicate print or a failed fetch); for a DAILY series a
    // repeat only counts as the E-04 frozen-cache class at ≥3 decimals
    // (v3 precision refinement: a 2dp yield printing 5.43 twice is a
    // plausible market close, not a frozen cache).
    if (idx > 0 && !(def.cadence === 'daily' && decimalsOf(current.value) <= 2)) {
      const prev = series[idx - 1]!;
      if (prev.value === current.value) {
        failures.push(
          `${def.id}: ${def.cadence} series repeated ${current.value} on ${current.date} (previous print ${prev.date}) — possible duplicate or failed fetch`,
        );
        flagged.push(def.id);
        continue;
      }
    }
    // (b) an unchanged run longer than the cadence tolerates.
    let run = 1;
    for (let i = series.length - 1; i > 0; i--) {
      if (series[i]!.value === series[i - 1]!.value) run++;
      else break;
    }
    const effectiveRun = def.cadence === 'daily' ? dailyUnchangedTolerance(current.value) : maxRun;
    if (run - 1 > effectiveRun) {
      failures.push(`${def.id}: last ${run} observations unchanged (cadence tolerates ${maxRun})`);
      flagged.push(def.id);
      continue;
    }
    // (c) E-04 cross-day half: the current value identical to six decimals
    // to what the PREVIOUS snapshot published for the same id — the value
    // did not move across days while the card claims a new one.
    const prevReading = inputs.previousReadings?.find((r) => r.id === def.id);
    if (
      def.cadence === 'daily' &&
      prevReading !== undefined &&
      prevReading.value !== null &&
      prevReading.asOf !== null &&
      decimalsOf(current.value) >= 3 && // v3: 2dp quotes repeat legitimately; high precision does not
      current.value.toFixed(6) === prevReading.value.toFixed(6) &&
      prevReading.asOf < current.date
    ) {
      failures.push(
        `${def.id}: daily value identical to 6 decimals across days (${current.value} on ${current.date}, previous snapshot ${prevReading.asOf}) — frozen value shown as fresh`,
      );
      flagged.push(def.id);
    }
  }
  return result('T-08', 'Suspicious values: no duplicate prints, no exactly-zero monthly changes', flagged, failures);
}

/* ------------------------------------------------------------------ *
 * T-09 Counts — hero count equals the sum of the area counts
 * ------------------------------------------------------------------ */

function t09Counts(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const byId = new Map(inputs.readings.map((r) => [r.id as string, r]));
  const votable = (r: IndicatorReading | undefined): boolean =>
    r !== undefined && (r.status === 'warning' || r.status === 'normal');
  for (const section of ['global', 'australia'] as const) {
    const sectionGauges = GAUGES.filter((g) => g.section === section);
    const memberIds = new Set<IndicatorId>();
    for (const g of sectionGauges) for (const id of g.members) memberIds.add(id);
    let gaugeWarnings = 0;
    let gaugeVoting = 0;
    for (const id of memberIds) {
      const r = byId.get(id as string);
      if (votable(r)) {
        gaugeVoting++;
        if (r!.status === 'warning') gaugeWarnings++;
      }
    }
    // Every scored reading in the section must be a gauge member (B-14):
    // the hero counts the same list the areas count.
    const sectionWarnings: IndicatorId[] = [];
    let sectionVoting = 0;
    for (const def of DEFINITIONS) {
      if (def.section !== section) continue;
      const r = byId.get(def.id as string);
      if (votable(r)) {
        sectionVoting++;
        if (r!.status === 'warning') sectionWarnings.push(def.id);
      }
    }
    if (gaugeWarnings !== sectionWarnings.length || gaugeVoting !== sectionVoting) {
      const outsideGauge = sectionWarnings.filter((id) => !memberIds.has(id));
      failures.push(
        `${section}: area counts ${gaugeWarnings}/${gaugeVoting} but scored readings ${sectionWarnings.length}/${sectionVoting}` +
          (outsideGauge.length > 0 ? ` (scored outside the areas: ${outsideGauge.join(', ')})` : ''),
      );
    }
  }
  return result('T-09', 'Counts: hero count equals the sum of the area counts, scored only', [], failures);
}

/* ------------------------------------------------------------------ *
 * T-10 Units — percentage points for rates, % only for prices and indexes
 * ------------------------------------------------------------------ */

/**
 * Interest rates, inflation, yields and unemployment speak in percentage
 * points (changeKind 'points'); prices, FX, indexes and ratios speak in
 * percent. The PMI, gold/silver ratio, dollar basket, copper/gold and
 * terms-of-trade are index/ratio-point series (not %).
 */
const POINTS_KIND_EXPECTED: ReadonlySet<IndicatorId> = new Set<IndicatorId>([
  'yield-curve-10y2y',
  // Fix spec C-03/C-04/C-05/C-06 (2026-10-14): the four additions all speak
  // in points — two yield gaps, one yield, one diffusion index.
  'fed-expectations',
  'us30y',
  'philly-fed',
  'rba-expectations',
  'real-yield-10y',
  'us10y',
  'fed-target',
  'ecb-dfr',
  'govt-interest-revenue',
  'us-cpi-yoy',
  'us-cpi-core-yoy',
  'breakeven-5y5y',
  'us-unemployment',
  'sahm-rule',
  'china-pmi',
  'au-cpi',
  'au-trimmed-mean',
  'au-10y',
  'au-us-10y-gap',
  'au-petrol-yoy',
  'rba-cash-rate',
  'au-home-loan',
  'au-deposit-rate',
  'au-wage-growth',
  'au-rent-yoy',
  'au-unemployment',
  'au-household-debt-arrears',
  'terms-of-trade',
  // 2026-10-21 data-integrity round: the sovereign yields, the BoJ/BoE
  // overnight-rate proxies and the GDP growth rate all speak in percentage
  // points (rate-family series).
  'bund-10y',
  'jgb-10y',
  'gilt-10y',
  'boj-rate',
  'boe-rate',
  'us-gdp-growth',
]);

/** Index/ratio series that speak in points but are not interest rates. */
const INDEX_POINT_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>([
  'china-pmi',
  'gold-silver',
  'dollar-basket',
  // Step 3 L1-14 (v3, 2026-10-20): the Shiller pair — CAPE is a ratio
  // (like gold-silver); the ECY is a yield-gap measure in points.
  'shiller-cape',
  'shiller-ecy',
  'copper-gold',
  'terms-of-trade',
  'vix',
  'crypto-fng', // Step 3 L1-18: the publisher's own 0-100 index speaks in index points
  'stress-stlfsi',
  'nfci',
  // 2026-10-21 data-integrity round: the monthly nonfarm-payrolls change
  // speaks in thousands of jobs — a count, not a percent.
  'us-nfp',
]);

function t10Units(): ValidationTestResult {
  const failures: string[] = [];
  for (const def of DEFINITIONS) {
    const pointsExpected = POINTS_KIND_EXPECTED.has(def.id);
    if (pointsExpected && def.changeKind !== 'points') {
      failures.push(`${def.id}: a rate/inflation/unemployment series must speak in points, found ${def.changeKind}`);
    }
    if (!pointsExpected && def.changeKind !== 'pct' && !INDEX_POINT_IDS.has(def.id)) {
      failures.push(`${def.id}: a price/index series must speak in percent, found ${def.changeKind}`);
    }
  }
  return result('T-10', 'Units: percentage points for rates, % only for prices and indexes', [], failures);
}

/* ------------------------------------------------------------------ *
 * T-11 Same indicator, same status in every section
 * ------------------------------------------------------------------ */

/**
 * The surfaces that re-use an indicator's state: the gold/silver signal
 * conditions and the connection legs. B-12: the gold card's
 * expectations condition reads the breakeven indicator's SCORED STATUS —
 * supportive only when the indicator card itself is in warning; and the
 * signals' lean legs must agree with the reading's own direction fields.
 */
function t11SameStatus(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const byId = new Map(inputs.readings.map((r) => [r.id as string, r]));
  // (a) B-12: the gold/silver cards' expectations condition reads the
  // breakeven indicator's SCORED STATUS — supportive only when the
  // indicator card itself is in warning.
  const breakeven = byId.get('breakeven-5y5y');
  if (breakeven !== undefined && !['stale', 'check-pending', 'unavailable'].includes(breakeven.status)) {
    const signals = evaluateSignals(inputs.readings);
    const goldExpectations = signals.gold.conditions.find((c) => c.key === 'expectations');
    if (goldExpectations !== undefined) {
      if (goldExpectations.state === 'supportive' && breakeven.status !== 'warning') {
        failures.push(
          `gold card lists inflation expectations as supportive while the breakeven card reads ${breakeven.status}`,
        );
      }
      if (goldExpectations.state !== 'supportive' && breakeven.status === 'warning') {
        failures.push(
          `breakeven card reads warning (${breakeven.value}) but the gold card's expectations condition is ${goldExpectations.state}`,
        );
      }
    }
  }
  // (b) The signal lean legs' direction words must agree with the
  // readings' own change fields (an independent recomputation of the lean
  // thresholds the evaluator uses).
  const LEAN_THRESHOLD: Partial<Record<IndicatorId, number>> = {
    'real-yield-10y': 0.1,
    'dollar-basket': 1.0,
    'breakeven-5y5y': 0.1,
    'china-pmi': 0.25,
    'copper-gold': 0.08,
  };
  for (const [id, threshold] of Object.entries(LEAN_THRESHOLD) as [IndicatorId, number][]) {
    const r = byId.get(id);
    if (!r || ['stale', 'check-pending', 'unavailable'].includes(r.status)) continue;
    if (r.change30d !== undefined && Number.isFinite(r.change30d) && r.change30d !== 0) {
      // The lean's direction (used for the card's words) must carry the
      // same sign as the reading's own change30d against the threshold.
      const impliedDirection = r.change30d > 0 ? 'rising' : r.change30d < -threshold ? 'falling' : 'steady';
      if (impliedDirection === 'steady' && Math.abs(r.change30d) > threshold * 3) {
        failures.push(`${id}: change30d ${r.change30d.toFixed(2)} far beyond its lean threshold but read as steady`);
      }
    }
  }
  // (c) The connection legs' direction words vs the readings' own changes
  // (an independent recomputation of the uniform method).
  for (const def of CONNECTIONS) {
    for (const leg of def.legs) {
      const r = byId.get(leg.id as string);
      if (!r || ['stale', 'check-pending', 'unavailable'].includes(r.status)) continue;
      for (const w of leg.windows) {
        const change = w.days === 7 ? r.change7d : w.days === 30 ? r.change30d : r.change90d;
        if (change === undefined) continue;
        if (w.days === 30 && r.change30d !== undefined && Math.sign(change) !== Math.sign(r.change30d)) {
          failures.push(`${def.id}: leg ${leg.id} window ${w.days}d sign disagrees with its own change30d`);
        }
      }
    }
  }
  return result('T-11', 'Same indicator, same status in every section', [], failures);
}

/* ------------------------------------------------------------------ *
 * T-12 Relationship rules — Active only when every required leg moves
 * ------------------------------------------------------------------ */

function t12RelationshipRules(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const byId = new Map(inputs.readings.map((r) => [r.id as string, r]));
  for (const def of CONNECTIONS) {
    // Re-derive the state with the evaluator, then INDEPENDENTLY re-check
    // every required leg's qualifying move from the raw reading fields.
    const state = evaluateConnection(def, inputs.readings).state;
    if (state !== 'active') continue;
    for (const leg of def.legs) {
      if (leg.role !== 'required') continue;
      const r = byId.get(leg.id as string);
      if (!r) {
        failures.push(`${def.id}: active but required leg ${leg.id} has no reading`);
        continue;
      }
      const moves = leg.windows.map((w) => ({
        change: (w.days === 7 ? r.change7d : w.days === 30 ? r.change30d : r.change90d) ?? undefined,
        min: w.minMove,
      }));
      const moved = moves.some((m) => m.change !== undefined && Math.abs(m.change) >= m.min);
      if (!moved && def.passThrough !== true) {
        failures.push(
          `${def.id}: active but required leg ${leg.id} is steady (30d ${r.change30d?.toFixed(2) ?? '—'} < its minimum move)`,
        );
      }
    }
  }
  return result('T-12', 'Relationship rules: Active only when every required leg meets its rule', [], failures);
}

/* ------------------------------------------------------------------ *
 * T-13 Source present — every card has a source name and a data date
 * ------------------------------------------------------------------ */

function t13SourcePresent(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  const flagged: IndicatorId[] = [];
  for (const r of inputs.readings) {
    if (r.sourceName.trim().length === 0) {
      failures.push(`${r.id}: no source name`);
      flagged.push(r.id);
    }
    if (r.status !== 'unavailable' && r.asOf === null) {
      failures.push(`${r.id}: no data date`);
      flagged.push(r.id);
    }
    if (r.sourceUrl === undefined || r.sourceUrl.trim().length === 0) {
      failures.push(`${r.id}: no source link`);
    }
  }
  return result('T-13', 'Source present: every card has a source name and a data date', flagged, failures);
}

/* ------------------------------------------------------------------ *
 * T-14 Regression fixtures — saved episodes produce the stored statuses
 * ------------------------------------------------------------------ */

function t14RegressionFixtures(inputs: ValidationInputs): ValidationTestResult {
  const failures: string[] = [];
  if (inputs.episodes === undefined || inputs.episodes.length === 0) {
    return skipped('T-14', 'Regression fixtures: saved episodes produce the stored statuses', 'no episodes supplied (the CI fixture tests cover them)');
  }
  for (const episode of inputs.episodes) {
    for (const c of episode.cases) {
      const def = defById.get(c.defId as string);
      if (!def) continue;
      const series: SeriesPoint[] = c.points.map(([date, value]) => ({ date, value }));
      const source = READING_SOURCES[c.defId] ?? { name: def.sourceRef };
      const reading = computeReading(def, series, `${c.asOf}T00:00:00Z`, source);
      if (reading.status !== c.expected) {
        failures.push(
          `${episode.id}/${c.defId}: expected ${c.expected} at ${c.asOf}, engine produced ${reading.status} (value ${reading.value})`,
        );
      }
    }
  }
  return result('T-14', 'Regression fixtures: saved episodes produce the stored statuses', [], failures);
}

/* ------------------------------------------------------------------ *
 * The suite
 * ------------------------------------------------------------------ */

/**
 * Run every test over the draft inputs. Pure: the ingest calls this after
 * the fetch, then applies the returned flags when building the published
 * snapshot (a flagged reading never reaches the live page as fresh data).
 */
export function runValidationSuite(inputs: ValidationInputs): ValidationOutcome {
  const results: ValidationTestResult[] = [
    t01Reconciliation(inputs),
    t02DerivedValues(inputs),
    t03Dates(inputs),
    t04Freshness(inputs),
    t05KnownRecords(inputs),
    t06TextMatchesStatus(inputs),
    t07ForbiddenWords(inputs),
    t08SuspiciousValues(inputs),
    t09Counts(inputs),
    t10Units(),
    t11SameStatus(inputs),
    t12RelationshipRules(inputs),
    t13SourcePresent(inputs),
    t14RegressionFixtures(inputs),
  ];
  // Assemble the flags: the tests that HOLD a bad value (T-01, T-02, T-03,
  // T-04, T-08, T-13) mark their readings; T-05 strips the peak claim.
  const holdTests = new Set(['T-01', 'T-02', 'T-03', 'T-04', 'T-08', 'T-13']);
  const flags = new Map<IndicatorId, SafetyFlag>();
  for (const res of results) {
    for (const id of res.flagged) {
      if (res.test === 'T-05') {
        flags.set(id, { test: res.test, reason: res.failures.join('; '), holdLastGood: false, stripPeak: true });
      } else if (holdTests.has(res.test)) {
        flags.set(id, { test: res.test, reason: res.failures.join('; '), holdLastGood: true });
      }
    }
  }
  return { results, flags };
}
