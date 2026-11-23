/**
 * The comparison layer — gold against the alternatives, five years.
 *
 * The lines the owner asked for, side by side: the 10-year real yield,
 * silver, Bitcoin and the S&P 500 — with gold itself for reference.
 * Every leg is a public daily-close series read server-side and
 * memory-cached for 30 minutes per isolate:
 *
 *   gold       the desk's own stitched spot+COMEX window (trend.ts)
 *   silver     COMEX silver futures (SI=F) — Yahoo's public chart
 *   bitcoin    BTC-USD — Yahoo's public chart
 *   spx        the S&P 500 index (^GSPC) — Yahoo's public chart
 *   realYield  the 10-year TIPS real yield (DFII10) — FRED's public
 *              CSV (no key, no registration)
 *
 * The yield is a rate, not an asset: its line is indexed like the
 * assets only so one chart can hold them all, and the payload carries
 * its true % levels so the tooltip and the legend speak the truth.
 *
 * Daily closes are sampled weekly (the last close of each ISO week) —
 * a 5-year line of ~260 points per leg. Every leg fails closed: a leg
 * that cannot be read is simply absent from the payload, never guessed.
 */

import { getLongSeries } from "@/lib/gold-page/trend";

export interface ComparePoint {
  d: string; // YYYY-MM-DD (the week's last trading day)
  v: number;
}

export interface CompareLeg {
  id: "gold" | "silver" | "btc" | "spx" | "realYield";
  points: ComparePoint[];
}

