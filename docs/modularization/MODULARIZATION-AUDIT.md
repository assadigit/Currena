# MODULARIZATION-AUDIT.md — the Phase 0 audit + the plan (M0)

**Session:** M0 (the audit + the plan — NO code moves) · **Date:** 2026-11-14 · **Base commit:** `529a3b4` (prompt-verified state at `b03d01d`, unchanged since — only the prompt doc was added) · **Prompt:** `MODULARIZATION-PROMPT.md` (repo root)

**Method.** A full static import-graph of all 640 `.ts`/`.tsx` files across the six audited trees (2,572 resolved import edges, relative + `@currena/*` specifiers), cross-checked by hand against dynamic `import()`/`lazy()` edges (7 files are alive despite 0 static importers), every adapter opened and mapped to the indicator ids it serves, and every placement decision verified against `packages/insights/src/page-division/placement.ts` (the engine-pages contract, 13/13 green). Build/test/config scripts were read line-by-line for hardcoded source paths (the path-risk register in §D5 of the audit notes / risk table below).

**Verified baseline (matches the prompt):** 187 registry ids, 187 placed, 0 unplaced, 0 duplicate homes; 10 destination pages (`/` 0 cards + 52 mirrors, `/gold` 14+4 blocked, `/world-markets` 9, `/usa` 72, `/europe` 8, `/asia-pacific` 14, `/australia` 28, `/commodities` 24, `/currencies` 14, `/economic-linkages` 0 cards + 10 connection cards); `/insights` zero-card-capable; 15,023 tests (web 13,226 + insights 1,383 + api 414).

## Executive summary

1. **The scatter is real and measured.** A `/gold` developer today reads across 4 folders and ~15 files: `components/insights/Signals.tsx` + `signals/*`, `routes/page-division/Gold*` (7 files) + `gold-tiles/backtest/copy-pin/frozen`, `packages/insights/src/gold-*.ts` (5 modules) + `adapters/{cftc,sge,sge-monthly,bazg,gold-equities}.ts`, plus the config barrel and the copy corpus. The same holds for every domain.
2. **The engine boundary is already clean one-way.** Zero `packages/*` → `apps/web` imports. The web tree imports the engine via the 15-entry exports map (`@currena/insights` root barrel: 57 importers; `/page-division`: 41; `/markets/definitions`: 34; …). This makes the engine restructure safe as long as the **exports-map entry names stay stable** — movers only update the target paths inside `packages/insights/package.json`.
3. **The legacy `/insights` page is a super-consumer** of every domain's drawings (Signals, TicSection, AustralianMarkets, MoneyPanel, WorldCurrencies, WorldMarkets, PricesBoard, Together…). The plan keeps the established pattern: **domain owns the code, legacy borrows it** — so §19.6 retirement remains a one-folder delete plus edge cleanup, and every domain file keeps working before that day.
4. **Four audit findings change the prompt's skeleton** (all documented with evidence in §D3.1; owner decides): (a) `gold-score.ts` stays in the engine **shared** folder — constraint 5 explicitly overrides the skeleton's `domains/gold/` listing (37 voters span 5 domains); (b) `prices/` is engine-**shared**, not commodities (it serves the gold hero overlay, the commodities live cards AND the global ribbon); (c) `PricesBoard.tsx` goes to web **shared**, not global (its importers are CommoditiesTierCards + legacy; GlobalPage never imports it); (d) the flat card system (AlertCard/CompactRow/CardMeta/PositionBar/DetailsPanel/…) is **legacy-only** and moves to `features/insights-legacy/` so retirement deletes it — the prompt skeleton listed it as shared.
5. **Three dead/dangling files** found (owner decisions requested, none blocking): `MovesNextStrip.tsx` (0 refs), `UsGlobalReachGroup.tsx` (0 refs), `config/us-global-reach.ts` (dangling — only consumer is the dead group). Recommend a tiny pre-phase delete commit (or move them to `insights-legacy/` as-is if the owner prefers zero deletions).
6. **The migration risk is concentrated in path-referencing machinery**, not in the code itself: the 15-entry insights exports map, `scripts/gates.mjs` (layer1 path), the Persian-copy SOURCES + SWEEP_ROOTS + the 7,996-entry path-keyed manifest, the narrator-vocabulary generator (imports web i18n), the daily GHA workflows that read `apps/web/src/i18n/*` + `components/insights/{full-export,config/display}`, 22 depth-sensitive `../`-counted imports of root `data/*.json`, the `apps/web/scripts/pd-*` backtest scripts (11 files), `build-world-map.mjs` (writes into src), and the eslint/tsconfig `src`-glob scopes. All enumerated per phase in the plan.

---

## Deliverable 1 — the file inventory

Every `.ts`/`.tsx` file in the four audited trees (plus `packages/scraper` and `apps/markets`, verified below), classified with target folder, one-line reason, and compressed primary importers (the shared-vs-domain driver). Importer lists compress tests as `(+N tests)`; `lazy()`-loaded files are marked (the static graph shows 0 for them).

### Summary counts (by target)

