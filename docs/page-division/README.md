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
  G CLOSED) 2026-11-10.** Next: Session 17/30 (S17 — the Commodities
  build & gates). See the roadmap's progress board for the current
  position.

## The one rule that trumps everything

`AGENT-RULES.md` (docs/; the rules are consolidated into AGENTS.md §14). Short sessions. Continuous commits.
Hand-offs with progress counters. Green gates or no progress. Financial-data
discipline — never assume; this is people's money.
