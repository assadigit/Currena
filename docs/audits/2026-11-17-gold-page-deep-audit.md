> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# Deep Audit: currena.ir/gold (GPE Session S2)

**Session:** S2 of the Gold Page Elevation program · **Date:** 2026-11-17
(~02:10–03:20 UTC) · **Branch:** `docs/gold-page-elevation`
**Auditor method:** rendered-browser field audit (agent-browser/Playwright,
Chromium), live API reads, upstream cross-checks by direct fetch, read-only
code reading. Screenshots: `docs/assets/gold-audit-s2-2026-11-17/` (30
files). This document deepens the S1 survey audit (`s1/06`) and adds the
post-D6–D8 **integration lens** (s1/11–s1/13) and the **modularized-tree
inventory** for the S6/S7 specs.

**Coverage matrix (all verified rendered this session):**

| Axis | Covered |
|---|---|
| Locales | EN (LTR) + FA (RTL) |
| Viewports | 1440×900 · 768×1024 · 390×844 |
| Sections | all 13 from the s1/06 inventory (§1 below) |
| Interactive elements | radios (both), all 5 hero lane chips, signals collapse/expand, chart ranges (gold: Q/1y/5y/10y; silver: 10y; mobile: 5y), lane expanders (3 instances + mobile — one shared component), seat links (1 followed end-to-end + all 37 hrefs collected), in-page anchors, backtest links, theme toggle, language toggle, hamburger nav (768 + 390) |
| States | loading, cached-outage, hard-error + retry + recovery, stale badges, "couldn't be read" seats, licence-blocked notes |
| Upstream cross-checks | 19 rows against FRED, CFTC, IMF COFER (SDMX 3.0), BAZG, gold-api.com, EODHD, Frankfurter, TGJU, the GPR daily file (§7) |

Snapshot of the day (all values as rendered ~02:13–02:40 UTC, 2026-11-17;
the page live-updates): gold US$3,867 (+0.36% 1d, top 11% of the last 10
years, 30-day −7.05%, peak $5,586.20 on 2026-01-29, −30.8% from peak);
lean "Leaning against gold", outlook "Bearish", 0 for · 2 against ·
2 not leaning · 1 unread; lanes: borrowing costs against (5 of 7 firing),
dollar against (6 of 6), market stress split (1–1), inflation not leaning
(1 of 7 readable firing), flows unread. Silver US$47.16 (−28% quarter,
"Strong bearish"). Data as of Nov 16, 2026 (projection generated
2026-11-16T12:54:59Z; live prices as of 2026-11-17T02:13:18Z).

---

## 1. Verified section inventory (top → bottom, EN 1440)

| # | Section | Contents verified this session | Module (see §6) |
|---|---|---|---|
| 1 | Header/nav | Global · Gold · World Markets · Currencies · Commodities · Regions▾ · Insights(LEGACY) · Tools▾ + install, FA/EN, theme, hamburger (≤768) | app shell |
| 2 | Page head | Breadcrumb Home›Gold, H1 "Gold", tagline, "Data as of Nov 16, 2026", absent-note "4 of this page's readings are not published in this mode." | `GoldPage` |
| 3 | Price header | US$3,867 · +0.36%1d · top 11% of 10y · "Live prices as of 02:13 am UTC" | `GoldHero` |
| 4 | Aggregate (balance) | beam (aria "Beam tilt: 10°, Leaning against gold."), Balance/Minimal radio, TODAY'S LEAN, outlook Bearish, counts, 30-day context; 5 lane weight chips (scroll-to-lane, §2 #17) | `GoldHero` + `signals/BalanceScale` |
| 5 | "What the signals say" | collapse toggle; gold+silver cards w/ 4-range charts + delta readouts; the aggregate repeated with 5 expandable lane cards (driver + live value + "Not firing (n)" roll-up); price footing (both metals); honest-record paragraph + backtest link | `Signals` + `signals/MergedCard`, `signals/verdict` |
| 6 | The 37 seats, by lane | 5 lanes, every seat a link with lean + evidence word; 8 seats "Couldn't be read" (§3) | `GoldSeats` |
| 7 | RATIOS (8 cards) | Au/Ag 82.0 · BTC/oz 0.0598 · A$5,699 · oil 40.9 · Au/Pt 2.65 (top 13%) · real price $1,155 (top 10%, Oct 1) · Cu/Au 3.53 · GLD/SPY 0.4712 — each with 10y band word + as-of | `GoldContext` |
| 8 | FLOWS & POSITIONING (5 cards) | COT net 45.0% (Stale, Nov 3) · COT gross long 55.2% (Stale, Nov 3) · SGE 92 (Oct 1) · Swiss 228 (top 18%, Sep 1) · Shanghai premium 0.47% (Nov 13) | `GoldContext` |
| 9 | Licence-block wall | 4 named exclusions (WGC ETF, WGC CB demand, PBoC/CBR venue, ETF short interest) | `GoldContext` (BLOCKED_NOTES) |
| 10 | The honest record | 46.8/42.2/32.7 sign agreements · MIN2 · "no forecasting edge claimed or implied" + backtest link (200 OK) | `GoldContext` |
| 11 | Gold Positions | 2 CFTC cards, 0–100 bars, "−8.8 pts" / "−6.2 pts" (see #09 — 30-day changes, unlabeled) | `GoldPositions` |
| 12 | Footer | "Made with ❤️ by Ali Assadi" + Privacy/Terms/Contact/About | app shell |
| 13 | (Cross-links out) | 37 seat links → /usa (21), /currencies (6), /europe (2), /world-markets (1), in-page #gold-context (3) | `GoldSeats` |

FA/RTL re-verified natively across all sections: Persian digits
(۳٬۸۶۷ دلار), Jalali dates (۱۴۰۵/۰۸/۲۵; charts شهریور ۱۴۰۰→آبان ۱۴۰۵),
native copy («برآیند عوامل مؤثر بر قیمت طلا», «تمایل به ضرر طلا»,
«نزولی», «قابل ارزیابی نبود», «قدیمی» for Stale). No horizontal
overflow at any viewport × locale; no console errors during the session.

---

## 2. Issue log (numbered; severity HIGH/MED/LOW/INFO)

*Evidence = this session's screenshots (file names), API reads, upstream
fetches, or code refs (repo @ 5038a15d). s1/06 gap refs (G1–G12) noted
where the deep audit confirms/refines them.*

### Data & content

**GPE-S2-01 · HIGH · Signals charts — the "10 years" range renders a
~5.2-year window.** The gold chart's "10 years" chip plots Sep 2021 →
Nov 2026 (axis labels "Sep 2021 · Apr 2024 · Nov 2026"; screenshots
`en-1440-05-chart10y.png`, `fa-1440-03-chart10y.png`) and the readout
says "+115.3% 10 years" — but +115.3% is the 5.2-year return
(3,872.65/1,798.50 from the loaded series). The true 10-year return
(Nov 2016 ≈ $1,230 → $3,867) is ≈ +214%. Silver's "+95.6% 10 years" is
the same shortened window. Root cause: the public history API bounds the
series at `PUBLIC_HISTORY_WINDOW_DAYS = 1900` (~5.2y,
`apps/api/src/routes/insights.ts:152`) while
`features/gold/signals/verdict.tsx:183` still asserts "the history feed
already carries the complete 10-year daily series." The 5y/1y/quarter
ranges are unaffected (their windows fit inside the bound). For a page
whose brand is statistical honesty, a mislabeled return horizon on the
flagship chart is the single most important defect found this session.

**GPE-S2-02 · HIGH · SGE/Swiss cards — tonnage unit mistranslated in FA
(and ambiguous in EN).** The FA cards read «برداشت طلای بورس شانگهای
(ماهانه) ۹۲ میلیون تن» — "92 **million** tonnes" — and «واردات طلای
سوئیس ۲۲۸ میلیون تن». The values are 92 and 228 **tonnes** (§7 rows
17–18 verify the numbers exactly). EN renders "92 m tonnes", which at
best reads as "metric tonnes". Root cause: the gold page's
`unitTonnes` key (`shared/i18n/en.ts:846`, `fa.ts:803`) reuses the
insights-corpus unit string `units.tonnes = 'm tonnes'` /
`میلیون تن`, which was introduced for China's crude-steel output — a
series genuinely denominated in millions of tonnes
(`insights-copy-fa.ts:2037-2039`; `gold-tiles.ts` GOLD_DISPLAY assigns
`unit: 'tonnes'` to both SGE and Swiss). A factor-of-10⁶ unit error on
a financial-data page violates the repo's own rule 5 (never assume a
number is correct). The fix is one dictionary string pair — the values
themselves are correct.

