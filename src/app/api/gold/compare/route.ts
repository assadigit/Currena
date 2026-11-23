import { NextResponse } from "next/server";
import { getComparison } from "@/lib/gold-page/compare";

/**
 * GET /api/gold/compare — gold against the alternatives, five years:
 * the 10-year real yield, silver, Bitcoin and the S&P 500 (gold itself
 * for reference), each as weekly-sampled daily closes, indexed on the
 * page. The real yield's true % levels ride the payload. Legs that
 * cannot be read are absent — never a guess.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const withDiag = new URL(request.url).searchParams.get("diag") === "1";
    const payload = await getComparison(withDiag);
    return NextResponse.json(payload, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected failure" },
      { status: 500 },
    );
  }
}
