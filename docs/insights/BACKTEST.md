# Insights backtest — Phase I1

Generated 2026-10-08 by `pnpm --filter @currena/insights backtest` from the recorded fixtures (`packages/insights/fixtures/`, captured 2026-10-06 — see the fixtures README). No live sites are touched. Thresholds are the spec starting points from `01-indicator-spec.md`; nothing here changes them — this report is the evidence the owner reviews at the Gate I1 exit.

## Method

- Engine: `@currena/insights` scoring (rule evaluation, percentiles, stale handling) — identical code path to the future ingestion runner.
- Frozen clock: each weekly run passes its own date; nothing reads the wall clock.
- Percentile: share of the last 10 years’ readings strictly below the current one; minimum 120 base observations before a percentile exists.
- Labels (I15): each gauge's share of members in alert maps to steps 1–4 (0, ≤⅓, ≤⅔, >⅔); a region's verdict = rounded average of its gauges' steps, escalated to ≥3 when any gauge sits at step 4. The four label words are unchanged: Relaxed · Cautious · Stressed · Alarmed; no readable gauges → no label.
- Stale exclusion: per-series `staleAfterDays` override first (I15: Brent 12d, NFCI 14d, ECB 7d, Fed 5d, ABS CPI items 70d, WPI 130d), else the cadence grace (daily 3d, weekly 16d, monthly 95d, quarterly 190d, per-change never).
- Windows: weekly Mondays across the 2008 GFC, 2020 COVID and 2022 inflation shocks, plus 2017 and 2025 as calm contrast.

## Coverage

