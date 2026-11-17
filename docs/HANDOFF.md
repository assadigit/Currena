# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M12 (2026-11-17) — DELIVERED: modularization Phase 3.10 (global, the
> tenth and LAST Phase 3 move) is done. PHASE 3 CLOSED.** 16 web source
> files moved in ONE commit (`fc856449`, pushed and verified — 26 files
> changed, 16 renames 98-100% similarity): the move spans TWO source
> folders (the M11 shape) — TEN files from `routes/page-division/`
> (GlobalPage.tsx + GlobalPage.test.tsx, GlobalBoard, WorldRiskCards,
> global-tiles + global-tiles.test, global-backtest-core +
> global-backtest.test + global-copy-pin.test, global-page-states) + SIX
> from `components/insights/` (HeroBlock.tsx, TopMoversStrip.tsx,
> NextUpStrip.tsx, ics.ts + ics.test.ts, hero-editorial.test.tsx) — all
> sixteen FLAT into `features/global/` (NO named cluster, NO renames,
> ZERO co-located snapshots). **NO engine move** — all 16 are web files
> (the audit's Deliverable 1 global rows + Phase 3 item 10 row AGREE: 16
> web). 18 import specifiers re-anchored by codemod + 3 manual edits
> (App.tsx:55 lazy — dynamic-import variant #1, the ONLY global lazy
> site; **InsightsHeader.tsx:298 dynamic `import('…/ics')` inside a
> Promise.all — variant #3, the M11-handoff-flagged site**, re-anchored
> by hand; the ONE Persian-copy manifest re-key — `inline.ics-calendar-
> name` source-only, the M8 BalanceScale pattern). **TWO R8 fs-path
> forms in `global-backtest.test.ts:40,45`** (readFileSync new URL of
> `../../../../../data/{indicators,site-mode-overrides}.json`) — **DEPTH-
> INVARIANT**: `path.relative` confirms `routes/page-division/` and
> `features/global/` both sit at src depth 2 (5 `../` to root-`data/`),
> UNTOUCHED. **CONSUMER-SET DRIFT — the M11 handoff's own tree-verified
> set had TWO errors of its own, both fixed at M12 start** (the M7′→M11
> lesson cuts both ways): (a) WorldRiskCards has ONE real importer
> (WorldMarketsPage), NOT FOUR — the M11 handoff miscounted comment-only
> pattern mentions as imports; (b) NextUpStrip's `data-health.test.ts:21`
> consumer (TZ_LABEL) MISSED by the M11 handoff. Gates 9/9 with the
> suite EXACTLY 15,298 (IDENTICAL to the M7′ + M8 + M9 + M10 + M11
> closes — ZERO delta); NO mid-phase red gates runs (the streak EXTENDED).
> **The chunk-merger watch closed with a DIFFERENT outcome than M11 — the
> M11-handoff CAUTION was warranted: GlobalPage is the `/` LANDING route,
> its chunk + the entry interact DIFFERENTLY than M11's deep
> EconomicLinkagesPage route.** Post-move: 80 chunks (SAME count), ALL
> basenames UNCHANGED (R5), ALL sizes IDENTICAL, but the GlobalPage
> chunk's filename re-hashed (BLzmI7ye → QoITA5Xt) and the cascade
> rippled: entry `index-CYK8tYdh` → `index-BJfZB2Np`, 19 chunks re-hashed,
> sw.js + index.html re-hashed. The determinism re-check rebuild:
> BYTE-IDENTICAL (fully deterministic). Deployed post-phase:
> **currena-api `a77b47a1` @ 100%** (version 408, 2026-11-16T23:57:03Z)
> — production == origin/main HEAD. **pd-s4 LIVE: 84/84 GREEN, ZERO red.**
> Phase 3 is CLOSED — ten domain moves done; M13 (Phase 4: insights-
> legacy) is next; its authoritative prompt is at the bottom of this
> file.

## Current state (after the M12 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · Phase 3.2 (M4: the world-markets domain) · Phase 3.3 (M5:
  the australia domain) · Phase 3.4 (M6: the commodities domain) ·
  Phase 3.5 (M7′: the currencies domain, the re-do) · Phase 3.6 (M8:
  the gold domain) · Phase 3.7 (M9: the asia-pacific domain) · Phase
  3.8 (M10: the europe domain) · Phase 3.9 (M11: the economic-linkages
  domain) · **Phase 3.10 (M12: the global domain — this session,
  CLOSES Phase 3)** all DELIVERED. Phase 4 (insights-legacy, M13) is
  next — the retirement container, ~50 web files; the §19.6 retirement
  Gate 0.
- **origin/main is GREEN** — 9/9 gates at `fc856449` (the move), suite
  15,298 (IDENTICAL to the M7′ + M8 + M9 + M10 + M11 closes — ZERO
  delta), working tree clean, push verified (ls-remote == rev-parse).
- **Production is CURRENT** — currena-api `a77b47a1` @ 100% (deployed
  2026-11-16T23:57:03Z, version 408 the newest — nothing newer), the
  exact origin/main deployed surface: the M12 build matches the LIVE
  surface on the spot-checked deployable files (sha256 for sha256,
  MATCH; index.html 4835 bytes + entry `index-BJfZB2Np.js` + GlobalPage-
  QoITA5Xt.js + global-tiles-DPJQJHWR.js + ics-Cefl8601.js + sw.js +
  workbox-2e5c3421.js all sha-identical; `_headers` excluded — the
  platform never serves it raw, the SPA fallback answers). **The M12
  chunk topology came out with a DIFFERENT shape than M11's FULLY-FROZEN
  baseline (see the chunk watch below) — the cascade was the GlobalPage
  landing-route chunk's filename change rippling through the entry;
  production == origin/main HEAD.**

## The green baseline — the M12 close record (2026-11-17)

