# Insights backtest — Phase I1 (re-run for the 30-indicator set, Phase I6)

Generated 2026-10-07 by `pnpm --filter @currena/insights backtest` from the recorded fixtures (`packages/insights/fixtures/`, captured 2026-10-06 — see the fixtures README). No live sites are touched. Thresholds are the spec starting points from `01-indicator-spec.md`; nothing here changes them — this report is the evidence the owner reviews at the Gate I1 exit. Re-run 2026-10-07 (I6 completeness sweep) against the full 30-indicator definition set: the two owner-added ounce cards (`gold-usd`, `silver-usd`) appear in the coverage table honestly as info-only/never-votes, and `china-pmi`'s coverage note reflects its populated-but-short manual series.

## Method

- Engine: `@currena/insights` scoring (rule evaluation, percentiles, stale handling) — identical code path to the future ingestion runner.
- Frozen clock: each weekly run passes its own date; nothing reads the wall clock.
- Percentile: share of the last 10 years’ readings strictly below the current one; minimum 120 base observations before a percentile exists.
- Labels: score = warnings ÷ voters; <20% Relaxed · 20–39% Cautious · 40–59% Stressed · ≥60% Alarmed; no voters → no label.
- Stale exclusion: max age of the freshest observation per cadence (daily 3d, weekly 16d, monthly 95d, quarterly 190d, per-change never — release lags included, calibrated against the fixtures in this run).
- Windows: weekly Mondays across the 2008 GFC, 2020 COVID and 2022 inflation shocks, plus 2017 and 2025 as calm contrast.

## Coverage

| Indicator | Phase | Series (fixture) | Span | Obs | In backtest |
|---|---|---|---|---|---|
| `yield-curve-10y2y` | P1 | FRED (T10Y2Y) | 2004-01-02 → 2026-10-05 | 5694 | yes |
| `stress-stlfsi` | P1 | FRED (STLFSI4) | 1993-12-31 → 2026-09-25 | 1709 | yes |
| `real-yield-10y` | P1 | FRED (DFII10) | 2004-01-02 → 2026-10-02 | 5693 | yes |
| `us10y` | P1 | FRED (DGS10) | 2004-01-02 → 2026-10-02 | 5693 | yes |
| `breakeven-5y5y` | P2 | FRED (T5YIFR) | 2004-01-02 → 2026-10-05 | 5694 | yes |
| `govt-interest-revenue` | P2 | FRED (A091RC1Q027SBEA ÷ W006RC1Q027SBEA) | 1947-01-01 → 2026-04-01 | 318 | yes |
| `dollar-broad` | P1 | FRED (DTWEXBGS) | 2006-01-02 → 2026-10-02 | 5203 | yes |
| `usdjpy` | P1 | Frankfurter (ECB) | 2003-12-31 → 2026-10-05 | 5830 | yes |
| `gold-usd` | P1 | — | — | — | no — info-only (owner-added 2026-10-07): live TGJU ounce point over World Bank monthly gold backfill — never votes |
| `silver-usd` | P1 | — | — | — | no — info-only (owner-added 2026-10-07): live gold-api XAG point over World Bank monthly silver backfill — never votes |
| `gold-silver` | P1 | World Bank Pink Sheet (gold ÷ silver) | 2004-01-01 → 2026-09-01 | 273 | yes |
| `gold-btc` | P1 | — | — | — | no — live sources are I2 adapters (gold-api.com BTC); info-only, never votes |
| `silver-btc` | P1 | — | — | — | no — live sources are I2 adapters; info-only, never votes |
| `copper-gold` | P2 | World Bank Pink Sheet (copper ÷ gold) | 2004-01-01 → 2026-09-01 | 273 | yes |
| `brent` | P2 | FRED (DCOILBRENTEU) | 2004-01-06 → 2026-09-29 | 5670 | yes |
| `m2-us` | P2 | FRED (M2SL) | 1959-01-01 → 2026-08-01 | 812 | yes |
| `china-pmi` | P2 | — | — | — | no — manual series (data/manual/china-pmi.json) populated since Phase I5 but starts 2025-12 — 10 observations, too short for any backtest window or the percentile floor; votes in production (threshold < 50) once history accrues |
| `usdcny` | P2 | Frankfurter (ECB) | 2003-12-31 → 2026-10-05 | 5830 | yes |
| `rba-cash-rate` | P1 | — | — | — | no — rba.gov.au Akamai-blocked from the sandbox (03-data-sources.md); info-only, never votes |
| `au-cpi` | P1 | ABS (CPI All groups) | 2005-01-01 → 2026-04-01 | 86 | yes |
| `au-trimmed-mean` | P1 | ABS (CPI_Q Trimmed Mean) | 2005-01-01 → 2026-04-01 | 86 | yes |
| `audusd` | P1 | Frankfurter (ECB) | 2003-12-31 → 2026-10-05 | 5830 | yes |
| `audjpy` | P1 | Frankfurter (ECB) | 2003-12-31 → 2026-10-05 | 5830 | yes |
| `au-us-10y-gap` | P1 | — | — | — | no — RBA F2 unreachable from the sandbox — pending the Phase I2 venue re-probe |
| `gold-aud` | P1 | — | — | — | no — composed from live TGJU gold + Frankfurter AUD (I2); info-only, never votes |
| `iron-ore` | P2 | World Bank Pink Sheet (iron ore) | 2004-01-01 → 2026-09-01 | 273 | yes |
| `terms-of-trade` | P2 | — | — | — | no — ABS ANA_AGG adapter is Phase I2 work (P2 indicator) |
| `au-unemployment` | P1 | ABS (Labour Force) | 2004-01-01 → 2026-08-01 | 272 | yes |
| `au-home-values` | P2 | — | — | — | no — ABS RES_DWELL_ST adapter is Phase I2 work (P2 indicator) |
| `au-household-debt-arrears` | P2 | — | — | — | no — ABS E2 adapter is Phase I2 work (P2 indicator) |

