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

## Where things live

A TypeScript pnpm monorepo. The semantic-modularization program (M1–M16)
landed every file in its domain home; the layout below is the
post-modularization state.

```
apps/
  api/        Hono on Cloudflare Workers (currena-api) — src/index.ts composition root
              + src/routes/ (rates · ops · admin · internal · insights) + HTTP plumbing.
              Serves /api/*, the /admin ops console, AND the built SPA (static assets, SPA fallback).
  markets/    The markets worker (currena-markets) — scheduled-only crons + the EODHD stock
              ingestion. src/index.ts + src/crons.ts. A page request can never reach a provider.
  web/        The Vite React PWA (standalone SPA, never server-rendered). src/ holds:
              features/        11 domain homes — insights-legacy · global · gold · world-markets ·
                               australia · commodities · currencies · usa · europe · asia-pacific ·
                               economic-linkages
              features-tools/  9 tool domains — about · batch · calculator · converter · history ·
                               live-rates · receipt · settle · splitter
              shared/          the shared layer — components/ · config/ · hooks/ · i18n/ · lib/ · ui/
              infrastructure/  the 16 infrastructure files (the skeleton root)
              App.tsx · main.tsx · router.ts · components/{Header,Footer,ErrorBoundary}.tsx · lib/  (src-root)
packages/
  core/       zod schemas + conversion math + formatting (the money-tool cores). Pure. Tested.
  insights/   the engine — src/shared/ (definitions · gauges · gold-score · connections · scoring ·
              validation · the 13 adapters/ · ingest/ · prices/ · store.ts), src/domains/ (9:
              asia-pacific · australia · commodities · companies · currencies · europe · gold ·
              usa · world-markets), src/page-division/ (the engine-pages authority — stays),
              src/narrator/ (stays), root index.ts barrel
  scraper/    TGJU + Frankfurter source modules + the RateStore port. Tested against fixtures.
docs/
  HANDOFF.md · DECISIONS.md · DEPLOY.md · INDICATORS_AND_DATA_SOURCES.md ·
  specs/ · audits/ · modularization/ · page-division/ · insights/ · localization/ · archive/ · assets/
legacy/       (gitignored) the Django backup — the ONLY source of truth for features.
```

The full audit (every file's target home + the D1–D10 skeleton deviations +
the N1–N18 cross-domain edge map) is in
[`docs/modularization/MODULARIZATION-AUDIT.md`](docs/modularization/MODULARIZATION-AUDIT.md);
the per-session delivery records are in
[`docs/DECISIONS.md`](docs/DECISIONS.md) (BD-M0 → BD-M16) and
[`CHANGELOG.md`](CHANGELOG.md).

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
