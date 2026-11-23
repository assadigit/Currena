/**
 * S10 Roots layer — the EODHD adapter and observation store.
 *
 * Server-side only (imported from /api/desk-reachable code; never from
 * client components). Grounds the desk's price/macro series in real
 * market data via the EODHD end-of-day API:
 *
 *   gold       XAUUSD.FOREX   gold spot, USD per troy ounce
 *   silver     XAGUSD.FOREX   silver spot, USD per troy ounce
 *   dxy        ICE formula    US Dollar Index computed from the six
 *                              component FX pairs via the published
 *                              ICE weights (exact construction, not a
 *                              modelled proxy)
 *   spx        SPY.US         S&P 500 via SPDR SPY ETF closes (the
 *                              engine consumes only % moves)
 *   realYield  ^TNX.US        10Y nominal Treasury yield (CBOE ^TNX) —
 *                              real-yield PROXY: no TIPS real-yield
 *                              series exists on this subscription
 *   oil        USO.US         WTI crude via US Oil Fund ETF closes
 *                              (futures-roll proxy; correlations only)
 *
 * Series with no EODHD source on this plan stay modelled by the
 * deterministic engine: COMEX net specs (weekly CFTC report), gold ETF
 * flows, the news tape and news sentiment.
 *
 * The symbol registry below was recorded by a live probe of the API at
 * session start; EODHD plans gate symbol universes, so the registry
 * keeps honest notes rather than assumptions. The API token is read
 * from process.env.EODHD_TOKEN only — it is never stored in the repo,
 * the database, or the logs, and is never printed.
 *
 * Fetching is trailing-window-once-per-day (SourceSync rows gate the
 * sync; a force re-pull is used by the regenerate path). Observations
 * persist in SQLite as one row per dataset-date.
 */

import { db } from "@/lib/db";
import type { DatasetProvenance } from "../types";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

/** Calendar days to request per symbol (EODHD caps history at ~1 trailing year). */
const FETCH_WINDOW_DAYS = 380;

/** Maximum trading days fed to the engine (matches the engine's own window). */
const MAX_ENGINE_WINDOW = 500;

/** Minimum live trading days for an honest grounded build (52-week-style stats need depth). */
export const MIN_LIVE_DEPTH = 200;

/** A feed whose latest common trading day lags the request by more than this is stale. */
const MAX_STALE_CALENDAR_DAYS = 5;

const EOD_ENDPOINT = "https://eodhd.com/api/eod";

/* ------------------------------------------------------------------ */
/* Symbol registry (recorded by the live probe)                         */
/* ------------------------------------------------------------------ */

export interface SourceSpec {
  dataset: MarketDataset;
  symbol: string;
  label: string;
  /** Honest note about what this source actually is. */
  note: string;
  /** live-proxy when the series is an ETF/formula standing in for the named instrument. */
  mode: "live" | "live-proxy";
}

export type MarketDataset =
  | "gold"
  | "dxy"
  | "spx"
  | "realYield"
  | "silver"
  | "oil";

export const SOURCE_REGISTRY: SourceSpec[] = [
  {
    dataset: "gold",
    symbol: "XAUUSD.FOREX",
    label: "Gold spot (XAU/USD)",
    note: "USD per troy ounce, EODHD forex feed.",
    mode: "live",
  },
  {
    dataset: "silver",
    symbol: "XAGUSD.FOREX",
    label: "Silver spot (XAG/USD)",
    note: "USD per troy ounce, EODHD forex feed.",
    mode: "live",
  },
  {
    dataset: "dxy",
    symbol: "ICE DXY formula",
    label: "US Dollar Index",
    note: "Computed from the six component pairs (EURUSD, USDJPY, GBPUSD, USDCAD, USDSEK, USDCHF) via the published ICE index weights — exact construction, not a modelled proxy.",
    mode: "live",
  },
  {
    dataset: "spx",
    symbol: "SPY.US",
    label: "S&P 500 (SPY ETF)",
    note: "Index not on this EODHD plan; served by SPDR SPY ETF closing prices — the desk consumes its daily % moves.",
    mode: "live-proxy",
  },
  {
    dataset: "realYield",
    symbol: "^TNX.US",
    label: "10Y Treasury yield (CBOE ^TNX)",
    note: "Real-yield proxy: no TIPS real-yield series on this plan; the 10Y nominal Treasury yield stands in for it.",
    mode: "live-proxy",
  },
  {
    dataset: "oil",
    symbol: "USO.US",
    label: "WTI crude (USO ETF)",
    note: "WTI futures-roll proxy via US Oil Fund ETF closes; used for correlations only.",
    mode: "live-proxy",
  },
];

