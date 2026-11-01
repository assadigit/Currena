# SELF_AUDIT.md — the automatic self-check

Generated: 2026-11-01T14:02:51.364Z · rule version 4 · export: `docs/insights/exports/currena-insights-full-2026-11-01.md`

Result: **1 TEST(S) FAILED** (24 of 25 pass)

## Every test, pass or fail

| Test | Name | Result | Failures / notes |
|---|---|---|---|
| T-01 | Reconciliation: real yield + breakeven = nominal yield | pass | — |
| T-02 | Derived values recomputed from displayed inputs | pass | — |
| T-03 | Dates: trading days, nothing in the future, data on or before release | pass | — |
| T-04 | Freshness: every card within its maximum age or tagged stale | pass | — |
| T-05 | Known records: stored peaks at least the confirmed record values | **FAIL** | btc-usd: no stored peak — the record-history backfill is missing; gold-usd: no stored peak — the record-history backfill is missing; silver-usd: no stored peak — the record-history backfill is missing |
| T-06 | Text matches status: no easing text on a rising value | pass | — |
| T-07 | Forbidden words: no forecast wording in generated sentences | pass | — |
| T-08 | Suspicious values: no duplicate prints, no exactly-zero monthly changes | pass | — |
| T-09 | Counts: hero count equals the sum of the area counts, scored only | pass | — |
| T-10 | Units: percentage points for rates, % only for prices and indexes | pass | — |
| T-11 | Same indicator, same status in every section | pass | — |
| T-12 | Relationship rules: Active only when every required leg meets its rule | pass | — |
| T-13 | Source present: every card has a source name and a data date | pass | — |
| T-14 | Regression fixtures: saved episodes produce the stored statuses | pass | — |
| T-17 | Attribution present: attribution-required sources carry exact text | pass | — |
| T-19 | No advice wording in generated text | pass | scope: the generated indicator sentences of both dictionaries |
| E-10 | Money-supply scale: the export cell carries the DISPLAYED value (23.3 trillion) | pass | the display scale is applied at export (full-export.ts exportValue); registry-sync pins the unit token |
| E-24 | The export price table carries the peak columns | pass | — |
| E-18 | Trend labels reproducible from the stated 3-month rule | pass | the export + CSV recompute from chg3m (markets/compute.ts trendOf); pinned by markets + full-export tests |
| SUITE:packages/core | Unit suite — packages/core | pass | 195 tests |
| SUITE:packages/scraper | Unit suite — packages/scraper | pass | 67 tests |
| SUITE:packages/insights | Unit suite — packages/insights | pass | 1093 tests |
| SUITE:apps/markets | Unit suite — apps/markets | pass | 13 tests |
| SUITE:apps/api | Unit suite — apps/api | pass | 393 tests |
| SUITE:apps/web | Unit suite — apps/web | pass | 10060 tests |

## Stale or "can't tell" cards

| Indicator | Status | As of | Reason |
| euro-hicp | stale | 2026-09-01 | stale |
| gold-oil-ratio | stale | 2026-09-01 | stale |
| food-index | stale | 2026-09-01 | stale |
| wheat | stale | 2026-09-01 | stale |
| maize | stale | 2026-09-01 | stale |
| copper-gold | stale | 2026-09-01 | stale |
| au-unemployment | stale | 2026-09-01 | stale |
| iron-ore | stale | 2026-09-01 | stale |

## Unavailable cards

- us-deficit-12m
- us-deficit-monthly
- treasury-auction-10y
- treasury-auction-10y-indirect
- treasury-auction-30y
- treasury-auction-30y-indirect
- median-cpi
- sticky-cpi
- oecd-cli-us
- oecd-cli-cn
- oecd-cli-de
- usdaed
- shiller-cape
- shiller-ecy
- term-premium-10y
- tga
- reverse-repo
- bank-reserves
- repo-stress
- net-liquidity
- ebp
- ofr-fsi
- sloos-ci-tightening
- empire-state
- continuing-claims
- gdpnow
- au-10y
- rba-expectations
- au-us-10y-gap
- rba-cash-rate
- au-home-loan
- au-deposit-rate
- au-household-debt-arrears
- rba-fed-gap

## Source report

