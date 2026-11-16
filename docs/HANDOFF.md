# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M11 (2026-11-16) — DELIVERED: modularization Phase 3.9
> (economic-linkages, the ninth Phase 3 move) is done.** 5 web source
> files moved in ONE commit (`26627d2a`, pushed and verified — 11 files
> changed, 5 renames 97-100% similarity): the move spans TWO source
> folders for the first time since M5 — ONE file from
> `routes/page-division/` (EconomicLinkagesPage) + FOUR from
> `components/insights/` (Together, ConnectionCard, connection-groups,
> together-signals.test) — all five FLAT into
> `features/economic-linkages/` (NO named cluster, NO renames, ZERO
> co-located snapshots). **NO engine move** — engine
> `shared/connections.ts` STAYS shared (the D1/R2 constraint; the 10
> connection definitions are the cross-domain single source). 8 import
> specifiers re-anchored by codemod + 3 manual edits (App.tsx:118 lazy —
> dynamic-import variant #1, the ONLY linkages site, the M10 record's
> own pointer). **ZERO R8 fs-path forms in the moved set** (the second
> fully-R8-clean move in a row). NO exports-map entries for linkages
> (the 16 existing entries all point at engine paths). **TWO
> Persian-copy re-keys — NOT the prompt's expected ZERO** (drift
> recorded: the ConnectionCard "، " fa list-joiner — the very entry the
> M8 BalanceScale re-key cited as precedent — + the Together fa list
> separator; both text+sha256 unchanged, the M8 entry-642 re-key-note
> pattern). Gates 9/9 with the suite EXACTLY 15,298 (IDENTICAL to the
> M7′ + M8 + M9 + M10 closes — ZERO delta); NO mid-phase red gates runs
> (the streak holds). Deployed post-phase: **currena-api `97669b8a` @
> 100%** (version 407, deployment `cbfb2e01`, 2026-11-16T09:50:12Z) —
> production == origin/main HEAD. M12 (global, Phase 3.10) is next; its
> authoritative prompt is at the bottom of this file.

## Current state (after the M11 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · Phase 3.2 (M4: the world-markets domain) · Phase 3.3 (M5:
  the australia domain) · Phase 3.4 (M6: the commodities domain) ·
  Phase 3.5 (M7′: the currencies domain, the re-do) · Phase 3.6 (M8:
  the gold domain) · Phase 3.7 (M9: the asia-pacific domain) · Phase
  3.8 (M10: the europe domain) · **Phase 3.9 (M11: the
  economic-linkages domain, this session)** all DELIVERED. Phase 3
  continues biggest-first: global (M12) is next — the LAST Phase 3
  move; then Phase 4 (insights-legacy, M13).
- **origin/main is GREEN** — 9/9 gates at `26627d2a` (the move), suite
  15,298 (IDENTICAL to the M7′ + M8 + M9 + M10 closes — ZERO delta),
  working tree clean, push verified (ls-remote == rev-parse).
- **Production is CURRENT** — currena-api `97669b8a` @ 100% (deployed
  2026-11-16T09:50:12Z, deployment `cbfb2e01`, version 407 the newest
  — nothing newer), the exact origin/main deployed surface: the M11
  build matches the LIVE surface on ALL 165 deployable files (sha256
  for sha256, MATCH 165 · DIFFERS 0; index.html compared via `/` — the
  platform 307s /index.html → /, the standing convention; `_headers`
  excluded — the platform never serves it raw, the SPA fallback
  answers). **The M11 chunk topology came out FULLY-FROZEN — the
  ENTIRE dist byte-identical to the M10 baseline build, ALL 166 files
  including sw.js** (see the chunk watch below); production ==
  origin/main HEAD.

## The green baseline — the M11 close record (2026-11-16)

