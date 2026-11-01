# Currena Insights: Fetching and Scraping Spec

Covers every source that is not reached through an official, documented API: composite gauges, web pages, public JSON endpoints used by a page, bulk files, and manual entry.
Rules in `RULES.md` apply. Source levels (L0 to L3) and owner acceptance live in `RISK_REGISTER.md`.

---

## 1. Does the agent have to find scraping methods itself?

**No.** The agent does not invent methods or hunt for tricks. It follows four fixed things:

1. A **method ladder** (section 2): the only allowed ways to get data, in order of preference.
2. A **bounded discovery procedure** (section 3): at most three attempts per source, using only ordinary requests.
3. **Method cards** (section 8): what is already known per source. Anything marked "to be confirmed" is discovered with the procedure and recorded.
4. A **stop rule**: if a source blocks the request, the agent stops, records "blocked", and the source becomes a link-out.

---

## 2. Method ladder (use the lowest-numbered method that works)

| Method | Description | Allowed |
|---|---|---|
| **M1** | Official API or documented feed, with a key if required | Yes |
| **M2** | Documented bulk file or feed (CSV, JSON, XLSX, SDMX, RSS) that the provider publishes for reuse | Yes |
| **M3** | The page's own public JSON endpoint, found by reading the page's HTML and the scripts it loads with ordinary requests | Yes, if the source level allows (RULES section 2) |
| **M4** | Parsing the static HTML of a public page with fixed selectors | Yes, if the source level allows |
| **M5** | Manual entry by the owner (with expiry) | Yes |

**Never allowed:** headless browsers used to get around bot checks, spoofed or rotating browser identities, proxies or rotating IPs, CAPTCHA solving, reuse of anyone's login or cookies, scraping behind a login or payment, ignoring rate limits, bulk crawling, or downloading whole sites.

---

## 3. Discovery procedure (per source, at most three attempts)

- [ ] **F-01 Read the terms and `robots.txt`.** Quote the relevant lines into `LICENCES.md` and `RISK_REGISTER.md` with the date. Decide the level (RULES section 2).
  - If the terms explicitly prohibit automated access or reuse, or `robots.txt` disallows the path: level L3. Stop. (The owner may override in the register himself. The agent never does.)
  - If the terms are silent, unclear or restrict display: level L2. Continue, but the source stays disabled until `owner_accepts` is yes.
- [ ] **F-02 Fetch the page once** with a plain HTTP request and the honest User-Agent (section 5). Do not run JavaScript.
- [ ] **F-03 Look for a JSON endpoint** referenced in the page's HTML or in the scripts it loads. If one exists and is not login-gated, record its URL, method, and a sample response shape. That is M3.
- [ ] **F-04 If there is no endpoint**, parse the static HTML with fixed selectors (M4). Record the selectors.
- [ ] **F-05 Test from both runtimes** (section 4). If both are blocked, record "blocked" and stop.
- [ ] **F-06 Write the method card** (section 8) and the schema and sanity checks (section 6).
- [ ] **F-07 Attempt limit.** After three attempts without a working, allowed method, record the source as "no working method" and leave it a link-out.

---

## 4. Where the fetch runs

Choose per source, in this order, and record the choice:

1. **The existing scheduled Cloudflare Worker** (the same runtime that fetches the other sources).
2. **A scheduled GitHub Action** that fetches the value and writes a small JSON file (value, label, source timestamp, fetched time, content hash) that the Worker reads. Use this when the Worker's network is blocked but an ordinary runner is not. This is only a different place to run the same honest request.

If both runtimes are blocked, that is a block. Stop (rule 4.3 of `RULES.md`).

Keep fetched results in the same snapshot pipeline as every other source so they get the same tests, stale tags, status panel entries and archive.

---

## 5. Politeness

