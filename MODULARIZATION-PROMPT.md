# Session goal — audit the Currena codebase and orchestrate a semantic modularization plan

## The current state (verified at commit b03d01d, 2026-11-14)

The TM7–TM24 migration series just finished redistributing every legacy
`/insights` indicator to a dedicated destination page. The reconciliation
verdict (`packages/insights/src/page-division/placement.ts` →
`placement.test.ts`, 13/13 green) confirms:

- 187 registry ids, 187 placed, 0 unplaced, 0 duplicate homes, 0 orphans.
- 10 destination pages: `/` (Global, 0 cards / 52 mirrors), `/gold` (14 + 4
  blocked), `/world-markets` (9), `/usa` (72), `/europe` (8),
  `/asia-pacific` (14), `/australia` (28), `/commodities` (24),
  `/currencies` (14), `/economic-linkages` (0 cards, 10 connection cards).
- `/insights` is zero-card-capable by construction (TM24).
- 15,023 tests pass (web 13,226 + insights 1,383 + api 414).

**BUT the codebase is NOT semantically modularized.** The redistribution
moved *data placement* (which indicator renders on which page); it did
NOT move the *code* into per-domain folders. Today every domain's code is
scattered across three flat trees:

1. `apps/web/src/components/insights/` — ONE flat folder with ~60 files
   for ALL domains: Signals (gold verdict), Together (connection cards),
   PricesBoard, HeroBlock, TopMoversStrip, AustralianMarkets, TicSection,
   CompaniesTable, WorldCurrencies, AboutTheData, NarrativeBlock,
   MoneyPanel, AlertCard, CompactRow, CardMeta, StatusChip, VerdictMeter,
   PositionBar, SectionVerdictLine, DetailsPanel, JumpNav, ToolsMenu,
   DataExportMenu, DataExportPanel, HistoryChart, TrendChart, MarketsChart,
   PriceSparkline, PriceDetails, PriceTrend, PriceStats, NextUpStrip,
   MovesNextStrip, full-export, insights-csv, fx-csv, markets-csv, ics,
   freshness-line, hero-editorial, price-trend, price-value-parts,
   chart-range, money-direction, markets-verdict, round2, step2, etc. +
   subfolders `world-markets/` (16 files), `world-currencies/` (9 files),
   `au-markets/` (2 files), `signals/` (7 files), `layer1/` (3 files),
   `config/` (10 files).

2. `apps/web/src/routes/page-division/` — ONE flat folder with ~80 files
   for ALL 10 destination pages: GoldPage, GoldHero, GoldSeats,
   GoldPositions, GoldBalanceClassic, GoldContext, gold-tiles,
   gold-backtest-core, gold-copy-pin, gold-frozen-scenarios, UsaPage,
   UsaTierCards, UsaTicSection, UsaVerdictStrip, usa-tiles,
   usa-backtest-core, usa-copy-pin, usa-tic-copy, EuropePage,
   EuropeTierCards, europe-tiles, europe-backtest-core, europe-copy-pin,
   AsiaPage, AsiaTierCards, AsiaNzx50Card, asia-tiles, asia-backtest-core,
   asia-copy-pin, AustraliaPage, AustraliaTierCards, australia-tiles,
   australia-backtest-core, australia-copy-pin, australia-board-copy,
   CommoditiesPage, CommoditiesTierCards, commodities-tiles,
   commodities-backtest-core, commodities-copy-pin, CurrenciesPage,
   CurrenciesTierCards, CurrenciesPairBoard, CurrenciesRuleLights,
   currencies-tiles, currencies-backtest-core, currencies-copy-pin,
   WorldMarketsPage, WorldMarketsHero, WorldMarketsBriefing,
   WorldMarketsGrids, world-markets-tiles, world-markets-backtest-core,
   world-markets-copy-pin, world-map-copy, EconomicLinkagesPage,
   GlobalPage, GlobalBoard, WorldRiskCards, global-tiles,
   global-backtest-core, global-copy-pin, global-page-states,
   region-zoom-backtest-core, RegionIndexSection, PagePlaceholder,
   DestinationBody, destinations + ~30 test files.