| Target | Files | Target | Files |
|---|---|---|---|
| features/insights-legacy | 50 | features/global | 16 |
| features/world-markets | 31 | features/usa | 15 |
| features/gold | 22 | features/australia | 14 |
| features/currencies | 20 | features/asia-pacific | 9 |
| features/commodities | 8 | features/europe | 8 |
| features/economic-linkages | 5 | **web shared/** | 81 |
| **web features-tools/** | 49 | infrastructure | 16 |
| src root (no move) | 2 | **engine domains/** | 80 |
| **engine shared/** | 75 | engine stays (page-division 7 + narrator 23 + barrel 1) | 31 |
| no move (api 52 + core 23 + scraper 11 + markets 4) | 90 | **TOTAL** | **640** |

### Verification verdicts for the non-moving trees

- **`apps/api/src` (52 files) — LEAVE ALONE.** Already route-split (`routes/{ops,rates,admin,internal,insights,insights-pages,insights-narrative}`), DI-composed (`createApp(deps)`), storage behind ports (`adapters/{kv-store,insights-store,access-mode-store}`). A "Phase 3 split of the former index.ts monolith" was already done historically (file headers). Its only migration exposure: 11 insights-subpath imports (all via the exports map — never deep `src/` paths) and two depth-sensitive root-`data/` JSON imports (`audit-sidecar.ts:22`, `public-mode.ts:16`).
- **`packages/core/src` (23 files) — LEAVE ALONE.** 13 cohesive modules behind one barrel (380 importers). `calc/batch/settle/split` are the money-tool cores; `schemas.ts` is the de-facto insights contract layer (`IndicatorId`, `PageDivisionPageId`, all board snapshot schemas) mixed with the converter contracts — a split would be high-churn and invisible to importers only if the barrel re-exports; NOT in this program's scope.
- **`packages/scraper/src` (11 files) — LEAVE ALONE.** TGJU + Frankfurter scrapers + the `RateStore` port; consumed only by `apps/api`.
- **`apps/markets/src` (4 files) — LEAVE ALONE.** The scheduled-only cron Worker that runs the engine's `markets/fx/markets-au` updates (4 cron expressions; KV-write/subrequest budgets gated). Imports the engine via 3 exports-map subpaths.


### Web app (Vite SPA) — 346 files

| File | Proposed target | Reason | Primary importers (compressed) |
|---|---|---|---|
| `App.tsx` | infrastructure | App shell — route mounting, providers, boot effects | main.tsx |
| `components/AlertsDialog.tsx` | features-tools/converter | Rate-alerts dialog — lazy-loaded by Converter only | `lazy()`-loaded — alive (static graph shows 0) |
| `components/AmountInput.tsx` | features-tools/converter | Converter amount input (Converter/ConvertForm/AlertsDialog) | components/AlertsDialog.tsx, routes/Converter.tsx, routes/converter/ConvertForm.tsx |
| `components/CurrencySelect.tsx` | shared/components | Money-tool shared select — 6 tool surfaces (converter/batch/calculator/receipt/splitter/alerts) | components/AlertsDialog.tsx, routes/BatchConverter.tsx, routes/Calculator.tsx, routes/Receipt.tsx +2 more |
| `components/ErrorBoundary.tsx` | infrastructure | App-level error boundary (App.tsx) | App.tsx |
| `components/Footer.tsx` | infrastructure | App footer (App + About) | App.tsx, routes/About.tsx |
| `components/Header.tsx` | infrastructure | App header (App) | App.tsx |
| `components/InstallButton.tsx` | infrastructure | PWA install button (Header) | components/Header.tsx |
| `components/LedGoldBoard.tsx` | features-tools/live-rates | LED gold board — the live-rates surface (Converter reuses) | routes/Converter.tsx, routes/LiveRates.tsx |
| `components/LedRateBoard.tsx` | features-tools/live-rates | LED rate board — the live-rates surface (Converter reuses) | routes/Converter.tsx, routes/LiveRates.tsx |
| `components/LiveRateLine.tsx` | features-tools/converter | Live rate line — ConvertForm only | routes/converter/ConvertForm.tsx |
| `components/Modal.tsx` | infrastructure | Generic modal overlay (current sole consumer: WorldMarketsBriefing) | routes/page-division/WorldMarketsBriefing.tsx |
| `components/Odometer.tsx` | features-tools/converter | Digit odometer — ResultPopup only | components/ResultPopup.tsx |
| `components/PageBreadcrumbs.test.tsx` | infrastructure | Breadcrumbs test (co-located) | — (none static) |
| `components/PageBreadcrumbs.tsx` | infrastructure | Breadcrumbs — all 9 destination pages | routes/page-division/AsiaPage.tsx, routes/page-division/AustraliaPage.tsx, routes/page-division/CommoditiesPage.tsx, routes/page-division/CurrenciesPage.tsx +5 more (+1 tests) |
| `components/RateDeltaChip.tsx` | features-tools/converter | Rate-change chip — converter result + live-rate lines | components/LiveRateLine.tsx, components/ResultPopup.tsx, routes/LiveRates.tsx |
| `components/ResultPopup.tsx` | features-tools/converter | Conversion result popup — Converter only (deviation from prompt skeleton: evidence says converter, not infrastructure) | routes/Converter.tsx |
| `components/Sparkline.test.tsx` | shared/components | Sparkline test (co-located) | — (none static) |
| `components/Sparkline.tsx` | shared/components | Generic sparkline — converter + live-rates surfaces | components/LiveRateLine.tsx, components/ResultPopup.tsx, routes/LiveRates.tsx (+1 tests) |
| `components/icons/FlowChevron.tsx` | infrastructure | Shared chevron icon (HeroBlock, VerdictMeter) | components/insights/HeroBlock.tsx, components/insights/VerdictMeter.tsx |
| `components/icons/currena.tsx` | infrastructure | Brand icon set — 14 consumers across domains | components/insights/AlertCard.tsx, components/insights/CompactRow.tsx, components/insights/DetailsPanel.tsx, components/insights/MoneyPanel.tsx +9 more |
| `components/insights/AboutTheData.tsx` | features/insights-legacy | About-the-data panel — legacy /insights only | routes/Insights.tsx |
| `components/insights/AlertCard.tsx` | features/insights-legacy | Indicator alert card — legacy card system only (DollarStrength/QuestionGroup chains) | components/insights/world-currencies/DollarStrength.tsx, routes/insights-sections/QuestionGroup.tsx, routes/insights-sections/UsGlobalReachGroup.tsx |
| `components/insights/AustralianMarkets.tsx` | features/australia | AU Markets board component — AustraliaPage (+ legacy mirror) | routes/Insights.tsx, routes/insights-sections/world-feeds.ts, routes/page-division/AustraliaPage.tsx, routes/page-division/australia-board-copy.ts |
| `components/insights/CardMeta.tsx` | features/insights-legacy | Card meta row — legacy card system only | components/insights/AlertCard.tsx, components/insights/CompactRow.tsx (+1 tests) |
| `components/insights/CompactRow.tsx` | features/insights-legacy | Compact indicator row — legacy card system only | components/insights/TicCustodyCard.tsx, components/insights/world-currencies/DollarStrength.tsx, routes/insights-sections/QuestionGroup.tsx, routes/insights-sections/SectionLane.tsx +1 more |
| `components/insights/CompaniesTable.tsx` | features/insights-legacy | Feature-flagged (OFF) companies empty-state — legacy page only, no home yet | routes/Insights.tsx |
| `components/insights/ConnectionCard.tsx` | features/economic-linkages | One connection card — Together renders it | components/insights/Together.tsx |
| `components/insights/DataExportMenu.tsx` | features/insights-legacy | Export menu — legacy InsightsHeader | routes/insights-sections/InsightsHeader.tsx |
| `components/insights/DataExportPanel.tsx` | features/insights-legacy | Export panel — lazy from DataExportMenu (legacy) | `lazy()`-loaded — alive (static graph shows 0) |
| `components/insights/DetailsPanel.tsx` | features/insights-legacy | Card details drawer — legacy /insights only | routes/Insights.tsx (+1 tests) |
| `components/insights/HeroBlock.tsx` | features/global | Verdict hero — GlobalPage imports BiggestMoveCard (+ legacy + test) | routes/Insights.tsx, routes/page-division/GlobalPage.tsx (+1 tests) |
| `components/insights/HistoryChart.tsx` | shared/components | History chart — 11 importers across legacy + world-markets + world-currencies | components/insights/AlertCard.tsx, components/insights/CardMeta.tsx, components/insights/CompactRow.tsx, components/insights/DetailsPanel.tsx +7 more |
| `components/insights/InTheNews.tsx` | features/insights-legacy | In-the-news strip — legacy sections only | components/insights/WorldCurrencies.tsx, components/insights/WorldMarkets.tsx, routes/Insights.tsx, routes/insights-sections/SectionLane.tsx |
| `components/insights/JumpNav.tsx` | features/insights-legacy | Section jump nav — legacy /insights only | routes/Insights.tsx |
| `components/insights/MarketsChart.tsx` | features/world-markets | Markets chart — MarketTile + WorldMarketsBriefing | components/insights/world-markets/MarketTile.tsx, routes/page-division/WorldMarketsBriefing.tsx |
| `components/insights/MoneyPanel.tsx` | features/australia | AU money panel — AustraliaPage (+ legacy mirror) | routes/Insights.tsx, routes/page-division/AustraliaPage.tsx |
| `components/insights/MovesNextStrip.tsx` | features/insights-legacy | DEAD CODE — zero importers (audit finding; recommend owner-confirmed delete before the move) | — (none static) |
| `components/insights/NarrativeBlock.tsx` | features/insights-legacy | Narrative block — legacy sections only | components/insights/WorldCurrencies.tsx, components/insights/WorldMarkets.tsx, routes/Insights.tsx, routes/insights-sections/SectionLane.tsx |
| `components/insights/NextUpStrip.tsx` | features/global | Upcoming-events calendar strip — GlobalPage | routes/page-division/GlobalPage.tsx (+1 tests) |
| `components/insights/PositionBar.tsx` | features/insights-legacy | Position bar — legacy card system (AlertCard/CompactRow) | components/insights/AlertCard.tsx, components/insights/CompactRow.tsx |
| `components/insights/PriceDetails.tsx` | shared/components | Price detail parts — shared price cluster (legacy DetailsPanel + commodities PricesBoard) | components/insights/DetailsPanel.tsx, components/insights/PricesBoard.tsx |
| `components/insights/PriceSparkline.tsx` | shared/components | Price sparkline — PricesBoard cluster | components/insights/PricesBoard.tsx |
| `components/insights/PricesBoard.tsx` | shared/components | The prices ribbon board — CommoditiesTierCards + legacy (deviation from prompt skeleton: not imported by GlobalPage) | routes/Insights.tsx, routes/page-division/CommoditiesTierCards.tsx (+2 tests) |
| `components/insights/SectionVerdictLine.tsx` | shared/components | Section verdict line — world-markets MarketsVerdict + legacy WorldCurrencies | components/insights/WorldCurrencies.tsx, components/insights/world-markets/MarketsVerdict.tsx |
| `components/insights/Signals.tsx` | features/gold | The gold+silver verdict strip — GoldPage (+ legacy mirror) | routes/Insights.tsx, routes/page-division/GoldPage.tsx (+1 tests) |
| `components/insights/StatusChip.tsx` | shared/components | Status chip — legacy card system + gold signals/MergedCard | components/insights/AlertCard.tsx, components/insights/CompactRow.tsx, components/insights/signals/MergedCard.tsx |
| `components/insights/TicCustodyCard.tsx` | features/insights-legacy | nyfed-custody card — rendered only by legacy /insights today (usa content; note for §19.6) | routes/Insights.tsx (+1 tests) |
| `components/insights/TicSection.test.tsx` | features/usa | TicSection/TicCustodyCard test (co-located) | — (none static) |
| `components/insights/TicSection.tsx` | features/usa | TIC custody section — UsaTicSection + usa-tic-copy (+ legacy mirror) | routes/Insights.tsx, routes/insights-sections/world-feeds.ts, routes/page-division/UsaTicSection.tsx, routes/page-division/usa-tic-copy.ts (+1 tests) |
| `components/insights/Together.tsx` | features/economic-linkages | The onlyIds-filtered connection-cards strip — AU/USA/EconomicLinkages pages (+ legacy) | routes/Insights.tsx, routes/page-division/AustraliaPage.tsx, routes/page-division/EconomicLinkagesPage.tsx, routes/page-division/UsaPage.tsx |
| `components/insights/ToolsMenu.tsx` | features/insights-legacy | Tools menu — legacy InsightsHeader | routes/insights-sections/InsightsHeader.tsx |
| `components/insights/TopMoversStrip.tsx` | features/global | Top movers strip — GlobalPage (+ legacy mirror) | routes/Insights.tsx, routes/page-division/GlobalPage.tsx |
| `components/insights/TrendChart.tsx` | shared/components | Trend chart — australia MoneyPanel + gold signals/verdict + legacy | components/insights/MoneyPanel.tsx, components/insights/signals/verdict.tsx |
| `components/insights/VerdictMeter.tsx` | shared/components | Verdict meter — global HeroBlock + world-markets MarketsVerdict + AustraliaPage + legacy | components/insights/HeroBlock.tsx, components/insights/world-markets/MarketsVerdict.tsx, routes/insights-sections/world-feeds.ts, routes/page-division/AustraliaPage.tsx |
| `components/insights/WorldCurrencies.tsx` | features/insights-legacy | Legacy currency section — NOT used by the new CurrenciesPage (builds its own PairBoard/RuleLights) | routes/Insights.tsx, routes/insights-sections/InsightsHeader.tsx, routes/insights-sections/world-feeds.ts |
| `components/insights/WorldMarkets.tsx` | features/insights-legacy | Legacy world-markets section — NOT used by the new WorldMarketsPage (uses world-markets/ subfolder) | routes/insights-sections/InsightsHeader.tsx, routes/insights-sections/world-feeds.ts (+2 tests) |
| `components/insights/about-sources.test.ts` | features/insights-legacy | about-sources test (co-located) | — (none static) |
| `components/insights/about-sources.ts` | features/insights-legacy | About-the-data source table — AboutTheData | components/insights/AboutTheData.tsx (+1 tests) |
| `components/insights/au-markets/briefing.ts` | features/australia | AU board briefing copy — AustralianMarkets | components/insights/AustralianMarkets.tsx |
| `components/insights/au-markets/shared.ts` | features/australia | AU board shared helpers — AustralianMarkets + AsiaNzx50Card (documented asia→australia edge) | components/insights/AustralianMarkets.tsx, components/insights/au-markets/briefing.ts, routes/page-division/AsiaNzx50Card.tsx |
| `components/insights/chart-range.test.ts` | shared/components | chart-range test (co-located) | — (none static) |
| `components/insights/chart-range.ts` | shared/components | Chart range helper — HistoryChart | components/insights/HistoryChart.tsx (+1 tests) |
| `components/insights/config/bands-s16.test.ts` | shared/config | bands config test (co-located) | — (none static) |
| `components/insights/config/bands.ts` | shared/config | Verdict band config — hero/money/movers/full-export | components/insights/config/hero.ts, components/insights/config/index.ts, components/insights/config/money.ts, components/insights/config/movers.ts +1 more (+1 tests) |
| `components/insights/config/companies.ts` | features/insights-legacy | Companies feature flag (OFF) — CompaniesTable only | components/insights/CompaniesTable.tsx |
| `components/insights/config/display.ts` | shared/config | Tile display config — every domain tile test + registry-sync pin + registry generator reads it | components/insights/config/bands.ts, components/insights/config/index.ts, components/insights/config/labels.ts, components/insights/config/us-global-reach.ts +1 more (+9 tests) |
| `components/insights/config/hero.ts` | shared/config | Hero config — index barrel | components/insights/config/index.ts |
| `components/insights/config/history-config.ts` | shared/config | History chart config — index barrel | components/insights/config/index.ts |
| `components/insights/config/index.ts` | shared/config | The config barrel — 42 importers across every domain component + tiles tests (barrel stays alive during the move) | components/insights/AboutTheData.tsx, components/insights/AlertCard.tsx, components/insights/CardMeta.tsx, components/insights/CompactRow.tsx +29 more (+9 tests) |
| `components/insights/config/labels.ts` | shared/config | Label config — bands/index/full-export/markets-csv/world-markets shared | components/insights/config/bands.ts, components/insights/config/index.ts, components/insights/full-export.ts, components/insights/markets-csv.ts +1 more |
| `components/insights/config/money.ts` | shared/config | Money panel config — index barrel (money-direction test subject) | components/insights/config/index.ts |
| `components/insights/config/movers.ts` | shared/config | Movers config — hero/index/money/full-export/insights-csv | components/insights/config/hero.ts, components/insights/config/index.ts, components/insights/config/money.ts, components/insights/full-export.ts +1 more |
| `components/insights/config/sections.ts` | shared/config | Section config — bands/hero/index/labels/money/movers/us-global-reach | components/insights/config/bands.ts, components/insights/config/hero.ts, components/insights/config/index.ts, components/insights/config/labels.ts +3 more (+2 tests) |
| `components/insights/config/signals.ts` | shared/config | Signals config — index barrel + full-export | components/insights/config/index.ts, components/insights/full-export.ts |
| `components/insights/config/us-global-reach.test.ts` | features/insights-legacy | us-global-reach test (co-located) | — (none static) |
| `components/insights/config/us-global-reach.ts` | features/insights-legacy | US-global-reach group config — DANGLING (sole consumer UsGlobalReachGroup is dead) | routes/insights-sections/UsGlobalReachGroup.tsx (+1 tests) |
| `components/insights/connection-groups.ts` | features/economic-linkages | The 10 connection-card groups — AU/USA/EconomicLinkages pages | routes/page-division/AustraliaPage.tsx, routes/page-division/EconomicLinkagesPage.tsx, routes/page-division/UsaPage.tsx |
| `components/insights/freshness-line.test.tsx` | features/insights-legacy | CardMeta freshness-line test (co-located with subject) | — (none static) |
| `components/insights/full-export.test.ts` | features/insights-legacy | full-export test (co-located) | — (none static) |
| `components/insights/full-export.ts` | features/insights-legacy | Owner-only full export — legacy export menu (also imported by engine selfcheck script — path update required) | components/insights/DataExportMenu.tsx, components/insights/DataExportPanel.tsx, routes/insights-sections/InsightsHeader.tsx (+1 tests) |
| `components/insights/fx-csv.test.ts` | features/insights-legacy | fx-csv test (co-located) | — (none static) |
| `components/insights/fx-csv.ts` | features/insights-legacy | FX CSV export — lazy from legacy world-feeds |  (+1 tests) |
| `components/insights/hero-editorial.test.tsx` | features/global | HeroBlock editorial test (co-located with subject) | — (none static) |
| `components/insights/ics.test.ts` | features/global | ics test (co-located) | — (none static) |
| `components/insights/ics.ts` | features/global | Calendar .ics export — GlobalPage NextUpStrip | components/insights/NextUpStrip.tsx (+1 tests) |
| `components/insights/insights-csv.test.ts` | features/insights-legacy | insights-csv test (co-located) | — (none static) |
| `components/insights/insights-csv.ts` | features/insights-legacy | Insights CSV export — lazy from legacy InsightsHeader |  (+1 tests) |
| `components/insights/layer1/Layer1Block.tsx` | shared/components | Layer-1 copy block — world-currencies + world-markets components (cross-domain) | components/insights/world-currencies/PairsTable.tsx, components/insights/world-currencies/PatternCard.tsx, components/insights/world-markets/MarketTile.tsx |
| `components/insights/layer1/index.ts` | shared/components | Layer-1 copy accessors — AlertCard/DetailsPanel/Layer1Block (gate target: gates.mjs layer1-strict references its test path) | components/insights/AlertCard.tsx, components/insights/DetailsPanel.tsx, components/insights/layer1/Layer1Block.tsx (+1 tests) |
| `components/insights/layer1/layer1.test.ts` | shared/components | The 7,809-assertion Layer-1 validator — gates.mjs hardcodes this path | — (none static) |
| `components/insights/markets-csv.ts` | features/insights-legacy | Markets CSV export — lazy from legacy world-feeds | `lazy()`-loaded — alive (static graph shows 0) |
| `components/insights/markets-verdict.test.ts` | features/insights-legacy | WorldMarkets.tsx verdict test (subject is the legacy component) | — (none static) |
| `components/insights/money-direction.test.ts` | shared/config | config/money moneyDirectionToneClass test | — (none static) |
| `components/insights/outlook.test.ts` | features/gold | signals/verdict outlook test | — (none static) |
| `components/insights/price-stats.test.ts` | shared/components | price-stats test (co-located) | — (none static) |
| `components/insights/price-stats.ts` | shared/components | Price stats helpers — shared price cluster (PriceDetails/PricesBoard/price-trend) | components/insights/PriceDetails.tsx, components/insights/PricesBoard.tsx, components/insights/price-trend.ts (+2 tests) |
| `components/insights/price-trend.test.ts` | shared/components | price-trend test (co-located) | — (none static) |
| `components/insights/price-trend.ts` | shared/components | Price trend helpers — shared price cluster (note: no PriceTrend.tsx component exists) | components/insights/PriceDetails.tsx, components/insights/PriceSparkline.tsx, components/insights/PricesBoard.tsx (+1 tests) |
| `components/insights/price-value-parts.test.ts` | shared/config | config/index value-parts formatting test | — (none static) |
| `components/insights/prices-cards.test.tsx` | shared/components | PricesBoard/DetailsPanel cards test (co-located with subjects) | — (none static) |
| `components/insights/round2.test.ts` | shared/config | config/index helpers test (heroReason/tierOf/mergeSignals etc.) | — (none static) |
| `components/insights/signals/BalanceScale.tsx` | features/gold | Gold balance scale — GoldPage cluster (GoldBalanceClassic/gold-tiles/gold-backtest) | components/insights/Signals.tsx, components/insights/signals/MergedCard.tsx, routes/page-division/GoldBalanceClassic.tsx, routes/page-division/gold-backtest-core.ts +1 more (+5 tests) |
| `components/insights/signals/BalanceWeight.tsx` | features/gold | Balance weight row — BalanceScale/GoldBalanceClassic | components/insights/signals/BalanceScale.tsx, routes/page-division/GoldBalanceClassic.tsx (+1 tests) |
| `components/insights/signals/MergedCard.tsx` | features/gold | Merged gold+silver card — Signals | components/insights/Signals.tsx (+1 tests) |
| `components/insights/signals/balance.test.tsx` | features/gold | BalanceScale test (co-located) | — (none static) |
| `components/insights/signals/gold-balance-lanes.test.tsx` | features/gold | Gold balance lanes test (Signals/PricesBoard/MergedCard/verdict) | — (none static) |
| `components/insights/signals/icons.tsx` | features/gold | Signal icons — MergedCard | components/insights/signals/MergedCard.tsx |
| `components/insights/signals/outlook-core.ts` | shared/components | Outlook arithmetic — shared by gold signals/verdict AND global tiles/backtest (cross-domain: gold+global) | components/insights/signals/verdict.tsx, routes/page-division/global-backtest-core.ts, routes/page-division/global-tiles.ts, routes/page-division/gold-backtest-core.ts +1 more |
| `components/insights/signals/verdict.tsx` | features/gold | Verdict strip — Signals/MergedCard | components/insights/Signals.tsx, components/insights/signals/MergedCard.tsx (+2 tests) |
| `components/insights/step2.test.ts` | shared/config | config/index helpers test (COMPANIONS/moneyAreaRow etc.) | — (none static) |
| `components/insights/together-signals.test.ts` | features/economic-linkages | Connection-signal phrases test (CONNECTIONS + BalanceScale phrases) | — (none static) |
| `components/insights/useInsightsCopy.ts` | shared/hooks | Insights copy hook — 6 domain pages + legacy | routes/Insights.tsx, routes/page-division/AustraliaPage.tsx, routes/page-division/CommoditiesTierCards.tsx, routes/page-division/EconomicLinkagesPage.tsx +3 more |
| `components/insights/world-currencies/DollarRow.tsx` | features/insights-legacy | Dollar row — legacy WorldCurrencies only | components/insights/WorldCurrencies.tsx |
| `components/insights/world-currencies/DollarStrength.tsx` | features/insights-legacy | Dollar-strength card — legacy WorldCurrencies only (imports routes/insights-sections/QuestionGroup — the one components→routes inversion) | routes/Insights.tsx |
| `components/insights/world-currencies/GlossaryTip.tsx` | shared/components | Glossary tooltip — shared VerdictMeter + legacy world-currencies rows | components/insights/VerdictMeter.tsx, components/insights/world-currencies/DollarRow.tsx, components/insights/world-currencies/PairsTable.tsx, components/insights/world-currencies/ReadingAids.tsx |
| `components/insights/world-currencies/PairsTable.tsx` | features/insights-legacy | Pairs table — legacy WorldCurrencies only | components/insights/WorldCurrencies.tsx |
| `components/insights/world-currencies/PatternCard.tsx` | features/insights-legacy | Pattern card — legacy WorldCurrencies only | components/insights/WorldCurrencies.tsx |
| `components/insights/world-currencies/PatternVisuals.tsx` | features/insights-legacy | Pattern visuals — PatternCard (legacy) | components/insights/world-currencies/PatternCard.tsx |
| `components/insights/world-currencies/QuietArea.tsx` | features/insights-legacy | Quiet-area explainer — legacy WorldCurrencies only | components/insights/WorldCurrencies.tsx |
| `components/insights/world-currencies/ReadingAids.tsx` | features/insights-legacy | Reading aids — legacy WorldCurrencies only | components/insights/WorldCurrencies.tsx |
| `components/insights/world-currencies/display.ts` | features/currencies | Currency display helpers — CurrenciesPairBoard (new page) + legacy WorldCurrencies subtree (domain-owned, legacy borrows) | components/insights/WorldCurrencies.tsx, components/insights/world-currencies/DollarRow.tsx, components/insights/world-currencies/PairsTable.tsx, components/insights/world-currencies/PatternCard.tsx +1 more |
| `components/insights/world-markets/MarketLogo.tsx` | features/world-markets | Index wordmark — MarketMovers/MarketTile/WorldMarketsBriefing | components/insights/world-markets/MarketMovers.tsx, components/insights/world-markets/MarketTile.tsx, routes/page-division/WorldMarketsBriefing.tsx |
| `components/insights/world-markets/MarketMovers.tsx` | features/world-markets | Movers strip — legacy WorldMarkets (domain-owned, legacy borrows) | components/insights/WorldMarkets.tsx |
| `components/insights/world-markets/MarketTile.tsx` | features/world-markets | Index tile — legacy WorldMarkets (domain-owned, legacy borrows) | components/insights/WorldMarkets.tsx |
| `components/insights/world-markets/MarketsHeatmap.tsx` | features/world-markets | Heatmap — legacy WorldMarkets (domain-owned, legacy borrows) | components/insights/WorldMarkets.tsx |
| `components/insights/world-markets/MarketsTable.tsx` | features/world-markets | Index table — legacy WorldMarkets (domain-owned, legacy borrows) | components/insights/WorldMarkets.tsx |
| `components/insights/world-markets/MarketsTreemap.test.ts` | features/world-markets | Treemap test (co-located) | — (none static) |
| `components/insights/world-markets/MarketsTreemap.tsx` | features/world-markets | Treemap — WorldMarketsBriefing | routes/page-division/WorldMarketsBriefing.tsx (+1 tests) |
| `components/insights/world-markets/MarketsVerdict.tsx` | features/world-markets | Markets verdict strip — legacy WorldMarkets (domain-owned, legacy borrows) | components/insights/WorldMarkets.tsx |
| `components/insights/world-markets/WorldMap.tsx` | features/world-markets | The world map — world-markets + RegionIndexSection/WorldMarketsHero (cross-domain: wm+regions) | components/insights/WorldMarkets.tsx, routes/page-division/RegionIndexSection.tsx, routes/page-division/WorldMarketsHero.tsx, routes/page-division/world-map-copy.ts (+1 tests) |
| `components/insights/world-markets/briefing.test.ts` | features/world-markets | briefing test (co-located) | — (none static) |
| `components/insights/world-markets/briefing.test.tsx` | features/world-markets | briefing render test (co-located) | — (none static) |
| `components/insights/world-markets/briefing.ts` | features/world-markets | World-markets briefing copy — MarketMovers/Heatmap/Treemap/Verdict + WorldMarketsBriefing | components/insights/world-markets/MarketMovers.tsx, components/insights/world-markets/MarketsHeatmap.tsx, components/insights/world-markets/MarketsTreemap.tsx, components/insights/world-markets/MarketsVerdict.tsx +1 more (+2 tests) |
| `components/insights/world-markets/session.ts` | features/world-markets | Market session helper — WorldMap/world-map-rows | components/insights/WorldMarkets.tsx, components/insights/world-markets/world-map-rows.ts |
| `components/insights/world-markets/shared.tsx` | features/world-markets | The 22-importer world-markets shared layer — world-markets + GlobalBoard + 4 region pages + legacy (cross-domain hub) | components/insights/AustralianMarkets.tsx, components/insights/NarrativeBlock.tsx, components/insights/WorldMarkets.tsx, components/insights/world-markets/MarketMovers.tsx +17 more (+1 tests) |
| `components/insights/world-markets/verdict-core.ts` | features/world-markets | Markets verdict arithmetic — world-markets + global tiles/backtest (cross-domain: wm+global) | components/insights/world-markets/MarketsVerdict.tsx, routes/page-division/global-backtest-core.ts, routes/page-division/global-tiles.ts, routes/page-division/world-markets-backtest-core.ts +1 more |
| `components/insights/world-markets/world-map-config.ts` | features/world-markets | World map config — world-markets + RegionIndexSection + region zoom (cross-domain: wm+regions) | components/insights/WorldMarkets.tsx, components/insights/world-markets/WorldMap.tsx, components/insights/world-markets/world-map-rows.ts, routes/page-division/RegionIndexSection.tsx +4 more (+3 tests) |
| `components/insights/world-markets/world-map-rows.ts` | features/world-markets | World map rows — WorldMap + region-zoom-backtest-core | components/insights/world-markets/WorldMap.tsx, routes/page-division/region-zoom-backtest-core.ts |
| `components/insights/world-markets/zoom-component.test.tsx` | features/world-markets | WorldMap zoom render test (co-located) | — (none static) |
| `components/insights/world-markets/zoom.test.ts` | features/world-markets | WorldMap zoom test (co-located) | — (none static) |
| `components/led/LedParts.tsx` | features-tools/live-rates | LED digit parts — the LED boards | components/LedGoldBoard.tsx, components/LedRateBoard.tsx |
| `components/ui.tsx` | shared/ui | The UI kit barrel — 32 importers, every surface | App.tsx, components/AlertsDialog.tsx, components/ErrorBoundary.tsx, components/Header.tsx +28 more |
| `components/use-roving-keys.test.tsx` | shared/hooks | Roving-keys test (co-located) | — (none static) |
| `components/use-roving-keys.ts` | shared/hooks | Roving-focus hook — alerts/batch/settle tabs | components/AlertsDialog.tsx, routes/BatchConverter.tsx, routes/settle/GroupTabs.tsx (+1 tests) |
| `components/useDialogFocus.ts` | shared/hooks | Dialog focus hook — header/modals/receipt/settle | components/Header.tsx, components/Modal.tsx, components/ResultPopup.tsx, routes/Receipt.tsx +1 more |
| `globals.d.ts` | src root (no move) | Ambient __APP_VERSION__ decl — stays at src root | — (none static) |
| `i18n/en.ts` | shared/i18n | App i18n dictionaries/hook — every surface (80 importers) | i18n/fa.ts, i18n/index.ts, lib/locale.ts (+10 tests) |
| `i18n/fa.ts` | shared/i18n | App i18n dictionaries/hook — every surface (80 importers) | i18n/index.ts (+10 tests) |
| `i18n/index.ts` | shared/i18n | App i18n dictionaries/hook — every surface (80 importers) | components/insights/AboutTheData.tsx, components/insights/AlertCard.tsx, components/insights/AustralianMarkets.tsx, components/insights/CardMeta.tsx +75 more (+1 tests) |
| `i18n/insights-copy-en.ts` | shared/i18n | The insights copy corpus — read by 40+ components across every domain + the narrator-vocab generator + the Persian-copy gate | components/insights/AboutTheData.tsx, components/insights/AlertCard.tsx, components/insights/CardMeta.tsx, components/insights/CompactRow.tsx +70 more (+40 tests) |
| `i18n/insights-copy-fa.ts` | shared/i18n | The insights copy corpus — read by 40+ components across every domain + the narrator-vocab generator + the Persian-copy gate | components/insights/layer1/index.ts, components/insights/useInsightsCopy.ts (+35 tests) |
| `lib/alerts.test.ts` | shared/lib | alerts test (co-located) | — (none static) |
| `lib/alerts.ts` | shared/lib | Rate-alert store — App + Converter + AlertsDialog + use-alert-evaluation | App.tsx, components/AlertsDialog.tsx, lib/use-alert-evaluation.ts, routes/Converter.tsx (+1 tests) |
| `lib/api.test.ts` | shared/lib | api test (co-located) | — (none static) |
| `lib/api.ts` | shared/lib | Base API client — lib/insights + snapshot-store + Converter + LiveRates | lib/insights.ts, lib/snapshot-store.ts, routes/Converter.tsx, routes/LiveRates.tsx (+3 tests) |
| `lib/clamp-panel.ts` | features/insights-legacy | Panel clamp helper — legacy ToolsMenu/DataExportPanel | components/insights/DataExportPanel.tsx, components/insights/ToolsMenu.tsx |
| `lib/display.test.ts` | shared/lib | display test (co-located) | — (none static) |
| `lib/display.ts` | shared/lib | Money display helpers — every money tool | components/AmountInput.tsx, components/LiveRateLine.tsx, components/ResultPopup.tsx, routes/BatchConverter.tsx +10 more (+1 tests) |
| `lib/download.ts` | shared/lib | File download helper — tools + GlobalPage NextUpStrip export | components/insights/NextUpStrip.tsx, routes/BatchConverter.tsx, routes/Receipt.tsx |
| `lib/fx-presentation.test.ts` | features/currencies | fx-presentation test (co-located) | — (none static) |
| `lib/fx-presentation.ts` | features/currencies | FX presentation barrel — legacy world-currencies subtree + CurrenciesRuleLights + exports | components/insights/WorldCurrencies.tsx, components/insights/full-export.ts, components/insights/fx-csv.ts, components/insights/world-currencies/DollarRow.tsx +5 more (+2 tests) |
| `lib/fx-presentation/format.ts` | features/currencies | FX format sentences | lib/fx-presentation/headline.ts, lib/fx-presentation/pairs.ts, lib/fx-presentation/plain.ts, lib/fx-presentation/sentences.ts |
| `lib/fx-presentation/headline.ts` | features/currencies | FX headline sentences | lib/fx-presentation.ts |
| `lib/fx-presentation/pairs.ts` | features/currencies | FX pair sentences | lib/fx-presentation.ts, lib/fx-presentation/headline.ts |
| `lib/fx-presentation/plain.ts` | features/currencies | FX plain sentences | lib/fx-presentation.ts |
| `lib/fx-presentation/rules.ts` | features/currencies | FX rule lights — CurrenciesRuleLights + global tiles/backtests (cross-domain: currencies+global) | lib/fx-presentation.ts, lib/fx-presentation/headline.ts, lib/fx-presentation/plain.ts, routes/page-division/CurrenciesRuleLights.tsx +3 more |
| `lib/fx-presentation/sentences.ts` | features/currencies | FX sentence builder | lib/fx-presentation.ts |
| `lib/fx-v13.test.ts` | features/currencies | FX v13 sentences test (fx-presentation subject) | — (none static) |
| `lib/fx.test.ts` | shared/lib | fx client test (co-located) | — (none static) |
| `lib/fx.ts` | shared/lib | FX snapshot client — CurrenciesPage + GlobalPage (+ legacy world-feeds): cross-domain client (currencies+global) | routes/insights-sections/world-feeds.ts, routes/page-division/CurrenciesPage.tsx, routes/page-division/GlobalPage.tsx (+1 tests) |
| `lib/history.test.ts` | features-tools/history | history test (co-located) | — (none static) |
| `lib/history.ts` | features-tools/history | Rate-history client — Converter + History route (history-tool client, converter reuses) | routes/Converter.tsx, routes/History.tsx (+1 tests) |
| `lib/id.ts` | shared/lib | Stable id helper — alerts/batch/receipt/settle | lib/alerts.ts, routes/BatchConverter.tsx, routes/Receipt.tsx, routes/Settle.tsx |
| `lib/insights.test.ts` | shared/lib | insights client test (co-located) | — (none static) |
| `lib/insights.ts` | shared/lib | Insights snapshot client — 5 domain pages + legacy + shared components | components/insights/DetailsPanel.tsx, components/insights/PriceDetails.tsx, components/insights/PricesBoard.tsx, components/insights/TrendChart.tsx +7 more (+1 tests) |
| `lib/live-rate.test.ts` | shared/lib | live-rate test (co-located) | — (none static) |
| `lib/live-rate.ts` | shared/lib | Live-rate client — converter + live-rates + shell alert evaluation | components/AlertsDialog.tsx, components/LiveRateLine.tsx, components/ResultPopup.tsx, lib/use-alert-evaluation.ts +1 more (+1 tests) |
| `lib/locale.ts` | shared/lib | Locale/i18n runtime — 88 importers (every surface) | App.tsx, components/AlertsDialog.tsx, components/AmountInput.tsx, components/CurrencySelect.tsx +84 more |
| `lib/markets-au.ts` | features/australia | AU markets snapshot client — AustraliaPage + AsiaNzx50Card (documented asia edge) + legacy | routes/insights-sections/world-feeds.ts, routes/page-division/AsiaNzx50Card.tsx, routes/page-division/AustraliaPage.tsx |
| `lib/markets.test.ts` | shared/lib | markets client test (co-located) | — (none static) |
| `lib/markets.ts` | shared/lib | Markets snapshot client — GlobalPage + WorldMarketsPage + RegionIndexSection (+ legacy): cross-domain client | routes/insights-sections/world-feeds.ts, routes/page-division/GlobalPage.tsx, routes/page-division/RegionIndexSection.tsx, routes/page-division/WorldMarketsPage.tsx (+1 tests) |
| `lib/narrative.ts` | shared/lib | Narrator-doc client — GlobalPage/GlobalBoard + legacy narrative components | components/insights/InTheNews.tsx, components/insights/NarrativeBlock.tsx, components/insights/WorldCurrencies.tsx, components/insights/WorldMarkets.tsx +4 more |
| `lib/page-division.test.ts` | shared/lib | page-division client test (co-located) | — (none static) |
| `lib/page-division.ts` | shared/lib | Page-projection client — all 9 destination pages | routes/page-division/AsiaPage.tsx, routes/page-division/AustraliaPage.tsx, routes/page-division/CommoditiesPage.tsx, routes/page-division/CurrenciesPage.tsx +5 more (+10 tests) |
| `lib/photo-store.ts` | features-tools/settle | Expense photo store — Settle only | routes/Settle.tsx, routes/settle/ExpensePhoto.tsx |
| `lib/rate-history.test.ts` | shared/lib | rate-history test (co-located) | — (none static) |
| `lib/rate-history.ts` | shared/lib | Rate history store — App + live-rate surfaces + snapshot-store | App.tsx, components/LiveRateLine.tsx, components/ResultPopup.tsx, lib/snapshot-store.ts +1 more (+1 tests) |
| `lib/recent-pairs.test.ts` | features-tools/converter | recent-pairs test (co-located) | — (none static) |
| `lib/recent-pairs.ts` | features-tools/converter | Recent pairs store — Converter only | routes/Converter.tsx, routes/converter/PairChips.tsx, routes/converter/shared.ts (+1 tests) |
| `lib/registry-sync.test.ts` | shared/lib | The cross-layer pin: data/indicators.json ↔ engine DEFINITIONS/GAUGES ↔ web config/display | — (none static) |
| `lib/route-meta.test.ts` | infrastructure | route-meta test (co-located) | — (none static) |
| `lib/route-meta.ts` | infrastructure | Route meta/canonical tags — App only (shell concern) | App.tsx (+1 tests) |
| `lib/settle-storage.test.ts` | features-tools/settle | settle-storage test (co-located) | — (none static) |
| `lib/settle-storage.ts` | features-tools/settle | Settle groups storage — Settle only | routes/Settle.tsx, routes/settle/AddExpenseModal.tsx, routes/settle/GroupCard.tsx, routes/settle/GroupDetail.tsx +2 more (+1 tests) |
| `lib/snapshot-store.test.ts` | shared/lib | snapshot-store test (co-located) | — (none static) |
| `lib/snapshot-store.ts` | shared/lib | Rate snapshot store — App + every money surface | App.tsx, components/AlertsDialog.tsx, components/LedGoldBoard.tsx, components/LedRateBoard.tsx +7 more (+1 tests) |
| `lib/theme.ts` | infrastructure | Theme store — Header only (shell) | components/Header.tsx |
| `lib/tic.test.ts` | features/usa | tic client test (co-located) | — (none static) |
| `lib/tic.ts` | features/usa | TIC snapshot client — UsaTicSection (+ legacy world-feeds) | routes/insights-sections/world-feeds.ts, routes/page-division/UsaTicSection.tsx (+1 tests) |
| `lib/use-alert-evaluation.ts` | infrastructure | Alert evaluation hook — App only (shell) | App.tsx |
| `lib/xlsx-writer.test.ts` | shared/lib | xlsx-writer test (co-located) | — (none static) |
| `lib/xlsx-writer.ts` | shared/lib | XLSX writer — legacy full-export (generic utility, kept shared) | components/insights/full-export.ts (+1 tests) |
| `main.tsx` | src root (no move) | Vite entry (index.html references /src/main.tsx) — stays put | — (none static) |
| `router.test.ts` | infrastructure | Router test (co-located) | — (none static) |
| `router.ts` | infrastructure | Path router + ROUTES table — app shell | App.tsx, components/ErrorBoundary.tsx, components/Footer.tsx, components/Header.tsx +27 more (+2 tests) |
| `routes/About.tsx` | features-tools/about | The /about tool page | — (none static) |
| `routes/BatchConverter.tsx` | features-tools/batch | The /batch tool page | — (none static) |
| `routes/Calculator.tsx` | features-tools/calculator | The /calculator tool page | — (none static) |
| `routes/Converter.test.tsx` | features-tools/converter | Converter test (co-located) | — (none static) |
| `routes/Converter.tsx` | features-tools/converter | The /converter founding page | — (none static) |
| `routes/History.tsx` | features-tools/history | The /history tool page | — (none static) |
| `routes/Insights.tsx` | features/insights-legacy | The legacy /insights page (§19.6 retirement candidate; super-consumer of every domain) | — (none static) |
| `routes/LiveRates.test.tsx` | features-tools/live-rates | LiveRates test (co-located) | — (none static) |
| `routes/LiveRates.tsx` | features-tools/live-rates | The /live-rates tool page | App.tsx |
| `routes/Receipt.test.tsx` | features-tools/receipt | Receipt test (co-located) | — (none static) |
| `routes/Receipt.tsx` | features-tools/receipt | The /receipt tool page | — (none static) |
| `routes/Settle.test.tsx` | features-tools/settle | Settle test (co-located) | — (none static) |
| `routes/Settle.tsx` | features-tools/settle | The /settle tool page | — (none static) |
| `routes/Splitter.tsx` | features-tools/splitter | The /splitter tool page | — (none static) |
| `routes/converter/AlertsSectionRow.tsx` | features-tools/converter | Converter child component | routes/Converter.tsx |
| `routes/converter/ConvertForm.tsx` | features-tools/converter | Converter child component | routes/Converter.tsx |
| `routes/converter/FailureCard.tsx` | features-tools/converter | Converter child component | routes/Converter.tsx |
| `routes/converter/PairChips.tsx` | features-tools/converter | Converter child component | routes/Converter.tsx |
| `routes/converter/QuickTools.tsx` | features-tools/converter | Converter child component | routes/Converter.tsx |
| `routes/converter/RetryCountdown.tsx` | features-tools/converter | Converter child component | routes/converter/FailureCard.tsx |
| `routes/converter/shared.ts` | features-tools/converter | Converter child component | routes/Converter.tsx, routes/converter/ConvertForm.tsx, routes/converter/FailureCard.tsx, routes/converter/PairChips.tsx +1 more |
| `routes/insights-sections/DeprecationBanner.tsx` | features/insights-legacy | Legacy deprecation banner | routes/Insights.tsx |
| `routes/insights-sections/InsightsHeader.tsx` | features/insights-legacy | Legacy insights header (lazy insights-csv) | routes/Insights.tsx |
| `routes/insights-sections/InsightsStatusBlocks.tsx` | features/insights-legacy | Legacy status blocks | routes/Insights.tsx, routes/insights-sections/InsightsHeader.tsx, routes/insights-sections/useInsightsToolsNav.ts |
| `routes/insights-sections/QuestionGroup.tsx` | features/insights-legacy | Legacy question group | components/insights/world-currencies/DollarStrength.tsx, routes/insights-sections/SectionLane.tsx |
| `routes/insights-sections/SectionLane.tsx` | features/insights-legacy | Legacy section lane | routes/Insights.tsx |
| `routes/insights-sections/UsGlobalReachGroup.tsx` | features/insights-legacy | DEAD CODE — zero importers (audit finding; owner-confirmed delete candidate) | — (none static) |
| `routes/insights-sections/data-health.test.ts` | features/insights-legacy | data-health test (co-located) | — (none static) |
| `routes/insights-sections/data-health.ts` | features/insights-legacy | Legacy data-health helper | routes/insights-sections/InsightsHeader.tsx (+1 tests) |
| `routes/insights-sections/useInsightsToolsNav.ts` | features/insights-legacy | Legacy tools nav hook | routes/Insights.tsx |
| `routes/insights-sections/world-feeds.ts` | features/insights-legacy | Legacy world-feeds helper (lazy fx-csv/markets-csv) | routes/Insights.tsx |
| `routes/page-division/AsiaNzx50Card.tsx` | features/asia-pacific | NZX50 mirror card (imports au-markets/shared + lib/markets-au — documented asia→australia edge) | routes/page-division/AsiaTierCards.tsx |
| `routes/page-division/AsiaPage.test.tsx` | features/asia-pacific | AsiaPage test | — (none static) |
| `routes/page-division/AsiaPage.tsx` | features/asia-pacific | The /asia-pacific page |  (+1 tests) |
| `routes/page-division/AsiaTierCards.tsx` | features/asia-pacific | Asia tier cards | routes/page-division/AsiaPage.tsx |
| `routes/page-division/AustraliaPage.test.tsx` | features/australia | AustraliaPage test | — (none static) |
| `routes/page-division/AustraliaPage.tsx` | features/australia | The /australia page |  (+1 tests) |
| `routes/page-division/AustraliaTierCards.tsx` | features/australia | Australia tier cards | routes/page-division/AustraliaPage.tsx |
| `routes/page-division/CommoditiesPage.test.tsx` | features/commodities | CommoditiesPage test | — (none static) |
| `routes/page-division/CommoditiesPage.tsx` | features/commodities | The /commodities page |  (+1 tests) |
| `routes/page-division/CommoditiesTierCards.tsx` | features/commodities | Commodities tier cards (renders shared PricesBoard) | routes/page-division/CommoditiesPage.tsx |
| `routes/page-division/CurrenciesPage.test.tsx` | features/currencies | CurrenciesPage test | — (none static) |
| `routes/page-division/CurrenciesPage.tsx` | features/currencies | The /currencies page |  (+1 tests) |
| `routes/page-division/CurrenciesPairBoard.tsx` | features/currencies | The 11-pair board (uses world-currencies/display) | routes/page-division/CurrenciesPage.tsx |
| `routes/page-division/CurrenciesRuleLights.tsx` | features/currencies | FX rule lights (uses fx-presentation/rules) | routes/page-division/CurrenciesPage.tsx |
| `routes/page-division/CurrenciesTierCards.tsx` | features/currencies | Currencies tier cards | routes/page-division/CurrenciesPage.tsx |
| `routes/page-division/DestinationBody.tsx` | shared/components | Destination body shell (dormant — wired via App lazy import; future destinations) | routes/page-division/PagePlaceholder.tsx |
| `routes/page-division/EconomicLinkagesPage.tsx` | features/economic-linkages | The /economic-linkages page (renders shared Together) | — (none static) |
| `routes/page-division/EuropePage.test.tsx` | features/europe | EuropePage test | — (none static) |
| `routes/page-division/EuropePage.tsx` | features/europe | The /europe page |  (+1 tests) |
| `routes/page-division/EuropeTierCards.tsx` | features/europe | Europe tier cards | routes/page-division/EuropePage.tsx |
| `routes/page-division/GlobalBoard.tsx` | features/global | Global verdict board | routes/page-division/GlobalPage.tsx |
| `routes/page-division/GlobalPage.test.tsx` | features/global | GlobalPage test | — (none static) |
| `routes/page-division/GlobalPage.tsx` | features/global | The / landing page |  (+1 tests) |
| `routes/page-division/GoldBalanceClassic.tsx` | features/gold | Gold balance classic panel | routes/page-division/GoldHero.tsx |
| `routes/page-division/GoldContext.tsx` | features/gold | Gold context panel | routes/page-division/GoldPage.tsx |
| `routes/page-division/GoldHero.tsx` | features/gold | Gold hero | routes/page-division/GoldPage.tsx |
| `routes/page-division/GoldPage.test.tsx` | features/gold | GoldPage test | — (none static) |
| `routes/page-division/GoldPage.tsx` | features/gold | The /gold page |  (+1 tests) |
| `routes/page-division/GoldPositions.tsx` | features/gold | Gold positions section (TM23) | routes/page-division/GoldPage.tsx |
| `routes/page-division/GoldSeats.tsx` | features/gold | Gold meter seat chips | routes/page-division/GoldBalanceClassic.tsx, routes/page-division/GoldPage.tsx |
| `routes/page-division/PagePlaceholder.tsx` | shared/components | Placeholder page (dormant — DESTINATION_ROUTES currently empty) | `lazy()`-loaded — alive (static graph shows 0) |
| `routes/page-division/RegionIndexSection.tsx` | shared/components | Region index map section — shared by 4 region pages (imports world-markets WorldMap/shared/config) | routes/page-division/AsiaPage.tsx, routes/page-division/AustraliaPage.tsx, routes/page-division/EuropePage.tsx, routes/page-division/UsaPage.tsx |
| `routes/page-division/UsaPage.test.tsx` | features/usa | UsaPage test | — (none static) |
| `routes/page-division/UsaPage.tsx` | features/usa | The /usa page |  (+1 tests) |
| `routes/page-division/UsaTicSection.tsx` | features/usa | USA TIC section | routes/page-division/UsaPage.tsx |
| `routes/page-division/UsaTierCards.tsx` | features/usa | USA tier cards | routes/page-division/UsaPage.tsx |
| `routes/page-division/UsaVerdictStrip.tsx` | features/usa | USA D-30 verdict strip | routes/page-division/UsaPage.tsx |
| `routes/page-division/WorldMarketsBriefing.tsx` | features/world-markets | WM briefing (HistoryChart/MarketsChart/Treemap/Modal) | routes/page-division/WorldMarketsPage.tsx |
| `routes/page-division/WorldMarketsGrids.tsx` | features/world-markets | WM grids | routes/page-division/WorldMarketsPage.tsx |
| `routes/page-division/WorldMarketsHero.tsx` | features/world-markets | WM hero (renders shared WorldMap) | routes/page-division/WorldMarketsPage.tsx (+1 tests) |
| `routes/page-division/WorldMarketsPage.test.tsx` | features/world-markets | WorldMarketsPage test | — (none static) |
| `routes/page-division/WorldMarketsPage.tsx` | features/world-markets | The /world-markets page |  (+1 tests) |
| `routes/page-division/WorldRiskCards.tsx` | features/global | Global world-risk cards | routes/page-division/WorldMarketsPage.tsx |
| `routes/page-division/asia-backtest-core.ts` | features/asia-pacific | Asia backtest harness |  (+1 tests) |
| `routes/page-division/asia-backtest.test.ts` | features/asia-pacific | asia backtest test | — (none static) |
| `routes/page-division/asia-copy-pin.test.ts` | features/asia-pacific | asia copy pin | — (none static) |
| `routes/page-division/asia-tiles.test.ts` | features/asia-pacific | asia-tiles test | — (none static) |
| `routes/page-division/asia-tiles.ts` | features/asia-pacific | Asia tile defs | routes/page-division/AsiaTierCards.tsx, routes/page-division/asia-backtest-core.ts (+3 tests) |
| `routes/page-division/australia-backtest-core.ts` | features/australia | Australia backtest harness |  (+1 tests) |
| `routes/page-division/australia-backtest.test.ts` | features/australia | australia backtest test | — (none static) |
| `routes/page-division/australia-board-copy.ts` | features/australia | AU board copy | routes/page-division/AustraliaPage.tsx |
| `routes/page-division/australia-copy-pin.test.ts` | features/australia | australia copy pin | — (none static) |
| `routes/page-division/australia-tiles.test.ts` | features/australia | australia-tiles test | — (none static) |
| `routes/page-division/australia-tiles.ts` | features/australia | Australia tile defs | routes/page-division/AustraliaTierCards.tsx, routes/page-division/australia-backtest-core.ts (+4 tests) |
| `routes/page-division/commodities-backtest-core.ts` | features/commodities | Commodities backtest harness |  (+1 tests) |
| `routes/page-division/commodities-backtest.test.ts` | features/commodities | commodities backtest test | — (none static) |
| `routes/page-division/commodities-copy-pin.test.ts` | features/commodities | commodities copy pin | — (none static) |
| `routes/page-division/commodities-tiles.test.ts` | features/commodities | commodities-tiles test | — (none static) |
| `routes/page-division/commodities-tiles.ts` | features/commodities | Commodities tile defs | routes/page-division/CommoditiesTierCards.tsx, routes/page-division/commodities-backtest-core.ts (+4 tests) |
| `routes/page-division/currencies-backtest-core.ts` | features/currencies | Currencies backtest harness |  (+1 tests) |
| `routes/page-division/currencies-backtest.test.ts` | features/currencies | currencies backtest test | — (none static) |
| `routes/page-division/currencies-copy-pin.test.ts` | features/currencies | currencies copy pin | — (none static) |
| `routes/page-division/currencies-tiles.test.ts` | features/currencies | currencies-tiles test | — (none static) |
| `routes/page-division/currencies-tiles.ts` | features/currencies | Currencies tile defs | routes/page-division/CurrenciesPairBoard.tsx, routes/page-division/CurrenciesRuleLights.tsx, routes/page-division/CurrenciesTierCards.tsx, routes/page-division/currencies-backtest-core.ts (+3 tests) |
| `routes/page-division/destinations.ts` | shared/components | Destination route meta — 8 pages + DestinationBody/PagePlaceholder/GlobalBoard (page-division shared) | routes/page-division/AsiaPage.tsx, routes/page-division/AustraliaPage.tsx, routes/page-division/CommoditiesPage.tsx, routes/page-division/CurrenciesPage.tsx +5 more |
| `routes/page-division/europe-backtest-core.ts` | features/europe | Europe backtest harness |  (+1 tests) |
| `routes/page-division/europe-backtest.test.ts` | features/europe | europe backtest test | — (none static) |
| `routes/page-division/europe-copy-pin.test.ts` | features/europe | europe copy pin | — (none static) |
| `routes/page-division/europe-tiles.test.ts` | features/europe | europe-tiles test | — (none static) |
| `routes/page-division/europe-tiles.ts` | features/europe | Europe tile defs | routes/page-division/EuropeTierCards.tsx, routes/page-division/europe-backtest-core.ts (+3 tests) |
| `routes/page-division/global-backtest-core.ts` | features/global | Global backtest harness |  (+1 tests) |
| `routes/page-division/global-backtest.test.ts` | features/global | global backtest test | — (none static) |
| `routes/page-division/global-copy-pin.test.ts` | features/global | global copy pin | — (none static) |
| `routes/page-division/global-page-states.ts` | features/global | Global load-state helpers | routes/page-division/GlobalBoard.tsx, routes/page-division/GlobalPage.tsx |
| `routes/page-division/global-tiles.test.ts` | features/global | global-tiles test | — (none static) |
| `routes/page-division/global-tiles.ts` | features/global | Global tile defs (gauge tiles + ribbon + dedollar + fx + markets) | routes/page-division/GlobalBoard.tsx, routes/page-division/GlobalPage.tsx, routes/page-division/global-backtest-core.ts, routes/page-division/usa-backtest-core.ts +1 more (+3 tests) |
| `routes/page-division/gold-backtest-core.ts` | features/gold | Gold backtest harness |  (+2 tests) |
| `routes/page-division/gold-backtest.test.ts` | features/gold | gold backtest test | — (none static) |
| `routes/page-division/gold-copy-pin.test.ts` | features/gold | gold copy pin | — (none static) |
| `routes/page-division/gold-frozen-scenarios.test.ts` | features/gold | gold frozen scenarios test | — (none static) |
| `routes/page-division/gold-tiles.test.ts` | features/gold | gold-tiles test | — (none static) |
| `routes/page-division/gold-tiles.ts` | features/gold | Gold tile defs | routes/page-division/GoldBalanceClassic.tsx, routes/page-division/GoldContext.tsx, routes/page-division/GoldHero.tsx, routes/page-division/GoldPage.tsx +2 more (+4 tests) |
| `routes/page-division/region-zoom-backtest-core.ts` | shared/components | Region zoom backtest harness — region-shared (currently exercised only by its own test) |  (+1 tests) |
| `routes/page-division/region-zoom-backtest.test.ts` | shared/components | region-zoom backtest test | — (none static) |
| `routes/page-division/usa-backtest-core.ts` | features/usa | USA backtest harness — ALSO the universal backtest harness every other domain imports (documented cross-domain edge) | routes/page-division/asia-backtest-core.ts, routes/page-division/australia-backtest-core.ts, routes/page-division/commodities-backtest-core.ts, routes/page-division/currencies-backtest-core.ts +1 more (+1 tests) |
| `routes/page-division/usa-backtest.test.ts` | features/usa | usa backtest test | — (none static) |
| `routes/page-division/usa-copy-pin.test.ts` | features/usa | usa copy pin | — (none static) |
| `routes/page-division/usa-tic-copy.ts` | features/usa | USA TIC copy | routes/page-division/UsaTicSection.tsx |
| `routes/page-division/usa-tiles.test.ts` | features/usa | usa-tiles test | — (none static) |
| `routes/page-division/usa-tiles.ts` | features/usa | USA tile defs | routes/page-division/UsaPage.tsx, routes/page-division/UsaTierCards.tsx, routes/page-division/UsaVerdictStrip.tsx, routes/page-division/usa-backtest-core.ts (+4 tests) |
| `routes/page-division/world-map-copy.ts` | features/world-markets | WM map copy (also read by shared RegionIndexSection) | routes/page-division/RegionIndexSection.tsx, routes/page-division/WorldMarketsHero.tsx |
| `routes/page-division/world-markets-backtest-core.ts` | features/world-markets | WM backtest harness |  (+1 tests) |
| `routes/page-division/world-markets-backtest.test.ts` | features/world-markets | wm backtest test | — (none static) |
| `routes/page-division/world-markets-copy-pin.test.ts` | features/world-markets | wm copy pin | — (none static) |
| `routes/page-division/world-markets-tiles.test.ts` | features/world-markets | wm-tiles test | — (none static) |
| `routes/page-division/world-markets-tiles.ts` | features/world-markets | WM tile defs | routes/page-division/WorldMarketsGrids.tsx, routes/page-division/WorldMarketsHero.tsx, routes/page-division/WorldMarketsPage.tsx, routes/page-division/WorldRiskCards.tsx +1 more (+3 tests) |
| `routes/receipt/ExpenseItemRow.tsx` | features-tools/receipt | Receipt child component | routes/Receipt.tsx |
| `routes/receipt/OptionsPanel.tsx` | features-tools/receipt | Receipt child component | routes/Receipt.tsx |
| `routes/receipt/ReceiptModal.tsx` | features-tools/receipt | Receipt child component | routes/Receipt.tsx |
| `routes/receipt/SummaryPanel.tsx` | features-tools/receipt | Receipt child component | routes/Receipt.tsx |
| `routes/receipt/shared.ts` | features-tools/receipt | Receipt child component | routes/Receipt.tsx, routes/receipt/ExpenseItemRow.tsx, routes/receipt/OptionsPanel.tsx, routes/receipt/ReceiptModal.tsx +1 more |
| `routes/settle/AddExpenseModal.tsx` | features-tools/settle | Settle child component | routes/Settle.tsx |
| `routes/settle/CreateGroupModal.tsx` | features-tools/settle | Settle child component | routes/Settle.tsx |
| `routes/settle/ExpensePhoto.tsx` | features-tools/settle | Settle child component | routes/settle/GroupTabs.tsx |
| `routes/settle/GroupCard.tsx` | features-tools/settle | Settle child component | routes/Settle.tsx |
| `routes/settle/GroupDetail.tsx` | features-tools/settle | Settle child component | routes/Settle.tsx |
| `routes/settle/GroupTabs.tsx` | features-tools/settle | Settle child component | routes/settle/GroupDetail.tsx |
| `routes/settle/Modal.tsx` | features-tools/settle | Settle child component | routes/settle/AddExpenseModal.tsx, routes/settle/CreateGroupModal.tsx |
| `routes/settle/shared.ts` | features-tools/settle | Settle child component | routes/Settle.tsx, routes/settle/AddExpenseModal.tsx, routes/settle/CreateGroupModal.tsx, routes/settle/GroupCard.tsx +2 more |

### Insights engine — 204 files

| File | Proposed target | Reason | Primary importers (compressed) |
|---|---|---|---|
| `adapters/abs-au.test.ts` | engine domains/australia | abs-au test (co-located) | — (none static) |
| `adapters/abs-au.ts` | engine domains/australia | ABS monthly AU series (8 AU indicators) | engine:ingest/run.ts (+2 tests) |
| `adapters/abs.ts` | engine domains/australia | ABS SDMX series (11 AU indicators) | engine:adapters/abs-au.ts, engine:adapters/collect.ts, engine:adapters/index.ts (+1 tests) |
| `adapters/adapters.test.ts` | engine shared/adapters | The adapters barrel test | — (none static) |
| `adapters/auctions.test.ts` | engine domains/usa | auctions test (co-located) | — (none static) |
| `adapters/auctions.ts` | engine domains/usa | Treasury auctions (4 USA ids; FiscalData venue) | engine:adapters/index.ts (+1 tests) |
| `adapters/bazg.ts` | engine domains/gold | swiss-gold-flow (BAZG customs CSV) | engine:adapters/index.ts, engine:adapters/rung2.ts |
| `adapters/biff.ts` | engine shared/adapters | OLE2/BIFF8 .xls reader — infra (EIA workbooks, GPR export) | engine:adapters/eia.ts, engine:adapters/index.ts, engine:adapters/monthly-indexes.ts (+2 tests) |
| `adapters/bitstamp.ts` | engine domains/commodities | btc-usd OHLC (Bitstamp) | engine:adapters/collect.ts, engine:adapters/index.ts (+1 tests) |
| `adapters/boe.test.ts` | engine domains/europe | boe test (co-located) | — (none static) |
| `adapters/boe.ts` | engine domains/europe | boe-rate (Bank of England decision table) | engine:adapters/collect.ts, engine:adapters/derived.ts (+1 tests) |
| `adapters/brent-gapfill.test.ts` | engine shared/adapters | Brent gap-fill tests (subjects: derived.ts + collect.ts) | — (none static) |
| `adapters/cftc.ts` | engine domains/gold | cftc-gold-positioning + cftc-gold-gross-long (gold row only) | engine:adapters/rung2.ts (+1 tests) |
| `adapters/cleveland.ts` | engine domains/usa | cpi-nowcast (Cleveland Fed) | engine:adapters/rung2.ts |
| `adapters/cofer.test.ts` | engine domains/currencies | cofer test (co-located) | — (none static) |
| `adapters/cofer.ts` | engine domains/currencies | usd-reserve-share (IMF COFER SDMX 3.0) | engine:adapters/rung2.ts (+1 tests) |
| `adapters/collect-fallback.test.ts` | engine shared/adapters | collect fallback tests | — (none static) |
| `adapters/collect-gates.test.ts` | engine shared/adapters | collect gates tests | — (none static) |
| `adapters/collect.ts` | engine shared/adapters | collectAllSources — the 04:10 rung orchestrator over ALL providers (infra) | engine:adapters/index.ts, engine:ingest/run.ts (+2 tests) |
| `adapters/credit.test.ts` | engine domains/usa | credit test (co-located) | — (none static) |
| `adapters/credit.ts` | engine domains/usa | ebp + ofr-fsi (Fed/OFR) | engine:adapters/index.ts, engine:ingest/run.ts (+1 tests) |
| `adapters/derived.ts` | engine shared/adapters | buildIndicatorSeries — the ~170-id assembly hub across ALL domains + gold derivations + brent gapfill (cannot split) | engine:adapters/collect.ts, engine:adapters/index.ts, engine:adapters/snapshot.ts, engine:validation.ts (+8 tests) |
| `adapters/ecb.ts` | engine domains/europe | ecb-dfr (ECB SDMX) | engine:adapters/collect.ts, engine:adapters/index.ts, engine:adapters/rung2.ts (+1 tests) |
| `adapters/eia-cftc.test.ts` | engine shared/adapters | Cross-adapter tests (subjects: eia-stocks.ts + cftc.ts — split to follow subjects at move time) | — (none static) |
| `adapters/eia-stocks.ts` | engine domains/commodities | eia-crude-stocks + us-spr + us-crude-production | engine:adapters/index.ts, engine:adapters/rung2.ts (+1 tests) |
| `adapters/eia.test.ts` | engine domains/commodities | eia test (co-located) | — (none static) |
| `adapters/eia.ts` | engine domains/commodities | wti + brent + natgas spot workbooks | engine:adapters/collect.ts, engine:adapters/index.ts (+1 tests) |
| `adapters/fetch-policy.test.ts` | engine shared/adapters | fetch-policy test (co-located) | — (none static) |
| `adapters/fetch-policy.ts` | engine shared/adapters | insightsFetch — the ONLY fetch path (UA/block taxonomy) | engine:adapters/abs-au.ts, engine:adapters/abs.ts, engine:adapters/auctions.ts, engine:adapters/bazg.ts +39 more (+8 tests) |
| `adapters/fng.ts` | engine domains/commodities | crypto-fng (Alternative.me) | engine:adapters/collect.ts, engine:adapters/index.ts |
| `adapters/frankfurter.ts` | engine domains/currencies | The FX pair legs (10 currencies incl. audusd/audjpy/audnzd + dollar-basket + usdtry) | engine:adapters/collect.ts, engine:adapters/index.ts (+1 tests) |
| `adapters/fred.ts` | engine shared/adapters | 66 FRED series — usa-dominant bulk + commodities/europe/asia/currencies legs (cross-domain: 5 domains) | engine:adapters/collect.ts, engine:adapters/credit.ts, engine:adapters/index.ts, engine:adapters/rung2.ts +1 more (+3 tests) |
| `adapters/gold-equities.ts` | engine domains/gold | gold-equities-ratio (Yahoo GLD/SPY) | engine:adapters/rung2.ts |
| `adapters/goldapi.ts` | engine shared/adapters | GoldAPI spots: gold (gold domain) + silver/platinum/copper/btc (commodities) — cross-domain (deviation from skeleton: shared, not gold) | engine:adapters/collect.ts, engine:adapters/index.ts (+1 tests) |
| `adapters/imf-cpi.test.ts` | engine domains/asia-pacific | imf-cpi test (co-located) | — (none static) |
| `adapters/imf-cpi.ts` | engine domains/asia-pacific | japan-cpi + korea-cpi + india-cpi (IMF SDMX CPI) | engine:adapters/rung2.ts (+1 tests) |
| `adapters/index.ts` | engine shared/adapters | The adapters barrel (runner-only export) — stays, re-exports from domain + shared adapter folders | engine:ingest/run.ts |
| `adapters/manual.ts` | engine shared/adapters | data/manual/*.json loader — infra | engine:adapters/index.ts, engine:ingest/data.ts (+1 tests) |
| `adapters/mof.test.ts` | engine domains/asia-pacific | mof test (co-located) | — (none static) |
| `adapters/mof.ts` | engine domains/asia-pacific | jgb-10y (Japan MOF) | engine:adapters/index.ts, engine:adapters/rung2.ts (+1 tests) |
| `adapters/monthly-indexes.ts` | engine shared/adapters | GPR family (world-markets 7 + asia 2 + australia 1) + EPU/TPU (usa) + GSCPI (commodities) — cross-domain: 5 domains | engine:adapters/index.ts, engine:adapters/rung2.ts (+1 tests) |
| `adapters/nbs.test.ts` | engine domains/asia-pacific | nbs test (co-located) | — (none static) |
| `adapters/nbs.ts` | engine domains/asia-pacific | china-pmi + china-cpi + china-property-investment + china-steel-output (NBS) | engine:adapters/collect.ts, engine:adapters/rung2.ts (+1 tests) |
| `adapters/oecd-monthly.test.ts` | engine shared/adapters | Monthly trio tests (subjects: oecd.ts + monthly-indexes.ts captures) | — (none static) |
| `adapters/oecd.ts` | engine shared/adapters | OECD CLI: USA + DEU + CHN (+NZL monthly) — cross-domain: usa+europe+asia | engine:adapters/rung2.ts (+2 tests) |
| `adapters/portwatch.test.ts` | engine domains/commodities | portwatch test (co-located) | — (none static) |
| `adapters/portwatch.ts` | engine domains/commodities | The 5 chokepoint series (IMF PortWatch) | engine:adapters/index.ts, engine:ingest/run.ts, engine:scoring.ts (+2 tests) |
| `adapters/rba.test.ts` | engine domains/australia | rba test (co-located) | — (none static) |
| `adapters/rba.ts` | engine domains/australia | RBA tables (6 AU indicators) | engine:adapters/collect.ts, engine:adapters/index.ts (+2 tests) |
| `adapters/rstar.ts` | engine domains/usa | rstar-us (NY Fed HLW) | engine:adapters/rung2.ts |
| `adapters/rung2-inputs.ts` | engine shared/adapters | Rung2 type contract — infra | engine:adapters/derived.ts, engine:adapters/index.ts |
| `adapters/rung2.test.ts` | engine shared/adapters | Rung2 tests (cross-domain phase plan) | — (none static) |
| `adapters/rung2.ts` | engine shared/adapters | The 04:20 rung plan over ~45 ids across all domains — phase infra | engine:adapters/index.ts, engine:ingest/run.ts (+2 tests) |
| `adapters/rung4-inputs.ts` | engine shared/adapters | Rung4 type contract — infra | engine:adapters/derived.ts |
| `adapters/rung4.test.ts` | engine shared/adapters | Rung4 tests | — (none static) |
| `adapters/rung4.ts` | engine shared/adapters | The 04:35 rung (19 usa-only ids) — phase infra (could move to usa in a future split; owner decision) | engine:adapters/derived.ts, engine:ingest/run.ts (+2 tests) |
| `adapters/s6-nz.test.ts` | engine shared/adapters | NZ series tests (subjects: oecd.ts NZL + monthly-indexes) | — (none static) |
| `adapters/sge-monthly.test.ts` | engine domains/gold | sge-monthly test (co-located) | — (none static) |
| `adapters/sge-monthly.ts` | engine domains/gold | sge-gold-withdrawals (SGE monthly PDFs) | engine:adapters/index.ts, engine:adapters/rung2.ts (+1 tests) |
| `adapters/sge.ts` | engine domains/gold | shanghai-gold-premium (SGE Au99.99) | engine:adapters/index.ts, engine:adapters/rung2.ts |
| `adapters/snapshot-gates.test.ts` | engine shared/adapters | Snapshot gates tests | — (none static) |
| `adapters/snapshot.test.ts` | engine shared/adapters | Snapshot build/projection tests | — (none static) |
| `adapters/snapshot.ts` | engine shared/adapters | buildInsightsSnapshot + history + projection — the snapshot assembly (infra) | engine:adapters/index.ts, engine:ingest/data.ts (+8 tests) |
| `adapters/sp500-breadth.test.ts` | engine domains/usa | sp500-breadth test (co-located) | — (none static) |
| `adapters/sp500-breadth.ts` | engine domains/usa | sp500-breadth-ratio (Yahoo RSP/SPY) | engine:adapters/rung2.ts (+1 tests) |
| `adapters/treasury.test.ts` | engine domains/usa | treasury test (co-located) | — (none static) |
| `adapters/treasury.ts` | engine domains/usa | US Treasury nominal/real curve CSVs (FRED fallback) | engine:adapters/collect.ts, engine:adapters/index.ts (+1 tests) |
| `adapters/types.ts` | engine shared/adapters | FetchDeps/AdapterError/SpotPrice contracts — infra | engine:adapters/abs-au.ts, engine:adapters/abs.ts, engine:adapters/auctions.ts, engine:adapters/bazg.ts +28 more |
| `adapters/uom.ts` | engine domains/usa | michigan-5y-expectations (UoM SIE) | engine:adapters/index.ts, engine:adapters/rung2.ts |
| `adapters/worldbank-derived.test.ts` | engine shared/adapters | Worldbank/derived cross tests (subjects: worldbank.ts + derived.ts) | — (none static) |
| `adapters/worldbank.ts` | engine shared/adapters | Pink Sheet: gold column (gold ratios) + silver/copper/iron-ore/platinum/wheat/maize/coal/gas/lng/brent/food (commodities) — cross-domain | engine:adapters/collect.ts, engine:adapters/derived.ts, engine:adapters/index.ts (+1 tests) |
| `adapters/xlsx.ts` | engine shared/adapters | OOXML .xlsx reader — infra (Pink Sheet, rstar, EPU/TPU/GSCPI) | engine:adapters/index.ts, engine:adapters/monthly-indexes.ts, engine:adapters/rstar.ts, engine:adapters/worldbank.ts (+1 tests) |
| `adapters/yahoo.test.ts` | engine shared/adapters | yahoo test (co-located) | — (none static) |
| `adapters/yahoo.ts` | engine shared/adapters | Yahoo quotes: prices board (brent/gold/silver/btc) + brent gapfill + usdaed + gold/silver/btc peaks — cross-domain: gold+commodities+currencies | engine:adapters/collect.ts, engine:adapters/derived.ts, engine:adapters/gold-equities.ts, engine:adapters/index.ts +4 more (+3 tests) |
| `adapters/zip.ts` | engine shared/adapters | ZIP reader — infra (FRED multi-CSV, CFTC) | engine:adapters/cftc.ts, engine:adapters/fred.ts |
| `basket.test.ts` | engine domains/currencies | basket test (co-located) | — (none static) |
| `basket.ts` | engine domains/currencies | The dollar-basket computation — fx entries/job + adapters/derived (documented edge) | engine:adapters/derived.ts, engine:fx/entries.ts, engine:fx/job.ts, engine:index.ts (+1 tests) |
| `breakeven-tilt.test.ts` | engine domains/gold | breakeven-tilt test (co-located) | — (none static) |
| `breakeven-tilt.ts` | engine domains/gold | Gold panel inflation-lane phrase selection | engine:index.ts (+1 tests) |
| `companies/adapter.test.ts` | engine domains/companies | The feature-flagged (OFF) companies table + EODHD adapter stub | — (none static) |
| `companies/adapter.ts` | engine domains/companies | The feature-flagged (OFF) companies table + EODHD adapter stub | engine:index.ts (+1 tests) |
| `companies/definitions.ts` | engine domains/companies | The feature-flagged (OFF) companies table + EODHD adapter stub | engine:companies/adapter.ts, engine:index.ts (+1 tests) |
| `connections.test.ts` | engine shared | connections test (co-located) | — (none static) |
| `connections.ts` | engine shared | The 10 connection cards table — cross-domain single source (constraint: stays shared) | engine:gf-p0-proposed.ts, engine:gold-backtest-core.ts, engine:gold-balance.ts, engine:gold-score.ts +3 more (+2 tests) |
| `definitions.test.ts` | engine shared | definitions test (co-located) | — (none static) |
| `definitions.ts` | engine shared | The 187-id registry — cross-domain single source (constraint: stays shared) | engine:adapters/snapshot.ts, engine:gauges.ts, engine:index.ts, engine:ingest/run.ts +5 more (+10 tests) |
| `freshness.test.ts` | engine shared | freshness test (co-located) | — (none static) |
| `freshness.ts` | engine shared | Data-age for every reading — narrator + all pages | engine:index.ts, engine:narrator/state.ts (+1 tests) |
| `fx/compute.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/index.ts, engine:fx/job.ts, engine:fx/run.ts, engine:fx/store.ts (+1 tests) |
| `fx/content.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/compute.ts |
| `fx/cross-inputs.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/compute.ts, engine:fx/rules.ts |
| `fx/definitions.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | api:insights-export.ts, components/insights/full-export.ts, components/insights/fx-csv.ts, components/insights/world-currencies/PatternCard.tsx +17 more (+3 tests) |
| `fx/entries.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/compute.ts |
| `fx/fx.test.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | — (none static) |
| `fx/index.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | api:adapters/insights-store.ts, api:narrator-cron.ts, api:routes/insights.ts, markets:index.ts +2 more (+5 tests) |
| `fx/job.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/index.ts, engine:fx/run.ts (+1 tests) |
| `fx/maths.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/compute.ts, engine:fx/cross-inputs.ts, engine:fx/entries.ts, engine:fx/pairs.ts +3 more |
| `fx/pairs.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/compute.ts, engine:fx/entries.ts |
| `fx/providers.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/entries.ts, engine:fx/index.ts, engine:fx/job.ts, engine:fx/pairs.ts (+1 tests) |
| `fx/rules.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/compute.ts |
| `fx/run.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/index.ts (+1 tests) |
| `fx/store.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/index.ts, engine:fx/job.ts, engine:fx/run.ts (+1 tests) |
| `fx/summary.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/compute.ts |
| `fx/weekly.ts` | engine domains/currencies | The FX job/store/compute/providers/rules — currencies domain (consumed by api + markets worker + web currencies/global) | engine:fx/compute.ts, engine:fx/entries.ts, engine:fx/rules.ts |
| `gap-leg-guard.test.ts` | engine shared | Gap-leg guard tests (subject lives in adapters/snapshot.ts) | — (none static) |
| `gauges.test.ts` | engine shared | gauges test (co-located) | — (none static) |
| `gauges.ts` | engine shared | The 5 thematic + AU/shadow gauges — cross-domain single source (constraint: stays shared) | engine:adapters/snapshot.ts, engine:index.ts, engine:narrator/state.ts, engine:page-division/placement.ts +1 more (+3 tests) |
| `gf-p0-proposed.test.ts` | engine domains/gold | gf-p0-proposed test (co-located) | — (none static) |
| `gf-p0-proposed.ts` | engine domains/gold | The GF-P0/P2 frozen + proposed move maps — gold backtest + web gold-backtest-core | routes/page-division/gold-backtest-core.ts (+4 tests) |
| `gold-backtest-core.test.ts` | engine domains/gold | gold-backtest-core test (co-located) | — (none static) |
| `gold-backtest-core.ts` | engine domains/gold | Gold backtest harness pure core | engine:gf-p0-proposed.ts (+4 tests) |
| `gold-balance.test.ts` | engine domains/gold | gold-balance test (co-located) | — (none static) |
| `gold-balance.ts` | engine domains/gold | The gold balance (5 conditions) presentation model | engine:index.ts (+1 tests) |
| `gold-lane-calibration.test.ts` | engine domains/gold | Lane-calibration test (subjects: gold-score + gold-backtest-core + gf-p0-proposed; no own .ts) | — (none static) |
| `gold-score.test.ts` | engine shared | gold-score test (co-located) | — (none static) |
| `gold-score.ts` | engine shared | GOLD_LANE_VOTERS (37 voters spanning usa/europe/gold/currencies/commodities) — CONSTRAINT overrides skeleton: stays shared, NOT domains/gold | engine:gf-p0-proposed.ts, engine:gold-backtest-core.ts, engine:gold-balance.ts, engine:index.ts +1 more (+8 tests) |
| `index.ts` | stays: index.ts barrel | The root barrel (57 @currena/insights importers) — stays, re-exports from domains/ + shared/ | api:insights-export.ts, components/insights/CardMeta.tsx, components/insights/CompaniesTable.tsx, components/insights/ConnectionCard.tsx +25 more (+15 tests) |
| `ingest/data.ts` | engine shared | The ingestion plumbing (bundled data JSONs + KV + run orchestration) — infrastructure (exports-map entry ./ingest) | engine:ingest/index.ts, engine:ingest/run.ts |
| `ingest/index.ts` | engine shared | The ingestion plumbing (bundled data JSONs + KV + run orchestration) — infrastructure (exports-map entry ./ingest) | api:insights-extra-rungs.ts, api:insights-ingest-cron.ts |
| `ingest/kv-store.ts` | engine shared | The ingestion plumbing (bundled data JSONs + KV + run orchestration) — infrastructure (exports-map entry ./ingest) | engine:ingest/index.ts, engine:ingest/run.ts |
| `ingest/run.ts` | engine shared | The ingestion plumbing (bundled data JSONs + KV + run orchestration) — infrastructure (exports-map entry ./ingest) | engine:ingest/index.ts (+4 tests) |
| `licences.ts` | engine shared | Source licence table — every source, every domain | engine:sources.ts (+1 tests) |
| `markets-au/compute.ts` | engine domains/australia | The AU markets board job/store/compute/providers — australia domain (consumed by api + markets worker) | engine:markets-au/index.ts, engine:markets-au/job.ts, engine:markets-au/run.ts, engine:markets-au/store.ts (+1 tests) |
| `markets-au/definitions.ts` | engine domains/australia | The AU markets board job/store/compute/providers — australia domain (consumed by api + markets worker) | components/insights/AustralianMarkets.tsx, components/insights/au-markets/briefing.ts, engine:markets-au/compute.ts, engine:markets-au/index.ts +3 more (+1 tests) |
| `markets-au/index.ts` | engine domains/australia | The AU markets board job/store/compute/providers — australia domain (consumed by api + markets worker) | api:adapters/insights-store.ts, api:routes/insights.ts, markets:index.ts (+1 tests) |
| `markets-au/job.ts` | engine domains/australia | The AU markets board job/store/compute/providers — australia domain (consumed by api + markets worker) | engine:markets-au/index.ts, engine:markets-au/run.ts (+1 tests) |
| `markets-au/markets-au.test.ts` | engine domains/australia | The AU markets board job/store/compute/providers — australia domain (consumed by api + markets worker) | — (none static) |
| `markets-au/providers.ts` | engine domains/australia | The AU markets board job/store/compute/providers — australia domain (consumed by api + markets worker) | engine:markets-au/compute.ts, engine:markets-au/index.ts, engine:markets-au/job.ts (+1 tests) |
| `markets-au/run.ts` | engine domains/australia | The AU markets board job/store/compute/providers — australia domain (consumed by api + markets worker) | engine:markets-au/index.ts |
| `markets-au/store.ts` | engine domains/australia | The AU markets board job/store/compute/providers — australia domain (consumed by api + markets worker) | engine:markets-au/index.ts, engine:markets-au/run.ts (+1 tests) |
| `markets/compute.ts` | engine domains/world-markets | The world-markets board job/store/compute/providers — world-markets domain (consumed by api + markets worker + web wm/global/regions) | engine:markets-au/compute.ts, engine:markets/index.ts, engine:markets/job.ts, engine:markets/run.ts +1 more (+1 tests) |
| `markets/definitions.ts` | engine domains/world-markets | The world-markets board job/store/compute/providers — world-markets domain (consumed by api + markets worker + web wm/global/regions) | components/icons/currena.tsx, components/insights/WorldMarkets.tsx, components/insights/full-export.ts, components/insights/markets-csv.ts +29 more (+11 tests) |
| `markets/index.ts` | engine domains/world-markets | The world-markets board job/store/compute/providers — world-markets domain (consumed by api + markets worker + web wm/global/regions) | api:adapters/insights-store.ts, api:index.ts, api:narrator-cron.ts, api:routes/insights.ts +3 more (+12 tests) |
| `markets/job.ts` | engine domains/world-markets | The world-markets board job/store/compute/providers — world-markets domain (consumed by api + markets worker + web wm/global/regions) | engine:markets/index.ts, engine:markets/run.ts (+1 tests) |
| `markets/markets.test.ts` | engine domains/world-markets | The world-markets board job/store/compute/providers — world-markets domain (consumed by api + markets worker + web wm/global/regions) | — (none static) |
| `markets/providers.ts` | engine domains/world-markets | The world-markets board job/store/compute/providers — world-markets domain (consumed by api + markets worker + web wm/global/regions) | engine:markets/compute.ts, engine:markets/index.ts, engine:markets/job.ts (+1 tests) |
| `markets/run.ts` | engine domains/world-markets | The world-markets board job/store/compute/providers — world-markets domain (consumed by api + markets worker + web wm/global/regions) | engine:markets/index.ts (+1 tests) |
| `markets/store.ts` | engine domains/world-markets | The world-markets board job/store/compute/providers — world-markets domain (consumed by api + markets worker + web wm/global/regions) | engine:fx/store.ts, engine:markets/index.ts, engine:markets/run.ts (+1 tests) |
| `narrator/cloudflare-ai-client.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/cloudflare-ai-client.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts (+1 tests) |
| `narrator/gemini-client.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/gemini-client.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/cloudflare-ai-client.ts, engine:narrator/index.ts, engine:narrator/model-client.ts (+1 tests) |
| `narrator/hash.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/hash.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts, engine:narrator/section-state.ts (+1 tests) |
| `narrator/index.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | api:narrator-cron.ts (+1 tests) |
| `narrator/model-client.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/cloudflare-ai-client.ts, engine:narrator/index.ts |
| `narrator/overall-state.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts, engine:narrator/prompt.ts, engine:narrator/template.ts, engine:narrator/validate.ts (+2 tests) |
| `narrator/prompt.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/prompt.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts (+1 tests) |
| `narrator/section-state.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/section-state.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts, engine:narrator/overall-state.ts, engine:narrator/prompt.ts, engine:narrator/template.ts +1 more (+3 tests) |
| `narrator/state.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/state.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts, engine:narrator/section-state.ts (+1 tests) |
| `narrator/template.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/template.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts (+2 tests) |
| `narrator/validate.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/validate.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts, engine:narrator/prompt.ts, engine:narrator/template.ts (+3 tests) |
| `narrator/vocabulary.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/vocabulary.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts, engine:narrator/overall-state.ts, engine:narrator/prompt.ts, engine:narrator/section-state.ts +2 more (+4 tests) |
| `narrator/wordlists.test.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | — (none static) |
| `narrator/wordlists.ts` | stays: narrator | Cross-cutting narrator (all domains) — stays its own folder (vocabulary.generated.json moves with it) | engine:narrator/index.ts, engine:narrator/template.ts, engine:narrator/validate.ts (+2 tests) |
| `page-division/doc.test.ts` | stays: page-division (contract) | The engine-pages contract — MUST NOT move (constraint 4; placement.ts is the placement authority, 13/13 gate) | — (none static) |
| `page-division/doc.ts` | stays: page-division (contract) | The engine-pages contract — MUST NOT move (constraint 4; placement.ts is the placement authority, 13/13 gate) | engine:page-division/index.ts (+1 tests) |
| `page-division/index.ts` | stays: page-division (contract) | The engine-pages contract — MUST NOT move (constraint 4; placement.ts is the placement authority, 13/13 gate) | api:routes/insights-pages.ts, routes/page-division/EconomicLinkagesPage.tsx, routes/page-division/GlobalPage.tsx, routes/page-division/asia-tiles.ts +11 more (+25 tests) |
| `page-division/placement.test.ts` | stays: page-division (contract) | The engine-pages contract — MUST NOT move (constraint 4; placement.ts is the placement authority, 13/13 gate) | — (none static) |
| `page-division/placement.ts` | stays: page-division (contract) | The engine-pages contract — MUST NOT move (constraint 4; placement.ts is the placement authority, 13/13 gate) | engine:page-division/doc.ts, engine:page-division/index.ts, engine:page-division/projection.ts (+2 tests) |
| `page-division/projection.test.ts` | stays: page-division (contract) | The engine-pages contract — MUST NOT move (constraint 4; placement.ts is the placement authority, 13/13 gate) | — (none static) |
| `page-division/projection.ts` | stays: page-division (contract) | The engine-pages contract — MUST NOT move (constraint 4; placement.ts is the placement authority, 13/13 gate) | engine:page-division/index.ts (+1 tests) |
| `parsers.test.ts` | engine shared | parsers test (co-located) | — (none static) |
| `parsers.ts` | engine shared | Fixture parsers for every domain (all domains) | engine:adapters/abs-au.ts, engine:adapters/abs.ts, engine:adapters/ecb.ts, engine:adapters/frankfurter.ts +3 more (+4 tests) |
| `prices/brent-front-month.test.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | — (none static) |
| `prices/brent-front-month.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | engine:adapters/collect.ts, engine:prices/providers.ts (+1 tests) |
| `prices/definitions.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | engine:prices/index.ts, engine:prices/job.ts, engine:prices/merge.ts, engine:prices/providers.ts +1 more (+1 tests) |
| `prices/index.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | api:adapters/insights-store.ts, api:cron.ts, api:routes/insights-pages.ts, api:routes/insights.ts (+4 tests) |
| `prices/job.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | engine:prices/index.ts (+1 tests) |
| `prices/merge.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | engine:prices/index.ts (+1 tests) |
| `prices/prices.test.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | — (none static) |
| `prices/providers.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | engine:prices/index.ts, engine:prices/job.ts (+1 tests) |
| `prices/store.ts` | engine shared | The live-prices job (brent+gold+silver+btc hourly overlay) — cross-domain: gold hero + commodities cards + global ribbon (deviation from skeleton: engine shared, not commodities) | engine:prices/index.ts, engine:prices/job.ts (+1 tests) |
| `real-yield-fill.test.ts` | engine domains/gold | real-yield-fill test (co-located) | — (none static) |
| `real-yield-fill.ts` | engine domains/gold | DGS10−T10YIE real-yield fill for the gold meter inputs | engine:index.ts, engine:ingest/run.ts (+1 tests) |
| `ruleVersion.ts` | engine shared | Rule version + changelog — every scoring rule | engine:adapters/snapshot.ts, engine:index.ts |
| `scoring.test.ts` | engine shared | scoring test (co-located) | — (none static) |
| `scoring.ts` | engine shared | The scoring engine — every indicator | engine:adapters/derived.ts, engine:adapters/snapshot.ts, engine:index.ts, engine:ingest/run.ts +3 more (+4 tests) |
| `series.test.ts` | engine shared | series test (co-located) | — (none static) |
| `series.ts` | engine shared | Canonical time-series shape — every parser/adapter/engine module | engine:adapters/abs-au.ts, engine:adapters/abs.ts, engine:adapters/auctions.ts, engine:adapters/bazg.ts +61 more (+21 tests) |
| `signals.test.ts` | engine domains/gold | signals test (co-located) | — (none static) |
| `signals.ts` | engine domains/gold | Gold+silver signal checklist engine (validation.ts reads it — documented shared→gold edge) | engine:index.ts, engine:validation.ts (+1 tests) |
| `site-mode-overrides.test.ts` | engine shared | Pins data/site-mode-overrides.json ↔ audit sidecar (public-mode gate) | — (none static) |
| `sources.test.ts` | engine shared | sources test (co-located) | — (none static) |
| `sources.ts` | engine shared | Source risk/acceptance table — every source | engine:adapters/abs-au.ts, engine:adapters/collect.ts, engine:adapters/rung2.ts, engine:adapters/snapshot.ts +5 more (+2 tests) |
| `store.test.ts` | engine shared | store test (co-located) | — (none static) |
| `store.ts` | engine shared | Insights KV storage contract — all boards (markets/fx/markets-au/tic/prices) | api:adapters/insights-store.ts, api:index.ts, api:narrator-cron.ts, api:routes/insights-pages.ts +4 more (+11 tests) |
| `tic/compute.ts` | engine domains/usa | The TIC board job/store/compute/model/parse — usa domain (consumed by api + UsaTicSection + narrator/section-state edge) | engine:tic/index.ts (+1 tests) |
| `tic/index.ts` | engine domains/usa | The TIC board job/store/compute/model/parse — usa domain (consumed by api + UsaTicSection + narrator/section-state edge) | api:index.ts, api:insights-extra-rungs.ts, api:narrator-cron.ts, api:routes/insights.ts +3 more (+2 tests) |
| `tic/job.ts` | engine domains/usa | The TIC board job/store/compute/model/parse — usa domain (consumed by api + UsaTicSection + narrator/section-state edge) | engine:tic/index.ts (+1 tests) |
| `tic/model.ts` | engine domains/usa | The TIC board job/store/compute/model/parse — usa domain (consumed by api + UsaTicSection + narrator/section-state edge) | engine:tic/index.ts, engine:tic/job.ts (+1 tests) |
| `tic/parse.ts` | engine domains/usa | The TIC board job/store/compute/model/parse — usa domain (consumed by api + UsaTicSection + narrator/section-state edge) | engine:tic/index.ts, engine:tic/job.ts, engine:tic/model.ts (+1 tests) |
| `tic/store.ts` | engine domains/usa | The TIC board job/store/compute/model/parse — usa domain (consumed by api + UsaTicSection + narrator/section-state edge) | engine:tic/index.ts, engine:tic/job.ts (+1 tests) |
| `tic/tic.test.ts` | engine domains/usa | The TIC board job/store/compute/model/parse — usa domain (consumed by api + UsaTicSection + narrator/section-state edge) | — (none static) |
| `validation-step3.test.ts` | engine shared | validation-step3 test (co-located) | — (none static) |
| `validation-step3.ts` | engine shared | Step-3 pure checks over the baseline fixture (cross-domain) | engine:markets/run.ts (+1 tests) |
| `validation.test.ts` | engine shared | validation test (co-located) | — (none static) |
| `validation.ts` | engine shared | T-01…T-14 validation suite — runs after every fetch, before publish (reads gold signals + gauges) | engine:adapters/snapshot.ts, engine:ingest/data.ts, engine:ingest/run.ts (+2 tests) |

### Shared core — 23 files

| File | Proposed target | Reason | Primary importers (compressed) |
|---|---|---|---|
| `alerts.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `alerts.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts (+1 tests) |
| `batch.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `batch.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts (+1 tests) |
| `calc.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `calc.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts (+1 tests) |
| `currencies.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `currencies.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:alerts.ts, core:batch.ts, core:format.ts, core:index.ts +1 more (+3 tests) |
| `errors.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:batch.ts, core:calc.ts, core:format.ts, core:index.ts +2 more (+3 tests) |
| `format.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `format.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:batch.ts, core:index.ts (+1 tests) |
| `index.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | api:adapters/insights-store.ts, api:adapters/kv-store.ts, api:admin.ts, api:cron.ts +260 more (+116 tests) |
| `math.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `math.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts (+1 tests) |
| `meta.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `meta.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts (+1 tests) |
| `schemas.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `schemas.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts, core:math.ts, core:meta.ts (+2 tests) |
| `settle.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `settle.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts (+1 tests) |
| `split.test.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) — test (co-located) | — (none static) |
| `split.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts (+1 tests) |
| `version.ts` | no move | Verified: 13 cohesive modules, one barrel — LEAVE ALONE (calc/batch/settle/split are tool cores; schemas is the insights contract; format/math/errors app-wide) | core:index.ts |

### API Worker — 52 files

| File | Proposed target | Reason | Primary importers (compressed) |
|---|---|---|---|
| `access-mode.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `access-mode.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:adapters/access-mode-store.ts, api:index.ts, api:insights-auth.ts, api:routes/insights.ts (+2 tests) |
| `adapters/access-mode-store.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts, api:routes/insights.ts |
| `adapters/insights-store.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `adapters/insights-store.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts (+2 tests) |
| `adapters/kv-store.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `adapters/kv-store.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:default-service.ts (+1 tests) |
| `admin.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `admin.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:routes/admin.ts (+1 tests) |
| `audit-sidecar.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `audit-sidecar.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:insights-export.ts, api:routes/insights.ts (+1 tests) |
| `contact.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `contact.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:insights-export.ts (+1 tests) |
| `contract.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `cron.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts (+1 tests) |
| `default-service.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:cron.ts, api:index.ts |
| `history.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `history.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:cron.ts, api:routes/rates.ts (+1 tests) |
| `http.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts, api:routes/admin.ts, api:routes/insights-narrative.ts, api:routes/insights-pages.ts +4 more |
| `index.scheduled.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `index.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `index.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:cron.ts, api:default-service.ts, api:http.ts, api:ingest-watchdog.ts +14 more (+8 tests) |
| `ingest-watchdog.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `ingest-watchdog.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:cron.ts (+1 tests) |
| `insights-auth.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `insights-auth.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:routes/insights.ts (+5 tests) |
| `insights-export.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `insights-export.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:routes/insights.ts (+1 tests) |
| `insights-extra-rungs.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `insights-extra-rungs.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:cron.ts, api:insights-ingest-cron.ts, api:routes/internal.ts (+1 tests) |
| `insights-ingest-cron.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:cron.ts, api:routes/internal.ts (+2 tests) |
| `insights-narrative.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `insights-sweep.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `narrator-cron.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `narrator-cron.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:cron.ts, api:routes/insights-narrative.ts (+2 tests) |
| `narrator-stats.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:narrator-cron.ts (+1 tests) |
| `owner-auth.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `owner-auth.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:routes/insights.ts (+2 tests) |
| `public-mode.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:access-mode.ts, api:adapters/insights-store.ts, api:routes/insights.ts |
| `rates-service.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `rates-service.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:admin.ts, api:default-service.ts, api:index.ts, api:routes/admin.ts +3 more (+4 tests) |
| `routes/admin.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts |
| `routes/insights-mitigations.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `routes/insights-narrative.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts (+1 tests) |
| `routes/insights-pages.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `routes/insights-pages.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:routes/insights.ts |
| `routes/insights.test.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE — test (co-located) | — (none static) |
| `routes/insights.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts |
| `routes/internal.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts |
| `routes/ops.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts |
| `routes/rates.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts |
| `security.ts` | no move | Verified: already route-split + DI-composed + adapters isolated (Phase-3 split done historically) — LEAVE ALONE | api:index.ts, api:insights-auth.ts, api:owner-auth.ts, api:routes/admin.ts +2 more (+2 tests) |

### Scraper package — 11 files

| File | Proposed target | Reason | Primary importers (compressed) |
|---|---|---|---|
| `errors.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE | scraper:frankfurter.ts, scraper:index.ts, scraper:tgju.ts (+2 tests) |
| `frankfurter.test.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE — test (co-located) | — (none static) |
| `frankfurter.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE | scraper:index.ts (+1 tests) |
| `http.test.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE — test (co-located) | — (none static) |
| `http.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE | scraper:frankfurter.ts, scraper:index.ts, scraper:tgju.ts (+1 tests) |
| `index.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE | api:adapters/kv-store.ts, api:default-service.ts, api:rates-service.ts (+3 tests) |
| `raw-html.d.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE | — (none static) |
| `store.test.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE — test (co-located) | — (none static) |
| `store.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE | scraper:index.ts (+1 tests) |
| `tgju.test.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE — test (co-located) | — (none static) |
| `tgju.ts` | no move | The TGJU/Frankfurter scrapers + RateStore port — tiny, clean, api-only — LEAVE ALONE | scraper:frankfurter.ts, scraper:index.ts (+1 tests) |

### Markets Worker — 4 files

| File | Proposed target | Reason | Primary importers (compressed) |
|---|---|---|---|
| `crons.ts` | no move | The scheduled markets/fx/au-markets cron Worker (4 files) — LEAVE ALONE (imports engine via exports map) | markets:index.ts (+2 tests) |
| `index.scheduled.test.ts` | no move | The scheduled markets/fx/au-markets cron Worker (4 files) — LEAVE ALONE (imports engine via exports map) — test (co-located) | — (none static) |
| `index.test.ts` | no move | The scheduled markets/fx/au-markets cron Worker (4 files) — LEAVE ALONE (imports engine via exports map) — test (co-located) | — (none static) |
| `index.ts` | no move | The scheduled markets/fx/au-markets cron Worker (4 files) — LEAVE ALONE (imports engine via exports map) |  (+2 tests) |

---

## Deliverable 2 — the overlapping-items map

Everything that spans more than one domain, with the recommended HOME and how the mirror relationship is preserved. The placement table (`placement.ts`) already declares the data-side homes + mirrors; **the code structure follows it**: the home domain's folder owns the code; other pages read via imports (mirrors) — exactly how the engine tables work today.

### 2.1 The prompt's known overlaps — verified

| Item | Verified home (placement.ts) | Mirrors / cross-reads | Code HOME (this audit) | Mirror preserved by |
|---|---|---|---|---|
| `brent` | `/commodities` (energy group) | `/` ribbon (gold-usd + brent + btc via `globalRibbon`); prices-heat gauge voter → `/usa` strip; `/gold` meter (prices-heat lane) | engine `shared/adapters/` (fred + eia + yahoo legs) + engine `shared/prices/` (hourly overlay) + web `shared/components/PricesBoard.tsx` (rendered by CommoditiesTierCards) | placement mirrors (engine-derived); ribbon reads via `global-tiles` |
| `gold-usd`, `gold-silver`, `gold-btc`, `gold-aud` | `/gold` (ratios group; gold-usd = hero card) | `gold-usd` → `/` ribbon (explicit mirror input); `gold-btc` does **NOT** mirror to `/commodities` digital — D-27 keeps it on `/gold` (verified: placement note "gold-btc stays on /gold"); btc-**usd** (the price, not the ratio) is the commodities digital card | `features/gold` + engine `shared/adapters/{worldbank,goldapi}.ts` (gold column / XAU spot) + engine `shared/prices/` | placement mirrors; ribbon input list |
| `usd-reserve-share` | `/currencies` (dollar-standing group) | `/usa` dedollar tile + `/` dedollarization verdict (both via gold-voter mirrors) | `engine domains/currencies` (`adapters/cofer.ts`) | `GOLD_VOTER_IDS` engine-derived mirrors |
| `nyfed-custody` | `/usa` (tier-2 rates/fed) | `/` dedollar tile (gold-voter mirror); `/gold` meter voter | engine `shared/adapters/fred.ts`; display: `features/usa` (TicSection) + legacy TicCustodyCard (legacy-only today — noted for §19.6: usa owns the custody display going forward) | `GOLD_VOTER_IDS` mirrors |
| `euro-hicp` | `/europe` (eu-members) | prices-heat gauge voter → `/usa` D-30 verdict strip + `/` gauge tiles (the retired US-global-reach container is gone; gauge membership stays) | engine `shared/adapters/fred.ts` (the euro-area HICP series) | `THEMATIC_GAUGE_MEMBER_IDS` mirrors |
| `copper-usd` vs `copper-gold` | copper PRICE → `/commodities` (metals); copper/Gold RATIO → `/gold` (ratios) | both derive from the same Pink Sheet copper column + GoldAPI HG spot | engine `shared/adapters/{worldbank,goldapi}.ts` — ONE adapter serves both domains (cannot split per-domain) | placement groups (metals vs ratios) |
| `iron-ore`, `coal-aus`, `lng-japan` | `/commodities` (energy/metals) | AU gauge seat chips (D-19/D-27 moved the cards out; `AU_GAUGE_MEMBER_IDS` keeps the mirrors) | engine `shared/adapters/worldbank.ts` | `AU_GAUGE_MEMBER_IDS` engine-derived mirrors |
| `china-property-investment`, `china-steel-output` | `/asia-pacific` (china group, D-35) | AU gauge seat chips (originally AU context cards) | `engine domains/asia-pacific` (`adapters/nbs.ts` + manual fixtures) | `AU_GAUGE_MEMBER_IDS` mirrors |
| `audusd`, `audjpy`, `audnzd` | `/currencies` (pairs group, D-32/D-42) | AU gauge seat chips | `engine domains/currencies` (`adapters/frankfurter.ts`) | `AU_GAUGE_MEMBER_IDS` mirrors |
| `nz-short-rate`, `nz-10y` | `/asia-pacific` (pacific-nz group) | AU Markets board carries NZX50; the S21 Pacific—NZ mirror card renders in the asia page | `engine shared/adapters/{oecd,rung2}.ts` (NZL monthly series; derived build); display: `features/asia-pacific/AsiaNzx50Card` reads `lib/markets-au` + `au-markets/shared` (documented asia→australia edge) | placement pacific-nz note (BD-S21b) |
| `gpr-australia` | `/australia` (au-world-risk; AF-4: registry section is GLOBAL, placement home is AU) | — | engine `shared/adapters/monthly-indexes.ts` (GPR family) | AF-4 recorded (both layers true) |
| `gpr-china`, `gpr-taiwan` | **`/asia-pacific`** (china group — verified) | — | engine `shared/adapters/monthly-indexes.ts` | placement ASIA china group |
| `gpr-index/threats/acts/daily/russia/ukraine/israel/saudi` | **`/world-markets`** (world-risk group — verified) | gauge voters where applicable | engine `shared/adapters/monthly-indexes.ts` | placement WORLD_MARKETS group |
| The 10 connection cards | `/australia` (4), `/usa` (2), `/economic-linkages` (4) | Together renders each page's subset via `onlyIds` | engine `shared/connections.ts` (constraint: cannot split) + web `features/economic-linkages/` (Together + ConnectionCard + connection-groups as the connection-cards feature home; AU/USA import with onlyIds) | `connection-groups.ts` + `onlyIds` filter |
| 5 thematic gauges | voters span every domain | Global's verdict tiles + USA's D-30 strip re-derive verdicts client-side | engine `shared/gauges.ts` (constraint: stays shared) | `THEMATIC_GAUGE_MEMBER_IDS` mirrors |
| 37 gold voters | span usa rates, eu rates, gold, currencies, commodities | gold seat chips + Global's Gold Balance tile | engine `shared/gold-score.ts` (constraint: stays shared — **overrides the skeleton's domains/gold listing**) | `GOLD_VOTER_IDS` mirrors |

### 2.2 New overlaps found by the audit (not in the prompt's list)

| # | Item | Span | HOME | Notes |
|---|---|---|---|---|
| N1 | `usa-backtest-core.ts` | **ALL domains** — every `<domain>-backtest-core.ts` imports it (asia, australia, commodities, currencies, europe, world-markets); it is the universal backtest harness despite the usa name | `features/usa` (keeps its name; no rename — the bundle-budget gate and pd-* scripts match basenames) | Optional follow-up (owner decision, NOT in this program): extract the harness into `shared/backtest/`. Recorded, never silently fixed |
| N2 | `usa-tiles.ts` + `usa-backtest-core.ts` → `global-tiles.ts` | usa ↔ global | `features/usa` imports `features/global` | Documented cross-domain edge (D-30 strip mirrors gauge verdicts) |
| N3 | `world-markets/shared.tsx` | 22 importers: world-markets page + GlobalBoard + all 4 region pages + legacy | `features/world-markets/components/world-markets/` | The region/global pages import from the wm domain — the documented mirror pattern |
| N4 | `world-markets/{verdict-core,WorldMap,world-map-config,world-map-rows}` | world-markets + global (tiles/backtest) + 4 region pages (RegionIndexSection, region zoom) | `features/world-markets/components/world-markets/` | Same pattern; `world-map-geo.json` (not a .ts file) moves WITH the folder and `build-world-map.mjs` `geoOutPath` must be updated in the same commit |
| N5 | `signals/outlook-core.ts` | gold (signals/verdict, gold-backtest, gold-tiles) + global (global-backtest-core, global-tiles) | `shared/components` | Cross-domain (gold+global) → shared |
| N6 | `lib/markets.ts` | GlobalPage + WorldMarketsPage + RegionIndexSection + legacy | `shared/lib` | Cross-domain snapshot client |
| N7 | `lib/fx.ts` | CurrenciesPage + GlobalPage + legacy | `shared/lib` | Cross-domain snapshot client |
| N8 | `lib/fx-presentation/rules.ts` | CurrenciesRuleLights (currencies) + global tiles/backtests + legacy presentation | `features/currencies` | Global imports the rules from currencies (mirror pattern) |
| N9 | `TicSection`/`lib/tic.ts` | UsaTicSection (+ legacy world-feeds) | `features/usa` | Legacy borrows |
| N10 | `PricesBoard` price cluster (PricesBoard, PriceSparkline, PriceDetails, price-stats, price-trend, chart-range) | commodities (CommoditiesTierCards) + legacy (DetailsPanel, Insights) | `shared/components` | Whole cluster moves as one unit (cluster-internal imports); GlobalPage does NOT import PricesBoard (verified) — skeleton deviation documented |
| N11 | `AustralianMarkets`/`lib/markets-au.ts`/`au-markets/shared.ts` | AustraliaPage + AsiaNzx50Card (asia) + legacy | `features/australia` | Asia imports from australia (the NZX50 board home is /australia per D-17/BD-S21b) |
| N12 | `lib/insights.ts`, `useInsightsCopy`, `HistoryChart`, `VerdictMeter`, `TrendChart`, `StatusChip`, `config/*`, `i18n/*` | every domain + legacy | `shared/` | The shared layer (Phase 2) |
| N13 | Engine `shared/adapters/fred.ts` (66 series), `yahoo.ts`, `worldbank.ts`, `goldapi.ts`, `monthly-indexes.ts`, `oecd.ts`, `derived.ts`, `collect/rung2/rung4` | 2–5 domains each | `engine shared/adapters/` | Cross-domain by indicator census (see inventory); `derived.ts` is the ~170-id assembly hub — cannot split |
| N14 | Engine `narrator/` | all domains (section/overall state over every reading) | stays its own folder | `narrator/section-state.ts` imports `tic/index` (usa) — engine-internal documented edge |
| N15 | Engine `prices/` job | gold hero overlay + commodities live cards + global ribbon (serve-time merge into `/api/insights`) | `engine shared/prices/` | **Skeleton deviation:** the prompt skeleton placed it under commodities; the audit shows 3 domains consume the merge → engine shared. Owner decides at Phase 3 |
| N16 | Engine `signals.ts` (gold+silver checklists) | gold display + `shared/validation.ts` reads it | `engine domains/gold` | Shared→gold documented edge (validation stays shared) |
| N17 | `basket.ts` (dollar basket) | fx job/entries (currencies) + `adapters/derived.ts` (shared assembly) | `engine domains/currencies` | Shared→currencies documented edge |
| N18 | Legacy `/insights` (Insights.tsx + insights-sections) | super-consumer of EVERY domain | `features/insights-legacy` | Retirement (§19.6) = one-folder delete + the documented legacy-import edges disappear |

### 2.3 The one structural inversion worth fixing during the move

`components/insights/world-currencies/DollarStrength.tsx` imports `routes/insights-sections/QuestionGroup.tsx` — the ONLY components→routes edge (a folder-level cycle). Both files are legacy-only and land in `features/insights-legacy/` together; the inversion dissolves when the folder is deleted at §19.6. No action needed beyond keeping both in the legacy tree.

---

## Deliverable 3 — the proposed folder structure

The prompt's skeleton, refined by the audit (refinements marked; every deviation is evidence-based and reversible at owner review):

```
apps/web/src/
  main.tsx                      # STAYS at src root (index.html references /src/main.tsx)
  globals.d.ts                  # STAYS at src root (ambient decl)
  infrastructure/               # the app shell (16 files)
    App.tsx  router.ts  router.test.ts
    Header.tsx  Footer.tsx  ErrorBoundary.tsx  PageBreadcrumbs.tsx  InstallButton.tsx
    Modal.tsx                   # generic overlay (skeleton: infrastructure; sole consumer today: WM briefing)
    icons/                      # currena.tsx (brand, 14 consumers) + FlowChevron.tsx
    route-meta.ts  theme.ts  use-alert-evaluation.ts   # shell-only libs (deviation: skeleton said shared/lib — evidence: App/Header only)
  shared/                       # cross-domain (81 files)
    components/                 # AlertCard-class EXCEPT the legacy-only ones (see deviations) —
                                #   HistoryChart, TrendChart, MarketsChart, VerdictMeter, StatusChip, SectionVerdictLine,
                                #   PriceDetails, PriceSparkline, PricesBoard(+cluster: price-stats, price-trend, chart-range),
                                #   GlossaryTip, outlook-core (signals/), layer1/, Sparkline, CurrencySelect,
                                #   destinations.ts, DestinationBody.tsx, PagePlaceholder.tsx, RegionIndexSection.tsx,
                                #   region-zoom-backtest-core.ts  (the page-division shared layer)
    config/                     # index barrel (42 importers), display, bands, labels, movers, sections, signals,
                                #   hero, money, history-config  (companies.ts + us-global-reach.ts → insights-legacy)
    hooks/                      # useInsightsCopy (6 domains), use-roving-keys, useDialogFocus
    lib/                        # api, insights, markets, fx, narrative, page-division, snapshot-store, rate-history,
                                #   live-rate, alerts, display, download, id, locale, xlsx-writer, registry-sync
    i18n/                       # index, en, fa, insights-copy-en, insights-copy-fa
                                #   (read by the narrator-vocab generator, selfcheck GHA, persian-copy gate —
                                #    their paths update in the same commits)
    ui/                         # ui.tsx (the 32-importer UI kit)
  features/
    gold/                       # 22 files: GoldPage/Hero/Seats/Positions/BalanceClassic/Context + gold-tiles +
                                #   gold-backtest-core + tests (copy-pin, frozen, backtest)
      components/               # Signals.tsx + signals/ (verdict, BalanceScale, BalanceWeight, MergedCard, icons)
                                #   [outlook-core → shared/components]
    commodities/                # 8 files: CommoditiesPage/TierCards + tiles + backtest + tests
    usa/                        # 15 files: UsaPage/TierCards/TicSection/VerdictStrip + tiles + backtest + copy-pin +
                                #   usa-tic-copy + TicSection.test + lib/tic
    europe/                     # 8 files: EuropePage/TierCards + tiles + backtest + tests
    asia-pacific/               # 9 files: AsiaPage/TierCards/AsiaNzx50Card + tiles + backtest + tests
    australia/                  # 14 files: AustraliaPage/TierCards + tiles + backtest + board-copy + tests +
                                #   AustralianMarkets + MoneyPanel + au-markets/ + lib/markets-au
    currencies/                 # 20 files: CurrenciesPage/TierCards/PairBoard/RuleLights + tiles + backtest + tests +
                                #   world-currencies/display.ts + lib/fx-presentation/*
    world-markets/              # 31 files: WorldMarketsPage/Hero/Briefing/Grids + world-map-copy + tiles + backtest +
                                #   tests + MarketsChart + components/world-markets/ (the 17-file subfolder incl.
                                #   world-map-geo.json — moves with the folder; build-world-map.mjs updates in lockstep)
    economic-linkages/          # 5 files: EconomicLinkagesPage + Together + ConnectionCard + connection-groups +
                                #   together-signals.test
    global/                     # 16 files: GlobalPage/GlobalBoard/WorldRiskCards + global-tiles + global-backtest-core +
                                #   global-page-states + tests + HeroBlock + TopMoversStrip + NextUpStrip + ics +
                                #   hero-editorial.test
    insights-legacy/            # 50 files: Insights.tsx + insights-sections/ + the legacy-only components
                                #   (AboutTheData, AlertCard, CardMeta, CompactRow, CompaniesTable, DataExportMenu/Panel,
                                #   DetailsPanel, InTheNews, JumpNav, MovesNextStrip(dead), NarrativeBlock, PositionBar,
                                #   TicCustodyCard, ToolsMenu, WorldCurrencies, WorldMarkets, about-sources, clamp-panel,
                                #   full-export, fx-csv, insights-csv, markets-csv, config/companies, config/us-global-reach,
                                #   world-currencies/ legacy subtree, UsGlobalReachGroup(dead) + tests)
                                #   §19.6 retirement = delete this folder + remove the router entry + the App lazy import
  features-tools/               # the founding surfaces (49 files)
    converter/                  # Converter + converter/ children + AlertsDialog, AmountInput, LiveRateLine, Odometer,
                                #   RateDeltaChip, ResultPopup, recent-pairs
    settle/                     # Settle + settle/ children + settle-storage, photo-store
    receipt/                    # Receipt + receipt/ children
    live-rates/                 # LiveRates + LedGoldBoard, LedRateBoard, led/LedParts
    calculator/  history/  about/  splitter/  batch/   # + lib/history.ts → features-tools/history

packages/insights/src/
  index.ts                      # STAYS — the root barrel, re-exports from domains/ + shared/ (57 importers stay alive)
  page-division/                # STAYS — the engine-pages contract (placement.ts authority; 13/13 gate)
  narrator/                     # STAYS — cross-cutting (vocabulary.generated.json moves with it if ever)
  domains/
    gold/                       # gold-balance, gold-backtest-core, gold-lane-calibration(test), breakeven-tilt,
                                #   real-yield-fill, gf-p0-proposed, signals.ts  [gold-score.ts → shared: CONSTRAINT]
      adapters/                 # cftc, sge, sge-monthly, bazg (swiss-gold-flow), gold-equities
    commodities/                # adapters: eia, eia-stocks, portwatch, fng, bitstamp
                                #   [prices/ + goldapi → engine shared: audit deviation]
    usa/                        # tic/ (the whole board job) + adapters: treasury, auctions, credit, rstar,
                                #   cleveland, sp500-breadth, uom
    europe/                     # adapters: ecb, boe
    asia-pacific/               # adapters: nbs, mof, imf-cpi
    australia/                  # markets-au/ (the board job) + adapters: abs, abs-au, rba
    currencies/                 # fx/ (the board job) + basket.ts + adapters: frankfurter, cofer
    world-markets/              # markets/ (the board job)  [yahoo, portwatch…: portwatch is commodities; yahoo is shared]
    companies/                  # companies/ (feature-flagged OFF; future home when the flag flips)
  shared/                       # the cross-domain engine
    definitions.ts  gauges.ts  gold-score.ts  connections.ts     # the four constraint-locked tables
    scoring.ts  freshness.ts  validation.ts  validation-step3.ts  sources.ts  licences.ts  parsers.ts
    series.ts  store.ts  ruleVersion.ts                              # engine plumbing
    prices/                     # the live-prices job (brent+gold+silver+btc hourly) — audit deviation from skeleton
    ingest/                     # the ingestion plumbing (data.ts bundles root data/ JSONs — depth-sensitive)
    adapters/                   # cross-domain + infrastructure adapters: fred, yahoo, worldbank, goldapi,
                                #   monthly-indexes, oecd, derived, collect, collect-gates(test), snapshot,
                                #   snapshot-gates(test), rung2(+inputs), rung4(+inputs), fetch-policy, types, biff,
                                #   xlsx, zip, manual, index (barrel), + the cross-adapter test files
                                #   (eia-cftc.test, oecd-monthly.test, worldbank-derived.test, s6-nz.test,
                                #    brent-gapfill.test — split to follow subjects at move time)

apps/api/src/                   # NO MOVE (verified route-split; 11 insights-subpath imports stay stable via exports map)
packages/core/src/              # NO MOVE (verified clean)
packages/scraper/src/           # NO MOVE
apps/markets/src/               # NO MOVE
```

### 3.1 Deviations from the prompt's skeleton (all evidence-based; owner decides)

| # | Skeleton said | Audit says | Evidence |
|---|---|---|---|
| D1 | `gold-score.ts` under `domains/gold/` | **engine `shared/`** | The prompt's own constraint 5 ("gold-score.ts stays in a shared engine folder — the 37 voters span USA rates, EU rates, gold, currencies, commodities"). The skeleton line is corrected to match the constraint. `gold-balance`, `gold-backtest-core`, `gold-lane-calibration`, `breakeven-tilt`, `real-yield-fill`, `gf-p0-proposed`, `signals.ts` DO go to `domains/gold/` |
| D2 | `engine/` prices/ under commodities | **engine `shared/prices/`** | The prices job serves the gold-usd hero overlay (gold), the commodities live cards, and the Global ribbon — 3 domains; consumers are `apps/api` serve-time merge + the `/api/insights/prices` route |
| D3 | `PricesBoard.tsx` under `global/components` | **web `shared/components`** | Importers: CommoditiesTierCards + legacy Insights + 2 tests. GlobalPage never imports it (Global renders its own ribbon via global-tiles). The whole price cluster (PriceDetails, PriceSparkline, price-stats, price-trend) moves together as shared |
| D4 | The flat card system (AlertCard, CompactRow, CardMeta, PositionBar, DetailsPanel, NarrativeBlock, InTheNews, AboutTheData, JumpNav, ToolsMenu, DataExportMenu/Panel) under `shared/components` | **`features/insights-legacy/`** | Every one of these is imported ONLY by the legacy page/sections (or by each other). Putting them in shared would leave dead shared code after §19.6 retirement. StatusChip/VerdictMeter/HistoryChart/TrendChart/SectionVerdictLine/DetailsPanel-adjacent genuinely cross-domain pieces DO stay shared (see inventory) |
| D5 | `ResultPopup.tsx` under infrastructure | **`features-tools/converter/`** | Sole importer: Converter.tsx |
| D6 | `swiss-gold-flow.ts` "(if it exists)" | exists as `adapters/bazg.ts` | BAZG/FOCBS Swiss customs gold-imports CSV — mapped to `domains/gold/adapters/` |
| D7 | `layout.tsx` under infrastructure | does not exist | No such file; the shell is App.tsx + Header/Footer |
| D8 | hooks list mentions use-mobile, use-toast | neither exists in this repo | The actual hooks: useInsightsCopy, use-roving-keys, useDialogFocus (+ use-alert-evaluation, shell) |
| D9 | `fred-us.ts` (usa adapters) | `fred.ts` stays **engine shared** | 66 series: usa-dominant but 12 keys pin it cross-domain (brent/wti/natgas → commodities; bund/gilt/italy → europe; jgb/boj/nz-10y → asia; DTWEXBGS/EMEGS → currencies; JPNASSETS → global-liquidity) |
| D10 | `gpr.ts`, `gscpi.ts` as world-markets adapters | **`monthly-indexes.ts` (shared)** serves GPR (5 domains) + GSCPI | One workbook adapter serves gpr-index/threats/acts/daily/russia/ukraine/israel/saudi (world-markets), gpr-china/taiwan (asia), gpr-australia (australia), EPU/TPU (usa), GSCPI (commodities) |

---

## Deliverable 4 — the phased migration plan

Every phase is ONE commit (or a short series, each green), `pnpm gates` green at every commit, rollback = `git revert <sha>`. No file renames anywhere (the bundle-budget gate matches route-module basenames: `GoldPage-*.js` etc. — moving without renaming keeps gate 8 green). Order: shared first (it has no domain dependencies), then domains biggest-first to flush coupling early (as the prompt recommends), legacy before tools so the tool moves land in a tree where every domain + shared edge is already settled.

### Phase 0 — the audit + the plan (THIS SESSION)
No code moves. Output: this document. Commit: `modularization-audit(M0): the audit + the plan`.

### Phase 1 — the folder skeleton (M1)
- **Moves:** none. Create `apps/web/src/{features/<10 domains>,shared/{components,config,hooks,lib,i18n,ui},features-tools/<9 tools>,infrastructure}` + `packages/insights/src/{domains/<9 domains>,shared/{adapters,prices,ingest}}` with a one-paragraph `README.md` per folder stating scope (borrow the reason column of the inventory).
- **Updates:** `eslint.config.mjs` globs + per-package `tsconfig.json` `include` arrays extended to the new roots (see risk R12) — this can land here or with the first move; landing it here makes every later diff clean.
- **Gates:** full run (no behavior change).
- **Risk:** none (empty folders + docs). **Rollback:** revert.

### Phase 2 — move the shared layer (M2)
- **Moves (~81 web files):** components/insights cross-domain set (HistoryChart, TrendChart, MarketsChart, VerdictMeter, StatusChip, SectionVerdictLine, price cluster, GlossaryTip, layer1/, outlook-core, useInsightsCopy) + config/ (10 files) + shared libs (api, insights, markets, fx, narrative, page-division, snapshot-store, rate-history, live-rate, alerts, display, download, id, locale, xlsx-writer) + i18n (5) + ui.tsx + hooks + tool-shared components (CurrencySelect, Sparkline) + page-division shared files (destinations, DestinationBody, PagePlaceholder, RegionIndexSection, region-zoom-backtest-core). ENGINE side: `shared/` root modules (definitions, gauges, gold-score, connections, scoring, freshness, validation, validation-step3, sources, licences, parsers, series, store, ruleVersion) + `shared/adapters/` (cross-domain + infra adapters) + `shared/prices/` + `shared/ingest/` — with the **exports-map targets updated in the same commit** (`./ingest`, `./prices`, `./store`, `./validation`, `./adapters` entries; entry NAMES unchanged).
- **Import rewrites (codemod):** per moved file F with new path P: rewrite `from '<rel>/F'` → `from '<rel>/P'` in all importers (the import graph gives the exact list — 2,572 edges total; the shared layer touches roughly 900 of them). Also: `scripts/gates.mjs:100` layer1 path; `scripts/lib/persian-copy.mjs` SOURCES (i18n paths) — manifest re-triage via `pnpm copy:audit:update`; `packages/insights/scripts/generate-narrator-vocabulary.ts` + `selfcheck.ts` + `ingest.ts` web-i18n imports; `scripts/generate-indicators-registry.ts` (config/display + insights modules); `scripts/generate-placement-table.ts`; `scripts/s24-d9-audit.ts`; `scripts/local-seed-fixtures.ts`; `scripts/narrator-eval*.mjs`; `apps/web/scripts/build-world-map.mjs` (only if world-markets moves — not this phase); depth-sensitive `data/*.json` imports re-counted per moved file (see risk R8).
- **Gates:** full run + `pnpm registry:generate` + `pnpm placement:generate` (regenerated docs reviewed — drift recorded, never silently absorbed).
- **Risk:** highest edge count of all phases. **Rollback:** revert the commit.

### Phase 3 — move the domains, biggest first (M3–M12, one domain per session/commit)
Order + contents (web + engine moves together per domain; every domain commit updates the exports-map targets for its engine subfolders + the pd-s* backtest-script imports for its tiles):

1. **usa** (M3): 15 web files + `lib/tic` + engine `tic/` (7) + 7 usa adapters (12 with tests). Exports-map: `./tic`. Cross-domain edges to keep green: usa-backtest-core imported by every other domain (they still point at the usa folder — allowed), usa-tiles→global-tiles (global not yet moved — temporary cross-tree import is fine, relative rewrites only).
2. **world-markets** (M4): 31 web files (incl. the 17-file subfolder + world-map-geo.json) + engine `markets/` (8). **Same-commit update:** `build-world-map.mjs` `geoOutPath`; `WorldMap.tsx`/`zoom.test.ts` `./world-map-geo.json` import; region pages' + GlobalBoard's imports of wm shared files (already shared-moved in Phase 2 for the 5 cross-domain files — the rest are wm-internal).
3. **australia** (M5): 14 web files + engine `markets-au/` (8) + 3 adapters. Exports-map: `./markets-au(+/definitions)`. AsiaNzx50Card's imports of `au-markets/shared` + `lib/markets-au` become cross-domain (asia→australia) — documented.
4. **commodities** (M6): 8 web files + 5 adapters. (prices/ + goldapi already shared since Phase 2.)
5. **currencies** (M7): 20 web files (incl. fx-presentation/ + world-currencies/display.ts) + engine `fx/` (16) + basket + 2 adapters. Exports-map: `./fx(+/definitions)`.
6. **gold** (M8): 22 web files + engine gold modules (12 + tests) + 5 adapters. gold-score already shared (Phase 2, constraint).
7. **asia-pacific** (M9): 9 web files + 4 adapters (3 + test).
8. **europe** (M10): 8 web files + 2 adapters (3 with test).
9. **economic-linkages** (M11): 5 web files. connections.ts already shared.
10. **global** (M12): 16 web files (incl. HeroBlock, TopMoversStrip, NextUpStrip, ics).

- **Import rewrites:** same codemod (importer lists from the graph); App.tsx lazy-route paths per domain (`import('./features/<d>/<D>Page')`); each domain's `*-tiles.test.ts` reads of `shared/config/display` already updated in Phase 2.
- **Gates:** full run per domain commit + bundle-budget (gate 8 proves the lazy chunks still split per route).
- **Risk:** cross-domain edges (N1–N11 map) — each documented; a move that breaks a cross-domain importer is caught by typecheck (gate 1) and the 15,023 tests. **Rollback:** revert the domain commit.

### Phase 4 — isolate the legacy /insights folder (M13)
- **Moves (~50 files):** `routes/Insights.tsx` + `routes/insights-sections/*` (10) + the legacy-only components enumerated in the tree + `config/{companies,us-global-reach}.ts` + the world-currencies legacy subtree + legacy export utils (full-export, fx-csv, insights-csv, markets-csv, clamp-panel) + their tests.
- **Updates:** App.tsx lazy import path (`./features/insights-legacy/Insights`); `selfcheck.ts` full-export path; persian-copy manifest re-triage.
- **Owner decision before this phase (not blocking):** delete or keep the two dead files (MovesNextStrip, UsGlobalReachGroup + us-global-reach) — recommend a standalone `chore(M0-pre)` delete commit first so the legacy folder contains only live code.
- **Gates:** full run. **Rollback:** revert.

### Phase 5 — move the founding tools (M14)
- **Moves (~49 files):** the 9 tool routes + converter/ (7) + settle/ (8) + receipt/ (5) children + tool components (AlertsDialog, AmountInput, LiveRateLine, Odometer, RateDeltaChip, ResultPopup, Led*, led/LedParts) + tool libs (recent-pairs → converter; settle-storage, photo-store → settle; history → history).
- **Updates:** App.tsx lazy paths (Converter, LiveRates eager import, etc.).
- **Gates:** full run + bundle-budget (the tool chunks are basename-keyed: `Converter-*.js` etc. — no renames, gate stays green). **Rollback:** revert.

### Phase 6 — config + chunking verification pass (M15)
- **Verify:** `vite.config.ts` (manualChunks is `undefined` — chunking rides the route-level lazy imports; the only requirement is the dynamic import paths in App.tsx are correct — already done per phase); bundle-budget regexes (12 basename patterns — green because nothing was renamed); `index.html` (`/src/main.tsx` — main.tsx never moved); PWA manifest/shortcuts (hash-router URLs, unaffected).
- **Update if not already landed in earlier phases:** eslint globs, tsconfig includes, gates.mjs layer1 path, persian-copy SOURCES/SWEEP_ROOTS, exports-map target paths (final review), the two wrangler `main` paths (unchanged — apps untouched).
- **Fix opportunistically (pre-existing, dev-only):** `scripts/local-snapshot-preview.mjs:12` hardcodes a nonexistent absolute path `/home/z/my-project/Currena`.
- **Gates:** full run ×2 (clean tree, then `git status` empty). **Rollback:** revert.

### Phase 7 — the documentation pass (M16)
- **Update:** `AGENTS.md` (§11 project facts — folder layout), `README.md`, `docs/page-division/README.md` (the "where things live" section), `docs/HANDOFF.md`, `CHANGELOG.md`, `docs/DECISIONS.md` (record the D1–D10 skeleton deviations + the N-map), file-header "lives here" comments in the moved files (a light pass — headers already say what each file is; add the folder-scope line only where the header names a stale path).
- **Gates:** full run. **Rollback:** revert.

---

## Deliverable 5 — risks + mitigations

| # | Risk | Severity | Mitigation (concrete, per the path-risk register) |
|---|---|---|---|
| R1 | **The placement contract moves or drifts.** `page-division/placement.ts` is the engine-pages authority (`homePageOfIndicator`/`pageHomeIds`/`pageReadingIds`; 13/13 test gate) | Critical | Constraint: the folder NEVER moves (Phase 2 explicitly excludes it); `scripts/generate-placement-table.ts` imports `@currena/insights/page-division` (exports-map name — stable); `doc.test.ts` pins PLACEMENT.generated.md byte-for-byte — any drift fails gates |
| R2 | **The engine's cross-domain tables get split per-domain** (definitions/gauges/gold-score/connections) | Critical | Constraint-locked: all four move to `engine shared/` in Phase 2 (D1 resolves the skeleton contradiction in favor of the constraint); the inventory marks each with "constraint: stays shared" |
| R3 | **Barrels break mid-move** — `@currena/insights` root (57 importers), `adapters` (runner-only), web `config/index` (42), `components/insights/layer1/index` | High | Barrels MOVE WITH their folders and keep re-exporting the moved modules (Phase 2 rewrites their internal export paths; external importers unchanged); only after every importer is verified do later phases slim them — never in the same commit as a move |
| R4 | **The exports map (15 entries) breaks consumers** — apps/api (11 subpaths), apps/markets (3), web (several) | High | Entry NAMES are frozen; only the target paths inside `packages/insights/package.json` change, in the SAME commit as each engine move; typecheck (gate 1) + the api contract tests (414) catch any miss |
| R5 | **The bundle-budget gate reds on renames** — 12 basename-keyed chunk patterns (`GoldPage-*.js` …) | High | HARD RULE: no file renames in any phase (moves only). Gate 8 doubles as the rename detector |
| R6 | **The 15,023 tests mirror source structure** — vitest default discovery picks up moved `*.test.ts` wherever they land | High | Tests always move WITH their subjects (co-located, per the inventory's test rows); `pnpm -r run test` runs per-package vitest over the whole package root — no config change needed; layer1-strict gate needs its one path string updated in `gates.mjs:100` when layer1 moves (Phase 2) |
| R7 | **The Persian-copy audit + narrator vocabulary break** — SOURCES list 4 dictionary paths; SWEEP_ROOTS 6 src roots; a 7,996-entry path-keyed manifest; the vocab generator TS-imports the web dictionaries; the selfcheck GHA imports web components | High | (a) Update SOURCES + the generator/selfcheck/ingest imports in the same commit as the i18n move (Phase 2); (b) add the new roots to SWEEP_ROOTS; (c) re-triage the manifest via `pnpm copy:audit:update` with a fresh report (expected: REMOVED+NEW pairs for moved files — a reviewable diff, ~1h); (d) narrator `vocabulary.generated.json` regenerated in lockstep (`pnpm narrator:vocabulary`), vocab gate re-run |
| R8 | **Depth-sensitive root-`data/` JSON imports** — 22 sites across all three code packages count `../` levels into `data/*.json` | High | The codemod re-counts depth per moved file (mechanical: `path.relative` in the codemod, not hand-counting); typecheck + the JSON-importing tests (registry-sync, placement tests, global-backtest) catch any miss |
| R9 | **Cross-tree script imports** — 11 `apps/web/scripts/pd-s*-backtest.ts` + 8 root scripts + 204 `../src/` imports across 45 engine scripts | High | Each phase's checklist includes its scripts (the inventory + path-risk register name them per file); `pnpm registry:generate` + `placement:generate` + `s24:d9-audit` re-run in Phase 2/3 gates |
| R10 | **GHA workflows depend on web src layout** — daily insights-ingest reads `apps/web/src/i18n/*`; insights-selfcheck imports web components | Medium | Same-commit updates (R7); the workflows themselves run package-filtered commands with no src paths — no workflow-file changes needed |
| R11 | **The world-map generated asset** — `build-world-map.mjs` writes `world-map-geo.json` INTO src (`components/insights/world-markets/`) | Medium | Phase 4 (world-markets) updates `geoOutPath` (L48) in the same commit as the folder move; `WorldMap.tsx`/`zoom.test.ts` relative `./world-map-geo.json` imports move with the folder unchanged |
| R12 | **eslint/tsconfig scopes silently narrow** — `eslint.config.mjs` globs + per-package tsconfig `include: ["src"]` don't cover sibling roots | Medium | Phase 1 extends both (rules keep applying to `features/`, `shared/`, `features-tools/`, `infrastructure/`, `domains/`); lint gate (0 errors 0 warnings) + typecheck would surface gaps |
| R13 | **The legacy super-consumer pins domain files** — every domain component keeps a legacy importer until Phase 4 | Low (by design) | Established pattern: domain owns, legacy borrows; Phase 4 collects the legacy-only remainder; §19.6 retirement stays one-folder |
| R14 | **Codemod regex over-matches** (a `from './shared'` in a comment, a similar filename) | Medium | Codemod anchored to full import-statement regex + the importer list from the import graph as the source of truth; typecheck (gate 1) + lint (gate 2) + full tests close the loop; every commit is revertible |
| R15 | **Dead/dangling code confuses the move** (MovesNextStrip, UsGlobalReachGroup, us-global-reach.ts) | Low | Owner decision first (A: delete in a `chore(M0-pre)` commit; B: move as-is into insights-legacy). Recorded, not silently deleted |
| R16 | **Broken window commits** — a phase lands red "to fix forward" | Critical | House rule: gates green at EVERY commit; a red move is reverted and re-planned (this doc's rollback column) |

---

## Deliverable 6 — the execution estimate

Per phase: files moved, import-rewrite edges (approx, from the import graph), expected session time (agent session, includes gates runs + verification), gates runtime (full `pnpm gates` ≈ 2m37s per the S30 record; expect 2–3 runs per phase).

| Phase | Files moved | Import edges rewritten | New-path/config updates | Session time | Gates runs |
|---|---|---|---|---|---|
| P0 audit (this session) | 0 | 0 | this doc | — | 1 (baseline) |
| P1 skeleton | 0 (folders + 31 READMEs) | 0 | eslint globs, 6 tsconfig includes | ~0.5h | 1 |
| P2 shared layer | ~81 web + ~75 engine = **156** | ~900 (config barrel 42, i18n 80, locale 88, insights client, engine barrel re-exports) | exports map (7 entries), gates.mjs, persian-copy (SOURCES + SWEEP_ROOTS + manifest re-triage ~1h), 5 root scripts, 3 engine scripts, vocab regen | **4–5h** (the heaviest) | 3–4 |
| P3.1 usa | 15 web + 7 lib/tic… ~34 total | ~120 | exports `./tic`, pd-s4/s9 scripts | ~2h | 2 |
| P3.2 world-markets | 31 web + 8 engine = 39 | ~150 (shared.tsx alone has 22) | exports `./markets(+/definitions)`, build-world-map geoOutPath, pd-s7/s21 scripts | ~2.5h | 2–3 |
| P3.3 australia | 14 web + 11 engine = 25 | ~90 | exports `./markets-au(+/definitions)`, pd-s16 | ~1.5h | 2 |
| P3.4 commodities | 8 web + 7 engine = 15 | ~60 | pd-s8/s18 | ~1h | 2 |
| P3.5 currencies | 20 web + 19 engine = 39 | ~140 | exports `./fx(+/definitions)`, pd-s10/s17 | ~2.5h | 2–3 |
| P3.6 gold | 22 web + 19 engine = 41 | ~130 | pd-s5/s14 | ~2.5h | 2–3 |
| P3.7 asia-pacific | 9 web + 6 engine = 15 | ~50 | pd-s12 | ~1h | 2 |
| P3.8 europe | 8 web + 3 engine = 11 | ~40 | pd-s15 | ~1h | 2 |
| P3.9 economic-linkages | 5 web | ~20 | — | ~0.5h | 2 |
| P3.10 global | 16 web | ~70 | pd-s5(global backtest) | ~1.5h | 2 |
| P4 insights-legacy | ~50 | ~110 (Insights.tsx's own edges + legacy components) | App lazy path, selfcheck import, manifest re-triage | ~2h | 2–3 |
| P5 tools | ~49 | ~130 | App lazy paths | ~2h | 2 |
| P6 config/chunking pass | 0 | 0 | verification + opportunistic local-snapshot-preview fix | ~1h | 2 |
| P7 documentation | 0 (docs) | 0 | AGENTS/README/page-division docs + header pass | ~1.5h | 1 |
| **TOTAL** | **~610 files** (~550 moved + 90 verified-no-move; 31 engine files stay put) | **~2,100 edges** | | **~28–32 h** across 16 sessions (M1–M16) | ~35 full runs ≈ 1.5h gates time |

**Why the estimate is trustworthy:** the edge counts come from the measured import graph, not guesswork; the phases with the highest counts (P2 shared, P3.2 world-markets, P3.5 currencies, P3.6 gold) are exactly the ones the audit identified as shared hubs (42/80/88-importer barrels, the 22-importer world-markets shared layer). The 15,023 tests + typecheck + lint + budget gates catch every missed rewrite at each step — the cost of a mistake is a revert, never a broken main.
