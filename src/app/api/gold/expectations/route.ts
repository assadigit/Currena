import { NextResponse } from "next/server";
import { fetchLeg } from "@/lib/gold-page/legs";

/**
 * GET /api/gold/expectations — the market-expectations leg (the strip
 * the previous gold page's explanation band carried): the Polymarket
 * event + its markets' implied probabilities, joined with the
 * gold-relevant calendar from the still-live insights snapshot (one
 * fetch per source, cached 5 min, fail-closed per leg — the card
 * renders whichever legs arrived, honestly labelled).
 */

export const dynamic = "force-dynamic";

interface ExpectationsSnapshot {
  v?: number;
  fetchedAt?: string;
  source?: string;
  event?: { slug?: string; title?: string; endDate?: string; url?: string };
  markets?: Array<{
    move?: string;
    question?: string;
    probPct?: number;
    [k: string]: unknown;
  }>;
}

interface CalendarEntry {
  id?: string;
  date?: string;
  titleEn?: string;
  titleFa?: string;
  kind?: string;
}

interface InsightsSnapshot {
  calendar?: CalendarEntry[];
}

export async function GET() {
  const [exp, insights] = await Promise.all([
    fetchLeg<ExpectationsSnapshot>("/api/insights/gold-expectations"),
    fetchLeg<InsightsSnapshot>("/api/insights"),
  ]);
  const event = exp?.event ?? null;
  const markets = Array.isArray(exp?.markets)
    ? exp!.markets!.map((m) => ({
        move: typeof m.move === "string" ? m.move : "",
        question: typeof m.question === "string" ? m.question : "",
        probPct: typeof m.probPct === "number" && Number.isFinite(m.probPct) ? m.probPct : null,
      }))
    : [];
  const today = new Date().toISOString().slice(0, 10);
  const calendar = Array.isArray(insights?.calendar)
    ? insights!.calendar!
        .filter((c) => typeof c.date === "string" && (c.date as string) >= today)
        .slice(0, 6)
        .map((c) => ({
          id: c.id ?? "",
          date: c.date as string,
          titleEn: c.titleEn ?? "",
          titleFa: c.titleFa ?? "",
          kind: c.kind ?? "",
        }))
    : [];
  if (event === null && markets.length === 0 && calendar.length === 0) {
    return NextResponse.json({ error: "The expectations data could not be read yet." }, { status: 503 });
  }
  return NextResponse.json(
    {
      fetchedAt: exp?.fetchedAt ?? null,
      event,
      markets,
      calendar,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
