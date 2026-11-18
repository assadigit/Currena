# HANDOFF — Currena current state & next steps

## Current state (after the GPE S10 P1-a credibility-floor session)

**The Gold Page Elevation (GPE) S10 P1-a credibility floor is DELIVERED,
DEPLOYED + LIVE-VERIFIED. Production is now currena-api Version ID
`f0844e59` (created 2026-11-18T11:37:29Z @ 100% — the S10 P1-a deploy,
superseding the R-5 port `6ae72ba7`). The code is committed + pushed to
origin at the branch `gold-elevation/p1a-credibility-floor` (HEAD
`71ca786`, off main `19131b0` — the post-R-5 tree). Gates 9/9 GREEN
(suite 15,219 — delta +35 from the R-5 baseline 15,184, positive-only).
The session summary is docs/specs/gold-page-elevation/s10/SUMMARY.md;
the program plan is docs/specs/gold-page-elevation/00-PROGRAM-PLAN.md.**

The six wave-0 rows R01–R06 shipped: the flagship gold/silver price chart
states its true ~5.2-year window (R01, D6-A relabel-now — the "10 years"
chip that rendered a 5.2-year window fixed); the FA SGE/Swiss «میلیون
تن» → «تن» unit error fixed (R02); the Gold Positions 30-day change label
+ the ±100 bar clamp semantics fixed (R03); every dark meter seat states
WHY it's dark — the four cause classes upstream-stopped/upstream-gap/
pipeline-lag/rule-driven (R04, F16a); the CPI shutdown-gap policy per
S4-D1 lights the seat with the adjacent-months-average base label (R05,
INF-2); the five LOW riders #15/#23/#24/#26/#27 + the F17 silver
keep-small footer note (R06). The two build-time reads (D8 locked: B)
resolved to their pre-committed fallback bands (the Kalshi 429/Vercel
checkpoint + the CBI F5-WAF block are environment states — the bands
cost P1-a nothing; R28 at P3 + R13 at P1-b re-attempt). The Persian-copy
manifest round 83 landed the 10 fa strings; copy:audit clean.

**Program counter: Session 10/18 · 8 remaining (S11–S18).** Next: S11 =
P1-b the explanation band (R07 Treasury-direct, R08 F15 wording, R09 F13
licence wall, R10 anchor/consistency infrastructure, R11 F1 narrative,
R12 F5 yield card — the S11 prompt is in s10/SUMMARY.md's next-session
section).

## The green baseline — the S10 P1-a record (2026-11-18)

- **Gates:** 9/9 GREEN (2m 50s). secret scan (clean — 8 patterns · 1053
  files) · typecheck (6 packages) · lint (0/0) · copy:audit (clean —
  manifest round 83, 7988 → 7997 entries) · narrator vocabulary (in
  sync, 193×2 + 56×2 — regenerated after the insights-copy change) ·
  narrator eval (50) · layer1 strict (11969/11969) · **full test suite
  15,219** (core 195 · scraper 67 · insights 1391 · markets 13 · api 414
  · web 13139) · build + bundle budget (entry 270.52/81.97; GoldPage
  73.85/19.11 under the new 75/19.5 ceiling — budget bumped 72/18.5 →
  75/19.5 with justification inline).
- **Suite delta:** **15,184 → 15,219 = +35** (positive-only: the R01–R06
  characterization tests — TrendChart, GoldPositions, GoldPage,
  GoldSeats, yoy-gap, series; nothing deleted).
- **Production:** currena-api Version ID **`f0844e59`** @ 100% (created
  2026-11-18T11:37:29Z). Deploy-lock re-checked FIRST (D-43: production
  was still `6ae72ba7` @ 100% — no drift). Wrangler FIRST attempt clean
  (no 10013 retry). The §21 portwatch window clear (Wednesday). The
  served entry hash `index-sQcXoEPe.js` MATCHES the dist build.
- **Live-verify matrix (all GREEN):** EN desktop — R01 the chart chip
  "5.2 years" (not "10 years"), R02 SGE "92 tonnes" / Swiss "228 tonnes",
  R03 "30-day change", R04 the 5 dark seats' why-lines, R06 #15 absent-
  count "4...", #26 footer `/about#privacy` + `/about#terms`, #27 hero
  spacing, F17 silver note · **fa/RTL desktop** — R02 «۹۲ تن» / «۲۲۸ تن»,
  R03 «تغییر ۳۰ روزه», R04 the FA why-lines («منبع داده انتشار را متوقف
  کرده (آخرین داده: شهریور ۱۴۰۵)» etc.), R06 #15 «۴ از داده‌های...»
  (Persian digit), F17 «عمقِ نقره یک انتخابِ آگاهانه است...», dir="rtl" ·
  **mobile 390×844** — R01 chip "5.2 years", R04 5 why-lines render, the
  layout holds · **R06 #23 fresh path** — data-prices-as-of="fresh" (the
  cached "last successful" qualifier is the outage-only case, verified
  via the test) · **zero console errors** on every surface exercised.

