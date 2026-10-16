# FIX_REPORT — INSIGHTS_FIX_SPEC implementation

Report date: 15 October 2026 (all times UTC).
Scope: https://currena.ir/#/insights (the Insights page; world markets and
world currencies sections untouched except where the spec names them).
Commits: `2dd2eae` (Part A+B), `7471622` (Part C), `4738263` (Part D),
`04d36bc` (T-08 venue fix), `7a43a72` (bundle budget), `aeb701d` (B-19
episode-aware). All pushed to `main`; CI green
(https://github.com/assadigit/Currena/actions/runs/38665500642).

---

## 1. Checklist — every item, with how it was checked

### Part A: Foundation

| ID | Status | How checked |
|---|---|---|
| A-01 Single indicator registry | **done** | `data/indicators.json` (51 entries) is generated from the code's sources of truth by `scripts/generate-indicators-registry.ts` and pinned in CI by `apps/web/src/lib/registry-sync.test.ts` (title, area, source+link, series, unit, cadence, max age, scored flag, history window, rule, rule version). No card has numbers or conclusions typed into code — the `meaning` maps were deleted (A-02). |
| A-02 Generated text only | **done** | The needs-attention line is interpolated from the reading's own rule and value (`attentionLineOf` in `bands.ts`); consequence lines are state-keyed templates picked from the reading's percentile band and 30-day direction. T-06 runs on every refresh and in CI. |
| A-03 Validation suite on every refresh | **done** | The ingest builds a draft snapshot, runs T-01…T-14, then rebuilds the published snapshot with the flags. Live GHA runs 2026-10-15 show all 14 tests executed and their results written into `insights:status`. `scripts/safety-demo.ts` proves a deliberately broken input is caught (below). |
| A-04 Safe failure | **done** | A flagged reading holds its last good value as `check-pending` with the reason; a missing series holds `stale` with its original date. Proven by: the sandbox dry-run (7 RBA sources blocked → the run refuses to publish, `FATAL: P1 indicators unavailable`), the operator demo (`pnpm --filter @currena/insights safety-demo` — ALL CHECKS PASS), and unit tests. |
| A-05 Daily snapshot archive | **done** | One dated KV key per day (`insights:archive:v1:<date>`), skipped when already written. Verified live: `GET /api/insights/archive/2026-10-15` returns today's exact published snapshot (51 readings, ruleVersion 2). |
| A-06 Context notes (off by default) | **done** | `data/insights-context-notes.json` is absent (nothing shows). The loader validates author/expiry dates and `buildInsightsSnapshot` drops expired notes before they reach the page — pinned by the A-06 unit test (an expired note is not shown; no note by default). |
| A-07 Rule versions | **done** | `RULE_VERSION = 2` with a change log (`ruleVersion.ts`); every reading's details show the rule text and version line; the registry carries `ruleVersion` per entry and CI pins it. |
| A-08 Status page | **done** | `GET /api/insights/status` serves the snapshot time with time zone, per-source pass/fail, validation results, stale cards; the "About this data" panel renders it. Live: `failed sources: none`, 14 tests OK. The failed-source surface was exercised by the sandbox run's RBA 403s (the same code path the unit tests pin). |

### Part B: Fixes

| ID | Status | How checked |
|---|---|---|
| B-01 Peaks for BTC/gold/silver/Brent | **done** | Every peak now computed from the full stored history on one stated basis. Live values: gold **−25.8 %** from the record **5,586.20 on 2026-01-29 (daily high)**; silver **−53.6 %** from **121.30 on 2026-01-29 (daily high)**; Bitcoin **−35.3 %** from **126,198.07 on 2025-10-06 (daily high)**; Brent **−24.3 %** from the **138.21 close on 2026-04-07** (close basis only — intraday never mixed in). T-05 passes in the live run. |
| B-02 M2 "+0.00%" | **done** | T-08 detects an exactly-repeated monthly print and the card goes `check-pending` holding the last good value; the relationship cards treat a flagged leg as unreadable. The +0.00% instance in the audit is not in the current KV (current change +0.54 %); the mechanism is proven by the safety demo (duplicate M2 print flagged, fake date never published). |
| B-03 Dollar alarm vs hero | **done** | The dollar-basket rule is now any-of: 10-year percentile OR a 30-day rise ≥ 3 % (the world-currencies alarm threshold, unrounded ≥, engine-pinned by tests). The hero reads the same reading. Today the 30-day move is +2.74 % → both surfaces say Normal — consistent for the same number. At the audit's +3.10 % the rule fires needs-attention. |
| B-04 Relationship cards | **done** | Connections rewritten as explicit per-leg rules (direction over a window with a minimum move); oil checks 30/90-day windows; the RBA card shows "pass-through pending" until the loan data exists; the US-money-supply leg was removed from the copper/growth card; the iron-ore card carries the US-dollar context leg. T-12 forbids "Active" with an unmet leg — passes live. |
| B-05 US prices card dates | **done** | The card shows the data month and its real release date; the September reading now carries `released 2026-10-14` (matching the calendar); "next release: today" is implemented for due-but-not-in data. |
| B-06 Decided/effective dates | **done** | `data/policy-decisions.json` (Fed decided 2026-09-16 / effective 09-17; ECB decided 09-10 / effective 09-16; RBA decided 09-29). Live: the Fed card reads "decided 2026-09-16", the ECB card "decided 2026-09-10". |
| B-07 Quarter labels | **done** | Quarterly series label by quarter name and period end ("June quarter 2026") via `quarterPeriodText`; no quarterly series shows a bare month name. |
| B-08 Time zone | **done** | "Prices updated" carries UTC; details show UTC. |
| B-09 Stale/delayed tags | **done** | Registry max ages (daily 4 / weekly 10 / monthly 45 / quarterly 120 + documented per-series overrides, e.g. RBA F2 yields are weekly because the table lags 2–4 business days). The audit's named cases were checked: AU 10-year (dated 07 Oct) is inside its weekly grace (10 days) — correctly not stale; US 10y/real yields dated 13 Oct — fresh; FTSE lives on the markets panel whose staleness marker (`reStaleMarketsSnapshot`) re-checks age at serve time. T-04 enforces every card. |
| B-10 Mixed dates in the AU–US gap | **done** | Gaps compute from same-date values only; both dates show and the card marks "dates differ" when they do not match. |
| B-11 Source on every card | **done** | Every details panel shows the source name, a link and the data date; T-13 enforces it and the registry test pins source+link per id. |
| B-12 Inflation expectations twice | **done** | The gold card's expectations condition reads the breakeven indicator's scored status everywhere. |
| B-13 Which series the expectations card uses | **done — no change needed** | Confirmed live against FRED: the card fetches **T5YIFR = 2.33** (13 Oct) and the label "five to ten years ahead" is accurate for the 5y5y forward. The value coincidentally equals the 10-year breakeven that day (5.24 − 2.91 = 2.33) — a coincidence, not a wrong series. Recorded here as the spec asked. |
| B-14 Hero counts | **done** | Oil is scored and sits in the prices-heat gauge (37 voters now); every count — hero, area, summary — derives from the same gauge membership; the prices subtitle now says oil is scored. T-09 passes live. Live counts: global 6/23, Australia 6/14 — hero equals the sum of the areas. |
| B-15 Copper/gold ratio | **done** | The card labels the value as a monthly average ("This is a monthly average, not a live price") — the label option, chosen because the ratio's history is monthly. |
| B-16 Silver per Bitcoin | **done** | Ratios compute from the same displayed prices in the PricesBoard, and the merge keeps 6-decimal precision. |
| B-17 Percent changes on rates | **done** | The money panel's rate rows show percentage points (deltaKind from the series' changeKind); % stays only on prices/indexes. |
| B-18 Real return on savings | **done** | The savings row shows "term deposit − inflation" (+0.8 pts today), labelled before tax, worded as a condition. |
| B-19 "Highest since [year]" | **done** | Long-history search on the full fetched series, episode-aware (the trailing ±2 % cluster — the current move itself — is skipped, so a reading just under its own recent high does not claim "this year"). Live: US 10-year at 5.21 % reads **"highest since 2007"** (the last independent time this level was reached, per FRED's own history); the ~5.3 % touch of early October reads "highest since 2002" (the audit's reference — unit-pinned); US 30-year at 5.56 % reads "highest since 2004". Where the level was also reached within the reading's own year outside the episode, no claim is shown (honest). |

