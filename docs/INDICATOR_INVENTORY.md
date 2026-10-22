# Currena — Complete Indicator & Data Inventory

> **Generated:** 2026-10-22 · **Verified against:** production (currena.ir live API + deployed client bundle) **and** repo truth (`data/indicators.json` v65, `data/site-mode-overrides.json`, `packages/insights/src/adapters/*`) at `main @ 8f9360e`.
> **Purpose:** the definitive "what do we currently track" list — the baseline for gap analysis (see `docs/GAP_ANALYSIS.md`).
> **Cross-check:** registry (65 ids) ⇄ production readings (62 public) ⇄ hidden set (`china-pmi`, `shiller-cape`, `shiller-ecy`) — all three agree exactly.

---

## Headline counts

| Surface | Count |
|---|---|
| **Insights economic indicators** | **65 total — 62 published + 3 hidden (collected, site-mode-gated)** |
| World stock indices (markets board) | 16 |
| FX module pairs | 10 (+1 dollar measure, +7 pattern rules) |
| Economic calendar events (next ~7 months) | 21 (7 recurring kinds) |
| Converter currencies — Iranian side (TGJU) | 17 incl. IRR (Toman) |
| Converter currencies — international (Frankfurter/ECB) | 30 incl. USD |
| Iranian gold & coin board items | 9 |
| Registered upstream providers (licence register) | 16 |
| Distinct upstream series/tables consumed | ~88 (FRED 30 · ABS 8 · RBA 8 tables · gold-api 8 (4 direct + 4 derived legs) · EODHD 15 · Frankfurter 10+30 · World Bank 6 · Treasury 4 · EIA 3 · Yahoo 2 · ECB 1 · Shiller 2 · Bitstamp 1 · Alternative.me 1 · NBS manual 1) |

---

## 1. The 65 insights indicators

Legend: **[HIDDEN]** = collected but withheld from the public site by `SITE_MODE=public` (owner can see them). Cadence = collect frequency. Provider = licence-register key.

### 1.1 GLOBAL — Borrowing costs (`borrowing-costs` gauge, 8 members)

| ID | Name (public copy) | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `yield-curve-10y2y` | The gap between 10-year and 2-year US borrowing | — | daily | fred | FRED T10Y2Y |
| `real-yield-10y` | US 10-year interest after inflation | — | daily | fred | FRED DFII10 |
| `us10y` | What the US government pays to borrow for 10 years | — | daily | fred | FRED DGS10 (+ Treasury.gov par-curve fallback) |
| `fed-target` | The US central bank's policy rate | — | daily | fred | FRED DFEDTARL/U |
| `fed-expectations` | What markets expect from the Fed | 2-year gap | daily | derived | FRED DGS2 − policy-rate midpoint |
| `us30y` | US 30-year Treasury yield | 30-year | daily | fred | FRED DGS30 (+ Treasury.gov fallback) |
| `ecb-dfr` | The euro area's policy rate | — | daily | ecb | ECB Data Portal FM/B.EUR.4F.KR.DFR.LEV |
| `govt-interest-revenue` | The US government's interest bill vs its income | — | quarterly | derived | FRED (BEA A091RC1Q027SBEA ÷ receipts) |

### 1.2 GLOBAL — Sovereign yields & policy rates outside gauges

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `bund-10y` | What the German government pays to borrow for 10 years | Bund | monthly | fred | OECD via FRED IRLTLT01DEM156N |
| `jgb-10y` | What the Japanese government pays to borrow for 10 years | JGB | monthly | fred | OECD via FRED IRLTLT01JPM156N |
| `gilt-10y` | What the UK government pays to borrow for 10 years | Gilt | monthly | fred | OECD via FRED IRLTLT01GBM156N |
| `boj-rate` | The Japanese central bank's policy rate | BoJ | monthly | fred | OECD via FRED IRSTCI01JPM156N (overnight call) |
| `boe-rate` | The UK central bank's policy rate | BoE | monthly | fred | OECD via FRED IRSTCI01GBM156N (overnight) |