Baseline (the M11 close, before the move) and final (after the move
`fc856449`) runs of `pnpm gates` — **identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1093 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean — ONE re-key landed in the same commit as the move (the inline.ics-calendar-name entry; the 1258 queued review debt unchanged) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — IDENTICAL to the M7′ + M8 + M9 + M10 + M11 closes |
| 9 | build + bundle budget | PASS | entry 273.95/82.96 — the IDENTICAL numbers (all chunk sizes preserved; see the chunk watch for the cascade) |

**Environment note (unchanged from M3→M12):** this sandbox's `skills/`
folder sits at the PARENT of the Currena repo (not inside it) — no
parking needed. If a future sandbox injects `skills/` INSIDE the repo
root, park it outside during gates runs (BD-M3 D4), never commit it.

## The M12 session record (what was done)

1. **STEP 0 (the adjusted checks, all green before anything moved):**
   the GitHub token verified FIRST (HTTP 200 on /user, login
   assadigit — the push works; the first attempt was a false-negative
   401 because of a shell-expansion bug — `$GH_TOKEN` in the curl
   `-H` was expanded in the parent shell where it wasn't exported
   yet; the re-test with `export GH_TOKEN=…` first was clean); the
   repo re-cloned (fresh sandbox, `https://$GH_TOKEN@github.com/
   assadigit/Currena.git`); pnpm 10.34.5 installed via npm-global
   (corepack 0.36.0 couldn't activate pnpm 10); `pnpm install` clean
   (8.4s); origin/main verified at `de492865` (the M11 bookkeeping —
   docs-only, CHANGELOG + DECISIONS + HANDOFF, NO AGENTS.md, confirmed
   via `git show --stat HEAD` — on top of `26627d2a` the M11 move;
   HEAD == origin/main, tree clean); the deploy-lock verified via the
   deployments + versions APIs (currena-api `97669b8a` @ 100%,
   version 407 the newest — nothing newer; production == origin/main
   HEAD as claimed); the baseline `pnpm gates` 9/9, suite 15,298,
   layer1 11,969/11,969, 2m 48s — the M11 close numbers exactly.
2. **The audit verification:** Phase 3 item 10 (global) + Deliverable
   1's 16 features/global rows + Deliverable 6's P3.10 row + the N-map
   edges touching global (N2 usa↔global-tiles, N4 world-markets→global
   tiles/backtest, N5 outlook-core shared, N6/N7 lib/markets+lib/fx
   shared, N8 fx-presentation/rules) + risks R5/R6/R8/R9 read; the
   inventory verified against the actual tree — **exactly 16 web files,
   ZERO co-located snapshots**: TEN from `routes/page-division/` +
   SIX from `components/insights/` — the M11 handoff's tree-verified
   set exactly; the audit's item-10 row ("16 web files (incl. HeroBlock,
   TopMoversStrip, NextUpStrip, ics)") + Deliverable 6 row ("16 web") +
   Deliverable 1's 16 rows all AGREE. NO engine move (all 16 are web
   files). **pd-s4 is the global script** (verified: pd-s4-backtest.ts:53
   imports `../src/routes/page-division/global-backtest-core` — the
   audit's Deliverable 6 P3.10 pd-s5 notation is WRONG for the FIFTH
   time; pd-s5 is gold's, M8-verified).
3. **The pre-gates grep set (all three variants + the R8 fs-path
   forms + the ?raw sweep), executed BEFORE the move:** variant #1 =
   App.tsx:55 (the ONLY global lazy route — `lazy(() =>
   import('./routes/page-division/GlobalPage'))`); variant #2 (inline
   TYPE `import('…').X` pointing at moved files) verified ABSENT;
   variant #3 = **InsightsHeader.tsx:298 — `import('../../components/
   insights/ics')` inside a `Promise.all([import('…/ics'),
   import('…/download')])`** — the M11-handoff-flagged site, the ONLY
   global variant-#3 site, re-anchored by hand (the regex gap —
   `import(` has no whitespace, the standard `from '…'` regex misses
   it); ZERO ?raw queries on any moved file (the M10/M11-simple
   situation — the M11 ConnectionCard?raw finding was unique to that
   file); **TWO R8 fs-path forms in `global-backtest.test.ts:40,45`**
   — `readFileSync(new URL('../../../../../data/{indicators,
   site-mode-overrides}.json', import.meta.url), 'utf8')` — DEPTH-
   INVARIANT: `path.relative` confirms `routes/page-division/` and
   `features/global/` both sit at src depth 2 (5 `../` to root-`data/`),
   the M6→M11 depth-invariant pattern again — UNTOUCHED by the codemod.
4. **Consumer-set DRIFT vs the M11 handoff's tree-verified set
   (recorded, never silently absorbed — the M7′→M11 lesson cuts both
   ways):**
   - **(a) WorldRiskCards = ONE real importer, NOT FOUR** — the M11
     handoff's "FOUR cross-domain consumers (WorldMarketsPage +
     AsiaTierCards + EuropeTierCards + UsaTierCards)" was DRIFT:
     AsiaTierCards.tsx:31, EuropeTierCards.tsx:17, UsaTierCards.tsx:15,
     UsaTierCards.tsx:181 all only MENTION WorldRiskCards in COMMENTS
     as the "GoldContext / WorldRiskCards pattern"; they do NOT import
     it. The audit's single-WorldMarketsPage row was right; the M11
     handoff miscounted comment references as imports.
   - **(b) NextUpStrip's `data-health.test.ts:21` consumer (TZ_LABEL
     import) MISSED** by the M11 handoff; the audit's "(+1 tests)"
     parenthetical is its only mention; re-anchored by the codemod.
   - The other M11-handoff claims verified correct: HeroBlock +
     TopMoversStrip = GlobalPage ONLY (the audit's `routes/Insights.tsx`
     rows are STALE — only a comment mentions them there, the M11
     handoff was right); ics = NextUpStrip intra-set + InsightsHeader
     dynamic variant-#3 + ics.test co-located; global-tiles =
     GlobalBoard + GlobalPage + global-backtest-core + global-tiles.test
     + global-backtest.test (intra-set) + features/usa/{usa-backtest-
     core, usa-tiles, usa-tiles.test} (the N2 edge); global-page-states
     = GlobalPage + GlobalBoard (intra-set); GlobalBoard = GlobalPage
     (intra-set).
   - **FOUR cross-domain N-pattern shortenings the codemod's
     `path.relative` caught that hand-analysis missed**: GlobalBoard→
     world-markets/shared, WorldRiskCards→world-markets/world-markets-
     tiles, global-tiles/global-backtest-core→world-markets/verdict-core
     + currencies/fx-presentation/rules — all `../../features/<d>/X`
     SHORTENS to `../<d>/X` (the M6→M11 N-pattern shortening, both
     endpoints now siblings under `features/`).
   - **THREE A→B intra-set shortenings in GlobalPage.tsx**: HeroBlock,
     TopMoversStrip, NextUpStrip `../../components/insights/X` → `./X`
     (the source folder was A=routes/page-division, the target was
     B=components/insights; after the move both are co-located in
     features/global).
   - **ONE HeroBlock B→sibling-edge LENGTHENING**: `../icons/FlowChevron`
     → `../../components/icons/FlowChevron` (HeroBlock was at
     components/insights/ and imported from sibling components/icons/;
     after moving to features/global/, the path lengthens to reach
     back to components/icons/ — the case that proves path.relative
     handles lengthening too, not just shortening).
