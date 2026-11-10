# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 18/30 IN PROGRESS (S18 — Currencies build & gates · Phase I
> opens).** Goal: the `/currencies` page — the 7 rule lights hero (D-41)
> + the 11-pair board (D-42 — AUDNZD joins the FX board: a real engine
> change, core `FxPairIdSchema` + `FX_PAIRS` + NZD quote currency + the
> markets-worker redeploy so the crons keep 11 pairs) + the
> dollar-standing section (D-32, 14 registry cards with the §21 trio) +
> the FX-board payload wiring. Milestones: M1a the fx engine (audnzd) ·
> M1b the pure tiles + copy + pins · M2 the page build + the App wiring ·
> M3 the §21 backtest + the render audit + the full gates + the deploy
> (currena-api → fx-run → currena-markets) + the browser pass. Baseline
> at session start: clean tree at the S17 close (`47945fc`), fx suite
> 1364 green, typecheck 6/6.

> **S17 (2026-11-11) — Commodities build & gates — Phase H CLOSED. Session
> 17/30 · 13 remaining.** Delivered the Commodities page build + gates in
> one session: (M1) the pure commodities-tiles + the en/fa pd.commodities
> copy + the pins (the 24 card names + 5 unit words + position/band/status
> words pinned to the corpus byte-for-byte; the 57 new fa strings queued
> unreviewed); (M2) the page build — CommoditiesTierCards (the 5 group
> sections: Energy 9 · Metals 4 · Agriculture 3 · Digital 2 · Trade
> routes & supply 6 = 24 cards with the §21 trio) + CommoditiesPage (the
> S2 projection contract + the M-17 last-good + the fail-closed states) +
> the App.tsx wiring (/commodities leaves the placeholder set —
> DESTINATION_ROUTES now holds only /currencies); (M3) the §21 backtest
> [offline suite 11 tests + the live pd-s17-backtest.ts, 24/24 green vs
> production pre- AND post-deploy] + the render audit [CommoditiesPage.test.tsx,
> 7 tests] + the full gates + the In-build chip RETIRED at the gates pass
> (BD-S17c). Live §21 diff 24/24 green pre-deploy AND post-deploy.
> Freshness HONEST (24 within grace, 0 beyond — all fresh). Gates ALL
> GREEN. **Close-out COMPLETE: DEPLOYED LIVE (worker `08e0fc64`, 2026-11-11,
> the owner's standing); the post-deploy live §21 re-verify 24/24 green;
> the 4-leg browser pass (1440×900 + 360×844, en + fa) green — the In-build
> chip ABSENT on all 4 legs, 0px overflow, 0 page errors.**

## Current state (2026-11-11, after page-division S17)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase H (Commodities) CLOSED: S17
  delivered the Commodities page build + gates in one session — every
  commodity, exclusively here (D-19), reorganize-only. The four
  commodity groups (Energy · Metals · Agriculture · Digital) + the Trade
  routes & supply group (D-38/D-39) = 24 cards with the §21 trio (value
  · 10-year position · freshness), every card context-only (no gauges,
  no verdict lines — G-5); the gold cross-link to /gold on the metals
  group (D-19/D-27 — the one commodity exception). M1 the pure tiles +
  copy + pins; M2 the page build + the App.tsx wiring; M3 the §21
  backtest + the render audit + the full gates + the In-build chip
  RETIRED at the gates pass (BD-S17c — the S13/S15/S16 retirement
  trajectory mirrored).** Progress: S1 scaffold & navigation · S2 data
  layer + `PLACEMENT.generated.md` · S3 the Global landing page (D-21)
  · S4 the gates & polish (Phase A CLOSED) · S5 the Gold page build · S6
  the Gold gates + the owner's alternation (Phase B CLOSED) · S7 the
  World Markets page (D-43 map hero + region grids + the 9 risk cards)
  · S8 the Regional zoom maps (Phase C CLOSED) · S9 the USA verdicts +
  tiers 1–2 · S10 the USA tiers 3–6 + the TIC board · S11 the USA gates
  (Phase D CLOSED) · S12 the Europe page build · S13 the Europe gates
  (Phase E CLOSED) · S14 the Asia build + fills · S15 the Asia gates
  (Phase F CLOSED) · S16 the Australia build & gates (Phase G CLOSED) ·
  **S17 the Commodities build & gates (Phase H CLOSED — the chip
  retired at the gates pass, the gates green, the §21 diff 24/24 green
  pre- + post-deploy, the freshness honest [24 within grace, 0
  beyond]).**
- **DEPLOYED LIVE (version `08e0fc64`, 2026-11-11, the owner's
  standing):** the /commodities page is built + gated + live. The live
  acceptance: the §21 diff re-run against production post-deploy 24/24
  green (the 24 cards' trio inputs byte-identical page ≡ engine; the
  freshness audit honest — 24 within grace, 0 beyond, 0 unflagged);
  currena.ir/commodities renders the complete page over the live
  projection at 1440×900 AND 360×844 in en AND fa (the 5 group sections,
  the 24 cards with the §21 trio, the gold cross-link → /gold at 44px,
  the In-build chip ABSENT on all 4 legs, NO horizontal scroll, ZERO
  console/page errors; the fa legs dir=rtl + h1='کالاها و انرژی' +
  Persian digits ['۹۲٫۱۷ دلار' · '۶۵٫۳ تردد در روز']); the Global + Gold
  + World Markets + USA + Europe + Asia & Pacific + Australia + legacy
  /insights surfaces intact. The 3 seat chips on /australia that link to
  /commodities (iron-ore · coal-aus · lng-japan) now resolve to a real
  page instead of the placeholder. The prior surface was `9d60726b`
  (S16, /australia); production moved `9d60726b` → `08e0fc64`.
- **Gates (last full run, S17 — ALL GREEN):** typecheck 6/6 · eslint 0/0
  · copy:audit clean (exit 0 — the 57 new pd.commodities.* fa entries
  queued unreviewed) · **suite 15,053 = +34** (commodities-tiles 14 ·
  commodities-copy-pin 2 · commodities-backtest 11 · CommoditiesPage
  render audit 7) · build + budgets held (entry 270.69/81.95, the
  CommoditiesPage chunk 11.93/3.41 vs its 16/5 row — the leanest
  page-division chunk: no zoom, no board, no gauges).
- **The live §21 diff (pre-deploy + post-deploy re-verified, vs
  https://currena.ir):** 24/24 cards green (page ≡ engine
  byte-for-byte), the 5-group membership green (energy 9/9 · metals 4/4
  · agriculture 3/3 · digital 2/2 · trade-routes-supply 6/6 = 24 cards),
  the freshness audit HONEST (24 within cadence grace, 0 beyond — all
  fresh; 0 unflagged).

## Next session (S18 — Currencies build & gates · Session 18/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S18 entry + the S17
delivery record), `02-PAGE-DIVISION-SPEC.md` §12 + §21, and this
file. Scope (S18 — Currencies build & gates, Phase I opens): the
`/currencies` page — the 7 rule lights hero (D-41: R1 risk-mood · R2
carry unwind · R3 dollar strength · R4 money-hiding · R5 China link ·
R6 Europe worry · R7 dollar-or-euro) + the 11-pair board (D-42:
EURUSD · USDJPY · GBPUSD · USDCHF · USDCNY · AUDUSD · AUDJPY · EURJPY ·
EURCHF · AUDCNY · AUDNZD — each: rate, d1/m1/m3/y1 changes, moveRank
0–100, bigMove flag, 52-week closes) + the dollar-standing section
(D-32: dollar-basket · dollar-broad · dollar-eme · us-japan-10y-gap ·
usdtry · usdaed · usd-reserve-share) + the FX-board payload wiring.
The S9–S17 display-layer pattern to mirror: pure tiles + the §21 trio
+ the copy pins + the live backtest + the render audit + the
mobile/ARIA pass + the In-build chip (build-session chip →
gates-session retirement). **Gates:** the rules match the FX board KV
logic exactly; 11 pairs complete; the §21 diff over the cards green
twice (pre- and post-deploy); typecheck + lint + copy:audit +
build/budgets; browser verification at 1440×900 and 360×844 in en +
fa; commit pushed at every checkpoint. The deploy at the close is the
owner's standing.