| Indicator | Phase | Series (fixture) | Span | Obs | In backtest |
|---|---|---|---|---|---|
| `yield-curve-10y2y` | P1 | FRED (T10Y2Y) | 2004-01-02 → 2026-10-05 | 5694 | yes |
| `real-yield-10y` | P1 | FRED (DFII10) | 2004-01-02 → 2026-10-02 | 5693 | yes |
| `us10y` | P1 | FRED (DGS10) | 2004-01-02 → 2026-10-02 | 5693 | yes |
| `fed-target` | P1 | FRED (DFEDTARL/U midpoint) | 2008-12-16 → 2026-10-07 | 6505 | yes |
| `ecb-dfr` | P1 | ECB Data Portal (DFR) | 2015-01-01 → 2016-03-11 | 34 | yes |
| `govt-interest-revenue` | P2 | FRED (A091RC1Q027SBEA ÷ W006RC1Q027SBEA) | 1947-01-01 → 2026-04-01 | 318 | yes |
| `us-cpi-yoy` | P1 | FRED (CPIAUCSL, 12-month change) | 1948-01-01 → 2026-08-01 | 943 | yes |
| `breakeven-5y5y` | P2 | FRED (T5YIFR) | 2004-01-02 → 2026-10-05 | 5694 | yes |
| `stress-stlfsi` | P1 | FRED (STLFSI4) | 1993-12-31 → 2026-09-25 | 1709 | yes |
| `nfci` | P1 | FRED (NFCI) | 1971-01-08 → 2026-10-02 | 2909 | yes |
| `gold-silver` | P1 | World Bank Pink Sheet (gold ÷ silver) | 2004-01-01 → 2026-09-01 | 273 | yes |
| `dollar-basket` | P1 | Currena basket (Frankfurter fixture) | 2016-01-04 → 2026-10-07 | 2756 | yes |
| `usdjpy` | P1 | Frankfurter (ECB) | 2003-12-31 → 2026-10-05 | 5830 | yes |
| `eur-usd` | P2 | — | — | — | no — info-only context card in the dollar lane; never votes |
| `china-pmi` | P2 | — | — | — | no — manual series (data/manual/china-pmi.json) populated since Phase I5 but starts 2025-12 — 10 observations, too short for any backtest window or the percentile floor; votes in production (threshold < 50) once history accrues |
| `m2-us` | P2 | FRED (M2SL) | 1959-01-01 → 2026-08-01 | 812 | yes |
| `copper-gold` | P2 | World Bank Pink Sheet (copper ÷ gold) | 2004-01-01 → 2026-09-01 | 273 | yes |
| `usdcny` | P2 | Frankfurter (ECB) | 2003-12-31 → 2026-10-05 | 5830 | yes |
| `brent` | P2 | FRED (DCOILBRENTEU) | 2004-01-06 → 2026-09-29 | 5670 | yes |
| `gold-usd` | P1 | — | — | — | no — info-only: live gold-api XAU point over World Bank monthly backfill — never votes (prices-board row) |
| `silver-usd` | P1 | — | — | — | no — info-only: live gold-api XAG point over World Bank monthly backfill — never votes (prices-board row) |
| `copper-usd` | P2 | — | — | — | no — info-only: live gold-api HG point over World Bank monthly backfill — never votes (prices-board row) |
| `btc-usd` | P1 | — | — | — | no — info-only: live gold-api BTC point, no 10y history by design — never votes (prices-board row) |
| `gold-btc` | P2 | — | — | — | no — context-only ratio under the Bitcoin price row (PB2); never votes |
| `silver-btc` | P2 | — | — | — | no — context-only ratio under the Bitcoin price row (PB2); never votes |
| `au-cpi` | P1 | ABS (CPI All groups) | 2005-01-01 → 2026-04-01 | 86 | yes |
| `au-trimmed-mean` | P1 | ABS (CPI_Q Trimmed Mean) | 2005-01-01 → 2026-04-01 | 86 | yes |
| `au-us-10y-gap` | P1 | — | — | — | no — RBA F2 unreachable from the sandbox — pending the Phase I2 venue re-probe |
| `rba-cash-rate` | P1 | — | — | — | no — rba.gov.au Akamai-blocked from the sandbox (03-data-sources.md); info-only, never votes |
| `au-petrol-yoy` | P2 | — | — | — | no — info-only context card (ABS monthly CPI Automotive fuel — no recorded fixture yet); never votes |
| `au-home-loan` | P1 | RBA F6 (FLRHOOTA) | 2019-07-31 → 2026-08-31 | 86 | yes |
| `au-wage-growth` | P1 | — | — | — | no — ABS WPI fixture not recorded + below-aux needs the au-cpi yoy pairing — votes in production from the live adapters |
| `au-rent-yoy` | P1 | — | — | — | no — ABS monthly CPI Rents fixture not recorded — votes in production from the live adapter |
| `au-unemployment` | P1 | ABS (Labour Force) | 2004-01-01 → 2026-08-01 | 272 | yes |
| `au-home-values` | P2 | — | — | — | no — ABS RES_DWELL_ST fixture not recorded (P2 indicator); votes in production from the live adapter |
| `au-household-debt-arrears` | P2 | — | — | — | no — RBA E2 fixture not recorded (P2 indicator); votes in production from the live adapter |
| `audusd` | P1 | Frankfurter (ECB) | 2003-12-31 → 2026-10-05 | 5830 | yes |
| `audjpy` | P1 | Frankfurter (ECB) | 2003-12-31 → 2026-10-05 | 5830 | yes |
| `terms-of-trade` | P2 | — | — | — | no — ABS ANA_AGG fixture not recorded (P2 indicator); votes in production from the live adapter |
| `iron-ore` | P2 | World Bank Pink Sheet (iron ore) | 2004-01-01 → 2026-09-01 | 273 | yes |
| `gold-aud` | P1 | — | — | — | no — composed from live gold-api XAU + Frankfurter AUD; info-only, never votes |

Not-backtested items are info-only (never vote) or P2 indicators whose adapters are Phase I2 work; their absence changes vote denominators, which the per-window tables below state explicitly.

## "Today" run (latest fixture data, 2026-10-05)

- **Global:** stressed — 3 of 12 voting indicators in warning (3 excluded).
- **Australia:** stressed — 4 of 7 in warning (0 excluded).

