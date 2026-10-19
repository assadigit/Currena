# Currena Insights: UI Spec

Scope: the Insights page (`#/insights`) only. Currena's other pages, brand colours, fonts and logo do not change.
This file is the only authority for visual changes. Other spec files that say "do not change the visual design" mean: do not change it except as this file says.
Wording rules are in `RULES.md` section 5. Vocabulary is in `GLOSSARY.md`.

Owner's diagnosis of the current hero (his words, 2026-10-17): it says many things but delivers almost nothing, it is not as good-looking as it should be, and it has spacing, alignment and colour mistakes. Fix those first.

---

## 1. Principles

1. **Answer first.** In 5 seconds a visitor can say: how are things, why, and what is next.
2. **Every element earns its place.** If it does not answer "how", "why", "what next" or "can I trust this", move it behind a details control or remove it.
3. **One card anatomy, one state language** across the whole page.
4. **Never rely on colour alone.** Every state has a word and an icon as well as a colour.
5. **Mobile first.** Design for 360 px wide, then widen.
6. **Reuse, do not invent.** Reuse Currena's existing tokens (colours, radius, font, spacing). Add new tokens only for the state colours in section 4, named semantically, and only if equivalents do not exist.
7. **Strings are data, and the layout works left-to-right and right-to-left.** All user-visible text comes from a string table so wording can change without touching layout. If the page already shows any Farsi text, keep it working: the table holds English and Farsi, nothing existing is deleted, and the layout mirrors correctly in right-to-left. If Insights is English-only today, build English and keep the CSS direction-neutral (logical properties) so Farsi can be added without rework. Numbers and units stay left-to-right inside right-to-left text.

---

## 2. Page order

Keep the current sections and order, except:

1. Header (title, one-line purpose, snapshot time with time zone, data-health chip)
2. **Hero** (Global and Australia) (section 3)
3. **Moves and what is next** strip (section 5)
4. Existing sections in their current order (Prices, World stock markets, World currencies, What it means for my money, How things connect, Conditions for gold and silver, area sections for Global and Australia)
5. Calendar ("Next up")
6. "Know before you buy US shares" (collapsed)
7. About this data (sources, status, rule version, disclaimer, contact)

---

## 3. Hero

### 3.1 Content of each hero card (Global, Australia)

- [ ] **UI-01 Verdict line:** verdict word (Stable, Cautious, Stressed, Critical) with its state icon and colour, then one plain sentence of at most 90 characters generated from the rule result (for example "Most gauges are calm; prices and borrowing costs need attention").
- [ ] **UI-02 Reading bar:** one segmented bar showing counts of Needs attention, Normal and Can't tell right now, with the numbers ("6 need attention, 17 normal"). No separate paragraph repeating the same counts.
- [ ] **UI-03 Why (top three):** the three indicators with the largest weight in the rule result, each as a row: name, current value with unit, change with direction and period, status chip. Tapping a row opens that card.
- [ ] **UI-04 Calm line:** one line naming up to three calm areas ("Calm: market stress, growth").
- [ ] **UI-05 What is next:** the next relevant calendar event with days away ("Fed decision, 28 Oct, 11 days").
- [ ] **UI-06 Freshness chip:** "Updated 22:13 UTC" and, if any input is stale, "2 stale" (linking to the status panel).
- [ ] **UI-07 How the verdict word is chosen:** moved into a "How is this calculated?" control (accordion or popover) showing the rule and its version. Not visible by default.
- [ ] **UI-08 Alert box:** shown only when needed (a failed or stale source affects the verdict, or a verdict changed since the last snapshot). One line plus a link.
- [ ] **UI-09 Disclaimer:** "General information only. Not financial advice." under the hero, small but legible.

Remove from the hero: repeated explanatory paragraphs, the long rule text, duplicated counts, decorative elements that carry no information.

### 3.2 Layout

