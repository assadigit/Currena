# Test prompt for the coding agent (paste once, then leave it running)

You are working in the Currena repository (github.com/assadigit/Currena, Cloudflare Workers). The first version of the **Compound Wealth** tool is live at https://currena.ir/tools/compound-wealth (index at https://currena.ir/tools). The spec it was built from is `COMPOUND-WEALTH-SPEC.md` (latest version, v6) in the repo root. Your job: **test it rigorously in three areas, then fix every real defect, then re-test**, without asking me any questions.

The three areas:
1. Is the maths right?
2. Is the data reliable and accurate?
3. Does it do what it is supposed to do (the spec, and above all the "simple" rule)?

Put `compound_reference_check.py` (the independent reference engine I gave you) in the repo root. Run `python3 compound_reference_check.py --selftest` first; all lines must say PASS.

## Ground rules

- Use a real browser (Playwright; install it if needed). Test both the live site and a local build if one exists. Save all evidence (screenshots, PDFs, logs, JSON) under `docs/compound-tests/`.
- **Phase A: test only, change nothing.** Phase B: fix. Never fix before the whole of phase A is written into the report.
- Never mark a test PASS without evidence. If something cannot be opened or checked, mark it UNVERIFIED and say why.
- Never invent a number. Never take a figure from memory. If you cannot confirm a figure from its source, say so.
- Product decisions (not code defects) go into an "Owner decisions needed" list. Do not change them yourself.
- Write the result into `COMPOUND-WEALTH-TEST-REPORT.md`: a one-paragraph verdict per area, a table of every test (id, what was tested, expected, actual, PASS/FAIL/UNVERIFIED, evidence link), the defect list (severity, how to reproduce, cause, fix status), the data-source table, and the owner-decisions list.

## What I already found by hand (verify each one, do not assume)

I recomputed the live defaults with the reference engine: 100 a month, 20 years, Australian shares at 7.2% (the lower of 7.2% over 20 years and 9.0% over 30 years, both "to 30 June 2026"), yearly cost 0.2%. The page showed: put in 24,000; growth 26,800; final about 50,800; today's money about 29,400; "if it goes worse" about 40,600; "if it goes better" about 62,400; crossover June 2045; milestones June 2033, November 2039, September 2046; "1% more adds 5,080"; starting 5 years later costs 19,600; cash about 32,100. **All of these matched the reference engine** (the today's-money figure implies 2.77% a year inflation). Things that need checking or fixing:

- **A. Confusing wording:** the small-changes card says "1% more adds 5,080. 1% less loses 5,080." but the real change is 10% of the monthly amount (10 a month). Readers will think 1% of the amount. Reword so the change is stated in money ("10 more a month adds X"), unless salary is known, in which case 1% of salary is fine. (Defect if confirmed.)
- **B. Cash line:** "If you only save it as cash: about 32,100" implies about 2.83% a year after cost, or about 3.03% before the 0.2% yearly cost. Find out whether the 0.2% fund cost is also deducted from cash. Cash has no fund fee, so deducting it makes saving look worse than it is. Fix if confirmed; otherwise explain.
- **C. Today's money uses a long-run inflation average (about 2.8%)**, but the Australian Bureau of Statistics reports annual inflation of 3.8% to June 2026 and 4.3% to September 2026. Check the "How is this worked out?" text says clearly which inflation is used. If not, add one plain line. (Owner decision if the method itself should change.)
- **D. Data date:** the figures say "to 30 June 2026". Independent published data to 30 September 2026 exists (see section 2 below). Check how old the figures file is, whether the 18-month stale note works, and report how far the figures drift from newer data.
- **E. Labels:** the chip says "Australian shares", while the spec said ASX 200. Check which index the figure really comes from and that the page says so.
- **F. Small polish:** the tiles show 24,000 and 50,800 without a currency symbol while the headline has "A$"; the header "Tools" item looked unlinked in a text extraction; the "Open ↗" arrow is used on an internal link. Verify each in the browser and fix if they are real.

## 1. Maths tests

1. Replay the grid: run `python3 compound_reference_check.py --grid docs/compound-tests/grid.json --rate <baseline> --higher-figure <higher> --inflation <inflation>` using the page's real figures, then drive the live page through the same scenarios (set amount, years, asset, costs, buying costs, how often, yearly increase, starting amount through the interface) and compare headline, tiles, range line, what-if cards, crossover and milestones. The page rounds the headline to the nearest 100 and small cards to the nearest 10; accept differences of one rounding step, nothing more. Every mismatch is a FAIL with the exact inputs.
2. Run all of these through the interface too: spec vectors (7% custom rate, cost 0: 50,754; percent mode 3% of 5,000: 76,130; fee 10 monthly: 45,678; fee 10 every 3 months: 48,785).
3. Edge cases: amount empty, 0, negative, letters, decimals, comma decimals, Persian digits typed in; years 0, 1, 50, 51, decimals; custom dates before this month and beyond 50 years; fee at or above the purchase amount (must say it never invests); fee over 1% of each purchase (must show the costs warning); very large amounts; rate −5% and 25%; custom range with low above high.
4. Invariants on every scenario: put in + growth = final; today's money is below future money when inflation is above zero; low ≤ middle ≤ high; more money or more years never lowers the result; chips and number box stay in sync; the future/today's-money toggle changes tiles, milestones and chart markers consistently.
5. Time: use the browser clock (Playwright clock control) to test month rollovers (31 January, 29 February 2028, 31 December), and confirm the start month is "this month" and milestone dates are right.
6. Country: switching Australia/USA must change currency symbol, asset chips, cash rate, inflation, figures and headline consistently; check the USA preset with its own reference numbers.
7. Percent-of-salary mode and every More options field: test each one alone and in combination with the grid.