Baseline (the M10 close, before the move) and final (after the move
`26627d2a`) runs of `pnpm gates` — **identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1092 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean — TWO re-keys landed in the same commit as the move (the ConnectionCard + Together "، " entries; the 1258 queued review debt unchanged) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — IDENTICAL to the M7′ + M8 + M9 + M10 closes |
| 9 | build + bundle budget | PASS | entry 273.95/82.96 — the IDENTICAL numbers, because the ENTIRE dist is byte-identical (see the chunk watch) |

**Environment note (unchanged from M3→M11):** this sandbox's `skills/`
folder sits at the PARENT of the Currena repo (not inside it) — no
parking needed. If a future sandbox injects `skills/` INSIDE the repo
root, park it outside during gates runs (BD-M3 D4), never commit it.

## The M11 session record (what was done)

1. **STEP 0 (the adjusted checks, all green before anything moved):**
   the GitHub token verified FIRST (HTTP 200 on /user, login assadigit —
   the push works); the repo re-cloned (fresh sandbox); pnpm 10.34.5
   installed via npm-global; `pnpm install --frozen-lockfile` clean
   (7.9s); origin/main verified at `84e7af2d` (the M10 bookkeeping —
   docs-only, CHANGELOG + DECISIONS + HANDOFF, confirmed via
   `git show --stat HEAD` — on top of `6a54bacc` the M10 move; HEAD ==
   origin/main, tree clean); the deploy-lock verified via the
   deployments + versions APIs (currena-api `fb969a20` @ 100%,
   deployment `c5e355eb` 2026-11-16T09:01:25Z, version 406 the newest
   — nothing newer; production == origin/main HEAD as claimed); the
   baseline `pnpm gates` 9/9, suite 15,298, layer1 11,969/11,969, 2m
   42s — the M10 close numbers exactly.
2. **The audit verification:** Phase 3 item 9 (economic-linkages) +
   Deliverable 1's linkages rows + Deliverable 6's P3.9 row + the N-map
   + risks R4/R5/R8/R9 read; the inventory verified against the actual
   tree — **exactly 5 web files, ZERO co-located snapshots**: ONE from
   `routes/page-division/` (EconomicLinkagesPage) + FOUR from
   `components/insights/` (Together, ConnectionCard, connection-groups,
   together-signals.test) — the M10-recorded set exactly; the audit's
   item-9 row and its Deliverable 6 row AGREE (5 web). NO engine move
   (connections.ts stays shared, the constraint). NO pd-s script exists
   for the page (verified: nothing in apps/web/scripts/ imports the
   five files — the page carries 0 registry cards + 10 connection
   cards; the §20 toolkit never got a linkages leg;
   scripts/check-bundle-budget.mjs mentions Together/ConnectionCard in
   COMMENTS only).
3. **The pre-gates grep set (all three variants + the R8 fs-path
   forms), executed BEFORE the move:** variant #1 = App.tsx:118 (the
   ONLY linkages lazy route — the M10 record's own pointer); variant #2
   (inline TYPE `import('...').X` pointing at moved files) verified
   ABSENT; variant #3 (CONSUMER dynamic `await import()` of a MOVED
   linkages file) verified ABSENT (the full apps/web/src import( census
   re-run — every other dynamic site points at non-moved files); **ONE
   `?raw` FINDING: `shared/config/round2.test.ts:71` reads
   `ConnectionCard.tsx?raw` — an edge the audit's Deliverable 1 rows
   did NOT list (they named Together as ConnectionCard's only
   importer); the BD-M7 pre-gates discipline caught it** (the M8 gold
   ?raw set in the same file was already re-anchored); R8 fs-path forms:
   ZERO in the moved set (the second fully-R8-clean move in a row —
   no new URL/join/readFileSync/fileURLToPath, no root-data JSON
   imports). ZERO mid-phase red gates runs — the FIRST post-move
   `pnpm gates` was 9/9 GREEN (2m 43s, suite 15,298 IDENTICAL).
4. **Consumer-set DRIFT vs the audit's Deliverable 1 rows (recorded,
   never silently absorbed): routes/Insights.tsx — the N18 legacy
   super-consumer — does NOT import Together in the current tree**
   (TM20 moved the together cards off /insights; the page's own comments
   record it). The VERIFIED importer set: Together + connection-groups
   imported by EconomicLinkagesPage (moving with them) +
   features/australia/AustraliaPage + features/usa/UsaPage (the
   documented mirror pattern — AU/USA render their onlyIds subsets);
   ConnectionCard imported by Together (internal) + the round2.test.ts
   ?raw edge; together-signals.test by none; EconomicLinkagesPage by
   App.tsx:118 (lazy) only.
