# Currena Insights — self-check export

- What the world’s money is doing: plain-language gauges, prices and indicators.
- Data as of: 2026-10-16
- Rule version: 2

## Summary of the gauges below

| Indicator | Status | Details |
| --- | --- | --- |
| Global | Cautious | 5 of 23 in warning |
| Australia | Stressed | 4 of 9 in warning |

## Prices

| Indicator | Value | Unit | 7-day change | 30-day change | Position | Peak | Peak date | Peak basis | Below peak % | Details |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Oil price (Brent) | 105.93 | US$ | -18.534184 | -17.138611 | expensive | 138.21 | 2026-04-07 | highest daily close | -23.355763 | futures (front-month contract), not spot · 11.4 above its 200-day average |
| Gold price (ounce) | 4186 | US$ | -0.718635 | -4.592593 | expensive | 5586.200195 | 2026-01-29 | highest daily high | -25.065342 | futures (front-month contract), not spot · Gold price in Australian dollars: 6057.142 · 7.8 below its 200-day average |
| Silver price (ounce) | 57.834999 | US$ | -4.672819 | -10.037647 | expensive | 121.300003 | 2026-01-29 | highest daily high | -52.320695 | futures (front-month contract), not spot · 19.8 below its 200-day average |
| Bitcoin price | 82042.890625 | US$ | -0.609875 | 7.738077 | expensive | 126198.070313 | 2025-10-06 | highest daily high | -34.988791 | 13.4 above its 200-day average · One bitcoin buys 19.6 oz of gold · One bitcoin buys about 1419 oz of silver |

## Together

Relationships are general tendencies, not forecasts.

| Indicator | Status | Details |
| --- | --- | --- |
| Real yields and gold | Showing | Real yields and gold usually move in opposite directions: when “safe” money pays more after inflation, gold tends to lose shine, and the other way round. — real yields: rising · gold: falling |
| The dollar, gold and oil | Showing | Gold and oil are priced in US dollars, so a strong dollar tends to weigh on them, and a weak one tends to lift them. — the dollar: rising · gold: falling · oil: falling |
| Copper demand, Chinese factories and money | Showing | Copper is wired into industry, so a firm copper-to-gold ratio tends to come with busy factories. (The link to US money supply is weak, so that leg is no longer counted.) — the copper price vs gold: rising · Chinese factory activity: rising |
| Oil, inflation expectations and borrowing costs | Not showing | When oil jumps, markets tend to expect more inflation, and long-term borrowing costs tend to rise with it. — oil: falling · inflation expectations: falling · 10-year borrowing costs: rising |
| Iron ore, the terms of trade and the Australian dollar | Not showing | Iron ore is one of Australia’s biggest exports, so firm export prices tend to lift the terms of trade and, over time, the Australian dollar. The US dollar rides along as context: a falling Australian dollar is often mostly a rising US dollar. — iron ore: rising · the terms of trade: falling · the Australian dollar: falling · the US dollar: rising |
| The RBA rate, home loans and household debt | Not enough fresh data | When the RBA changes the cash rate, the home-loan rates people actually pay tend to follow one to three months later; the card reads pass-through pending until that data exists. (The debt leg is a debt-to-income level, not a debt-servicing cost.) — the RBA cash rate: no fresh reading · the home-loan rate people pay: no fresh reading · household debt ratios: no fresh reading |

## What the signals say

The conditions that usually surround each metal, in plain words: conditions, not forecasts, and not advice.

| Indicator | Conditions right now | Details |
| --- | --- | --- |
| gold | mostly unsupportive | 0 of 5 conditions met — Real yields: Works against · Inflation expectations: Sitting neutral · Market stress: Works against · The US dollar: Works against · Price footing: Works against |
| silver | mostly unsupportive | 1 of 6 conditions met — Real yields: Works against · Inflation expectations: Sitting neutral · Market stress: Works against · The US dollar: Works against · Price footing: Works against · Industrial demand: Supports |

## Indicators

