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

# The v8 pass — the outcome visuals (2026-11-27)

**Tested:** 2026-11-27 (Asia/Tehran / UTC) · **Against:** the local dev build (localhost:3100) through every gate, plus the **live site** (currena.ir/tools/compound-wealth, deployed from branch `compound-wealth-v8`) for the golden path, the axe scans, Lighthouse and the chrome walk · **Baseline note:** the v8 preflight found main had never absorbed the v6 branch (the live tool had quietly regressed to the v5 wording); the v8 branch merges v6 back first, after which the recorded v6 baseline (94/94 · 64/64 · 1200/1200 + 15/15 · lint) held exactly before any feature work — the drift and the fix are recorded in the main report §11.1.

## Verdict

**PASS.** The default screen gains exactly one small visual (the share bar under the tiles); everything else enriches existing elements in place, below the fold or behind More options. Every gate green, with the v8 extensions folded into the standing suites.

## The v8 gate record (all on the final state)

| Gate | Result | The v8 extension it now carries |
|---|---|---|
| `python3 compound_reference_check.py --selftest` | six PASS lines | unchanged |
| `bun test tests/compound-maths.test.ts` | **103/103** | +9 tests: growth 0 (drawable, all put in); final < put-in → null; final 0 → null; put-in 0 (all growth); shares sum to exactly 1 on adversarial pairs; the "<1%" rounding (never a misleading "0%"); NaN guards; the future-vs-today pair; the copy keys in both languages |
| `bun tests/compound-grid-replay.ts` | **1200/1200** engine, **15/15** UI, no page errors | the engine loop now asserts drawable-iff-growth≥0 + final>0, shares sum to 100%, and the share equals the row's own ratio on **every** row; the 15 UI scenarios assert the bar's presence, the segment widths ≈ the shares (±1 point), the key line's percents equal the tiles' own numbers (±2 on the tiles' rounded values), and the negative-growth stratum (fee 25 on 50/mo) asserts the bar hidden and the sentence kept |
| `bun tests/compound-browser-harness.ts` | **79/79** | +15 checks v8-1…v8-14 (v8-13 runs light and dark): the bar keyed and proportioned under the tiles; the inventory gains the bar and zero interactive elements; the money-toggle consistency in both views; the "<1%" wording (a 1-year 0.5%-rate plan); the negative-growth fallback (0% rate − 0.2% cost → bar hidden, the plain sentence kept, the growth tile reading −1); the what-if bars (3/2/2 rows, rising/plan-longest shapes, sr sentences, zero interaction, zero title tooltips); the costs before/after pair; the compare bars proportional to the finals' own ratios (S&P/cash 2.33 vs the finals' 2.35); the phone strip (text-free, 7px, sr twin); the A4 bar + key line; fa/RTL (Persian digits, ٪, the put-in segment at the reading start); the label-in-name toggle fix in both directions; the new text's colours are the page's own secondary/tertiary tokens in light and real dark; store-nothing re-checked after every bar interaction |
| `bun run lint` | green on every commit | — |
| `bun tests/compound-axe.ts` (live) | color-contrast 14/13/14/13 (EN-light/fa-light/EN-dark/fa-dark) | **the exact v6 baseline counts** — zero new violations; the fa `label-content-name-mismatch` (1 node at v6) is retired by the chrome fix, the one intended decrease |
| Lighthouse (mobile, live) | accessibility **97**; performance **99/99/98** on repeated runs (the single first cold request measured 95/TBT 207 ms — cold-request variance; repeated TBT 0–83 ms) | FCP/LCP unchanged from v6 (~1.8 s), CLS 0, SpeedIndex 2494 (v6 2617); evidence `v8-lighthouse*.json` |
| The JS delta | **+2,110 bytes (1.1%)** — 198,094 → 200,204 bytes transferred, 10 JS files before and after | measured as the browser's actual transfer from the built worker, pre-v8 tree vs v8 tree, both built with the deploy command |

## The findings this pass recorded (not defects — facts and decisions)

1. **The view-invariant shares (an engine fact, discovered by the v8 tests).** The engine deflates both shown values (final and put-in) by the same (1+inflation)^(months/12), so the today view can never flip growth's sign: the bar's split is identical in both money views, and the honest edge (bar hidden, sentence kept) fires on negative-growth plans — a net rate below zero (e.g. a 0% custom rate under the 0.2% default cost) or the never-invests fee case. The v8 prompt's assumption ("the today view can make real growth negative") was corrected against the grid-verified engine semantics; the unit test locks the fact and the harness asserts the bar matches the tiles' shown numbers in BOTH views. Recorded in the spec §12 test 39 and the main report §11.4.
2. **The costs pair's endpoints.** The card's sentence carries the fees paid, so "before costs" cannot be one of the sentence's numbers; it is the same plan with every cost switched off (fee 0 + yearly cost 0) — one more run of the same engine, no new formulas. This is the surface the v7 tax line will join. Recorded in the spec §5.2.
3. **The card-height rule.** Measured at 360×800: small changes 103→145 px (1.41×), later 93→130 px (1.40×), cash 82→108 px (1.32×) — all under the ~1.5× line, so no slimming and no cuts.
4. **The one-screen rule with the bar.** The share bar adds 50 px below the fold (under the tiles, under the chart); the asset-chips bottom stays 798/800 at 360×800 — identical to v6's recorded number; no sideways scroll at any of the three sizes (harness checks 14-*).
5. **The dark-token check.** The site's dark mode is class-based next-themes, so the harness flips the real `.dark` class rather than emulating a media query (which changes nothing here) or clicking the site's own toggle (which would write the theme to localStorage against the store-nothing rule). The new text's colours are the page's own secondary/tertiary tokens in both themes.

## The live walk (the golden path, fa + dark, the chrome fix)

- EN mobile 390: the bar at put-share 0.473 with the key line and caption; the toggle to today flips the tiles (13,900/15,500/29,400) with the bar consistent and the inflation caption appearing; the three what-if bar sets with their word labels; the phone card's text-free strip with its sr sentence; **zero console/page errors** (`v8-live-01…04`).
- fa + dark mobile 390: the key line «۴۷٪ پول واردشده ۵۳٪ رشد» with Persian digits and ٪, the put-in segment at the reading start (the right edge), the caption «همان دو رنگِ نمودار.», the toggle's accessible name "EN — تغییر به انگلیسی"; the compare bars proportional in fa (`v8-live-05…07`).
- The chrome fix walked on two other tools — `/tools/currency-converter` and `/tools/live-rates`: clean in EN and fa, RTL correct, the toggle's accessible name opening with the visible text in both directions, nothing else moved (`v8-live-chrome-walk-*`).

## What remains as owner decisions (unchanged from v6, plus one retirement)

- **Retired by v8:** the fa language toggle's label-in-name (owner decision #2 from the v6 list) — done, live, verified on three pages.
- Still open from the v6 list: the shared palette's active-chip contrast (3.29:1) and the gold tile (3.71:1) — site-wide token changes, deliberately untouched by the no-restyle rule; the axe counts confirm v8 added nothing to them.
