# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
as a private monorepo, releases are tracked by date and Workers version rather
than a semver tag.

## [2026-10-12] — The state's artwork leads the verdict row: [icon][word] (owner round 41)

Forty-first round — a one-line owner note: "the icons must before the state
like this [icon][stressed] — currently it's after the state."

### Changed

- **The hero verdict row reads [state-icon][state-word][meter]** — the
  state's artwork moves IN FRONT of the verdict word in both regions'
  verdict blocks (the old order rendered the word first, so the row read
  `[stressed][icon]`). The mark now opens the state moment in the same
  reading order as every other chip in the app — the status chips have
  always been icon-then-word. The meter stays last as the row's
  instrument. In fa the icon leads from the right edge (RTL reading
  order); in en from the left.

## [2026-10-11] — The hero attention tiles align into one row; unit labels read small (owner round 40)

Fortieth round — an owner note with a screenshot of the two hero verdict
blocks side by side: "This boxes need alignment, all must be in a same row"
(example: the Global Brent tile vs the Australia home-loan tile), followed by
"also read آمریکا (unit currency) smaller so it doesnt go to second row."

### Changed

- **The two regions' attention-tile rows share one horizontal band** — the
  count line + tiles + "+n more" + the "how is this computed?" link are now
  ONE bottom-anchored module inside each verdict block (a single `mt-auto`
  pins its top edge). The old free-floating tile block sat lower in the
  Australia panel (its gauge rows and reason sentence are taller) and the
  two rows zig-zagged; the free space now lives ABOVE the module, so both
  panels' tile rows start at the same y BY STRUCTURE (the alignment
  decree), measured pixel-equal in both locales.
- **Tile faces are geometry-fixed** — the name row is EXACTLY two lines
  (`h-[2.75em]`) with the indicator's artwork moved out of the text flow
  (a flex sibling can no longer inflate the line box — the old inline 24px
  icon made two-line titles 41px vs 34px and pushed that tile's value 7px
  below its neighbours); the meaning line is clamped to three lines with
  the same three-line reserve, so every tile is the same height across
  both regions and the meanings' edges align.
- **Unit labels read small** — value rendering gains `indicatorValueParts`
  (number/unit split; `formatIndicatorValue` is now the exact join of the
  parts, outputs byte-identical everywhere). In the tiles the number keeps
  the 23.2px number role while word-units ('دلار آمریکا', 'pts') render at
  caption size on the number's baseline — '۱۲۵٫۴۴ دلار آمریکا' stays on
  ONE row at every desktop width from ~1110px up (the old full-size unit
  wrapped it to two rows). Percent signs and prefixed 'US$' stay glued to
  the number as before. Below ~1110px the unit wraps as a whole word-block
  under the number (the 3-across tile band 768–1130px physically cannot
  fit a 90px number plus a word-unit — pre-existing geometry, and the
  tile faces stay tidy when it happens).
- Tiles tighten half a step to make the row fit (`px-3`→`px-2`, tile grid
  gap 6→4px, value gap 6→4px, unit weight 700→600) — the owner's ~1136px
  viewport now carries ~5px of slack instead of a knife edge.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 332.35/85.76 vs 334.00/86.00; entry 290.33/87.83).
- Local QA (wrangler :8787, KV from prod): en + fa, light + dark, at 1280 —
  both panels' tile rows pixel-equal (ul top 457 = 457, tile heights
  137 = 137, values all at y 501, one line 31px each); the fa Brent tile's
  'دلار آمریکا' reads small on the number's baseline (top 511 vs 501 —
  same row); 1136 — rows still pixel-equal, oil value one line with ~5px
  slack; 375 — single-column tiles, no horizontal overflow; "+n more"
  reveal works in place (3→5 tiles); how-link pinned 16px off the panel
  bottom in both blocks; zero page errors, zero console errors.
- Release: commit + staged-diff token scan clean, pushed via one-shot PAT
  URL, wrangler deploy, production verified (health, chunk byte-compare,
  live browser pass).

## [2026-10-11] — Each region's metrics move into their own mother container (owner round 39)

Thirty-ninth round — an owner note with a screenshot of the Global section:
"put all of global metrics inside a mother container, currently the heading
of global looks stray, it needs depth and container", followed by "australia
must have separate mother container."

### Changed

- **Each region section is its own mother container** — the Global heading
  (and its 96/128px artwork) no longer floats on the page background with
  the metric cards scattered under it. The whole section — heading +
  artwork + every question group, alert/connection cards and the
  "show all" affordances — lives INSIDE one rounded container: the soft
  family tint (`currena-soft/60`, the same field the no-match box wears),
  a hairline ring and a quiet shadow for depth. Three visual layers now:
  page background < tinted mother container < white metric cards.
- **Australia gets a SEPARATE container** — by structure, not luck: the
  section map renders one `<section>` per region, so the two boxes can
  never fuse; measured 40px of page between Global's bottom edge and
  Australia's top edge, both the same width and column edge in both
  locales.
- Gold stays reserved for the money panel's focal treatment — the regions
  take the neutral depth. Anchors (`insights-section-*`), aria labelling,
  scroll margins and everything inside the containers are untouched.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.78/85.21 vs 334.00/86.00; entry 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en light + dark at 1280 — both
  containers render with tint/ring/shadow, heading + artwork inside each
  (Global 10 groups, Australia 6), separate boxes with a 40px gap, same
  width 1088 and left edge 96; fa RTL — both containers right-aligned at
  the same edge (1184), boundary screenshot shows the two boxes stacked;
  375: docW = clientW = 375, container 343px with 16px inner padding; zero
  page errors, zero console errors. Screenshots r39-local-*.png.

## [2026-10-11] — The money rows' type steps down to proportional (owner round 38)

Thirty-eighth round — one owner note on the round-37 sizes, with a
screenshot: "Now they're too big, make them proportional."

### Changed

- **The heading and the number return to proportional steps** — the
  round-37 scale (28px heading / 29px value) shouted against the 14px
  sentence. The area name steps down to 1.5× the body
  (`calc(var(--type-label) * 1.5)` = 21px, still bold) and the value
  returns to the page's number role (`type-number` = 23.2px / 800 /
  tabular — the attention tiles' role, and the size the owner approved
  in round 36). The column reads heading (21) → estimation word (14
  bold) → value (23.2, still the biggest line) → sentence (14), every
  step a token or an existing role — no arbitrary px. A side effect the
  owner gets for free: value + explanation now fit ONE line again in
  most rows (the 29px forced the explanation to wrap).
- Nothing else moves — the one-column-beside-the-icon layout, the
  shared column edge per row, the 50/50 data|chart split and the dedupe
  are all untouched.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.61/85.14 vs 334.00/86.00; entry hash moved with the
  chunk rename, size identical 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en + fa at 1280 — name
  21px/700, value 23.2px/800, name/dir/value on one column edge ×4 rows
  (en left 236, fa right 1044), value inside the icon band ×8, fa chart
  half still left of the data half; 375: docW = clientW = 375, value on
  one line (189px wide); zero page errors, zero console errors.
  Screenshots r38-local-*.png.

## [2026-10-11] — The value moves up beside the icon; the numbers and headings grow (owner round 37)

Thirty-seventh round — three owner refinements to the money rows, each with
a mockup: "move the text to inside the approx red rectangle i drawn" (the
empty band under the direction word, beside the tall icon box); "also make
the percentage text size 25% bigger"; and "also make the headings such as
«پس‌انداز و بهره» 100% bigger — for example if it's 12px make it 24px".

### Changed

- **The value lines move INTO the name/direction column** — the supporting
  number lines no longer sit in their own row under the icon box; they are
  the third line of the column beside it (name → direction word → value),
  exactly where the owner drew the red rectangle. The dead vertical band
  that used to sit under the direction word is filled: the value's top now
  lands INSIDE the icon box's band in every row (verified 4/4 in both
  locales), and the sentence still starts at the half's edge below.
  Alignment gets STRONGER, not weaker — the name, the direction word AND
  the value now share one column start edge per row (left 236 ×4 in en,
  right 1044 ×4 in fa), by structure.
- **The value grows 25%** — 23.2px → 29px via
  `calc(var(--type-number) * 1.25)`: a token ratio, not a magic px, so the
  number role scales if the type scale ever moves. Weight stays 800 with
  the NUMBERS, tabular digits, one line (never breaks mid-text).
- **The area name is a real heading** — 2× the label role
  (`calc(var(--type-label) * 2)`, 14px → 28px, still bold, snug leading
  for the Persian ascenders). The row now reads heading → estimation →
  number → sentence, the owner's mockup order, in both locales.

### Verified

- Gates: typecheck 5/5; tests 804/804; build ✓; bundle budgets held
  (Insights 331.68/85.16 vs 334.00/86.00 — class strings only; entry
  untouched 290.33/87.05).
- Local QA (wrangler :8787, KV from prod): en/fa × light/dark × 1280/375
  — name/dir/value on one column edge ×4 rows, value inside the icon
  band, name 28px/700, value 29px/800, explanation 14px/400; fa chart
  half still left of the data half; 375 stacks with docW = clientW = 375
  and the value unbroken; zero page errors, zero console errors.

## [2026-10-11] — The numbers lose the pill; the small grades lose the rainbow (owner round 36)

Thirty-sixth round — three owner points with screenshots: the money rows'
supporting chips should move and change shape ("first write the percent in
bigger and bolder text, then write the explanation of it smaller with
regular text … delete the chip like alternative"); "find it why those both
boxes show «قیمت‌های استرالیا نسبت به سال قبل» — is this correct?"; and
the hero's small grade meters: "Align this 6 boxes. also it's too visual
noise … use normal color not color coding."

### Changed

- **The money rows' numbers are plain text, not pills** — the supporting
  chip row is gone from the bottom of the data half. Each supporting
  number now sits BETWEEN the name/direction line and the sentence,
  spoken the owner's way: the VALUE in the page's number role
  (`type-number` — 23px / 800 / tabular, the same role as the attention
  tiles' numbers) and the indicator name after it smaller (label size)
  at REGULAR weight. Value first in the DOM → rightmost in fa (the
  owner's mockup), leftmost in en. The line still opens the indicator's
  card — the pill's one job survives, its look is gone. The value never
  breaks mid-text (`whitespace-nowrap`); on phones a long name wraps
  below the value instead.
- **Each supporting number shows ONCE** — the owner's duplication
  question, answered: savings AND shop both legitimately read Australia
  CPI (config lists it for both), so when CPI left its usual range BOTH
  rows picked it as their first driver — correct per the data, but the
  same «قیمت‌های استرالیا نسبت به سال قبل» twice read as duplication.
  Display-level dedupe: the later row falls through to its NEXT driver
  (shop → underlying inflation, «تورم زیرین ۳٫۶٪»), and the row's chart
  follows the number it actually shows (shop's mini chart is now the
  trimmed-mean series — arguably the better chart for shop prices
  anyway). If every chip was already shown, a row re-shows its own — a
  row never loses its number or its chart.
- **The hero's grade boxes align BY STRUCTURE** — the wrap is gone: the
  gauge name owns the row's free width and truncates with the full text
  on hover (title) and in the meter's aria (the old wrap made
  "Borrowing costs" rows 42px while single-line neighbours sat at 21px —
  the boxes zig-zagged). Every row is exactly one line high; tightened
  the column/element gaps (gap-x-5, gap-1.5) so even the longest short
  names ("Borrowing costs", "Inflation & rates") fit without
  truncating at card width.
- **The small grade meters are NOT colour-coded** — "use normal color
  not color coding": the six small meters' filled segments render in one
  normal ink (text-secondary) in light and dark, and the step words sit
  in the same normal ink instead of the status palette. The colour
  coding stays where it belongs — the hero's BIG meter and verdict word.

### Housekeeping

- No bundle movement that matters: Insights 331.50/85.14 vs budgets
  334.00/86.00; entry untouched 290.33/87.06.

## [2026-10-11] — The money rows' mini graphs shrink to half the card (owner round 35)

Thirty-fifth round — one owner point on the round-34 money charts, with a
sketch: "This graphs are too big, it must only contain 50% of the card
width, 50% other data and context like this [ graph       data]".

### Changed

- **The money rows are a 50/50 grid** — the mini chart no longer spans
  the full card on its own wrapped line. Each row is now
  `sm:grid-cols-2`: column 1 (inline-start) is the DATA half — icon +
  name/direction on the first line, the sentence and the supporting
  chips stacked under them — and column 2 is the CHART half, the same
  TrendPanel (axes + hover inspector + Quarter/1y/5y chips + delta,
  plot h-16) vertically centred in its half like the metals' chart
  columns, separated by a vertical hairline (`border-s` faces the data
  half in both directions). In fa/RTL the chart lands on the LEFT and
  the data on the RIGHT — exactly the owner's sketch; en mirrors it,
  the same label-start/chart-end pattern the Estimation strip already
  uses. Phones (<sm) keep the round-34 stack: hairline above, chart
  full-width under the data.
- **The divider is aligned BY STRUCTURE (the decree)** — `grid-cols-2`
  makes the split exact and equal in every row: verified chartLeft =
  648 / dataLeft = 128 / chartRight = 1152 across ALL FOUR rows
  (petrol, homeLoan, savings, shop), each half exactly 504px at 1280,
  and each row's two halves stretch to the same height (186 = 186).
  The sentence starts at the half's edge in every row, so the R30
  "sentences start at different positions" roast stays fixed.

### Housekeeping

- No bundle movement that matters (class strings only): Insights
  331.44/85.10 vs budgets 334.00/86.00; entry untouched 290.33/87.05.

## [2026-10-11] — Real axes and a hover inspector on every chart; the money rows wear the same mini graphs; alignment by structure (owner round 34)

Thirty-fourth round — the owner's follow-up on round 33's charts: "the gold
and silver graphs must have X and Y axis, also when you hover mouse on
graph, it must show price points during the times"; "add graphs with same
structure" to the "What it means for my money" rows as mini graphs; the
copper move chip «نسبت مس به طلا بالا می‌رود» is "somehow vague — write
more intuitive and practical text like: قیمت مس نسبت به طلا رشد می‌کند";
and the standing decree: "Always comply alignment rules, so such incidents
must never happen."

### Added

- **X and Y axes on every trend chart** — the round-33 sparklines grew a
  real frame: three dashed horizontal gridlines (top/mid/bottom) with Y
  tick labels at the line's max / mid / min (compact by magnitude —
  "4,411" / "65.4" / "3.95"; Persian digits in fa), and X tick labels at
  the window's first / middle / last point (en "Aug 2026 → Oct 2026",
  fa Jalali «مرداد ۱۴۰۵ → مهر ۱۴۰۵»). The gridlines and labels are
  positioned from the SAME scaleY geometry that draws the line, so a
  gridline always sits exactly on the value its label names, and every
  label renders as HTML (never stretched-glyph SVG text).
- **A hover price inspector** — moving the mouse over a plot (or tapping
  it) snaps a crosshair + dot to the nearest point and floats a tooltip
  with the exact price point and its date ("US$4,108 · Oct 7, 2026";
  fa «۴٬۱۲۸ دلار آمریکا · ۱۶ مهر ۱۴۰۵», units from the indicator's own
  formatter). The plot is also focusable and keyboard-walkable
  (←/→ step, Home/End jump, Esc clears), so the numbers are reachable
  without a mouse. Tooltips clamp inside the plot edges.
- **Mini graphs on the money rows** — every "What it means for my
  money" row now carries the EXACT same structure as the metals'
  Estimation charts (shared TrendPanel: axes + hover inspector + the
  Quarter / 1 year / 5 years chips + the signed window delta), rendered
  as a full-width mini chart on its own hairline-separated line under
  the row. It charts the row's FIRST chip — the indicator actually
  making the row speak (petrol → Brent +64% quarter, home loan → the
  paid rate, savings & shop → CPI) — so the picture and the sentence
  can never disagree. No-series rows keep the honest "no chart history"
  line; a Quarter chip disables itself when the window holds <2 points
  (quarterly CPI).
- **TrendChart.tsx** — the shared module behind all of it (chart + axes
  + inspector + chips + delta + the module-cached history hook), so the
  two sections stay aligned by construction.

### Changed

- **Alignment is structural, never lucky (the decree)** — three fixes:
  (1) the Estimation strip's verdict words own a fixed two-line slot
  (silver's «جهت روشنی ندارد» wraps, gold's «پایین می‌آید» doesn't — the
  slot keeps both tiles' verdicts, chips and deltas on the same
  baselines; verified chipsTop/deltaTop identical across tiles); (2) the
  chart column owns a reserved height so loading/empty states can't pull
  one tile's rows above the other's; (3) the connection cards' focal
  verdict fields anchor to the card's BOTTOM (mt-auto) — cards in a row
  stretch to equal heights, so all three gold fields finish on the same
  baseline instead of floating where the upper content happens to end.
- **Charts hold their time direction in RTL** — the whole TrendPanel
  block lays out dir="ltr" (the house chart convention): Y labels left
  of the plot, X ticks running left→right matching the SVG line — the
  first date's label sits under the line's FIRST point in fa too, not
  mirrored onto its end. The card layout around the chart still mirrors.
- **The copper move chip speaks plainly** — «نسبت مس به طلا» →
  «قیمت مس نسبت به طلا» (chip now reads «قیمت مس نسبت به طلا بالا
  می‌رود», the owner's own example shape; the page-wide بالا می‌رود /
  پایین می‌آید vocabulary stays). en "the copper-to-gold ratio" →
  "the copper price vs gold" (chip: "the copper price vs gold rising").
  The details panel's typical line joins ("The copper price vs gold
  sits in its usual range." / «قیمت مس نسبت به طلا در محدودهٔ همیشگی
  است.»). The prose explanations keep the ratio wording (that's what
  prose is for). One new shared aria key, `trendChartAria` («روند قیمت
  {name}، {range} گذشته»), × 2 locales.

### Housekeeping

- Budget bump 330.00/85.50 → **334.00/86.00 kB gz** (Insights
  331.29/85.09): the shared chart engine (axes + inspector + the money
  minis) is exactly the growth the owner asked for on TWO sections;
  gzip +1.09 kB. The R33 entry pre-announced the bump. Entry chunk
  untouched (290.33/87.06 vs 296.00/89.50).

## [2026-10-11] — The big icons move to the dedicated sections; the Estimation chips wear the metals' own charts (owner round 33)

Thirty-third round — five owner points: the 128px world/australia maps in
the HERO are "visual noise" (max 64×64 up there; the big icons belong
"here in the middle of page of global and australia" — the screenshot
points at the dedicated `Global` section heading); the Estimation chips'
white space should carry "gold and silver chart … quarter, one year,
five year time frame by clickable chips"; the Global | Australia switch
bar must go from the top of the page ("also it doesnt work"); and the
"+2 more" tile "doesnt show other indicators".

### Changed

- **The switcher is retired — both regions render, stacked** — the
  Global | Australia pill bar is gone from the page entirely (it sat
  above the fold flipping a state the reader could not see: clicking it
  re-rendered a section below the fold and read as dead). The dedicated
  sections now render TOGETHER mid-page — Global first (D7), then
  Australia — each headed by its own name; `insights-section-global` /
  `insights-section-australia` are static anchors, so the hero's "View
  section" links and the Tools counts behave honestly (counts describe
  everything on screen again). LaneSwitch.tsx + the lane storage key are
  deleted.
- **The big region icons live on the section headings** — each dedicated
  section's h2 leads with its artwork at the price tiles' scale (96px
  mobile / **128×128 desktop**) beside the name: the globe for Global,
  the map for Australia. This is where the owner wanted the big icons —
  the screenshot's heading — not the hero.
