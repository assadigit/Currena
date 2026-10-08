# 06. Insights UX round 2: signal-first density pass

Date: 2026-10-08. Status: **decisions made, ready to build.**
Audience: the coding agent. Read `AGENTS.md` first. If this file conflicts with `AGENTS.md`, `AGENTS.md` wins.

## 1. Why this round exists

The owner reviewed the built Insights page (English, desktop) and gave this verdict: the look is much better than before, but the page is still confusing and dense, and the eye cannot find the important numbers and signals quickly. A UX roast and a design review found the same root cause: **nobody decided which numbers matter, so about 40 indicators all carry the same weight.** Several places also contradict themselves, which hurts trust.

This round makes a few signals large and the rest quiet, and fixes every contradiction.

**State of the repo when this was written:** `origin/main` already contains the reviewed build (I15 to I18): question gauges, the hero with two verdict meters, the prices board, alert cards and compact rows in Global|Australia lanes, the details panel, and since I17 the v2 sections "Together" (six connection cards) and "What the signals say" (gold and silver, behind `SIGNALS_ENABLED`, shipped true). Components live in `apps/web/src/components/insights/` (`HeroBlock`, `VerdictMeter`, `PricesBoard`, `Together`, `Signals`, `AlertCard`, `CompactRow`, `DetailsPanel`, `LaneSwitch`, `FilterBar`, `NextUpStrip`, `JumpNav`, `AboutTheData`), assembled in `routes/Insights.tsx`. Treat the reviewed screenshot as the baseline for the issues below, but **re-check each issue against the current code before changing it**: some may already be fixed by I16 to I18.

## 2. Owner decisions (final, do not reopen)

| # | Decision |
|---|---|
| D1 | Attention order, first to last: **verdict, named alerts with their numbers, prices (oil, gold, silver, Bitcoin), "what it means for my money", calendar.** |
| D2 | Default view is **signals first**: needs-attention and unusual items are visible. Normal and context items are collapsed behind "See all". |
| D3 | Each indicator shows concern in **two tiers**: "Needs attention" and "Unusual". |
| D4 | The hero shows the verdict **with its gauges and a one-line reason.** |
| D5 | Search, keyboard hints, filter, calendar download and CSV move behind a small **Tools** menu. |
| D6 | The "what it means for my money" panel ships in v1 as a **slim version (maximum 4 lines).** |
| D7 | **Global comes first, Australia second** (hero and lane default). Remove the "Show Global first" toggle. |
| D8 | The proposed alert thresholds for the new indicators are **approved.** |
| D9 | Persian wording is approved. Write all new Persian strings natively, in the same register as the existing corpus. |

Not part of this round: new connection or signal content (the I17 sections already exist; see section 10 and R7b).

## 3. Target page order

1. Page header (title, one-line subtitle, "Data as of {date}", Tools button).
2. Hero: Global verdict, Australia verdict (Global first). Each has a meter, its gauges, a one-line reason, and needs-attention tiles with numbers. One "biggest move" line under both.
3. Section pills (sticky): Status, Prices, Together, Signals (when enabled), Indicators, About.
4. Prices strip: oil (Brent), gold, silver, Bitcoin.
5. "What it means for my money": slim panel, at most 4 lines.
6. "Together" (connection cards) and "What the signals say" (gold, silver): already built (I17). Keep them below the money panel and above the indicators, but apply the density rules in R7b below so they do not bury the signals.
7. Indicators: visible lane switch (Global | Australia), then question groups. Needs-attention and unusual items visible, the rest collapsed.
8. Next up (calendar): last content block before About.
9. About this data (one copy).

## 4. Definitions used below

- **Needs attention:** the indicator's published warning rule has fired. (Internal status stays `warning`; only the user-facing word changes. The old word "Alert" and Persian «هشدار» are retired in the UI.)
- **Unusual:** no rule fired, but the latest value is in the top or bottom 10% of its own 10-year range (percentile at or below 10, or at or above 90). Requires enough history (reuse the existing 30-observation percentile floor).
- **Normal:** neither of the above. **Context:** informational only, never votes. **Stale / unavailable:** unchanged.
- **One tier per card.** If both apply, "Needs attention" wins. Details may add "also unusual".

