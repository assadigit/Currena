# Compound Wealth — Spec v6 (Currena)

Status: decided with the owner (Ali) on 2026-11-25. This replaces v5 and is complete on its own. It describes the **next iteration of a tool that is already live** at `https://currena.ir/tools/compound-wealth` (index at `https://currena.ir/tools`). Do not rebuild what works. Change what this spec says to change, and protect everything listed in section 1.2. Where this file is silent, choose the simplest option that serves the goal and record the choice in the report. Never ask the owner questions while building.

**v8 addendum (2026-11-27, the outcome visuals pass):** the v6 rules above all still govern; the amendments below add the share bar (§5.1.6), the what-if micro-bars (§5.2), the compare bar (§5.3), the card parity (§8), the v8 tests (§12, 39–43) and the v8 definition of done (§13.10), and record the pass's non-goals (Appendix A.1). The default screen gains exactly one small visual; everything else enriches elements that already exist, in place, below the fold or behind More options.

**v9 addendum (2026-11-27, the customizable chart):** asked for by the owner right after v8 shipped — "the graph has filters, turn some off, only show your current money vs future potential, add the S&P/gold lines if you want." The v6/v8 rules still govern. The amendments: the chart's series become toggleable layers (§5.1.4), the comparison lines move from always-drawn to opt-in, the page chart's two end labels become "Put in" and "Total" (each its chip's own word), the v9 tests (§12, 44–47) and the v9 definition of done (§13.11). The engine, the tiles, the cards and every number are untouched.

## 0. The one rule above all others: SIMPLE

The owner's words: the tool must not be complicated to use, because complexity makes people, including him, avoid it. It must be easy, intuitive, reasonably and reliably accurate, and it must **show the truth**. When any rule below conflicts with simplicity, simplicity wins and the feature moves into "More options" or out of scope.

### 0.1 Simplicity contract (testable)

1. **Answer on arrival.** Defaults are pre-filled (100 a month, 20 years, Australian shares) and the answer shows. No empty state, no Calculate button.
2. **Three control groups on the first screen, no more:** *how much per month*, *for how many years*, *what to invest in*. Plus two buttons: "More options" and "Save as card". (The amount group contains a small "Amount | % of salary" switch. That switch is part of the amount group, not a fourth group.)
3. **Answer and controls on one screen.** On a 390×844 phone, the headline and all three control groups are visible together without scrolling.
4. **Two-tap rule.** Changing the main question (amount, years, or asset) takes at most two taps or one short typing action.
5. **Everything else is in "More options"**, grouped under four plain labels: "About you", "Costs", "Rates", "Dates and compare". Nothing from those groups is visible by default.
6. **Plain words.** Short sentences. No term that needs explaining; if unavoidable, explain it in one line next to it. Follow `INSIGHTS-L1-STYLE-GUIDE.md`.
7. **Truth is never hidden by simplicity.** The headline always shows today's money next to future money and always shows the lower figure of the range. Costs show whenever they apply. "How is this worked out?" is one tap away.
8. **Fast and steady.** Instant updates while typing, no layout jumps.
9. **One place for the cards.** A single "Save as card" button opens a small choice: "Print or PDF" and "Phone card".

## 1. Where we are

### 1.1 What the first live version got right (verified by independent recomputation on 2026-11-25)
With the defaults (100 a month, 20 years, Australian shares at 7.2%, yearly cost 0.2%) the page showed: you put in 24,000; growth 26,800; you could have about 50,800; about 29,400 in today's money; "if it goes worse" about 40,600; "if it goes better" about 62,400; crossover June 2045; milestones June 2033, November 2039, September 2046; starting 5 years later costs 19,600; cash about 32,100. All of these matched an independent reference engine (`compound_reference_check.py`) exactly. `/tools` and `/tools/compound-wealth` load with correct titles, descriptions, canonical links and breadcrumb.

### 1.2 Protect (do not regress)
The maths engine and its rounding (headline to the nearest 100, small cards to the nearest 10), the end-of-month deposit rule, the lower-of-20-and-30-year baseline, the band rule, milestones, crossover, starting-later card, the URL structure, the figures-file approach (no feeds, no invented numbers), the A4 and phone cards, and "store nothing".

### 1.3 Work for this iteration

- **W1 — Fix confusing wording (small-changes card).** The live card says "1% more adds 5,080" but the real change is 10% of the monthly amount (10 a month). Rewrite in money terms (see 5.2).
- **W2 — Cash has no yearly fund cost.** Check whether the 0.2% yearly cost is deducted from the Cash line (the live cash result implies about 2.8% a year net, or about 3.0% before the cost). Cash must not be charged a fund cost (see 6.5).
- **W3 — Make inflation visible.** Today's money uses a long-run inflation average (about 2.8%). Say so next to the figure, and show recent inflation for honesty (see 5.1 and 7).
- **W4 — Refresh and re-verify the figures.** Latest common quarter-end, every row re-verified against its source and cross-checked against an independent source (see 7).
- **W5 — Clear labels.** The chip says "Australian shares" (keep it). Name the exact index behind each asset in the "How is this worked out?" section. The spec no longer says "ASX 200".
- **W6 — Polish.** Currency symbol on the tiles (the headline has "A$", the tiles did not); make sure the header "Tools" item links to `/tools`; do not use the "↗" arrow on links that stay on currena.ir.
- **W7 — NEW: percent-of-salary mini calculator** inside the amount control (see 5.1.1).
- **W8 — Tests, report, and a final rigorous test pass** (sections 12 and 13).

## 2. Goal, user and scope

For **the owner himself, as a personal motivator** (phase 1). Many people underestimate how much small amounts, invested for a long time, grow through compounding. The tool shows how much he would have if he keeps going, lets him try amounts, percentages and years (trial and error), and gives him something to keep looking at (the cards).

It must answer instantly: "If I invest 100 a month for 20 years, with average returns and compounding, how much would I have, after realistic costs?" and, for people who think in percentages: "If I invest 3% of my salary, how much is that and what does it become?"

Scope in: tool page, `/tools` index, country presets (Australia, USA), asset chips, years, amount or percent of salary, buying costs, milestones, what-if cards, A4 PDF card, phone card, English and Farsi.
Out of scope (later phases, appendix A): time machine and any real-history calculation, historical-outcome ranges, compare two plans, goal tab, mix sliders, live conditions strip, scheduled jobs, KV, accounts, share links, calendar reminders, taxes, AI narration. **Store nothing: no localStorage, cookies, server writes, or numbers in the URL.**

## 3. URLs and routing (already live; keep)

- Canonical: `https://currena.ir/tools` and `https://currena.ir/tools/compound-wealth` (no trailing slash; trailing-slash versions redirect 301 to the canonical form; unknown `/tools/...` shows the existing 404). Direct links and refresh work. Existing routes, including `#/insights`, unchanged.
- Language handling mirrors the converter and Insights exactly. Title, meta description, canonical, Open Graph and Twitter tags in the page language; sitemap entries; "Tools" item in the main navigation (must be a working link, W6); "← Tools" breadcrumb.
- `/tools` index: simple cards. Links that stay on currena.ir carry no "↗" icon.

## 4. Look and tone

- Same visual family as Insights; reuse tokens, fonts, cards, chips, dark and light modes. English and Farsi with the existing toggle; Farsi is right-to-left with Persian digits, Jalali dates, and left-to-right chart time axes.
- Mobile first, 360px, no sideways scrolling. Once the headline scrolls out of view on mobile, a slim sticky bar shows the final amount (future and today's money). Respect safe-area insets.
- Tone: short calm sentences, exactly one stronger sentence at the result ("Small and steady beats big and late.").

## 5. The interface

### 5.1 Default view (top to bottom)
1. Title "Compound Wealth" and the promise "See what small, steady investing becomes." Beside it, country chips: **Australia (AUD)** default, **USA (USD)**.
2. **Headline** (one sentence, large), for example: "Investing A$100 a month for 20 years: you put in 24,000, and it could grow to about 50,800 (about 29,400 in today's money)." Under it: "If it goes worse: about X. If it goes better: about Y." Then the one strong sentence. In percent mode the headline names the percentage and the amount (see 5.1.1).
3. **Three control groups:**
   - **Per month** (the amount group, with the percent mini calculator, 5.1.1).
   - **For how many years:** chips 10 · 20 · 30 and a small number box (1–50), always in sync.
   - **Invest in:** chips. Australia: Australian shares, S&P 500, World shares, Gold, Cash. USA: S&P 500, World shares, Gold, Cash. A chip is hidden if its figures are missing. Default Australian shares (Australia) or S&P 500 (USA).
4. **Chart:** stacked area of "money you put in" and "growth", the band, crossover marker, milestone markers. Direct labels and line styles, not colour alone. Text summary for screen readers. Under the chart one tiny line with the two measured figures: "Last 20 years: X%. Last 30 years: Y%. We use the lower one." with the end date. **v9 — the layer filters:** directly under the chart, one row of small toggle chips (aria-pressed buttons, the group named "Show on the chart"/«نمایش در نمودار»), one per series: the four core layers — **Put in** (the area and its line), **Growth** (the growth area), **Total** (the value line), **Range** (the what-if band) — plus one chip per comparison line (every other asset for the country, and Cash; the selected asset is the plan itself and has no chip). Each chip's swatch mirrors its series' own stroke (line style + the chart's token), so the row doubles as the chart's key. Defaults: the four core layers ON (your plan, the calm chart), every comparison line OFF — the S&P 500 / gold / cash lines are opt-in, per the owner's request. When any comparison line is shown, one caption line states the honest basis: "Other lines: the same plan at each asset's own average return." The y scale fits only what is drawn. The never-empty guard: at least one drawn series stays on — the last one's chip is disabled. Toggling changes only the drawing: every number on the page is invariant (tested). The two end labels read "Put in" and "Total" — each its chip's own word (the A4 and phone cards keep the v6 "Money you put in"/"Growth" wording; they have no chips). Milestone and crossover markers always draw (they are the plan's own annotations) and clamp into the plot when the scale shrinks. Toggle state is pure UI state: reload resets it, nothing is stored.
5. **Three tiles:** "You put in", "Growth added", "You could have", **each with the currency symbol (W6)**, and a small toggle between future money and today's money. **When today's money is shown, a one-line caption says the inflation used: "Today's money uses average inflation of 2.8% a year (last 20 years)."** (W3; the figure comes from the figures file and follows the editable inflation setting.)
6. **The share bar (v8) — the default screen's one new visual:** a slim full-width two-segment horizontal bar directly under the three tiles, the put-in part in the chart's put-in token and the growth part in the chart's growth token — the same tokens as the chart's stacked areas, so the bar doubles as the chart's key. Under it, one key line in words ("47% Money you put in · 53% Growth", reusing `chart.putInLabel` / `chart.growthLabel`, Persian digits and ٪ in fa) and one short caption ("The same two colours as the chart."). The whole bar is `role="img"` with the sentence as its `aria-label` (the one pattern used everywhere). Shares are computed from the SHOWN values, so the bar follows the money toggle exactly like the tiles. **Honest edge:** the bar is drawn only when growth ≥ 0 and final > 0 (`splitFinal` in maths.ts returns null otherwise); when hidden, one plain sentence stays ("In today's money, this plan ends below what you put in…"). Shares under 1% render as "<1%", never a misleading "0%". Non-interactive, calm, no animation.
7. Milestones (up to 3 on the page, 5 on the cards).
8. Two buttons: **More options** and **Save as card**.

#### 5.1.1 Percent-of-salary mini calculator (W7)
Goal: let people think the way they naturally do. Some say "100 a month"; some say "3% of my salary". The tool converts between them automatically, so nobody does the sum.

**The control (inside the "Per month" group):**
- A small two-way switch at the top of the group: **Amount | % of salary**. Default **Amount** (the answer on arrival does not change).
- **Amount mode:** exactly as today: number box with minus and plus, and chips 50 · 100 · 200 · 500. Below it, a small text link **"Add your salary (optional)"**. Once a salary is entered, show a live line: **"That is 2.0% of your salary."**
- **% of salary mode:**
  - A number box with minus and plus (step 0.5, range 0.1%–50%) and chips **1% · 3% · 5% · 10%**. Default **3%**.
  - A **Salary** box with a small switch **per year | per month** (default per year). Placeholder shows an example (for instance "e.g. 90,000"), never a prefilled value. A short hint: "Use the salary you plan your saving from, before or after tax."
  - **A live result line, always visible and easy to read:** **"3% of A$90,000 a year = A$225 a month."** (plain words, currency symbol, updates on every keystroke).
  - Until a valid salary is entered, the results keep showing the last amount used and the line reads "Enter your salary to turn 3% into dollars." No empty state, no error.
- **Switching mode keeps your place:** from Amount to % (salary known): % = amount ÷ monthly salary, rounded to 0.1. From % to Amount (salary known): amount = the computed monthly amount, rounded to a whole number. If the salary is not known, nothing is invented: the new mode simply shows its default.
- **Conversions:** monthly salary = yearly ÷ 12. Monthly amount = monthly salary × % ÷ 100. Show money rounded to the whole number in the live line, and keep full precision in the calculation.
- **The same salary box is used everywhere** (the "Add your salary" link, % mode, and the "years of salary" line). It is not repeated in More options.
- **Headline in % mode:** "Investing 3% of your salary (A$225 a month, growing as your salary grows) for 20 years: you put in X, and it could grow to about Y (about Z in today's money)."
- **Your monthly amount grows with your salary in % mode** (the yearly increase defaults to the country inflation average, assuming raises keep pace; editable in More options, "Rates"). In Amount mode the yearly increase stays 0%. The About text states this assumption in one plain line.
- The cards show the percentage and the monthly amount, **never the salary itself** (privacy).
- Accessibility: every box labelled; the switch is a real two-option control usable by keyboard and screen reader; the live line is announced politely (`aria-live="polite"`).

### 5.2 "What if…" (below the chart)
- **Small changes (W1), in money or percentage points, never ambiguous:**
  - Amount mode: "Investing 10 more a month adds X. Investing 10 less loses Y." The step is 10% of the monthly amount rounded to a whole number (minimum 1). If salary is known, add the percent: "(that is 0.2% more of your salary)" only if it stays short.
  - % mode: "Investing 4% instead of 3% adds X. Investing 2% instead of 3% loses Y." (one point either way; hide the "less" sentence if the lower value would be under 0.5%).
- **Starting later:** "Starting 5 years later costs you X." (choose 1, 3 or 5, default 5).
- **Cash comparison:** "If you only save it as cash: about Z." (no fund cost applied, see 6.5).
- A costs line only when costs apply: "Costs took X (Y% of what you put in)."
- **The micro-bars (v8):** each card carries one small shared component rendering thin labelled bars (4–6px tracks) on one common scale per card — small changes → three bars (a bit less / your plan / a bit more), starting later → two (your plan / starting N years later), cash → two (invested / in cash), costs → two (before costs / after costs). The rows carry words only, never numbers; the endpoints are the sentence's own numbers (the base final and base ± the sentence's deltas; the costs pair is the one engine-run exception — the same plan with every cost switched off). Rows whose sentence is hidden drop out too. Each set is `role="img"` with one sr-only sentence; non-interactive (no hover, no tooltips), calm, no animation. A card must not grow past about 1.5× its pre-v8 height at 360px (measured: 1.32–1.41×).

### 5.3 More options (collapsed; four plain groups)
- **About you:** current age (adds "at age N"); starting amount (0; treated as already invested, no purchase cost). Salary is **not** here (it lives in the amount group, 5.1.1). The "years of salary" line appears once a salary is entered.
- **Costs:** yearly cost (0.2%, "an assumption, change it", 0%–3%; not applied to Cash); cost per purchase (0); how often I buy (every month or every 3 months).
- **Rates:** return = Average (default), Custom rate, or Custom range (low and high); inflation (country average, editable 0%–15%); yearly increase of what you invest (Amount mode 0%; % mode = country inflation average; 0%–15%); "what if it's lower" points (2).
- **Dates and compare:** custom start and end month (future only; start not before this month; end up to 50 years); collapsible "Compare assets" table (every asset for the country plus Custom and Cash: rate used, final amount, low and high). **One slim proportional bar (v8) under each final value, on one scale computed across the table's rows — only because it fits 360px without widening the table (it does; measured).**

Rules: recalculate instantly; clamp out-of-range values with one small plain message; reload resets everything.

### 5.4 Page bottom
**How is this worked out?** (collapsible, plain words): four-line method; the exact index behind each asset (W5); the 20-year/30-year overlap note; figures are total returns before tax unless a row says price only; yearly cost is an assumption and does not apply to cash; **the inflation used for today's money, and the latest 12-month inflation figure with its source and date (W3)**; in % mode, the assumption that your amount grows with your salary; cash waiting between purchases earns nothing; "employer super may already exist, so this is for extra money you invest on your own" (no rate stated); no taxes; exchange-rate effects are only those inside the AUD figures; past performance is not a promise. Then the site's existing single disclaimer component, unchanged. Staleness note when needed (7).

## 6. The maths (exact)

### 6.1 Core engine (unchanged)
`r_net = r − cost` (cost 0 for Cash, see 6.5). Monthly rate `i = (1 + r_net)^(1/12) − 1`. Months run from the start month to the end month inclusive (`n`), `m = 1 … n`; default start = this month, end = start + years.
- Deposit in year `y` (0 for the first 12 months): `d_m = base × (1 + g)^y`.
  - **Amount mode:** `base` = the amount; `g` = yearly increase (default 0%).
  - **% mode:** `base` = `monthly_salary × percent / 100`; `g` = yearly increase (default = country inflation average).
- Each month: `balance = balance × (1 + i)`, then `pending += d_m`.
- Purchase months: every `k`-th month (`k` = 1 or 3) and always the last month. If `pending > fee`: `balance += pending − fee`, `fees_paid += fee`, `pending = 0`; otherwise skip (pending carries). Pending earns nothing.
- Final value = `balance + pending`. Total put in = starting amount + sum of `d_m`. Growth = final − total put in. Show total fees and fees as a % of total put in when fee > 0. Fee over 1% of each purchase: show "Costs take a large share of each purchase. Buying every 3 months can help." If the plan never invests, say so plainly.
- Today's money: divide by `(1 + inflation)^(m/12)`. Crossover: first month where cumulative growth ≥ cumulative total put in.

### 6.2 Baseline, band and what-if (unchanged)
Baseline `b` = the lower of the 20-year and 30-year figures for the asset and country. Band: low end = `b − what-if points` (a what-if, labelled "if it goes worse"); high end = the higher of the two figures if they differ by at least 0.5 points, otherwise `b + what-if points` (labelled a what-if). Custom range: low and high as typed, middle = average. Custom rate: single line. Cash: no band. Only one measured figure: `b ± what-if`, labelled.

### 6.3 Foreign assets in AUD (Australia preset)
`AUD growth factor = USD growth factor × (FX_start / FX_end)` (FX = USD per 1 AUD); annualise with `r_AUD = (factor)^(1/years) − 1`. Record both endpoint dates and values in the figures file. Test: 10% a year USD over 20 years, FX 0.80 → 0.40, gives about 13.88% a year in AUD.

### 6.4 Milestones (unchanged)
Thresholds 5k, 10k, 25k, 50k, 100k, 250k, 500k, 1M, 2.5M, 5M, 10M; keep those at or below the final value in the view shown; 3 on the page, 5 on the cards; month and year, and "at age N" if age is given.

### 6.5 Yearly cost rule (W2)
The yearly cost applies to Australian shares, S&P 500, World shares, Gold and Custom. It **does not apply to Cash** (a savings account has no fund fee). The "Compare assets" table and the cash line use the unreduced cash rate. This is a product decision made by the owner's advisor session; the owner may reverse it, so keep it in one clearly named config switch (`APPLY_COST_TO_CASH = false`).

### 6.6 Percent mode formulas (W7)
`monthly_salary = salary` if per month, `salary / 12` if per year. `monthly_amount = monthly_salary × percent / 100`. Reverse: `percent = monthly_amount / monthly_salary × 100`. Years-of-salary line: today's-money final ÷ (monthly_salary × 12).

## 7. Figures file (no data feeds)

One file in the repo (clearly marked configuration block and plain-English comments at the top) holds every number the page uses. **Do not invent or estimate any figure.** For each row store: asset, country/currency, annual return for the last 20 and the last 30 years (or the longest period of at least 10 years, labelled), total return or price only, the period end date, **the exact index or series name**, source name, source URL, and a note on how it was derived.

Rows: **AUD:** Australian shares, S&P 500 (AUD), World shares (AUD), Gold (AUD), Cash (average official cash rate), Inflation (average CPI). **USD:** S&P 500, World shares, Gold, Cash (average Fed funds rate), Inflation (average CPI). **New (W3):** latest 12-month inflation for each country, with source and date (used only for the honesty line in "How is this worked out?").

Sourcing rules (unchanged): prefer official or provider-published figures; one published figure with its source is fine; do not copy whole tables or republish series; prefer total return, label price-only rows; AUD foreign rows come from the published USD total return plus endpoint FX from an official source with the working in the note; cash average = average policy rate; inflation average = annualised CPI change between period endpoints. **Forbidden:** scraping sites whose terms forbid it, paid data, restricted-licence data, guessing, numbers from memory. If a figure cannot be found, hide that chip and list what is missing in the report. No web access: build anyway, hide rows lacking figures, list every needed figure with suggested sources.

**W4 — refresh and verify:**
- Use the **latest quarter-end common to all rows** (target 30 September 2026 or later). All rows end on the same date.
- Re-verify every row against its source: open the source, confirm number, period, index, currency. Recompute derived rows independently (tolerance 0.05 points).
- Cross-check each share, global-share and cash row against one independent published source, and record the gap. A gap above 0.5 points needs a written explanation in the report. References found so far, all at 30 September 2026, from Colonial First State "Investment essentials" (https://www.cfs.com.au/content/dam/prospects/i/n/v/investment_essentials.pdf): Australian shares (S&P/ASX 300 Accumulation) 20-year 6.97%; global shares (MSCI World Net, A$) 8.95%; cash (Bloomberg AusBond Bank Bill) 3.25%. Also use the Vanguard Australia index chart, the ASX investment products report, the RBA statistical tables, the ABS CPI release, and for the USA the Federal Reserve and the Bureau of Labor Statistics.
- The figures file has one "figures checked on" date, shown in "How is this worked out?". If older than 18 months the page shows "These figures may be out of date." (keep, test).

## 8. Cards (both from "Save as card"; generated in the browser; nothing uploaded or stored)

### 8.1 A4 PDF card (browser print-to-PDF)
No JavaScript PDF library. "Print or PDF" builds a dedicated print view and calls `window.print()` with one plain line "In the window that opens, choose Save as PDF." `document.title` set to `Currena-Compound-Wealth-<yyyy-mm-dd>` while printing. **Always one A4 portrait page** (`@page`, hide page UI, `print-color-adjust: exact`; drop optional blocks in this order if needed: milestones beyond three, what-if cards, compare table). Light, ink-friendly palette always (Light/Dark card toggle in the print view, Light default). Farsi card: RTL, Persian digits, Jalali date, LTR chart axes, self-hosted woff2 fonts for Latin and Persian.
Contents: wordmark and title; the big number (future money with today's money beside it); a one-line plan summary — Amount mode: "100 a month · 20 years · Australian shares · 7.2% a year, the lower of the 20- and 30-year figures"; **% mode: "3% of your salary (A$225 a month) · 20 years · …" (never the salary itself)**; inline SVG chart (stacked area, band, milestone markers); up to five milestones; three tiles with currency symbols; **the share bar (v8) under the tiles in the ink-safe palette (greyscale-friendly), with the two percentages in one caption line — the same split as the chart's two areas, `role="img"` with its sentence**; costs line when it applies; assumptions box (rates with periods and sources, yearly cost, purchase costs, inflation used); the strong sentence; the single disclaimer; footer "currena.ir/tools/compound-wealth", generated date, "Made in your browser. Nothing was saved."
Decoration: calm, editorial, clearly Currena: quiet growth motif in inline SVG (growth rings or rising contours), thin rules, one accent colour from the Currena palette, generous spacing; no clip-art, photos or heavy gradients; good in greyscale.

### 8.2 Phone card (the reminder)
Full-screen portrait view to **screenshot as a lock screen**; view only. Fills the viewport (`100dvh`); on desktop a centred phone-shaped frame (about 9:19.5). Safe zones: top ~28% and bottom ~12% free of text. Content in the middle band: the big final amount (today's money smaller beneath); "100 a month · 20 years" (% mode: "3% of salary · A$225 a month · 20 years"); **the share bar as a slim two-segment strip (v8) under the big number — text-free (screenshot-safe), dark and light styles, `role="img"` with its sr-only sentence**; stacked-area sparkline (SVG); next milestone; the strong sentence; tiny footer "An illustration, not a promise · currena.ir". Dark by default with a Light option; minimum text 14px at 390px width; no clipping at 360×800, 390×844, 430×932; help line "Take a screenshot, then set it as your lock screen." No PNG export.

## 9. Known limits (stated in the collapsible section)
Averages are not a forecast and the 20- and 30-year figures overlap. No taxes. Exchange-rate effects only as already inside the AUD figures. Figures are reviewed by hand and carry a "checked on" date. Inflation for today's money is a long-run average; recent inflation can be higher or lower.

## 10. Quality rules
Maths in one small separate module with a config block at the top (milestones, defaults, thresholds, `APPLY_COST_TO_CASH`, percent limits, each with a plain-English comment); figures file separate. Accessible: labelled inputs, keyboard use, visible focus, AA contrast in light and dark, chart text summary. Reuse the Insights chart approach; no large new libraries. Do not change or degrade Insights, the converter, or narrator work; do not move or rename existing pages. Run the repo's gates command before and after.

## 11. Config block (top of the maths module)
Defaults: amount 100, percent 3, years 20, yearly cost 0.2%, what-if points 2, band threshold 0.5 points, percent limits 0.1–50, percent step 0.5, percent chips 1/3/5/10, salary period default "year", inflation limits 0–15%, milestone list, staleness months 18, default country Australia, `APPLY_COST_TO_CASH = false`.

## 12. Required tests

**Maths (1–11)**
1. Fixed 100/month, 20 years, 0% increase, 0 cost, 7%, no start amount, no fee, monthly: final ≈ **50,754** (±0.5%), put in exactly 24,000.
2. Percent mode: salary 5,000 a month, 3%, 20 years, 7%, 0 cost, **0% yearly increase** (set manually): final ≈ **76,130**, put in exactly 36,000.
3. Fee 10 per purchase, monthly, as test 1: ≈ **45,678**; fees exactly 2,400.
4. Fee 10, every 3 months: ≈ **48,785**; fees exactly 800.
5. Fee ≥ purchase amount: never invests, plain message. Fee over 1% of each purchase shows the costs line.
6. 0% return: final = put in (minus fees). Higher yearly increase gives more put in. Yearly cost lowers the final.
7. AUD conversion test (≈ 13.88% ± 0.05).
8. Baseline = lower of 20- and 30-year; band rule; single-figure fallback; hidden chips when figures are missing; staleness note after 18 months.
9. Dates clamp (start before this month; end beyond 50 years); year chips set the end date.
10. Milestones: only thresholds at or below the final value, correct count, month and age.
11. Extreme and empty inputs never give NaN or a broken page.

**Simplicity (12–18)**
12. On a fresh load, with no interaction, the headline answer is visible.
13. In the default state the visible control groups are exactly: country chips, the three groups (amount with its Amount | % switch, years, asset), "More options", "Save as card" (plus the site's own language toggle and navigation). The salary box is not visible in Amount mode (only the "Add your salary (optional)" link).
14. At 390×844, 360×800 and 430×932 the headline and all three groups are visible together without scrolling.
15. Changing amount, years or asset takes at most two taps or one short typing action.
16. All More options groups are collapsed by default and show nothing visible until opened.
17. The headline always contains future money and today's money, and the range line always shows the lower figure. Costs line appears when costs are set.
18. Plain-language check: no banned jargon on the default screen; average sentence length 15 words or fewer.

**URLs and routing (19–20)**
19. `/tools` and `/tools/compound-wealth` load directly and after refresh; trailing-slash versions give 301 to canonical; `/tools/unknown` shows the existing 404; converter and `#/insights` still work.
20. Title, description, canonical, Open Graph tags correct in the page language; sitemap has both URLs; the "Tools" nav item is a working link (W6); breadcrumb works; no "↗" on links that stay on currena.ir.

**Cards and general (21–24)**
21. **No storage:** nothing written to localStorage, sessionStorage, cookies, IndexedDB, and no network calls caused by using the tool or the cards.
22. **A4 PDF:** headless-browser print in English and Farsi, light and dark style, with and without costs, **in Amount and % modes**: exactly one A4 page, text extractable, Persian digits and joined letters correct, SVG chart and decoration present; **the salary never appears on the card**. Save samples under `docs/compound-samples/`.
23. **Phone card:** render at the three phone sizes in English and Farsi, dark and light, Amount and % modes: no clipping, safe zones kept, minimum text size met; screenshots saved.
24. Visual checks of the page at 360px, tablet, desktop, light and dark, Farsi and English.

**Percent mini calculator (25–32)**
25. Conversions: 3% of 90,000 a year = **225 a month**; 3% of 5,000 a month = **150**; 1% of 60,000 a year = 50; 0.5% of 100,000 a year ≈ 41.67 (shown as 42, calculated at full precision); per year ↔ per month switch keeps the same money.
26. Reverse line: Amount 225 with salary 90,000 a year shows "That is 3.0% of your salary."; Amount 100 with salary 5,000 a month shows 2.0%.
27. Consistency: in % mode with the yearly increase set to 0%, 3% of salary 90,000 a year gives the **same results** as Amount mode with 225 a month (all numbers on the page).
28. % mode default yearly increase = country inflation average, and the About text and headline say the amount grows with salary; put-in total is higher than in the 0%-increase case.
29. Mode switching keeps your place: Amount 225 → % mode with salary 90,000 a year shows 3.0%; % 3 → Amount with that salary shows 225; with no salary nothing invented and no error.
30. Edge cases: empty salary (no empty state, hint shown, results keep the last amount), salary 0, negative, letters, huge numbers, Persian digits, comma decimals, percent below 0.1 or above 50 (clamped with one small plain message), many decimals.
31. The percent chips (1·3·5·10), the stepper (step 0.5) and the typed value stay in sync; the live line updates on every keystroke and is announced politely to screen readers; keyboard-only use works; labels in Farsi are right-to-left with Persian digits.
32. Small-changes card wording: Amount mode shows money ("10 more a month"); % mode shows percentages ("4% instead of 3%"); the "less" sentence is hidden when the lower percentage would be under 0.5%.

**Fixes from the audit (33–38)**
33. **W1:** no wording anywhere says "1% more" when the change is 10% of the amount.
34. **W2:** the cash result equals the cash rate without the yearly cost; the same asset with `APPLY_COST_TO_CASH = true` gives the lower result (switch test); About says cost does not apply to cash.
35. **W3:** the caption "Today's money uses average inflation of X% …" appears when today's money is shown and follows the editable inflation setting; About shows recent inflation with source and date.
36. **W4:** all rows end on the same date; each row is marked VERIFIED against its source and cross-checked; gaps over 0.5 points are explained in the report.
37. **W5:** About names the exact index behind each asset; chips keep plain names.
38. **W6:** tiles show the currency symbol in both countries; header "Tools" links to `/tools`.

**The outcome visuals (v8 — 39–43)**
39. **splitFinal unit tests:** growth 0 (all put in, drawable); final below put in (null — the honest edge); final 0 (null); put in 0 (all growth); the two shares always sum to exactly 1; shares under 1% round to "<1%" (never a misleading "0%"); NaN guards; the future-vs-today pair (view-invariant shares — both shown values divide by the same deflator — and the honest edge firing on negative-growth plans in both views).
40. **Grid replay extension:** across the 1200-stratum grid, the split is drawable iff growth ≥ 0 and final > 0; the two shares sum to 100%; through the real interface, the bar's segment widths ≈ the shares and the key line's percentages equal the tiles' own numbers.
41. **Browser harness extension:** the bar's presence, keying and proportion under the tiles; the money-toggle consistency; the "<1%" wording; the negative-growth fallback (bar hidden, sentence kept); the what-if bars' shapes, sr sentences and no-interaction rule; the costs before/after pair; the compare bars' proportionality; the phone strip (text-free, sr twin) and the A4 bar; fa/RTL (Persian digits, ٪, the put-in segment at the reading start); the language toggle's label-in-name fix in both directions; the new text's colours are the page's own secondary/tertiary tokens in light and dark; store-nothing and no-network re-checked; the default-screen inventory gains the bar and no interactive elements; the one-screen rule at 360×800 / 390×844 / 430×932 holds with the bar present.
42. **axe:** light + dark, EN + fa — zero NEW violations against the recorded v6 baseline (the fa `label-content-name-mismatch` the fix retires is the intended decrease).
43. **Plain language:** the bar's key line and caption, the hidden line and the micro-bar labels carry no jargon and keep the default screen's sentence discipline.

**The customizable chart (v9 — 44–47)**
44. **Defaults:** the filter row exists under the chart with the four core chips ON and every comparison chip OFF; the default chart is plan-only (no comparison end labels, no caption); the pre-v9 look is fully recoverable by switching every chip on (the all-on state draws every comparison line — the recorded v8 default).
45. **The owner's example view:** Growth and Range off leaves exactly the put-in area and the Total line, labelled "Put in" and "Total"; the never-empty guard disables the last drawn series' chip (pressed + disabled) and releases the moment a second series returns.
46. **Invariance:** through every toggle combination the headline, the three tiles and the range line are byte-identical — the filters change only the drawing; the toggle state is never stored (store-nothing re-checked after the layer interactions) and reload resets it.
47. **Reach and honesty:** fa/RTL — the group label, the chip labels and the caption in Persian, a toggle working in fa; at 360px the chip row wraps with no sideways scroll and stays compact; the chips reuse the page's own chip colour pairs (the asset chips' combination) in light and dark; the comparison lines carry the caption sentence and the chart's own dash conventions; the engine is untouched (the 1200-row grid replay and the 103 maths tests pass unmodified).

## 13. Definition of done
1. Everything in section 1.3 done, tests 1–38 pass (or UNVERIFIED with a stated reason).
2. The simplicity contract holds with the percent calculator added (tests 12–18).
3. Maths still matches the independent reference engine (`compound_reference_check.py`); run its grid against the live page.
4. Figures refreshed, verified and cross-checked (section 7).
5. Nothing stored; no network calls for data from the page.
6. Both cards verified in both modes, samples saved.
7. Gates command passes; Insights, converter and narrator unaffected.
8. `COMPOUND-WEALTH-REPORT.md` updated: what changed, every figure with value, period, exact index and source link, AUD derivations with endpoint FX values and dates, cross-check table with gaps, hidden rows and what is needed, config values, anything unfinished, how to roll back.
9. After building, the full test pass from `COMPOUND-WEALTH-TEST-PROMPT.md` has been run, its report written to `COMPOUND-WEALTH-TEST-REPORT.md`, and all code or wording defects it found are fixed and re-tested.
10. **v8 (the outcome visuals):** preflight gates recorded on the main-based branch with any baseline drift explained before feature work; the default screen gains exactly one new visual (the share bar) and the unmodified v6 suites still pass; the what-if cards, compare table, phone card and A4 card show their bars, every bar carrying its words and sr-only twin, every new token use AA in both themes; tests 39–43 green with evidence; the negative-growth fallback proven; the today-view behaviour recorded (the view-invariant shares are an engine fact, recorded); the one-screen rule at the three sizes holds with the bar present; no new runtime dependencies and a negligible JS delta; Lighthouse ≥ 98/97 recorded; the live deploy verified end-to-end with the fa toggle fix walked on two other tools; the cut list recorded with reasons; the v7-before-v8 ordering decision recorded.
11. **v9 (the customizable chart):** preflight gates recorded on the v8 branch tip with zero drift before feature work; the layer filters work through the real interface (defaults, the owner's example view, the opt-in benchmarks with their caption, the never-empty guard, fa/RTL); the numbers-invariance lock green; tests 44–47 green with evidence; the engine and the 1200-row grid untouched and green; no new runtime dependencies and the JS delta measured honestly from two full worker builds; Lighthouse recorded (a11y at the v8 baseline; performance at or above 97 with the run variance noted); the axe delta recorded and explained (the four on-chips are the site's own active-chip colour pair, the same accepted pattern as the baseline's chip nodes); the live deploy verified end-to-end with zero console/page errors and screenshots kept; the spec amendments and the reports updated; the cut list recorded with reasons.

## Appendix A: Later phases (not now)
- **Phase 2:** time machine using real history (US first via a published dataset; Australia only if a legally reusable source exists), historical-outcome ranges (worst, middle, best) to replace the what-if band, scheduled refresh of figures.
- **Phase 3:** compare two plans, goal tab ("how much per month to reach X"), asset mix, live conditions strip, more currencies, salary per fortnight or week.
- Possible: Toman view; PNG export of the phone card; progress tracking belongs in the owner's money/runway tracker, not in this tool. Every future addition must pass the simplicity contract or live inside "More options".

### A.1 v8 non-goals (considered and cut — do not re-propose without the owner)
- **A donut/pie of the final composition:** the straight bar already matches the chart's stacked semantics; pies read worse at small sizes and for screen readers.
- **Hover/touch tooltips on the chart:** desktop-biased, a11y and payload cost; the milestone dots, end labels and sr-only summary already anchor the numbers.
- **A second chart or a "stop investing" line:** clutter; the put-in layer already is the no-growth path, and the later-start card covers waiting's cost.
- **A year-by-year numbers table:** more numbers, not more understanding; the maths is already grid-verified.
- **Animations on the chart or bars:** against the calm discipline and the reduced-motion rules.
- **A goal/target visual:** a new input; against the three-control default screen.

**v7 ordering (decided, recorded in both the v8 prompt and the v7 branch's rebase addendum):** the tax pass (v7) branches from main AFTER v8 ships, joining the v8 surface at three points — the Costs row unchanged, the share bar caption when tax is on, and the "tax takes" line joining the costs card's bars. Nothing in v8 starts tax work. (v9 note: v8 shipped 2026-11-27; v9 shipped the same day on top of it; v7 remains next, rebasing onto the v9 surface — the same three join points, none moved by v9.)

### A.2 v9 non-goals (considered and cut — do not re-propose without the owner)
- **Remembering toggle choices across reloads:** store-nothing is a locked owner decision; the filters are one tap and reload-honest.
- **A "type your own comparison rate" chip:** Custom rate/range mode already answers that question for the whole plan; a per-line custom rate doubles the input surface for one view.
- **Per-series y-axes or axis numbers:** the chart speaks in labels, milestones and the tiles' numbers; axis numbers would re-introduce the number-reading the v6 design retired.
- **Filters on the A4/phone cards:** the cards are fixed share artifacts; their composition (both layers, no comparisons) is the spec's §8.
- **Animated transitions when toggling:** against the calm discipline; the drawing changes instantly and quietly.
- **Reordering or hiding the filter chips themselves:** the row mirrors the chart's own series order; configurability of the configurator is complexity, not clarity.

## Appendix B: Owner decisions
Still apply: simple above everything; URL `currena.ir/tools/compound-wealth`; phase 1 for the owner himself; phone card as the reminder; no storage; fixed, custom and percent amounts; optional age; calm tone with one strong sentence; years-of-salary line; end-of-month deposits; both money views; custom rate or range; yearly cost 0.2%; super note; stacked chart plus thin lines; sticky mobile results; wording per style guide; PDF by browser print-to-PDF; Australia and USA defaults using the lower of the 20- and 30-year figures; milestones; World shares.
New in v6: the percent-of-salary mini calculator inside the amount control (the system converts automatically, in both directions; salary is never shown on the cards); fixes W1–W6 from the audit; no yearly cost on cash (reversible switch); inflation shown in plain words next to today's money.
