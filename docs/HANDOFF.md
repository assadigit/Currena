# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M8 (2026-11-16) — DELIVERED: modularization Phase 3.6 (gold, the
> sixth Phase 3 move) is done.** 41 source files moved in ONE commit
> (`89975407`, pushed and verified — 69 files changed, 42 renames
> 93-100% similarity): 22 web → `features/gold/` (the 13 page-tier
> files FLAT + Signals.tsx + outlook.test.ts FLAT at the parent level +
> the 7-file signals/ NAMED CLUSTER preserved as `features/gold/signals/`
> + the co-located vitest snapshot riding its test) + 19 engine →
> `domains/gold/` (the 13-file domain-root set FLAT — gold has NO board
> job, so no subfolder — + the 6-file adapters/ flat: cftc, sge,
> sge-monthly + sge-monthly.test (the ONLY co-located adapter test),
> bazg, gold-equities). 109 import specifiers re-anchored by codemod +
> 3 manual edits (App.tsx lazy route — variant #1; gold-balance.test.ts
> `new URL('../fixtures/…')` R8 depth 1→3 — the ONLY fs-path form in the
> moved set; the exports-map `./gf-p0-proposed` repointed — the ONE gold
> entry, which the audit's Phase 3 row didn't list, with the entry NAME
> frozen, R4). gold-score STAYS in engine shared (D1 — the 37 voters span
> 5 domains) and outlook-core STAYS in web shared/components (N5,
> Phase 2) — neither moved, by constraint. Gates 9/9 with the suite
> EXACTLY 15,298 (IDENTICAL to the M7′ close — ZERO delta); NO mid-phase
> red gates runs (the pre-gates grep caught everything BEFORE the gates
> run). Production deployed post-phase (`ef5eaeeb` @ 100%) and
> live-verified — the deploy-lock held throughout.**

> **The NEXT session is M9** — modularization Phase 3.7 (asia-pacific: 9
> web files + 4 adapters (3 + test) per the audit; VERIFY the inventory
> against the tree — the M7′/M8 lesson); pd-s14 is the asia backtest
> script (the Known-state list — the audit's P3.7 row notation says
> pd-s12, which is WRONG: pd-s12 is Europe's; verify at M9 per the
> pd-s18/pd-s5 lesson), prompt at the bottom of this file. **STEP 0
> adjustment (M8-specific): verify origin/main has the M8 move commit
> `89975407` + the M8 bookkeeping commit (this docs commit) on top of it
> (`git log --oneline -2 origin/main`), AND production == origin/main
> HEAD (the deploy-lock: expect currena-api `ef5eaeeb` @ 100%).**

## Current state (after the M8 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · Phase 3.2 (M4: the world-markets domain) · Phase 3.3 (M5:
  the australia domain) · Phase 3.4 (M6: the commodities domain) ·
  Phase 3.5 (M7′: the currencies domain, the re-do) · **Phase 3.6 (M8:
  the gold domain, this session)** all DELIVERED. Phase 3 continues
  biggest-first: asia-pacific (M9) is next.
- **origin/main is GREEN** — 9/9 gates at `89975407` (the move), suite
  15,298 (IDENTICAL to the M7′ close — ZERO delta), working tree clean.
- **Production is CURRENT** — currena-api `ef5eaeeb` @ 100% (deployed
  2026-11-16T04:45:36Z, deployment `df34a516`), the exact origin/main
  deployed surface: the M8 local build matches the LIVE surface on ALL
  80 chunks (sha256 for sha256, MATCH 80 · DIFFERS 0). The entry chunk
  re-hashed `index-Dja1XSz5` → `index-CkKkl2hB` (the App.tsx lazy-path
  string — the M6/M7′ precedent) with the pure filename ripple on 17
  entry-referencing chunks; the gold-relevant chunks hash-UNCHANGED
  (`GoldPage-CMenZk4O`, `signals-Bu_Nyh5-` (engine signals.ts),
  `signals-BzpTDyje` (shared/config/signals.ts), `outlook-core-BSU_HUvM`
  (N5, not moving)). **Production == origin/main HEAD.**

