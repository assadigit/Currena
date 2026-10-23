/**
 * Phase I3 snapshot assembly — the pure functions that turn collected
 * indicator series into the exact wire payloads the runner stores:
 *
 *   buildInsightsSnapshot — readings + summaries + changedThisWeek merge
 *                           + calendar → InsightsSnapshot (validated)
 *   buildHistoryFile      — one indicator series → downsampled 10-year
 *                           IndicatorHistory (validated)
 *   buildInsightsStatus   — per-source fetch reports → InsightsStatus
 *
 * Everything here is deterministic given its inputs (frozen clock passed in,
 * AGENTS.md rule 2 style) so the ingest script is a thin shell around these.
 *
 * Fix spec 2026-10-14 additions:
 *  - A-03/A-04: `flags` (from runValidationSuite) hold the LAST GOOD value
 *    of a flagged reading with status `check-pending` — the fresh bad value
 *    never reaches the live page, and the reason rides on the reading.
 *  - B-05: `releaseDate` is the release that PUBLISHED THE SHOWN DATA (the
 *    earliest schedule entry after the observation's period end), and
 *    `nextReleaseToday` marks "newer data due today, not yet in".
 *  - B-06: `decidedDate` for the policy-rate cards (from the hand-maintained
 *    data/policy-decisions.json) — "decided 16 Sep 2026 · effective 17 Sep".
 *  - B-01: `peaks` (value + date + basis) attach to the price rows, and
 *    fromPeak10y is recomputed against the stated peak.
 *  - B-10: `gapLegs` records the AU and US legs' own dates so the gap card
 *    can show both dates and the "dates differ" tag.
 *  - B-19: `highestSince` years (yields: the last time the value was this
 *    high, from the full stored history).
 *  - B-04: the home-loan reading carries `sinceDecision` — its change since
 *    the latest RBA cash-rate decision (the pass-through card's rule).
 *  - A-06: `contextNotes` (human-written, dated, expiring) attach to their
 *    readings when unexpired; nothing shows by default.
 *  - A-07: the snapshot carries `ruleVersion`.
 */

import type { CalendarEvent, IndicatorHistory, IndicatorId, InsightsSnapshot, InsightsSourceReport, InsightsStatus, IndicatorReading } from '@currena/core';
import { InsightsSnapshotSchema, IndicatorHistorySchema, InsightsStatusSchema } from '@currena/core';
import { changedSince, computeReading, PERCENTILE_WINDOW_DAYS, type AuxSeries, type ReadingSource } from '../scoring';
import { summarizeByGauges } from '../gauges';
import { DEFINITIONS } from '../definitions';
import { RULE_VERSION } from '../ruleVersion';
import type { SafetyFlag } from '../validation';
import { addDays, epochDay, fromEpochDay, pointAtOrBefore, type SeriesPoint } from '../series';
import { AUX_RULE_WIRING, READING_SOURCES } from './derived';
import { SANITY_RANGES, withinSanityRange, upstreamLegsFor } from '../sources';

/**
 * Step-1 audit items A2/A3 + fix spec B-05 (2026-10-14): a hand-maintained
 * release event (official publication dates for the monthly/quarterly
 * series — data/insights-release-schedule.json). The ingest stamps the
 * matching readings with the release date OF THE DATA SHOWN (see
 * releaseDateOf below) so a card never says "released Oct 14" about August
 * data while September's release is still hours away.
 */
/** Step 3 L2-02: the price rows the 200-day-average gap is computed for. */
const L2_02_IDS: ReadonlySet<string> = new Set(['brent', 'gold-usd', 'silver-usd', 'btc-usd']);

export interface ReleaseScheduleEntry {
  /** The official release (publication) date. */
  date: string;
  /** The indicator ids this release published for. */
  affects: readonly IndicatorId[];
}

/** Validate the raw JSON of data/insights-release-schedule.json (loud, never garbage). */
export function parseReleaseSchedule(raw: unknown): readonly ReleaseScheduleEntry[] {
  if (!Array.isArray(raw)) throw new Error('release schedule: expected a JSON array');
  const out: ReleaseScheduleEntry[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) throw new Error('release schedule: entry is not an object');
    const { date, affects } = entry as { date?: unknown; affects?: unknown };
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`release schedule: bad date "${String(date)}"`);
    }
    if (!Array.isArray(affects) || affects.some((id) => typeof id !== 'string')) {
      throw new Error(`release schedule: bad affects list at ${date}`);
    }
    out.push({ date, affects: affects as readonly IndicatorId[] });
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/** Fix spec B-06: a hand-maintained policy decision (decided + effective dates). */
export interface PolicyDecision {
  /** The policy-rate indicator the decision belongs to. */
  id: IndicatorId;
  /** The decision (announcement) date. */
  decided: string;
  /** The date the new rate took effect (the series' step date). */
  effective: string;
  /** The step's size in points (cross-check against the series). */
  points?: number;
}

