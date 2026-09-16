# PROGRESS — Currena migration

Living document. Update with every phase. Humans check this first.

## Current status

| | |
|---|---|
| **Phase** | 1 complete — **GATE 1: awaiting human approval** |
| **Legacy source** | `./legacy/` NOT provided in the environment. Inventory reconstructed from the live site (https://aliassadi1993.pythonanywhere.com/) — fidelity caveats documented in `FEATURE_MAP.md` |
| **Push to GitHub** | **BLOCKED** — `credentials.md` absent; `github.com/assadigit/Currena` is private (unauthenticated access refused). All commits are local. |
| **Live legacy app** | Untouched, healthy (verified 2026-09-16, live conversion exercised end-to-end) |

## Phase checklist

- [x] Phase 0 — Safety & scaffold (`.gitignore` first, monorepo, AGENTS.md, PROGRESS.md)
- [x] Phase 1 — Legacy inventory (FEATURE_MAP.md, MIGRATION_CHECKLIST.md, scraper extraction, i18n dictionaries) — from live site
- [ ] **GATE 1 — human approval of both docs** ⏸️ CURRENT
- [ ] Phase 2 — Spike: deploy minimal Worker, TGJU block test from Workers + GitHub Actions
- [ ] **GATE 2 — Path A (direct scrape) vs Path B (GH Actions relay) decision**
- [ ] Phase 3 — packages/core (schemas, math, normalizers, formatters, Vitest green)
- [ ] Phase 4 — scraper + api (TGJU/Frankfurter modules, KV RateStore, ladder, endpoints, fixtures, tests) + deploy
- [ ] Phase 5 — apps/web (full PWA, every Keep feature, performance budgets)
- [ ] Phase 6 — admin stub (`/admin`, robots noindex, per-source status + manual refresh)
- [ ] Phase 7 — hardening & docs (ladder simulation, offline PWA check, DEPLOY.md, Vercel portability drill)

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-09-16 | `.gitignore` committed as the very first commit, before any code | Mission safety rule: secrets + legacy must never enter git history |
| 2026-09-16 | Scaffold locally without pushing | GitHub token absent (`credentials.md` missing); target repo private. Remote setup + push deferred until credentials are provided. |
| 2026-09-16 | Phase 1 inventory reconstructed from the **live site** | `./legacy/` backup missing from environment. The live site is the running production app, so every documented feature is real — but internals (models, views source, management commands, admin config, exact scraper selectors) require the backup to verify. Flagged as the #1 open question at Gate 1. |
| 2026-09-16 | Canonical Iranian unit = **TOMAN** (kept under code `IRR`) | Live API: `1 USD = 230,500 "IRR"` matches TGJU Toman quotes; UI label "Iranian Toman"; manifest: "live Iranian Toman rates". Normalization documented in AGENTS.md §6. |
| 2026-09-16 | Stack pinned: pnpm 10, TS 5.9 strict, zod 4, Hono 4, wrangler 4, Vite 8, Tailwind 4, Vitest 5 | Mission-fixed stack; latest stable majors at scaffold time. |