## The green baseline — the M8 close record (2026-11-16)

Baseline (the M7′ close, before the move) and final (after the move
`89975407`) runs of `pnpm gates` — **identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1089 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean after 1 re-key (hardcoded.* id+source — BalanceScale's fa list-joiner "، "; text+hash unchanged, the round-77 basis preserved) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — IDENTICAL to the M7′ close |
| 9 | build + bundle budget | PASS | entry 273.95/82.95 · ZERO chunk topology delta in logic (GoldPage-* + both signals-* + outlook-core-* basenames hash-UNCHANGED; the entry re-hashed index-Dja1XSz5 → index-CkKkl2hB for the App.tsx lazy-path string — the M6/M7′ precedent) |

**Environment note (unchanged from M3→M8):** this sandbox's `skills/`
folder sits at the PARENT of the Currena repo (not inside it) — no
parking needed. If a future sandbox injects `skills/` INSIDE the repo
root, park it outside during gates runs (BD-M3 D4), never commit it.

## The M8 session record (what was done)

1. **STEP 0 (the adjusted checks, all green before anything moved):**
   the GitHub token verified FIRST (HTTP 200 on /user, full `repo`
   scope — the push works); the repo re-cloned (fresh sandbox —
   `/home/z/currena` did not exist); pnpm 10.34.5 installed via
   npm-global; `pnpm install --frozen-lockfile` clean; origin/main
   verified at `87884724` (the M7′ bookkeeping close — fd981e3e's move
   + 87884724 on top, exactly the adjusted check; 41 renames in
   fd981e3e confirmed); the deploy-lock verified via the versions +
   deployments APIs (currena-api `ea4127ba` @ 100%, deployment
   `d58efc6b` 2026-11-16T02:45:46Z, nothing newer — production ==
   origin/main HEAD as claimed); the baseline `pnpm gates` 9/9, suite
   15,298, 2m 40s — the M7′ close numbers exactly.
2. **The audit verification:** Phase 3 item 6 (gold) + Deliverable 1's
   gold rows + the N-map (N5/N16) + risks R4/R5/R8/R9 + the skeleton
   read in full; the inventory verified against the actual tree —
   **22 web + 19 engine, exactly 41 source files** (the audit's
   "(+1 tests)" counts cross-adapter tests — sge-monthly.test is the
   only co-located adapter test, the frankfurter lesson) **plus the
   co-located vitest snapshot**
   (`signals/__snapshots__/gold-balance-lanes.test.tsx.snap`) which the
   audit's source-file counts don't include — 42 git-mv moves, 41
   source files. pd-s5 verified FIRST as the gold script (the pd-s18
   lesson): its repo import is
   `../src/routes/page-division/gold-backtest-core` — in the move set.
3. **The pre-gates grep set (all three variants + the R8 fs-path
   forms), executed BEFORE the move:** variant #1 = App.tsx:59 (the
   ONLY gold lazy route); variant #2 (inline TYPE
   `import('...').X` pointing at moved files) verified ABSENT (the
   only inline-type imports in scope are frozen `@currena/core`
   package refs); variant #3 (CONSUMER dynamic import of a MOVED gold
   file) verified ABSENT; the ?raw CONSUMER set (round2.test.ts, 5
   static `?raw` imports) is regex-covered (query + explicit extension
   preserved); the ONLY fs-path form in the moved set =
   gold-balance.test.ts:483 `new URL('../fixtures/…',
   import.meta.url)` — manual edit, depth 1→3 computed via
   path.relative. ZERO mid-phase red gates runs — the FIRST post-move
   `pnpm gates` was 9/9 GREEN (2m 42s, suite 15,298 IDENTICAL).
