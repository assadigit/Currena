/**
 * The COMEX futures layer — the paper-market band's own legs
 * (docs/gold-page/SESSION-3-PROMPT.md, approved item A).
 *
 * Two Yahoo Finance public legs, the exact fetch grammar the trend layer
 * already uses (user-agent + accept headers, AbortSignal.timeout,
 * in-memory TTL cache per isolate, failed legs retried within a minute):
 *
 *   1. the chart leg — the front contract GC=F, whose meta carries the
 *      contract's own name ("Gold Dec 26" — read from the feed, never
 *      hard-coded), price, day change, day range, volume, market time
 *      and the 52-week range. There is NO open interest on this feed —
 *      the band never shows OI.
 *   2. the spark leg — the next ~6 quarterly actives after the front
 *      (month codes computed from the front's own expiry: G=Feb, J=Apr,
 *      M=Jun, Q=Aug, V=Oct, Z=Dec, .CMX suffix), one call, each symbol
 *      its own fulldayPrice / previousClose; a symbol that fails is
 *      dropped honestly, never guessed.
 *
 * Server-side only (imported from the API route; never from client
 * components). Every field is an honest null when the feed does not
 * carry it; a leg that fails fails closed.
 */

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

/** The front contract's own read — every field optional in the feed. */
export interface FuturesFront {
  /** The contract's own name, e.g. "Gold Dec 26" — read, never hard-coded. */
  contract: string;
  price: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  /** The feed's own market time, ISO (UTC). */
  marketTime: string | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

/** One further delivery date on the curve. */
export interface FuturesTermRow {
  /** The Yahoo symbol, e.g. "GCG27.CMX". */
  symbol: string;
  /** Delivery month, 1–12. */
  month: number;
  /** Delivery year, 4 digits. */
  year: number;
  /** The English month-year label, e.g. "Feb 2027" (the page localizes). */
  monthLabel: string;
  price: number;
  /** price − front price, USD; null when the front leg did not arrive. */
  vsFrontUsd: number | null;
}

/** The band's whole snapshot — what the route serves. */
export interface FuturesSnapshot {
  front: FuturesFront | null;
  term: FuturesTermRow[];
  fetchedAt: string;
  source: "yahoo-finance";
  delayed: true;
}

/* ------------------------------------------------------------------ */
/* The contract-month calendar                                          */
/* ------------------------------------------------------------------ */

/** COMEX gold's quarterly delivery months (month numbers, 1–12). */
const QUARTER_MONTHS = [2, 4, 6, 8, 10, 12] as const;

/** The exchange's own single-letter month codes. */
const MONTH_CODE: Record<number, string> = { 2: "G", 4: "J", 6: "M", 8: "Q", 10: "V", 12: "Z" };

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** Parse the front's own name ("Gold Dec 26") into its delivery month. */
function parseFrontMonth(shortName: string): { month: number; year: number } | null {
  const parts = shortName.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const monthIdx = MONTHS_EN.indexOf(parts[parts.length - 2]! as (typeof MONTHS_EN)[number]);
  const yy = Number(parts[parts.length - 1]);
  if (monthIdx < 0 || !Number.isInteger(yy) || yy < 0 || yy > 99) return null;
  return { month: monthIdx + 1, year: 2000 + yy };
}

/** The next `n` quarterly delivery months strictly after (month, year). */
function nextQuarterlies(month: number, year: number, n: number): Array<{ month: number; year: number }> {
  const out: Array<{ month: number; year: number }> = [];
  let m = month;
  let y = year;
  while (out.length < n) {
    do {
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    } while (!(QUARTER_MONTHS as readonly number[]).includes(m));
    out.push({ month: m, year: y });
  }
  return out;
}

/**
 * The term calendar's anchor: the front's own expiry when the feed names
 * it, else today's UTC date walked to the nearest quarterly (the honest
 * fallback — the front leg failed, so the table shows the quarterlies
 * the calendar itself offers, each dropped honestly if it does not quote).
 */
function termAnchor(shortName: string | null): { month: number; year: number } {
  if (shortName !== null) {
    const parsed = parseFrontMonth(shortName);
    if (parsed !== null) return parsed;
  }
  const now = new Date();
  let m = now.getUTCMonth() + 1;
  const y = now.getUTCFullYear();
  if (!(QUARTER_MONTHS as readonly number[]).includes(m)) {
    // advance to the next quarterly month of the same year
    const next = QUARTER_MONTHS.find((q) => q > m);
    if (next !== undefined) m = next;
    else m = 2; // next February, next year — the loop below walks the year
  }
  return { month: m, year: y };
}

/** The Yahoo symbols for the next `n` quarterly actives after the anchor. */
function termSymbols(anchor: { month: number; year: number }, n: number): Array<{ symbol: string; month: number; year: number; monthLabel: string }> {
  return nextQuarterlies(anchor.month, anchor.year, n).map(({ month, year }) => ({
    symbol: `GC${MONTH_CODE[month]}${String(year % 100).padStart(2, "0")}.CMX`,
    month,
    year,
    monthLabel: `${MONTHS_EN[month - 1]} ${year}`,
  }));
}

/* ------------------------------------------------------------------ */
/* The Yahoo legs (cached, fail-closed)                                 */
/* ------------------------------------------------------------------ */

interface CacheEntry {
  at: number;
  value: FuturesSnapshot | null;
}

const globalForFutures = globalThis as unknown as {
  __currenaGoldFutures?: CacheEntry;
};
const futuresCache: CacheEntry | undefined = globalForFutures.__currenaGoldFutures;
globalForFutures.__currenaGoldFutures = futuresCache;

const YAHOO_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const YAHOO_TIMEOUT_MS = 10_000;
/** The quote is intraday-ish — one warm read serves the band for 90 s. */
const SNAPSHOT_TTL_MS = 90 * 1000;
/** A failed snapshot retries within a minute, never poisoning the isolate. */
const FAIL_TTL_MS = 60 * 1000;

interface YahooChartMeta {
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  previousClose?: number;
}
interface YahooChart {
  chart?: { result?: Array<{ meta?: YahooChartMeta }>; error?: unknown };
}

/** The front leg — GC=F's own meta. Null when it cannot be read. */
async function fetchFront(): Promise<FuturesFront | null> {
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?range=1d&interval=30m", {
      headers: { "user-agent": YAHOO_UA, accept: "application/json" },
      signal: AbortSignal.timeout(YAHOO_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as YahooChart;
    const meta = json.chart?.result?.[0]?.meta;
    if (meta === undefined) return null;
    const price = meta.regularMarketPrice;
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return null;
    const contract = typeof meta.shortName === "string" && meta.shortName.trim().length > 0 ? meta.shortName.trim() : "GC=F";
    /* the day change: the feed's own percent when it carries one, else
       the honest arithmetic off its own previous close */
    let changePct: number | null = null;
    if (typeof meta.regularMarketChangePercent === "number" && Number.isFinite(meta.regularMarketChangePercent)) {
      changePct = meta.regularMarketChangePercent;
    } else if (typeof meta.previousClose === "number" && meta.previousClose > 0) {
      changePct = (price / meta.previousClose - 1) * 100;
    }
    const numOrNull = (v: unknown): number | null =>
      typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
    return {
      contract,
      price,
      changePct,
      dayHigh: numOrNull(meta.regularMarketDayHigh),
      dayLow: numOrNull(meta.regularMarketDayLow),
      volume: typeof meta.regularMarketVolume === "number" && Number.isFinite(meta.regularMarketVolume) && meta.regularMarketVolume >= 0 ? meta.regularMarketVolume : null,
      marketTime:
        typeof meta.regularMarketTime === "number" && Number.isFinite(meta.regularMarketTime)
          ? new Date(meta.regularMarketTime * 1000).toISOString()
          : null,
      fiftyTwoWeekHigh: numOrNull(meta.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: numOrNull(meta.fiftyTwoWeekLow),
    };
  } catch {
    return null;
  }
}

interface YahooSparkEntry {
  symbol?: string;
  fulldayPrice?: number;
  previousClose?: number;
  close?: Array<number | null>;
}

/** The term leg — one spark call for every quarterly symbol at once. */
async function fetchTerm(
  wanted: Array<{ symbol: string; month: number; year: number; monthLabel: string }>,
  frontPrice: number | null,
): Promise<FuturesTermRow[]> {
  if (wanted.length === 0) return [];
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${wanted
      .map((w) => encodeURIComponent(w.symbol))
      .join(",")}`;
    const res = await fetch(url, {
      headers: { "user-agent": YAHOO_UA, accept: "application/json" },
      signal: AbortSignal.timeout(YAHOO_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as Record<string, YahooSparkEntry>;
    const rows: FuturesTermRow[] = [];
    for (const w of wanted) {
      const entry = json[w.symbol];
      const price = entry?.fulldayPrice;
      if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) continue; // dropped honestly
      rows.push({
        symbol: w.symbol,
        month: w.month,
        year: w.year,
        monthLabel: w.monthLabel,
        price,
        vsFrontUsd: frontPrice !== null ? price - frontPrice : null,
      });
    }
    return rows;
  } catch {
    return [];
  }
}

/**
 * The whole snapshot, memory-cached per isolate. The front is read
 * first (its own name fixes the term calendar); the spark leg follows.
 * Null only when BOTH legs fail — the route then answers the honest 503.
 */
export async function getFuturesSnapshot(): Promise<FuturesSnapshot | null> {
  const hit = globalForFutures.__currenaGoldFutures;
  if (hit !== undefined) {
    const ttl = hit.value === null ? FAIL_TTL_MS : SNAPSHOT_TTL_MS;
    if (Date.now() - hit.at < ttl) return hit.value;
  }

  const front = await fetchFront();
  const anchor = termAnchor(front !== null ? front.contract : null);
  const term = await fetchTerm(termSymbols(anchor, 6), front !== null ? front.price : null);

  const value: FuturesSnapshot | null =
    front !== null || term.length > 0
      ? {
          front,
          term,
          fetchedAt: new Date().toISOString(),
          source: "yahoo-finance",
          delayed: true,
        }
      : null;
  globalForFutures.__currenaGoldFutures = { at: Date.now(), value };
  return value;
}
