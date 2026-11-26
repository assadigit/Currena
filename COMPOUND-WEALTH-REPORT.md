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
   fetch and where are listed there. **The v7 retry (§11.4) opened the CFS
   PDF directly — the 20-year cross-checks are now first-hand — but the
   30-year quarter-end figures still exist at no open door (CFS publishes
   20 years only; Vanguard is June-ending), so the per-row period ends stay.**
4. **The sitemap** — no sitemap on this worker to extend (§6).
5. **The owner-decisions list** in `COMPOUND-WEALTH-TEST-REPORT.md` (palette
   contrast, the fa label-in-name — **resolved in v7**, see §11.3 — decimal
   amounts, the quarter-end alignment, the MSCI upgrade).

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

## 11. The v7 session (2026-11-26): the tax estimate layer and the trust extras

The owner's v7 direction (committed as `COMPOUND-WEALTH-V7-PROMPT.md`): make the tool
more reliable, accurate and trustworthy, add income/savings tax estimates for Australia
and the USA, keep the mobile experience excellent — and above all stay simple. Taxes were
out of scope in v6 (spec §2 and Appendix A); **moving them in as a small, optional,
clearly-labelled estimate behind More options was the owner's decision this session**,
recorded here and in the decisions log below.

### 11.1 What was built

**The engine — one rule, applied everywhere.** `PlanInput` gained an optional `taxRate`
(decimal, default 0 — every existing call site compiles and passes unmodified). After the
existing cost rule, `r_after = r_net × (1 − taxRate)`; the monthly rate derives from
`r_after` exactly as before. Every rate the engine touches — the baseline, both band
ends, custom rate and range, the compare table, Cash, every what-if — passes through the
same transformation, so the whole page stays consistent with one switch. Deposits, the
purchase fee and the pending rule are untouched: tax never touches money you put in, only
growth. **Cash growth is taxed** (bank interest is taxable income) while the fund cost
stays off Cash (`APPLY_COST_TO_CASH = false` unchanged) — two separate rules, stated
plainly in the How fold. New on the result: `afterTaxRate` (the effective after-tax
annual rate, for the caption and the How fold) and `whatIfTaxTakes` (the same projection
run with the tax off, differenced on the finals — the "Tax (estimate) takes X." line,
beside the costs line, only while the tax is on). Config additions, each with a
plain-English comment: `TAX_MIN = 0`, `TAX_MAX = 0.60` (a ceiling, not a suggestion),
`TAX_STEP = 1`, `DEFAULT_TAX = 0`.

**The tax data file — `src/lib/compound/tax.ts`**, modelled on figures.ts: a marked
configuration block, one `TAX_CHECKED_ON` date, per country the latest published
individual income-tax schedule the estimator uses plus exactly the named extras (AU: the
Medicare levy; US: the four filing statuses and the net-investment-income threshold and
rate), each with source name, source URL, income-year label and a plain note. One pure
function, no engine coupling: `estimateTaxOnEarnings(country, income, status?)` →
`{ rate, breakdown, yearLabel, sourceName, sourceUrl, checkedOn }`. The engine never
reads tax.ts — it only ever sees `PlanInput.taxRate`.

**The interface — all inside More options → Costs; nothing new on the default screen.**
One new row, "Tax on your growth (estimate)" — off until set, a rate box (clamped 0–60%
with one small plain message; the clamp lives in the app layer so the message actually
fires) with ± steppers stepping 1 point, 44px targets and 16px text. A small link
"Estimate from my income" expands inline (no modal): an income box ("a rough yearly
income is fine — it only sets the bracket"; session state only — never on a card, never
in the URL, never stored), plus for the USA a filing-status control offering exactly the
statuses the data file carries (default: single). One plain live line,
`aria-live="polite"`: "At that income, about N% of extra investment earnings goes to tax:
(parts in words)." with the source and its date on a small line, and one button "Use this
rate". Full precision internally; the line rounds to 0.1 points. When the tax is on: the
headline, tiles, chart, milestones, what-ifs and compare table simply become after-tax,
plus one small caption in the W3 style under the tiles ("After tax at N% a year
(estimate).") — no before/after split on the main screen (the How fold may show both,
and does via its model line + the guided source line). The cards: the A4 assumptions box
gains one line when the tax is on ("Tax on growth: N% a year (estimate, your setting)"
— or the source, when the rate came from the estimator) and never shows the income.