Proposed Persian words (non-binding; match the corpus register): نیازمند توجه (Needs attention), غیرعادی (Unusual).

## 5. Blocks

Each block lists: **Do**, **Why**, **Accept**. Build them in order. Tests come first.

### R1. Lane order and a visible lane switch
**Do:** Put Global first and Australia second in the hero and in the lane order. Remove the "Show Global first" toggle. Add a visible segmented control "Global | Australia" above the indicator groups. The hero's "View section" links set the same switch. Remember the choice per browser (localStorage in try/catch; fail open). Default Global.
**Why:** Today only Australia shows and there is no visible way to reach Global.
**Accept:** First visit shows Global. The switch is keyboard reachable and shows which lane is active.

### R2. Hero verdict: meter, gauges, one-line reason
**Do:** For each region show: region name; the verdict word; a four-step segmented meter with a marker on the current step and a text alternative (`role="img"`, label like "Global: Stressed, step 3 of 4"); the gauges as small readings (gauge name and its step word); and one reason line.
The reason line comes from a fixed table, never free text. Template: "{k} of {n} areas are {Step word}: {names}. {Others} are {calmer word}." When every gauge is step 1, use one calm sentence. **The sentence must never contradict the gauges:** if any gauge is at step 3 or higher, the sentence names it, and no reassurance such as "not worth worrying about" may appear.
**Why:** The built hero said "Cautious: not worth worrying about" while two of its three groups said "Stressed". It also showed 4 of 16 in alert as "Stressed" and 5 of 13 as "Cautious" without saying why.
**Accept:** Unit tests over the full table: for every combination of gauge steps, the label, the reason and the meter step agree. No test case produces a reassurance phrase when a gauge is at step 3 or 4.

### R3. Needs-attention tiles with numbers
**Do:** Under each verdict, show up to 3 tiles for the indicators that need attention, sorted by how far they sit in their own range. Each tile shows the plain name, the **value with its unit (large)**, the rule in short form ("above 3%") and a link that scrolls to and opens the card. If more than 3 need attention, add a "+n more" tile. Make the number the largest text in the tile.
**Why:** The previous hero listed names only, so the reader had to open each one to see a number.
**Accept:** At 1280×800 the first viewport shows both verdicts and at least 3 tiles with numbers per region (or all of them when fewer exist).

### R4. Biggest-move line
**Do:** Keep one line under the hero: the item with the largest move relative to its own history. Show the plain name, the move in the unit people understand (percent for prices, points for rates) and a short "unusually large for this indicator" reason. Remove the large beige callout box.
**Why:** The callout named a +0.48-point yield move while oil was up 22.7% on the same page, and never said why.
**Accept:** The line always shows its reason. A test confirms stale items are excluded.

### R5. Two-tier status model
**Do:** Implement the tiers in section 4 as one pure function with unit tests: tier, precedence, history floor, stale handling. Rename UI words everywhere (chips, filters, counts, hero text, CSV status words, copy corpus, tests). Keep internal ids unchanged.
**Why:** The built page showed "Alert" next to "typical" on the same card.
**Accept:** No card ever shows a tier word and a contradicting position word. A test scans rendered cards.

### R6. Needs-attention face: rule and live value
**Do:** On every needs-attention card, show one line on the face: the rule in plain language and today's value, for example "Rule: above 3% · now 3.9%". Reuse the existing plain-language rule text. Show the 10-year position only on unusual cards (word plus bar, with end labels). On needs-attention cards the position moves to Details. Normal rows show no position.
The consequence line must agree with the tier. If it quotes a band or a range, it must not say a needs-attention value is "inside" it.
**Why:** On the built page 3.9% inflation was marked as needing attention, yet the text said it sat "inside or near the 2–3% band". The page also promised the rule is "shown on its card" and it was not.
**Accept:** Every needs-attention card shows its rule and value. A copy test rejects phrases that contradict the tier (for example "usual range" on a needs-attention card).

