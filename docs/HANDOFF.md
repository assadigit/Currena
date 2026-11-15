# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M1 (2026-11-15) — DELIVERED: the modularization Phase 1 folder
> skeleton is built, committed and pushed, gates 9/9 with the suite
> EXACTLY 15,298 (identical to the recorded baseline).** Zero code
> moves, zero renames, zero route/dependency changes — 44 folders +
> 44 one-paragraph scope READMEs (the audit's proposed tree, the
> owner-approved D1–D10 corrections applied) + the R12 lint/tsconfig
> scope pass landed as a probe-verified record (see BD-M1-r). Commits:
> `c5726ace` (the skeleton) + `84084058` (the scope pass), both green,
> pushed to origin/main.
>
> **The deploy half of the session did NOT go per the records — two
> findings (BD-M1-r D4/D5):**
>
> 1. **The TM1–TM4 treemap is ALREADY LIVE on production.** The live
>    verify the M1 prompt asked for (the treemap card renders, EN +
>    FA/RTL, zero console errors) was executed against
>    https://currena.ir/world-markets and passed on every leg (16
>    tiles, click-to-panel, 390 px mobile, zero console errors;
>    screenshots `docs/assets/world-markets-treemap-live-*-2026-11-15.png`).
>    Production's build is the TM-era bundle (entry `index-CDhxMjxO.js`
>    referencing the SHARED `PricesBoard-*`/`Signals-*` chunks the
>    BASELINE-REPAIR dissolved) — i.e. the treemap was deployed at some
>    point WITHOUT any record in the repo, and the standing
>    "deploy-pending" claim in these records was stale. What production
>    does NOT have: the BR's dead-import cleanup (/insights visitors
>    still download ~70 kB of dead modules; the current build is
>    3.7 kB smaller overall) and everything since.
> 2. **The session's Cloudflare credentials are the WRONG account's.**
>    The account in the kickoff (the SportSignal Cloudflare account) holds only the `sportsignal.ir` zone and the
>    `ucl-notifier` + `uefa-image-relay` workers — no `currena-api`, no
>    currena.ir zone (the Currena production rides the sedanama-ir
>    account per DEPLOY.md). The GitHub token IS Currena's. No deploy
>    was attempted; production is untouched by this session.
>
> **The NEXT session is M2** — modularization Phase 2 (the shared
> layer, ~156 files, ~900 import edges), prompt at the bottom of this
> file. If the owner supplies the Currena deploy token with that
> kickoff, M2 should FIRST push the current green build (the
> skeleton-phase tree) so production catches up to the BR fixes, then
> run its own phase.

## Current state (after the M1 session)

- **Program:** modularization — Phase 0 DELIVERED (M0), **Phase 1
  DELIVERED (M1: the skeleton, this session)**. Phase 2 NOT STARTED.
- **origin/main is GREEN** — 9/9 gates at `84084058` (the table below),
  suite 15,298, working tree clean after the bookkeeping commit.
- **Production is UNCHANGED by this session** — the TM-era build (see
  the finding above): the treemap serves fine, but the BR bundle
  improvements + M1 are not live yet. Updating production needs the
  Currena account's deploy token (owner lever #1 below).

## The green baseline — the M1 close record (2026-11-15)

`pnpm gates` = **9/9 GREEN** (2m 40s), run on the pushed tree AND
identical at baseline, skeleton and close (three full runs this
session):

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1083 files — the 44 new READMEs tracked + scanned) |
| 2 | typecheck | PASS | 6 packages |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — identical at every run |
| 9 | build + bundle budget | PASS | entry 273.96/82.96 · GoldPage 70.42/17.95 · WM 52.83/13.05 · UsaPage 45.41/11.14 (the BD-BR rows, unchanged) |

## The M1 session record (what was done)

1. **Baseline first, per the prompt's hard rule:** `pnpm gates` run
   before touching anything — 9/9, suite 15,298, numbers matching the
   BASELINE-REPAIR record exactly. Green → the phase proceeded.
