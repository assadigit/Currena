/**
 * S13 Watch layer — owner-defined watch rules, evaluated at read time.
 *
 * Lets the owner pin the desk to the questions they actually care about,
 * and answers them from what the desk already persists. Everything below
 * reads back from the same stores the S11/S12 layers read — cached
 * DeskDay rows (published stance, base-case calls, dataMode) and the S10
 * Observation store (realized gold closes), with the rolling calibration
 * numbers taken from the S12 scorecard math. No new scraping, no engine
 * rebuild, no network: cache-first, server-side, read on every desk load.
 * The once-per-day EODHD sync stays the only network surface.
 *
 * Honesty rules that bind this module (mirroring S11/S12):
 *
 * - Every watch is an observation, never advice. A trigger states the
 *   fact, the date it last held, its era, and its sample size where a
 *   rate is involved — it never says "buy" or "act".
 * - Realized-price evidence pools LIVE-ERA desk days only. Modelled-era
 *   data may inform the record but is labelled and never pooled: a
 *   price-level rule anchored to a modelled desk day says so.
 * - Rules that cannot be evaluated yet state their gap honestly (no
 *   observations, no live desk day, no resolved calibration sample)
 *   instead of rendering a fake quiet state.
 */

import { db } from "@/lib/db";
import type {
  BriefingPayload,
  CalibrationPayload,
  WatchCalibrationMetric,
  WatchDirection,
  WatchEvaluation,
  WatchEvaluationGap,
  WatchPayload,
  WatchRuleKind,
  WatchRuleRecord,
} from "./types";
import { buildCalibration } from "./calibration";
import type { WatchRule as WatchRuleRow } from "@prisma/client";

/* ------------------------------------------------------------------ */
/* Cached-row readers (the same sources the S11/S12 layers read)        */
/* ------------------------------------------------------------------ */

interface CachedDesk {
  date: string;
  dataMode: string;
  briefing: BriefingPayload;
}

function isLiveEra(mode: string): boolean {
  return mode === "live" || mode === "mixed";
}

