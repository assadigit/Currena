# DEPLOY — Currena runbook

How to build, deploy, verify, and roll back the Currena Worker (API + SPA + admin).
The legacy app stays live at https://aliassadi1993.pythonanywhere.com/ until an
explicit human cutover — nothing here touches it.

## Topology (one deployment)

```
Cloudflare Workers  currena-api  →  https://currena.ir  (Custom Domain, production)
                                        https://currena-api.sedanama-ir.workers.dev
 ├─ GET  /api/health|rates|convert|meta|status     JSON (Hono)
 ├─ GET  /api/insights(/:id/history)               precomputed Insights snapshot + histories (2026-10-07)
 ├─ POST /internal/refresh                         header-secret scrape
 ├─ GET/POST /admin                                zero-JS ops console (noindex)
 ├─ everything else                                built SPA (static assets + SPA fallback)
 └─ cron  * * * * *                                scheduled keep-warm (see §Ever-green)
     KV namespace RATES: snapshot:*, status:*, lock:*, history:<source>
                                                   (7-day hard TTL; history no TTL —
                                                    every live-scraped generation, content-deduped)
                        insights:snapshot|hist:<id>|status  (no TTLs; written by the
                                                    daily GitHub Actions ingestion)
                        insights:markets:v1 | insights:fx:v1
                                                   (no TTLs; written by currena-markets
                                                    crons 23:30/01:30 UTC)
                        insights:prices-live:v1     (no TTL; written by currena-api's
                                                    own hourly :13 cron rung)
```

- `run_worker_first` pins `/admin*`, `/api/*`, `/internal/*` to the Worker.
  Navigation-style requests (`Sec-Fetch-Dest: document`) to non-asset paths are
  otherwise served `index.html` by the platform WITHOUT invoking the Worker —
  proven live 2026-09-17 (PROGRESS.md decisions log).
- Assets: `apps/web/dist` (built by Vite) served straight from the edge; SPA
  deep links fall back to `index.html` (platform + Hono notFound double cover).

## Prerequisites

- Node ≥ 20, pnpm 10 (`corepack enable`)
- Cloudflare account + API token with Workers Scripts (edit) + Workers KV (edit)
- Account ID; both exported for wrangler:

```sh
export CLOUDFLARE_API_TOKEN=…   # never commit; pass via environment only
export CLOUDFLARE_ACCOUNT_ID=…  # (session sandbox: env-only, never persisted to disk)
```

## First-time setup

1. **KV namespace** (once):
   ```sh
   pnpm --filter @currena/api exec wrangler kv namespace create RATES
   # put the printed id into apps/api/wrangler.jsonc → kv_namespaces[0].id
   ```
2. **Refresh secret** (once):
   ```sh
   openssl rand -hex 32                          # generate locally
   printf '%s' "$REFRESH_SECRET" | pnpm --filter @currena/api exec wrangler secret put REFRESH_SECRET
   # same value into apps/api/.dev.vars for local dev (gitignored)
   ```
   > ⚠ Use `printf '%s'`, never `echo` — `echo` appends a newline that becomes
   > part of the stored secret (constant-time compares then always fail).
   > Verified the hard way on 2026-09-18 with ADMIN_VIEW_SECRET.
3. **(Optional, recommended) Admin view gate** — when set, `/admin` requires a
   sign-in (HMAC cookie session) instead of being public:
   ```sh
   openssl rand -hex 24
   printf '%s' "$ADMIN_VIEW_SECRET" | pnpm --filter @currena/api exec wrangler secret put ADMIN_VIEW_SECRET
   ```
   Unset (or `wrangler secret delete ADMIN_VIEW_SECRET`) returns to public mode.
4. Install + verify:
   ```sh
   pnpm install && pnpm -r typecheck && pnpm -r test
   ```

## Deploy

```sh
pnpm --filter @currena/web build          # 1. SPA → apps/web/dist
pnpm --filter @currena/api exec wrangler deploy   # 2. Worker + assets + bindings
```

> `pnpm --filter @currena/api deploy` collides with pnpm's built-in `deploy`
> command — always use `exec wrangler deploy`.

## The Gemini key (Layer-2 narrator) — OWNER-ONLY, never in chat or the repo

The narrator's model key is a Cloudflare Worker SECRET (`GEMINI_API_KEY`),
entered by the owner with `pnpm narrator:set-key` (hidden input, one
validation call, piped to `wrangler secret put` — never a command-line
argument, never printed, never committed). The rules:

1. **Create the key in Google AI Studio**
   (https://aistudio.google.com/app/apikey) inside a Cloud project with
   **NO billing enabled** — the free tier's spend-based rate limit is
   "N/A", so an unbilled project can never be charged (re-verified
   2026-10-28, D-28). The key starts with `AIza…`.
2. **Never paste it anywhere** — not in chat, not in issues, not in
   code. The repo's secret scan (`pnpm gates` gate 0, D-33) fails the
   build on the `AIza…` shape (plus GitHub/AWS/Slack/EODHD shapes and
   generic credential assignments) in any tracked file.
3. **Rotate immediately** if a key was ever pasted anywhere public:
   delete it in AI Studio, create a fresh one, re-run
   `pnpm narrator:set-key`.
4. **Free-tier terms** (re-verified 2026-10-28, D-28): on the free tier,
   Google may use submitted content to improve its products ("Used to
   improve our products: Free tier Yes / Paid No"). The narrator only
   ever submits PUBLIC market data (the computed page state + the
   approved vocabulary) — no personal or confidential data exists in its
   inputs. Grounding (part 3, if ever enabled) has the same terms plus
   display requirements (D-29).

## Repairing CI (the red GitHub Actions — what is OWNER-SIDE)

GitHub Actions has been red since 2026-10-20 (last green `f72e1a0`,
2026-10-18): the account's free Actions minutes are exhausted and runner
allocation fails. Until it is repaired, `pnpm gates` (added 2026-10-28,
the Layer-2 prep P5) is the full local equivalent — every session must
run it (or the individual gates) before deploying. Repair is owner-side:

1. Check usage/billing at github.com/settings/billing (Actions minutes)
   and the repo's Actions → "insights-ingest" runs (runner allocation
   errors).
2. Free minutes reset monthly; otherwise upgrade the plan or register a
   self-hosted runner (a small always-on box suffices).
3. After minutes are available: manually re-run the latest failed
   `insights-ingest` run and confirm it goes green.
4. Update the GitHub repo secret `CLOUDFLARE_API_TOKEN` if it was rotated
   meanwhile (`gh secret set CLOUDFLARE_API_TOKEN --repo assadigit/Currena`).
5. Keep the local-gate discipline regardless: `pnpm gates` green before
   every deploy is the runbook rule, CI or not.

## Session record — 2026-10-28d the Insights Layer-2 narrator M4: the generation rung + KV + the cached endpoint (worker 2de8f566, DEPLOYED DISABLED)

The first deploy of the narrator build (M4 of 5, spec §4 + §9). The
narrator lands DISABLED by design: `NARRATOR_ENABLED=false` +
`NARRATOR_VISIBLE=false` + `NARRATOR_WEB_CONTEXT=false` in
`apps/api/wrangler.jsonc` vars; **no GEMINI_API_KEY exists on the worker**
(the owner sets it with `pnpm narrator:set-key` — hidden input, one
validation call, piped to `wrangler secret put`). Zero model calls are
possible in this state; the rung writes TEMPLATE narratives only.

- **Deploy-lock re-checked first**: the versions API showed the
  production environment last modified 2026-10-28T10:16:19Z (the prep
  session's `39c7a4b0`), origin/main at this session's `fe7eb0c` (its own
  M3 push) — no parallel session. Gates ALL GREEN before the deploy
  (secret scan · typecheck · lint · copy:audit · vocabulary · narrator
  eval 50 · layer1 strict 7,809/7,809 unchanged · suite 10,018 · budget
  held 295.37/88.84 + 1094.09/256.83).
- **What shipped**: `apps/api/src/narrator-cron.ts` (the hourly :50 rung
  inside the existing minute cron — stateHash per unit, the 3-call cap,
  the pending continuation, the model→validate→retry-once→template
  ladder), `apps/api/src/narrator-stats.ts` (the 14-day daily buckets),
  `apps/api/src/routes/insights-narrative.ts` (`GET
  /api/insights/narrative`, edge-cached `s-maxage=600`, ungated —
  public-projection-derived only, D-38), the Bindings + vars
  (NARRATOR_ENABLED/VISIBLE/WEB_CONTEXT/WEB_DAILY_CAP/MODEL), and the
  M1–M3 narrator package surface it rides on. currena-markets NOT
  redeployed (untouched).
- **Free-tier impact (D-38's verified budget)**: the rung adds ~24
  ticks/day × (4 doc reads + 1 stats read + ≤2 writes) ≈ 120 KV reads +
  ≤50 KV writes/day — visitors add ZERO (the endpoint is edge-cached);
  ZERO external calls while no key exists. The existing rungs and the
  ingest's request budget are untouched.
- **Live verification (the deploy at ~12:52 UTC)**: health ok · the
  narrative endpoint answered the designed clean 404 envelope
  (`narrative_not_ready`) before the first rung · the insights document
  byte-identical (generatedAt 2026-10-28T04:20:18.253Z, 100 readings,
  global stressed 9 — zero data changes) · markets/fx/status all 200
  with unchanged sizes. The first natural :50 rung (13:50 UTC) then
  wrote the initial TEMPLATE document — see the verification note below.
- **Verification note (the first natural :50 rung, 13:50 UTC)**: the
  deploy landed ~12:52 UTC; the first narrator rung fires at 13:50 UTC
  and writes the initial template document. The confirmation (the
  endpoint serving promptVersion 1 / model gemini-3.5-flash-lite / 4
  sections + overall / every unit source "template" — no key exists)
  lands in the M5 session record below, the same day.
- **Owner steps still required** (copy-paste): `pnpm narrator:set-key`
  (enter the AIza… key — hidden input), then read real text at
  `https://currena.ir/?narrative=preview#/insights` for about a week,
  then flip visibility (M5 ships the display; the flip is one command in
  docs/DEPLOY.md "The Gemini key").

## Session record — 2026-10-28b the Insights Layer-2 PREP session: P1–P5, zero data changes, zero AI (worker 39c7a4b0)

- **Deploy-lock check first** (the D-43 lesson): the deployments API showed
  the newest currena-api deployment still at **2026-10-28T09:03:18Z**
  (version `c6d1a13f` — the Layer-1 final session's docs-pin redeploy,
  ~75 minutes before this session's deploy), currena-markets unchanged
  since 2026-10-27T18:31Z (the R10 deploy), and `git fetch` confirmed
  origin/main at this session's own push `f56bfaa` (tree clean, no newer
  commits) → no parallel session. Lock CLEAR.
- **Deployed**: `pnpm --filter @currena/web build` → `pnpm --filter
  @currena/api exec wrangler deploy` (the owner's `cfut_` token via env,
  never persisted): currena-api **`39c7a4b0-4563-4121-83e4-9ce953ad689b`**
  (2026-10-28 ~10:16 UTC). currena-markets NOT redeployed: neither worker
  imports the new modules (freshness/narrator are additive-only; the
  markets worker's imports are untouched → functionally identical), per
  the Layer-1 precedent.
- **What went live**: the Layer-2 PREP work (docs/insights/layer2/):
  P1 the per-reading freshness module + the data-age honesty SAFETY NET
  (renders nowhere today by design — every card already dates its data;
  invariant-tested), P3's generated narrator vocabulary (Worker-side
  only — the web bundle's only change is the safety net + one UI string
  pair), P4's narration-state contract (Worker-side only), P5's
  `pnpm gates`. **Zero data changes**: the 100-reading snapshot served
  after the deploy is byte-identical in shape and source (generatedAt
  2026-10-28T04:20:18Z, au-10y 5.283 @ 2026-09-30 — the pre-deploy
  values), zero new KV operations, zero new external calls, no AI calls,
  no keys, no prompts.
- **Gates re-verified before the deploy** (`pnpm gates`, all green):
  typecheck 6/6 · lint 0/0 · copy:audit clean (manifest 4,547, the one
  new string triaged round 2026-10-28-l2-prep) · narrator vocabulary in
  sync (129×2 + 23×2) · `LAYER1_STRICT=1` validator **7809/7809
  unchanged** · full suite **9,875** (core 191 · scraper 67 · insights
  727 (+50) · markets 13 · api 344 · web 8533 (+8)) · budgets HELD
  without a bump — entry 295.37/88.84 (unchanged), Insights lazy
  1094.09/256.83 vs the documented 1100/260 ceiling (+1.53 kB raw /
  +0.52 kB gz — the freshness line + the new copy string).
- **Live verification** (https://currena.ir, agent-browser): `/api/health`
  200 (`ok:true, kv:ok`), `/api/insights` 100 readings, `/api/insights/
  markets|fx|status` all 200. The page verified EN + FA at 1280px AND
  360px: zero console errors, zero page errors, zero horizontal overflow
  at 360px, the Layer-1 blocks render (the expanded au-10y + brent
  details dialogs both carry `[data-layer1-block]`), the au-10y card's
  meta row shows its data date in both languages («داده‌های ۳۰ سپتامبر
  ۲۰۲۶ · …» / "data for Sep 30, 2026 · …") and the P1 freshness line
  count is exactly **0 everywhere** (the designed safety-net state).
  Screenshots: `docs/insights/screenshots/layer2-prep/` (5).
- **No rollback needed**; no live-verification catches.

## Session record — 2026-10-28 the Insights Layer-1 plain-language layer ships: 129/129 ids live, zero data changes (final L1 session, worker c02d736a)

- **Deploy-lock check first** (the D-43 lesson): the versions API showed the
  last currena-api upload at **2026-10-27T18:31:05Z** (version `27f42b9c` —
  the R10 session's deploy, recorded in `docs/insights/ROUND10_REPORT.md`
  STEP 11 + CHANGELOG §Round 10), ~14 hours BEFORE the M3 pushes
  (f3ad520..2f884a1, 2026-10-28 06:45–08:11 UTC) → no parallel session
  deployed while M3 ran. The two intermediate versions newer than
  DEPLOY.md's prior newest record (`78bfc0df`, the 2026-10-26c final) are
  both accounted for in the repo's own records: `f489a69a`
  (2026-10-27T00:57Z, the previous session's 16-failure fix) and
  `babce831` (2026-10-27T04:06Z, the R9 deploy) — R9/R10 are ancestors of
  the deployed HEAD. `git fetch` confirmed origin/main still at `2f884a1`
  (tree clean, no newer commits). Deploy-lock CLEAR.
- **Deployed**: `pnpm --filter @currena/web build` → `pnpm --filter
  @currena/api exec wrangler deploy`: currena-api
  **`c02d736a-c0f8-45bf-89bb-f0629ab3ecaf`** (2026-10-28 ~08:31 UTC —
  18 new assets uploaded, the Insights chunk `Insights-p-JnCvcS.js` among
  them). currena-markets NOT redeployed: the Layer-1 work touches
  `apps/web` + docs only; the only packages/ delta since R10 is
  comment-only (the 051be75 tidy-up's doc-reference removals) — the
  deployed markets worker is functionally identical to HEAD.
- **What went live**: the complete Layer-1 plain-language layer (M1+M2+M3,
  129/129 unique ids — 100 indicators + 16 market indices + 17 FX
  rows/patterns, the 4 shared FX ids counted once, D-11): every Insights
  card carries a plain oneLine on its face and, when expanded, the
  Layer-1 block (ifRising/ifFalling with D-06 direction emphasis,
  connections, australiaAngle where applicable, the 23-term EN+FA
  glossary); market detail panels, FX pair panels and the 7 FX pattern
  cards render the same block through the shared `Layer1Block` (D-17,
  pattern cards with the D-09 no-direction note). **Zero data changes**:
  data fetching, thresholds, verdict math, KV usage and the visual design
  system untouched; G10 free-tier safety holds (zero added KV operations,
  zero added external calls).
- **Gates re-verified from a clean state before the deploy** (the D-07
  final-session protocol): `LAYER1_STRICT=1` layer1 vitest **7809/7809**;
  typecheck 6/6; copy:audit **✓ clean** (manifest 4546, all layer1
  round); build + budget — entry 295.37/88.84 kB (budgets 296/89.50),
  Insights lazy 1092.56/256.31 kB (budgets 1100/260, the D-16 ceiling);
  lint 0 errors; full suite green (core 191, scraper 67, insights 677,
  markets 13, api 344, web 8525 — every count identical to the M3
  record); local render-check on all four surfaces (indicator card, market
  tile, FX pair panel, pattern card) EN+FA at 1280px AND 360px, zero
  console errors, zero horizontal overflow.
- **Live verification** (https://currena.ir, both locales, 1280px + 360px):
  `/api/health` 200 (`ok:true, kv:ok`), `/api/insights` serves the
  100-reading snapshot (generatedAt 2026-10-28T04:20Z — Layer 1 adds zero
  data changes), `/api/insights/markets|fx|status` all 200. All four
  surfaces expanded and verified in EN and FA, desktop and mobile: brent
  (indicator card + details dialog), Nikkei 225 (market tile detail),
  EUR/USD (pair panel), r6 Europe-worry (pattern card, open at Level 2 by
  default) — the Layer-1 block renders on each, no horizontal overflow at
  360px, zero console errors, FA fully RTL with Persian digits. The D-11
  shared-id contract spot-checked live on USD/JPY and AUD/JPY: the SAME
  entry renders on the FX pair panel and the indicator card details —
  one entry per id across surfaces. Evidence: 17 screenshots in
  `docs/insights/screenshots/layer1-final/` (all four surfaces × EN/FA ×
  1280/360 + the shared-id catch).
- **No rollback needed**; no live-verification catches (nothing to fix
  post-deploy).
- **Same-session addendum (~09:02 UTC) — the handoff-report commit + the
  docs-pin redeploy**: at the owner's request the session then wrote the
  verification handoff for an independent checking agent
  (`docs/insights/layer1/FINAL-REPORT.md`: scope, file map, gate numbers,
  deployment record, an independent re-audit of the headline claims
  machine-counted from the dictionaries — 129/129 EN+FA entries, 23-term
  glossary parity, 3,152 hand-written strings, 0 banned-word hits in
  indicator copy, all display hooks — and the honest caveats: the 10
  needs-expert-check rows, the D-15 decision-log gap now recorded as
  D-19 with the D-16 backfill, the CI-red note, the pre-existing AU data
  staleness, the thin budget headroom for Layer 2). DECISIONS.md gained
  the backfilled D-16 section + D-19; COPY-REVIEW gained the final
  addendum pointing at the report. Deploy-lock re-checked before the
  redeploy (newest version still this session's `c02d736a` — no parallel
  session), then `pnpm --filter @currena/web build` + `wrangler deploy`
  pinned the version marker to the final HEAD: currena-api
  **`c6d1a13f-8ec3-43dc-b42d-897810efa0dc`** — runtime-identical to
  `c02d736a` (docs-only commits between; asset hashes unchanged),
  re-verified live (health ok, 100 readings, the brent Layer-1 block
  rendering, zero console errors).

## Session record — 2026-10-26c the A-1..A-10 gap-audit build: the ten additions, the 89→100 hop, the two deploy-verification catches

- **Deployed**: `3fc36820-618d-4adf-9772-2c87fddf26c8` (the A-1..A-10
  build, 04:03 UTC — the deploy-lock check first: the versions API
  showed the last upload at 2026-10-25T18:09:57Z, the M7 final, no
  parallel session) → `8ce18f9d` (the 05:03 diagnostic rung) →
  `31fee390` (the rung-split fix + the 05:12/05:14 verification rungs) →
  **`78bfc0df-a796-4d7a-8594-109e140a9779`** (the final state, temporary
  rungs reverted, 05:16 UTC — the designed schedule only). Web + api +
  core + insights round; currena-markets untouched.
- **What went live**: the whole gap-audit family at once — A-1 the
  10y−3m curve leg (the 48th→49th voter), A-2 the JGB daily upgrade on
  the MOF's own CSVs, A-3 the US−Japan carry gap, A-4 the gold/oil
  ratio, A-5 the RBA−Fed gap, A-6 the keyless EIA crude stocks, A-7 the
  CFTC gold COT (49.68% — needs attention on day one, the crowded-long
  zone), A-8 the OECD CLI trio (one filtered SDMX request; the US card
  the 48th voter), A-9 the GPR index (the legacy .xls through the repo's
  own biff reader — not blocked) and A-10 the EPU index. 89 → **100
  indicators, 43 → 48 voting, 0 hidden**. The full per-item log, the
  budget arithmetic and the Assumptions: `docs/insights/IMPLEMENTATION_REPORT.md`.
- **The natural rungs landed it** (no publish rung needed — the deploy
  at 04:03 preceded the 04:10 main): 04:10 main wrote the 100-reading
  snapshot; 04:20 rung-2's bootstrap fired all six feeds (MOF + the
  weekly pair + the monthly trio — a Monday) and patched every rung-2
  reading; 04:40 periodic wrote the monthly history keys.
- **The two deploy-verification catches** (both fixed + verified the
  same morning, the M1† discipline):
  1. The **04:25 daily-history phase died exceededCpu with zero writes**
     — the gap-audit ids grew it past the free plan's per-invocation CPU
     ceiling (proof: brent's stored history still ended 2026-10-23 while
     its stage carried 2026-10-26; a 05:03 diagnostic re-fire vanished
     from the tail with zero log lines — the M1† shape). Fix: the
     recorded rung-split at last applied — 04:25 half a + 04:27 half b.
     Verified live 05:13:10Z ("daily-a — 24 ids → 23 written · 1
     no-series/point") and 05:14:19Z ("daily-b — 23 ids → 21 written ·
     2 no-series/point"); every history key then verified in KV (brent
     @ 2026-10-26 109.53, the T10Y3M decade, the MOF daily tail 135 pts,
     the stocks 1982→2026; cftc honestly unwritten — the single-point
     floor until next Saturday's file).
  2. The **A-6 barrels scale** — caught pre-deploy by the local render
     (the card read "0.7m barrels", 1000× off; fixed to 1e-3 →
     "695.2m barrels"), plus two build-time catches: the OECD parser's
     jumbled-live-export order (the fixture is byte-identical to the
     live file — sort, then assert) and the A-7 stage-accumulation
     deadlock (the `> 1` stage gate dropped the COT file's first point).
- **Live verification** (currena.ir, EN + fa, zero console errors on
  both): all ten new cards with live values — CLI 101.0/97.4/101.0, GPR
  146.2, EPU 218.9, COT 49.7%, stocks 695.2m barrels, the gap 2.05, the
  curve 0.78; the fa cards carry RTL, Persian digits (۱۰۱٫۰, ۱۴۶٫۲) and
  the Persian month stamps; the hero reads "9 of 32 indicators need
  attention" / «۹ شاخص از ۳۲ شاخص نیازمند توجه‌اند». The 89-baseline
  invariance: 75/89 readings byte-identical, the 14 moves all genuine
  market-data updates, **zero status changes**. Evidence:
  `docs/insights/screenshots/a8-a10-2026-10-26/` (local EN/fa + live
  EN hero/full + fa full).
- **Gates**: typecheck 6/6; core 191, scraper 67, insights 644, markets
  13, api 344, web 680 + the recorded 16-failure briefing baseline; lint
  0/15; copy:audit clean (manifest 2958); selfcheck ALL-GREEN with live
  values for all 100 cards. Budgets: entry 295.28/89.64 (raw held);
  Insights lazy 886.44/214.99 — the new documented ceiling 890/215 (the
  D-16 path). EODHD quota untouched (0 requests).

## Session record — 2026-10-26b the M7 reconciliation: the parallel session, the enriched histories, the honest no-overwrite

**Context.** Two sessions worked the M7 milestone concurrently (the second
D-43-class incident): this session cloned the repo at `e7786f4`, read the
tracker's pending M7 row, probed the venues (a temporary m7-venue-probe
Worker — the rba-probe precedent — deleted after the round), and built a
complete parallel implementation; the other session's M7 landed as
`6785ec7` (pushed, deployed `0ce6fa8d`, live-verified) while this session
ran its gates. The deploy-lock check — the D-43 lesson, applied BEFORE any
deploy this time — surfaced the parallel versions (216-219, the last at
18:09:57Z) and the 89-reading live snapshot, and `git fetch` showed
origin/main already at `6785ec7`. **No overwrite happened**: this session
preserved its implementation on a local branch
(`m7-parallel-session-implementation`, never pushed), reset to the
canonical `6785ec7`, and reconciled the one live artifact it had already
applied — the KV history enrichment — into the record.

**The KV enrichment (the surviving contribution, already live).** This
session's backfill migration (run 2026-10-25 ~18:37 UTC, before the
parallel deployment was discovered) seeded the stored NBS histories from
the NBS's own RSS-discovered article archive:

- `insights:hist:china-pmi` — **41 months** (2023-05-31 → 2026-09-30):
  the union of every PMI release's Table 1 (29 articles, each a rolling
  13-month window; the union's oldest row is 2023-05 = 48.8).
- `insights:hist:china-cpi` — **30 months** (2024-04-30 → 2026-09-30):
  one YoY observation per CPI release article (30 articles), every value
  from the article's own "Consumer Price Index" table row.

Verification before writing: the retired manual file's ten hand-entered
PMI values were checked identical against the parsed archive; after the
reset, the committed seeds (`data/manual/china-pmi.json` 10 obs +
`china-cpi.json` 13 obs) were re-checked against the stored KV — **zero
mismatches on every overlap month** (the seeds are strict subsets). The
canonical code's `nbsUnionSeries(seed ∪ stored ∪ fetched)` consumes the
enriched histories directly: the next 04:10 rung builds china-pmi from a
41-point base — **its 10-year position bar renders (pct10y=70% at the
post-fix dry-run)** instead of waiting years of monthly growth — and
china-cpi from 30 points (its bar joins at the November release: the
percentile base excludes the current print, 29 of 30 — honest, not
padded). T-08 re-verified on the full union: the trailing runs are 1 and
1 (the mid-series Mar-May 2025 -0.1×3 run is not a trailing run — the
check reads the series tail), no flags.

**The era-variant knowledge (why the archive parses — recorded for any
future backfill).** The NBS English pages changed phrasing across the
archive; the current parsers match the modern forms, and the pre-2025-07
pages need: titles "Consumer Price Index FOR <Month>" (not "in"), the
lead "the national consumer price index (CPI) ... by X PERCENT
year-ON-year" (not "China's ... X% year on year"), the flat form
"remained flat year on year", and the PMI Table 1 caption WITHOUT the
"Table 1" prefix (the pre-2026-04 pages). The RSS feed
(`stats.gov.cn/english/PressRelease/rss.xml`, 500 items back to 2024-05,
5.6 MB — a one-time sandbox read, never a Worker rung) is the archive
discovery surface. The WZWS wall rate-flags rapid sequential fetches
(venue-verified: 44 articles parsed clean, a faster pass drew JavaScript
challenge pages; 2s pacing fixed it) — the ingest's 3-4-requests-a-day
cadence never triggered it; a challenge is an honest bot-check (T-27).

**The reconciliation round's fixes (this commit).**

1. `packages/insights/scripts/ingest.ts` — the dry-run now uses a REAL
   READ-ONLY store when credentials exist (the no-op store made the
   dry-run misreport "stored accumulation empty" while the KV carried
   the 41/30-point histories, and held cards as unavailable — a
   diagnostic that lies is worse than no diagnostic). Verified live: the
   dry-run now reports "seeds 10/13 · stored 41/30" and china-pmi
   pct10y=70%.
2. `data/shiller/shiller-cape.json` — the refresh cleared the M1 note's
   ~2026-11-15 deadline: shillerdata.com was reachable from this venue,
   the fresh download is hash-identical to the committed file
   (5d176a41, latestDate 2026-10-01, CAPE 40.71 / ECY 0.56%) — the
   publisher has not updated since 2026-10-19; the committed data IS the
   latest that exists. Only the fetchedAt bookkeeping moved.
3. This record + the CHANGELOG §2026-10-26b addendum + the tracker
   session-log entry + the data/manual/README notes.

**The CI observation (owner-side).** The `ci` workflow has failed on
EVERY push since 2026-10-20 (last green: `f72e1a0`, 2026-10-18) —
including pure-docs commits — while every session's local gates ran
green; the failures predate M7 and are systemic (the account's
Actions-minute/runner problems the repo has documented since 2026-10-20).
The logs are no longer retrievable via the API (empty archive). The
local-gates discipline (typecheck/lint/tests/build/budget/copy-audit,
this round all green on the canonical tree) remains the honest
substitute; the CI repair is owner-side.

**Gates this round (the canonical tree + this commit).** typecheck 6/6;
core 191, scraper 67, insights 582, markets 13, api 344, web 680 + the
recorded 16-failure briefing jsdom baseline; lint 0 errors/15 advisories;
copy audit clean; budgets held (entry 295.28/88.81; Insights lazy
846.29/205.01 vs 850/206). No Worker deploy needed: the live `0ce6fa8d`
IS the M7 implementation, the script fix is Node-venue-only, and the
shiller change is data-identical bookkeeping that rides the next deploy.

## Session record — 2026-10-26 M7: the NBS automation lands, china-cpi ships, the BoJ retires

- **Deployed**: currena-api **`366a91de-2ab9-488b-b7b5-3dd58730414b`** at
  17:16 UTC (the M7 code) → `179c3397` (a first temporary 17:45 entry in
  the GATED sweep list — honestly SKIPPED by the gate itself: the last
  status was healthy and only 7.6h old, the failure-gate working exactly
  as designed) → `7655b152` (the ungated temporary publish rungs: an
  18:05 main-shaped run + an 18:07 periodic-history run, the M4 15:40
  pattern) → **`0ce6fa8d-9e76-44d4-8554-b9f68a26bd06`** at 18:10 (the
  rungs reverted — the final state). Web + api round (the diff touches
  `apps/web`, `apps/api`, `packages/core`, `packages/insights`,
  `data/*`); currena-markets untouched.
- **What went live**: the NBS English press-release automation
  (`packages/insights/src/adapters/nbs.ts`) — the index scan (page 2 only
  when a release link is missing) + the PMI release's Table-1 13-month
  parse + the CPI release's YoY parse (the summary-table Y/Y cell
  cross-checked against the headline sentence). `china-pmi` leaves the
  M5 manual-entry regime (source `nbs`, cadence `monthly`; the E-08
  manual expiry leaves the card — the committed seed
  `data/manual/china-pmi.json` becomes the fetch-failure fallback
  history, all 10 observations re-verified identical against the NBS's
  own Table 1 this session). `china-cpi` ships as the 89th indicator —
  SCORED (the 43rd voter) against China's own "around 3%" target, in the
  growth-health lane beside the factory PMI, seeded with 13 verified
  observations (Sep 2025 −0.3 → Sep 2026 +0.9, each from its own
  release page — the provenance table in data/manual/README.md) and
  grown monthly by the stored accumulation. The register row flips
  (`nbs-china`: provider `nbs`, method M2, runtime worker) with the ToS
  quotes recorded.
- **The licence evidence (fetch granted, not assumed)**: the NBS Terms
  of Service (read 2026-10-26,
  stats.gov.cn/english/nbs/200701/t20070104_59236.html) — "Welcome to
  reprint or quote the contents of this website" + the attribution line,
  and Section III "Use of data" item 1: "You are allowed to download and
  use the statistical data on this website." Venue probes: all four NBS
  pages (index, PMI release, CPI release, ToS) answer HTTP 200 from BOTH
  the sandbox and the Cloudflare egress (via the rba-probe worker);
  data.stats.gov.cn easy-query is WAF-blocked (403 UrlACL) and no RSS
  feed exists (404) — the press releases are the only machine-readable
  path.
- **The BoJ fix-or-retire → RETIRE**: stat-search.boj.or.jp is dead
  from BOTH venues (DNS from the work venue; HTTP 530 via the Worker
  venue probe), and www.boj.or.jp's rate decisions live only in PDF
  releases — the OECD mirror's "monthly average, lagged" relabel stays
  boj-rate's permanent source, recorded with the probe evidence.
- **No KV surgery needed**: adding an id is safe for the serve path
  (the stored 88-reading snapshot parses fine — every stored id is
  still valid; the eth-usd lesson applies to REMOVALS only). The
  17:45 publish rung writes the first 89-reading snapshot family and
  the public projection; from then on the 04:10 main rung owns it.
- **Fetch budget**: +3 subrequests typical / +4 worst case (index 1 +
  index 2 + the two release pages) on the 04:10 shape → ~46/50 — the
  free-plan ceiling holds (KV ops don't consume the fetch budget, the
  M6 empirical note).
- **Verification**: local dry-run (sandbox venue, NBS reachable) — the
  index page-2 fallback fired for the PMI link, the Table-1 parsed 13
  months, `china-pmi 50.1 @ 2026-09-30 normal` and `china-cpi 0.9 @
  2026-09-30 normal` computed, the growth lane 28 voters; Worker-venue
  probes 200 on all four pages. The 18:05 publish rung then ran the REAL
  Worker-venue collect and its outcome is captured from the KV state:
  status `generatedAt 18:05:18Z`, 89 readings on the live page, all 4
  NBS fetch rows ok (the index page-2 fallback fired from Cloudflare
  egress), zero genuine source failures; the 18:07 periodic-history
  rung wrote `insights:hist:china-cpi` (13 points, −0.3@2025-09-30 →
  +0.9@2026-09-30) and GREW `insights:hist:china-pmi` 10 → 13 points
  (the fetched Table-1's Sep-Nov 2025 rows) — both history endpoints
  serve 13 points; the public archive 200. The writes' completion is the
  CPU-margin evidence (an exceededCpu death kills the run BEFORE any
  write — the M1† lesson; the run finished and wrote the whole family in
  18.4 s of wall time). The 20:10 designed sweep then read the fresh
  status and skipped — exactly as designed.

## Session record — 2026-10-25 Wave 3 + the Wave-4 probe fix (M6): the leading edge, the BoE's own Bank Rate, and the third recovery

**Context.** A session deployed the Wave-3 bulk overnight (2026-10-25
00:05–00:26 UTC, Worker versions 211 → 214: the code, the temporary
00:15 publish rung that wrote the first 88-reading snapshot family, the
revert) but was cut off before committing — the third sandbox reset to
destroy an uncommitted tree. This session picked up with the live site
already serving all twelve Wave-3 cards + platinum-daily and the git HEAD
still at M5 (53898cc).

**The recovery.** The 14 changed API files came back byte-exact from the
deployed Worker's sourcemap (the 2026-10-23 fac13df precedent — `GET
/workers/scripts/currena-api` returns the esbuild bundle + map with full
`sourcesContent`). The web side was NOT in the bundle (static assets):
the 12 cards' bilingual copy, the display configs and the four new unit
tokens were extracted from the live SPA chunks (Insights-BrnmE1za.js +
labels-BaU8Z0er.js — the minified dictionaries parsed back to typed
source). Two latent defects surfaced and were fixed on recovery: the
scoring.ts `percentileBasis` parameter type (`'level' | 'yoy'` — esbuild
never typechecks, so the deployed Worker ran with a type error that only
`tsc` catches) and three R14 code-like tickers (CFNAI, JOLTS — the
deploying session never ran the web gates).

**The Wave-4 probe fix (the BoE).** The probe afternoon: the Bank of
England's Bank-Rate.asp page answers HTTP 200 from both probe venues
with the complete decision table (258 rows back to 1975, latest 3.75
since 18 Dec 2025) — so `boe-rate` left the FRED OECD monthly mirror
(IRSTCI01GBM156N retired from the enum + bulk group) for the BoE's own
page, under the **UK Open Government Licence v3.0** (the legal page,
quoted 2026-10-25: the Database's data is "subject to the terms of the
UK Open Government Licence, allowing and encouraging free and flexible
data reuse"). New `boe.ts` adapter (the RBA cash-rate-page parse
pattern), expanded to the F1-shaped daily step series over the decade
window, `per-change` cadence (never stale by age, T-08-exempt), a
policy-decisions row for the Dec-2025 cut, the register + licence rows
(sources.ts, licences.ts, RISK_REGISTER.md, LICENCES.md). The other
probes: EODHD au-10y — "not available for your subscription plan" (the
honest no-go); BoJ — stat-search.boj.or.jp fails DNS from the work
venue (the relabel stays the stopgap, carried to M7); NBS — readable
and machine-parseable (the china-cpi follow-up, M7).

**The quality fixes.** The AU quarterly staleness recalibration
(au-wage-growth had false-staled live 2026-10-17: the WPI's
obs-to-release gap is 224d, not 200; now wage 230 / home-values 225 /
housing-finance 230 / saving-ratio 250 / vacancies 240, each documented
with its cycle arithmetic). The weekend T-03/T-08 metals carve-out:
gold-api serves weekend-dated spots that legitimately repeat Friday's
close — four flags every weekend since the seeds began (10-18 and 10-25
archives), zero real freezes; `gold-silver` left TRADING_DATE_IDS (its
legs are gold-api spots) and `spanIncludesWeekend` gates the three T-08
halves for the spot family (BTC deliberately absent — it trades
weekends). The internal archive 2026-10-23 (missing since the D-43
incident) reconstructed from its public twin — identity that day
(0 hidden, 63 readings), schema-validated before the KV write.

**Gates.** typecheck 6/6; core 191, scraper 67, insights 567 (559 + 8
new boe/weekend tests), markets 13, api 344, web 680 + the recorded
16-failure briefing jsdom baseline; lint 0 errors/15 advisories; copy
audit clean (148 new fa strings processed to 2026-10-25-m6-wave3,
manifest 2808 entries); registry regenerated (88 indicators, 0 hidden);
T-15 public passed; budgets held (entry 295.28/88.80; Insights lazy
841.84/203.99 vs the bumped 845/205 — the twelve-card bilingual corpus,
the D-16 path).

**Deploy.** `a4d6ef37` (version 215) uploaded 2026-10-25T03:37:48Z —
33 minutes ahead of the 04:10 main rung, which then ran the recovered
code as its first designed-rung verification (boe-rate's first BoE-
sourced reading + the au-wage-growth staleness heal land in that rung's
snapshot; the exact cpuTime rides the rung's observability).

**Subrequest note (the accounting correction).** The 00:15 publish rung
completed with 41 fetched rows + 6 KV writes — KV operations do not
consume the fetch-subrequest budget on this account, so the working
headroom is the fetch count alone (~42/50 after the BoE addition; the
run.ts accounting comment now records this empirically).

## Session record — 2026-10-24b Wave 2 (M5): the euro long end's daily fix, the Pink Sheet unlock, the EM-pressure first member

- **Deployed**: currena-api **`479e7835`** (final; the chain: the M5 code
  deployed 16:12:36Z with the TEMPORARY 16:25 publish rung — the M1
  pattern, captured then reverted — and the final revert-redeploy). The
  16:25 rung wrote the first 76-reading snapshot family (every write
  completed, the same binary signal as the M4 rung). currena-markets
  untouched.
- **The review's honest negative RESOLVED at the deploy's doorstep**: the
  AAA 10y series key was live-verified this round —
  `YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y` ("AAA yield curve - 10-year spot
  rate") on `data-api.ecb.europa.eu`; the review's four candidates 404'd
  because they probed dotted/FM forms. The G_N_C sibling is the ALL-rated
  curve (4.10%) — G_N_A is the AAA one (3.38%).
- **Subrequest arithmetic**: the M5 round adds ONE fetch (the ECB AAA
  decade window) — the 04:10 main shape now 49/50. The Pink Sheet trio
  adds zero (the same workbook, a second sheet read) and TRY adds zero
  (the ninth leg of the one Frankfurter request).
- **Live verification** (evidence under
  `docs/insights/screenshots/m4-2026-10-24/`, the m5-* files): the public
  API serves 76 readings — euro-aaa-10y 3.3844 @ 2026-10-22 (top 1% of
  its decade), food-index 124.1 @ 2026M09 (top quintile), wheat 278.6,
  maize 239.6 $/mt, usdtry 49.738 @ 2026-10-23 (the top of its decade —
  the inflation→devaluation case study). Browser-verified EN+fa: the
  usdtry card renders **"₺49.74"** with the new try unit token and its
  highRising line; the euro-AAA card carries the ECB Data Portal source
  link beside ecb-dfr; the food trio renders in both locales
  («قیمت جهانی خوراکی», «قیمت گندم», «قیمت ذرت») with the World Bank
  source links — zero console errors. EODHD quota untouched.

## Session record — 2026-10-24 Wave 1 (M3+M4): the early-warning pack, the OD-5 honest no-go, and the rule-text scale fix

- **Deployed**: currena-api **`21d0b040`** (the round: core schemas + the
  insights engine + the web copy/display configs; the SPA rebuilt with the
  eight new cards) → **`5924ed4f`** (the temporary 15:40 UTC publish rung,
  the M1 pattern) → **`c1b36019`** (the rung reverted — the designed
  04:10/04:25/04:40 + 10:10/20:10 schedule only) → **`160ac6e2`** (the
  rule-text scale fix the live verification caught). currena-markets
  untouched. **The D-43 deploy-lock check ran before the first deploy**:
  the versions API showed the last upload at 2026-10-23T23:01Z (the M2
  reconciliation) — no parallel session.
- **The deploy lock's second lesson (a self-near-miss, honestly noted)**:
  the temporary publish rung was deployed, captured, and reverted by
  `git checkout` + redeploy — the temporary state never entered a commit.
  The observability cpuTime query + a mis-pathed `wrangler tail` both
  missed the 15:40 window; the completed-writes evidence (stage +
  snapshot + status + archives + public projection all landed at
  15:40:18Z — the pre-fix exceededCpu mode died *before* any write) is
  the recorded binary signal, and the exact cpuTime rides the designed
  20:10/04:10 rungs for the next session's tail.
- **Additions need no KV surgery** (the M2 contrast): the stored 63-reading
  snapshot served unchanged behind the new code (the old enum is a subset;
  the new cards read `unavailable` for the ~10 minutes until the rung), and
  the 15:40 rung wrote the first 71-reading snapshot family. The new ids'
  history keys fill at the next 04:25 (daily-cadence: sofr, us-2y,
  breakeven-10y) / 04:40 (periodic: claims, recession-probability, the
  Michigan pair, core PCE) rungs from the stage the 15:40 run wrote — the
  cards show the honest "No chart history for this card yet" until then.
- **The one live defect**: the rule-text renderer did not apply a card's
  display scale to its threshold — recession-probability (stored fraction
  0.5, displayed ×100) read "above 0.5%" instead of "above 50%". Fixed in
  `labels.ts` (formatRuleText passes `DISPLAY[id].scale` to the threshold
  atom), redeployed, re-verified in both locales («بیشتر از ۵۰٪»).
- **Live verification** (evidence under
  `docs/insights/screenshots/m4-2026-10-24/`): the public API serves 71
  readings; the hero "7 of 25 indicators need attention"; the growth gauge
  Cautious 2-of-8 (recession probability 62% · +38.00 pts · warning;
  Michigan 48.1 bottom-decile warning with its "Expected inflation next
  year: 4.6%" companion; claims 194,000 normal); SOFR 3.90% context with
  the "New York Fed via FRED" citation; us-2y 4.65% and breakeven-10y
  2.34% context; the fa hero «۷ شاخص از ۲۵ شاخص نیازمند توجه‌اند» — zero
  console errors in either locale. EODHD quota untouched (0 requests).

## Session record — 2026-10-23b the subtraction set (M2): two retirements, one demotion, five honest relabels

- **Deployed**: currena-api **`75517285`** (packages/core + insights + the
  web copy dictionaries; the SPA rebuilt with the relabels and the retired
  cards' copy removed). currena-markets untouched.
- **The order that kept the page up**: the KV surgery ran FIRST
  (`scripts/retire-ids-migration.ts`, 16 writes + 2 deletes, dry-run
  verified before the real run) — the old code's id enum is a superset, so
  it served the migrated 63-reading docs unchanged; the new Worker
  deployed after, and the next 04:10 rung rebuilds everything from source.
  The eth-usd lesson (2026-10-21c) applied in full: an id retirement is a
  schema migration for every stored snapshot-family document — the live
  snapshot, the public projection, all 7 daily archives (10-15 … 10-22)
  and their public twins (each day's own hidden-set filtering preserved),
  plus the orphaned `hist:nzd-usd` deleted. Every rewritten doc was
  validated against the NEW schema before writing.
- **The m2-us consistency touch**: the migration also sets the stored m2-us
  reading to `context` (what the new engine produces for an info rule) so
  the served card and the recomputed 22-voter summary agree in the window
  before the next rung.
- **Live verification (browser, both locales)**: hero "5 of 22 indicators
  need attention" (was 23 voters); the M2 card renders Context with its
  US$23.3T value and FRED attribution, history still serves; `nzd-usd` and
  `silver-btc` absent from the page and answering 400 on their history
  routes; the archives serve (10-22, 10-16 probed); the Bund details panel
  carries the relabel — EN "…an OECD monthly series via FRED
  (IRLTLT01DEM156N) — monthly average, lagged, so it can sit behind the
  day's traded yield", fa «میانگین ماهانهٔ با تأخیر، پس ممکن است از بازده
  معاملات روز عقب بماند». No console errors.
- **Gates at close**: typecheck 6/6; core 191, scraper 67, insights 557,
  markets 13, api 344, web 680 passed + the recorded 16-failure briefing
  jsdom baseline; T-15 public passed (0 hidden); budgets held and the
  Insights lazy chunk SHRANK with the retirement (753.26/181.51 vs the
  765/186 budgets). EODHD quota untouched (0 requests).
- **Carried follow-ups**: the daily-source probes for the OECD mirrors
  (BoE/BoJ venue probes, the ECB AAA 10y key verification) stay queued as
  M6/Wave-4 work — the relabels are the honest stopgap.

## Session record — 2026-10-23c the reconciliation: M1†† (the epochDay CPU margin) lands on top of M2 after a parallel-session overwrite

- **What happened (the honest incident)**: two sessions worked the same
  tracker this evening. The M2 session deployed `75517285` at 21:55 UTC
  (M2, no CPU fix); the CPU-margin session — unaware of it — deployed
  `b6e1541b` at 22:11 from the pre-M2 tree + the epochDay memoization,
  OVERWRITING the M2 build. Its 22:35 diagnostic sweep rung then wrote a
  65-reading snapshot, re-adding the just-retired readings to the stored
  documents. Nothing unauthorized served (both endpoints of the ~90-minute
  window were owner-approved states: 65 pre-M2 / 63 post-M2), but the
  re-poisoned documents needed a second migration pass.
- **The CPU regression the second session had opened with**: the 20:10 UTC
  sweep died `exceededCpu` at exactly **cpuTimeMs 2050** on `32c47cad` —
  captured via the observability telemetry query after the fact (a live
  `wrangler tail` could not survive the sandbox's process reaping). The
  M1† cache's 1831 ms left ~220 ms of headroom; run-to-run variance ate
  it; the newly-blocked RBA cash-rate page (kind `blocked`) keeps the
  sweep gate firing every sweep. Root cause via `node --cpu-prof` on the
  local ingest twin: `epochDay` at ~0.84 s self time — the
  `assertAscending` debug invariant re-walks whole series per operation.
  Memoized in `series.ts` (local draft phase 0.78 s → 0.12 s); the 22:35
  diagnostic rung completed live at **cpu 617 ms, outcome ok** (snapshot +
  status + stage + public projection written). Margin ~3.3×; the
  rung-split follow-up retired.
- **The reconciliation itself**: reset onto the M2 tree (`ef84606`),
  re-applied the epochDay memoization + its two behavior tests + the
  reverted-rung note in `insights-ingest-cron.ts`, merged the docs (this
  record + the CHANGELOG's M1†† and incident sections + the tracker's
  M1†† row + D-43), and closed the copy-manifest gate the M2 tree had not
  (the 10 relabels + 18 removals round-tripped; the shiller 14
  re-processed after the earlier reset lost the 2026-10-23a round; audit
  exit 0, 2,504 entries). The M2 session's `retire-ids-migration.ts`
  stays the canonical migration script; the parallel session's
  `retire-ids-m2.ts` was dropped in the reset.
- **The re-migration + redeploy (this commit's ship)**: re-run
  `retire-ids-migration.ts` (idempotent by design — the 22:35 rung
  re-poisoned only the live snapshot + the public projection; the
  archives the first pass cleaned stay clean) with a dry-run first, then
  deploy the reconciled build (M2 + M1†† together). The next 04:10 main
  rung then rebuilds everything from source with both fixes — expected
  ~700–800 ms CPU (the 22:35 sweep measured 617 ms; the main shape
  carries ~7 more writes).
- **Gates at close**: typecheck 6/6; core 191, scraper 67, insights 559
  (+2 epochDay behavior tests), markets 13, api 344, web 680 + the
  recorded 16-failure briefing jsdom baseline; lint 0 errors/15 accepted
  advisories; T-15 passed; budgets held (Insights lazy 753.22/181.51);
  copy:audit exit 0. EODHD quota untouched (0 requests).

## Session record — 2026-10-23 the Phase-2 open: the unhide round (Shiller + china-pmi), the rung CPU fix, and the sourcemap recovery

- **Deployed**: currena-api **`34a8e385`** (the unhide wiring + registry +
  licences), then **`25f613f2`** (the baseReadingCache CPU fix + phase
  timings + the temporary hourly :05 diagnostic rungs), then **`32c47cad`**
  (the diagnostic rungs reverted to the designed 10:10/20:10 pair — the
  final M1 shape). currena-markets untouched. The SPA rebuilt from the
  changed tree (the About-sources panel now shows shiller on).
- **The outage the round opened with (root-caused live)**: both the 04:10
  main rung and the 10:10 sweep had been dying SILENTLY since the
  2026-10-22 reliability deploy — the page was serving the 15:05 manual
  heal. Temporary hourly diagnostic rungs + `wrangler tail` captured three
  identical deaths at exactly **cpuTime 2050 ms** (the free plan's ~2 s
  budget): the rung's snapshot build ran TWICE (validation draft + final
  with flags) and the deterministic percentile work over 10-year windows
  blew the budget during collect. Fix: `baseReadingCache` in
  `adapters/snapshot.ts` — the deterministic per-reading base is memoized
  across the two builds (they differ only in `flags`, applied after the
  cache point); clone-on-hit keeps the builds private. The fixed **16:05
  UTC rung completed healthy at cpu 1831 ms** (snapshot + stage + public
  projection all written, 62 series staged). Known thin margin: the main
  04:10 shape carries ~7 more writes than the sweep (~140–220 ms); the
  10:10 sweep is the proven self-heal, the rung-split is the recorded
  follow-up if the main shape ever dies at the write tail.
- **Live verification (browser, both locales)**: `china-pmi` 50.1 Normal
  with the honest manual-entry attribution (growth gauge 6 members, global
  voting pool 22→23); `shiller-cape` 40.71 / `shiller-ecy` 0.56% with the
  publisher's attribution card; the market-stress lane's "Show all hidden
  indicators" expansion gone (nothing left to hide); FA renders the same
  cards with fa-IR digits. Public readings 65/65, `hiddenIndicatorIds`
  empty.
- **The sourcemap recovery (honest record)**: the M0+M1 working tree was
  lost to a sandbox reset before its commit. The deployed Worker's own
  source map (fetched via the Cloudflare API script-content endpoint)
  yielded the seven changed files byte-exact (`sources.ts`, `data.ts`,
  `run.ts`, `adapters/snapshot.ts`, `insights-ingest-cron.ts`,
  `site-mode-overrides.json`, `indicator-audit.json`); the
  generate-time-only `licences.ts` display flips, the register/licence doc
  twins, and the test pins were re-derived against the recovered audit —
  `registry:generate` output then matched the deployed audit on all 65
  entries (0 diffs). Two pre-existing test bugs fixed while re-running the
  gates: the sweep integration fixture was a date bomb (fixed
  generatedAt → real-clock-relative) and two prices-cards pins were
  date-conditioned `getByText` collisions (→ `getAllByText ≥ 1`, the
  file's own pattern).
- **Gates at close**: typecheck 6/6; core 191, scraper 67, insights 557,
  markets 13, api 344, web 680 passed + the recorded 16-failure briefing
  jsdom baseline (unchanged, untouched files); budgets held (entry chunk
  untouched, Insights lazy 603.9/142.6 vs 604/142.8). EODHD quota
  untouched (0 requests). The diagnostic rungs' three captured CPU deaths
  are in the observability query log (query
  `grep "exceededCpu"`, 2026-10-23 13:00–16:10 UTC window).
- **Open item carried**: `shillerdata.com` unreachable from the work venue
  — the committed converted file (latestDate 2026-10-01) must be refreshed
  from a reaching venue via `packages/insights/scripts/shiller-fetch.ts`
  before the 45-day freshness window closes (~2026-11-15).

## Session record — 2026-10-22 the data-source reliability round: TGJU verdict, FRED fallbacks (Treasury + EIA), and the self-healing sweeps

- **Deployed**: currena-api **`b37cf0d9-be61-425e-9b60-87c161662960`** (apps/api +
  packages/insights; no web/markets changes — the SPA rebuilt from an unchanged
  tree). currena-markets untouched. GitHub `main` = this commit.
- **The investigation first** (the owner's mandated order — findings presented
  before any code):
  - **TGJU's economics section is DISQUALIFIED on freshness**: the entire
    /economics/ world section (bonds, stocks, currencies, 157 country-list
    indicators) is FROZEN at Apr–Jun 2026 — 4–5+ months stale (some series
    2021/2023), with duplicate-value bugs (GBPUSD = AUDUSD = 0.70739; UK 10Y =
    Japan 10Y = 2.7210) and values that now deviate from FRED/ECB/EODHD by
    0.6–2.7% (FX) and −61bp (US 10Y: TGJU 4.54 Jun-08 vs Treasury 5.13 Oct-21).
    Their upstream (Trading-Economics-style) feed lapsed ~Jun 8, 2026. The
    Iranian-market ajax.json stays live to the minute (the converter's source —
    untouched).
  - **TGJU's licence is prohibitive regardless**: the site footer states
    «هر گونه کپی برداری از محتوا، تولیدات، شکل و سایر اجزای سایت صرفا با
    موافقت مکتوب مجاز می باشد» — copying requires written consent. The I15
    retirement of TGJU from Insights stands; nothing was built on it.
  - **The real bottleneck was OUR egress, not TGJU**: the live 2026-10-22
    `insights:status` showed ALL FIVE FRED bulk groups failing
    `unexpected header (expected "observation_date,…")` — FRED's Akamai edge
    intermittently serves unparseable bodies to the Cloudflare venue (the same
    class reproduced from the build sandbox: HTTP/2 INTERNAL_ERROR stream
    resets 2/4 attempts, then clean 200s). FRED itself was healthy and FRESH
    (DGS10 5.12 @ Oct-20; Treasury's own curve 5.13 @ Oct-21 — one day ahead).
    With F-11 single-attempt fetches and the only collect rung at 04:10 UTC,
    one edge blip = 24h of public staleness: the public face sat at 28 stale
    readings (us10y @ Oct-19, wti @ Oct-14 missing a $6 move) while every
    number was fetchable.
- **The fix — three layers, all venue-verified by the currena-venue-probe
  worker (deployed, harvested, deleted — Treasury 200 in 18–21 s, EIA 200 in
  28–215 ms, RBA f2 still 403, Bundesbank 520/404, Cboe 404):**
  1. **Treasury.gov fallback adapter** (`treasury.ts`): the daily par + real
     yield-curve CSVs — the PRIMARY source of DGS2/DGS10/DGS30/DFII10, one day
     fresher than FRED in practice. Fills the yield family when FRED groups
     1/2 fail (T10Y2Y recomputed as 10Y−2Y at FRED's own formula); current-year
     CSVs merged with the STORED KV histories so percentile10y keeps its true
     10-year base (the Brent-Yahoo merge pattern).
  2. **EIA fallback adapter** (`eia.ts` + `biff.ts`, a dependency-free
     OLE2+BIFF8 reader): the RWTCd/RBRTEd/RNGWHHDd daily-spot .xls workbooks —
     the PRIMARY source of FRED's DCOILWTICO/DCOILBRENTEU/DHHNGSP, FULL
     history each. Cross-validated live: EIA 2026-10-20 WTI 107.89 ==
     FRED DCOILWTICO exactly (and the April-2020 −36.98 negative close parses).
  3. **Failure-gated intra-day sweep rungs** (10:10 + 20:10 UTC, no new cron
     trigger — the minute cron's gates): when the last rung recorded genuine
     fetch failures (kind failed/blocked/format-changed — the honest 'disabled'
     venue-skip rows are NOT triggers) or is >10 h stale, the full ingest
     re-runs in sweep mode (archive writes + seed appends skipped for the
     subrequest ceiling). Healthy days cost ONE KV read.
- **Fallback discipline (the owner's terms)**: FRED stays the PRIMARY — the
  fallbacks fire ONLY on group failure, fill ONLY the failed groups' slots,
  and every filled reading's sourceName switches to the actual source via the
  new `readingSourceOverrides` (e.g. us10y → "U.S. Department of the Treasury
  (daily par yield curve)", wti → "U.S. Energy Information Administration
  (WTI spot, FOB Cushing)"); mixed-leg derived cards get honest mixed names
  ("RBA F2 − U.S. Treasury (10 Yr)"). Both sources are US-government public
  domain (17 U.S.C. § 105) — registered L0 in SOURCE_RISK_REGISTER
  ('us-treasury', 'eia-spot') + SOURCE_LICENCES with quoted evidence.
  Series with no licence-safe fallback (VIX, STLFSI4, NFCI, T5YIFR, the
  monthlies, OECD family) hold stale with honest flags — fail-closed.
- **Live verification (production, same day)**: a temporary 15:05 sweep rung
  (deployed, watched via wrangler tail, removed) fired against the morning's
  FRED failures and HEALED the whole page: staleCount 28 → 1 (only
  au-wage-growth's normal quarterly cadence), validation suite 14/14 pass
  (T-05 failed at 04:10), the global voting pool 5 → 22 readings (the outage
  had gutted it), us10y 5.12 @ Oct-20, wti 107.89 @ Oct-20 (the $6 move
  captured), vix 16.68 @ Oct-21. FRED served healthy on the sweep's retry —
  the primary path restored itself, which is exactly the design; the
  Treasury/EIA layers stand behind it for the days it doesn't.
- **Also this round**: REFRESH_SECRET rotated again (the sandbox reset lost
  the 2026-10-21 value — new value in apps/api/.dev.vars, gitignored; the
  manual /internal/insights-ingest lever still dies at ~22 s CPU / error 1102,
  re-verified — the scheduled rungs + sweeps are the real ingest path).
  wrangler CLI's `kv key get` misbehaves with this token (silent "Value not
  found") — the REST API reads fine.
- **Tests**: +55 (555 total in insights: treasury parse ×10, EIA/BIFF ×8
  including the real-workbook-shape fixture, collect fallback wiring ×5 —
  healthy-run-never-fetches, malformed-body class, merge-with-stored-history
  + attribution overrides, EIA fills, fallback-failure isolation; + the
  32 existing suites all green) and +14 in apps/api (344 total: sweepShouldFire
  ×5, rung minute wiring ×2, the gated runScheduledInsightsSweep ×2). Known
  pre-existing failures untouched: apps/web's 16 jsdom radio-role tests and 1
  eslint react-hooks error (verified failing on the clean tree via git stash).

## Session record — 2026-10-20g the map's owner round: all sixteen indices, marching ants, 60% names, 3D pins

- **Deployed**: currena-api **`49380c2e-a1bd-41be-bd55-1312653f0e8f`** (web-only
  round — the diff touches `apps/web` + docs; currena-markets untouched
  `6465694c`). GitHub `main` = `c1c7699`.
- **Change** (the owner's four directives on the live map): (1) **every
  remaining index joins** — all SIXTEEN registry indices pin and card (was
  9): the NY trio fans off the exact city (Dow SW, Nasdaq NE, S&P on New
  York), Toronto/Paris/Taipei pin on their cities, the Euro Stoxx 50 pins
  at Brussels with iso `null` (the app's country field for it is
  "Eurozone" — it tints nothing, honestly), Hang Seng pins at Hong Kong
  (iso 344 has no 110 m path — tints nothing by construction); a country
  hosting several indices tints by its **strongest fresh mover** in the
  selected period (never an average); the card layout re-bands for 16
  (top 6, left 3, right 3, floats + bottom 2) with `MAP_CARD_WIDTH_PCT`
  15→14.5 and short names for Nasdaq / S&P/TSX / Stoxx 50; (2) the
  selected country wears an **animated marching-ants dash**
  (`stroke-dasharray 3.5 2.8`, `wm-ants 1.05s linear infinite`, one
  dash-period per cycle) instead of the uneven solid stroke, and honours
  `prefers-reduced-motion` (dash stays, march stops); (3) the selected
  country **writes its short name at 60% ink** (USA / Brazil / Australia
  …, Persian in fa — آمریکا), one label at a time, tuned anchors
  (`MAP_LABELS`) hand-cleared against all sixteen cards + leader lines +
  pin bulbs, path-less rows (Hong Kong, the Eurozone) carry absolute
  anchors; (4) every index renders a **3D pin** — a filled red/green
  teardrop (filled whether open or closed, like a pin on a map) with a
  rim cut ~22 mix-points hotter than the fill, a specular highlight, a
  ground shadow and the legend-keyed open/closed core; the flat dot and
  its halo retire; the tint mixes over the `--wm-land` token (monotone
  distance from neutral in both themes) and the mark ramp tightens
  60→90 (rim fill+22 cap 100, so fill ≠ rim at every weight).
- **Gates**: world-map plw **45/45** (new: the ants march + reduced
  motion, the label texts + 60% + retirement + FA, the pin anatomy +
  fill ≥3:1 vs land AND surface + rim ≠ fill, the aggregation honesty
  trio — strongest-mover tint / removing one US index keeps the tint /
  removing all three neutralises the country, the UK flat-band floor
  t=34%) · U-suite 19/19 · screenshots 4/4 · web vitest 698/698 · every
  repo suite green (1,835) · typecheck + eslint 0 errors + copy:audit
  clean (+17 fa entries triaged, round `owner-2026-10-20g-map-pins-labels`)
  · 20 map screenshots + 4 section screenshots regenerated.
- **Verified live** (currena.ir, agent-browser + VLM): land 173, pins 16,
  cards 16, lines 16, map layout at 1440; real hover on the S&P 500 card →
  US `wm-c s-u on` with `wm-ants` + `3.5px, 2.8px` and a **marching**
  offset (−1.999 → −4.398 px across 400 ms) + label **USA at opacity
  0.6**; leaving the map retires both; all 16 pins carry highlight +
  shadow + core with live directions (dow/tsx/ibov/cac/dax/stoxx50/
  nifty50/taiex/n225 red-down, sp500/ndx/ftse/hsi/ssec/kospi/asx200
  green-up, all honestly closed); exactly **12 tinted countries**
  (036 076 124 156 158 250 276 356 392 410 826 840 — no HK, no Eurozone);
  fa: RTL page, LTR stage, hover → آمریکا at 0.6; 390: list layout,
  16 pins, 173 land, zero horizontal overflow; VLM PASS (3D teardrops
  red/green, 16 cards in the intended bands, tints, "professional and
  highly readable"); zero console/page errors.
- **PWA note**: unchanged from 2026-10-20f — one transitional visit while
  the old SW updates (the new SW precaches both SVGs).
- **Evidence**: `docs/evidence/2026-10-20g-map-pins-labels/` (README + 3 live
  captures: EN 1440, fa 1440, EN 390 list).

## Session record — 2026-10-20f the map's owner round: visible borders, centred box, D/W/M cards, relative colours

- **Deployed**: currena-api **`8399274f-01d8-483e-a8af-758e07c0d322`** (web-only
  round — no API/markets/core change; currena-markets untouched `6465694c`).
  GitHub `main` = `07baddc` (first cut `eaa7c85` + the name-row fix).
- **Change** (the owner's four directives on the live map): (1) the country
  borders leave near-white for a visible 32%-ink grey at 0.7 units + a deeper
  10% land fill; (2) the map box CENTRES at `calc(100% - clamp(150px, 20cqw,
  280px))` in the map layout — 254px under the module at desktop, 0px
  off-centre, the list layout and the header/switch/legend keep full width;
  (3) every card gains the Day/Week/Month performance triplet (triangle
  up/down + 1dp signed percent, green/red, the selected period emphasised,
  `chg1w` joins the feed; the switch speaks Today | 1 week | 1 month — the
  map's 1Y retires, the section's own lens keeps the yearly view; the
  Open/Closed tag becomes the legend-keyed state dot so every EN name fits,
  No data / Old data keep their words); (4) the colour scale turns RELATIVE —
  `mapWeightOf` normalises each period on its biggest fresh mover (honest
  flat band kept, 0.75-power curve) driving `--t/--m/--b/--i` color-mix ramps
  of the existing status tokens (no new hex); the five-step thresholds and
  the threshold legend retire for a red→grey→green gradient key
  (RTL-mirrored, "Bigger fall / Bigger rise").
- **Gates**: world-map plw **38/38** (a NEW no-clip test — 7/9 EN names
  clipped at the 1280 fixture width before the state-dot fix — plus the
  centring probe, border ≥1.3:1, monotonic tint distance per direction,
  triangle directions, the 20 regenerated screenshots) · U-suite 19/19 ·
  screenshots 4/4 · web vitest 698/698 · every repo suite green (1,835) ·
  typecheck + lint 0 errors + copy:audit clean (9 new fa keys triaged:
  periodWeek/periodWordWeek/cellD/cellW/cellM/legendMoreDown/legendMoreUp/
  srPerf/srVal; 5 retired) · one pre-existing lint error in markets.test.ts
  fixed.
- **Verified live** (currena.ir, agent-browser + VLM): module 1272 → stage
  1018 (inset 254, centred 0); land 173 paths; border srgb(.769 .783 .797)
  on land srgb(.928 .932 .936); sp500 card 1D +0.4% ▲ / 1W −1.5% ▼ / 1M
  +0.5% ▲ with 1D selected (matches the served rows); measured --t weights
  KOSPI 66% (max +1.76) … IBOV 37% (−0.17) — monotone in |move| per
  direction; zero name/tag clips; fa: RTL page, LTR stage, روزانه/هفتگی/
  ماهانه cells, FA gradient legend, ۵ از ۹ بازار امروز مثبت; 390 list
  layout full-width, zero overflow; VLM PASS on all four asks + no
  truncation; zero console/page errors.
- **PWA note**: a returning visitor's pre-map precache SW can blank the land
  during its one-visit update window (its SPA fallback answers the SVG
  fetch); the loader is retryable and the new SW's precache carries both
  SVGs — self-heals on the next visit, fresh visitors unaffected (observed
  live, see the evidence README).
- **Evidence**: `docs/evidence/2026-10-20f-map-owner-round/` (README + 3 live
  captures: EN 1440, fa 1440, EN 390 list).

## Session record — 2026-10-20e the world markets map (the Insights geographic layer ships)

- **Deployed**: currena-api **`1f96deaa-e610-4387-92a2-d999cc446a16`** +
  currena-markets **`6465694c-8e56-4726-8e5c-d011e9f35c99`** (both workers —
  the round touches web + packages/core + packages/insights/markets).
  GitHub `main` = `5d6c5ad` (merge of `feature/insights-world-map`, 4 commits:
  spec docs → B1/B2 asset pipeline → MAP D1/D2 data → M1–M17 module).
- **Change**: the Insights world-stock-markets section gains the map
  presentation layer — a quiet Natural-Earth land (173 paths, 80 KB committed
  SVG, `data-iso` keyed), the nine west-to-east indices as halo'd open/closed
  dots with leader lines and callout cards (container-query map/list switch at
  960px; the phone list keeps the explorer below as the entries, M13),
  per-country rise/fall tints on the §4.2 thresholds, the Today/1 month/1 year
  switch + breadth summary + one-row legend, M9's "Updated {time} · age"
  header line, honest no-data/old/failed/loading states, an LTR map inside the
  RTL Farsi page, and the D1/D2 quote-freshness fields (`open`, `quoteTime`)
  joining the stored contract — currena-markets' 23:30/01:30 UTC runs start
  writing them; until the first such run the pre-deploy snapshot honestly
  renders Closed (D2's absent-⇒-closed rule). JSE stays deferred (not in the
  registry — the owner's covered-only rule). Spec + full §9 evidence in
  `docs/insights/` (20 screenshots at 5 widths × en/fa × light/dark, geometry,
  contrast, axe, keyboard, Farsi, KV-budget proof).
- **Gates pre-merge** (on the branch): the full §9 suite 36/36 · every repo
  suite green (web 698/698 among them) · U-suite 19/19 · screenshots 4/4 ·
  typecheck + lint + copy:audit clean.
- **Verified live** (currena.ir, agent-browser, ~15:40 UTC): the two SVGs
  serve 200 byte-identical to the build (79,968 B + 12,228 B); the module
  lazy-loads on approach (IntersectionObserver) and renders 173 land paths,
  exactly 9 tinted countries with the served steps (DAX −1.18% `s-sf`,
  KOSPI +1.76% `s-sr`, Ibov −0.17% `s-fl`…), 9 dots + halos + leader lines,
  9 cards in §4.1 order with live values, the period switch, the legend,
  "Updated 11:30 PM UTC · 16 h ago"; 1440 = map layout (module 1272px),
  390 = list layout with the explorer carrying the entries, zero horizontal
  overflow; fa: RTL page, LTR stage, Persian digits/٪/U+2212; VLM pass on the
  EN capture (no overlap/clipping); `/api/insights/markets` 200 with 16 rows;
  zero console/page errors.
- **Evidence**: `docs/evidence/2026-10-20e-world-markets-map-live/`
  (README + 3 live captures: EN 1440 map, fa 1440 map, EN 390 list).

## Session record — 2026-10-20d the World card's photo band (the owner's New York picture)

- **Deployed**: currena-api **`fe94fe99-bf15-4042-8064-53a3bf640222`**
  (SITE_MODE=public untouched; currena-markets untouched `3f245d75`).
- **Change** (web-only round — no API/markets code changed): the owner's
  directive "Use this picture, turn it to webP, and use it for the World
  container. so both containers aus and world now have picture." — the
  uploaded `new-york-bg-fade.jpg` (1400×248, Sydney's own band format)
  becomes `apps/web/public/assets/artwork/new-york-bg-faded.webp` (18.7 KB,
  one recorded normalization: contrast ×1.4 + brightness ×0.97 to Sydney's
  measured band weight, zero clipping) and the World (Global) region card's
  `.ei-hero-art--global` band carries it over the same 26% veil family,
  framed at **72%** (Sydney's own offset — the Empire State / One WTC
  cluster) with the bottom fade completing at **30% desktop / 34% mobile**
  instead of 46%: this skyline rides the photo's middle third, and the old
  fade dipped the whole skyline under a 73-100% surface wash (row-level
  render measurements showed 0.0 detail where the skyline should be). The
  "map must stay even quieter than Sydney" sub-rule retires with the map;
  `global-map-faded.webp` stays in the tree, unreferenced, for the record.
  VerdictMeter's art-band comments updated to describe both photos. No
  data, scoring, export or copy change.
- **Gates pre-deploy**: web 698/698 · typecheck 6/6 · lint 0 errors / 15
  accepted advisories · copy:audit clean (no strings changed) · visual
  19/19 (U-01..U-14 on the new band; verified against the committed
  fixtures directly) · budgets held with NO JS change (entry 295.28/88.81,
  Insights 697.38/167.88 vs 296/89.5 and 700/169) · the webp rides the PWA
  precache (113 entries).
- **Verified live** (currena.ir, agent-browser): `/assets/artwork/
  new-york-bg-faded.webp` → **200 image/webp**; the live `.ei-hero-art--global`
  rule carries the new-york URL at `72% 50%`; 2 art bands in the DOM
  (global + australia); the band photo-half detail on the live EN capture
  measures **7.6 (World) vs 4.4 (Australia)** — the NYC skyline is at least
  as present as Sydney's, with the Statue of Liberty · Lower Manhattan ·
  Brooklyn Bridge readable in the VLM pass ("distinctly visible … easily
  identify it as a cityscape"); titles/pills/count lines readable over
  both bands EN + fa; fa RTL shows the band (detail 4.8); mobile 390
  scrollWidth **390** (zero overflow); console + page errors **zero**;
  `/api/insights` 200 with 32 readings (the data surface untouched).
- **Evidence**: `docs/evidence/2026-10-20d-world-card-new-york-art/`
  (README + 3 live screenshots: EN 1440, fa 1440, EN mobile 390).

## CURRENT DEPLOYMENT — the yearly lens on the world stock indices: a fifth view (Daily → Yearly), a real chg1y, a 1-year table column (2026-10-19 (yearly lens) owner round 5, workers 96c4a467 + 18cf040e)

Owner round 5 — "add yearly view to the stocks indexes" — is LIVE on
`/#/insights`: the period radiogroup now offers FIVE lenses — Daily |
Weekly | Monthly | Quarterly | **Yearly** («سالانه»), Quarterly still the
default — over a REAL stored `chg1y`: an OPTIONAL contract field on
`MarketEntrySchema`, derived by the markets pipeline's `yearAgoAnchor`
(the strict 365-day rolling anchor, falling back to the series' earliest
close inside the ±15-day tolerance band — the repo's year-on-year
convention; windows closer than 350 days omit the field), with the Yahoo
fallback fetch widened to `range=2y` so the anchor always has real
closes. Every view surface follows through the one `viewValue` lens map
(breadth + coverage note, movers, tiles, heatmap scale, aria); the full
table gains a **"1 year"** column (desktop + mobile list) appended at the
END; `markets-csv` appends "1 year %" at the END (position-pinned scripts
keep their indices); full-export rides the existing `chg1y` slot. Three
new copy keys × 2 locales (`viewYearly`, `thYear`, `csvColYear` —
manifest round `markets-yearly-lens-2026-10-19`); 6 new test guards
(1,612 workspace tests). Evidence + 16 screenshots:
`docs/insights/yearly-lens-verification.md`.

- **Active workers**: currena-api **`96c4a467-1d2b-49d8-bfb7-748ca30d3486`**
  (SPA + API — the yearly-lens UI; SITE_MODE=public, RATES KV + ASSETS
  bindings, the `* * * * *` keep-warm cron unchanged) AND — this round is
  NOT UI-only — currena-markets
  **`18cf040e-70f0-4f08-8582-a0b3e0c2d29e`** (the worker whose
  `30 23 * * 1-5` / `30 1 * * 2-6` crons compute and store `chg1y`;
  `EODHD_API_TOKEN` secret verified present, unchanged). Deployed via
  `pnpm --filter @currena/markets exec wrangler deploy` (the same
  `exec wrangler deploy` pattern).
- **What it carries**: everything from b1067b0a (the australia-signals
  round) + the yearly lens (feature commit `80e15bd`, fast-forward merged
  to main, + the docs-only delivery-state record `f0bfa83`; CI green on
  both — typecheck, lint, 1,612 tests, build, bundle budgets held with NO
  bump: entry 295.29/88.81, Insights 660.88/158.00 vs 661.00/158.50, copy
  audit).
- **Live-verified** (currena.ir, fresh profile, SW cleared): served chunks
  exactly the `80e15bd` build (`index-Blojx-aS.js`, `Insights-BAeV8pAq.js`);
  EN desktop 1600 — five pills with Yearly; Yearly click → "Yearly
  performance" + "0 of 16 indices carry this period." + movers "No data
  for this period yet." + honest "—" rows with the aria "no data for this
  period over Yearly"; the full table's "1 year" column between "3 months"
  and "From 52-week high" (em-dashes; other columns live); heatmap cells
  honest; VLM 4/4. fa RTL desktop — «انتخاب بازهٔ عملکرد شاخص‌ها», five
  pills with «سالانه», «عملکرد سالانه», «۰ شاخص از ۱۶ شاخص دادهٔ این
  بازه را دارند.», Persian digits, VLM 4/4. Mobile 390 fa+EN — zero
  page-level overflow; hero carousel Global-first; fa pills fit in-row
  (291px); EN pill row is the approved `overflow-x-auto` segmented control
  (row swipe reveals Yearly fully — measured, the same rest state as the
  round's own local capture). Round-4 regression: both signals panels +
  no rule toggle. Zero console/page errors everywhere.
- **Backfill watch**: the stored markets snapshot at deploy time predates
  the round-5 markets worker (no `chg1y` yet), so Yearly opens on the
  honest dashes + "0 of 16" note until the NEW currena-markets worker's
  first cron run (23:30 UTC Mon–Fri / 01:30 UTC retry) rewrites the rows
  with real yearly values — the same honest roll-in the weekly lens used.
- **Rollback**: `wrangler rollback` (currena-api previous version b1067b0a
  = the australia-signals round; currena-markets previous deployment
  2026-10-17), or redeploy any prior main commit.

The previous deployment record (the australia-signals round, worker
b1067b0a) follows below.

## CURRENT DEPLOYMENT — the Australia card closes with the same signals box as World Signals, carrying its own area data (2026-10-20 (australia signals) owner round 4, worker b1067b0a)

Owner round 4 — "Just like World Signals, I want the same Box with proper
data for Australia" — is LIVE on `/#/insights`: the Australia card now
closes with the SAME emphasized signals box construction as World
Signals (always open, never behind the toggle; 15px bold heading +
bullets; state mark 18/20; the region's own pale tint + step ink;
`ei-panel-accent`), its proper data being its OWN areas — one bullet per
Australian gauge, worst first: the raised areas (step 2+) carry their
n-of-m counts and state word in their OWN step ink ("Inflation & rates ·
Stressed: 3 of 5 indicators need attention.") and jump to the Australia
section; the calm ones sit in the quiet rows' muted ink ("Trade &
currency · Stable"), the unreadable ones in the honest no-reading
neutral — never buttons. The round-3 rule toggle survives as the shared
FALLBACK when a region has nothing to raise (no feeds on Global / no
readable gauge on Australia); the word-choice rule stays reachable
through the "?" tip on both cards. Two new copy keys en+fa
(`australiaSignalsTitle`, `australiaSignalArea` — manifest round
`australia-signals-2026-10-20`); panel guards 3 → 6 in
`hero-editorial.test.tsx` (20 total; 1,606 workspace tests). Evidence +
11 screenshots:
`docs/insights/economic-indicators-au-signals-verification.md`.

- **Active worker**: currena-api **`b1067b0a-9b74-45f7-a52e-d555dbac21ad`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *` keep-warm
  cron unchanged; currena-markets untouched — UI-only round).
- **What it carries**: everything from 0230f09b (the panels round) + the
  australia-signals round (feature commit `a073c18`, fast-forward merged to
  main, + the docs-only delivery-state record `2880573`; CI green on
  a073c18 — typecheck, lint, 1,606 tests, build, bundle budgets after the
  documented 661.00/158.50 Insights bump (D-39), copy audit).
- **Live-verified** (currena.ir, fresh profile, SW cleared): EN desktop
  1600 — served chunks exactly the `a073c18` build (`index-DV6LyMkN.js`,
  `Insights-DcNs64O3.js`), TWO signals panels live: World signals (the
  production markets bullet) + "Australia signals" carrying the real
  production data ("Inflation & rates · Stressed: 3 of 5…", "Households ·
  Stressed: 3 of 6…", "Trade & currency · Stable"), no rule toggle on
  either card; heading + raised bullets measured 15px/700
  `rgb(255,131,43)` on the `oklab(… / 0.06)` pale amber; a real click on
  a raised AU bullet scrolled 0 → 7321px with the Australia section in
  the viewport; EN mobile 390 — carousel opens on Global at the origin
  (card 16..374, dots `true,false`, cue "Swipe to view Australia"), real
  Next → Australia at x:16, dots flip; fa RTL desktop — «سیگنال‌های
  استرالیا» with «تورم و نرخ بهره · پرتنش: ۳ شاخص از ۵ شاخص نیازمند
  توجه‌اند.» (fa digits), the 3px accent on the RIGHT edge; fa mobile
  390 — opens on جهانی («برای دیدن استرالیا بکشید»), real «بعدی» →
  Australia at x:16; zero horizontal overflow everywhere; zero
  page/console errors on every capture.
- **Rollback**: `wrangler rollback` (previous version 0230f09b), or
  redeploy any prior main commit — the Worker carries the SPA build
  from `apps/web/dist` at deploy time.

The previous deployment record (the panels round, worker 0230f09b)
follows below.

## CURRENT DEPLOYMENT — the rule panel tucks behind a low-key toggle; the world-signals panel becomes the hero's emphasized closing module (2026-10-19 (panels) owner round 3, worker 0230f09b)

The owner's two directives on the closing explanation panels are LIVE on
`/#/insights`, presentation-only: the word-choice RULE panel (Australia +
Global's no-feed fallback) now hides behind a LOW-KEY TOGGLE — one quiet
muted pill (`verdictRuleLabel` + a direction-neutral chevron, the "+n
more" disclosure language, `aria-expanded`/`aria-controls` like
GlossaryTip) whose click reveals the familiar tinted panel with its
`data-ei-panel/-kind="rule"/-heading/-rule` hooks and copy byte-identical
to the fidelity round's — while the Global SIGNALS panel, "probably one
of the most important parts of the whole hero" (owner), steps UP in type:
heading + bullets from the 12.5px caption tier to 15px bold
`leading-relaxed`, the state mark 16/18 → 18/20, roomier bullet rhythm
and panel padding (never toggled — always open; the pale-red surface,
region-step ink and `data-attention-box`/bullets hooks stay exactly as
approved). No new copy keys, no data logic, feed, count, ranking or
aria-hook changes. Evidence + 8 screenshots:
`docs/insights/economic-indicators-panels-verification.md`.

- **Active worker**: currena-api **`0230f09b-b10e-4fdc-9e7a-544730950d79`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *` keep-warm
  cron unchanged; currena-markets untouched — UI-only round).
- **What it carries**: everything from 5164c21a (the fidelity round) +
  the panels round (commit `557ff75`, fast-forward merged to main; CI
  green on it — typecheck, lint, 1,603 tests, build, bundle budgets after
  the documented 659.00/158.00 Insights bump (D-38), copy audit).
- **Live-verified** (currena.ir, fresh profile, SW cleared): EN desktop
  1600 — served chunks exactly the `557ff75` build (`index-Uqbna-ql.js`,
  `Insights-D2o0OWve.js`), ONE signals panel on Global at 15px/700 with
  the production markets bullet ("4 of 16 markets…"), ONE collapsed
  toggle on Australia; real toggle click → `aria-expanded="true"` + the
  rule panel appears; fa — toggle «مبنای تعیین وضعیت هر حوزه» + signals
  «سیگنال‌های جهانی»; fa mobile 390 — carousel opens on جهانی with the
  open signals panel, zero horizontal overflow; zero page errors.
- **Rollback**: `wrangler rollback` (previous version 5164c21a), or
  redeploy any prior main commit — the Worker carries the SPA build
  from `apps/web/dist` at deploy time.

The previous deployment record (the UI-fidelity round, worker 5164c21a)
follows below.

## CURRENT DEPLOYMENT — the economic indicators hero closes the gap to the approved reference (2026-10-19 UI-fidelity correction round, worker 5164c21a)

The owner's correction brief (the editorial hero still read as a generic
KPI dashboard) is LIVE on `/#/insights`, presentation-only: the page
container widens to ~95% viewport (`xl:max-w-[min(calc(100%-56px),1840px)]`
— 1544px at 1600, 1704px at 1760), the Sydney/world-map art bands settle
in the reference's washed-watermark zone (26%/30% veils), THE NAMED
SEVERITY BUG is fixed (the flagged rows' inline-start accent, the
fallback triangle and the attention-count line now follow the REGION'S
OWN verdict step via `article[data-ei-step]` → `--ei-accent` — a
Stressed Australia speaks the #ff832b amber ink, only a Critical region
speaks red), the status-grouped gauge boxes become the reference's
compact CATEGORY ROWS (label · tinted state badge · sm meter, worst
first), each card closes with the restrained contextual explanation
panel (Global: the raised world signals under `worldSignalsTitle` on
pale red — verified live with the production markets feed — falling
back to the word-choice rule; Australia: `verdictRuleLabel` + rule on
pale amber; tint + the 3px inline-start rule follow the region step),
the indicator names step to 16px, the hero meters return to pill
radius, and the new `ContinueStrip` names the next page sections in
order under the hero. Two new copy strings × 2 locales, manifest round
`editorial-fidelity-2026-10-19`. Evidence + 10 screenshots:
`docs/insights/economic-indicators-fidelity-verification.md`.

- **Active worker**: currena-api **`5164c21a-5e30-4c9f-a596-0f8316d5270b`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *` keep-warm
  cron unchanged; currena-markets untouched — UI-only round).
- **What it carries**: everything from 29ebc99b (the editorial hero
  round) + the fidelity corrections (commit `89d35d4`, fast-forward
  merged to main; CI green on it — typecheck, lint, 1,603 tests, build,
  bundle budgets after the documented 657.00/157.50 Insights bump
  (D-37), copy audit).
- **Live-verified** (currena.ir, fresh profile): EN desktop 1600 —
  container 1544px, Australia left / Global right, AU rows
  `rgb(255,131,43)` amber vs Global red, Global panel kind `signals`,
  strip present, zero page overflow, zero console errors; EN mobile 390
  — carousel opens on Global, real Next click → Australia, dot flips;
  fa RTL desktop 1600 — 1544px, Australia left, amber accents, panel
  heading «مبنای تعیین وضعیت هر حوزه», panel accent 3px amber, row
  chevron mirrored (`matrix(-1,0,0,1)`), strip «ادامهٔ صفحه …»; fa
  mobile 390 — Global first, zero overflow.
- **Rollback**: `wrangler rollback` (previous version 29ebc99b), or
  redeploy any prior main commit — the Worker carries the SPA build
  from `apps/web/dist` at deploy time.

The previous deployment record (the editorial handoff round, worker
29ebc99b) follows below.

## CURRENT DEPLOYMENT — the economic indicators hero becomes the editorial financial interface (2026-10-19 editorial handoff round, worker 29ebc99b)

The owner's `currena-hero.zip` handoff package (approved visual references,
`spec/economic-indicators-ui-spec.md`, design tokens, Sydney Harbour +
world-map artwork — recorded in the repo as
`docs/insights/economic-indicators-editorial-spec.md`) is LIVE on
`/#/insights`, presentation-only: the `<768px` GLOBAL-FIRST horizontal
swipe carousel (scroll-snap track, cue + two aria-current dots + 44px
Previous/Next above the track), the quiet Sydney/map art bands behind the
two region card headers, the `--ei-navy` print ink (region titles, flagged
values, page title), the tinted `.ei-state-pill` severity pill with the
four-step meter unchanged beside it, and the flagged rows' editorial
anatomy (subject-icon container, inline-start tier edge, RTL-mirroring
drill-down chevron). The hero-scoped grayscale filter is retired (the new
direction restores the restrained severity inks). Every calculation,
threshold, ranking, aria hook, count and translated string is untouched —
the 5 new fa carousel strings are manifest-triaged (round
`editorial-hero-2026-10-19`).

- **Active worker**: currena-api **`29ebc99b-e290-4d68-8623-5a892a75d2f9`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *` keep-warm
  cron unchanged; currena-markets untouched — UI-only round).
- **What it carries**: everything from 20b9549c (the ≥96px wordmark round +
  every round beneath) PLUS the editorial hero.
- **Chunk proof**: the 32b23b1 build serves `index-D4_TboZK.js`
  (295.29/88.81) + `Insights-BI2tkJ8c.js` (655.03/156.73 — the documented
  656/157 bump, D-36 + CHANGELOG §2026-10-19); both artwork WebP files
  answer 200 (12,294 B + 3,668 B).
- **Verified live** (agent-browser, fresh profile, workers.dev + currena.ir
  smoke): EN desktop 1280 — Australia left:32 / Global right:652, both art
  bands rendering behind legible navy titles, 2 pills + meters, zero
  overflow; EN mobile 375 — Global first (x:16) with Australia off-screen,
  cue + dots + buttons on the FIRST screen, real Next click → Australia
  x:16 with the dot/cue flipping, `scrollWidth === clientWidth`; fa RTL
  desktop + 390 mobile — «برای دیدن استرالیا بکشید», real «بعدی» click →
  Australia x:16, track scrollLeft −370 (logical RTL), zero overflow at
  every width; zero console/page errors everywhere. Evidence:
  `docs/insights/economic-indicators-editorial-verification.md` +
  `docs/insights/screenshots/economic-indicators-editorial/` (local) and
  `/tmp/verify-live` (live-run screenshots, 5 files).
- **Notable engineering finding**: the first carousel implementation (a
  FLEX track with %-basis items) leaked ~98 px of PHANTOM scrollable
  overflow into the document on mobile (page pannable into blank space;
  nothing painted; baseline build measured clean). Bisected to a
  layout-engine scrollable-overflow computation — fixed with the grid
  auto-flow-column track + `contain: paint` (full story in index.css +
  the verification notes).
- **Gates on 32b23b1** (local + CI green): typecheck 6/6; 1,596 tests
  (+10 new hero-editorial guards); lint 0 errors/15 accepted advisories;
  copy:audit clean; build OK; budgets held (Insights 655.03/156.73 vs
  656/157). CI run on main: completed/success.

## PREVIOUS DEPLOYMENT — the index wordmarks at the owner-directed ≥96×96 px (2026-10-18 (2), worker 20b9549c)

The owner's follow-up on the freshly deployed world-indices briefing
("The pictures of each indices are too small make them at least 96x96
pixel") is LIVE: every rendered index wordmark box is ≥96×96 px — tiles
96 (stacked above the name; the explorer grid's 2→7 narrow columns leave
no room for a beside-the-text logo), movers 96/112, the detail heading
96 beside the name block. The white chip radius is capped at 16px so the
big chips read as rounded squares, not pills. Shipped as 0a7387e (5
files, +2 regression guards in briefing.test.tsx).

- **Active worker**: currena-api **`20b9549c-46be-4d6a-a9ef-4f0cfc38ce70`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *`
  keep-warm cron unchanged; currena-markets untouched — UI-only round).
- **What it carries**: everything from b9a412e0 (the full world-indices
  briefing + every round beneath) PLUS the ≥96px wordmark floor.
- **Chunk proof**: the fresh 0a7387e build serves `index-Cl8aIt4y.js`
  (295.29/88.82) + `Insights-DeBhQeKJ.js` (650.30/155.50) — served live
  on the workers.dev origin (Insights-CUm3UhiW.js 650,283B is now 404;
  the new 650,296B chunk answers 200).
- **Verified live** (agent-browser, fresh profile, workers.dev): measured
  boxes on the rendered page — 18 logos (16 tiles + 2 movers), min 96px /
  max 112px, all naturalWidth>0 (loaded); the n225 detail panel opens
  with a 96×96 wordmark; fa RTL desktop + EN desktop full pass; mobile
  390 — scrollWidth 390 = innerWidth, zero horizontal overflow; zero
  console + zero page errors. Evidence:
  `docs/insights/screenshots/world-indices-briefing/logo-96px/`.
- **Gates on 0a7387e** (local, all green): typecheck 6/6; 614 web tests
  (+2 guards; full suite 1,586); lint 0 errors/15 accepted advisories;
  copy:audit clean (no copy changes); build OK; budgets held (Insights
  650.30/155.50 vs 652/156.50).

## PREVIOUS DEPLOYMENT — the world stock indices editorial briefing is LIVE (2026-10-18 world-indices round, worker b9a412e0)

The owner's directive ("if not committed and deployed, deploy them — I
don't see any change in the live site") closed the gap between the
shipped branch and production: `feature/world-indices-briefing`
(f72e1a0, the 2026-10-18 handoff round — 42 files: 16 wordmark JPEGs +
UI/i18n/tests/docs) was fast-forward-merged into main (e8815e3 → f72e1a0,
zero regressions possible — the branch sat directly on the deployed
state), pushed, and deployed. The 26c23d91 worker was serving the
pre-redesign build (live chunk proof: index-DJK_gsXg.js) because the
round had shipped to the branch only, awaiting review.

- **Active worker**: currena-api **`b9a412e0-2bb5-4352-9c70-f22249ade149`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *`
  keep-warm cron unchanged; currena-markets untouched — UI-only round).
- **What it carries**: everything from 26c23d91 (057cd20, runtime-
  identical to 26d) PLUS the world-indices briefing: the editorial header
  «نبض بازارهای جهان» / «شاخص‌های بورسی جهان», the verdict card with the
  period breadth strip + below-52w-high count, the «بیشترین رشد»/
  «بیشترین افت» movers cards, the 4-lens period switch (روزانه/هفتگی/
  ماهانه/سه‌ماهه — the annual gap stays reported, not fabricated), the
  equal-area «نقشهٔ عملکرد» heatmap, the 16 wordmark logos
  (/assets/markets/{id}.jpg), the country labels, and the honest
  empty/partial states. 34 new assets uploaded (16 jpg + hashed chunks).
- **Chunk proof**: the fresh f72e1a0 build serves `index-Cslta9H2.js`
  (295.29/88.81) + `Insights-CUm3UhiW.js` (650.28/155.51 — the bumped
  652/156.50, D-35) — sha256-identical on the workers.dev origin
  (4609c779… / 92199993… = the local build hashes), so the deployment
  matches main exactly.
- **Verified live** (agent-browser, fresh profile, workers.dev): fa RTL
  desktop 1440 — the new title + badge render, the verdict breadth strip,
  movers on real stored data, the period switch (سهماهه → هفتگی moves
  tiles+movers together), the heatmap switch (16 equal tiles + legend),
  the detail panel opens from tiles, 19 market-logo imgs all loaded from
  the CDN; EN locale full pass ("The pulse of world markets" + Daily/
  Weekly/Monthly/Quarterly/List); mobile 390 — scrollWidth 390 =
  innerWidth, zero horizontal overflow; zero console + zero page errors
  across all combos. Evidence:
  `docs/insights/screenshots/world-indices-briefing/`.
- **Gates on f72e1a0** (local, all green): typecheck 6/6; 1,584 tests
  (web 612); lint 0 errors/15 accepted advisories; copy:audit clean
  (manifest 2,203); build OK; budgets held. GitHub CI on the main push:
  run 39146557672 → **success**.
- **Not changed**: providers, crons, KV, the markets worker, the read
  route, the contract (MarketEntrySchema untouched; only the 4 supported
  horizons offered — no invented annual return).
- **Noted (pre-existing, unrelated)**: the 09:08 UTC insights-selfcheck
  red run (T-03 dates) executed on e8815e32 hours before this push — a
  live-source date condition in the daily data audit, not this UI-only
  round.

## PREVIOUS DEPLOYMENT — the repo root cleaned of misplaced specification markdown (2026-10-26e, worker 26c23d91)

The owner's wrap-up directive ("commit, push, deploy") closing the
minimal-cleanup work order: two root specification markdowns moved
into their existing sibling folders as R100 byte-identical renames
(`economic-indicators-ui-spec.md` → `docs/insights/`;
`REMAINING_WORK.md` → `docs/`), the README pointer + the verification
notes header updated, CHANGELOG §2026-10-26e + D-34 recorded (commit
`057cd20`, the work order's exact message). **Runtime-identical to the
26d deployment**: zero code, zero copy, zero served bytes changed.

- **Active worker**: currena-api **`26c23d91-f9a3-4162-a9c1-a1dcee8ad6be`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *`
  keep-warm cron unchanged; currena-markets untouched — same scope
  as 26d).
- **What it carries**: everything from 2e802ae7 (the balance v7 +
  every round beneath) — byte-for-byte; the only delta is repository
  documentation layout.
- **Chunk proof**: the fresh `057cd20` build serves `index-DJK_gsXg.js`
  (295.29/88.81) + `Insights-CH3Xq64v.js` (635.91/152.00) — both
  sha256-identical on currena.ir (8f2ba133… / 1872ef4f… — the SAME
  hashes as the 26d live verification; the deploy uploaded no
  updated assets).
- **Verified live** (agent-browser, fresh profile, currena.ir): EN
  desktop + EN mobile 390 (scrollWidth 390 = innerWidth, zero
  overflow) + fa RTL desktop («کورنا، مبدل ارز», dir=rtl) + fa
  `#/insights` (the moved spec's page — «شاخص‌های اقتصادی» renders,
  1366 = 1366); zero console + zero page errors across all four
  combos. Evidence: docs/evidence/2026-10-26e-root-specs-cleanup/.
- **Gates on `057cd20`**: typecheck 6/6; 1,536 tests green (web 564);
  lint 0 errors/15 accepted advisories; copy:audit clean; build OK;
  budgets held (entry 295.29/88.81; Insights 635.91/152.00).

## PREVIOUS DEPLOYMENT — the gold balance rotates ONLY its beam (2026-10-26d, worker 2e802ae7)

The owner's Iteration-5 addendum — "Rotate the beam only, and
visualize weight" — is LIVE: exactly one rotating element (the beam
group: bar + beads + pivot ring + needle, by rotate(theta, pivotX,
pivotY)); the pans translate plumb and are never rotated, skewed or
scaled; the hangers are recomputed every frame from each beam-end
joint to the pan's two fixed rim corners; ONE JS-animated theta (the
Odometer rAF pattern) derives beam rotation, joints, pan drops and
hanger endpoints in the same frame. The tilt presentation scale is
the addendum's 8 deg max / 2 deg floor (the net/total ratio law
byte-identical), and the weight read-outs are scoped to what the
model produces — the beam angle + the needle gauge (three
verdict-labelled ticks, hidden when unavailable, gaugeAria round-52);
per-side totals and per-factor weights do not exist, so the side-load
bar and per-tile markers are skipped rather than fabricated. Pushed
as 9e2fc59 (the v7 round merged over the parallel 2026-10-26c sidebar
round; both ride).

- **Active worker**: currena-api **`2e802ae7-c068-4c39-96a7-54862370cb32`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *`
  keep-warm cron unchanged; currena-markets untouched).
- **What it carries**: BalanceScale v7 (the SVG mechanical layer with
  the pure balanceStageGeometry/balanceGaugeGeometry derivation, the
  Odometer-pattern settle, the needle + arc, the retired v4 keystone
  and the retired CSS-calc stage), gaugeAria x 2 locales + QA record +
  manifest entry (round-52), the rewritten 45-test battery — and
  everything from the 2026-10-26c sidebar + balance v6 + 2026-10-26b +
  2026-10-25b rounds beneath.
- **Chunk proof**: the fresh 9e2fc59 build serves `index-DJK_gsXg.js`
  (295.29/88.81) + `Insights-CH3Xq64v.js` (635.91/152.00 — the bumped
  636/152.50, D-33) — the served chunk is byte-identical on currena.ir
  (sha256 1872ef4f..., 635,911 bytes, verified live).
- **Verified live** (agent-browser, fresh profile, currena.ir): EN
  desktop — the live state (1 against + 3 unread) renders the 2 deg
  floor: beam `rotate(2 320 44)`, for/against pan translates
  -5.58/+5.58 = 160 x sin 2 deg, hanger attach error 0.000, needle +
  3 ticks + "Beam tilt: 2 degrees, Leaning against gold."; fa RTL —
  beam `rotate(-2 320 44)` (the visual sign flips, the against pan on
  the LEFT still drops +5.58), gauge aria in Persian with Persian
  digits, the against pan (top 85.6 vs the for 74.4) matches the
  verdict; mobile 390 — the drawing scales as one piece (stage 326,
  pivot 163, drop 2.84 = 81.5 x sin 2 deg), zero overflow; the tile
  tap opens the shared panel (verified in fa); zero console errors.
  Evidence: docs/insights/screenshots/gold-balance/v7/ (live-v7-*.png).
- **Gates on the merged tree**: typecheck 6/6; lint 0 errors/15
  accepted advisories; 1,536 tests green (web 564); copy:audit clean
  (2,170 entries); build OK; budgets held.

## PREVIOUS DEPLOYMENT — the asset cards' details sidebar (2026-10-26c, worker 6adfb632)

The owner's directive — "The more details must show up in side bar" —
is LIVE: the «جزئیات بیشتر» button opens the F5 details side panel
(never an inline expansion), with the five sections rendering inside it
under the card facts. Pushed as 99742c2 (rebased over the parallel
balance-v6 round 2f9f4e6; both ride).

- **Active worker**: currena-api **`6adfb632-1d28-4156-896e-dc823846feb4`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *`
  keep-warm cron unchanged; currena-markets untouched).
- **What it carries**: PricesBoard's disclosure deleted (the button calls
  onFocusCard with aria-haspopup=dialog + PanelRight/PanelLeft
  affordance), the new PriceDetails.tsx (the five sections + the shared
  atoms + the keyed usePricePanelData on the module-cached fetch),
  DetailsPanel rendering the sections for the four price rows + the
  verified panel title (priceCardTitles), lessDetails retired from both
  dictionaries + the manifest (round-52:
  docs/QA/quirks-2026-10-26c-asset-cards-sidebar.md), the rewritten
  13-test battery — and everything from the balance v6 + 2026-10-25b +
  2026-10-26b rounds beneath.
- **Chunk proof**: the fresh 99742c2 build serves `index-gB3_zV9f.js`
  (295.29/88.82) + `Insights-DW1SDXvu.js` (634.13/151.33 — budgets
  635/152 held) — both live on currena-api.sedanama-ir.workers.dev and
  currena.ir.
- **Verified live** (agent-browser, fresh profile, currena.ir): EN
  desktop 1280 — «More details» opens the right sheet (440px flush
  inline-end), heading "Gold price" (not the legacy "(ounce)"), the
  five sections under the facts, focus trapped, body scroll locked,
  Escape closes and focus RETURNS to the trigger; fa RTL — «قیمت طلا»,
  the five Persian sections, the sheet flush LEFT (start side); mobile
  375 fa — bottom sheet (full-width, top ≈ 97px), no horizontal
  overflow; the four tiles stay compact (zero h4 inside the cards);
  zero console/page errors. Evidence:
  `docs/evidence/2026-10-26c-asset-cards-sidebar/` (harness + live
  captures + the sandbox-mirror set).
- **Gates on the rebased tree**: typecheck 6/6; lint 0 errors/15
  accepted advisories; 1,521 tests green (web 549); copy:audit clean
  (2,169 entries); build OK; budgets held.

## Previous: the balance v6 pans + the merged parallel rounds (2026-10-26c, worker 4079aed7)

The owner's Iteration-4 directive is LIVE: the gold balance's factor
tiles REST ON real weighing pans hung from the beam — one connected
weighing machine. Pushed as 8075e10 (a merge: the v6 round + the two
parallel prices rounds 2026-10-25b and 2026-10-26b, both riding
beneath).

- **Active worker**: currena-api **`4079aed7-1fd0-46d8-a785-98e65b2363e6`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *`
  keep-warm cron unchanged; currena-markets untouched).
- **What it carries**: the v6 balance (BalanceScale.tsx rewritten —
  the CSS stage, pans, hangers, tiles, capacity/overflow pills, the
  round-51 panEmpty/panUnreadable copy, manifest 2,168 → 2,172,
  `copy:audit` clean) + everything from 2026-10-25b and 2026-10-26b
  beneath it (the asset-cards polish + the methodology-note removal).
- **Chunk proof**: the fresh 8075e10 build serves
  `index-DqAkLpec.js` (295.29/88.81) + `Insights-DxCfnBbd.js`
  (633.39/151.41 — budgets 635/152 held; D-32 records the merged-tree
  bump).
- **Verified live** (agent-browser, fresh profile with the SW purged
  per D-29, currena.ir): the balance renders the full v6 anatomy (2
  pans, 8 hanger elements, beam + 2 beads) with the live state (1
  against · 3 unread → the 4° floor). The TILT LAW MEASURED ON
  PRODUCTION: pan-pair difference = bead-pair difference = 22.32px =
  320×sin(4°) at the 640px stage (and 10.32px = 148×sin(4°) at the
  296px mobile stage) — the pans track their beads exactly. The
  against pan carries the «بازده واقعی اوراق قرضه ۲٫۷۸٪» tile (the
  tap opens the shared panel — verified), the for pan shows the
  «نشانهٔ معتبری نیست» marker, the verdict box reads
  «تمایل به ضرر طلا · ۱ به ضرر · ۳ قابل ارزیابی نیست» + the C12
  banner. fa RTL: the green side on the right, Persian digits; en
  LTR verified ("Real yields 2.78%" / "No qualifying signals" /
  "Factors supporting gold's price"). Mobile 360: pans side by side,
  tile legible, no horizontal overflow (scrollWidth 360 = innerWidth).
  Zero page errors across the session. VLM review of the live
  captures: factors-on-pans confirmed, RTL correct, "High" editorial
  quality, no defects. Evidence:
  `docs/insights/screenshots/gold-balance/v6/live-v6-*.png`.
- **Gates on the deployed tree**: typecheck 6/6; lint 0 errors/15
  accepted advisories; 1,519 tests green (web 547, the balance suite
  30); copy:audit clean (2,172 entries); build OK; budgets held.

## Previous: the methodology-note removal (2026-10-26b, worker f9571a79)

The owner's follow-up directive is LIVE: the sixth expanded-detail
section — «دربارهٔ این اعداد» ("About these numbers") and its
three-sentence methodology body — no longer renders on the four asset
cards. The panel now carries the five data sections A–E; the methodology
itself is untouched (it stays implemented in price-trend.ts /
price-stats.ts and documented in the QA docs). Pushed as 648f5aa (no
rebase needed — main had not advanced).

- **Active worker**: currena-api **`f9571a79-afb6-433a-bae7-d3423e6ac692`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *`
  keep-warm cron unchanged; currena-markets untouched).
