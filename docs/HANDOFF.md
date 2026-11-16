# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M9 (2026-11-16) — DELIVERED: modularization Phase 3.7 (asia-pacific,
> the seventh Phase 3 move) is done.** 15 source files moved in ONE commit
> (`5463d45f`, pushed and verified — 24 files changed, 15 renames
> 97-100% similarity): 9 web → `features/asia-pacific/` (all page-tier
> files FLAT — asia has NO named web cluster, BD-M4 D1) + 6 engine →
> `domains/asia-pacific/adapters/` (the adapter sextet FLAT: imf-cpi +
> test, mof + test, nbs + test — NO subfolder, NO barrel, the M6/M7′/M8
> convention; the audit's "4 adapters (3 + test)" notation undercounts —
> there are THREE co-located adapter tests, one per adapter, the
> frankfurter counting lesson; its Deliverable 6 row "9 web + 6 engine =
> 15" is the correct one). 21 import specifiers re-anchored by codemod +
> 4 manual edits (App.tsx:86 lazy route — variant #1, the ONLY asia site;
> the THREE R8 fixture-depth traps in the adapter tests — imf-cpi.test
> `join(here,…)`, mof.test `join(harness(),…)`, nbs.test
> `join(__dirname,…)`, all 2→4 up-levels, the cofer/s6 pattern). NO
> exports-map entries for asia (the 16 existing entries all point
> elsewhere — the prompt's "if asia has entries" resolved NO). boe/boe.test
> + ecb STAY in `src/adapters/` (Europe's, M10). Gates 9/9 with the suite
> EXACTLY 15,298 (IDENTICAL to the M7′ + M8 closes — ZERO delta); NO
> mid-phase red gates runs (the pre-gates grep caught everything BEFORE
> the gates run — the streak holds). ZERO Persian-copy re-keys; ZERO
> registry/placement/D-9 drift. Production deployed post-phase
> (`8f779769` @ 100%) and live-verified — the deploy-lock held
> throughout, and the all-132-file byte-compare production-vs-M9-build
> (129 assets + sw.js + manifest + index.html) is MATCH · DIFFERS 0.**

> **The NEXT session is M10** — modularization Phase 3.8 (europe: 8 web
> files + 3 engine = 11 per the audit's Deliverable 6 row — the adapters
> are boe + boe.test + ecb, with ecb having NO co-located test but ONE
> cross-adapter test consumer, `shared/adapters/adapters.test.ts:12`,
> plus `shared/adapters/{collect,rung2,index}.ts` + the engine script
> `gf-s11-verify.ts` — the full consumer set verified this session);
> VERIFY the inventory against the tree (the M7′/M8/M9 lesson);
> **pd-s12 is Europe's script (VERIFIED this session:
> pd-s12-backtest.ts imports
> `../src/routes/page-division/europe-backtest-core` — the audit's P3.8
> row notation says pd-s15, which is WRONG: NO pd-s15 exists in
> apps/web/scripts/ at all)**, prompt at the bottom of this file.
> **STEP 0 adjustment (updated after the M9 close): verify origin/main
> has the M9 move commit `5463d45f`, then the M9 bookkeeping commit
> `ad96ddfa`, then EXACTLY ONE docs-only process commit on top (the
> 2026-11-16 AGENTS.md §10 next-session-prompt rule — `git log
> --oneline -3 origin/main`; confirm via `git show --stat HEAD` that
> the top commit touches ONLY docs), AND production is the M9 deploy:
> currena-api `8f779769` @ 100% (the deploy-lock; docs-only commits do
> NOT change deployed code).**

## Current state (after the M9 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · Phase 3.2 (M4: the world-markets domain) · Phase 3.3 (M5:
  the australia domain) · Phase 3.4 (M6: the commodities domain) ·
  Phase 3.5 (M7′: the currencies domain, the re-do) · Phase 3.6 (M8:
  the gold domain) · **Phase 3.7 (M9: the asia-pacific domain, this
  session)** all DELIVERED. Phase 3 continues biggest-first: europe
  (M10) is next.
- **origin/main is GREEN** — 9/9 gates at `5463d45f` (the move), suite
  15,298 (IDENTICAL to the M7′ + M8 closes — ZERO delta), working tree
  clean.
- **Production is CURRENT** — currena-api `8f779769` @ 100% (deployed
  2026-11-16T06:02:36Z, deployment `68097b3a`), the exact origin/main
  deployed surface: the M9 build matches the LIVE surface on ALL 132
  deployable files (129 dist/assets + sw.js + manifest + index.html
  via `/`; sha256 for sha256, MATCH 132 · DIFFERS 0). The entry chunk
  re-hashed `index-CkKkl2hB` → `index-CYK8tYdh` (the App.tsx
  lazy-path string — the M6/M7′/M8 precedent) with a WIDER-than-M8
  22-chunk filename ripple (see the chunk watch below — pure ordering,
  zero logic delta, proven three ways). **Production == origin/main
  HEAD.**

## The green baseline — the M9 close record (2026-11-16)

Baseline (the M8 close, before the move) and final (after the move
`5463d45f`) runs of `pnpm gates` — **identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1090 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean — ZERO re-keys (zero manifest entries referenced the moved paths; the queued review debt unchanged) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — IDENTICAL to the M7′ + M8 closes |
| 9 | build + bundle budget | PASS | entry 273.95/82.96 (the +0.01 kB gzip = the one-char-longer lazy-path string `features/asia-pacific` vs `routes/page-division`, within ceiling) · ZERO chunk topology delta in logic (see the chunk watch) |

**Environment note (unchanged from M3→M9):** this sandbox's `skills/`
folder sits at the PARENT of the Currena repo (not inside it) — no
parking needed. If a future sandbox injects `skills/` INSIDE the repo
root, park it outside during gates runs (BD-M3 D4), never commit it.

## The M9 session record (what was done)

1. **STEP 0 (the adjusted checks, all green before anything moved):**
   the GitHub token verified FIRST (HTTP 200 on /user, login assadigit,
   full `repo` scope — the push works); the repo re-cloned (fresh
   sandbox); pnpm 10.34.5 installed via npm-global; `pnpm install
   --frozen-lockfile` clean (7.9s); origin/main verified at `a4e4bdc0`
   (the M8 bookkeeping close — 89975407's move + a4e4bdc0 on top,
   exactly the adjusted check; HEAD == origin/main, tree clean); the
   deploy-lock verified via the versions + deployments APIs (currena-api
   `ef5eaeeb` @ 100%, deployment `df34a516` 2026-11-16T04:45:36Z,
   version 404 the newest — nothing newer; production == origin/main
   HEAD as claimed); the baseline `pnpm gates` 9/9, suite 15,298, layer1
   11,969/11,969, 2m 42s — the M7′/M8 close numbers exactly.
2. **The audit verification:** Phase 3 item 7 (asia-pacific) +
   Deliverable 1's asia rows + the N-map (N1/N11) + risks R4/R5/R8/R9
   read; the inventory verified against the actual tree — **9 web + 6
   engine, exactly 15 source files, ZERO co-located snapshots** (no
   `__snapshots__/` rides the set): the 9 web under `src/routes/
   page-division/` (AsiaPage + test, AsiaTierCards, AsiaNzx50Card,
   asia-tiles + test, asia-backtest-core + asia-backtest.test +
   asia-copy-pin.test) + the 6-file adapter sextet in `src/adapters/`
   (imf-cpi + imf-cpi.test, mof + mof.test, nbs + nbs.test). The
   audit's Phase 3 item 7 "4 adapters (3 + test)" notation undercounts
   the co-located tests (THREE, one per adapter — the frankfurter
   counting lesson, third occurrence); its Deliverable 6 row ("9 web +
   6 engine = 15") is the correct count. **pd-s14 verified FIRST as
   the asia script** (the pd-s18/pd-s5 lesson): its repo import is
   `../src/routes/page-division/asia-backtest-core` — in the move set.
   The audit's P3.7 "pd-s12" notation confirmed WRONG (pd-s12 imports
   `europe-backtest-core` — Europe's, M10's).
3. **The pre-gates grep set (all three variants + the R8 fs-path
   forms), executed BEFORE the move:** variant #1 = App.tsx:86 (the
   ONLY asia lazy route; App.tsx:77 EuropePage + :118
   EconomicLinkagesPage still point at page-division — M10/M11's,
   untouched); variant #2 (inline TYPE `import('...').X` pointing at
   moved files) verified ABSENT; variant #3 (CONSUMER dynamic
   `await import()` of a MOVED asia file) verified ABSENT; NO `?raw`
   queries on moved files (the existing ?raw set is M8's gold, already
   re-anchored); NO fs-path forms in the 9 web files or the 3 adapter
   SOURCES (nbs.ts:115 `new URL(href, baseUrl)` is scraped-link URL
   resolution, NOT a fs-path form); the R8 fixture-depth traps = THREE
   (imf-cpi.test:34 `join(here,'..','..','fixtures')`, mof.test:15
   `join(harness(),'..','..','fixtures')`, nbs.test:35
   `join(__dirname,'..','..','fixtures')` — all 2→4 up-levels, the
   cofer/s6 pattern, BD-M7′ D5) — the ONLY fs-path forms in the moved
   set. ZERO mid-phase red gates runs — the FIRST post-move `pnpm
   gates` was 9/9 GREEN (2m 44s, suite 15,298 IDENTICAL).
