# Gold UX Redesign — Session 8 Implementation Report

> Agents: read `AGENTS.md` in the repo root first, and follow it for this whole task.

**Session:** 8 of 9 — mobile-first refinement, interactions and accessibility (`CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` §10, Session 8)
**Branch:** `feat/gold-redesign-s8` (this report rides the branch; merged to `main` at the close)
**Date:** 2026-11-2x
**Companion records:** `DECISION_LOG.md` S8-D1…S8-D7 · `docs/HANDOFF.md` (the session block) · `CHANGELOG.md` (the dated entry) · `docs/DEPLOY.md` (the deploy record) · the screenshots `baseline-screenshots/s8/` + the README

---

## 1. What this session built (the milestones)

### M0 — the baseline audit (the evidence before the remedies)

`apps/web/visual/probe-s8-audit.mjs` (the probe-overflow/probe-contrast lineage): a nine-pass matrix (390/360/1440 × en/fa × light/dark + reduced-motion) measuring overflow, the sticky nav's geometry, touch targets, the LABEL census, the both-themes contrast sampling, and reduced-motion survivors. Its findings drove everything below — including **three defects the previous sessions' evidence had hidden** (§2).

### M1 — mobile 390 as a DELIBERATE layout

- **The section nav rebuilt as the ONE-row chip-scroller** (the shipped `.ln` pattern): the English chip row at 390 wrapped to THREE rows (132px — a sixth of the viewport, and taller than the sections' own 96px anchor margin, so the anchor jumps LANDED UNDER the bar by 36px). Now: one nowrap row (56px), hidden scrollbars, a JS-toggled direction-aware edge fade (`.gold-nav-track`, both themes, RTL-aware), the ACTIVE chip centers itself (physical-pixel `scrollBy` — one code path for LTR/RTL), 44px chips (were 36px).
- **The touch floor**: the ledger link 23→44px; the Signals show/hide toggle 24→44px; the lane drill links and the seat cross-page links padded to ≥24px (WCAG 2.5.8's floor — they are secondary drill-ins beside 44px+ primaries); the whole-card seat openers were already ≥44px (the stretched-button pattern). The documented policy: **primary controls ≥44 · secondary cross-links ≥24 · inline sentence links exempt** (2.5.8's inline exception — the narrative's family names, the decomposition's terms, the source attributions).
- **The five-force patterns at 390**: verified as already right (the VLM read + the probe) — lanes stack full-width, BeamGlyph below `lg` with the brass on tap, seat chips wrap in-flow, no truncation. No change needed; the evidence set captures it.

### M2 — RTL/LTR and light/dark correctness

- **No horizontal overflow at 390/360/1440, en+fa, both themes** — the sanctity rule held at the baseline AND at every milestone (the checks suite enforces it now).
- The fa long labels ride the scroller (`whitespace-nowrap` + scroll, never clip); the RTL fade sits on the LEFT edge (verified in the capture + the DOM state: `fadeStart=false, fadeEnd=true` at the RTL reading origin).
- The sticky chrome never obscures content or focus: the anchor margin (below) clears the docked bars by 4px at both breakpoints, and `scroll-margin` applies to focus-triggered scrolling as well as anchor jumps.

### M3 — the interaction contract

- **The chart inspector's missing text equivalent** (11 §8 item E): the keyboard crosshair moved but SPOKE nothing — the hover tooltip was `aria-hidden` and no live region existed. Now a persistent polite `role="status"` region (`data-chart-inspector-readout`) reads the selected point (value + unit + full localized date) on every arrow/Home/End move; Escape clears it. The visible tooltip stays aria-hidden (one announcement, never two).
- **The weak chart names upgraded from title-only to full readings**: the premium-history chart («حباب هر دو سکه بر ارزش ذوب، از … تا …؛ آخرین: امامی …، بهار …») and the London-vault sparkline («موجودی طلا در … ماه: … تن تا …»). Four new keys, both locales, **copy round 94** (the manifest 9,265 → 9,269).
- **The sheet contract verified at BOTH widths** (the checks suite): the record sheet is ONE component with two geometries — desktop the inline-end sheet (`min(440px, 92vw)`, docked to the layout edge), mobile the bottom sheet (full width, docked, ≤88dvh, safe-area padded) — with the focus trap, Escape, focus return and body scroll lock exercised at both.

### M4 — the contrast matrix AS A CHECK

- **`gux-s8-checks.plw.ts` (13 validations, the `gux-s8` playwright project)** — Session 4's both-themes token rule now RUNS: the matrix samples the status words/marks/labels in **both themes × both locales**, computing WCAG ratios with a parser for the formats `getComputedStyle` actually returns (hex tokens, `rgb()`, `color(srgb)`, `oklab()` — the S8 audit found the S5–S7 probes' rgb-only parsers silently skipped exactly those); **the token rule** asserts every sampled status color IS a resolved theme token; the overflow sanctity; the touch floors; the LABEL census (every chart root named, with a roleless-chart sweep); the inspector readout; the sheet's two geometries; the color-not-alone structure (every seat lean, lane state, briefing word and lanebar tally carries its word); and reduced motion.
- **The measured matrix** (light | dark): lane state word 5.00 | 4.77 · seat lean word 7.98 | 7.70 · briefing word 4.78 | 5.46 · seat card label 10.98 | 13.60 · body text 4.83+ | 6.45+ — **every pair passes its WCAG AA floor** (4.5:1 text; the graphics carry words so 3:1 never applies to a lone hue).
- **No status depends on color alone**: verified structurally (the words ride every mark) + the shape/dash/word contracts held (the M/C/X/K legend, the pill's aria-hidden with the row's spoken name, the seat lean word beside the mark).
- **Reduced motion**: the audit found 102 elements still declaring transitions under `prefers-reduced-motion` — mostly harmless color fades, but nine chevron `transition-transform`s genuinely moved. **One global guard** in `index.css` now makes the house's own stated contract ("All motion is disabled under prefers-reduced-motion") true by construction (0.01ms durations, single-iteration animations, `scroll-behavior: auto`); the check proves nothing moves.

