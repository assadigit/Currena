# World Markets Map — Agent Spec (Currena › Insights)

Written in Simplified Technical English. Each UI instruction has Context, Technical instruction, Why, and Note (only when needed).
Reference image: `reference-global-markets.png` (light panel and dark panel). Use it for layout and mood only.

---

## 0. Run rules (read first)

1. Work from start to finish without asking questions. When a detail is missing, use the default in this file. List each default you used in the final report.
2. Create the branch `feature/insights-world-map`. Do not push to `main`. Do not deploy to production.
3. Inspect the repo before you write code. The stack is not confirmed (earlier work suggests Cloudflare Workers with KV; the front-end framework is unknown). Follow the conventions you find: file layout, styling method, i18n, number formatting, theme tokens.
4. Loop: build, run the checks in Section 9, look at the screenshots, fix, repeat. Stop when Section 9 passes. Stop after 8 loops and report what still fails.
5. Do not copy from the reference image: its numbers, its curved arcs, its glow, its title block, its tagline, its footer logo.

## 1. Context

- Product: currena.ir, page "Insights". Audience: people with little finance education. Languages: Farsi (RTL) and English. Lens: product/experience, not commercial.
- The section "World stock markets" already exists (verdict, hero signal count, table or list, index detail view). This task adds a map view of the same data.
- The map is a new presentation layer. It is not a new data feature.
- Goal: a visitor sees in about five seconds which big markets are up or down, and whether each market is open.

## 2. Hard rules

1. Add no new external API. Use the existing index registry and refresh job. If an index in Section 4 is missing from the registry, add it through the same provider. If that provider cannot supply it, remove its callout and report it.
2. Add zero KV reads and zero KV writes per page view and per refresh cycle. Add new fields to the existing stored payload only. The Workers free plan allows 100,000 reads and 1,000 writes per day for the whole account, and the page already uses about a dozen APIs.
3. Make no runtime request to a third-party CDN, font host, or map host. Bundle all assets.
4. Do not use emoji flags. Windows does not draw them. Use SVG flags.
5. Put no text labels on the map (no country names, no sea names).
6. Draw nothing decorative that looks like data. Every visible mark comes from a number. Remove the curved arcs of the reference.
7. Map colours describe the selected period only. They do not change the hero signal count or the section verdict.
8. Add no new disclaimer. Remove the reference tagline ("One World. Many Opportunities."). The page footer disclaimer already exists.
9. Use the site's existing up, down, and neutral colour tokens. Do not invent new hex values.
10. Never show `0.00%` or a placeholder number for missing data.

## 3. Audit decisions (reference → build)

| Reference element | Decision | Reason |
|---|---|---|
| Light + dark panels | Keep both, via the site's theme | Site already has a theme mechanism |
| Dimmed world map, tinted countries | Keep, simplified | Figure–ground: data layer reads first |
| Flag + name + value + % cards with leader lines | Keep, restyled | Recognition over recall |
| % smaller than the value inside cards | Change: % largest | The % change is the signal |
| Curved arcs between dots | Cut | They imply relationships no number supports |
| Blurred glow and neon dark theme | Cut | Dates fast; the page must stay calm and analytical |
| "Live" + pulsing dot | Change to "Updated {time}" | Data is delayed; many markets are closed |
| China tinted, no card | Fix: tint only countries that have a card | Tint without a number misleads |
| Whole of Europe tinted for FTSE 100 | Fix: tint the UK only | Tint must match the index |
| Dot colour conflicts with tint (China, dark) | Fix: dot uses its own step colour | One signal, one colour |
| 5-row legend, faint grey thresholds | Change to one inline row | Saves height; readable |
| "Flat" = exactly ±0.00% | Change to a flat band | A move of exactly 0.00% almost never occurs |
| Poster title, subtitle, footer brand | Cut | The section header already exists |
| Tagline "Many Opportunities" | Cut | Sounds like advice |
| Emoji-style flags | Change to SVG circle flags | Windows support |
| Callouts only | Add list layout below 960px | Ten cards do not fit on a phone |

