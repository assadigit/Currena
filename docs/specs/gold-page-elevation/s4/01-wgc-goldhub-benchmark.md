> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S4/01 — WGC Goldhub Deep-Dive: the Reference Institution (M1)

**Session:** S4 of the Gold Page Elevation program · **Date:** 2026-11-17
(~05:00–09:00 UTC) · **Branch:** `docs/gold-page-elevation`

**Method:** every claim below was verified live this session by direct
fetch (curl, desktop-Chrome User-Agent) from the planning machine.
Endpoints and dates named per row. This document deepens the S1/08 §1
survey (which was a browser-level scan) into the dataset-by-dataset
catalog the Tier-2 build (D7, s1/12) needs. Access notes: `gold.org`
pages served 200 to curl (no JS-rendering needed — the dataset pages
are server-rendered Drupal); every `/download/file/*` endpoint served
**403 with the DU1 login-wall page** to an unauthenticated client
(§3). No WGC account was used (none exists) — nothing was downloaded;
this is a catalogue and access-map, not a data pull.

**D7 context (owner-accepted):** WGC is **L2-owner-accepted** (fetch
allowed, attribution required, letter still recommended — s1/10 §3).
The terms wording quoted verbatim in §4 is what the Tier-2 build must
comply with; the owner's authorisation letter remains the clean route.

---

## 1. The dataset catalog (all 14 Goldhub dataset pages, fetched live 2026-11-17)

The catalog index (`https://www.gold.org/goldhub/data`, HTTP 200,
89,574 B) lists 14 dataset pages. Every page below was fetched and
read; the "disclosure block" wording is WGC's own on-page metadata
(quoted or tightly paraphrased — the four standard fields they publish
per dataset: length/frequency, update schedule, units, methodologies).

