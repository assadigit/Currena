# Page-division placement — the authoritative table (GENERATED)

> **Generated file — do not edit by hand.** Regenerate with `pnpm placement:generate`
> (scripts/generate-placement-table.ts) from `data/indicators.json` v4 + the spec §14 rules encoded in `packages/insights/src/page-division/placement.ts` (the mirror sets derive from the engine’s own tables — GAUGES + GOLD_LANE_VOTERS — so this table cannot drift from the engine silently).
> Page-division Session 2/30 · 2026-11-08 · drift is recorded as audit findings below, never silently fixed (AGENT-RULES.md §5).

## Reconciliation — 184 ids + 6 boards

| Check | Result |
|---|---|
| Registry ids (`data/indicators.json` v4) | 184 |
| Placed (one home each — blocked notes included) | 184 |
| Unplaced | 0 |
| Duplicate homes | 0 |
| Unknown ids (placement ∖ registry) | 0 |
| Mirror/home overlaps | 0 |
| Boards | 6 — 4 served + the Prices live overlay + Companies (flag OFF) |

**Verdict: reconciles** — zero unplaced, zero duplicate homes. The spec’s own hand-count drift is recorded as the audit findings AF-1…AF-5 below.

| Page | Route | Registry cards | Mirror inputs | Boards | Decisions |
|---|---|---|---|---|---|
| global | `/` | 0 | 52 | World Markets board · FX board | D-4 · D-7 · D-10 · D-11 · D-21…D-25 |
| gold | `/gold` | 14 + 4 blocked | 34 | — | D-5 · D-26…D-29 |
| world-markets | `/world-markets` | 9 | 0 | World Markets board | D-13 · D-43 · D-47 |
| usa | `/usa` | 72 | 14 | World Markets board · TIC board | D-14 · D-29…D-32 · D-44 |
| europe | `/europe` | 8 | 0 | World Markets board | D-15 · D-33 · D-34 |
| asia-pacific | `/asia-pacific` | 11 | 0 | World Markets board | D-16 · D-17 · D-35 · D-36 |
| australia | `/australia` | 28 | 5 | AU Markets board | D-6 · D-37 |
| commodities | `/commodities` | 24 | 0 | — | D-2 · D-19 · D-38…D-40 |
| currencies | `/currencies` | 14 | 0 | FX board | D-18 · D-32 · D-41 · D-42 |

Count check: 0 + 14 + 4 blocked + 9 + 72 + 8 + 11 + 28 + 24 + 14 = **184 registry ids placed** (+ 0 unplaced). Dual-membership ids keep ONE home each (spec §14); engine membership is untouched (spec §3.3).

## Per-page membership

### global — `/`

> 0 registry cards · 52 mirror inputs · boards: World Markets board · FX board · D-4 · D-7 · D-10 · D-11 · D-21…D-25

Zero registry cards by design (verdict board only, D-7/D-11 — every tile is a display of an engine value, linking out).

**Mirror inputs (52)** — Verdict-board inputs (D-21): the five thematic gauges’ voters, the gold meter’s 37 voters (the Gold Balance tile + the dedollar tile’s usd-reserve-share/nyfed-custody), and the ribbon’s gold-usd + btc-usd (brent arrives as a prices-heat voter).