5. **The move (commit `26627d2a`, ONE commit):** the codemod
   `scripts/m11-linkages-codemod.mjs` (persisted in-repo per the
   M2→M10 method) — 5 git-mv moves, 8 specifiers re-anchored
   bidirectionally (existence-checked candidates, computed depths,
   specifier styles preserved; the ?raw query rides verbatim — the M10
   query-split handling), 3 manual edits. Dry-run reviewed edge by edge
   before apply — **an EXACT match with the hand-grep consumer map
   (nothing extra, nothing missing)**. Edges: AustraliaPage +
   UsaPage `../../components/insights/{Together,connection-groups}` →
   `../economic-linkages/…`; EconomicLinkagesPage's two specs →
   `./Together` + `./connection-groups` (siblings); round2.test.ts
   `?raw` → `../../features/economic-linkages/ConnectionCard.tsx?raw`;
   the N-pattern shortening together-signals.test
   `../../features/gold/signals/BalanceScale` →
   `../gold/signals/BalanceScale` (the M6→M10 N1/N11 lesson,
   path.relative-computed). ALL `../../shared/…`, `../../router`,
   `../../components/PageBreadcrumbs` specs of the moved files are
   depth-invariant NO-OPs (both source folders AND the destination sit
   at src depth 2 — every pair resolves identically). Broken-path grep
   after apply: ZERO old-path references remain anywhere in code (the
   only textual old-path hits are the codemod's own doc table +
   CHANGELOG history + the pre-existing pure-comment mentions — Phase
   7's light header pass, untouched by design).
6. **The exports map: NO linkages entries exist** (verified — the 16
   existing entries all point at engine paths; the five are web
   files); ZERO exports-map edits.
7. **Persian-copy manifest: TWO re-keys (NOT zero — the M11 prompt's
   "expect ZERO re-keys" was DRIFT, recorded):**
   `hardcoded.apps.web.src.components.insights.ConnectionCard.11735aab`
   (id + source re-keyed — the "، " fa list-joiner; **the very entry
   the M8 BalanceScale re-key cited as its precedent**) +
   `technical.together.faListSeparator` (source-only re-keyed — the
   semantic technical.* id stays; the "، " fa list separator). Both
   text+sha256 unchanged (the review basis preserved), notes appended
   per the M8 entry-642 re-key-note pattern; both landed in the SAME
   commit as the move; copy:audit clean after (exit 0; the 1258 queued
   review debt unchanged).
8. **Regenerated + reviewed:** `registry:generate` +
   `placement:generate` + `s24:d9-audit` — **ZERO drift** (187
   indicators; data/ + PLACEMENT.generated.md byte-identical; D-9
   CONDITION MET).
9. **The chunk-merger watch (BD-M5 D3), closed with the CLEANEST
   result in the program's history — CLEANER than M10: the post-move
   build is BYTE-IDENTICAL to the baseline build across ALL 166 dist
   files, including sw.js.** The baseline topology recorded BEFORE the
   move (80 chunks; entry `index-CYK8tYdh` sha deca57ff…;
   EconomicLinkagesPage-CifJGZO3 sha ed9dfe89…; the MERGED chunk
   `connection-groups-ihMctSM7` sha c359eb70… — Rollup merges
   connection-groups + Together + ConnectionCard into ONE shared chunk
   keyed by the connection-groups basename, the watch's very subject:
   all three modules moved TOGETHER into the same folder, so the
   merged chunk's module set never changed; the engine
   `connections-D3H0mH0r` sha 8998ca97… — NOT moving; the full
   166-file dist sha256 snapshot + a /tmp copy). Post-move: still 80
   chunks, NO merger fired, all basenames UNCHANGED (R5), and the
   ENTIRE dist came out byte-identical — including the entry
   (`index-CYK8tYdh`, sha-unchanged), the page chunk
   (`EconomicLinkagesPage-CifJGZO3`, sha-unchanged) and the merged
   chunk (`connection-groups-ihMctSM7`, sha-unchanged). The
   full-substitution rebasing test and the name-agnostic token-multiset
   proof are TRIVIALLY satisfied (not one filename changed — there is
   nothing to substitute; 166/166 byte-identical). The determinism
   re-check (a third build): 165/166 byte-identical — the one delta is
   **sw.js's pure precache-tail rotation** (all 161 url:revision
   entries multiset-identical, same 10,433 bytes — the M10-documented
   public/-glob readdir artifact, zero relation to the move). **The M10
   mechanism correction is CONFIRMED a second time: the entry re-hashes
   only if the moved page chunk's FILENAME changes; a byte-identical
   page chunk means zero ripple** — M11's page chunk came out
   byte-identical because every spec change resolves to the same
   modules and spec text never survives bundling (re-verified: neither
   'routes/page-division/EconomicLinkagesPage' nor
   'components/insights/…' appears anywhere in the built dist).
