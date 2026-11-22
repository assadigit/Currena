/**
 * S11 Continuity layer — the desk archive.
 *
 * Gives the desk memory: everything below is read back from what the desk
 * already persists — cached DeskDay rows (bias, scenario calls, narrative
 * highlights, dataMode) and the S10 Observation store (realized gold
 * closes). No new scraping, no engine rebuild, no network: the archive is
 * cache-first, server-side, and reachable only from API-route code.
 *
 * Honesty rules that bind this module:
 *
 * - Modelled-era desk days (pre-S10 / fallback rows) are labelled as
 *   modelled everywhere and are NEVER mixed into realized-outcome math —
 *   only live/mixed days with observed closes beyond the desk day get a
 *   scenario-vs-realized comparison.
 * - The realized path comes from the live observation store only. A
 *   modelled day's synthetic closes are not "what the market did".
 */

import { db } from "@/lib/db";
import type {
  ArchiveDayCall,
  ArchiveRealized,
  BriefingPayload,
  ContinuityPayload,
  DataMode,
  DeskPairComparison,
  DeskProvenance,
  Scenario,
  ThenVsNow,
} from "./types";

/* ------------------------------------------------------------------ */
/* Cached-row readers                                                   */
/* ------------------------------------------------------------------ */

interface CachedDeskRow {
  date: string;
  briefingJson: string;
  narrativeSource: string;
  dataMode: string;
  provenanceJson: string | null;
}

interface CachedDesk {
  row: CachedDeskRow;
  briefing: BriefingPayload;
  provenance: DeskProvenance | null;
}

/**
 * Every cached desk day, ascending by date. Pre-S10 rows (null provenance)
 * are included and read with their honest dataMode ("modelled") — they are
 * part of the desk's record, but the realized math below never uses their
 * synthetic prices.
 */
async function loadCachedDesks(): Promise<CachedDesk[]> {
  const rows = await db.deskDay.findMany({
    orderBy: { date: "asc" },
  });
  return rows.map((row) => ({
    row: {
      date: row.date,
      briefingJson: row.briefingJson,
      narrativeSource: row.narrativeSource,
      dataMode: row.dataMode,
      provenanceJson: row.provenanceJson,
    },
    briefing: JSON.parse(row.briefingJson) as BriefingPayload,
    provenance: row.provenanceJson
      ? (JSON.parse(row.provenanceJson) as DeskProvenance)
      : null,
  }));
}

/** The exec-section headline the desk led with on a cached day. */
function execHeadline(briefing: BriefingPayload): string {
  return briefing.sections.find((s) => s.id === "exec")?.title ?? "—";
}

function isLiveEra(mode: string): boolean {
  return mode === "live" || mode === "mixed";
}

/* ------------------------------------------------------------------ */
/* Realized prices (the live observation store only)                    */
/* ------------------------------------------------------------------ */

/** Observed gold closes, ascending — the realized path. */
async function goldObservations(): Promise<{ date: string; close: number }[]> {
  const rows = await db.observation.findMany({
    where: { dataset: "gold" },
    orderBy: { date: "asc" },
    select: { date: true, close: true },
  });
  return rows;
}

/** The latest observed gold close strictly after a desk day. */
function realizedCloseAfter(
  observations: { date: string; close: number }[],
  deskDate: string
): { date: string; close: number } | null {
  let latest: { date: string; close: number } | null = null;
  for (const o of observations) {
    if (o.date <= deskDate) continue;
    if (!latest || o.date > latest.date) latest = o;
  }
  return latest;
}

/** The observed gold close on a desk day itself (live-era days only). */
function realizedCloseOn(
  observations: { date: string; close: number }[],
  deskDate: string
): { date: string; close: number } | null {
  const hit = observations.find((o) => o.date === deskDate);
  return hit ?? null;
}

/* ------------------------------------------------------------------ */
/* Scenario-vs-realized math                                            */
/* ------------------------------------------------------------------ */