/** Validate the raw JSON of data/policy-decisions.json (loud, never garbage). */
export function parsePolicyDecisions(raw: unknown): readonly PolicyDecision[] {
  if (!Array.isArray(raw)) throw new Error('policy decisions: expected a JSON array');
  const out: PolicyDecision[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) throw new Error('policy decisions: entry is not an object');
    const { id, decided, effective, points } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof decided !== 'string' || typeof effective !== 'string') {
      throw new Error('policy decisions: id/decided/effective must be strings');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(decided) || !/^\d{4}-\d{2}-\d{2}$/.test(effective)) {
      throw new Error(`policy decisions: bad dates at ${id}`);
    }
    if (points !== undefined && typeof points !== 'number') throw new Error(`policy decisions: bad points at ${id}`);
    out.push({ id: id as IndicatorId, decided, effective, ...(points !== undefined ? { points } : {}) });
  }
  return out;
}

/** Fix spec A-06: a human-written context note with an author date and an expiry date. */
export interface ContextNote {
  /** The indicator the note explains (or '*' for the page-level note). */
  id: string;
  text: string;
  authored: string;
  expires: string;
}

/** Validate the raw JSON of data/insights-context-notes.json (loud, never garbage). */
export function parseContextNotes(raw: unknown): readonly ContextNote[] {
  if (!Array.isArray(raw)) throw new Error('context notes: expected a JSON array');
  const out: ContextNote[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) throw new Error('context notes: entry is not an object');
    const { id, text, authored, expires } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || typeof text !== 'string' || text.length === 0) {
      throw new Error('context notes: id and text must be non-empty strings');
    }
    if (typeof authored !== 'string' || typeof expires !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(authored) || !/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
      throw new Error(`context notes: bad dates at ${id}`);
    }
    out.push({ id, text, authored, expires });
  }
  return out;
}

/** Fix spec B-01: a price row's full-history peak. */
export interface PeakInput {
  value: number;
  date: string;
  basis: 'daily-high' | 'daily-close';
}