10. **Post-phase deploy + live verify (the deploy-lock held):**
    deploy-lock re-checked FIRST (still `fb969a20` @ 100%, deployment
    `c5e355eb`, no parallel deploy; Monday — the §21 Tuesday portwatch
    window N/A; there is NO pd-s linkages leg anyway) → build +
    `wrangler deploy` (the FIRST attempt SUCCEEDED — no 10013
    assets-upload-session retry needed; the M9 note stays in force) →
    **currena-api `97669b8a` @ 100%** (version 407, deployment
    `cbfb2e01`, 2026-11-16T09:50:12Z). Smoke: /api/health ok (kv ok) ·
    / 200 · /economic-linkages 200 · /australia 200 · /usa 200 (the
    Together mirror pages) · /api/insights 200 (the page's data source
    — the full snapshot; the page evaluates connections client-side
    via the engine's `evaluateConnections`). **`/api/insights/pages/
    economic-linkages` returns 404 — the EXPECTED pre-existing shape**
    (the page is NOT a registry projection destination: the pages index
    lists exactly 9 destinations; the page carries 0 registry cards and
    renders from the full snapshot — the same reason no pd-s leg
    exists; NOT caused by the move). The three linkages-relevant chunks
    served 200 from production (EconomicLinkagesPage-CifJGZO3 ·
    connection-groups-ihMctSM7 · connections-D3H0mH0r). **The
    all-deployable-file byte-compare production-vs-M11-build: MATCH
    165 · DIFFERS 0** (166 dist files total: index.html via `/`;
    `_headers` excluded per the M9/M10 convention).
11. **The pushes verified:** the move commit `26627d2a` PUSHED and
    verified (ls-remote == rev-parse == `26627d2a08cc65ab…`); the
    bookkeeping commit follows in this docs commit.

## Where the economic-linkages domain now lives (the Phase 3.9 map)

- **web `apps/web/src/features/economic-linkages/`** — the 5 files
  FLAT (EconomicLinkagesPage + Together + ConnectionCard +
  connection-groups + together-signals.test). NO named cluster; the
  M1 skeleton README rides in place. The connection-cards FEATURE HOME
  per the audit's Deliverable 2 row: AU/USA import Together +
  connection-groups with their onlyIds subsets (the documented mirror
  pattern).
- **engine: NOTHING moved** — `packages/insights/src/shared/
  connections.ts` is the 10-connection single source (the D1/R2
  constraint — it stays engine shared, exactly as gold-score/gauges/
  definitions do); its dist chunk `connections-D3H0mH0r` is
  byte-identical.
- **The exports map:** NO linkages entries (none existed before, none
  added — the five are web files; the map covers engine paths only).

## Operational notes worth carrying (M11 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The dynamic-import() regex gap is THREE variants (BD-M7, the
  standing pre-gates discipline):** (1) the dynamic CALL `import('…')`
  (App.tsx lazy routes); (2) the inline TYPE `import('…').X`; (3) the
  CONSUMER dynamic `await import('…')` of a MOVED file. M11 ran the
  full set BEFORE the move: variant #1 had ONE site (App.tsx:118), #2
  and #3 verified ABSENT — ZERO mid-phase red gates runs (the
  M7′/M8/M9/M10/M11 streak now stands).
- **The ?raw sweep is NOT optional — M11's proof:** the audit's
  Deliverable 1 rows MISSED ConnectionCard's `?raw` consumer
  (round2.test.ts:71); the pre-gates grep caught it. Always grep `?raw`
  per moved file BEFORE the move (the audit's importer lists are
  Phase-0 snapshots — the tree is the truth).
- **The audit's Deliverable 1 importer lists can go STALE between
  phases:** M11 found routes/Insights.tsx listed as a Together importer
  but the current tree has NO such import (TM20 removed it). Verify
  every consumer set against the tree; record drift, never silently
  absorb it.
- **The R8 rule (standing):** grep for ALL fs-path forms per moved TEST
  (new URL, join(__dirname/HERE/here), readFileSync(join()),
  fileURLToPath) BEFORE the gates run. M11 had ZERO (the second
  fully-R8-clean move in a row).
- **The count verification (standing):** the audit's per-domain counts
  are approximate — verify the inventory against the actual tree
  before the move (M7′: 41 not 42; M8: 42 git-mv = 41 source + 1
  vitest snapshot; M9: 15 exactly; M10: 11 exactly; M11: 5 exactly —
  the audit's rows AGREE for linkages).
- **The pd-s script notation is unreliable in the audit's Phase 3 rows
  (FIFTH occurrence at the M11 close):** the Deliverable 6 P3.10 row
  says "pd-s5(global backtest)" — WRONG: **pd-s4 is the global script**
  (verified: pd-s4-backtest.ts:53 imports
  `../src/routes/page-division/global-backtest-core`; pd-s5 is gold's,
  M8-verified). ALWAYS verify the script's actual imports (the
  pd-s18/pd-s5/pd-s14/pd-s12/pd-s15 lesson).
- **The entry-re-hash mechanism (M10 correction, M11-confirmed):** the
  entry re-hashes only if the MOVED DOMAIN'S PAGE-CHUNK filename
  changes (the entry's assets-list reference); the lazy-path string
  never survives bundling. M10 + M11 both produced byte-identical page
  chunks → ZERO ripple both times. Verify with the full dist sha256
  snapshot, not just the entry.
- **The sw.js precache-tail nondeterminism (M10 finding, M11
  re-observed):** the workbox-generated sw.js can differ between
  builds by a pure rotation of the public/-glob tail entries
  (multiset-identical, same size) — an environment readdir artifact.
  Compare dist builds with the entry-set multiset proof, not raw sha,
  for sw.js specifically. (M11's gates build even came out sw.js-
  identical; the third build rotated.)
- **The merged-chunk watch shape (M11 finding):** small modules that
  Rollup MERGES into one shared chunk (M11: connection-groups +
  Together + ConnectionCard → `connection-groups-ihMctSM7.js`) move
  safely when the whole merged set moves together — the chunk's module
  set never changes and the chunk stays byte-identical. If a future
  phase moves only PART of a merged chunk's module set, expect the
  chunk to re-shape — record the honest outcome.
- **The production byte-compare tooling note (M10, carried):** compare
  index.html via `/` with curl or a fixed user-agent fetcher —
  browser-ish requests get Cloudflare's zone-side Web Analytics beacon
  injected (+367 bytes) which is NOT deployed code; and `_headers` is
  never served raw (SPA fallback) — exclude it per the standing
  convention.
- **The stranded-push lesson (M7′, still standing):** verify the push
  works (STEP 0 token check, HTTP 200 on /user) BEFORE starting any
  phase; verify the push LANDED (ls-remote == rev-parse) after it.
- **The deploy lock + account check before every deploy** (D-43); the
  KV write cap (1,000/day); the GHA schedule-delay quirk
  (workflow_dispatch); the D-9 audit as a standing gate; never run the
  §21 portwatch leg Tuesdays 11:00–14:00 UTC.
- **The wrangler deploy retry rule (M9, still standing):** a transient
  Cloudflare API error on assets-upload-session (code 10013) can fail
  the FIRST deploy attempt with the build perfectly fine — retry once
  before investigating. (M10's and M11's first attempts both
  succeeded; the note stays for the next 10013.)
- **pnpm 10 note (M11 environment finding):** `pnpm --filter
  @currena/api deploy` trips pnpm's BUILT-IN deploy command
  (ERR_PNPM_INVALID_DEPLOY_TARGET) — use `pnpm --filter @currena/api
  run deploy` (the `run` is required).

## Owner-side levers waiting

1. **Ratify BD-M11** (this session's records: the 5-file two-source-
   folder inventory; the ?raw FINDING the audit's rows missed; the
   N18/Together consumer-set drift (routes/Insights.tsx no longer
   imports it — TM20); the TWO manifest re-keys (the prompt expected
   ZERO); the ZERO R8 forms; the ZERO exports-map entries; the
   FULLY-FROZEN 166/166 dist (cleaner than M10); the merged-chunk
   finding; the 165/165 byte-compare; the expected 404 shape on
   /api/insights/pages/economic-linkages; the pd-s4-vs-pd-s5 fifth
   notation error).
2. **Ratify BD-M10** (still waiting) + **BD-M9** (still waiting) +
   **BD-M8** (still waiting) + **BD-M7′** (still waiting) + the carried
   BD-M6 … BD-M1-r + BD-BR + the BD-S3…BD-S31 set.
3. **Rotate the Cloudflare Workers token** (the SECURITY NOTE carried
   from M7: CHANGELOG.md:3041 — a PRE-EXISTING entry on origin/main
   references its first 10 chars in a PUBLIC repo; rotation is the
   real fix).
4. Arrange the external investor's review of the spec (§19 — the
   seven questions); S23's deferred feedback-build scope follows it.
5. The §19.6 retirement timing answer (retire the legacy /insights
   now or after burn-in) — Gate 0 of `06-LEGACY-RETIREMENT-S24.md` §7.
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
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8 —
  M10's, DONE) · pd-s14 (Asia 14 — M9's, DONE) · pd-s16 (Australia 28)
  · pd-s17 (Commodities 24) · pd-s18 (Currencies 53) — all re-runnable
  against production from apps/web/scripts/ (pass `--base
  https://currena.ir`). **NO pd-s script exists for economic-linkages
  (M11's page — the toolkit never got a linkages leg; the page carries
  0 registry cards + 10 connection cards). pd-s4 is M12's (global).**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The bundle topology post-M11: FULLY FROZEN — the ENTIRE dist
  byte-identical to the M10 baseline (all 166 files, entry
  `index-CYK8tYdh` + `EconomicLinkagesPage-CifJGZO3` + the merged
  `connection-groups-ihMctSM7` + engine `connections-D3H0mH0r` all
  sha-unchanged).** The 80-chunk count unchanged; all basenames
  preserved (R5). Phase 3's last move (M12 global) keeps the same
  basename discipline.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix — NOTE: this
  sandbox cloned the repo exactly there, so it works HERE by accident;
  keep the Phase 6 fix queued).