4. **The move (commit `89975407`, ONE commit for web+engine per the
   audit's Phase 3 rule):** the codemod
   `scripts/m8-gold-codemod.mjs` (persisted in-repo per the M2→M8
   method) — 42 git-mv moves, 109 specifiers re-anchored
   bidirectionally (existence-checked candidates, computed depths,
   specifier styles preserved), 3 manual edits. Dry-run reviewed edge
   by edge before apply. Broken-path grep after apply: ZERO old-path
   references remain anywhere in code.
5. **The exports map:** `./gf-p0-proposed` → `./src/domains/gold/
   gf-p0-proposed.ts` (the ONE gold entry — the audit's Phase 3 item 6
   row didn't list it; the M8 prompt's "if gold has entries" resolved
   YES; entry NAMES frozen — R4; consumers ride the frozen name, ZERO
   consumer edits, proven by typecheck).
6. **Cross-domain edges (documented, allowed):** **N16** —
   shared/validation.ts imports signals.ts → re-anchored to
   `../domains/gold/signals` (the documented shared→gold edge; the
   M7′ N17 pattern); **N5** — verdict.tsx → shared/components/
   outlook-core depth-invariant NO-OP (both old components/insights/
   signals/ and new features/gold/signals/ at src depth 3; target in
   shared/, a direct child of src/); **R13** legacy borrowers
   re-anchored (together-signals.test → BalanceScale;
   round2.test.ts ?raw ×5; pd-s5-backtest.ts; the engine gf-*/gold-*
   scripts ×13; the engine barrel's 8 gold re-exports;
   ingest/run.ts → real-yield-fill; shared/adapters/{index,rung2} →
   the gold adapters; eia-cftc.test.ts → cftc).
7. **Persian-copy manifest: 1 re-key** — BalanceScale's fa list-joiner
   "، " (hardcoded.* id+source, BD-M5 D5; text+hash unchanged, the
   round-77 basis preserved, the entry-642 re-key-note pattern).
   copy:audit clean after (exit 0; the queued review debt unchanged).
8. **Regenerated + reviewed:** `registry:generate` +
   `placement:generate` + `s24:d9-audit` — **ZERO drift**
   (data/ + PLACEMENT.generated.md byte-identical; D-9 CONDITION MET).
9. **The chunk-merger watch (BD-M5 D3):** the baseline topology
   recorded BEFORE the move (80 chunks; gold-relevant: GoldPage-*
   + both signals-* + outlook-core-*). Post-move: still 80 chunks,
   NO merger fired, all basenames UNCHANGED (R5 — no renames); 18
   re-hashed chunks = the entry (index-Dja1XSz5 → index-CkKkl2hB, the
   App.tsx lazy-path string) + a 17-chunk filename ripple. Proven by
   the full 18-name substitution rebasing test: 16/17 ripple chunks
   byte-identical after substituting the changed filenames; the
   Insights chunk differs by exactly ONE import-statement order swap
   (the tic side-effect import moved after the StatusChip import) and
   the entry by an assets-list order shift + a 34↔33 index renumbering
   — same import sets, pure graph-traversal ordering artifacts, ZERO
   logic delta. Every gold-relevant chunk hash-UNCHANGED.
10. **Post-phase deploy + live verify (the deploy-lock held):**
    deploy-lock re-checked FIRST (still `ea4127ba` @ 100%, deployment
    `d58efc6b`, no parallel deploy) → build + `wrangler deploy` →
    **currena-api `ef5eaeeb` @ 100%** (deployment `df34a516`,
    2026-11-16T04:45:36Z; Monday — the §21 Tuesday portwatch window
    N/A). Smoke: /api/health ok (kv ok) · / 200 · /gold 200 ·
    /api/insights/pages/gold 200 (48 readings; the licence-hidden
    quartet rides absentIds: wgc-etf-holdings, wgc-cb-demand,
    official-gold-demand, etf-short-interest — the §16 notes, never
    cards). **pd-s5 run LIVE against production (the §21 gold gate,
    seat-level diff): 150 checks · 150 green · 0 red — ALL CHECKS
    GREEN**, including the moved-domain adapters (sge-gold-withdrawals,
    swiss-gold-flow, shanghai-gold-premium) byte-identical page ≡
    engine. **The all-80-chunk byte-compare production-vs-M8-build:
    MATCH 80 · DIFFERS 0.**

## Where the gold domain now lives (the Phase 3.6 map)

- **web `apps/web/src/features/gold/`** — 22 source files: the 13
  page-tier files FLAT (GoldPage + test, GoldHero, GoldSeats,
  GoldPositions, GoldBalanceClassic, GoldContext, gold-tiles + test,
  gold-backtest-core + gold-backtest.test + gold-copy-pin.test +
  gold-frozen-scenarios.test) + Signals.tsx + outlook.test.ts FLAT
  (parent-level files, the M7′ fx-presentation.ts barrel precedent) +
  the 7-file `signals/` named cluster preserved as
  `features/gold/signals/` (BalanceScale, BalanceWeight, MergedCard,
  balance.test, gold-balance-lanes.test, icons, verdict — BD-M5 D1)
  + the co-located `__snapshots__/` snapshot.
- **engine `packages/insights/src/domains/gold/`** — 19 source files:
  the 13-file domain-root set FLAT (gold-balance + test,
  gold-backtest-core + test, gold-lane-calibration.test (no own .ts),
  breakeven-tilt + test, real-yield-fill + test, gf-p0-proposed +
  test, signals + test — gold has NO board job, so no subfolder, the
  M8 prompt's list) + `adapters/` flat, NO subfolder, NO barrel (cftc,
  sge, sge-monthly + sge-monthly.test (the ONLY co-located adapter
  test), bazg, gold-equities — the M6/M7′ convention).
- **Stays shared (by constraint, NOT moving):** engine
  `shared/gold-score.ts` (D1 — the 37 voters span 5 domains) + web
  `shared/components/outlook-core.ts` (N5 — cross-domain gold+global,
  Phase 2).
- **The exports map:** `./gf-p0-proposed` →
  `./src/domains/gold/gf-p0-proposed.ts` (entry NAME frozen — R4).

## Operational notes worth carrying (M8 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The dynamic-import() regex gap is THREE variants (BD-M7, the
  standing pre-gates discipline):** (1) the dynamic CALL
  `import('...')` (App.tsx lazy routes); (2) the inline TYPE
  `import('...').X`; (3) the CONSUMER dynamic `await import('...')` of
  a MOVED file. M8 ran the full set BEFORE the move: variant #1 had
  ONE site (App.tsx:59), #2 and #3 were verified ABSENT in the gold
  set — ZERO mid-phase red gates runs (the discipline works; the
  M7′/M8 streak now stands).
