# Insights — Current State Report (Phase 0, read-only)

Written 2026-10-16 by the insights-rebuild agent. Evidence format: `file:line`
against the working tree at commit `5433981` (main) unless a command output is
quoted. Nothing in this phase changed code — the only working-tree changes are
the `git mv` of the owner-uploaded spec files into `docs/insights/` (the layout
this runbook and the Step 3 spec already assume) and this report.

---

## S-01 Inventory of every indicator

The single registry (fix spec A-01) is `data/indicators.json` — 51 entries,
generated from code by `scripts/generate-indicators-registry.ts` and pinned by
`apps/web/src/lib/registry-sync.test.ts`. Per-entry fields: `id`, `title`,
`area.section/group/gauge`, `source.{provider,name,url,seriesIdOrTable}`,
`unit`, `changeUnit`, `cadence`, `maxAgeDays`, `scored`, `historyWindow`,
`rule`, `ruleVersion` (verified by reading the file: first entry
`yield-curve-10y2y`, fields as listed).

Counts (computed from the JSON today):

- by provider: fred 16 · derived 12 · abs 8 · rba 5 · gold-api 4 ·
  frankfurter 3 · ecb 1 · manual 1 · world-bank 1
- scored 37 of 51 (the rest are context cards)
- cadence: daily 24 · monthly 15 · quarterly 5 · weekly 5 · manual 1 ·
  per-change 1

Text production: every card sentence is generated — the needs-attention line
is interpolated from the reading's own rule/value, and the consequence lines
are state-keyed templates (the `meaning` maps were deleted for A-02; see the
template registry `textTemplates` in `data/indicators.json` and the A-02 pin
tests). Thresholds live in each entry's `rule` block; rule versions in
`packages/insights/src/ruleVersion.ts` (RULE_VERSION = 2 with a change log).

The world-markets table (17 rows in the baseline) and world-currencies table
(10 pairs) are separate boards with their own definitions:
`packages/insights/src/markets/definitions.ts`, `packages/insights/src/fx/definitions.ts`.

## S-02 Inventory of every source

| Source | How called | Used by (cards) | Licence/terms found | Checked |
|---|---|---|---|---|
| FRED (16 series) | server-side fetch in `packages/insights/src/adapters/fred.ts` | US rates, CPI, M2, stress, NFCI, VIX, Sahm, Philly Fed, unemployment | Per-series copyright varies (VIXCLS carries a Cboe copyright — confirmed by fetching the series page 2026-10-16, see T-16 work in Phase 1) | 2026-10-16 |
| ABS (SDMX) | `adapters/abs.ts` | AU CPI, trimmed mean, wages, rents, unemployment, home values, petrol CPI, terms of trade | CC BY 4.0 (attribution in "About this data") | 2026-10-16 |
| RBA tables F1/F2/F4.1/F6/E2 | `adapters/rba.ts` | cash rate, AU yields, deposits, home loans, household ratios | CC BY 4.0 with RBA attribution; F2 lags 2–4 business days (documented in FIX_REPORT B-09) | 2026-10-16 |
| Frankfurter (ECB) | `adapters/frankfurter.ts` | world currencies, AUD/USD | ECB terms; attribution shown | 2026-10-16 |
| ECB Data Portal | `adapters/ecb.ts` | ecb-dfr | ECB terms | 2026-10-16 |
| Yahoo Finance (unofficial) | `adapters/yahoo.ts` | Brent, gold, silver, Bitcoin, FTSE 100 + derived ratios | **Unofficial endpoints; personal-use only — defect E-01** | 2026-10-16 |
| gold-api.com | `adapters/goldapi.ts` | copper (+history from World Bank) | **Terms unconfirmed — defect E-02** | 2026-10-16 |
| World Bank Pink Sheet | `adapters/worldbank.ts` | iron ore, copper/gold monthly ratio | World Bank data terms | 2026-10-16 |
| Bitstamp | `adapters/bitstamp.ts` | BTC gap-fill history | Provider terms on site | 2026-10-16 |
| China NBS (manual entry) | `adapters/manual.ts` | china-pmi | **No expiry mechanism — defect E-08** | 2026-10-16 |

Full licence obligations are being registered in Phase 3 (`LICENCES.md`,
LR-01…LR-04).

## S-03 Status against INSIGHTS_FIX_SPEC.md

Parts A–D were implemented 2026-10-15 (commits `2dd2eae`, `7471622`, `4738263`,
`04d36bc`, `7a43a72`, `aeb701d`; wrap-up `b6a35a7`) and are recorded in
`FIX_REPORT.md` (repo root) with per-ID evidence: A-01…A-08 done; B-01…B-19
done; C-01…C-07 done; T-01…T-14 done (validation suite in
`packages/insights/src/validation.ts`, results written to `insights:status`
on every ingest). This runbook's Phase 1 re-verifies rather than re-implements.