### Part C: Additions

| ID | Status | How checked |
|---|---|---|
| C-01 RBA cash rate card | **done** | Context card live at **4.60 %**, decided 2026-09-29, next decision 3 Nov 2026 on the calendar. |
| C-02 Iron ore card | **done** | Context card (World Bank Pink Sheet, monthly) at 97.7; the iron-ore relationship card reads from it. |
| C-03 What markets expect from the Fed | **done** | New scored card: 2-year yield − policy rate = **+1.04 pts** (13 Oct), status warning (91st percentile) — series DGS2 and DFEDTARL verified live on FRED. |
| C-04 US 30-year yield | **done** | New scored card: **5.56 %** (13 Oct), warning, "highest since 2004" (DGS30 verified live). |
| C-05 One free US activity survey | **done** | Philadelphia Fed manufacturing index (GACDFSA066MSFRBPHI, verified live): **37.8** (Sep), normal — scored on threshold below 0. |
| C-06 What markets expect from the RBA | **done** | New scored card: 3-year bond yield − cash rate = **+0.33 pts** (07 Oct), normal — series FCMYGBAG3D confirmed from the RBA F2 CSV's own Series ID row. |
| C-07 Calendar | **done** | ECB decision **29 Oct 2026** added (decision day, `ecb` kind, links to the ECB card); RBA **3 Nov** and the US jobs report already present; every event stores its own IANA time zone and dates are never converted through UTC. |

