# Currena Insights — self-check export

- What the world’s money is doing: plain-language gauges, prices and indicators.
- Data as of: 2026-10-19
- Rule version: 2

## Summary of the gauges below

| Indicator | Status | Details |
| --- | --- | --- |
| Global | Stressed | 5 of 23 in warning |
| Australia | Stressed | 3 of 8 in warning |

## Prices

| Indicator | Value | Unit | 7-day change | 30-day change | Position | Peak | Peak date | Peak basis | Below peak % | Details |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Oil price (Brent) | 109.209999 | US$ | -15.959985 | -8.733078 | expensive | 138.21 | 2026-04-07 | highest daily close | -20.982563 | futures (front-month contract), not spot · 14.5 above its 200-day average |
| Gold price (ounce) | 4141.899902 | US$ | -1.162129 | -6.395625 | expensive | 5586.200195 | 2026-01-29 | highest daily high | -25.854789 | futures (front-month contract), not spot · Gold price in Australian dollars: 5928.71552 · 8.8 below its 200-day average |
| Silver price (ounce) | 57.223 | US$ | -4.851929 | -14.022777 | expensive | 121.300003 | 2026-01-29 | highest daily high | -52.825228 | futures (front-month contract), not spot · 20.6 below its 200-day average |
| Bitcoin price | 81983.640625 | US$ | 0.27039 | 0.923214 | expensive | 126198.070313 | 2025-10-06 | highest daily high | -35.035741 | 13 above its 200-day average · One bitcoin buys 19.8 oz of gold · One bitcoin buys about 1433 oz of silver |

## Together

Relationships are general tendencies, not forecasts.

| Indicator | Status | Details |
| --- | --- | --- |
| The dollar, gold and oil | Matching the usual pattern | Gold and oil are priced in US dollars, so a strong dollar tends to weigh on them, and a weak one tends to lift them. — the dollar: rising · gold: falling · oil: falling |
| Copper demand, Chinese factories and money | Matching the usual pattern | Copper is wired into industry, so a firm copper-to-gold ratio tends to come with busy factories. (The link to US money supply is weak, so that leg is no longer counted.) — the copper price vs gold: rising · Chinese factory activity: rising |
| Oil, inflation expectations and borrowing costs | Partly matching the usual pattern | When oil jumps, markets tend to expect more inflation, and long-term borrowing costs tend to rise with it. — oil: falling · inflation expectations: falling · 10-year borrowing costs: rising |
| Real yields and gold | Trigger not present | Real yields and gold usually move in opposite directions: when “safe” money pays more after inflation, gold tends to lose shine, and the other way round. — real yields: rising · gold: falling |
| Iron ore, the terms of trade and the Australian dollar | Trigger not present | Iron ore is one of Australia’s biggest exports, so firm export prices tend to lift the terms of trade and, over time, the Australian dollar. The US dollar rides along as context: a falling Australian dollar is often mostly a rising US dollar. — iron ore: rising · the terms of trade: falling · the Australian dollar: falling · the US dollar: rising |
| The RBA rate, home loans and household debt | Not enough fresh data | When the RBA changes the cash rate, the home-loan rates people actually pay tend to follow one to three months later; the card reads pass-through pending until that data exists. (The debt leg is a debt-to-income level, not a debt-servicing cost.) — the RBA cash rate: no fresh reading · the home-loan rate people pay: no fresh reading · household debt ratios: no fresh reading |

## What the signals say

The conditions that usually surround each metal, in plain words: conditions, not forecasts, and not advice.

| Indicator | Conditions right now | Details |
| --- | --- | --- |
| gold | mostly unsupportive | 0 of 5 conditions met — Real yields: Works against · Inflation expectations: Sitting neutral · Market stress: Works against · The US dollar: Works against · Price footing: Works against |
| silver | mostly unsupportive | 1 of 6 conditions met — Real yields: Works against · Inflation expectations: Sitting neutral · Market stress: Works against · The US dollar: Works against · Price footing: Works against · Industrial demand: Supports |

