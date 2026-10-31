# Verified sources register (gap-closure)

Status of every candidate data source. **Update this file whenever you learn
something.** Statuses: `verified` (fetched, read, parsed), `partial`,
`unverified` (must be verified before use), `rejected` (fails the reliability
or licence bar; do not rebuild unless it revives), `dead-url` (do not use).

"Verified from the planning machine" means a plain `curl` from the owner's PC on
2026-10-31, **not** from Cloudflare Worker egress. Worker egress must be probed in
S1-M1.1 (some sites, for example RBA/Akamai, block Worker egress while allowing
normal clients).

## Verified or partially verified on 2026-10-31

| Source | URL | Status | Notes |
|---|---|---|---|
| FRED: OECD AU 10-year government bond yield (the S1-M1.5 fallback, NOT wired — the live RBA F2.1 monthly path works) | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=IRLTLT01AUM156N` (series page: `https://fred.stlouisfed.org/series/IRLTLT01AUM156N`) | **verified (unwired fallback)** | Monthly, 1969-07 → 2026-09, latest 5.283 @ 2026-09-01 — the same September value the RBA F2.1 table serves (cross-verified 2026-10-31 from FRED's own fredgraph.csv, keyless). Licence read from the series page: **Copyrighted: Citation Required** (the same class as the DE sibling IRLTLT01DEM156N the bund-10y card uses — display-permitted WITH FRED attribution). Date convention differs from F2.1: FRED stamps the month START, RBA the month END. |
| TIC Table 5, Major Foreign Holders (tab-delimited) | `https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt` (HTML twin: `slt_table5.html`) | **verified** | Header: `Country<TAB>2026-08<TAB>2026-07 ...` 13 monthly columns, billions USD. Latest = 2026-08 (released 2026-10-16; **next release 2026-11-18** for Sep 2026, per the Treasury press notice). Rows seen: Japan, United Kingdom, China Mainland, Belgium, Canada, Cayman Islands, Luxembourg, France, Ireland, Taiwan, Switzerland, Singapore, Hong Kong, India, Norway, Brazil, Saudi Arabia, Korea South, UAE, Bermuda, All Other, Grand Total. **Australia is not in the top-20 list of Table 5; it is in Table 3.** Preview showed some rows where adjacent numbers looked concatenated (for example `862.5901.3`); confirm with a hex dump whether a tab is really missing. The parser must validate column counts and fail loudly. |
| TIC Table 3, U.S. Treasury securities held by foreign residents, all countries | `https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table3.txt` | **partial** | Exists (HTTP 200). Header says "Millions of dollars" and "A positive number for net U.S. sales to foreigners denotes an increase in a foreign position". Per the Treasury page, columns are Holdings, **Net U.S. Sales** and **Valuation Change** (series break at 2023-02 for the last two). This is the table that separates real buying/selling from price effects. Read the full layout before parsing. |
| Treasury TIC landing and notices | `https://home.treasury.gov/data/treasury-international-capital-tic-system` | verified | Describes tables; states custody caveats; a notice dated 2026-06-10 mentions a mandatory survey (read it). Press releases carry the next release date. |
| TIC press notice (release dates) | `https://home.treasury.gov/system/files/136/TIC-press-notice-Oct-2026.pdf` (pattern: `TIC-press-notice-<Mon>-<YYYY>.pdf`) | verified | Gives "next release" date. Use for the calendar entry. |
| Fed Excess Bond Premium (EBP) | `https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv` | **partial** | HTTP 200, 44,606 bytes, Last-Modified 2026-10-06. Columns not yet read. Federal Reserve Board work (public domain). Monthly. Best free substitute for the rejected ICE HY spread. |
| NY Fed GSCPI | `https://www.newyorkfed.org/medialibrary/research/interactives/gscpi/downloads/gscpi_data.xlsx` | **partial, egress OK** | HTTP 200 but served as `gscpi_data.xls` (binary `application/vnd.ms-excel`); the repo has a BIFF `.xls` reader (used for GPR). **Worker-egress probe 2026-10-31: 200, 105,984 bytes in ~0.5s with the honest UA — the Akamai fear did NOT materialize from Workers.** Still to do in S4: parse + licence card. |
| IMF PortWatch chokepoint transits | `https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query` (params: `where`, `outFields`, `resultRecordCount`, `orderByFields`, `f=json`) | **partial, slow from Workers** | Query works; fields include `date`, `year`, `month`, `day`, `portid`, `portname` and more (read the full field list for transit-count columns). ArcGIS REST: respect paging limits and use a descriptive User-Agent. **Worker-egress probe 2026-10-31: 200 application/json but first byte took 12.5s with a 30s budget (the two 12s-budget runs timed out) — reachable but SLOW; the repo's 12s fetch-policy default will intermittently kill it. S4 must pass a longer `timeoutMs` or use the GHA venue.** Confirm the licence (IMF PortWatch terms) and daily freshness. |

