# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M5 (2026-11-15) — DELIVERED: modularization Phase 3.3 (australia,
> the third domain move) is done — 27 files moved (14 web FLAT into
> `apps/web/src/features/australia/` + 13 engine into
> `packages/insights/src/domains/australia/{markets-au,adapters}`), 55
> import specifiers re-anchored by codemod + 6 computed-depth manual
> edits, gates 9/9 with the suite EXACTLY 15,298, ONE green move commit
> pushed (`efd962e3`); production deployed post-phase (`c0d04357` @
> 100%) and live-verified — the entry + AustraliaPage + shared-AU-board
> chunks are byte-identical local-vs-live, the /australia page + the AU
> board job + the 3 AU adapters now live in domain-owned trees with ZERO
> runtime delta. TWO mid-phase red gates runs (the chunk-merger drift +
> the R8 join() trap) both caught BEFORE the commit, both diagnosed +
> fixed at the cause — the R16 broken-window rule held (every commit
> green).**

> **The NEXT session is M6** — modularization Phase 3.4
> (commodities: 8 web files + 5 adapters; prices/ + goldapi already
> shared since Phase 2), prompt at the bottom of this file.

## Current state (after the M5 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · Phase 3.2 (M4: the world-markets domain) · **Phase 3.3
  (M5: the australia domain, this session)** all DELIVERED. Phase 3
  continues biggest-first: commodities (M6) is next.
- **origin/main is GREEN** — 9/9 gates at `efd962e3` (the move) + the
  bookkeeping commit on top, suite 15,298, working tree clean.
- **Production is CURRENT** — currena-api `c0d04357` @ 100% (deployed
  2026-11-15T20:14Z), the exact origin/main deployed surface; the entry
  + AustraliaPage + shared-AU-board chunks byte-identical local-vs-live
  (sha256 verified) — the move is pure file-system reorganization,
  zero runtime delta (NOTE: the entry chunk `index-CgbcFzAJ.js` is NOT
  byte-identical to the M4 close `index-DOan26Zs.js` — the App.tsx
  lazy-route path string changed `./routes/page-division/AustraliaPage`
  → `./features/australia/AustraliaPage`, a pure path-string change in
  the entry's lazy-route list, zero runtime behavior delta).

## The green baseline — the M5 close record (2026-11-15)

Baseline (the M4 close, before the move) and final (after the move
`efd962e3`) runs of `pnpm gates` — **identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1113 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean (the 2 manifest re-keys landed) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) |
| 9 | build + bundle budget | PASS | entry 273.95/82.96 · the shared-AU-board chunk repointed /^markets-au-/ → /^shared-/ (the M5 chunk merger — 1.78/0.81, ceiling 15/4.5 retained) |

**Environment note (unchanged from M3/M4):** this sandbox's `skills/`
folder sits at `/home/z/my-project/skills` (the PARENT of the Currena
repo, NOT inside it) — so the M3-era lint-gate noise (479 errors inside
`skills/`) does NOT apply this session; the Currena eslint config
scopes to the repo root downward and the parent `skills/` is never
scanned. No parking needed. (If a future sandbox injects `skills/`
INSIDE the Currena repo root, park it outside during gates runs per
BD-M3 D4; never commit it.)

## The M5 session record (what was done)

1. **Baseline first:** `pnpm gates` — **9/9 GREEN** (suite 15,298,
   layer1 11,969/11,969, 2m 41s — the M4 close numbers exactly). The
   true M5 starting state.
2. **Deploy-lock check (the sedanama-ir account verified: currena-api
   + currena-markets + the currena.ir zone):** production at
   `c25f783b` @ 100% (the M4 close, deployed 2026-11-15T17:31Z) ==
   origin/main's deployed surface (origin/main was at `1b3c1ecd`, the
   M4 bookkeeping commit; the bookkeeping touches only docs, NOT in
   the worker bundle or web build → byte-identical deployed surface).
   The prompt's condition fired: **NO pre-phase deploy**.