- **The R8 rule (standing):** grep for ALL fs-path forms per moved
  TEST (new URL, join(__dirname/HERE/here), readFileSync(join()),
  fileURLToPath) BEFORE the gates run. M8 had ONE (gold-balance.test,
  the new URL form — the first new-URL case; the cofer join(here)
  case was M7′'s).
- **The count verification (standing):** the audit's per-domain counts
  are approximate — verify the inventory against the actual tree
  before the move (M7′: 41 not 42; M8: 42 git-mv = 41 source + 1
  vitest snapshot; the "(+1 tests)" notation counts cross-adapter
  tests).
- **The stranded-push lesson (M7′, still standing):** verify the push
  works (STEP 0 token check, HTTP 200 on /user) BEFORE starting any
  phase; verify the push LANDED (ls-remote == rev-parse) after it.
- **The deploy lock + account check before every deploy** (D-43); the
  KV write cap (1,000/day); the GHA schedule-delay quirk
  (workflow_dispatch); the D-9 audit as a standing gate; never run the
  §21 portwatch leg Tuesdays 11:00–14:00 UTC.
- **The rebasing proof (M8 addition):** the chunk-merger watch closes
  with the full substitution test — revert every changed chunk
  filename in the new build's chunks and compare sha256 against the
  baseline (production serves the previous surface's bytes if the old
  chunks are needed). Ordering-only residues (import-order swaps,
  index renumbering) are zero-logic-delta artifacts of the graph
  traversal — record them honestly, never silently absorb them.

## Owner-side levers waiting

1. **Ratify BD-M8** (this session's records: the 41+1 inventory
   verification; the signals/ named-cluster + parent-level-flat
   landing; the ONE gold exports-map entry ./gf-p0-proposed the
   audit's row missed; the N16 re-anchor; the 1 Persian-copy re-key;
   the chunk watch with the Insights/entry ordering residues; the
   80/80 byte-compare + the pd-s5 150/150 live gate).
2. **Ratify BD-M7′** (the M7′ records — still waiting) + the carried
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
   this session's worked; the sedanama-ir Cloudflare Workers token;
   the EODHD token — all used this session, never stored in the repo).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (BD-S19c); non-JS crawlers see
  the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8) ·
  **pd-s14 (Asia 14 — M9's; the audit's P3.7 row notation says pd-s12
  which is WRONG, pd-s12 is Europe's — the pd-s18/pd-s5 lesson:
  VERIFY the script's actual imports before trusting any notation)** ·
  pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18 (Currencies
  53) — all re-runnable against production from apps/web/scripts/
  (pass `--base https://currena.ir`). **pd-s18 (M7′'s) and pd-s5
  (M8's) are DONE — their imports re-anchored by their sessions'
  codemods and verified LIVE (pd-s5: 150/150 green against
  production).**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The bundle topology post-M8: one entry re-hash + filename ripple +
  two ordering residues, zero logic delta** — the entry
  `index-Dja1XSz5` → `index-CkKkl2hB` (the App.tsx lazy-path string)
  with the ripple on the 17 entry-referencing chunks (Calculator,
  About, Splitter, Settle, Receipt, Converter, BatchConverter, History,
  PagePlaceholder, Insights, UsaPage, WorldMarketsPage,
  DataExportPanel, full-export, index.es, jspdf.es.min, AlertsDialog);
  16/17 byte-identical after the filename substitution; the Insights
  chunk carries one import-order swap (the tic side-effect import) and
  the entry an assets-list order shift + a 34↔33 index renumbering —
  same sets, zero logic delta; the gold-relevant chunks
  (`GoldPage-CMenZk4O`, `signals-Bu_Nyh5-`, `signals-BzpTDyje`) and
  `outlook-core-BSU_HUvM` hash-UNCHANGED; the 80-chunk count
  unchanged. Phase 3's remaining moves (M9+) keep the same basename
  discipline.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix).
- The pure-comment path references are Phase 7's light header pass;
  M8's move added none beyond the existing set (the moved files'
  headers already say what each file is).
- The `m3-live-verify.cjs` file-level eslint-disable (BD-M4 D0 /
  chore `99ba8c38`) is the established pattern for any future cjs
  node script — do NOT extend the eslint scope for one file.
- **The stranded-M7 historical note:** the original M7's commit hashes
  (723907e + a0a4b34) NEVER existed on origin/main — the M7′
  equivalents are `fd981e3e` + `87884724`. The stranded production
  version `c2ff9bf4` served 2026-11-15T23:17Z → 2026-11-16T02:45Z;
  `ea4127ba` (the M7′ deploy) served 02:45Z → 04:45Z; `ef5eaeeb` (the
  M8 deploy) serves from 2026-11-16T04:45:36Z.

---

## The M9 next-session prompt (modularization Phase 3.7 — asia-pacific)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M9 — modularization Phase 3.7: the asia-pacific domain (the
seventh Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 7 +
Deliverable 1's asia-pacific rows (9 web files + 4 adapters (3 +
test)) + the N1–N18 cross-domain map + risks R4/R5/R8/R9) →
docs/HANDOFF.md (the M8 version — this file) → CHANGELOG [2026-11-16]
M8 → docs/DECISIONS.md BD-M8.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′): a
   session that delivers but cannot push leaves production AHEAD of
   origin/main and silently breaks the deploy-lock. If the token is
   invalid: STOP, tell the owner, do NOT start.
