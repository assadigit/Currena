> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S17 / M1 — Citation re-verification + the drop re-check + the archive/API-surface reality check + the LBMA survey series hand-off check + the build-time checks

**Session:** S17 of the Gold Page Elevation (GPE) program — the EIGHTH
Phase-D implementation session: **P4, the Advanced tier (wave 4, the
LAST feature wave)**. **Date:** 2026-11-19 (started ~18:0x UTC). **Branch:**
`gold-elevation/p4-advanced` (off the S16 close `46c4048e` on
`gold-elevation/p3-bridge2` — production `ea45d06c` is built from it).

Scope: exactly R31 (F12 the time machine) + R32 (F23 the forecast-accuracy
retrospective) + R33 (F26 the "if you'd bought" calculator) — ALL THREE
(`s8/01` §5). R15/R23 + the prices workbook stay drop-conditional (§2).

## 1. Citation re-verification (zero drift)

Every file path this session's rows cite, re-checked read-only against the
live tree at the branch point (the CP-C §3 discipline note):

| Citation | Status |
|---|---|
| `packages/insights/src/shared/gold-score.ts` (`GOLD_LANES` + `GOLD_LANE_VOTERS`, the production 37-seat table) | present (read in full — the table + its lineage comments are the registry's source) |
| `packages/insights/src/domains/gold/gold-backtest-core.ts` (`HARNESS_GOLD_VOTERS_20/_21`, `laneBalanceOverVoters`, `seriesUpTo` — the reconstruction machinery) | present (578 l, read in full) |
| `packages/insights/src/domains/gold/gold-balance.ts` (the production engine + `GOLD_LANE_MIN_FIRING`) | present (read in full) |
| `packages/insights/src/domains/gold/gold-balance.test.ts` (the harness-equivalence pin: `laneBalanceOverVoters(r, GOLD_LANE_VOTERS, 2, true) === goldBalance(r)`) | present (the §604 pin read) |
| `packages/insights/scripts/gold-backtest.ts` + `gold-corpus-dump.ts` (the frozen-clock window assembly + the stage/hist read pattern) | present (both read in full) |
| `packages/insights/src/shared/ingest/run.ts` (`INSIGHTS_STAGE_KEY`, the stage blob shape, `readStage`) | present (§ read) |
| `packages/insights/src/shared/ruleVersion.ts` (the rule-version stamp — weighed, NOT reused: rule versions are not dated per-day) | present, read |
| `apps/api/src/routes/insights.ts` (the literal-path route twins + the deps plumbing) | present (the /gold-premium block read as the pattern) |
| `apps/api/src/cron.ts` (the minute-rung map + the PREMIUM_HISTORY_CRON pattern) | present (read in full) |
| `apps/api/src/insights-ingest-cron.ts` (the 04:xx rung minutes: 10/20/25/27/30/35/40) | present (§ read) |
| `apps/api/src/index.ts` + `apps/api/src/adapters/insights-store.ts` (the composition root + the KV reader family incl. `getPublicSnapshot`) | present (§ read) |
| `packages/core/src/schemas.ts` (the Gold*Snapshot contract family — the GoldPremiumHistory pattern read in full) | present |
| `packages/insights/src/index.ts` (the root barrel — the pure-engine export pattern) | present (read in full) |
| `packages/insights/package.json` (the subpath exports + the runner scripts) | present |
| `apps/web/src/features/gold/GoldPage.tsx` (the zone wiring — C/D/F/O read) | present |
| `apps/web/src/features/gold/GoldHero.tsx` (Zone C — the time-machine control's home) | present (read in full) |
| `apps/web/src/features/gold/GoldContext.tsx` (Zone M — the honest-record footer, F23's home) | present (read in full) |
| `apps/web/src/features/gold/GoldEpisodes.tsx` + `gold-episodes.ts` + `gold-episodes-records.ts` (the Zone O collapsed-card + client + static-data patterns) | present (all read in full) |
| `apps/web/src/shared/i18n/en.ts` / `fa.ts` (the `pd.gold.*` dictionary) | present |
| `scripts/check-bundle-budget.mjs` (the GoldPage budget line 1131: 218,000 raw / 46,000 gz — S16's measured bump) | present |
| `docs/localization/persian-copy-manifest.json` (round 89 = the latest; this session's round = 90) | present (8,439 entries) |
| `docs/insights/GOLD_SYSTEM_COMPLETE_REFERENCE.md` §5.4 (the voter-table lineage) + §12 (the governance) | present (read — the registry's authoritative source) |

Zero drift. Two module-map notes recorded for M2 (the s6/03 paths are the
pre-modularization sketches; the shipped precedents supersede, exactly as
S15/S16 recorded for their rows): (1) `s6/03` zone M sketches F23's data as
`domains/gold/adapters/lbma-forecast-survey.ts` — a STATIC data module does
not ride the fetch-adapter folder; it lands as
`packages/insights/src/domains/gold/lbma-forecast.ts` (the `lbma.ts`
twin's naming), the S15 `gold-episodes-records.ts` precedent. (2) The
meter-history and if-bought engines land as new `domains/gold/` modules
with their store/job/runner halves behind package subpaths (the
`premium-history` pattern verbatim).

## 2. The drop re-check (R15/R23 + the prices workbook — 7th consecutive session)

`data/wgc/` does not exist on the working tree (checked 2026-11-19; the
repo root's `data/` carries only the generated registry files + the
manual china-cpi/china-pmi keys + the shiller folder). No owner notice of
a drop arrived in the kickoff. **The fold record §0.2 rule applies** (the
seventh consecutive session for R15): R15/R23 stay pending, the wall's
WGC CB line stays, and the Episode Explorer's price-path + comparison
halves keep their honest waiting states. Nothing here changes with P4:
the calculator's series are the in-repo stage/hist families + the
markets board's own Yahoo provider (§5c) — the WGC prices workbook remains
a FUTURE deepening (the Explorer's spine), never an R33 dependency.

## 3. The R32 hand-off check — the LBMA forecast-survey series EXTRACTED LIVE THIS SESSION

The s4/02 §1d record claims "the series is already extracted … (Series
verbatim in the appendix table of the M5 doc's source notes)" — **that
appendix does not exist in the repo** (searched every doc on the research
branch: the aggregates are recorded — 10 of 16 years under-forecast, mean
−2.1%, mean-abs 8.1%, 2025 −20.2%, 2024 −13.7% — but no year-by-year
table). Per the owner's rule 5 (never assume a number; verify against the
publisher), the series was re-extracted this session, live:

- **Venue:** `https://www.lbma.org.uk/forecast-survey-2026` (HTTP 200,
  274,497 B) → the embedded performance page
  `…/forecast-survey-2026/2010-2026-performance` (HTTP 200, 277,287 B),
  both fetched 2026-11-19 ~17:5x UTC. The page embeds FOUR Highcharts
  column charts (gold · silver · platinum · palladium — the R32 scope
  takes GOLD only; the other three are recorded as a future lever).
- **The GOLD series, verbatim from the embedded Highcharts config:**
  - Actual average price 2010–2025 (16 completed years):
    `1225, 1572, 1669, 1411, 1267, 1160, 1251, 1257, 1268.41, 1392.6,
    1769.6, 1798.6, 1800.094, 1940.54, 2386.20, 3431.54`
  - Analysts' forecast average 2010–2026 (17 entries — the 17th is the
    January-2026 survey's forecast average):
    `1199, 1457, 1766, 1753, 1219, 1211, 1103, 1244, 1318, 1311.71,
    1558.8, 1973.8, 1801.9, 1859.9, 2059, 2736.69, 4741.97`
- **The cross-check — every recorded aggregate reproduces EXACTLY over
  the extracted series** (computed 2026-11-19): the consensus
  under-forecast gold's actual average in **10 of 16** completed years ✓
  (2010, 2011, 2014, 2016, 2017, 2019, 2020, 2023, 2024, 2025); the mean
  signed miss **−2.11%** ✓ (recorded −2.1%); the mean absolute miss
  **8.13%** ✓ (recorded 8.1%); **2025 −20.24%** ✓ (recorded −20.2%);
  **2024 −13.71%** ✓ (recorded −13.7%); the 2026 forecast average
  **$4,741.97** ✓ (matches the s4/02 §1d quote). The strongest possible
  provenance: the publisher's own chart bytes, reproducing every recorded
  research figure.
- **Two honest discrepancies recorded (LBMA's own figures disagree
  internally — cite each with its context, the s4/02 §1d note):** the
  2025 annual-survey page's own text says "analysts' 2025 forecast
  average $2,735.33" while the performance chart carries **2736.69** (the
  chart series is this feature's series-of-record; the $0.36 divergence is
  LBMA's own, recorded); and the July-2026 mid-year pulse's revised
  whole-year text says **$4,604** against the January survey's
  **$4,741.97** (both recorded with their contexts — the card names the
  January figure as the series' 17th entry and carries the mid-year
  revision note verbatim from the research record).
- **Upkeep:** annual dated entry (the January survey each year + the
  mid-year snapshot as a dated note) — one appended row per year in the
  static module, the recorded future lever.

The series therefore ships as the typed static module
(`packages/insights/src/domains/gold/lbma-forecast.ts`, the
`gold-episodes-records.ts` precedent) with the extraction date + the
attribution ("Source: LBMA") carried on the card.

## 4. The archive/API-surface reality check (R31 — the readings archive's actual shape)

The meter's "readings archive" per s7/03 §3.4 = "the backtest harness's
corpus" — the STORED SERIES, not the KV daily-archive files (which only
exist since 2026-10-15 and cannot cover 2016+). The live probes (the
corpus-dump pattern, read-only KV REST, 2026-11-19):

- **`insights:ingest-stage:v1`** — the stage blob, HTTP 200, 2,123,043 B,
  `writtenAt 2026-11-19T04:35:17Z`, **172 series**. The gold grid:
  **`gold-usd` 2,516 points, 2016-11-18 → 2026-11-19** (the meter-era
  grid — the backtest's own windows; the S4 record's "2016-11 → 2026-10"
  matches). Voter-coverage spot-checks: `cftc-gold-positioning` 522 pts
  (2016-11-15 →) — far deeper than the recorded corpus's 1 point (the
  CFTC outage healed); `usd-reserve-share` 39 pts quarterly (2016-12-31 →
  2026-06-30); `michigan-5y-expectations` 119 pts monthly (2016-11-01 →);
  `gpr-daily` 3,688 pts (2016-10-12 →); `sp500-breadth-ratio` 2,512 pts
  (2016-11-21 →). **`us-japan-10y-gap` is genuinely 11 points** (2026-11-02
  → — the derived series' own history; its pre-Nov-2026 windows honestly
  read unread).
- **`insights:hist:ebp`** — 120 points, 2016-11-01 → 2026-10-01: the
  `ebp` voter (seated GF-P2) is MISSING from the stage but present in the
  per-id history keys — the meter runner therefore reads the stage + the
  hist fallback for exactly the ids the stage lacks (the corpus-dump
  `histFallback` precedent: it recorded the same pattern for
  dollar-basket/usdjpy). `insights:hist:us-japan-10y-gap` (10 pts) and
  `insights:hist:cftc-gold-positioning` (522 pts) confirmed as the same
  family.
- **The versioned voter tables** — the authoritative lineage
  (GOLD_SYSTEM_COMPLETE_REFERENCE §5.4): S4-frozen 20-seat (2026-10-31) ·
  S6/D-5 21-seat (2026-10-31) · GF-P1 19-seat (2026-11-05, intra-day) ·
  GF-P2 32-seat 5-lane (2026-11-05) · GF-P3 36-seat (2026-11-06,
  intra-day) · **GF-S10 37-seat (2026-11-06, current — UNCHANGED since)**.
  The frozen snapshots exist as code: `HARNESS_GOLD_VOTERS_20/_21`
  (gold-backtest-core.ts) verbatim; the production `GOLD_LANE_VOTERS`
  carries each seat's own provenance comment (P1 = the 21-seat minus the
  two yield-curve seats; P2 = the current table minus the five
  P3/S10 additions; P3 = minus michigan-5y-expectations) — the derived
  derivations are exact by the additive lineage, pinned by test at M2.
- **What the projection endpoint can serve:** the public history
  endpoint bounds L2 ids to the visible chart window (the 10y families
  are NOT public-API material), so the time machine gets its OWN one-key
  data plane (the gold-lbma/gold-premium pattern) — §6's design records.
- **The deploy state** (read-only, the versions API): the newest
  currena-api version is **`ea45d06c`** (created 2026-11-19T16:36:58Z) —
  S16's production, exactly as the session prompt records. No drift. The
  D-43 formal re-check re-runs FIRST at M3 before the deploy.

## 5. The R33 series reality check (the in-repo families)

- **gold / silver / btc**: daily series in the stage blob, 2016-11 → now
  (gold-usd probed: 2,516 pts; silver-usd/btc-usd present in the stage's
  172 series) — the month-end anchors derive from the stage, the
  runner's own computation.
- **sp500**: NOT stored as a series anywhere (the markets board stores
  scalars only — `close/chg1y/chg5y/high52w`…; the markets job's
  range=10y Yahoo fetch is transient). The in-repo provider is
  `fetchYahooSeries('sp500', …)` — the markets module's OWN keyless
  Yahoo chart fetch (`?range=10y&interval=1d`, the chg5y supplement's own
  request) — reused by the runner for the S&P month-end backfill: ONE
  polite request, the world board's own provider, zero new feeds. The
  forward points read the markets board's OWN stored close (KV read, no
  fetch — §6).
- **The R33 row's claim "all series in-repo"** is therefore TRUE in the
  provider sense (every leg rides a production source: the stage + the
  markets board's own provider), with one honesty note recorded: the
  S&P leg's stored-series did not exist; the runner's backfill CREATES
  the S&P month-end series from the board's own Yahoo venue (recorded,
  not silently assumed).

## 6. Design decisions taken at M1 (for the DECISIONS record at close)

- **S17-D1 (R31 data plane)**: ONE-year-sharded KV keys
  `insights:gold-meter-history:v1:<YYYY>` (one read per request
  preserved; ~260 compact rows/year ≈ ~100 KB/shard vs a ~1 MB single
  blob the free-plan CPU budget cannot parse per request). The row is
  COMPACT per the D7-locked minimal sizing: `{date, source, tableVersion,
  state, beamAngle, fullyTipped, net, readable, counts, lanes[5]}` — the
  readings/beam/lane counts, NO per-voter member lists (the historical
  view mirrors the hero's own lane-chip surface; the members stay the
  live seats' content). Provenance per row: `'backfill'` (the stage/hist
  reconstruction — the backtest's own machinery) vs `'live'` (the
  04:47 rung's forward row from the PUBLIC SNAPSHOT's readings — the
  page's own plane; a live row overwrites a backfill row on date
  collision, never the reverse — the S16-D2 rule).
- **S17-D2 (the voter-table registry)**: `GOLD_METER_TABLE_VERSIONS` in
  the meter-history engine — the dated registry with FOUR selectable
  entries: the S4-frozen 20-seat as the ERA BASIS (effective at the era
  start — the published backtest's own frozen table; the honest label:
  no live meter existed before late October 2026), the S6 21-seat
  (2026-10-31), the GF-P2 32-seat (2026-11-05), the current
  GF-S10 37-seat = production `GOLD_LANE_VOTERS` (2026-11-06). The two
  intra-day-only versions (GF-P1 19-seat, GF-P3 36-seat) are recorded in
  the lineage comments and NEVER selected (the daily grid cannot resolve
  intra-day transitions; the end-of-day convention — the LAST registry
  entry with effectiveFrom ≤ date — is the same one the daily archive
  itself uses). Selection pinned by test at M2, including the boundary
  dates.
- **S17-D3 (the rungs)**: the meter forward rung at **04:47 UTC** and
  the if-bought refresh rung at **04:49 UTC** — both clear of every
  other rung (:13 prices · :23/:53 expectations · :15-mod Frankfurter ·
  :40 watchdog · :50 narrator · 04:10/20/25/27/30/35/40 ingest · 10:10/
  20:10 sweeps · 20:33 premium), NO new cron trigger (the
  PRICES_CRON_MINUTE pattern — the account's 5-cron limit stays full).
  Both fail closed (a >24 h-old/missing snapshot writes nothing — the
  last-good discipline).
- **S17-D4 (R32 data)**: the static typed module (the extracted
  series + the pure compute); annual dated entry as the upkeep; the
  2026 forecast average rides the series' 17th entry with the mid-year
  revision recorded as the dated note. NO KV, NO route — the bundle
  carries 17 pairs (the gold-episodes-records precedent).
- **S17-D5 (R33 data plane)**: ONE KV key `insights:gold-ifbought:v1`
  (the gold-lbma pattern): per-asset MONTH-END closes since 2016-11
  (backfill: the stage for gold/silver/btc + `fetchYahooSeries('sp500')`
  for the S&P leg — the markets board's own provider) + the CURRENT
  running point refreshed daily by the 04:49 rung (the public snapshot's
  gold/silver/btc readings + the markets board's own sp500 close — KV
  reads, zero fetches); the month-turn appends the prior month's last
  point as the new anchor. The route serves the key (ONE read); the SPA
  computes lump + monthly DCA + the decile framing client-side through
  the pure engine. The DCA cadence is MONTHLY (the SA precedent's own
  convention); every window named at point of use; the decile base ≥ 30
  same-length windows (the R19 posture) with the honest waiting line.
- **S17-D6 (the zones)**: GoldTimeMachine renders INSIDE the Zone C hero
  section (the collapsed Advanced affordance row under the hero grid —
  s6/01 zone 4); GoldForecastRetrospective renders INSIDE the Zone M
  honest-record footer (the collapsed companion — trust-band contiguity
  preserved, S6-D2); GoldIfBought renders in Zone O beside the Episode
  Explorer (the collapsed Advanced card — s6/01 zone 16). All three
  collapsed by default on desktop AND 390 (the progressive-disclosure
  discipline, s6/01 §3).

## 7. The build-time checks + the standing constraints

- `pnpm install` clean (8.2 s); the tree typechecks at the branch point
  (`pnpm -r typecheck` — 6 packages, run at M2 close with the new code).
- The GoldPage budget carries 218,000/46,000 (measured 216.67/45.35 at
  S16) — **~1.3 kB raw headroom** for THREE new cards: a measured bump
  at M3 with the not-duplication check is EXPECTED and will be justified
  inline (each component + client exactly once in the GoldPage chunk;
  the pure engines ride the shared insights chunk — the S15/S16
  posture).
- The ONE Persian-copy manifest round at M3 (the round 90 — the session's
  fa strings across all three cards).
- The R5 no-renames constraint governs (no file moves; new modules only).
- The §21 portwatch window check before the deploy (2026-11-19 is a
  Thursday — clear); the D-43 deploy-lock re-check FIRST; the wrangler
  10013 retry rule in reserve.

## 8. Method and limitations

The reality checks ran read-only against the live KV (the REST API, the
token in the environment only — never printed, never written), the live
LBMA pages (a normal fetch, no identity games — the s4/02 method), and
the repo tree at the branch point. Limitations: (1) the stage blob's
series depths are as of `writtenAt 2026-11-19T04:35Z` — the runner reads
whatever the LIVE stage carries at run time; (2) the intra-day voter-table
versions are unknowable at daily granularity (S17-D2's convention records
this honestly); (3) the LBMA extraction is the publisher's own chart
config — the two internally-different 2025/2026 figures are recorded with
their contexts, not reconciled (they are LBMA's own divergence).