### R7. Default view: signals first
**Do:** In each question group, show all needs-attention items plus unusual items until at least 3 items are visible; collapse the rest behind "See all {n} indicators" (per group). Needs-attention items are never hidden by this cap. Deep links (`?card=<id>`), tile clicks and Tools search expand the needed group automatically. The "See all" state is per session.
**Why:** About 40 equal items hide the few that matter (decision D2).
**Accept:** With the production snapshot, the default lane shows fewer than half of its indicators. Every needs-attention item is visible.

### R8. Row and card layout fixes
**Do:**
1. **Never truncate a consequence line.** Remove ellipsis, `line-clamp` and `truncate` from consequence lines. Let them wrap.
2. One compact-row anatomy, in this order: tier icon and word, plain name, value with unit, 30-day change, tiny sparkline, Details. One column on narrow screens and at most two on wide screens.
3. Alert-style cards sit in a grid with a minimum width wide enough that "Details ›" never wraps (`white-space: nowrap` on the control).
4. `align-items: start` so one open item never stretches its neighbours; no empty holes in the grid.
**Why:** Rows showed "the market cooling from its…" and "the setting that usu…", and "Details ›" wrapped onto two lines.
**Accept:** A static test fails if any consequence-line element has an ellipsis style. Browser check: `scrollWidth <= clientWidth` for every consequence line.

### R9. Neutral sparklines
**Do:** Draw every sparkline in one neutral color. Mark the last point. Show direction with the number and an arrow, not with color.
**Why:** Red and green encoded direction, made rising inflation look green, and fails for color-blind readers.
**Accept:** A test confirms one stroke token for all sparklines.

### R10. Prices strip
**Do:** Show four tiles: oil (Brent), gold (US$ with A$ beside it), silver, Bitcoin. Each tile has the same anatomy: plain name, **large price with unit**, 7-day and 30-day change (or whichever exist, shown the same way for all), position word, one practical consequence line, and "as of {date}". No raw tickers or series ids. Copper and iron ore move into the indicator lanes. Show the gold-per-Bitcoin and silver-per-Bitcoin ratios as one small line labelled "context only", placed so it can never overlap the tile.
Consequence lines are hedged and practical, for example oil: petrol and transport costs usually follow within weeks. Avoid market jargon and unverifiable claims (for example, do not say gold easing means calm is returning).
**Why:** The built board mixed sizes, showed changes for oil only, leaked "DCOILBRENTEU", and its Bitcoin row was clipped by the ratio box.
**Accept:** All four tiles share one layout. A test fails on any ticker or series id in a rendered name.

### R11. "What it means for my money" (slim)
**Do:** Show at most 4 lines, one per life area, below the prices strip. Life areas and their supporting indicators (map by id from the definitions):
- Petrol and transport: oil price, Australian petrol prices, Australian dollar.
- Home loan and rent: RBA cash rate, home-loan rate people pay, rent growth, household debt.
- Savings and interest: RBA cash rate, Australian inflation.
- Shop prices and bills: Australian CPI, underlying inflation.
- Overseas money: Australian dollar vs US dollar and yen, the Currena dollar basket.
- Jobs and pay: unemployment, wage growth.
Choose the areas to show by the worst tier among their indicators (needs attention first, then unusual). Each line: icon, area name, one hedged sentence from the copy corpus keyed by area and state (needs attention, unusual, calm), and one or two supporting chips with live values that link to the cards. If no area has a signal, show a single calm line. No "buy" or "sell". Use "usually" and "tends to".
**Why:** Readers want to know what is happening to their petrol, home loan and savings, not what 40 indicators say (decision D6).
**Accept:** Never more than 4 lines. A copy test rejects "buy", "sell", "will" and imperative advice in the new strings, in both locales.

### R12. Dates and times
**Do:** Replace month/day/year everywhere in English with an unambiguous form: "3 Nov 2026" (day, abbreviated month name, year, using Intl). Keep Jalali dates in Persian. Remove seconds from "Data as of"; show the date and, optionally, the relative age ("3 hours ago"). Apply to the hero, prices, cards ("Updated"), next-up and the calendar. Keep ISO dates in CSV and .ics.
**Why:** "11/03/2026" reads as 11 March to Australians, but the RBA decision is on 3 November.
**Accept:** A test formats a set of dates in en and fa and rejects any all-numeric day/month pair in the English UI.

