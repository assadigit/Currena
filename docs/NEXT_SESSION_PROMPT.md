# Currena — Next Session Brief (post-I16 wrap-up)

Hand-off date: 2026-10-08 (the I16 daily-accumulation fix round). ·
Production: https://currena.ir · Repo: `origin/main` = the I16 record (the
deploy/ingest records live in `docs/DEPLOY.md` — the Worker version of
record is still I15's `3e03c039`; I16 needed no Worker deploy).

---

## 1. What this project is

**Currena** — a currency-converter PWA focused on Iranian open-market
**Toman** rates plus international pairs, at **https://currena.ir**. The
Insights feature (`#/insights`) is the I15 page: question gauges (Is
borrowing getting costlier? …), a prices board (oil, gold, silver, copper,
iron ore, Bitcoin), two verdict meters in the hero (Australia first, swap
setting), alert cards + compact rows in Global|Australia lanes, and a
details side panel / bottom sheet. 41 indicators (29 voting gauge members +
prices-board rows + context); `dollar-broad` retired, TGJU out of insights
(licence). I16 (2026-10-08, third round) fixed the I15 daily-accumulation
mechanism: same-day live refresh in `withLivePoint`, the btc-usd bootstrap
(`buildHistoryFile` minPoints), gold-silver in SEED_IDS.

- `apps/api` — Hono on **Cloudflare Workers** (`/api/*`, zero-JS `/admin`,
  serves the built SPA). Cron `* * * * *` keep-warms rates.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, 10 routes,
  en/fa RTL). The Insights lazy chunk carries the bilingual corpus
  (~240 kB budget, justified in CHANGELOG §I15).
- `packages/core` — zod contracts (incl. `IndicatorId` ×41). 
  `packages/insights` — scoring engine + `gauges.ts` + `basket.ts` + source
  adapters (FRED / ECB / Frankfurter / gold-api / World Bank / ABS / RBA /
  manual) + derived series — **the ingest-runner half is what I16 changed**.
- **Ingestion:** GitHub Actions `insights-ingest` — cron **04:20 UTC daily**
  (executes ~7 h late, see DEPLOY.md §I16; + `workflow_dispatch` with
  `dry_run`), writes the snapshot + history keys into RATES KV via the
  Cloudflare REST API, seeds the accumulated daily history for
  gold/silver/copper/btc/gold-silver rows, and evaluates below-aux.
  Exit 1 if any P1 indicator is unavailable.

**Read before touching anything:** `AGENTS.md` (root) — TS strict, zod at
every boundary, RTL/LTR native, **TOMAN canonical**, tests never hit live
sites, secrets never persisted.

## 2. Where the knowledge lives

- `CHANGELOG.md` — §2026-10-08 I16 (the fix round) + §I15 (the owner-spec
  wave).
- `docs/insights/` — `02-page-design-spec.md` (UI ground truth);
  `01-indicator-spec.md` SUPERSEDED by definitions.ts + gauges.ts (history);
  `BACKTEST.md` regenerated 2026-10-08 (post-I16 round).
- `docs/PROGRESS.md` (status row + decisions), `docs/DEPLOY.md` (every
  deploy + the ingest-then-deploy ORDER note + the I16 runner-only
  sequence), `docs/BACKLOG.md` (Waves 6–9 closed; v2 items deferred).

## 3. Current verified state (I16)

- Gates: typecheck 5/5, tests **711/711** green (core 183 · scraper 67 ·
  insights 168 · api 119 · web 174). Budgets unchanged (no web/api code
  changed this round).
- Production verified this round: health ok; `/api/insights` 41 readings,
  zero stale/unavailable; today's scheduled ingest green (run #7, executed
  ~11:27 UTC); the pre-fix price mismatch measured (68.74 implied vs 69.97
  shown); post-fix dispatch verified consistent + `btc-usd/history` live.
- Honest accrual timeline: btc 7d change measurable from **2026-10-15**,
  30d from **2026-11-07** (one accumulated point per day; the seeded
  monthly rows' 7/30d become measurable on the same dates).

## 4. This session's likely mission

The owner's standing agenda: verify I15/I16 in production, then the v2
blocks when the wording review lands. Before anything:

1. **Check the daily ingest run is green** and `/api/insights` carries the
   41 readings (the scheduled runs fire ~11 UTC — see the DEPLOY.md note).
2. **Accrual check (from 2026-10-15):** btc/copper 7-day changes should
   appear on the prices board; gold/silver too. If not — re-read the I16
   record first.
3. v2 blocks (T1 connection cards, S1–S3 signals) ONLY after the owner's
   wording review + a legal read of the FRED "professional services" clause
   (data spec §10 flags it). S1 needs `SIGNALS_ENABLED=false` per the spec.
4. Open owner questions from the data spec §11 (optional F5 advertised
   rate, natural gas, food prices; S&P/VIX permissions).
5. Owner decisions pending: backtest threshold approval (BACKTEST.md is
   the evidence), Telegram ingest-alert secrets, I7 launch-approval.

## 5. Workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r test`.
2. Local dev: `pnpm --parallel dev` (api :8787, web :5173). Verify with
   agent-browser + VLM (en/fa, desktop/375px, zero console errors).
3. Commits conventional + phase prefix; push to `origin/main` regularly.
4. Deploy: web build + `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…
   pnpm --filter @currena/api exec wrangler deploy` — and for
   indicator-set changes, DISPATCH THE INGEST FIRST so the KV snapshot is
   the new format before the Worker's read-side validation sees it.
   Ingest-runner-only changes (like I16) need NO Worker deploy — dispatch
   the ingest after the push.
5. Wrap-up: changelog, final commit+push, deploy from final HEAD when the
   Worker changed, production smoke, worklog entry, remind the owner to
   rotate tokens.

## 6. Gotchas learned the hard way (I16 additions)

- `withLivePoint` semantics: a same-date stored point is an EARLIER run's
  observation — replace it with this run's live fetch; only a strictly
  NEWER history point means a lagging live source (keep history).
- A row with no monthly base (btc) must persist its FIRST daily point
  (`minPoints: 1`) or its accumulation can never bootstrap — every run
  rebuilds a single live point otherwise.
- GitHub Actions cron latency: the 04:20 UTC schedule executes ~7 h late
  (~11:10–11:30 UTC observed two days running) — still within the KV
  write budget window; the schedule stays.
- The engine ages freshness from the OBS date, not the release date; the
  KV read-side validation rejects old-format snapshots — dispatch the
  ingest BEFORE deploying a definitions change.
- VLM misreads persist — DOM checks are ground truth; verify buy/sell
  wording with `/\b(buy|sell)\b/i.test(document.body.textContent)`.
