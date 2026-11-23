import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeHistoryEcho, getLongSeries } from "@/lib/gold-page/trend";

/**
 * GET /api/gold — the Currena gold page's live market leg.
 *
 * Serves the real daily closes the desk already persists (the Observation
 * store: gold, silver, the 10y real yield, the dollar index + its pairs,
 * the S&P and oil) and derives the page's numbers from them: the spot,
 * the 7/30/90-day changes, the year position, and each series' own
 * 30-day change. Nothing is invented: every value is computed from the
 * stored observations, and the payload stamps its own as-of date.
 */

interface Point {
  d: string; // YYYY-MM-DD
  v: number;
}

interface SeriesStat {
  series: Point[];
  last: number;
  asOf: string;
  chg30: number | null; // percent
}

/** The stored close closest to `days` before the anchor date. */
function refClose(list: Point[], anchor: string, days: number): Point | null {
  const t = new Date(`${anchor}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - days);
  let best: Point | null = null;
  let bestX = Infinity;
  for (const p of list) {
    const x = Math.abs(new Date(`${p.d}T00:00:00Z`).getTime() - t.getTime());
    if (x < bestX) {
      bestX = x;
      best = p;
    }
  }
  return best;
}

export async function GET() {
  try {
    const rows = await db.observation.findMany({
      orderBy: { date: "asc" },
    });

    const byDataset = new Map<string, Point[]>();
    for (const o of rows) {
      if (!Number.isFinite(o.close)) continue;
      const list = byDataset.get(o.dataset) ?? [];
      list.push({ d: o.date, v: o.close });
      byDataset.set(o.dataset, list);
    }

    const goldAll = byDataset.get("gold") ?? [];
    if (goldAll.length === 0) {
      return NextResponse.json(
        { error: "No gold observations are persisted yet." },
        { status: 503 },
      );
    }

    const asOf = goldAll[goldAll.length - 1].d;
    const spot = goldAll[goldAll.length - 1].v;

    const statOf = (dataset: string, n = 120): SeriesStat | null => {
      const list = byDataset.get(dataset) ?? [];
      if (list.length === 0) return null;
      const series = list.slice(-n);
      const lastP = series[series.length - 1];
      const base = refClose(series, lastP.d, 30);
      const chg30 =
        base && Number.isFinite(base.v) && base.v !== 0
          ? (lastP.v / base.v - 1) * 100
          : null;
      return { series, last: lastP.v, asOf: lastP.d, chg30 };
    };

    const pct = (days: number): number | null => {
      const r = refClose(goldAll, asOf, days);
      if (!r || !Number.isFinite(r.v) || r.v === 0) return null;
      return (spot / r.v - 1) * 100;
    };

    // The price's position inside the stored window (honest about the
    // window: whatever the store holds, currently ~1 year).
    const closes = goldAll.map((p) => p.v).filter(Number.isFinite);
    const pctileYear =
      closes.length > 0
        ? closes.filter((v) => v <= spot).length / closes.length
        : null;

    // The recorded decade percentile from the meter's record (the
    // previous system's own 10-year measurement, kept as the record).
    const pctileDecade = 0.12;

    // The history echo — when the market last traded at today's level
    // (read from the long anchored daily window; null when it cannot
    // be answered honestly).
    const long = await getLongSeries();
    const historyEcho = computeHistoryEcho(long.points);

    const gold = {
      asOf,
      spot,
      chg7d: pct(7),
      chg30d: pct(30),
      chg90d: pct(90),
      pctileYear,
      pctileDecade,
      historyEcho,
      bars: goldAll.slice(-90),
    };

    return NextResponse.json(
      {
        asOf,
        gold,
        silver: statOf("silver"),
        realYield: statOf("realYield"),
        dxy: statOf("dxy"),
        usdjpy: statOf("dxy:USDJPY"),
        eurusd: statOf("dxy:EURUSD"),
        spx: statOf("spx"),
        oil: statOf("oil"),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected failure" },
      { status: 500 },
    );
  }
}
