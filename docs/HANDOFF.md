# HANDOFF — Currena current state & next steps

## Current state (after the M13 session)

**Modularization Phase 4 (insights-legacy — the retirement container, the FIRST non-Phase-3 move) DELIVERED and deployed live.** The 46 LIVE legacy `/insights` web files moved into `apps/web/src/features/insights-legacy/` across TWO commits: `chore(M0-pre)` `d6d143df` (the Gate 0 owner decision — delete the 4 dead/dangling files first: MovesNextStrip + UsGlobalReachGroup + config/us-global-reach.ts + its co-located test; suite 15,298 → 15,284, the −14 R9-07 us-global-reach tests) + `modularization(M13)` `73dd3be9` (the 46-file move, 53 files changed, pushed and verified). The move spans THREE source folders for the first time (routes/Insights.tsx + routes/insights-sections/{9} + components/insights/{27 top-level + 7 world-currencies + 1 config} + lib/clamp-panel.ts), preserved subfolder structure per the currencies fx-presentation/ + gold signals/ + australia au-markets/ convention + the M1 skeleton README. **NO engine move — all 46 are web files** (the audit's Deliverable 1 insights-legacy rows: 50, minus the 4 deleted = 46 live; verified against the tree). NO renames (R5), ZERO co-located __snapshots__ (R6), NO pd-s script (the legacy page carries no §20 toolkit leg, same as M11 + M12). 98 import specifiers re-anchored by the persisted codemod `scripts/m13-insights-legacy-codemod.mjs` (path.relative, the M2→M12 method) + 10 manual edits (App.tsx:43 lazy — variant #1; InsightsHeader 4 + world-feeds 3 dynamic import() — variant #3, the regex gap; the ONE Persian-copy manifest re-key — QuietArea `٪`; the M11 two-re-key + M12 one-re-key pattern holds: NON-zero). **The chunk-merger watch closed with a THIRD outcome shape** — the Insights page chunk re-hashed (Insights-DVE_tnS2 → Insights-DIm8fGH3) because the DYNAMIC import() spec re-anchoring survived into the bundle as string literals (the M11 ConnectionCard?raw analog), cascading to the entry + GlobalPage; the M10/M11 deep-route prediction's precondition (byte-identical page chunk) was NOT met for M13 (the moved set includes dynamic import() sites, unlike M10/M11); the mechanism correction STILL HOLDS (entry re-hashes iff the page chunk filename changes — it did). **Production is CURRENT** — currena-api deployed at 2026-11-17T01:21:18Z (Version ID 0ac92086, the M13 build); live-verified: /api/insights/pages/global 200 (24491 bytes), / 200, /insights 200, /world-markets 200.

**Phase 3 CLOSED at M12; Phase 4 (insights-legacy) DELIVERED.** M14 (Phase 5: the founding tools — ~49 files: the 9 tool routes + converter/ + settle/ + receipt/ + the tool components + the tool libs) is next. Progress: modularization M13/16 · 3 remaining (Phase 5 tools, Phase 6 config/chunking pass, Phase 7 documentation).

- **origin/main is GREEN** — 9/9 gates at `73dd3be9` (the M13 move), suite 15,284 (the post-chore-M0-pre baseline; the MOVE is zero-delta — 15,284 → 15,284; the chore-M0-pre delete was −14 from the M12 close's 15,298). HEAD == origin/main, tree clean.
- **The deploy-lock held** — re-checked FIRST (D-43): production was currena-api a77b47a1 @ 100% (the M12 deploy, modified_on 2026-11-16T23:57:06Z) BEFORE the M13 deploy; the chore-M0-pre + M13 commits were not yet deployed. After the M13 deploy: production modified_on 2026-11-17T01:21:18Z (Version ID 0ac92086), serving the M13 build. The §21 portwatch window (Tuesdays 11:00–14:00 UTC) was N/A — the deploy ran at 01:21 UTC Tuesday, well before 11:00.

## The green baseline — the M13 close record (2026-11-17)

The M13 session ran `pnpm gates` THREE times (the pre-flight baseline at HEAD=a64431ab, the chore-M0-pre post-delete, and the M13 post-move) — the numbers:

| gate | check | result | notes |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1090 files post-move; was 1094 at the M12 close, −4 from the chore-M0-pre delete) |
| 2 | typecheck | PASS | 6 packages — all imports resolve (no broken paths after the 98 regex re-anchors + 10 manual edits) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean — the ONE manifest re-key (QuietArea `٪` id+source) landed correctly; SWEEP_ROOTS includes apps/web/src (recursive) so the moved QuietArea.tsx is swept at its new path |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict validator | PASS | 11969/11969 assertions (UNCHANGED across all three gates runs) |
| 8 | full test suite | PASS | **15,284 tests** (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13212) — IDENTICAL to the post-chore-M0-pre baseline (the MOVE is zero-delta); the chore-M0-pre delete dropped 15,298 → 15,284 (−14, the R9-07 us-global-reach tests; web 13226 → 13212) |
| 9 | build + bundle budget | PASS | entry 273.95/82.94 · Insights lazy chunks near-identical to baseline (85.77→85.76 KB etc. — sub-byte rounding; the chunk-merger watch below explains the re-hashes) |

**Baseline (pre-flight, HEAD=a64431ab):** 9/9, suite 15,298 (IDENTICAL to the M12 close — ZERO delta from M12). **chore-M0-pre post-delete (d6d143df):** 9/9, suite 15,284 (−14, the dead R9-07 tests). **M13 post-move (73dd3be9):** 9/9, suite 15,284 (ZERO delta from chore-M0-pre — the move preserves the count). The MOVE is zero-delta; the delete is the expected −14.

## The M13 session record (what was done)

**Environment note (M13):** the Currena repo was NOT present in this sandbox (only an unrelated Next.js scaffold at `/home/z/my-project`). Cloned `assadigit/Currena` to `/home/z/currena-work/currena` with the token in the URL (the M12 env-var-prefix lesson held — `https://$GH_TOKEN@github.com/…`). `pnpm` was missing; installed `pnpm@10.34.5` (matching the `packageManager` pin via `npm install -g pnpm@10.34.5`; pnpm 12 from corepack was replaced to avoid lockfile drift). No `skills/` folder inside the repo root (it sits at the Next.js scaffold's parent), so no BD-M3 D4 parking needed.

1. **Pre-flight (the mandated three, before touching anything):**
   - GitHub token verified — HTTP 200 on `api.github.com/user`, login `assadigit` (matches the repo owner). Token passed in the URL per the M12 env-var-prefix lesson.
   - origin/main verified — `HEAD == origin/main == a64431ab` (the M12 bookkeeping, **docs-only** — only CHANGELOG.md + docs/DECISIONS.md + docs/HANDOFF.md touched, 0 code; confirmed via `git show --stat HEAD`). `fc856449` (the M12 move) is `HEAD~1`. Production was the M12 deploy: currena-api `modified_on 2026-11-16T23:57:06Z` (matches the M12 deploy at 23:57:03Z; the token's scope doesn't expose a deployments/rollout list, but the timestamp + docs-only HEAD are conclusive — no newer production version possible).
   - Baseline `pnpm gates` — 9/9, suite 15,298, IDENTICAL to the M12 close. Green baseline confirmed; never started on a red baseline.

2. **The in-scope pre-move analysis (no Gate 0 dependency):**
   - File inventory verified against the tree: exactly 50 source files (all present), matching the audit's Deliverable 1 (50 features/insights-legacy rows). The `features/insights-legacy/` skeleton held only the M1 README.
   - pd-s scripts: 10 exist (pd-s4/s5/s7/s10/s12/s14/s16/s17/s18/s20) but NONE import any insights-legacy candidate file (expected — the legacy page carries no §20 toolkit leg).
   - Variant #1 (App.tsx lazy insights): **App.tsx:43** — `lazy(() => import('./routes/Insights')…)` — the ONLY insights lazy site (M11=:118, M12=:55, M13=:43 — differs as predicted; App.tsx lazy routes drift per phase).
   - Variant #3 (dynamic `import()` of moved legacy files): comprehensive sweep found InsightsHeader.tsx (:288 insights-csv, :290 download, :298 ics+download, :314 full-export, :326 download) + world-feeds.ts (:99 markets-csv, :101 download, :163 fx-csv, :165 download) + DataExportMenu.tsx:29 (./DataExportPanel same-dir NO-OP) + DataExportPanel.tsx:72 (download depth-invariant NO-OP) + full-export.test.ts:412 (./full-export same-dir NO-OP) + markets-verdict.test.ts:256,266 (../../features/world-markets/ depth-invariant NO-OP) + AboutTheData.tsx:226 (../../../../../data/indicator-audit.json R8 dynamic depth-invariant NO-OP) + full-export.ts:899 (../../shared/lib/xlsx-writer depth-invariant NO-OP).
   - ?raw on candidate-moved files: ZERO. R8 fs-path forms: ONE — about-sources.test.ts:167 `new URL('../../../../../packages/insights/src/shared/sources.ts', import.meta.url)` — targets an ENGINE file (sources.ts, Phase 2, NOT M13); DEPTH-INVARIANT (components/insights/ → features/insights-legacy/ both 5 ../ to root-packages/) — UNTOUCHED. __dirname/HERE/readFileSync(join())/fileURLToPath: ZERO.
   - Known consumers verified: data-health.test.ts:21 (TZ_LABEL from ../../features/global/NextUpStrip — re-anchors to ../../global/NextUpStrip); selfcheck.ts:53 (the engine→web full-export import — regex-caught); features/usa/TicSection.test.tsx, features/world-markets/briefing.test.tsx, shared/components/prices-cards.test.tsx (cross-domain consumers of moved legacy files).
   - Dead files CONFIRMED truly dead (re-verified exhaustively across the whole repo in EVERY identifier form — hyphen/camelCase/snake_case — with zero hits, no barrel re-exports, no snapshot refs): MovesNextStrip.tsx, UsGlobalReachGroup.tsx, config/us-global-reach.ts (+ its co-located test). The M7′→M12 re-verification discipline held.

3. **Gate 0 — the §19.6 retirement question (OWNER DECISION FIRST, NOT in the agent's scope):** presented to the owner with the verified dead-file evidence + the two options (A: delete first in a standalone chore commit; B: move as-is). The owner chose **Option A** (the audit's R15 recommendation). The dead files were provably safe to remove (0 importers, reversible via git revert), and the owner understood the −14 suite delta (the R9-07 us-global-reach tests test unwired analytical logic).

4. **The chore(M0-pre) delete (commit d6d143df, ONE commit, BEFORE the move):** `git rm` of MovesNextStrip.tsx + UsGlobalReachGroup.tsx + config/us-global-reach.ts + config/us-global-reach.test.ts. Gates 9/9 GREEN, suite 15,284 (15,298 − 14; web 13226 → 13212, all other packages IDENTICAL). Layer1 11969/11969 unchanged. copy:audit clean (us-global-reach.ts used the copy dictionary's usGlobalReach templates, NOT inline fa literals → zero manifest entries → zero drift). Build budget unchanged (dead code was not in any route bundle). Secret scan 1094 → 1090 files. PUSHED and verified (ls-remote == rev-parse == d6d143df). Note for §19.6: the copy dictionary's `usGlobalReach` EN+fa templates (in shared/i18n/) are now orphaned — a §19.6 cleanup item, not blocking.

5. **The M13 codemod (scripts/m13-insights-legacy-codemod.mjs, persisted):** modeled on m12-global-codemod.mjs. Move table of 46 files (preserved subfolders: insights-sections/, world-currencies/, config/). The reanchor() function (path.relative, the M2→M12 method) re-anchors every relative edge where either endpoint moved. SCAN_ROOTS = apps/web/src + apps/web/scripts + packages/insights/{src,scripts} + apps/api/src + apps/markets/src + scripts. Dry-run first (reviewed every edge — 98 regex-caught static re-anchors + 10 manual edits), then apply with git mv + writeFileSync. A `global`+`expectCount` mechanism handles the repeated `import('../../shared/lib/download')` sites (InsightsHeader ×3, world-feeds ×2) — count-verified to guard against an unexpected 4th site.

6. **The 10 manual edits (the regex gap — the BD-M4 D4 + BD-M7 sharpened three-variant set):**
   - App.tsx:43 lazy `import('./routes/Insights')` → `import('./features/insights-legacy/Insights')` (variant #1).
   - InsightsHeader.tsx:288 `import('../../components/insights/insights-csv')` → `import('../insights-csv')` (variant #3; both endpoints move, InsightsHeader to the insights-sections/ subfolder, insights-csv to top-level → ../insights-csv).
   - InsightsHeader.tsx `import('../../shared/lib/download')` → `import('../../../shared/lib/download')` ×3 (variant #3, global; the +1-depth lengthen: routes/insights-sections/ 2-below-src → features/insights-legacy/insights-sections/ 3-below-src).
   - InsightsHeader.tsx:298 `import('../../features/global/ics')` → `import('../../global/ics')` (variant #3; ics already in features/global/ from M12; the preserved-subfolder shape gives ../../global/ics, NOT the ../global/ics a flatten would — the M12 handoff predicted ../global/ics assuming flatten; path.relative is the truth).
   - InsightsHeader.tsx:314 `import('../../components/insights/full-export')` → `import('../full-export')` (variant #3).
   - world-feeds.ts:99 `import('../../components/insights/markets-csv')` → `import('../markets-csv')` (variant #3).
   - world-feeds.ts `import('../../shared/lib/download')` → `import('../../../shared/lib/download')` ×2 (variant #3, global).
   - world-feeds.ts:163 `import('../../components/insights/fx-csv')` → `import('../fx-csv')` (variant #3).
   - The Persian-copy manifest re-key: the QuietArea.tsx `٪` entry (a hardcoded.* technical entry, path-derived id per lib/persian-copy.mjs:239) — id + source re-keyed (apps.web.src.components.insights.world-currencies.QuietArea → apps.web.src.features.insights-legacy.world-currencies.QuietArea), text + sha256 UNCHANGED, note appended (the M8 BalanceScale entry-642 re-key-note pattern). The audit matches by source-path + sha256 (NOT by id), so the source MUST re-key; the id re-keys for forward-compat. SWEEP_ROOTS includes apps/web/src (recursive) → the moved QuietArea.tsx IS swept at its new path → copy:audit (gate 4) clean.

7. **The move (commit 73dd3be9, ONE commit):** the codemod applied — 46 git mv (renames, history preserved) + 98 static import re-anchors + 10 manual edits. Broken-path grep after apply: ZERO broken imports (the only old-path refs left were in the codemod file itself + prior codemod files + a stale COMMENT in packages/insights/src/companies/definitions.ts:16 — a Phase 7 doc-debt item, not a blocker). The DollarStrength→QuestionGroup components→routes inversion (N-map §2.3, the ONLY components→routes edge) dissolved: both now siblings under features/insights-legacy/ (world-currencies/ + insights-sections/). Gates 9/9 GREEN, suite 15,284 (ZERO delta from chore-M0-pre — the move preserves the count). registry:generate + placement:generate + s24:d9-audit regenerated, ZERO drift (byte-identical data/indicators.json + indicator-audit.json + site-mode-overrides.json + docs/page-division/PLACEMENT.generated.md — expected, M13 moved NO engine code; D-9 CONDITION MET). PUSHED and verified (ls-remote == rev-parse == 73dd3be9).

8. **The chunk-merger watch (BD-M5 D3) — a THIRD outcome shape:**
   - Baseline recorded BEFORE the move (from the chore-M0-pre gates build): 80 chunks, entry index-CwWgmh84.js (sha 12f4b495…), Insights-DVE_tnS2.js (sha b51b3af2…), GlobalPage-QoITA5Xt.js, index.html 4835 bytes, sw.js 10435 bytes. NOTE: the entry drifted from the M12 close's index-BJfZB2Np to index-CwWgmh84 after the chore-M0-pre dead-file deletion (the dead files weren't bundled, so this is build-graph/module-ID sensitivity — the known M10 non-determinism pattern; GlobalPage-QoITA5Xt was UNCHANGED from M12, confirming the landing chunk is stable).
   - POST-move: 80 chunks (COUNT stable), entry index-CknRFHfU.js (sha 38c8f0cd…), Insights-DIm8fGH3.js (sha 889de1fc…), GlobalPage-lyB-G4y3.js, index.html 4835 bytes (stable), sw.js 10433 bytes (−2).
   - **The Insights chunk re-hashed** (DVE_tnS2 → DIm8fGH3) because the DYNAMIC import() spec re-anchoring (the manual edits to InsightsHeader + world-feeds) SURVIVED INTO THE BUNDLE as string literals — the M11 ConnectionCard?raw analog (spec strings that survive bundling; the M10/M11 deep-route prediction assumed spec text doesn't survive — TRUE for STATIC imports, FALSE for DYNAMIC import() calls whose path strings are retained for code-splitting).
   - **The entry re-hashed** (CwWgmh84 → CknRFHfU) — cascade from the Insights chunk filename change (the entry references it by filename).
   - **GlobalPage re-hashed** (QoITA5Xt → lyB-G4y3) — cascade: GlobalPage imports NO moved file directly (it imports ./NextUpStrip from features/global/, unchanged), but shares the module graph; the module-ID shift propagated.
   - **Build is DETERMINISTIC** — rebuild from the same tree produced identical hashes (GlobalPage-lyB-G4y3, Insights-DIm8fGH3, index-CknRFHfU all stable across two builds). The M10 "sw.js precache-tail rotation" finding did NOT recur (the −2 byte sw.js change is a real precache-list content change, not a rotation).
   - **The M10/M11/M12 mechanism correction STILL HOLDS:** "the entry re-hashes ONLY if the moved page chunk's FILENAME changes" — the Insights filename DID change (content changed via the dynamic-spec strings) — the prediction's precondition (byte-identical page chunk) was NOT met for M13. The M13 moved set includes dynamic import() sites (unlike M10 europe + M11 economic-linkages, whose moved files had no dynamic import() re-anchoring in the page chunk), so the deep-route byte-identical shape didn't apply.
   - **THREE outcome shapes now on record:** M10/M11 = byte-identical deep route → zero ripple; M12 = landing route cascade (19 chunks, GlobalPage filename changed); M13 = deep route WITH dynamic-spec changes → Insights chunk + cascade (entry + GlobalPage). The lesson for future phases: if the moved set includes files with dynamic import() calls whose specs re-anchor, expect the page chunk to re-hash (the spec strings survive bundling) — this is NOT non-determinism, it's real content change.
   - Functional equivalence proven by the suite (15,284 IDENTICAL to the post-chore-M0-pre baseline — the move changed only import path strings, not behavior).

9. **Post-phase deploy + live verify (the deploy-lock held):**
   - Deploy-lock re-checked FIRST (D-43): production was currena-api modified_on 2026-11-16T23:57:06Z (the M12 deploy, unchanged — chore-M0-pre + M13 not yet deployed). UTC time 2026-11-17 01:20 Tuesday — OUTSIDE the §21 portwatch window (Tuesdays 11:00–14:00 UTC; 01:20 is well before 11:00).
   - `pnpm --filter @currena/api run deploy` (the `run` required under pnpm 10; CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN env vars set). Deploy SUCCEEDED: 52 new assets uploaded (113 unchanged), Worker Startup 49ms, Version ID 0ac92086-e981-4f9e-bf7b-a935f1ebb882, URL https://currena-api.sedanama-ir.workers.dev. The re-hashed chunks (Insights-DIm8fGH3.js, index-CknRFHfU.js, full-export-C2F5FbRu.js) are in the new assets. NO assets-upload-session code 10013 (the M9 retry note was not needed).
   - Live-verified: /api/insights/pages/global **HTTP 200** (24491 bytes, 0.92s — the expected-200 target); / **HTTP 200** (4835 bytes = index.html, the GlobalPage landing); /insights **HTTP 200** (4835 bytes = the SPA shell, the legacy page renders client-side via the lazy Insights chunk — the M13 subject); /world-markets **HTTP 200** (sanity).
   - Production modified_on now 2026-11-17T01:21:18Z — the M13 deploy. Production == origin/main HEAD (73dd3be9). Deploy-lock verified after deploy.

10. **The pushes verified:** chore(M0-pre) d6d143df PUSHED (ls-remote == rev-parse == d6d143df6bba4d2a…); modularization(M13) 73dd3be9 PUSHED (ls-remote == rev-parse == 73dd3be90f033841…). Both commits green + on origin/main.

## Where the insights-legacy domain now lives (the Phase 4 map)

`apps/web/src/features/insights-legacy/` — 46 LIVE web files (preserved subfolder structure):

- `Insights.tsx` (the legacy /insights page — §19.6 retirement candidate; super-consumer of every domain; from routes/Insights.tsx)
- `insights-sections/` (9 files — from routes/insights-sections/): DeprecationBanner, InsightsHeader, InsightsStatusBlocks, QuestionGroup, SectionLane, data-health (+test), useInsightsToolsNav, world-feeds
- top-level (27 files — from components/insights/): AboutTheData, AlertCard, CardMeta, CompactRow, CompaniesTable, DataExportMenu, DataExportPanel, DetailsPanel, InTheNews, JumpNav, NarrativeBlock, PositionBar, TicCustodyCard, ToolsMenu, WorldCurrencies, WorldMarkets (16 .tsx) + about-sources (+test), freshness-line.test, full-export (+test), fx-csv (+test), insights-csv (+test), markets-csv, markets-verdict.test (11 .ts/.tsx)
- `world-currencies/` (7 files — from components/insights/world-currencies/): DollarRow, DollarStrength, PairsTable, PatternCard, PatternVisuals, QuietArea, ReadingAids
- `config/companies.ts` (from components/insights/config/companies.ts)
- `clamp-panel.ts` (from lib/clamp-panel.ts)

§19.6 retirement = delete this folder + remove the router entry (App.tsx:43 lazy) + the selfcheck.ts:53 full-export import + the cross-domain consumer edges (TicSection.test, briefing.test, prices-cards.test) — nothing shared dies with it (the flat card system, the legacy export utils, the world-currencies legacy subtree are ALL legacy-only).

**The 4 dead/dangling files are GONE** (deleted in chore-M0-pre d6d143df): MovesNextStrip.tsx, UsGlobalReachGroup.tsx, config/us-global-reach.ts, config/us-global-reach.test.ts. The copy dictionary's `usGlobalReach` EN+fa templates (in shared/i18n/) are now orphaned — a §19.6 cleanup item.

## Operational notes worth carrying (M13 additions in bold)

- **The FIRST three-source-folder move** (routes/Insights.tsx + routes/insights-sections/ + components/insights/ + lib/clamp-panel.ts). The codemod's path.relative handles the mixed depths mechanically — routes/* and lib/clamp-panel.ts gain +1 depth (routes/ 1-below-src → features/insights-legacy/ 2-below-src; lib/ 1-below-src → features/insights-legacy/ 2-below-src); components/insights/* are depth-invariant (2-below-src → 2-below-src for top-level, 3-below-src → 3-below-src for subfolders). Never hand-count ../.
- **PRESERVED subfolder structure is the convention** (currencies fx-presentation/ + gold signals/ + australia au-markets/ + now insights-legacy insights-sections/world-currencies/config/). The M12 "FLAT" terminology meant "one feature folder, no cross-folder splitting" — NOT "no subfolders". Subfolders in the moved set are kept. **The M12 handoff's "../global/X" shortening prediction for data-health.test + InsightsHeader assumed flatten** — the preserved-subfolder shape gives "../../global/X" (path.relative is the truth; the prediction's exact form doesn't bind). Future handoffs: predict re-anchors via path.relative against the PRESERVED-subfolder target, not a flatten assumption.
- **The chunk-merger watch THIRD outcome shape (M13):** a deep-route move whose moved set includes dynamic import() sites produces a re-hashed page chunk (the spec strings survive bundling) → cascade to entry + shared chunks. **This is DIFFERENT from the M10/M11 byte-identical deep-route shape** (whose moved files had no dynamic import() re-anchoring in the page chunk) AND from the M12 landing-cascade. The mechanism correction STILL HOLDS (entry re-hashes iff the page chunk filename changes); the precondition (byte-identical page chunk) fails when the moved set includes dynamic import() re-anchoring. **Lesson for future phases: grep the moved set for dynamic import() calls BEFORE the move** — if any re-anchor, expect the page chunk to re-hash (real content change, NOT non-determinism; the build is deterministic, verified).
- **The `global`+`expectCount` mechanism in the codemod** (for repeated `import('../../shared/lib/download')` sites — InsightsHeader ×3, world-feeds ×2): count-verified to guard against an unexpected 4th site. The M12 codemod's single `text.replace` only handled first-match; M13's global replace with count assertion is the sharpened pattern for files with multiple identical dynamic import() specs.
- **The Persian-copy manifest id is path-derived** (lib/persian-copy.mjs:239: `hardcoded.` + dotted-path + `.` + sha256-8). The audit (gate 4) matches by source-path + sha256, NOT by id — so the source MUST re-key (else the entry shows as REMOVED + a NEW appears); the id re-keys for forward-compat (so a future copy:audit:update regenerates the same id). SWEEP_ROOTS includes apps/web/src (recursive) → moved files ARE swept at their new paths. The M11 two-re-key + M12 one-re-key + M13 one-re-key pattern: the legacy components route fa through the i18n dictionary (ZERO direct manifest entries); the ONE entry per phase is a `hardcoded.*` technical glyph/literal.
- **The Gate 0 owner-decision discipline held:** the §19.6 retirement question (delete vs move-as-is for dead files) is OWNER-SCOPE ("NOT in the agent's scope" per the audit's R15 + Phase 4 row). The agent presented the verified dead-file evidence + the two options + a recommendation (A), and the owner decided. Never delete files you did not create without the owner's explicit call (AGENTS.md §5).
- **The stale comment in packages/insights/src/companies/definitions.ts:16** (a pointer to the moved companies.ts path) is a Phase 7 (M16) documentation-pass item — comments referencing moved paths in NON-moved files are doc-debt, not blockers (the gates don't catch comments).

## Owner-side levers waiting

- **Phase 5 (M14) — the founding tools:** ~49 files (the 9 tool routes + converter/ + settle/ + receipt/ + the tool components + the tool libs). Verify the inventory against the audit's §"Phase 5" row + Deliverable 1's features-tools rows + the tree before the move. The tool chunks are basename-keyed (`Converter-*.js` etc.) — NO renames (R5), gate 8 stays green.
- **Phase 6 (M15) — config + chunking verification pass:** verify vite.config.ts (manualChunks undefined — chunking rides route-level lazy imports), bundle-budget regexes, index.html, PWA manifest. Opportunistic: fix `scripts/local-snapshot-preview.mjs:12` (hardcodes a nonexistent `/home/z/my-project/Currena`).
- **Phase 7 (M16) — the documentation pass:** AGENTS.md §11, README.md, docs/page-division/README.md, file-header "lives here" comments. Includes the stale comment in companies/definitions.ts:16 + the orphaned usGlobalReach dictionary templates note.
- **§19.6 retirement (future, post-modularization):** delete features/insights-legacy/ + remove the App.tsx:43 lazy route + the selfcheck.ts:53 import + the cross-domain consumer edges + clean up the orphaned usGlobalReach dictionary templates.

## Known state worth knowing

- The Currena repo was cloned to `/home/z/currena-work/currena` (not the default `/home/z/my-project` scaffold) — pnpm 10.34.5 installed to match the pin. Future sessions in this sandbox: clone fresh OR reuse the existing clone at /home/z/currena-work/currena.
- The build is DETERMINISTIC (verified at M13 — two builds from the same tree produced identical chunk hashes). The M10 "sw.js precache-tail rotation" finding did NOT recur at M13 (the sw.js −2 byte change is a real precache-list content change from the re-hashed chunk filenames).
- The GitHub token works (HTTP 200, assadigit). The Cloudflare Workers API token (cfut_…) + account ID deploy currena-api + currena-markets. The token scope doesn't expose a deployments/rollout list via the services API — the modified_on timestamp + docs-only HEAD are the deploy-lock proof.
- The production worker URL: https://currena-api.sedanama-ir.workers.dev (serves the SPA + the /api/insights* routes + the /admin ops console). SITE_MODE='public' (the Insights page is public).
- Three commits landed this session: d6d143df (chore-M0-pre delete) + 73dd3be9 (M13 move) + the bookkeeping commit (this docs update). All green + pushed.

## The M14 next-session prompt (modularization Phase 5 — founding tools)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M14 — modularization Phase 5: the founding tools domain
(the 9 tool routes + converter/ + settle/ + receipt/ + the tool
components + the tool libs, ~49 web files per the audit's Deliverable
1 features-tools rows + the Phase 5 row).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 5" + Deliverable
1's features-tools rows + risks R5/R6/R7/R9) → docs/HANDOFF.md (the
M13 version — this file) → CHANGELOG [2026-11-17] M13 → docs/DECISIONS.md
BD-M13.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′). If
   the token is invalid: STOP, tell the owner, do NOT start. Pass the
   token in the URL (https://$GH_TOKEN@github.com/…) OR export it FIRST
   in the parent shell — the M12 env-var-prefix lesson (the prefix
   syntax doesn't expand $GH_TOKEN inside the command's arguments).
2. Verify origin/main has the M13 move commit 73dd3be9, then the M13
   bookkeeping commit (docs-only — CHANGELOG.md + docs/HANDOFF.md +
   docs/DECISIONS.md, no AGENTS.md, no code; `git log --oneline -2
   origin/main`; confirm via `git show --stat HEAD`), AND production
   is the M13 deploy: currena-api modified_on 2026-11-17T01:21:18Z
   (Version ID 0ac92086; the deploy-lock; docs-only commits do NOT
   change deployed code). ANY code commit beyond the bookkeeping, or
   ANY production version newer than the M13 deploy: STOP and report.
3. Run `pnpm gates` once and record the numbers (the M13 close: 9/9,
   suite 15,284 — the post-chore-M0-pre baseline; the M13 move was
   zero-delta from 15,284; the chore-M0-pre delete was −14 from the
   M12 close's 15,298). If the baseline is red, STOP and report —
   never start a phase on a red baseline. ENVIRONMENT NOTE (M13): the
   repo may need cloning (the M13 sandbox had only a Next.js scaffold
   at /home/z/my-project; clone assadigit/Currena to a working dir);
   install pnpm@10.34.5 (matching the packageManager pin) if missing.
   If a skills/ folder is injected INSIDE the repo root, park it
   outside during gates runs (BD-M3 D4), never commit it.

The phase (audit §"Phase 5" — founding tools: ~49 web files, NO
engine move per the audit's rows — VERIFY):
- VERIFY the exact file inventory against the actual tree BEFORE the
  move (the M7′→M13 lesson — every phase re-verifies, never trusts
  the prior handoff's claim blindly). The audit's Phase 5 row says
  "~49 files: the 9 tool routes + converter/ (7) + settle/ (8) +
  receipt/ (5) children + tool components (AlertsDialog, AmountInput,
  LiveRateLine, Odometer, RateDeltaChip, ResultPopup, Led*, led/
  LedParts) + tool libs (recent-pairs → converter; settle-storage,
  photo-store → settle; history → history)" — verify each against the
  tree + Deliverable 1's features-tools rows; record the verified set
  in the session log before any git mv.
- Check whether a pd-s script exists for tools (grep apps/web/scripts/
  for importers of the candidate moved files — expect NONE: the tools
  are user-facing routes, not §20 toolkit destinations).
- The pre-gates grep set (the BD-M7 sharpened three-variant
  dynamic-import discipline + the R8 fs-path forms + the ?raw sweep),
  executed BEFORE the move: grep per candidate-moved file for ?raw +
  new URL(spec, import.meta.url) + join(__dirname/HERE/here) +
  readFileSync(join()) + fileURLToPath AND across ALL consumers for
  dynamic import(' with relative specs pointing at moved files (all
  THREE variants — record the variant list + the lazy sites).
  CHUNK-MERGER WATCH (the M13 THIRD-outcome-shape lesson): if the
  moved set includes files with dynamic import() calls whose specs
  re-anchor, expect the page chunk to re-hash (the spec strings
  SURVIVE bundling — the M13 Insights chunk + the M11 ConnectionCard
  ?raw analog). The tool routes (Converter, LiveRates, etc.) are deep
  routes with eager + lazy imports — grep for dynamic import() in the
  moved tool files BEFORE the move; if any re-anchor, expect the tool
  page chunk to re-hash (NOT the M10/M11 byte-identical shape). Record
  the baseline dist topology before the move; close with the
  full-substitution rebasing test + the name-agnostic token-multiset
  proof; the build is deterministic (M13-verified).
- The codemod method (scripts/m13-insights-legacy-codemod.mjs is the
  latest persisted pattern — the FIRST three-source-folder move + the
  global+expectCount mechanism for repeated dynamic import() specs):
  moves table → bidirectional re-anchoring via path.relative → manual
  edits computed, never counted. PRESERVED subfolder structure per the
  convention (converter/, settle/, receipt/, led/ kept as subfolders).
  Dry-run first, review every edge, then apply. Broken-path grep
  after apply. Persist the M14 codemod as scripts/m14-tools-codemod.mjs
  (matching the m{NN}-{domain}-codemod.mjs convention).
- NO renames (R5 — the tool chunks are basename-keyed: Converter-*.js,
  LiveRates-*.js, etc.; gate 8 doubles as the rename detector). Tests
  move WITH their subjects + their snapshots (R6 — CHECK for co-located
  __snapshots__). Persian-copy manifest re-keys per BD-M5 D5 (run
  copy:audit — grep the manifest for the moved paths FIRST: the tools
  carry fa literals via the copy dictionary + possibly some hardcoded
  technical glyphs; expect NON-zero). Exports map: verify whether
  tools has any (expect NONE — all ~49 are web files, same as M11 +
  M12 + M13; the 16 existing entries all point at engine paths).
- App.tsx lazy paths: VERIFY the tool lazy sites (Converter, LiveRates
  eager import, Splitter, Settle, Receipt, etc. — App.tsx:34-50ish per
  the M13 record). The LiveRates import may be EAGER (not lazy) —
  verify + handle accordingly.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical to the M13 baseline (15,284); every commit green + PUSHED
(verify the push!); the exports map verified + all path references
updated in the same commits as their moves; production == origin/main
HEAD after the post-phase deploy (deploy-lock re-check FIRST — D-43;
never run the §21 portwatch leg Tuesdays 11:00–14:00 UTC; if wrangler
deploy fails on assets-upload-session with code 10013, RETRY once
before investigating — the M9 note; environment note: `pnpm --filter
@currena/api run deploy` — the `run` is required under pnpm 10).
Bookkeeping per AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS)
and the M15 pointer (Phase 6: config + chunking verification pass —
VERIFY vite.config.ts manualChunks + bundle-budget regexes + the
opportunistic local-snapshot-preview.mjs:12 fix). Progress after M14:
modularization M14/16 · 2 remaining.
```