| ID | Indicator | Ticker | Value | Unit | Status | 7-day change | 30-day change | 10-year position | As of | Snapshot time | Source | Published | Stale | Source URL | Licence | Private only | Public display OK | Rule version | Thresholds (rule JSON) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| yield-curve-10y2y | The gap between 10-year and 2-year US borrowing |  | 0.33 | pts | Normal | -0.14 | 0 | 0.468162 | 2026-10-15 | 2026-10-16T13:59:56.229Z | FRED (T10Y2Y) |  | no | https://fred.stlouisfed.org/series/T10Y2Y | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"below","value":0} |
| real-yield-10y | US 10-year interest after inflation |  | 2.84 | % | Needs attention | -0.08 | 0.24 | 0.995192 | 2026-10-14 | 2026-10-16T13:59:56.229Z | FRED (DFII10) |  | no | https://fred.stlouisfed.org/series/DFII10 | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} |
| us10y | What the US government pays to borrow for 10 years |  | 5.19 | % | Needs attention | -0.09 | 0.22 | 0.995593 | 2026-10-14 | 2026-10-16T13:59:56.229Z | FRED (DGS10) |  | no | https://fred.stlouisfed.org/series/DGS10 | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"any-of","of":[{"kind":"percentile","tail":"high","cutoff":0.1},{"kind":"change","mode":"points","direction":"rise","magnitude":0.5,"windowWeeks":4}]} |
| fed-target | The US central bank’s policy rate |  | 3.75 | % | Normal | 0 | 0.25 | 0.68137 | 2026-10-16 | 2026-10-16T13:59:56.229Z | FRED (DFEDTARL/U) |  | no | https://fred.stlouisfed.org/series/DFEDTARU | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} |
| fed-expectations | What markets expect from the Fed | 2-year gap | 0.945 | pts | Needs attention | 0.05 | -0.08 | 0.921474 | 2026-10-14 | 2026-10-16T13:59:56.229Z | FRED (DGS2 − policy-rate midpoint) |  | no | https://fred.stlouisfed.org/series/DGS2 | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} |
| us30y | US 30-year Treasury yield | 30-year | 5.52 | % | Needs attention | -0.15 | 0.18 | 0.995593 | 2026-10-14 | 2026-10-16T13:59:56.229Z | FRED (DGS30) |  | no | https://fred.stlouisfed.org/series/DGS30 | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"any-of","of":[{"kind":"percentile","tail":"high","cutoff":0.1},{"kind":"change","mode":"points","direction":"rise","magnitude":0.5,"windowWeeks":4}]} |
| ecb-dfr | The euro area’s policy rate |  | 2.5 | % | Normal | 0 | 0 | 0.771233 | 2026-10-16 | 2026-10-16T13:59:56.229Z | ECB Data Portal (DFR) |  | no | https://data.ecb.europa.eu/data/datasets/FM/B.EUR.4F.KR.DFR.LEV | ECB Data Portal terms (not verbatim-verified) | yes | unknown | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} |
| govt-interest-revenue | The US government’s interest bill vs its income |  | 33.553935 | % | Normal |  | -0.161686 | 0.72973 | 2026-04-01 | 2026-10-16T13:59:56.229Z | FRED (BEA series, derived) |  | no | https://fred.stlouisfed.org/series/A091RC1Q027SBEA | Varies by series (FRED license tags) | yes | no | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} |
| us-cpi-yoy | US prices vs a year ago | CPI | 3.737685 | % | Needs attention |  | 0.341137 | 0.760684 | 2026-09-01 | 2026-10-16T13:59:56.229Z | FRED (CPIAUCNS, not seasonally adjusted) | 2026-10-14 | no | https://fred.stlouisfed.org/series/CPIAUCNS | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"threshold","direction":"above","value":3} |
| us-cpi-core-yoy | Core inflation | Core CPI | 2.564358 | % | Context |  | 0.118378 | 0.487179 | 2026-09-01 | 2026-10-16T13:59:56.229Z | FRED (CPILFENS, not seasonally adjusted) | 2026-10-14 | no | https://fred.stlouisfed.org/series/CPILFENS | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"info"} |
| breakeven-5y5y | Expected US inflation, five to ten years ahead |  | 2.31 | % | Normal | -0.02 | -0.04 | 0.81658 | 2026-10-15 | 2026-10-16T13:59:56.229Z | FRED (T5YIFR) |  | no | https://fred.stlouisfed.org/series/T5YIFR | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"above","value":2.4,"sustainedWeeks":4} |
| stress-stlfsi | Stress in US money markets |  | -0.7206 | index | Normal | -0.2531 | 0.0712 | 0.171154 | 2026-10-09 | 2026-10-16T13:59:56.229Z | FRED (STLFSI4) |  | no | https://fred.stlouisfed.org/series/STLFSI4 | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"above","value":0,"sustainedWeeks":4} |
| nfci | US financial conditions |  | -0.499 | index | Normal | 0.008 | 0.044 | 0.517308 | 2026-10-09 | 2026-10-16T13:59:56.229Z | FRED (NFCI) |  | no | https://fred.stlouisfed.org/series/NFCI | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"above","value":0} |
| vix | Market fear gauge | VIX | 16.46 | index | Normal | 1.05 | -0.74 | 0.462657 | 2026-10-15 | 2026-10-16T13:59:56.229Z | FRED (VIXCLS), © Cboe |  | no | https://fred.stlouisfed.org/series/VIXCLS | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} |
| crypto-fng | Crypto fear and greed |  | 63 | index | Context | 4 | 12 | 0.869674 | 2026-10-16 | 2026-10-16T13:59:56.229Z | Alternative.me (Crypto Fear and Greed Index) |  | no | https://alternative.me/crypto/fear-and-greed-index/ | Free API — attribution next to the data | no | yes | 2 | {"kind":"info"} |
| gold-silver | Gold’s price versus silver |  | 72.378319 | ratio | Normal |  |  | 0.193277 | 2026-10-16 | 2026-10-16T13:59:56.229Z | gold-api.com (history: World Bank) |  | no | https://www.gold-api.com | Free API — commercial use permitted (their ToS) | yes | unknown | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} |
| dollar-basket | The dollar vs six big currencies |  | 102.113437 | index | Normal | -0.244945 | 2.491254 | 0.732108 | 2026-10-15 | 2026-10-16T13:59:56.229Z | Currena basket (ECB rates via Frankfurter) |  | no | https://frankfurter.dev | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"any-of","of":[{"kind":"percentile","tail":"high","cutoff":0.1},{"kind":"change","mode":"pct","direction":"rise","magnitude":3,"windowWeeks":4}]} |
| usdjpy | Dollar vs yen | USD/JPY | 157.98 | ¥ | Unusual | -0.189538 | 1.922581 | 0.94212 | 2026-10-15 | 2026-10-16T13:59:56.229Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"change","mode":"pct","direction":"fall","magnitude":5,"windowWeeks":4} |
| eur-usd | Euro per US dollar | EUR/USD | 0.89222 | € | Context | -0.195756 | 2.952817 | 0.523661 | 2026-10-15 | 2026-10-16T13:59:56.229Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"info"} |
| china-pmi | Chinese factory activity |  | 50.1 | index | Normal |  | 0.3 |  | 2026-09-30 | 2026-10-16T13:59:56.229Z | China NBS (manual entry) |  | no | https://www.stats.gov.cn/english/ | Publisher terms vary; entered by hand | yes | no | 2 | {"kind":"threshold","direction":"below","value":50} |
| m2-us | The amount of money in the US economy | M2 money | 23.3428 | trillion | Normal |  | 0.537947 | 0.641026 | 2026-08-01 | 2026-10-16T13:59:56.229Z | FRED (M2SL) |  | no | https://fred.stlouisfed.org/series/M2SL | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"yoy-negative"} |
| philly-fed | US factory survey (Philadelphia Fed) | Philly Fed | 20.9 | pts | Normal |  | -16.9 | 0.672269 | 2026-10-01 | 2026-10-16T13:59:56.229Z | FRED (GACDFSA066MSFRBPHI), Philadelphia Fed |  | no | https://fred.stlouisfed.org/series/GACDFSA066MSFRBPHI | FRED license #copyright-citation-required (citation required) | yes | no | 2 | {"kind":"threshold","direction":"below","value":0} |
| us-unemployment | US unemployment | BLS: UNRATE | 4.2 | % | Normal |  | 0.1 | 0.564103 | 2026-09-01 | 2026-10-16T13:59:56.229Z | FRED (UNRATE), US BLS | 2026-10-02 | no | https://fred.stlouisfed.org/series/UNRATE | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} |
| sahm-rule | US recession alarm (Sahm rule) | Sahm rule | 0 | pts | Normal |  | 0.07 | 0.324786 | 2026-09-01 | 2026-10-16T13:59:56.229Z | FRED (SAHMREALTIME) | 2026-10-02 | no | https://fred.stlouisfed.org/series/SAHMREALTIME | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"threshold","direction":"above","value":0.5} |
| copper-gold | Copper’s price versus gold |  | 3.351239 | ratio | Normal |  | 0.103449 | 0.211864 | 2026-09-01 | 2026-10-16T13:59:56.229Z | World Bank Pink Sheet |  | no | https://www.worldbank.org/en/research/commodity-markets | Unknown (CC BY 4.0 expected, not quoted) | yes | unknown | 2 | {"kind":"percentile","tail":"low","cutoff":0.2} |
| usdcny | Dollar vs Chinese yuan | USD/CNY | 6.691 | CN¥ | Context | -0.168599 | -0.305446 | 0.253813 | 2026-10-15 | 2026-10-16T13:59:56.229Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"info"} |
| brent | Oil price (Brent) |  | 105.93 | US$ | Unusual | -18.534184 | -17.138611 | 0.937673 | 2026-10-16 | 2026-10-16T13:59:56.229Z | FRED (EIA Brent) + Yahoo Finance (BZ=F) |  | no | https://fred.stlouisfed.org/series/DCOILBRENTEU | No reuse licence offered (unofficial endpoints) | yes | no | 2 | {"kind":"change","mode":"pct","direction":"rise","magnitude":25,"windowWeeks":13} |
| gold-usd | Gold price (ounce) |  | 4186 | US$ | Context | -0.718635 | -4.592593 | 0.925985 | 2026-10-16 | 2026-10-16T13:59:56.229Z | gold-api.com (XAU) |  | no | https://www.gold-api.com | No reuse licence offered (unofficial endpoints) | yes | no | 2 | {"kind":"info"} |
| silver-usd | Silver price (ounce) |  | 57.834999 | US$ | Context | -4.672819 | -10.037647 | 0.917596 | 2026-10-16 | 2026-10-16T13:59:56.229Z | gold-api.com (XAG) |  | no | https://www.gold-api.com | No reuse licence offered (unofficial endpoints) | yes | no | 2 | {"kind":"info"} |
| copper-usd | Copper price |  | 14593.666984 | US$ | Context |  |  | 1 | 2026-10-16 | 2026-10-16T13:59:56.229Z | gold-api.com (HG, history: World Bank) |  | no | https://www.gold-api.com | Unknown (CC BY 4.0 expected, not quoted) | yes | unknown | 2 | {"kind":"info"} |
| btc-usd | Bitcoin price | BTC | 82042.890625 | US$ | Context | -0.609875 | 7.738077 | 0.873425 | 2026-10-16 | 2026-10-16T13:59:56.229Z | gold-api.com (BTC) |  | no | https://www.gold-api.com | No reuse licence offered (unofficial endpoints) | yes | no | 2 | {"kind":"info"} |
| gold-btc | Bitcoin priced in gold (BTC per ounce) |  | 0.051022 | ratio | Context |  |  |  | 2026-10-16 | 2026-10-16T13:59:56.229Z | gold-api.com (XAU ÷ BTC) |  | no | https://www.gold-api.com | Free API — commercial use permitted (their ToS) | no | yes | 2 | {"kind":"info"} |
| silver-btc | Bitcoin priced in silver (BTC per ounce) |  | 0.000705 | ratio | Context |  |  |  | 2026-10-16 | 2026-10-16T13:59:56.229Z | gold-api.com (XAG ÷ BTC) |  | no | https://www.gold-api.com | Free API — commercial use permitted (their ToS) | no | yes | 2 | {"kind":"info"} |
| au-cpi | Australian prices vs a year ago | CPI | 3.967855 | % | Needs attention |  | 0.51508 |  | 2026-08-01 | 2026-10-16T13:59:56.229Z | ABS (monthly CPI All groups) | 2026-09-30 | no | https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.M | CC BY 4.0 | no | yes | 2 | {"kind":"threshold","direction":"above","value":3} |
| au-trimmed-mean | Underlying inflation |  | 3.574018 | % | Needs attention |  | -0.051209 |  | 2026-08-01 | 2026-10-16T13:59:56.229Z | ABS (monthly CPI Trimmed Mean) | 2026-09-30 | no | https://data.api.abs.gov.au/rest/data/CPI/1.999902.20.50.M | CC BY 4.0 | no | yes | 2 | {"kind":"threshold","direction":"above","value":3} |
| au-10y | What Australia pays to borrow for 10 years | RBA F2: 10y |  | % | No data |  |  |  |  | 2026-10-16T13:59:56.229Z | RBA F2 (10-year bond yield) |  | no | https://www.rba.gov.au/statistics/tables/#f2 | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} |
| rba-expectations | What markets expect from the RBA | 3-year gap |  | pts | No data |  |  |  |  | 2026-10-16T13:59:56.229Z | RBA F2 (FCMYGBAG3D) − RBA F1 |  | no | https://www.rba.gov.au/statistics/tables/ | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} |
| au-us-10y-gap | The gap between Australian and US 10-year borrowing |  |  | pts | No data |  |  |  |  | 2026-10-16T13:59:56.229Z | RBA F2 − FRED (DGS10) |  | no | https://www.rba.gov.au/statistics/tables/ | FRED license #copyright-public-domain (public domain) | no | yes | 2 | {"kind":"threshold","direction":"below","value":0} |
| au-petrol-yoy | Petrol prices vs a year ago | CPI: fuel | 13.528998 | % | Context |  | 13.883428 | 0.736842 | 2026-08-01 | 2026-10-16T13:59:56.229Z | ABS (CPI Automotive fuel) | 2026-09-30 | no | https://data.api.abs.gov.au/rest/data/CPI/1.40081.10.50.M | CC BY 4.0 | no | yes | 2 | {"kind":"info"} |
| rba-cash-rate | Australia’s official interest rate |  |  | % | No data |  |  |  |  | 2026-10-16T13:59:56.229Z | RBA F1 (Cash Rate Target) |  | no | https://www.rba.gov.au/statistics/cash-rate/ | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"info"} |
| au-home-loan | The home-loan rate people actually pay |  |  | % | No data |  |  |  |  | 2026-10-16T13:59:56.229Z | RBA F6 (owner-occupier outstanding) |  | no | https://www.rba.gov.au/statistics/tables/ | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} |
| au-deposit-rate | Savings rates (new term deposits) | RBA F4.1 |  | % | No data |  |  |  |  | 2026-10-16T13:59:56.229Z | RBA F4.1 (new term deposits) |  | no | https://www.rba.gov.au/statistics/tables/#f4-1 | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"info"} |
| au-wage-growth | Wage growth vs a year ago |  | 3.203075 | % | Needs attention |  | -0.018575 | 0.621622 | 2026-04-01 | 2026-10-16T13:59:56.229Z | ABS (Wage Price Index) |  | no | https://data.api.abs.gov.au/rest/data/WPI/1.OHRPEB.7.TOT.10.AUS.Q | CC BY 4.0 | no | yes | 2 | {"kind":"below-aux"} |
| au-rent-yoy | Rent growth vs a year ago | CPI: rents | 3.57823 | % | Unusual |  | -0.001818 | 0.081081 | 2026-08-01 | 2026-10-16T13:59:56.229Z | ABS (CPI Rents) | 2026-09-30 | no | https://data.api.abs.gov.au/rest/data/CPI/1.115522.10.50.M | CC BY 4.0 | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.1} |
| au-unemployment | The share of Australians without work |  | 4.718349 | % | Needs attention |  | 0.066741 | 0.508475 | 2026-09-01 | 2026-10-16T13:59:56.229Z | ABS (Labour Force) | 2026-10-15 | no | https://data.api.abs.gov.au/rest/data/LF/M13.3.1599.20.AUS.M | CC BY 4.0 | no | yes | 2 | {"kind":"above-low","rise":0.5} |
| au-home-values | Australian home prices |  | 1100.4 | index | Normal |  | -0.739672 | 0.567568 | 2026-04-01 | 2026-10-16T13:59:56.229Z | ABS (RES_DWELL_ST) |  | no | https://data.api.abs.gov.au/rest/data/RES_DWELL_ST/5.AUS.Q | CC BY 4.0 | no | yes | 2 | {"kind":"consecutive-decline","periods":3} |
| au-household-debt-arrears | Australian household debt versus income |  |  | % | No data |  |  |  |  | 2026-10-16T13:59:56.229Z | RBA E2 (household ratios) |  | no | https://www.rba.gov.au/statistics/tables/ | CC BY 4.0 (RBA terms for statistical tables) | no | yes | 2 | {"kind":"percentile","tail":"high","cutoff":0.2} |
| audusd | Australian dollar vs US dollar | AUD/USD | 0.691085 | US$ | Normal | -0.469938 | -3.013131 | 0.435667 | 2026-10-15 | 2026-10-16T13:59:56.229Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | Own computation — inherits the upstream sources’ terms | yes | unknown | 2 | {"kind":"percentile","tail":"low","cutoff":0.2} |
| audjpy | Australian dollar vs yen | AUD/JPY | 109.177609 | ¥ | Unusual | -0.658585 | -1.14848 | 0.931952 | 2026-10-15 | 2026-10-16T13:59:56.229Z | Frankfurter (ECB) |  | no | https://frankfurter.dev | Own computation — inherits the upstream sources’ terms | yes | unknown | 2 | {"kind":"change","mode":"pct","direction":"fall","magnitude":5,"windowWeeks":4} |
| terms-of-trade | Australia’s export prices vs import prices |  | 94.8 | index | Normal |  | -1.5 | 0.432432 | 2026-04-01 | 2026-10-16T13:59:56.229Z | ABS (ANA_AGG terms of trade) |  | no | https://data.api.abs.gov.au/rest/data/ANA_AGG/M5.TTR.20.AUS.Q | CC BY 4.0 | no | yes | 2 | {"kind":"consecutive-decline","periods":2} |
| iron-ore | Iron ore price |  | 97.7 | US$ | Context |  | 1.45379 | 0.415254 | 2026-09-01 | 2026-10-16T13:59:56.229Z | World Bank Pink Sheet |  | no | https://www.worldbank.org/en/research/commodity-markets | Unknown (CC BY 4.0 expected, not quoted) | yes | unknown | 2 | {"kind":"info"} |
| gold-aud | Gold price in Australian dollars | gold in A$ | 6057.142 | A$ | Context |  |  |  | 2026-10-16 | 2026-10-16T13:59:56.229Z | gold-api.com × Frankfurter (ECB) |  | no | https://www.gold-api.com | ECB terms via the Frankfurter project (MIT code) | yes | unknown | 2 | {"kind":"info"} |

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
