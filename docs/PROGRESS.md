# PROGRESS — Currena migration

Living document. Update with every phase. Humans check this first.

## Current status

| | |
|---|---|
| **Phase** | 5 active — apps/web SPA next (API deployed: https://currena-api.sedanama-ir.workers.dev — GATE 2 Path A in production) |
| **Legacy source** | `./legacy/` NOT provided in the environment. Inventory reconstructed from the live site (https://aliassadi1993.pythonanywhere.com/) — fidelity caveats documented in `FEATURE_MAP.md` |
| **Push to GitHub** | Unblocked — credentials provided 2026-09-16 (stored outside the repo; never committed) |
| **Live legacy app** | Untouched, healthy (verified 2026-09-16, live conversion exercised end-to-end) |

## Phase checklist

- [x] Phase 0 — Safety & scaffold (`.gitignore` first, monorepo, AGENTS.md, PROGRESS.md)
- [x] Phase 1 — Legacy inventory (FEATURE_MAP.md, MIGRATION_CHECKLIST.md, scraper extraction, i18n dictionaries) — from live site
- [x] **GATE 1 — APPROVED 2026-09-16** (5/5 open questions answered — MIGRATION_CHECKLIST "Gate 1 decisions")
- [x] Phase 2 — Spike: deploy minimal Worker, TGJU block test from Workers + GitHub Actions ✅ **TGJU reachable from Workers** (evidence: `docs/GATE2_EVIDENCE.md`)
- [x] **GATE 2 — APPROVED 2026-09-16** — owner: "A. if A failed, path B." → **Path A** (direct scrape); Path B stays the documented fallback
- [x] Phase 3 — packages/core (schemas, math, normalizers, formatters, Vitest green) ✅ 107 tests / 7 files green; contracts: Rate/Snapshot/RatesResponse/RatesError/SourceConfig; math incl. TOMAN + same-currency short-circuit; settle/calc/batch algorithms; fa/en + Jalali formatting
- [x] Phase 4 — scraper + api (TGJU/Frankfurter modules, KV RateStore, ladder, endpoints, fixtures, tests) + deploy ✅ 202 tests green (core 107 + scraper 43 + api 52); deployed to https://currena-api.sedanama-ir.workers.dev — live smoke: 100 USD → 23,050,000 IRR(Toman) @ 230,500 (legacy parity), EUR→GBP via Frankfurter, AED international → clean 503, /internal/refresh + secret auth OK, freshness-window cache hit OK
- [ ] Phase 5 — apps/web (full PWA, every Keep feature, performance budgets) ⏸️ CURRENT — **part 1 shipped & deployed 2026-09-16**: app shell (hash router, menu, theme, fa/en + RTL), snapshot store (once-per-freshness-window + localStorage last-good), converter (§8 state machine, manual rate, copy, share-image lazy chunk, Jalali timestamps), live rates (8 cards, 30s auto-refresh), PWA (real icons, app-shell precache, self-hosted Poppins+Vazirmatn). Initial JS **114.5 KB gzipped** (< 200 KB budget); html2canvas split into a lazy 46.8 KB chunk. Live: https://currena-api.sedanama-ir.workers.dev (SPA + API one deploy; non-API deep links serve index.html via ASSETS binding). Part 2 next: calculator, history, receipt generator, expense splitter, split & settle, batch converter, about
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
| 2026-09-16 | **GATE 1 APPROVED** — price-scanner OCR + scanning features deferred (revisit post-cutover); currency names use international common names (AED = "UAE Dirham"); same-currency conversions short-circuit locally; proceed live-site-only | Owner answers in chat; recorded in MIGRATION_CHECKLIST "Gate 1 decisions" |
| 2026-09-16 | GitHub remote + push unblocked; Cloudflare token available for Phase 2 deploy | Credentials provided by owner; stored outside the repo (never committed, never echoed) |
| 2026-09-16 | **Phase 2 evidence: Workers CAN egress to TGJU** — deployed `currena-probe` worker: profile pages 200/html-ok from HKG + ATL colos; `call1.tgju.org/ajax.json` valid JSON; GH Actions runner identical; `api.tgju.org/v1/market/indicator/summary` dead (404); one transient CF `error 1042` → Phase 4 scraper needs quick retries | `docs/GATE2_EVIDENCE.md` + `docs/evidence/` — recommendation: **Path A** (direct scrape); awaiting owner decision |
| 2026-09-16 | **GATE 2 APPROVED — Path A: the Worker scrapes TGJU directly** (mission §5/§6 ladder verbatim). Path B (GH Actions relay → KV) is **not** built; it remains the documented additive fallback to adopt only if TGJU blocks Workers egress in production. Probe artifacts deleted: `apps/probe`, `.github/workflows/tgju-probe.yml`, deployed `currena-probe` Worker | Owner decision in chat: "A. if A failed, path B." |
| 2026-09-16 | **TGJU values are RIAL — normalizer ÷10 → TOMAN.** `call1.tgju.org/ajax.json` `current[slug].p` (and profile `PDrCotVal`) are Rial-denominated with comma separators (price_dollar_rl = "2,305,000"); the legacy app served 230,500 Toman → ÷10 confirmed by cross-checks (EUR, AED consistent with USD anchor) | Phase 4 live captures (/home/z/legacy-capture/upstream-samples/) vs legacy live-API evidence |
| 2026-09-16 | **Primary TGJU source = `call1.tgju.org/ajax.json`** (one request carries all 16 symbols; Phase 2 proved it reachable from Workers) with per-profile HTML scrape (`PDrCotVal`) as fallback; quick retries (2×, ~300/800ms) for transient CF `error 1042` | Phase 4 implementation decision (AGENTS.md §8 ladder unchanged) |
| 2026-09-16 | **Frankfurter serves no AED/VND** (verified live: 31 currencies, both absent) → international pairs involving AED/VND return a clean `currency_not_supported` 503; their IRR-pairs remain served via TGJU. Documented as a known limitation (the legacy stack had the same Frankfurter dependency) | Phase 4 live smoke test |