| id | title | registry area | home page |
|---|---|---|---|
| `yield-curve-10y2y` | US 10Y minus 2Y yield | global/borrowing-costs | usa |
| `yield-curve-10y3m` | US 10Y minus 3M yield | global/borrowing-costs | usa |
| `fed-expectations` | What markets expect from the Fed (2-year gap) | global/borrowing-costs | usa |
| `real-yield-10y` | US 10-year real yield | global/borrowing-costs | usa |
| `real-yield-5y` | US 5-year real yield | global/borrowing-costs | usa |
| `us10y` | US 10-year Treasury yield | global/borrowing-costs | usa |
| `us30y` | US 30-year Treasury yield | global/borrowing-costs | usa |
| `fed-target` | Federal funds target rate | global/borrowing-costs | usa |
| `ecb-dfr` | ECB deposit facility rate | global/borrowing-costs | europe |
| `govt-interest-revenue` | US government interest payments / receipts | global/borrowing-costs | usa |
| `us-cpi-yoy` | US inflation (yearly) | global/prices-heat | usa |
| `us-pce-core-yoy` | US core inflation by the Fed’s gauge (PCE) | global/prices-heat | usa |
| `euro-hicp` | Euro-area inflation (yearly) | global/prices-heat | europe |
| `breakeven-5y5y` | Inflation expectations (5y5y forward) | global/prices-heat | usa |
| `michigan-5y-expectations` | US expected inflation, next 5–10 years (Michigan) | global/prices-heat | usa |
| `brent` | Brent oil | global/prices-board | commodities |
| `stress-stlfsi` | St. Louis Fed Financial Stress Index | global/market-stress | usa |
| `nfci` | Chicago Fed National Financial Conditions Index | global/market-stress | usa |
| `vix` | Market fear gauge (VIX) | global/market-stress | usa |
| `gold-silver` | Gold / Silver | global/market-stress | gold |
| `cftc-gold-positioning` | Trader positioning in gold (COT) | global/market-stress | gold |
| `cftc-gold-gross-long` | Gold long positioning (COT) | global/market-stress | gold |
| `bank-stress` | The Fed’s discount window rate | global/market-stress | usa |
| `dollar-basket` | Currena dollar basket | global/dollar-strength | currencies |
| `dollar-broad` | Broad trade-weighted dollar | global/dollar-strength | currencies |
| `dollar-eme` | EME trade-weighted dollar | global/dollar-strength | currencies |
| `usdjpy` | USD/JPY | global/dollar-strength | currencies |
| `us-japan-10y-gap` | US−Japan 10Y yield gap | global/dollar-strength | currencies |
| `china-pmi` | China manufacturing PMI | global/growth-health | asia-pacific |
| `china-cpi` | China inflation (yearly) | global/growth-health | asia-pacific |
| `philly-fed` | Philadelphia Fed manufacturing index | global/growth-health | usa |
| `initial-jobless-claims` | New unemployment claims (US) | global/growth-health | usa |
| `oecd-cli-us` | OECD leading indicator (US) | global/growth-health | usa |
| `us-unemployment` | US unemployment rate | global/growth-health | usa |
| `sahm-rule` | US recession alarm (Sahm rule) | global/growth-health | usa |
| `recession-probability` | US recession probability | global/growth-health | usa |
| `michigan-sentiment` | US consumer mood (Michigan survey) | global/growth-health | usa |
| `copper-gold` | Copper / Gold | global/growth-health | gold |
| `usd-reserve-share` | USD share of world FX reserves | global/dedollar-concentration | currencies |
| `nyfed-custody` | Foreign official holdings at the New York Fed (weekly) | global/borrowing-costs | usa |
| `term-premium-10y` | US 10-year term premium | global/market-stress | usa |
| `ebp` | Excess bond premium (EBP) | global/market-stress | usa |
| `gpr-daily` | Geopolitical Risk (7-day average) | global/market-stress | world-markets |
| `epu-us` | US policy uncertainty (EPU) | global/growth-health | usa |
| `sp500-breadth-ratio` | S&P 500 equal-weight vs cap-weight (ratio) | global/dedollar-concentration | usa |
| `breakeven-tilt` | Breakeven tilt (forward minus spot) | global/prices-heat | usa |
| `t5yie` | Expected US inflation, five years ahead | global/prices-heat | usa |
| `michigan-1y-expectations` | US expected inflation next year (Michigan) | global/growth-health | usa |
| `m2-us` | US M2 money supply | global/growth-health | usa |
| `us-deficit-12m` | US federal deficit (12-month total) | global/borrowing-costs | usa |
| `gold-usd` | Gold price (ounce) | global/prices-board | gold |
| `btc-usd` | Bitcoin price | global/prices-board | commodities |

### gold — `/gold`

> 14 registry cards + 4 blocked notes · 34 mirror inputs · boards: none · D-5 · D-26…D-29

| id | title | registry area | group | role |
|---|---|---|---|---|
| `gold-usd` | Gold price (ounce) | global/prices-board | ratios | home |
| `gold-silver` | Gold / Silver | global/market-stress | ratios | home |
| `gold-btc` | Bitcoin priced in gold (BTC per ounce) | global/prices-board | ratios | home |
| `gold-aud` | Gold price in AUD | australia/au-trade-currency | ratios | home |
| `gold-oil-ratio` | Gold measured in oil | global/prices-heat | ratios | home |
| `gold-platinum` | Gold to platinum ratio | global/market-stress | ratios | home |
| `real-gold-price` | The real gold price (CPI-deflated) | global/market-stress | ratios | home |
| `copper-gold` | Copper / Gold | global/growth-health | ratios | home |
| `gold-equities-ratio` | Gold vs equities (GLD/SPY) | global/prices-heat | ratios | home |
| `cftc-gold-positioning` | Trader positioning in gold (COT) | global/market-stress | flows-positioning | home |
| `cftc-gold-gross-long` | Gold long positioning (COT) | global/market-stress | flows-positioning | home |
| `sge-gold-withdrawals` | SGE gold withdrawals (monthly) | global/market-stress | flows-positioning | home |
| `swiss-gold-flow` | Swiss gold imports (monthly) | global/market-stress | flows-positioning | home |
| `shanghai-gold-premium` | Shanghai gold premium | global/market-stress | flows-positioning | home |
| `wgc-etf-holdings` | Gold ETF holdings | global/market-stress | blocked-notes | blocked-note — WGC licence class (L3): needs prior written authorisation — the draft is the owner's lever (docs/insights/LICENCES.md). |
| `wgc-cb-demand` | Central bank gold demand | global/market-stress | blocked-notes | blocked-note — WGC licence class (L3): same authorisation gate as wgc-etf-holdings. |
| `official-gold-demand` | Official-sector gold demand | global/market-stress | blocked-notes | blocked-note — PBoC English URL 404 — venue re-find pending (fail closed until then). |
| `etf-short-interest` | Gold ETF short interest | global/market-stress | blocked-notes | blocked-note — No licence-clean venue for ETF short interest. |

