> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S8/02 — The Data-Source Mapping Table (M2)

**Session:** S8 of the Gold Page Elevation program (Phase C) · **Date:**
2026-11-17 · **Branch:** `docs/gold-page-elevation`

**What this is:** one row per data source the P1–P4 roadmap touches —
existing and new — with licence level, cost, update cadence, the cache/
ingest strategy, the attribution wording (C6's binding table, `s6/02`),
and the fetch-verified status (s4/04). The two pending build-time reads
appear as **gated rows** with their fallback bands. The zero-new-paid-feeds
property (s4/05 §7) is re-verified in §3. Companion docs:
`s8/01-RECOMMENDATION-TABLE.md` (the rows that consume these sources) and
`s8/03-CPC-BRIEF-AND-DECISIONS.md` (the owner decisions).

**The licence ladder** (per `docs/SOURCES.md`, as used in s4/05): L0 public
domain · L1 attribution-clean · L2 owner-accepted / attribution-required ·
L3 never-fetched.

---

## 1. The sources in the roadmap (existing + new)

### 1a. Existing sources the roadmap builds on (no new ingest)

| # | Source (roadmap rows served) | Licence | Cost | Cadence | Cache / ingest strategy | Attribution (C6) | Fetch-verified (s4/04) |
|---|---|---|---|---|---|---|---|
| 1 | **TGJU ajax feed** — `call1.tgju.org/ajax.json` (R13 board, R30 forward accumulation) | L2-owner-accepted-by-practice | 0 | ~5-min snapshots | the existing production scrape → KV snapshot; the premium computed at read time from the SAME snapshot (no cross-source skew, S2 §5a) | "Source: TGJU" + link per block; the revision caveat; the terms sentence recorded repo-side, not user-facing | **YES** — both venues, re-verified at the 12:50 snapshot (9 instruments + 5 حباب symbols + USD leg) |
| 2 | **gold-api** live prices (the gold/silver/btc/platinum/copper family; R33's inputs) | existing production source | 0 | hourly (`:13` rung) | existing | the existing per-card discipline | carried (S2 §7 verified) |
| 3 | **EODHD XAUUSD.FOREX** daily OHLC (R18 chart, R19 TA, R22 companion's gold leg) | L2 (EODHD terms; **owner plan in production**) | owner plan (no new cost) | daily EOD | the markets worker's existing EODHD client + a new series registration (`s8/01` R18's adapter naming); one-time 10y fetch at build + daily appends, or server-side `percentile10y` | the series named at point of use ("XAUUSD daily closes, EODHD" — C1/C5) | **YES** — 360 rows to Nov 16; close 3,862.84 = S2's verified value; free-tier 1-yr depth noted |
| 4 | **EODHD XAU-crosses** (R26 grid) | L2 | owner plan | daily | daily rung | the KGX validation sentence names the crosses (C1) | **PARTIAL** on the free key; the owner plan = S1/09-verified |
| 5 | **FRED** (the macro mirror family; the CPI levels; the term-premium ACM series; fallback for yields after R07) | public domain / citation-required | 0 | daily | unchanged (the Node ingest venue — the production design); **becomes fallback + cross-check leg** after the Treasury switch | the existing per-card source discipline | carried (S2/S3 same-day verified); this session's venue note (transient timeouts + a 520 from Worker egress) = **re-check at build time** |
| 6 | **CFTC weekly CoT** (R03's cards, R27's bands) | L0 | 0 | weekly (Saturday gate) | existing rung; the bands are `percentile10y` derivations over the stored series | the existing; the convention named at point of use (the S3-D3d decision) | carried (S2 §7: CFTC to 2 decimals); **the Nov-10 pipeline miss = the operational P0 owned by the modularization-closeout window (S2-D4) — outside this roadmap** |
| 7 | **The in-repo calendar feed** — `data/insights-calendar.json` (R29) | in-repo (existing) | 0 | the feed's cadence | the existing "Next up" strip's feed; zero new fetches | the timezone named at point of use (GPE-S3-10) | existing repo surface (AGENTS.md §E) |
| 8 | **The readings archive** (R31 time machine; the 2016+ episodes' citations) | in-repo (existing) | 0 | on-demand | the post-modularization API surface (the sizing decision, `s8/03` D7) | the meter's own governance versioning | existing (the backtest corpus of record) |
| 9 | **The S&P/BTC/silver series** (R33's comparison legs) | in-repo (world board + live prices) | 0 | daily | existing | the existing | carried |

### 1b. New sources the roadmap adopts

| # | Source (roadmap rows served) | Licence | Cost | Cadence | Cache / ingest strategy | Attribution (C6) | Fetch-verified (s4/04) |
|---|---|---|---|---|---|---|---|
| 10 | **IMF SDMX 3.0 — IL `RGV_REVS`** (R14 Tier-1 primary: 188 countries, USA history to 1956) | **L1** (IMF, keyless) | 0 | monthly, T+1..2 (verified live to 2026-M10) | monthly rung gate; staleAfterDays 100 (repo convention); revision-tolerant re-fetch of the trailing 3 months; **the S4-D4 fail-closed rules**: value-band check (≤350 M ozt/country drops the BRA/AGO broken rows), G163 euro-area aggregate excluded from sums, the "reported-world" total (86 reporters, 31,365 t) labelled as such | "Source: IMF (monthly reserves)" + the WGC cross-reference link + the revision caveat («داده‌های ماهانه بازنگری می‌شود») | **YES** — both venues; USA 8,133.5 t exact |
| 11 | **IMF SDMX 3.0 — IRFCL `IRFCL56V_FTO`** (R14's complement: 89 countries, fresher for some reporters) | **L1** | 0 | monthly | same rung; the per-country merge or complement per the S4-D4 adapter spec (tonnes = ozt × 31.1034768/1e6) | same | **YES** — both venues |
| 12 | **WGC GDT quarterly stack XLSX** (R15) | **L2-owner-accepted** (attribution verbatim; D7's posture) | 0 + the owner's drop minutes/quarter | quarterly (with the GDT report; Q3-2026 landed Nov 3) | **the data-drop** (S4-D2, binding): the owner downloads on release day → dated `data/wgc/<YYYY>-Qn>-<dataset>/<file-as-published>.xlsx` → deterministic parse → fail-closed on shape; **the first-drop task = the sheet/column mapping** (S4/01 §1a, blocked by design until the first file) | **"Source: World Gold Council — Gold Demand Trends"** + link on every rendered number/chart; the terms page linked in the licence footer; raw XLSX never re-hosted in public assets | article numbers YES; XLSX gated (verified) |
| 13 | **WGC `ETF_Flows_<date>.xlsx`** (R23) | L2-owner-accepted | 0 + drop | monthly XLSX (~1 week after month-end) | same drop pipeline | same family wording | cadence verified; file gated |
| 14 | **WGC prices workbook** (currency averages since 1978; R25's spine) | L2-owner-accepted | 0 + drop (one-time + annual refresh) | the drop calendar (`s4/01 §5`) | one-time backfill + annual refresh; pre-1978 episodes ride documented public-history values sourced per record | "Source: World Gold Council" per C6 | gated-verified |
| 15 | **LBMA London vault XLSX** — `cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-<Month>.xlsx` (R24) | free; **L1-attribution posture** | 0 | monthly, T+1 (end-Oct 2026 live) | monthly fetch; staleAfterDays 75–100; the 124-month series backfilled on day one | **"Source: LBMA"** + link + the four-field disclosure block (length/frequency, update schedule, units, methodology) | **YES** — both venues; downloaded + parsed; arithmetic exact (9,849.9 t / +0.293% / 28,889.2 t) |
| 16 | **LBMA clearing XLSX** (R24 companion) | free; L1-attribution | 0 | monthly | same; the 360-month series | same | **YES** — parsed |
| 17 | **LBMA forecast-survey pages** (R32) | free; L1-attribution | 0 | annual + mid-year snapshot | annual dated entry (manual or page read); the 2010–2026 series already extracted (S4/02 §1d) | "Source: LBMA" | **YES** (data extracted verbatim) |
| 18 | **Treasury.gov daily yield CSVs** — nominal (14 maturities) + real (5/7/10/20/30 Yr) (R07; R12's and R22's legs) | **US federal public domain** | 0 | daily (Nov 16 live at fetch; **+2 trading days vs FRED's Nov 12**) | the daily rung leg swaps venue; **FRED stays fallback + cross-check** (single-mirror exposure mitigated); year-scoped URL pattern (the full-history variant 403s — recorded); zero schema change | the existing per-card source discipline (the ingest leg changes, not the user-facing line) | **YES** — both venues; values cross-check (5.12/2.92 = SA's exact reads; breakeven 2.20 ✓) |
| 19 | **Kalshi trade API v2** — `api.elections.kalshi.com` (R28 leg 1) | keyless public JSON; **display+attribution posture — see the gated row §2a** | 0 | continuous (orderbook); the card refreshes every 30 min | 30-min cache; event-close → the next market rolls | both venues named + the disclaimer («این انتظار معامله‌گرهاست، نه پیش‌بینی ما» / "market-implied probabilities — the traders' expectation, not ours") + links | **YES** — both venues (236 open KXFED markets; the Dec-2026 set closes 2026-12-09) |
| 20 | **Polymarket gamma API** — `gamma-api.polymarket.com` (R28 leg 2) | keyless; **ToS read** (S4/04 §3: outside the prohibited classes for an informational, attributed display) | 0 | same | same (the IP limits are ~5 orders of magnitude above a 30-min refresh) | same (venue diversification) | **YES** — both venues (0.915/0.052/0.0305 live) |
| 21 | **TGJU profile-history pages** — `www.tgju.org` profile tables (R30's backfill) | L2-owner-accepted-by-practice (the terms sentence recorded verbatim: copying requires written consent — the owner's production posture, not re-litigated) | 0 | one-time + forward | one-time off-hours sequential parse (4 pages served 200 in ~1.5–2.3 s each); forward accumulation from R13's launch; the honest labels: "reconstructed from source history" vs "computed live from our snapshots" | "Source: TGJU" + the revision caveat | **YES** — both venues |
| 22 | **CBI mint-spec pages** (R13's constants) | primary source | 0 | static | the constants table in `domains/gold/coin-premium.ts`; **see the gated row §2b** | the CBI-primary figure documented with the widely-published variant (8.136 g vs 8.133 g — 0.04% apart) | **YES** (page 5953 fetched 200; the gerami press release WAF-blocked — the pin pending) |

### 1c. Deferred / fallback sources (in the record, NOT in the queue)

| # | Source | Status | Cost | Note |
|---|---|---|---|---|
| 23 | **persianapi.com** (TGJU's official API — the sanctioned route B) | **DEFER** — the escalation path if the scrape is ever blocked (the Path-B pattern) | **14,000,000 ﷼/mo (~$5–6/mo at the free rate)** | the only cost-bearing row anywhere in the program's adopt set; pricing verified live (S4/03 §1f) |
| 24 | **WGC premiums workbook** (the India/China local premiums) | **DEFER** — P4-conditional (`s8/01` §6 D-b) | 0 + drop | revisit after 2–3 routine quarterly drops + F9's demand signal; the licence wall names the India premium's absence until then |
| 25 | **FRED `GOLDAMGBD228NLBM`** (the long-run supplement, discontinued 2021) | deferred-with-reason (S4/04 §5 row 19) | 0 | the FRED supplement re-checks at build time; the prices-workbook drop carries F6 regardless |

---

## 2. The gated rows (the two pending build-time reads, with fallback bands)

### 2a. The Kalshi Developer-Agreement wording (R28's Kalshi leg)

- **What is gated:** the agreement's exact data-reuse wording
  (kalshi.com/developer-agreement — the site rate-limited this
  environment, 429 on every page; docs.kalshi.com is readable and states
  the API is used subject to it). One one-page fetch from a normal
  browser session. **[default: the first implementation session reads it
  — S5-D4/S6-D8]**
- **The fallback band (what ships if the read never happens or is
  ambiguous):** the **conservative informational-display posture stands**
  — display-only + attribution + link to the markets + no key'd
  endpoints + no bulk redistribution (S4/04 §3's reading: the prohibited
  classes are capital-market clients and market-data distributors; an
  informational, attributed card sits outside the named prohibitions —
  the same keyless-public-JSON read the competitor performs today).
- **The worst case, pre-committed:** if the wording read reveals a
  restriction on informational display, **the Kalshi leg drops** and the
  card renders Polymarket + the calendar strip (R29) — the venue-
  diversification design absorbs the loss; nothing else in the roadmap
  depends on the Kalshi leg.
- **Where the gate binds:** R28 only (P3). The read itself is a 5-minute
  task scheduled into the first Phase-D session regardless of R28's
  wave.

### 2b. The CBI gerami press-release pin (R13's gerami constant)

- **What is gated:** the exact minted figure for the gerami coin
  (cbi.ir's coin pages are WAF-blocked from this environment — «درخواست
  رد شد» on every /coin/ path). The 1.000-vs-1.0149 g question was a
  false binary, resolved by triangulation (S4/04 §2b): the gerami is the
  1/8-Bahar size — ~1.01 g total, 900 fineness, ~0.909 g pure — with the
  market arithmetic corroborating (TGJU's own حباب symbol and
  eghtesadonline's print both imply ~0.90 g pure at the same-snapshot
  melt). **[default: the first implementation session pins it — the
  owner's browser or a different egress; S5-D4/S6-D8]**
- **The fallback band (what ships if the pin never resolves):** the
  recorded band **0.90–0.92 g pure** in the constants table, documented
  on the card's method block (C2 rule 1). Within the band the premium
  ladder stays monotone and sensible (full +3.3% < half +8.5% < quarter
  +18.1% ≈ gerami +18.6% ± ~1 pp); the two candidate readings
  (1.01 g/0.900 → 0.909 g pure; 1.0149 g/0.900 → 0.9134 g pure) both sit
  inside it. The 999.9-fineness reading (s1/11's original error) is
  falsified by the market arithmetic and is not in the band.
- **Where the gate binds:** R13's gerami row only (P1-b). The bridge
  ships with the band documented; the pin tightens one constant. The
  S4-D3b correction (the recomputed ladder) is not affected by the pin's
  outcome.

---

## 3. The zero-new-paid-feeds verification (s4/05 §7, re-checked)

**The property still holds.** Every P1–P4 row's data path, walked against
§1:

- **P1:** the TGJU snapshot plane (existing, §1-1) · FRED/Treasury
  (public domain, §1-5/§1-18) · IMF IL/IRFCL (keyless L1, §1-10/11) ·
  the WGC GDT drop (0 + the owner's minutes, §1-12) · the CBI constants
  (primary source, §1-22) — **zero monetary cost.**
- **P2:** the EODHD XAUUSD leg (the owner plan already in production,
  §1-3; the free-tier depth note affects only the decile basis, absorbed
  by the one-time 10y fetch on the existing plan or the server-side
  `percentile10y` pattern) — **zero new monetary cost.**
- **P3:** the WGC ETF/prices drops (0 + minutes, §1-13/14) · LBMA XLSX ×2
  + the survey (free, §1-15/16/17) · the XAU-crosses (owner plan,
  §1-4) · Kalshi/Polymarket (keyless, §1-19/20) · the calendar feed
  (in-repo, §1-7) · the TGJU backfill (free, §1-21) — **zero monetary
  cost.**
- **P4:** the readings archive + the in-repo series (§1-8/9) — **zero.**

The only cost-bearing rows in the entire map are **outside the queue**:
persianapi (§1c-23, the deferred route-B escalation) and a hypothetical
EODHD plan bump (not required by any queued row — the decile basis and
the crosses ride the existing owner plan). The WGC data-drop costs the
owner **minutes per release day** (quarterly GDT + monthly ETF + the
annual prices refresh), which is a workflow cost, not a feed cost — the
binding trade-off recorded when S4-D2 chose the drop over
authenticated-session (no stored credentials; auditability; the terms
posture).

**The single-mirror exposure note (T5, mitigated twice in this map):**
the yield family's FRED-only exposure is closed by R07 (Treasury primary
+ FRED fallback/cross-check — two independent public-domain venues); the
Fed-probability card is two-venue by design (Kalshi + Polymarket) with
the pre-committed worst case §2a.

## 4. Method and limitations

Every row is assembled from the verified S4 evidence (s4/04 §1 the venue
map, §2 the mandatory items, §5 the 23-row reality check; s4/05 the
verdict tables) and the binding copy rules (s6/02 C6), with the S2/S3
same-day cross-checks carried. Nothing was fetched this session (S8 is a
sequencing session; the venue states are the S4 record's, dated
2026-11-17 — the FRED transient note is explicitly a build-time re-check
item). Limitations: (1) cadences are the providers' observed rhythms on
the record date; (2) the WGC rows' "gated-by-design" files have verified
walls and calendars but their XLSX structures are first-drop tasks (the
parse specs land with the first files); (3) the gated rows' fallback
bands are pre-committed so no Phase-D session blocks on either read.
