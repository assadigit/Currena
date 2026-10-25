# Insights Gap Audit — 2026-10-26

**Mode:** AUDIT_ONLY. **Scope:** the live Insights page (`https://currena.ir/#/insights`), the public JSON API, the repository (`main` @ `85e5c85`), and live probes of every data endpoint. No site code was changed; the only repository writes are this document and its companion spec.

**Method.** The page was read in a real headless browser (JavaScript rendering, waiting for all cards, every collapsed section expanded, both languages). Every reading was cross-checked against the public API (`/api/insights`, 89 readings, generated 2026-10-25T18:05Z). Every existing and proposed source was then probed live from this session (three probe rounds, logs preserved in the session artifacts; see Assumptions for venue caveats). Nothing in this report is inferred from documentation alone where a live probe was possible.

**Environment note for probes.** FRED answers keyless `fredgraph.csv` requests but hangs on this sandbox's requests when a `CurrenaInsights/…` descriptive User-Agent is attached; the default curl User-Agent answers instantly. RBA is Akamai-403 from this audit venue (a long-documented sandbox condition; the production GitHub Actions venue is the verified route and the live site serves fresh RBA readings). Both behaviours are recorded as venue facts, not source failures.

---

## 1. Summary — what the live page shows today (10 lines)

1. The page is a bilingual (English + Farsi, RTL, Persian digits, Jalali fetch stamps) dashboard of **89 indicators** across 9 gauge groups: 74 global (5 gauges) and 15 Australian (3 gauges), with 43 scored "voting" indicators and 46 context rows; nothing is hidden in public mode.
2. Hero verdicts today: Global **Stressed** (8 of 28 voting indicators need attention), Australia **Stressed** (7 of 15) with the Inflation & rates gauge at **Critical** (4 of 5).
3. All 89 readings are **current within their own grace windows** (zero stale, zero broken, zero "can't tell"), confirmed against the live API; the status chip reads "All data current".
4. Prices strip: gold US$3,997, silver US$54.05, platinum US$1,558, copper ~US$14,400/mt, Brent US$111.70, WTI US$107.89, US natural gas US$3.10, Bitcoin US$80,679, plus food/wheat/maize (World Bank) and gold/silver, gold/Bitcoin, gold/AUD ratios.
5. Borrowing lane spans the US curve (3m–30y, real, breakevens at 3 horizons), Fed target and the market's expected path (2y gap), SOFR, ECB DFR + daily euro-AAA 10y, and honest "monthly average, lagged" mirrors for Bund, JGB and gilt; the UK and Japan policy rates (BoE from its own site, BoJ via OECD mirror) and the US 30-year mortgage rate (7.32%) sit as context.
6. Prices lane: US CPI 3.7% (core 2.6%), PCE core 3.0%, euro-area HICP 3.8%, China CPI 0.9%, US wages 3.3%, plus five breakeven/expectation series.
7. Growth lane is the deepest: China factory PMI 50.1 (NBS, now automated), unemployment 4.2%, jobless claims 194k, Sahm 0.0, Chauvet recession probability 62%, Michigan 48.1, M2, retail sales, permits, CFNAI, JOLTS, Philadelphia Fed, GDP, payrolls.
8. Markets: a 16-index world board (EODHD-primary, Yahoo for FTSE only) "as of Oct 22" with 6 of 16 markets in correction, plus an S&P 500 / Nasdaq view in AUD; FX module with 10 pairs, a computed dollar basket (101.80) and 7 warning patterns (all calm).
9. Australia block: cash rate 4.60%, 10y 5.28% (highest since 2013), AU-US 10y gap −0.01, monthly CPI 4.0% / trimmed mean 3.6%, home-loan rate 6.20%, deposits 4.80%, wages 3.2%, rents 3.6%, unemployment 4.7%, petrol +13.5%, home values, household debt 178.4% of income, terms of trade 94.8, iron ore, AUD/USD 0.7022, AUD/JPY, gold in AUD.
10. "Together" relationship cards (6), a gold/silver conditions beam, an everyday-life section ("What it means for my money"), a 7-month economic calendar with `.ics` export, and a fully attributed About panel; zero console errors in either language.

---

## 2. Existing indicators — status, criteria, sources, recommendations

**Verdict on the owner's expected list.** Every item is PRESENT and current unless marked otherwise. The owner's list was written before the 2026-10 waves: the page is now far ahead of it.