/** DXY component pairs (stored under dataset key `dxy:<PAIR>`). */
const DXY_PAIRS: { key: string; symbol: string; weight: number }[] = [
  { key: "dxy:EURUSD", symbol: "EURUSD.FOREX", weight: -0.576 },
  { key: "dxy:USDJPY", symbol: "USDJPY.FOREX", weight: 0.136 },
  { key: "dxy:GBPUSD", symbol: "GBPUSD.FOREX", weight: -0.119 },
  { key: "dxy:USDCAD", symbol: "USDCAD.FOREX", weight: 0.091 },
  { key: "dxy:USDSEK", symbol: "USDSEK.FOREX", weight: 0.042 },
  { key: "dxy:USDCHF", symbol: "USDCHF.FOREX", weight: 0.036 },
];

/** The published ICE U.S. Dollar Index base value. */
const DXY_BASE = 50.14348112;

/** Modelled datasets — series the engine keeps synthetic (no EODHD source). */
export const MODELLED_REGISTRY: { dataset: string; label: string; note: string }[] = [
  {
    dataset: "netSpecs",
    label: "COMEX net specs",
    note: "Managed-money positioning comes from the weekly CFTC report — not on this EODHD plan; modelled.",
  },
  {
    dataset: "etfFlows",
    label: "Gold ETF flows",
    note: "No EODHD source for physical ETF flow data; modelled.",
  },
  {
    dataset: "sentiment",
    label: "News tape & sentiment",
    note: "No EODHD news/sentiment source on this plan; modelled.",
  },
];

/* ------------------------------------------------------------------ */
/* Thin client                                                          */
/* ------------------------------------------------------------------ */

interface EodRow {
  date: string;
  close: number;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetch end-of-day closes for one symbol over the trailing window.
 * The token comes from process.env only and never appears in errors.
 */
export async function fetchEod(
  symbol: string,
  from: string,
  to: string
): Promise<EodRow[]> {
  const token = process.env.EODHD_TOKEN;
  if (!token) {
    throw new Error("EODHD token is not configured (process.env.EODHD_TOKEN)");
  }
  const url = `${EOD_ENDPOINT}/${encodeURIComponent(symbol)}?api_token=${token}&fmt=json&from=${from}&to=${to}&order=a`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) {
    // Plan-gated or unknown symbols surface as 403/404 — no token echo.
    throw new Error(`EODHD responded ${res.status} for ${symbol}`);
  }
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) {
    throw new Error(`EODHD returned a non-array payload for ${symbol}`);
  }
  return json
    .filter(
      (r): r is { date: string; close: number } =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as { date?: unknown }).date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test((r as { date: string }).date) &&
        typeof (r as { close?: unknown }).close === "number" &&
        Number.isFinite((r as { close: number }).close) &&
        (r as { close: number }).close > 0
    )
    .map((r) => ({ date: r.date, close: r.close }));
}

/* ------------------------------------------------------------------ */
/* Sync — trailing window, once per day (cache-first)                   */
/* ------------------------------------------------------------------ */

export interface SyncReport {
  /** True when the daily gate skipped the network entirely. */
  skipped: boolean;
  /** Latest observation date across live datasets, when known. */
  asOf?: string;
  /** Per-dataset sync outcome. */
  statuses: { dataset: string; status: string; asOf?: string; note?: string }[];
}

