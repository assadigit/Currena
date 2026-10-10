# Currena — Next Session Brief (post-I19)

Hand-off date: 2026-10-10 (the I19 staleness false-alarm fix —
`govt-interest-revenue` gets its BEA release-lag `staleAfterDays: 215`).
· Production: https://currena.ir · Repo: `origin/main` = I19's commit (see
docs/DEPLOY.md §I19 for the session record + Workers version).

---

## 1. What this project is

**Currena** — a currency-converter PWA focused on Iranian open-market
**Toman** rates plus international pairs, at **https://currena.ir**. The
Insights feature (`#/insights`) is the I17 page: question gauges, a
prices board (oil, gold, silver, copper, iron ore, Bitcoin), two verdict
meters in the hero, alert cards + compact rows in Global|Australia lanes,
a details side panel / bottom sheet — and the **v2 surface**: the
"Together" connection cards (six relationships with leg leans and a
polarity-aware state rule) and the "What the signals say" cards for gold
+ silver. 41 indicators (29 voting gauge members + prices-board rows +
context). `SIGNALS_ENABLED` in `apps/web/src/components/insights/config.ts`
is the spec's feature flag — shipped **true** with the owner's full
approval; one flip to false hides the section.

- `apps/api` — Hono on **Cloudflare Workers** (`/api/*`, zero-JS `/admin`,
  serves the built SPA). Cron `* * * * *` keep-warms rates.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, 10
  routes, en/fa RTL). The Insights lazy chunk carries the bilingual
  corpus (270 kB / 69.5 kB gz vs the 280/72 budget).
- `packages/core` — zod contracts (incl. `IndicatorId` ×41).
  `packages/insights` — scoring engine + `gauges.ts` + `basket.ts` +
  `connections.ts` + `signals.ts` + source adapters + derived series.
- **Ingestion:** GitHub Actions `insights-ingest` — cron **04:20 UTC
  daily** (executes ~7 h late, see DEPLOY.md §I16; + `workflow_dispatch`
  with `dry_run`), writes the snapshot + history keys into RATES KV,
  seeds the accumulated daily rows, evaluates below-aux. Exit 1 if any
  P1 indicator is unavailable.

**Read before touching anything:** `AGENTS.md` (root) — TS strict, zod at
every boundary, RTL/LTR native, **TOMAN canonical**, tests never hit live
sites, secrets never persisted.

## 2. Where the knowledge lives

- `CHANGELOG.md` — §2026-10-10 I19 (the staleness false-alarm fix) +
  §I18 (the 375px audit fix) + §I17 (the v2 wave) + §I16 + §I15.
- `docs/insights/` — `02-page-design-spec.md` + the uploaded 2026-10-08
  owner specs; `BACKTEST.md` regenerated 2026-10-08.
- `docs/PROGRESS.md` (status row + decisions), `docs/DEPLOY.md` (every
  deploy + the ingest-then-deploy ORDER note), `docs/BACKLOG.md`
  (Waves 6–12 closed; NOTHING from the 2026-10-08 owner specs remains).

## 3. Current verified state (I19)

- Gates: typecheck 5/5, tests **747/747** green (core 183 · scraper 67 ·
  insights 193 · api 119 · web 185). Budgets held (entry 290.12/86.99 vs
  296/89.5; Insights 270.02/69.50 vs 280/72).
- Scheduled ingest runs green (run 7 Oct-8, run 12 Oct-9); the failed
  run-11 dispatch was the known KV daily-write cap (429/10048) —
  auto-recovers at 00:00 UTC, no data impact.
- Daily accrual verified: Oct-8 AND Oct-9 points present for
  btc/copper/gold/silver (btc bootstrapped 2 points; the others carry the
  World Bank monthly base + daily rows).
- `govt-interest-revenue` false staleness: the 190d quarterly grace
  tripped while FRED confirmed the Q2 obs (2026-04-01) is the freshest
  that exists — I19 gives the series `staleAfterDays: 215` (same ABS
  quarter-start discipline). After the I19 ingest+deploy the reading
  returns to `normal`; the value/percentile were never wrong.