2. **The skeleton (commit `c5726ace`):** the audit's proposed tree
   with the D1–D10 corrections — web
   `features/{gold, commodities, usa, europe, asia-pacific, australia,
   currencies, world-markets, economic-linkages, global,
   insights-legacy}` + `shared/{components,config,hooks,lib,i18n,ui}` +
   `features-tools/{converter, settle, receipt, live-rates, calculator,
   history, about, splitter, batch}` + `infrastructure/`; engine
   `domains/{gold, commodities, usa, europe, asia-pacific, australia,
   currencies, world-markets, companies}` +
   `shared/{adapters,prices,ingest}`. One README per folder (the 39
   leaves + the 5 parent roots = 44), each a single scope paragraph
   borrowed from the audit's inventory reason column with the
   D-correction boundaries noted where they apply.
3. **The scope pass (commit `84084058`, audit risk R12):** R12's
   premise did NOT hold against the live configs — the eslint globs
   (`apps/web/src/**/*.{ts,tsx}`, `packages/*/src/**/*.ts`) and the
   per-package `tsconfig` `include: ["src"]` are recursive and already
   cover every new root. Proven by probe, not assumption:
   violation-bearing `__scope_probe__.ts` files in six representative
   new roots produced exactly 6 lint errors (all six seen) and all six
   appeared in `tsc --listFiles`. Probes removed; the verified
   coverage documented in `eslint.config.mjs` so the recursive
   patterns are known load-bearing. tsconfigs untouched (recorded in
   BD-M1-r D2).
