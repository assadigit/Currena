# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M6 (2026-11-15) — DELIVERED: modularization Phase 3.4 (commodities,
> the fourth domain move) is done — 15 files moved (8 web FLAT into
> `apps/web/src/features/commodities/` + 7 engine into
> `packages/insights/src/domains/commodities/adapters/`), 44 import
> specifiers re-anchored by codemod + 3 computed-depth manual edits,
> gates 9/9 with the suite EXACTLY 15,298 (IDENTICAL to the M5 close —
> ZERO delta), ONE green move commit pushed (`05fdd1a`); production
> deployed post-phase (`7625c2f3` @ 100%) and live-verified — the entry
> + CommoditiesPage chunks are byte-identical local-vs-live, the
> CommoditiesPage chunk hash basename (`PlTCRZCw`) is IDENTICAL to the
> baseline (zero byte delta — the move is pure file-system
> reorganization), the /commodities page + the 5 commodities adapters
> now live in domain-owned trees with ZERO runtime delta. NO mid-phase
> red gates runs this session (the pre-gates BD-M4 D4 + BD-M5 D4
> sharpened grep set caught everything — the App.tsx dynamic-import gap
> + the 2 R8 fixture-depth traps; the chunk-merger watch confirmed ZERO
> topology delta as predicted — commodities has no shared cross-route
> module co-locating this phase since the PricesBoard cluster is in
> shared/ since Phase 2).**

> **The NEXT session is M7** — modularization Phase 3.5
> (currencies: 20 web files incl. fx-presentation/ + world-currencies/
> display.ts + engine fx/ (16) + basket + 2 adapters frankfurter, cofer;
> exports-map ./fx(+/definitions); **pd-s18** (NOT pd-s10/s17 — the
> audit's notation was WRONG; pd-s10 is USA M3's, pd-s17 is commodities
> M6's, pd-s18 is currencies M7's — verified this session)), prompt at
> the bottom of this file.

## Current state (after the M6 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · Phase 3.2 (M4: the world-markets domain) · Phase 3.3 (M5:
  the australia domain) · **Phase 3.4 (M6: the commodities domain, this
  session)** all DELIVERED. Phase 3 continues biggest-first: currencies
  (M7) is next.
- **origin/main is GREEN** — 9/9 gates at `05fdd1a` (the move), suite
  15,298 (IDENTICAL to the M5 close — ZERO delta), working tree clean.
- **Production is CURRENT** — currena-api `7625c2f3` @ 100% (deployed
  2026-11-15T21:55:59Z), the exact origin/main deployed surface; the
  entry chunk `index-WR9bNacU.js` sha256 `3105472d…` byte-identical
  local-vs-live (NOTE: NOT byte-identical to the M5 close
  `index-CgbcFzAJ.js`/`eee933fd…` — the App.tsx lazy-route path string
  changed `./routes/page-division/CommoditiesPage` →
  `./features/commodities/CommoditiesPage`, a pure path-string change in
  the entry's lazy-route list, zero runtime behavior delta); the
  CommoditiesPage chunk `CommoditiesPage-PlTCRZCw.js` sha256
  `ed9fa539…` byte-identical local-vs-live AND byte-identical to the
  baseline (the hash basename `PlTCRZCw` is UNCHANGED — the move didn't
  change a single byte of the route chunk); the PriceDetails chunk
  `PriceDetails-D7X6gwOo.js` (Phase 2 shared, NOT moving) hash basename
  `D7X6gwOo` UNCHANGED.

## The green baseline — the M6 close record (2026-11-15)

Baseline (the M5 close, before the move) and final (after the move
`05fdd1a`) runs of `pnpm gates` — **identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1087 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean (ZERO REMOVED+NEW pairs — commodities has no manifest-claimed hardcoded Persian literals) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — IDENTICAL to the M5 close |
| 9 | build + bundle budget | PASS | entry 273.95/82.96 · ZERO chunk topology delta (CommoditiesPage-* + PriceDetails-* hash basenames UNCHANGED; the entry chunk re-hashed index-CgbcFzAJ → index-WR9bNacU for the App.tsx lazy-path string change) |

**Environment note (unchanged from M3/M4/M5):** this sandbox's `skills/`
folder sits at `/home/z/my-project/skills` (the PARENT of the Currena
repo, NOT inside it) — so the M3-era lint-gate noise (479 errors inside
`skills/`) does NOT apply this session; the Currena eslint config
scopes to the repo root downward and the parent `skills/` is never
scanned. No parking needed. (If a future sandbox injects `skills/`
INSIDE the Currena repo root, park it outside during gates runs per
BD-M3 D4; never commit it.)

## The M6 session record (what was done)

1. **Baseline first:** `pnpm gates` — **9/9 GREEN** (suite 15,298,
   layer1 11,969/11,969, 2m 37s — the M5 close numbers exactly). The
   true M6 starting state.
2. **Deploy-lock check (the sedanama-ir account verified: currena-api
   + currena-markets + the currena.ir zone):** production at
   `c0d04357` @ 100% (the M5 close, deployed 2026-11-15T20:14:10Z) ==
   origin/main's deployed surface (origin/main was at `29a455b`, the
   M5 bookkeeping commit on top of `efd962e3` the move; the bookkeeping
   touches only docs, NOT in the worker bundle or web build →
   byte-identical deployed surface). The prompt's condition fired:
   **NO pre-phase deploy**.
