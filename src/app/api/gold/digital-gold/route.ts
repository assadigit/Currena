import { NextResponse } from "next/server";

/**
 * GET /api/gold/digital-gold — the four-prices band's digital leg
 * (approved item B3, docs/gold-page/SESSION-3-PROMPT.md): the PAXG/XAUt
 * token's own market price, read off TGJU's per-indicator table (the
 * same endpoint family the fx route already rides for the free-market
 * dollar) — the token claiming each unit is backed by one troy ounce.
 *
 * A market price shown for reference, never an endorsement: the band
 * carries the plain-words caveat at point of use. The row's OWN date is
 * the stamp (the table's latest close, e.g. 2026-11-26), stamped
 * honestly — never presented as live. Memory-cached five minutes,
 * fail-closed 503: the band renders its unavailable line, never a guess.
 *
 * Serves data only — the gap-vs-spot arithmetic is the page's own, over
 * the hero store spot beside this quote.
 */

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 20_000;

/** TGJU's PAXG/XAUt indicator (tether_gold_xaut), quoted in USD. */
const TGJU_URL =
  "https://api.tgju.org/v1/market/indicator/summary-table-data/tether_gold_xaut?lang=fa&formated=1&responseType=full";

interface LegEntry {
  at: number;
  value: unknown;
}

const globalForPaxg = globalThis as unknown as {
  __currenaGoldPaxg?: LegEntry;
};
const paxgCache: LegEntry | undefined = globalForPaxg.__currenaGoldPaxg;
globalForPaxg.__currenaGoldPaxg = paxgCache;

interface PaxgRow {
  price: number;
  changePct: number | null;
  /** The table row's own date (YYYY-MM-DD) — the honest stamp. */
  date: string;
}

/** The latest row off the table (rows run newest-first). */
async function fetchPaxg(): Promise<PaxgRow | null> {
  try {
    const res = await fetch(TGJU_URL, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: unknown };
    const rows = json.data;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const r = rows[0];
    // Each row: [open, low, high, close, change, change%, "YYYY/MM/DD", jalali]
    if (!Array.isArray(r)) return null;
    const closeRaw = r[3];
    const pctRaw = r[5];
    const dateRaw = r[6];
    if (typeof closeRaw !== "string" || typeof dateRaw !== "string") return null;
    const price = Number(closeRaw.replace(/,/g, ""));
    if (!Number.isFinite(price) || price <= 0) return null;
    /* the change's sign rides the cell's own class (low = down,
       high = up) — the digits themselves carry no minus */
    let changePct: number | null = null;
    if (typeof pctRaw === "string") {
      const m = pctRaw.match(/([\d.]+)\s*%/);
      if (m !== null) {
        const v = Number(m[1]);
        if (Number.isFinite(v)) {
          const down = /class="[^"]*low/i.test(pctRaw) || /[−–-]/.test(pctRaw);
          changePct = down ? -v : v;
        }
      }
    }
    const date = dateRaw.replace(/\//g, "-");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return { price, changePct, date };
  } catch {
    return null;
  }
}

export async function GET() {
  const hit = globalForPaxg.__currenaGoldPaxg;
  if (hit !== undefined && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.value, { headers: { "cache-control": "no-store" } });
  }
  const row = await fetchPaxg();
  if (row === null) {
    return NextResponse.json(
      { error: "The digital-gold quote could not be read yet." },
      { status: 503 },
    );
  }
  const value = { ...row, fetchedAt: new Date().toISOString(), source: "tgju-paxg" };
  globalForPaxg.__currenaGoldPaxg = { at: Date.now(), value };
  return NextResponse.json(value, { headers: { "cache-control": "no-store" } });
}