## The prior R-5 port record (2026-11-18, earlier — superseded by S10)


- **Gates:** 9/9 GREEN ×2 (run 1 on the working tree with all edits applied uncommitted: 2m 43s; commit `f66efa44` landed; run 2 on the clean tree with `git status` empty: 2m 46s — IDENTICAL results). secret scan · typecheck (6 packages) · lint (0/0) · copy:audit (clean — zero new copy keys) · narrator vocabulary (193×2 + 56×2 — UNCHANGED) · narrator eval (50) · layer1 strict (11969/11969) · **full test suite 15,184** (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,112) · build + bundle budget (entry 270.48/81.94 UNCHANGED; 10 destination-page chunks within budget; AsiaPage raw re-baselined 16.5→16.75 — +0.03 kB of opener plumbing, justified in scripts/check-bundle-budget.mjs).
- **Suite delta:** **15,165 → 15,184 = +19** (positive-only: 17 panel characterization tests + the UsaPage wiring test + the CommoditiesPage wiring test; nothing deleted). All 13,093 pre-existing web tests passed UNCHANGED before the new tests landed — the stretched-opener pattern is transparent to every characterization query.
- **Production:** currena-api Version ID **`6ae72ba7`** (`6ae72ba7-d32d-4fa2-88ee-b83546e50630`, created 2026-11-18T00:03:29Z, @ 100%). Deploy-lock re-checked FIRST (D-43: production was still `c0858d06` @ 100% — no drift). Wrangler FIRST attempt clean (no 10013 retry): 38 assets uploaded (106 content-hashed unchanged skipped), Worker Startup Time 39 ms. The deploy ran 00:03 UTC Wednesday — OUTSIDE the §21 portwatch window (Tuesday 11:00–14:00 UTC).
- **Live-verify matrix (all GREEN):** `/usa` — the fed-target card click opens the panel (role=dialog + aria-modal, the corpus name, the five F5 sections, the Layer-1 block, the chart svg, the rule line, the source footer; focus on the heading, body scroll locked; Escape closes + focus returns to the opener + scroll restored) · `/commodities` — the «More details» click opens the brent panel (the VERIFIED price-row title + the Layer-1 plainName + the changes section + the 52-week range + the chart; the §19.6 navigate-to-Global stopgap GONE) · **fa/RTL** — the Persian panel (نفت برنت + the Persian F5 sections + the chart + the Layer-1 block) · **mobile 390×844** — the /gold gold-silver context card opens the BOTTOM SHEET (full width, docked bottom, chart renders, the Persian heading + plainName) · `/world-markets` — the gpr-index risk card opens the panel with its chart · `/` — Global loads · **the §19.6 option-B redirect regression-checked** (`/insights?card=us10y` → `/usa`, title "آمریکا - Currena") · **zero console errors, zero page errors** on every surface exercised · the served entry hash `index-C4b9WhvK.js` MATCHES the dist build.

## The R-5 session record (what was done)

1. **Environment setup** (the §19.6 sandbox pattern): the repo re-cloned to `/home/z/currena`; pnpm@10.34.5; `pnpm install` (8.1s). Token verified (HTTP 200 — login `assadigit`).
2. **Baseline verification:** origin/main at the §19.6 close (`47b9a34`); production STILL `c0858d06` @ 100% (D-43 holds at session open AND re-checked before the deploy).
3. **The audit (in-session):** the retired DetailsPanel recovered from `ecc64a05^`; every dependency verified alive in the shared layer (HistoryChart · PriceDetails · layer1 · config helpers · fetchIndicatorHistory · the corpus · the insights-panel CSS); the eight §21-trio card surfaces enumerated (UsaTierCards 72 · EuropeTierCards · AsiaTierCards · AustraliaTierCards · CurrenciesTierCards · GoldContext · WorldRiskCards · the Commodities PriceTiles); the §19.6 in-file stopgap comment on CommoditiesTierCards pointed at this port by name.
4. **The spec (docs/page-division/07-R5-DETAILS-PANEL-PORT.md)** — committed + pushed FIRST (`1a072a55`): goal, scope (the eight surfaces), out of scope (R-7/R-8 unchanged, the Global hub navigates, the markets feeds have no panel), the decisions D-R5-1…D-R5-5 (later + D-R5-6 in BD-S33), the plan, the done criteria.
5. **The port (`f66efa44`, 21 files: 3 new + 18 modified):**
   - NEW `shared/components/IndicatorDetailsPanel.tsx` — the retired panel verbatim minus the pin (the five F5 sections, the rule line, CardFacts, the price-row sections, the status lines, Layer1Block, PanelHistory→HistoryChart, the source footer, the focus discipline).
   - NEW `CardDetailsOpener` (the panel module) — the stretched transparent `<button>` overlay (valid HTML, `aria-haspopup="dialog"`, the corpus `Details: <name>` label; the card DOM byte-identical).
   - NEW `shared/hooks/useIndicatorDetails.tsx` — `useIndicatorDetailsPanel(readings)` → `{ openCard, closeCard, panel }` (fail-closed on an absent reading).
   - WIRED the eight surfaces + their pages (each page: the hook call + `onOpenDetails={openCard}` + `{panel}` at the root — a three-line page diff).
   - The Commodities «more details» stopgap REPLACED by `openCard` (the legacy 2026-10-26c behaviour restored on the commodities home).
   - Tests: +19 (the panel characterization ×17 + the UsaPage wiring + the CommoditiesPage wiring).
   - Budget: the AsiaPage raw ceiling 16.5 → 16.75 (the justification comment in the script).