4. **The move (commit `5463d45f`, ONE commit for web+engine per the
   audit's Phase 3 rule):** the codemod `scripts/m9-asia-codemod.mjs`
   (persisted in-repo per the M2→M9 method) — 15 git-mv moves, 21
   specifiers re-anchored bidirectionally (existence-checked
   candidates, computed depths, specifier styles preserved), 4 manual
   edits. Dry-run reviewed edge by edge before apply. Broken-path grep
   after apply: ZERO old-path references remain anywhere in code (the
   only textual old-path hits are the codemod's own table + pure
   comments — Phase 7's light header pass).
5. **The exports map: NO asia entries exist** (verified — the 16
   existing entries all point elsewhere); the M9 prompt's "if asia has
   entries" resolved NO; ZERO exports-map edits.
6. **Cross-domain edges (documented, allowed):** **N1** —
   asia-backtest-core imports the usa-backtest-core universal harness;
   re-anchored `../../features/usa/usa-backtest-core` →
   `../usa/usa-backtest-core` (the spec SHORTENS, the target is a
   sibling under features/ — the M6/M7′/M8 N1 lesson); **N11** —
   AsiaNzx50Card → `../../features/australia/markets-au` +
   `../../features/australia/au-markets/shared` shortened to
   `../australia/…` (the documented asia→australia edge; the NZX50
   board home is /australia per D-17/BD-S21b); **R9** cross-tree
   scripts re-anchored (apps/web/scripts/pd-s14-backtest.ts +
   packages/insights/scripts/{nbs-backfill, gf-p1-backfill,
   gf-p0-record-candidates}.ts); the engine barrel edges re-anchored
   (shared/adapters/index.ts mof re-export + collect.ts nbs + rung2.ts
   mof/nbs/imf-cpi — importers not moving, targets moving).
7. **Persian-copy manifest: ZERO re-keys** — pre-verified zero entries
   reference the moved paths; copy:audit clean after (exit 0; the
   queued review debt unchanged).
8. **Regenerated + reviewed:** `registry:generate` +
   `placement:generate` + `s24:d9-audit` — **ZERO drift** (data/ +
   PLACEMENT.generated.md byte-identical; D-9 CONDITION MET).
9. **The chunk-merger watch (BD-M5 D3), closed with the
   full-substitution rebasing test + a NEW name-agnostic token-multiset
   proof:** the baseline topology recorded BEFORE the move (80 chunks;
   entry index-CkKkl2hB; asia-relevant AsiaPage-DUt0NhOL). Post-move:
   still 80 chunks, NO merger fired, all basenames UNCHANGED (R5 — no
   renames); **23 re-hashed chunks = the entry (index-CkKkl2hB →
   index-CYK8tYdh, the App.tsx lazy-path string — the M6/M7′/M8
   precedent) + a 22-chunk filename ripple — WIDER than M8's 17** (the
   asia move perturbed the shared-module graph-traversal order for the
   region/tool chunks that share the asia pages' import base). The
   23-name substitution rebasing test: **72/80 byte-identical** after
   substituting every changed filename. The remaining 8 (AsiaPage,
   AustraliaPage, EconomicLinkagesPage, GoldPage, Insights,
   MoneyPanel, UsaPage, entry) differ by PURE ordering artifacts,
   proven three ways: (a) identical import SETS (module + exported
   names) in all 8, statement ORDER swapped in 7 (e.g. PageBreadcrumbs
   ↔ TrendChart/connection-groups); (b) **name-agnostic token
   multisets IDENTICAL in 6/8** — MoneyPanel's single flagged token is
   the minified-name rotation `p.length>0?` → `m.length>0?` inside a
   NESTED template interpolation (proven: the old token with p→m
   equals the new token exactly) and the entry's single flagged token
   is the mapDeps same-numbers reorder; (c) the entry's assets list =
   the same 66 assets with a 3-position rotation at 27/28/29
   (shared-BSjKLDnj ↔ shared-BcAtHwkL ↔ currena-DcWO6uPO), causing the
   28→27 / 29→28 index renumberings in the mapDeps arrays — the M8
   "assets-list order shift + index renumbering" pattern. EVERY one of
   the 8 is size-identical (+0B) — same modules, same import sets,
   same string literals, same numbers: ZERO logic delta. The
   asia-relevant chunk re-hashed AsiaPage-DUt0NhOL → AsiaPage-BJ00I44V
   (NOT hash-unchanged as the dry-run expected — the honest record:
   the asia modules' path change perturbed the import-statement order
   inside the asia chunk and its shared dependents; the delta is
   proven pure ordering, never silently absorbed).
10. **Post-phase deploy + live verify (the deploy-lock held):**
    deploy-lock re-checked FIRST (still `ef5eaeeb` @ 100%, deployment
    `df34a516`, no parallel deploy; Monday — the §21 Tuesday portwatch
    window N/A) → build + `wrangler deploy` (the FIRST attempt hit a
    transient Cloudflare API error, code 10013 on
    assets-upload-session; the retry succeeded — recorded for the next
    session: retry before investigating) → **currena-api `8f779769` @
    100%** (deployment `68097b3a`, 2026-11-16T06:02:36Z). Smoke:
    /api/health ok (kv ok) · / 200 · /asia-pacific 200 ·
    /api/insights/pages/asia-pacific 200 (14 readings — china-pmi,
    china-cpi, oecd-cli-cn, gpr-china, gpr-taiwan,
    china-property-investment, china-steel-output, jgb-10y, boj-rate,
    japan-cpi, korea-cpi, india-cpi, nz-short-rate, nz-10y — + the
    markets board + 0 absentIds, the §11 placement contract; the three
    moved adapters' ids all served). **pd-s14 run LIVE against
    production (the §21 asia gate, seat-level diff): 14 checks · 14
    green · 0 red — ALL CHECKS GREEN**, including the moved-domain
    adapter cards (jgb-10y ← mof; japan/korea/india-cpi ← imf-cpi;
    china-pmi/china-cpi/china-property-investment/china-steel-output ←
    nbs) byte-identical page ≡ engine; 2 cards honestly stale-flagged
    (boj-rate, nz-10y — the cadence audit's known findings, not
    failures). **The all-132-file byte-compare production-vs-M9-build
    (129 dist/assets + sw.js + manifest + index.html via /): MATCH 132
    · DIFFERS 0.**
11. **The pushes verified:** the move commit `5463d45f` PUSHED and
    verified (ls-remote == rev-parse == `5463d45fb688b23af…`); the
    bookkeeping commit follows in this docs commit.

## Where the asia-pacific domain now lives (the Phase 3.7 map)

- **web `apps/web/src/features/asia-pacific/`** — the 9 page-tier files
  FLAT (AsiaPage + test, AsiaTierCards, AsiaNzx50Card, asia-tiles +
  test, asia-backtest-core + asia-backtest.test + asia-copy-pin.test).
  NO named cluster in the asia web set (unlike gold's signals/ or
  currencies' fx-presentation/ — every asia web file is page-tier,
  BD-M4 D1).
- **engine `packages/insights/src/domains/asia-pacific/adapters/`** —
  the adapter sextet FLAT, NO subfolder, NO barrel (imf-cpi +
  imf-cpi.test, mof + mof.test, nbs + nbs.test — the M6/M7′/M8
  convention). asia-pacific has NO board job and NO domain-root engine
  modules — the adapter sextet is the whole engine move.
- **STAYS in `src/adapters/` (Europe's, M10 — NOT moved):** boe.ts +
  boe.test.ts + ecb.ts (ecb has NO co-located test; its test consumer
  is the CROSS-ADAPTER `shared/adapters/adapters.test.ts:12` — the
  frankfurter lesson shape for M10's codemod).
- **The exports map:** NO asia entries (none existed before, none
  added).

## Operational notes worth carrying (M9 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The dynamic-import() regex gap is THREE variants (BD-M7, the
  standing pre-gates discipline):** (1) the dynamic CALL `import('…')`
  (App.tsx lazy routes); (2) the inline TYPE `import('…').X`; (3) the
  CONSUMER dynamic `await import('…')` of a MOVED file. M9 ran the
  full set BEFORE the move: variant #1 had ONE site (App.tsx:86), #2
  and #3 verified ABSENT in the asia set — ZERO mid-phase red gates
  runs (the M7′/M8/M9 streak now stands).
- **The R8 rule (standing):** grep for ALL fs-path forms per moved
  TEST (new URL, join(__dirname/HERE/here), readFileSync(join()),
  fileURLToPath) BEFORE the gates run. M9 had THREE (the adapter-test
  fixture trio — the largest R8 set since M5, all `join()` forms,
  computed 2→4 via path.relative).
- **The count verification (standing):** the audit's per-domain counts
  are approximate — verify the inventory against the actual tree
  before the move (M7′: 41 not 42; M8: 42 git-mv = 41 source + 1
  vitest snapshot; M9: 15 exactly — the audit's "(3 + test)" adapter
  notation undercounted the co-located tests for the THIRD time).
- **The pd-s script notation is unreliable in the audit's Phase 3 rows
  (third occurrence):** P3.7 said pd-s12 (WRONG — asia's is pd-s14);
  P3.8 says pd-s15 (WRONG — NO pd-s15 exists; Europe's is pd-s12,
  verified this session). ALWAYS verify the script's actual imports
  (the pd-s18/pd-s5/pd-s14 lesson).
- **The stranded-push lesson (M7′, still standing):** verify the push
  works (STEP 0 token check, HTTP 200 on /user) BEFORE starting any
  phase; verify the push LANDED (ls-remote == rev-parse) after it.
- **The deploy lock + account check before every deploy** (D-43); the
  KV write cap (1,000/day); the GHA schedule-delay quirk
  (workflow_dispatch); the D-9 audit as a standing gate; never run the
  §21 portwatch leg Tuesdays 11:00–14:00 UTC.
- **The rebasing proof (M8 addition, sharpened at M9):** the
  chunk-merger watch closes with the full substitution test AND (when
  residues remain) the name-agnostic token-multiset comparison —
  canonicalize identifiers, compare token multisets; identical
  multisets = the files are pure permutations of each other (import
  order + minified names), zero logic delta. Ordering-only residues
  (import-order swaps, name rotations, mapDeps renumbering) are
  graph-traversal artifacts — record them honestly, never silently
  absorb them.
- **The wrangler deploy retry rule (M9 addition):** a transient
  Cloudflare API error on assets-upload-session (code 10013) can fail
  the FIRST deploy attempt with the build perfectly fine — retry once
  before investigating.

## Owner-side levers waiting

1. **Ratify BD-M9** (this session's records: the 15-file inventory
   verification incl. the third undercounting of the audit's "(3 +
   test)" adapter notation; the pd-s14-verified-first correction (the
   audit's P3.7 pd-s12 notation wrong, and its P3.8 pd-s15 notation
   wrong too — no pd-s15 exists); the N1/N11 shortened edges; the
   three R8 fixture traps; the ZERO re-keys/exports-entries; the
   chunk watch with the 22-chunk ripple + the token-multiset proof;
   the 132/132 byte-compare + the pd-s14 14/14 live gate; the
   transient deploy-retry note).
2. **Ratify BD-M8** (still waiting) + **BD-M7′** (still waiting) +
   the carried BD-M6 … BD-M1-r + BD-BR + the BD-S3…BD-S31 set.
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
   this session's worked; the sedanama-ir Cloudflare Workers token —
   worked, incl. the deploy; the EODHD token — not needed this
   session; all pasted in chat again, never stored in the repo).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (BD-S19c); non-JS crawlers see
  the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8 —
  M10's; the audit's P3.8 pd-s15 notation is WRONG, no pd-s15 exists)
  · **pd-s14 (Asia 14 — M9's; DONE — its import re-anchored by the M9
  codemod and verified LIVE: 14/14 green against production)** ·
  pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18
  (Currencies 53) — all re-runnable against production from
  apps/web/scripts/ (pass `--base https://currena.ir`). pd-s18 (M7′'s),
  pd-s5 (M8's) and pd-s14 (M9's) are all DONE — imports re-anchored
  by their sessions' codemods and verified LIVE.
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The bundle topology post-M9: one entry re-hash + a WIDER filename
  ripple + eight ordering-residue chunks, zero logic delta (proven)**
  — the entry `index-CkKkl2hB` → `index-CYK8tYdh` (the App.tsx
  lazy-path string) with the ripple on 22 entry-referencing chunks
  (M8 had 17); 72/80 byte-identical after the 23-name substitution;
  the 8 residues (AsiaPage, AustraliaPage, EconomicLinkagesPage,
  GoldPage, Insights, MoneyPanel, UsaPage, entry) are pure
  import-order swaps + minified-name rotations + the entry's
  3-position assets-list rotation (27/28/29) with the consequent
  mapDeps index renumberings — same sets everywhere, +0B every file,
  proven by identical name-agnostic token multisets (6/8 exact;
  MoneyPanel's single flagged token = the p→m name rotation inside a
  nested template interpolation; the entry's = the mapDeps reorder).
  The 80-chunk count unchanged; all basenames preserved (R5). Phase
  3's remaining moves (M10+) keep the same basename discipline.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix).
- The pure-comment path references are Phase 7's light header pass;
  M9's move added none beyond the existing set (the licences.ts /
  definitions.ts / ingest/data.ts "adapters/nbs.ts" mentions are
  pre-existing comments, untouched by design).
- The `m3-live-verify.cjs` file-level eslint-disable (BD-M4 D0 /
  chore `99ba8c38`) is the established pattern for any future cjs
  node script — do NOT extend the eslint scope for one file.
- **The stranded-M7 historical note:** the original M7's commit hashes
  (723907e + a0a4b34) NEVER existed on origin/main — the M7′
  equivalents are `fd981e3e` + `87884724`. The stranded production
  version `c2ff9bf4` served 2026-11-15T23:17Z → 2026-11-16T02:45Z;
  `ea4127ba` (the M7′ deploy) served 02:45Z → 04:45Z; `ef5eaeeb`
  (the M8 deploy) served 04:45Z → 06:02Z; `8f779769` (the M9 deploy)
  serves from 2026-11-16T06:02:36Z.

---

## The M10 next-session prompt (modularization Phase 3.8 — europe)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M10 — modularization Phase 3.8: the europe domain (the eighth
Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 8 +
Deliverable 1's europe rows (8 web files + boe/boe.test/ecb — the
Deliverable 6 row says "8 web + 3 engine = 11") + the N1–N18
cross-domain map + risks R4/R5/R8/R9) → docs/HANDOFF.md (the M9
version — this file) → CHANGELOG [2026-11-16] M9 → docs/DECISIONS.md
BD-M9.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′): a
   session that delivers but cannot push leaves production AHEAD of
   origin/main and silently breaks the deploy-lock. If the token is
   invalid: STOP, tell the owner, do NOT start.
