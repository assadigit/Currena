# Gold Page Redesign — Session 1: Section & Component Map

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Scope:** the `/gold` route exactly as rendered by `main` @ `884f2696` (== live production; see `01-current-state-audit.md` §3). Every claim below was read from source and, where marked, verified in the live DOM.

**Entry:** `apps/web/src/features/gold/GoldPage.tsx` (371 lines) — lazy route chunk (`App.tsx:63`), registered in `router.ts:34`, meta in `lib/route-meta.ts:38` (title `pd.gold.title`, canonical `/gold`).

**Data planes (the only fetches the page makes):**

| Plane | Client module | Endpoint | Cache |
|---|---|---|---|
| Gold projection (primary) | `shared/lib/page-division.ts` | `GET /api/insights/pages/gold` | memory promise + localStorage `currena:insights:page:gold` |
| Full insights snapshot | `shared/lib/insights.ts` | `GET /api/insights` | localStorage `currena:insights:snapshot` |
| Expectations | `gold-expectations.ts` | `GET /api/insights/gold-expectations` | localStorage `currena:insights:gold-expectations` |
| Premium history | `gold-premium.ts` | `GET /api/insights/gold-premium` | localStorage `currena:insights:gold-premium` |
| XAU OHLC (shared: chart + TA + grid + correlation) | `gold-xau.ts` | `GET /api/insights/gold-ohlc` | localStorage `currena:insights:gold-xau` |
| If-bought | `gold-ifbought.ts` | `GET /api/insights/gold-ifbought` | localStorage `currena:insights:gold-ifbought` |
| LBMA vault/clearing | `gold-lbma.ts` | `GET /api/insights/gold-lbma` | localStorage `currena:insights:gold-lbma` |
| CB tracker | `gold-cb.ts` | `GET /api/insights/gold-cb` | localStorage `currena:insights:gold-cb` |
| Currency crosses | `gold-crosses.ts` | `GET /api/insights/gold-crosses` | localStorage `currena:insights:gold-crosses` |
| Episodes (drop-gated) | `gold-episodes.ts` | `GET /api/insights/gold-episodes` (503 → waiting) | localStorage `currena:insights:gold-episodes` |
| Meter time machine | `gold-meter.ts` | `GET /api/insights/gold-meter?date=` | per-date session Map only (no localStorage) |
| Real-yield history (correlation leg) | in-file fetch `GoldCorrelation.tsx:45–65` | `GET /api/insights/real-yield-10y/history` | localStorage `currena:insights:gold-corr-yield` |
| TGJU snapshot (bridge live leg) | `useSnapshotStore` (App boot) | `GET /api/rates?source=tgju` | in-memory store |
| Silver history (Signals chip) | shared `TrendPanel` | `GET /api/insights/silver-usd/history` | module cache |

All dedicated clients: zod-validated, 20 s timeout, last-good localStorage, honest loading/error states.

---

## Render order (top → bottom)

### 1. Header block — `GoldPage.tsx:187–210`
Breadcrumbs (`components/PageBreadcrumbs.tsx`, Home › Gold) · `h1` `pd.gold.title` · purpose line `pd.gold.purpose` · data-as-of line (`pd.global.dataAsOf` / cached-copy sentence `pd.global.fromCache` replacing it — BD-S5a). Loading state: three-dot loader `pd.gold.loadingLine`; error state: `pd.gold.errorTitle/Text/Retry` + retry re-enters loader. No anchors.

### 2. GoldHero — `GoldHero.tsx` (452 lines) — Zone B
Two-column grid. Left: live price (`gold-usd`), signed 1d/7d changes with window tags, 10-year position band line, `pricesAsOf` stamp, COMEX market-state pill (`market-state.ts`, clock-only, zero fetch). Right: balance verdict block — classic ↔ minimal radio (persisted `currena:pd:gold:balance-view`, default classic), verdict word, `GoldBalanceClassic` **or** inline `BeamGlyph` SVG, Conditions-outlook line (7 states, `outlook-core.ts`), for/against/neutral/unread counts, 30-day context line. Closes with GoldTimeMachine (Zone C).
Anchors: `data-gold-hero`; radio ids `gold-balance-view-classic/-minimal`; live-verified `data-hero-verdict`, `data-hero-outlook-line`, `data-market-pill`.
Sub: **GoldBalanceClassic** (`GoldBalanceClassic.tsx`, 198 lines) — brass scale (`BalanceStage`/`BalanceTray` from `signals/BalanceScale.tsx`), five lane weights (`signals/BalanceWeight.tsx`), lane-weight press scrolls to `#lane-{lane}`.