**The How fold** replaces "No taxes are included." while the tax is on (the line returns
verbatim when it is off — v6 exactly): the plain model (tax assumed paid each year on
growth at the rate you set; order: costs first, then tax, then inflation for today's
money; tax applies to cash because bank interest is taxable income, the fund cost does
not), the guided rate's source line (when the rate came from the estimator), and a plain
list of what is not included: US state taxes (raise the rate yourself to allow for them),
capital-gains timing and discounts (real tax on shares can be lower because some gains
are taxed later or at a discount), tax-sheltered accounts (super, 401(k), ISA-style),
offsets, credits and franking credits, the Medicare levy's low-income reductions, and any
levy not named in the estimate. The existing note that the measured figures themselves
are before tax stays. Every new string in EN and fa, RTL-correct, Persian digits in fa.

**Trust extras:** source-and-date on every surface that uses or explains a guided rate
(estimator line, How fold, A4 card); the fa label-in-name fix on the site chrome's
language toggle (the visible "فا"/"EN" now inside the aria-label, one line, no visual
change — axe's word-boundary matcher needed a plain space separator, not parentheses);
the blocked figures doors retried once with a hard 30-minute timebox (see §11.4).

### 11.2 The tax data table — every value, its source and its retrieval

All doors opened this session (2026-11-26, UTC). No bracket, rate, threshold or levy from
memory.

| Country | What | Value | Income-year label | Source (opened 2026-11-26) | Note |
|---|---|---|---|---|---|
| AU | Resident income-tax brackets | 0–$18,200 nil; $18,201–$45,000 15c/$1 over 18,200; $45,001–$135,000 $4,020 + 30c/$1 over 45,000; $135,001–$190,000 $31,020 + 37c/$1 over 135,000; $190,001+ $51,370 + 45c/$1 over 190,000 | the 2026–27 income year | ATO, "Tax rates – Australian resident" — https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents (page dated 13 Aug 2026; read via the page-reading tool — direct curl and a real browser are 403-blocked) | The published 2026–27 table already carries the Budget's cut of the second-bracket rate to 15%. The page itself states these rates do not include the Medicare levy. |
| AU | Medicare levy | 2% of taxable income | (same income year) | ATO, "What is the Medicare levy?" — https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy (last updated 30 Apr 2026) | "The Medicare levy is 2% of your taxable income." Added in full by the estimator; the low-income reductions the page describes are not modelled (the How fold says so). |
| US | TY2026 rate schedule — Single | 10% to $12,400; 12% to $50,400; 22% to $105,700; 24% to $201,775; 32% to $256,225; 35% to $640,600; 37% above | tax year 2026 | IRS Rev. Proc. 2025-32 §4.01 Table 3 — https://www.irs.gov/pub/irs-drop/rp-25-32.pdf (cross-checked against news release IR-2025-103, 9 Oct 2025 — https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill) | The revenue procedure is the definitive schedule; the release was read as the cross-check. |
| US | TY2026 — Married filing jointly (and qualifying surviving spouses) | 10% to $24,800; 12% to $100,800; 22% to $211,400; 24% to $403,550; 32% to $512,450; 35% to $768,700; 37% above | tax year 2026 | same (Rev. Proc. 2025-32 Table 1) | Surviving spouses share the joint table per the table's own heading. |
| US | TY2026 — Head of household | 10% to $17,700; 12% to $67,450; 22% to $105,700; 24% to $201,750; 32% to $256,200; 35% to $640,600; 37% above | tax year 2026 | same (Table 2) | |
| US | TY2026 — Married filing separately | 10% to $12,400; 12% to $50,400; 22% to $105,700; 24% to $201,775; 32% to $256,225; 35% to $384,350; 37% above | tax year 2026 | same (Table 4) | |
| US | Net investment income tax | 3.8% on the lesser of net investment income or the MAGI excess over: $200,000 single/head of household; $250,000 married filing jointly; $125,000 married filing separately | tax year 2026 | IRS Topic no. 559 — https://www.irs.gov/taxtopics/tc559 (page reviewed 25 Nov 2026) | The estimator adds the 3.8% at or above the threshold (the next dollar of investment income above it is NIIT-taxed). Thresholds are fixed by statute, not indexed. |

**Doors used:** the ATO pages were fetched through the search/page-reading tools after
direct curl and a real browser were refused (403 Access Denied — the same F5 network
block the figures research hit); both IRS documents were fetched directly (the release
and Rev. Proc. PDF over plain HTTPS). **No fallback secondary source was needed** —
every value above is first-hand from an official door.

**Estimator semantics (recorded as a decision):** the typed income only sets the bracket;
the rate is the tax on the **next dollar** of investment earnings at that income ("the
tax rate on extra earnings at your income level" — the plain-words replacement for the
never-shown word "marginal"). AU adds the 2% Medicare levy to the bracket rate; US adds
the 3.8% NIIT at or above the status threshold.

### 11.3 The v7 verification record (2026-11-26, all on this branch's final state)

- Preflight, before any feature work: `python3 compound_reference_check.py --selftest`
  six lines PASS; `bun test tests/compound-maths.test.ts` **94/94**; the browser harness
  **64/64**; the grid replay **1200/1200 engine + 15/15 live**; Phase A **32/32**; lint
  clean. **Tax off = v6 exactly**, re-verified at the end of the session: the same v6
  suites all still green with the tax layer in the tree (the unit suite's v6 portion,
  the unmodified harness checks, the v6 grid, Phase A).
- The reference engine extended: `--selftest` now prints **10 lines, all PASS** — the
  six v6 lines unmodified, the tax=0 exact-equality line, and three taxed vectors
  pinned from the engine's own output (100/mo, 20y: 7.2% − 0.2% cost × 68% = 39,524.4;
  3.03% cash-style, no cost, 32% tax = 29,608.8; 7.2%, 15% tax, fee 10, every 3 months,
  3% growth = 55,499.1). A `--tax-grid` flag writes the taxed grid (the same strata at
  15/32/45% tax); the v6 grid.json is untouched.
