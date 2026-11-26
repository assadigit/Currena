# Start prompt for the v8 session — the visuals pass: outcomes you can see

You are working in the Currena repository (github.com/assadigit/Currena, Cloudflare Workers, site currena.ir). The **Compound Wealth** tool is live at https://currena.ir/tools/compound-wealth and **complete to spec v6 + the v7 tax layer**: every gate was green on 2026-11-26 — the reference selftest 10 lines PASS, maths 141/141, browser harness 86/86, the grids 1200/1200 + 15/15 and 3600/3600 + 21/21 through the real interface, Phase A 32/32, Lighthouse 98–99/97, lint clean. The record is in `COMPOUND-WEALTH-REPORT.md` §10–11 and `COMPOUND-WEALTH-TEST-REPORT.md`.

My direction for this session: **make the outcomes easy to understand with more visuals.** The tool currently has exactly one data visual (the chart); everything else is sentences and numbers. The visual audit grounding this session is `docs/compound-tests/v8-visual-audit-2026-11-26.md` (the live screenshots and the findings live there — read it first). This prompt is the **v8 addendum** (also committed as `COMPOUND-WEALTH-V8-PROMPT.md` in the repo root). `COMPOUND-WEALTH-SPEC.md` (v6 + the v7 amendments) stays the governing document except for the specific amendments in step 7; every existing rule — above all the simplicity contract — applies unchanged.

Two rules sit above everything this session:

1. **Simplicity stays supreme.** The default screen's control inventory is **exactly v7's** — no new controls anywhere on the default screen, no new groups, nothing that was hidden becomes visible. Every new visual is additive and quiet: it sits below the chart, inside existing tiles, or inside existing collapsed groups. If anything here conflicts with simplicity, simplify, push it deeper, or cut it and say so in the report.
2. **The engine is untouched.** `src/lib/compound/maths.ts` gets **zero diff** this session. Every number the new visuals show already exists in `CompoundResult` (series, band series, finals, put-in, growth, fees, milestones future + today, crossover, after-tax rate). Anything that seems to need an engine change is a sign the visual is too clever — simplify instead, and record the decision.

## Where things stand (read this first, do not re-discover it)

- v6 + v7 state and evidence: `COMPOUND-WEALTH-REPORT.md` (§10, §11) and `COMPOUND-WEALTH-TEST-REPORT.md`.
- The audit: `docs/compound-tests/v8-visual-audit-2026-11-26.md` — the inventory, five chart defects (the live "Money you p" label clip at 390px among them), six outcome gaps, and the candidate list with verdicts. This prompt follows its verdicts.
- The code: `src/components/compound/chart.tsx` (the SVG family: page / print / spark variants, TOKEN + INK palettes, `dir="ltr"` in both locales, end-label collision pushing), the results sections of `src/components/compound/app.tsx` (~1062–1361: chart, tiles, milestones, what-if), `src/components/compound/cards.tsx` (A4 + phone cards), `src/lib/compound/content.ts` (all copy, EN + fa).
- Known open items to carry, not silently drop: the figures' common quarter-end stays unachievable (blocked doors recorded in `docs/compound-tests/figures-research-2026-11-26.md` and report §11.4); the site palette's sub-AA tokens stay an owner decision (do not touch them); the owner's Cloudflare account ID ends `…e852` (the credentials note once carried `…e85b` — v7 §11.5.8 recorded the trip).
- The v7 tax layer is off by default and stays exactly as it is. **Tax off = v7 exactly** remains the strongest regression in the suite; the v8 work must not disturb it.

## Do this, in order, on your own

0. **Preflight.** Branch `compound-wealth-v8` from `compound-wealth-v7`. Run the v7 gates unmodified and record the starting state: `python3 compound_reference_check.py --selftest` (10 PASS lines), `bun test tests/compound-maths.test.ts` (141/141), `bun tests/compound-browser-harness.ts` (86/86), `bun tests/compound-grid-replay.ts` (1200/1200 engine + 15/15 live), `bun tests/compound-grid-replay-tax.ts` (3600/3600 + 21/21 live — keep it its own gate; this sandbox chokes on two heavy browser sessions in one process), Phase A `bun tests/compound-phase-a.ts` (32/32), `bun run lint`. If any gate is red, stop the visual work: fix the regression first and record it.

1. **Fix the chart's own defects first — the existing chart, repaired, not redesigned.**
   - **Y-axis values:** 2–4 round-money ticks (a nice-number helper: 1/2/2.5/5 × 10^k) spanning 0..max; the gridlines move onto the ticks; each tick gets a small muted value label in the left gutter. Never more than four labels; localized digits (Persian in fa); compact enough to fit at 360px width (choose the form — compact or full — and record it).
   - **End-label fit:** no label may ever clip. Measure the end-label strings; when the right gutter cannot fit them at a given width, drop the gutter and render a compact wrap-below legend strip (dash-pattern swatch + name per line) under the chart at those widths instead. The "Money you p" clip at 390px is the regression that must die: test that no chart text node is clipped at 360, 390, 430 and desktop widths.
   - **Collisions:** the milestone value labels never collide with the line end-labels (extend the existing push logic); the crossover label always sits inside the plot's top bound.
   - **Identity:** with Future money shown and nothing optional set, the chart keeps the exact v7 information set — same lines, areas, band, markers, crossover, end labels; the only changes are the added axis values and the fit fixes. No new colours, no re-styling.