| Expected item | Status | Notes |
|---|---|---|
| Gold | PRESENT | gold-api XAU primary; Yahoo is the labelled L2 fallback |
| Silver | PRESENT | gold-api XAG |
| Gold/silver ratio | PRESENT | scored; gold-api daily, Pink Sheet history |
| Gold/Bitcoin | PRESENT | context reading (XAU÷BTC), never votes, no standalone card |
| Silver/Bitcoin | **MISSING** (never built) | Do not build: fails criteria 2 and 4 (owner's instinct is correct) |
| Brent oil | PRESENT | FRED/EIA primary + Yahoo BZ=F labelled fallback |
| Natural gas | PRESENT | "US natural gas price (Henry Hub)", already labelled US-only |
| Food-price measure | PRESENT | World Bank Pink Sheet food index + wheat + maize |
| Bitcoin | PRESENT | gold-api BTC, context only |
| US 10y nominal / real / breakeven | PRESENT | DGS10, DFII10, T10YIE (+ 5y, 5y5y, SOFR, 2y, 30y) |
| Fed rate | PRESENT | DFEDTARL/U corridor, daily |
| US CPI | PRESENT | headline + core + PCE core |
| ECB rate | PRESENT | DFR, daily, ECB Data Portal |
| EUR/USD | PRESENT | fx-module pair + card (duplicate surface, see below) |
| S&P 500 | PRESENT | markets board (EODHD) |
| VIX | PRESENT | VIXCLS, © Cboe via FRED, attributed |
| ASX 200 | PRESENT | markets board (EODHD), daily close |
| World stock-index map | PRESENT | 16 indices, list + performance-map toggle |
| Currency pairs + computed dollar index | PRESENT | 10 pairs + Currena basket (101.80) + 7 patterns |
| USD/JPY | PRESENT | card + fx pair (duplicate surface, see below) |
| China PMI | PRESENT | NBS English press releases, automated since M7 |
| USD/CNY | PRESENT | card + fx pair |
| Market breadth | PRESENT | "6 of 16 markets in correction; 0 up / 15 down / 1 flat today", computed from the licensed board (not an official single-source breadth; honest basis) |
| Government interest / tax revenue | PRESENT | BEA series via FRED, quarterly |
| Interest rates vs house prices | PRESENT | AU lane: home values + home-loan rate + the RBA/home-loans/debt relationship card |
| Australian block (home-loan, wages, rent, petrol, calendar) | PRESENT | all present; calendar runs to May 2027 with `.ics` |

**Freshness verdicts.** 89/89 readings are in grace. Nothing is STALE, BROKEN or DUPLICATE at the data level. Two honest observations:

- **Markets board lag.** The board says "as of Oct 22" while EODHD already serves the Oct 23 close (verified live). The Friday 23:30/01:30 UTC rungs fetch before EODHD publishes the day's close, so the board carries a one-trading-day lag on free EOD feeds. Not stale by design; worth a line in the About panel.
- **Monthly mirrors.** Bund, JGB and gilt show the September monthly average (OECD via FRED mirrors), honestly labelled "monthly average, lagged". October values cannot exist until early November. By design, not stale.

**Full existing-indicator table** (89 rows; `in-grace` = within `maxAgeDays` for its own cadence; c1/c2/c4 = criteria 1/2/4, c3 verified for all):

| id | page title | source | series/table | cadence | asOf | freshness | state | c1/c2/c4 | recommendation |
|---|---|---|---|---|---|---|---|---|---|
| **global · borrowing-costs** | | | | | | | | | | |
| `yield-curve-10y2y` | The gap between 10-year and 2-year US borrowing | Federal Reserve Bank of St. Louis via FRED (T10Y2Y) | FRED:T10Y2Y | daily | 2026-10-23 | in-grace | normal | ok / ok / ok | KEEP |
| `real-yield-10y` | US 10-year interest after inflation | FRED (DFII10) | FRED:DFII10 | daily | 2026-10-22 | in-grace | warning | ok / ok / ok | KEEP |
| `us10y` | What the US government pays to borrow for 10 years | FRED (DGS10) | FRED:DGS10 | daily | 2026-10-22 | in-grace | warning | ok / ok / ok | KEEP |
| `fed-target` | The US central bank's policy rate | FRED (DFEDTARL/U) | FRED:DFEDTARL (lower bound) + DFEDTARU (upper bound) | daily | 2026-10-25 | in-grace | normal | ok / ok / ok | KEEP |
| `fed-expectations` | What markets expect from the Fed (2-year gap) | FRED (DGS2 − policy-rate midpoint) | FRED:DGS2 − FRED:DFEDTARL/DFEDTARU midpoint (2-year yield minus the policy-rate midpoint) | daily | 2026-10-22 | in-grace | normal | ok / ok / ok | KEEP |
| `us30y` | US 30-year Treasury yield | FRED (DGS30) | FRED:DGS30 | daily | 2026-10-22 | in-grace | warning | ok / ok / ok | KEEP |
| `sofr` | The overnight funding rate (SOFR) | New York Fed via FRED (SOFR) | FRED:SOFR (Secured Overnight Financing Rate) | daily | 2026-10-22 | in-grace | context | ok / ok / ok | KEEP |
| `us-2y` | What the US pays to borrow for 2 years | FRED (DGS2) | FRED:DGS2 | daily | 2026-10-22 | in-grace | context | ok / ok / ok | KEEP |
| `euro-aaa-10y` | What the safest euro-area governments pay for 10 years | ECB Data Portal (euro-area AAA 10-year yield) | ECB Data Portal YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y (AAA yield curve, 10-year spot rate) | daily | 2026-10-22 | in-grace | context | ok / ok / ok | KEEP |
| `ecb-dfr` | The euro area's policy rate | ECB Data Portal (DFR) | ECB Data Portal FM/D.U2.EUR.4F.KR.DFR.LEV | daily | 2026-10-25 | in-grace | normal | ok / ok / ok | KEEP |
| `govt-interest-revenue` | The US government's interest bill vs its income | FRED (BEA series, derived) | FRED:A091RC1Q027SBEA ÷ FRED:W006RC1Q027SBEA | quarterly | 2026-04-01 | in-grace | normal | ok / ok / ok | KEEP |
| `bund-10y` | What the German government pays to borrow for 10 years | OECD via FRED (IRLTLT01DEM156N) | FRED:IRLTLT01DEM156N (long-term government bond yield, monthly) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP monthly OECD mirror with honest label; daily Bund upgrade NOT verified (see rejected) |
| `jgb-10y` | What the Japanese government pays to borrow for 10 years | OECD via FRED (IRLTLT01JPM156N) | FRED:IRLTLT01JPM156N (long-term government bond yield, monthly) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | UPGRADE to MOF daily CSV (spec A-2); retire the monthly OECD mirror after 2 green weeks |
| `gilt-10y` | What the UK government pays to borrow for 10 years | OECD via FRED (IRLTLT01GBM156N) | FRED:IRLTLT01GBM156N (long-term government bond yield, monthly) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP monthly OECD mirror (honest label); no verified daily source |
| `boj-rate` | The Japanese central bank's policy rate | OECD via FRED (IRSTCI01JPM156N — Japan overnight cal | FRED:IRSTCI01JPM156N (overnight call rate, monthly) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP OECD mirror (BoJ feed dead upstream — 530/DNS from both venues, repo M7 evidence); relabelled monthly-average |
| `boe-rate` | The UK central bank's policy rate | Bank of England (official Bank Rate history) | Bank of England official Bank Rate history (decision table) | per-change | 2026-10-25 | in-grace | context | ok / ok / ok | KEEP |
| `mortgage-30y` | The US 30-year home-loan rate | Freddie Mac via FRED (MORTGAGE30US) | FRED:MORTGAGE30US (30-Year Fixed Rate Mortgage Average, weekly) | weekly | 2026-10-22 | in-grace | context | ok / ok / ok | KEEP |
| **global · dollar-strength** | | | | | | | | | | |
| `usdtry` | Dollar vs Turkish lira | Frankfurter (ECB USD→TRY reference rate) | Frankfurter USD→TRY (ECB reference rates) | daily | 2026-10-23 | in-grace | context | partial (EM case study) / ok (inflation-devaluation lens) / partial (not classic core) | KEEP as EM-pressure context (M5 decision stands) |
| `dollar-basket` | The dollar vs six big currencies (Currena basket) | Currena basket (ECB rates via Frankfurter) | Frankfurter six-currency basket (DXY weights, 50.14348112 base) | daily | 2026-10-23 | in-grace | normal | ok / ok / ok | KEEP |
| `usdjpy` | Dollar vs yen | Frankfurter (ECB) | Frankfurter USD→JPY | daily | 2026-10-23 | in-grace | normal | ok / ok (carry lens; US-Japan gap missing -> spec) / ok | KEEP; cross-link fx pair + card; add the US-Japan 10y gap beside it (spec) |
| `eur-usd` | EUR/USD (fx-module pair + card) | Frankfurter (ECB) | Frankfurter USD→EUR | daily | 2026-10-23 | in-grace | context | ok / ok / ok | KEEP |
| **global · growth-health** | | | | | | | | | | |
| `china-pmi` | Chinese factory activity | National Bureau of Statistics of China (Purchasing M | NBS English press release (Purchasing Managers Index, Table 1; seed data/manual/china-pmi.json) | monthly | 2026-09-30 | in-grace | normal | ok / ok / ok | KEEP |
| `china-cpi` | China inflation (yearly) | National Bureau of Statistics of China (Consumer Pri | NBS English press release (Consumer Price Index, YoY; seed data/manual/china-cpi.json) | monthly | 2026-09-30 | in-grace | normal | ok / ok / ok | KEEP |
| `m2-us` | The amount of money in the US economy | FRED (M2SL) | FRED:M2SL | monthly | 2026-08-01 | in-grace | context | ok / ok / ok | KEEP |
| `philly-fed` | US factory survey (Philadelphia Fed) | Philadelphia Fed via FRED (GACDFSA066MSFRBPHI) | FRED:GACDFSA066MSFRBPHI (Philadelphia Fed manufacturing index, SA) | monthly | 2026-10-01 | in-grace | normal | ok / ok / ok | KEEP |
| `initial-jobless-claims` | New unemployment claims | US Department of Labor via FRED (ICSA) | FRED:ICSA (initial claims, weekly) | weekly | 2026-10-17 | in-grace | normal | ok / ok / ok | KEEP |
| `us-unemployment` | US unemployment | FRED (UNRATE), US BLS | FRED:UNRATE (US Bureau of Labor Statistics) | monthly | 2026-09-01 | in-grace | normal | ok / ok / ok | KEEP |
| `sahm-rule` | US recession alarm (Sahm rule) | FRED (SAHMREALTIME) | FRED:SAHMREALTIME (real-time vintage) | monthly | 2026-09-01 | in-grace | normal | ok / ok / ok | KEEP |
| `recession-probability` | US recession probability | FRED (RECPROUSM156N, Marcelle-Chauvet smoothed reces | FRED:RECPROUSM156N (smoothed US recession probability) | monthly | 2026-08-01 | in-grace | warning | ok / ok / ok | KEEP |
| `michigan-sentiment` | US consumer mood | University of Michigan via FRED (UMCSENT) | FRED:UMCSENT (University of Michigan consumer sentiment) | monthly | 2026-09-01 | in-grace | warning | ok / ok / ok | KEEP |
| `michigan-1y-expectations` | US expected inflation next year (inside the mood card) | University of Michigan via FRED (MICH) | FRED:MICH (median expected price change, next 12 months) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `retail-sales` | US retail sales | US Census Bureau via FRED (RSAFS) | FRED:RSAFS (Advance Retail Sales: Retail Trade, monthly, $ millions) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `housing-permits` | US building permits | US Census Bureau via FRED (PERMIT) | FRED:PERMIT (New Private Housing Units Authorized by Building Permits, monthly, thousands, seasonally adjusted annual rate) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `cfnai` | US economic activity (Chicago Fed) | Chicago Fed via FRED (CFNAI) | FRED:CFNAI (Chicago Fed National Activity Index, monthly) | monthly | 2026-08-01 | in-grace | context | ok / ok / ok | KEEP |
| `job-openings` | US job openings | US Bureau of Labor Statistics via FRED (JTSJOL) | FRED:JTSJOL (Job Openings: Total Nonfarm, monthly, thousands) | monthly | 2026-08-01 | in-grace | context | ok / ok / ok | KEEP |
| `copper-gold` | Copper's price versus gold | The World Bank Pink Sheet (copper ÷ gold) | World Bank copper ÷ gold | monthly | 2026-09-01 | in-grace | normal | ok / ok (risk-appetite ratio) / ok (classic ratio) | KEEP (scored, growth lane) |
| `usdcny` | Dollar vs Chinese yuan | Frankfurter (ECB) | Frankfurter USD→CNY | daily | 2026-10-23 | in-grace | context | ok / ok (China peg lens) / ok | KEEP; cross-link the fx-module pair and the card (same number, two surfaces) |
| `us-gdp-growth` | How fast the US economy is growing | FRED (BEA real GDP growth) | FRED:A191RL1Q225SBEA (real GDP growth, QoQ annualized) | quarterly | 2026-04-01 | in-grace | context | ok / ok / ok | KEEP |
| `us-nfp` | US jobs added or lost each month | FRED (BLS PAYEMS, monthly change) | FRED:PAYEMS (monthly change, thousands) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `copper-usd` | Copper price | gold-api.com (HG, history: The World Bank Pink Sheet | gold-api.com HG spot × 2204.62262 (history: World Bank Pink Sheet copper, monthly) | daily | 2026-10-25 | in-grace | context | ok / ok (growth metal) / ok | KEEP (daily gold-api HG; Pink Sheet history) |
| **global · market-stress** | | | | | | | | | | |
| `walcl` | The Fed's balance sheet | Federal Reserve via FRED (WALCL, H.41 table) | FRED:WALCL (Total Assets of the Federal Reserve, weekly, $ millions) | weekly | 2026-10-21 | in-grace | context | ok / ok / ok | KEEP |
| `stress-stlfsi` | Stress in US money markets | St. Louis Fed via FRED (STLFSI4) | FRED:STLFSI4 | weekly | 2026-10-16 | in-grace | normal | ok / ok / ok | KEEP |
| `nfci` | US financial conditions | Chicago Fed via FRED (NFCI) | FRED:NFCI | weekly | 2026-10-16 | in-grace | normal | ok / ok / ok | KEEP |
| `vix` | Market fear gauge (VIX) | Cboe via FRED (VIXCLS) | FRED:VIXCLS (Cboe Volatility Index, close) | daily | 2026-10-22 | in-grace | normal | ok / ok / ok | KEEP |
| `crypto-fng` | Crypto fear and greed | Alternative.me (Crypto Fear and Greed Index) | alternative.me /fng/ API (daily, 0-100) | daily | 2026-10-25 | in-grace | context | partial (crypto only) / weak (crypto leg only) / FAIL (sentiment gadget, not classic) | KEEP as context (never votes); low value, free feed |
| `shiller-cape` | US share prices versus long-run earnings (Shiller CAPE) | Robert Shiller, Irrational Exuberance data (ie_data. | Robert Shiller ie_data.xls (monthly, CAPE column) | monthly | 2026-10-01 | in-grace | context | ok / ok / ok | KEEP |
| `shiller-ecy` | Excess CAPE Yield (Shiller) | Robert Shiller, Irrational Exuberance data (ie_data. | Robert Shiller ie_data.xls (monthly, Excess CAPE Yield column) | monthly | 2026-10-01 | in-grace | context | ok / ok / ok | KEEP |
| `gold-silver` | Gold's price versus silver | gold-api.com (history: The World Bank Pink Sheet) | gold-api.com XAU ÷ XAG (history: World Bank gold ÷ silver) | daily | 2026-10-25 | in-grace | normal | ok / ok (monetary-metal pair) / ok (classic ratio) | KEEP (scored; classic) |
| **global · prices-board** | | | | | | | | | | |
| `brent` | Brent crude oil (price strip) | FRED (EIA Brent) + Yahoo Finance (BZ=F) | FRED:DCOILBRENTEU + Yahoo Finance BZ=F (gap-fill + live refresh) | daily | 2026-10-23 | in-grace | normal | ok / ok / ok | KEEP (FRED/EIA primary, Yahoo BZ=F labelled L2 fallback) |
| `gold-usd` | Gold price (price strip) | gold-api.com (XAU) | gold-api.com XAU spot (history: World Bank Pink Sheet gold, monthly + daily accumulation) | daily | 2026-10-25 | in-grace | context | ok / ok / ok | KEEP (gold-api primary, Yahoo labelled L2 fallback) |
| `silver-usd` | Silver price (price strip) | gold-api.com (XAG) | gold-api.com XAG spot (history: World Bank Pink Sheet silver, monthly + daily accumulation) | daily | 2026-10-25 | in-grace | context | ok / ok / ok | KEEP (gold-api primary, Yahoo labelled L2 fallback) |
| `btc-usd` | Bitcoin price (price strip) | gold-api.com (BTC) | gold-api.com BTC spot (history: accumulated daily snapshots) | daily | 2026-10-25 | in-grace | context | partial / ok (gold-btc/gold-aud companions) / partial (not classic macro) | KEEP as context (never votes) |
| `gold-btc` | Bitcoin priced in gold (context reading; no standalone card) | gold-api.com (XAU ÷ BTC) | gold-api.com XAU ÷ BTC (bitcoin per troy ounce) | daily | 2026-10-25 | in-grace | context | partial (crypto leg only) / FAIL (connects to nothing classic) / FAIL (not a classic macro indicator) | KEEP as context-only curiosity (never votes; optionally group under a curiosities label); never in gauges |
| **global · prices-heat** | | | | | | | | | | |
| `us-cpi-yoy` | US prices vs a year ago | FRED (CPIAUCNS, not seasonally adjusted) | FRED:CPIAUCNS (12-month % change, not seasonally adjusted — the BLS headline basis) | monthly | 2026-09-01 | in-grace | warning | ok / ok / ok | KEEP |
| `us-cpi-core-yoy` | US core inflation (inside the CPI card) | FRED (CPILFENS, not seasonally adjusted) | FRED:CPILFENS (12-month % change, not seasonally adjusted) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `us-pce-core-yoy` | The Fed's preferred inflation gauge | FRED (PCEPILFE, 12-month % change) | FRED:PCEPILFE (12-month % change, core PCE price index) | monthly | 2026-08-01 | in-grace | warning | ok / ok / ok | KEEP |
| `euro-hicp` | Euro-area inflation (yearly) | ECB Data Portal / Eurostat (HICP annual rate) | ECB Data Portal HICP/M.U2.N.000000.4D0.ANR (euro-area HICP all-items, annual rate of change, monthly) | monthly | 2026-09-01 | in-grace | warning | ok / ok / ok | KEEP |
| `us-wages` | US wage growth | US Bureau of Labor Statistics via FRED (AHETPI, 12-m | FRED:AHETPI (average hourly earnings, all employees → 12-month % change) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `t5yie` | Expected US inflation, five years ahead | Federal Reserve Bank of St. Louis via FRED (T5YIE) | FRED:T5YIE (5-Year Breakeven Inflation Rate, daily) | daily | 2026-10-23 | in-grace | context | ok / ok / ok | KEEP |
| `breakeven-5y5y` | Expected US inflation, five to ten years ahead | Federal Reserve Bank of St. Louis via FRED (T5YIFR) | FRED:T5YIFR | daily | 2026-10-23 | in-grace | normal | ok / ok / ok | KEEP |
| `wti` | Oil price (WTI) | FRED (EIA WTI spot) | FRED:DCOILWTICO (EIA WTI spot) | daily | 2026-10-20 | in-grace | context | ok (global benchmark twin of Brent) / ok / ok | KEEP |
| `natgas` | US natural gas price (Henry Hub) | FRED (EIA Henry Hub spot) | FRED:DHHNGSP (EIA Henry Hub spot) | daily | 2026-10-20 | in-grace | context | FAIL (US-regional; labelled US-only on the card) / ok / ok (classic energy, US leg) | KEEP as labelled US-only context (criterion 1 fails; already context-only, daily FRED/EIA public-domain) |
| `breakeven-10y` | Expected US inflation, ten years ahead | FRED (T10YIE) | FRED:T10YIE (10-year breakeven inflation rate) | daily | 2026-10-23 | in-grace | context | ok / ok / ok | KEEP |
| `food-index` | World food prices | The World Bank: Commodity Markets (Pink Sheet, Food  | World Bank Pink Sheet (Monthly Indices, Food; 2010=100) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `wheat` | Wheat price | The World Bank: Commodity Markets (Pink Sheet, Wheat | World Bank Pink Sheet (Wheat, US SRW; $/metric ton) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `maize` | Maize price | The World Bank: Commodity Markets (Pink Sheet, Maize | World Bank Pink Sheet (Maize; $/metric ton) | monthly | 2026-09-01 | in-grace | context | ok / ok / ok | KEEP |
| `platinum` | Platinum price (ounce) | gold-api.com (XPT spot; history: World Bank Pink She | gold-api.com XPT spot (history: World Bank Pink Sheet platinum, monthly + daily accumulation) | daily | 2026-10-25 | in-grace | context | ok / ok (precious-metal family) / ok | KEEP (daily gold-api XPT, M6) |
| **australia · au-households** | | | | | | | | | | |
| `rba-cash-rate` | Australia's official interest rate | RBA (Cash Rate Target — F1/decision table) | RBA statistical table F1 (Cash Rate Target, daily) | per-change | 2026-10-22 | in-grace | context | exempt (AU block) / ok / ok | KEEP |
| `au-home-loan` | The home-loan rate people actually pay | RBA F6 (owner-occupier outstanding) | RBA F6 FLRHOOTA (owner-occupier outstanding, all institutions) | monthly | 2026-08-31 | in-grace | warning | exempt (AU block) / ok / ok | KEEP |
| `au-deposit-rate` | Savings rates (new term deposits) | RBA F4.1 (new term deposits) | RBA F4.1 PDRNTH (paid rate, new household term deposits) | monthly | 2026-08-31 | in-grace | context | exempt (AU block) / ok / ok | KEEP |
| `au-wage-growth` | Wage growth vs a year ago | ABS (Wage Price Index) | ABS WPI total hourly rates excluding bonuses (12-month % change) | quarterly | 2026-04-01 | in-grace | warning | exempt (AU block) / ok / ok | KEEP |
| `au-rent-yoy` | Rent growth vs a year ago | ABS (CPI Rents) | ABS CPI Rents index, monthly (12-month % change) | monthly | 2026-08-01 | in-grace | normal | exempt (AU block) / ok / ok | KEEP |
| `au-unemployment` | The share of Australians without work | ABS (Labour Force) | ABS Labour Force M13 (persons, SA, Australia) | monthly | 2026-09-01 | in-grace | warning | exempt (AU block) / ok / ok | KEEP |
| `au-home-values` | Australian home prices | ABS (RES_DWELL_ST) | ABS RES_DWELL_ST residential dwelling price index | quarterly | 2026-04-01 | in-grace | normal | exempt (AU block) / ok / ok | KEEP |
| `au-household-debt-arrears` | Australian household debt versus income | RBA E2 (household ratios) | RBA E2 'Household debt to income' (ABS-calculated ratios republished by the RBA) | quarterly | 2026-06-30 | in-grace | normal | exempt (AU block) / ok / ok | KEEP |
| `au-housing-finance` | New Australian home loans | Australian Bureau of Statistics (LEND_HOUSING, new h | ABS LEND_HOUSING/FIN_VAL.NEWCOMMITS.DV8368.TOTDWELL.TOT.TOT.20.AUS.Q (new housing loan commitments, total dwellings, SA, $ millions) | quarterly | 2026-04-01 | in-grace | normal | exempt (AU block) / ok / ok | KEEP |
| `au-saving-ratio` | The Australian household saving rate | Australian Bureau of Statistics (ANA_AGG, household  | ABS ANA_AGG/M7.HSR.20.AUS.Q (household saving ratio, seasonally adjusted, % of disposable income) | quarterly | 2026-04-01 | in-grace | context | exempt (AU block) / ok / ok | KEEP |
| `au-job-vacancies` | Australian job vacancies | Australian Bureau of Statistics (JV, job vacancies) | ABS JV/M1.7.TOT.20.AUS.Q (job vacancies, all sectors, seasonally adjusted, thousands) | quarterly | 2026-07-01 | in-grace | context | exempt (AU block) / ok / ok | KEEP |
| **australia · au-inflation-rates** | | | | | | | | | | |
| `au-cpi` | Australian prices vs a year ago | ABS (monthly CPI All groups) | ABS monthly CPI All groups index (annual change derived) | monthly | 2026-08-01 | in-grace | warning | exempt (AU block) / ok / ok | KEEP |
| `au-trimmed-mean` | Underlying inflation | ABS (monthly CPI Trimmed Mean) | ABS monthly CPI Trimmed Mean index (annual change derived) | monthly | 2026-08-01 | in-grace | warning | exempt (AU block) / ok / ok | KEEP |
| `au-10y` | What Australia pays to borrow for 10 years | RBA F2/F2.1 (10-year bond yield) | RBA F2 FCMYGBAG10D (daily) / F2.1 FCMYGBAG10 (monthly fallback) | daily | 2026-09-30 | in-grace | warning | exempt (AU block) / ok / ok | KEEP |
| `rba-expectations` | What markets expect from the RBA (3-year gap) | RBA F2 (FCMYGBAG3D) − RBA F1 | RBA F2 FCMYGBAG3D (3-year bond) − RBA F1 cash rate target | daily | 2026-09-30 | in-grace | normal | exempt (AU block) / ok / ok | KEEP |
| `au-us-10y-gap` | The gap between Australian and US 10-year borrowing | RBA F2 − FRED (DGS10) | RBA F2 10y − FRED:DGS10 | daily | 2026-09-30 | in-grace | warning | exempt (AU block) / ok / ok | KEEP |
| `au-petrol-yoy` | Petrol prices vs a year ago | ABS (CPI Automotive fuel) | ABS CPI Automotive fuel index (12-month % change) | monthly | 2026-08-01 | in-grace | context | exempt (AU block) / ok / ok | KEEP |
| **australia · au-trade-currency** | | | | | | | | | | |
| `audusd` | Australian dollar vs US dollar | Frankfurter (ECB) | 1 ÷ Frankfurter USD→AUD | daily | 2026-10-23 | in-grace | normal | ok (AU exempt from c1/c2) / ok / ok | KEEP; cross-link fx pair + card |
| `audjpy` | Australian dollar vs yen | Frankfurter (ECB) | Frankfurter USD→JPY ÷ USD→AUD | daily | 2026-10-23 | in-grace | normal | ok (AU exempt) / ok / ok | KEEP; cross-link fx pair + card |
| `terms-of-trade` | Australia's export prices vs import prices | ABS (ANA_AGG terms of trade) | ABS national accounts (ANA_AGG export ÷ import price index) | quarterly | 2026-04-01 | in-grace | normal | exempt (AU block) / ok / ok | KEEP |
| `iron-ore` | Iron ore price | The World Bank Pink Sheet — iron ore | World Bank Pink Sheet iron ore, cfr spot (FRED mirror PIORECRUSDM lags ~2 months) | monthly | 2026-09-01 | in-grace | context | exempt (AU block) / ok / ok | KEEP |
| `gold-aud` | Gold price in Australian dollars | gold-api.com × Frankfurter (ECB) | gold-api.com XAU × Frankfurter USD→AUD | daily | 2026-10-25 | in-grace | context | exempt (AU block) / ok / ok | KEEP |

**Surface-level duplicates (the owner's dedup request).** Four numbers currently have two surfaces: USD/JPY, USD/CNY, AUD/USD and AUD/JPY each appear both as an Insights card and as an fx-module pair, and the computed dollar measure appears as the basket card inside the fx module. Recommendation: keep both surfaces only if they cross-link (each fx pair row links to its card and vice versa); otherwise show once and link. Low priority; zero data cost either way. No other duplicates exist (ASX 200 appears once, on the markets board; the AU lane deliberately does not repeat it).

---

## 3. Proposed additions — verified sources, criteria, connections

### 3a. Highest priority (owner's list)

| Proposal | Verdict | Verified source | Cadence | Licence | Connections (cause → effect) |
|---|---|---|---|---|---|
| Yield curve 10y−2y (T10Y2Y) | **ALREADY PRESENT** (yield-curve-10y2y, scored) | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y2Y` — 0.31 @ 2026-10-23 | daily | public domain | Inversion → bank margins → credit → recession risk (6–24 months ahead historically) |
| Yield curve 10y−3m (T10Y3M) | **MISSING → APPROVED** | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y3M` — 0.78 @ 2026-10-23 | daily | public domain | The 3m leg is the Fed's own preferred recession lens; deep 3m inversions have preceded every modern US recession |
| DGS2 | ALREADY PRESENT (bundled: us-2y display + fed-expectations) | fredgraph.csv, 4.65 @ 2026-10-22 | daily | public domain | 2y minus policy rate = the market's expected Fed path (already scored as fed-expectations) |
| US unemployment + jobless claims | **ALREADY PRESENT** (UNRATE 4.2 @ Sep; ICSA 194k @ Oct 17) | fredgraph.csv both series | monthly / weekly | public domain | Labor cooling → Fed cuts → dollar/gold paths |
| Core PCE | **ALREADY PRESENT** (PCEPILFE 12m % = 3.0% @ Aug) | fredgraph.csv | monthly | public domain | Above the Fed's own 2% target → tighter-for-longer |
| Copper price + copper/gold | **ALREADY PRESENT, better than proposed** (daily gold-api HG ≈ US$6.53/lb ≈ US$14,400/mt; Pink Sheet history; FRED PCOPPUSDM 14,473 @ Sep available as cross-check) | `https://api.gold-api.com/price/HG` — verified 200 | daily | free API, commercial display permitted | Copper ↔ global factory demand ↔ AUD/commodity currencies |
| Fed balance sheet + M2 | **ALREADY PRESENT** (WALCL $6.75T @ Oct 21; M2SL $23.34T @ Aug) | fredgraph.csv both | weekly / monthly | public domain | Liquidity → risk-asset support; M2 contraction → long-run inflation drag |
| BoJ policy rate | ALREADY PRESENT as honest OECD mirror (BoJ's own feed is dead upstream: DNS/530 from both venues, repo M7 evidence) | FRED IRSTCI01JPM156N, 1.043 @ Sep (monthly avg) | monthly | FRED citation-required | Fed−BoJ gap → carry trade → USD/JPY |
| Japan 10y yield | **PRESENT but monthly-lagged → UPGRADE APPROVED (MOF daily)** | `https://www.mof.go.jp/english/jgbs/reference/interest_rate/jgbcme.csv` — 10y = 2.914 @ 2026-10-22 (verified live, keyless) | daily (next-business-day publish) | Japan MOF, free with attribution | JGB level → yen funding costs; steepening signals BoJ normalization pressure |
| US−Japan 10y gap | **MISSING → APPROVED** (derived: DGS10 − MOF 10y; both components verified) | derived, zero new fetches | daily | n/a | Gap narrowing < ~2pp → carry unwind risk → USD/JPY drops, world risk assets wobble (Aug-2024 pattern) |
| German Bund 10y | PARTLY PRESENT (monthly OECD mirror, honest label; daily euro-AAA from ECB). **Daily-Bund upgrade REJECTED** — ECB Data Portal carries no national benchmark yields (owner's assumption corrected); Bundesbank API unreachable; Eurostat `irt_lt_mcby` not disseminated here | mirror: FRED IRLTLT01DEM156N 3.47 @ Sep (monthly avg) | monthly | FRED citation-required | Bund ↔ ECB policy; EU fiscal stress gauge |
| OECD CLI | **MISSING → APPROVED** | `https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.1/all?format=csvfilewithlabels&startPeriod=2026-01` — verified 200 (773 KB) | monthly, ~5-week lag | OECD free with attribution | Leading edge → turns before GDP; replaces licensed ISM/S&P PMIs per the owner's goal |
| Financial stress (STLFSI4) | **ALREADY PRESENT** (−0.63 @ Oct 16) + NFCI too (−0.50) | fredgraph.csv | weekly | citation-required | Stress ↑ → VIX ↑, credit tightens, gold bid |
| HY credit spread (BAMLH0A0HYM2) | **REJECTED — licence fails.** Data exists on FRED (3.40 @ 2026-10-22) but the series page states "Copyrighted: Pre-Approval Required" and "Copyright, 2023, ICE Data Indices. Reproduction of this data in any form is prohibited except with the prior approval of ICE Data." The repo's standing OD-5 fail-close decision is confirmed. Coverage alternative already live: STLFSI4 + NFCI | fredgraph.csv (probe only) | weekly | **ICE, prohibited without written approval** | Credit spreads ↑ → lending tightens → equities fall (covered by the stress pair instead) |
| US 30y mortgage (MORTGAGE30US) | **ALREADY PRESENT** (7.32% @ Oct 22) | fredgraph.csv | weekly | citation-required | Mortgage rate ↑ → housing demand ↓ → construction/retail slow |

### 3b. Second tier (owner's list)

| Proposal | Verdict | Verified source | Cadence | Licence | Connections |
|---|---|---|---|---|---|
| CFTC positioning (gold, oil, dollar) | **MISSING → APPROVED** | `https://www.cftc.gov/dea/newcot/deafut.txt` — futures-only, verified 200; "GOLD - COMMODITY EXCHANGE INC." @ 2026-10-20 in file; WTI rows present; one file covers all three markets | weekly (Tuesday data, Friday publish) | US government, free | Crowded positioning → violent unwinds; extreme net-longs historically precede gold corrections |
| Central-bank gold buying (WGC) + ETF holdings | **REJECTED** — goldhub data page exposes no machine-readable links; GDT page 404; no login-free stable download verified | none | quarterly | gated | n/a |
| US crude inventories (EIA) | **MISSING → APPROVED** | `https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCRSTUS1&f=W` — verified 200 (the EIA v2 API works but needs a free registered key: 403 `API_KEY_MISSING` without one; the keyless website route needs no key) | weekly (Wednesday publish) | US government, free | Builds/draws → petrol price pressure; large draws → supply-squeeze bid |
| Bank of England rate | **ALREADY PRESENT** (own site, per-change; 3.75%) | `https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp` — verified 200 | per-change | UK OGL v3 | BoE ↔ gilt curve ↔ GBP |
| Euro-area inflation | **ALREADY PRESENT** (HICP 3.8% @ Sep, ECB dataset) | ECB Data Portal HICP series — verified 200 | monthly | ECB free with attribution | HICP vs 2% target → ECB path → EUR/USD |
| PBoC rate | **REJECTED** — no machine-readable feed (site 404s to this venue; BIS policy-rates API returns 500 from this venue). Precedent exists (china-pmi ran manual-entry for years) but adds manual burden for low analytical value | none | monthly | unverified | n/a |
| Geopolitical Risk Index | **MISSING → APPROVED** | `https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls` — verified 200 (2.7 MB XLS, monthly) | monthly | academic, free with attribution | GPR spike → oil/gold up, equities down, yields down |
| Economic Policy Uncertainty (US) | **MISSING → APPROVED** | `https://policyuncertainty.com/media/US_Policy_Uncertainty_Data.xlsx` — verified 200 (71 KB XLS, monthly; linked from `us_monthly.html`) | monthly | academic, free with attribution | EPU spike → investment/hiring pause; historically peaks around elections/shocks |
| Cboe put/call ratio | **REJECTED** — Cboe's free CSVs (`totalpc.csv`, `equitypc.csv`, archive) are frozen at Oct 2019 in this environment (verified: last data row 10/04/2019). No other official free source found. Sentiment is already covered by VIX + Michigan + crypto-fng | (stale) | would-be daily | n/a | n/a |
| BIS property price index | **REJECTED** — BIS API returns 500 from this venue on both policy-rate and property queries. AU is already covered by ABS RES_DWELL_ST (free, quarterly, current) | none | quarterly | unverified | n/a |
| Derived: 2y − Fed rate | **ALREADY PRESENT and scored** (fed-expectations, DGS2 − corridor midpoint) | derived | daily | n/a | The market's expected cuts/hikes, replacing paid CME FedWatch |
| Derived: gold/oil ratio | **MISSING → APPROVED** | derived from XAU and Brent (both collected) | daily | n/a | Long-run relative value between the two biggest commodities |
| Derived: copper/gold | **ALREADY PRESENT** (scored, growth lane) | World Bank Pink Sheet | monthly | CC BY 4.0 | Risk appetite gauge |
| Stock coverage: Europe / India / Taiwan | **ALL PRESENT** (DAX, Euro Stoxx 50, CAC 40, FTSE 100; Nifty 50; TAIEX on the board). The owner's Korea condition is therefore satisfied and KOSPI stays | markets board | daily | EODHD (owner key) + Yahoo (FTSE only; EODHD free plan does not serve FTSE, verified `[]`) | Regional risk appetite |

### 3c. Australian additions (owner's list)

| Proposal | Verdict | Verified source | Notes |
|---|---|---|---|
| RBA cash rate | **ALREADY PRESENT** (4.60%, daily F1/decision table) | RBA (venue: Actions runner) | Fresh through the Sep-2026 hike |
| RBA−Fed policy gap | **MISSING → APPROVED** (derived, zero fetches) | rba-cash-rate − fed-target midpoint | Completes the rate-gap leg beside AUD/USD; the 10y gap already exists |
| Trimmed-mean CPI | **ALREADY PRESENT** (3.6% @ Aug, monthly ABS) | ABS CPI flow 1.999902.20.50.M — verified 200 | The RBA's target measure |
| Unemployment rate | **ALREADY PRESENT** (4.7% @ Sep) | ABS LF M13.3.1599.20.AUS.M — verified 200 | |
| AU 10y + spread vs US | **ALREADY PRESENT** (5.28%; gap −0.01) | RBA F2 − FRED DGS10 | F2 publishes T+2..4 (weekly cadence by design) |
| Iron ore price | **ALREADY PRESENT** (US$97.7 Sep, Pink Sheet; FRED PIORECRUSDM 100.4 available as alternate) | World Bank | |
| Terms of trade | **ALREADY PRESENT** (94.8 @ Q2) | ABS ANA_AGG M5.TTR.20.AUS.Q — verified 200 | |
| RPPI | **ALREADY PRESENT** as au-home-values (ABS RES_DWELL_ST 1100.4 @ Q2; free, not CoreLogic) | ABS | |
| Household debt-to-income | **ALREADY PRESENT** (178.4 @ Q2, RBA E2). A dedicated mortgage-arrears series (RBA O6) was not separately verified; E2 covers the household ratios the card names | RBA E2 | |
| AUD/USD linked to iron ore/copper/rate gap | **PRESENT** (relationship card + audusd; strengthened by the RBA−Fed gap addition) | Frankfurter | |

### 3d. Removals / rethink (owner's list)

| Item | Verdict | Recommendation |
|---|---|---|
| Gold/Bitcoin, silver/Bitcoin | gold-btc is collected as a context reading that **never votes** and has no standalone card; silver-btc was never built | KEEP gold-btc as context/curiosity (it costs nothing: XAU÷BTC from the same feed); optionally carry a "curiosities" group label. Do NOT build silver-btc (fails criteria 2 and 4). Never in signals or gauges (already true) |
| Natural gas (Henry Hub) | PRESENT, labelled "US natural gas price (Henry Hub)" | KEEP as labelled US-only context (criterion 1 fails but the label is honest and the feed is free public-domain daily). Drop only if the owner wants strict criterion-1 enforcement; zero cost either way |
| Market breadth | Computed from the 16-index licensed board (EODHD-primary, Yahoo for FTSE only) | KEEP. It is transparently derived from the visible board, not scraped ad hoc. Not an official single-source breadth; the basis is stated |
| Duplicates across sections | Four pairs have two surfaces (see §2) | Cross-link or show-once; lowest priority |
| Korea as its own card | KOSPI on the board | KEEP (Europe + India + Taiwan are all covered, satisfying the owner's own condition) |
| Indicators fed by unofficial sources | Yahoo legs: FTSE (EODHD lacks it on the free plan, verified `[]`), Brent BZ=F fallback, metals/BTC fallbacks | All are labelled L2, fail-closed and attributed; EODHD-primary where available. No primary feed is unofficial except FTSE (justified by the EODHD gap; re-check the plan quarterly) |

---

## 4. Cause-and-effect map — shown on the page vs missing

| # | Connection | Mechanism (plain words) | Status on the page |
|---|---|---|---|
| 1 | Real 10y yield ↔ gold | Higher inflation-adjusted interest makes gold (no yield) less attractive | **SHOWN** — "Real yields and gold" relationship card (currently reading "2 of 2 match" via the gold beam; today: real yield 2.64% in its high band, leaning against gold) |
| 2 | Dollar ↔ gold ↔ oil | A stronger dollar makes commodities dearer in other currencies, damping demand | **SHOWN** — "The dollar, gold and oil" card + the basket card in the dollar lane |
| 3 | Oil ↔ breakevens ↔ borrowing costs | Oil up → expected inflation up → yields up | **SHOWN** — "Oil, inflation expectations and borrowing costs" card |
| 4 | Copper ↔ Chinese factories ↔ money | Copper demand signals factory activity; M2 funds it | **SHOWN** — "Copper demand, Chinese factories and money" card (2/2 match today: China PMI 50.1 + copper/gold ratio) |
| 5 | Iron ore ↔ terms of trade ↔ AUD | Iron-ore income drives Australia's export prices and its dollar | **SHOWN** — "Iron ore, the terms of trade and the Australian dollar" card |
| 6 | RBA rate ↔ home loans ↔ household debt | Policy passes through to the rates households actually pay | **SHOWN** — "The RBA rate, home loans and household debt" card (pass-through pending, honestly labelled) |
| 7 | 2y yield − Fed rate ↔ expected policy path | The gap prices coming cuts/hikes | **SHOWN** — fed-expectations card, scored (0.775 above the corridor midpoint) |
| 8 | AU−US 10y gap ↔ AUD | Yield gap drives carry flows into/out of Australia | **SHOWN** — au-us-10y-gap card beside au-10y (−0.01, warning today) |
| 9 | Wages vs inflation | Real wage pressure feeds the RBA's reaction function | **SHOWN** — paired inside the households lane (wage 3.2% vs CPI 4.0%, paired-comparison rule) |
| 10 | Deposit rate vs CPI (real savings return) | What savers actually earn after inflation | **SHOWN** — "What it means for my money" (+0.8 pts before tax) |
| 11 | US−Japan 10y gap ↔ USD/JPY | The carry trade lives on this gap; narrow gaps unwound violently (Aug 2024) | **MISSING** → spec A-2/A-3 (the gap card sits beside the existing USD/JPY card) |
| 12 | Yield curve (3m leg) ↔ recession probability | Deep 3m inversions preceded every modern US recession | **PARTIAL** — the 10y−2y leg is shown and scored; the 3m leg is missing → spec A-1 (pairs naturally with the existing recession-probability card, 62% today) |
| 13 | Gold/oil ratio ↔ commodity value cycle | How many barrels an ounce buys; long-run relative value | **MISSING** → spec A-4 |
| 14 | RBA−Fed policy gap ↔ AUD | Short-rate gap drives carry and import prices | **MISSING** → spec A-5 (the 10y version exists; the policy-rate version does not) |
| 15 | Crude stocks ↔ oil price | Inventory builds pressure petrol prices down and vice versa | **MISSING** → spec A-6 |
| 16 | CFTC positioning ↔ gold/oil extremes | Crowded speculative books unwind violently | **MISSING** → spec A-7 |
| 17 | OECD CLI ↔ growth lane | Composite leading index turns ahead of GDP | **MISSING** → spec A-8 (would sit beside china-pmi and CFNAI) |
| 18 | GPR / EPU ↔ risk assets | War and policy uncertainty spike → oil/gold up, equities down | **MISSING** → spec A-9/A-10 |
| 19 | M2 ↔ gold (long run) | Money contraction/growth frames the long-run inflation path | Both shown; **no dedicated link card** (optional future) |
| 20 | Copper ↔ AUD (direct) | Copper is one of Australia's key export metals | **PARTIAL** — covered indirectly through the iron-ore/terms-of-trade card; a direct copper leg is optional |

---

## 5. Build priority, KV and subrequest impact

**Platform constraints (verified from the repo's own records plus live limits).** Free Workers KV: 100,000 reads/day, 1,000 writes/day, and exactly one KV operation per Worker invocation on the serve path (the single `insights:snapshot` key design). Subrequests per invocation: 50 — the 04:10 UTC daily rung already runs at 48–49/50, so it is effectively full. The account's 1,000-write cap trips around 19:00 UTC from the ever-green rates app, which is exactly why the Insights runner is scheduled at 04:20 UTC. Every addition below is scheduled to respect these numbers.

| Priority | Addition (spec id) | New fetches | New KV cost | Where it runs |
|---|---|---|---|---|
| **P1** | A-1 yield-curve-10y3m (T10Y3M) | +0 (rides the existing FRED bundle; the FRED adapter already fetches T10Y2Y in the same group) | +1 row in `insights:snapshot`; history key best-effort | existing 04:10 rung |
| **P1** | A-2 jgb-10y daily upgrade (MOF) | +1/day (the mirror fetch it replaces is FRED-bundled, so net +1) | same key, better data | **04:25 rung** (the 04:10 shape is full) |
| **P1** | A-3 us-japan-10y-gap | 0 (derived in the runner) | +1 row | 04:25 rung |
| **P1** | A-5 rba-fed-gap | 0 (derived) | +1 row | 04:25 rung |
| **P2** | A-4 gold/oil ratio | 0 (derived) | +1 row | 04:25 rung |
| **P2** | A-6 eia-crude-stocks | +1/week | +1 row, weekly | Saturday 04:25 rung |
| **P2** | A-7 cftc positioning | +1/week (one file: gold + WTI + USD legs) | +1 row, weekly | Saturday 04:25 rung |
| **P3** | A-8 oecd-cli | +1/month | +1 row, monthly | first-of-month 04:25 rung |
| **P3** | A-9 gpr | +1/month | +1 row, monthly | first-of-month 04:25 rung |
| **P3** | A-10 epu-us | +1/month | +1 row, monthly | first-of-month 04:25 rung |

**Budget arithmetic after all ten additions.** Daily fetches rise from ~48–49 to at most 50 on the 04:10 rung (T10Y3M only) plus 1–2 on the 04:25 rung (MOF + derived, zero fetch for derived); weekly adds 2 on Saturdays; monthly adds 3 on the first of the month. KV writes: roughly 10 new history keys on change-detection, best-effort and self-healing, on top of the current ~26/day — around 36–46/day against the 1,000/day cap (more than 20× headroom). Reads do not change at all: the page still performs exactly one KV read per request (`insights:snapshot`), which is the binding constraint per invocation. No new KV keys are created; all additions extend the existing consolidated snapshot, per the owner's "a few combined keys" rule.

**Rejected additions cost nothing** and are documented in §3 so a future owner can revisit any of them if a source revives (for example ICE granting written permission, or Cboe unfreezing its CSVs).

---

## 6. Assumptions and things not verified

1. **AUDIT_ONLY held.** No site code, config, worker, schema or test was modified. The only repository writes are these two documents.
2. **Venue limits, honestly recorded.** RBA endpoints are Akamai-403 from this audit sandbox (long-documented); their freshness was instead verified through the live site's own readings (au-10y Sep 30, cash rate Oct 22, E2 Q2) and the repo's Actions-runner venue records. BIS returned 500 and PBoC 404 from this venue; both are recorded as rejections rather than retried from other venues. The Bundesbank API resolved DNS but never answered; recorded as not verified.
3. **Cboe put/call.** The free CSVs end at 10/04/2019 in this environment. If that reflects a temporary gap rather than a permanent freeze, the owner can revisit; today's verdict stands on the evidence.
4. **EIA.** The v2 API requires a free registered key (`API_KEY_MISSING` without one). The approved route uses the keyless `dnav` website tables (same route the repo already parses for Brent/WTI/Henry Hub), so no key and no registration is needed. If the owner ever prefers the v2 API, a free key is allowed under the standing "no paid data" rule but requires owner-side registration.
5. **MOF column mapping.** `jgbcme.csv` carries 15 maturity columns (1y…40y); the 10-year is the 10th yield column. The 2026-10-22 row reads 2.914 for 10y, consistent with the OECD mirror's September average of 3.05 (rates fell through October). A build should assert the header row (it names each maturity) rather than trusting column indices, per the repo's loud-parse discipline.
6. **OECD mirror trio.** Bund, JGB and gilt remain "monthly average, lagged" mirrors with honest labels. Only JGB gets a verified daily upgrade (MOF). The owner's request assumed the ECB Data Portal carries Bund yields; it does not (it carries the euro-area AAA curve, which the site already uses daily). This correction is recorded in §3a.
7. **Markets board lag.** The board shows the Oct 22 close while EODHD already serves Oct 23. The Friday rungs fetch before EODHD publishes the day's rows; a one-trading-day lag on free EOD feeds is the honest description. Consider adding one line to the About panel; no code change was made.
8. **Mortgage arrears.** `au-household-debt-arrears` is served from RBA E2 (household finance ratios). A dedicated arrears-percentage series (RBA O6-style) was not separately verified; the card's wording covers the ratios E2 actually publishes.
9. **EODHD quota.** The owner's key was used for six verification probes in this session (GSPC, AXJO twice, FTSE, plus two date-range checks). The site's own logs report 0 data requests on its rungs; the probes here are within free-tier norms and changed nothing on the site.
10. **Farsi.** The Farsi page was verified live: `dir=rtl`, Persian digits (۰–۹), Jalali fetch stamps (۱۴۰۵) and fa month names render correctly, with zero console errors. Farsi names in the spec use the vocabulary Iranian financial sites already use (TGJU-style terms).
11. **Numbers in this report** are the site's own served values as of the 2026-10-25 18:05 UTC snapshot and the 2026-10-23 01:30 UTC markets snapshot. They are recorded as served, not independently re-derived; the repo's own cross-check gates (zod contracts, venue probes, percentile validation) all report green.
