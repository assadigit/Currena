# HANDOFF — Currena current state & next steps

## Current state (after the M15 session)

**Modularization Phase 6 (config + chunking verification pass — NO moves) DELIVERED.** The M14 modularization state is VERIFIED STABLE: every config the moves relied on still resolves, the bundle-budget gate (12 basename patterns) is green, the dist topology is byte-identical to the M14 close (93 assets, 80 .js chunks, ZERO delta), the build is deterministic (two rebuilds produce identical hashes), and production == the M14 deploy (`3ffcdd6b`, unchanged — the M15 commit is dev-only). The ONE opportunistic fix landed: `scripts/local-snapshot-preview.mjs:12`'s hardcoded nonexistent absolute path `/home/z/my-project/Currena` replaced with `resolve(import.meta.dirname, '..')` (repo-relative resolution; Node ≥ 20.11 provides `import.meta.dirname` natively). The fix is dev-only (the script is a manual Step-4 real-data verification feed — NOT imported by any production code in apps/api, apps/web, apps/markets, or packages/*, and NOT wired into any package.json script or CI workflow), so NO deploy was required and NONE was performed.

**Phase 3 CLOSED at M12; Phase 4 (insights-legacy) DELIVERED at M13; Phase 5 (founding tools) DELIVERED at M14; Phase 6 (config + chunking verification) DELIVERED at M15.** M16 (Phase 7: the documentation pass) is next. Progress: modularization M15/16 · 1 remaining.

## The green baseline — the M15 close record (2026-11-17)