### M5 — the honest states, rendered and verified

- **`gux-s8-states.plw.ts` (7 forced-state tests + captures)** over in-memory route interception (the GB-S4 overlay pattern — the fixture files never change): **LOADING** (the deferred projection's honest loader; the gate release completes the load), **ERROR** (no cache + 503: the honest title + the retry that recovers), **STALE/CACHED** (the outage keeps the last good copy, «نمایش آخرین نسخهٔ سالم» labelled), **UNAVAILABLE** (the premium/vault/OHLC planes say so — never zeros), **INSUFFICIENT HISTORY** (the if-bought + episode-path waiting lines), **PARTIAL DATA** (the dark seats' why-lines + the absent-count line), **DISCOVERABILITY** (the technical tiers one tap away, collapsed).
- **The real bug the pass caught**: the narrative's `windows.reduce` had no initial value — a projection with the price reading absent (a dead source, honestly declared in `absentIds`) threw "Reduce of empty array" and took the WHOLE route to the error boundary instead of rendering the honest partial page. Fixed (`''` + the price fact simply renders null) with the regression pin in `GoldPage.test.tsx`.

### M6 — the close

The docking fix (§2), the evidence set (§4), Q3 presented (§5), this report, S8-D1…D7, the HANDOFF/CHANGELOG records, the merge, the deploy (the D-43 re-check first).

---

## 2. The three defects the audit surfaced (the honest record)

