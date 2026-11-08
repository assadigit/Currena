# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## THIS SESSION (S9, opened 2026-11-09)

**Goal:** the USA page per spec §7 items 1–3 — the 5 thematic gauge
verdicts atop (D-30: the same computed verdicts as Global, US-framed
copy) · tier-1 "the world watches" 7 cards (D-29) · tier-2 rates & the
Fed (the placement's authoritative 19 ids — the spec's "(22)" label is
the recorded AF-2 drift). The placeholder body stays honest for tiers
3–6 + TIC (S10's scope); the S8 zoom section stays on top.

**Milestones (commit + push at every checkpoint):**
1. M1 pure layer — `pageGroupIds` (engine-side accessor) + `usa-tiles.ts`
   (the verdict strip's derivations + the tier card entries + the display
   configs) + `usa-tiles.test.ts` (pins vs `config/display.ts`).
2. M2 copy — `pd.usa.*` en+fa + `usa-copy-pin.test.ts` (26 card names +
   unit/position/band/status words pinned to the corpus) + the fa strings
   queued unreviewed in the Persian manifest.
3. M3 views + wiring — `UsaVerdictStrip` · `UsaTierCards` · `UsaPage`
   (the GoldPage container pattern) + the App route split (/usa leaves
   the region set) + the characterization suite.
4. M4 the §21 backtest — `usa-backtest-core.ts` (page ≡ Global ≡ engine,
   byte-for-byte) + the offline suite + `pd-s9-backtest.ts`; live run
   pre-deploy.
5. M5 full gates — `pnpm gates` green (build + budgets; the new UsaPage
   budget row).
6. M6 the browser pass — 1440×900 AND 360×844 in BOTH en and fa over the
   production API; DOM checks; fixes.
7. M7 records + the deploy at the close (the owner's standing) + the
   live acceptance (post-deploy backtest + live page checks).

## Current state (2026-11-08, after page-division S8)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase C (World Markets) CLOSED:
  Sessions 7 and 8 delivered & gated.** Progress: S1 scaffold &
  navigation · S2 data layer + `PLACEMENT.generated.md` · S3 the Global
  landing page (D-21) · S4 the gates & polish (Phase A CLOSED) · S5 the
  Gold page build · S6 the Gold gates + the owner's alternation (Phase
  B CLOSED) · S7 the World Markets page (`/world-markets` — the REUSED
  D-43 map hero, the status summary, the Asia 7 · Europe 4 · Americas 5
  region grids, the 9 world risk & liquidity cards) · **S8 the Regional
  zoom maps: the four REGION pages render their D-44 index/map sections
  LIVE — the REUSED WorldMap in region mode (ONE drawing, the
  `REGION_ZOOMS` windows + seated pins/cards, the all-16 colour scale BY
  CONSTRUCTION so a zoomed market's colour + hero number are the world
  map's own, the words through the ONE shared corpus-pinned adapter),
  `RegionIndexSection` (the board's M-17 state + the stamp) above the
  unchanged S1 placeholder body on `RegionPage`; a card click — and a
  mobile dot tap — opens the market's full home today, /world-markets;
  the mobile dot-tap fallback also fixed the dead S7 dot on
  /world-markets.**
- **DEPLOYED & LIVE** (`fde50a95`, 2026-11-08 ~19:25 UTC): the four
  zooms are live at **https://currena.ir/usa · /europe · /asia-pacific
  · /australia** — the §21 zoom-consistency diff re-run against
  production 13/13 green post-deploy; the Global + Gold + World Markets
  + legacy surfaces intact. The live acceptance: `docs/DEPLOY.md`
  2026-11-08g.
- **Gates (last full run):** ALL GREEN — secret scan 8/954 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean (7,311 entries) · narrator in sync +
  eval 50 · layer1 11,819/11,819 · **suite 14,877** · build + budgets
  held (entry 269.71/81.55→81.70 · GlobalPage 24.40/6.27 · GoldPage
  31.26/8.07 · WorldMarketsPage 23.10/5.64 — it SHRANK 26.54→23.10
  through the S8 adapter sharing; **the new RegionPage chunk 3.95/1.56
  vs its new 8/3 row**; the Insights chunk held 1553.13/356.56 — the
  map's bytes stay paid once).

## Next session (S9 — USA verdicts + tiers 1–2, Phase D opens)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S9 entry + the S8
delivery record), `02-PAGE-DIVISION-SPEC.md` §7 + §14 (the USA tiers)
+ §21, and this file. Scope (S9): the 5 gauge verdicts atop the USA
page (D-30 — the same computed verdicts as Global, US-framed copy) ·
tier-1 "the world watches" 7 cards (D-29) · tier-2 rates & the Fed. The
S8 reuse levers: `RegionPage.tsx` + `RegionIndexSection.tsx` are the
region-page shell the USA build fills (the placeholder body retires as
the tiers land); `pd.usa.*` carries the copy; the zoom section already
tops the page. Gates: the verdicts match Global's engine values; the
tier-1 cards complete; the §21 trio on every card; mobile/ARIA.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + **BD-S8a (the one-drawing region prop) + BD-S8b (the zoom
   sections' scope — the map now, the region's own cards in S9–S16;
   the AU Markets board is S16's own table) + BD-S8c (the card click →
   /world-markets today, retargeting as the region pages grow their own
   rows)** (all recorded, none blocking).
4. Triage the queued unreviewed fa strings (now ~562: the ~557 queued +
   the 5 new S8 `pd.regionZoom` keys in
   `docs/localization/persian-copy-manifest.json` — fresh words only;
   every word inside the map drawing is corpus-pinned by
   `world-markets-copy-pin.test.ts`).
5. The external investor's review of the spec (§19) — Phase 3's input.

## Known state worth knowing

- The markets/fx boards run daily (23:30/01:30 UTC crons); the insights
  snapshot daily (~04:20 UTC + the public-projection rung); live prices
  hourly (:13); the narrator hourly (:50). A snapshot stored after the
  last :50 rung leaves the narrator one state behind until the next rung
  — honest, self-healing, and the page's "Updated" stamp says so.
- The S8 zooms read the SAME markets board the world map reads — the
  board's own stamp rides each region section; when the board is stale
  the zooms show the same honest grey cards the world map shows (the
  M17 old-data rule, shared code).
- The rollback lever for the 2026-11-08g deploy: `wrangler rollback` —
  the four region routes would return to the S1 placeholders; the
  Global + Gold + World Markets + legacy surfaces were byte-identical
  before it.
