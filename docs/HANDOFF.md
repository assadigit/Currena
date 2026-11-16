# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M7′ (2026-11-16) — DELIVERED: modularization Phase 3.5 (currencies,
> the fifth domain move) — THE RE-DO — is done. The original M7 session
> delivered this move but its GitHub push FAILED (invalid token, HTTP
> 401): the M7 commits (723907e + a0a4b34) existed only on that
> sandbox's local disk, which is gone. origin/main stayed at fdcdbe54
> (the M6 close) while production ran the stranded M7 surface
> (c2ff9bf4 @ 100%) — a benign divergence (zero runtime delta) but the
> modularization was NOT in git history and the deploy-lock was broken.
> This session re-did the identical move from the M6 baseline: 41
> files moved (20 web → features/currencies/ FLAT + the fx-presentation/
> named cluster preserved + display.ts + 21 engine → domains/currencies/
> fx/ (16, subfolder preserved) + basket pair at the domain root +
> adapters frankfurter/cofer/cofer.test flat), 85 import specifiers
> re-anchored by codemod + 5 manual edits (incl. the s6-nz.test.ts
> CONSUMER dynamic-import trap — the BD-M7 variant #3 lesson, caught
> BEFORE the gates run this time — ZERO mid-phase red gates runs), the
> exports-map ./fx + ./fx/definitions repointed with entry names frozen
> (ZERO consumer edits, proven by typecheck), gates 9/9 with the suite
> EXACTLY 15,298 (IDENTICAL to the M6 close — ZERO delta), ONE green
> move commit PUSHED (fd981e3e — the push that failed in M7 succeeded
> with this session's fresh token); production deployed post-phase
> (ea4127ba @ 100%) and live-verified — THE DEPLOY-LOCK RESTORED
> (production == origin/main HEAD). The decisive proof: the M7′ build
> is BYTE-IDENTICAL to the stranded M7 production surface (ALL 80
> chunks sha256-matched, before AND after the deploy) — the re-do
> reproduced the original M7 move exactly, byte for byte.**

> **The NEXT session is M8** — modularization Phase 3.6 (gold: 22 web
> files + engine gold modules (12 + tests) + 5 adapters; gold-score
> already shared since Phase 2 constraint; pd-s5 — verify), prompt at
> the bottom of this file. **STEP 0 adjustment (M7′-specific): the
> original M8 prompt checks for the stranded M7 hashes 723907e +
> a0a4b34 — those do NOT exist. Replace that check with: verify
> origin/main has the M7′ move commit fd981e3e + the M7′ bookkeeping
> commit (this docs commit — `git log --oneline -2 origin/main`),
> AND production == origin/main HEAD (the deploy-lock
> restored by M7′).**

## Current state (after the M7′ session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · Phase 3.1 (M3: the usa
  domain) · Phase 3.2 (M4: the world-markets domain) · Phase 3.3 (M5:
  the australia domain) · Phase 3.4 (M6: the commodities domain) ·
  **Phase 3.5 (M7′: the currencies domain, this session — the RE-DO of
  the stranded M7)** all DELIVERED. Phase 3 continues biggest-first:
  gold (M8) is next.
- **origin/main is GREEN** — 9/9 gates at `fd981e3e` (the move), suite
  15,298 (IDENTICAL to the M6 close — ZERO delta), working tree clean.
- **Production is CURRENT** — currena-api `ea4127ba` @ 100% (deployed
  2026-11-16T02:45:46Z), the exact origin/main deployed surface: the
  M7′ build matches the live surface on ALL 80 chunks (sha256 for
  sha256). The entry chunk `index-Dja1XSz5.js` (the App.tsx lazy-path
  string change `./routes/page-division/CurrenciesPage` →
  `./features/currencies/CurrenciesPage` — a pure path-string change,
  zero runtime behavior delta); the CurrenciesPage chunk
  `CurrenciesPage-DcLcsgUe.js` hash basename UNCHANGED from the M6
  baseline AND byte-identical local-vs-live; the currencies-relevant
  shared chunks `rules-CeObO6So` (fx-presentation/rules) + `fx-BGab1_e7`
  (the shared/lib/fx client, Phase 2) + `definitions-C9GzmEV4` (the fx
  definitions) + `fx-presentation-BGeEOVEb` (fxTrendOf, legacy) all
  hash-UNCHANGED. **The deploy-lock divergence that defined the M7
  strand is CLOSED: production == origin/main HEAD.**

## The green baseline — the M7′ close record (2026-11-16)

