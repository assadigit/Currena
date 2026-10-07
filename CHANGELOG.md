# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
as a private monorepo, releases are tracked by date and Workers version rather
than a semver tag.

## [2026-10-07] — Insights: gold and silver ounce prices in the precious-metals group

Owner request ("I want the ounce price of Gold and ounce price of Silver to be
added in the precious metals part"): two new info-only cards at the top of
**Metals, crypto and hard assets** — `gold-usd` and `silver-usd`. They render
first in the group (prices before the ratios built from them), never vote, and
so leave every summary count unchanged. 30 indicators total (19 P1 / 11 P2).
Tests 514 → **516 green**; typecheck 5/5.

### Added
- `gold-usd` — Gold price (ounce), US$ per troy ounce: live TGJU world-market
  ounce quote with World Bank Pink Sheet monthly history backfill (the exact
  `gold-silver` recipe with the raw price as the live point). Displayed as
  `US$4,104`-style whole dollars; carries the 10-year position bar and chart.
- `silver-usd` — Silver price (ounce), US$ per troy ounce: live gold-api.com
  XAG spot with the same World Bank monthly backfill. Displayed to 2 decimals
  (`US$60.13`).
- Bilingual copy corpus entries (en + native fa) for both cards; spec table
  amendment in `docs/insights/01-indicator-spec.md`.

### Changed
- `IndicatorIdSchema` (core contract), `DEFINITIONS`, `buildIndicatorSeries`
  and `READING_SOURCES` (@currena/insights), `DISPLAY` (apps/web) — the two
  ids wired through every layer; degradation ladders tested (no World Bank →
  single live point; no live source → monthly history reads stale, honest).
- Count-pinning tests updated (core id set 30; definitions 19/11; snapshot 30
  readings; fa copy coverage 30 keys).

## [2026-10-07] — Insights Phase I5: content (calendar, china-pmi) + Gate I4 ordering fix

Gate I4 approved (owner: "Approved." + the live `/api/insights` JSON) with
one requested change, applied first: **the Global section now renders
before Australia** — section order (`SECTION_ORDER`), jump-nav target
order, and the summary block's two LED lines all flipped; the design spec
§4 records the owner decision (the original "reader is in Australia"
rationale is retired). Then Phase I5's content work: the key-dates calendar
populated from official schedules and the China-PMI manual series seeded
from documented official releases. Tests stay **514 green**; typecheck 5/5;
the reorder is render-order only (no bundle-gated code changed).

### Added
- `data/insights-calendar.json` — 14 events (2026-10-28 → 2027-05-04):
  RBA cash-rate decisions (2026: 3 Nov, 8 Dec; 2027: 9 Feb, 23 Mar, 4 May —
  from the RBA Board Meeting Schedules page, decision = second day), FOMC
  decisions (2026: 28 Oct, 9 Dec; 2027: 27 Jan, 17 Mar, 28 Apr — from
  federalreserve.gov), ABS CPI releases (Sep quarter 28 Oct, Oct 25 Nov,
  Dec 27 Jan, Jan 24 Feb — from abs.gov.au, cross-checked against the RBA
  homepage "Next update"). Bilingual titles; events within 7 days highlight
  client-side; past events drop off.
- `data/manual/china-pmi.json` — 10 NBS manufacturing-PMI observations
  (2025-12 → 2026-09), every value the official headline cross-checked
  against ≥2 independent reports of the release with month-over-month
  arithmetic reconciled; full provenance table in `data/manual/README.md`.
  The china-pmi card goes live (50.1, normal, +0.30 pts 30-day change);
  its position bar stays hidden until the 30-observation percentile floor.

### Changed
- `apps/web/src/components/insights/config.ts`, `routes/Insights.tsx`,
  `components/insights/SummaryBlock.tsx` — Global before Australia
  (section order, jump nav, summary rows).
- `docs/insights/02-page-design-spec.md` §4 — page structure reordered to
  match the owner's decision; rationale line rewritten.

### Documentation
- Roadmap: I4 exit records Gate I4 approval + the ordering change; the I5
  checklist closed out (copy corpus delivered in I4 + re-reviewed with a
  mechanical no-buy/sell check; calendar populated; disclaimer reviewer
  declined at D4; china-pmi seeded as an added I5 item).
- `data/manual/README.md` — china-pmi provenance table + growth rule.

### Deployed
- Pushed `f3a8101..f77bdd4` to `main` and redeployed the Worker (version
  `bef6f65b-e5b6-4655-8d14-25f7945b2e19`, 922.70 KiB upload, 13 new assets —
  the reordered `Insights-oh-TxMJf.js`). A manually dispatched
  `insights-ingest` run (Actions run 37641720806, success) wrote the first
  production snapshot carrying the calendar (14 events) and the live
  china-pmi reading (50.1, normal) — zero unavailable indicators. Verified
  on `currena.ir/#/insights` in en and fa: Global before Australia in
  sections, jump nav, and summary rows; card expand → chart + table +
  source link; 375px no overflow; zero console errors. Deploy record in
  `docs/DEPLOY.md` §Insights reorder + I5 content deploy.

## [2026-10-07] — Insights Phase I4: the page

Gate I3 approved (owner: "Approved." with the live `/api/insights` JSON
pasted for review). Phase I4 builds the reader-facing page: `#/insights`,
28 expandable indicator cards, both languages, both themes, every state in
the design spec. **Entry bundle +0.10 kB gzip** (288.75 kB / 87.78 kB gzip
vs the 288.45 / 87.68 baseline) — the whole feature, including the ~600-line
bilingual copy corpus, lives in the lazy route chunk (100 kB / 30.4 kB gzip).
Tests **479 → 514 — all green** (+35 web); typecheck clean in all five
packages. Browser-verified in en/fa × light/dark × desktop/375px against
the exact production snapshot: zero console errors, no horizontal overflow
(one overflow defect found and fixed during verification), offline fallback
through the last-good localStorage snapshot, mobile single-open cards.
Deployed and smoke-verified on currena.ir — awaiting the owner's visual
review (Gate I4).

### Added
- `apps/web/src/routes/Insights.tsx` — lazy `/insights` route (ROUTES, nav
  entry, per-route title). Australia before Global, jump links, about-the-data
  + full disclaimer.
- `apps/web/src/lib/insights.ts` — typed API client (zod-validated snapshot +
  per-card history with expected-404 → null), localStorage last-good fallback.
- `apps/web/src/i18n/insights-copy-en.ts` / `insights-copy-fa.ts` — the copy
  corpus (28 indicators × 6 fields + structural strings per locale), lazy in
  the route chunk, fa compile-time shape-checked against en.
- `apps/web/src/components/insights/` — SummaryBlock (LED warning counts +
  explainer + disclaimer bar), WhatChanged, ComingUp, JumpNav, IndicatorCard,
  HistoryChart (+ screen-reader table), PositionBar, StatusChip, AboutTheData,
  display config + pure helpers.
- 35 web tests: client contract/error/cache paths, value/change/rule
  formatting (en + fa), warning zones, movers ranking, group counts, history
  sampling, copy coverage.

## [2026-10-07] — Insights Phase I3: ingestion runner, storage, API routes, production write-run green

Gate I2 approved ("continue proceed"). Phase I3 builds the feature's serving
pipeline end to end: the GitHub Actions ingestion runner, the KV storage
contract, the read-only API routes, and the admin freshness card. **First
Insights deploy** (new routes on `currena-api`, Worker version `3ab1a97a`;
the SPA bundle is unchanged — insights imports are type-only on the worker
side). Tests **441 → 479 — all green** (+38); typecheck clean in all five
packages. Production evidence: venue dry-run (Actions run 37518740313)
27/27 sources OK; real write-run (Actions run 37550035289) wrote 24 history
keys + snapshot + status in 26 KV writes with `P1 COMPLETE`; live JSON
verified at `/api/insights` on workers.dev and currena.ir.

### Ingestion runner (`packages/insights`)

- `scripts/ingest.ts` — the production twin of live-run: collect → assemble →
  score → write. Loads `data/insights-calendar.json` + `data/manual/*.json`
  (soft-absent, loudly validated when present), reads the previous snapshot
  for `changedThisWeek` continuity (fresh events carried, week-window
  filtered), writes `insights:snapshot` + `insights:status` (critical) and
  `insights:hist:<id>` only on change (read-compare), prints the source
  report + readings + KV-op budget. Exit 1 when any P1 indicator is
  unavailable — a red workflow run is the stale-feed signal.
- `src/adapters/collect.ts` — the live-run fetch phase extracted verbatim so
  the diagnostic script and the runner cannot drift (live-run refactored onto
  it; output unchanged).
- `src/adapters/snapshot.ts` — pure assembly: `buildInsightsSnapshot`
  (readings + summaries + changedThisWeek merge + calendar),
  `buildHistoryFile` (10-year window anchored on the newest observation,
  downsampled to ≤520 points, `[epochDay, value]` encoding; single-point live
  cards get no history key), `buildInsightsStatus`.

### Storage contract

- `@currena/insights/store` (new export entry): `InsightsReader` /
  `InsightsWriter` interfaces + key names + `InMemoryInsightsStore` (tests) +
  `RestInsightsStore` — the Cloudflare REST KV writer with injected fetch,
  429/10048 daily-cap retry ladder, and op counters. The SPA-facing root
  export stays untouched.
- Core wire contracts: `IndicatorHistory` (strictly-ascending epoch-day
  pairs), `InsightsStatus` + `InsightsSourceReport` (admin freshness).
- `apps/api/src/adapters/insights-store.ts` — `KvInsightsReader` (the
  Worker's read half, poisoned-entry defense like `KvRateStore`). Keys live
  in the existing RATES namespace under the `insights:` prefix, NO TTLs.

### API + admin

- `GET /api/insights` — the precomputed snapshot; `503 insights_not_ready`
  before the first run; ETag `"insights:<generatedAt>"` + 304s; 60s public
  cache; exactly ONE KV read.
- `GET /api/insights/:id/history` — one indicator's downsampled series;
  `400 invalid_indicator` / honest `404 history_not_found`; ETag + 304s;
  300s public cache.
- `/admin` gains a zero-JS Insights card (last run, mode, per-source ✅/❌
  rows) fed by `insights:status`; the read is failure-tolerant (a broken KV
  read omits the card, never breaks the console).

### Workflow + ops findings

- `.github/workflows/insights-ingest.yml` — the repo's first workflow on
  main: cron **04:20 UTC daily** + `workflow_dispatch` with `dry_run`;
  pnpm from `packageManager`, frozen lockfile, 15-minute timeout, no
  overlapping runs.
- **KV write-budget finding (pre-existing, refined by live observation)**: the
  account's write counter crosses the 1,000 free writes/day around ~19:00 UTC
  (ever-green rates cron ~1,000/day + the second worker ~450/day). The cap's
  enforcement was observed on the **KV REST API** (429/10048) — the exact
  path the ingestion runner uses; Workers **binding writes are not blocked**
  (the rates app kept writing fresh snapshots after the trip, so production
  is unaffected). The ingestion is therefore scheduled at 04:20 UTC into the
  fresh post-midnight counter and retries capped writes. Recorded in
  docs/PROGRESS.md decisions log + docs/insights/03-data-sources.md §Phase I3.
- Scope cuts recorded: Bitstamp 10-year candle backfill + RBA F11 skipped
  (no v1 consumer); one daily schedule instead of daily+weekly
  (change-detected writes).

## [2026-10-06] — Insights Phase I2: source adapters, venue-verified RBA, live-run green

Gate I1 approved ("Continue." — backtest thresholds locked as-is). Phase I2
builds the feature's data layer — **still no app code; web/api bundles
unchanged; nothing deployed.** Tests **400 → 441 — all green** (insights 69 →
110); typecheck clean in all five packages; runner-side gates green from the
ingestion venue.

### Source adapters (`packages/insights/src/adapters/`, via `@currena/insights/adapters`)

- Import surface SPLIT from the pure root export: the SPA-safe `.` entry
  stays platform-/fetch-free; the new `./adapters` entry carries the fetch
  halves (web-standard fetch only — runs identically in the GitHub Actions
  runner and a Worker). `@currena/insights` gains a `@currena/scraper`
  dependency (fetchWithRetry + the production TGJU gold parser).
- fred / frankfurter / abs / worldbank / goldapi / bitstamp / tgju / rba /
  manual-series loader + `derived.ts` (`buildIndicatorSeries` — the
  production twin of the backtest SERIES map: ratio joins, yoy derivation,
  inverse/cross FX, live-point info cards, WB-brent fallback) +
  `READING_SOURCES` (per-card attribution).
- `xlsx.ts` — dependency-free XLSX reader (ZIP central directory +
  `DecompressionStream('deflate-raw')` + shared strings) for the World Bank
  Pink Sheet; the workbook URL is re-discovered from the commodity-markets
  page every run because the thedocs.worldbank.org document hash rotates.
- `parsers.ts` additions: `parseAbsSdmxCsv` (live SDMX response; header-driven
  columns — order varies by flow; sorts unordered answers; skips blank
  OBS_VALUE) and `parseRbaTableCsv` (title/header/metadata rows; both RBA
  date formats; skips pre-scaffolded empty future quarters).
- Loud-failure everywhere: zod response contracts (gold-api, Bitstamp,
  manual), table/series/unit identity checks (RBA prefix, WB header+units,
  ABS DATAFLOW), ascending assertions, ingestion-UA pinned for FRED (its
  Akamai edge hangs on the Chrome fingerprint).

### RBA venue verification (the I0 blocker, closed)

- Temporary branch `probe/i2-rba-venue` + a branch-only workflow ran the
  probe from the GitHub Actions runner: F1.1 / F2 / E2 / F11.1 CSVs all
  **HTTP 200**; the bytes are committed as fixtures. The sandbox stays
  Akamai-403 (loud-unavailable there — honest by design).
- `au-household-debt-arrears` resolved to **RBA E2 'Household debt to
  income'** (the ABS Data API has no household-ratios flow; catalogue
  searched in full). `au-us-10y-gap` cadence daily → weekly (F2 publishes
  T+2..4). I0's "4.60% cash rate" reference note retired (F1.1: 4.36).

### Fixtures & tests

- New recorded fixtures: gold-api XAG/BTC, Bitstamp OHLC, Frankfurter small
  timeseries, ABS SDMX ×5 (live response format), the full real World Bank
  XLSX, RBA F1.1/F2/E2 (venue bytes). 41 new tests (110 total in the
  package), all fixture-backed; the XLSX integration test parses the real
  workbook end-to-end (1960M01 → 2026M09).

### Live run (I2 exit criterion)

- `pnpm --filter @currena/insights live-run` — the one-off manual run that
  fetches every source, assembles all 28 indicator series and prints the
  sanity table + summaries. Final venue run: **27/27 fetches OK, every P1
  indicator printed a sane value (`P1 COMPLETE`)** — Global relaxed 1/8
  voting, Australia cautious 3/10 (0 excluded); TGJU-gold vs gold-api XAU
  0.04%, gold-api BTC vs Bitstamp 0.02%. Sandbox runs identical except RBA
  (403 → unavailable rows, as designed).

## [2026-10-06] — Insights Phase I1: contracts, scoring engine, backtest

Gate I0 approved same day (D4 answered: no disclaimer for v1). Phase I1 adds
the feature's computational core — **no app code touched; the web/api bundles
are unchanged; nothing deployed.** Tests **313 → 400 — all green**; typecheck
clean in all five workspace packages.

### Contracts (`packages/core/src/schemas.ts`)

- New Insights contracts (rule 3 — single source of truth): `IndicatorId`
  (28 v1 ids; licence-blocked items excluded), group/section/cadence/phase/
  source enums, `WarningRule` (the spec's seven atom kinds plus a flat
  `any-of` OR-composite for us10y), `IndicatorDefinition`, `IndicatorReading`
  (status vocabulary: warning / normal / context / stale / no-history /
  unavailable; `value`/`asOf` are null exactly when unavailable — enforced by
  refine), `SummaryLine` (label is null when nothing votes), `ChangedEvent`,
  `CalendarEvent`, `InsightsSnapshot` (unique-id refine). All exported from
  `@currena/core`; contract tests include deliberate shape-pinning.

### New package: `packages/insights` (`@currena/insights`)

- Pure, platform-free (AGENTS.md rule 2): no node:*, DOM, fetch or clock
  reads — every time reference is an explicit parameter (frozen-clock
  friendly). zod-validating throughout.
- `series.ts` — epoch-day date math, binary-search `pointAtOrBefore`,
  `combineSeries` inner join (ratios/crosses), `yoyPctSeries`.
- `parsers.ts` — FRED CSV / Frankfurter JSON / World Bank monthly / ABS
  period parsers; loud failures; missing markers dropped, never zero-filled.
  These are the parse halves of the Phase I2 adapters.
- `definitions.ts` — all 28 indicator definitions, rules verbatim from
  `01-indicator-spec.md`.
- `scoring.ts` — strict-lower 10-year percentiles; threshold rules incl.
  sustained-weeks anchored on the latest observation; percentile tails;
  pct/points change rules with anchor tolerance (sparse series show dashes,
  never mislabelled windows); yoy-negative; consecutive-decline; above-low;
  info → context; stale detection; `computeReading`, `summarize`
  (sections resolved via the definitions table), `changedSince`.
- **69 tests**: table-driven coverage of every rule type plus edge cases
  (empty series, short history, direction, ties, boundaries, frozen clock).

### Recorded fixtures + backtest

- `packages/insights/fixtures/` (14 files + provenance README, captured
  2026-10-06): 10 FRED series (2004+ / full), Frankfurter USD→JPY/AUD/CNY
  (2004→2026-10-05), World Bank Pink Sheet monthly (2004M01→2026M09), ABS
  headline CPI + trimmed mean quarterly, ABS unemployment monthly. RBA
  absent (Akamai-blocked from the sandbox — documented).
- `pnpm --filter @currena/insights backtest` writes
  **`docs/insights/BACKTEST.md`**: weekly frozen-clock runs across GFC 2008,
  COVID 2020, inflation 2022 and calm contrast 2017/2025, plus a today-run.
  Labels move correctly in every window (2008 global peaks *stressed*
  Oct-2008 7/12 and Australia *alarmed* Dec-08→Mar-09; 2022 *stressed* for
  20 of 52 weeks; 2017 *relaxed* 43 of 52; today: global *cautious* 3/11,
  Australia *stressed* 3/6). Engine constants calibrated against the
  fixtures during the run and documented there (stale thresholds from real
  release lags: 3/16/95/190 days by cadence; percentile floor 30 periods;
  observation-anchored sustained window). Owner-tunable candidates are
  listed with recommendations — spec thresholds themselves are unchanged.

Awaiting Gate I1 approval (backtest / threshold review) before Phase I2.

## [2026-10-06] — Insights Phase I0: source verification + Gate I0 decisions

Docs-only session (no code, no bundle impact). Planning set from commit
`240deb1` read in full; the verify-first probe ran against **every** source in
`docs/insights/03-data-sources.md` with throwaway scripts (nothing committed).

### Data sources — verified register (`docs/insights/03-data-sources.md`)

- **FRED:** 11/11 series live and current, **keyless** via
  `fredgraph.csv` (including the identified government pair
  `A091RC1Q027SBEA` ÷ `W006RC1Q027SBEA`) — **no FRED API key needed**.
  All used series are U.S.-government public domain; `DCOILBRENTEU`
  is EIA-sourced.
- **RBA:** licence **CC BY 4.0** confirmed (via alternate egress); the
  whole domain Akamai-403s the build sandbox — CSV bytes must be
  re-probed from the ingestion venue before Phase I2.
- **ABS:** Data API keyless on `/rest/` — `LF`, `CPI_Q`, `ANA_AGG`,
  `RES_DWELL_ST` current; `CPI_M` stale (keyed Indicator API only if
  monthly cadence is wanted); stale RPPI **replaced by `RES_DWELL_ST`**;
  household ratios → `E2` (verify in I2). Licence CC BY 4.0.
- **Silver / Bitcoin (D3):** gold-api.com primary for both spots (terms
  explicitly permit commercial display); Bitstamp public OHLC for BTC
  history; World Bank Pink Sheet (CC BY 4.0, monthly 1960M01→2026M09)
  for silver history and P2 commodities.
- **Blocked (licence/terms/access):** Coinbase (display prohibited),
  CoinGecko free (screenshots-only + 365-day cap), Coin Metrics
  community (CC BY-NC, 7 points), MetalCharts (nonexistent), Cboe VIX
  (link-out only), S&P 500 / breadth (P3), Stooq (bot gate),
  Blockchain.com (API degraded). **Shiller CAPE deferred P2→P3**
  (Yale data frozen at 2023-09, no licence).
- **Re-verified:** TGJU `ajax.json` (963 symbols, gold ounce fresh) and
  Frankfurter (2026-10-05), cross-consistent. China PMI manual-entry
  plan confirmed (no machine-readable NBS feed).

### Gate I0 decisions (recorded in `docs/PROGRESS.md`)

- **D1 — Cloudflare Free, permanently.** Heavy ingestion via a daily
  GitHub Actions runner writing one compact snapshot per source to KV
  through the Cloudflare REST API; the Worker only reads. Compact
  encoding (consolidated keys, arrays, integer-scaled fixed-point,
  epoch-day dates, rendered series only) keeps usage at ~100–150 KV
  writes/day vs the 1,000 free limit — **no indicator is omitted for
  tier reasons**. KV free limits re-verified live (100k reads/day,
  1k writes/day, 1 GB, **1 KV operation per Worker invocation** → the
  single `insights:snapshot` serve path).
- **D2 — substitutes accepted:** STLFSI4 for stress; VIX link-out;
  S&P/breadth out of v1; CAPE to P3.
- **D3 — silver/BTC sources accepted** (gold-api, Bitstamp, World Bank).
- **D4 — open:** disclaimer reviewer nomination (owner; needed before
  Phase I5, not blocking I1–I4).

Awaiting Gate I0 approval before Phase I1 (contracts + scoring engine).

## [2026-09-20] — Owner wireframe homepage + SWOT v2 + reliability wave

4 commits on `main` (`e3896ec` → this session), 2026-09-20.
Tests **308 → 313 — all green** at every gate; bundle gate held
(288.38 kB / 87.65 kB gz initial JS vs the 290.28/87.77 baseline — the
retired sidebar rail more than paid for the new homepage sections);
precache 59 entries / 2049.25 KiB (+1 entry, +6.4 KiB — About legal
sections + CSS). Every change browser-verified locally (agent-browser
DOM geometry + VLM, en + fa, desktop + 375 px, light + dark) and on
production after deploy.

### Phase A — SWOT v2 (fresh audit against today's code)

- **docs:** `docs/SWOT.md` re-run — production re-probed (health/rates/
  status/history/meta/admin/ETag 304 round-trip), `pnpm audit` CLEAN
  (xlsx CVEs long gone), bundle baseline re-measured identical, delta
  read of everything landed since 2026-09-24 (cron, server history,
  gold, LED boards, retry policy, admin gate). New weakness set is
  maintainability-shaped (the monolith files), the old security set is
  retired. `docs/BACKLOG.md` gained Wave 5 (this session's owner UI
  items) with statuses.

### Owner wireframe — homepage single-column stack (the 8 UI directives)

- **feat(web):** homepage rebuilt per the owner wireframe — full-width
  converting box → **GOLD & CURRENCY LED boards two-up** (gold start
  side; both in the compact CURRENT-only placement) → full-width Quick
  tools section → footer. The desktop two-column dashboard and the
  "at a glance" mini-board (`ConverterAside`) are retired; mobile now
  gets the boards too (`dbd05e2`).
- **feat(web):** ONE shared board component, two placements —
  `LedRateBoard`/`LedGoldBoard` take `showDayStats` (default true);
  `false` removes the DAY HIGH/DAY LOW cells from the DOM and collapses
  the shared subgrid ladder to two tracks at EVERY viewport
  (`.led-current-only`, index.css — re-asserts subgrid so column widths
  stay shared). `/live-rates` untouched: full 3-column board verified.
- **fix(web,a11y):** WCAG 1.4.1 — the retired mini-board's color-only
  live dot is superseded by the boards' text LIVE/CACHED/OFFLINE label.
- **fix(web,a11y):** WCAG 1.4.3 contrast — amount placeholder
  #B39B45→#806215 (≈2.7→5.6:1), dark #5B6B80→#9CA3AF (≈2.6→5.5:1),
  caret #C79100→#8A6D1F; "no change" delta pill muted→gray-700/gray-300
  (≈4.0→8.6:1 light, ≈4.5→8.0:1 dark).
- **feat(web):** nav utility group unified — install · فا · theme ·
  hamburger share one bordered icon-button container
  (`HEADER_ICON_BUTTON_CLASS`), equal 40px hit areas, both themes.
- **feat(web):** trust signals — footer carries Privacy · Terms ·
  Contact · About next to the credit line; the About route gains
  Privacy Policy / Terms of Service / Contact sections (en+fa) with
  sessionStorage-staged deep-link scroll; contact = GitHub (the only
  owner-supplied public channel — no email exists in the repo).
- **rtl:** full fa audit re-run across all 9 routes (en+fa, desktop+
  375 px, light+dark): boards mirror to the start side, no overflow, no
  console errors; digit language decision documented — Persian digits
  (۰۱۲۳) in all standard UI text via `Intl` fa-IR, Latin digits inside
  the DSEG7 LED modules (hardware font, matching the board-date rule).

### Phase B — reliability & i18n wave (BACKLOG items)

- **fix(api):** `/api/health` enriched (BACKLOG #39) — version +
  KV reachability probe (cheapest read); KV failure → 503 + `ok:false`
  for monitors; tests for both shapes (`ae6d6d9`).
- **fix(api):** rate limiting (BACKLOG #18) — per-isolate, per-IP token
  bucket (10 burst / 5 per min) on `POST /admin` +
  `POST /internal/refresh`, checked BEFORE body read or secret work
  (kills the wrong-secret KV amplification); 429 + Retry-After; bounded
  map; documented best-effort (per-PoP isolates). 3 tests.
- **fix(scraper):** `HttpError.code` (BACKLOG #33) — machine-readable
  classification (timeout / dns_or_network / rate_limited / blocked /
  http_4xx / http_5xx) derived from status or abort type; flows into
  `errorToCodeMessage` → status/admin telemetry. All six codes pinned.
- **fix(web):** Odometer respects `prefers-reduced-motion` (BACKLOG #34)
  — final value lands immediately, no rAF count-up.
- **fix(web,i18n):** Receipt/Batch export+share paths through the
  dictionary + `formatNumber` (BACKLOG #27) — fa users now get Persian
  labels AND Persian digits in share text, the receipt paper
  (۲۵٫۵۰ TRY / ۱۲۲٬۸۲۱ IRR (تومان)) and Excel headers; bulk-template
  prefill locale-aware; `navigator.share` titles localized (`58135e6`).

### Verification summary

308 → 313 tests (core 134 · web 17 · scraper 66→67 · api 91→95),
typecheck 4/4 at every commit; agent-browser: golden path (100 USD →
result + LIVE UPDATE), footer deep-links scroll to the About sections,
fa RTL mirroring (gold board start-side), Live Rates full board
unchanged (CURRENT + DAY HIGH + DAY LOW, 0 compact tables), zero
console/page errors everywhere; wrangler dev: enriched health JSON +
11th rapid `/internal/refresh` → 429.

## [2026-09-19] — Ever-green rates + LED shopfront boards session

19 commits on `main` (`732d2df` → `d28f57c`), 2026-09-18 evening → 2026-09-19.
Production live at **https://currena.ir** through Workers versions
`093aaf72` → … → `982cbc43` (final). Tests **279 → 308 — all green** at every
gate; every change browser-verified locally (agent-browser DOM audits + VLM)
and on production, en + fa, desktop + 375 px.

### Ever-green data (fixes the "3-hour-stale rates" report)

- **fix(api):** added the `scheduled` handler + cron `* * * * *` — the same
  ladder runs every minute regardless of visitor traffic (tgju each tick,
  frankfurter on 15-min cadence, fresh-guard caps real scrapes at ~1/5 min);
  measured data age with **zero user traffic: ≤ ~5-6 min** (`732d2df`).
- **fix(scraper):** TGJU cache-bust — `?cb=<epoch-ms>` on `ajax.json`, since
  TGJU's own edge served stale HITs (age 30 min on a 5-min max-age).
- **feat(api):** server-recorded rate history — KV `history:<source>`
  generations, content-fingerprint dedupe (writes only on real value changes —
  free-tier safe), capped 240; recorded from cron + live `/api/rates` scrapes;
  new `GET /api/history` (60 s cache + ETag). Sparklines across the app now
  draw from a shared server history merged into each client at boot — the
  "every currency has the same graph shape" report root-caused (identical
  min-max-normalized local series) and truly fixed (`d28f57c`).

### LED shopfront boards (owner-driven visual identity)

- **feat(web):** dot-matrix LED rate board as the Live Rates hero — DSEG7
  Classic (OFL-1.1) price digits, ghost segments + bulb gradient + halo,
  ticking clock, per-value flash (WCAG-safe), honest derived-quote footnote
  (`732d2df`), then rebuilt as a physical panel: bevel → perforated grid →
  recessed wells → ghosts → dot-matrix bulbs (`824257f`).
- **feat(scraper,core,web):** TGJU's real daily stats — current / day-high /
  day-low ride the snapshot `Rate` entries end-to-end; no invented dealer
  spread (`17169ea`). Shared **CSS subgrid** column lock (headers + every row
  share ONE track definition; measured spread 0.0 px per column) + hot CURRENT
  emphasis (`e8c5837`); currency names +40-50 % / weight 700 with a
  name-first caption layout below md (`a475058`).
- **feat(core,scraper,web):** **GOLD & COINS panel** — 9 TGJU gold/coin
  symbols (ounce in USD, Tehran market), graceful per-item dash degradation,
  same panel language (`b622cee`); gold-heal guard self-fixes visitors holding
  pre-gold snapshots (`8ec6842`); Tehran items converted Rial→**Toman** at the
  one sanctioned place (scraper normalizer) with self-migrating legacy
  snapshots (`97292b1`); phones show a single big CURRENT column on both boards
  (`97292b1`).
- **feat(web):** flags at 2× on the name line; headers/clock/dates in readable
  sans (LED look reserved for price digits) (`5fe3abf`); metal bezel frames —
  six-stop 135° steel + gold ramps with specular highlights, glass-recessed
  boards (`4170a96`, `4eacce9`); per-board headings with emoji, live TGJU
  link pill and last-updated stamp (`1204cba`).
- **feat(led):** fa board date as **«28 شهریور 1405»** (Persian month name,
  day-first logical order) then owner-refined to the RTL `[year][month][day]`
  frame at clock size; TGJU wordmark; `$` prefix on the USD gold-ounce
  modules (`2d91461`, `bf08bf8`).

### PWA & honesty fixes

- **fix(web):** "cached rates" banner/LED blink on boot — banners now render
  only on **confirmed** staleness (server-stale generation or failed fetch),
  never the transient boot hydration (`d782264`).
- **fix(web):** PWA `registerType: 'autoUpdate'` + `skipWaiting` +
  `clientsClaim` + hourly `registration.update()` — every deploy self-applies;
  the "stuck on the previous version" report root-caused (waiting service
  worker that a plain reload never activates) and permanently fixed
  (`6c75ccb`).
- **fix(web,api):** SWOT audit round — receipt/share/history staleness unified
  on `isConfirmedStale`; manifest rebranded **Currena** (was installing as
  "CurrencyPro"); og/twitter share cards; worker security headers (nosniff,
  X-Frame-Options, Referrer-Policy, Permissions-Policy) (`4bd5a9b`).
- **feat(pwa):** Android packaging prep — manifest `id`, real store
  screenshots (narrow 390×844 + wide 1280×720, VLM-verified), app shortcuts
  (Live Rates / Calculator), in-app 📲 install CTA (header + side menu, en+fa,
  `beforeinstallprompt`-driven). The site is fully **PWABuilder-ready**:
  paste currena.ir → Package for Stores → Android → signed APK/AAB
  (`1a80012`).
- **fix(web):** mobile result popup compacted — 3 stacked header rows → 1,
  single Jalali+time line, tightened spacing; measured **378 px** tall at
  390×844 (was viewport-filling), desktop unchanged (`d28f57c`).

### Known considerations

- TGJU remains a single upstream (inherent) — mitigated by cache-busting, the
  ladder, honest notices, the gold self-heal guard, and now server-side
  history (trend data survives upstream hiccups).
- Rate history began accumulating at deploy (2026-09-19 ~04:00Z); shapes
  genuinely diverge as TGJU re-quotes over the coming days. Optional future
  work: seed deeper history from TGJU's own history API (scope-guarded out).

### Open items (next session)

See the hand-off prompt in `docs/BACKLOG.md` lineage — SWOT re-run,
modularization of `apps/web/src/App.tsx` and the route monoliths, performance
& reliability optimization, TGJU history backfill, rate-limit on admin POST.

## [2026-09-18] — Autonomous hardening session

Branch `improve/autonomous-session-2026-09-24` (15 commits, +2,598/−491 lines,
49 files). Live in production at **https://currena.ir** since Worker version
`ddde3962-d0f0-4aab-85c4-04e744638185`.
Audit trail: `docs/BASELINE.md` → `docs/SWOT.md` → `docs/SESSION_LOG.md` →
`docs/FINAL_REPORT.md` (open items live in `docs/BACKLOG.md`).

### Headline metrics

| Metric | Before | After |
| --- | --- | --- |
| Tests (pnpm -r test) | 224 | **279 — all green** |
| Known vulnerabilities (pnpm audit) | 2 HIGH (`xlsx`) | **0** |
| Export-feature vendor chunk | 423.9 kB | **5.6 kB** (zero-dep writer) |
| `Intl` number formatting, 10k ops | 19,511 µs | **624 µs** (31× faster) |
| Web precache bundle | ~2,400 KiB | **1,999.67 KiB** (54 entries) |

### Security & data integrity (Wave 1)

- **fix(core):** settle ledger `__proto__` prototype-key corruption — a crafted
  note could poison `Object.prototype` and corrupt every ledger; added a money
  conservation invariant on persist (`a4bff42`).
- **fix(api):** hardened `/admin` + the KV status trust boundary —
  `SourceStatusSchema` validation on cached status, numeric-field HTML escaping,
  opt-in `ADMIN_VIEW_SECRET` gate (401 + `Retry-After`), 8 KB POST body cap
  (`005fae7`).
- **fix(web):** replaced CVE-laden `xlsx@0.18.5` with a zero-dependency XLSX
  writer; audit went 2 HIGH → 0 and the export chunk shrank 423.9 → 5.6 kB
  (`dd4ebc4`).
- **fix(web):** History delete race (identity-keyed delete) + Settle
  hydration-gated persist — closed a data-loss window on remount (`9b64442`).

### Reliability (Wave 2)

- **fix(api):** scrape-ladder reliability — 25 s scrape deadline, 30 s lock TTL,
  token-scoped locks (crash-safe release), graceful KV-write degradation,
  stale-value propagation on source failure; all covered by tests including a
  real-interleaving stampede test (`da8284f`).
- **feat(web):** reliability pass — ErrorBoundary, prompt-mode PWA update toast
  (workbox-window), honest forced-refresh FAB, collision-safe `uniqueId()` for
  entity IDs (`1ced3d1`).

### Performance (Wave 3)

- **perf(core):** memoized `Intl` formatters — `fa-IR` number formatting 31×
  faster (`b38aca9`).
- **perf(api,web):** `ETag`/`If-None-Match` → **304** on `/api/rates`, 5 s
  isolate snapshot micro-cache, parallel `status()` fan-out, memoized
  `<BoardCardView>`, History formatter hoist (`d041fa3`).

### Correctness & hygiene (Wave 4)

- **fix(core):** symmetric tie rounding (banker-style for .5 remainders),
  display-consistent CSV totals, CSV formula-injection guard, `sourceForPair`
  consolidated into core (6 copies → 1) (`c695fb5`).
- **chore(web,scraper):** dead-code removal (priceScanner block, `readHistory`,
  SCRAPER_VERSION sync) + settle settlement-currency label fix (`db3e22b`).
- **test(core):** penny-mismatch assertion fix — empty note renders as an empty
  CSV field (`76dae79`).

### Documentation & process

- **docs:** pre-session baseline snapshot (`bfc7240`); SWOT audit + prioritized
  39-item session backlog from three parallel deep audits (`2aaefff`); session
  log + final report (`9d91ffb`); production deployment record with the
  `printf`-vs-`echo` secret gotcha (`75866ac`).

### Deployment

- Single deployment topology: Worker `currena-api` serves API + built SPA +
  admin console; Custom Domain **currena.ir** + workers.dev URL, bindings (KV
  `RATES`, `ASSETS`) intact, secrets (`REFRESH_SECRET`, `ADMIN_VIEW_SECRET`)
  persist across versions.
- Post-deploy smoke: **12/12 green** — health, TGJU rates, USD→IRR convert
  parity, AED→EUR 503 messaging, admin gate (401/303/cookie), robots.txt, SPA
  deep link, ETag→304, `/api/status` parallel shape, 413 body cap.
- **Admin gate enabled in production.** Rotate with
  `printf '%s' '<secret>' | pnpm --filter @currena/api exec wrangler secret put ADMIN_VIEW_SECRET`
  (never `echo` — it stores the trailing newline and breaks constant-time
  compare). Delete the secret to return to public mode.
- Rollback: `pnpm --filter @currena/api exec wrangler rollback`
  (previous deployment 2026-09-17T03:12Z).

### Open items (prioritized — see `docs/BACKLOG.md`)

1. Owner rotates `ADMIN_VIEW_SECRET` to their own value
2. Legacy pythonanywhere origin decommission (owner decision, outside repo)
3. Cron pre-warmer `[triggers]` decision
4. TGJU Path-B relay (fallback scrape path)
5. Multi-currency settle ledgers
6. zod `.strict()` request contracts
7. Expanded web tests (rate-history, recent-pairs, router, meta parity)

### Wrap-up (2026-09-18 ~16:20 UTC) — pushed & redeployed

- Final gate re-run at HEAD: typecheck **4/4 packages**, tests **279/279 green**.
- `main` (17 commits, through the changelog wrap-up) and branch
  `improve/autonomous-session-2026-09-24` pushed to
  `github.com/assadigit/Currena` — `origin/main` now matches local exactly.
- Production redeployed from the final HEAD to pin the version marker (runtime
  identical to `ddde3962…` — every commit after `9d91ffb` is docs-only).
- Post-deploy smoke re-verified live: health, TGJU rates, USD→IRR convert
  parity, admin gate.
- Credentials hygiene: push/deploy tokens were supplied via environment
  variables only and were never written to disk, config, or git history.

## Earlier history

See `git log` for the pre-session history on `main` (through `bf61524`).