| # | Dataset (page) | Update cadence (WGC's own wording) | Units | Methodology (named on page) | Downloads observed (all login-gated) |
|---|---|---|---|---|---|
| 1 | **Gold prices** (`/goldhub/data/gold-prices`) | "Updated weekly" | "currency unit per troy ounce unless otherwise stated" | **LBMA Gold Price** · **SGE Gold Benchmark Price** | `Gold_price_averages_in_a range_of_currencies_since_1978.xlsx` (file 8369) + `historical_pricing_methodology.pdf` (12490) |
| 2 | **Gold premium** (`/goldhub/data/gold-premium`) — the **local India/China premiums** | "Weekly" | "US dollars per troy ounce" | Chinese premium/discount · Indian premium/discount (two methodology PDFs) | `gold-premiums.xlsx` (11657) + 2 methodology PDFs (11658/11659) |
| 3 | **Gold returns** (`/goldhub/data/gold-returns`) | "This data set is updated weekly" | percentages | Gold and major asset returns | methodology PDF (11661) |
| 4 | **Gold correlation matrix** (`/goldhub/data/gold-correlation`) | "Data is updated daily based on end-of-day files" | "-1 to +1 … -100% and +100% cross correlation" | Gold correlations methodology note | methodology PDF (15474) |
| 5 | **Price volatility** (`/goldhub/data/gold-price-volatility`) | daily (end-of-day files) | percentages | Gold and major asset volatility | methodology PDF (15475) |
| 6 | **Trading volumes** (`/goldhub/data/gold-trading-volumes`) | "Data is published monthly but may be updated intra-month"; covers last full year, YTD and the last four full months | "billions of US dollars (US$bn)" | Trading volumes methodology 2025 | methodology PDF (19819) |
| 7 | **Futures curves** (`/goldhub/data/gold-futures-curves`) | "Daily" | "CME COMEX … US dollars per troy ounce" | CME COMEX | none — interactive chart only, no download link on the page |
| 8 | **Open interest / net longs** (`/goldhub/data/gold-open-interest`) | "All data is updated weekly based on end of day files" | "US$bn and … new long tonnage" | Net longs methodology | methodology PDF (13481) |
| 9 | **ETF holdings & flows** (`/goldhub/data/gold-etfs-holdings-and-flows`) | website charts weekly (Monday after week) + monthly; **the XLSX is monthly, "usually available within one week of the previous month-end"** | "tonnage and US$" (holdings t, flows US$) | ETF Flows Data methodology; **Sources line on charts: "Bloomberg, Company Filings, ICE Benchmark Administration, World Gold Council"** | `ETF_Flows_2026-11-03.xlsx` (21341) + methodology PDF (16223) — the file name embeds its data date (Nov 3, 2026: the October 2026 month) |
| 10 | **Gold reserves by country (central banks)** (`/goldhub/data/gold-reserves-by-country`) | "**Monthly files are updated within the first 10 days of the month (with data two months in arrears). Quarterly data is updated a month after the end of the quarter.**" | "Holdings are given in tonnes, US$ value and % of total reserves. Changes in holdings are measured in tonnes." | central bank data methodology + technical-adjustments note | `World_official_gold_holdings_as_of_Nov2026_IFS.xlsx` (7739) · `Changes_latest_as_of_Nov2026_IFS.xlsx` (7741) · `CBGA_sales.xlsx` (7745) · `Quarterly_gold_and_FX_Reserves_Q3_2026.xlsx` (8052) — **the first two are explicitly IFS-derived** (file names carry it) |
| 11 | **Gold demand by country (the GDT stack)** (`/goldhub/data/gold-demand-by-country`) | "Quarterly updates are published in conjunction with our Gold Demand Trends report" | "tonnes and US$ value where applicable; average quarterly and annual gold spot prices are in US$/oz" | supply-and-demand methodology note + notes-and-definitions + the consistency paper | `GDT Tables_Q326_EN.xlsx` (21333) + 3 methodology PDFs (13529/13530/8256) |
| 12 | **AISC (mine supply costs)** (`/goldhub/data/aisc-gold`) | "Updated quarterly, in conjunction with the publication of **Metals Focus' Gold Mine Cost Service**" | "US dollars per troy ounce" | Production costs methodology (cost curve basis: Metals Focus) | methodology PDF (13470) — **no XLSX download link on the page** |
| 13 | **Gold production by country** (`/goldhub/data/gold-production-by-country`) | "Updated annually, in conjunction with … Metals Focus' Gold Focus report" | tonnes | Gold mining production methodology | `Gold-Mining-Production-Volumes-Data-2025.xlsx` (7593) + methodology PDF (12489) |
| 14 | **How much gold (above-ground stocks)** (`/goldhub/data/how-much-gold`) | quarterly, with GDT | "tonnes and value (US$tn)" | above-ground stocks methodology + market primer | `above-ground-gold-stocks.xlsx` (7588) + methodology PDF (7589) |

**The standardized-discipline observation stands (S1/08 §1):** every
dataset page publishes its own length/frequency, update schedule,
units and methodology pointers — the exact disclosure grammar
Currena's `docs/SOURCES.md` mirrors. The Tier-2 build should render
the same four fields in its "about this data" block.

### 1a. The GDT quarterly stack (F2 Tier-2's target) — what is public vs gated

- **Public (verified live today):** the *Gold Demand Trends: Q3 2026*
  article (`/goldhub/research/gold-demand-trends/gold-demand-trends-q3-2026`,
  HTTP 200) carries the headline stack numbers and the segment
  definitions. Q3 2026 observed values (WGC's own published article,
  dated 3 November 2026): total demand incl. OTC 1,369 t (−1% y/y);
  **central banks 321 t** (y-t-d 675 t, +6%); **gold ETFs +211 t**
  (reversing Q2 outflows); **bar & coin 268 t** (−19%); **jewellery
  313 t** (−17%, weakest Q3 in their series); **technology +3% y/y**
  (AI-related fabrication); y-t-d demand 3,881 t ≈ 2025's record
  3,884 t; value record US$566bn; LBMA PM average US$4,262/oz in Q3;
  mine production 1,071 t; recycling 314 t (−8%). The article's
  **Notes and Definitions sub-page is public** and defines every
  segment: jewellery consumption (retail, gross incl. recycled,
  excludes trade-ins/second-hand), technology (electronics + dentistry
  + other, measured at fabrication), central banks (**net purchases =
  gross purchases less gross sales; swaps and delta-hedging effects
  excluded; includes IMF/official supra-nationals**), bar & coin,
  ETFs, mine production (incl. ASGM estimate), net producer hedging,
  and Comex net long positioning.
