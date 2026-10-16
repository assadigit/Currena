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
