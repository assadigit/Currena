/**
 * S14 Digest layer — the whole day in one glance.
 *
 * Assembles the morning read server-side from what the desk already
 * persists: the cached DeskDay rows (the latest briefing headline, the
 * market snapshot, the scenario calls, provenance), the S13 watch
 * evaluation (fired triggers quoted verbatim), the S12 scorecard (the
 * three verdicts with their samples) and the S11 archive (the live era,
 * compressed). No new network, no engine rebuild, no polling: the
 * once-per-day EODHD sync stays the only network surface, and this
 * module only reads. A cache miss never triggers a build — the digest
 * states its gaps honestly instead (a desk with no cached day yet says
 * so).
 *
 * Honesty rules that bind this module (mirroring S11–S13):
 *
 * - The digest is an observation, never advice. It quotes what the desk
 *   said and what gold did — it never says "buy" or "act".
 * - Every number states whether it comes from live or modelled desk
 *   days, and its sample size where a rate is involved. Realized math
 *   pools live-era desk days only; modelled-era days stay in the
 *   record, labelled, never pooled.
 * - Watch triggers are quoted verbatim from the S13 evaluation — the
 *   fact, its dates, its era, its sample.
 * - Small samples stay small: below ten resolved days the scorecard
 *   verdicts are a descriptive record, not a verdict (the S12 rule,
 *   mirrored here server-side).
 * - The deterministic engine stays reachable via
 *   GET /api/desk?source=modelled; this module never triggers a build.
 */

import { db } from "@/lib/db";
import { buildCalibration } from "./calibration";
import { buildContinuity } from "./continuity";
import { buildWatch } from "./watch";
import type {
  ArchiveDayCall,
  BriefingPayload,
  DeskProvenance,
  DigestMemory,
  DigestPayload,
  DigestScenario,
  DigestTrigger,
} from "./types";

/** Below this many resolved live days the scorecard is the record, not a verdict (the S12 band's rule). */
const VERDICT_CAP_DAYS = 10;

/** The base-case call of an archived desk day (its target, USD). */
function baseTargetOf(day: ArchiveDayCall): number {
  const base = day.scenarios.find((s) => s.id === "base") ?? day.scenarios[0];
  return base?.target ?? day.spot;
}

/** Whether an archived day is live-era (live or mixed rows only). */
function isLiveEra(mode: string): boolean {
  return mode === "live" || mode === "mixed";
}

/**
 * Build the Digest payload for a viewed date. Read-only over the same
 * stores the S11/S12/S13 layers read — cache-first, no network, no
 * rebuilds. Called on every desk load.
 */
