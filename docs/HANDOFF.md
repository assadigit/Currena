# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M3 (2026-11-15) — DELIVERED: modularization Phase 3.1 (usa, the
> first domain move) is done — 34 files moved (15 web into
> `apps/web/src/features/usa/` + 19 engine into
> `packages/insights/src/domains/usa/`), 77 import specifiers
> re-anchored, gates 9/9 with the suite EXACTLY 15,298, ONE green
> commit pushed (`d200d537`); production deployed post-phase
> (`30d1d7f6` @ 100%) and live-verified — the first domain folder is
> real and the /usa page + the TIC board + the 7 usa adapters now live
> in domain-owned trees with ZERO runtime delta (chunk-level
> pre/post proof, below).**

> **The NEXT session is M4** — modularization Phase 3.2
> (world-markets, ~39 files), prompt at the bottom of this file.

## Current state (after the M3 session)

- **Program:** modularization — Phase 0 (M0) · Phase 1 (M1: the
  skeleton) · Phase 2 (M2: the shared layer) · **Phase 3.1 (M3: the
  usa domain, this session)** all DELIVERED. Phase 3 continues
  biggest-first: world-markets (M4) is next.
- **origin/main is GREEN** — 9/9 gates at `d200d537`, suite 15,298,
  working tree clean.
- **Production is CURRENT** — currena-api `30d1d7f6` @ 100% (deployed
  2026-11-15T16:19Z), the exact origin/main tree; entry + UsaPage
  chunks byte-identical local-vs-live (sha256 verified).

## The green baseline — the M3 close record (2026-11-15)

Baseline (before the phase) and final (after) runs of `pnpm gates` —
**identical numbers**:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1083/1084 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks (3 prep + 7 section fixtures) |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) |
| 9 | build + bundle budget | PASS | entry 273.96/82.96 · all 12 route rows match the baseline shapes |

**Environment note (the M3 discovery):** this sandbox injected a
`skills/` folder (untracked, NOT part of the Currena repo) whose 479
lint errors (all inside it) trip the lint gate. It is parked OUTSIDE
the repo root during every gates run (`mv skills /home/z/skills-parked`
… `mv` back) and never committed — the repo's own code is 0-error.
Recorded in BD-M3 D4; the M4+ sessions should expect the same.

## The M3 session record (what was done)

1. **Baseline first:** `pnpm gates` — 9/9, suite 15,298, the M2 close
   numbers exactly (after the skills/ parking dance above).
2. **Deploy-lock check (the sedanama-ir account verified: currena-api
   + currena-markets + the currena.ir zone):** production at
   `0592c24f` @ 100% == the M2 close == origin/main → the prompt's own
   condition fired: **NO pre-phase deploy** — production already
   matched main.
