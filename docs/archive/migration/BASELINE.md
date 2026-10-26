# BASELINE — Autonomous Session 2026-09-24

Snapshot taken **before any changes** on branch `improve/autonomous-session-2026-09-24`
(base commit `bf61524`, "feat(web): pastel-gold hero amount input…").

## Stack

- pnpm@10.34.5 monorepo (Node ≥ 20; runner used Node 24.21.0)
- `apps/api` — Hono 4 on Cloudflare Workers (wrangler 4.132), KV-backed, zod 4
- `apps/web` — Vite + React 19 + TS 5.9 strict, Tailwind, PWA (workbox via vite-plugin-pwa), no router lib (custom)
- `packages/core` — zod schemas, conversion math, formatting (pure)
- `packages/scraper` — TGJU + Frankfurter source modules tested against fixtures

## Verification suite (all green)

| Check | Result | Duration |
|---|---|---|
| `pnpm -r typecheck` | ✅ PASS (4 pkgs) | ~5 s |
| `pnpm -r test` | ✅ **224 passed / 0 failed** (core 107 · scraper 43 · api 74), 15 files | ~3 s |
| `pnpm -r build` | ✅ PASS | **4.5 s** (web vite build 723 ms) |

## Bundle size (web dist, production)

| Chunk | Size | gzip |
|---|---|---|
| `index-*.js` (entry) | 270.41 kB | 82.88 kB |
| `xlsx-*.js` (lazy, Receipt) | 423.91 kB | 141.25 kB |
| `jspdf.es.min-*.js` (lazy, Receipt) | 399.06 kB | 129.63 kB |
| `index.es-*.js` | 151.41 kB | 48.90 kB |
| `html2canvas-*.js` (lazy, Receipt) | 199.49 kB | 46.77 kB |
| `ui-*.js` | 134.12 kB | 41.88 kB |
| `purify.es-*.js` | 26.92 kB | 10.69 kB |
| CSS (single sheet) | 68.84 kB | 12.03 kB |

- **PWA precache: 53 entries / 2399.90 KiB**
- Fonts: Vazirmatn variable (1 file) + 8 Poppins woff/woff2 subsets

## Dependency health

- Runtime deps: 12 external across 4 packages (hono, zod, react, react-dom, xlsx, jspdf, html2canvas, @fontsource/poppins) — lean, well-chosen
- Lockfile: 443 resolved packages, 5823 lines, node_modules 459 MB
- Outdated (all dev): `@cloudflare/workers-types` 5.20260916.1→5.20260918.1, `wrangler` 4.132.0→4.134.0, `typescript` 5.9.3→7.0.2 (major; not attempted)
- **`pnpm audit`: 2 HIGH — both `xlsx@0.18.5` (Prototype Pollution GHSA-4r6h-8v6p-xvw6, ReDoS GHSA-5pgg-2g8v-p4x9; npm registry copy is frozen, patched builds only on SheetJS CDN)**

## Repo health

- 30 commits, 128 tracked files, ~13.9k LOC (TS/TSX)
- Strict TS everywhere incl. `noUncheckedIndexedAccess`, `noImplicitOverride` — excellent baseline discipline
- CI: none (no `.github/`); local vitest only
- Docs: README, AGENTS.md, PROGRESS.md, FEATURE_MAP.md, MIGRATION_CHECKLIST.md, DEPLOY.md

## Performance scores

Lighthouse not measurable in this sandbox (no external browser access to the production
URL); bundle/precache numbers above serve as the perf baseline. currena.ir production
deployment is out of scope for this session (no deploy approval).

## Notes

- No `.env` committed; `.dev.vars` gitignored; no secrets in tree (verified).
- `apps/web` has **zero tests** (`--passWithNoTests`) — biggest testing gap.
