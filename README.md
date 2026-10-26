# Currena

Currency converter with live Iranian Toman (open-market) and international rates.
TypeScript monorepo: **Hono API on Cloudflare Workers** + **Vite React SPA (PWA)**.

Parallel rebuild of the legacy Django app (live at
https://aliassadi1993.pythonanywhere.com/ — untouched until an explicit human cutover).

## Where to look first

- **The consolidated reference** — what indicators Currena has, where each
  one is fetched from and how often, the public JSON API spec, and the
  known gaps: **[`docs/INDICATORS_AND_DATA_SOURCES.md`](docs/INDICATORS_AND_DATA_SOURCES.md)**
- **Operating manual** (humans + AI agents): [`AGENTS.md`](AGENTS.md)
- **The deploy runbook**: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- **The Insights doc index**: [`docs/insights/README.md`](docs/insights/README.md)
- **The Persian copy workflow**: [`docs/localization/persian-copy-workflow.md`](docs/localization/persian-copy-workflow.md)
- **The licence + source-risk register**: [`docs/insights/LICENCES.md`](docs/insights/LICENCES.md)
  + [`docs/insights/RISK_REGISTER.md`](docs/insights/RISK_REGISTER.md)

Historical planning / spec / evidence / QA material is preserved (not
deleted) under [`docs/archive/`](docs/archive/) and
[`docs/insights/archive/`](docs/insights/archive/) — git history is the
ultimate backup, but the on-disk tidy keeps the working tree navigable.

## Quick start

```bash
pnpm install
pnpm --parallel dev      # api on :8787 · web on :5173
pnpm -r test
pnpm -r typecheck
pnpm lint
pnpm copy:audit          # the Persian-copy manifest gate (CI gate)
pnpm --filter @currena/insights selfcheck   # the full self-check + live export
pnpm registry:generate   # regenerate data/indicators.json + the audit sidecar
pnpm --filter @currena/web build && node scripts/check-bundle-budget.mjs
```

## Deploy

```bash
pnpm --filter @currena/web build
pnpm --filter @currena/api exec wrangler deploy
```

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the deploy-lock check, the
post-deploy smoke, and the rollback recipe.

## Live

- **Site:** https://currena.ir
- **Insights API:** https://currena.ir/api/insights (100 indicators, 48 voters)
- **Health:** https://currena.ir/api/health