3. **The move (commit `d200d537`, ONE commit for web+engine per the
   audit's Phase 3 rule):** the 15 web usa files → `features/usa/`
   (UsaPage, UsaTierCards, UsaTicSection, UsaVerdictStrip, TicSection
   + test, usa-tiles, usa-backtest-core + test, usa-tic-copy,
   copy-pin/tiles tests, lib/tic + test); the 19 engine files →
   `domains/usa/` (tic/ — compute/job/model/parse/store + tic.test —
   and the 7 adapters treasury, auctions, credit, rstar, cleveland,
   sp500-breadth, uom + tests). Same-commit machinery: the exports-map
   `./tic` target → `./src/domains/usa/tic/index.ts` (entry NAME
   unchanged — apps/api + apps/markets needed ZERO edits, R4 held);
   the pd-s9/pd-s10 script imports re-anchored; pd-s4 verified as
   needing no edit; App.tsx lazy route; the 5 sibling domains'
   backtest-cores + legacy world-feeds re-anchored (the N1/N9 edges);
   4 engine scripts re-anchored.
4. **The codemod (`scripts/m3-usa-codemod.mjs`, persisted in-repo):**
   33 git-mv moves, 77 specifiers re-anchored bidirectionally (edges
   whose importer moved, edges whose target moved; specifier styles
   preserved), fixture depths COMPUTED via path.relative. **One R8
   near-miss the suite caught:** the first-draft fixture depths were
   hand-counted 3-up where 4 are needed — fixed at the cause (the
   codemod now computes depths; recorded in BD-M3 D2). Pre-gates
   greps: zero `?raw` imports; the Persian-copy manifest has ZERO
   moved-path references (no re-triage this phase).
5. **Regenerated + reviewed:** registry:generate + placement:generate
   + s24:d9-audit — **ZERO drift** (indicators.json,
   indicator-audit.json, site-mode-overrides.json,
   PLACEMENT.generated.md all byte-identical; D-9 CONDITION MET).
6. **Post-phase deploy + live verify:** deploy-lock re-checked (still
   `0592c24f`) → **currena-api `30d1d7f6` @ 100%**. Smoke: /api/health
   ok · / 200 · /api/insights 183 readings · /api/insights/tic 21
   holders @ 2026-08 · /usa 200. Browser matrix
   (`scripts/m3-live-verify.cjs`, persisted): **ALL LEGS PASS, zero
   console errors** — /usa EN + FA/RTL + 390 px mobile (verdict strip
   + TIC section) + the legacy /insights (data header; the deep TIC
   section is collapsed-by-default per R7b — the script's first
   expectation was wrong and was corrected at the cause).
   **Runtime-identity proof (stronger than M2's):** entry
   `index-DOan26Zs.js` + UsaPage chunk byte-identical local-vs-live;
   a pre-M3 comparison build (worktree at `6ffcc81b`) shows the
   legacy insights mega chunk sha-IDENTICAL pre/post (the TicSection
   chain untouched), the UsaPage chunk same size with only its 2
   dependency hash-strings changed (pure re-hash), and the 93-chunk
   count identical. Evidence: `docs/assets/m3-usa-{en,fa-rtl,mobile}-
   2026-11-15.png`.

## Where the usa domain now lives (the Phase 3.1 map)

- **web `apps/web/src/features/usa/`** — 15 files: UsaPage (+ test),
  UsaTierCards, UsaTicSection, UsaVerdictStrip, TicSection (+ test),
  usa-tiles (+ test), usa-backtest-core (+ test), usa-tic-copy,
  copy-pin test, tic.ts (+ test — the former lib/tic client).
- **engine `packages/insights/src/domains/usa/`** — `tic/` (6 + the
  test = 7) + `adapters/` (7 adapters + 5 tests = 12).
- **Cross-tree edges (documented, allowed):** the 5 sibling
  backtest-cores import `features/usa/usa-backtest-core` (N1 — it is
  the universal harness, name kept); `features/usa/usa-tiles` imports
  `routes/page-division/global-tiles` (N2 — temporary until global
  moves in M12); legacy `world-feeds` imports `features/usa/tic` +
  `features/usa/TicSection` (N9 — domain owns, legacy borrows);
  engine `narrator/section-state` imports `domains/usa/tic` (N14).
- `TicCustodyCard` stays in `components/insights/` (legacy-only per
  the inventory; it is M13's, with a usa-content note for §19.6).

## Operational notes worth carrying (M3 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (still true).
- **The R8 rule, now sharper: COMPUTE fixture depths, never edit
  counts** — the M3 codemod's first draft hand-wrote 3-up where 4
  were needed and only the full suite caught it. The persisted
  codemod renders `join(here, …)` from `path.relative`; the M4+
  codemods must copy that form (`scripts/m3-usa-codemod.mjs` §5).
- **The codemod (persisted, reusable pattern):** moves table →
  bidirectional re-anchoring (importer-moved AND target-moved edges;
  existence-checked candidate resolution; specifier styles preserved;
  Vite `?raw` queries split and re-appended) → manual fs/URL edits
  computed, not counted. Dry-run first (`--dry`), then apply.
- **Domain moves are ONE commit (web+engine together)** — unlike M2's
  two-commit split (BD-M3 D1); M4+ follow the one-commit pattern.
- **The sandbox `skills/` folder is lint-gate noise:** park it outside
  during gates runs; never commit it; do NOT extend eslint ignores
  for it (BD-M3 D4).
- **A wrong live-verify expectation is a finding about the EXPECTATION
  too:** the /insights deep-TIC check failed because the legacy lane
  is collapsed-by-default (R7b), not because of the move — the
  pre/post chunk-sha comparison proved it, and the script was
  corrected at the cause.
- The deploy lock + account check before every deploy (the D-43
  lesson, unchanged); the KV write cap (1,000/day, REST exhausts
  ~18:30–19:00 UTC); the GHA schedule-delay quirk (~7–9 h, use
  `workflow_dispatch`); the D-9 audit as a standing gate; never run
  the §21 portwatch leg Tuesdays 11:00–14:00 UTC.

## Owner-side levers waiting

1. **Ratify BD-M3** (this session's records: the one-commit domain
   pattern, the R8 computed-depth fix, the skipped pre-phase deploy,
   the skills/ handling).
2. Ratify BD-M2 + BD-M1-r + BD-BR + the BD-S3…BD-S31 set (carried).
3. Arrange the external investor's review of the spec (§19 — the
   seven questions); S23's deferred feedback-build scope follows it.
4. The §19.6 retirement timing answer (retire the legacy /insights
   now or after burn-in) — Gate 0 of `06-LEGACY-RETIREMENT-S24.md` §7.
5. Ratify the `/converter` relocation (S1) + AF-3
   (michigan-1y-expectations → USA tier-3).
6. Triage the queued unreviewed fa strings (1,258 queued — unchanged).
7. **Revoke or rotate the session credentials** (the GitHub token +
   the sedanama-ir Cloudflare token both worked; rotate per the
   owner's schedule): credentials used, never stored in the repo.

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (BD-S19c); non-JS crawlers see
  the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8)
  · pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities
  24) · pd-s18 (Currencies 53) — all re-runnable against production
  from apps/web/scripts/ (pass `--base https://currena.ir`). **The
  pd-s9/s10 usa imports were M3's first task and are DONE; pd-s4
  needed no edit. The pd-s7/s21 world-markets imports are M4's.**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- The /world-markets treemap (TM1–TM4): LIVE (verified on the M2
  deploy; M4 moves its files — the geoOutPath same-commit rule
  applies).
