# 01. Indicator spec

## How to read this

- **ID** is the stable slug the code uses.
- **Warning rule** is the condition under which the indicator votes "warning" in the summary line. **Info only** cards show data but do not vote.
- **Percentile** = the share of daily (or period) readings over the last 10 years that were lower than today's. "Worst 20%" means the stress end of the range, adjusted for direction.
- **Phase** matches the roadmap (`P1` = first release, `P2` = second wave, `P3` = needs a licence decision).
- Thresholds are **starting points**. They must be backtested (section 4) before launch.

## 1. Global indicators

| ID | Indicator | Group | Warning rule | Phase |
|---|---|---|---|---|
| `yield-curve-10y2y` | US 10Y minus 2Y yield | Rates and credit | Below 0 (inverted) | P1 |
| `stress-stlfsi` | St. Louis Fed Financial Stress Index (replaces the credit spread, see section 3) | Rates and credit | Above 0 for 4 weeks | P1 |
| `real-yield-10y` | US 10Y real yield (inflation-adjusted) | Rates and credit | Highest 20% of 10 years | P1 |
| `us10y` | US 10-year Treasury yield | Rates and credit | Highest 10% of 10 years, or up 0.5 point in 4 weeks | P1 |
| `breakeven-5y5y` | Inflation expectations (5y5y forward) | Rates and credit | Highest 20% of 10 years | P2 |
| `govt-interest-revenue` | US government interest payments / tax revenue | Rates and credit | Highest 20% of 10 years | P2 |
| `dollar-broad` | Broad US dollar index | Currencies | Highest 20% of 10 years | P1 |
| `usdjpy` | USD/JPY | Currencies | Falls more than 5% in 4 weeks | P1 |
| `gold-silver` | Gold / Silver | Metals, crypto, hard assets | Above 80th percentile | P1 |
| `gold-btc` | Gold / Bitcoin | Metals, crypto, hard assets | Info only | P1 |
| `silver-btc` | Silver / Bitcoin | Metals, crypto, hard assets | Info only | P1 |
| `copper-gold` | Copper / Gold | Metals, crypto, hard assets | Lowest 20% (growth fear) | P2 |
| `brent` | Brent oil | Metals, crypto, hard assets | Up 25% in 3 months | P2 |
| `cape` | Shiller CAPE (stock valuation) | Stocks, growth, liquidity | Highest 10% of 10 years | P2 |
| `m2-us` | US M2 money supply | Stocks, growth, liquidity | Falling year on year | P2 |
| `china-pmi` | China manufacturing PMI | Stocks, growth, liquidity | Below 50 | P2 |
| `usdcny` | USD/CNY | Stocks, growth, liquidity | Info only | P2 |
| `vix` | VIX | Stocks, growth, liquidity | Above 30 | **P3 (blocked, see section 3)** |
| `spx-gold` | S&P 500 / Gold | Stocks, growth, liquidity | Lowest 20% | **P3 (blocked)** |
| `breadth` | Market breadth (equal-weight vs regular S&P 500) | Stocks, growth, liquidity | Lowest 20% | **P3 (blocked)** |

Group labels in the UI: Rates and credit; Currencies; Metals, crypto and hard assets; Stocks, growth and liquidity.

## 2. Australian indicators

| ID | Indicator | Group | Warning rule | Phase |
|---|---|---|---|---|
| `rba-cash-rate` | RBA cash rate | Interest and inflation | Info only | P1 |
| `au-cpi` | Monthly CPI (annual change) | Interest and inflation | Above 3% | P1 |
| `au-trimmed-mean` | Trimmed-mean inflation | Interest and inflation | Above 3% | P1 |
| `audusd` | AUD/USD | Currency and trade | Lowest 20% of 10 years | P1 |
| `audjpy` | AUD/JPY | Currency and trade | Falls more than 5% in 4 weeks | P1 |
| `au-us-10y-gap` | Australia vs US 10-year yield gap | Currency and trade | Gap below 0 | P1 |
| `gold-aud` | Gold price in AUD (gold in USD ÷ AUD/USD) | Currency and trade | Info only | P1 |
| `iron-ore` | Iron ore price | Currency and trade | Lowest 20% of 10 years | P2 |
| `terms-of-trade` | Terms of trade | Currency and trade | Falls two quarters in a row | P2 |
| `au-unemployment` | Unemployment rate | Jobs and housing | Up 0.5 point from its 12-month low | P1 |
| `au-home-values` | Residential property price index | Jobs and housing | Falls three periods in a row | P2 |
| `au-household-debt-arrears` | Household debt to income / mortgage arrears | Jobs and housing | Arrears in highest 20% | P2 |

## 3. Licensing correction (important)

An earlier draft listed the high-yield credit spread, VIX and S&P 500 as ordinary free FRED data. **They are not safe to republish.** FRED carries third-party copyrighted series (S&P, ICE BofA, Moody's, Cboe), and FRED's own guidance is that the user is responsible for permission when using copyrighted series beyond personal use. A public website needs permission or a different series.

| Blocked item | Why | Substitute |
|---|---|---|
| High-yield credit spread (ICE BofA) | Third-party copyright | `stress-stlfsi` (St. Louis Fed Financial Stress Index, weekly) or Chicago Fed NFCI, both Federal Reserve data. Confirm licence status at Gate I0. |
| VIX (Cboe) | Third-party copyright | Leave out of v1. A link-out to Cboe is allowed. Revisit if a licence is obtained. |
| S&P 500 / Gold, market breadth | Needs licensed index data | Leave out of v1 (P3). |

## 4. How the summary line works

1. Every indicator with a warning rule casts one vote: **warning** or **not**. Info-only cards do not vote.
2. All votes count equally. No hidden weighting.
3. Score = indicators in warning ÷ indicators that voted. **Global** and **Australia** each get their own score.
4. Labels: under 20% **Relaxed**, 20–39% **Cautious**, 40–59% **Stressed**, 60% or more **Alarmed**. Farsi wording is in `02-page-design-spec.md`.
5. The line reads like: "Global: Cautious. 4 of 14 indicators in warning." Clicking it shows every vote.
6. An indicator whose data is older than its normal update cycle plus a grace period is shown greyed out and excluded from the count. The line shows how many indicators were excluded.
7. **Backtest before launch.** Run the scoring on historical data for 2008, 2020 and 2022 and confirm the labels move sensibly. Record the results in `docs/insights/BACKTEST.md`. Adjust thresholds only with the owner's approval.

## 5. Rule types (for the scoring code)

| Type | Meaning |
|---|---|
| `threshold` | Value above or below a fixed number |
| `percentile` | Value in the high or low tail of its 10-year history (cutoff as a fraction) |
| `change` | Percentage or point change over a window (for example 4 weeks) |
| `yoy-negative` | Year-on-year change below zero |
| `consecutive-decline` | N periods in a row of decline |
| `above-low` | Rise from the lowest value in the last 12 months |
| `info` | No vote |

Direction (which tail is "bad") is part of each rule, never inferred.