2. Verify origin/main has the M9 move commit 5463d45f, then the M9
   bookkeeping commit ad96ddfa, then EXACTLY ONE docs-only process
   commit on top of it (the 2026-11-16 AGENTS.md §10 item-3 rule —
   `git log --oneline -3 origin/main`; `git show --stat HEAD` must
   show a DOCS-ONLY change: AGENTS.md + CHANGELOG.md + docs/HANDOFF.md
   + docs/DECISIONS.md, no code), AND production is the M9 deploy:
   currena-api 8f779769 @ 100% (the deploy-lock; docs-only commits do
   NOT change deployed code). ANY code commit beyond ad96ddfa, or ANY
   production version newer than 8f779769: STOP and report.
3. Run `pnpm gates` once and record the numbers (the M9 close: 9/9,
   suite 15,298, IDENTICAL to the M7′ + M8 + M9 closes — ZERO delta).
   If the baseline is red, STOP and report — never start a phase on a
   red baseline. ENVIRONMENT NOTE: this sandbox's `skills/` folder sits
   at the PARENT of the Currena repo (not inside it) — no parking
   needed. If a future sandbox injects `skills/` INSIDE the repo root,
   park it outside during gates runs (BD-M3 D4), never commit it.

The phase (audit §"Phase 3" item 8 — europe: 8 web files + 2 adapters
(3 with test)):
- VERIFY the exact file inventory against the actual tree BEFORE the
  move (the M7′/M8/M9 lesson: the audit's counts are approximate — grep
  + ls everything; the "(3 with test)" notation: boe has a co-located
  boe.test.ts but ecb's test consumer is the CROSS-ADAPTER
  shared/adapters/adapters.test.ts:12 — the frankfurter lesson).