**GPE-S2-03 · HIGH · The 16–17 Nov "couldn't be read" cluster PERSISTS
(8 of 37 seats).** Same set as S1; the full breakdown and causes are §3.
The pattern did not recover between 16 and 17 Nov.

**GPE-S2-04 · MED · gpr-daily is stale AND the stored value diverges from
the provider's current file.** Reading: 158.845 @ Nov 2 (status stale).
The provider's rolling file (`data_gpr_daily_recent.xls`, fetched this
session) is current through **Nov 16** (GPRD_MA7 = 145.08) — the reading
is 14 days behind with data available upstream (pipeline miss). Worse,
today's file gives **GPRD_MA7(Nov 2) = 135.03**, not the stored 158.85 —
the "recent" file revises its rolling window, so the stored reading is a
vintage that no longer reconciles (the s1/11 §6 "revision practice"
caveat applies to GPR too, not just TGJU). The card shows a number that
is both old and unreproducible from the current source.

**GPE-S2-05 · MED · CFTC positioning is one report behind with the newer
report published.** Reading: 44.98/55.25 @ Nov 3 (status stale, both).
CFTC's current `deafut.txt` and the 2026 annual archive both carry the
**Nov 10** report (net/OI 46.97%, Long/OI 55.90%) — published Fri Nov
13, before the Nov 14 Saturday gate and the Nov 16 ingest. The Nov 3
values are exact (§7 rows 13–14); the freshness is a pipeline miss.

**GPE-S2-06 · MED · Unread voters give the reader no "why" or "when
back" (s1/06 G8 confirmed and sharpened).** Eight seats say only
"Couldn't be read". The API carries statuses (stale) and the causes are
knowable — UoM stopped publishing after September (upstream), the CPI's
October YoY base month is missing on FRED (upstream gap), GPR/CFTC are
pipeline lags (fixable) — but none of that reaches the page. The licence
wall explains 4 blocked ids; nothing explains the 8 unread seats. This
is the cheapest trust win available: one status line per dark seat.

**GPE-S2-07 · MED · US CPI: the October 2026 index is published upstream
but the page cannot express it.** FRED carries CPIAUCNS Oct 2026 =
337.511 (released ~Nov 13); the page's CPI reading is stuck at September
(3.7377% YoY, exact — §7 row 10). The blocker: the standard YoY needs
the Oct **2025** base, which is **empty on FRED** (the 2025
government-shutdown gap — `2025-10-01,` is blank), so the pipeline's
computation has no base month. The fail-closed display is honest, but
the underlying rule (YoY vs same-month-prior-year) needs a
shutdown-gap policy (e.g., skip-month base or the BLS's own published
YoY) — an S4/S8 data-pipeline decision, recorded here with evidence.

**GPE-S2-08 · MED · FRED yield family one trading day behind.** All five
yield seats read asOf Nov 12 (status "warning"); FRED already carried
Nov 13 values at audit time (DFII10 2.91 vs page 2.86; DGS10 5.15 vs
5.10; DGS30 5.47 vs 5.43; DFII5 2.68 vs 2.64) and T5YIFR even has Nov 16
(2.15 vs page 2.18 @ Nov 13). Values match their as-of dates exactly
(§7); the lag (1 trading day, ~2 for breakevens) is the finding. Same
pattern for the Frankfurter family: dollar basket and USD/JPY read Nov
13 while ECB Nov 16 rates exist (recomputed basket 103.470 vs page
103.241).

