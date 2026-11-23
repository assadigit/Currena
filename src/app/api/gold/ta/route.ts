import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";
import {
  classicDailyPivots,
  classicWeeklyPivots,
  crossEvents,
  distanceFromSma200,
  smaRows,
  type GoldXauCandle,
} from "@/lib/gold-page/ta";

/**
 * GET /api/gold/ta — the reference-levels leg (the technical-analysis
 * band the previous gold page carried): the SMA 20/50/100/200 rows, the
 * distance-from-200DMA decile over the stored basis, the dated 50/200
 * cross events, and the classic daily/weekly pivots — computed
 * server-side over the currena-api OHLC leg (one fetch, cached 5 min,
 * fail-closed 503 with the honest line).
 */

export const dynamic = "force-dynamic";

interface OhlcSnapshot {
  v?: number;
  asOf?: string;
  fetchedAt?: string;
  series?: GoldXauCandle[];
}

export async function GET() {
  const snap = await fetchLeg<OhlcSnapshot>("/api/insights/gold-ohlc");
  const series = Array.isArray(snap?.series) ? snap!.series! : [];
  if (series.length < 2) {
    return NextResponse.json({ error: "The reference levels could not be read yet." }, { status: 503 });
  }
  return NextResponse.json(
    {
      asOf: series[series.length - 1]!.date,
      span: { from: series[0]!.date, to: series[series.length - 1]!.date, bars: series.length },
      sma: smaRows(series),
      distance: distanceFromSma200(series),
      crosses: crossEvents(series).slice(0, 6),
      dailyPivots: classicDailyPivots(series),
      weeklyPivots: classicWeeklyPivots(series, Date.now()),
      last: {
        date: series[series.length - 1]!.date,
        close: series[series.length - 1]!.close,
      },
      // The raw daily closes — the signals chart's range windows read
      // this same series (one leg, two surfaces; the honest span named).
      closes: series.map((c) => ({ date: c.date, close: c.close })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