- Web side → apps/web/src/features/europe/: the EuropePage tier per
  the audit's Deliverable 1 europe rows — page files FLAT (the BD-M4
  D1 convention; confirmed in tree at handoff: EuropePage.tsx +
  EuropePage.test.tsx, EuropeTierCards.tsx, europe-backtest-core.ts +
  europe-backtest.test.ts + europe-copy-pin.test.ts, europe-tiles.ts +
  europe-tiles.test.ts — exactly 8).
- Engine side → packages/insights/src/domains/europe/: the adapters
  FLAT under adapters/ (the M6/M7′/M8/M9 convention — no subfolder, no
  barrel): boe.ts + boe.test.ts + ecb.ts from src/adapters/ (the LAST
  remaining src/adapters files — the folder empties completely this
  phase; ecb's consumers verified at M9: shared/adapters/
  {index,collect,rung2}.ts + shared/adapters/adapters.test.ts (the
  cross-adapter test) + packages/insights/scripts/gf-s11-verify.ts).
- pd-s12 is the europe backtest script (VERIFIED at M9: its repo
  import is ../src/routes/page-division/europe-backtest-core — in the
  move set; the audit's P3.8 row notation says pd-s15, which is WRONG
  — NO pd-s15 exists in apps/web/scripts/; trust only verified
  imports).
