# The FRED yields — the real-yield re-sourcing spec

**Status: DECIDED (2026-11-25 — the owner's brief fixes every parameter:
the true TIPS real yield replaces the nominal proxy, the nominal yield
rides beside it, FRED is the source, no new cron, no D1 migration. No
clarifying questions remain; implementation is this sitting's work).**

The owner's brief: the gold page's "Real 10y" card is lying — it shows a
**nominal** yield. `SOURCE_REGISTRY` feeds the dashboard's first indicator
from EODHD `^TNX.US` (the 10Y **nominal** Treasury yield, CBOE) under the
label "Real 10y yield" / «بازده واقعی ۱۰ساله», with the registry's own
note admitting the proxy ("no TIPS real-yield series on this plan"). The
observed mislabel: **4.92%** on 2026-11-23 — exactly DGS10 nominal — while
the true 10-year TIPS real yield (FRED **DFII10**) that day was **2.79%**.

The fix is a correctness fix, not a gap fill: re-source the `realYield`
dataset to FRED DFII10 (the real thing, no key, no quota), add
`nominalYield` from FRED DGS10 beside it, render both honestly labeled
with FRED provenance, and delete the ^TNX proxy entry outright — no
proxy fallback, ever: if FRED is down, the existing engine-modelled path
with honest provenance takes over.

This document is the research record plus the implementation it
justifies — the TE/WGC specs' own structure, because the honesty rules
are the same: live is live, modelled is modelled, never a proxy in
real-yield clothing.

Branch: `gold-elevation/fred-real-yield`.

---

## 1. The goal and the scope

Replace the nominal-as-real mislabel everywhere the desk's own
observation store feeds a yield to the gold page, and surface the
10-year nominal yield beside the real one so the reader sees the pair
gold actually trades against — with source, as-of date, and daily-close
cadence on every number.

What this is **not**: no new cron worker (the account's five trigger
slots are full — §3.4), no D1 migration (new datasets are just new rows
in the existing `Observation`/`SourceSync` tables), no change to
`/api/gold/rates` (the Tehran/TGJU board), no change to the EODHD
datasets (gold, silver, dxy, spx, oil keep their source and their token;
the EODHD token env var stays exactly as it is), no engine rework (the
`realYield` dataset key is KEPT so the engine seam, the builder text,
the correlations and every downstream fact keep their shape — only the
bytes behind the key change from nominal proxy to true TIPS).

## 2. The source, precisely

- **Who**: FRED, the Federal Reserve Bank of St. Louis's economic data
  service. The endpoint used is the public CSV graph endpoint —
  `https://fred.stlouisfed.org/graph/fredgraph.csv?id={SERIES_ID}` —
  **no API key, no registration, no quota** (a free JSON API exists for
  heavier use; the CSV endpoint is the lighter contract and the one the
  compare band already exercises since 2026-11-23).
- **DFII10** — "Market Yield on U.S. Treasury Securities at 10-Year
  Constant Maturity, Quoted on an Investment Basis, Inflation-Indexed":
  the 10-year **TIPS real** yield, percent, not seasonally adjusted,
  daily, from **2003-01-02** (series page:
  https://fred.stlouisfed.org/series/DFII10).
- **DGS10** — "Market Yield on U.S. Treasury Securities at 10-Year
  Constant Maturity, Quoted on an Investment Basis": the 10-year
  **nominal** Treasury yield, percent, not seasonally adjusted, daily,
  from **1962-01-02** (series page:
  https://fred.stlouisfed.org/series/DGS10).
- Both series' source is the **Board of Governors of the Federal Reserve
  System (US), H.15 Selected Interest Rates**; both series pages carry
  the tag **"Public Domain: Citation Requested"** (§9).
- **CSV contract (verified 2026-11-25)**: the first line is the header
  `observation_date,<SERIES_ID>`; data lines are `YYYY-MM-DD,value`.
  Missing observations print as `.` — and bond-market holidays print as
  date-only rows with an **empty** value cell (12 in the trailing 400
  days: Veterans Day, Thanksgiving, Christmas, New Year, MLK,
  Presidents, Memorial, Juneteenth, July 3, Labor Day, Columbus Day).
  The parser drops both forms; neither is ever stored.
- **`&cosd=YYYY-MM-DD`** trims the start date (verified: the row count
  and first row follow it exactly). FRED history is free back to 2003,
  so the window can widen without cost if the grid ever needs it (§3.3
  says it does not).

## 3. The research record (2026-11-25)

Method: plain `GET`s of both CSV endpoints with the desk's identified
user agent (the compare leg's own convention,
`CurrenaGoldDesk/1.0 (currena.ir/gold; contact sedanama.ir@gmail.com)`),
plus a read-only pass over the sandbox archive (`db/custom.db`) for the
grid math. Raw rows: `docs/evidence/fred-yields-census-2026-11-25.json`,
regenerable with `bun scripts/fred-probe.ts` (the wgc-probe pattern —
the implementing sitting re-runs it first).

### 3.1 Both series serve without a key, now

- `fredgraph.csv?id=DFII10` → HTTP 200, 6233 rows, header
  `observation_date,DFII10`, from 2003-01-02, latest
  **2026-11-23 = 2.79**.
- `fredgraph.csv?id=DGS10` → HTTP 200, 16930 rows, from 1962-01-02,
  latest **2026-11-23 = 4.92**.
- `&cosd=2025-10-21` (400 days back) → 285 rows each, first row exactly
  `2025-10-21`, trim verified. 273 rows carry values (the 12 bond-holiday
  date-only rows above); **DFII10 and DGS10 share an identical
  value-bearing calendar** — 273 common days, same latest day.
- The derived, date-aligned free bonus: **10y breakeven inflation =
  DGS10 − DFII10 = 2.13%** on 2026-11-23 (optional display, §8).

### 3.2 The mislabel, as found (the bug this spec deletes)

`src/lib/gold/sources/eodhd.ts`, `SOURCE_REGISTRY`:

```ts
{ dataset: "realYield", symbol: "^TNX.US",
  note: "Real-yield proxy: no TIPS real-yield series on this plan; the 10Y
  nominal Treasury yield stands in for it.", mode: "live-proxy" }
```

The registry's note was honest; the **label downstream was not**: the
dashboard's first indicator card renders `indicators.realYield` ("Real
10y yield" / «بازده واقعی ۱۰ساله») from `/api/gold`'s `realYield`
stat — which reads `Observation.dataset = 'realYield'`, i.e. the ^TNX
**nominal** closes (4.92 on 2026-11-23). The compare band and the
correlation companion already read the true series (FRED DFII10 direct
in the compare leg; the meter-record leg upstream) — the mislabel lives
in the observation-store path only, which is exactly the path this spec
re-sources.

### 3.3 The grid keeps its depth (the intersection risk, answered)

`getGroundedBundle` intersects dates across every live dataset. FRED's
bond calendar drops forex-only US holidays from the common grid — the
measured effect on the sandbox archive: the grid loses exactly
**2026-10-12 (Columbus Day) and 2026-11-11 (Veterans Day)** —
**251 → 249 common trading days**, comfortably above
`MIN_LIVE_DEPTH = 200`. The binding constraint stays the EODHD
trailing-year fetch window (`FETCH_WINDOW_DAYS = 380`), which the FRED
fetch window (cosd = 400 days back) always covers. **No cosd widening
needed**; the free 2003 history remains the recorded escape hatch.

### 3.4 The cron inventory (the constraint the design rides)

The account's Workers Free plan allows five cron triggers; all five are
live (`currena-api` `* * * * *`, `currena-markets`
`0,30,50 1,7,8,23 * * *`, `currena-wgc-watch` ×2, `currena-te-watch`
`0 5,16 * * *`). **No new cron worker.** The FRED sync rides the desk's
existing pull-on-render gate: at most once per UTC day, 2 small CSV GETs
(~10 KB each), no key, no quota — and one EODHD call per day is *saved*
(realYield stops consuming EODHD, whose daily quota the site's own
syncs routinely exhaust).

## 4. The source module — `src/lib/gold/sources/fred.ts`

A sibling of `eodhd.ts`, the same disciplines, no dependencies:

- **`FRED_SPECS`** — the two registry entries the module owns:
  `realYield` → `DFII10`, `nominalYield` → `DGS10` (the dataset keys the
  engine and API already speak; §5).
- **`fetchFredCsv(seriesId, cosd)`** — one GET of `fredgraph.csv` with
  the identified user agent, `accept: text/csv`, 15 s timeout,
  `cache: "no-store"`; returns `{ status, rows }` where rows are
  `{ date, close }` pairs — the parse drops non-numeric value cells
  (`.` and the empty bond-holiday rows) and non-date lines, never
  guessing a fill.
- **`storeObservations(dataset, rows)`** — the eodhd.ts discipline
  verbatim: delete-then-create (`deleteMany` where `date >= rows[0]`
  then `createMany`), idempotent per window.
- **`ensureFredObservations(force = false)`** — the once-per-UTC-day
  gate over the module's own `SourceSync` rows: skipped when every
  FRED-spec row is stamped today (unless `force`, the regenerate path);
  otherwise one fetch per spec, storing observations and upserting
  `SourceSync` (`symbol: "FRED DFII10" | "FRED DGS10"`, status `live`
  with the latest observation date as `asOf`, or `error` with the
  reason). **It never throws** — a FRED failure records `error` and
  moves on; the bundle then excludes the dataset and the
  engine-modelled path with honest provenance takes over (the designed
  fail-closed law; no proxy exists to fall back to).
- The fetch window: `cosd` = today − **400** UTC days (covers EODHD's
  380-day window with margin; §3.3).

## 5. The registry re-source and the sync gate — `eodhd.ts`

- **`SourceSpec` gains `source: "eodhd" | "fred"`** — the honest
  discriminator; the EODHD sync loop and the EODHD-token gate filter on
  it.
- **The `realYield` entry re-sourced** (the dataset key KEPT — no engine
  ripple): `symbol: "FRED DFII10"`, `mode: "live"`, note: "10-Year TIPS
  constant-maturity real yield, daily close via FRED (fredgraph.csv, no
  key)."
- **`nominalYield` added** to the `MarketDataset` union and
  `SOURCE_REGISTRY`: `symbol: "FRED DGS10"`, `mode: "live"`, note:
  "10-Year Treasury constant-maturity nominal yield, daily close via FRED
  (fredgraph.csv, no key)."
- **The ^TNX entry is deleted** — gone from `SOURCE_REGISTRY`, gone from
  grep, no proxy fallback.
- **`ensureObservations()` becomes the orchestrator** it already reads
  as: it calls `ensureFredObservations(force)` (from `./fred`) and then
  the EODHD sync (the existing body, now `source === "eodhd"` only), and
  merges the two status lists into one `SyncReport`. The call site
  (`grounded.ts` → `resolveGrounding`) is unchanged.
- **The daily gate is fixed to registry coverage** — the old gate
  ("every SourceSync row stamped today") would skip forever once old
  rows exist and a NEW dataset joins the registry: the first render
  after deploy would never fetch DGS10. The EODHD leg's gate now
  requires every **eodhd-sourced registry spec** stamped today; the FRED
  leg likewise over its own specs. The no-token path marks only
  EODHD-sourced specs `unavailable` (FRED needs no token).
- **`getGroundedBundle()`'s dataset list gains `nominalYield`** — it
  joins the date intersection and the bundle's `series` map. The engine
  override (`grounded.ts`) does NOT pick it up: the engine has no
  nominal series, and adding none avoids the ripple (the nominal rides
  the store → `/api/gold` → the page, and the provenance set; §7).
  `marketProvenance()` needs no change — it maps `SOURCE_REGISTRY`, so
  the FRED entries flow to every provenance surface (the desk datasets
  block, the footer note) automatically, mode `live`, source
  `FRED DFII10` / `FRED DGS10`.
- **`dataMode`** stays honest: the registry grows to seven datasets; a
  bundle with all seven live reads `live`, anything less reads `mixed`.

## 6. Storage — no migration

New datasets are new rows in the existing tables, exactly as the S10
design intends: `Observation` rows (`dataset`, `date`, `close`) and one
`SourceSync` row per FRED dataset. The first post-deploy render writes
the DFII10 rows under `realYield` (the delete-then-create swaps the
^TNX rows wholesale — the stored window becomes the FRED fetch window)
and the DGS10 rows under `nominalYield`; the ^TNX SourceSync row's
`symbol`/`status` is simply re-stamped as the FRED entry. No DDL, no
seed re-run, no secrets touched (`EODHD_TOKEN` persists for the five
EODHD datasets). The live D1 continues on its own — the designed
pattern of every sitting since the first deploy.

## 7. The API — `/api/gold` (additive, honest)

`statOf("nominalYield")` joins the payload as `nominalYield`; the two
yield stats gain `chg1d` — the **daily change in percentage points**
(latest close minus the previous stored close, `null` when there is no
previous row). Percent-of-a-rate would be a dishonest unit; the compare
band's own `pp` convention is the house law. `/api/gold/rates` is
untouched. The `/api/desk` surfaces need no code change: the engine
consumes the re-sourced `realYield` through the same seam, and the
briefing's real-yield sentences become true the next time a desk day
builds (the archive's cached rows keep their own day's numbers, as the
cache always has).

One addition the brief's own words demand ("ride the existing
pull-on-render sync gate"): **`/api/gold`'s GET now triggers
`ensureObservations()`** (guarded, never fatal to the read). The gold
page fetches this leg on every load, and the gold page calls no
`/api/desk` route — without a trigger of its own, its yield cards would
serve the store's ^TNX-era rows until some other visitor hit the desk
route. With the trigger, the page's own traffic rides the same
once-per-UTC-day gate: the first render of the day performs the sync
(2 FRED GETs + the EODHD leg's own gated sync), every later render
skips the network, and a sync failure logs and serves the store as-is
(the cards' as-of lines state exactly what they hold).

## 8. The cards on the gold page

- **The dashboard's yields block** (the "Key indicators" strip, the
  mislabel's home): **two side-by-side cards** —
  **"10Y Real Yield (TIPS)"** / **«بازدهی واقعی ۱۰ ساله»** and
  **"10Y Nominal Yield"** / **«بازدهی اسمی ۱۰ ساله»** — each with: the
  level in %, the **daily change in pp** (signed, colored, the
  `SignedDelta` grammar on a pp unit), the 120-point spark, and its own
  provenance caption — **"FRED · daily close · as of {date}"** /
  **«FRED · قیمت پایانی روزانه · تا {تاریخ}»** (the Persian calendar
  date, `fmt.dateWords`). The remaining indicators (dxy, USD/JPY,
  silver, S&P, oil) render exactly as before.
- **The breakeven whisper** (the free derived bonus, optional by the
  brief, included): one caption line under the pair — "10Y breakeven
  inflation (nominal − real): {v}%" / «تورم مورد انتظار ۱۰ ساله
  (تفاضل اسمی و واقعی): {v}٪» — rendered only when both cards carry
  the same as-of day (the same FRED calendar guarantees alignment);
  it states its own derivation, never a source it does not have.
- **The compare band** gains the **nominal yield as a toggleable line**
  (default OFF — the owner's chart keeps its real-yield line; the
  nominal is the reader's opt-in): the `/api/gold/compare` payload adds
  a `nominalYield` leg (FRED DGS10, 5y, weekly-sampled, the DFII10
  leg's own fetch pattern), riding the right axis at its true %
  level like the real-yield line, the scorecard row in pp, never in the
  best/worst contest (a rate is not an asset — the existing law). The
  band's source note names both series: "FRED DFII10 + DGS10".
- **The Key Factors rows, the balance's borrowing-costs lane and the
  seats' copy** need no number change — they read the meter's record
  snapshot (static, conceptually correct: the real-yields seat describes
  real yields; the US-10y seat the nominal). The re-source makes the
  live series behind the desk's own real-yield facts true; the static
  record stays the record.
- **Labels, both locales, everywhere the numbers render**: the
  indicators copy (EN + fa) carries the two new titles; a grep for
  `realYield`, `Real 10`, `real yield`, `واقعی`, `بازده` must find no
  nominal-as-real label anywhere (the ^TNX note dies with the entry).
  The dead `market-strip.tsx` (the old desk page's strip, zero
  importers) contains no yield label and stays untouched.

## 9. Licensing and attribution

Both series pages carry the tag **"Public Domain: Citation Requested"**
(US federal works, Board of Governors H.15 via FRB St. Louis) — the
data is freely redistributable with attribution. The desk's surfaces
attribute: "FRED" on the two cards, the source symbols (`FRED DFII10`,
`FRED DGS10`) in every provenance line, and the compare band's source
note names the series ids. No license term forbids programmatic reads
of the CSV endpoint (it is the endpoint FRED's own graph page uses); if
FRED ever objects, the failure law is the honest one — error status,
engine-modelled fallback, never a silent gap.

## 10. Acceptance criteria for the implementing sitting

1. **The page shows the truth**: the real card equals FRED DFII10's
   latest close (2.79% as of 2026-11-23 — re-checked at deploy time),
   the nominal card equals DGS10's (4.92%); the breakeven line reads
   DGS10 − DFII10 for the same day.
2. **The proxy is gone**: `grep -rn "TNX" src/` returns nothing;
   `SOURCE_REGISTRY` carries `realYield` → `FRED DFII10` (mode `live`)
   and `nominalYield` → `FRED DGS10`; a bilingual grep
   (`realYield|Real 10|real yield|واقعی|بازده`) finds no
   nominal-as-real label.
3. **Provenance on every affected number**: each yield card states
   FRED, the as-of date, and daily-close cadence; the desk provenance
   block lists both FRED datasets with mode `live`; the EODHD badge
   remains only where EODHD actually serves (the five market datasets).
4. **The sync discipline holds**: the first post-deploy render performs
   exactly 2 FRED GETs; a same-day re-render performs 0; the
   regenerate/force path re-pulls both; a FRED failure marks `error`
   and the bundle serves the engine-modelled path with the honest
   reason (fail-closed, no proxy).
5. **The grid holds**: `getGroundedBundle` for the current date returns
   ≥ 200 common trading days with both FRED datasets live (249 observed
   in the sandbox archive).
6. **No new cron trigger** (5/5 stays), **no D1 migration**, the
   `/api/gold/rates` route and the EODHD token path untouched.
7. **Bilingual + responsive + clean**: EN and fa/RTL both render the
   two cards, the Persian calendar as-of, the breakeven line with
   Persian digits; 375px with zero horizontal overflow; dark mode;
   zero console errors; the full desk route set stays green
   (currena.ir/gold + every `/gold/api/gold/*` route 200, currena.ir/
   and /goldsmith untouched).
8. **Deployed and live-verified** at https://currena.ir/gold (the
   two-step OpenNext runbook, `NEXT_PUBLIC_BASE_PATH=/gold` on BOTH
   build and deploy — the encoded mistake avoided), with the live
   values re-checked against a fresh FRED fetch at verify time.

## 11. Later phases — explicitly not v1

- The 5-year compare window's nominal line is the only history surface;
  deepening the desk's own observation store beyond the ~1-year window
  (a 2003-back DFII10 archive) is a separate sitting if the owner wants
  decade-scale real-yield context on the desk's own numbers.
- The breakeven as a stored, carded series (rather than a derived
  line) — only if the owner asks for its history.
- FRED JSON API + free key migration — only if the CSV endpoint ever
  rate-limits or changes shape.