| Indicator | Value | As of | 10y percentile | 7d | 30d | Status |
|---|---|---|---|---|---|---|
| US 10Y minus 2Y yield | 0.47 | 2026-10-05 | 55% | 0.1 | 0.1 | normal |
| US 10-year real yield | 2.92 | 2026-10-02 | 100% | 0.1 | 0.5 | warning |
| US 10-year Treasury yield | 5.28 | 2026-10-02 | 100% | 0.1 | 0.5 | warning |
| Federal funds target rate (midpoint) | 3.88 | 2026-10-05 | 68% | 0.0 | 0.3 | normal |
| ECB deposit facility rate | -0.30 | 2016-03-11 | — | — | 0.0 | stale |
| US government interest payments / receipts | 0.34 | 2026-04-01 | 73% | — | — | normal |
| US inflation (yearly) | 3.35 | 2026-08-01 | 72% | — | 1.5 | stale |
| Inflation expectations (5y5y forward) | 2.36 | 2026-10-05 | 91% | 0.0 | 0.0 | warning |
| St. Louis Fed Financial Stress Index | -0.81 | 2026-09-25 | 7% | -0.1 | 0.0 | normal |
| Chicago Fed National Financial Conditions Index | -0.49 | 2026-10-02 | 53% | 0.0 | 0.1 | normal |
| Gold / Silver | 66.9 | 2026-09-01 | 6% | — | -0.6 | stale |
| Currena dollar basket | 102.2 | 2026-10-05 | 74% | 1.1 | 3.2 | normal |
| USD/JPY | 158.2 | 2026-10-05 | 95% | 0.9 | 1.3 | normal |
| US M2 money supply | 23342.8 | 2026-08-01 | 100% | — | 0.5 | normal |
| Copper / Gold | 3.35 | 2026-09-01 | 21% | — | 0.1 | normal |
| USD/CNY | 6.70 | 2026-10-05 | 27% | -0.1 | -0.1 | context |
| Brent oil | 114.0 | 2026-09-29 | 97% | -0.8 | 27.0 | warning |
| Australian CPI (annual change) | 3.94 | 2026-04-01 | 76% | — | — | warning |
| Australian trimmed-mean inflation | 3.65 | 2026-04-01 | 73% | — | — | warning |
| Home-loan rate people actually pay | 6.21 | 2026-08-31 | 98% | — | 0.0 | warning |
| Australian unemployment rate | 4.65 | 2026-08-01 | 50% | — | 0.2 | warning |
| AUD/USD | 0.70 | 2026-10-05 | 47% | -0.9 | -3.4 | normal |
| AUD/JPY | 110.1 | 2026-10-05 | 94% | -0.1 | -2.2 | normal |
| Iron ore price | 97.7 | 2026-09-01 | 42% | — | 1.5 | normal |

## Global financial crisis (Jul 2007 – Jun 2009)

Weeks: 105. Global label distribution: relaxed ×8, stressed ×93, cautious ×4. Australia: relaxed ×13, cautious ×14, stressed ×75, alarmed ×3.

Peak global week: **2008-10-27** — stressed (7/11 in warning). Peak Australia week: **2008-12-01** — alarmed (5/6).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2007-07-30 | relaxed | 1/11 | relaxed | 0/6 |
| 2007-08-27 | stressed | 2/11 | relaxed | 0/6 |
| 2007-10-29 | stressed | 3/11 | cautious | 1/6 |
| 2007-11-26 | stressed | 4/11 | cautious | 2/6 |
| 2007-12-31 | stressed | 3/11 | cautious | 1/6 |
| 2008-01-28 | stressed | 3/11 | stressed | 2/6 |
| 2008-02-25 | stressed | 3/11 | stressed | 2/6 |
| 2008-03-31 | stressed | 3/11 | stressed | 3/6 |
| 2008-04-28 | stressed | 3/11 | stressed | 2/6 |
| 2008-05-26 | stressed | 4/11 | stressed | 2/6 |
| 2008-06-30 | stressed | 3/11 | stressed | 2/6 |
| 2008-07-28 | stressed | 3/11 | stressed | 2/6 |
| 2008-08-25 | stressed | 3/11 | stressed | 3/6 |
| 2008-09-29 | stressed | 3/11 | stressed | 3/6 |
| 2008-10-27 | stressed | 7/11 | stressed | 4/6 |
| 2008-12-29 | stressed | 3/11 | stressed | 4/6 |
| 2009-01-26 | stressed | 5/12 | stressed | 4/6 |
| 2009-03-30 | stressed | 4/12 | stressed | 4/6 |
| 2009-04-27 | stressed | 4/12 | stressed | 4/6 |
| 2009-05-25 | stressed | 5/12 | stressed | 2/6 |
| 2009-06-29 | stressed | 4/12 | stressed | 2/6 |

