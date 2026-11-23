import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/projection — the gold page projection leg (the
 * context cards the previous gold page carried): the 48 readings with
 * their own 10-year percentiles, standard deviations and from-peak
 * fields, plus the honest absentIds — passed through from the
 * currena-api route (one fetch, cached 5 min, fail-closed 503).
 *
 * Powers: the ratios group (gold-silver, gold-btc, gold-aud, …), the
 * physical trio (SGE withdrawals, Swiss flow, Shanghai premium), and
 * the outlook verdict's own inputs (the gold reading's percentile10y).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await fetchLeg<unknown>("/api/insights/pages/gold");
  if (snap === null || typeof snap !== "object" || !("readings" in (snap as object))) {
    return NextResponse.json(
      { error: "The gold projection could not be read yet." },
      { status: 503 },
    );
  }
  return NextResponse.json(snap, { headers: { "cache-control": "no-store" } });
}
