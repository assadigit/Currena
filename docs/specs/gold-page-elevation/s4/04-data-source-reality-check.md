> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S4/04 — The Data-Source Reality Check: per-candidate verification (M4)

**Session:** S4 of the Gold Page Elevation program · **Date:** 2026-11-17
(~05:00–11:00 UTC) · **Branch:** `docs/gold-page-elevation`

**Method (the program's verification standard):** every candidate below was
probed live this session — by direct fetch from the planning machine
(endpoints, byte counts, timings recorded) AND, for the venues that would
serve production, by the repo's **temp-probe Worker-egress pattern** (a
throwaway Worker `currena-probe-s4`, deployed via the Cloudflare API,
invoked once, deleted after the read — credentials used, not stored; the
deletion re-verified 404). Cross-check arithmetic shown reproducibly.
Carried evidence cited, not re-litigated: the S2 §7 19-row and S3 §5
20-row cross-checks (same-day, same discipline).

**FRED venue note (this session):** `fred.stlouisfed.org` became
unreachable from the planning machine during this session (timeouts on
all paths — it served the S2/S3 audits earlier today) and returned **520
from Worker egress** in the probe. FRED-dependent rows below rely on the
S2/S3 same-day verified values, cited; the outage is recorded as a
transient venue state to re-check at build time (production's FRED path
is the Node ingest venue per the repo's design).

---

## 1. The venue map (Worker-egress probe, 2026-11-17 09:57:41 UTC)

| Venue (what Currena needs it for) | Worker egress | Planning machine | Verdict |
|---|---|---|---|
| `api.imf.org` — IRFCL/IL gold reserves (F2 Tier-1) | **200**, 100,149 B SDMX-JSON, 1.57 s | 200 (1.3–4.8 MB full queries) | **usable from production egress** (same venue as the COFER adapter) |
| `home.treasury.gov` — daily nominal+real yield CSVs | **200**, 17,849 B CSV, 0.62 s | 200 (nominal 17,849 B; real 7,926 B) | **usable** |
| `api.elections.kalshi.com` — Fed-probability module | **200**, 1.2 s | 200 (markets + orderbook endpoints) | **usable, keyless** |
| `gamma-api.polymarket.com` — Fed-probability module | **200**, 0.69 s | 200 | **usable, keyless** |
| `www.gold.org` — WGC public pages | **200**, 67 ms | 200 (catalog + dataset pages + GDT article) | usable (Tier-2 is data-drop anyway) |
| `cdn.lbma.org.uk` — LBMA vault/clearing XLSX | **200**, 23,732 B, 0.14 s | 200 (both workbooks downloaded + parsed) | **usable** |
| `www.lbma.org.uk` — LBMA pages | **200**, 0.42 s | 200 | usable |
| `prices.lbma.org.uk` — LBMA price JSON | **403** (Cloudflare) | **403** (Cloudflare) | **venue-blocked everywhere — never a source** |
| `call1.tgju.org` — TGJU ajax | **200**, 190,615 B, 2.4 s | 200 | **usable (production's existing path re-verified)** |
| `www.tgju.org` — TGJU profile pages (backfill) | **200**, 1.04 MB, 2.3 s | 200 (4 pages + terms fetched) | **usable — the backfill is egress-viable** |
| `api.bls.gov` + `www.bls.gov` — BLS direct | **403** (Akamai) | **403** (Akamai) | **venue-blocked from both venues — CPI stays FRED-side (policy §4)** |
| `eodhd.com` — EODHD | 403 on a demo-token call | 200 with the supplied key | auth-shaped probe response; production's authenticated EODHD ingestion works (S2 §7 row-1 evidence: EODHD XAUUSD Nov 16 close verified on the live page's data path) |
| `fred.stlouisfed.org` | **520** | timed out this session | transient-or-blocked: production FRED rides the Node ingest venue; re-check at build |

*(The probe Worker was deleted immediately after this read — the S1-M1.1
documented pattern; post-deletion URL 404 re-verified.)*

---

## 2. The mandatory verification items (all 8, from the S4 prompt)

### 2a. TGJU unit conventions + profile-history terms — RESOLVED (S4/03 §1b, §1d–§1f)

The mesghal quote puzzle is closed by live arithmetic (mesghal =
geram24 × 3.2492 = the آبشده 4.6083 g × ~0.705 convention; the naive
4.6083 g-of-24k reading overstates by 41.8%). The rial-printed /
toman-canonical convention re-verified on the live feed (TGJU prints
Rial; the news chains print toman; the repo's ÷10 canonical rule is the
only machine-consistent treatment). The profile-history terms: TGJU's
terms page carries one operative sentence — «هر گونه کپی برداری از
محتوا، تولیدات، شکل و سایر اجزای سایت صرفا با موافقت مکتوب مجاز می
باشد» (copying requires written consent) — the existing production
scrape rides the owner's accepted posture; the backfill inherits it;
the sanctioned alternative exists (persianapi.com, §2e below). Rate
limits: no published limits; the known-safe envelope is the production
~5-min ajax cadence; the backfill = one-time, off-hours, sequential
(the 4 profile pages this session all served 200 in ~1.5–2.3 s).

### 2b. CBI mint specs — RESOLVED with one residual (the biggest correction to s1/11)

**Primary source landed:** CBI's own commemorative-coins page
(`cbi.ir/page/5953.aspx`, fetched 200 this session) states, in CBI's
own words — «وزن هر قطعه ۸.۱۳۶ گرم طلا با عیار **۹۰۰ در ۱۰۰۰ (۲۱.۶)**
و قطر هر سکه یادبود ۲۲.۲ میلی‌متر» for the 1-Bahar size; 5-Bahar =
40.68 g, 2.5-Bahar = 20.34 g, all «عیار ۹۰۰ در ۱۰۰۰». So the
Bahar-family full coin is **8.136 g total × 0.900 = 7.3224 g pure**
(the s1/11 table's "8.133 g → 7.3197 g" is the widely-published
variant — 0.04% apart; the bridge spec table carries the CBI-primary
figure and documents the variant).

**The gerami weight question — resolved by triangulation (1.000 vs
1.0149 g was a false binary):**
- The EN-Wikipedia Bahar Azadi spec table (fetched 200 this session)
  lists the **1/8 Bahar size: 1.01 g total / 0.909 g pure / 0.900
  purity / 13.3 mm**, and describes the gerami as the 2010 "new
  edition of Bahar Azadi coins with a weight of about one gram" —
  i.e. **the gerami is the 1/8-Bahar size: ~1.01 g total, 900
  fineness, ~0.909 g pure** — NOT 1 g pure + alloy, NOT 1.0149 g at
  999.9.
- The market arithmetic corroborates: TGJU's own `gerami_blubber`
  (5,937,000 toman) and eghtesadonline's حباب (5,934,000 toman, same
  hour) both imply a gerami intrinsic of ~30.06 M toman = **0.90 g
  pure** at the same-snapshot melt (33.38 M toman/g) — consistent with
  0.909 g within rounding, inconsistent with 1.0148 g (which would
  imply a negative-to-flat premium).