Baseline (the M6 close, before the move) and final (after the move
`fd981e3e`) runs of `pnpm gates` — **identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1088/1089 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean after 2 re-keys (one hardcoded.* id+source + one technical.* source-only — both the "٪" glyph, pure path moves) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — IDENTICAL to the M6 close |
| 9 | build + bundle budget | PASS | entry 273.95/82.96 · ZERO chunk topology delta in logic (CurrenciesPage-* + rules-* + fx-* basenames UNCHANGED; the entry re-hashed index-WR9bNacU → index-Dja1XSz5 for the App.tsx lazy-path string — the M6 precedent) |

**Environment note (unchanged from M3→M6):** this sandbox's `skills/`
folder sits at `/home/z/my-project/skills` (the PARENT of the Currena
repo, NOT inside it) — the M3-era lint-gate noise does NOT apply; no
parking needed. (If a future sandbox injects `skills/` INSIDE the
Currena repo root, park it outside during gates runs per BD-M3 D4;
never commit it.)

## The M7′ session record (what was done)

1. **STEP 0 (the re-do prerequisites):** the fresh GitHub token
   verified FIRST (HTTP 200 — the push that failed in M7 works); the
   repo re-cloned (fresh sandbox — `/home/z/Currena` did not exist);
   pnpm 10.34.5 installed via npm-global (the corepack symlink fails
   in this sandbox); `pnpm install --frozen-lockfile` clean; origin/main
   verified at `fdcdbe54` (the M6 bookkeeping close — the expected
   baseline, NOT moved past).
2. **Baseline first:** `pnpm gates` — **9/9 GREEN** (suite 15,298,
   layer1 11,969/11,969, 2m 43s — the M6 close numbers exactly). The
   true M7′ starting state.
3. **Deploy-lock check (the sedanama-ir account verified: currena-api
   + currena-markets + the probe workers):** production at `c2ff9bf4`
   @ 100% (deployed 2026-11-15T23:17:18Z) — **the stranded M7
   surface, AHEAD of origin/main**. The M7′ move has zero runtime
   delta, so the deployed surface stays valid → **NO pre-phase deploy**
   (the deploy comes post-phase to confirm production == the new
   origin/main HEAD, per DEPLOY.md D-43).