- **Gated (verified today):** the **GDT Tables XLSX** (`GDT
  Tables_Q326_EN.xlsx`, file id 21333; CN 21334; JP 21335; charts
  PPTX 21337; all-files ZIP 21336) → **403 DU1 without login**
  (§3). **The exact sheet/column structure of the GDT tables XLSX is
  therefore BLOCKED this session — with reason:** no WGC account
  exists in this program, and creating one is an owner action. **The
  structure mapping becomes a first-data-drop task** (the owner
  downloads the EN XLSX once → the S8 ingestion spec maps sheets/
  columns → the adapter fails closed on shape per the repo's parser
  discipline). Recorded as S4's one explicitly-blocked M1 item; the
  public article + notes pages above give the build everything it
  needs to spec the demand-stack card *semantics* today (the five
  demand segments + three supply legs + OTC/total convention).

### 1b. S1/08's "LBMA price removed from Goldhub" — sharpened

The prices page's only XLSX today is the **currency-averages workbook
since 1978** — no LBMA daily-price series download exists on Goldhub,
consistent with S1/08's report that LBMA historical price data was
removed at ICE's request (2025). The terms page (§4) still carries the
full IBA/ICE licence clause for LBMA Gold Price information, which
confirms both (a) why WGC charts it (permission under licence) and
(b) why Currena must never treat LBMA prices as a redistributable
feed (S1/09: LBMA real-time/historical requires IBA licence — the
free tier is the delayed auction print, §S4/02).

---

## 2. The GRAM mapping (M1's analytical deliverable)

**GRAM live (2026-11-17):** `/goldhub/tools/gold-return-attribution-model`
(HTTP 200). The interactive tool itself is **sign-in-gated**
("Please Sign in or Register to use the GRAM tool"), with a
methodology PDF behind the same wall. The public page states GRAM
"helps investors to: Quantify how each of gold's top drivers
contribute to its monthly or weekly price performance … Identify
periods where existing drivers do not fully explain gold's returns",
and lists the driver buckets:

**GRAM's five buckets** (page's own list, verbatim): *Economic
Expansion · Risk & Uncertainty · Opportunity Cost (FX) · Opportunity
Cost (Interest Rates) · Momentum & Trends*.

**Currena's five lanes** (`packages/insights/src/shared/gold-score.ts:54`,
read this session): `borrowing-costs`, `dollar`, `stress`,
`inflation`, `flows`.

| GRAM bucket | Currena lane | The mapping's meaning for F1 (the narrative) |
|---|---|---|
| Opportunity Cost (Interest Rates) | **borrowing-costs** (6 voters: real 10y/5y, curve, US10y/US30y…) | Direct conceptual match: the cost-of-carry channel. GRAM quantifies its regression contribution; Currena's lane states its firing tailwinds/headwinds. Same story, different grammar. |
| Opportunity Cost (FX) | **dollar** (6 voters incl. the DXY-style basket, USD/JPY, US−Japan gap) | Direct match: the dollar channel. |
| Risk & Uncertainty | **stress** (VIX, GPR family, CFTC pair, bank stress, crypto fear…) | Direct match: the safe-haven / risk channel. |
| Economic Expansion | **— no lane** (deliberate: `gold-score.ts` documents that the growth-health lane stays out entirely — "its members' gold relation [is unstable/weak]") | **The honest divergence:** GRAM attributes growth; Currena's meter deliberately excludes growth voters because the measured relation was not stable enough to vote on. F1's narrative must not invent a growth story the meter doesn't have. |
| *(no GRAM bucket)* | **inflation** (7 voters: CPI, PCE, breakevens, UoM expectations) | Currena-specific: the inflation/debasement channel that GRAM folds inside expansion/opportunity buckets. The lane model gives inflation its own seat — a *richer* decomposition than GRAM's on this channel. |
| Momentum & Trends | **— no lane** (the meter has zero price-derived voters; the D8 TA block adds trend context OUTSIDE the meter, display-only) | GRAM's momentum bucket is the one the Currena meter refuses to make a voter. The TA block (s1/13) is where trend context enters — descriptive, non-voting, exactly the GRAM-Momentum analogue under Currena's governance rules. |
| *(no GRAM bucket)* | **flows** (COT positioning, SGE withdrawals, Swiss imports, Shanghai premium) | **Currena's one bucket GRAM does not have:** the physical/positioning market as a channel. The F1 narrative can teach this as Currena's own attribution row — "the physical market's footprint", which GRAM cannot express. |