- **The bundle topology post-M3: zero logic delta** — the UsaPage
  chunk re-hashed only through its dependency references; the 93-chunk
  count and every budget row are unchanged. Phase 3's remaining moves
  (M4+) keep the same basename discipline.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix).
- The two pure-comment path references (UsGlobalReachGroup +
  DollarStrength — "src/shared/gauges.ts" in comments) are still
  Phase 7's light header pass; M4's world-markets move may add a few
  more (record them, don't fix them out of scope).

---

## The M4 next-session prompt (modularization Phase 3.2 — world-markets)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M4 — modularization Phase 3.2: the world-markets domain (the
second Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 2
world-markets + Deliverable 1's world-markets rows + the N1–N18
cross-domain map + risks R4/R5/R8/R9/R11) → docs/HANDOFF.md →
CHANGELOG [2026-11-15] M3 → docs/DECISIONS.md BD-M3.

FIRST, before touching anything: run `pnpm gates` once and record the
numbers (the M3 close: 9/9, suite 15,298). If the baseline is red,
STOP and report — never start a phase on a red baseline. ENVIRONMENT
NOTE: this sandbox injects a `skills/` folder whose 479 lint errors
trip gate 3 — park it outside the repo during gates runs
(BD-M3 D4), never commit it.

IF the owner's kickoff includes the Currena Cloudflare deploy token
(the sedanama-ir account): re-check the deploy-lock first per
docs/DEPLOY.md — production should be at 30d1d7f6 @ 100% (the M3
close). If it is, NO deploy is needed before the phase (production ==
origin/main); only deploy after the phase if the gates are green.
If no token: skip this paragraph, note it in the handoff.

The phase (audit §"Phase 3" item 2 — world-markets: 31 web files
(incl. the 17-file components/insights/world-markets/ subfolder +
world-map-geo.json) + engine markets/ (8) ≈ 39 files total):
- Web side: the world-markets inventory rows into
  apps/web/src/features/world-markets/ (WorldMarketsPage, Hero, Grids,
  Briefing, the world-markets/ component subfolder, MarketsChart per
  BD-M1-r D3, session, briefing, tiles/backtest-core/copy-pin tests)
  per the audit's Deliverable 1 "world-markets" rows.
- Engine side: markets/ (the whole board job) into
  packages/insights/src/domains/world-markets/.
- The exports-map targets for ./markets + ./markets/definitions update
  in the SAME commit (entry NAMEs unchanged).
- build-world-map.mjs geoOutPath updates in the same commit (R11) —
  world-map-geo.json moves WITH the folder; WorldMap.tsx/zoom.test.ts
  ./world-map-geo.json imports move unchanged.
- The pd-s7 + pd-s21 backtest script imports (apps/web/scripts/)
  update in the same commit.
- The import rewrites via the M3 codemod method (scripts/
  m3-usa-codemod.mjs is the persisted pattern: bidirectional
  re-anchoring, existence-checked candidates, COMPUTED fs/URL depths —
  never hand-count ../; grep for ?raw query imports + fs/URL path
  strings per moved file BEFORE the gates run).
- world-markets/shared.tsx has 22 importers across 4 region pages +
  GlobalBoard + legacy (N3) — they still point at the wm folder after
  the move (allowed, relative rewrites only); verdict-core/WorldMap/
  world-map-config/world-map-rows are the N4 cluster (wm + global +
  regions); MarketsChart goes to features/world-markets per BD-M1-r
  D3 (the M2 session deliberately left it).
- NO renames anywhere (the bundle-budget gate matches route-module
  basenames). Tests move WITH their subjects.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green; the exports map + all path
references updated in the same commits as their moves. Bookkeeping
per AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS) and the
M5 pointer (Phase 3.3 — australia: 14 web files + engine markets-au/
(8) + 3 adapters, the ./markets-au(+/definitions) exports entries,
the pd-s16 script, the AsiaNzx50Card asia→australia edge per N11).
```
