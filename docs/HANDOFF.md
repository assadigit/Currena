# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## THIS SESSION'S GOAL (S8, written before coding — AGENTS.md §2.6)

**S8 — the Regional zoom maps (Phase C continues, spec §6 note + §7 item 8
+ §8 item 3 + §9 item 6, D-13/D-43/D-44):** zoomed continent maps for the
four region pages — Europe-only, Asia-only, Americas/US, AU — data from
the SAME markets board payload (no new fetches, no new KV). Milestones:
M1 the zoom config (windows + subsets + card positions) · M2 the WorldMap
region-zoom mode (one drawing, the same rows/colours/words, D-48) · M3
the region pages render their zoom + the copy · M4 the tests + the §21
zoom-consistency backtest · M5 the gates + the browser pass (1440×900 +
360×844, en + fa RTL) · M6 the deploy (the owner's standing) + the
records + the hand-off.

## Current state (2026-11-08, after page-division S7)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase C (World Markets) OPEN:
  Session 7/30 delivered & gated.** Progress: S1 scaffold & navigation ·
  S2 data layer + `PLACEMENT.generated.md` · S3 the Global landing page
  (D-21) · S4 the gates & polish (Phase A CLOSED) · S5 the Gold page
  build · S6 the Gold gates + the owner's alternation (Phase B CLOSED)
  · **S7 the World Markets page build: `/world-markets` renders the
  REUSED world-index map (D-43 — one drawing, never restated, fed the
  corpus-pinned `pd.worldMarkets.map.*` keys through the S7
  `WorldMapCopy` structural interface) beside the status summary (the
  board's own §5.3 rollup + the RAW ≥10%/≥20% counts + the stated
  4+/8+ rule), the three region grids (Asia 7 · Europe 4 · Americas 5 —
  every row chg 1d/1w/1m/3m/1y, 52-wk range position, ±1% trend band,
  −10%/−20% status pills), and the 9 world risk & liquidity cards; a map
  callout click scrolls to the market's region-grid row.**
- **DEPLOYED & LIVE** (`6e515cf8`, 2026-11-08 ~17:45 UTC): the page is
  live at **https://currena.ir/world-markets** — the §21 diff re-run
  against production 56/56 green post-deploy; the Global + Gold +
  legacy surfaces intact. The live acceptance: `docs/DEPLOY.md`
  2026-11-08f.
- **Gates (last full run):** ALL GREEN — secret scan 8/943 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean (7,306 entries) · narrator in sync +
  eval 50 · layer1 11,819/11,819 · **suite 14,839** · build + budgets
  held (entry 269.32/81.55 · GlobalPage 24.33/6.23 · GoldPage 31.26/8.07
  · **WorldMarketsPage 26.54/6.49 vs its new 30/8 row**; the REUSED map
  tree rides the SHARED chunk — the Insights chunk SHRANK
  1569.16→1553.03 through the sharing, the map's bytes paid once).

## Next session (S8 — the Regional zoom maps, Phase C)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S8 entry + the S7
delivery record), `02-PAGE-DIVISION-SPEC.md` §6 (the zoom-maps note) +
§21, and this file. Scope (S8): zoomed continent maps for the region
pages (Europe-only, Asia-only, Americas/US, AU) per D-13/D-44 — data
from the same board payload. Gates: all four zooms render; consistency
with the world map; hand-off. Known lever: the S7 `WorldMapCopy`
contract + the corpus-pinned adapter (`WorldMarketsHero.tsx`) are the
reuse pattern for any surface that re-renders the map with its own
words.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a (all
   recorded, none blocking) — and now **BD-S7a** (the WorldMapCopy
   structural interface: the REUSED map fed the corpus-pinned
   pd.worldMarkets keys) + **BD-S7b** (the page container at 1280px so
   the map's callout cards keep their designed stage width).
4. Triage the queued unreviewed fa strings (now ~557: 391 + the 166 new
   S7 keys in `docs/localization/persian-copy-manifest.json` — the
   corpus-mirroring ones are byte-pinned to the corpus by
   `world-markets-copy-pin.test.ts`, the fresh words (the rule line, the
   bear line, the range-position labels, the section headings, the
   load/error states) await review).
5. The external investor's review of the spec (§19) — Phase 3's input.

## Known state worth knowing

- The markets/fx boards run daily (23:30/01:30 UTC crons); the insights
  snapshot daily (~04:20 UTC + the public-projection rung); live prices
  hourly (:13); the narrator hourly (:50). A snapshot stored after the
  last :50 rung leaves the narrator one state behind until the next rung
  — honest, self-healing, and the page's "Updated" stamp says so.
- The World Markets page's status summary reads the board's OWN §5.3
  rollup (signal + counts) beside the RAW ≥10%/≥20% counts — the
  buffered-vs-RAW divergence (the exit-buffer staying rule vs the being
  rule) is the designed S1-M1.6 #2 note, reported by the §21 backtest as
  a note, never a failure.
- The rollback lever for the 2026-11-08f deploy: `wrangler rollback` —
  `/world-markets` would return to the S1 placeholder; the Global + Gold
  + legacy surfaces were byte-identical before it.
