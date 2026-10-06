# 03. Data sources register

## Verification legend

- ✅ Probed live during Phase I0 (2026-10-06) — HTTP status, response shape, observation currency, cadence and licence recorded below.
- ◐ Seen in secondary sources only. **Verify before coding.**
- ☐ Not checked. **Verify before coding.**
- ❌ Probed and **blocked** — licence does not allow public display, or the endpoint is unusable. Do not use.

> **Provenance note (2026-10-06).** The Phase I0 probe battery ran with throwaway scripts (nothing committed). This register was reconstructed after the working copy was lost to an environment reset; verdicts, licence findings, dates and observation currency are from the probe log recorded the same day. Two sandbox egress quirks affected the probe and are flagged inline: `rba.gov.au` answers **403 (Akamai)** to the build sandbox, and ABS non-`/rest/` paths 403. Licence pages the sandbox could not reach were fetched through an alternate egress. Any source flagged *sandbox-blocked* must be re-probed **from the real ingestion venue** (GitHub Actions runner or Worker) before its Phase I2 adapter is written.

## Verify-first rule

Before writing any adapter, the agent probes the endpoint or series ID once with a scratch script (not part of the test suite) and records the result in this file: the date, the HTTP status, a sample of the response shape, the update cadence and the licence terms. A source whose licence cannot be confirmed as allowing public display is not used. Tests never call live sites; they use recorded fixtures (`AGENTS.md` rule 7).

## Phase I2 record (2026-10-06) — adapters built, live runs green

Every I2 adapter (FRED / Frankfurter / ABS / World Bank / gold-api / Bitstamp / TGJU / RBA / manual-series loader / derived assembly) is fixture-tested (110 package tests) and was exercised live twice from the sandbox and twice from the **GitHub Actions ingestion venue** (probe runs 37492764171 and 37493966768, branch `probe/i2-rba-venue`):

