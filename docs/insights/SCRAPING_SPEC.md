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
