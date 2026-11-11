# Currena — Page-Division Strategy Log

> **The living document for Phases 1–3.** Every decision, every open question,
> every session — recorded here so nothing discussed is ever lost.
> Companion documents: `02-PAGE-DIVISION-SPEC.md` (the investor spec),
> `04-INDICATORS-COMPLETE-INVENTORY.md` and `05-GOLD-INDICATORS.md` (Phase 0),
> `../AGENT-RULES.md` + `01-SESSION-ROADMAP.md` (execution governance).
> Owner: Assad · Assistant: Z.ai · Started 2026-11-07.

---

## Table of contents

1. [The objective — in the owner's words](#1-the-objective--in-the-owners-words)
2. [Where we stand — the phase plan](#2-where-we-stand--the-phase-plan)
3. [Phase 0 recap — what the audit found](#3-phase-0-recap--what-the-audit-found)
4. [The regional reality check](#4-the-regional-reality-check)
5. [The decision record — D-1 … D-48 (FINAL) + the pending investor round](#5-the-decision-record--d-1--d-48-final--the-pending-investor-round)
6. [The final page map — settled 2026-11-07](#6-the-final-page-map--settled-2026-11-07)
7. [Wrap-up notes & reconciliations](#7-wrap-up-notes--reconciliations)
8. [Session log](#8-session-log)
9. [Hand-off — the build kickoff prompt (Session 1/30)](#9-hand-off--the-build-kickoff-prompt-session-130)

---

## 1. The objective — in the owner's words

- Split Currena's single all-in-one Insights page into **different pages based
  on categories which are important and which people actually read**.
- **The Global page shows the most important meters only — as compact and
  intuitive as possible — for people who want to scan the world's economy
  fast and efficiently.**
- Gold is the product's main focus; Australia matters personally (the owner
  lives there).
- Method: **ask questions before recommending** — the taxonomy is co-designed
  after auditing the data, never imposed. (This document is the record of that
  conversation — 3 question rounds, 48 recorded decisions, now closed.)

## 2. Where we stand — the phase plan

| Phase | Scope | Status |
|---|---|---|
| **Phase 0** | Collect & audit ALL indicators, methods, data sources | ✅ **Complete** — `04-INDICATORS-COMPLETE-INVENTORY.md` + `05-GOLD-INDICATORS.md` |
| **Phase 1** | Strategy discussion — question rounds, co-designed taxonomy | ✅ **Complete** — Rounds 1–3 answered; **D-1 … D-48 recorded; taxonomy settled** (this doc, §5–§6) |
| **Phase 2** | Spec for the external financial investor | ✅ **Drafted & pushed** — `02-PAGE-DIVISION-SPEC.md` v1.0 (awaiting the investor's review) |
| **Phase 3** | Final spec — incorporate the investor's feedback | ⏳ **pending the investor** — the S22 collection slot closed as a WAITING slot 2026-11-12 (the review not yet arranged; BD-S22); the answers land as D-49+ (§5 Round 4) the moment they arrive |
| **Phase 4** | Build the pages & split the information | ⏳ **30-session plan ready** — `01-SESSION-ROADMAP.md`; kicks off with Session 1/30 |

**Working method (D-8):** multiple short sessions, each ending with a
hand-off prompt and an explicit progress counter (Agent Rule 3).

## 3. Phase 0 recap — what the audit found

| What | Count | Notes |
|---|---|---|
| Registry indicators | **184** | `data/indicators.json` v4 — Global section 146 · Australia section 38 |
| Voting gauge members | 54 | contribute to a question-gauge verdict |
| Context cards | 130 | live value + 10-year position bar, never vote |
| Thematic voting gauges | 5 global | borrowing-costs · prices-heat · market-stress · dollar-strength · growth-health |
| Shadow gauges | 2 global + 2 AU | geo-fragmentation · dedollarization · au-activity · au-external |
| Gold meter | 37 voters · 5 lanes | borrowing-costs 7 · dollar 7 · stress 11 · inflation 10 · flows 2 |
| Boards beyond the registry | 6 | FX (10 pairs + 7 rules) · World Markets (16 indexes) · AU Markets (19) · Prices live (4) · TIC (21 holders) · Companies (49, flag OFF) |
| Data providers | 32 | FRED 57 ids · derived 28 · ABS 19 · GPR 11 · World Bank 7 · … |
| Licence levels | — | L0 95 · L1 37 · L2 50 · L3 2 (WGC blocked) |

## 4. The regional reality check

The key audit fact: **the "Global" section (146 ids) is mostly US data.**
Splitting by region = "splitting the American bulk out of a page called
Global" + building up thin regions.

| Region | What exists today | Depth |
|---|---|---|
| USA | ~75 pure-US ids + 9 dollar ids + SPX/NDX/DOW | **Very deep** |
| Gold | 37-voter meter + ~17 context cards + price strip | **Very deep** (own engine) |
| Australia | 38 ids (3 voting + 2 shadow gauges) + AU Markets board (19) | **Deep** |
| China | ~9–10 ids + SSEC/HSI | Medium-thin |
| Japan | ~4–5 ids + N225 | Thin |
| EU | ~5–6 ids + STOXX50E/DAX/CAC + 3 EUR pairs | **Thin** |
| UK | 3 ids + FTSE | Very thin |
| Other Asia | KOSPI · TAIEX · NIFTY50 | Index-only |
| Other OECD/world | TSX · IBOV · TIC holders · OECD CLI | Board-only |
| Commodities & energy | 24+ ids incl. chokepoints (shadow) | Medium |
| FX | 10 pairs + 7 rules | Own board |

## 5. The decision record — D-1 … D-48 (FINAL) + the pending investor round

### Round 1 (2026-11-07)

| # | Decision |
|---|---|
| **D-1** | Pages split by category/region, driven by *what is important and what people actually read*. |
| **D-2** | Commodities (precious minerals) + energy → one same page; not the main focus for now. |
| **D-3** | Region grouping: USA + Europe + one page for OECD/China/Asia together (India, Japan, S. Korea, HK, …). |
| **D-4** | Shared/global-event indicators → the Global page. |
| **D-5** | The gold balance (37-voter meter) → the Gold page. |
| **D-6** | A dedicated Australia page (the owner lives there). |
| **D-7** | Global page = most important meters only, compact & intuitive, fast world-scan. |
| **D-8** | Work in multiple sessions; each ends with a hand-off prompt. |
| **D-9** | The old all-in-one page is kept for now; retired only when every indicator is properly categorized. |

### Round 2 (2026-11-07)

| # | Decision |
|---|---|
| **D-10** | **The Global-Impact Rule:** very important + global impact → briefly mentioned (or verdicted) on Global; details on the category page. (Gold is global; iron/copper are not; oil is global.) |
| **D-11** | Global page shape = a **one-screen verdict board** (~9–12 tiles, zero scrolling). |
| **D-12** | Architecture = **Hybrid**: Global keeps the 5 thematic gauges; regional pages reorganize existing members; new regional ids only where embarrassingly thin. |
| **D-13** | World indexes get a **triple home**: compact card on Global + a dedicated World Markets page (current map projected there) + per-region index/map sections on regional pages. |
| **D-14** | USA = **one deep page, importance-tiered** (world-impact first; mostly-American detail at the bottom). |
| **D-15** | Europe: reorganize what exists, ship, complete later — fill only if embarrassingly thin. |
| **D-16** | The region page is named **"Asia & Pacific"**; later add more region pages — roster: EU + USA + Asia & Pacific + OECD. |
| **D-17** | **UK → Europe page; New Zealand → Asia & Pacific.** |
| **D-18** | Currency Pairs keeps **exactly the 10 existing pairs**; gold information (incl. gold crosses) stays on the Gold page; layout delegated to the assistant. |
| **D-19** | **Gold is dedicated.** Commodities page holds commodities only (iron, copper, silver, …) — and commodities live only on their page. |
| **D-20** | Build order: Global → Gold → USA → Europe → Asia & Pacific → Australia → Commodities → Currency Pairs; **Global becomes the landing page**; old page → legacy route until retirement. |

### Round 3 — FINAL (2026-11-07)

| # | Decision | Source |
|---|---|---|
| **D-21** | Global board = **10 tiles**: Gold Balance verdict · Borrowing Costs · Inflation Heat · Market Stress · Dollar Strength · Growth Health (the 5 gauge verdicts) · FX Lights · World Markets status · prices ribbon · dedollarization context tile. | F1-A |
| **D-22** | Prices ribbon = **gold + brent + BTC** (silver's story lives on Gold/Commodities). | F2-B |
| **D-23** | **Region-chips row** on Global with status dots, each chip clickable to its page. | F3-A |
| **D-24** | The **narrator** one-liner sits under the Global board ("what changed today"). | F4-A |
| **D-25** | **Dedollarization = context tile on Global** (display-only, no verdict). | F5-A |
| **D-26** | Gold page: **hero (meter + price) → the 37 seats grouped by 5 lanes → context cards → honest-record footnote**. | F6-A |
| **D-27** | **Gold ratios stay on Gold** (gold-silver, gold-oil, gold-platinum, gold-btc, gold-aud, real-gold-price, copper-gold, gold-equities); raw commodity *prices* → Commodities. | F7-A |
| **D-28** | Bitcoin's home = **"Digital assets" row on Commodities** (BTC price + crypto-fng); also Global ribbon + gold-btc on Gold. | F8-A |
| **D-29** | USA tier-1 = **7 cards**: fed-target · fed-expectations · us-cpi-yoy · us-pce-core-yoy · us-nfp · us-unemployment · us10y. *(dollar-basket was in the suggested 8 but moves to Currency Pairs by D-32; the dollar-strength verdict still tops the page via D-30.)* | F9-A ⚠ reconciled |
| **D-30** | The **5 thematic gauge verdicts sit atop the USA page** (US-framed copy), tiers below. | F10-A |
| **D-31** | **TIC board → USA page**, bottom section — "who finances America". | F11-A |
| **D-32** | **The Currency Consolidation Rule: everything related to currencies / against the dollar → the Currency Pairs page** — the 9 dollar-strength members, usdcny, usd-reserve-share, and the AUD crosses (audusd, audjpy, audnzd). | F12-C |
| **D-33** | Page name = **"Europe"**; **EU members and non-EU members listed apart** (UK in the non-EU section). | F13 |
| **D-34** | Europe thin-fill = **FRED-only adds now** (~3–4 L0 series: unemployment, industrial production, liquidity); PMIs later. | F14-B |
| **D-35** | Asia & Pacific sections **by sub-region: China · Japan · Korea/Taiwan/HK · India · Pacific (NZ)**. | F15-A |
| **D-36** | Asia thin-fill = **FRED-only CPI YoY mirrors for Japan, Korea, India**. | F16-B |
| **D-37** | Australia **keeps its 5-gauge structure** + AU Markets board on top; only the NZ ids leave. | F17-A |
| **D-38** | Commodities grouping = **Energy · Metals · Agriculture · Digital**. | F18-A |
| **D-39** | Chokepoints / SPR / GSCPI / geo-frag cards → Commodities **"Trade routes & supply"** section. | F19-A |
| **D-40** | crypto-fng → the Commodities **digital row** (never a signal). | F20-A |
| **D-41** | Currency Pairs hero = **the 7 rule lights (R1–R7)**; the pair board below. | F21-A |
| **D-42** | **AUDNZD becomes the 11th pair** on Currency Pairs. | F22-A |
| **D-43** | World Markets map = **REUSE the existing insights world-index map** for the world page; **zoomed continent maps** on regional pages (Europe-only view, etc.). | F23-A |
| **D-44** | **All four region pages get their index/map section** (USA, Europe, Asia & Pacific, Australia); TSX/IBOV stay on World Markets until the OECD page exists. | F24-A |
| **D-45** | Navigation = **grouped topbar**: Global · Gold · World Markets · Currencies · Commodities · Regions ▾ (USA · Europe · Asia & Pacific · Australia); mobile drawer. | F25-A |
| **D-46** | Routes = **clean top-level slugs** (`/`, `/gold`, `/world-markets`, `/usa`, `/europe`, `/asia-pacific`, `/australia`, `/commodities`, `/currencies`); **legacy stays at `/insights`** with a deprecation banner. | F26-A |
| **D-47** | **World Markets builds immediately after Gold** — the board already runs daily; reorganize, don't rebuild. | F27-B |
| **D-48** | Verdict visual language = **the existing engine language**: 5-step gauge verdicts + gold's 7-state outlook; colour + label; honest "can't read / not enough readable" states — never bare traffic-lights. | F28-A |

### Round 4 — the investor round (Phase K · PENDING)

Spec §19's seven questions went to the external investor with the spec
v1.0. **The S22 collection slot (2026-11-12) closed as a WAITING slot:
the review was not yet arranged and no answers arrived — so NOTHING is
recorded here yet** (BD-S22; verified against the repo, the GitHub
issues/PRs, and the session kickoff itself). The investor's answers land
below as **D-49+** the moment they are collected; the AF-1…AF-7
spec-side drift findings ride the same spec v2 pass (never silent
edits). Meanwhile the reserve work keeps the program moving — the §15
Asia CPI fill session pulled forward into the Session 23 slot (the
roadmap's reserve rule).

## 6. The final page map — settled 2026-11-07

**10 destinations.** Every one of the 184 registry ids, the 6 boards, and the
gold meter has exactly one home; verdicts/chips mirror elsewhere as links
(the engine computes once, pages display).

| # | Page | Route | Registry cards | Boards & extras |
|---|---|---|---|---|
| 1 | **Global — the world scan** | `/` | 0 detail cards — verdict board only | 10 tiles (D-21) · prices ribbon gold+brent+BTC (D-22) · region chips (D-23) · narrator (D-24) |
| 2 | **Gold** | `/gold` | 13 cards + 4 blocked-notes | the 37-voter meter in 5 lanes · gold price hero · gold-equities context card |
| 3 | **World Markets** | `/world-markets` | 9 world-risk cards (GPR family + global-liquidity) | 16-index board + the world map (reused) + region grids |
| 4 | **USA** | `/usa` | ~72 cards in 6 tiers (D-14/D-29/D-30) | TIC board (21 holders, D-31) · SPX/NDX/DOW index section (D-44) |
| 5 | **Europe** | `/europe` | 8 cards, **EU and non-EU apart** (D-33) | +3–4 FRED-only fills (D-34) · Europe zoom map (STOXX50E/DAX/CAC/FTSE) |
| 6 | **Asia & Pacific** | `/asia-pacific` | 11 cards in 5 sub-regions (D-35) | +3 FRED CPI fills (D-36) · Asia zoom map (N225/KOSPI/HSI/SSEC/TAIEX/NIFTY50/NZX50) |
| 7 | **Australia** | `/australia` | 28 cards in the 5-gauge structure (D-37) | AU Markets board (19 symbols) on top |
| 8 | **Commodities & Energy** | `/commodities` | 24 cards: Energy 9 · Metals 4 · Agriculture 3 · Digital 2 · Trade-routes 6 (D-38/D-39) | live prices; gold cross-links |
| 9 | **Currency Pairs** | `/currencies` | 14 registry ids: 11 pairs + 7 dollar-standing cards (D-32/D-42) | the 7 rule lights hero (D-41) |
| 10 | **Legacy all-in-one** | `/insights` | today's page, unchanged | deprecation banner (D-46) → retired at D-9 conditions |

**Count check:** ~72 + 13 + 9 + 8 + 11 + 28 + 24 + 14 = 184 registry ids
placed (+ 4 blocked ids noted on Gold). The authoritative per-id table lives
in the spec (§14); the build's Session 2 generates and reconciles it
programmatically against `data/indicators.json` — drift is an audit finding.

**Build order (D-20 + D-47):** Global → Gold → World Markets → USA → Europe
→ Asia & Pacific → Australia → Commodities → Currency Pairs → integration →
investor feedback → legacy retirement.

## 7. Wrap-up notes & reconciliations

1. **F9 ↔ F12 reconciliation (D-29):** the suggested USA tier-1 included
   `dollar-basket`, but the later Currency Consolidation Rule (D-32) moves all
   dollar/currency detail cards to Currency Pairs. Final tier-1 = 7 cards;
   the dollar-strength *verdict* still tops the USA page via D-30 and its
   *detail* card lives on Currency Pairs. Verdicts mirror; detail cards don't.
2. **F13 clarification (D-33):** the Europe page lists **Union members apart
   from non-Union members** — EU section (ECB, HICP, AAA, Bund, BTP−Bund) ·
   non-EU section (UK: gilt, BoE rate, FTSE). Future Switzerland/Norway etc.
   join the non-EU section until an OECD page exists.
3. **F23 clarification (D-43):** the world-index map **already exists in
   today's insights** — it is reused as-is on the World Markets page; regional
   pages get **zoomed continent views** (Europe-only, Asia-only, …).
4. **Dual-membership ids** (e.g. michigan-sentiment in stress+growth,
   sp500-breadth in stress+dedollar, gold voters that are also gauge voters):
   one detail-card home each (per the placement table); voting is engine-side
   and unaffected by placement. Seat chips link to the seat's home page.
5. **GPR family placement** (assistant call, flagged for the investor):
   world GPR indexes (base, threats, acts, daily, Russia, Ukraine, Israel,
   Saudi) → World Markets "World risk" section; gpr-china/gpr-taiwan → Asia &
   Pacific; gpr-australia → Australia. Rationale: no Middle-East/Europe
   conflict page exists; World Markets is the natural "world state" home.
6. **Phase 1 is CLOSED.** No further question rounds unless the investor's
   review (Phase 3) surfaces a genuine contradiction — then a new D-entry
   records the change, never a silent edit.

## 8. Session log

| Session | Date | What happened |
|---|---|---|
| 1 | 2026-11-07 | **Phase 0 audit.** Cloned the repo (`assadigit/Currena` @ `41e7ccf`), read `packages/insights/` end-to-end, produced the inventory (184 ids) and gold (37-voter) docs. Built the doc-viewer workspace app. Asked Round-1. |
| 2 | 2026-11-07 | **Round 1 answered → D-1…D-9.** Global-page vision recorded. Created this log; issued Round-2. |
| 3 | 2026-11-07 | **Round 2 answered → D-10…D-20.** Global-Impact Rule becomes the guiding principle. Taxonomy → 9 pages + legacy; World Markets page added; EU→Europe (incl. UK); Asia→Asia & Pacific (incl. NZ); USA tiered; Hybrid architecture locked. Issued Round 3 (F1–F28). |
| 4 | 2026-11-07 | **Round 3 answered → D-21…D-48. PHASE 1 CLOSED.** Wrap-up: final page map (10 destinations, all 184 ids placed). **Phase 2 spec drafted** (`02-PAGE-DIVISION-SPEC.md`) + **AGENT-RULES.md** (the owner's 5 working rules) + **01-SESSION-ROADMAP.md** (30-session build plan) — all pushed to GitHub at `assadigit/Currena`. Issued the build kickoff prompt (Session 1/30). |
| 5 | 2026-11-07 | **BUILD S1 — Scaffold & navigation (Session 1/30) delivered & gated.** All 10 routes live: `/` Global placeholder (migration hub) · the 8 destination placeholders (purpose/membership/build-sessions/decision traceability) · legacy `/insights` with the D-46 deprecation banner (zero content loss, verified with live data). Grouped topbar (D-45) + Regions ▾ / Tools ▾ dropdowns + grouped mobile drawer; RTL/fa verified; 55 fa strings queued unreviewed in the Persian copy manifest. **Build-session decision recorded for owner ratification:** Converter → `/converter` unchanged (D-20 makes Global the landing; D-46 gives `/` to Global). Gates ALL GREEN: tsc 6/6 · eslint 0/0 · copy:audit clean (6,920) · secret scan (8/893) · suite 14,621 · build+budgets held · all routes browser-verified at 360px & 1024px. Hand-off prompt issued for S2 (data layer + PLACEMENT.generated.md). |
| 6 | 2026-11-08 | **BUILD S2 — Data layer & the authoritative placement table (Session 2/30) delivered & gated.** The contract between engine and pages: `packages/insights/src/page-division/` (the placement table with typed homes + ENGINE-DERIVED mirrors from GAUGES/GOLD_LANE_VOTERS + reconcilePlacement + projectSnapshotToPage + the deterministic doc builder) · the wire contracts in `packages/core` · `GET /api/insights/pages` + `/pages/:page` (inside the insights gate + M-4 bucket, mode-aware reader, live-prices merge inherited; honest absentIds) · the SPA client (`lib/page-division.ts`) · **`PLACEMENT.generated.md` committed GREEN: 184 ids + 6 boards · 0 unplaced · 0 duplicate homes · 0 unknown · 0 mirror overlaps**, pinned byte-for-byte by the sync test. **Audit findings AF-1…AF-5 recorded** (spec hand-count drift; **AF-3 owner ratification pending: michigan-1y-expectations → USA tier-3**). Gates ALL GREEN (2m 10s: secret scan 8/906 · tsc 6/6 · eslint 0/0 · copy:audit · narrator · layer1 11,819 · **suite 14,678 (+57)** · build+budgets held). Not deployed (the Worker deploy stays the owner's lever). Hand-off prompt issued for S3 (the Global page build). |
| 7 | 2026-11-08 | **BUILD S3 — the Global page (Session 3/30) delivered & gated. The landing page (D-20) is REAL.** The D-21 10-tile verdict board on the S2 contract: `global-tiles.ts` (the pure board arithmetic over the SAME engines — gauges/gold-balance/outlook-core/verdict-core/fx §9.3) + `GlobalBoard.tsx`/`GlobalPage.tsx` (tiles, D-22 ribbon rows, D-23 chips, D-24 narrator line, D-25 dedollar context, honest load/error/unread states, last-good projection cache) + the `outlook-core`/`verdict-core` display-layer extractions (verbatim, re-exported). Verdict words pinned byte-for-byte to the insights corpus in BOTH locales (`global-copy-pin.test.ts`); 62 fa strings queued unreviewed. **Build decisions BD-S3a/b/c recorded** (chip dots mirror real verdicts only; gauge-tile links per D-30/D-32; 2-col mobile board — D-11's zero-scroll outranks the spec's 1-col sketch). **Honest deviation:** D-22's day change reads the labelled 7-day change (no day field in the reading contract — S4's call). **Live defect fixed:** the projection client's cache poisoned StrictMode's second mount (signal-carrying calls now bypass the cache). Gates ALL GREEN (2m13s: secret scan 8/914 · tsc 6/6 · eslint 0/0 · copy:audit · narrator · layer1 11,819 · **suite 14,715 (+37)** · build+budgets held incl. the new GlobalPage chunk 31.89/9.41 vs 36/11); browser-verified live at 1440×900 + 360×844 in en + fa (RTL) with the A11y tree naming every tile and chip-dot state; VLM visual pass (caught + fixed the first build's clipped Bitcoin ribbon). Not deployed. Hand-off prompt issued for S4 (Global gates & polish). |
| 8 | 2026-11-08 | **BUILD S4 — Global gates & polish (Session 4/30) delivered & gated. PHASE A CLOSED.** The §21 zero-tolerance verdict-consistency backtest, both halves: `global-backtest-core.ts` + the offline suite test (8, incl. three FAIL-CLOSED proofs) + the LIVE script `pd-s4-backtest.ts` — **the live run over the remote-dev Worker on real KV: 84 checks · 84 green · 0 red** (every gauge step+word+counts, the Gold Balance counts + 7-state outlook, the markets verdict + RAW counts, the fx signal + active count, the ribbon + dedollar readings byte-identical; the buffered-vs-RAW markets divergence reported as the designed S1-M1.6 #2 note) and **the narrator's stateHash recompute IDENTICAL** — the :50 artefact speaks about exactly the state the pages serve. **BD-S4a recorded** (the D-22 day-change call: `change1d` on the live-prices contract — the live quote vs the previous session's close, computed where the daily series lives; the ribbon shows it with a VISIBLE window tag and falls back to the labelled 7-day change until the deployed writer carries it; the history-endpoint option rejected). **BD-S4b recorded** (the narrator's own text renders verbatim; the line gains the "Updated {time}" stamp). The pass found + fixed six real defects (the dead `fromCache` label; the swallowed Updated stamp; the clamp's sliced third line; the line-clamp display-utility override; the wrapped mobile chips; and — found by the CLOSING verification pass after the records' first cut — the two board attachments breaking the M-17 last-good discipline: a failed markets/fx refresh collapsed good cached copies to the unread state; fixed with the keep-flagged setState + the tiles' own "Last good copy · {date}" captions, +1 characterization) + the reduced-motion guards + the chips fade affordance + the aria-hidden window tag. Browser-verified live at both widths in en + fa: one screen exact in all four, the keyboard walk, dark mode, both reduced-motion guards in the live CSSOM, the live last-good path (the boards' M-17 path re-verified live on currena.ir post-fix). 5 fa strings queued unreviewed. Gates ALL GREEN (suite 14,731). Deployed + live-verified TWICE (version `637db8f8` ~04:36 UTC, then the M-17 fix re-deployed as `b1cfa4fe` ~05:00 UTC — the §21 backtest re-run against PRODUCTION 84/84 green both times; see the roadmap record + DEPLOY.md session record). Hand-off prompt issued for S5 (the Gold page build). |
| 10 | 2026-11-08 | **BUILD S6 — the Gold gates + the owner's alternation (Session 6/30) delivered & gated. PHASE B (GOLD) CLOSED — and the previous balance shape is LIVE on /gold.** THE OWNER'S IN-SESSION REQUEST (BD-S6a: "I want the previous shape of Gold balance in gold dedicated page, it must be alternated with this new proposed minimal design, just make it smaller") built whole: the hero's balance block ALTERNATES through a real radio group (arrow-key walking, labelled en+fa, the gold focus ring verified in the live CSSOM) between the CLASSIC view — the previous brass shape (the assay-office stage + the five lane weights + the not-leaning tray), extracted VERBATIM from the legacy BalanceScale as `BalanceStage`/`BalanceTray` + the narrow `BalanceStageCopy` interface (ONE drawing, D-48: the legacy card feeds the corpus's strings, the Gold hero feeds its corpus-pinned pd.gold keys — 19 of the 22 new keys byte-pinned by gold-copy-pin.test.ts, both locales) and rendered SMALLER (the 480px root cap → always the s-size metrics) — and the MINIMAL view (the S5 beam glyph, unchanged); classic is the DEFAULT, the choice persisted per visitor; the engine's words (verdict + outlook + counts + the context line) render in BOTH views so the designs can never disagree; a lane weight scrolls to its seat card (the lane cards gained #gold-lane-{lane} ids). The legacy card's DOM BYTE-IDENTICAL through the extraction (the GB-S6 snapshot + all 51 lanes tests green untouched; the Insights chunk UNCHANGED at 1569.16/362.08). **THE FROZEN-SCENARIO SUITE (the S6 gate):** `backtestGoldPageVsHarness` in gold-backtest-core.ts — the PAGE renderer vs the FROZEN HARNESS's own arithmetic (gfLaneBalance over the production scenario composition GF_VOTERS_P4_5LANE with the recorded F2 mapping at the consumer, MIN2, the D-18 rule, the executed threshold map), with the S5 two-path shape; the frozen tables opened via the new additive package export '@currena/insights/gf-p0-proposed'; the offline suite (gold-frozen-scenarios.test.ts, 9) sweeps the recorded corpus's 19 archive windows — page ≡ harness green on EVERY window (counts, lane votes, beam, verdict, outlook), the S5 derivation families green over history (the input/context presence checks stay the LIVE tool — the archives honestly predate the P2/P3/P4 promotions), the 18-scenario family DETERMINISTIC over every window, the production-composition pin, THREE fail-closed proofs, the diverse-shapes guard. **The live §21 diff: 150/150 green TWICE** (pre- + post-deploy). **The mobile + ARIA pass** over real production data at 1440×900 + 360×844 in en + fa: no horizontal scroll, the keyboard walk (the radio arrows + the focus ring + the 44px weight buttons), the weight→lane scroll, dark mode, zero page errors; the VLM visual passes CLEAN on en — the fa/dark passes' 6 small-font Persian "garble"/mirroring reads ALL disproven against the DOM (the RTL mirroring correct by construction: the for pan right, dipping +7.53px; the "garbled" words are the corpus's own pinned wording) — no fixes made, the finds checked against reality. Gates ALL GREEN (2m20s: secret scan 8/932 · tsc 6/6 · eslint 0/0 · copy:audit clean (7,140; the 22 new fa strings queued) · narrator + eval 50 · layer1 11,819 · **suite 14,799 (+13)** · budgets held — GoldPage 31.23/8.06 vs its re-based 34/9 row, justified in check-bundle-budget.mjs). **Deployed + live-verified** (version `327c7761` ~14:55 UTC, the owner's S5 standing "re-ship only if S6 changes code" — it did; the full record in DEPLOY.md 2026-11-08e). Hand-off prompt issued for S7 (World Markets, Phase C). |
| 9 | 2026-11-08 | **BUILD S5 — the Gold page (Session 5/30) delivered & gated. THE gold card is REAL — and DEPLOYED LIVE.** The 37-voter conditions meter on the S2 contract (`fetchPageProjection('gold')`): `gold-tiles.ts` (the pure derivations through the SAME engines — goldBalance + goldOutlookOf + evaluateSignal + the BalanceScale's own balanceVerdictOf/balanceTilt IMPORTED verbatim: the hero's beam and the legacy drawing's beam are ONE math) + `GoldHero.tsx` / `GoldSeats.tsx` / `GoldContext.tsx` / `GoldPage.tsx` (the hero with the live hourly price + BD-S4a window-tagged change + 10-year position + beam + verdict + 7-state outlook + counts; the five D-26 lanes 7/7/11/10/2 with every seat chip carrying name · lean · evidence word · the home-card link per §7 wrap-up note 4 — `homePageOfIndicator`, derived from the placement table, never hand-copied, the three gold-homed voters linking to the in-page #gold-context anchor; the D-27 context cards with the §21 value/position/freshness trio; the four BLOCKED ids as honest §16 notes; the D-29 honest-record footnote with the measured sign-agreement numbers, MIN2 and the corpus's own measured-note sentence + backtest link). **THE §21 SEAT-LEVEL DIFF — the S5 gate: 150 checks · 150 green · 0 red against PRODUCTION, twice** (pre-deploy + post-deploy; `gold-backtest-core.ts` + the offline suite (7, three FAIL-CLOSED proofs) + the live script `pd-s5-backtest.ts` — every seat's impact + evidence identical to the engine's own member lines over `/api/insights`, the hero readings byte-identical, the licence quartet riding absentIds). ~110 `pd.gold.*` copy keys (en+fa) with the verdict vocabulary pinned to the corpus in BOTH locales (`gold-copy-pin.test.ts`, 24 — which caught two real drifts on its first run, fixed); 133 fa strings queued unreviewed (manifest 7,118). **BD-S5a recorded** (the cached-copy header: the fromCache sentence replaces the plain data-as-of line instead of doubling the date — found by the dark-mode VLM pass; Global's header keeps the S4 pattern until S19). **The browser verification pass** over real production data at 1440×900 + 360×844 in en + fa: the five lanes carrying the REAL engine verdicts (borrowing-costs for · dollar against · stress for · inflation split · flows neutral — the same 2-for/1-against/2-not-leaning counts as the Global tile), all 37 seats with working home links (click-verified), the M-17 last-good path LIVE, dark mode, the keyboard walk; **the VLM visual pass found + fixed two real defects** (the seat chips' mid-word truncation — the chips now wrap their words complete; the doubled cached-date header). Gates ALL GREEN (2m15s: secret scan 8/930 · tsc 6/6 · eslint 0/0 · copy:audit clean · narrator + eval 50 · layer1 11,819 · **suite 14,786 (+55)** · budgets held — entry 269.00/81.45 · GlobalPage UNTOUCHED 24.26/6.21 · **the new GoldPage chunk 26.25/6.88 vs 30/9**). **Deployed + live-verified** (version `f2e74f3c` ~12:27 UTC, the owner's standing applies — the session prompt marked the deploy optional and S6's close may re-ship after its own gates; the full record in DEPLOY.md 2026-11-08d). Hand-off prompt issued for S6 (Gold gates). |
| 11 | 2026-11-08 | **BUILD S7 — the World Markets page (Session 7/30) delivered, gated & deployed. PHASE C (WORLD MARKETS) OPEN — the D-43 map hero is LIVE on /world-markets.** The page renders the REUSED world-index map (ONE drawing, never restated: the WorldMap's copy prop loosened to the narrow structural WorldMapCopy interface — the BalanceStageCopy pattern, the legacy /insights route unchanged, its corpus satisfying the narrower type; all 49 component tests green untouched) fed the corpus-pinned pd.worldMarkets.map.* keys (the whole map block + the 16 entries' name/latin/country pinned byte-for-byte in BOTH locales by world-markets-copy-pin.test.ts), beside the STATUS SUMMARY (the board's OWN §5.3 rollup — signal + counts + worstGroup off the stored summary, never re-computed — the RAW ≥10%/≥20% counts, and the STATED rule whose thresholds are the definitions' own ATTENTION_COUNT/UNUSUAL_COUNT); the three REGION GRIDS (Asia 7 · Europe 4 · Americas 5, the membership riding MARKET_GROUP_ORDER × MARKETS — a real <table> at ≥900px + the mobile row list) with every row's five lenses + the 52-wk range position (visual track + sr sentence) + the ±1% trend band + the −10%/−20% status pills + the A7/R6 tags + the UI-27 note; and the WORLD RISK & LIQUIDITY section (the 9 placement homes with the §21 trio, the GoldContext pattern). Every value through the same pure helpers the legacy section reads (world-markets-tiles.ts: verdict-core + shared.tsx — D-48); a market with no board row renders the honest no-data row; a map callout click scrolls to the market's region row. THE §21 DIFF: world-markets-backtest-core.ts + the offline suite (7) + the live script pd-s7-backtest.ts — the live run against PRODUCTION 56/56 green TWICE (pre- + post-deploy): every row byte-identical to the stored board, the 9 risk readings byte-identical between the projection and the snapshot. The browser pass (1440×900 + 360×844, en + fa RTL, dark mode): all 16 interactive map cards (the period switch driving the colours, the M11 roving tabindex), the map-callout→row scroll, the M-17 last-good path LIVE (the board blocked → the cached copy stays labelled), zero console errors; the pass's ONE find fixed — the 1080px container squeezed the map stage and re-exposed the 4×4px stoxx50×hsi corner intersection; the container now matches Global's 1280px (BD-S7b), ZERO overlaps measured; the VLM's other reads disproven against the DOM. Gates ALL GREEN (2m20s: secret scan 8/943 · tsc 6/6 · eslint 0/0 · copy:audit clean (7,306; the 166 new fa strings queued) · narrator + eval 50 · layer1 11,819 · **suite 14,839 (+40)** · budgets held — the new WorldMarketsPage chunk 26.54/6.49 vs its 30/8 row; the REUSED map tree rides the SHARED chunk, the Insights chunk shrank 1569.16→1553.03 through the sharing). **Deployed + live-verified** (version `6e515cf8` ~17:45 UTC, the owner's standing "the deploy at the close"; the full record in DEPLOY.md 2026-11-08f). Hand-off prompt issued for S8 (the Regional zoom maps). |
| 12 | 2026-11-08 | **BUILD S8 — the Regional zoom maps (Session 8/30) delivered, gated & deployed. PHASE C (WORLD MARKETS) CLOSED — the four REGION pages' D-44 index/map sections are LIVE at /usa · /europe · /asia-pacific · /australia.** The REUSED WorldMap module gained a `region` prop — ONE drawing, never restated (D-48, BD-S8a): the viewBox crops to REGION_ZOOMS' hand-tuned windows into the SAME 1000×521 world box (Europe 148×120 · Asia 215×148 · US 155×92 · Australia 115×122), ONLY the region's indices seat pins + cards (Europe 4 · Asia 6 · US 3 · AU 1 — every world-map index seated in EXACTLY ONE zoom except tsx/ibov per D-44; asx200 rides the AU zoom, the 19-symbol AU Markets board staying S16's own table), the per-zoom card positions/widths + label-anchor overrides in world-map-config.ts, the stage carrying its window's own aspect ratio (height-capped 600px). THE CONSISTENCY CONTRACT: the rows' derivation EXTRACTED VERBATIM to world-map-rows.ts normalises the relative colour scale over ALL SIXTEEN board rows regardless of the region prop — a zoomed market's colour weight + hero number are the world map's own BY CONSTRUCTION — and the words ride the ONE shared corpus-pinned adapter (useWorldMapCopy extracted to world-map-copy.ts; the copy-pin test unchanged and green). The pages: RegionIndexSection (M-17 board state + the zoom + the stamp + the honest cannot-read empty; the card click → the market's full home today, /world-markets, BD-S8c) + RegionPage (the destination's shell + the still-building chip + the placeholder body BELOW the section — DestinationBody extracted, BD-S8b's scope: the region's own cards arrive in S9–S16) + the App wiring (ONE lazy RegionPage chunk). A small S7 fix rode along: the mobile dot tap falls back to the caller's onOpenMarket when no explorer tile exists — the /world-markets mobile dot was dead, now scrolls to the wm-row grid row (verified live). THE §21 DIFF: region-zoom-backtest-core.ts (the S7 two-path shape — the page side through deriveWorldMapRows vs the engine side spelled out over the board's own rows, all-16 scale) + the offline suite (7, three fail-closed proofs — the naive-subset scale is the exact bug it exists to catch) + the live script pd-s8-backtest.ts — **the live run against PRODUCTION 13/13 green TWICE (pre- + post-deploy)**. 5 fresh pd.regionZoom.* keys (en+fa) queued unreviewed (manifest 7,311); every word inside the drawing is the pinned corpus block. The browser pass (1440×900 + 360×844, en + fa RTL, dark mode): all four zooms with ZERO card overlaps measured in the DOM, the leader lines' window-generalized math landing pins at the exact world coordinates, the country labels at the zoom overrides with zoom-scaled sizes, NO horizontal scroll, ZERO console/page errors across every route in both locales, the period switch (KOSPI 1D −5.3% → 1Y +34.5%), the keyboard walk, the mobile dot taps; the VLM passes' negative reads each disproven against the DOM (viewport folds + the windows' own designed edges). Gates ALL GREEN (2m23s: secret scan 8/954 · tsc 6/6 · eslint 0/0 · copy:audit · narrator + eval 50 · layer1 11,819 · **suite 14,877 (+38: zoom 12 · zoom-component 9 · backtest 7 · RegionPage 10)** · budgets held — the new RegionPage chunk 3.95/1.56 vs its 8/3 row, WorldMarketsPage SHRANK 26.54→23.10 through the adapter sharing). **Deployed + live-verified** (version `fde50a95` ~19:25 UTC, the owner's standing; the full record in DEPLOY.md 2026-11-08g — currena.ir/usa renders the US zoom over the live board (Dow −3.4% 1D, zero overlaps, zero errors), the Global (10 tiles) + Gold + legacy /insights surfaces intact). Hand-off prompt issued for S9 (Phase D opens — USA). |
| 13 | 2026-11-09 | **BUILD S9 — the USA verdicts + tiers 1–2 (Session 9/30) delivered, gated & deployed. PHASE D (USA) OPEN — the D-30 verdict strip + D-29's seven + tier-2 rates & the Fed are LIVE at /usa.** The strip renders the five thematic gauges through ONE derivation — `usaGaugeVerdicts` IS `globalGaugeTiles` re-exported (the world-map-copy pattern, D-48: the USA projection carries the gauges' full voter sets by construction — 72 homes + the 14 D-30 mirrors); the verdict WORDS and why-lines ride the EXISTING pd.global keys (one verdict language everywhere, zero duplicate fa strings — BD-S9a), the US-framed questions are the strip's only fresh copy, and dollar-strength is the only LINK (→ /currencies, BD-S3b honoured on-page, BD-S9b). Tier-1 "the world watches" (D-29's 7) + tier-2 rates & the Fed (the placement's authoritative 19 — the spec's "(22)" is the recorded AF-2 drift), every card with the §21 trio through the DISPLAY registry's own joins (usaCardValueText — the fed-target true corridor '3.75–4.00%' with the 25bp fallback, the trillion/billion scales, the auction ratio — pinned OUTPUT-FOR-OUTPUT against formatReadingValue over every id × both locales × both range shapes); the tiers derive from the placement's OWN groups through the new engine-side pageGroupIds accessor (never hand-copied). The honest paths: absent readings 'Cannot read yet', the M-17 last-good cache labelled (BD-S5a), the In-build chip + placeholder body staying for tiers 3–6 + TIC (S10's scope), and the S8 zoom staying on top through EVERY page state (BD-S9c). THE §21 DIFF: usa-backtest-core.ts — THREE sides, one truth (the PAGE side over the USA projection ≡ the GLOBAL side over the Global projection — D-30's 'the same computed verdicts as Global' pinned LITERALLY ≡ the ENGINE side over the served snapshot, never through a page module) + the offline suite (6, three fail-closed proofs with the feeds as independent copies) + the live script pd-s9-backtest.ts — **the live run against PRODUCTION 69/69 green TWICE (pre- + post-deploy)** + the tier-membership sanity (7/19/12/17/17 + the 26 all carried). 59 new pd.usa.* fa strings queued unreviewed (manifest 7,370, the queue now ~621); the 26 card names + unit/position/band/status words pinned byte-for-byte to the corpus in BOTH locales by usa-copy-pin.test.ts (which also pins the strip's one-verdict-language discipline against the corpus's own copy.label). The browser pass (1440×900 + 360×844, en + fa RTL + dark mode): the strip's five LIVE engine verdicts (identical words in fa), the §21 trio on every card, the zoom with ZERO overlaps in the DOM, the period switch driving the zoomed hero (Dow 1D −3.4% Fall → 1Y +8.9% Rise), NO horizontal scroll at any width, ZERO console/page errors across every route (Global 10 tiles + /gold + /world-markets + legacy /insights 16 cards intact); the VLM passes — mobile NO DEFECTS, the dark-fa read's one find («زیرک ۱۰۰») disproven against the DOM («نزدک ۱۰۰» = Nasdaq 100, the corpus's own Persian, zero clipped elements). Gates ALL GREEN (2m28s: secret scan 8/964 · tsc 6/6 · eslint 0/0 · copy:audit · narrator + eval 50 · layer1 11,819 · **suite 14,906 (+29: usa-tiles 12 · copy-pin 4 · UsaPage 7 · backtest 6)** · budgets held — the new UsaPage chunk 15.21/4.29 vs its 20/6 row, GlobalPage SHRANK 24.40→23.04 and RegionPage 3.95→1.65 through the shared global-tiles / RegionIndexSection chunks). **Deployed + live-verified** (version `36f64141` ~2026-11-08 20:35 UTC, the owner's standing; the full record in DEPLOY.md 2026-11-09a — currena.ir/usa renders the complete page over the live board, the fa/RTL render verified live, the backtest re-run post-deploy 69/69 green, all sibling surfaces intact). Hand-off prompt issued for S10 (tiers 3–6 + the TIC board + the index section's cards). |
| 14 | 2026-11-09 | **BUILD S10 — the USA tiers 3–6 + the TIC board (Session 10/30) delivered, gated & deployed. /usa IS THE COMPLETE AMERICAN BULK — all 72 registry cards in five tiers + the tier-6 "Who finances America" TIC board + the §7 item-8 index section (the S8 zoom) recorded as the section.** The S10 tiers (inflation 12 · labor & growth 17 · liquidity/stress/valuation 17) derive from the placement table's OWN groups through pageGroupIds (michigan-1y-expectations seated as AF-3's owner-ratification-pending twin), every card carrying the §21 trio through the DISPLAY registry's own joins (four new unit tokens — index/claims/permits/openings, the corpus's own words; the value-render equivalence pin extended to every id × both locales: '189,000 claims' · '7.52 m job openings' · 'US$745.0bn' · '40%' (the ×100 fraction) · '0.2938 ratio' · «۲۸٫۱۸ به‌صورت شاخص»). THE TIC BOARD IS THE REUSED LEGACY DRAWING (BD-S10a, D-48 — the S8 one-drawing rule): TicCustodyCard extracted to its own module and TicSection's copy contract narrowed to its own tic block (Pick<InsightsCopy,'tic'>, the S7 WorldMapCopy pattern — 14/14 legacy tests green through the refactor, the CompactRow/config chain no longer pulled), fed the corpus-pinned pd.usa.tic.* words through the ONE lean adapter usa-tic-copy.ts (37 camelCase keys + 21 country slugs, pinned byte-for-byte in BOTH locales by the extended usa-copy-pin test); UsaTicSection (the tier-6 wrapper) rides the EXISTING route GET /api/insights/tic (one KV read, own M-17 loader, never an error state) INDEPENDENT of the projection — 21 foreign holders + aggregates ($9.3tn, the official/private split), 24-month history, the custody-hub caveat (◆ + Treasury's own warning), and the net TRANSACTIONS shown SEPARATELY from the valuation effect (the two 12-month columns + the honest-difference note) — the spec §7 item 7's every ask. The placeholder body RETIRED (BD-S10b — nothing promises future tiers); the honest In-build chip stays for S11's gates; the S8 zoom stays on top. The §7 item-8 index section recorded as the S8 zoom (BD-S10c — the spec asks 'SPX · NDX · DOW zoom map + cards' and the S8 zoom renders exactly that; nothing invented beyond the spec). THE §21 DIFF: usa-backtest-core extended to the 72 cards + backtestUsaTicBoard (page payload ≡ engine payload ≡ the derived rows RESTATED with the helper's exact arithmetic — 3dp changes, raw-then-round sums, 1dp shares — never imported; the copyTic seam deep-copies the nested series so a page-side mutation can never leak — the mutated-value fail-closed proof CAUGHT the shallow seam in testing, exactly what the proofs exist for) + the offline suite (11 = +5) + the live script pd-s10-backtest.ts (the four feeds, the tier membership 7/19/12/17/17 + 72/72, and THE FRESHNESS AUDIT vs the registry's own maxAgeDays) — **the live run against PRODUCTION 173/173 green TWICE (pre- + post-deploy)** — all 72 cards' trio inputs byte-identical page ≡ Global ≡ engine, every TIC derived row identical through both paths, the freshness honest (govt-interest-revenue 221d beyond its 215d grace AND carrying the engine's stale status). 116 new pd.usa.* fa strings queued unreviewed (manifest 7,486, the queue now ~737); the 46 card names + 4 unit words + the 58-key TIC block pinned byte-for-byte to the corpus. The browser pass (1440×900 + 360×844, en + fa RTL + dark): all six tiers with ZERO card overlaps measured in the DOM, NO horizontal scroll at any width, the TIC table (8 columns, sort with aria-sort) + the mobile card list with the Show-all-16 toggle, the zoom period switch (Dow 1Y +8.9%) + the card click → /world-markets, the legacy /insights TIC section + custody card INTACT, ZERO console/page errors across every route; the VLM passes — TIC desktop + fa mobile NO DEFECTS, the dark-fa read's 'clipped circle' find disproven against the DOM (the logo ends 20px inside the viewport). Gates ALL GREEN (2m24s: secret scan 8/968 · tsc 6/6 · eslint 0/0 · copy:audit · narrator + eval 50 · layer1 11,819 · **suite 14,917 (+11: usa-tiles 16 · copy-pin 6 · UsaPage 7 · backtest 11)** · budgets held — the UsaPage chunk re-based 24.49/6.38 vs 26/7, the NEW shared tic chunk 21.16/5.59 vs 24/7 with the Insights chunk SHRINKING 1553.17→1532.14 through the split — the drawing paid once). **Deployed + live-verified** (version `18907d4d` 2026-11-08 22:24 UTC, the owner's standing, the deploy-lock check clear — S9's `36f64141` @ 100%; the full record in DEPLOY.md 2026-11-09b — currena.ir/usa renders the complete page over the live board with the deployed chunks BYTE-IDENTICAL to the local build, the backtest re-run post-deploy 173/173 green, all sibling surfaces intact). Hand-off prompt issued for S11 (USA gates — Phase D closes). |
| 15 | 2026-11-09 | **BUILD S11 — the USA gates (Session 11/30) delivered, gated & deployed. PHASE D (USA) CLOSED — the freshness-within-cadence-grace audit formalized as a pure function + offline suite, the mobile/ARIA polish landed, the honest In-build chip retired.** S11 is the gates + polish session over the S10-complete /usa page (72 cards + the TIC board, no new layers). (a) THE FRESHNESS AUDIT FORMALIZED (BD-S11a — spec §21's "Data audit" leg): the freshness audit the live pd-s10-backtest.ts carried inline is extracted into a PURE function auditUsaFreshness in usa-backtest-core.ts — takes (readings, registry, cardIds, now), returns {checks, withinGrace, beyond[]} where each beyond-grace finding carries an honest flag (true iff status === 'stale'); the audit PASSES iff every beyond-grace card honestly carries the engine's stale status (the govt-interest-revenue case: 222d beyond its 215d grace AND status 'stale' — the page speaks the engine's own word, never a silent stale-by-age card the engine missed). The live script now calls the SAME function (no logic drift between the test and the gate); the offline suite (5 new tests in usa-backtest.test.ts): the GREEN path, the HONEST-STALE path (the govt-interest-revenue twin), the FAIL-CLOSED proof (a beyond-grace card the engine forgot to flag → RED — the audit catches the engine's own miss), the EXEMPT path (per-change maxAge null + unavailable asOf null), the ABSENT-TWIN path. (b) THE MOBILE/ARIA POLISH (BD-S11b — spec §18 D-48's "touch targets ≥ 44px" + the WAI-ARIA disclosure pattern): TicSection.tsx — the mobile card list's Show-all toggle already carried aria-expanded (S10); it now carries aria-controls pointing to the list it controls (the useId()-generated id — unique per instance so the REUSED component renders on both /usa and /insights without an id collision); WorldMap.tsx — the period switch's radio buttons bumped from min-h-[41px]/@max-[480px]:min-h-[37px] to min-h-[44px] everywhere (the spec §18 D-48 was below on small screens at 37px; the small-screen padding/font reductions kept for horizontal fit). The TIC table's sort buttons stay at 36px (desktop-only at ≥900px, exceeding WCAG 2.2's 24px minimum; the 44px bar is for touch, and the table doesn't render on touch-width mobile — the mobile card list does, with its 44px Show-all toggle). (c) THE IN-BUILD CHIP RETIRED (BD-S11c — BD-S10b's completion): the USA page's honest "In build" status chip is REMOVED from the heading block — the gates passed (the §21 card audit 173/173 green, the freshness audit formalized, the mobile/ARIA polish landed); the page's layers are complete and verified. The pd.statusBuilding key stays for RegionPage + PagePlaceholder (the genuinely-not-yet-built pages). THE §21 DIFF (the S11 gate's own — re-audited as the session's own gate): the live pd-s10-backtest.ts re-run against PRODUCTION with the pure auditUsaFreshness — **173 checks · 173 green · 0 red, TWICE (pre- + post-deploy)** (115 page-diff + 48 TIC + 6 tier membership + 1 freshness + 3 feed). The browser pass (the freshly built SPA through the local preview server, /api proxied to currena.ir): 1440×900 AND 360×844 in BOTH en and fa (RTL, Persian digits) — all six tiers with ZERO card overlaps measured in the DOM, NO horizontal scroll at any width in any locale (overflow 0px on all 4 legs), the period switch at 44px on all 4 legs, the Show-all toggle's aria-controls resolving on all 4 legs, the In-build chip ABSENT on all 4 legs, ZERO console/page errors across all 4 legs; the VLM visual pass (fa-360): 3 findings (a "stray gray bar", a "clipped date ۱۴۰", a "clipped question در تش") — ALL THREE DISPROVEN against the DOM (the topbar's normal border; the actual date «داده‌های ۱۴۰۵/۰۸/۱۷» fits scrollW===clientW — the VLM misread the Persian digits; the actual question «آیا بازار آمریکا در تنش است؟» fits scrollW===clientW — the VLM dropped "ن" from "تنش" at small font, exactly the S10 precedent where «زیرک ۱۰۰» was a misread of «نزدک ۱۰۰»). Gates ALL GREEN (2m21s: secret scan 8/968 · tsc 6/6 · eslint 0/0 · copy:audit · narrator + eval 50 · layer1 11,819 · **suite 14,922 (+5: usa-backtest 16 (+5) · TicSection 14 (+1 aria-controls assertion) · UsaPage 7 · usa-tiles 16 · usa-copy-pin 6)** · budgets held — the UsaPage chunk 24.20/6.29 vs 26/7 (the chip removal shaved ~288 bytes), the shared tic chunk 21.20/5.61 vs 24/7 (the aria-controls + useId added ~39 bytes)). **Deployed + live-verified** (version `4f288272` 2026-11-09 00:42 UTC, the owner's standing, the deploy-lock check clear — S10's `18907d4d` @ 100%; the full record in DEPLOY.md 2026-11-09c — currena.ir/usa live-smoke-verified (72 cards · 5 strip · 6 tiers · In-build ABSENT · period switch 44px · aria-controls resolves · 0px overflow · 0 page errors), the deployed UsaPage + tic chunks BYTE-IDENTICAL to the local build (24,198 + 21,195 bytes, the hashed names UsaPage-Dc8qMK9L.js + tic-CVC4yc5d.js match exactly), the backtest re-run post-deploy 173/173 green, all sibling surfaces intact). Hand-off prompt issued for S12 (Phase E opens — Europe build + fills). |
| 16 | 2026-11-09 | **BUILD S12 — the Europe page build (Session 12/30) delivered, gated & deployed (`84833135`). Phase E OPEN.** The EU + non-EU/UK sections, the region zoom (the S8 drawing), the cross-links — the 8 placed ids; the §15 fills verified-pending-ingest (the sources verified live, ingestion riding the later rungs). |
| 17 | 2026-11-09 | **BUILD S13 — the Europe gates (Session 13/30) delivered & deployed (`b11fd84f`). PHASE E CLOSED.** The card-render audit, the freshness honest (beyond-grace cards carrying the engine's own stale status), the mobile/ARIA pass, the honest In-build chip retired. |
| 18 | 2026-11-09 | **BUILD S14 — the Asia & Pacific page build (Session 14/30) delivered & deployed (`68281479`). Phase F OPEN.** The five sub-regions (D-35): China 7 · Japan 2 · Korea/Taiwan/HK index-only · India index-only · Pacific-NZ 2 = 11 placed cards + the S8 zoom + the cross-links. The §15 Asia CPI fills VERIFIED STALE at the source (Rule 5 — BD-S14a: the FRED OECD mirror family dead; the dedicated fill session queued). The honest In-build chip stays until S15. |
| 19 | 2026-11-09 | **BUILD S15 — the Asia gates (Session 15/30) delivered & deployed (`6f96cd9a`). PHASE F CLOSED.** The card-render audit, the freshness honest, the mobile/ARIA pass, the In-build chip retired. |
| 20 | 2026-11-09 | **BUILD S16 — the Australia build & gates in one session (Session 16/30) delivered & deployed (`9d60726b`). PHASE G CLOSED.** The REUSED AU Markets board (19 symbols), the 5-gauge structure (D-37), the 28 cards, the 11 moved-out seat chips; the §21 backtest 28/28 green + the render audit + the 4-leg browser pass. |
| 21 | 2026-11-09 | **BUILD S17 — the Commodities page (Session 17/30) delivered & deployed (`08e0fc64`). PHASE H CLOSED.** The 4 commodity groups + the trade routes & supply group — 24 cards + the gold cross-link; the §21 backtest 24/24 green + the render audit + the In-build chip retired + the 4-leg browser pass. |
| 22 | 2026-11-10 | **BUILD S18 — the Currency Pairs page (Session 18/30) delivered & deployed (currena-api `51a0fe45` + currena-markets `8f63c8fa` + the fx-run KV seed). PHASE I CLOSED.** The rule-lights hero + the 11-pair board (AUDNZD the 11th pair, D-42) + the dollar-standing cards; the §21 backtest (3 gates) + the render audit green. Two duplicate session arrivals reconciled onto the pushed tree (BD-S18-parallel-3). |
| 23 | 2026-11-10 | **BUILD S19 — Integration leg 1: the navigation/mobile/SEO polish (Session 19/30) delivered & deployed (`74777037`). Phase J OPEN.** The breadcrumbs + the per-page meta/OG (BD-S19c, the SPA-honest client-side approach) + the language-toggle polish + the sticky-footer verification + the two S1-noted hero items. |
| 24 | 2026-11-10 | **BUILD S20 — the full-site regression round (Session 20/30, NO deploy).** The 11 live pd-* backtests (715 checks) · the N=20 source spot-check (20/20) · the 40-leg browser pass · the performance check · the placement reconciliation — ALL GREEN; the gates 15,099; the §21 data-audit tool landed (the re-runnable freshness + upstream cross-check kit). |
| 25 | 2026-11-10 | **BUILD S21 — the spec-vs-implementation audit (Session 21/30) delivered & deployed (`5593fd43`). PHASE J CLOSED.** The full §4–§14 diff vs the live site; four deviations FIXED (the NZX50 mirror card on /asia-pacific + the Global cached-header BD-S5a clause + the stale placement notes + the stale comments); AF-6/AF-7 recorded; the 11 backtests 715 green; the data audit re-run green after the PortWatch maintenance window. A duplicate arrival reconciled (the counterpart close). |
| 26 | 2026-11-10 | **S22 — the WAITING-slot close (Session 22/30).** The investor review not yet arranged; BD-S22: no D-49+, the AF-1…AF-7 findings parked for the v2 pass; the roadmap resequenced honestly (S23 deferred, S24 pulled); the gates re-run green on the records-only tree. |
| 27 | 2026-11-10/11 | **S23 DEFERRED (blocked on the investor) — the slot ran the pulled-forward S25 fill session.** The IMF SDMX 3.0 CPI dataflow source (BD-S23a — verified at both venues + the three national bureaus + the World Bank cross-check); the three D-36 Asia CPI fills landed (the registry 184 → 187, /asia-pacific's 14 cards live); deployed `2c61c187` + `33ff60c0` (the KV-seed patch fix — patchInsightsSnapshot ADDS fresh-card readings) + the KV seed; a duplicate arrival reconciled (BD-S23-parallel). |
| 28 | 2026-11-11 | **S24 — the legacy-retirement readiness review (Session 24/30, NO deploy).** The D-9 audit ALL GREEN (`pnpm s24:d9-audit` — 187 ids, one lane + one home each; the doc-side drift reconciled doc-only) + the retirement checklist landed spec-grade (`06-LEGACY-RETIREMENT-S24.md`); the execution gated on the owner's §19.6 sign-off (Gate 0). |
| 29 | 2026-11-11 | **The Session 25 SLOT — the first reserve session (BD-S25): the ecb provider-timeout maintenance.** The failing leg diagnosed as the ECB HICP fetch (six days of 12 s rung timeouts); the provider-side cause measured live (the ECB gateway's ~30.2 s HTTP 504 roulette — per-request, any series, from Worker egress); the fix — the stable full-history HICP URL + `ECB_PORTAL_TIMEOUT_MS = 45 s` single-attempt on all four portal legs + the two regression pins; deployed currena-api `9861a927` (production ≡ HEAD). |
| 30 | 2026-11-11 | **The Session 26 SLOT — the second reserve session (BD-S26): the ecb FIRST-CHECK follow-through (NO deploy).** The post-fix evidence generated via the sanctioned GHA belt-and-braces dispatch (run 43036550865: DFR ❌ HTTP 504 · AAA ✅ fetched · HICP ❌ HTTP 504 — the designed honest shape; the held/fresh card values verified EXACTLY against the publisher); the roulette measured at all three observed venues incl. the sandbox; the verdict PENDING, riding the scheduled rungs. |

*(Back-filled 2026-11-11 by the Session 27 slot — the table had stopped at
S11. Dates are the UTC dates of each session's close commits, cross-checked
against the Cloudflare deployments API where a deploy happened (e.g.
`74777037` created 2026-11-10T02:50Z). NOTE for the owner: several progress-
board date stamps in `01-SESSION-ROADMAP.md` (S16–S25 SLOT) drift 1–2 days
later than the git/Cloudflare record (e.g. the board says S19–S21 delivered
2026-11-12; the deploys + close commits are 2026-11-10 UTC) — the delivery
records' content stands, only the date stamps drifted; this table carries
the verified dates. The deep per-session records remain the roadmap's
delivery records + `docs/HANDOFF.md` + `CHANGELOG.md`.)*

## 9. Hand-off — the build kickoff prompt (Session 1/30)

Copy-paste the block below to start the build. Progress format per Agent
Rule 3: **Session 1 of 30 · 29 remaining.**

```text
Currena page-division BUILD — Session 1/30 (Phase A · Foundations S1).
Strategy is settled (D-1…D-48). Your job now: execute the roadmap, phase by
phase, following the agent rules at all times.

READ FIRST, in this order (all in the repo):
1. AGENT-RULES.md                            (docs/ — permanent working rules; in AGENTS.md §14)
2. docs/page-division/README.md              (the doc-set index & status)
3. docs/page-division/01-SESSION-ROADMAP.md  (your session's scope + protocol)
4. docs/page-division/02-PAGE-DIVISION-SPEC.md (the design source of truth)
5. docs/page-division/03-STRATEGY-LOG.md     (decisions D-1…D-48 + rationale)

Repo: https://github.com/assadigit/Currena (token re-supplied below).
Environment: Cloudflare Workers (account id + API tokens re-supplied below);
EODHD key re-supplied below. Secrets go to env/wrangler — never into code
or commits (Agent Rules §6).

THIS SESSION'S SCOPE — Foundations S1 only (short session, Agent Rule 1):
1. Scaffold the route structure: / (Global placeholder), /gold,
   /world-markets, /usa, /europe, /asia-pacific, /australia, /commodities,
   /currencies — and move today's all-in-one Insights page to /insights
   with a deprecation banner linking to / (D-46).
2. Build the grouped topbar navigation (D-45) + mobile drawer.
3. Baseline must be green: typecheck + lint clean, dev server up, every
   route renders. Commit & push at every checkpoint (Agent Rule 2).
4. Run this session's gates (Agent Rule 4): render checks for all 10 routes,
   legacy content intact at /insights, nav works at mobile width (360px).
5. End the session with: gates summary, commit pushed, and the hand-off
   prompt for Session 2/30 with the progress counter
   (Session 1/30 · 29 remaining) and what remains next.
```

---

*This document is the single source of truth for the strategy conversation.
The code in the repo wins over any doc for behaviour; this log wins for
intent. Changes to any D-entry require a new dated D-entry (§7.5).*
