# GIE-S1 — The metric and module inventory (the separate counts)

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

Companion to `01-current-state-audit.md`. Every row below was derived from the **current** source (the engine's own tables, the placement module, the GoldPage render order) and, where marked, verified against the **live DOM/API** at capture time (2026-11-21, projection `generatedAt` 12:48 UTC, prices 13:13 UTC). This is the atlas's §2 input: count the real things separately.

---

## 1. The render order (13 blocks, top to bottom, file:line evidence)

| # | Block | Source | Content | Default state |
|---|---|---|---|---|
| 1 | Header | `GoldPage.tsx:187-210` | breadcrumbs · h1 · purpose · data-as-of (or cached-copy sentence) | visible |
| 2 | GoldHero (Zone B) | `GoldPage.tsx:216-223` → `GoldHero.tsx` | price block (live value, 7d window change, XAUUSD-spot sparkline, 10y band, AsOfChip, COMEX pill) + BriefingCard (headline, five-state word, counts, ≤3 reasons, what-could-change, evidence word, caveat) + CompositionStack (verdict → brass instrument → 5 LaneBars → ledger link → caveat) + TimeMachine (Zone C, collapsed) | visible |
| 3 | GoldSectionNav | `GoldPage.tsx:238` | sticky 7-chip scroller (Briefing · Bridge · Signals · Five forces · Ratios · Relationships · History), scroll-spy | sticky |
| 4 | Zone D band | `GoldPage.tsx:240-255` | GoldNarrative ("Why gold moved") + GoldYieldDecomposition (the one mechanism visual) + GoldOnRamp (collapsed education accordion) + GoldExpectations (collapsed Polymarket + Fed calendar strip) | narrative+yield visible; on-ramp/expectations collapsed |
| 5 | Zone F band | `GoldPage.tsx:268-271` | GoldIranBridge (regional board, chipped) + GoldPremiumHistory | visible |
| 6 | Signals | `GoldPage.tsx:281-305` | gold-only verdict strip + the interactive chart (window chips, DMA overlays, keyboard inspector) + the measured backtest note + price footing | visible (skeleton while snapshot loads) |
| 7 | GoldSeats | `GoldPage.tsx:310-312` | five lane sections, each LaneBar + its member cards (37 total; the position dot, plain line, freshness, "Open indicator") | visible |
| 8 | GoldTaLevels (Zone H) | `GoldPage.tsx:321` | reference levels: 50/200 DMA + daily/weekly pivots, cross-linked to the chart | visible |
| 9 | GoldContext + Zone K | `GoldPage.tsx:333-349` | 13 context cards (ratios + flows/positioning groups, context-strength bands) + Zone K: GoldCbDemand (IMF tracker) + GoldLondonVault (vault + clearing) + GoldCorrelation (the 52-week rolling companion) | visible |
| 10 | GoldPositions | `GoldPage.tsx:354` | the two CFTC bars (net −100..100; gross 0–100) with 30-day change | visible |
| 11 | GoldRelationshipsBoundary | `GoldPage.tsx:362` | the 25-record relationship explorer (list-first; desktop canvas opt-in; M/C/X/K chips; honesty footer) | lazy near-viewport |
| 12 | GoldTail (Zone O) | `GoldPage.tsx:375` | GoldEpisodes (503 waiting state today) + GoldIfBought + GoldPublicationNotes (collapsed) + the forecast retrospective + honest-record footer | lazy near-viewport; pub-notes collapsed |
| 13 | Record sheet | `GoldPage.tsx:379` | the one details panel (desktop popover / mobile bottom sheet; three content tiers) | on open |

## 2. The data planes (17 requests, all first-party — the live audit)

| Plane | Endpoint | Live status | Content |
|---|---|---|---|
| Gold projection | `/api/insights/pages/gold` | 200 | 48 readings + 4 absentIds + pricesAsOf |
| Insights snapshot | `/api/insights` | 200 | 183 readings, 24 calendar events (the Signals + calendar legs) |
| Rates (converter boot) | `/api/rates?source=tgju` + `?source=frankfurter` | 200 | the bridge's Tehran board + the FX legs |
| History (boot) | `/api/history?source=tgju` + `?source=frankfurter` | 200 | the converter charts |
| Expectations | `/api/insights/gold-expectations` | 200 | Polymarket December Fed event, 5 outcome markets |
| Premium history | `/api/insights/gold-premium` | 200 | 26 days, latest 2026-11-20 (ounce USD · dollar-Toman · coins) |
| XAU OHLC | `/api/insights/gold-ohlc` | 200 | 362 daily bars (2025-11-19 → 2026-11-20), EODHD XAUUSD.FOREX |
| If-bought | `/api/insights/gold-ifbought` | 200 | gold · silver · btc · sp500 running points |
| CB tracker | `/api/insights/gold-cb` | 200 | IMF tracker, asOf 2026-10, 250 rolling points, 10 buyers |
| LBMA | `/api/insights/gold-lbma` | 200 | vault asOf 2026-10 · clearing asOf 2026-09 |
| Crosses | `/api/insights/gold-crosses` | 200 | the multi-currency grid |
| Real-yield history | `/api/insights/real-yield-10y/history` | 200 | the correlation chart's yield leg |
| Episodes | `/api/insights/gold-episodes` | **503 (designed)** | the WGC-workbook waiting state (owner-side lever) |

## 3. Inventory A — the 37 balance voters (engine truth)

Derived by direct import of `GOLD_LANE_VOTERS` (the engine's own table; 7/7/11/10/2; polarity +1 ×19, −1 ×18). Live impact column = the engine re-derivation over the live projection (S=supports, P=pressures, s=steady, u=unread).

| Lane (audience label) | Voters (id · polarity · live impact) |
|---|---|
| **borrowing-costs** — Interest rates & borrowing costs (7) | real-yield-10y (−1, P·high) · us10y (−1, S·falling) · us30y (−1, P·high) · fed-target (−1, s) · fed-expectations (−1, S·falling) · ecb-dfr (−1, s) · real-yield-5y (−1, P·high) |
| **dollar** — The US dollar (7) | dollar-basket (−1, P·rising) · usdjpy (−1, P·high) · us-japan-10y-gap (−1, **unread·rule-driven**) · usd-reserve-share (−1, S·low) · nyfed-custody (−1, S·low) · dollar-broad (−1, P·high) · dollar-eme (−1, s) |
| **stress** — Market stress & uncertainty (11) | stress-stlfsi (+1, P·low) · nfci (+1, s) · vix (+1, S·high) · gold-silver (+1, s) · term-premium-10y (+1, S·high) · ebp (+1, s) · michigan-sentiment (−1, S·low) · gpr-daily (+1, s) · epu-us (+1, s) · sp500-breadth-ratio (−1, S·low) · bank-stress (+1, s) |
| **inflation** — Inflation & inflation expectations (10) | us-cpi-yoy (+1, s) · us-pce-core-yoy (+1, s) · euro-hicp (+1, s) · breakeven-5y5y (+1, P·falling) · breakeven-tilt (+1, s) · t5yie (+1, P·falling) · michigan-1y-expectations (+1, s) · m2-us (+1, s) · us-deficit-12m (+1, s) · michigan-5y-expectations (+1, S·high) |
| **flows** — Trader positioning & flows (2) | cftc-gold-positioning (−1, s) · cftc-gold-gross-long (−1, s) |

**Live lane states:** borrowing-costs against (5 firing: 2S/3P) · dollar against (5 firing: 2S/3P) · stress **for** (5 firing: 4S/1P) · inflation against (3 firing: 1S/2P) · flows neutral (0 firing). Net −2; 1 for · 3 against · 1 not leaning. The two inverted-polarity seats (michigan-sentiment, sp500-breadth-ratio) render with their engine polarity (the S3-GUX records' marking).

## 4. Inventory B — the 11 context-only readings + the dual-role id

From `GOLD_CONTEXT_IDS` (placement `ratios` + `flows-positioning`, minus gold-usd the hero exception and the two COT ids that are voters with context homes):

| id | What it is | Live value · asOf |
|---|---|---|
| gold-silver | **dual-role** (voter + context card) — the monetary-stress ratio | 85.6 · 2026-11-20 |
| gold-btc | gold priced in BTC | 0.0594 · 2026-11-21 |
| gold-aud | gold in AUD | 5,274 · 2026-11-20 |
| gold-oil-ratio | gold per Brent barrel | 38.0 · 2026-11-20 |
| gold-platinum | gold/platinum ratio | 2.75 · 2026-11-21 |
| real-gold-price | gold in 1982-84 dollars (CPI-deflated) | 1,155 · 2026-10-01 |
| copper-gold | copper/gold ratio (growth-health registry group) | 3.53 · 2026-10-01 |
| gold-equities-ratio | GLD/SPY | 0.4681 · 2026-11-20 |
| sge-gold-withdrawals | Shanghai vault withdrawals (t) | 92.08 · 2026-10-01 |
| swiss-gold-flow | Swiss gold imports (t) | 227.9 · 2026-09-01 |
| shanghai-gold-premium | SGE vs world (%, never a voter §16) | 1.30 · 2026-11-20 |

## 5. Inventory C — the 4 licence/source-blocked absentees

`BLOCKED_NOTES` (placement): wgc-etf-holdings (WGC L3 licence) · wgc-cb-demand (WGC L3) · official-gold-demand (PBoC URL dead) · etf-short-interest (no licence-clean venue). Rendered only inside the collapsed publication-notes disclosure with the owner's levers named; the live `absentIds` carries all four.

## 6. Inventory D — the ~16 non-indicator modules

GoldNarrative (the daily "Why gold moved") · GoldYieldDecomposition (V2 mechanism) · GoldOnRamp (education, collapsed) · GoldExpectations (Polymarket + Fed calendar, collapsed) · GoldIranBridge (regional board) · GoldPremiumHistory (the حباب history) · Signals (the gold verdict strip + chart) · GoldTimeMachine (collapsed historical meter) · GoldTaLevels (V9 reference levels) · GoldCbDemand (V6-capable stock/flow data) · GoldLondonVault (stock + activity) · GoldCorrelation (V8-adjacent rolling companion) · GoldForecastRetrospective (the honest record) · GoldEpisodes (503 waiting) · GoldIfBought (the calculator) · GoldPublicationNotes (collapsed disclosure). Plus the record sheet (the shared details panel) and the 25-record relationship explorer.

## 7. Inventory E — price/technical series and their instruments

| Surface | Instrument | Venue · cadence | Label honesty |
|---|---|---|---|
| Hero live value | **COMEX front-month gold futures GC=F** | Yahoo, hourly rung (`:13`), per troy ounce | "Market closed · COMEX gold futures, New York (UTC−5)" + the venue name in the record |
| Sparkline + percentiles + if-bought | **XAUUSD spot daily closes** | EODHD XAUUSD.FOREX (chart) / gold-api XAU (history legs), daily | "XAUUSD spot · daily closes" named at point of use |
| TA band | 50/200 DMA + pivots | derived from the same OHLC leg | "reference levels", cross-linked |
| OHLC depth | 362 bars (≈1y, free-tier) | EODHD | the ALL chip states the true stored span |

**The F-09 nuance:** the hero's *live quote* is futures (basis typically <1%; the honest engineering rationale is recorded in `prices/definitions.ts`); the *series language* ("XAUUSD spot") belongs to the chart/history legs. The units reconcile (per troy ounce); the semantics differ — carried into S2's claim-to-evidence contract.

## 8. Inventory F — repeated presentations (the controlled set)

| Metric | Presentations (role-distinct, by design) |
|---|---|
| cftc-gold-positioning / -gross-long | seat chip (verdict) · context card (value + two-track chips) · Positions bar (visual track) — 3 role-distinct surfaces |
| real-yield-10y | seat (verdict) · yield-decomposition leg (structure) · correlation axis (relationship) |
| gold-usd | hero (the price) · Signals footing (the "not counted in the balance" context) · narrative price fact (editorial) |
| lane state | ONE LaneBar renderer across hero/on-ramp/time machine/five-force overview (they cannot disagree) |
| balance verdict | ONE instrument (CompositionStack) + the BriefingCard's word (the S5-M5 retirements hold) |

## 9. Inventory G — freshness snapshot (the 48 present readings)

| asOf | count | the cadence reality |
|---|---|---|
| 2026-11-21 (today) | 4 | the live-priced + daily-refresh ids (gold-usd, gold-btc, gold-platinum, ecb-dfr) |
| 2026-11-20 | 17 | the daily FRED/derived family |
| 2026-11-13…19 | 12 | weekly (STLFSI/NFCI/bank-stress/custody/CFTC) + the daily laggards |
| 2026-10-01 / 09-01 | 14 | the monthly families (CPI, PCE, M2, EBP, EPU, Michigan, SGE, Swiss, real-gold-price…) |
| 2026-06-30 | 1 | quarterly COFER (usd-reserve-share) |

All within cadence grace; the insights-wide stale census shows 1 stale voter (govt-interest-revenue, not a gold-page id). `pricesAsOf` 13:13 UTC (the hourly rung live at capture).

## 10. The reconciliation (the spec's §4 demand, answered)

- "37+ indicators" (the new spec's phrase) = the **37 voters** (the page's own meter; the phrase's "+" points at the 15 further unique ids the page also shows).
- "21 voters / four lanes" (older documentation) = **superseded** (the GF-P2/P3/S10 expansions: 37 voters, five lanes — the AGENTS.md historical sections describe the journey, not the current state).
- "Five visitor-facing groups" = the five **lanes** with their audience labels (S3-GUX finalized; engine ids frozen).
- The AGENTS.md §A "54 voting / 187 indicators" header = the **insights-wide registry** count, not the gold page's (the BD-S46 reconciliation; still true).
- The **52-record content module** (37 brief + 52 deep, both locales) matches the 52 canonical ids exactly (the S5-GUX parity tests pin it).