Voting indicators at the peak global week (2008-10-27):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | 2.20 | 92% | **normal** |
| US 10-year real yield | 3.02 | 100% | **warning** |
| US 10-year Treasury yield | 3.79 | 9% | **normal** |
| US government interest payments / receipts | 0.27 | 69% | **normal** |
| US inflation (yearly) | 3.73 | 83% | **warning** |
| Inflation expectations (5y5y forward) | 2.64 | 96% | **warning** |
| St. Louis Fed Financial Stress Index | 8.12 | 100% | **warning** |
| Chicago Fed National Financial Conditions Index | 2.68 | 100% | **warning** |
| USD/JPY | 92.9 | 0% | **warning** |
| US M2 money supply | 7976.3 | 100% | **normal** |
| Copper / Gold | 6.10 | 2% | **warning** |
| Brent oil | 59.3 | 43% | **normal** |
| Australian CPI (annual change) | 3.67 | — | **warning** |
| Australian trimmed-mean inflation | 4.31 | — | **warning** |
| Australian unemployment rate | 4.29 | 21% | **normal** |
| AUD/USD | 0.61 | 0% | **warning** |
| AUD/JPY | 56.8 | 0% | **warning** |
| Iron ore price | 88.7 | 68% | **normal** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| St. Louis Fed Financial Stress Index | 97 | 105 |
| Chicago Fed National Financial Conditions Index | 96 | 105 |
| Australian trimmed-mean inflation | 92 | 105 |
| US inflation (yearly) | 57 | 105 |
| Gold / Silver | 6 | 12 |
| Australian CPI (annual change) | 52 | 105 |
| Copper / Gold | 39 | 105 |
| Australian unemployment rate | 31 | 105 |
| AUD/JPY | 28 | 101 |
| AUD/USD | 28 | 103 |
| US government interest payments / receipts | 26 | 105 |
| Brent oil | 25 | 104 |
| US 10-year real yield | 18 | 105 |
| Inflation expectations (5y5y forward) | 12 | 105 |
| USD/JPY | 11 | 101 |
| US 10-year Treasury yield | 10 | 105 |
| Iron ore price | 9 | 105 |
| US 10Y minus 2Y yield | 0 | 105 |
| US M2 money supply | 0 | 105 |
| Federal funds target rate (midpoint) | 0 | 24 |

## COVID shock (Jan – Dec 2020)

Weeks: 52. Global label distribution: relaxed ×34, cautious ×10, stressed ×8. Australia: relaxed ×9, cautious ×4, stressed ×39.

Peak global week: **2020-04-13** — stressed (4/12 in warning). Peak Australia week: **2020-05-11** — stressed (2/5).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2020-01-27 | relaxed | 1/13 | relaxed | 1/6 |
| 2020-03-30 | stressed | 3/13 | cautious | 2/6 |
| 2020-04-27 | stressed | 3/13 | stressed | 2/6 |
| 2020-05-25 | cautious | 2/13 | stressed | 2/6 |
| 2020-06-29 | relaxed | 1/13 | stressed | 2/6 |
| 2020-07-27 | relaxed | 1/13 | stressed | 2/6 |
| 2020-08-31 | relaxed | 1/13 | stressed | 1/6 |
| 2020-09-28 | relaxed | 1/13 | stressed | 2/6 |
| 2020-10-26 | relaxed | 1/13 | stressed | 2/6 |
| 2020-11-30 | relaxed | 1/13 | stressed | 1/6 |
| 2020-12-28 | relaxed | 0/13 | stressed | 1/6 |

Voting indicators at the peak global week (2020-04-13):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | 0.51 | 20% | **normal** |
| US 10-year real yield | -0.50 | 8% | **normal** |
| US 10-year Treasury yield | 0.76 | 0% | **normal** |
| Federal funds target rate (midpoint) | 0.13 | 0% | **normal** |
| US government interest payments / receipts | 0.26 | 62% | **normal** |
| US inflation (yearly) | 0.31 | 8% | **normal** |
| Inflation expectations (5y5y forward) | 1.58 | 3% | **normal** |
| St. Louis Fed Financial Stress Index | 2.63 | 99% | **warning** |
| Chicago Fed National Financial Conditions Index | 0.29 | 100% | **warning** |
| Currena dollar basket | 100.1 | 91% | **warning** |
| US M2 money supply | 17064.0 | 100% | **normal** |
| Copper / Gold | 3.01 | 0% | **warning** |
| Brent oil | 20.2 | 0% | **normal** |
| Australian CPI (annual change) | -0.33 | 0% | **normal** |
| Australian trimmed-mean inflation | 1.26 | 0% | **normal** |
| Australian unemployment rate | 6.31 | 98% | **warning** |
| Iron ore price | 84.7 | 43% | **normal** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| Copper / Gold | 48 | 52 |
| Australian unemployment rate | 39 | 52 |
| AUD/USD | 35 | 51 |
| Gold / Silver | 3 | 5 |
| St. Louis Fed Financial Stress Index | 14 | 52 |
| Brent oil | 12 | 51 |
| Chicago Fed National Financial Conditions Index | 8 | 52 |
| Currena dollar basket | 5 | 52 |
| AUD/JPY | 4 | 50 |
| USD/JPY | 1 | 50 |
| US 10Y minus 2Y yield | 0 | 52 |
| US 10-year real yield | 0 | 52 |
| US 10-year Treasury yield | 0 | 52 |
| Federal funds target rate (midpoint) | 0 | 52 |
| US government interest payments / receipts | 0 | 52 |
| US inflation (yearly) | 0 | 52 |
| Inflation expectations (5y5y forward) | 0 | 52 |
| US M2 money supply | 0 | 52 |
| Australian CPI (annual change) | 0 | 52 |
| Australian trimmed-mean inflation | 0 | 52 |
| Iron ore price | 0 | 52 |

