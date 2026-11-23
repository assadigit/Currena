import { NextRequest, NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/meter?date=YYYY-MM-DD — the time machine's leg (the
 * date-parameterized meter the previous gold page's Zone C Advanced
 * control carried): the picked day's beam, lane counts and lane
 * readings under the then-current versioned voter table, over the
 * upstream archive (one fetch, memory-cached 5 min, fail-closed 503).
 *
 * The meter-era boundary rides the route's own rejection: the
 * upstream answers 400 for pre-era or future dates and 503 for
 * not-ready — both surface honestly here.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  // The honest bound client-side too: a malformed date never reaches
  // the upstream (it would be a wasted fetch, never a guess).
  if (date === null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "The date must be YYYY-MM-DD." },
      { status: 400 },
    );
  }
  const snap = await fetchLeg<unknown>(`/api/insights/gold-meter?date=${encodeURIComponent(date)}`);
  if (snap === null || typeof snap !== "object" || !("row" in (snap as object))) {
    return NextResponse.json(
      { error: "The archive could not be read for this date." },
      { status: 503 },
    );
  }
  return NextResponse.json(snap, { headers: { "cache-control": "no-store" } });
}