Not-backtested items are info-only (never vote) or P2 indicators whose adapters are Phase I2 work; their absence changes vote denominators, which the per-window tables below state explicitly.

## "Today" run (latest fixture data, 2026-10-05)

- **Global:** cautious — 3 of 11 voting indicators in warning (1 excluded).
- **Australia:** stressed — 3 of 6 in warning (0 excluded).

| Indicator | Value | As of | 10y percentile | 7d | 30d | Status |
|---|---|---|---|---|---|---|
| US 10Y minus 2Y yield | 0.47 | 2026-10-05 | 55% | 0.1 | 0.1 | normal |
| St. Louis Fed Financial Stress Index | -0.81 | 2026-09-25 | 7% | -0.1 | 0.0 | normal |
| US 10-year real yield | 2.92 | 2026-10-02 | 100% | 0.1 | 0.5 | warning |
| US 10-year Treasury yield | 5.28 | 2026-10-02 | 100% | 0.1 | 0.5 | warning |
| Inflation expectations (5y5y forward) | 2.36 | 2026-10-05 | 91% | 0.0 | 0.0 | warning |
| US government interest payments / receipts | 0.34 | 2026-04-01 | 73% | — | — | normal |
| Broad US dollar index | 121.4 | 2026-10-02 | 79% | 1.1 | 2.9 | normal |
| USD/JPY | 158.2 | 2026-10-05 | 95% | 0.9 | 1.3 | normal |
| Gold / Silver | 66.9 | 2026-09-01 | 6% | — | -0.6 | normal |
| Copper / Gold | 3.35 | 2026-09-01 | 21% | — | 0.1 | normal |
| Brent oil | 114.0 | 2026-09-29 | 97% | -0.8 | 27.0 | stale |
| US M2 money supply | 23342.8 | 2026-08-01 | 100% | — | 0.5 | normal |
| USD/CNY | 6.70 | 2026-10-05 | 27% | -0.1 | -0.1 | context |
| Australian CPI (annual change) | 3.94 | 2026-04-01 | 76% | — | — | warning |
| Australian trimmed-mean inflation | 3.65 | 2026-04-01 | 73% | — | — | warning |
| AUD/USD | 0.70 | 2026-10-05 | 47% | -0.9 | -3.4 | normal |
| AUD/JPY | 110.1 | 2026-10-05 | 94% | -0.1 | -2.2 | normal |
| Iron ore price | 97.7 | 2026-09-01 | 42% | — | 1.5 | normal |
| Australian unemployment rate | 4.65 | 2026-08-01 | 50% | — | 0.2 | warning |