**The binding honesty rule for F1 (recorded for S6/S7):** GRAM is a
*statistical attribution* — a regression decomposing monthly returns
into contribution shares. Currena's F1 narrative must **never fake
that arithmetic**: no invented "X% of the move was real yields"
claims. The legitimate translation of GRAM's pattern is *structural*
— a daily story organized by the five (six) driver families, each
stating its observed firing state and the day's raw deltas, with the
explicit "the meter explains conditions, not the price move" caveat.
GRAM's "periods drivers do not fully explain returns" residual
concept maps to Currena's `mixed`/`unreadable` lane words — the
honest "we don't know" bucket. This is the F1 intellectual template
D6–D8 referenced; the mapping above is the copy architecture.

---

## 3. The login wall — re-verified with the exact failure signature

Unauthenticated GET (curl, desktop UA, no cookies) on 2026-11-17:

| Endpoint probed | Result |
|---|---|
| `/download/file/21341/ETF_Flows_2026-11-03.xlsx` | **HTTP 403**, `text/html`, 54,805 B — the DU1 page |
| `/download/file/7739/World_official_gold_holdings_as_of_Nov2026_IFS.xlsx` | **HTTP 403** (DU1) |
| `/download/file/21333/GDT Tables_Q326_EN.xlsx` (URL-encoded) | **HTTP 403** (DU1) |
| `/download/file/11657/gold-premiums.xlsx` | **HTTP 403** (DU1) |
| `/download/file/7593/Gold-Mining-Production-Volumes-Data-2025.xlsx` | **HTTP 403** (DU1) |
| `/download/file/8256/supply-and-demand-data-methodology-note.pdf` | **HTTP 403** (DU1) — **methodology PDFs are gated too** |
| `/download/file/12491/central_bank_data_methodology.pdf` | **HTTP 403** (DU1) |
| GRAM interactive tool | page 200 but the tool renders "Please Sign in or Register to use the GRAM tool" |

