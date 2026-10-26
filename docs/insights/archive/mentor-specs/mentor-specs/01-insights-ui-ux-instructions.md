> **Provenance:** delivered by the UI/UX mentor session on 2026-10-08 (round 1). Kept for reference.
> **Where it conflicts with `../06-ux-round-2-spec.md`, file 06 wins.** Round-2 changes include: Global first (not Australia first, Blocks H1 and L1); two-tier status "Needs attention" / "Unusual" (replaces "Alert"); signals-first default view with collapsed normals; hero gauges with a one-line reason; slim "what it means for my money" panel in v1; Tools menu; calendar last; unambiguous English dates. The "Together" and "What the signals say" blocks (T1, S1 to S3) stay deferred.

# Currena Insights page — UI/UX and information-hierarchy instructions

**For:** the coding agent that builds the page. **Date:** 2026-10-08.
**Format:** each change is one block: Context, Technical instruction, Why, and Note (only when needed). Written in Simplified Technical English. Size changes use words first, with a non-binding number in brackets.

## How to use this file

1. Do Block 0 first. Do not change code in Block 0.
2. Apply the blocks in order. After each block, check the page on a wide screen and on a phone, in Persian (right-to-left).
3. Blocks marked **[v1]** ship first. Blocks marked **[v2]** wait. Blocks marked **[v2-gated]** must not go live until the owner confirms the wording review is done.
4. The owner cannot read code. After each block, report what changed in plain language.

## Decisions already made (do not reopen)

- The page answers three questions, in this order: (1) what is the financial status of the world and Australia at a glance, (2) what do the key commodities cost, (3) what do the indicators mean and how do they connect.
- Readers have little finance education. Every number needs a plain-language consequence for daily life.
- Verdicts come from gauges (one plain reading per question), not from a flat count of alerts.
- The page describes conditions. It never says "buy" or "sell". Status never uses green for "buy" or red for "sell".
- Persian is the first language. English follows later. The page is right-to-left.
- The stack is unknown (the owner answered "Not sure"). Use framework-agnostic terms until Block 0 is done.
- Colors: a separate palette step is pending. Use named tokens now and keep the current colors until the palette is approved.

---

## Part 0 — Discovery

### Block 0 — Find out how the page is built
**Context:** Insights page, whole page. Preparing to apply the changes below.
**Technical instruction:** Inspect the page source. Report the framework (if any). Report the styling method (utility classes, plain CSS with variables, or a component library). List the files that render the page header, the indicator card, the card grid, and the "about this data" section. Do not change any code in this step.
**Why:** The stack is unknown, so every later block must map to real files and class names.
**Note:** After this report, translate each block below into the real selectors and components. Keep the block order.

---

## Part 1 — Global rules (apply everywhere)

### Block G1 — Use logical properties for direction **[v1]**
**Context:** All new and changed styles on the Insights page. The page is right-to-left.
**Technical instruction:** Use logical CSS properties in every new or changed rule. Use `margin-inline-start`, `margin-inline-end`, `padding-inline-start`, `padding-inline-end`, `inset-inline-start`, `inset-inline-end`, and `text-align: start`. Do not use physical `left` or `right`.
**Why:** Physical left and right break when the layout mirrors, and the English version will mirror the page.