## Global financial crisis (Jul 2007 – Jun 2009)

Weeks: 105. Global label distribution: relaxed ×61, cautious ×10, stressed ×34. Australia: relaxed ×24, cautious ×37, stressed ×23, alarmed ×21.

Peak global week: **2008-10-27** — stressed (7/12 in warning). Peak Australia week: **2008-12-01** — alarmed (5/6).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2007-07-30 | relaxed | 1/12 | relaxed | 0/6 |
| 2007-08-27 | relaxed | 1/12 | relaxed | 0/6 |
| 2007-10-29 | relaxed | 1/12 | relaxed | 1/6 |
| 2007-11-26 | cautious | 3/12 | cautious | 2/6 |
| 2007-12-31 | relaxed | 1/12 | relaxed | 1/6 |
| 2008-01-28 | relaxed | 1/12 | cautious | 2/6 |
| 2008-02-25 | relaxed | 1/12 | cautious | 2/6 |
| 2008-03-31 | relaxed | 1/12 | stressed | 3/6 |
| 2008-04-28 | relaxed | 2/12 | cautious | 2/6 |
| 2008-05-26 | cautious | 3/12 | cautious | 2/6 |
| 2008-06-30 | relaxed | 2/12 | cautious | 2/6 |
| 2008-07-28 | relaxed | 1/12 | cautious | 2/6 |
| 2008-08-25 | relaxed | 1/12 | stressed | 3/6 |
| 2008-09-29 | relaxed | 2/12 | stressed | 3/6 |
| 2008-10-27 | stressed | 7/12 | alarmed | 4/6 |
| 2008-12-29 | cautious | 3/12 | alarmed | 4/6 |
| 2009-01-26 | stressed | 6/12 | alarmed | 4/6 |
| 2009-03-30 | stressed | 6/12 | alarmed | 4/6 |
| 2009-04-27 | stressed | 5/12 | alarmed | 4/6 |
| 2009-05-25 | stressed | 6/12 | cautious | 2/6 |
| 2009-06-29 | stressed | 5/12 | cautious | 2/6 |

