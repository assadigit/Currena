/**
 * S10 Roots layer — grounding assembly.
 *
 * Resolves a requested desk date against the observation store (with
 * fail-closed fallback to the deterministic engine), then builds the
 * desk through the SAME code paths as S8/S9: computeMarket (with the
 * data-source seam) → builder → strategist narrative. Every build
 * carries a provenance record stating exactly which series are live
 * and which are modelled.
 *
 * Server-side only.
 */

import { db } from "@/lib/db";
import { computeMarket, type MarketOverride } from "./engine";
import { buildTemplateBriefing, buildVisuals } from "./builder";
import { writeStrategistNarrative } from "./narrative";
import {
  SOURCE_REGISTRY,
  ensureObservations,
  getGroundedBundle,
  marketProvenance,
  modelledProvenance,
  type GroundedBundle,
} from "./sources/eodhd";
import type {
  BriefingPayload,
  DataMode,
  DatasetProvenance,
  DeskProvenance,
  VisualsPayload,
} from "./types";

/* ------------------------------------------------------------------ */
/* Grounding resolution                                                 */
/* ------------------------------------------------------------------ */

export type GroundingResolution =
  | { kind: "grounded"; bundle: GroundedBundle }
  | { kind: "fallback"; reason: string; fetchedAt?: string };

async function latestSyncTime(): Promise<string | undefined> {
  const agg = await db.sourceSync.aggregate({ _max: { syncedAt: true } });
  return agg._max.syncedAt?.toISOString();
}

/**
 * Resolve how the desk for a requested date should be served: grounded
 * in live observations, or the deterministic-engine fallback (with an
 * honest reason). Network sync happens at most once per UTC day unless
 * `rePull` is set (the regenerate path).
 */
export async function resolveGrounding(
  requestedDate: string,
  rePull = false
): Promise<GroundingResolution> {
  try {
    await ensureObservations(rePull);
  } catch (e) {
    // Full detail to the server log only; the stored reason stays clean.
    console.error(
      "[desk] observation sync failed:",
      e instanceof Error ? e.message : e
    );
    return {
      kind: "fallback",
      reason: "observation store could not be written — serving the deterministic engine",
      fetchedAt: await latestSyncTime(),
    };
  }

  const bundle = await getGroundedBundle(requestedDate);
  if (bundle.ok) {
    return { kind: "grounded", bundle };
  }
  return {
    kind: "fallback",
    reason: bundle.reason,
    fetchedAt: await latestSyncTime(),
  };
}

/* ------------------------------------------------------------------ */
/* Build                                                                */
/* ------------------------------------------------------------------ */

export interface DeskBuild {
  briefing: BriefingPayload;
  visuals: VisualsPayload;
  provenance: DeskProvenance;
  /** The cache key — the stamped trading day. */
  cacheDate: string;
  narrativeSource: "llm" | "template";
}

/** Provenance for a desk served fully by the deterministic engine. */
function fullyModelledDatasets(reason: string): DatasetProvenance[] {
  return [
    ...SOURCE_REGISTRY.map((spec) => ({
      dataset: spec.dataset,
      label: spec.label,
      mode: "modelled" as const,
      note: `${reason} ${spec.note}`,
    })),
    ...modelledProvenance(),
  ];
}

/**
 * Build the desk for a requested date given a grounding resolution.
 * The deterministic engine stays reachable via the fallback path (and
 * the route's source=modelled flag constructs one directly).
 */
export async function buildDeskFromDate(
  requestedDate: string,
  resolution: GroundingResolution
): Promise<DeskBuild> {
  let deskDate = requestedDate;
  let override: MarketOverride | undefined;
  let provenance: DeskProvenance;

  if (resolution.kind === "grounded") {
    const { bundle } = resolution;
    override = {
      dates: bundle.dates,
      gold: bundle.series.gold,
      dxy: bundle.series.dxy,
      realYield: bundle.series.realYield,
      spx: bundle.series.spx,
      silver: bundle.series.silver,
      oil: bundle.series.oil,
    };
    deskDate = bundle.asOf;

    const liveCount = bundle.liveDatasets.length;
    const dataMode: DataMode =
      liveCount === SOURCE_REGISTRY.length ? "live" : "mixed";

    provenance = {
      dataMode,
      asOf: bundle.asOf,
      requestedDate,
      fetchedAt: bundle.fetchedAt,
      windowDays: bundle.windowDays,
      stampNote:
        requestedDate !== bundle.asOf
          ? `${requestedDate} has no fresh trading data — stamped on ${bundle.asOf}, the latest available trading day`
          : undefined,
      datasets: [
        ...marketProvenance(bundle.liveDatasets, bundle.asOf),
        ...modelledProvenance(),
      ],
    };
  } else {
    provenance = {
      dataMode: "modelled",
      asOf: requestedDate,
      requestedDate,
      fetchedAt: resolution.fetchedAt,
      fallbackReason: resolution.reason,
      datasets: fullyModelledDatasets(
        "Not grounded in live data for this desk day."
      ),
    };
  }

  // The engine seam: derivations stay in the existing code paths; the
  // series come from the store when grounded, from the generator when not.
  const facts = computeMarket(deskDate, override);
  const templateBriefing = buildTemplateBriefing(facts);
  const visuals = buildVisuals(facts);

  let briefing = templateBriefing;
  let narrativeSource: "llm" | "template" = "template";
  try {
    const out = await writeStrategistNarrative(facts, templateBriefing);
    briefing = out.briefing;
    narrativeSource = out.source;
  } catch (e) {
    console.warn(
      "[desk] strategist narrative failed, using template:",
      e instanceof Error ? e.message : e
    );
  }

  return {
    briefing,
    visuals,
    provenance,
    cacheDate: deskDate,
    narrativeSource,
  };
}