2. Verify origin/main has the M8 move commit 89975407 + the M8
   bookkeeping commit on top of it, AND production == origin/main HEAD
   (the deploy-lock: expect currena-api ef5eaeeb @ 100%).
3. Run `pnpm gates` once and record the numbers (the M8 close: 9/9,
   suite 15,298, IDENTICAL to the M7′ close — ZERO delta). If the
   baseline is red, STOP and report — never start a phase on a red
   baseline. ENVIRONMENT NOTE: this sandbox's `skills/` folder sits at
   the PARENT of the Currena repo (not inside it) — no parking needed.
   If a future sandbox injects `skills/` INSIDE the repo root, park it
   outside during gates runs (BD-M3 D4), never commit it.

The phase (audit §"Phase 3" item 7 — asia-pacific: 9 web files + 4
adapters (3 + test)):
- VERIFY the exact file inventory against the actual tree BEFORE the
  move (the M7′/M8 lesson: the audit's counts are approximate — grep +
  ls everything; the "(+1 tests)" notation counts cross-adapter tests).
- Web side → apps/web/src/features/asia-pacific/: the AsiaPage tier
  per the audit's Deliverable 1 asia rows — page files FLAT (the
  BD-M4 D1 convention), named clusters preserved (BD-M5 D1).
- Engine side → packages/insights/src/domains/asia-pacific/: the
  adapters flat under adapters/ (the M6/M8 convention) — verify which
  of the remaining src/adapters files are asia's (imf-cpi? nbs? ecb?
  boe? mof?) against the audit rows + the tree; the N13 shared
  adapters stay shared (fred/yahoo/worldbank/goldapi etc.).
