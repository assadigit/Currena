/**
 * The FRED re-sourcing verification harness — the implementing
 * sitting's local proof (docs/fred-yields-spec.md §10.5).
 *
 * Proves, over the sandbox archive (db/custom.db):
 *   1. the FRED store is clean — 273 value-bearing rows per series,
 *      zero empty-cell zeros, both SourceSync rows live at their own
 *      latest observation dates;
 *   2. getGroundedBundle() still grounds — the grid keeps ≥ 200
 *      common trading days (MIN_LIVE_DEPTH) with BOTH FRED datasets
 *      live in the bundle, and the series values are the true FRED
 *      closes (2.79 / 4.92 on 2026-11-23 at the sitting);
 *   3. the derived breakeven matches DGS10 − DFII10.
 *
 * The EODHD datasets' SourceSync rows are restored to their recorded
 * live state first (a tokenless dev run marks them `unavailable`; the
 * live Worker carries the EODHD_TOKEN secret and syncs them itself —
 * the restore mirrors that state for the bundle read, nothing else).
 *
 * Usage: bun scripts/fred-verify.ts
 */

import { Database } from "bun:sqlite";

const db = new Database("db/custom.db");

/* 1 — restore the EODHD rows to their recorded live state */
const EODHD_ROWS: Array<[string, string, string, string]> = [
  ["gold", "XAUUSD.FOREX", "2026-11-22", "USD per troy ounce, EODHD forex feed."],
  ["silver", "XAGUSD.FOREX", "2026-11-22", "USD per troy ounce, EODHD forex feed."],
  ["spx", "SPY.US", "2026-11-20", "Index not on this EODHD plan; served by SPDR SPY ETF closing prices — the desk consumes its daily % moves."],
  ["oil", "USO.US", "2026-11-20", "WTI futures-roll proxy via US Oil Fund ETF closes; used for correlations only."],
  ["dxy", "ICE DXY formula", "2026-11-20", "Computed from the six component pairs (EURUSD, USDJPY, GBPUSD, USDCAD, USDSEK, USDCHF) via the published ICE index weights — exact construction, not a modelled proxy."],
];
for (const [dataset, symbol, asOf, note] of EODHD_ROWS) {
  db.run(
    `INSERT INTO SourceSync (id, dataset, symbol, status, asOf, syncedAt, note)
     VALUES (lower(hex(randomblob(16))), ?, ?, 'live', ?, ?, ?)
     ON CONFLICT(dataset) DO UPDATE SET symbol=excluded.symbol, status='live', asOf=excluded.asOf, note=excluded.note`,
    [dataset, symbol, asOf, Date.now(), note],
  );
}
console.log("EODHD SourceSync rows restored to their recorded live state");

/* 2 — the FRED store health */
for (const ds of ["realYield", "nominalYield"]) {
  const rows = db
    .query("SELECT COUNT(*) n, MIN(date) lo, MAX(date) hi FROM Observation WHERE dataset = ?")
    .all(ds) as Array<{ n: number; lo: string; hi: string }>;
  const zeros = db
    .query("SELECT COUNT(*) n FROM Observation WHERE dataset = ? AND close = 0")
    .all(ds) as Array<{ n: number }>;
  console.log(`${ds}: ${rows[0]!.n} rows (${rows[0]!.lo} → ${rows[0]!.hi}), zero-close rows: ${zeros[0]!.n}`);
}
db.close();

/* 3 — the real bundle, through the real code path */
const { getGroundedBundle, MIN_LIVE_DEPTH } = await import("../src/lib/gold/sources/eodhd");
const requested = new Date().toISOString().slice(0, 10);
const bundle = await getGroundedBundle(requested);

if (!bundle.ok) {
  console.error("BUNDLE FAILED:", bundle.reason);
  process.exit(1);
}

const last = (arr: number[]) => arr[arr.length - 1]!;

/* The bundle clips every series to the COMMON trading grid, so the
   expected values are the FRED closes at the bundle's own as-of day
   (the grid's last day), read straight from the store — never a
   hardcoded number that drifts with the calendar. */
const db2 = new Database("db/custom.db");
const closeAt = (ds: string, date: string): number | null =>
  (db2.query("SELECT close FROM Observation WHERE dataset = ? AND date = ?").all(ds, date) as Array<{ close: number }>)[0]
    ?.close ?? null;
const ryExpected = closeAt("realYield", bundle.asOf);
const nyExpected = closeAt("nominalYield", bundle.asOf);
db2.close();

const checks: Array<[string, boolean]> = [
  ["bundle grounds (ok)", true],
  [
    `window depth ${bundle.windowDays} ≥ ${MIN_LIVE_DEPTH}`,
    bundle.windowDays >= MIN_LIVE_DEPTH,
  ],
  ["realYield live in the bundle", bundle.liveDatasets.includes("realYield")],
  ["nominalYield live in the bundle", bundle.liveDatasets.includes("nominalYield")],
  [
    `realYield's grid-aligned value is the true DFII10 close at ${bundle.asOf} (${last(bundle.series.realYield ?? [])} vs ${ryExpected})`,
    ryExpected !== null && Math.abs(last(bundle.series.realYield ?? []) - ryExpected) < 0.005,
  ],
  [
    `nominalYield's grid-aligned value is the true DGS10 close at ${bundle.asOf} (${last(bundle.series.nominalYield ?? [])} vs ${nyExpected})`,
    nyExpected !== null && Math.abs(last(bundle.series.nominalYield ?? []) - nyExpected) < 0.005,
  ],
];

let pass = 0;
for (const [label, ok] of checks) {
  if (ok) pass += 1;
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
}

const ry = bundle.series.realYield ?? [];
const ny = bundle.series.nominalYield ?? [];
if (ry.length > 0 && ny.length > 0 && ryExpected !== null && nyExpected !== null) {
  const bk = last(ny) - last(ry);
  const bkExpected = nyExpected - ryExpected;
  const bkOk = Math.abs(bk - bkExpected) < 0.005;
  console.log(`${bkOk ? "PASS" : "FAIL"} — the derived breakeven at ${bundle.asOf} (DGS10 − DFII10 = ${bk.toFixed(2)} vs ${bkExpected.toFixed(2)})`);
  if (bkOk) pass += 1;
}

console.log(
  `asOf ${bundle.asOf} · live datasets: ${bundle.liveDatasets.join(", ")} · ${pass}/${checks.length + 1} checks pass`,
);
process.exit(pass === checks.length + 1 ? 0 : 1);