### The §15 FRED-only CPI fills for Asia — carried forward (BD-S14a / BD-S15d)

The three D-36 Asia fills (Japan · Korea · India CPI YoY) stay
verified-pending-ingest (Rule 5). The FRED OECD mirror family
candidates were VERIFIED STALE/discontinued live in S14 (BD-S14a):
JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06; KORCPIALLMINMEI +
CPALTT01KRM659N end 2023-11; INDCPIALLMINMEI + CPALTT01INM659N end
2025-03. The World Bank FP.CPI.TOTL.ZG (annual, fresh through 2025) is
a viable alternative but a DIFFERENT cadence + provider than the spec
§15 names. The national statistics bureaus (the Statistics Bureau of
Japan, KOSTAT, MoSPI) publish fresh monthly CPI but are NOT
already-integrated providers. The candidates + the alternative sources
are recorded in DECISIONS.md (BD-S14a + BD-S15d). **A dedicated fill
session (S18's sibling or a one-off) picks a viable monthly source,
verifies from production egress, then ingests with the full §A
discipline; the §21 diff grows to cover the new cards.** Their absence
does not make the 11 placed Asia cards "in build" — the chip retired at
the S15 gates pass (BD-S15c).

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + BD-S8a/b/c + BD-S9a/b/c + BD-S10a/b/c + BD-S11a/b/c +
   BD-S12a (the §15 Europe fills verified-pending-ingest — Rule 5)
   + BD-S12b (the Europe page build) + BD-S13a/b/c/d (the Europe
   gates) + BD-S14a (the §15 Asia CPI fills — VERIFIED STALE,
   discarded) + BD-S14b (the Asia page build) + BD-S15a/b/c/d (the
   Asia gates — Phase F CLOSED) + BD-S16a/b/c/d (the Australia build
   & gates — Phase G CLOSED) + **BD-S17a/b/c + the deploy (the
   Commodities build & gates — Phase H CLOSED)** (all recorded, none
   blocking).
4. Triage the queued unreviewed fa strings (now ~1014: the ~957
   previous + the 57 S17 `pd.commodities.*` keys; the S17 corpus-pinned
   values — the 24 card names + the 5 unit words + the position/band/
   status words — are verified byte-for-byte by
   `commodities-copy-pin.test.ts`, the fresh section/intro/loading/
   gold-cross-link copy pending review).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. A small pre-existing display quirk (out of S9–S17's scope, noted for
   S19's polish pass): the Header's language quick-toggle button shows
   the theme words as its visible label (its aria-label is correct) —
   `apps/web/src/components/Header.tsx` ~line 316.
7. The §15 FRED-only CPI fills for JP/KR/IN — still carried forward to
   a dedicated fill session (BD-S14a/BD-S15d, §"The §15 FRED-only CPI
   fills for Asia" above).

## Known state worth knowing

- The Commodities page reads ONE feed: the S2 projection (GET
  /api/insights/pages/commodities — the 24 home readings, no mirrors,
  no boards). A slow or dead projection takes only the cards away (the
  M-17 last-good localStorage pattern paints the cached copy, labelled).
- The Commodities render audit (`CommoditiesPage.test.tsx`, 7 tests — the
  S16 AustraliaPage.test.tsx pattern scoped to Commodities' 24 cards)
  pins the shell + the 5 group sections + the 24 cards with the §21 trio
  + the gold cross-link to /gold at 44px + the fail-closed paths +
  the fa/RTL Persian rendering. The In-build chip is asserted ABSENT
  (the S17 gates session — BD-S17c's retirement, the S16 trajectory
  mirrored).
- The §21 backtest for Commodities (`commodities-backtest-core.ts`
  reusing S11's pure `auditUsaFreshness` over `COMMODITIES_CARD_IDS`
  [24 cards] + the offline suite [11 tests] + the live
  `pd-s17-backtest.ts`) is the S17 gate; the live run against production
  pre- AND post-deploy: 24/24 green, 5-group membership green,
  freshness honest (24 within grace, 0 beyond — all fresh; unlike
  Australia's 7 honest-stale, Commodities had NO honest-stale path to
  exercise).
- The Commodities budget row (`scripts/check-bundle-budget.mjs`): the
  CommoditiesPage lazy chunk measured 11.93/3.41 (S17, chip retired) vs
  a 16/5 ceiling (the leanest page-division chunk — no zoom, no board,
  no gauges; not re-based down so a future fill-session has the same
  room).
- The rollback lever for the S17 deploy: `npx wrangler rollback` from
  apps/api — /commodities returns to the prior surface (`9d60726b`, S16,
  the S1 PagePlaceholder with the honest In-build chip present); every
  other surface was byte-identical before it (the S17 change is the
  /commodities page build + the §21 backtest + the render audit + the
  chip retirement + the App.tsx wiring only).
