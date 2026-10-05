# 03. Data sources register

## Verification legend

- ✅ Confirmed from an official page during planning (2026-10-06).
- ◐ Seen in secondary sources only. **Verify before coding.**
- ☐ Not checked. **Verify before coding.**

## Verify-first rule

Before writing any adapter, the agent probes the endpoint or series ID once with a scratch script (not part of the test suite) and records the result in this file: the date, the HTTP status, a sample of the response shape, the update cadence and the licence terms. A source whose licence cannot be confirmed as allowing public display is not used. Tests never call live sites; they use recorded fixtures (`AGENTS.md` rule 7).

## 1. Sources by provider

### FRED (Federal Reserve Bank of St. Louis)

- **Access:** free API key required (`api.stlouisfed.org/fred/series/observations`). ✅ for the key requirement.
- **Licence:** FRED carries third-party copyrighted series (S&P, ICE BofA, Moody's, Cboe). The user is responsible for permission when using those beyond personal use. Only use U.S.-government or other series confirmed as publishable. ✅ for the warning, ☐ per series.
- **Candidate series (verify each ID exists and is current):**

| Indicator ID | Candidate series | Cadence | Status |
|---|---|---|---|
| `yield-curve-10y2y` | `T10Y2Y` | Daily | ◐ |
| `real-yield-10y` | `DFII10` | Daily | ◐ |
| `us10y` | `DGS10` | Daily | ◐ |
| `au-us-10y-gap` (US side) | `DGS10` | Daily | ◐ |
| `breakeven-5y5y` | `T5YIFR` | Daily | ◐ |
| `dollar-broad` | `DTWEXBGS` | Daily | ◐ |
| `stress-stlfsi` | `STLFSI4` (or Chicago Fed `NFCI`) | Weekly | ◐ |
| `m2-us` | `M2SL` | Monthly | ◐ |
| `govt-interest-revenue` | A federal interest-payments series and a federal receipts series (agent to identify and verify, quarterly) | Quarterly | ☐ |
| `brent` | `DCOILBRENTEU` | Daily | ◐ |

- **Not to be used:** ICE BofA credit spreads, VIX, S&P 500 (copyrighted). See `01-indicator-spec.md` section 3.

### RBA (Reserve Bank of Australia)

- **Access:** statistical tables published as CSV at predictable URLs, no key: `https://www.rba.gov.au/statistics/tables/csv/<table>-data.csv`. ◐
- **Tables (verify IDs and column names):**

| Indicator ID | Table | Cadence | Status |
|---|---|---|---|
| `rba-cash-rate` | F1.1 (money market, cash rate target) | Per change | ◐ |
| `audusd`, `audjpy`, `usdcny` (cross-check) | F11.1 (daily) and F11 (monthly history from 1983) | Daily / monthly | ◐ |
| `au-us-10y-gap` (Australian side) | F2 (capital market yields, government bonds) | Daily | ◐ |
| `au-household-debt-arrears` | A household finance ratios table (agent to identify) | Quarterly | ☐ |

- **Note:** the daily FX table starts only in 2023, so 10-year percentiles need the monthly F11 history combined with the daily series. ◐
- **Current policy rate (for reference):** 4.60% after the 29 September 2026 RBA decision. ✅ (RBA statement)
- **Licence:** ☐ read the RBA copyright and attribution terms.

### ABS (Australian Bureau of Statistics)

- **Access:** the ABS Data API (`data.api.abs.gov.au`, SDMX) is described as keyless. ◐ The separate ABS **Indicator API** (`indicator.api.abs.gov.au`, monthly CPI indicator and others) **requires an API key** requested from the ABS. ✅
- **Candidate datasets (verify dataflow IDs in the live catalogue):**

| Indicator ID | Dataset | Cadence | Status |
|---|---|---|---|
| `au-cpi`, `au-trimmed-mean` | Monthly CPI indicator (via Indicator API if the Data API does not carry it) | Monthly | ◐ |
| `au-unemployment` | Labour Force (`LF`) | Monthly | ◐ |
| `au-home-values` | Residential Property Price Indexes (official, free route; Cotality has no confirmed free API) | Quarterly | ☐ |
| `terms-of-trade` | National accounts or international trade price indexes | Quarterly | ☐ |

- **Licence:** ☐ read the ABS content licence and the Indicator API terms of use. Credit the ABS on each card.

### Live and FX data already in the repo

- **TGJU `ajax.json`:** the existing scraper already provides the global gold ounce in USD (slug `ons`, id `gold-ounce`). Reuse it for `gold-btc`, `gold-silver`, `gold-aud`. Silver and Bitcoin are **not** present in the existing TGJU fixture. ✅ (repo inspection)
- **Frankfurter (ECB reference rates):** already serves USD, JPY, AUD, CNY and others. It updates **once per business day**, so USD/JPY, AUD/USD, AUD/JPY and USD/CNY are daily, not live. Use for FX indicators; cross-check against RBA F11.1. ✅ (repo behaviour)

### Silver and Bitcoin (new sources, to decide at Gate I0)

| Need | Candidate | Notes | Status |
|---|---|---|---|
| Silver spot (XAG) | gold-api.com (free, keyless, per secondary sources) | Read terms at gold-api.com/terms | ◐ |
| Silver spot, fallback | MetalCharts free tier (1,000 "weight"/month, says commercial use permitted) | A small quota (about 33 calls/day); read terms | ◐ |
| Bitcoin spot and history | Coinbase public market-data endpoints | Candidate; read terms | ☐ |
| Bitcoin, fallback | CoinGecko | Attribution required; secondary sources say the free tiers are non-commercial and history is capped at 365 days. A paid plan may be needed. | ◐ |

### Monthly commodity history

- **World Bank Commodity Price Data ("Pink Sheet")**: monthly prices for gold, silver, copper, iron ore and Brent, with long history. Candidate for `copper-gold`, `iron-ore`, and for 10-year backfill of the metals. Verify the file URL, update cadence (lags about a month) and licence. ☐

### Other

| Indicator ID | Source | Notes | Status |
|---|---|---|---|
| `cape` | Robert Shiller's published monthly dataset (Yale) | Verify URL and reuse terms | ☐ |
| `china-pmi` | China National Bureau of Statistics official PMI | No stable machine-readable feed confirmed. Fall back to a **manual monthly entry** in a zod-validated JSON file until a reliable source is found | ☐ |
| Calendar (RBA, ABS CPI, Fed meetings) | The official published schedules | Entered by hand once or twice a year in `data/insights-calendar.json` (zod-validated) | ☐ |

## 2. Platform limits that shape the design

Confirmed from Cloudflare's published limits (Workers Free vs Paid) ✅:

| Limit | Free | Paid |
|---|---|---|
| Subrequests per invocation | 50 | 10,000 |
| CPU time per Cron Trigger | 10 ms | 30 s (< 1 hour interval), 15 min (≥ 1 hour) |
| Cron Triggers per account | 5 | 250 |
| Requests per day | 100,000 | no limit |

Why this matters: parsing large CSV or JSON series (an RBA table is around ten thousand rows) inside a Free-plan cron is unlikely to fit in 10 ms of CPU. The roadmap therefore runs heavy ingestion **outside** the Worker by default. See `04-roadmap.md` section 2.

## 3. Attribution and display

Every card shows the source name and date (`Updated [date] · Source [name]`). Providers that require attribution (ABS, RBA, CoinGecko if used, World Bank) are credited in the "About the data" section and on the card. Do not remove attribution to save space.