### 3. GoldTimeMachine — `GoldTimeMachine.tsx` (227 lines) — Zone C
Collapsed "Advanced" control inside the hero: date picker bounded to meter era (2016-11-01+), renders picked day's verdict + lane counts + provenance (backfill vs live) + versioned-table line. One fetch per date per session. No anchor id of its own (`data-gold-time-machine` only) — noted as an anchor-contract gap in `01-current-state-audit.md` §6 (Task 2-a anomaly list).

### 4. Zone D band — `GoldPage.tsx:224–239` — wrapper `id="gold-zone-d"` + `data-gold-zone-d-band`
⚠ Live-verified duplicate id: `narrative/GoldNarrative.tsx:88` also sets `id="gold-zone-d"` (see audit F-07).

**4a. GoldNarrative** — `narrative/GoldNarrative.tsx` (184 lines). "Why gold moved": one-sentence price fact (1d/30d/90d, series + as-of, links `#insights-signals`), five family lines (lane name → `#lane-{lane}`, firing state, tally, movers), standing coincidence caveat. Pure engine `goldNarrative()` (`packages/insights/src/domains/gold/narrative.ts`) over the projection — no stored prose (the Layer-2 narrator `/api/insights/narrative` serves the Global page, not this card).

**4b. GoldYieldDecomposition** — `GoldYieldDecomposition.tsx` (221 lines). Four-row stack: nominal `us10y` · real `real-yield-10y` · breakeven **derived** (`us10y − real-yield-10y`, same-asOf only) · term premium `term-premium-10y` (Kim–Wright). Identity line, 30-day "which piece moved", static education block, provenance disclosure, seat links.

**4c. GoldOnRamp** — `GoldOnRamp.tsx` (297 lines). Education accordion: five driver rows (mechanism → honest limits → live lane close), cross-links (lane anchors, `/usa#usa-card-*`, `/currencies#…`, `#gold-card-gold-aud`, `#gold-zone-k`), two notes, six-question FAQ. **Collapsed by default, session-only open.**

**4d. GoldExpectations** — `GoldExpectations.tsx` (288 lines). Polymarket expectations (Kalshi leg not shipped, S15-D1): collapsed topline "next Fed {date} · {move}: {pct}"; expands to five outcome rows, event line, mismatch note, disclaimer, venue + as-of, and the Fed/CPI calendar strip (next two events, zone named, Jalali for fa) riding the insights snapshot. **Collapsed to one row by default.**

### 5. Zone F band — `GoldPage.tsx:252–255` — wrapper `data-gold-zone-f-band`

**5a. GoldIranBridge** — `GoldIranBridge.tsx` (358 lines). Bridge-1: Tehran board (coins: emami/bahar/half/quarter/gram + 18k/24k/mesghal) price + premium per row + per-row as-of; per-row parity decomposition (ounce × USD → toman/ounce → intrinsic/market/premium); method block (formula, constants, gerami band, CBI variant); interpretation block. Live leg from the App-boot TGJU snapshot; premiums computed client-side (`coinPremium`). Parity/method/interpretation **individually collapsed**; board always visible. Fail-closed unavailable frame without snapshot.

**5b. GoldPremiumHistory** — `GoldPremiumHistory.tsx` (406 lines). Bridge-2: (1) always-visible day-move attribution strip (Δln identity, method disclosed); (2) premium-history SVG chart (Emami + Bahar lines, 0% melt, backfill/live boundary); (3) deciles + band stats. Chart/deciles collapsed < 640 px, expanded desktop (matchMedia, session-only).

### 6. Signals — `Signals.tsx` (246 lines) + `signals/` subfolder
Section chrome `id="insights-signals"` (open by default, show/hide). Open: `MergedSignalsCard`. Collapsed: per-metal summary lines + `CollapsedVerdict`. Cold-load skeleton reserves the slot (`data-gold-signals-skeleton`, GoldPage.tsx:274–289) while `/api/insights` is in flight.
- **`signals/MergedCard.tsx`** (434 lines) — one merged gold+silver card: header lean lines, `VerdictStrip` (two chips; gold chip renders `GoldPriceChart`), **`BalanceScale`** (the second full scale on the page — audit F-01), lane ledger rows, C12 gold-high-yields banner, price-footing strip (never counted in balance).
- **`signals/BalanceScale.tsx`** (1,401 lines) — brass stage, trays, needle/arc, ledger, pure helpers (`balanceTilt`, `balanceVerdictOf`, …). Shared with `/insights` (legacy). 36 `data-bal-*` attributes; SVG gradient ids `bal-face-brass`/`bal-face-stone`/`bal-beam-brass` **duplicate** when two instances render (live-verified, audit F-07).
- **`signals/verdict.tsx`** (366 lines) — `VerdictIcon`, metal icons, `MetalTrendChart` (silver), `VerdictStrip`; re-exports `outlookOf`/`goldOutlookOf`.
- **`signals/BalanceWeight.tsx`** (299 lines) — lane weight disc (segmented rim, engraved icons).
- **`signals/GoldPriceChart.tsx`** (626 lines) — interactive gold chart: pan/zoom/pinch/wheel, log toggle, oz/gram toggle, DMA 50/200 overlays (default on), window delta, keyboard inspector. Reads shared `useGoldXauOhlc`.
- **`signals/icons.tsx`** (104 lines) — `ConditionIcon` (rising/falling steps), `LeanIcon`, `stateToneClass`.
- Tests: `balance.test.tsx` (344), `gold-balance-lanes.test.tsx` (1,605) + snapshot.
- Doc-drift note: GoldPage.tsx's comment still describes "the price-trend chart + range buttons"; the current card has no range buttons (historical comment only — recorded, no change in Session 1).