4. **The treemap deploy + live verify (the session's second half):**
   blocked on credentials + the production finding above. The
   live-verify passed against production as-is; the deploy of the
   CURRENT build waits on the Currena token. The local dist (the
   exact tree that would deploy) was also browser-verified first:
   treemap card EN + FA/RTL + click-to-panel + zero console errors
   (`docs/assets/world-markets-treemap-m1-local-*-2026-11-15.png`).

## TM1–TM4 (2026-11-12 → 11-14) — LIVE ON PRODUCTION (the M1 finding)

- The TE-style market heat map on /world-markets: `MarketsTreemap.tsx`
  inside `WorldMarketsBriefing` (TM1, BD-TM1) + TM2 (per-tile country
  labels, green/red ramp, click-to-modal), TM3 (country flag badges),
  TM4 (bigger names + percentages). Spec:
  `docs/specs/world-markets-treemap.md`.
- **LIVE-VERIFIED by M1 (2026-11-15):** the card renders on
  https://currena.ir/world-markets in EN + FA/RTL + 390 px mobile,
  the tiles toggle the shared detail panel, zero console errors on
  every leg. The M1 prompt's live-verify criterion is MET.
- **The deploy history is unrecorded:** production serves the treemap
  from a TM-era bundle (the shared-chunk topology the BR dissolved).
  None of the TM-series, M1-blocked or BR records mention deploying
  it. Treat the older "deploy-pending" claims as superseded; do not
  "re-deploy the treemap" — the next deploy is a normal full build
  (which includes it) once the token arrives.
- **What production is missing vs origin/main:** the BR bundle
  cleanup (dead-import removal — /insights visitors stop downloading
  ~70 kB of dead module trees; every route same-or-fewer bytes; total
  −3.7 kB) and M1 (no runtime change). One `wrangler deploy` from the
  current tree closes the gap.

## Operational notes worth carrying

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (the standing note; still true).
- **Verify the LIVE production build identity, not the records:**
  fetch the live `index.html` + entry chunk and compare the chunk
  hashes against the local build before claiming what is or is not
  deployed (the M1 lesson: two sessions' records said "deploy-pending"
  while the feature was live). A shared `Signals-*.js`/`PricesBoard-*`
  chunk in the live asset list = pre-BR bundle; their absence = post-BR.
- **The credentials block in a kickoff can belong to another
  project.** Check the account's workers + zones against the repo's
  DEPLOY.md topology before attempting any deploy (M1: the SportSignal
  block — sportsignal.ir + ucl-notifier + uefa-image-relay — arrived
  in the Currena session).
- **The KV write cap (CONFIRMED):** the account's free-tier daily KV
  quota is 1,000 writes/day account-wide; the REST path exhausts
  ~18:30–19:00 UTC. The fresh post-midnight slice is the right window
  for MANUAL KV seeding when something must land outside the
  04:10–04:40 rungs.
- **The GHA belt-and-braces schedule delay:** GitHub's scheduler queue
  can delay the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h; a
  `workflow_dispatch` runs immediately.
- **The ECB portal posture:** the per-request roulette (~30.2 s HTTP
  504) remains REAL — a failed row is the documented honest shape; the
  45 s patient single attempt absorbs the slow-200s.
- **The EIA weekly-release schedule note:** EIA weekly releases can
  slip a day; the heal path is the `rung2-run --eia` lever + the next
  Saturday gate.
- **The observability telemetry query API** (Workers logs) projects
  ZERO rows — the KV blob + the GHA history are the evidence surface.
- **The fresh-card bootstrap is FIXED** (`patchInsightsSnapshot` ADDS
  readings for ids the stored snapshot lacks — pinned by test).
- **The D-9 audit is a standing gate:** `pnpm s24:d9-audit` (18 checks
  incl. the §A ↔ registry pin) — re-run it in any session that touches
  indicators, definitions, placement or §A.
- **The PortWatch runbook note:** never run the §21 data audit's
  portwatch leg Tuesdays 11:00–14:00 UTC (the IMF's maintenance
  window).

## Owner-side levers waiting

1. **Send the Currena Cloudflare deploy token** (the sedanama-ir
   account — the one hosting `currena-api` + the currena.ir zone; an
   API token with Workers Scripts edit + Workers KV edit scopes, plus
   the account id if it differs from the kickoff's). With it, the next
   session pushes the current green build so production picks up the
   BR cleanup. Without it, production keeps serving the TM-era bundle
   (the treemap works; only the /insights dead-weight optimization
   waits).
2. **Arrange the external investor's review of the spec (§19 — the
   seven questions):** re-opens the investor round; S23's deferred
   feedback-build scope follows it.
3. **The §19.6 retirement timing answer** (retire the legacy /insights
   now or after a burn-in period) — Gate 0 of
   `06-LEGACY-RETIREMENT-S24.md` §7.
4. Ratify the `/converter` relocation (S1's build-session decision).
5. Ratify AF-3: `michigan-1y-expectations` → USA tier-3.
6. Ratify or redirect the BD-S3…BD-S31 decision set + **BD-BR** (the
   bundle-budget topology re-documentation) + **BD-M1-r** (this
   session's records: the 44-README skeleton, the probe-verified scope
   pass, the treemap-already-live finding).
7. Triage the queued unreviewed fa strings (1,258 queued — every
   session's corpus-pinned values are verified byte-for-byte by their
   copy-pin tests).
8. **Revoke or rotate the session credentials** (the GitHub token
   worked; the Cloudflare block belonged to SportSignal — rotate both
   projects' tokens per their own schedules) when the current owner
   rounds end: they were used, never stored in the repo.

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8) ·
  pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities 24) ·
  pd-s18 (Currencies 53) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`).
- **The parallel-session rule:** launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The /world-markets treemap (TM1–TM4): LIVE** (see the section
  above). Tile size ≈ the ILLUSTRATIVE cap table (BD-TM1 — labelled
  demo data in the footer); tile colour ≈ the period return through
  the SAME periodValueOf lens with the per-lens clamp; the treemap's
  tiles and the explorer tiles share the ONE openId panel state; the
  squarify routine is a pure function with its own 27-test suite.
- **The bundle topology post-BR (origin/main):** the TM-era shared
  chunks (Signals, PricesBoard, tic, narrative) are gone — each module
  tree rides its sole consumer's route chunk. Production still serves
  the TM-era topology until the next deploy. The modularization phases
  keep the route-module BASENAMES unchanged (the audit's rule); the M1
  skeleton adds zero runtime code, so the post-M1 build is
  byte-identical to the post-BR build.
- **The M1 skeleton on disk:** 44 folders + READMEs, all empty of
  code. Phase 2+ moves files in; the per-folder READMEs state each
  folder's scope and the D-correction boundaries. The audit is the
  file-by-file authority (`docs/modularization/MODULARIZATION-AUDIT.md`)
  — where its proposed tree and its inventory disagree (one case:
  MarketsChart — tree says shared/components, inventory + importer
  census say features/world-markets), the INVENTORY wins (BD-M1-r D3).

---

## The M2 next-session prompt (modularization Phase 2 — the shared layer)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M2 — modularization Phase 2: the shared layer (the heaviest phase).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 2 — move the shared
layer" + Deliverable 1's shared rows + risks R7/R8/R9) → docs/HANDOFF.md →
CHANGELOG [2026-11-15] M1 → docs/DECISIONS.md BD-M1-r.

FIRST, before touching anything: run `pnpm gates` once and record the
numbers (the M1 close: 9/9, suite 15,298). If the baseline is red,
STOP and report — never start a phase on a red baseline.

IF the owner's kickoff includes the Currena Cloudflare deploy token
(the sedanama-ir account, Workers Scripts edit + KV edit): BEFORE the
phase, push the current green build to production (pnpm --filter
@currena/web build && pnpm --filter @currena/api exec wrangler deploy —
the deploy-lock check first per docs/DEPLOY.md), then live-verify
https://currena.ir (the /insights chunk topology is the post-BR shape:
no shared Signals/PricesBoard chunks) and record the worker version.
If no token: skip this paragraph, note it in the handoff.

The phase (audit §"Phase 2 — move the shared layer", ~156 files,
~900 import edges, ONE short series of green commits):
- Move the web shared layer (~81 files) into apps/web/src/shared/*
  per the audit's inventory "shared" rows (components, config, hooks,
  lib, i18n, ui) and the engine shared layer (~75 files) into
  packages/insights/src/shared/{adapters,prices,ingest} + the shared
  root modules (definitions, gauges, gold-score, connections, scoring,
  freshness, validation, validation-step3, sources, licences, parsers,
  series, store, ruleVersion).
- The exports-map targets update in the SAME commit (./ingest,
  ./prices, ./store, ./validation, ./adapters — entry NAMES unchanged;
  packages/insights/package.json).
- The path-referencing machinery, same commit: scripts/gates.mjs
  layer1 path; the persian-copy SOURCES (scripts/lib/persian-copy.mjs)
  + the manifest re-triage via pnpm copy:audit:update (expect
  REMOVED+NEW pairs for moved files — review the diff, never silently
  absorb); the narrator-vocabulary generator + selfcheck.ts + ingest.ts
  web-i18n imports; generate-indicators-registry.ts, generate-
  placement-table.ts, s24-d9-audit.ts, local-seed-fixtures.ts imports;
  the depth-sensitive data/*.json imports re-counted per moved file
  (risk R8 — mechanical path.relative, never hand-counted).
- The import rewrites via codemod anchored to full import statements,
  the importer lists from the audit's graph as the source of truth.
- NO renames anywhere (the bundle-budget gate matches route-module
  basenames). Tests move WITH their subjects.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate (regenerated docs reviewed — drift recorded, never
silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green; the exports map + all path
references updated in the same commits as their moves. Bookkeeping
per AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS) and the
M3 pointer (Phase 3.1 — usa: ~34 files, the ./tic exports entry, the
pd-s4/s9 script imports).
```