- **Final venue live run (exit criterion):** 27/27 source fetches OK; **every P1 indicator printed a sane live value** (`P1 COMPLETE` from `pnpm --filter @currena/insights live-run`); Global summary relaxed 1/8 voting, Australia cautious 3/10 voting, 0 excluded.
- **Cross-checks:** TGJU gold ounce vs gold-api XAU **0.00–0.05%**; gold-api BTC vs Bitstamp last daily close **0.02–0.09%** across runs.
- **Sandbox vs venue:** identical results everywhere except RBA — the sandbox is Akamai-403 (loud adapter failure → honest unavailable rows), the venue is HTTP 200.
- **Runner-side gates:** `pnpm install --frozen-lockfile` + insights typecheck + 110 tests also ran green from the venue (the runner's strict gate caught two live-run typing slips the sandbox check had missed — fixed).

## 1. Sources by provider

### FRED (Federal Reserve Bank of St. Louis) — ✅ all series verified, keyless

- **Access (probe 2026-10-06):** every series below is served as CSV **without an API key** from `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>` (HTTP 200, current observations; series metadata pages also read). **No FRED API key is needed** for the planned route; the keyed JSON API (`api.stlouisfed.org`) remains an optional fallback (owner-created key, stored as a GitHub secret, only if we ever switch).
- **Phase I2 header finding (2026-10-06):** FRED's Akamai edge **hangs (connection timeout) on a desktop-Chrome User-Agent** from the build egress — a headerless or descriptive-UA request answers in ~50 ms. The FRED adapter therefore sends `CurrenaInsights/1.0 (…)`, re-verified live from the ingestion venue. All other sources accept the browser fingerprint.
- **Licence (probe 2026-10-06):** FRED legal page read. Every series used is U.S.-government-sourced (**public domain**); `DCOILBRENTEU` is now sourced from EIA — EIA terms read, also U.S. government / public domain. Third-party copyrighted FRED series (ICE BofA, Cboe, S&P) remain **not used** — see "Blocked sources" below.

| Indicator ID | Series | Cadence | Probe verdict |
|---|---|---|---|
| `yield-curve-10y2y` | `T10Y2Y` | Daily | ✅ current |
| `real-yield-10y` | `DFII10` | Daily | ✅ current |
| `us10y` / `au-us-10y-gap` (US side) | `DGS10` | Daily | ✅ current |
| `breakeven-5y5y` | `T5YIFR` | Daily | ✅ current |
| `dollar-broad` | `DTWEXBGS` | Daily | ✅ current |
| `stress-stlfsi` | `STLFSI4` | Weekly | ✅ current — **Gate I0 D2: confirmed as the stress indicator** (the Chicago Fed `NFCI` alternative is not needed) |
| `m2-us` | `M2SL` | Monthly | ✅ current |
| `govt-interest-revenue` | `A091RC1Q027SBEA` (federal interest payments) ÷ `W006RC1Q027SBEA` (federal receipts) | Quarterly | ✅ both series identified and verified current — fills the "agent to identify" slot from planning |
| `brent` | `DCOILBRENTEU` | Daily | ✅ current (EIA-sourced) |

### RBA (Reserve Bank of Australia) — licence ✅, access venue-verified ✅ (Phase I2)

- **Licence (probe 2026-10-06):** RBA Copyright and Disclaimer Notice read (fetched via alternate egress after the sandbox 403): **CC BY 4.0** — display permitted with attribution ✅.
- **Access (Phase I2 venue probe, 2026-10-06, GitHub Actions runner, probe run 37492764171):** `https://www.rba.gov.au/statistics/tables/csv/<table>-data.csv` answers **HTTP 200** with browser headers from the ingestion venue — F1.1 (43,862 B), F2 (201,065 B), E2 (75,585 B), F11.1 (140,337 B) all fetched and their bytes recorded as fixtures. The build sandbox remains Akamai-403 (re-verified from two different sandbox egresses; the alternate-egress page reader also refuses CSV downloads — `application/octet-stream`), so RBA adapters are tested against the venue-recorded fixtures and go loud-unavailable from the sandbox.
- **Format (verified from the real bytes):** title line + `Title,<series…>` header + 7 metadata rows + date-keyed data rows; **date formats vary by table** (F1.1/E2 day-first `30/09/2026`, F2/F11.1 `30-Sep-2026`); E2 pre-scaffolds future quarters with empty values (skipped). The parser (`parseRbaTableCsv`) validates the table-code prefix and series title loudly.
- **Calibration finding:** F2 publishes with a 2–4 business-day lag → `au-us-10y-gap` cadence set to `weekly` (definitions.ts) so ordinary publication lags do not trip the 3-day daily stale grace; the value itself stays daily.
- **Correction of an I0 reference note:** the I0 probe recorded "4.60% after the 29 September 2026 RBA decision" from a statement page; F1.1's own published series shows the cash-rate target at 4.35–4.36 through mid-2026 (Sep monthly average 4.36). F1.1 is authoritative; the 4.60 note is retired. (F1.1's cash-rate column is the *monthly average* — the daily F1 table is a documented one-line upgrade if daily precision is wanted.)

| Indicator ID | Table | Cadence | Status |
|---|---|---|---|
| `rba-cash-rate` | F1.1 'Cash Rate Target' (monthly average) | Per change | ✅ venue-verified; live through 2026-09 |
| `au-us-10y-gap` (AU side) | F2 'Australian Government 10 year bond' | Daily (publishes T+2..4) | ✅ venue-verified; live through 2026-09-30 |
| `au-household-debt-arrears` | **E2 'Household debt to income'** (ABS-calculated ratios republished by RBA) | Quarterly | ✅ venue-verified; live through 2026-Q2 — the "ABS E2" planning slot resolves to this RBA table (the ABS Data API carries no household-finance-ratios dataflow; catalogue searched in full) |
| `audusd`, `audjpy`, `usdcny` (cross-check) | F11.1 (daily 2023→current) + F11 (monthly from 1983) | Daily / monthly | ◐ available and venue-reachable; **not wired** — FX indicators use Frankfurter (ECB history back to 2004 covers the 10-year percentiles), F11 cross-check documented for a future hardening pass |

### ABS (Australian Bureau of Statistics) — ✅ Data API keyless works

- **Access (probe 2026-10-06):** `data.api.abs.gov.au` **`/rest/` paths are keyless and live**: the catalogue XML (1,227 dataflows) and data queries all returned HTTP 200. Non-`/rest/` paths 403 from the sandbox (caveat only — not needed).
- **Licence (probe 2026-10-06):** ABS website terms read — **CC BY 4.0** ✅, attribution required (already in the design: credit on each card + "About the data").
- **Indicator API** (`indicator.api.abs.gov.au`): requires an API key ✅ (requirement confirmed). Only needed if monthly CPI cadence is wanted — owner-side key decision at Phase I2.

