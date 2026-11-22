import { NextRequest, NextResponse } from "next/server";
import { buildCalibration } from "@/lib/gold/calibration";

/**
 * /api/desk/calibration — the S12 Calibration layer endpoint.
 *
 * GET ?date=YYYY-MM-DD
 *
 * Read-only scorecard over what the desk has already persisted: the
 * cached DeskDay rows (published bias and scenario calls) graded against
 * the live observation store (realized gold closes). Three scores, every
 * one stating its sample size and its era — bias-direction hit rate,
 * scenario-target accuracy, and the probability-calibration check — plus
 * the per-day grades. Realized math pools live-era desk days only;
 * modelled-era days stay in the record, labelled, never graded. No
 * scraping, no rebuilds: the scorecard is built from what the desk
 * already caches. The deterministic engine stays reachable through
 * /api/desk?source=modelled — this route never triggers a build.
 */

export const dynamic = "force-dynamic";

function isValidIsoDate(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
  );
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const date = params.get("date") ?? new Date().toISOString().slice(0, 10);

  if (!isValidIsoDate(date)) {
    return NextResponse.json(
      { error: "Dates must be valid YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    const payload = await buildCalibration(date);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[desk] GET /api/desk/calibration failed:", e);
    return NextResponse.json(
      { error: "The desk scorecard could not be read." },
      { status: 500 }
    );
  }
}
