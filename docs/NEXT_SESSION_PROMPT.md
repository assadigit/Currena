# Currena — Next Session Brief (post-I18 wrap-up)

Hand-off date: 2026-10-08 (the I18 wrap-up audit fix — the 375px
horizontal-scroll bleed removed from the Insights answer lines). ·
Production: https://currena.ir · Repo: `origin/main` = `eb59365` (I18).
The Worker version of record is **I18's `e4c8cdb6`** (docs/DEPLOY.md
§I18 has the session record + the ingest smoke run). The 2026-10-08
owner specs are fully shipped: v1 = I15, integrity = I16, v2 = I17,
the audit fix = I18 — nothing remains.

---

## 1. What this project is

**Currena** — a currency-converter PWA focused on Iranian open-market
**Toman** rates plus international pairs, at **https://currena.ir**. The
Insights feature (`#/insights`) is the I17 page: question gauges, a
prices board (oil, gold, silver, copper, iron ore, Bitcoin), two verdict
meters in the hero, alert cards + compact rows in Global|Australia lanes,
a details side panel / bottom sheet — and since I17 the **v2 surface**:
the "Together" connection cards (six relationships with leg leans and a
polarity-aware state rule) and the "What the signals say" cards for gold
+ silver (five/six conditions, the lean, the three plain checks, the
always-visible "before you act" box). 41 indicators (29 voting gauge
members + prices-board rows + context). `SIGNALS_ENABLED` in
`apps/web/src/components/insights/config.ts` is the spec's feature flag —
shipped **true** with the owner's full approval; one flip to false hides
the section.

- `apps/api` — Hono on **Cloudflare Workers** (`/api/*`, zero-JS `/admin`,
  serves the built SPA). Cron `* * * * *` keep-warms rates.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, 10
  routes, en/fa RTL). The Insights lazy chunk carries the bilingual
  corpus (270 kB / 69.5 kB gz vs the 280/72 budget — the I17 bump is
  itemised in `scripts/check-bundle-budget.mjs`).
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

- `CHANGELOG.md` — §2026-10-08 I17 (the v2 wave) + §I16 (the fix round) +
  §I15 (the owner-spec v1 wave).
- `docs/insights/` — `02-page-design-spec.md` + the uploaded 2026-10-08
  owner specs (the repo copy + `upload/` in the sandbox);
  `BACKTEST.md` regenerated 2026-10-08.
- `docs/PROGRESS.md` (status row + decisions), `docs/DEPLOY.md` (every
  deploy + the ingest-then-deploy ORDER note + the I17 record),
  `docs/BACKLOG.md` (Waves 6–10 closed; NOTHING from the 2026-10-08
  owner specs remains).

## 3. Current verified state (I18)

- Gates: typecheck 5/5, tests **747/747** green (core 183 · scraper 67 ·
  insights 193 · api 119 · web 185). Budgets held (entry 290.12/86.99 vs
  296/89.5; Insights 270.00/69.49 vs 280/72).
- Production verified this round: health ok; `/api/insights` 41 readings,
  zero stale/unavailable; the dispatched ingest run `37775748411` green;
  the v2 sections live on https://currena.ir (states disagree · disagree
  · active · active · partly · disagree; gold 2/5 mixed, silver 3/6
  mixed) in en + fa, zero console errors, no buy/sell wording, no
  overflow at 1280/375.
- Honest accrual timeline: btc/copper 7-day changes measurable from
  **2026-10-15**, 30d from **2026-11-07** (one accumulated point per day;
  gold/silver same dates).

## 4. This session's likely mission

The 2026-10-08 owner specs are FULLY implemented (v1 as I15, the fixes
as I16, v2 as I17, the wrap-up audit fix as I18). Before anything:

1. **Check the daily ingest run is green** and `/api/insights` carries
   the 41 readings (the scheduled runs fire ~11 UTC — DEPLOY.md §I16).
2. **Accrual check (from 2026-10-15):** btc/copper/gold/silver 7-day
   changes should appear; the gold/silver *footing* condition then
   switches from the position fallback to the real 30-day speed.
3. Owner-side standing items (none of them block the site): Telegram
   ingest-alert secrets, the I7 launch-approval exit gate (BACKTEST.md
   is the evidence), the S3-note legal read of the signals wording, the
   per-connection evidence confirmations (tags stay "to verify"),
   **token rotation** (GitHub + Cloudflare — both transited chat).
4. If the owner wants the signals section hidden at any point: set
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
   validation sees it. Web-only changes (like I17) deploy directly.
5. Wrap-up: changelog, final commit+push, deploy from final HEAD when
   the Worker changed, production smoke, worklog entry, remind the
   owner to rotate tokens.

## 6. Gotchas learned the hard way (I17 additions)

- Connection polarity matters: an INVERSE relation (real-yield/gold,
  dollar/commodities) reads `active` when legs lean AGAINST each other —
  the uniform state rule compares polarity-adjusted leans, never the raw
  ones (connections.ts `rel()`); getting this wrong reads a broken
  see-saw as "active".
- A steady direction at a decade-extreme level still LEANS (flat-at-
  extreme ≠ neutral); pure neutrality needs steady AND mid-range.
- Monthly/quarterly legs carry no change30d — their lean comes from the
  F3 level bands (gold's own 30d speed accrues from 2026-10-15; until
  then the footing condition uses the honest position fallback).
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
