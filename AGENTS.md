# AGENTS.md — Currena

Operating manual for humans and AI agents working in this repo. Read before touching anything.

## What this is

Currena is a currency converter focused on Iranian open-market rates (Toman) plus
international pairs. It is a parallel rebuild of a production Django app that stays
live at https://aliassadi1993.pythonanywhere.com/ until an explicit human cutover.

- **apps/api** — Hono on Cloudflare Workers. Serves `/api/*`, the zero-JS
  `/admin` ops console (Phase 6: per-source status + manual refresh via
  REFRESH_SECRET; noindexed), AND the built SPA via Workers static assets
  (SPA fallback). One deploy, no CORS. `run_worker_first` pins `/admin*`,
  `/api/*`, `/internal/*` to the Worker (navigation requests to non-asset
  paths would otherwise be served the SPA shell by the platform).
  Structure since the 2026-10-15 QA split: `src/index.ts` is the
  composition root only; the routes live in `src/routes/`
  (rates/ops/admin/internal/insights), shared HTTP plumbing in
  `src/http.ts`, the rate limiter + secret compare in `src/security.ts`,
  the default service + snapshot memo in `src/default-service.ts`, and
  the ever-green cron body in `src/cron.ts`.
- **apps/markets** — the markets worker (currena-markets): source scrapers'
  twin of the fx engine + the daily snapshot crons `30 23 * * 1-5` +
  `30 1 * * 2-6` UTC (main + retry) writing `insights:markets:v1` /
  `insights:fx:v1` into the shared RATES KV; carries the EODHD stock
  ingestion. Scheduled-only surface — a page request can never reach a
  provider.
- **apps/web** — Vite + React + TS + Tailwind PWA (standalone SPA, never
  server-rendered; will be wrapped in Capacitor later).
