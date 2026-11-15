# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M1 (2026-11-15) — BLOCKED BEFORE THE PHASE: the baseline is RED.**
> The M1 session (modularization Phase 1, the folder skeleton) ran its
> mandatory baseline `pnpm gates` FIRST and found origin/main (`45172b3`)
> red in 5 of 9 gates. Per the session's own hard rule ("if the baseline
> is red, STOP and report — never start a phase on a red baseline"):
> NO skeleton was created, NO eslint/tsconfig edit was made, and NOTHING
> was deployed. The only commit this session pushed is docs-only (this
> bookkeeping).
>
> **The one-line cause:** the TM1–TM24 redistribution series
> (2026-11-13 → 11-14, 27 commits, 46 files, +4,426/−601) verified only
> the web vitest suite ("All 13,226 tests pass") and never ran the full
> 9-gate `pnpm gates`, so five gates drifted red unnoticed. Proof: a
> worktree check at `7a7a82ed` (2026-11-12, S31's deploy record — the
> last full-gates-green commit, suite 15,275) runs lint 0 / typecheck 0 /
> web suite 13,203 green with ZERO unhandled errors. Every failure below
> arrived with the TM series.
>
> **The next session is the BASELINE-REPAIR session** — the exact recipe
> is §"The red baseline — the five repairs" in this file. After it lands
> (9/9 green), the M1 skeleton session re-runs verbatim (the owner's M1
> prompt is unchanged and still applies), then M2 (Phase 2 — the shared
> layer: ~156 files, ~900 import edges, the exports-map + gates.mjs +
> persian-copy SOURCES updates).

## Current state (after the M1-blocked session)

- **Program:** modularization — Phase 0 DELIVERED (M0: the audit + the
  plan, `docs/modularization/MODULARIZATION-AUDIT.md`; the §3.1
  deviations D1–D10 owner-APPROVED per the M1 session prompt).
  **Phase 1 NOT STARTED — blocked on the red baseline.**
- **origin/main is RED** — 5 of 9 gates (the table below). The working
  tree is clean; no code was touched by M1.
- **Production is unchanged** — currena-api `502708df` (the S31 build).
  The TM1–TM4 treemap commits remain deploy-pending, now BEHIND the
  baseline repair and the M1 session (a deploy requires green gates per
  AGENTS.md §5 — the original sequencing "deploy after the M1 commits
  are pushed and gates are green" still holds, one session later).

## The red baseline — the record (2026-11-15, HEAD `45172b3`)

`pnpm gates` = **4/9 green, 5 RED** (2m 44s):

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1039 files) |
| 2 | typecheck | **FAIL** | 2 × TS2345 (repair 1) |
| 3 | lint | **FAIL** | 26 × no-unused-vars, 0 warnings (repair 2) |
| 4 | copy:audit | **FAIL** | 10 NEW untriaged fa strings (repair 3) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | **FAIL** | every test PASSES — 15,298 total (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — but web vitest exits 1 on 11 unhandled rejections (repair 4) |
| 9 | build + bundle budget | **FAIL** | GoldPage 35.01/9.14 kB vs 34/9 · WorldMarketsPage 52.83/13.06 vs 50/11 (repair 5) |

**Suite-count note:** the M1 prompt expected ≈15,275 (the S31 record);
HEAD is 15,298 — the TM series added 23 web tests (94 → 95 test files).
The M0 audit's "15,023" was a 3-package count (web+insights+api, missing
core/scraper/markets) — never use it as the target. The repair session
should land at exactly 15,298 unless it adds tests.

## The red baseline — the five repairs (each attributed)

1. **typecheck — 2 sites, same shape.** `homePageOfIndicator(id)`
   returns `PageDivisionPageId | null`; both call sites guard
   `!== undefined` only, then pass the value to `navigate(home)`
   (a `string`). Sites:
   - `apps/web/src/routes/page-division/EconomicLinkagesPage.tsx:59`
     (arrived with TM21/TM22 — `315c107f` / `f7c7ff72`);
   - `apps/web/src/routes/page-division/GlobalPage.tsx:229`
     (the `onFocusEventCard` — arrived with the TM series' calendar
     move, TM11 `539f7adc`; the file was last touched by TM14).
   Fix: guard the null too — `if (home) navigate(home)` is safe (the
   PageId union has no empty string), or `if (home !== null)`. Grep all
   `homePageOfIndicator` call sites and align the guards.