## 4. This session's likely mission

1. **Check the daily ingest run is green** and `/api/insights` carries
   the 41 readings with **zero stale** (I19's override holds; the
   `govt-interest-revenue` reading must be `normal` until the Q3 advance
   lands ~Oct 29-30, then `asOf` jumps to 2026-07-01).
2. **Accrual check (from 2026-10-15):** btc/copper/gold/silver 7-day
   changes should appear; the gold/silver *footing* condition then
   switches from the position fallback to the real 30-day speed.
3. Watch the I19+1 scheduled runs: if the KV daily-write cap ever bites a
   *scheduled* run (it has only hit same-day manual dispatches so far),
   the run retries nothing — investigate the write budget (the Worker's
   minute-cron owns ~400 writes/day on the free tier).
4. Owner-side standing items (none of them block the site): Telegram
   ingest-alert secrets, the I7 launch-approval exit gate (BACKTEST.md
   is the evidence), the S3-note legal read of the signals wording, the
   per-connection evidence confirmations (tags stay "to verify"),
   **token rotation** (GitHub + Cloudflare — both transited chat again).
5. If the owner wants the signals section hidden at any point: set
   `SIGNALS_ENABLED = false` in `apps/web/src/components/insights/
   config.ts`, build, deploy. No other change needed.

## 5. Workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r test`.
2. Local dev: `pnpm --parallel dev` (web :5173; the Vite proxy expects
   the API on :8787 — use the insights-preview mini-service pattern for
   snapshot data, or wrangler dev on a free port). Verify with
   agent-browser + VLM (en/fa, desktop/375px, zero console errors).
3. Commits conventional + phase prefix; push to `origin/main` regularly
   (token in the push URL once, then scrub it back).
4. Deploy: web build + `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…
   pnpm --filter @currena/api exec wrangler deploy` — and for
   indicator-set/snapshot-format changes, DISPATCH THE INGEST FIRST so
   the KV snapshot is the new format before the Worker's read-side
   validation sees it. Web-only changes deploy directly.
5. Wrap-up: changelog, final commit+push, deploy from final HEAD when
   the Worker changed, production smoke, worklog entry, remind the
   owner to rotate tokens.

## 6. Gotchas learned the hard way (I19 additions)

- Quarterly staleness is calibrated per SOURCE, not per cadence: BEA
  NIPA and ABS quarter-start items need 215 (obs ages ~209–212d between
  releases); the 190d quarterly grace is only honest for series whose
  next obs arrives earlier (RBA E2 ~161d). When adding a quarterly
  indicator, derive its limit from the release calendar, never the
  cadence alone.
- Connection polarity matters: an INVERSE relation (real-yield/gold,
  dollar/commodities) reads `active` when legs lean AGAINST each other —
  the uniform state rule compares polarity-adjusted leans, never the raw
  ones (connections.ts `rel()`); getting this wrong reads a broken
  see-saw as "active".
- A steady direction at a decade-extreme level still LEANS (flat-at-
  extreme ≠ neutral); pure neutrality needs steady AND mid-range.
- Monthly/quarterly legs carry no change30d — their lean comes from the
  F3 level bands (gold's own 30d speed accrues from 2026-10-15).
- Bilingual template assembly: telegraphic leg phrases
  ("{name}: {level} and {direction}") avoid verb agreement entirely;
  never re-introduce "is/are" phrasing across locales.
- The S3 dealing-costs wording uses inflected forms (buying/selling/
  buyers) — the acceptance regex `\b(buy|sell)\b` passes BECAUSE of the
  inflection; the fa copy avoids bare «خرید/فروش» the same way. Any new
  copy in these sections must keep both disciplines (the
  together-signals.test.ts corpus tests guard it).
- VLM misreads persist — DOM checks are ground truth; verify buy/sell
  wording with `/\b(buy|sell)\b/i.test(document.body.textContent)`.
