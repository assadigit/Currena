import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/crosses — the multi-currency gold crosses leg (the
 * currency grid the previous gold page carried): the five crosses
 * (EUR + AUD native, JPY + GBP + CNY derived), each with its own daily
 * series — passed through from the currena-api route (one fetch,
 * cached 5 min, fail-closed 503).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await fetchLeg<unknown>("/api/insights/gold-crosses");
  if (snap === null || typeof snap !== "object" || !("crosses" in (snap as object))) {
    return NextResponse.json(
      { error: "The currency grid could not be read yet." },
      { status: 503 },
    );
  }
  return NextResponse.json(snap, { headers: { "cache-control": "no-store" } });
}