- The consequence: **s1/11 §5's gerami premium sanity check (+5.7%)
  was computed on the wrong spec.** Corrected on today's snapshot:
  gerami premium ≈ **+18.6%** (Currena-method) / +19.7% (TGJU's
  convention) — which also makes the premium ladder monotone and
  sensible: full +3.3% < half +8.5% < quarter +18.1% ≈ gerami +18.6%.
- Residual (blocked-with-reason): the CBI gerami press release page
  itself is WAF-blocked from this environment (`درخواست رد شد` on
  every /coin/ path and the search); one build-time check (owner's
  browser or a different egress) pins the exact minted figure
  (1.01 vs 1.0149 g total — a 0.5% intrinsic ambiguity). The spec
  band 0.90–0.92 g pure is established regardless.

### 2c. WGC attribution wording + download workflow — RESOLVED (S4/01 §4–§5)

Verbatim terms quoted (the accreditation clause, Proprietary Rights,
the IBA/ICE clause); the DU1 wall re-verified on 8 endpoints; the
data-drop pattern recommended over authenticated-session (reasons:
terms' anti-scrape clause makes session-replay the worst posture; no
stored credentials; auditability; the weekly/monthly/quarterly cadence
fits). Release-day calendar documented per dataset.

### 2d. IMF IFS series IDs for monthly gold reserves — RESOLVED (the sharpest finding)

