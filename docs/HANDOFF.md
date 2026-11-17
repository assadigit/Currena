# HANDOFF — Currena current state & next steps

## Current state (after the M16 session)

**Modularization Phase 7 (the documentation pass — NO moves, NO code) DELIVERED. The 16-SESSION MODULARIZATION PROGRAM M1–M16 IS COMPLETE (progress: modularization M16/16 · 0 remaining).** The post-modularization state is now DOCUMENTED for navigation: AGENTS.md §11 "Project facts" is filled (the tech stack, the hosting, the deploy method, the commands, the RATES KV, the key folders, + the standing limits carried forward every session); README.md + docs/page-division/README.md each gained a "Where things live" section (the post-modularization folder layout); the M2-HANDOFF-flagged DollarStrength.tsx header stale-path reference is fixed (the sibling UsGlobalReachGroup flag is MOOT — the file was deleted in M13's chore(M0-pre)). The D1–D10 skeleton deviations were ALREADY recorded (BD-M1 Decision 5 + BD-M0 Decision 3 — confirmed, not re-recorded); the N1–N18 cross-domain edge map is consolidated in BD-M16 (it lived in the audit + was referenced piecemeal across the BD entries; it is now recorded as a single block with a pointer to the audit). Docs-only + ONE pure-comment .tsx edit (ZERO runtime/build impact — comments are stripped) → NO production code changed → NO deploy needed → production STAYS at the M14 deploy `3ffcdd6b`.

**Phase 3 CLOSED at M12; Phase 4 (insights-legacy) DELIVERED at M13; Phase 5 (founding tools) DELIVERED at M14; Phase 6 (config + chunking verification) DELIVERED at M15; Phase 7 (documentation) DELIVERED at M16.** The modularization program is COMPLETE.

## The green baseline — the M16 close record (2026-11-17)

- **Gates:** 9/9 GREEN (2m 45s, run 09:20:04). secret scan (1092 files) · typecheck (6 packages) · lint (0/0) · copy:audit (clean) · narrator vocabulary (193×2 + 56×2) · narrator eval (50 checks) · layer1 strict (11969/11969) · **full test suite 15,284** (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13212) · build + bundle budget (entry 273.95/82.94 + 12 Insights lazy chunks within budget).
- **Suite delta from the M15 close:** ZERO (15,284 → 15,284, IDENTICAL to the M15 baseline — the M7′→M15 streak EXTENDED through M16; the docs-only + pure-comment changes touch no code, no tests, no build).
- **Chunk count:** 93 assets (80 .js + 13 non-js) — STABLE from the M15 close (ZERO delta; the DollarStrength.tsx comment edit is stripped at build time — byte-identical dist).
- **Build determinism:** holds (the comment edit does not survive bundling — the dist is byte-identical to the M15 close).
- **Production:** currena-api Version ID `3ffcdd6b` (created 2026-11-17T02:42:47Z, @ 100% — the M14 deploy, UNCHANGED through M15 + M16). Deploy-lock re-checked FIRST at session open (D-43 holds — no deploy newer than the M14 deploy). The M16 commits (`0f1cf4f6` Phase 7 docs + the bookkeeping commit) touch ONLY docs (.md files) + ONE pure-comment .tsx edit (DollarStrength.tsx — comments stripped at build, NOT in any production bundle as a runtime change) → production code UNCHANGED → NO deploy needed (the done-criteria's "IF any production code changed" clause NOT triggered).
- **origin/main HEAD after commit 1:** `0f1cf4f6` (the Phase 7 documentation pass — 4 files: AGENTS.md + README.md + docs/page-division/README.md + DollarStrength.tsx header). The bookkeeping commit (this session's HANDOFF + CHANGELOG + DECISIONS update) lands on top.

## The M16 session record (what was done)

1. **Environment setup** (the M15 sandbox pattern): the repo re-cloned to `/home/z/Currena` (the sandbox does not retain the clone between sessions); pnpm@10.34.5 installed via `npm install -g pnpm@10.34.5` (matching the packageManager pin); `pnpm install` (580 packages, 7.8s). No `skills/` folder injected INSIDE the repo root (BD-M3 D4 satisfied — the skills/ folder lives at `/home/z/my-project/skills` in the Next.js scaffold dir, OUTSIDE the Currena repo).
2. **Token verified** (HTTP 200 on api.github.com/user — the stranded-M7 lesson; login `assadigit`, the owner's account). Token passed in the URL for `git clone` (the M12 env-var-prefix lesson).
3. **origin/main verified:** `52e2f7a2` (M15 fix, dev-only — scripts/local-snapshot-preview.mjs, 1 file) + `3ae3a57a` (M15 bookkeeping, docs-only — CHANGELOG + HANDOFF + DECISIONS, no AGENTS.md, no code; `git show --stat HEAD` confirmed) + production STILL the M14 deploy `3ffcdd6b` (created 2026-11-17T02:42:47Z, @ 100%; the deployments API showed the newest deployment carrying version_id `3ffcdd6b` — no deploy newer than the M14 deploy; deploy-lock holds, D-43).
4. **Baseline gates:** `pnpm gates` 9/9 GREEN, suite 15,284 — the M15 close numbers EXACTLY (2m 45s). NO red baseline.
5. **Phase 7 documentation work (the audit's Phase 7 row — NO moves, NO code):**
   - **AGENTS.md §11 "Project facts"** filled (was "(Not yet filled in.)"): the tech stack (TypeScript 5 monorepo, pnpm@10.34.5, Node ≥ 20, Hono on Cloudflare Workers + Vite React PWA, the three pure packages), the hosting (currena-api + currena-markets on Cloudflare Workers, site currena.ir), the default branch (main), the deploy method (`pnpm --filter @currena/api run deploy` — the `run` required under pnpm 10), the commands (pnpm gates, pnpm -r typecheck, pnpm lint, pnpm -r test, pnpm --parallel dev, pnpm --filter @currena/web build, the regeneration trio), the database (RATES KV via the RateStore interface), the key folders (the features/ 11 domains + features-tools/ 9 domains + shared/ + infrastructure/ + the engine shared/ + domains/ 9 + apps/api + apps/markets + packages/core + packages/scraper + docs/ + legacy/), + the standing limits (the §21 portwatch window — never run Tuesdays 11:00–14:00 UTC; the deploy-lock re-check FIRST — D-43; the wrangler 10013 retry rule; the run-required-under-pnpm-10 rule; the R5 no-renames constraint).
   - **README.md** — a "Where things live" section added (between "Where to look first" and "Quick start") reflecting the post-modularization folder layout (apps/api + apps/markets + apps/web with features/ + features-tools/ + shared/ + infrastructure/ + packages/core + packages/insights with shared/ + domains/ + page-division/ + narrator/ + packages/scraper + docs/ + legacy/), with a pointer to the audit for the full file inventory + the D1–D10 deviations + the N1–N18 map.
   - **docs/page-division/README.md** — a "Where things live" section added (between "What this program does" and "Reading order"): the engine half (`packages/insights/src/page-division/`) STAYED PUT (the engine-pages authority, R1-locked, never moves); the web half (the `routes/page-division/` files) MOVED at M12 into `apps/web/src/features/global/` (+ the per-domain `features/<domain>/` homes across M3–M14); the `routes/` folder no longer exists under `apps/web/src/`.
   - **File-header stale-path light pass** (the M2-HANDOFF-flagged sites — verify both still apply after M13): **DollarStrength.tsx** fixed — the header's `world-currencies/DollarStrength` (the implicit root changed at M13: `components/insights/` → `features/insights-legacy/`) updated to name the full post-M13 path `features/insights-legacy/world-currencies/DollarStrength` + a "Lives in" folder-scope line; the ONE pure-comment edit this session (ZERO runtime impact). **UsGlobalReachGroup** — MOOT: the file was DELETED in M13's `chore(M0-pre)` (the Gate 0 owner decision per the audit's R15 — confirmed via `find apps/web/src -iname '*UsGlobalReach*'` = none; the insights-sections/ folder has no such file); the only remaining references are historical comment prose (SectionLane.tsx:255 — describes the retired container; the insights-legacy/README.md:3 — lists it among the folder's files, a stale listing left untouched per the "light pass, no mass edits" scope). No mass header additions — only the one flagged stale-path reference fixed.
6. **Gates (the single green run):** `pnpm gates` 9/9 GREEN, suite 15,284, 2m 45s — IDENTICAL to the M15 baseline (ZERO delta; the docs-only + pure-comment changes touch no code, no tests, no build).
7. **Commit 1 + push:** `0f1cf4f6` (4 files: AGENTS.md + README.md + docs/page-division/README.md + DollarStrength.tsx header; 121 insertions, 3 deletions). Pushed to origin/main (`3ae3a57a..0f1cf4f6`) — verified (local HEAD == origin/main == `0f1cf4f6`).
8. **Deploy decision:** the M16 commits are docs-only (`.md` files) + ONE pure-comment `.tsx` edit (DollarStrength.tsx — comments stripped at build, NOT a runtime change, NOT in any production bundle as a behavioral change). Production code UNCHANGED → NO deploy needed. Deploy-lock re-checked FIRST at session open (D-43 holds: production still `3ffcdd6b`, no newer deploy).
9. **Bookkeeping (commit 2):** this HANDOFF rewrite + the CHANGELOG M16 entry + BD-M16 in DECISIONS (the D1–D10 already-recorded confirmation + the N1–N18 map consolidation + the documentation decisions made this session) + the "modularization COMPLETE" pointer.

## Where the modularization state now stands (the post-modularization map)

The post-modularization state (after M2–M14, verified stable at M15, documented at M16):

- **apps/web/src/** — the modularization skeleton roots (M1) + the 11 domain moves (M3–M14):
  - `features/` — 11 domains: insights-legacy (M13, 46 files), global (M12, 16), gold (M8, 41), world-markets (M7, 39), australia (M9, 25), commodities (M10, 15), currencies (M11, 39), usa (M3, 34), europe (M6, 11), asia-pacific (M5, 15), economic-linkages (M4, 5).
  - `features-tools/` — 9 tool domains (M14, 49 files): about/batch/calculator/splitter/history/converter/live-rates/receipt/settle.
  - `shared/` — the shared layer (M2, 81 web files): components/, config/, hooks/, i18n/, lib/, ui/.
  - `infrastructure/` — the 16 infrastructure files (M2).
  - `router/`, `lib/`, `components/Header.tsx`, `components/Footer.tsx`, `components/ErrorBoundary.tsx` — src-root (no move, 2 files per the audit).
- **packages/insights/src/** — the engine: `shared/` (75, M2), `domains/` (80, M3–M11), `page-division/` (7, stays — the engine-pages authority), `narrator/` (23, stays), root `index.ts` barrel (1, stays).
- **apps/api/src/** — LEAVE ALONE (52 files, route-split, DI-composed).
- **apps/markets/src/** — LEAVE ALONE (4 files, scheduled-only cron).
- **packages/core/src/** — LEAVE ALONE (23 files, the money-tool cores + zod schemas).
- **packages/scraper/src/** — LEAVE ALONE (11 files, TGJU + Frankfurter + RateStore port).

## Operational notes worth carrying (M16 additions in bold)

- **The modularization program is COMPLETE (M1–M16).** Every file is in its domain home; the config inventory was verified stable at M15 (NO dangling references); the documentation is now in place at M16 (AGENTS.md §11 + the two "where things live" sections + the file-header light pass). The 16-session program is done — progress: modularization M16/16 · 0 remaining.
- **AGENTS.md §11 is now the maintained project-facts section.** Future sessions read it first (after the universal rules) for the tech stack, hosting, deploy method, commands, database, key folders, + the standing limits. Keep it correct as the project evolves.
- **The "where things live" sections in README.md + docs/page-division/README.md are the navigation entry points** for the post-modularization folder layout. The full file-by-file inventory + the D1–D10 deviations + the N1–N18 map stay in the audit (`docs/modularization/MODULARIZATION-AUDIT.md`) — the READMEs point to it.
- **The file-header light pass closed the M2-HANDOFF-flagged stale-path references.** DollarStrength.tsx fixed (the one flagged site that still applied after M13); UsGlobalReachGroup moot (the file was deleted in M13's chore(M0-pre)). The lesson: a Phase-7 flag can be MOOTED by a later phase's Gate-0 delete — verify the file still exists before fixing the header.
- **The standing limits carry forward (recorded in AGENTS.md §11).** The §21 portwatch window (never run Tuesdays 11:00–14:00 UTC) + the deploy-lock re-check FIRST (D-43) + the wrangler 10013 retry rule + the run-required-under-pnpm-10 rule + the R5 no-renames constraint. These apply to ANY future session that deploys or moves files — but NO deploy was needed this session (docs-only).

## Owner-side levers waiting

- **None blocking.** The modularization program is COMPLETE. The standing owner-side levers (carried from the prior sessions, NOT part of the modularization program):
  - the **§19.6 retirement** (delete `features/insights-legacy/` + remove the App.tsx:43 lazy route + the selfcheck.ts:53 import + the cross-domain consumer edges + the orphaned usGlobalReach dictionary templates) — a FUTURE owner decision (post-modularization; Gate 0 = the owner's recorded sign-off).
  - the **external investor's review of spec §19** (the seven questions) — re-opens the page-division spec v2 work (the AF-1…AF-8 findings ride that pass).
  - the **`/converter` relocation ratification** (S1) + the BD-S3…BD-S30 decision set.
  - **triage the queued unreviewed fa strings** (the copy:audit queue).
  - **revoke or rotate the session credentials** now that the modularization development work has ended (they were used, never stored).

## Known state worth knowing

- **The exports map** (packages/insights/package.json): 16 entries, ALL engine paths, ALL resolve (final-reviewed at M15). NONE for tools/shared.
- **vite.config.ts:** `manualChunks: undefined` (chunking rides the route-level lazy imports; the entry↔chunk cross-reference graph is emergent — the M14 chunk-merger cascade mechanism). Verified stable at M15; untouched at M16.
- **The dist topology baseline (post-modularization, recorded at M15, unchanged at M16):** 93 assets (80 .js + 13 non-js). Entry `index-B6C4rXg4.js` (273.95 kB raw / 82.94 kB gz). 12 Insights lazy chunks within budget. Tool chunks basename-keyed (Converter-CJdZYPV-, About-Cxq-T2D3, BatchConverter-Dnf4d04l, Calculator-CsAUekSc, History-5C4DpTr-, Receipt-B3K6UgZl, Settle-BF0f4-BM, Splitter-BZDH9EKY, AlertsDialog-5VHXfKm6). sw.js 10433 bytes. Build deterministic.
- **The codemods** (scripts/m{NN}-*-codemod.mjs): m3 through m14 persisted. The latest is `scripts/m14-tools-codemod.mjs`. No codemod at M15/M16 (no moves).
- **Persian-copy manifest:** 8006 entries, sources are the dictionaries (fa.ts 1492 + insights-copy-fa.ts 6277) + calendar (36) + a handful of hardcoded-literal source files. collectState().sweep = 206 hits across 20 source files (UNCHANGED from M15 — no moves this phase).

## The next-session pointer — modularization COMPLETE

**The 16-session modularization program M1–M16 is COMPLETE (progress: modularization M16/16 · 0 remaining). Nothing is needed for the modularization plan — it is finished.** The standing owner-side levers above (the §19.6 retirement, the investor review, the fa-string triage, the credential rotation) re-open work at the owner's discretion, each behind its own Gate 0; none is part of the modularization program. The standing limits in AGENTS.md §11 (the §21 portwatch window, the D-43 deploy-lock re-check, the wrangler 10013 retry rule) carry forward to any future session that deploys or moves files.