### 1.3 GLOBAL — Prices & inflation (`prices-heat` gauge + details)

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `us-cpi-yoy` | US prices vs a year ago | CPI | monthly | fred | FRED CPIAUCNS (NSA) |
| `us-cpi-core-yoy` | Core inflation | Core CPI | monthly | fred | FRED CPILFENS (NSA) |
| `breakeven-5y5y` | Expected US inflation, five to ten years ahead | — | daily | fred | FRED T5YIFR |
| `brent` | Oil price (Brent) | — | daily | fred | FRED (EIA DCOILBRENTEU) + Yahoo BZ=F gapfill |

### 1.4 GLOBAL — Market stress (`market-stress` gauge, 4 members + hidden Shiller pair)

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `stress-stlfsi` | Stress in US money markets | — | weekly | fred | FRED STLFSI4 (St. Louis Fed) |
| `nfci` | US financial conditions | — | weekly | fred | FRED NFCI (Chicago Fed) |
| `vix` | Market fear gauge | VIX | daily | fred | FRED VIXCLS (Cboe) |
| `gold-silver` | Gold's price versus silver | — | daily | derived | gold-api.com (history: World Bank Pink Sheet) |
| `shiller-cape` **[HIDDEN]** | US share prices versus long-run earnings (Shiller CAPE) | — | monthly | shiller | Robert Shiller ie_data.xls |
| `shiller-ecy` **[HIDDEN]** | Excess CAPE Yield (Shiller) | — | monthly | shiller | Robert Shiller ie_data.xls |

### 1.5 GLOBAL — The US dollar (`dollar-strength` gauge + pairs)

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `dollar-basket` | The dollar vs six big currencies | — | daily | derived | Currena basket (ECB rates via Frankfurter) |
| `usdjpy` | Dollar vs yen | USD/JPY | daily | frankfurter | Frankfurter (ECB) |
| `eur-usd` | Euro per US dollar | EUR/USD | daily | frankfurter | Frankfurter (ECB) |
| `nzd-usd` | New Zealand dollar vs US dollar | — | daily | frankfurter | Frankfurter (ECB) |
| `usdcny` | Dollar vs Chinese yuan | USD/CNY | daily | frankfurter | Frankfurter (ECB) |

### 1.6 GLOBAL — Growth & health (`growth-health` gauge, 6 members)

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `china-pmi` **[HIDDEN]** | Chinese factory activity | — | manual | manual | China NBS (manual entry) |
| `philly-fed` | US factory survey (Philadelphia Fed) | Philly Fed | monthly | fred | FRED GACDFSA066MSFRBPHI |
| `m2-us` | The amount of money in the US economy | M2 money | monthly | fred | FRED M2SL |
| `us-unemployment` | US unemployment | BLS: UNRATE | monthly | fred | FRED UNRATE (US BLS) |
| `sahm-rule` | US recession alarm (Sahm rule) | Sahm rule | monthly | fred | FRED SAHMREALTIME |
| `copper-gold` | Copper's price versus gold | — | monthly | derived | World Bank Pink Sheet (copper ÷ gold) |

### 1.7 GLOBAL — Growth details

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `us-gdp-growth` | How fast the US economy is growing | GDP | quarterly | fred | FRED A191RL1Q225SBEA (BEA) |
| `us-nfp` | US jobs added or lost each month | NFP | monthly | derived | FRED PAYEMS (BLS, monthly change) |

### 1.8 GLOBAL — Prices board & crypto

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `wti` | Oil price (WTI) | WTI | daily | fred | FRED DCOILWTICO (EIA spot; EIA .xls fallback) |
| `natgas` | US natural gas price | — | daily | fred | FRED DHHNGSP (EIA Henry Hub; EIA fallback) |
| `gold-usd` | Gold price (ounce) | — | daily | gold-api | gold-api.com XAU |
| `silver-usd` | Silver price (ounce) | — | daily | gold-api | gold-api.com XAG |
| `copper-usd` | Copper price | — | daily | gold-api | gold-api.com HG (history: Pink Sheet) |
| `platinum` | Platinum price (ounce) | — | monthly | world-bank | Pink Sheet platinum |
| `btc-usd` | Bitcoin price | BTC | daily | gold-api | gold-api.com BTC (+ Bitstamp OHLC history) |
| `crypto-fng` | Crypto fear and greed | — | daily | alternative-me | Alternative.me F&G Index |
| `gold-btc` | Bitcoin priced in gold (BTC per ounce) | — | daily | derived | gold-api.com XAU ÷ BTC |
| `silver-btc` | Bitcoin priced in silver (BTC per ounce) | — | daily | derived | gold-api.com XAG ÷ BTC |