- **Gates:** 9/9 GREEN ×2 runs (2m 37s with the fix applied; 2m 39s on the clean tree). secret scan (1092 files) · typecheck (6 packages) · lint (0/0) · copy:audit (clean) · narrator vocabulary (193×2 + 56×2) · narrator eval (50 checks) · layer1 strict (11969/11969) · **full test suite 15,284** (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13212) · build + bundle budget (entry 273.95/82.94 + 12 Insights lazy chunks within budget).
- **Suite delta from the M14 close:** ZERO (15,284 → 15,284, IDENTICAL to the M14 baseline — the M7′→M14 streak EXTENDED through M15).
- **Chunk count:** 93 assets (80 .js + 13 non-js: 4 woff2 + 4 woff + 1 markets + 1 map + 1 icons + 1 css + 1 artwork) — STABLE from the M14 close (ZERO delta).
- **Build determinism:** VERIFIED — two rebuilds from the same post-M15 source produce identical chunk hashes (the M13+M14 determinism finding EXTENDS through M15).
- **Production:** currena-api Version ID `3ffcdd6b` (created 2026-11-17T02:42:47Z, @ 100% — the M14 deploy, UNCHANGED). Deploy-lock re-checked FIRST (D-43 holds — no deploy newer than the M14 deploy). The M15 commit `52e2f7a2` touches ONLY `scripts/local-snapshot-preview.mjs` (dev-only — NOT in the web dist, NOT in the API/markets worker bundles) → production code UNCHANGED → NO deploy needed (the done-criteria's "IF any production code changed" clause NOT triggered).
- **origin/main HEAD:** `52e2f7a2` (the M15 fix commit). Production == the M14 deploy (the last commit that changed production code is `d15555bb`, the M14 move; the two subsequent commits `14105a9a` docs-only + `52e2f7a2` dev-only-scripts change NO deployed code).

## The M15 session record (what was done)

1. **Environment setup** (the M14 sandbox pattern): the repo was re-cloned to `/home/z/Currena` (the sandbox's `/home/z/Currena` from M14 was not retained between sessions); pnpm@10.34.5 installed via `npm install -g pnpm@10.34.5` (matching the packageManager pin); `pnpm install` (580 packages, 7.9s). No `skills/` folder injected INSIDE the repo root (BD-M3 D4 satisfied — the skills/ folder lives at `/home/z/my-project/skills` in the Next.js scaffold dir, OUTSIDE the Currena repo).
2. **Token verified** (HTTP 200 on api.github.com/user — the stranded-M7 lesson; login `assadigit`, the owner's account). Token passed in the URL for `git clone` (the M12 env-var-prefix lesson).
3. **origin/main verified:** `14105a9a` (M14 bookkeeping, docs-only — CHANGELOG + HANDOFF + DECISIONS, no AGENTS.md, no code; `git show --stat HEAD` confirmed: only CHANGELOG.md + docs/DECISIONS.md + docs/HANDOFF.md) + `d15555bb` (M14 move, HEAD~1). Local == origin/main == `14105a9a`.
4. **Production verified == M14 deploy:** currena-api latest deployment `450da21b` carries version_id `3ffcdd6b-f2ea-4ef5-9957-7c1d939e9df5` @ 100%, created 2026-11-17T02:42:47.143249Z (exactly the M14 deploy timestamp). No deploy newer than this (deploy-lock holds, D-43).
5. **Baseline gates:** `pnpm gates` 9/9 GREEN, suite 15,284 — the M14 close numbers EXACTLY (2m 40s). NO red baseline.
6. **Phase 6 verification inventory (the audit's Phase 6 row — all items VERIFIED, no moves):**
   - **vite.config.ts manualChunks** (line 201): `manualChunks: undefined` CONFIRMED. Chunking rides the route-level lazy imports (the M14 chunk-merger cascade mechanism — the entry↔chunk cross-reference graph is emergent under `manualChunks=undefined`; each tool route chunk cross-references the entry via `from"./index-<hash>.js"`). App.tsx dynamic import paths CONFIRMED correct: 8 lazy tool routes (Calculator:34, History:35, BatchConverter:37, Splitter:39, Settle:40, Receipt:41, About:42, Converter:48 — all `./features-tools/<domain>/`) + LiveRates EAGER (:25, static `import { LiveRates } from './features-tools/live-rates/LiveRates'`) + 10 other domain lazy routes (insights-legacy, global, gold, world-markets, usa, europe, asia-pacific, australia, commodities, currencies, economic-linkages) + PagePlaceholder fallback (:50). All correct.
   - **bundle-budget regexes** (`scripts/check-bundle-budget.mjs`): 13 lines = 1 entry budget + **12 basename patterns** (Insights + GlobalPage + GoldPage + WorldMarketsPage + AustraliaPage + shared + CommoditiesPage + CurrenciesPage + UsaPage + EuropePage + AsiaPage + tic). Green because nothing was renamed in any phase (R5 — gate 8 doubles as the rename detector: vite names chunks after the source basename, no renames → chunk basenames stable). The tool chunks (Converter-*.js, LiveRates-*.js — LiveRates is eager, in the entry, no separate chunk — About/BatchConverter/Calculator/Converter/History/Receipt/Settle/Splitter + AlertsDialog) exist in dist and match the M14 hashes. The entry + all 12 Insights lazy chunks within budget.
   - **index.html** (line 65): `<script type="module" src="/src/main.tsx"></script>` — main.tsx never moved. CONFIRMED.
   - **PWA manifest/shortcuts** (vite.config.ts): shortcuts use hash-router URLs (`/#/live-rates`, `/#/calculator`) — unaffected by the moves (the SPA router picks the route up on boot). CONFIRMED.
   - **eslint globs** (`eslint.config.mjs:49`): `apps/web/src/**/*.{ts,tsx}` RECURSIVE — covers features/, shared/, features-tools/, infrastructure/ under src/ (the M1 probe-verified finding recorded in the config comment at lines 42-47). No scope extension required. CONFIRMED.
   - **tsconfig includes:** apps/web `["src", "scripts"]` RECURSIVE (line confirmed); packages/insights `["src"]` RECURSIVE. Both cover the moved files at their new paths. CONFIRMED.
   - **gates.mjs layer1 path** (line 100): `src/shared/components/layer1/layer1.test.ts` — file EXISTS at that path (the M2 update when layer1 moved). CONFIRMED.
   - **persian-copy SOURCES/SWEEP_ROOTS** (`scripts/lib/persian-copy.mjs`): SOURCES point at the MOVED i18n paths (`apps/web/src/shared/i18n/insights-copy-fa.ts`, `apps/web/src/shared/i18n/fa.ts`, `insights-copy-en.ts`, `en.ts` — the Phase 2 update). SWEEP_ROOTS includes `apps/web/src` (RECURSIVE via `listSourceFiles` which recurses into subdirectories — sweeps ALL moved files at their new paths under features/, features-tools/, shared/, etc.; tests excluded by `/.test./` filter). CONFIRMED.
   - **exports map** (`packages/insights/package.json`): 16 entries, ALL resolve (every target path exists), ALL point at engine paths under `packages/insights/src/` (., ./validation, ./adapters, ./store, ./narrator, ./markets, ./markets/definitions, ./markets-au, ./markets-au/definitions, ./fx, ./fx/definitions, ./tic, ./prices, ./ingest, ./page-division, ./gf-p0-proposed). NONE for tools/shared (all 49 M14-moved files are web files). Final-reviewed. CONFIRMED.
   - **two wrangler `main` paths:** apps/api/wrangler.jsonc `main: "src/index.ts"` + apps/markets/wrangler.jsonc `main: "src/index.ts"` (both relative to the app root; both entry files exist). Apps untouched. CONFIRMED.
7. **Opportunistic fix landed:** `scripts/local-snapshot-preview.mjs:12` — the hardcoded `const REPO = '/home/z/my-project/Currena'` (nonexistent — the repo is at `/home/z/Currena`) replaced with `const REPO = resolve(import.meta.dirname, '..')` (the script lives under `scripts/`, one level below the repo root). Added `import { resolve } from 'node:path'`. Verified: `node --check` parses clean; REPO resolves to `/home/z/Currena` (the actual clone path); all three dynamic import targets (run.ts, data.ts, rung2.ts) exist at the resolved path. Dev-only — NOT imported by any production code (apps/api, apps/web, apps/markets, packages/* — verified by grep) and NOT wired into any package.json script or CI workflow.
8. **Final dist topology RECORDED as the post-modularization baseline:** 93 assets (80 .js + 13 non-js). Entry `index-B6C4rXg4.js` (matches the M14 production hash EXACTLY — live-verified: `curl https://currena.ir/` returns the same entry filename). Tool chunks: About-Cxq-T2D3, AlertsDialog-5VHXfKm6, BatchConverter-Dnf4d04l, Calculator-CsAUekSc, Converter-CJdZYPV-, History-5C4DpTr-, Receipt-B3K6UgZl, Settle-BF0f4-BM, Splitter-BZDH9EKY (all basename-keyed, hashes match M14). Insights-Bg3BG4Nj, the 10 page-route chunks, the shared/tic chunks — all present. sw.js 10433 bytes (matches the M13 record). Build DETERMINISTIC (two rebuilds → identical hashes). ZERO chunk changes vs M14 (the verification confirms the M14 state is stable).
9. **Regeneration trio (drift check):** `pnpm registry:generate` (187 indicators — matches the M14 record) + `pnpm placement:generate` (PLACEMENT.generated.md 40507 chars stable — matches M14) + `pnpm s24:d9-audit` (D-9 CONDITION MET). `data/indicators.json` sha256 IDENTICAL pre/post regeneration (ZERO drift). `git status` showed ONLY the local-snapshot-preview.mjs fix (no generated-doc drift).
10. **Gates ×2:** run 1 (with the fix applied, uncommitted) 9/9 GREEN, suite 15,284, 2m 37s; commit `52e2f7a2` landed; run 2 (clean tree, git status empty) 9/9 GREEN, suite 15,284, 2m 39s. Both green.
11. **Deploy decision:** the M15 commit is dev-only (touches ONLY `scripts/local-snapshot-preview.mjs`, which is NOT in the web dist, NOT in the API worker bundle, NOT in the markets worker bundle). Production code UNCHANGED → NO deploy needed. Deploy-lock re-checked FIRST (D-43 holds: production still `3ffcdd6b`, no newer deploy). Live-verified production: / 200 (4835 bytes) + /converter 200 + /live-rates 200 + /api/insights/pages/global 200 (24491 bytes) + /assets/Converter-CJdZYPV-.js 200 + /assets/index-B6C4rXg4.js 200 — all serving the M14 deploy's hashes.
12. **Commit + push:** `52e2f7a2` (1 file: scripts/local-snapshot-preview.mjs, 7 insertions 1 deletion). Pushed to origin/main (`14105a9a..52e2f7a2`) — verified (local HEAD == origin/main == `52e2f7a2`).

## Where the modularization state now stands (the Phase 6 verification map)

The post-modularization state (after M2–M14, verified stable at M15):

- **apps/web/src/** — the modularization skeleton roots (M1) + the 11 domain moves (M3–M14):
  - `features/` — 11 domains: insights-legacy (M13, 46 files), global (M12, 16), gold (M8, 41), world-markets (M7, 39), australia (M9, 25), commodities (M10, 15), currencies (M11, 39), usa (M3, 34), europe (M6, 11), asia-pacific (M5, 15), economic-linkages (M4, 5).
  - `features-tools/` — 9 tool domains (M14, 49 files): about/batch/calculator/splitter/history/converter/live-rates/receipt/settle.
  - `shared/` — the shared layer (M2, 81 web files): components/, config/, hooks/, lib/, i18n/, ui/.
  - `infrastructure/` — the 16 infrastructure files (M2).
  - `router/`, `lib/`, `components/Header.tsx`, `components/Footer.tsx`, `components/ErrorBoundary.tsx` — src-root (no move, 2 files per the audit).
- **packages/insights/src/** — the engine: `shared/` (75, M2), `domains/` (80, M3–M11), `page-division/` (7, stays), `narrator/` (23, stays), root `index.ts` barrel (1, stays).
- **apps/api/src/** — LEAVE ALONE (52 files, route-split, DI-composed).
- **apps/markets/src/** — LEAVE ALONE (4 files, scheduled-only cron).
- **packages/core/src/** — LEAVE ALONE (23 files, the money-tool cores + zod schemas).
- **packages/scraper/src/** — LEAVE ALONE (11 files, TGJU + Frankfurter + RateStore port).

## Operational notes worth carrying (M15 additions in bold)

- **The Phase 6 verification confirms the M14 state is STABLE.** No moves this phase → ZERO chunk changes (93 assets, 80 .js, byte-identical to M14). The build is deterministic (two rebuilds → identical hashes). The config inventory (vite manualChunks, bundle-budget regexes, index.html, PWA shortcuts, eslint globs, tsconfig includes, gates.mjs layer1 path, persian-copy SOURCES/SWEEP_ROOTS, the 16-entry exports map, the two wrangler main paths) — ALL verified, ALL resolve. The M2–M14 moves left NO dangling config references.
- **The local-snapshot-preview.mjs fix pattern: `resolve(import.meta.dirname, '..')`.** When a script needs the repo root, resolve it from the script's own location (Node ≥ 20.11 provides `import.meta.dirname` natively). NEVER hardcode an absolute clone path — it breaks on every other machine. The script lives under `scripts/` (one level below root), so `resolve(import.meta.dirname, '..')` gives the repo root. This is the dev-tooling analog of the M2→M14 codemod's `path.relative` method for production code.
- **Dev-only fixes need NO deploy.** The done-criteria's "production == origin/main HEAD after the post-phase deploy IF any production code changed" clause has a truthful opposite: when the commit touches ONLY files outside the deployed bundles (scripts/, docs/, configs not read at runtime), production code is UNCHANGED and NO deploy is needed. Verify by: (a) grep for the changed file as an import target across apps/api, apps/web, apps/markets, packages/*; (b) confirm the file is not in the web dist (vite only bundles files reachable from main.tsx + index.html); (c) confirm the file is not in the worker bundles (wrangler only bundles files reachable from the `main` entry). For `scripts/local-snapshot-preview.mjs`: all three checks confirmed dev-only.
- **The chunk-merger cascade mechanism (M14's FOURTH outcome shape) is the stable post-modularization property.** Under `manualChunks=undefined`, the entry↔chunk cross-reference graph is emergent: each lazy-loaded route chunk imports shared modules (locale/router/ui) from the entry, so the entry's filename is embedded in every cross-referencing chunk (`from"./index-<hash>.js"`). When the entry re-hashes (because its own dynamic import() specs re-anchor, as in M14), the cascade flows OUTWARD to every cross-referencing chunk. This is now the RECORDED BASELINE — no moves this phase, so the cascade did NOT fire. Future phases (none planned — M16 is docs-only) would re-trigger it only if a move changes the entry's dynamic import() specs.

## Owner-side levers waiting

- **None blocking.** The modularization Phase 6 is DELIVERED. Phase 7 (M16) is the documentation pass (docs-only, no code moves, no deploy needed) — the LAST modularization session.
- The §19.6 retirement (delete features/insights-legacy/ + remove the App.tsx:43 lazy route + the selfcheck.ts:53 import + the cross-domain consumer edges + the orphaned usGlobalReach dictionary templates) remains a FUTURE owner decision (post-modularization).

## Known state worth knowing

- **The exports map** (packages/insights/package.json): 16 entries, ALL engine paths, ALL resolve (final-reviewed at M15). NONE for tools/shared.
- **vite.config.ts:** `manualChunks: undefined` (chunking rides the route-level lazy imports; the entry↔chunk cross-reference graph is emergent — the M14 chunk-merger cascade mechanism). Verified stable at M15.
- **The dist topology baseline (post-modularization, recorded at M15):** 93 assets (80 .js + 13 non-js). Entry `index-B6C4rXg4.js` (273.95 kB raw / 82.94 kB gz). 12 Insights lazy chunks within budget. Tool chunks basename-keyed (Converter-CJdZYPV-, About-Cxq-T2D3, BatchConverter-Dnf4d04l, Calculator-CsAUekSc, History-5C4DpTr-, Receipt-B3K6UgZl, Settle-BF0f4-BM, Splitter-BZDH9EKY, AlertsDialog-5VHXfKm6). sw.js 10433 bytes. Build deterministic.
- **The codemods** (scripts/m{NN}-*-codemod.mjs): m3 through m14 persisted. The latest is `scripts/m14-tools-codemod.mjs`. No new codemod at M15 (no moves).
- **Persian-copy manifest:** 8006 entries, sources are the dictionaries (fa.ts 1492 + insights-copy-fa.ts 6277) + calendar (36) + a handful of hardcoded-literal source files. collectState().sweep = 206 hits across 20 source files (UNCHANGED from M14 — no moves this phase).

## The M16 next-session prompt (modularization Phase 7 — the documentation pass)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M16 — modularization Phase 7: the documentation pass (NO moves
— a docs-only session, the audit's Phase 7 row, the LAST modularization
session).

Read in this order: AGENTS.md (§2 · §5 · §7 · §8 · §10 · §11) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 7" + Deliverable 1's
final-state expectation) → docs/HANDOFF.md (the M15 version — this file) →
CHANGELOG [2026-11-17] M15 → docs/DECISIONS.md BD-M15.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′). If
   the token is invalid: STOP, tell the owner, do NOT start. Pass the
   token in the URL (https://$GH_TOKEN@github.com/…) OR export it FIRST
   in the parent shell — the M12 env-var-prefix lesson.
2. Verify origin/main has the M15 fix commit 52e2f7a2 (dev-only —
   scripts/local-snapshot-preview.mjs, 1 file, NOT in any production
   bundle), then the M15 bookkeeping commit (docs-only — CHANGELOG.md +
   docs/HANDOFF.md + docs/DECISIONS.md, no AGENTS.md, no code; `git log
   --oneline -2 origin/main`; confirm via `git show --stat HEAD`), AND
   production is STILL the M14 deploy: currena-api Version ID 3ffcdd6b
   (created 2026-11-17T02:42:47Z; the deploy-lock; the M15 commit is
   dev-only — it does NOT change deployed code, so NO deploy was
   performed and production stays at the M14 deploy). ANY code commit
   beyond the bookkeeping that touches production code, or ANY
   production version newer than the M14 deploy: STOP and report.
3. Run `pnpm gates` once and record the numbers (the M15 close: 9/9,
   suite 15,284; ZERO delta from M14). If the baseline is red, STOP and
   report. ENVIRONMENT NOTE (M15): the repo was re-cloned to
   /home/z/Currena (the M14 clone was not retained between sessions);
   pnpm@10.34.5 installed via `npm install -g pnpm@10.34.5`. If a
   skills/ folder is injected INSIDE the repo root, park it outside
   during gates runs (BD-M3 D4), never commit it.

The phase (audit §"Phase 7" — the documentation pass, NO moves, NO code):
- UPDATE AGENTS.md §11 "Project facts" (currently "(Not yet filled in.)")
  — fill from the post-modularization state: the tech stack, the
  folder layout (the features/ 11 domains + features-tools/ 9 domains +
  shared/ + infrastructure/ + the engine shared/ + domains/ + the
  apps/api + apps/markets + packages/core + packages/scraper layout),
  hosting (Cloudflare Workers — currena-api + currena-markets), default
  branch (main), deploy method (`pnpm --filter @currena/api run deploy`
  — the `run` required under pnpm 10), commands to run/test/deploy
  (pnpm gates, pnpm -r typecheck, pnpm lint, pnpm -r test, pnpm
  --parallel dev), database (RATES KV via the RateStore interface),
  key folders, and standing limits (the §21 portwatch window — never
  run Tuesdays 11:00–14:00 UTC; the deploy-lock re-check FIRST — D-43;
  the wrangler 10013 retry rule).
- UPDATE README.md — the "where things live" section reflecting the
  post-modularization folder layout (the features/ + features-tools/ +
  shared/ + infrastructure/ skeleton + the engine shared/ + domains/).
- UPDATE docs/page-division/README.md — the "where things live" section
  (the engine's page-division/ stayed put; the web page-division files
  moved to features/global/ at M12).
- FILE-HEADER "lives here" comments — a LIGHT pass: the moved files
  already say what each file is; add the folder-scope line ONLY where
  the header names a stale path (the M2 HANDOFF flagged two pure-comment
  path references left for Phase 7: UsGlobalReachGroup + DollarStrength
  — verify both still apply after M13 dissolved the components→routes
  inversion; the M13 CHANGELOG noted both are now siblings under
  features/insights-legacy/). Do NOT mass-add headers — only fix stale
  path references in existing headers.
- UPDATE docs/HANDOFF.md (rewrite for M16), CHANGELOG.md (the M16
  entry), docs/DECISIONS.md (BD-M16 — record the D1–D10 skeleton
  deviations + the N-map if not already recorded, + the documentation
  decisions made this session).

Gates: full run ×1 (docs-only session — one green run suffices; the docs
changes touch no code, no tests, no build). No deploy (docs-only —
production code UNCHANGED, the M14 deploy 3ffcdd6b stays current).

Done-criteria: AGENTS.md §11 filled; README + docs/page-division/README.md
"where things live" sections updated; file-header stale-path comments
fixed (the UsGlobalReachGroup + DollarStrength flagged sites, if still
applicable); gates 9/9, suite count identical to the M15 baseline
(15,284); every commit green + PUSHED (verify the push!); NO deploy
needed (docs-only); bookkeeping per AGENTS.md §10 (HANDOFF rewrite +
CHANGELOG + DECISIONS) with the "modularization COMPLETE" pointer (the
16-session program M1–M16 done; progress: modularization M16/16 · 0
remaining). The §21 portwatch window note (never run Tuesdays 11:00–14:00
UTC) + the deploy-lock re-check FIRST (D-43) + the wrangler 10013 retry
rule carry forward as standing limits — but NO deploy this session.
```
