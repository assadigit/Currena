# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## Current state (2026-11-09, after page-division S11)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase D (USA) CLOSED: S11
  delivered the USA gates — the freshness audit formalized, the
  mobile/ARIA polish landed, the In-build chip retired.** Progress:
  S1 scaffold & navigation · S2 data layer + `PLACEMENT.generated.md` ·
  S3 the Global landing page (D-21) · S4 the gates & polish (Phase A
  CLOSED) · S5 the Gold page build · S6 the Gold gates + the owner's
  alternation (Phase B CLOSED) · S7 the World Markets page (D-43 map
  hero + region grids + the 9 risk cards) · S8 the Regional zoom maps
  (Phase C CLOSED) · S9 the USA verdicts + tiers 1–2 · S10 the USA
  tiers 3–6 + the TIC board (all 72 cards + the tier-6 "Who finances
  America" board) · **S11 the USA gates: the freshness-within-cadence-
  grace audit formalized as a pure function `auditUsaFreshness` + a
  5-test offline suite (BD-S11a), the mobile/ARIA polish — the
  Show-all toggle's `aria-controls` + the period switch's 44px touch
  target (BD-S11b), the honest In-build chip retired (BD-S11c —
  BD-S10b's completion: the gates passed).**
- **DEPLOYED & LIVE** (`4f288272`, 2026-11-09 00:42 UTC): /usa is live
  at **https://currena.ir/usa** with the In-build chip ABSENT, the
  period switch at 44px, the Show-all toggle's aria-controls resolving —
  the §21 diff re-run against production post-deploy **173/173 green**
  (the 72 cards' trio inputs byte-identical page ≡ Global ≡ engine; the
  TIC board's every derived row ≡ the arithmetic restated independently;
  the freshness audit through the pure function — govt-interest-revenue
  222d beyond its 215d grace AND honestly carrying the engine's stale
  status); the deployed UsaPage + tic chunks byte-identical to the local
  build (24,198 + 21,195 bytes); the Global + Gold + World Markets +
  region + legacy surfaces intact. The live acceptance:
  `docs/DEPLOY.md` 2026-11-09c.
- **Gates (last full run):** ALL GREEN — secret scan 8/968 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean · narrator in sync + eval 50 · layer1
  11,819/11,819 · **suite 14,922 = +5** (usa-backtest 16 = +5 for the
  freshness audit formalization · TicSection 14 = +1 aria-controls
  assertion · UsaPage 7 · usa-tiles 16 · usa-copy-pin 6) · build +
  budgets held (entry 270.07/81.83 · the UsaPage chunk 24.20/6.29 vs
  its 26/7 row — the chip removal shaved ~288 bytes · the shared tic
  chunk 21.20/5.61 vs its 24/7 row — the aria-controls + useId added
  ~39 bytes).

## Next session (S12 — Europe build + fills · Phase E opens)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S12 entry + the S11
delivery record), `02-PAGE-DIVISION-SPEC.md` §8 + §15, and this file.
Scope (S12): the Europe page build — the EU section & the non-EU (UK)
section listed apart (D-33); the Europe zoom map (STOXX50E · DAX · CAC ·
FTSE, the S8 zoom already renders it — the page's own layers seat under
it); the FRED-only fills (D-34): euro-area unemployment · industrial
production · ECB-SDMX liquidity — **verify each candidate series live
against the publisher before ingest** (Agent Rule 5: unverifiable →
discard + record); the 8 placed Europe ids (ecb-dfr · euro-hicp ·
euro-aaa-10y · bund-10y · btp-bund-spread · oecd-cli-de · gilt-10y ·
boe-rate) + the cross-links (eur-usd · usdchf · usdtry → /currencies).
The S11 reuse levers: `auditUsaFreshness` in `usa-backtest-core.ts` is
the pattern for any new freshness-audit logic; the S8 `RegionIndexSection`
is the zoom-on-top shell; the S9/S10 `UsaVerdictStrip` + `UsaTierCards`
are the tier-card pattern (the §21 trio per card); the
`usa-backtest-core.ts` three-side diff is the §21 gate pattern.
Gates: fills verified against publisher releases (Rule 5); EU/non-EU
split correct; the §21 diff over the 8 cards green; typecheck + lint +
copy:audit + build/budgets; browser verification at 1440×900 and
360×844 in en + fa; commit pushed at every checkpoint. The deploy at
the close is the owner's standing.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; now RENDERED on /usa tier-3, so
   the ratification either confirms the seat or re-points it).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + BD-S8a/b/c + BD-S9a/b/c + BD-S10a/b/c + **BD-S11a (the
   freshness audit formalized as a pure function + offline suite) +
   BD-S11b (the mobile/ARIA polish — aria-controls + the 44px touch
   target) + BD-S11c (the In-build chip retired — BD-S10b's
   completion)** (all recorded, none blocking).
4. Triage the queued unreviewed fa strings (now ~737: the ~621 queued +
   the 116 S10 `pd.usa.*` keys; S11 added NO new fa strings — the chip
   retirement removed a key reference but the key stays in the
   dictionary for the not-yet-built pages).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. A small pre-existing display quirk (out of S9/S10/S11's scope, noted
   for S19's polish pass): the Header's language quick-toggle button
   shows the theme words as its visible label (its aria-label is
   correct) — `apps/web/src/components/Header.tsx` ~line 316.

## Known state worth knowing

- The markets/fx boards run daily (23:30/01:30 UTC crons); the insights
  snapshot daily (~04:20 UTC + the public-projection rung); live prices
  hourly (:13); the narrator hourly (:50); the TIC snapshot ~6–7 weeks
  after its reference month (the rung3 `tic-slt` source; the current
  board: dataMonth 2026-08, released 2026-10-16 — the >70-day stale
  badge fires around mid-November until the 2026-09 release lands).
- The freshness audit (`auditUsaFreshness` in `usa-backtest-core.ts`)
  is the §21 "Data audit" leg: a card beyond its registry's maxAgeDays
  must honestly carry the engine's `stale` status. The live
  `pd-s10-backtest.ts` script calls the SAME pure function the offline
  suite pins — no logic drift. The govt-interest-revenue card (quarterly,
  maxAge 215d) is currently 222d beyond grace AND status 'stale' — the
  page speaks the engine's own word. When the 2026-Q3 figure lands, the
  card returns within grace.
- The USA page reads three independent feeds, each with its own honest
  states: the S2 projection (the strip + the tiers), the markets board
  (the zoom) and the TIC route (the tier-6 board). A slow or dead feed
  never takes the others away.
- The rollback lever for the 2026-11-09c deploy: `wrangler rollback` —
  /usa would return to the S10 page (the complete 72 cards + the TIC
  board WITH the In-build chip and the 37px period switch); every other
  surface was byte-identical before it.