**Mirror inputs (34)** — Seat-chip inputs (spec §5.2): the gold meter’s voters whose homes are elsewhere — each seat renders name · lean · evidence word, linking to the seat’s home card.

| id | title | registry area | home page |
|---|---|---|---|
| `real-yield-10y` | US 10-year real yield | global/borrowing-costs | usa |
| `us10y` | US 10-year Treasury yield | global/borrowing-costs | usa |
| `us30y` | US 30-year Treasury yield | global/borrowing-costs | usa |
| `fed-target` | Federal funds target rate | global/borrowing-costs | usa |
| `fed-expectations` | What markets expect from the Fed (2-year gap) | global/borrowing-costs | usa |
| `ecb-dfr` | ECB deposit facility rate | global/borrowing-costs | europe |
| `real-yield-5y` | US 5-year real yield | global/borrowing-costs | usa |
| `dollar-basket` | Currena dollar basket | global/dollar-strength | currencies |
| `usdjpy` | USD/JPY | global/dollar-strength | currencies |
| `us-japan-10y-gap` | US−Japan 10Y yield gap | global/dollar-strength | currencies |
| `usd-reserve-share` | USD share of world FX reserves | global/dedollar-concentration | currencies |
| `nyfed-custody` | Foreign official holdings at the New York Fed (weekly) | global/borrowing-costs | usa |
| `dollar-broad` | Broad trade-weighted dollar | global/dollar-strength | currencies |
| `dollar-eme` | EME trade-weighted dollar | global/dollar-strength | currencies |
| `stress-stlfsi` | St. Louis Fed Financial Stress Index | global/market-stress | usa |
| `nfci` | Chicago Fed National Financial Conditions Index | global/market-stress | usa |
| `vix` | Market fear gauge (VIX) | global/market-stress | usa |
| `term-premium-10y` | US 10-year term premium | global/market-stress | usa |
| `ebp` | Excess bond premium (EBP) | global/market-stress | usa |
| `michigan-sentiment` | US consumer mood (Michigan survey) | global/growth-health | usa |
| `gpr-daily` | Geopolitical Risk (7-day average) | global/market-stress | world-markets |
| `epu-us` | US policy uncertainty (EPU) | global/growth-health | usa |
| `sp500-breadth-ratio` | S&P 500 equal-weight vs cap-weight (ratio) | global/dedollar-concentration | usa |
| `bank-stress` | The Fed’s discount window rate | global/market-stress | usa |
| `us-cpi-yoy` | US inflation (yearly) | global/prices-heat | usa |
| `us-pce-core-yoy` | US core inflation by the Fed’s gauge (PCE) | global/prices-heat | usa |
| `euro-hicp` | Euro-area inflation (yearly) | global/prices-heat | europe |
| `breakeven-5y5y` | Inflation expectations (5y5y forward) | global/prices-heat | usa |
| `breakeven-tilt` | Breakeven tilt (forward minus spot) | global/prices-heat | usa |
| `t5yie` | Expected US inflation, five years ahead | global/prices-heat | usa |
| `michigan-1y-expectations` | US expected inflation next year (Michigan) | global/growth-health | usa |
| `m2-us` | US M2 money supply | global/growth-health | usa |
| `us-deficit-12m` | US federal deficit (12-month total) | global/borrowing-costs | usa |
| `michigan-5y-expectations` | US expected inflation, next 5–10 years (Michigan) | global/prices-heat | usa |

Group notes:
- **ratios** — gold-usd is the hero card (live hourly overlay via the serve-time prices merge).
- **flows-positioning** — shanghai-gold-premium stays context-only — never a voter (§16).

### world-markets — `/world-markets`

> 9 registry cards · 0 mirror inputs · boards: World Markets board · D-13 · D-43 · D-47

| id | title | registry area | group | role |
|---|---|---|---|---|
| `gpr-index` | Geopolitical Risk Index | global/market-stress | world-risk | home |
| `gpr-threats` | Geopolitical Risk — threats | global/market-stress | world-risk | home |
| `gpr-acts` | Geopolitical Risk — acts | global/market-stress | world-risk | home |
| `gpr-daily` | Geopolitical Risk (7-day average) | global/market-stress | world-risk | home |
| `gpr-russia` | Geopolitical Risk — Russia | global/market-stress | world-risk | home |
| `gpr-ukraine` | Geopolitical Risk — Ukraine | global/market-stress | world-risk | home |
| `gpr-israel` | Geopolitical Risk — Israel | global/market-stress | world-risk | home |
| `gpr-saudi` | Geopolitical Risk — Saudi Arabia | global/market-stress | world-risk | home |
| `global-liquidity` | Global liquidity (Fed + ECB + BoJ) | global/market-stress | world-risk | home |