2. **lint — 26 dead unused vars, all left by the TM section cuts**
   (mechanical removal, nothing behavioral):
   `routes/Insights.tsx` ×20 (the cut sections' imports — AboutTheData,
   HeroBlock, TopMoversStrip, PricesBoard, Signals, Together,
   WorldCurrencies, TicSection, TicCustodyCard, DollarStrengthCards —
   plus 10 orphaned locals incl. togetherToken/signalsToken/aboutToken,
   marketsAlert/fxAlert/ticState, sectionIndicators, jumpToSection,
   custodyReading, dailyPeers) ·
   `components/insights/hero-editorial.test.tsx` ×1 (`withRbaStale`) ·
   `routes/insights-sections/SectionLane.tsx` ×1 (`ticSlot` arg) ·
   `routes/page-division/CommoditiesTierCards.tsx` ×3
   (CARD_NAME_KEY / POSITION_WORD_KEY / STATUS_KEY) ·
   `routes/page-division/GoldPositions.tsx` ×1 (`t`).
3. **copy:audit — 10 NEW untriaged fa strings:** `nav.economicLinkages`
   + `pd.economicLinkages.{title,purpose,loading}` (TM21/TM22) ·
   `pd.commodities.{positionsTitle,positionsPurpose}` (TM23) · 4
   HARDCODED fa strings inside `GoldPositions.tsx:24,28,36,37` (TM23 —
   house rule 5: every UI string goes through the i18n dictionary; move
   them to `fa.ts` keys first). Then triage the manifest:
   `pnpm copy:audit:update` per
   `docs/localization/persian-copy-workflow.md` and review the diff.
4. **test suite — 11 unhandled rejections, all from
   `GoldPage.test.tsx`:** TM13/TM23 grew GoldPage to also fire
   `fetchInsightsSnapshot()` (`GET /api/insights`, GoldPage.tsx:62) but
   the test's `stubFeeds` router only routes
   `/api/insights/pages/gold` — every other URL 404s and the ApiError
   (`unknown_page`) escapes as an unhandled rejection (vitest exits 1
   even though all 13,226 tests pass). Fix: route that feed in the stub
   (or explicitly reject + catch), the Converter.test per-test stubbed
   fetch pattern.
5. **bundle budget — two rows over:** GoldPage chunk 35.01/9.14 vs the
   34/9 ceiling (TM13 Signals + TM23 GoldPositions grew it) and
   WorldMarketsPage 52.83/13.06 vs 50/11 (TM1 bumped 40/9 → 50/11
   measuring 46.41/10.78, then TM2–TM4's labels/flags/modal grew it
   again without a second bump). House rule: "budgets are the documented
   numbers — bump with a changelog note, never silently." Decide per
   row: a documented bump in `scripts/check-bundle-budget.mjs` + a
   CHANGELOG note (the TM1 precedent), or slim the chunk. Default to
   the documented bump if unsure; flag it for the owner either way.

### The repair session's done-criteria

- `pnpm gates` 9/9 green at HEAD; suite exactly 15,298 (or the new
  count justified in the commit body).
- Commit shape: one repair commit (or a short series, each green)
  `baseline-repair: restore the 9-gate green baseline (the TM-series
  drift)` + the bookkeeping commit — then push.
- Constraints carried: no file renames, no moves, no route changes, no
  dependency changes, no deploy (still pre-skeleton; the modularization
  constraints apply).
- Then STOP. The M1 skeleton session re-runs verbatim afterwards (the
  owner's M1 prompt is unchanged; its expected baseline will then be
  green — re-record the numbers).

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
- **Deploy-pending behind the repair + M1** (the standing approval
  covers it; ship it in the M1 session once gates are green, then
  live-verify https://currena.ir/world-markets: the treemap card
  renders, EN + FA/RTL, zero console errors).
- Note: the TM2–TM4 growth is what pushed the WM chunk over its TM1
  budget (repair 5); the TM1–TM4 verification passes were browser-based
  + web-suite only — the full gates were never run in those sessions.

## Operational notes worth carrying

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
- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (this session's finding): the full `pnpm gates` is the only
  green that counts.

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
5. Ratify or redirect the BD-S3…BD-S31 decision set (all recorded,
   none blocking).
6. Triage the queued unreviewed fa strings (1,248 queued — every
   session's corpus-pinned values are verified byte-for-byte by their
   copy-pin tests).
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
  slot — one prompt = one session = one slot. If a kickoff arrives for
  a slot already delivered, run the counterpart close, never a
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
