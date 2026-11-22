import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDeskFromDate, resolveGrounding } from "@/lib/gold/grounded";
import type { GroundingResolution } from "@/lib/gold/grounded";
import type {
  BriefingPayload,
  DeskProvenance,
  VisualsPayload,
} from "@/lib/gold/types";

/**
 * /api/desk — the single endpoint behind the AURUM desk page.
 *
 * GET  ?date=YYYY-MM-DD[&force=true][&source=auto|modelled]
 *      Load (and cache) the desk for a date. `source=modelled` forces the
 *      deterministic engine even when live data exists. Cache-first: a
 *      request maps to the latest available trading day (weekends and
 *      holidays stamp on the prior trading day) and serves that day's
 *      cached row when it exists.
 * POST { date }
 *      Regenerate: force re-pull the observation store from EODHD,
 *      rebuild the desk and re-run the strategist narrative.
 *
 * Rows built before S10 (null provenance) are treated as cache misses
 * and rebuilt grounded. Any EODHD failure falls back to the
 * deterministic engine with the fallback recorded in provenance — the
 * desk never goes dark.
 */

export const dynamic = "force-dynamic";

function isValidIsoDate(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
  );
}

interface DeskRow {
  date: string;
  briefingJson: string;
  visualsJson: string;
  narrativeSource: string;
  provenanceJson: string | null;
}

/** A fresh (S10-built) cached row — legacy rows have null provenance. */
async function getFreshRow(date: string): Promise<DeskRow | null> {
  const row = await db.deskDay.findUnique({ where: { date } });
  if (!row || row.provenanceJson === null) return null;
  return row as DeskRow;
}

interface DeskResult {
  briefing: BriefingPayload;
  visuals: VisualsPayload;
  provenance: DeskProvenance;
  cached: boolean;
}

async function saveBuild(
  date: string,
  build: Awaited<ReturnType<typeof buildDeskFromDate>>
): Promise<void> {
  await db.deskDay.upsert({
    where: { date },
    update: {
      briefingJson: JSON.stringify(build.briefing),
      visualsJson: JSON.stringify(build.visuals),
      narrativeSource: build.narrativeSource,
      dataMode: build.provenance.dataMode,
      provenanceJson: JSON.stringify(build.provenance),
    },
    create: {
      date,
      briefingJson: JSON.stringify(build.briefing),
      visualsJson: JSON.stringify(build.visuals),
      narrativeSource: build.narrativeSource,
      dataMode: build.provenance.dataMode,
      provenanceJson: JSON.stringify(build.provenance),
    },
  });
}

async function loadDesk(
  date: string,
  opts: { force: boolean; source: "auto" | "modelled"; rePull: boolean }
): Promise<DeskResult> {
  /* Forced synthetic — the deterministic engine stays reachable.
   * These builds are verification views: served fresh, never cached,
   * so the desk of record for a day is always the auto-mode build. */
  if (opts.source === "modelled") {
    const resolution: GroundingResolution = {
      kind: "fallback",
      reason: "forced via the source=modelled flag — deterministic engine output",
    };
    const build = await buildDeskFromDate(date, resolution);
    return {
      briefing: build.briefing,
      visuals: build.visuals,
      provenance: build.provenance,
      cached: false,
    };
  }

  /* Auto — ground when fresh real observations exist, fail closed otherwise. */
  const resolution = await resolveGrounding(date, opts.rePull);

  if (resolution.kind === "grounded") {
    // The desk stamps on the latest available trading day.
    const effectiveDate = resolution.bundle.asOf;
    if (!opts.force) {
      const row = await getFreshRow(effectiveDate);
      if (row) {
        return {
          briefing: JSON.parse(row.briefingJson),
          visuals: JSON.parse(row.visualsJson),
          provenance: JSON.parse(row.provenanceJson as string),
          cached: true,
        };
      }
    }
    const build = await buildDeskFromDate(date, resolution);
    await saveBuild(effectiveDate, build);
    return {
      briefing: build.briefing,
      visuals: build.visuals,
      provenance: build.provenance,
      cached: false,
    };
  }

  /* Fallback — the deterministic engine, with the reason recorded. */
  if (!opts.force) {
    const row = await getFreshRow(date);
    if (row) {
      return {
        briefing: JSON.parse(row.briefingJson),
        visuals: JSON.parse(row.visualsJson),
        provenance: JSON.parse(row.provenanceJson as string),
        cached: true,
      };
    }
  }
  const build = await buildDeskFromDate(date, resolution);
  await saveBuild(date, build);
  return {
    briefing: build.briefing,
    visuals: build.visuals,
    provenance: build.provenance,
    cached: false,
  };
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const date = params.get("date") ?? new Date().toISOString().slice(0, 10);
  const force = params.get("force") === "true";
  const source = params.get("source") === "modelled" ? "modelled" : "auto";

  if (!isValidIsoDate(date)) {
    return NextResponse.json(
      { error: "Invalid date; expected YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    const result = await loadDesk(date, { force, source, rePull: false });
    return NextResponse.json({
      briefing: result.briefing,
      visuals: result.visuals,
      provenance: result.provenance,
    });
  } catch (e) {
    console.error("[desk] GET /api/desk failed:", e);
    return NextResponse.json(
      { error: "The desk could not be generated." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let date: string | undefined;
  try {
    const body = (await req.json()) as { date?: string };
    date = body?.date;
  } catch {
    // fall through to the validation error below
  }

  if (!date || !isValidIsoDate(date)) {
    return NextResponse.json(
      { error: "Body must include a valid date (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  try {
    // The regenerate path re-pulls the observation store, then rebuilds.
    const result = await loadDesk(date, {
      force: true,
      source: "auto",
      rePull: true,
    });
    return NextResponse.json({
      briefing: result.briefing,
      visuals: result.visuals,
      provenance: result.provenance,
    });
  } catch (e) {
    console.error("[desk] POST /api/desk failed:", e);
    return NextResponse.json(
      { error: "The desk could not be regenerated." },
      { status: 500 }
    );
  }
}