3. **The move (commit `efd962e3`, ONE commit for web+engine per the
   audit's Phase 3 rule):** the 14 web australia files →
   `features/australia/` FLAT (the 9 `routes/page-division` page files
   + AustralianMarkets + MoneyPanel + the 2-file `au-markets/`
   subfolder cluster PRESERVED as `features/australia/au-markets/` +
   the `lib/markets-au` snapshot client flat at
   `features/australia/markets-au.ts`); the 13 engine files →
   `domains/australia/`: the 8-file `markets-au/` board job (subfolder
   + barrel preserved, the M3 `tic/` + M4 `markets/` convention) + the
   3 AU adapters (abs, abs-au, rba + their 2 co-located tests) into
   `domains/australia/adapters/`. Same-commit machinery (6 manual
   edits the import regex cannot see): App.tsx lazy route; rba.ts:114
   inline TYPE `import('../shared/parsers')` (the inline
   `import('...').X` regex-gap variant); the 2 R8 fixture-depth edits
   (rba.test.ts + abs-au.test.ts FIXTURES dir, 2→4 up-levels, the
   `join(__dirname, ...)` form); the exports-map `./markets-au` +
   `./markets-au/definitions` targets. The 55 import re-anchors (incl.
   the N11 AsiaNzx50Card asia→australia cross-domain edge, the N1
   universal-backtest edge, the N18 legacy-borrows edge, the
   shared/adapters barrel + collect + ingest consumers, the pd-s16
   script, the markets-au-run root script). NO renames (R5 — the
   AustraliaPage route chunk basename unchanged).
4. **The codemod (`scripts/m5-australia-codemod.mjs`, persisted in-repo
   per the M2/M3/M4 method):** 27 git-mv moves, 55 specifiers
   re-anchored bidirectionally (edges whose importer moved, edges whose
   target moved, both-moved pairs stay extensionless-untouched;
   specifier styles preserved), 6 manual edits (computed depths, never
   hand-counted). Dry-run verified before apply.
5. **TWO mid-phase red gates runs, both caught BEFORE the commit, both
   diagnosed + fixed at the cause (the R16 broken-window rule held —
   every commit green):**
   - **(1) the chunk-merger drift (gate 9, build + bundle budget):**
     the first post-move `pnpm gates` came back 8/9 — `✗ shared AU
     Markets board chunk: no matching chunk found`. Diagnosis (a
     stash-and-rebuild-baseline comparison): the baseline had FOUR
     chunks — `AustraliaPage-*`, `AustralianMarkets-*` (a separate
     shared chunk for the component), `markets-au-*` (the snapshot
     client) + `shared-*` (the world-markets hub, unchanged). The
     required FLAT co-location under the common `features/australia/`
     prefix caused Rollup to reorganize the AU board shared chunks —
     the AustralianMarkets component absorbed into the AustraliaPage
     route chunk (its primary importer), and the markets-au client +
     au-markets/shared helpers stayed shared across /australia +
     /asia-pacific (the N11 edge) + /insights, now ONE chunk Rollup
     names `shared-*` (after the co-located `au-markets/shared.ts`
     module, basename "shared"). The `/^markets-au-/` budget pattern
     found 0 → FAIL. The merge is a Rollup domain-prefix grouping
     heuristic, NOT a source rename (R5 held). A `lib/` subfolder
     experiment was tested + REVERTED (did not prevent the merge). The
     fix: the pattern repointed `/^markets-au-/` → `/^shared-/`, the
     label + comment updated to document the M5 merger (the chunk
     shrank to 1.78/0.81 — the 15/4.5 ceiling RETAINED, no bump). The
     drift RECORDED, never silently absorbed. NOTE: there are now TWO
     `shared-*` chunks (the merged AU board + the pre-existing
     world-markets hub); the gate's `Array.find` picks the first
     alphabetical (the AU board chunk in this build) — both well under
     the ceiling; Phase 6 (M15) may pin the chunk name via manualChunks
     or add a dedicated world-markets shared budget entry to bound both
     explicitly (the audit defers chunking config to Phase 6).
   - **(2) the R8 trap in the join() form (gate 8, full test suite):**
     the second `pnpm gates` came back 8/9 — 2 failing adapter tests
     (abs-au.test.ts, rba.test.ts): `ENOENT .../src/domains/fixtures/...`.
     The 2 tests compute their FIXTURES dir via `join(HERE, '..', '..',
     'fixtures')` (rba.test.ts) / `join(here, '..', '..', 'fixtures',
     's5')` (abs-au.test.ts) — a `join(__dirname, ...)` form the
     pre-gates grep missed (it covered `new URL(...,import.meta.url)` +
     `from '...fixtures'` but NOT `join(__dirname, ...)`). The BD-M4 D4
     lesson SHARPENED: grep for ALL fs-path forms (new URL,
     join(__dirname/HERE/here), readFileSync(join()), fileURLToPath) per
     moved TEST, not just the import-statement + new URL forms. Fixed
     by 2 computed-depth manual edits (4 up-levels). Re-ran gates →
     **9/9 GREEN** (suite 15,298, 2m 41s — identical to the M4 close).
6. **Regenerated + reviewed:** `registry:generate` + `placement:generate`
   + `s24:d9-audit` — **ZERO drift** (indicators.json,
   indicator-audit.json, site-mode-overrides.json, PLACEMENT.generated.md
   all byte-identical — the australia move touches no
   registry/generator paths; D-9 CONDITION MET). The Persian-copy
   manifest: 2 entries re-keyed (the "در اوج" + "٪ زیر اوج" literals in
   `au-markets/shared.ts` — pure path-key update of the id + source
   fields, text+sha256+reference byte-identical; the M2/M4 path-keys-only
   approach; NOTE M5's entries were `hardcoded.*` path-encoded ids, so
   BOTH the id and the source changed, unlike M4's `technical.*`
   semantic-key entry).
7. **Post-phase deploy + live verify:** deploy-lock re-checked (still
   `c25f783b`, no parallel deploy) → **currena-api `c0d04357` @ 100%**
   (deployed 2026-11-15T20:14Z). Smoke: /api/health ok · / 200 ·
   /australia 200 · /api/insights serves the australia section
   ("label":"stressed").
   **Runtime-identity proof (the M3/M4-grade):** entry
   `index-CgbcFzAJ.js` sha256 `eee933fd…` byte-identical local-vs-live
   (NOTE: NOT byte-identical to the M4 close `index-DOan26Zs.js`/
   `58c55289…` — the App.tsx lazy-route path string changed, a pure
   path-string change, zero runtime behavior delta); AustraliaPage
   `AustraliaPage-MvvZE5kY.js` sha256 `816fba80…` byte-identical
   local-vs-live; the merged shared-AU-board chunk `shared-BSjKLDnj.js`
   sha256 `f800c091…` byte-identical local-vs-live.

## Where the australia domain now lives (the Phase 3.3 map)

- **web `apps/web/src/features/australia/`** — 14 files FLAT:
  AustraliaPage (+ test), AustraliaTierCards, australia-tiles (+ test),
  australia-backtest-core (+ test), australia-board-copy,
  australia-copy-pin test, AustralianMarkets, MoneyPanel,
  markets-au.ts (the former `lib/markets-au` snapshot client, flat), +
  the 2-file `au-markets/` subfolder cluster PRESERVED as
  `features/australia/au-markets/` (briefing.ts, shared.ts — the
  cluster-internal `./shared` + `./briefing` imports stay `./X` because
  both move together).
- **engine `packages/insights/src/domains/australia/`** — the 8-file
  `markets-au/` board job (compute, definitions, index (the barrel),
  job, providers, run, store + markets-au.test), subfolder preserved;
  + the 3 AU adapters (abs, abs-au, rba) + their 2 co-located tests
  (abs-au.test, rba.test) in `domains/australia/adapters/`.
- **Cross-tree edges (documented, allowed):** the **N11** AsiaNzx50Card
  edge — AsiaNzx50Card (in `routes/page-division/`, asia M9's — NOT yet
  moved) imports `lib/markets-au` + `au-markets/shared` → now
  cross-domain asia→australia (the documented mirror pattern, relative
  rewrites only — the NZX50 board home is /australia per D-17/BD-S21b);
  the **N1** universal-backtest edge — australia-backtest-core imports
  the usa-backtest-core universal harness (`features/usa`, M3's); the
  **N18** legacy-borrows edge — Insights.tsx + world-feeds.ts import
  AustralianMarkets + markets-au (legacy, M13's — NOT yet moved); the
  exports-map `./markets-au` + `./markets-au/definitions` entries repoint
  here (entry NAMES frozen — apps/api + apps/markets needed ZERO edits,
  R4).

## Operational notes worth carrying (M5 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The R8 rule, sharpened AGAIN (M5): grep for ALL fs-path forms per
  moved TEST, not just new URL + import statements.** M3's R8 was the
  `new URL(spec, import.meta.url)` form (the urlRel helper). M4's was
  the same `new URL()` form (markets.test.ts, 4 up-levels). M5's was
  the `join(__dirname/HERE/here, '..', '..', 'fixtures')` form (the 2
  adapter tests) — the pre-gates grep covered `new URL()` +
  `from '...fixtures'` but NOT `join(__dirname, ...)` /
  `readFileSync(join())` / `fileURLToPath`. The BD-M4 D4 lesson
  ("grep for ?raw + fs/URL strings + dynamic import() per moved file")
  is now: grep for `new URL(` + `join(` + `readFileSync(` +
  `fileURLToPath` + `__dirname` + `import('` (inline type imports) per
  moved TEST, BEFORE the gates run. The M6+ codemods must copy this
  sharpened grep set.
- **The codemod's dynamic-import() regex gap, now TWO variants:**
  (1) the dynamic CALL `import('...')` (BD-M4 D4 — App.tsx lazy routes,
  `await import('...')` test calls); (2) the inline TYPE
  `import('...').X` (M5 — rba.ts:114 `import('../shared/parsers')`). The
  import/export-from regex (`/((?:import|export)\s+...)/`) does NOT
  match either (the `\s+` after `import` requires whitespace; `import(`
  has none). Manual-edit both forms in the codemod's manualEdits
  table; grep for `import('` per moved file BEFORE the gates run.
- **The chunk-merger drift (a new M5 lesson — Rollup's domain-prefix
  grouping):** when a domain's shared modules (previously split across
  `lib/` + `components/insights/` or similar) co-locate under a common
  `features/<domain>/` prefix, Rollup MERGES them into one shared chunk
  named after a co-located `shared.*`/`*-shared.*` module (basename
  "shared" wins). The bundle-budget gate (which matches chunk basenames)
  then reds on the old pattern. The fix: repoint the pattern to the new
  chunk name + RECORD the drift (the audit's "drift recorded, never
  silently absorbed" rule); a vite.config.ts manualChunks pin is Phase
  6 (M15). The M6+ domain sessions with a shared cross-route module that
  co-locates (commodities' PricesBoard? currencies' fx-presentation?
  gold's signals?) may hit the same merger — grep the baseline chunks
  for the domain's basename before the move + plan the pattern repoint.
- **The codemod (persisted, reusable pattern):** moves table →
  bidirectional re-anchoring (importer-moved AND target-moved edges;
  existence-checked candidate resolution; specifier styles preserved;
  Vite `?raw` queries split and re-appended) → manual fs/URL/inline-type
  edits computed, not counted. Dry-run first (`--dry`), then apply.
- **Domain moves are ONE commit (web+engine together)** — the M3/M4/M5
  pattern (BD-M3 D1).
- **The web folder is FLAT (the M3 usa + M4 world-markets convention):**
  domain component clusters flatten into `features/<domain>/` alongside
  the page files, NOT a nested `components/` subfolder (BD-M4 D1). Named
  clusters the audit lists with a trailing slash (e.g. `au-markets/`)
  are PRESERVED as subfolders (BD-M5 D1). The engine board job preserves
  its subfolder at `domains/<domain>/<job>/` (the M3 `tic/` + M4
  `markets/` convention, BD-M4 D2).
- **The Persian-copy manifest re-key for moved files:** a moved file
  with a manifest-claimed hardcoded Persian literal produces a
  REMOVED+NEW pair. Fix: update the entry's `source` field AND, for
  `hardcoded.*` entries (whose id IS path-encoded), the `id` field too
  — pure path-key update, text+sha256+reference untouched (the M2/M4
  path-keys-only approach, extended to the id by BD-M5 D5). M3's usa
  files carried no such literals; M4's world-markets had ONE
  (`technical.*` semantic id — source only); M5's australia had TWO
  (`hardcoded.*` path-encoded ids — id + source). M6+ must run `pnpm
  copy:audit` post-move + re-key any REMOVED+NEW pairs (both fields for
  `hardcoded.*`, source-only for `technical.*`).
- **The deploy lock + account check before every deploy** (the D-43
  lesson, unchanged); the KV write cap (1,000/day, REST exhausts
  ~18:30–19:00 UTC); the GHA schedule-delay quirk (~7–9 h, use
  `workflow_dispatch`); the D-9 audit as a standing gate; never run
  the §21 portwatch leg Tuesdays 11:00–14:00 UTC.

## Owner-side levers waiting

1. **Ratify BD-M5** (this session's records: the chunk-merger drift +
   the bundle-budget pattern repoint, the R8 join() trap + the
   sharpened BD-M4 D4 lesson, the Persian-copy manifest re-key for 2
   hardcoded.* entries, the rba.ts inline TYPE import, the pre-phase
   deploy skip, the zero drift, the lib/ subfolder experiment + revert).
2. Ratify BD-M4 + BD-M3 + BD-M2 + BD-M1-r + BD-BR + the BD-S3…BD-S31
   set (carried).
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
   the sedanama-ir Cloudflare token + the EODHD token all worked;
   rotate per the owner's schedule): credentials used, never stored in
   the repo.

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (BD-S19c); non-JS crawlers see
  the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8)
  · pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities
  24) · pd-s18 (Currencies 53) — all re-runnable against production
  from apps/web/scripts/ (pass `--base https://currena.ir`). **The
  pd-s16 (australia-backtest-core + australia-tiles) imports were M5's
  and are DONE (the codemod re-anchored them); pd-s17 (commodities) is
  M6's.**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The bundle topology post-M5: one chunk-name delta, zero logic
  delta** — the entry chunk changed (`index-DOan26Zs` → `index-CgbcFzAJ`,
  the App.tsx lazy-path string); the shared-AU-board chunk renamed
  `markets-au-*` → `shared-*` (the M5 merger; the budget pattern
  repointed); the AustraliaPage chunk byte-identical local-vs-live; the
  93-chunk count and every other budget row unchanged. Phase 3's
  remaining moves (M6+) keep the same basename discipline — BUT a
  domain whose shared cross-route module co-locates may hit the same
  chunk-merger drift (the M5 lesson above).
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix).
- The pure-comment path references (UsGlobalReachGroup +
  DollarStrength — "src/shared/gauges.ts" in comments) are still
  Phase 7's light header pass; M5's australia move added none (the
  moved files' headers already say what each file is).
- The `m3-live-verify.cjs` file-level eslint-disable (BD-M4 D0 /
  chore `99ba8c38`) is the established pattern for any future cjs
  node script — do NOT extend the eslint scope for one file.

---

## The M6 next-session prompt (modularization Phase 3.4 — commodities)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M6 — modularization Phase 3.4: the commodities domain (the
fourth Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 4
commodities + Deliverable 1's commodities rows + the N1–N18
cross-domain map (esp. N10 — the PricesBoard price cluster moved to
shared in Phase 2; commodities' CommoditiesTierCards imports it) +
risks R4/R5/R8/R9) → docs/HANDOFF.md → CHANGELOG [2026-11-15] M5 →
docs/DECISIONS.md BD-M5.

FIRST, before touching anything: run `pnpm gates` once and record the
numbers (the M5 close: 9/9, suite 15,298). If the baseline is red,
STOP and report — never start a phase on a red baseline. ENVIRONMENT
NOTE: this sandbox's `skills/` folder sits at the PARENT of the Currena
repo (not inside it) — the M3-era lint-gate noise does NOT apply; no
parking needed. If a future sandbox injects `skills/` INSIDE the repo
root, park it outside during gates runs (BD-M3 D4), never commit it.

IF the owner's kickoff includes the Currena Cloudflare deploy token
(the sedanama-ir account): re-check the deploy-lock first per
docs/DEPLOY.md — production should be at c0d04357 @ 100% (the M5
close). If it is, NO deploy is needed before the phase (production ==
origin/main deployed surface); only deploy after the phase if the
gates are green. If no token: skip this paragraph, note it in the
handoff.

The phase (audit §"Phase 3" item 4 — commodities: 8 web files + 5
adapters; prices/ + goldapi already shared since Phase 2):
- Web side: the commodities inventory rows into
  apps/web/src/features/commodities/ (FLAT — the M3 usa + M4
  world-markets + M5 australia convention: CommoditiesPage,
  CommoditiesTierCards, commodities-tiles, commodities-backtest-core +
  tests) per the audit's Deliverable 1 "commodities" rows.
- Engine side: the 5 commodities adapters (eia, eia-stocks, portwatch,
  fng, bitstamp + tests) into
  packages/insights/src/domains/commodities/adapters/.
  NOTE: prices/ + goldapi are ALREADY in engine shared/ (Phase 2, D2
  deviation — the audit skeleton placed prices/ under commodities but
  the audit moved it to shared because 3 domains consume it). So
  commodities has NO board job to move (unlike usa's tic/, world-markets'
  markets/, australia's markets-au/) — ONLY the 5 adapters. There is
  NO exports-map entry for commodities (no board job) — verify.
- The exports-map: NO commodities entry to update (no board job) —
  verify (R4 — the entry NAMEs are frozen; commodities may have none).
- The pd-s17 backtest script imports (apps/web/scripts/) update in the
  same commit (the codemod re-anchors them automatically — verify).
- The N10 edge: CommoditiesTierCards imports the PricesBoard price
  cluster (PriceDetails, PriceSparkline, price-stats, price-trend,
  chart-range) which moved to shared/components in Phase 2 — after M6
  this stays a commodities→shared edge (already cross-domain since
  Phase 2, relative rewrites only).
- The import rewrites via the M5 codemod method (scripts/
  m5-australia-codemod.mjs is the persisted pattern: bidirectional
  re-anchoring, existence-checked candidates, COMPUTED fs/URL depths —
  never hand-count ../; grep for ?raw query imports + fs/URL path
  strings + dynamic import() calls + inline import('...') type refs +
  join(__dirname/HERE/here, ...) fixture paths per moved file BEFORE
  the gates run — the M5-sharpened BD-M4 D4 lesson, BD-M5 D4).
- The Persian-copy manifest re-key: run `pnpm copy:audit` post-move;
  re-key any REMOVED+NEW pair (BOTH the id + source for hardcoded.*
  path-encoded entries, source-only for technical.* semantic-key
  entries — the BD-M5 D5 extension).
- NO renames anywhere (the bundle-budget gate matches route-module
  basenames). Tests move WITH their subjects.
- CHUNK-MERGER WATCH (the M5 lesson, BD-M5 D3): grep the baseline dist
  for the commodities chunk basename(s) before the move. If commodities
  has a shared cross-route module that co-locates under
  features/commodities/ (e.g. a shared commodity-drawing chunk), Rollup
  may merge it into a `shared-*` or rename it — plan the bundle-budget
  pattern repoint + RECORD the drift (never silently absorbed). A
  vite.config.ts manualChunks pin is Phase 6 (M15), out of scope.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green; the exports map (if any) + all
path references updated in the same commits as their moves. Bookkeeping
per AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS) and the
M7 pointer (Phase 3.5 — currencies: 20 web files + engine fx/ (16) +
basket + 2 adapters; exports-map ./fx(+/definitions)).
```
