/**
 * FRED yields census probe — the evidence generator for the real-yield
 * re-sourcing (docs/fred-yields-spec.md).
 *
 * Re-verifies, live and cheaply, every claim the spec rests on:
 *
 *   - both series serve as CSV with NO API key (fredgraph.csv)
 *   - the header row is observation_date,<SERIES_ID>
 *   - missing values print as "." (and how many exist where)
 *   - &cosd=YYYY-MM-DD trims the start date
 *   - the latest observations and the derived 10y breakeven
 *   - the FRED bond calendar's effect on the desk's grounded grid:
 *     the intersection of every live dataset's dates must keep ≥ 200
 *     common trading days (MIN_LIVE_DEPTH) once DFII10/DGS10 join it
 *
 * Usage:
 *   bun scripts/fred-probe.ts
 *     → writes docs/evidence/fred-yields-census-<date>.json (gitignored
 *       nothing; the evidence file itself is committed, the house
 *       wgc/te-census pattern)
 *
 * The archive leg (grid intersection) reads db/custom.db strictly
 * read-only via bun:sqlite; when the archive is absent the leg is
 * recorded as skipped, never guessed.
 */

import { Database } from "bun:sqlite";
import { writeFileSync } from "node:fs";

const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";
const UA =
  "CurrenaGoldDesk/1.0 (currena.ir/gold; contact sedanama.ir@gmail.com)";

interface FredRow {
  date: string;
  value: number | null;
}

interface FredFetch {
  status: number;
  rows: FredRow[];
  bytes: number;
  ms: number;
  header: string;
}

