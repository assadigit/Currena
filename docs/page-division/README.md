# Page-Division Program — the doc set

> **The successor program to the closed gold-meter gap-fill program**
> (2026-11-07). Display-layer only: no engine, voter, threshold, or
> calibration changes — the 37-voter gold meter and the 5 thematic gauges
> are untouched; only *where things are shown* changes.

## What this program does

Splits Currena's single all-in-one Insights page into **10 destinations**
(Global · Gold · World Markets · USA · Europe · Asia & Pacific · Australia ·
Commodities & Energy · Currency Pairs · legacy `/insights`), per the owner's
**48 recorded decisions** collected over three strategy rounds.

## Reading order

| # | File | What it is | Status |
|---|---|---|---|
| 0 | `../AGENT-RULES.md` (docs/; rules consolidated into AGENTS.md §14) | The owner's permanent working rules — read before anything | final |
| 1 | `01-SESSION-ROADMAP.md` | The 30-session execution plan with per-session gates | final |
| 2 | `02-PAGE-DIVISION-SPEC.md` | **The spec v1.0** — per-page purpose, layout, membership; the full 184-id placement; risks; acceptance criteria; §19 = questions for the external investor | awaiting investor review (Phase 2→3) |
| 3 | `03-STRATEGY-LOG.md` | The decision record D-1…D-48, the final page map, the session history, and the Session 1/30 kickoff prompt (§9) | final (Phase 1 closed) |
| 4 | `04-INDICATORS-COMPLETE-INVENTORY.md` | Phase 0 audit: all 184 registry indicators — process, method, source | final |
| 5 | `05-GOLD-INDICATORS.md` | Phase 0 audit: the 37-voter gold meter and every gold fetch method | final |

Generated during the build: `PLACEMENT.generated.md` — **delivered &
committed GREEN at Session 2 (2026-11-08): 184 ids + 6 boards · 0 unplaced
· 0 duplicate homes**; the sync test pins it byte-for-byte against the
regeneration (`pnpm placement:generate`).

## Program state

- **Phase 0 (audit):** complete — docs 4 & 5.
- **Phase 1 (strategy):** complete — 3 question rounds, D-1…D-48, taxonomy
  settled (doc 3).
- **Phase 2 (spec):** v1.0 drafted (doc 2) — **awaiting the external
  investor's review** (spec §19 lists the questions).
- **Phase 3 (final spec):** pending the investor — roadmap S22 records the
  answers as D-49+.
