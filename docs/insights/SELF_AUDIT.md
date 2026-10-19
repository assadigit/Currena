# SELF_AUDIT.md — the automatic self-check

Generated: 2026-10-19T23:22:29.256Z · rule version 2 · export: `docs/insights/exports/currena-insights-full-2026-10-19.md`

Result: **ALL TESTS PASS** (25 of 25 pass)

## Every test, pass or fail

| Test | Name | Result | Failures / notes |
|---|---|---|---|
| T-01 | Reconciliation: real yield + breakeven = nominal yield | pass | — |
| T-02 | Derived values recomputed from displayed inputs | pass | — |
| T-03 | Dates: trading days, nothing in the future, data on or before release | pass | — |
| T-04 | Freshness: every card within its maximum age or tagged stale | pass | — |
| T-05 | Known records: stored peaks at least the confirmed record values | pass | — |
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
| SUITE:packages/core | Unit suite — packages/core | pass | 191 tests |
| SUITE:packages/scraper | Unit suite — packages/scraper | pass | 67 tests |
| SUITE:packages/insights | Unit suite — packages/insights | pass | 521 tests |
| SUITE:apps/markets | Unit suite — apps/markets | pass | 13 tests |
| SUITE:apps/api | Unit suite — apps/api | pass | 334 tests |
| SUITE:apps/web | Unit suite — apps/web | pass | 678 tests |

## Stale or "can't tell" cards

| Indicator | Status | As of | Reason |
| au-wage-growth | stale | 2026-04-01 | stale |

## Unavailable cards

- ecb-dfr
- shiller-cape
- shiller-ecy
- au-10y
- rba-expectations
- au-us-10y-gap
- rba-cash-rate
- au-home-loan
- au-deposit-rate
- au-household-debt-arrears

## Source report

- ✅ fred — T10Y2Y
- ✅ fred — STLFSI4
- ✅ fred — DFII10
- ✅ fred — DGS10
- ✅ fred — T5YIFR
- ✅ fred — A091RC1Q027SBEA
- ✅ fred — W006RC1Q027SBEA
- ✅ fred — DCOILBRENTEU
- ✅ fred — M2SL
- ✅ fred — CPIAUCNS
- ✅ fred — CPILFENS
- ✅ fred — DFEDTARL
- ✅ fred — DFEDTARU
- ✅ fred — NFCI
- ✅ fred — UNRATE
- ✅ fred — SAHMREALTIME
- ✅ fred — VIXCLS
- ✅ fred — DGS2
- ✅ fred — DGS30
- ✅ fred — T10YIE
- ✅ fred — GACDFSA066MSFRBPHI
- ✅ yahoo — BZ=F daily closes (Brent gap-fill)
- ✅ yahoo — GC=F daily quotes (10-year record history)
- ✅ yahoo — SI=F daily quotes (10-year record history)
- ✅ yahoo — BTC-USD daily quotes (10-year record history)
- ❌ ecb — FM/D.U2.EUR.4F.KR.DFR.LEV: The operation was aborted due to timeout
- ✅ frankfurter — USD→JPY,AUD,CNY,EUR,GBP,CAD,SEK,CHF since 2016-01-04
- ✅ world-bank — Pink Sheet monthly workbook
- ✅ gold-api — XAU spot
- ✅ gold-api — XAG spot
- ✅ gold-api — BTC spot
- ✅ gold-api — HG (copper) spot
- ✅ abs — CPI/1.10001.10.50.M
- ✅ abs — CPI/1.999902.20.50.M
- ✅ abs — LF/M13.3.1599.20.AUS.M
- ✅ abs — RES_DWELL_ST/5.AUS.Q
- ✅ abs — ANA_AGG/M5.TTR.20.AUS.Q
- ✅ abs — CPI/1.115522.10.50.M
- ✅ abs — CPI/1.40081.10.50.M
- ✅ abs — WPI/1.OHRPEB.7.TOT.10.AUS.Q
- ✅ bitstamp — btcusd last 10 daily candles
- ❌ rba — F1 Cash Rate Target (daily: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F1.1 Cash Rate Target: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F2 Australian Government 10 year bond: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F2 FCMYGBAG3D Australian Government 3 year bond: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — E2 Household debt to income: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F6 FLRHOOTA owner-occupier outstanding home-loan rate: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ❌ rba — F4.1 PDRNTH new household term-deposit rate: blocked by the site — no retry, waiting for the next scheduled refresh (blocked by the site (HTTP 403) — waiting for the next scheduled refresh)
- ✅ alternative-me — Crypto Fear and Greed (daily history)
- ✅ cross-check — gold-api BTC 81891 vs Bitstamp close 81898 (2026-10-19) → -0.01%

## Scope notes

- The world-markets and world-currencies boards are served by their own Worker; this self-check rebuilds the INDICATOR snapshot, so the export here omits those sections (the page's own export carries them).
- The T-16 FRED copyright scan and the licence register are pinned by their own tests (validation-step3.test.ts); their records live in data/fred-copyright.json + LICENCES.md.
- This file and the dated export are EVIDENCE — the scheduled GitHub Action writes neither to KV nor to the repo; a failing run is a red run.
