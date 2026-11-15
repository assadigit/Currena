# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **BASELINE-REPAIR (2026-11-15) — DELIVERED: the 9-gate green baseline
> is restored.** The five pre-attributed repairs from the M1-blocked
> record each landed as a cause fixed, never a rule weakened; `pnpm
> gates` runs **9/9 GREEN** with the suite **exactly 15,298** (core 195 ·
> scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226), zero
> unhandled errors. Commits: `cf5b5d74` (the repair) + the bookkeeping
> commit. **Nothing deployed** (per BD-M1's sequencing — the TM1–TM4
> treemap deploy stays parked for the M1 re-run, now behind green
> gates). One finding beyond the recipe: the TM series' dead imports
> were load-bearing for the BUNDLE TOPOLOGY — removing them (correctly)
> dissolved the phantom chunk sharing, so three more budget rows were
> re-documented (BD-BR; every route's download is the same bytes or
> fewer, the whole bundle shrank 3.7 kB, and /insights visitors stop
> downloading ~70 kB of dead module trees).
>
> **The NEXT session is the M1 RE-RUN** — modularization Phase 1 (the
> folder skeleton), the owner's original M1 prompt verbatim (reconstructed
> from the repo records — BD-M1 + the M1-blocked entry + the audit's
> Phase 1 spec — the original lived in the owner's chat), reproduced in
> full at the bottom of this file. It now starts from a GREEN baseline:
> re-record the numbers, execute the phase, deploy the treemap.

## Current state (after the BASELINE-REPAIR session)

- **Program:** modularization — Phase 0 DELIVERED (M0: the audit + the
  plan, `docs/modularization/MODULARIZATION-AUDIT.md`; the §3.1
  deviations D1–D10 owner-APPROVED). **Phase 1 NOT STARTED — the
  baseline it was blocked on is now GREEN.**
- **origin/main is GREEN** — 9/9 gates at `cf5b5d74`+bookkeeping (the
  table below). Working tree clean after the two commits.
- **Production is unchanged** — currena-api `502708df` (the S31 build).
  The TM1–TM4 treemap commits remain deploy-pending, now behind green
  gates: **the M1 re-run session ships them** (deploy after its commits
  are pushed and its gates are green, then live-verify
  https://currena.ir/world-markets — the treemap card renders, EN +
  FA/RTL, zero console errors).

## The green baseline — the repair record (2026-11-15)

`pnpm gates` = **9/9 GREEN** (2m 36s):

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1039 files) |
| 2 | typecheck | PASS | 6 packages |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean (8,006 entries · 1,258 queued) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226), zero unhandled errors |
| 9 | build + bundle budget | PASS | entry 273.96/82.96 · GoldPage 70.42/17.95 · WM 52.83/13.05 · UsaPage 45.41/11.14 (BD-BR rows) |

The five repairs, as landed (all pre-attributed by the M1-blocked
record; commit `cf5b5d74` carries the detail):

1. **typecheck** — both `homePageOfIndicator` call sites now guard the
   null explicitly (`if (home !== null) navigate(home)` — the
   australia-tiles house pattern): EconomicLinkagesPage.tsx:59 +
   GlobalPage.tsx:229. All other call sites audited — already
   null-correct.
2. **lint** — all 26 dead vars removed with their full dead chains
   (the token VALUES went but their setters stay — `onWillNavigate`
   is live; `marketsAlert`/`fxAlert`/`jumpToMarkets`/`jumpToFxCurrencies`
   left the destructuring; `ticState`+`ticFeedEnabled`+`publicTicBoard`
   removed as a chain; `sectionIndicators`+`useWorldSectionIndicators`;
   `jumpToSection`+the `InsightsSection` type import; `custodyReading`;
   `dailyPeers`+`dailyPeersOf`; the 10 cut-section imports; the
   SectionLane `ticSlot` prop; the 3 CommoditiesTierCards key maps +
   `CommoditiesCardId`; `withRbaStale`; GoldPositions' `t` — now used
   by repair 3). **The two side-effect-bearing removals were
   git-blamed before touching:** the `useTicSection` fetch's every
   consumer was cut by TM10 (/usa has owned its loader since S10) —
   removal completes that cut and stops a dead `GET /api/insights/tic`
   firing on every /insights visit; `useWorldSectionIndicators` was a
   pure derivation.