function isSyncedToday(syncedAt: Date): boolean {
  return syncedAt.toISOString().slice(0, 10) === isoToday();
}

async function upsertSync(
  dataset: string,
  symbol: string,
  status: string,
  asOf: string | null,
  note: string | null
): Promise<void> {
  await db.sourceSync.upsert({
    where: { dataset },
    update: { symbol, status, asOf: asOf ?? undefined, note },
    create: { dataset, symbol, status, asOf: asOf ?? undefined, note },
  });
}

async function storeObservations(
  dataset: string,
  rows: EodRow[]
): Promise<void> {
  if (rows.length === 0) return;
  // The delete-then-create makes each window write idempotent; SQLite
  // does not support skipDuplicates, and none is needed.
  const from = rows[0].date;
  await db.observation.deleteMany({ where: { dataset, date: { gte: from } } });
  await db.observation.createMany({
    data: rows.map((r) => ({ dataset, date: r.date, close: r.close })),
  });
}

/** Compute the ICE DXY from stored component-pair observations. */
async function computeDxy(): Promise<EodRow[]> {
  const pairMaps = new Map<string, Map<string, number>>();
  for (const p of DXY_PAIRS) {
    const rows = await db.observation.findMany({
      where: { dataset: p.key },
      orderBy: { date: "asc" },
    });
    pairMaps.set(
      p.key,
      new Map(rows.map((r) => [r.date, r.close]))
    );
  }

  // Common dates across all six pairs.
  const [first, ...rest] = DXY_PAIRS.map((p) => pairMaps.get(p.key)!);
  const common = [...first.keys()].filter((d) =>
    rest.every((m) => m.has(d))
  );

  return common.map((date) => {
    let level = DXY_BASE;
    for (const p of DXY_PAIRS) {
      level *= Math.pow(pairMaps.get(p.key)!.get(date)!, p.weight);
    }
    return { date, close: Math.round(level * 1000) / 1000 };
  });
}

/**
 * Ensure the observation store is current. Runs the network sync at most
 * once per UTC day (cache-first); `force` re-pulls (the regenerate path).
 * Failures are recorded per dataset and never throw — the desk falls
 * back to the deterministic engine.
 */