/**
 * Compare a live-era day's published scenario calls with what gold
 * actually printed since. Returns null when the comparison would be
 * dishonest: modelled-era day, no observed close on the day itself, or
 * no observations beyond it yet (the call is still in flight).
 */
function buildRealized(
  cached: CachedDesk,
  observations: { date: string; close: number }[]
): ArchiveRealized | null {
  if (!isLiveEra(cached.row.dataMode)) return null;

  const deskDate = cached.row.date;
  const on = realizedCloseOn(observations, deskDate);
  if (!on) return null; // the day's own spot was never a real close

  const after = realizedCloseAfter(observations, deskDate);
  if (!after) return null; // no realized evidence yet — call still in flight

  const spot = cached.briefing.spot;
  const realizedPct = (after.close / spot - 1) * 100;

  const scenarioDeltas = cached.briefing.scenarios.map((s: Scenario) => ({
    id: s.id,
    probability: s.probability,
    target: s.target,
    targetPct: (s.target / spot - 1) * 100,
    realizedVsTargetPct: (after.close / s.target - 1) * 100,
  }));

  // The scenario whose target the realized close sits nearest to (abs %).
  let closest: Scenario["id"] = "base";
  let bestGap = Infinity;
  for (const d of scenarioDeltas) {
    const gap = Math.abs(d.realizedVsTargetPct);
    if (gap < bestGap) {
      bestGap = gap;
      closest = d.id;
    }
  }

  return {
    asOf: after.date,
    realizedClose: after.close,
    realizedPct,
    scenarioDeltas,
    closest,
  };
}

