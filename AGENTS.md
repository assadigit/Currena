# AGENTS.md — Currena

Operating manual for humans and AI agents working in this repo. Read before touching anything.

## What this is

Currena is a currency converter focused on Iranian open-market rates (Toman) plus
international pairs. It is a parallel rebuild of a production Django app that stays
live at https://aliassadi1993.pythonanywhere.com/ until an explicit human cutover.

- **apps/api** — Hono on Cloudflare Workers. Serves `/api/*`, the zero-JS
  `/admin` ops console (Phase 6: per-source status + manual refresh via
  REFRESH_SECRET; noindexed), AND the built SPA via Workers static assets
  (SPA fallback). One deploy, no CORS. `run_worker_first` pins `/admin*`,
  `/api/*`, `/internal/*` to the Worker (navigation requests to non-asset
  paths would otherwise be served the SPA shell by the platform).
- **apps/web** — Vite + React + TS + Tailwind PWA (standalone SPA, never
  server-rendered; will be wrapped in Capacitor later).
- **packages/core** — zod schemas, conversion math, formatting. Pure. Tested.
- **packages/scraper** — source modules + normalizers. Tested against fixtures.
- **docs/** — FEATURE_MAP, MIGRATION_CHECKLIST, PROGRESS, DEPLOY.
- **docs/specs/** — the governing specs (world currencies: base v1.2 +
  the v1.3 change request, which wins where they disagree; see
  `docs/specs/traceability.md` for the requirement → code → test map;
  superseded drafts live in `docs/specs/archive/`).
- **docs/localization/** — Persian copy workflow, terminology, manifest, and
  the persian-site-copy working documents (moved from the root 2026-10-14).
- **legacy/** — (gitignored) Django backup — the ONLY source of truth for features.
- **legacy-captures/** — (gitignored) raw captures from the live site (Phase 1 evidence).

## Commands

Package manager is **pnpm** (Node ≥ 20).

    pnpm install
    pnpm -r typecheck
    pnpm -r test                                  # vitest — never hits live sites
    pnpm --parallel dev                           # api: wrangler dev (:8787) · web: vite (:5173)
    pnpm --filter @currena/web build              # SPA dist → served by the Worker
    pnpm --filter @currena/api deploy             # wrangler deploy (needs CLOUDFLARE_API_TOKEN)

## Non-negotiable engineering rules

1. **TypeScript strict everywhere.**
2. **Provider portability**: business logic imports NOTHING platform-specific.
   Web-standard APIs only (`fetch`, `Request/Response`, `URL`, `crypto`) outside
   `apps/api/src/adapters/`. All KV/storage access goes through the `RateStore`
   interface so a KV→D1 migration is a swap.
3. **Contracts live in `packages/core/src/schemas.ts`** as zod schemas
   (Rate, Snapshot, RatesResponse, RatesError, SourceConfig). Import, never
   redefine. Everything crossing a trust boundary — including scraper output —
   is zod-validated; an upstream layout change must fail loudly, never render garbage.
4. **SPA-only frontend.** All data via the JSON API. Hono RPC types (`hc<AppType>`)
   give the web app an end-to-end typed client.
5. **RTL/LTR is native from day one**: `dir` on `<html>` from locale; CSS logical
   properties only (`ms-/me-/ps-/pe-`, never `ml-/mr-`); every UI string through
   the i18n dictionary (`apps/web/src/i18n/`); numbers formatted only at render
   via `Intl.NumberFormat('fa-IR' | 'en-US')`. Internal numbers are canonical —
   never store formatted/display digits. Currency display names use the
   **international common name** (ISO 4217 / CLDR en — e.g. "UAE Dirham"; Gate 1
   decision 2026-09-16); the fa locale renders proper Persian names from the
   i18n dictionary.
   **Persian copy is audit-gated**: every user-facing fa string (both
   dictionaries, calendar `titleFa`, hardcoded literals incl. the `format.ts`
   time-ago mirrors) is fingerprinted in
   `docs/localization/persian-copy-manifest.json`. Adding or changing one makes
   `pnpm copy:audit` (CI gate) fail until the wording is reviewed and recorded —
   see `docs/localization/persian-copy-workflow.md`; terminology lives in
   `docs/localization/persian-terminology.md`. No em dashes in fa copy.
6. **Canonical unit for Iranian rates: TOMAN.**
   The legacy app used the ISO code `IRR`, but every value it served (and every
   TGJU profile behind it: `price_dollar_rl`, `price_eur`, …) is denominated in
   **Toman**. Evidence from the live API (2026-09-16): `1 USD = 230,500 "IRR"`
   — that is 230,500 Toman (TGJU open-market quote), labeled "Iranian Toman" in
   the UI and "live Iranian Toman rates" in the PWA manifest.
   Canonical form in this repo: `code: 'IRR'` + `unit: 'TOMAN'` (see the Snapshot
   schema). Any Rial↔Toman conversion happens ONLY inside the scraper normalizer —
   unit conversion must never leak into UI code.
   *(Extracted from the live site in Phase 1 — re-verify against `legacy/` when
   the Django backup is provided.)*
7. **Tests never hit live sites.** Scrapers are tested against HTML fixtures in
   `packages/scraper/fixtures/`.
8. **Routing rule (fallback ladder)**: pairs where either side is IRR/Toman →
   TGJU (live scrape → cached + stale banner → 503). International-only pairs →
   Frankfurter (`https://api.frankfurter.dev`) with the same ladder. **Never**
   fall IRR pairs back to the free API (interbank IRR ≠ open-market Toman);
   never mix sources within one conversion. *(Gate 2 decision 2026-09-16:
   Path A — the Worker scrapes TGJU directly. Path B, a GitHub Actions relay
   writing snapshots into KV, is the documented additive fallback to adopt only
   if TGJU ever blocks Workers egress in production — it is not built.)*
9. **Secrets**: runtime secrets via `wrangler secret put` / `.dev.vars`
   (gitignored). `credentials.md` is read-once and never echoed, logged, or committed.
10. **Commits**: `phase(N): summary` after each phase; keep `docs/PROGRESS.md`
    (checklist + decisions log) updated as you go.

## Phase discipline

This migration runs phase-by-phase with hard gates (✋). Do not start work past a
gate without explicit human approval. Current status lives in `docs/PROGRESS.md`.