export async function ensureObservations(force = false): Promise<SyncReport> {
  const existing = await db.sourceSync.findMany();
  const allSyncedToday =
    existing.length > 0 &&
    existing.every((s) => isSyncedToday(s.syncedAt)) &&
    existing.some((s) => s.status === "live");

  if (!force && allSyncedToday) {
    return {
      skipped: true,
      asOf: existing.find((s) => s.status === "live")?.asOf ?? undefined,
      statuses: existing.map((s) => ({
        dataset: s.dataset,
        status: s.status,
        asOf: s.asOf ?? undefined,
        note: s.note ?? undefined,
      })),
    };
  }

  if (!process.env.EODHD_TOKEN) {
    for (const spec of SOURCE_REGISTRY) {
      await upsertSync(
        spec.dataset,
        spec.symbol,
        "unavailable",
        null,
        "EODHD token not configured — series stays modelled"
      );
    }
    return {
      skipped: false,
      statuses: SOURCE_REGISTRY.map((s) => ({
        dataset: s.dataset,
        status: "unavailable",
        note: "EODHD token not configured",
      })),
    };
  }

  const from = isoDaysAgo(FETCH_WINDOW_DAYS);
  const to = isoToday();
  const statuses: SyncReport["statuses"] = [];

  // Direct symbol datasets (all in parallel; the volume is one call per symbol).
  const directSpecs = SOURCE_REGISTRY.filter((s) => s.dataset !== "dxy");
  const results = await Promise.allSettled(
    directSpecs.map((spec) => fetchEod(spec.symbol, from, to))
  );
  for (let i = 0; i < directSpecs.length; i++) {
    const spec = directSpecs[i];
    const r = results[i];
    if (r.status === "fulfilled" && r.value.length > 0) {
      await storeObservations(spec.dataset, r.value);
      const asOf = r.value[r.value.length - 1].date;
      await upsertSync(spec.dataset, spec.symbol, "live", asOf, spec.note);
      statuses.push({ dataset: spec.dataset, status: "live", asOf });
    } else {
      const reason =
        r.status === "rejected"
          ? r.reason instanceof Error
            ? r.reason.message
            : "unknown error"
          : "no rows returned";
      await upsertSync(
        spec.dataset,
        spec.symbol,
        "error",
        null,
        `EODHD fetch failed: ${reason}`
      );
      statuses.push({ dataset: spec.dataset, status: "error", note: reason });
    }
  }

  // DXY component pairs, then the computed index.
  const pairResults = await Promise.allSettled(
    DXY_PAIRS.map((p) => fetchEod(p.symbol, from, to))
  );
  let pairsOk = true;
  for (let i = 0; i < DXY_PAIRS.length; i++) {
    const p = DXY_PAIRS[i];
    const r = pairResults[i];
    if (r.status === "fulfilled" && r.value.length > 0) {
      await storeObservations(p.key, r.value);
    } else {
      pairsOk = false;
      const reason =
        r.status === "rejected"
          ? r.reason instanceof Error
            ? r.reason.message
            : "unknown error"
          : "no rows returned";
      statuses.push({ dataset: p.key, status: "error", note: reason });
    }
  }

  const dxySpec = SOURCE_REGISTRY.find((s) => s.dataset === "dxy")!;
  if (pairsOk) {
    const dxyRows = await computeDxy();
    if (dxyRows.length > 0) {
      await storeObservations("dxy", dxyRows);
      const asOf = dxyRows[dxyRows.length - 1].date;
      await upsertSync("dxy", dxySpec.symbol, "live", asOf, dxySpec.note);
      statuses.push({ dataset: "dxy", status: "live", asOf });
    } else {
      await upsertSync("dxy", dxySpec.symbol, "error", null, "no common pair dates");
      statuses.push({ dataset: "dxy", status: "error" });
    }
  } else {
    await upsertSync(
      "dxy",
      dxySpec.symbol,
      "error",
      null,
      "one or more component pairs failed to sync"
    );
    statuses.push({ dataset: "dxy", status: "error" });
  }

  const liveAsOf = statuses
    .filter((s) => s.status === "live")
    .map((s) => s.asOf)
    .filter((d): d is string => Boolean(d))
    .sort()
    .pop();

  return { skipped: false, asOf: liveAsOf, statuses };
}

/* ------------------------------------------------------------------ */
/* Grounded bundle — aligned series for the engine seam                 */
/* ------------------------------------------------------------------ */

export interface GroundedBundle {
  ok: true;
  /** Trading-day labels common to every live dataset (ascending). */
  dates: string[];
  /** The stamped trading day (latest common date at or before the request). */
  asOf: string;
  /** Live depth of the window. */
  windowDays: number;
  /** Series overrides keyed by engine series name (only live datasets). */
  series: Partial<Record<MarketDataset, number[]>>;
  /** Which market datasets are grounded in this bundle. */
  liveDatasets: MarketDataset[];
  /** Fetched-at stamp from the sync registry. */
  fetchedAt: string;
}

export interface GroundedFailure {
  ok: false;
  reason: string;
}

function calendarDaysBetween(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((da - db) / 86_400_000);
}

/**
 * Build the aligned live-series bundle for a requested desk date.
 *
 * The grid is the intersection of every live dataset's dates (US equity
 * calendars anchor it to real trading days; weekend forex quotes drop
 * out). The window is capped at the engine's own 500-day depth. The
 * request fails closed — with an honest reason — when gold (the core
 * series) is unavailable, the window is too shallow for honest
 * 52-week-style statistics, or the feed is stale.
 */