## Inflation shock (Jan – Dec 2022)

Weeks: 52. Global label distribution: relaxed ×12, cautious ×16, stressed ×24. Australia: stressed ×52.

Peak global week: **2022-10-17** — stressed (8/13 in warning). Peak Australia week: **2022-10-10** — stressed (5/7).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2022-01-31 | relaxed | 1/13 | stressed | 3/7 |
| 2022-02-28 | relaxed | 1/13 | stressed | 2/7 |
| 2022-03-28 | cautious | 2/13 | stressed | 2/7 |
| 2022-04-25 | stressed | 3/13 | stressed | 2/7 |
| 2022-05-30 | cautious | 3/13 | stressed | 2/7 |
| 2022-06-27 | cautious | 4/13 | stressed | 3/7 |
| 2022-07-25 | cautious | 3/13 | stressed | 3/7 |
| 2022-08-29 | stressed | 6/13 | stressed | 3/7 |
| 2022-09-26 | stressed | 6/13 | stressed | 4/7 |
| 2022-10-31 | stressed | 6/13 | stressed | 4/7 |
| 2022-11-28 | stressed | 8/13 | stressed | 4/7 |
| 2022-12-26 | stressed | 7/13 | stressed | 4/7 |

Voting indicators at the peak global week (2022-10-17):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | -0.43 | 0% | **warning** |
| US 10-year real yield | 1.57 | 100% | **warning** |
| US 10-year Treasury yield | 4.02 | 100% | **warning** |
| Federal funds target rate (midpoint) | 3.13 | 99% | **warning** |
| US government interest payments / receipts | 0.25 | 77% | **normal** |
| US inflation (yearly) | 7.76 | 93% | **warning** |
| Inflation expectations (5y5y forward) | 2.42 | 81% | **warning** |
| St. Louis Fed Financial Stress Index | 0.28 | 88% | **warning** |
| Chicago Fed National Financial Conditions Index | -0.10 | 98% | **normal** |
| Currena dollar basket | 113.0 | 100% | **warning** |
| USD/JPY | 148.9 | 100% | **normal** |
| US M2 money supply | 21464.2 | 92% | **normal** |
| Copper / Gold | 4.60 | 35% | **normal** |
| Brent oil | 91.0 | 74% | **normal** |
| Australian CPI (annual change) | 7.86 | 100% | **warning** |
| Australian trimmed-mean inflation | 6.76 | 100% | **warning** |
| Home-loan rate people actually pay | 4.04 | 100% | **warning** |
| Australian unemployment rate | 3.43 | 0% | **normal** |
| AUD/USD | 0.62 | 1% | **warning** |
| AUD/JPY | 93.0 | 79% | **normal** |
| Iron ore price | 92.6 | 50% | **normal** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| US inflation (yearly) | 52 | 52 |
| Australian CPI (annual change) | 52 | 52 |
| Australian trimmed-mean inflation | 52 | 52 |
| Gold / Silver | 3 | 4 |
| Currena dollar basket | 38 | 52 |
| AUD/USD | 37 | 51 |
| US 10-year Treasury yield | 34 | 52 |
| US 10Y minus 2Y yield | 26 | 52 |
| Federal funds target rate (midpoint) | 22 | 52 |
| US 10-year real yield | 21 | 52 |
| Home-loan rate people actually pay | 17 | 48 |
| Brent oil | 7 | 51 |
| Inflation expectations (5y5y forward) | 7 | 52 |
| US M2 money supply | 6 | 52 |
| St. Louis Fed Financial Stress Index | 5 | 52 |
| USD/JPY | 3 | 50 |
| AUD/JPY | 1 | 50 |
| US government interest payments / receipts | 0 | 52 |
| Chicago Fed National Financial Conditions Index | 0 | 52 |
| Copper / Gold | 0 | 52 |
| Australian unemployment rate | 0 | 52 |
| Iron ore price | 0 | 52 |