- **packages/core** — zod schemas, conversion math, formatting. Pure. Tested.
- **packages/scraper** — source modules + normalizers. Tested against fixtures.
- **docs/** — `DEPLOY.md` (the deploy runbook), `INDICATORS_AND_DATA_SOURCES.md`
  (the consolidated reference), `THIRD_PARTY_NOTICES.md`, `README.md`.
- **docs/insights/** — the Insights doc set (AGENT_RUNBOOK, RULES, RISK_REGISTER,
  LICENCES, SCRAPING_SPEC, UI_SPEC, MAINTENANCE, OWNER_SETUP, GLOSSARY,
  BACKTEST, SELF_AUDIT, the numbered specs 01–09, + the round reports R9/R10).
  `docs/insights/layer1/` is the Layer-1 (plain-language copy) doc set;
  `docs/insights/layer2/` is the Layer-2 prep set (the prep spec, DECISIONS
  D-20+, AU-DATA-OPTIONS, NARRATION-STATE — the narrator's contracts).
- **docs/specs/** — the governing feature specs (world currencies, world markets,
  the world-markets map spec) + `traceability.md` (the requirement → code → test map).
- **docs/localization/** — Persian copy workflow, terminology, and the manifest.
- **legacy/** — (gitignored) Django backup — the ONLY source of truth for features.
- **legacy-captures/** — (gitignored) raw captures from the live site (Phase 1 evidence).

## Commands

Package manager is **pnpm** (Node ≥ 20).

    pnpm install
    pnpm gates                                   # ALL gates in one command (typecheck, lint,
                                                 # copy:audit, narrator-vocabulary drift, the strict
                                                 # Layer-1 validator, full suite, build + budget) —
                                                 # run this before deploying; CI is red (owner-side)
    pnpm -r typecheck
    pnpm lint                                     # eslint (flat config; 0 errors in CI)
    pnpm -r test                                  # vitest — never hits live sites
    pnpm --parallel dev                           # api: wrangler dev (:8787) · web: vite (:5173)
    pnpm --filter @currena/web build              # SPA dist → served by the Worker
    pnpm --filter @currena/api deploy             # wrangler deploy (needs CLOUDFLARE_API_TOKEN)

## Non-negotiable engineering rules

1. **TypeScript strict everywhere.**
2. **Provider portability**: business logic imports NOTHING platform-specific.
   Web-standard APIs only (`fetch`, `Request/Response`, `URL`, `crypto`) outside
   `apps/api/src/adapters/`. All KV/storage access goes through the `RateStore`
   interface so a KV→D1 migration is a swap.
3. **Contracts live in `packages/core/src/schemas.ts`** as zod schemas
   (Rate, Snapshot, RatesResponse, RatesError, SourceConfig). Import, never
   redefine. Everything crossing a trust boundary — including scraper output —
   is zod-validated; an upstream layout change must fail loudly, never render garbage.
4. **SPA-only frontend.** All data via the JSON API. Hono RPC types (`hc<AppType>`)
   give the web app an end-to-end typed client.
5. **RTL/LTR is native from day one**: `dir` on `<html>` from locale; CSS logical
   properties only (`ms-/me-/ps-/pe-`, never `ml-/mr-`); every UI string through
   the i18n dictionary (`apps/web/src/i18n/`); numbers formatted only at render
   via `Intl.NumberFormat('fa-IR' | 'en-US')`. Internal numbers are canonical —
   never store formatted/display digits. Currency display names use the
   **international common name** (ISO 4217 / CLDR en — e.g. "UAE Dirham"; Gate 1
   decision 2026-09-16); the fa locale renders proper Persian names from the
   i18n dictionary.
   **Persian copy is audit-gated**: every user-facing fa string (both
   dictionaries, calendar `titleFa`, hardcoded literals incl. the `format.ts`
   time-ago mirrors) is fingerprinted in
   `docs/localization/persian-copy-manifest.json`. Adding or changing one makes
   `pnpm copy:audit` (CI gate) fail until the wording is reviewed and recorded —
   see `docs/localization/persian-copy-workflow.md`; terminology lives in
   `docs/localization/persian-terminology.md`. No em dashes in fa copy.
6. **Canonical unit for Iranian rates: TOMAN.**
   The legacy app used the ISO code `IRR`, but every value it served (and every
   TGJU profile behind it: `price_dollar_rl`, `price_eur`, …) is denominated in
   **Toman**. Evidence from the live API (2026-09-16): `1 USD = 230,500 "IRR"`
   — that is 230,500 Toman (TGJU open-market quote), labeled "Iranian Toman" in
   the UI and "live Iranian Toman rates" in the PWA manifest.
   Canonical form in this repo: `code: 'IRR'` + `unit: 'TOMAN'` (see the Snapshot
   schema). Any Rial↔Toman conversion happens ONLY inside the scraper normalizer —
   unit conversion must never leak into UI code.
   *(Extracted from the live site in Phase 1 — re-verify against `legacy/` when
   the Django backup is provided.)*
7. **Tests never hit live sites.** Scrapers are tested against HTML fixtures in
   `packages/scraper/fixtures/`.
8. **Routing rule (fallback ladder)**: pairs where either side is IRR/Toman →
   TGJU (live scrape → cached + stale banner → 503). International-only pairs →
   Frankfurter (`https://api.frankfurter.dev`) with the same ladder. **Never**
   fall IRR pairs back to the free API (interbank IRR ≠ open-market Toman);
   never mix sources within one conversion. *(Gate 2 decision 2026-09-16:
   Path A — the Worker scrapes TGJU directly. Path B, a GitHub Actions relay
   writing snapshots into KV, is the documented additive fallback to adopt only
   if TGJU ever blocks Workers egress in production — it is not built.)*
9. **Secrets**: runtime secrets via `wrangler secret put` / `.dev.vars`
   (gitignored). `credentials.md` is read-once and never echoed, logged, or committed.
10. **Commits**: `phase(N): summary` after each phase; the consolidated
    indicators + data-sources reference lives in
    `docs/INDICATORS_AND_DATA_SOURCES.md` (regenerated by hand on each
    round). Historical planning docs were removed in the 2026-10-28
    tidy-up — git history is the ultimate backup.

## The Insights data inventory (ACTIVELY MAINTAINED — read this before adding/removing/changing any indicator)

**This section is the canonical on-disk record of every indicator and every
data point the Insights page shows.** It is sourced from
`packages/insights/src/definitions.ts` (the 100 indicators), `packages/
insights/src/markets/definitions.ts` (the 16 market indices), and
`packages/insights/src/fx/definitions.ts` (the 10 FX pairs + the dollar
basket + the 7 FX patterns). `data/indicators.json` is the generated
registry (run `pnpm registry:generate` to refresh it after any change).

**Maintenance rule (NON-NEGOTIABLE):** when an indicator is added,
removed, renamed, or its rule/cadence/maxAge/source changes, you MUST:

1. Edit `packages/insights/src/definitions.ts` (or the markets/fx
   definitions) — the source of truth.
2. Run `pnpm registry:generate` to refresh `data/indicators.json` +
   `data/indicator-audit.json` + `data/site-mode-overrides.json`.
3. Update this inventory section to match (add/remove/relabel the row).
4. Update `docs/INDICATORS_AND_DATA_SOURCES.md` §1 (the indicator
   inventory table) + §2 (the data-sources table) to match.
5. Run `pnpm -r test` — the pin tests in `definitions.test.ts` catch
   stale entries.
6. Record the change in `CHANGELOG.md` under the round entry.

A pull request that changes an indicator without updating this section is
incomplete and will be rejected at review.

### A. The 102 indicators (48 voting [V] + 54 context [C])

Every indicator below renders as a card on `#/insights`. `[V]` = scored
(contributes to its gauge's verdict); `[C]` = context (value + 10-year
position bar, never votes). `maxAge` = staleAfterDays (days before the
"stale" tag fires; `—` = per-change/manual, never stale by age).

#### GLOBAL (79 indicators, 32 voting)

**Borrowing costs** (`borrowing-costs` gauge):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `yield-curve-10y2y` | daily | 4 | threshold | fred |
| [V] | `yield-curve-10y3m` | daily | 4 | any-of | fred |
| [V] | `us10y` | daily | 4 | any-of | fred |
| [V] | `us30y` | daily | 4 | any-of | fred |
| [V] | `real-yield-10y` | daily | 4 | percentile | fred |
| [V] | `fed-target` | daily | 5 | percentile | fred |
| [V] | `ecb-dfr` | daily | 7 | percentile | ecb |
| [V] | `fed-expectations` | daily | 4 | percentile | derived |
| [V] | `govt-interest-revenue` | quarterly | 215 | percentile | derived |
| [C] | `us-2y` | daily | 4 | info | fred |
| [C] | `sofr` | daily | 4 | info | fred |
| [C] | `mortgage-30y` | weekly | 14 | info | fred |
| [C] | `jgb-10y` | daily | 4 | info | mof |
| [C] | `bund-10y` | monthly | 75 | info | fred |
| [C] | `gilt-10y` | monthly | 75 | info | fred |
| [C] | `euro-aaa-10y` | daily | 7 | info | ecb |
| [C] | `boe-rate` | per-change | — | info | boe |
| [C] | `boj-rate` | monthly | 75 | info | fred |

**Dollar strength** (`dollar-strength` gauge — rendered inside the World
currencies container per R9-04):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `dollar-basket` | daily | 4 | any-of | derived |
| [V] | `usdjpy` | daily | 4 | change | frankfurter |
| [V] | `us-japan-10y-gap` | daily | 5 | any-of | derived |
| [C] | `eur-usd` | daily | 4 | info | frankfurter |
| [C] | `usdtry` | daily | 4 | info | frankfurter |
| [C] | `usdaed` | daily | 4 | info | yahoo |

**Growth health** (`growth-health` gauge):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `us-unemployment` | monthly | 75 | percentile | fred |
| [V] | `sahm-rule` | monthly | 75 | threshold | fred |
| [V] | `china-pmi` | monthly | 45 | threshold | nbs |
| [V] | `china-cpi` | monthly | 45 | threshold | nbs |
| [V] | `copper-gold` | monthly | 60 | percentile | derived |
| [V] | `michigan-sentiment` | monthly | 75 | percentile | fred |
| [V] | `initial-jobless-claims` | weekly | 12 | percentile | fred |
| [V] | `philly-fed` | monthly | 60 | threshold | fred |
| [V] | `recession-probability` | monthly | 100 | threshold | fred |
| [V] | `oecd-cli-us` | monthly | 75 | any-of | oecd |
| [C] | `m2-us` | monthly | 90 | info | fred |
| [C] | `retail-sales` | monthly | 75 | info | fred |
| [C] | `housing-permits` | monthly | 75 | info | fred |
| [C] | `job-openings` | monthly | 110 | info | fred |
| [C] | `us-gdp-growth` | quarterly | 215 | info | fred |
| [C] | `us-nfp` | monthly | 70 | info | derived |
| [C] | `usdcny` | daily | 4 | info | frankfurter |
| [C] | `michigan-1y-expectations` | monthly | 75 | info | fred |
| [C] | `cfnai` | monthly | 95 | info | fred |
| [C] | `oecd-cli-cn` | monthly | 75 | info | oecd |
| [C] | `oecd-cli-de` | monthly | 75 | info | oecd |
| [C] | `epu-us` | monthly | 75 | info | epu |
| [C] | `copper-usd` | daily | 2 | info | gold-api |

**Market stress** (`market-stress` gauge):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `stress-stlfsi` | weekly | 14 | threshold | fred |
| [V] | `nfci` | weekly | 14 | threshold | fred |
| [V] | `vix` | daily | 4 | percentile | fred |
| [V] | `gold-silver` | daily | 2 | percentile | derived |
| [V] | `cftc-gold-positioning` | weekly | 12 | any-of | cftc |
| [C] | `walcl` | weekly | 21 | info | fred |
| [C] | `crypto-fng` | daily | 4 | info | alternative-me |
| [C] | `shiller-cape` | monthly | 45 | info | shiller |
| [C] | `shiller-ecy` | monthly | 45 | info | shiller |
| [C] | `gpr-index` | monthly | 75 | info | gpr |

**Prices board** (the `prices-board` strip — rendered as tiles above the
markets table):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `brent` | daily | 12 | change | fred |
| [C] | `gold-usd` | daily | 2 | info | gold-api |
| [C] | `silver-usd` | daily | 2 | info | gold-api |
| [C] | `btc-usd` | daily | 2 | info | gold-api |
| [C] | `gold-btc` | daily | 4 | info | derived |

*Gold Program (2026-10-31, S1+S2+S2.1+S3 — docs/insights/GOLD_SCORE_SPEC.md +
docs/insights/GOLD_FRED_GAPFILL_SPEC.md): two derived panels render in the
SIGNALS card, directly under the gold balance visual («برآیند عوامل مؤثر بر
قیمت طلا» — the owner's 2026-10-31 placement directive; they sat on this
strip for one day in S2) — the **gold tailwind score** (the macro voters
re-cut for gold direction: net score, 5-step label, lane counts, the four
lane readings, the firing drivers) and **model vs reality** (the score's
direction vs gold's actual 30-day move). No new indicator ids, no new
votes, no new fetches: the panels read the existing scored voters through
the pure engine at `packages/insights/src/gold-score.ts`; the ingest stamps
the compact `goldSummary` (optional snapshot field) beside the section
summaries, and the SPA re-derives the voter list client-side. BILINGUAL
since S2.1: the copy lives in the web dictionaries (`signals.goldScore` /
`signals.goldModelVsReality`, EN + fa — Persian-copy round-53), and this
prices strip is the four price tiles again. S3 (2026-10-31, the FRED
gap-fillers) added: the FRED trio SPLIT (DGS10/DGS30 keep the no-cosd full
request for highest-since; DFII10 rides its own cosd=2003-01-02 request —
the no-cosd answer lagged at rung time on 10 of 10 archived days), the
bounded DGS10−T10YIE cross-fill for the real-yield SCORING INPUT only
(counted in the ingest report; the stored history stays pure DFII10 —
D-6), and the `breakeven-tilt` context card (T5YIFR−T5YIE, zero new
fetches) whose lean phrase rides the gold panel's inflation lane
(«انتظارات در حال شدت‌گیری/فروکش» — round-54; D-5 keeps it OUT of the
voter table). NEXT: Session 4, the backtest harness — the contract is
`docs/insights/GOLD_BACKTEST_SPEC.md` (reads the frozen 20-voter table
over the stored histories + the daily archive corpus; evaluates D-5).*

**Prices heat** (`prices-heat` gauge):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `us-cpi-yoy` | monthly | 75 | threshold | fred |
| [V] | `us-pce-core-yoy` | monthly | 95 | threshold | fred |
| [V] | `euro-hicp` | monthly | 60 | threshold | ecb |
| [V] | `breakeven-5y5y` | daily | 4 | threshold | fred |
| [C] | `us-cpi-core-yoy` | monthly | 75 | info | fred |
| [C] | `us-wages` | monthly | 75 | info | fred |
| [C] | `breakeven-10y` | daily | 4 | info | fred |
| [C] | `t5yie` | daily | 5 | info | fred |
| [C] | `breakeven-tilt` | daily | 5 | info | derived |
| [C] | `wti` | daily | 12 | info | fred |
| [C] | `natgas` | daily | 12 | info | fred |
| [C] | `eia-crude-stocks` | weekly | 12 | info | eia |
| [C] | `platinum` | daily | 2 | info | gold-api |
| [C] | `gold-oil-ratio` | daily | 3 | info | derived |
| [C] | `food-index` | monthly | 60 | info | world-bank |
| [C] | `wheat` | monthly | 60 | info | world-bank |
| [C] | `maize` | monthly | 60 | info | world-bank |

#### AUSTRALIA (23 indicators, 16 voting)

**Inflation and rates** (`au-inflation-rates` gauge):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `au-cpi` | monthly | 95 | threshold | abs |
| [V] | `au-trimmed-mean` | monthly | 95 | threshold | abs |
| [V] | `au-10y` | daily | 40 | percentile | rba |
| [V] | `rba-expectations` | daily | 40 | percentile | derived |
| [V] | `au-us-10y-gap` | daily | 40 | threshold | derived |
| [C] | `au-petrol-yoy` | monthly | 95 | info | abs |

**Households** (`au-households` gauge):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `au-unemployment` | monthly | 60 | above-low | abs |
| [V] | `au-wage-growth` | quarterly | 230 | below-aux | abs |
| [V] | `au-rent-yoy` | monthly | 95 | percentile | abs |
| [V] | `au-home-loan` | monthly | 70 | percentile | rba |
| [V] | `au-home-values` | quarterly | 225 | consecutive-decline | abs |
| [V] | `au-household-debt-arrears` | quarterly | 190 | percentile | rba |
| [V] | `au-housing-finance` | quarterly | 230 | percentile | abs |
| [C] | `au-deposit-rate` | monthly | 70 | info | rba |
| [C] | `rba-cash-rate` | per-change | — | info | rba |
| [C] | `au-job-vacancies` | quarterly | 240 | info | abs |
| [C] | `au-saving-ratio` | quarterly | 250 | info | abs |

**Trade and currency** (`au-trade-currency` gauge):
| | id | cadence | maxAge | rule | source |
|---|---|---|---|---|---|
| [V] | `audusd` | daily | 4 | percentile | derived |
| [V] | `audjpy` | daily | 4 | change | derived |
| [V] | `terms-of-trade` | quarterly | 215 | consecutive-decline | abs |
| [V] | `rba-fed-gap` | per-change | — | any-of | derived |
| [C] | `gold-aud` | daily | 4 | info | derived |
| [C] | `iron-ore` | monthly | 60 | info | world-bank |

### B. The markets board (16 world stock indices)

Sourced from `packages/insights/src/markets/definitions.ts` (`MARKETS`).
Each index renders as a tile + a row in the markets table. Provider:
EODHD (owner's personal plan) primary, Yahoo Finance fallback.

| id | group | exchange | EODHD code | Yahoo symbol |
|---|---|---|---|---|
| `n225` | asia | Tokyo | N225.INDX | ^N225 |
| `asx200` | asia | Sydney | AXJO.INDX | ^AXJO |
| `kospi` | asia | Seoul | KS11.INDX | ^KS11 |
| `hsi` | asia | Hong Kong | HSI.INDX | ^HSI |
| `ssec` | asia | Shanghai | SSEC.INDX | 000001.SS |
| `taiex` | asia | Taipei | TWII.INDX | ^TWII |
| `nifty50` | asia | Mumbai | NSEI.INDX | ^NSEI |
| `stoxx50` | europe | Euronext | STOXX50E.INDX | ^STOXX50E |
| `dax` | europe | Xetra | GDAXI.INDX | ^GDAXI |
| `cac` | europe | Paris | FCHI.INDX | ^FCHI |
| `ftse` | europe | London | (null — no free-key code) | ^FTSE |
| `sp500` | americas | NYSE | GSPC.INDX | ^GSPC |
| `ndx` | americas | NASDAQ | NDX.INDX | ^NDX |
| `dow` | americas | NYSE | DJI.INDX | ^DJI |
| `tsx` | americas | Toronto | GSPTSE.INDX | ^GSPTSE |
| `ibov` | americas | São Paulo | BVSP.INDX | ^BVSP |

### C. The FX board (10 pairs + the dollar basket + 7 patterns)

Sourced from `packages/insights/src/fx/definitions.ts`. The FX board is
licence-hidden in public mode (no owner directive to show it); the
dollar-basket card + the six dollar-strength cards render inside the
World currencies container regardless (they ride the insights snapshot,
not the fx feed).

**FX pairs** (`FX_PAIRS`):
| id | group | derivation |
|---|---|---|
| `eurusd` | dollarWorld | inverse |
| `usdjpy` | dollarWorld | direct |
| `gbpusd` | dollarWorld | inverse |
| `usdchf` | dollarWorld | direct |
| `usdcny` | dollarWorld | direct |
| `audusd` | dollarWorld | inverse |
| `audjpy` | warningLights | cross |
| `eurjpy` | warningLights | cross |
| `eurchf` | warningLights | cross |
| `audcny` | chinaLink | cross |

**The dollar basket** (`dollar-basket` indicator above): a Currena-
computed DXY-style weighted basket of 7 currencies (EUR, JPY, GBP, CAD,
SEK, CHF, AUD weights — see `packages/insights/src/basket.ts`). Renders
as a voting card in the dollar-strength group.

**FX patterns** (`FX_RULES` — the "How things connect" relationship
cards):
| id | chart series | expect | pattern check |
|---|---|---|---|
| `r1_risk_mood` | audjpy, sp500 | together | yes |
| `r2_carry_trade` | usdjpy, n225 | together | yes |
| `r3_dollar_strength` | dollar, gold | opposite | yes |
| `r4_money_hiding` | sp500, dollar, gold | opposite | no |
| `r5_china_link` | audusd, usdcny | opposite | yes |
| `r6_europe_worry` | eurchf, stoxx50 | together | yes |
| `r7_dollar_or_euro` | eurusd, dollar | opposite | no |

### D. The global companies table (PRE-BUILT, flag OFF — not yet live)

R10-3 (2026-10-28) pre-built a table of ~50 world-leading companies
below the markets tiles. The feature flag
`COMPANIES_TABLE_ENABLED = false` in
`apps/web/src/components/insights/config/companies.ts` keeps the UI on
the empty-state panel; no cron rung is wired; zero live calls fire.
The typed ticker list lives in
`packages/insights/src/companies/definitions.ts` (`COMPANIES` — 50
entries: AAPL.US, AMZN.US, …, PETR4.SA). When the owner upgrades the
EODHD plan, the flip is a one-line change (see
`docs/insights/ROUND10_REPORT.md` R10-3 for the procedure).

### E. The calendar (Next Up — a separate feed, not indicators)

`data/insights-calendar.json` carries the upcoming economic release
calendar (central bank decisions, CPI prints, etc.). It is a separate
feed — NOT an indicator — and renders as the "Next up" strip. Adding a
calendar event does NOT touch the indicator inventory above.

### F. The live prices refresh (the `:13` hourly rung)

The `insights:prices-live:v1` KV key carries the live-priced rows
(gold-usd, silver-usd, copper-usd, btc-usd, gold-silver, platinum) —
refreshed hourly by the currena-api's own `:13` cron rung. These are
the SAME indicators listed in §A above (the prices-board + market-
stress groups); the hourly refresh keeps their `asOf` current between
the daily ingest rungs.

## Phase discipline

This migration runs phase-by-phase with hard gates (✋). Do not start work
past a gate without explicit human approval. The current status lives in
the CHANGELOG (latest entry first); the consolidated indicators + data-
sources reference is `docs/INDICATORS_AND_DATA_SOURCES.md`.