## Worker egress (probed from Cloudflare Workers, S1-M1.1, 2026-10-31)

Method: a temporary Worker `currena-probe` (deployed 17:31 UTC, **deleted after** — the URL
now 404s) fetched each target ONCE with the repo's declared honest UA
`CurrenaDashboard/1.0 (+https://github.com/assadigit/Currena)` (F-09/T-25), single attempt,
12s default timeout; two full runs (17:33, 17:34 UTC) plus one targeted 30s re-run for the
two slow hosts (17:35 UTC). No retries, no circumvention (T-27).

| Host | URL probed | Result | ms (run1/run2) | Verdict for the program |
|---|---|---|---|---|
| `ticdata.treasury.gov` | `…/tic/Documents/slt_table5.txt` | 200 `text/plain`, 3,804 B | 8,220 / 10,185 | **OK, slow** — S2's main table works from Workers but leaves <4s margin under the 12s policy; keep the timeout honest, do not retry |
| `ticdata.treasury.gov` | `…/tic/Documents/slt_table3.txt` | 200 `text/plain`, 450,924 B | 9,295 / 8,020 | **OK, slow** — same margin note |
| `www.federalreserve.gov` | `…/feds-notes/ebp_csv.csv` | 200 `application/octet-stream`, 44,606 B | 267 / 260 | **OK** — byte count matches the planning-machine probe exactly (same file); S3 can build the EBP card |
| `www.newyorkfed.org` | GSCPI `gscpi_data.xlsx` | 200 `application/vnd.ms-excel`, 105,984 B | 528 / 483 | **OK — the Akamai bot-manager fear did NOT materialize from Worker egress** (unlike RBA). S4 can fetch GSCPI from the Worker |
| `services9.arcgis.com` | PortWatch FeatureServer query | 200 `application/json`, 151 B | timeout ×2 @12s; **12,523 ms @30s** | **SLOW** — reachable but first byte >12s; the 12s fetch-policy default will intermittently kill it. S4 must pass a longer `timeoutMs` (fetch-policy allows it) or use the GHA venue |
| `api.fiscaldata.treasury.gov` | `…/v1/accounting/od/auctions_query?page[size]=1` | **timeout ×3** (12s, 12s, 30s) | — | **BLOCKED from Worker egress** (connection never completes; a normal client gets 200 JSON in <1s — verified from the planning machine twice). Not a refusal status, so not circumventable-adjacent: S3's fiscal/auction milestones must use the GHA venue (like RBA) or another legitimate route |
| `www.financialresearch.gov` | `/financial-stress-index/` | 200 `text/html`, 38,881 B | 1,220 / 1,023 | **OK** — host reachable; the machine-readable FSI file/API discovery stays S3-M3.1 work |
| `www.policyuncertainty.com` | `US_Policy_Uncertainty_Data.xlsx` | 200 xlsx, 71,283 B | 837 / 57 | **OK** — S4's TPU file fetches fine |
| `www.matteoiacoviello.com` | `data_gpr_export.xls` | 200 `application/vnd.ms-excel`, 2,716,160 B | 897 / 137 | **OK** (already in production use); 2.7 MB — mind the rung subrequest/size budget |
| `www.rba.gov.au` | `statistics/tables/csv/f2-data.csv` | **403** `text/html`, 423 B | 374 / 263 | **BLOCKED (expected)** — the known Akamai block, re-confirmed from Worker egress with the honest UA; M1.5 must use FRED/OECD mirrors + the GHA venue |
| `data.api.abs.gov.au` | CPI SDMX CSV | 200 `application/vnd.sdmx.data+csv`, 1,776 B | 2,157 / 2,205 | **OK** (already in production use) — S5's ABS work can run from the Worker |
| `query1.finance.yahoo.com` | `^GSPC` chart v8, range=1mo | 200 `application/json`, 3,574 B | 60 / 59 | **OK** (already in production use) |
| `www.stats.govt.nz` | `/` | 200 `text/html`, 91,677 B | 3,018 / 555 | **OK** — S6's NZ probe can run from the Worker |
| `data-api.ecb.europa.eu` | DFR `format=csvdata` | 200 `text/csv`, 3,019,334 B | 2,434 / 3,720 | **OK** (already in production use) |
| `fred.stlouisfed.org` | `fredgraph.csv?id=T10Y2Y` | 200 `application/csv`, 210,325 B | 32 / 20 | **OK** (already in production use; keyless fredgraph.csv) |

