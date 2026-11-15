# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **M2 (2026-11-15) — DELIVERED: modularization Phase 2 (the shared
> layer, the heaviest phase) is done — 156 files moved (81 web + 75
> engine), 963 import specifiers rewritten, gates 9/9 with the suite
> EXACTLY 15,298 at every run, TWO green commits pushed
> (`17764fd` web half + `73e7fe6` engine half).** Production was ALSO
> brought current (the pre-phase deploy `dcb19350` + the post-phase
> deploy `0592c24f` — the post-M2 bundle is BYTE-IDENTICAL to the
> pre-M2 one, proving the moves are pure file-system reorganization
> with zero runtime delta; live-verified on /insights + /world-markets +
> /gold + FA/RTL + 390 px mobile, zero console errors on every leg).

> **The NEXT session is M3** — modularization Phase 3.1 (usa, ~34
> files, the `./tic` exports entry, the pd-s4/s9 script imports), prompt
> at the bottom of this file.

## Current state (after the M2 session)

- **Program:** modularization — Phase 0 DELIVERED (M0), Phase 1
  DELIVERED (M1: the skeleton), **Phase 2 DELIVERED (M2: the shared
  layer, this session)**. Phase 3 (domains, biggest-first) NOT STARTED.
- **origin/main is GREEN** — 9/9 gates at `73e7fe6` (the table below),
  suite 15,298, working tree clean after the bookkeeping commit.
- **Production is CURRENT** — currena-api `0592c24f` @ 100% (deployed
  2026-11-15T14:50Z), the exact origin/main tree: BR cleanup + M1 + M2.
  The entry chunk `index-BQFfzfXD.js` is byte-identical to the local
  build (sha256 verified); the live topology is post-BR (no shared
  Signals/PricesBoard chunks in the entry's import graph).

## The green baseline — the M2 close record (2026-11-15)

`pnpm gates` = **9/9 GREEN** (2m 44s–2m 47s), run FOUR times this
session (baseline + after each half + the final tree) with IDENTICAL
numbers every time:

| # | Gate | Verdict | Detail |
|---|---|---|---|
| 1 | secret scan | PASS | clean (8 patterns · 1083 files) |
| 2 | typecheck | PASS | 6 packages (incl. insights tsconfig.scripts) |
| 3 | lint | PASS | 0 errors, 0 warnings |
| 4 | copy:audit | PASS | clean (8,006 entries — 7,773 re-sourced for the move, text/sha256 identical) |
| 5 | narrator vocabulary | PASS | in sync (193×2 + 56×2) |
| 6 | narrator eval | PASS | 50 checks |
| 7 | layer1 strict | PASS | 11,969/11,969 assertions (path now `src/shared/components/layer1/`) |
| 8 | full test suite | PASS | 15,298 (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,226) — identical at every run |
| 9 | build + bundle budget | PASS | entry 273.96/82.96 · all 12 route rows byte-identical to the M1 close |

## The M2 session record (what was done)

1. **Baseline first (the hard rule):** `pnpm gates` before touching
   anything — 9/9, suite 15,298, matching the M1 close exactly.
2. **The pre-phase production deploy (the owner's token WAS the right
   account this time):** account verified first (currena-api +
   currena-markets workers + the currena.ir zone — the sedanama-ir
   account), deploy-lock check CLEAR (production was at `6ae5606c`
   @ 100%, the unrecorded TM-era deploy the M1 session diagnosed),
   then `pnpm --filter @currena/web build` + `wrangler deploy` →
   **currena-api `dcb19350` @ 100%**, live-verified: /api/health ok,
   /api/insights 183 readings, the live entry `index-BQFfzfXD.js`
   matches the local build hash-for-hash, NO shared Signals/
   PricesBoard chunks in the entry's import graph (the post-BR shape
   IS live — production finally has the BR cleanup + M1).
