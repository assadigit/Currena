# Layer 1 — Indicator inventory (built from code)

The single source of truth for "what is an indicator on the Insights page."
Built directly from `packages/insights/src/definitions.ts` (100 indicators),
`packages/insights/src/markets/definitions.ts` (16 world stock indices) and
`packages/insights/src/fx/definitions.ts` (10 FX pairs + 7 FX pattern cards).

**Total: 133 table rows → 129 unique Layer-1 entries** (100 indicators +
16 markets + 17 FX rows; the four ids that appear both as an FX pair AND an
indicator — `usdjpy`, `audusd`, `usdcny`, `audjpy` — get ONE Layer-1 entry
each, shared by both surfaces; the dollar-basket is one of the 100
indicators). Counting method: unique ids written / 129 (see D-13).

The `L1` column tracks Layer-1 copy status: `✓` written, `·` pending.
The accessor list `LAYER1_INDICATOR_IDS` in
`apps/web/src/components/insights/layer1/index.ts` is generated from this
inventory and enforced by gate G1.

## A. The 100 indicators (48 voting [V] + 52 context [C])

### GLOBAL (77 indicators, 32 voting) — section: `global`

#### `borrowing-costs` gauge (18)
| L1 | id | official name | what it measures |
|---|---|---|---|
| ✓ | `yield-curve-10y2y` | US 10Y minus 2Y yield | The gap between 10-year and 2-year US Treasury yields (yield-curve shape). |
| ✓ | `yield-curve-10y3m` | US 10Y minus 3M yield | The gap between 10-year and 3-month US Treasury yields (the Fed's preferred curve leg). |
| ✓ | `real-yield-10y` | US 10-year real yield | The yield on 10-year inflation-protected US Treasuries (return after inflation). |
| ✓ | `us10y` | US 10-year Treasury yield | The market interest rate on 10-year US government debt. |
| ✓ | `us30y` | US 30-year Treasury yield | The 30-year US Treasury yield (the long end of the US curve). |
| ✓ | `fed-target` | Federal funds target rate | The Fed's main policy rate (the target-range midpoint). |
| ✓ | `ecb-dfr` | ECB deposit facility rate | The ECB's main policy rate (the rate banks earn on deposits at the ECB). |
| ✓ | `fed-expectations` | What markets expect from the Fed (2-year gap) | The 2-year Treasury-implied path of Fed rates vs the target. |
| ✓ | `govt-interest-revenue` | US government interest payments / receipts | US federal interest cost as a share of receipts. |
| ✓ | `us-2y` | US 2-year Treasury yield | The 2-year US Treasury yield (near-term rate expectations). |
| ✓ | `sofr` | The overnight funding rate (SOFR) | The overnight borrowing rate that replaced LIBOR in US markets. |
| ✓ | `mortgage-30y` | The US 30-year home-loan rate | The average US 30-year fixed mortgage rate. |
| ✓ | `jgb-10y` | Japan 10-year government bond yield | The 10-year Japanese government bond yield. |
| ✓ | `bund-10y` | German 10-year government bond yield | The 10-year German government bond yield (euro-area benchmark). |
| ✓ | `gilt-10y` | UK 10-year government bond yield | The 10-year UK government bond yield. |
| ✓ | `euro-aaa-10y` | What the safest euro-area governments pay for 10 years | The 10-year AAA euro-area government bond yield. |
| ✓ | `boe-rate` | Bank of England policy rate (overnight) | The Bank of England's main policy rate (Bank Rate). |
| ✓ | `boj-rate` | Bank of Japan policy rate (overnight) | The Bank of Japan's main policy rate. |

#### `dollar-strength` gauge (5)
| L1 | id | official name | what it measures |
|---|---|---|---|
| ✓ | `dollar-basket` | Currena dollar basket | A weighted basket of 7 currencies vs the US dollar (DXY-style). |
| ✓ | `usdjpy` | USD/JPY | The US dollar in Japanese yen. |
| ✓ | `us-japan-10y-gap` | US−Japan 10Y yield gap | The gap between 10-year US and Japanese yields (the carry trade's fuel). |
| ✓ | `eur-usd` | EUR/USD | The euro in US dollars. |
| ✓ | `usdtry` | Dollar vs Turkish lira | The US dollar in Turkish lira (an emerging-market pressure gauge). |

#### `growth-health` gauge (23)
| L1 | id | official name | what it measures |
|---|---|---|---|
| ✓ | `us-unemployment` | US unemployment rate | The share of the US labour force without a job. |
| ✓ | `sahm-rule` | US recession alarm (Sahm rule) | A recession trigger based on the rise in US unemployment. |
| ✓ | `china-pmi` | China manufacturing PMI | China's manufacturing purchasing-managers index (expansion/contraction). |
| ✓ | `china-cpi` | China inflation (yearly) | China's consumer-price inflation, year-on-year. |
| ✓ | `copper-gold` | Copper / Gold | The copper price divided by the gold price (a growth-vs-fear ratio). |
| ✓ | `michigan-sentiment` | US consumer mood (Michigan survey) | The University of Michigan consumer sentiment index. |
| ✓ | `initial-jobless-claims` | New unemployment claims (US) | Weekly new US claims for unemployment benefits. |
| ✓ | `philly-fed` | Philadelphia Fed manufacturing index | The Philly Fed's monthly factory-activity gauge. |
| ✓ | `recession-probability` | US recession probability | A model-based 12-month US recession probability. |
| ✓ | `oecd-cli-us` | OECD leading indicator (US) | The OECD composite leading indicator for the US. |
| ✓ | `m2-us` | US M2 money supply | The US broad money supply. |
| ✓ | `retail-sales` | US retail sales (monthly) | US retail and food-services sales. |
| ✓ | `housing-permits` | US building permits | New US residential building permits authorized. |
| ✓ | `job-openings` | US job openings (JOLTS) | The number of open US jobs (JOLTS survey). |
| ✓ | `us-gdp-growth` | US economic growth (real GDP) | US real gross-domestic-product growth. |
| ✓ | `us-nfp` | US jobs added each month | US nonfarm payrolls (monthly change in employment). |
| ✓ | `usdcny` | USD/CNY | The US dollar in Chinese yuan. |
| ✓ | `michigan-1y-expectations` | US expected inflation next year (Michigan) | The Michigan survey's 1-year-ahead US inflation expectation. |
| ✓ | `cfnai` | US economic activity scorecard (Chicago Fed) | The Chicago Fed National Activity Index. |
| ✓ | `oecd-cli-cn` | OECD leading indicator (China) | The OECD composite leading indicator for China. |
| ✓ | `oecd-cli-de` | OECD leading indicator (Germany) | The OECD composite leading indicator for Germany. |
| ✓ | `epu-us` | US policy uncertainty (EPU) | The US Economic Policy Uncertainty index. |
| ✓ | `copper-usd` | Copper price | The copper spot price (USD). |

#### `market-stress` gauge (10)
| L1 | id | official name | what it measures |
|---|---|---|---|
| ✓ | `stress-stlfsi` | St. Louis Fed Financial Stress Index | The St. Louis Fed's financial-stress index. |
| ✓ | `nfci` | Chicago Fed National Financial Conditions Index | The Chicago Fed's financial-conditions index. |
| ✓ | `vix` | Market fear gauge (VIX) | The Cboe Volatility Index (S&P 500 option-implied volatility). |
| ✓ | `gold-silver` | Gold / Silver | The gold price divided by the silver price. |
| ✓ | `cftc-gold-positioning` | Trader positioning in gold (COT) | Net non-commercial positioning in US gold futures (CFTC COT). |
| ✓ | `walcl` | The Fed's balance sheet | The size of the US Federal Reserve's balance sheet. |
| ✓ | `crypto-fng` | Crypto Fear and Greed Index | A sentiment gauge for crypto markets. |
| ✓ | `shiller-cape` | US share prices versus long-run earnings (Shiller CAPE) | The Shiller cyclically-adjusted price/earnings ratio for the S&P 500. |
| ✓ | `shiller-ecy` | Excess CAPE Yield (Shiller) | The earnings yield of CAPE minus the real 10-year Treasury yield. |
| ✓ | `gpr-index` | Geopolitical Risk Index | The Caldara-Iacoviello geopolitical-risk index. |

#### `prices-board` strip (5)
| L1 | id | official name | what it measures |
|---|---|---|---|
| ✓ | `brent` | Brent oil | The Brent crude oil price. |
| ✓ | `gold-usd` | Gold price (ounce) | The gold spot price in US dollars per troy ounce. |
| ✓ | `silver-usd` | Silver price (ounce) | The silver spot price in US dollars per troy ounce. |
| ✓ | `btc-usd` | Bitcoin price | The Bitcoin price in US dollars. |
| ✓ | `gold-btc` | Bitcoin priced in gold (BTC per ounce) | The gold price of one Bitcoin (gold ounces per BTC). |

#### `prices-heat` gauge (16)
| L1 | id | official name | what it measures |
|---|---|---|---|
| ✓ | `us-cpi-yoy` | US inflation (yearly) | US consumer-price inflation, year-on-year. |
| ✓ | `us-pce-core-yoy` | US core inflation by the Fed's gauge (PCE) | US core PCE inflation, year-on-year (the Fed's preferred gauge). |
| ✓ | `euro-hicp` | Euro-area inflation (yearly) | Euro-area HICP inflation, year-on-year. |
| ✓ | `breakeven-5y5y` | Inflation expectations (5y5y forward) | The 5-year/5-year-forward inflation breakeven (expected inflation). |
| ✓ | `us-cpi-core-yoy` | US core inflation (yearly) | US core CPI inflation (ex food and energy), year-on-year. |
| ✓ | `us-wages` | US wage growth (yearly) | US average hourly earnings, year-on-year. |
| ✓ | `breakeven-10y` | Expected US inflation, ten years ahead | The 10-year US inflation breakeven (expected inflation). |
| ✓ | `t5yie` | Expected US inflation, five years ahead | The 5-year US inflation breakeven. |
| ✓ | `wti` | WTI crude oil | The WTI crude oil price. |
| ✓ | `natgas` | US natural gas (Henry Hub) | The US natural-gas price (Henry Hub). |
| ✓ | `eia-crude-stocks` | US crude oil inventories | US weekly commercial crude-oil stocks. |
| ✓ | `platinum` | Platinum price (ounce) | The platinum spot price in US dollars per troy ounce. |
| ✓ | `gold-oil-ratio` | Gold measured in oil | The gold price divided by the oil price (ounces per barrel). |
| ✓ | `food-index` | World food prices | The World Bank food price index. |
| ✓ | `wheat` | Wheat price | The wheat price (US SRW, $/mt). |
| ✓ | `maize` | Maize price | The maize price ($/mt). |

### AUSTRALIA (23 indicators, 16 voting) — section: `australia`

#### `au-inflation-rates` gauge (6)
| L1 | id | official name | what it measures |
|---|---|---|---|
| ✓ | `au-cpi` | Australian CPI (annual change) | Australian consumer-price inflation, year-on-year. |
| ✓ | `au-trimmed-mean` | Australian trimmed-mean inflation | Australia's "underlying" inflation (CPI trimmed mean), year-on-year. |
| ✓ | `au-10y` | Australian 10-year government bond yield | The 10-year Australian government bond yield. |
| ✓ | `rba-expectations` | What markets expect from the RBA (3-year gap) | The 3-year bond-implied path of RBA rates. |
| ✓ | `au-us-10y-gap` | Australia vs US 10-year yield gap | The gap between 10-year Australian and US yields. |
| ✓ | `au-petrol-yoy` | Petrol prices vs a year ago | Australian petrol prices, year-on-year. |

#### `au-households` gauge (11)
| L1 | id | official name | what it measures |
|---|---|---|---|
| · | `au-unemployment` | Australian unemployment rate | The share of Australia's labour force without a job. |
| · | `au-wage-growth` | Wage growth (yearly) | Australian wage-price-index growth, year-on-year. |
| · | `au-rent-yoy` | Rent inflation (yearly) | Australian rent inflation, year-on-year. |
| · | `au-home-loan` | Home-loan rate people actually pay | The average outstanding owner-occupier mortgage rate. |
| · | `au-home-values` | Australian residential property price index | The ABS residential property price index. |
| · | `au-household-debt-arrears` | Australian household finances (debt ratios / arrears) | The RBA household arrears ratio. |
| · | `au-housing-finance` | New Australian home loans (quarterly) | The value of new Australian housing-finance commitments. |
| · | `au-deposit-rate` | Savings rates (new term deposits) | The average new term-deposit rate. |
| · | `rba-cash-rate` | RBA cash rate | The Reserve Bank of Australia's main policy rate. |
| · | `au-job-vacancies` | Australian job vacancies | The number of open Australian jobs. |
| · | `au-saving-ratio` | The Australian household saving ratio | The share of disposable income Australian households save. |

#### `au-trade-currency` gauge (6)
| L1 | id | official name | what it measures |
|---|---|---|---|
| · | `audusd` | AUD/USD | The Australian dollar in US dollars. |
| · | `audjpy` | AUD/JPY | The Australian dollar in Japanese yen. |
| · | `terms-of-trade` | Terms of trade | Australia's export prices divided by import prices. |
| · | `rba-fed-gap` | RBA−Fed policy rate gap | The gap between the RBA cash rate and the Fed target rate. |
| · | `gold-aud` | Gold price in AUD | The gold spot price in Australian dollars. |
| · | `iron-ore` | Iron ore price | The iron-ore price (a key Australian export). |

## B. The 16 world stock indices (markets board)
| L1 | id | name | group |
|---|---|---|---|
| · | `n225` | Nikkei 225 | asia |
| · | `asx200` | ASX 200 | asia |
| · | `kospi` | KOSPI | asia |
| · | `hsi` | Hang Seng | asia |
| · | `ssec` | Shanghai Composite | asia |
| · | `taiex` | TAIEX | asia |
| · | `nifty50` | Nifty 50 | asia |
| · | `stoxx50` | Euro Stoxx 50 | europe |
| · | `dax` | DAX | europe |
| · | `cac` | CAC 40 | europe |
| · | `ftse` | FTSE 100 | europe |
| · | `sp500` | S&P 500 | americas |
| · | `ndx` | Nasdaq 100 | americas |
| · | `dow` | Dow Jones | americas |
| · | `tsx` | S&P/TSX | americas |
| · | `ibov` | Bovespa | americas |

## C. The FX board (10 pairs + 7 pattern cards)
| L1 | id | what it is |
|---|---|---|
| · | `eurusd` | EUR/USD pair (dollar-world group) |
| ✓ | `usdjpy` | USD/JPY pair (shared with indicators) |
| · | `gbpusd` | GBP/USD pair |
| · | `usdchf` | USD/CHF pair |
| ✓ | `usdcny` | USD/CNY pair (shared with indicators) |
| · | `audusd` | AUD/USD pair (shared with indicators) |
| · | `audjpy` | AUD/JPY pair (warning-lights group) |
| · | `eurjpy` | EUR/JPY pair (warning-lights group) |
| · | `eurchf` | EUR/CHF pair (warning-lights group) |
| · | `audcny` | AUD/CNY pair (china-link group) |
| · | `r1_risk_mood` | Pattern: AUD/JPY and S&P 500 together (risk mood) |
| · | `r2_carry_trade` | Pattern: USD/JPY and Nikkei together (carry trade) |
| · | `r3_dollar_strength` | Pattern: dollar vs gold opposite |
| · | `r4_money_hiding` | Pattern: S&P 500 vs dollar+gold opposite |
| · | `r5_china_link` | Pattern: AUD/USD vs USD/CNY opposite |
| · | `r6_europe_worry` | Pattern: EUR/CHF vs Euro Stoxx 50 together |
| · | `r7_dollar_or_euro` | Pattern: EUR/USD vs dollar opposite |

## Maintenance

When an indicator is added/removed/renamed in
`packages/insights/src/definitions.ts` (or the markets/fx definitions),
this table, `LAYER1_INDICATOR_IDS`, and the Layer-1 copy must all move
together (gate G1 fails otherwise — by design, so a new indicator can
never ship without its plain-language copy).
