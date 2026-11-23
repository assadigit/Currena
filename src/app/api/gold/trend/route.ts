import { NextResponse } from "next/server";
import {
  getTrendWindow,
  TREND_RANGES,
  type TrendRange,
  type TrendWindow,
} from "@/lib/gold-page/trend";

/**
 * GET /api/gold/trend?range=… — the price card's range windows.
 *
 * One of: 1D · 7D · 30D · 3M · 6M · 1Y · 5Y · YTD — or `all` for every
 * window at once (the briefing's at-a-glance trend table: one request,
 * eight windows). 7D–1Y and YTD come from the desk's own stored XAUUSD
 * spot closes; 1D and 5Y ride the anchored COMEX leg (see
 * src/lib/gold-page/trend.ts). Every
 * response names the series that served it (`source`) so the page can
 * render the honest caption, and nothing is ever guessed — a window
 * that cannot be served fails 503 (or is omitted from `all`).
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get("range") ?? "3M").toLowerCase();
  if (raw === "all") {
    try {
      const windows = await Promise.all(
        TREND_RANGES.map(async (range) => {
          try {
            return await getTrendWindow(range);
          } catch {
            return null;
          }
        }),
      );
      const list = windows.filter(
        (w): w is TrendWindow => w !== null && w.points.length > 0,
      );
      if (list.length === 0) {
        return NextResponse.json(
          { error: "No gold observations are persisted yet." },
          { status: 503 },
        );
      }
      return NextResponse.json(list, {
        headers: { "cache-control": "no-store" },
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Unexpected failure" },
        { status: 500 },
      );
    }
  }
  const range = raw.toUpperCase() as TrendRange;
  if (!TREND_RANGES.includes(range)) {
    return NextResponse.json(
      { error: `Unknown range "${raw}" — one of ${TREND_RANGES.join(", ")}, or all.` },
      { status: 400 },
    );
  }
  try {
    const window = await getTrendWindow(range);
    if (window === null || window.points.length === 0) {
      return NextResponse.json(
        { error: "No gold observations are persisted yet." },
        { status: 503 },
      );
    }
    return NextResponse.json(window, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected failure" },
      { status: 500 },
    );
  }
}
