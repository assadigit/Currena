# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **S20 (in flight, 2026-11-12) — Full-site regression + verdict backtest
> + data audit · Session 20/30 · 10 remaining.** Session goal: every page
> × every §21 gate re-run against the S19 tree + production; the N=20
> seeded-random-id source spot-check (Rule 5); the performance budget
> check. Milestones: M1 local `pnpm gates` + placement audit · M2 the 11
> live pd-* backtests vs production · M3 the data audit (new
> `pd-s20-data-audit.ts`) · M4 the browser regression (10 routes × both
> widths × both locales) · M5 the records + close (deploy expected: none,
> per the owner's standing, unless something is fixed).
>
> **Checkpoint 1 (M1+M2+M3 all green):** `pnpm gates` ALL GREEN on the
> S19 tree + the audit toolkit (2m 42s: secret scan 8/1019 · tsc 6/6 ·
> eslint 0/0 · copy:audit clean · narrator in sync + eval 50 · layer1
> 11,819/11,819 · the suite 15,099 · build + budgets — entry
> 272.83/82.52, every page chunk within its row) · `placement:generate`
> reconciles (184 ids · 0 unplaced · 0 duplicate homes, no diff) · the
> 11 live pd-* backtests vs production ALL GREEN (s4 84 + narrator
> stateHash identical · s5 150 · s7 56 · s8 9 · s9 115 · s10 115+48 ·
> s12 8 · s14 11 · s16 28 · s17 24 · s18 14+16+23+freshness 14 = 715
> checks) · the N=20 data audit (seed 20261112, 11 providers) ALL 20
> GREEN — 19 byte-exact + platinum the 0.25% intraday live-spot arm
> (recorded). Remaining: M4 the browser pass · M5 the records + close.

> **S19 (2026-11-12) — Navigation, mobile & SEO polish — Phase J OPEN.
> Session 19/30 · 11 remaining.** Delivered the S19 scope whole: (a) the
> breadcrumbs — the shared `PageBreadcrumbs` (a REAL Home link through
> the path router, the current page as an aria-current span, the
> separator aria-hidden + RTL-mirrored) wired into the EIGHT
> destinations' heading blocks (BD-S19b: Global IS Home — no trail; the
> legacy /insights keeps its deprecation banner as the wayfinding
> bridge; the tools keep the topbar); (b) the per-page meta/OG pass —
> the pure `lib/route-meta` table (the S1 titleKeyFor switch moved
> verbatim + regression-pinned) feeding the App shell's extended
> `<head>` effect (per-route description [the nine destinations REUSE
> their dictionary PURPOSE lines, D-48], og:title/og:description/
> og:url/og:locale, twitter:*, the canonical link — find-or-create
> idempotent writers) + the refreshed static index.html defaults + PWA
> manifest description (BD-S19c: true per-route SSR OG is out of scope
> by the repo's own SPA-only rule — non-JS crawlers see the static
> defaults); (c) the HANDOFF item 6 language quick-toggle — the "theme
> words" read DISPROVEN against the deployed DOM (the visible label is
> the target language's own word 'فا'/'EN'; the aria-label was already
> correct); the polish: the accessible name + tooltip now NAME THE
> TARGET ('Switch to Farsi' / «تغییر به انگلیسی», BD-S19a); (d) the
> sticky footers VERIFIED on every route × both widths × both locales
> (Global exactly one screen WITH the footer at 1440×900 AND 360×844;
> long pages push it below content) + the iOS safe-area rider landed
> (`.app-footer` respects env(safe-area-inset-bottom), BD-S19d), and
> the two S1-noted legacy-hero mobile items CLOSED (the ⓘ wrap — the
> date + prices units are separate non-breaking bdis; the state-pill
> icon gap 0.375rem → 0.5rem). **GATES ALL GREEN** (2m 38s · the suite
> 15,099 = +11 [PageBreadcrumbs 4 · route-meta 7] + the 8 pages'
> wiring pins · entry 272.83/82.52, every chunk within its row ·
> copy:audit clean, the 4 new fa strings queued unreviewed).
> **DEPLOYED LIVE (currena-api `74777037` — a WEB-ONLY deploy, the
> markets worker untouched by the code-unchanged convention; the
> deploy-lock check ran first: S18's `51a0fe45` @ 100%; the deployed
> entry chunk byte-verified identical to the local build; the live
> acceptance on currena.ir re-ran the 4-leg checks — all green:
> trails · meta · labels · hero fixes · 0px overflow · ZERO errors).**
> The S18 transient P1 glance: gold-aud SELF-CLEARED; ecb-drf still
> flagged stale (2.5 held on last-good) — a maintenance-session item
> now.