### usa — `/usa`

> 72 registry cards · 14 mirror inputs · boards: World Markets board · TIC board · D-14 · D-29…D-32 · D-44

| id | title | registry area | group | role |
|---|---|---|---|---|
| `fed-target` | Federal funds target rate | global/borrowing-costs | tier-1-world-watches | home |
| `fed-expectations` | What markets expect from the Fed (2-year gap) | global/borrowing-costs | tier-1-world-watches | home |
| `us-cpi-yoy` | US inflation (yearly) | global/prices-heat | tier-1-world-watches | home |
| `us-pce-core-yoy` | US core inflation by the Fed’s gauge (PCE) | global/prices-heat | tier-1-world-watches | home |
| `us-nfp` | US jobs added each month | global/growth-health | tier-1-world-watches | home |
| `us-unemployment` | US unemployment rate | global/growth-health | tier-1-world-watches | home |
| `us10y` | US 10-year Treasury yield | global/borrowing-costs | tier-1-world-watches | home |
| `yield-curve-10y2y` | US 10Y minus 2Y yield | global/borrowing-costs | tier-2-rates-fed | home |
| `yield-curve-10y3m` | US 10Y minus 3M yield | global/borrowing-costs | tier-2-rates-fed | home |
| `real-yield-10y` | US 10-year real yield | global/borrowing-costs | tier-2-rates-fed | home |
| `real-yield-5y` | US 5-year real yield | global/borrowing-costs | tier-2-rates-fed | home |
| `real-curve-10y5y` | US real yield curve (10Y minus 5Y) | global/borrowing-costs | tier-2-rates-fed | home |
| `us30y` | US 30-year Treasury yield | global/borrowing-costs | tier-2-rates-fed | home |
| `us-2y` | US 2-year Treasury yield | global/borrowing-costs | tier-2-rates-fed | home |
| `sofr` | The overnight funding rate (SOFR) | global/borrowing-costs | tier-2-rates-fed | home |
| `mortgage-30y` | The US 30-year home-loan rate | global/borrowing-costs | tier-2-rates-fed | home |
| `nyfed-custody` | Foreign official holdings at the New York Fed (weekly) | global/borrowing-costs | tier-2-rates-fed | home |
| `us-deficit-monthly` | US federal deficit (monthly) | global/borrowing-costs | tier-2-rates-fed | home |
| `us-deficit-12m` | US federal deficit (12-month total) | global/borrowing-costs | tier-2-rates-fed | home |
| `treasury-auction-10y` | US 10-year Treasury auction demand | global/borrowing-costs | tier-2-rates-fed | home |
| `treasury-auction-10y-indirect` | US 10-year auction indirect share | global/borrowing-costs | tier-2-rates-fed | home |
| `treasury-auction-30y` | US 30-year Treasury auction demand | global/borrowing-costs | tier-2-rates-fed | home |
| `treasury-auction-30y-indirect` | US 30-year auction indirect share | global/borrowing-costs | tier-2-rates-fed | home |
| `rstar-us` | US r-star (HLW estimate) | global/borrowing-costs | tier-2-rates-fed | home |
| `debt-to-gdp` | US federal debt to GDP | global/borrowing-costs | tier-2-rates-fed | home |
| `govt-interest-revenue` | US government interest payments / receipts | global/borrowing-costs | tier-2-rates-fed | home |
| `us-cpi-core-yoy` | US core inflation (yearly) | global/prices-heat | tier-3-inflation | home |
| `median-cpi` | US median inflation (Cleveland Fed) | global/prices-heat | tier-3-inflation | home |
| `sticky-cpi` | US sticky-price inflation (Atlanta Fed) | global/prices-heat | tier-3-inflation | home |
| `us-wages` | US wage growth (yearly) | global/prices-heat | tier-3-inflation | home |
| `t5yie` | Expected US inflation, five years ahead | global/prices-heat | tier-3-inflation | home |
| `breakeven-5y5y` | Inflation expectations (5y5y forward) | global/prices-heat | tier-3-inflation | home |
| `breakeven-10y` | Expected US inflation, ten years ahead | global/prices-heat | tier-3-inflation | home |
| `breakeven-tilt` | Breakeven tilt (forward minus spot) | global/prices-heat | tier-3-inflation | home |
| `cpi-nowcast` | US CPI nowcast (Cleveland Fed) | global/prices-heat | tier-3-inflation | home |
| `cpi-surprise` | US CPI surprise (print vs nowcast) | global/prices-heat | tier-3-inflation | home |
| `michigan-5y-expectations` | US expected inflation, next 5–10 years (Michigan) | global/prices-heat | tier-3-inflation | home |
| `michigan-1y-expectations` | US expected inflation next year (Michigan) | global/growth-health | tier-3-inflation | home |
| `initial-jobless-claims` | New unemployment claims (US) | global/growth-health | tier-4-labor-growth | home |
| `continuing-claims` | Americans on unemployment benefits | global/growth-health | tier-4-labor-growth | home |
| `job-openings` | US job openings (JOLTS) | global/growth-health | tier-4-labor-growth | home |
| `sahm-rule` | US recession alarm (Sahm rule) | global/growth-health | tier-4-labor-growth | home |
| `recession-probability` | US recession probability | global/growth-health | tier-4-labor-growth | home |
| `michigan-sentiment` | US consumer mood (Michigan survey) | global/growth-health | tier-4-labor-growth | home |
| `oecd-cli-us` | OECD leading indicator (US) | global/growth-health | tier-4-labor-growth | home |
| `philly-fed` | Philadelphia Fed manufacturing index | global/growth-health | tier-4-labor-growth | home |
| `empire-state` | Empire State manufacturing survey | global/growth-health | tier-4-labor-growth | home |
| `cfnai` | US economic activity scorecard (Chicago Fed) | global/growth-health | tier-4-labor-growth | home |
| `gdpnow` | US growth nowcast (GDPNow) | global/growth-health | tier-4-labor-growth | home |
| `us-gdp-growth` | US economic growth (real GDP) | global/growth-health | tier-4-labor-growth | home |
| `retail-sales` | US retail sales (monthly) | global/growth-health | tier-4-labor-growth | home |
| `housing-permits` | US building permits | global/growth-health | tier-4-labor-growth | home |
| `epu-us` | US policy uncertainty (EPU) | global/growth-health | tier-4-labor-growth | home |
| `tpu-us` | US trade policy uncertainty | global/growth-health | tier-4-labor-growth | home |
| `m2-us` | US M2 money supply | global/growth-health | tier-4-labor-growth | home |
| `walcl` | The Fed’s balance sheet | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `tga` | US Treasury General Account | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `reverse-repo` | Fed overnight reverse repo (RRP) | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `bank-reserves` | US bank reserves at the Fed | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `repo-stress` | Repo funding pressure (SOFR minus IORB) | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `net-liquidity` | US net liquidity | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `stress-stlfsi` | St. Louis Fed Financial Stress Index | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `nfci` | Chicago Fed National Financial Conditions Index | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `vix` | Market fear gauge (VIX) | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `bank-stress` | The Fed’s discount window rate | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `ebp` | Excess bond premium (EBP) | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `ofr-fsi` | OFR Financial Stress Index | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `sloos-ci-tightening` | Banks tightening business lending (SLOOS) | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `term-premium-10y` | US 10-year term premium | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `shiller-cape` | US share prices versus long-run earnings (Shiller CAPE) | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `shiller-ecy` | Excess CAPE Yield (Shiller) | global/market-stress | tier-5-liquidity-stress-valuation | home |
| `sp500-breadth-ratio` | S&P 500 equal-weight vs cap-weight (ratio) | global/dedollar-concentration | tier-5-liquidity-stress-valuation | home |

