# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **TM1 (2026-11-12, after S31) — the TREEMAP round: the TE-style
> market heat map on /world-markets (BD-TM1).** The owner's spec: a
> tradingeconomics-style treemap for the 16 world indices — tile size
> ≈ market cap, colour ≈ the selected period's return, integrated with
> the page's existing period selector and detail panels.
>
> **What shipped:** `MarketsTreemap.tsx` (the new card inside
> `WorldMarketsBriefing`, between the movers row and the regional tile
> explorer): a two-level squarified treemap (a zero-dependency local
> pure function — Bruls et al.; regions by summed cap, leaves under a
> 20px header band; TE's proportions: Americas ≈ 72% · Asia-Pacific ≈
> 20% · Europe ≈ 8%), the 16 tiles coloured through the SAME
> periodValueOf lens the breadth/movers/tiles read (per-lens clamp ±3
> today → ±20 on 5y; a missing lens keeps the neutral gray + the
> honest dash), white bold labels with the TE text-shadow anatomy
> (hidden under 44×40 — the native tooltip remains), tiles as real
> buttons that toggle the briefing's SHARED detail panel (one open at
> a time; the amber ring; Enter/Space; aria-expanded/aria-controls).
> The cap table is ILLUSTRATIVE DEMO DATA, labelled in the footer
> (BD-TM1: no cap field in the stored contract; revisit when a
> fundamentals endpoint joins the ingest). 7 new
> `pd.worldMarkets.treemap.*` keys × 2 locales; the 7 fa strings
> queued in the Persian copy manifest (7,996 entries; audit clean).
> The WM chunk budget bumped 40/9 → 50/11 kB (measured 46.41/10.78).
>
> **The verification:** 27 new unit tests (squarify geometry:
> coverage/containment/no-overlap/determinism; region proportions;
> per-lens clamp; label rules; cap ordering) + the web suite 13,230
> green + lint 0 + typecheck 0 + the browser pass over the built dist
> + live feeds (EN + FA/RTL + 390px mobile): all 16 tiles labelled,
> tooltip/aria per spec, click → shared panel + smooth scroll, the
> period switch recolouring all 16 tiles with the legend re-clamping
> ±3% → ±5%, mobile pans horizontally inside the card with no body
> overflow, zero console errors.
>
> **NOT yet deployed** — the commit/push of this round precedes the
> deploy (the standing approval covers it; the next session either
> deploys or the deploy follows in this one, see the session record).
> Production is still the S31 build (`502708df…`, the briefing live
> without the treemap).

## Current state (after the TM1 treemap round)

- **Program:** page-division — **all 30 sessions delivered (Session
  30/30 · 0 remaining); the program stays complete.** The first
  post-program owner round (S31, the World Markets briefing) is
  DELIVERED + DEPLOYED (BD-S31); the SECOND owner round (TM1, the
  treemap) is DONE IN CODE, pushed, NOT yet deployed (BD-TM1).
- **The TM1 code state (this round):** the treemap card lives in
  `WorldMarketsBriefing.tsx` between the movers and the regional
  explorer; `MarketsTreemap.tsx` + its 27-test suite are new; the
  dictionaries, index.css hover pair, the copy manifest (7 queued fa
  strings) and the WM budget row (40/9 → 50/11, measured 46.41/10.78)
  carry the round. The spec: `docs/specs/world-markets-treemap.md`.
  Screenshots: `docs/assets/world-markets-treemap-*-2026-11-12.png`.
  **The next deploy ships it** (the standing approval covers the
  deploy; verify https://currena.ir/world-markets shows the heat map
  card after it).
- **DEPLOYED LIVE:** currena-api — the S31 deploy, version
  `502708df-08db-430f-86d5-a141a73c85d4` (the rebuilt SPA assets
  riding the API worker; the worker code itself unchanged since the
  S25 fix) + currena-markets `8f63c8fa` (untouched). **The live
  verify (https://currena.ir/world-markets, post-deploy):** the
  briefing renders over the live feeds — the breadth "today
  performance · Indices up 7 · Indices down 0 · Flat 9 · A move
  within ±1% reads as flat", the movers TAIEX +3.6% (Correction
  −11.2%) / Hang Seng −1.0% (Correction −13.1%), all 16 tiles, the
  Hang Seng detail panel expanding with the 52-week chart (Nov 2025 →
  Nov 2026) + the levels — zero console errors, and the standing
  pd-s7 live backtest re-run against production: **ALL CHECKS GREEN —
  57 checks · 57 green · 0 red.** After the TM1 round: production is
  the S31 build — HEAD carries the treemap commit(s) ahead of it
  (deploy pending).
