import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/positions — the CFTC positioning leg (the cards the
 * previous gold page carried): the two trader-positioning readings from
 * the still-live currena-api projection (one fetch, cached 5 min,
 * fail-closed 503 — a missing card simply does not render).
 *
 * The two cards, verbatim from the previous page: the net/OI trader
 * positioning (domain −100…+100, a signed bar) and the gross-long
 * share (domain 0…100). Each names its 30-day change window.
 */

export const dynamic = "force-dynamic";

const POSITION_IDS = ["cftc-gold-positioning", "cftc-gold-gross-long"] as const;

interface Reading {
  id?: string;
  value?: number | null;
  change30d?: number | null;
}

interface Projection {
  readings?: Reading[];
}

export async function GET() {
  const proj = await fetchLeg<Projection>("/api/insights/pages/gold");
  const readings = Array.isArray(proj?.readings) ? proj!.readings! : [];
  const cards: Array<{ id: string; value: number; change30d: number | null }> = [];
  for (const id of POSITION_IDS) {
    const r = readings.find((x) => x.id === id);
    if (r !== undefined && typeof r.value === "number" && Number.isFinite(r.value)) {
      cards.push({ id, value: r.value, change30d: typeof r.change30d === "number" ? r.change30d : null });
    }
  }
  if (cards.length === 0) {
    return NextResponse.json({ error: "The positioning data could not be read yet." }, { status: 503 });
  }
  return NextResponse.json(
    { cards },
    { headers: { "cache-control": "no-store" } },
  );
}
