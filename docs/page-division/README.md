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
  G CLOSED) 2026-11-10.** S17 (the Commodities build & gates: the four
  commodity groups [Energy 9 · Metals 4 · Agriculture 3 · Digital 2] +
  the Trade routes & supply group [D-38/D-39: the five chokepoints + the
  GSCPI = 6] — 24 cards with the §21 trio, every card context-only [no
  gauges, no verdict lines — G-5]; the gold cross-link to /gold on the
  metals group [D-19/D-27]; the §21 backtest [the pure core + the
  offline suite + the live pd-s17-backtest.ts, 24/24 green vs production
  pre- AND post-deploy] + the render audit [CommoditiesPage.test.tsx, 7
  tests] + the In-build chip RETIRED at the gates pass — BD-S17c — Phase
  H CLOSED) 2026-11-11.** S18 (the Currencies build & gates — Phase I
  OPENED AND CLOSED IN ONE SESSION: the 7 rule lights hero D-41 [through
  the SAME §9.3 fxRuleView mapping the legacy page reads] + the 11-pair
  board D-42 [AUDNZD the 11th pair — the one named engine addition: its
  own pacificLink group, NZD on the same single Frankfurter request] +
  the dollar-standing cards D-32 [14 registry cards with the §21 trio
  over the S2 projection] + the FX-board payload wiring [GET
  /api/insights/fx, the markets/fx last-good discipline]; the §21
  backtest [the pure core with THREE gates — the 14-card trio diff + the
  RULES gate (the §9.3 table + the renderable-domain invariant + the
  stored summary ≡ the engine's own rollup) + the BOARD gate (11 pairs
  complete)] + the render audit [CurrenciesPage.test.tsx, 8 tests] + the
  In-build chip RETIRED at the gates pass — the LAST placeholder page is
  real — deployed BOTH workers [currena-api `51a0fe45` + currena-markets
  `8f63c8fa` + the fx-run KV seed] with the post-deploy §21 ALL GREEN +
  the 4-leg browser pass green) 2026-11-11.** S19 (the Navigation,
  mobile & SEO polish — Phase J OPENS: the breadcrumbs on the eight
  destinations + the per-page meta/OG pass [the route-meta table + the
  App <head> effect + the refreshed static defaults] + the HANDOFF item
  6 language-toggle polish [the "theme words" read disproven against
  the deployed DOM; the labels now name the target] + the sticky-footer
  verification with the iOS safe-area rider + the two S1-noted
  legacy-hero mobile items closed; the suite 15,099 = +11; the browser
  pass on all 10 routes × both widths × both locales) 2026-11-12 —
  DEPLOYED LIVE (currena-api `74777037`, a WEB-ONLY deploy — the
  markets worker untouched).** **S20 (the full-site regression +
  verdict backtest + data audit — every page × every §21 gate re-run
  against the S19 tree AND production, ALL GREEN: the 11 live pd-*
  backtests 715 checks [the narrator raw-KV stateHash recompute
  identical] · the N=20 random-id source spot-check 20/20 [the new
  re-runnable `pd-s20-data-audit.ts`, seed 20261112 — 19 byte-exact +
  platinum the recorded live-spot arm] · the placement reconciliation
  [184 ids · 0 unplaced · 0 duplicate homes] · the gates 15,099 · the
  40-leg browser pass [0px overflow + ZERO errors on every leg] · the
  performance check [COLD 380ms/485KB · WARM 59–81ms — no budget
  breach]; NO deploy — nothing was fixed, the tree changes are dev
  tooling only, production stays at `74777037`/`8f63c8fa`) 2026-11-12.**
  **S21 (the spec-vs-implementation audit — the full §4–§14 diff vs the
  live site: every prior recorded deviation re-confirmed as holding ·
  FOUR deviations FIXED and DEPLOYED as currena-api `5593fd43`
  [WEB-ONLY — the NZX50 mirror card on /asia-pacific's Pacific—NZ
  section replacing the false both-locale "rides the Asia zoom map"
  sentence + the Global cached-header BD-S5a alignment + the stale Asia
  placement notes + the stale comments] · two spec-side drift findings
  recorded as AF-6/AF-7 · the §14 placement table regenerated &
  reconciled [184 · 0 · 0] · the gates 15,102 · the 11 live pd-*
  backtests 715 green · the §21 data audit green after the PortWatch
  Tuesday-maintenance window [BD-S21e's runbook note: never run the
  portwatch leg Tuesdays 11:00–14:00 UTC] · the 24-leg browser
  regression — **PHASE J CLOSED**) 2026-11-12.** **S22 (the Phase K
  collection slot — CLOSED AS A WAITING SLOT 2026-11-12: the investor's
  review of spec §19 was NOT yet arranged — verified against every
  record the program can read — so per the owner's standing instruction
  and the roadmap's reserve rule, NO answers collected · NO D-49+
  recorded (the strategy log §5 carries the Round-4 PENDING marker) ·
  NO spec v2 entries produced (AF-1…AF-7 stay parked — the spec
  untouched, never silent edits) · NO deploy (a records session); the
  first reserve session — the §15 Asia CPI fill session — is PULLED
  FORWARD into the Session 23 slot (S23's feedback-build scope
  deferred, blocked on the investor; BD-S22); the gates re-run ALL
  GREEN on the records-only tree — the suite 15,102, the S21 count
  exactly).**
  **S23 (the PULLED-FORWARD reserve session — the §15 Asia CPI fill
  session, delivered in the Session 23 slot 2026-11-12): the three D-36
  §15 Asia CPI fills (japan-cpi · korea-cpi · india-cpi) LANDED from the
  IMF's own SDMX 3.0 CPI dataflow (BD-S23a — Rule 5 verified at both
  venues + the three national-bureau second voices + the World Bank annual
  cross-check; the FRED OECD mirror family verified DEAD in S14, BD-S14a —
  never re-try those ids): the full §A ingest discipline (the registry
  184 → 187 ids), the three cards rendered on /asia-pacific with the §21
  trio + the fa copy through the manifest (round-83) — the page’s 14
  placed cards (China 7 · Japan 3 · Korea/Taiwan/HK 1 · India 1 ·
  Pacific-NZ 2, the two index-only sections retired), pd-s14 extended to
  the 14 cards, the spec-v2 diff grown (AF-8). DEPLOYED as currena-api
  `2c61c187` (the fill build) + `33ff60c0` (the KV-seed patch fix —
  patchInsightsSnapshot now ADDS fresh-card readings, a bug the live
  seed exposed) + the KV seed (the three readings LIVE); a duplicate
  arrival landed the build (BD-S23-parallel — the pushed implementation
  governs, the duplicate archived on archive/s23-duplicate-m2-m5, the
  shipped tree independently re-verified: the gates 15,267 ALL GREEN).
  Session 24/30 then delivered the legacy retirement readiness review
  (BD-S24, NO deploy — a records session): the D-9 condition MET (every
  one of the 187 ids verified categorized — one engine lane + one page
  home each; 18 checks ALL GREEN via the re-runnable `pnpm
  s24:d9-audit`, which now also pins AGENTS §A against the registry),
  the audit's doc-side drift reconciled same-session doc-only (§A's
  stale headers + 23 missing + 3 misplaced rows · IADS §1 · the 04
  audit basis), and the retirement checklist landed as the spec-grade
  `06-LEGACY-RETIREMENT-S24.md` (the redirect A/B decision — the
  card-aware option B recommended; the /insights-only surfaces — the
  region verdicts, the two global shadow-gauge headers, the details
  panels + per-id history, the narrator's full set, the
  watchlist/search/exports, the calendar/About/Together/MoneyPanel;
  the per-page gap table; the sign-off-gated execution plan). The
  execution itself does NOT ship — the timing is investor question
  §19.6 (Gate 0 = the owner's recorded sign-off; the gates ALL GREEN
  2m 36s on the records tree; production unchanged: currena-api
  `33ff60c0` + currena-markets `8f63c8fa`). The Session 25 SLOT then
  ran the first reserve session (BD-S25, 2026-11-12 — the owner's
  kickoff supplied no investor §19 answers): the ecb provider-timeout
  maintenance — the failing leg is the ECB HICP fetch (timed out at
  the 12 s default on every rung 2026-11-06→11 while DFR/AAA stayed
  green; euro-hicp held on last-good 4.0 @ 2026-10, verified exactly
  against Eurostat's own 2026-11-04 flash release); the venue probe
  matrix measured the provider-side cause (the ECB gateway
  intermittently answers HTTP 504 after ~30.2 s on ANY request —
  venue-independent: Worker egress + the Node venue both carry the
  per-request roulette); the fix shipped + deployed (the stable full-history
  HICP request + the 45 s patient single attempt + the two pins +
  the truthfulness updates — currena-api `9861a927`, the markets
  worker untouched, the SPA byte-identical, the gates ALL GREEN twice
  at 15,270 tests) with the rung-level proof riding the standing
  sweeps. The Session 26 SLOT (2026-11-11, BD-S26) then ran the second
  reserve session — the ecb FIRST-CHECK follow-through: the live status
  at session open was still PRE-FIX (no scheduled rung had carried the
  new code yet — the first is the 20:10 sweep tonight, armed), so the
  session generated the missing evidence via the belt-and-braces path
  (a GHA `insights-ingest` dispatch on main ≡ production, 14:15 UTC):
  the FIRST post-fix full collect recorded the designed honest shape
  (DFR ❌ HTTP 504 · AAA ✅ fetched · HICP ❌ HTTP 504; 50/52 green; the
  two voting cards held on last-good; the run exited 1 by design); the
  held/fresh values verified EXACTLY against the publisher's own API
  (DFR 2.5 @ 2026-11-11 · HICP 4.0 @ 2026-10 · AAA 3.3308865271 @
  2026-11-10); the roulette now measured at ALL THREE observed venues
  (the sandbox included). The verdict stays PENDING, riding the coming
  rungs; NO deploy (the code is unchanged — production `9861a927` ≡
  HEAD). The Session 27 SLOT (2026-11-11, BD-S27) then ran the third
  reserve session — the ecb first-check ROUND 3 + the buffer health
  pass (the sweep-watch session, run as one session across an
  interruption): the buffer health pass ALL GREEN (the full gates 9/9
  in 2m 45s — the suite 15,270, the S26 close count exactly — + the
  D-9 standing audit 18/18 + the live pd-* backtests ALL ELEVEN ALL
  CHECKS GREEN against production, the stateHash recompute IDENTICAL)
  plus the M2a strategy-log §8 back-fill (the 15 missing session-table
  rows, the UTC-date convention recorded); the 20:16 UTC sweep read
  found the blob UNCHANGED (generatedAt 14:15:19Z) — the DESIGNED
  no-update branch (the post-~19:00 KV write-cap window refused the
  20:10 sweep's writes, or the sweep did not fire — indistinguishable
  on the available surface; the designed fallback is identical either
  way) — so the verdict stays PENDING (round 3) riding tomorrow's
  04:10–04:40 Worker rungs, with NO escalation trigger (one post-fix
  day; no card past its maxAge window — DFR asOf today · AAA 1 day ·
  HICP day 41 of 60). Round 4 = the next session's first check. NO
  deploy (production verified unchanged: currena-api `9861a927` +
  currena-markets `8f63c8fa`). The Session 28 SLOT (2026-11-11, BD-S28)
  then ran the fourth reserve session — the ecb first-check ROUND 4 +
  the buffer health pass: the session opened ~1.5 h after the S27 close
  and ~6 h BEFORE the evidence window (the 2026-11-12 04:10–04:40
  rungs), the early read finding the blob still the S26 evidence run
  with the write budget demonstrably alive (the :13 prices write landed
  at 21:13) — so the session dispatched the sanctioned belt-and-braces
  rung (GHA insights-ingest run 91, 22:07:46Z): THE COLLECT RAN THE NEW
  CODE CLEAN — all three ecb legs green in one rung for the first time
  (DFR · AAA · HICP; zero failed source rows; T-01…T-14 green; the
  readings exactly the served publisher-true values — the third
  same-day independent verification) — while its writes were all
  refused by the daily cap (the direct 429-10048 + retry-ladder
  evidence, the 15-minute job timeout cancelling the run mid-chain;
  S27's indistinguishability RESOLVED). **THE VERDICT: the BD-S25
  provider-timeout maintenance item is CLOSED** — the observable green
  rows ride the fresh-window rungs; the next session's first check is
  the one-read confirmation. The buffer health pass ALL GREEN (the full
  gates 9/9 in 2m 37s — the suite 15,270 — + the D-9 standing audit
  18/18 + the live pd-* backtests ALL ELEVEN ALL CHECKS GREEN + the S20
  data audit 20/20). NO deploy (production verified unchanged:
  currena-api `9861a927` + currena-markets `8f63c8fa`); the ecb
  escalation choice has retired to the RISK_REGISTER standing posture.

  The Session 29 SLOT (2026-11-12, BD-S29) then ran the fifth reserve
  session — the first-check green-rows CONFIRMATION + the EIA-trio
  wire-honesty heal + the buffer health pass: the session opened ~1 h
  after the S28 close and ~4.5 h BEFORE the 2026-11-12 04:10–04:40
  evidence window (the blob still the S26 evidence run), so it landed
  the green rows EARLY via the sanctioned dispatch in the fresh
  post-midnight KV slice (GHA insights-ingest run 92, 00:01:44Z,
  success in 2m36s, all writes landed): **the blob refreshed to
  00:02:45.793Z with failedSources EMPTY — all three ecb rows GREEN in
  the observable state for the first time** (the readings exactly the
  publisher-true trio) — the BD-S28 residual confirmed, no new decision
  needed. The fresh rung surfaced a NEW finding: the EIA weekly trio
  past the 12-day wire-guard grace at the day boundary (T-04 red, age
  13) — the provider's own release delay (the 11/11 release slipped to
  11/12 per its own LeafHandler footer; the values EXACT against the
  page), healed on the wire via the DESIGNED rung2-run --eia landing
  lever (the honest [stale] re-marking, ~10 KV writes; the pd-s17
  freshness arm back to its designed pass; the trio self-heals at the
  Saturday 11-14 gate; the RISK_REGISTER eia row carries the posture).
  The buffer health pass ALL GREEN (the full gates 9/9 in 2m 35s — the
  suite 15,270 — + the D-9 standing audit exit 0 + the live pd-*
  backtests ALL ELEVEN ALL CHECKS GREEN, 705 checks/0 red + the S20
  data audit 20/20, both EIA sample members EXACT). NO deploy
  (production verified unchanged: currena-api `9861a927` +
  currena-markets `8f63c8fa`).

  The Session 30 SLOT (2026-11-12, BD-S30) then ran the FINAL slot —
  **the program close-out: THE 30-SESSION PROGRAM IS COMPLETE.** The
  owner's kickoff supplied no investor §19 answers and no §19.6
  sign-off, so the slot ran the last buffer branch per its own
  standing rule: the buffer health pass ALL GREEN four legs (the full
  gates 9/9 in 2m37s — the suite 15,270, the S26–S29 close count
  exactly — + the D-9 standing audit exit 0 + the live pd-* backtests
  ALL ELEVEN ALL CHECKS GREEN against production, 705 checks/0 red
  [the narrator stateHash IDENTICAL — the S29 one-state-behind note
  healed by the 00:50 rung; the EIA trio beyond-grace + honestly
  stale, the S29 re-score holding] + the S20 data audit 20/20, both
  EIA sample members EXACT) — all read-only/local, zero KV writes —
  plus the close-out records: the counter reaches **30/30 · 0
  remaining; the project finishes; the remaining levers stay with the
  owner**. The two optional observation reads (the 04:10 UTC rung's
  T-04 re-validation; the Saturday 11-14 rung-2 gate landing the 11/12
  EIA release) fell outside the session's window — recorded as
  expected outcomes only, no decisions pending. NO deploy (zero code
  changed; the program's last code change remains the S25 ecb fix,
  live as `9861a927` since 2026-11-11; production verified unchanged
  `9861a927` + `8f63c8fa`). The legacy retirement execution NEVER ran
  — Gate 0 (the recorded §19.6 sign-off) holds.

  **The first post-program owner round (S31, 2026-11-12, BD-S31):
  the World Markets briefing restored on /world-markets + DEPLOYED.**
  The owner asked for the legacy section's editorial layer the S7
  refactor had omitted (the breadth headline + the two movers + the
  regional tile explorer with its detail panels — "I worked hard on
  their UI/UX"): shipped as the corpus-pinned WorldMarketsBriefing
  section (the SAME pure helpers, never a second arithmetic; the
  REUSED MarketsChart/MarketLogo drawings), the map's period switch
  promoted to the page's ONE controlled lens, the WM chunk budget
  30/8 → 40/9 (gzip-quiet +0.30 kB), the gates 9/9 (the suite 15,275,
  +5 arms) + the EN/FA/RTL/mobile browser pass green — deployed
  through currena-api with the live verify green. The full record: the
  roadmap's "Owner rounds (post-program)" section + BD-S31.

  **The owner's levers (the program is finished — these re-open work
  at the next free slot): (1) arrange the external investor's review
  of spec §19 (the seven questions) — the investor round re-opens the
  moment the answers exist (collect → D-49+ in the strategy log §5
  Round 4 → the spec v2 entries, the AF-1…AF-8 findings riding that
  pass, never silent edits), then S23's deferred feedback-build scope
  follows it; (2) the §19.6 retirement timing answer (directly, or via
  the investor round) — the execution session runs per
  `06-LEGACY-RETIREMENT-S24.md` §7 ONLY behind the recorded sign-off;
  (3) ratify the `/converter` relocation (S1) + AF-3 + the
  BD-S3…BD-S30 decision set; (4) triage the queued unreviewed fa
  strings; and (5) revoke or rotate the session credentials now that
  the development work has ended (they were used, never stored).** See
  the roadmap's progress board for the current position.

## The one rule that trumps everything

`AGENT-RULES.md` (docs/; the rules are consolidated into AGENTS.md §14). Short sessions. Continuous commits.
Hand-offs with progress counters. Green gates or no progress. Financial-data
discipline — never assume; this is people's money.