### 7. GoldSeats — `GoldSeats.tsx` (389 lines) — `id="gold-seats"`
Five `LaneCard`s in order: borrowing-costs (7) · dollar (7) · stress (11) · inflation (10) · flows (2) = 37 `SeatChip`s, all always visible. Chips are links (`seatAnchorHref` from `gold-tiles.ts`): 25 → `/usa#usa-card-*`, 6 → `/currencies#…`, 2 → `/europe#…`, 1 → `/world-markets#…`, 3 in-page (`#gold-card-*`). Dark seats carry cause-class why-lines (`data-seat-why`); lit CPI seats carry method labels. Exports the shared key maps (`LANE_TITLE_KEY`, `VOTER_NAME_KEY` ×37, `EVIDENCE_KEY`) reused by narrative/hero/on-ramp.

### 8. GoldTaLevels — `GoldTaLevels.tsx` (326 lines) — Zone H — `id="gold-ta"`
Always-visible 200-DMA distance sentence (decile, basis window, links `#insights-signals`); expanded body: SMA 20/50/100/200 rows, dated 50/200 crosses (+20-day follow-up), classic daily pivots (S1–S3/PP/R1–R3), weekly pivots. Collapsed < 640 px, expanded desktop (matchMedia, session-only). Shares the OHLC module cache with the chart.

### 9. GoldContext — `GoldContext.tsx` (406 lines) — `id="gold-context"`
- **RATIOS group:** 8 cards (`gold-silver`, `gold-btc`, `gold-aud`, `gold-oil-ratio`, `gold-platinum`, `real-gold-price`, `copper-gold`, `gold-equities-ratio`; `gold-usd` excepted — rendered as the hero) + **GoldCurrencyGrid** sub-card.
- **FLOWS & POSITIONING group:** `cftc-gold-positioning` + `cftc-gold-gross-long` cards (band chip + crowd-gauge + convention note), then the physical subgroup (`sge-gold-withdrawals`, `swiss-gold-flow`, `shanghai-gold-premium`).
- **zoneK slot** (between flows and honest record — GoldPage.tsx:322–330): `GoldCbDemand` → `GoldLondonVault` → `GoldCorrelation`.
- **Honest-record footer** `id="gold-honest-record"`: measured note + backtest link, sign-agreement record (46.8/42.2/32.7%), MIN2 note, no-edge sentence, **GoldForecastRetrospective** collapsed companion.
- Each card: §21 trio (value, 10-y position band, freshness/status), one-liner meaning; `CardDetailsOpener` stretches a tap zone opening the R-5 details panel. The licence wall is NOT here anymore (moved to GoldPublicationNotes, BD-S43).