**Mirror inputs (14)** — Verdict-strip inputs (D-30): the five thematic gauges’ non-USA voters — the same computed verdicts as Global, US-framed copy.

| id | title | registry area | home page |
|---|---|---|---|
| `ecb-dfr` | ECB deposit facility rate | global/borrowing-costs | europe |
| `euro-hicp` | Euro-area inflation (yearly) | global/prices-heat | europe |
| `brent` | Brent oil | global/prices-board | commodities |
| `gold-silver` | Gold / Silver | global/market-stress | gold |
| `cftc-gold-positioning` | Trader positioning in gold (COT) | global/market-stress | gold |
| `cftc-gold-gross-long` | Gold long positioning (COT) | global/market-stress | gold |
| `dollar-basket` | Currena dollar basket | global/dollar-strength | currencies |
| `dollar-broad` | Broad trade-weighted dollar | global/dollar-strength | currencies |
| `dollar-eme` | EME trade-weighted dollar | global/dollar-strength | currencies |
| `usdjpy` | USD/JPY | global/dollar-strength | currencies |
| `us-japan-10y-gap` | US−Japan 10Y yield gap | global/dollar-strength | currencies |
| `china-pmi` | China manufacturing PMI | global/growth-health | asia-pacific |
| `china-cpi` | China inflation (yearly) | global/growth-health | asia-pacific |
| `copper-gold` | Copper / Gold | global/growth-health | gold |

Group notes:
- **tier-1-world-watches** — The seven numbers the planet reacts to first (D-29; the F9↔F12 reconciliation moved dollar-basket to Currency Pairs by D-32).
- **tier-2-rates-fed** — Spec §7 labels this tier "(22)" while listing 19 ids — AF-2 in the audit findings.
- **tier-3-inflation** — michigan-1y-expectations is AF-3: absent from every spec §7/§14 list (the 184th id) — placed here beside its 5y twin per evident intent; OWNER RATIFICATION PENDING.
- **tier-4-labor-growth** — Spec §7 labels this tier "(19)" while listing 17 ids — AF-2.

### europe — `/europe`

