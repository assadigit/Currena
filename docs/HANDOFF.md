# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **S16 (2026-11-10) — Australia build & gates — Phase G CLOSED. Session
> 16/30 · 14 remaining.** Delivered the Australia page build + gates in
> one session: (M1) the pure australia-tiles + the en/fa pd.australia
> copy + the pins (prior session `f078e37`); (M2) the page build — the
> REUSED AU Markets board via the lean adapter, the five-gauge structure
> D-37, the 28 cards with the §21 trio, the 11 moved-out seat chips →
> their new homes (prior session `ba188cb`); (M3) the §21 backtest
> [offline suite + the live pd-s16-backtest.ts] + the render audit
> [AustraliaPage.test.tsx, 7 tests] + the full gates + the In-build chip
> RETIRED at the gates pass (BD-S16c). Live §21 diff 28/28 green pre-
> deploy AND post-deploy. Freshness HONEST (BD-S16d — 7 beyond grace,
> all honestly flagged). Gates ALL GREEN. **Close-out COMPLETE:
> DEPLOYED LIVE (worker `9d60726b`, 2026-11-10 ~20:30 UTC, the owner's
> standing); the post-deploy live §21 re-verify 28/28 green; the 4-leg
> browser pass (1440×900 + 360×844, en + fa) green — the In-build chip
> ABSENT on all 4 legs, 0px overflow, 0 page errors.**