## Dead or stale URLs (do NOT use)

| URL | Why |
|---|---|
| `https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/mfh.txt` and `https://ticdata.treasury.gov/Publish/mfh.txt` | Frozen at January 2023 (file dated 2023-03-15). Treasury moved the MFH table to `slt_table5`. |
| `https://ticdata.treasury.gov/Publish/slt3d.txt` | Frozen at January 2023. |
| `https://www.financial-research.treasury.gov/...` | Host does not resolve. |
| `https://www.financialresearch.gov/financial-stress-index/files/indicators/index.csv` | HTTP 404. The OFR FSI page itself returns 200 at `https://www.financialresearch.gov/financial-stress-index/` but its CSV/API link must be discovered (probably JS-rendered or under the OFR data API). Do this in S3-M3.1. |

## Unverified candidates (must be verified before use)

| Candidate | Where it would come from | Needed check |
|---|---|---|
| FRED: `THREEFYTP10`, `WTREGEN`, `RRPONTSYD`, `WRESBAL`, `IORB`, `GDPNOW`, `GACDISA066MSFRBNY`, `CCSA`, `MTSDS133FMS`, `MEDCPIM158SFRBCLE`, `STICKCPIM157SFRBATL`, `DRTSCILM`, `WSEFINTL1`, `FDHBFIN` | FRED bulk groups (existing `fred` provider) | Confirm each series exists, its frequency, units, last observation date, and its copyright class with the repo's T-16 scan (`data/fred-copyright.json`). Use only `public domain` or `citation required`. |
| OFR Financial Stress Index | `financialresearch.gov` | Find the machine-readable file/API; confirm licence and daily updates. |
| Treasury FiscalData auctions | `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query` (verified 200 JSON from a normal client, 2026-10-31; fields include `record_date`, `cusip`, `security_type`, `security_term`, `auction_date`, `issue_date`, `maturity_date`, `auction_format`, `avg_med_discnt_ra…`) | Confirm the bid-to-cover + indirect-bidder field names from the response's own fields (page[size] works; `bid_date` does NOT exist — the API's own error says so). **Worker egress BLOCKED (timeout ×3 at 12s/12s/30s) — S3 must fetch via the GHA venue.** Public domain. |
| GPR country columns and daily file | Same Caldara-Iacoviello site/files already parsed | Read column names in the existing `.xls`; confirm country codes (for example Taiwan, China, Russia, Ukraine, Israel, Saudi Arabia, Australia) and whether a daily file exists. |
| Trade Policy Uncertainty | `policyuncertainty.com` (same family as EPU) | Find the exact file and format. |
| Pink Sheet: coal Australian, LNG Japan, natural gas Europe | World Bank Commodity Price Data (existing `world-bank` provider) | Confirm exact column names and units in the monthly xlsx. |
| EIA SPR level and US crude production | Existing EIA LeafHandler route | Confirm series codes. |
| ABS dataflows: GDP, international trade in goods, retail trade, building approvals, population/NOM, labour force participation and underemployment | `https://data.api.abs.gov.au/rest/data/...` (already used) | Confirm dataflow ids and keys with the SDMX structure endpoint; record in method cards. |
| Australian indices on Yahoo/EODHD: All Ordinaries, ASX 200 sectors, A-REIT, ASX 200 VIX, Small Ordinaries, big-4 bank shares | Yahoo symbols (`^AORD`, `^AXFJ`, `^AXMJ`, `^AXEJ`, `^AXPJ`, `^AXVI`, `^AXSO`, `CBA.AX` ...) and EODHD `.INDX` codes | **Every symbol is a guess until probed.** Probe each over several days; keep only symbols with complete, fresh, plausible history. |
| NZX 50, AUD/NZD, NZ OCR, NZ 10-year | Yahoo `^NZ50`, Frankfurter (NZD), RBNZ / FRED OECD mirrors | Verify, and measure the ASX/NZX connection before including (G-6). |
| NBS: property investment, 70-city new-home prices, crude steel output | NBS English monthly release (existing `nbs` provider) | Confirm the release URL pattern, table layout, and that the parser is robust. |
| IMF COFER | IMF data API | Confirm dataset id, licence, quarterly freshness. |
| Equal-weight vs cap-weight S&P proxy | Yahoo `RSP`, `SPY` | L2 source (already owner-accepted); confirm continuity of history. |
| Worker-egress reachability | Probe via `wrangler dev --remote` or a throwaway probe Worker | For each new host: TIC, Fed Board, NY Fed, ArcGIS, FiscalData, OFR, policyuncertainty, NBS, ABS, IMF. Record status codes. |

