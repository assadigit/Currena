# HANDOFF — Currena current state & next steps

## This session (S12 — GPE P1-c, the prizes; IN PROGRESS)

**Goal:** rows R13 (Bridge-1 the Iran bridge) · R14 (the IMF CB-demand
Tier-1 tracker) · R16 (the affordances + the market-state pill) · R17
(the #21 de-dup) — **R15 slipped to P2** (the M1(b) drop check: no WGC
GDT file, no owner notice; the fold record §0.2 rule). Branch
`gold-elevation/p1c-prizes` off the S11 close `aae44dda`. M1 landed:
citation re-verification + the three build-time checks recorded
(docs/specs/gold-page-elevation/s12/M1-CITATION-AND-CHECKS.md — the
R07 Treasury rung fires 04:10 UTC Nov 19, AFTER this session's start:
the flip verification rides S13's M1, honestly recorded).

## Previous session (S11 — GPE P1-b, the explanation band; DONE AND VERIFIED LIVE)

**Outcome:** all six rows R07–R12 landed, tested, deployed, and
live-verified. Production is currena-api `23ce6b06` @ 100% (created
2026-11-18T14:31:20Z). The branch `gold-elevation/p1b-explanation-band`
(HEAD `6a3d55de`, 10 commits: M1 docs + R07–R12 + the manifest round +
the budget bump) is pushed. Gates 9/9 GREEN (suite 15,247, +28
positive-only). The Persian-copy manifest round 84 landed the wave's 57
fa strings (7997 → 8032 entries; copy:audit clean). The session summary
+ the S12 next-session prompt are
docs/specs/gold-page-elevation/s11/SUMMARY.md.

**The honest R07 note:** the Treasury-primary collect code is DEPLOYED
and verified in the Worker bundle, but the live KV snapshot predates
the deploy (generated 13:12 UTC) — the readings still carry FRED
provenance (as-of Nov 16). The first Treasury-primary rung fires
**04:10 UTC Nov 19**; the 10:10/20:10 sweeps correctly skip (healthy
status, under the 10-hour stale threshold). **The S12 M1 verifies the
flip** (S11-D4).

**Program counter: Session 11/18 · 7 remaining (S12–S18).** Next: S12 =
P1-c the prizes (R13 Bridge-1 the Iran bridge · R14 the IMF CB-demand
tracker · R15 the GDT stack (drop-dependent) · R16 the affordances +
market pill · R17 the #21 de-dup — the S12 prompt is in s11/SUMMARY.md's
next-session section).

## Current state (after the GPE S11 P1-b explanation-band session)

**The Gold Page Elevation (GPE) S11 P1-b explanation band is DELIVERED,
DEPLOYED + LIVE-VERIFIED. Production is now currena-api Version ID
`23ce6b06` (created 2026-11-18T14:31:20Z @ 100%, superseding the S10
P1-a deploy `f0844e59`). The code is committed + pushed to origin at the
branch `gold-elevation/p1b-explanation-band` (HEAD `6a3d55de`, off the
p1a tip `ec57261e`). Gates 9/9 GREEN (suite 15,247 — delta +28 from the
S10 close, positive-only). The session summary is
docs/specs/gold-page-elevation/s11/SUMMARY.md; the program plan is
docs/specs/gold-page-elevation/00-PROGRAM-PLAN.md.**

The six wave-1 rows shipped: the US yield family reads Treasury-direct
as PRIMARY with FRED as basis/fallback/cross-check (R07 — the deployed
swap; the first Treasury-primary rung fires 04:10 UTC Nov 19); the
outlook line speaks the conditions grammar ("Conditions outlook" + the
inline "this describes current conditions, not a forecast" — the 14
forecast-ish verdict sentences re-worded, both locales) (R08); the
licence wall states each blocked item's why + the owner's lever + the
one link-out to the public data-sources document (R09); every seat link
is a card-level #hash anchor with the name-match rule (R10); the F1
daily narrative "Why gold moved" renders the price fact + the five
driver families' states + raw deltas + the standing caveat (R11); the
F5 yield-decomposition card renders the four legs, the exact identity
(real + breakeven = nominal, the breakeven derived on matching as-ofs),
the moved block, the three named configurations + the 2022-gilt
exception, the Kim–Wright/ACM provenance, and the chain's two live
seats (R12). The Persian-copy manifest round 84 landed the 57 fa
strings; copy:audit clean. The GoldPage chunk budget bumped 82.5/21 →
89.5/22.5 (R12's binding education block, measured 88.41/21.91 — the
S11-D3 record; ~1.1 kB raw headroom for P1-c).

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
- **The dist topology (post-S11):** entry 271.12/82.12 (within the 296/89.5 budget); 10 destination-page chunks within budget (the GoldPage ceiling 89.5/22.5 per S11-D3, measured 88.41/21.91). Build deterministic.
- **The Persian-copy manifest: 8032 entries (round 84, the S11 wave — 57 fa strings; copy:audit clean).**
- **The narrator vocabulary: 193×2 + 56×2 (UNCHANGED).**

## The next-session pointer — GPE S11 P1-b is COMPLETE; S12 P1-c next

**The GPE S11 explanation band is DONE AND VERIFIED LIVE: the six rows
R07–R12 shipped (`81cd8803`…`6a3d55de` on
`gold-elevation/p1b-explanation-band`), gates 9/9 GREEN, suite 15,247
(+28), manifest round 84 (57 fa strings, clean), deployed (`23ce6b06`
@ 100%), live-verified (EN + fa/RTL desktop + mobile 390 + the
anchor click-through + zero console errors). The S12 P1-c prompt (the
prizes: R13–R17) is at the bottom of
docs/specs/gold-page-elevation/s11/SUMMARY.md.**

The standing owner-side levers (the WGC GDT data drop → R15's
drop-calendar answer; the WGC authorisation letter (D9); the two
operational P0s (CFTC + GPR); the fa-string triage queue; the
credential rotation) re-open work at the owner's discretion. The
standing limits in AGENTS.md §11 (the §21 portwatch window, the D-43
deploy-lock re-check, the wrangler 10013 retry rule) carry forward to
any future session that deploys or moves files.