- [ ] **F-08 One request per source per refresh** and never more often than the source updates (for example once a day for a daily gauge).
- [ ] **F-09 Honest User-Agent:** `CurrenaDashboard/1.0 (+<the contact URL from the About section>)`. If a source rejects an honest User-Agent but accepts a browser-like one, treat that as a block. Do not change the identity.
- [ ] **F-10 Conditional requests.** Use ETag or If-Modified-Since when the source supports them.
- [ ] **F-11 No retry loops.** On failure, wait for the next scheduled refresh. Use the last good value and mark it stale.
- [ ] **F-12 Cache** results in KV for at least the source's normal update interval.

---

## 6. Validation (applies to every fetched source)

- [ ] **F-13 Schema.** Each source defines the expected fields and types. Missing or extra-changed fields mean "format changed" (F-16).
- [ ] **F-14 Sanity range.** Examples: a 0 to 100 gauge must be a number in 0 to 100; a set of probabilities must add up to 100% within 1 point; a date must be today or within the last 3 days; a rate must be within a plausible band stored in the registry.
- [ ] **F-15 Freshness and repeats.** If the source timestamp is older than its normal interval plus tolerance, show a stale tag. If the value and timestamp repeat beyond the normal interval, show "can't tell right now".
- [ ] **F-16 Format-change detection.** If the response shape changes, mark the source "format changed", show "can't tell right now", add a message to the status panel, and do not guess new fields.
- [ ] **F-17 Cross-check.** Where an independent reading exists on the page, compare directionally and flag a large disagreement (for example the CNN gauge's volatility component against the VIX card).
- [ ] **F-18 Content hash.** Store a hash of the fetched value block, not the whole page, so unchanged repeats can be detected.

---

## 7. Display rules for fetched data

- [ ] **F-19 Show the reading as the publisher's reading.** Example: "CNN reports 64, which it labels Greed." Never present it as Currena's own conclusion or as a signal.
- [ ] **F-20 Each card has** "What it is", "What it isn't" (a sentiment gauge, not a forecast, not a buy or sell signal), "Source: [publisher] · fetched [date and time UTC]", and a link to the original.
- [ ] **F-21 Minimum data.** Show only the headline value and label (and a short history only if the source's terms allow). Do not mirror the publisher's full tables or charts.
- [ ] **F-22 No endorsement.** Never imply the publisher endorses Currena.
- [ ] **F-23 Disabled by default.** A new L2 source stays disabled until the owner sets `owner_accepts` to yes. An L3 source is never shown.

---

## 8. Method cards

| ID | Source | Known method | Status and instructions |
|---|---|---|---|
| FS-01 | CNN Fear & Greed (US stocks, 0 to 100) | CNN has no documented public API. Other developers report that the page itself reads a JSON endpoint at `https://production.dataviz.cnn.io/index/fearandgreed/graphdata`. The agent must **verify** this by following F-02 and F-03, and must not rely on this URL without checking. Expected shape (verify): a current score, a rating label, a timestamp, and earlier readings (previous close, one week, one month, one year ago). | Read the terms and `robots.txt` (F-01). One secondary summary says CNN's terms allow personal use and restrict commercial use. The agent confirms from the terms themselves. Some sites reject non-browser identities. If this one does, it is a block (F-09): stop and record. The gauge overlaps with the VIX card, so use F-17. |
| FS-02 | ASX RBA Rate Tracker | ASX publishes the tool and its calculation method on its website. No feed or reuse terms were confirmed. | Method to be confirmed by F-01 to F-05. Read ASX's website terms and `robots.txt` first. If automated access is not allowed, L3 (link out). The most useful fetched source for an Australian saver, so give it the full procedure. |
| FS-03 | Westpac-Melbourne Institute Consumer Sentiment | Monthly press release, public. Automated reuse terms not confirmed. | **M5 manual entry** (section 9). Link to the release. Do not fetch automatically unless the terms are read and allow it. |
| FS-04 | NAB Monthly Business Survey | Not verified. | Link out, or M5 manual entry. |
| FS-05 | Alternative.me crypto Fear & Greed | Official free API (M1). Attribution displayed next to the data is required. | Not scraping. Implement as a normal L0 source. |
| FS-06 | Shiller CAPE dataset | Public Excel file on Robert Shiller's website (M2), updated monthly. No history of past versions is kept by the provider. | Archive every download. If reading Excel inside a Worker is impractical, convert it to a small JSON in a monthly scheduled GitHub Action. L2, disabled until the owner accepts. |
| FS-07 | Any other composite or verdict site | None identified. | Do not add a source without running F-01 to F-07 and recording the result. |
| FS-08 | U.S. Treasury TIC SLT tables — foreign holdings of US Treasuries (gap-closure S2, M2.1; fixtures `packages/insights/fixtures/tic/slt_table5-2026-10-31.txt` + `slt_table3-2026-10-31.txt`) | M2, two tab-delimited text files on `ticdata.treasury.gov` (Worker-egress verified 2026-10-31, 8–10 s per file — the 12 s single-attempt policy stands, no retries; the 10:10/20:10 sweeps heal a failed fetch). **`slt_table5.txt`** (3.8 KB, CRLF, BILLIONS of dollars): 5 preamble lines, then header `Country<TAB>YYYY-MM × 13` (newest first, rolling window), then rows `Japan, United Kingdom, China, Mainland, Belgium, Canada, Cayman Islands, Luxembourg, France, Ireland, Taiwan, Switzerland, Singapore, Hong Kong, India, Norway, Brazil, Saudi Arabia, Korea, South, United Arab Emirates, Bermuda, All Other, Grand Total, Of Which: Foreign Official, Of Which: Foreign Official Treasury Bills`, then footnote lines. Real tabs throughout (the planning-chat preview that showed "merged numbers" like `862.5901.3` was a rendering artifact — hex-dump 2026-10-31 confirms one TAB between `862.5` and `901.3`). **`slt_table3.txt`** (451 KB, CRLF, MILLIONS of dollars): 5 preamble lines, a 3-row header (group names, then `Country, Country Code, Date, Holdings, Net U.S. Sales, Holdings, Net U.S. Sales, Valuation Change, Holdings, Net U.S. Sales`, then the snake-case field ids `country, country_code, date, for_treas_pos, for_treas_net, for_lt_treas_pos, for_lt_treas_net, for_lt_treas_valchg, for_st_treas_pos, for_st_treas_net`), then per-country monthly rows `YYYY-MM` newest-first, 2020-01 → the latest data month (~80 months), then `All Countries, Grand Total, Total IROs, Of Which: Foreign Official/Non-Official, Memo: Euro Area, Memo: European Union` aggregates, then notes + the custody caveat + the column-definition footers. Sign convention (the file's own line 3): "A positive number for net U.S. sales to foreigners denotes an increase in a foreign position" — positive = foreigners NET BOUGHT. **Series break:** the three transactions columns (`for_treas_net`, `for_lt_treas_net`, `for_lt_treas_valchg`) are `n.a.` for every country before 2023-02 (holdings go back to 2020-01); a 12-month sum must skip `n.a.` months, never treat them as 0. Cross-verified 2026-10-31: Table 3 Japan 2026-08 `1068283` M = Table 5 `1068.3` B; Grand Total `9331654` M = `9331.7` B. | The parser (packages/insights/src/tic/) fails closed: exact column counts (14 for T5 = Country + 13 month columns, 10 for T3), header regex `^Country\t\d{4}-\d{2}(…)$`, units asserted by the preamble line ("Billions of dollars" / "Millions of dollars"), numeric cells, totals cross-checked against the sum of parts within tolerance, and implausible month-over-month jumps FLAGGED (never silently dropped). The custody caveat is shown on the card (paraphrased from the footer quoted in sources.ts `us-tic`). Country names join T5↔T3 by normalised key with an explicit alias map (tested). Australia is NOT in Table 5's top-20; it comes from Table 3 (code 60089). The section's WEEKLY companion (the `nyfed-custody` card, FRED `WSEFINTL1`) does NOT ride this card: it is a plain FRED series in the WALCL mixed-frequency bulk group (zero extra subrequests — see AGENTS.md §G and RUNGS.md's main-rung row). |
| FS-09 | The credit-stress pair — the Fed Board's EBP file + the OFR's FSI file (gap-closure S3, M3.3; fixtures `packages/insights/fixtures/s3/ebp-2026-11-01.csv` + `ofr-fsi-2026-11-01.csv`) | M2, two plain CSV files on hosts egress-verified by the S1-M1.1 probe (federalreserve.gov ~270 ms; financialresearch.gov ~1.2 s — the 12 s single-attempt policy stands, no retries; the 10:10/20:10 sweeps heal a failed fetch). **`ebp_csv.csv`** (44,606 B): header `date,gz_spread,ebp,est_prob`, monthly rows `1973-01-01` → 2026-09-01; the card reads the `ebp` column ONLY (gz_spread and est_prob are the model's other legs, never the card's series). **`fsi.csv`** (517,157 B, DISCOVERED in M3.1 from the FSI page's own `fsi-indicator.js` — the old `files/indicators/index.csv` 404 stays dead): 10 documented columns `Date,OFR FSI,Credit,Equity valuation,Safe assets,Funding,Volatility,United States,Other advanced economies,Emerging markets`, daily rows 2000-01-03 → 2026-10-28; the card reads the AGGREGATE column ONLY — the 9 component/region columns stay undocumented-card-free (the layer-1 copy explains the components in words). Rides rung4 (04:35) as TWO extra sources — 'frb-ebp' (monthly file, Saturday re-check) + 'ofr-fsi' (daily) — never the 04:10 main rung; the Node venue collects the same files inline (collectCreditSources). | The parser (packages/insights/src/adapters/credit.ts) fails closed: exact header text asserted verbatim, exact column counts (4 / 10), strict ISO dates, strictly ascending rows, finite numeric cells (the ebp column / the aggregate column), empty and header-only bodies rejected. NO magnitude bands: both series are spreads/indexes that can honestly sit anywhere near zero (the M3.2 no-invented-bounds lesson) — shape and finiteness carry the honesty load. The fetch trims to the SAME decade window the FRED groups use (fredDecadeFrom) so the percentile basis stays consistent; the trimmed lengths are pinned by tests against the fixtures (121 monthly / 2,616 daily obs). |
| FS-10 | The Treasury auction families — FiscalData auctions_query (gap-closure S3, M3.5; fixture `packages/insights/fixtures/s3/treasury-auctions-full-2026-11-01.json` — the 4000-row response, verbatim) | M2, one JSON API on a host BLOCKED from Worker egress (timeout ×3 in the S1-M1.1 probe; a normal client gets 200 in <1 s — 3.6 s / 803 KB measured 2026-11-01): the GHA/Node venue fetches it inline (collectTreasuryAuctions, ONE single-attempt fetch with a pinned 30 s timeout — the TIC slow-host precedent), the Worker NEVER does (the ids ride RUNG4_IDS for the carry). **REQUEST SHAPE (learned live, M3.1 + re-probed 2026-11-01):** every FILTER on this endpoint is silently ignored (security_type, security_term, original_security_term, auction_date gte/eq; `filter=` 400s) while `page[size]`, `sort` AND `fields=` all work — ONE request `page[size]=4000&sort=-auction_date&fields=auction_date,original_security_term,bid_to_cover_ratio,indirect_bidder_accepted,total_accepted,inflation_index_security` covers ~10.3 years of ALL auctions (2016-07-18 → 2026-10-22 measured; 125 10y-family + 123 30y-family auctions), then CLIENT-SIDE selection. **`original_security_term` is the family classifier** (a 10y reopening reads security_term "9-Year 10-Month" but original "10-Year"); **`inflation_index_security`=Yes marks TIPS (excluded)**. Results fields are null until the results record publishes — pending rows are SKIPPED (the reading is the newest auction whose results are out); the reading's asOf is the AUCTION date. | The parser (packages/insights/src/adapters/auctions.ts) fails closed: envelope shape (data[] array), every row carries the six requested fields, strict ISO dates, finite numerics, non-positive takedowns skipped (never a division on zero), no result-bearing rows rejected. The family selection + the indirect share (indirect_bidder_accepted ÷ total_accepted, ×100) are pure functions pinned by tests against the fixture (latest 10y btc 2.77 @ 2026-10-07, indirect 77.8%; latest 30y btc 2.54 @ 2026-10-08, indirect 70.4% — the provider's own numbers). NO magnitude bands (a ratio and a share can honestly sit anywhere in range — the M3.2 no-invented-bounds lesson). The event-based stale rule (staleAfterDays 45, cadence monthly) is pinned by test — the spec's explicit demand. |
| FS-11 | The geopolitics family — the GPR export's extra columns + the daily export + the TPU workbook (gap-closure S4, M4.2; fixtures `packages/insights/fixtures/gpr-export.xls` + `s4/gpr-daily-2026-11-01.xls` + `s4/tpu-categorical-epu-2026-11-01.xlsx`) | M2/M3, three files on two hosts egress-verified long ago (matteoiacoviello.com — the 2.7 MB monthly export; policyuncertainty.com — two workbooks). **The monthly export** (`data_gpr_export.xls`, legacy .xls, biff reader): ONE download now feeds gpr-index AND the threat (GPRT) / act (GPRA) sub-indices AND the seven country columns (GPRC_{TWN,CHN,RUS,UKR,ISR,SAU,AUS}) — zero extra subrequests, first-of-month + bootstrap on the rung2 monthly plan. **The daily export** (`data_gpr_daily_recent.xls`, 3.3 MB, 15,274 rows): the provider's own GPRD_MA7 7-day moving average, fetched DAILY on rung2 (plan.gprDaily; ~6-day file lag, staleAfterDays 12). NOTE: its SST spans 35 CONTINUE records (every date string is a shared string) — reading the header at all required the biff parseSst cross-CONTINUE fix (the flags byte repeats at each mid-string CONTINUE start; S4-M4.2). **The TPU workbook** (`media/Categorical_EPU_Data.xlsx`, 106 KB OOXML): sheet "Indices", column M = "9. Trade policy", 1985-01 → the latest month; ONE more policyuncertainty fetch on the monthly plan (the old `Trade_Uncertainty_Data.xlsx` is STALE at 2019-07 — rejected in M4.1; its 1985-01 value is byte-identical, the same series continued). | The parsers (packages/insights/src/adapters/monthly-indexes.ts) fail closed: the monthly export asserts ALL ten column names in the header (a missing country column is a layout change); values banded (0, 2000] for the aggregate/threat/act columns and [0, 2000] for the country shares (an honest zero-mention month); ≥100 monthly points per column; the lazy date conversion skips the pre-1985 historical-variant rows exactly like the GPR-only parse. The daily parse asserts the DAY + GPRD_MA7 header pair (through the fixed SST), a strict YYYYMMDD day regex, the (0, 2000] band, and ≥1,000 daily rows. The TPU parse asserts the "Indices" sheet + the Year/Month/"9. Trade policy" header verbatim, skips the A504 licence row by the numeric guard, bands (0, 10000] (the measured 1985–2026 range is 6.5–7,956), ≥100 monthly points. All three ride the rung2 phase's monthly-trio merge loop; histories land via the stage (the 04:25/04:27 daily halves for gpr-daily; the 04:40 periodic phase for the monthlies). |
| FS-12 | The chokepoint transits — IMF PortWatch (gap-closure S4, M4.3; fixtures `packages/insights/fixtures/s4/portwatch-query-{page1,page2,sixtyday,error}-2026-11-01.json` — the provider's own responses, verbatim) | M2, one ArcGIS FeatureServer query on a SLOW Worker-egress host (services9.arcgis.com; 12.5 s first byte in the S1 probe — the fetch pins its own 30 s single-attempt timeout, the TIC precedent; a 4 s politeness pause separates pages because the host 400s rapid successive queries — a pause, not a retry; F-11 stands). **REQUEST SHAPE (verified live 2026-11-01):** `where=portid IN ('chokepoint1','chokepoint2','chokepoint4','chokepoint5','chokepoint11') AND date >= DATE 'YYYY-MM-DD'` (the IN list is REQUIRED — equality 400s; the DateOnly field filters with the DATE literal), `outFields=portid,portname,date,n_total`, `orderByFields=portid,date`, `resultRecordCount=1000` + `resultOffset` paging (a 400-day window × 5 chokepoints = 1950 rows = 2 pages; `exceededTransferLimit:true` marks page 1). **The host answers HTTP 200 WITH AN ERROR BODY** `{error:{code:400,'Invalid URL'}}` on its intermittent slow-start — the parser fails closed on the BODY, never the status line, and the code-400 error-body class (BOTH live-observed variants: 'Invalid URL' and 'Cannot perform query. Invalid query parameters.' — the same url fails then serves, ~38% of attempts, both GHA runs died to it before the retries landed) gets up to TWO backed-off 10 s retries (the M4.1 back-off-and-retry prescription — NOT a block); every other failure is single-attempt (F-11). | The parser (packages/insights/src/adapters/portwatch.ts) fails closed: the error-body check first, then unknown portid, a renamed portname (the identity check against the provider's own chokepoints list), malformed dates, non-integer or implausible n_total (banded [0, 2000] — the observed five-chokepoint range is 13–401/day). The pure derivations: `ma7Series` (the 7-day moving average — days with an incomplete window carry NO point, never a partial average), `mergePortwatchHistory` (fetched rows win date collisions — the provider's revisions — and the window trims to 400 days), `buildChokepointCompare` (the vs-prior-4-weeks mean over [−34d, −7d] with a ≥14-of-28 present minimum, and the vs-year-ago MA7 at ±7 days of 364 days back). ONE combined raw-history key `insights:portwatch:v1` (400 days per chokepoint, zod-validated both ways); the per-id histories carry the derived MA7. The rung3 'portwatch' extra source (04:30, daily gate, budget 18: 1 fetch + 5 reads + 10 writes = 16 daily; ≤2 more pages on the bootstrap path) fetches + patches; the ids ride CARRY_FORWARD_IDS and the history phases exclude them. staleAfterDays 14 (the provider's ~7-day lag + margin). Hormuz (chokepoint6) REJECTED at the source in M4.1 — the provider's own series collapses 2026-03; never rebuild without re-verifying the monthly means against VERIFIED-SOURCES. |
| FS-13 | The supply-chain and energy family — the NY Fed GSCPI + the EIA SPR/production pages + the Pink Sheet energy columns (gap-closure S4, M4.4; fixtures `packages/insights/fixtures/s4/gscpi-2026-11-01.xls` + `s4/eia-spr-2026-11-01.html` + `s4/eia-crude-production-2026-11-01.html` + the committed Pink Sheet workbook) | M2, three new fetches + one free ride. **The GSCPI** (`medialibrary/research/interactives/gscpi/downloads/gscpi_data.xlsx` — named .xlsx but a LEGACY .xls, 105,984 B; Worker egress FAST, the S1 probe ~0.5 s): the rung2 monthly plan's fifth file (first-of-month + bootstrap), the biff reader's path. The data sheet is found STRUCTURALLY (the row reading 'Date' + 'GSCPI' — sheet 1 is the NY Fed boilerplate and the data sheet's own rows 1–3 carry boilerplate spill); dates are the provider's own DD-MMM-YYYY month-END strings read as month-start; the provider's own 2025-11-06 notice says the index publishes with limited data — the parse takes the rows the file carries, never back-fills. **The EIA weekly pair** (the eia-crude-stocks pattern twins; series ids WCSSTUS1 + WCRFPUS2 walked from the provider's own PET indexes in M4.1, never guessed): the Saturday rung2 eiaWeekly gate grows to THREE LeafHandler pages; the SPR is a LEVEL in thousand barrels, the production a RATE in thousand barrels per day (different plausibility bands — the cards state both units). **The Pink Sheet trio** (coal Australian column F $/mt, natural gas Europe column I $/mmbtu, LNG Japan column J $/mmbtu — verified from the live workbook's header + units rows): the SAME Monthly Prices sheet parse the metals ride — ZERO new subrequests. | The parsers fail closed. The GSCPI parse (monthly-indexes.ts): the structural Date/GSCPI header check, the strict DD-MMM-YYYY regex, the [−5, 10] band (the observed 1998–2026 range is −1.56…+4.43), ≥100 monthly points, ascending. The EIA weekly parse (eia-stocks.ts parseEiaWeeklySeriesHtml — the A-6 parse generalised to a per-series spec): the series-id + unit-line identity checks (the production page's 'Thousand Barrels per Day' needle distinguishes it from the SPR/stocks 'Thousand Barrels'), the per-spec plausibility bands (SPR [100k, 1M] thousand bbl; production [1k, 20k] thousand bbl/d — the observed ranges), the structural Year-Month/Week table find, the December→January year roll, ≥100 weekly points, ascending. The WB energy trio rides the existing WB_COLUMNS header+unit identity check (a renamed column or a changed unit fails the whole workbook parse — the metals' protection extended to the energy columns). All three land through the rung2 phase's merge lists + the Node venue's inline build; the Pink Sheet trio rides the 04:10 main rung's world-bank fetch with zero new subrequests anywhere. staleAfterDays: gscpi 75 (the monthly family), the EIA pair 12 (the stocks convention), the Pink Sheet trio 60 (B-09). |


---

## 9. Manual entry (M5)

- [ ] **F-24 Fields:** value, publisher, source link, publication date, entered on, expires on (the next scheduled release date).
- [ ] **F-25 Where it is entered:** a small owner-only form or a config file in the repository. Never a public form.
- [ ] **F-26 Expiry.** After the expiry date the card shows a stale tag. The existing China factory activity entry uses the same mechanism (defect E-08).
- [ ] **F-27 Update routine** is written in `MAINTENANCE.md`, with the dates of the next releases.

---

## 10. Tests

- [ ] **T-25 Honest identity.** Every outgoing fetch uses the declared User-Agent. A test fails if any other identity is used.
- [ ] **T-26 Terms gate.** A source cannot be enabled unless its terms lines, date read and level are recorded.
- [ ] **T-27 Blocked.** Simulate 403, 418, 429 and a bot-check page. The source shows "blocked by the site", is not retried in a loop, and nothing tries to get around the block.
- [ ] **T-28 Range.** A value outside its allowed range is rejected and the card shows "can't tell right now".
- [ ] **T-29 Format change.** A changed response shape produces "format changed" and a status message.
- [ ] **T-30 Disabled default.** A new L2 source with `owner_accepts = no` is never requested and never shown.
- [ ] **T-31 L3.** An L3 source is never requested.
- [ ] **T-32 Rate.** A full refresh makes at most one request per source.
- [ ] **T-33 Manual expiry.** A manual entry past its expiry shows a stale tag.
- [ ] **T-34 Cross-check.** A large directional disagreement with the VIX card is flagged for the CNN source.

---

## 11. Report

Add a section "Fetched sources" to `STEP3_REPORT.md` with, for each source in section 8: the terms lines quoted, the robots.txt result, the level, the method found (or "none"), the runtime chosen, whether it was blocked, whether it is enabled, and what the owner must do to enable it.
