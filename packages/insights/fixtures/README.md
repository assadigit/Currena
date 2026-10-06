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