> 8 registry cards · 0 mirror inputs · boards: World Markets board · D-15 · D-33 · D-34

| id | title | registry area | group | role |
|---|---|---|---|---|
| `ecb-dfr` | ECB deposit facility rate | global/borrowing-costs | eu-members | home |
| `euro-hicp` | Euro-area inflation (yearly) | global/prices-heat | eu-members | home |
| `euro-aaa-10y` | What the safest euro-area governments pay for 10 years | global/borrowing-costs | eu-members | home |
| `bund-10y` | German 10-year government bond yield | global/borrowing-costs | eu-members | home |
| `btp-bund-spread` | Italy–Germany 10-year spread | global/borrowing-costs | eu-members | home |
| `oecd-cli-de` | OECD leading indicator (Germany) | global/growth-health | eu-members | home |
| `gilt-10y` | UK 10-year government bond yield | global/borrowing-costs | non-eu-uk | home |
| `boe-rate` | Bank of England policy rate (overnight) | global/borrowing-costs | non-eu-uk | home |

Group notes:
- **eu-members** — + the §15 FRED-only fills land with S12 (D-34) after live verification.
- **non-eu-uk** — FTSE rides the markets board (the Europe zoom map).

### asia-pacific — `/asia-pacific`

> 11 registry cards · 0 mirror inputs · boards: World Markets board · D-16 · D-17 · D-35 · D-36

| id | title | registry area | group | role |
|---|---|---|---|---|
| `china-pmi` | China manufacturing PMI | global/growth-health | china | home |
| `china-cpi` | China inflation (yearly) | global/growth-health | china | home |
| `oecd-cli-cn` | OECD leading indicator (China) | global/growth-health | china | home |
| `gpr-china` | Geopolitical Risk — China | global/market-stress | china | home |
| `gpr-taiwan` | Geopolitical Risk — Taiwan | global/market-stress | china | home |
| `china-property-investment` | China property investment (year-to-date, yearly) | australia/au-trade-currency | china | home |
| `china-steel-output` | China crude steel output (monthly) | australia/au-trade-currency | china | home |
| `jgb-10y` | Japan 10-year government bond yield | global/borrowing-costs | japan | home |
| `boj-rate` | Bank of Japan policy rate (overnight) | global/borrowing-costs | japan | home |
| `nz-short-rate` | New Zealand short-term interest rate (monthly average) | australia/au-external | pacific-nz | home |
| `nz-10y` | New Zealand 10-year government bond yield | australia/au-external | pacific-nz | home |

Group notes:
- **china** — china-property-investment + china-steel-output moved in from the AU page (D-35); SGE links point to /gold.
- **japan** — + the Japan CPI fill lands with S14 (D-36, verify-first).
- **korea-taiwan-hk** — Index-only today (KOSPI · TAIEX · HSI on the markets board); the Korea CPI fill lands with S14 (D-36).
- **india** — Index-only today (NIFTY50 on the markets board); the India CPI fill lands with S14 (D-36).
- **pacific-nz** — New Zealand lives here (D-17); NZX50 rides the markets board.

### australia — `/australia`

> 28 registry cards · 5 mirror inputs · boards: AU Markets board · D-6 · D-37

| id | title | registry area | group | role |
|---|---|---|---|---|
| `au-cpi` | Australian CPI (annual change) | australia/au-inflation-rates | au-inflation-rates | home |
| `au-trimmed-mean` | Australian trimmed-mean inflation | australia/au-inflation-rates | au-inflation-rates | home |
| `rba-expectations` | What markets expect from the RBA (3-year gap) | australia/au-inflation-rates | au-inflation-rates | home |
| `au-10y` | Australian 10-year government bond yield | australia/au-inflation-rates | au-inflation-rates | home |
| `au-us-10y-gap` | Australia vs US 10-year yield gap | australia/au-inflation-rates | au-inflation-rates | home |
| `au-petrol-yoy` | Petrol prices vs a year ago | australia/au-inflation-rates | au-inflation-rates | home |
| `au-home-loan` | Home-loan rate people actually pay | australia/au-households | au-households | home |
| `au-wage-growth` | Wage growth (yearly) | australia/au-households | au-households | home |
| `au-rent-yoy` | Rent inflation (yearly) | australia/au-households | au-households | home |
| `au-household-debt-arrears` | Australian household finances (debt ratios / arrears) | australia/au-households | au-households | home |
| `au-unemployment` | Australian unemployment rate | australia/au-households | au-households | home |
| `au-home-values` | Australian residential property price index | australia/au-households | au-households | home |
| `au-housing-finance` | New Australian home loans (quarterly) | australia/au-households | au-households | home |
| `rba-cash-rate` | RBA cash rate | australia/au-households | au-households | home |
| `au-deposit-rate` | Savings rates (new term deposits) | australia/au-households | au-households | home |
| `au-saving-ratio` | The Australian household saving rate | australia/au-households | au-households | home |
| `au-job-vacancies` | Australian job vacancies | australia/au-households | au-households | home |
| `rba-fed-gap` | RBA−Fed policy rate gap | australia/au-trade-currency | au-trade-currency | home |
| `terms-of-trade` | Terms of trade | australia/au-trade-currency | au-trade-currency | home |
| `au-trade-balance` | Australian goods trade balance | australia/au-external | au-external | home |
| `au-gdp-growth` | Australian economic growth (real GDP) | australia/au-activity | au-activity | home |
| `au-household-spending` | Australian household spending (annual change) | australia/au-activity | au-activity | home |
| `au-building-approvals` | Australian dwelling approvals | australia/au-activity | au-activity | home |
| `au-population-growth` | Australian population growth | australia/au-activity | au-activity | home |
| `au-participation` | Australian participation rate | australia/au-activity | au-activity | home |
| `au-underemployment` | Australian underemployment rate | australia/au-activity | au-activity | home |
| `au-nom` | Net overseas migration | australia/au-activity | au-activity | home |
| `gpr-australia` | Geopolitical Risk — Australia | global/market-stress | au-world-risk | home |

