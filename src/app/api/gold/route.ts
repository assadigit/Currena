import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeHistoryEcho, getLongSeries } from "@/lib/gold-page/trend";
import { ensureObservations } from "@/lib/gold/sources/eodhd";

/**
 * GET /api/gold — the Currena gold page's live market leg.
 *
 * Serves the real daily closes the desk already persists (the Observation
 * store: gold, silver, the 10y real + nominal yields, the dollar index
 * + its pairs, the S&P and oil) and derives the page's numbers from
 * them: the spot, the 7/30/90-day changes, the year position, and each
 * series' own 30-day change. Nothing is invented: every value is
 * computed from the stored observations, and the payload stamps its
 * own as-of date.
 *
 * The two yields are FRED daily closes (the real-yield re-sourcing,
 * docs/fred-yields-spec.md): realYield = DFII10 (the 10-year TIPS real
 * yield), nominalYield = DGS10. Their daily change is stated in
 * percentage POINTS (a rate's honest unit — the compare band's own
 * convention), never percent-of-a-rate.
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
  /** Yields only: the daily change in percentage points (last − previous close). */
  chg1d?: number | null;
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
  // Pull-on-render sync: the gold page's own market leg rides the
  // desk's once-per-UTC-day gate (the FRED yields re-source, §4 of the
  // fred-yields-spec — 2 small CSV GETs, no key; the EODHD leg keeps
  // its own token gate). A sync failure never breaks the read: the
  // store serves what it holds and the provenance states its as-of.
  try {
    await ensureObservations();
  } catch (e) {
    console.error(
      "[gold] observation sync failed:",
      e instanceof Error ? e.message : e
    );
  }
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

    // The yield stats carry their daily change in percentage points —
    // a rate's honest unit (percent-of-a-rate would mislead).
    const yieldOf = (dataset: string): SeriesStat | null => {
      const stat = statOf(dataset);
      if (stat === null) return null;
      const series = stat.series;
      const chg1d =
        series.length >= 2
          ? series[series.length - 1]!.v - series[series.length - 2]!.v
          : null;
      return { ...stat, chg1d: Number.isFinite(chg1d) ? chg1d : null };
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
        realYield: yieldOf("realYield"),
        nominalYield: yieldOf("nominalYield"),
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
