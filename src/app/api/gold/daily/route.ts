import { NextResponse } from "next/server";
import { getDailyClose } from "@/lib/gold-page/trend";

/**
 * GET /api/gold/daily?date=YYYY-MM-DD — the time machine's price leg.
 *
 * The gold price on any past day, ten years back: the desk's stored
 * XAUUSD spot closes inside the store's window, the seam-anchored
 * 10-year COMEX history before it. The answer is the last trading day
 * on or before the asked date — weekends and holidays step back to the
 * previous close, never a guess. Served with the honest source + the
 * archive's own bounds; 503 when the archive cannot be read.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (date === null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "The date must be YYYY-MM-DD." },
      { status: 400 },
    );
  }
  try {
    const close = await getDailyClose(date);
    if (close === null) {
      return NextResponse.json(
        { error: "The day's gold price could not be read yet." },
        { status: 503 },
      );
    }
    return NextResponse.json(close, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected failure" },
      { status: 500 },
    );
  }
}