**GPE-S2-09 · MED · Gold Positions "−8.8 pts" is an unlabeled 30-day
change in a weekly-report section.** `GoldPositions.tsx:43-64` renders
`change30d` with no window word. The section's own copy says "the CFTC
Commitments of Traders report" (weekly); any reader — including the S1
auditor, who recorded it as "net −8.8pts w/w" in s1/06 §1 row 12 —
parses it as week-over-week. The actual w/w is −2.0 pts (API
`lastChange.points`). Label the window.

**GPE-S2-10 · LOW · Positions bar clamps a ±100 metric into 0–100.**
`Math.min(Math.max(value, 0), 100)` on a net/OI metric defined in
[−100, +100]: a net-short reading would pin the bar at 0% and hide the
sign. No visual bug today (values positive) — a latent semantic trap.

**GPE-S2-11 · MED · Outlook terminology tension (s1/06 G6 confirmed,
both locales).** "Gold outlook: **Bearish**" and "Signs point to a
potential decline in gold prices" (silver: "potential **significant**
decline") sit paragraphs away from "It is not a forecast" / «پیش‌بینی
نیست». Directional forecast-adjacent language on a conditions product —
the F15 copy decision (s1/14) remains open.

**GPE-S2-12 · LOW/MED · Ratio cards still lack one-line plain meanings
(s1/06 G10 confirmed).** "Gold's price versus silver 82.0 ratio ·
typical · the middle of the last 10 years" — nothing tells a general
reader what the ratio *is*. The competitor explains each ratio in one
sentence (s1/07). Compounds with #02 on the SGE/Swiss cards.

**GPE-S2-13 · LOW · Silver remains a near-passenger (s1/06 G11
confirmed).** One analysis card + footing row + 3 ratio-card
appearances; no silver lane. Deliberate or not, it is now a documented
choice (F17 in s1/14), not an oversight.

**GPE-S2-14 · INFO · No Iran dimension (s1/06 G12 — now decided D6).**
Zero toman/coin/mesghal content on /gold today; all plumbing verified
present behind the scenes (§5a). An integration task, not an open
question.

### i18n (FA)

**GPE-S2-15 · LOW/MED · The absent-count renders in Western digits in
FA.** "4 از داده‌های این صفحه در این حالت منتشر نمی‌شوند." — the "4"
is the only Western digit on the FA page (everything else renders
Persian). Screenshot `fa-1440-01-top.png`.

**GPE-S2-16 · MED · Two inflation-lane seats have near-identical FA
names.** «انتظارات تورمی ۵ تا ۱۰ ساله» (breakeven-5y5y) vs «انتظار تورم
۵ تا ۱۰ ساله» (michigan-5y-expectations) — adjacent seats, one word
apart (تورمی/تورم), indistinguishable to a reader. EN distinguishes
cleanly ("5y5y breakeven" vs "5–10y inflation expectations"). One of the
two FA names needs a distinguishing framing (market-based vs
survey-based).

### UX / interaction

**GPE-S2-17 · MED · Hero lane chips work but announce nothing (s1/06 G7
refined — they are not broken).** Clicking any of the 5 beam weight
chips smooth-scrolls to that lane in the seats section (verified: scroll
target ≈3514–3568 px desktop, 4113 px mobile; screenshots
`en-1440-03-after-chip-click.png`). But: no `aria-expanded`, no tooltip,
no hover treatment, no visible state change at the destination (the lane
card there is a *different* expander that stays collapsed). The S1 audit
concluded "no visible expansion" — the truth is "an invisible scroll".
One affordance hint fixes both readings.

**GPE-S2-18 · MED · Voter seat links are page-level, not card-level.**
All 37 seats link to `/usa`, `/currencies`, `/europe`, `/world-markets`
(no `#hash`), while the destination cards have stable anchor ids
(`usa-card-real-yield-10y`, `currencies-card-dollar-basket`,
`wm-risk-gpr-daily` — verified present). On top of that, seat names and
card titles diverge: "Real yields" → card "US 10-year interest after
inflation"; "Dollar basket" → "The dollar vs six big currencies". The
reader lands at the top of a long page and must find a differently-named
card. The anchor infrastructure already exists; the link builder just
doesn't use it (`gold-tiles.ts` `homePage` carries only the page id).

**GPE-S2-19 · LOW · Touch targets below the 44px guideline.** The
Balance/Minimal radio labels measure 45–50×**32**px; the chart range
buttons 62×**28**px at 390 (measured). Functional, but below the
accessibility floor the rest of the app respects.

**GPE-S2-20 · LOW · The Minimal radio is unreachable by synthetic click
(S1 finding reproduced).** Playwright refuses: "covered by `<label>`…
the input would land on that element" — the input is label-wrapped.
Humans click the label fine; E2E tooling must click the label element.
A `for`/`id` pairing would fix both.

**GPE-S2-21 · LOW · The balance renders three times.** Hero aggregate →
signals-section aggregate (with lane expanders) → seats-section lane
cards (with the same expanders, verified byte-identical driver lists).
Deliberate density layering, but the third rendering duplicates the
second's expander content — a consolidation candidate when the
bridge/CB sections add length.

**GPE-S2-22 · LOW · The licence wall explains but does not link.** "the
draft is the owner's lever" — no link to the licence ladder or a
user-facing explainer. The trust asset would land harder with one
outbound path (the licence facts live repo-side in `docs/SOURCES.md`).

**GPE-S2-23 · LOW · During an outage the "Live prices as of HH:MM UTC"
line shows the cached timestamp with no staleness marker of its own.**
The projection's cached-copy sentence covers the daily data; the
live-prices line reads "current" while the refresh is failing
(screenshot `en-390-07-outage-cached.png`). A "(last successful)"
qualifier would close the gap.

**GPE-S2-24 · LOW · The Signals section pops in on cold load.** While
the second fetch (`/api/insights`) is in flight, `GoldPage` renders
nothing for the section (`insightsSnapshot === null`), so the seats
appear before the signals block above them. Minor layout jump on slow
connections.