3. **copy:audit** — the 4 hardcoded fa strings in GoldPositions.tsx
   moved into the dictionary **byte-identically** (house rule 5):
   four new `pd.gold.positions*` keys × 2 locales, the component wired
   through `t()`. The TM23 `pd.commodities.positionsTitle/
   positionsPurpose` pair (added to the dictionaries but never wired;
   its purpose sentence differs from the rendered one) stays untouched
   and queued for the owner's fa review, with the 6 TM21–TM23
   dictionary keys — all 10 triaged `needs-review` in the manifest
   (the S7/S31 precedent; 1,258 queued). Byte-identity of all 8 moved
   strings verified programmatically.
4. **test suite** — GoldPage.test.tsx's stub now routes `GET
   /api/insights` (the TM13/TM23 snapshot feed) with a contract-valid
   fixture over the same readings (the Converter.test per-test
   stubbed-fetch pattern). The snapshot now RESOLVES in those tests,
   so the Signals section renders — its BalanceScale drawing shares
   the hero's `data-balance-*` attributes, so the S6 classic-view
   test's selectors were scoped to the hero's `[data-balance-classic]`
   container (same assertions, precise target — the ambiguity was
   latent until the stub routed). No production change.
5. **bundle budget** — see BD-BR (the finding below). Documented
   bumps: GoldPage 34/9 → 72/18.5 · WorldMarketsPage 50/11 → 54/13.5 ·
   UsaPage 26/7 → 47/12 · CommoditiesPage 16/5 → 21/6.5; GlobalPage
   held at 36/11 (35.41 measured) with a topology note; the shared tic
   row now measures its 0.70 kB shell (note added).

**The BD-BR finding (the recipe's one surprise):** the M1-blocked
record expected only GoldPage + WorldMarketsPage over budget — but the
lint repair's dead-import removal restructured the chunk graph. The TM
cuts had removed the RENDERs from Insights.tsx while leaving the
IMPORTs, so Signals/tic/PricesBoard/narrative module trees stayed in
shared chunks that /insights visitors downloaded as dead weight. With
the imports gone, the bundler merged each tree into its sole consumer
(see BD-BR for the byte accounting): GoldPage 35.01 → 70.42 (Signals
in), UsaPage 24.99 → 45.41 (the tic drawing in), CommoditiesPage 8.33
→ 20.04 (the PriceTile tree in), GlobalPage 31.83 → 35.41 (narrative
in), the shared Signals/PricesBoard/Together/tic chunks dissolved. Net
effect: every route's download is the same bytes or fewer (one fetch
fewer in several cases), the total bundle SHRANK 3.7 kB, and /insights
visitors stop downloading ~70 kB of dead modules. The extra bumps
re-document the consolidated topology — they are NOT growth.

## TM1–TM4 (2026-11-12 → 11-14) — the treemap rounds, DONE IN CODE, NOT deployed

- The TE-style market heat map on /world-markets: `MarketsTreemap.tsx`
  inside `WorldMarketsBriefing` (TM1, BD-TM1) then TM2 (per-tile country
  labels, green/red ramp, click-to-modal), TM3 (country flag badges),
  TM4 (bigger names + percentages). Squarified two-level layout
  (Bruls et al., zero-dependency pure function, 27-test geometry
  suite); tile size ≈ the ILLUSTRATIVE cap table (labelled demo data,
  BD-TM1 — swap for live caps when a fundamentals endpoint joins the
  ingest); colour ≈ the selected period's return through the SAME
  periodValueOf lens (per-lens clamp ±3 today → ±20 5y); tiles toggle
  the briefing's SHARED detail panel. Spec:
  `docs/specs/world-markets-treemap.md`; screenshots:
  `docs/assets/world-markets-treemap-*-2026-11-12.png`.
- **Deploy-pending behind M1** (the standing approval covers it; ship
  it in the M1 re-run session once its gates are green, then
  live-verify https://currena.ir/world-markets: the treemap card
  renders, EN + FA/RTL, zero console errors).
- Note: the TM2–TM4 growth is what pushed the WM chunk over its TM1
  budget (BD-BR's WM row); the TM1–TM4 verification passes were
  browser-based + web-suite only — the full gates were never run in
  those sessions. **Never again: "gates green" from a tests-only run
  does not exist** (the standing note below).

## Operational notes worth carrying

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson, twice over: the full `pnpm gates` is the only green that
  counts, and the BUDGET gate is part of it (the TM series' drift
  included two budget rows nobody saw).
- **The KV write cap (CONFIRMED):** the account's free-tier daily KV
  quota is 1,000 writes/day account-wide; the REST path exhausts
  ~18:30–19:00 UTC. The fresh post-midnight slice is the right window
  for MANUAL KV seeding (a GHA ingest dispatch, rung2-run, fx-run,
  markets-au-run) when something must land outside the 04:10–04:40
  rungs.
- **The GHA belt-and-braces schedule delay:** GitHub's scheduler queue
  has delayed the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h
  (the runs land 11:22–13:00 UTC) — still inside the fresh KV slice; a
  `workflow_dispatch` runs immediately.
- **The ECB portal posture:** the per-request roulette (~30.2 s HTTP
  504) remains REAL — a failed row is the documented honest shape; the
  45 s patient single attempt absorbs the slow-200s, cards hold
  last-good.
- **The EIA weekly-release schedule note:** EIA weekly petroleum
  releases can slip a day; the heal path is the `rung2-run --eia`
  lever + the next Saturday gate.
- **The observability telemetry query API** (Workers logs) projects
  ZERO rows — do not plan on Worker-log reads; the KV blob + the GHA
  history are the evidence surface.
- **The fresh-card bootstrap is FIXED** (`patchInsightsSnapshot` ADDS
  readings for ids the stored snapshot lacks — pinned by test).
- **The D-9 audit is a standing gate:** `pnpm s24:d9-audit` (18 checks
  incl. the §A ↔ registry pin) — re-run it in any session that touches
  indicators, definitions, placement or §A.
- **The PortWatch runbook note:** never run the §21 data audit's
  portwatch leg Tuesdays 11:00–14:00 UTC (the IMF's maintenance
  window).

## Owner-side levers waiting

1. **Arrange the external investor's review of the spec (§19 — the
   seven questions):** THE top lever; re-opens the investor round
   (→ D-49+ in the strategy log §5 Round 4 → the spec v2 entries, with
   AF-1…AF-8 riding that pass); S23's deferred feedback-build scope
   follows it.
2. **The §19.6 retirement timing answer** (directly, or via the
   investor round): retire the legacy /insights now that the D-9 audit
   is green, or after a burn-in period? Gate 0 of
   `06-LEGACY-RETIREMENT-S24.md` §7 — the execution session runs only
   behind the recorded sign-off. The A/B redirect decision, the
   details-panel port recommendation, and the S31 what/why/you scope
   cut ride the same gate.
3. Ratify the `/converter` relocation (S1's build-session decision).
4. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
5. Ratify or redirect the BD-S3…BD-S31 decision set + **BD-BR** (the
   bundle-budget topology re-documentation — the GoldPage/UsaPage/
   CommoditiesPage rows now carry their sole-consumer module trees by
   design; if the owner prefers the old per-route lean ceilings, a
   manualChunks pass could re-split the shared trees, at the cost of
   re-introducing dead downloads for /insights).
6. Triage the queued unreviewed fa strings (1,258 queued — every
   session's corpus-pinned values are verified byte-for-byte by their
   copy-pin tests; the 10 newest are the TM21–TM23 keys + the moved
   GoldPositions strings).
7. **Revoke or rotate the session credentials** (the GitHub token, the
   Cloudflare tokens, the EODHD key) when the current owner rounds end:
   they were used across the sessions, never stored in the repo, and
   should be retired per `AGENTS.md` §7.

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) covers all 30 program sessions + S31 (row 35).
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8) ·
  pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities 24) ·
  pd-s18 (Currencies 53) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`; the pd-s4
  stateHash arm needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in
  env).
