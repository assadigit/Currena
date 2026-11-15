# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M4 (2026-11-15) — DELIVERED: modularization Phase 3.2 (world-markets,
> the second domain move) is done — 40 files moved (32 web FLAT into
> `apps/web/src/features/world-markets/` + 8 engine into
> `packages/insights/src/domains/world-markets/markets/`), 132 import
> specifiers re-anchored by codemod + 8 computed-depth manual edits, gates
> 9/9 with the suite EXACTLY 15,298, ONE green move commit pushed
> (`e0734851`); production deployed post-phase (`c25f783b` @ 100%) and
> live-verified — the entry chunk `index-DOan26Zs.js` is byte-identical
> local-vs-live AND byte-identical to the M3 close (sha256 `58c55289…`),
> the WorldMarketsPage chunk byte-identical local-vs-live — the second
> domain folder is real with ZERO runtime delta. PREREQUISITE CHORE
> `99ba8c38`: the M3 bookkeeping slip (`m3-live-verify.cjs` landed after
> the M3 gates runs → origin/main lint red) fixed first.**

> **The NEXT session is M5** — modularization Phase 3.3
> (australia: 14 web files + engine `markets-au/` (8) + 3 adapters),
> prompt at the bottom of this file.

## Current state (after the M4 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · **Phase 3.2 (M4: the world-markets domain, this session)**
  all DELIVERED. Phase 3 continues biggest-first: australia (M5) is next.
- **origin/main is GREEN** — 9/9 gates at `e0734851`, suite 15,298,
  working tree clean.
- **Production is CURRENT** — currena-api `c25f783b` @ 100% (deployed
  2026-11-15T17:31Z), the exact origin/main deployed surface; the entry
  + WorldMarketsPage chunks byte-identical local-vs-live (sha256
  verified), and the entry chunk is byte-identical to the M3 close
  (`index-DOan26Zs.js` / `58c55289…`) — the move is pure file-system
  reorganization, zero runtime delta.

## The green baseline — the M4 close record (2026-11-15)

Baseline (the restored green state, after the M3-slip chore `99ba8c38`)
and final (after the move `e0734851`) runs of `pnpm gates` — **identical
numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1086 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean (the 1 manifest re-key landed) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) |
| 9 | build + bundle budget | PASS | entry 273.96/82.96 · all 12 route rows match the baseline shapes |

**Environment note (unchanged from M3):** this sandbox's `skills/` folder
sits at `/home/z/my-project/skills` (the PARENT of the Currena repo, NOT
inside it) — so the M3-era lint-gate noise (479 errors inside `skills/`)
does NOT apply this session; the Currena eslint config scopes to the
repo root downward and the parent `skills/` is never scanned. No parking
needed. (If a future sandbox injects `skills/` INSIDE the Currena repo
root, park it outside during gates runs per BD-M3 D4; never commit it.)

## The M4 session record (what was done)

1. **Baseline first:** `pnpm gates` — **8/9, lint RED**. The diagnosis:
   `scripts/m3-live-verify.cjs` (5 node-globals lint errors) was
   committed in the M3 BOOKKEEPING commit `7447a3e7`, which landed AFTER
   both M3 gates runs (both ran on `d200d537` the move commit, before
   the file existed) — so origin/main's lint gate was red entering M4.
   The suite was EXACTLY 15,298 + layer1 11,969/11,969 + build green —
   zero phase breakage, just the slip.
2. **The prerequisite chore (commit `99ba8c38`):** a minimal file-level
   `/* eslint-disable no-undef, @typescript-eslint/no-require-imports */`
   on the one CommonJS node script (the repo's eslint config grants
   `globals.node` to `scripts/**/*.mjs` but not `*.cjs`; the file-level
   disable is isolated, no eslint scope change — the M1 R12
   probe-verified state stays as-is). Re-ran gates → **9/9 GREEN
   baseline** (suite 15,298, 2m 41s) — the true M4 starting state.
   Pushed `99ba8c38`.