**9a. GoldCurrencyGrid** — `GoldCurrencyGrid.tsx` (250 lines) — Zone I. Five crosses (EUR/AUD native, JPY/GBP/CNY derived), KGX validation verdict. Collapsed < 640 px.
**9b. GoldCbDemand** — `GoldCbDemand.tsx` (461 lines) — `id="gold-zone-k"`. Rolling-12m CB tracker chart + three dated episode annotations + buyers table (country, latest, 12m, holdings, share-of-reserves computed from the page's `gold-usd`), caveat, reported-world line, `<details>` method block. `GET /api/insights/gold-cb` (IMF SDMX; rung3 day-gate).
**9c. GoldLondonVault** — `GoldLondonVault.tsx` (226 lines). Two collapsed rider cards: vault stock (topline, 124-month sparkline, gold+silver rows) + LPMCL clearing; four-field method blocks; koz→tonnes conversion disclosed. **Collapsed ×2 by default.**
**9d. GoldCorrelation** — `GoldCorrelation.tsx` (430 lines). Always-visible 2022 buyer-rotation teaching line; expands to dual-axis chart (gold vs 10-y real yield, NOT inverted) + 52-week rolling-correlation strip; methodology footer. Collapsed < 640 px. Own in-file yield-history fetch (only gold feed not in a `gold-*.ts` client — stylistic inconsistency, noted).
**9e. GoldForecastRetrospective** — `GoldForecastRetrospective.tsx` (167 lines). LBMA analyst-survey record 2010–2025 (headline stats, 2025 line, 17-row table, miss convention, revision note, attribution). **Static module data, zero fetches. Collapsed by default.**

### 10. GoldPositions — `GoldPositions.tsx` (139 lines) — `id="gold-positions"`
Two CFTC cards: net positioning on a signed −100…+100 track (centre zero) and gross-long share 0–100; value, marker + fill from domain zero, window-named 30-day change. Returns null when neither reading exists.

### 11. GoldEpisodes — `GoldEpisodes.tsx` (209 lines) + `GoldEpisodePath.tsx` (220 lines) — Zone O — `id="gold-zone-o"`
Collapsed band with takeaway; expands to meter-era boundary note + nine records (editorial from static `gold-episodes-records.ts`, 273 lines); each record expands to period, interpretation, family readings with hasData flags, **drop-gated** price path + since-lines + comparison table (`gold-episodes-records.ts` editorial renders regardless; the WGC workbook gates the price legs). Sources with licence chips, out-links to live seats.

### 12. GoldIfBought — `GoldIfBought.tsx` (217 lines) — `id="gold-ifbought"`
Collapsed header; expands to method line ($100 month-end DCA), year picker (first-year note), four asset rows (gold/S&P/BTC/silver): lump multiple, named window, DCA line, decile line (or honest waiting line < 30-window base), disclaimers, series-bases line. `GET /api/insights/gold-ifbought`.

### 13. GoldPublicationNotes — `GoldPublicationNotes.tsx` (126 lines) — `id="gold-blocked"` (anchor kept, BD-S43)
Page-tail collapsed disclosure: absent-count line (projection `absentIds.length`) + §16 licence wall (the blocked quartet's honest notes + ONE sources link-out). **Collapsed by default** (owner-directed relocation, 2026-11-20).

### 14. Details panel — `GoldPage.tsx:368`
`useIndicatorDetailsPanel(readings)` (`shared/hooks/useIndicatorDetails.tsx`) → shared modal `IndicatorDetailsPanel` over the page's own readings; per-id history chart via the shared module-cached history fetch; focus returns to opener. Consumed by context cards (and, on other pages, by their own grids — shared component; see audit F-12).

---

## Navigation reality (verified)

- **No sticky/in-page section navigation exists** — no `position: sticky`, no TOC/anchor-strip component anywhere in `apps/web/src` (only the global fixed `Header.tsx` route nav).
- Anchor-offset support: `scroll-mt-24` on `#gold-seats`, `#gold-ta`, `#gold-context`, `#insights-signals`, `#gold-positions`, `#gold-zone-k`, `#gold-blocked` (hash jumps clear the fixed header).
- Staged cross-page anchor scroll: `shared/lib/anchor-scroll.ts` (`stageAnchorScroll` + `consumeStagedAnchorScroll` in `App.tsx:218`) — how `/usa#usa-card-*` deep-links land.
- In-page hash links in copy: narrative → `#insights-signals`, `#lane-*`; on-ramp/FAQ → zone anchors; TA → `#insights-signals`; correlation → `#gold-zone-k`; classic scale weights → `#lane-*`.

## Bundle budget (verified, `scripts/check-bundle-budget.mjs`)

- GoldPage lazy chunk ceiling: **240,000 raw / 50,000 gz** (line 1141). Live measured 238,898 raw (~49.35 gz) — ~1.1 kB raw headroom.
- History: 177.57/39.31 (S14) → 207.17/44.12 (S15) → 237.59/49.31 (S17, the bump to 240/50 with the "last feature wave" note).
- Basenames frozen (`GoldPage-*.js`) under the R5 no-rename rule. Entry chunk 296,000/89,500; GlobalPage 39,000/11,000.

## Anomalies recorded (no fixes in Session 1)

1. Duplicate `id="gold-zone-d"` (band wrapper + narrative card) — live-verified.
2. Duplicate `bal-face-brass` / `bal-face-stone` / `bal-beam-brass` SVG ids when two BalanceScale instances render — live-verified.
3. GoldTimeMachine has no anchor id (documented as "Zone C" but unreachable by hash).
4. GoldCorrelation's yield-history fetch is hand-rolled in-component rather than a `gold-*.ts` client.
5. GoldPage.tsx header comment drift ("price-trend chart + range buttons" no longer matches Signals).
