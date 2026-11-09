# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## Current state (2026-11-09, after page-division S13)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase E (Europe) CLOSED: S13
  delivered the Europe gates — the full card-render audit vs the
  placement table green (the 8 cards + the §21 trio, every leg re-audited
  as the session's own gate), the freshness-within-cadence-grace audit
  honest (btp-bund-spread 100d > 75d AND status 'stale'), the mobile/ARIA
  pass (the 44px cross-link touch targets, the section-heading semantics,
  the RTL flow) pinned + browser-verified, the honest In-build chip
  retired (BD-S12b's completion); the §15 FRED-only fills stay
  verified-pending-ingest (Rule 5 — BD-S13d: the ingest is engine-layer,
  a dedicated fill session).** Progress: S1 scaffold & navigation · S2
  data layer + `PLACEMENT.generated.md` · S3 the Global landing page
  (D-21) · S4 the gates & polish (Phase A CLOSED) · S5 the Gold page
  build · S6 the Gold gates + the owner's alternation (Phase B CLOSED)
  · S7 the World Markets page (D-43 map hero + region grids + the 9 risk
  cards) · S8 the Regional zoom maps (Phase C CLOSED) · S9 the USA
  verdicts + tiers 1–2 · S10 the USA tiers 3–6 + the TIC board (all 72
  cards + the tier-6 "Who finances America" board) · S11 the USA gates
  (the freshness audit formalized, the mobile/ARIA polish, the In-build
  chip retired — Phase D CLOSED) · S12 the Europe page build (the EU +
  non-EU UK sections, the 8 placed ids, the zoom, the cross-links, the
  §21 backtest — Phase E OPEN) · **S13 the Europe gates: the new
  `EuropePage.test.tsx` render audit (7 tests — the S11 UsaPage.test.tsx
  pattern mirrored for Europe's 8 placed cards), the freshness audit
  formalized as the session's own gate (the pure `auditUsaFreshness` over
  `EUROPE_CARD_IDS` — already wired in S12, run live as the gate), the
  mobile/ARIA pass pinned (the cross-link 44px + the section semantics +
  the fa/RTL rendering — the S12 build already carried the S11 lessons,
  the pass is the verification + the pin), the In-build chip RETIRED
  (BD-S12b's completion), the Europe lazy chunk's own budget row
  (10.07/3.06 vs 14/5); the §15 FRED-only fills carried forward
  (Rule 5 — BD-S13d, a dedicated fill session) — Phase E CLOSED.**
- **DEPLOYED & LIVE** (`b11fd84f`, 2026-11-09 ~03:44 UTC): /europe is
  live at **https://currena.ir/europe** with the 8 cards (ecb-dfr ·
  euro-hicp · euro-aaa-10y · bund-10y · btp-bund-spread · oecd-cli-de ·
  gilt-10y · boe-rate), the EU section + the UK section listed apart,
  the S8 zoom, the 3 cross-links (eur-usd · usdchf · usdtry →
  /currencies), the **In-build chip RETIRED** (the 8 placed ids' gates
  pass) — the §21 diff re-run against production post-deploy **8/8
  green** (the 8 cards' trio inputs byte-identical page ≡ engine; the
  freshness audit honest — btp-bund-spread 100d beyond its 75d monthly
  grace AND carrying the engine's stale status); the browser pass at
  1440×900 and 360×844 in en + fa with ZERO overlaps/overflow/errors (the
  In-build chip ABSENT on all 4 legs, the 3 cross-links all at 44px);
  the Global + Gold + World Markets + USA + region + legacy surfaces
  intact. The live acceptance: `docs/DEPLOY.md` 2026-11-09e.
- **Gates (last full run):** ALL GREEN — secret scan 8/977 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean (no new fa strings — S13 only removed the
  chip + added a test) · narrator in sync + eval 50 · layer1
  11,819/11,819 · **suite 14,952 = +7** (EuropePage render audit) ·
  build + budgets held (entry 270.28/81.87; the Europe lazy chunk
  10.07/3.06 vs its new 14/5 row).

## Next session (S14 — Asia build + fills · Session 14/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S14 entry + the S13
delivery record), `02-PAGE-DIVISION-SPEC.md` §9 + §15 + §21, and this
file. Scope (S14 — Asia build + fills, Phase F opens): the five
sub-regions (D-35) — China (china-pmi · china-cpi · oecd-cli-cn ·
gpr-china · gpr-taiwan · china-property-investment · china-steel-output,
+ SGE links → /gold) · Japan (jgb-10y · boj-rate, + the Japan CPI fill
§15) · Korea/Taiwan/HK (KOSPI · TAIEX · HSI, + the Korea CPI fill) ·
India (NIFTY50, + the India CPI fill) · Pacific — New Zealand (D-17:
nz-short-rate · nz-10y · NZX50); the Asia zoom map (N225 · KOSPI · HSI
· SSEC · TAIEX · NIFTY50 · NZX50); the FRED CPI fills for JP/KR/IN
(D-36 — **verify each candidate series live before ingest**, Rule 5;
unverifiable → discard + record, the BD-S12a/BD-S13d pattern). The
usdjpy / us-japan-10y-gap / usdcny cards live on Currency Pairs (D-32);
usdcny cross-links into the China section. Gates: the §21 diff over the
placed cards green; the fills verified against the national-statistics
releases (Rule 5); typecheck + lint + copy:audit + build/budgets;
browser verification at 1440×900 and 360×844 in en + fa; commit pushed
at every checkpoint. The deploy at the close is the owner's standing.

### The §15 FRED-only fills for Europe — carried forward (BD-S13d)

The three D-34 Europe fills (euro-area unemployment · industrial
production · ECB-SDMX M3 liquidity) stay verified-pending-ingest (Rule
5). They are an ENGINE-layer change (definitions.ts →
registry:generate → placement → display → copy → the adapter fetch
wiring → CHANGELOG) that deserves its own focused session, and the
verification needs production egress the dev sandbox can't reach (FRED
serves a JS challenge to the sandbox IP — the production Worker reaches
FRED fine, the bund/gilt/italy mirrors prove the adapter works in
egress; the ECB M3 SDMX key needs the BSI dimension walk the production
adapter does for the Eurosystem-assets series). The candidates are
recorded in DECISIONS.md (BD-S12a) with the series ids + the
verification status + the cross-check publishers. **A dedicated fill
session (S14's sibling or a one-off) verifies from production egress +
the ECB M3 dimension walk + ingests with the full §A discipline; the §21
diff grows to cover the new cards.** Their absence does not make the 8
placed Europe cards "in build" (the chip retired on the gates pass,
BD-S13c — the USA trajectory).

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + BD-S8a/b/c + BD-S9a/b/c + BD-S10a/b/c + BD-S11a/b/c +
   BD-S12a (the §15 FRED-only fills verified-pending-ingest — Rule 5)
   + BD-S12b (the Europe page build) + **BD-S13a/b/c/d (the Europe
   gates)** (all recorded, none blocking).
4. Triage the queued unreviewed fa strings (still ~771: the ~737 queued
   + the 34 S12 `pd.europe.*` keys; S13 added NO new fa strings — only
   removed the chip + added a render-audit test; the S12 corpus-pinned
   values are verified byte-for-byte by `europe-copy-pin.test.ts`, the
   fresh section/intro/loading/cross-links copy pending review).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. A small pre-existing display quirk (out of S9–S13's scope, noted for
   S19's polish pass): the Header's language quick-toggle button shows
   the theme words as its visible label (its aria-label is correct) —
   `apps/web/src/components/Header.tsx` ~line 316.

## Known state worth knowing

- The Europe page reads ONE feed: the S2 projection (GET
  /api/insights/pages/europe — the 8 home readings) + the markets board
  the zoom reads (its own feed). A slow or dead projection never takes
  the zoom away (each feed governs its own surface).
- The Europe render audit (`EuropePage.test.tsx`, 7 tests — the S11
  UsaPage.test.tsx pattern scoped to Europe) pins the shell + the zoom
  on top + the EU/UK sections + the 8 cards in placement order with the
  §21 trio + the cross-links (44px → /currencies) + the fail-closed
  paths + the fa/RTL rendering. The In-build chip is asserted ABSENT.
- The §21 backtest for Europe (`europe-backtest-core.ts` reusing S11's
  pure `auditUsaFreshness` over `EUROPE_CARD_IDS` + the offline suite +
  the live `pd-s12-backtest.ts`) is the S12 gate; S13 re-ran it live as
  its own gate (8/8 green twice, pre- and post-deploy). The freshness
  audit's honest-stale path: btp-bund-spread (monthly, maxAge 75d) is
  currently 100d beyond grace AND status 'stale' — the page speaks the
  engine's own word. When the 2026-09 OECD mirror lands (~mid-month),
  the card returns within grace.
- The Europe budget row (`scripts/check-bundle-budget.mjs`): the
  EuropePage lazy chunk measured 10.07/3.06 vs a 14/5 ceiling (headroom
  for the §15 fill cards when a later session verifies + ingests them).
- The rollback lever for the 2026-11-09e deploy: `wrangler rollback` —
  /europe returns to the S12 page (the 8 placed cards + the In-build
  chip present); every other surface was byte-identical before it (the
  S13 change is the chip removal + the test/budget additions only).