## Rejected before this program (from `docs/INDICATORS_AND_DATA_SOURCES.md` §4)

ICE BofA HY/IG/EM spreads (FRED pre-approval licence class), Cboe put/call ratio (frozen 2019), WGC central-bank gold buying (no login-free feed), PBoC policy rate (no feed), BIS API (HTTP 500), daily German Bund (no free source), Silver/Bitcoin ratio (retired).
No free, licence-clean feed exists for: MOVE index, Baltic Dry Index, cross-currency basis, Westpac/NAB sentiment surveys, ASX rate futures, auction clearance rates, S&P/ISM PMIs. Do not build them. The ISM-style survey gap is filled with the Empire State survey (S3).

## Log (append newest first)

| Date | Session | Finding |
|---|---|---|
| 2026-10-31 | S1 close | S1 complete (7/7). Learned: RBA data continuity rides the F2.1 monthly table (the working venue — the FRED OECD mirror `IRLTLT01AUM156N` verified as the unwired fallback, citation-required); the AU/US gap's Sep-30/Oct-29 date mixing fixed by the 7-day leg guard (RULE_VERSION 4); GPR is context-by-design under the SD regime (its monthly SPEED is S4's to score); GitHub Actions' outage was a billing hold (lifted 10-31 14:34 UTC) + the invalid shiller-fetch.yml (fixed, run #141 green — the workflow's first-ever execution); the GHA venue works again (dry-run ingest #56 green); rung3/rung4 live at 04:30/04:35 UTC with the TIC registration recipe in docs/gap-closure/RUNGS.md. |
| 2026-10-31 | S1 | Worker-egress probe table added (13 hosts, temp Worker `currena-probe`, deleted after). NY Fed GSCPI reachable from Workers (Akamai fear unfounded); ArcGIS slow (>12s first byte); FiscalData API blocked from Workers (timeout ×3, normal client fine); RBA 403 re-confirmed; everything else 200. |
| 2026-10-31 | planning | Initial register created from a planning-machine probe. |
