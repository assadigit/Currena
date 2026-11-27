import { NextResponse } from "next/server";
import { getFuturesSnapshot } from "@/lib/gold-page/futures";

/**
 * GET /api/gold/futures — the COMEX futures band's own legs (approved
 * item A, docs/gold-page/SESSION-3-PROMPT.md): the front contract's own
 * read (name, price, day change, day range, volume, market time, the
 * 52-week range) plus the next ~6 quarterly delivery dates off the
 * term-structure spark — both from Yahoo Finance's public API, delayed,
 * memory-cached per isolate (90 s warm / 60 s after a failure).
 *
 * Serves data only — the basis-vs-spot pairing and the curve verdict are
 * the page's own arithmetic over the hero store spot beside this
 * payload. Fail-closed: when both legs fail the route answers the
 * honest 503 and the band renders its unavailable line — never a guess.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getFuturesSnapshot();
  if (snap === null) {
    return NextResponse.json(
      { error: "The futures quote could not be read yet." },
      { status: 503 },
    );
  }
  return NextResponse.json(snap, { headers: { "cache-control": "no-store" } });
}