## 4. CONFIG (put these values in one config file; the code reads only from it)

### 4.1 Map indices (order = west to east = DOM order = tab order)

| # | Index | Country (ISO2 / ISO numeric) | Dot city (lat, lon) | Card band |
|---|---|---|---|---|
| 1 | S&P 500 | US / 840 | New York (40.71, −74.01) | top |
| 2 | Bovespa | BR / 076 | São Paulo (−23.55, −46.63) | left |
| 3 | FTSE 100 | GB / 826 | London (51.51, −0.13) | top |
| 4 | DAX | DE / 276 | Frankfurt (50.11, 8.68) | top |
| 5 | JSE All Share | ZA / 710 | Johannesburg (−26.20, 28.05) | bottom |
| 6 | Nifty 50 | IN / 356 | Mumbai (19.08, 72.88) | bottom |
| 7 | China index already in the registry (default: Shanghai Composite) | CN / 156 | Shanghai (31.23, 121.47) | top |
| 8 | KOSPI | KR / 410 | Seoul (37.57, 126.98) | right |
| 9 | Nikkei 225 | JP / 392 | Tokyo (35.68, 139.69) | top |
| 10 | ASX 200 | AU / 036 | Sydney (−33.87, 151.21) | bottom |

- Use the Persian name that the existing section already uses for each index. If none exists, use the name that Iranian stock sites show. Do not guess a transliteration.
- Use the same index definitions, tickers, and descriptions as the existing registry. Do not create a second list.
- Removal order if the layout test fails at 960px: JSE All Share, then Bovespa. Report any removal.

### 4.2 Colour steps and thresholds (percent change; display only)

| Period | Flat band | Strong from |
|---|---|---|
| Today (1D) | within ±0.10% | ±1.00% |
| 1 month (1M) | within ±1.00% | ±5.00% |
| 1 year (1Y) | within ±3.00% | ±15.00% |

Steps: strong fall, fall, flat, rise, strong rise.

### 4.3 Other constants

- `OPEN_MAX_AGE_MIN = 30` (used only when the provider gives no market state)
- `STALE_AFTER_DAYS = 5` (calendar days since the last price)
- `LAYOUT_SWITCH_PX = 960` (container width)
- `DEFAULT_PERIOD = "1D"`

### 4.4 Strings

| Key | English | Farsi (use the existing wording if the page already has it) |
|---|---|---|
| open | Open | باز |
| closed | Closed | بسته |
| today | Today | امروز |
| month | 1 month | ۱ ماه |
| year | 1 year | ۱ سال |
| updated | Updated | به‌روزرسانی |
| strongFall / fall / flat / rise / strongRise | Strong fall / Fall / Flat / Rise / Strong rise | افت شدید / افت / ثابت / رشد / رشد قوی |
| noData | No data | بدون داده |
| oldData | Old data | داده قدیمی |
| summary | {up} of {n} markets up {period} · {down} down · {flat} flat | {up} از {n} بازار {period} مثبت · {down} منفی · {flat} ثابت |

## 5. UI instructions

### M1 — Module container
**Context:** Insights › World stock markets section. Where the map sits.
**Technical instruction:** Add the map module at the top of the existing section, below the section verdict and above the existing table or list. Place it inside the section's existing card. Do not add an outer frame, a poster title, a second header, or a brand footer. Use the section's existing header component for the title.
**Why:** The reference is a standalone poster. Inside a page, a second frame and title duplicate the section header.

### M2 — Layout switch
**Context:** Responsive behaviour of the map module.
**Technical instruction:** Use a container query on the module's own width, not the viewport width. At 960px container width or more, show the map layout (map with callout cards). Below 960px, show the list layout: a smaller map without cards, above the existing list. Keep the map aspect ratio fixed in both layouts. Keep the existing table available behind the existing "show table" control in the map layout.
**Why:** The page has side padding, so the viewport width gives the wrong answer. Ten cards do not fit on a phone.

