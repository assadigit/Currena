# Compound Wealth — Spec v5, Phase 1 (Currena)

Status: decided with the owner (Ali) on 2026-11-25. This replaces v4. Build exactly this. Where this file is silent, choose the simplest option that serves the goal and record the choice in the final report. Never ask the owner questions while building.

## 0. The one rule above all others: SIMPLE

The owner's words: this tool must not be complicated to use, because complexity makes people, including him, avoid it. It must be easy, intuitive, reasonably and reliably accurate, and it must **show the truth**. When any rule below conflicts with simplicity, simplicity wins and the feature moves into "More options" or out of phase 1.

### 0.1 Simplicity contract (testable, see section 12)

1. **Answer on arrival.** The page loads with defaults already filled in (100 a month, 20 years, home shares) and the answer showing. No empty state, no Calculate button, nothing to do before seeing a result.
2. **Three controls on the first screen, no more:** how much per month, for how many years, what to invest in (asset chips). Plus two buttons: "More options" and "Save as card". That is the whole default interface.
3. **Answer and controls on one screen.** On a 390×844 phone, the headline result and all three controls are visible together without scrolling.
4. **Two-tap rule.** Changing the main question (amount, years, or asset) takes at most two taps or one short typing action.
5. **Everything else is in "More options"**, grouped under four plain labels: "About you", "Costs", "Rates", "Dates and compare". Nothing from those groups is visible by default.
6. **Plain words.** Short sentences. No term that needs explaining; if a term is unavoidable, explain it in one line right next to it. Labels like "Per month", "For how many years", "Invest in". Follow `INSIGHTS-L1-STYLE-GUIDE.md`.
7. **Truth is never hidden by simplicity.** The headline always shows today's money next to future money, and always shows the lower figure of the range. Costs show whenever they apply. "How is this worked out?" is one tap away. Simple does not mean flattering.
8. **Fast and steady.** Results update instantly while typing; no layout jumps.
9. **One place for the cards.** A single "Save as card" button opens a small choice: "Print or PDF" and "Phone card".

## 1. What changed from v4

- New: the simplicity contract (section 0) and a restructured, much quieter interface.
- New: the tool lives at **`currena.ir/tools/compound-wealth`**, with a simple `/tools` index page (section 3).
- Demoted into "More options": percent-of-salary mode, custom dates, custom rate or range, starting amount, age, inflation, yearly cost, buying costs, compare assets, what-if setting.
- Unchanged from v4: phase 1 scope (no time machine, compare plans, goal tab, mix, live strip, KV, schedulers), figures file with sourced numbers and no invented values, AUD-correct returns, brokerage input, honest band, A4 PDF card, phone card, milestones, store nothing.

## 2. Goal and user

Phase 1 is for **the owner himself, as a personal motivator**. Many people underestimate how much small amounts, invested for a long time, grow through compounding. The tool shows how much he would have if he keeps going, lets him try amounts and years (trial and error), and gives him something to keep looking at (the cards).

It must answer instantly: "If I invest 100 a month for 20 years, with average returns and compounding, how much would I have, after realistic costs?"

It must make one thing obvious: **the growth layer overtakes the money you put in.**

Scope in: the tool page, `/tools` index, country presets (Australia, USA), asset chips, years, buying costs, milestones, what-if cards, A4 PDF card, phone card, English and Farsi.
Scope out (later phases, see appendix A): time machine and any real-history calculation, historical-outcome ranges, compare two plans, goal tab, mix sliders, live conditions strip, scheduled jobs, KV, accounts, share links, calendar reminders, taxes, AI narration. **Store nothing: no localStorage, cookies, server writes, or numbers in the URL.**

## 3. URLs, routing and naming

- **Tool name:** English "Compound Wealth". One-line promise: "See what small, steady investing becomes." Farsi: "ثروت مرکب" with a short promise line in the same spirit (the style guide decides final wording).
- **Canonical URLs (path-based, lower case, hyphens):**
  - `https://currena.ir/tools` — a simple index page listing the available tools as cards (name, one line). Phase 1 lists Compound Wealth and links to the existing converter at its **existing** URL (do not move or rename any existing page).
  - `https://currena.ir/tools/compound-wealth` — the tool.