3. `apps/web/src/routes/insights-sections/` — the legacy /insights
   section components (QuestionGroup, SectionLane, InsightsHeader,
   InsightsStatusBlocks, UsGlobalReachGroup, world-feeds,
   useInsightsToolsNav, DeprecationBanner, data-health).

4. `packages/insights/src/` — the engine, also flat with ~30 adapter
   files in `adapters/` (abs, abs-au, auctions, bazg, biff, boe, brent-gap,
   cftc, cofer, collect, collect-gates, credit, derived, ecb, eia,
   eia-cftc, eia-stocks, fetch-policy, fng, frankfurter, fred, gold-equities,
   goldapi, imf-cpi, manual, mof, monthly-indexes, nbs, oecd, oecd-monthly,
   portwatch, rba, rung2, rung2-inputs, rung4, rung4-inputs, rstar, sge,
   sge-monthly, snapshot, snapshot-gates, sp500-breadth, treasury, types,
   worldbank, worldbank-derived, xlsx, yahoo, zip) + the cross-cutting
   modules at the root (definitions, gauges, gold-score, gold-balance,
   gold-backtest-core, gold-lane-calibration, breakeven-tilt, real-yield-fill,
   signals, scoring, freshness, validation, sources, parsers, store, series,
   ruleVersion, gap-leg-guard, gauges, licences, basket, connections,
   validation-step3, gf-p0-proposed) + subfolders `adapters/`, `companies/`,
   `fx/`, `markets-au/`, `markets/`, `narrator/`, `page-division/`,
   `prices/`, `tic/`.

**The problem:** to develop the `/gold` page further (e.g. add a new gold
ratio card), a developer must read across 6+ folders and ~15 files
(`components/insights/Signals.tsx`, `components/insights/signals/*`,
`routes/page-division/GoldPage.tsx`, `routes/page-division/GoldHero.tsx`,
`routes/page-division/GoldSeats.tsx`, `routes/page-division/GoldPositions.tsx`,
`routes/page-division/gold-tiles.ts`, `routes/page-division/gold-backtest-core.ts`,
`routes/page-division/gold-copy-pin.test.ts`, `packages/insights/src/gold-score.ts`,
`packages/insights/src/gold-balance.ts`, `packages/insights/src/adapters/cftc.ts`,
`packages/insights/src/adapters/sge.ts`, `packages/insights/src/adapters/sge-monthly.ts`,
`packages/insights/src/adapters/goldapi.ts`, `data/indicators.json` entries
filtered by gold ids). The same scatter applies to every other domain.

## The goal — semantic modularization by domain

Restructure the codebase so that **everything for one domain lives in one
folder**, and **shared code lives in a shared folder**, so a developer
working on (say) `/gold` reads ONE folder and sees the page, the tiles,
the backtest core, the copy pins, the engine score, the adapters, and the
test — without grepping across the tree.

The 10 destination domains are the natural axis. Each domain folder should
contain:
- the page component (e.g. `GoldPage.tsx`)
- the page's child components (hero, seats, positions, tier cards, etc.)
- the page's tiles, backtest-core, copy-pin, frozen-scenarios
- the page's engine-side modules (score, balance, adapters) — where the
  domain owns them outright
- the page's tests (co-located)

Plus shared folders for:
- cross-domain UI primitives (AlertCard, CompactRow, DetailsPanel,
  NarrativeBlock, etc. — used by every page)
- cross-domain engine primitives (definitions, gauges, scoring,
  freshness, validation, narrator, page-division placement contract)
- the legacy `/insights` page (slated for §19.6 retirement, isolated in
  its own folder so the retirement is a one-folder delete)
- the converter/settle/receipt/live-rates/calculator/history/about/splitter/batch
  tools (the founding surfaces, each its own folder)

## What to do in THIS session — AUDIT + PLAN, do NOT execute

You are asked to **audit the codebase and orchestrate a plan**. Do NOT
move any files yet. The owner will review the plan first.