| Indicator ID | Dataset | Cadence | Probe verdict |
|---|---|---|---|
| `au-unemployment` | `LF` (Labour Force) | Monthly | ✅ current |
| `au-cpi` | `CPI_Q` (quarterly route) / `CPI_M` (monthly) | Quarterly / monthly | `CPI_Q` ✅ current; `CPI_M` on the Data API probed **stale** — the fresh monthly indicator lives on the keyed Indicator API. Phase I2 decision: **serve `au-cpi` quarterly from `CPI` flow key `1.10001.10.50.Q`** (headline All groups index, annual change derived); monthly cadence remains a keyed-API upgrade, owner-side key decision deferred until wanted |
| `au-trimmed-mean` | `CPI_Q` key `1.999902.20.50.Q` | Quarterly | ✅ current (quarterly trimmed-mean dimension confirmed in the Data API — no Indicator-API key needed) |
| `au-home-values` | `RES_DWELL_ST` key `5.AUS.Q` (mean price of residential dwellings, Australia) | Quarterly | ✅ current — replaces RPPI, which probed stale; live through 2026-Q2 |
| `terms-of-trade` | `ANA_AGG` key `M5.TTR.20.AUS.Q` (terms of trade index, SA) | Quarterly | ✅ current — dimension key discovered in Phase I2 (DATA_ITEM `TTR`, measure `M5` = index); live through 2026-Q2; note the API returns rows **unordered** (the parser sorts) |
| `au-household-debt-arrears` | ~~ABS E2~~ → **RBA table E2** 'Household debt to income' | Quarterly | ✅ venue-verified — see the RBA section (the ABS Data API catalogue carries no household-finance-ratios dataflow) |

### Live and FX data already in the repo — ✅ re-verified

- **TGJU `ajax.json`:** re-probed 2026-10-06 — HTTP 200, 963 symbols, gold ounce (`ons`) fresh ✅. Reused for the numerators of `gold-btc`, `gold-silver`, `gold-aud`. Silver and Bitcoin themselves are not in TGJU — external sources below.
- **Frankfurter (ECB reference rates):** re-probed 2026-10-06 — HTTP 200, latest rates 2026-10-05 ✅. Daily (per business day) as before. Used for FX indicators; cross-checked **consistent with TGJU** during the probe. Phase I2: the **open-ended timeseries form** `v1/<start>..?from=USD&to=…` verified live (end date auto-fills with the latest business day) — one request covers every FX indicator's 10-year history. Phase I2: the **open-ended timeseries form** `v1/<start>..?from=USD&to=…` verified live (end date auto-fills with the latest business day) — one request covers every FX indicator's 10-year history.

### Silver and Bitcoin — decided at Gate I0 (D3), verified in Phase I2

| Need | Source | Verdict |
|---|---|---|
| Silver spot (XAG) | **gold-api.com — PRIMARY** | ✅ probed live (XAG, XAU, BTC, ETH, XPD, XPT, HG + a `/symbols` endpoint); terms read — **commercial display explicitly permitted**; zod contract pinned (price/updatedAt/symbol) |
| Bitcoin spot | **gold-api.com — PRIMARY** | ✅ same probe; live cross-check vs Bitstamp close: **0.02–0.09%** drift across I2 runs |
| Bitcoin daily history (10-year backfill) | **Bitstamp public OHLC** | ✅ probed live, keyless; Phase I2 finding: `limit` is REQUIRED together with `start`/`end` and caps at **1000 candles** per request — deep backfills must be chunked (runner concern, Phase I3) |

### Monthly commodity history — ✅ World Bank Commodity Price Data ("Pink Sheet")

- **Probe 2026-10-06:** monthly XLSX fetched and parsed — coverage **1960M01 → 2026M09**; gold, silver, copper, iron ore and Brent columns all present.
- **Phase I2 format verification (from the real workbook):** the adapter scrapes the CURRENT monthly-workbook link off the commodity-markets page (the thedocs.worldbank.org document-hash URL rotates with every release — two different hashes already observed), then parses the XLSX with a dependency-free web-standard reader (`DecompressionStream`); column identity is asserted from BOTH the header row and the units row (Brent `($/bbl)` C, iron ore `($/dmtu)` BL, copper `($/mt)` BM, gold/silver `($/troy oz)` BR/BT), and `t="e"` error cells are skipped as missing.
- **Licence:** **CC BY 4.0** ✅ (verified on the World Bank data catalog and data.worldbank.org terms).
- Serves `copper-gold`, `iron-ore`, `brent` (P2, FRED-primary fallback) and the 10-year metals backfill.