**GPE-S2-25 · LOW · Nav ships an internal term: "InsightsLEGACY".** The
badge is accurate but reads as scaffolding; a user-facing label decision
for the post-modularization world.

**GPE-S2-26 · LOW · Footer Privacy, Terms and About all link to
`/about`.** Presumably anchored sections — but the links carry no
`#hash` either (same pattern as #18).

**GPE-S2-27 · COSMETIC · "+0.36%1d" cramped juxtaposition** in the hero
price line (the "over the past day" caption follows, so it parses, but
the glyph run is tight).

### Docs drift (record-only — bookkeeping files are modularization-owned
until the reconciliation commit)

**GPE-S2-28 · INFO · AGENTS.md §C describes the dollar basket as 7
currencies (incl. AUD); the code and the live card say 6** (DXY recipe,
`BASKET_WEIGHTS` in `domains/currencies/basket.ts`; card title "The
dollar vs six big currencies"). Reconcile at program close.

**GPE-S2-29 · INFO · AGENTS.md §F attributes the live prices to
gold-api; the projection's `gold-usd` sourceName is "Yahoo Finance:
COMEX gold futures (GC=F)"** (gold-api still sources the
ratio/platinum/premium legs). Record for the reconciliation commit.

**GPE-S2-30 · INFO · `verdict.tsx`'s "complete 10-year daily series"
comment is stale vs the 1,900-day public bound** — the code-level twin
of #01. Fixing #01 should fix the comment.

---

## 3. The 16–17 Nov "couldn't be read" cluster — re-check (M1d)

**Verdict: PERSISTENT.** The same six voters S1 found unread on 16–17
Nov are still unread on 17 Nov (plus the COT pair, which S1 noted as the
dark Flows lane). Eight of 37 seats render "Couldn't be read" /
«قابل ارزیابی نبود» today. The API statuses + upstream probes split the
causes into three distinct classes:

| Seat (lane) | Reading status | asOf | Cause class | Evidence |
|---|---|---|---|---|
| US CPI (inflation) | stale | 2026-09-01 | **Upstream-blocked**: Oct 2026 index published, but the Oct 2025 YoY base is empty on FRED (2025 shutdown gap) — #07 | FRED CPIAUCNS: `2025-10-01,` blank; `2026-10-01,337.511` |
| 1-year inflation expectations (inflation) | stale | 2026-09-01 | **Upstream-stopped**: FRED MICH ends Sep 2026 | FRED MICH tail: `2026-09-01,4.6`, nothing after |
| 5–10y inflation expectations (inflation) | stale | 2026-09-01 | **Upstream-stopped**: UoM survey data ends Sep 2026 | reading 3.4 @ Sep 1; no later vintage anywhere upstream |
| US consumer mood (stress) | stale | 2026-09-01 | **Upstream-stopped**: FRED UMCSENT ends Sep 2026 (48.1) | FRED UMCSENT tail: `2026-09-01,48.1` |
| Geopolitical risk 7-day (stress) | stale | 2026-11-02 | **Pipeline miss + vintage**: provider file current to Nov 16; stored value ≠ current file for Nov 2 | #04; GPRD_MA7(Nov 2)=135.03 vs stored 158.85; MA7(Nov 16)=145.08 |
| US−Japan 10y gap (dollar) | **normal** (2.259) | 2026-11-12 | **Rule-driven**: D-18 input-presence — value mid-range (thresholds <2 / >4), reading carries no percentile10y → seat reads 'unread' | `gold-balance.ts` D-18 branch (`domains/gold/gold-balance.ts:203`); the API reading carries no `percentile10y` |
| Gold positioning COT (flows) | stale | 2026-11-03 | **Pipeline miss**: Nov 10 report published Nov 13, not ingested | #05; CFTC deafut.txt carries 2026-11-10 |
| Gold long positioning COT (flows) | stale | 2026-11-03 | same | same |

