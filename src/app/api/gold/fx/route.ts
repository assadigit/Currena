import { NextResponse } from "next/server";

/**
 * GET /api/gold/fx — the wealth calculator's currency leg: month-end
 * FX closes per unit of currency per 1 USD since the if-bought series'
 * own era (2016-11), for every currency the converter carries:
 *
 *   - the eleven crosses off the Yahoo chart API's own monthly bars
 *     (each bar's close IS that month's own last trading close; the
 *     running month's bar is the running price);
 *   - the Iranian toman off TGJU's free-market dollar (price_dollar_rl)
 *     — the same source and basis as the site's own Tehran board,
 *     month-ends computed from the daily rows, rial ÷ 10 = toman.
 *
 * Server-side only, memory-cached five minutes, fail-closed per
 * currency: a cross that cannot be read is simply absent from the
 * payload and the calculator disables its unit — never a guess. The
 * page computes client-side; this route serves data, never arithmetic.
 */

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 20_000;

/** The crosses the converter carries, with their Yahoo symbols and the
 *  per-USD direction (true: the pair's close is already units per USD). */
const YAHOO_CROSSES: { ccy: string; symbol: string; perUsd: boolean }[] = [
  { ccy: "aud", symbol: "AUDUSD=X", perUsd: true },
  { ccy: "nzd", symbol: "NZDUSD=X", perUsd: true },
  { ccy: "eur", symbol: "EURUSD=X", perUsd: true },
  { ccy: "gbp", symbol: "GBPUSD=X", perUsd: true },
  { ccy: "cad", symbol: "USDCAD=X", perUsd: true },
  { ccy: "chf", symbol: "USDCHF=X", perUsd: false },
  { ccy: "jpy", symbol: "USDJPY=X", perUsd: true },
  { ccy: "cny", symbol: "USDCNY=X", perUsd: true },
  { ccy: "aed", symbol: "USDAED=X", perUsd: true },
  { ccy: "try", symbol: "USDTRY=X", perUsd: true },
  { ccy: "krw", symbol: "USDKRW=X", perUsd: true },
];

/** The month window's own start (the if-bought era) with a one-month
 *  lead so the 2016-11 bar exists. */
const ERA_START_EPOCH = 1_475_280_000; // 2016-10-01T00:00:00Z

/** TGJU's free-market dollar indicator (the Tehran board's own source). */
const TGJU_URL =
  "https://api.tgju.org/v1/market/indicator/summary-table-data/price_dollar_rl?lang=fa&formated=1&responseType=full";

interface LegEntry {
  at: number;
  value: unknown;
}

const globalForFx = globalThis as unknown as {
  __currenaGoldFx?: LegEntry;
};
const fxCache: LegEntry | undefined = globalForFx.__currenaGoldFx;
globalForFx.__currenaGoldFx = fxCache;

/** A month key off a bar timestamp (UTC — never a timezone off-by-one). */
function monthKey(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 7);
}

/** One Yahoo chart read (daily bars — the monthly bars' timestamps are
 *  unreliable, the daily dates are their own truth). */
interface YahooChart {
  chart?: {
    result?: {
      timestamp?: number[];
      indicators?: {
        quote?: { close?: (number | null)[] }[];
      };
    }[];
    error?: unknown;
  };
}

async function fetchYahooCross(
  symbol: string,
  perUsd: boolean,
): Promise<Record<string, number> | null> {
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?period1=${ERA_START_EPOCH}&period2=${Math.floor(Date.now() / 1000)}&interval=1d`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as YahooChart;
    const result = json.chart?.result?.[0];
    const ts = result?.timestamp;
    const closes = result?.indicators?.quote?.[0]?.close;
    if (!Array.isArray(ts) || !Array.isArray(closes)) return null;
    if (ts.length === 0) return null;
    // Daily bars, ascending: each month's LAST trading close is its
    // month-end (the running month's latest row is the running price).
    const table: Record<string, number> = {};
    for (let i = 0; i < ts.length; i++) {
      const close = closes[i];
      if (typeof close !== "number" || !Number.isFinite(close) || close <= 0) continue;
      const value = perUsd ? close : 1 / close;
      if (Number.isFinite(value) && value > 0) {
        table[monthKey(ts[i]!)] = value;
      }
    }
    return Object.keys(table).length > 0 ? table : null;
  } catch {
    return null;
  }
}

interface TgjuResponse {
  data?: unknown;
}

async function fetchTomanTable(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(TGJU_URL, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as TgjuResponse;
    const rows = json.data;
    if (!Array.isArray(rows)) return null;
    // Each row: [open, low, high, close, change, change%, "YYYY/MM/DD", jalali]
    // — the daily rows run NEWEST-FIRST; a month's END is its last row.
    type MonthAcc = { key: string; close: number };
    let acc: MonthAcc | null = null;
    const table: Record<string, number> = {};
    const commit = (row: MonthAcc | null) => {
      if (row === null) return;
      table[row.key] = row.close;
    };
    for (let i = rows.length - 1; i >= 0; i--) {
      // walk oldest → newest so each month's LAST row wins the key
      const r = rows[i];
      if (!Array.isArray(r)) continue;
      const closeRaw = r[3];
      const dateRaw = r[6];
      if (typeof closeRaw !== "string" || typeof dateRaw !== "string") continue;
      const close = Number(closeRaw.replace(/,/g, ""));
      const ymd = dateRaw.replace(/\//g, "-");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd) || !Number.isFinite(close) || close <= 0) continue;
      const key = ymd.slice(0, 7);
      const toman = close / 10; // TGJU quotes rial; the site speaks toman
      if (acc === null || acc.key !== key) {
        commit(acc);
        acc = { key, close: toman };
      } else {
        acc.close = toman;
      }
    }
    commit(acc);
    return Object.keys(table).length > 0 ? table : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const hit = globalForFx.__currenaGoldFx;
  if (hit !== undefined && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.value, { headers: { "cache-control": "no-store" } });
  }

  const crossResults = await Promise.all(
    YAHOO_CROSSES.map((c) => fetchYahooCross(c.symbol, c.perUsd)),
  );
  const tomanTable = await fetchTomanTable();

  const perUsd: Record<string, Record<string, number>> = {};
  let arrived = 0;
  for (let i = 0; i < YAHOO_CROSSES.length; i++) {
    const table = crossResults[i];
    if (table === null) continue;
    perUsd[YAHOO_CROSSES[i]!.ccy] = table;
    arrived++;
  }
  if (tomanTable !== null) {
    perUsd["toman"] = tomanTable;
    arrived++;
  }

  if (arrived === 0) {
    return NextResponse.json(
      { error: "The currency month-end series could not be read yet." },
      { status: 503 },
    );
  }

  const value = { v: 1, fetchedAt: new Date().toISOString(), perUsd };
  globalForFx.__currenaGoldFx = { at: Date.now(), value };
  return NextResponse.json(value, { headers: { "cache-control": "no-store" } });
}