## Calm contrast (2017)

Weeks: 52. Global label distribution: cautious ×17, relaxed ×35. Australia: relaxed ×45, cautious ×6, stressed ×1.

Peak global week: **2017-05-01** — cautious (3/14 in warning). Peak Australia week: **2017-05-15** — stressed (2/5).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2017-01-30 | relaxed | 1/13 | relaxed | 1/6 |
| 2017-02-27 | relaxed | 1/13 | relaxed | 0/6 |
| 2017-03-27 | relaxed | 1/13 | relaxed | 0/6 |
| 2017-05-29 | cautious | 2/13 | cautious | 2/6 |
| 2017-06-26 | cautious | 2/13 | relaxed | 1/6 |
| 2017-07-31 | relaxed | 1/13 | relaxed | 0/6 |
| 2017-08-28 | relaxed | 1/13 | relaxed | 0/6 |
| 2017-09-25 | relaxed | 1/13 | relaxed | 0/6 |
| 2017-10-30 | relaxed | 1/13 | relaxed | 1/6 |
| 2017-11-27 | relaxed | 1/13 | relaxed | 0/6 |
| 2017-12-25 | relaxed | 1/13 | relaxed | 0/6 |

Voting indicators at the peak global week (2017-05-01):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | 1.05 | 14% | **normal** |
| US 10-year real yield | 0.41 | 35% | **normal** |
| US 10-year Treasury yield | 2.33 | 39% | **normal** |
| Federal funds target rate (midpoint) | 0.88 | 98% | **warning** |
| US government interest payments / receipts | 0.24 | 36% | **normal** |
| US inflation (yearly) | 1.86 | 56% | **normal** |
| Inflation expectations (5y5y forward) | 2.04 | 21% | **normal** |
| St. Louis Fed Financial Stress Index | -0.58 | 11% | **normal** |
| Chicago Fed National Financial Conditions Index | -0.51 | 35% | **normal** |
| Gold / Silver | 74.6 | 88% | **warning** |
| Currena dollar basket | 98.8 | 60% | **normal** |
| USD/JPY | 111.4 | 77% | **normal** |
| US M2 money supply | 13567.4 | 100% | **normal** |
| Copper / Gold | 4.49 | 18% | **warning** |
| Brent oil | 50.4 | 18% | **normal** |
| Australian CPI (annual change) | 1.90 | 36% | **normal** |
| Australian trimmed-mean inflation | 1.68 | 8% | **normal** |
| Australian unemployment rate | 5.55 | 51% | **normal** |
| AUD/USD | 0.75 | 16% | **warning** |
| AUD/JPY | 83.2 | 40% | **normal** |
| Iron ore price | 62.4 | 17% | **warning** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| Federal funds target rate (midpoint) | 52 | 52 |
| Gold / Silver | 3 | 5 |
| AUD/USD | 19 | 51 |
| Iron ore price | 14 | 52 |
| Copper / Gold | 13 | 52 |
| Currena dollar basket | 4 | 52 |
| Brent oil | 3 | 52 |
| US 10Y minus 2Y yield | 0 | 52 |
| US 10-year real yield | 0 | 52 |
| US 10-year Treasury yield | 0 | 52 |
| US government interest payments / receipts | 0 | 52 |
| US inflation (yearly) | 0 | 52 |
| Inflation expectations (5y5y forward) | 0 | 52 |
| St. Louis Fed Financial Stress Index | 0 | 52 |
| Chicago Fed National Financial Conditions Index | 0 | 52 |
| USD/JPY | 0 | 50 |
| US M2 money supply | 0 | 52 |
| Australian CPI (annual change) | 0 | 52 |
| Australian trimmed-mean inflation | 0 | 52 |
| Australian unemployment rate | 0 | 52 |
| AUD/JPY | 0 | 50 |

## Recent contrast (2025)