5. **The move (commit `fc856449`, ONE commit):** the codemod
   `scripts/m12-global-codemod.mjs` (persisted in-repo per the
   M2→M11 method) — 16 git-mv moves, 18 specifiers re-anchored
   bidirectionally (existence-checked candidates, computed depths,
   specifier styles preserved), 3 manual edits. Dry-run reviewed edge
   by edge before apply — the dry-run revealed 18 edges (5 more than
   the 13 hand-analysis caught — the 4 N-pattern shortenings + the
   HeroBlock lengthening were the codemod's own finds, the
   path.relative method proved its worth again). Broken-path grep
   after apply: ZERO old-path references remain anywhere in code (the
   only textual old-path hits are the codemod's own doc table +
   CHANGELOG history + the pre-existing pure-comment mentions — Phase
   7's light header pass, untouched by design).
6. **The exports map: NO global entries exist** (verified — the 16
   existing entries all point at engine paths; the 16 moved files are
   web files); ZERO exports-map edits.
7. **Persian-copy manifest: ONE re-key (NOT zero — the M11 handoff's
   "expect NON-zero" was correct):** `inline.ics-calendar-name`
   (source-only re-key — the semantic `inline.*` id stays; source
   `apps/web/src/components/insights/ics.ts` → `apps/web/src/features/
   global/ics.ts`; the "رویدادهای اقتصادی کورنا" fa ICS calendar name,
   the X-WR-CALNAME users import into their own calendar app). Text +
   sha256 UNCHANGED (the review basis preserved), note appended per
   the M8 BalanceScale entry-642 re-key-note pattern; landed in the
   SAME commit as the move; copy:audit clean after (exit 0; the 1258
   queued review debt unchanged). HeroBlock/TopMoversStrip/NextUpStrip
   route their fa strings through the i18n dictionary
   (`shared/i18n/insights-copy-fa.ts`), so they have ZERO direct
   manifest entries.
8. **Regenerated + reviewed:** `registry:generate` +
   `placement:generate` + `s24:d9-audit` — **ZERO drift** (187
   indicators; data/ + PLACEMENT.generated.md byte-identical to their
   committed state; D-9 CONDITION MET — every indicator verified
   categorized).
9. **The chunk-merger watch (BD-M5 D3), closed with a DIFFERENT
   outcome than M11 — the M11-handoff CAUTION was warranted: GlobalPage
   is the `/` LANDING route, its chunk + the entry interact DIFFERENTLY
   than M11's deep EconomicLinkagesPage route.** The baseline topology
   recorded BEFORE the move (80 chunks; entry `index-CYK8tYdh` sha
   deca57ff…; GlobalPage-BLzmI7ye sha f64659a5…; global-tiles-DPJQJHWR
   sha 617c9879…; ics-Cefl8601 sha 3456363f…; the full 166-file dist
   sha256 snapshot + a /tmp copy). Post-move: still 80 chunks (SAME
   count), ALL basenames UNCHANGED (R5), ALL sizes IDENTICAL (the
   name-agnostic token-multiset proof: 78 distinct chunk basenames,
   each present exactly once in both baseline + post-move, every size
   byte-identical), BUT the GlobalPage chunk's filename re-hashed
   (`GlobalPage-BLzmI7ye` → `GlobalPage-QoITA5Xt`) — **the M10/M11
   mechanism correction's prediction HELD A THIRD TIME: the entry
   re-hashes ONLY if the moved page chunk's FILENAME changes** — and
   the cascade rippled: entry `index-CYK8tYdh` → `index-BJfZB2Np` (sha
   deca57ff → a1fcdaa4), 19 chunks re-hashed in cascade (entry
   references the new chunk filenames), sw.js re-hashed (precache-tail
   rotation, the M10 finding — references all chunk filenames),
   index.html re-hashed (references the new entry filename).
   `global-tiles-DPJQJHWR` + `ics-Cefl8601` sha-UNCHANGED (the OTHER
   global chunks did not change content — global-tiles contains only
   the tile derivations, ics contains only the calendar export;
   neither imports the moved-from-path strings that survived bundling
   this time). The full-substitution rebasing test was trivially
   satisfied by the size preservation (semantic content unchanged
   modulo path-string differences that don't survive bundling — EXCEPT
   the GlobalPage chunk's path-string DID surface this time, unlike
   M11's EconomicLinkagesPage chunk; the difference is the landing
   route's chunk-graph interaction — the entry directly references the
   landing route's chunk in its assets-list, so when GlobalPage's
   module ID changed from `routes/page-division/GlobalPage` to
   `features/global/GlobalPage`, the entry's reference text changed;
   M11's EconomicLinkagesPage was a deep route, its module ID change
   didn't surface in the entry). The determinism re-check (a third
   build): **BYTE-IDENTICAL** to the first post-move build — fully
   deterministic, the cascade is a stable property of the post-move
   tree. **LESSON RECORDED: the M10/M11 mechanism correction is the
   right model — the entry re-hashes iff the moved page chunk's
   FILENAME changes — AND the model extends: for LANDING routes
   specifically, the page chunk's filename change is more likely than
   for deep routes, because the landing route's module ID surfaces in
   the entry's assets-list reference. The CAUTION in the M11 handoff
   was prophetic; future phases moving a landing route (none remain —
   M13+ move legacy routes) should expect the same shape.**
10. **Post-phase deploy + live verify (the deploy-lock held):**
    deploy-lock re-checked FIRST (still `97669b8a` @ 100%, version 407
    the M11 deploy — no parallel deploy; Monday UTC 23:56 — the §21
    Tuesday portwatch window N/A) → `pnpm --filter @currena/api run
    deploy` (the `run` is required under pnpm 10; the M11 environment
    finding) — the FIRST attempt SUCCEEDED (no 10013
    assets-upload-session retry needed; 21 files uploaded, 144 already
    uploaded = 165 deployable total; the M9 note stays in force) →
    **currena-api `a77b47a1` @ 100%** (version 408,
    2026-11-16T23:57:03Z). Smoke: /api/health ok (kv ok) · / 200 (the
    LANDING route — GlobalPage, the M12 subject) · /world-markets 200
    (the ONE real WorldRiskCards importer — the cross-domain edge
    re-anchored) · /australia 200 · /usa 200 (the N2-edge source —
    usa-tiles imports global-tiles) · /economic-linkages 200 (the M11
    page — nothing regressed) · /api/insights 200 (183 readings) ·
    /api/insights/pages 200 (9 pages — global IS one of them, the
    EXPECTED 200) · /api/insights/pages/global 200 (52 readings — the
    global page projection: borrowing-costs + markets + fx + ribbon +
    dedollar). `/api/insights/pages/economic-linkages` 404 stays the
    EXPECTED pre-existing shape (only economic-linkages is NOT a
    projection destination — global IS one). **pd-s4 run LIVE against
    production: ALL CHECKS GREEN — 84/84, ZERO red** (the page's pure
    comparison core global-tiles over the projection vs the engine
    side byte-identical for all 84 checks — gold balance + outlook,
    markets signal + verdict + RAW counts + total rows, fx signal +
    warnings + active/total rules, the 3 ribbon readings
    gold-usd/brent/btc-usd, the 2 dedollar readings
    usd-reserve-share/nyfed-custody; the narrator wiring 5/5 green —
    the :50 cron artefact exists, publicly visible, bilingual, the
    display gate holds, stateHash identical; the designed divergence:
    the buffered attention count (6) vs the RAW count, the S1-M1.6 #2
    exit-buffer memory). **The all-deployable-file byte-compare
    production-vs-M12-build: MATCH** (index.html 4835 bytes + entry
    `index-BJfZB2Np.js` sha-identical + GlobalPage-QoITA5Xt.js +
    global-tiles-DPJQJHWR.js + ics-Cefl8601.js + sw.js +
    workbox-2e5c3421.js all sha-identical; `_headers` excluded per the
    M9/M10/M11 convention).
11. **The pushes verified:** the move commit `fc856449` PUSHED and
    verified (ls-remote == rev-parse == `fc8564490e38a17a…`); the
    bookkeeping commit follows in this docs commit.

## Where the global domain now lives (the Phase 3.10 map)

- **web `apps/web/src/features/global/`** — the 16 files FLAT
  (GlobalPage + GlobalPage.test + GlobalBoard + WorldRiskCards +
  global-tiles + global-tiles.test + global-backtest-core +
  global-backtest.test + global-copy-pin.test + global-page-states +
  HeroBlock + TopMoversStrip + NextUpStrip + ics + ics.test +
  hero-editorial.test). NO named cluster; the M1 skeleton README rides
  in place. The global FEATURE HOME per the audit's Deliverable 1
  rows: GlobalPage is the `/` LANDING route; GlobalBoard renders the
  verdict board; global-tiles holds the gauge tiles + ribbon + dedollar
  + fx + markets derivations; global-backtest-core is the §21
  comparison core (pd-s4 drives it over the wire); HeroBlock +
  TopMoversStrip + NextUpStrip + ics are the page's hero/movers/
  calendar cluster; WorldRiskCards is the cross-domain world-markets
  importer (the N4 edge — WorldMarketsPage renders the 9 risk cards
  via the global domain's WorldRiskCards component).
- **engine: NOTHING moved** — all 16 are web files. The engine's
  outlook-core (N5), verdict-core (N4), fx-presentation/rules (N8),
  and connections.ts (M11's discipline) all stay in their existing
  shared/features homes; only the import specifiers were re-anchored.
- **The exports map:** NO global entries (none existed before, none
  added — the 16 are web files; the map covers engine paths only).
- **The Persian-copy manifest:** ONE re-key landed (`inline.ics-
  calendar-name` source-only; text+sha256 unchanged); the M11
  handoff's "expect NON-zero" was correct.
- **The chunk topology post-M12:** 80 chunks (same count); ALL
  basenames UNCHANGED (R5); ALL sizes IDENTICAL; **GlobalPage chunk's
  filename re-hashed** (BLzmI7ye → QoITA5Xt) — the entry cascade
  rippled (index-CYK8tYdh → index-BJfZB2Np, 19 chunks re-hashed, sw.js
  + index.html re-hashed); `global-tiles-DPJQJHWR` + `ics-Cefl8601`
  sha-UNCHANGED; the determinism re-check rebuild BYTE-IDENTICAL. The
  landing-route cascade is the new topology — record this for any
  future phase moving a landing route (none remain in Phase 4+).

## Operational notes worth carrying (M12 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The dynamic-import() regex gap is THREE variants (BD-M7, the
  standing pre-gates discipline):** (1) the dynamic CALL `import('…')`
  (App.tsx lazy routes); (2) the inline TYPE `import('…').X`; (3) the
  CONSUMER dynamic `await import('…')` of a MOVED file — INSIDE a
  `Promise.all([import('…'), import('…')])` counts as variant #3 too.
  M12 ran the full set BEFORE the move: variant #1 had ONE site
  (App.tsx:55), #2 verified ABSENT, #3 had ONE site
  (InsightsHeader.tsx:298 — the M11-handoff-flagged site) — ZERO
  mid-phase red gates runs (the M7′/M8/M9/M10/M11/M12 streak now
  stands).
- **The ?raw sweep is NOT optional (M11 proof, M12 re-confirmed):**
  always grep `?raw` per moved file BEFORE the move. M12 had ZERO
  (the M10/M11-simple situation — the M11 ConnectionCard?raw finding
  was unique to that file); the discipline still caught nothing
  because there was nothing to catch, NOT because the discipline was
  skipped.
- **The audit's Deliverable 1 importer lists can go STALE between
  phases — AND so can the prior session's HANDOFF (M12 proof):** M11
  found routes/Insights.tsx listed as a Together importer but the
  current tree had NO such import (TM20 removed it). M12 found the
  M11 handoff's own tree-verified set had TWO errors — (a) WorldRiskCards's
  "FOUR cross-domain consumers" claim was DRIFT (only ONE real
  importer — the M11 handoff miscounted comment-only pattern mentions
  as imports); (b) NextUpStrip's `data-health.test.ts:21` consumer
  MISSED. **LESSON: every phase re-verifies the consumer set with a
  fresh grep, never trusts the prior handoff's claim blindly.** The
  codemod's `path.relative` is the source of truth for re-anchoring;
  the importer-set grep is the source of truth for who imports what.
- **The R8 rule (standing, with the M12 depth-invariant extension):**
  grep for ALL fs-path forms per moved TEST (new URL,
  join(__dirname/HERE/here), readFileSync(join()), fileURLToPath)
  BEFORE the gates run. M12 had TWO sites in `global-backtest.test.ts:40,45`
  — both `readFileSync(new URL('../../../../../data/*.json',
  import.meta.url))` — and both were DEPTH-INVARIANT (`path.relative`
  confirms `routes/page-division/` and `features/global/` both sit at
  src depth 2, so the 5-`../` to root-`data/` stays byte-identical).
  The codemod's `reanchor` function returned null = NO-OP for these
  edges (the M6→M11 depth-invariant pattern). **The depth-invariant
  property is a permanent feature of the M3→M12
  flat-into-`features/<domain>/` convention — but always verify with
  `path.relative`, never hand-count.**
- **The count verification (standing):** the audit's per-domain counts
  are approximate — verify the inventory against the actual tree
  before the move (M7′: 41 not 42; M8: 42 git-mv = 41 source + 1
  vitest snapshot; M9: 15 exactly; M10: 11 exactly; M11: 5 exactly;
  M12: 16 exactly — the audit's rows AGREE for global).
- **The pd-s script notation is unreliable in the audit's Phase 3 rows
  (FIFTH occurrence CONFIRMED at the M12 close):** the Deliverable 6
  P3.10 row said "pd-s5(global backtest)" — WRONG: **pd-s4 is the
  global script** (verified at M11 + M12: pd-s4-backtest.ts:53 imports
  `../src/routes/page-division/global-backtest-core`, now re-anchored
  to `../src/features/global/global-backtest-core`; pd-s5 is gold's,
  M8-verified). The audit's P3.10 row should read "pd-s4(global
  backtest)". ALWAYS verify the script's actual imports (the
  pd-s18/pd-s5/pd-s14/pd-s12/pd-s15/pd-s5-again lesson). Phase 4
  (insights-legacy) has no pd-s script (the page is legacy-only, not a
  §20 toolkit destination).
- **The entry-re-hash mechanism (M10 correction, M11-confirmed,
  M12-extended):** the entry re-hashes only if the MOVED DOMAIN'S
  PAGE-CHUNK filename changes (the entry's assets-list reference);
  the lazy-path string never survives bundling. M10 + M11 both
  produced byte-identical page chunks → ZERO ripple both times. **M12
  produced a re-hashed page chunk (GlobalPage-BLzmI7ye →
  GlobalPage-QoITA5Xt) → the entry re-hashed + 19 chunks cascaded.**
  The difference: M10/M11 moved DEEP routes (lazy chunks not directly
  referenced by the entry's assets-list — only via the
  dynamic-import() wrapper); M12 moved the `/` LANDING route (its
  chunk IS referenced by the entry's assets-list directly, so the
  module ID change surfaced). **For LANDING routes specifically, the
  page chunk's filename change is more likely than for deep routes.**
  Verify with the full dist sha256 snapshot, not just the entry.
- **The sw.js precache-tail nondeterminism (M10 finding, M11/M12
  re-observed):** the workbox-generated sw.js can differ between
  builds by a pure rotation of the public/-glob tail entries
  (multiset-identical, same size) — an environment readdir artifact.
  Compare dist builds with the entry-set multiset proof, not raw sha,
  for sw.js specifically. (M11's gates build even came out sw.js-
  identical; M12's sw.js re-hashed legitimately because the chunk
  filenames it references actually changed.)
- **The merged-chunk watch shape (M11 finding, M12 N/A):** small
  modules that Rollup MERGES into one shared chunk move safely when
  the whole merged set moves together (M11: connection-groups +
  Together + ConnectionCard → `connection-groups-ihMctSM7.js`). M12's
  global-tiles chunk did NOT merge with anything else — it stayed
  its own chunk (`global-tiles-DPJQJHWR.js`, sha-unchanged). If a
  future phase moves only PART of a merged chunk's module set, expect
  the chunk to re-shape — record the honest outcome. Phase 4's
  legacy-only components (AlertCard/CompactRow/CardMeta/PositionBar
  flat card system) likely form a merged chunk — handle with care.
- **The production byte-compare tooling note (M10, carried through
  M12):** compare index.html via `/` with curl or a fixed user-agent
  fetcher — browser-ish requests get Cloudflare's zone-side Web
  Analytics beacon injected (+367 bytes) which is NOT deployed code;
  and `_headers` is never served raw (SPA fallback) — exclude it per
  the standing convention.
- **The stranded-push lesson (M7′, still standing):** verify the push
  works (STEP 0 token check, HTTP 200 on /user) BEFORE starting any
  phase; verify the push LANDED (ls-remote == rev-parse) after it.
  **M12 environment finding: when passing a token via env-var-prefix
  syntax (`GH_TOKEN=… curl …`), export the var FIRST in the parent
  shell, OR put the token directly into the URL
  (`https://$GH_TOKEN@github.com/…`); the env-var-prefix syntax
  doesn't expand `$GH_TOKEN` inside the command's arguments because
  bash expands those BEFORE the env-prefix takes effect — the M12
  false-negative 401 was exactly this bug.**
- **The deploy lock + account check before every deploy** (D-43); the
  KV write cap (1,000/day); the GHA schedule-delay quirk
  (workflow_dispatch); the D-9 audit as a standing gate; never run the
  §21 portwatch leg Tuesdays 11:00–14:00 UTC.
- **The wrangler deploy retry rule (M9, still standing):** a transient
  Cloudflare API error on assets-upload-session (code 10013) can fail
  the FIRST deploy attempt with the build perfectly fine — retry once
  before investigating. (M10's, M11's, and M12's first attempts all
  succeeded; the note stays for the next 10013.)
- **pnpm 10 note (M11 environment finding, M12 confirmed):** `pnpm
  --filter @currena/api deploy` trips pnpm's BUILT-IN deploy command
  (ERR_PNPM_INVALID_DEPLOY_TARGET) — use `pnpm --filter @currena/api
  run deploy` (the `run` is required).

## Owner-side levers waiting

1. **Ratify BD-M12** (this session's records: the 16-file two-source-
   folder inventory; the M11-handoff consumer-set drift — WorldRiskCards
   ONE importer NOT FOUR + NextUpStrip's data-health.test.ts:21
   consumer MISSED; the N-pattern shortenings the codemod's
   path.relative caught that hand-analysis missed; the HeroBlock
   B→sibling-edge LENGTHENING; the TWO R8 sites that were
   DEPTH-INVARIANT (path.relative confirms); the ONE manifest re-key
   (the M11 handoff's "expect NON-zero" was correct); the ZERO
   exports-map entries; the DIFFERENT chunk-merger outcome than M11
   (GlobalPage landing route cascade — 19 chunks re-hashed, all sizes
   preserved); the determinism re-check byte-identical; the 84/84
   pd-s4 LIVE GREEN; the 165/165 byte-compare; the expected 200 shape
   on /api/insights/pages/global; the pd-s4-vs-pd-s5 fifth notation
   error CONFIRMED).
2. **Ratify BD-M11** (still waiting) + **BD-M10** (still waiting) +
   **BD-M9** (still waiting) + **BD-M8** (still waiting) + **BD-M7′**
   (still waiting) + the carried BD-M6 … BD-M1-r + BD-BR + the
   BD-S3…BD-S31 set.
3. **The §19.6 retirement Gate 0 (M13's first question):** delete or
   keep the two dead files (MovesNextStrip + UsGlobalReachGroup +
   us-global-reach) — recommend a standalone `chore(M0-pre)` delete
   commit first so the legacy folder contains only live code; OR move
   them as-is into `features/insights-legacy/` if you prefer zero
   deletions.
4. **Rotate the Cloudflare Workers token** (the SECURITY NOTE carried
   from M7: CHANGELOG.md:3041 — a PRE-EXISTING entry on origin/main
   references its first 10 chars in a PUBLIC repo; rotation is the
   real fix).
5. Arrange the external investor's review of the spec (§19 — the
   seven questions); S23's deferred feedback-build scope follows it.
6. Ratify the `/converter` relocation (S1) + AF-3
   (michigan-1y-expectations → USA tier-3).
7. Triage the queued unreviewed fa strings (the manifest's `queued`
   section — visible review debt, does not fail the audit; unchanged
   this session).
8. **Revoke or rotate the session credentials** (the GitHub token —
   this session's worked; the Cloudflare Workers token — worked, incl.
   the deploy; the EODHD token — not needed this session; all pasted
   in chat again, never stored in the repo).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (BD-S19c); non-JS crawlers see
  the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84 —
  **M12's, DONE, LIVE 84/84 GREEN**) · pd-s5 (Gold 150) · pd-s7 (World
  Markets 57) · pd-s8 (zooms 9) · pd-s9/s10 (USA 115/163 incl. the TIC
  sub-gate) · pd-s12 (Europe 8 — M10's, DONE) · pd-s14 (Asia 14 — M9's,
  DONE) · pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18
  (Currencies 53) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`; run from inside
  apps/web so the `../src/…` import resolves). **NO pd-s script exists
  for economic-linkages (M11's page — the toolkit never got a linkages
  leg; the page carries 0 registry cards + 10 connection cards).**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The bundle topology post-M12: 80 chunks (same count), ALL basenames
  UNCHANGED (R5), ALL sizes IDENTICAL — but GlobalPage's chunk filename
  re-hashed (BLzmI7ye → QoITA5Xt) and the cascade rippled through the
  entry (index-CYK8tYdh → index-BJfZB2Np), 19 chunks re-hashed, sw.js
  + index.html re-hashed.** The GlobalPage landing route's chunk-graph
  interaction with the entry is the cause (the entry directly
  references the landing route's chunk in its assets-list, so the
  module ID change surfaced). The determinism re-check rebuild:
  BYTE-IDENTICAL. **Phase 3 is CLOSED — ten domain moves done (usa ·
  world-markets · australia · commodities · currencies · gold ·
  asia-pacific · europe · economic-linkages · global), every domain
  has its features/<domain>/ home.** Phase 4 (insights-legacy) moves
  ~50 web files — the legacy /insights route + its sections + the
  legacy-only components + the world-currencies legacy subtree + the
  legacy export utils; the §19.6 retirement question is the owner's
  Gate 0.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix — NOTE: this
  sandbox cloned the repo exactly there, so it works HERE by accident;
  keep the Phase 6 fix queued).
- The pure-comment path references are Phase 7's light header pass;
  M12's move added none beyond the existing set (the CHANGELOG history
  mentions are records, untouched by design).
- The `m3-live-verify.cjs` file-level eslint-disable (BD-M4 D0 /
  chore `99ba8c38`) is the established pattern for any future cjs
  node script — do NOT extend the eslint scope for one file.
- **The stranded-M7 historical note:** the original M7's commit hashes
  (723907e + a0a4b34) NEVER existed on origin/main — the M7′
  equivalents are `fd981e3e` + `87884724`. The stranded production
  version `c2ff9bf4` served 2026-11-15T23:17Z → 2026-11-16T02:45Z;
  `ea4127ba` (the M7′ deploy) served 02:45Z → 04:45Z; `ef5eaeeb`
  (the M8 deploy) served 04:45Z → 06:02Z; `8f779769` (the M9 deploy)
  served 06:02Z → 09:01Z; `fb969a20` (the M10 deploy) served 09:01:25Z
  → 09:50:12Z; `97669b8a` (the M11 deploy) served 09:50:12Z →
  23:57:03Z; **`a77b47a1` (the M12 deploy) serves from
  2026-11-16T23:57:03Z**.

---

## The M13 next-session prompt (modularization Phase 4 — insights-legacy)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M13 — modularization Phase 4: the insights-legacy domain
(the retirement container — the FIRST non-Phase-3 move; the legacy
/insights folder + its sections + the legacy-only components + the
world-currencies legacy subtree + the legacy export utils, ~50 web
files per the audit's Deliverable 1 insights-legacy rows + the
Phase 4 row).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 4" + Deliverable
1's insights-legacy rows (50) + the N-map (N18 the legacy super-
consumer — the very subject; N15 the dead/dangling code: MovesNextStrip
+ UsGlobalReachGroup + us-global-reach) + risks R5/R6/R7/R9) →
docs/HANDOFF.md (the M12 version — this file) → CHANGELOG [2026-11-17]
M12 → docs/DECISIONS.md BD-M12.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′): a
   session that delivers but cannot push leaves production AHEAD of
   origin/main and silently breaks the deploy-lock. If the token is
   invalid: STOP, tell the owner, do NOT start. ENVIRONMENT NOTE (M12):
   when passing a token via env-var-prefix syntax (`GH_TOKEN=… curl
   …`), export the var FIRST in the parent shell OR put the token
   directly into the URL (`https://$GH_TOKEN@github.com/…`); the
   env-var-prefix syntax doesn't expand `$GH_TOKEN` inside the
   command's arguments because bash expands those BEFORE the env-prefix
   takes effect — the M12 false-negative 401 was exactly this bug.
2. Verify origin/main has the M12 move commit fc856449, then the M12
   bookkeeping commit (docs-only — CHANGELOG.md + docs/HANDOFF.md +
   docs/DECISIONS.md, no AGENTS.md, no code; `git log --oneline -2
   origin/main`; confirm via `git show --stat HEAD`), AND production
   is the M12 deploy: currena-api a77b47a1 @ 100% (the deploy-lock;
   docs-only commits do NOT change deployed code). ANY code commit
   beyond the bookkeeping, or ANY production version newer than
   a77b47a1: STOP and report.
3. Run `pnpm gates` once and record the numbers (the M12 close: 9/9,
   suite 15,298, IDENTICAL to the M7′ + M8 + M9 + M10 + M11 + M12
   closes — ZERO delta). If the baseline is red, STOP and report —
   never start a phase on a red baseline. ENVIRONMENT NOTE: if this
   sandbox injects a `skills/` folder INSIDE the repo root, park it
   outside during gates runs (BD-M3 D4), never commit it; if it sits
   at the repo's PARENT (as in M11's + M12's sandbox), no parking
   needed.

The phase (audit §"Phase 4" — insights-legacy: ~50 web files, NO
engine move per the audit's rows — VERIFY):
- **Gate 0 — the §19.6 retirement question (OWNER DECISION FIRST,
  NOT in the agent's scope):** the two dead files (MovesNextStrip +
  UsGlobalReachGroup + us-global-reach) — owner decides: delete in a
  standalone `chore(M0-pre)` commit first so the legacy folder
  contains only live code, OR move them as-is into
  features/insights-legacy/ if you prefer zero deletions. The audit's
  R15 risk + the Phase 4 row's "Owner decision before this phase (not
  blocking)" both name this. If the owner says "delete first", run
  that chore commit BEFORE this session's move; if "move as-is", the
  codemod treats them like any other file.
- VERIFY the exact file inventory against the actual tree BEFORE the
  move (the M7′→M12 lesson — the M11 handoff's own tree-verified set
  had TWO errors, both fixed at M12 start; the M7′→M11 lesson cuts
  both ways: every phase re-verifies, never trusts the prior
  handoff's claim blindly). The audit's Phase 4 row says "~50 files"
  and its Deliverable 1 has exactly 50 features/insights-legacy rows
  — verify each against the tree; record the verified set in the
  session log before any git mv. The move spans THREE source folders
  for the first time: routes/Insights.tsx + routes/insights-sections/*
  (10 files) + components/insights/ (the legacy-only components —
  AboutTheData, AlertCard, CardMeta, CompactRow, CompaniesTable,
  DataExportMenu, DataExportPanel, DetailsPanel, InTheNews, JumpNav,
  MovesNextStrip [dead], NarrativeBlock, PositionBar, TicCustodyCard,
  ToolsMenu, WorldCurrencies, WorldMarkets + their tests +
  world-currencies/{DollarRow, DollarStrength, PairsTable, PatternCard,
  PatternVisuals, QuietArea, ReadingAids} + config/{companies,
  us-global-reach} + the legacy export utils full-export/fx-csv/
  insights-csv/markets-csv + their tests) + lib/clamp-panel.ts.
- Check whether a pd-s script exists for insights-legacy (grep
  apps/web/scripts/ for importers of the candidate moved files —
  expect NONE: the legacy page carries no §20 toolkit leg, same as
  economic-linkages in M11).
- The pre-gates grep set (the BD-M7 sharpened three-variant
  dynamic-import discipline + the R8 fs-path forms + the ?raw sweep),
  executed BEFORE the move: grep per candidate-moved file for ?raw +
  new URL(spec, import.meta.url) + join(__dirname/HERE/here) +
  readFileSync(join()) + fileURLToPath AND across ALL consumers for
  dynamic import(' with relative specs pointing at moved files (all
  THREE variants — the M12 record: variant #1 = App.tsx:?? (the
  insights lazy site — VERIFY the line; M11 had it at :118, M12 at
  :55, M13 will differ); variant #3 = any consumer dynamic await
  import() of a MOVED legacy file — VERIFY). Record the variant list
  + the lazy sites.
- KNOWN CONSUMER SET to verify (derive from the audit's Deliverable 1
  insights-legacy rows + grep — RE-VERIFY EVERYTHING at M13 start,
  the M12 lesson): the audit's rows list many co-located tests +
  internal edges; the cross-domain edges to keep green are the legacy
  super-consumer pattern (every domain component keeps a legacy
  importer until this phase — R13 by design) + the data-health.test.ts
  + InsightsHeader.tsx files the M12 codemod touched (re-anchored
  imports pointing at the now-moved global files — these files
  THEMSELVES move in M13, so the codemod re-anchors their imports
  again, including the ../../features/global/NextUpStrip →
  ../global/NextUpStrip shortening for data-health.test + the
  ../../features/global/ics dynamic for InsightsHeader). The
  selfcheck.ts full-export path (the audit's Phase 4 row names it).
- The codemod method (scripts/m12-global-codemod.mjs is the latest
  persisted pattern; scripts/m11-linkages-codemod.mjs is the prior):
  moves table → bidirectional re-anchoring → manual edits computed,
  never counted. Dry-run first, review every edge, then apply.
  Broken-path grep after apply. Persist the M13 codemod as
  scripts/m13-insights-legacy-codemod.mjs (matching the
  m{NN}-{domain}-codemod.mjs convention).
- NO renames (R5). Tests move WITH their subjects + their snapshots
  (R6 — CHECK for co-located __snapshots__ on the moved tests; the
  legacy card system may carry some). Persian-copy manifest re-keys
  per BD-M5 D5 (run copy:audit — grep the manifest for the moved
  paths FIRST: the legacy components carry fa literals, expect
  NON-zero — the M11 two-re-key + M12 one-re-key pattern). Exports
  map: verify whether insights-legacy has any (expect NONE — all 50
  are web files, same as M11 + M12; the 16 existing entries all point
  at engine paths).
  CHUNK-MERGER WATCH: record the baseline dist topology before the
  move (the M12 post-move surface — 80 chunks, entry index-BJfZB2Np,
  GlobalPage-QoITA5Xt — the M12 cascade surface); close with the
  full-substitution rebasing test + the name-agnostic token-multiset
  proof — and apply the M10/M11/M12 mechanism correction: the entry
  re-hashes only if the moved page chunk's filename changes; a
  byte-identical page chunk means zero ripple (compare sw.js by
  entry-multiset, not raw sha — the workbox precache-tail can rotate
  between builds). The Insights page chunk is a DEEP route (not the
  landing — GlobalPage is the landing, M12 already moved it); expect
  the M10/M11 deep-route shape (byte-identical page chunk → zero
  ripple), NOT the M12 landing-route cascade.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical to the M12 baseline (15,298); every commit green + PUSHED
(verify the push!); the exports map verified + all path references
updated in the same commits as their moves; production == origin/main
HEAD after the post-phase deploy (deploy-lock re-check FIRST — D-43;
never run the §21 portwatch leg Tuesdays 11:00–14:00 UTC; if wrangler
deploy fails on assets-upload-session with code 10013, RETRY once
before investigating — the M9 note; environment note: `pnpm --filter
@currena/api run deploy` — the `run` is required under pnpm 10).
Bookkeeping per AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS)
and the M14 pointer (Phase 5: the founding tools — VERIFY the
inventory against the audit's §"Phase 5" row + Deliverable 1's
features-tools rows + the tree — ~49 files: the 9 tool routes +
converter/ + settle/ + receipt/ + the tool components + the tool
libs). Progress after M13: modularization M13/16 · 3 remaining.
```