- The pure-comment path references are Phase 7's light header pass;
  M11's move added none beyond the existing set (the CHANGELOG history
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
  → 09:50:12Z; **`97669b8a` (the M11 deploy) serves from
  2026-11-16T09:50:12Z**.

---

## The M12 next-session prompt (modularization Phase 3.10 — global)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M12 — modularization Phase 3.10: the global domain (the tenth
and LAST Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 10 +
Deliverable 1's global rows + the N-map (N2 usa↔global, N5
outlook-core shared, N6/N7 lib/markets + lib/fx shared, N12
shared-layer, N18 legacy super-consumer) + risks R4/R5/R8/R9) →
docs/HANDOFF.md (the M11 version — this file) → CHANGELOG [2026-11-16]
M11 → docs/DECISIONS.md BD-M11.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′): a
   session that delivers but cannot push leaves production AHEAD of
   origin/main and silently breaks the deploy-lock. If the token is
   invalid: STOP, tell the owner, do NOT start.
2. Verify origin/main has the M11 move commit 26627d2a, then the M11
   bookkeeping commit (docs-only — CHANGELOG.md + docs/HANDOFF.md +
   docs/DECISIONS.md, no code; `git log --oneline -2 origin/main`;
   confirm via `git show --stat HEAD`), AND production is the M11
   deploy: currena-api 97669b8a @ 100% (the deploy-lock; docs-only
   commits do NOT change deployed code). ANY code commit beyond the
   bookkeeping, or ANY production version newer than 97669b8a: STOP
   and report.