### 1.9 AUSTRALIA — Inflation & rates (`au-inflation-rates` gauge, 5 members)

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `au-cpi` | Australian prices vs a year ago | CPI | monthly | abs | ABS monthly CPI All groups |
| `au-trimmed-mean` | Underlying inflation | — | monthly | abs | ABS monthly CPI Trimmed Mean |
| `au-10y` | What Australia pays to borrow for 10 years | RBA F2: 10y | daily | rba | RBA F2/F2.1 (F2.1 monthly carries it during the Akamai 403) |
| `rba-expectations` | What markets expect from the RBA | 3-year gap | daily | derived | RBA F2 (FCMYGBAG3D) − RBA F1 |
| `au-us-10y-gap` | The gap between Australian and US 10-year borrowing | — | daily | derived | RBA F2 − FRED DGS10 |

### 1.10 AUSTRALIA — Households (`au-households` gauge, 6 members)

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `rba-cash-rate` | Australia's official interest rate | — | per-change | rba | RBA F1 / cash-rate decision table |
| `au-home-loan` | The home-loan rate people actually pay | — | monthly | rba | RBA F6 (owner-occupier outstanding) |
| `au-deposit-rate` | Savings rates (new term deposits) | RBA F4.1 | monthly | rba | RBA F4.1 |
| `au-wage-growth` | Wage growth vs a year ago | — | quarterly | abs | ABS Wage Price Index |
| `au-rent-yoy` | Rent growth vs a year ago | CPI: rents | monthly | abs | ABS CPI Rents |
| `au-unemployment` | The share of Australians without work | — | monthly | abs | ABS Labour Force |
| `au-home-values` | Australian home prices | — | quarterly | abs | ABS RES_DWELL_ST |
| `au-household-debt-arrears` | Australian household debt versus income | — | quarterly | rba | RBA E2 (household ratios) |

### 1.11 AUSTRALIA — Trade & currency (`au-trade-currency` gauge, 3 members + details)

| ID | Name | Ticker | Cadence | Provider | Upstream source |
|---|---|---|---|---|---|
| `audusd` | Australian dollar vs US dollar | AUD/USD | daily | derived | Frankfurter (ECB) |
| `audjpy` | Australian dollar vs yen | AUD/JPY | daily | derived | Frankfurter (ECB) |
| `terms-of-trade` | Australia's export prices vs import prices | — | quarterly | abs | ABS ANA_AGG |
| `iron-ore` | Iron ore price | — | monthly | world-bank | Pink Sheet iron ore |
| `gold-aud` | Gold price in Australian dollars | gold in A$ | daily | derived | gold-api.com × Frankfurter |

### 1.12 Hidden set (exact)

`data/site-mode-overrides.json` → `hiddenIndicatorIds: [china-pmi, shiller-cape, shiller-ecy]`, `hiddenBoards: []`. All three are still collected, validated, and stored; their `/api/insights/{id}/history` answers `hidden_site_mode` on the public site.

---

## 2. Insights page display modules