- The pre-gates grep set (the BD-M7 sharpened three-variant
  dynamic-import discipline + the R8 fs-path forms), executed BEFORE
  the move: grep per moved file for ?raw + new URL(spec,
  import.meta.url) + join(__dirname/HERE/here) + readFileSync(join())
  + fileURLToPath AND across ALL consumers for dynamic import(' with
  relative specs pointing at moved files (all THREE variants — the
  M9 record: variant #1 was App.tsx:77, the ONLY europe lazy site).
- The codemod method (scripts/m9-asia-codemod.mjs is the persisted
  pattern): moves table → bidirectional re-anchoring → manual edits
  computed, never counted. Dry-run first, review every edge, then
  apply. Broken-path grep after apply.
- NO renames (R5). Tests move WITH their subjects + their snapshots
  (R6). Persian-copy manifest re-keys per BD-M5 D5 (run copy:audit,
  re-key REMOVED+NEW pairs — never text/sha — then copy:audit clean).
  CHUNK-MERGER WATCH: record the baseline dist topology before the
  move (expect the M9 post-move surface: 80 chunks, entry
  index-CYK8tYdh); close with the full-substitution rebasing test +
  the name-agnostic token-multiset proof (the M9 sharpening) —
  ordering-only residues are recorded, never absorbed.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green + PUSHED (verify the push!);
the exports map (europe has NO entries expected — verify) + all path
references updated in the same commits as their moves; production ==
origin/main HEAD after the post-phase deploy (deploy-lock re-check
FIRST — D-43; never run the §21 portwatch leg Tuesdays 11:00–14:00
UTC; if wrangler deploy fails on assets-upload-session with code
10013, RETRY once before investigating — the M9 note). Bookkeeping per
AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS) and the M11
(economic-linkages) pointer (Phase 3.9: 5 web files, no engine;
verify the inventory). Progress after M10: modularization M10/16 · 6
remaining.
```