**The IFS dataflow does not exist on the modern IMF SDMX 3.0 API.** The
registry (`api.imf.org/external/sdmx/3.0/structure/dataflow/IMF.STA`,
197 flows fetched) carries **no IFS**. The IFS "International
Liquidity" heritage lives in two live dataflows, both verified with
real data this session (keyless, Worker-egress 200):

| | Dataflow 1 (the modern template) | Dataflow 2 (the classic series) |
|---|---|---|
| URL | `api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IRFCL/12.0.0/*.IRFCLDT1_IRFCL56V_FTO.*.*` | `…/IMF.STA/IL/13.0.1/*.RGV_REVS.FTO.*` |
| Series | `IRFCLDT1_IRFCL56V_FTO` — "Official reserve assets, gold volume" (codelist IRFCL56V: "gold volume in millions of fine troy ounces" — **the data is actually raw fine troy ounces**; the docs-vs-data unit discrepancy noted) | `RGV_REVS` — "Gold reserves (volume)", unit FTO |
| Dimensions | `COUNTRY.INDICATOR.SECTOR.FREQUENCY` (sector: S1XS1311 central bank) | `COUNTRY.INDICATOR.UNIT.FREQUENCY` |
| Coverage | 89 countries, monthly; latest 2026-M10 (17 countries) / M09 (53) — T+1..2 | **188 countries, monthly; USA history back to ~1956 (844 obs)**; latest M10 (28) |
| Verified values | USA 261,499,000 ozt = **8,133.5 t** ✓ (exact); DEU 3,349 ITA 2,452 FRA 2,437 CHN 2,410 RUS 2,264 IND 881 TUR 797 KAZ 382 POL 673 — all match world figures | same magnitudes; **IRN present (ends 1996-M03, 168.6 t)**; RUS ends 2025-M11 in IL but is current in IRFCL |
| Size/speed | 1,314,020 B, 2.5 s (full wildcard query) | 4,832,982 B, 6.4 s |

**The adapter spec (for S8; the COFER adapter pattern applies
directly):** IL primary (broad coverage + deep history), IRFCL
complement (fresher for some reporters) — or a per-country merge.
Tonnes = ozt × 31.1034768/1e6. **Fail-closed rules discovered by this
session's parse:** (i) drop scale-outlier rows (BRA 5.54e9 ozt and AGO
5.93e8 ozt are broken rows — a value-band check ≤350 M ozt per country
catches them); (ii) **exclude aggregates from sums** (G163 = the euro
area, 10,807 t — summing it with member states double-counts); (iii) no
world aggregate exists — the honest "reported-world" total (86
countries, outliers/aggregates excluded) is **31,365 t** vs the true
world ~36.7 kt (non-reporters) — the card labels what it is. Monthly
net purchases per country (Δ) come straight from the feed (verified:
China +20 t/month cadence visible in the trailing months; Russia
declining). s1/12's "IMF IFS monthly reserves" is now concretely:
**IL/IRFCL SDMX 3.0, keyless, L1, monthly, both dataflows
Worker-egress-verified.**

### 2e. The CPI shutdown-gap policy — RESOLVED with a written recommendation (§4 below)