### Part D: Validation tests

All 14 (T-01 … T-14) run on every refresh after the fetch and before
anything is published, and their results are written to
`insights:status` (visible at `/api/insights/status`). The latest live
run (2026-10-15T01:39:48Z): **all 14 pass**.

| ID | Status | One-line proof |
|---|---|---|
| T-01 | **done** | real 2.88 + breakeven 2.33 ≈ nominal 5.21 within 0.05 (live pass) |
| T-02 | **done** | ratios recomputed from displayed inputs (live pass) |
| T-03 | **done** | no future dates, no weekend trading dates (live pass) |
| T-04 | **done** | every card within max age or tagged (live pass) |
| T-05 | **done** | floors 126,000 / 5,300 / 89 / 127 all confirmed with two sources each before hardcoding; peaks 126,198 / 5,586.20 / 121.30 / 138.21 pass (live) |
| T-06 | **done** | no easing text on a rising value (live pass) |
| T-07 | **done** | the copy corpus (en+fa) is scanned in CI and on every run; two real violations found and fixed (VIX "expected to"; Bitcoin "should hold") |
| T-08 | **done** | duplicate/zero-change detection; administrative rate series (policy targets, monthly average rates) exempted with recorded venue evidence |
| T-09 | **done** | hero = sum of areas, scored only (live pass) |
| T-10 | **done** | points for rates/inflation/yields/unemployment, % only for prices/indexes (live pass) |
| T-11 | **done** | one status per indicator everywhere (live pass) |
| T-12 | **done** | no "Active" with an unmet leg (live pass) |
| T-13 | **done** | every card has a source and a data date (live pass) |
| T-14 | **done** | `fixtures/regression-episodes.json` — 11 saved cases from the real COVID-2020 and inflation-2022 episodes, replayed on every run and in CI |

---

## 2. Every number changed, and why

| Number | Before | After | Why |
|---|---|---|---|
| Gold "below peak" | −17.5 % (implied peak ≈ $5,000) | **−25.8 %**, record **$5,586.20 on 28/29 Jan 2026** | The peak was computed from a short accumulated window; now from 10 years of Yahoo daily highs (basis stated on the card). |
| Silver "below peak" | −36.3 % (implied peak ≈ $92) | **−53.6 %**, record **$121.30 on 2026-01-29 (daily high)** | Same fix; the audit's suspicion ("the real gap is larger") confirmed. |
| Bitcoin "below peak" | −0.5 % (peak $83,768) | **−35.3 %**, record **$126,198.07 on 2025-10-06 (daily high)** | The old peak came from the accumulated-daily window; now from the 10-year daily-high series. |
| Brent "below peak" | −23.6 % (implied $139 — an intraday number mixed with closes) | **−24.3 %**, record **$138.21 close on 2026-04-07** | One basis only (daily close, EIA spot ∪ BZ=F gap-fill); intraday is never mixed in. The record is the provider's own data. |
| US 10-year context | "decade high" | **"highest since 2007"** at 5.21 % (the ~5.3 % touch reads "since 2002") | Full-history search; a 10-year window cannot say 2002. Episode-aware: the reading names the last independent year the level was reached. |
| US 30-year context | (new card) | 5.56 %, **"highest since 2004"** | C-04 + B-19. |
| Fed "last change" | 17 Sep (the effective date) | **decided 16 Sep · effective 17 Sep** | The data source stamps the effective date; the decision date comes from the hand-verified decisions file. |
| ECB "last change" | 16 Sep | **decided 10 Sep · effective 16 Sep** | Same. |
| RBA "last change" | (effective 30 Sep) | **decided 29 Sep** | Same. |
| US CPI release date | "released Oct 14" stamped on August data | September data, **released 2026-10-14** — matches the calendar | The release date now comes from the release schedule for the data's own period. |
| Hero counts | "4 of 19 indicators need attention" but areas totalled 3 | global **6/23**, Australia **6/14** (37 scored voters) | One list: gauge membership (oil scored and counted; the four new cards vote). |
| Silver per Bitcoin | 1,429 oz vs 1,425 from the displayed prices | computed from the same displayed prices, 6-dp precision | Ratios derive from one snapshot. |
| Copper/gold | 3.35 shown next to live prices implying 3.55 | 3.35 **labelled a monthly average** | The label option (B-15). |
| M2 change | "+0.00% since previous release" | current change +0.54 %; a zero-change print now holds as check-pending | T-08 duplicate detection (the +0.00% instance was a stale-KV artefact of the audit day; the mechanism is proven by the demo). |
| Dollar basket rule | percentile only (alarm said 3.1 % = watching) | any-of: percentile **or ≥ 3 % rise over 4 weeks** (unrounded, ≥) | B-03 — the same comparison everywhere. Today's +2.74 % is below the threshold → Normal on both surfaces. |
| VIX card text | "swings are expected to be" | "priced into one-month options" | The forbidden-words rule (T-07). |
| Bitcoin card text | "no 10-year position here" | 10-year position and record peak shown | B-01 made the history exist. |