- **The ecb posture (BD-S29, carried):** the served blob shows
  failedSources EMPTY — all three ecb rows green. The BD-S25
  maintenance item stays CLOSED; the per-request ECB roulette remains
  REAL (a failed row on any rung is the documented RISK_REGISTER
  honest shape: the cards hold last-good, the next rung retries).
- **The EIA trio posture (BD-S29, carried — self-healing at the
  Saturday 11-14 gate):** the provider's own release delay left the
  trio honestly [stale]-marked (values unchanged and EXACT); the
  11/12 release covers the week ending 11/06 — the Saturday 11-14
  rung-2 gate lands it → the trio returns to fresh/context at age ~8.
- **The S31 surfaces (what changed where):** BD-S31 (DECISIONS) · the
  CHANGELOG S31 entry · the roadmap's "Owner rounds (post-program)"
  section (the S31 delivery record + the progress-board row + the
  current-position note) · the strategy-log §8 row 35 · this file ·
  the code: apps/web (WorldMarketsBriefing.tsx + WorldMarketsPage.tsx
  + WorldMarketsHero.tsx + MarketsChart.tsx [the copy-contract
  narrowing] + the two dictionaries + the pin test + the page
  characterization suite) + scripts/check-bundle-budget.mjs (the WM
  chunk bump) + docs/localization/persian-copy-manifest.json (the 24
  queued fa strings).
- **The S31 gates:** the full `pnpm gates` 9/9 (suite 15,275 — web
  13,203, +5 new arms; secret scan 8 patterns/1027 files clean;
  budgets held, entry 272.91/82.56, the WM chunk 38.25/8.30 under the
  new 40/9 ceiling).

## The program is finished — what a future session looks like

The 30-session roadmap stays complete (30/30 · 0 remaining). The S31
round shows the post-program shape: the owner's direct requests run
as owner rounds, recorded per the standing session protocol (DECISIONS
+ CHANGELOG + the roadmap's owner-rounds section + the strategy-log §8
+ this file). Any future session starts the same way every session
does — read `AGENTS.md` first, then this file, then the roadmap's
progress board + current-position note. The standing branches for
whichever lever arrives:

- **If the owner supplies the investor's §19 answers:** run the
  INVESTOR ROUND (collect → D-49+ in the strategy log §5 Round 4 →
  the spec v2 entries — the AF-1…AF-8 findings ride that pass, never
  silent edits); S23's deferred feedback-build scope follows it. The
  §19.6 answer also opens (or delays) the retirement execution —
  record it as Gate 0 in DECISIONS.md and schedule the execution per
  the checklist's §7.
- **If the owner supplies the §19.6 sign-off (directly):** the
  retirement execution may run per `06-LEGACY-RETIREMENT-S24.md` §7
  (the checklist) — ONLY behind the recorded sign-off. The S31 scope
  cut joins that gate: decide then whether the what/why/you editorial
  lines join the standalone /world-markets detail panel (BD-S31).
- **If a kickoff arrives for a slot already delivered:** run the
  counterpart close, never a re-execution; if a duplicate is already
  pushed, reconcile onto it.
- **Routine observations need no session:** the standing schedule owns
  them (the 04:10–04:40 Worker rungs; the Saturday rung-2 gates; the
  :13/:50 hourly rungs). No decisions pending; only the recorded
  RISK_REGISTER escalation shapes (a multi-week EIA stall past
  ~2026-11-28; a persistent multi-day ecb stale-past-maxAge) would
  re-open a question.

### Operational notes worth carrying

- **The KV write cap (the fresh post-midnight slice, CONFIRMED):** the
  account's free-tier daily KV quota is 1,000 writes/day
  account-wide; the REST path exhausts ~18:30–19:00 UTC. The fresh
  post-midnight slice is the right window for MANUAL KV seeding (a
  GHA ingest dispatch, rung2-run, fx-run, markets-au-run) when
  something must land outside the 04:10–04:40 rungs; a post-~18:30
  dispatch just costs one refused run (the designed no-update branch).
- **The GHA belt-and-braces schedule delay:** GitHub's scheduler queue
  has delayed the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h
  (the runs land 11:22–13:00 UTC) — still inside the fresh KV slice;
  the Worker's own 04:10–04:40 rungs run on time and remain the
  primary venue. A `workflow_dispatch` runs immediately.