export interface SnapshotBuildInputs {
  /** Assembled indicator series (buildIndicatorSeries output). */
  series: Partial<Record<IndicatorId, SeriesPoint[]>>;
  /**
   * The previously STORED snapshot, when one exists — its readings feed the
   * "what changed this week" diff, its accumulated events are carried
   * forward (a daily runner only remembers yesterday otherwise), and (Step-1
   * audit item H3) a MISSING series now holds its last good reading marked
   * `stale` instead of collapsing to `unavailable`.
   */
  previous?: InsightsSnapshot | undefined;
  /** Hand-maintained calendar entries (data/insights-calendar.json). */
  calendar: readonly CalendarEvent[];
  /** Hand-maintained release schedule (data/insights-release-schedule.json). */
  releaseSchedule?: readonly ReleaseScheduleEntry[];
  /**
   * Step-1 audit item A1: the DFEDTARU series (upper bound of the Fed
   * target range) — attached to the fed-target reading as `rangeHigh`.
   */
  fedTargetUpper?: SeriesPoint[];
  /**
   * Fix spec B-06: hand-maintained policy decisions
   * (data/policy-decisions.json) — stamps `decidedDate` on the policy-rate
   * readings whose `lastChange` matches the effective date.
   */
  policyDecisions?: readonly PolicyDecision[];
  /**
   * Fix spec B-01: full-history peaks for the price rows (computed by the
   * ingest from the Yahoo daily-high series for the metals and Bitcoin, and
   * the daily-close series for Brent).
   */
  peaks?: Partial<Record<IndicatorId, PeakInput>>;
  /**
   * Fix spec B-19: the "highest since {year}" years for long-history
   * series (computed by the ingest from the full fetched history).
   */
  highestSince?: Partial<Record<IndicatorId, number>>;
  /**
   * 2026-10-22 reliability round: reading-id → honest source attribution
   * when a FALLBACK source filled the reading's slot this run (e.g. the
   * US Treasury's own curve when FRED's bulk group failed). Absent → the
   * static READING_SOURCES line (the healthy-run attribution).
   */
  sourceOverrides?: Partial<Record<IndicatorId, { name: string; url: string }>>;
  /**
   * Fix spec A-06: human-written context notes (data/insights-context-notes.json).
   * Expired notes are filtered out here — they never reach the page.
   */
  contextNotes?: readonly ContextNote[];
  /**
   * Fix spec A-03/A-04: the validation suite's safety flags — a flagged
   * reading holds its LAST GOOD value with status `check-pending`.
   * Applied AFTER the deterministic base (see baseReadingCache) so the
   * draft and final builds share work.
   */
  flags?: ReadonlyMap<IndicatorId, SafetyFlag>;
  /**
   * 2026-10-23 CPU round (the rung exceededCpu fix): memoize the
   * DETERMINISTIC per-reading base — computeReading plus the release/
   * peak/period/note enrichments, everything BEFORE the flag/sanity/
   * outcome steps. runInsightsUpdate builds the snapshot TWICE (the
   * draft that feeds the validation suite, then the final with the
   * safety flags); the two calls differ ONLY in `flags`, which applies
   * after the cache point — so the second build replays instead of
   * recomputing (the percentile work over 10-year windows was the CPU
   * that killed the 04:10 rung on the free plan's budget). Clone-on-hit
   * keeps each build's post-cache reassignments private.
   */
  baseReadingCache?: Map<string, IndicatorReading>;
  /**
   * Defect E-08 (2026-10-16): manual-entry expiries (id → the next
   * scheduled release, from each data/manual/<id>.json file's `expires`).
   * A manual reading whose expiry has passed wears the stale tag — an
   * entry no one has refreshed can never read as current.
   */
  manualExpires?: Readonly<Record<string, string>>;
  /**
   * v3 M-6 (2026-10-20): ids whose source legs include a register row with
   * enabled=false (the kill switch). Their cards go dark — status
   * 'unavailable', value hidden — and the public projection drops them.
   */
  disabledReadings?: readonly string[];
  /**
   * v3 T-27/F-16 (2026-10-20): per-PROVIDER fetch outcomes from the collect
   * report ('blocked' | 'format-changed'). Readings whose legs include the
   * provider carry the honest one-line reason (a block is a block; a format
   * change means can't-tell until re-verified) — never a verdict.
   */
  sourceOutcomes?: Readonly<Record<string, 'blocked' | 'format-changed'>>;
  /** The run's clock (ISO 8601 UTC) — generatedAt and every reading's updatedAt. */
  now: string;
}

/* ------------------------------------------------------------------ *
 * Date helpers (UTC, pure)
 * ------------------------------------------------------------------ */

/** The last day of the observation's month (asOf is month-start dated). */
function monthEndOf(iso: string): string {
  const [y, m] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** The first day of the month `months` after the observation's month. */
function monthStartPlus(iso: string, months: number): string {
  const [y, m] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1 + months, 1)).toISOString().slice(0, 10);
}

/** The end of the observation's period: month-end for monthlies, quarter-end for quarterlies. */
function periodEndOf(cadence: 'monthly' | 'quarterly', asOf: string): string {
  return cadence === 'monthly' ? monthEndOf(asOf) : monthEndOf(monthStartPlus(asOf, 2));
}

/**
 * Defect E-07 (2026-10-16): the quarter a QUARTERLY observation belongs to,
 * named by its END month regardless of whether the source series dates the
 * quarter by its start (ABS/FRED: 2026-04-01) or its end (RBA E2:
 * 2026-06-30) — both label as "June quarter 2026". Returns the period's
 * first and last day, or undefined when `asOf` is not a quarter boundary.
 */
export function quarterPeriodOf(asOf: string): { start: string; end: string } | undefined {
  const [y, m, d] = asOf.split('-').map(Number) as [number, number, number];
  // Quarter-START dated: Jan/Apr/Jul/Oct day 01. Quarter-END dated: the
  // last day of Mar/Jun/Sep/Dec.
  const isQuarterStart = d === 1 && (m === 1 || m === 4 || m === 7 || m === 10);
  const endDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const isQuarterEnd = (m === 3 || m === 6 || m === 9 || m === 12) && d === endDay;
  if (isQuarterStart) {
    return { start: asOf, end: monthEndOf(monthStartPlus(asOf, 2)) };
  }
  if (isQuarterEnd) {
    return { start: monthStartPlus(asOf, -2), end: asOf };
  }
  return undefined;
}

