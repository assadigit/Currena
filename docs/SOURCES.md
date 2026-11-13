# Data Sources

This document records every data source Currena uses, its licence level, and its display permission. It was moved from the legacy /insights "About this data" section (TM14).

## Licence levels

- **L0** — public display clearly permitted (open licence or public domain)
- **L1** — likely no barrier for public non-commercial site; terms not explicit
- **L2** — terms restrict display or republication; shown with owner-accepted registration
- **L3** — never copied; link to source only

## Sources

| Source | Series count | Licence level | Licence | Active |
|---|---|---|---|---|
| Alternative.me (Crypto Fear and Greed) | 1 | L0 | Free API — attribution next to the data | ✅ |
| Australian Bureau of Statistics | 19 | L0 | CC BY 4.0 | ✅ |
| bazg | 1 | L1 | opendata.swiss terms_by_ask — non-commercial use permitted | ✅ |
| boe | 1 | L2 | UK Open Government Licence v3.0 | ✅ |
| cftc | 2 | L0 | US government work — public domain (17 U.S.C. § 105) | ✅ |
| China NBS (English press releases) | 4 | L1 | NBS Terms of Service — attributed quotation + data download granted | ✅ |
| cleveland | 1 | L2 | © Federal Reserve Bank of Cleveland — owner-accepted | ✅ |
| Currena's own computed series | 28 | L2 | Computed from upstream sources; their terms apply | ✅ |
| ECB Data Portal | 3 | L1 | ECB website terms (free use, accurate + cited) | ✅ |
| ECB reference rates via the Frankfurter project | 5 | L1 | ECB website terms via Frankfurter (MIT code) | ✅ |
| eia | 3 | L0 | US government work — public domain | ✅ |
| epu | 2 | L0 | Free use with attribution | ✅ |
| fiscaldata | 4 | L0 | US government work — public domain | ✅ |
| frb | 1 | L0 | US government work — public domain | ✅ |
| FRED, Federal Reserve Bank of St. Louis | 57 | L2 | FRED licence (citation required / public domain) | ✅ |
| fund-pages | 1 | L2 | No licence-clean venue verified — fail closed | ❌ |
| gold-api.com | 5 | L2 | CC BY 4.0 / no reuse licence (unofficial endpoints) | ✅ |
| gpr | 1 | L0 | Creative Commons BY 4.0 | ✅ |
| imf | 4 | L1 | IMF Terms of Use — special terms for statistical data | ✅ |
| Japan Ministry of Finance (JGB interest rates) | 1 | L2 | FRED licence (citation required) | ✅ |
| nyfed | 2 | L1 | New York Fed Terms of Use — non-exclusive reuse licence | ✅ |
| oecd | 4 | L0 | OECD reuse terms — free with suitable acknowledgment | ✅ |
| ofr | 1 | L0 | US government work — public domain | ✅ |
| pboc | 1 | L2 | Unreadable from this venue — fail closed | ❌ |
| portwatch | 5 | L1 | IMF Terms of Use | ✅ |
| Reserve Bank of Australia (statistical tables) | 5 | L0 | CC BY 4.0 (RBA terms) | ✅ |
| Robert Shiller dataset (ie_data) | 2 | L2 | Open academic data — attribution; no formal reuse terms | ✅ |
| sge | 1 | L2 | Exchange market data — © SGE, owner-accepted | ✅ |
| U.S. Treasury TIC (SLT tables) | 2 | L0 | 17 U.S.C. § 105 — public domain | 1 of 2 active |
| uom | 1 | L1 | CC BY-NC-ND 4.0 | ✅ |
| wgc | 2 | L3 | Prior written authorisation required — never fetched | ❌ |
| World Bank (Commodity Markets "Pink Sheet") | 7 | L1 | CC BY 4.0 (World Bank Dataset Terms) | ✅ |
| yahoo | 2 | L2 | No reuse licence offered (unofficial endpoints) | ✅ |

A source that is off is not fetched and its cards are not shown.

## Update schedule

A scheduled process updates all sources every day at 04:20 UTC and stores a pre-computed version of the data. The page you see displays this stored version. Daily data updates daily; monthly and quarterly data updates alongside the official publisher release. World stock market data updates on a separate schedule — at 23:30 UTC on working-day evenings.

## How warning levels are determined

**Needs attention**: a specific, pre-announced rule for that indicator has triggered. The rule is explained on the indicator's own card. **Unusual**: no specific rule has triggered, but the indicator's latest value sits in the top or bottom 10% of its 10-year range. Both levels help interpret the indicator's value in its historical context.

The thresholds have been tested against three past crises (2008, 2020, 2022). This sample is limited and the related tables are in the project docs.

Rule version 4; changes are recorded in the repository: `packages/insights/src/ruleVersion.ts`

## Disclaimer

This page provides general information about economic and market indicators. Its content is not financial advice and no part of it constitutes a recommendation to buy, sell, or act on any asset.

Indicators describe past and present conditions and do not predict the future. Data may be published with delay, revised later, or contain errors. For financial decisions, consult primary sources and seek professional advice if needed. Currena is not licensed to provide financial advice.

Questions about this data? Contact: https://github.com/assadigit/Currena
