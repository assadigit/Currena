# Compound Wealth — the build report (phase 1 + the v6 iteration)

**Spec:** `COMPOUND-WEALTH-SPEC.md` (v6 — the pack's version, unzipped into the repo root overwriting v5) · **Branch:** `compound-wealth` (phase 1) → `compound-wealth-v6` (this iteration) · **Built:** 2026-11-25/26 (Asia/Tehran) · **Site:** currena.ir · **Status: v6 complete, live, all gates green** — see §10 for the v6 verification record and `COMPOUND-WEALTH-TEST-REPORT.md` for the full test pass.

## 0. The v6 plan (decided up front, per start-prompt step 2)

Starting state recorded before any change: `python3 compound_reference_check.py
--selftest` all six lines PASS; `bun run lint` exit 0 on `main` (after
`bun install`); `bun test tests/compound-maths.test.ts` 53/53; the live page
walked in a real browser (headline/range/tiles/what-if extracted verbatim,
saved in `docs/compound-tests/live-today-en.png`) — every §1.1 number
re-confirmed on the live page, and the audit items A/B/F plus the W3/W5 gaps
re-confirmed by inspection (the "1% more" wording, the cash figure implying
the 0.2% cost, the symbol-less tiles, the header Tools button that is not a
link, the "Open ↗" pills on internal /tools cards, and the How fold that
names no index and no recent inflation).

The v6 work, in commit order:

1. **Regression lock first:** a new test block in
   `tests/compound-maths.test.ts` pinning the §1.1 live numbers (put-in
   24,000, final ≈50,800, today ≈29,400, worse/better band, crossover month,
   the three milestone months, starting-later 19,600) with the start month
   frozen at 2026-11 — green on the current code before anything changes.
   The cash figure (32,100 with the cost wrongly applied) is pinned the same
   way and then **deliberately re-pinned** to the no-cost figure when W2
   lands, with both values recorded here.
2. **W2 (cash cost)** in `maths.ts`: `APPLY_COST_TO_CASH = false` config
   switch; `computeCompound` takes an `isCash` flag so the cash what-if, the
   cash thin line and the compare-table cash row all use the unreduced rate.
3. **W1 (small-changes wording)** in `maths.ts` + `content.ts` + `app.tsx`:
   money terms in Amount mode ("Investing 10 more a month adds X" — the step
   is 10% of the amount, whole, min 1, plus the "(that is N% more of your
   salary)" suffix when a salary is known and it stays short), percentage
   points in % mode ("Investing 4% instead of 3% adds X"), the "less"
   sentence hidden below 0.5%.
4. **W3 (inflation visible)**: the caption under the tiles in today's-money
   view ("Today's money uses average inflation of X% a year (last 20
   years)." — X follows the editable setting), the How fold's new lines
   (the average used + the latest 12-month figure with source and date), and
   two new figures rows (latest 12-month CPI for AU and US).
5. **W5 (exact index names)**: the How fold lists every asset's exact index,
   read from the figures file's `measures` field so it can never drift.
6. **W6 (polish)**: currency symbol on the tiles (A$/$ before the number in
   English; the currency word after the number in Farsi, matching the
   headline's own fa convention), the header "Tools" item becomes a real
   link to /tools (the ▾ caret stays a separate drawer button), and the ↗
   retired from every internal link (tools index cards, gold-hub).
7. **W7 (percent-of-salary mini calculator)** in `maths.ts` (config: percent
   limits 0.1–50, step 0.5, chips 1/3/5/10; the salary-period conversion;
   §6.6 formulas as pure functions), `content.ts` (the full bilingual
   dictionary for the switch, both modes, the live lines, the % headline,
   the card lines), `app.tsx` (the Amount | % switch inside the Per-month
   group, the salary box that lives in the amount group and is the same box
   everywhere, mode switching that keeps the place, aria-live="polite"),
   `cards.tsx` (% plan lines that show the percent and the monthly amount,
   never the salary). The salary field moves OUT of More options (§5.3).
8. **W4 (figures refresh)**: research pass with the web tools; the aim is
   one common quarter-end for every row (30 September 2026 target), every
   row re-verified against its source, derived rows recomputed, cross-checks
   recorded in §4 below. Whatever cannot be honestly sourced to the common
   date keeps its current period and is listed in the report.
9. **Tests 25–38** added as unit tests where they are maths, and as browser
   checks in the harness where they are UI; the grid replayed against the
   live page after the deploy.
10. **Deploy + PR**: `NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build &&
    bunx wrangler deploy` with the owner's token, live verification, then
    small commits pushed on `compound-wealth-v6` and a PR opened.

Where v6 is silent, the chosen readings (all simplicity-first): the tiles'
currency word in Farsi follows the headline's own fa convention (the number,
then the word); the "Tools" header link keeps the site's dropdown caret as
its own button so nothing restyles; the % mode's "keeps your place" rule
converts both ways when a salary is known and leaves each mode's own state
untouched when it is not (nothing invented); the percent box commits
half-point steps with the stepper and accepts typed decimals; the live line
rounds money to whole numbers for display and keeps full precision for the
maths, exactly as §6.6 says.

---


## 1. The plan (decided up front, per instruction 2)

1. Read the spec, `AGENTS.md`, the gold page, the content module, the tokens, the
   routing and deployment notes. **Gates baseline:** `bun run lint` green on
   `main` before any change (exit 0).
2. Build the pure maths module with its config block, then the maths tests
   (spec §12, tests 1–11) as a `bun test` file — before any UI.
3. Research every figure on the web from published sources only; write the
   figures file with value, period, basis, source name and URL, derivation
   working, and a "checked on" date.
4. Build the routing: real `/tools` and `/tools/compound-wealth` pages served by
   the Worker, 301 trailing-slash canonicalisation, the existing 404 for
   unknown paths, the nav item, the breadcrumb, and the meta/OG tags.
5. Build the page exactly as §5, then the two cards behind one button (§8).
6. Prove "store nothing" with a test; run the simplicity and routing checks with
   a headless browser; print the sample A4 PDFs; screenshot the phone card at
   the three sizes; save samples in `docs/compound-samples/`.
7. Re-run the gates; confirm the gold page is untouched and still passes.
8. Write this report; commit in small commits; push; open a PR.

## 2. What was built

The phase-1 pieces (below) carry the v6 changes noted in §10; the figures
file's "checked on" date is **2026-11-26** and it now carries the two W3
rows (latest 12-month CPI for AU and US) and per-row re-verification notes.

| Piece | File | What it is |
|---|---|---|
| The maths engine | `src/lib/compound/maths.ts` | The pure monthly loop (§6.1) with the config block at the top, the baseline/band rules (§6.2), the AUD conversion (§6.3), milestones (§6.4), date clamping, staleness, the what-if maths, formatting helpers. No imports, no React, no network. |
| The figures file | `src/lib/compound/figures.ts` | Every number the page uses: value, window (EN+fa), period end, basis, source name + URL, derivation note. "Checked on" 2026-11-25. |
| The copy | `src/lib/compound/content.ts` | The full EN + fa dictionary (the gold page's reviewed-dictionary pattern). |
| The page | `src/app/tools/compound-wealth/page.tsx` + `src/components/compound/app.tsx` | The quiet default view (§5.1): country chips, the headline with today's money and the range, the three controls, the SVG chart, the three tiles + money toggle, milestones, the two buttons; the what-if cards (§5.2); the four collapsed More-options groups (§5.3); the How fold + the site's existing disclaimer (§5.4); the sticky mobile bar. |
| The chart | `src/components/compound/chart.tsx` | One inline SVG, three variants: the page chart (drawn 1:1 in measured pixels, stacked areas, the band, the crossover marker, milestone markers, thin labelled lines for the other assets and cash, LTR in both locales, screen-reader summary), the fixed-size ink-palette print chart, and the phone sparkline. |
| The A4 card | `src/components/compound/cards.tsx` | Print-to-PDF from a dedicated sheet: one A4 portrait page always, Light default / Dark option, `document.title` set to `Currena-Compound-Wealth-<yyyy-mm-dd>` during printing and restored, growth-rings decoration, inline SVG chart, five milestones, three tiles, the costs line when it applies, the assumptions box, the strong sentence, the single disclaimer, the footer. No JavaScript PDF library. |
| The phone card | `src/components/compound/cards.tsx` | Full-screen portrait view: top 28% quiet decoration only, bottom 12% tiny footer only, the big final amount, the plan line, the sparkline, the next milestone, the strong sentence, the screenshot hint — corner controls and hint fade away after four quiet seconds so the screenshot is clean; dark default, light option; a centred 9:19.5 frame on desktop. |
| The tools index | `src/app/tools/page.tsx` + `src/components/compound/tools-index.tsx` | A simple list of tool cards: Compound Wealth, plus a link out to the existing converter at its existing URL (currena.ir — untouched). |
| The chrome | `src/components/compound/chrome.tsx` | The tools namespace's own header/footer (same mark, tokens, language and theme toggles), the "← Tools" breadcrumb, and the read-only site-locale mirror. |
| The routing | `worker-entry.ts` (the wrangler entry), `src/proxy.ts`, `wrangler.jsonc`, `next.config.ts` | See §6. |
| The nav item | `src/app/page.tsx`, `src/lib/gold-page/content.ts` | One additive "Tools" link in the gold page's desktop nav (EN "Tools" / fa «ابزارها»). Nothing else on the gold page moved. |
| Tests | `tests/compound-maths.test.ts`, `tests/compound-browser-harness.ts` | 53 maths tests + 39 browser checks; the evidence JSON and the samples commit with them. |
| Samples | `docs/compound-samples/` | 8 A4 PDFs (EN/fa × light/dark × with/without costs), 12 phone-card PNGs (3 sizes × EN/fa × dark/light), page screenshots (EN/fa, light/dark, mobile/desktop, More options, How). |

## 3. Verification record (the gates, before and after)

- `bun run lint`: **green** on `main` before the build; **green** after every commit.
- `bun test tests/compound-maths.test.ts`: **53/53** — spec §12 tests 1–11:
  - the fixed vectors: 100/mo·20y·7% → **≈50,757** (spec ≈50,754 ±0.5%), put in exactly 24,000;
    3% of 5,000 → **≈76,135** (spec ≈76,130), put in exactly 36,000; fee 10 monthly →
    **≈45,681** (spec ≈45,678), fees exactly 2,400; fee 10 every 3 months → **≈48,785**,
    fees exactly 800; the AUD test 10%/0.80→0.40/20y → **13.88%** (±0.05);
  - the fee edge cases (never-invests with the carry rule, the >1% costs hint),
    0% return, the yearly cost, the baseline/band rules (lower-of-two, ≥0.5-point
    rule, single-figure fallback, hidden-unsourced behaviour, staleness),
    date clamping, milestones (thresholds, first-crossing months, today's-money
    lag), extremes (50y·30%·25%, deeply negative rates, zero months, NaN guards).
- `bun tests/compound-browser-harness.ts`: **39/39** —
  - **12** answer on arrival (no empty state, headline shows real numbers);
  - **13** the default screen's interactive elements are exactly the spec'd set
    (country chips, the three controls, More options, Save as card, the tiles'
    money toggle from §5.1.5, the what-if later-years selector from §5.2, the
    How fold from §5.4, the breadcrumb from §3 — nothing else);
  - **14** headline + all three controls together at **390×844, 360×800 and
    430×932** (measured: chips bottom 727/844, 778/800, 751/932; no sideways
    scroll);
  - **15** three one-tap changes of the main question in ~220ms;
  - **16** all four More-options groups collapsed, zero visible fields;
  - **17** the headline always carries future + today's money, the range line
    always shows the worse figure;
  - **18** plain language: banned-jargon list clean, average sentence exactly
    **15 words** on the default screen;
  - **21** nothing written to localStorage/cookies by page use (measured after
    changing amounts, years, assets, opening More options and both cards), and
    zero data network calls (26 resources, all app assets);
  - **22** eight A4 PDFs (EN/fa × light/dark × with/without costs): each
    **exactly one A4 page** (595.92×842.88pt), text extractable with the key
    numbers, saved in `docs/compound-samples/`. The rasterised Farsi card was
    inspected: Persian letters correctly **joined** (cursive shaping), Persian
    digits with «٬»/«٫» separators, RTL layout mirrored, Jalali axis years,
    no tofu or reversed text;
  - **23** twelve phone-card renders (3 sizes × EN/fa × dark/light): no
    overflow, no clipping, top 28% and bottom 12% free of text (after the
    chrome fade), minimum font size 10px;
  - **19/20** routing and meta (see §6);
  - **no page errors** through the whole walk.
- Local **workerd** verification (`wrangler dev` after `NEXT_PUBLIC_BASE_PATH=/gold
  bun run worker:build`): `/tools` 200, `/tools/compound-wealth` 200,
  `/tools/compound-wealth/` **301**, `/tools/` **301**, `/tools/unknown` 404,
  `/gold/tools/compound-wealth` **301** → `/tools/compound-wealth`, `/gold` 200
  with the page intact, assets under `/gold/_next/*` 200, `wrangler deploy
  --dry-run` green. (The one local 500 was `/gold/api/gold` against the empty
  local D1 — the fail-closed path; the live worker's D1 is seeded.)
- The gold page (the whole existing surface): loads clean with the Tools nav
  link added, browser-walked with zero page errors.

### Live verification (after the deploy, 2026-11-25/26)

Deployed with the provided Cloudflare token
 (`NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build && bunx wrangler deploy`,
 which also claimed the two `/tools` zone routes on currena.ir). Verified live:

- `https://currena.ir/tools` → **200**; `https://currena.ir/tools/compound-wealth` →
  **200** (browser-rendered: correct title, the headline with real numbers,
  the chart, zero console/page errors);
- `/tools/compound-wealth/` → **301** to the canonical URL; `/tools/` → **301**;
  `/tools/unknown` → **404**; `/gold/tools/compound-wealth` → **301** to the
  public spelling; `/gold` → **200** with the page intact and the Tools nav;
- the D1-backed data plane is untouched: `https://currena.ir/gold/api/desk`
  returns the live desk day (2026-11-23 briefing, spot 2,499) and
  `/gold/api/gold` answers 200;
- the workers.dev mirror serves `/tools` at 200 as a preview;
- the live golden path walked in the browser: amount → 500, years → 30
  (instant update, “you put in 180,000… about 585,000”), Save as card → phone
  card → close, Save as card → print card → PDF (one page, text extractable);
  live samples: `16-live-en-mobile390.png`, `17-live-phone-card.png`,
  `18-live-a4-card.pdf`.

## 4. The figures — every number, its source and its working

**W4 (2026-11-26): every row below was re-opened at its source and every
derived row recomputed in this sitting — zero mismatches; the tables carry
the same values, now with per-row re-verification notes in the figures
file and the full research record (sources opened, blocked doors,
cross-check gaps) in
`docs/compound-tests/figures-research-2026-11-26.md`.** The two new W3
rows: AU latest 12-month CPI **4.9%** (12 months to October 2026, ABS
monthly CPI, read from the latest release on 2026-11-26) and US latest
12-month CPI-U **3.7%** (12 months to September 2026, BLS September
release — the October 12-month rate was never published because the 2025
shutdown left no base month).

Research date: **2026-11-25** (phase 1) and **2026-11-26** (the W4
re-verification). Every value below was read from the linked source; none
is invented, estimated or recalled. Single figures quoted with attribution
(the spec's sanctioned pattern); derived numbers carry their full working.

### Australia (AUD)

| Row | 20 years | 30 years | Period end | Basis | Source |
|---|---|---|---|---|---|
| Australian shares | **7.2%** | **9.0%** | 30 Jun 2026 | Total return | Vanguard Australia, [2026 Index Chart](https://fund-docs.vanguard.com/AU-Vanguard_Index_Chart_poster.pdf) (Andex Charts) |
| S&P 500 (AUD) | **11.8%** | **10.8%** | 30 Jun 2026 | Total return in AUD, unhedged | Vanguard Australia, 2026 Index Chart |
| World shares (ex-Australia) | **9.1%** | **8.6%** | 30 Jun 2026 | Net total return, AUD | Vanguard Australia, 2026 Index Chart |
| Gold (AUD) | **11.78%** | **8.78%** | 31 Dec 2025 | Total return (gold pays no dividends) | Derived — see below |
| Cash | **3.03%** | **3.76%** | Oct 2026 | Average RBA cash rate target | BIS [policy rates](https://data.bis.org/topics/CBPOL) (source: RBA) |
| Inflation | **2.76%** | **2.71%** | Sep 2026 | CPI endpoints, annualised | ABS [CPI](https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release) |

- **Gold (AUD) derivation (spec §6.3):** USD growth from year-end LBMA prices
  (via [NYU Stern — Damodaran](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datacurrent.html),
  whose gold series is LBMA year-end prices per ounce):
  $513.00 (Dec 2005) → $4,339.645 (Dec 2025) = ×8.4593; $387.00 (Dec 1995) →
  $4,339.645 = ×11.2136. FX = USD per 1 AUD at month ends, inverted from the
  BIS [bilateral exchange rates](https://data.bis.org/topics/XRU) (AUD per USD):
  Dec 1995 1.343187 → **0.744498**, Dec 2005 1.365517 → **0.732323**, Dec 2025
  1.496255 → **0.668335**. AUD growth = USD growth × (FX start ÷ FX end):
  ×9.2693 (20y), ×12.4914 (30y); annualised → 11.78% and 8.78%.
- **Cash:** the mean of 240 (20y: Nov 2006–Oct 2026) and 360 (30y: Nov
  1996–Oct 2026) month-end values of the RBA cash rate target in the BIS
  dataset. Cross-check: Vanguard's chart publishes a bank-bill "Cash" row of
  3.3%/4.0% for the same idea — bank bills track the cash rate plus a small
  spread; the spec's prescribed RBA cash rate is what ships.
- **Inflation:** the annualised change of the ABS quarterly all-groups CPI
  index between the period endpoints — 86.6 → 149.2 (Sep 2006→Sep 2026) =
  2.76%/yr; 66.9 → 149.2 (Sep 1996→Sep 2026) = 2.71%/yr. (The currently
  published long series is the seasonally adjusted one; over these horizons it
  differs from the original index by <0.02 points.) Cross-check: Vanguard
  publishes 2.7% for both 20 and 30 years to 30 June 2026.
- **S&P 500 (AUD) and World (AUD):** used as published (already in AUD) — no
  separate conversion was needed; §6.3's method is implemented, tested, and is
  what produced the gold row.

### USA (USD)

| Row | 20 years | 30 years | Period end | Basis | Source |
|---|---|---|---|---|---|
| S&P 500 | **10.90%** | **10.26%** | 31 Dec 2025 | Total return (dividends included) | [NYU Stern — Damodaran](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datacurrent.html) |
| World shares | **15 years: 12.20%** | — | 30 Oct 2026 | Gross total return | [MSCI World factsheet](https://www.msci.com/documents/10199/255599/msci-world-index.pdf), 30 Oct 2026 |
| Gold | **11.27%** | **8.39%** | 31 Dec 2025 | Total return | LBMA year-end via NYU Stern |
| Cash | **1.70%** | **2.41%** | Oct 2026 | Average Fed target (midpoint) | BIS policy rates (source: Federal Reserve) |
| Inflation | **2.53%** | **2.52%** | 31 Dec 2025 | CPI-U endpoints, annualised | FRED CPIAUCNS via NYU Stern |

- **S&P 500:** compounded from the dataset's published annual "S&P 500
  (includes dividends)" returns: 2006–2025 = ×7.9205 → 10.90%/yr; 1996–2025 =
  ×18.7103 → 10.26%/yr. Cross-check: Vanguard's AUD S&P 500 figure (10.8% over
  30y to Jun 2026) matches this order once the falling AUD is accounted for.
- **World shares:** MSCI publishes 20/30-year figures only inside its
  login-gated interactive tools, so this row uses the longest published window
  of at least 10 years (the spec's labelled fallback): the factsheet's
  cumulative gross-return chart, 100 → 562.23 over Oct 2011–Oct 2026 = ×5.6223
  → 12.20%/yr. The same factsheet publishes since-31-Dec-1987 = 8.98%/yr and
  10 years = 13.50%/yr (recorded in the figures file note for context). The
  page labels this row "15 years". **To upgrade:** MSCI's end-of-month
  interactive history (msci.com index tools, free registration) publishes the
  20/30-year annualised returns — readable from a normal browser, not
  fetchable headlessly without an account.
- **Gold:** $513.00 → $4,339.645 (Dec 2005→Dec 2025) = 11.27%/yr; $387.00 →
  $4,339.645 (Dec 1995→Dec 2025) = 8.39%/yr. Cross-check: this repo's own
  long-view series (validated against LBMA annual averages within 1%) carries
  2005 = 444.74 and 2025 = 3,441.50 as annual averages — a smoother basis, same
  story.
- **Cash:** the mean of 240/360 month-end values of the Fed's target rate
  (midpoint of the range since Dec 2008). Cross-check: the NY Fed's effective
  fed funds rate over the same 20-year window averages 1.68% — within 0.02
  points.
- **Inflation:** compounded from FRED CPIAUCNS annual rates: 2006–2025 =
  ×1.6475 → 2.53%/yr; 1996–2025 = ×2.1123 → 2.52%/yr.

### Rows not filled, and what would fill them

**No chip is hidden** — every asset row has at least one sourced figure. Two
honest substitutions to know about:

1. **"ASX 200" is served as "Australian shares" (All Ordinaries).** The spec
   names the chip ASX 200; the only legally sourceable published 20- and
   30-year total-return figure found is Vanguard's All Ordinaries TR row
   (S&P DJI's own site blocks automated access from this sandbox; investing.com
   forbids scraping; no fund factsheet publishes a 20/30y ASX 200 figure —
   iShares IOZ / SPDR STW / Vanguard VAS all stop at 10 years + since-inception
   ≈ 2001). The chip is labelled "Australian shares" (the spec's own card-copy
   wording) and the method note names the index. **To upgrade to ASX 200:**
   read the S&P/ASX 200 Total Return factsheet at spglobal.com/spdji from a
   normal browser (their 20/30-year annualized TR numbers) and replace the
   `australian-shares` row's figures + note in `src/lib/compound/figures.ts`.
2. **"World shares" (USA) is a 15-year figure.** See above.

Also for the record: **RBA's own site (rba.gov.au) blocks this sandbox's IP**
(403), which is why the cash rate and FX came via the BIS (whose AU series is
sourced from the RBA) — same official numbers, different door.

## 5. Config values chosen (spec §11, updated to v6)

All in `src/lib/compound/maths.ts`'s config block, each with a plain-English
comment: milestones 5k→10M (11 lines), 3 on the page / 5 on the cards; amount
100 default with chips 50/100/200/500; years 20 default, chips 10/20/30, box
1–50; yearly cost 0.2% (editable 0–3%); what-if points 2 (editable 0.5–5);
band threshold 0.5 points; inflation 0–15%; yearly increase 0–15%; salary
share 3% default with **percent limits 0.1–50% (§11's v6 values), step 0.5,
chips 1/3/5/10**; salary period default **per year**; staleness 18 months;
country default AU; fee-warning share 1% of a purchase; and the W2 switch
**`APPLY_COST_TO_CASH = false`**. The default inflation per country comes from
the figures file (AU 2.76%, US 2.53%).

## 6. Routing decisions

- **Public URLs:** `/tools` and `/tools/compound-wealth` are served by this
  Worker at the public paths. Next 16 forbids internal rewrites outside the
  basePath (and basePath-mounted proxies never see raw outside paths), so the
  wrangler entry is now `worker-entry.ts` — a ~90-line wrapper (config block at
  the top) that imports the generated OpenNext worker and owns the `/tools`
  namespace: `/tools/*` is internally rewritten onto the `/gold`-mounted routes
  (the browser URL never changes), `/tools/…/` 301s to the canonical no-slash
  URL, `/gold/tools/*` 301s to the public spelling, and unknown `/tools/*`
  flows to the app's own 404. The gold namespace passes through untouched.
  `wrangler.jsonc` also claims the `currena.ir/tools` and `currena.ir/tools/*`
  zone routes.
- **Dev parity:** the sandbox dev server (no basePath) serves `/tools/*`
  natively; `src/proxy.ts` (Next 16's middleware successor) gives it the same
  301s, scoped to `/tools` only so `/gold`'s own 308 normalisation is
  unchanged.
- **Verified:** on local workerd — 200/200/301/301/404/301/200 across the
  seven canonical cases, title + canonical correct, assets 200.
- **Language:** mirrors the site's own handling exactly — in-page toggle
  (فا/EN), SSR renders English/LTR first (hydration-safe, like the gold page),
  `dir`/`lang`/`document.title` switch with the locale, Persian digits via
  Intl, Jalali dates via `fa-IR-u-ca-persian`, LTR chart axes. One deliberate
  difference, recorded here: the gold page persists its locale choice in
  localStorage; this tool is forbidden from storage, so it **reads** the site's
  stored choice on load (when present) and never writes — the toggle is
  per-visit. No language URLs exist on the site, so no hreflang was added.
- **Meta:** static English `<title>`/description (the first-paint language),
  canonical to the public URL, OG/Twitter with the site's existing default
  image (`https://currena.ir/icons/icon-512.png`), no noindex. There is no
  sitemap.xml on this worker (the root sitemap, if any, belongs to the
  currena-api worker — outside this repo), so none was added; adding the two
  URLs to currena-api's sitemap is a one-line change on the main site if it
  has one.
- **Nav:** a real "Tools" link added to the gold page's desktop nav (additive;
  the page's own section nav, sections and everything else untouched), the
  tools pages carry the "← Tools" breadcrumb, and the tools index links out to
  the converter at its existing URL.

## 7. Decisions log (where the spec was silent, or simplicity won)

The phase-1 decisions (1–10 below) stand; the v6 decisions follow them.

1. **The tiles' money toggle** (§5.1.5's own element) stays on the default
   screen — it is part of the tiles, not a control group; test 13's assertion
   was written to the full spec'd set accordingly.
2. **"1% more adds X, 1% less loses Y"** — superseded by W1 (v6): the card
   now speaks money ("Investing 10 more a month adds X") or percentage
   points; the linearity note survives only in the maths tests.
3. **The chart is hand-built SVG** (the house Sparkline pattern), not Recharts:
   it must render identically inside the print card and the phone card with no
   timing/animation concerns, and the 1:1 measured-pixel drawing keeps labels
   legible at every width. No new libraries.
4. **The phone card's corner controls and hint fade after four quiet seconds**
   (reappearing on any interaction) so the screenshot the owner takes is clean
   — the spec's safe zones are about the screenshot, and visible buttons would
   sit in them.
5. **The A4 print flow** uses `window.print()` with a `body.cw-printing` class
   (the repo's digest-sheet pattern, portal-mounted so the sheet is a direct
   child of body) — the same CSS the browser's own Print → Save as PDF uses;
   the harness generates the samples with Playwright's A4 `pdf()` for
   reproducibility. (v6: the overlay now sits at z-1100, above the site
   header.)
6. **The what-if "Starting later" selector defaults to 5 years** (spec default)
   with 1/3 available as small chips inside the card.
7. **Percent-mode's default yearly increase** follows the spec: 0 in fixed
   mode, the country's inflation average in share mode — v6 refined the
   timing: the default arrives when a salary is actually live, and a
   hand-set value is never replaced.
8. **`/gold/tools/*` 301s to `/tools/*`** so the internal and public spellings
   never coexist (canonical tags agree).
9. **The years-of-salary line** reads "The result is about N years of your
   salary" — v6 moved it to today's money ÷ a year of salary, per §6.6's
   formula.
10. **The tools index's converter card** links to `https://currena.ir/` (the
    converter's existing URL — a hash route lives under it), external, so
    nothing on the main site moves.

**The v6 decisions** (where the spec was silent, or simplicity won):

11. **The tiles' currency in Farsi** follows the headline's own fa convention
    (the number, then the currency word «دلار استرالیا»/«دلار آمریکا» at a
    smaller size); English gets the A$/$ symbol before the number, exactly as
    W6 asks.
12. **The header "Tools" link** (W6) is a real `/tools` anchor whose ▾ caret
    remains its own button opening the site's side drawer — nothing restyles,
    both paths work.
13. **The % mode's "keeps your place" rule** converts both ways when a salary
    is known; without one, each mode keeps its own state and the plan keeps
    the last amount actually used (the amount state mirrors the computed
    monthly amount while share mode is live). Nothing is invented.
14. **The % mode's deferred default-increase** is guarded by an explicit
    `increaseTouched` flag: the inflation default applies when share mode goes
    live with the increase still at the amount-mode default, and never
    stomps a hand-set value (including an explicit 0).
15. **The salary period switch converts the money** (90,000 per year ↔
    7,500 per month, rounded to whole numbers — the page's money convention);
    the round trip is exact for salaries divisible by 12.
16. **The small-changes card's "less" sentence hides** when the lower percent
    would be under 0.5% (per §5.2) or the amount would go negative.
17. **The percent box's clamp** shows the repo's one plain message
    ("outside the allowed range") rather than silently correcting.
18. **The start month hydrates from the server's own month** (a prop from the
    page) and corrects post-mount — closing the month-boundary hydration
    mismatch the clock test found (pre-existing since v5).
19. **Test 27's "all numbers"** compares the plan's outputs (headline numbers,
    tiles, range, milestones, later-start, cash) — the small-changes card is
    mode-specific by §5.2's own design (a 1-point step vs a 10%-of-amount
    step), so its numbers differ between the two modes by design.
20. **The plain-language sentence average** is measured over sentences
    (paragraph/heading text); control labels and chips are not sentences —
    the jargon scan still covers every visible word.
21. **Decimal amounts** stay whole-number in the UI (the protected v5
    convention); the engine handles decimals (the grid's 37.5 scenarios
    verified 1200/1200 at the engine level).
22. **The axe contrast findings** (active chips 3.29:1, gold tile 3.71:1) are
    pre-existing shared-chrome tokens; fixing them restyles every currena.ir
    page, so they are recorded as owner decisions, not changed here.

## 8. What is unfinished / needs the owner

1. **Deploy: done** — v6 is live (deployed 2026-11-26 with the owner's
   token; every check on this branch re-run against the production build).
   Re-run by hand: `NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build &&
   bunx wrangler deploy` with `CLOUDFLARE_API_TOKEN` set.
2. **The main site's nav** (currena-api — outside this repo) has no Tools
   link; the gold page's and every tools page's headers have one. One line
   on the main site's nav when the owner wants it there.
3. **ASX 200, MSCI 20/30-year and the common quarter-end** — see §4's "Rows
   not filled" and the W4 record: the doors that would supply 30-Sep-2026
   quarter-end figures (CFS PDF, S&P DJI, MSCI interactive, LBMA, RBA, BLS)
   are IP-blocked or login-gated from this sandbox; the exact numbers to
   fetch and where are listed there.
4. **The sitemap** — no sitemap on this worker to extend (§6).
5. **The owner-decisions list** in `COMPOUND-WEALTH-TEST-REPORT.md` (palette
   contrast, the fa label-in-name, decimal amounts, the quarter-end
   alignment, the MSCI upgrade).

## 9. How to roll back

- **v6 code:** `git revert` the `compound-wealth-v6` commits on this branch
  (the v6 pack, the regression lock, W2, W1, W3/W4/W5/W6, W7, the test
  surface, Phase A fixes — each is one small, self-contained commit), or
  merge `main` back over the branch. The v6 commits touch the shared site
  chrome in exactly two places (the Tools nav anchor and the retired ↗
  arrows) — both trivially revertible.
- **Worker:** redeploy the previous tree (`git checkout main &&
  NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build && bunx wrangler deploy`)
  — the `/tools` zone routes stay claimed (they are the same routes).
- **No data anywhere:** the tool still stores nothing — there is nothing to
  clean up on any device or server.

## 10. The v6 verification record (2026-11-26)

Every number below was produced on this branch's final state, run against
**both** the local dev build and the live production deploy (twice — before
and after the Phase B fixes):

- `python3 compound_reference_check.py --selftest` — six lines PASS.
- `bun test tests/compound-maths.test.ts` — **94/94** (spec §12's tests
  1–11, the W1 wording maths, the W2 switch, the W3/W5/W6 figure checks and
  the W7 conversion set 25–32, plus the v6 regression lock of §1.1's live
  numbers).
- `bun tests/compound-browser-harness.ts` — **64/64** on the live build
  (simplicity 12–18 incl. the three one-screen sizes, the exact control
  inventory with the W7 set, routing/meta, storage, ten A4 cards, eighteen
  phone renders, the W7 browser set, the audit set 33–38, zero page errors).
- `bun tests/compound-grid-replay.ts` — the reference engine's 1200-scenario
  grid: **1200/1200** against the maths module, **15/15** driven through the
  live page's real interface.
- `bun tests/compound-phase-a.ts` (live + local) — **32/32**: the spec
  vectors through the interface, the edge cases, the invariants, the clock
  rollovers, the country switch, keyboard/focus/latency (35–89 ms), zero
  console errors.
- `bun tests/compound-axe.ts` — light+dark × EN+fa scanned; the findings
  (all pre-existing shared tokens) recorded with the exact ratios in the
  test report's owner-decisions list.
- Lighthouse (live): **performance 98, accessibility 97** — CLS 0, TBT 61 ms
  (`docs/compound-tests/phase-a-lighthouse.json`).
- `bun run lint` — green on every commit.
- The full test pass is written up in `COMPOUND-WEALTH-TEST-REPORT.md`
  (Phase A's three verdicts, the test table, the eight-entry defect list —
  five fixed with regression tests, three owner decisions — and the
  data-source table with verification status).
- **Insights, the converter and the narrator are untouched** (the only
  shared files changed are the site chrome's Tools anchor and the retired
  ↗ pills; the gold page's own tests and walk still pass in the harness's
  19c check).

## 11. The v8 pass — the outcome visuals (2026-11-27)

The owner's direction: the tool already explains its outcomes in words and
numbers; show more of them visually, so a visitor understands the outcome at
a glance. The audit (2026-11-26, recorded in the v8 prompt) found the chart
already visually rich — so this pass is deliberately narrow: **exactly one
small new visual on the default screen** (the share bar), everything else
enriching elements that already exist, in place, below the fold or behind
More options.

### 11.1 The baseline drift this session found and fixed first

The preflight (run the v6 gates unmodified on a branch from main) surfaced a
real drift, recorded here before any feature work: **main had never absorbed
the v6 branch.** Main carried the tools suite, the site chrome and the later
gold-page batches, but its compound tool was still the v5 code (53 maths
tests, the v5 wording — the live page was even showing the retired "1% more
adds" sentence, because the gold-page batches' deploys had quietly
overwritten the v6 compound deployment). The fix on this branch:
`compound-wealth-v8` (cut from main) merges `compound-wealth-v6` — a clean
merge, the two lines having touched no common file since their fork point
142f5dc0. After the merge the recorded v6 baseline held exactly:

- `python3 compound_reference_check.py --selftest` — six PASS lines.
- `bun test tests/compound-maths.test.ts` — **94/94** (v6's set, unmodified).
- `bun tests/compound-grid-replay.ts` — **1200/1200** engine + **15/15** UI.
- `bun tests/compound-browser-harness.ts` — **64/64** (v6's set, unmodified).
- `bun run lint` — green.

Nothing in the v8 feature work touches those suites' subjects; they still
pass on the final state (see §11.5).

### 11.2 What was built

| Piece | Where | What it is |
|---|---|---|
| The split helper | `src/lib/compound/maths.ts` | `splitFinal(final, putIn)` → null when not drawable (growth < 0 or final ≤ 0 — the honest edge), else the two shares summing to exactly 1; `shareRounded` applies the "<1%" rule (shares under 1%, but above zero, never render as a misleading "0%"). Config comment at the top of its section. |
| The bars | `src/components/compound/bars.tsx` (new, plain divs, no libraries) | `ShareBar` (page/print/phone variants — the same two chart tokens on the page, ink-safe pair on the A4 card, the caller's dark/light colours on the phone) and `MiniBars` (the what-if cards' thin labelled rows on one common scale per card). Every graphic is `role="img"` with its sentence as the aria-label — the one pattern everywhere. |
| The default screen | `app.tsx` §5.1.6 | The slim full-width two-segment bar directly under the three tiles: put-in in the chart's put-in token, growth in the growth token (so the bar doubles as the chart's key); the key line in words ("47% Money you put in · 53% Growth", reusing `chart.putInLabel`/`chart.growthLabel`); one short caption ("The same two colours as the chart."). Shares from the SHOWN values, so it follows the money toggle. Hidden honestly (with one plain sentence kept) when growth is negative. |
| The what-if cards | `app.tsx` §5.2 | One shared MiniBars set per card: small changes → 3 rows (a bit less / your plan / a bit more), later start → 2, cash → 2, costs → 2 (before/after). Endpoints are the sentence's own numbers (base ± its deltas); rows whose sentence is hidden drop out. Words only, sr sentence per card, no interaction, no animation. |
| The compare table | `app.tsx` §5.3 | One slim 4px proportional bar under each final value, one scale computed across the rows (the rows are now computed once). Current asset in gold, others in the muted token. |
| The phone card | `cards.tsx` | A 7px two-segment strip under the big number — text-free (screenshot-safe), the card's own dark/light colours, sr twin on the strip. |
| The A4 card | `cards.tsx` + `globals.css` | The bar under the tiles in the ink-safe palette (#47525d / #a87e1c; lighter inks in the dark card style), the two percentages in one caption line. |
| The copy | `content.ts` | EN + fa: the caption, the sr sentence, the hidden line, "<1%"/«کمتر از ۱٪», the eight row labels, the four card sr sentences — plain, calm, RTL-correct, Persian digits at render. |
| The chrome fix | `src/components/site/chrome.tsx` | The fa language toggle's label-in-name (the test report's owner decision #2): the visible "فا"/"EN" now opens the accessible name — one line, no visual change. |

### 11.3 The audit table, and what this pass did about each gap

| Audit finding | What v8 did |
|---|---|
| The tiles state the parts but nothing shows their proportion; the chart's two area colours have no key | The share bar: the proportion AND the key, in one quiet element |
| The what-if cards are the most persuasive facts, prose only | The micro-bars: shape behind every sentence, below the fold |
| The compare table is numbers only | The slim proportional bars (kept: fits 360px without widening) |

### 11.4 Decisions, each with its reason

1. **The percentages live in the caption line, not on the bar.** A 47/53
   split at 360px cannot fit readable labels on 169px of bar; the key line
   under the bar carries both percentages in words with the two colour dots,
   which is also the chart key the page never had.
2. **`role="img"` + aria-label everywhere** (not aria-hidden + sr-only twin
   text): one pattern, one code path, the sentence travels with the graphic
   on the page, on the phone strip and on the A4 card.
3. **Solid tokens, not the chart's 16–22% alpha fills.** The bar is 10px
   tall; at the chart's alpha the growth segment would read as a tint. Same
   tokens, full strength — the key dots match, the calm is kept by size.
4. **The toggle follows by recomputation, and a discovered engine fact is
   recorded: the shares are view-invariant.** The engine deflates both shown
   values by the same (1+inflation)^(months/12), so today's money can never
   flip growth's sign — the honest edge fires on negative-growth plans (a
   net rate below zero, the never-invests fee case), not on the money
   toggle. The v8 prompt's assumption ("the today view can make real growth
   negative") was corrected against the grid-verified engine semantics; the
   unit test locks the fact and the harness check asserts the bar matches
   the tiles' shown numbers in BOTH views.
5. **The costs pair is the one engine-computed endpoint set.** The card's
   sentence carries the fees paid, so "before costs" cannot be a sentence
   number; it is the same plan with every cost switched off
   (`feePerPurchase: 0, yearlyCost: 0`) — one more engine run, no new
   formulas, no hand-tuned widths. (This is also the surface the v7 tax
   line will join.)
6. **The phone strip is text-free; the A4 bar carries the percentages.** The
   phone card is a screenshot (nothing that can clip); the A4 card is paper
   (the key line costs 3mm and keys the print chart).
7. **The compare bars kept.** Measured: the bar sits under the number inside
   the existing cell — zero width added at 360px (the table keeps its own
   horizontal scroll, unchanged since v5).
8. **The what-if cards' height rule.** Measured at 360×800: small changes
   103→145px (1.41×), later 93→130px (1.40×), cash 82→108px (1.32×) — all
   under the ~1.5× line, so no slimming or cuts were needed.
9. **The one-screen rule.** The share bar adds 50px BELOW the fold (under
   the tiles, under the chart); the measured asset-chips bottom stays
   798/800 at 360×800 — identical to v6's recorded number. No sideways
   scroll (scrollWidth 360).
10. **The dark-token check flips the site's real `.dark` class**, not
    Playwright's colour-scheme emulation (the site is class-based
    next-themes; emulating the media query changes nothing, and clicking
    the site's own toggle would write the theme to localStorage against the
    store-nothing rule).

### 11.5 Verification (the v8 gates, local)

- `bun test tests/compound-maths.test.ts` — **103/103** (the 94 v6 tests
  unmodified + 9 v8 tests: growth 0, final<putIn, final 0, putIn 0, the
  sum-to-1 invariant, the <1% rounding, NaN guards, the future-vs-today
  pair with the honest edge, the copy keys in both languages).
- `bun tests/compound-grid-replay.ts` — **1200/1200** engine (now also
  asserting drawable-iff-growth≥0 and shares-sum-to-100% on every row) +
  **15/15** UI (now also asserting the bar's presence, segment widths ≈
  shares, and the key line's percents equal to the tiles' own numbers; the
  negative-growth stratum asserts the hidden line).
- `bun tests/compound-browser-harness.ts` — **79/79** (the 64 v6 checks
  unmodified + 15 v8 checks: v8-1..v8-14 plus the dark/light token pair).
- `bun run lint` — green on every commit.
- Store-nothing re-checked after every bar interaction (v8-14); no data
  network calls (the v6 21-checks, re-run on every harness pass).

### 11.6 The live verification (after the deploy) — see §11.7 for the numbers

Deployed exactly as v6 did (`NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build
&& bunx wrangler deploy`). Verified live: the golden path with the bar and
the toggle, fa + dark, mobile screenshots into `docs/compound-tests/`, zero
console errors, the fa toggle fix walked on two other tool pages, Lighthouse
(mobile) and the live axe scans. The evidence lines are in §11.7.

### 11.7 The live evidence (measured after the 2026-11-27 deploy)

- **Live deploy: done** — `NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build &&
  bunx wrangler deploy` (the deploy confirmed at 100% traffic, 2026-11-27
  11:20 UTC). The golden path walked on the production page in a real
  browser: the bar present under the tiles at put-share 0.473 with the key
  line "47% Money you put in · 53% Growth" and the caption; the money toggle
  flipping the tiles to today's money (13,900/15,500/29,400) with the bar
  still matching the tiles' own 47%; the three what-if bar sets with their
  words; the phone card's text-free strip with its sr sentence; the compare
  bars proportional in fa. Screenshots: `docs/compound-tests/v8-live-01…07`
  (EN mobile 390, the today view, the what-if bars, the phone card, fa+dark
  at 390, the fa bar close-up, the fa compare bars). **Zero console/page
  errors.**
- **The fa toggle fix walked on two other tools** — `/tools/currency-converter`
  and `/tools/live-rates`: both load clean in EN and fa, RTL correct, and
  the toggle's accessible name now opens with the visible text in both
  directions ("فا — Switch to Farsi" / "EN — تغییر به انگلیسی"); nothing
  else moved (screenshots `v8-live-chrome-walk-*`).
- **Lighthouse (mobile, live):** accessibility **97**; performance **98–99
  across repeated runs** (99 / 99 / 98 after the first cold request — the
  single first hit measured 95 with TBT 207 ms, the known run-to-run
  variance of one cold CDN request; the repeated runs show TBT 0–83 ms).
  FCP/LCP unchanged from v6 (~1.8 s from this sandbox), CLS 0, SpeedIndex
  2494 (v6: 2617). Evidence: `docs/compound-tests/v8-lighthouse.json` and
  `v8-lighthouse-2/3/4.json`. At or above the v6 record of 98/97.
- **The JS delta:** the compound page's client JS, measured as the bytes
  the browser actually transfers from the built worker (pre-v8 tree
  eaa63a86 vs the v8 tree, both built with the deploy command): **10 JS
  files before and after; 198,094 → 200,204 bytes — a delta of +2,110
  bytes (~2.1 KB, 1.1%)**, the new bars module and its wiring. Negligible.
- **axe (light + dark, EN + fa, live):** `color-contrast` 14/13/14/13 nodes
  — **the exact v6 baseline counts** (all pre-existing shared-chrome and
  token patterns, recorded as owner decisions in the v6 test report) — and
  the fa `label-content-name-mismatch` (1 node at v6) is **retired** by the
  chrome fix: the one intended decrease, zero new violations. Evidence:
  `docs/compound-tests/phase-a-axe.json` (re-run on the live v8 build).

### 11.8 The cut list (with reasons — the spec's Appendix A.1)

- A donut/pie of the final composition — the straight bar already matches
  the chart's stacked semantics; pies read worse at small sizes and for
  screen readers.
- Hover/touch tooltips on the chart — desktop-biased, a11y and payload cost;
  the milestone dots, end labels and sr-only summary already anchor the
  numbers.
- A second chart or a "stop investing" line — clutter; the put-in layer
  already is the no-growth path, and the later-start card covers waiting's
  cost.
- A year-by-year numbers table — more numbers, not more understanding; the
  maths is already grid-verified.
- Animations on the chart or bars — against the calm discipline and the
  reduced-motion rules.
- A goal/target visual — a new input; against the three-control default
  screen.

### 11.9 The v7 ordering decision (recorded, not re-decided)

The v7 tax prompt stays committed on branch `compound-wealth-v7` (with its
rebase addendum at the top); **v8 ships first**, and v7 branches from main
after this pass, joining the v8 surface at three points: the Costs row
unchanged, the share bar caption when tax is on, and the "tax takes" line
joining the costs card's bars. Nothing in v8 starts tax work.

### 11.10 Rollback

Everything v8 added is additive and self-contained: `git revert` the v8
commits on `compound-wealth-v8` (or `git checkout` the pre-v8 sha eaa63a86
and redeploy). The merge commit itself (fb9120dc) may stay or go with it;
the v6 tool it restored is the live baseline the owner recorded. The chrome
fix is one line, trivially revertible on its own.
