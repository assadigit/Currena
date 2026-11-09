# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## Current state (2026-11-09, after page-division S14)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase F (Asia & Pacific) OPEN:
  S14 delivered the Asia build + fills — the 11 placed cards (china 7
  · japan 2 · pacific-nz 2; the korea-taiwan-hk + india groups are
  INDEX-ONLY today — their markets ride the zoom, the §15 CPI fills
  are verified-pending-ingest), the S8 zoom on top (N225 · KOSPI · HSI
  · SSEC · TAIEX · NIFTY50), the cross-links (usdcny · usdjpy →
  /currencies + sge-gold → /gold), the honest In-build chip (the §15
  FRED-only CPI fills for JP/KR/IN are VERIFIED STALE — the FRED OECD
  mirror family is discontinued, Rule 5 — BD-S14a; the chip retires at
  the S15 gates pass, the Europe S12→S13 trajectory).** Progress: S1
  scaffold & navigation · S2 data layer + `PLACEMENT.generated.md` ·
  S3 the Global landing page (D-21) · S4 the gates & polish (Phase A
  CLOSED) · S5 the Gold page build · S6 the Gold gates + the owner's
  alternation (Phase B CLOSED) · S7 the World Markets page (D-43 map
  hero + region grids + the 9 risk cards) · S8 the Regional zoom maps
  (Phase C CLOSED) · S9 the USA verdicts + tiers 1–2 · S10 the USA
  tiers 3–6 + the TIC board (all 72 cards + the tier-6 "Who finances
  America" board) · S11 the USA gates (Phase D CLOSED) · S12 the
  Europe page build · S13 the Europe gates (Phase E CLOSED) · **S14
  the Asia build + fills: the five sub-regions (D-35: China · Japan ·
  Korea/Taiwan/HK · India · Pacific-NZ), the 11 placed cards with the
  §21 trio, the S8 zoom on top, the cross-links, the §21 backtest
  (asia-backtest-core.ts reusing S11's auditUsaFreshness over
  ASIA_CARD_IDS + the offline suite + the live pd-s14-backtest.ts
  script), the copy pins (asia-copy-pin.test.ts), the Asia budget row
  (12.47/3.47 vs 16/6); the §15 FRED-only CPI fills for JP/KR/IN are
  VERIFIED STALE (the FRED OECD mirror family is discontinued — Rule 5,
  BD-S14a; none ingested unverified, the candidates + the alternative
  sources recorded for a dedicated fill session) — Phase F OPEN.**
- **DEPLOYED & LIVE** (`68281479`, 2026-11-09 ~04:55 UTC): /asia-pacific
  is live at **https://currena.ir/asia-pacific** with the 11 cards
  (china-pmi · china-cpi · oecd-cli-cn · gpr-china · gpr-taiwan ·
  china-property-investment · china-steel-output · jgb-10y · boj-rate ·
  nz-short-rate · nz-10y), the five sub-region sections (China 7 ·
  Japan 2 · Korea/Taiwan/HK index-only · India index-only · Pacific-NZ
  2), the S8 zoom (6 Asian indices), the 3 cross-links (usdcny · usdjpy
  → /currencies · sge-gold → /gold), the **In-build chip PRESENT** (the
  §15 CPI fills are verified-pending-ingest — BD-S14a; retires at S15)
  — the §21 diff re-run against production post-deploy **11/11 green**
  (the 11 cards' trio inputs byte-identical page ≡ engine; the
  freshness audit honest — all 11 within cadence grace); the browser
  pass at 1440×900 and 360×844 in en + fa with ZERO overlaps/overflow/
  errors (the In-build chip present on all 4 legs, the 3 cross-links
  all at 44px, the 2 index-only sections honestly noting their fills
  are pending); the Global + Gold + World Markets + USA + Europe +
  Australia + legacy /insights surfaces intact.
- **Gates (last full run):** ALL GREEN — secret scan 8/986 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean (818 queued, +47 pd.asiaPacific.* fa
  strings) · narrator in sync + eval 50 · layer1 11,819/11,819 ·
  **suite 14,985 = +33** (asia-tiles 13 · asia-backtest 11 ·
  asia-copy-pin 2 · AsiaPage render audit 7) · build + budgets held
  (entry 270.48/81.90; the Asia lazy chunk 12.47/3.47 vs its new 16/6
  row).

## Next session (S15 — Asia gates · Session 15/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S15 entry + the S14
delivery record), `02-PAGE-DIVISION-SPEC.md` §9 + §15 + §21, and this
file. Scope (S15 — Asia gates): the S13 Europe-gates pattern applied
to Asia over the S14-complete /asia-pacific page (the 11 placed cards,
no new layers — the gates + polish session). **(a)** The full card-
render audit vs the placement table (BD-S15a — the S11 UsaPage.test.tsx
/ S13 EuropePage.test.tsx pattern mirrored for Asia): the S14
`AsiaPage.test.tsx` render audit (7 tests) is ALREADY in place — S15
re-audits it as the session's own gate. **(b)** The freshness-within-
cadence-grace audit as the session's own gate (the pure
`auditUsaFreshness` over `ASIA_CARD_IDS` — already wired in S14's
`asia-backtest-core.ts` + the offline suite; S15 runs it live as the
gate). **(c)** The mobile/ARIA pass (BD-S15b — spec §18 D-48): the
cross-link cards already carry `min-h-[44px]` (S14 applied the S11/S13
lessons), the section headings carry the `<section aria-label>` +
`<h2>` semantics, the RTL flow rides the logical CSS + the `<bdi dir>`
joins — the pass is the verification + the pin (the S14 build already
carried the lessons). **(d)** The In-build chip retired + the Asia
budget row tightened (BD-S15c — BD-S14b's completion): the 11 placed
ids' gates pass (§21 card audit 11/11 green, the freshness audit
honest, the mobile/ARIA pass landed) → the chip retires (the USA S11 /
Europe S13 trajectory — the §15 CPI fills' absence does NOT make the
11 placed cards "in build"). **(e)** The §15 FRED-only CPI fills
carried forward (BD-S15d — Rule 5): the JP/KR/IN CPI fills stay
verified-pending-ingest (the FRED OECD mirror family is discontinued —
BD-S14a; a viable monthly source needs to be picked: the national
statistics bureaus directly, a fresh FRED/IMF IFS series, or the World
Bank annual as a lower-resolution fallback). Gates: the §21 diff over
the 11 placed cards green; typecheck + lint + copy:audit + build/
budgets; browser verification at 1440×900 and 360×844 in en + fa;
commit pushed at every checkpoint. The deploy at the close is the
owner's standing.