**Mirror inputs (5)** — Seat-chip inputs (spec §10): the AU gauges’ moved-out members (D-32/D-35/D-42) — the chips remain in the gauges, linking to the new homes.

| id | title | registry area | home page |
|---|---|---|---|
| `audusd` | AUD/USD | australia/au-trade-currency | currencies |
| `audjpy` | AUD/JPY | australia/au-trade-currency | currencies |
| `audnzd` | AUD/NZD | australia/au-external | currencies |
| `nz-short-rate` | New Zealand short-term interest rate (monthly average) | australia/au-external | asia-pacific |
| `nz-10y` | New Zealand 10-year government bond yield | australia/au-external | asia-pacific |

Group notes:
- **au-trade-currency** — audusd · audjpy (and the context cards iron-ore · coal-aus · lng-japan · china-property-investment · china-steel-output · gold-aud) moved out per D-32/D-19/D-35/D-27 — their gauge seat chips remain (mirrors below).
- **au-external** — audnzd · nz-short-rate · nz-10y moved out (D-17/D-35/D-42); seat chips remain.
- **au-world-risk** — AF-4: a GLOBAL-section registry id whose page home is Australia (the GPR-family wrap-up note 5) — placement is display-layer; the registry section is engine-side.

### commodities — `/commodities`

> 24 registry cards · 0 mirror inputs · boards: none · D-2 · D-19 · D-38…D-40

| id | title | registry area | group | role |
|---|---|---|---|---|
| `brent` | Brent oil | global/prices-board | energy | home |
| `wti` | WTI crude oil | global/prices-heat | energy | home |
| `natgas` | US natural gas (Henry Hub) | global/prices-heat | energy | home |
| `gas-europe` | European natural gas price | global/prices-heat | energy | home |
| `lng-japan` | LNG price (Japan) | australia/au-trade-currency | energy | home |
| `coal-aus` | Australian coal price | australia/au-trade-currency | energy | home |
| `eia-crude-stocks` | US crude oil inventories | global/prices-heat | energy | home |
| `us-spr` | US strategic petroleum reserve | global/geo-fragmentation | energy | home |
| `us-crude-production` | US crude oil production | global/geo-fragmentation | energy | home |
| `silver-usd` | Silver price (ounce) | global/prices-board | metals | home |
| `platinum` | Platinum price (ounce) | global/prices-heat | metals | home |
| `copper-usd` | Copper price | global/growth-health | metals | home |
| `iron-ore` | Iron ore price | australia/au-trade-currency | metals | home |
| `food-index` | World food prices | global/prices-heat | agriculture | home |
| `wheat` | Wheat price | global/prices-heat | agriculture | home |
| `maize` | Maize price | global/prices-heat | agriculture | home |
| `btc-usd` | Bitcoin price | global/prices-board | digital | home |
| `crypto-fng` | Crypto Fear and Greed Index | global/market-stress | digital | home |
| `chokepoint-suez` | Suez Canal transits | global/geo-fragmentation | trade-routes-supply | home |
| `chokepoint-panama` | Panama Canal transits | global/geo-fragmentation | trade-routes-supply | home |
| `chokepoint-bab-el-mandeb` | Bab el-Mandeb transits | global/geo-fragmentation | trade-routes-supply | home |
| `chokepoint-malacca` | Strait of Malacca transits | global/geo-fragmentation | trade-routes-supply | home |
| `chokepoint-taiwan` | Taiwan Strait transits | global/geo-fragmentation | trade-routes-supply | home |
| `gscpi` | Global supply chain pressure | global/geo-fragmentation | trade-routes-supply | home |

Group notes:
- **energy** — brent (with gold · silver · BTC) carries the live hourly overlay via the serve-time prices merge.
- **metals** — Commodity PRICES only — their gold ratios stay on /gold (D-27).
- **digital** — BTC also rides the Global ribbon (D-22); gold-btc stays on /gold (D-27).

### currencies — `/currencies`