BLS venue reality: `www.bls.gov` + `api.bls.gov` are Akamai-403 from
**both** the planning machine and Worker egress — BLS-direct is not a
Currena data path at all. FRED (the repo's CPI mirror) was transiently
unreachable from the planning machine this session (venue note). The
carried same-day evidence: S2 §7 row 10 + GPE-S2-07 (Oct 2026 index
337.511 published; the Oct 2025 base month empty on FRED — the
shutdown gap; the seat fail-closed) and S3 §5 rows 8–9 (the
adjacent-months-average method exactly reproduces 4.02% headline /
2.77% core). Recommendation in §4.

### 2f. Treasury.gov direct as the yield source (S3-D3a) — RESOLVED: adopt (for S8)

Verified live from both venues: the daily **nominal** curve CSV
(14 maturities, 1 Mo→30 Yr; 2026 file; Nov 16 row: 10 Yr **5.12** —
exactly SA's read, **2 trading days fresher than Currena's FRED Nov 12
= 5.10**) and the daily **real** curve CSV (5/7/10/20/30 Yr; Nov 16:
10 Yr real **2.92**; 5 Yr real 2.68 — covers the DFII5 seat). Licence:
US federal public domain (same class as FRED). Working URL pattern
(year-scoped: `/…/daily-treasury-rates.csv/2026/all?type=…&field_tdr_date_value=2026&page&_format=csv`;
the `all/all` full-history variant 403'd — recorded). Worker-egress
200, 0.62 s. Breakevens derive as nominal−real (2.20 = 5.12−2.92 ✓
matches the T10YIE family). **Verdict: adopt for the /gold yield
family with FRED as the cross-check/fallback leg; the switch is an
S8 roadmap decision (one ingest-leg swap, zero schema change).**

### 2g. Prediction-market API access (Kalshi/Polymarket) — RESOLVED with one sub-block

- **Kalshi:** the trade API v2 is keyless-readable — re-verified this
  session (`markets?series_ticker=KXFED&status=open`: 236 open
  markets, incl. the 11 Dec-2026 target-rate markets closing 2026-12-09
  matching the Dec 9 Fed meeting; `…/markets/{ticker}/orderbook`:
  200 JSON dollar-depth ladders). Worker-egress **200**. **Blocked
  sub-item (with reason):** the Developer Agreement text — Kalshi's
  web host rate-limits this environment (429 on every kalshi.com page;
  docs.kalshi.com is readable and states "By continuing to use or
  access Kalshi's API, you are agreeing to be bound to our Developer
  Agreement") — the agreement's exact data-reuse wording must be read
  once at build time (a one-page fetch from a browser session).
- **Polymarket:** the gamma API keyless-readable — re-verified (the
  active Dec-2026 Fed event `fed-decision-in-december-20260729232808632`
  fetched live: +25 bp **0.915** / +50 bp **0.052** / unchanged **0.0305** /
  cuts 0.0045/0.0035 — matching S3's morning read). Worker-egress
  **200**. ToS fetched and read (§3 below). Rate limits documented
  (IP-based Cloudflare throttling; gamma `/events` 500 req/10 s — a
  30-min refresh card is ~5 orders of magnitude under).

### 2h. LBMA vault data as the free institutional-stock card — RESOLVED (S4/02 §1b)

Monthly, T+1, 124-month series, free direct XLSX from `cdn.lbma.org.uk`
(Worker-egress 200), arithmetic reproduces the printed figures exactly
(9,849.9 t ≈ 9,850 t; +0.293%; silver 28,889.2 t). The clearing
workbook verified alongside (360 monthly rows 1996-11→2026-09).

---

## 3. The licence wording for the prediction markets (verbatim, Polymarket; Kalshi partial)

**Polymarket ToS** (`polymarket.com/tos`, fetched 200; effective
Aug 11, 2026) — the operative Data clauses:

> "Access or use any data, content, or information contained on our
> Site, any Interface or Features **directly or through an API**, or
> any other means, including on-chain, whether in raw, derived,
> aggregated, or anonymized form (the “Data”) if you are (i) a
> non-retail, professional entity that engages in capital markets
> activities (e.g., brokerage, market making, proprietary trading,
> index calculation, or ETF issuance) … (each, a “Capital Market
> Client”), or (ii) a market data distributor, in each case unless
> otherwise agreed to in writing by us; **Sell, resell, sublicense,
> redistribute, or otherwise commercially exploit the Data to any
> Capital Market Client or market data distributor**, unless otherwise
> agreed to in writing by us…"

Plus the general anti-scraping clause ("Use any data mining tools,
robots, crawlers… to scrape or otherwise remove data from the Site").

**The honest reading for Currena's Fed-probability module:** the
prohibited classes are *capital-market clients and market-data
distributors*; a public, informational, attributed display (a card with
"Source: Polymarket / Kalshi — market-implied probabilities", links to
the markets, no bulk redistribution, no API trading keys) sits outside
the named prohibitions — the same keyless-public-JSON read SA performs
today (S3-verified). The residual ambiguity ("financial technology
companies" appears inside the Capital Market Client list) is recorded;
the conservative treatment stands: display-only + attribution + link
+ no key'd endpoints. Kalshi's equivalent Developer Agreement wording:
**blocked this session (429) — one build-time read** (§2g).

---

## 4. The CPI shutdown-gap policy — the written recommendation (GPE-S2-07 / S2-D3)

**The problem (S2-verified, same-day):** the pipeline's YoY rule
(same-month prior-year on CPIAUCNS levels) cannot compute Oct 2026 —
the Oct 2025 base month is empty on FRED (the 2025 shutdown gap), so
the seat renders "couldn't be read" while the Oct 2026 index itself is
published. The competitor solves it with a disclosed, reproducible
method; Currena currently has no policy.

**Recommendation (S4-D1, for the S8 spec):** adopt the
**adjacent-months-average base** as the pipeline's gap policy, with
the method labelled at point of use:

1. **Stored series stays pure** — CPIAUCNS levels only; the YoY is
   computed at read time; no gap-filled value is ever stored.
2. **The gap rule (general, not an Oct-2026 hack):** when the
   prior-year base month is absent, the YoY base = the average of the
   two adjacent published months (Sep-2025 + Nov-2025)/2 — today's
   live arithmetic: 337.511 / 324.461 − 1 = **4.02%** headline;
   CPILFESL equivalent = **2.77%** core (both reproduce SA's
   disclosed numbers exactly — S3 §5 rows 8–9, the only publicly
   reproducible method on the table).
3. **Label at point of use** (the S3-D3c rule family): the card copy
   reads «مبنا: میانگین دو ماه مجاور (شکست انتشار ۱۴۰۴ مهر)» / "base:
   adjacent-months average (Oct-2025 publication gap)" — the honest
   disclosure that also teaches the shutdown gap.
4. **Auto-expiry:** from Nov 2026 data (base Nov 2025 — published) the
   standard rule resumes; the rule fires only when a base month is
   absent, covering any future gap.
5. **Rejected alternatives, with reasons:** *skip-month base*
   (Oct2026/Sep2025) — biases by a month of NSA drift (~±0.3 pp) and
   has no disclosed precedent; *BLS's own YoY* — BLS is venue-blocked
   from both Currena venues (§2e) and does not publish the 12-month
   figure when the base is missing (the honest reading of the
   release situation — unverifiable either way from here); *fail-closed
   only* — honest but leaves the flagship inflation voter dark for a
   month (S2-D3's recorded operational pain, and the competitor shows
   the reader a number there).

---

## 5. Candidate-by-candidate reality check (≥15 required; verdicts here, decision table in S4/05)

| # | Candidate (feature) | Source verified this session | Licence | Cost | Cadence | Cache strategy | Fetch-verified? | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | IMF gold reserves — Tier-1 CB tracker (F2) | IL `RGV_REVS` + IRFCL `IRFCL56V_FTO` (§2d) | L1 (IMF, keyless) | 0 | monthly, T+1..2 | monthly rung; 30-day stale tag; revision-tolerant re-fetch trailing 3 months | **YES — live, both venues, arithmetic reproduced** | **ADOPT** |
| 2 | WGC GDT quarterly stack (F2 Tier-2) | article public + XLSX gated (S4/01 §1a) | L2-owner-accepted (attribution) | 0 + owner drop minutes | quarterly | data-drop → dated file → parse; stale tag per cadence | article YES; XLSX blocked-by-design (data-drop) | **ADOPT (Tier-2, data-drop)** |
| 3 | WGC ETF flows (F9) | `ETF_Flows_2026-11-03.xlsx` gated (S4/01 §1) | L2-owner-accepted | 0 + drop | monthly XLSX | same | YES (wall + cadence verified; file gated) | **ADOPT (rides the same drop)** |
| 4 | WGC premiums workbook (India/China — F2/F3 complement) | `gold-premiums.xlsx` gated; methodology named | L2-owner-accepted | 0 + drop | weekly | same | gated verified | **DEFER** (Shanghai premium card exists; add when the drop is routine) |
| 5 | WGC AISC | no XLSX on page; Metals Focus proprietary | gated | — | quarterly | — | structure verified (no data path) | **REJECT (no public data path)** |
| 6 | WGC futures curves / open interest / volumes | pages verified (CME COMEX basis) | gated | — | daily/weekly | — | YES (pages) | **REJECT (duplicates CFTC/EODHD public-domain routes)** |
| 7 | LBMA Gold Price feed | midnight-delay rule verbatim; JSON host 403 both venues (S4/02 §1a) | L3 + IBA licence | paid | 2× daily auctions | — | venue-blocked verified | **REJECT as a source** (cross-check print only) |
| 8 | LBMA vault monthly card | XLSX parsed, arithmetic exact (S4/02 §1b) | free, attribution "Source: LBMA" | 0 | monthly T+1 | monthly fetch, 30-45d stale tag | **YES — both venues, parsed** | **ADOPT** |
| 9 | LBMA clearing monthly card | XLSX parsed (S4/02 §1c) | free, attribution | 0 | monthly | same | **YES** | **ADOPT (companion to #8)** |
| 10 | LBMA forecast survey + accuracy retrospective | 2010–2026 series extracted from public page (S4/02 §1d) | free, attribution | 0 | annual + mid-year | annual manual entry / page read | **YES (data extracted)** | **ADOPT (Advanced tier, later phases)** |
| 11 | Treasury.gov direct yields (S3-D3a) | both CSVs live; +2 trading days fresher than FRED (§2f) | public domain | 0 | daily | daily rung leg; FRED fallback | **YES — both venues** | **ADOPT (S8 switch decision)** |
| 12 | Kalshi Fed probabilities | markets + orderbook keyless 200 (§2g) | ToS: display+attribution posture; agreement wording = one build-time read | 0 | continuous; 30-min card refresh | 30-min cache; event closes → next market | **YES — both venues** | **ADOPT** |
| 13 | Polymarket Fed probabilities | gamma API live values (§2g) | ToS read (§3): outside the prohibited classes for an informational display | 0 | same | same | **YES — both venues** | **ADOPT (companion leg; venue diversification, SA pattern)** |
| 14 | TGJU instruments + premium (F3 Bridge-1) | feed live; 9 instruments + 5 حباب symbols (S4/03 §1) | L2-owner-accepted-by-practice | 0 | ~5 min snapshots | existing KV snapshot; premium computed at read | **YES — both venues** | **ADOPT (D6; premium = the documented, reproducible series)** |
| 15 | TGJU profile history backfill (F3 Bridge-2) | 4 profile pages 200; OHLC+volume tables verified; terms verbatim | same posture | 0 | one-time | one-time off-hours sequential parse; forward accumulation daily | **YES — both venues** | **ADOPT (route A); persianapi ~14M ﷼/mo = route B fallback** |
| 16 | CBI mint specs (the premium's constants) | CBI page 5953 primary (900-fineness verbatim); gerami triangulated (§2b) | primary source | 0 | static | constants in the spec table | **YES (CBI primary + arithmetic triangulation)** | **ADOPT (with the 0.90–0.92 g gerami band + one build-time pin)** |
| 17 | EODHD XAUUSD daily OHLC (F7/F8) | 360 rows to Nov 16 with the session key; close 3,862.84 = S2's verified value | L2 (EODHD terms; owner plan) | owner plan | daily EOD | daily rung; existing | **YES (this key free-tier: 1-yr depth — the 10y decile needs the owner plan or server-side percentile10y)** | **ADOPT (existing source; note the free-tier depth limit)** |
| 18 | EODHD XAU-crosses (F10 grid) | XAUEUR/XAUAUD partial on the free key; XAUJPY/GBP/CNY/CHF not found on it (S1/09 verified them on the owner's key) | L2 | owner plan | daily | daily rung | **PARTIAL (free-key limits; owner plan = S1/09-verified)** | **ADOPT on the owner plan (F10 rides production EODHD)** |
| 19 | Long-run gold series 1971→ (F6 Episode Explorer) | WGC prices workbook (currencies since 1978) gated = the same data-drop; FRED GOLDAMGBD228NLBM (discontinued 2021) unverified this session (FRED venue down) | L2-owner-accepted / public domain | 0 + drop | one-time + annual | one-time backfill | gated-verified + FRED deferred-with-reason | **ADOPT via the WGC prices workbook drop** (monthly averages since 1978); FRED supplement at build time |
| 20 | CPI shutdown-gap policy (GPE-S2-07) | §4 above | n/a | 0 | monthly | read-time YoY with the gap rule | method reproduced (S3 evidence) | **ADOPT the recommendation (S4-D1)** |
| 21 | Persian news venue cross-check (Union vs TGJU) | tejaratnews/eghtesadonline live; 0.3% venue spread + حباب convention divergence documented (S4/03 §2) | editorial (cited as press) | 0 | daily articles | n/a (context, not a source) | **YES** | **ADOPT as the bridge card's "why our number is documented" context; REJECT as a data source** |
| 22 | Kitco 5-driver / KGX / unit header | pages live, terms anti-scraping (S4/02 §2) | concept-only | 0 | n/a | n/a | **YES (patterns quoted)** | **ADOPT the patterns; REJECT the bytes** |
| 23 | Trading Economics narrative + forecasts | page live, anti-pattern quoted (S4/02 §3) | concept-only | 0 | n/a | n/a | **YES** | **ADOPT the narrative pattern; REJECT the forecast-as-headline** |

**Count: 23 candidates reality-checked, ≥15 requirement met (16 of
them fetch-verified live this session; 4 gated-by-design on the WGC
login wall; 2 venue-blocked rejections verified; 1 method-policy
adopted).**

---

## 6. What this means for S5 / S8

- **S5 (SWOT + master list):** the feasibility layer is complete —
  every Core/Supporting candidate now has a verified data path or a
  recorded blocker; the two s1/11 corrections (حباب published by
  incumbents; gerami spec) and the two s1/12 resolutions (IFS→IL/IRFCL;
  data-drop) feed the SWOT's O/T columns directly.
- **S8 (roadmap):** the data-source mapping table rows are fully
  populated (source, licence, cost, cadence, cache strategy,
  fetch-verified flag) — the consolidated verdict table is S4/05.
- **One carried-over correction for S6/S7 copy:** the bridge's حباب
  block and the education layer must teach the **three-numbers-in-one-hour
  divergence** (TGJU 7.88M / Currena-method 8.08M / Union-press 5.99M
  toman, this session's evidence) as the reproducibility gap Currena
  closes.

## 7. Method and limitations

All probes live this session (dates/timings per row): curl from the
planning machine; the temp-probe Worker `currena-probe-s4` (Cloudflare
API upload → invoke → delete; post-deletion 404 verified); openpyxl for
the two LBMA workbooks; Python for all arithmetic (one self-caught
unit bug — the ozt→tonnes factor — corrected in §2d before any
doc claim shipped). FRED/BLS/Kalshi-web venue states recorded honestly
(transient/blocked/partial). FRED's 520-from-Workers is recorded as
observed; production FRED runs on the Node ingest venue (repo design).
The GDT XLSX structure and the Kalshi Developer Agreement wording are
the session's two blocked-with-reason items (both owner-action or
build-time reads). Values are dated snapshots; the venue/licence/
method findings are time-independent.
