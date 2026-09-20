# Currena — Next Session Brief (SWOT · Debug & Fix · Modularize · Optimize)

Hand-off date: 2026-09-20 · Repo state: `origin/main` = `19b31f3` · Production: https://currena.ir (Workers version `1ca53028`, runtime identical to `982cbc43`)

---

## 1. What this project is

**Currena** — a currency converter focused on Iranian open-market **Toman** rates plus international pairs. Production PWA at **https://currena.ir**.

- `apps/api` — Hono on **Cloudflare Workers** (serves `/api/*`, zero-JS `/admin` console, and the built SPA via Workers static assets). Cron `* * * * *` keep-warm + TGJU cache-bust + server-side rate history in KV.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, 9 routes, en/fa RTL, LED shopfront boards, autoUpdate service worker, PWABuilder-ready).
- `packages/core` — zod contracts, conversion math, formatting (pure, tested).
- `packages/scraper` — TGJU `ajax.json` (+ profile fallback) → Snapshot (Toman), gold/coin quotes.
- `docs/` — FEATURE_MAP, DEPLOY, PROGRESS, SESSION_LOG, SWOT, BACKLOG, FINAL_REPORT.

**Read before touching anything:** `AGENTS.md` (repo root) — the non-negotiable rules (TS strict, provider portability via `RateStore`, zod at every boundary, RTL/LTR native, **TOMAN canonical**, scraper-only unit conversion, tests never hit live sites, secrets never persisted).

## 2. Where the knowledge lives

- **Session-by-session narrative:** `/home/z/my-project/worklog.md` (Tasks 1–25, every decision + verification detail). READ THIS FIRST.
- **Per-commit record:** `CHANGELOG.md` (§2026-09-18 hardening, §2026-09-19 ever-green + LED boards).
- **Known open items:** `docs/BACKLOG.md` (10 open) — rate-limit admin POST, `downloadBlob` dedupe, i18n hardcoded strings, first web unit tests, `splitEvenly` → core, batch parser bounds, `HttpError` codes, Odometer reduced-motion, settle multi-tab sync, health enrichment.
- **Prior SWOT:** `docs/SWOT.md` (2026-09-18) — re-run it, don't just reuse it.

## 3. Current verified state (2026-09-20 smoke)

- Tests **308/308 green** (134 core + 17 web + 66 scraper + 91 api), typecheck 4/4.
- `/api/health` 200 + security headers; `/api/rates` LIVE-fresh (17 FX + 9 TOMAN gold); `/api/history` **93 generations** accumulated (server-side rate history — sparkline fix working).
- Converter golden path: 100 USD → 5,810,157 IRR @ 230,275, LIVE UPDATE, trend "last 94 updates".
- Both LED boards render (bezel frames, DSEG7 digits, clock); mobile 375px zero overflow; zero console/page errors.
- PWA autoUpdate proven in production (3 real-world self-apply cycles recorded).

## 4. This session's mission (in order)

### Phase A — SWOT re-run
Fresh audit of api/web/core+scraper against today's code (it has changed a lot since the 2026-09-18 SWOT: cron, history, gold, LED boards landed). Deliver `docs/SWOT.md` v2 + a prioritized session backlog. Verify claims by probing production (curl `/api/*`), reading code, and running `pnpm audit`.

### Phase B — Debug & fix
Work the SWOT weaknesses + `docs/BACKLOG.md` open items. Every fix: root-cause first, failing-path proof, fix, regression test, browser verification (local vite :5173 + wrangler :8787 via agent-browser), then production verify after deploy.

### Phase C — Modularize & extract monoliths (refactor, zero behavior change)
Measured line counts at hand-off:

| File | Lines | Extraction candidates |
|---|---|---|
| `apps/web/src/routes/Settle.tsx` | 937 | groups grid/detail/modal → components; settlement math already in core |
| `apps/web/src/routes/Receipt.tsx` | 917 | paper view / live summary / export logic → components; jsPDF+xlsx writers already lazy |
| `apps/web/src/routes/Converter.tsx` | 556 | ResultPopup wiring, quick-chips, recent-pairs → components |
| `apps/web/src/routes/BatchConverter.tsx` | 554 | parse/convert loop → lib; results table → component |
| `apps/web/src/routes/LiveRates.tsx` | 503 | cards grid section + LED hero section split |
| `apps/web/src/routes/History.tsx` | 426 | stats row, filter chips, entry card → components |
| `apps/web/src/components/ResultPopup.tsx` | 400 | trend section + share/export actions |
| `apps/web/src/i18n/en.ts` / `fa.ts` | 438/435 | split by domain (nav/converter/board/gold/…) keeping one typed dictionary |
| `apps/api/src/index.ts` | 608 | routes → `apps/api/src/routes/*.ts` modules (rates, convert, meta, status, refresh, history), scheduled handler → own file, keep {fetch, scheduled} entry thin |
| `packages/scraper/src/tgju.ts` | 432 | FX parsing vs gold parsing vs profile fallback → separate modules |

Rules for the refactor: **typecheck + 308 tests green after every extraction step** (add tests for any extracted pure logic), bundle size must not regress (baseline: 290.28 kB / 87.77 kB gz initial JS, 58 precache entries / 2042.89 KiB), zero visual change (spot-check boards + converter via agent-browser + VLM), commit per coherent extraction (not one giant commit).

### Phase D — Performance & reliability optimization
Measure first, then optimize. Ideas to evaluate (not mandates):
- Web: route-level `React.lazy` for the 6 heavy routes (Settle/Receipt/Batch…) — check gz budgets; memo audit on LED boards (they re-render on 30s poll); `requestIdleCallback` for history hydration.
- API: per-isolate micro-cache already exists for rates — add for `/api/history`; consider `waitUntil` for history recording (currently direct await — measured ok, but check cron tail latency); KV read batching.
- Reliability: BACKLOG #18 rate limit; #33 `HttpError` machine-readable codes; scraper retry policy vs TGJU edge hiccups; history backfill from TGJU's own history API (scope-guarded out last session — now in scope if effort allows).
- PWA: consider reducing precache (2042.89 KiB is heavy — screenshots already excluded; fonts subsets?).

## 5. Workflow (per AGENTS.md, enforced)

1. `pnpm install` → `pnpm -r typecheck` → `pnpm -r test` (never red before commit).
2. Local dev: `pnpm --parallel dev` (api :8787, web :5173). Verify with agent-browser (DOM audits + VLM screenshots, en + fa, desktop + 375px, zero console errors).
3. Tests never hit live sites; scrapers tested against fixtures.
4. Commits: conventional + phase prefix, pushed to `origin/main` regularly.
5. Deploy: `pnpm --filter @currena/web build && CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm --filter @currena/api run deploy` (owner supplies session-scoped tokens; env-only, never persisted, never echoed). Verify production after EVERY deploy (health, rates, converter golden path, boards, console).
6. Keep `CHANGELOG.md` + `docs/PROGRESS.md` + `docs/SESSION_LOG.md` + `/home/z/my-project/worklog.md` updated as you go.
7. Wrap-up: changelog, final commit+push, deploy from final HEAD, production smoke, worklog entry.

## 6. Gotchas learned the hard way (don't re-learn them)

- pnpm must be on PATH (corepack: `corepack enable --install-directory /home/z/.local/bin`); non-interactive shells don't read .bashrc exports.
- `pnpm --filter @currena/api run deploy` (bare `deploy` collides with pnpm builtin).
- Vite HMR module-instance gotcha: `dynamic import('/src/lib/…')` creates a SEPARATE module from the app's singleton — import the app's actual resource URL (`?t=` param) when driving the store in tests.
- VLM misreads: seven-segment '1' looks clipped, full-board screenshots miss sub-pixel ghosts, RTL order needs DOM Range x-position measurement (ground truth), Persian digits get hallucinated — always pair VLM with DOM geometry checks.
- BIDI: Persian month + Latin year in one span scrambles (AN run absorption) — isolate or use dir=rtl.
- SW auto-update: first load after deploy may serve old precache — one reload activates the waiting worker; two-reload verify cycle is normal.
- KV eventual consistency: a freshly-written history/status key may read stale for seconds — cache-bust + retry before concluding failure.
- TGJU static overnight/weekend = no new history generations (content-dedup working, not a bug).
- Deploy-blocked sessions: build + commit anyway; the owner supplies fresh tokens on return — close the gap then (pattern proven 3×).