- Trailing slashes: the version **without** a trailing slash is canonical; the version with one redirects (301) to it. Unknown paths under `/tools/` show the site's existing 404 page.
- Direct links and refreshes must work (the Worker must serve these paths itself, not rely on in-page hash routing). Existing routes, including `#/insights`, must keep working unchanged.
- **Language:** inspect how the converter and Insights handle English and Farsi and mirror that exactly. Do not invent a new language URL scheme. Add `hreflang` tags only if separate language URLs already exist on the site.
- **Search and previews:** page `<title>` and meta description in the page language, `<link rel="canonical">`, Open Graph and Twitter tags using the site's existing default image (no new image needed), the new URLs added to `sitemap.xml` (if the site has one), and no `noindex`.
- **Navigation:** add a "Tools" item to the main navigation linking to `/tools`. On the tool page, a small "← Tools" breadcrumb back to the index. No links to or from the Insights verdict.

## 4. Look and tone

- Same visual family as Insights. Reuse tokens, fonts, cards, chips, dark and light modes.
- English and Farsi with the existing toggle. Farsi: right-to-left, Persian digits, Jalali dates, chart time axes left-to-right.
- Mobile first, 360px, no sideways scrolling. On mobile, once the headline scrolls out of view, a slim sticky bar shows the final amount (future money and today's money) so the answer stays visible while "More options" is open. Respect safe-area insets.
- Tone: short calm sentences, exactly one stronger sentence at the result (for example "Small and steady beats big and late.").

## 5. The interface

### 5.1 Default view (top to bottom)
1. Title "Compound Wealth" and the one-line promise. Beside it, two small chips for the country: **Australia (AUD)** default, **USA (USD)**. The country sets currency, assets, cash rate and inflation average.
2. **Headline** (one sentence, large): "Investing 100 a month for 20 years: you put in 24,000, and it could grow to about 50,000 (about 33,000 in today's money)." If more options give age or salary, it adapts. Under it, one smaller line with the range: "If it goes worse: about X. If it goes better: about Y." Then the one strong sentence.
3. **Three controls:**
   - **Per month:** a number box with a minus and plus stepper, and quick chips 50 · 100 · 200 · 500. Any positive number allowed.
   - **For how many years:** chips 10 · 20 · 30 and a small number box (1–50). They stay in sync.
   - **Invest in:** chips. Australia: ASX 200, S&P 500, World shares, Gold, Cash. USA: S&P 500, World shares, Gold, Cash. (Hide a chip if its figures are missing, see 8.) One is chosen at a time; default ASX 200 (Australia) or S&P 500 (USA).
4. **Chart:** stacked area of "money you put in" and "growth", the band, crossover marker, milestone markers, plus thin lines for the other assets and cash. Direct labels and line styles, not colour alone. Text summary for screen readers.
5. Three tiles: "You put in", "Growth added", "You could have", with a small toggle between future money and today's money.
6. Milestones (up to 3 on the page; the cards show up to 5): "You pass 25,000 in 2031."
7. Two small buttons: **More options** and **Save as card**.

### 5.2 "What if…" (below the chart, light and optional to read)
- **Small changes:** "1% more adds X, 1% less loses Y." Fixed mode without salary: 10% of the amount, and say so. With salary known: 1% of salary.
- **Starting later:** "Starting 5 years later costs you X." (Choose 1, 3 or 5 years, default 5.)
- **Cash comparison:** "If you only save it as cash: about Z."
- A costs line only when costs apply: "Costs took X (Y% of what you put in)."

### 5.3 More options (collapsed; four plain groups)
- **About you:** monthly salary after tax and a switch "Use % of my salary instead" (3% default, 0.5%–30%); current age (adds "at age N"); starting amount (0; treated as already invested, no purchase cost); years-of-salary line appears once salary is entered.
- **Costs:** yearly cost (0.2%, "an assumption, change it", 0%–3%); cost per purchase (0); how often I buy (every month, or every 3 months).
- **Rates:** return = Average (default), Custom rate, or Custom range (low and high); inflation (country average, editable 0%–15%); yearly increase of what you invest (fixed mode 0%; percent mode = country inflation average; 0%–15%); "what if it's lower" points (2).
- **Dates and compare:** custom start and end month (future only; start cannot be before this month, end up to 50 years); a collapsible "Compare assets" table (every asset for the country plus Custom and Cash: rate used, final amount, low and high).

Rules: recalculate instantly; clamp out-of-range values with one small plain message; reload resets everything.

### 5.4 Page bottom
- **How is this worked out?** (collapsible, in plain words): four-line method; the 20-year/30-year overlap note; figures are total returns before tax unless a row says price only; yearly cost is an assumption; cash waiting between purchases earns nothing; "employer super may already exist, so this is for extra money you invest on your own" (no rate stated); no taxes; exchange-rate effects are only those inside the AUD figures; past performance is not a promise. Then the site's existing single disclaimer component, unchanged. Staleness note when needed (8).

## 6. The maths (exact)

### 6.1 Core engine
Annual rate `r` is a decimal. Net rate `r_net = r − cost`. Monthly rate `i = (1 + r_net)^(1/12) − 1`. Months run from the start month to the end month inclusive (`n` months), `m = 1 … n`. Default start = this month, end = start + years.
- Deposit in year `y` (0 for the first 12 months): `d_m = base × (1 + g)^y`, where `base` is the fixed amount or `salary × share`, `g` the yearly increase.
- Each month: `balance = balance × (1 + i)`; then `pending += d_m`.
- **Purchase months:** every `k`-th month (`k` = 1 or 3), and always the last month. In a purchase month: if `pending > fee`, then `balance += pending − fee`, `fees_paid += fee`, `pending = 0`. If `pending ≤ fee`, skip the purchase (pending carries to the next purchase month). Money waiting in `pending` earns nothing.
- Final value = `balance + pending` (pending shown as "not yet invested" if above 0).
- Total put in = starting amount + sum of all `d_m`. Growth = final value − total put in (fees are a cost and are not added back). Show total fees and fees as a % of total put in when fee > 0.
- If `fee > 0` and each purchase is below 100 × fee (fee over 1% of each purchase), show one plain line: "Costs take a large share of each purchase. Buying every 3 months can help." If the plan never invests (every purchase ≤ fee), say so plainly.
- **Today's money:** divide by `(1 + inflation)^(m/12)` (also for deposits).
- **Crossover:** first month where cumulative growth ≥ cumulative total put in; reported as a year and, with age, "at age N". If never, say so plainly.

### 6.2 Baseline, band and what-if
- Baseline rate `b` = the **lower** of the 20-year and 30-year figure in the figures file for the chosen asset and country. Show both figures and the choice in plain words in the "How is this worked out?" section and as a tiny line under the chart: "Last 20 years: X%. Last 30 years: Y%. We use the lower one." About notes the two periods overlap.
- **Band:** low end = `b − what-if points` (labelled "if it goes worse", clearly a what-if and not data). High end = the **higher** of the 20- and 30-year figures if the two differ by at least 0.5 points; otherwise `b + what-if points` (labelled a what-if). Middle line = `b`.
- Custom range: low and high as typed; middle = average. Custom rate: single line, no band. Cash has no band.
- Only one measured figure for an asset: baseline = that figure, band = `b ± what-if points`, labelled what-ifs.

### 6.3 Foreign assets in AUD (Australia preset only)
For S&P 500, World shares and Gold in AUD: `AUD growth factor = USD growth factor × (FX_start / FX_end)`, where FX is USD per 1 AUD at the start and end of the period. Annualise: `r_AUD = (growth factor)^(1/years) − 1`. Use published endpoint exchange rates from the RBA or another official source; record both endpoint dates and values in the figures file. Test: 10% a year in USD over 20 years with FX moving from 0.80 to 0.40 gives about **13.88%** a year in AUD.

### 6.4 Milestones
Thresholds (config): 5k, 10k, 25k, 50k, 100k, 250k, 500k, 1M, 2.5M, 5M, 10M. Keep those at or below the final value in the view currently shown, show the largest ones (3 on the page, 5 on the cards). Each shows month and year and, with age, "at age N".

## 7. Figures file (no data feeds in phase 1)

One file in the repo (for example `compound-figures.js` or `.json`, with a clearly marked configuration block and plain-English comments at the top) holds every number the page uses. **Do not invent or estimate any figure.** For each row store: asset, country/currency, annual return for the last 20 years and the last 30 years (or the longest period of at least 10 years, labelled), total return (dividends included) or price only, the period end date, source name, source URL, and a note on how it was derived.

Rows needed:
- **AUD (Australia):** ASX 200, S&P 500 (AUD), World shares (AUD), Gold (AUD), Cash (average RBA cash rate), Inflation (average Australian CPI).
- **USD (USA):** S&P 500, World shares, Gold, Cash (average Fed funds rate), Inflation (average US CPI).

Sourcing rules:
- Prefer official or provider-published figures (index provider or fund-provider fact sheets, central bank and statistics-office data). A single published figure with its source named is fine. Do not copy whole tables or republish data series.
- Prefer **total return**. If only price-only exists, store it and label the row "price only" (shown on the page).
- Foreign assets in AUD: take the published USD total return and apply 6.3 with endpoint FX from an official source, with the working in the note.
- Cash average = average of the official policy rate over the period. Inflation average = annualised change of the CPI index between the period endpoints.
- **Forbidden:** scraping sites whose terms forbid it, paid data, restricted-licence data not published for public use, guessing numbers, numbers from memory. If a reliable figure cannot be found for a row, **hide that asset chip** for that country and list exactly what is missing and where it could come from in the report. The page must still work with whatever remains (Custom rate and Cash always work if their figures exist; if even those are missing, the page still works with a Custom rate).
- **No web access fallback:** build everything anyway, ship with every asset that lacks figures hidden, and list every needed figure and suggested sources in `COMPOUND-WEALTH-REPORT.md`.
- Staleness: the file has one "figures checked on" date. If older than 18 months, the page shows "These figures may be out of date." Test it.

## 8. Cards

Both cards open from the single **Save as card** button (a small choice: "Print or PDF", "Phone card"). Both are generated in the browser; nothing is uploaded or stored.

### 8.1 A4 PDF card (print-to-PDF)
**Method: browser print-to-PDF from a styled card.** No JavaScript PDF library (they break Persian letter shapes and right-to-left text).
- "Print or PDF" builds a dedicated print view and calls `window.print()`. One plain line: "In the window that opens, choose Save as PDF." Set `document.title` to `Currena-Compound-Wealth-<yyyy-mm-dd>` during printing, then restore it.
- **One A4 portrait page, always.** `@page` size and margins, page UI hidden, `print-color-adjust: exact`. If content would spill, drop optional blocks in this order: milestones beyond three, what-if cards, compare table.
- Always a light, ink-friendly palette (even in dark mode). Optional "Card style: Light / Dark" toggle in the print view; Light default.
- Language follows the page: Farsi card is RTL with Persian digits, Jalali date, LTR chart axes. Embed self-hosted fonts (woff2) for Latin and Persian.
- Contents: Currena wordmark and "Compound Wealth" title; the big number (future money with today's money beside it); one-line plan summary ("100 a month · 20 years · Australian shares · 8.1% a year, the lower of the 20- and 30-year figures"); inline **SVG** chart (stacked area, band, milestone markers); up to five milestones; three tiles; costs line when it applies; assumptions box (rates with periods and sources, yearly cost, purchase costs, inflation); the strong sentence; the single disclaimer; footer with "currena.ir/tools/compound-wealth", the generated date and "Made in your browser. Nothing was saved."
- Decoration: calm, editorial, clearly Currena: a quiet growth motif as inline SVG (growth rings or rising contour lines in one corner), thin rules, one accent colour from the Currena palette, generous spacing. No clip-art, photos or heavy gradients. Must look good in greyscale.
- Works on desktop browsers and on mobile Chrome and Safari via print or the share sheet; if printing is blocked, show a plain fallback message.

### 8.2 Phone card (the reminder)
A full-screen view designed to be **screenshotted and used as a lock screen**. It is a view only; nothing is stored.
- Fills the viewport (`100dvh`), portrait. On desktop it shows as a centred phone-shaped frame (about 9:19.5).
- **Lock-screen safe zones:** top ~28% free of text (clock and notifications), only quiet decoration; bottom ~12% free (flashlight and camera buttons). Content sits in the middle band.
- Content, readable in two seconds: the big final amount (future money, today's money smaller beneath); "100 a month · 20 years"; a simple stacked-area sparkline (SVG); the next milestone ("Next: 25,000 in 2031"); the strong sentence; tiny footer "An illustration, not a promise · currena.ir".
- **Dark by default** with a Light option. Minimum text size 14px at 390px width; no clipping at 360×800, 390×844 and 430×932. Help line: "Take a screenshot, then set it as your lock screen." Tap or a close button leaves the view.
- Same language rules and decoration family as the A4 card. No PNG export in phase 1.

## 9. Known limits (state on the page, in the collapsible section)

- Averages are not a forecast. A period with a crash or a boom changes the answer a lot, and the 20- and 30-year figures overlap.
- No taxes. Exchange-rate effects are only those already in the AUD figures.
- Figures are reviewed by hand and carry a "checked on" date.

## 10. Quality rules

- Maths in one small, separate, well-named module with a config block at the top (milestone list, defaults, thresholds, each with a plain-English comment); the figures file is separate.
- Accessible: labelled inputs, keyboard use, visible focus, AA contrast in light and dark, chart text summary.
- Reuse Insights' chart approach and libraries; no large new libraries.
- Do not change or degrade Insights, the converter, or narrator work; do not move or rename existing pages. Run the repo's gates command before and after.

## 11. Config block (top of the maths module)

Defaults: amount 100, years 20, yearly cost 0.2%, what-if points 2, band threshold 0.5 points, inflation limits 0–15%, milestone list, staleness months 18, country default Australia. Each with a plain-English comment.

## 12. Required tests

**Maths**
1. Fixed 100/month, 20 years, 0% increase, 0 cost, 7%, no start amount, no fee, monthly: final ≈ **50,754** (±0.5%), put in exactly 24,000.
2. Percent mode: salary 5,000, 3%, 20 years, 7%: final ≈ **76,130** (±0.5%), put in exactly 36,000.
3. Fee 10 per purchase, monthly, same inputs as 1: final ≈ **45,678** (±0.5%); fees paid exactly 2,400.
4. Fee 10, every 3 months: final ≈ **48,785** (±0.5%); fees paid exactly 800.
5. Fee ≥ purchase amount: never invests, pending shown, plain message. Fee over 1% of each purchase shows the costs line.
6. 0% return: final = put in (minus fees). Higher yearly increase gives more put in. Yearly cost lowers the final.
7. AUD conversion: the 10% / 0.80 → 0.40 / 20-year case gives ≈ 13.88% (±0.05).
8. Baseline = lower of 20- and 30-year; band rule; single-figure fallback; hidden chips when figures are missing; staleness note after 18 months.
9. Dates: start before this month clamps; end after 50 years clamps; year chips set the end date.
10. Milestones: only thresholds at or below the final value, correct count, month and age.
11. Extreme and empty inputs (50 years, 30%, 25%) never give NaN or a broken page.

**Simplicity (section 0.1)**
12. On a fresh load, with no interaction, the headline answer is visible (no empty state).
13. In the default state the visible interactive groups are exactly: country chips, the three controls (amount, years, asset), "More options", "Save as card" (plus the site's own language toggle and navigation). Assert it.
14. At 390×844 the headline and all three controls are visible together without scrolling (screenshot assertion). Same check at 360×800 and 430×932.
15. Changing amount, years or asset takes at most two taps or one short typing action (scripted interaction counts).
16. All "More options" groups are collapsed by default and contain nothing visible until opened.
17. The headline always contains both future money and today's money, and the range line always shows the lower figure. Costs line appears when costs are set.
18. A plain-language check: no visible label on the default screen is on a banned-jargon list the agent writes from the style guide; average sentence length on the default screen is 15 words or fewer.

**URLs and routing**
19. `/tools`, `/tools/compound-wealth` load directly and after refresh; `/tools/` and `/tools/compound-wealth/` redirect (301) to the canonical form; `/tools/unknown` shows the existing 404; the existing converter and `#/insights` still work; no existing URL changed.
20. Title, meta description, canonical link, Open Graph tags are present in the page language; `sitemap.xml` includes both new URLs when the site has a sitemap; the nav "Tools" link works; the breadcrumb works.

**Cards and general**
21. **No storage:** assert nothing is written to localStorage, cookies or the network from page use, including both cards.
22. **A4 PDF:** in a headless browser print the card in English and Farsi, light and dark style, with and without costs; each result is **exactly one A4 page**, text extractable (key numbers found), Persian digits and joined Persian letters correct (inspect a rasterised image), SVG chart and decoration present. Save sample PDFs in the repo (for example `docs/compound-samples/`).
23. **Phone card:** render at 360×800, 390×844, 430×932 in English and Farsi, dark and light; no overflow or clipping; top 28% and bottom 12% free of text; minimum text size met; screenshots saved.
24. Visual checks of the page at 360px, tablet, desktop, light and dark, Farsi and English.

## 13. Definition of done

1. `currena.ir/tools` and `currena.ir/tools/compound-wealth` live and correct, with nav link, breadcrumb, sitemap, meta tags; nothing existing moved.
2. The simplicity contract (0.1) holds, proven by tests 12–18 and screenshots.
3. Figures file complete and sourced (or rows hidden and listed in the report); the lower-of-20-and-30 rule shown in plain words.
4. All tests pass, including the fee and AUD tests.
5. Nothing stored on the device or server; no network calls from the page for data.
6. A4 PDF card and phone card verified, samples saved.
7. Gates command passes; Insights, converter and narrator unaffected.
8. `COMPOUND-WEALTH-REPORT.md` written: what was built, every figure with value, period and source link, how each AUD figure was derived (with endpoint FX values and dates), which rows are hidden and exactly what is needed to fill them, config values chosen, routing decisions (language handling, redirects), anything unfinished, and how to roll back.

## Appendix A: Later phases (not now)

- **Phase 2:** time machine using real history (US first via a published dataset; Australia only if a legally reusable source exists), historical-outcome ranges (worst, middle, best over all past periods of the chosen length) to replace the what-if band, scheduled refresh of figures.
- **Phase 3:** compare two plans, goal tab, asset mix, live conditions strip, more currencies.
- Possible: Toman view; PNG export of the phone card; progress tracking belongs in the owner's money/runway tracker, not in this tool. Each future addition must pass the simplicity contract or live inside "More options".

## Appendix B: Owner decisions

Still apply: fixed, custom and percent amounts; optional age; calm tone with one strong sentence; years-of-salary line; 1% more/less; end-of-month deposits; both money views; custom rate or range; yearly cost 0.2%; super note; stacked chart plus thin lines; sticky mobile results; wording per style guide; PDF by browser print-to-PDF; Australia and USA defaults using the lower of the 20- and 30-year figures; milestones; World shares; no storage; phase 1 for the owner himself; phone card as the reminder; phase 1 scope.
New in v5: simplicity above everything; URL structure `currena.ir/tools/compound-wealth` (name chosen by Claude: short, descriptive, matches the tool name), with a `/tools` index.
