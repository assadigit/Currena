# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## Current state (2026-11-09, after page-division S10)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase D (USA) OPEN: S10 delivered
  & gated — /usa is the COMPLETE American bulk.** Progress: S1 scaffold &
  navigation · S2 data layer + `PLACEMENT.generated.md` · S3 the Global
  landing page (D-21) · S4 the gates & polish (Phase A CLOSED) · S5 the
  Gold page build · S6 the Gold gates + the owner's alternation (Phase B
  CLOSED) · S7 the World Markets page (D-43 map hero + region grids +
  the 9 risk cards) · S8 the Regional zoom maps (Phase C CLOSED) · S9
  the USA verdicts + tiers 1–2 · **S10 the USA tiers 3–6 + the TIC
  board: all 72 registry cards in five tiers (7/19/12/17/17) + the
  tier-6 "Who finances America" board — the REUSED legacy TicSection
  drawing through the narrowed copy contract (BD-S10a) over the existing
  `GET /api/insights/tic` route, the net transactions shown SEPARATELY
  from the valuation effect, the custody-hub caveat, 24-month history —
  and the §7 item-8 index section recorded as the S8 zoom (BD-S10c). The
  placeholder body is RETIRED (BD-S10b); the honest In-build chip stays
  for S11's gates.**
- **DEPLOYED & LIVE** (`18907d4d`, 2026-11-08 22:24 UTC): the complete
  USA page is live at **https://currena.ir/usa** — the §21 diff re-run
  against production post-deploy **173/173 green** (the 72 cards' trio
  inputs byte-identical page ≡ Global ≡ engine; the TIC board's every
  derived row ≡ the arithmetic restated independently; the freshness
  audit honest); the deployed UsaPage + tic chunks byte-identical to the
  local build; the Global + Gold + World Markets + region + legacy
  surfaces intact. The live acceptance: `docs/DEPLOY.md` 2026-11-09b.
- **Gates (last full run):** ALL GREEN — secret scan 8/968 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean (7,486 entries; the 116 new `pd.usa.*`
  fa strings queued unreviewed — the queue is now ~737) · narrator in
  sync + eval 50 · layer1 11,819/11,819 · **suite 14,917 = +11**
  (usa-tiles 16 · usa-copy-pin 6 · UsaPage 7 · usa-backtest 11) · build
  + budgets held (entry 270.07/81.82 · the UsaPage chunk re-based
  24.49/6.38 vs its 26/7 row · the NEW shared tic chunk 21.16/5.59 vs
  its 24/7 row — the reused drawing paid once, the Insights chunk SHRANK
  1553.17→1532.14 through the split).

## Next session (S11 — USA gates · Phase D closes)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S11 entry + the S10
delivery record), `02-PAGE-DIVISION-SPEC.md` §7 + §21, and this file.
Scope (S11): the full card-render audit vs the placement table (72 cards
+ the TIC board, every §21 trio leg), freshness within cadence grace
(the live `pd-s10-backtest.ts` already carries the freshness audit — S11
formalizes it as the gate), mobile/ARIA polish, the In-build chip's
retirement, and the hand-off. The S10 reuse levers: `pd-s10-backtest.ts`
is the live gates script to re-run; `usa-backtest-core.ts` carries the
diff core; the browser pass pattern (serve-local-preview + the DOM
geometry checks + the VLM-disproof discipline) is the S9/S10 record.
Gates: card audit, freshness, mobile/ARIA; typecheck + lint +
copy:audit + build/budgets; browser verification at 1440×900 and
360×844 in en + fa; commit pushed at every checkpoint. The deploy at
the close is the owner's standing.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; now RENDERED on /usa tier-3, so
   the ratification either confirms the seat or re-points it).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + BD-S8a/b/c + BD-S9a/b/c + **BD-S10a (the TIC reuse through
   the narrowed contract — one drawing, one vocabulary) + BD-S10b (the
   placeholder body retired; the In-build chip stays for S11) + BD-S10c
   (the S8 zoom recorded as the §7 item-8 index section)** (all
   recorded, none blocking).
4. Triage the queued unreviewed fa strings (now ~737: the ~621 queued +
   the 116 new S10 `pd.usa.*` keys in
   `docs/localization/persian-copy-manifest.json` — fresh words only
   (the tier 3–6 headings + intros + the TIC tier title); every card
   name, unit word and the whole TIC block is corpus-pinned by
   `usa-copy-pin.test.ts`).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. A small pre-existing display quirk (out of S9/S10's scope, noted for
   S19's polish pass): the Header's language quick-toggle button shows
   the theme words as its visible label (its aria-label is correct) —
   `apps/web/src/components/Header.tsx` ~line 316.

## Known state worth knowing

- The markets/fx boards run daily (23:30/01:30 UTC crons); the insights
  snapshot daily (~04:20 UTC + the public-projection rung); live prices
  hourly (:13); the narrator hourly (:50); the TIC snapshot ~6–7 weeks
  after its reference month (the rung3 `tic-slt` source; the current
  board: dataMonth 2026-08, released 2026-10-16 — the >70-day stale
  badge fires around mid-November until the 2026-09 release lands).
- The USA page reads three independent feeds, each with its own honest
  states: the S2 projection (the strip + the tiers), the markets board
  (the zoom) and the TIC route (the tier-6 board). A slow or dead feed
  never takes the others away.
- The rollback lever for the 2026-11-09b deploy: `wrangler rollback` —
  /usa would return to the S9 page (the strip + tiers 1–2 + the zoom);
  every other surface was byte-identical before it.