1. **The S5–S7 "dark" captures were light.** The screenshot harness wrote `localStorage['currena:theme']` — an INERT key; the app reads the LEGACY `theme` key (`lib/theme.ts` + the `index.html` pre-paint script). Every "dark-mobile" pair in the s5/s6/s7 sets is a light render (verified: average RGB ≈ 240 on the S7 "dark" PNGs; `html.class` empty under the old key). The S8 set re-captures with the real key — its dark pairs measure RGB ≈ 30. The historical sets stand as records of what was verified THEN (their light-mode evidence is unaffected); no claim they contain is relied on for dark mode.
2. **The sticky nav has been invisible while stuck since S5.** The S5-shipped `sticky top-0` slid the whole bar under the FIXED global header (`z-[1000]`, 64/80px tall) the moment it stuck. The S6 explorer captures show no chips; the S8 probe measured `navTop 0 < headerBottom 64`. 11 §12 item 5's own spec — "the mobile section index docks under the global header" — is now implemented (`top-16/lg:top-20`), with the spy line and a new shared `.gold-anchor-mt` (124px/140px) recalibrated to header + nav + breathing. Verified: the nav is visible below the header at both widths; anchor jumps clear by 4px.
3. **The partial-data crash** (M5 above): a genuinely reachable production state (a dead source) crashed the route. Found by testing the states rather than reading the code.

---

## 3. The budget ledger

| Milestone | GoldPage raw | GoldPage gz | The ceiling | The note |
|---|---|---|---|---|
| The S7 close (baseline) | 224.27 | 50.19 | 240/55.50 | ~15.7 kB raw headroom |
| M1 (the nav + the touch floors) | 225.24 | 50.51 | 240/55.50 | the scroller + the fades |
| M3+M4 (the readout + the aria names) | 225.86 | 50.66 | 240/55.50 | the live region + 4 keys |
| M5 (the crash fix) | 225.86 | 50.66 | 240/55.50 | a one-character initial value |
| M6 (the docking fix) | **225.97** | **50.70** | 240/55.50 | **held — ~14.0 kB raw headroom; no ceiling ask all session** |

The entry chunk 271.21/82.17 (budgets 296/89.5) — the global reduced-motion guard and the two new CSS classes ride the entry CSS (+~0.3 kB gz), inside the entry budget.

---

## 4. The evidence set (`baseline-screenshots/s8/` + the README)

38 playwright captures + assertions: **18 interaction screenshots** (the nav ×4 pairs, the hero ×4, the full 390 page ×2, the five forces ×2, the sheet's two geometries ×4, the inspector ×2) + **7 honest-state captures** (loading, error, cached, unavailable, waiting, partial, the technical tier) + the **13 checks** (the matrix, the token rule, the floors, the LABEL census…) — all over the fixture server, en/fa × light-desktop + dark-mobile (the FIRST genuinely dark pairs of the program).

---

## 5. Q3 — silver's canonical home (PRESENTED, not decided)

**The question (S1-D6 item 2, F-14):** silver is not part of the gold model (it enters only via the `gold-silver` ratio seat), yet the merged Signals card renders a full silver sub-analysis (its own trend chart + conditions verdict) mid-page — secondary content without a strategy-home. The one-instrument rule binds whatever is decided; the merged card's four-lane lane ledger (an artifact of its own driver set — the engine's truth is five lanes) retires or reconciles with the decision. **The gated implementation is HELD until the owner answers** (exactly as Q1/Q2 were held).

**The options:**