6. **Gates ×2 GREEN** (2m 43s / 2m 46s), suite 15,184 (+19).
7. **Commit + push** (`f66efa44`; the staged diff secret-scanned clean before the commit). Local HEAD == origin/main == `f66efa44`.
8. **Deploy + live verify** (the matrix above; the browser closed clean).

## Operational notes worth carrying

- **The stretched-opener pattern (D-R5-6)** is the house pattern for "whole card is the tap zone" over cards with real headings: a transparent `<button>` at `absolute inset-0 z-10` as the article's last child (the article carries `relative`). The card's DOM stays byte-identical — the characterization suites never noticed. Text selection inside such a card is blocked by the overlay (accepted for data cards; recorded in BD-S33 D3's revisit).
- **The panel's chunk topology:** the panel + HistoryChart + PriceDetails + the corpus ride the SHARED chunks every destination page already loads (`useInsightsCopy-*` etc.) — the per-page cost of the port is the opener button + the callback plumbing (the AsiaPage row is the measured evidence: +0.03 kB). The money page's entry graph is UNTOUCHED (the entry budget unchanged).
- **The `/api/insights/:id/history` endpoint** now has a page consumer again (the panel's chart + the tile sparklines + the price sections — one module-cached fetch, three consumers). No API change shipped.
- **The standing limits carry forward (AGENTS.md §11):** the §21 portwatch window (never run Tuesdays 11:00–14:00 UTC) + the deploy-lock re-check FIRST (D-43) + the wrangler 10013 retry rule + the `run`-required-under-pnpm-10 rule + the R5 no-renames constraint.

## Owner-side levers waiting

- **DEPLOYED — the R-5 port lever is CLOSED.** currena-api Version ID `6ae72ba7` @ 100%. Production == the SPA built from origin/main HEAD `f66efa44`. Rollback recipe: `npx wrangler rollback` (one command, from apps/api) + `git revert f66efa44` — the port is display-layer, nothing else moved.
- **The burn-in measurement** — the R-5 port exists partly to measure whether readers use the detail panels (the retirement spec's framing). After a few weeks of analytics, the owner can decide whether the watchlist (R-7) is worth porting as the natural companion (BD-S33 D7's revisit).
- **The external investor's review of spec §19** (the seven questions) — re-opens the page-division spec v2 work (the AF-1…AF-8 findings ride that pass).
- **triage the queued unreviewed fa strings** (the copy:audit queue — 1240 entries, does not fail the audit).
- **revoke or rotate the session credentials** now that the R-5 work has shipped (they were used, never stored).

## Known state worth knowing

- **The Layer-1 inventory is COMPLETE** (193×2 entries ≥ the 187 registry ids) — every panel the port can open carries Layer-1 copy; the graceful-absence branch (`if (!l1) return null`) is defensive only (BD-S33 D9).
- **The dist topology (post-R-5):** entry 270.48/81.94 (UNCHANGED budget); 10 destination-page chunks within budget (AsiaPage re-baselined 16.5→16.75 raw). Build deterministic (both gates runs produced identical hashes).
- **The Persian-copy manifest: 7988 entries (UNCHANGED this session — zero new copy keys in the R-5 port).**
- **The narrator vocabulary: 193×2 + 56×2 (UNCHANGED).**

## The next-session pointer — the R-5 port is COMPLETE

**The R-5 details-panel port is DONE AND VERIFIED LIVE: spec + code shipped (`1a072a55` + `f66efa44` on origin/main), gates 9/9 GREEN ×2, suite 15,184 (+19), deployed (`6ae72ba7` @ 100%), live-verified (the click-through matrix + zero console errors + mobile + RTL + the §19.6 redirect regression). Production == origin/main HEAD. Nothing remains for the R-5 plan.**

The standing owner-side levers (the burn-in measurement → the R-7 watchlist decision, the investor's §19 review, the fa-string triage, the credential rotation) re-open work at the owner's discretion, each behind its own Gate 0. The standing limits in AGENTS.md §11 (the §21 portwatch window, the D-43 deploy-lock re-check, the wrangler 10013 retry rule) carry forward to any future session that deploys or moves files.