### R13. Units on every number
**Do:** Every displayed number gets a unit or the word "index". Known gaps: Australian home prices (verify the series unit in the source metadata, then show a clear amount such as "A$1.10 million"), terms of trade ("index"), Australian dollar vs US dollar ("US$ per A$"). Add a coverage test over all definitions.
**Why:** "1,100.4", "94.8" and "0.6951" had no unit.
**Accept:** The coverage test passes for every indicator and price.

### R14. Plain names, no codes
**Do:** Titles use plain language only. Technical tags appear only when they help a reader (for example "CPI"); never source codes or series ids (`DCOILBRENTEU`, `M13`, `CPI_Q`, `F6`, `WPI`). Rename opaque names: "The steady middle of Australian price rises" becomes "Underlying inflation" (the technical term "trimmed mean" goes to Details). Add a test that scans all names and tags in both locales with a code-pattern rule.
**Why:** The built page leaked codes and used a more obscure phrase than the term it replaced.
**Accept:** The scan test passes.

### R15. Tools menu
**Do:** Add one "Tools" button in the page header area. It opens a small menu containing: search, status filter, keyboard shortcuts help, calendar download (.ics), and CSV download. Remove the inline filter bar and the "Keyboard: / j k" hint line. Keep the shortcuts working. The menu is a proper disclosure: keyboard operable, closes on Escape and outside click, returns focus. Filter counts, when shown, describe only the current lane.
**Why:** Power-user tools crowd a page for beginners (decision D5). The old counts (41 / 10 / 20 / 11) did not match the single lane on screen.
**Accept:** No filter bar or shortcut text sits in the default page flow. Menu a11y test passes.

### R16. Calendar last
**Do:** Move the "Next up" strip to just before "About this data". Remove the duplicate "Next up" line from the hero. Keep the "full calendar" expansion. Use the new date format (R12).
**Why:** Decision D1 ranks the calendar last, and it currently appears twice near the top.
**Accept:** "Next up" appears once, below the indicators.

### R17. Rendering bug fixes
**Do:** (a) The Bitcoin tile no longer clips or overlaps (see R10). (b) Render exactly one "Sources / Attribution" block in About; find and remove the duplicate. (c) Verify no `Details ›` wraps at any width from 320px to 1920px.
**Accept:** DOM test: one Sources block. Browser check at five widths.

### R18. Consistent counts
**Do:** One source of truth for counts. "n of m need attention" in the hero equals the sum over that region's groups. Group lines and filter counts use the same function. Counts always describe the full data, not the current view (keep the existing I8 semantics).
**Accept:** A test compares the hero count with the group totals for both regions.

### R19. Sticky section pills
**Do:** Keep the pills (Status, Prices, Together, Signals when enabled, Indicators, About). Align the sticky band to the content width, keep the scrollspy, and keep targets at least 44px.
**Accept:** Pills never extend wider than the content column.

### R20. Type scale: numbers lead
**Do:** Use four type roles (verdict, number, label, caption). Make key numbers (tiles, prices, card values) clearly the largest text in their component, roughly 1.5 times the title size or more. Group titles and card titles must be visibly different sizes. Keep existing `-deep` color tokens and contrast levels; do not introduce new colors in this round.
**Accept:** A visual check on all 8 combinations and a computed-style check that value size is at least 1.4 times title size for tiles and prices.

### R21. Accessibility
**Do:** Meters and gauges have text alternatives. Each "Details" control has a unique accessible name ("Details: {indicator name}"). Tier is shown by icon and word, never by color alone. Menus and the details area manage focus. Respect reduced motion.
**Accept:** Automated checks plus a manual keyboard pass, recorded in the ledger.

### R22. Persian parity and copy rules
**Do:** Every new string goes through the i18n corpus (English is the source of truth; Persian is written natively and shape-checked at compile time). Persian digits and Jalali dates in Persian. Chart axes stay left to right. Run the full RTL check: no physical left/right in new CSS (logical properties only), no bidi scrambling of numbers with units.
**Accept:** Corpus coverage test passes; visual RTL check on every changed component.