- pd-s14 is the asia backtest script (VERIFY its actual imports before
  the move — the pd-s18/pd-s5 lesson; NOTE the audit's P3.7 row
  notation says pd-s12 — that is Europe's; the Known-state list says
  pd-s14 (Asia 14); trust only the verified imports).
- The pre-gates grep set (the BD-M7 sharpened three-variant
  dynamic-import discipline + the R8 fs-path forms), executed BEFORE
  the move: grep per moved file for ?raw + new URL(spec,
  import.meta.url) + join(__dirname/HERE/here) + readFileSync(join())
  + fileURLToPath AND across ALL consumers for dynamic import(' with
  relative specs pointing at moved files (all THREE variants).
- The codemod method (scripts/m8-gold-codemod.mjs is the persisted
  pattern): moves table → bidirectional re-anchoring → manual edits
  computed, never counted. Dry-run first, review every edge, then
  apply. Broken-path grep after apply.
- NO renames (R5). Tests move WITH their subjects + their snapshots
  (R6). Persian-copy manifest re-keys per BD-M5 D5 (run copy:audit,
  re-key REMOVED+NEW pairs — never text/sha — then copy:audit clean).
  CHUNK-MERGER WATCH: record the baseline dist topology before the
  move; close with the full substitution rebasing test (the M8
  addition) — ordering-only residues are recorded, never absorbed.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green + pushed (verify the push!);
the exports map (if asia has entries) + all path references updated
in the same commits as their moves; production == origin/main HEAD
after the post-phase deploy (deploy-lock re-check FIRST — D-43; the
§21 Tuesday portwatch window 11:00–14:00 UTC). Bookkeeping per
AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS) and the M10
(europe) pointer (Phase 3.8: 8 web files + 2 adapters (3 with test) —
verify the inventory; pd-s12 is Europe's script).
```