export async function getGroundedBundle(
  requestedDate: string
): Promise<GroundedBundle | GroundedFailure> {
  const syncs = await db.sourceSync.findMany();
  const syncByDataset = new Map(syncs.map((s) => [s.dataset, s]));

  const goldSync = syncByDataset.get("gold");
  if (!goldSync || goldSync.status !== "live") {
    return {
      ok: false,
      reason: `gold spot has no live source (${goldSync?.status ?? "never synced"}) — serving the deterministic engine`,
    };
  }

  const marketDatasets: MarketDataset[] = [
    "gold",
    "dxy",
    "spx",
    "realYield",
    "silver",
    "oil",
  ];

  // Load observations per dataset, clipped to dates at or before the request.
  const observations = new Map<string, Map<string, number>>();
  const liveDatasets: MarketDataset[] = [];
  for (const ds of marketDatasets) {
    const sync = syncByDataset.get(ds);
    if (!sync || sync.status !== "live") continue;
    const rows = await db.observation.findMany({
      where: { dataset: ds, date: { lte: requestedDate } },
      orderBy: { date: "asc" },
    });
    if (rows.length === 0) continue;
    observations.set(ds, new Map(rows.map((r) => [r.date, r.close])));
    liveDatasets.push(ds);
  }

  if (!observations.has("gold")) {
    return {
      ok: false,
      reason:
        "no gold observations at or before the requested date — serving the deterministic engine",
    };
  }

  // Intersect dates across all live datasets.
  const goldMap = observations.get("gold")!;
  const others = [...observations.entries()].filter(([ds]) => ds !== "gold");
  const commonDates = [...goldMap.keys()].filter((d) =>
    others.every(([, m]) => m.has(d))
  );

  if (commonDates.length === 0) {
    return {
      ok: false,
      reason:
        "no trading day common to the live series at or before the requested date",
    };
  }

  const window = commonDates.slice(-MAX_ENGINE_WINDOW);
  const asOf = window[window.length - 1];

  if (calendarDaysBetween(requestedDate, asOf) > MAX_STALE_CALENDAR_DAYS) {
    return {
      ok: false,
      reason: `live data is stale (latest trading day ${asOf}, requested ${requestedDate}) — serving the deterministic engine`,
    };
  }

  if (window.length < MIN_LIVE_DEPTH) {
    return {
      ok: false,
      reason: `insufficient live history for ${requestedDate} (${window.length} trading days; ${MIN_LIVE_DEPTH} needed) — serving the deterministic engine`,
    };
  }

  const series: Partial<Record<MarketDataset, number[]>> = {};
  for (const ds of liveDatasets) {
    series[ds] = window.map((d) => observations.get(ds)!.get(d)!);
  }

  const fetchedAt =
    syncByDataset.get("gold")?.syncedAt?.toISOString() ??
    new Date().toISOString();

  return {
    ok: true,
    dates: window,
    asOf,
    windowDays: window.length,
    series,
    liveDatasets,
    fetchedAt,
  };
}

/**
 * Provenance fragments for the market series, given the set that grounded.
 * Every entry states exactly what served it and how.
 */
export function marketProvenance(
  liveDatasets: MarketDataset[],
  asOf: string
): DatasetProvenance[] {
  const live = new Set(liveDatasets);
  return SOURCE_REGISTRY.map((spec) => {
    if (live.has(spec.dataset)) {
      return {
        dataset: spec.dataset,
        label: spec.label,
        mode: spec.mode,
        source: spec.symbol,
        asOf,
        note: spec.note,
      };
    }
    return {
      dataset: spec.dataset,
      label: spec.label,
      mode: "modelled" as const,
      note: `${spec.label} could not be grounded — deterministic engine series. ${spec.note}`,
    };
  });
}

/** Provenance entries for the always-modelled datasets. */
export function modelledProvenance(): DatasetProvenance[] {
  return MODELLED_REGISTRY.map((m) => ({
    dataset: m.dataset,
    label: m.label,
    mode: "modelled" as const,
    note: m.note,
  }));
}