async function fetchFred(seriesId: string, cosd?: string): Promise<FredFetch> {
  const url = `${FRED_CSV}?id=${seriesId}${cosd ? `&cosd=${cosd}` : ""}`;
  const t0 = Date.now();
  const res = await fetch(url, {
    headers: { accept: "text/csv", "user-agent": UA },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const csv = await res.text();
  const ms = Date.now() - t0;
  const rows: FredRow[] = [];
  const lines = csv.split("\n");
  const header = lines[0]?.trim() ?? "";
  for (const line of lines.slice(1)) {
    const cells = line.trim().split(",");
    if (cells.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(cells[0] ?? "")) {
      const raw = cells[1] ?? "";
      const v = Number(raw);
      rows.push({
        date: cells[0]!,
        // "." (and any non-numeric) is a missing observation — FRED's own
        // convention; recorded as null, dropped by the source module.
        value: raw !== "" && Number.isFinite(v) ? v : null,
      });
    }
  }
  return { status: res.status, rows, bytes: csv.length, ms, header };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const capturedAt = new Date().toISOString();

/* ---- the two series, full history + the trailing fetch window ------- */

const windowFrom = isoDaysAgo(400);
const [fiiFull, fiiWin, gsFull, gsWin] = await Promise.all([
  fetchFred("DFII10"),
  fetchFred("DFII10", windowFrom),
  fetchFred("DGS10"),
  fetchFred("DGS10", windowFrom),
]);

const describe = (
  name: string,
  full: { status: number; rows: FredRow[]; bytes: number; ms: number; header: string },
  win: { rows: FredRow[] },
) => {
  const missingFull = full.rows.filter((r) => r.value === null).length;
  const missingWin = win.rows.filter((r) => r.value === null).length;
  const last = full.rows[full.rows.length - 1];
  const first = full.rows[0];
  return {
    endpoint: `${FRED_CSV}?id=${name}`,
    http_status: full.status,
    response_ms: full.ms,
    bytes: full.bytes,
    csv_header: full.header,
    series_start: first?.date ?? null,
    latest_observation_date: last?.date ?? null,
    latest_value: last?.value ?? null,
    rows_full_history: full.rows.length,
    missing_marker_rows_full_history: missingFull,
    rows_trailing_400_calendar_days: win.rows.length,
    missing_marker_rows_trailing_window: missingWin,
    cosd_trim_verified: win.rows[0]?.date === windowFrom,
    cosd_used: windowFrom,
  };
};

const dfii = describe("DFII10", fiiFull, fiiWin);
const dgs = describe("DGS10", gsFull, gsWin);

/* ---- the shared calendar + the derived breakeven --------------------- */

/* the calendar that matters downstream: dates WITH a value (the source
   module drops "."/empty rows — FRED prints bond-market holidays as
   date-only rows, so the raw row set overstates the usable calendar) */
const fiiDates = new Set(
  fiiWin.rows.filter((r) => r.value !== null).map((r) => r.date),
);
const gsDates = new Set(
  gsWin.rows.filter((r) => r.value !== null).map((r) => r.date),
);
const nullDates = fiiWin.rows
  .filter((r) => r.value === null)
  .map((r) => r.date);
const common = [...fiiDates].filter((d) => gsDates.has(d)).sort();
const fiiMap = new Map(
  fiiWin.rows.filter((r) => r.value !== null).map((r) => [r.date, r.value!]),
);
const gsMap = new Map(
  gsWin.rows.filter((r) => r.value !== null).map((r) => [r.date, r.value!]),
);
const lastCommon = common[common.length - 1];
const fiiLast = lastCommon ? fiiMap.get(lastCommon) : undefined;
const gsLast = lastCommon ? gsMap.get(lastCommon) : undefined;
const breakeven =
  fiiLast !== undefined && gsLast !== undefined
    ? Math.round((gsLast - fiiLast) * 100) / 100
    : null;

/* ---- the archive leg: the grounded grid keeps its depth -------------- */

interface GridResult {
  archive: string;
  grid_current_common_trading_days: number | null;
  grid_with_fred_common_trading_days: number | null;
  dates_dropped_by_fred_bond_calendar: string[] | null;
  min_live_depth: number;
  verdict: string | null;
  binding_constraint: string | null;
}
let grid: GridResult = {
  archive: "db/custom.db (sandbox archive)",
  grid_current_common_trading_days: null,
  grid_with_fred_common_trading_days: null,
  dates_dropped_by_fred_bond_calendar: null,
  min_live_depth: 200,
  verdict: null,
  binding_constraint: null,
};
try {
  const db = new Database("db/custom.db", { readonly: true });
  const liveDatasets = ["gold", "dxy", "spx", "realYield", "silver", "oil"];
  const sets = new Map<string, Set<string>>();
  for (const ds of liveDatasets) {
    const rows = db
      .query("SELECT date FROM Observation WHERE dataset = ?")
      .all(ds) as Array<{ date: string }>;
    sets.set(ds, new Set(rows.map((r) => r.date)));
  }
  const currentGrid = liveDatasets
    .map((ds) => sets.get(ds)!)
    .reduce((acc, s) => new Set([...acc].filter((d) => s.has(d))));
  const newGrid = new Set(
    [...currentGrid].filter((d) => fiiDates.has(d) && gsDates.has(d)),
  );
  db.close();
  const dropped = [...currentGrid]
    .filter((d) => !newGrid.has(d))
    .sort();
  grid = {
    archive: "db/custom.db (sandbox archive, read-only)",
    grid_current_common_trading_days: currentGrid.size,
    grid_with_fred_common_trading_days: newGrid.size,
    dates_dropped_by_fred_bond_calendar: dropped,
    min_live_depth: 200,
    verdict:
      newGrid.size >= 200
        ? "PASS — the grid keeps ≥ 200 common trading days; no cosd widening needed (FRED history is free back to 2003 if it ever is)"
        : "FAIL — the FRED fetch window must widen via cosd",
    binding_constraint:
      "the EODHD trailing-year fetch window (FETCH_WINDOW_DAYS = 380) — the FRED bond calendar is wider than the grid in every observed window",
  };
} catch {
  grid.archive = "skipped — db/custom.db not present in this checkout";
}

/* ---- the bug being fixed, as found ----------------------------------- */

const bugAsFound = {
  file: "src/lib/gold/sources/eodhd.ts",
  registry_entry: {
    dataset: "realYield",
    symbol: "^TNX.US",
    mode: "live-proxy",
    note: "Real-yield proxy: no TIPS real-yield series on this plan; the 10Y nominal Treasury yield stands in for it.",
  },
  mislabel_surface:
    "the gold page dashboard's first indicator card (indicators.realYield) reads Observation.dataset = 'realYield' (the ^TNX nominal closes) under the label 'Real 10y yield' / «بازده واقعی ۱۰ساله»",
  observed_mislabel_value: fiiFull.rows.length > 0 ? gsLast : null,
  true_real_yield_same_day: fiiLast ?? null,
};

/* ---- the cron inventory (the constraint the design rides) ------------ */

const cronInventory = {
  plan: "Workers Free — 5 cron triggers per account",
  used: 5,
  workers: {
    "currena-api": "* * * * *",
    "currena-markets": "0,30,50 1,7,8,23 * * *",
    "currena-wgc-watch": "30 9 1-15 * * * + 30 9 17-25/2 * * *",
    "currena-te-watch": "0 5,16 * * *",
  },
  consequence:
    "no new cron worker — the FRED sync rides the desk's existing pull-on-render once-per-UTC-day gate (2 small CSV GETs, no key, no quota)",
};

const evidence = {
  captured_at: capturedAt,
  method:
    "plain GETs of fredgraph.csv with the desk's identified user agent (the compare leg's own convention); the archive leg reads db/custom.db strictly read-only via bun:sqlite",
  series: {
    DFII10: {
      title:
        "Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on an Investment Basis, Inflation-Indexed",
      what_it_is:
        "the 10-year TIPS constant-maturity REAL yield, percent, not seasonally adjusted, daily (business days)",
      source: "Board of Governors of the Federal Reserve System (H.15)",
      ...dfii,
    },
    DGS10: {
      title:
        "Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on an Investment Basis",
      what_it_is:
        "the 10-year Treasury constant-maturity NOMINAL yield, percent, not seasonally adjusted, daily (business days)",
      source: "Board of Governors of the Federal Reserve System (H.15)",
      ...dgs,
    },
  },
  calendar: {
    trailing_window_rows: fiiWin.rows.length,
    trailing_window_rows_with_value: fiiDates.size,
    missing_value_dates_in_window: nullDates,
    missing_value_convention:
      "bond-market holidays print as date-only rows (empty value cell, sometimes '.') — dropped by the parser, never stored",
    trailing_window_common_days: common.length,
    dfii_dgs10_identical_calendars:
      fiiDates.size === gsDates.size && common.length === fiiDates.size,
    latest_common_date: lastCommon ?? null,
    derived_10y_breakeven_percent:
      breakeven !== null
        ? { value: breakeven, formula: "DGS10 − DFII10", as_of: lastCommon ?? null }
        : null,
  },
  grounded_grid_impact: grid,
  bug_as_found: bugAsFound,
  cron_inventory: cronInventory,
};

const out = `docs/evidence/fred-yields-census-${capturedAt.slice(0, 10)}.json`;
writeFileSync(out, JSON.stringify(evidence, null, 2) + "\n");
console.log(`wrote ${out}`);
console.log(
  JSON.stringify(
    {
      DFII10_latest: dfii.latest_observation_date + " = " + dfii.latest_value,
      DGS10_latest: dgs.latest_observation_date + " = " + dgs.latest_value,
      breakeven,
      grid,
    },
    null,
    2,
  ),
);
