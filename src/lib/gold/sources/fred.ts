/**
 * The FRED yields source — the real-yield re-sourcing (docs/fred-yields-spec.md).
 *
 * Server-side only (imported from eodhd.ts's sync orchestrator; never
 * from client components). Grounds the desk's two yield series in the
 * Federal Reserve's own H.15 constant-maturity series via FRED's public
 * CSV endpoint — no API key, no registration, no quota:
 *
 *   realYield     DFII10   the 10-year TIPS REAL yield (constant
 *                           maturity, inflation-indexed) — from
 *                           2003-01-02
 *   nominalYield  DGS10    the 10-year Treasury NOMINAL yield
 *                           (constant maturity) — from 1962-01-02
 *
 * The dataset key `realYield` is kept (the engine seam, the builder
 * text and every downstream fact keep their shape); what changes is
 * the bytes behind it — the true TIPS series, never again a nominal
 * proxy in real-yield clothing. `nominalYield` is new and rides the
 * same store → API → page path.
 *
 * The CSV contract (verified live, docs/evidence/fred-yields-census-
 * 2026-11-25.json): the first line is the header
 * `observation_date,<SERIES_ID>`; data lines are `YYYY-MM-DD,value`;
 * missing observations print as "." and bond-market holidays print as
 * date-only rows with an empty value cell — both are dropped, never
 * filled, never stored.
 *
 * Syncing is trailing-window-once-per-UTC-day (SourceSync rows gate
 * the fetch; the regenerate path forces a re-pull), the same
 * storeObservations/sourceSync discipline eodhd.ts carries. Failures
 * are recorded per dataset and never throw — the desk falls back to
 * the deterministic engine with honest provenance. There is no proxy
 * to fall back to: FRED down means the engine-modelled series.
 */

import { db } from "@/lib/db";
import type { MarketDataset, SyncReport } from "./eodhd";

/* ------------------------------------------------------------------ */
/* The FRED specs (the registry entries this module owns)               */
/* ------------------------------------------------------------------ */

export interface FredSpec {
  dataset: MarketDataset;
  seriesId: "DFII10" | "DGS10";
  /** The provenance symbol: "FRED DFII10" / "FRED DGS10". */
  symbol: string;
  label: string;
  /** Honest note about what this source actually is. */
  note: string;
}

export const FRED_SPECS: FredSpec[] = [
  {
    dataset: "realYield",
    seriesId: "DFII10",
    symbol: "FRED DFII10",
    label: "10Y real yield (TIPS)",
    note: "10-Year TIPS constant-maturity real yield, daily close via FRED (fredgraph.csv, no key).",
  },
  {
    dataset: "nominalYield",
    seriesId: "DGS10",
    symbol: "FRED DGS10",
    label: "10Y nominal Treasury yield",
    note: "10-Year Treasury constant-maturity nominal yield, daily close via FRED (fredgraph.csv, no key).",
  },
];

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";

/**
 * Calendar days to request per series. Covers EODHD's 380-day window
 * with margin so FRED is never the binding constraint of the grounded
 * grid (the probe measured 249 common days with both series live,
 * comfortably above MIN_LIVE_DEPTH = 200); FRED history is free back
 * to 2003 if the window ever needs to widen.
 */
const FRED_WINDOW_DAYS = 400;

/* The identified user agent — the compare leg's own convention (plain,
   honest, never a browser spoof; FRED's public CSV endpoint allows
   programmatic reads). */
const FRED_UA =
  "CurrenaGoldDesk/1.0 (currena.ir/gold; contact sedanama.ir@gmail.com)";

/* ------------------------------------------------------------------ */
/* Thin client — CSV fetch + parse                                      */
/* ------------------------------------------------------------------ */

