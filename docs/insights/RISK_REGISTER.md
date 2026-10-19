# Risk Register

Owner: Ali. Site: https://currena.ir/#/insights (public, non-commercial).

## Owner statement (2026-10-17)

"I don't want to make the page private. I take the risk. It's a non-commercial website."

This acceptance covers the sources marked `accepted` below that were already live on 15 October 2026. It does not cover any new source.

## How this file works

- The **agent** fills in: `level`, `terms_lines` (quoted from the provider's own terms), `terms_read_on`, `attribution`, `method`, `notes`. It never changes `owner_accepts` for a new source.
- The **owner** changes `owner_accepts` (yes or no) and `override` (see below).
- Levels are defined in `RULES.md` section 2 (L0, L1, L2, L3).
- A source with level L3 is never used, even if `owner_accepts` is yes. Only an explicit `override: yes` written by the owner changes that. An override never allows circumvention of a block (`RULES.md` 4.3).
- A source with level L2 is used only while `owner_accepts` is yes.
- Setting `enabled` to no (in the registry or here) removes the source's cards on the next refresh.

## Register

The agent copies this table into the repository registry and keeps both in sync. Initial rows are filled from research. The agent must confirm and complete them.

| source id | provider | used for | method (see SCRAPING_SPEC) | level | owner_accepts | override | terms_lines | terms_read_on | attribution | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| rba-tables | RBA | cash rate, yields, loan and deposit rates, commodity index | M2 | L0 | n/a | n/a | (agent fills) | | "Source: Reserve Bank of Australia [year]" | Cash rate and "financial data" have their own terms; third-party content inside tables needs separate checking. |
| abs-data | ABS | CPI, jobs, wages, terms of trade, home values | M1/M2 | L0 | n/a | n/a | (agent fills) | | ABS CC BY 4.0 attribution | |
| fred-public | FRED (series without copyright notice) | US rates, CPI, jobs, stress indexes | M1 | L0 | n/a | n/a | (agent fills) | | "This product uses the FRED API but is not endorsed or certified by the Federal Reserve Bank of St. Louis." | Scan each series for a copyright notice. |
| fred-copyright | FRED series with a copyright notice (VIX from Cboe) | VIX | M1 | L2 | yes | no | (agent fills) | | "© Cboe, via FRED" | Already live. |
| ecb-frankfurter | ECB reference rates via Frankfurter | world currencies | M1 | L1 | n/a | n/a | (agent fills) | | ECB / Frankfurter attribution | Agent confirms terms. |
| world-bank | World Bank | background data | M1 | L1 | n/a | n/a | (agent fills) | | | Agent confirms licence. |
| eodhd | EODHD | world stock markets | M1 | L2 | yes | no | (agent fills) | | "Data: EODHD" | Already live. Personal plan terms. |
| yahoo | Yahoo Finance (unofficial endpoints) | Brent, gold, silver, Bitcoin, FTSE 100 | M3 | L2 | yes | no | (agent fills) | | "Data: Yahoo Finance" | Already live. Unofficial endpoints can break or be blocked: fail closed. |
| gold-api | gold-api.com | copper | M1 | L2 | yes | no | (agent fills) | | "Data: gold-api.com" | Already live. Terms unconfirmed. |
| alternative-me | Alternative.me | crypto Fear and Greed | M1 | L0 | n/a | n/a | (agent fills) | | "Source: Alternative.me" next to the data | Free API; commercial use allowed with attribution displayed. |
| shiller | Robert Shiller dataset | CAPE, Excess CAPE Yield | M2 | L2 | no | no | (agent fills) | | "Data: Robert Shiller, Yale" | New. Disabled until the owner sets owner_accepts to yes. |
| cnn-fng | CNN Fear and Greed | US stock sentiment gauge | M3 (to be confirmed) | (agent decides) | no | no | (agent fills) | | "Source: CNN" | New. Disabled until the owner sets owner_accepts to yes. L3 if the terms or robots.txt prohibit it, or if the site blocks the request. |
| asx-rate-tracker | ASX | market pricing of RBA moves | M3/M4 (to be confirmed) | (agent decides) | no | no | (agent fills) | | "Source: ASX" | New. Same rule as above. |
| westpac-mi | Westpac-Melbourne Institute | consumer sentiment | M5 manual entry | (agent decides) | no | no | (agent fills) | | "Source: Westpac-Melbourne Institute" | New. Manual entry with expiry. |
| aip-petrol | Australian Institute of Petroleum | petrol prices (if a legal feed exists) | (to be confirmed) | (agent decides) | no | no | (agent fills) | | | New. |
| nbs-china | China NBS | China factory activity | M5 manual entry | L1 | n/a | n/a | (agent fills) | | "Source: National Bureau of Statistics of China" | Already live as manual entry. Needs an expiry (defect E-08). |

## Change log

| date | who | change |
|---|---|---|
| 2026-10-17 | owner | Accepted the risk of keeping the page public for the L2 sources already live. |