3. Run `pnpm gates` once and record the numbers (the M11 close: 9/9,
   suite 15,298, IDENTICAL to the M7′ + M8 + M9 + M10 + M11 closes —
   ZERO delta). If the baseline is red, STOP and report — never start
   a phase on a red baseline. ENVIRONMENT NOTE: this sandbox's
   `skills/` folder sits at the PARENT of the Currena repo (not inside
   it) — no parking needed. If a future sandbox injects `skills/`
   INSIDE the repo root, park it outside during gates runs (BD-M3 D4),
   never commit it.

The phase (audit §"Phase 3" item 10 — global: 16 web files, NO engine
move per the audit's rows — VERIFY):
- VERIFY the exact file inventory against the actual tree BEFORE the
  move (the M7′→M11 lesson). The audit-verified set spans TWO source
  folders (the M11 shape): TEN files from apps/web/src/routes/
  page-division/ (GlobalPage.tsx + GlobalPage.test.tsx, GlobalBoard,
  WorldRiskCards, global-tiles + global-tiles.test,
  global-backtest-core + global-backtest.test + global-copy-pin.test,
  global-page-states) + SIX from apps/web/src/components/insights/
  (HeroBlock.tsx, TopMoversStrip.tsx, NextUpStrip.tsx, ics.ts +
  ics.test.ts, hero-editorial.test.tsx) → all sixteen FLAT into
  apps/web/src/features/global/ (the M3→M11 convention; NO named
  cluster in the set).
- pd-s4 is the global script (VERIFIED at M11: pd-s4-backtest.ts:53
  imports ../src/routes/page-division/global-backtest-core — in the
  move set; the audit's Deliverable 6 P3.10 row says pd-s5, which is
  WRONG for the FIFTH time — pd-s5 is gold's, M8-verified). Re-anchor
  it in the same commit.
- The pre-gates grep set (the BD-M7 sharpened three-variant
  dynamic-import discipline + the R8 fs-path forms + the M11 ?raw
  lesson), executed BEFORE the move: grep per moved file for ?raw +
  new URL(spec, import.meta.url) + join(__dirname/HERE/here) +
  readFileSync(join()) + fileURLToPath AND across ALL consumers for
  dynamic import(' with relative specs pointing at moved files (all
  THREE variants — the M11 record: variant #1 was App.tsx:55, the
  global lazy site; NOTE InsightsHeader.tsx:298 has a dynamic
  import('../../components/insights/ics') — a variant-#3 site pointing
  at a MOVED file, re-anchor it by hand, the regex cannot see it).
- KNOWN CONSUMER SET — **TREE-VERIFIED at the M11 close (the audit's
  Deliverable 1 global rows carry FOUR stale/undercounted importer
  lists — re-verify everything at M12 start):** HeroBlock's importer =
  GlobalPage ONLY (+ its co-located hero-editorial.test — the audit's
  "routes/Insights.tsx" claim is STALE, only a comment mentions it
  there); TopMoversStrip's = GlobalPage ONLY (same stale-audit-row
  shape); NextUpStrip's = GlobalPage ONLY (imports './ics' —
  intra-set); ics's = NextUpStrip (intra-set) +
  InsightsHeader.tsx:298 (DYNAMIC — the variant-#3 hand edit) +
  ics.test (co-located); **WorldRiskCards' importers = FOUR
  cross-domain consumers** (features/world-markets/WorldMarketsPage +
  features/asia-pacific/AsiaTierCards + features/europe/EuropeTierCards
  + features/usa/UsaTierCards — the audit's single-WorldMarketsPage
  row UNDERCOUNTS; all four re-anchor to ../global/WorldRiskCards);
  global-tiles' = GlobalBoard + GlobalPage + global-backtest-core
  (intra-set) + features/usa/{usa-tiles, usa-backtest-core,
  usa-tiles.test} (the N2 edge — re-anchors to ../global/global-tiles);
  global-page-states' = GlobalPage + GlobalBoard (intra-set);
  GlobalBoard's = GlobalPage (intra-set); GlobalPage's own imports
  re-anchor (components/insights/… → ../… depth arithmetic via
  path.relative, never hand-counted).
- The codemod method (scripts/m11-linkages-codemod.mjs is the persisted
  pattern): moves table → bidirectional re-anchoring → manual edits
  computed, never counted. Dry-run first, review every edge, then
  apply. Broken-path grep after apply.
- NO renames (R5). Tests move WITH their subjects + their snapshots
  (R6 — CHECK for co-located __snapshots__ on the moved tests). 
  Persian-copy manifest re-keys per BD-M5 D5 (run copy:audit — grep
  the manifest for the moved paths FIRST: the M11 lesson says expect
  NON-zero; HeroBlock/TopMoversStrip/NextUpStrip/ics may carry fa
  literals). Exports map: global is expected to have NO entries —
  verify (the 16 existing entries all point at engine paths).
  CHUNK-MERGER WATCH: record the baseline dist topology before the
  move (expect the M11 post-move surface: 80 chunks, entry
  index-CYK8tYdh, FULLY-FROZEN baseline); close with the
  full-substitution rebasing test + the name-agnostic token-multiset
  proof — and NOTE the M10/M11 mechanism record: the entry re-hashes
  only if the moved page chunk's filename changes; a byte-identical
  page chunk means zero ripple (verify with the full dist sha256
  snapshot; compare sw.js by entry-multiset, not raw sha — the
  workbox precache-tail can rotate between builds). CAUTION: GlobalPage
  is the / LANDING route — its chunk + the entry interact differently
  than the deep routes; record the honest outcome.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green + PUSHED (verify the push!);
the exports map verified + all path references updated in the same
commits as their moves; production == origin/main HEAD after the
post-phase deploy (deploy-lock re-check FIRST — D-43; never run the
§21 portwatch leg Tuesdays 11:00–14:00 UTC; if wrangler deploy fails
on assets-upload-session with code 10013, RETRY once before
investigating — the M9 note). Bookkeeping per AGENTS.md §10 (HANDOFF
rewrite + CHANGELOG + DECISIONS) and the M13 (Phase 4:
insights-legacy) pointer (VERIFY the inventory against the audit's
Deliverable 1 insights-legacy rows + the tree — ~50 files; the §19.6
retirement question is the owner's Gate 0). Progress after M12:
modularization M12/16 · 4 remaining.
```