export interface FredRow {
  date: string;
  close: number;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch one FRED series as CSV over the trailing window. The parse
 * drops missing observations (".", empty bond-holiday rows, any
 * non-numeric cell) and non-date lines — nothing is ever filled.
 */
export async function fetchFredCsv(seriesId: string): Promise<{
  status: number;
  rows: FredRow[];
}> {
  const url = `${FRED_CSV}?id=${encodeURIComponent(seriesId)}&cosd=${isoDaysAgo(FRED_WINDOW_DAYS)}`;
  const res = await fetch(url, {
    headers: { accept: "text/csv", "user-agent": FRED_UA },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`FRED responded ${res.status} for ${seriesId}`);
  }
  const csv = await res.text();
  const rows: FredRow[] = [];
  for (const line of csv.split("\n").slice(1)) {
    const cells = line.trim().split(",");
    if (cells.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(cells[0] ?? "")) {
      const raw = cells[1] ?? "";
      const v = Number(raw);
      // Missing observations: "." — and the bond-market holidays print
      // as date-only rows with an EMPTY value cell, which Number()
      // reads as 0 (finite!) — guarded explicitly, never stored, never
      // filled. (Verified at the byte level: `2025-11-27,\n`.)
      if (raw !== "" && Number.isFinite(v)) rows.push({ date: cells[0]!, close: v });
    }
  }
  return { status: res.status, rows };
}

/* ------------------------------------------------------------------ */
/* Sync — trailing window, once per day (the eodhd.ts discipline)      */
/* ------------------------------------------------------------------ */

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
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

async function storeObservations(dataset: string, rows: FredRow[]): Promise<void> {
  if (rows.length === 0) return;
  // The delete-then-create makes each window write idempotent; the
  // first post-re-source sync swaps the old nominal proxy rows wholesale.
  const from = rows[0].date;
  await db.observation.deleteMany({ where: { dataset, date: { gte: from } } });
  await db.observation.createMany({
    data: rows.map((r) => ({ dataset, date: r.date, close: r.close })),
  });
}

/**
 * Ensure the two FRED datasets are current. Runs the network sync at
 * most once per UTC day (cache-first over this module's own SourceSync
 * rows); `force` re-pulls (the regenerate path). Failures are recorded
 * per dataset and never throw — the bundle excludes the dataset and
 * the engine-modelled path with honest provenance takes over.
 */
export async function ensureFredObservations(
  force = false
): Promise<SyncReport> {
  const existing = await db.sourceSync.findMany();
  const byDataset = new Map(existing.map((s) => [s.dataset, s]));
  const fredRows = FRED_SPECS.map((spec) => byDataset.get(spec.dataset));
  const allSyncedToday =
    fredRows.every((s) => s !== undefined && isSyncedToday(s.syncedAt)) &&
    fredRows.some((s) => s?.status === "live");

  if (!force && allSyncedToday) {
    return {
      skipped: true,
      asOf: fredRows.find((s) => s?.status === "live")?.asOf ?? undefined,
      statuses: FRED_SPECS.map((spec) => {
        const s = byDataset.get(spec.dataset);
        return {
          dataset: spec.dataset,
          status: s?.status ?? "error",
          asOf: s?.asOf ?? undefined,
          note: s?.note ?? undefined,
        };
      }),
    };
  }

  const statuses: SyncReport["statuses"] = [];
  // One small CSV GET per series, in parallel.
  const results = await Promise.allSettled(
    FRED_SPECS.map((spec) => fetchFredCsv(spec.seriesId))
  );
  for (let i = 0; i < FRED_SPECS.length; i++) {
    const spec = FRED_SPECS[i];
    const r = results[i];
    if (r.status === "fulfilled" && r.value.rows.length > 0) {
      await storeObservations(spec.dataset, r.value.rows);
      const asOf = r.value.rows[r.value.rows.length - 1].date;
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
        `FRED fetch failed: ${reason}`
      );
      statuses.push({ dataset: spec.dataset, status: "error", note: reason });
    }
  }

  const liveAsOf = statuses
    .filter((s) => s.status === "live")
    .map((s) => s.asOf)
    .filter((d): d is string => Boolean(d))
    .sort()
    .pop();

  return { skipped: false, asOf: liveAsOf, statuses };
}
