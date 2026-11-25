# Compound Wealth — Phase 1 build report

**Spec:** `COMPOUND-WEALTH-SPEC.md` (v5, already in the repo root — verified byte-identical to the file this build was specified against)
**Branch:** `compound-wealth` · **Built:** 2026-11-25/26 (Asia/Tehran) · **Site:** currena.ir

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

Research date: **2026-11-25** (UTC). Every value below was read from the linked
source in this sitting; none is invented, estimated or recalled. Single figures
quoted with attribution (the spec's sanctioned pattern); derived numbers carry
their full working. Andex Charts' copyright covers the artistic chart, not the
factual figures; each Vanguard number below is a single published figure cited
with attribution.

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

## 5. Config values chosen (spec §11)

All in `src/lib/compound/maths.ts`'s config block, each with a plain-English
comment: milestones 5k→10M (11 lines), 3 on the page / 5 on the cards; amount
100 default with chips 50/100/200/500; years 20 default, chips 10/20/30, box
1–50; yearly cost 0.2% (editable 0–3%); what-if points 2 (editable 0.5–5);
band threshold 0.5 points; inflation 0–15%; yearly increase 0–15%; salary
share 3% (0.5–30%); staleness 18 months; country default AU; fee-warning
share 1% of a purchase. The default inflation per country comes from the
figures file (AU 2.76%, US 2.53%).

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

1. **The tiles' money toggle** (§5.1.5's own element) stays on the default
   screen — it is part of the tiles, not a control group; test 13's assertion
   was written to the full spec'd set accordingly.
2. **"1% more adds X, 1% less loses Y"** — in this engine the final value is
   linear in the deposit, so X and Y are always equal (with or without fees).
   Both are shown, spec-literally; the equality is honest mathematics, noted
   here so it doesn't read as a bug.
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
   reproducibility.
6. **The what-if "Starting later" selector defaults to 5 years** (spec default)
   with 1/3 available as small chips inside the card.
7. **Percent-mode's default yearly increase** follows the spec: 0 in fixed
   mode, the country's inflation average in share mode (the flip applies it).
8. **`/gold/tools/*` 301s to `/tools/*`** so the internal and public spellings
   never coexist (canonical tags agree).
9. **The salary → years-of-salary line** reads "The result is about N years of
   your salary" (final value ÷ yearly salary) — the clearest reading of
   Appendix B's "years-of-salary line".
10. **The tools index's converter card** links to `https://currena.ir/` (the
    converter's existing URL — a hash route lives under it), external, so
    nothing on the main site moves.

## 8. What is unfinished / needs the owner

1. **Deploy: done.** The branch is pushed, the PR is open (#51), and the
   worker was deployed from this sitting with the provided token — the live
   verification above is the record. If it ever needs re-running by hand:
   `NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build && bunx wrangler deploy`
   from the repo root, with `CLOUDFLARE_API_TOKEN` set (the two `/tools` zone
   routes are declared in `wrangler.jsonc`, so the deploy keeps them).
2. **The main site's nav** (currena-api — outside this repo) has no Tools link;
   the gold page's nav has one, the tools pages link home. One line on the
   main site's nav when the owner wants it there.
3. **ASX 200 and MSCI 20/30-year upgrades** — see §4's "Rows not filled".
4. **The sitemap** — see §6 (no sitemap on this worker to extend).

## 9. How to roll back

Everything is additive and self-contained:

- **Code:** `git revert` the three `compound-wealth` commits (maths+figures+tests,
  pages+cards+routing, worker-entry) — or merge `main` back over the branch.
  The only file the tool touches that the gold page shares is
  `src/lib/gold-page/content.ts` (two added nav label strings) and
  `src/app/page.tsx` (the one nav link + the filtered map) — both trivially
  revertible.
- **Worker:** redeploy the previous tree (`git checkout main && bun run
  worker:build && bunx wrangler deploy`) and delete the two `/tools` zone
  routes (dashboard → currena.ir zone → Workers routes, or remove the two
  route lines from `wrangler.jsonc` before deploying). The `/gold` routes and
  the D1 database are untouched by this change.
- **No data anywhere:** the tool stores nothing — there is nothing to clean up
  on any device or server.