### The §15 FRED-only CPI fills for Asia — carried forward (BD-S14a)

The three D-36 Asia fills (Japan · Korea · India CPI YoY) stay
verified-pending-ingest (Rule 5). The FRED OECD mirror family
candidates were VERIFIED STALE/discontinued live in S14 (unlike S12's
Europe attempt which hit the FRED JS challenge — S14 reached FRED
fine): JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06;
KORCPIALLMINMEI + CPALTT01KRM659N end 2023-11; INDCPIALLMINMEI +
CPALTT01INM659N end 2025-03. The World Bank FP.CPI.TOTL.ZG (annual,
fresh through 2025) is a viable alternative but a DIFFERENT cadence +
provider than the spec §15 names. The national statistics bureaus
(Statistics Bureau of Japan, KOSTAT, MoSPI) publish fresh monthly CPI
but are NOT already-integrated providers. The candidates + the
alternative sources are recorded in DECISIONS.md (BD-S14a). **A
dedicated fill session (S15's sibling or a one-off) picks a viable
monthly source, verifies from production egress, then ingests with the
full §A discipline; the §21 diff grows to cover the new cards.** Their
absence does not make the 11 placed Asia cards "in build" (the chip
retires on the gates pass, BD-S15c — the USA trajectory).

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + BD-S8a/b/c + BD-S9a/b/c + BD-S10a/b/c + BD-S11a/b/c +
   BD-S12a (the §15 Europe fills verified-pending-ingest — Rule 5)
   + BD-S12b (the Europe page build) + BD-S13a/b/c/d (the Europe
   gates) + **BD-S14a (the §15 Asia CPI fills — VERIFIED STALE,
   discarded) + BD-S14b (the Asia page build)** (all recorded, none
   blocking).
4. Triage the queued unreviewed fa strings (now ~818: the ~771
   previous + the 47 S14 `pd.asiaPacific.*` keys; the S14 corpus-pinned
   values — the 11 card names + the unit/position/band/status words —
   are verified byte-for-byte by `asia-copy-pin.test.ts`, the fresh
   section/intro/loading/cross-links/index-only-note copy pending
   review).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. A small pre-existing display quirk (out of S9–S14's scope, noted for
   S19's polish pass): the Header's language quick-toggle button shows
   the theme words as its visible label (its aria-label is correct) —
   `apps/web/src/components/Header.tsx` ~line 316.

## Known state worth knowing

- The Asia page reads ONE feed: the S2 projection (GET
  /api/insights/pages/asia-pacific — the 11 home readings) + the
  markets board the zoom reads (its own feed). A slow or dead
  projection never takes the zoom away (each feed governs its own
  surface).
- The Asia render audit (`AsiaPage.test.tsx`, 7 tests — the S11
  UsaPage.test.tsx / S13 EuropePage.test.tsx pattern scoped to Asia)
  pins the shell + the zoom on top + the five sub-region sections (the
  3 card sections + the 2 index-only honest notes) + the 11 cards in
  placement order with the §21 trio + the cross-links (44px →
  /currencies + /gold) + the fail-closed paths + the fa/RTL rendering.
  The In-build chip is asserted PRESENT (the build session — retires
  at S15).
- The §21 backtest for Asia (`asia-backtest-core.ts` reusing S11's
  pure `auditUsaFreshness` over `ASIA_CARD_IDS` + the offline suite +
  the live `pd-s14-backtest.ts`) is the S14 gate; S15 re-runs it live
  as its own gate (11/11 green twice, pre- and post-deploy). The
  freshness audit: all 11 cards within cadence grace at the S14
  deploy (no honest-stale path to exercise — unlike Europe's
  btp-bund-spread).
- china-steel-output's tonnes+scale (1e-2 → 73.6 m tonnes) is the ONE
  Asia id beyond Europe's three-unit lean render — the
  AsiaCardDisplayConfig carries an optional `scale` field; pinned
  output-for-output against formatReadingValue over all four unit
  families (percent · points · index · tonnes) × both locales.
- The two index-only sections (Korea/Taiwan/HK, India) render an
  HONEST note (never an empty card grid): their markets ride the zoom
  map above, and the §15 CPI fills are verified-pending-ingest (Rule 5
  — BD-S14a). The spec §20 "pages labelled 'growing' honestly"
  mitigation.
- The Asia budget row (`scripts/check-bundle-budget.mjs`): the AsiaPage
  lazy chunk measured 12.47/3.47 vs a 16/6 ceiling (headroom for the
  §15 CPI fill cards when a later session verifies + ingests them).
- The rollback lever for the 2026-11-09f deploy: `wrangler rollback` —
  /asia-pacific returns to the S8 RegionPage placeholder (the zoom +
  the DestinationBody); every other surface was byte-identical before
  it (the S14 change is the AsiaPage + the route wiring + the i18n +
  the tests + the script + the budget row only).