3. **Deploy-lock check (the sedanama-ir account verified: currena-api
   + currena-markets + the currena.ir zone):** production at
   `30d1d7f6` @ 100% (the M3 close, most recent). origin/main was at
   `99ba8c38` (the chore commit) — a SHA mismatch, BUT the chore
   touches only `scripts/m3-live-verify.cjs` (a dev-only node script,
   NOT in the worker bundle or the web build), so the deployed surface
   was byte-identical between `30d1d7f6` and `99ba8c38`. The prompt's
   condition fired: **NO pre-phase deploy**.
4. **The move (commit `e0734851`, ONE commit for web+engine per the
   audit's Phase 3 rule):** the 32 web world-markets files →
   `features/world-markets/` FLAT (the 20-file
   `components/insights/world-markets/` subfolder + `MarketsChart`
   (left for M4 per BD-M1-r D3) + the 11 `routes/page-division`
   world-markets files — WorldMarketsPage, Hero, Briefing, Grids,
   MarketsTreemap, MarketTile, MarketMovers, MarketLogo, MarketsVerdict,
   MarketsTable, MarketsHeatmap, WorldMap + world-map-config/rows/geo.json,
   briefing, session, the 22-importer shared.tsx hub, verdict-core,
   world-map-copy, world-markets-tiles/backtest-core + their tests); the
   8 engine files → `domains/world-markets/markets/` (the whole world
   board job: compute/definitions/index/job/providers/run/store +
   markets.test — subfolder + barrel preserved, the M3 `tic/`
   convention). Same-commit machinery (8 manual edits the import regex
   cannot see): App.tsx lazy route; `markets-verdict.test.ts` two
   dynamic `import()` (the test stays in components/insights — legacy
   WorldMarkets verdict test, insights-legacy per the audit, NOT a
   mover); the exports-map `./markets` + `./markets/definitions` targets;
   `build-world-map.mjs` `geoOutPath` (R11) + its doc comment;
   `markets.test.ts` `new URL` fixture depth (R8 — COMPUTED 4 up-levels);
   the Persian-copy manifest re-key (1 entry). The 132 import re-anchors
   (incl. the 22 `shared.tsx` importers across GlobalBoard + 4 region
   pages + legacy, the 7 engine scripts, companies/fx/markets-au/narrator
   consumers). NO renames (R5 — bundle-budget rows byte-identical).
5. **The codemod (`scripts/m4-world-markets-codemod.mjs`, persisted
   in-repo per the M2/M3 method):** 40 git-mv moves, 132 specifiers
   re-anchored bidirectionally (edges whose importer moved, edges whose
   target moved, both-moved pairs stay extensionless-untouched;
   specifier styles preserved; Vite `?raw` queries split + re-appended),
   8 manual edits (the `urlRel` helper COMPUTES the markets.test.ts URL
   depth via `path.relative` — the BD-M3 D2 lesson inherited). Dry-run
   verified before apply.
6. **Regenerated + reviewed:** `registry:generate` + `placement:generate`
   + `s24:d9-audit` — **ZERO drift** (indicators.json,
   indicator-audit.json, site-mode-overrides.json, PLACEMENT.generated.md
   all byte-identical — the world-markets move touches no
   registry/generator paths; D-9 CONDITION MET). The Persian-copy
   manifest: 1 entry re-keyed (`technical.worldMarkets.percentSign`
   source path — pure path-key update, text+sha256+reference untouched;
   the M2 path-keys-only approach).
7. **Post-phase deploy + live verify:** deploy-lock re-checked (still
   `30d1d7f6`, no parallel deploy) → **currena-api `c25f783b` @ 100%**
   (deployed 2026-11-15T17:31Z). Smoke: /api/health ok · / 200 ·
   /world-markets 200 · /api/insights 183 readings.
   **Runtime-identity proof (the M3-grade):** entry
   `index-DOan26Zs.js` sha256 `58c55289…` byte-identical local-vs-live
   AND byte-identical to the M3 close (the modularization moves don't
   touch the entry — pure file-system reorganization, zero runtime
   delta); WorldMarketsPage `WorldMarketsPage-CoVjbsfm.js` sha256
   `d2786e05…` byte-identical local-vs-live.

## Where the world-markets domain now lives (the Phase 3.2 map)

- **web `apps/web/src/features/world-markets/`** — 32 files FLAT:
  WorldMarketsPage (+ test), WorldMarketsHero, WorldMarketsBriefing,
  WorldMarketsGrids, world-markets-tiles (+ test),
  world-markets-backtest-core (+ test), world-markets-copy-pin test,
  world-map-copy, MarketsChart (the former components/insights/MarketsChart,
  left for M4 per BD-M1-r D3), + the 20-file former
  components/insights/world-markets/ cluster flattened alongside:
  WorldMap, MarketsTreemap (+ test), MarketTile, MarketMovers,
  MarketLogo, MarketsVerdict, MarketsTable, MarketsHeatmap, briefing
  (+ 2 tests), session, shared (the 22-importer hub), verdict-core,
  world-map-config, world-map-rows, world-map-geo.json (the generated
  asset), zoom (+ 2 tests).
- **engine `packages/insights/src/domains/world-markets/markets/`** —
  the 8-file world board job (compute, definitions, index (the barrel),
  job, providers, run, store + markets.test), subfolder preserved.
- **Cross-tree edges (documented, allowed):** `shared.tsx` is imported
  by GlobalBoard + the 4 region pages (AsiaPage, AustraliaPage,
  EuropePage, UsaPage via RegionIndexSection) + legacy (N3 — the
  documented mirror pattern, relative rewrites only); the
  `verdict-core`/`WorldMap`/`world-map-config`/`world-map-rows` cluster
  is read by global tiles/backtest + region zoom (N4); `markets-verdict.test.ts`
  stays in `components/insights/` (legacy WorldMarkets verdict test,
  insights-legacy per the audit, NOT a mover — its 2 dynamic imports
  re-anchored to the new folder); engine `narrator/section-state`,
  `companies/adapter`, `fx/*`, `markets-au/*` import
  `domains/world-markets/markets/definitions` (relative rewrites); the
  exports-map `./markets` + `./markets/definitions` entries repoint here
  (entry NAMES frozen — apps/api + apps/markets needed ZERO edits, R4).
- `build-world-map.mjs` `geoOutPath` now writes `world-map-geo.json`
  INTO `features/world-markets/` (the R11 same-commit update).

## Operational notes worth carrying (M4 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The R8 rule, now sharper: COMPUTE fixture depths, never edit
  counts** — the M3 codemod's first draft hand-wrote 3-up where 4 were
  needed; the M4 codemod inherits the `urlRel` helper (`path.relative`
  → `./` + computed-depth form) for the `new URL(spec, import.meta.url)`
  case. The persisted codemod is `scripts/m4-world-markets-codemod.mjs`
  §5; the M5+ codemods must copy that form.
- **The codemod's dynamic-import() regex gap:** the import/export-from
  regex does NOT match `import('...')` (no whitespace after `import`).
  Manual-edit any `import('./...')` lazy route + `await import('./...')`
  test calls (App.tsx + markets-verdict.test.ts this session). The M5+
  codemods must grep for dynamic `import(` against the moved set BEFORE
  the gates run.
- **The codemod (persisted, reusable pattern):** moves table →
  bidirectional re-anchoring (importer-moved AND target-moved edges;
  existence-checked candidate resolution; specifier styles preserved;
  Vite `?raw` queries split and re-appended) → manual fs/URL edits
  computed, not counted. Dry-run first (`--dry`), then apply.
- **Domain moves are ONE commit (web+engine together)** — unlike M2's
  two-commit split (BD-M3 D1); M4+ follow the one-commit pattern.
- **The web folder is FLAT (the M3 usa convention):** domain component
  clusters flatten into `features/<domain>/` alongside the page files,
  NOT a nested `components/` subfolder (BD-M4 D1). The engine board job
  preserves its subfolder at `domains/<domain>/<job>/` (the M3 `tic/`
  convention, BD-M4 D2).
- **The Persian-copy manifest re-key for moved files:** a moved file
  with a manifest-claimed hardcoded Persian literal produces a
  REMOVED+NEW pair (the old-path entry → REMOVED, the new-path sweep
  hit → NEW). Fix: update the entry's `source` field (pure path-key
  update, text+sha256+reference untouched — the M2 path-keys-only
  approach). The manifest's top-level `fingerprint` is a description
  string (not a hash), so a 1-field path edit is safe. M3's usa files
  carried no such literals (no re-triage); M4's world-markets had ONE
  (the "٪" percent sign in shared.tsx). M5+ must run `pnpm copy:audit`
  post-move + re-key any REMOVED+NEW pairs.