- **Phase 4 (build):** **RUNNING — Phase A (Foundations) CLOSED, Phase B
  (Gold) CLOSED, Phase C (World Markets) CLOSED and **Phase D (USA)
  CLOSED**: S1 (scaffold & navigation) 2026-11-07 · S2 (the data layer +
  `PLACEMENT.generated.md`) 2026-11-08 · S3 (the Global page build: the
  D-21 ten-tile verdict board) 2026-11-08 · S4 (Global gates & polish:
  the §21 verdict-consistency backtest 84/84 green, BD-S4a/b, the
  mobile/ARIA pass) 2026-11-08 — the landing page DEPLOYED LIVE
  (version `b1cfa4fe`; the live acceptance record in `docs/DEPLOY.md`
  2026-11-08c). S5 (the Gold page build: the 37-voter conditions meter)
  2026-11-08 — DEPLOYED LIVE at `/gold` (version `f2e74f3c`). S6 (the
  Gold gates + the owner's alternation BD-S6a: the previous brass
  balance shape on `/gold`, smaller, beside the minimal design — plus
  the frozen-scenario suite over the recorded corpus and the mobile/ARIA
  pass) 2026-11-08 — DEPLOYED LIVE (version `327c7761`; the live
  acceptance record in `docs/DEPLOY.md` 2026-11-08e). S7 (the World
  Markets page build: the REUSED D-43 map hero through the WorldMapCopy
  contract + the status summary + the Asia 7 / Europe 4 / Americas 5
  region grids + the 9 world risk & liquidity cards; the live §21 diff
  56/56 green twice) 2026-11-08 — DEPLOYED LIVE at `/world-markets`
  (version `6e515cf8`; the live acceptance record in `docs/DEPLOY.md`
  2026-11-08f). S8 (the Regional zoom maps: the four REGION pages' D-44
  index/map sections — the REUSED WorldMap in region mode, ONE drawing,
  the all-16 colour scale by construction, the live §21 diff 13/13
  green twice) 2026-11-08 — DEPLOYED LIVE at `/usa` · `/europe` ·
  `/asia-pacific` · `/australia` (version `fde50a95`; the live
  acceptance record in `docs/DEPLOY.md` 2026-11-08g). S9 (the USA
  verdicts + tiers 1–2: the D-30 verdict strip — the same computed
  verdicts as Global through ONE derivation — plus tier-1 "the world
  watches" 7 cards and tier-2 rates & the Fed 19, every card with the
  §21 trio; the live three-side §21 diff 69/69 green twice) 2026-11-09 —
  DEPLOYED LIVE at `/usa` (version `36f64141`; the live acceptance
  record in `docs/DEPLOY.md` 2026-11-09a). S10 (the USA tiers 3–6 + the
  TIC board: inflation 12 · labor & growth 17 · liquidity/stress/
  valuation 17 — all 72 registry cards — + the tier-6 "Who finances
  America" board, the REUSED legacy TIC drawing through the narrowed
  copy contract over the existing /api/insights/tic route; the
  placeholder body retired; the live §21 diff 173/173 green twice)
  2026-11-09 — DEPLOYED LIVE at `/usa` (version `18907d4d`; the live
  acceptance record in `docs/DEPLOY.md` 2026-11-09b). S11 (the USA
  gates: the freshness audit formalized as a pure function + offline
  suite (BD-S11a), the mobile/ARIA polish — aria-controls on the
  Show-all toggle + the period switch's 44px touch target (BD-S11b), the
  In-build chip retired (BD-S11c — BD-S10b's completion); the live §21
  diff 173/173 green twice; the browser pass at 1440×900 and 360×844 in
  en + fa with ZERO overlaps/overflow/errors) 2026-11-09 — DEPLOYED
  LIVE at `/usa` (version `4f288272`; the live acceptance record in
  `docs/DEPLOY.md` 2026-11-09c). S12 (the Europe page build: the EU
  section + the non-EU United Kingdom section listed apart (D-33), the
  8 placed cards with the §21 trio, the S8 STOXX50E/DAX/CAC/FTSE zoom on
  top, the cross-links to /currencies; the §15 FRED-only fills
  verified-pending-ingest (Rule 5 — none ingested unverified, the
  candidates recorded in DECISIONS.md BD-S12a); the §21 diff 8/8 green
  twice; the browser pass at 1440×900 and 360×844 in en + fa with ZERO
  overlaps/overflow/errors) 2026-11-09 — DEPLOYED LIVE at `/europe`
  (version `84833135`; the live acceptance record in `docs/DEPLOY.md`
  2026-11-09d).** S13 (the Europe gates: the card-render audit, the
  freshness audit formalized + honest, the mobile/ARIA pass pinned, the
  In-build chip retired — Phase E CLOSED) 2026-11-09 — DEPLOYED LIVE at
  `/europe` (version `b11fd84f`; the live acceptance record in
  `docs/DEPLOY.md` 2026-11-09e).** S14 (the Asia build + fills: the
  five sub-regions D-35 — China 7 · Japan 2 · Korea/Taiwan/HK
  index-only · India index-only · Pacific-NZ 2 = 11 placed cards — the
  S8 zoom on top, the cross-links, the §21 backtest; the §15 FRED-only
  CPI fills for JP/KR/IN VERIFIED STALE — the FRED OECD mirror family
  is discontinued, Rule 5 — BD-S14a; the honest In-build chip stays
  until the S15 gates pass) 2026-11-09 — DEPLOYED LIVE at
  `/asia-pacific` (version `68281479`; the live acceptance record in
  `docs/DEPLOY.md` 2026-11-09f).** S15 (the Asia gates: the card-render
  audit, the freshness-within-cadence-grace audit honest, the
  mobile/ARIA pass pinned + browser-verified, the In-build chip retired
  — Phase F CLOSED) 2026-11-09 — DEPLOYED LIVE at `/asia-pacific`
  (version `6f96cd9a`; the live acceptance record in `docs/DEPLOY.md`
  2026-11-09g).** S16 (the Australia build & gates: the REUSED AU
  Markets board [19 symbols] via the lean adapter, the 5-gauge structure
  D-37, the 28 cards with the §21 trio, the 11 moved-out seat chips →
  currencies/asia-pacific/commodities/gold; the §21 backtest [the pure
  core + the offline suite + the live pd-s16-backtest.ts, 28/28 green vs
  production pre-deploy] + the render audit [AustraliaPage.test.tsx, 7
  tests] + the In-build chip RETIRED at the gates pass — BD-S16c — Phase
  G CLOSED) 2026-11-10.** S17 (the Commodities build & gates: the four
  commodity groups [Energy 9 · Metals 4 · Agriculture 3 · Digital 2] +
  the Trade routes & supply group [D-38/D-39: the five chokepoints + the
  GSCPI = 6] — 24 cards with the §21 trio, every card context-only [no
  gauges, no verdict lines — G-5]; the gold cross-link to /gold on the
  metals group [D-19/D-27]; the §21 backtest [the pure core + the
  offline suite + the live pd-s17-backtest.ts, 24/24 green vs production
  pre- AND post-deploy] + the render audit [CommoditiesPage.test.tsx, 7
  tests] + the In-build chip RETIRED at the gates pass — BD-S17c — Phase
  H CLOSED) 2026-11-11.** S18 (the Currencies build & gates — Phase I
  OPENED AND CLOSED IN ONE SESSION: the 7 rule lights hero D-41 [through
  the SAME §9.3 fxRuleView mapping the legacy page reads] + the 11-pair
  board D-42 [AUDNZD the 11th pair — the one named engine addition: its
  own pacificLink group, NZD on the same single Frankfurter request] +
  the dollar-standing cards D-32 [14 registry cards with the §21 trio
  over the S2 projection] + the FX-board payload wiring [GET
  /api/insights/fx, the markets/fx last-good discipline]; the §21
  backtest [the pure core with THREE gates — the 14-card trio diff + the
  RULES gate (the §9.3 table + the renderable-domain invariant + the
  stored summary ≡ the engine's own rollup) + the BOARD gate (11 pairs
  complete)] + the render audit [CurrenciesPage.test.tsx, 8 tests] + the
  In-build chip RETIRED at the gates pass — the LAST placeholder page is
  real — deployed BOTH workers [currena-api `51a0fe45` + currena-markets
  `8f63c8fa` + the fx-run KV seed] with the post-deploy §21 ALL GREEN +
  the 4-leg browser pass green) 2026-11-11.** S19 (the Navigation,
  mobile & SEO polish — Phase J OPENS: the breadcrumbs on the eight
  destinations + the per-page meta/OG pass [the route-meta table + the
  App <head> effect + the refreshed static defaults] + the HANDOFF item
  6 language-toggle polish [the "theme words" read disproven against
  the deployed DOM; the labels now name the target] + the sticky-footer
  verification with the iOS safe-area rider + the two S1-noted
  legacy-hero mobile items closed; the suite 15,099 = +11; the browser
  pass on all 10 routes × both widths × both locales) 2026-11-12 —
  DEPLOYED LIVE (currena-api `74777037`, a WEB-ONLY deploy — the
  markets worker untouched).** Next: Session 20/30 (S20 — the
  full-site regression + verdict backtest + data audit). See the
  roadmap's progress board for the current position.

## The one rule that trumps everything

`AGENT-RULES.md` (docs/; the rules are consolidated into AGENTS.md §14). Short sessions. Continuous commits.
Hand-offs with progress counters. Green gates or no progress. Financial-data
discipline — never assume; this is people's money.
