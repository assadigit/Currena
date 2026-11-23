/**
 * S12 Calibration layer — the desk scorecard.
 *
 * Makes the desk's honesty measurable: a rolling scorecard over what the
 * desk has already published and what gold actually did. Everything below
 * reads back from what the desk already persists — cached DeskDay rows
 * (published bias, scenario calls, dataMode) and the S10 Observation store
 * (realized gold closes). No new scraping, no engine rebuild, no network:
 * cache-first, server-side, reachable only from API-route code.
 *
 * Honesty rules that bind this module (mirroring S11):
 *
 * - Realized math pools LIVE-ERA desk days only (live/mixed rows with an
 *   observed close on the day itself). Modelled-era days (pre-S10 rows and
 *   fallback builds) stay in the record — labelled, counted, never graded.
 * - Every score states its sample size; every day states its era and its
 *   exclusions. Flat/neutral/in-flight/tied-favourite days are counted
 *   separately and never silently folded into a rate.
 * - Scenario targets carry a 90-day horizon; grades are drawn against the
 *   latest observed close so far (to-date), never claimed as end-of-
 *   horizon verdicts.
 * - Small samples stay small on the surface: the payload carries the
 *   numbers, the band refuses to call them a verdict.
 */

import { db } from "@/lib/db";
import type {
  BiasDirectionScore,
  BriefingPayload,
  CalibrationBucket,
  CalibrationDayRow,
  CalibrationPayload,
  CalibrationRecordComposition,
  ProbabilityCalibrationScore,
  Scenario,
  ScenarioAccuracyScore,
} from "./types";

/* ------------------------------------------------------------------ */
/* Cached-row readers (the same sources the S11 archive reads)          */
/* ------------------------------------------------------------------ */

interface CachedDesk {
  date: string;
  dataMode: string;
  narrativeSource: string;
  briefing: BriefingPayload;
}

async function loadCachedDesks(): Promise<CachedDesk[]> {
  const rows = await db.deskDay.findMany({
    orderBy: { date: "asc" },
    select: {
      date: true,
      dataMode: true,
      narrativeSource: true,
      briefingJson: true,
    },
  });
  return rows.map((row) => ({
    date: row.date,
    dataMode: row.dataMode,
    narrativeSource: row.narrativeSource,
    briefing: JSON.parse(row.briefingJson) as BriefingPayload,
  }));
}

/** Observed gold closes, ascending — the realized path. */
async function goldObservations(): Promise<
  { date: string; close: number }[]
> {
  return db.observation.findMany({
    where: { dataset: "gold" },
    orderBy: { date: "asc" },
    select: { date: true, close: true },
  });
}

function isLiveEra(mode: string): boolean {
  return mode === "live" || mode === "mixed";
}

/** The latest observed gold close strictly after a date (the realized-to-date anchor, S11 semantics). */
function realizedCloseAfter(
  observations: { date: string; close: number }[],
  date: string
): { date: string; close: number } | null {
  let latest: { date: string; close: number } | null = null;
  for (const o of observations) {
    if (o.date <= date) continue;
    if (!latest || o.date > latest.date) latest = o;
  }
  return latest;
}

/** A next-day move at or under this magnitude is graded flat (a repeat, not a direction call). */
const FLAT_EPSILON_PCT = 0.005;

/** The rolling recent window for the scorecard, in resolved days. */
const RECENT_WINDOW_DAYS = 10;

/* ------------------------------------------------------------------ */
/* Per-day grading                                                      */
/* ------------------------------------------------------------------ */

/**
 * The highest-probability scenario on a day. A tie at the top means the
 * day has no single favourite — returned as null and counted separately.
 */
function favouredScenario(
  scenarios: Scenario[]
): { id: Scenario["id"]; probability: number } | null {
  let best: Scenario | null = null;
  let tied = false;
  for (const s of scenarios) {
    if (!best || s.probability > best.probability) {
      best = s;
      tied = false;
    } else if (s.probability === best.probability) {
      tied = true;
    }
  }
  if (!best || tied) return null;
  return { id: best.id, probability: best.probability };
}

/**
 * Grade one cached day against the observation store. Every exclusion is
 * stated on the row — nothing is silently dropped.
 */