2. **The composition bar — the outcome at a glance (the audit's #1 gap).**
   - One slim horizontal stacked bar directly under the three tiles: segment 1 the money you put in (muted fill), segment 2 the growth (accent fill), both labelled with their plain names and values (same wording family as the tiles), showing the currently selected money view (it follows the Future ↔ Today toggle; in today's money both segments deflate, consistent with the tiles).
   - Rules: growth clamps to a zero-width segment when negative (the tile above already carries the number); the bar is `aria-hidden` with one sr-only sentence carrying the same split; labels match the existing caption sizes on the page and the ≥14px minimum on the phone card; EN + fa, Persian digits in fa, the house `dir="ltr"` chart convention.
   - **Phone card:** the same thin bar under the big number, before the sparkline — safe zones respected, no clipping at the three sizes, min text 14px at 390px.
   - **A4 card:** add it under the three tiles only if the card still fits exactly one page under the existing drop order; if it overflows, the bar drops (it enters the drop order) — record whichever happens.

3. **The what-if mini-bars — see the difference, not just read it.**
   - Inside the existing what-if tiles, each sentence gains 2–3 slim same-scale bars drawn from the numbers the sentences already print: small changes (base / more / less), starting later (base / later), cash comparison (asset / cash), and — only while costs or tax are on — the costs / tax-takes lines (base / with costs or tax). Same scale within a tile; length ∝ final value; muted vs accent fills from the TOKEN palette; roughly 10–12px rows.
   - The sentences stay the accessible content: bars are `aria-hidden`; no new controls; nothing new becomes focusable; no animation. If a tile's bars cannot stay legible at 360px, that tile keeps its sentence only — record it.

4. **Today's money on the chart (the audit's biggest outcome gap).**
   - When the tiles' existing Future ↔ Today toggle is on **Today's money**, the chart redraws in today's money — line, both stacked areas, band and milestone dots all deflated by `(1 + inflation)^(m/12)` (a pure display transform; the engine is untouched), and the future-money curve stays as a thin dashed context line. Both curves get direct end labels ("in today's money" / "in future money" or the established short forms). The chart's aria summary follows the view.
   - The toggle on **Future money** (the default): exactly today's chart, no today line. No new control anywhere — the tiles' toggle is the only switch.
   - Consistency pin (tested): the today curve's last point equals `finalValueToday`; the crossover marker does not move (the deflation is per-month uniform for both series, so the crossover month is invariant — verify and pin it).

5. **The compare bars — inside the collapsed group, zero default cost.**
   - In More options → Dates and compare, above the table: one horizontal bar per asset (final values, largest first, the selected asset accented, cash muted), each row named — the same data, the same cost/tax rules as the table, which stays under it. EN + fa, Persian digits, the house chart direction.

6. **The milestone timeline — the *when* made visible.**
   - "Along the way" becomes a slim horizontal rail spanning the plan with one dot per shown milestone at its month position; the existing lines (threshold, month-year, age) sit beside their dots, keeping every piece of today's information. The today view re-anchors to the today milestones. If two labels collide at 360px (early thresholds cluster), stagger above/below the rail; if the rail still fights the phone, fall back to rail-dots above the existing text list — the information never drops, and the decision is recorded.

7. **Tests, spec and reports.**
   - **The identity gate (new, the session's strongest):** with defaults, every number and sentence on the page equals v7 — headline, tiles, captions, what-if lines, milestones information, compare table, How fold. Evidence pasted into the report. `git diff` on `src/lib/compound/maths.ts` is empty.
   - **Unit:** only for the new pure helpers (nice ticks, label-fit/measure, the deflation transform) — small; the 141/141 suite stays untouched.
   - **Harness (86 → your count):** axis labels present, localized, ≤4; no clipped chart text at 360/390/430/desktop (the "Money you p" regression); end labels never overlap; composition bar present, follows the toggle, matches the tiles, fa + Persian digits, aria sentence; what-if bars present with lengths proportional on pinned scenarios; today's-money chart on/off with the labels and the consistency pin; compare bars only inside the collapsed group, sorted, matching the table; timeline carries the same milestone information; phone-card bar with safe zones and the three sizes; A4 still one page; store-nothing and no-network re-checked; the full keyboard path unchanged; axe (light + dark, EN + fa) zero new violations; plain-language budget over any new copy (labels are fragments; no new jargon — "future money / today's money" wording stays).
   - **Spec amendments** (minimal diffs in place): §5.1.4 gains the axis values, the label-fit rule and the today view; the tiles' item gains the composition bar; §5.2 gains the mini-bars and the costs/tax bar rule; §5.3 gains the compare bars; §6.4 gains the timeline note (same information); §8.1/8.2 the card notes; §12 the new tests numbered onward from 52; §13 the v8 definition of done; Appendix B the v8 owner decision (the visuals pass). Everything else untouched.
   - **Reports:** the v8 section in `COMPOUND-WEALTH-REPORT.md` (what changed, the decisions log, the audit linked) and the v8 pass in `COMPOUND-WEALTH-TEST-REPORT.md`.

8. **The mobile + quality pass.**
   - One-screen rule at 360×800 / 390×844 / 430×932 re-verified (the controls are unchanged; the new visuals live below the chart — confirm nothing pushes the controls off-screen and the sticky bar still covers the results without covering the last what-if row).
   - Every new element AA in light and dark (the shared palette tokens stay untouched, still the recorded owner decision); Lighthouse (mobile, live, after deploy) not below 98/97 — record the numbers either way; zero new axe violations; static SVG only, no animation anywhere.

9. **Finish.**
   - The complete v6 + v7 acceptance set unmodified plus every new v8 check, all green with evidence.
   - Deploy exactly as before: `NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build && bunx wrangler deploy` (account ID ending `…e852`). Re-verify the live page: both grid subsets through the real interface (15/15 + 21/21), the golden path with every new visual present at desktop + 390px in EN + fa, light + dark, screenshots into `docs/compound-tests/v8-live-*`, zero console errors.
   - Small, clear commits on `compound-wealth-v8`; push. Rollback: revert the v8 commits, or `git checkout compound-wealth-v7 && NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build && bunx wrangler deploy` — the engine never changed, so rollback is pure presentation.

## Deliberately not built (the audit's verdicts — list in the report's v8 section)

Hover/tap scrubbing and tooltips (explore, not understanding; touch precision at 360px; a11y and test burden; the calm static house style); load or draw-in animations (motion without meaning; Lighthouse risk); a separate per-year bar chart (redundant with the area chart and the composition bar); interactive legend toggles (new controls; the end labels already name every line); gauges, heatmaps, funnels (tone and AA/RTL burden); log scale (jargon-adjacent, unnecessary); any chart library — d3, recharts, or others (spec §10 forbids the dependency; the hand-built SVG family is the pattern and stays).

## Rules

- Simplicity first. The default screen keeps the exact v7 control inventory; tax off = v7 exactly; the engine (`maths.ts`) has zero diff.
- Never ask me questions. Make the best decision, write it in the report, and continue.
- Never invent a number. Every number a new visual shows comes from the engine's existing results — no new figures, no new rates, no derived statistics the page does not already print. Never mark a test PASS without evidence.
- Never show the person's income or salary on a card, in the URL, or in storage (the v7 privacy rules carry over; the new visuals are no exception). Store nothing; no data network calls.
- Do not break, move, rename or restyle existing pages. Insights, the converter, the narrator and the gold pages stay unchanged.
- Plain language everywhere, calm tone, the one strong sentence unchanged; no finance jargon in visible text; colour is never the sole carrier (labels, dash patterns and sentences stay).
- Every new visual is hand-built SVG in the house family: TOKEN palette for the screen, INK for print, `dir="ltr"` in both locales, EN + fa with Persian digits in fa, AA in light and dark.
- Every new or touched module keeps a clearly-marked configuration block at the top, with comments in plain English.

## Definition of done (v8)

1. Preflight gates recorded; any red gate fixed before feature work.
2. Engine zero-diff; the unmodified v6 + v7 suites all pass (reference selftest 10 PASS, 141/141, 86/86 + the new checks, 1200/1200 + 15/15, 3600/3600 + 21/21, 32/32, lint).
3. The numbers-unchanged identity gate: with defaults, every displayed number and sentence equals v7, with evidence.
4. The chart defects fixed with regression checks (no clipped label at the four widths, axis values present, no collisions).
5. The composition bar, the what-if mini-bars, the today's-money chart view, the compare bars and the milestone timeline all present, localized and tested; every defect found along the way fixed with a regression test.
6. The mobile contract re-verified at the three sizes; the sticky bar intact; Lighthouse not below 98/97, recorded; zero new axe violations.
7. Spec amended per step 7; both reports updated with the v8 sections, decisions log and the audit link.
8. Live deploy verified end-to-end: the grid subsets through the real interface, the golden path with every new visual in EN + fa, light + dark, screenshots in `docs/compound-tests/`, zero console errors.
9. Insights, the converter, the narrator and the gold pages unaffected.

## Credentials

I will give you the GitHub push token and the Cloudflare deploy token + account ID at the start of the session. Never write them into a file, a commit, or the report.
