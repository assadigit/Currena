# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M10 (2026-11-16) — DELIVERED: modularization Phase 3.8 (europe, the
> eighth Phase 3 move) is done.** 11 source files moved in ONE commit
> (`6a54bacc`, pushed and verified — 20 files changed, 11 renames 95-100%
> similarity): 8 web → `features/europe/` FLAT (EuropePage + test,
> EuropeTierCards, europe-tiles + test, europe-backtest-core +
> europe-backtest.test + europe-copy-pin.test — every file page-tier, no
> named cluster, BD-M4 D1) + 3 engine → `domains/europe/adapters/` FLAT
> (boe + boe.test + ecb — NO subfolder, NO barrel, the M6→M9 convention;
> ecb has NO co-located test, its test consumer is the CROSS-ADAPTER
> `shared/adapters/adapters.test.ts:12`, the frankfurter lesson shape —
> exactly as the M9 session verified). **The engine trio was the LAST of
> `src/adapters/` — the folder EMPTIES completely this phase.** 17 import
> specifiers re-anchored by codemod + 1 manual edit (App.tsx:77 lazy —
> dynamic-import variant #1, the ONLY europe site). **ZERO R8 fs-path
> forms in the whole moved set** (boe.test.ts uses inline fixtures — the
> simplest R8 situation since the phases began; no manual R8 edits at
> all). NO exports-map entries for europe (the 16 existing entries all
> point elsewhere). Gates 9/9 with the suite EXACTLY 15,298 (IDENTICAL to
> the M7′ + M8 + M9 closes — ZERO delta); NO mid-phase red gates runs
> (the pre-gates grep caught everything BEFORE the gates run — the streak
> holds). ZERO Persian-copy re-keys; ZERO registry/placement/D-9 drift.
> Production deployed post-phase (`fb969a20` @ 100%, FIRST deploy attempt
> clean — no 10013 retry needed this time) and live-verified: the
> deploy-lock held throughout, and the all-deployable-file byte-compare
> production-vs-M10-build is MATCH 165 · DIFFERS 0.

> **The NEXT session is M11** — modularization Phase 3.9
> (economic-linkages: 5 web files, NO engine move — connections.ts stays
> shared per the audit; the inventory VERIFIED this session against the
> tree: EconomicLinkagesPage.tsx + `components/insights/{Together.tsx,
> ConnectionCard.tsx, connection-groups.ts, together-signals.test.ts}` —
> NOTE the move set spans TWO source folders for the first time since
> M5: one routes/page-division file + four components/insights files),
> prompt at the bottom of this file. **STEP 0 adjustment (updated after
> the M10 close): verify origin/main has the M10 move commit `6a54bacc`,
> then the M10 bookkeeping commit (docs-only, this commit), and production
> is the M10 deploy: currena-api `fb969a20` @ 100% (the deploy-lock;
> docs-only commits do NOT change deployed code).**

## Current state (after the M10 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · Phase 3.2 (M4: the world-markets domain) · Phase 3.3 (M5:
  the australia domain) · Phase 3.4 (M6: the commodities domain) ·
  Phase 3.5 (M7′: the currencies domain, the re-do) · Phase 3.6 (M8:
  the gold domain) · Phase 3.7 (M9: the asia-pacific domain) ·
  **Phase 3.8 (M10: the europe domain, this session)** all DELIVERED.
  Phase 3 continues biggest-first: economic-linkages (M11) is next.
- **origin/main is GREEN** — 9/9 gates at `6a54bacc` (the move), suite
  15,298 (IDENTICAL to the M7′ + M8 + M9 closes — ZERO delta), working
  tree clean, push verified (ls-remote == rev-parse).
