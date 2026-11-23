import { NextRequest, NextResponse } from "next/server";
import { buildContinuity } from "@/lib/gold/continuity";

/**
 * /api/desk/continuity — the S11 Continuity layer endpoint.
 *
 * GET ?date=YYYY-MM-DD[&from=YYYY-MM-DD&to=YYYY-MM-DD]
 *
 * Read-only queries over the DeskDay cache and the observation store —
 * what the desk said on each cached day, what gold actually did since,
 * and the "then vs now" reminder for the viewed day. `from`/`to` add the
 * explicit two-date comparison (both must be cached desk days, earlier
 * first). No scraping, no rebuilds: the archive is built from what the
 * desk already persists.
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
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  const invalid = [
    date,
    ...(from ? [from] : []),
    ...(to ? [to] : []),
  ].filter((d) => !isValidIsoDate(d));

  if (invalid.length > 0) {
    return NextResponse.json(
      { error: "Dates must be valid YYYY-MM-DD." },
      { status: 400 }
    );
  }
  if ((from && !to) || (!from && to)) {
    return NextResponse.json(
      { error: "from and to must be provided together." },
      { status: 400 }
    );
  }

  try {
    const payload = await buildContinuity(date, from, to);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[desk] GET /api/desk/continuity failed:", e);
    return NextResponse.json(
      { error: "The desk archive could not be read." },
      { status: 500 }
    );
  }
}