- **2 sections** — Global, Australia — each with a 4-step summary gauge (stable/cautious/stressed/critical), voting and warning counts.
- **8 gauge cards** (37 member slots): borrowing-costs(8) · prices-heat(3) · market-stress(4) · dollar-strength(2) · growth-health(6) · au-inflation-rates(5) · au-households(6) · au-trade-currency(3).
- **Prices board** — commodity/crypto tiles with the four hero price cards: **Gold, Silver, Brent, Bitcoin** (52-week range, records, references, 3m/1y/5y/10y charts; 1,900-day public history window).
- **Gold & Silver verdict panels** — driver scores: real yields, inflation expectations, market stress, the dollar, price footing (+ silver-only industrial leg via china-pmi/copper-gold).
- **6 "what this means for you" money cards** — petrol (brent, au-petrol-yoy, audusd) · homeLoan (rba-cash-rate, au-home-loan, au-rent-yoy, au-household-debt-arrears) · savings (au-deposit-rate, rba-cash-rate, au-cpi) · shop (au-cpi, au-trimmed-mean) · overseas (audusd, audjpy, dollar-basket) · jobs (au-unemployment, au-wage-growth).
- **6 "connections" rules** (30/90-day move windows): real-yields-gold (inverse) · dollar-gold-oil (inverse) · oil-expectations-costs (same) · copper-china-growth (same) · iron-terms-aud (same) · rba-loan-debt (same).
- **Per-indicator detail views** — 10-year percentile, move score, from-peak, last change, highest-since-year, honest source attribution (incl. readingSourceOverrides when a fallback leg filled), `/api/insights/{id}/history` series for public ids.
- **Pipeline status panel** — staleCount, failed sources, 14 validation tests (T-01…T-14).
- **changedThisWeek strip** — status transitions (e.g. brent warning→normal).
- **Economic calendar** — 21 events, .ics download.
- **Owner export** — `/api/insights/export?format=json` behind `INSIGHTS_OWNER_TOKEN`.

## 3. Markets board — 16 world stock indices (`/api/insights/markets`)

