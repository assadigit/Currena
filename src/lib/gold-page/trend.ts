/**
 * The gold trend layer — the price card's multi-range windows.
 *
 * Ranges 7D/30D/3M/6M/1Y are served from the desk's own stored XAUUSD spot
 * closes (the EODHD observation store) — the exact series the hero's
 * spot, 7-day and 30-day numbers come from, so the chart always agrees
 * with the big price. YTD slices the same store from the year's first
 * stored close (the year of the latest observation).
 *
 * 1D and 5Y are beyond that store's reach (this EODHD plan carries no
 * intraday and caps history at ~1 trailing year), so they are served
 * from COMEX front-month gold futures (GC=F) through Yahoo Finance's
 * public chart endpoint:
 *
 *   1D  the current COMEX session, anchored so its last bar lands on
 *       the desk's live spot (the session's shape is the futures'; the
 *       level is the spot's);
 *   5Y  the STITCHED window — the store's own exact spot year extended
 *       back with the COMEX history, seam-anchored so the futures
 *       segment joins the store's first close exactly. The recent year
 *       is therefore the real spot series; only the pre-store history
 *       rides the futures shape, and every response says so.
 *
 * The same stitched long window powers the history echo — "gold is
 * back at a price last seen about N ago" — computed from real
 * crossings of the current level, never guessed.
 *
 * Server-side only (imported from API routes; never from client
 * components). Yahoo fetches are memory-cached per isolate (30 min
 * daily / 90 s intraday / 60 s for failures) and every failure fails
 * closed — the caller falls back to the store and says so honestly.
 */

import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type TrendRange = "1D" | "7D" | "30D" | "3M" | "6M" | "1Y" | "5Y" | "YTD";

export const TREND_RANGES: TrendRange[] = ["1D", "7D", "30D", "3M", "6M", "1Y", "5Y", "YTD"];

/** Calendar days the store-side ranges span (the 5Y, 1D and YTD legs are computed separately). */
const RANGE_DAYS: Record<"7D" | "30D" | "3M" | "6M" | "1Y", number> = {
  "7D": 7,
  "30D": 30,
  "3M": 90,
  "6M": 182,
  "1Y": 365,
};

export interface TrendPoint {
  d: string; // daily: YYYY-MM-DD · intraday: YYYY-MM-DDTHH:mm (UTC)
  v: number;
}

/** Which series served the window — the page renders the honest caption. */
export type TrendSource =
  | "spot-store" // stored XAUUSD spot closes
  | "comex-anchored" // 5Y COMEX futures anchored to spot
  | "comex-partial" // 5Y asked, store window served instead (fetch failed)
  | "comex-session" // 1D intraday COMEX session anchored to spot
  | "comex-session-fallback"; // 1D asked, last two daily closes served instead

export interface TrendWindow {
  range: TrendRange;
  asOf: string;
  spot: number;
  points: TrendPoint[];
  chgPct: number | null;
  source: TrendSource;
}

export interface HistoryEcho {
  /** "return" — the level was genuinely seen N days ago (before the current episode). */
  mode: "return";
  /** Trading-calendar days since that level was last traded (approx: calendar days). */
  days: number;
  /** The ISO date the market last traded at this level. */
  anchorDate: string;
}

export interface HistoryEchoExtreme {
  /** "window-extreme" — the level sits beyond everything the 5Y window holds. */
  mode: "window-extreme";
  /** true = the highest area of the window; false = the lowest. */
  high: boolean;
}

export interface HistoryEchoRange {
  /** "window-range" — the price traded in this area through the whole window. */
  mode: "window-range";
}

export type HistoryEchoResult = HistoryEcho | HistoryEchoExtreme | HistoryEchoRange | null;

/* ------------------------------------------------------------------ */
/* The stored spot series                                               */
/* ------------------------------------------------------------------ */

interface StoredPoint {
  d: string;
  v: number;
}

async function storedGoldSeries(): Promise<StoredPoint[]> {
  const rows = await db.observation.findMany({
    where: { dataset: "gold" },
    orderBy: { date: "asc" },
  });
  return rows
    .filter((o) => Number.isFinite(o.close))
    .map((o) => ({ d: o.date, v: o.close }));
}