- **Production is CURRENT** — currena-api `fb969a20` @ 100% (deployed
  2026-11-16T09:01:25Z, deployment `c5e355eb`), the exact origin/main
  deployed surface: the M10 build matches the LIVE surface on ALL 165
  deployable files (sha256 for sha256, MATCH 165 · DIFFERS 0; index.html
  compared via `/` — the platform 307s /index.html → /, the standing
  convention; `_headers` excluded — the platform never serves it raw,
  the SPA fallback answers). **The M10 chunk topology came out FULLY
  FROZEN: ZERO re-hashed chunks, ZERO filename ripple** — see the chunk
  watch below; production == origin/main HEAD.

## The green baseline — the M10 close record (2026-11-16)

Baseline (the M9 close, before the move) and final (after the move
`6a54bacc`) runs of `pnpm gates` — **identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1091 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean — ZERO re-keys (zero manifest entries referenced the moved paths; the queued review debt unchanged) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — IDENTICAL to the M7′ + M8 + M9 closes |
| 9 | build + bundle budget | PASS | entry 273.95/82.96 — the IDENTICAL numbers, because the entry chunk is byte-identical (see the chunk watch) |

**Environment note (unchanged from M3→M10):** this sandbox's `skills/`
folder sits at the PARENT of the Currena repo (not inside it) — no
parking needed. If a future sandbox injects `skills/` INSIDE the repo
root, park it outside during gates runs (BD-M3 D4), never commit it.

## The M10 session record (what was done)

1. **STEP 0 (the adjusted checks, all green before anything moved):**
   the GitHub token verified FIRST (HTTP 200 on /user, login assadigit —
   the push works); the repo re-cloned (fresh sandbox); pnpm 10.34.5
   installed via npm-global; `pnpm install --frozen-lockfile` clean
   (8.1s); origin/main verified at `3a1871e4` (the M9 bookkeeping
   `ad96ddfa` + the ONE docs-only process commit on top, exactly the
   adjusted check; `git show --stat HEAD` confirmed docs-only; HEAD ==
   origin/main, tree clean); the deploy-lock verified via the
   deployments + versions APIs (currena-api `8f779769` @ 100%,
   deployment `68097b3a` 2026-11-16T06:02:36Z, `8f779769` the newest
   version — nothing newer; production == origin/main HEAD as claimed);
   the baseline `pnpm gates` 9/9, suite 15,298, layer1 11,969/11,969,
   2m 39s — the M7′/M8/M9 close numbers exactly.
2. **The audit verification:** Phase 3 item 8 (europe) + Deliverable 1's
   europe rows + Deliverable 6's P3.8 row + the N-map + risks R4/R5/R8/
   R9 read; the inventory verified against the actual tree — **8 web +
   3 engine, exactly 11 source files, ZERO co-located snapshots**: the 8
   web under `src/routes/page-division/` (EuropePage + test,
   EuropeTierCards, europe-tiles + test, europe-backtest-core +
   europe-backtest.test + europe-copy-pin.test) + the adapter trio in
   `src/adapters/` (boe + boe.test + ecb — and NOTHING else remained in
   that folder). The audit's Phase 3 item 8 row ("8 web files + 2
   adapters (3 with test)") and its Deliverable 6 row ("8 web + 3 engine
   = 11") AGREE this time once "(3 with test)" is read as 3 files incl.
   boe's test — the audit's undercounting habit did NOT fire for europe.
   **pd-s12 verified FIRST as the europe script** (its repo import is
   `../src/routes/page-division/europe-backtest-core` — in the move set;
   the audit's P3.8 pd-s15 notation confirmed WRONG — NO pd-s15 exists
   in apps/web/scripts/, the fourth pd-s notation error in the audit's
   Phase 3 rows).
