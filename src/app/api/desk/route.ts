import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildDesk } from "@/lib/gold/builder";
import { writeStrategistNarrative } from "@/lib/gold/narrative";
import type { BriefingPayload, VisualsPayload } from "@/lib/gold/types";

/**
 * /api/desk — the single endpoint behind the AURUM desk page.
 *
 * GET  ?date=YYYY-MM-DD[&force=true] : load (and cache) the desk for a date.
 * POST { date }                       : regenerate the narrative for a date.
 *
 * Engine output is deterministic per date, so rows cache cleanly in SQLite;
 * regeneration only re-runs the strategist narrative, never the market math.
 */

export const dynamic = "force-dynamic";

function isValidIsoDate(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
  );
}

interface DeskResult {
  briefing: BriefingPayload;
  visuals: VisualsPayload;
  cached: boolean;
}

async function loadDesk(date: string, force: boolean): Promise<DeskResult> {
  if (!force) {
    const row = await db.deskDay.findUnique({ where: { date } });
    if (row) {
      return {
        briefing: JSON.parse(row.briefingJson) as BriefingPayload,
        visuals: JSON.parse(row.visualsJson) as VisualsPayload,
        cached: true,
      };
    }
  }

  const { briefing, visuals, facts } = buildDesk(date);

  let finalBriefing = briefing;
  let narrativeSource: "llm" | "template" = "template";
  try {
    const out = await writeStrategistNarrative(facts, briefing);
    finalBriefing = out.briefing;
    narrativeSource = out.source;
  } catch (e) {
    console.warn("[desk] strategist narrative failed, using template:", e);
  }

  await db.deskDay.upsert({
    where: { date },
    update: {
      briefingJson: JSON.stringify(finalBriefing),
      visualsJson: JSON.stringify(visuals),
      narrativeSource,
    },
    create: {
      date,
      briefingJson: JSON.stringify(finalBriefing),
      visualsJson: JSON.stringify(visuals),
      narrativeSource,
    },
  });

  return { briefing: finalBriefing, visuals, cached: false };
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const date = params.get("date") ?? new Date().toISOString().slice(0, 10);
  const force = params.get("force") === "true";

  if (!isValidIsoDate(date)) {
    return NextResponse.json(
      { error: "Invalid date; expected YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    const result = await loadDesk(date, force);
    return NextResponse.json({
      briefing: result.briefing,
      visuals: result.visuals,
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
    const body = (await req.json()) as { date?: string; force?: boolean };
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
    const result = await loadDesk(date, true);
    return NextResponse.json({
      briefing: result.briefing,
      visuals: result.visuals,
    });
  } catch (e) {
    console.error("[desk] POST /api/desk failed:", e);
    return NextResponse.json(
      { error: "The desk could not be regenerated." },
      { status: 500 }
    );
  }
}