4. **The audit verification (STEP 2):** the audit's Phase 3 item 5 +
   Deliverable 1 currencies rows + the N1–N18 map + the skeleton tree
   read in full. The inventory verified against the actual tree:
   **41 files, not 42** — frankfurter has NO co-located test file (the
   audit's "(+1 tests)" counts the shared/adapters cross-adapter
   tests). The skeleton's `currencies/ # fx/ (the board job) +
   basket.ts + adapters` notation resolved against the M4
   domains/world-markets/markets/ precedent: **fx/ PRESERVED as
   domains/currencies/fx/** (BD-M4 D2 board-job convention; the
   exports-map ./fx entry points at its barrel); basket at the DOMAIN
   ROOT (the M7 pattern); adapters flat (the M6 convention). The
   fx-presentation/ named cluster PRESERVED as a subfolder (BD-M5 D1);
   the page files FLAT (BD-M4 D1).
5. **The pre-gates grep set (the BD-M7 sharpened three-variant
   dynamic-import discipline + the R8 fs-path forms), executed BEFORE
   the move:** caught ALL traps — s6-nz.test.ts:114 `await
   import('../../adapters/frankfurter')` (variant #3: the CONSUMER
   dynamic await import() of a MOVED file — THE M7 LESSON, the shape
   that cost the original M7 one mid-phase red gates run); App.tsx:114
   lazy route (variant #1); cofer.test.ts:23 `join(here, '..', '..',
   'fixtures')` R8 fixture depth (the join(here,...) form — 2→4
   up-levels); the 2 CurrenciesPage.test.tsx `await
   import('../../shared/lib/locale')` occurrences verified
   depth-invariant NO-OPs (untouched); variant #2 (the inline TYPE
   import('...').X) verified ABSENT in the moved set (the api's
   `import('@currena/insights/fx')` type refs ride the FROZEN
   exports-map name); NO ?raw queries; NO new URL(fs-path) fixtures.
6. **The chunk-merger watch (BD-M5 D3):** the baseline topology
   recorded BEFORE the move — `CurrenciesPage-DcLcsgUe` (route chunk)
   imports `rules-CeObO6So` (lib/fx-presentation/rules — ALREADY a
   multi-importer shared chunk: CurrenciesPage + global-tiles + the
   entry — the N8 mirror), `fx-BGab1_e7` (the shared/lib/fx client,
   Phase 2), `definitions-C9GzmEV4` (the fx definitions).
   `fx-presentation-BGeEOVEb` (fxTrendOf) + `fx-csv-BfHsO9uP` are
   LEGACY-importer chunks (Insights + full-export + fx-csv — not
   moving this phase). Because rules.ts was ALREADY split cross-route,
   co-locating it under features/currencies/fx-presentation/ did NOT
   change its sharing topology → NO M5-style merger fired. Confirmed
   post-move: all the currencies-relevant basenames UNCHANGED; the
   entry re-hashed for the lazy-path string with the pure filename
   ripple on entry-importing chunks (verified: the Calculator chunk is
   byte-identical after substituting the entry filename).
7. **The move (commit `fd981e3e`, ONE commit for web+engine per the
   audit's Phase 3 rule):** the codemod
   `scripts/m7prime-currencies-codemod.mjs` (persisted in-repo per the
   M2→M6 method) — 41 git-mv moves, 85 specifiers re-anchored
   bidirectionally, 5 manual edits (the 3 regex-gap traps above + the
   2 exports-map JSON repoints). Dry-run verified before apply. The
   pd-s18 backtest script's import re-anchored automatically. The
   cross-domain edges re-anchored: **N1** (currencies-backtest-core →
   `../usa/usa-backtest-core`, the spec shortens — the M6 lesson);
   **N8** (global-tiles + global-backtest-core →
   `../../features/currencies/fx-presentation/rules` — the
   currencies→global mirror); **N17** (shared/adapters/derived.ts →
   `../../domains/currencies/basket`); **N7** (../../shared/lib/fx
   depth-invariant NO-OP); 13 legacy-borrower edges (WorldCurrencies +
   full-export + fx-csv + the world-currencies subtree — R13).
8. **NO mid-phase red gates runs this session** — the FIRST post-move
   `pnpm gates` was **9/9 GREEN** (2m 52s, suite 15,298 IDENTICAL).
   The BD-M7 sharpened grep set caught everything BEFORE the gates run.
9. **Persian-copy manifest:** 2 re-keys (matching the original M7's
   count) — `hardcoded.apps.web.src.lib.fx-presentation.format.
   a489ae36` → the features/currencies path (id + source, BD-M5 D5);
   `technical.worldCurrencies.percentSign` source → the
   features/currencies/display.ts path (source-only). copy:audit clean
   after (exit 0; the 1258 queued review debt unchanged).
10. **Regenerated + reviewed:** `registry:generate` +
    `placement:generate` + `s24:d9-audit` — **ZERO drift**
    (indicators.json, indicator-audit.json, site-mode-overrides.json,
    PLACEMENT.generated.md byte-identical; D-9 CONDITION MET).
11. **Post-phase deploy + live verify (the deploy-lock restoration):**
    deploy-lock re-checked (still `c2ff9bf4`, no parallel deploy) →
    build + `wrangler deploy` → **currena-api `ea4127ba` @ 100%**
    (deployment `d58efc6b`, 2026-11-16T02:45:46Z; the §21 Tuesday
    portwatch window N/A — Monday). Smoke: /api/health ok (kv ok) · /
    200 · /currencies 200 · /api/insights/fx 200 (11 pairs +
    dollarMeasure + rules + summary + plain) ·
    /api/insights/pages/currencies serves the 14 currencies readings +
    1 board (the fx board) + 0 absentIds (the placement §11 contract).
    **The byte-identity proof: the M7′ local build matches the LIVE
    surface on ALL 80 chunks (MATCH 80 · DIFFERS 0) — and the same
    80/80 matched the stranded `c2ff9bf4` surface BEFORE the deploy,
    proving the re-do reproduced the original M7 move byte for byte.**

## Where the currencies domain now lives (the Phase 3.5 map)

- **web `apps/web/src/features/currencies/`** — 20 files: the 10
  page-tier files FLAT (CurrenciesPage + test, CurrenciesPairBoard,
  CurrenciesRuleLights, CurrenciesTierCards, currencies-tiles + test,
  currencies-backtest-core + test, currencies-copy-pin test) + the
  6-file `fx-presentation/` named cluster (format, headline, pairs,
  plain, rules, sentences — preserved per BD-M5 D1) +
  `fx-presentation.ts` (the barrel) + `fx-presentation.test.ts` +
  `fx-v13.test.ts` FLAT + `display.ts` (the ONLY world-currencies file
  that moved — the other 7 are insights-legacy per audit rows 164-171).
- **engine `packages/insights/src/domains/currencies/`** — 21 files:
  `fx/` the 16-file board job (subfolder + barrel preserved — the
  exports-map ./fx entry points at it); `basket.ts` +
  `basket.test.ts` at the domain root (the engine-root module); the
  adapter trio (frankfurter, cofer, cofer.test) flat under
  `adapters/` (NO subfolder, NO barrel).
- **Cross-tree edges (documented, allowed):** the **N1**
  universal-backtest edge (currencies-backtest-core →
  features/usa/usa-backtest-core, M3's — the spec SHORTENS to
  `../usa/...`); the **N8** currencies→global mirror (global-tiles +
  global-backtest-core, still in routes/page-division/ until M12,
  import `../../features/currencies/fx-presentation/rules`); the
  **N17** shared→currencies edge (shared/adapters/derived.ts →
  `../../domains/currencies/basket`); the **N7** edge
  (`../../shared/lib/fx` — the snapshot client is Phase 2 shared, NOT
  moving; depth-invariant); 13 legacy-borrower edges (WorldCurrencies
  + full-export + fx-csv + the world-currencies subtree — the "domain
  owns, legacy borrows" pattern, R13 — they re-anchor to the new
  locations now and dissolve at §19.6).
- **The exports map:** `./fx` → `./src/domains/currencies/fx/index.ts`
  + `./fx/definitions` → `./src/domains/currencies/fx/definitions.ts`
  (entry NAMES frozen — R4; apps/api + apps/markets + web import via
  the frozen names, ZERO consumer edits, proven by typecheck).

## Operational notes worth carrying (M7′ additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The dynamic-import() regex gap is THREE variants now (BD-M7):**
  (1) the dynamic CALL `import('...')` (App.tsx lazy routes);
  (2) the inline TYPE `import('...').X` (M5's rba.ts);
  (3) the CONSUMER dynamic `await import('...')` of a MOVED file (M7's
  s6-nz.test.ts — **caught BEFORE the gates run this session by the
  sharpened grep: grep ALL files for import(' with relative specs
  pointing at moved files, resolved against the OLD tree, BEFORE the
  gates run. ZERO mid-phase red gates runs in M7′ — the lesson is now
  the standing pre-gates discipline and it WORKS.**)
- **The R8 rule (standing):** grep for ALL fs-path forms per moved
  TEST (new URL, join(__dirname/HERE/here), readFileSync(join()),
  fileURLToPath) BEFORE the gates run. M7′ had ONE (cofer.test.ts, the
  join(here,...) form, 2→4 up-levels).
- **The stranded-push lesson (NEW, M7′):** a session that delivers but
  cannot push leaves production AHEAD of origin/main — a divergence
  that silently breaks the deploy-lock and erases the work from git
  history. **Verify the push works (STEP 0 token check, HTTP 200 on
  /user) BEFORE starting any phase.** If a push fails mid-session:
  stop, tell the owner, get a fresh token — do NOT continue stacking
  commits on an unpushable tree. The re-do was deterministic only
  because the move was pure reorganization; a runtime change would NOT
  have been recoverable this way.
- **The re-do proof pattern (NEW):** when re-doing a stranded session's
  work, the strongest available verification is the byte-compare
  against the stranded production surface (all-chunks sha256 match) —
  it proves the re-do == the original without ever reading the dead
  sandbox's disk. M7′: 80/80 chunks matched before AND after the
  post-phase deploy.
- **The count verification (standing):** the audit's per-domain counts
  are approximate — verify the file inventory against the actual tree
  before the move (M7′: 41 not 42; frankfurter has no test file; the
  audit's "(+1 tests)" notation counts cross-adapter tests).
- **Domain moves are ONE commit (web+engine together)** — BD-M3 D1.
- **The web folder is FLAT + named clusters PRESERVED as subfolders
  (BD-M4 D1 + BD-M5 D1); the engine board job preserves its subfolder
  (BD-M4 D2); a domain with NO board job flattens adapters (M6); a
  domain with a board job + an engine-root module lands the board job
  at domains/<domain>/<job>/, the engine-root module at
  domains/<domain>/ root, the adapters under domains/<domain>/adapters/
  (M7′ — the currencies shape).**
- **The Persian-copy manifest re-key (BD-M5 D5, standing):** re-key
  any REMOVED+NEW pair (BOTH id + source for hardcoded.* path-encoded
  entries, source-only for technical.* semantic-key entries). M7′ had
  2 (one of each form — the first session to exercise both forms).
- **The deploy lock + account check before every deploy** (D-43); the
  KV write cap (1,000/day); the GHA schedule-delay quirk
  (workflow_dispatch); the D-9 audit as a standing gate; never run the
  §21 portwatch leg Tuesdays 11:00–14:00 UTC.

## Owner-side levers waiting

1. **Ratify BD-M7′** (this session's records: the re-do decision +
   why; the 41-file inventory correction; the s6-nz CONSUMER
   dynamic-import trap caught pre-gates (ZERO mid-phase red runs — the
   BD-M7 lesson working); the exports-map repoint with frozen names;
   the 2 Persian-copy re-keys; the all-80-chunk byte-identity proof
   (the re-do == the stranded M7); the deploy-lock restored).
2. Ratify BD-M6 + BD-M5 + BD-M4 + BD-M3 + BD-M2 + BD-M1-r + BD-BR +
   the BD-S3…BD-S31 set (carried).
3. **Rotate the Cloudflare Workers token** (the SECURITY NOTE carried
   from M7: CHANGELOG.md:3041 — a PRE-EXISTING entry already on
   origin/main — references its first 10 chars in a PUBLIC repo; the
   secret-scan gate considers it clean (truncated); rotation is the
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
   this session's fresh one WORKED, unlike M7's; the sedanama-ir
   Cloudflare token; the EODHD token — all used, never stored in the
   repo).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (BD-S19c); non-JS crawlers see
  the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8)
  · pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities
  24) · pd-s18 (Currencies 53) — all re-runnable against production
  from apps/web/scripts/ (pass `--base https://currena.ir`). **The
  pd-s18 (currencies-backtest-core) imports were M7′'s and are DONE
  (the codemod re-anchored them to
  ../src/features/currencies/currencies-backtest-core); pd-s5 (gold)
  is M8's — VERIFY at M8 (the pd-s18 lesson: confirm the script's
  actual imports before trusting the audit's notation).**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- **The bundle topology post-M7′: one chunk-name delta (the entry),
  zero logic delta** — the entry chunk changed (`index-WR9bNacU` →
  `index-Dja1XSz5`, the App.tsx lazy-path string) with the pure
  filename-ripple on entry-importing chunks (Calculator, About,
  Splitter, Settle, Receipt, GlobalPage, Converter, BatchConverter,
  History, PagePlaceholder, Insights, UsaPage, WorldMarketsPage,
  DataExportPanel, full-export, index.es, jspdf — each re-hashed ONLY
  because it embeds the entry's filename; verified pure by the
  Calculator rebasing test); the CurrenciesPage chunk
  `CurrenciesPage-DcLcsgUe.js` + the currencies-relevant shared
  chunks (`rules-CeObO6So`, `fx-BGab1_e7`, `fx-presentation-BGeEOVEb`,
  `definitions-C9GzmEV4`) hash-UNCHANGED; the 80-chunk count
  unchanged. Phase 3's remaining moves (M8+) keep the same basename
  discipline.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix).