- **The ECB portal posture (post-CLOSE):** the provider-side roulette
  (the gateway's ~30.2 s HTTP 504, per-request) remains REAL — a
  failed row (timeout OR 504) on any ecb leg is an expected honest
  shape on bad windows; the 45 s patient single attempt absorbs the
  slow-200s and the cards hold last-good meanwhile.
- **The EIA weekly-release schedule note (BD-S29):** the EIA's weekly
  petroleum releases can slip a day (11/11 → 11/12 observed); the
  designed heal path: the `rung2-run --eia` lever re-marks staleness;
  the next Saturday gate lands the slipped release.
- **The observability telemetry query API** (the Workers logs): answers
  success but projects ZERO rows for the query shapes tried in S27 —
  do not plan on Worker-log reads; the KV blob + the GHA history are
  the evidence surface.
- **The fresh-card bootstrap is FIXED** (`patchInsightsSnapshot` ADDS
  readings for ids the stored snapshot lacks — the regression test
  pins it).
- **The D-9 audit is a standing gate:** `pnpm s24:d9-audit` (18 checks
  incl. the §A ↔ registry pin) — re-run it in any session that touches
  indicators, definitions, placement or §A; it exits non-zero on drift.
- **The PortWatch runbook note (BD-S21e):** never run the §21 data
  audit's portwatch leg Tuesdays 11:00–14:00 UTC (the IMF's scheduled
  maintenance window).

## Owner-side levers waiting

1. **Arrange the external investor's review of the spec (§19 — the
   seven questions): Phase K's remaining input and THE top lever.** The
   investor round re-opens at the next free slot the moment the answers
   exist (→ D-49+ in the strategy log §5 Round 4 → the spec v2 entries,
   with AF-1…AF-8 riding that pass); S23's deferred feedback-build
   scope follows it.
2. **The §19.6 retirement timing answer** (directly, or via the
   investor round): retire the legacy /insights now that the D-9 audit
   is green, or after a burn-in period of parallel running? Gate 0 of
   `06-LEGACY-RETIREMENT-S24.md` §7 — the execution session runs only
   behind the recorded sign-off. The A/B redirect decision (the
   card-aware option B recommended), the details-panel port
   recommendation, and the S31 what/why/you scope cut ride the same
   gate.
3. Ratify the `/converter` relocation (S1's build-session decision).
4. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
5. Ratify or redirect the BD-S3…BD-S31 decision set (the latest:
   **BD-S31** — the World Markets briefing restoration: the
   corpus-pinned port, the lean detail panel, the ONE controlled lens,
   the 40/9 budget bump; all recorded, none blocking).
6. Triage the queued unreviewed fa strings (every session's
   corpus-pinned values are verified byte-for-byte by their copy-pin
   tests — S31 queued 24 more, 23/24 corpus-pinned).
7. **Revoke or rotate the session credentials** (the GitHub token, the
   Cloudflare tokens, the EODHD key) when the current owner rounds
   end: they were used across the sessions, never stored in the repo,
   and should be retired per `AGENTS.md` §7.

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) covers all 30 program sessions (row 34) + the
  first post-program owner round (row 35, S31).
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57 — the count scales with
  the served board's present readings) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8) ·
  pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities 24) ·
  pd-s18 (Currencies 53 incl. the rules + board gates) — all
  re-runnable against production from apps/web/scripts/ (pass
  `--base https://currena.ir`; the pd-s4 stateHash arm needs
  CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in env).
- The S20 data-audit tool is re-runnable: `pnpm --filter @currena/web
  exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts` (mind the
  PortWatch Tuesday window above).
- **The parallel-session rule (hardened through BD-S18-parallel-3,
  BD-S21-parallel, BD-S23-parallel, and the S27 interruption):**
  launch exactly ONE session per roadmap slot — one prompt = one
  session = one slot. If a kickoff arrives for a slot already delivered
  (origin/main carries its records), run the counterpart close, never a
  re-execution; if a duplicate is already PUSHED, reconcile onto it (the
  pushed implementation governs), archive the local duplicate,
  independently re-verify, and finish the slot's remaining milestones.
  The S27 shape (an interrupted session continued to completion, its
  earlier commits kept, nothing duplicated) is the worked precedent.
- **The /world-markets page's briefing (S31):** the breadth/movers/
  tiles section rides the SAME board feed as the grids (the last-good
  localStorage pattern + the fail-closed ladder) — a provider outage
  never reaches the page. The map's period switch is the ONE lens
  (controlled); the tiles expand one detail panel at a time; the
  section's words are corpus-pinned in both locales.
- **The /world-markets treemap (TM1):** tile size ≈ the ILLUSTRATIVE
  cap table (BD-TM1 — labelled demo data in the footer; swap for live
  caps when a fundamentals endpoint joins the ingest); tile colour ≈
  the period return through the SAME periodValueOf lens with the
  per-lens clamp (±3 today → ±20 5y); the treemap's tiles and the
  explorer tiles share the ONE openId panel state. The squarify
  routine is a pure function with its own 27-test suite — extend
  those tests, never the drawing, when changing the geometry.