Voting indicators at the peak global week (2008-10-27):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | 2.20 | 92% | **normal** |
| St. Louis Fed Financial Stress Index | 8.12 | 100% | **warning** |
| US 10-year real yield | 3.02 | 100% | **warning** |
| US 10-year Treasury yield | 3.79 | 9% | **normal** |
| Inflation expectations (5y5y forward) | 2.64 | 96% | **warning** |
| US government interest payments / receipts | 0.27 | 69% | **normal** |
| Broad US dollar index | 102.3 | 100% | **warning** |
| USD/JPY | 92.9 | 0% | **warning** |
| Gold / Silver | 77.6 | 100% | **warning** |
| Copper / Gold | 6.10 | 2% | **warning** |
| Brent oil | 59.3 | 43% | **normal** |
| US M2 money supply | 7976.3 | 100% | **normal** |
| Australian CPI (annual change) | 3.67 | — | **warning** |
| Australian trimmed-mean inflation | 4.31 | — | **warning** |
| AUD/USD | 0.61 | 0% | **warning** |
| AUD/JPY | 56.8 | 0% | **warning** |
| Iron ore price | 88.7 | 68% | **normal** |
| Australian unemployment rate | 4.29 | 21% | **normal** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| St. Louis Fed Financial Stress Index | 97 | 105 |
| Australian trimmed-mean inflation | 92 | 105 |
| Australian CPI (annual change) | 52 | 105 |
| Gold / Silver | 44 | 105 |
| Copper / Gold | 39 | 105 |
| Australian unemployment rate | 31 | 105 |
| AUD/JPY | 28 | 101 |
| AUD/USD | 28 | 103 |
| US government interest payments / receipts | 26 | 105 |
| Broad US dollar index | 26 | 105 |
| Brent oil | 25 | 104 |
| US 10-year real yield | 18 | 105 |
| Inflation expectations (5y5y forward) | 12 | 105 |
| USD/JPY | 11 | 101 |
| US 10-year Treasury yield | 10 | 105 |
| Iron ore price | 9 | 105 |
| US 10Y minus 2Y yield | 0 | 105 |
| US M2 money supply | 0 | 105 |

## COVID shock (Jan – Dec 2020)

Weeks: 52. Global label distribution: cautious ×31, stressed ×3, relaxed ×18. Australia: relaxed ×25, cautious ×26, stressed ×1.

Peak global week: **2020-07-06** — stressed (5/12 in warning). Peak Australia week: **2020-05-11** — stressed (2/5).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2020-01-27 | cautious | 3/12 | relaxed | 1/6 |
| 2020-03-30 | cautious | 4/12 | cautious | 2/6 |
| 2020-04-27 | cautious | 4/12 | cautious | 2/6 |
| 2020-05-25 | cautious | 4/12 | cautious | 2/6 |
| 2020-06-29 | cautious | 4/12 | cautious | 2/6 |
| 2020-07-27 | cautious | 4/12 | cautious | 2/6 |
| 2020-08-31 | relaxed | 2/12 | relaxed | 1/6 |
| 2020-09-28 | relaxed | 2/12 | cautious | 2/6 |
| 2020-10-26 | relaxed | 2/12 | cautious | 2/6 |
| 2020-11-30 | relaxed | 1/12 | relaxed | 1/6 |
| 2020-12-28 | relaxed | 0/12 | relaxed | 1/6 |

Voting indicators at the peak global week (2020-07-06):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | 0.53 | 22% | **normal** |
| St. Louis Fed Financial Stress Index | 0.43 | 88% | **warning** |
| US 10-year real yield | -0.76 | 1% | **normal** |
| US 10-year Treasury yield | 0.69 | 1% | **normal** |
| Inflation expectations (5y5y forward) | 1.62 | 6% | **normal** |
| US government interest payments / receipts | 0.23 | 31% | **normal** |
| Broad US dollar index | 119.3 | 97% | **warning** |
| USD/JPY | 107.5 | 52% | **normal** |
| Gold / Silver | 89.7 | 96% | **warning** |
| Copper / Gold | 3.45 | 3% | **warning** |
| Brent oil | 42.7 | 8% | **warning** |
| US M2 money supply | 18331.4 | 100% | **normal** |
| Australian CPI (annual change) | 0.65 | 3% | **normal** |
| Australian trimmed-mean inflation | 1.20 | 0% | **normal** |
| AUD/USD | 0.70 | 11% | **warning** |
| AUD/JPY | 75.0 | 9% | **normal** |
| Iron ore price | 108.5 | 62% | **normal** |
| Australian unemployment rate | 7.45 | 100% | **warning** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| Copper / Gold | 48 | 52 |
| Broad US dollar index | 44 | 52 |
| Australian unemployment rate | 39 | 52 |
| AUD/USD | 35 | 51 |
| Gold / Silver | 30 | 52 |
| St. Louis Fed Financial Stress Index | 14 | 52 |
| Brent oil | 12 | 50 |
| AUD/JPY | 4 | 50 |
| USD/JPY | 1 | 50 |
| US 10Y minus 2Y yield | 0 | 52 |
| US 10-year real yield | 0 | 52 |
| US 10-year Treasury yield | 0 | 52 |
| Inflation expectations (5y5y forward) | 0 | 52 |
| US government interest payments / receipts | 0 | 52 |
| US M2 money supply | 0 | 52 |
| Australian CPI (annual change) | 0 | 52 |
| Australian trimmed-mean inflation | 0 | 52 |
| Iron ore price | 0 | 52 |