Weeks: 39. Global label distribution: stressed ×11, cautious ×28. Australia: cautious ×22, relaxed ×17.

Peak global week: **2025-02-03** — stressed (7/14 in warning). Peak Australia week: **2025-01-06** — cautious (2/7).

Month-end traces:

| Week of | Global | Votes | Australia | Votes |
|---|---|---|---|---|
| 2025-01-27 | stressed | 6/13 | cautious | 2/7 |
| 2025-03-31 | cautious | 3/13 | relaxed | 1/7 |
| 2025-04-28 | cautious | 3/13 | relaxed | 1/7 |
| 2025-05-26 | cautious | 4/13 | relaxed | 1/7 |
| 2025-06-30 | cautious | 3/13 | relaxed | 1/7 |
| 2025-07-28 | cautious | 5/13 | cautious | 2/7 |
| 2025-08-25 | cautious | 4/13 | cautious | 2/7 |
| 2025-09-29 | stressed | 5/13 | cautious | 2/7 |

Voting indicators at the peak global week (2025-02-03):

| Indicator | Value | 10y pct | Status |
|---|---|---|---|
| US 10Y minus 2Y yield | 0.28 | 42% | **normal** |
| US 10-year real yield | 2.09 | 95% | **warning** |
| US 10-year Treasury yield | 4.54 | 97% | **warning** |
| Federal funds target rate (midpoint) | 4.38 | 79% | **normal** |
| US government interest payments / receipts | 0.35 | 92% | **warning** |
| US inflation (yearly) | 2.80 | 62% | **normal** |
| Inflation expectations (5y5y forward) | 2.29 | 83% | **warning** |
| St. Louis Fed Financial Stress Index | -0.75 | 10% | **normal** |
| Chicago Fed National Financial Conditions Index | -0.51 | 42% | **normal** |
| Gold / Silver | 89.9 | 95% | **warning** |
| Currena dollar basket | 109.1 | 98% | **warning** |
| USD/JPY | 154.6 | 96% | **normal** |
| US M2 money supply | 21607.2 | 93% | **normal** |
| Copper / Gold | 3.22 | 2% | **warning** |
| Brent oil | 76.5 | 70% | **normal** |
| Australian CPI (annual change) | 2.40 | 62% | **normal** |
| Australian trimmed-mean inflation | 2.93 | 69% | **normal** |
| Home-loan rate people actually pay | 6.15 | 100% | **warning** |
| Australian unemployment rate | 4.08 | 25% | **normal** |
| AUD/USD | 0.62 | 1% | **warning** |
| AUD/JPY | 95.3 | 85% | **normal** |
| Iron ore price | 105.1 | 61% | **normal** |

Share of weeks each voting indicator spent in warning:

| Indicator | Weeks in warning | Voting weeks |
|---|---|---|
| US government interest payments / receipts | 39 | 39 |
| Copper / Gold | 39 | 39 |
| US 10-year real yield | 38 | 39 |
| AUD/USD | 37 | 38 |
| Gold / Silver | 3 | 4 |
| US 10-year Treasury yield | 25 | 39 |
| Inflation expectations (5y5y forward) | 23 | 39 |
| Australian CPI (annual change) | 13 | 39 |
| Currena dollar basket | 9 | 39 |
| Home-loan rate people actually pay | 8 | 39 |
| US inflation (yearly) | 5 | 39 |
| US 10Y minus 2Y yield | 0 | 39 |
| Federal funds target rate (midpoint) | 0 | 39 |
| St. Louis Fed Financial Stress Index | 0 | 39 |
| Chicago Fed National Financial Conditions Index | 0 | 39 |
| USD/JPY | 0 | 37 |
| US M2 money supply | 0 | 39 |
| Brent oil | 0 | 38 |
| Australian trimmed-mean inflation | 0 | 39 |
| Australian unemployment rate | 0 | 39 |
| AUD/JPY | 0 | 37 |
| Iron ore price | 0 | 39 |

## Calibration observations (auto-generated)

- See the tables above: any indicator that spends ~0% or ~100% of a stress window in warning is a threshold the owner may want to re-tune at this gate.
- Info-only/price rows (gold-usd, silver-usd, copper-usd, btc-usd, gold-btc, silver-btc, gold-aud, eur-usd, usdcny, rba-cash-rate, au-petrol-yoy) never vote by construction; Brent votes by rule but is not a gauge member (feeds the big-mover callout).