## 2. Data reliability and accuracy

1. Find the figures file in the repo and print every row (asset, currency, 20-year and 30-year return, total return or price only, period end date, source name, source link, derivation note).
2. For every row, open the source link and confirm the number, the period, the index and the currency. Recompute derived rows yourself: CAGR from endpoint values, AUD conversion with `aud_rate()` using the recorded endpoint exchange rates, cash average from the official policy rate series, inflation from the CPI index endpoints. Tolerance 0.05 percentage points for derived rows. Mark each row VERIFIED, MISMATCH or UNVERIFIED.
3. Cross-check against independent published sources, allowing for index differences and the 3-month date offset (a gap above 0.5 points needs an explanation). References I found, all at 30 September 2026, from Colonial First State "Investment essentials" (https://www.cfs.com.au/content/dam/prospects/i/n/v/investment_essentials.pdf): 20-year annualised Australian shares (S&P/ASX 300 Accumulation) 6.97%; global shares (MSCI World Net, A$) 8.95%; cash (Bloomberg AusBond Bank Bill) 3.25%. Also look for the equivalent June 2026 edition, the Vanguard Australia index chart to 30 June 2026 (https://fund-docs.vanguard.com/AU-Vanguard_Index_Chart_poster.pdf), the ASX investment products report for June 2026, the RBA statistical tables, the ABS CPI series, and for the USA the Federal Reserve and Bureau of Labor Statistics data. Add any better primary source you find.
4. Check: both periods end on the same date; the "checked on" date; total return versus price-only labels are true; gold's AUD figure uses real endpoint prices and exchange rates; the World shares row names its index; chips with missing figures are really hidden; the page names the index used for each asset.
5. Check the use of each source's data respects its terms (a single published figure with the source named is fine; copying tables is not).
6. Report the largest unexplained gap between any figure and its best independent cross-check.

## 3. Does it do what it is supposed to do

Test every statement in the spec. At minimum:

1. **Simplicity contract (spec 0.1 and tests 12–18):** the answer is visible on arrival with no interaction; the default state shows exactly the country chips, three controls, "More options" and "Save as card"; at 360×800, 390×844 and 430×932 the headline and all three controls are visible together without scrolling; at most two taps change the main question; all More options groups are collapsed by default; the headline always shows future money, today's money and the lower figure; plain-language check on every visible label (average sentence length 15 words or fewer, no jargon).
2. **Routing and search (spec 3 and tests 19–20):** `/tools` and `/tools/compound-wealth` load directly and after refresh; the trailing-slash versions return a 301 to the canonical form; `/tools/unknown` shows the site's 404; the converter and `#/insights` still work; title, description, canonical, Open Graph tags and the sitemap entries are right; the "Tools" nav item and breadcrumb work.
3. **Both cards (spec 8):** A4 print: print the card to PDF with the browser in English and Farsi, light and dark style, with and without costs; each must be exactly one A4 page, text extractable, Persian digits and joined Persian letters correct (inspect a rasterised image), SVG chart and decoration present. Phone card: render at the three phone sizes in English and Farsi, dark and light; no clipping; top 28% and bottom 12% free of text; minimum text size 14px at 390px width.
4. **Farsi:** whole page in Farsi: RTL, Persian digits, Jalali dates, chart axes left-to-right, no English leftovers, no broken layout, wording follows `INSIGHTS-L1-STYLE-GUIDE.md`.
5. **Store nothing:** assert no writes to localStorage, sessionStorage, cookies, IndexedDB, and no network calls caused by using the tool or the cards.
6. **Truth and honesty:** the band is labelled as a what-if where it is one; the "How is this worked out?" text states the method, the 20-year/30-year overlap, total versus price-only, the yearly-cost assumption, no taxes, and past performance not guaranteed; the disclaimer is present.
7. **Quality:** keyboard use of every control, visible focus, axe-core accessibility scan in light and dark, contrast, no horizontal scroll at 360px, no console errors, no layout jump while typing, response under 100 ms on input, Lighthouse performance and accessibility scores.
8. **Five-second test:** take the default screenshot at 390×844. Write down in plain words what a stranger would understand it says and what they would do next. Flag anything unclear.
9. **Does it serve the goal?** (a tool that motivates me to keep investing): judge honestly whether the page and cards make the result felt and kept, list anything that makes the page harder to use than it needs to be, and list the three changes that would add the most value. These are owner decisions, not edits.

## Phase B: fix and re-test

1. Fix every defect you classified as a code or wording defect (including A, B if confirmed, F). Do not change owner-decision items. Keep each fix small and add a regression test for it.
2. Re-run all of phase A. Everything that can pass must pass. Update the report with before/after results.
3. Make sure the repo's gates command passes and Insights, the converter and any narrator work are unchanged.
4. Commit in small clear commits on a branch named `compound-wealth-fixes`, push it, and open a pull request if the setup allows.
5. Finish `COMPOUND-WEALTH-TEST-REPORT.md` with: final verdict per area, remaining UNVERIFIED items and exactly what would be needed to verify them, and the owner-decisions list with your recommendation for each.

## Rules

- Never ask me questions. Decide, write it in the report, continue.
- Simplicity first: do not add visible controls to the default screen to fix anything.
- Never invent numbers. Never mark a test PASS without evidence.
- Plain language in everything the user sees.