- The pure-comment path references (the "src/fx/definitions.ts"
  mentions in fx-evidence.ts's generated-evidence strings +
  shared/definitions.ts + derived.ts comments + the layer1/index.ts
  comment) are Phase 7's light header pass; M7′'s move added none
  beyond those (the moved files' headers already say what each file
  is). The one-off fx-evidence.ts script's OUTPUT doc is not
  committed — no drift.
- The `m3-live-verify.cjs` file-level eslint-disable (BD-M4 D0 /
  chore `99ba8c38`) is the established pattern for any future cjs
  node script — do NOT extend the eslint scope for one file.
- **The stranded-M7 historical note:** the original M7's commit
  hashes (723907e the move + a0a4b34 the bookkeeping) NEVER existed
  on origin/main and NEVER will — the M7′ equivalents are `fd981e3e`
  (the move) + the docs commit on top of it (the bookkeeping). The
  stranded production
  version `c2ff9bf4` served 2026-11-15T23:17Z → 2026-11-16T02:45Z
  (the M7′ deploy `ea4127ba` replaced it with the byte-identical
  surface — the divergence window is closed).

---

## The M8 next-session prompt (modularization Phase 3.6 — gold)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M8 — modularization Phase 3.6: the gold domain (the sixth
Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 6 gold +
Deliverable 1's gold rows (22 web + engine gold modules (12 + tests) +
5 adapters: cftc, sge, sge-monthly, bazg (swiss-gold-flow),
gold-equities) + the N1–N18 cross-domain map (esp. N5 signals/
outlook-core — ALREADY shared since Phase 2; N16 engine signals.ts —
gold display + shared/validation.ts reads it, the shared→gold
documented edge) + risks R4/R5/R8/R9) → docs/HANDOFF.md (the M7′
version — this file) → CHANGELOG [2026-11-16] M7′ → docs/DECISIONS.md
BD-M7′.

