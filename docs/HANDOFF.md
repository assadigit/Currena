# HANDOFF — Currena current state & next steps

## Current state (after the M14 session)

**Modularization Phase 5 (founding tools — the 9 tool routes + converter/settle/receipt children + tool components + tool libs) DELIVERED and deployed live.** The 49 LIVE web files moved into `apps/web/src/features-tools/<9 domains>/` in ONE commit: `modularization(M14)` `d15555bb` (51 files changed, pushed and verified). The move spans THREE source folders (routes/{9 top-level tool routes + converter/7 + settle/8 + receipt/5} + components/{6 converter + 2 live-rates top-level + led/LedParts} + lib/{recent-pairs + recent-pairs.test + history + history.test + photo-store + settle-storage + settle-storage.test}), PRESERVED subfolder structure per the M13 convention (the `led/` subfolder kept within live-rates; the `routes/converter|settle|receipt` subfolders map 1:1 onto their same-named domains and FLATTEN into the domain root — the subfolder name IS the domain name, no nesting). **NO engine move — all 49 are web files** (the audit's Deliverable 1 features-tools rows: 49, verified against the tree at M14 start, all 49 present). NO renames (R5), ZERO co-located __snapshots__ (R6), NO pd-s script (the tools are user-facing routes, not §20 toolkit destinations). 130 import specifiers re-anchored by the persisted codemod `scripts/m14-tools-codemod.mjs` (path.relative, the M2→M13 method) + 13 manual edits (App.tsx 8 lazy tool routes — variant #1; **LiveRates:25 is EAGER** — regex-caught, NOT a manual edit; Converter.tsx:79 AlertsDialog + Receipt.tsx:319 xlsx-writer — variant #3, the chunk-merger sites; 3 test files × snapshot-store global+expectCount=2 — variant #3). **ZERO Persian-copy manifest re-keys** (the M11+M12+M13 NON-zero pattern BREAKS for M14 — collectState().sweep = 206 hits across 20 source files, ZERO tool-file hits; the fa chars in LED boards/AmountInput/tests are ALL comments; matches the M9-asia ZERO precedent). **The chunk-merger watch closed with a FOURTH outcome shape** — the entry chunk (index) re-hashed FIRST (the 8 App.tsx lazy dynamic import() spec strings re-anchor — the M13 THIRD-outcome mechanism), then the re-hash CASCADED to ALL 8 tool route chunks + the AlertsDialog chunk, because each tool chunk cross-references the entry by filename (`from"./index-<hash>.js"`); the `history` lib chunk stayed BYTE-IDENTICAL (no entry reference); the LiveRates eager import re-anchor did NOT change entry bytes (static specs don't survive bundling); build DETERMINISTIC (full-substitution rebasing test: two builds on the same post-move source produced identical hashes). **Production is CURRENT** — currena-api deployed at 2026-11-17T02:42:47Z (Version ID `3ffcdd6b`, the M14 build); live-verified: / 200, /converter 200, /live-rates 200, /api/insights/pages/global 200, the post-move chunks served (/assets/Converter-CJdZYPV-.js 200 + /assets/index-B6C4rXg4.js 200).

**Phase 3 CLOSED at M12; Phase 4 (insights-legacy) DELIVERED at M13; Phase 5 (founding tools) DELIVERED at M14.** M15 (Phase 6: config + chunking verification pass) is next. Progress: modularization M14/16 · 2 remaining (Phase 6 config/chunking pass, Phase 7 documentation).

## The green baseline — the M14 close record (2026-11-17)

- **Gates:** 9/9 GREEN, 2m 38s. secret scan (1092 files) · typecheck (6 packages) · lint (0/0) · copy:audit (clean) · narrator vocabulary (193×2 + 56×2) · narrator eval (50 checks) · layer1 strict (11969/11969) · **full test suite 15,284** (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13212) · build + bundle budget (entry 273.95/82.94 + 12 Insights lazy chunks within budget).
- **Suite delta from the move:** ZERO (15,284 → 15,284, IDENTICAL to the M13 baseline — the M7′→M13 streak EXTENDED through M14).
- **Chunk count:** 93 (stable from the M13 close).
- **Deploy:** currena-api Version ID `3ffcdd6b` (created 2026-11-17T02:42:47Z; 21 files uploaded, 144 already uploaded; no 10013 retry needed).
- **origin/main HEAD:** `d15555bb` (the M14 move commit) — production == origin/main HEAD.

## The M14 session record (what was done)

