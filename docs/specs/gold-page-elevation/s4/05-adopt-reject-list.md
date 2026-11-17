> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S4/05 — The Adopt/Reject List: the M5 decision table (input to S5's SWOT and S8's roadmap)

**Session:** S4 of the Gold Page Elevation program · **Date:**
2026-11-17 · **Branch:** `docs/gold-page-elevation`

**What this is:** the consolidated verdict table for every data source
and data-bearing candidate this session verified — the direct input to
S5's SWOT (the feasibility column) and S8's data-source mapping table.
Every row cites its evidence (S4/01–S4/04 sections). Verdicts:
**ADOPT / DEFER / REJECT**, each with the reason. One table per
feature family. Licence ladder per `docs/SOURCES.md`: L0 public domain
· L1 attribution-clean · L2 owner-accepted/attribution-required · L3
never-fetched.

---

## 1. The CB-demand family (F2 — D7)

| Candidate | Source | Licence | Cost | Update cadence | Cache strategy | Fetch-verified? | Verdict + reason |
|---|---|---|---|---|---|---|---|
| Monthly gold reserves by country (Tier-1) | IMF SDMX 3.0 — `IL/13.0.1/*.RGV_REVS.FTO` (188 countries, deep history) + `IRFCL/12.0.0/*.IRFCLDT1_IRFCL56V_FTO.*` (89 countries, fresher for some) — S4/04 §2d | **L1** (IMF, keyless) | 0 | monthly, T+1..2 (verified live to 2026-M10) | monthly rung gate; staleAfterDays 100 (repo convention); re-fetch trailing 3 months (revision tolerance); fail-closed band check (drop BRA/AGO outliers; exclude G163 aggregate from sums) | **YES** — planning machine + Worker egress; arithmetic reproduced (USA 8,133.5 t exact) | **ADOPT** — the Tier-1 backbone, cheaper and cleaner than any alternative (same venue as the production COFER adapter) |
| Quarterly demand stack (jewellery/tech/ETF/CB/bar&coin) | WGC GDT tables XLSX (login-gated, DU1) — S4/01 §1a | **L2-owner-accepted** (attribution "Source: World Gold Council — Gold Demand Trends"; terms verbatim in S4/01 §4) | 0 + owner drop minutes/quarter | quarterly (with the GDT report; Q3-2026 landed Nov 3) | **data-drop**: dated `data/wgc/` file → deterministic parse → fail-closed on shape; first-drop task = sheet/column mapping (blocked this session by design) | article numbers YES; XLSX gated (verified) | **ADOPT (Tier-2 via data-drop)** — D7's owner-accepted route; the only source of the full stack |
| Daily/weekly ETF holdings & flows | WGC `ETF_Flows_<date>.xlsx` (monthly XLSX; weekly website) — S4/01 §1 row 9 | L2-owner-accepted | 0 + drop | monthly XLSX ~1 week after month-end | same drop pipeline; a monthly card + the daily narrative references | file gated (verified); cadence verified | **ADOPT (rides the same drop; F9)** |
| India/China local premiums workbook | WGC `gold-premiums.xlsx` (weekly) | L2-owner-accepted | 0 + drop | weekly | same | gated verified | **DEFER** — the Shanghai premium card already covers the China leg (verified exact in S2 §7); add when the drop is routine and the card's demand is measured |
| AISC cost curves | Goldhub page (chart + gated methodology; Metals Focus Gold Mine Cost Service behind it) — S4/01 §1 row 12 | gated, no public XLSX path | — | quarterly | — | structure verified; **no data path** | **REJECT (no public data path)** — supply-cost story taught editorially (F4) without the series |
| Futures curves / open interest / trading volumes | Goldhub pages (CME COMEX basis) | gated | — | daily/weekly | — | pages verified | **REJECT (duplicate routes exist cleaner)** — CFTC CoT (L0) for positioning; EODHD (L2 owner plan) for the market legs |
| World official holdings table (curated) | WGC `World_official_gold_holdings_…_IFS.xlsx` — IFS-derived, gated | L2-owner-accepted | drop | monthly | — | gated verified | **REJECT as a dependency** — it re-publishes the same IMF data Tier-1 reads directly; cross-check link only |