3. **The pre-gates grep set (all three variants + the R8 fs-path
   forms), executed BEFORE the move:** variant #1 = App.tsx:77 (the
   ONLY europe lazy route; App.tsx:118 EconomicLinkagesPage still points
   at page-division — M11's, untouched); variant #2 (inline TYPE
   `import('...').X` pointing at moved files) verified ABSENT; variant
   #3 (CONSUMER dynamic `await import()` of a MOVED europe file)
   verified ABSENT — the two `await import('../../shared/lib/locale')`
   sites in EuropePage.test.tsx (386 + 422) point at NON-moved shared
   files at the SAME depth (routes/page-division/ → features/europe/,
   both at src depth 2) — NO-OPs; NO `?raw` queries on moved files; NO
   fs-path forms ANYWHERE in the 11-file moved set (**the simplest R8
   situation since the phases began** — boe.test.ts uses inline
   fixtures, no fs reads; ZERO manual R8 edits). ZERO mid-phase red
   gates runs — the FIRST post-move `pnpm gates` was 9/9 GREEN (2m 40s,
   suite 15,298 IDENTICAL).
4. **The move (commit `6a54bacc`, ONE commit for web+engine per the
   audit's Phase 3 rule):** the codemod `scripts/m10-europe-codemod.mjs`
   (persisted in-repo per the M2→M9 method) — 11 git-mv moves, 17
   specifiers re-anchored bidirectionally (existence-checked
   candidates, computed depths, specifier styles preserved), 1 manual
   edit. Dry-run reviewed edge by edge before apply (every edge
   cross-checked against the hand-grep consumer map — exact match).
   Broken-path grep after apply: ZERO old-path references remain
   anywhere in code (the only textual old-path hits are the codemod's
   own doc table + the pre-existing pure-comment mention
   `shared/sources.ts:547` "See adapters/ecb.ts" — Phase 7's light
   header pass, untouched by design).
5. **The exports map: NO europe entries exist** (verified — the 16
   existing entries all point elsewhere); the M10 prompt's "europe has
   NO entries expected" resolved NO; ZERO exports-map edits.
6. **Cross-domain edges (documented, allowed):** **N1** —
   europe-backtest-core imports the usa-backtest-core universal harness;
   re-anchored `../../features/usa/usa-backtest-core` → `../usa/
   usa-backtest-core` (the spec SHORTENS, the target is a sibling under
   features/ — the M6→M9 N1 lesson); **R9** cross-tree scripts
   re-anchored (apps/web/scripts/pd-s12-backtest.ts +
   packages/insights/scripts/gf-s11-verify.ts — the ecb borrower); the
   engine barrel edges re-anchored (shared/adapters/collect.ts boe+ecb,
   derived.ts boe, rung2.ts ecb, index.ts the ecb re-export + the
   CROSS-ADAPTER adapters.test.ts:12 ecb — importers not moving,
   targets moving).
7. **Persian-copy manifest: ZERO re-keys** — pre-verified zero entries
   reference the moved paths; copy:audit clean after (exit 0; the
   queued review debt unchanged).
8. **Regenerated + reviewed:** `registry:generate` + `placement:generate`
   + `s24:d9-audit` — **ZERO drift** (data/ + PLACEMENT.generated.md
   byte-identical; D-9 CONDITION MET).
9. **The chunk-merger watch (BD-M5 D3), closed with the cleanest result
   in the program's history — ZERO re-hashed chunks:** the baseline
   topology recorded BEFORE the move (80 chunks; entry index-CYK8tYdh;
   europe-relevant EuropePage-bVsigf6t; the full 166-file dist sha256
   snapshot + a /tmp copy). Post-move: still 80 chunks, NO merger fired,
   all basenames UNCHANGED (R5 — no renames), and **the ENTIRE
   dist/assets/ + index.html + manifest.webmanifest + workbox chunk came
   out BYTE-IDENTICAL** — including the entry (`index-CYK8tYdh`, sha
   deca57ff… unchanged) and the europe route chunk
   (`EuropePage-bVsigf6t`, sha f7007bac… unchanged). The full-substitution
   rebasing test is trivially satisfied (NOT ONE filename changed —
   there is nothing to substitute; 165/166 dist files byte-identical).
   The ONLY delta in the whole dist: **`sw.js` — a pure 6-entry rotation
   in the precache-list tail** (`images/currena-logo.png` moved position
   154 → 159, the five icons entries shifted up one; all 161 entries
   url:revision-identical as multisets; same 10,435 bytes), a
   public/-glob readdir artifact of the workbox precache generation —
   NONE of the rotated entries is a moved file, ZERO relation to the
   europe move; stable across two consecutive rebuilds within this
   environment. **The mechanism note (the M6→M9 record refined):** the
   entry re-hash in M6→M9 followed the MOVED DOMAIN'S PAGE-CHUNK
   filename change (the entry's assets-list reference), not the
   lazy-path string per se — the App.tsx lazy-path string never survives
   bundling (Rollup resolves it to the chunk URL; verified: neither
   'routes/page-division/EuropePage' nor 'features/europe/EuropePage'
   appears anywhere in the built dist). M10's EuropePage chunk came out
   byte-identical because the only spec change inside the europe set
   (the N1 shortening) resolves to the SAME module and specifier text
   never survives bundling — so nothing re-hashed anywhere. The M9
   "lazy-path string" attribution is hereby corrected to "page-chunk
   filename change" in the record; both descriptions coincided in
   M6→M9 because every prior move perturbed its page chunk.
10. **Post-phase deploy + live verify (the deploy-lock held):**
    deploy-lock re-checked FIRST (still `8f779769` @ 100%, deployment
    `68097b3a`, no parallel deploy; Monday — the §21 Tuesday portwatch
    window N/A; pd-s12 is a seat-level diff, not the portwatch leg
    anyway) → build + `wrangler deploy` (the FIRST attempt SUCCEEDED —
    no 10013 assets-upload-session retry needed this time; the M9 retry
    note stays in force) → **currena-api `fb969a20` @ 100%** (deployment
    `c5e355eb`, 2026-11-16T09:01:25Z). Smoke: /api/health ok (kv ok) ·
    / 200 · /europe 200 · /api/insights/pages/europe 200 (8 readings —
    boe-rate, btp-bund-spread, bund-10y, ecb-dfr, euro-aaa-10y,
    euro-hicp, gilt-10y, oecd-cli-de + the markets board + 0 absentIds,
    the §11 placement contract; the moved adapters' ids all served:
    boe-rate ← boe; ecb-dfr + euro-aaa-10y + euro-hicp ← ecb).
    **pd-s12 run LIVE against production (the §21 europe gate,
    seat-level diff): ALL CHECKS GREEN** — 8/8 card checks byte-identical
    page ≡ engine, the placement groups 8/8 carried, every seated tier
    card within cadence grace or honestly stale-flagged (3 cards —
    bund-10y, btp-bund-spread, gilt-10y — carry the engine's stale
    status honestly; the cadence audit's known findings, not failures).
    **The all-deployable-file byte-compare production-vs-M10-build:
    MATCH 165 · DIFFERS 0** (166 dist files total: index.html via `/`
    — sha-identical f2d3ba9c…; `_headers` excluded per the M9
    convention, the platform never serves it raw — the SPA fallback
    answers; one environment FINDING recorded: a urllib-fetched `/`
    carries Cloudflare's zone-side Web Analytics beacon injection
    (+367 bytes, the static.cloudflareinsights.com script tag — a
    platform transform on browser-ish requests, NOT deployed code;
    curl-fetched `/` is byte-identical — compare with curl or
    user-agent-fixed fetchers).
11. **The pushes verified:** the move commit `6a54bacc` PUSHED and
    verified (ls-remote == rev-parse == `6a54bacc0494d09db5…`); the
    bookkeeping commit follows in this docs commit.

## Where the europe domain now lives (the Phase 3.8 map)

- **web `apps/web/src/features/europe/`** — the 8 page-tier files FLAT
  (EuropePage + test, EuropeTierCards, europe-tiles + test,
  europe-backtest-core + europe-backtest.test + europe-copy-pin.test).
  NO named cluster in the europe web set (every file is page-tier,
  BD-M4 D1).
- **engine `packages/insights/src/domains/europe/adapters/`** — the
  adapter trio FLAT, NO subfolder, NO barrel (boe + boe.test + ecb —
  the M6→M9 convention). europe has NO board job and NO domain-root
  engine modules — the adapter trio is the whole engine move.
- **`packages/insights/src/adapters/` is now EMPTY** — the folder that
  held every provider adapter at Phase 0 is fully retired from use
  after M10 (git no longer tracks it; the N13 shared adapters live in
  `shared/adapters/` since Phase 2, and every domain adapter now lives
  under its `domains/<domain>/adapters/` home).
- **The exports map:** NO europe entries (none existed before, none
  added).

## Operational notes worth carrying (M10 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The dynamic-import() regex gap is THREE variants (BD-M7, the
  standing pre-gates discipline):** (1) the dynamic CALL `import('…')`
  (App.tsx lazy routes); (2) the inline TYPE `import('…').X`; (3) the
  CONSUMER dynamic `await import('…')` of a MOVED file. M10 ran the
  full set BEFORE the move: variant #1 had ONE site (App.tsx:77), #2
  and #3 verified ABSENT in the europe set (the two `await import()`
  sites inside EuropePage.test point at NON-moved shared files at the
  same depth — NO-OPs; record that shape so future greps don't
  false-positive) — ZERO mid-phase red gates runs (the M7′/M8/M9/M10
  streak now stands).
- **The R8 rule (standing):** grep for ALL fs-path forms per moved TEST
  (new URL, join(__dirname/HERE/here), readFileSync(join()),
  fileURLToPath) BEFORE the gates run. M10 had ZERO (boe.test.ts uses
  inline fixtures — the first fully-R8-clean move since the phases
  began).
- **The count verification (standing):** the audit's per-domain counts
  are approximate — verify the inventory against the actual tree
  before the move (M7′: 41 not 42; M8: 42 git-mv = 41 source + 1
  vitest snapshot; M9: 15 exactly; M10: 11 exactly — the audit's
  item-8 row and its Deliverable 6 row AGREE for europe).
- **The pd-s script notation is unreliable in the audit's Phase 3 rows
  (FOURTH occurrence):** P3.8 said pd-s15 (WRONG — europe's is pd-s12;
  no pd-s15 exists). ALWAYS verify the script's actual imports (the
  pd-s18/pd-s5/pd-s14/pd-s12 lesson).
- **The entry-re-hash mechanism, corrected at M10:** the M6→M9 closes
  attributed the entry re-hash to "the App.tsx lazy-path string" —
  M10's fully-frozen topology proves the real trigger is the MOVED
  DOMAIN'S PAGE-CHUNK filename change (the entry's assets-list
  reference); the lazy-path string never survives bundling. If a future
  phase's page chunk comes out byte-identical (spec changes that
  resolve to the same modules), expect ZERO ripple — and verify with
  the full dist sha256 snapshot, not just the entry.