### M3 — Base map
**Context:** Land drawing inside the map module.
**Technical instruction:** Draw the land as one inline SVG with one path per country. Give each path a `data-iso` attribute (ISO numeric). Fill all land with the neutral map colour at low contrast. Draw country borders with a thin line (suggested: ~0.5px) at lower contrast than the fill. Leave the ocean transparent. Remove Antarctica. Draw no graticule lines. Draw no text.
**Why:** Figure–ground. A quiet map lets the data layer read first. No text avoids border and name disputes.

### M4 — Country tint
**Context:** Colour of countries that have an index.
**Technical instruction:** Tint only the ten countries in Section 4.1. Keep all other land neutral. Set each tint from the five-step scale for the selected period. Make the strong steps clearly stronger than the mild steps in lightness, not only in hue. Use a flat fill. Use no blurred gradient and no glow.
**Why:** A step difference in lightness stays visible for people with colour-vision deficiency, and it fixes the dark-theme problem where "Up" and "Slightly up" looked the same.
**Note:** Tint the UK only for the FTSE 100. Do not tint all of Europe.

### M5 — Dots
**Context:** One marker per index on the map.
**Technical instruction:** Place one dot at each dot city in Section 4.1. When the market is open, fill the dot with its step colour. When the market is closed, draw a hollow ring in its step colour. Increase the dot size slightly on hover and focus (suggested: ~1.4×).
**Why:** Open or closed needs a shape signal, not only colour.

### M6 — Callout cards
**Context:** The card for each index in the map layout.
**Technical instruction:** Render each card as a real interactive element (link or button). Order the cards west to east as in Section 4.1. On line one, show the circle flag, the short index name, and the status tag (Open or Closed) at the end. On line two, show the % change: largest size, bold, in its step colour, with an arrow icon and an explicit sign. On line three, show the index value in muted text, one size smaller. Use tabular figures. Give all ten cards the same width. Draw arrow icons as inline SVG (up triangle, down triangle, flat bar). Do not use text glyphs.
**Why:** The % change is the signal. The value is context. The reference showed the value larger than the change.
**Note:** Suggested sizes: change 16–18px, name 13px, value 12–13px. Use no text below 12px.

### M7 — Leader lines
**Context:** Lines that join each card to its dot.
**Technical instruction:** Draw one straight line from the nearest edge of each card to its dot. Draw the lines in an SVG layer that uses the same coordinate system as the map. Keep each line thin and low contrast until hover or focus. Keep each line shorter than about one quarter of the map width. Do not let any line cross another card or another line. When a conflict occurs, move the card. Do not move the dot.
**Why:** Proximity. Long crossing lines in the reference break the link between card and dot.

### M8 — Card placement
**Context:** Position of the cards around the map in the map layout.
**Technical instruction:** Place the cards in bands around the map as in Section 4.1: top band (S&P 500, FTSE 100, DAX, China, Nikkei 225), left band (Bovespa), right band (KOSPI), bottom band (JSE, Nifty 50, ASX 200). Start with even spacing inside each band. Adjust positions after rendering until the layout test in Section 9 passes. Express positions as percentages of the map box.
**Why:** A fixed rule keeps the layout stable when data changes.

### M9 — Header status
**Context:** Right side (inline-end) of the section header.
**Technical instruction:** Remove "Live" and the pulsing dot. Show "Updated {time}" and the age in minutes (for example "3 min ago"). Show the time in the viewer's time zone with the zone name. In Farsi, show the Jalali date wherever a date appears.
**Why:** The data is delayed, and many markets are closed. For example, Tokyo and Sydney have already closed at 12:42 UTC. "Live" would be false (Nielsen: visibility of system status).