## 3. Not verified (and what would be needed)

1. **Silver's intraday record "about $121.6" (13 Jan 2026)** — the audit's
   tracker figure. The stored record is the **daily-high** basis:
   **$121.30 on 2026-01-29** (Yahoo). The audit's intraday tick cannot be
   reproduced from a daily-high series; the basis is stated on the card so
   the claim is honest. *Would need:* an intraday source to confirm the
   tick.
2. **Brent's March-2022 intraday "about $139"** — same class. The card
   claims the **close** basis only (record 138.21, 2026-04-07, per the
   provider's own history; March 2022's close peak in that data is 133.18
   on 2022-03-08). *Would need:* an intraday series if an intraday claim
   is ever wanted.
3. **The 2007 vs 2002 reading for the 10-year** — the spec's reference
   ("touched about 5.3 %, the highest since 2002") matches the touch; the
   current 5.21 % honestly reads 2007 (the last pre-episode print ≥ 5.21 in
   FRED's own history). Both claims are data-derived; nothing was
   hand-set. *Would need:* nothing — recorded so the next audit reads the
   distinction correctly.

## 4. Test results (latest runs)

- **Unit/CI** (`pnpm -r test`): insights **403 passed**, core **190**,
  web **427**, api **208**, markets **13**, scraper **67** — 1,308 tests,
  0 failures. ESLint: 0 errors (15 pre-existing warnings). Typecheck:
  clean, including the scripts config. Persian copy audit: clean.
  Bundle budget: within (Insights lazy chunk 599.37/141.52 kB vs
  600/142 budgets, justified in the CHANGELOG).
- **Live validation suite** (2026-10-15T01:39:48Z run, published): all 14
  tests pass; no failed sources; no stale or check-pending cards.
- **Safety demo** (`pnpm --filter @currena/insights safety-demo`, live
  sources): baseline suite green; duplicate M2 print → flagged
  check-pending, the fake date never publishes; failed source → last
  good value held stale (never today's data); unverified peak → claim
  stripped, price stays. ALL CHECKS PASS.
- **Regression fixtures**: 11 cases (COVID-2020: VIX 76.45 warning,
  unemployment 14.8 warning, Sahm 4.0 warning, US 10y 0.92 normal, curve
  0.47 normal, CPI 0.3 normal; inflation-2022: CPI 8.98 warning, Brent
  133.18 warning, US 10y 3.49 warning, M2 normal, VIX 32.95 warning) —
  all historically sensible, replayed every run and in CI.

## 5. Free-tier budget (one full refresh)

Measured from the live run of 2026-10-15T01:39:48Z:

- **KV reads: 55** (previous snapshot 1, seed histories 5, archive check 1,
  existing-history comparisons 48) — against 100,000/day.
- **KV writes: 31** (snapshot, status, daily archive, 28 changed history
  files; 20 unchanged histories skipped) — against 1,000/day.
- **Outside requests: 49** (48 provider fetches + 1 extra round trip for
  the World Bank's page-then-workbook) — under the free Workers plan's
  50-subrequest ceiling even though the ingest runs on GitHub Actions
  (its own venue, not a Worker invocation).

The daily total stays far inside the free tier.

## 6. How to produce a new full export for the next audit

1. Open **https://currena.ir/#/insights** (or the Preview panel's "Open in
   New Tab").
2. Expand every collapsed surface **before** saving, in this order:
   - each area's **"Show hidden indicators"** (the context rows fold),
   - the money panel's full table (**"Show full table"**),
   - the calendar's **"Full calendar"** (every month),
   - each card's **details panel** (the ⓘ / tap-through) where the
     source, data date, release date, rule and rule version live.
3. Save the page (Print → Save as PDF, or browser Save-As). The export
   then contains every card, row, table and event the audit checks.
4. The same data is available machine-readably for cross-checking:
   - `GET /api/insights` — the full snapshot (51 readings),
   - `GET /api/insights/status` — run status, failed sources, the 14
     validation results,
   - `GET /api/insights/archive/<YYYY-MM-DD>` — any past day's exact
     published snapshot,
   - `GET /api/insights/<id>/history` — a series' stored history.