## 2. The market-plumbing family (institutional stock/flow cards)

| Candidate | Source | Licence | Cost | Cadence | Cache strategy | Fetch-verified? | Verdict + reason |
|---|---|---|---|---|---|---|---|
| London vault gold/silver stock | `cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-<Month>.xlsx` — S4/02 §1b | free; posture L1-attribution ("Source: LBMA" + link) | 0 | monthly, T+1 (end-Oct 2026 live) | monthly fetch; staleAfterDays 75-100; 124-month series backfilled on day one | **YES** — downloaded, parsed, arithmetic exact (9,849.9 t / +0.293% / 28,889.2 t) | **ADOPT** — the free institutional-stock card (s1/12 §5's complement), Worker-egress 200 |
| London clearing volumes | `LBMA-Clearing-Data-<Month>.xlsx` — S4/02 §1c | free; L1-attribution | 0 | monthly | same; 360-month series | **YES** | **ADOPT (companion)** — the *flow* beside the *stock*; both verified, both zero-cost |
| LBMA Gold Price feed | website delayed print (midnight London); JSON host 403 both venues — S4/02 §1a + S4/04 §1 | **L3 (IBA usage licence)** | paid | 2× daily auctions | — | venue-blocked verified (both venues) | **REJECT as a data source** — gold-api/EODHD already serve the price family; the auction print stays a manual cross-check reference |
| Analyst forecast survey + accuracy retrospective | LBMA forecast-survey pages (public, data embedded) — S4/02 §1d | free; L1-attribution | 0 | annual + mid-year snapshot | annual dated entry (manual or page read); the 2010–2026 series extracted this session | **YES** (data extracted verbatim) | **ADOPT (Advanced tier, later phases)** — the honesty device: consensus missed gold by −2.1% mean / 8.1% mean-abs / −20.2% in 2025 |

## 3. The macro-freshness family (S3-D3 items)

| Candidate | Source | Licence | Cost | Cadence | Cache strategy | Fetch-verified? | Verdict + reason |
|---|---|---|---|---|---|---|---|
| Treasury.gov direct yields (nominal + real CSVs) | `home.treasury.gov/…daily-treasury-rates.csv/2026/all?…` (both curves) — S4/04 §2f | **public domain (US federal)** | 0 | daily (Nov 16 live at fetch; +2 trading days vs FRED Nov 12) | daily rung leg; FRED stays as fallback + cross-check; zero schema change | **YES** — both venues, values cross-check (5.12/2.92 = SA's exact reads; breakeven 2.20 ✓) | **ADOPT (the S8 switch decision)** — S3-D3a verified end-to-end |
| Kalshi Fed-probability module | `api.elections.kalshi.com/trade-api/v2` (markets + orderbook) — S4/04 §2g | display+attribution posture; Developer Agreement wording = one build-time read (429-blocked this session) | 0 (keyless public JSON) | continuous (orderbook live); card refresh 30 min | 30-min cache; event-close → next market roll | **YES** — both venues (236 open KXFED markets; Dec-2026 set closes 2026-12-09) | **ADOPT** — the licence-clean Fed-probability leg 1 |
| Polymarket Fed-probability module | `gamma-api.polymarket.com` — S4/04 §2g + §3 | ToS read: outside the prohibited classes for an informational, attributed display; conservative posture (display-only + link, no keys) | 0 | same | same (IP-based limits: gamma `/events` 500 req/10 s — no constraint) | **YES** — both venues; live values (0.915/0.052/0.0305) | **ADOPT** — leg 2 (venue diversification, the SA pattern) |
| CPI shutdown-gap policy | pipeline rule (no new source) — S4/04 §4 | n/a | 0 | monthly (fires only on a missing base month) | YoY computed at read time; stored levels stay pure | method reproduced (4.02%/2.77%) | **ADOPT the recommendation (S4-D1)** — the adjacent-months-average base, labelled at point of use |
| FRED family (existing) | `fred.stlouisfed.org` | public domain / citation-required | 0 | daily | unchanged (Node ingest venue) | carried (S2/S3 same-day); this session: planning-machine timeouts + Worker 520 (transient-or-blocked — re-check) | **KEEP (with the Treasury-direct swap as the S8 decision)** |

## 4. The Iran-bridge family (F3 — D6)

| Candidate | Source | Licence | Cost | Cadence | Cache strategy | Fetch-verified? | Verdict + reason |
|---|---|---|---|---|---|---|---|
| TGJU instrument board (live) | `call1.tgju.org/ajax.json` (the existing production scrape) — S4/03 §1a | L2-owner-accepted-by-practice ("Source: TGJU") | 0 | ~5-min snapshots (the existing cron) | existing KV snapshot; premium computed at read time from the same snapshot | **YES** — both venues (re-verified with 12:50 snapshot; 9 instruments + 5 حباب symbols + USD leg) | **ADOPT (D6, Bridge-1)** — the parity + premium card on the existing plane |
| The حباب (premium) series | Currena-computed (ounce × dollar × pure-content) — s1/11 §5 with S4's corrected specs | Currena's own derivation | 0 | per snapshot (daily close + intraday extrema) | forward accumulation from launch (s1/11 §6); backfill below | **YES** — the three-way convention divergence documented (7.88/8.08/5.99 M toman) | **ADOPT — the documented, reproducible premium is the differentiation claim** (S4/03 §1c) |
| Instrument specs (the premium's constants) | CBI `page/5953.aspx` primary (900-in-1000 verbatim; 8.136 g full coin) + gerami triangulated (1.01 g / 0.900 / ~0.909 g pure) — S4/04 §2b | primary source | 0 | static | constants in the spec table + the FA education copy | **YES** (CBI page + arithmetic triangulation; the CBI gerami press release WAF-blocked — one build-time pin of the 0.90–0.92 g band) | **ADOPT (with the documented band)** |
| Gold-symbol history backfill | TGJU profile pages (daily OHLC+volume tables, HTML) — S4/03 §1e | same L2 posture; terms sentence recorded verbatim | 0 | one-time + forward | one-time off-hours sequential parse; honest "reconstructed from source history" label | **YES** — 4 pages fetched 200; Worker-egress 200 | **ADOPT (route A; s1/11 §6)** |
| persianapi.com (TGJU's official API) | coin-price web service 14,000,000 ﷼/mo (~$5-6/mo at the free rate; Iranian payment rails) — S4/03 §1f | sanctioned commercial API | 14M ﷼/mo | continuous | — | pricing verified live | **DEFER (route B fallback)** — the escalation path if the scrape is ever blocked (the Path-B pattern) |
| News-chain cross-check (Union rates) | eghtesadonline + tejaratnews daily articles — S4/03 §2 | editorial press | 0 | daily | n/a (context only) | **YES** (0.3% Union-vs-TGJU venue spread documented) | **ADOPT as the card's convention-chaos context; REJECT as a data source** |

## 5. The chart/TA family (F7/F8 — D8) and the multi-currency grid (F10)

| Candidate | Source | Licence | Cost | Cadence | Cache strategy | Fetch-verified? | Verdict + reason |
|---|---|---|---|---|---|---|---|
| XAUUSD daily OHLC | EODHD `XAUUSD.FOREX` — S4/04 §5 row 17 | L2 (EODHD; owner plan in production) | owner plan | daily EOD | existing rung | **YES** — 360 rows to Nov 16 with the session key (3,862.84 = S2's verified close); free-tier key = 1-year depth (watermark quoted) | **ADOPT (existing)** — SMA20-200 + pivots fit inside 1 year; the 10-year decile rides `percentile10y` server-side (S2 §5c's build note) or the owner plan's full history |
| XAU-crosses (EUR/JPY/GBP/CNY/AUD/CHF) | EODHD `XAU<CCY>.FOREX` | L2 | owner plan | daily | daily rung | **PARTIAL** — XAUEUR/XAUAUD on the free key (stale demo rows); XAUJPY/GBP/CNY/CHF not found on it; **S1/09 verified the owner's key serves XAUEUR current** | **ADOPT on the owner plan (F10)** — the KGX-lesson grid (S4/02 §2b); free-key degradation documented for the record |
| Long-run series 1971→ (F6 episodes) | WGC prices workbook (gold price averages in a range of currencies **since 1978**, gated = the same data-drop) + FRED `GOLDAMGBD228NLBM` (discontinued 2021, public domain — unverified this session: FRED venue down) | L2-owner-accepted + L0 | 0 + drop | one-time backfill + annual refresh | one-time; the episode dates + monthly averages | gated verified; FRED deferred-with-reason | **ADOPT via the prices-workbook drop** (F6's data problem solved at zero marginal cost); FRED supplement at build time |

## 6. The pattern-only family (no data, adopt the design)

| Candidate | Source | What is adopted | Fetch-verified? | Verdict |
|---|---|---|---|---|
| 5-driver "What Moves the Gold Price" explainer (F4) | Kitco `/charts/gold` (S4/02 §2a — five drivers quoted verbatim) | the copy architecture: each driver one short paragraph, mechanism-first, closing at the page's own gauges | **YES** | **ADOPT the pattern** |
| KGX dollar-stripped concept (F10 copy + bridge education) | Kitco KGX page (S4/02 §2b — methodology + the 4 scenarios + the multi-currency validation sentence) | the validation sentence as the F10/bridge education line; the computed version from Currena's own crosses | **YES** | **ADOPT the concept** |
| Unit-aware quote header | Kitco header (S4/02 §2c — bid/ask + oz/gram/kilo/pennyweight/tola/tael + day range + 15y change ladder + series definition disclosed) | the header spec for the F7 chart + the toman/gram dual-unit presentation for the bridge | **YES** | **ADOPT the pattern** |
| TE daily narrative (F1) | TE `/commodity/gold` (S4/02 §3 — the verbatim narrative: move + 1-month + 1-year context, series convention disclosed) | the narrative skeleton for F1's daily band | **YES** | **ADOPT the pattern** |
| TE forecast-as-headline | same page (S4/02 §3 — "Trading Economics global macro models" verbatim) | **the anti-pattern rule**: no forecast numbers without a published, attributable, measured methodology (F1/F15's binding constraint) | **YES** | **REJECT the anti-pattern (binding rule recorded)** |
| Kitco/TE/Investing data as a source | their terms (anti-scraping clauses — S4/02 §2e) | nothing (widgets are their sanctioned embed, not data) | **YES** (terms read) | **REJECT the bytes** |
| GRAM 5-bucket attribution narrative (F1 structure) | WGC GRAM page (S4/01 §2 — buckets + the lane mapping) | the driver-family structure of the daily narrative, with the no-fake-attribution honesty rule | **YES** | **ADOPT the template** |

---

## 7. The summary ledger (for S5/S8)

- **ADOPT (data):** IMF IL/IRFCL monthly gold reserves · WGC GDT stack +
  ETF flows + prices workbook (the one data-drop, L2-owner-accepted) ·
  LBMA vault + clearing (free) · LBMA forecast retrospective (Advanced,
  later) · Treasury.gov direct yields (S8 switch) · Kalshi + Polymarket
  (the Fed-probability module) · TGJU instruments/premium/backfill ·
  CBI spec constants · EODHD XAUUSD (existing) + XAU-crosses (owner
  plan) · the CPI gap policy (S4-D1).
- **DEFER:** WGC premiums workbook · persianapi route B.
- **REJECT (with reasons on record):** WGC AISC (no public data path) ·
  WGC futures/OI/volumes (duplicate cleaner routes) · LBMA price feed
  (L3 + venue-blocked + IBA licence) · WGC world-holdings table (a
  re-publish of Tier-1's own source) · news chains as a data source ·
  Kitco/TE bytes (anti-scraping terms) · the forecast-as-headline
  pattern (binding anti-pattern rule).
- **Zero new paid feeds anywhere in the program's adopt set.** The two
  decided features (D6/D7/D8) close their data needs with: one
  already-licensed L1 API (IMF), one owner-accepted data-drop (WGC),
  two free institutional XLSX files (LBMA), two keyless prediction
  APIs, the existing TGJU/EODHD planes, and one public-domain CSV swap
  (Treasury). The deferred/back-up paths are the only cost-bearing
  rows (persianapi 14M ﷼/mo; an eventual EODHD plan bump).

**This table is S5's feasibility input and S8's data-source mapping
table's content — cite, do not re-litigate.**