- **The sw.js precache-tail nondeterminism (M10 finding):** the
  workbox-generated sw.js can differ between builds by a pure rotation
  of the public/-glob tail entries (multiset-identical, same size) —
  an environment readdir artifact. Compare dist builds with the
  entry-set multiset proof, not raw sha, for sw.js specifically.
- **The production byte-compare tooling note (M10 finding):** compare
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
  before investigating. (M10's first attempt succeeded; the note stays
  for the next 10013.)

## Owner-side levers waiting

1. **Ratify BD-M10** (this session's records: the 11-file inventory
   verification; the ZERO-R8-fs-path-forms finding; the pd-s12
   confirmation (the audit's pd-s15 notation wrong — fourth pd-s
   error); the N1 shortened edge; the engine-trio consumer set (boe:
   collect+derived; ecb: index+collect+rung2+adapters.test+gf-s11);
   the src/adapters/ retirement; the ZERO re-keys/exports-entries; the
   FULLY-FROZEN chunk topology with the mechanism correction; the
   sw.js tail-rotation + beacon-injection findings; the 165/165
   byte-compare + the pd-s12 ALL-GREEN live gate).
2. **Ratify BD-M9** (still waiting) + **BD-M8** (still waiting) +
   **BD-M7′** (still waiting) + the carried BD-M6 … BD-M1-r + BD-BR +
   the BD-S3…BD-S31 set.
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
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · **pd-s12 (Europe 8
  — M10's; DONE — its import re-anchored by the M10 codemod and
  verified LIVE: ALL CHECKS GREEN against production)** · pd-s14
  (Asia 14 — M9's, DONE) · pd-s16 (Australia 28) · pd-s17
  (Commodities 24) · pd-s18 (Currencies 53) — all re-runnable against
  production from apps/web/scripts/ (pass `--base https://currena.ir`).
  pd-s5 (M8's), pd-s14 (M9's) and pd-s12 (M10's) are all DONE —
  imports re-anchored by their sessions' codemods and verified LIVE.
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The bundle topology post-M10: FULLY FROZEN — zero re-hashed chunks,
  zero ripple, the whole dist byte-identical except sw.js's pure
  6-entry precache-tail rotation** (the entry `index-CYK8tYdh` and
  `EuropePage-bVsigf6t` sha-unchanged; the mechanism note above — the
  M6→M9 "entry re-hash" pattern did NOT fire because M10's page chunk
  came out byte-identical). The 80-chunk count unchanged; all
  basenames preserved (R5). Phase 3's remaining moves (M11+) keep the
  same basename discipline.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix).
- The pure-comment path references are Phase 7's light header pass;
  M10's move added none beyond the existing set (the licences.ts /
  definitions.ts / ingest/data.ts / sources.ts:547 "adapters/…" mentions
  are pre-existing comments, untouched by design).