- Unit tests: **141/141** (94 v6 + 47 v7): the tax=0 byte-identity regression over six
  plan vectors, the three pinned reference vectors (±0.1%), today's-money deflation of
  the after-tax result, monotonicity (finals strictly decrease; put-in, fees, pending
  untouched), the cost-then-tax order (and that the wrong order differs), tax on Cash
  (cost off, tax on), the band under tax, the tax-takes difference, the AU bracket edges
  and the levy, the US bracket edges for all four statuses and the NIIT boundary one
  dollar below vs on the threshold, staleness, the config constants, the clamp, and the
  copy discipline (the on/off pair exists, "marginal" never appears, the income never
  reaches the card lines).
- The grid replay: **1200/1200 + 3600/3600** engine-side (the v6 grid unmodified plus
  the taxed grid), and **15/15 + 21/21** through the real interface — the taxed subset
  types the tax into the real Costs box and verifies the after-tax caption's rate at
  every scenario (`tests/compound-grid-replay.ts` and the new
  `tests/compound-grid-replay-tax.ts`, run as its own gate so each browser session is
  fresh — this sandbox chokes on two heavy sessions in one process; the main file notes
  where its sibling lives).
- The browser harness: **86/86** (64 v6 + 22 v7) — no tax-shaped element on the default
  screen; the row inside Costs (hidden until the group opens; 44px box, 16px text); the
  manual rate (caption + takes line + the after-tax headline, no clamp note); clamping
  (70 → 60 with the one plain message) and the 1-point stepper; the AU guided flow (the
  exact line, the source line, "Use this rate"); the How fold's on/off pair (model,
  guided source, the six-item not-included list, "No taxes are included." gone while
  on); plain language over the new copy (no "marginal", 13.2 words average); the US
  guided flow (four statuses, the 22% and 35.8% lines, the source); the fa RTL estimator
  with Persian digits; dark mode; store-nothing + reload-reset (the caption and the takes
  line gone after reload, no URL trace); one-screen fit with More options open at
  360×800 / 390×844 / 430×932; the full keyboard path (typed into the tax box by
  keyboard, the estimator opened with Enter); the A4 card with the tax on (the one tax
  line with its source; the income never appears; one page).
- Phase A (the v6 pass, re-run): **32/32**.
- **The live build** (deployed with `NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build
  && bunx wrangler deploy`; the account ID in the owner's credentials note had its last
  two characters transposed — the token's own account list showed `…e852`, and the
  deploy went through with that): both grid subsets through the real interface
  (**15/15 + 21/21**, zero page errors), the golden path with the tax on and off
  (manual and guided, AU and US, fa + RTL + dark) — **13/13** (`tests/v7-live-verify.ts`,
  screenshots in `docs/compound-tests/v7-live-*.png`), zero console errors everywhere.