- The S20 data-audit tool is re-runnable: `pnpm --filter @currena/web
  exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts` (mind the
  PortWatch Tuesday window above).
- **The parallel-session rule:** launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot. If a kickoff arrives for a
  slot already delivered, run the counterpart close, never a
  re-execution; if a duplicate is already PUSHED, reconcile onto it.
- The /world-markets page's briefing (S31): the breadth/movers/tiles
  section rides the SAME board feed as the grids (the last-good
  localStorage pattern + the fail-closed ladder); the map's period
  switch is the ONE lens (controlled); the section's words are
  corpus-pinned in both locales.
- The /world-markets treemap (TM1–TM4): tile size ≈ the ILLUSTRATIVE
  cap table (BD-TM1 — labelled demo data in the footer); tile colour ≈
  the period return through the SAME periodValueOf lens with the
  per-lens clamp; the treemap's tiles and the explorer tiles share the
  ONE openId panel state. The squarify routine is a pure function with
  its own 27-test suite — extend those tests, never the drawing, when
  changing the geometry.
- **The bundle topology post-BR:** the TM-era shared chunks (Signals,
  PricesBoard, tic, narrative) are gone — each module tree now rides
  its sole consumer's route chunk (the budget rows say so). The
  modularization phases must keep the route-module BASENAMES unchanged
  (the audit's rule) and should not materially change sizes (moves
  only); the M1 re-run records the post-repair numbers as ITS baseline.

