> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S5/01 — Currena Gold-Page SWOT (page + competitive position)

**Session:** S5 of the Gold Page Elevation program · **Date:** 2026-11-17
· **Branch:** `docs/gold-page-elevation`

**What this is:** the M1 deliverable of the CP-A checkpoint — the SWOT
of `https://currena.ir/gold` as a page and as a competitive position,
built only from this program's verified evidence. Every cell cites its
source: issue IDs from the S2 deep audit
(`docs/audits/2026-11-17-gold-page-deep-audit.md`, GPE-S2-##) and the
S3 competitor audit (GPE-S3-##), cells from the head-to-head matrix
(`docs/audits/2026-11-17-gold-head-to-head-matrix.md`), and S4
section refs (`s4/01`–`s4/05`). Market values named below are dated
snapshots from those sessions (2026-11-17); the structural findings
are the durable content. Nothing is re-litigated here — carried
decisions (S2-D1…S2-D4, S3-D1…S3-D3, S4-D1…S4-D5, D1–D8) are cited.

---

## 1. Strengths (verified, with evidence)

| # | Strength | Evidence |
|---|---|---|
| S1 | **The governed conditions meter** — 37 voters / 5 lanes / pre-registered MIN2 calibration / a published, honestly-reported no-edge backtest. The only framework of its kind in the Persian web; the competitor has no conditions abstraction at all. | S2 §4 dims 2 & 12 (both 4.5); V-15 (the on-page honest record matches the published 46.8/42.2/32.7); matrix §2 "Conditions meter ✗ / Honest record ✗" on SA's side; s1/07 §3 |
| S2 | **Data arithmetic that survives cross-check** — 13 of 19 sampled readings matched upstream exactly at their as-of dates (COFER to 4 decimals, CFTC to 2, BAZG to the kilogram), zero value mismatches. | S2 §7 (19-row table); summarised S2 SUMMARY ("the data arithmetic itself is outstanding") |
| S3 | **The fail-closed honesty architecture** — honest loading/cached/error paths, as-of on every card, stale badges, the licence wall, the honest record. SA has no stale/fail-closed concept at all. | S2 §8 V-01–V-04, V-15; matrix §2 "Stale badges / fail-closed ✗ concept absent (GPE-S3-30)" for SA; S3 §5 |
| S4 | **Mobile + bilingual as native properties** — end-to-end 390 verification both locales, RTL-native FA with Jalali dates, EN alongside. SA is FA-only and misdeclares `lang="en"` LTR on Persian content. | S2 §4 dim 11 (4.5), V-08, V-11; matrix §2 "Bilingual ✗ (GPE-S3-01/-02)" for SA |
| S5 | **Physical-market coverage the competitor lacks entirely** — SGE withdrawals, Swiss imports, Shanghai premium, all verified exact. | S2 §7 rows 17–18; matrix §2 "Physical market ✗" for SA; S2 §4 dim 3 (coverage 3.5 vs 2.5) |
| S6 | **The feasibility layer is closed, at zero new paid-feed cost** — 23 candidates reality-checked (16 fetch-verified live, 4 gated-by-design, 2 venue-blocked rejections, 1 policy adoption); every Core/Supporting feature has a verified data path or a recorded blocker. | S4/04 §5 (the 23-row table); S4/05 §7 ("Zero new paid feeds anywhere in the program's adopt set") |
| S7 | **The CB-demand Tier-1 is cheaper and cleaner than drafted** — the gold-reserves series are the IMF SDMX 3.0 `IL` (`RGV_REVS`, 188 countries, USA history to 1956) and `IRFCL` (`IRFCL56V_FTO`) dataflows: keyless, L1, monthly, Worker-egress verified, USA 8,133.5 t reproducing exactly — same venue as the production COFER adapter. | S4/04 §2d (the sharpest S4 finding — "IFS" as such does not exist on the modern API); S2 §5b (the COFER adapter re-verified exact); S4/05 §1 row 1 (ADOPT) |
| S8 | **The documented-حباب differentiation, sharpened by S4** — incumbents publish حباب values but nobody documents the formula: the same word printed three different numbers within one hour (TGJU 7.88M / Currena-method 8.08M / Union-press 5.99M toman). Currena's reproducible decomposition (ounce × dollar × pure-content, as-of stamped) is the version that reconciles. | S4/03 §1c (the s1/11 §1 correction — "the claim narrows to, and strengthens as, the documented, reproducible premium"); S4/05 §4 (the حباب series ADOPT) |
| S9 | **The bridge's data plane is verified end-to-end on live data** — all 9 TGJU instruments + the USD leg matched the upstream feed exactly; the premium's three legs ride ONE snapshot (no cross-source skew); the 11-glyph toman mobile question answered empirically (it fits). | S2 §5a + §7 row 19; S4/03 §1a (re-verified again at the 12:50 snapshot, both venues) |
| S10 | **A clean data surface** — no commerce funnels on the data (SA: login/contest/product links, GPE-S3-14/-20; TGJU: dealer funnel on the price surface). Confirmed as the differentiating posture in both the international and the Persian frame. | S3 matrix §2 "Commerce funnels ✗" for Currena (a win); S4/03 §2c |

## 2. Weaknesses (verified, with evidence)

| # | Weakness | Evidence |
|---|---|---|
| W1 | **The fix-first trio sits in the credibility lane** — the "10 years" chart actually renders a 5.2-year window and labels the 5.2-year return "+115.3% 10 years"; the FA SGE/Swiss cards say "million tonnes" where the values are tonnes; the Gold Positions "−8.8 pts" is an unlabeled 30-day change in a weekly-report section. Statistical honesty is the brand; these are brand defects. | GPE-S2-01 (HIGH), GPE-S2-02 (HIGH), GPE-S2-09 (MED); S2-D1 (the fix-first list for Phase D); all three re-confirmed live on S3 day (matrix §5) |
| W2 | **8 of 37 meter seats dark (16–17 Nov), three distinct causes** — upstream-stopped (UoM ends Sep 2026), upstream-gap (Oct 2026 CPI published but its Oct 2025 YoY base is empty on FRED), and two self-inflicted pipeline misses (CFTC Nov 10 report un-ingested; GPR daily 14 days behind AND vintage-diverged). | GPE-S2-03 (HIGH) + §3 (the decomposition); GPE-S2-06 (no "why/when back" reaches the page); GPE-S2-04/-05 (the two misses); S2-D4 (the two operational P0s) |
| W3 | **The explanation layer is absent — and now quantified** — the competitor wins five dimensions outright: macro interpretation 4.5 vs 3, relationships 3.5 vs 2.5, historical context 2.5 vs 1.5, charts 3.5 vs 2, education 4.5 vs 2. Raw sums: SA 41.5 vs Currena 39.5 — the competitor is ahead today. | Matrix §1 (per-cell citations) + §5 (the verdict); S3-D1 (recorded as S6's governing input) |
| W4 | **Education is fragments, not an on-ramp** — no mechanism explainers, no one-line ratio meanings («نسبت ۸۲» is stated, never explained), no FAQ surface. The single largest dimension gap between the two pages (2 vs 4.5). | GPE-S2-12; matrix §1 dim 9; S2 §4 dim 9 justification |
| W5 | **Forecast-adjacent language on a conditions product** — "Gold outlook: Bearish" / "potential significant decline" sitting paragraphs from "It is not a forecast" («پیش‌بینی نیست»), both locales. | GPE-S2-11; F15's open copy decision (s1/14) |
| W6 | **Freshness lags on the yield/positioning family** — the FRED yield seats read Nov 12 with Nov 13/16 published upstream; the COT pair reads Nov 3 with Nov 10 published. The competitor currently serves both families fresher. | GPE-S2-08; GPE-S2-05; matrix §5 ("the competitor is currently the fresher data product on 2 of the head-to-head's 20 checked rows") |
| W7 | **Chart tooling is a fixed-range sparkline** — no pan/zoom/log/compare, no overlays (the D8 overlays have no chart to ride yet), and the flagship range is mislabeled (W1). | S2 §4 dim 8 (2.0, reduced on evidence); GPE-S2-01; matrix §1 dim 8 |
| W8 | **History is the page's lowest dimension** — the only historical render is the (shortened) 5.2-year "10 years" window; no episodes, no long-run series, no "where are we vs 1980/2011". | S2 §4 dim 6 (1.5 — the only ↓0.5 on evidence at S2); GPE-S2-01 |

## 3. Opportunities (the five SA-winning dimensions, each now backed by a verified data path or pattern)

| # | Opportunity | The verified path (evidence) |
|---|---|---|
| O1 | **Macro interpretation (3 vs 4.5): F1 daily narrative + F5 yield decomposition.** The GRAM 5-bucket ↔ Currena 5-lane mapping is the intellectual template (with the binding no-fake-attribution rule — "the meter explains conditions, not the price move"); the TE narrative skeleton is adopted and the forecast-as-headline anti-pattern is recorded as a binding rule. F5's inputs are all present, and Treasury-direct is verified fresher from both venues. | S4/01 §2 (GRAM mapping + honesty rule); S4/02 §3 (TE narrative verbatim + the anti-pattern); S4/04 §2f (Treasury Nov 16 10Y 5.12 / real 2.92 — +2 trading days vs FRED); S4/05 §6 (patterns adopted) |
| O2 | **Relationships (2.5 vs 3.5): F11 rolling-correlation panel with pre-registered windows.** SA's one rendered relationship (gold vs real yields) reproduces only under Friday-weekly sampling and swings to −0.26 under Monday sampling — the convention chaos Currena's pre-registered-window, series-named-at-point-of-use version answers. | GPE-S3-05; S3-D3c (the binding copy rule); s1/04 Idea 3; matrix §4c |
| O3 | **Historical context (1.5 vs 2.5): F6 Episode Explorer.** The long-run series data problem is solved at zero marginal cost — the WGC prices workbook (monthly averages in a range of currencies since 1978) rides the same owner data-drop as the GDT stack; the FRED supplement is deferred-with-reason. Kitco's Turning Points validates the editorial demand. | S4/04 §5 row 19 (ADOPT via the prices-workbook drop); S4/01 §1 + §5 (the drop pattern); S4/02 §2d (Turning Points, "55 years… Research, not news") |
| O4 | **Charts (2 vs 3.5): F7 interactive chart + the D8 overlays.** EODHD XAUUSD daily OHLC re-verified (360 rows to Nov 16; close 3,862.84 = S2's verified value); the unit-aware quote-header pattern is adopted (with the series-definition-disclosed habit — the anti-GPE-S3-04 discipline); the distance-decile treatment is the statistical differentiator SA has no equivalent of. | S4/04 §5 row 17; S4/02 §2c (the Kitco header, bid/ask + oz/gram/kilo + series definition at point of use); S3-D2 (the TA integration verdict); s1/13 §2–§3 |
| O5 | **Education (2 vs 4.5): F4 on-ramp on the Kitco 5-driver pattern.** Five drivers, one short paragraph each, defined by mechanism — with Currena's twist Kitco cannot do: each driver paragraph closes at the voters/lane that measures it ("here is the driver, here is its gauge today"). The CPI gap label itself teaches (the shutdown gap becomes content). | S4/02 §2a (the five drivers quoted verbatim); S4-D1 (the «مبنا: میانگین دو ماه مجاور» label); s1/14 F4 |
| O6 | **The two differentiation prizes are now feasibility-verified, not assumed** — the Iran bridge (all adopt verdicts: live board, حباب series, CBI constants, backfill route A) and CB-demand (Tier-1 L1 keyless + Tier-2 data-drop with the attribution wording quoted verbatim). The gerami spec correction makes the premium ladder monotone and sensible (full +3.3% < half +8.5% < quarter +18.1% ≈ gerami +18.6%). | S4/05 §4 (the bridge family, all ADOPT); S4/05 §1 (the CB family); S4/04 §2b (the CBI 900-fineness pin + gerami triangulation) |
| O7 | **Match SA's one novel data lens with discipline: F24 Fed probabilities.** Kalshi (236 open KXFED markets; the Dec-2026 set closes 2026-12-09) and Polymarket (live 0.915/0.052/0.0305) both keyless-readable from planning machine AND Worker egress, with the ToS postures read. | S4/04 §2g + §3; S4/05 §3 (both legs ADOPT); S3-D3b |
| O8 | **The honesty device SA cannot copy: F23 the forecast retrospective.** LBMA's own analyst-survey record (consensus under-forecast gold in 10 of 16 years; mean miss −2.1%; −20.2% in 2025) beside Currena's published no-edge backtest = the constructive anti-forecast posture the TE anti-pattern forbids faking. | S4/02 §1d (the 2010–2026 series extracted); S4/02 §3 (the anti-pattern rule); S4/05 §2 (ADOPT, Advanced tier) |

## 4. Threats (verified, with evidence)

| # | Threat | Evidence |
|---|---|---|
| T1 | **Competitor freshness, live today** — SA ships the Nov 10 COT report (Currena: Nov 3) and Treasury-current yields (Nov 16 vs FRED's Nov 12). On the page whose brand is data discipline, the competitor is currently the fresher data product on 2 of the head-to-head's 20 checked rows. | GPE-S3-24; GPE-S2-05; GPE-S2-08; matrix §1 dim 7 freshness footnote + §5 ("the uncomfortable finding") |
| T2 | **TGJU's incumbent gravity** — 4.5M+ daily unique visitors, 9M+ daily page views, 11B+ monthly requests (the network's own published scale). The bridge competes for attention with the ecosystem's default terminal — which already publishes حباب as live symbols with history. The differentiation is process (documented, reproducible), not data possession; it holds only as long as the documentation quality does. | S4/03 §1f (persianapi homepage numbers); S4/03 §1c (the live حباب symbols) |
| T3 | **The mislabel trio's public-gap conversion risk** — the three defects convert from "private defect" to "public gap" the day a sophisticated reader compares pages against a competitor whose numbers reproduce (16 of 20 exact, method disclosed). The risk compounds with every day unfixed. | Matrix §5 ("measured against a competitor whose numbers reproduce"); S3 §5 (the 16/20 clean set) |
| T4 | **SA's copy-speed asymmetry** — its ungoverned template (auto-generated narrative, no published rules) lets it extend modules in days; Currena's governance (rightly) slows changes. SA's five winning dimensions are all editorial assembly copyable in a week — the explanation wins must land while they still differentiate. The mirror of the S1 thesis: explanation is buildable on rigor — for us *and* for them. | GPE-S3-27 (the ungoverned template); matrix §5 ("none of SA's wins is protected… while Currena's five wins are infrastructure SA cannot copy"); S3-D1 |
| T5 | **Venue and licence residuals, all recorded with reasons** — FRED transiently unreachable + a 520 from Worker egress this session (single-mirror exposure on the yield family — mitigated by the Treasury-direct adoption); WGC's terms seek prior written authorisation (D7 proceeds without it; the letter is the parallel action); the Kalshi Developer Agreement wording unread (429 venue state — one build-time read); TGJU's written-consent terms sentence on the scrape the bridge's backfill extends (owner-accepted posture; persianapi is the priced escalation route). | S4/04 §1 (venue map) + §2g; S4/05 §1 (the WGC risk note); S4/03 §1e (the terms sentence verbatim) + §1f (route B priced) |
| T6 | **The two operational P0s sit outside GPE's control** — the CFTC Saturday-gate miss and the GPR re-fetch belong to the modularization-closeout window (S2-D4). Until then the Flows lane reads partly unread, and T1's freshness gap stays open on exactly the seats a positioning-focused reader checks. | S2-D4; S2 SUMMARY open question 1; carried unchanged through S3 (S3-D carried) and S4 (S4 SUMMARY "known problems") |

## 5. The SWOT verdict (for CP-A)

**The page's position is strong-and-behind: infrastructure ahead,
narrative behind, and the gap is closable on our terms.** Currena's
five dimension wins (sophistication, coverage, data quality, mobile,
differentiation — matrix §1) are infrastructure the competitor cannot
copy without becoming a different product; SA's five wins are
editorial assembly this program has already decided to build, with
every data path now verified (S6 opportunities above). The raw board
says SA 41.5 vs Currena 39.5 today; the S1 thesis survived its stress
test — explanation is buildable on rigor; rigor is not buildable on
explanation (matrix §5). The threats that matter are time-based, not
structural: T1/T3 (freshness + the mislabel trio, both
credibility-lane) sharpen until the fix-first wave lands; T4 (SA's
copy speed) puts a window on the explanation wins' differentiation
value. The strategy the SWOT implies is exactly the S3-D1 rule already
recorded: fix the credibility floor first, then build the explanation
layer and the two differentiation prizes as co-equal Core in the first
wave — every supporting data path is verified, at zero new paid-feed
cost (S4/05 §7).

## 6. Method and limitations

Every cell above cites program evidence gathered 2026-11-17 (S2
~02:10–03:20 UTC; S3 ~03:02–04:30 UTC; S4 ~05:00–12:00 UTC — per each
doc's method note). The SWOT is a snapshot of a live competitive
position: market values, freshness states and the competitor's page
will move; the structural findings (what each side can and cannot
copy, which data paths are verified) are the durable content, per the
program's rule 6 (frameworks must survive any particular day's
numbers). Carried decisions are cited, not re-litigated; nothing in
this doc changes any recorded decision. No code, `main`, or shared
bookkeeping files were touched (standing constraint, owner-reaffirmed
S1b).