- **The deploy lock + account check before every deploy** (the D-43
  lesson, unchanged); the KV write cap (1,000/day, REST exhausts
  ~18:30–19:00 UTC); the GHA schedule-delay quirk (~7–9 h, use
  `workflow_dispatch`); the D-9 audit as a standing gate; never run
  the §21 portwatch leg Tuesdays 11:00–14:00 UTC.

## Owner-side levers waiting

1. **Ratify BD-M4** (this session's records: the M3-slip prerequisite
   chore, the flat-vs-nested decision, the markets.test.ts R8
   computed-depth, the dynamic-import() regex gap handling, the
   Persian-copy manifest re-key, the skipped pre-phase deploy, the
   zero drift).
2. Ratify BD-M3 + BD-M2 + BD-M1-r + BD-BR + the BD-S3…BD-S31 set
   (carried).
3. Arrange the external investor's review of the spec (§19 — the
   seven questions); S23's deferred feedback-build scope follows it.
4. The §19.6 retirement timing answer (retire the legacy /insights
   now or after burn-in) — Gate 0 of `06-LEGACY-RETIREMENT-S24.md` §7.
5. Ratify the `/converter` relocation (S1) + AF-3
   (michigan-1y-expectations → USA tier-3).
6. Triage the queued unreviewed fa strings (the manifest's `queued`
   section — visible review debt, does not fail the audit; unchanged
   this session).