### Deliverable 1 — the file inventory

Produce a complete inventory of every `.ts`/`.tsx` file in:
- `apps/web/src/` (components, routes, lib, hooks, i18n, router)
- `packages/insights/src/` (engine)
- `packages/core/src/` (shared core — verify it's already small/clean)
- `apps/api/src/` (the Worker — verify it's already route-split)

For each file, record:
- current path
- proposed target domain folder (gold / commodities / usa / europe /
  asia-pacific / australia / currencies / world-markets /
  economic-linkages / global / insights-legacy / shared / converter /
  settle / receipt / live-rates / calculator / history / about / splitter
  / batch / tools)
- one-line reason for the assignment
- the file's primary importers (who depends on it — this drives the
  shared-vs-domain decision)

### Deliverable 2 — the overlapping-items map

Identify every indicator / adapter / component that spans MORE THAN ONE
domain. These are the hardest to place; the audit must call them out
explicitly with a recommended home + a "mirror" relationship documented.
Known overlaps to investigate:

- `brent` — home `/commodities`, mirrored to `/` (the prices ribbon) and
  read by the gold meter as a prices-heat voter.
- `gold-usd`, `gold-silver`, `gold-btc`, `gold-aud` — home `/gold`, but
  `gold-btc` is mirrored to `/commodities`'s digital section? (verify)
  and `gold-usd` is mirrored to `/` (the prices ribbon).
- `usd-reserve-share` — home `/currencies`, mirrored to `/usa` (the
  dedollar tile) and `/` (the dedollarization verdict).
- `nyfed-custody` — home `/usa` (TIC section), mirrored to `/` (the
  dedollarization tile) and read by the gold meter.
- `euro-hicp` — home `/europe`, mirrored to `/usa` (the US-global-reach
  container, retired by TM10 but the gauge membership stays).
- `copper-usd` — home `/commodities`, but `copper-gold` (the ratio) is
  home `/gold`. The adapter `worldbank-cmo` serves both.
- `iron-ore`, `coal-aus`, `lng-japan` — home `/commodities` (energy
  group), but they were originally AU context cards (D-19/D-27) and the
  AU gauge seat chips still mirror them.
- `china-property-investment`, `china-steel-output` — home `/asia-pacific`
  (china group), but originally AU context cards; the AU gauge mirrors
  them.
- `audusd`, `audjpy`, `audnzd` — home `/currencies` (pairs), but AU gauge
  seat chips mirror them.
- `nz-short-rate`, `nz-10y` — home `/asia-pacific` (pacific-nz), but AU
  Markets board carries NZX50 and the S21 Pacific—NZ mirror card.
- `gpr-australia` — home `/australia` (AF-4: registry section is global,
  placement home is AU).
- `gpr-china`, `gpr-taiwan`, `gpr-russia`, `gpr-ukraine`, `gpr-israel`,
  `gpr-saudi` — home `/asia-pacific` (china group) or `/world-markets`
  (world-risk group)? Verify which is the home.
- The 10 connection cards — split across `/australia` (4),
  `/usa` (2), `/economic-linkages` (4); the `Together.tsx` component
  + `ConnectionCard.tsx` + `connection-groups.ts` are shared, with an
  `onlyIds` filter.
- The 5 thematic gauges (borrowing-costs, prices-heat, market-stress,
  dollar-strength, growth-health) — their voters span every domain;
  `gauges.ts` is the engine-side single source, can't be split.
- The 37 gold voters — span USA rates, EU rates, gold prices, currencies,
  commodities; `gold-score.ts` + `GOLD_LANE_VOTERS` can't be split.

For each overlap, recommend: (a) which folder the file's HOME is,
(b) how the mirror relationship is preserved (the placement table already
declares this — the code structure should follow it).

### Deliverable 3 — the proposed folder structure

Propose the target tree. Recommended skeleton (refine based on the audit):

```
apps/web/src/
  features/
    gold/                    # the /gold page + its engine + adapters
      GoldPage.tsx
      GoldHero.tsx
      GoldSeats.tsx
      GoldPositions.tsx
      GoldBalanceClassic.tsx
      GoldContext.tsx
      gold-tiles.ts
      gold-backtest-core.ts
      gold-copy-pin.test.ts
      gold-frozen-scenarios.test.ts
      components/
        Signals.tsx          # the gold+silver verdict strip
        signals/             # verdict, BalanceScale, BalanceWeight, icons, outlook-core, MergedCard
      engine/
        gold-score.ts
        gold-balance.ts
        gold-backtest-core.ts
        gold-lane-calibration.ts
        breakeven-tilt.ts
        real-yield-fill.ts
      adapters/
        cftc.ts
        sge.ts
        sge-monthly.ts
        goldapi.ts
        swiss-gold-flow.ts   # if it exists
      tests/
        *.test.ts
    commodities/
      CommoditiesPage.tsx
      CommoditiesTierCards.tsx
      commodities-tiles.ts
      commodities-backtest-core.ts
      commodities-copy-pin.test.ts
      components/
        PriceTile.tsx        # the template
        TimeframeSelector.tsx
      engine/
        prices/              # the prices job/store/providers/merge
        brent-front-month.ts
      adapters/
        eia.ts
        eia-stocks.ts
        eia-cftc.ts
        worldbank-cmo.ts
        fng.ts               # crypto-fng
    usa/
      UsaPage.tsx
      UsaTierCards.tsx
      UsaTicSection.tsx
      UsaVerdictStrip.tsx
      usa-tiles.ts
      usa-backtest-core.ts
      usa-copy-pin.test.ts
      usa-tic-copy.ts
      engine/
        tic/                 # the TIC job/store/compute/parse/model
      adapters/
        fred-us.ts           # the USA-specific FRED adapters
        treasury.ts
        auctions.ts
        sp500-breadth.ts
        monthly-indexes.ts
        credit.ts
        rstar.ts
    europe/
      EuropePage.tsx
      EuropeTierCards.tsx
      europe-tiles.ts
      europe-backtest-core.ts
      europe-copy-pin.test.ts
      adapters/
        ecb.ts
        boe.ts
        oecd-europe.ts
    asia-pacific/
      AsiaPage.tsx
      AsiaTierCards.tsx
      AsiaNzx50Card.tsx
      asia-tiles.ts
      asia-backtest-core.ts
      asia-copy-pin.test.ts
      adapters/
        nbs.ts
        mof.ts
        imf-cpi-asia.ts
        oecd-asia.ts
        s6/                  # the NZ adapters
    australia/
      AustraliaPage.tsx
      AustraliaTierCards.tsx
      australia-tiles.ts
      australia-backtest-core.ts
      australia-copy-pin.test.ts
      australia-board-copy.ts
      components/
        AustralianMarkets.tsx
        au-markets/          # briefing, shared
        MoneyPanel.tsx
      engine/
        markets-au/          # the AU markets job/store/compute/providers
      adapters/
        abs.ts
        abs-au.ts
        rba.ts
        s5/                  # the ABS fixtures
    currencies/
      CurrenciesPage.tsx
      CurrenciesTierCards.tsx
      CurrenciesPairBoard.tsx
      CurrenciesRuleLights.tsx
      currencies-tiles.ts
      currencies-backtest-core.ts
      currencies-copy-pin.test.ts
      components/
        WorldCurrencies.tsx
        world-currencies/    # DollarStrength, PatternCard, DollarRow, etc.
      engine/
        fx/                  # the FX job/store/compute/summary/entries/maths/pairs/providers/rules/weekly
      adapters/
        frankfurter.ts
        cofer.ts
    world-markets/
      WorldMarketsPage.tsx
      WorldMarketsHero.tsx
      WorldMarketsBriefing.tsx
      WorldMarketsGrids.tsx
      world-markets-tiles.ts
      world-markets-backtest-core.ts
      world-markets-copy-pin.test.ts
      world-map-copy.ts
      components/
        MarketsTreemap.tsx
        MarketTile.tsx
        MarketMovers.tsx
        MarketLogo.tsx
        WorldMap.tsx
        MarketsVerdict.tsx
        MarketsTable.tsx
        MarketsHeatmap.tsx
        world-markets/       # briefing, session, shared, verdict-core, world-map-rows, world-map-config, world-map-geo.json
      engine/
        markets/             # the world markets job/store/compute/providers
      adapters/
        yahoo.ts
        portwatch.ts
        gpr.ts               # the GPR family
        gscpi.ts
    economic-linkages/
      EconomicLinkagesPage.tsx
      components/
        ConnectionCard.tsx
        Together.tsx         # the onlyIds-filtered component
      connection-groups.ts
    global/
      GlobalPage.tsx
      GlobalBoard.tsx
      WorldRiskCards.tsx
      global-tiles.ts
      global-backtest-core.ts
      global-copy-pin.test.ts
      global-page-states.ts
      components/
        HeroBlock.tsx        # the verdict hero
        TopMoversStrip.tsx
        NextUpStrip.tsx      # the upcoming-events calendar
        PricesBoard.tsx      # the gold/silver/oil/bitcoin ribbon
    insights-legacy/         # the deprecated /insights page, isolated for §19.6 retirement
      Insights.tsx
      insights-sections/
        QuestionGroup.tsx
        SectionLane.tsx
        InsightsHeader.tsx
        InsightsStatusBlocks.tsx
        UsGlobalReachGroup.tsx
        world-feeds.ts
        useInsightsToolsNav.ts
        DeprecationBanner.tsx
        data-health.ts
      CompaniesTable.tsx     # the feature-flagged empty-state (no home yet)
  shared/                    # cross-domain
    components/              # AlertCard, CompactRow, CardMeta, StatusChip, VerdictMeter, PositionBar, SectionVerdictLine, DetailsPanel, NarrativeBlock, InTheNews, AboutTheData, JumpNav, ToolsMenu, DataExportMenu, DataExportPanel, HistoryChart, TrendChart, MarketsChart, PriceSparkline, PriceDetails, PriceTrend, PriceStats, MovesNextStrip, full-export, insights-csv, fx-csv, markets-csv, ics, freshness-line, hero-editorial, price-trend, price-value-parts, chart-range, money-direction, markets-verdict, clamp-panel
    config/                  # the sections/display/labels/bands/movers/history-config/signals/hero/money barrel — shared because the gauges/definitions engine reads it
    hooks/                   # useInsightsCopy, use-mobile, use-toast, use-roving-keys, useDialogFocus, use-alert-evaluation
    lib/                     # api, insights, snapshot-store, settle-storage, photo-store, page-division, route-meta, alerts, recent-pairs, rate-history, live-rate, fx-presentation, display, locale, id, download, xlsx-writer, registry-sync, narrative
    ui/                      # the existing shadcn/ui barrel
  features-tools/            # the founding surfaces
    converter/
    settle/
    receipt/
    live-rates/
    calculator/
    history/
    about/
    splitter/
    batch/
  infrastructure/            # the app shell
    App.tsx
    router.ts
    layout.tsx
    Header.tsx
    Footer.tsx
    ErrorBoundary.tsx
    PageBreadcrumbs.tsx
    InstallButton.tsx
    Modal.tsx
    ResultPopup.tsx
    icons/

packages/insights/src/
  domains/
    gold/                    # gold-score, gold-balance, gold-backtest-core, gold-lane-calibration, breakeven-tilt, real-yield-fill, signals (the engine side)
    commodities/             # prices/, brent-front-month
    usa/                     # tic/
    europe/
    asia-pacific/
    australia/               # markets-au/
    currencies/              # fx/
    world-markets/           # markets/
    companies/               # companies/ (already a subfolder)
  shared/                    # definitions, gauges, scoring, freshness, validation, sources, parsers, store, series, ruleVersion, gap-leg-guard, gauges, licences, basket, connections, validation-step3, gf-p0-proposed, the cross-cutting adapters (collect, collect-gates, fetch-policy, snapshot, snapshot-gates, derived, biff, xlsx, zip, manual, rung2, rung2-inputs, rung4, rung4-inputs, types)
  narrator/                  # stays (already a subfolder)
  page-division/             # stays (the engine-pages contract — placement.ts is the authority)
  index.ts                   # the barrel, re-exporting from domains/ + shared/
```

### Deliverable 4 — the migration plan (phased, with test gates)

Produce a phased rollout. Each phase is a SEPARATE COMMIT, each must leave
`pnpm gates` green (the 15,023 tests + lint + typecheck + secret-scan +
copy:audit + narrator + layer1 + build + budget). Recommended phasing:

- **Phase 0 — the audit + plan (this session).** No code moves. Output:
  this audit doc + the proposed structure + the phased plan below.
- **Phase 1 — create the folder skeleton.** Create empty
  `features/<domain>/` folders + `shared/` + `features-tools/` +
  `infrastructure/` + `packages/insights/src/domains/` +
  `packages/insights/src/shared/`. Add a README.md in each stating its
  scope. No moves yet — just the skeleton.
- **Phase 2 — move the shared layer first.** Move the cross-domain
  components/config/hooks/lib to `shared/`. Update every importer (a
  codemod — `find-and-replace` on import paths). Run gates. Commit.
- **Phase 3 — move ONE domain at a time, biggest first to flush
  cross-domain coupling early.** Recommended order:
  usa (72 cards, touches TIC + fred + treasury + auctions), then
  world-markets (16 indices + GPR + portwatch + gscpi), then
  australia (28 cards + AU markets + ABS + RBA), then
  commodities (24 cards + prices + EIA + worldbank-cmo), then
  currencies (14 cards + FX + frankfurter + cofer), then
  gold (14 cards + gold-score + cftc + sge + goldapi), then
  asia-pacific (14 cards + nbs + mof + imf-cpi), then
  europe (8 cards + ecb + boe), then
  economic-linkages (the connection cards), then
  global (the verdict board + hero + prices ribbon + calendar).
  Each domain move is its own commit; each must keep gates green.
- **Phase 4 — isolate the legacy /insights folder.** Move
  `apps/web/src/routes/Insights.tsx` + `routes/insights-sections/` into
  `features/insights-legacy/`. This is the §19.6 retirement prep — when
  the owner signs off, the retirement is a one-folder delete + a router
  entry removal.
- **Phase 5 — move the founding tools.** converter, settle, receipt,
  live-rates, calculator, history, about, splitter, batch — each into
  `features-tools/<name>/`.
- **Phase 6 — update the lazy-route chunking.** `vite.config.ts` may
  reference paths; verify and update. Update `tsconfig.json` path aliases
  if any. Run the bundle-budget gate.
- **Phase 7 — the documentation pass.** Update AGENTS.md, README.md,
  docs/page-division/README.md, the file-headers' "lives here" comments.

For each phase, document: (a) the exact files moved, (b) the import-path
rewrites (a codemod regex), (c) the test gates run, (d) the risk + the
rollback procedure (revert the commit).

### Deliverable 5 — risks + mitigations

Call out the structural risks:

1. **The placement table is the engine-pages contract.**
   `packages/insights/src/page-division/placement.ts` MUST stay in
   `packages/insights/src/page-division/` (not move into a domain) — it
   is the single source of truth that every page reads via
   `homePageOfIndicator(id)` / `pageHomeIds(page)` / `pageReadingIds(page)`.
   The `placement.test.ts` (13/13) gates the contract.

2. **The engine's cross-domain tables can't be split naively.**
   `definitions.ts` (the 187-id registry), `gauges.ts` (the 5 thematic
   + 2 shadow gauges), `gold-score.ts` (`GOLD_LANE_VOTERS` — 37 voters
   spanning USA rates, EU rates, gold, currencies, commodities),
   `connections.ts` (the 10 connection cards) — these are the engine's
   cross-domain single sources. They stay in `packages/insights/src/shared/`
   (or a dedicated `engine/` folder). Domain folders hold their
   domain-specific adapters + presentation, NOT the cross-domain engine.

3. **The barrel exports must stay alive during the move.**
   `packages/insights/src/index.ts` and
   `apps/web/src/components/insights/config/index.ts` are imported by ~50
   files. During the move, keep the barrels as re-exports from the new
   locations; only after every importer is updated can the barrels be
   slimmed.

4. **The lazy-route chunking in vite.config.ts.** Verify whether
   `manualChunks` references specific paths (it's currently `undefined`
   but the build output shows domain-named chunks like
   `WorldMarketsPage-C1byqgfd.js`, `GoldPage-...js`, etc. — these come
   from the route-level lazy imports, which should keep working as long
   as the dynamic `import('./features/gold/GoldPage')` paths are correct).

5. **The 15,023 tests mirror the source structure.** Test files move
  WITH their source files (co-located in the domain folder's `tests/`
  subfolder). The vitest config must pick up the new paths (verify
  `apps/web/vitest.config.ts` if it exists, or the workspace-level
  config).

6. **The Persian copy audit + the narrator vocabulary stay green.**
   The `scripts/audit-persian-copy.mjs` and the narrator vocab check
   reference specific file paths; verify they still find the copy
   dictionaries after the move.

7. **The `pnpm gates` script must stay green at EVERY commit.** No
   "broken window" commits. If a move breaks gates, revert and re-plan.

### Deliverable 6 — the execution estimate

Estimate per phase: number of files moved, number of import rewrites,
expected time, the test-gate runtime (the web suite is ~60s, insights
~20s, api ~10s; gates full run ~2m37s per the S30 record).

## The constraints (NON-NEGOTIABLE)

- **Next.js 16 + TypeScript 5 + pnpm workspace.** Don't propose a build
  system change.
- **The 15,023 tests must remain green at every commit.** A move that
  breaks tests is reverted, not "fixed forward".
- **The placement table contract (`placement.ts`) stays in
  `packages/insights/src/page-division/`.** It is NOT a domain file.
- **The engine's cross-domain tables (`definitions.ts`, `gauges.ts`,
  `gold-score.ts`, `connections.ts`) stay in a shared engine folder.**
  They cannot be split per-domain without breaking the gauge/gold-meter
  invariants.
