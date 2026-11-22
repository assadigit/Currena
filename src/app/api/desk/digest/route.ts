import { NextRequest, NextResponse } from "next/server";
import { buildDigest } from "@/lib/gold/digest";

/**
 * /api/desk/digest — the S14 Digest layer endpoint.
 *
 * GET ?date=YYYY-MM-DD
 *
 * Read-only assembly of the morning read from what the desk already
 * persists: the viewed desk day's own briefing headline and market
 * snapshot (cached DeskDay row + provenance), the fired S13 watch
 * triggers (quoted verbatim, with their eras and samples), the S12
 * scorecard verdicts (each stating its n), and the S11 archive
 * compressed into a then-vs-now memory of the live era. Every number
 * states whether it comes from live or modelled desk days and its
 * sample size where a rate is involved; the digest is an observation,
 * never advice. No scraping, no rebuilds, no new network — the
 * once-per-day EODHD sync stays the only network call, and this route
 * never triggers a build (a desk with no cached day yet states its
 * gap honestly). The deterministic engine stays reachable through
 * /api/desk?source=modelled.
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
    const payload = await buildDigest(date);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[desk] GET /api/desk/digest failed:", e);
    return NextResponse.json(
      { error: "The digest could not be assembled." },
      { status: 500 }
    );
  }
}
