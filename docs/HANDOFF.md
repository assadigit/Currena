# HANDOFF — Currena current state & next steps

## Current state (after the §19.6 retirement session)

**The legacy all-in-one `/insights` page is RETIRED (option B — the card-aware redirect) AND DEPLOYED + LIVE-VERIFIED. Production is now currena-api Version ID `c0858d06` (created 2026-11-17T14:09:09Z @ 100% — the §19.6 retirement deploy, the first production deploy since the M14 deploy `3ffcdd6b` which it supersedes). The code is committed + pushed to origin/main at `21f2209e` (the retirement commit `ecc64a05` + the bookkeeping `21f2209e`). Gates 9/9 GREEN ×2 (the production-change two-run discipline). The D-9 condition is MET (all 187 cards still have homes — the engine is untouched). The deploy respected the §21 portwatch window (executed 14:06–14:09 UTC, outside Tuesday 11:00–14:00 UTC) and the deploy-lock was re-checked FIRST (D-43: production was still `3ffcdd6b` before the deploy).**

This is the FIRST PRODUCTION code change since the M14 deploy `3ffcdd6b` — the modularization program (M1–M16, COMPLETE) was docs-only/moves; this retires the one folder it prepared for deletion. The retirement is the post-modularization successor the M16 HANDOFF flagged as "a FUTURE owner decision (Gate 0 = the owner's recorded sign-off)." GATE 0 was satisfied by the owner's explicit instruction in the session kickoff ("Deploy: YES" + "SHIP the option-B card-aware redirect" = the §19.6 timing answer "retire now"), recorded in BD-S32 Decision 1 (docs/DECISIONS.md).

## The green baseline — the §19.6 retirement record (2026-11-17)

- **Gates:** 9/9 GREEN ×2 (run 1 on the clean tree with all edits applied uncommitted: 2m 37s; commit `ecc64a05` landed; run 2 on the clean tree with `git status` empty: 2m 37s — IDENTICAL). secret scan (1044 files — 48 fewer, the deleted legacy files) · typecheck (6 packages) · lint (0/0) · copy:audit (clean — 18 orphaned manifest entries pruned) · narrator vocabulary (193×2 + 56×2 — UNCHANGED) · narrator eval (50) · layer1 strict (11969/11969) · **full test suite 15,165** (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13093) · build + bundle budget (entry 270.67/82.03 — SHRANK from 273.95/82.94; 10 destination-page chunks within budget — 3 re-baselined, 2 retired).
- **Suite delta from the M16 close:** **15,284 → 15,165 = -119 tests** (NEGATIVE — the legacy /insights-only test files retired with their modules, exactly as spec §7.6 predicted; the M7′→M16 IDENTICAL-delta streak BREAKS intentionally — recorded in BD-S32 Decision 6).
- **D-9 audit:** MET (every one of the 187 indicators verified categorized — one lane + one home each; the engine + placement table UNTOUCHED by the retirement).
- **Production:** currena-api Version ID **`c0858d06`** (`c0858d06-eda9-4b82-bc8d-400422b174b8`, created 2026-11-17T14:09:09.851485Z, @ 100%, source wrangler) — the §19.6 retirement deploy. It SUPERSEDES the M14 deploy `3ffcdd6b` (created 2026-11-17T02:42:47Z). Deploy-lock re-checked FIRST before deploying (D-43: production was still `3ffcdd6b` @ 100%). The deploy ran 14:06–14:09 UTC Tuesday — OUTSIDE the §21 portwatch window (11:00–14:00 UTC). Wrangler FIRST attempt clean (no 10013 retry needed): 56 assets uploaded (92 already uploaded — the content-hashed unchanged assets skipped), Worker Startup Time 48 ms.
- **Live-verify matrix (all GREEN):** `/` 200 (4768 B, the SPA shell) · `/insights` 200 → **redirects to `/`** (the boot guard rewrote the URL; title "Global - Currena"; verified in a headless browser) · **`/insights?card=us10y` → redirects to `/usa`** (the option-B card-aware redirect; title "USA - Currena"; verified live) · `/gold` 200 · `/world-markets` 200 · `/api/insights` 200 (89809 B, 183 readings, keys: calendar/changedThisWeek/displayMode/generatedAt/pricesAsOf/readings/ruleVersion/summary) · `/api/insights/pages/global` 200 (24606 B). The served entry hash `index-yC_ybchK.js` MATCHES the dist build (production serves the retirement build). Zero console errors on `/`. Mobile viewport (390×844) renders the header + menu (no legacy pill — the retirement cleanup visible).