/**
 * Fix spec B-05: the release date OF THE DATA SHOWN — the earliest schedule
 * entry dated after the observation's period end (that is the release that
 * published this observation). The OLD behaviour (the latest entry ≤ today)
 * stamped October's release date onto August data while September's release
 * was still hours away.
 */
function releaseDateOf(
  id: IndicatorId,
  cadence: 'monthly' | 'quarterly',
  asOf: string,
  schedule: readonly ReleaseScheduleEntry[],
  nowDay: string,
): string | undefined {
  const periodEnd = periodEndOf(cadence, asOf);
  const candidates = schedule.filter((e) => e.affects.includes(id) && e.date > periodEnd && e.date <= nowDay);
  return candidates.length > 0 ? candidates[0]!.date : undefined;
}

/**
 * Fix spec B-05: is NEWER data due TODAY and not yet in? True when the
 * earliest upcoming schedule entry for the indicator is today AND the
 * reading's observation predates the month that entry publishes (the
 * month before today).
 */
function nextReleaseToday(
  id: IndicatorId,
  asOf: string,
  schedule: readonly ReleaseScheduleEntry[],
  nowDay: string,
): boolean {
  const upcoming = schedule.filter((e) => e.affects.includes(id) && e.date >= nowDay);
  if (upcoming.length === 0 || upcoming[0]!.date !== nowDay) return false;
  const publishesFrom = monthStartPlus(nowDay, -1); // a monthly release publishes last month
  return asOf < publishesFrom;
}

/* ------------------------------------------------------------------ *
 * The snapshot builder
 * ------------------------------------------------------------------ */

/**
 * Build the full snapshot. Missing series produce honest `unavailable`
 * readings (never omitted — the contract promises one reading per indicator
 * id). The result is schema-validated: the runner refuses to write a
 * snapshot that would not survive the Worker's read-side validation.
 */
/**
 * v3 T-27/F-16 (2026-10-20): the honest one-line reason when a reading's
 * provider was blocked or came back format-changed this run. A block is a
 * block — no verdict rides on it.
 */
function outcomeFlagFor(
  def: { id: string; source: string; sourceRef: string },
  sourceOutcomes?: Readonly<Record<string, 'blocked' | 'format-changed'>>,
): IndicatorReading['flag'] {
  if (!sourceOutcomes) return undefined;
  const legProviders = new Set(upstreamLegsFor(def).map((leg) => leg.split(':')[0]));
  for (const [provider, outcome] of Object.entries(sourceOutcomes)) {
    if (!legProviders.has(provider)) continue;
    return outcome === 'blocked'
      ? { test: 'T-27', reason: 'source blocked by the site — no retry until the next scheduled refresh (fail closed)' }
      : { test: 'F-16', reason: "source format changed — can't tell right now until the response shape is re-verified" };
  }
  return undefined;
}

