# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **S18 (2026-11-11) — Currencies build & gates — Phase I OPENED AND
> CLOSED IN ONE SESSION. Session 18/30 · 12 remaining.** Delivered the
> /currencies page build + gates whole (the S16/S17 one-session
> trajectory): (a) the engine leg — AUDNZD joins the FX board (D-42: its
> own pacificLink group, NZD riding the SAME single Frankfurter request —
> zero new provider calls; the seven rules/thresholds/pattern checks
> untouched); (b) the pure currencies-tiles + the en/fa pd.currencies
> copy (~118 keys/locale, the corpus-pinned words verified byte-for-byte
> by currencies-copy-pin.test.ts) + the pins; (c) the page build — the 7
> rule lights hero (through the SAME §9.3 fxRuleView mapping the legacy
> page reads) + the 11-pair board (rate · d1/m1/m3/y1 · moveRank ·
> bigMove · the 52-week closes) + the dollar-standing cards (14 §21-trio
> registry cards) + the FX-board payload wiring (two feeds, the M-17
> last-good on both); (d) the §21 backtest (the pure core with THREE
> gates + the offline suite [14 tests] + the live pd-s18-backtest.ts —
> post-deploy ALL GREEN: cards 14/14 · rules 16/16 · board 23/23 [11/11
> pairs] · freshness 14 within grace); (e) the render audit
> (CurrenciesPage.test.tsx, 8 tests) + the In-build chip RETIRED at the
> gates pass — the LAST placeholder page is real (DESTINATION_ROUTES is
> empty; every destination renders its own page chunk). **DEPLOYED LIVE
> (BOTH workers: currena-api `51a0fe45` + currena-markets `8f63c8fa` +
> the manual fx-run KV seed — the 11th pair landed on the live board at
> rate 1.22827, asOf 2026-11-09; the post-deploy §21 ALL GREEN; the
> 4-leg browser pass green; the legacy /insights fx table now honestly
> shows the fourth group "Australia–New Zealand (1)" with the audnzd
> row).** The one data event of the session: the post-deploy freshness
> audit caught dollar-broad/dollar-eme crossing their 10-day grace (a
> PRE-EXISTING FRED edge-lag, verified against the source), fixed
> through the pipeline's own lever (a workflow_dispatch ingest run
> refreshed them to 2026-11-06).
>
> **THE THIRD S18 ARRIVAL (2026-11-12, BD-S18-parallel-3 — resolved the
> same session):** a third session from the same prompt, resumed from
> the first duplicate's interrupted local checkpoints, built a
> duplicate M2 against a stale view and discovered the close only on
> its rejected push. It preserved its duplicate on
> `archive/s18-duplicate-m2`, reset onto the deployed `52a378b`, landed
> its one unique salvage (`1fc94e0` — the local-seed NZD fixture line,
> dev harness only), and INDEPENDENTLY re-verified the shipped S18 a
> third time: its own gates run ALL GREEN 15,088 (2m 38s) · its own
> live pd-s18-backtest ALL CHECKS GREEN (cards 14/14 · rules 16/16 ·
> board 23/23 with audnzd at moveRank 60.39 · freshness 14 within
> grace) · its own 4-leg browser pass green (chip ABSENT, 0px overflow,
> ZERO errors, «۱٫۲۲۸۳ دلار نیوزیلند» live) · the legacy fourth-group +
> /australia seat chips verified. No re-deploy, no shipped-code change.
> The session's own standing note: launch exactly ONE session per
> roadmap slot — S19 first, then wait for its hand-off.