- [ ] **UI-10** Desktop (1200 px and up): the two hero cards sit side by side, equal width and height, 24 px gap. Tablet (768 px): side by side if each card is at least 340 px wide, otherwise stacked. Mobile (360 px): stacked, 16 px gap.
- [ ] **UI-11 Spacing scale:** 4, 8, 12, 16, 24, 32 px only. Card padding 20 px (desktop) and 16 px (mobile). One consistent gap between rows inside a card (12 px).
- [ ] **UI-12 Alignment:** all text aligned to the start edge. Numbers use tabular figures and align on a shared baseline with their labels. Status chips align to the end edge of their row. No mixed alignment inside one card.
- [ ] **UI-13 Hierarchy:** the verdict word is the largest element in the card. Values are second. Labels and metadata are smallest. Use at most three type sizes inside a card.
- [ ] **UI-14 Colour use:** the state colour appears only on the status dot or icon, the chip, and the thin top border of the card. Backgrounds stay neutral. No gradients that reduce contrast.

---

## 4. States and tokens

Semantic state tokens (define once, use everywhere; map to Currena's palette where equivalents exist):

| State | Word | Icon | Used for |
|---|---|---|---|
| normal | Normal | check circle | indicator within its usual range |
| attention | Needs attention | triangle | a published rule fired |
| context | Context | info circle | shown for information, not scored |
| stale | Stale | clock | data older than its allowed age (shows the age) |
| delayed | Delayed | clock | one trading day or release behind its peers |
| unavailable | Can't tell right now | dashed circle | failed, blocked, duplicate, unverified, or fails a test; the value is hidden |
| hero levels | Stable, Cautious, Stressed, Critical | dot sized by level | hero verdict words |

- [ ] **UI-15 Contrast:** text at least 4.5:1 and non-text elements (icons, borders, chart lines) at least 3:1 against their background, in both light and dark themes if Currena has both.
- [ ] **UI-16 Hero level colours** are four steps on one ramp from calm to severe. Cautious must be clearly different from Stressed in hue or lightness, not only by a small shift.
- [ ] **UI-17 Unavailable** cards show the reason in one line ("Source did not update since 7 Oct") and the last good value inside the details only.

---

## 5. Moves and what is next strip

- [ ] **UI-18** One horizontal strip (wraps to rows on mobile) with up to five items: the biggest moves since the last snapshot (indicator, value, change) and the next three calendar events. Items are tappable and open the card.
- [ ] **UI-19** The "biggest move" ranking uses the existing rule (size of change relative to the indicator's own history). It states the period.

---

## 6. Card anatomy (all indicator cards)

- [ ] **UI-20** Every card has, in this order:
  1. Title (plain language)
  2. Value (large, tabular figures) and unit
  3. Change line: period label, direction arrow, size (percentage points for rates, % for prices)
  4. Status chip (state word and icon)
  5. One-line meaning (generated)
  6. Meta row: "Data for [period] · Published [date, if relevant] · Updated [UTC time] · Source (link)"
  7. Details control (expands): What it is, What it isn't, How is this calculated (rule, thresholds, version), history chart with period toggle, attribution, licence note if required
- [ ] **UI-21 Quarterly series** show the quarter name ("June quarter 2026"), never a month or a raw date.
- [ ] **UI-22 Cards from fetched sources** also show "fetched [UTC time]" and the publisher's label in the publisher's words, with the text pattern in `SCRAPING_SPEC.md` F-19 to F-22.
- [ ] **UI-23 Loading and error:** skeletons the size of the card while loading. No layout shift when data arrives.

---

## 7. Charts

- [ ] **UI-24** Small line charts with a period toggle (existing: quarter, 1 year, 5 years). Axis labels with units. A dot on the last point. No gridline clutter. Text summary for screen readers ("Down 0.4 points over 3 months").
- [ ] **UI-25** Optionally a light band marking the usual range (10-year 10th to 90th percentile) when the card's rule uses it.
- [ ] **UI-26 Data minimisation:** the chart gets only the points it draws (RULES M-2).

---

## 7a. World stock markets table

- [ ] **UI-27 Columns:** Market, Today, 3 months, From 52-week high, State, Last close with date. One header note: "Returns in each market's local currency".
- [ ] **UI-28 State labels** follow `INSIGHTS_STEP3_SPEC.md` L2-01 (Near its high, Pullback, Correction, Bear market). Remove "Normal" as a stock state.
- [ ] **UI-29 Trend:** show it only if its basis and thresholds are stated in the details (defect E-18) and it matches the figures beside it.
- [ ] **UI-30 AUD view:** a compact panel for S&P 500 and Nasdaq 100: level in USD, level in AUD, 1-month change in USD, in AUD, and the currency effect (L2-03).
- [ ] **UI-31 Mobile:** the table becomes a list of cards with the same fields. No horizontal scrolling.
- [ ] **UI-32 Delayed and stale tags** appear on any row whose last close is older than its peers.

---

## 8. Relationship cards ("How things connect")

Replace the Active, Partly active and Signals disagree verdict badges (Step 3 spec L3-02).

- [ ] **UI-33 Layout:** title; two or three legs in a row (name, value, direction arrow, window label such as "30 days"); one line "Usual tendency: ..." written as a tendency; a neutral summary line "2 of 3 readings match the usual pattern".
- [ ] **UI-34 Leg markers:** each leg shows a marker for matches the tendency, does not match, or can't tell (icon and word, not colour alone).
- [ ] **UI-35 Trigger leg:** if the trigger leg is not present, the summary line reads "Trigger not present", never a match count.
- [ ] **UI-36 Windows** used for each leg are shown in the details.
- [ ] **UI-37 Pass-through pending** (for example RBA cash rate to home-loan rate) shows "Pass-through pending" with the lag period.
- [ ] **UI-38 Weak links** carry a "weaker link" tag with one line of why.

---

## 9. Conditions for gold and silver: balance visual

Owner decisions: replace the grouped list (Works against / Sitting neutral / Price footing) with a dynamic balance. Keep the balance-beam metaphor, but make it **honest about missing data** and give it a more **editorial, financial look**. All conditions weigh equally (each supporting condition against each pressuring one). Neutral conditions are shown aside. It must be clearly visible on mobile and desktop. If the balance does not work, fall back to a gauge in the style of a fear-and-greed gauge.

The owner's reference is a dark, right-to-left, Farsi schematic with: two factor columns, a beam whose red end means "pressuring" and whose green end means "supporting", a fulcrum, and a short explanatory footnote. If a reference image or file is placed in `docs/insights/reference/`, match its structure and mood. Otherwise follow the structure below. The component must work in both left-to-right (English) and right-to-left (Farsi), light and dark.

- [ ] **UI-39 Structure (top to bottom):**
  1. Heading with the asset name and one plain line ("1 of 5 conditions support gold").
  2. Two factor columns. One lists the conditions that **support** (green marker), the other those that **pressure** (red marker). Each item is a row: short name, current value with unit, one-line meaning. In right-to-left the columns mirror.
  3. The beam: red end on the pressuring side, green end on the supporting side, a fulcrum in the middle, and one equal-sized token per condition resting on its end of the beam. Beam tilt = (supporting minus pressuring) divided by the number of **readable** scored conditions, scaled to a maximum of 12 degrees.
  4. A neutral group aside (grey tokens, listed beside or below the beam, never on the beam).
  5. A **missing data line**: "4 of 5 conditions readable. Real yields: can't tell right now." Unreadable conditions appear as dashed tokens next to the neutral group and do not count toward the tilt.
  6. A short explanatory footnote: what the beam shows and what it does not ("Each condition counts the same. This is a snapshot of conditions, not a forecast or advice.").
- [ ] **UI-40 Honesty rules:**
  - If fewer than 3 conditions are readable, the beam stays level and shows "Not enough readable conditions to weigh". No tilt.
  - A condition that is stale or failed a test is unreadable, never silently counted.
  - The text summary always states how many conditions were readable.
- [ ] **UI-41 Editorial and financial look:** restrained palette (neutral surface, state colours only on markers and the beam ends), hairline rules between rows, generous spacing from the spacing scale, tabular figures for values, small caps or small uppercase labels for column headings, no gradients or shadows that reduce contrast, no decorative icons. The footnote is small but at least 12 px and passes contrast.
- [ ] **UI-42 Motion:** a short ease on load and on change only. Respect `prefers-reduced-motion` (no animation).
- [ ] **UI-43 Legibility criteria** (check with screenshots at 360, 768 and 1200 px, in left-to-right and right-to-left): tokens not truncated or overlapping, labels at least 12 px, beam, fulcrum and column markers clearly visible, contrast per UI-15, tilt direction clear at a glance, nothing clipped, columns stack vertically on mobile with the beam above them.
- [ ] **UI-44 Fallback:** if any criterion in UI-43 cannot be met at 360 px, implement the semicircular gauge instead (needle from pressuring to supporting, equal weights, neutral and unreadable counts shown beside it), keep the same missing-data line and footnote, and record why in `UI_REPORT.md`.
- [ ] **UI-45** Gold and silver each have their own balance. The silver-only condition is included only in silver's.
- [ ] **UI-45a Accessible equivalent:** the summary line and the condition list carry the full information without the graphic. The graphic has a text alternative.

---

## 10. Other sections

- [ ] **UI-46 What it means for my money:** each row shows the rate or price, its change in percentage points or %, and a one-line meaning. The savings row adds "Real return before tax: deposit rate minus inflation" (L2-06).
- [ ] **UI-47 Calendar:** the next five events, relative days, time zone label. Past events are hidden. Keep "Download calendar (.ics)".
- [ ] **UI-48 Know before you buy US shares:** collapsed box. Only approved text (RULES section 7).
- [ ] **UI-49 About this data:** table of sources with attribution and link, snapshot time with time zone, a list of stale or unavailable cards, rule version with a link to the change log, the disclaimer, and the contact line for data owners (RULES M-7).
- [ ] **UI-50 Data-health chip** in the header: "All data current" or "N stale" or "N unavailable", linking to the About section.
- [ ] **UI-51 Export tool** is shown only to the owner (RULES M-3).

---

## 11. Responsive and accessibility

- [ ] **UI-52 Breakpoints tested:** 360, 768, 1200 px. No horizontal page scroll at any of them. No text overflow or truncation of values.
- [ ] **UI-53 Touch targets** at least 44 x 44 px.
- [ ] **UI-54 Keyboard:** every interactive element is reachable and has a visible focus ring. Accordions and popovers work with the keyboard and announce their state.
- [ ] **UI-55 Semantics:** one H1, logical headings, tables with header cells, status chips with accessible names ("Needs attention"), charts with text alternatives.
- [ ] **UI-56 Text size:** the page stays usable at 200% browser zoom.
- [ ] **UI-57 Performance:** no new heavy library. Charts and the balance are drawn with the existing approach or plain SVG. Initial load and layout shift must not get worse than the baseline.

---

## 12. Acceptance tests (automated where possible)

Use Playwright (or the repo's existing browser test tool) to render the page from a fixture snapshot at 360, 768 and 1200 px. Save screenshots to `docs/insights/screenshots/`.

- [ ] **U-01 Hero answers three questions:** each hero card contains a verdict word, a "why" list of three rows, and a "what is next" line.
- [ ] **U-02 No overflow:** no horizontal scroll and no clipped value at the three widths.
- [ ] **U-03 Contrast:** automated contrast check passes (axe or equivalent) for text and components in all states.
- [ ] **U-04 State language:** every card shows exactly one of the states in section 4, with word and icon.
- [ ] **U-05 Source and date:** every card shows source, data date, and update time.
- [ ] **U-06 Quarterly labels:** no quarterly card shows a month name or raw date.
- [ ] **U-07 Unavailable cards hide their value.**
- [ ] **U-08 Relationship cards** contain no "Active", "Partly active" or "Signals disagree".
- [ ] **U-09 Balance legibility** criteria UI-43 pass at 360 px in left-to-right and right-to-left, or the gauge fallback is in place. **U-09a:** with fewer than 3 readable conditions the beam is level and shows the "not enough readable conditions" line; unreadable conditions never affect the tilt.
- [ ] **U-10 Reduced motion:** with `prefers-reduced-motion`, no animation runs.
- [ ] **U-11 Stock table** has no "Normal" state and shows the local-currency note.
- [ ] **U-12 Calendar** shows no past events.
- [ ] **U-13 Strings:** no hard-coded user-visible text outside the string table.
- [ ] **U-14 Owner-only export** returns 401 or 403 without the owner's token.

---

## 13. Do not

- Do not change Currena's brand, logo, fonts, or pages other than Insights.
- Do not add decorative elements, new fonts, or new colour families beyond the state tokens.
- Do not hide stale or unavailable states to make the page look cleaner.
- Do not add text that explains the same thing twice.