- **Lighthouse (mobile, live): performance 98–99, accessibility 97** (two runs; v6 was
  98/97 — no regression; `docs/compound-tests/v7-lighthouse.json`).
- **axe (light + dark, EN + fa, with the tax UI open): zero new violations.** The scan
  shows 14–15 `color-contrast` nodes — the v6 baseline was 14/13 with the groups closed;
  the +1 is the pre-existing active-chip pattern ("Every month") newly visible because
  this scan opens the Costs group; every flagged node is a v6 element. The v6 fa
  `label-content-name-mismatch` on the language toggle is **fixed** this session (the
  label-in-name extra); `docs/compound-tests/v7-axe-tax.json`.
- Lint clean on every commit; `bun run lint` green at the end.

### 11.4 The blocked-doors retry (the trust extra)

Retried once, ~10 minutes of a hard 30-minute timebox, recorded in
`docs/compound-tests/figures-research-2026-11-26.md`:

- **CFS "Investment essentials" PDF — OPENED** (direct curl, 200, read first-hand): the
  20-year figures to 30 September 2026 — S&P/ASX 300 Accumulation 6.97%, MSCI World Net
  $A 8.95%, Bloomberg AusBond Bank Bill 3.25% — upgrading the v6 cross-checks from
  snippet-read to document-read. No change to the figures file's numbers was warranted
  (they remain the Vanguard/Damodaran/BIS/ABS primary rows; CFS stays the cross-check).
- LBMA's page shell opens but the historical price series is a paid feed (spec §7 forbids
  restricted-licence data). RBA and BLS stay blocked (403 / empty bodies). MSCI's
  20/30-year figures stay login-gated.
- **The common quarter-end remains unachievable:** no open door publishes 30-year
  figures to 30 September 2026 (CFS publishes 20 years only; Vanguard is June-ending on
  a yearly cadence; MSCI is gated; LBMA history is paid). The per-row disclosed period
  ends stay, each freshly re-verified.

### 11.5 Decisions log (v7)

1. **Taxes moved in scope as an optional estimate** — the owner's v7 direction; the
   default screen and the off state are byte-identical to v6 (the strongest regression
   in the suite).
2. **The estimator's rate is the next-dollar rate** ("the tax rate on extra earnings at
   your income level") — the honest plain-words version of the never-shown word
   "marginal"; the typed income only sets the bracket, as the UI says.
3. **The Medicare levy is added in full, always, for AU** — one simple rule; the
   low-income reductions and exemptions are not modelled and the How fold says so (the
   alternative — shade-in thresholds — was judged false precision for a rough guide).
4. **The NIIT applies at or above the threshold** (income ≥ threshold), because the next
   dollar of investment income above it is NIIT-taxed; verified at the boundary in the
   unit tests, one dollar below vs on it.
5. **The income is session state only** — never on a card, never in the URL, never
   stored; the reload-reset is tested.
6. **The clamp lives in the app layer, not the shared NumberField's pre-clamp** — so the
   one plain message actually fires when a typed number is pulled into 0–60% (a v6-era
   pattern made the percent box's note unreachable by typing; the tax box does it
   right, and the harness tests it).
7. **The guided rate's source stays attached to the number** — the How fold and the A4
   card show the source while the plan's rate is still the guided one, and fall back to
   "your setting" the moment it is edited away.
8. **The account-ID typo** — the owner's credentials note carried `…e85b`; the token's
   account list showed `…e852`; the deploy used the latter (recorded here so the next
   session does not trip on it).
9. **Deliberately not built** (fails the simplicity contract or the sourcing rules, and
   listed in the How fold and Appendix A): state-by-state US tables, capital-gains
   modelling, account wrappers (super, 401(k), ISA-style), offsets and credits, franking
   credits, auto-updating scrapers.
10. **The site palette's sub-AA contrast tokens stay untouched** (site-wide restyle,
    outside this tool's remit; still an owner decision) — and the fa label-in-name issue
    IS fixed this session (see §11.3).

### 11.6 How to roll back v7

- `git revert` the v7 commits on `compound-wealth-v7` (the tax layer, the test layer,
  the spec amendments, the doors retry, the report pack — each is one small, focused
  commit), or `git checkout compound-wealth-v6 && NEXT_PUBLIC_BASE_PATH=/gold bun run
  worker:build && bunx wrangler deploy`. The v7 commits touch the shared site chrome in
  exactly one place (the language toggle's aria-label) — trivially revertible. Nothing
  is stored anywhere, so there is nothing to clean up.