## Indicators

| ID | Indicator | Ticker | Value | Unit | Status | 7-day change | 30-day change | 10-year position | As of | Snapshot time | Source | Published | Stale | Source URL | Licence | Private only | Public display OK | Rule version | Thresholds (rule JSON) | Level | Owner accepts | Source enabled | Fetch method |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| yield-curve-10y2y | The gap between 10-year and 2-year US borrowing |  | 0.38 | pts | Normal | -0.06 | 0.13 | 0.495192 | 2026-10-19 | 2026-10-19T21:28:53.290Z | FRED (T10Y2Y) |  | no | https://fred.stlouisfed.org/series/T10Y2Y | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"below","value":0} | L2 | yes | yes | M1 |
| real-yield-10y | US 10-year interest after inflation |  | 2.74 | % | Needs attention | -0.17 | 0.06 | 0.993587 | 2026-10-16 | 2026-10-19T21:28:53.290Z | FRED (DFII10) |  | no | https://fred.stlouisfed.org/series/DFII10 | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} | L0 | n/a | yes | M1 |
| us10y | What the US government pays to borrow for 10 years |  | 5.09 | % | Needs attention | -0.15 | 0.08 | 0.993587 | 2026-10-16 | 2026-10-19T21:28:53.290Z | FRED (DGS10) |  | no | https://fred.stlouisfed.org/series/DGS10 | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"any-of","of":[{"kind":"percentile","tail":"high","cutoff":0.1},{"kind":"change","mode":"points","direction":"rise","magnitude":0.5,"windowWeeks":4}]} | L0 | n/a | yes | M1 |
| fed-target | The US central bank’s policy rate |  | 3.75 | % | Normal | 0 | 0 | 0.680548 | 2026-10-19 | 2026-10-19T21:28:53.290Z | FRED (DFEDTARL/U) |  | no | https://fred.stlouisfed.org/series/DFEDTARU | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} | L0 | n/a | yes | M1 |
| fed-expectations | What markets expect from the Fed | 2-year gap | 0.865 | pts | Normal | -0.06 | -0.25 | 0.89018 | 2026-10-16 | 2026-10-19T21:28:53.290Z | FRED (DGS2 − policy-rate midpoint) |  | no | https://fred.stlouisfed.org/series/DGS2 | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} | L0 | n/a | yes | M1 |
| us30y | US 30-year Treasury yield | 30-year | 5.43 | % | Needs attention | -0.17 | 0.08 | 0.993988 | 2026-10-16 | 2026-10-19T21:28:53.290Z | FRED (DGS30) |  | no | https://fred.stlouisfed.org/series/DGS30 | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"any-of","of":[{"kind":"percentile","tail":"high","cutoff":0.1},{"kind":"change","mode":"points","direction":"rise","magnitude":0.5,"windowWeeks":4}]} | L0 | n/a | yes | M1 |
| ecb-dfr | The euro area’s policy rate |  | 2.5 | % | Normal | 0 | 0 | 0.770411 | 2026-10-19 | 2026-10-19T21:28:53.290Z | ECB Data Portal (DFR) |  | no | https://data.ecb.europa.eu/data/datasets/FM/B.EUR.4F.KR.DFR.LEV | ECB Data Portal terms (not verbatim-verified) | yes | unknown | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} | L1 | n/a | yes | M1 |
| govt-interest-revenue | The US government’s interest bill vs its income |  | 33.553935 | % | Normal |  | -0.161686 | 0.72973 | 2026-04-01 | 2026-10-19T21:28:53.290Z | FRED (BEA series, derived) |  | no | https://fred.stlouisfed.org/series/A091RC1Q027SBEA | Varies by series (FRED license tags) | yes | no | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} | L2 | no | no (kill switch off) | M1 |
| us-cpi-yoy | US prices vs a year ago | CPI | 3.737685 | % | Needs attention |  | 0.341137 | 0.760684 | 2026-09-01 | 2026-10-19T21:28:53.290Z | FRED (CPIAUCNS, not seasonally adjusted) | 2026-10-14 | no | https://fred.stlouisfed.org/series/CPIAUCNS | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"threshold","direction":"above","value":3} | L0 | n/a | yes | M1 |
| us-cpi-core-yoy | Core inflation | Core CPI | 2.564358 | % | Context |  | 0.118378 | 0.487179 | 2026-09-01 | 2026-10-19T21:28:53.290Z | FRED (CPILFENS, not seasonally adjusted) | 2026-10-14 | no | https://fred.stlouisfed.org/series/CPILFENS | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"info"} | L0 | n/a | yes | M1 |
| breakeven-5y5y | Expected US inflation, five to ten years ahead |  | 2.32 | % | Normal | 0 | -0.03 | 0.838141 | 2026-10-19 | 2026-10-19T21:28:53.290Z | FRED (T5YIFR) |  | no | https://fred.stlouisfed.org/series/T5YIFR | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"above","value":2.4,"sustainedWeeks":4} | L2 | yes | yes | M1 |
| stress-stlfsi | Stress in US money markets |  | -0.7206 | index | Normal | -0.2531 | 0.0712 | 0.171154 | 2026-10-09 | 2026-10-19T21:28:53.290Z | FRED (STLFSI4) |  | no | https://fred.stlouisfed.org/series/STLFSI4 | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"above","value":0,"sustainedWeeks":4} | L2 | yes | yes | M1 |
| nfci | US financial conditions |  | -0.499 | index | Normal | 0.008 | 0.044 | 0.517308 | 2026-10-09 | 2026-10-19T21:28:53.290Z | FRED (NFCI) |  | no | https://fred.stlouisfed.org/series/NFCI | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"above","value":0} | L2 | yes | yes | M1 |
| vix | Market fear gauge | VIX | 19.99 | index | Normal | 5.15 | 2.28 | 0.689221 | 2026-10-16 | 2026-10-19T21:28:53.290Z | FRED (VIXCLS), © Cboe |  | no | https://fred.stlouisfed.org/series/VIXCLS | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} | L2 | yes | yes | M1 |
| crypto-fng | Crypto fear and greed |  | 59 | index | Context | -10 | -12 | 0.847118 | 2026-10-19 | 2026-10-19T21:28:53.290Z | Alternative.me (Crypto Fear and Greed Index) |  | no | https://alternative.me/crypto/fear-and-greed-index/ | Free API — attribution next to the data | no | yes | 2 | {"kind":"info"} | L0 | n/a | yes | M1 |
| shiller-cape | US share prices versus long-run earnings (Shiller CAPE) |  |  | ratio | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | Robert Shiller, Irrational Exuberance data (ie_data.xls) |  | no | https://shillerdata.com/ | Open academic data — attribution; no formal reuse terms | yes | no | 2 | {"kind":"info"} | L2 | no | no (kill switch off) | M2 |
| shiller-ecy | Excess CAPE Yield (Shiller) |  |  | % | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | Robert Shiller, Irrational Exuberance data (ie_data.xls) |  | no | https://shillerdata.com/ | Open academic data — attribution; no formal reuse terms | yes | no | 2 | {"kind":"info"} | L2 | no | no (kill switch off) | M2 |
| gold-silver | Gold’s price versus silver |  | 72.381733 | ratio | Normal |  |  | 0.193277 | 2026-10-19 | 2026-10-19T21:28:53.290Z | gold-api.com (history: World Bank) |  | no | https://www.gold-api.com | Free API — commercial use permitted (their ToS) | yes | unknown | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} | L1 | n/a | yes | M1 |
| dollar-basket | The dollar vs six big currencies |  | 101.826091 | index | Normal | -0.55952 | 1.306455 | 0.71831 | 2026-10-19 | 2026-10-19T21:28:53.290Z | Currena basket (ECB rates via Frankfurter) |  | no | https://frankfurter.dev | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"any-of","of":[{"kind":"percentile","tail":"high","cutoff":0.1},{"kind":"change","mode":"pct","direction":"rise","magnitude":3,"windowWeeks":4}]} | L1 | n/a | yes | M1 |
| usdjpy | Dollar vs yen | USD/JPY | 158.24 | ¥ | Unusual | -0.226986 | 0.221673 | 0.946401 | 2026-10-19 | 2026-10-19T21:28:53.290Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"change","mode":"pct","direction":"fall","magnitude":5,"windowWeeks":4} | L1 | n/a | yes | M1 |
| eur-usd | Euro per US dollar | EUR/USD | 0.89087 | € | Context | -0.391337 | 2.093743 | 0.511737 | 2026-10-19 | 2026-10-19T21:28:53.290Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"info"} | L1 | n/a | yes | M1 |
| china-pmi | Chinese factory activity |  | 50.1 | index | Normal |  | 0.3 |  | 2026-09-30 | 2026-10-19T21:28:53.290Z | China NBS (manual entry) |  | no | https://www.stats.gov.cn/english/ | Publisher terms vary; entered by hand | yes | no | 2 | {"kind":"threshold","direction":"below","value":50} | L1 | n/a | yes | M5 |
| m2-us | The amount of money in the US economy | M2 money | 23.3428 | trillion | Normal |  | 0.537947 | 0.641026 | 2026-08-01 | 2026-10-19T21:28:53.290Z | FRED (M2SL) |  | no | https://fred.stlouisfed.org/series/M2SL | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"yoy-negative"} | L0 | n/a | yes | M1 |
| philly-fed | US factory survey (Philadelphia Fed) | Philly Fed | 20.9 | pts | Normal |  | -16.9 | 0.672269 | 2026-10-01 | 2026-10-19T21:28:53.290Z | FRED (GACDFSA066MSFRBPHI), Philadelphia Fed |  | no | https://fred.stlouisfed.org/series/GACDFSA066MSFRBPHI | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"below","value":0} | L2 | yes | yes | M1 |
| us-unemployment | US unemployment | BLS: UNRATE | 4.2 | % | Normal |  | 0.1 | 0.564103 | 2026-09-01 | 2026-10-19T21:28:53.290Z | FRED (UNRATE), US BLS | 2026-10-02 | no | https://fred.stlouisfed.org/series/UNRATE | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} | L0 | n/a | yes | M1 |
| sahm-rule | US recession alarm (Sahm rule) | Sahm rule | 0 | pts | Normal |  | 0.07 | 0.324786 | 2026-09-01 | 2026-10-19T21:28:53.290Z | FRED (SAHMREALTIME) | 2026-10-02 | no | https://fred.stlouisfed.org/series/SAHMREALTIME | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"threshold","direction":"above","value":0.5} | L0 | n/a | yes | M1 |
| copper-gold | Copper’s price versus gold |  | 3.351239 | ratio | Normal |  | 0.103449 | 0.211864 | 2026-09-01 | 2026-10-19T21:28:53.290Z | World Bank Pink Sheet |  | no | https://www.worldbank.org/en/research/commodity-markets | Unknown (CC BY 4.0 expected, not quoted) | yes | unknown | 2 | {"kind":"percentile","tail":"low","cutoff":0.2} | L1 | n/a | yes | M1 |
| usdcny | Dollar vs Chinese yuan | USD/CNY | 6.6807 | CN¥ | Context | -0.180791 | -0.252329 | 0.248044 | 2026-10-19 | 2026-10-19T21:28:53.290Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"info"} | L1 | n/a | yes | M1 |
| brent | Oil price (Brent) |  | 109.209999 | US$ | Needs attention | -15.959985 | -8.733078 | 0.948283 | 2026-10-19 | 2026-10-19T21:28:53.290Z | FRED (EIA Brent) + Yahoo Finance (BZ=F) |  | no | https://fred.stlouisfed.org/series/DCOILBRENTEU | No reuse licence offered (unofficial endpoints) | no | yes | 2 | {"kind":"change","mode":"pct","direction":"rise","magnitude":25,"windowWeeks":13} | L2 | yes | yes | M1 |
| gold-usd | Gold price (ounce) |  | 4141.899902 | US$ | Context | -1.162129 | -6.395625 | 0.919554 | 2026-10-19 | 2026-10-19T21:28:53.290Z | gold-api.com (XAU) |  | no | https://www.gold-api.com | No reuse licence offered (unofficial endpoints) | no | yes | 2 | {"kind":"info"} | L2 | yes | yes | M1 |
| silver-usd | Silver price (ounce) |  | 57.223 | US$ | Context | -4.851929 | -14.022777 | 0.915139 | 2026-10-19 | 2026-10-19T21:28:53.290Z | gold-api.com (XAG) |  | no | https://www.gold-api.com | No reuse licence offered (unofficial endpoints) | no | yes | 2 | {"kind":"info"} | L2 | yes | yes | M1 |
| copper-usd | Copper price |  | 14553.289321 | US$ | Context |  |  | 1 | 2026-10-19 | 2026-10-19T21:28:53.290Z | gold-api.com (HG, history: World Bank) |  | no | https://www.gold-api.com | Unknown (CC BY 4.0 expected, not quoted) | yes | unknown | 2 | {"kind":"info"} | L1 | n/a | yes | M1 |
| btc-usd | Bitcoin price | BTC | 81983.640625 | US$ | Context | 0.27039 | 0.923214 | 0.873151 | 2026-10-19 | 2026-10-19T21:28:53.290Z | gold-api.com (BTC) |  | no | https://www.gold-api.com | No reuse licence offered (unofficial endpoints) | no | yes | 2 | {"kind":"info"} | L2 | yes | yes | M1 |
| gold-btc | Bitcoin priced in gold (BTC per ounce) |  | 0.050521 | ratio | Context |  |  |  | 2026-10-19 | 2026-10-19T21:28:53.290Z | gold-api.com (XAU ÷ BTC) |  | no | https://www.gold-api.com | Free API — commercial use permitted (their ToS) | no | yes | 2 | {"kind":"info"} | L0 | n/a | yes | M1 |
| silver-btc | Bitcoin priced in silver (BTC per ounce) |  | 0.000698 | ratio | Context |  |  |  | 2026-10-19 | 2026-10-19T21:28:53.290Z | gold-api.com (XAG ÷ BTC) |  | no | https://www.gold-api.com | Free API — commercial use permitted (their ToS) | no | yes | 2 | {"kind":"info"} | L0 | n/a | yes | M1 |
| au-cpi | Australian prices vs a year ago | CPI | 3.967855 | % | Needs attention |  | 0.51508 |  | 2026-08-01 | 2026-10-19T21:28:53.290Z | ABS (monthly CPI All groups) | 2026-09-30 | no | https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.M | CC BY 4.0 | no | yes | 2 | {"kind":"threshold","direction":"above","value":3} | L0 | n/a | yes | M1 |
| au-trimmed-mean | Underlying inflation |  | 3.574018 | % | Needs attention |  | -0.051209 |  | 2026-08-01 | 2026-10-19T21:28:53.290Z | ABS (monthly CPI Trimmed Mean) | 2026-09-30 | no | https://data.api.abs.gov.au/rest/data/CPI/1.999902.20.50.M | CC BY 4.0 | no | yes | 2 | {"kind":"threshold","direction":"above","value":3} | L0 | n/a | yes | M1 |
| au-10y | What Australia pays to borrow for 10 years | RBA F2: 10y |  | % | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | RBA F2 (10-year bond yield) |  | no | https://www.rba.gov.au/statistics/tables/#f2 | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} | L0 | n/a | yes | M2 |
| rba-expectations | What markets expect from the RBA | 3-year gap |  | pts | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | RBA F2 (FCMYGBAG3D) − RBA F1 |  | no | https://www.rba.gov.au/statistics/tables/ | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} | L0 | n/a | yes | M2 |
| au-us-10y-gap | The gap between Australian and US 10-year borrowing |  |  | pts | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | RBA F2 − FRED (DGS10) |  | no | https://www.rba.gov.au/statistics/tables/ | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"threshold","direction":"below","value":0} | L0 | n/a | yes | M2 |
| au-petrol-yoy | Petrol prices vs a year ago | CPI: fuel | 13.528998 | % | Context |  | 13.883428 | 0.736842 | 2026-08-01 | 2026-10-19T21:28:53.290Z | ABS (CPI Automotive fuel) | 2026-09-30 | no | https://data.api.abs.gov.au/rest/data/CPI/1.40081.10.50.M | CC BY 4.0 | no | yes | 2 | {"kind":"info"} | L0 | n/a | yes | M1 |
| rba-cash-rate | Australia’s official interest rate |  |  | % | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | RBA F1 (Cash Rate Target) |  | no | https://www.rba.gov.au/statistics/cash-rate/ | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"info"} | L0 | n/a | yes | M2 |
| au-home-loan | The home-loan rate people actually pay |  |  | % | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | RBA F6 (owner-occupier outstanding) |  | no | https://www.rba.gov.au/statistics/tables/ | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} | L0 | n/a | yes | M2 |
| au-deposit-rate | Savings rates (new term deposits) | RBA F4.1 |  | % | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | RBA F4.1 (new term deposits) |  | no | https://www.rba.gov.au/statistics/tables/#f4-1 | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"info"} | L0 | n/a | yes | M2 |
| au-wage-growth | Wage growth vs a year ago |  | 3.203075 | % | Stale |  | -0.018575 | 0.621622 | 2026-04-01 | 2026-10-19T21:28:53.290Z | ABS (Wage Price Index) |  | yes (201 days old) | https://data.api.abs.gov.au/rest/data/WPI/1.OHRPEB.7.TOT.10.AUS.Q | CC BY 4.0 | no | yes | 2 | {"kind":"below-aux"} | L0 | n/a | yes | M1 |
| au-rent-yoy | Rent growth vs a year ago | CPI: rents | 3.57823 | % | Unusual |  | -0.001818 | 0.081081 | 2026-08-01 | 2026-10-19T21:28:53.290Z | ABS (CPI Rents) | 2026-09-30 | no | https://data.api.abs.gov.au/rest/data/CPI/1.115522.10.50.M | CC BY 4.0 | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} | L0 | n/a | yes | M1 |
| au-unemployment | The share of Australians without work |  | 4.718349 | % | Needs attention |  | 0.066741 | 0.508475 | 2026-09-01 | 2026-10-19T21:28:53.290Z | ABS (Labour Force) | 2026-10-15 | no | https://data.api.abs.gov.au/rest/data/LF/M13.3.1599.20.AUS.M | CC BY 4.0 | no | yes | 2 | {"kind":"above-low","rise":0.5} | L0 | n/a | yes | M1 |
| au-home-values | Australian home prices |  | 1100.4 | index | Normal |  | -0.739672 | 0.567568 | 2026-04-01 | 2026-10-19T21:28:53.290Z | ABS (RES_DWELL_ST) |  | no | https://data.api.abs.gov.au/rest/data/RES_DWELL_ST/5.AUS.Q | CC BY 4.0 | no | yes | 2 | {"kind":"consecutive-decline","periods":3} | L0 | n/a | yes | M1 |
| au-household-debt-arrears | Australian household debt versus income |  |  | % | Can't tell right now |  |  |  |  | 2026-10-19T21:28:53.290Z | RBA E2 (household ratios) |  | no | https://www.rba.gov.au/statistics/tables/ | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} | L0 | n/a | yes | M2 |
| audusd | Australian dollar vs US dollar | AUD/USD | 0.698617 | US$ | Normal | 0.174654 | -1.879279 | 0.487089 | 2026-10-19 | 2026-10-19T21:28:53.290Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | Own computation — inherits the upstream sources’ terms | yes | unknown | 2 | {"kind":"percentile","tail":"low","cutoff":0.2} | L2 | no | no (kill switch off) | not recorded |
| audjpy | Australian dollar vs yen | AUD/JPY | 110.549113 | ¥ | Unusual | -0.052728 | -1.661772 | 0.944836 | 2026-10-19 | 2026-10-19T21:28:53.290Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | Own computation — inherits the upstream sources’ terms | yes | unknown | 2 | {"kind":"change","mode":"pct","direction":"fall","magnitude":5,"windowWeeks":4} | L2 | no | no (kill switch off) | not recorded |
| terms-of-trade | Australia’s export prices vs import prices |  | 94.8 | index | Normal |  | -1.5 | 0.432432 | 2026-04-01 | 2026-10-19T21:28:53.290Z | ABS (ANA_AGG terms of trade) |  | no | https://data.api.abs.gov.au/rest/data/ANA_AGG/M5.TTR.20.AUS.Q | CC BY 4.0 | no | yes | 2 | {"kind":"consecutive-decline","periods":2} | L0 | n/a | yes | M1 |
| iron-ore | Iron ore price |  | 97.7 | US$ | Context |  | 1.45379 | 0.415254 | 2026-09-01 | 2026-10-19T21:28:53.290Z | World Bank Pink Sheet |  | no | https://www.worldbank.org/en/research/commodity-markets | Unknown (CC BY 4.0 expected, not quoted) | yes | unknown | 2 | {"kind":"info"} | L1 | n/a | yes | M1 |
| gold-aud | Gold price in Australian dollars | gold in A$ | 5928.71552 | A$ | Context |  |  |  | 2026-10-19 | 2026-10-19T21:28:53.290Z | gold-api.com × Frankfurter (ECB) |  | no | https://www.gold-api.com | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"info"} | L1 | n/a | yes | M1 |

