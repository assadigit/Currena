# Insights fixtures — recorded historical captures

Recorded **once** on 2026-10-06 (Phase I1) with throwaway fetch scripts; committed
as static evidence so tests and the backtest **never hit live sites**
(AGENTS.md rule 7). Each file is a raw capture or a verbatim column extraction
from one; no values are edited or invented. Sources and licences are verified in
`docs/insights/03-data-sources.md`.

| File | Source & URL | Window | Licence |
|---|---|---|---|
| `fred-T10Y2Y.csv` … `fred-T5YIFR.csv` | FRED keyless CSV, `fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>&cosd=2004-01-01` | daily, 2004-01-02 → 2026-10-05 | U.S. government, public domain |
| `fred-STLFSI4.csv` | same, no `cosd` (full history) | weekly, 1993 → 2026-09-25 | public domain |
| `fred-M2SL.csv` | same, full history | monthly, 1959 → 2026-08 | public domain |
| `fred-A091RC1Q027SBEA.csv`, `fred-W006RC1Q027SBEA.csv` | same, full history | quarterly → 2026-04-01 | public domain |
| `frankfurter-usd-jpy-aud-cny-2004.json` | `api.frankfurter.dev/v1/2004-01-01..2026-10-06?from=USD&to=JPY,AUD,CNY` | business days, 2003-12-31 → 2026-10-05 | ECB reuse policy (display with attribution) |
| `worldbank-pink-monthly-2004.csv` | World Bank CMO Historical Data Monthly XLSX (current file from worldbank.org/en/research/commodity-markets), columns Brent / iron ore / copper / gold / silver extracted verbatim | monthly, 2004M01 → 2026M09 | CC BY 4.0 |
| `abs-cpi-all-groups-quarterly-2004.csv` | ABS Data API `rest/data/CPI/1.10001.10.50.Q` (All groups CPI, original, Australia, index numbers) | quarterly, 2004-Q1 → 2026-Q2 | CC BY 4.0 |
| `abs-cpi-trimmed-mean-quarterly-2004.csv` | ABS Data API `rest/data/CPI_Q` key `1.999902.20.50.Q` (Trimmed Mean, seasonally adjusted, index numbers) | quarterly, 2004-Q1 → 2026-Q2 | CC BY 4.0 |
| `abs-unemployment-monthly-2004.csv` | ABS Data API `rest/data/LF/M13.3.1599.20.AUS.M` (Unemployment rate, persons, SA, Australia) | monthly, 2004-01 → 2026-08 | CC BY 4.0 |
| `goldapi-xag.json`, `goldapi-btc.json` | gold-api.com `https://api.gold-api.com/price/XAG` / `…/BTC` | spot snapshots, 2026-10-06 15:19Z | commercial display explicitly permitted (terms read, Gate I0 D3) |
| `bitstamp-btcusd-ohlc.json` | Bitstamp `https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=86400&limit=10` | 10 daily candles ending 2026-10-06 | public API |
| `frankfurter-usd-timeseries-small.json` | `api.frankfurter.dev/v1/2026-09-25..2026-10-06?from=USD&to=JPY,AUD,CNY` | business days 2026-09-25 → 2026-10-06 | ECB reuse policy |
| `abs-sdmx-cpi.csv` … `abs-sdmx-terms-of-trade.csv` (5 files) | ABS Data API `/rest/data/…?format=csv` small windows (the live SDMX response format — column order varies by flow) | 2025-Q1 → 2026-Q2 windows | CC BY 4.0 |
| `worldbank-cmo-monthly.xlsx` | World Bank CMO Historical Data Monthly XLSX (the FULL real workbook, current URL from the commodity-markets page) | 1960M01 → 2026M09 | CC BY 4.0 |
| `rba-f1.1-data.csv`, `rba-f2-data.csv`, `rba-e2-data.csv` | RBA statistical tables `https://www.rba.gov.au/statistics/tables/csv/<t>-data.csv` — fetched from the **GitHub Actions ingestion venue** (probe run 37492764171, branch probe/i2-rba-venue, 2026-10-06; the build sandbox is Akamai-blocked) | F1.1 monthly → 2026-09 · F2 daily 2013-05-20 → 2026-09-30 · E2 quarterly 1988 → 2026-Q2 | CC BY 4.0 |
| `gold-backtest-corpus.json` | The Gold Program S4 backtest corpus — recorded 2026-10-31T12:34Z by `scripts/gold-corpus-dump.ts` via the **read-only Cloudflare KV REST API** (the RATES namespace; credentials from the environment only, never recorded). Carries the `insights:ingest-stage:v1` series for the 20 gold voters + breakeven-tilt + gold-usd + the cross-fill legs (us10y = DGS10, breakeven-10y = T10YIE, t5yie), the verbatim `insights:hist:gold-usd` points, and the 16 archived days' readings for the same ids (each archive zod-validated with the production `InsightsSnapshotSchema` before extraction). Regenerate with `pnpm --filter @currena/insights gold-corpus-dump` as the corpus grows. | stage series 2016-09-23 → 2026-10-30/31 · gold hist 2016-11-02 → 2026-10-31 (2,514 obs) · archives 2026-10-15 → 2026-10-31 | same licences as the underlying sources (FRED public domain, Frankfurter/ECB reuse, gold-api display) — no new sources |


Notes:

- The Frankfurter file records `1 USD = x JPY/AUD/CNY` reference rates (ECB
  convention). AUD-crosses (AUD/USD, AUD/JPY) are computed from it by pure
  functions in the backtest, exactly as the I2 adapters will.
- The two ABS CPI files use different index reference bases (the main CPI flow
  is on the re-referenced 17th-series base; CPI_Q analytical series on the
  2011-12 base). Bases are internal to each file — only within-file ratios
  (year-on-year change) are ever computed, which is base-invariant.
- RBA series are **absent**: `rba.gov.au` is Akamai-blocked from this sandbox
  (see 03-data-sources.md). `rba-cash-rate` is info-only and `au-us-10y-gap`
  is marked not-backtested pending the Phase I2 venue re-probe.
- `gold-btc` / `silver-btc` (info-only, never vote) have no fixtures: their
  live sources (gold-api.com, Bitstamp) are I2 adapter work.