## The §19.6 session record (what was done)

1. **Environment setup** (the M16 sandbox pattern): the repo re-cloned to `/home/z/Currena` (the sandbox does not retain the clone between sessions); pnpm@10.34.5 installed via `npm install -g pnpm@10.34.5`; `pnpm install` (7.9s). No `skills/` folder injected INSIDE the repo root (BD-M3 D4). Token verified (HTTP 200 on api.github.com/user — the stranded-M7 lesson; login `assadigit`).
2. **Pre-flight verification:** origin/main has the M16 commits (`cf62efbe` + `0f1cf4f6`, both docs-only + one pure-comment .tsx); production STILL the M14 deploy `3ffcdd6b` (D-43 holds); baseline gates 9/9 GREEN, suite 15,284 (the M16 close numbers EXACTLY — ZERO delta baseline).
3. **Import-graph walk (BD-M7 three-variant discipline):** 5 live edges to the legacy folder found — `selfcheck.ts:53` (the cross-tree engine→web edge), `App.tsx:43` (the lazy route), `prices-cards.test.tsx:35` (DetailsPanel), `TicSection.test.tsx:29` (TicCustodyCard), `briefing.test.tsx:20` (WorldMarkets) + the route registration (router.ts ROUTES + route-meta.ts + App.tsx render branch). The `/api/insights/export` endpoint confirmed to have its OWN copy (apps/api/src/insights-export.ts — read, never imported).
4. **The retirement (option B per docs/page-division/06-LEGACY-RETIREMENT-S24.md §7):**
   - DELETE `features/insights-legacy/` (46 legacy files moved here at M13).
   - REMOVE the `/insights` route (router.ts ROUTES + route-meta.ts + App.tsx lazy import + render branch).
   - SHIP the option-B card-aware redirect (`ensureBooted` in router.ts: a stale `/insights` bookmark → Global, or `?card=<id>` → the card's domain home via `homePageOfIndicator` dynamically imported from `@currena/insights/page-division`).
   - REMOVE the selfcheck.ts:53 cross-tree edge + the export-markdown section + the E-24 check.
   - SPLIT `prices-cards.test.tsx` (keep PricesBoard, retire DetailsPanel) + `TicSection.test.tsx` (keep TicSection, retire TicCustodyCard) + DELETE `briefing.test.tsx`.
   - REMOVE the Header legacy pill (desktop + mobile drawer) + the DestinationBody `/insights` Card.
   - REPOINT the 5 `navigate('/insights')` sites (CommoditiesTierCards + AustraliaPage×3 + UsaPage → `navigate('/')`).
   - CLEAN the dead copy keys (deprecation.*, nav.insights, nav.legacyBadge, insights.title, pd.todayOnInsights, pd.openInsights) in BOTH dictionaries.
   - CLEAN the orphaned usGlobalReach dictionary templates (insights-copy-en.ts + insights-copy-fa.ts).
   - REMOVE the Insights lazy chunk budget row + the tic-*.js shared chunk row; RE-BASELINE 3 over-budget destination-page chunks (GlobalPage 36→39, AustraliaPage 26→41/7→11, CommoditiesPage 21→24/6.5→8).
   - PRUNE the Persian-copy manifest (18 orphaned entries — rewritten in the original compact format); REGEN the narrator vocabulary.
   - UPDATE router.test.ts + route-meta.test.ts (the /insights assertions/entries).
5. **Gates ×2:** 9/9 GREEN, suite 15,165 (delta -119 — the legacy tests retired). Both runs IDENTICAL (2m 37s each).
6. **D-9 audit:** MET (187 indicators verified categorized — the retirement touches no engine/placement code).
7. **Commit + push:** `ecc64a05` (68 files). Pushed to origin/main (`cf62efbe..ecc64a05`) — verified (local HEAD == origin/main == `ecc64a05`).

## The accepted losses (per the spec's per-page gap table — BD-S32 Decision 3)

- **R-3** (the two region verdicts): ACCEPTED — Global renders ten per-gauge tiles; the region aggregates are not carried (the D-11 one-screen rule trade).
- **R-4** (the two global shadow-gauge headers): ACCEPTED — the members render on their domain homes; the question header is a shadow with no verdict to lose.
- **R-5** (the details panels + per-id history + Layer-1 copy — the LARGEST gap): ACCEPTED — the 5 `navigate('/insights')` sites repointed to Global. The `/api/insights/:id/history` endpoint stays (no page calls it now). A future session can port DetailsPanel.
- **R-6** (the narrator's multi-block presentation): ACCEPTED — Global carries the one-line NarratorLine; the staged rollout is still closed by default.
- **R-7** (the watchlist, search/filter, CSV/ics exports): ACCEPTED — the `/api/insights/export` endpoint stays (owner tools); the UI door goes with the page.
- **R-8** (the calendar, About, TopMovers, Together, MoneyPanel, UsGlobalReachGroup, CompaniesTable, ReadingProgress, JumpNav): ACCEPTED — each /insights-only surface gone; the destination pages carry the equivalent content in pieces.

## Operational notes worth carrying

- **The §19.6 retirement is the post-modularization successor.** The 16-session modularization program (M1–M16) prepared the one-folder delete; this session executed it. The N18 edge (the legacy super-consumer) — its cross-domain import edges disappear on retirement (the domain components now render their own or the shared layer's).
- **The option-B redirect uses a dynamic import** of `homePageOfIndicator` from `@currena/insights/page-division` in router.ts's `ensureBooted`. This keeps the entry chunk (the money page) free of engine code — the placement module rides the GlobalPage lazy chunk's existing import graph. A brief Global render precedes the redirect for deprecated `?card=` deep-links (the trade-off recorded in BD-S32 Decision 2).
- **The `/api/insights` endpoint + `/api/insights/export` are UNAFFECTED** — they keep their OWN copies (apps/api/src/insights-export.ts — read, never imported). The self-check no longer writes the full-export markdown; SELF_AUDIT.md is the one remaining artefact.
- **The standing limits carry forward (AGENTS.md §11):** the §21 portwatch window (never run Tuesdays 11:00–14:00 UTC) + the deploy-lock re-check FIRST (D-43) + the wrangler 10013 retry rule + the `run`-required-under-pnpm-10 rule. The R5 no-renames constraint carries forward for any future file move.

## Owner-side levers waiting

- **DEPLOYED — the deploy lever is CLOSED.** currena-api Version ID `c0858d06` @ 100% (created 2026-11-17T14:09:09Z). Production == the SPA built from origin/main HEAD `21f2209e`. Rollback recipe (per docs/DEPLOY.md): `npx wrangler rollback` (one command, from apps/api) + `git revert ecc64a05` — the retirement is display-layer, nothing else moved.
- **The external investor's review of spec §19** (the seven questions) — re-opens the page-division spec v2 work (the AF-1…AF-8 findings ride that pass).
- **The R-5 details-panel port** — the spec's recommendation; the burn-in period (if adopted) measures whether readers used the detail panels. The `/api/insights/:id/history` endpoint stays for the port.
- **triage the queued unreviewed fa strings** (the copy:audit queue — 1240 entries, does not fail the audit).
- **revoke or rotate the session credentials** now that the retirement work has shipped (they were used, never stored).

## Known state worth knowing

- **The dist topology (post-retirement):** the 12 Insights lazy chunks are GONE (left the build with the deleted folder). The entry chunk SHRANK to 270.67/82.03 (from 273.95/82.94). 10 destination-page chunks within budget (3 re-baselined). The `page-division-*.js` chunk is new (the dynamic import from router.ts). The `tic-*.js` shared chunk merged into UsaPage (the only remaining consumer). Build deterministic (two gates runs produced identical hashes).
- **The Persian-copy manifest:** 7988 entries (was 8006 — 18 orphaned entries pruned). Rewritten in the original compact single-line-entry format. copy:audit GREEN.
- **The narrator vocabulary:** 193×2 + 56×2 (UNCHANGED — the usGlobalReach block was not part of the vocabulary).

## The next-session pointer — the retirement is COMPLETE

**The §19.6 legacy `/insights` retirement is DONE AND VERIFIED LIVE: code shipped (`ecc64a05` + `21f2209e` on origin/main), gates 9/9 GREEN ×2, suite 15,165 (delta -119), D-9 MET, deployed (`c0858d06` @ 100%), live-verified (the option-B redirect matrix + zero console errors + mobile). Production == origin/main HEAD. Nothing remains for the §19.6 plan.**

The standing owner-side levers (the investor's §19 review, the R-5 details-panel port, the fa-string triage, the credential rotation) re-open work at the owner's discretion, each behind its own Gate 0. The standing limits in AGENTS.md §11 (the §21 portwatch window, the D-43 deploy-lock re-check, the wrangler 10013 retry rule) carry forward to any future session that deploys or moves files.