- The `m3-live-verify.cjs` file-level eslint-disable (BD-M4 D0 /
  chore `99ba8c38`) is the established pattern for any future cjs
  node script — do NOT extend the eslint scope for one file.
- **The stranded-M7 historical note:** the original M7's commit hashes
  (723907e + a0a4b34) NEVER existed on origin/main — the M7′
  equivalents are `fd981e3e` + `87884724`. The stranded production
  version `c2ff9bf4` served 2026-11-15T23:17Z → 2026-11-16T02:45Z;
  `ea4127ba` (the M7′ deploy) served 02:45Z → 04:45Z; `ef5eaeeb`
  (the M8 deploy) served 04:45Z → 06:02Z; `8f779769` (the M9 deploy)
  served 06:02Z → 09:01Z; **`fb969a20` (the M10 deploy) serves from
  2026-11-16T09:01:25Z**.

---

## The M11 next-session prompt (modularization Phase 3.9 — economic-linkages)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M11 — modularization Phase 3.9: the economic-linkages domain
(the ninth Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 9 +
Deliverable 1's economic-linkages rows + the N-map (N12 shared-layer,
N18 legacy super-consumer) + risks R4/R5/R8/R9) → docs/HANDOFF.md (the
M10 version — this file) → CHANGELOG [2026-11-16] M10 → docs/DECISIONS.md
BD-M10.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′): a
   session that delivers but cannot push leaves production AHEAD of
   origin/main and silently breaks the deploy-lock. If the token is
   invalid: STOP, tell the owner, do NOT start.