export function buildInsightsSnapshot(inputs: SnapshotBuildInputs): InsightsSnapshot {
  const readings: IndicatorReading[] = [];
  const nowDayIso = inputs.now.slice(0, 10);
  const schedule = inputs.releaseSchedule ?? [];
  const notesByIndicator = new Map<string, ContextNote>();
  for (const note of inputs.contextNotes ?? []) {
    // A-06: expired notes disappear here — they never reach the page.
    if (note.expires >= nowDayIso) notesByIndicator.set(note.id, note);
  }
  for (const def of DEFINITIONS) {
    const source: ReadingSource =
      inputs.sourceOverrides?.[def.id] ?? READING_SOURCES[def.id] ?? { name: def.sourceRef };
    const series = inputs.series[def.id];
    const flag = inputs.flags?.get(def.id);
    // v3 T-27/F-16: the run's honest fetch outcome for this reading's
    // providers (blocked / format-changed) — attached in BOTH paths below.
    const outcomeFlag = outcomeFlagFor(def, inputs.sourceOutcomes);

    if (!series) {
      // Step-1 audit item H3: a failed fetch HOLDS the last good value —
      // carried forward with its ORIGINAL asOf (never today's date) and
      // status `stale` (visible honesty, excluded from every count).
      const held = inputs.previous?.readings.find((r) => r.id === def.id);
      if (held && held.value !== null && held.asOf !== null) {
        readings.push({
          id: def.id,
          value: held.value,
          asOf: held.asOf,
          status: 'stale',
          sourceName: source.name,
          sourceUrl: source.url,
          updatedAt: inputs.now,
          ...(outcomeFlag ? { flag: outcomeFlag } : {}),
        });
      } else {
        readings.push({
          id: def.id,
          value: null,
          asOf: null,
          status: 'unavailable',
          sourceName: source.name,
          sourceUrl: source.url,
          updatedAt: inputs.now,
          ...(outcomeFlag ? { flag: outcomeFlag } : {}),
        });
      }
      continue;
    }
    // I15: below-aux rules get their paired series (wage growth vs CPI).
    const auxOf = AUX_RULE_WIRING[def.id];
    const auxSeries = auxOf ? auxOf(inputs.series) : undefined;
    const aux: AuxSeries | undefined = auxSeries ? { series: auxSeries } : undefined;
    let reading: IndicatorReading;
    const cachedBase = inputs.baseReadingCache?.get(def.id);
    if (cachedBase !== undefined) {
      // 2026-10-23 CPU round: replay the deterministic base (the steps
      // below only reassign or clone — the clone keeps them private).
      reading = { ...cachedBase };
    } else {
      reading = computeReading(def, series, inputs.now, source, aux);

      // ---- Fix spec B-05: the real release date of the data shown. ----
      if (reading.asOf !== null && (def.cadence === 'monthly' || def.cadence === 'quarterly')) {
        const releaseDate = releaseDateOf(def.id, def.cadence, reading.asOf, schedule, nowDayIso);
        if (releaseDate !== undefined) reading.releaseDate = releaseDate;
        if (nextReleaseToday(def.id, reading.asOf, schedule, nowDayIso)) {
          (reading as { nextReleaseToday?: boolean }).nextReleaseToday = true;
        }
      }

      // ---- Step 3 L2-02: the price's gap to its 200-day average. ----
      if (reading.asOf !== null && reading.value !== null && L2_02_IDS.has(def.id)) {
        const pts = series;
        if (pts.length >= 200) {
          const last200 = pts.slice(-200);
          const avg = last200.reduce((sum, p) => sum + p.value, 0) / last200.length;
          if (avg > 0) reading.ma200GapPct = ((reading.value - avg) / avg) * 100;
        }
      }

      // ---- Defect E-07: quarterly readings carry their period's bounds. ----
      if (def.cadence === 'quarterly' && reading.asOf !== null) {
        const q = quarterPeriodOf(reading.asOf);
        if (q !== undefined) {
          reading.periodStart = q.start;
          reading.periodEnd = q.end;
        }
      }

      // ---- Defect E-08: an expired manual entry wears the stale tag. ----
      const manualExpiry = inputs.manualExpires?.[def.id];
      if (manualExpiry !== undefined && nowDayIso > manualExpiry && reading.status !== 'unavailable') {
        reading.status = 'stale';
        reading.flag = {
          test: 'E-08',
          reason: `manual entry expired on ${manualExpiry} (next scheduled release) — update data/manual/${def.id}.json`,
        };
      }

      // ---- Fix spec B-01: the full-history peak on the price rows. ----
      const peak = inputs.peaks?.[def.id];
      if (peak !== undefined && reading.value !== null && peak.value > 0) {
        reading.peak = { value: peak.value, date: peak.date, basis: peak.basis };
        reading.fromPeak10y = ((reading.value - peak.value) / peak.value) * 100;
      }

      // ---- Fix spec B-19: "highest since {year}" for long-history series. ----
      const sinceYear = inputs.highestSince?.[def.id];
      if (sinceYear !== undefined) reading.highestSinceYear = sinceYear;

      // ---- Fix spec B-10: the AU−US gap's legs' own dates. ----
      if (def.id === 'au-us-10y-gap' && reading.asOf !== null) {
        const au = inputs.series['au-10y'];
        const us = inputs.series['us10y'];
        const auLast = au?.[au.length - 1]?.date;
        const usLast = us?.[us.length - 1]?.date;
        if (auLast !== undefined && usLast !== undefined) {
          reading.gapLegs = {
            a: { id: 'au-10y', asOf: auLast },
            b: { id: 'us10y', asOf: usLast },
          };
        }
      }

      // ---- Fix spec B-04: the loan reading's change since the RBA decision. ----
      if (def.id === 'au-home-loan' && reading.asOf !== null && reading.value !== null) {
        const cash = inputs.series['rba-cash-rate'];
        const decision = lastStepOf(cash ?? [], reading.asOf);
        if (decision !== undefined && decision.date <= reading.asOf) {
          const before = pointAtOrBefore(series, decision.date);
          if (before !== undefined) {
            reading.sinceDecision = { decisionDate: decision.date, points: reading.value - before.value };
          }
        }
      }

      // ---- Fix spec B-06: the policy cards' decided + effective dates. ----
      if (reading.lastChange !== undefined && inputs.policyDecisions !== undefined) {
        const match = inputs.policyDecisions.find(
          (d) => d.id === def.id && d.effective === reading.lastChange!.date,
        );
        if (match !== undefined) reading.decidedDate = match.decided;
      }

      // ---- Fix spec A-06: an unexpired context note rides its reading. ----
      const note = notesByIndicator.get(def.id as string);
      if (note !== undefined) {
        reading.note = { text: note.text, authored: note.authored, expires: note.expires };
      }

      // 2026-10-23 CPU round: the deterministic base ends here — cache it
      // (pre-flag, pre-sanity, pre-outcome; those steps replay per build).
      inputs.baseReadingCache?.set(def.id, { ...reading });
    }

    // ---- Fix spec A-03/A-04: apply the validation safety flags. ----
    if (flag !== undefined) {
      reading = applyFlag(reading, flag, inputs.previous, inputs.now);
    }

    // ---- v3 T-28 / F-14 (2026-10-20): definitional sanity range. ----
    // A value outside its own definition's band is REJECTED — the value is
    // hidden and the card shows can't tell right now (never a wrong number).
    const sanityBand = SANITY_RANGES[def.id as string];
    if (sanityBand !== undefined && reading.value !== null && !withinSanityRange(def.id as string, reading.value)) {
      const bandText = sanityBand.minExclusive
        ? 'must be greater than zero'
        : `must sit in ${sanityBand.min ?? '-∞'} to ${sanityBand.max ?? '∞'}`;
      reading = {
        ...reading,
        value: null,
        asOf: null,
        status: 'unavailable',
        flag: {
          test: 'T-28',
          reason: `value outside its allowed range (${bandText}) — rejected, can't tell right now`,
        },
      };
    }

    // ---- v3 M-6 kill switch (2026-10-20): the source was disabled in the ----
    // ---- register — its cards go dark, value hidden, never a verdict. ----
    if ((inputs.disabledReadings ?? []).includes(def.id as string) && reading.status !== 'unavailable') {
      reading = {
        ...reading,
        value: null,
        asOf: null,
        status: 'unavailable',
        flag: { test: 'M-6', reason: 'source disabled (kill switch) — its cards are off until the owner re-enables it in the source registry' },
      };
    }

    // ---- v3 T-27/F-16 (2026-10-20): a blocked or format-changed source ----
    // ---- names the honest reason on the reading it feeds. ----
    if (outcomeFlag !== undefined && reading.flag === undefined) {
      reading = { ...reading, flag: outcomeFlag };
    }

    readings.push(reading);
  }

  // Step-1 audit item A1: the Fed corridor's true bounds. The reading's
  // value IS the lower bound (DFEDTARL); the upper bound rides alongside.
  const fedReading = readings.find((r) => r.id === 'fed-target');
  if (fedReading && fedReading.value !== null && inputs.fedTargetUpper && inputs.fedTargetUpper.length > 0) {
    const upper = pointAtOrBefore(inputs.fedTargetUpper, nowDayIso);
    if (upper && upper.value >= fedReading.value) {
      fedReading.rangeLow = fedReading.value;
      fedReading.rangeHigh = upper.value;
    }
  }

  const summary = summarizeByGauges(readings);

  // "What changed this week": today's vote flips (vs the previous snapshot's
  // readings) MERGED with the still-fresh events the previous snapshot had
  // accumulated — a daily runner must remember the whole week, not just the
  // last day. Today's event wins per id (a double flip shows the latest leg).
  const flipsToday = inputs.previous ? changedSince(inputs.previous.readings, readings, inputs.now) : [];
  const windowDays = 7;
  const nowDay = epochDay(nowDayIso);
  const carried = (inputs.previous?.changedThisWeek ?? []).filter((e) => nowDay - epochDay(e.asOf) <= windowDays);
  const byId = new Map<string, (typeof carried)[number]>();
  for (const event of carried) byId.set(event.id, event);
  for (const event of flipsToday) byId.set(event.id, event);
  const changedThisWeek = [...byId.values()].sort((a, b) => (a.asOf < b.asOf ? -1 : a.asOf > b.asOf ? 1 : a.id.localeCompare(b.id)));

  return InsightsSnapshotSchema.parse({
    generatedAt: inputs.now,
    summary,
    readings,
    changedThisWeek,
    // Defect E-09 (2026-10-16): released events (their date has passed) are
    // history — they never ride the snapshot's calendar again, so neither
    // the page's "Next up" strip nor the export can list a past release as
    // upcoming. The hand-maintained file keeps the entries (the archive
    // pages may want them); the snapshot shows only today-and-future.
    calendar: inputs.calendar.filter((e) => e.date >= nowDayIso),
    ruleVersion: RULE_VERSION,
  });
}

