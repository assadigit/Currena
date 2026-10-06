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

- **Why 04:20 UTC**: the account's 1,000 free KV writes/day are exhausted by
  ~18:30 UTC through the ever-green rates cron + the second worker on the
  account (see docs/insights/03-data-sources.md §Phase I3 record). The run
  lands in the fresh post-midnight budget; capped writes are retried in the
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