function gradeDay(
  cached: CachedDesk,
  observations: { date: string; close: number }[]
): CalibrationDayRow {
  const briefing = cached.briefing;
  const base =
    briefing.scenarios.find((s) => s.id === "base") ?? briefing.scenarios[0];
  const baseTarget = base?.target ?? briefing.spot;
  const baseTargetPct = (baseTarget / briefing.spot - 1) * 100;
  const favoured = favouredScenario(briefing.scenarios);

  let nextMovePct: number | null = null;
  let nextMoveExclusion: string | undefined;
  let biasOutcome: CalibrationDayRow["biasOutcome"] = "excluded";

  if (!isLiveEra(cached.dataMode)) {
    nextMoveExclusion =
      "modelled-era desk day — kept in the record, never graded against realized prices";
  } else {
    const on = observations.find((o) => o.date === cached.date);
    if (!on) {
      nextMoveExclusion =
        "no observed gold close on this desk day — its published spot was never a real close";
    } else {
      const next = observations.find((o) => o.date > cached.date);
      if (!next) {
        nextMoveExclusion =
          "no observed trading day beyond this desk day yet — the call is still in flight";
      } else {
        nextMovePct = (next.close / briefing.spot - 1) * 100;
        if (briefing.bias === 0) {
          biasOutcome = "excluded"; // a neutral stance has no direction to grade
          nextMoveExclusion =
            "the desk published a neutral bias (0) — no direction to grade";
        } else if (Math.abs(nextMovePct) <= FLAT_EPSILON_PCT) {
          biasOutcome = "flat";
          nextMoveExclusion =
            "the next observed close repeated this day's close — a flat move, excluded from the direction rate";
        } else {
          biasOutcome =
            Math.sign(briefing.bias) === Math.sign(nextMovePct)
              ? "hit"
              : "miss";
        }
      }
    }
  }

  /* Scenario grades — resolved days only: live-era, an own observed close,
   * and at least one observed close beyond (the S11 realized rules). The
   * realized anchor is the LATEST observed close beyond the day (graded
   * to-date), matching the S11 scenario-vs-realized comparisons. */
  let baseErrorPct: number | null = null;
  let closest: Scenario["id"] | null = null;
  let closestProb: number | null = null;
  let favouredWon: boolean | null = null;

  if (isLiveEra(cached.dataMode)) {
    const on = observations.find((o) => o.date === cached.date);
    const after = realizedCloseAfter(observations, cached.date);
    if (on && after) {
      baseErrorPct = Math.abs(after.close / baseTarget - 1) * 100;

      let bestGap = Infinity;
      for (const s of briefing.scenarios) {
        const gap = Math.abs(after.close / s.target - 1);
        if (gap < bestGap) {
          bestGap = gap;
          closest = s.id;
          closestProb = s.probability;
        }
      }

      if (favoured) {
        favouredWon = closest === favoured.id;
      }
    }
  }

  return {
    date: cached.date,
    dataMode: cached.dataMode as CalibrationDayRow["dataMode"],
    bias: briefing.bias,
    spot: briefing.spot,
    nextMovePct,
    nextMoveExclusion,
    biasOutcome,
    baseTarget,
    baseTargetPct,
    baseErrorPct,
    closest,
    closestProb,
    favoured,
    favouredWon,
  };
}

/* ------------------------------------------------------------------ */
/* Aggregate scores                                                     */
/* ------------------------------------------------------------------ */

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function biasDirectionScore(
  days: CalibrationDayRow[]
): BiasDirectionScore {
  /* Direction grades pool live-era days with a real next move only. */
  const graded = days.filter(
    (d) => d.biasOutcome === "hit" || d.biasOutcome === "miss"
  );
  const flat = days.filter((d) => d.biasOutcome === "flat").length;
  const neutralBias = days.filter(
    (d) =>
      d.biasOutcome === "excluded" &&
      d.dataMode !== "modelled" &&
      d.nextMovePct !== null &&
      d.nextMoveExclusion?.includes("neutral bias")
  ).length;

  const hits = graded.filter((d) => d.biasOutcome === "hit").length;
  const score: BiasDirectionScore = {
    sample: graded.length,
    hits,
    flat,
    neutralBias,
    hitRate: graded.length > 0 ? (hits / graded.length) * 100 : null,
    meanBias: mean(graded.map((d) => d.bias)),
  };

  if (graded.length > RECENT_WINDOW_DAYS) {
    const recent = graded.slice(-RECENT_WINDOW_DAYS);
    const recentHits = recent.filter((d) => d.biasOutcome === "hit").length;
    score.recent = {
      windowDays: RECENT_WINDOW_DAYS,
      sample: recent.length,
      hits: recentHits,
      hitRate: (recentHits / recent.length) * 100,
    };
  }
  return score;
}

