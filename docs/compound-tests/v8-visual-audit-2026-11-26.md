# The v8 visual audit — how the compound wealth tool shows its outcomes (2026-11-26)

The owner's direction for v8: **more visuals, so the outcomes are easy to
understand.** This record grounds `COMPOUND-WEALTH-V8-PROMPT.md`.

**Method.** The live v7 page (deployed 2026-11-26) opened in a real browser at
1440×900 and 390×844, full-page screenshots taken (the two PNGs beside this
file); the tool's code read in full (`chart.tsx`, the results sections of
`app.tsx`, `cards.tsx`, the engine's output types); and both screenshots
inspected by the vision model (glm-5.3-flash) under a visual-communication
brief. All three agree on the findings below.

## 1. The visual inventory today (v7, live)

| Surface | What it shows | Form |
| --- | --- | --- |
| The main chart | Stacked areas (money you put in / growth), the what-if band, dashed lines for the other assets + cash (right-edge end labels), crossover marker ("overtakes …"), milestone value dots, year ticks (Jalali in fa) | Hand-built SVG, one chart, the page's only data visual |
| Three tiles | You put in / Growth added / You could have, Future↔Today toggle, inflation + tax captions | Text |
| Milestones ("Along the way") | Up to 3 thresholds with month-year (+ age) | Text list |
| What if… | Small changes, starting later (1/3/5), cash comparison, costs line, tax-takes line | Text tiles |
| Compare assets | Rate / final / low / high per asset + cash | Text table, inside a collapsed group |
| Phone card | Big final, today beneath, plan line, stacked-area sparkline, next milestone | SVG spark + text |
| A4 card | Print chart (fixed-size variant of the same family), tiles, milestones, assumptions | SVG + text |
| Sticky mobile bar | Final + today | Text |

## 2. The findings

### 2.1 Defects in the one chart we have (fix these first)

1. **A live clipping defect at phone width:** the right-edge end-label column
   is too narrow at 390px — the vision model read the clipped label as
   "Money you p" (real: "Money you put in"). `chart.tsx` reserves only
   `max(78, 16% of W)` px of right gutter; a 10px "Money you put in" label
   needs more than 390-scale widths give it.
2. **No y-axis values at all:** three faint gridlines, zero money labels —
   magnitudes are unreadable except at three tiny on-curve milestone callouts.
3. **The right-edge label cluster collides:** milestone value labels stack
   with the line end-labels ("50,000" sits inside the S&P 500 / better / Gold
   / World shares group); the end-label pusher keeps labels 11px apart but
   does not account for the milestone labels.
4. **The crossover label rides the top edge** at phone widths.
5. **The dashed comparison lines are indistinguishable from each other** when
   several are close (dashes differ but at 1px stroke and 360px width they
   read as one grey family; only the end labels disambiguate — which is also
   the clipped cluster).

### 2.2 The outcome gaps — what a reader cannot *see* today

1. **The final balance's composition is never shown graphically.** "You put
   in 24,000 / Growth added 26,800 / You could have 50,800" is the single
   most important idea of the tool, and it exists only as three numbers.
2. **Today's money is invisible on the chart.** The Future↔Today toggle
   changes the tiles and headline, never the chart — inflation's bite, the
   gap between the two numbers, is not drawn anywhere.
3. **The what-if deltas are sentences only.** "10 more a month adds 5,080" —
   both audits asked for the same thing: small comparison bars so the
   difference is *seen*, not just read.
4. **The compare table is numbers only** (and hidden in a collapsed group —
   its shape, which asset wins and by how much, is never drawn).
5. **Milestones exist twice, disconnected:** dots without dates on the chart,
   dates without dots in the text list. Neither shows *when* on the plan's
   own timeline.
6. **The v7 trust lines (costs took / tax takes) are text only.** The page
   has no visual for what costs and tax remove.

### 2.3 Context that bounds any fix

- The simplicity contract (spec §0.1) is supreme: the default screen's
  control inventory is fixed; everything new must be additive, quiet, and
  below the chart or inside the existing collapsed groups.