> 14 registry cards · 0 mirror inputs · boards: FX board · D-18 · D-32 · D-41 · D-42

| id | title | registry area | group | role |
|---|---|---|---|---|
| `dollar-basket` | Currena dollar basket | global/dollar-strength | dollar-standing | home |
| `dollar-broad` | Broad trade-weighted dollar | global/dollar-strength | dollar-standing | home |
| `dollar-eme` | EME trade-weighted dollar | global/dollar-strength | dollar-standing | home |
| `us-japan-10y-gap` | US−Japan 10Y yield gap | global/dollar-strength | dollar-standing | home |
| `usdtry` | Dollar vs Turkish lira | global/dollar-strength | dollar-standing | home |
| `usdaed` | Dollar vs UAE dirham | global/dollar-strength | dollar-standing | home |
| `usd-reserve-share` | USD share of world FX reserves | global/dedollar-concentration | dollar-standing | home |
| `usdjpy` | USD/JPY | global/dollar-strength | pairs | home |
| `eur-usd` | EUR/USD | global/dollar-strength | pairs | home |
| `usdchf` | USD/CHF | global/dollar-strength | pairs | home |
| `usdcny` | USD/CNY | global/growth-health | pairs | home |
| `audusd` | AUD/USD | australia/au-trade-currency | pairs | home |
| `audjpy` | AUD/JPY | australia/au-trade-currency | pairs | home |
| `audnzd` | AUD/NZD | australia/au-external | pairs | home |

Group notes:
- **dollar-standing** — The dollar-strength verdict tops the USA page (D-30) — its detail cards live HERE (verdicts mirror; detail cards don't).
- **pairs** — Registry pair cards; the 11-pair BOARD (incl. AUDNZD, D-42) rides the fx snapshot. Gold crosses stay on /gold (D-18).

## Boards (spec §14’s boards line)

| Board | Rows | Home / feeds | Endpoint |
|---|---|---|---|
| FX board | 10 pairs + 7 rule lights (R1–R7) | `/currencies` (the 11th pair AUDNZD joins at S18, D-42) | `GET /api/insights/fx` |
| World Markets board | 16 indexes | `/world-markets` · zoom maps on USA / Europe / Asia & Pacific (D-44) · the Global World-Markets tile | `GET /api/insights/markets` |
| AU Markets board | 19 symbols | `/australia` | `GET /api/insights/markets-au` |
| Prices live board | 4 assets + companion ratios | the serve-time merge → Global ribbon (D-22) · Gold hero · Commodities live | rides `GET /api/insights` + `GET /api/insights/pages/:page` |
| TIC board | 21 foreign holders | `/usa` (D-31, "who finances America") | `GET /api/insights/tic` |
| Companies board | 49 | PARKED — feature-flag OFF (spec §16, EODHD free quota) | — |

## Audit findings (drift — recorded, never silently fixed)

- **AF-1 (amber)** — Spec §2's count line "~72 + 13 + 9 + 8 + 11 + 28 + 24 + 14 = 184" sums to 179, and §2's table says Gold has 13 cards while §5/§14 list 14 (gold-usd included). The authoritative arithmetic: 14 + 4 blocked + 9 + 72 + 8 + 11 + 28 + 24 + 14 = 184. This table is the authority (spec §14: "the lists below are the spec's intent; the generator reconciles").
- **AF-2 (amber)** — Spec §7's tier labels hand-count drift from their own lists: tier 2 says "(22)" but lists 19 ids; tier 3 says "(13)" but lists 11 (+1 with AF-3 = 12); tier 4 says "(19)" but lists 17. Tiers 1 (7) and 5 (17) match their lists. Recorded, not corrected in the spec.
- **AF-3 (amber)** — michigan-1y-expectations (registry id · prices-heat group · the gold meter's inflation-lane voter I3) is absent from every §7/§14 list — the 184th id. The generator places it in USA tier-3 (Inflation) beside michigan-5y-expectations per evident intent. OWNER RATIFICATION PENDING (same pattern as S1's /converter decision).
- **AF-4 (info)** — gpr-australia: counted in the AU page's 28 homes (§10) while the registry carries it in the GLOBAL section (geo-fragmentation group). Both are true at their layers — placement is display-layer (D-6 + the GPR-family wrap-up note 5); the registry area is engine-side (spec §3.3). No action.
- **AF-5 (info)** — Spec §10's gauge numbers (au-inflation-rates 6 · au-households 11 · au-trade-currency 10 · au-activity 7 · au-external 4 = 38) are the registry DISPLAY-group counts; the engine's scored AU gauge voters are 26 (5 · 7 · 4 · 6 · 4). Both true at their layers — the page renders registry groups; the gauge verdicts score the engine's voters. Recorded so neither gets "fixed" into the other.

---

*End of generated file. Regeneration re-derives everything from `data/indicators.json` + `packages/insights/src/page-division/placement.ts`; the sync test (`packages/insights/src/page-division/doc.test.ts`) fails if this committed file drifts from the module.*