- ✅ fred — bulk group 1 (2 series: DGS10, DGS30)
- ✅ fred — bulk group 2 (1 series, from 2003-01-02: DFII10)
- ✅ fred — bulk group 3 (10 series, from 2016-08-05: T10Y2Y, T10Y3M, STLFSI4, T5YIFR, DGS2, T10YIE, VIXCLS, NFCI, SOFR, T5YIE)
- ✅ fred — bulk group 4 (12 series, from 2016-08-05: M2SL, CPIAUCNS, CPILFENS, DFEDTARL, DFEDTARU, UNRATE, SAHMREALTIME, GACDFSA066MSFRBPHI, PAYEMS, A191RL1Q225SBEA, RSAFS, PERMIT)
- ✅ fred — bulk group 5 (5 series, from 2016-08-05: A091RC1Q027SBEA, W006RC1Q027SBEA, DCOILBRENTEU, DCOILWTICO, DHHNGSP)
- ✅ fred — bulk group 6 (4 series, from 2016-08-05: IRLTLT01DEM156N, IRLTLT01JPM156N, IRLTLT01GBM156N, IRSTCI01JPM156N)
- ✅ fred — bulk group 7 (11 series, from 2016-08-05: ICSA, RECPROUSM156N, UMCSENT, MICH, PCEPILFE, MORTGAGE30US, WALCL, WSEFINTL1, CFNAI, JTSJOL, AHETPI)
- ❌ yahoo — Brent front-month daily closes (the gap-fill, first active contract): blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (rate-limited, HTTP 429) — waiting for the next scheduled refresh)
- ❌ yahoo — GC=F daily quotes (10-year record history): blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (rate-limited, HTTP 429) — waiting for the next scheduled refresh)
- ❌ yahoo — SI=F daily quotes (10-year record history): blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (rate-limited, HTTP 429) — waiting for the next scheduled refresh)
- ❌ yahoo — BTC-USD daily quotes (10-year record history): blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (rate-limited, HTTP 429) — waiting for the next scheduled refresh)
- ✅ ecb — FM/D.U2.EUR.4F.KR.DFR.LEV
- ✅ ecb — YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y (decade window)
- ✅ ecb — HICP/M.U2.N.000000.4D0.ANR (decade window)
- ✅ boe — Bank Rate history page (decision table, HTML)
- ✅ nbs — press-release index page 1
- ✅ nbs — press-release index page 2
- ✅ nbs — PMI release: Purchasing Managers' Index for September 2026 (2026-10-01)
- ✅ nbs — CPI release: Consumer Price Index in September 2026 (2026-10-15)
- ✅ frankfurter — USD→JPY,AUD,CNY,EUR,GBP,CAD,SEK,CHF,TRY since 2016-01-04
- ❌ yahoo — AED=X daily closes (USD/AED, the usdaed card): blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (rate-limited, HTTP 429) — waiting for the next scheduled refresh)
- ✅ world-bank — Pink Sheet monthly workbook
- ✅ gold-api — XAU spot
- ✅ gold-api — XAG spot
- ✅ gold-api — BTC spot
- ✅ gold-api — HG (copper) spot
- ✅ gold-api — XPT (platinum) spot
- ✅ abs — CPI/1.10001.10.50.M
- ✅ abs — CPI/1.999902.20.50.M
- ✅ abs — LF/M13.3.1599.20.AUS.M
- ✅ abs — RES_DWELL_ST/5.AUS.Q
- ✅ abs — ANA_AGG/M5.TTR.20.AUS.Q
- ✅ abs — CPI/1.115522.10.50.M
- ✅ abs — CPI/1.40081.10.50.M
- ✅ abs — WPI/1.OHRPEB.7.TOT.10.AUS.Q
- ✅ abs — LEND_HOUSING/FIN_VAL.NEWCOMMITS.DV8368.TOTDWELL.TOT.TOT.20.AUS.Q
- ✅ abs — ANA_AGG/M7.HSR.20.AUS.Q
- ✅ abs — JV/M1.7.TOT.20.AUS.Q
- ✅ bitstamp — btcusd last 10 daily candles
- ❌ rba — cash-rate page decision table (HTML): blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F1 Cash Rate Target (daily: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F1.1 Cash Rate Target: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — E2 Household debt to income: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F6 FLRHOOTA owner-occupier outstanding home-loan rate: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F4.1 PDRNTH new household term-deposit rate: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F2 Australian Government 10 year bond: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F2 FCMYGBAG3D Australian Government 3 year bond: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F2.1 FCMYGBAG10 10-year bond yield (monthly): blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F2.1 FCMYGBAG3 3-year bond yield (monthly): blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ✅ alternative-me — Crypto Fear and Greed (daily history)
- ✅ cross-check — gold-api BTC 77858 vs Bitstamp close 77813 (2026-11-01) → 0.06%
- ✅ mof — jgbcme.csv daily 10Y + jgbcme_all.csv history
- ✅ eia — crude oil ending stocks WCRSTUS1 (weekly, keyless website route)
- ✅ cftc — Commitments of Traders, futures-only (gold row)
- ❌ oecd — Composite leading indicators, amplitude-adjusted (USA, CHN, DEU): HTTP 500 from sdmx.oecd.org — single attempt, no retry (F-11)
- ✅ gpr — Geopolitical Risk Index (monthly export)
- ✅ epu — US Economic Policy Uncertainty (Main News Index workbook)

## Scope notes

- The world-markets and world-currencies boards are served by their own Worker; this self-check rebuilds the INDICATOR snapshot, so the export here omits those sections (the page's own export carries them).
- The T-16 FRED copyright scan and the licence register are pinned by their own tests (validation-step3.test.ts); their records live in data/fred-copyright.json + LICENCES.md.
- This file and the dated export are EVIDENCE — the scheduled GitHub Action writes neither to KV nor to the repo; a failing run is a red run.
