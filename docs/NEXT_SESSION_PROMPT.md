# Currena — Next Session Brief (Insights UI/UX pass + completeness sweep)

Hand-off date: 2026-10-07 (evening wrap-up) · Production: https://currena.ir ·
Repo: `origin/main` = `8ec66dc` + the evening wrap-up docs commits (runtime
unchanged; the exact final SHAs + Workers version of record are in
`docs/DEPLOY.md` §"Session wrap-up, 2026-10-07 evening").

---

## 1. What this project is

**Currena** — a currency-converter PWA focused on Iranian open-market **Toman**
rates plus international pairs, at **https://currena.ir**. The current feature
wave is **Insights** (`#/insights`): a bilingual (en/fa) macro-indicator page —
**30 indicators** (19 P1 / 11 P2) in a **GLOBAL section that renders before
AUSTRALIA** (owner decision), with a warning-count summary, 10-year position
bars, expandable plain-language cards, a weekly what-changed list, and a
key-dates calendar. Newest cards: `gold-usd` + `silver-usd` (ounce prices at
the top of the metals group — owner request, deployed 2026-10-07).

- `apps/api` — Hono on **Cloudflare Workers** (`/api/*`, zero-JS `/admin`,
  serves the built SPA). Cron `* * * * *` keep-warms rates.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, 10 routes,
  en/fa RTL). Insights is a lazy route: `routes/Insights.tsx` (313 lines) +
  `components/insights/*` (SummaryBlock, WhatChanged, ComingUp, JumpNav,
  IndicatorCard, HistoryChart, PositionBar, StatusChip, AboutTheData,
  `config.ts` display helpers — all unit-tested) + the lazy copy corpus
  `i18n/insights-copy-{en,fa}.ts` (30 indicators × 6 fields, en source of
  truth, fa compile-time shape-checked).
- `packages/core` — zod contracts (incl. `IndicatorId` ×30, readings,
  snapshot). `packages/insights` — scoring engine + source adapters
  (FRED / Frankfurter / TGJU / gold-api / World Bank / ABS / RBA / manual) +
  derived series (`derived.ts`).
- **Ingestion:** GitHub Actions `insights-ingest` — cron **04:20 UTC daily**
  (+ `workflow_dispatch` with `dry_run`), writes one snapshot + ≤30 history
  keys into the existing RATES KV via Cloudflare REST. Exit 1 if any P1
  indicator is unavailable (that red run IS the stale-feed signal until I7
  alerting exists).

**Read before touching anything:** `AGENTS.md` (root) — TS strict, zod at
every boundary, RTL/LTR native, **TOMAN canonical**, tests never hit live
sites, secrets never persisted.

## 2. Where the knowledge lives

- **Session-by-session narrative:** `/home/z/my-project/worklog.md` — read the
  LAST sections first (I5-deploy, I5-ounce-prices, evening wrap-up).
- `CHANGELOG.md` — §2026-10-07 ounce prices (+ the wrap-up note).
- `docs/insights/` — **`02-page-design-spec.md` is the UI/UX ground truth
  (read it FIRST)**; `01-indicator-spec.md` (definitions/thresholds);
  `03-data-sources.md` (licence verdicts + KV budget findings);
  `04-roadmap.md` (phase state); `BACKTEST.md` (threshold calibration).
- `docs/PROGRESS.md` (status row + decisions log + phase checklist),
  `docs/DEPLOY.md` (every deploy + the git-push-500 fallback runbook),
  `docs/BACKLOG.md` (no Insights items open).

## 3. Current verified state (2026-10-07 evening wrap-up smoke)

- Gates re-run at wrap-up: **typecheck 5/5, tests 516/516 green**
  (core 157 · scraper 67 · insights 132 · web 52 · api 108).
- Production `/api/insights`: **30 readings** — `gold-usd` 4107.7 (US$/oz,
  context) + `silver-usd` 60.109 at the top of metals, **all 18 global ids
  before the first Australia id** (index 18), 14 calendar events
  (2026-10-28 → 2027-05-04), zero unavailable indicators; `generatedAt`
  fresh (daily cron + dispatched run 37646617580). `/api/health` ok.
- Page verified en/fa × desktop/375px: Global-first sections, Persian digits +
  Jalali dates in fa, LED warning counts, position bars, expandable cards with
  SVG chart + SR table; zero console errors; no 375px overflow
  (`scrollW=clientW`).
- Layout today: mobile 1-col → `md:2` → `xl:3` card grids, `max-w-6xl`
  desktop container, `max-w-[480px]` mobile; mobile cards single-open,
  desktop multi-open; entry bundle 288.75 kB / 87.78 kB gz; Insights lazy
  chunk 104.54 kB / 31.49 kB gz; precache 60 entries / ~2165 KiB.

## 4. This session's mission (owner agenda, in order)

> "Improving UI/UX of Insights page. and making sure nothing is left behind."

### Phase A — UI/UX audit (evidence, not taste)

Re-review the live page against `02-page-design-spec.md` with fresh eyes.
agent-browser (DOM + geometry) + VLM screenshots, en + fa × desktop + 375px ×
light + dark. Produce a **ranked findings list (severity × effort)** covering
at least:

- **Scannability of 30 cards / hierarchy:** is the page's story readable in
  ~10 s (summary → what-changed → coming-up → sections)? Section headers'
  "x of y in warning" lines; group headers; JumpNav discoverability and
  active-section awareness while scrolling.