/** Points whose date is within `days` calendar days of the anchor date. */
function sliceByCalendarDays(list: StoredPoint[], days: number): StoredPoint[] {
  if (list.length === 0) return [];
  const anchor = new Date(`${list[list.length - 1].d}T00:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - days);
  const t = anchor.getTime();
  return list.filter((p) => new Date(`${p.d}T00:00:00Z`).getTime() >= t);
}

/* ------------------------------------------------------------------ */
/* The Yahoo COMEX legs (cached, fail-closed)                           */
/* ------------------------------------------------------------------ */

interface LegEntry {
  at: number;
  value: TrendPoint[] | null;
}

const globalForTrend = globalThis as unknown as {
  __currenaTrendLegs?: Map<string, LegEntry>;
};
const legCache: Map<string, LegEntry> = globalForTrend.__currenaTrendLegs ?? new Map();
globalForTrend.__currenaTrendLegs = legCache;

const YAHOO_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const YAHOO_TIMEOUT_MS = 10_000;
const DAILY_TTL_MS = 30 * 60 * 1000;
const INTRADAY_TTL_MS = 90 * 1000;
/** A failed leg is retried quickly — never poison a warm isolate's cache with one bad fetch. */
const FAIL_TTL_MS = 60 * 1000;

interface YahooQuote {
  close?: Array<number | null>;
}
interface YahooResult {
  timestamp?: number[];
  indicators?: { quote?: YahooQuote[] };
}
interface YahooChart {
  chart?: { result?: YahooResult[]; error?: unknown };
}

/** Fetch one Yahoo chart leg (GC=F), cached with a TTL. Null when it fails. */
async function fetchYahooLeg(
  key: "5y" | "1d" | "10y"
): Promise<TrendPoint[] | null> {
  const hit = legCache.get(key);
  if (hit !== undefined) {
    const ttl =
      hit.value === null
        ? FAIL_TTL_MS // a failed leg retries within a minute
        : key === "1d"
          ? INTRADAY_TTL_MS
          : DAILY_TTL_MS;
    if (Date.now() - hit.at < ttl) return hit.value;
  }

  const url =
    key === "1d"
      ? "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?range=1d&interval=30m"
      : key === "10y"
        ? "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?range=10y&interval=1d"
        : "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?range=5y&interval=1d";
  let value: TrendPoint[] | null = null;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": YAHOO_UA, accept: "application/json" },
      signal: AbortSignal.timeout(YAHOO_TIMEOUT_MS),
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json()) as YahooChart;
      const r = json.chart?.result?.[0];
      const ts = r?.timestamp;
      const closes = r?.indicators?.quote?.[0]?.close;
      if (Array.isArray(ts) && Array.isArray(closes) && ts.length > 0) {
        const pts: TrendPoint[] = [];
        for (let i = 0; i < ts.length; i++) {
          const c = closes[i];
          if (typeof c === "number" && Number.isFinite(c) && c > 0) {
            pts.push({
              d:
                key === "1d"
                  ? new Date(ts[i] * 1000).toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm UTC
                  : new Date(ts[i] * 1000).toISOString().slice(0, 10),
              v: c,
            });
          }
        }
        if (pts.length >= 2) value = pts;
      }
    }
  } catch {
    value = null;
  }
  legCache.set(key, { at: Date.now(), value });
  return value;
}

/* ------------------------------------------------------------------ */
/* Anchoring + the long daily series                                    */
/* ------------------------------------------------------------------ */

/** Scale a COMEX series so its final close lands exactly on the desk's spot. */
function anchorToSpot(series: TrendPoint[], spot: number): TrendPoint[] {
  const last = series[series.length - 1]?.v;
  if (!last || !Number.isFinite(last) || last <= 0) return series;
  const ratio = spot / last;
  if (!Number.isFinite(ratio) || ratio <= 0 || Math.abs(ratio - 1) < 1e-9) return series;
  return series.map((p) => ({ d: p.d, v: p.v * ratio }));
}

export interface LongSeries {
  points: TrendPoint[];
  /** True when the COMEX history extends the store's own window; false when store-only. */
  comex: boolean;
}

/**
 * The long daily series the history echo (and the 5Y window) reads:
 * the store's own exact spot year, EXTENDED back with the COMEX leg.
 *
 * The COMEX segment is anchored at the seam — scaled so its close on
 * the store's first day equals the store's own first close — because
 * the recent COMEX tail can drift a few percent from the stored spot
 * closes (basis + feed vintage). The recent year is therefore the
 * exact spot series the hero's numbers come from; only the pre-store
 * history rides the futures shape. Yahoo failing fails closed to the
 * store's own honest window.
 */
export async function getLongSeries(leg: "5y" | "10y" = "5y"): Promise<LongSeries> {
  const store = await storedGoldSeries();
  if (store.length === 0) return { points: [], comex: false };
  const storePoints: TrendPoint[] = store.map((p) => ({ d: p.d, v: p.v }));

  const yahoo = await fetchYahooLeg(leg);
  if (yahoo === null || yahoo.length === 0) {
    return { points: storePoints, comex: false };
  }

  // The seam: the last COMEX close at or before the store's first date.
  const storeStart = store[0].d;
  let seamIdx = -1;
  for (let i = yahoo.length - 1; i >= 0; i--) {
    if (yahoo[i].d <= storeStart) {
      seamIdx = i;
      break;
    }
  }
  if (seamIdx < 0) return { points: storePoints, comex: false };

  const seamComex = yahoo[seamIdx].v;
  const seamStore = store[0].v;
  const ratio = seamStore / seamComex;
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return { points: storePoints, comex: false };
  }

  const pre = yahoo.slice(0, seamIdx + 1).map((p) => ({ d: p.d, v: p.v * ratio }));
  // Drop the duplicated seam date when the COMEX calendar lands on it.
  const preClean = pre.length > 0 && pre[pre.length - 1].d === storeStart ? pre.slice(0, -1) : pre;
  return { points: [...preClean, ...storePoints], comex: true };
}

/* ------------------------------------------------------------------ */
/* The history echo — when was this level last traded?                  */
/* ------------------------------------------------------------------ */

/** How far back the "current episode" is considered to stay around the level. */
const EPISODE_BAND = 0.03; // ±3%

export function computeHistoryEcho(
  series: TrendPoint[]
): HistoryEchoResult {
  const n = series.length;
  if (n < 30) return null;
  const asOfD = series[n - 1].d;
  const P = series[n - 1].v;
  if (!Number.isFinite(P) || P <= 0) return null;

  // 1. Where the current "around this level" episode begins (walk back
  //    while closes stay within ±EPISODE_BAND of today's price).
  let e = n - 1;
  while (e > 0 && Math.abs(series[e - 1].v / P - 1) <= EPISODE_BAND) e--;

  // The market never left the band in the whole window — a level it
  // has traded in throughout; there is no "return" to speak of.
  if (e === 0) return { mode: "window-range" };

  // 2. Which side the market entered the episode from.
  const entry = series[e - 1].v;
  const entryAbove = entry > P;

  // 3. Before the episode: the last time the market traded on the
  //    OTHER side of today's level — i.e. the last real passage through
  //    this price. Walking back from e-1 while closes stay on the entry
  //    side, the first close on the opposite side is the echo date.
  for (let j = e - 1; j >= 0; j--) {
    const opposite = entryAbove ? series[j].v <= P : series[j].v >= P;
    if (opposite) {
      const t0 = Date.parse(`${series[j].d}T00:00:00Z`);
      const t1 = Date.parse(`${asOfD}T00:00:00Z`);
      if (!Number.isFinite(t0) || !Number.isFinite(t1)) return null;
      const days = Math.max(0, Math.round((t1 - t0) / 86_400_000));
      if (days < 1) return null;
      return { mode: "return", days, anchorDate: series[j].d };
    }
  }

  // Never crossed to the other side within the window: today's level is
  // an extreme of everything the window holds.
  return { mode: "window-extreme", high: entryAbove };
}

/* ------------------------------------------------------------------ */
/* The day-lookup leg — the time machine's own price question          */
/* ------------------------------------------------------------------ */

export interface DailyClose {
  /** The trading day the price is quoted from (on or before the asked date). */
  date: string;
  price: number;
  /** Which series answered — the store's spot closes or the COMEX history. */
  source: "spot-store" | "comex-history";
  /** The desk's own live spot, for the honest vs-today line. */
  todaySpot: number;
  todayAsOf: string;
  /** The archive's own honest bounds. */
  span: { from: string; to: string };
}

/**
 * The gold price on any past day (≥ 10 years back): the desk's stored
 * spot closes when the day falls inside the store's window, else the
 * 10-year COMEX futures history seam-anchored to the store. The close
 * quoted is the last trading day on or before the asked date — weekends
 * and holidays never guess, they step back.
 */
export async function getDailyClose(asked: string): Promise<DailyClose | null> {
  const store = await storedGoldSeries();
  if (store.length === 0) return null;
  const today = store[store.length - 1];

  if (asked >= store[0].d) {
    let best: StoredPoint | null = null;
    for (const p of store) {
      if (p.d <= asked) best = p;
      else break;
    }
    if (best !== null) {
      return {
        date: best.d,
        price: best.v,
        source: "spot-store",
        todaySpot: today.v,
        todayAsOf: today.d,
        span: { from: store[0].d, to: today.d },
      };
    }
    // A date after the store's last close (future weekend etc.): the
    // honest answer is the latest close itself.
    return {
      date: today.d,
      price: today.v,
      source: "spot-store",
      todaySpot: today.v,
      todayAsOf: today.d,
      span: { from: store[0].d, to: today.d },
    };
  }

  const long = await getLongSeries("10y");
  if (!long.comex || long.points.length === 0) return null;
  let best: TrendPoint | null = null;
  for (const p of long.points) {
    if (p.d <= asked) best = p;
    else break;
  }
  if (best === null) return null;
  return {
    date: best.d,
    price: best.v,
    source: "comex-history",
    todaySpot: today.v,
    todayAsOf: today.d,
    span: { from: long.points[0].d, to: today.d },
  };
}

/* ------------------------------------------------------------------ */
/* The range windows                                                    */
/* ------------------------------------------------------------------ */

function pctOver(points: TrendPoint[]): number | null {
  if (points.length < 2) return null;
  const a = points[0].v;
  const b = points[points.length - 1].v;
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(b)) return null;
  return (b / a - 1) * 100;
}

export async function getTrendWindow(range: TrendRange): Promise<TrendWindow | null> {
  const store = await storedGoldSeries();
  if (store.length === 0) return null;
  const spot = store[store.length - 1].v;
  const asOf = store[store.length - 1].d;

  if (range === "1D") {
    const yahoo = await fetchYahooLeg("1d");
    if (yahoo !== null) {
      const anchored = anchorToSpot(yahoo, spot);
      return {
        range,
        asOf,
        spot,
        points: anchored,
        chgPct: pctOver(anchored),
        source: "comex-session",
      };
    }
    // Fail-closed fallback: the last two stored daily closes.
    const tail = store.slice(-2).map((p) => ({ d: p.d, v: p.v }));
    return {
      range,
      asOf,
      spot,
      points: tail,
      chgPct: pctOver(tail),
      source: "comex-session-fallback",
    };
  }

  if (range === "5Y") {
    // The stitched long window: the store's exact spot year extended
    // back with the seam-anchored COMEX history (store-only, honestly
    // shorter, when the COMEX leg cannot be read).
    const long = await getLongSeries();
    return {
      range,
      asOf,
      spot,
      points: long.points,
      chgPct: pctOver(long.points),
      source: long.comex ? "comex-anchored" : "comex-partial",
    };
  }

  if (range === "YTD") {
    // From the year's first stored close (the year of the latest
    // observation) — "from the beginning of the year", read honestly.
    const year = store[store.length - 1].d.slice(0, 4);
    const sliced = store.filter((p) => p.d >= `${year}-01-01`);
    const points = sliced.map((p) => ({ d: p.d, v: p.v }));
    return {
      range,
      asOf,
      spot,
      points,
      chgPct: pctOver(points),
      source: "spot-store",
    };
  }

  const days = RANGE_DAYS[range];
  const sliced = sliceByCalendarDays(store, days);
  const points = sliced.map((p) => ({ d: p.d, v: p.v }));
  return {
    range,
    asOf,
    spot,
    points,
    chgPct: pctOver(points),
    source: "spot-store",
  };
}