New defects found by the owner's 2026-10-15 export audit are tracked as
E-01…E-24 in `docs/insights/INSIGHTS_DEFECTS_2026-10-15.md` — status: **not
started** (this runbook's Phase 2).

## S-04 Status against INSIGHTS_STEP3_SPEC.md

- §1 Phase 0 check: this report (S-01…S-08).
- §2 Access/licence policy: **not done** — no gate, no `SITE_MODE`, no
  licence fields on sources (grep for `SITE_MODE|INSIGHTS_PASSWORD|LICENCES`
  across `packages/` + `apps/` returns nothing).
- §3 Principles P-1…P-7: partly (P-2 fail-closed exists from A-04; P-4/P-5/P-6
  licence/attribution machinery not started; P-1 what-it-is/what-it-isn't not
  on cards; P-7 AU links exist via connections).
- §4 Layer 1: mostly present (VIX, Sahm, STLFSI4, NFCI, CPI/jobs via FRED,
  RBA/ABS tables, Philly Fed). Missing: L1-14 Shiller CAPE, L1-18 crypto
  Fear & Greed, L1-11 NY Fed recession probability (Check), L1-05 RBA I2
  (Check), L1-06/L1-07 link-outs.
- §5 Layer 2: partly — L2-04 highest-since (B-19), L2-05 spreads (B-10),
  L2-06 real return (B-18), L2-07 reconciliation (T-01), L2-08/L2-09
  expectations proxies exist. Missing: L2-01 stock-state rename (E-22),
  L2-02 200-day average, L2-03 US shares in AUD, L2-10 CAPE context.
- §6 Layer 3: hero exists; L3-02 relationship cards need the E-19/E-20 rule
  work; L3-03 no composite scores (currently respected); L3-04 context notes
  off by default (A-06 done).
- §7 Coverage + "Know before you buy US shares" box: box **not present**.
- §8 registry additions (layer/publisher/what_it_is/licence block): not
  started.
- §9 tests T-15…T-24: **not present** (grep confirms).
- §10/§11 reports/maintenance: not started.

## S-05 Hosting and limits

- **Ingest**: GitHub Action `insights-ingest.yml` (cron `20 4 * * *` UTC +
  manual dispatch, dry-run flag) → `pnpm --filter @currena/insights ingest`
  → fetches all sources, runs the validation suite, writes the snapshot,
  status, daily archive and per-series histories to Workers KV via the
  Cloudflare REST API (`.github/workflows/insights-ingest.yml:1-33`).
- **Markets/fx boards**: `apps/markets` worker crons `30 23 * * 1-5` +
  `30 1 * * 2-6` UTC writing `insights:markets:v1` / `insights:fx:v1`
  (AGENTS.md "apps/markets").
- **Live prices**: the api worker's minute cron refreshes Yahoo quotes at
  :13 each hour (`apps/api/wrangler.jsonc` comment block,
  `PRICES_CRON_MINUTE`).
- **KV**: one namespace, binding `RATES`, id `4627ac33a4b148ff9fc2189266b1890e`
  (`apps/api/wrangler.jsonc:kv_namespaces`). Free-tier budgets per full
  refresh (measured 2026-10-15, FIX_REPORT §5): 55 KV reads, 31 KV writes,
  49 outside requests — inside 100k reads/day, 1k writes/day, 50
  subrequests/invocation.

## S-06 Test suite

Runner: **vitest**, per-package. Commands: `corepack pnpm -r test` (all),
`pnpm --filter @currena/insights test`. Baseline run this session
(2026-10-16, against `5433981`):

```
packages/core      191 passed
packages/scraper    67 passed
packages/insights  403 passed
apps/markets        13 passed
apps/api           208 passed
apps/web           449 passed
total             1331 passed, 0 failed
```

Also in CI: `pnpm -r typecheck`, `pnpm run lint` (0 errors), `pnpm run
copy:audit`, web build + `scripts/check-bundle-budget.mjs`.

## S-07 Access (public today — this is the Phase 3 gap)

Every Insights data endpoint is **unauthenticated**. Mounted at
`apps/api/src/index.ts:133-141`, defined in `apps/api/src/routes/insights.ts`:

- `GET /api/insights` — full snapshot (51 readings)
- `GET /api/insights/markets` — world-markets board
- `GET /api/insights/fx` — world-currencies board
- `GET /api/insights/status` — run status + validation results
- `GET /api/insights/archive/:date` — daily snapshot archive
- `GET /api/insights/:id/history` — per-series history

The page shell (`/#/insights`) is a public SPA document. No login, no cookie,
no 401/403 anywhere on these paths. (Route tests assert data shape, not
auth: `apps/api/src/routes/insights.test.ts`.)

## S-08 Risks found

1. **Public third-party data (the S-07 list)** — the main risk; fixed by the
   Phase 3 gate (AC-02: 401/403 with no data).
2. **Unofficial/unclear-licence sources in use** — Yahoo Finance (E-01),
   gold-api.com (E-02): allowed private-only once the gate exists; blocked
   from any future public mode by T-15.
3. **CI branch filter is broken**: `.github/workflows/ci.yml:17` reads
   `branches: ain]` (a stray edit — should be `[main]`), so pushes to `main`
   do not trigger the CI workflow (PRs still do, via the bare
   `pull_request:` trigger). Recorded for the owner; fixing it is outside
   "no design changes / nothing not in the specs", so it is only recorded
   here and in OWNER_SETUP.
4. **No committed secrets found**: a working-tree scan for the owner's token
   prefixes (`cfut_…`, `ghp_…`, the EODHD key) returned no matches in
   tracked files; secrets live in Cloudflare/GitHub secret stores
   (`wrangler secret put`, Actions secrets). Phase 7 re-checks the built
   client bundle.
5. **Stale-as-current surfaces the defects file documents** (E-04 copper,
   E-06 AU yields, E-09 past calendar event) — fail-closed fixes land in
   Phase 2.

## Done-when check

The report exists; every claim cites a file/line or a command output; no
code was changed in this phase (only the `git mv` documented at the top).
