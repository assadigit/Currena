import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";
import type { IfBoughtSnapshot } from "@/lib/gold-page/ifbought";

/**
 * GET /api/gold/ifbought — the "if you'd bought" calculator's series
 * (the section the previous gold page carried): per-asset month-end
 * closes since 2016-11 for gold, the S&P 500, Bitcoin and silver, plus
 * each asset's current running point — read server-side off the
 * still-live currena-api leg (memory-cached 5 min, fail-closed 503 with
 * the honest line). The page computes lump + DCA + the decile framing
 * client-side through the pure engine — this route serves data, never
 * arithmetic.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await fetchLeg<IfBoughtSnapshot>("/api/insights/gold-ifbought");
  const gold = snap?.assets?.gold;
  if (
    !snap ||
    !gold ||
    !Array.isArray(gold.monthly) ||
    gold.monthly.length === 0 ||
    !gold.current ||
    !Number.isFinite(gold.current.close)
  ) {
    return NextResponse.json(
      { error: "The if-bought series could not be read yet." },
      { status: 503 },
    );
  }
  return NextResponse.json(snap, {
    headers: { "cache-control": "no-store" },
  });
}