### Other

| Indicator ID | Source | Verdict |
|---|---|---|
| `cape` | Robert Shiller's dataset (Yale) | ❌ **deferred to P3** (Gate I0 accepted): Yale `ie_data.xls` frozen at 2023-09 (HTTP Last-Modified 2023-10-17); shillerdata.com download links 404; the workbook's disclaimer sheet carries no licence. No current, licensed source exists. |
| `china-pmi` | China NBS official PMI | ✅ plan confirmed: english site reachable, **no machine-readable feed** → manual monthly entry in `data/manual/china-pmi.json` (zod-validated) until a reliable feed appears |
| Calendar (RBA, ABS CPI, Fed meetings) | Official published schedules | ☐ hand-entered once or twice a year into `data/insights-calendar.json` (zod-validated) — unchanged from planning |
| `vix` | Cboe | ❌ display prohibited → **link-out only** (Gate I0 D2): a labelled external link on the page, no data stored or displayed |
| `spx-gold`, `breadth` | licensed index data | ❌ out of v1 (P3) — Gate I0 D2 |

### Blocked sources (do not use) — all probed 2026-10-06

- **Coinbase** ❌ — public endpoints work (exchange stats, candles, CDP spot) but the Market Data Terms **prohibit display and derived works**.
- **CoinGecko (free)** ❌ — terms allow screenshots-only republication; programmatic display not permitted; 365-day history cap (API error 10012).
- **Coin Metrics (community)** ❌ — CC BY-NC (non-commercial) + only 7 points of history.
- **MetalCharts** ❌ — endpoints nonexistent (404); removed as the planned silver fallback.
- **Stooq** ❌ — PoW bot gate; unreachable and unneeded.
- **Blockchain.com charts** ❌ — API degraded to HTML; not usable as a clean feed.

## 2. Platform limits that shape the design — Gate I0 D1: **Free plan, permanently**

Workers limits confirmed from Cloudflare's published limits at planning (2026-10-06); KV limits re-verified live on 2026-10-06 from `developers.cloudflare.com/kv/platform/limits/` (page last updated 2026-04-21):

| Limit | Free | Why it matters |
|---|---|---|
| CPU per cron trigger | 10 ms | Heavy parsing (RBA ~10k-row CSVs, ABS SDMX, World Bank XLSX) must run outside the Worker |
| Subrequests per invocation | 50 | Only light live JSON sources in the Worker |
| Cron triggers per account | 5 (1 already used) | No new cron for ingestion |
| Requests per day | 100,000 | Fine at this PWA's scale |
| KV reads / writes / storage | 100,000/day · 1,000 writes/day · 1 GB | Consolidated-key design uses ~100–150 writes/day (≥10× headroom) |
| **KV operations per Worker invocation** | **1** | The serve path must perform exactly one KV read per request — the single `insights:snapshot` key design already does |

**Ingestion architecture (recorded in `docs/PROGRESS.md` decisions log):** a daily GitHub Actions runner handles the heavy sources (FRED bundle, RBA CSVs, ABS SDMX, World Bank XLSX); the existing Worker cron keeps the light live sources it already scrapes (TGJU, Frankfurter) and can additionally pull small keyless JSON (gold-api, Bitstamp). The runner validates with zod, computes percentiles / changes / states, and writes **one compact snapshot per source** to KV through the Cloudflare REST API (a KV-scoped token as a GitHub secret, owner-created at Phase I3). Compact encoding keeps everything inside the free tier: consolidated keys, value arrays, integer-scaled fixed-point numbers, epoch-day dates, and only the series the page renders (TGJU's 963 symbols → the ~dozen shown; ABS's 1,227-dataflow catalogue is parsed but never stored).

**No indicator is omitted for tier reasons.** The only dropped items are licence- or source-blocked (see above). GitHub private-repo Actions minutes are free within the published monthly allotment; re-confirm the exact remaining budget when the workflow is created in Phase I3.

## 3. Attribution and display

Every card shows the source name and date (`Updated [date] · Source [name]`). Providers that require attribution (ABS, RBA, World Bank) are credited in the "About the data" section and on the card. Do not remove attribution to save space.