export async function buildDigest(viewedDate: string): Promise<DigestPayload> {
  /* The three layers the digest compresses. Each is read-only and
   * cache-first; none of them triggers a build or a network call
   * (buildWatch re-derives the S12 scorecard internally — same math,
   * same stores, so the digest's quoted numbers and the scorecard
   * band's numbers cannot drift apart). */
  const [watch, calibration, continuity] = await Promise.all([
    buildWatch(viewedDate),
    buildCalibration(viewedDate),
    buildContinuity(viewedDate),
  ]);

  const effectiveDeskDate = continuity.effectiveDeskDate;

  /* The headline tie-in: the viewed desk day's own lead. The archive
   * carries the calls; the effective row adds the day's published
   * change and the provenance stamp. */
  let headline: DigestPayload["headline"] = null;
  let scenarios: DigestScenario[] = [];

  const viewedDay = effectiveDeskDate
    ? (continuity.archive.find((a) => a.date === effectiveDeskDate) ?? null)
    : null;

  if (effectiveDeskDate && viewedDay) {
    const row = await db.deskDay.findUnique({
      where: { date: effectiveDeskDate },
      select: { briefingJson: true, provenanceJson: true },
    });
    if (row) {
      const briefing = JSON.parse(row.briefingJson) as BriefingPayload;
      const provenance = row.provenanceJson
        ? (JSON.parse(row.provenanceJson) as DeskProvenance)
        : null;

      headline = {
        date: viewedDay.date,
        headline: viewedDay.headline,
        spot: viewedDay.spot,
        changeAbs: briefing.change.abs,
        changePct: briefing.change.pct,
        bias: viewedDay.bias,
        dataMode: viewedDay.dataMode,
        narrativeSource: viewedDay.narrativeSource,
        asOf: provenance?.asOf ?? null,
        stampNote: provenance?.stampNote ?? null,
        liveSeries: provenance
          ? provenance.datasets.filter(
              (d) => d.mode === "live" || d.mode === "live-proxy"
            ).length
          : 0,
        totalSeries: provenance?.datasets.length ?? 0,
        fallbackReason: provenance?.fallbackReason ?? null,
      };

      scenarios = briefing.scenarios.map((s) => ({
        id: s.id,
        label: s.label,
        probability: s.probability,
        target: s.target,
        impliedPct: (s.target / briefing.spot - 1) * 100,
      }));
    }
  }

  /* The watch digest: fired triggers verbatim, quiet and paused counted. */
  const activeRules = watch.rules.filter((r) => r.rule.active);
  const triggered = activeRules.filter((r) => r.state === "triggered");
  const triggers: DigestTrigger[] = triggered.map((ev) => ({
    id: ev.rule.id,
    label: ev.rule.label,
    kind: ev.rule.kind,
    statement: ev.statement,
    era: ev.era,
    sample: ev.sample,
    watchedDate: ev.watchedDate,
  }));

  /* The scorecard digest: the three S12 verdicts with their samples. */
  const { biasDirection, scenarioAccuracy, probabilityCalibration, record } =
    calibration;

  /* The memory digest: the live era compressed. The stance and targets
   * are the archive's own published values; the realized move compares
   * the first live-era day's spot (a real close) with the latest
   * observed close — live evidence only, to-date. */
  const archive = continuity.archive;
  const liveArchive = archive.filter((a) => isLiveEra(a.dataMode));
  const firstLive = liveArchive[0] ?? null;
  const latest = archive[archive.length - 1] ?? null;
  const anchor = continuity.realizedNow;

  const memory: DigestMemory = {
    from: firstLive
      ? {
          date: firstLive.date,
          bias: firstLive.bias,
          spot: firstLive.spot,
          baseTarget: baseTargetOf(firstLive),
        }
      : null,
    to: latest
      ? {
          date: latest.date,
          bias: latest.bias,
          spot: latest.spot,
          baseTarget: baseTargetOf(latest),
          dataMode: latest.dataMode,
        }
      : null,
    realizedPct:
      firstLive && anchor ? (anchor.close / firstLive.spot - 1) * 100 : null,
    realizedClose: firstLive && anchor ? anchor.close : null,
    realizedAsOf: firstLive && anchor ? anchor.asOf : null,
    liveDays: liveArchive.length,
    modelledDays: archive.length - liveArchive.length,
    archiveDays: archive.length,
  };

  return {
    viewedDate,
    effectiveDeskDate,
    generatedAt: new Date().toISOString(),
    headline,
    scenarios,
    watch: {
      totalRules: watch.rules.length,
      activeCount: activeRules.length,
      triggeredCount: triggered.length,
      pausedCount: watch.rules.length - activeRules.length,
      triggers,
      quietLabels: activeRules
        .filter((r) => r.state !== "triggered")
        .map((r) => r.rule.label),
    },
    scorecard: {
      direction: {
        hits: biasDirection.hits,
        sample: biasDirection.sample,
        hitRate: biasDirection.hitRate,
        flat: biasDirection.flat,
        neutralBias: biasDirection.neutralBias,
      },
      baseMiss: {
        meanPct: scenarioAccuracy.meanAbsErrorPct,
        medianPct: scenarioAccuracy.medianAbsErrorPct,
        sample: scenarioAccuracy.sample,
      },
      probability: {
        wins: probabilityCalibration.favouredWins,
        sample: probabilityCalibration.sample,
        winRate: probabilityCalibration.favouredWinRate,
        ties: probabilityCalibration.ties,
      },
      resolvedDays: scenarioAccuracy.sample,
      verdictCap: scenarioAccuracy.sample < VERDICT_CAP_DAYS,
      record,
    },
    memory,
    anchor,
  };
}