### M10 — Summary line
**Context:** One line under the section header, above the map.
**Technical instruction:** Add one summary line with the count of indices up, down, and flat for the selected period (see the `summary` string). Compute it from the same data with plain code. Do not use a language model.
**Why:** It gives the answer in one glance.
**Note:** This line is not the section verdict. Keep the existing verdict unchanged.

### M11 — Period switch
**Context:** Control above the map.
**Technical instruction:** Add a segmented control with FOUR options: Today, 1 week, 1 month, 1 year (yearly returned by the 2026-10-20h owner round; the original trio was Today | 1 month | 1 year). Select Today by default. Centre the control under the summary line and draw it ~50% larger than a default control (48px pills, ~18.7px words) so it is easy to see. Make the map, the cards, the summary line, and the legend follow the selected period. Do not send a network request when the period changes. Keep the choice in memory for the session only.
**Why:** Visitors who are learning gain from a longer period, which has less noise. Today stays the default because people know it from other heatmaps (Jakob's Law). The owner asked for the switch to be centred, bigger and easier to see, and for yearly performance to return to the map.
**Note:** Use the thresholds in Section 4.2. Do not store the choice in KV.

### M12 — Legend
**Context:** Below the map.
**Technical instruction:** Replace the five-row legend with one inline row of five labelled swatches (strong fall to strong rise) with the thresholds of the selected period. Add the open/closed dot key at the end of the same row. Use text at 12px or larger with at least 4.5:1 contrast. Wrap the row onto two lines in a narrow container.
**Why:** The reference legend uses about a quarter of the height, and its grey threshold text is faint.

### M13 — Interaction
**Context:** Hover, focus, click, and tap behaviour.
**Technical instruction:** On hover or keyboard focus of a card, highlight its dot, its country outline, and its leader line. Dim the other leader lines slightly. On click, tap, or Enter, open the index's existing detail view (the one the table uses). Limit transitions to 200ms. Remove transitions when the user prefers reduced motion. In the list layout, tap on a dot to scroll to its list row and highlight the row.
**Why:** The map and the detail view must feel like one system (cross-app consistency).

### M14 — Theme
**Context:** Light and dark appearance.
**Technical instruction:** Follow the site's existing theme mechanism. Add no new toggle. Use no outer glow, neon, or blur effect. Give each card a 1px border in its step colour at reduced opacity.
**Why:** Neon-on-navy is a current trend and dates quickly. The page direction is calm and analytical.

### M15 — RTL and numbers
**Context:** Farsi version of the module.
**Technical instruction:** Keep the map box left-to-right in both languages. Do not mirror land, dots, or positions. Mirror the order of the header, summary, legend, and the content inside each card. Wrap each number with its sign in a bidi isolate (left-to-right). Use the site's existing number formatter for Persian digits, the decimal separator, and the percent sign. Use the true minus sign (U+2212) for negative values.
**Why:** Geography does not mirror. Without isolation, a negative value can render as a flipped string.

### M16 — Accessibility
**Context:** Whole module.
**Technical instruction:** Mark the map SVG `aria-hidden="true"`. Give each card an accessible name with: index name, country, direction, size, period, market state. Keep DOM order and tab order equal to Section 4.1. Make the focus ring visible in both themes (3:1 contrast or more). Never use colour alone: keep the sign, the arrow, and the text on every card.
**Why:** Screen-reader and keyboard users get the same data as the visual map.

### M17 — States
**Context:** Loading, missing data, old data, and failure.
**Technical instruction:** Implement these states.

| State | Behaviour |
|---|---|
| Loading | Grey land, ten grey hollow dots, no numbers. Reserve the final height to prevent layout shift. |
| One index has no data | Card shows "—" in place of the change and the tag "No data". The country stays neutral. |
| One index is old (last price older than `STALE_AFTER_DAYS`) | Same as no data, with the tag "Old data". |
| Whole payload fails | Show the last good payload and the line "Showing data from {time}". If none exists, show the section's existing error state. |

**Why:** Missing data must look missing. It must never look like 0.00% (Nielsen: error prevention).

## 6. Data instructions

**D1 — Payload.** Context: existing refresh job and stored payload. Technical instruction: Add these fields for each map index to the existing payload: last price, change for 1D, 1M, and 1Y, last-update timestamp, market state, last-close date. Compute them in the existing refresh job from the existing history. Why: One payload keeps KV usage at zero extra operations.

**D2 — Market state.** Technical instruction: Use the provider's market-state field when the provider has one. Otherwise, set "open" when the quote is `OPEN_MAX_AGE_MIN` minutes old or less, and "closed" in all other cases.

**D3 — Change calculation.** Technical instruction: Calculate 1D from the previous close. Calculate 1M and 1Y from the close on the same calendar date one month or one year earlier (use the nearest earlier trading day). Round to two decimals for display only.

**D4 — Client fetch.** Technical instruction: Reuse the existing fetch. Add no new polling timer. Do not fetch again when the period changes.

## 7. Map asset build

**B1 — Script.** Context: build step that makes the map and dot positions. Technical instruction: Create one script (follow the repo's scripts convention) and one npm script `build:map`. Use dev dependencies only: `world-atlas` (Natural Earth 110m countries), `topojson-client`, `d3-geo`. Remove Antarctica. Project with `geoNaturalEarth1` fitted to the map box. Write `world-map.svg` (one path per country with `data-iso`) and a JSON file with each dot's x and y as percentages. Make the script repeatable. Commit its outputs. Keep the SVG at or below 80 KB raw.

**B2 — Flags.** Technical instruction: Take the ten SVG flags from the MIT-licensed `flag-icons` package (1×1 versions). Combine them into one sprite. Crop each flag to a circle with CSS. Add the licence text to the repo's third-party notices file (create it if it is missing). Add the Natural Earth source note (public domain) to the same file.

**B3 — Loading.** Technical instruction: Serve the map and the sprite as static assets from the Worker's static assets. Load them when the module is about one screen from the viewport.

## 8. Out of scope (do not build)

Curved arcs or correlation lines. Share-as-image. More than ten callouts. Periods longer than 1 year. Changes to the hero count or section verdict. New data providers. Special emphasis on Australia.

## 9. Verification (the agent runs all of it)

**Automated checks**
1. Playwright screenshots: widths 1280, 1024, 960 (map layout) and 768, 390 (list layout), each in English LTR and Farsi RTL, each in light and dark. Total: 20 screenshots.
2. Layout test in the map layout: no card overlaps another card. No leader line crosses another card or another line. Every leader line is shorter than one quarter of the map width.
3. Contrast test: text at least 4.5:1, dots and rings at least 3:1, focus ring at least 3:1, in both themes. Adjacent tint steps differ by at least 1.1:1 in relative luminance. When a token fails, adjust it by mixing toward the foreground colour until it passes. Do not add new hex values.
4. `axe-core`: zero serious or critical issues.
5. Keyboard test: Tab order equals Section 4.1. Enter opens the detail view.
6. Farsi test: Persian digits, correct minus sign and percent sign, unmirrored map.
7. KV test: count KV reads and writes for one page load and one refresh, before and after your change. The difference must be zero.
8. State tests with mock payloads: all up, all down, one index missing, one index old, whole payload failed, all markets closed.

**Visual checklist (look at the screenshots yourself)**
- The land is quieter than the cards.
- Only the ten countries are tinted.
- No arcs, no glow, no tagline, no second title.
- The legend uses one row.
- The % change is the largest number on each card.
- The page looks calm and analytical, and clearly part of Currena.

## 10. Final report (maximum 15 lines)

State: branch name; files added and changed; results of each check in Section 9; the KV difference; defaults you used; callouts you removed; anything you could not finish; the exact command to preview the result locally.