2. Verify origin/main has the M10 move commit 6a54bacc, then the M10
   bookkeeping commit (docs-only — AGENTS.md + CHANGELOG.md +
   docs/HANDOFF.md + docs/DECISIONS.md, no code; `git log --oneline -2
   origin/main`; confirm via `git show --stat HEAD`), AND production is
   the M10 deploy: currena-api fb969a20 @ 100% (the deploy-lock;
   docs-only commits do NOT change deployed code). ANY code commit
   beyond the bookkeeping, or ANY production version newer than
   fb969a20: STOP and report.
3. Run `pnpm gates` once and record the numbers (the M10 close: 9/9,
   suite 15,298, IDENTICAL to the M7′ + M8 + M9 + M10 closes — ZERO
   delta). If the baseline is red, STOP and report — never start a
   phase on a red baseline. ENVIRONMENT NOTE: this sandbox's `skills/`
   folder sits at the PARENT of the Currena repo (not inside it) — no
   parking needed. If a future sandbox injects `skills/` INSIDE the
   repo root, park it outside during gates runs (BD-M3 D4), never
   commit it.

The phase (audit §"Phase 3" item 9 — economic-linkages: 5 web files,
NO engine move; engine connections.ts stays shared):
- VERIFY the exact file inventory against the actual tree BEFORE the
  move (the M7′/M8/M9/M10 lesson). The M10-verified set: the move
  spans TWO source folders for the first time since M5 — ONE file from
  apps/web/src/routes/page-division/ (EconomicLinkagesPage.tsx) + FOUR
  from apps/web/src/components/insights/ (Together.tsx,
  ConnectionCard.tsx, connection-groups.ts, together-signals.test.ts)
  → all five FLAT into apps/web/src/features/economic-linkages/.