/** The most recent step change in a series on or before `asOf` (the RBA decision). */
function lastStepOf(series: readonly SeriesPoint[], asOf: string): { date: string; points: number } | undefined {
  const current = pointAtOrBefore(series, asOf);
  if (!current) return undefined;
  const idx = series.findIndex((p) => p.date === current.date);
  for (let i = idx; i > 0; i--) {
    const cur = series[i]!;
    const prev = series[i - 1]!;
    if (cur.value !== prev.value) return { date: cur.date, points: cur.value - prev.value };
  }
  return undefined;
}

/* ------------------------------------------------------------------ *
 * The PUBLIC projection (2026-10-19 owner decree; Step 3 §2.2 AC-08)
 * ------------------------------------------------------------------ */

/**
 * Project a validated snapshot onto the PUBLIC-DISPLAY-OK subset: drop every
 * reading whose id is in the hidden set (data/site-mode-overrides.json —
 * generated; every licence verdict other than 'yes', fail-closed 'unknown'
 * included), drop its changed-this-week events, recompute the hero summaries
 * over exactly what remains, and stamp displayMode 'public'.
 *
 * Pure subset semantics: the surviving readings carry ALL their enrichments
 * (peaks, release dates, highest-since, notes, flags) unchanged, and the
 * summaries come from the SAME summarizeByGauges the full snapshot uses — a
 * public verdict can never contradict its own gauges (the R2 invariant).
 * The daily ingest runs this right after the private snapshot is built, and
 * scripts/public-projection.ts uses it to backfill the public KV keys from a
 * stored snapshot (first flip / KV recreation) without re-fetching anything.
 */