3. **The web shared half (commit `17764fd`):** the audit's 81
   shared-target inventory rows moved into
   `apps/web/src/shared/{components,config,hooks,lib,i18n,ui}` —
   616 import specifiers rewritten by a codemod anchored to full
   import statements (path-relative re-anchoring; folder-style
   imports preserved; Vite `?raw` query imports in round2.test.ts
   re-anchored by hand — the codemod's one gap, 6 specs). Same-commit
   machinery: `scripts/gates.mjs` layer1 path; persian-copy SOURCES +
   the update-manifest source keys; the manifest re-triage
   (**7,773 entries re-sourced — 7,769 dictionary sources + 2
   `hardcoded.*` ids re-keyed + 2 technical sources — with
   text/sha256/round/reference untouched, `copy:audit` clean; the
   diff reviewed as the expected REMOVED+NEW pairs, recorded in
   BD-M2, never silently absorbed**); the narrator-vocabulary
   generator imports + EN_REL/FA_REL + `vocabulary.generated.json`
   regenerated in lockstep (its `source.enPath/faPath` fields ONLY —
   the vocabulary payload is unchanged, in-sync gate green);
   selfcheck.ts + ingest.ts web-i18n paths; registry-sync.test.ts's
   `join(here, …)` depth (+1, the R8 rule); generate-indicators-
   registry.ts web path strings. MarketsChart NOT moved (BD-M1-r D3:
   the inventory wins — it goes to features/world-markets in M4).
4. **The engine shared half (commit `73e7fe6`):** the audit's 75
   engine shared rows moved — the 28 shared root modules
   (definitions, gauges, gold-score, connections, scoring,
   freshness, validation, validation-step3, sources, licences,
   parsers, series, store, ruleVersion + tests + the
   gap-leg-guard/site-mode-overrides pins) into
   `packages/insights/src/shared/`, the 34 shared/infra adapters into
   `shared/adapters/` (the runner barrel with them), `shared/prices/`
   (9), `shared/ingest/` (4). 347 specifiers rewritten by the same
   codemod. **The exports-map targets updated in the SAME commit**
   (`./ingest`, `./prices`, `./store`, `./validation`, `./adapters` —
   entry NAMES unchanged; apps/api + apps/markets needed ZERO edits —
   their `@currena/insights` subpath imports resolve through the map,
   proven by typecheck). R8 depth sites: 12 hand-counted `../`
   join/URL sites re-counted mechanically (+1 level each);
   ingest/data.ts's 9 `data/*.json` import edges re-anchored by the
   codemod; local-snapshot-preview.mjs template-literal imports.
   Cross-package stragglers fixed: about-sources.test.ts's
   `sources.ts` URL read; AboutTheData.tsx's RULE_CHANGELOG_PATH
   (user-visible path text — now `packages/insights/src/shared/
   ruleVersion.ts`) + the u-tests.plw.ts expectation;
   generate-indicators-registry.ts engine path strings. **41 domain
   adapters STAY in `src/adapters/`** for the Phase 3 per-domain
   moves (the audit's plan — verified: abs/abs-au/auctions/bazg/
   bitstamp/boe/cftc/cleveland/cofer/credit/ecb/eia/eia-stocks/fng/
   frankfurter/gold-equities/imf-cpi/mof/nbs/portwatch/rba/rstar/
   sge/sge-monthly/sp500-breadth/treasury/uom + their tests).
5. **Regenerated + reviewed:** `pnpm registry:generate` — the
   data/indicators.json drift is EXACTLY the `generatedFrom` +
   `textTemplates` path-metadata strings (recorded in BD-M2, nothing
   else changed; indicator-audit.json + site-mode-overrides.json
   byte-identical); `pnpm placement:generate` — PLACEMENT.generated.md
   byte-identical (the placement contract untouched, R1 held);
   `pnpm s24:d9-audit` — D-9 CONDITION MET.
6. **The post-phase deploy + live verify:** deploy-lock re-checked
   (still `dcb19350` @ 100%, no later deploy), rebuilt + deployed →
   **currena-api `0592c24f` @ 100%**. The post-M2 build is
   BYTE-IDENTICAL to the pre-M2 one (entry sha256 verified) — the
   moves changed no runtime output. Live-verified with the browser:
   /insights (data header "Data as of Nov 15, 2026", the honest
   error-state never fires), /world-markets (verdict meter "Mixed,
   step 3 of 4" + the TM treemap's 293 SVG tiles), /gold (hero
   "US$3,888 −4.60% over 7 days, top 11% of 10 years, live prices"),
   FA/RTL + 390 px mobile on the local dist first (screenshots
   `docs/assets/m2-*.png`). Zero console errors on every leg.

## Where the shared layer now lives (the Phase 2 map)

- **web `apps/web/src/shared/`** — `components/` (29: HistoryChart,
  TrendChart, VerdictMeter, StatusChip, SectionVerdictLine, the price
  cluster (PricesBoard/PriceDetails/PriceSparkline/price-stats/
  price-trend/chart-range), GlossaryTip, outlook-core, layer1/,
  Sparkline, CurrencySelect, destinations/DestinationBody/
  PagePlaceholder/RegionIndexSection/region-zoom-backtest-core +
  tests), `config/` (15: the 10-source barrel set + 5 tests),
  `hooks/` (4), `lib/` (27: the 15 snapshot/API clients + 12 tests),
  `i18n/` (5), `ui/` (ui.tsx).
- **engine `packages/insights/src/shared/`** — the 28 root modules,
  `adapters/` (34), `prices/` (9), `ingest/` (4).
- **Everything else is where it was** — domains move in Phase 3
  (M3–M12), legacy in Phase 4 (M13), tools in Phase 5 (M14).

## Operational notes worth carrying (M2 additions in bold)

- **NEVER record "gates green" from a tests-only run** — the TM-series
  lesson (the standing note; still true).
- **Verify the LIVE production build identity, not the records** (the
  M1 lesson; this session's variant: compare the live entry chunk's
  sha256 against the local build BEFORE claiming what is deployed).
- **The codemod method for the remaining phases:** compute every
  import edge against the OLD tree, re-anchor each edge whose importer
  and/or target moves to the FINAL locations, apply exact-string
  replacements anchored to full import statements — never hand-count
  `../` depth (the R8 rule). The M2 tools live outside the repo
  (session scratch); the method is recorded here. **Known codemod
  gaps found by the full suite: Vite `?raw` query imports and
  fs/URL path strings (readFileSync/new URL/join with counted `..`) —
  grep for them per moved file BEFORE the gates run.**
- **The deploy lock + account check worked exactly as designed:**
  verify the account's workers + zones against DEPLOY.md's topology
  FIRST, check the versions API before every deploy, and re-check
  before the second deploy of a session (still ours: `dcb19350`).
- The KV write cap (CONFIRMED): the account's free-tier daily KV
  quota is 1,000 writes/day account-wide; the REST path exhausts
  ~18:30–19:00 UTC; the fresh post-midnight slice is the right window
  for MANUAL KV seeding.
- The GHA belt-and-braces schedule delay: GitHub's scheduler queue can
  delay the 04:20 UTC scheduled `insights-ingest` run by ~7–9 h; a
  `workflow_dispatch` runs immediately.
- The D-9 audit is a standing gate: `pnpm s24:d9-audit` — re-run it in
  any session that touches indicators, definitions, placement or §A
  (re-run GREEN this session after the move).
- The PortWatch runbook note: never run the §21 data audit's
  portwatch leg Tuesdays 11:00–14:00 UTC (the IMF's maintenance
  window).

## Owner-side levers waiting

1. **Ratify BD-M2** (this session's records: the two-commit split,
   the manifest re-triage diff, the generatedFrom path-metadata drift,
   the straggler fixes incl. the user-visible RULE_CHANGELOG_PATH).
2. Arrange the external investor's review of the spec (§19 — the
   seven questions); S23's deferred feedback-build scope follows it.
