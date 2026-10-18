# Economic indicators editorial hero — verification record

**Spec:** `docs/insights/economic-indicators-editorial-spec.md` (the
2026-10-19 `currena-hero.zip` handoff — approved visual references,
implementation spec, design tokens, Sydney Harbour + world-map artwork).
The previous grayscale round's record stays at
`economic-indicators-verification-notes.md`.

## What this round changed (presentation-only)

The hero's two overview cards become the editorial financial interface:

- **§10 mobile carousel** — `<768px` the `.insights-hero-grid` container is a
  horizontal scroll-snap track (grid auto-flow column, one card per screen),
  **Global first**, swipe/dots/Previous/Next/arrow-keys to reach Australia.
  The control bar (cue + 2 `aria-current` dots + 44px prev/next buttons)
  renders ABOVE the track — a card is taller than a phone screen, so a
  below-the-track affordance sat under the fold.
- **§7 art bands** — `apps/web/public/assets/artwork/sydney-harbour-faded.webp`
  (1400×248, 12 KB) behind the Australia card header, the fainter
  `global-map-faded.webp` (1000×450, 4 KB) behind the Global card: decorative
  `aria-hidden` layers under a surface veil + bottom fade, toned down further
  in dark mode (opacity .5/.35) and on narrow cards. `webp` joined the PWA
  precache `globPatterns`.