- **What it carries**: the PricesBoard section-F removal + its
  header-comment tag, `aboutNumbersLabel`/`aboutNumbersBody` deleted from
  both dictionaries, the two manifest entries deleted per the copy
  workflow's removal rule (2,170 → 2,168, `copy:audit` clean), and the
  test's F assertion replaced with removal guards in BOTH locales.
  Everything else from 2026-10-25b rides beneath unchanged.
- **Chunk proof**: serves `index-CKqYpOMM.js` (295.29/88.81 — the entry
  hash rotated because it embeds the lazy chunk's filename; its own size
  is byte-identical) + `Insights-7kn32ZoI.js` (628.67/150.59 — budgets
  630/151 held; the removed copy shrinks the chunk ~1.2 kB) — the fresh
  648f5aa build's exact filenames.
- **Verified live** (agent-browser, fresh profile, both
  currena-api.sedanama-ir.workers.dev and currena.ir reference
  index-CKqYpOMM.js and serve Insights-7kn32ZoI.js): desktop 1280 en —
  the expanded Gold card shows EXACTLY the five sections (Price changes /
  Price range over the past 52 weeks / Historical price records / Price
  vs reference levels / Data source & freshness), 'About these numbers'
  zero occurrences, the element-from-point probe at the LAST section's
  coordinates hits that H4 itself (the panel paints inside the tile — the
  2026-10-24d lesson applied); desktop 1280 fa RTL — exactly
  تغییرات قیمت / محدودهٔ قیمت در ۵۲ هفتهٔ گذشته / سوابق تاریخی قیمت /
  جایگاه قیمت نسبت به شاخص‌های مرجع / منبع داده و زمان به‌روزرسانی,
  «دربارهٔ این اعداد» zero occurrences; mobile 375 fa — no horizontal
  overflow (scrollWidth 375), five sections intact. Zero console/page
  errors across the session. Evidence:
  `docs/evidence/2026-10-26b-remove-methodology-note/` (sandbox + live
  captures).