FIRST, before touching anything:
1. Verify the GitHub token works (HTTP 200 on
   https://api.github.com/user) — the stranded-M7 lesson (BD-M7′): a
   session that delivers but cannot push leaves production AHEAD of
   origin/main and silently breaks the deploy-lock. If the token is
   invalid: STOP, tell the owner, do NOT start.
2. Verify origin/main has the M7′ move commit fd981e3e + the M7′
   bookkeeping commit on top of it (NOT the stranded 723907e/a0a4b34 —
   those never existed on origin/main), AND production == origin/main
   HEAD (the deploy-lock restored by M7′: expect currena-api ea4127ba
   @ 100%).
3. Run `pnpm gates` once and record the numbers (the M7′ close: 9/9,
   suite 15,298, IDENTICAL to the M6 close — ZERO delta). If the
   baseline is red, STOP and report — never start a phase on a red
   baseline. ENVIRONMENT NOTE: this sandbox's `skills/` folder sits at
   the PARENT of the Currena repo (not inside it) — no parking
   needed. If a future sandbox injects `skills/` INSIDE the repo
   root, park it outside during gates runs (BD-M3 D4), never commit
   it.

The phase (audit §"Phase 3" item 6 — gold: 22 web files + engine gold
modules (12 + tests) + 5 adapters):
- VERIFY the exact file inventory against the actual tree BEFORE the
  move (the M7′ lesson: the audit's counts are approximate — M7′ was
  41 not 42; grep + ls everything).
- Web side → apps/web/src/features/gold/: the GoldPage + test + the
  gold components + signals/ handling per the audit's Deliverable 1
  gold rows — check whether signals/ is a named cluster (preserve per
  BD-M5 D1) and whether gold-score is already shared (it is — Phase 2
  constraint, it does NOT move).
- Engine side → packages/insights/src/domains/gold/: gold-balance,
  gold-backtest-core, gold-lane-calibration (test), breakeven-tilt,
  real-yield-fill, gf-p0-proposed, signals.ts + the 5 adapters (cftc,
  sge, sge-monthly, bazg, gold-equities) flat under adapters/ (the M6/
  M7′ convention). NOTE gold-score.ts → engine shared/ (the D1
  constraint — it does NOT move).
- pd-s5 is the gold backtest script (VERIFY its actual imports before
  the move — the pd-s18 lesson).
- The pre-gates grep set (the BD-M7 sharpened three-variant
  dynamic-import discipline + the R8 fs-path forms), executed BEFORE
  the move: grep per moved file for ?raw + new URL(spec,
  import.meta.url) + join(__dirname/HERE/here) + readFileSync(join())
  + fileURLToPath AND across ALL consumers for dynamic import(' with
  relative specs pointing at moved files (all THREE variants: the
  dynamic CALL, the inline TYPE import('...').X, the CONSUMER await
  import('...') of a moved file).
- The codemod method (scripts/m7prime-currencies-codemod.mjs is the
  persisted pattern): moves table → bidirectional re-anchoring →
  manual edits computed, never counted. Dry-run first.
- NO renames (R5). Tests move WITH their subjects (R6). Persian-copy
  manifest re-keys per BD-M5 D5. CHUNK-MERGER WATCH: grep the
  baseline dist for gold chunk basenames before the move (GoldPage-* +
  signals-* + the gold shared modules' basenames).
- The N5 edge (signals/outlook-core) is ALREADY shared since Phase 2
  — it does NOT move; the N16 edge (engine signals.ts →
  domains/gold/, with shared/validation.ts importing it) is the
  documented shared→gold edge to re-anchor.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green + pushed (verify the push!);
the exports map (if gold has entries) + all path references updated
in the same commits as their moves; production == origin/main HEAD
after the post-phase deploy. Bookkeeping per AGENTS.md §10 (HANDOFF
rewrite + CHANGELOG + DECISIONS) and the M9 (asia-pacific) pointer
(Phase 3.7: 9 web files + 4 adapters (3 + test)).
```
