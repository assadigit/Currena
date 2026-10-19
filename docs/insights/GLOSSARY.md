# Glossary

One vocabulary for the page, the specs and the agent. Page text uses the plain wording in the "Say it like this" column. Do not invent new status words.

## Status and verdict words

| Term | Meaning | Say it like this |
|---|---|---|
| Normal | The reading is inside its usual range under the published rule. | "Normal" |
| Needs attention | A published rule fired for this indicator. | "Needs attention" |
| Context | Shown for information. Not counted in verdicts. | "Context" |
| Stale | The data is older than it should be for how often it updates. The age is shown. | "Stale (8 days old)" |
| Delayed | The data is one trading day or release behind its peers. | "Delayed" |
| Can't tell right now | The value failed a check, the source failed, was blocked, or could not be verified. The value is hidden. | "Can't tell right now" |
| Stable, Cautious, Stressed, Critical | The four hero levels, chosen only by the published counting rule. A summary of the gauges, not a forecast. | "Summary of the gauges below" |

## Data terms

| Term | Meaning |
|---|---|
| Data date | The period or day the number describes (for quarterly data, the quarter name, for example "June quarter 2026"). |
| Published date | The day the publisher released it (for example the CPI release day). |
| Fetched time | When Currena downloaded it, in UTC. |
| Snapshot | The saved set of all values and statuses at one refresh. One is archived each day. |
| Registry | The single file that defines every indicator: source, unit, cadence, thresholds, text templates. |
| Rule version | The version number of the scoring rules. Shown on the page. |
| Same-date rule | A spread or ratio uses values from the same date, or says the dates differ. |
| Fail closed | When unsure, show nothing rather than something wrong. |
| Closing basis | Peaks and drawdowns use closing prices, not intraday highs. |
| 10-year position | Where today's value sits within its own last 10 years (0% lowest, 100% highest). Used for rates and ratios, not for totals that always trend up. |
| Highest since | The most recent earlier date when the value was as high as today. |

## Finance terms (plain meaning)

| Term | Plain meaning |
|---|---|
| Policy rate / cash rate | The central bank's main interest rate. It steers savings, loan and bond rates. |
| Yield | The interest rate the government pays to borrow for a set time (for example 10 years). |
| Real yield | A yield after taking out expected inflation. |
| Breakeven inflation | The inflation rate markets are pricing, from the gap between a normal and an inflation-linked bond yield. |
| Yield curve (10-year minus 2-year) | Long-term rates minus short-term rates. Its shape is a widely watched gauge. |
| Trimmed mean | Australia's "underlying inflation": CPI with the biggest rises and falls removed. |
| Terms of trade | Australia's export prices divided by its import prices. |
| Term deposit | A savings product that locks money for a set period at a fixed rate. |
| Real return on savings | The deposit rate minus inflation, shown before tax. |
| Correction | A fall of 10% or more from the 52-week high (a market convention). |
| Bear market | A fall of 20% or more from the 52-week high (a market convention). |
| VIX | A gauge of how nervous US stock investors are, from share-option prices. |
| Sahm rule | A recession alarm that triggers when US unemployment has risen about half a point above its recent low. |
| CAPE | A long-run price-to-earnings ratio for the S&P 500 (Shiller). It measures valuation, not timing. |
| Excess CAPE Yield | The inverse of CAPE minus the real 10-year Treasury yield. |
| Local currency | Returns in each market's own currency, not converted. |

## Process terms

| Term | Meaning |
|---|---|
| L0, L1, L2, L3 | Source risk levels from `RULES.md` section 2. L0 clearly allowed, L1 probably fine, L2 restricted or unclear and accepted by the owner, L3 never used. |
| Owner accepts | The owner's recorded acceptance of the risk for one L2 source in `RISK_REGISTER.md`. |
| Method ladder (M1 to M5) | The only allowed ways to get data, from an official API (M1) to manual entry (M5). |
| Blocked | The site refused the request. The source becomes a link-out. Nothing tries to get around it. |
| Link out | The page links to the publisher instead of showing its number. |
| Panic switch | The setting that makes all Insights data private within one refresh cycle. |
| Kill switch | The per-source setting that removes one source's cards. |
| Baseline | The page export from 15 October 2026 that the defect list was written against. |

## About "G"

The request listed "G" after Instructions. This glossary is that "G". If something else was meant, say so, and add it as a new file in `docs/insights/`.