export function projectSnapshotToPublic(
  snapshot: InsightsSnapshot,
  hiddenIds: ReadonlySet<string>,
): InsightsSnapshot {
  const readings = snapshot.readings.filter((r) => !hiddenIds.has(r.id));
  return InsightsSnapshotSchema.parse({
    generatedAt: snapshot.generatedAt,
    displayMode: 'public',
    summary: summarizeByGauges(readings),
    readings,
    changedThisWeek: snapshot.changedThisWeek.filter((e) => !hiddenIds.has(e.id)),
    calendar: snapshot.calendar,
    ruleVersion: snapshot.ruleVersion,
  });
}

/**
 * Fix spec A-04: hold the LAST GOOD value of a flagged reading, mark it
 * `check-pending`, record the reason, and strip the derived fields computed
 * from the bad value — the flagged number never reaches the live page.
 */
function applyFlag(
  reading: IndicatorReading,
  flag: SafetyFlag,
  previous: InsightsSnapshot | undefined,
  now: string,
): IndicatorReading {
  const held: IndicatorReading = { ...reading };
  if (flag.stripPeak === true) {
    delete held.peak;
    delete held.fromPeak10y;
    return held;
  }
  if (!flag.holdLastGood) return held;
  const lastGood = previous?.readings.find(
    (r) => r.id === reading.id && r.status !== 'check-pending' && r.status !== 'unavailable' && r.value !== null && r.asOf !== null,
  );
  if (lastGood !== undefined) {
    held.value = lastGood.value;
    held.asOf = lastGood.asOf;
    if (lastGood.releaseDate !== undefined) held.releaseDate = lastGood.releaseDate;
  }
  held.status = 'check-pending';
  held.flag = { test: flag.test, reason: flag.reason };
  delete held.change7d;
  delete held.change30d;
  delete held.change90d;
  delete held.moveScore;
  delete held.percentile10y;
  delete held.fromPeak10y;
  delete held.peak;
  delete held.highestSinceYear;
  held.updatedAt = now;
  return held;
}

/* ------------------------------------------------------------------ *
 * History files
 * ------------------------------------------------------------------ */