7. **Revoke or rotate the session credentials** (the GitHub token +
   the sedanama-ir Cloudflare token both worked; rotate per the
   owner's schedule): credentials used, never stored in the repo.

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (BD-S19c); non-JS crawlers see
  the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8)
  · pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities
  24) · pd-s18 (Currencies 53) — all re-runnable against production
  from apps/web/scripts/ (pass `--base https://currena.ir`). **The
  pd-s7 (world-markets-backtest-core) + pd-s8 (world-map-config)
  imports were M4's and are DONE; pd-s16 (australia) is M5's.**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- The /world-markets treemap (TM1–TM4): LIVE (verified on the M2
  deploy; M4 moved its files — the `geoOutPath` same-commit rule
  applied; the world-map-geo.json now lives in `features/world-markets/`).
- **The bundle topology post-M4: zero logic delta** — the entry chunk
  is byte-identical to the M3 close (`index-DOan26Zs.js` /
  `58c55289…`); the WorldMarketsPage chunk byte-identical
  local-vs-live; the 93-chunk count and every budget row unchanged.
  Phase 3's remaining moves (M5+) keep the same basename discipline.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix).
- The two pure-comment path references (UsGlobalReachGroup +
  DollarStrength — "src/shared/gauges.ts" in comments) are still
  Phase 7's light header pass; M4's world-markets move may add a few
  more (record them, don't fix them out of scope).
- The `m3-live-verify.cjs` file-level eslint-disable (BD-M4 D0 /
  chore `99ba8c38`) is the established pattern for any future cjs
  node script — do NOT extend the eslint scope for one file.

---

## The M5 next-session prompt (modularization Phase 3.3 — australia)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M5 — modularization Phase 3.3: the australia domain (the
third Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 3
australia + Deliverable 1's australia rows + the N1–N18
cross-domain map (esp. N11 — AustralianMarkets/lib/markets-au/au-markets/
shared: AustraliaPage + AsiaNzx50Card (asia) + legacy) + risks R4/R5/R8/R9) →
docs/HANDOFF.md → CHANGELOG [2026-11-15] M4 → docs/DECISIONS.md BD-M4.