---

## The M1 RE-RUN next-session prompt (the owner's original M1 prompt, verbatim)

> Provenance: the original was issued by the owner in chat (never
> committed); this is it reconstructed verbatim from the repo's own
> records — BD-M1's two direct quotes, the M1-blocked CHANGELOG/HANDOFF
> entries, and the audit's Phase 1 spec it executes. The baseline rule
> and the done-criterion are quoted exactly in BD-M1.

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M1 — modularization Phase 1: the folder skeleton.

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (the §3.1 deviations
D1–D10 are owner-APPROVED — build the skeleton per the corrected
lines) → docs/HANDOFF.md → CHANGELOG [2026-11-15] BASELINE-REPAIR →
docs/DECISIONS.md BD-M1 + BD-BR.

FIRST, before touching anything: run `pnpm gates` once and record the
numbers (the baseline is now GREEN — 9/9, suite 15,298; re-record what
you measure). If the baseline is red, STOP and report — never start a
phase on a red baseline.

The phase (audit §"Phase 1 — the folder skeleton", zero code moves):
- Create the skeleton folders:
  apps/web/src/{features/<10 domains>,shared/{components,config,hooks,
  lib,i18n,ui},features-tools/<9 tools>,infrastructure} and
  packages/insights/src/{domains/<9 domains>,shared/{adapters,prices,
  ingest}} — per the audit's proposed tree (the D1–D10 corrections
  apply).
- One README.md per folder: a single paragraph stating the folder's
  scope (borrow the reason column of the audit's inventory).
- The lint/tsconfig scope pass: eslint.config.mjs globs + the
  per-package tsconfig.json include arrays extended to the new roots
  (audit risk R12) — landing it here makes every later diff clean.
- NO file moves, NO renames, NO route changes, NO dependency changes
  (Phase 2+ does the moving).

After the skeleton commits are pushed and the gates are green: deploy
the parked TM1–TM4 treemap (the standing approval; the re-sequenced
original M1 plan), then live-verify https://currena.ir/world-markets —
the treemap card renders, EN + FA/RTL, zero console errors.

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical; every commit green. Bookkeeping per AGENTS.md §10 (HANDOFF
rewrite + CHANGELOG + DECISIONS) and the M2 pointer (Phase 2 — the
shared layer: ~156 files, ~900 import edges, the exports-map +
gates.mjs + persian-copy SOURCES updates).
```
