import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/cb — the central-bank demand leg (the section the
 * previous gold page carried): the rolling-12-month reported-world
 * series, the top buyers, and the reported-world stock — passed through
 * from the currena-api route (one fetch, cached 5 min, fail-closed 503).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await fetchLeg<unknown>("/api/insights/gold-cb");
  if (snap === null || typeof snap !== "object" || !("series" in (snap as object))) {
    return NextResponse.json({ error: "The central-bank data could not be read yet." }, { status: 503 });
  }
  return NextResponse.json(snap, { headers: { "cache-control": "no-store" } });
}
