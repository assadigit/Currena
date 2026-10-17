# Economic Indicators UI redesign — verification record

**Spec:** `economic-indicators-ui-spec.md` (repo root — the OWNER'S ACTUAL file,
pushed as 63adfe8 mid-session; the earlier in-session draft was replaced).
**Implementation:** 2c171ca (the concurrent session's re-draw, built to the real
spec), reconciled + verified + deployed by this session. **Final page state:**
grayscale structural foundation, selective severity inks, top-3 flagged rows +
expand, Global-right/Australia-left fixed card order, colored round-44 meter
grading, indicator ROWS, WCAG 2.2 AA targets, 320–1440 responsive.

## Method

Every §13 acceptance item reproduced in a browser. The DOM audits are
computed-style sweeps, not class greps: Tailwind v4 resolves opacity modifiers
through `color-mix(in oklab …)`, so an rgb() regex audit silently misses every
tint. The probe normalizes each banned hex (solid + 4–80% oklab mixes) and
compares every element's color / background / border / outline / decoration /
fill / stroke inside `.insights-page`.

## The local harness (pre-deploy, private mode)

`wrangler dev` + local KV seeded with:

- the REAL production public snapshot + 31 per-indicator histories + status
  (fetched from the live API), re-keyed as the private `insights:snapshot`
  (displayMode stripped — the schema-honest private form; values untouched);
- `insights:markets:v1` / `insights:fx:v1` fixture snapshots
  (`scripts/local-seed-fixtures.ts` — the repo's own summarizeMarkets + fx job
  over the test-suite quote world; one correction + one bear row so the
  severity rings render; no provider is ever called);
- `SITE_MODE=private` + a throwaway password in `.dev.vars` (gitignored).

This renders the FULL private page — including the public-mode-hidden world
sections — with real indicator data. (PWA note: the service worker precache
serves stale chunks after a rebuild — unregister SW + delete caches + reload
before judging any local build.)

## Results (local, private mode — all pass)

| Check | Evidence |
|---|---|
| Card order (spec §8) | 1280 EN: Australia left:32, Global left:652 (RIGHT); fa RTL: Global still right — measured both locales, never mirrored |
| Top-3 + expand (spec §9) | flagged list `#attention-list-global` rows 3 → "+3 more" → 6 (full count; heading "Needing attention now · 6") → "Show fewer" → 3; aria-expanded/aria-controls correct both controls |
| Meters (spec §6) | step-4 grades pale→full `rgb(218,30,40)` (red); step-3 toward orange; dark step-4 toward `rgb(250,77,86)`; 18 meters, `data-step` present, `direction:ltr` computed in fa |
| Banned inks (§13 quality) | probe audit **0 hits** light, **0 hits** dark, zero exceptions (the BalanceScale's detail panel was neutralized by 2c171ca — `bg-currena-muted/[0.06]`) |
| Severity selective | "Needs attention" red on warning/15; "Unusual" amber on warning/10; "Normal"/"Context" neutral gray (icon + word); verdict words Critical red / Stressed orange / Bullish green (Carbon palette both themes) |
| Artwork | 58+ PNG icons `filter: grayscale(1)` via the page-scoped rule; other routes untouched |
| Markets boards (private) | shell = standard surface; tsx (correction) ring `oklab(.../0.3)` red, ibov (bear) `/0.4`, normal tiles neutral; verdict box + 16 tiles render from fixtures |
| fa/RTL (§8) | `dir=rtl lang=fa`; title «شاخص‌های اقتصادی»; card heading «جهانی»; «۶ شاخص از ۱۰ شاخص نیازمند توجه‌اند.»; Vazirmatn; meters LTR; signed `<bdi dir=ltr>` islands |
| Responsive (§10) | `scrollWidth === clientWidth` at **320, 375**, 768, 1024, 1280, 1440 (both locales); no clipping |
| Keyboard (§11) | `/` opens Tools + focuses search; Escape closes + focus returns to the Tools button; `j` opens the first visible card's panel (heading focused); panel Escape closes; tab order sensible |
| Console | zero errors (EN + fa, light + dark) |
| VLM review | fa dark hero: "clean, grid-aligned… no decorative blue or gold… colored severity grading… high-end, calm financial terminal"; EN light hero: Australia LEFT/Stressed-orange, Global RIGHT/Critical-red, warning-triangle rows, "no obvious visual defects" |

## Gates (from merged main @ HEAD)

typecheck 6/6 · 1,485 tests green (web 515) · lint 0 errors/15 advisories ·
copy:audit clean (manifest untouched — zero user-facing strings changed) ·
build + budget: entry 295.15/88.76; Insights lazy **605.68/144.60** vs the
bumped 607.00/145.20 ceilings (headroom; the bump stays as the documented
ceiling per the gate's own rule).

## Production verification (post-deploy)

Live on https://currena.ir/#/insights (public mode — the world sections are
licence-hidden by design; the private-only boards were verified on the local
harness above):

- EN + FA × light + dark × 1280 desktop + 360 mobile: zero console errors;
  no horizontal overflow at 360 in either locale; Global right / Australia
  left at desktop in both; seesaw balance intact; flagged expand/collapse
  works (3 → +N more → all → Show fewer → 3); meters colored + LTR in fa;
  Persian digits + Vazirmatn; probe-based banned-ink audit: **zero**
  occurrences in the public render.
- Screenshots: `docs/insights/screenshots/economic-indicators-redesign/`.
- Worker version + served chunk hash: the 2026-10-24 entry in
  `docs/DEPLOY.md`.

## Session decisions

D-28 (mid-flight reconciliation to the owner's real spec), D-29 (this
verification methodology + harness), D-30 (budget ceiling kept at the
concurrent session's documented bump) — `docs/DECISIONS_FOR_ALI.md`.