function scenarioAccuracyScore(
  days: CalibrationDayRow[]
): ScenarioAccuracyScore {
  const errors = days
    .map((d) => d.baseErrorPct)
    .filter((e): e is number => e !== null);

  const score: ScenarioAccuracyScore = {
    sample: errors.length,
    meanAbsErrorPct: mean(errors),
    medianAbsErrorPct: median(errors),
    minAbsErrorPct: errors.length > 0 ? Math.min(...errors) : null,
    maxAbsErrorPct: errors.length > 0 ? Math.max(...errors) : null,
  };

  if (errors.length > RECENT_WINDOW_DAYS) {
    const recentErrors = errors.slice(-RECENT_WINDOW_DAYS);
    score.recent = {
      windowDays: RECENT_WINDOW_DAYS,
      sample: recentErrors.length,
      meanAbsErrorPct: mean(recentErrors),
    };
  }
  return score;
}

function probabilityCalibrationScore(
  days: CalibrationDayRow[]
): ProbabilityCalibrationScore {
  /* Only resolved live-era days with a single favourite enter the rate. */
  const resolved = days.filter((d) => d.baseErrorPct !== null);
  const withFavourite = resolved.filter((d) => d.favoured !== null);
  const ties = resolved.filter((d) => d.favoured === null).length;

  const wins = withFavourite.filter((d) => d.favouredWon === true).length;
  const winnerProbs = resolved
    .map((d) => d.closestProb)
    .filter((p): p is number => p !== null);

  /* Fixed stated-probability bands — empty bands show their zero sample. */
  const bucketDefs: { label: string; lo: number; hi: number }[] = [
    { label: "favourite stated < 40%", lo: 0, hi: 40 },
    { label: "favourite stated 40–60%", lo: 40, hi: 60 },
    { label: "favourite stated ≥ 60%", lo: 60, hi: Infinity },
  ];
  const buckets: CalibrationBucket[] = bucketDefs.map((b) => {
    const inBand = withFavourite.filter((d) => {
      const p = d.favoured!.probability;
      return p >= b.lo && p < b.hi;
    });
    const bandWins = inBand.filter((d) => d.favouredWon === true).length;
    return {
      label: b.label,
      sample: inBand.length,
      wins: bandWins,
      winRate: inBand.length > 0 ? (bandWins / inBand.length) * 100 : null,
      meanStated: mean(inBand.map((d) => d.favoured!.probability)),
    };
  });

  return {
    sample: withFavourite.length,
    favouredWins: wins,
    favouredWinRate:
      withFavourite.length > 0 ? (wins / withFavourite.length) * 100 : null,
    ties,
    meanFavouredProb: mean(
      withFavourite.map((d) => d.favoured!.probability)
    ),
    meanWinnerProb: mean(winnerProbs),
    buckets,
  };
}

/* ------------------------------------------------------------------ */
/* The payload                                                          */
/* ------------------------------------------------------------------ */

/**
 * Build the full Calibration payload for a viewed date. Read-only over
 * the DeskDay cache and the observation store — cache-first, no network.
 */
export async function buildCalibration(
  viewedDate: string
): Promise<CalibrationPayload> {
  const cachedDesks = await loadCachedDesks();
  const observations = await goldObservations();

  const days = cachedDesks.map((c) => gradeDay(c, observations));

  const liveEra = cachedDesks.filter((c) => isLiveEra(c.dataMode));
  const liveDates = liveEra.map((c) => c.date);
  const inFlight = days.filter(
    (d) =>
      d.dataMode !== "modelled" &&
      d.baseErrorPct === null &&
      (d.nextMoveExclusion?.includes("in flight") ?? false)
  ).length;

  const record: CalibrationRecordComposition = {
    cachedDays: cachedDesks.length,
    liveDays: cachedDesks.filter((c) => c.dataMode === "live").length,
    mixedDays: cachedDesks.filter((c) => c.dataMode === "mixed").length,
    modelledDays: cachedDesks.filter((c) => c.dataMode === "modelled").length,
    llmDays: cachedDesks.filter((c) => c.narrativeSource === "llm").length,
    templateDays: cachedDesks.filter((c) => c.narrativeSource === "template")
      .length,
    inFlight,
    liveFrom: liveDates.length > 0 ? liveDates[0] : null,
    liveTo: liveDates.length > 0 ? liveDates[liveDates.length - 1] : null,
  };

  const effectiveDeskDate =
    [...cachedDesks].reverse().find((c) => c.date <= viewedDate)?.date ?? null;

  return {
    viewedDate,
    effectiveDeskDate,
    anchor:
      observations.length > 0
        ? {
            asOf: observations[observations.length - 1].date,
            close: observations[observations.length - 1].close,
          }
        : null,
    coverage:
      observations.length > 0
        ? {
            from: observations[0].date,
            to: observations[observations.length - 1].date,
            observations: observations.length,
          }
        : null,
    record,
    biasDirection: biasDirectionScore(days),
    scenarioAccuracy: scenarioAccuracyScore(days),
    probabilityCalibration: probabilityCalibrationScore(days),
    days,
  };
}