/** Shape a cached row into the archive's view of "what the desk said". */
function buildArchiveDay(
  cached: CachedDesk,
  observations: { date: string; close: number }[]
): ArchiveDayCall {
  return {
    date: cached.row.date,
    dataMode: cached.row.dataMode as DataMode,
    narrativeSource:
      cached.row.narrativeSource === "llm" ? "llm" : "template",
    bias: cached.briefing.bias,
    spot: cached.briefing.spot,
    headline: execHeadline(cached.briefing),
    scenarios: cached.briefing.scenarios.map((s: Scenario) => ({
      id: s.id,
      probability: s.probability,
      target: s.target,
    })),
    realized: buildRealized(cached, observations) ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Then vs now                                                          */
/* ------------------------------------------------------------------ */

/**
 * The one-line continuity reminder for the viewed day: what the desk
 * said then, what has actually happened since, and what the desk
 * believes now (its latest cached day).
 */
function buildThenVsNow(
  viewedDesk: CachedDesk,
  latestDesk: CachedDesk,
  observations: { date: string; close: number }[]
): ThenVsNow {
  const thenDate = viewedDesk.row.date;
  let realizedSince: ThenVsNow["realizedSince"] = null;
  let realizedNote: string | undefined;

  if (!isLiveEra(viewedDesk.row.dataMode)) {
    realizedNote = `${thenDate} is a modelled desk day — its prices come from the deterministic engine, so no realized comparison is drawn.`;
  } else {
    const on = realizedCloseOn(observations, thenDate);
    const after = realizedCloseAfter(observations, thenDate);
    if (!on) {
      realizedNote = `${thenDate} has no observed gold close in the live store, so no realized comparison is drawn.`;
    } else if (!after) {
      realizedNote =
        "No observed trading day beyond this desk day yet — the calls are still in flight.";
    } else {
      realizedSince = {
        asOf: after.date,
        close: after.close,
        pct: (after.close / viewedDesk.briefing.spot - 1) * 100,
      };
    }
  }

  return {
    then: {
      date: thenDate,
      dataMode: viewedDesk.row.dataMode as DataMode,
      bias: viewedDesk.briefing.bias,
      spot: viewedDesk.briefing.spot,
      headline: execHeadline(viewedDesk.briefing),
      scenarios: viewedDesk.briefing.scenarios.map((s: Scenario) => ({
        id: s.id,
        probability: s.probability,
        target: s.target,
      })),
    },
    realizedSince,
    realizedNote,
    now: {
      date: latestDesk.row.date,
      dataMode: latestDesk.row.dataMode as DataMode,
      bias: latestDesk.briefing.bias,
      spot: latestDesk.briefing.spot,
      headline: execHeadline(latestDesk.briefing),
    },
  };
}

/* ------------------------------------------------------------------ */
/* The archive payload                                                  */
/* ------------------------------------------------------------------ */

/**
 * Build the full Continuity payload for a viewed date.
 *
 * `from` / `to` (optional, both required together) add the explicit
 * two-date comparison; `to` defaults to the viewed date.
 */
export async function buildContinuity(
  viewedDate: string,
  pairFrom?: string,
  pairTo?: string
): Promise<ContinuityPayload> {
  const cachedDesks = await loadCachedDesks();
  const observations = await goldObservations();

  const archive = cachedDesks.map((c) => buildArchiveDay(c, observations));

  // The cached desk day the view stamps onto: the latest row at or
  // before the viewed date (a weekend view reads the prior desk day).
  let viewedDesk: CachedDesk | null = null;
  for (const c of cachedDesks) {
    if (c.row.date <= viewedDate) viewedDesk = c;
  }
  const effectiveDeskDate = viewedDesk?.row.date ?? null;
  const latestDesk = cachedDesks.length > 0 ? cachedDesks[cachedDesks.length - 1] : null;

  const realizedCoverage =
    observations.length > 0
      ? {
          from: observations[0].date,
          to: observations[observations.length - 1].date,
          observations: observations.length,
        }
      : null;

  const realizedNow =
    observations.length > 0
      ? {
          asOf: observations[observations.length - 1].date,
          close: observations[observations.length - 1].close,
        }
      : null;

  /* Then-vs-now: the viewed cached day against the desk's latest belief. */
  const thenVsNow =
    viewedDesk && latestDesk
      ? buildThenVsNow(
          viewedDesk,
          viewedDesk === latestDesk ? viewedDesk : latestDesk,
          observations
        )
      : null;

  /* Explicit two-date comparison (?from=&to=). */
  let pair: DeskPairComparison | null = null;
  if (pairFrom && pairTo) {
    const fromDesk = cachedDesks.find((c) => c.row.date === pairFrom) ?? null;
    const toDesk = cachedDesks.find((c) => c.row.date === pairTo) ?? null;
    if (fromDesk && toDesk && pairFrom < pairTo) {
      const fromCall = buildArchiveDay(fromDesk, observations);
      const toCall = buildArchiveDay(toDesk, observations);
      let realizedBetween: DeskPairComparison["realizedBetween"] = null;
      let note: string | undefined;
      if (!isLiveEra(fromDesk.row.dataMode) || !isLiveEra(toDesk.row.dataMode)) {
        note =
          "At least one of the two desk days is modelled-era — the realized move is only stated for live-era pairs.";
      }
      const fromOn = realizedCloseOn(observations, pairFrom);
      const toOn = realizedCloseOn(observations, pairTo);
      if (fromOn && toOn) {
        realizedBetween = {
          fromClose: fromOn.close,
          toClose: toOn.close,
          pct: (toOn.close / fromOn.close - 1) * 100,
        };
      } else if (!note) {
        note =
          "One or both desk days lack an observed gold close in the live store, so no realized move is stated.";
      }
      pair = { from: fromCall, to: toCall, realizedBetween, note };
    } else {
      // Invalid pairs are dropped; the endpoint's callers (the page) never
      // construct one, so no channel is needed to surface this note.
      pair = null;
    }
  }

  return {
    viewedDate,
    effectiveDeskDate,
    archive,
    realizedCoverage,
    realizedNow,
    thenVsNow,
    pair,
  };
}