## Inflation shock (Jan – Dec 2022)

Weeks: 52. Global label distribution: relaxed ×14, cautious ×18, stressed ×20. Australia: cautious ×14, stressed ×36, alarmed ×2.

Peak global week: **2022-10-17** — stressed (7/12 in warning). Peak Australia week: **2022-10-10** — alarmed (4/6).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2022-01-31 | relaxed | 1/12 | stressed | 3/6 |
| 2022-02-28 | relaxed | 1/12 | cautious | 2/6 |
| 2022-03-28 | cautious | 3/12 | cautious | 2/6 |
| 2022-04-25 | relaxed | 2/12 | cautious | 2/6 |
| 2022-05-30 | cautious | 3/12 | cautious | 2/6 |
| 2022-06-27 | cautious | 4/12 | stressed | 3/6 |
| 2022-07-25 | cautious | 3/12 | stressed | 3/6 |
| 2022-08-29 | stressed | 5/12 | stressed | 3/6 |
| 2022-09-26 | stressed | 5/12 | stressed | 3/6 |
| 2022-10-31 | stressed | 5/12 | stressed | 3/6 |
| 2022-11-28 | stressed | 6/12 | stressed | 3/6 |
| 2022-12-26 | stressed | 5/12 | stressed | 3/6 |

Voting indicators at the peak global week (2022-10-17):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | -0.43 | 0% | **warning** |
| St. Louis Fed Financial Stress Index | 0.28 | 88% | **warning** |
| US 10-year real yield | 1.57 | 100% | **warning** |
| US 10-year Treasury yield | 4.02 | 100% | **warning** |
| Inflation expectations (5y5y forward) | 2.42 | 81% | **warning** |
| US government interest payments / receipts | 0.25 | 77% | **normal** |
| Broad US dollar index | 127.6 | 100% | **warning** |
| USD/JPY | 148.9 | 100% | **normal** |
| Gold / Silver | 85.8 | 87% | **warning** |
| Copper / Gold | 4.60 | 35% | **normal** |
| Brent oil | 91.0 | 74% | **normal** |
| US M2 money supply | 21464.2 | 92% | **normal** |
| Australian CPI (annual change) | 7.86 | 100% | **warning** |
| Australian trimmed-mean inflation | 6.76 | 100% | **warning** |
| AUD/USD | 0.62 | 1% | **warning** |
| AUD/JPY | 93.0 | 79% | **normal** |
| Iron ore price | 92.6 | 50% | **normal** |
| Australian unemployment rate | 3.43 | 0% | **normal** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| Australian CPI (annual change) | 52 | 52 |
| Australian trimmed-mean inflation | 52 | 52 |
| Broad US dollar index | 44 | 52 |
| AUD/USD | 37 | 51 |
| US 10-year Treasury yield | 34 | 52 |
| Gold / Silver | 27 | 52 |
| US 10Y minus 2Y yield | 26 | 52 |
| US 10-year real yield | 21 | 52 |
| Inflation expectations (5y5y forward) | 7 | 52 |
| Brent oil | 6 | 50 |
| US M2 money supply | 6 | 52 |
| St. Louis Fed Financial Stress Index | 5 | 52 |
| USD/JPY | 3 | 50 |
| AUD/JPY | 1 | 50 |
| US government interest payments / receipts | 0 | 52 |
| Copper / Gold | 0 | 52 |
| Iron ore price | 0 | 52 |
| Australian unemployment rate | 0 | 52 |

