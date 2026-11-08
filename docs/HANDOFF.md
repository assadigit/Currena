# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## Current state (2026-11-09, after page-division S9)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase D (USA) OPEN: S9 delivered
  & gated.** Progress: S1 scaffold & navigation · S2 data layer +
  `PLACEMENT.generated.md` · S3 the Global landing page (D-21) · S4 the
  gates & polish (Phase A CLOSED) · S5 the Gold page build · S6 the Gold
  gates + the owner's alternation (Phase B CLOSED) · S7 the World
  Markets page (D-43 map hero + region grids + the 9 risk cards) · S8
  the Regional zoom maps (Phase C CLOSED) · **S9 the USA verdicts +
  tiers 1–2: `/usa` renders the D-30 verdict strip (the same five
  computed verdicts as Global through ONE derivation —
  `usaGaugeVerdicts` IS `globalGaugeTiles`, the verdict words and
  why-lines riding the existing `pd.global` keys) above tier-1 "the
  world watches" (D-29's 7) and tier-2 rates & the Fed (the placement's
  authoritative 19 — the spec's "(22)" label is the recorded AF-2
  drift), every card with the §21 trio (value / 10-year position /
  freshness) through the DISPLAY registry's own joins
  (`usaCardValueText`, pinned output-for-output against
  `formatReadingValue`). The S8 zoom section stays on top through every
  page state; the In-build chip + the placeholder body stay for tiers
  3–6 + TIC (S10's scope).**
- **DEPLOYED & LIVE** (`36f64141`, 2026-11-08 ~20:35 UTC): the USA page
  is live at **https://currena.ir/usa** — the §21 three-side diff
  re-run against production post-deploy 69/69 green (page ≡ Global's
  page derivation ≡ the engine over the served snapshot, byte-for-byte;
  all 26 cards' trio inputs byte-identical to the snapshot); the Global
  + Gold + World Markets + the three remaining region pages + the legacy
  /insights intact. The live acceptance: `docs/DEPLOY.md` 2026-11-09a.
- **Gates (last full run):** ALL GREEN — secret scan 8/964 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean (7,370 entries; the 59 new `pd.usa.*`
  fa strings queued unreviewed — the queue is now ~621) · narrator in
  sync + eval 50 · layer1 11,819/11,819 · **suite 14,906 = +29**
  (usa-tiles 12 · usa-copy-pin 4 · UsaPage 7 · usa-backtest 6) · build +
  budgets held (entry 270.04/81.81 · GlobalPage SHRANK 24.40→23.04 and
  RegionPage 3.95→1.65 through the shared global-tiles /
  RegionIndexSection chunks · **the new UsaPage chunk 15.21/4.29 vs its
  new 20/6 row** · Insights 1553.17/356.56 untouched).

## Next session (S10 — USA tiers 3–6 + TIC + the index section)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S10 entry + the S9
delivery record), `02-PAGE-DIVISION-SPEC.md` §7 items 4–8 + §14 + §21,
and this file. Scope (S10): tier-3 inflation (12) · tier-4 labor &
growth (17) · tier-5 liquidity/stress/valuation (17) · tier-6 the TIC
board (D-31: the existing `GET /api/insights/tic` route — one KV read,
the §16 custody-hub caveat discipline) · the SPX/NDX/DOW index section's
own cards/rows beyond the S8 zoom map. The S9 reuse levers:
`UsaTierCards.tsx` is the tier-section pattern to extend (the §21 trio
per card); `usa-tiles.ts` gains the tier 3–5 display configs the same
lean-restated way (pinned vs `config/display.ts`); `pageGroupIds` is the
engine-side accessor; `pd.usa.*` carries the copy (the 26 new card names
pinned to the corpus by a growing `usa-copy-pin.test.ts`). Gates: the
full card-render audit vs the placement table; freshness within cadence
grace; the §21 backtest extended to the new cards; mobile + RTL; typecheck
+ lint + copy:audit + build/budgets; browser verification at 1440×900
and 360×844 in en + fa; commit pushed at every checkpoint. The deploy at
the close is the owner's standing.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + BD-S8a/b/c + **BD-S9a (the one-derivation verdict strip
   with the shared vocabulary riding pd.global) + BD-S9b
   (dollar-strength the only strip link, → /currencies) + BD-S9c (the
   zoom on top through every state; the placeholder body stays until
   S10)** (all recorded, none blocking).
4. Triage the queued unreviewed fa strings (now ~621: the ~562 queued +
   the 59 new S9 `pd.usa.*` keys in
   `docs/localization/persian-copy-manifest.json` — fresh words only
   (the strip questions + tier headings + loading/error lines); every
   card name, unit, position, band and status word is corpus-pinned by
   `usa-copy-pin.test.ts`).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. A small pre-existing display quirk (out of S9's scope, noted for
   S19's polish pass): the Header's language quick-toggle button shows
   the theme words as its visible label (its aria-label is correct) —
   `apps/web/src/components/Header.tsx` ~line 316.

## Known state worth knowing

- The markets/fx boards run daily (23:30/01:30 UTC crons); the insights
  snapshot daily (~04:20 UTC + the public-projection rung); live prices
  hourly (:13); the narrator hourly (:50). A snapshot stored after the
  last :50 rung leaves the narrator one state behind until the next rung
  — honest, self-healing, and the page's "Updated" stamp says so.
- The USA page reads the SAME markets board the world map reads (the
  zoom) and the SAME insights snapshot (the strip + the tiers, through
  the S2 projection). When the feed is stale the cards show the same
  honest states the legacy cards show (the M-17 last-good pattern,
  shared code).
- The rollback lever for the 2026-11-09a deploy: `wrangler rollback` —
  /usa would return to the S8 zoom-only page; the Global + Gold + World
  Markets + region + legacy surfaces were byte-identical before it.