3. **The move (commit `05fdd1a`, ONE commit for web+engine per the
   audit's Phase 3 rule):** the 8 web commodities files →
   `features/commodities/` FLAT (CommoditiesPage + test,
   CommoditiesTierCards, commodities-tiles + test,
   commodities-backtest-core + test, commodities-copy-pin test — the
   M3 usa + M4 world-markets + M5 australia convention, no subfolders,
   no renames, tests co-located with subjects); the 7 engine files →
   `domains/commodities/adapters/` (the 5 commodities adapters
   eia/eia-stocks/portwatch/fng/bitstamp + their 2 co-located tests
   eia.test/portwatch.test — NO subfolder, NO barrel; commodities has
   NO board job to move, unlike usa's tic/, world-markets' markets/,
   australia's markets-au/; prices/ + goldapi are ALREADY in engine
   shared/ since Phase 2 per the D2 deviation). Same-commit machinery
   (3 manual edits the import regex cannot see, grepped before gates
   per the BD-M4 D4 + BD-M5 D4 sharpened lesson): App.tsx lazy route
   (the dynamic-import() regex gap — BD-M4 D4); eia.test.ts:15 R8
   fixture-depth `join(__dirname, '../../fixtures/...')` → 4 up-levels
   (the `join(__dirname, ...)` form — BD-M5 D4); portwatch.test.ts:42
   R8 fixture-depth `join(here, '..', '..', 'fixtures')` → 4 up-levels
   (the `join(here, ...)` form — BD-M5 D4; same 2→4 shift as M5's
   rba.test.ts + abs-au.test.ts). NO exports-map edit (verified absent
   — no ./commodities entry; commodities has no board job + no barrel;
   R4 N/A — contrast M3 ./tic, M4 ./markets, M5 ./markets-au). NO
   renames (R5 — the CommoditiesPage route chunk basename unchanged).
   The 44 import re-anchors (incl. the N1 commodities-backtest-core →
   features/usa/usa-backtest-core edge RE-ANCHORED
   `../../features/usa/usa-backtest-core` → `../usa/usa-backtest-core`
   — the path STRUCTURE differs even though src depth is invariant
   because the target is a sibling under features/, not a direct child
   of src/; the N10 CommoditiesTierCards → shared/components/PricesBoard
   edge depth-invariant NO-OP — target in shared/, a direct child of
   src/; the engine shared/adapters barrel + collect + rung2 + rung4 +
   ingest/run + scoring + eia-cftc.test + adapters.test consumers
   re-anchored to `../../domains/commodities/adapters/{...}`; the
   pd-s17 backtest script's 2 static imports re-anchored
   automatically). The 3 manual edits (computed depths, never
   hand-counted).
4. **The codemod (`scripts/m6-commodities-codemod.mjs`, persisted in-repo
   per the M2/M3/M4/M5 method):** 15 git-mv moves, 44 specifiers
   re-anchored bidirectionally (edges whose importer moved, edges whose
   target moved, both-moved pairs stay extensionless-untouched;
   specifier styles preserved), 3 manual edits (computed depths). Dry-run
   verified before apply.
5. **NO mid-phase red gates runs this session** (the R16 broken-window
   rule held trivially — every commit green on the FIRST post-move
   run). The pre-gates BD-M4 D4 + BD-M5 D4 sharpened grep set caught
   everything BEFORE the gates run: the App.tsx dynamic-import gap
   (manual edit #1); the 2 R8 fixture-depth traps in the
   `join(__dirname, ...)` + `join(here, ...)` forms (manual edits #2
   + #3 — the BD-M5 D4 lesson inherited). The chunk-merger watch
   confirmed ZERO topology delta as predicted — commodities has NO
   separate shared cross-route module that co-locates under
   features/commodities/ this phase (the PricesBoard cluster is in
   shared/components/ since Phase 2 — the N10 edge stays
   commodities→shared); the baseline had ONE commodities chunk
   `CommoditiesPage-*` (the route chunk; all 8 web files co-locate by
   source) + `PriceDetails-*` (Phase 2 shared, NOT moving); after M6
   the 8 files still co-locate under `features/commodities/` → Rollup
   keeps them in the CommoditiesPage-* route chunk (no new cross-route
   sharing) → the bundle-budget rows are byte-identical to the baseline
   (no pattern repoint needed, no drift to record — the LOWER-than-M5
   chunk-merger risk noted in the prompt was confirmed).
6. **Regenerated + reviewed:** `registry:generate` + `placement:generate`
   + `s24:d9-audit` — **ZERO drift** (indicators.json,
   indicator-audit.json, site-mode-overrides.json, PLACEMENT.generated.md
   all byte-identical — the commodities move touches no
   registry/generator paths; D-9 CONDITION MET). The Persian-copy
   manifest: **ZERO re-keys** (commodities has NO manifest-claimed
   hardcoded Persian literals — its copy rides the shared dictionaries
   `pd.commodities.*` with semantic ids, not `hardcoded.*` path-encoded
   ids; the BD-M5 D5 id+source re-key extension is N/A for M6 —
   contrast M5's australia which had 2 `hardcoded.*` entries in
   `au-markets/shared.ts`).
7. **Post-phase deploy + live verify:** deploy-lock re-checked (still
   `c0d04357`, no parallel deploy) → **currena-api `7625c2f3` @ 100%**
   (deployed 2026-11-15T21:55:59Z). Smoke: /api/health ok (kv ok) · /
   200 · /commodities 200 · /api/insights/pages/commodities serves the
   24 commodities readings + 0 boards + 0 absentIds (the placement §11
   contract — commodities has no zoom, no markets board).
   **Runtime-identity proof (the M3/M4/M5-grade):** entry
   `index-WR9bNacU.js` sha256 `3105472d…` byte-identical local-vs-live
   (NOTE: NOT byte-identical to the M5 close `index-CgbcFzAJ.js`/
   `eee933fd…` — the App.tsx lazy-route path string changed, a pure
   path-string change, zero runtime behavior delta); CommoditiesPage
   `CommoditiesPage-PlTCRZCw.js` sha256 `ed9fa539…` byte-identical
   local-vs-live AND byte-identical to the baseline (the hash basename
   `PlTCRZCw` is UNCHANGED — the move didn't change a single byte of
   the route chunk); PriceDetails `PriceDetails-D7X6gwOo.js` (Phase 2
   shared, NOT moving) hash basename `D7X6gwOo` UNCHANGED.

## Where the commodities domain now lives (the Phase 3.4 map)

- **web `apps/web/src/features/commodities/`** — 8 files FLAT:
  CommoditiesPage (+ test), CommoditiesTierCards, commodities-tiles (+
  test), commodities-backtest-core (+ test), commodities-copy-pin test.
  (No subfolders — commodities has no named cluster like australia's
  au-markets/; the PricesBoard cluster is in shared/components/ since
  Phase 2.)
- **engine `packages/insights/src/domains/commodities/adapters/`** — the
  5 commodities adapters (eia, eia-stocks, portwatch, fng, bitstamp) +
  their 2 co-located tests (eia.test, portwatch.test). (NO subfolder,
  NO barrel — commodities has NO board job, unlike usa's tic/, world-
  markets' markets/, australia's markets-au/; prices/ + goldapi are
  ALREADY in engine shared/ since Phase 2 per the D2 deviation.)
- **Cross-tree edges (documented, allowed):** the **N1** universal-
  backtest edge — commodities-backtest-core imports the usa-backtest-
  core universal harness (`features/usa/`, M3's); the codemod
  re-anchored it `../../features/usa/usa-backtest-core` →
  `../usa/usa-backtest-core` (the path STRUCTURE differs even though
  src depth is invariant — the target is a sibling under features/);
  the **N10** PricesBoard cluster edge — CommoditiesTierCards imports
  PriceTile/useTileData/PriceLens/PricePeriodSwitch from
  `../../shared/components/PricesBoard` (Phase 2 shared); depth-
  invariant NO-OP (target in shared/, a direct child of src/; both old
  + new importer at src depth 2 → `../../shared/components/PricesBoard`
  resolves identically) → stays a commodities→shared edge (already
  cross-domain since Phase 2); the **N18** legacy-borrows edge —
  Insights.tsx + world-feeds.ts do NOT import commodities files
  (verified — no legacy consumer of any commodities file outside the
  commodities folder itself + App.tsx + pd-s17 script); **NO
  exports-map entry** (verified absent — no ./commodities entry;
  commodities has no board job + no barrel, R4 N/A).

## Operational notes worth carrying (M6 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The R8 rule, sharpened AGAIN (M5) + INHERITED (M6):** M3's R8 was
  the `new URL(spec, import.meta.url)` form. M4's was the same `new
  URL()` form (markets.test.ts, 4 up-levels). M5's was the
  `join(__dirname/HERE/here, '..', '..', 'fixtures')` form (the 2 AU
  adapter tests) — the BD-M4 D4 lesson SHARPENED: grep for ALL fs-path
  forms (new URL, join(__dirname/HERE/here), readFileSync(join()),
  fileURLToPath) per moved TEST, BEFORE the gates run. **M6 INHERITED
  the sharpened lesson cleanly: the pre-gates grep caught BOTH the
  eia.test.ts `join(__dirname, '../../fixtures/...')` + the
  portwatch.test.ts `join(here, '..', '..', 'fixtures')` traps BEFORE
  the gates run — NO mid-phase red gates run this session (contrast
  M5's second red run that caught the join() trap the pre-gates grep
  missed).** The M7+ codemods inherit this sharpened grep set as the
  standing pre-gates discipline.
- **The codemod's dynamic-import() regex gap, now TWO variants
  (inherited):** (1) the dynamic CALL `import('...')` (BD-M4 D4 —
  App.tsx lazy routes, `await import('...')` test calls); (2) the
  inline TYPE `import('...').X` (M5 — rba.ts:114). M6 had only variant
  (1) — the App.tsx lazy route (the ONLY dynamic-import() site in the
  moved set; the 2 `await import('../../shared/lib/locale')` in
  CommoditiesPage.test.tsx are depth-invariant NO-OPs — both
  routes/page-division/ + features/commodities/ at apps/web/src depth
  2, target shared/lib/locale does NOT move — the SAME depth-invariant
  NO-OP pattern as M5's AustraliaPage.test.tsx). NO inline TYPE
  `import('...').X` in the M6 moved set (BD-M5 D6's rba.ts variant does
  NOT recur). The M7+ codemods grep for `import('` per moved file
  BEFORE the gates run.
- **The chunk-merger drift (the M5 lesson, BD-M5 D3) — LOWER risk for
  domains whose shared cross-route module is already in shared/:** M5's
  chunk merger fired because the markets-au client + AustralianMarkets
  + au-markets/shared co-located under `features/australia/` and Rollup
  merged them into `shared-*`. M6 had NO such co-location — the
  PricesBoard cluster is in `shared/components/` since Phase 2 (the N10
  edge stays commodities→shared, NOT co-located under
  features/commodities/). The chunk-merger watch confirmed ZERO
  topology delta (the CommoditiesPage-* + PriceDetails-* hash basenames
  UNCHANGED; no pattern repoint needed). **The M7+ domain sessions with
  a shared cross-route module already in shared/ (currencies' fx-
  presentation? gold's signals?) have LOWER chunk-merger risk than M5**
  — but STILL grep the baseline chunks for the domain's basename before
  the move + plan accordingly (the standing watch).
- **The codemod (persisted, reusable pattern):** moves table →
  bidirectional re-anchoring (importer-moved AND target-moved edges;
  existence-checked candidate resolution; specifier styles preserved;
  Vite `?raw` queries split and re-appended) → manual fs/URL/inline-type
  edits computed, not counted. Dry-run first (`--dry`), then apply.
- **Domain moves are ONE commit (web+engine together)** — the M3/M4/M5/M6
  pattern (BD-M3 D1).
- **The web folder is FLAT (the M3 usa + M4 world-markets + M5 australia
  + M6 commodities convention):** domain component clusters flatten
  into `features/<domain>/` alongside the page files, NOT a nested
  `components/` subfolder (BD-M4 D1). Named clusters the audit lists
  with a trailing slash (e.g. `au-markets/`) are PRESERVED as
  subfolders (BD-M5 D1). The engine board job preserves its subfolder at
  `domains/<domain>/<job>/` (the M3 `tic/` + M4 `markets/` + M5
  `markets-au/` convention, BD-M4 D2). **Domains with NO board job
  (M6 commodities) flatten the adapters into
  `domains/<domain>/adapters/` with NO subfolder + NO barrel + NO
  exports-map entry** (the M6 precedent — the audit skeleton is a
  proposal, not a contract).
- **The Persian-copy manifest re-key for moved files:** a moved file
  with a manifest-claimed hardcoded Persian literal produces a
  REMOVED+NEW pair. Fix: update the entry's `source` field AND, for
  `hardcoded.*` entries (whose id IS path-encoded), the `id` field too
  — pure path-key update, text+sha256+reference untouched (the M2/M4
  path-keys-only approach, extended to the id by BD-M5 D5). M3's usa
  files carried no such literals; M4's world-markets had ONE
  (`technical.*` semantic id — source only); M5's australia had TWO
  (`hardcoded.*` path-encoded ids — id + source); **M6's commodities
  had ZERO** (its copy rides the shared dictionaries `pd.commodities.*`
  with semantic ids, not `hardcoded.*` path-encoded ids — the BD-M5 D5
  extension is N/A for M6). The M7+ sessions run `pnpm copy:audit`
  post-move + re-key any REMOVED+NEW pairs (both fields for
  `hardcoded.*`, source-only for `technical.*`).
- **The deploy lock + account check before every deploy** (the D-43
  lesson, unchanged); the KV write cap (1,000/day, REST exhausts
  ~18:30–19:00 UTC); the GHA schedule-delay quirk (~7–9 h, use
  `workflow_dispatch`); the D-9 audit as a standing gate; never run
  the §21 portwatch leg Tuesdays 11:00–14:00 UTC.

## Owner-side levers waiting

1. **Ratify BD-M6** (this session's records: the 15-file move + 44-edge
   codemod + 3 manual edits; the N1 edge RE-ANCHORED (not a depth-
   invariant NO-OP as the audit's intuition suggested — the path
   STRUCTURE differs even though src depth is invariant when the target
   is a sibling under features/); the N10 edge depth-invariant NO-OP;
   ZERO Persian-copy manifest re-keys (commodities has no hardcoded.*
   literals); ZERO chunk topology delta (the LOWER-than-M5 chunk-merger
   risk confirmed); the pre-gates BD-M4 D4 + BD-M5 D4 sharpened grep
   caught everything → NO mid-phase red gates runs; ZERO drift on
   registry/placement/D-9; the M7 pointer correction: pd-s18 is the
   currencies backtest script, NOT pd-s10/s17 as the audit's Phase 3.5
   row notation suggested).
2. Ratify BD-M5 + BD-M4 + BD-M3 + BD-M2 + BD-M1-r + BD-BR + the
   BD-S3…BD-S31 set (carried).
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
  pd-s17 (commodities-backtest-core + commodities-tiles) imports were
  M6's and are DONE (the codemod re-anchored them to
  ../src/features/commodities/...); pd-s18 (currencies) is M7's.**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The bundle topology post-M6: one chunk-name delta (the entry), zero
  logic delta** — the entry chunk changed (`index-CgbcFzAJ` →
  `index-WR9bNacU`, the App.tsx lazy-path string); the CommoditiesPage
  chunk byte-identical local-vs-live AND byte-identical to the baseline
  (hash basename `PlTCRZCw` UNCHANGED); the PriceDetails chunk
  (Phase 2 shared, NOT moving) hash basename `D7X6gwOo` UNCHANGED;
  the 93-chunk count and every other budget row unchanged. Phase 3's
  remaining moves (M7+) keep the same basename discipline — BUT a
  domain whose shared cross-route module co-locates may hit the same
  chunk-merger drift as M5 (the M5 lesson above); M6 confirmed the
  LOWER risk for domains whose shared module is already in shared/.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix).
- The pure-comment path references (UsGlobalReachGroup +
  DollarStrength — "src/shared/gauges.ts" in comments) are still
  Phase 7's light header pass; M6's commodities move added none (the
  moved files' headers already say what each file is).
- The `m3-live-verify.cjs` file-level eslint-disable (BD-M4 D0 /
  chore `99ba8c38`) is the established pattern for any future cjs
  node script — do NOT extend the eslint scope for one file.

---

## The M7 next-session prompt (modularization Phase 3.5 — currencies)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M7 — modularization Phase 3.5: the currencies domain (the
fifth Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 5
currencies + Deliverable 1's currencies rows + the N1–N18 cross-domain
map (esp. N7 lib/fx.ts shared snapshot client — already shared since
Phase 2; N8 lib/fx-presentation/rules.ts — currencies owns it, global
imports it as a mirror; N17 basket.ts — currencies owns it, shared
derived.ts imports it as a documented edge) + risks R4/R5/R8/R9) →
docs/HANDOFF.md → CHANGELOG [2026-11-15] M6 → docs/DECISIONS.md BD-M6.

FIRST, before touching anything: run `pnpm gates` once and record the
numbers (the M6 close: 9/9, suite 15,298, IDENTICAL to the M5 close —
ZERO delta). If the baseline is red, STOP and report — never start a
phase on a red baseline. ENVIRONMENT NOTE: this sandbox's `skills/`
folder sits at the PARENT of the Currena repo (not inside it) — the
M3-era lint-gate noise does NOT apply; no parking needed. If a future
sandbox injects `skills/` INSIDE the repo root, park it outside during
gates runs (BD-M3 D4), never commit it.

IF the owner's kickoff includes the Currena Cloudflare deploy token
(the sedanama-ir account): re-check the deploy-lock first per
docs/DEPLOY.md — production should be at 7625c2f3 @ 100% (the M6
close). If it is, NO deploy is needed before the phase (production ==
origin/main deployed surface); only deploy after the phase if the
gates are green. If no token: skip this paragraph, note it in the
handoff.

The phase (audit §"Phase 3" item 5 — currencies: 20 web files incl.
fx-presentation/ + world-currencies/display.ts + engine fx/ (16) +
basket + 2 adapters frankfurter, cofer):
- Web side: the currencies inventory rows into
  apps/web/src/features/currencies/ (FLAT — the M3 usa + M4 world-
  markets + M5 australia + M6 commodities convention): CurrenciesPage
  (+ test), CurrenciesTierCards, CurrenciesPairBoard,
  CurrenciesRuleLights, currencies-tiles (+ test),
  currencies-backtest-core (+ test), currencies-copy-pin test, the
  6-file lib/fx-presentation/ subfolder (format, headline, pairs,
  plain, rules, sentences — PRESERVED as features/currencies/fx-
  presentation/ per the BD-M5 D1 named-cluster rule, OR flattened per
  the BD-M4 D1 flat convention — the next session decides per its own
  consistency call; the audit skeleton is a proposal, not a contract),
  world-currencies/display.ts. Per the audit's Deliverable 1
  "currencies" rows. VERIFY the exact 20-file count (the M6 session
  verified 17-18; the remainder may include a lib/fx-presentation.ts
  barrel file separate from the subfolder, or additional currencies
  files — enumerate before the move).
- Engine side: the 16-file fx/ board job into
  packages/insights/src/domains/currencies/fx/ (subfolder PRESERVED +
  barrel, the M3 tic/ + M4 markets/ + M5 markets-au/ convention — the
  fx/ job HAS a barrel + the exports-map ./fx entry points at it,
  UNLIKE M6 commodities which had NO board job); basket.ts (currently
  at packages/insights/src/basket.ts — the engine root) →
  domains/currencies/basket.ts (the N17 documented edge: shared/
  adapters/derived.ts imports basket — re-anchor relative); the 2
  adapters (frankfurter, cofer + co-located cofer.test) into
  domains/currencies/adapters/.
- The exports-map: ./fx + ./fx/definitions entries REPOINT to
  ./src/domains/currencies/fx/{index,definitions}.ts (entry NAMES
  frozen — R4; apps/api + apps/markets needed ZERO edits, proven by
  typecheck). Same-commit JSON edit (the M3/M4/M5 pattern).
- The pd-s18 backtest script imports (apps/web/scripts/pd-s18-
  backtest.ts) update in the same commit (the codemod re-anchors the
  currencies-backtest-core import automatically — verify). NOTE: the
  audit's Phase 3.5 row notation "pd-s10/s17" is WRONG — pd-s10 is
  USA (M3's, imports ../src/features/usa/usa-backtest-core), pd-s17 is
  commodities (M6's, imports ../src/features/commodities/commodities-
  backtest-core + commodities-tiles), pd-s18 is currencies (M7's,
  imports ../src/routes/page-division/currencies-backtest-core —
  verified this session). The M7 codemod re-anchors pd-s18.
- The N7 edge: lib/fx.ts (the FX snapshot client) is ALREADY in
  shared/lib/ (Phase 2) — CurrenciesPage + GlobalPage + legacy world-
  feeds all import it from shared. After M7 this stays a
  currencies→shared + global→shared edge (already cross-domain since
  Phase 2, relative rewrites only — depth-invariant NO-OP if the
  importer stays at src depth 2, which it does for the page files).
- The N8 edge: lib/fx-presentation/rules.ts — currencies owns it
  (moves to features/currencies/fx-presentation/rules.ts OR
  features/currencies/rules.ts per the flatten-or-preserve decision);
  global imports it as a mirror (global-tiles + global-backtest-core
  in routes/page-division/, NOT yet moved). The codemod re-anchors the
  global→currencies edge (the path STRUCTURE differs even though src
  depth is invariant — the M6 N1 lesson: when the target is a sibling
  under features/, the relative spec shortens).
- The N17 edge: basket.ts moves from engine root to
  domains/currencies/basket.ts; shared/adapters/derived.ts imports it
  as a documented edge (shared→currencies). The codemod re-anchors
  derived.ts's import (the path STRUCTURE differs — recomputed via
  path.relative).
- The import rewrites via the M6 codemod method (scripts/
  m6-commodities-codemod.mjs is the persisted pattern: bidirectional
  re-anchoring, existence-checked candidates, COMPUTED fs/URL depths —
  never hand-count ../; grep for ?raw query imports + fs/URL path
  strings + dynamic import() calls + inline import('...') type refs +
  join(__dirname/HERE/here, ...) fixture paths per moved file BEFORE
  the gates run — the M5-sharpened BD-M4 D4 lesson, BD-M5 D4,
  INHERITED cleanly by M6 — NO mid-phase red gates runs this session).
  EXPECTED manual edit: App.tsx lazy
  import('./routes/page-division/CurrenciesPage') →
  import('./features/currencies/CurrenciesPage') (the
  dynamic-import() regex gap — BD-M4 D4). Verify the exports-map
  ./fx + ./fx/definitions JSON edits. Grep for R8 new-URL fixture
  traps + inline import('...') type refs + join(__dirname) fixture
  paths in the moved files (the fx.test.ts + cofer.test.ts +
  frankfurter test if any + the fx-presentation tests if any).
- The Persian-copy manifest re-key: run `pnpm copy:audit` post-move;
  re-key any REMOVED+NEW pair (BOTH the id + source for hardcoded.*
  path-encoded entries, source-only for technical.* semantic-key
  entries — the BD-M5 D5 extension; M6 had ZERO, M7 may have some —
  the fa dictionary has many pd.currencies.* + fx.* entries with
  semantic ids, but check for hardcoded.* literals in the moved
  CurrenciesPairBoard/CurrenciesRuleLights/display.ts files).
- NO renames anywhere (the bundle-budget gate matches route-module
  basenames). Tests move WITH their subjects.
- CHUNK-MERGER WATCH (the M5 lesson, BD-M5 D3 + the M6 LOWER-risk
  confirmation): grep the baseline dist for the currencies chunk
  basename(s) before the move. M6 confirmed LOWER risk for domains
  whose shared cross-route module is already in shared/ — BUT
  currencies' fx-presentation/ subfolder (rules.ts is imported by
  global-tiles + global-backtest-core, the N8 edge) MAY co-locate
  under features/currencies/ and trigger a Rollup domain-prefix
  grouping merger (similar to M5's markets-au client merger). Grep
  the baseline chunks for /currenc/ + /Currenc/ + /fx-/ + /fx-pre/
  basenames + plan accordingly. A vite.config.ts manualChunks pin is
  Phase 6 (M15), out of scope.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green; the exports map ./fx +
./fx/definitions + all path references updated in the same commits as
their moves. Bookkeeping per AGENTS.md §10 (HANDOFF rewrite +
CHANGELOG + DECISIONS) and the M8 pointer (Phase 3.6 — gold: 22 web
files + engine gold modules (12 + tests) + 5 adapters; gold-score
already shared since Phase 2 constraint; pd-s5 — verify).
```
