# 03. Data sources register

## Verification legend

- ✅ Probed live during Phase I0 (2026-10-06) — HTTP status, response shape, observation currency, cadence and licence recorded below.
- ◐ Seen in secondary sources only. **Verify before coding.**
- ☐ Not checked. **Verify before coding.**
- ❌ Probed and **blocked** — licence does not allow public display, or the endpoint is unusable. Do not use.

> **Provenance note (2026-10-06).** The Phase I0 probe battery ran with throwaway scripts (nothing committed). This register was reconstructed after the working copy was lost to an environment reset; verdicts, licence findings, dates and observation currency are from the probe log recorded the same day. Two sandbox egress quirks affected the probe and are flagged inline: `rba.gov.au` answers **403 (Akamai)** to the build sandbox, and ABS non-`/rest/` paths 403. Licence pages the sandbox could not reach were fetched through an alternate egress. Any source flagged *sandbox-blocked* must be re-probed **from the real ingestion venue** (GitHub Actions runner or Worker) before its Phase I2 adapter is written.

## Verify-first rule

Before writing any adapter, the agent probes the endpoint or series ID once with a scratch script (not part of the test suite) and records the result in this file: the date, the HTTP status, a sample of the response shape, the update cadence and the licence terms. A source whose licence cannot be confirmed as allowing public display is not used. Tests never call live sites; they use recorded fixtures (`AGENTS.md` rule 7).

## 1. Sources by provider

### FRED (Federal Reserve Bank of St. Louis) — ✅ all series verified, keyless

- **Access (probe 2026-10-06):** every series below is served as CSV **without an API key** from `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>` (HTTP 200, current observations; series metadata pages also read). **No FRED API key is needed** for the planned route; the keyed JSON API (`api.stlouisfed.org`) remains an optional fallback (owner-created key, stored as a GitHub secret, only if we ever switch).
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

### RBA (Reserve Bank of Australia) — licence ✅, access sandbox-blocked

- **Licence (probe 2026-10-06):** RBA Copyright and Disclaimer Notice read (fetched via alternate egress after the sandbox 403): **CC BY 4.0** — display permitted with attribution ✅.
- **Access (probe 2026-10-06):** the whole `rba.gov.au` domain answers **403 (Akamai bot gate)** to the build sandbox, including the homepage. The statistical tables index was fetched via alternate egress and the CSV URL scheme is unchanged. **Mandatory venue re-probe before Phase I2** (GitHub Actions runner and Workers have different egress); if the venue is blocked too, a documented manual-CSV fallback is the escape hatch.

| Indicator ID | Table | Cadence | Status |
|---|---|---|---|
| `rba-cash-rate` | F1.1 (cash rate target) | Per change | ◐ licence ✅; CSV bytes not yet reachable from the sandbox — venue re-probe pre-I2 |
| `audusd`, `audjpy`, `usdcny` (cross-check) | F11.1 (daily) + F11 (monthly from 1983) | Daily / monthly | ◐ same |
| `au-us-10y-gap` (AU side) | F2 (capital market yields) | Daily | ◐ same |
| `au-household-debt-arrears` | moved to **ABS E2** (household finance ratios) | Quarterly | ☐ exact E2 dimensions to verify in I2 |

- **Note:** the daily FX table starts only in 2023, so 10-year percentiles need the monthly F11 history combined with the daily series. ◐
- **Current policy rate (reference):** 4.60% after the 29 September 2026 RBA decision ✅ (RBA statement, read during the probe).

### ABS (Australian Bureau of Statistics) — ✅ Data API keyless works

- **Access (probe 2026-10-06):** `data.api.abs.gov.au` **`/rest/` paths are keyless and live**: the catalogue XML (1,227 dataflows) and data queries all returned HTTP 200. Non-`/rest/` paths 403 from the sandbox (caveat only — not needed).
- **Licence (probe 2026-10-06):** ABS website terms read — **CC BY 4.0** ✅, attribution required (already in the design: credit on each card + "About the data").
- **Indicator API** (`indicator.api.abs.gov.au`): requires an API key ✅ (requirement confirmed). Only needed if monthly CPI cadence is wanted — owner-side key decision at Phase I2.

| Indicator ID | Dataset | Cadence | Probe verdict |
|---|---|---|---|
| `au-unemployment` | `LF` (Labour Force) | Monthly | ✅ current |
| `au-cpi` | `CPI_Q` (quarterly route) / `CPI_M` (monthly) | Quarterly / monthly | `CPI_Q` ✅ current; `CPI_M` on the Data API probed **stale** — the fresh monthly indicator lives on the keyed Indicator API. Phase I2 decision: create the key for monthly cadence, or serve `au-cpi` quarterly from `CPI_Q` |
| `au-trimmed-mean` | Monthly CPI indicator (Indicator API) | Monthly | ◐ rides the same I2 decision as `au-cpi`; also verify whether a quarterly trimmed-mean dimension exists in `CPI_Q` |
| `au-home-values` | `RES_DWELL_ST` (Residential dwelling price stats) | Quarterly | ✅ current — **replaces RPPI**, which probed stale |
| `terms-of-trade` | `ANA_AGG` (national accounts aggregates) | Quarterly | ✅ current |
| `au-household-debt-arrears` | `E2` (household finance ratios) | Quarterly | ☐ identified during I0; verify dimensions in I2 |

### Live and FX data already in the repo — ✅ re-verified

- **TGJU `ajax.json`:** re-probed 2026-10-06 — HTTP 200, 963 symbols, gold ounce (`ons`) fresh ✅. Reused for the numerators of `gold-btc`, `gold-silver`, `gold-aud`. Silver and Bitcoin themselves are not in TGJU — external sources below.
- **Frankfurter (ECB reference rates):** re-probed 2026-10-06 — HTTP 200, latest rates 2026-10-05 ✅. Daily (per business day) as before. Used for FX indicators; cross-checked **consistent with TGJU** during the probe.

### Silver and Bitcoin — decided at Gate I0 (D3)

| Need | Source | Verdict |
|---|---|---|
| Silver spot (XAG) | **gold-api.com — PRIMARY** | ✅ probed live (XAG, XAU, BTC, ETH, XPD, XPT, HG + a `/symbols` endpoint); terms read — **commercial display explicitly permitted** |
| Bitcoin spot | **gold-api.com — PRIMARY** | ✅ same probe |
| Bitcoin daily history (10-year backfill) | **Bitstamp public OHLC** | ✅ probed live, keyless, works |
| Silver monthly history (backfill + percentile base) | **World Bank Pink Sheet** | ✅ see below |

### Monthly commodity history — ✅ World Bank Commodity Price Data ("Pink Sheet")

- **Probe 2026-10-06:** monthly XLSX fetched and parsed — coverage **1960M01 → 2026M09**; gold, silver, copper, iron ore and Brent columns all present.
- **Licence:** **CC BY 4.0** ✅ (verified on the World Bank data catalog and data.worldbank.org terms).
- Serves `copper-gold`, `iron-ore`, `brent` (P2) and the 10-year metals backfill.

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