**The pattern (what S2 adds over S1):** the cluster is not one problem.
(1) The UoM/CPI family is **upstream** — nothing Currena can fetch will
light those seats until the sources publish (or the CPI rule gains a
shutdown-gap policy, #07). (2) GPR and CFTC are **Currena pipeline
misses** with data sitting upstream *now* — actionable this week. (3)
The US−Japan gap seat is **neither stale nor missing** — its reading is
fresh and normal; the D-18 rule converts "mid-range value, no
percentile leg" into the same word the page uses for dead data. Three
causes, one identical user-facing string — the deepest version of G8
(#06). The Flows lane (2 seats, both COT-stale) votes "unread", which
drops the lane from the balance — today's "0 for · 2 against · 2 not
leaning · 1 unread" counts a lane that is one Saturday-gate fix away
from being readable.

---

## 4. The 12 audit dimensions — deep scores (M3a)

*(Survey scores from s1/06 §4 in parentheses; every change is justified
against issue IDs. Scale 1–5.)*

| # | Dimension | Score | Justification (issue cross-refs) |
|---|---|---|---|
| 1 | Information completeness | **3.5** (3.5) | Conditions apparatus, 8 ratio cards, 5 flows cards, physical-market coverage, cross-link hub — all verified (§1, §8). Demand story absent (licence wall + 2/37 flows seats), no history beyond the (shortened) chart window (#01), no education on-ramp (#12). The holes are the same holes S1 found; the deep audit confirms they are holes, not defects in what exists. |
| 2 | Financial sophistication | **4.5** (5) | The model itself remains institutional-grade: 37 voters/5 lanes/MIN2/pre-registered calibration/published no-edge backtest (V-15), decile grammar everywhere, term premium and CPI-deflated price on the page. Deducted half a point because two communication defects a sophisticated reader *will* catch were found: the mislabeled 10-year return window (#01) and the unlabeled 30-day change posing as weekly (#09). The sophistication of the apparatus is 5; the sophistication of what the page *says* is 4.5 until those are fixed. |
| 3 | Gold-market coverage | **3.5** (3.5) | Macro/positioning/physical strong (COT, SGE, Swiss, Shanghai premium — the last three verified exact, §7). Demand side licence-blocked (4 blocked ids, §1 row 9), supply/mine economics absent, Iran absent (#14, D6 decides it arrives). |
| 4 | Macro interpretation | **3** (3) | Lane verdicts + firing counts + readable-denominator tallies work and are honestly derived (verified against the API). No assembled reading, no narrative; the outlook-word tension (#11) is the terminology debt. |
| 5 | Indicator relationships | **2.5** (2.5) | Lanes group voters; every seat links out — but page-level only, with name mismatches (#18), and zero causal/education linkage between families (the s1/03 chains remain unrepresented). |
| 6 | Historical context | **1.5** (2) | Reduced on evidence: the page's *only* historical render — the "10 years" chart — actually shows 5.2 years (#01). No episodes, no long-run series, no "where are we vs 1980/2011". The 10y decile words are computed stats, not visible history. |
| 7 | Data quality / credibility | **4.5** (5) | Still the strongest dimension in class: fail-closed everywhere (V-01–V-04), as-of on every card, stale badges, and 13 of 19 cross-checked rows matched their upstream **exactly** at their as-of dates (§7 — COFER to 4 decimals, CFTC to 2, BAZG to the kilogram, CPI/PCE to the basis point). Deducted for: #01 (mislabeled window), #02 (unit error), #04 (stale + irreproducible vintage), #05/#08 (actionable lags). The *culture* is 5; today's *output* is 4.5. |
| 8 | Chart quality / usefulness | **2** (2.5) | Reduced on evidence: the flagship range is mislabeled (#01); still fixed 4 ranges, no pan/zoom/log/compare, no overlays (the D8 TA overlays have no chart to ride yet — F7). Sparklines are clean, labelled, aria-described (V-06) — but "clean and wrongly labeled" scores below "clean". |
| 9 | Educational value | **2** (2) | Copy fragments are good (lane intros, footing explanations, the honest-record paragraph); no on-ramp, no mechanism explainers, no ratio meanings (#12). |
| 10 | UX / readability | **3.5** (4) | Density control works (Minimal/classic, collapse), semantic and labeled (V-14), responsive clean (V-08). Deducted for: invisible chip affordance (#17), unanchored links (#18, #26), the w/w-ambiguous change (#09), the FA digit + name issues (#15, #16), touch targets (#19), triple balance (#21), signals pop-in (#24). |
| 11 | Mobile experience | **4.5** (4.5) | Re-verified end-to-end at 390 in both locales: no overflow, full hamburger nav, lane expansion, chart ranges, chip taps (scroll works, 4113px), single-column LED board on /live-rates with the 11-glyph toman value fitting a 145px cell (§5a). Only touch-target nits (#19). |
| 12 | Differentiation | **4.5** (4.5) | The meter + honesty record + licence wall remain unique in the Persian web (s1/07, s1/08); nothing found this session dilutes it — the mislabels (#01, #02, #09) are the main *risk* to it, which is why they lead the issue log. D6–D8 (bridge, CB demand, TA) extend the moat if built to the same standard. |

**Headline:** the rigor layer survived a deep audit with its reputation
intact but not spotless — three communication defects (#01, #02, #09)
sit exactly where the page's credibility claim lives (statistical
honesty), and the explanation layer (S1's thesis) is still entirely
absent.

---

## 5. Integration-lens map (M2) — the three decided features

### 5a. The Iran bridge card (D6, s1/11)

**Live-page slots (measured from the top at 1440×900):**

| Candidate slot | Position | Pros | Cons |
|---|---|---|---|
| A. Between the Signals section and the 37 seats (~3,480px) | after the global conditions story completes | "global meter → local market" is exactly the owner's A answer (global-first); the bridge reads as the page's second chapter | pushes the seats (the meter's evidence) further down |
| B. Between the honest record and Gold Positions (~5,300px) | end of the analytical spine | groups with "market data" (positions); does not break the hero→seats→cards rhythm or the licence-wall trust band | low visibility for the program's biggest differentiator |
| C. After Gold Positions (page end) | same | cheapest layout-wise | dead-last placement undersells a Core feature (s1/14 F3) |

Recommendation for S6: **slot A** as a compact band (instrument board +
parity + premium) with an expandable interpretation paragraph — matching
s1/11 §7's "below the global conditions meter, NOT in the hero". The
licence wall and honest record must stay contiguous (the trust band).

**Code plumbing (verified live + read):**
- `/gold` consumes **none** of `snapshot.gold` today — network-verified:
  the page fetches only `/api/insights/pages/gold`, `/api/insights`,
  and two `/api/insights/:id/history` calls. The bridge = a **new
  consumer** of the existing `/api/rates?source=tgju` snapshot (or a
  dedicated projection extension — an S6/S8 architecture decision).
- The data plane is healthy end-to-end: `packages/scraper/src/tgju.ts`
  (9 gold symbols + `price_dollar_rl`), `GoldQuoteSchema`
  (`packages/core/src/schemas.ts`), KV snapshot → `/api/rates` →
  `LedGoldBoard.tsx` (on `/live-rates` + `/converter` only). All 9
  instruments verified today against `call1.tgju.org/ajax.json` —
  **exact match on every value** (§7 row 19: Emami 250,555,000 toman,
  ounce $3,883.92, dollar 268,705 toman; timestamps Nov 16/17).
- The premium's three legs ride ONE snapshot (no cross-source skew):
  verified today, `ons` $3,883.92 × `price_dollar_rl` 268,705 toman →
  toman-per-ounce ≈ 1.0437bn — the s1/11 §5 sanity math still holds on
  live data.
- Post-modularization placement: the card lands in
  `apps/web/src/features/gold/` (e.g. `GoldIranBridge.tsx`) reusing the
  snapshot store (`shared/lib/snapshot-store.ts`); `LedGoldBoard.tsx`
  still lives in `apps/web/src/components/` (not yet moved) — s1/11 §7's
  "one data plane, two presentations; never duplicate the board markup"
  stands.
- **Mobile behaviour of 11-glyph toman values (s1/11 §7 open item) —
  answered empirically:** the LED board at 390 renders ONE price column
  (CURRENT; DAY HIGH/LOW `display:none` below md) and the 9-digit Emami
  value (11 glyphs incl. separators) fits a 145px cell at a 16.8px LED
  font (measured, `live-rates-390-gold-board-close.png`). A bridge card
  carrying instrument + parity + premium needs its own responsive
  decision (S6): stacked rows with the premium as the right-aligned
  secondary value is the measured-safe pattern.
- History gap confirmed: gold symbols have no stored history (only FX
  `rate-history`); `/api/history?source=tgju` serves currencies — the
  s1/11 §6 forward-accumulation + backfill plan is unaffected by
  anything found this session.

### 5b. The CB-demand section (D7, s1/12)

**Where the demand story sits relative to the Flows lane:**

| Candidate slot | Pros | Cons |
|---|---|---|
| A. Directly after the FLOWS & POSITIONING cards, before the licence wall (~5,000px) | the natural narrative hand-off: positioning (speculative) → demand (structural); the licence wall's "Central-bank gold demand" line sits right below and becomes the honest "now published (Tier 1: IMF IFS)" footnote | the wall's four-item symmetry breaks as items unblock (a good problem) |
| B. As a new lane-level section after the 37 seats | mirrors the meter's structure (a "demand lane" visual) | the meter has no demand lane (2/37 voters); a section that looks like a lane but doesn't vote needs careful framing (s1/12 §4's display-first recommendation) |

Recommendation for S6: **slot A**, display-only first (s1/12 §4's
"present before voting" — meter reweighting is a governance event).

**The link graph it would join:** the `usd-reserve-share` seat already
votes in the **dollar** lane (polarity −1: rising USD share = gold
headwind) and links to `/currencies` — while the CB-demand section
would tell the mirror story (central banks *buying gold* = the
de-dollarisation tailwind, Chain 4). **S6/S7 must reconcile the two
framings in copy** (same COFER/IFS data family, opposite sign
conventions on different objects). Other natural links: the SGE
withdrawals + Shanghai premium cards (physical-demand adjacency, both
verified current), the real-yields seat (the Chain-1/Chain-4 crossover —
s1/12 §3's companion chart), and the Episode Explorer (future, F6).

**Code sites:** the IMF COFER adapter already exists and was re-verified
exact this session (`domains/currencies/adapters/cofer.ts`, SDMX 3.0,
2026-Q2 = 56.7048 — §7 row 12); the IFS monthly reserves adapter is the
new build (same venue; series IDs are the S4 item); presentation lands
in `features/gold/`; `GOLD_BLOCKED_NOTES` in `gold-tiles.ts` carries the
two WGC lines that retire when Tier 2 lands (D7).

### 5c. The minimal TA block (D8, s1/13)

**Placement candidates near the price/ratio cards:**

| Candidate slot | Pros | Cons |
|---|---|---|
| A. Inside the Signals section, directly under the gold chart's range chips (~1,500px) | price context lives where the price lives; the MA row + pivot table read as chart annotations; s1/13's "trend context for the conditions reading" lands next to the footing row | crowds the merged card; the silver card follows immediately |
| B. A "PRICE LEVELS" band immediately before the RATIOS block (~4,700px) | clean sibling to RATIOS/FLOWS headers; the pivots table reads as reference data like the ratios; does not touch the meter's narrative | "levels" separated from the chart they annotate |

Recommendation for S6: **B** for the table + decile row (reference-data
framing), with the chart-overlay piece (50/200 DMA) riding the F7 chart
upgrade in slot A's position. **What the current sparkline ranges
already imply:** the page already teaches window-relative thinking
("+107.5% 5 years") — the TA block's "distance from 200-DMA as a
decile" is the same grammar, so placement beside range-based cards is
coherent. **But #01 must be fixed first** — a TA block citing 10-year
percentiles next to a chart mislabeling its 10-year window would
compound the confusion.

**Data reality (verified this session):** no MA/pivot code exists
(confirmed again); `/api/insights/gold-usd/history` serves **1,308
daily points (2021-09-07 → 2026-11-16)** — enough for SMA200 and the
pivot formulas (previous-day OHLC via EODHD verified working today:
Nov 16 close 3,862.84), **not** enough for a true 10-year
distance-from-200DMA decile — that stat must be computed server-side
into the reading (the `percentile10y` pattern), not derived
client-side. Build note for the S8 spec.

---

## 6. Modularized gold module inventory (for the S6/S7 spec references)

*Tree state @ 5038a15d (post-M8; `LedGoldBoard` not yet moved by the
modularization program — read-only inventory; the tree belongs to that
program until it closes).*

| Live page section / concern | Module (file) | Engine / data behind it |
|---|---|---|
| Route `/gold`, heading, absent-note, state machine (loading/cached/error) | `apps/web/src/features/gold/GoldPage.tsx` (240 l) | `shared/lib/page-division` (`fetchPageProjection`), `shared/lib/insights` |
| Price header + balance hero (beam, verdict, outlook, counts, radio) | `features/gold/GoldHero.tsx` + `signals/BalanceScale.tsx` (1,396 l) + `signals/BalanceWeight.tsx` | `gold-tiles.ts` (pure derivations), `domains/gold/gold-balance.ts` |
| Signals section (gold+silver cards, charts, lane expanders, footing) | `features/gold/Signals.tsx` (shell) + `signals/MergedCard.tsx` + `signals/verdict.tsx` (TrendPanel/MetalTrendChart) + `signals/icons.tsx` | `domains/gold/signals.ts` (evaluateSignal), `/api/insights/:id/history` |
| The 37 seats by lane | `features/gold/GoldSeats.tsx` | `GOLD_VOTER_IDS` ← `page-division/placement.ts` ← `shared/gold-score.ts` (the 37-voter table, shared by design — deviation D1) |
| RATIOS + FLOWS cards + licence wall + honest record | `features/gold/GoldContext.tsx` | `gold-tiles.ts` (`GOLD_DISPLAY`, `GOLD_BLOCKED_NOTES`) |
| Gold Positions | `features/gold/GoldPositions.tsx` | direct readings (`cftc-*`) |
| Page-division projection (what /gold serves) | `packages/insights/src/page-division/projection.ts` + `apps/api/src/routes/insights-pages.ts` (`GET /api/insights/pages/gold`) | curated readings + absentIds + pricesAsOf |
| Gold engines | `packages/insights/src/domains/gold/`: `gold-balance.ts` (5-lane model), `signals.ts`, `gold-backtest-core.ts` (harness twin), `breakeven-tilt.ts`, `real-yield-fill.ts`, `gf-p0-proposed.ts` | `shared/gold-score.ts` (voter table + evaluator) |
| Gold data adapters | `domains/gold/adapters/`: `cftc.ts` (deafut.txt), `sge.ts` (daily), `sge-monthly.ts` (PDF), `bazg.ts` (Swiss CSV), `gold-equities.ts` | `shared/adapters/` (fred, goldapi, rung2 collect, …) |
| Tehran instruments (bridge-relevant, NOT on /gold) | `apps/web/src/components/LedGoldBoard.tsx` (on `/live-rates`, `/converter`) + `shared/lib/snapshot-store.ts` | `packages/scraper/src/tgju.ts`, `GoldQuoteSchema` (`packages/core`), `/api/rates?source=tgju` |
| Tests pinning the above | `GoldPage.test.tsx`, `gold-copy-pin.test.ts`, `gold-frozen-scenarios.test.ts`, `gold-tiles.test.ts`, `outlook.test.ts`, `gold-backtest.test.ts`, `signals/balance.test.tsx`, `signals/gold-balance-lanes.test.tsx` (1,604 l) | — |

---

## 7. Data freshness cross-check (M3b) — 19 rows, 2026-11-17

*Method: every value read from the live API
(`/api/insights/pages/gold`, `/api/rates?source=tgju`) and compared
against the upstream publisher fetched directly this session. Verdicts:
**MATCH** (value+date exact), **MATCH-LAG** (value exact for its as-of
date; upstream is fresher), **STALE** (upstream ahead, page behind),
**MISMATCH** (value wrong at its own date).*

| # | Reading (page value @ as-of) | Upstream check | Verdict |
|---|---|---|---|
| 1 | gold-usd $3,866.90 (live 02:13 UTC) | gold-api XAU $3,873.92 (02:36 UTC); EODHD XAUUSD Nov 16 close $3,862.84 | **MATCH** (intraday; the page sits between two independent references) |
| 2 | gold-silver 82.0 (Nov 17) | 3,873.92/47.23 = 82.02 | **MATCH** |
| 3 | real-yield-10y 2.86% (Nov 12) | FRED DFII10 Nov 12 = 2.86 (Nov 13 = 2.91 published) | **MATCH-LAG** (#08) |
| 4 | us10y 5.10% (Nov 12) | FRED DGS10 Nov 12 = 5.10 (Nov 13 = 5.15) | **MATCH-LAG** |
| 5 | us30y 5.43% (Nov 12) | FRED DGS30 Nov 12 = 5.43 (Nov 13 = 5.47) | **MATCH-LAG** |
| 6 | real-yield-5y 2.64% (Nov 12) | FRED DFII5 Nov 12 = 2.64 (Nov 13 = 2.68) | **MATCH-LAG** |
| 7 | breakeven-5y5y 2.18% (Nov 13) | FRED T5YIFR Nov 13 = 2.18 (Nov 16 = 2.15) | **MATCH-LAG** |
| 8 | michigan-sentiment 48.1 (Sep) | FRED UMCSENT Sep = 48.1; nothing after Sep upstream | **MATCH** (upstream-stopped — #03/#06) |
| 9 | michigan-1y-expectations 4.6 (Sep) | FRED MICH Sep = 4.6; nothing after | **MATCH** (upstream-stopped) |
| 10 | us-cpi-yoy 3.7377% (Sep) | computed CPIAUCNS Sep 336.940 / Sep-2025 324.800 = 3.7378% | **MATCH** (Oct blocked upstream — #07) |
| 11 | us-pce-core-yoy 3.1212% (Sep) | computed PCEPILFE = 3.1212% exact; Sep IS the latest (Oct PCE ~end-Nov) | **MATCH** (current) |
| 12 | usd-reserve-share 56.7048% (2026-Q2) | IMF COFER SDMX 3.0 2026-Q2 = 56.7048 (Q3 not yet published) | **MATCH** (current, exact to 4dp) |
| 13 | cftc-gold-positioning 44.98% (Nov 3) | CFTC deafut.txt/annual: Nov 3 net/OI = 44.98% **exact**; **Nov 10 report = 46.97% published** | **STALE** (one report behind — #05) |
| 14 | cftc-gold-gross-long 55.25% (Nov 3) | CFTC Nov 3 Long/OI = 55.25% exact; Nov 10 = 55.90% published | **STALE** |
| 15 | gpr-daily 158.845 (Nov 2) | provider file current to Nov 16 (MA7 145.08); **today's file gives Nov 2 = 135.03** | **STALE + VINTAGE MISMATCH** (#04) |
| 16 | dollar-basket 103.241 (Nov 13) | recomputed from Frankfurter Nov 16 = 103.470 (weights+constant verified against `basket.ts`) | **MATCH-LAG** (1 trading day) |
| 17 | swiss-gold-flow 227.9 t (Sep) | BAZG open-data CSV, Sep 2026 imports summed = 227,942 kg = 227.9 t (prov status, latest month) | **MATCH** (exact) |
| 18 | sge-gold-withdrawals 92.08 t (Oct) | SGE "Data Highlights October 2026" PDF carries the Delivery/Withdrawal table (p.4); the repo's documented live read of the same file records 92,083.24 kg (the PDF's CID-keyed fonts need the repo's custom decoder; generic extraction confirms the table, not the digits) | **MATCH** (consistent with the venue file + the adapter's documented read) |
| 19 | TGJU board (live-rates): Emami 250,555,000 · 18k 24,567,400 · ounce $3,883.92 · dollar 268,705 (toman) | `call1.tgju.org/ajax.json` direct: sekee 2,505,550,000 Rial (=250,555,000 toman), geram18 245,674,000 Rial, ons $3,883.92 (ts Nov 17 00:37), price_dollar_rl 2,687,050 Rial — all 9 gold symbols present | **MATCH** (every value exact; feed fresh) |

**LBMA note:** no LBMA-sourced reading renders on `/gold` today (the
LBMA vault dataset is an s1/12 *fallback idea*, not a current source) —
nothing to cross-check; recorded so the S4 data-reality pass knows.

**Summary:** 13 MATCH (4 of them with upstream-stopped causes), 5
MATCH-LAG, 2 STALE, 0 value MISMATCH at the page's own as-of dates. The
page's arithmetic is trustworthy; its freshness has two actionable holes
(CFTC, GPR) and one policy hole (the CPI base-month gap).

---

## 8. Verified-good register (behaviors exercised and working)

- **V-01** Honest loading state: "Reading the gold meter…" + three dots
  on cold load (no cache) — verified.
- **V-02** Cached-outage path: API blocked → full page renders from
  cache with "Showing the last good copy — data as of Nov 16, 2026"
  (`en-390-07-outage-cached.png`).
- **V-03** Hard-error path: API blocked + cache cleared → "The gold page
  is unavailable right now / The data did not arrive. Nothing is shown
  rather than a guess." + Try again; retry while blocked stays honest;
  retry after unblock recovers the full page (`en-390-09-error-state.png`).
- **V-04** Stale badges render on cards (EN "Stale" / FA «قدیمی») —
  COT pair (and GPR on /world-markets).
- **V-05** Minimal/classic radio works via label; choice persists to
  `localStorage` and survives locale switches and reloads.
- **V-06** All chart ranges re-render with correct readouts: gold
  Q −13.4% · 1y −5% · 5y +107.5% · "10y" +115.3% (window issue #01
  notwithstanding, the mechanics work); silver 10y +95.6%; mobile 5y
  FA works with a Jalali axis.
- **V-07** Lane expanders work in both balance renderings + mobile,
  showing per-driver live values and "Not firing (n)" roll-ups.
- **V-08** No horizontal overflow at 1440/768/390 × EN/FA
  (`scrollWidth === clientWidth` everywhere).
- **V-09** No console errors or page errors during the whole session
  (both locales, all viewports, all interactions).
- **V-10** Dark mode toggles cleanly on the gold page
  (`en-1440-09-dark.png`).
- **V-11** FA/RTL native throughout: Persian digits, Jalali dates, FA
  chart aria labels («روند قیمت طلا در ۱۰ سال گذشته»).
- **V-12** Hero chips scroll-to-lane (all five; desktop + mobile).
- **V-13** Nav complete at all viewports (hamburger ≤768; the drawer
  lists every route); footer complete.
- **V-14** Accessibility baseline: skip-to-content button, beam alt
  text ("Beam tilt: 10°, Leaning against gold."), labeled controls,
  `role="img"` charts with descriptive aria.
- **V-15** The backtest link resolves (HTTP 200, opens in a new tab);
  the honest-record numbers on the page match the published 46.8/42.2/32.7
  record.
- **V-16** The /live-rates LED board (the bridge's data plane) renders
  every value exactly (the aria-labels carry the truth; the ghost
  "888 888" layers are the LED aesthetic, not placeholders — innerText
  extraction doubles values, aria does not).

---

## 9. What this means for S6/S7/S8 (one paragraph each)

**S6 (IA):** the three decided features have concrete, measured slots
(§5): bridge in §5a slot A (below the conditions story), CB-demand in
§5b slot A (after the flows cards, display-only), TA table in §5c slot
B (before RATIOS) with the overlay riding F7. The trust band (licence
wall + honest record) must stay contiguous; the balance's third
rendering (#21) is the natural space donor. Fix-first list before any
new section ships: #01, #02, #09 — they sit in the credibility lane the
new sections will borrow.

**S7 (framework):** the chains (s1/03) still have zero visual
representation; the cross-link infrastructure (seat→card anchors, #18)
is the cheapest substrate for the education layer — the S7 chain
visuals can ride the same anchor pattern.

**S8 (roadmap):** quick-win P1 candidates confirmed by evidence:
per-seat "why unread" lines (#06), the three mislabel fixes (#01, #02,
#09), ratio one-liners (#12), anchor links (#18), chip affordance
(#17). The pipeline fixes (CFTC Saturday gate, GPR re-fetch) are
operational P0s independent of the GPE build order — recorded here,
owned by the modularization-closeout window.

## 10. Method and limitations

Rendered-browser audit (Playwright/Chromium via agent-browser) on the
live production site, 2026-11-17 ~02:10–03:20 UTC; API reads via curl;
upstream checks via direct fetch (FRED fredgraph CSVs, CFTC
deafut.txt + deacot2026.zip, IMF SDMX 3.0 COFER, BAZG CSV, gold-api,
EODHD, Frankfurter, TGJU ajax, the GPR daily .xls). Code refs read at
repo commit 5038a15d (branch `docs/gold-page-elevation`). Limitations:
(1) one point in time — live values move; the analytical findings
(#01–#30) are time-independent, the data rows are dated snapshots.
(2) Lane expanders were verified on 3 of 10 instances + mobile (one
shared component) rather than all 10. (3) The SGE digit-level value
relies on the repo's documented live read of the same venue PDF (the
generic extractor cannot decode its CID fonts — noted in row 18).
(4) The PWA "Install app" button was verified present but not clicked
(it triggers an OS-level prompt the headless session cannot meaningfully
exercise). (5) GPE-S2-28/29 are AGENTS.md drift observations recorded
for the reconciliation commit — AGENTS.md is not editable under this
program's standing constraints.