1. **Environment setup** (the M13 sandbox had only a Next.js scaffold at /home/z/my-project): cloned assadigit/Currena to /home/z/Currena (token in the URL — the M12 env-var-prefix lesson); installed pnpm@10.34.5 (matching the packageManager pin); `pnpm install` (580 packages).
2. **Token verified** (HTTP 200 on api.github.com/user — the stranded-M7 lesson; login assadigit, 4999 rate-limit remaining).
3. **origin/main verified:** `73dd3be9` (M13 move) + `3fdf95c6` (M13 bookkeeping, docs-only — CHANGELOG + HANDOFF + DECISIONS, no AGENTS.md, no code; `git show --stat HEAD` confirmed). Production verified = M13 deploy `0ac92086` (2026-11-17T01:21:17Z) via the Cloudflare deployments API. Deploy-lock held (no newer deploy).
4. **Baseline gates:** `pnpm gates` 9/9 GREEN, suite 15,284 — the post-chore-M0-pre baseline (the M13 close). NO red baseline.
5. **File inventory verified (49/49):** about(1)/batch(1)/calculator(1)/splitter(1)/history(3)/converter(17)/live-rates(5)/receipt(7)/settle(13). Each present under apps/web/src/{routes,components,lib}. The audit's Phase 5 row + Deliverable 1's 49 features-tools rows AGREE with the tree.
6. **Pre-move grep set (the BD-M7 three-variant discipline + R8 + ?raw):**
   - ?raw / fs-path (R8): strict re-grep for `?raw`, `new URL(spec, import.meta.url)`, `__dirname`, `readFileSync(join())`, `fileURLToPath` on all 49 moved files = **0 real constructs** (the earlier "here/there" hits were comment prose).
   - Dynamic import() 3 variants: **variant #1** (App.tsx consumer lazy) = 8 sites (Calculator:34, History:35, BatchConverter:37, Splitter:39, Settle:40, Receipt:41, About:42, Converter:48) + **LiveRates:25 EAGER** (static, regex-caught); **variant #3** (inside moved files) = Converter.tsx:79 AlertsDialog + Receipt.tsx:319 xlsx-writer + 3 test files × snapshot-store×2 (LiveRates.test:108+:110, Receipt.test:110+:112, Converter.test:114+:116); the Settle.test.tsx `./Settle` same-dir occurrences are NO-OPs; ResultPopup.tsx:190 html2canvas + Receipt.tsx:218/286 html2canvas/jspdf = PACKAGE specifiers (untouched).
   - pd-s scripts: NONE (grep apps/web/scripts/ = empty).
   - Exports map: NONE for tools (packages/insights 16 entries all engine paths; root package.json no exports).
   - __snapshots__ (R6): NONE co-located with the 7 tool .test files.
