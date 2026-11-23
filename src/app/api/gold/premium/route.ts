import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/premium — the Iran-bridge premium history leg (the live
 * companion the previous gold page's bridge chapter carried): the
 * day-by-day Emami-coin premium series with its own as-of, plus the
 * latest day's full decomposition (the ounce, the free-market dollar,
 * the coins with their premium percentages) — reduced to what the
 * chapter renders, one fetch, cached 5 min, fail-closed 503.
 */

export const dynamic = "force-dynamic";

interface CoinRow {
  id: string;
  marketToman?: number;
  premiumPct?: number;
}

interface PremiumDay {
  date: string;
  source?: string;
  ounceUsd?: number;
  dollarToman?: number;
  tomanPerOunce?: number;
  coins?: CoinRow[];
}

interface PremiumSnapshot {
  asOf?: string;
  days?: PremiumDay[];
}

export async function GET() {
  const snap = await fetchLeg<PremiumSnapshot>("/api/insights/gold-premium");
  const days = Array.isArray(snap?.days) ? snap!.days! : [];
  if (days.length < 2) {
    return NextResponse.json({ error: "The premium history could not be read yet." }, { status: 503 });
  }
  const series = days.map((d) => {
    const emami = d.coins?.find((c) => c.id === "coin-emami");
    return {
      date: d.date,
      premiumPct: emami?.premiumPct ?? null,
      ounceUsd: d.ounceUsd ?? null,
      dollarToman: d.dollarToman ?? null,
    };
  });
  const last = days[days.length - 1]!;
  return NextResponse.json(
    {
      asOf: snap?.asOf ?? last.date,
      days: series.length,
      series,
      latest: {
        date: last.date,
        ounceUsd: last.ounceUsd ?? null,
        dollarToman: last.dollarToman ?? null,
        tomanPerOunce: last.tomanPerOunce ?? null,
        coins: (last.coins ?? []).map((c) => ({ id: c.id, premiumPct: c.premiumPct ?? null })),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
