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
     KV namespace RATES: snapshot:*, status:*, lock:*   (7-day hard TTL)
                        insights:snapshot|hist:<id>|status  (no TTLs; written by Actions)
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

A second deploy from the I13 HEAD (`7e3c1a5`-era, CSV export + j/k nav +
remembered zoom + BACKLOG #30/#32) ships in the same session — recorded
below when it happens.