### Block G2 — Define design tokens **[v1]**
**Context:** Page-wide styling foundation.
**Technical instruction:** Define named tokens for text, surfaces, status, spacing, radius, and type roles. Set each token to the current value. Replace hard-coded values with tokens only in the rules that you change.
**Tokens to define:** `--color-text-primary`, `--color-text-secondary`, `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-accent-brand`, `--color-status-alert`, `--color-status-normal`, `--color-status-context`, `--color-status-stale`, `--space-1` to `--space-5`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--type-verdict`, `--type-number`, `--type-label`, `--type-caption`.
**Why:** The palette step will change values later. Tokens let it change in one place.
**Note:** Do not pick new colors. Keep the current Persian font family.

### Block G3 — Set four type roles **[v1]**
**Context:** All text on the Insights page.
**Technical instruction:** Use four type roles: verdict, number, label, and caption. Make the verdict the largest. Make the number the second largest. Make the label and the caption smaller in that order. Increase the smallest text moderately so that no visible text is smaller than the caption role (suggested caption minimum: ~12–13px).
**Why:** The current page has about ten near-equal text sizes. Four roles create a clear hierarchy.
**Note:** The 7-day and 30-day labels and the percentile captions are the smallest text now. Increase them first.

### Block G4 — Raise text contrast **[v1]**
**Context:** Secondary text, captions, and status chips on every card.
**Technical instruction:** Darken the secondary text color until it reaches at least 7:1 contrast against its background. Darken the "stale" chip text until it reaches at least 4.5:1. Do not use color alone to show a range zone. Add a visible tick and a text label to every range zone.
**Why:** Pixel samples from the screenshot gave about 4.8:1 for secondary text and about 3.7:1 for the stale chip. The range zone fill is about 1.3:1 against its track.
**Note:** These values are estimates from a screenshot. Measure real values in the browser.

### Block G5 — Show status with icon, word, and position **[v1]**
**Context:** Status chips on cards, rows, and the hero.
**Technical instruction:** Show each status as a small SVG icon plus a short word. Use four states: alert, normal, context, and stale. Replace emoji-style glyphs with SVG icons. Do not use color alone. Do not use green to mean "buy" or red to mean "sell".
**Why:** Emoji glyphs look different on each operating system. Status must stay readable without color.

### Block G6 — Make controls large enough **[v1]**
**Context:** Every interactive control: expand toggle, chips, switch, links.
**Technical instruction:** Make every interactive target at least 24 by 24 CSS pixels. Make primary controls larger (suggested: ~40px tall). Add a visible focus outline to each control.
**Why:** The expand caret is about 8px now, which is too small to hit reliably.

### Block G7 — Write every unit **[v1]**
**Context:** All displayed numbers.
**Technical instruction:** Show a unit or the word "index" beside every number. Use currency names for money. Show percent for rates.
**Why:** The money supply shows "billions" with no currency. The Australian house price and the terms of trade show no unit.

### Block G8 — Isolate English codes inside Persian text **[v1]**
**Context:** Card titles that include codes such as STLFSI4 or M2.
**Technical instruction:** Wrap each English code in its own element with `dir="ltr"`. Place it after the Persian title with a small inline margin. Style it as a small muted tag.
**Why:** The code sticks to the Persian title now ("…آمریکاSTLFSI4"). A separate element stops the bidirectional text from colliding.

### Block G9 — Keep range bars and sparklines left-to-right **[v1]**
**Context:** Range bars and sparklines on cards and in the details panel.
**Technical instruction:** Set `dir="ltr"` on each range bar and sparkline container. Put low and old values on the left. Put high and new values on the right. Label both ends in Persian ("کم‌ترین در ۱۰ سال" and "بیشترین در ۱۰ سال").
**Why:** Numbers and time axes read left-to-right even in Persian interfaces. The bar currently runs left-to-right while its caption runs right-to-left.
**Note:** Owner to confirm with two or three Persian readers. If they find it confusing, mirror all bars together, never one at a time.

---

## Part 2 — Page structure, top to bottom

New order: page header → hero → "next up" strip → prices board → "together" **[v2]** → indicator lanes → about and notices.

### Block P1 — Make the section navigation sticky **[v1]**
**Context:** The row of pill buttons under the page header.
**Technical instruction:** Make the pill row sticky below the site navigation. Rename the pills to: Status, Prices, Together **[v2]**, Indicators, About. Highlight the pill of the section in view. Keep the pills inside the safe area on phones.
**Why:** The page is long. A sticky anchor row keeps the reader oriented.

### Block H1 — Replace the LED digits with a verdict meter **[v1]**
**Context:** The two verdict blocks at the top (Global and Australia).
**Technical instruction:** Remove the 7-segment LED digit boxes. For each region, show the region name, a segmented meter with four steps, a marker on the current step, and the verdict word. Use the existing four verdict labels. Add one plain sentence under the meter. Add a small "n of m indicators in alert" line. Keep the "how is this computed?" link.
**Why:** The red LED digit signals alarm while the label says "cautious". A four-step meter shows where the reading sits on a scale.
**Note:** Place the Australia block first in reading order (inline-start), then Global. This is an assumption for Australia-based readers. Provide one setting to swap them. Give the meter a text alternative, for example `role="img"` with an `aria-label` such as "Australia: cautious, step 2 of 4".

### Block H2 — Show the alerting indicators by name **[v1]**
**Context:** The area directly under each verdict meter.
**Technical instruction:** List up to three alerting indicators as chips. Sort them by how high they sit in their own 10-year range. Use the plain name. Make each chip scroll to the matching row and open its details panel. When more than three indicators alert, add a "+n more" chip.
**Why:** "3 of 11 in alert" does not say which ones. Names answer "what is wrong right now?" in one glance.

### Block H3 — Add a "big mover" callout **[v1]**
**Context:** Hero area, one callout for the whole page.
**Technical instruction:** Show one callout for the largest single move across all indicators and prices. Show the plain name, the move, and its consequence line. Show the callout only when the move score reaches the threshold in the data spec. Hide it otherwise. Exclude stale items.
**Why:** One indicator, such as oil, can change the picture. An equal-weight count cannot show that.
**Note:** Replace the old "biggest 30-day changes" list with this callout.

### Block H4 — Replace the update timestamp **[v1]**
**Context:** Page header, the "updated" line.
**Technical instruction:** Remove the seconds from the timestamp. Show "Data as of {date}". Add a tooltip: "Daily snapshot, refreshed once a day."
**Why:** The data is a daily snapshot. Seconds imply live data.

### Block H5 — Turn "what changed" into one line **[v1]**
**Context:** The block titled "What changed this week".
**Technical instruction:** Replace the block with one line under the hero. List status changes this week. When nothing changed, show a calm "quiet week" line and name the next scheduled event.
**Why:** An empty state should not take a full block. A calm line is a good ending to a quick glance.

### Block H6 — Shorten the calendar to a "next up" strip **[v1]**
**Context:** The list of 14 upcoming events.
**Technical instruction:** Show only the next three events in a strip under the hero. Show the days left in bold and the date in a smaller size. Link each event to the indicator it affects. Add a "full calendar" link. In the full list, group events by month and merge duplicate titles.
**Why:** The 14-row list pushes the first indicator about 30% down the page. Five rows repeat the same Fed title.
**Note:** Show a Gregorian date on hover or long press, because RBA and Fed news use Gregorian dates.

### Block PB1 — Build the prices board **[v1]**
**Context:** New section "Prices" below the hero strip.
**Technical instruction:** Build one compact row for each price. Show the plain name, the price with unit, the 7-day and 30-day change, a position word (low, typical, high versus the last 10 years), one consequence line, and the "as of" date. Use this order: oil (Brent), gold, silver, copper, iron ore, Bitcoin. Show gold in US dollars and Australian dollars in the same row.
**Why:** Prices answer the second objective. They are not scored indicators, so they must not look like scored cards.
**Note:** Add natural gas and a food price measure later. They are optional.

### Block PB2 — Keep the Bitcoin ratios as context **[v1]**
**Context:** Prices board, the Bitcoin row.
**Technical instruction:** Show the gold-per-Bitcoin and silver-per-Bitcoin ratios as two small lines under the Bitcoin row. Label them "context only, not used in signals". Do not feed them into any gauge or checklist.
**Why:** These ratios have no established timing logic. They stay on the page for context.

### Block PB3 — Show the data date on every price **[v1]**
**Context:** Every price row, especially oil.
**Technical instruction:** Show "as of {date}" on each row. Replace the grey "stale" chip with this date when the data is within its normal delay for that series. Show the stale state only when the data is older than its freshness limit.
**Why:** Public oil data arrives in weekly batches, so it is normally about a week old. The current stale chip is a false alarm.
**Note:** Freshness limits are in the data spec.

---

## Part 3 — Indicator lanes (scan layer)

### Block L1 — Add a Global | Australia switch **[v1]**
**Context:** The indicator section, below the prices board.
**Technical instruction:** Add a two-option segmented control: Australia and Global. Default to Australia on the first visit. Remember the last choice in local storage inside a try/catch block. Show only the chosen lane. Keep both verdicts visible in the hero at all times.
**Why:** The hero gives both answers. The lane gives the evidence for one. This halves the scroll.
**Note:** Make the control reachable with the thumb on phones.

### Block L2 — Group indicators by question **[v1]**
**Context:** Each lane.
**Technical instruction:** Replace the asset-class groups with question groups. Show each group heading as a question, then a gauge reading, then a one-line answer, then the count of alerting indicators. Use the groups in the data spec.
**Why:** Readers ask questions. They do not think in asset classes. This also fixes the "Stocks, growth and liquidity" heading that contains no stock indicator.
**Global groups:** Is borrowing getting costlier? Are prices heating up? Are markets nervous? Is the dollar strong? Is growth healthy?
**Australia groups:** Are inflation and rates a problem? Are households under pressure? How is trade and the currency?

### Block L3 — Order the items in a group **[v1]**
**Context:** Each group.
**Technical instruction:** Show alert items first, as full cards. Sort them by how high they sit in their own 10-year range. Show normal items after them, as compact rows. Show context items last, as compact rows with the "context" chip.
**Why:** Alerts must stand out. Equal-weight cards hide them.

### Block L4 — Remove grid gaps **[v1]**
**Context:** The card grid.
**Technical instruction:** Use a responsive grid with `auto-fit` columns for alert cards. Use a single-column list, or two columns on wide screens, for compact rows. Set `align-items: start` on the grid so an open item never stretches its neighbours.
**Why:** Today the grid leaves empty slots and expanded cards stretch their neighbours into empty white columns.

---

## Part 4 — Card, row, and details panel

### Block F1 — Alert card anatomy **[v1]**
**Context:** Indicator cards in the "alert" state.
**Technical instruction:** Show these parts, in this order: status chip, plain name, small technical tag, value with unit, 7-day and 30-day change, position word with a labeled range bar, consequence line, small sparkline, source and date. Add an accent border on the inline-start edge. Add a light tint to the surface.
**Why:** Alerts are the news on this page. Border and tint set them apart without color-only signals.
**Note:** Remove the long technical description from the card face. It moves to the details panel (Block F5).

### Block F2 — Compact row anatomy **[v1]**
**Context:** Indicator rows in the "normal" and "context" states.
**Technical instruction:** Show one row with: status icon, plain name, value with unit, 30-day change, tiny sparkline, position word, and a "details" button. Show the consequence line in one line under the name. Hide the source and the date until the details panel opens.
**Why:** A reader can scan 10 rows in the time it takes to read 3 cards.

### Block F3 — Replace the percentile caption **[v1]**
**Context:** The text "position in the last 10 years" and its percent value.
**Technical instruction:** Replace the caption with a position word and a range bar. Put the word beside the bar, not at the opposite end of the card. Mark the alert threshold on the bar with a tick and a short label, for example "alert above 3%".
**Why:** "Percentile" is jargon. The value now sits far from its label.

### Block F4 — Write the consequence line **[v1]**
**Context:** Every indicator and price, card face and row.
**Technical instruction:** Show one short line that says what the current state means for daily life. Choose the line from the state of the indicator (level and direction). Use hedged words such as "usually" and "tends to". Write from a stated position, for example "If you have a home loan…". Do not use "buy" or "sell". Keep each line short (suggested: ~15 words or fewer).
**Why:** A bare number means nothing to the reader. The line gives the practical effect.
**Note:** The line table and rules are in the data spec, section 6.

### Block F5 — Open details in a side panel **[v1]**
**Context:** The expand control on each card and row.
**Technical instruction:** Replace the in-grid accordion with a side panel on wide screens and a bottom sheet on phones. Show these sections, in this order: what it means for you, why it matters, what usually follows, what it cannot tell you, then the technical definition. Show a large sparkline with readable axis labels (at least the caption size). Keep the "chart data" table toggle. Show the source link and the "as of" date at the bottom.
**Why:** Life effects come first because they answer the reader's real question. The panel avoids stretching the grid.
**Note:** Trap focus inside the panel. Close it with the Escape key. Return focus to the control that opened it. Give each indicator its own address (URL hash) so a link opens its panel.

### Block F6 — Name indicators in plain words first **[v1]**
**Context:** All indicator titles.
**Technical instruction:** Use the plain name as the title. Example: "What the US government pays to borrow for 10 years". Show the technical name as the small tag. Use the same naming pattern for all indicators.
**Why:** "US 10-year real yield" is jargon for this audience.

---

## Part 5 — States

### Block ST1 — Apply per-source freshness limits **[v1]**
**Context:** All indicators and prices.
**Technical instruction:** Read the freshness limit from the data file for each series. Mark an item "stale" only when its latest date is older than that limit. Exclude stale items from the verdict, the gauges, and the big-mover callout. Show "last value on {date}" on a stale item.
**Why:** A weekly or monthly series is not stale just because it is a week old.

### Block ST2 — Show missing data honestly **[v1]**
**Context:** Any item with no value.
**Technical instruction:** Show "No data right now" and the last known value with its date, when one exists. Exclude the item from all calculations. Add the count of excluded items to the "how is this computed?" panel.
**Why:** The current page shows "2 items set aside" in tiny gray text. This puts the information where readers can find it.

---

## Part 6 — Together and signals **[v2]**

### Block T1 — Connection card anatomy **[v2]**
**Context:** New section "Together", below the prices board.
**Technical instruction:** Build one card for each connection. Show two or three indicators with live values, a short arrow between them, one plain sentence of how they usually relate, and a computed "right now" line. Show one state: active, partly active, not active, or signals disagree. Show an evidence tag: reliable, mixed, or weak.
**Why:** The page has no module for relationships. Every card is an island today.
**Note:** Start with up to six connections: (1) real yields and gold, (2) the dollar and gold and oil, (3) oil and inflation expectations and borrowing costs, (4) copper-to-gold and China PMI and growth, (5) iron ore and terms of trade and the Australian dollar, (6) the RBA cash rate and the home-loan rate and household debt. Use "tends to" language. Leave every evidence tag as "to verify" until the owner confirms the evidence.

### Block S1 — "What the signals say" card for gold **[v2-gated]**
**Context:** New section below "Together". Not live until the wording review is done.
**Technical instruction:** Build one card for gold. Show a lean in words: mostly supportive, mixed, or mostly unsupportive. Show a count such as "3 of 5 conditions met". Show a checklist of the five conditions with live values. Show the two sides: conditions that usually support gold and conditions that usually work against it. Show the three plain checks: where the price sits in its 10-year range, whether the usual drivers support it, and how fast it moved lately. Show a fixed "before you act" box.
**Why:** The card describes conditions and leaves the decision to the reader.
**Five conditions:** (1) real yield level and direction, (2) inflation expectations (5-year, 5-year forward), (3) market stress (financial stress index plus the national financial conditions index), (4) the Currena dollar basket, (5) gold's position in its 10-year range and its 30-day speed.
**Note:** Do not use green for "supportive" or red for "unsupportive". Use icons and words. Name the section "What the signals say". Do not name it "Investment opportunities". Add a feature flag `SIGNALS_ENABLED` and set it to false.

### Block S2 — "What the signals say" card for silver **[v2-gated]**
**Context:** Same section as Block S1.
**Technical instruction:** Reuse the five gold conditions. Add one condition for industrial demand (China PMI and the copper-to-gold ratio). Tag that condition "mixed".
**Why:** Silver is partly an industrial metal.

### Block S3 — The fixed "before you act" box **[v2-gated]**
**Context:** Inside every signals card.
**Technical instruction:** Show these four points in plain language: signals cannot predict prices, prices can fall even when conditions look supportive, these logics play out over months and years and not days, and buying and selling costs (the gap between the buy and sell price at dealers) can matter more to small buyers than timing. Do not hide this box behind a click.
**Why:** The costliest reader error is acting with more confidence than the evidence supports.
**Note:** Have the final wording reviewed by someone qualified in Australian financial-services rules before launch.

---

## Part 7 — Footer, notices, and phone

### Block N1 — Add the required source notices **[v1]**
**Context:** The "about this data" section and the page footer.
**Technical instruction:** Add this exact notice prominently: "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis." Link to the FRED API terms. Add the attribution lines from the data spec, section 9. Do not use "FRED" in any host name.
**Why:** FRED requires the notice when an application uses its API. RBA and ABS require attribution.
**Note:** Check that the notice is present today. The screenshot shows no such notice.

### Block N2 — Cut the disclaimers to one **[v1]**
**Context:** The top disclaimer bar, the "about" section, and the full disclaimer box.
**Technical instruction:** Keep one short disclaimer line under the hero. Link it to one full disclaimer in the footer. Remove the other copies.
**Why:** Three copies at the same weight make readers ignore all of them.

### Block M1 — Phone layout **[v1]**
**Context:** Screens narrower than about 600px.
**Technical instruction:** Fit the hero (both verdicts and the big-mover callout) on one phone screen. Stack the two verdict blocks. Keep compact rows as rows. Show the details panel as a bottom sheet. Make the lane switch sticky near the thumb.
**Why:** Most readers will see this page on a phone first.
**Note:** The owner has not shared a phone screenshot yet. Test on a real phone.

### Block A1 — Accessibility checks **[v1]**
**Context:** The whole page.
**Technical instruction:** Give the verdict meters and gauge readings a text alternative. Make every control reachable with the keyboard. Respect the "reduce motion" setting. Test with a screen reader in Persian.
**Why:** The page conveys status. Status must reach every reader.

---

## Acceptance tests

1. A new reader can say both verdicts and name one alerting indicator within 5 seconds.
2. The first indicator row appears within the first two screens on a wide display.
3. No visible text is smaller than the caption role. Secondary text reaches 7:1.
4. Opening a details panel never changes the layout of neighbouring items.
5. Switching to the English version mirrors the layout with no physical left or right in the new rules.
6. The page shows no "buy" or "sell" word anywhere.

## Open items for the owner

- Confirm left-to-right range bars with Persian readers (Block G9).
- Confirm that Australia comes first in the hero (Block H1).
- Approve the alert thresholds for new indicators (data spec, section 4).
- Approve the Persian wording of consequence lines before launch.
- Share a phone screenshot and an English-version screenshot for a second review.