Per index: close, 1d/1w/1m/3m/1y/**5y** changes, 52w high/low, % from high, range position, trend word, bull/correction/bear status, weekly sparkline. Views: list · heatmap · quarterly; six period lenses (Today|1w|1m|3m|1y|5y); world-map verdict + breadth counters.

| Group | Indices | Source |
|---|---|---|
| Asia-Pacific | n225 Japan · asx200 Australia · kospi Korea · hsi Hong Kong · ssec China · taiex Taiwan · nifty50 India | EODHD |
| Europe | stoxx50 Eurozone · dax Germany · cac France · ftse UK | EODHD (ftse: Yahoo fallback leg) |
| Americas | sp500 · ndx · dow USA · tsx Canada · ibov Brazil | EODHD |

## 4. FX module — world currencies (`/api/insights/fx`)

- **Dollar measure** — Currena-computed DXY-style basket from ECB rates (value + 1d/1m/3m/1y + weekly history).
- **10 pairs** (rate, 1d/1m/3m/1y %chg, move-rank percentile, big-move flag): eurusd · usdjpy · gbpusd · usdchf · usdcny · audusd · audjpy · eurjpy · eurchf · audcny — all Frankfurter (ECB).
- **7 pattern rules** (13-week pattern check + progress meters): r1 risk mood · r2 carry trade · r3 dollar strength · r4 money hiding · r5 China link · r6 Europe worry · r7 dollar-or-euro.
- **Plain movers** — EUR/JPY/GBP/CNY/CHF/AUD monthly moves.

## 5. Economic calendar — 21 events, 7 kinds

FOMC · ECB · RBA rate decisions · US jobs reports · US CPI · ABS monthly CPI · ABS Labour Force — scheduled Oct 2026 → May 2027, EN/FA titles, per-event timezone, .ics export.

## 6. Converter & live rates (the Iranian-market surface)

- **TGJU snapshot (base IRR/Toman), live:** USD, EUR, GBP, AUD, CAD, AED, CNY, NZD, TRY, CHF, JPY, KRW, MYR, IDR, PHP, VND — day high/low in Toman; fetched from call1.tgju.org/ajax.json + profile pages.
- **Gold & coin board (Toman):** gold-ounce (USD) · gold-18k · gold-24k · gold-used · coin-emami · coin-bahar · coin-half · coin-quarter · coin-gram.
- **Frankfurter snapshot (base USD):** 30 currencies (ECB reference) — AUD BRL CAD CHF CNY CZK DKK EUR GBP HKD HUF IDR ILS INR ISK JPY KRW MXN MYR NOK NZD PHP PLN RON SEK SGD THB TRY ZAR.
- **Consumer tools:** converter (+ client-side rate alerts) · live-rates LED boards (currency + gold) · batch converter · calculator · history (personal, localStorage) · receipt generator · expense splitter · split & settle.

## 7. Upstream provider matrix (licence register, 16 keys)

| Provider (register key) | Licence posture | Feeds |
|---|---|---|
| `fred` | US public domain, citation | 30 series (FRED_BULK_GROUPS) incl. 5 OECD mirrors, 3 EIA mirrors, 2 BEA, 1 BLS |
| `treasury` | US public domain (L0) | FRED-fallback: daily par + real yield curve |
| `eia` | US public domain (L0) | FRED-fallback: WTI/Brent/Henry Hub .xls workbooks |
| `abs` | CC BY 4.0 | 8 Australian series |
| `rba` | CC BY 4.0 (with exclusion note) | 8 tables (F1, F2, F2.1, F4.1, F6, E2, cash-rate) |
| `frankfurter` | ECB reference rates (MIT code) | 10 FX-module pairs + 6 indicators + converter |
| `ecb` | ECB reproduction terms | ecb-dfr |
| `world-bank` | CC BY 4.0 | Pink Sheet: platinum, iron-ore, copper-gold, + history behind gold-api items |
| `gold-api` | Permissive API | gold, silver, copper, btc (+ 3 derived) |
| `eodhd` | Commercial API (owner key) | 15 of 16 market indices (+ chg5y supplements) |
| `yahoo` | Permissive read | ftse fallback, brent gapfill (BZ=F), chg5y supplements |
| `bitstamp` | Public API | BTC OHLC history |
| `alternative-me` | Public index | crypto-fng |
| `shiller` | Academic dataset (L1 — private only) | shiller-cape, shiller-ecy |
| `manual` | Per-entry bookkeeping (L1) | china-pmi |
| `derived` | Currena computed | 13 indicators + gauges/verdicts/rules |

## 8. Freshness snapshot (2026-10-22, 62 public readings)

| Age | Count | Items |
|---|---|---|
| 0–2 days | 29 | all FX, metals, crypto, oil, US yields, policy rates, VIX |
| 3–7 days | 2 | stress-stlfsi, nfci (weekly cadence) |
| 8–31 days | 4 | au-10y, rba-expectations, au-us-10y-gap (monthly F2.1), philly-fed |
| 32–92 days | 21 | US monthlies (CPI/core/unemp/sahm/nfp/M2), OECD monthlies (bund/jgb/gilt/boj/boe), copper-gold, platinum, iron-ore, AU monthlies (cpi/trimmed/petrol/rent/home-loan/deposit) |
| 93+ days | 6 | govt-interest-revenue, us-gdp-growth, au-wage-growth, au-home-values, terms-of-trade (Apr-2026 vintage), au-household-debt-arrears (Jun-2026) |

Pipeline status at capture: staleCount 1 (au-wage-growth, normal quarterly cadence), failed source rba (known F2 Akamai 403), validation 14/14.

## 9. Data already collected but not displayed (head start for any gap-fill)

These ride the existing ingest already — displaying them costs no new source work:

- **DGS2 (US 2-year)** — fetched daily in FRED bulk group 2 (+ Treasury fallback); used only as the `fed-expectations` leg.
- **T10YIE (US 10-year breakeven)** — fetched daily in bulk group 2; used only for T-01 validation reconciliation.
- **Pink Sheet full workbook** — the monthly .xlsx carries **~70 commodity columns + 7 aggregate indices**; today only 6 columns are parsed (brent, iron ore, copper, gold, silver, platinum).
- **Frankfurter's full ECB list** — 30 currencies served; the FX module shows 10 pairs.
- **gold-api symbol space** — XPT (platinum) and XPD (palladium) both answer (verified 2026-10-22); only XAU/XAG/HG/BTC are consumed.
- **The hidden trio** — china-pmi, shiller-cape, shiller-ecy: collected, validated, stored, gated.

---

*Regenerate this inventory: production payloads under `/api/insights*` + `scripts/generate-indicators-registry.ts` output (`data/indicators.json`, `data/site-mode-overrides.json`). Companion document: `docs/GAP_ANALYSIS.md` (missing & suggested indicators).*