- **§4/§5 ink + pill** — `--ei-navy` (#0F2D4A light / #E8EDF4 dark) on the
  region titles, the flagged rows' values and the page title; the verdict
  word + state artwork ride one `.ei-state-pill` tinted pill with the
  four-step meter unchanged beside it; the hero-scoped grayscale filter is
  RETIRED (the new direction restores the restrained severity inks).
- **§8 rows** — leading subject artwork in a soft neutral container (the
  alert triangle keeps the tier where the icon set has no artwork), a thin
  inline-start alert edge (`.ei-row-accent`), the value in navy, and a
  drill-down chevron (`.ei-row-chevron`) that mirrors in RTL. The top-3 +
  "+n more" → "Show fewer" disclosure, every count, aria hook and the
  generated meanings are unchanged.

## Notable finding — the phantom 98px page pan (fixed)

The first carousel implementation (a **flex** track with `flex: 0 0 100%`
children, hidden scrollbars) made the whole document horizontally pannable
~98 px into blank space on mobile — `documentElement.scrollWidth` grew to
viewport+98 with **nothing painted** there, only after the service-worker's
`controllerchange` reload settled. Bisected on the local harness:

- baseline build (stash): 0 px at 320/375/430/390, fa+en — pre-existing
  layout innocent;
- hiding the track (or either card): 0 px; hiding the furniture, art bands,
  pills, meters, flagged lists, gauges, the app header, the markets section:
  still 98 px;
- switching the track to a grid live: 60 px; back to grid on a fresh load:
  98 px again — a layout-engine-internal scrollable-overflow computation,
  not a box-tree overflow (ancestor `overflow-x: clip` did nothing);
- **`contain: paint` (or `layout`, or any compositing hint) on the track:
  0 px** — the spec-level fix. The track now declares
  `contain: paint` in the `<768px` media query (index.css, with the full
  measurement story in the comment). The track also uses a **grid
  auto-flow column** rather than flex — cleaner one-card-per-screen geometry
  and one less quirk surface.

## Method

`pnpm --filter @currena/web build` + `wrangler dev` on :8787 (the local KV
seeded with the REAL production public snapshot + status via
`wrangler kv key put --local`), then agent-browser against
`http://127.0.0.1:8787/#/insights` — the built SPA served exactly as
production serves it. Every number below is a computed-style/rect probe,
not a class grep.

## Results (all pass)

| Check | Evidence |
|---|---|
| Desktop order (spec §6) | 1280 EN + fa: Australia left:32, Global left:652 (right) — measured both locales, never mirrored |
| Art bands (spec §7) | `[data-hero-art=australia]` + `[data-hero-art=global]` present, aria-hidden; VLM: Sydney subtle behind the navy title, map even quieter, text fully legible; dark mode art opacity 0.5/0.35 measured |
| Severity pill (spec §4) | 2 `[data-verdict-pill]` (step attr 1–4), verdict word inside, 2 `.verdict-meter-lg` role=img meters beside them |
| Rows (spec §8) | 6 flagged rows (3+3) with icon container + chevron + `.ei-row-accent`; expand 3 → "+3 more" → 6 → "Show fewer" → 3 (aria-expanded/aria-controls correct, real clicks) |
| Navy ink | Region title computed color rgb(15,45,74) = #0F2D4A (light); rgb(232,237,244) in dark |
| Mobile carousel (spec §10) | 375 EN: cue "Swipe to view Australia", 2 dots, active "Global card, 1 of 2", Global on-screen (x:16), Australia off (x:371); Next click → active "Australia card, 2 of 2", cue "Swipe to view Global", Australia x:16, trackScrollLeft 355, prev enabled/next disabled; furniture visible on the FIRST screen |
| RTL carousel | 390 fa: «برای دیدن استرالیا بکشید», active «کارت جهانی، ۱ از ۲», Global at the right edge, Australia off-left; «بعدی» → «کارت استرالیا، ۲ از ۲», Australia x:16, trackScrollLeft −370 (logical RTL scroll) |
| Page overflow (spec §10) | `scrollWidth === clientWidth` at **320, 375, 430, 390** × EN/fa × light/dark — zero page-level horizontal overflow; only the track scrolls |
| Tablet 768–1023 (spec §11) | the calm stack (Global first), carousel furniture display:none, zero overflow |
| Console | zero errors + zero page errors across every combo above |
| Screenshots | `docs/insights/screenshots/economic-indicators-editorial/` (11: EN/fa × light/dark × desktop/tablet/mobile + both carousel positions) |

## Gates (on the final tree)

typecheck 6/6 · **1,596 tests green** (web 624, +10 new
`hero-editorial.test.tsx` guards: DOM order Global→Australia, "n of m"
group labels, cue/dots/aria-current, prev-next end-disabling + scrollTo,
fa labels, art-band presence + aria-hidden, pill + meter, top-3/expand
mechanics, full-count heading) · lint 0 errors/15 accepted advisories (the
baseline's own) · copy:audit clean (5 new fa strings triaged in the
manifest, round `editorial-hero-2026-10-19`) · build OK · budgets held
(entry 295.29/88.81 vs 296/89.5; Insights 655.03/156.73 vs the documented
656/157 bump — D-36 + CHANGELOG §2026-10-19).

## Known non-issues

- The app header's fixed off-canvas side-menu paints at viewport..+280 —
  measured on the BASELINE build too; it never contributed to scrollable
  overflow (hiding it changed nothing).
- The row-name `line-clamp-2` truncation is the pre-existing two-line
  clamp (unchanged); VLM flagged it once as "truncation" — intended.

## Production verification (post-deploy — worker 29ebc99b, 2026-10-19)

Deployed through the established pipeline (`pnpm --filter @currena/web
build` + `pnpm --filter @currena/api exec wrangler deploy`, commit 32b23b1
fast-forward merged to main; CI on main: completed/success). Live on
https://currena.ir/#/insights and currena-api.sedanama-ir.workers.dev:

- **Chunk proof**: the served entry `index-D4_TboZK.js` (295.29 kB) and
  `Insights-BI2tkJ8c.js` (655,034 B) are exactly the 32b23b1 build; both
  artwork WebP files answer 200 (12,294 B + 3,668 B).
- **EN light desktop 1280** (agent-browser, fresh profile, workers.dev):
  Australia left:32 / Global right:652, both `[data-hero-art]` bands
  rendering behind legible navy titles (computed #0F2D4A), 2 pills + 2
  meters, zero horizontal overflow, zero page errors.
- **EN mobile 375**: Global first (x:16), Australia off-screen (x:371),
  cue "Swipe to view Australia" + dots + Previous/Next on the first
  screen; a real Next click lands Australia flush at x:16 with the dot
  ("Australia card, 2 of 2") and cue ("Swipe to view Global") flipping;
  `documentElement.scrollWidth === clientWidth`.
- **fa RTL desktop 1280 + mobile 390**: dir=rtl; «برای دیدن استرالیا
  بکشید» + «کارت جهانی، ۱ از ۲»; a real «بعدی» click lands Australia at
  x:16 with track scrollLeft −370 (logical RTL scroll) and the dot/cue
  flipping; zero overflow.
- **currena.ir smoke**: `/api/insights` 200, the Sydney artwork 200.
- Zero console errors / zero page errors across every live combo above.