- **Gates on the deployed tree**: typecheck 6/6; lint 0 errors/15
  accepted advisories; 1,520 tests green (web 548); copy:audit clean
  (2,168 entries); build OK; budgets held.

## Previous: the asset-cards polish round (2026-10-25b, worker ead002b6)

The owner's asset-cards polish task is LIVE: the four financial cards
carry the editorial header (plain title over a verified measurement-
basis subtitle), the ONE-LINE price + currency («۴٬۱۶۶ دلار» /
"US$4,166"), the expanded panel's six semantic sections, and honest
instrument notes that follow the SERVED attribution (the futures note
no longer renders on gold-api XAU/XAG spot prices; «بیشترین قیمت ۱۰
سال اخیر» replaces the all-time record claim). Pushed as db31745
(rebased over the balance-v5 round 5f37014) before deploy.

- **Active worker**: currena-api **`ead002b6-3c9e-4e9a-aae9-4535bb462f9f`**
  (SITE_MODE=public, RATES KV + ASSETS bindings, the `* * * * *`
  keep-warm cron unchanged; currena-markets untouched).
- **What it carries**: PricesBoard.tsx (header/price line/sections
  A–F/conditional notes), the new pure priceValueParts display helper,
  18 new copy keys + 5 relabelled (en+fa), +14 tests, the round-51
  copy triage, and the documented Insights budget bump 627/150 →
  630/151. All prior lineage (balance v5 + v4, financial-asset-cards
  2026-10-24c/d, market lenses, economic-indicators) rides beneath.
- **Chunk proof**: serves `index-BtcN1ZYd.js` (295.29/88.82) +
  `Insights-BMyE-MXL.js` (629.85/150.88 — budgets 630/151 held) —
  the fresh db31745 build's exact filenames.
- **Verified live** (agent-browser, fresh profile, both
  currena-api.sedanama-ir.workers.dev and currena.ir serve
  Insights-BMyE-MXL.js): desktop 1280 fa — «قیمت طلا»/«هر اونس تروی»,
  «۴٬۱۶۶ دلار» on one line, the six sections («تغییرات قیمت …
  دربارهٔ این اعداد»), the range «۳٬۹۶۱ تا ۵٬۳۱۸ دلار», the record
  «بیشترین قیمت ۱۰ سال اخیر», the fetch-time line; desktop 1280 en —
  the six sections, gold's XAU spot attribution with NO futures note
  (brent keeps its blend note); mobile 375 en — "Gold price" + "per
  troy ounce", "US$ 4,166" one line, no horizontal overflow. Zero
  console errors. Evidence:
  `docs/evidence/2026-10-25b-asset-cards-polish/` (before/after +
  LIVE-*.png).
- **Gates on the rebased tree**: typecheck 6/6; lint 0 errors/15
  accepted advisories; 1,520 tests green (web 548); copy:audit clean
  (2,170 entries); build OK; budgets held.

## Previous: the gold balance v5 wireframe re-composition (2026-10-26, worker 2f1e8f92)

