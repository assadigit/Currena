# Start prompt for the v9 session — the customizable chart

You are working in the Currena repository (github.com/assadigit/Currena, Cloudflare Workers, site currena.ir). The **Compound Wealth** tool is live at https://currena.ir/tools/compound-wealth, complete to spec v6 + the v8 addendum — every gate green when v8 shipped at 11:20 UTC on 2026-11-27 (six reference PASS lines, maths 103/103, browser harness 79/79, grid replay 1200/1200 with 15/15 through the real interface, Lighthouse 99/97, lint clean; the record is in `COMPOUND-WEALTH-REPORT.md`'s v8 section and `COMPOUND-WEALTH-TEST-REPORT.md`). The v8 pass added the outcome visuals: the share bar under the tiles, the what-if micro-bars, the compare bars, the card parity and the fa toggle's label-in-name fix.

My direction for this session, in my own words: **"I want the graph to have filters, like you can turn off some of them — for example only show your current money vs future potential money — then if you wanted add the line of S&P, gold etc, so we have a customizable graph."**

This is the **v9 addendum** (committed as `COMPOUND-WEALTH-V9-PROMPT.md`). `COMPOUND-WEALTH-SPEC.md` (v6 + the v8 amendments) stays governing except for this pass's own amendments. The most important rule is unchanged: **the tool must stay simple.** The engine, the tiles, the headline, the cards and every number stay exactly as they are — this pass touches only what the chart draws.

## What the request means against the current code (read this, do not re-discover)

- The chart already draws thin comparison lines for every non-selected asset plus cash (`otherLines` in `app.tsx`) — **always on**. So "add the S&P/gold line" is already built; what is missing is the **control**: today a visitor cannot turn anything off or on, and the always-on lines make the default chart busy.
- The chart's series are: the put-in area + its line, the growth area, the total (value) line, the what-if band, one dashed line per other asset, the cash dotted line, plus the always-on milestone dots and crossover mark (annotations, not series).
- The engine already computes every comparison line as the same plan at that asset's own figures (`computeCompound` with `figuresOf(chip)`) — no new maths is needed for any of this.

## Do this, in order, on your own

0. **Preflight.** Branch `compound-wealth-v9` from `compound-wealth-v8` (the deployed tip). Run the v8 gates unmodified and record the starting state — six PASS lines, 103/103 maths, 79/79 harness, 1200/1200 + 15/15 grid, lint — before any feature work.

1. **The filter row.** Under the page chart, one row of small toggle chips — real buttons with `aria-pressed`, the group named ("Show on the chart"), one chip per series: the four core layers (Put in / Growth / Total / Range) and one per comparison line (each other asset + Cash; the selected asset is the plan and has no chip). Each chip's swatch mirrors its series' own stroke so the row doubles as the chart's key. Defaults: the four core layers ON (your plan only — the calm chart), every comparison line OFF (opt-in, exactly as I asked). One caption line when any comparison is on: "Other lines: the same plan at each asset's own average return."

2. **The behaviour.** Toggling changes only the drawing — never a number (lock this with a test). The y scale fits only what is drawn. The chart can never go empty: the last drawn series' chip is disabled. Milestone dots and the crossover mark always draw and clamp into the plot when the scale shrinks. Reload resets the toggles; nothing is stored (store-nothing unchanged).

3. **The label mapping.** The page chart's two end labels become "Put in" and "Total" — each its chip's own word — so the key maps 1:1 (this also retires the long "Money you put in" label that grazed the right edge at 360–390px). The A4 and phone cards keep the v6 "Money you put in"/"Growth" wording (they have no chips). fa/RTL fully translated with Persian labels.

4. **Tests, spec, reports.** Extend the browser harness (defaults, the owner's example view, the opt-in benchmarks with the caption, the never-empty guard and its release, the numbers-invariance lock, toggle semantics, fa/RTL, the 360px wrap, the chips reusing the page's own chip colour pairs, store-nothing, the all-on state restoring the recorded v8 look) and the allowed-prefix lists for the new chips. Amend the spec (§5.1.4, §12 tests 44–47, §13.11, Appendix A.2 cuts). Update both reports with the v9 sections.

5. **The finish.** All gates green with evidence; commit and push `compound-wealth-v9`; deploy the worker; verify live end-to-end (the golden path with the filters, fa + dark, screenshots to `docs/compound-tests/`, zero console/page errors, axe with any delta explained, Lighthouse, the JS delta measured honestly from two full worker builds).

## Cuts (decided, do not re-propose)

Remembering toggle choices across reloads (store-nothing wins); a type-your-own comparison-rate chip (Custom rate mode exists); per-series y-axes or axis numbers; filters on the A4/phone cards; animated transitions; reordering the chips.