## Current state (2026-11-11, after page-division S18)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase I (Currency Pairs) CLOSED:
  S18 delivered the Currencies page build + gates in one session — the
  last placeholder page is real.** All TEN destinations now render their
  own pages: Global (/) · Gold · World Markets · USA · Europe · Asia &
  Pacific · Australia · Commodities · **Currency Pairs (/currencies)** ·
  legacy /insights (the deprecation banner, unchanged below it — its fx
  table honestly gained the fourth group block "Australia–New Zealand
  (1)" with the audnzd row, the D-42 consequence).** Progress: S1
  scaffold & navigation · S2 data layer + `PLACEMENT.generated.md` ·
  S3–S4 the Global landing (Phase A CLOSED) · S5–S6 Gold (Phase B
  CLOSED) · S7–S8 World Markets + the zoom maps (Phase C CLOSED) ·
  S9–S11 USA (Phase D CLOSED) · S12–S13 Europe (Phase E CLOSED) ·
  S14–S15 Asia (Phase F CLOSED) · S16 Australia (Phase G CLOSED) · S17
  Commodities (Phase H CLOSED) · **S18 Currencies (Phase I CLOSED).**
- **DEPLOYED LIVE (2026-11-10 ~00:05 UTC, the owner's standing):**
  **currena-api `51a0fe45`** (the new SPA + the additive
  FxSnapshotSchema) + **currena-markets `8f63c8fa`** (the fx engine's
  new pair rides its four crons — the first session to redeploy the
  markets worker since the fx build era) + the manual fx-run KV seed
  (the Path-B pattern). The live acceptance: the §21 diff re-run
  post-deploy ALL GREEN (cards 14/14 · rules 16/16 · board 23/23 [11/11
  pairs, D-42 complete] · freshness 14 within grace);
  currena.ir/currencies renders the complete page over the live feeds at
  1440×900 AND 360×844 in en AND fa (7 rule lights with the live
  outcomes · 11 pair cards with audnzd last · 14 registry cards · the
  In-build chip ABSENT on all 4 legs · NO horizontal scroll · ZERO
  console/page errors; the fa legs dir=rtl + h1='جفت‌ارزها' + Persian
  digits ['۵۰٫۱۴ لیر ترکیه' · '۱٫۲۲۸۳ دلار نیوزیلند' · '۵۶٫۷۰٪']). The
  prior surface was `08e0fc64` (S17, /commodities); production moved
  `08e0fc64` → `51a0fe45`.
- **The AUDNZD engine addition (BD-S18a, D-42):** the fx board's pairs
  are now ELEVEN (audnzd in its own pacificLink group). An ADDITIVE
  wire-contract change (FxPairIdSchema) — pre-S18 stored snapshots kept
  parsing. NZD rides the same single Frankfurter timeseries request
  (zero new provider calls; the Yahoo fallback gained the NZD=X symbol).
  The seven rules, every threshold, every pattern check and the summary
  rollup are untouched (audnzd is not a rule input). The legacy corpus
  gained the new surface's own words (fx.groups.pacificLink ·
  fx.entries.audnzd · currencyNames/Plural.NZD — en + fa, the 6 fa
  strings queued unreviewed).
- **Gates (last full run, S18 — ALL GREEN):** typecheck 6/6 · eslint 0/0
  · copy:audit clean (exit 0 — the 118 new pd.currencies.* + the 6 new
  fx.* fa entries queued unreviewed; the narrator vocabulary REGENERATED
  for the corpus additions) · **suite 15,088 = +35** (currencies-tiles
  10 · currencies-copy-pin 2 · currencies-backtest 14 · CurrenciesPage
  render audit 8 · fx.test +1) · build + budgets held (entry
  271.02/82.06, the CurrenciesPage chunk 21.09/5.33 vs its 24/6.5 row).
- **The live §21 diff (post-deploy, vs https://currena.ir): ALL CHECKS
  GREEN** — the 14 registry cards' trio inputs page ≡ engine
  byte-for-byte; the rules gate green (the §9.3 status table row-by-row
  through the SAME fxRuleView + the renderable-domain invariant + the
  stored summary ≡ the engine's own summarizeFxRules recomputed); the
  board gate green (11/11 pairs · the bigMove ≡ moveRank ≥ 90
  derivation · the stale-flag honesty); the freshness audit honest (14
  within grace). PRE-deploy, the same run showed the D-42 coverage leg
  honestly RED (audnzd not yet live) — the deploy + the fx-run seed
  closed it (the S16-shaped pre-deploy record).

## Next session (S19 — Navigation, mobile & SEO polish · Session 19/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S19 entry + the S18
delivery record), `02-PAGE-DIVISION-SPEC.md` §18 (the navigation/routes
/visual-language contract) + §21, and this file. Scope (S19 — Phase J
opens): the topbar/drawer final pass across all pages; sticky footers;
meta/OG tags per page; breadcrumbs; the known Header language-toggle
display quirk (HANDOFF item 6 — the button shows the theme words as its
visible label; its aria-label is correct) rides this pass. Gates: every
page × the mobile/ARIA pass; typecheck + lint + copy:audit +
build/budgets; browser verification on the touched surfaces; commit
pushed at every checkpoint. The deploy at the close is the owner's
standing.

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
   BD-S16a/b/c/d + BD-S17a/b/c + **BD-S18a/b/c + the deploy (the
   Currencies build & gates — Phase I CLOSED, incl. the AUDNZD engine
   addition)** (all recorded, none blocking).
4. Triage the queued unreviewed fa strings (now ~1138: the ~1014
   previous + the 6 fx.* engine strings + the 118 S18
   `pd.currencies.*` keys; the S18 corpus-pinned values — the rule-light
   names/headlines/everyday words, the pair/card names, the unit words,
   the position/band/status words — are verified byte-for-byte by
   `currencies-copy-pin.test.ts`; the fresh section/intro/loading/error
   + move-rank/52-week copy pending review).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. The Header's language quick-toggle display quirk (S19's polish pass
   carries it): the button shows the theme words as its visible label
   (its aria-label is correct) — `apps/web/src/components/Header.tsx`
   ~line 316.
7. The §15 FRED-only CPI fills for JP/KR/IN — still carried forward to
   a dedicated fill session (BD-S14a/BD-S15d, §"The §15 FRED-only CPI
   fills for Asia" above).
8. A glance at the two TRANSIENT P1 provider timeouts from the S18
   data-refresh ingest run (#87: ecb-dfr + gold-aud, held on last-good
   and flagged stale by the fail-closed design): they should self-clear
   at the next ingest rung; if they persist across runs, they belong to
   a maintenance session.
9. **THE PARALLEL S18 SESSIONS (BD-S18-parallel + BD-S18-parallel-2 +
   BD-S18-parallel-3 — RESOLVED, all three sessions closed):** a SECOND
   agent session committed its own S18 milestones (M1a/M1b/M2 — the
   `auLink` variant, an alternative page build) to origin/main WHILE the
   primary session ran.
   The primary session had already passed all gates and DEPLOYED both
   workers, so every merge conflict was resolved to its deployed
   implementation (`pacificLink`, the live `51a0fe45`/`8f63c8fa` truth);
   the duplicate's non-conflicting contributions were kept and its orphan
   component removed (its content stays in its commits `4fea60a`/
   `59b0388`/`2f1e0f1`). **The duplicate session then closed honestly
   (BD-S18-parallel-2): it aligned to the merged `1941197`, dropped its
   superseded M3 commit, and INDEPENDENTLY re-verified the shipped S18
   (its own full-gates run ALL GREEN 15,088 · its own live pd-s18 run
   ALL GREEN · its own 4-leg browser pass green · the legacy /insights
   fourth-group + /australia chips verified). No re-deploy, no code
   change; the two records together are the complete story.** A THIRD
   session then arrived from the same prompt (resumed from the first
   duplicate's interrupted local checkpoints, unaware of the close until
   its own push was rejected): it too honoured the deployed-state rule
   (BD-S18-parallel-3) — its duplicate M2 preserved on the pushed branch
   `archive/s18-duplicate-m2`, main reset to `52a378b`, its ONE unique
   salvage landed (`1fc94e0` — the local-seed NZD fixture line, dev
   harness only), and the shipped S18 independently re-verified a third
   time (its own gates run ALL GREEN 15,088 · its own live pd-s18 run
   ALL GREEN · its own 4-leg browser pass green · the cross-surfaces
   verified). No re-deploy, no shipped-code change.
   The owner-side post-mortem: THREE S18 sessions were launched from one
   prompt (the primary + two duplicates; zero production collisions —
   neither duplicate ever deployed or pushed to main). Ensure S19+
   launches exactly ONE session per roadmap slot — launch S19 first, then
   wait for its hand-off before any further session.

## Known state worth knowing

- The Currencies page reads TWO feeds: the S2 projection (GET
  /api/insights/pages/currencies — the 14 home readings) + the fx board
  (GET /api/insights/fx — the 7 rule states + the 11 pair rows + the
  dollar measure). A slow or dead projection takes only the cards away
  (the M-17 last-good localStorage pattern paints the cached copy,
  labelled); a dead fx feed renders the calm "being prepared" line
  (never an error — the markets/fx discipline).
- The Currencies render audit (`CurrenciesPage.test.tsx`, 8 tests) pins
  the shell + the 7-light hero with EVERY rule-outcome shape (a
  downgraded warning keeps its warning sentence + the caution line; a
  quiet R7 stays legitimately silent) + the 11-pair board (the bigMove
  + stale tags, the 52-week chart) + the two card sections with the §21
  trio + the fail-closed paths + the M-17 last-good on both feeds + the
  fa/RTL Persian rendering. The In-build chip is asserted ABSENT (the
  S18 gates session — BD-S18c's retirement).
- The §21 backtest for Currencies (`currencies-backtest-core.ts` with
  THREE gates + the offline suite [14 tests] + the live
  `pd-s18-backtest.ts`) is the S18 gate; the live run against production
  post-deploy: ALL GREEN. The live script fetches THREE feeds (the
  snapshot + the projection + the fx board) — re-run it any time with:
  `pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s18-backtest.ts`.
- The Currencies budget row (`scripts/check-bundle-budget.mjs`): the
  CurrenciesPage lazy chunk measured 21.09/5.33 (S18, chip retired) vs
  a 24/6.5 ceiling.
- The rollback lever for the S18 deploy (BOTH workers, the safe order is
  markets first, then a 10-pair fx-run reseed, then api — the OLD api
  schema rejects the stored audnzd row): `npx wrangler rollback` from
  each app — /currencies returns to the prior surface (`08e0fc64`, S17,
  the S1 PagePlaceholder with the honest In-build chip); every other
  surface was byte-identical before it (the S18 change is the engine
  pair + the corpus words + the /currencies page build + the §21
  backtest + the render audit + the chip retirement + the App.tsx
  wiring only).
- The fx-run manual lever (`pnpm --filter @currena/insights fx-run`,
  needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID +
  INSIGHTS_KV_NAMESPACE_ID) rewrites the fx KV through the REST API —
  used post-deploy to land the audnzd pair immediately (the
  markets-au-run Path-B pattern); the markets worker's four crons keep
  it fresh from now on.