/**
 * Cap on stored points per indicator. Step-2 add-list §A: every new series
 * keeps "at least 10 years of monthly data and at least 2 years of daily
 * data (10 years if the source allows)". 10 years of DAILY data is ~2,600
 * business-day points, so the old 520 cap (weekly-ish resolution) is raised
 * to 2,700 — dailies now store their FULL 10-year daily window (VIXCLS,
 * DGS10, F2, F1 …), monthly/quarterly series never approach the cap, and
 * each key stays ≈40 KB (KV's per-value limit is 25 MB; the whole Insights
 * history set is well under 2 MB of the 1 GB free tier). The stride only
 * guards a pathological future series denser than ~2,700 points per decade.
 */
export const HISTORY_MAX_POINTS = 2700;

/** Same 10-year window the scoring engine's percentiles use. */
export const HISTORY_WINDOW_DAYS = PERCENTILE_WINDOW_DAYS;

/**
 * Keep at most `maxPoints` evenly-strided points, always ending on the LAST
 * observation (the chart's right edge must be the current value, never a
 * strided miss). Pure; order-preserving.
 */
export function downsampleSeries(series: readonly SeriesPoint[], maxPoints = HISTORY_MAX_POINTS): SeriesPoint[] {
  if (series.length <= maxPoints) return [...series];
  const stride = Math.ceil(series.length / maxPoints);
  const out: SeriesPoint[] = [];
  for (let i = 0; i < series.length; i += stride) out.push(series[i]!);
  const last = series[series.length - 1]!;
  if (out[out.length - 1]!.date !== last.date) out.push(last);
  return out;
}

/**
 * Options for {@link buildHistoryFile}.
 */
interface BuildHistoryFileOptions {
  /**
   * Minimum observation count that still emits a file — 2 by default
   * (single-point "live" cards like gold-btc/silver-btc/gold-aud get no
   * history key and the endpoint answers 404, the honest "no chart"
   * state). The ingest runner passes 1 for the accumulated-daily rows:
   * a row with no monthly base (btc-usd) must persist its FIRST daily
   * point or the accumulation can never bootstrap — every run would
   * rebuild a single live point and the 7/30-day changes the data spec
   * §3 promises would never appear (2026-10-08 production evidence).
   */
  minPoints?: number;
}

/**
 * One indicator's stored history: the last 10 years (anchored on the newest
 * observation, mirroring the scoring percentile base), downsampled to
 * HISTORY_MAX_POINTS, encoded as [epochDay, value] pairs. Returns undefined
 * for series below the `minPoints` floor (2 by default).
 */
export function buildHistoryFile(
  id: IndicatorId,
  series: readonly SeriesPoint[],
  opts: BuildHistoryFileOptions = {},
): IndicatorHistory | undefined {
  const minPoints = opts.minPoints ?? 2;
  if (series.length < minPoints) return undefined;
  const last = series[series.length - 1]!;
  const windowStart = addDays(last.date, -HISTORY_WINDOW_DAYS);
  const windowed = series.filter((p) => p.date >= windowStart);
  const kept = downsampleSeries(windowed);
  return IndicatorHistorySchema.parse({
    v: 1,
    id,
    points: kept.map((p) => [epochDay(p.date), p.value] as [number, number]),
  });
}

/**
 * I15: decode a stored IndicatorHistory back into dated points so the next
 * run can seed the accumulated-daily series (see SeriesInputs.seedHistory).
 * Pure — the runner calls it right after store.getHistory().
 */
export function historyToSeries(history: IndicatorHistory): SeriesPoint[] {
  return history.points.map(([day, value]) => ({ date: fromEpochDay(day), value }));
}

/* ------------------------------------------------------------------ *
 * Run status
 * ------------------------------------------------------------------ */

interface StatusBuildInputs {
  reports: readonly InsightsSourceReport[];
  generatedAt: string;
  mode: InsightsStatus['mode'];
  dryRun: boolean;
  /** Fix spec Part D: the validation suite's results (readonly in, copied out). */
  validation?: readonly NonNullable<InsightsStatus['validation']>[number][];
}

/** The per-source freshness record for /admin (insights:status). */
export function buildInsightsStatus(inputs: StatusBuildInputs): InsightsStatus {
  return InsightsStatusSchema.parse({
    v: 1,
    generatedAt: inputs.generatedAt,
    mode: inputs.mode,
    dryRun: inputs.dryRun,
    sources: [...inputs.reports],
    ...(inputs.validation !== undefined ? { validation: [...inputs.validation] } : {}),
    ruleVersion: RULE_VERSION,
  });
}