- Spec §10: reuse the Insights chart approach, **no large new libraries** —
  the house hand-built SVG family (TOKEN palette light/dark, INK for print,
  `dir="ltr"` in both locales, colour never the sole carrier, direct labels).
- The engine is already sufficient: `CompoundResult` carries series, band
  series, finals, put-in, growth, milestones (future + today), crossover,
  fees, after-tax rate. **No engine change is needed for any candidate below.**
- Budgets that must not regress: one-screen fit at 360/390/430, sticky bar,
  Lighthouse ≥98/97, axe zero new violations, store-nothing/no-network.

## 3. The candidate list — what fits and what does not

| # | Candidate | Verdict | Why |
| --- | --- | --- | --- |
| 1 | Y-axis value labels (2–4 nice-money ticks, gridlines move to the ticks) | **Fix in v8** | Finding 2.1-2; magnitudes become readable; localized digits |
| 2 | End-label fit at narrow widths (measure labels; wrap-below legend when the gutter can't fit — kills the "Money you p" clip) | **Fix in v8** | Finding 2.1-1, a live defect |
| 3 | Label-collision polish (milestones vs line labels; crossover label inside the top bound) | **Fix in v8** | Findings 2.1-3/4 |
| 4 | **Composition bar** — one slim stacked bar (put-in vs growth) under the tiles, following the Future/Today toggle; the same thin bar on the phone card; on the A4 card only if it still fits one page | **Build in v8** | Finding 2.2-1; the outcome at a glance; trivially RTL-safe |
| 5 | **What-if mini-bars** — 2–3 slim same-scale bars per existing what-if tile (base vs variant), including the costs/tax lines when on | **Build in v8** | Findings 2.2-3/6; the sentences stay the accessible content (bars `aria-hidden`) |
| 6 | **Today's money on the chart** — when the existing tiles' toggle is on Today, redraw in today's money and keep the future curve as a thin dashed labelled context line; toggle off = exactly today's chart | **Build in v8** | Finding 2.2-2; no new control (the toggle exists); pure display transform |
| 7 | **Compare bars** — one horizontal bar per asset above the table, inside the collapsed compare group | **Build in v8** | Finding 2.2-4; zero default-screen cost |
| 8 | **Milestone timeline** — a slim rail with the dots at their months, the existing threshold/date/age lines beside their dots; today view re-anchors | **Build in v8** | Finding 2.2-5; if 360px fights it, fall back to rail + the existing list |
| 9 | Hover/tap scrubbing, tooltips | **Not built** | Explore, not understand; touch precision at 360px; a11y + test burden; the calm static house style |
| 10 | Load/draw-in animations | **Not built** | Motion without understanding; Lighthouse risk; no animation is the house style |
| 11 | A separate per-year bar chart | **Not built** | Redundant with the area chart + the composition bar |
| 12 | Interactive legend toggles | **Not built** | New controls; the end labels already name every line |
| 13 | Gauges, heatmaps, funnels | **Not built** | Novelty; AA + RTL burden; wrong tone |
| 14 | Log-scale axis | **Not built** | Jargon-adjacent; the curves stay readable linear |
| 15 | Any chart library (d3, recharts…) | **Not built** | Spec §10 forbids the dependency; the hand-built SVG family is the pattern |

## 4. The evidence

- `v8-audit-live-desktop-1440.png` — the live page, 1440×900, full page.
- `v8-audit-live-mobile-390.png` — the live page, 390×844, full page.
- Both vision-model analyses (2026-11-26, glm-5.3-flash) quote the clipped
  "Money you p" label, the missing y-axis, the right-edge cluster, and rank
  the composition visual, the what-if bars, the today's-money view and the
  milestone timeline as the top gaps — the four candidates built above.
- Code: `src/components/compound/chart.tsx` (the gutter calculation at lines
  ~197, the end-label push at ~306, the milestone markers at ~261, the
  crossover label at ~273), the results sections of
  `src/components/compound/app.tsx` (~1062–1361), `src/lib/compound/maths.ts`
  (`CompoundResult` — everything the candidates need is already there).