- **The `/insights` page is preserved (isolated in `features/insights-legacy/`)
  until the §19.6 retirement gate.** Don't delete it.
- **The public surface (the SPA's hash-routed URLs + the Worker's SPA
  fallback) must keep working.** No route changes.
- **Each move is a separate commit.** A revert is `git revert <sha>`.
- **Credentials are provided for read + deploy; do NOT store them.**

## The credentials (provided separately by the owner at session kickoff)

The credentials are NOT stored in this file (GitHub's secret scanner
blocks commits containing live API tokens). The owner pastes them in the
session kickoff message. They are:

- GitHub: `assadigit/Currena` (token — owner provides)
- Cloudflare account ID (owner provides)
- Cloudflare API token (owner provides)
- Cloudflare Workers AI API (owner provides)
- EODHD stocks API key (owner provides)
- Deploy: `wrangler deploy --config apps/api/wrangler.jsonc` (after
  `pnpm --filter @currena/web run build`)

## The first step

Clone the repo, read the AGENTS.md + the docs/page-division/ folder +
the placement table + the gates script, then produce Deliverable 1 (the
file inventory) as a markdown table in
`docs/modularization/MODULARIZATION-AUDIT.md`. Then Deliverable 2 (the
overlapping-items map) as a section in the same doc. Then Deliverable 3
(the proposed folder structure) as a tree in the same doc. Then
Deliverable 4 (the phased migration plan) + Deliverable 5 (risks) +
Deliverable 6 (the estimate) as sections in the same doc. Commit the
audit doc as `modularization-audit(M0): the audit + the plan` and push.
Do NOT move any code in this session — the owner reviews the plan first.

The next session (M1) executes Phase 1 (the skeleton). The session after
that (M2) executes Phase 2 (the shared layer). And so on, one phase per
session, until Phase 7 closes the program.