FIRST, before touching anything: run `pnpm gates` once and record the
numbers (the M4 close: 9/9, suite 15,298). If the baseline is red,
STOP and report — never start a phase on a red baseline. ENVIRONMENT
NOTE: this sandbox's `skills/` folder sits at the PARENT of the Currena
repo (not inside it) — the M3-era lint-gate noise does NOT apply; no
parking needed. If a future sandbox injects `skills/` INSIDE the repo
root, park it outside during gates runs (BD-M3 D4), never commit it.

IF the owner's kickoff includes the Currena Cloudflare deploy token
(the sedanama-ir account): re-check the deploy-lock first per
docs/DEPLOY.md — production should be at c25f783b @ 100% (the M4
close). If it is, NO deploy is needed before the phase (production ==
origin/main deployed surface); only deploy after the phase if the
gates are green. If no token: skip this paragraph, note it in the
handoff.

The phase (audit §"Phase 3" item 3 — australia: 14 web files + engine
markets-au/ (8) + 3 adapters):
- Web side: the australia inventory rows into
  apps/web/src/features/australia/ (FLAT — the M3 usa + M4 world-markets
  convention: AustraliaPage, AustraliaTierCards, australia-tiles,
  australia-backtest-core, australia-copy-pin, australia-board-copy +
  tests + the AustralianMarkets component + the au-markets/ subfolder
  cluster) per the audit's Deliverable 1 "australia" rows.
- Engine side: markets-au/ (the whole AU markets board job) into
  packages/insights/src/domains/australia/markets-au/ (subfolder
  preserved — the M3 tic/ + M4 markets/ convention).
- The 3 AU adapters (abs, abs-au, rba + tests) into
  packages/insights/src/domains/australia/adapters/.
- The exports-map targets for ./markets-au + ./markets-au/definitions
  update in the SAME commit (entry NAMEs unchanged — R4).
- The pd-s16 backtest script imports (apps/web/scripts/) update in the
  same commit (the codemod re-anchors them automatically — verify).
- The AsiaNzx50Card asia→australia edge per N11: AsiaNzx50Card (in
  features/asia-pacific, not yet moved — M9's) imports lib/markets-au
  + au-markets/shared; after M5 these become cross-domain (asia reads
  from australia) — the documented mirror pattern, relative rewrites
  only.
- The import rewrites via the M4 codemod method (scripts/
  m4-world-markets-codemod.mjs is the persisted pattern: bidirectional
  re-anchoring, existence-checked candidates, COMPUTED fs/URL depths —
  never hand-count ../; grep for ?raw query imports + fs/URL path
  strings + dynamic import() calls per moved file BEFORE the gates
  run — the M4 codemod's regex gap lesson, BD-M4 D4).
- The Persian-copy manifest re-key: run `pnpm copy:audit` post-move;
  re-key any REMOVED+NEW pair (the entry's source field — pure
  path-key update, text+sha256+reference untouched; BD-M4 D5).
- NO renames anywhere (the bundle-budget gate matches route-module
  basenames). Tests move WITH their subjects.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green; the exports map + all path
references updated in the same commits as their moves. Bookkeeping
per AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS) and the
M6 pointer (Phase 3.4 — commodities: 8 web files + 5 adapters; prices/
+ goldapi already shared since Phase 2).
```
