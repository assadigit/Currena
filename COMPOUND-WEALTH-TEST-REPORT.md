# Compound Wealth v6 — the full test report (COMPOUND-WEALTH-TEST-PROMPT)

**Tested:** 2026-11-26 (Asia/Tehran / UTC) · **Against:** the live site (https://currena.ir/tools/compound-wealth, deployed from this branch) and the local dev build (localhost:3100) · **Phase A:** test-only over the post-v6 build; every fix Phase A prompted is listed in the defect table with its regression test · **Evidence:** `docs/compound-tests/` (JSON, screenshots, PDFs, VLM inspections) and `docs/compound-samples/` (regenerated from the live production build)

## Verdict per area

**1. Is the maths right? — PASS.** The independent reference engine (`compound_reference_check.py --selftest` all six lines PASS) was replayed against the shipped maths module across its full 1200-scenario grid — **1200/1200 match** (final, put-in, band low/high, today's money, fees, to 0.01%) — and a stratified 15-scenario subset was driven through the **live page's real interface** (amount typed, years typed, cost/fee/every-3-months/increase/starting-amount through More options) with **15/15 match** to the page's own adaptive rounding. The spec's four fixed vectors were driven through the interface too (50,754 / 76,130 / 45,678 + fees 2,400 / 48,785 + fees 800 — all tiles match ±0.5%). The §1.1 regression lock (the live v5 numbers) still passes after every change. Edge cases (empty/0/letters/decimals/Persian digits in the amount, years 0–51, the never-invests fee case, the >1% fee hint, 999,999,999 a month, low>high custom ranges) all stay finite and plain-worded. Invariants hold on every probed scenario (put-in + growth = final; today < future; low ≤ middle ≤ high; monotonicity; the money toggle moves tiles and milestones together). The clock test confirms the start month tracks the browser month across 31 Jan / 29 Feb 2028 / 31 Dec, with milestone dates following, and the country switch swaps currency, chips, cash and figures consistently.

**2. Is the data reliable and accurate? — PASS, with the one same-date rule recorded as not achievable (see the data table and the report's W4 section).** Every row of the figures file was re-opened at its source on 2026-11-26 (Vanguard 2026 Index Chart poster, Damodaran's histretSP.xls, the MSCI World factsheet, the BIS CBPOL and XRU bulk CSVs, the ABS October 2026 release, FRED's CPIAUCNS) and every derived row was recomputed independently — **zero mismatches**; the checked-on date is refreshed to 2026-11-26. Cross-checks against independent published figures (CFS at 30 Sep 2026 — the spec's own recorded reference, its PDF IP-blocked from this sandbox; Vanguard's bank-bill and CPI rows; FRED vs Damodaran; the FX-effect sanity check for the AUD S&P 500 row) all land **under 0.5 points with the causes named**. The two new W3 rows (AU 4.9% to Oct 2026, ABS monthly CPI; US 3.7% to Sep 2026, BLS) were read from their sources in this sitting; the US October 12-month rate does not exist (the 2025 shutdown left no base month), which the page's honesty line does not need to state because it quotes the September figure with its date. The largest unexplained gap across all cross-checks: **0.02 points** (the NY Fed effective-rate vs target-midpoint cash comparison, recorded from the previous sitting's research; not re-read this sitting — every other gap is explained by index or window differences).

**3. Does it do what it is supposed to do? — PASS.** The simplicity contract holds with the percent calculator added: the answer arrives with no interaction; the default screen's interactive inventory is exactly the spec'd set (country chips, the three groups — the Amount|% switch lives inside the amount group — More options, Save as card, plus the tiles' toggle, the what-if selector, the How fold and the breadcrumb); at 390×844, 360×800 and 430×932 the headline and all three groups fit one screen without scrolling (measured: asset chips 750/844, 798/800, 771/932); the two-tap rule holds (~220–260 ms for three one-tap changes); all More-options groups start collapsed; the headline always carries future + today's money and the range always shows the worse figure; the plain-language check passes with **zero banned jargon** and an average sentence length of **11.4 words** (measured over actual sentences — the previous 15.0 average included button labels, and the W7 labels moved the mixed pool to 16.5; the sentence-only pool is the honest reading and is what the spec's "average sentence length" describes). The cards: 10 A4 PDFs (EN/fa × light/dark × costs, plus two % mode) — each exactly one A4 page, text extractable, the % cards show "3% of your salary (A$225 a month)" and **never the salary**; 18 phone-card renders (3 sizes × EN/fa × dark/light + % mode) with no clipping, safe zones kept, minimum font 10px. The VLM raster inspection of the Farsi A4 and phone cards confirms cursive letters correctly joined, Persian numerals, correct RTL mirroring and no tofu. Store nothing holds (no localStorage, no cookies, zero data network calls — the only extra requests are Cloudflare's own injected beacon on the live CDN). Lighthouse on the live page: **performance 98, accessibility 97** (CLS 0, TBT 61 ms). The axe scan (light + dark, EN + fa) reports 14–15 nodes of `color-contrast` and one fa `label-content-name-mismatch` — all pre-existing shared-chrome/token patterns (the site's active-chip blue is 3.29:1, the gold tile 3.71:1), recorded as owner decisions below, not v6 regressions (the new mode pills deliberately reuse the house chip style).

## The test table

| id | what was tested | expected | actual | result | evidence |
|---|---|---|---|---|---|
| M0 | reference engine selftest | six PASS lines | six PASS | PASS | terminal transcript in the report |
| M1 | 1200-scenario grid vs the maths module | all match ≤0.01% | 1200/1200 | PASS | `tests/compound-grid-replay.ts` run log |
| M2 | stratified 15 scenarios through the live UI | page numbers = grid (page rounding) | 15/15 | PASS | same log, `docs/compound-tests/grid.json` |
| M3–M6 | spec vectors 50,754 / 76,130 / 45,678+2,400 / 48,785+800 through the interface | tiles match ±0.5% | all match | PASS | `phase-a-evidence.json` T2-vector-1..4 |
| M7 | amount edge cases: "", 0, abc, 37.5, 37,5, ۲۵۰ | finite, no NaN, clamps | all finite | PASS | same, T3-amount-* |
| M8 | years 0/1/50/51/2.5 | clamps, finite | all finite | PASS | same, T3-years-* |
| M9 | fee ≥ all deposits → never invests | plain message | message shows | PASS | T3-fee-eats-purchases |
| M10 | fee > 1% of a purchase | the 3-month hint | hint shows | PASS | T3-fee-hint |
| M11 | huge amounts (999,999,999/mo, 50y) | finite | finite | PASS | T3-huge-amount |
| M12 | custom range low>high | low ≤ high | swapped correctly | PASS | T3-range-swap |
| M13–M15 | invariants on 3 scenarios | put-in+growth=final etc. | hold | PASS | T4-invariants-* |
| M16 | monotonicity | never falls | 17,100→85,500→254,000 | PASS | T4-monotonic |
| M17 | money-toggle consistency | tiles shrink, milestones follow | consistent | PASS | T4-toggle-consistency |
| M18 | clock rollovers (31 Jan, 29 Feb 2028, 31 Dec) | start month tracks | 2026-01 / 2026-12 | PASS | T5-month-rollovers |
| M19 | country switch (USA) | $, S&P 500 default, US figures | consistent | PASS | T6-country-switch |
| D1 | figures rows re-opened at source | confirm number/period/index | all confirmed | PASS | `figures-research-2026-11-26.md` |
| D2 | derived rows recomputed | ≤0.05 pts | exact match | PASS | same |
| D3 | cross-checks vs independent sources | gaps ≤0.5 or explained | max 0.27 (explained) | PASS | same |
| D4 | all rows end on the same date | one common quarter-end | **not achievable from this sandbox** (CFS/LBMA/RBA/BLS blocked, MSCI login-gated, Vanguard locked to 30 Jun 2026) — every row keeps its own disclosed, freshly re-verified period end | UNVERIFIED (with the full blocked-door record) | same |
| D5 | checked-on date + staleness | refreshed, <18 months | 2026-11-26, not stale | PASS | unit test W4 |
| D6 | the page names each index (W5) | all five + inflation | all named | PASS | browser check 37 |
| B1–B4 | simplicity 12–18 (arrival, exact controls, one screen, two taps, collapsed, honest headline, plain words) | the contract | all hold | PASS | `compound-browser-2026-11-26.json` |
| B5 | routing 19/20 (direct, refresh, 301s, 404, meta, nav, breadcrumb) | all correct | all correct | PASS | same |
| B6 | cards 22 (A4, both modes) | one page, extractable, no salary | 10/10 | PASS | same + samples |
| B7 | cards 23 (phone, both modes) | no clipping, safe zones | 18/18 | PASS | same + samples |
| B8 | Farsi page + cards | RTL, Persian digits, joined letters | confirmed by VLM raster | PASS | `phase-a-vlm-fa-card.json`, `phase-a-vlm-fa-phone.json` |
| B9 | store nothing (21) | no storage, no data calls | clean | PASS | browser check 21 |
| B10 | percent calculator 25–32 | the §5.1.1 behaviours | all pass (unit + browser) | PASS | 94/94 + 64/64 |
| B11 | audit fixes 33–38 | W1–W6 confirmed | all confirmed | PASS | browser checks 33–38 + unit |
| B12 | quality: keyboard, focus, 360px, latency, errors | usable, fast, silent | 35–89 ms updates, zero errors | PASS | phase-a T7/T9 |
| B13 | axe-core light+dark, EN+fa | AA | 14–15 contrast nodes (pre-existing shared tokens, see owner decisions), 1 fa label pattern | PASS-with-findings | `phase-a-axe.json` |
| B14 | Lighthouse performance + accessibility | healthy scores | **98 / 97**, CLS 0, TBT 61 ms | PASS | `phase-a-lighthouse.json` |
| B15 | the five-second test | a stranger understands it | see below | PASS | `phase-a-five-second-390.png` |

**The five-second reading (from `phase-a-five-second-390.png`):** the screen says: "Compound Wealth — see what small, steady investing becomes. Investing A$100 a month for 20 years: you put in 24,000 and it could grow to about 50,800 (about 29,400 in today's money); if it goes worse 40,600, better 62,400; small and steady beats big and late." Below are three obvious controls — how much per month (100, with a "% of salary" alternative), how many years (10/20/30), what to invest in (five named chips) — then a chart, three tiles and two buttons. A stranger's next action: change the amount, or try their own years. Nothing on the screen needs explaining; the one thing a stranger might wonder is what "today's money" means, and the tiles' caption + the How fold answer it one tap away.

## The defect list (Phase A findings → Phase B status)

| # | defect | severity | repro | cause | fix |
|---|---|---|---|---|---|
| 1 | The A4/phone card overlays sat under the site header (z-50 vs z-1000): the print toolbar's controls were unreachable behind the header | high (functionality) | open either card; the toolbar's Dark/Print buttons are covered by the nav | the tools pages moved to the site's own header (z-1000) in the chrome batch; the overlays kept v5's z-50 | **FIXED** — overlays to z-1100; regression: the harness's 22-a4-en-dark (previously timed out) now passes |
| 2 | At 360×800 the three control groups + headline no longer fit one screen (asset chips at 838/800) | medium (simplicity contract 3) | load at 360×800 | the W7 switch row and the add-salary link added ~60 px | **FIXED** — the link rides the chips row, mobile spacing compacted (798/800); regression: browser check 14-360x800 |
| 3 | Entering % mode without a salary changed the results (the inflation default applied before any salary existed) | medium (§5.1.1 "results keep showing the last amount used") | switch to % with no salary typed | the mode flip set the increase unconditionally | **FIXED** — the default now arrives with the salary; regression: 30a-empty-salary-no-empty-state |
| 4 | A hand-set yearly increase of 0 was silently restored to the inflation average when the salary went null and came back | low | enter %, type salary, set increase 0, clear salary, retype salary | the "salary arrived" guard reset on salary-null | **FIXED** — an explicit `increaseTouched` flag (never stomps a hand-set value); regression: 27-share-equals-amount |
| 5 | React #418 hydration mismatch when the browser's month differs from the server render month (seen under the clock test; self-healing; pre-existing since v5) | low | load with the clock one month away from the server | the start-month state initialised from the clock, so SSR text ≠ first client render | **FIXED** — the server passes its own month as a prop; the client corrects post-mount; regression: phase-a T9 (clock walk, zero errors) |
| 6 | Active chips (blue bg, white text) at 3.29:1 and the gold tile at 3.71:1 fail AA 4.5:1 | low (a11y, pre-existing) | axe scan | the site's shared palette tokens, used by every currena.ir page | **OWNER DECISION** — changing the shared tokens restyles every page (outside this tool's remit); the v6-added pills reuse the house style deliberately |
| 7 | The fa language toggle's accessible name («تغییر به انگلیسی») does not contain its visible text ("EN") | low (a11y, pre-existing, site chrome) | axe scan in fa | the site header's own pattern | **OWNER DECISION** — the site chrome is mirrored from the main site |
| 8 | The decimal amount box drops the dot mid-typing ("37.5" becomes "375") | low (pre-existing v5 design) | type 37.5 in the amount box | the amount field is integer-only | **OWNER DECISION** — amounts are whole by the protected v5 convention; the maths handles decimals (grid's 37.5 scenarios verified at the engine level, 1200/1200) |

Phase B re-test: after fixes 1–5, the full surface was re-run on the redeployed live site — **browser harness 64/64, Phase A 32/32, grid replay 1200/1200 + 15/15, maths 94/94, lint green, Lighthouse 98/97**.

## The data-source table

| row | 20y | 30y | period end | basis | exact index (named on the page) | source (re-read 2026-11-26) | status |
|---|---|---|---|---|---|---|---|
| AU Australian shares | 7.2% | 9.0% | 30 Jun 2026 | total return | S&P/ASX All Ordinaries Total Return | Vanguard 2026 Index Chart (poster PDF, re-read) | VERIFIED |
| AU S&P 500 (AUD) | 11.8% | 10.8% | 30 Jun 2026 | total return, AUD | S&P 500 Total Return Index in AUD | Vanguard (re-read) | VERIFIED |
| AU World shares | 9.1% | 8.6% | 30 Jun 2026 | net total return, AUD | MSCI World ex-Australia Net TR (AUD) | Vanguard (re-read) | VERIFIED |
| AU Gold | 11.78% | 8.78% | 31 Dec 2025 | total return | LBMA year-end price × BIS endpoint FX | Damodaran XLS + BIS XRU (re-read, recomputed) | VERIFIED |
| AU Cash | 3.03% | 3.76% | Oct 2026 | policy-rate average | RBA cash rate target | BIS CBPOL (re-read, recomputed) | VERIFIED |
| AU Inflation | 2.76% | 2.71% | Sep 2026 | CPI endpoints | ABS all-groups CPI | ABS (release re-read; long quarterly series retired from the current format — endpoints re-verified arithmetically + Vanguard cross-check 2.7/2.7) | VERIFIED (source-page caveat recorded) |
| AU latest 12m CPI (W3) | 4.9% | — | Oct 2026 | monthly CPI | ABS monthly CPI indicator | ABS latest release (re-read) | VERIFIED |
| US S&P 500 | 10.90% | 10.26% | 31 Dec 2025 | total return | S&P 500 incl. dividends | Damodaran XLS (re-read, recomputed) | VERIFIED |
| US World shares | 15y: 12.20% | — | 30 Oct 2026 | gross total return | MSCI World (USD) | MSCI factsheet (re-read) | VERIFIED (20y/30y login-gated — labelled "15 years") |
| US Gold | 11.27% | 8.39% | 31 Dec 2025 | total return | LBMA year-end price | Damodaran XLS (re-read, recomputed) | VERIFIED |
| US Cash | 1.70% | 2.41% | Oct 2026 | policy-rate average | Fed target midpoint | BIS CBPOL (re-read, recomputed) | VERIFIED |
| US Inflation | 2.53% | 2.52% | 31 Dec 2025 | CPI endpoints | CPI-U (FRED CPIAUCNS) | Damodaran + FRED (both re-read) | VERIFIED |
| US latest 12m CPI (W3) | 3.7% | — | Sep 2026 | CPI-U | BLS September release (read via FRED recomputation + the release text through search/DOL mirror — bls.gov IP-blocked) | BLS | VERIFIED (door recorded) |

## Owner decisions needed

1. **The shared palette's active-chip contrast (3.29:1) and the gold tile (3.71:1)** — fixing these means changing the tokens every currena.ir page shares. Recommendation: darken `--color-currena-blue` for active chip backgrounds (or bold-white-on-navy) site-wide in one sitting, and deepen the gold accent for tile values; both would then pass AA. Left untouched here (the no-restyle rule).
2. **The fa language toggle's label-in-name** — add "EN"/"فا" to the aria-label in the site chrome. One-line change, site-wide. Recommendation: do it.
3. **Decimal amounts** — the amount box is whole-number (v5's protected convention; the dot vanishes mid-typing). Options: accept decimals, or reject them with a small message. Recommendation: leave as is (amounts are whole in the money conventions everywhere else), noted in the report.
4. **The common quarter-end** — not achievable from this sandbox with free, verifiable doors (the full blocked-door list is in `figures-research-2026-11-26.md`). If a 30 Sep 2026 alignment matters, the owner can open the CFS PDF and S&P DJI from a normal browser (the numbers to fetch are listed in the main report §4) and the rows can move in a one-file change.
5. **The MSCI 20/30-year upgrade** (the US World row's 15-year label) — still needs MSCI's login-gated interactive tools, or a published 20/30y source; recorded as before.
6. **The one stronger sentence** stays "Small and steady beats big and late." — unchanged, per Appendix B.

## What remains UNVERIFIED, and exactly what would verify it

- **D4 (one common quarter-end):** needs one of the blocked doors — the CFS PDF (403 from this sandbox), S&P DJI's 20/30y factsheets, MSCI's interactive history, or LBMA month-end prices — any one of which, opened from an unrestricted browser, allows the rows to be re-anchored and re-verified.
- **The NY Fed effective-rate cross-check (0.02 pts)** was recorded from the previous sitting's research and not re-read this sitting (nyfed.org not probed); everything else in the cross-check table was re-read on 2026-11-26.

---

# The v7 pass (2026-11-26) — the tax estimate layer

**Tested:** the same day, immediately after the v7 build, against both the local dev
build and the live production deploy (twice — before and after the aria-label fix).
**Preflight:** every v6 gate re-run unmodified before the feature work and re-run at the
end: reference selftest six lines, 94/94, 64/64, 1200/1200 + 15/15, 32/32, lint — all
green. **Tax off = v6 exactly** is the session's strongest regression: the unit suite
asserts byte-identity of results with `taxRate` absent, 0 and 0.0, and the whole v6
surface re-passed with the tax layer in the tree.

## Verdict

**The maths — PASS.** The reference engine carries the same tax rule
(`r_after = r_net × (1 − tax)`, cost first, then tax) under a `tax_pct` parameter; its
selftest now prints **10 PASS lines** (six v6 unmodified + the tax=0 equality + three
taxed vectors pinned from its own output: 39,524.4 / 29,608.8 / 55,499.1). The new taxed
grid (the same strata at 15/32/45% tax, `docs/compound-tests/grid-tax.json`, v6 grid
untouched) replays **3600/3600** against the maths module, and **21/21** stratified
scenarios through the **live page's real interface** (the tax typed into the Costs box,
the after-tax caption's rate verified at every scenario). Unit tests: **141/141** — the
tax=0 byte-identity lock, the pinned vectors, monotonicity, the cost-then-tax order, tax
on Cash (cost off, tax on), the band under tax, the tax-takes difference, the estimator's
bracket edges (AU every threshold; US all four statuses), the NIIT boundary (one dollar
below vs on the threshold, per status), staleness, clamping and the copy discipline.

**The data — PASS, fully sourced this session.** Every AU value read from the ATO's own
published pages (the resident tax-rates page for the 2026–27 schedule; "What is the
Medicare levy?" for the 2%); every US value read from the IRS's own documents (Rev. Proc.
2025-32's four TY2026 rate tables, cross-checked against news release IR-2025-103; Topic
no. 559 for the 3.8% NIIT and its thresholds). No fallback source was needed; the
retrieval working, URLs and income-year labels are in the report's §11.2 tax data table.
The estimator's semantics (next-dollar rate; levy always added; NIIT at or above the
threshold) are recorded decisions, tested at the boundaries.

**The behaviour — PASS.** The default screen is unchanged (zero tax-shaped elements;
the v6 control inventory holds). The tax UI lives inside More options → Costs, hidden
until the group opens, 44px/16px targets. Manual and guided flows (AU and US), the
caption, the takes line, the How fold's on/off pair, the not-included list, fa + RTL +
Persian digits, dark mode, store-nothing, reload-reset, no URL trace, one-screen fit
with More options open at the three sizes, the full keyboard path, and the A4 card's one
tax line with no income leak — all verified in the harness (**86/86**, 64 v6 + 22 v7)
and live (**13/13**). Zero console errors everywhere. **Lighthouse (mobile, live): 98–99
performance / 97 accessibility** — no regression from v6's 98/97. **axe (light + dark, EN
+ fa, tax UI open): zero new violations** — the 14–15 contrast nodes are the v6
pre-existing shared-token findings (the +1 is the v6 "Every month" active chip newly
visible with the Costs group open), and the v6 fa label-in-name finding on the language
toggle is now FIXED (the v7 label-in-name extra).

## The v7 test table

| id | what was tested | expected | actual | result | evidence |
|---|---|---|---|---|---|
| V0 | preflight: all v6 gates before feature work | green | 6/6, 94/94, 64/64, 1200/1200+15/15, 32/32, lint | PASS | this report §verdicts (v6) + terminal transcripts |
| V1 | reference selftest with the tax parameter | six v6 lines unmodified + taxed lines | 10 PASS lines | PASS | terminal transcript |
| V2 | fixed taxed vectors (pinned from the engine's output) | 39,524.4 / 29,608.8 / 55,499.1 (±0.1%) | match | PASS | unit tests 40 |
| V3 | tax = 0 exact equality | byte-identical to v6 | byte-identical over 6 plan vectors | PASS | unit tests 39 |
| V4 | monotonicity + untouched inputs | higher tax → lower final; put-in/fees/pending fixed | holds | PASS | unit tests 41 |
| V5 | cost-then-tax order | afterTaxRate = (b−cost)×(1−t), ≠ wrong order | holds and differs | PASS | unit tests 42 |
| V6 | tax on Cash (cost off) | net 3.03% × 0.68 | 2.0604% effective | PASS | unit tests 43 |
| V7 | band under tax; compare table consistency | both ends shrink | holds | PASS | unit tests 44 + grid |
| V8 | tax-takes what-if | untaxed − taxed, null when off | exact; null | PASS | unit tests 45 |
| V9 | AU estimator: every bracket edge + the levy | 0/15/30/37/45% + 2% | 2/17/32/39/47% | PASS | unit tests 46 |
| V10 | US estimator: four statuses, bracket edges | 12/22/24/32/35/37% bands | correct per status | PASS | unit tests 47 |
| V11 | NIIT boundary | below ≠ at threshold, per status | 199,999 → 24%; 200,000 → 27.8% (etc.) | PASS | unit tests 47 |
| V12 | staleness + availability | 18-month rule, both countries | fresh, available | PASS | unit tests 48 |
| V13 | config + clamping | TAX_MIN/MAX/STEP/DEFAULT; 70→60 + the one message | holds | PASS | unit tests 49 + harness 40b |
| V14 | the copy | on/off pair, "marginal" never, income never on cards | holds | PASS | unit tests 50 |
| V15 | the taxed grid engine-side | 3600/3600 | 3600/3600 | PASS | `compound-grid-replay.ts` |
| V16 | the taxed grid through the live interface | 21/21 | 21/21 (local + live) | PASS | `compound-grid-replay-tax.ts` |
| V17 | default screen unchanged | zero tax elements, v6 inventory | zero; inventory exact | PASS | harness 39 + 13 |
| V18 | the Costs row (44px/16px, hidden until opened) | spec'd | 44px @ 16px, hidden | PASS | harness 39b |
| V19 | manual tax flow (caption, takes, headline) | after-tax everywhere | 4.8% caption, 11,200 takes | PASS | harness 40 + live |
| V20 | clamping + steppers | 70→60, message, 1-point steps | holds | PASS | harness 40b/40c |
| V21 | AU guided flow | the line, the source, "Use this rate" | exact | PASS | harness 41* + live |
| V22 | How fold on/off + plain language | model, guided line, 6-item list, no "marginal" | holds (13.2 words avg) | PASS | harness 42/42b |
| V23 | US guided flow + statuses + NIIT lines | 22.0% at 90k; 35.8% at 250k single; 4 statuses | exact | PASS | harness 43* |
| V24 | fa + RTL estimator | Persian digits, RTL, the fa How fold | holds | PASS | harness 44* |
| V25 | store nothing, reload reset, no URL trace | nothing stored; tax resets | clean | PASS | harness 46 |
| V26 | one-screen fit with More options open (3 sizes) | no horizontal clip | 360/390/430 all fit | PASS | harness 47 |
| V27 | the keyboard path | type + Enter opens the estimator | works | PASS | harness 48 |
| V28 | A4 card with the tax on | one page, tax line + source, no income | holds | PASS | harness 50 |
| V29 | the live golden path (on/off, manual/guided, AU/US, fa, dark, sticky bar) | 13 checks | 13/13, zero console errors | PASS | `tests/v7-live-verify.ts`, `docs/compound-tests/v7-live-*.png` |
| V30 | Lighthouse (mobile, live) | not below 98/97 | 98–99 / 97 | PASS | `v7-lighthouse.json` |
| V31 | axe on the tax UI (light+dark × EN+fa) | zero new violations | zero new; fa label-in-name fixed | PASS | `v7-axe-tax.json` |

## The v7 defect list (found → fixed → regression)

| # | defect | severity | cause | fix |
|---|---|---|---|---|
| 1 | The clamp note never fired when typing an out-of-range tax (the shared NumberField pre-clamped the value, so the app-level clamp saw an in-range number) | medium (the spec'd "one small plain message") | the v6 house pattern clamps inside the box before `onCommit` | **FIXED** — the clamp moved into the app layer for the tax box; regression: harness 40b (70 → 60 + the message) |
| 2 | The harness's US expectations mis-stated the band at $250,000 (expected the 24% band; the single schedule puts 250k in the 32% band) | test-only | my reading of the schedule | **FIXED** — the test asserts 32% + 3.8% = 35.8%, which the estimator produces; the boundary tests in the unit suite pin every band edge |
| 3 | The fa live-line regexes matched ASCII dots against the Persian decimal separator (٫), failing two checks whose on-screen text was correct | test-only | regex bytes | **FIXED** — patterns now use ٫; the on-screen copy was never wrong |
| 4 | The fa language toggle still failed axe's label-in-name with "(EN)" in the label — axe's matcher requires the visible text as a whitespace-delimited word | medium (a11y, the v6 owner-decision item) | parentheses around the visible token | **FIXED** — the aria-label uses a plain space separator ("تغییر به انگلیسی EN"); regression: `v7-axe-tax.json` shows the fa mismatch gone on the redeployed site |
| 5 | Long browser sessions in one process stalled mid-replay (the sandbox chokes on two heavy sessions back-to-back; goto/fill timeouts) | environment | resource exhaustion with accumulated keep-alive sockets | **FIXED** — the taxed UI replay runs as its own gate file (fresh process, fresh browser, networkidle like v6, one quiet retry per scenario for dev-server pauses; a real failure fails twice and is recorded) |

**Owner decisions carried forward:** the shared site palette's two sub-AA contrast
tokens (site-wide restyle, outside this tool's remit) — unchanged this session; the
fa label-in-name item is now resolved (the toggle carries the visible token in its
accessible name).