## Next up

| ID | Indicator | Date |
| --- | --- | --- |
| abs-cpi | ABS monthly CPI: September 2026 | 2026-10-28 |
| fed | US Fed interest rate decision (FOMC) | 2026-10-28 |
| ecb | ECB interest rate decision | 2026-10-29 |
| rba | RBA cash rate decision | 2026-11-03 |
| us-jobs | US jobs report (Employment Situation): October 2026 | 2026-11-06 |
| us-cpi | US consumer price index: October 2026 | 2026-11-10 |
| abs-jobs | ABS jobs report (Labour Force): October 2026 | 2026-11-19 |
| abs-cpi | ABS monthly CPI: October 2026 | 2026-11-25 |
| us-jobs | US jobs report (Employment Situation): November 2026 | 2026-12-04 |
| rba | RBA cash rate decision | 2026-12-08 |
| fed | US Fed interest rate decision (FOMC) | 2026-12-09 |
| us-cpi | US consumer price index: November 2026 | 2026-12-10 |
| abs-jobs | ABS jobs report (Labour Force): November 2026 | 2026-12-17 |
| abs-cpi | ABS monthly CPI: December 2026 | 2027-01-27 |
| fed | US Fed interest rate decision (FOMC) | 2027-01-27 |
| rba | RBA cash rate decision | 2027-02-09 |
| abs-cpi | ABS monthly CPI: January 2027 | 2027-02-24 |
| fed | US Fed interest rate decision (FOMC) | 2027-03-17 |
| rba | RBA cash rate decision | 2027-03-23 |
| fed | US Fed interest rate decision (FOMC) | 2027-04-28 |
| rba | RBA cash rate decision | 2027-05-04 |