export interface ComparePayload {
  asOf: string;
  span: { from: string; to: string } | null;
  legs: CompareLeg[];
  /** The real yield's true first/last levels (%) inside the window. */
  realYieldLevels: { first: number; last: number } | null;
  /** Present only with ?diag=1 — the FRED leg's own story, never a guess. */
  diag?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* The Yahoo legs (generic, cached)                                    */
/* ------------------------------------------------------------------ */

interface LegEntry {
  at: number;
  value: ComparePoint[] | null;
}

const globalForCompare = globalThis as unknown as {
  __currenaCompareLegs?: Map<string, LegEntry>;
};
const legCache: Map<string, LegEntry> =
  globalForCompare.__currenaCompareLegs ?? new Map();
globalForCompare.__currenaCompareLegs = legCache;

const YAHOO_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const TTL_MS = 30 * 60 * 1000;
const FAIL_TTL_MS = 60 * 1000;

const YAHOO_SYMBOLS: Record<string, string> = {
  silver: "SI%3DF",
  btc: "BTC-USD",
  spx: "%5EGSPC",
};

/** Fetch one Yahoo chart leg (5y daily closes), cached with a TTL. */
async function yahooLeg(id: "silver" | "btc" | "spx"): Promise<ComparePoint[] | null> {
  const hit = legCache.get(id);
  if (hit !== undefined && Date.now() - hit.at < (hit.value === null ? FAIL_TTL_MS : TTL_MS)) {
    return hit.value;
  }
  let value: ComparePoint[] | null = null;
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${YAHOO_SYMBOLS[id]}?range=5y&interval=1d`,
      {
        headers: { "user-agent": YAHOO_UA, accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = (await res.json()) as {
        chart?: {
          result?: Array<{
            timestamp?: number[];
            indicators?: { quote?: Array<{ close?: Array<number | null> }> };
          }>;
        };
      };
      const r = json.chart?.result?.[0];
      const ts = r?.timestamp;
      const closes = r?.indicators?.quote?.[0]?.close;
      if (Array.isArray(ts) && Array.isArray(closes)) {
        const pts: ComparePoint[] = [];
        for (let i = 0; i < ts.length; i++) {
          const c = closes[i];
          if (typeof c === "number" && Number.isFinite(c) && c > 0) {
            pts.push({ d: new Date(ts[i]! * 1000).toISOString().slice(0, 10), v: c });
          }
        }
        if (pts.length >= 2) value = pts;
      }
    }
  } catch {
    value = null;
  }
  legCache.set(id, { at: Date.now(), value });
  return value;
}

/* ------------------------------------------------------------------ */
/* The FRED leg — the 10-year TIPS real yield (DFII10)                 */
/* ------------------------------------------------------------------ */

/* The FRED leg's own honest user agent — plain, identified, never a
   browser spoof (FRED's public CSV endpoint allows programmatic reads). */
const FRED_UA = "CurrenaGoldDesk/1.0 (currena.ir/gold; contact sedanama.ir@gmail.com)";

/** The last FRED attempt's own story — surfaced only via ?diag=1. */
const globalForFred = globalThis as unknown as { __currenaFredDiag?: Record<string, unknown> };
const fredDiag: Record<string, unknown> = globalForFred.__currenaFredDiag ?? {};
globalForFred.__currenaFredDiag = fredDiag;

/** FRED's own public CSV endpoint (no key): DATE,DFII10 pairs. */
async function fredRealYield(): Promise<ComparePoint[] | null> {
  const id = "realYield";
  const hit = legCache.get(id);
  if (hit !== undefined && Date.now() - hit.at < (hit.value === null ? FAIL_TTL_MS : TTL_MS)) {
    return hit.value;
  }
  let value: ComparePoint[] | null = null;
  fredDiag.at = new Date().toISOString();
  try {
    const from = new Date();
    from.setUTCFullYear(from.getUTCFullYear() - 5);
    const fromIso = from.toISOString().slice(0, 10);
    const res = await fetch(
      `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DFII10&cosd=${fromIso}`,
      {
        headers: { accept: "text/csv", "user-agent": FRED_UA },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      },
    );
    fredDiag.status = res.status;
    fredDiag.contentType = res.headers.get("content-type");
    if (res.ok) {
      const csv = await res.text();
      fredDiag.bytes = csv.length;
      const pts: ComparePoint[] = [];
      for (const line of csv.split("\n").slice(1)) {
        const cells = line.trim().split(",");
        if (cells.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(cells[0] ?? "")) {
          const v = Number(cells[1]);
          if (Number.isFinite(v)) pts.push({ d: cells[0]!, v });
        }
      }
      fredDiag.rows = pts.length;
      if (pts.length >= 2) value = pts;
    }
  } catch (err) {
    fredDiag.error = err instanceof Error ? err.message : String(err);
    value = null;
  }
  legCache.set(id, { at: Date.now(), value });
  return value;
}

/* ------------------------------------------------------------------ */
/* Weekly sampling + the assembly                                      */
/* ------------------------------------------------------------------ */

/** Keep the last close of each ISO week — a 5y line of ~260 points. */
function sampleWeekly(points: ReadonlyArray<{ d: string; v: number }>): ComparePoint[] {
  const out: ComparePoint[] = [];
  let weekKey = -1;
  for (const p of points) {
    // days since the epoch, floored to the week:
    const t = Date.parse(`${p.d}T00:00:00Z`);
    if (!Number.isFinite(t)) continue;
    const key = Math.floor(t / (7 * 86_400_000));
    if (key !== weekKey) {
      weekKey = key;
      out.push({ d: p.d, v: p.v });
    } else if (out.length > 0) {
      out[out.length - 1] = { d: p.d, v: p.v };
    }
  }
  return out;
}

/** Slice a series to the last `years` years. */
function sliceYears(points: ComparePoint[], years: number): ComparePoint[] {
  const cutoff = Date.parse(`${points[points.length - 1]!.d}T00:00:00Z`) - years * 365.25 * 86_400_000;
  return points.filter((p) => Date.parse(`${p.d}T00:00:00Z`) >= cutoff);
}

export async function getComparison(withDiag = false): Promise<ComparePayload> {
  const [goldLong, silver, btc, spx, realYield] = await Promise.all([
    getLongSeries("5y"),
    yahooLeg("silver"),
    yahooLeg("btc"),
    yahooLeg("spx"),
    fredRealYield(),
  ]);

  const legs: CompareLeg[] = [];
  if (goldLong.points.length >= 2) {
    legs.push({ id: "gold", points: sliceYears(sampleWeekly(goldLong.points), 5) });
  }
  if (silver !== null) legs.push({ id: "silver", points: sliceYears(sampleWeekly(silver), 5) });
  if (btc !== null) legs.push({ id: "btc", points: sliceYears(sampleWeekly(btc), 5) });
  if (spx !== null) legs.push({ id: "spx", points: sliceYears(sampleWeekly(spx), 5) });

  let realYieldLevels: { first: number; last: number } | null = null;
  if (realYield !== null) {
    const sampled = sliceYears(sampleWeekly(realYield), 5);
    if (sampled.length >= 2) {
      legs.push({ id: "realYield", points: sampled });
      realYieldLevels = {
        first: sampled[0]!.v,
        last: sampled[sampled.length - 1]!.v,
      };
    }
  }

  const asOf = goldLong.points.length > 0 ? goldLong.points[goldLong.points.length - 1]!.d : new Date().toISOString().slice(0, 10);
  const starts = legs.map((l) => l.points[0]!.d).sort();
  const ends = legs.map((l) => l.points[l.points.length - 1]!.d).sort();
  const span = starts.length > 0 ? { from: starts[0]!, to: ends[ends.length - 1]! } : null;

  return { asOf, span, legs, realYieldLevels, ...(withDiag ? { diag: { ...fredDiag } } : {}) };
}