## Current state (2026-11-12, after page-division S19)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **All TEN destinations render
  their own pages and every page now carries its S19 polish: the
  breadcrumb trail, the per-route meta/OG, the verified sticky footer.
  Phase J (Integration) is OPEN — S19 done; S20 (the full-site
  regression + verdict backtest + data audit) and S21 (the
  spec-vs-implementation audit) remain.** Progress: S1 scaffold &
  navigation · S2 data layer + `PLACEMENT.generated.md` · S3–S4 the
  Global landing (Phase A CLOSED) · S5–S6 Gold (Phase B CLOSED) ·
  S7–S8 World Markets + the zoom maps (Phase C CLOSED) · S9–S11 USA
  (Phase D CLOSED) · S12–S13 Europe (Phase E CLOSED) · S14–S15 Asia
  (Phase F CLOSED) · S16 Australia (Phase G CLOSED) · S17 Commodities
  (Phase H CLOSED) · S18 Currencies (Phase I CLOSED) · **S19
  Navigation, mobile & SEO polish (Phase J OPEN).**
- **DEPLOYED LIVE (2026-11-10 ~03:1x UTC, the owner's standing):**
  **currena-api `74777037`** (the S19 SPA: the breadcrumbs + the
  route-meta pass + the language-toggle labels + the footer rider +
  the two hero fixes; the markets worker stays at `8f63c8fa` — no
  engine change this session, the code-unchanged convention). The
  prior surface was `51a0fe45` (S18, BOTH workers + the fx-run KV
  seed); production moved `51a0fe45` → `74777037`.
- **Gates (last full run, S19 — ALL GREEN):** secret scan 8/1018 ·
  typecheck 6/6 · eslint 0/0 · copy:audit clean (the 4 new fa strings
  — nav.switchToFa · nav.switchToEn · nav.breadcrumb ·
  app.metaDescription — queued unreviewed; the retired
  nav.toggleLanguage removed from the manifest) · narrator in sync +
  eval 50 · layer1 11,819/11,819 · **the suite 15,099 = +11** ·
  build + budgets held (entry 272.83/82.52, every page chunk within
  its row).
- **The S19 surfaces (what changed where):** `PageBreadcrumbs.tsx` +
  the 8 page wirings · `lib/route-meta.ts` + the App `<head>` effect ·
  the dictionaries (4 new keys, 1 retired) · the static index.html +
  the PWA manifest description · `.app-footer` + `.ei-state-pill` in
  index.css · the InsightsHeader data-as-of line · the Header language
  quick-toggle labels. Rollback: ONE `npx wrangler rollback` from
  apps/api returns every surface to the S18 shape.

## Next session (S20 — Full-site regression + verdict backtest + data audit · Session 20/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S20 entry + the S19
delivery record), `02-PAGE-DIVISION-SPEC.md` §21 (the acceptance
criteria & test gates — S20's own checklist), and this file. Scope
(S20): every page × every gate from §21 of the spec; the N=20
random-id source spot-check (Rule 5 — fetch each id's value from its
upstream source and cross-check, 100% match or a recorded, explained
difference); the performance budget check (the bundle rows + a
performance pass at both widths). The tools for the verdict gates are
the per-page live backtests already shipped (pd-s4/s5/s7/s8/s9/s10/
s12/s14/s16/s17/s18-backtest.ts — re-run them all against production).
Gates: all green; commit pushed at every checkpoint. The deploy at the
close is the owner's standing.

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
   BD-S16a/b/c/d + BD-S17a/b/c + BD-S18a/b/c + **BD-S19a/b/c/d (the
   S19 polish: the language-toggle verification + target-naming labels
   · the breadcrumb scope · the SPA meta/OG approach · the
   sticky-footer verification + the safe-area rider + the two S1-noted
   hero items)** (all recorded, none blocking).
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
