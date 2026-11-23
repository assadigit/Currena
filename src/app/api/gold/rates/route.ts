import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/rates — the live Tehran rates leg (the bridge board
 * the previous gold page carried): the TGJU snapshot's own gold rows
 * (the global ounce in USD, the Tehran coins and weights in toman) and
 * the FX rate rows (the free-market dollar's own rate) — passed
 * through from the currena-api route (one fetch, cached 5 min,
 * fail-closed 503). The حباب premiums are computed CLIENT-side over
 * this leg through the pure coin-premium engine — the route serves
 * data, never arithmetic (the upstream design, kept).
 */

export const dynamic = "force-dynamic";

interface RatesSnapshot {
  snapshot?: {
    base?: string;
    source?: string;
    fetchedAt?: string;
    gold?: unknown;
    rates?: unknown;
  };
}

export async function GET() {
  const snap = await fetchLeg<RatesSnapshot>("/api/rates");
  const s = snap?.snapshot;
  if (
    snap === null ||
    typeof s !== "object" ||
    !Array.isArray(s.gold) ||
    !Array.isArray(s.rates)
  ) {
    return NextResponse.json(
      { error: "The Tehran board could not be read yet." },
      { status: 503 },
    );
  }
  return NextResponse.json(s, { headers: { "cache-control": "no-store" } });
}
