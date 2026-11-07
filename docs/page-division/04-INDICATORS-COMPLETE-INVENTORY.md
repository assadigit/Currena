# Currena — The Complete Indicator Inventory

> **Phase 0 audit document** · generated 2026-11-07 from the source of truth
> (`packages/insights/` @ commit `41e7ccf`, `data/indicators.json` registry v4).
> Purpose: consolidate *every* indicator Currena currently fetches or computes —
> what it is, where it comes from, how it is fetched, how it is calculated.
> This document is the inventory baseline for the page-division project.

---

## Table of contents

1. [Executive summary — the numbers](#1-executive-summary)
2. [How an indicator is born — the pipeline](#2-how-an-indicator-is-born)
3. [The data-source registry — 32 providers](#3-the-data-source-registry)
4. [The complete 184-indicator registry (Global · 146)](#4-the-global-registry)
5. [The complete 184-indicator registry (Australia · 38)](#5-the-australia-registry)
6. [The boards beyond the registry](#6-the-boards-beyond-the-registry)
7. [Derived indicators — every formula](#7-derived-indicators--every-formula)
8. [The scheduling system — crons & rungs](#8-the-scheduling-system)
9. [The scoring engine — methods](#9-the-scoring-engine)
10. [Licence & display status](#10-licence--display-status)
11. [Gaps, disabled & blocked items](#11-gaps-disabled--blocked-items)

---

## 1. Executive summary

| What | Count | Notes |
|---|---|---|
| **Registry indicators** | **184** | `data/indicators.json` v4 — the Insights page inventory |
| — Global section | 146 | 8 voting gauges + 3 shadow gauges + prices board |
| — Australia section | 38 | 3 voting gauges + 2 shadow gauges |
| **Scored voters** (gauge verdicts) | 54 | contribute to a question-gauge verdict |
| **Context cards** (rule: info) | 130 | live value + 10-year position bar, never vote |
| **Data providers** | 32 | FRED 57 · derived 28 · ABS 19 · GPR 11 · World Bank 7 · … (see §3) |
| **Boards beyond the registry** | 6 | FX (10 pairs) · World Markets (16 indexes) · AU Markets (19) · Prices live (4) · TIC (21 holders) · Companies (49, flag OFF) |
| **Gold-meter voters** | 37 | the separate 5-lane gold balance — see the companion doc `05-GOLD-INDICATORS.md` |
| Licence levels | L0 95 · L1 37 · L2 50 · L3 2 | public-domain → citation-required → owner-accepted → blocked |
| Cadences | daily 62 · monthly 85 · quarterly 18 · weekly 16 · per-change 3 | per-definition `staleAfterDays` overrides |

**Registry by gauge/group:**

| Group | Section | Members | Voters | Role |
|---|---|---|---|---|
| borrowing-costs | global | 30 | 10 | voting gauge — "Is borrowing getting costlier?" |
| prices-heat | global | 24 | 6 | voting gauge — "Is inflation heating up?" |
| market-stress | global | 41 | 7 | voting gauge — "Is the system under stress?" |
| dollar-strength | global | 9 | 5 | voting gauge — "Is the dollar strong?" |
| growth-health | global | 27 | 10 | voting gauge — "Is growth healthy?" |
| prices-board | global | 5 | 0 | the price strip (gold, silver, btc, brent, gold-btc) |
| geo-fragmentation | global | 8 | 0 | shadow gauge (context only) |
| dedollar-concentration | global | 2 | 0 | shadow gauge (context only) |
| au-inflation-rates | australia | 6 | 5 | voting gauge |
| au-households | australia | 11 | 7 | voting gauge |
| au-trade-currency | australia | 10 | 4 | voting gauge |
| au-activity | australia | 7 | 0 | shadow gauge (context only) |
| au-external | australia | 4 | 0 | shadow gauge (context only) |

---

## 2. How an indicator is born

Every registry indicator follows the same deterministic path
(`packages/insights/src/adapters/` → `ingest/` → KV → API → SPA):

```
1. FETCH      an adapter calls the provider (keyless, honest UA, single attempt,
              12–45 s timeout) — e.g. FRED fredgraph.csv bulk group
2. PARSE      a pure, fail-closed parser (CSV / SDMX / HTML / XLSX / PDF / ZIP)
              — any shape drift throws FormatChangedError, never silent zeros
3. VALIDATE   per-series sanity bands, date-regression holds, cross-checks
              (e.g. CFTC's own arithmetic identity, NBS headline vs table)
4. SCORE      the reading engine computes value, change7d/30d, percentile10y,
              sd10y (z-score), moveScore, fromPeak10y — over a 10-year window
              (min 30 observations)
5. RULE       the definition's rule atom votes (threshold / percentile / change /
              info…) — warning or normal; info cards never vote
6. STORE      one KV snapshot (`insights:snapshot`) + per-id history
              (`insights:hist:<id>`), write-only-if-changed, plus a public
              projection (`insights:snapshot-public`) with hidden ids removed
7. SERVE      GET /api/insights (merged with the hourly live-price overlay);
              the SPA renders cards, gauges, verdicts, history charts
```

**Fail-closed discipline:** no value, stale data, an exact repeat, an
out-of-band value or a failed validation → the card reads *Stale* /
*Can't tell* — never a fabricated verdict.

---

## 3. The data-source registry

**Every Insights source is keyless.** No API key, cookie or token is used
anywhere in the adapter layer (EODHD's token exists only on the separate
world-markets Worker). One honest fetch policy for all
(`adapters/fetch-policy.ts`): UA `CurrenaDashboard/1.0 (+https://github.com/assadigit/Currena)`,
single attempt, no retries, blocked-HTTP → fail closed.

| # | Provider id | Publisher | Endpoint(s) | Format | Licence | Serves (ids) |
|---|---|---|---|---|---|---|
| 1 | `fred` (57 ids) | Federal Reserve Bank of St. Louis | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=…` — single & multi-series bulk (7 main groups + 2 S3 groups; ZIP of per-frequency CSVs beyond 12 series) | CSV/ZIP | L0 public-domain / L2 copyright-per-series | T10Y2Y, T10Y3M, DGS10, DGS2, DGS30, DFII10, DFII5, DFEDTARL/U, SOFR, T5YIFR, T5YIE, T10YIE, STLFSI4, NFCI, DPCREDIT, DTWEXBGS, DTWEXEMEGS, VIXCLS, M2SL, CPIAUCNS, CPILFENS, PCEPILFE, AHETPI, UNRATE, SAHMREALTIME, PAYEMS, A191RL1Q225SBEA, GFDEGDQ188S, ICSA, RECPROUSM156N, UMCSENT, MICH, RSAFS, PERMIT, CFNAI, JTSJOL, GACDFSA066MSFRBPHI, GACDISA066MSFRBNY, A091RC1Q027SBEA, W006RC1Q027SBEA, DCOILBRENTEU, DCOILWTICO, DHHNGSP, IRLTLT01DEM/GBM/ITM/NZM156N, IRSTCI01JPM156N, THREEFYTP10, WTREGEN, RRPONTSYD, WRESBAL, IORB, GDPNOW, CCSA, MEDCPIM158SFRBCLE, STICKCPIM158SFRBATL, MTSDS133FMS, DRTSCILM, WALCL, WSEFINTL1, JPNASSETS |
| 2 | `derived` (28) | Currena's own arithmetic | computed at ingest from the fetched legs | — | inherits worst-of legs | fed-expectations, real-curve-10y5y, govt-interest-revenue, us-deficit-12m, us-nfp, repo-stress, net-liquidity, global-liquidity, breakeven-tilt, btp-bund-spread, us-japan-10y-gap, au-us-10y-gap, rba-expectations, rba-fed-gap, dollar-basket, gold-silver, gold-btc, gold-aud, gold-oil-ratio, gold-platinum, real-gold-price, shanghai-gold-premium, cpi-surprise, audusd, audjpy, audnzd, copper-gold, usd… crosses |
| 3 | `abs` (19) | Australian Bureau of Statistics | `https://data.api.abs.gov.au/rest/data/{flow-key}?format=csv` (SDMX wide CSV, keyless) | SDMX CSV | L0 | au-cpi, au-trimmed-mean, au-rent-yoy, au-petrol-yoy, au-unemployment, au-participation, au-underemployment, au-wage-growth, au-home-values, au-housing-finance, au-saving-ratio, au-job-vacancies, terms-of-trade, au-gdp-growth, au-trade-balance, au-household-spending, au-building-approvals, au-population-growth, au-nom |
| 4 | `gpr` (11) | Caldara–Iacoviello GPR index | `https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls` (monthly) + `data_gpr_daily_recent.xls` (daily) | legacy XLS (BIFF) | L0 academic | gpr-index, gpr-threats, gpr-acts, gpr-daily, gpr-taiwan, gpr-china, gpr-russia, gpr-ukraine, gpr-israel, gpr-saudi, gpr-australia |
| 5 | `world-bank` (7) | World Bank Pink Sheet | link discovery on `https://www.worldbank.org/en/research/commodity-markets` → `CMO-Historical-Data-Monthly.xlsx` | XLSX | L1 CC-BY | brent history, wti, natgas, gas-europe, lng-japan, coal-aus, iron-ore, food-index, wheat, maize + gold/silver/copper/platinum decade bases |
| 6 | `portwatch` (5) | IMF PortWatch | `https://services9.arcgis.com/…/Daily_Chokepoints_Data/FeatureServer/0/query` (ArcGIS JSON, paginated) | JSON | L0 | chokepoint-suez, -panama, -bab-el-mandeb, -malacca, -taiwan |
| 7 | `frankfurter` (5) | ECB reference rates via Frankfurter | `https://api.frankfurter.dev/v1/{start}..?from=USD&to=JPY,AUD,CNY,EUR,GBP,CAD,SEK,CHF,TRY,NZD` — ONE call for all | JSON | L1 | usdjpy, eur-usd, usdchf, usdtry, usdcny + the dollar-basket legs |
| 8 | `gold-api` (5) | gold-api.com | `https://api.gold-api.com/price/{SYMBOL}` — XAU, XAG, BTC, HG, XPT (one keyless request each) | JSON | L1 (commercial display permitted) | gold-usd, silver-usd, btc-usd, copper-usd, platinum |
| 9 | `rba` (5) | Reserve Bank of Australia | `https://www.rba.gov.au/statistics/tables/csv/{f1,f1.1,f2,f2.1,e2,f6,f4.1}-data.csv` + HTML cash-rate page | CSV + HTML | L0 | rba-cash-rate, au-10y, au-home-loan, au-deposit-rate, au-household-debt-arrears (+ rba-expectations/gap legs) |
| 10 | `fiscaldata` (4) | US Treasury FiscalData | `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query?…` (Node/GHA venue only — blocked from Worker egress) | JSON | L0 | treasury-auction-10y (+indirect), treasury-auction-30y (+indirect) |
| 11 | `oecd` (4) | OECD SDMX | `https://sdmx.oecd.org/public/rest/data/…DSD_STES@DF_CLI…` (CLI trio) + `DSD_STES@DF_FINMARK` (NZ short rate) | SDMX CSV | L1 | oecd-cli-us, oecd-cli-cn, oecd-cli-de, nz-short-rate |
| 12 | `nbs` (4) | China National Bureau of Statistics | English press releases: `https://www.stats.gov.cn/english/PressRelease/` (+ `index_1.html`) → release pages | HTML | L0 (NBS public) | china-pmi, china-cpi, china-property-investment, china-steel-output |
| 13 | `ecb` (3) | ECB Data Portal | `https://data-api.ecb.europa.eu/service/data/{key}?format=csvdata` — DFR, AAA 10Y, HICP, Eurosystem assets | SDMX CSV | L1 | ecb-dfr, euro-aaa-10y, euro-hicp (+ global-liquidity ECB leg) |
| 14 | `eia` (3) | US Energy Information Administration | keyless website routes: `https://www.eia.gov/dnav/pet/hist_xlS/{RWTCd,RBRTEd}.xls`, `…/hist/LeafHandler.ashx?n=PET&s={WCRSTUS1,WCSSTUS1,WCRFPUS2}&f=W` | XLS (BIFF) + HTML | L0 public domain | wti, brent (fallback), natgas (fallback), eia-crude-stocks, us-spr, us-crude-production |
| 15 | `cftc` (2) | CFTC Commitments of Traders | `https://www.cftc.gov/dea/newcot/deafut.txt` (weekly) + `…/history/deacot{year}.zip` archives | CSV | L0 | cftc-gold-positioning, cftc-gold-gross-long |
| 16 | `epu` (2) | Baker–Bloom–Davis EPU | `https://policyuncertainty.com/media/US_Policy_Uncertainty_Data.xlsx` + `Categorical_EPU_Data.xlsx` | XLSX | L1 academic | epu-us, tpu-us |
| 17 | `nyfed` (2) | Federal Reserve Bank of New York | `https://www.newyorkfed.org/medialibrary/…/Holston_Laubach_Williams_current_estimates.xlsx` (r*) + `…/gscpi/downloads/gscpi_data.xlsx` | XLSX/legacy-XLS | L0 | rstar-us, gscpi |
| 18 | `yahoo` (2) | Yahoo Finance chart API v8 | `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=10y&interval=1d` — GC=F, SI=F, BTC-USD, AED=X, RSP, SPY, GLD, BZ contracts | JSON | L2 owner-accepted | usdaed, sp500-breadth-ratio, gold-equities-ratio, + gold/silver/btc/brent history & live overlays |
| 19 | `shiller` (2) | Robert Shiller dataset | `https://shillerdata.com/` → `ie_data.xls` (monthly CAPE + ECY), mirrored to `data/shiller/shiller-cape.json` | XLS | L1 | shiller-cape, shiller-ecy |
| 20 | `wgc` (2) | World Gold Council | `https://www.gold.org/goldhub/data/…` (ETF holdings, CB purchases) | HTML | **L3 — prior written authorisation required; never fetched** | wgc-etf-holdings, wgc-cb-demand (both DISABLED) |
| 21 | `mof` (1) | Japan Ministry of Finance | `https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv` (+ `historical/jgbcme_all.csv`) | CSV | L0 | jgb-10y |
| 22 | `boe` (1) | Bank of England | `https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp` | HTML | L0 | boe-rate |
| 23 | `alternative-me` (1) | Alternative.me | `https://api.alternative.me/fng/?limit=400` | JSON | L1 | crypto-fng |
| 24 | `frb` (1) | Federal Reserve Board | `https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv` | CSV | L0 | ebp |
| 25 | `ofr` (1) | Office of Financial Research | `https://www.financialresearch.gov/financial-stress-index/data/fsi.csv` | CSV | L0 | ofr-fsi |
| 26 | `pboc` (1) | People's Bank of China | `https://www.pbc.gov.cn/en/3688110/index.html` (English URL 404s — restructured venue) | HTML | L2 | official-gold-demand (DISABLED) |
| 27 | `cleveland` (1) | Federal Reserve Bank of Cleveland | `https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting` | HTML | L2 owner-accepted | cpi-nowcast, cpi-surprise (nowcast leg) |
| 28 | `sge` (1) | Shanghai Gold Exchange | daily `https://www.sge.com.cn/sjzx/quotation_daily_new?…` + monthly `https://en.sge.com.cn/data_MonthlyReport` → Data Highlights PDF | HTML + PDF | L2 © SGE | sge-gold-withdrawals, shanghai-gold-premium (SGE leg) |
| 29 | `bazg` (1) | Swiss customs (BAZG/FOCBS) | `https://ocean.bazg.admin.ch/open-data-reports/TN8_controlCode_Gold_IMP_en_v1/….csv` | CSV (;) | L1 | swiss-gold-flow |
| 30 | `fund-pages` (1) | ETF short-interest venues | FINRA/Nasdaq/NYSE short-interest tables | HTML | L2 | etf-short-interest (DISABLED — no licence-clean venue) |
| 31 | `uom` (1) | University of Michigan SIE | POST `https://data.sca.isr.umich.edu/data-archive/mine.php` (Table 33, CSV) | CSV | L1 CC-BY-NC-ND | michigan-5y-expectations |
| 32 | `imf` (1) | IMF COFER | `https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/COFER/7.0.1/*` (SDMX 3.0 JSON) | JSON | L1 | usd-reserve-share |
| — | `treasury` (fallback) | US Treasury | `https://home.treasury.gov/…/daily-treasury-rates.csv/{year}/all…` | CSV | L0 | us10y/us30y/us-2y/real-yield-10y fallback when FRED bulk fails |
| — | `bitstamp` (cross-check) | Bitstamp | `https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=86400` | JSON | L1 | BTC sanity cross-check (<3% drift) |

> **Fallback chains:** FRED→Treasury (yields) · FRED→EIA→Yahoo (oil/gas) ·
> RBA F2→F2.1 (AU 10y, venue-blocked CSV) · MOF→FRED OECD mirror (JGB) ·
> Frankfurter→Yahoo (FX, fires on failure or ≥5% day-move suspicion).

---

## 4. The global registry

### 4.1 borrowing-costs — "Is borrowing getting costlier?" (30 members · 10 voters)

| id | What it is | Source · series | Process / method | Cadence | Voter |
|---|---|---|---|---|---|
| `yield-curve-10y2y` | US 10Y−2Y Treasury spread | FRED T10Y2Y | fredgraph.csv daily bulk group; threshold < 0 | daily | ✓ |
| `yield-curve-10y3m` | US 10Y−3M spread (the Fed's watched leg) | FRED T10Y3M | same bulk; any-of: <0, <−0.5, or 4-week rise ≥1 pt | daily | ✓ |
| `real-yield-10y` | US 10-year real (TIPS) yield | FRED DFII10 | bulk group 2 (since 2003); percentile-high 20% rule; scoring input cross-filled DGS10−T10YIE when DFII10 gaps (≤5% of window) | daily | ✓ |
| `real-yield-5y` | US 5-year real yield (the belly) | FRED DFII5 | same group; percentile-high 20% | daily | ✓ |
| `real-curve-10y5y` | Real yield curve slope | derived DFII10−DFII5 | pure subtraction at ingest; rule: info (the sign question printed, never seated) | daily | – |
| `us10y` | US 10-year Treasury yield | FRED DGS10 (Treasury fallback) | bulk group 1 (full window); percentile-high 10% or 4-wk rise ≥0.5 | daily | ✓ |
| `us30y` | US 30-year Treasury yield | FRED DGS30 | same; percentile-high 10% | daily | ✓ |
| `fed-target` | Fed funds target corridor | FRED DFEDTARL + DFEDTARU | lower bound scored (post-2008 = midpoint −12.5 bp); corridor rendered | daily | ✓ |
| `fed-expectations` | 2-year yield minus policy midpoint | derived DGS2−(DFEDTARL+U)/2 | percentile-high 10% — markets pricing hikes/cuts | daily | ✓ |
| `ecb-dfr` | ECB deposit facility rate | ECB FM/D.U2.EUR.4F.KR.DFR.LEV | SDMX csvdata, full history; percentile rule | daily | ✓ |
| `govt-interest-revenue` | US interest ÷ receipts ×100 | derived A091RC1Q027SBEA ÷ W006RC1Q027SBEA | quarterly ratio; the fiscal-pressure seat | quarterly | ✓ |
| `us-2y` | US 2-year yield | FRED DGS2 | bulk; context card | daily | – |
| `sofr` | Secured Overnight Financing Rate | FRED SOFR | daily bulk; context | daily | – |
| `mortgage-30y` | 30-yr fixed mortgage average | FRED MORTGAGE30US | weekly (Thursday) batch; context | weekly | – |
| `euro-aaa-10y` | Euro AAA 10-year yield | ECB YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y | SDMX; context | daily | – |
| `bund-10y` | German 10-year (OECD mirror) | FRED IRLTLT01DEM156N | monthly OECD mirror; context | monthly | – |
| `gilt-10y` | UK 10-year (OECD mirror) | FRED IRLTLT01GBM156N | monthly; context | monthly | – |
| `jgb-10y` | Japan 10-year JGB | MOF jgbcme.csv 10Y column | daily CSV, header-asserted; FRED mirror as labelled outage fallback | daily | – |
| `boj-rate` | BOJ overnight call rate | FRED IRSTCI01JPM156N | monthly mirror; step series | monthly | – |
| `boe-rate` | Bank of England Bank Rate | BoE decision-table HTML | daily step series expanded from per-change decisions | per-change | – |
| `nyfed-custody` | Treasuries in foreign custody | FRED WSEFINTL1 | Wednesday level, weekly; context | weekly | – |
| `us-deficit-monthly` | Federal deficit, $M | FRED MTSDS133FMS | monthly; context card inside deficit-12m | monthly | – |
| `us-deficit-12m` | Rolling 12-month deficit | derived sum of MTSDS133FMS | pure rolling sum; context | monthly | – |
| `treasury-auction-10y` | 10-yr auction bid-to-cover | FiscalData auctions_query | JSON, client-side family filter (ex TIPS); per-auction | per-change | – |
| `treasury-auction-10y-indirect` | Indirect bidder share, 10-yr | same row ÷ total_accepted | derived %; companion card | per-change | – |
| `treasury-auction-30y` | 30-yr auction bid-to-cover | same | per-auction | per-change | – |
| `treasury-auction-30y-indirect` | Indirect share, 30-yr | same | companion card | per-change | – |
| `rstar-us` | Holston–Laubach–Williams r* | NY Fed HLW xlsx, sheet "HLW Estimates" col K | quarterly, dated at quarter start; context | quarterly | – |
| `debt-to-gdp` | Federal debt ÷ GDP | FRED GFDEGDQ188S | quarterly; context | quarterly | – |
| `btp-bund-spread` | Italy−Germany 10-year spread | derived IRLTLT01ITM−DEM | euro-area stress gauge; context | monthly | – |

### 4.2 prices-heat — "Is inflation heating up?" (24 members · 6 voters)

| id | What it is | Source · series | Process / method | Cadence | Voter |
|---|---|---|---|---|---|
| `us-cpi-yoy` | Headline CPI, 12-mo % | FRED CPIAUCNS | level computed from NSA index; percentile rule | monthly | ✓ |
| `us-cpi-core-yoy` | Core CPI, 12-mo % | FRED CPILFENS | same; context | monthly | – |
| `us-pce-core-yoy` | Core PCE, 12-mo % | FRED PCEPILFE | the Fed's gauge; percentile rule | monthly | ✓ |
| `median-cpi` | Cleveland Fed median CPI | FRED MEDCPIM158SFRBCLE | 12-mo %; context | monthly | – |
| `sticky-cpi` | Atlanta Fed sticky-price CPI | FRED STICKCPIM158SFRBATL | 12-mo %; context | monthly | – |
| `euro-hicp` | Euro-area HICP annual rate | ECB ICP/M.U2.N.000000.4D0.ANR | SDMX monthly; percentile rule | monthly | ✓ |
| `us-wages` | Avg hourly earnings, 12-mo % | FRED AHETPI | derived YoY; context | monthly | – |
| `t5yie` | 5-yr breakeven inflation | FRED T5YIE | daily; percentile rule | daily | ✓ |
| `breakeven-5y5y` | 5y5y forward breakeven | FRED T5YIFR | daily; percentile rule | daily | ✓ |
| `breakeven-10y` | 10-yr breakeven | FRED T10YIE | daily; context | daily | – |
| `breakeven-tilt` | T5YIFR−T5YIE (acceleration into yr 6–10) | derived | ±0.1 pt deadband: building/fading/steady | daily | ✓ (gold meter) |
| `cpi-nowcast` | Cleveland CPI MoM nowcast | Cleveland Fed nowcasting HTML | MoM table CPI col; Currena accumulates its own history (publisher serves none); blank cell = released marker | daily refresh | – |
| `cpi-surprise` | Realised CPI − final nowcast | derived CPIAUCSL MoM − frozen nowcast | one immutable point per month when the print lands | monthly | – |
| `brent` | Brent crude spot | FRED DCOILBRENTEU (+EIA xls, Yahoo front-month gap-fill, hourly live) | weekly batched daily; scored change rule (13-wk rise ≥25%) | daily | ✓ |
| `wti` | WTI spot | FRED DCOILWTICO (EIA fallback) | daily; context | daily | – |
| `natgas` | Henry Hub spot | FRED DHHNGSP | daily; context | daily | – |
| `gas-europe` | European gas benchmark | World Bank Pink Sheet ($/mmbtu) | monthly; context | monthly | – |
| `eia-crude-stocks` | US crude ending stocks | EIA WCRSTUS1 weekly HTML | Saturday gate; context | weekly | – |
| `food-index` | Pink Sheet Food index | World Bank Monthly Indices sheet | monthly; context | monthly | – |
| `wheat` | Wheat US SRW | Pink Sheet ($/mt) | monthly; context | monthly | – |
| `maize` | Maize | Pink Sheet ($/mt) | monthly; context | monthly | – |
| `gold-oil-ratio` | Barrels of Brent per gold ounce | derived gold-usd ÷ brent | context-only by spec | daily | – |
| `michigan-5y-expectations` | UoM 5–10-yr expected inflation | UoM SIE Table 33 (POST mine.php) | monthly median, verbatim | monthly | ✓ |
| `platinum` | Platinum spot | gold-api XPT | daily; context (prices-heat) | daily | – |

### 4.3 market-stress — "Is the system under stress?" (41 members · 7 voters)

| id | What it is | Source · series | Process / method | Cadence | Voter |
|---|---|---|---|---|---|
| `stress-stlfsi` | St. Louis Fed Financial Stress | FRED STLFSI4 | weekly; percentile rule | weekly | ✓ |
| `nfci` | Chicago Fed NFCI | FRED NFCI | weekly; percentile rule | weekly | ✓ |
| `vix` | Cboe VIX close | FRED VIXCLS | daily; percentile rule | daily | ✓ |
| `gold-silver` | Gold/silver ratio | derived gold-api XAU ÷ XAG | the monetary-stress read; percentile rule; **gold-meter voter #18** | daily | ✓ |
| `cftc-gold-positioning` | Net non-commercials ÷ OI ×100 | CFTC deafut.txt GOLD row | arithmetic identity asserted; weekly Saturday; **gold-meter voter #36** | weekly | ✓ |
| `cftc-gold-gross-long` | NonComm long ÷ OI ×100 | same row | zero extra fetches; **gold-meter voter #37** | weekly | ✓ |
| `bank-stress` | Discount-window primary credit rate | FRED DPCREDIT | weekly; move rule 0.10 pt; **gold-meter voter #25** | weekly | ✓ |
| `walcl` | Fed balance sheet | FRED WALCL | Wednesday weekly; context | weekly | – |
| `tga` | Treasury General Account | FRED WTREGEN | Wednesday weekly; context | weekly | – |
| `reverse-repo` | Overnight reverse repo | FRED RRPONTSYD | daily; context | daily | – |
| `bank-reserves` | Reserve balances | FRED WRESBAL | Wednesday weekly; context | weekly | – |
| `repo-stress` | SOFR − IORB | derived | the repo pinch; context | daily | – |
| `net-liquidity` | WALCL − TGA − RRP | derived | the liquidity-drain gauge; context | weekly | – |
| `ebp` | Excess bond premium | FRB ebp_csv.csv (ebp col) | monthly; context; **gold-meter voter #20** | monthly | – |
| `ofr-fsi` | OFR Financial Stress Index | OFR fsi.csv (aggregate col) | daily; context | daily | – |
| `sloos-ci-tightening` | Banks tightening C&I standards | FRED DRTSCILM | quarterly; context | quarterly | – |
| `term-premium-10y` | Kim–Wright 10-yr term premium | FRED THREEFYTP10 | daily; context; **gold-meter voter #19** | daily | – |
| `michigan-sentiment` | UoM consumer sentiment | FRED UMCSENT | monthly; context; **gold-meter voter #21 (polarity −1)** | monthly | – |
| `gpr-index` | GPR monthly index | matteoiacoviello.com data_gpr_export.xls | BIFF parse; context | monthly | – |
| `gpr-threats` / `gpr-acts` | GPRT / GPRA sub-indexes | same file | context | monthly | – |
| `gpr-daily` | Daily GPR, 7-day MA | data_gpr_daily_recent.xls (GPRD_MA7) | context; **gold-meter voter #22** | daily | – |
| `gpr-taiwan` / `-china` / `-russia` / `-ukraine` / `-israel` / `-saudi` / `-australia` | Country GPR | same monthly file | context | monthly | – |
| `crypto-fng` | Crypto Fear & Greed | alternative.me /fng/ | context-only (never a signal) | daily | – |
| `shiller-cape` | Cyclically-adjusted P/E | Shiller ie_data.xls | monthly; context | monthly | – |
| `shiller-ecy` | Excess CAPE yield | same | monthly; context | monthly | – |
| `sp500-breadth-ratio` | RSP ÷ SPY (equal/cap weight) | Yahoo chart API | 10-yr inner join, 4 dp; context; **gold-meter voter #24 (polarity −1)** | daily | – |
| `global-liquidity` | Fed+ECB+BoJ assets, $ tn | derived WALCL + ECB BSI + JPNASSETS | USD-converted monthly aggregate; context | monthly | – |
| `wgc-etf-holdings` | World gold ETF holdings | WGC Goldhub | **L3 disabled — never fetched** | monthly | – |
| `wgc-cb-demand` | Central-bank gold purchases | WGC Goldhub | **L3 disabled** | quarterly | – |
| `official-gold-demand` | PBoC/SAFE + CBR purchases | PBoC English page | **disabled — venue 404** | monthly | – |
| `shanghai-gold-premium` | SGE vs London premium, % | derived SGE Au99.99 ÷ (XAU×USDCNY÷31.1034768) − 1 | daily rung2; context | daily | – |
| `real-gold-price` | CPI-deflated gold | derived gold ÷ CPIAUCNS ×100 | 1982–84 dollars; context | monthly | – |
| `gold-platinum` | Gold/platinum ratio | derived | context | daily | – |
| `sge-gold-withdrawals` | SGE monthly withdrawals, t | SGE Data Highlights PDF | hand-written PDF extractor (ToUnicode CMap); monthly | monthly | – |
| `swiss-gold-flow` | Swiss gold imports, t | BAZG open-data CSV (HS 7108) | monthly tonnage; context | monthly | – |
| `etf-short-interest` | Gold ETF short interest | fund-pages | **disabled — no licence-clean venue** | monthly | – |

### 4.4 dollar-strength — "Is the dollar strong?" (9 members · 5 voters)

| id | What it is | Source · series | Process / method | Cadence | Voter |
|---|---|---|---|---|---|
| `dollar-basket` | Currena 6-ccy basket (DXY recipe) | derived Frankfurter legs | 50.14348112 × EUR^.576 × JPY^.136 × GBP^.119 × CAD^.091 × SEK^.042 × CHF^.036; percentile rule; **gold voter #8** | daily | ✓ |
| `dollar-broad` | Broad dollar index | FRED DTWEXBGS | lags ~5 d; percentile; **gold voter #13** | daily | ✓ |
| `dollar-eme` | EME dollar index | FRED DTWEXEMEGS | percentile; **gold voter #14** | daily | ✓ |
| `usdjpy` | USD/JPY | Frankfurter | pct-change rule; **gold voter #9** | daily | ✓ |
| `us-japan-10y-gap` | US−JP 10-yr gap | derived DGS10 − MOF 10Y | the carry fuel; percentile; **gold voter #10** | daily | ✓ |
| `eur-usd` | EUR/USD | Frankfurter | context | daily | – |
| `usdchf` | USD/CHF | Frankfurter | context | daily | – |
| `usdtry` | USD/TRY | Frankfurter (ECB ref) | context | daily | – |
| `usdaed` | USD/AED | Yahoo AED=X (10 y) | ECB publishes no dirham — Yahoo only; context | daily | – |

### 4.5 growth-health — "Is growth healthy?" (27 members · 10 voters)

| id | What it is | Source · series | Process / method | Cadence | Voter |
|---|---|---|---|---|---|
| `china-pmi` | Manufacturing PMI | NBS English press release | HTML table 13-month history, headline cross-check; manual seed + KV union; percentile rule | monthly | ✓ |
| `china-cpi` | China CPI YoY | NBS release | summary-table cell + headline sentence cross-check (≤0.05 tolerance) | monthly | ✓ |
| `philly-fed` | Philly Fed manufacturing index | FRED GACDFSA066MSFRBPHI | threshold rule | monthly | ✓ |
| `initial-jobless-claims` | Weekly initial claims | FRED ICSA | threshold rule | weekly | ✓ |
| `oecd-cli-us` | OECD CLI, US | OECD SDMX DF_CLI | amplitude-adjusted; percentile | monthly | ✓ |
| `us-unemployment` | Unemployment rate | FRED UNRATE | percentile | monthly | ✓ |
| `sahm-rule` | Sahm recession indicator | FRED SAHMREALTIME | real-time vintage; threshold | monthly | ✓ |
| `recession-probability` | Smoothed recession prob | FRED RECPROUSM156N | percentile | monthly | ✓ |
| `michigan-sentiment` | UoM sentiment | FRED UMCSENT | percentile | monthly | ✓ |
| `copper-gold` | Copper ÷ gold ratio | derived World Bank Pink Sheet | the growth/copper seat; percentile-low rule | monthly | ✓ |
| `oecd-cli-cn` / `-de` | OECD CLI China / Germany | same SDMX call | context | monthly | – |
| `epu-us` / `tpu-us` | US EPU / Trade-policy EPU | Baker-Bloom-Davis xlsx | context; **epu-us is gold voter #23** | monthly | – |
| `m2-us` | M2 money supply YoY | FRED M2SL | percentileBasis: yoy; **gold voter #33** | monthly | – |
| `empire-state` | NY Fed Empire State index | FRED GACDISA066MSFRBNY | context | monthly | – |
| `gdpnow` | Atlanta Fed GDPNow | FRED GDPNOW | quarterly-stamped nowcast; context | daily | – |
| `continuing-claims` | Insured unemployment | FRED CCSA | context | weekly | – |
| `retail-sales` | Advance retail sales | FRED RSAFS | context | monthly | – |
| `housing-permits` | Building permits | FRED PERMIT | context | monthly | – |
| `cfnai` | Chicago Fed activity index | FRED CFNAI | context | monthly | – |
| `job-openings` | JOLTS openings | FRED JTSJOL | context | monthly | – |
| `us-gdp-growth` | Real GDP QoQ annualised | FRED A191RL1Q225SBEA | context | quarterly | – |
| `us-nfp` | Non-farm payrolls change | derived PAYEMS monthly Δ | context | monthly | – |
| `usdcny` | USD/CNY | Frankfurter | context | daily | – |
| `copper-usd` | Copper spot, $/mt | gold-api HG × 2204.62262 | lb→t conversion; Pink Sheet history | daily | – |

### 4.6 geo-fragmentation (shadow, context-only, 8 members)

`chokepoint-suez` · `chokepoint-panama` · `chokepoint-bab-el-mandeb` · `chokepoint-malacca` · `chokepoint-taiwan` — IMF PortWatch ArcGIS `n_total`, 7-day MA (Hormuz **rejected**: 2026-03 source-side AIS gap) · `gscpi` (NY Fed supply-chain index) · `us-spr` (EIA WCSSTUS1) · `us-crude-production` (EIA WCRFPUS2).

### 4.7 dedollar-concentration (shadow, 2 members)

`usd-reserve-share` (IMF COFER USD share, quarterly — **gold voter #11**) ·
`sp500-breadth-ratio` (Yahoo RSP ÷ SPY — **gold voter #24**).

### 4.8 prices-board (the strip, 5 members)

| id | What it is | Live source | History base |
|---|---|---|---|
| `gold-usd` | Gold spot $/oz | gold-api XAU + hourly Yahoo GC=F overlay | World Bank Pink Sheet monthly + daily accumulation |
| `silver-usd` | Silver spot | gold-api XAG + Yahoo SI=F | Pink Sheet |
| `btc-usd` | Bitcoin spot | gold-api BTC + Yahoo BTC-USD | accumulated daily snapshots (+ Bitstamp cross-check) |
| `brent` | Brent front-month | hourly Yahoo first-active BZ contract (BZ=F last resort) | FRED DCOILBRENTEU + Yahoo gap-fill |
| `gold-btc` | BTC per gold ounce | derived XAU ÷ BTC | same-date division |

---

## 5. The Australia registry

### 5.1 au-inflation-rates (6 · 5 voters)

| id | What | Source · series | Method | Cadence | Voter |
|---|---|---|---|---|---|
| `au-cpi` | CPI annual % | ABS CPI/1.10001.10.50.M | SDMX index → YoY | monthly | ✓ |
| `au-trimmed-mean` | Trimmed mean annual % | ABS CPI/1.999902.20.50.M | YoY | monthly | ✓ |
| `rba-expectations` | 3-yr bond − cash rate | derived RBA F2 FCMYGBAG3D − F1 | the market's RBA path | daily | ✓ |
| `au-10y` | AU 10-year yield | RBA F2 daily (F2.1 monthly fallback on Worker) | percentile rule | daily | ✓ |
| `au-us-10y-gap` | AU−US 10-yr gap | derived RBA F2 − DGS10 | context of the lane | daily | ✓ |
| `au-petrol-yoy` | Automotive fuel CPI YoY | ABS CPI/1.40081.10.50.M | context | monthly | – |

### 5.2 au-households (11 · 7 voters)

| id | What | Source · series | Cadence | Voter |
|---|---|---|---|---|
| `au-home-loan` | Outstanding owner-occupier rate | RBA F6 FLRHOOTA | monthly | ✓ |
| `au-wage-growth` | WPI hourly ex-bonus YoY | ABS WPI/1.OHRPEB.7.TOT.10.AUS.Q | quarterly | ✓ |
| `au-rent-yoy` | Rents CPI YoY | ABS CPI/1.115522.10.50.M | monthly | ✓ |
| `au-household-debt-arrears` | Household debt to income | RBA E2 (ABS-calculated) | quarterly | ✓ |
| `au-unemployment` | Unemployment rate | ABS LF/M13.3.1599.20.AUS.M | monthly | ✓ |
| `au-home-values` | Residential price index | ABS RES_DWELL/5.AUS.Q | quarterly | ✓ |
| `au-housing-finance` | New loan commitments | ABS LEND_HOUSING/FIN_VAL…Q | quarterly | ✓ |
| `rba-cash-rate` | Cash rate target | RBA F1 (HTML decisions preferred) | per-change | – |
| `au-deposit-rate` | New term-deposit rate | RBA F4.1 PDRNTH | monthly | – |
| `au-saving-ratio` | Household saving ratio | ABS ANA_AGG/M7.HSR.20.AUS.Q | quarterly | – |
| `au-job-vacancies` | Job vacancies | ABS JV/M1.7.TOT.20.AUS.Q | quarterly | – |

### 5.3 au-trade-currency (10 · 4 voters)

| id | What | Source | Cadence | Voter |
|---|---|---|---|---|
| `audusd` | AUD/USD | derived 1 ÷ Frankfurter AUD | daily | ✓ |
| `audjpy` | AUD/JPY | derived JPY ÷ AUD legs | daily | ✓ |
| `terms-of-trade` | Export ÷ import price index | ABS ANA_AGG/M5.TTR | quarterly | ✓ |
| `rba-fed-gap` | RBA rate − Fed midpoint | derived | per-change | ✓ |
| `iron-ore` | Iron ore $/dmtu | World Bank Pink Sheet | monthly | – |
| `coal-aus` | Australian coal $/mt | Pink Sheet | monthly | – |
| `lng-japan` | LNG Japan $/mmbtu | Pink Sheet | monthly | – |
| `china-property-investment` | RE investment YoY | NBS release (rung2 21st–25th window) | monthly | – |
| `china-steel-output` | Crude steel output | NBS release | monthly | – |
| `gold-aud` | Gold in AUD | derived XAU × AUD leg | daily | – |

### 5.4 au-activity (shadow, 7 context) · 5.5 au-external (shadow, 4 context)

au-activity: `au-gdp-growth` (ANA_AGG M1.GPM chain-volume YoY) · `au-household-spending` (HSI_M TTY %) · `au-building-approvals` (BA_GCCSA dwellings) · `au-population-growth` (+ `au-nom` companion, ERP) · `au-participation` (LF M12) · `au-underemployment` (LF_UNDER M23).
au-external: `au-trade-balance` (ITGS M1.170 SA $m) · `audnzd` · `nz-short-rate` (OECD FINMARK) · `nz-10y` (FRED IRLTLT01NZM156N).

---

## 6. The boards beyond the registry

### 6.1 FX board (`packages/insights/src/fx/`) — 10 pairs + 7 rules

**Pairs:** EURUSD, USDJPY, GBPUSD, USDCHF, USDCNY, AUDUSD (dollarWorld) ·
AUDJPY, EURJPY, EURCHF (warningLights) · AUDCNY (chinaLink).
**Sources:** ONE Frankfurter timeseries call (8 currencies, ~400-day window);
Yahoo fallback (8 calls) on failure or ≥5% day-move suspicion (both voices must
agree within 0.5%).
**Per-pair metrics:** rate, d1/m1/m3/y1 changes, moveRank (0–100 percentile of
rolling 1-month moves), bigMove flag ≥90th pct, 52 weekly closes, staleness >5 d.
**Rules:** R1 risk-mood (AUDJPY ≤−3% + equity/fear confirm) · R2 carry unwind
(USDJPY ≤−4% + Nikkei ≤−3%) · R3 dollar strength (basket M1 ±3% / M3 ±4%) ·
R4 money-hiding (flight: dollar +2% & S&P −3%; wobble: dollar −2%, S&P −3%, gold +3%) ·
R5 China link (USDCNY +2% & AUDUSD −2%) · R6 Europe worry (EURCHF −2% & Stoxx −2%) ·
R7 dollar-or-euro attribution (context). Pattern check: 13-week together/opposite grid.
Summary: unusual ≥3 warnings or wobble; attention ≥1. KV: `insights:fx:v1`.

### 6.2 World Markets board — 16 indexes

N225, ASX200, KOSPI, HSI, SSEC, TAIEX, NIFTY50 (asia) · STOXX50E, DAX, CAC, FTSE (europe) ·
SP500, NDX, DOW, TSX, IBOV (americas).
**Sources:** EODHD primary (`eodhd.com/api/eod/{code}`, api-token secret, FTSE excluded on
free key) → Yahoo fallback (`^N225` etc., 10-yr window, session state from quote meta).
**Metrics:** chg1d/1w/1m/3m/1y/5y, 52-week high/low, fromHigh, rangePos, trend (±1% band),
status (**correction −10% / bear −20%** from 52-wk high), weekly closes, session open/closed.
Summary: unusual ≥8 stressed or SP500/NDX bear; attention ≥4 or correction.
Cron 23:30 UTC Mon–Fri main · 01:30 retry · 08:50 asia rung. KV: `insights:markets:v1`.

### 6.3 AU Markets board — 19 Yahoo-only symbols

All Ordinaries, Small Ordinaries, 10 ASX-200 sector indexes, 4 big banks
(CBA/NAB/ANZ/WBC), ASX 200 VIX, NZX 50 — same computation as the world board
(EODHD quota reserved for world). Cron 07:00 UTC Mon–Fri. KV: `insights:markets-au:v1`.

### 6.4 Prices live board — hourly refresh (:13 rung)

Brent (first-active BZ front-month contract, remembered-contract probe),
gold GC=F, silver SI=F, BTC-USD — hourly Yahoo quotes over the daily EOD base,
merged at serve time; ratios gold-btc/gold-aud/gold-silver recomputed live.
KV: `insights:prices-live:v1`.

### 6.5 TIC board — foreign holders of Treasuries

Treasury TIC `slt_table5.txt` (billions, 13 rolling months) + `slt_table3.txt`
(millions, flows: net sales = positive = foreigners bought). 21 pinned country
holders + aggregates, 24-month history each, custody-hub flags, share %,
1/6/12-month changes, 12-month transactions vs valuation split, rank changes.
Stale gate 70 days. Served at `/api/insights/tic`. KV: `insights:tic:v1`.

### 6.6 Companies board — 49 world-leading companies (feature-flag OFF)

AAPL, AMZN, AVGO, BRK-B, COST, GOOGL, JPM, LLY, META, MSFT, NVDA, TSLA, UNH, V (US) ·
17 European (ASML, SAP, Siemens, LVMH, Novo, Novartis, Shell…) · 8 Japan/Asia ·
3 China · 2 India · BHP/CSL · 3 Americas-ex-US. EODHD `/api/eod/{symbol}`,
**flag OFF** pending EODHD free-quota decision (20 calls/day shared with markets).

---

## 7. Derived indicators — every formula

| id | Formula | Legs |
|---|---|---|
| `fed-expectations` | DGS2 − (DFEDTARL+DFEDTARU)/2 | FRED |
| `real-curve-10y5y` | DFII10 − DFII5 | FRED |
| `govt-interest-revenue` | A091RC1Q027SBEA ÷ W006RC1Q027SBEA × 100 | FRED |
| `us-deficit-12m` | rolling 12-month Σ MTSDS133FMS | FRED |
| `us-nfp` | PAYEMS month-over-month Δ (thousands) | FRED |
| `repo-stress` | SOFR − IORB | FRED |
| `net-liquidity` | WALCL − WTREGEN − RRPONTSYD | FRED |
| `global-liquidity` | WALCL + ECB BSI T00 (€→$) + JPNASSETS (¥→$), $ tn | FRED+ECB |
| `breakeven-tilt` | T5YIFR − T5YIE | FRED |
| `btp-bund-spread` | IRLTLT01ITM156N − IRLTLT01DEM156N | FRED |
| `us-japan-10y-gap` | DGS10 − MOF 10Y | FRED+MOF |
| `dollar-basket` | 50.14348112 × EUR^.576 × JPY^.136 × GBP^.119 × CAD^.091 × SEK^.042 × CHF^.036 | Frankfurter |
| `gold-silver` | XAU ÷ XAG (history: WB gold ÷ silver) | gold-api/WB |
| `gold-btc` | XAU ÷ BTC | gold-api |
| `gold-aud` | XAU × USD→AUD | gold-api+Frankfurter |
| `gold-oil-ratio` | gold-usd ÷ brent | gold-api/FRED |
| `gold-platinum` | gold-usd ÷ platinum | gold-api |
| `real-gold-price` | gold month-close ÷ CPIAUCNS × 100 | gold-api/FRED |
| `shanghai-gold-premium` | SGE Au99.99(CNY/g) ÷ (XAU × USDCNY ÷ 31.1034768) − 1 | SGE/gold-api/Frankfurter |
| `cpi-surprise` | CPIAUCSL MoM% − frozen final Cleveland nowcast | FRED/Cleveland |
| `us-cpi-yoy` etc. | index → 12-month % change | FRED/ABS |
| `audusd` | 1 ÷ (USD→AUD) | Frankfurter |
| `audjpy` / `audnzd` / `audcny` | cross = leg ÷ leg on shared dates | Frankfurter |
| `copper-gold` | WB copper ÷ WB gold | World Bank |
| `rba-expectations` | FCMYGBAG3D − cash rate | RBA |
| `rba-fed-gap` | RBA cash rate − Fed midpoint | RBA/FRED |
| `au-us-10y-gap` | RBA F2 10Y − DGS10 | RBA/FRED |
| `sp500-breadth-ratio` | RSP ÷ SPY (same-date join, 4 dp) | Yahoo |
| `gold-equities-ratio` | GLD ÷ SPY (same-date join, 4 dp) | Yahoo |
| `cftc-gold-positioning` | (NonComm Long − Short) ÷ OI × 100 | CFTC |
| `cftc-gold-gross-long` | NonComm Long ÷ OI × 100 | CFTC |

---

## 8. The scheduling system

**currena-api Worker** (Hono, `* * * * *` minute cron):
:13 hourly live prices · :40 ingest watchdog (GHA re-dispatch >26 h silence) ·
:50 narrator · **04:10 main ingest** (FRED bulk groups, ABS, RBA, ECB, gold-api,
Frankfurter, MOF, BoE, NBS, World Bank, Shiller…) · **04:20 rung2** (daily extras:
Cleveland, SGE daily, breadth, gold-equities; Saturday family: CFTC, EIA stocks,
COFER, r*, BAZG; monthly gates: OECD, GPR/EPU, ECB assets) · **04:25/04:27**
daily-history halves · **04:30 rung3** (TIC, PortWatch, ABS-AU-macro) ·
**04:35 rung4** (FRED S3 liquidity/macro groups, FRB EBP, OFR FSI) ·
**04:40 periodic history** · **10:10/20:10 failure-heal sweeps**.

**currena-markets Worker** (4 crons): 23:30 Mon–Fri world markets + FX ·
01:30 Tue–Sat retry · 08:50 Tue–Sat asia closes · 07:00 Mon–Fri AU board.

**Storage:** one KV namespace `RATES` — `insights:snapshot`,
`insights:snapshot-public`, `insights:hist:<id>`, `insights:status`,
`insights:archive:v1:<date>`, plus one key per board (§6). Write-only-if-changed.

**Serving:** `GET /api/insights` (main, merged with live prices, 60 s cache) ·
`/api/insights/markets` · `/markets-au` · `/fx` · `/tic` · `/narrative` ·
`/status` · `/archive/:date` · `/api/insights/:id/history` — all with ETags;
public mode hides the private set via the generated projection.

---

## 9. The scoring engine

For every reading, over a **10-year window** (3650 d, min 30 observations):

- **percentile10y** — share of history strictly below the current value
- **sd10y** — z-score vs the 10-year mean/σ (drives SD-threshold rules)
- **moveScore** — the big-mover z over the 10-year change series
- **fromPeak10y** — distance from the 10-year peak
- **change7d/30d** — since-previous-release for monthly+/quarterly+; **change90d** for dailies
- **lastChange** — the step change for per-change policy rates

**Rule atoms:** `info` (never votes) · `threshold` (strict compare, optional
sustain) · `percentile` (tail high/low, cutoff e.g. 0.1/0.2) · `change`
(points/pct over windowWeeks) · `yoy-negative` · `growth` · `consecutive-decline`
· `above-low` · `below-aux` · `any-of` composites.

**Gauge verdict (5-step):** share = warnings ÷ (fresh + stale voters);
0 voters → step 0 · 0 → 1 · ≤⅓ → 2 · ≤⅔ → 3 · >⅔ → 4.
**Section verdict:** alarmed ≥2 gauges at step 4 (or all ≥3) · stressed ≥2 at ≥3
(or majority ≥2) · cautious any ≥2 · relaxed all step 1.

**Staleness grace (GRACE_DAYS):** daily 4 · weekly 10 · monthly 45 ·
quarterly 120 · per-change exempt — per-definition `staleAfterDays` overrides
(e.g. Brent 12 d, china NBS 45 d, usd-reserve-share 200 d).

---

## 10. Licence & display status

| Level | Meaning | Count | Examples |
|---|---|---|---|
| L0 | Public domain / freely reusable | 95 | FRED (most), RBA, ABS, EIA, CFTC, BoE, MOF, Treasury, FRB, OFR, NY Fed, IMF, PortWatch, GPR |
| L1 | Permissive (attribution / CC) | 37 | ECB, Frankfurter, World Bank, OECD, EPU, Shiller, BAZG, UoM (CC-BY-NC-ND), gold-api |
| L2 | Restricted — owner-accepted for display | 50 | FRED copyright series (VIXCLS, STLFSI4, breakevens, Cleveland…), Yahoo, SGE, PBoC, fund-pages |
| L3 | Blocked — prior written permission | 2 | WGC family (wgc-etf-holdings, wgc-cb-demand) |

**Public/private state (GF-S13, 2026-11-07 — "make everything public"):**
180 of 184 ids served publicly; **4 hidden (no data)**: `etf-short-interest`,
`official-gold-demand`, `wgc-cb-demand`, `wgc-etf-holdings`. All boards public
(dated owner directives). Panic lever: `ACCESS_MODE=private` + register regen.

---

## 11. Gaps, disabled & blocked items

| Item | Status | Why |
|---|---|---|
| `wgc-etf-holdings`, `wgc-cb-demand` | never fetched | WGC L3 — needs prior written authorisation (draft prepared) |
| `official-gold-demand` | disabled | PBoC English URL 404 (venue restructured) |
| `etf-short-interest` | disabled | no licence-clean venue (Nasdaq timeout, NYSE 403, FINRA gated) |
| FTSE on EODHD | Yahoo-only | unavailable on free key |
| SGE premium seat (gold voter) | context-only | SGE archive reaches ~2024 — unmeasurable for calibration |
| MCX India gold | rejected | venue-blocked (HTTP 403) |
| ICE BofA spreads (BAML…) | rejected | FRED copyright-pre-approval tag |
| RBA F2 CSV on Worker | monthly F2.1 fallback | Akamai 403 from Cloudflare egress |
| FiscalData auctions on Worker | GHA/Node venue only | blocked from Worker egress |
| Companies board | feature-flag OFF | EODHD free quota (20/day) shared with world markets |

---

*Companion document: `05-GOLD-INDICATORS.md` — the gold-specific inventory
(the 37-voter meter, gold context cards, and every gold fetch method).*