7. **Persian-copy manifest (BD-M5 D5): ZERO re-keys** — verified definitively: (a) the manifest's 8006 entries' source fields NEVER point at tool files (sources are fa.ts 1492 + insights-copy-fa.ts 6277 + calendar 36 + already-moved domain files + Header.tsx); (b) collectState().sweep = 206 hits across 20 source files — ZERO tool-file hits (the fa chars in LED boards/AmountInput/tests are ALL comments; tests excluded by /.test./). copy:audit stays clean — NO edit. The M11+M12+M13 NON-zero pattern BREAKS for M14; matches the M9-asia ZERO precedent.
8. **Codemod written + dry-run + applied:** `scripts/m14-tools-codemod.mjs` (the m{NN}-{domain}-codemod.mjs convention; the M13 pattern + global+expectCount). Dry-run reviewed (49 moves, 130 static edges, 13 manual edits). Applied: 49 git mv (R/RM, history preserved) + 130 static re-anchors + 13 manual edits. Broken-path grep after apply = CLEAN (zero stale old-path references).
9. **Post-move gates:** `pnpm gates` 9/9 GREEN, suite 15,284 IDENTICAL (ZERO delta). copy:audit clean. registry:generate (187 indicators) + placement:generate (PLACEMENT.generated.md 40507 chars stable) + s24:d9-audit (D-9 CONDITION MET) — ZERO generated-doc drift (tools are user-facing routes, not engine/§20).
10. **Chunk-merger watch:** baseline dist topology recorded (tool chunks About/BatchConverter/Calculator/Converter/History/Receipt/Settle/Splitter basename-keyed + entry index-CknRFHfU.js; NO LiveRates chunk — it's eager, in the entry; 93 assets). Post-move: entry re-hashed (index-CknRFHfU → index-B6C4rXg4) FIRST (8 lazy specs re-anchor), cascaded to ALL 8 tool route chunks + AlertsDialog chunk (each cross-references the entry via `from"./index-<hash>.js"`); `history` lib chunk BYTE-IDENTICAL. Build DETERMINISTIC (rebasing test: identical hashes across 2 builds).
11. **Empty source subdirs removed:** routes/converter, routes/settle, routes/receipt, components/led (git doesn't track empty dirs).
12. **Commit + push:** `d15555bb` (51 files: 49 renames + App.tsx + codemod). Pushed to origin/main (`3fdf95c6..d15555bb`) — verified (local HEAD == origin/main).
13. **Deploy:** deploy-lock re-checked FIRST (production still M13 `0ac92086`, unchanged; D-43). UTC 02:42 Tuesday — OUTSIDE the §21 portwatch window (11:00–14:00 UTC). Web dist rebuilt. `pnpm --filter @currena/api run deploy` (the `run` required under pnpm 10; CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN env vars) FIRST attempt clean (no 10013 retry) → currena-api Version ID `3ffcdd6b` (2026-11-17T02:42:47Z). Live-verified: / 200 + /converter 200 + /live-rates 200 + /api/insights/pages/global 200 + post-move chunks served. Production == origin/main HEAD.

## Where the founding-tools domain now lives (the Phase 5 map)

`apps/web/src/features-tools/` — 9 tool domains, 49 files:

- **about/** (1): About.tsx ← routes/About.tsx
- **batch/** (1): BatchConverter.tsx ← routes/BatchConverter.tsx
- **calculator/** (1): Calculator.tsx ← routes/Calculator.tsx
- **splitter/** (1): Splitter.tsx ← routes/Splitter.tsx
- **history/** (3): history.ts + history.test.ts ← lib/; History.tsx ← routes/
- **converter/** (17): AlertsDialog/AmountInput/LiveRateLine/Odometer/RateDeltaChip/ResultPopup ← components/; recent-pairs + recent-pairs.test ← lib/; Converter + Converter.test ← routes/; AlertsSectionRow/ConvertForm/FailureCard/PairChips/QuickTools/RetryCountdown/shared ← routes/converter/ (FLATTENED — the converter/ subfolder maps 1:1 onto the converter domain)
- **live-rates/** (5): LedGoldBoard/LedRateBoard ← components/; **led/LedParts.tsx** ← components/led/ (PRESERVED led/ subfolder — the M13 convention); LiveRates + LiveRates.test ← routes/
- **receipt/** (7): Receipt + Receipt.test ← routes/; ExpenseItemRow/OptionsPanel/ReceiptModal/SummaryPanel/shared ← routes/receipt/ (FLATTENED)
- **settle/** (13): photo-store/settle-storage/settle-storage.test ← lib/; Settle + Settle.test ← routes/; AddExpenseModal/CreateGroupModal/ExpensePhoto/GroupCard/GroupDetail/GroupTabs/Modal/shared ← routes/settle/ (FLATTENED)

App.tsx lazy/eager wiring: 8 lazy tool routes (Calculator:34, History:35, BatchConverter:37, Splitter:39, Settle:40, Receipt:41, About:42, Converter:48) + LiveRates EAGER (:25). All point at `./features-tools/<domain>/`.

## Operational notes worth carrying (M14 additions in bold)

- **The chunk-merger FOURTH outcome shape (entry-primary cascade).** The M13 THIRD-outcome lesson (dynamic import() spec strings survive bundling) EXTENDS: when the ENTRY ITSELF contains dynamic import() specs that re-anchor (App.tsx lazy routes), the entry re-hashes as the PRIMARY cause, and the cascade flows OUTWARD to every chunk that cross-references the entry by filename (`from"./index-<hash>.js"`). This is the reverse direction of M13's page→entry cascade. Future phases moving lazy-loaded routes: grep App.tsx for dynamic import() pointing at moved files — if ANY, expect the entry + all cross-referencing chunks to re-hash.
- **ZERO Persian-copy re-keys is possible for tool routes.** The M11+M12+M13 NON-zero pattern was driven by inline fa literals in the moved files (ics calendar-name, BalanceScale, QuietArea `٪`). The tools route fa through the i18n dictionary — ZERO direct manifest entries. The fa chars in LED boards/AmountInput/tests are ALL comments (the AST sweep never visits comments; tests excluded by /.test./). So copy:audit stays clean with NO re-key. The M9-asia ZERO precedent holds. LESSON: the "expect NON-zero" prompt guidance is a default, not a guarantee — every phase re-verifies via collectState().sweep.
- **LiveRates is EAGER, not lazy.** App.tsx:25 `import { LiveRates } from './routes/LiveRates'` is a static import (with `from`) — the IMPORT_RE regex catches it (NOT a manual edit). The 8 lazy tool routes ARE dynamic import() calls (the regex gap — `import(` has no whitespace). The M14 prompt's caution was VERIFIED.
- **The `global`+`expectCount` mechanism (M13 Decision 4) reused.** The 3 test files each have `import('../shared/lib/snapshot-store')` twice (typeof type-position + await value-position) — global replace with expectCount=2 catches both with a count assertion. Pre-verified NO static `from` exists (the global replace cannot double-apply).
- **PRESERVED led/ keeps the LedGoldBoard→LedParts relative path invariant.** Both move into features-tools/live-rates/ (boards at root, LedParts at led/) → `./led/LedParts` stays `./led/LedParts`. The converter/settle/receipt subfolders FLATTEN (the subfolder name IS the domain name — `features-tools/converter/converter/X` would be absurd).
- The 4 empty source subdirs (routes/converter, routes/settle, routes/receipt, components/led) were removed after git mv (git doesn't track empty dirs).

## Owner-side levers waiting

- **None blocking.** The modularization Phase 5 is DELIVERED + deployed. Phase 6 (M15) is a verification pass (no moves, no owner decision needed) + the opportunistic `local-snapshot-preview.mjs:12` fix (pre-existing, dev-only — a hardcoded nonexistent absolute path).
- The §19.6 retirement (delete features/insights-legacy/ + remove the App.tsx:43 lazy route + the selfcheck.ts:53 import + the cross-domain consumer edges + the orphaned usGlobalReach dictionary templates) remains a FUTURE owner decision (post-modularization).

## Known state worth knowing

- **The exports map** (packages/insights/package.json): 16 entries, ALL engine paths (., ./validation, ./adapters, ./store, ./narrator, ./markets, ./markets/definitions, ./markets-au, ./markets-au/definitions, ./fx, ./fx/definitions, ./tic, ./prices, ./ingest, ./page-division, ./gf-p0-proposed). NONE for tools (all 49 M14 moved files are web files). Final review at Phase 6.
- **vite.config.ts:** `manualChunks: undefined` (chunking rides the route-level lazy imports; the entry↔chunk cross-reference graph is emergent — the M14 chunk-merger cascade mechanism). Phase 6 verifies this + the bundle-budget regexes (12 basename patterns).
- **The chunk-merger cascade mechanism** (entry cross-reference via `from"./index-<hash>.js"`): discovered at M14. Each tool route chunk imports shared modules (locale/router/ui) from the entry, so the entry's filename is embedded in every cross-referencing chunk. When the entry re-hashes, all of them re-hash. This is a Phase 6 verification item (the emergent cross-reference graph under manualChunks=undefined).
- **Persian-copy manifest:** 8006 entries, sources are the dictionaries (fa.ts 1492 + insights-copy-fa.ts 6277) + calendar (36) + a handful of hardcoded-literal source files (Header, BalanceScale, QuietArea, ics, ConnectionCard, Together, PriceDetails, bands, movers, display, format, shared.ts ×3). The tool route/component files are NEVER sources (they route fa through the dictionary). collectState().sweep = 206 hits across 20 source files.
- **The codemods** (scripts/m{NN}-*-codemod.mjs): m3 through m14 persisted, each the bidirectional path.relative re-anchoring method + the manual-edits mechanism (global+expectCount for repeated dynamic import() specs). The latest is `scripts/m14-tools-codemod.mjs`.

## The M15 next-session prompt (modularization Phase 6 — config + chunking verification pass)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M15 — modularization Phase 6: the config + chunking verification
pass (NO moves — a verification + opportunistic-fix session, the audit's
Phase 6 row).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 6" + Deliverable 1's
final-state expectation) → docs/HANDOFF.md (the M14 version — this file) →
CHANGELOG [2026-11-17] M14 → docs/DECISIONS.md BD-M14.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′). If
   the token is invalid: STOP, tell the owner, do NOT start. Pass the
   token in the URL (https://$GH_TOKEN@github.com/…) OR export it FIRST
   in the parent shell — the M12 env-var-prefix lesson.
2. Verify origin/main has the M14 move commit d15555bb, then the M14
   bookkeeping commit (docs-only — CHANGELOG.md + docs/HANDOFF.md +
   docs/DECISIONS.md, no AGENTS.md, no code; `git log --oneline -2
   origin/main`; confirm via `git show --stat HEAD`), AND production
   is the M14 deploy: currena-api Version ID 3ffcdd6b (created
   2026-11-17T02:42:47Z; the deploy-lock; docs-only commits do NOT
   change deployed code). ANY code commit beyond the bookkeeping, or
   ANY production version newer than the M14 deploy: STOP and report.
3. Run `pnpm gates` once and record the numbers (the M14 close: 9/9,
   suite 15,284; the M14 move was zero-delta from 15,284). If the
   baseline is red, STOP and report. ENVIRONMENT NOTE (M14): the repo
   was cloned to /home/z/Currena (the sandbox had only a Next.js
   scaffold at /home/z/my-project); pnpm@10.34.5 installed. If a
   skills/ folder is injected INSIDE the repo root, park it outside
   during gates runs (BD-M3 D4), never commit it.

The phase (audit §"Phase 6" — config + chunking verification, NO moves):
- VERIFY `vite.config.ts` manualChunks (currently `undefined` — chunking
  rides the route-level lazy imports; the M14 chunk-merger cascade
  mechanism — the entry↔chunk cross-reference graph is emergent under
  manualChunks=undefined; each tool route chunk cross-references the
  entry via `from"./index-<hash>.js"`, so the entry's re-hash ripples
  outward). Confirm the dynamic import paths in App.tsx are correct
  (already done per M14 — the 8 lazy tool routes + LiveRates eager).
- VERIFY the bundle-budget regexes (12 basename patterns — green
  because nothing was renamed in any phase; gate 8 doubles as the rename
  detector). Confirm the tool chunks (Converter-*.js, LiveRates-*.js
  etc.) + the entry + the Insights lazy chunks all match.
- VERIFY `index.html` (`/src/main.tsx` — main.tsx never moved).
- VERIFY the PWA manifest/shortcuts (hash-router URLs, unaffected by the
  moves).
- VERIFY (update if not already landed in earlier phases): eslint globs,
  tsconfig includes, gates.mjs layer1 path, persian-copy SOURCES/
  SWEEP_ROOTS, exports-map target paths (final review — the 16 entries
  all point at engine paths, NONE for tools/shared; confirm every target
  path resolves), the two wrangler `main` paths (unchanged — apps
  untouched).
- FIX opportunistically (pre-existing, dev-only): `scripts/local-
  snapshot-preview.mjs:12` hardcodes a nonexistent absolute path
  `/home/z/my-project/Currena` — update to the correct repo-relative
  resolution (or remove if unused). This is a dev-tooling fix, NOT a
  production code change.
- The chunk-merger cascade mechanism (M14's FOURTH outcome shape — entry
  re-hashes as primary cause via its own dynamic import() specs, then
  cascades OUTWARD to cross-referencing chunks): RECORD the final
  dist topology (all 93 chunks) as the post-modularization baseline.
  The build is deterministic (M13+M14 verified). No moves this phase →
  expect ZERO chunk changes (the verification confirms the M14 state is
  stable).

Gates: full run ×2 (clean tree, then `git status` empty) + pnpm
registry:generate + pnpm placement:generate + pnpm s24:d9-audit
(regenerated docs reviewed — drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical to the M14 baseline (15,284); every commit green + PUSHED
(verify the push!); the exports map final-reviewed + every target path
resolves; the local-snapshot-preview.mjs:12 fix landed (if it doesn't
break anything); production == origin/main HEAD after the post-phase
deploy IF any production code changed (the local-snapshot-preview.mjs
fix is dev-only — it may NOT need a deploy; verify); deploy-lock re-check
FIRST — D-43; never run the §21 portwatch leg Tuesdays 11:00–14:00 UTC;
if wrangler deploy fails on assets-upload-session with code 10013,
RETRY once before investigating — the M9 note; environment note: `pnpm
--filter @currena/api run deploy` — the `run` is required under pnpm 10).
Bookkeeping per AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS)
and the M16 pointer (Phase 7: the documentation pass — AGENTS.md §11
project facts + README + docs/page-division/README.md "where things
live" + file-header "lives here" comments). Progress after M15:
modularization M15/16 · 1 remaining.
```
