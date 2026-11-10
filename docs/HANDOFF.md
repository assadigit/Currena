# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **S20 (2026-11-12) — the full-site regression + verdict backtest +
> data audit — every page × every §21 gate ALL GREEN; NO deploy.
> Session 20/30 · 10 remaining.** The S20 scope delivered whole: (a)
> the §21 data audit (Rule 5, BD-S20a) — the N=20 random-id source
> spot-check shipped as a re-runnable LIVE tool
> (`apps/web/scripts/pd-s20-data-audit.ts`; the frozen seed-20261112
> sample over the 184 registry ids, 11 providers; the repo's own
> adapters imported verbatim through a new ADDITIVE export block on
> `@currena/insights/adapters`; compared AT THE STORED asOf; the
> platinum live-spot arm records the intraday move) — THE RUN: ALL 20
> GREEN (19 byte-exact + platinum the 0.25% intraday move); (b) the
> verdict backtests — ALL ELEVEN live pd-* scripts re-run against
> production: 715 checks, ALL GREEN (s4 Global 84 + the narrator
> raw-KV stateHash recompute IDENTICAL · s5 Gold 150 · s7 56 · s8 9 ·
> s9 115 · s10 115+48 · s12 8 · s14 11 · s16 28 · s17 24 · s18
> 14+16+23 + freshness 14-within-grace); (c) the placement audit —
> `placement:generate` reconciles (184 ids · 0 unplaced · 0 duplicate
> homes · zero diff); (d) the gates ALL GREEN (2m 42s · the suite
> 15,099 — the S19 count EXACTLY · entry 272.83/82.52, IDENTICAL rows);
> (e) the browser regression — all 10 routes × 1440×900 + 360×844 ×
> en + fa (40 legs, LIVE on production): the per-route meta + the
> trails on the 8 destinations + the legacy deprecation banner + 0px
> overflow + ZERO errors on every leg + the Global one-screen rule +
> Gold's 37 seats + the honest-record footnote + Currencies' 7 lights +
> 14 cards + 11 pairs + NO DEAD LINKS + the interaction golden path;
> (f) the performance budget check (BD-S20c) — the bundle rows held +
> the measured live pass (COLD 380ms/485KB at 1440×900 — the font +
> the shell dominate · COLD /gold 76ms/14KB at 360×844 · WARM 59–81ms
> per route); (g) the close (BD-S20-deploy) — NO deploy: nothing was
> fixed; the tree changes are dev tooling only; production stays at
> currena-api `74777037` + currena-markets `8f63c8fa`, and this
> session's own sweep is the proof that production serves exactly this
> tree's behavior.

## Current state (2026-11-12, after page-division S20)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **All TEN destinations render
  their own pages with the S19 polish; the S20 full-site regression
  re-proved every §21 gate green (the backtests · the data audit ·
  the browser pass · the performance check). Phase J (Integration):
  S19 done, S20 done — S21 (the spec-vs-implementation audit)
  remains.** Progress: S1 scaffold & navigation · S2 data layer +
  `PLACEMENT.generated.md` · S3–S4 the Global landing (Phase A
  CLOSED) · S5–S6 Gold (Phase B CLOSED) · S7–S8 World Markets + the
  zoom maps (Phase C CLOSED) · S9–S11 USA (Phase D CLOSED) · S12–S13
  Europe (Phase E CLOSED) · S14–S15 Asia (Phase F CLOSED) · S16
  Australia (Phase G CLOSED) · S17 Commodities (Phase H CLOSED) · S18
  Currencies (Phase I CLOSED) · S19 the polish (Phase J OPEN) · **S20
  the full-site regression + verdict backtest + data audit (ALL
  GREEN, no deploy).**
- **DEPLOYED LIVE (unchanged this session — nothing was fixed):**
  **currena-api `74777037`** (the S19 SPA) + **currena-markets
  `8f63c8fa`** (the S18 markets worker). The S20 tree adds no
  shipped-code change (the manual audit script never enters the Vite
  build; the adapters export block is tooling-only) — production
  serves exactly this tree's behavior, proven by this session's own
  715-check live sweep + the 40-leg browser pass + the 20-id upstream
  audit.
- **Gates (last full run, S20 — ALL GREEN, 2m 42s):** secret scan
  8/1019 · typecheck 6/6 · eslint 0/0 · copy:audit clean (no new
  strings this session) · narrator in sync + eval 50 · layer1
  11,819/11,819 · **the suite 15,099** (the S19 count exactly — no
  test change) · build + budgets held (entry 272.83/82.52, every page
  chunk within its row, IDENTICAL to the S19 rows).
- **The S20 surfaces (what changed where):** ONE new manual script
  (`apps/web/scripts/pd-s20-data-audit.ts` — the §21 data-audit tool)
  + ONE additive export block (`packages/insights/src/adapters/
  index.ts` — the audit surface) + the records (DECISIONS BD-S20a/b/c/
  deploy · CHANGELOG · the roadmap S20 delivery record + the progress
  board · this file · the README program state). Rollback: nothing to
  roll back (no deploy); the S19 lever stands (one `npx wrangler
  rollback` from apps/api returns the SPA to the S18 shape).