async function loadCachedDesks(): Promise<CachedDesk[]> {
  const rows = await db.deskDay.findMany({
    orderBy: { date: "asc" },
    select: { date: true, dataMode: true, briefingJson: true },
  });
  return rows.map((row) => ({
    date: row.date,
    dataMode: row.dataMode,
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

/* ------------------------------------------------------------------ */
/* Rule validation (persisted rows are untrusted input)                 */
/* ------------------------------------------------------------------ */

const KINDS: WatchRuleKind[] = [
  "price-level",
  "bias-flip",
  "scenario-band",
  "calibration",
];

/** Which direction selectors are legal per rule kind. */
const DIRECTIONS_BY_KIND: Record<WatchRuleKind, WatchDirection[]> = {
  "price-level": ["above", "below", "cross"],
  "bias-flip": ["sign", "above", "below"],
  "scenario-band": ["target", "implied-move"],
  calibration: ["above", "below"],
};

const METRICS: WatchCalibrationMetric[] = ["base-miss", "direction-hit-rate"];

/** The calibration metric a rule watches (calibration rules only). */
function metricOf(rule: WatchRuleRow): WatchCalibrationMetric | null {
  if (rule.kind !== "calibration") return null;
  return METRICS.includes(rule.metric as WatchCalibrationMetric)
    ? (rule.metric as WatchCalibrationMetric)
    : null;
}

/**
 * Validate one stored rule. A row that fails (unknown kind, illegal
 * selector, non-finite level) is surfaced as an invalid rule — never
 * silently dropped, never evaluated against guessed semantics.
 */
function validateRule(rule: WatchRuleRow): { ok: true } | { ok: false; reason: string } {
  if (!KINDS.includes(rule.kind as WatchRuleKind)) {
    return { ok: false, reason: `unknown rule kind "${rule.kind}"` };
  }
  const kind = rule.kind as WatchRuleKind;
  if (!DIRECTIONS_BY_KIND[kind].includes(rule.direction as WatchDirection)) {
    return { ok: false, reason: `illegal direction "${rule.direction}" for ${kind} rules` };
  }
  if (kind === "calibration") {
    const metric = metricOf(rule);
    if (!metric) {
      return { ok: false, reason: `unknown calibration metric "${rule.metric}"` };
    }
    // Rate thresholds are percent; misses are percent. 0..100 keeps both honest.
    if (rule.level < 0 || rule.level > 100) {
      return { ok: false, reason: "calibration thresholds are percent (0–100)" };
    }
  } else if (!Number.isFinite(rule.level)) {
    return { ok: false, reason: "the level is not a finite number" };
  }
  if (typeof rule.label !== "string" || rule.label.trim().length === 0) {
    return { ok: false, reason: "the rule has no label" };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* The four rule families                                               */
/* ------------------------------------------------------------------ */

function fmtUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtSignedBias(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}

function fmtPct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtPctAbs(n: number): string {
  return `${n.toFixed(2)}%`;
}

/** Era chip sentence shared by every family. */
function eraNote(era: "live" | "modelled" | "none"): string {
  if (era === "live") return "live desk days only";
  if (era === "modelled") return "modelled-era evidence — labelled, never pooled with live";
  return "no era evidence yet";
}

interface FamilyResult {
  state: "triggered" | "quiet";
  statement: string;
  watchedValue: number | null;
  watchedDate: string | null;
  previousValue: number | null;
  era: "live" | "modelled" | "none";
  sample: number | null;
  gap: WatchEvaluationGap | null;
}

/** Whether `value` crossed `level` between `previous` and `now`, in the asked direction. */
function crossed(
  direction: WatchDirection,
  level: number,
  previous: number,
  now: number
): boolean {
  if (direction === "above") return previous < level && now >= level;
  if (direction === "below") return previous > level && now <= level;
  // cross: either side, between the previous evidence and the latest
  return (
    (previous < level && now >= level) || (previous > level && now <= level)
  );
}

/**
 * price-level — gold's latest observed close crossing an owner-set level.
 * Evidence: the live observation store (realized closes), so the era is
 * live by construction; a store with no closes states its gap.
 */
function evalPriceLevel(
  rule: WatchRuleRow,
  observations: { date: string; close: number }[]
): FamilyResult {
  if (observations.length === 0) {
    return {
      state: "quiet",
      statement: "No observed gold closes in the store yet — this rule cannot be evaluated.",
      watchedValue: null,
      watchedDate: null,
      previousValue: null,
      era: "none",
      sample: null,
      gap: {
        code: "no-observations",
        note: "The live observation store holds no gold closes, so no level can be checked.",
      },
    };
  }

  const latest = observations[observations.length - 1];
  const prior = observations.length > 1 ? observations[observations.length - 2] : null;

  if (rule.direction !== "cross" && !prior) {
    return {
      state: "quiet",
      statement: `Gold's latest observed close is ${fmtUsd(latest.close)} (${latest.date}), but no prior close exists yet to judge a crossing of ${fmtUsd(rule.level)}.`,
      watchedValue: latest.close,
      watchedDate: latest.date,
      previousValue: null,
      era: "live",
      sample: null,
      gap: {
        code: "no-prior-close",
        note: "A crossing needs a previous close; the store has exactly one.",
      },
    };
  }

  const priorClose = prior ? prior.close : latest.close; // cross with one close: nothing crossed yet
  const tripped = prior
    ? crossed(rule.direction as WatchDirection, rule.level, priorClose, latest.close)
    : false;
  const side = latest.close >= rule.level;
  const where = rule.direction === "below" ? "at or below" : rule.direction === "above" ? "at or above" : "across";

  const statement = tripped
    ? `Gold's latest observed close ${fmtUsd(latest.close)} (${latest.date}) crossed ${fmtUsd(rule.level)} from ${fmtUsd(priorClose)} (${prior!.date}) — it now sits ${where} the level.`
    : `Gold's latest observed close ${fmtUsd(latest.close)} (${latest.date}) has not crossed ${fmtUsd(rule.level)}: the prior close was ${fmtUsd(priorClose)} (${prior!.date}), and the price sits ${side ? "above" : "below"} the level.`;

  return {
    state: tripped ? "triggered" : "quiet",
    statement: `${statement} Realized closes from the live observation store (${observations.length} observed trading days); ${eraNote("live")}.`,
    watchedValue: latest.close,
    watchedDate: latest.date,
    previousValue: prior ? prior.close : null,
    era: "live",
    sample: null,
    gap: null,
  };
}

/**
 * bias-flip — the published stance changing sign (direction "sign") or
 * crossing an owner-set bias level (above/below). Evidence: consecutive
 * cached desk days. Realized-direction claims pool live-era days only;
 * modelled-era days may inform the record but are labelled.
 */
function evalBiasFlip(
  rule: WatchRuleRow,
  cachedDesks: CachedDesk[]
): FamilyResult {
  if (cachedDesks.length === 0) {
    return {
      state: "quiet",
      statement: "No cached desk day exists yet — this rule cannot be evaluated.",
      watchedValue: null,
      watchedDate: null,
      previousValue: null,
      era: "none",
      sample: null,
      gap: {
        code: "no-live-desk-day",
        note: "The desk cache is empty, so no published stance exists to watch.",
      },
    };
  }

  const latest = cachedDesks[cachedDesks.length - 1];
  const prior = cachedDesks.length > 1 ? cachedDesks[cachedDesks.length - 2] : null;

  if (!prior) {
    return {
      state: "quiet",
      statement: `The desk's latest published stance is bias ${fmtSignedBias(latest.briefing.bias)} (${latest.date}), but no earlier desk day exists to judge a change against.`,
      watchedValue: latest.briefing.bias,
      watchedDate: latest.date,
      previousValue: null,
      era: isLiveEra(latest.dataMode) ? "live" : "modelled",
      sample: null,
      gap: {
        code: "no-prior-desk-day",
        note: "A flip needs a previous desk day; the cache holds exactly one.",
      },
    };
  }

  const nowBias = latest.briefing.bias;
  const priorBias = prior.briefing.bias;
  const bothLive = isLiveEra(latest.dataMode) && isLiveEra(prior.dataMode);
  const era: "live" | "modelled" = bothLive ? "live" : "modelled";

  let tripped: boolean;
  let statement: string;

  if (rule.direction === "sign") {
    tripped = Math.sign(nowBias) !== Math.sign(priorBias) && nowBias !== 0 && priorBias !== 0
      ? true
      : Math.sign(nowBias) !== Math.sign(priorBias); // a flip to/from 0 counts as a sign change
    statement = tripped
      ? `The desk's stance flipped sign — bias moved from ${fmtSignedBias(priorBias)} (${prior.date}) to ${fmtSignedBias(nowBias)} (${latest.date}).`
      : `The desk's stance held its sign — bias moved from ${fmtSignedBias(priorBias)} (${prior.date}) to ${fmtSignedBias(nowBias)} (${latest.date}) without crossing zero.`;
  } else {
    tripped = crossed(rule.direction as WatchDirection, rule.level, priorBias, nowBias);
    statement = tripped
      ? `The desk's stance crossed ${fmtSignedBias(rule.level)} — bias moved from ${fmtSignedBias(priorBias)} (${prior.date}) to ${fmtSignedBias(nowBias)} (${latest.date}).`
      : `The desk's stance has not crossed ${fmtSignedBias(rule.level)} — bias moved from ${fmtSignedBias(priorBias)} (${prior.date}) to ${fmtSignedBias(nowBias)} (${latest.date}).`;
  }

  const eraText = bothLive
    ? "both desk days are live-era"
    : "at least one of the two desk days is modelled-era — labelled, never pooled with live";

  return {
    state: tripped ? "triggered" : "quiet",
    statement: `${statement} Published bias read back from the desk cache (${cachedDesks.length} cached days); ${eraText}.`,
    watchedValue: nowBias,
    watchedDate: latest.date,
    previousValue: priorBias,
    era,
    sample: null,
    gap: null,
  };
}

/**
 * scenario-band — the latest base-case target (direction "target") or
 * its implied move off the latest spot (direction "implied-move")
 * crossing an owner-set level. Evidence: the latest cached desk day.
 */
function evalScenarioBand(
  rule: WatchRuleRow,
  cachedDesks: CachedDesk[]
): FamilyResult {
  if (cachedDesks.length === 0) {
    return {
      state: "quiet",
      statement: "No cached desk day exists yet — this rule cannot be evaluated.",
      watchedValue: null,
      watchedDate: null,
      previousValue: null,
      era: "none",
      sample: null,
      gap: {
        code: "no-live-desk-day",
        note: "The desk cache is empty, so no base-case target exists to watch.",
      },
    };
  }

  const latest = cachedDesks[cachedDesks.length - 1];
  const base =
    latest.briefing.scenarios.find((s) => s.id === "base") ??
    latest.briefing.scenarios[0];
  const baseTarget = base?.target ?? latest.briefing.spot;
  const impliedMovePct = (baseTarget / latest.briefing.spot - 1) * 100;
  const liveDay = isLiveEra(latest.dataMode);
  const era: "live" | "modelled" = liveDay ? "live" : "modelled";

  if (rule.direction === "target") {
    // A USD level: triggered while the target sits at/beyond it (a state, not an event).
    const tripped =
      rule.level >= 0
        ? baseTarget >= rule.level
        : baseTarget <= rule.level;
    return {
      state: tripped ? "triggered" : "quiet",
      statement: `The desk's latest base-case target is ${fmtUsd(baseTarget)} (${latest.date}, a ${fmtPct(impliedMovePct)} implied move off spot ${fmtUsd(latest.briefing.spot)}) — it sits ${baseTarget >= rule.level ? "at or above" : "below"} the watched level ${fmtUsd(rule.level)}. ${liveDay ? "Live-era desk day" : "Modelled-era desk day — labelled, never pooled with live"}.`,
      watchedValue: baseTarget,
      watchedDate: latest.date,
      previousValue: null,
      era,
      sample: null,
      gap: null,
    };
  }

  // implied-move: the target's % move off spot crossing the level.
  const tripped = rule.level >= 0 ? impliedMovePct >= rule.level : impliedMovePct <= rule.level;
  return {
    state: tripped ? "triggered" : "quiet",
    statement: `The desk's latest base case implies a ${fmtPct(impliedMovePct)} move to ${fmtUsd(baseTarget)} by its ${base?.horizon ?? "90-day"} horizon (${latest.date}) — that sits ${impliedMovePct >= rule.level ? "at or beyond" : "inside"} the watched ${fmtPctAbs(Math.abs(rule.level))} band. ${liveDay ? "Live-era desk day" : "Modelled-era desk day — labelled, never pooled with live"}.`,
    watchedValue: impliedMovePct,
    watchedDate: latest.date,
    previousValue: null,
    era,
    sample: null,
    gap: null,
  };
}

/**
 * calibration — a rolling scorecard threshold. The metrics come from the
 * S12 scorecard math over the same graded record: the rolling base-case
 * mean miss and the bias-direction hit rate. Both pool live-era desk
 * days only and state their sample size.
 */
function evalCalibration(
  rule: WatchRuleRow,
  calibration: CalibrationPayload
): FamilyResult {
  const metric = metricOf(rule);
  if (!metric) {
    return {
      state: "quiet",
      statement: "This rule names no known calibration metric.",
      watchedValue: null,
      watchedDate: null,
      previousValue: null,
      era: "none",
      sample: null,
      gap: {
        code: "invalid",
        note: `Unknown calibration metric "${rule.metric}".`,
      },
    };
  }

  const record = calibration.record;
  const liveEraDays = record.liveDays + record.mixedDays;

  if (metric === "base-miss") {
    const acc = calibration.scenarioAccuracy;
    if (acc.sample === 0 || acc.meanAbsErrorPct === null) {
      return {
        state: "quiet",
        statement: `The rolling base-case mean miss cannot be graded yet — ${liveEraDays} live-era desk day${liveEraDays === 1 ? "" : "s"} cached, none resolved with realized evidence beyond it.`,
        watchedValue: null,
        watchedDate: null,
        previousValue: null,
        era: "none",
        sample: 0,
        gap: {
          code: "no-graded-days",
          note: "No resolved live desk day exists yet, so no mean miss can be thresholded.",
        },
      };
    }
    const tripped = rule.direction === "above"
      ? acc.meanAbsErrorPct >= rule.level
      : acc.meanAbsErrorPct <= rule.level;
    return {
      state: tripped ? "triggered" : "quiet",
      statement: `The rolling base-case mean miss is ${fmtPctAbs(acc.meanAbsErrorPct)} (median ${fmtPctAbs(acc.medianAbsErrorPct ?? 0)}, graded to-date against the latest observed close) — that is ${tripped ? (rule.direction === "above" ? "at or beyond" : "at or under") : (rule.direction === "above" ? "inside" : "above")} the watched ${fmtPctAbs(rule.level)} threshold. n=${acc.sample} resolved live desk day${acc.sample === 1 ? "" : "s"}; modelled-era days are labelled and never graded.`,
      watchedValue: acc.meanAbsErrorPct,
      watchedDate: calibration.anchor?.asOf ?? null,
      previousValue: null,
      era: "live",
      sample: acc.sample,
      gap: null,
    };
  }

  // direction-hit-rate
  const bias = calibration.biasDirection;
  if (bias.sample === 0 || bias.hitRate === null) {
    return {
      state: "quiet",
      statement: `The bias-direction hit rate cannot be graded yet — ${liveEraDays} live-era desk day${liveEraDays === 1 ? "" : "s"} cached, none with a scorable next-day move (${bias.flat} flat and ${bias.neutralBias} neutral days excluded and counted).`,
      watchedValue: null,
      watchedDate: null,
      previousValue: null,
      era: "none",
      sample: 0,
      gap: {
        code: "no-graded-days",
        note: "No scorable direction day exists yet, so no hit rate can be thresholded.",
      },
    };
  }
  const tripped = rule.direction === "above"
    ? bias.hitRate >= rule.level
    : bias.hitRate <= rule.level;
  return {
    state: tripped ? "triggered" : "quiet",
    statement: `The bias-direction hit rate is ${bias.hits}/${bias.sample} (${bias.hitRate.toFixed(0)}%) — that is ${tripped ? (rule.direction === "above" ? "at or beyond" : "at or under") : (rule.direction === "above" ? "below" : "above")} the watched ${rule.level.toFixed(0)}% threshold. n=${bias.sample} graded live desk day${bias.sample === 1 ? "" : "s"} (${bias.flat} flat, ${bias.neutralBias} neutral excluded and counted); modelled-era days are labelled and never graded.`,
    watchedValue: bias.hitRate,
    watchedDate: calibration.anchor?.asOf ?? null,
    previousValue: null,
    era: "live",
    sample: bias.sample,
    gap: null,
  };
}

/* ------------------------------------------------------------------ */
/* The evaluation                                                       */
/* ------------------------------------------------------------------ */

function rowToRecord(rule: WatchRuleRow): WatchRuleRecord {
  return {
    id: rule.id,
    kind: rule.kind as WatchRuleKind,
    label: rule.label,
    level: rule.level,
    direction: rule.direction as WatchDirection,
    metric: metricOf(rule) ?? "base-miss",
    active: rule.active,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

function unevaluated(
  rule: WatchRuleRow,
  note: string
): WatchEvaluation {
  return {
    rule: rowToRecord(rule),
    state: "quiet",
    statement: `Paused — this rule is inactive, so it is not being evaluated. ${note}`,
    watchedValue: null,
    watchedDate: null,
    previousValue: null,
    era: "none",
    sample: null,
    gap: null,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluate every rule against the persisted record. Read-only over the
 * DeskDay cache, the observation store and the S12 calibration math —
 * cache-first, no network, no rebuilds. Called on every desk load.
 */
export async function buildWatch(viewedDate: string): Promise<WatchPayload> {
  const [rules, cachedDesks, observations] = await Promise.all([
    db.watchRule.findMany({ orderBy: { createdAt: "asc" } }),
    loadCachedDesks(),
    goldObservations(),
  ]);

  const calibration = await buildCalibration(viewedDate);
  const liveDays = cachedDesks.filter((c) => isLiveEra(c.dataMode)).length;
  const modelledDays = cachedDesks.length - liveDays;

  const effectiveDeskDate =
    [...cachedDesks].reverse().find((c) => c.date <= viewedDate)?.date ?? null;

  const evaluations: WatchEvaluation[] = rules.map((rule) => {
    const record = rowToRecord(rule);
    const evaluatedAt = new Date().toISOString();

    if (!rule.active) {
      return { ...unevaluated(rule, "Its last recorded reading is kept below."), rule: record, evaluatedAt };
    }

    const validation = validateRule(rule);
    if (!validation.ok) {
      const gap: WatchEvaluationGap = { code: "invalid", note: validation.reason };
      return {
        rule: record,
        state: "quiet",
        statement: `This rule cannot be evaluated: ${validation.reason}. Fix or delete it in the rule editor.`,
        watchedValue: null,
        watchedDate: null,
        previousValue: null,
        era: "none",
        sample: null,
        gap,
        evaluatedAt,
      };
    }

    let result: FamilyResult;
    switch (rule.kind as WatchRuleKind) {
      case "price-level":
        result = evalPriceLevel(rule, observations);
        break;
      case "bias-flip":
        result = evalBiasFlip(rule, cachedDesks);
        break;
      case "scenario-band":
        result = evalScenarioBand(rule, cachedDesks);
        break;
      default:
        result = evalCalibration(rule, calibration);
        break;
    }

    return {
      rule: record,
      state: result.state,
      statement: result.statement,
      watchedValue: result.watchedValue,
      watchedDate: result.watchedDate,
      previousValue: result.previousValue,
      era: result.era,
      sample: result.sample,
      gap: result.gap,
      evaluatedAt,
    };
  });

  return {
    viewedDate,
    effectiveDeskDate,
    rules: evaluations,
    anchor:
      observations.length > 0
        ? {
            asOf: observations[observations.length - 1].date,
            close: observations[observations.length - 1].close,
          }
        : null,
    liveDays,
    modelledDays,
  };
}