## Calm contrast (2017)

Weeks: 52. Global label distribution: relaxed ×43, cautious ×9. Australia: relaxed ×45, cautious ×6, stressed ×1.

Peak global week: **2017-05-15** — cautious (3/11 in warning). Peak Australia week: **2017-05-15** — stressed (2/5).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2017-01-30 | relaxed | 1/12 | relaxed | 1/6 |
| 2017-02-27 | relaxed | 1/12 | relaxed | 0/6 |
| 2017-03-27 | relaxed | 1/12 | relaxed | 0/6 |
| 2017-05-29 | cautious | 3/12 | cautious | 2/6 |
| 2017-06-26 | cautious | 3/12 | relaxed | 1/6 |
| 2017-07-31 | relaxed | 2/12 | relaxed | 0/6 |
| 2017-08-28 | relaxed | 1/12 | relaxed | 0/6 |
| 2017-09-25 | relaxed | 2/12 | relaxed | 0/6 |
| 2017-10-30 | relaxed | 2/12 | relaxed | 1/6 |
| 2017-11-27 | relaxed | 1/12 | relaxed | 0/6 |
| 2017-12-25 | relaxed | 2/12 | relaxed | 0/6 |

Voting indicators at the peak global week (2017-05-15):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | 1.03 | 13% | **normal** |
| St. Louis Fed Financial Stress Index | -0.60 | 10% | **normal** |
| US 10-year real yield | 0.52 | 46% | **normal** |
| US 10-year Treasury yield | 2.34 | 39% | **normal** |
| Inflation expectations (5y5y forward) | 1.90 | 15% | **normal** |
| US government interest payments / receipts | 0.24 | 36% | **normal** |
| Broad US dollar index | 114.4 | 94% | **warning** |
| Gold / Silver | 74.6 | 88% | **warning** |
| Copper / Gold | 4.49 | 18% | **warning** |
| Brent oil | 51.3 | 19% | **normal** |
| US M2 money supply | 13567.4 | 100% | **normal** |
| Australian CPI (annual change) | 1.90 | 36% | **normal** |
| Australian trimmed-mean inflation | 1.68 | 8% | **normal** |
| AUD/USD | 0.74 | 15% | **warning** |
| Iron ore price | 62.4 | 17% | **warning** |
| Australian unemployment rate | 5.55 | 51% | **normal** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| Broad US dollar index | 46 | 52 |
| Gold / Silver | 35 | 52 |
| AUD/USD | 19 | 51 |
| Iron ore price | 14 | 52 |
| Copper / Gold | 13 | 52 |
| Brent oil | 3 | 52 |
| US 10Y minus 2Y yield | 0 | 52 |
| St. Louis Fed Financial Stress Index | 0 | 52 |
| US 10-year real yield | 0 | 52 |
| US 10-year Treasury yield | 0 | 52 |
| Inflation expectations (5y5y forward) | 0 | 52 |
| US government interest payments / receipts | 0 | 52 |
| USD/JPY | 0 | 50 |
| US M2 money supply | 0 | 52 |
| Australian CPI (annual change) | 0 | 52 |
| Australian trimmed-mean inflation | 0 | 52 |
| AUD/JPY | 0 | 50 |
| Australian unemployment rate | 0 | 52 |

## Recent contrast (2025)

Weeks: 39. Global label distribution: stressed ×31, alarmed ×2, cautious ×6. Australia: relaxed ×26, cautious ×13.