**Exact wall text (verbatim, the whole difference from S1b's "403
login page" finding):** the 403 page renders a standard WGC shell
whose content area reads — "**Access denied Error message DU1: You
are not logged in. You must be logged in to download this file Error:
403 You are not authorized to access this page.**"

**What this sharpens over s1/12 §1:** (i) the wall is *not* a generic
403 — it is a named rule (`DU1`) aimed exactly at download endpoints;
(ii) it covers **methodology PDFs** as well as data XLSX (so the
GDT/AISC/ETF methodology documents ride the same data-drop); (iii)
the catalog pages, dataset metadata, GDT article numbers and
Notes-and-Definitions are all public — the wall starts precisely at
the file bytes. The s1/12 conclusion stands unchanged: **no public
API; public catalogue; gated files; IFS-derived CB tables** (the
file names themselves still carry `_IFS`).

---

## 4. The exact attribution wording (verbatim quotes for the Tier-2 build, s1/12 §5)

From `https://www.gold.org/terms-and-conditions` (HTTP 200, fetched
2026-11-17; the operative licence text for Goldhub data):

**Clause 1 — the permission + accreditation sentence (the core):**

> "You are permitted to save, display or print out information
> contained on this Website only for your personal, non-commercial
> use. Except as otherwise permitted by these terms and conditions,
> you are not permitted to modify, copy, scrape, distribute, transmit,
> display, reproduce, duplicate, publish, license, frame, link, create
> derivative works from, transfer or otherwise use in any manner, in
> whole or in part, this Website or the information and materials on
> this Website without the prior written authorisation of WGC and
> with suitable accreditation to WGC. To request such authorisation,
> please contact us at info@gold.org."

*(The contact email is Cloudflare-obfuscated on the page; it decodes
to `info@gold.org` — the general WGC contact the authorisation letter
should be addressed through.)*

**Clause 2 — Proprietary Rights:**

> "This Website and all information and materials on this Website are
> protected by international copyright and trademark laws and other
> intellectual property laws, and any unauthorised use of any
> information and materials on this Website may violate such laws.
> All intellectual property rights in this Website, and in and to all
> information and materials on this Website, (including, without
> limitation, copyrights, trademarks and rights in and to designs)
> are owned by WGC or are used by WGC with the permission of the
> third-party owner or provider of such information or materials."

**Clause 3 — the IBA/ICE clause (why LBMA price data is special):**

> "…Price is used by WGC with permission under licence by IBA.
> Published LBMA Gold Price information may not be indicative of
> future LBMA Gold Price information or performance. None of IBA,
> Intercontinental Exchange, Inc. (“ICE”) or any third party that
> provides data used to administer or determine the LBMA Gold Price
> (data providers), or any of its or their affiliates makes any
> claim, prediction, warranty or representation whatsoever as to the
> timeliness, accuracy or completeness of LBMA Gold Price
> information…"

**The footer line every WGC page carries:** "©2026 World Gold
Council. All Rights Reserved".

**Operational translation for the Tier-2 build (recorded for the S6
spec + S8 roadmap):** the terms demand *prior written authorisation*
for reuse "in any manner" — D7 records the owner's informed
acceptance of proceeding without it, with the letter recommended in
parallel. What the build itself must do under the owner-accepted
posture: (a) **attribution on every rendered number and chart** in
the form WGC's own charts use — the ETF page's chart sources line is
the house pattern: *"Sources: Bloomberg, Company Filings, ICE
Benchmark Administration, World Gold Council"* → for GDT-derived
numbers: **"Source: World Gold Council — Gold Demand Trends"** with a
link to the dataset/article page; (b) the terms-and-conditions page
linked in the licence footer (the L2-attribution-required treatment
`docs/SOURCES.md` gives other L2 sources); (c) no re-hosting of the
raw XLSX in the repo's public web assets — the dated source files
live in the repo's private ingestion path (`data/wgc/`), only
derived/aggregated numbers render publicly; (d) the authorisation
letter (s1/12's parallel action) is addressed via `info@gold.org`,
citing the datasets, the attribution practice, and currena.ir's
audience — granting it converts the residual exposure to zero.

---

## 5. The download workflow — data-drop vs authenticated session (the recommendation)

**The two viable patterns for Tier-2 (D7):**

| | Pattern A — **Data-drop (recommended)** | Pattern B — authenticated session |
|---|---|---|
| Mechanics | Owner logs into gold.org on release day (their free WGC account), downloads the XLSX, saves it as a dated source file `data/wgc/<YYYY>-<Qn|YYYY-MM>-<dataset>.xlsx`; ingestion parses the file in the normal pipeline (fail-closed shape checks); the file is committed (or held in the git-ignored data store per repo convention) | The owner's WGC session cookie is stored as a Worker secret; a scheduled worker replays the authenticated download on release day |
| Credentials in the system | **None.** No stored credentials at all — the human is the authenticator | A live session cookie in wrangler secrets; expires, rotates, and leaks into logs on any mistake |
| Terms posture | A human account holder downloading files for reuse under an owner-accepted licence posture; auditable file trail; the exact files provable in git | **Automated session-replay is functionally the "scrape" the terms' clause names** ("not permitted to … scrape … without the prior written authorisation of WGC") — the worst posture available while the letter is unsent |
| Failure mode | A missed drop = the card goes honest-stale (fail-closed); visible the same day | Silent auth expiry → 403 loop → the same stale card, plus credential maintenance burden |
| Cadence fit | All Tier-2 datasets are weekly/monthly/quarterly (§1) — a manual drop fits trivially; ETF monthly XLSX "within one week of month-end"; GDT quarterly; reserves monthly within first 10 days | A cron only matters if updates were intraday — they are not |
| Auditability | Full: dated files, deterministic parse, provenance rows (`source`, `asOf`, `retrievedAt` per the traceability discipline) | The fetch happens at runtime; provenance is the worker's log |

**Recommendation (binding for the S8 spec unless the owner
overrides):** **Pattern A — data-drop.** It matches s1/12 §2's lean,
satisfies AGENTS.md §7 (no stored credentials — the strongest
interpretation of the repo's secrets rule), keeps the terms exposure
at the minimum the owner already accepted, and turns the DU1 wall into
a workflow instead of a blocker. The ingestion's `data/wgc/` contract:
`<dataset-id>/<YYYY-MM-DD or YYYY-Qn>-<file-name-as-published>.xlsx`
(the published name preserved for audit), one JSON parse spec per
dataset (GDT tables, ETF flows, premiums workbook), revision
tolerance per the repo's existing vintage practice (re-fetch trailing
months for revised series; keep vintage + latest where WGC revises —
the same rule s1/11 §6 records for TGJU and the S2 GPR finding
records for provider revisions generally).

**Release-day calendar (from §1, for the drop schedule):** ETF XLSX ≈
1 week after month-end · CB monthly files ≈ first 10 days of the month
(data T−2 months) · quarterly reserves ≈ month after quarter-end ·
GDT ≈ with the GDT report (Q3 2026 landed 3 November 2026 — the
article date observed) · premiums/prices/returns weekly.

---

## 6. What this means for S5 / S6 / S8

- **S5 (SWOT + master list):** WGC Tier-2 is now catalogued to
  licence-text granularity: adopt-reject rows can cite exact cadence/
  units/attribution. The AISC dataset has **no public XLSX path**
  (chart + gated methodology only; the underlying Gold Mine Cost
  Service is Metals Focus proprietary) — recommend **defer/reject
  AISC** in M5's table unless the owner's letter unlocks it; the
  supply-cost story can be taught editorially without it.
  Futures-curves/o.i./volumes duplicate data Currena already has
  cleaner routes for (CFTC public domain; CME blocked S1/08 §3) —
  expected verdicts: reject-as-duplicate. The premium workbook
  (`gold-premiums.xlsx`) overlaps Currena's existing Shanghai
  premium card + adds India — a Tier-2 candidate with the others.
- **S6 (IA):** the demand-section spec cites this catalog for the
  "about this data" block (length/frequency, update schedule, units,
  methodology — the four-field disclosure), the attribution line
  format, and the data-drop release calendar.
- **S8 (roadmap):** the data-source mapping table's WGC rows now have
  their licence level (L2-owner-accepted), cost (free account +
  owner's monthly/quarterly drop minutes), cadence (per-dataset §1),
  cache strategy (parse-on-drop → KV/D1 dated rows; stale tags per
  repo discipline), and the one blocked item (GDT sheet/column
  mapping — first-drop task).

## 7. Method and limitations

Direct fetches from the planning machine, 2026-11-17 ~05:00–09:00
UTC: `gold.org` catalog + 14 dataset pages + terms page + GDT article
+ notes/definitions + GRAM page (all HTTP 200); 8 download endpoints
probed unauthenticated (all 403 DU1). No WGC account exists in this
program — nothing was downloaded and the GDT XLSX structure was NOT
inspected (blocked-with-reason, §1a). The Q3-2026 GDT numbers are
WGC's own published article values (their copyright, quoted under the
attribution-required posture this program records). Worker-egress
reachability of `gold.org` is probed separately in S4/04 (the
data-drop makes Worker egress irrelevant for Tier-2, but the public
article pages matter for any future direct read).