## Next session (S21 — Spec-vs-implementation audit · Session 21/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S21 entry + the S20
delivery record), `02-PAGE-DIVISION-SPEC.md` §4–§14 (the per-page
spec sections S21 diffs against the live site) + §21, and this file.
Scope (S21): the full diff — spec §4–§14 vs the live site (every
deviation fixed or documented as a decision); the placement table
regenerated & reconciled. The S20 tools that help: the re-runnable
data audit (`pnpm --filter @currena/web exec tsx
../../apps/web/scripts/pd-s20-data-audit.ts`) + the eleven live
pd-* backtests. Gates: all green; commit pushed at every checkpoint.
The deploy at the close is the owner's standing.

### The §15 FRED-only CPI fills for Asia — carried forward (BD-S14a / BD-S15d)

The three D-36 Asia fills (Japan · Korea · India CPI YoY) stay
verified-pending-ingest (Rule 5). The FRED OECD mirror family
candidates were VERIFIED STALE/discontinued live in S14 (BD-S14a):
JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06; KORCPIALLMINMEI +
CPALTT01KRM659N end 2023-11; INDCPIALLMINMEI + CPALTT01INM659N end
2025-03. The World Bank FP.CPI.TOTL.ZG (annual, fresh through 2025) is
a viable alternative but a DIFFERENT cadence + provider than the spec
§15 names. The national statistics bureaus (the Statistics Bureau of
Japan, KOSTAT, MoSPI) publish fresh monthly CPI but are NOT
already-integrated providers. The candidates + the alternative sources
are recorded in DECISIONS.md (BD-S14a + BD-S15d). **A dedicated fill
session picks a viable monthly source, verifies from production egress,
then ingests with the full §A discipline; the §21 diff grows to cover
the new cards.** Their absence does not make the 11 placed Asia cards
"in build" — the chip retired at the S15 gates pass (BD-S15c).

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + BD-S8a/b/c + BD-S9a/b/c + BD-S10a/b/c + BD-S11a/b/c +
   BD-S12a/b + BD-S13a/b/c/d + BD-S14a/b/c/d + BD-S15a/b/c/d +
   BD-S16a/b/c/d + BD-S17a/b/c + BD-S18a/b/c + BD-S19a/b/c/d (the
   S19 polish: the language-toggle verification + target-naming labels
   · the breadcrumb scope · the SPA meta/OG approach · the
   sticky-footer verification + the safe-area rider + the two S1-noted
   hero items) + **BD-S20a/b/c/deploy (the S20 verification session:
   the data-audit tool + its ALL-GREEN run · the regression + backtest
   re-run record · the performance check · the no-deploy close)** (all
   recorded, none blocking).
4. Triage the queued unreviewed fa strings (now ~1142: the ~1014
   previous + the S18 additions + the 4 S19 strings; every session's
   corpus-pinned values are verified byte-for-byte by their copy-pin
   tests — the fresh section/intro/loading/error + the S19 labels +
   descriptions pending review).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. ~~The Header's language quick-toggle display quirk~~ — **CLOSED at
   S19 (BD-S19a): the "theme words" read was disproven against the
   deployed DOM; the labels now name the target language; verified on
   all four legs.**
7. The §15 FRED-only CPI fills for JP/KR/IN — still carried forward to
   a dedicated fill session (BD-S14a/BD-S15d, §"The §15 FRED-only CPI
   fills for Asia" above).
8. **The ecb-drf provider timeout (a maintenance-session item now):**
   the S18/S19 data-refresh runs kept it held on last-good (2.5%,
   flagged stale) — it did NOT self-clear across rungs (gold-aud, the
   other S18 transient, DID self-clear). The fail-closed design is
   holding the correct value honestly; a maintenance session should
   look at the ECB fetch (the runbook: docs/INDICATORS_AND_DATA_
   SOURCES.md + the /admin console's per-source status, which needs
   the owner's REFRESH_SECRET).

## Known state worth knowing

- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html. If the
  owner ever wants per-route link previews for non-JS crawlers
  (Telegram/X cards), the options are SSR/prerender or a Worker-side
  <head> injection — an owner decision, recorded in BD-S19c.
- The breadcrumbs render in the pages' ready + cached states (they
  ride each page's own heading block — BD-S19b). The loading/error
  states show the page's own honest lines, no trail; that is by design
  (the trail is wayfinding for content, not a chrome element).
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) stops at S11 — the later sessions' records live
  in the roadmap delivery records + this file (the convention moved at
  S12). A back-fill is a nice-to-have, never blocking.
- The rollback lever for the S19 deploy (ONE worker, web-only):
  `npx wrangler rollback` from apps/api — every surface returns to
  the S18 shape (`51a0fe45`); nothing else moves (the S19 change is
  display-layer only).
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 56) · pd-s8 (zooms 13) ·
  pd-s9/s10 (USA 69/173) · pd-s12 (Europe 8) · pd-s14 (Asia 11) ·
  pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18
  (Currencies: cards + rules + board) — all re-runnable against
  production from apps/web/scripts/.