- **(A) The ratio-only home — RECOMMENDED.** The Signals section becomes gold-only (the chart + the measured note + the price footing); silver lives in the seats it already owns honestly: the `gold-silver` ratio seat, the if-you'd-bought row, the London vault's silver row. The silver verdict sentence + trend chart RETIRE from /gold (this consciously ends the OI-4-protected sentence on this page — the owner's call to make). *Why recommended:* the master plan's product hierarchy has no silver-briefing slot on /gold; F-14's own finding (a full silver sub-analysis competes mid-page); the card's own keep-small note already declares the philosophy («a dedicated silver conditions strip returns only on measured reader demand»); the four-lane artifact retires cleanly with it.
- **(B) Keep the merged card, visually secondary.** Silver's leg stays but shrinks (collapsed by default, no chart until opened); the four-lane ledger retires or reconciles to the five-lane truth. *Cost:* the page keeps a second metal's conditions beside the gold briefing; the keep-small note's own logic (depth on measured demand) argues against an unconditional residence.
- **(C) A dedicated silver home.** A new surface (a section on another page, or its own route) with the full silver conditions; /gold keeps the ratio + a link-out. *Cost:* new scope — a product decision beyond this program's nine sessions; the one-instrument rule binds wherever it lands.

**The recommendation stands recorded; nothing renders differently until the owner answers.** The ungated remediation (this session's scope) is complete regardless of the answer.

---

## 6. What was verified (and how)

- **The full gates**: 10/10 GREEN (the record in §8).
- **The suite**: the gold feature **307** (the partial-data regression pin added); the full workspace suite at the close (§8).
- **The S8 playwright project**: 38/38 (13 checks + 7 states + 18 captures) over the fixture server.
- **The visual reading**: the VLM pass over the key captures (the mobile hero's hierarchy reads cleanly; the five-force lanes stack; the dark pairs render; the docked nav visible with the active chip + the fade).
- **The budget**: every protected chunk held (§3).

## 7. What remains for later sessions (recorded, not silently dropped)

- **Q3** — presented §5; the owner's answer is Session 9's first input.
- **Q2** — still closed by design (the owner's standing answer; the §8.4 bans hold).
- **S9** — the final verification, regression and handoff session (the master plan's own list: the full screenshot matrix, the before/after comparison, the inventory re-run, the canonical-rendering check, the model-unchanged verification, the full gates, the final report).
- **The fa-string triage queue** — round 94's four keys processed; the standing queue (1,299 unreviewed) rides unchanged.
- **The footer's secondary links** (32px) — the shared footer's inline nav, outside the gold page's scope and under the 2.5.8 inline exemption; noted, not changed (a shared-surface change with every page as consumer).
- **The wrangler-on-8799 sandbox note**: the playwright config's second webServer (the real Worker for U-14) cannot boot in this sandbox (its remote-proxy session needs an interactive login); a readiness stub stands in for the S8 runs, which never touch it. U-14 itself was NOT run here — it is part of `pnpm gates`' suite 9, which ran in full (§8).

## 8. The gates record (the M7 run)

1. Secret scan — PASS, clean
2. Lane territory — PASS, n/a (not a lane branch)
3. Typecheck — PASS, 6 packages
4. Lint — PASS, **0 errors** (2 pre-existing `react-hooks/purity` advisories — `Date.now()` inside two GPE-era `useMemo`s, GoldCorrelation + GoldTaLevels — present verbatim on the S7 baseline tree; the fresh-cache lint surfaces them. Recorded, not fixed: outside S8's scope, and the derivations are financial-display logic that deserves its own careful pass)
5. copy:audit — PASS, clean (round 94, the manifest 9,269)
6. Narrator vocabulary — PASS, in sync
7. Narrator eval — PASS
8. layer1 strict — PASS
9. The full suite — PASS (the count in the CHANGELOG entry; includes the clock-freeze repair of the S7 expectations pin — a time-bombed "in 20 days" assertion, now frozen to the fixture's own session date per the zoom-suite pattern)
10. Build + bundle budget — PASS, every protected chunk (GoldPage 225.97/50.70 under 240/55.50)

## 9. The honest limits

- The screenshots and checks exercise the LOCAL production build over the fixture server; the deploy's live verification is its own record in `docs/DEPLOY.md`.
- The contrast matrix samples the page's status-bearing surfaces (the seven selector families × both themes × both locales) — it is not a proof over every pixel; the token rule (every sampled color IS a token) is the systemic guard.
- The touch-target policy's inline exemption is WCAG 2.5.8's own exception, applied to links inside flowing sentences; the report records it rather than pretending 44px was achieved everywhere.
- Session 9's full keyboard/SR sweep (a complete Tab-order map, a real screen-reader pass) remains the master plan's own S9 item; this session's keyboard evidence covers the nav, the sheet, the chart inspector and the toggles.