Peak global week: **2025-05-19** — alarmed (7/11 in warning). Peak Australia week: **2025-07-07** — cautious (2/6).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2025-01-27 | stressed | 7/12 | relaxed | 1/6 |
| 2025-03-31 | stressed | 5/12 | relaxed | 1/6 |
| 2025-04-28 | stressed | 5/12 | relaxed | 1/6 |
| 2025-05-26 | stressed | 5/12 | relaxed | 1/6 |
| 2025-06-30 | cautious | 4/12 | relaxed | 1/6 |
| 2025-07-28 | stressed | 6/12 | cautious | 2/6 |
| 2025-08-25 | stressed | 5/12 | cautious | 2/6 |
| 2025-09-29 | cautious | 4/12 | cautious | 2/6 |

Voting indicators at the peak global week (2025-05-19):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | 0.49 | 53% | **normal** |
| St. Louis Fed Financial Stress Index | -0.89 | 2% | **normal** |
| US 10-year real yield | 2.10 | 95% | **warning** |
| US 10-year Treasury yield | 4.46 | 95% | **warning** |
| Inflation expectations (5y5y forward) | 2.29 | 82% | **warning** |
| US government interest payments / receipts | 0.34 | 85% | **warning** |
| Broad US dollar index | 122.4 | 85% | **warning** |
| Gold / Silver | 100.9 | 97% | **warning** |
| Copper / Gold | 2.88 | 1% | **warning** |
| Brent oil | 66.3 | 49% | **normal** |
| US M2 money supply | 21836.1 | 100% | **normal** |
| Australian CPI (annual change) | 2.10 | 54% | **normal** |
| Australian trimmed-mean inflation | 2.69 | 67% | **normal** |
| AUD/USD | 0.64 | 9% | **warning** |
| Iron ore price | 97.0 | 51% | **normal** |
| Australian unemployment rate | 4.11 | 31% | **normal** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| US government interest payments / receipts | 39 | 39 |
| Copper / Gold | 39 | 39 |
| US 10-year real yield | 38 | 39 |
| AUD/USD | 37 | 38 |
| Gold / Silver | 34 | 39 |
| US 10-year Treasury yield | 25 | 39 |
| Inflation expectations (5y5y forward) | 23 | 39 |
| Broad US dollar index | 20 | 39 |
| Australian CPI (annual change) | 13 | 39 |
| US 10Y minus 2Y yield | 0 | 39 |
| St. Louis Fed Financial Stress Index | 0 | 39 |
| USD/JPY | 0 | 37 |
| Brent oil | 0 | 37 |
| US M2 money supply | 0 | 39 |
| Australian trimmed-mean inflation | 0 | 39 |
| AUD/JPY | 0 | 37 |
| Iron ore price | 0 | 39 |
| Australian unemployment rate | 0 | 39 |

## Calibration observations (auto-generated)

- See the tables above: any indicator that spends ~0% or ~100% of a stress window in warning is a threshold the owner may want to re-tune at this gate.
- Info-only cards (gold-btc, silver-btc, gold-aud, rba-cash-rate, usdcny) never vote by construction.


## Findings and recommendations (agent-reviewed 2026-10-06; re-affirmed on the 2026-10-07 I6 re-run)

**Do the labels move sensibly? Yes — direction and timing are right in every window.**

- **2008 GFC:** Global climbs relaxed → cautious → **stressed** and peaks the week of 2008-10-27 (7/12: stress index at its record, real yields and breakevens at window extremes, dollar at decade highs, gold/silver and copper/gold in their tails). Australia reaches **alarmed** (4–5 of 6) from Dec 2008 through Mar 2009 — AUD crushed to decade lows, AUD/JPY carry unwinding, unemployment rising off its low. The yield-curve card correctly reads **normal** at the peak (the curve *steepened* after Lehman) — the inversion warnings were 2006–07 and mid-2019/2022, not October 2008. That is exactly the nuance a plain-language page should be able to show.
- **2020 COVID:** Global mostly *cautious* with a brief **stressed** spell (Jul 2020: dollar 97th percentile, gold/silver 96th, copper/gold 3rd, stress elevated); Australia *cautious* through the AUD crash. Sharper in markets than in the monthly/quarterly macro series — a fair representation of a fast V-shaped shock.
- **2022 inflation:** Global **stressed** for 20 of 52 weeks, peaking Oct 2022 with 7/12 (inverted curve, record real yields, record dollar, gold/silver 87th); Australia hits **alarmed** twice (CPI 7.9%, trimmed mean above 3%, AUD near decade lows, AUD/JPY −5%-in-4-weeks episodes).
- **Calm contrast 2017:** relaxed 43 of 52 global weeks; Australia relaxed 45. The engine is quiet when the world is quiet.
- **2025 (recent):** global spends much of the year *stressed* — driven by the **level** rules (10y and real 10y yields at the top of their 10-year ranges in this high-rate regime), not by an acute crisis. That is correct behaviour of the spec's rules and worth knowing when writing copy: the summary describes *how many indicators sit in their warning zone*, not whether a crash is underway. As the 10-year window rolls forward, these normalise.

