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
| TIC Table 5, Major Foreign Holders (tab-delimited) | `https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt` (HTML twin: `slt_table5.html`) | **verified** | Header: `Country<TAB>2026-08<TAB>2026-07 ...` 13 monthly columns, billions USD. Latest = 2026-08 (released 2026-10-16; **next release 2026-11-18** for Sep 2026, per the Treasury press notice). Rows seen: Japan, United Kingdom, China Mainland, Belgium, Canada, Cayman Islands, Luxembourg, France, Ireland, Taiwan, Switzerland, Singapore, Hong Kong, India, Norway, Brazil, Saudi Arabia, Korea South, UAE, Bermuda, All Other, Grand Total. **Australia is not in the top-20 list of Table 5; it is in Table 3.** Preview showed some rows where adjacent numbers looked concatenated (for example `862.5901.3`); confirm with a hex dump whether a tab is really missing. The parser must validate column counts and fail loudly. |
| TIC Table 3, U.S. Treasury securities held by foreign residents, all countries | `https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table3.txt` | **partial** | Exists (HTTP 200). Header says "Millions of dollars" and "A positive number for net U.S. sales to foreigners denotes an increase in a foreign position". Per the Treasury page, columns are Holdings, **Net U.S. Sales** and **Valuation Change** (series break at 2023-02 for the last two). This is the table that separates real buying/selling from price effects. Read the full layout before parsing. |
| Treasury TIC landing and notices | `https://home.treasury.gov/data/treasury-international-capital-tic-system` | verified | Describes tables; states custody caveats; a notice dated 2026-06-10 mentions a mandatory survey (read it). Press releases carry the next release date. |
| TIC press notice (release dates) | `https://home.treasury.gov/system/files/136/TIC-press-notice-Oct-2026.pdf` (pattern: `TIC-press-notice-<Mon>-<YYYY>.pdf`) | verified | Gives "next release" date. Use for the calendar entry. |
| Fed Excess Bond Premium (EBP) | `https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv` | **partial** | HTTP 200, 44,606 bytes, Last-Modified 2026-10-06. Columns not yet read. Federal Reserve Board work (public domain). Monthly. Best free substitute for the rejected ICE HY spread. |
| NY Fed GSCPI | `https://www.newyorkfed.org/medialibrary/research/interactives/gscpi/downloads/gscpi_data.xlsx` | **partial, egress risk** | HTTP 200 but served as `gscpi_data.xls` (binary `application/vnd.ms-excel`); the repo has a BIFF `.xls` reader (used for GPR). The site sets Akamai bot-manager cookies, the same family that blocks RBA from Workers. **Probe from Worker egress before building.** |
| IMF PortWatch chokepoint transits | `https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query` (params: `where`, `outFields`, `resultRecordCount`, `orderByFields`, `f=json`) | **partial** | Query works; fields include `date`, `year`, `month`, `day`, `portid`, `portname` and more (read the full field list for transit-count columns). ArcGIS REST: respect paging limits and use a descriptive User-Agent. Confirm the licence (IMF PortWatch terms) and daily freshness. |

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
| Treasury FiscalData auctions | `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/...` (auctions query dataset) | Confirm the dataset name, fields (bid-to-cover, indirect bidder share), freshness. Public domain. |
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
| 2026-10-31 | planning | Initial register created from a planning-machine probe. |