- **Card design:** value prominence, status chip + position-bar legibility,
  expanded-content length (five sections can read as a wall of text),
  tap-target sizes, the rule-in-plain-language line.
- **Charts:** tick density, hover/focus affordances, min/max annotation,
  clarity of the LTR-time-axis-in-RTL decision for fa readers.
- **States:** skeletons, stale/unavailable greying, quiet-week, offline
  banner, empty calendar.
- **Craft:** spacing/typography rhythm vs the rest of the app, WCAG contrast
  in both themes, reduced-motion, print/share niceties (stretch).
- **fa quality:** RTL mirroring by DOM geometry (not screenshots alone),
  bidi isolation, Persian digits, Jalali dates, native tone of the copy.

### Phase B — Implement the improvements

Ground rules (non-negotiable):

- **Presentation-layer only.** No changes to scoring, thresholds, sources, KV
  keys or API contracts unless a finding demands it — then document why in
  the decisions log.
- All copy through the copy modules (en source of truth, fa native +
  shape-checked). No hardcoded strings. CSS logical properties only; numbers
  via `Intl` at render; charts' time axis stays LTR in fa (documented
  decision).
- Every change: typecheck + 516 tests green (update tests for any touched
  pure logic — `config.ts` is unit-tested), **bundle budget held** (entry
  ≈ ≤289 kB / ≤88 kB gz; Insights chunk growth justified in the changelog),
  zero console errors, agent-browser verification en/fa × desktop/375px,
  VLM-assisted visual QA, no horizontal overflow at 375px.
- Accessibility bar stays or rises: icon+word status, real buttons,
  `aria-expanded`, chart table alternatives, reduced-motion, heading order.
- Commit per coherent improvement (`I6-UX` prefix), push regularly.

### Phase C — "Nothing left behind" completeness sweep

- **Phase I6 leftover (roadmap):** re-run the backtest with the full
  30-indicator set → update `docs/insights/BACKTEST.md`
  (`pnpm --filter @currena/insights backtest`; the two new context cards
  never vote — include them honestly).
- **Phase I7 hardening checklist:** stale-feed alerting (admin console +
  failed-workflow notification), performance budget + PWA precache impact,
  SWOT-style re-check of the feature (update `docs/BACKLOG.md`), final
  production smoke (health, snapshot, each card, en/fa). Do what fits the
  session; backlog the rest explicitly.
- **Standing-state verification:** all 30 cards, sample
  `/api/insights/:id/history` (200 + 404-for-single-point),
  `changedThisWeek`, calendar, offline fallback, `/admin` Insights freshness
  card, last Actions ingest run green (04:20 UTC cron).

### Wrap-up (same discipline as every session)

CHANGELOG + PROGRESS + worklog entries; final commit + push; deploy from
final HEAD; production smoke; remind the owner to rotate tokens if they
transited chat again.

## 5. Workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r test`
   (never red before commit).
2. Local dev: `pnpm --parallel dev` (api :8787, web :5173). Verify with
   agent-browser + VLM (en/fa, desktop/375px, zero console errors). To test
   against production-shaped data: fetch the live snapshot from currena.ir
   and serve it through the seeded-miniflare replay shim used in I4/I5
   (pattern in the worklog).
3. Tests never hit live sites; adapters tested against fixtures.
4. Commits conventional + phase prefix; push to `origin/main` regularly.
5. Deploy: `pnpm --filter @currena/web build && CLOUDFLARE_API_TOKEN=…
   CLOUDFLARE_ACCOUNT_ID=… pnpm --filter @currena/api run deploy` (owner
   supplies session tokens; env-only, inline per command, never persisted,
   never echoed).
6. Wrap-up: changelog, final commit+push, deploy from final HEAD, production
   smoke, worklog entry.

## 6. Gotchas learned the hard way (don't re-learn them)

- pnpm on PATH via corepack (`corepack enable --install-directory
  /home/z/.local/bin`); non-interactive shells don't read .bashrc exports.
- `pnpm --filter @currena/api run deploy` (bare `deploy` collides with the
  pnpm builtin).
- GitHub git-write can 500 repo-wide while reads + REST stay healthy →
  byte-identical commit replay via the REST API (runbook in DEPLOY.md).
- **KV write budget:** dispatch extra ingest runs only before ~18:30 UTC; a
  run needs ~26 writes of the 1,000/day account cap.
- **RBA fetches 403 from this build sandbox** (venue block) — the Actions
  venue is fine; never "fix" this locally. FRED needs the ingestion
  User-Agent, not the Chrome fingerprint.
- VLM misreads: Persian digits hallucinated, seven-segment '1' looks
  clipped, RTL order needs DOM Range geometry checks as ground truth.
- BIDI: Persian month + Latin year in one span scrambles — isolate with
  `<bdi>`/`dir`.
- Charts + position bars keep LTR axes in fa (documented decision —
  analytical axes).
- SW auto-update: first load after deploy may serve the old precache; a
  two-reload verify cycle is normal.
- KV eventual consistency: cache-bust + retry before concluding failure.
- Mobile grids: implicit `auto` tracks caused horizontal overflow once —
  keep explicit `grid-cols-*` / flex stacks.
- Bundle: the converter is the money page; Insights must stay lazy and
  within budget.
