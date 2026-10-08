# Currena — Next Session Brief (post-I15 wrap-up + backtest)

Hand-off date: 2026-10-08 (the I15 owner-spec wave). · Production:
https://currena.ir · Repo: `origin/main` = the I14 record + the I15 commits
(exact SHAs + the Workers version of record in `docs/DEPLOY.md`
§"Session wrap-up, 2026-10-08 I15").

---

## 1. What this project is

**Currena** — a currency-converter PWA focused on Iranian open-market
**Toman** rates plus international pairs, at **https://currena.ir**. The
Insights feature (`#/insights`) is now the **I15** page: question gauges
(Is borrowing getting costlier? …), a prices board (oil, gold, silver,
copper, iron ore, Bitcoin), two verdict meters in the hero (Australia
first, swap setting), alert cards + compact rows in Global|Australia lanes,
and a details side panel / bottom sheet. 41 indicators (29 voting gauge
members + prices-board rows + context), 11 added in I15 (fed-target,
ecb-dfr, us-cpi-yoy, nfci, the **Currena dollar basket**, eur-usd,
au-home-loan, au-wage-growth, au-rent-yoy, au-petrol-yoy, btc-usd,
copper-usd); `dollar-broad` retired, TGJU out of insights (licence).

- `apps/api` — Hono on **Cloudflare Workers** (`/api/*`, zero-JS `/admin`,
  serves the built SPA). Cron `* * * * *` keep-warms rates.
- `apps/web` — Vite + React + TS + Tailwind **PWA** (hash router, 10 routes,
  en/fa RTL). The Insights lazy chunk carries the bilingual corpus
  (~240 kB budget, justified in CHANGELOG §I15).
- `packages/core` — zod contracts (incl. `IndicatorId` ×41, readings with
  optional `moveScore`, `below-aux` rule atom). `packages/insights` —
  scoring engine + `gauges.ts` (steps/verdicts) + `basket.ts` (the dollar
  basket math) + source adapters (FRED / ECB Data Portal / Frankfurter /
  gold-api / World Bank / ABS / RBA / manual) + derived series.
- **Ingestion:** GitHub Actions `insights-ingest` — cron **04:20 UTC daily**
  (+ `workflow_dispatch` with `dry_run`), writes the snapshot + ≤41 history
  keys into RATES KV via Cloudflare REST, seeds the accumulated daily
  history for gold/silver/btc/copper rows, and evaluates below-aux with the
  au-cpi series. Exit 1 if any P1 indicator is unavailable.

**Read before touching anything:** `AGENTS.md` (root) — TS strict, zod at
every boundary, RTL/LTR native, **TOMAN canonical**, tests never hit live
sites, secrets never persisted.

## 2. Where the knowledge lives

- `CHANGELOG.md` — §2026-10-08 I15 (the owner-spec wave).
- `docs/insights/` — `02-page-design-spec.md` (original UI ground truth),
  the uploaded specs' v1 status: `01-indicator-spec.md` is now SUPERSEDED
  by definitions.ts + gauges.ts for membership/rules (keep as history);
  `BACKTEST.md` regenerated with the 41-id set.
- `docs/PROGRESS.md` (status row + I15 decisions), `docs/DEPLOY.md`
  (every deploy + the ingest-then-deploy ORDER note), `docs/BACKLOG.md`
  (Wave 8 closed; v2 items deferred).

## 3. Current verified state (I15)

- Gates: typecheck 5/5, tests **708/708** green (core 183 · scraper 67 ·
  insights 165 · api 119 · web 174). Budgets: entry 290.12/87.76 (vs
  296/89.5), Insights 235.80/61.92 (vs 240/64 — bumped with justification).
- Local verification: en/fa × desktop/375px × light/dark — hero meters,
  alert chips, prices board (gold USD+AUD, BTC ratios), lane switch with
  persistence, details panel (focus trap/Escape/return/scroll-lock, deep
  links), sticky scroll-spy nav, FRED notice, no buy/sell wording, zero
  console errors, no 375px overflow.
- Known honest edges: the first ingest after deploy starts the btc/copper
  daily-history accumulation (7/30d changes appear from the second day);
  RBA F6 parsing is fixture-verified + venue-pending (Series ID FLRHOOTA —
  the match is loud if the venue file differs).

## 4. This session's likely mission

The owner's standing agenda: verify I15 in production after the deploy,
then the v2 blocks when the wording review lands. Before anything:

1. **Check the 04:20 ingest run is green** and `/api/insights` carries the
   41 readings (the deploy order in DEPLOY.md ran the ingest BEFORE the
   worker deploy for read-side validation reasons — confirm it happened).
2. **Backtest gate**: `pnpm --filter @currena/insights backtest` — the
   owner approves thresholds from BACKTEST.md (I15 regenerated it).
3. v2 blocks (T1 connection cards, S1–S3 signals) ONLY after the owner's
   wording review + a legal read of the FRED "professional services" clause
   (data spec §10 flags it). S1 needs `SIGNALS_ENABLED=false` per the spec.
4. Open owner questions from the data spec §11 (optional F5 advertised
   rate, natural gas, food prices; S&P/VIX permissions).

## 5. Workflow (per AGENTS.md, enforced)

1. `pnpm install --frozen-lockfile` → `pnpm -r typecheck` → `pnpm -r test`.
2. Local dev: `pnpm --parallel dev` (api :8787, web :5173). Verify with
   agent-browser + VLM (en/fa, desktop/375px, zero console errors).
3. Commits conventional + phase prefix; push to `origin/main` regularly.
4. Deploy: web build + `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…
   pnpm --filter @currena/api exec wrangler deploy` — and for
   indicator-set changes, DISPATCH THE INGEST FIRST so the KV snapshot is
   the new format before the Worker's read-side validation sees it.
5. Wrap-up: changelog, final commit+push, deploy from final HEAD,
   production smoke, worklog entry, remind the owner to rotate tokens.

## 6. Gotchas learned the hard way (I15 additions)

- The engine ages freshness from the OBS date, not the release date — the
  data spec's monthly/quarterly "stale after" numbers were written the
  other way and false-alarm (us-cpi 75, ABS monthly 95, WPI 200, ABS
  quarter-start 215; see definitions.ts notes).
- KV snapshot read-side validation: an old-format KV snapshot (retired ids)
  FAILS the new zod enum — dispatch the ingest BEFORE deploying a
  definitions change.
- ABS monthly CPI series ids were identified by data signature +
  published-figure matching (Rents 115522, Automotive fuel 40081, WPI
  OHRPEB.7.TOT) — 03-data-sources.md carries the evidence.
- The Fed target is stored as the range midpoint; the 25bp corridor renders
  at display time (binary-exact quarters — no float dust).
- VLM misreads persist (it hallucinated HTML on some screenshots) — DOM
  checks are ground truth; verify buy/sell wording with
  `/\b(buy|sell)\b/i.test(document.body.textContent)`.