### R23. Budgets and docs
**Do:** Keep the entry chunk and the lazy Insights chunk inside their budgets. If one must grow, bump it consciously with a CHANGELOG and PROGRESS note, as in previous waves. Update `CHANGELOG.md`, `docs/PROGRESS.md` (status row plus a decisions-log row for each decision in section 2) and `docs/insights/02-page-design-spec.md` where behaviour changed.

## 6. Copy rules (all new strings)

1. Say what the state means for daily life. Name the effect: petrol, groceries, home-loan repayments, savings interest, overseas money, jobs.
2. Use hedged words: "usually", "tends to", "can". Never "will".
3. Write from a stated position when the effect differs by person ("If you have a home loan…").
4. Never "buy", "sell" or personal advice.
5. Keep sentences short (about 15 words or fewer where possible).
6. A sentence must never contradict the tier on its card.

## 7. Data and calculation guardrails

- Do not change thresholds, scoring or the contract unless a block requires it; if the contract changes, update the zod schema in `packages/core` first.
- Never show invented data. Stale and unavailable states stay as they are.
- The snapshot stays a daily precomputed read; the page makes no external API calls.

## 8. Verification protocol

For every block, verify in a real browser. Use `agent-browser` as in `docs/DEPLOY.md`, or Playwright if it is not available. Matrix: English and Persian, light and dark, desktop 1280×800 and mobile 375×812. Also cover these states: normal, quiet week, stale item present, offline/cached banner, load error.

Measure, do not guess: no horizontal overflow (`scrollWidth == clientWidth`), no ellipsis on consequence lines, computed text and background contrast, positions of the hero elements, console errors (must be zero). Keep measurements and short notes in the ledger. Do not commit screenshots.

## 9. Acceptance list (all must pass)

1. At 1280×800, the first viewport shows both verdicts (Global first) and at least 3 needs-attention tiles with numbers per region.
2. Every needs-attention card shows its rule and live value, and no card contradicts its tier.
3. No consequence line is truncated, in any combination.
4. The default lane shows needs-attention and unusual items; the rest are collapsed behind "See all"; no needs-attention item is hidden.
5. The hero reason line never contradicts a gauge.
6. All English dates are unambiguous; no seconds in "Data as of".
7. No ticker, series id or source code appears in any name or tag, in either language.
8. Prices strip: 4 tiles with identical anatomy; Bitcoin ratio line does not overlap.
9. The "what it means for my money" panel shows at most 4 lines and no advice wording.
10. Search, shortcuts, filter, .ics and CSV all live behind Tools; no inline keyboard hint.
11. "Next up" appears once, below the indicators. One Sources block in About.
12. Persian build passes the same checks (RTL, Persian digits, Jalali dates).
13. `pnpm -r typecheck`, `pnpm -r test`, the web build and the bundle-budget script are all green; CI is green on the pushed branch.
14. Zero console errors in every matrix combination.
15. "Together" shows at most 3 cards by default and the Signals cards start compact (R7b); no lean depends on color alone.

## 10. Out of scope here

- New connection or signal content. The I17 sections stay as built; this round only applies the shared rules to them (R5 tier words and counts, R8 no truncation, R9 neutral colors, R12 dates, R13 units, R14 plain names, R21 accessibility, R22 Persian parity) and R7b.
- Share-link UI beyond what already exists.
- Any change to the signals wording itself. Never add "buy" or "sell" wording to those sections.

### R7b. Density rules for Together and Signals (added after the I17 build)
**Do:** Show "Together" with at most 3 connection cards by default, ordered by state (active first, then partly active, then signals disagree, then not active), and a "See all {n} connections" control for the rest. Keep the Signals cards and their "before you act" box exactly as built, but start each card in a compact state (lean in words, the count, the three plain checks) with the condition checklist one tap away. Do not use green or red for any lean.
**Why:** The reviewed page asked for fewer, clearer signals. These two sections add about two screens of content.
**Accept:** At 1280×800 the section above "Indicators" takes no more than about two viewport heights in its default state, and every lean is readable without color.