3. The §19.6 retirement timing answer (retire the legacy /insights
   now or after a burn-in period) — Gate 0 of
   `06-LEGACY-RETIREMENT-S24.md` §7.
4. Ratify the `/converter` relocation (S1's build-session decision).
5. Ratify AF-3: `michigan-1y-expectations` → USA tier-3.
6. Ratify or redirect the BD-S3…BD-S31 set + BD-BR + BD-M1-r + BD-M2.
7. Triage the queued unreviewed fa strings (1,258 queued — unchanged
   by the move; every entry re-verified by the clean copy:audit).
8. **Revoke or rotate the session credentials** (the GitHub token +
   the sedanama-ir Cloudflare token both worked; rotate per the
   owner's schedule when the current rounds end): credentials used,
   never stored in the repo.

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (BD-S19c); non-JS crawlers see
  the static whole-product defaults in index.html.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 57) · pd-s8 (zooms 9) ·
  pd-s9/s10 (USA 115/163 incl. the TIC sub-gate) · pd-s12 (Europe 8)
  · pd-s14 (Asia 14) · pd-s16 (Australia 28) · pd-s17 (Commodities
  24) · pd-s18 (Currencies 53) — all re-runnable against production
  from apps/web/scripts/ (pass `--base https://currena.ir`). **Only
  pd-s8 needed a rewrite this phase (region-zoom-backtest-core
  moved); the pd-s4/s9 usa imports are the M3 session's first task.**
- The parallel-session rule: launch exactly ONE session per roadmap
  slot — one prompt = one session = one slot.
- The /world-markets treemap (TM1–TM4): LIVE (verified again this
  session on the post-M2 deploy — 293 SVG tiles, zero console
  errors).
- **The bundle topology post-M2: byte-identical to post-BR** — the
  M2 moves produced zero runtime delta (the entry sha256 proves it).
  The modularization phases keep the route-module BASENAMES
  unchanged; Phase 3's App.tsx lazy-import rewrites are the next
  place chunk paths could change (they won't — the lazy chunks are
  basename-keyed and files aren't renamed).
- **Two pure-comment path references were left for Phase 7's light
  header pass** (recorded, not functional): `UsGlobalReachGroup.tsx`
  and `DollarStrength.tsx` still say "packages/insights/src/gauges.ts"
  in comments (the file lives at src/shared/gauges.ts now). Zero
  runtime impact; Phase 4 moves both files anyway.
- `scripts/local-snapshot-preview.mjs` still hardcodes the
  nonexistent absolute path `/home/z/my-project/Currena` at line 12
  (the known dev-only issue, Phase 6's opportunistic fix) — its three
  RELATIVE ingest/adapters import paths WERE updated for the move.

---

## The M3 next-session prompt (modularization Phase 3.1 — usa)

```text
Read AGENTS.md in the repo root first and follow it for the whole session.

Session M3 — modularization Phase 3.1: the usa domain (the first
Phase 3 move, biggest-first per the audit).

Read in this order: AGENTS.md (§2 · §5 · §7 · §10) →
docs/modularization/MODULARIZATION-AUDIT.md (§"Phase 3" item 1 usa +
Deliverable 1's usa rows + the N1–N11 cross-domain map + risks R4/R5/
R8/R9) → docs/HANDOFF.md → CHANGELOG [2026-11-15] M2 →
docs/DECISIONS.md BD-M2.

FIRST, before touching anything: run `pnpm gates` once and record the
numbers (the M2 close: 9/9, suite 15,298). If the baseline is red,
STOP and report — never start a phase on a red baseline.

The phase (audit §"Phase 3" item 1 — usa: 15 web files + lib/tic +
engine tic/ (7) + 7 usa adapters (12 with tests) ≈ 34 files total):
- Web side: the usa inventory rows into apps/web/src/features/usa/
  (UsaPage, UsaTierCards, TicSection, VerdictStrip, usa-tiles,
  usa-backtest-core, usa-tic-copy, TicSection.test, lib/tic, + the
  usa-tiles/copy-pin tests) per the audit's Deliverable 1 "usa" rows.
- Engine side: tic/ (the whole board job) into
  packages/insights/src/domains/usa/ + the 7 usa adapters (treasury,
  auctions, credit, rstar, cleveland, sp500-breadth, uom + tests)
  into domains/usa/adapters/.
- The exports-map target for ./tic updates in the SAME commit (entry
  NAME unchanged; packages/insights/package.json).
- The pd-s4 + pd-s9/s10 backtest script imports (apps/web/scripts/)
  update in the same commit — the HANDOFF's M2 note says they are
  this session's first task.
- The import rewrites via the M2 codemod method (HANDOFF "Operational
  notes": re-anchor edges against final locations, never hand-count
  ../; grep for ?raw query imports + fs/URL path strings per moved
  file BEFORE the gates run).
- usa-backtest-core is imported by EVERY other domain's backtest
  (they still point at the usa folder — allowed, relative rewrites
  only); usa-tiles → global-tiles is a temporary cross-tree import
  (global not yet moved — fine).
- NO renames anywhere (the bundle-budget gate matches route-module
  basenames). Tests move WITH their subjects.

Gates: full run per commit + pnpm registry:generate + pnpm
placement:generate + pnpm s24:d9-audit (regenerated docs reviewed —
drift recorded, never silently absorbed).

Done-criteria: baseline gates recorded; final gates 9/9, suite count
identical (15,298); every commit green; the exports map + all path
references updated in the same commits as their moves. Bookkeeping
per AGENTS.md §10 (HANDOFF rewrite + CHANGELOG + DECISIONS) and the
M4 pointer (Phase 3.2 — world-markets: ~39 files, the ./markets
exports entries, build-world-map.mjs geoOutPath, the pd-s7/s21
scripts, MarketsChart per BD-M1-r D3).
```