## Current state (2026-11-10, after page-division S16)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase G (Australia) CLOSED: S16
  delivered the Australia page build + gates in one session — the
  owner's home market, reorganized only (D-37). The AU Markets board on
  top (19 symbols: All Ordinaries · Small Ordinaries · 10 ASX-200
  sectors · 4 big banks · ASX 200 VIX · NZX50) via the lean adapter
  (REUSED, no new drawing — the markets board's own feed); the 5-gauge
  structure D-37 (3 voting + 2 shadow, unchanged); the 28 cards with
  the §21 trio (value · 10-year position · freshness); the 11 moved-
  out seat chips → their new homes (/currencies · /asia-pacific ·
  /commodities · /gold). M1 the pure tiles + copy + pins (prior
  `f078e37`); M2 the page build (prior `ba188cb`); M3 the §21 backtest
  + the render audit + the full gates + the In-build chip RETIRED at
  the gates pass (BD-S16c — the S13 Europe / S15 Asia trajectory).**
  Progress: S1 scaffold & navigation · S2 data layer +
  `PLACEMENT.generated.md` · S3 the Global landing page (D-21) · S4 the
  gates & polish (Phase A CLOSED) · S5 the Gold page build · S6 the
  Gold gates + the owner's alternation (Phase B CLOSED) · S7 the
  World Markets page (D-43 map hero + region grids + the 9 risk cards)
  · S8 the Regional zoom maps (Phase C CLOSED) · S9 the USA verdicts +
  tiers 1–2 · S10 the USA tiers 3–6 + the TIC board (all 72 cards + the
  tier-6 "Who finances America" board) · S11 the USA gates (Phase D
  CLOSED) · S12 the Europe page build · S13 the Europe gates (Phase E
  CLOSED) · S14 the Asia build + fills (Phase F OPEN — the 11 placed
  cards + the S8 zoom + the cross-links + the honest In-build chip) ·
  S15 the Asia gates (Phase F CLOSED — the chip retired, the gates
  green, the page live + verified) · **S16 the Australia build & gates
  (Phase G CLOSED — the chip retired at the gates pass, the gates
  green, the §21 diff 28/28 green pre-deploy, the freshness HONEST).**
- **DEPLOYED LIVE (version `9d60726b`, 2026-11-10 ~20:30 UTC, the
  owner's standing):** the /australia page is built + gated + live. The
  live acceptance: the §21 diff re-run against production post-deploy
  28/28 green (the 28 cards' trio inputs byte-identical page ≡ engine;
  the freshness audit honest — 19 within grace + 7 beyond grace all
  honestly stale-flagged, 0 unflagged); currena.ir/australia renders
  the complete page over the live board at 1440×900 AND 360×844 in en
  AND fa (the 5 gauge sections + the world-risk group = 6 sections,
  the 28 cards with the §21 trio, the AU Markets board, the S8 ASX 200
  zoom, the 11 moved-out seat chips resolving to /currencies + /asia-
  pacific + /commodities + /gold at 44px, the In-build chip ABSENT on
  all 4 legs, NO horizontal scroll, ZERO console/page errors); the
  Global + Gold + World Markets + USA + Europe + Asia & Pacific +
  legacy /insights surfaces intact. The prior surface was `6f96cd9a`
  (S15, /asia-pacific); production moved `6f96cd9a` → `9d60726b`.
- **Gates (last full run, S16 — ALL GREEN, 2m 35s):** secret scan
  8/994 · tsc 6/6 · eslint 0/0 · copy:audit clean · narrator vocabulary
  in sync + eval 50 · layer1 11,819/11,819 · **suite 15,019** · build +
  budgets held (entry 270.42/81.88, the AustraliaPage chunk 22.48/5.82
  vs its 26/7 row — the In-build chip RETIREMENT [BD-S16c] shaved the
  chunk 22.76→22.48 raw / 5.92→5.82 gzip).
- **The live §21 diff (pre-deploy + post-deploy re-verified, vs
  https://currena.ir):** 28/28
  cards green (page ≡ engine byte-for-byte), the 6-group membership
  green (inflation-rates 6/6 · households 11/11 · trade-currency 2/2 ·
  activity 7/7 · external 1/1 · world-risk 1/1 = 28 cards; 11 moved-
  out disjoint from the placed set), the freshness audit HONEST (19
  within cadence grace + 7 beyond grace ALL honestly stale-flagged by
  the engine — au-unemployment 69d>60d · terms-of-trade 222d>215d ·
  au-gdp-growth 222d>215d · au-population-growth 312d>270d ·
  au-participation 69d>60d · au-underemployment 69d>60d · au-nom
  312d>270d; 0 unflagged — BD-S16d).

## Next session (S17 — Commodities build & gates · Session 17/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S17 entry + the S16
delivery record), `02-PAGE-DIVISION-SPEC.md` §10 + §21, and this
file. Scope (S17 — Commodities build & gates, Phase H opens): the
`/commodities` page (Energy · Metals · Agriculture · Digital + the
"Trade routes & supply" D-38/D-39 + the gold cross-links D-19/D-27).
The 3 seat chips currently on /australia linking to /commodities
(iron-ore · coal-aus · lng-japan) will resolve to a real page instead
of the placeholder. The S9–S16 display-layer pattern to mirror: pure
tiles + the §21 trio + the copy pins + the live backtest + the render
audit + the mobile/ARIA pass + the In-build chip (build-session chip →
gates-session retirement, the USA/Europe/Asia/Australia trajectory).
**Gates:** the 24 cards; chokepoint data within PortWatch cadence;
mobile/ARIA; the §21 diff over the cards green twice (pre- and post-
deploy); typecheck + lint + copy:audit + build/budgets; browser
verification at 1440×900 and 360×844 in en + fa; commit pushed at
every checkpoint. The deploy at the close is the owner's standing.

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
session (S17's sibling or a one-off) picks a viable monthly source,
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
   Asia gates — Phase F CLOSED) + **BD-S16a/b/c/d (the Australia
   build & gates — Phase G CLOSED)** (all recorded, none blocking).
4. Triage the queued unreviewed fa strings (now ~957: the ~818
   previous + the 139 S16 `pd.australia.*` keys; the S16 corpus-pinned
   values — the 28 card names + the unit/position/band/status words —
   are verified byte-for-byte by `australia-copy-pin.test.ts`, the
   fresh section/intro/loading/board copy pending review).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. A small pre-existing display quirk (out of S9–S16's scope, noted for
   S19's polish pass): the Header's language quick-toggle button shows
   the theme words as its visible label (its aria-label is correct) —
   `apps/web/src/components/Header.tsx` ~line 316.
7. The §15 FRED-only CPI fills for JP/KR/IN — still carried forward to
   a dedicated fill session (BD-S14a/BD-S15d, §"The §15 FRED-only CPI
   fills for Asia" above).

## Known state worth knowing

- The Australia page reads ONE feed: the S2 projection (GET
  /api/insights/pages/australia — the 28 home readings) + the AU
  Markets board the zoom reads (its own feed). A slow or dead
  projection never takes the zoom away (each feed governs its own
  surface).
- The Australia render audit (`AustraliaPage.test.tsx`, 7 tests — the
  S11 UsaPage.test.tsx / S13 EuropePage.test.tsx / S15 AsiaPage.test.tsx
  pattern scoped to Australia's 28 cards) pins the shell + the AU
  Markets board on top + the five-gauge structure D-37 + the 28 cards
  with the §21 trio + the 11 moved-out seat chips (44px → /currencies
  + /asia-pacific + /commodities + /gold) + the fail-closed paths +
  the fa/RTL Persian rendering. The In-build chip is asserted ABSENT
  (the S16 gates session — BD-S16c's retirement, the EuropePage S13 /
  AsiaPage S15 pattern mirrored).
- The §21 backtest for Australia (`australia-backtest-core.ts` reusing
  S11's pure `auditUsaFreshness` over `AUSTRALIA_CARD_IDS` [28 cards]
  + the offline suite [11 tests] + the live `pd-s16-backtest.ts`) is
  the S16 gate; the live run against production pre-deploy: 28/28
  green, 6-group membership green, freshness honest (19 within grace
  + 7 beyond grace all flagged — BD-S16d, the S11 freshness-audit
  formalization mirrored, with the AU honest-stale path EXERCISED
  unlike Asia's).
- The AU per-change ids (rba-cash-rate · rba-fed-gap) ride the exempt
  path (the freshness audit carries them honestly without a stale flag
  — they have no cadence grace window to violate, they're change
  readings not point-in-time readings).
- The Australia budget row (`scripts/check-bundle-budget.mjs`): the
  AustraliaPage lazy chunk measured 22.48/5.82 (S16, chip retired)
  vs a 26/7 ceiling (the S13 Europe / S15 Asia pattern — not re-based
  down so a future fill-session has the same room).
- The rollback lever for the S16 deploy: `npx wrangler rollback` from
  apps/api — /australia returns to the prior surface (`6f96cd9a`, S15,
  the S8 RegionPage placeholder with the honest In-build chip present);
  every other surface was byte-identical before it (the S16 change is
  the /australia page build + the §21 backtest + the render audit +
  the chip retirement only).