The owner's wireframe reference (docs/ui-reference/gold-silver-balance-target-
wireframe.png) is LIVE: the gold balance component re-composed — the two
opposing factor columns ABOVE the abstract beam (its endpoint beads under
the columns' centres), the compact soft assessment box beneath, per-column
progressive disclosure ("+{n} more" / "Show fewer"). The tilt law and every
user-facing string are untouched (zero copy changes). Merged to main as
1e99007 (my feature merge 7742966/51edd10 + the parallel 2026-10-24d
white-space fix 0d39bb0 — no file overlap, both rounds ride).

- **Active worker**: currena-api **`2f1e8f92-e587-4ef2-951b-821e44438077`**
  (wrangler deploy from main @ `1e99007`; SITE_MODE=public, RATES KV +
  ASSETS bindings, the `* * * * *` keep-warm cron unchanged).
  currena-markets untouched.
- **What it carries**: BalanceScale.tsx (the v5 composition + the
  disclosure pills + the assessment box), its 31-test suite re-pinned, the
  MergedCard comment, the documented Insights raw budget bump 626 → 627
  (gz HELD 150) — everything else byte-for-byte (the parallel session's
  PricesBoard white-space fix included).
- **Chunk proof**: the deploy serves `index-CWDirSZM.js` (295.29/88.81) +
  `Insights-BuYjxnZ9.js` (626.28/149.93 — budgets 627/150 held); the
  live-served Insights chunk sha256 `da8163846c186db7…` is byte-identical
  to the fresh main build's.
- **Verified live** (agent-browser, fresh profile, SW purged per D-29,
  currena.ir): EN 1280 — the columns render ABOVE the beam (DOM-verified:
  lists.bottom ≤ zone.top), the beads sit under their column centres
  (477/480, 803/800 — the 3px residue is the grid gap), the live state
  (1 against · 3 couldn't be read) tilts exactly 4° with bead Δy 22px =
  320px × sin(4°) measured on production, the assessment box
  (bg-currena-soft/60) follows the zone, the for side shows the
  evidence-based empty line, a row tap opens the shared panel
  (detail=real-yield); fa RTL 1280 — dir=rtl, «برآیند عوامل مؤثر بر قیمت
  طلا» heading, the for column + its green bead on the RIGHT, the against
  bead lower, Persian digits («۱ به ضرر · ۳ قابل ارزیابی نیست»); mobile
  360 fa — the columns stack, zero horizontal overflow, the beam +
  assessment readable, VLM pass on the scrolled capture; zero console
  errors across the session. Evidence:
  `docs/insights/screenshots/gold-balance/v5-iteration/` (live-v5-*).
- **Post-merge gates** (re-run on `1e99007`): typecheck 6/6; lint 0
  errors/15 accepted advisories; web tests 534/534 green; copy:audit
  clean; bundle budgets held.

## Previous: the «جزئیات بیشتر» white-space fix (2026-10-24d, worker cc6f28e6)

The owner's post-deploy bug report is FIXED and LIVE: clicking «جزئیات
بیشتر» / "More details" on the live site now renders the detail rows
inside the card (was "just a white space"), and the prices block gained
breathing room to the markets section (was "collided"). Root cause and
fix: `docs/evidence/2026-10-24d-disclosure-overflow-fix/README.md`.

- **Active worker**: currena-api **`cc6f28e6-76dc-405f-a6ba-5fa7fd6adc9b`**
  (wrangler deploy from main @ `c8e0741` — the fix rebased over the
  balance-v4 round `29418f7` and pushed before deploy; SITE_MODE=public,
  RATES KV + ASSETS bindings, the `* * * * *` keep-warm cron unchanged).
  currena-markets untouched.
- **What it carries**: PricesBoard.tsx only — the tile `article` becomes
  `flex h-full flex-col` and the card-body click-through button drops
  `h-full` (keeps `grow`), so the disclosure trigger + expanded panel stay
  INSIDE the tile and the tile grows naturally with the open panel (spec 02
  §5); plus `pb-3` on the prices section = 40px card→markets air (was
  28px; the page-wide rhythm untouched). All prior lineage (balance v4,
  financial-asset-cards 2026-10-24c, market lenses, economic-indicators)
  rides beneath, byte-for-byte.
- **Chunk proof**: the deploy serves `index-Djk3ghSx.js` (295.29/88.81) +
  `Insights-CPlqsmeb.js` (625.47/149.75 — budgets 626/150 held) — the
  live-served chunks are the fresh main build's (`c8e0741`) exact
  filenames (the entry hash moves with the lazy-chunk rename).
- **Verified live** (agent-browser, fresh profile, both
  `currena-api.sedanama-ir.workers.dev/insights` and `currena.ir`):
  desktop 1280 EN — the expanded Gold panel PAINTS (elementFromPoint
  probes hit the panel's own rows: "52-week range US$3,961 – US$5,318",
  "25.4% below its record US$5,586", the source link, the method note);
  panel bottom inside the tile bottom; measured 40px card→markets air
  collapsed; mobile 375 EN — panel inside the grown tile, Silver 10px
  below it, scrollWidth == 375, no horizontal overflow; fa RTL — «جزئیات
  بیشتر»/«نمایش کمتر» label flip, Persian rows paint («تغییر ۶ ماهه
  −۱۴٫۶۲٪», «سطح قیمت نسبت به دامنهٔ ۱۰ ساله»); VLM reviews of the live
  captures pass; zero page errors. Evidence:
  `docs/evidence/2026-10-24d-disclosure-overflow-fix/live/`.
- **Post-rebase gates** (re-run on `c8e0741`): typecheck 6/6; lint 0
  errors/15 accepted advisories; 1,506 tests green (web 534); copy:audit
  clean; bundle budgets held.

## Previous: the gold balance v4 abstract editorial mark (2026-10-25, worker c6e0c2c9)

The owner's Iteration-2 directive is LIVE: the gold/silver balance
component re-drawn as the abstract editorial mark «برآیند عوامل مؤثر بر
قیمت طلا» (the literal hanging-pan scale retired). Merged to main as
`e1b2e68` (feature branch `7d360aa`) and pushed before deploy.

- **Active worker**: currena-api **`c6e0c2c9-02d9-4652-8377-fb65a94f6b5e`**
  (wrangler deploy from main @ `e1b2e68`; SITE_MODE=public, RATES KV +
  ASSETS bindings, the `* * * * *` keep-warm cron unchanged).
  currena-markets untouched.
- **What it carries**: the ONE flat 520×104 balance SVG (tapered beam,
  compact hub + 13u keystone pivot — no base bar/column — accent endpoint
  beads, dotted level reference); the Iteration-2 §3 hierarchy (heading +
  subtitle → illustration → the two side-labelled factor lists sharing the
  beam's max-w-520 footprint → the divider-separated overall assessment
  with the C12 banner → the shared panel → the trays); the round-50 copy
  (heading/subtitle/side labels/evidence-based empty lines + the NEW
  `listEmptyNone` unavailable wording); the tilt law untouched
  (|net|/total × 12°, 4° floor). All prior lineage (financial-asset-cards
  2026-10-24c, market lenses, economic-indicators) rides beneath,
  byte-for-byte.
- **Byte-identical proof**: the deploy serves `index-CjQNEJy-.js`
  (295.29/88.81) + `Insights-BLn59lac.js` (625.46/149.74 — budgets
  626/150 held) — the live-served chunks are the fresh main build's
  (`e1b2e68`) exact filenames.
- **Verified live** (agent-browser, `currena.ir/#/insights`): EN 1280 —
  the heading/subtitle/beam/lists/assessment hierarchy renders, and the
  TILT LAW MEASURED ON PRODUCTION: bead Δy = 23.438u = Lh × sin(4°) with
  **0.0u diff** (the live state: 1 against · 3 couldn't be read → 4° lean
  to the red bead); fa RTL 1280 — «برآیند عوامل مؤثر بر قیمت طلا»,
  SVG mirrored (scaleX(-1)), «۱ به ضرر · ۳ قابل ارزیابی نیست» with
  Persian digits, the same 4° LTR-signed rotation, the evidence-based
  empty line under the empty «عوامل حمایتی از قیمت طلا» list; mobile 360
  fa — the lists stack to one column (measured), scrollWidth == 360, the
  row's keyboard Enter opens the shared detail panel (aria-expanded
  true); zero console errors. VLM reviews of both live captures pass.
  Evidence: `docs/insights/screenshots/gold-balance/` (live-v4-*.png +
  the v4 harness battery + before-v3 capture).

## Previous: financial-asset-cards spec pack (2026-10-24c, worker 6d6e1300)

The prices-board cards redesign per the owner's
`financial-asset-cards-spec-pack.zip` is LIVE. Session 2026-10-22, rebased
onto main @ round 46 (`0e411e6`) and pushed as `d952983` before deploy.

- **Active worker**: currena-api **`6d6e1300-9af8-42fe-b42e-bd73ee865211`**
  (wrangler deploy from `d952983`; SITE_MODE=public, RATES KV + ASSETS
  bindings unchanged). currena-markets untouched.
- **What it carries**: the four asset cards re-anatomised per spec 02 —
  identity → dominant price + unit line → per-card as-of → THE SEVEN-DAY
  TREND (day-spaced real-data `PriceSparkline` + net % + documented trend
  word) → labelled daily change → deterministic hedged briefing →
  «جزئیات بیشتر» disclosure (every secondary statistic preserved behind
  it); `price-trend.ts` (+16 tests); PRICE_ROWS → Gold, Silver, Oil,
  Bitcoin; 41 copy keys × 2 locales + the ma200 ٪ technical entry
  (manifest 2,147); budgets 609/145.60 → 626/150. All concurrent-session
  work (markets lenses round 46, economic-indicators lineage) rides
  beneath, byte-for-byte.
- **Byte-identical proof**: the deploy serves `index-BKEHdQbU.js`
  (sha256 `730232ae…`, 295.29/88.82) + `Insights-DgGMrELI.js`
  (sha256 `fdd478e7…`, 624.65/149.59) — the live-served Insights chunk
  hashes **identically** to the fresh build of `d952983`.
- **Verified live** (agent-browser, fresh profile, both
  `currena-api.sedanama-ir.workers.dev` and `currena.ir` serve
  `index-BKEHdQbU.js`): 4 cards in spec order (gold/silver/brent/btc),
  4 aria-expanded disclosures, sparklines rendered, "Past 7 days" +
  "Daily change" labels, gold US$4,166; disclosure click → aria-expanded
  true + Changes/30 days/52-week/Price level vs 10-year range/Historical
  high/Data source rows + label flips "Show less"; fa RTL (dir=rtl,
  Persian digits, «جزئیات بیشتر», Jalali ۱۴۰۵); 375px single column, no
  horizontal overflow at any width; zero page errors. Evidence:
  `docs/evidence/2026-10-24c-financial-asset-cards/` (LIVE-*.png).

## Previous: world stock markets public restore (2026-10-18b lineage, recorded 2026-10-18c)

The newest code on main is LIVE — this section records the reconciliation
for owners reading this runbook top-down (the 2026-10-18b session
documented its deploys in CHANGELOG + evidence README but no DEPLOY.md
entry; this closes that gap).

- **Active worker (Cloudflare-confirmed)**: currena-api
  **`9f66a82c-d0d4-494e-a3cd-524eac3b557b`** — the Gradual Deployments API
  shows this version at **100%** (deployment `7c2a2526`, created
  2026-10-17T16:51:58Z, source wrangler), preceded by
  `c476307f-4c12-4879-88b2-41cbd844ea65` (the first public-restore deploy,
  then re-deployed after integrating remote main's PWA `sw.js` no-store fix
  40a66f5). currena-markets untouched.
- **What it carries** (all merged to main, all pushed): the Economic
  Indicators redesign in the owner-trimmed scope (hero grayscale — see the
  two entries below), the deterministic PWA update path (no-store `sw.js`
  + `controllerchange` reload), and the world stock markets board back in
  public mode (130e8a8 — `/api/insights/markets` 200 with 16 markets;
  `/api/insights/fx` still hidden by design).
- **Byte-identical proof (2026-10-18c reconciliation)**: a fresh
  `pnpm --filter @currena/web build` of main @ `4d339b5` produces
  `index-ChVkduNn.js` (sha256 `c06ff8db…`) + `Insights-BwhME956.js`
  (sha256 `cbb6da44…`) — **identical hashes to the live-served chunks**,
  so the deployment matches main exactly; nothing newer is undeployed and
  nothing undeployed is unpushed.
- **Re-verified live** (agent-browser, fresh context): hero icons
  `grayscale(1)` both themes, Australia-left/Global-right at 1280, colored
  design below hero, markets section renders (16 tiles, detail panel,
  full-table disclosure), tile rule 3 + `+3 more`/`نمایش کمتر` round-trip
  with aria-expanded, fa RTL + Persian digits + 92 LTR islands, no
  h-overflow at 1280/360, keyboard `/` + Escape, zero console errors.
  Evidence: `docs/insights/screenshots/economic-indicators-redesign/final-continuation/`.

## Previous: gold balance v3 + market lenses (2026-10-18d, worker 7b939901) — superseded by the v4 above

Three concurrent sessions' work rides this deploy (merged in order):
market lenses round-46 (0e411e6) → the financial-asset-cards spec pack
(2026-10-24c, d952983, itself deployed as 6d6e1300 first) → the gold
balance v3 (the owner directive 2026-10-18d, this session, c6278f6
after two conflict-free merges of the dictionaries/CHANGELOG/manifest).

- **Deployed**: currena-api **`7b939901-9779-4033-be46-98875fb4eb2b`**
  (SITE_MODE=public intact; currena-markets untouched `0135290c`), built
  from main @ `c6278f6`: entry `index-sbafnz6H.js`, Insights lazy
  `Insights-DW2zP-PU.js` — 624.63 kB / 149.57 kB gz vs the 626/150
  budgets (the spec-pack session's bump); gates re-run on the merged
  tree: typecheck 6/6, web 533 + api 238 tests, lint 0 errors/15
  advisories, copy:audit clean (2,147 entries).
- **The balance v3 live** (https://currena.ir/#/insights, fresh
  browser): SVG viewBox 520×252, beam rotate(4°) for the live state (1
  against · 3 unread — the 4° floor), measured pan-rim difference
  23.4px = Lh × sin(4°) exactly; the against list carries "Real yields
  2.84%", the for side the empty-state line "No readings support gold
  right now."; no dashed slot exists anywhere; fa RTL: the SVG mirrored
  scaleX(-1), «تمایل به ضرر طلا», «۱ به ضرر · ۳ قابل ارزیابی نیست»,
  «فعلاً هیچ عامل به نفع طلا دیده نمی‌شود.», the for list on the
  right; 360px fa: 0px horizontal overflow; zero console errors and
  zero messages across theme + locale + viewport changes.
- **Screenshots**: `docs/insights/screenshots/gold-balance/v3-live-*.png`
  (en 1280 light + dark, fa 1280 RTL, fa 360 RTL) + the harness set
  `v3-<case>-<width>-<lang>.png` (cases A–H × en/fa × 360/768/1280).

## Insights UI redesign — FINAL deploy after the owner's scope trim (2026-10-24, second entry)

The owner reviewed the deployed full-grayscale release ("why did it turn
everything on the page black and white?") and the concurrent session scoped
the redesign to the header/hero (de897d4 / CHANGELOG 2026-10-18a): the
grayscale + selective-severity treatment keeps ONLY the page header + the
Global/Australia overview cards; the 28 component files below the hero are
byte-identical to the pre-redesign colored design (green/blue chip tones,
gold JumpNav pill, blue focus ring + progress bar, tinted alert faces,
colored artwork — `filter: grayscale(1)` rescoped to `.insights-hero-grid`).

This session merged the trim, re-gated, re-deployed:

1. `pnpm --filter @currena/web build` — entry `index-CuowDJ_B.js`
   295.15/88.76; Insights lazy `Insights-DvW0Xuc4.js` 606.32/144.86
   (documented ceiling 607/145.20); precache 93 entries.
2. `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm --filter @currena/api
   exec wrangler deploy` → **Worker version `d93bd0ba-9be2-4dc1-971b-4ccc7babe3d5`**
   — RATES KV + ASSETS + `* * * * *` cron + SITE_MODE public intact.

**Live verification (final state, https://currena.ir/#/insights, SW purged):**
entry `index-CuowDJ_B.js` + `Insights-DvW0Xuc4.js` (200, 606319 B); hero
icons `grayscale(1)` + below-hero icons colored; Context chip blue / Normal
green / Needs attention red / Unusual amber; JumpNav active pill gold;
expand/collapse 3→6→3 with aria state; fa dark RTL (Global right, «جهانی»,
Persian digits, Vazirmatn, LTR meters); no h-overflow at 360 EN + fa; zero
console errors. Screenshots refreshed in
`docs/insights/screenshots/economic-indicators-redesign/` (final state).

(The earlier `66fb622f` deploy of the full-grayscale build — same session,
before the trim — remains recorded below as the intermediate state.)

## Insights UI redesign deploy (2026-10-24, economic-indicators-ui-spec.md)

**Web-change-only** (apps/web + docs; no packages/insights, apps/api or
apps/markets code touched — the markets worker was NOT deployed). The
concurrent session's real-spec implementation (2c171ca) + this session's
reconciliation (9623595, merged main):

1. `pnpm --filter @currena/web build` — entry `index-BfcmObfm.js`
   295.15/88.76 (budget 296/89.5); Insights lazy `Insights-CZEldAUv.js`
   605.68/144.60 (documented ceiling 607/145.20, CHANGELOG §2026-10-17f);
   precache 93 entries / 3120.65 KiB.
2. `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm --filter @currena/api
   exec wrangler deploy` → **Worker version `66fb622f-f8ed-4abb-9535-3005e7ce8c59`**
   (first run `6f0de2c4-fe66-4044-98c2-6fc3815d61b1` uploaded the same dist —
   the assets took a moment to settle on the edge; the second run confirmed
   the serving manifest). RATES KV + ASSETS + `* * * * *` cron + SITE_MODE
   public intact; 106 asset files.

**Live verification (https://currena.ir/#/insights, agent-browser, SW
precache purged first):**

- Served build: entry `index-BfcmObfm.js` (byte-identical index.html md5
  `b2b83a8b…` vs local dist); Insights `Insights-CZEldAUv.js`.
- EN light desktop 1280: hero grid + **Australia left / Global right**
  (measured rects); flagged rows 3 → "+3 more" → 6 → "Show fewer" → 3 with
  aria-expanded/aria-controls; step-4 meter grades pale→full Carbon Red 60;
  Critical word `rgb(218,30,40)`; probe-based banned-ink audit (oklab
  color-mix aware) = **zero occurrences** in the public render.
- FA dark desktop 1280 + FA dark mobile 360: `dir=rtl`, «جهانی» heading,
  «۶ شاخص از ۱۰ شاخص نیازمند توجه‌اند.» Persian digits, Vazirmatn, meters
  `direction:ltr`, Global stays right; `scrollWidth === clientWidth` at 360
  both locales (also 320–1440 verified locally).
- EN light mobile 360: no overflow. Signals section renders; the v2 seesaw
  present (`data-balance-captions`/`#gold-balance-detail` in DOM, artwork
  grayscaled via the page rule).
- Zero console errors across all combos. VLM review of the live hero:
  "clean, professional palette… color used functionally… no decorative
  blue or gold".
- Screenshots: `docs/insights/screenshots/economic-indicators-redesign/`
  (en/fa × light/dark × desktop/mobile + the signals/seesaw section + the
  local private-mode world-markets board).
- Full evidence + method:
  `docs/insights/economic-indicators-verification-notes.md`.

No ingest dispatch needed — presentation-layer only; the production
snapshot (`generatedAt 2026-10-17T08:38:42Z`, 32 public readings) is
unchanged.

## Post-deploy smoke (2 minutes)

```sh
B=https://currena-api.sedanama-ir.workers.dev
curl -s $B/api/health                                   # {"ok":true,…}
curl -s "$B/api/rates?source=tgju" | head -c 200        # snapshot base IRR, 17 rates
curl -s "$B/api/convert?from=USD&to=IRR&amount=100"     # 23,050,000 @ 230,500 (parity)
curl -s "$B/api/convert?from=AED&to=EUR"                # 503 currency_not_supported (known)
curl -s -H 'Sec-Fetch-Dest: document' -o /dev/null -w '%{http_code} %{content_type}\n' \
  $B/admin                                              # 200 text/html — Worker-first works
curl -s $B/robots.txt                                   # Disallow: /admin
curl -s $B/receipt                                      # SPA shell (deep link)
```

Then one browser pass: convert 100 USD→IRR, toggle fa/RTL + dark, open
`/admin`, and (see §Offline) reload with the network off.

## Redeploy the latest HEAD (wrap-up, 2026-09-18)

Production runs version `ddde3962…` (deployed from `9d91ffb`). Everything after
that commit is docs-only (session log, deployment record, CHANGELOG.md), so the
running runtime code is already identical to `main` — a redeploy is optional,
only needed to pin the version marker to the final HEAD:

```sh
pnpm install
pnpm -r typecheck && pnpm -r test        # final gate: 279/279 green at HEAD
pnpm --filter @currena/web build          # SPA → apps/web/dist
pnpm --filter @currena/api exec wrangler deploy
```

Push the branch + merged `main` first (see SESSION_LOG.md wrap-up), then deploy
so the dashboard drift alarm reports "in sync".

## Ever-green cron (2026-09-18)

The worker carries a `* * * * *` cron trigger (`wrangler.jsonc` →
`triggers.crons`). Each tick runs the normal ladder (`getRates`, non-force):

- **tgju** — every minute; the FRESH_TTL_SEC=300 fresh-cache guard means the
  actual upstream scrape happens only ~every 5 minutes (≈288 TGJU requests/day).
- **frankfurter** — only on minutes `% 15 == 0` (ECB data updates ~daily).

Before this, the ladder was pull-only: with zero visitors the KV snapshot aged
until the first request scraped — and a failed scrape served the ≤7-day-old
cache with the "last updated 3 hours ago" stale notice. Now the first visitor
always lands on a cache at most ~5–6 minutes old, and `/api/status` freshness
no longer depends on traffic. TGJU's ajax.json is also fetched with a `?cb=`
cache-buster: their edge was observed serving HITs 6× past its own max-age.

Cron failures log `[cron] <source> failed: …` (observability) and never
rethrow; the next tick retries. `wrangler dev` doesn't fire crons — use
`curl http://localhost:8787/cdn-cgi/local/scheduled` to trigger one manually.

## Insights ingestion (2026-10-07, Phase I3)

```
GitHub Actions  insights-ingest (cron 04:20 UTC + manual dispatch)
 └─ pnpm --filter @currena/insights ingest → fetch all sources → zod-validate
    → score → write KV via Cloudflare REST API (token: CLOUDFLARE_API_TOKEN secret)
KV namespace RATES:  insights:snapshot · insights:hist:<id> · insights:status  (no TTLs)
Worker (read-only):  GET /api/insights · GET /api/insights/:id/history · /admin card
```

- **Why 04:20 UTC**: the account's KV write counter crosses the 1,000/day
  free cap around ~19:00 UTC (ever-green rates cron + the second worker on
  the account; see docs/insights/03-data-sources.md §Phase I3 record). The
  cap is enforced on the KV REST API — the runner's exact path (Workers
  binding writes, e.g. the rates cron, are not blocked by it). The run lands
  in the fresh post-midnight counter; capped writes are retried in the
  runner.
- **Secrets**: one repo Actions secret, `CLOUDFLARE_API_TOKEN` (KV edit on
  the RATES namespace — value currently the owner-provided token; the agent
  cannot mint a narrower one, API 9109). To rotate to a KV-only token:
  Cloudflare dashboard → My Profile → API Tokens → Create Token → "Edit
  Cloudflare Workers" template is too broad; instead Custom Token with
  *Workers KV Storage: Edit* scoped to account `5f123468027e…` /
  namespace `4627ac33…` (RATES), then
  `gh secret set CLOUDFLARE_API_TOKEN --repo assadigit/Currena` (or
  Settings → Secrets and variables → Actions).
  `CLOUDFLARE_ACCOUNT_ID` and `INSIGHTS_KV_NAMESPACE_ID` are plain env
  values in the workflow (identifiers, not secrets — the namespace id is
  already public in wrangler.jsonc within the private repo).
- **Manual runs**: Actions tab → insights-ingest → Run workflow (tick
  `dry_run` to fetch+score without writes), or locally
  `pnpm --filter @currena/insights ingest --dry-run` (RBA rows fail loudly
  outside the Actions venue — Akamai).
- **A red run means a P1 indicator is unavailable** (product degraded) —
  that is the stale-feed signal until Phase I7 alerting. The snapshot is
  still written; history keys are best-effort and self-heal next run.
- **Post-run verification**:
  ```sh
  curl -s $B/api/insights | head -c 300                       # snapshot JSON
  curl -s "$B/api/insights/us10y/history" | head -c 200       # one card's history
  curl -s -H 'Sec-Fetch-Dest: document' $B/admin | grep -o 'Insights <span class="pill[^>]*>[^<]*'  # freshness pill
  ```

## Insights page deploy (2026-10-07, Phase I4)

The first deploy that changes the SPA bundle since 2026-09-24:

- `pnpm --filter @currena/web build` (fresh `apps/web/dist`), then
  `pnpm --filter @currena/api deploy` — Worker version
  `201590d8-89e3-41ce-94b5-295e3e190553`, upload 922.70 KiB (gzip 159.88 KiB).
- **Edge-cache note (observed, one-off):** the first `GET /` after the deploy
  returned the PREVIOUS `index.html` (`cf-cache-status: HIT` at HKG) even though
  the origin already served the new one (a cache-busting query returned the new
  entry chunk immediately). It self-resolved within ~60 seconds on the next
  revalidation; `workers.dev` was fresh instantly. If a deploy ever looks
  "missing", check `curl -sD - https://currena.ir/?v=$RANDOM` before concluding
  anything — and remember installed PWAs self-update within the hour via the
  autoUpdate service worker.
- Post-deploy smoke (all green): `/api/health` 200, `/api/rates?source=tgju`
  200 fresh, `/api/insights` 200 + the same ETag as the 04:20 UTC ingestion
  run, the new lazy chunk `/assets/Insights-*.js` 200, `#/insights` renders 28
  cards in en and fa (agent-browser, zero console errors, no horizontal
  overflow, card expand → chart + SR table + source link, language switch
  keeps open cards), and the converter/LED boards render unchanged.

## Insights reorder + I5 content deploy (2026-10-07)

The standard two commands (`pnpm --filter @currena/web build` +
`pnpm --filter @currena/api exec wrangler deploy`) — Worker version
`bef6f65b-e5b6-4655-8d14-25f7945b2e19`, upload 922.70 KiB (gzip 159.88 KiB),
13 new assets. The reordered Insights chunk is `Insights-oh-TxMJf.js` — the
compiled bundle carries `SECTION_ORDER=["global","australia"]` (verified by
grepping the deployed chunk; the reverse order appears nowhere).

- The calendar + china-pmi data did NOT wait for the 04:20 UTC cron: the run
  was dispatched manually right after the push (Actions run 37641720806,
  `success` on `f77bdd4`, snapshot `generatedAt 2026-10-07T15:02:48Z`, ETag
  `"insights:2026-10-07T15:02:48.875Z"`). A mid-day dispatch is safe while
  the account's KV write budget has headroom (it saturates ~18:30 UTC);
  from mid-afternoon UTC on, let the 04:20 cron do it instead.
- Post-deploy smoke (all green): `/api/health`, `/api/rates?source=tgju`,
  `/api/insights` — 14 calendar events, china-pmi 50.1/normal, **zero
  unavailable indicators**; `workers.dev` + `currena.ir` both fresh (no
  edge-cache staleness observed this time, unlike the I4 deploy); and a
  real-browser pass en+fa on `currena.ir/#/insights` (sections
  Global→Australia, summary rows, jump nav, card expand, 375px no overflow,
  zero console errors).

- Push-path fallback (observed 2026-10-07 15:08–15:13 UTC): `git push` can
  fail repo-wide with `remote: Internal Server Error` while reads
  (`ls-remote`/fetch) and the REST API stay healthy (a GitHub-side write-path
  hiccup; the status page may still say "operational"). Workaround that
  landed the docs commit: create blob → tree → commit via
  `POST /repos/{owner}/{repo}/git/blobs|trees|commits`, then fast-forward
  the ref with `PATCH /repos/{owner}/{repo}/git/refs/heads/main`, replaying
  the local commit's exact author/committer/message — the API reproduces the
  SAME commit SHA, so local and remote stay identical (verified
  byte-identical). Retry plain `git push` first; it usually recovers within
  minutes. Token discipline unchanged: env-only per command, never in files.

## Gold + silver ounce-price cards deploy (2026-10-07)

`feat(insights) b69375c` — `gold-usd` / `silver-usd` added at the top of the
metals group (info-only cards; TGJU + gold-api live points over World Bank
monthly history; owner request). The standard two commands: web build (entry
bundle byte-identical 288.75 kB / 87.78 kB gz; Insights chunk
`Insights-BEY6E9sZ.js` 104.54 kB / 31.49 kB gz, +1 kB for the two cards) +
`wrangler deploy` → **Worker version `b1a5e80e-b61e-4f21-994d-4342557de5ba`**,
922.73 KiB upload (gzip 159.88 KiB), 15 new assets, KV + cron bindings intact.

- Ingestion dispatched manually again right after the push (Actions run
  37646617580, `success` on `b69375c`, 15:46 UTC — inside the safe
  pre-~18:30 write-budget window): snapshot `generatedAt
  2026-10-07T15:46:25.777Z` with **30 readings** — `gold-usd` 4107.7 and
  `silver-usd` 60.109, both `context` @ 2026-10-07 with 10-year position
  ≈ 92%; two new `insights:hist:` keys (120 points each, 2016-11 → today);
  voting counts unchanged (global 3/11 cautious, australia 3/10).
- Post-deploy smoke (all green): `/api/health`, `/api/rates?source=tgju`
  fresh, `/api/insights` 30 readings with global ids preceding australia in
  reading order, both new history endpoints 200, single-point cards still
  404. Real-browser pass on `currena.ir/#/insights`: en (`US$4,108` /
  `US$60.11`, Context chips, position bars, expand → SVG chart + 12-row SR
  table + linked sources, "Warning when: info only — never votes") and fa
  (`۴٬۱۰۸ دلار آمریکا`, RTL, Persian position-bar wording), 375px
  `scrollW=clientW`, zero console/page errors; VLM visual QA clean on
  desktop-en and mobile-fa screenshots.

## Session wrap-up (2026-10-07 evening)

Owner direction: "Proceed to next phase if anything is remaining and wrap up
this session… Push, commit, update changelogs, deploy." Nothing remained in
the code (the ounce-price feature + Global-first ordering were already live),
so this was a verification + docs close-out.

- Gates re-run at `8ec66dc` (clean tree): typecheck 5/5, tests **516/516
  green** (core 157 · scraper 67 · insights 132 · web 52 · api 108).
- Docs commit `adc3fd5` (`docs(wrap-up)`): CHANGELOG wrap-up entry,
  `docs/NEXT_SESSION_PROMPT.md` rewritten as the hand-off brief for the next
  agenda (**Insights UI/UX pass + completeness sweep** — I6 backtest re-run
  and I7 hardening folded in), PROGRESS.md status row + decisions row +
  checklist row. Pushed `8ec66dc..adc3fd5` (inline token, sed-redacted;
  tracking ref resynced via ls-remote).
- Redeploy from the final HEAD (`pnpm --filter @currena/web build` →
  `wrangler deploy`): web build deterministic — **"No updated asset files to
  upload"** (byte-identical to the deployed `b69375c` artifacts; precache 60
  entries / 2169.10 KiB) → **Worker version
  `01de796a-aad6-4573-922c-48aa7bf1f6c7`** (922.73 KiB / gzip 159.88 KiB;
  RATES KV + ASSETS + `* * * * *` cron intact). Runtime identical to
  `b1a5e80e`; the version bump exists only so production provably matches
  the final HEAD.
- Post-deploy smoke (all green): `/api/health` ok (kv ok); `/api/insights`
  200 — 30 readings, `gold-usd` 4107.7 @ idx 8 + `silver-usd` 60.109 @ idx 9
  (top of the metals group), first australia id @ 18, 14 calendar events,
  ETag `"insights:2026-10-07T15:46:25.777Z"`; `/api/insights/gold-usd/history`
  200; `/api/rates?source=tgju` 200; SPA 200.
- agent-browser on `currena.ir/#/insights` (desktop + 375px): en — h2 order
  What changed → Coming up → **Global → Australia** → About, 30 cards,
  `US$4,108` / `US$60.11` Context cards, gold-card expand → SVG chart +
  13-row SR table + "Warning when: info only — never votes" +
  "TGJU (gold ounce)↗" source link; fa — `dir=rtl`, `lang=fa`, جهانی before
  استرالیا, «قیمت طلا (اونس)» ۴٬۱۰۸ دلار آمریکا; **zero console/page
  errors; 375px `scrollW=clientW`** (screenshot /tmp/insights-wrapup-fa.png).
- Token-rotation reminder: both tokens (GitHub + Cloudflare) transited chat
  again this session — rotate after use.

## Insights UI/UX pass deploy (2026-10-07, Phase I6)

`docs(I6) 6374631` final HEAD (runtime commits `7cbd319` I6-UX contrast →
`f7145a3` charts → `ef1be56` nav → `2ce2759` panel → `8c780e5` fa →
`fb768bc` backtest → `51fdc04` I7 admin staleness). Standard two commands:
web build (entry `index-v0FTqpU8.js` 288.75 kB / 87.77 kB gz — byte-stable
with the I5 baseline; Insights chunk `Insights-CgMP2Bfh.js` 105.98 kB /
31.94 kB gz, +1.44 kB raw / +0.45 kB gz for the scrollspy + accessible-name
ids; precache 60 entries / 2171.95 KiB) + `wrangler deploy` → **Worker
version `954f0034-508f-48fb-8dcf-7ad653c1666f`**, 923.27 KiB upload
(gzip 160.10 KiB), 16 new assets (48 already uploaded), KV + `* * * * *`
cron bindings intact, live on currena.ir + workers.dev.

- No ingestion dispatch needed — the UI/UX pass is presentation-layer only;
  the production snapshot (`generatedAt 2026-10-07T15:46:25.777Z`, 30
  readings, quiet week, 14 calendar events) is unchanged and the 04:20 UTC
  cron remains the steady state (today's scheduled + dispatched runs green).
- Production smoke (agent-browser, after the normal two-reload SW cycle —
  autoUpdate claimed the new precache on the second load): 30 cards; light
  chips now the deep inks (success chip computed `rgb(37, 109, 41)` =
  #256D29 ≥4.5:1); JumpNav pills 44px with scrollspy (active "Global" after
  jump); summary block sr-only "Market summary" h2 present; expand →
  accessible-name-labelled button, rule line 14px, chart years
  2016/2021/2026 (no grouping separator), 44px chart-data row; fa —
  generated line «به‌روزرسانی: ۱۴۰۵/۰۷/۱۵، ۱۵:۴۶:۲۵» (Persian comma live),
  chart years ۲۰۱۶/۲۰۲۱/۲۰۲۶; dark theme + 375px fa/en — no horizontal
  overflow, 30 cards, zero console/page errors.
- Session gates: typecheck 5/5, tests **521/521** (core 159 · scraper 67 ·
  insights 132 · web 52 · api 111), bundle budget held.

## Production incident — KV write failures (2026-10-07, 19:52 UTC → ongoing at session close)

Discovered by routine QA (I11 session). Symptom: `/api/rates` and
`/api/convert` returned **500 `internal_error`** on every request that
needed the scrape path, while `/api/health`, `/api/status`, `/api/meta`,
`/api/history` and `/api/insights` stayed 200. The SPA masked the tgju
failure locally (SW served its Cache API copy — the network panel showed a
real 500 for frankfurter); `curl` exposed it.

Timeline + diagnosis (evidence-corrected over the session):

- **Phase 1 — total write freeze, 19:52:30–~20:10:29 UTC**: every KV
  write failed, cron included (`/api/status` frozen at
  `lastScrapeAt 19:52:29`, `/api/history` frozen at 240 generations).
  The 500s began the moment the tgju snapshot crossed FRESH_TTL
  (200→500 flip observed live at 19:57:29/30). Reads healthy throughout.
- **Phase 2 — cron writes recovered, HTTP writes still failing** (from
  this sandbox's colo, cf-ray `-HKG`): the cron scraped+persisted
  successfully at 20:10:29 (tgju), 20:15:29 (frankfurter), 20:16:29
  (tgju) — while HTTP stale-path requests in the SAME minutes 500'd
  instantly (fast KV error, not a scrape timeout). Fresh-path and
  read-only endpoints stayed 200. By elimination (every other operation
  is proven working by another endpoint), the failing HTTP operation is
  the single-flight **lock PUT** in `tryAcquireLock`.
- **Root cause: NOT the daily write budget** (initial hypothesis,
  disproven): a 1,000/day account cap would block the cron's writes too
  — they work. The observed pattern is KV writes failing from the FETCH
  context (at least via the HKG colo) while the cron's location writes
  fine — consistent with a Cloudflare-side regional KV incident or an
  isolate/binding-level write failure. The definitive error string needs
  `wrangler tail` (observability is enabled) during a stale window.
- User impact: 500s during the TTL-expiry windows (typically <60 s every
  ~5–6 min per source) for affected colos; the SPA masks tgju via SW
  cache.
- Code bug exposed + FIXED (I11, commit `fix(rates)`):
  `RatesService.getRates` let store errors from `getStatus`/
  `tryAcquireLock` escape as unhandled 500s — the ladder's own spec
  promises the stale-cache rung. After the next deploy the same incident
  serves "Using cached rates — last updated N minutes ago" with HTTP 200.

### Second measurement (I12 session, 2026-10-07 20:35–20:46 UTC) — the
### frankfurter windows are ~10.5 min per 15 (70% of all minutes)

With the I6 Worker still live (fix undeployed), the incident was probed
end-to-end through a full cycle. The frankfurter snapshot fetched by the
quarter-hour cron at 20:30:30 crossed FRESH_TTL (5 min) at **20:35:30**;
every probe from 20:35:31 to **20:46:03** returned 500 (63 consecutive
failures) until the 20:45:00 cron refresh landed (~60 s KV propagation
lag). The next cron refresh for frankfurter would only come at 21:00 —
so the pattern is **TTL expiry → next quarter-hour + ~1 min =
~10.5 minutes of hard 500s per 15-minute cycle** for international
pairs, from affected colos. tgju stayed 200 throughout (the every-minute
cron keeps its snapshot inside the 5-min window — its stale windows are
seconds, not minutes). `/api/status` confirmed the diagnosis live:
`frankfurter.cache.fresh: false, ageSec: 750` while `tgju` fresh.

**Root fix shipped locally (I12, undeployed)**: frankfurter's fresh
window is now 15 min (`FRESH_TTL_SEC_BY_SOURCE` in @currena/core —
tgju keeps 300 s), aligned with the quarter-hour cron cadence, so
fetch-context requests stay on the fresh-cache rung between cron ticks
REGARDLESS of KV write health — the window ceases to exist at the root.
Combined with the I11 degradation fix, the incident's user-visible
effect collapses to: worst case, a "Retrying automatically" card in the
SPA (self-healing 15/30/60 s ladder) and honest stale banners.

Owner follow-ups (beyond the deploy):

1. **Deploy the I11 + I12 fixes together** — they close the 500s AND the
   windows that trigger them.
2. **Capture the real error**: during a stale window (~TTL expiry, check
   `/api/status` for `fresh: false`), run
   `pnpm --filter @currena/api exec wrangler tail` and read the
   `[rates] …` / `[api] unhandled error:` lines; check the Cloudflare
   status page + dashboard → Workers Logs (observability enabled) for
   the KV error code.
3. **If persistent**: CF support ticket (KV writes failing from fetch
   context in some colos), and/or exercise the documented RateStore
   port (AGENTS.md rule 2) — a KV→D1 migration is a swap of the adapter
   file.
4. Write-budget hygiene (secondary, still true): steady-state burn is
   ~1,150+ writes/day (tgju cron ~4 writes per ~5–6 min scrape +
   frankfurter quarter-hourly + history generations + insights
   ingestion ~31/run) against the free tier's 1,000/day — raise
   FRESH_TTL_SEC, skip identical-snapshot writes, or move to Workers
   Paid before the budget becomes a REAL daily outage at midnight+peak.

## Rollback

```sh
pnpm --filter @currena/api exec wrangler deployments list
pnpm --filter @currena/api exec wrangler rollback          # to the previous deployment
pnpm --filter @currena/api exec wrangler rollback <deployment-id>
```

KV snapshots survive rollbacks (schema is validated on read — an older Worker
serving newer-cache shapes fails loudly, never renders garbage).

## Offline behavior (verified 2026-09-17)

Service worker precaches the app shell; the last-good snapshot is persisted in
`localStorage` (`currena:snapshot:<source>`, zod-validated on hydrate). With the
network verifiably down: the app boots, converts (e.g. 100 USD → 23,050,000 IRR
@ 230,500 — local math), and shows the honest "⚠️ This rate is cached. Last
updated: X ago" state. Zero network until connectivity returns.

## Portability (drill results 2026-09-17)

- `packages/core` + `packages/scraper`: **zero** platform imports
  (`KVNamespace` / `wrangler` / `@cloudflare` / `node:` / `process.env` — grep
  clean). Web-standard APIs only.
- All storage flows through the `RateStore` interface
  (`packages/scraper/src/store.ts`); the only Cloudflare-specific code is
  `apps/api/src/adapters/kv-store.ts` (+ the `Bindings` type in `index.ts`).
- **KV → D1 swap**: implement `RateStore` over D1, swap one import in
  `makeDefaultService`. Nothing else changes.
- **Run elsewhere (Vercel/Node)**: Hono runs on Node via `@hono/node-server`;
  bring a `RateStore` adapter for your store (e.g. Upstash Redis or a D1/Postgres
  pool), move the SPA to any static host, point it at the API origin, and add
  CORS — the Workers deployment needs none (same origin).
- Scraper egress note: TGJU was proven reachable from Workers (HKG/ATL) and from
  GitHub Actions runners — GATE2_EVIDENCE.md. A different host must re-verify
  egress + re-run the Rial→Toman cross-checks (AGENTS.md §6).

## Cutover status (updated 2026-09-18)

1. ✅ **Production deploy done** — owner-authorized ("Deploy yourself", credentials
   provided). Branch `improve/autonomous-session-2026-09-24` @ `9d91ffb` is live
   on `currena.ir` + `workers.dev` (version `ddde3962…`); full smoke evidence in
   SESSION_LOG.md. The Custom Domain was already attached (pre-existing).
2. ✅ **PWA metadata** — manifest is origin-agnostic (`start_url: '/'`), verified
   against both live URLs.
3. ⏳ **Legacy decommission** (owner's call, outside this repo): announce + flip
   any remaining links off `aliassadi1993.pythonanywhere.com`, keep it alive for a
   grace period, then decommission from its dashboard.
4. ✅ **Session wrapped up** (2026-09-18): CHANGELOG.md added; branch merged to
   `main` locally; commits ready to push and the final-HEAD redeploy documented
   above (§Redeploy the latest HEAD). Credentials for push/deploy are env-only
   in the session runner — the owner runs the two commands from §Deploy after
   exporting tokens.
5. Post-cutover backlog already documented: scanner OCR (client-side), scan
   gallery, D1 history + charts, Cloudflare Access on `/admin`, source toggles.

## The seven-wave deploy (2026-10-08, I7→I12 stack + I13)

Owner directive "Push commit deploy" with fresh credentials. First action:
`git push` of the **26-commit stack** `2803932..7467853` (I7 Wave 6 + I8 +
I9 + I10 + I11 + I12 — the I6 session's claimed pushes had never landed;
verified post-push via the GitHub API: origin/main HEAD = `7467853`).
Then the standard §"Deploy" procedure from that HEAD:

- `pnpm --filter @currena/web build` — entry `index-HpOGzRzk.js`
  295.08 kB / 89.37 kB gz, Insights chunk `Insights-EvsQupwH.js`
  128.42 / 37.90, precache 61 entries / 2209.80 KiB (byte-matches the I12
  session record).
- `wrangler deploy` → **Worker version `dbccaed3-5fa8-4c9c-af4c-9280ef63049c`**
  (17 new assets, 924.12 KiB upload / 160.35 KiB gz, cron `* * * * *` +
  RATES KV bindings intact).

Post-deploy smoke (all green):

- `/api/health` ok; `/api/insights` **30 readings** (gold-usd 4107.7 /
  silver-usd 60.109 at the metals top, all 18 global ids before the first
  Australia id, 14 calendar events, 6 warnings = 3 global + 3 Australia).
- **The incident fix verified live**: `/api/status` frankfurter cache
  `ageSec: 523, fresh: true` (the I6-era 300 s window would have read
  stale → the 500 windows); `GET /api/rates?source=frankfurter` → 3× fast
  200s (51–310 ms) serving 30 currencies from cache.
- SW two-reload cycle on currena.ir → the new precache confirmed
  (`Insights-EvsQupwH.js` + `index-HpOGzRzk.js` present in
  `workbox-precache-v2`); full browser QA of every I7–I12 feature
  followed (worklog + CHANGELOG §2026-10-08 I13 for the checklist):
  share deep-links, chart tooltip + keyboard stepping, zoom ranges,
  watchlist pins, reading progress + JumpNav scrollspy, LiveRateLine +
  recent pairs, mobile single-open, dark mode, zero console errors,
  zero 375px overflow.

**Second deploy, same session (I13)** — pushed `7467853..e4bdfe9` and
deployed from that HEAD: entry `index-Ctp0IB4-.js` 295.10 kB / 89.36 gz,
Insights `Insights-Da8xumr9.js` 133.82 / 39.01, precache 61 / 2217.23 KiB
→ **Worker version `69550e36-cd4a-462a-a7ca-a431eb0a9885`**. Smoke: health
ok, 30 readings, the two-reload SW cycle, then CSV button (fa + en), j/k
walk (card focused + opened + scrolled), kbd legend ×3, 375px overflow 0,
zero page errors; VLM PASS on the new About-the-data export block.
One operational note: DURING the SW handover (old entry still in memory,
new Insights chunk already served) the lazy route can hit the route error
boundary once — `registration.update()` + one reload resolves it to the
consistent new state; that is the documented two-reload cycle doing its
job, not a defect. Budget note: Insights raw 133.82 > 132 gate → bumped
to 134 with justification (scripts/check-bundle-budget.mjs; CHANGELOG
§2026-10-08 I13).

**I14 deploy (2026-10-08, post-sandbox-reset round)** — the sandbox lost
`/home/z/currena` between rounds; re-cloned at `a6df82c` with a fresh
owner token (remote scrubbed), baseline re-verified (typecheck 5/5, tests
611/611, origin/main = a6df82c via ls-remote), the local replay env
rebuilt (35 production KV values read via the REST API read-only and
seeded into local miniflare; `pnpm --parallel dev` via the double-fork
detach). The rate-alerts wave landed as `5ccaaaf` (code + docs in one
commit), pushed `a6df82c..5ccaaaf`, then deployed: entry
`index-CPY3qmXQ.js` 290.12 kB / 87.00 gz (BELOW the I13 record 295.11/
88.55 — the AlertsDialog is a lazy 7.00 kB / 2.59 gz chunk), Insights
`Insights-CP_PBvhh.js` 133.85 / 38.88, precache 64 / 2236.04 KiB →
**Worker version `0195910c-9c8e-42c5-b292-c56e936194fd`** (upload 924.13
KiB / gzip 160.47; KV + minute-cron bindings intact). Production smoke:
health ok, 30 readings, entry hash byte-matched on currena.ir, the SW
handover needed two reloads (old `index-Ctp0IB4-.js` once, then
`index-CPY3qmXQ.js`), the alerts row live in fa; dialog opened, an
above-100,000 alert CREATED ON PRODUCTION fired instantly («فعال شد در
۲۶۳٬۲۰۰ · همین حالا» + toast «🔔 نرخ دلار آمریکا → تومان ایرانی به
۱۰۰٬۰۰۰ رسید»), the test alert deleted (empty state verified), 375px
overflow 0, zero console errors. Budget: held WITHOUT a bump — entry
290.12/87.00 vs gates 296/89.5.## Session record — 2026-10-08 I15 (the owner-spec wave)

**Deploy order mattered this round:** the indicator-set change (41 ids,
`dollar-broad` retired) makes the NEW Worker's zod read-side validation
reject the OLD KV snapshot — and vice versa. So the sequence was:
1. Push `0fca0e2..5f15b7b` (I15).
2. **Dispatch the ingest FIRST** (run 37727566021, green, "P1 COMPLETE") —
   it read the old snapshot (validation-failed as a stored value, ignored),
   fetched F6 FLRHOOTA successfully from the venue (the Series-ID parser's
   first real-file pass: 6.2% @ 2026-08-31), and wrote the NEW-format
   snapshot + the new histories into KV. During the gap, `/api/insights`
   correctly answered `insights_not_ready` (the old Worker refusing the
   new format — the honest degraded state, not garbage).
3. `pnpm --filter @currena/web build && CLOUDFLARE_API_TOKEN=…
   CLOUDFLARE_ACCOUNT_ID=… pnpm --filter @currena/api exec wrangler deploy`.

**Worker version of record: `3e03c039-5849-4771-80c5-4e374c26df10`** from
HEAD `5f15b7b`. Entry `index-RBMy43ic.js` 290.12/87.76; Insights
`Insights-m_YS4gpt.js` 235.80/61.92 (budget 240/64, bumped with
justification in CHANGELOG §I15 Budget).

**Post-deploy production smoke (2026-10-08 04:30–04:40 UTC):**
- `/api/health` ok; `/api/insights` **41 readings**, all 12 new ids, **zero
  stale / zero unavailable**; gauge summary Global *stressed* 4/16 ·
  Australia *cautious* 5/13; 14 calendar events; big movers present
  (real-yield z=9.8, us10y 9.1, ecb-dfr 8.7 — the rate-cut regime is the
  decade's unusual move, per the spec formula).
- New history endpoints live: `dollar-basket/history` 200 (458 pts),
  `au-wage-growth/history` 200 (below-aux fires live: 3.2% wages < 3.35%
  CPI → alert).
- Page QA (agent-browser): en/fa × desktop/375px — hero meters with the
  Australia-first swap, 6 price rows (gold USD+A$ line, BTC context
  ratios), lane switch remembered, panels, sticky nav, FRED notice, no
  buy/sell wording, `scrollW=clientW`, zero console errors. The converter
  (money page) verified intact.
- Honest first-run notes: btc/copper daily-history accumulation started
  with this run (7/30-day changes appear from tomorrow's snapshot);
  gold/silver seeded 120 accumulated points from the previous KV history.



## Session record — 2026-10-20 (owner UI restore): the PREVIOUS hero + ContinueStrip + full lens table shipped over the kept v3 data layer

The owner, on seeing the merged v3 surface live: "I liked the previous UI
more, especially for the world and australia header sections. please
revert back to the previous version UI, but keep the new data, connections
etc. I mean keep those part of updates which are about the indicators and
their connection and reliability. but in the PREVIOUS UI."

- **Restored verbatim from `main@1e39a24`** (directive recorded in the file
  headers, CHANGELOG §2026-10-20 and UI_REPORT's addendum): the editorial
  hero (art-band region cards, tinted verdict pill + meter, attention
  tiles, compact gauge rows, rule/signals panels, R4 biggest-move card,
  the mobile Global-first swipe carousel) with the raised world-section
  bullets + section indicators back on the Global card; the ContinueStrip;
  the full five-lens markets table (1 week · 1 month · 1 year · Trend ·
  Status — UI-27's column cut retired, its local-currency note KEPT);
  `hero-editorial.test.tsx` with them. The v3 hero card + MovesNextStrip
  retire from the page (their files stay, unused, for the record).
- **Kept — the v3 indicators/connections/reliability layer, untouched**:
  sources registry + method ladder + kill switches, new adapters
  (Shiller FS-06, owner-disabled), connections machinery, validation +
  sanity gates, six-word state language + Delayed tier, StatusChip/
  CardMeta on-face meta, the data-health chip, the About rework, the
  owner-gated export, the M-5 panic switch, the per-metal v7 BalanceScale
  with the UI-40 sparse rule, the 5-event calendar with tz labels,
  relationship cards, the markets/fx public gating.
- **Gates**: web 698/698 (678 + the restored 20-test editorial suite) ·
  typecheck 6/6 · lint 0 errors/15 advisories · copy:audit clean · visual
  19/19 (U-01/U-11 re-pinned to the restored hero/table) · self-check
  25/25 (SELF_AUDIT.md + the dated export regenerated) · budgets: the
  restored editorial markup costs +10.60/+2.43 kB — Insights lazy
  measured 697.38/167.88, budgets bumped 687/166 → 700/169 justified in
  the budget script + CHANGELOG (entry untouched 295.28/88.81) · VLM
  visual pass on the regenerated local captures (desktop + mobile
  carousel).
- **Deploy** (web-only round — no API/markets code changed): SPA build +
  `currena-api` **`d51b0afe-d59f-46c0-a12d-3b58cc1cd273`** (SITE_MODE=public
  untouched; currena-markets untouched at `3f245d75`). Commit `0bd742c`,
  fast-forwarded `main`, released as `2026-10-20-owner-ui-restore`.
- **Live-verified on currena.ir (2026-10-20)**: served chunk
  `Insights-BV1B4d2b.js` == the restored local build · the editorial hero
  (Global first, Stressed pills both regions, art bands, tiles, gauge
  rows, the R4 mover with its reason) · the restored world-signals panel +
  section indicators ("5 of 16 markets…") · Australia's own signals box ·
  the ContinueStrip · the full 10-column table with 16 live rows and the
  local-currency note — **the 1-year column now carries real values
  (the §12 chg1y backfill check RESOLVED by tonight's 23:30 UTC run)** ·
  the kept data surface (data-health chip "4 stale", 2 per-metal balances,
  five lens pills) · fa RTL + Persian digits + «سیگنال‌های جهانی» ·
  mobile 390 carousel (cue, dots, prev/next, Next → Australia, zero
  overflow) · zero console/page errors EN+fa, 390+1440. Evidence:
  `docs/evidence/2026-10-20-owner-ui-restore/` (README + 4 screenshots).

## Session record — 2026-10-19 (v3 merge): the rebuild meets main, both owner streams on one tree, shipped to production

The owner: "Commit Push deploy. merge with main branch. and deploy and
release." The v3 `insights-rebuild` (12 commits, spec package 100%
implemented, Phase-9 verified 1,637 green) merges `origin/main`'s 96
newer parallel-round commits into one tree — the v3 spec package
(uploaded at main's tip, `1e39a24`) governs the Insights page; main's
live machinery implements it.

- **The merge's one hard call — the balance**: the owner's v7
  `BalanceScale` (5 wireframe iterations, live on currena.ir) renders
  PER METAL per v3 UI-45 (gold AND silver, the silver-only industrial
  condition inside silver's); UI-40 sparse honesty rides the component
  (readable < 3 → level beam + refusal wording, gauge hidden); UI-39.5's
  readable-count line renders on both. The 12° helper law is superseded
  by the owner's iterated 8°/2° law + the sparse rule — recorded in
  together-signals.test.ts; the readable-1 "Not enough readable
  conditions to weigh" line is unit-pinned (balance.test.tsx §9) and the
  readable-0 word keeps the owner's "Can't read the conditions right now".
- **Retired by the governing v3 spec** (recorded honestly): the
  editorial carousel hero + art bands (replaced by the UI-01..09 hero),
  the ContinueStrip (replaced by MovesNextStrip, UI-18/19), the full
  table's Trend/week/month/year columns (the exact UI-27 set ships; the
  lens data + every export column stay), the separate silver-only list
  (folded into silver's balance), the spoofed Mozilla Yahoo UA (never —
  T-25/F-09 honest UA at range=2y).
- **Kept from main** (owner directives, live): the markets board public
  (2026-10-18b) behind the M-5 panic switch, the world-indices briefing
  around the UI-27 table, the ≥96px wordmarks, the prices sparkline
  cards + PriceDetails sidebar, the Australia signals content, the
  grayscale controls language (at the v3 44px touch minimum).
- **Gates on the merged tree**: 1,804 tests green (core 191 · scraper 67
  · insights 521 · markets 13 · api 334 · web 678); typecheck 6/6; lint
  0 errors/15 advisories; copy:audit clean (manifest union: +silver
  balance strings, +verdictNone/silverOnly triage, −6 retired entries);
  T-15 + budgets held (Insights lazy 686.78/165.45 inside the measured
  687/166 bump, entry untouched 295.28/88.81); visual acceptance 19/19
  (U-09/U-09a re-pinned to the merged BalanceScale with the level-beam +
  readable-line pins, U-10 duration-based); self-check 25/25 —
  SELF_AUDIT.md + `exports/currena-insights-full-2026-10-19.md`
  regenerated.
- **Deploy**: all three commands — web build + `currena-api` +
  `currena-markets` (the markets worker's honest-UA fetchers changed);
  SITE_MODE=public rides the owner directive. LIVE: currena-api
  **d50def63-38f6-41a7-9377-bac12c157d1d**, currena-markets
  **3f245d75-6693-4fef-a965-97a33fc3b1a4** (both crons re-armed; the
  board serves honest chg1y dashes until tonight's 23:30 UTC run).
- **Live-verified on currena.ir (2026-10-19)**: /api/insights 200 public
  (32 readings) · markets 200 (16 rows) · fx 404 (by design) · export 403
  `owner_disabled` (U-14: 401/403 — the owner token is the ONE unset
  secret) · the v3 hero (verdict Stressed + the full anatomy) · the
  per-metal balances with the sparse-honesty rule live (gold 1 of 4,
  silver 1 of 5 readable → BOTH level + the refusal line in en and fa) ·
  the briefing with five lenses + the exact UI-27 table (16 rows) · fa
  RTL + Persian digits + silver's own copy · 390px zero overflow · zero
  console/page errors. Evidence:
  `docs/evidence/2026-10-19-v3-merge/` (README + 5 screenshots).

## Session record — 2026-10-08 I16 (the daily-accumulation fix)

**No Worker deploy this round.** The I16 fixes
(`withLivePoint` same-day replacement, `buildHistoryFile` `minPoints`
bootstrap, gold-silver in SEED_IDS) live entirely in the ingest-runner
half of `@currena/insights` — the code GitHub Actions executes. The
Worker and the SPA import only definitions/gauges/store types, so the
deployed Worker `3e03c039` (I15) stays the version of record; the KV
snapshot format is unchanged (same 41 ids, same schemas — a 1-point
`insights:hist:btc-usd` passes `IndicatorHistorySchema.points.min(1)`
and the route/UI treat it as the honest "no chart yet" state).

**Deployment sequence (runner-only):**
1. Commit + push `eda76ea..<I16 sha>` to `origin/main`.
2. Dispatch the ingest workflow (Actions picks up the pushed code):
   `gh api /repos/assadigit/Currena/actions/workflows/insights-ingest.yml/dispatches`
   or the GitHub UI — run record below.
3. Production smoke on the EXISTING Worker.

**Post-fix production state (verified this session):**
- The pre-fix snapshot showed the mismatch live: gold 4136.20 ÷ silver
  60.17 = 68.74 implied vs the gold-silver reading 69.97 (both stamped
  2026-10-08) — seeded rows carried the 04:27 price, the unseeded ratio
  carried the 11:27 live one.
- After the dispatched I16 ingest run: all same-date price rows and the
  ratio agree (verify `gold-usd / silver-usd ≈ gold-silver` within
  float dust); `insights:hist:btc-usd` exists (1+ accumulated points);
  `GET /api/insights/btc-usd/history` 200. The btc/copper 7/30-day
  changes become measurable from 2026-10-15 (7 daily points) /
  2026-11-07 (30) — honest accrual, per data spec §3.
- Operational note: GitHub Actions executes the 04:20 UTC cron ~7 h
  late (~11:10–11:30 UTC observed on 2026-10-07 and 2026-10-08) —
  still inside the fresh KV write-budget window (the account counter
  crosses 1,000/day around 18:30–19:00 UTC), so the schedule stays
  as-is; documented here so a future "why did the run fire at 11?"
  question has its answer.

## Session record — 2026-10-08 I17 (the v2 wave: Together + signals)

**Worker deployed: `54998eb8-f149-4e0c-bf35-542e0d5dc869`** from HEAD
`12d76b2` (I17). The change set is web-side only (the two new sections +
the Together nav pill + the bilingual corpus) plus pure logic in
`packages/insights` (connections.ts, signals.ts) that the SPA imports
lazily — **no ingest change, no snapshot-format change**, so the
ingest-then-deploy ORDER rule did not bind this round (the read-side
zod contract is untouched; a plain Worker deploy suffices). The ingest
workflow was still dispatched after the push as a smoke: run
`37775748411` @ `12d76b2` — **green** ("P1 COMPLETE", 7 writes, snapshot
`2026-10-08T12:17:12Z`).

**Deploy sequence (web-change-only):**
1. `pnpm --filter @currena/web build` — Insights chunk 270.01 kB /
   69.50 kB gz (budget bumped 240/64 → 280/72 with the itemised
   justification in `scripts/check-bundle-budget.mjs`; entry untouched
   at 290.12/87.76 vs 296/89.5).
2. `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…
   pnpm --filter @currena/api exec wrangler deploy` → version
   `54998eb8-f149-4e0c-bf35-542e0d5dc869`, 13 of 13 assets uploaded.
3. Dispatch the ingest (smoke) + production browser QA.

**Post-deploy production state (verified this session):**
- `/api/health` ok; `/api/insights` 41 readings, zero stale/unavailable,
  generated 12:17 UTC.
- `https://currena.ir/#/insights`: 6 connection cards (states
  disagree · disagree · active · active · partly · disagree — the
  pinned 2026-10-08 live reading), 2 signals cards (gold "2 of 5
  conditions met" mixed · silver "3 of 6" mixed), 5 nav pills
  (Status · Prices · Together · Indicators · About), both
  before-you-act boxes visible.
- en + fa (RTL) × 1280/375: zero console/page errors, no bare
  buy/sell wording (EN word-boundary regex + the fa
  خرید/فروش pattern), no horizontal overflow.
- The converter (money page) intact — boots, input present, zero
  errors.
- `SIGNALS_ENABLED = true` (apps/web/src/components/insights/config.ts)
  — the spec's flag, enabled with the owner's full approval this round;
  one flip to false hides the signals section.

## Session record — 2026-10-08 I18 (the mobile answer-line fix)

**Worker deployed: `e4c8cdb6-3947-4c1c-a64a-bcb09af2bef0`** from HEAD
`eb59365` (I18). Web-only change set (one utility class on the L2
answer span + docs) — **no ingest change, no snapshot-format change**,
so the ingest-then-deploy ORDER rule did not bind; a plain Worker
deploy sufficed. The ingest workflow was still dispatched after the
push as a smoke (run `37789134410` @ `eb59365`).

**What the fix was:** the wrap-up audit of the live I17 deploy found
~37px of scrollable horizontal overflow on `#/insights` at 375px in
en/LTR (the page could be swiped sideways). Root cause: the
group-header answer span was `min-w-0 flex-1` — `min-w-0` let it
shrink below its longest word (~81–90px at caption size in a ~38px
box), and the word bled out as *scrollable* overflow up to `<html>`
(section 386/396 → route 412 → 37px pan). fa/RTL never showed it
because left-edge overflow in RTL does not extend `scrollWidth` —
which is also how the I17 QA (fa-first) honestly missed it. Fix:
removed `min-w-0` — the answer now wraps to its own full-width line
on phones; desktop unchanged.

**Deploy sequence (web-change-only):**
1. `pnpm --filter @currena/web build` — Insights chunk 270.00 /
   69.49 gz (budgets 280/72; entry 290.12/86.99 vs 296/89.5 —
   `scripts/check-bundle-budget.mjs` all green).
2. `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…
   pnpm --filter @currena/api exec wrangler deploy` → version
   `e4c8cdb6-3947-4c1c-a64a-bcb09af2bef0`.
3. Dispatch the ingest (smoke) + production browser QA.

**Post-deploy production state (verified this session):**
- `/api/health` ok; `/api/insights` 41 readings, zero
  stale/unavailable, generated 12:17 UTC (the I17 snapshot — the
  data side is untouched by I18).
- `https://currena.ir/#/insights` serves the new chunk
  (`Insights-CuZyVYmz.js`): en/375 `scrollWidth = clientWidth = 375`,
  horizontal pannability 0 (was 37px); fa/RTL 375 clean; desktop
  1280 clean; the v2 sections (Together + signals, 5 pills) intact.
- Details panel opens via a card button at 375px in fa (RTL bottom
  sheet) and Escape-closes; zero console/page errors throughout.
- Wording discipline re-verified: EN `\b(buy|sell)\b` = 0; FA bare
  خرید/فروش = 0 (the two «خریداران» inflections are the documented
  S3 dealing-costs pattern, same as EN "buyers").
- All other routes spot-checked at 375 (`/`, `/history`,
  `/calculator`, `/receipt`, `/settle`, `/about`): 375/375.
- Gates at HEAD `eb59365`: typecheck 5/5, tests 747/747, CI green.

## Session record — 2026-10-08 final wrap-up (deploy from the round-2-prep HEAD)

**Worker deployed: `60b41387-0c1f-44b5-80e1-3c773463bf0e`** from HEAD
`f173b65` — the owner's docs-only round-2-prep commit (the new
`docs/insights/06-ux-round-2-spec.md` + `07-agent-loop-prompt.md` +
`mentor-specs/` provenance copies; zero code changes, so the built
chunks are byte-identical to the I18 deploy — same
`Insights-CuZyVYmz.js` / `index-CjtI_gxE.js` hashes). This was the
session-close-out deploy requested by the owner: latest HEAD →
Cloudflare, then the deploy record committed and pushed.

**Gates re-run at `f173b65`** (fresh clone, `pnpm install
--frozen-lockfile`): typecheck 5/5, tests 747/747 (core 183 ·
scraper 67 · insights 193 · api 119 · web 185), build + budget check
all green (entry 290.12/86.99 vs 296/89.5; Insights 270.00/69.49 vs
280/72). CI on `f173b65`: green.

**Production verified after the deploy:** `/api/health` ok;
`#/insights` serves the I18 chunk with the fix intact — en/375
`scrollWidth = clientWidth = 375` (pan 0), desktop 1280 clean, the v2
sections (Together + signals) live, no buy/sell wording, zero
console/page errors.

**Ingest smoke — honest incident note:** the dispatch run
`37835315742` @ `f173b65` computed all 41 readings correctly but
**exited 1** on the final `PUT insights:snapshot`: HTTP 429, Cloudflare
KV free-tier **daily write cap for the account** (code 10048,
"free usage limit for this operation for today"). The account's
minute-cron rates ladder + today's earlier ingest runs had consumed
the day's quota by ~19:54 UTC. This is an account-level quota event,
not a code regression: the ingest retried (60s/120s), then failed
loudly per design. **No data impact** — the write was rejected before
touching KV, so the live snapshot remains the 14:02 UTC one (41
readings, zero stale/unavailable, gauges Global stressed 4/16 ·
Australia cautious 5/13; verified after the incident). The daily KV
quota resets at 00:00 UTC and the scheduled ~11 UTC run (see §I16
timing) recovers automatically; nothing to hand-fix. If this recurs
on smoke dispatches, prefer dispatching them before the evening UTC
hours, or skip the smoke when the scheduled run of the day is already
green.

## Session record — 2026-10-10 I19 (the staleness false-alarm fix)

**Worker deployed: `093e51e6-5524-413d-a178-32ba4a0d493f`** from HEAD
`0b71e0b` (I19). Data-definitions change set (`definitions.ts` +
its test + docs) — the snapshot FORMAT is unchanged, but the computed
`status` values change, so the documented **ingest-then-deploy ORDER**
was followed: the ingest dispatched first (run `38010201689` @ `0b71e0b`,
**success**, 00:42:30→00:44 UTC), the Worker deployed second.

**What the fix was:** the post-I18 verification pass found the live
snapshot carrying one stale reading — `govt-interest-revenue`, asOf
2026-04-01, aged 192d, one day past the 190d quarterly grace. FRED
confirmed the Q2 obs is the freshest that exists (BEA publishes the Q2
obs with the advance estimate ~Jul 30 and it stays latest until the Q3
advance ~Oct 29-30), so the 190d cadence grace was the defect — the same
obs-date-vs-release-date gap I15 closed for the ABS quarter-start items.
Fix: `staleAfterDays: 215` (BEA NIPA obs ages up to ~212d between
advances; mirrors the ABS discipline), asserted verbatim in the I15
freshness-overrides test.

**Post-deploy production state (verified this session):**
- `/api/health` ok; `/api/insights` 41 readings — `normal 20 · warning
  10 · context 11`, **zero stale/unavailable**, `generatedAt
  2026-10-10T00:42:52Z` (the I19 re-ingest). The govt-interest-revenue
  reading: `normal`, same value 33.6% / percentile 72.97 — only the
  status was ever wrong.
- `#/insights` (en, 1280): zero console/page errors, no overflow
  (1280/1280), the word "stale" appears nowhere; Global lane (via the
  Australia|Global switch) renders all five question groups with
  "The US government's interest bill vs its income — 33.6% — Normal";
  Together + signals sections intact; no buy/sell wording.
- `#/insights` (fa, 375): `scrollWidth = clientWidth = 375` (pan 0),
  dir=rtl, zero stale wording, the Global meter reads ۴ از ۱۶ شاخص در
  هشدار; homepage fa RTL clean, converter live (1 USD = ۲۶۶٬۲۰۰ تومان,
  TGJU, updated 3 min ago), amount input accepts input.
- Gates at HEAD `0b71e0b`: typecheck 5/5, tests 747/747, build +
  budget all green (entry 290.12/86.99 vs 296/89.5; Insights
  270.02/69.50 vs 280/72).
- Scheduled ingest runs Oct-8 (run 7) and Oct-9 (run 12) green; the
  failed run-11 dispatch was the known KV daily-write-cap 429/10048 —
  auto-recovered at 00:00 UTC, no data impact.
- Daily accrual verified: Oct-8 AND Oct-9 points present for
  btc/copper/gold/silver (btc 2 points post-bootstrap; the others
  monthly base + daily rows) — the 2026-10-15 seven-day-change
  milestone stays on track.
- `/admin` note: unauthenticated GET now 401s to the sign-in page
  (ADMIN_VIEW_SECRET is set in production — the opt-in gate from the
  security wave working as designed; robots.txt still carries
  `Disallow: /admin`).

## Session record — 2026-10-10 UX round 2 (the signal-first density pass)

**Worker deployed from round-2 HEAD.** The round-2 spec
(`docs/insights/06-ux-round-2-spec.md`, D1–D13 + the 2026-10-10 revision)
was implemented across the whole Insights surface (R1–R28) — the build
ledger with per-block evidence is `docs/insights/ROUND2-LEDGER.md`, the
change inventory is CHANGELOG §2026-10-10 (round 2). Committed as
`3f03323` (feat(insights): UX round 2) on top of the spec-revision commit
`38e146f`; pushed to origin/main.

- **Gates at HEAD `3f03323`:** typecheck 5/5; tests **785/785** (web 185 →
  223 — the 38-test round-2 guard suite `round2.test.ts`); build green;
  bundle budgets green — entry untouched (290.32/87.05 vs 296/89.5),
  Insights consciously bumped 280/72 → **300/78** (296.12/75.40 measured,
  itemised justification in `scripts/check-bundle-budget.mjs`).
- **No ingest-then-deploy needed:** the only definitions change
  (`copper-usd` group `prices-board` → `growth-health`) is render-time —
  the snapshot computation, the contract and the stored payload are
  unchanged; the deployed Worker serves the SAME snapshot
  (41 readings, `generatedAt 2026-10-10T10:40:40Z`).
- **Deploy:** `wrangler deploy` → Version **`3eb5e030-b89d-4645-b6c7-55a089a43b51`**
  (assets = the freshly built web dist; cron unchanged).
- **Pre-deploy QA** (local: wrangler dev KV seeded from the production
  snapshot + the built SPA): en/fa × 1280×800 / 375×812 × light/dark —
  zero console errors; `scrollWidth == clientWidth` at every width; both
  evidence lanes collapsed by default with correct summaries; the merged
  signals card with zero ✓/✗; the footer "Before you act" exactly once with
  a working pointer (scroll + focus + ring highlight); Tools keyboard pass
  (open, Escape, focus return); pill-expand; group "See all" expansion; lane
  switch + persistence; R20 computed value/title ratio 1.45; fa renders
  Persian digits in every count (۲ از ۵) and Persian commas. Two real bugs
  found by QA and fixed pre-deploy: the fa band-position words rendered in
  English (the `{bandPos}` token got the EN defaults) and every count
  interpolation rendered Latin digits in the fa build; plus the R28 guard
  caught the two-sided-band "below" fallthrough and the R10-banned
  "calm is returning" claim in the gold lines of both locales.
- **Post-deploy production smoke (2026-10-10 15:51 UTC):** `/api/health` ok;
  `/api/insights` 41 readings; SPA 200; robots 200; `/admin` 401 (gated).
  `#/insights` en/1280: hero Global first, both lanes collapsed, zero
  "Alert" words, 4 needs-attention cards with rule lines, no overflow, zero
  console errors; fa/375: dir=rtl, no overflow, the signals summary reads
  «طلا: آمیخته، ۲ از ۵ شرایط برقرار — قیمت در ۷٪ بالای ۱۰ سال گذشته».
  Homepage (money page): converter live — 100 USD → ۲۶٬۴۹۶٬۴۰۰ IRR (Toman)
  at the Oct-10 TGJU rate, board + at-a-glance intact.
- **Returning visitors:** the SPA service worker precaches — existing
  visitors get the new shell on their next visit and the new lazy Insights
  chunk after the standard two-reload SW update cycle (same as every
  previous wave).

## Session record — 2026-10-13 (Insights Step-1 fix list + fx evidence artifacts)

**The 12 Oct external audit's Step-1 wave** (currena-insights-step1-fix-list.md,
committed by the owner): wrong/outdated numbers, date handling, calculation and
label errors, contradictions, hero mapping, stock-row presentation, forecast
wording, trust items and the pipeline — plus the world-currencies spec's
finish-line artifacts (the evidence run + the fx data check).

- **Engine**: Fed target = the TRUE DFEDTARL/DFEDTARU corridor (reading value
  = lower bound + `rangeHigh`); au-cpi/au-trimmed-mean → the ABS MONTHLY CPI
  (live-verified Aug-2026: 4.0% / 3.6%); core CPI (CPILFESL) as the US card's
  context companion; RBA cash rate → the DAILY F1 table (venue-verified:
  4.60% from the Sep-29 hike's effective date); breakeven-5y5y re-backtested
  (threshold above 2.4% sustained 4 weeks — fires once/decade); points-not-%
  on every rate series; monthly/quarterly changes = "since previous release";
  percentile on YoY growth for M2/home values; fromPeak10y on every reading;
  hold-last-good on failed fetches (stale-marked, original asOf); daily grace
  3→5 days (the DGS10/DFII10 false-stale); release dates from
  data/insights-release-schedule.json; ONE count rule for the region verdict
  words (displayed on the page).
- **Web**: UTC date-only formatting (the one-day calendar shift); data-date +
  stale tags + release dates on every card; "One bitcoin buys X oz";
  gold-silver recomputed from the live tiles' snapshot; € per USD;
  US$23.3 trillion; the policy-rate "Recent move" lines; stock tiles' 52-week
  distance everywhere + Delayed tags + the local-currency note + one ±1% flat
  band for trend words; "Mixed: N of M markets in correction"; calm-area
  lists in the heroes; "Conditions for gold and silver" (Supports / Works
  against — no forecast wording, both locales swept); the accurate sources
  list; the backtest sentence once + its small sample; "prices updated HH:MM"
  in the header (serve-time pricesAsOf); the savings money-row leads with the
  cash rate + a new piggy-bank artwork; the petrol row derives from the oil
  rule; the gold-near-decade-high-while-real-yields-high warning.
- **Artifacts**: docs/specs/insights-world-currencies-evidence.md (522-week
  replay: R1 7.5% · R2 2.9% · R3 11.7% · R4 6.5% · R5 15.3% · R6 4.0% of
  weeks; the known episodes caught), fx-data-check (10/10 pairs within 0.5%),
  the markets data-check KV-usage record, BACKTEST.md regenerated.
- **Gates**: typecheck 6/6; 1,000 tests green; Insights chunk 465.70/113.98
  (budget 469/115.5, itemised); entry untouched 290.38/87.07.
- **Deploy**: ingest dry-run verified the F1 daily parse from the Actions
  venue (rba-cash-rate 4.6), then the real ingest wrote the new-format
  snapshot (generatedAt 2026-10-13T04:09:47Z; Global cautious 3/16 ·
  Australia stressed 5/13 · 0 excluded); currena-api **6a95f91e** (assets =
  the rebuilt SPA, after the live-QA M2 fix) + currena-markets **8ab1a8cc**.
- **Live QA** (agent-browser, currena.ir): 40+ audit-item assertions pass —
  the Fed corridor 3.75–4.00%, AU CPI "data for August 2026 · released 30
  Sep", core 2.4% beside headline 3.4%, the cash-rate card 4.60%, "One
  bitcoin buys 19.8 oz of gold", "€0.8944", the calendar's decision days
  (14 Oct US CPI · 28 Oct FOMC + ABS monthly CPI · 3 Nov RBA), zero
  "Correcting"/"Estimation"/"will go"/«خواهد بود», zero "not enough fresh
  data", "prices updated 04:13", the verdict rule + calm lists in both
  heroes, 5 of 16 in correction with 2 Delayed tags, mobile 375px no
  overflow (en + fa RTL). Screenshots for the second audit:
  docs/evidence/step1-audit/.

## Session record — 2026-10-14 freshness (D-12 + D-13: 5-minute visibility)

- **D-12 — zone-side, no deploy**: the currena.ir zone's legacy Browser
  Cache TTL was `14400` (Cloudflare's old default), rewriting the origin
  `max-age=300` to 4 hours on every edge-cache HIT (verified in a real
  browser; curl/HEAD misses the HIT path). Applied via the Cloudflare API:
  `PATCH /zones/<id>/settings/browser_cache_ttl` → `0` = Respect Existing
  Headers. Browser-verified immediately: the same cached entry (age 3392)
  switched to serving `max-age=300`. Scope had been exactly the two
  edge-cached insights routes; HTML/assets/rates were never affected.
- **D-13 — code + spec (commit `3fbd20e`, pushed `2f86d08..3fbd20e`, CI
  green)**: `/api/insights/markets` + `/api/insights/fx` `s-maxage`
  3600 → 300 (200 + 304 responses) and the serve-path KV `cacheTtl`
  3600 → 300 (`KvMarketsReader`/`KvFxReader`); both specs' cache rules
  updated in place. Gates: 1,058/1,058 tests, typecheck 6/6, budgets held
  (entry 290.36/87.08; Insights 579.62/136.48 — byte-identical chunk
  hashes, comment-only web diff).
- **Deploy**: currena-api **`bb7b3ae4`** (992.30 KiB / gzip 178.43; the
  route + adapter change; assets unchanged) + currena-markets
  **`39dfc6b3`** (both crons intact: `30 23 * * 1-5`, `30 1 * * 2-6`);
  `EODHD_API_TOKEN` secret re-put on markets (idempotent; owner
  re-provided). Token: env-only per command, never in files.
- **Live QA** (agent-browser, currena.ir): cache-busted fetches prove the
  deployed origin answers `public, max-age=300, s-maxage=300` on both
  routes; a true edge HIT (`cf-cache-status: HIT`, age 0) serves the same;
  the plain SPA URL (what visitors fetch) serves it on HITs too;
  `/api/health` ok; the insights page renders EN (In plain words, dollar
  story, no raw codes) and FA (RTL, «به زبان ساده», Persian digits), no
  overflow, zero console/page errors. Net effect: after the 23:30/01:30
  UTC snapshot runs every visitor sees the new currencies within ~5
  minutes (was up to ~5 hours).
- One-off diagnosis/fix script (zone settings probe + PATCH) deleted after
  use, per repo discipline; its logic is recorded in this entry.

## Session record — 2026-10-14 Phase 2 (QA hardening: KV-failure honesty + contract suites)

Deployed from `296a63f` (CI green): **currena-api `33c1b18b`** +
**currena-markets `28c9d3f5`** (both 2026-10-14T05:06Z).

- What changed (serve path): `/api/history` answers the calm 503
  `history_unavailable` on KV read failure (was a raw 500); the four
  insights serve routes guard their KV reads with distinct 503 codes
  (`insights_unavailable`, `markets_unavailable`, `fx_unavailable`,
  `indicator_history_unavailable` — D-15); `/api/status` + `/admin`
  degrade per-row (allSettled) instead of 500ing; the SPA `fetchMeta`
  memo retries after a transient failure.
- What changed (jobs): the fx Yahoo fallback window `range=1y` → `2y`
  (D-14 — the y1 anchor needs calendar margin); explicit cron-kind
  matching on currena-markets (unknown expressions log + skip);
  `parseFrankfurterTimeseries` drops non-positive rates (V1 parity).
- No stored-shape changes — KV readers/writers stay compatible both
  directions; no snapshot job ordering needed.
- Gates at deploy: 1,171/1,171 tests (was 1,058; +113), typecheck 6/6,
  copy audit clean, bundle budgets held (entry 290.36/87.08; Insights
  lazy 579.62/136.48).
- Post-deploy smoke (all verified against https://currena.ir): health
  `{"ok":true,"kv":"ok"}`; rates `no-store` + ETag; history
  `public, max-age=60` + ETag + live 304 revalidation; markets + fx
  `public, max-age=300, s-maxage=300` + ETag (D-13 intact); insights
  `max-age=60` with the dual-generation ETag (prices rung 04:13 riding);
  convert parity; RatesError envelope on 400.

## Session record — 2026-10-14/15 QA session close-out (Phases 3–5)

Deployed from `6090842` (CI green, origin/main = HEAD): **currena-api
`93ae180a`** + **currena-markets `d825a8d4`** (both 2026-10-14T14:28Z;
this redeploy pins the version marker to the final HEAD after the
unrecorded 08:03Z deploy of the same tree — the 2026-09-18 wrap-up
precedent). `EODHD_API_TOKEN` re-put on markets immediately after
(idempotent; owner re-provided the same key).

- What changed since the Phase-2 record above (all behavior-preserving):
  Phase 3's five god-module splits (api index → routes/, fx compute →
  domain modules, insights config → config/, WorldCurrencies + the
  /insights route → section components; D-16 budget bump 580→582 raw);
  Phase 4's a11y majors + minors (skip link, h1s, useDialogFocus
  discipline on ResultPopup/Receipt/Settle/Header drawer), the
  knip-verified dead-code sweep (6 deletions, 20 barrel trims, 137
  un-exports), ESLint as a CI gate (D-17: advisories at warn,
  rules-of-hooks at error) and the zero-advisory dependency set (D-18:
  pnpm overrides + wrangler 4.151).
- No stored-shape changes — KV readers/writers stay compatible both
  directions; no snapshot job ordering needed.
- Gates at deploy (re-verified on a fresh clone before the deploy):
  1,171/1,171 tests (core 183 · scraper 67 · insights 350 · markets 13
  · api 206 · web 352), typecheck 6/6, lint 0 errors / 34 accepted
  advisory warnings, copy audit clean, bundle budgets held (entry
  292.77/87.80 vs 296/89.5; Insights lazy 581.44/136.81 vs 582/137).
- Post-deploy smoke (all verified against https://currena.ir): health
  `{"ok":true,"kv":"ok"}`; rates `no-store` + ETag cycling with the
  minute keep-warm; convert parity (100 USD → 26,390,000 @ 263,900);
  history `public, max-age=60` + ETag; markets + fx
  `public, max-age=300, s-maxage=300` + ETag + live 304 (D-12/D-13
  intact); markets ETag = the 23:30:26Z snapshot run (cron fired).
- Browser verification (Chrome, post-deploy): converter renders with
  the a11y layer (skip link, h1, labeled controls); 100 USD → 263,900
  live result; FA/RTL toggle with Persian h1 and copy; /insights
  renders all sections in FA; 375×667 no horizontal bleed on converter
  or insights; zero console errors and zero console messages across
  the entire pass.

## Session record — 2026-10-15 REMAINING_WORK session (WS-1 → WS-6)

Deployed from `fb1fded` (CI green, origin/main = HEAD): **currena-api
`155ecb3d-05bb-4f73-84ae-746008f59e98`** + **currena-markets
`9b5ff7e0-c37b-4f06-8e02-228b90fbb280`** (both 2026-10-14T19:52Z).
`EODHD_API_TOKEN` re-put on markets immediately after (idempotent).

- What changed since the QA close-out record above (the owner's
  REMAINING_WORK.md work order, executed in order): WS-1 the three
  reliability minors (A-5 fx fallback per-currency validation D-19;
  A-6 the store `prev`-threading D-20 — worst-case subrequests 50 → 48
  incl. KV ops; A-8 serve-time staleness re-evaluation on the markets +
  fx rows D-21); WS-2 the test closers (C-6 the markets/fx SPA clients,
  C-8 the wrangler.jsonc cron contract, C-9 the jsdom component suite
  D-22); WS-3 the six a11y fixes + three documented declines (D-23);
  WS-4 the five remaining module-tree splits + the B-4 MetaResponse
  consolidation (Receipt/Settle/fx-presentation/Converter/Signals, all
  characterization-first, zero behavior change); WS-5 the advisory
  worklist executed with an honest split — 34 → 14 warnings, the 14
  declines each with a stated reason (D-24); WS-6 the three owner
  option papers (D-25/D-26/D-27, awaiting Ali — no behavior change).
- Serve-visible change to note: `/api/insights/markets` + `/api/insights/fx`
  now re-evaluate per-row `stale` at serve time (D-21 — a multi-day
  cron failure now serves honestly-flipped flags instead of frozen
  `stale:false`; fresh snapshots byte-identical).
- No stored-shape changes — KV readers/writers stay compatible both
  directions; no snapshot job ordering needed.
- Gates at deploy: **1,255/1,255 tests** (core 190 · scraper 67 ·
  insights 356 · markets 13 · api 208 · web 421 — the web total carries
  this session's +9 Receipt and +6 Settle jsdom characterization suites
  on top of the prior segment's C-6/C-8/C-9 additions), typecheck 6/6,
  lint 0 errors / 14 accepted advisories (D-24), copy audit clean,
  budgets held (entry 294.60/88.50 vs 296/89.5 — the Converter split's
  prop plumbing cost +1.0 kB raw, inside budget, no bump; Insights lazy
  581.45/136.82 vs 582/137).
- Post-deploy smoke (all verified): health `{"ok":true,"kv":"ok"}`;
  rates tgju live (no-store + ETag); convert parity 100 USD →
  26,390,000 @ 263,900; `/admin` 401 (the view gate — Worker-first
  intact); insights markets + fx serve with `public, max-age=300,
  s-maxage=300` + ETag + live 304 (D-12/D-13 intact).
- Browser verification (Chrome, post-deploy): EN desktop the money
  path (100 USD → 26,390,000 Toman live, result popup with rate/trend/
  high-low); FA/RTL toggle (Persian h1 کورنا، مبدل ارز); 375×812
  mobile /insights renders all 19 sections incl. the split
  world-markets + fx + signals sections and the verdict strip; the
  split Settle + Receipt routes render; zero console errors and zero
  console messages across the entire pass.

## Session record — 2026-10-15 INSIGHTS_FIX_SPEC session (Parts A–E + wrap-up)

The 14-October insights audit's fix spec, executed end-to-end in one
session. Commits `2dd2eae` (A+B) → `7471622` (C) → `4738263` (D) →
`04d36bc` (T-08 venue fix) → `7a43a72` (bundle budget) → `aeb701d`
(B-19 episode-aware) → `b6a35a7` (Part E: FIX_REPORT + every spec
checkbox ticked). CI green on every push; final CI green on `b6a35a7`.

- **Data-bearing deploy**: currena-api `cdf4df66-2e2b-4324-90e4-d783136f387a`
  (#124, 2026-10-15T01:44Z) — after the live GHA ingest run had
  published the validated snapshot (14/14 tests, 51 readings,
  ruleVersion 2, 50 sources, none failed) and the B-19 republish.
- **Wrap-up redeploy (this record's floor)**: currena-api
  **`97e8c38a-0b20-4316-b9a1-b8093e4575f2`** (#125, 2026-10-15T03:05Z)
  from final HEAD `b6a35a7`. The commits between the two deploys are
  docs/tests-only, so served bytes are identical; the redeploy makes
  the version record unambiguous for the next session.
- **currena-markets NOT redeployed** (deliberate): the fix spec
  touched none of its imports (`insights/fx`, `insights/markets`,
  `series` — verified by diff; `packages/core` grew only optional
  reader-side fields), so the deployed `9b5ff7e0` (from `fb1fded`)
  stays current. `EODHD_API_TOKEN` was not touched (no markets deploy).
- Gates at deploy: **1,308/1,308 tests** (core 190 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 427), typecheck 6/6, lint
  0 errors / 14 accepted advisories (D-24), copy audit clean, budgets
  held (entry 294.61/88.50 vs 296/89.5; Insights lazy 599.37/141.52 vs
  the 2026-10-15d bump 600/142).
- Post-deploy smoke on currena.ir: health `{"ok":true,"kv":"ok"}`;
  `/api/insights` 51 readings incl. the four new cards
  (fed-expectations +1.04 · us30y 5.56 "highest since 2004" ·
  philly-fed 37.8 · rba-expectations +0.33); `/api/insights/status`
  14/14 tests, ruleVersion 2, no failed sources;
  `/api/insights/archive/2026-10-15` 200 (the day's exact snapshot);
  markets + fx 200 with `public, max-age=300, s-maxage=300` + ETag
  (D-12/D-13 intact); convert parity 100 USD → 26,390,000 @ 263,900
  (tgju live); `/admin` 401 (Worker-first gate intact); the new
  `Insights-CF53RA0h.js` lazy chunk serves (599.37 kB).

## Session record — 2026-10-16 UI/UX quirk pass (touch targets + polish)

Commission: the owner's minor UI/UX quirks + look tweaks
(docs/NEXT_SESSION_PROMPT.md §0). Seven quirks shipped, seven declined
with reasons — full record in `docs/QA/quirks-2026-10-16.md`.

- **Deployed**: currena-api **`9d995f01-3f72-4246-b425-2bbd7771bbed`**
  (2026-10-16, ~11:16 UTC) from HEAD `8eb6c94` (the web app ships as
  the Worker's static assets — the CSS-only fix commits ride along).
  Cron `* * * * *` + KV bindings intact.
- **currena-markets NOT redeployed**: the quirk pass touched zero
  markets imports; deployed `9b5ff7e0` stays current.
- **Gates at deploy**: tests 1,309 green (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 427), typecheck 6/6, lint
  0 errors / 15 accepted advisories (D-24), copy audit clean, budgets
  held (entry 294.67/88.53 vs 296/89.5; Insights lazy 599.53/141.53 vs
  600/142 — CSS-only, no bump).
- **CI**: green on the pushed HEAD (`8eb6c94`, "gates" completed
  success — verified via the API after each push).
- **Post-deploy smoke on currena.ir**: `/api/health` 200;
  `/api/insights` serving (ruleVersion 2 snapshot); `/admin` 401
  (Worker-first gate intact); convert parity 100 USD → 26,690,000 IRR
  @ 266,900 (tgju live); fresh production DOM at 375 px carries every
  fix — 4× header buttons 44×44, footer links 32px, converter chips
  40px, copy chip 36px, receipt delete 36px; zero page errors, zero
  console messages; no horizontal bleed.

## Session record — 2026-10-16b Insights full export (MD/TXT/CSV/XLSX)

Commission: the owner's one-file "download all data" export for the
financial-indicators page (CHANGELOG §2026-10-16b).

- **Deployed**: currena-api **`30f647f6-84d6-4193-8edd-cb1f3f0f9ef3`**
  (2026-10-16, ~14:40 UTC) from HEAD `186a070` — the two feature
  commits (`764e841` popover clamp fix, `186a070` the export feature)
  ride as the Worker's static assets. Cron `* * * * *` + KV intact.
- **currena-markets NOT redeployed** (`9b5ff7e0` stays current — zero
  markets imports touched).
- **Gates at deploy**: tests 1,326 green (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 443), typecheck 6/6, lint
  0 errors / 15 advisories (D-24), copy audit clean, budgets held
  (entry 294.75/88.53 vs 296/89.5; Insights lazy 603.71/142.72 vs the
  consciously bumped 604/142.8 — builders are separate lazy chunks).
- **CI**: green on the pushed HEAD (`186a070`), verified via API.
- **Post-deploy smoke on currena.ir**: `/api/health` 200; `/api/insights`
  51 readings, ruleVersion 2; `/admin` 401; convert parity 100 USD →
  26,790,000 IRR @ 267,900 (tgju live); the export button renders, the
  XLSX downloads from production (77,366 B, byte-size identical to the
  local run on the same snapshot), the panel clamps inside the 375 px
  viewport (8..348); zero page errors / console messages.


## Session record — 2026-10-17 Round 42 (the hero verdict cards calm down)

Commission: the owner's seven-item polish pass on the Insights hero
verdict cards (CHANGELOG §2026-10-17, QA table
docs/QA/quirks-2026-10-17-hero-calm.md).

- **Deployed**: currena-api **`ca46a4f7-03b9-4585-9b21-c80e269313f5`**
  (2026-10-17) from HEAD `a7d52b0` — the round-42 feature commit
  rides as the Worker's static assets. Cron `* * * * *` + KV intact.
- **currena-markets NOT redeployed** (`9b5ff7e0` stays current — zero
  markets imports touched).
- **Gates at deploy**: tests 1,326 green (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 443), typecheck 6/6, lint
  0 errors / 15 advisories (D-24), copy audit clean, budgets held
  (entry 294.75/88.53 vs 296/89.5; Insights lazy **603.29/142.46** vs
  604/142.8 — the round SHRANK the chunk).
- **CI**: green on the pushed HEAD (`a7d52b0`), verified via API.
- **Post-deploy smoke on currena.ir**: `/api/health` 200; `/api/insights`
  51 readings, ruleVersion 2; `/admin` 401; convert parity 100 USD →
  26,790,000 IRR @ 267,900 (tgju live).
- **Production DOM re-verified** (fa, light + dark, 1280 + 375): the
  new bundle (`index-Bj0-uN9d.js`) serves after one plain reload (the
  PWA SW update cycle — known one-reload behaviour); both group boxes
  render, both "?" tips expand (tap + keyboard), the red-notes
  container + bullets render (Global) and the bare count line rides
  (Australia), the full-explainer link scrolls to + expands About
  (scrollY 60 → 21810), 375 px scrollWidth === 375 (no bleed); zero
  page errors / console messages.


## Session record — 2026-10-18 Round 43 (the grades wear their colors again)

Commission: the owner's five-item follow-up on the round-42 result
(CHANGELOG §2026-10-18, QA table docs/QA/quirks-2026-10-18-round43.md).

- **Deployed**: currena-api **`7b5f7896-3068-4b33-a815-732457cb2f2c`**
  (2026-10-18) from HEAD `d643353` — the round-43 feature commit rides
  as the Worker's static assets. Cron `* * * * *` + KV intact.
- **currena-markets NOT redeployed** (`9b5ff7e0` stays current — zero
  markets imports touched).
- **Gates at deploy**: tests 1,325 green (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 443), typecheck 6/6, lint
  0 errors / 15 advisories (D-24), copy audit clean (no copy changes
  this round), budgets held (entry 294.75/88.53 vs 296/89.5; Insights
  lazy **603.84/142.59** vs 604/142.8 — the deduped BULLET_DOT absorbed
  the round; NO bump).
- **CI**: green on the pushed HEAD (`d643353`), verified via API.
- **Post-deploy smoke on currena.ir**: `/api/health` 200 (kv ok);
  `/api/insights` 51 readings, ruleVersion 2; `/admin` 401; convert
  parity 100 USD → 26,790,000 IRR @ 267,900 (tgju live) + EUR → GBP
  via frankfurter.
- **Production DOM re-verified**: the new bundle serves after one plain
  reload (the PWA SW update cycle — known one-reload behaviour);
  meters wear the four-step colours (computed on-1
  `rgb(36, 161, 72)`); exactly 2 "?" tips per card seated at their
  subjects (rule tip opens with its full panel; how-tip on the verdict
  row); the alert container visibly tints (Global); 3 flex bullet dots
  at sentence starts; Australia leads with 6 attention tiles; Global's
  reveal still works (3 → 6); 375 px scrollWidth === 375; zero page
  errors / console messages.

## Session record — 2026-10-18b the CSV and XLSX exports open in Excel

The owner's bug report on the 2026-10-16b full export: "The xlsx and csv
outputs are incomplete and not working. md and txt works." Forensics
(repro against real production data, en+fa) proved the builders complete
— the failure was Excel-side: BOM-less UTF-8 CSV → ANSI-1256 mojibake on
fa-Windows, the flat 26-slot dump reading as a sparse "incomplete"
matrix, and the minimal OOXML package tripping strict viewers (openpyxl:
"Workbook contains no default style"). Fixes: UTF-8 BOM on every CSV
(full + insights/markets/fx), the full CSV restructured to one dense
block per section (MD/TXT structure), and the xlsx-writer hardened
(docProps floor, named "Normal" style, per-sheet dimension + cols width,
xml:space on <t>, plain-decimal <v> guard, optional rightToLeft sheet
view — the fa workbook opens RTL). Plus a loud .catch on the download
handler. Feature commit `ca991e7` (CHANGELOG §2026-10-18b).

- **Deployed**: currena-api **`be5c0121-c856-447c-9b4e-b97d90cf95a2`**
  (2026-10-18) from HEAD `ca991e7`. Cron `* * * * *` + KV intact.
- **currena-markets NOT redeployed** (`9b5ff7e0` stays current — zero
  markets imports touched).
- **Gates at deploy**: tests 1,331 green (core 191 · scraper 67 ·
  insights 403 · markets 13 · api 208 · web 449 — +6 export tests),
  typecheck 6/6, lint 0 errors / 15 advisories, copy audit clean (zero
  copy changes), budgets held (entry 294.75/88.52 untouched; Insights
  lazy 603.89/142.61 vs 604/142.8).
- **CI**: green on the pushed HEAD (`ca991e7`), verified via API.
- **Post-deploy smoke on currena.ir**: `/api/health` 200 (kv ok);
  `/api/insights` 51 readings, ruleVersion 2; `/admin` 401; convert
  parity 100 USD → 26,790,000 IRR @ 267,900 (tgju live).
- **Production re-verified** (after the one plain reload — the known SW
  update cycle): the export panel opens with all four fa format rows;
  CSV + XLSX clicked through the real UI with zero page/console errors;
  the deployed lazy chunks probed in-page
  (`full-export-zgApEZWy.js`, `xlsx-writer-DzSEJ58r.js`) — BOM'd dense
  fa CSV (`gold-usd,قیمت طلا…,4194.6,…`), 10 sheets, `PK` magic, and
  every writer hardening present (docProps, Normal style, dimension,
  cols, rightToLeft, plain decimals, xml:space on <t>); 375 px
  scrollWidth === 375. Evidence: `docs/evidence/2026-10-18-export-fix/`.

## Session record — 2026-10-19 the insights rebuild ships (owner-approved)

The `insights-rebuild` branch — the AGENT_RUNBOOK execution (Setup →
Phase 7, 14 phase commits) — deployed after the owner's explicit
approval: "Approved. Push and Deploy and commit." (the runbook's own
rule 2 "never deploy / never push main" was written for the rebuild
itself and is lifted by this approval). OWNER_SETUP §1 was executed on
the owner's behalf: a generated long random password was uploaded as
the `INSIGHTS_PASSWORD` Worker secret (`printf '%s'`, no trailing
newline; the value was handed to the owner in chat — rotate any time
with `wrangler secret put INSIGHTS_PASSWORD`).

- **Deployed**: currena-api **`b137f3ef-00c7-4356-abbd-7e8083212744`**
  (2026-10-19) from HEAD `1f70552` (the branch's phase-7 commit).
- **currena-markets NOT redeployed** (`9b5ff7e0` stays current — the
  runbook touched no markets imports; OWNER_SETUP §4 note honoured;
  its EODHD secret persists on the Worker).
- **Gates re-verified from a fresh clone** (the sandbox had reset and
  the checkout was lost): tests 1,389 green (core 191 · scraper 67 ·
  insights 451 · markets 13 · api 214 · web 453), typecheck 6/6, lint
  0 errors / 15 advisories, copy audit clean, build + T-15 site-mode
  check OK (SITE_MODE=private in the served bundle), budgets held
  (entry 294.79/88.56 vs 296/89.5; Insights lazy 594.49/141.54 vs
  604/142.8).
- **Post-deploy smoke on currena.ir**: `/api/health` 200 (kv ok);
  unauthed `/api/insights` → **401 `private_page` + `no-store`** (the
  private gate is LIVE in production and fails closed);
  `POST /api/insights/login` → signed HttpOnly Secure SameSite=Lax
  12h cookie → authed `/api/insights` → 200 `private, no-store` with
  51 readings, ruleVersion 2, same-day generatedAt; `/admin` 401;
  convert parity 100 USD → 26,790,000 IRR @ 267,900 (tgju live).
- **Production DOM verified** (agent-browser): the neutral private
  gate screen renders; sign-in lands on the full Insights page
  (grouped status boxes, seated "?" tips, four-step meter inks,
  "+N more" reveal, the crypto Fear & Greed context card live); the
  "Download data" panel opens with all four formats; CSV + XLSX
  clicked through the real UI — files downloaded (23,514 B / 114,145
  B) with ZERO page/console errors; the CSV starts with the UTF-8 BOM
  (ef bb bf) and carries the E-23/E-24 audit columns; the XLSX is a
  valid zip with docProps + the "Normal" style + 10 sheets; fa toggle
  → `dir=rtl lang=fa`; 375 px scrollWidth === 375. Evidence:
  `docs/evidence/2026-10-19-insights-deploy/` (5 screenshots + the 2
  downloaded export artefacts).
- **Repo**: `insights-rebuild` pushed (docs commit); `main`
  fast-forwarded to the same line and pushed — the branch also fixes
  main's stray `branches: ain]` ci.yml edit, so pushes to main DO
  trigger CI from here on.

## Session record — 2026-10-19b the Insights page goes PUBLIC (owner decree)

The owner on the private gate: "Why you made the page private? make it
public dude." The gate itself was the runbook's own Step 3 §2.2 design
(several sources are licensed for private viewing only); going public is
the spec's own reserved task (§12: switch SITE_MODE, resolve every
failing test). Done licence-safely — the public page displays ONLY
sources whose terms allow public display:

- **data/site-mode-overrides.json** (NEW, generated by the registry
  generator, pinned by tests): the fail-closed hidden set — 24
  indicators (every licence verdict other than 'yes': the Yahoo-family,
  the FRED-with-copyright rows, china-pmi, and the not-yet-verified
  ECB/WorldBank/Frankfurter terms) + the two EODHD/Yahoo-backed world
  boards. T-15 (scripts/check-site-mode.mjs) now has a REAL pass path:
  public mode passes only when the overrides hide exactly the non-'yes'
  audit set and both boards (first-hand: it exits 0 today).
- **The public projection**: projectSnapshotToPublic (pure, tested)
  filters a validated snapshot to the public-ok subset, recomputes the
  hero summaries with the SAME summarizer (a public verdict can never
  contradict its own gauges), and stamps the additive
  `displayMode:'public'` schema field. Written daily by the ingest
  under `insights:snapshot-public` (+ `insights:archive-public:v1:<date>`;
  +2 KV writes/day, budget 31 → 33) and bootstrapped once from the live
  private snapshot via the new `pnpm --filter @currena/insights
  public-projection` (51 readings → 27 public-ok; +2 writes, 2 reads).
- **Serve path** (SITE_MODE=public, AC-08): the gate skips; the Worker
  reads ONLY the projection keys (mode-aware KvInsightsReader — the
  private document cannot leak by construction); /markets and /fx
  answer 404 `hidden_site_mode` before any KV read; a hidden id's
  history is refused with zero rows; the Yahoo live-prices merge is
  skipped entirely. The web hides the world-markets/currencies/US-
  shares-AUD sections when the snapshot says `displayMode:'public'`
  (no fetch, no cached last-good render).
- **Deployed**: currena-api **`36d76363-6346-4ac7-9c41-914f1f7d5c19`**
  from the docs commit on this line. currena-markets untouched
  (`9b5ff7e0`). The INSIGHTS_PASSWORD secret stays set — flipping
  SITE_MODE back to 'private' re-arms the gate instantly.
- **Gates**: tests **1,407** green (core 191 · scraper 67 · insights
  461 · markets 13 · api 222 · web 453 — +18 public-mode tests),
  typecheck 6/6, lint 0 errors / 15 advisories, copy audit clean,
  budgets held (entry 294.79/88.56; Insights lazy 594.66/141.58).
- **Production verified**: unauthed `/api/insights` → 200 `public,
  max-age=60` (indexable), displayMode=public, ruleVersion 2, 27
  readings with ZERO hidden-id leaks; /markets + /fx → 404
  `hidden_site_mode`; brent/history → 404, us10y/history → 200;
  health 200 kv ok; /admin 401; convert parity intact. Browser: NO
  private gate screen, the page renders signed-out (GLOBAL + AUSTRALIA
  groups live), the world sections are gone, fa + 375 px clean, zero
  console errors (after the one-reload SW cycle). Evidence:
  `docs/evidence/2026-10-19-public-insights/`.
- **Honest follow-ups**: (1) the "Sources:" copy sentence still names
  the world stock markets — copy-only polish for a later round (needs
  en+fa edits + manifest triage); (2) the crypto Fear & Greed card
  (public-ok) rides the next daily ingest into the public projection;
  (3) the spec's §12 recommendation stands — before treating the public
  page as a product surface, have an Australian professional review it;
  (4) verifying the 'unknown' licence terms first-hand (ECB Data
  Portal, Frankfurter/ECB reference rates, World Bank CC BY 4.0) would
  return ~10 more cards to the public page.

## Session record — 2026-10-19c Round 44 (the meter grades in one hue)

The owner's colour-grading idea for the verdict meter: stop the rainbow —
grade the four segments in ONE hue, the CURRENT step's, with the segments
before the current one wearing progressively whiter tints ("when it's
stable show green … when it's orange, the grad turns to orange, previous
ones get orange too like this: [more pale orange] [pale orange] [orange]
… same for red").

- **Change** (commit `50ba45b`): index.css round 44 — the round-43
  per-segment rainbow inks retired; the filled segments paint as a
  monochromatic ramp of the current step's ink via `color-mix` toward
  white (cautious 55% yellow · stressed 40/70% orange · critical
  30/55/78% red; stable stays pure green). `VerdictMeter` + the
  `QuestionGroup` header meter carry `data-step` so every meter on the
  page (hero lg, per-gauge sm, MarketsVerdict, six question headers)
  grades identically in both themes.
- **Gates**: web 453/453 (1,407 total), typecheck 6/6, lint 0 errors /
  15 advisories, budgets held (entry 294.78/89.38; Insights lazy
  594.68/142.03 — +0.19 kB raw from the ramp).
- **Deployed**: currena-api **`e8a47a2d-c593-456a-b4c6-5a9428fd159f`**
  from `50ba45b` (+ this docs commit). currena-markets untouched
  (`9b5ff7e0`); SITE_MODE=public unchanged; the INSIGHTS_PASSWORD
  secret stays set.
- **Production verified**: the deployed `index-*.css` is byte-identical
  to the local build and carries the full ramp; live DOM: the Critical
  hero meter resolves `rgb(244,188,191) → rgb(235,131,137) →
  rgb(226,79,87) → rgb(218,30,40)` (Carbon Red 60 verbatim at the top);
  per-gauge + per-question step-4 meters carry the same palest tint on
  `on-1`; the Stable meter stays pure `#24a148`; health 200 kv ok;
  unauthed /api/insights → 200 `public, max-age=60` (displayMode
  public, ruleVersion 2, 27 readings); 375 px scrollWidth === 375;
  zero page/console errors.
- **Standing order recorded**: the owner decreed (2026-10-19c) that
  from now on every completed round AUTO-commits, pushes and deploys —
  no per-round approval gate (OWNER_SETUP §10).
- **Evidence**: `docs/evidence/2026-10-19-round44-meter-grading/` (the
  light+dark ramp render + production screenshots at 1280 and 375).

## Session record — 2026-10-19e the prices board returns to public mode (the owner's directive)

The owner: "Still there aren't GOLD BITCOIN SILVER price, like it used
to. please read previous version you will findout there was a dedicated
nice section with images for it." — resolves the decision the 2026-10-19d
investigation left open (the four tiles' restoration was listed as an
owner choice).

- **Diagnosis re-verified LIVE before touching anything**: the API
  served 28 public readings; the four price ids absent (arithmetic: the
  hidden 24 = 16 world indices on the boards + 7 price tiles + vix);
  EODHD probed healthy with real quotes (not quota, not an outage); all
  five tile icons still 200 on production — the "images" never left,
  the tiles were data-starved by the Oct-19b licence-cautious hide.
- **The fix — one mechanism, honest trail** (commit `81ca3e3`):
  `OWNER_PUBLIC_DISPLAY_OVERRIDE` in the registry generator for exactly
  {brent, gold-usd, silver-usd, btc-usd}; the three generated JSONs
  regenerated (hidden set 24 → 20); a NEW test pins the four tiles
  against re-hiding; the LR-02 hidden-history fixture moves
  brent → vix. The licence facts stay verbatim, the Yahoo legs stay in
  the engine (private view unchanged), the world boards stay hidden.
- **Gates**: 1,419 tests green (+1), typecheck 6/6, lint 0 errors / 15
  advisories, copy:audit clean, budgets held (entry 294.78/89.39;
  Insights lazy 594.68/142.02), T-15 PASSED in SITE_MODE=public.
- **Deployed**: currena-api **`d40211f9-970b-4756-970c-8424f6062b20`**;
  currena-markets untouched (`9b5ff7e0`). The public projection was
  then REBUILT from the stored private snapshot
  (`pnpm --filter @currena/insights public-projection`; 52 → 32
  public-ok readings; KV 2 reads / 1 write) so the tiles appeared
  immediately instead of riding the next daily ingest.
- **Production smoke**: /api/insights 200 public, 32 readings (brent
  109.13 · gold 4,164.70 · silver 57.27 · bitcoin 81,180.14 US$); the
  live prices section renders the four tiles WITH images (oil barrel,
  gold bar, silver, bitcoin); zero console/page errors; 375
  scrollWidth === 375; the money panel's "Petrol and transport" row is
  BACK ("Becoming more expensive — US$109.13 Oil price (Brent)").
- **Evidence**: `docs/evidence/2026-10-19e-prices-restore/` (before/after
  API captures + desktop/mobile screenshots + README).

## Session record — 2026-10-19d the missing-items investigation + the ingest watchdog

The owner: "Some items are gone… the grid that shown GOLD - Silver -
brent oil and bitcoin price… many items have no data / or not defined /
or waiting… investigate whether it's api problem, quota or what." Plus:
the petrol/transport money row is gone while employment rate appeared.

- **Investigated, not guessed**: last ingest 50/50 sources OK, ZERO
  stale/unavailable readings in BOTH snapshots; push CI ran throughout
  (so no minutes quota). The prices grid + the no-data gauges are the
  PUBLIC projection's licence hiding (gold/silver/brent/btc =
  `public_display_ok: no` → absent from the public snapshot →
  PricesBoard renders nothing; Market stress 0/4 + The US dollar 0/2
  gauge members fully hidden → "not enough data to read"). The
  money-panel shift is DATA-driven: `moneyPanel()` computed on BOTH
  snapshots gives identical rows (homeLoan, savings, shop, jobs) —
  petrol's remaining drivers are all calm right now (row absent on
  private too); employment's drivers are both warning AND public-ok.
- **The REAL outage**: the daily insights-ingest schedule silently
  stopped firing after Oct 16 (three days, zero attempted runs; the
  04:20 cron had been firing ~4h45m late before the stop — GitHub-side
  schedule delays/skips; NOT quota, NOT the workflow file).
- **Freshness restored**: manual workflow_dispatch (run 35, success) —
  generatedAt 09:06 → 17:59, public projection 27 → 28 readings (the
  crypto Fear & Greed card rode in as predicted).
- **The durable fix** (commit `193237e`): `apps/api/src/ingest-watchdog.ts`
  — the Worker's cron :40 hourly rung reads insights:status; snapshot
  > 26 h old → re-dispatch the ingest workflow via the GitHub API
  (nudges bounded 1/6 h by a KV marker; missing token = honest logged
  no-op; all failure paths caught). `GH_INGEST_DISPATCH_TOKEN` set as a
  Worker secret (rides the owner's token-rotation pass). +11 tests
  (9 watchdog branches + 2 cron routing).
- **Gates**: 1,418 tests green, typecheck 6/6, lint 0 errors / 15
  advisories, budgets held, copy audit clean.
- **Deployed**: currena-api **`0eb91818-9a1f-4dd6-ac8f-f250b1004f28`**
  from `193237e`. SITE_MODE=public untouched; currena-markets untouched
  (`9b5ff7e0`). Smoke: health 200 kv ok; insights 200 public; markets
  404 hidden_site_mode (by design); convert parity 26,790,000 @ 267,900
  LIVE; secret list carries GH_INGEST_DISPATCH_TOKEN.
- **Honest limits**: the watchdog's stale path is unit-verified; its
  first LIVE exercise rides the next :40 rung after the snapshot ages
  past 26 h (the healthy path exercises hourly). The selfcheck GHA's
  schedule (registered Oct 16) has never fired once — same GitHub-side
  class of failure; it is an audit nicety, not data-path, and stays
  watch-listed. The licence-hiding itself is the spec's fail-safe
  design: recovering the four price tiles publicly needs either
  verified-'unknown' licences (~10 more cards) or public-ok source
  swaps — owner decisions, not silent fixes.

## Session record — 2026-10-19f the sparklines draw honest trends (the owner's screenshot report)

- **Deployed**: currena-api **`ed79e2cc-fb2f-44ce-bcad-00d73dc57eed`** from
  `9724040` (cron `* * * * *`, KV binding RATES `4627ac33…`, SITE_MODE=public
  untouched; currena-markets untouched `9b5ff7e0`).
- **Gates pre-deploy**: 1,431/1,431 tests (core 191 · scraper 67 · insights
  462 · markets 13 · api 237 · web 461), typecheck 6/6, lint 0 errors / 15
  accepted advisories, copy audit clean, budgets held (entry 295.15 kB /
  88.76 gz; Insights lazy 594.68 / 141.60 gz).
- **Post-deploy data migration**: one-time prune of `history:tgju` via the
  KV REST API with the same 0.05% deadband (240 → 188 generations; USD
  window 259,600 → 267,900); `history:frankfurter` already clean (21 gens,
  no write). The Worker's deadband keeps future noise out.
- **Verified live**: the owner's exact card (fa, 375 px) draws a smooth
  rising line; popup "TREND: LAST 189 UPDATES · +3.2% · low 256,895 · high
  267,900"; /#/live-rates cards calm (USD +3.2%, AUD +1.92%, EUR +3.22%);
  zero console/page errors; no 375 px overflow; the 2026-10-19e prices
  grid untouched (4 tiles + icons).
- **Evidence**: `docs/evidence/2026-10-19f-sparkline-honesty/`.

## Session record — 2026-10-20 the "Know before you buy US shares" box removed (the owner's direct request)

- **Deployed**: currena-api **`e6d18811-46ae-4f27-890a-6a1f63b90cd1`**
  (SITE_MODE=public untouched; currena-markets untouched `9b5ff7e0`).
- **Change**: `UsSharesNotesBox` deleted (component + render + import) at
  the owner's explicit "Remove this entirely"; the four `usShares*` copy
  keys retired from both dictionaries; their four manifest entries pruned.
  No data/scoring/projection change.
- **Gates pre-deploy**: copy:audit clean; all workspace suites green (web
  461/461); typecheck 6/6; lint 0 errors / 15 accepted advisories; budgets
  held — Insights lazy 592.61/141.14 gz (shrank from 594.68/141.60), entry
  295.15/88.76.
- **Verified live**: home 200; served `Insights-CvxT_7lu.js` byte-identical
  to the local build with **0** occurrences of the box copy; `/api/insights`
  → 32 readings, all four price tiles (`brent · gold-usd · silver-usd ·
  btc-usd`) present — the prices board and sparkline fixes untouched.
- **Evidence**: `docs/evidence/2026-10-20-remove-us-shares-notes/`.

## Session record — 2026-10-20b the gold/silver verdict chips become analysis cards (the owner's sketch)

- **Deployed**: currena-api **`757cb15b-45ae-4a61-8f4a-d808a515968d`**
  (SITE_MODE=public untouched; currena-markets untouched `9b5ff7e0`).
- **Change**: the "Conditions right now" chips redrawn per the owner's
  sketch — header row (boxed artwork 56/64px · name + verdict · the
  current price in the MUTED secondary ink) over ONE BIG trend chart
  (h-40 mobile / h-52 desktop, was h-20); the artwork-column side split
  is gone — one anatomy for mobile AND desktop. MergedCard passes the
  metals' display prices from the same snapshot readings. No copy, no
  data change.
- **Gates pre-deploy**: copy:audit clean; workspace tests 1,431 green;
  typecheck all; lint 0 errors / 15 accepted advisories (after renaming
  the previous round's minified evidence capture to `.js.txt` — ESLint
  was linting it); budgets held (entry 295.15/88.76; Insights lazy
  593.51/141.27, +0.9 kB raw).
- **Verified live** (agent-browser): EN desktop plot 208px with muted
  header prices "US$4,165"/"US$57.27"; EN mobile 375 identical anatomy,
  no overflow; fa RTL mirrors the sketch (icon right, verdict red, price
  left, Jalali ticks); prices board untouched (4 tiles + icons); zero
  page/console errors.
- **Evidence**: `docs/evidence/2026-10-20-verdict-chip-redesign/`.

## Session record — 2026-10-20c the gold/silver analysis charts grow the 10-year view (the owner's request)

- **Deployed**: currena-api **`4e8a54e0-fda4-4ce7-bc1e-9ba245c1bfc9`**
  (SITE_MODE=public untouched; currena-markets untouched `9b5ff7e0`).
- **Change**: the metals' Estimation-chip trend charts (TrendPanel) grow an
  opt-in `ranges` prop; `TrendRange`/`StripRange` gain `'10y'` (3653 days —
  the details panel's window); `MetalTrendChart` opts in so the gold and
  silver analysis chips now show Quarter · 1 year · 5 years · **10 years**.
  Reuses the existing `range10y` copy key — zero new strings. Money panel,
  details panel, API and data untouched (the feed already served the full
  decade: 2514/2513 points, 2016-10-18 → 2026-10-16).
- **Gates pre-deploy**: copy:audit clean; full workspace tests green
  (exit 0); typecheck 6/6; lint 0 errors / 15 accepted advisories; budgets
  held — entry 295.15/88.76; Insights lazy 593.58/141.30 (+0.07 kB gz).
- **Verified live** (agent-browser): served Insights chunk byte-identical
  (sha256 39d1e4ea…); EN desktop — 10 years clickable on both metals,
  ticks Oct 2016/Oct 2021/Oct 2026, deltas +230.3%/+225.6% "10 years",
  muted header prices intact; money panel still 3 chips; EN mobile 375
  identical anatomy, scrollWidth 375; fa RTL — «۱۰ سال» chip, deltas
  «+۲۳۰٫۳% ۱۰ سال»/«+۲۲۵٫۶% ۱۰ سال», Jalali ticks مهر ۱۳۹۵→مهر ۱۴۰۵; zero
  page/console errors.
- **Evidence**: `docs/evidence/2026-10-20-metals-10y/`.

## Session record — 2026-10-21 the gold/silver outlook speaks the owner's seven states (the EN/fa drift bug)

- **Deployed**: currena-api **`d0d28c3f-f0a9-4619-b269-8f7337d9daa9`**
  (SITE_MODE=public untouched; currena-markets untouched `9b5ff7e0`).
  Two deploys this session: `a5d2f793` first, then the layout adjustment —
  the outlook sentence moved out of the chip header (it wrapped into a
  4-6-line staircase at 375px there) onto its own full-width line between
  the header and the chart.
- **Change**: the metals' verdict slot adopts the owner's SEVEN-STATE
  "Gold Market Outlook" classification with the owner's own bilingual
  sentences (`outlookOf` over the same condition tally; strong bar =
  the lean's `LEAN_STRONG = 4`, now exported from `@currena/insights`;
  range-bound needs the affirmative quiet-mid-range price evidence).
  verdictUp/Down/Flat retired from both dictionaries (their fa drift WAS
  the bug); round-45 manifest: 21 NEW + 2 CHANGED + 3 REMOVED, referenced
  to docs/QA/quirks-2026-10-21-outlook-states.md. Signals CSV header
  decoupled to `ui.csvColStatus`. No data/scoring/API change.
- **Gates pre-deploy**: copy:audit clean; full workspace tests 1,446
  (+15 outlook tests); typecheck 6/6; lint 0 errors/15 advisories;
  budgets held (entry 295.15/88.76 gz; Insights lazy 596.60/141.83,
  +0.53 kB gz).
- **Verified live** (agent-browser, SW caches purged — the stale precache
  was serving the old chunk and faking the first re-check): served chunk
  `Insights-DlDkQ-3K.js` sha256-identical local == production; the old
  mismatched fa sentence 0 occurrences; live data bearish on both metals,
  EN + fa render the SAME state with the owner's sentences (one line,
  zigzag-led, muted prices); collapsed "Outlook: Bearish"/«چشم‌انداز:
  نزولی»; 375 scrollWidth === 375 both locales; prices board untouched;
  zero page/console errors.
- **Evidence**: `docs/evidence/2026-10-21-outlook-states/`.

## Session record — 2026-10-17b: the prices board cards re-drawn from the owner's sketch

- **What**: the owner's five-point directive for the four-tile prices board
  (picture beside unit name and price; daily/weekly/monthly/quarterly
  percentages; descriptions and verdict; meta facts + percentages as bullet
  points; very small update-time text), shipped as one rebuilt PricesBoard
  anatomy + the new price-stats.ts derivation module (1-day change, 6-month
  change, 1-year change, 52-week range — history-internal, ≤3-day
  nearest-point rule, the last point can no longer be its own reference,
  ≥300-day span gate for the "52-week" name). 9 new copy keys both locales;
  manifest round-46 (9 NEW → docs/QA/quirks-2026-10-17-prices-card-redesign.md).
  No data/scoring/API change.
- **Gates pre-deploy**: copy:audit clean (2,090 entries); full workspace
  tests 1,455 (web 485, +9); typecheck 6/6; lint 0 errors/15 advisories;
  budgets held (entry 295.15/88.76 gz; Insights lazy 599.38/142.60 gz).
- **Deployed**: currena-api `0652db45-3fc2-418f-87c2-bb06caa51e5c`
  (SITE_MODE=public untouched; currena-markets untouched `9b5ff7e0`).
- **Verified live** (agent-browser, SW precache purged first): served chunk
  `Insights-E8NrMws9.js` sha256-identical local == production; EN + fa ×
  desktop + mobile all render the sketch anatomy (icon beside price+name,
  4 change rows, Description+verdict, fact bullets, 10px as-of); fa unit
  rides UNDER the digits (beside it wrapped brent's fa price at 4-across);
  375 scrollWidth === 375 both locales; details panel opens/closes from a
  tile; zero page/console errors; /api/insights → 32 readings; metals
  conditions strip (Tasks 15–17) + money panel untouched.
- **Evidence**: `docs/evidence/2026-10-17-prices-card-redesign/`.

## Session record — 2026-10-17c: the Persian dollar convention

- **What**: the owner's copy convention — fa says «دلار» for USD, never
  «دلار آمریکا»; dollar nationality reserved to «دلار استرالیا» (AUD) and
  «دلار کانادا» (CAD). 114 tracked keys re-triaged (manifest round-47 →
  `docs/QA/quirks-2026-10-17c-fa-dollar-convention.md`); NZD also
  shortened per the rule's second clause (flagged, one-line revert if
  unintended); cents untouched; EN untouched. Copy-only — no data,
  scoring or formatting logic change.
- **Gates pre-deploy**: copy:audit clean (2,090 entries); full workspace
  tests 1,455; typecheck 6/6; lint 0 errors/15 advisories; budgets held
  (entry 295.15/88.76 gz; Insights lazy 597.79/142.51 gz — SHRANK
  599.38 → 597.79 raw with the dropped qualifier).
- **Deployed**: currena-api `c970f556-0070-4fc9-a7ab-98e653461857`
  (SITE_MODE=public untouched; currena-markets untouched `9b5ff7e0`).
- **Verified live**: served `Insights-4U1oyeMS.js` + `index-Cz6G_o2s.js`
  sha256-identical local == production; «دلار آمریکا» ×0 in both served
  bundles; «دلار استرالیا» ×86 / «دلار کانادا» ×2 alive; /api/insights →
  32 readings; production browser (fresh context, loaded chunk verified):
  fa home «USD · دلار» + AUD/CAD qualified + «NZD · دلار»; fa insights —
  tile unit «دلار», 52-week tail «… دلار», metals chip «۴٬۱۶۵ دلار» +
  owner outlook sentence, fx «قدرت دلار», 375 scrollWidth === 375; EN
  regression clean; zero page/console errors.
- **Evidence**: `docs/evidence/2026-10-17c-fa-dollar-convention/`.

## Session record — 2026-10-17d: the prices polish (sign inks, titles, hero glitch, N2)

- **What**: the owner's four-point follow-up — signed percents in the
  status inks (green positive / red negative) on the prices-board rows,
  the 6m/1y fact bullets and the hero mover; bigger bold titles
  (prices-board names 14→18px primary, metal chip names 14→20px
  primary); EN `signals.metals` capitalized (Gold/Silver — chips, rows,
  collapsed lines, export column); the hero's bidi glitch fixed
  structurally via `formatChangeParts` (the signed number keeps its ltr
  island, the word unit «واحد درصد»/'pts' rides outside — fa reads
  «+۰٫۲۵ واحد درصد ۳۰ روز», EN "+0.25 pts 30-day"); the hero's N2
  disclaimer line + about-jump button retired (the bottom About section
  keeps the full text; the global footer carries the app-wide
  disclaimer; nav chips still jump to About). NO fa string changed.
- **Gates pre-deploy**: copy:audit clean; full workspace tests 1,455;
  typecheck 6/6; lint 0 errors/15 advisories; budgets held (entry
  295.15/88.76 gz; Insights lazy 597.50/142.51 gz).
- **Deployed**: currena-api `8caff087-39fd-4026-b6ad-3274fa5ff77b`
  (SITE_MODE=public untouched; currena-markets untouched `9b5ff7e0`).
- **Verified live**: served chunks sha256-identical local == production;
  sign colors sampled (green rgb(36,161,72) / red rgb(218,30,40)) on all
  four tiles' rows + fact bullets + mover; titles 18px/20px bold
  primary; chip "Gold" capitalized; mover order correct in fa and EN;
  role="note" ×0 at the page top; 375 scrollWidth === 375; zero
  page/console errors; /api/insights → 32 readings.
- **Evidence**: `docs/evidence/2026-10-17d-prices-polish/`.

## Session record — 2026-10-20h: the map's period switch centres, grows ~50%, and yearly performance returns (owner round)

- **What**: the owner's three asks on the map's period switch — (1) the
  segmented control CENTRES under the breadth summary (justify-center on
  the row; it hugged the start edge in EN / the end edge in fa);
  (2) "add yearly performance" — 1 year returns as the FOURTH lens
  (Today | 1 week | 1 month | 1 year): chg1y drives country tints, 3D
  pins, leader lines, card borders, the summary ("8 of 16 markets up
  this year" on the fixture) and the hero emphasis; MAP_THRESHOLDS['1Y']
  = 3 (the honest flat band scales with the horizon); (3) the switch
  grows ~50% — 48px pills (was 32), caption × 1.5 ≈ 18.7px words (was
  12.5); a <480px-module container-query step keeps all four pills whole
  on phones. The radiogroup now roves correctly (arrows move focus +
  selection).
- **Two pre-existing defects found and fixed while measuring**: the
  2026-10-20f D/W/M values overran their 35px cells (scrollWidth 51 vs
  clientWidth 35 — "+0.7%+0.3%+1.1%" ran together; the % glyph was the
  culprit) → every card now speaks a YEARLY HERO ROW (caption × 1.5, the
  glyph's only visible home) above compact glyph-free D/W/M cells
  (sr-only % keeps the accessible name whole), the visible last close
  moves into the sr name, and §9.2 gains a value-collision guard; the
  Sydney pin + the Australia label sat UNDER the asx200 card → the
  taller hero cards re-band the callouts (top band y 8.5 → ftse 7.8,
  left col 30/52/76, right col 40/60/82, bottom 86, cac (41,29),
  stoxx50/taiex/x tuned) and every country label anchor is re-cleared
  (China + Australia join the tuned list; Brazil's centroid stays the
  honest default).
- **Copy**: EN+fa +periodYear/periodWordYear/cellY ('1 year'/'this
  year'/'1Y' · '۱ سال'/'امسال'/'سالانه'); spec §M11 updated (the four
  options + the centre/size asks); manifest +3 entries triaged (round
  owner-2026-10-20h-map-yearly); copy:audit clean.
- **Gates**: world-map Playwright 48/48 (incl. the new switch trio +
  value-collision guard + gotoInsights hardening — the module must be
  attached before the scroll or the lazy land races the markets fetch);
  U 19/19; section screenshots; repo vitest 1,835; typecheck clean;
  eslint 0 errors (15 pre-existing advisories). VLM review of the
  regenerated module screenshots (EN/fa light, EN dark, EN 390) + the
  1Y-lens capture: all asks confirmed, no collisions.
- **Deploy**: DEPLOYED 2026-10-21 — the owner supplied the Cloudflare token
  (env-only, never persisted); the fixture-verified apps/web/dist shipped as
  currena-api version a2f88aed-b4d4-44d2-afac-6f06fdf111c3 (18 new assets,
  web-only round). Live-verified on currena.ir (agent-browser, real data):
  API smoke green; 173 land + 16 pins/cards/lines; the switch centered
  (0.0px asymmetry) in 48px pills at 18.72px words with all four lenses;
  the 1Y lens drives the live summary ("10 of 14 markets up this year" —
  two markets honestly lack chg1y) with all 16 hero rows `.sel`; arrow
  roving moves focus + selection together; fa/RTL reads امروز / ۱ هفته /
  ۱ ماه / ۱ سال with the +۱۱٫۳٪ hero; 390px list layout keeps all four
  pills whole; zero console/page errors; VLM review of the live 1Y capture
  passes all seven checks. The PWA one-visit transition note still applies
  to returning visitors.
- **Evidence**: `docs/evidence/2026-10-20h-map-yearly/` (today lens, 1Y
  lens, 1Y lens + USA label, fa, 390 + the four live captures).

## Session record — 2026-10-21: the map's quiet fill, the cards' true homes, and ONE period vocabulary across the page (owner round)

- **Deployed**: currena-api **`4b18bb9b-bcc7-4ebb-afbb-f57ed3653024`**
  (web-only round — the diff touches `apps/web` + docs; currena-markets
  untouched). GitHub `main` = `7bde8b3`.
- **What**: the owner's seven asks —
  1. **New York's tint −15%**: the USA hosts three indices and tints by
     its strongest fresh mover, so its fill was always the loudest on the
     map; `MAP_TINT_COUNTRY_DAMP` damps its mix to 85% (48.4% live where
     the honest ramp said 57).
  2. **The never-updating "Updated {time} · {age}" header line retires**
     (with `markets.map.updated*`): the KV write time is cron-fixed, so
     the line read as stale by construction; the as-of date stays, each
     market keeps its own freshness, and M17's "Showing data from" stays
     (a real event, not a routine age).
  3. **The redundant «ادامهٔ صفحه» ContinueStrip retires** with its key:
     the sticky JumpNav pills one breath below already carry the same
     labels, the same expand-then-scroll navigation and the scroll-spy.
  4. **The map's period switch drops 15%**: 41px pills (37px under
     480px), caption × 1.27 words (× 1.06 on phones).
  5. **The prices board grows the same four-lens switch**
     (Today | 1 week | 1 month | 1 year): the trend row, the sparkline,
     the trend word and the briefing all measure the SELECTED window —
     `windowFor(days)` generalizes the seven-day window with unchanged
     honesty rules (the reference point stays the last observation at-or-
     before latest−N within the 3-day tolerance); Today rides the 1-day
     change with its explicit basis and NO sparkline (a one-day window
     has no path); the daily-change row hides in the Today lens (the same
     number never renders twice); briefing templates interpolate {period}.
  6. **Nifty 50 and Hang Seng leave the south-of-Africa bottom band** and
     float beside their own countries — the Indian Ocean SW of India and
     the South China Sea under the Hong Kong pin (~52/35-unit leader
     lines; the geometry is re-cleared against every card, pin, label
     anchor and leader line — the §9.2 no-overlap test passes).
  7. **ONE period vocabulary**: the map's segmented control IS the
     section's period switch now — the old five-option
     Daily|Weekly|Monthly|Quarterly|Yearly radiogroup retires with its
     keys (`ViewSwitch.tsx` deleted; `PERIOD_VIEWS` closes at the map's
     four; `periodWord` moves to shared.tsx and reads the MAP's period
     words, so the verdict, the movers, the tiles and the table can never
     disagree with the map's summary). `'3m'` stays a valid
     `MarketsView` value (the table's Trend column reads chg3m); it is
     simply never a switch lens anymore.
- **Verification**: 697 unit + 20 U (incl. the new U-15 prices-switch
  probe) + 51 world-map (the updated-line retirement, the 41px switch,
  the 45.8% damped tint, the card homes, the unified-section drive) +
  repo-wide green; the copy manifest triaged (17 processed, 10 retired —
  audit exit 0); dense 721-point price fixtures make every lens honest;
  live-verified on currena.ir EN/fa desktop + 390px mobile (strip gone,
  Updated gone, both 4-lens switches interactive, the map switch drives
  the verdict "this year performance" + the Nifty tile's −11.4%, no
  console errors, no horizontal overflow) + VLM-confirmed captures.

## Session record — 2026-10-21c: the currencies section and the licence-hidden indicators return live (the restoration round deploys)

- **Deployed**: currena-api **`c610dfde-a663-49d9-b314-396af65bdc00`**
  (web + api round — the diff touches `apps/web`, `apps/api`,
  `packages/*`, `data/*`; currena-markets untouched, stays at the
  data-integrity round's version with the 23:30/01:30/**08:50 Asia**
  rungs). GitHub `main` = `a64d4c8`.
- **What went live**: the full owner round — the world-currencies
  section (10 ECB-reference pairs, 7 backtested pattern rules, the
  dollar row, the quiet area, the pairs table behind "Show all currency
  pairs") served by a now-public `/api/insights/fx`; the 28
  licence-hidden indicators restored on browser-verified terms (hidden
  set now exactly `[china-pmi, shiller-cape, shiller-ecy]`,
  `hiddenBoards: []`); the market-stress voters back (STLFSI, NFCI,
  VIX, gold/silver, FNG) with the eth-usd card RETIRED (66→65
  indicators); the gold balance reading its directional load (|net|/
  (for+against) × 10° clamped [3°,10°]); the silver balance retired;
  the Australia signals bullets naming their flagged indicators with
  live values; the weekly-event hero line retired.
- **The deploy hazard this round surfaced (and its fix)**: retiring an
  id from the `IndicatorId` enum while the STORED KV documents still
  carry its reading makes the new Worker's Zod parse reject the whole
  snapshot — `/api/insights` answered `insights_not_ready` until the
  stored `insights:snapshot` + `insights:archive:v1:2026-10-21` were
  surgically migrated (strip the eth-usd reading, recompute both
  section summaries with the current `summarizeSectionByGauges`,
  validate against the NEW schema, write back) and the
  public-projection bootstrap re-ran (65 readings → 62 public). The
  stale `archive-public:v1:2026-10-21` and the orphaned
  `hist:eth-usd` were deleted. Lesson recorded: **an id retirement is
  a schema migration for the KV documents too**.
- **Secrets**: `REFRESH_SECRET` rotated at deploy time (the previous
  value was not recoverable; no other consumer — the GHA workflow is
  dead and never read it). The manual `POST /internal/insights-ingest`
  lever honestly dies at ~22s with error 1102 on the HTTP path (CPU
  budget below the scheduled rung's) — the 04:10/04:25/04:40 scheduled
  rungs remain the ingest path.
- **Verification**: live-verified on currena.ir EN + fa (1280px,
  browser + VLM): the currencies section end-to-end (verdict "Currency
  patterns: calm", dollar row +1.3% 1m, the Europe-worry pattern card
  EUR/CHF −2.4%/m with the rebased Stoxx comparison, the 10-pair table
  in 3 groups with the bigMove tag, ECB as-of Oct 20; fa in Persian
  digits + ۲۸ مهر ۱۴۰۵); the stress lane's five voters with no
  Ethereum card; the gold balance tipping the full 10° with Real
  yields 2.80% + The US dollar 101.84 on the against pan and "No
  qualifying signals" on the empty supporting pan (single balance, no
  silver); the Australia panel reading "Inflation & rates · Critical —
  Australian prices vs a year ago 4.0% · Underlying inflation 3.6%";
  no weekly-event line anywhere; zero console/page errors in both
  languages. The next day's **04:10 UTC rung re-ran the ingest cleanly
  with the new code** (2026-10-22: snapshot + status + public +
  archive written; 62 public readings, all fresh) — the self-sustaining
  pipeline confirmed live.
- **Known follow-ups (honest)**: the 2026-10-22 status doc shows
  source-level failures (`fred` partial, `rba` the known f2 403) while
  the public face stays 62/62 fresh — flagged for the upcoming
  pipeline-reliability investigation (TGJU scraping + gap analysis).