- **The hero mark steps back down** — the verdict blocks' region icon is
  a quiet 48px mobile / **64×64 desktop** (the owner's hard ceiling),
  silencing the visual noise the 128px artwork made at the top of the
  page.
- **The Estimation chips' white space is now the metals' own history** —
  each verdict chip pairs its 128px artwork (left column: artwork, name,
  verdict word) with a compact zero-dependency SVG trend chart (the
  house Sparkline pattern, dir="ltr" in both locales) that fills the
  former white space on desktop and sits under the artwork on phones.
  Under the chart: CLICKABLE range chips — **Quarter · 1 year · 5 years**
  (en) / «سه‌ماهه · ۱ سال · ۵ سال» (fa) — default Quarter, disabled when
  the window cannot show ≥2 points, plus one signed window delta
  («+130.3%», quiet ink — the verdict word beside it already speaks in
  colour). Data rides the same module-cached `/api/insights/:id/history`
  fetch the details panel uses; a 404 degrades to the honest "no chart
  history" line.
- **"+n more" now shows the indicators** — the hero's needs-attention
  overflow tile used to jump to the (removed) switcher's lane, which
  read as a dead click. It now reveals the remaining tiles IN PLACE
  (the grid wraps; the button disappears once everything is shown).

### Housekeeping

- Insights chunk 326.09/84.00 kB raw/gz against the previous 322.50/84.00
  budget — OVER by 3.59 kB raw (gzip grew ~1 kB), so the budget bumps to
  **330.00/85.50** with this note (the R32 entry pre-announced the first
  additive bump). The growth is the strip charts + chips, the dual
  sections and the reveal state — logic and JSX, not strings. ENTRY
  chunk untouched (290.33/87.05 vs 296.00/89.50). PWA precache unchanged
  (85 entries).

## [2026-10-11] — Plain direction words, no stuttered rows, big region marks, and the connections' focal verdict field (owner round 32)

Thirty-second round — five owner points: "instead of 'ارزش می‌بازد' say
'پایین می‌آید' or will go down"; the condition rows' duplicated state word
("علیه کار می‌کند / دلار آمریکا / علیه کار می‌کند"); "علیه کار می‌کند is not
a good translation — use در تضاد است or در جهت مخالف است"; the dedicated
Australia and Global sections should wear their big icons; and the
connections' moves ("نسبت مس به طلا بالا می‌رود…") need "a container inside
a container as focal point for the verdicts and estimations".

### Changed

- **The Estimation speaks plainly again** — the verdict words are back to
  the owner's own R23 phrasing: "will go up" wears green, "will go down"
  wears red (fa: «بالا می‌رود» / «پایین می‌آید») — R26's "gaining/losing
  value" («ارزش می‌گیرد/می‌بازد») are retired. The page now speaks ONE
  direction vocabulary: the verdict chips, the collapsed summary takeaway
  and the connections' move lines all use the same words. Colour still
  never rides alone: the zigzag/flat icon leads every word.
- **The condition rows lost their stutter** — each row used to render the
  state word twice (icon + short word at the start, then the full word
  again after the name; in fa the two strings for "against" were
  IDENTICAL, so every against-row read «علیه کار می‌کند / دلار آمریکا /
  علیه کار می‌کند»). The trailing echo is gone — the icon + word at the
  row's start IS the state. Verified: exactly one occurrence per row in
  both locales.
- **"works against" is now «در تضاد است»** — the fa wording the owner
  rejected is replaced across the signals copy (group heading, state
  words, and the real-yield "how" sentence's closing clause → «در تضاد
  با آن است»). English "Works against" is untouched.
- **The Global and Australia blocks wear their big icons** — the hero's
  region verdict cards (the dedicated sections) now lead with their own
  artwork at the price tiles' scale (96px mobile / **128×128 desktop**),
  the section label and the view link sitting beside it, vertically
  centred — the same face the Estimation chips and the price tiles speak
  with.
- **The connections have their focal verdict field** — when a connection
  card has estimations to show (active/partly), the right-now verdict and
  the per-leg moves move INTO the app's focal container-inside-container
  recipe (the money panel's / the Estimation strip's): the card holds a
  brand-gold gradient field with a 2px gold ring and gold-tinted shadow;
  the field holds the verdict line and the moves as WHITE CHIPS, each
  riding a direction glyph — up/down arrows for rising/falling, the dash
  for steady, and a position dot for level-only legs (high/low/mid — a
  level is not a movement). Quiet states (inactive/unknown) keep the
  plain one-line verdict.

### Housekeeping

- Copy-only + presentation change; no engine, API or asset changes.
  Insights chunk 322.43/83.03 kB raw/gz against the 322.50/84.00 budget —
  HELD with 0.07 kB to spare (the next additive round likely bumps; noted
  here so the bump is never silent). PWA precache unchanged (85 entries).

## [2026-10-11] — The Estimation strip becomes the card's verdict; "expensive" speaks in red (owner round 31)

Thirty-first round — two owner points: the gold-and-silver card's verdict
strip must be "contrasted with more visual weight against its section,
because it's the verdict and estimation of the whole section", with its
icons at 128×128 on desktop; and "everywhere which is marked 'expensive'
use red color".

### Changed

- **The Estimation strip is the focal takeaway** — the app's focal-section
  recipe (the money panel's, round 29) now wraps the strip: a brand-gold
  gradient field (16% → 7% → transparent), a 2px gold ring, and a
  gold-tinted shadow (dark mode keeps the gradient with a deeper shadow),
  so the white verdict chips pop against the card they summarise. The
  strip's title lifts to secondary ink for the tinted field.
- **Verdict chips restacked around the artwork** — each chip is now a
  small stacked card: the metal artwork leads at the price tiles' scale
  (96px mobile / **128×128 desktop**), the metal name rides under it, and
  the verdict word ("losing value" / "no clear direction" / «ارزش
  می‌بازد»…) speaks at the price's own size (type-number) in the verdict
  ink — icon + word, never colour alone. The direction zigzag grows with
  the strip (28/36) beside the big word. Header lean lines, footing rows
  and the collapsed summary keep their own smaller scales.
- **"expensive" is red (owner decree, R31 restores the pre-R30
  valence)** — `bandToneClass` maps the price position band to status
  ink again: expensive (top of the 10-year range) = the alert red, cheap
  (bottom) = the supportive green, typical stays neutral. It colours the
  price tiles' change-row word AND the details panel's 10-year position
  word (price rows). Never colour alone: the word always rides beside
  the change numbers / the position bar.

### Housekeeping

- No copy, engine or API changes. Insights chunk 321.10/82.94 kB raw/gz
  against the 322.50/84.00 budget (no bump). No new assets — PWA precache
  unchanged (85 entries).

## [2026-10-11] — Price tiles: the artwork IS the card, at 128×128 on desktop (owner round 30)

Thirtieth round — the owner checked production, found it still serving the
round-28 markup (the round-29 commit had not left the sandbox), and set the
next bar: "The icons look like before… The main prices … must have at least
128×128 icon in pc." Two jobs: actually ship what is committed, and make the
price tiles' artwork a true 128×128 face on desktop.

### Shipped (the round-29 backlog)

- Commit `0225cc0` (round 29) had been gated, browser-verified and committed
  locally, but NEVER pushed or deployed — the sandbox had no GitHub token and
  no Cloudflare token, and the remote URL is tokenless by design. The owner
  supplied both credentials this round; the release record below covers the
  combined round-29 + round-30 push and deploy.

### Changed

- **Price tiles restacked around the artwork** — the icon box grew to
  96px on mobile / **128×128 on ≥640px screens** (owner's explicit floor;
  the 256px sources downscale cleanly), and the tile turned into a stacked
  product card: artwork on top as the face, then the name, then the big
  price, then the change rows. The old side-by-side arrangement could not
  survive a 128px neighbour: at the 4-across desktop grid only ~100px
  remained beside the icon, and in fa the price («۴٬۱۹۶ دلار») wrapped to
  THREE lines while names wrapped to two — rows started at different
  heights per tile, exactly what the owner's "numbers must align" rule
  forbids.
- **Alignment is now structural, not lucky** — the name rides in a fixed
  two-line slot (`min-height: 2 × leading-snug`), so the price and every
  row under it start at the same y in all four tiles whether a neighbour's
  name wraps or not. Verified programmatically in en and fa at 1280:
  name/price/change tops are pixel-identical across all four tiles.
- The fallback `Coins` glyph (only shown if artwork is ever missing) joins
  the responsive `.currena-icon` mechanism at the same 96/128 sizes.

### Housekeeping

- No copy, engine or API changes. Insights chunk 320.73/82.91 kB raw/gz
  against the 322.50/84.00 budget (no bump). No new assets — PWA precache
  unchanged (85 entries).

## [2026-10-11] — Icons at full voice, and the money panel becomes the page's focal section (owner round 29)

Twenty-ninth round — three owner points at once: "the icons are too small —
I expect them to be a few times larger on desktop, and relatively larger on
mobile"; a list of which icons/subjects are still missing; and "what it means
for my money needs more contrast and visual weight — different bg, color,
shadow, anything — it is one of the most important sections".

### Changed

- **Responsive artwork sizing (`IconImg` + `.currena-icon`)** — the fixed
  inline `size` px became two CSS custom properties set per image: the
  MOBILE box (`--icon-size`) and the ≥640px box (`--icon-size-sm`,
  Tailwind's `sm:` breakpoint — the same one every money/price row already
  turns at). One media query in index.css drives every artwork surface;
  `object-fit: contain` keeps the 256px sources clean at every size.
- **Every surface grew (mobile → desktop, old desktop in brackets):**
  money-panel area icons 52 → 80px in a 64 → 96px box (40 in 64), price
  tiles 32 → 44px in a 44 → 56px box (26 in 36), the hero's state artwork
  44 → 60px (30), the gold-and-silver estimation strip's metal chips +
  direction zigzags 28 → 36px (20/18), its footing rows 24 → 30px (18) and
  header lean lines 18 → 22px (16), hero region marks 22 → 28px (18),
  hero attention tiles 20 → 24px (16), alert-card titles 26 → 34px (20),
  details-panel headings 32 → 44px (24), and the money rows' estimation
  arrows 20 → 24px (16). The money panel's estimation arrow and word now
  read at the row's own scale, not as a footnote.
- **The money panel is the focal section** — the app's focal accent
  (brand gold, round 24's decision) now wraps "What it means for my
  money": a gold gradient field (16% → 7% → transparent), a 2px gold
  ring, and a soft gold-tinted shadow, with its own padding so the white
  rows sit ON the tinted field — the wrapper-vs-rows contrast carries the
  weight, the rows keep their plain readable surface. Dark mode keeps the
  same gradient logic with a deeper shadow. Row rhythm opened one step
  (gap-2, py-3.5, px-4) to match the larger icons.

### The missing-icon audit (owner question 2)

Subjects that exist in the app but have NO artwork yet, by priority:

1. **Jobs / worker / briefcase** — the money panel's one icon-less area
   ("jobs" still wears the old stroke briefcase) + `au-unemployment`.
2. **Wages / pay packet** — `au-wage-growth`.
3. **Central bank building** — `fed-target`, `ecb-dfr`
   (`rba-cash-rate` currently borrows the housing art; a bank of its own
   would let policy rates read as policy).
4. **Government / treasury** — `govt-interest-revenue`.
5. **Strong dollar (a $ with directional arrows)** — `dollar-basket`.
6. **Flags: US, Japan, EU, China, Australia** — the five FX pairs
   (`usdjpy`, `eur-usd`, `usdcny`, `audusd`, `audjpy`); the converter
   already speaks flags, the Insights lanes don't yet.
7. **China factory** — `china-pmi`.
8. **Money supply (banknotes stack)** — `m2-us`.
9. **Nervous-market gauge (distinct from the four state gauges)** —
   `stress-stlfsi`, `nfci`.
10. **Inflation expectations (a coin + a clock)** — `breakeven-5y5y`.
11. **Container ship / trade** — `terms-of-trade`.
12. **Iron ore (rock / mine cart)** — `iron-ore`.
13. **A wallet/purse for the money-panel header** — optional, the section
    currently relies on the gold field alone.
Not needed: `gold-silver` (the two bars already ride the ratio row),
`gold-btc`/`silver-btc` (context ratios, tiny), `au-us-10y-gap` (covered
by the US-10Y family art).

### Housekeeping

- No copy, engine or API changes; the estimation engine (round 25) and
  the copy corpus are untouched. Insights chunk 320.69/82.87 kB raw/gz
  against the 322.50/84.00 budget (no bump — the responsive sizing is
  ~0.8 kB of JS + 21 lines of CSS). No new assets, so the PWA precache
  is unchanged (85 entries).

## [2026-10-11] — The owner's icon set: the app wears its own artwork (owner round 28)

Twenty-eighth round — the owner shipped "Currena PNG Icons.zip" (18 pieces,
256×256, carefully named) with the instruction: create a proper assets
folder, move them under it, use them everywhere possible ("everywhere you
see gold use gold.png"), keep sizes flexible (sources support up to
256×256), and keep the SAME colour coding the finance states already speak
(cautious etc.).

### Added

- **`apps/web/public/assets/icons/`** — the 18 pieces with web-friendly
  lowercase-kebab names (gold.png, silver.png, oil.png, bitcoin.png,
  copper.png, fuel-price.png, bills-shop-prices.png,
  home-loan-rent-interest.png, stock-exchange-index.png,
  us-10-year-interest.png, global-finance.png, australia-map.png,
  stable/cautious/stressed/critical-state.png,
  up-support-growth-increase.png, down-work-against-decrease.png). The
  original zip is archived at `docs/icon-source/`.
- **`components/icons/currena.tsx`** — one shared module: the URL maps
  (indicator → subject, money-area → subject, section → region mark,
  verdict step → state) and the one decorative `<img>` shape
  (alt="" + aria-hidden — the adjacent word always carries the meaning).

### Changed

- **Price tiles**: the round-24 stroke pictograms are gone — oil barrel,
  gold bar, silver bar and bitcoin wear their own artwork in the same
  tinted boxes (gold keeps the brand-gold box).
- **Money panel**: five of six areas wear artwork (fuel nozzle, housing,
  the rising chart for savings, bills, the globe for overseas); "jobs"
  has no artwork yet and keeps its stroke briefcase.
- **Gold-and-silver card**: the metal chips, the header lean lines and
  the footing rows show the gold/silver bars; the metals' up/down
  estimation arrows are the owner's green/red zigzag artwork (their fixed
  colours match this card's holder-view valence by construction — up =
  gain). The flat dash stays a stroke glyph; the money panel keeps its
  stroke arrows (there "up" can be the BAD case and must follow the
  area's valence ink).
- **Hero verdict cards**: each region wears its mark (globe = Global,
  map = Australia), and the big verdict word is beside its state's
  artwork — drawn in the SAME colour coding the app already speaks
  (green Stable ↔ the normal ink, amber Cautious ↔ the watch ink, orange
  Stressed ↔ the stressed ink, red Critical ↔ the alert ink). Icon +
  word + ink, never colour alone.
- **Alert cards, hero attention tiles and the details panel**: every
  mapped indicator (oil, gold, silver, bitcoin, copper, the US-10Y
  family, the CPI/bills family, the housing family, petrol) names itself
  with its artwork.

### Housekeeping

- No copy, type, engine or API changes. The icons are static public
  assets — no JS cost; the Insights chunk moved 319.87/82.62 kB raw/gz
  against the 322.50/84.00 budget (no bump). The PWA precache now
  includes the 18 PNGs (85 entries, ~2.7 MB) — same mechanism the flag
  images already used.

## [2026-10-11] — The signals card opens by default — the detail is the content (owner round 27)

Twenty-seventh round — the owner, alarmed: the gold-and-silver "What the
signals say" section had lost its information. It had not: since the UX
round-2 density pass (R7b) the card defaults to COLLAPSED and remembers
that choice in localStorage, so every visit opened to a two-line summary
and a small "Show details" toggle nobody connects with five condition
rows, live values and footing rows. "Collapsed" read as "deleted".

### Changed

- **The gold-and-silver card OPENS by default on every visit.** The
  estimation strip, the Supports / Works-against / Neutral condition
  rows (with their live values and one-line "how" explanations), the
  per-metal footing rows and the silver-only condition render
  immediately — no click, no remembered state.
- **The collapse is session-only now.** "Show details / Show fewer"
  keeps working (and pill/hash links that target the section still
  expand it), but the choice is no longer persisted to localStorage —
  a fresh load always shows the full card. The localStorage key
  `currena.insights.signals-open.v1` is retired; existing visitors who
  had it "closed" stop being stuck collapsed (and stale keys simply
  rot in place, unread).
- The collapsed two-line summary keeps its round-24/26 takeaway
  (direction icon + value word) for anyone who does fold the card away.

### Why not just flip the stored default

Remembering "open" would have fixed the owner's browser but kept the
trap: one accidental "Show fewer" and the information is gone again for
that visitor, forever. The card's whole point is the conditions behind
the estimation — they now show up the way the owner expects, every time.

### Housekeeping

- No copy, type or engine changes — verdictOf, the vote engine and both
  locales are untouched; the Insights chunk SHRANK slightly (localStorage
  read/write effects removed): 319.94/82.52 kB raw/gz against the
  round-25 budget 322.50/84.00. No bump.

## [2026-10-11] — The estimations speak in value and cost, not bare directions (owner round 26)

Twenty-sixth round — the owner, pointing at the red-and-green "will go up":
misleading — it needs supportive words that match the ink ("Growing
Positively"-shaped value words for the metals; "Becoming More Expensive"-
shaped cost words for the money rows) and a direction icon everywhere the
estimation appears.

### Changed

- **Metals estimation chips — value words**: "will go up / will go down"
  → "gaining value / losing value" («ارزش می‌گیرد / ارزش می‌بازد»); flat
  and none unchanged. The words now explain the ink: green means the metal
  is worth more, red means it is worth less — a holder-view sentence, not
  a bare futures claim.
- **The collapsed per-metal summary carries the direction icon now** —
  round 24's takeaway line was word + ink only; the same 14px arrow the
  strip uses rides the line (icon + word + ink, never colour alone, G5).
- **Money estimation words — cost words, valence-matched**: the generic
  "Will go up / Will go down" split into two word-sets that follow each
  area's valence: cost areas (petrol, home loan, shop, overseas) say
  "Becoming more expensive / Getting cheaper" («گران‌تر می‌شود /
  ارزان‌تر می‌شود»); savings says "Earning more interest / Earning less"
  («سود بیشتری می‌گیرید / سود کمتری می‌گیرید») — savings-up is the GOOD
  case (green), and "becoming more expensive" in green would have been
  nonsense. The direction word now always agrees with its colour.

### Why the words changed and the engine did not

The round-25 vote engine is untouched — band breaches, big moves and
10-year extremes still decide every arrow; the tally is still a
description of conditions, not advice. Round 26 only changed what the
arrow SAYS. Today's live data still reads every money row "up" — petrol,
home loan and shop prices "Becoming more expensive" in warning red while
savings "Earns more interest" in calm green — and the metals card split:
gold "losing value" (red), silver "no clear direction" (neutral). The
engine still flips by itself when the regime turns; the words now keep
making sense when it does.

### Housekeeping

- The R11 "no will" corpus guard is strict again: the round-25 exemption
  for the estimation keys is gone — the new words carry no "will", so the
  whole money corpus (both locales) is will-free and buy/sell-free as
  before. The type-lock (InsightsCopy = typeof insightsCopyEn) forced the
  fa mirror in the same commit, as designed.
- No bundle-budget movement: the Insights chunk measures 320.14/82.52 kB
  raw/gz against 322.50/84.00 — the words swapped, the arrows were already
  shipped, and the one new icon (collapsed line) fits inside the round-25
  budget without a bump.

## [2026-10-11] — The money rows speak: a stated estimation under every "What it means for my money" item (owner round 25)

Twenty-fifth round — the owner, pointing at the money panel: a very simple,
short estimation under EACH item ("Petrol and transport, will go up, with an
arrow to up — showing that it will be more expensive"), and it must be based
on calculations and data, not decoration. The same language the gold-and-
silver card earned in round 23, now computed from each area's own drivers.

### Added

- **A stated estimation under every money row**: arrow + "Will go up /
  Will go down / No clear direction" («بالا می‌رود / پایین می‌آید /
  جهت روشنی ندارد»), sitting directly under the area name — the exact
  spot the owner sketched. It is a mechanical tally, not a vibe: each
  area's driver readings vote, majority wins, tie or silence → flat.
- **The vote engine** (`config.moneyDriverVote` / `moneyAreaDirection`),
  one vote per driver, first match wins:
  1. a published band breach (CPI above the RBA's 2–3% band) — the
     strongest causal claim the corpus itself makes;
  2. a statistically big move (|moveScore| ≥ 2, the jumping threshold) —
     the change tends to feed through ("pump prices follow within weeks");
  3. a 10-year extreme level (position band high/low).
  Votes pass through per-driver semantics (`MONEY_DRIVER_KIND`):
  `direct` (brent, the cash rate, the paid mortgage rate — the driver IS
  the area's number), `inverse` (FX: a FALLING AUD makes imports and
  travel dearer), `growth` (CPI/rent/petrol yoy — votes up on breach,
  extreme or acceleration but NEVER down: a growth series below its range
  still means costs RISING, just slower — rent growth at its 10-year low
  is not "rents will get cheaper"), `none` (debt arrears, jobs/pay —
  consequences and mixed semantics don't vote).
- **Valence ink, not direction ink**: the metals card colours by direction
  because the owner HOLDS metal (up = good, green). The money panel is the
  household PAYS side: green = good for your money, red = pressure on it —
  "Petrol will go up" warns in alert red while "Savings interest will go
  up" reassures in green (rising interest is the good case; today it is
  the only green row: cash rate at its 10-year high, CPI above the band).
  The arrow always matches the word — never colour alone (G5).

### Why today's panel reads the way it does (all four rows up — the data, not a bug)

Brent sits at the 99th percentile of its decade and jumped +7.2σ in 30 days,
while the AUD fell −5.5σ (imports dearer) → petrol up. Both inflation
gauges print above the RBA's own 2–3% band → shop prices up. The cash rate
and the paid mortgage rate sit at their 10-year extremes (1.00 / 0.95) with
rents still rising 3.6% yoy → home loan up. Savings ride the same two
readings upward → the green row. In a cutting regime the same engine flips
the rows to "will go down" — the arrow follows the data.

### Housekeeping

- Bundle budget bumped 318.5/82.5 → 322.5/84.0 kB (raw/gz) WITH justification
  (Insights 317.60/81.93 → 319.80/82.41: the vote engine, the 16px arrow
  set and 3 copy strings × 2 locales; entry untouched at 290.33/87.06).
- The R11 "no will" guard now exempts the three estimation keys (owner
  override, same precedent as round 23's verdict strip); buy/sell stays
  banned everywhere and the hedged sentences stay "will"-free.
- New guard file `money-direction.test.ts` (20 tests): vote priority,
  growth-silence (no fake "cheaper"), inverse FX sign, tally/tie → flat,
  valence ink matrix, and a live-shaped regression of today's four rows.

## [2026-10-11] — The roast round: meaning on every warning card, a quieter hero, Jalali everywhere, red discipline, and brand gold (owner round 24)

Twenty-fourth round — a full design roast of the Persian build scored the
page B- with a ranked fix list. All seven "fix this first" items shipped.

### Changed

- **Every needs-attention card and hero tile now carries a one-line
  MEANING** (roast #1: "a rule but no meaning"). A new authored corpus —
  30 indicators × 2 locales (`copy.meaning`) — says what the fired rule
  actually means for the reader ("دستمزد از قیمت‌ها عقب مانده است:
  افزایش حقوقِ هر سال، کمتر از سال قبل می‌خرد."), replacing the
  "قاعده: …" jargon on the hero tiles, alert cards and compact rows. The
  technical rule text stays in the details panel. The line sits in a
  SOFTENED tint (`/10 → /[0.07]`, ring `/25 → /20`) — red belongs to
  words, not walls of pink.
- **The hero says it once** (roast #2). Gauge rows now show only the
  non-calm gauges (unreadable rows stay — they are the honest "cannot
  read" signal); the separate "الان نیازمند توجه" kicker is gone (the
  count line above the tiles already says it); and the tail clause can
  no longer lie — the old mode-based "بقیه در وضعیت پایدار هستند" sat
  beside a Cautious gauge row, so when the remaining gauges disagree the
  sentence now enumerates their DISTINCT words ("The rest are Cautious
  and Stable." / «بقیه در وضعیت محتاط و پایدار هستند.»). New
  `heroReasonOthersMixed` + `heroReasonAndWord` keys; the mode fallback
  stays for call sites without the mixed template.
- **Jalali on every card footer in Persian, through the one formatter**
  (roast #3): the alert card hardcoded `'en'` into `formatAsOf` — Latin
  dates on a Persian page. It now derives the locale from
  `numberLocale`; every other card already used the shared formatter.
- **Red discipline** (roast #4): the four money-panel area labels are
  neutral ink (state still shows in the sentence + chips); hero tile
  tints softened; red remains on "needs attention" words, counts and
  card accents only.
- **Price tiles** (roast #5): a missing change renders a quiet em-dash
  instead of two «ناموجود» labels per tile (six empty labels in a strip
  that should be clean), the position word holds its line
  (`whitespace-nowrap`), and each commodity wears a small pictogram —
  droplet, ingots, coins, ₿ — in the money-panel's tinted-box language,
  with the GOLD tile wearing the brand gold.
- **Footer bidi fixed** (roast 🔴): the official English FRED notice now
  sits on its OWN `dir="ltr"` line, with the Persian explanation on the
  next line in the page's direction (`fredLocalNote` key; en renders no
  second line). No more stray colon or ".(" at a line start.
- **Brand gold is the ONE accent** (roast #7): new tokens
  `--color-accent-gold` (#F3B13F fill) / `-ink` (#2A1F04 text on gold) /
  `-deep` (gold-family ink for highlights: #A87E1C light, #E8B54A dark).
  The lane switch and section pills' selected state is now gold with
  dark ink (was blue/white), and the biggest-move card — the page's
  focal moment — carries a gold ring and gold kicker icon.
- **Smaller findings**: gauge rows and their step words bumped
  caption → label size (the roast measured ~11px words), the compact
  meter grew 44 → 52px wide with 6px segments, and the collapsed
  gold-and-silver summary now ends with its takeaway — the round-23
  estimation, in the direction's ink («برآورد: پایین می‌آید») —
  fixing "jargon with no takeaway".

### Housekeeping

- Bundle budget bumped 307.5/79.6 → 318.5/82.5 kB (Insights chunk
  306.68 → 317.60 kB raw / 79.19 → 81.93 gz): the roast's #1 fix is
  content — 30 meaning lines × 2 locales — plus the mixed-rest keys,
  collapsed verdicts and pictograms. Entry untouched at 290.33/87.06.

## [2026-10-11] — The owner's exact Carbon state palette, and an estimation you can point at (owner round 23)

Twenty-third round — the owner pinned the exact state colours ("use the
given colors for states", IBM Carbon's signature hues in chat) and asked
the gold-and-silver card for "an estimation and verdict, for example,
Gold will go up, Silver will go down."

### Changed

- **Status palette = the owner's four hexes, verbatim.** Round 22's retuned
  inks still read dark, so the four state tokens are now the exact colours
  from the owner's palette image in BOTH themes: Green 50 `#24a148`
  (Stable/supports), Yellow 30 `#f1c21b` (Cautious), Orange 40 `#ff832b`
  (Stressed), Red 60 `#da1e28` (Critical/works-against). The words, meter
  segments, status chips and alert-card accents all read from the tokens,
  so the whole ladder (and the attention tints, re-based to
  `rgba(218,30,40,…)`) picks up the new hues at once. One deliberate
  exception, disclosed: in DARK mode the Critical ink takes Carbon's own
  dark-surface sibling Red 50 `#fa4d56` — `#da1e28` verbatim is 3.2:1 on
  the `#1A222E` card (muddy), `#fa4d56` holds 4.8:1; Carbon pairs 60/50
  across themes for exactly this reason. Known trade-off, owner's call
  kept: Yellow 30 on white is ~1.7:1 — legible at the 25.6px/800 verdict
  size, faint at small label sizes; the exact hue ships as instructed.
- **The gold-and-silver card now states its estimation.** A new
  "Estimation" strip opens the merged card with one direction chip per
  metal: a mechanical tally of the conditions listed below (supportive
  minus against; the sign is the direction) → "will go up" in the green
  ink, "will go down" in the red ink, "no clear direction" in neutral,
  "no estimate yet" when nothing reads (the strip hides only when NEITHER
  metal could be read). En + fa copy (برآورد / بالا می‌رود / پایین
  می‌آید / جهت روشنی ندارد), arrow glyphs (icon + word + colour — never
  colour alone), RTL-safe, chips split the row at ≥sm and stack on
  phones. Current data renders exactly the owner's example shape:
  "gold will go down · silver no clear direction". Still a description of
  conditions, not advice.

### Housekeeping

- Bundle budget bumped 305.0/78.9 → 307.5/79.6 kB (Insights chunk
  304.25 → 306.68 kB raw / 78.75 → 79.19 gz): the verdict strip's
  component, arrow icons and 5 new copy strings × 2 locales. Entry
  untouched at 290.33/87.05.

## [2026-10-11] — Fresh traffic-light status hues, no dead white space in card lanes, and a gold-and-silver card that speaks at full size (owner follow-up)

Twenty-second round — owner feedback on the verdict colour scale, the
gold-and-silver card's typography, and a hard rule: "such gaps must never
happen".

### Changed

- **The verdict scale is now a proper traffic light.** The R30 status inks
  read as dark and saturated on light surfaces (near-black green, brown
  amber, burnt orange, maroon). All four retuned to fresh hues in BOTH
  themes, chosen by contrast script so every ink holds ≥4.5:1 on white, on
  `--color-currena-bg-light`, AND on each status chip's own tint:
  Stable/green `#256D29 → #137A39` (dark `#63C06C → #4ADE80`),
  Cautious/yellow `#9C5019 → #9C5D07` (dark `#FBB48C → #FBBF24` — a true
  yellow instead of peach), Stressed/orange `#C2410C → #C94908` (dark
  `#F0A04B → #FB923C`), Critical/red `#B92E2E → #CE2A2A` (dark
  `#FF8080 → #F87171`). The words, the meter segments, the status chips
  and the alert-card accents all share the tokens, so the ladder now reads
  green → yellow → orange → red at a glance; Stressed (orange) and
  Critical (red) are finally distinct hues at the group header too. The
  legacy `currena-*-deep` converter accents are untouched.
- **Gold and silver card: full-size voice + owner colour coding.** The
  card whispered at caption size — the "Supports / Works against" state
  words and every "how" description now speak at the same label size (14 px)
  as the alert cards' titles and consequence lines, and all five group
  headings share one heading style. The I17 "no green/red for
  supportive/against" rule is OVERRIDDEN here by owner instruction (the
  same sanctioned exception as the pattern lines): supportive rows take the
  green status ink, works-against rows the red, neutral/unknown stay stale —
  on the state words, the icons and the three group headings (never colour
  alone; the words stay).
- **Card lanes can no longer leave dead white space.** The owner: "there is
  a strange gap in right of the boxes … such gaps must never happen, either
  by expanding the two cards (if there are only two), or other methods."
  Root cause: `repeat(auto-fill, minmax(300px, 1fr))` reserves every track
  that FITS, not every track that's USED — two attention cards in a
  three-track row left a ~360 px dead column; auto-fit only collapses empty
  tracks and still can't stretch a short LAST row (the lone "Gold's price
  versus silver" row kept a dead half-lane beside it). New `.lane-fill`
  utility (flex-wrap + grow, 300 px basis for cards / 420 px for compact
  rows): every line — including the last — fills edge to edge, two cards
  split the row equally, a lone card takes it whole, and same-line cards
  equalise height (stretch). Applied to the indicator-card lane, both
  compact-row lanes (groups + pinned) and the Together connection lane.
  Verified measured 0 px right-gap on all eight lanes at 1280 px; 375 px
  stacks one per line with zero horizontal scroll.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budgets held with no bump
  needed (Insights chunk 304.25/305.00 raw, 78.75/78.90 gz — the lane
  classes replaced longer grid utilities). Entry untouched (290.33/296).
- Local QA (wrangler :8787 + vite :4174): hero words + meters read the new
  ramp in fa/en × light/dark; the two-card attention row measures
  539 px + 539 px = full lane; the three-row markets group ends with a
  full-width row; signals card greens/reds verified both locales; console
  and page errors silent. Screenshots in the session uploads.

## [2026-10-11] — Alignment sweep: one grid for headings and numbers, visible icons, a card for the biggest move, and predictions on the pattern line (owner follow-up)

Twenty-first round — four owner directives from annotated screenshots.

### Fixed

- **Price tiles (en + fa): every heading on one line, every number aligned.**
  Two root causes: (1) `<button>` vertically CENTRES short content (UA
  behaviour) — the tile's inner column floated down by (button height −
  content height)/2, so the name/price/change rows started at a different y
  per tile (oil/silver +12 px, bitcoin +1 px, gold 0). The column now fills
  the button (`h-full`), pinning all rows to the top in all four tiles.
  (2) The price was rendered inside `<bdi dir="ltr">`, which flipped the fa
  unit word ("۱۲۵٫۴۴ دلار" → "دلار ۱۲۵٫۴۴") inconsistently per tile; the
  price is now a plain `<bdi>` (auto direction) so the unit lands on the
  same side of the digits everywhere. The 7d/30d row became two cells —
  value slot (reserved width, tabular) then the day label OUTSIDE the ltr
  bdi — so the fa label order finally matches the n/a case and the numbers
  align across tiles. Needs-attention tile names got a fixed two-line slot
  (`line-clamp-2` + `min-h-[2.75em]`) so their big numbers align in a row.
- **Money panel: visible 64×64 icons.** The 16–18 px line icons are now
  40 px strokes inside a 64×64 tinted rounded box (48 px on phones),
  top-aligned rows, fixed 160 px label column; chip values moved to plain
  `<bdi>` (same unit-flip fix).
- **Biggest move has a proper container.** The stray hero line is now a
  card (surface + ring) with a kicker header (TrendingUp icon + title);
  the 30-day label sits OUTSIDE the ltr bdi (no more "نقطه۳۰ روز" squish).
- **The pattern line now predicts.** Under "الگوی همیشگی الان پیداست." /
  "Usual pattern showing right now." every active/partly connection card
  lists one clause per leg: fa «{name} بالا می‌رود» / «پایین می‌آید» /
  «ثابت است» (motion verbs; all leg names are singular) — en stays
  telegraphic "{name} rising / falling / steady" (no verb agreement, the
  phrases-corpus rule). Colour carries DIRECTION here by explicit owner
  instruction — the one sanctioned exception to "colour carries status":
  green `--color-status-normal` rises, red `--color-status-alert` falls,
  neutral for steady/level-only. Disagree/inactive cards stay honest and
  show no prediction. New `together.moves` copy block × 2 locales.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budget bump
  304.2/78.6 → 305.0/78.9 (documented in the gate script): Insights chunk
  304.44/305.00 raw, 78.76/78.90 gz — the moves corpus (12 strings × 2
  locales) plus the mover card and icon boxes. ENTRY untouched
  (290.33/296).
- Local QA (wrangler :8787 + vite :4174): measured nameY/priceY/change-row
  identical across all four tiles (1101/1126/1162); attention-tile numbers
  aligned in both region cards; money icons 64×64 (48 on mobile); moves
  clauses verified green/red/neutral in both locales; fa price text
  "۱۲۵٫۴۴ دلار آمریکا" one line in every tile; 375 px zero overflow;
  light + dark; console silent. Screenshots in the session uploads.

## [2026-10-11] — Vocabulary: Stable · Cautious · Stressed · Critical (owner wording)

Twentieth round — the owner picked the final verdict ladder. The Task-9
proposal (Low · Moderate · Elevated · Severe) is replaced by the owner's
own four words, which keep the intensity reading and add the familiar
risk-dashboard tone.

### Changed

- **Verdict words (en):** Low → **Stable**, Moderate → **Cautious**,
  Elevated → **Stressed**, Severe → **Critical**. Same plumbing as
  before: display words only — machine keys
  (`relaxed/cautious/stressed/alarmed`), API contract, meter segments
  and colours untouched.
- **Verdict words (fa):** کم → **پایدار**، متوسط → **محتاط**،
  بالا → **پرتنش**، شدید → **بحرانی** — natural inside the existing
  sentence templates ("۱ از ۵ حوزه در وضعیت بحرانی است: قیمت‌ها.
  بقیه در وضعیت پایدار هستند.").
- The About-dictionary entry for the four words (dead key kept for
  type parity) and the FA header wording note were updated to match.
- Test fixture: heroReason word table + inline assertions moved to the
  new words.

### Verification

- Gates: typecheck 5/5; tests 784/784; build ✓; budgets held —
  Insights chunk 302.23/304.20 kB raw, 78.33/78.60 gz.
- Local QA (wrangler :8787 + vite :4174): en + fa hero sentences, region
  cards, gauge words and meter aria ("Global: Stressed, step 3 of 4")
  all carry the new words; light/dark, 375/1280 widths, zero console
  errors, zero horizontal overflow.

## [2026-10-11] — Vocabulary: Low · Moderate · Elevated · Severe, and zero em dashes (owner request)

Nineteenth round — two owner directives: the verdict words
(relaxed/cautious/stressed/alarmed) should be more intuitive ("relaxed is
a bit off in this context"), and every em dash comes out of the copy.

### Changed

- **Verdict words (en):** Relaxed → **Low**, Cautious → **Moderate**,
  Stressed → **Elevated**, Alarmed → **Severe** — the standard
  intensity ladder (the same shape health/weather/risk dashboards use),
  grammatical in every sentence the generator builds ("1 of 5 areas is
  Severe: Prices. The rest are Low."). The machine keys
  (`relaxed/cautious/stressed/alarmed`) and the API contract are
  untouched: only display words changed.
- **Verdict words (fa):** آرام → **کم**، محتاطانه → **متوسط**،
  تحت فشار → **بالا**، نگران‌کننده → **شدید** — written natively into
  the existing sentence templates ("۱ از ۵ حوزه در وضعیت شدید است:
  قیمت‌ها. بقیه در وضعیت کم هستند.").
- **Em dashes retired from ALL user-facing copy:** 717 replacements
  across the four dictionaries (EN insights 324, FA insights 319, main
  EN 40, main FA 34). Mid-sentence "X — Y" became "X: Y" (colon, the
  natural elaboration mark); paired asides became parentheses; the
  missing-value dash became the locale word **n/a / ناموجود** (new
  `ui.na` + `common.na` keys). Numeric ranges keep their en dashes
  (2023–26) and minus signs keep U+2212 — those are typography, not the
  AI-tell dash.
- **Component sites:** price tiles, connection legs, alert rows and
  details ("Rule: … · now n/a"), the sr-only separators (", "), the
  Signals collapsed footing ("; "), the biggest-move line (dash
  dropped, flex gap already separates), currency options ("USD · name"),
  share text ("Currena (currena.ir)"), the calendar export name, the
  LED gold board's missing change % (locale n/a, threaded as a prop),
  RateDeltaChip and the index.html share cards (og/twitter/title).
- **Calendar data:** `data/insights-calendar.json` titles carried
  "ABS consumer price index — September quarter" (etc., 8 strings ×
  en+fa) — now colons; the fix reaches production KV at the next
  snapshot ingest, until then the LIVE page keeps the old data-side
  titles.

### Budgets

- Insights lazy chunk 304.01 → 302.20 kB (78.52 → 78.33 gz) — the copy
  pass shrank strings. Entry 290.33/296, 87.06/89.50 gz. Budgets held.

## [2026-10-11] — Prices tiles: one box size (owner follow-up)

Eighteenth round — the owner's screenshot of the new prices board showed
the four tiles with ragged bottoms (Silver 24px shorter than Gold) and
asked for "containers same width and height".

### Fixed

- **Equal-width, equal-height tiles:** the grid carried `items-start`
  (a left-over of the R10 row design where an open row must not stretch
  its neighbours), so every tile shrank to its own content height.
  Removed — grid stretch plus `h-full` on the tile and its button now
  gives the four containers identical boxes (the button still covers the
  whole tile for the click-to-details affordance). Widths were already
  equal (measured 264.5px ×4 at 1280) — the ragged BOTTOMS were the
  defect.
- **Retired the PB1 table-row CSS:** `.price-row` was the OLD anatomy
  (flex row, 12/16px padding, bottom divider). The R30 rewrite turned the
  class into a card hook but the unlayered rules kept WINNING over the
  card utilities — measured on production: `padding: 12px 16px`
  overriding `p-4`, plus a stray 1px bottom border inside every tile.
  Rules deleted; the class name stays as a stable DOM/test hook.

## [2026-10-11] — Insights roast fixes: colour roles, hero generator, card grid, copy (R30)

Seventeenth round — a third-party roast of the 11 Oct build (English,
desktop, light) graded the page B- with a ranked fix list. Six fixes
shipped; the two flagged "render defects" were reproduced in a real
browser at several widths and shown to be screenshot artifacts (no
`content-visibility` in the codebase; the Signals header and the yen card
render exactly once — the lone card now keeps its siblings' width instead
of stretching full-width, which is what the reviewer read as a duplicate).

### Fixed

- **Hero sentence generator (R30):** the reason line embedded the full
  gauge QUESTION — "1 of 5 areas is Alarmed: Are prices heating up?."
  (the reviewer's "?." punctuation error) — and summarised the tail with
  `Math.max`, claiming "The rest are Cautious" when three of four were
  Relaxed. New `groupShort` corpus (9 gauges × en/fa) feeds short names
  ("Prices"), and the tail word is the MODE of the remaining steps
  (ties resolve up): "1 of 5 areas is Alarmed: Prices. The rest are
  Relaxed."
- **Verdict meter:** the four-step scale now has four DISTINCT hues —
  relaxed green · cautious amber · stressed orange (NEW
  `--color-status-stressed` #C2410C/#F0A04B) · alarmed red; the meter's
  segments mirror the words exactly and the hero meter is visibly larger
  (`.verdict-meter-lg`). The hero gauges render ONE LINE PER GAUGE
  (short name → mini meter → step word) instead of inline chips that
  wrapped differently per region, and both verdict cards stretch to one
  height (no void under Australia).
- **Colour roles defined once:** red = needs attention ONLY. The Unusual
  tier owns amber (`--color-status-watch`): chip, card accent border and
  tint. Price position words ("expensive"/"cheap") are neutral ink again
  — colour carries STATUS, not direction (the roast: red "expensive" made
  gold, silver and oil all read as warnings). Money-panel icons are
  always the neutral context ink; red stays on the needs-attention word.
  Brand-adjacent captions/labels: the ink ramp compresses so EVERY ink
  is ≥ 7:1 (secondary #47525D light/#A9B5C5 dark, tertiary #4F5A66/#A2AEBC
  — captions measured 4.3:1 before).
- **Visible Global | Australia switch:** the lane switch rode below the
  fold; a second instance now sits on the first screen (both share one
  state; Global default per D7).
- **Card grid:** `auto-fill minmax(300px, 1fr)` (was auto-fit 260px) —
  no four-column five-line titles, lone cards keep sibling width, prices
  tiles share ONE anatomy (always-present 7d/30d row with the position
  word INLINE; gold/silver/Bitcoin changes derived client-side from the
  cached 10-year histories — the feed carries them for oil only; missing
  data renders "—"), Bitcoin's ratios collapsed into the one context
  line every tile uses.
- **Copy gaps:** the sentence-versus-number guard DROPS the consequence
  line when a needs-attention card's numbers read "typical" (wage growth
  and unemployment no longer say "sits in its usual range" under a fired
  rule); the Unusual cards no longer show a "Rule zone" no rule fired
  (zone ticks live on needs-attention cards and the details panel);
  "See all 1 indicators" → honest plurals ("Show 1 hidden indicator");
  heavy blue pills became quiet text buttons; money-panel lines name the
  actual driver ("Oil has left its usual range…" — no more templated
  "unusually prominent") with a fixed 176px label column so sentences
  align; footers show PUBLISHERS ONLY (`friendlySource`: "ABS", "RBA",
  "FRED", "GoldAPI") — raw series ids ("CPI_Q Trimmed Mean",
  "RES_DWELL_ST", "RBA F6") left the card faces and tags (they remain in
  the details panel).
- **Type hierarchy:** section headings step up to 19/700 (cards speak at
  14) — the roast: "section headings are the same size as card titles".
  Together chips' state words speak in status ink.

### Deliberately NOT restored

- The roast flags the missing "Before you act" box (R24) as unfinished —
  it was removed on the owner's explicit request earlier this build cycle
  and stays removed.

### Budgets

- Insights lazy chunk 301.21/78.06 → 303.98/78.50 kB gz; budget 302/78 →
  304/78.6 with the itemised justification in
  `scripts/check-bundle-budget.mjs`. Entry untouched (290.32/87.04).

## [2026-10-10] — Insights UI/UX audit: ink ramp, status-ink words, type hierarchy (R29, owner request)

Sixteenth round — the owner reported "everything is written with black
color" and "low typographic hierarchy, every heading is screaming". The
audit (docs/insights/08-uiux-audit-2026-10-10.md) found a REAL bug under
the first symptom, then fixed both.

### Fixed

- **ROOT CAUSE (A0/A1):** Tailwind 4 resolves ambiguous arbitrary values
  `text-[var(--type-label)]` / `text-[var(--type-caption)]` as **colour**
  utilities, not font sizes — `.text-\[var\(--type-caption\)\]
  {color:var(--type-caption)}` is invalid at computed-value time and, since
  it sorts after the colour utilities, it cancelled them and fell back to
  inherited primary ink. Net effect since I15: the type scale never applied
  (everything ~16px) and labels/captions rendered primary-dark — the
  owner's "everything is black". Fixed with explicit length hints,
  `text-[length:var(--type-label)]` / `text-[length:var(--type-caption)]`
  (128 occurrences across 18 files). The intended scale (label 14px,
  caption 12.5px) finally computes.

### Changed

- **Ink ramp (A2):** secondary ink #46505C → **#56616E** (6.3:1 — a step
  the eye can see); NEW tertiary grade **#6B7683** light / **#8291A5** dark
  for captions, timestamps, sources, disclaimers, kickers.
- **Status words speak in status ink (A3):** new `--color-status-watch`
  (#9C5019 light / #FBB48C dark) plus `stepToneClass` /
  `attentionToneClass` / `bandToneClass` helpers. Verdict words
  (Relaxed green · Cautious watch · Stressed/Alarmed red), hero gauge step
  words, "n of m need attention" counts (red while n>0, green when clear),
  and PRICE position words (expensive red · cheap green · typical neutral;
  indicator positions stay neutral per R5) now carry their status colour —
  always beside an icon, meter or number (G5, never colour alone). The
  7-day/30-day deltas stay deliberately neutral (R5/R9).
- **Typographic hierarchy (A4):** 800 weight reserved for numbers. New
  roles: `.type-section` 17px/700 (five section h2s + details-panel title,
  was 18px/800), `.type-question` 15px/600 (group questions, connection
  cards, pinned strip, was 14px/800), `.type-kicker` 11.5px/600 uppercase
  tertiary (GLOBAL/AUSTRALIA, NEEDING ATTENTION NOW, SEARCH/FILTER/
  DOWNLOAD, HISTORY, signals footing labels) with letter-spacing scoped to
  `html:not(:lang(fa))`; page h1 24px 800 → 700.
- Icon sizes from the previous round unchanged (23/17/16/18/22/24 set).

### Verification

- Gates: typecheck 5/5 · tests 784/784 · budgets entry 290.32/296,
  Insights 301.21/302 (length hints +0.9 kB, under the cap).
- Browser: computed styles (tertiary @ 12.48px; "expensive" red @ 12.48/700;
  "Stressed" red @ 25.6/800; kickers 11.52/600); en/fa × light/dark ×
  1280/375 screenshot pass; 375px overflow clean; console silent.

## [2026-10-10] — Insights imagery: lucide-react icon language (owner request)

Fifteenth round — the owner asked for real iconography on the Insights
page. **Lucide** (`lucide-react`, ISC licence — free for commercial use)
chosen: it tree-shakes to per-icon ESM modules, and its 24-grid stroke
style matches the page's existing hand-drawn AreaIcon/StatusChip language
exactly (16px stroke icons, `currentColor`, aria-hidden).

### Added

- Ten named, tree-shaken lucide icons replace thirteen text glyphs:
  `Wrench` (was 🛠 Tools button), `Search` (was 🔍, in the Tools search
  field AND the no-matches empty state — now inside a soft circle),
  `CalendarDays` (was 📅, both .ics buttons), `Download` (was ⬇ CSV),
  `Coins` (new section mark on the prices strip), `Activity` (new section
  mark on "What the signals say"), `ChevronDown` (was ▾/▸ on all three
  disclosures — rotates -90°/90° when closed so it points along the
  reading direction in BOTH LTR and RTL, with
  `motion-reduce:transition-none`), `X` (was ✕ panel close), `Star` (was
  ★/☆ watchlist pin — `fill-current` when pinned), `TriangleAlert` (was
  ⚠️ in the error and from-cache banners).
- The Money-panel rows keep their hand-drawn area icons and the ↗ ↧ ⓘ
  glyphs stay as text: three candidate header marks (Money/Together/
  About) were consciously SKIPPED so the icon set stays at ten and the
  cost small — Money rows already carry icons; Together and About are
  quiet collapsed sections (R25/R7b).

### Changed

- Bundle budget: Insights lazy chunk 300/78 → **302/78** raw kB
  (293.77/74.81 → 300.54/77.51 measured; +6.7 kB raw / +2.7 kB gz for
  the ten icons, itemised in `scripts/check-bundle-budget.mjs`). The
  ENTRY chunk is untouched (290.32/87.05 vs 296/89.5) — every icon lives
  in the lazy Insights route.

### Verification

- typecheck 5/5; tests 784/784; budget green at the documented numbers.
- Browser QA (local Worker seeded from the production snapshot + vite
  dev): en/1280 light — 7 lucide SVGs in the default view, zero emoji
  glyphs left, Tools menu icons verified visually; signals disclosure
  chevron measured `rotate: -90deg` closed → `none` open, card opens;
  fa/375 RTL + dark — chevron measured `rotate: 90deg` when closed
  (points along RTL reading order), Activity mark geometrically at the
  RTL start of the title, no horizontal overflow, zero console errors.

## [2026-10-10] — Insights: remove the "Before you act" box (owner request)

Fourteenth round — a direct owner request to drop the "Before you act"
caution aside (the R24 footer box shipped earlier the same day) entirely.

### Removed

- The footer "Before you act" `<aside id="before-you-act">` from the
  Insights page (en + fa), the "Before you act ↓" pointer button from the
  Signals header, the `jumpBeforeYouAct` scroll/focus/highlight handler,
  and the `beforeYouActTitle` / `beforeYouActPointer` / `beforeYouAct`
  copy keys from both locales. The Signals disclosure, the merged card,
  the collapsed summaries and "About this data" are untouched — the page
  now flows "Next up" → "About this data" → site footer.

### Verification

- typecheck 5/5; tests 784/784 (the removed en/fa four-points parity test
  no longer applies); bundle budget green (entry 290.32/87.06 vs 296/89.5,
  Insights 293.77/74.81 vs 300/78 — the box removal shrank the chunk).
- Browser QA on a local Worker (production snapshot seeded) + vite dev:
  en/1280 and fa/375 — zero console/page errors, no horizontal overflow
  (scrollWidth == clientWidth), `#before-you-act` absent from the DOM,
  no pointer button anywhere, Signals expand/collapse still works, RTL
  and dark/light unaffected. Web-only change (copy + components); the
  snapshot computation is untouched, so no ingest-then-deploy ordering
  applies.

## [2026-10-10] — Insights UX round 2: the signal-first density pass (R1–R28)

Thirteenth round — the owner's second UX spec
(`docs/insights/06-ux-round-2-spec.md`, decisions D1–D13 incl. the
2026-10-10 revision) built end-to-end: a few signals large, the rest quiet,
and every sentence-versus-number contradiction eliminated. Build ledger with
per-block evidence: `docs/insights/ROUND2-LEDGER.md`.

### Added

- **R5 two-tier status model** — `tierOf` pure function: needs-attention
  (a published rule fired; internal id stays `warning`) > unusual (top/bottom
  10% of the indicator's own 10-year range, 30-obs percentile floor) >
  normal; context/stale/unavailable unchanged. The user-facing word "Alert"
  is retired everywhere (chips, filters, counts, hero, CSV); fa gets
  نیازمند توجه / غیرعادی.
- **R11 "What it means for my money" (slim)** — ≤4 lines chosen by the worst
  tier among six life areas (petrol, home loan, savings, shop prices,
  overseas money, jobs), hedged sentences keyed area×state, 1–2 value chips
  linking the cards, calm fallback line. No advice wording, both locales.
- **R15 Tools menu** — one disclosure in the page header holding search,
  status filter, keyboard-shortcuts help, .ics and CSV download; the inline
  FilterBar is deleted and the "Keyboard: / j k" hint line removed; the menu
  closes on Escape/outside click and returns focus; counts describe the
  current lane only.
- **R7b collapsed evidence lanes** — Together and Signals start collapsed
  with a one-line summary each (per-connection chips / per-metal lines),
  Show/Hide disclosures with aria state, localStorage remember (fail-open to
  collapsed), pill/hash/hero links expand via `expandToken`. Signals ships
  the R24 "Before you act ↓" pointer in its header.
- **R24 footer "Before you act"** — rendered exactly once in the footer
  (`id="before-you-act"`, always visible, outside any collapsible); the
  Signals header pointer scrolls + focuses + briefly highlights it
  (reduced-motion aware).
- **R25 quiet "About this data"** — flat section, collapsed by default, with
  the FRED notice, the source credits and the general-information line always
  visible outside the toggle; CSV button moved to Tools; print auto-expand;
  exactly ONE Sources block.
- **R26 merged signals card** — the two near-copy cards become one: the four
  shared conditions listed once, per-metal footing rows, silver-only
  industrial condition separate, neutral "Supports / Works against" icons and
  words (no ✓/✗, no green/red), 30-day speed only when data exists.
- **R27 stat-chip connection cards** — arrows removed; each leg renders as a
  stat chip (name, value WITH unit, state word); the right-now line is one
  truthful clause; the "Evidence: to verify" placeholder never renders (data
  attribute + the section-level quiet note instead); dead `evidenceToVerify`
  copy key deleted.
- **R28 sentence-versus-number guard** — band-quoting lines are computed from
  the rule + live value (`bandPositionOf`/`consequenceLine` with
  `{bandPos}/{bandLabel}` tokens); the R28 known bad pairs (3.4% vs the Fed's
  2% goal, 3.9% vs the RBA 2–3% band) are regression-tested to fail; fa band
  words render natively (درون/بالای/زیر). Fixed a real bug found by the
  guard: a two-sided band value fell through to the one-sided branch and
  read "below" while sitting INSIDE the band.
- **38 round-2 guard tests** (`apps/web/src/components/insights/round2.test.ts`)
  over the pure layer: hero-reason full step matrix + contradiction guard,
  tier precedence/floor/stale, attention-tile ordering, group visibility,
  money-panel selection + advice-word ban, date formats, units coverage,
  code-pattern scan, counts consistency, mergeSignals duplication, evidence
  discipline, band-position math. Suite 747 → **785**.

### Changed

- **R1/R7/R16/R19 page order & defaults** — Global lane first (hero + default,
  swap toggle removed); per-group signals-first collapse ("See all {n}"
  behind needs-attention + unusual + top-up-to-3); Next up moved below the
  indicators; Signals pill added to the sticky band; pills expand their
  collapsed section.
- **R2/R3/R4 hero** — verdicts keep meters with text alternatives
  ("Global: Stressed, step 3 of 4"), gauges, a fixed-table reason line that
  cannot contradict the gauges, up to 3 needs-attention tiles with large
  unit-ful numbers per region, and one biggest-move line that always carries
  its "unusually large for this indicator" reason (the beige callout box is
  gone; stale items hard-excluded).
- **R6 needs-attention face** — every needs-attention card shows
  "Rule: … · now …" on the face; the 10-year position bar shows only on
  unusual cards.
- **R8/R9/R10 anatomy** — consequence lines never truncate; sparklines render
  one neutral tone on Insights (LiveRates untouched); the prices strip is
  four identical tiles (Brent, gold +A$, silver, Bitcoin) with the BTC
  ratios as one small context line — copper and iron-ore move into the
  indicator lanes (`copper-usd` definition group `prices-board` →
  `growth-health`; the R10 "calm is returning" claim is scrubbed from the
  gold lines in both locales and regression-banned).
- **R12/R13/R14/R20 polish** — English dates become month-name form
  ("Oct 10, 2026") with no seconds in "Data as of"; every displayed number
  carries a unit (audusd US$ per A$, home values "index" after verifying the
  ABS series, terms-of-trade "index"); opaque names replaced
  ("Underlying inflation") and source codes audited out; `--type-number`
  raised 1.3rem → 1.45rem so tile/price values compute 1.45× the label role
  (spec floor 1.4×).
- **R21/R22 a11y & Persian parity** — unique "Details: {name}" accessible
  names on every card control; all count interpolations render locale digits
  (fa shows ۲ از ۵, not 2 از 5) including the new collapsed summaries;
  Persian commas in the Together summary; logical properties only in new CSS.
- **R23 budgets** — entry untouched (290.32/87.05 vs 296/89.5); the Insights
  lazy chunk consciously bumps 280/72 → **300/78** (296.12/75.40 measured)
  with the itemised justification in `scripts/check-bundle-budget.mjs`: the
  tier model + money panel + Tools menu + the bilingual corpus growth minus
  the deleted FilterBar.

### Verification

- Gates: `pnpm -r typecheck` 5/5; `pnpm -r test` **785/785**; web build green;
  bundle budgets green.
- Browser QA (agent-browser against the built SPA + wrangler dev seeded with
  the production snapshot): en/fa × 1280×800 / 375×812 × light/dark —
  `scrollWidth == clientWidth` everywhere (the only inner "overflows" are the
  scrollable pill row and the position-bar fill, both by design), zero
  console errors, zero "Alert" words, 4 rule lines on 4 needs-attention
  cards, both evidence lanes collapsed by default with correct summaries,
  the merged signals card with zero ✓/✗, one footer "Before you act" with a
  working pointer, one Sources block, Tools keyboard pass (open, Escape,
  focus return), pill-expand verified, R20 computed ratio 1.45.
- Data note: `copper-usd`'s definition group change is render-time only —
  the snapshot computation is untouched, so this deploy does NOT require an
  ingest-then-deploy ordering.

## [2026-10-10] — I19 the staleness false-alarm fix: govt-interest-revenue's BEA release lag

Twelfth round — the scheduled post-I18 verification pass (per
NEXT_SESSION_PROMPT §4) found the live snapshot carrying **one stale
reading**: `govt-interest-revenue` (US federal interest paid ÷ receipts),
`asOf 2026-04-01`, aged 192 days — one day past the 190-day quarterly
grace (`GRACE_DAYS.quarterly`).

Verification showed the data is NOT late: FRED itself still lists the
**2026-04-01 (Q2) observation as the latest that exists** for both
`A091RC1Q027SBEA` and `W006RC1Q027SBEA` — BEA publishes the Q2 obs with
the advance estimate (~Jul 30) and it stays latest until the Q3 advance
(~Oct 29-30) adds the Jul-1 obs. The 190-day quarterly grace assumed
quarter data arrives faster than BEA's release calendar actually delivers,
so every October this series would honestly-but-falsely read `stale` —
the same obs-date-vs-release-date reality the I15 wave fixed for the ABS
quarter-start items (215d) and Brent (12d).

### Fixed

- **`packages/insights/src/definitions.ts`** — `govt-interest-revenue`
  gets `staleAfterDays: 215` (BEA NIPA obs date from Q-01; ages up to
  ~212d between advances; 215 mirrors the ABS quarter-start discipline).
  The reading returns to `normal` (the value and 10-year percentile are
  unchanged) once a re-ingest recomputes the snapshot.
- **`packages/insights/src/definitions.test.ts`** — the I15
  freshness-overrides test asserts the new override verbatim alongside
  the other obs-date-reality adjustments.

### Verified

- Gates at HEAD: typecheck 5/5, tests **747/747** (core 183 · scraper 67 ·
  insights 193 · api 119 · web 185 — the new assertion lives inside the
  existing I15 overrides test).
- Web build + budget: entry 290.12/86.99 vs 296/89.5; Insights chunk
  270.02/69.50 vs 280/72 — held without a bump.
- Production health + 41 readings before the fix; scheduled ingest runs
  green (run 7 Oct-8, run 12 Oct-9; the failed run 11 dispatch was the
  known KV daily-write-cap 429/10048 — auto-recovered, no data impact);
  daily accrual points present for Oct-8 AND Oct-9 (btc bootstrapped 2
  points, copper/gold/silver carrying their monthly base + daily rows) —
  the 2026-10-15 seven-day-change milestone stays on track.

## [2026-10-08] — I18 the mobile answer-line fix: 375px horizontal scroll removed

Eleventh round — a wrap-up audit of the live I17 deploy caught one real
defect the I17 QA pass had missed: on the Insights page at 375px (and
every width where the L2 header row runs out of room, 320–414px), the
whole document gained ~37px of scrollable horizontal overflow. The
page could be swiped sideways into blank space.

Root cause (found by bisecting the live DOM): the group-header answer
line in `routes/Insights.tsx` was `<span className="min-w-0 flex-1">`.
`min-w-0` lets the flex item shrink *below the min-content width of its
own text* — on a 343px content column the verdict meter (120px) + step
word + count text left the answer only ~38px, and its longest word
(81–90px at caption size) bled out as *scrollable* overflow that
propagated through every `overflow: visible` ancestor up to
`<html>`. The measured chain matched exactly: span overflow 43/53px →
section 386/396 → route container 412 → 37px of page scroll. (RTL/fa
never showed it because right-to-left overflow at the left edge does
not extend `scrollWidth` — which is also why the I17 QA, run in fa
first, could honestly record "no overflow" and miss the en/LTR case.)

### Fixed

- **`apps/web/src/routes/Insights.tsx`** — dropped `min-w-0` from the
  answer span. With the default `min-width: auto` the flex item keeps
  its longest word as its floor, so `flex-wrap` moves the answer to
  its own full-width line on narrow phones (readable, no squeeze) and
  keeps it inline on desktop exactly as before. Desktop layout is
  unchanged (the row has ≥ 81px spare there). Verified live by
  toggling the class off in the production DOM: `scrollWidth`
  412 → 375, horizontal scrollability 37px → 0.

### Verified

- Web typecheck clean; web tests 185/185 (total 747/747 unchanged —
  no behavioural test touched; the change is one utility class).
- Production re-check after deploy: en/375 `scrollWidth = clientWidth`
  (0 scrollable), fa/375 clean, all other routes (`/`, `/history`,
  `/calculator`, `/receipt`, `/settle`, `/about`) 375/375, zero
  console/page errors, the v2 sections (Together + signals) untouched.
- Other `min-w-0` usages audited: CompactRow truncates (clips, safe);
  AlertCard / DetailsPanel / NextUpStrip sit in ≥260px boxes where the
  longest word fits; none of them measured as overflow sources.

## [2026-10-08] — I17 the v2 wave: "Together" connection cards + "What the signals say"

Tenth round — the owner granted full approval ("nothing from spec must
remain"), so the two deliberately-deferred spec surfaces ship now: **T1**
(the "Together" connection cards, UI spec Part 6 v2) and **S1–S3** (the
"What the signals say" cards, v2-gated — the wording-review gate is
satisfied by the owner's approval; the `SIGNALS_ENABLED` flag the spec
mandates exists in `config.ts` and ships **true**, one flip from off).

Everything computes from the snapshot the page already holds — no ingest
change, no snapshot-format change, so the Worker read-side contract and the
ingest-then-deploy order rule are untouched (a plain Worker deploy
suffices; a dispatch still ran as smoke).

### Added

- **`packages/insights/src/connections.ts`** — the six T1 connections in
  spec order (real-yields/gold see-saw, dollar/gold/oil, oil → expectations
  → 10y costs, copper-gold/China-PMI/M2, iron-ore/terms-of-trade/AUD,
  RBA-rate/home-loan/household-debt). Each leg gets a direction (per-leg
  change30d thresholds in the definition's own units) + a level (the F3
  position bands), and a uniform state rule over polarity-adjusted leans:
  `active` (every leg in the relation's configuration) · `partly` (some
  lean, none oppose) · `inactive` (too quiet) · `disagree` (leans point
  both ways — the live see-saw: real yields 99.8th pct AND gold 92.5th pct)
  · `unknown` (a stale/absent leg — the ST2 honesty discipline). Inverse
  connections carry a `polarity: 'inverse'` marker (the first leg vs the
  rest) so the see-saw reading is correct in both directions.
- **`packages/insights/src/signals.ts`** — the S1/S2 card logic: five gold
  conditions (real yields, 5y5y expectations, stress STLFSI+NFCI, the
  dollar basket, the metal's own footing: position + 30-day speed with the
  honest position fallback while the daily history accrues), silver's sixth
  industrial-demand condition (China PMI + copper-to-gold, always tagged
  "mixed"), the lean (`≥4 supportive → mostly supportive`, `≥4 against →
  mostly unsupportive`, else `mixed` — the count line reads "n of m
  conditions met"), and the three plain checks. Live at ship time: gold
  2/5 mixed, silver 3/6 mixed.
- **Web: `Together` + `ConnectionCard`** — the section below the prices
  board: state chip (SVG icon + word, neutral inks — pattern presence is
  information, never advice), leg chips with live values that open the
  details panel (44px targets, focus discipline inherited), relation
  arrows that mirror in RTL (one CSS flip rule), the plain relation
  sentence, the computed right-now line, and the spec-mandated "evidence:
  to verify" tag on every card (the owner confirms evidence per card —
  none confirmed yet, so no card claims reliable/mixed/weak).
- **Web: `Signals` + SignalsCard (S1–S3)** — the "What the signals say"
  section below Together (scroll region under the Together pill): lean
  chip + count line, the three plain checks (10-year position, usual
  drivers, 30-day speed with the honest "Measuring" line), the checklist
  grouped into the two sides ("Usually supports {metal}" / "Usually works
  against {metal}" / a muted neutral tail), and the fixed **before you
  act** box (S3) always visible, never behind a click. No green for
  supportive, no red for unsupportive — icons + words, per the S1 note.
  The S3 dealing-costs point uses inflected forms ("buying", "selling",
  "buyers") so the acceptance-test regex `\b(buy|sell)\b` still passes
  while keeping the spec's mandated meaning; the Persian copy avoids bare
  «خرید/فروش» the same way.
- **Copy: bilingual corpus for both sections** — six connections × (name +
  relation + 5 state lines + leg labels) and both signals cards (6
  conditions + the before-you-act box + the checks) in EN + native FA
  (nav pill «ارتباط‌ها»; telegraphic leg phrases — `{name}: {level} and
  {direction}` — so no verb agreement can break across languages).
- **`SIGNALS_ENABLED`** in `config.ts` — the spec's feature flag, shipped
  `true` with the I17 approval note; `false` hides the whole section.

### Changed

- The sticky section nav (P1) gains the **Together** pill — five sections
  now (Status · Prices · Together · Indicators · About), the spec's v2
  list completed.
- Insights lazy-chunk budget 240/64 → **280/72 kB** (measured 270.01/69.50):
  the v2 corpus + components + the connections/signals logic joining the
  lazy route. Entry chunk untouched (290.12/87.76 vs 296/89.5). The bump
  is itemised in `scripts/check-bundle-budget.mjs`.

### Verified

- Gates: typecheck 5/5 · tests **747/747** (core 183 · scraper 67 ·
  insights 193 = 168+25 · api 119 · web 185 = 174+11) · budgets held.
- The shipped live states are pinned in tests (the 2026-10-08 snapshot:
  disagree/disagree/active/active/partly/disagree; gold 2/5 mixed, silver
  3/6 mixed).
- Browser QA (agent-browser + VLM, en/fa × 1280/375): both sections render,
  leg chips open the details panel with focus trapped, Escape closes, the
  Together pill scrolls, arrows mirror in RTL, zero console/page errors,
  no buy/sell wording (EN regex + FA pattern), no horizontal overflow.
- Production: Worker deployed from the I17 HEAD, dispatch smoke green,
  `/api/insights` unchanged (41 readings), the two new sections verified
  on https://currena.ir (see docs/DEPLOY.md §I17).

### Compliance notes for the owner (standing)

- The signals cards describe conditions and leave every decision to the
  reader; the before-you-act box is fixed copy per the spec. The S3 note's
  "qualified Australian financial-services review before launch" remains a
  standing owner-side item — the wording shipped is the spec's own.
- Evidence tags stay "to verify" until the owner confirms each
  connection's evidence (spec T1 note) — no tag claims reliability today.
- Reminder: rotate the GitHub + Cloudflare tokens that transited chat.

## [2026-10-08] — I16 the daily-accumulation fix: same-day live refresh + the btc bootstrap

Ninth round — a post-I15 production verification pass (the NEXT_SESSION_PROMPT
mission: ingest green ✅, 41 readings ✅, backtest re-run ✅) found the I15
accumulated-daily mechanism broken in two ways, both now fixed at the root:

- **Cross-card price inconsistency (live in production):** the seeded price
  rows kept the FIRST-of-day price while the unseeded gold-silver ratio
  carried the LIVE one — same-date cards disagreed (gold 4136.20 ÷ silver
  60.17 = 68.74 on the board vs a 69.97 ratio reading, both stamped
  2026-10-08). Root cause: `withLivePoint` refused ANY same-date live point,
  conflating "lagging live source" (history strictly newer — keep history,
  correct) with "same day, earlier run" (this run's fetch is the day's
  FRESHEST observation — must replace). Same-date points are now replaced,
  so every card stamped a date agrees on one price set.
- **The btc-usd accumulation could never start:** `buildHistoryFile`
  refused single-point series, so a row with no monthly base (btc has none
  by design) never persisted its first daily point — every run rebuilt a
  single live point, the seed stayed empty forever, and the data spec §3's
  "7/30-day changes from your own stored daily snapshots" would never
  appear on the Bitcoin row. New `minPoints` option (default 2 — the
  live-point cards gold-btc/silver-btc/gold-aud keep their honest no-key
  404); the ingest passes 1 for the accumulated-daily rows so the first
  point IS the bootstrap.
- **gold-silver now rides the accumulation too** (SEED_IDS gains it —
  derived.ts already merged its seedHistory; the ingest's read list was the
  missing half).

Verified end to end with a 3-run/2-day simulation against
`InMemoryInsightsStore` (the ingest write-loop semantics verbatim): day-1
bootstrap writes btc's 1-point key, the same-day re-run replaces the moved
prices and the board/ratio agree exactly, day 8 shows btc change7d = +1.84%.
A worker deploy is NOT needed — the fixes live in the ingest runner
(`@currena/insights/adapters`), which only GitHub Actions executes; the
Worker/SPA import only definitions/gauges/store types. Tests 708 → **711
green** (+3: same-day replace ×2, minPoints bootstrap).

Also noted: GitHub Actions schedules the 04:20 UTC cron ~7 h late (the
runs execute ~11:10–11:30 UTC) — still inside the fresh write-budget window
(the counter crosses 1,000 around 18:30–19:00 UTC), so no action beyond
documentation. `docs/insights/BACKTEST.md` regenerated at this round: the
I15 freshness fix visible in the diff (us-cpi-yoy `stale` → `warning`).

## [2026-10-08] — I15 the owner-spec wave: question gauges, the prices board, and the details panel

Eighth round — the uploaded 2026-10-08 owner specs (`01-insights-ui-ux-instructions.md`
+ `02-insights-data-api-spec.md` + `dollar_basket.py`) implemented end to end:
the data/API spec's new indicators, the Currena dollar basket, per-series
freshness limits and question gauges; the UI spec's v1 blocks (hero verdict
meters, prices board, indicator lanes, compact rows + alert cards, the
side-panel/bottom-sheet details, states, notices). The v2/v2-gated blocks
(T1 connection cards, S1–S3 signals) deliberately NOT built — the spec says
wait. Leftover backlog closed first: #38 Settle multi-tab storage sync +
#29 web-test remainder (rate-history/recent-pairs/display/parity).
Tests 634 → **708 green** (core 183 · scraper 67 · insights 165 · api 119 ·
web 174).

### Added

- **New indicators (11)** — `fed-target` (FRED DFEDTARL/U midpoint, shown as
  the 25bp corridor "3.50–3.75%"), `ecb-dfr` (ECB Data Portal DFR), `us-cpi-yoy`
  (CPIAUCSL 12-month change), `nfci` (Chicago Fed NFCI), `dollar-basket`
  (the Currena dollar basket — `dollar_basket.py`'s recipe ported to
  `src/basket.ts`: DXY weights, 50.14348112 scaling, selftest transplanted),
  `eur-usd`, `au-home-loan` (RBA F6 FLRHOOTA by Series ID — the stable
  identifier; venue-verified 6.21%), `au-wage-growth` (ABS WPI + the new
  **below-aux rule** comparing wage growth with CPI), `au-rent-yoy` +
  `au-petrol-yoy` (ABS monthly CPI Rents/Automotive-fuel — series identified
  by data signature + published-figure cross-checks), `btc-usd` +
  `copper-usd` (gold-api BTC/HG live prices; HG converted to USD/mt to join
  the World Bank history). **`dollar-broad` retired** (DTWEXBGS lags ~5d
  upstream; the basket replaces it). TGJU retired from Insights (unverified
  licence) — gold now from gold-api XAU like silver; the TGJU cross-check
  row retired with it (Bitstamp remains the BTC check).
- **Question gauges** (`src/gauges.ts`) — the spec §4 regime: each lane
  group IS a gauge (share of members in alert → steps 1–4), a region's
  verdict = rounded average of gauge steps escalated when any gauge sits at
  step 4; `summarizeByGauges` writes the same wire shape the old flat-share
  summary did, so /admin and the CSV export agree with the hero by
  construction. 16 global + 13 Australian voting members, exactly the
  spec's v1 lists.
- **Per-series freshness limits** (`staleAfterDays` on definitions, data
  spec §3) — Brent 12 (the EIA weekly-batch false alarm, fixed at the
  root), NFCI 14, ECB 7, Fed 5, basket/EUR 4, metals/BTC/copper 2, F6 70.
  Spec numbers that assumed RELEASE-date aging were adjusted to the
  engine's OBS-date aging with documented reasons (us-cpi 75, ABS monthly
  95, WPI 200, ABS quarter-start items 215 — the latent Oct-8→28 window
  the 190d quarterly grace false-alarms in).
- **moveScore (Block H3)** — the big-mover z-score at ingest ((latest
  change − mean)/std over the 10y window; 30d basis for dailies, 1-period
  for slower series; ≥30-change floor; stale items never carry it) + the
  ONE hero callout replacing the "biggest 30-day changes" list.
- **I15 UI blocks** — `HeroBlock`/`VerdictMeter` (H1: four-step segmented
  meters + verdict word + plain sentence + "n of m in alert" + alert-chips
  by name H2 + the Australia-first order with the swap setting),
  `NextUpStrip` (H6: next-3 events + full calendar grouped by month with
  merged duplicate titles + Gregorian hover), `PricesBoard` (PB1–3: six
  price rows with units, position words, as-of dates, gold's USD+AUD line,
  the Bitcoin context ratios), `LaneSwitch` (L1: remembered
  Global|Australia, thumb-reachable sticky bar on phones), `AlertCard`
  (F1: accent border + tint, sparkline) + `CompactRow` (F2), `DetailsPanel`
  (F5: side sheet on wide screens, bottom sheet on phones, focus trap +
  Escape + focus return + scroll lock + deep links), the sticky section
  nav (P1: Status/Prices/Indicators/About with scroll-spy), SVG status
  icons (G5), the position-word bar with end labels + alert-zone tick
  (G9/F3), design tokens + four type roles + 7:1 secondary ink (G2/G3/G4),
  the FRED® notice + attribution lines (N1), ONE disclaimer line (N2), and
  `Data as of {date}` with the daily-snapshot tooltip (H4).
- **Consequence lines (F4 + data spec §6)** — state-keyed
  (`highRising/highEasing/typical/low/jumping`) plain-language lines with
  hedged wording, stated positions, ≤15 words: 39 indicators × 2 languages
  in the copy corpus; `consequenceLine()` picks by position band + 30-day
  direction with oneLiner fallback.
- **Backlog closes** — #38 Settle multi-tab `storage` sync
  (lib/settle-storage.ts, the alerts-store pattern; +9 tests) and #29's
  remainder (rate-history +17, recent-pairs +9, display/parity +6).

### Changed

- **Groups are questions now** (I15 restructure): borrowing-costs,
  prices-heat, market-stress, dollar-strength, growth-health,
  prices-board (not a gauge), au-inflation-rates, au-households,
  au-trade-currency — replacing the asset-class groups; brent/gold/silver/
  copper/btc/gold-btc/silver-btc live on the prices board (Brent keeps its
  25%/13w rule for its own row but is not a gauge member), iron-ore stays
  a trade-gauge member AND rides the prices board.
- **Copy corpus rewrite** — plain names first (F6: "What the US government
  pays to borrow for 10 years"), technical tags as small `ticker` labels
  (G8, isolated dir="ltr"), the old five-section detail panel reordered
  life-effects-first (F5), status word Warning→Alert (en) / هشدار (fa,
  kept), and every ui string for the new sections — en source of truth,
  fa native + shape-checked (1044 ZWNJ, Persian digits, no buy/sell
  wording per acceptance test 6 — the disclaimer reworded to match).
- **Ingest seeds accumulated daily history** for the live-priced rows
  (gold/silver/btc/copper) from the stored KV histories so 7/30-day
  changes are measurable (data spec §3 note); first runs degrade honestly
  (no changes until history accrues).
- **RBA parsing by Series ID** (parseRbaTableCsv seriesId option) — F6's
  FLRHOOTA matched the way external parsers do it; the title-match path
  stays for F1.1/F2/E2.

### Fixed

- **The Brent false-alarm** (production showed it stale at 2026-09-29 with
  data 8 days old): the 12-day freshness limit replaces the 3-day daily
  grace — EIA publishes daily Brent in weekly batches, "as of {date}" says
  so on the row (PB3).
- The ABSENT FRED notice (spec Block N1: "Check that the notice is present
  today. The screenshot shows no such notice") — now prominent in
  About-the-data with the terms link.
- Chart tick labels raised to caption size (F5) and the SR data table with
  them; the tooltip renders at the caption role too (G3: no visible text
  below the caption).

### Budget

- **Insights lazy chunk 133.85/38.88 → 235.80/61.92, budget 134/39 →
  240/64** — the bilingual corpus doubled (41 indicators × plain names +
  detail fields + state-keyed consequence lines × 2 languages), the
  side-panel/bottom-sheet architecture, the prices board + meters + lane
  switch, and the GAUGES table joining the chunk. ENTRY chunk untouched
  (290.12/87.76 vs 296/89.5) — the money page is protected. Justified
  above; the gate stays enforced in CI.

## [2026-10-08] — I14 rate-alerts wave

Seventh round of the day — the sandbox was RESET between rounds (the whole
`/home/z/currena` working copy wiped; re-cloned at `a6df82c` with a fresh
owner token, remote scrubbed). A full production QA matrix ran FIRST
against the live I13 Worker `69550e36` (entry asset byte-matched the last
recorded build): 30 insight cards, conversion 100 USD → 26,320,000 IRR,
CSV/ics/filter/shortcuts/deep-link all verified en/fa × desktop/375 ×
light/dark, zero console errors, zero overflow — one VLM contrast flag on
the converter's «از/به» labels REFUTED by measurement (6.1:1 AA). This
wave then ships the strongest remaining user-facing feature from the
I13 hand-off: **rate alerts**.

- **`@currena/core` alerts module** — the persisted alert shape (pair,
  direction, threshold, one-way `triggeredAt`/`triggeredRate` stamps),
  strict `parseRateAlerts` (unknown entries dropped, cap 20 — recent-pairs
  fail-open discipline), and the pure `crossesAlert` test: inclusive at the
  boundary (">= 280,000" fires AT 280,000), never re-fires once stamped.
  Platform-free like settle/split; +11 core tests.
- **Web alerts store** (`lib/alerts.ts`) — the browser side in
  snapshot-store's external-store shape (`useSyncExternalStore`): every
  surface (section row badge, dialog list, evaluation engine) reads ONE
  live state; `currena:rate-alerts` + `currena:rate-alerts-seen` in
  localStorage; **cross-tab `storage`-event sync** (the pattern BACKLOG #38
  wants for Settle, proven here first); +12 web tests including the
  storage-event suite.
- **App-wide evaluation** (`useAlertEvaluation`) — mounted in the App
  shell so alerts are checked on EVERY route, not just the converter:
  each snapshot-store emission (boot hydration, fresh fetch, degraded
  rung) re-evaluates every waiting alert through the same
  `liveRateView` honesty gate (unresolvable pairs never false-fire).
  Crossings stamp + persist (reload keeps the ✅ state, no re-fire —
  verified live) and feed a 6s toast (pair + threshold, "+N more" tail).
- **Converter section row + `A` shortcut** — the one-tap door between the
  converter card and the pair chips: 🔔 title, live waiting/triggered
  counts (Persian digits in fa), an unseen-triggered badge with the
  one-way seenAt stamp (a reload never re-nags), and the `A` kbd pill
  (desktop-only, the same guard family as Insights' / J K — typing,
  modifiers and open dialogs all opt out).
- **AlertsDialog (lazy chunk, 7.00 kB / 2.59 kB gz)** — create + review +
  delete in one overlay (ResultPopup a11y pattern: role=dialog,
  aria-modal, Escape, backdrop click, initial focus). The create form
  pre-fills the converter's current pair, mirrors the current live rate
  under the target input, parses Persian digits + thousands separators
  (AmountInput's parser), and an above/below segmented control (radiogroup).
  List rows are honest per alert: ⏳ waiting (with the live rate) or
  ✅ triggered (rate + relative time). The footer says what alerts ARE:
  "Checked while Currena is open — no background notifications" (fa:
  «هشدارها فقط زمانی بررسی می‌شوند که کورنا باز باشد»).
- **26 new copy strings × en/fa** (native Farsi, «نرخ هدف», «بالاتر برود
  از», «فعال شد در ۲۶۳٬۲۰۰», «۱ دقیقه پیش» …).
- **Contrast fixes found by measurement during QA** — the first selected-
  radio styling (white on `currena-blue`) measured **2.35:1** dark and the
  first badge pill (white on `currena-warning`) 2.78:1; both now follow the
  I6-audited pattern (tinted surface + `-deep` ink token, dark badge
  `#1A222E` on `#FF8080`): re-measured **8.94:1** and **6.59:1**. VLM
  PASS ×2 (fa 375 dark dialog + section row); converter + insights
  regressions green, zero console errors, zero 375px overflow.
- **Bundle budget: held WITHOUT a bump** — the dialog is a lazy chunk, so
  the entry actually DROPPED to 290.12 kB / 87.00 gz (I13: 295.11/88.55,
  budgets 296/89.5); Insights untouched 133.85/38.88 (budgets 134/39).
  Tests **611 → 634 green** (core 183 · scraper 67 · insights 132 ·
  api 119 · web 133).

## [2026-10-08] — I13 data-portability & power-reader wave

Sixth round of the day — and the deploy round: the owner pushed the
**26-commit stack** (I7 share/print/chart/CI/alerting + I8 findability +
I9 zoom + I10 personal + I11 live-rate + I12 resilience, `2803932..7467853`)
and the Worker went out at version `dbccaed3` — production smoke green
(health ok, 30 readings, frankfurter cache age 523 s reports **fresh:
true**, the incident window is closed at the root). Post-deploy QA walked
every I7–I12 feature live in the full matrix (fa/en × desktop/375 ×
light/dark): share deep-links open+scroll+focus, chart tooltip + keyboard
stepping, zoom ranges, watchlist pins, reading progress, LiveRateLine
always-on rate, popular/recent pairs, VLM PASS ×2, zero console errors,
zero 375px overflow. This wave then adds the Insights power-reader set:
the snapshot **CSV export** (data portability — localized headers over
ASCII machine-readable values, OWASP formula-injection guard), **j/k
keyboard card-walking** (Gmail muscle memory, pairs with I9's "/" search,
respects the active filter), the **remembered chart zoom** (a chosen
10y/5y/1y range persists across visits — plottability still rules per
series), and a **shortcut legend** in the filter bar (kbd pills,
desktop-only). Plus two BACKLOG hygiene closes: #30 `splitEvenly` →
core (typed `SplitError`, exact-sum largest-remainder, +7 tests) and
#32 parser hardening (batch line/char bounds with typed `BatchError` +
localized toasts; calc accepts NBSP/CR/LF whitespace + unary plus;
typed `too_deep` guard replaces the bare native RangeError on
pathological nesting). Tests 585 → **611 green** (+15 core, +11 web).
Insights chunk 128.42 → 133.82 kB raw / 38.87 kB gz — budget consciously
bumped 132 → 134 kB (gzip still under 39; the growth is the export's
localized column wording, not logic). Entry chunk untouched at
295.11/88.55.

### Added
- **Insights snapshot CSV export** (`apps/web` insights-csv.ts +
  AboutTheData): "Download the data (CSV)" — 12 stable columns (id,
  indicator, ticker, value, unit, status, 7d/30d change, 10-year
  position, as-of, snapshot time, source) in snapshot order; values are
  plain ASCII numbers (period decimal, no separators — parses as numbers
  in ANY spreadsheet locale) while headers/status words localize (en/fa);
  name/ticker/source columns carry the OWASP formula-injection guard
  (same `csvNeutralizeFormula` as the batch export); RFC 4180 CRLF;
  filename `currena-insights-YYYY-MM-DD.csv` stamped from the snapshot.
  8 unit tests.
- **j/k card navigation** (Insights route): `j` opens+scrolls to the next
  visible card, `k` the previous — anchor is the last walked card, else
  the topmost card in view; respects the active filter; same
  typing/modifier guards as "/"; desktop keeps multi-open while walking.
- **Remembered chart zoom** (HistoryChart + chart-range.ts): the chosen
  10y/5y/1y persists in localStorage (`currena:insights:chart-range`),
  every chart opens there on the next visit; strict parsing falls back
  to 10y; storage failures fail OPEN (default, never an error); 5 tests.
- **Shortcut legend** (FilterBar): `/ search · J next card · K previous`
  as kbd pills — desktop-only (`hidden md:flex`), hidden on paper.

### Changed (BACKLOG #30, #32 — hygiene closes)
- `splitEvenly` moved from the Splitter route into `@currena/core`
  (split.ts) with typed `SplitError` (invalid_people / invalid_decimals /
  invalid_total) and input validation; the exact-sum largest-remainder
  arithmetic is unchanged. +7 tests incl. float-noise (0.1+0.2 style)
  and remainder-distribution cases.
- `parseBatchLines` now enforces input bounds — ≤500 non-blank lines and
  ≤500 chars/line — throwing typed `BatchError` codes the BatchConverter
  catches into one localized toast (fa/en copy added) instead of an
  unhandled throw or a per-line wall. +3 tests.
- `evaluateExpression` hardening: NBSP (U+00A0) and CR/LF are skipped as
  whitespace (HTML-copy/multi-line paste reality); unary plus accepted
  (`2*+3`, legacy-eval parity); nesting beyond 128 parens throws typed
  `CalcError('too_deep')` instead of the bare native RangeError. +4 tests.

## [2026-10-08] — I12 freshness & resilience wave

Fifth round of the day. Production QA re-measured the 2026-10-07 incident
LIVE and got the exact shape: with the I6 Worker still deployed (fix
pending), `/api/convert` for international pairs (frankfurter) hard-500'd
from 20:35:30 to 20:46:03 UTC — the cache TTL (5 min) expires 5 min into
each 15-min cron refresh cycle, so **~10.5 minutes of every 15 (70% of
all minutes)** every fetch-context request hit the stale path, tried the
single-flight lock, and (KV writes failing from fetch context) 500'd.
The incident's own fix (I11's ladder degradation) turns those 500s into
"Using cached rates" 200s once deployed — this wave closes the windows
at the ROOT: frankfurter's fresh window is now 15 min, aligned with the
quarter-hour cron, so fetch-context requests stay on the fresh-cache
rung between ticks regardless of KV health. And the SPA stops leaving
first-time visitors dead during any outage window: the snapshot store
grew a self-healing retry ladder and the converter's failure card became
honest (server-vs-network copy), actionable (Try again), and alive
(live countdown + automatic completion when the outage passes). Tests
575 → **585 green** (+2 api frankfurter-window, +8 web — the FIRST
snapshot-store unit tests). Production still serves the I6 Worker
`954f0034` (deploy pending, owner credentials).

### Fixed (incident root-cause mitigation)
- **Per-source fresh windows** (`@currena/core`): `FRESH_TTL_SEC` (one
  global 300 s) is now `FRESH_TTL_SEC_BY_SOURCE` + `freshTtlSec(source)`
  — tgju keeps the 5-min open-market window; **frankfurter gets 15 min**,
  matching the quarter-hour cron refresh cadence (ECB reference data
  updates ~once per business day; a 12-min-old snapshot is MORE than
  fresh). Server (rates-service freshness gate + status fresh flag +
  admin display) and client (snapshot-store staleness) share the same
  per-source semantics, so the client also stops re-fetching frankfurter
  every 5 min. Zero extra KV writes, zero extra scrapes — the stale
  window between cron ticks simply ceases to exist for frankfurter.
  +2 api tests (12-min ECB snapshot → fresh-cache rung with zero
  network; 16-min → honest stale ladder).
- **Failure-card copy honesty** (converter): the API ANSWERING with an
  error (500/5xx envelope — the incident's exact user experience) now
  says "The rate service is temporarily unavailable / Retrying
  automatically" instead of implying the USER's connection is broken
  ("check your connection" while their network is fine was misleading).
  Network-layer failures and offline keep the connection-flavored copy.

### Added
- **Self-healing retry ladder** (snapshot-store): a source that settles
  in the error state (nothing to serve — a first visit during an outage
  window) schedules automatic retries with capped backoff
  **15 s → 30 s → 60 s (60 s cap)**; any success clears the schedule and
  resets the ladder; offline settles never schedule (the online event
  refreshes directly); degraded mode (last-good still serving)
  intentionally does NOT poll — existing triggers cover it. Steady-state
  cost while an outage persists: one request per source per minute, the
  same order as the LiveRates poll. `nextRetryAt` (immutable epoch-ms
  stamp) exposes the schedule to the UI.
- **Failure card redesign** (converter, money page): role=alert card
  with the warning icon in a tinted circle, kind-aware honest copy
  (above), a localized **Try again** button that re-runs the conversion,
  a **live countdown** («Retrying in 14s» / «تلاش مجدد تا ۱۴ ثانیه دیگر»,
  Persian digits in fa, self-ticking every second, aria-live) while the
  store self-heals, and **automatic completion**: when the failing
  source recovers (error → ready) while the card is on screen, the
  interrupted conversion finishes BY ITSELF — the user already asked
  for it (verified end-to-end in the browser: mock 500s → card +
  countdown → unmock → result popup appears with no user action).
- **First snapshot-store unit tests** (web, backlog #29 partially
  closed): boot hydration + per-source freshness (12-min frankfurter
  local snapshot not stale, no fetch; 16-min refetches), the full retry
  ladder (15/30/60 escalation, cap at 60 s, success clears + no zombie
  retries), degraded no-poll, offline no-schedule + online-event
  takeover, ensureSnapshot semantics. Fake timers, faked fetchRates,
  in-memory localStorage.

### Changed
- **WCAG contrast sweep — raw `text-currena-warning` ink**: every
  user-facing warning TEXT rendered with the raw coral `#FF6B6B`
  (≈2.9:1 on light surfaces — fails AA) now uses the I6 `-deep` token
  (`#B92E2E` light ≈ 6.0:1 / `#FF8080` dark ≈ 6.6:1): the failure-card
  title + countdown, StaleBanner title (converter + LiveRates), Insights
  load-error + from-cache banner titles, Splitter network-error line,
  BatchConverter invalid-line label, AmountInput validation message,
  Receipt clear button, Insights card history-error. Measured in-browser
  before/after; dark mode is token-neutral (both map to #FF8080).
- **Admin runtime-config card**: the fresh-window line now shows the
  per-source values («300s / 900s») with the rationale hint.
- **Entry budget bumped 293 → 296 kB raw / 88 → 89.5 kB gz**
  (scripts/check-bundle-budget.mjs): the retry ladder + failure card +
  11 copy strings × 2 locales on the money page. gzip +1.49 kB for
  first-visit-outage recovery — incident-driven resilience, not bloat.
  Insights chunk untouched (128.42/37.78 vs 132/39).

## [2026-10-08] — I11 live-rate wave + rates-ladder incident hardening

Fourth round of the day. Production QA surfaced a REAL incident: starting
19:52:30 UTC, KV writes on the RATES namespace failed — first totally
(19:52–~20:10, cron included: status/history froze, the SPA masked tgju
via SW cache while frankfurter visibly 500'd), then selectively (the
cron's writes recovered while HTTP-context writes — by elimination the
single-flight lock PUT — still failed from at least the HKG colo, so
`/api/rates` + `/api/convert` 500'd instantly during every TTL-expiry
window with a good snapshot sitting in KV). Root cause beyond "KV
writes failing from fetch context" needs `wrangler tail` (owner —
DEPLOY.md incident note has the runbook); the daily-budget hypothesis
was tested against the evidence and DISPROVEN. The code answer shipped
regardless: the ladder now degrades exactly as its spec promises
(stale-cache rung instead of a 500) — turning this entire incident class
into a "Using cached rates" notice. And the converter homepage gains
the one thing every rate site answers instantly — the pair's live rate,
always on. Tests 555 → **575 green** (+6 api incident-degradation, +14
web LiveRateLine helpers). Production still serves the I6 Worker
`954f0034` (deploy pending, owner credentials).

### Fixed (production incident 2026-10-07 19:52 UTC)
- **`RatesService.getRates` store-failure degradation**: a snapshot READ
  failure now treats the cache as absent and continues down the ladder; a
  status-read or lock-acquire failure SKIPS the live rung entirely (the
  single-flight lock is a store guarantee — no lock, no scrape) and falls
  to the cached rungs — stale-with-notice when a ≤7-day snapshot exists,
  the honest 503 `source_unavailable` otherwise. Only `RatesServiceError`
  ever escapes the service now; the route's 500 backstop becomes
  unreachable for store errors. +6 unit tests replaying the incident
  (writes-dead + fresh-TTL-expired → stale cache with notice, status-read
  failure, snapshot-read failure with a working scraper, forced refresh
  semantics, and the exact 19:57 UTC sequence). Docs: DEPLOY.md incident
  note with the write-budget math and owner recommendations.

### Added
- **LiveRateLine (converter homepage)**: the selected pair's mid-market
  rate is always visible between the currency row and the CTA — previously
  it only existed inside the result popup, so "what's the dollar?" needed
  an amount + a tap. Pure local math over the already-booted snapshot
  (swap/currency changes re-render instantly, zero network): rate +
  inverse display (legacy precision rules — Toman integers, 4 decimals,
  8 for sub-1), `SourceBadge` (TGJU/Frankfurter), relative freshness
  («Updated 2 minutes ago» / «به‌روزرسانی ۲ دقیقه پیش»), ▲/▼ delta vs
  the previous recorded generation (`RateDeltaChip`), a 40-point
  `Sparkline` from the same rate-history the ResultPopup micro-trend uses
  (LTR axis in fa — documented analytical-axis decision), and a copy
  button producing a localized share line
  (`1 Euro = 295,260 Iranian Toman · Currena — currena.ir` /
  «۱ دلار آمریکا = ۲۳۰٬۵۰۰ تومان ایرانی · کورنا — currena.ir») with a
  2-second "Copied!" acknowledgment (clipboard failures no-op, same
  pattern as the Insights share pill). Honest states: hidden for
  same-currency pairs, pairs unresolvable from the pair's snapshot (the
  conversion itself would fail identically), no snapshot yet, and while a
  custom rate overrides the market; a confirmed-stale snapshot tints the
  line warning-amber with a ⚠ freshness line instead of hiding it. Pure
  helpers (`liveRateView`, `sparklineWindow`, `rateDecimals`,
  `rateShareText`) unit-tested in `lib/live-rate.test.ts` (+14 web tests).
- **Popular pairs (first-run)**: until the first conversion exists the
  pair-chips section shows five TGJU open-market suggestions (USD/EUR/
  GBP/AED/TRY → IRR) instead of nothing — first-time visitors see what
  the app is for; after the first conversion their own recents take over
  (existing behavior). Same chip DNA, 🔥 label («جفت‌ارزهای پرطرفدار»).

### Changed
- **Print polish (converter)**: the rate line PRINTS (it is the headline
  number on paper — verified in the PDF text layer); the interactive
  chrome around it (pair chips, quick tools grid, copy button) gains
  `.no-print`. Reduced-motion discipline: the quick-amount and pair-chip
  hover lifts are now `motion-safe:`-prefixed.
- **Entry budget bumped 289 → 293 kB raw** (scripts/check-bundle-budget.mjs,
  gz unchanged at 88): the LiveRateLine + popular pairs grow the entry
  288.80/86.98 → 292.57/87.88 — raw +3.77 kB but gzip-NEUTRAL (under the
  88 kB gz budget), i.e. users download ~zero extra bytes. The money page
  answering "what's the dollar?" without a conversion is the
  highest-value entry growth since launch. Insights chunk untouched
  (128.41/37.79 vs 132/39 budget).

## [2026-10-08] — I10 personal & portable wave: watchlist pins, .ics export, reading progress, relative freshness

Third round of the day, autonomously scoped after a clean QA sweep (production
+ local all green; API 30 readings / 0 unavailable / 14 events). Four features
close the loop on "a page readers return to": personalisation, portability and
orientation. Tests 545 → **555 green** (+10: 4 pinned-storage, 6 RFC 5545).
Presentation-layer only — no scoring, thresholds, sources, KV keys or API
changes. Production still serves the I6 Worker `954f0034` (deploy pending,
owner credentials).

### Added
- **Personal watchlist ("My watchlist" / «دیده‌بان من»)**: every card's
  expanded action row gains an aria-pressed pin pill (☆/★, house pill DNA);
  pinned cards MOVE into a dedicated section above the groups — "stay on
  top" — with its own warning-count line (the pinned set's own status,
  group headers keep describing full data). Persisted in localStorage
  (`currena.insights.pinned.v1`; `parsePinnedIds` degrades any malformed
  value to "nothing pinned", unknown ids drop silently) and synced across
  tabs via the `storage` event. The collapsed card shows a ★ badge (in the
  expand button's accessible name via sr-only text) so pin state reads
  without expanding. Play-nice with everything that locates cards by DOM
  id: share deep links (`?card=` opens + scrolls to a pinned card),
  WhatChanged rows, focusCard's filter-reset (a hidden pinned card is
  found after the filter clears), JumpNav gains the watchlist pill, the
  section hides under the no-match state. Pure helpers unit-tested.
- **Calendar export (.ics)**: the Coming up header gains a "Download
  calendar (.ics)" pill exporting exactly the events listed (upcoming,
  localized titles). `buildInsightsIcs` in `components/insights/ics.ts` is
  a pure RFC 5545 builder — CRLF endings, TEXT escaping (ASCII `;` `,` `\`
  and newlines; the Persian ؛/، code points correctly untouched), octet-safe
  75-octet folding (never splits a UTF-8 sequence — Persian titles are the
  point), all-day `DTSTART;VALUE=DATE` with the exclusive `DTEND` (+1 day,
  month-boundary verified), stable `<event>-<date>@currena.ir` UIDs so
  re-imports update instead of duplicating, deterministic `DTSTAMP` (now
  passed in tests). Downloads via the shared `lib/download.ts`.
- **Shared download helper** (BACKLOG #24): `downloadBlob` extracted from
  its two route-local copies (Receipt PNG/XLSX, BatchConverter CSV) into
  `apps/web/src/lib/download.ts`; the Insights export is its third consumer.
- **Reading progress bar**: a 3px `role="progressbar"` pinned above the app
  header (z-1001), filling from the inline-start edge in both directions
  (RTL grows from the right — native block flow). rAF-throttled passive
  listeners (the JumpNav scrollspy pattern); `aria-valuemin/max/now` keep it
  honest; hidden on paper.
- **Relative freshness**: the header's generated line now reads
  "Updated {ago} · {exact datetime}" ("3 hours ago", «۳ ساعت پیش») via the
  existing core `formatRelative` (zero entry-bundle growth — it was already
  there); the from-cache banner leads with the relative age too (the exact
  timestamp stays one line above).

### Fixed
- **Persian-digit sweep (fa prose numbers)**: section headers, group headers
  and the days-away counter rendered Latin digits («3 از 6 شاخص», «21 روز
  دیگر») while values, charts and chips used Persian digits. All prose
  numbers now render through `formatNumber(numberLocale)` — «۳ از ۶ شاخص
  در وضعیت هشدار», «۲۱ روز دیگر», the excluded-note count, and the new
  watchlist count line. The LED seven-segment values stay Latin by the
  documented Wave-5 #46 decision.

### Budget
- Insights chunk 121.30/35.85 → **128.36/37.78 kB/gz** — gate consciously
  bumped 125/37 → 132/39 with this entry as justification (watchlist UI +
  section + persistence, ics builder, progress bar, digit sweep, 9 new copy
  strings × 2 locales). Entry untouched: 288.80/86.98 vs 289/88.
  Precache 61 entries.

## [2026-10-08] — I9 feedback & analytical-zoom wave: chart ranges, chip counts, summary jumps, "/"-shortcut

Second stable-state round of the day: re-verified production + local standing
state (all green), fixed one I8 gap found during review, then four features.
Tests 528 → 537 → **545 green** (+8 range/count tests). Presentation-layer
only — no scoring, thresholds, sources or API changes. Still awaiting the
owner-credentialled deploy (production serves I6 Worker `954f0034`).

### Fixed
- **focusCard × filter interaction (I8 gap)**: clicking a WhatChanged row
  (or any focus-card path) while the active filter hides that card used to
  silently do nothing visible. The reader's "show me THIS card" intent now
  wins — the filter resets (chips + query), then the card opens, scrolls
  and receives focus.

### Added
- **Chart range toggle — 10y / 5y / 1y** (`HistoryChart`): a segmented
  control in the figcaption (the house pill DNA at chart-local size).
  `sliceHistoryToRange` / `rangeIsPlottable` are pure, unit-tested helpers
  in `config.ts`; the window anchors on the series' LAST point (honest even
  when the feed is days old); ranges that cannot show ≥2 points disable
  themselves; the mid-axis year tick suppresses itself when it would repeat
  an end year (1y windows show exactly 2 ticks); the I7 tooltip + keyboard
  stepping operate on the sliced series; the SR data table follows the
  visible range. **The 10-year position bar and percentiles never change**
  — they are the indicator's server-side decade placement. Hidden on paper.
- **Live counts on the filter chips** — "All (30) / Warning (6) / Normal
  (15) / Context (7)": the reader sees what a chip does before pressing it
  (`statusCounts`, pure, tested; Persian digits in fa). Same semantics as
  the filter: stale/unavailable count only under All.
- **Summary lines are jump buttons**: the two LED summary lines now scroll
  to their sections — the summary block doubles as the page's table of
  contents (hover affordance, direction-neutral ↓ chevron, sr-only "View
  section", reduced-motion-aware).
- **"/" focuses the filter search** — Gmail/GitHub/YouTube muscle memory.
  Ignores modifier combos (never swallows browser shortcuts) and never
  fires while typing in any field; `aria-keyshortcuts="/"` declared on the
  input.

### Changed
- **Insights chunk budget 120/35.5 → 125/37 kB/gz**
  (`scripts/check-bundle-budget.mjs`): the range control + slicing, chip
  counts, summary buttons, shortcut wiring and 12 more copy strings × 2
  locales grow the lazy chunk 117.27/34.83 → 121.30/35.85. The entry chunk
  is untouched (288.76 kB / 86.95 gz — money-page budget held).
- Spec §5 (indicator card) now records the range control and §4 the summary
  jump behaviour (additive documentation).

## [2026-10-08] — I8 findability wave: filter toolbar, story→card links, hover polish

Stable-state session: full QA pass first (production standing state + every
Wave 6 feature re-verified locally with agent-browser — share links, chart
tooltip/keyboard, print, zero errors), then the next coherent improvement.
30 cards across two sections is a lot to scan; three presentation-layer
changes, no scoring/threshold/API contract changes. Tests 528 → **537 green**
(+9 filter tests). Not yet deployed — ships with the Wave 6+ work at the next
owner-credentialled deploy (production still serves I6 Worker `954f0034`).

### Added
- **Card-grid filter toolbar** (`FilterBar.tsx`, new): status chips
  (All / Warning / Normal / Context — 44px pills, `aria-pressed`, the I6
  deep-ink active tones) plus text search over name + ticker. Persian
  search is normalised like a native would expect: Arabic-keyboard
  yeh/kaf map to Persian, ZWNJ acts as a word separator, bidi marks are
  stripped — «بیت کوین», «بیت‌کوین» and «بيكاري» all match their cards.
  The result count line is `aria-live` with a Clear-filters reset;
  fully-filtered-out sections, groups and JumpNav pills hide; a no-match
  panel replaces the grid; the toolbar is hidden on paper (`.no-print`).
  Filtering is a VIEW tool only — section/group warning-count lines keep
  describing the full snapshot, and stale/unavailable cards only appear
  under All.
- **Story blocks now link into the grid**: every WhatChanged row (state
  changes + the five biggest 30-day moves) is a button that opens and
  scrolls to its indicator card through the shared `focusCard` path (the
  I7 share-link behaviour, extracted); the chevron mirrors per locale and
  the accessible name carries "View card".
- **Pure filter helpers** in `config.ts` (`indicatorMatchesFilter`,
  `filterVisibleIds`) with 9 unit tests incl. the Persian-normalisation
  cases.

### Changed
- **Insights chunk budget 110/33 → 120/35.5 kB/gz**
  (`scripts/check-bundle-budget.mjs`): the toolbar + visibility wiring +
  26 copy strings × 2 locales grow the lazy chunk 109.36/32.91 →
  117.27/34.83 — a conscious, justified bump; the entry chunk is
  untouched (288.76 kB / 86.96 gz, money-page budget held).
- **Card hover polish**: desktop-only, `motion-safe` 2px lift + deeper
  shadow on indicator cards (reduced-motion and touch unaffected).
- Spec §4 (page structure) now records the toolbar row between "Coming
  up" and the sections (additive documentation of the I8 change).

## [2026-10-07] — BACKLOG Wave 6 closed: CI gate, chart tooltip, print, share links, ingest alerting

Owner direction ("Proceed based on your phases") → the ranked Wave 6 backlog
from the I6 session, completed end-to-end. Tests 521 → **528 green**; every
commit CI-verified on GitHub (the new gate itself, green on each push).

### Added
- **CI workflow** (`.github/workflows/ci.yml`, BACKLOG #47): every push to
  main + PRs runs typecheck, the full test suite, the SPA build, and a
  **bundle-budget gate** (`scripts/check-bundle-budget.mjs`) — entry chunk
  ≤ 289 kB / 88 kB gz, Insights lazy chunk ≤ 110 / 33; budgets are the
  documented numbers and bumps require a changelog justification.
- **Chart hover/focus reading** (#48, audit F16): pointermove tracks the
  nearest point on the 10-year chart (dashed guide line + highlighted dot +
  date/value tooltip — Jalali + Persian digits in fa); the chart is
  keyboard-focusable with ←/→/Home/End stepping; `touch-pan-y` keeps mobile
  scrolling intact; the SR data table remains the text path.
- **Per-indicator share links** (#50, spec §10 "later"): the hash router is
  now query-tolerant (`parseRouteAndQuery`, pure + 7 new unit tests);
  `#/insights?card=<id>` opens exactly that card and scrolls to it once per
  mount (single-open discipline on phones; unknown ids ignored); each
  expanded card carries a "Share this card" pill (en / «اشتراک این کارت»
  fa) that copies the deep URL with inline "Link copied" feedback.

### Changed
- **Print stylesheet** (#49, audit F16): `@media print` in index.css — dark
  mode prints the light palette, header chrome/nav pills hidden (logo kept),
  cards/sections/figures never break across pages, external links spell out
  their URL, SVG/LED colors kept exact. Verified via PDF export + VLM
  review.
- **Jump targets land below the fixed header**: Insights sections + the card
  anchor get `scroll-mt-24` (the About route's existing convention) —
  JumpNav jumps and share deep links no longer hide their target's title
  behind the navbar.
- **Failed-ingest alerting** (#46): a `if: failure()` Telegram step in
  `insights-ingest.yml` — posts run/sha/URL to the owner when
  `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` secrets exist, a clean no-op until
  then (red run + the 36 h /admin staleness pill remain the standing
  signals).

### Verified
- Local: every feature agent-browser-verified en+fa × desktop/375px (tooltip
  values + keyboard stepping, deep links desktop + mobile single-open,
  clipboard flow with stubbed API, print PDF URL spelling, zero console
  errors, no overflow). CI: **5/5 runs green** on GitHub.
- Bundle: entry 288.76 kB / 86.95 gz (≤ budgets); Insights chunk
  109.36 kB / 32.91 gz after tooltip + share (inside the 110/33 gate —
  growth justified above).

## [2026-10-07] — Insights UI/UX pass (Phase I6) + completeness sweep (I6 backtest re-run + I7 hardening)

Owner agenda ("Improving UI/UX of the Insights page, and making sure nothing is
left behind"). Presentation-layer only — no scoring, thresholds, sources, KV
keys or API contracts touched. Evidence-first audit
(`docs/insights/05-ux-audit-I6.md`) → five implementation commits → backtest
re-run → I7 hardening → production smoke.

### Fixed — Accessibility (audit F1–F5, F7, F10)
- **WCAG AA in light theme** (was failing on all 30 cards): status chips
  2.78–3.29:1, group h3s 3.14:1, panel h5s + source pill ~3.3:1, latent
  what-changed rows 2.78:1, coming-up "soon" coral 1.92:1. Four ink-grade
  `-deep` accent tokens added to the theme (blue #245E9F, success #256D29,
  warning #B92E2E, coral #9C5019 — ≥4.5:1 on white, page bg, and their own
  /10–/15 tints); dark mode remaps them to the existing bright hues
  (≥6.5:1). Both themes re-measured programmatically: 4.62–10.47:1.
- **Stale-card grey-out no longer sinks text below AA** (was 2.33:1 light /
  1.96:1 dark through a blanket opacity-60): grey-out is now a softened
  surface tint + muted value colour with every string ≥4.5:1.
- **Tap targets**: JumpNav pills 30→44px; chart-data `<summary>` 16px→a
  full-width 44px row; "How this is calculated" + disclaimer links get
  padded hit areas (layout unchanged).
- **Accessible names**: the card expand button's name was the entire
  collapsed card (~33 words); heading + button are now labelled
  "name (+ticker), status" via `aria-labelledby`.
- **Summary block landmark** was labelled "Global" (duplicate of the real
  Global section) with no heading — now `ui.summaryTitle` (en "Market
  summary" / native fa «خلاصهٔ وضعیت بازار») + a visually-hidden h2.

### Fixed — UX (audit F6, F8, F9, F11–F15)
- **JumpNav scrollspy**: active-section awareness while scrolling (passive
  rAF listener, `aria-current="true"`, tinted active pill; bottom-of-page
  pins the last section).
- **Chart year labels** no longer carry thousands separators ("2,016" /
  "۲٬۰۱۶" → "2016" / "۲۰۱۶" — `formatNumber` learns `useGrouping:false`,
  formatter-cache key extended); a **mid-axis year tick** orients the
  decade span; position bar 8→10px with a 30% warning-zone tint.
- **Expanded panel readability**: rule sentence text-xs→text-sm, section
  titles 0.72→0.75rem with more lead-in, sections gap-3→gap-4 — the five
  blocks scan as anchors instead of a wall of text.
- **fa typography**: Jalali date+time joined with the Persian comma «،» in
  core `formatJalaliDate` (ICU emitted a Latin ", ") — also fixes the
  converter ResultPopup timestamp.
- Card footer/group status/meta lines 0.68→0.7rem; disclaimer bar softened
  to read as a footnote, not a system alert.

### Changed
- `docs/insights/BACKTEST.md` regenerated against the full 30-indicator
  definition set: `gold-usd`/`silver-usd` reported honestly as info-only
  never-votes (was "undefined"), `china-pmi`'s note reflects its populated
  10-observation manual series; zero numbers changed, I1 findings
  re-affirmed with an I6 re-run verdict. No threshold changes proposed.
- `/admin` Insights card (I7): pill flips to "stale — no run for N h" with
  a `role=alert` action line past 36 h without a run — previously a dead
  cron kept the card "healthy" while the snapshot aged. Live-verified
  fresh + stale paths on local wrangler.
- `docs/BACKLOG.md` Wave 6: post-I6 SWOT re-check + explicit backlog
  (failed-ingest push notification, performance-budget CI gate, chart
  hover tooltip, print stylesheet, per-indicator share links).

### Verified
- Every commit: typecheck 5/5, tests green **516 → 521** (core +2 useGrouping/
  Jalali-comma, admin +3 staleness), bundle budget held — entry 288.75 kB /
  87.77 kB gz unchanged, Insights lazy chunk 104.54 → 105.98 kB (31.49 →
  31.94 kB gz, +0.45 gz for scrollspy + labels), precache 60 / ~2172 KiB.
- agent-browser en/fa × desktop/375px × light/dark: contrast sweep
  re-measured, RTL geometry intact, Persian digits + Jalali dates, chart
  LTR-in-fa, mobile single-open, language switch keeps scroll + open
  cards, zero console errors, no horizontal overflow.
- Production standing state: `/api/health` ok; `/api/insights` 30 readings,
  fresh `generatedAt`, 14 calendar events, quiet week, Global-first order
  (first Australia id at index 18); history endpoints 200 + 404-for-single-
  point + 400-unknown + ETag 304; today's scheduled (04:20 UTC) and
  dispatched ingest runs green on the Actions tab.

## [2026-10-07] — Session wrap-up: shipped state re-verified + next-session brief

Owner direction ("Proceed to next phase if anything is remaining and wrap up
this session… The new session agenda: Improving UI/UX of Insights page, and
making sure nothing is left behind"). No runtime changes — the evening
re-verified the 2026-10-07 feature set end-to-end and closed the session.

### Verified
- Gates re-run: typecheck 5/5, tests **516/516 green** (core 157 · scraper
  67 · insights 132 · web 52 · api 108).
- Production smoke (`currena.ir`): `/api/health` ok; `/api/insights` 30
  readings — `gold-usd` 4107.7 / `silver-usd` 60.109 at the top of the
  metals group, all 18 global ids before the first Australia id, 14 calendar
  events, fresh `generatedAt`, zero unavailable indicators.
- Redeploy from the final HEAD (version of record in
  `docs/DEPLOY.md` §"Session wrap-up, 2026-10-07 evening") — runtime
  identical to the deployed `b69375c` build; docs-only commits around it.

### Changed
- `docs/NEXT_SESSION_PROMPT.md` rewritten as the hand-off brief for the next
  agenda: **Insights UI/UX pass + completeness sweep** (Phase A audit against
  `02-page-design-spec.md`, Phase B presentation-layer improvements, Phase C
  = the I6 backtest re-run + I7 hardening checklist + standing-state
  verification).
- `docs/PROGRESS.md` status row + decisions log: owner direction recorded
  (I5 effectively closed; next phase reframed as the UI/UX agenda).

## [2026-10-07] — Insights: gold and silver ounce prices in the precious-metals group

Owner request ("I want the ounce price of Gold and ounce price of Silver to be
added in the precious metals part"): two new info-only cards at the top of
**Metals, crypto and hard assets** — `gold-usd` and `silver-usd`. They render
first in the group (prices before the ratios built from them), never vote, and
so leave every summary count unchanged. 30 indicators total (19 P1 / 11 P2).
Tests 514 → **516 green**; typecheck 5/5.

### Added
- `gold-usd` — Gold price (ounce), US$ per troy ounce: live TGJU world-market
  ounce quote with World Bank Pink Sheet monthly history backfill (the exact
  `gold-silver` recipe with the raw price as the live point). Displayed as
  `US$4,104`-style whole dollars; carries the 10-year position bar and chart.
- `silver-usd` — Silver price (ounce), US$ per troy ounce: live gold-api.com
  XAG spot with the same World Bank monthly backfill. Displayed to 2 decimals
  (`US$60.13`).
- Bilingual copy corpus entries (en + native fa) for both cards; spec table
  amendment in `docs/insights/01-indicator-spec.md`.

### Changed
- `IndicatorIdSchema` (core contract), `DEFINITIONS`, `buildIndicatorSeries`
  and `READING_SOURCES` (@currena/insights), `DISPLAY` (apps/web) — the two
  ids wired through every layer; degradation ladders tested (no World Bank →
  single live point; no live source → monthly history reads stale, honest).
- Count-pinning tests updated (core id set 30; definitions 19/11; snapshot 30
  readings; fa copy coverage 30 keys).

### Deployed
- Worker version `b1a5e80e-b61e-4f21-994d-4342557de5ba` (922.73 KiB upload,
  gzip 159.88 KiB, 15 new assets) — live on currena.ir + workers.dev; entry
  bundle byte-identical to the I5 baseline.
- Ingestion dispatched manually (Actions run 37646617580, `success` on
  `b69375c`): production snapshot `generatedAt 2026-10-07T15:46:25.777Z`,
  30 readings — `gold-usd` 4107.7 and `silver-usd` 60.109, both `context`
  with ≈92% 10-year position; new `insights:hist:gold-usd|silver-usd` keys
  (120 points each); voting counts unchanged (global 3/11, australia 3/10).
  Browser-verified en+fa, desktop+375px: cards lead the metals group, charts
  + SR tables + source links render, zero console errors, no overflow.

## [2026-10-07] — Insights Phase I5: content (calendar, china-pmi) + Gate I4 ordering fix

Gate I4 approved (owner: "Approved." + the live `/api/insights` JSON) with
one requested change, applied first: **the Global section now renders
before Australia** — section order (`SECTION_ORDER`), jump-nav target
order, and the summary block's two LED lines all flipped; the design spec
§4 records the owner decision (the original "reader is in Australia"
rationale is retired). Then Phase I5's content work: the key-dates calendar
populated from official schedules and the China-PMI manual series seeded
from documented official releases. Tests stay **514 green**; typecheck 5/5;
the reorder is render-order only (no bundle-gated code changed).

### Added
- `data/insights-calendar.json` — 14 events (2026-10-28 → 2027-05-04):
  RBA cash-rate decisions (2026: 3 Nov, 8 Dec; 2027: 9 Feb, 23 Mar, 4 May —
  from the RBA Board Meeting Schedules page, decision = second day), FOMC
  decisions (2026: 28 Oct, 9 Dec; 2027: 27 Jan, 17 Mar, 28 Apr — from
  federalreserve.gov), ABS CPI releases (Sep quarter 28 Oct, Oct 25 Nov,
  Dec 27 Jan, Jan 24 Feb — from abs.gov.au, cross-checked against the RBA
  homepage "Next update"). Bilingual titles; events within 7 days highlight
  client-side; past events drop off.
- `data/manual/china-pmi.json` — 10 NBS manufacturing-PMI observations
  (2025-12 → 2026-09), every value the official headline cross-checked
  against ≥2 independent reports of the release with month-over-month
  arithmetic reconciled; full provenance table in `data/manual/README.md`.
  The china-pmi card goes live (50.1, normal, +0.30 pts 30-day change);
  its position bar stays hidden until the 30-observation percentile floor.

### Changed
- `apps/web/src/components/insights/config.ts`, `routes/Insights.tsx`,
  `components/insights/SummaryBlock.tsx` — Global before Australia
  (section order, jump nav, summary rows).
- `docs/insights/02-page-design-spec.md` §4 — page structure reordered to
  match the owner's decision; rationale line rewritten.

### Documentation
- Roadmap: I4 exit records Gate I4 approval + the ordering change; the I5
  checklist closed out (copy corpus delivered in I4 + re-reviewed with a
  mechanical no-buy/sell check; calendar populated; disclaimer reviewer
  declined at D4; china-pmi seeded as an added I5 item).
- `data/manual/README.md` — china-pmi provenance table + growth rule.

### Deployed
- Pushed `f3a8101..f77bdd4` to `main` and redeployed the Worker (version
  `bef6f65b-e5b6-4655-8d14-25f7945b2e19`, 922.70 KiB upload, 13 new assets —
  the reordered `Insights-oh-TxMJf.js`). A manually dispatched
  `insights-ingest` run (Actions run 37641720806, success) wrote the first
  production snapshot carrying the calendar (14 events) and the live
  china-pmi reading (50.1, normal) — zero unavailable indicators. Verified
  on `currena.ir/#/insights` in en and fa: Global before Australia in
  sections, jump nav, and summary rows; card expand → chart + table +
  source link; 375px no overflow; zero console errors. Deploy record in
  `docs/DEPLOY.md` §Insights reorder + I5 content deploy.

## [2026-10-07] — Insights Phase I4: the page

Gate I3 approved (owner: "Approved." with the live `/api/insights` JSON
pasted for review). Phase I4 builds the reader-facing page: `#/insights`,
28 expandable indicator cards, both languages, both themes, every state in
the design spec. **Entry bundle +0.10 kB gzip** (288.75 kB / 87.78 kB gzip
vs the 288.45 / 87.68 baseline) — the whole feature, including the ~600-line
bilingual copy corpus, lives in the lazy route chunk (100 kB / 30.4 kB gzip).
Tests **479 → 514 — all green** (+35 web); typecheck clean in all five
packages. Browser-verified in en/fa × light/dark × desktop/375px against
the exact production snapshot: zero console errors, no horizontal overflow
(one overflow defect found and fixed during verification), offline fallback
through the last-good localStorage snapshot, mobile single-open cards.
Deployed and smoke-verified on currena.ir — awaiting the owner's visual
review (Gate I4).

### Added
- `apps/web/src/routes/Insights.tsx` — lazy `/insights` route (ROUTES, nav
  entry, per-route title). Australia before Global, jump links, about-the-data
  + full disclaimer.
- `apps/web/src/lib/insights.ts` — typed API client (zod-validated snapshot +
  per-card history with expected-404 → null), localStorage last-good fallback.
- `apps/web/src/i18n/insights-copy-en.ts` / `insights-copy-fa.ts` — the copy
  corpus (28 indicators × 6 fields + structural strings per locale), lazy in
  the route chunk, fa compile-time shape-checked against en.
- `apps/web/src/components/insights/` — SummaryBlock (LED warning counts +
  explainer + disclaimer bar), WhatChanged, ComingUp, JumpNav, IndicatorCard,
  HistoryChart (+ screen-reader table), PositionBar, StatusChip, AboutTheData,
  display config + pure helpers.
- 35 web tests: client contract/error/cache paths, value/change/rule
  formatting (en + fa), warning zones, movers ranking, group counts, history
  sampling, copy coverage.

## [2026-10-07] — Insights Phase I3: ingestion runner, storage, API routes, production write-run green

Gate I2 approved ("continue proceed"). Phase I3 builds the feature's serving
pipeline end to end: the GitHub Actions ingestion runner, the KV storage
contract, the read-only API routes, and the admin freshness card. **First
Insights deploy** (new routes on `currena-api`, Worker version `3ab1a97a`;
the SPA bundle is unchanged — insights imports are type-only on the worker
side). Tests **441 → 479 — all green** (+38); typecheck clean in all five
packages. Production evidence: venue dry-run (Actions run 37518740313)
27/27 sources OK; real write-run (Actions run 37550035289) wrote 24 history
keys + snapshot + status in 26 KV writes with `P1 COMPLETE`; live JSON
verified at `/api/insights` on workers.dev and currena.ir.

### Ingestion runner (`packages/insights`)

- `scripts/ingest.ts` — the production twin of live-run: collect → assemble →
  score → write. Loads `data/insights-calendar.json` + `data/manual/*.json`
  (soft-absent, loudly validated when present), reads the previous snapshot
  for `changedThisWeek` continuity (fresh events carried, week-window
  filtered), writes `insights:snapshot` + `insights:status` (critical) and
  `insights:hist:<id>` only on change (read-compare), prints the source
  report + readings + KV-op budget. Exit 1 when any P1 indicator is
  unavailable — a red workflow run is the stale-feed signal.
- `src/adapters/collect.ts` — the live-run fetch phase extracted verbatim so
  the diagnostic script and the runner cannot drift (live-run refactored onto
  it; output unchanged).
- `src/adapters/snapshot.ts` — pure assembly: `buildInsightsSnapshot`
  (readings + summaries + changedThisWeek merge + calendar),
  `buildHistoryFile` (10-year window anchored on the newest observation,
  downsampled to ≤520 points, `[epochDay, value]` encoding; single-point live
  cards get no history key), `buildInsightsStatus`.

### Storage contract

- `@currena/insights/store` (new export entry): `InsightsReader` /
  `InsightsWriter` interfaces + key names + `InMemoryInsightsStore` (tests) +
  `RestInsightsStore` — the Cloudflare REST KV writer with injected fetch,
  429/10048 daily-cap retry ladder, and op counters. The SPA-facing root
  export stays untouched.
- Core wire contracts: `IndicatorHistory` (strictly-ascending epoch-day
  pairs), `InsightsStatus` + `InsightsSourceReport` (admin freshness).
- `apps/api/src/adapters/insights-store.ts` — `KvInsightsReader` (the
  Worker's read half, poisoned-entry defense like `KvRateStore`). Keys live
  in the existing RATES namespace under the `insights:` prefix, NO TTLs.

### API + admin

- `GET /api/insights` — the precomputed snapshot; `503 insights_not_ready`
  before the first run; ETag `"insights:<generatedAt>"` + 304s; 60s public
  cache; exactly ONE KV read.
- `GET /api/insights/:id/history` — one indicator's downsampled series;
  `400 invalid_indicator` / honest `404 history_not_found`; ETag + 304s;
  300s public cache.
- `/admin` gains a zero-JS Insights card (last run, mode, per-source ✅/❌
  rows) fed by `insights:status`; the read is failure-tolerant (a broken KV
  read omits the card, never breaks the console).

### Workflow + ops findings

- `.github/workflows/insights-ingest.yml` — the repo's first workflow on
  main: cron **04:20 UTC daily** + `workflow_dispatch` with `dry_run`;
  pnpm from `packageManager`, frozen lockfile, 15-minute timeout, no
  overlapping runs.
- **KV write-budget finding (pre-existing, refined by live observation)**: the
  account's write counter crosses the 1,000 free writes/day around ~19:00 UTC
  (ever-green rates cron ~1,000/day + the second worker ~450/day). The cap's
  enforcement was observed on the **KV REST API** (429/10048) — the exact
  path the ingestion runner uses; Workers **binding writes are not blocked**
  (the rates app kept writing fresh snapshots after the trip, so production
  is unaffected). The ingestion is therefore scheduled at 04:20 UTC into the
  fresh post-midnight counter and retries capped writes. Recorded in
  docs/PROGRESS.md decisions log + docs/insights/03-data-sources.md §Phase I3.
- Scope cuts recorded: Bitstamp 10-year candle backfill + RBA F11 skipped
  (no v1 consumer); one daily schedule instead of daily+weekly
  (change-detected writes).

## [2026-10-06] — Insights Phase I2: source adapters, venue-verified RBA, live-run green

Gate I1 approved ("Continue." — backtest thresholds locked as-is). Phase I2
builds the feature's data layer — **still no app code; web/api bundles
unchanged; nothing deployed.** Tests **400 → 441 — all green** (insights 69 →
110); typecheck clean in all five packages; runner-side gates green from the
ingestion venue.

### Source adapters (`packages/insights/src/adapters/`, via `@currena/insights/adapters`)

- Import surface SPLIT from the pure root export: the SPA-safe `.` entry
  stays platform-/fetch-free; the new `./adapters` entry carries the fetch
  halves (web-standard fetch only — runs identically in the GitHub Actions
  runner and a Worker). `@currena/insights` gains a `@currena/scraper`
  dependency (fetchWithRetry + the production TGJU gold parser).
- fred / frankfurter / abs / worldbank / goldapi / bitstamp / tgju / rba /
  manual-series loader + `derived.ts` (`buildIndicatorSeries` — the
  production twin of the backtest SERIES map: ratio joins, yoy derivation,
  inverse/cross FX, live-point info cards, WB-brent fallback) +
  `READING_SOURCES` (per-card attribution).
- `xlsx.ts` — dependency-free XLSX reader (ZIP central directory +
  `DecompressionStream('deflate-raw')` + shared strings) for the World Bank
  Pink Sheet; the workbook URL is re-discovered from the commodity-markets
  page every run because the thedocs.worldbank.org document hash rotates.
- `parsers.ts` additions: `parseAbsSdmxCsv` (live SDMX response; header-driven
  columns — order varies by flow; sorts unordered answers; skips blank
  OBS_VALUE) and `parseRbaTableCsv` (title/header/metadata rows; both RBA
  date formats; skips pre-scaffolded empty future quarters).
- Loud-failure everywhere: zod response contracts (gold-api, Bitstamp,
  manual), table/series/unit identity checks (RBA prefix, WB header+units,
  ABS DATAFLOW), ascending assertions, ingestion-UA pinned for FRED (its
  Akamai edge hangs on the Chrome fingerprint).

### RBA venue verification (the I0 blocker, closed)

- Temporary branch `probe/i2-rba-venue` + a branch-only workflow ran the
  probe from the GitHub Actions runner: F1.1 / F2 / E2 / F11.1 CSVs all
  **HTTP 200**; the bytes are committed as fixtures. The sandbox stays
  Akamai-403 (loud-unavailable there — honest by design).
- `au-household-debt-arrears` resolved to **RBA E2 'Household debt to
  income'** (the ABS Data API has no household-ratios flow; catalogue
  searched in full). `au-us-10y-gap` cadence daily → weekly (F2 publishes
  T+2..4). I0's "4.60% cash rate" reference note retired (F1.1: 4.36).

### Fixtures & tests

- New recorded fixtures: gold-api XAG/BTC, Bitstamp OHLC, Frankfurter small
  timeseries, ABS SDMX ×5 (live response format), the full real World Bank
  XLSX, RBA F1.1/F2/E2 (venue bytes). 41 new tests (110 total in the
  package), all fixture-backed; the XLSX integration test parses the real
  workbook end-to-end (1960M01 → 2026M09).

### Live run (I2 exit criterion)

- `pnpm --filter @currena/insights live-run` — the one-off manual run that
  fetches every source, assembles all 28 indicator series and prints the
  sanity table + summaries. Final venue run: **27/27 fetches OK, every P1
  indicator printed a sane value (`P1 COMPLETE`)** — Global relaxed 1/8
  voting, Australia cautious 3/10 (0 excluded); TGJU-gold vs gold-api XAU
  0.04%, gold-api BTC vs Bitstamp 0.02%. Sandbox runs identical except RBA
  (403 → unavailable rows, as designed).

## [2026-10-06] — Insights Phase I1: contracts, scoring engine, backtest

Gate I0 approved same day (D4 answered: no disclaimer for v1). Phase I1 adds
the feature's computational core — **no app code touched; the web/api bundles
are unchanged; nothing deployed.** Tests **313 → 400 — all green**; typecheck
clean in all five workspace packages.

### Contracts (`packages/core/src/schemas.ts`)

- New Insights contracts (rule 3 — single source of truth): `IndicatorId`
  (28 v1 ids; licence-blocked items excluded), group/section/cadence/phase/
  source enums, `WarningRule` (the spec's seven atom kinds plus a flat
  `any-of` OR-composite for us10y), `IndicatorDefinition`, `IndicatorReading`
  (status vocabulary: warning / normal / context / stale / no-history /
  unavailable; `value`/`asOf` are null exactly when unavailable — enforced by
  refine), `SummaryLine` (label is null when nothing votes), `ChangedEvent`,
  `CalendarEvent`, `InsightsSnapshot` (unique-id refine). All exported from
  `@currena/core`; contract tests include deliberate shape-pinning.

### New package: `packages/insights` (`@currena/insights`)

- Pure, platform-free (AGENTS.md rule 2): no node:*, DOM, fetch or clock
  reads — every time reference is an explicit parameter (frozen-clock
  friendly). zod-validating throughout.
- `series.ts` — epoch-day date math, binary-search `pointAtOrBefore`,
  `combineSeries` inner join (ratios/crosses), `yoyPctSeries`.
- `parsers.ts` — FRED CSV / Frankfurter JSON / World Bank monthly / ABS
  period parsers; loud failures; missing markers dropped, never zero-filled.
  These are the parse halves of the Phase I2 adapters.
- `definitions.ts` — all 28 indicator definitions, rules verbatim from
  `01-indicator-spec.md`.
- `scoring.ts` — strict-lower 10-year percentiles; threshold rules incl.
  sustained-weeks anchored on the latest observation; percentile tails;
  pct/points change rules with anchor tolerance (sparse series show dashes,
  never mislabelled windows); yoy-negative; consecutive-decline; above-low;
  info → context; stale detection; `computeReading`, `summarize`
  (sections resolved via the definitions table), `changedSince`.
- **69 tests**: table-driven coverage of every rule type plus edge cases
  (empty series, short history, direction, ties, boundaries, frozen clock).

### Recorded fixtures + backtest

- `packages/insights/fixtures/` (14 files + provenance README, captured
  2026-10-06): 10 FRED series (2004+ / full), Frankfurter USD→JPY/AUD/CNY
  (2004→2026-10-05), World Bank Pink Sheet monthly (2004M01→2026M09), ABS
  headline CPI + trimmed mean quarterly, ABS unemployment monthly. RBA
  absent (Akamai-blocked from the sandbox — documented).
- `pnpm --filter @currena/insights backtest` writes
  **`docs/insights/BACKTEST.md`**: weekly frozen-clock runs across GFC 2008,
  COVID 2020, inflation 2022 and calm contrast 2017/2025, plus a today-run.
  Labels move correctly in every window (2008 global peaks *stressed*
  Oct-2008 7/12 and Australia *alarmed* Dec-08→Mar-09; 2022 *stressed* for
  20 of 52 weeks; 2017 *relaxed* 43 of 52; today: global *cautious* 3/11,
  Australia *stressed* 3/6). Engine constants calibrated against the
  fixtures during the run and documented there (stale thresholds from real
  release lags: 3/16/95/190 days by cadence; percentile floor 30 periods;
  observation-anchored sustained window). Owner-tunable candidates are
  listed with recommendations — spec thresholds themselves are unchanged.

Awaiting Gate I1 approval (backtest / threshold review) before Phase I2.

## [2026-10-06] — Insights Phase I0: source verification + Gate I0 decisions

Docs-only session (no code, no bundle impact). Planning set from commit
`240deb1` read in full; the verify-first probe ran against **every** source in
`docs/insights/03-data-sources.md` with throwaway scripts (nothing committed).

### Data sources — verified register (`docs/insights/03-data-sources.md`)

- **FRED:** 11/11 series live and current, **keyless** via
  `fredgraph.csv` (including the identified government pair
  `A091RC1Q027SBEA` ÷ `W006RC1Q027SBEA`) — **no FRED API key needed**.
  All used series are U.S.-government public domain; `DCOILBRENTEU`
  is EIA-sourced.
- **RBA:** licence **CC BY 4.0** confirmed (via alternate egress); the
  whole domain Akamai-403s the build sandbox — CSV bytes must be
  re-probed from the ingestion venue before Phase I2.
- **ABS:** Data API keyless on `/rest/` — `LF`, `CPI_Q`, `ANA_AGG`,
  `RES_DWELL_ST` current; `CPI_M` stale (keyed Indicator API only if
  monthly cadence is wanted); stale RPPI **replaced by `RES_DWELL_ST`**;
  household ratios → `E2` (verify in I2). Licence CC BY 4.0.
- **Silver / Bitcoin (D3):** gold-api.com primary for both spots (terms
  explicitly permit commercial display); Bitstamp public OHLC for BTC
  history; World Bank Pink Sheet (CC BY 4.0, monthly 1960M01→2026M09)
  for silver history and P2 commodities.
- **Blocked (licence/terms/access):** Coinbase (display prohibited),
  CoinGecko free (screenshots-only + 365-day cap), Coin Metrics
  community (CC BY-NC, 7 points), MetalCharts (nonexistent), Cboe VIX
  (link-out only), S&P 500 / breadth (P3), Stooq (bot gate),
  Blockchain.com (API degraded). **Shiller CAPE deferred P2→P3**
  (Yale data frozen at 2023-09, no licence).
- **Re-verified:** TGJU `ajax.json` (963 symbols, gold ounce fresh) and
  Frankfurter (2026-10-05), cross-consistent. China PMI manual-entry
  plan confirmed (no machine-readable NBS feed).

### Gate I0 decisions (recorded in `docs/PROGRESS.md`)

- **D1 — Cloudflare Free, permanently.** Heavy ingestion via a daily
  GitHub Actions runner writing one compact snapshot per source to KV
  through the Cloudflare REST API; the Worker only reads. Compact
  encoding (consolidated keys, arrays, integer-scaled fixed-point,
  epoch-day dates, rendered series only) keeps usage at ~100–150 KV
  writes/day vs the 1,000 free limit — **no indicator is omitted for
  tier reasons**. KV free limits re-verified live (100k reads/day,
  1k writes/day, 1 GB, **1 KV operation per Worker invocation** → the
  single `insights:snapshot` serve path).
- **D2 — substitutes accepted:** STLFSI4 for stress; VIX link-out;
  S&P/breadth out of v1; CAPE to P3.
- **D3 — silver/BTC sources accepted** (gold-api, Bitstamp, World Bank).
- **D4 — open:** disclaimer reviewer nomination (owner; needed before
  Phase I5, not blocking I1–I4).

Awaiting Gate I0 approval before Phase I1 (contracts + scoring engine).

## [2026-09-20] — Owner wireframe homepage + SWOT v2 + reliability wave

4 commits on `main` (`e3896ec` → this session), 2026-09-20.
Tests **308 → 313 — all green** at every gate; bundle gate held
(288.38 kB / 87.65 kB gz initial JS vs the 290.28/87.77 baseline — the
retired sidebar rail more than paid for the new homepage sections);
precache 59 entries / 2049.25 KiB (+1 entry, +6.4 KiB — About legal
sections + CSS). Every change browser-verified locally (agent-browser
DOM geometry + VLM, en + fa, desktop + 375 px, light + dark) and on
production after deploy.

### Phase A — SWOT v2 (fresh audit against today's code)

- **docs:** `docs/SWOT.md` re-run — production re-probed (health/rates/
  status/history/meta/admin/ETag 304 round-trip), `pnpm audit` CLEAN
  (xlsx CVEs long gone), bundle baseline re-measured identical, delta
  read of everything landed since 2026-09-24 (cron, server history,
  gold, LED boards, retry policy, admin gate). New weakness set is
  maintainability-shaped (the monolith files), the old security set is
  retired. `docs/BACKLOG.md` gained Wave 5 (this session's owner UI
  items) with statuses.

### Owner wireframe — homepage single-column stack (the 8 UI directives)

- **feat(web):** homepage rebuilt per the owner wireframe — full-width
  converting box → **GOLD & CURRENCY LED boards two-up** (gold start
  side; both in the compact CURRENT-only placement) → full-width Quick
  tools section → footer. The desktop two-column dashboard and the
  "at a glance" mini-board (`ConverterAside`) are retired; mobile now
  gets the boards too (`dbd05e2`).
- **feat(web):** ONE shared board component, two placements —
  `LedRateBoard`/`LedGoldBoard` take `showDayStats` (default true);
  `false` removes the DAY HIGH/DAY LOW cells from the DOM and collapses
  the shared subgrid ladder to two tracks at EVERY viewport
  (`.led-current-only`, index.css — re-asserts subgrid so column widths
  stay shared). `/live-rates` untouched: full 3-column board verified.
- **fix(web,a11y):** WCAG 1.4.1 — the retired mini-board's color-only
  live dot is superseded by the boards' text LIVE/CACHED/OFFLINE label.
- **fix(web,a11y):** WCAG 1.4.3 contrast — amount placeholder
  #B39B45→#806215 (≈2.7→5.6:1), dark #5B6B80→#9CA3AF (≈2.6→5.5:1),
  caret #C79100→#8A6D1F; "no change" delta pill muted→gray-700/gray-300
  (≈4.0→8.6:1 light, ≈4.5→8.0:1 dark).
- **feat(web):** nav utility group unified — install · فا · theme ·
  hamburger share one bordered icon-button container
  (`HEADER_ICON_BUTTON_CLASS`), equal 40px hit areas, both themes.
- **feat(web):** trust signals — footer carries Privacy · Terms ·
  Contact · About next to the credit line; the About route gains
  Privacy Policy / Terms of Service / Contact sections (en+fa) with
  sessionStorage-staged deep-link scroll; contact = GitHub (the only
  owner-supplied public channel — no email exists in the repo).
- **rtl:** full fa audit re-run across all 9 routes (en+fa, desktop+
  375 px, light+dark): boards mirror to the start side, no overflow, no
  console errors; digit language decision documented — Persian digits
  (۰۱۲۳) in all standard UI text via `Intl` fa-IR, Latin digits inside
  the DSEG7 LED modules (hardware font, matching the board-date rule).

### Phase B — reliability & i18n wave (BACKLOG items)

- **fix(api):** `/api/health` enriched (BACKLOG #39) — version +
  KV reachability probe (cheapest read); KV failure → 503 + `ok:false`
  for monitors; tests for both shapes (`ae6d6d9`).
- **fix(api):** rate limiting (BACKLOG #18) — per-isolate, per-IP token
  bucket (10 burst / 5 per min) on `POST /admin` +
  `POST /internal/refresh`, checked BEFORE body read or secret work
  (kills the wrong-secret KV amplification); 429 + Retry-After; bounded
  map; documented best-effort (per-PoP isolates). 3 tests.
- **fix(scraper):** `HttpError.code` (BACKLOG #33) — machine-readable
  classification (timeout / dns_or_network / rate_limited / blocked /
  http_4xx / http_5xx) derived from status or abort type; flows into
  `errorToCodeMessage` → status/admin telemetry. All six codes pinned.
- **fix(web):** Odometer respects `prefers-reduced-motion` (BACKLOG #34)
  — final value lands immediately, no rAF count-up.
- **fix(web,i18n):** Receipt/Batch export+share paths through the
  dictionary + `formatNumber` (BACKLOG #27) — fa users now get Persian
  labels AND Persian digits in share text, the receipt paper
  (۲۵٫۵۰ TRY / ۱۲۲٬۸۲۱ IRR (تومان)) and Excel headers; bulk-template
  prefill locale-aware; `navigator.share` titles localized (`58135e6`).

### Verification summary

308 → 313 tests (core 134 · web 17 · scraper 66→67 · api 91→95),
typecheck 4/4 at every commit; agent-browser: golden path (100 USD →
result + LIVE UPDATE), footer deep-links scroll to the About sections,
fa RTL mirroring (gold board start-side), Live Rates full board
unchanged (CURRENT + DAY HIGH + DAY LOW, 0 compact tables), zero
console/page errors everywhere; wrangler dev: enriched health JSON +
11th rapid `/internal/refresh` → 429.

## [2026-09-19] — Ever-green rates + LED shopfront boards session

19 commits on `main` (`732d2df` → `d28f57c`), 2026-09-18 evening → 2026-09-19.
Production live at **https://currena.ir** through Workers versions
`093aaf72` → … → `982cbc43` (final). Tests **279 → 308 — all green** at every
gate; every change browser-verified locally (agent-browser DOM audits + VLM)
and on production, en + fa, desktop + 375 px.

### Ever-green data (fixes the "3-hour-stale rates" report)

- **fix(api):** added the `scheduled` handler + cron `* * * * *` — the same
  ladder runs every minute regardless of visitor traffic (tgju each tick,
  frankfurter on 15-min cadence, fresh-guard caps real scrapes at ~1/5 min);
  measured data age with **zero user traffic: ≤ ~5-6 min** (`732d2df`).
- **fix(scraper):** TGJU cache-bust — `?cb=<epoch-ms>` on `ajax.json`, since
  TGJU's own edge served stale HITs (age 30 min on a 5-min max-age).
- **feat(api):** server-recorded rate history — KV `history:<source>`
  generations, content-fingerprint dedupe (writes only on real value changes —
  free-tier safe), capped 240; recorded from cron + live `/api/rates` scrapes;
  new `GET /api/history` (60 s cache + ETag). Sparklines across the app now
  draw from a shared server history merged into each client at boot — the
  "every currency has the same graph shape" report root-caused (identical
  min-max-normalized local series) and truly fixed (`d28f57c`).

### LED shopfront boards (owner-driven visual identity)

- **feat(web):** dot-matrix LED rate board as the Live Rates hero — DSEG7
  Classic (OFL-1.1) price digits, ghost segments + bulb gradient + halo,
  ticking clock, per-value flash (WCAG-safe), honest derived-quote footnote
  (`732d2df`), then rebuilt as a physical panel: bevel → perforated grid →
  recessed wells → ghosts → dot-matrix bulbs (`824257f`).
- **feat(scraper,core,web):** TGJU's real daily stats — current / day-high /
  day-low ride the snapshot `Rate` entries end-to-end; no invented dealer
  spread (`17169ea`). Shared **CSS subgrid** column lock (headers + every row
  share ONE track definition; measured spread 0.0 px per column) + hot CURRENT
  emphasis (`e8c5837`); currency names +40-50 % / weight 700 with a
  name-first caption layout below md (`a475058`).
- **feat(core,scraper,web):** **GOLD & COINS panel** — 9 TGJU gold/coin
  symbols (ounce in USD, Tehran market), graceful per-item dash degradation,
  same panel language (`b622cee`); gold-heal guard self-fixes visitors holding
  pre-gold snapshots (`8ec6842`); Tehran items converted Rial→**Toman** at the
  one sanctioned place (scraper normalizer) with self-migrating legacy
  snapshots (`97292b1`); phones show a single big CURRENT column on both boards
  (`97292b1`).
- **feat(web):** flags at 2× on the name line; headers/clock/dates in readable
  sans (LED look reserved for price digits) (`5fe3abf`); metal bezel frames —
  six-stop 135° steel + gold ramps with specular highlights, glass-recessed
  boards (`4170a96`, `4eacce9`); per-board headings with emoji, live TGJU
  link pill and last-updated stamp (`1204cba`).
- **feat(led):** fa board date as **«28 شهریور 1405»** (Persian month name,
  day-first logical order) then owner-refined to the RTL `[year][month][day]`
  frame at clock size; TGJU wordmark; `$` prefix on the USD gold-ounce
  modules (`2d91461`, `bf08bf8`).

### PWA & honesty fixes

- **fix(web):** "cached rates" banner/LED blink on boot — banners now render
  only on **confirmed** staleness (server-stale generation or failed fetch),
  never the transient boot hydration (`d782264`).
- **fix(web):** PWA `registerType: 'autoUpdate'` + `skipWaiting` +
  `clientsClaim` + hourly `registration.update()` — every deploy self-applies;
  the "stuck on the previous version" report root-caused (waiting service
  worker that a plain reload never activates) and permanently fixed
  (`6c75ccb`).
- **fix(web,api):** SWOT audit round — receipt/share/history staleness unified
  on `isConfirmedStale`; manifest rebranded **Currena** (was installing as
  "CurrencyPro"); og/twitter share cards; worker security headers (nosniff,
  X-Frame-Options, Referrer-Policy, Permissions-Policy) (`4bd5a9b`).
- **feat(pwa):** Android packaging prep — manifest `id`, real store
  screenshots (narrow 390×844 + wide 1280×720, VLM-verified), app shortcuts
  (Live Rates / Calculator), in-app 📲 install CTA (header + side menu, en+fa,
  `beforeinstallprompt`-driven). The site is fully **PWABuilder-ready**:
  paste currena.ir → Package for Stores → Android → signed APK/AAB
  (`1a80012`).
- **fix(web):** mobile result popup compacted — 3 stacked header rows → 1,
  single Jalali+time line, tightened spacing; measured **378 px** tall at
  390×844 (was viewport-filling), desktop unchanged (`d28f57c`).

### Known considerations

- TGJU remains a single upstream (inherent) — mitigated by cache-busting, the
  ladder, honest notices, the gold self-heal guard, and now server-side
  history (trend data survives upstream hiccups).
- Rate history began accumulating at deploy (2026-09-19 ~04:00Z); shapes
  genuinely diverge as TGJU re-quotes over the coming days. Optional future
  work: seed deeper history from TGJU's own history API (scope-guarded out).

### Open items (next session)

See the hand-off prompt in `docs/BACKLOG.md` lineage — SWOT re-run,
modularization of `apps/web/src/App.tsx` and the route monoliths, performance
& reliability optimization, TGJU history backfill, rate-limit on admin POST.

## [2026-09-18] — Autonomous hardening session

Branch `improve/autonomous-session-2026-09-24` (15 commits, +2,598/−491 lines,
49 files). Live in production at **https://currena.ir** since Worker version
`ddde3962-d0f0-4aab-85c4-04e744638185`.
Audit trail: `docs/BASELINE.md` → `docs/SWOT.md` → `docs/SESSION_LOG.md` →
`docs/FINAL_REPORT.md` (open items live in `docs/BACKLOG.md`).

### Headline metrics

| Metric | Before | After |
| --- | --- | --- |
| Tests (pnpm -r test) | 224 | **279 — all green** |
| Known vulnerabilities (pnpm audit) | 2 HIGH (`xlsx`) | **0** |
| Export-feature vendor chunk | 423.9 kB | **5.6 kB** (zero-dep writer) |
| `Intl` number formatting, 10k ops | 19,511 µs | **624 µs** (31× faster) |
| Web precache bundle | ~2,400 KiB | **1,999.67 KiB** (54 entries) |

### Security & data integrity (Wave 1)

- **fix(core):** settle ledger `__proto__` prototype-key corruption — a crafted
  note could poison `Object.prototype` and corrupt every ledger; added a money
  conservation invariant on persist (`a4bff42`).
- **fix(api):** hardened `/admin` + the KV status trust boundary —
  `SourceStatusSchema` validation on cached status, numeric-field HTML escaping,
  opt-in `ADMIN_VIEW_SECRET` gate (401 + `Retry-After`), 8 KB POST body cap
  (`005fae7`).
- **fix(web):** replaced CVE-laden `xlsx@0.18.5` with a zero-dependency XLSX
  writer; audit went 2 HIGH → 0 and the export chunk shrank 423.9 → 5.6 kB
  (`dd4ebc4`).
- **fix(web):** History delete race (identity-keyed delete) + Settle
  hydration-gated persist — closed a data-loss window on remount (`9b64442`).

### Reliability (Wave 2)

- **fix(api):** scrape-ladder reliability — 25 s scrape deadline, 30 s lock TTL,
  token-scoped locks (crash-safe release), graceful KV-write degradation,
  stale-value propagation on source failure; all covered by tests including a
  real-interleaving stampede test (`da8284f`).
- **feat(web):** reliability pass — ErrorBoundary, prompt-mode PWA update toast
  (workbox-window), honest forced-refresh FAB, collision-safe `uniqueId()` for
  entity IDs (`1ced3d1`).

### Performance (Wave 3)

- **perf(core):** memoized `Intl` formatters — `fa-IR` number formatting 31×
  faster (`b38aca9`).
- **perf(api,web):** `ETag`/`If-None-Match` → **304** on `/api/rates`, 5 s
  isolate snapshot micro-cache, parallel `status()` fan-out, memoized
  `<BoardCardView>`, History formatter hoist (`d041fa3`).

### Correctness & hygiene (Wave 4)

- **fix(core):** symmetric tie rounding (banker-style for .5 remainders),
  display-consistent CSV totals, CSV formula-injection guard, `sourceForPair`
  consolidated into core (6 copies → 1) (`c695fb5`).
- **chore(web,scraper):** dead-code removal (priceScanner block, `readHistory`,
  SCRAPER_VERSION sync) + settle settlement-currency label fix (`db3e22b`).
- **test(core):** penny-mismatch assertion fix — empty note renders as an empty
  CSV field (`76dae79`).

### Documentation & process

- **docs:** pre-session baseline snapshot (`bfc7240`); SWOT audit + prioritized
  39-item session backlog from three parallel deep audits (`2aaefff`); session
  log + final report (`9d91ffb`); production deployment record with the
  `printf`-vs-`echo` secret gotcha (`75866ac`).

### Deployment

- Single deployment topology: Worker `currena-api` serves API + built SPA +
  admin console; Custom Domain **currena.ir** + workers.dev URL, bindings (KV
  `RATES`, `ASSETS`) intact, secrets (`REFRESH_SECRET`, `ADMIN_VIEW_SECRET`)
  persist across versions.
- Post-deploy smoke: **12/12 green** — health, TGJU rates, USD→IRR convert
  parity, AED→EUR 503 messaging, admin gate (401/303/cookie), robots.txt, SPA
  deep link, ETag→304, `/api/status` parallel shape, 413 body cap.
- **Admin gate enabled in production.** Rotate with
  `printf '%s' '<secret>' | pnpm --filter @currena/api exec wrangler secret put ADMIN_VIEW_SECRET`
  (never `echo` — it stores the trailing newline and breaks constant-time
  compare). Delete the secret to return to public mode.
- Rollback: `pnpm --filter @currena/api exec wrangler rollback`
  (previous deployment 2026-09-17T03:12Z).

### Open items (prioritized — see `docs/BACKLOG.md`)

1. Owner rotates `ADMIN_VIEW_SECRET` to their own value
2. Legacy pythonanywhere origin decommission (owner decision, outside repo)
3. Cron pre-warmer `[triggers]` decision
4. TGJU Path-B relay (fallback scrape path)
5. Multi-currency settle ledgers
6. zod `.strict()` request contracts
7. Expanded web tests (rate-history, recent-pairs, router, meta parity)

### Wrap-up (2026-09-18 ~16:20 UTC) — pushed & redeployed

- Final gate re-run at HEAD: typecheck **4/4 packages**, tests **279/279 green**.
- `main` (17 commits, through the changelog wrap-up) and branch
  `improve/autonomous-session-2026-09-24` pushed to
  `github.com/assadigit/Currena` — `origin/main` now matches local exactly.
- Production redeployed from the final HEAD to pin the version marker (runtime
  identical to `ddde3962…` — every commit after `9d91ffb` is docs-only).
- Post-deploy smoke re-verified live: health, TGJU rates, USD→IRR convert
  parity, admin gate.
- Credentials hygiene: push/deploy tokens were supplied via environment
  variables only and were never written to disk, config, or git history.

## Earlier history

See `git log` for the pre-session history on `main` (through `bf61524`).
