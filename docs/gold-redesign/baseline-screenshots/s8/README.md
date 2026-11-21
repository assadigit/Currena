# S8 screenshot set — the mobile-first refinement evidence (GUX-S8 M6)

38 captures over the visual harness's fixture server (`visual/fixture-server.mjs`, port 4050 — never a live site). The playwright project `gux-s8` (`apps/web/visual/gux-s8-checks.plw.ts` + `gux-s8-states.plw.ts` + `gux-s8-screenshots.plw.ts`).

**THE HARNESS FIX THIS SET OWNS:** the boot writes the app's REAL theme key (the LEGACY `theme` — lib/theme.ts + the index.html pre-paint). The S5–S7 suites wrote the inert `currena:theme`: every "dark" capture in those sets is a light render (the S8 audit's finding, report §2). **This set's dark pairs are the first genuinely dark captures of the program** (avg RGB ≈ 30, measured).

## The set (38 files)

| Surface | Files |
|---|---|
| `nav-{mobile\|desktop}-{en\|fa}-{dark\|light}.png` | 4 — the REBUILT one-row chip-scroller, stuck mid-page BELOW the fixed header (the docking fix), the active chip highlighted, the direction-aware edge fade while more chips sit that way |
| `hero-{...}.png` | 4 — the page head: price → briefing → composition (the mobile hierarchy) |
| `mobile-full-{en\|fa}.png` | 2 — the complete 390 page (~20–23k px tall), the deliberate mobile layout end-to-end |
| `fiveforces-mobile-{en\|fa}.png` | 2 — the lane stack + seat cards at the narrow width |
| `sheet-mobile-{en\|fa}-dark.png` | 2 — the record sheet as the BOTTOM sheet (full width, docked, ≤88dvh) |
| `sheet-desktop-{en\|fa}.png` | 2 — the SAME component as the inline-end sheet |
| `inspector-desktop-{en\|fa}.png` | 2 — the interactive chart with the keyboard crosshair parked (the spoken readout's visible twin) |
| `state-loading-mobile-en.png` | 1 — the deferred projection's honest loader |
| `state-error-mobile-en.png` | 1 — no data, no cache: the honest error + the retry |
| `state-cached-mobile-fa.png` | 1 — the outage's last-good copy, «آخرین نسخهٔ سالم» labelled |
| `state-unavailable-desktop-en.png` | 1 — the premium/vault/OHLC planes' honest "could not be read" lines |
| `state-waiting-mobile-fa.png` | 1 — the if-bought + episode-path waiting lines |
| `state-partial-desktop-en.png` | 1 — the dark seats' why-lines + the absent count |
| `state-sheet-technical-desktop-en.png` | 1 — the technical tier, one tap away, collapsed |

## The verification (programmatic, part of the same playwright project)

- All 38 files substantive (the min-size probe; the dark pairs measured DARK).
- The pair discipline: light-desktop + dark-mobile throughout; en + fa throughout.
- The 13 checks (the contrast matrix + the token rule + the overflow sanctity + the touch floors + the LABEL census + the inspector readout + the sheet's two geometries + color-not-alone + reduced motion) and the 7 state assertions run in the same project — the captures and the checks are one suite.

The owner's own reading: `nav-mobile-en-dark.png` (the docked one-row nav, dark) beside `nav-desktop-fa-light.png` (the same component at width, RTL); then `mobile-full-fa.png` (the whole deliberate mobile page); then `state-partial-desktop-en.png` — the dark seats saying WHY they are dark.