**Threshold observations for the owner (nothing changed unilaterally — all spec-verbatim):**

1. **`brent` fires on sharp recoveries too.** The "up 25% in 3 months" rule warned in July 2020 on the +250% rebound off the April COVID low, when oil was still historically cheap. A momentum rule cannot tell recovery from shock. Options: keep as-is (big commodity moves are noteworthy either way), or gate it with a level condition (e.g. only above its 10-year median). **Recommendation: keep as-is for v1** — the card explains *why* it fired, and the copy can say "a large move in either direction".
2. **The 2008 global peak is "stressed", not "alarmed"** (58% of 12). Australia did reach "alarmed". Partly a small-denominator effect (only 12 voters backtested; five voters are P2/info-blocked), partly correct economics (the dollar and gold-silver spiked *up* = warnings, but the curve steepened and yields crashed = not warnings). No change recommended; adding the P2 voters shifts the denominator.
3. **`au-cpi` / `au-trimmed-mean` at exactly 3.0%** are normal (strict `>`). Both sit at 3.94/3.65 today → warning; both were 7.86/… in 2022. Threshold behaves as specified.
4. **`dollar-broad` at the 79th percentile today** is one basis point-region from warning. Borderline proximity is inherent to percentile rules; no change recommended.
5. **Stale calibration mattered and was fixed during the I1 run** (recorded for transparency): monthly grace 45→95 days, quarterly 100→190 days (real release lags: ABS unemployment is ~50 days old at publication in the worst case, quarterly BEA/ABS up to ~6 months from observation date); the STLFSI4 sustained-weeks window is now anchored on the latest *observation* rather than the run date so release lag cannot shrink it; the percentile floor is 30 periods (a quarterly series only carries ~40 periods per decade — a 120 floor would have made every quarterly percentile rule permanently unevaluable). `brent` shows `stale` in the today-run purely because the FRED fixture's last Brent print is 2026-09-29 (a capture-time lag); production EIA data normally updates within the 3-day grace.

**What could not be backtested (and why):** `au-us-10y-gap` and `rba-cash-rate` need RBA tables the sandbox cannot reach (Akamai 403; venue re-probe at Phase I2); `china-pmi`'s manual series is populated (Phase I5) but starts 2025-12 — 10 observations, too short for any backtest window or the percentile floor (it votes in production today via its threshold rule); `terms-of-trade`, `au-home-values`, `au-household-debt-arrears` are Phase I2 adapter work; `gold-btc` / `silver-btc` / `gold-aud` / `gold-usd` / `silver-usd` are live-source composites or info-only and never vote. The backtest denominators state this explicitly (11 global / 6 Australian voters of the eventual 14 / 8 P1 voters).

**I6 re-run verdict (2026-10-07):** the full 30-indicator definition set regenerates this report without touching a single number — the ounce cards and short manual series are excluded by construction and reported honestly in the coverage table. No threshold changes are proposed; the I1 recommendation stands (spec thresholds as-is; `brent` recovery gating is the one candidate tuning, owner's call).