- NO pd-s script exists for economic-linkages (the page carries 0
  registry cards + 10 connection cards — the §20 toolkit never got a
  linkages leg); grep apps/web/scripts/ to confirm nothing imports the
  five files.
- The pre-gates grep set (the BD-M7 sharpened three-variant
  dynamic-import discipline + the R8 fs-path forms), executed BEFORE
  the move: grep per moved file for ?raw + new URL(spec,
  import.meta.url) + join(__dirname/HERE/here) + readFileSync(join())
  + fileURLToPath AND across ALL consumers for dynamic import(' with
  relative specs pointing at moved files (all THREE variants — the M10
  record: variant #1 was App.tsx:118, the ONLY economic-linkages lazy
  site).
- KNOWN CONSUMER SET to verify (from the audit's Deliverable 1 rows):
  Together's importers = routes/Insights.tsx (the N18 legacy
  super-consumer) + features/australia/AustraliaPage.tsx +
  features/usa/UsaPage.tsx; connection-groups' importers = the same
  three + EconomicLinkagesPage itself. EconomicLinkagesPage's own
  imports re-anchor (components/insights/… → ../… depth arithmetic via
  path.relative, never hand-counted).
- The codemod method (scripts/m10-europe-codemod.mjs is the persisted
  pattern): moves table → bidirectional re-anchoring → manual edits
  computed, never counted. Dry-run first, review every edge, then
  apply. Broken-path grep after apply.
- NO renames (R5). Tests move WITH their subjects + their snapshots
  (R6). Persian-copy manifest re-keys per BD-M5 D5 (run copy:audit —
  expect ZERO re-keys; pre-verify no manifest entries reference the
  moved paths). Exports map: europe had none; economic-linkages is
  expected to have NONE too — verify. CHUNK-MERGER WATCH: record the
  baseline dist topology before the move (expect the M10 post-move
  surface: 80 chunks, entry index-CYK8tYdh, FULLY-FROZEN baseline);
  close with the full-substitution rebasing test + the name-agnostic
  token-multiset proof — and NOTE the M10 mechanism correction: the
  entry re-hashes only if the moved page chunk's filename changes; a
  byte-identical page chunk means zero ripple (verify with the full
  dist sha256 snapshot; compare sw.js by entry-multiset, not raw sha —
  the workbox precache-tail can rotate between builds).

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
rewrite + CHANGELOG + DECISIONS) and the M12 (global) pointer
(Phase 3.10: the global domain — VERIFY the inventory against the
audit's Deliverable 1 global rows + the tree). Progress after M11:
modularization M11/16 · 5 remaining.
```
