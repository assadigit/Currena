# GOLD SYSTEM — COMPLETE REFERENCE

> **THE definitive technical documentation of Currena's gold indicator (the
> "gold meter").** Written 2026-11-07 for two audiences at once: humans who
> will revise and improve the system, and AI agents who will read it cold.
> Every number, threshold, file path, algorithm step, decision ID and
> lineage event below was extracted from the source of truth — the code in
> `packages/insights/` and the spec set in `docs/` — not from memory.
>
> **Reading order for AI agents:** §1 → §2 → §4 → §5 → §6 → §13 → §14.
> **Reading order for humans revising the system:** §1 → §3 → §5 → §6 →
> §11 → §12 → §13.
>
> **The single source of truth is always the code.** If this document and
> the code ever disagree, the code wins and this document must be fixed.
> The authoritative file for the voter table is
> `packages/insights/src/gold-score.ts` (`GOLD_LANE_VOTERS`); for the lane
> engine `packages/insights/src/gold-balance.ts`; for the evaluator
> `packages/insights/src/connections.ts` (`evalLeg` + `SIGNAL_LEG_MOVE`).

**Status of the system at writing (2026-11-07, post GF-S13):**
37 voters · 5 lanes (7/7/11/10/2) · lane crowd minimum 2 · Outlook strong
bar 4-of-5 · live on https://currena.ir as THE gold card for every visitor ·
measured record: **no forecasting edge claimed or implied** — the meter
reads *conditions today*, never direction.

---

## Table of contents

1. [What the gold system is — the one-paragraph answer](#1-what-the-gold-system-is)
2. [System map — every file that implements it](#2-system-map)
3. [The data foundation — how a reading is born](#3-the-data-foundation)
4. [The shared evaluator `evalLeg` — the firing rule](#4-the-shared-evaluator)
5. [The voter table — lanes, polarities, weights](#5-the-voter-table)
6. [The live engine — `goldBalance()` step by step](#6-the-live-engine)
7. [The visual layer — the beam, the scale, the dial](#7-the-visual-layer)
8. [The gold Outlook — the 7-state classifier](#8-the-gold-outlook)
9. [The frozen engine — `goldTailwindScore` / `goldSummaryOf` / model-vs-reality](#9-the-frozen-engine)
10. [The legacy signals card — the 5-condition checklist](#10-the-legacy-signals-card)
11. [The backtest & calibration harness — and the honest no-edge record](#11-the-backtest--calibration-harness)
12. [Governance — how the meter may change](#12-governance)
13. [Revision guide — how to safely change the system](#13-revision-guide)
14. [Constants quick reference (machine-readable)](#14-constants-quick-reference)
15. [Vocabulary / glossary](#15-vocabulary--glossary)
16. [Known limitations & honest disclosures](#16-known-limitations--honest-disclosures)
17. [Appendix A — complete worked example with numbers](#17-appendix-a--worked-example)
18. [Appendix B — the wire/data contracts](#18-appendix-b--wire-contracts)
19. [Appendix C — the i18n copy surface](#19-appendix-c--i18n-copy)
20. [Appendix D — document & evidence index](#20-appendix-d--document-index)

---

## 1. What the gold system is

**ONE question, ONE instrument** (spec
`docs/specs/gold-balance-consolidation/01-SPEC.md` §2): *which of the five
macro conditions lean FOR gold's price today, which lean AGAINST it, and
which do not lean.* It is a **descriptive conditions meter** — it renders
the current alignment of classic macro drivers (real yields, the dollar,
market stress, inflation, and positioning flows) against gold's price. It
is **never** a forecast, **never** trading advice, and the copy never says
buy/sell; the measured backtest record (§11) found **no predictive edge**,
and the system deliberately claims none.

**The architecture in one picture** (three pure layers over a shared data
foundation; every layer is a deterministic pure function of the same
`readings` array — no layer ever fetches anything):

```
                      ┌─────────────────────────────────────────────┐
                      │  THE SNAPSHOT (KV: insights:snapshot)       │
                      │  readings[] — one IndicatorReading per      │
                      │  indicator, written by the ingest cron      │
                      │  (fields: value, asOf, change7d/30d/90d,    │
                      │   percentile10y, sd10y, moveScore, status)  │
                      └──────────────────────┬──────────────────────┘
                                             │ (same array to both sides —
                                             │  the "one function, no drift"
                                             │  contract, AGENTS.md rule 2)
              ┌──────────────────────────────┴──────────────────────┐
              ▼                                                     ▼
   ┌─────────────────────┐                          ┌──────────────────────────┐
   │ THE EVALUATOR       │                          │ THE SPA (client-side)    │
   │ evalLeg(id, reading)│ ◄── used by BOTH ──►     │ re-derives everything    │
   │ connections.ts      │                          │ from the readings it     │
   │ → lean ∈ {+1,0,-1}  │                          │ already holds            │
   └──────────┬──────────┘                          └────────────┬─────────────┘
              │                                                  │
   ┌──────────▼──────────┐                          ┌────────────▼─────────────┐
   │ THE VOTER TABLE     │                          │ THE LIVE ENGINE          │
   │ GOLD_LANE_VOTERS    │ ── read by ──►           │ goldBalance(readings)    │
   │ gold-score.ts       │                          │ gold-balance.ts          │
   │ 37 seats × 5 lanes  │                          │ → 5 lane votes, counts,  │
   │ × polarity ±1       │                          │   net, readable          │
   └─────────────────────┘                          └────────────┬─────────────┘
                                                                │
                                                    ┌───────────▼────────────┐
                                                    │ THE PRESENTATION       │
                                                    │ BalanceScale (beam °)  │
                                                    │ goldOutlookOf (7State) │
                                                    │ MergedCard lane chips  │
                                                    └────────────────────────┘
```

**The three design invariants** (breaking any of these is a design-level
change requiring the governance process of §12):

1. **One evaluator, one rule per indicator** (D-GB-4). Every voter fires
   through the SAME `evalLeg` — no bespoke per-seat firing rules. The gold
   meter never adds a "special" read; a seat that cannot be read through
   the shared evaluator is not seated.
2. **Zero new fetches** (the Gold Program's founding discipline). The
   meter re-cuts the readings the page already holds. It adds no network
   call, no KV key, no wire field (the one historical exception, the
   `goldSummary` wire field, was retired at OI-3/GB-S7 — §9).
3. **`unread` ≠ `neutral`, never a guess.** An unreadable seat
   (missing/stale/check-pending/unavailable, or inputless per D-18) reads
   `unread`; a readable-but-not-firing seat reads `steady`. Silence is
   never worded as signal and signal is never invented (§16).

**A brief history (why there are two engines).** The gold program began
(2026-10-31, "session S1") as a *tailwind score*: 21 voters re-cut into a
signed net with a 5-step label and a model-vs-reality chip —
`gold-score.ts`. The gold-balance consolidation program (2026-11-03/04,
GB-S1..S7) replaced it in the UI with the **consolidated lane balance**
(`gold-balance.ts`): the same voter table, grouped into 5 lane votes on a
balance-scale visual, because 21 chips was cognitive overload and single
conditions were over-claimed. The old engine was **frozen, not deleted**
(D-GB-9) — it still runs for backtest/recheck lineage. Then the gold-meter
audit + gap-fill program (GA-S1..S4 + GF-P0..P5, closed 2026-11-07) grew
the voter set to its measured final shape of 37 seats across 5 lanes. The
full lineage table is in §5.4.

---

## 2. System map

Every file that implements, tests, or governs the gold system. Paths are
repo-relative (repo root = the Currena monorepo).

### 2.1 The engines (pure TypeScript, platform-free)

| File | Role | Key exports |
|---|---|---|
| `packages/insights/src/gold-score.ts` | **The voter table + the frozen tailwind engine.** Owns `GOLD_LANE_VOTERS` (THE single source of truth for seats/lanes/polarities), `GOLD_LANES`, the lane word maps, and the frozen `goldTailwindScore` / `goldSummaryOf` / `modelVsReality`. | `GOLD_LANE_VOTERS`, `GOLD_LANES`, `GoldLane`, `goldTailwindScore`, `goldSummaryOf`, `modelVsReality`, `modelVsRealityExplainerKey`, `GOLD_STRONG_SHARE`, `GOLD_STRONG_MIN_FIRING`, `GOLD_REALITY_SPEED_PCT` |
| `packages/insights/src/gold-balance.ts` | **THE live engine.** The consolidated lane balance: 5 lane votes from the 37 voters, `GOLD_LANE_MIN_FIRING=2`, the D-18 input-presence rule. Imports the table and `evalLeg`; edits nothing. | `goldBalance`, `GoldBalanceReading`, `GoldBalanceLane`, `GoldBalanceMember`, `GoldBalanceSide`, `GOLD_LANE_MIN_FIRING`, `GOLD_LANE_STRONG` |
| `packages/insights/src/connections.ts` | **The shared evaluator + thresholds.** `evalLeg` (the signals-card leg vocabulary used by every gold voter), `SIGNAL_LEG_MOVE` (the per-leg 30-day minimum-move thresholds), plus the unrelated-but-co-located connection-cards engine. | `evalLeg`, `SignalLegEval`, `SIGNAL_LEG_MOVE`, `evaluateConnection(s)`, `evalConnectionLeg` |
| `packages/insights/src/definitions.ts` | The 184-id indicator registry: each voter's source, `sourceRef`, cadence, `changeKind`, warning rule, `staleAfterDays`. (~3.8k lines; the gold-relevant rows are reproduced in §3.4.) | `DEFINITIONS` |
| `packages/insights/src/scoring.ts` | **The reading factory.** `computeReading` — how `value`/`asOf`/changes/`percentile10y`/`sd10y`/`moveScore`/status are computed from a series. | `computeReading`, `GRACE_DAYS`, `PERCENTILE_WINDOW_DAYS`, `MIN_PERCENTILE_OBS`, `moveScoreOf`, `percentileOf`, `staleAfterDaysFor` |
| `packages/insights/src/breakeven-tilt.ts` | The inflation lane's context phrase helper (±0.1pt deadband on the tilt's LEVEL — display only, NOT the voter lean). | `breakevenTiltLean`, `BREAKEVEN_TILT_DEADBAND_PT` |
| `packages/insights/src/signals.ts` | The legacy gold/silver 5-condition checklist (silver's model is still live; gold's checklist now only supplies `position`/`speed` to the Outlook). | `evaluateSignal(s)`, `LEAN_STRONG` |
| `packages/insights/src/gold-backtest-core.ts` | The pure backtest/calibration core: the parameterized engine twins, no-lookahead series truncation, the realized-move join, the lane calibration statistics. | `scoreOverVoters`, `laneBalanceOverVoters`, `seriesUpTo`, `flatBandPct`, `forwardTradingDayReturn`, `signAgreement`, `medianFlipsPer60`, `laneCalibrationStats`, `HARNESS_GOLD_VOTERS_21/_20`, `HARNESS_GOLD_LANES_MIN2/_MIN1`, `GOLD_BACKTEST_HORIZONS` |
| `packages/insights/src/gf-p0-proposed.ts` | The read-only frozen scenario tables of the gap-fill calibration (every historical and proposed voter-set composition). | `GF_VOTERS_FROZEN_21`, `GF_VOTERS_P1_DEMOTE`, `GF_VOTERS_P2_4LANE`, `GF_VOTERS_5LANE`, `GF_VOTERS_P3_5LANE`, `GF_VOTERS_P4_5LANE`, `GF_VOTERS_REALCURVE_PLUS/_MINUS`, `GF_MOVE_FROZEN_BASE`, `GF_MOVE_P1_PROPOSED`, `GF_MOVE_P3_PROPOSED` |
| `packages/insights/src/adapters/snapshot.ts` | The ingest builders that write the snapshot (buildInsightsSnapshot / patchInsightsSnapshot / projectSnapshotToPublic). | — |
| `packages/core/src/schemas.ts` | Zod contracts: `IndicatorReadingSchema`, `InsightsSnapshotSchema`, `GoldSummarySchema` (+ leaf schemas). | — |

### 2.2 The presentation layer (React, `apps/web`)

| File | Role |
|---|---|
| `apps/web/src/components/insights/signals/MergedCard.tsx` | **THE gold card.** Calls `goldBalance(readings)`, `goldOutlookOf(...)`, builds the lane drivers, the C12 banner, the context line, the measured note, the footing strip. |
| `apps/web/src/components/insights/signals/BalanceScale.tsx` | The balance visual: beam angle formula, the one-animated-value θ machinery, verdict words, the dial, the ledger. Exports `balanceVerdictOf`, `balanceVerdictWordOf`, `balanceVerdictCountsParts`, `countLineParts`, `balanceCounts`, `balanceTilt`. |
| `apps/web/src/components/insights/signals/BalanceWeight.tsx` | The lane WEIGHT chips (segmented rims — one segment per firing voter). |
| `apps/web/src/components/insights/signals/verdict.tsx` | The VerdictStrip (per-metal analysis cards) + `outlookOf` (silver) + `goldOutlookOf` (gold — §8) + `RANGE_SPEED_PCT`. |
| `apps/web/src/components/insights/signals/icons.tsx` | Condition/lean icons and tone classes (words + icons, never colour alone). |
| `apps/web/src/i18n/insights-copy-en.ts` / `-fa.ts` | The bilingual copy: `signals.goldScore.laneNames`, `voterNames`, `evidenceWords`, `tiltWords`, `signals.balance.*`, verdict states. Behind the Persian-copy audit gate. |

### 2.3 The tests that pin the semantics (do not break silently)

| Test file | Count | Pins |
|---|---|---|
| `packages/insights/src/gold-balance.test.ts` | 20 | The lane vote rules (§6), the D-18 input-presence rule, the 2026-10-31 fixture read, and **the equivalence pin `goldBalance === laneBalanceOverVoters(GOLD_LANE_VOTERS, 2, inputPresence=true)`** over every battery. |
| `packages/insights/src/gold-score.test.ts` | 35 | The frozen engine's firing rules, lane words, label mapping, chips, the compact round-trip; the promoted voter-table shape (seat count, lane counts 7/7/11/10/2, no duplicates). |
| `packages/insights/src/gold-backtest-core.test.ts` | 21 | `scoreOverVoters === goldTailwindScore` (the harness/production equivalence pin), no-lookahead truncation, window joins, the flat band. |
| `packages/insights/src/gf-p0-proposed.test.ts` | 19 | The frozen scenario tables vs production (e.g. `GF_VOTERS_P4_5LANE` ≡ `GOLD_LANE_VOTERS` modulo the recorded F2 id mapping; `GF_MOVE_P3_PROPOSED` mirrors the production thresholds verbatim). |
| `packages/insights/src/gold-lane-calibration.test.ts` | — | The lane calibration statistics over recorded corpora. |
| `apps/web/src/components/insights/signals/gold-balance-lanes.test.tsx` | 47 | The UI renders the lane balance, member lists, evidence words, both locales, the sparse rule, the C12 banner. |
| `packages/insights/src/connections.test.ts` | — | `evalLeg` semantics and the thresholds map. |

### 2.4 The governing documents

| Document | What it governs |
|---|---|
| `docs/specs/gold-balance-consolidation/01-SPEC.md` … `05-VISUAL-DESIGN-SPEC.md` | The consolidation program (the live instrument's design): the question, the engine, UX/copy, migration, the visual spec. |
| `docs/specs/gold-meter-gapfill/README.md` (+ `01-FILL-SPEC.md`, `PROGRESS.md`, `PROMPTS.md`, `evidence/`) | The gap-fill program that produced the 37-seat table; the decision log D-GF-1..9 and the owner's recorded answer sheets (rounds 1–3). |
| `docs/insights/GOLD_SCORE_SPEC.md` | The frozen tailwind engine's spec (S1/S2 historical record). |
| `docs/insights/GOLD_BACKTEST_SPEC.md`, `docs/insights/BACKTEST-GOLD.md`, `docs/insights/BACKTEST-GOLD-LANES.md` | The backtest discipline and the measured records. |
| `docs/insights/GOLD-METER-AUDIT-REPORT.md` | The 2026-11-04 audit (8/85 rows covered → the ranked backlog the fill program executed). |
| `docs/insights/GOLD_RECHECK_SPEC.md`, `GOLD_FRED_GAPFILL_SPEC.md` | The recheck lineage and the FRED gap-fill. |
| `AGENTS.md` | Repo-wide operating rules (rule 2: pure/platform-free; the insights inventory section). |
| **This document** | The consolidated technical reference for the whole system. |

---

## 3. The data foundation

The gold meter computes over `IndicatorReading` objects. Nothing in the
gold system ever touches a raw provider API — it consumes the snapshot
the ingest already built. To understand any voter's firing you must
understand how each reading field is produced.

### 3.1 The `IndicatorReading` shape (zod: `IndicatorReadingSchema`, `packages/core/src/schemas.ts`)

| Field | Type | Meaning / how computed |
|---|---|---|
| `id` | `IndicatorId` | The indicator's registry id (e.g. `'real-yield-10y'`). |
| `value` | `number \| null` | Latest observation at/before the run date. `null` + status `unavailable` when no data. |
| `asOf` | `iso date \| null` | The observation's own date (the data's date, not the fetch time). |
| `change7d` | `number?` | 7-day window change in the definition's `changeKind` units. Daily/weekly cadences only. Anchor tolerance 3 days (§3.2). |
| `change30d` | `number?` | **The field the gold evaluator reads.** For daily/weekly: 30-day window change (tolerance 5d). For monthly/quarterly/manual: the change since the PREVIOUS RELEASE (previous observation) — cadence-aware (audit item C6). |
| `change90d` | `number?` | 90-day window change (daily cadence only; tolerance 10d). |
| `percentile10y` | `number?` | **The level leg's input.** Share of the last-10-years' observations STRICTLY BELOW the current one (ties count as not-below). Window 3650 days; base excludes the current point; minimum 30 observations (`MIN_PERCENTILE_OBS`) or the field is absent. If `percentileBasis: 'yoy'` (e.g. `m2-us`), the percentile is computed over the year-on-year growth series, not the level. |
| `sd10y` | `number?` | The current value's z-score vs the same trailing base window (mean + sample SD) — used by SD-based warning rules elsewhere, not by the gold evaluator. |
| `moveScore` | `number?` | The big-mover z-score: (latest change − mean) ÷ std of the same change series over 10y; ≥30 change observations required. Not a gold input. |
| `fromPeak10y` | `number?` | Distance from the 10-year peak, in percent (≤ 0). |
| `lastChange` | `{date, points}?` | The most recent STEP change (policy-rate cards). |
| `status` | enum | `'normal'` / `'warning'` (voted on the page's own gauges) · `'context'` (info rule) · `'stale'` · `'check-pending'` · `'unavailable'` · `'no-history'`. **The gold readable rule consumes this (§4.3).** |
| `sourceName` / `sourceUrl` | string | Display provenance. |

### 3.2 The change-window semantics (scoring.ts)

A window change is measured point-based: find the latest observation at or
before `current.date − N days`; if that anchor is farther from the target
date than the tolerance (7d→3d, 30d→5d, 90d→10d) the change is **absent**
(a sparse monthly series shows a dash, never a mislabelled 30-day delta).
`points` = subtraction; `pct` = `(now−then)/then × 100` (undefined on a
non-positive base).

**Cadence-aware `change30d` — critical for the gold meter.** For
monthly/quarterly/manual series `change30d` is the *since-previous-release*
change. This is why a monthly voter (e.g. `us-cpi-yoy`) fires on a
month-over-month move against a points threshold, while a daily voter
(e.g. `real-yield-10y`) fires on a true 30-day move. The threshold table
(§4.2) was calibrated with this semantics in force (GF-P0 §3).

### 3.3 Staleness — `status: 'stale'`

`GRACE_DAYS` defaults by cadence: daily 4, weekly 10, monthly 45,
quarterly 120, per-change null (never stale by age), manual 45. Any series
whose honest release cycle ages further carries a `staleAfterDays`
override (per-series, documented in `definitions.ts`). A stale reading
**never fires a gold voter** (§4.3) and never shrinks a lane's readable
base in a way that could inflate severity (S1-M1.4's dilution discipline).
Per-voter overrides are listed in §5.2's table (§3.4).

### 3.4 The 37 voters' data cards (from `definitions.ts`)

For each gold voter: what it is, where it is fetched, its cadence/units,
its own page warning rule (the page card's status — NOT its gold firing
rule, which is always `evalLeg`), and staleness override.

#### Lane 1 — borrowing-costs (7 voters)

| id | Indicator (name) | Source & reference | Cadence / units | Page card's own rule | staleAfterDays |
|---|---|---|---|---|---|
| `real-yield-10y` | US 10-year real yield | FRED `DFII10` | daily / points | percentile high, cutoff 0.2 | (default 4) |
| `real-yield-5y` | US 5-year real yield | FRED `DFII5` | daily / points | percentile high, cutoff 0.2 | 4 |
| `us10y` | US 10-year Treasury yield | FRED `DGS10` | daily / points | any-of percentile rules | (default) |
| `us30y` | US 30-year Treasury yield | FRED `DGS30` | daily / points | any-of percentile rules | 4 |
| `fed-target` | Federal funds target rate | FRED `DFEDTARL`+`DFEDTARU` (midpoint) | daily / points | percentile high, cutoff 0.1 | 5 |
| `fed-expectations` | Market's Fed expectations (2y gap) | derived: `DGS2 − policy midpoint` | daily / points | percentile high, cutoff 0.1 | 4 |
| `ecb-dfr` | ECB deposit facility rate | ECB Data Portal `FM/D.U2.EUR.4F.KR.DFR.LEV` | daily / points | percentile high, cutoff 0.1 | 7 |

#### Lane 2 — dollar (7 voters)

| id | Indicator | Source & reference | Cadence / units | Page rule | staleAfterDays |
|---|---|---|---|---|---|
| `dollar-basket` | Currena dollar basket | derived: Frankfurter six-currency basket (DXY weights, base 50.14348112) | daily / points | any-of percentile rules | 4 |
| `dollar-broad` | Broad trade-weighted dollar | FRED `DTWEXBGS` | daily / points | percentile high, cutoff 0.1 | 10 |
| `dollar-eme` | EME trade-weighted dollar | FRED `DTWEXEMEGS` | daily / points | percentile high, cutoff 0.1 | 10 |
| `usdjpy` | USD/JPY | Frankfurter USD→JPY | daily / **pct** | change fall 5% / 4 weeks | (default) |
| `us-japan-10y-gap` | US−Japan 10y yield gap | derived: `DGS10 − MOF jgbcme 10Y` | daily / points | any-of threshold rules | 5 |
| `usd-reserve-share` | USD share of world FX reserves | IMF COFER (SDMX 3.0, keyless; quarterly share of allocated reserves, %) | quarterly / points | info (context card) | 200 |
| `nyfed-custody` | Foreign official custody at NY Fed | FRED `WSEFINTL1` (Wednesday level, $m) | weekly / pct | info | 21 |

#### Lane 3 — stress (11 voters)

| id | Indicator | Source & reference | Cadence / units | Page rule | staleAfterDays |
|---|---|---|---|---|---|
| `stress-stlfsi` | St. Louis Fed Financial Stress Index | FRED `STLFSI4` | weekly / points | threshold above 0, sustained 4 weeks | 14 |
| `nfci` | Chicago Fed NFCI | FRED `NFCI` | weekly / points | threshold above 0 | 14 |
| `vix` | Cboe Volatility Index | FRED `VIXCLS` (close) | daily / points | percentile high, cutoff 0.2 | (default) |
| `gold-silver` | Gold/silver ratio | derived: gold-api XAU ÷ XAG (history: World Bank) | daily / points | percentile high, cutoff 0.2 | 2 |
| `term-premium-10y` | 10-year term premium (Kim-Wright) | FRED `THREEFYTP10` | daily / points | info | 14 |
| `ebp` | Excess bond premium | Fed Board FEDS Notes EBP file | monthly / points | info | 75 |
| `michigan-sentiment` | US consumer mood | FRED `UMCSENT` | monthly / points | percentile LOW, cutoff 0.2 | 75 |
| `gpr-daily` | Geopolitical Risk (7-day avg) | Caldara-Iacoviello GPRD_MA7 | daily / points | info | 12 |
| `epu-us` | US policy uncertainty | Baker-Bloom-Davis EPU | monthly / points | info | 75 |
| `sp500-breadth-ratio` | S&P 500 equal/cap weight ratio | Yahoo `RSP ÷ SPY` daily closes | daily / pct | info | 4 |
| `bank-stress` | Fed discount window primary credit rate | FRED `DPCREDIT` | weekly / points | percentile high, cutoff 0.1 | 14 |

#### Lane 4 — inflation (10 voters)

| id | Indicator | Source & reference | Cadence / units | Page rule | staleAfterDays |
|---|---|---|---|---|---|
| `us-cpi-yoy` | US CPI, yearly | FRED `CPIAUCNS` 12-month % (NSA headline) | monthly / points | threshold above 3 | 75 |
| `us-pce-core-yoy` | US core PCE, yearly | FRED `PCEPILFE` 12-month % | monthly / points | threshold above 2 | 95 |
| `euro-hicp` | Euro-area HICP, yearly | ECB Data Portal | monthly / points | threshold above 2 | 60 |
| `breakeven-5y5y` | 5y5y forward inflation expectations | FRED `T5YIFR` | daily / points | threshold above 2.4, sustained 4 weeks | (default) |
| `breakeven-tilt` | Breakeven tilt (forward − spot) | derived: `T5YIFR − T5YIE` | daily / points | info | 5 |
| `t5yie` | 5-year breakeven (spot) | FRED `T5YIE` | daily / points | info | 5 |
| `michigan-1y-expectations` | US expected inflation next year | FRED `MICH` | monthly / points | info | 75 |
| `michigan-5y-expectations` | US expected inflation 5–10y | UoM SIE Table 33 | monthly / points | percentile high, cutoff 0.2 | 75 |
| `m2-us` | US M2 money supply | FRED `M2SL` (YoY basis) | monthly / **pct** (`percentileBasis: 'yoy'`) | info | 90 |
| `us-deficit-12m` | US federal deficit, 12-month rolling | derived from FRED `MTSDS133FMS` | monthly / pct | info | 75 |

#### Lane 5 — flows (2 voters)

| id | Indicator | Source & reference | Cadence / units | Page rule | staleAfterDays |
|---|---|---|---|---|---|
| `cftc-gold-positioning` | Gold NET positioning (COT) | CFTC `deafut.txt`, GOLD — COMMODITY EXCHANGE INC., futures-only: NonComm Net ÷ OI (%) | weekly / points | any-of thresholds (above 45 = crowded long) | 12 |
| `cftc-gold-gross-long` | Gold GROSS long share (COT) | same CFTC row: NonComm Long ÷ OI (%) | weekly / points | any-of thresholds (above 62) | 12 |

#### The reality object (not a voter)

| id | Indicator | Source | Notes |
|---|---|---|---|
| `gold-usd` | Gold price per ounce | gold-api.com XAU spot (history: World Bank Pink Sheet + daily accumulation) | daily / pct; info rule; `staleAfterDays: 2`. Read by model-vs-reality (§9) and the Outlook's range evidence (§8). |

### 3.5 Where the readings come from (pipeline)

- **Ingest cron (Cloudflare Worker, minute-triggered):** the rungs at
  04:10 (main build), 04:20 (rung-2 re-derivation), 04:25/04:27, 04:40
  UTC fetch every source, run `computeReading` per definition, and write
  the snapshot to KV. GitHub Actions `insights-ingest.yml` is
  belt-and-braces (idempotent writes; runner minutes were exhausted
  2026-10-20 — the Worker cron is the primary venue).
- **KV layout** (namespace `RATES`, domain-separated): `insights:snapshot`
  (the `InsightsSnapshot` JSON), `insights:hist:<id>` (downsampled 10-year
  series), `insights:status` (per-source freshness). No TTLs — freshness
  lives in the data.
- **Serve path:** `GET /api/insights` serves the stored snapshot; an
  hourly live-prices overlay (`mergeLivePricesIntoSnapshot`) refreshes the
  price-board rows (gold/silver/oil/…) afterwards and stamps
  `pricesAsOf` at serve time.
- **The SPA** fetches the snapshot once and re-derives the ENTIRE gold
  reading client-side through the same pure functions (`goldBalance`,
  `goldOutlookOf`) — the ingest writer and the SPA call the SAME module
  (the "one function, no drift" contract). Consequence: the gold meter
  has **no wire format of its own** (the historical `goldSummary` field
  was retired at OI-3/GB-S7; §9).

---

## 4. The shared evaluator

`evalLeg` in `packages/insights/src/connections.ts` — THE firing rule.
Every gold voter, in both engines, fires through this one function. It
answers: *does this indicator lean, which way, and why?*

### 4.1 The algorithm (exact)

```
evalLeg(id, reading) → { direction, level, lean }

1. threshold = SIGNAL_LEG_MOVE[id]           // may be undefined
2. DIRECTION (the move leg):
   if threshold exists AND reading.change30d is finite:
     change30d >  threshold → direction = 'rising'
     change30d < -threshold → direction = 'falling'
     otherwise              → direction = 'steady'
   else:
     direction = null                        // no move leg measurable
3. LEVEL (the decade-position leg):
   if reading.percentile10y is defined:
     percentile10y < 0.2 → level = 'low'
     percentile10y > 0.8 → level = 'high'
     otherwise           → level = 'typical'
   else:
     level = null                            // no level leg measurable
4. LEAN (resolution order — direction wins, level is the fallback):
   direction === 'rising'  → lean = +1
   direction === 'falling' → lean = −1
   else level === 'high'   → lean = +1
   else level === 'low'    → lean = −1
   else                    → lean = 0        // steady AND typical, or no inputs
```

Two facts follow that every revision MUST preserve:

- **A steady series parked at a decade extreme still leans.** `direction
  = 'steady'` with `level = 'high'` yields lean +1 — the level leg is the
  fallback, not an OR-gate. This is by design ("a series parked at an
  extreme still leans").
- **A seat with NEITHER input yields lean 0 with both outputs null.** The
  D-18 input-presence rule (§6 step 2) turns exactly this case into
  `unread` at the balance layer — it must never be counted as `steady`.

### 4.2 The threshold table — `SIGNAL_LEG_MOVE` (the move-leg minimums)

In each definition's `changeKind` units, over the cadence-aware
`change30d` (§3.2). This table is THE calibration surface of the meter —
change a value here and every window the corpus measured changes meaning.
Provenance: the original signals-card thresholds (S1–S2 era) + the five
GF-P1 derived values (the owner's recorded decision J, 2026-11-05,
derived by the GF-P0 calibration over the recorded corpus —
`evidence/gf-p0-calibration-2026-11-05.md` §3) + the four GF-P3 family
values (the standing delegation, mirrored in `GF_MOVE_P3_PROPOSED`).

| id | Threshold | Units | Provenance / measured firing share |
|---|---|---|---|
| `real-yield-10y` | **0.10** | points | S1-era. |
| `real-yield-5y` | **0.10** | points | GF-P3 (R2, rank 19 — the real-yield-10y's family). |
| `gold-usd` | **3** | pct | S1-era (the reality object). |
| `silver-usd` | **3** | pct | S1-era. |
| `brent` | **5** | pct | S1-era. |
| `dollar-basket` | **1.0** | points | S1-era. |
| `dollar-broad` | **1.0** | points | GF-P3 (D2, rank 20 — the basket's family). |
| `dollar-eme` | **1.0** | points | GF-P3 (D9, rank 21 — the basket's family). |
| `breakeven-5y5y` | **0.10** | points | S1-era. |
| `us10y` | **0.15** | points | S1-era. |
| `copper-gold` | **0.08** | points | S1-era. |
| `china-pmi` | **0.25** | points | S1-era. |
| `fed-expectations` | **0.13** | points | GF-P1 D-2/R6 (rank 1): change-led claim; measured share 50.7% (n=2512). |
| `usdjpy` | **1.38** | pct | GF-P1 D-3/D4 (rank 2): the only pct seat; measured share 51.4% (n=2494). |
| `fed-target` | **0.25** | points | GF-P1 R5: landed exactly on the FOMC step grid; measured share 7.0% (n=2512). |
| `term-premium-10y` | **0.07** | points | GF-P1 R9 (rank 6): activates with the P2 promotion; measured share 49.2%. |
| `t5yie` | **0.10** | points | GF-P1 R8 (rank 9): activates with the P2 promotion; measured share 50.7%. |
| `bank-stress` | **0.10** | points | GF-P3 S9 (rank 28 — the rate-move threshold family). |

**Every other voter has NO threshold** — it is level-leg-only (fires on
the decade position alone). Notable level-only seats: `breakeven-tilt`
(by explicit design — the D-5 promotion's recorded variant), `us30y`,
`ecb-dfr`, `vix`, `gold-silver`, `michigan-sentiment`, `gpr-daily`,
`epu-us`, `sp500-breadth-ratio`, `usd-reserve-share`, `nyfed-custody`,
`ebp`, `michigan-1y/5y-expectations`, `m2-us`, `us-deficit-12m`,
`cftc-gold-positioning`, `cftc-gold-gross-long`, `euro-hicp`,
`us-cpi-yoy`, `us-pce-core-yoy`, `us-japan-10y-gap`.

### 4.3 The readable rule

A voter participates only if its reading exists and
`status ∉ { 'stale', 'check-pending', 'unavailable' }`. The rule is
duplicated verbatim in `gold-score.ts` (private `readable`),
`gold-balance.ts` (private `readable`), and `gold-backtest-core.ts`
(private `readable`) — D-GB-9 forbids editing the frozen copies, and the
equivalence pin holds all three to one semantics. If you ever need to
change the readable set, you must change all three and re-run the pinned
equivalence tests.

---

## 5. The voter table

`GOLD_LANE_VOTERS` in `gold-score.ts` — THE single source of truth. Each
entry: `{ lane, id, polarity }` where **gold-direction = lean × polarity**
(+1 → tailwind/supports, −1 → headwind/pressures).

### 5.1 The five lanes and their semantics

| Lane (id) | Size | Tailwind word (frozen engine) | For-side meaning (live engine) | The classic claim (hedged) |
|---|---|---|---|---|
| `borrowing-costs` | 7 | `relief` | rates falling/low supports gold | Real rates are gold's opportunity cost — tight rates are the classic headwind; relief the tailwind. |
| `dollar` | 7 | `stress` | dollar weak/under stress supports gold | Gold is USD-priced; a strong dollar is the headwind, a stressed dollar the tailwind. |
| `stress` | 11 | `elevated` | elevated stress supports gold | Safe-haven bid: elevated stress usually supports gold; calm merely removes the bid (calm ≠ pressure — §16). |
| `inflation` | 10 | `hot` | hot inflation supports gold | Hedge demand: running-hot inflation and building expectations support gold. |
| `flows` | 2 | `elevated` (demand elevated) | …crowded longs are fragile — the lane is CONTRARIAN | Crowded positioning is the squeeze-then-slump zone; both seats carry polarity −1 (a rising crowded-long reading pressures gold). |

Headwind words: `tight` / `strong` / `calm` / `cool` / `calm`
respectively. In the live engine the vocabulary is `for`/`against` lane
sides with member impacts `supports`/`pressures` — the tailwind/headwind
words live only in the frozen engine and `GoldSummary` (02 §2 naming
note).

### 5.2 The 37 seats (display order = `GOLD_LANE_VOTERS` order)

Polarity −1 = the lean's positive direction (rising/high) is a HEADWIND
for gold. Polarity +1 = rising/high is a TAILWIND.

**Borrowing costs (7 — all polarity −1):**

| # | id | Polarity | Display name (EN) | Why seated (record) |
|---|---|---|---|---|
| 1 | `real-yield-10y` | −1 | Real yields | R1 COVERED — THE textbook driver. |
| 2 | `us10y` | −1 | US 10-year yield | R1's belt-and-braces (D-9 accept-with-note). |
| 3 | `us30y` | −1 | US 30-year yield | R1's belt-and-braces (D-10). |
| 4 | `fed-target` | −1 | Fed funds target | R5 COVERED — high policy rate = tight. |
| 5 | `fed-expectations` | −1 | Fed expectations | R6 PARTIAL → repaired at GF-P1 (D-2 threshold 0.13). |
| 6 | `ecb-dfr` | −1 | ECB deposit rate | R10's ECB leg. |
| 7 | `real-yield-5y` | −1 | Real yield (5y) | GF-P3 (standing delegation, §4 rank 19 / R2): the belly where policy bites first; the 10y twin. Owner-gated through the MEASURED POST-P3-5LANE scenario. |

**Dollar (7 — all polarity −1):**

| # | id | Polarity | Display name | Why seated |
|---|---|---|---|---|
| 8 | `dollar-basket` | −1 | Dollar basket | D1 COVERED. |
| 9 | `usdjpy` | −1 | USD/JPY | D4 PARTIAL → repaired at GF-P1 (D-3 threshold 1.38) — the funding currency. |
| 10 | `us-japan-10y-gap` | −1 | US−Japan 10y gap | R10 PARTIAL → repaired at GF-P1 (D-6 persistence) — carry fuel, dollar-positive. |
| 11 | `usd-reserve-share` | −1 | USD reserve share | GF-P2 (owner's recorded C): D5 ★ COBD → promote (§4 rank 13) — the dedollarisation inverse; the classic long-run channel. |
| 12 | `nyfed-custody` | −1 | Foreign custody at the NY Fed | GF-P2 (owner's recorded K): G4 ★ COBD → promote (§4 rank 18) — rising foreign custody = dollar-asset demand = headwind; the D5 pairing. |
| 13 | `dollar-broad` | −1 | Dollar (broad) | GF-P3: D2 MISSING-FREE → promote (§4 rank 20) — the broad trade-weighted dollar, "the honest inverse". |
| 14 | `dollar-eme` | −1 | Dollar (EME) | GF-P3: D9 MISSING-FREE → promote (§4 rank 21) — the marginal buyer's leg. |

**Market stress (11):**

| # | id | Polarity | Display name | Why seated |
|---|---|---|---|---|
| 15 | `stress-stlfsi` | +1 | STLFSI | S5 COVERED. |
| 16 | `nfci` | +1 | NFCI | S5 COVERED. |
| 17 | `vix` | +1 | VIX | S1 COVERED. |
| 18 | `gold-silver` | +1 | Gold/silver ratio | X1 PARTIAL → base deepened at P1 (D-5) — a high ratio IS the monetary-stress read. |
| 19 | `term-premium-10y` | +1 | 10-year term premium | GF-P2 (K): R9 MISSING-FREE → promote (§4 rank 6) — rises with fiscal/inflation-risk fear, gold-positive; the 0.07-pt threshold activates at P1. |
| 20 | `ebp` | +1 | Excess bond premium | GF-P2 (K): S4 MISSING-FREE → promote (§4 rank 7) — the literature's PREFERRED risk-appetite signal. |
| 21 | `michigan-sentiment` | **−1** | US consumer mood | GF-P2 (K): S13 MISSING-FREE → promote (§4 rank 10) — **polarity note: pessimism is gold-POSITIVE** (low sentiment = the tailwind side). |
| 22 | `gpr-daily` | +1 | Geopolitical risk (7-day) | GF-P2 (K): S7 → promote the DAILY object (§4 rank 11) — the event-risk channel; owner's object choice (the monthly `gpr-index` alternative fires 1114 vs the daily's 1316). |
| 23 | `epu-us` | +1 | US policy uncertainty | GF-P2 (K): S8 MISSING-FREE → promote (§4 rank 15) — regime uncertainty raises the hedging premium (the `tpu-us` alternative fires 1259 — recorded as the alternative). |
| 24 | `sp500-breadth-ratio` | **−1** | S&P 500 breadth | GF-P2 (owner's recorded C): S6 ★ COBD → promote (§4 rank 17) — falling breadth = risk-off = the tailwind side. |
| 25 | `bank-stress` | +1 | Bank stress | GF-P3: S9 MISSING-FREE → promote (§4 rank 28) — the Fed's discount window primary credit rate. (GF-S10 name repair: an earlier comment misdescribed DPCREDIT as the commercial paper rate; the seat itself untouched.) |

**Inflation (10 — all polarity +1):**

| # | id | Polarity | Display name | Why seated |
|---|---|---|---|---|
| 26 | `us-cpi-yoy` | +1 | US CPI | I1 COVERED. |
| 27 | `us-pce-core-yoy` | +1 | US core PCE | I2 COVERED. |
| 28 | `euro-hicp` | +1 | Euro HICP | N-1 — AMENDED (owner's recorded G, 2026-11-05): the v1.2 taxonomy amendment records the euro-area realised-inflation row; the audit denominator becomes 86. |
| 29 | `breakeven-5y5y` | +1 | 5y5y breakeven | R7 COVERED — rising inflation expectations. |
| 30 | `breakeven-tilt` | +1 | Inflation tilt | The D-5 promotion (Session 6, the owner's "we can have 21" on S4's B4 evidence): LEVEL-LEG ONLY — the shared evaluator carries no 30-day move threshold for it, so it fires on the decade position alone. |
| 31 | `t5yie` | +1 | 5-year breakeven | GF-P2 (K): R8 PARTIAL → promote (§4 rank 9) — the SPOT level's own claim; the 0.10-pt threshold (decision J) activates. |
| 32 | `michigan-1y-expectations` | +1 | 1-year inflation expectations | GF-P2 (K): I3 MISSING-FREE → promote (§4 rank 16) — households price inflation in before the market does. |
| 33 | `m2-us` | +1 | US money supply | GF-P2 (K): I7 ★ COBD → promote (§4 rank 14) — the debasement channel, YoY percentile basis. |
| 34 | `us-deficit-12m` | +1 | US 12-month deficit | GF-P2 (K): G1 MISSING-FREE → promote (§4 rank 8) — fiscal dominance, the debasement channel's fiscal leg. |
| 35 | `michigan-5y-expectations` | +1 | 5–10y inflation expectations | GF-S10 (standing delegation): I4 MISSING-FREE → promote (§4 rank 32) — the 5–10y household anchor, "the slow version of R7"; LEVEL-LEG ONLY (the I3 precedent). |

**Flows & demand (2 — both polarity −1, CONTRARIAN):**

| # | id | Polarity | Display name | Why seated |
|---|---|---|---|---|
| 36 | `cftc-gold-positioning` | −1 | Gold positioning (COT) | F1 PARTIAL → backfilled at GF-P1 (D-4) — crowded longs are fragile (the squeeze-then-slump zone — contrarian); re-seated to flows at GF-P2 (owner's recorded B, D-14). |
| 37 | `cftc-gold-gross-long` | −1 | Gold long positioning (COT) | GF-P2 (K): F2 MISSING-FREE → promote the REAL OBJECT (§4 rank 12) — the gross NonComm Long ÷ OI share, richer than the net; rides F1's backfill (same `deafut.txt` row). |

### 5.3 Deliberate exclusions (do NOT re-seat without the §12 process)

| Candidate | Why excluded |
|---|---|
| `govt-interest-revenue` | A fiscal-sustainability share whose gold signal is contested — high interest costs argue both ways. |
| The whole growth-health lane (`china-pmi`, `us-unemployment`, `sahm-rule`, …) | Members' gold relation is weak or two-sided; `copper-gold` is already a ratio ABOUT gold. |
| `brent` (in the inflation lane) | Supply shocks are not the hedge-demand channel the lane measures. |
| `yield-curve-10y2y` / `yield-curve-10y3m` | **GF-P1 (owner's recorded decision H, 2026-11-05): demoted to context cards** — the fixed −1 polarity sat on a regime-dependent claim (02 R4's locked treatment: "context/secondary"). The sign question re-opens with the REAL curve (D-11/D-12, DFII10−DFII5) — decided **context-by-choice** at round 2 (2026-11-07): `real-curve-10y5y` stays a rule:info context card, both signs measured near-identically (PLUS 26.8/12.3 · MINUS 27.3/11.3 level/full-tip %), no legibility edge justifies a contested vote. |
| `gold-btc`, `gold-oil-ratio` | Standing spec rule: context-only, never voting. |
| WGC family (F3/F4/F5/F13/F15/F16/H1–H4) | Blocked on licence (terms require prior written authorisation); the authorisation draft for info@gold.org sits at `docs/specs/gold-meter-gapfill/evidence/wgc-authorisation-draft-2026-11-07.md` — the owner's lever. |
| EODHD-sourced candidates (F9/F10/S2/S3/G7) | OI-GA-5: NO USE — free proxies carry every channel; the licence register fail-closes the paid class. |
| Shanghai premium seat (F6) | GF-S10: lands as a CONTEXT CARD — the SGE archive reaches only ~2024, so the seat is unmeasurable over the corpus; the seat question is recorded-open with the coverage fact printed. |
| MCX India parity (F7) | Venue-blocked (HTTP 403); recorded-open. |
| ICE BofA spreads, Cboe put/call, BIS API, PBoC rate, … | Rejected with live evidence in the 2026-10-26 gap audit — the standing "do not rebuild unless a source revives" list (`docs/INDICATORS_AND_DATA_SOURCES.md` §4). |

### 5.4 The voter-table lineage (never lose this)

The table's composition is a chain of owner-gated, measured changes. The
frozen historical snapshots live in `gold-backtest-core.ts`
(`HARNESS_GOLD_VOTERS_20/_21`) and `gf-p0-proposed.ts` (`GF_VOTERS_*`) so
every past calibration stays reproducible.

| Version | Seats (lane split) | Date / program | Change |
|---|---|---|---|
| S4 frozen | 20 (8/3/5/4) | 2026-10-31 | The original backtest basis (`HARNESS_GOLD_VOTERS_20`). |
| Session 6 (D-5) | 21 (8/3/5/5) | 2026-10-31 | `breakeven-tilt` promoted — the owner's "we can have 21" (`HARNESS_GOLD_VOTERS_21`). Measured effect: sign-agreements 52.1/47.6/43.9% vs baseline 51.7/46.9/43.9% — "no measurable edge"; a scope choice, not an edge claim. |
| GF-P1 (decision H) | 19 (6/3/5/5) | 2026-11-05 | The two yield-curve seats demoted to context (regime-dependent polarity). |
| GF-P2 (answers B/C/G/K) | 32 (6/5/10/9/2) | 2026-11-05 | The five-lane flip: `flows` lane added (B); 12 zero-new-fetch promotions (K); D5+S6 COBD promotions (C); the euro-hicp v1.2 amendment (G); `cftc` re-seated into flows (D-14). Composition = the calibration's measured POST-P2-5LANE. |
| GF-P3 (standing delegation) | 36 (7/7/11/9/2) | 2026-11-06 | The four FRED-sourced seats: `real-yield-5y` (R2), `dollar-broad` (D2), `dollar-eme` (D9), `bank-stress` (S9) — owner-gated through the MEASURED POST-P3-5LANE scenario. |
| **GF-S10 (current)** | **37 (7/7/11/10/2)** | 2026-11-06 | `michigan-5y-expectations` (I4) seated — the POST-P4-5LANE measured composition. **UNCHANGED since.** |

Each change is pinned: `gf-p0-proposed.test.ts` asserts the harness twins
equal production modulo the recorded mappings, and the verify scripts
(`packages/insights/scripts/gf-p{1..5}-verify.ts`, `gf-p0-calibration.ts`)
re-run the corpora and pin production ≡ the recorded scenario in ALL 2512
windows. The acceptance walk (GF-S12/P5, 2026-11-07) verified the whole
chain: the calibration re-run was byte-for-byte identical
(sha `212ece76…`), tests 14,620 green, and the live production matrix read
**for 2 · against 1 · neutral 2 · unread 0 — 5 of 5 lanes readable**.

---

## 6. The live engine — `goldBalance()`

`packages/insights/src/gold-balance.ts`. Pure over the readings; the SPA
and any server-side consumer call the same function. Deterministic and
order-independent for readings; never throws on missing/empty input
(every lane then reads `unread`).

### 6.1 The algorithm (exact, step by step)

```
goldBalance(readings) → { lanes[5], counts, net, readable }

For each lane L in GOLD_LANES (borrowing-costs, dollar, stress, inflation, flows):
  members = []; readableCount = 0; supports = 0; pressures = 0

  For each seat (lane=L, id, polarity) in GOLD_LANE_VOTERS (table order):
    r = readings[id]

    1. UNREADABLE — r missing, or r.status ∈ {stale, check-pending, unavailable}
       → member { id, impact: 'unread', evidence: null }; continue

    2. INPUT-PRESENCE (D-18, the owner's recorded decision I, GF-P1):
       leg = evalLeg(id, r)
       if leg.direction === null AND leg.level === null
       → member { id, impact: 'unread', evidence: null }; continue
       (the evaluator had NOTHING to evaluate — no threshold+finite change30d,
        no percentile10y — never a 'steady' word on an inputless seat;
        the fake-steady class, audit finding D-18, manufactured false
        confidence for ~30 weeks before this rule)

    3. readableCount += 1
       if leg.lean === 0 → member { id, impact: 'steady', evidence: null }; continue

    4. impact = (leg.lean × polarity === 1) ? 'supports' : 'pressures'
       evidence = direction==='rising' ? 'rising'
                : direction==='falling' ? 'falling'
                : level==='high' ? 'high' : 'low'
       (the evaluator's own word for WHY it leaned — a qualifying 30-day
        direction first, else the decade-extreme level)
       member { id, impact, evidence }
       supports++ / pressures++

  firing = supports + pressures
  Lane side:
    readableCount === 0            → side 'unread'
    firing < GOLD_LANE_MIN_FIRING  → side 'neutral', split=false   (MIN2: one voter never moves a lane)
    supports > pressures           → side 'for'
    pressures > supports           → side 'against'
    supports === pressures (>0)    → side 'neutral', split=true    (the "split" mixed chip)

counts = { for, against, neutral, unread }  over the five lane sides
net      = counts.for − counts.against
readable = counts.for + counts.against + counts.neutral
```

**`unread` and `neutral` are NEVER merged** (problem P5's fix): `unread`
means nothing could be read; `neutral` means readable evidence that either
isn't firing or splits evenly. The UI keeps them visually and semantically
distinct (the "Not leaning" tray vs the "couldn't be read" state).

### 6.2 The thresholds and their measured justification

| Constant | Value | File | Meaning & provenance |
|---|---|---|---|
| `GOLD_LANE_MIN_FIRING` | **2** | `gold-balance.ts` | The crowd minimum (D-GB-3): a lane votes only when ≥ 2 of its voters fire. Chosen by the GB-S1 P0 calibration (02 §6) on the PRE-REGISTERED criteria over 2512 windows, measured twice independently: **C1 PASS** (level 25.0% ≤ 70%; full-tip 49.7% ≤ 60%), **C2 PASS** (verdict flips 8 per 60td ≤ the 21-voter net-sign's 9). Reversing it means a dedicated gated session, never a silent edit. |
| `GOLD_LANE_STRONG` | **4** (of 5) | `gold-balance.ts` | The Outlook card's strong bar (01 §5.2). GF-P2 (owner's recorded answer B): with five lanes the bar sits at 4-of-5 = 80%, preserving the old 3-of-4 = 75% strictness (3-of-5 = 60% would have quietly loosened it). |

### 6.3 The output shape (`GoldBalanceReading`)

```ts
interface GoldBalanceReading {
  lanes: GoldBalanceLane[];   // exactly 5, GOLD_LANES order
  counts: { for: number; against: number; neutral: number; unread: number };
  net: number;                // for − against
  readable: number;           // for + against + neutral
}
interface GoldBalanceLane {
  lane: GoldLane; side: GoldBalanceSide; split: boolean;
  readable: number; firing: number; supports: number; pressures: number;
  members: GoldBalanceMember[];   // EVERY voter of the lane, table order (unread included)
}
interface GoldBalanceMember {
  id: IndicatorId;
  impact: 'supports' | 'pressures' | 'steady' | 'unread';
  evidence: 'rising' | 'falling' | 'high' | 'low' | null;   // null for steady/unread
}
```

### 6.4 Properties the tests pin (gold-balance.test.ts)

- One firing voter → `neutral` (split=false) — one voter never moves a lane.
- Two firing same-side → `for`/`against`; 2v2 → `neutral` split=true;
  3v1 → `for` (strict majority of the FIRING voters).
- All-stale/missing lane → `unread`; readable-but-all-steady → `neutral`
  (NOT unread); adding a stale voter never changes a lane's side.
- The D-18 matrix: inputless → `unread`; level-alone or move-alone inputs
  keep the seat readable; a `change30d` WITHOUT a threshold is NOT a move
  input (no bar to clear).
- The equivalence pin: `goldBalance(readings)` ≡
  `laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 2, /* inputPresence */ true)`
  over every battery — the production engine and the harness cannot drift.

---

## 7. The visual layer

`apps/web/src/components/insights/signals/BalanceScale.tsx` (+ `BalanceWeight.tsx`,
rendered by `MergedCard.tsx`). The visual is GB-S4's owner-approved redesign
(the assay-office stage: brass tapered beam, pivot + 11-tick dial, column +
base, bowl pans with brass rims, lane WEIGHTS with segmented rims — one
segment per firing voter, never an invented magnitude).

### 7.1 The beam formula (D-GB-8, unchanged through every redesign)

```
directional = counts.for + counts.against          # the tipped lanes
ratio       = |counts.net| / directional           # share of the directional load on the heavy side
beamAngle   = clamp(ratio × 10°, 3°, 10°)          # degrees; exactly 0° when net = 0
sparse      = counts.readable < 3                  # UI-40: NOT a reading
targetDeg   = sparse ? 0° : ±beamAngle             # sign: heavy side dips
```

- A one-sided pan tips the whole way (|net| = directional → 10°).
- `fullyTipped` (the harness's word) = `|net| === for+against`.
- The **sparse rule (UI-40)**: fewer than 3 readable lanes is not a
  reading — the beam stays level, the verdict word becomes the honest
  "not enough readable conditions", the needle/dial hides.
- The number of tiles/weights NEVER sets direction — only the model's net
  does (rule 4 of the visual spec).

### 7.2 The mechanics (v7, kept verbatim through GB-S4)

EXACTLY ONE animated value θ drives everything (one React state → one
render; no element carries its own CSS transition so nothing can desync):
the BEAM GROUP (beam bar + pivot ring + needle) rotates by
`rotate(θ, pivotX, pivotY)`; each PAN translates ONLY by `translate(0, dy)`
so it hangs plumb from its beam-end joint; the hanger lines are redrawn
every frame from joint → pan-rim corners. Animation: 650 ms ease-out
QUARTIC on load and on data change; `prefers-reduced-motion` lands
immediately. RTL flips the rotation sign in the geometry so the heavy
side's end always dips.

### 7.3 What renders around the beam

- **Lane weights:** one chip per lane in the pans — `for` lanes in the
  supportive pan, `against` in the adverse pan, segmented rims = firing
  voters. Pressing a weight opens its ledger row (scroll + focus).
- **The verdict block (hero):** the verdict word
  (`balanceVerdictWordOf`: readable 0 → "can't read"; 1–2 → "not enough
  readable"; else for/against/balanced by net sign) + the counts parts
  ("{n} for · {n} against · {n} not leaning" + unread when > 0).
- **The "Not leaning" tray:** neutral/unread lane chips (split lanes carry
  the mixed badge).
- **The inline LEDGER:** one expandable row per lane — every member, its
  impact word, its evidence phrase, its live value. The
  `breakeven-5y5y` member line additionally carries the indicator card's
  own status word (B-12: the list can never say "elevated" beside a card
  reading Normal — pinned by test).
- **The context line (01 §6):** gold's own 30-day change, shown FOR
  CONTEXT ONLY — never counted in the balance or the Outlook (it replaced
  the model-vs-reality chip at the consolidation).
- **The measured note + link (01 §8.2):** visible without a tap, pointing
  at `docs/insights/BACKTEST-GOLD-LANES.md` — no edge claimed.
- **The C12 banner (Step-1 audit item C12):** renders when
  `gold-usd.percentile10y ≥ 0.9` AND `real-yield-10y.percentile10y ≥ 0.8`
  AND `real-yield-10y.value > 0` — the one named interaction the separate
  blocks cannot say ("gold near its decade high while real yields sit
  high").
- **The price-footing strip (below, separated):** per-metal price,
  position band word, 30-day speed. FOOTING IS NOT A DRIVER — never
  counted in totals/net/readable.

---

## 8. The gold Outlook — `goldOutlookOf()`

`apps/web/src/components/insights/signals/verdict.tsx`. The VerdictStrip's
gold leg (the "Gold Market Outlook" sentence). Derived from the SAME
`goldBalance()` result that drives the balance (D-GB-6 / AC-3 — the strip
can never contradict the balance).

### 8.1 The decision tree (exact)

```
L = balance.counts.for; A = balance.counts.against
speed    = gold SignalReading.speed     (gold-usd.change30d, %; null while accruing)
position = gold SignalReading.position  ({band: low|typical|high, percentile})

1. balance.counts.unread === GOLD_LANES.length (5) → null      # "nothing could be read"
2. L ≥ GOLD_LANE_STRONG (4)  → 'strong-bullish'
3. A ≥ GOLD_LANE_STRONG (4)  → 'strong-bearish'
4. rangeEvidence = speed ≠ null AND |speed| < RANGE_SPEED_PCT (2%)
                   AND position ≠ null AND position.band === 'typical'
   rangeEvidence AND |L − A| ≤ 1 → 'range-bound'
5. L === A → L > 0 ? 'mixed' : 'neutral'
6. else → L > A ? 'bullish' : 'bearish'
```

**Why footing counts nowhere (AC-7, D-GB-5):** the legacy Outlook's 5th
condition was gold's own 30-day move — circular (a bearish footing read
beside a balanced balance). The consolidation removed it; price enters
ONLY at step 4, describing consolidation, never direction.

`RANGE_SPEED_PCT = 2` — the same ±2%-over-30-days bar as the frozen
engine's `GOLD_REALITY_SPEED_PCT` and the outlook classifier's legacy
`outlookOf` (silver keeps `outlookOf`; `LEAN_STRONG = 4` there is the
conditions-based twin of the lane bar).

### 8.2 The seven states + null

`strong-bullish · bullish · neutral · range-bound · mixed · bearish ·
strong-bearish · null(nothing readable)` — each renders an exact bilingual
sentence (`s.verdictStates[state][metal]`, EN + fa), led by the zigzag
icon (colour never rides alone; the calm states share the muted ink).

---

## 9. The frozen engine

`goldTailwindScore` / `goldSummaryOf` / `modelVsReality` in
`gold-score.ts`. **Retired from the UI and the wire at GB-S6/OI-3/GB-S7
(2026-11-04); still running unchanged (D-GB-9)** for the backtest and
recheck lineages. `GoldSummarySchema` stays exported as the engine's own
output contract. Any change to it is a §12-governed change.

### 9.1 `goldTailwindScore(readings)` — the tailwind reading

Same firing pipeline as §6 (readable rule → evalLeg → lean × polarity)
but scored GLOBALLY instead of per-lane:

```
tailwindVoters / headwindVoters / firingVoters = counts over ALL 37 seats
netScore = tailwindVoters − headwindVoters                      # signed

label (5-step, share-based — the gauge-step philosophy):
  firingVoters === 0                          → null            # "cannot read yet"
  net > 0 AND firing ≥ 3 AND net/firing ≥ 0.5 → 'strong-tailwind'
  net > 0                                     → 'tailwind'
  net === 0                                   → 'balanced'
  net < 0 AND firing ≥ 3 AND −net/firing ≥ 0.5 → 'strong-headwind'
  else                                        → 'headwind'

subGauges (per lane): unanimous tailwind → lane tailwind word
                       unanimous headwind → lane headwind word
                       both directions     → 'mixed'
                       nothing firing      → 'unreadable'
laneCounts = { tailwind, headwind, mixed }   # unreadable lanes count nowhere
```

`GOLD_STRONG_SHARE = 0.5`, `GOLD_STRONG_MIN_FIRING = 3` (the crowd
minimum — one firing driver can never read "strong"), both in
`gold-score.ts`.

### 9.2 `modelVsReality(readings)` — the comparison (retired panel)

Model direction from the label (tailwind family → `tailwind`, headwind
family → `headwind`, balanced → `neutral`, null → no read). Reality from
`gold-usd`: prefer `change30d`, fall back to `ma200GapPct`, neither →
no-read. Reality buckets at **±`GOLD_REALITY_SPEED_PCT` = 2%** (the same
bar as the outlook's range-bound state). Chips:
`aligned-tailwind · aligned-headwind · diverging-up (headwind model,
rising price) · diverging-down (tailwind model, falling price) · neutral ·
no-read`; the explainer key splits `neutral` into `model-neutral` /
`reality-flat` (pure selection — the panel never chose copy).

**The one-tick skew (honest limitation):** the ingest stamped
`modelVsReality` at build time; the serve path's live-prices overlay could
refresh `gold-usd.change30d` an hour later, so the stored chip could lag
the tile by one hourly tick (the ±2% bar made a flip rare).

### 9.3 `goldSummaryOf(readings)` — the retired wire shape

The compact numbers (`netScore, label, firingVoters, tailwindVoters,
headwindVoters, laneCounts, subGauges[4→5], modelVsReality`) WITHOUT the
voter list (~0.5 KB). The `goldSummary` snapshot FIELD was retired at
OI-3/GB-S7 — the flipped UI never read it; the recheck lineage reads the
HISTORICAL stamps from the raw archive JSON; stored snapshots carrying
the field still parse (zod strips the unknown key).

---

## 10. The legacy signals card

`evaluateSignal` in `packages/insights/src/signals.ts` — the "What the
signals say" checklist (UI spec Blocks S1–S3). Gold's five conditions:

| Condition | Inputs | Evaluator |
|---|---|---|
| `real-yield` | `real-yield-10y` | `evalLeg` lean: <0 supportive, >0 against, else neutral |
| `expectations` | `breakeven-5y5y` | supportive ONLY when the card's own status is `warning` (B-12) |
| `stress` | `stress-stlfsi` + `nfci` | either index > 0 → supportive; both < 0 → against; else neutral |
| `dollar` | `dollar-basket` | `evalLeg` lean sign |
| `footing` | the metal's own price row | change30d ≥ 0 → supportive (else against); percentile ≥ 0.5 while accruing |

Silver adds `industrial` (`china-pmi` + `copper-gold`, always tagged
"mixed"). `LEAN_STRONG = 4`: ≥4 supportive → `mostly-supportive`, ≥4
against → `mostly-unsupportive`, else `mixed`; all-unknown → null.

**Current role:** silver's checklist is still its live model (OI-4 — its
own future decision). For GOLD, since GB-S6 the VerdictStrip leg uses
`goldOutlookOf` and the header prose uses the lane model; the gold
checklist's surviving outputs are `position` (the 10-year band:
<0.2 low, >0.8 high) and `speed` (change30d) — the range evidence
`goldOutlookOf` reads at step 4.

---

## 11. The backtest & calibration harness

The honesty machinery. `gold-backtest-core.ts` + the runner script
`packages/insights/scripts/gold-backtest.ts` + the gap-fill calibration
scripts (`gf-p0-calibration.ts`, `gf-p{1..5}-verify.ts`), over the
recorded corpora under `packages/insights/fixtures/` (the corpus of
record: 2512 daily windows, 2016-11-07 → 2026-11-03; mature base
≥ 2021-09-23, n = 1287).

### 11.1 The harness's own honesty rules (B3)

1. **No wall-clock reads** — every function takes its dates as explicit
   parameters (the runner passes the frozen clock).
2. **No lookahead** — `seriesUpTo(series, asOfDay)` truncates every
   series at the as-of date BEFORE any scoring math sees it (binary
   search; the belt-and-braces guarantee on top of `computeReading`'s own
   `now` anchoring — pinned equal by test).
3. **Pinned equivalence** — `scoreOverVoters(r, GOLD_LANE_VOTERS) ===
   goldTailwindScore(r)` and (§6.4) `laneBalanceOverVoters(...) ===
   goldBalance(...)` on synthetic batteries: the harness cannot drift
   from production.

### 11.2 The realized-move join (B2) — and the measured no-edge record

Forward N-TRADING-DAY returns (`GOLD_BACKTEST_HORIZONS = [5, 20, 60]`),
EXACTLY N observations ahead, never interpolated. The flat band scales the
engine's own ±2%-over-30-calendar-days bar linearly:
`flatBandPct(n) = 2 × (n × 7/5) / 30` percent — one constant, one scaling
rule, no per-horizon tuning. `signAgreement` tests only windows where
both the model leans (net ≠ 0) and the return escapes the band.

**The measured record (BACKTEST-GOLD.md, the 21-voter frozen table,
mature base):** sign-agreements **46.8 / 42.2 / 32.7%** at 5/20/60td —
all departing below the coin. The lane-balance lineage tables
(BACKTEST-GOLD-LANES.md): 51.9 / 46.6 / 41.1% at 5/20/60td (against-readings
before larger rises), lineage only, **not used for selection**. The D-5
promotion's delta: +0.4/+0.7/+0.0pp — "no measurable edge". **No
forecasting edge is claimed or implied anywhere; the meter reads
conditions today.** Any revision that turns a measured number into a
selection criterion inverts D-GF-3.

### 11.3 The lane calibration (GB-S1 P0 / re-run at every material set change)

`laneBalanceOverVoters(readings, voters, minFiring, inputPresence=false)`
is the parameterized twin; `laneCalibrationStats` + `medianFlipsPer60`
compute the pre-registered statistics; the criteria, fixed in advance:

- **C1 (not degenerate):** level ≤ 70% of all windows AND fully-tipped ≤ 60%.
- **C2 (smoother than the old count):** median verdict flips per 60
  trading days ≤ the same figure on the net sign.
- Decision rule: MIN2 if both hold, else MIN1 if both hold, else STOP and
  bring the numbers to the owner — do not ship.

**MIN2's measured pass (n=2512):** level 25.0% · full-tip 49.7% · flips 8
vs net-sign 9. The GF-P0 re-run over every proposed scenario kept the
criteria and MIN2 as the default (the owner's recorded answer A: the C2
failure on richer sets is the price of coverage — richer lanes vote more;
the absolute smoothness stays comparable — 8–10 vs the frozen 8).

### 11.4 The frozen scenario tables (gf-p0-proposed.ts)

`GF_VOTERS_FROZEN_21` (the pre-P1 production), `GF_VOTERS_P1_DEMOTE`
(19), `GF_VOTERS_P2_4LANE` (31), `GF_VOTERS_5LANE` (32 — the POST-P2
measured composition), `GF_VOTERS_P3_5LANE` (36), `GF_VOTERS_P4_5LANE`
(37 ≡ production modulo the F2 id mapping), `GF_VOTERS_REALCURVE_PLUS`
and `_MINUS` (the D-11/D-12 measured sign variants — both kept as the
record of the question, neither seated). Plus the threshold maps
`GF_MOVE_FROZEN_BASE` / `GF_MOVE_P1_PROPOSED` / `GF_MOVE_P3_PROPOSED`.
**These are read-only lineage: do not edit; a new composition gets a NEW
table with its scenario name and its measured evidence file.**

---

## 12. Governance — how the meter may change

The meter is live for every visitor on currena.ir; its composition is a
chain of recorded owner decisions. **The per-seat approval rule (D-GF-1,
inherited from D-GB-9 as amended at GB-S7): every `gold-score.ts` /
`GOLD_LANE_VOTERS` edit requires the owner's RECORDED approval per seat
change, with the audit report §4 row (or the calibration's measured
scenario) as the justification attached. Nothing executes without it.**

The standing constraints (binding every session, from
`docs/specs/gold-meter-gapfill/01-FILL-SPEC.md` §3):

| ID | Rule |
|---|---|
| D-GF-1 | Per-seat approval rule (above). New voter sets live in read-only harness tables beside the frozen ones until the owner's go. |
| D-GF-2 | The beam formula, the honesty rules and the no-edge record are inherited UNCHANGED. The min-2 lane rule is RE-DERIVED, not assumed, at every material set change (the C1/C2 protocol re-run). |
| D-GF-3 | No forecasting claim anywhere. Calibration measures firing statistics and lane behaviour, never predictive power. Realised-move tables are lineage-only, labelled "not used for selection". |
| D-GF-4 | Free-first: every source free/keyless/licence-clean. EODHD only with per-item owner approval (none proposed — OI-GA-5). |
| D-GF-5 | Every number from a run or a citation; recommendations re-checked against code before writing. Evidence files carry their runnable record (script + committed output). |
| D-GF-6 | **P0 wraps around every voter-set change** — no new voter counts before the recalibration re-runs; repairs before expansions; the lane rule and C1/C2 re-derive at every material set change. |
| D-GF-7 | The taxonomy is LOCKED (02 v1.1 = 85 rows, locked 2026-11-05; amended to v1.2 = 86 rows by the owner's recorded G). Additions are owner-recorded amendments with dates only. |
| D-GF-8 | The D-18 readable-rule question is decided: inputless seats read `unread`, never `steady`. |
| D-GF-9 | Delivery discipline: branch `gf/<phase>`, commit+push per milestone, `pnpm gates` green before every push, CI green verified on main; docs-only sessions deploy nothing. |

**The successor discipline (the gap-fill program's close, 2026-11-07):**
any future change to the meter — voter, lane rule, threshold, beam,
Outlook — is a NEW owner-gated program on the same per-seat discipline:
the recorded approval + the measured scenario + the P0 wrap first.

---

## 13. Revision guide — how to safely change the system

The cookbook for the "revise and improve" future this document exists for.
**Every row is subject to §12** — the technical steps below are what
happens AFTER the owner's recorded go.

### 13.1 I want to add/remove/replace a voter seat

1. Record the owner's approval with its justification (the audit §4 row
   or the new measured scenario) — D-GF-1.
2. Edit `GOLD_LANE_VOTERS` in `gold-score.ts` (one line; keep the table
   order = lane order, and the provenance comment citing the decision).
3. If the seat needs a move threshold: derive it (never assume — the
   D-1/§4.2 precedent) and add it to `SIGNAL_LEG_MOVE` in
   `connections.ts` with the derivation record in the comment.
4. Add a NEW frozen scenario table in `gf-p0-proposed.ts` (never edit an
   existing one) + its calibration evidence under
   `docs/specs/gold-meter-gapfill/evidence/`.
5. Re-run the calibration (D-GF-6): `gf-p0-calibration.ts` over the
   corpus, C1/C2 verdicts, and a verify script pinning
   production ≡ the new scenario in ALL windows.
6. Update the pin tests: `gold-score.test.ts` (seat count, lane counts,
   no duplicates), `gf-p0-proposed.test.ts` (the new twin), the
   equivalence pins stay untouched-by-construction.
7. If the seat renders on the page: the copy round (EN + fa
   `voterNames`/`laneNames`), the definitions card, the source adapter,
   and the licence register row.
8. Update §5 of this document (the table + the lineage).

### 13.2 I want to change a threshold

`SIGNAL_LEG_MOVE` in `connections.ts`. Re-run the GF-P0-style derivation
over the corpus (the firing-share walk); record the derivation; expect
the harness twins (`GF_MOVE_*`) to need a NEW proposed map (pinned by
test to mirror production). A threshold change silently re-weights every
window — D-GF-6's wrap applies.

### 13.3 I want to change the lane rules / crowd minimum

`GOLD_LANE_MIN_FIRING` in `gold-balance.ts`. Reversing MIN2 means a
dedicated gated session with the C1/C2 protocol re-run (D-GB-3's own
rule). The equivalence pin (`gold-balance.test.ts`) and the harness twin
`HARNESS_GOLD_LANES_MIN2/_MIN1` must move together.

### 13.4 I want to change the beam formula or the visual

The formula is D-GB-8 lineage (D-GF-2: inherited UNCHANGED) —
`balanceTilt`/`signedTiltDeg` in `BalanceScale.tsx` + the harness's
`beamAngle` in `laneBalanceOverVoters`. The 3° floor, the 10° cap, the
sparse rule (readable < 3), and "counts never set direction" are
owner-approved design constants. Keep the one-animated-value machinery.

### 13.5 I want to change the Outlook

`goldOutlookOf` in `verdict.tsx` — the contract is 01 §5.2 (steps 1–5,
§8.1 here). `GOLD_LANE_STRONG` rides the lane count (4-of-5 at five
lanes); price enters ONLY at the range-evidence step (AC-7).

### 13.6 The gates

`pnpm gates` before every push: typecheck (both tsconfigs), lint,
`copy:audit` (the Persian copy manifest), the narrator-vocabulary drift
check, the strict Layer-1 validator, the full test suite, build + budget.
CI is red owner-side; the local gates are the bar.

### 13.7 The classic pitfalls (each has bitten once — the tests exist because of them)

| Pitfall | The guard |
|---|---|
| Drifting engines (harness ≠ production) | The two equivalence pins (§6.4, §11.1). |
| The fake-steady class (inputless seats reading steady) | D-18 rule + its test matrix. |
| Reweighting by stealth (a seat change without re-calibration) | D-GF-6's P0 wrap. |
| `unread` and `neutral` merged | P5's fix + the tray/verdict copy split. |
| Footing circularity (gold's own price voting on gold) | AC-7 / D-GB-5 — price only at step 4. |
| The B-12 copy lie ("elevated" beside a Normal card) | The member-line status-word pin. |
| A one-voter lane tip | MIN2 + test 1. |
| Monthly `change30d` misread as a 30-day window | The cadence-aware semantics (§3.2) + the threshold derivations assume it. |

---

## 14. Constants quick reference

Every number that shapes the gold reading, in one table. (File = repo path.)

| Constant | Value | File | Meaning |
|---|---|---|---|
| `GOLD_LANES` | `['borrowing-costs','dollar','stress','inflation','flows']` | `gold-score.ts` | Lane set & display order (the 5th added GF-P2). |
| `GOLD_LANE_VOTERS` | 37 seats: 7/7/11/10/2 | `gold-score.ts` | THE voter table (§5.2). |
| `GOLD_LANE_MIN_FIRING` | 2 | `gold-balance.ts` | Lane crowd minimum (D-GB-3, C1/C2-measured). |
| `GOLD_LANE_STRONG` | 4 | `gold-balance.ts` | Outlook strong bar (4-of-5 = 80%). |
| `GOLD_STRONG_SHARE` | 0.5 | `gold-score.ts` | Frozen engine's strong share (net/firing). |
| `GOLD_STRONG_MIN_FIRING` | 3 | `gold-score.ts` | Frozen engine's crowd minimum. |
| `GOLD_REALITY_SPEED_PCT` | 2 | `gold-score.ts` | Model-vs-reality ±2%/30d bar. |
| `RANGE_SPEED_PCT` | 2 | `verdict.tsx` | Outlook range-bound speed bar (the same bar). |
| `SIGNAL_LEG_MOVE` | §4.2's table (20 entries) | `connections.ts` | The move-leg minimums. |
| level bands | <0.2 low · >0.8 high | `connections.ts` (`levelOf`) | The decade-position legs. |
| `LEAN_STRONG` | 4 | `signals.ts` | The checklist lean bar (silver's outlook). |
| Beam | `|net|/(for+against)×10°` clamped [3,10] | `BalanceScale.tsx` + `gold-backtest-core.ts` | D-GB-8. |
| Sparse rule | readable < 3 → level | `BalanceScale.tsx` | UI-40. |
| `PERCENTILE_WINDOW_DAYS` | 3650 | `scoring.ts` | The "10 years" percentile window. |
| `MIN_PERCENTILE_OBS` | 30 | `scoring.ts` | Percentile base floor. |
| `GRACE_DAYS` | daily 4 · weekly 10 · monthly 45 · quarterly 120 | `scoring.ts` | Default staleness (per-series overrides in §3.4). |
| Change tolerances | 7d→3 · 30d→5 · 90d→10 days | `scoring.ts` | Window-anchor honesty. |
| `GOLD_BACKTEST_HORIZONS` | [5, 20, 60] trading days | `gold-backtest-core.ts` | The realized-move horizons. |
| `flatBandPct(n)` | `2 × (n×7/5) / 30` % | `gold-backtest-core.ts` | The scaled flat band. |
| `LANE_CALIB_LEVEL_MAX_SHARE` | 0.7 | `gold-backtest-core.ts` | C1 ceiling. |
| `LANE_CALIB_FULLTIP_MAX_SHARE` | 0.6 | `gold-backtest-core.ts` | C1 ceiling. |
| `LANE_CALIB_FLIP_WINDOW` | 60 trading days | `gold-backtest-core.ts` | C2 window. |
| `BREAKEVEN_TILT_DEADBAND_PT` | 0.1 | `breakeven-tilt.ts` | The context-phrase deadband (display only). |
| C12 banner | gold pct ≥ 0.9 · real-yield pct ≥ 0.8 · value > 0 | `MergedCard.tsx` | The one named interaction. |
| Animation | 650 ms ease-out quartic | `BalanceScale.tsx` | The θ tween (reduced-motion lands). |

---

## 15. Vocabulary / glossary

| Word | Meaning |
|---|---|
| **voter / seat** | One indicator's membership row in `GOLD_LANE_VOTERS` — a `(lane, id, polarity)` triple. |
| **lane** | One of the five driver families (a sub-gauge). |
| **firing** | A readable voter whose `evalLeg` lean is ±1. |
| **readable** | Status ∉ {stale, check-pending, unavailable} — plus (D-18) at least one evaluator input. |
| **steady** | Readable, lean 0 — honestly not firing. |
| **unread** | Not readable (silence, never worded as signal). |
| **lean** | `evalLeg`'s ±1 (rising/high vs falling/low). |
| **polarity** | The seat's fixed gold-direction sign: gold-direction = lean × polarity. |
| **tailwind / headwind** | The frozen engine's impact vocabulary (lean×polarity = ±1). |
| **supports / pressures** | The live engine's identical-meaning vocabulary (02 §2's naming note). |
| **evidence** | The evaluator's own word for WHY a voter fired: rising/falling (a qualifying 30-day direction) or high/low (the decade-extreme level fallback). |
| **split** | A lane with supports === pressures > 0 — readable disagreement (the mixed chip); distinct from a quiet neutral. |
| **net** | Lanes for − lanes against (the beam's driver). |
| **readable (balance-level)** | for + against + neutral lanes (the sparse-rule denominator). |
| **fully tipped** | `|net| = for+against` — the one-sided 10° tip. |
| **sparse** | Fewer than 3 readable lanes — not a reading (UI-40). |
| **level-leg-only seat** | A voter with no `SIGNAL_LEG_MOVE` threshold — fires on percentile10y alone. |
| **COBD** | "Could have been done" — audit rows for objects already carried but not seated. |
| **owner-gated** | Requires the owner's RECORDED approval per seat change (D-GF-1). |
| **P0 wrap** | The rule that the calibration re-runs around every voter-set change (D-GF-6). |
| **frozen** | Code kept running unchanged for lineage (D-GB-9); edits forbidden without a new gated program. |
| **harness twin** | A read-only parameterized copy in the harness, pinned equal to production by test. |
| **one function, no drift** | Ingest writer and SPA call the SAME pure module — the numbers cannot disagree. |

---

## 16. Known limitations & honest disclosures

1. **No forecasting edge.** The measured record (§11.2) departs below the
   coin at every horizon. The meter describes conditions today. This is
   the operative honesty bar (D-GF-3); every measured table in the repo is
   labelled "not used for selection".
2. **The one-tick skew** (§9.2, historical): the retired model-vs-reality
   chip could lag the live price tile by one hourly tick. The current
   context line re-derives from the page's own readings, so the class is
   gone; the record stays.
3. **Thin-history seats.** `cftc-gold-positioning`'s history began
   2026-10-26 (the single-point floor was the designed shape; the second
   point lands with the next weekly file). `gold-silver`'s base was
   deepened at P1 (D-5). Quarterly seats (`usd-reserve-share`) fire on
   quarter-lagged data — structural regime, not the month's direction
   (OI-GA-4's context-first reasoning).
4. **Recorded-open items** (each stands on its record, none owed):
   F7 MCX venue-blocked · F12 fail-closed 'awaiting data' · the WGC
   family pending the authorisation reply (the draft is the owner's
   lever) · the D-11/D-12 real-curve sign question closed
   context-by-choice · the D7 usdchf seat question closed no-seat ·
   promotion criteria recorded in the context cards' comments.
5. **Calm ≠ pressure** (the one semantic change the consolidation flagged
   to the owner): absence of a safe-haven bid is not a force pushing price
   down — a calm stress lane reads neutral, not against. Reversible in
   one line if the owner ever directs it.
6. **The taxonomy denominator is 86** (v1.2, the N-1 amendment) — the
   audit's arithmetic (8/85 → measured coverage) restated downstream on
   it.
7. **Licence posture (the round-3 directive, 2026-11-07):** the owner's
   blanket "make everything public" was executed as DISPLAY-CLASS flips
   only (Cleveland, Yahoo, SGE classes) — the meter's meaning untouched.
   The SHOULD-be-private reference (the future hide-or-permission levers)
   lives in `docs/insights/LICENCES.md`. **Never commit API tokens or
   credentials to this repository** — the repo carries a historical
   token-leak incident (R10-6) and the standing rule is env-only secrets.

---

## 17. Appendix A — worked example

A minimal synthetic snapshot (3 seats of the borrowing-costs lane + the
dollar lane), showing the arithmetic end-to-end. (Real shape: all 37
seats, all 5 lanes.)

```
readings (excerpt):
  real-yield-10y : value 2.31, change30d +0.14, percentile10y 0.93, status normal
  us10y          : value 4.52, change30d +0.05, percentile10y 0.71, status normal
  fed-target     : value 4.50, change30d  0.00, percentile10y 0.88, status normal
  dollar-basket  : value 101.2, change30d −1.4, percentile10y 0.35, status normal
  vix            : value 14.1, change30d −0.3, percentile10y 0.15, status stale

evalLeg per seat (thresholds: real-yield-10y 0.10 · us10y 0.15 ·
fed-target 0.25 · dollar-basket 1.0 · vix —):
  real-yield-10y : +0.14 > +0.10 → direction 'rising' → lean +1
  us10y          : |+0.05| < 0.15 → 'steady'; pct 0.71 typical → lean 0 → steady
  fed-target     : 0.00 → 'steady'; pct 0.88 > 0.8 → level 'high' → lean +1
                   (the level fallback: a steady series at a decade extreme still leans)
  dollar-basket  : −1.4 < −1.0 → 'falling' → lean −1
  vix            : status 'stale' → UNREADABLE (never fires)

goldBalance (lane by lane, polarity −1 for all these seats):
  borrowing-costs:
    real-yield-10y : lean +1 × polarity −1 = −1 → pressures, evidence 'rising'
    us10y          : lean 0 → steady
    fed-target     : lean +1 × −1 = −1 → pressures, evidence 'high'
    → supports 0, pressures 2, firing 2 ≥ MIN2, pressures majority → side 'against'
  dollar:
    dollar-basket  : lean −1 × −1 = +1 → supports, evidence 'falling'
    (…the lane's other six seats, say one more supports, one steady, four unread
     in this toy example) → firing 2 ≥ MIN2, supports majority → side 'for'

rollup (with the other three lanes reading neutral/neutral/unread in this
toy): counts { for:1, against:1, neutral:2, unread:1 }
net = 0 → verdict 'balanced' → beam 0° (level) → Outlook step: L===A with
L>0 → 'mixed' (unless the range evidence at step 4 reads first).
```

The frozen engine over the same readings: 3 firing voters
(2 tailwind-class if the polarities were +, here: pressures class),
netScore per its own global count, label by §9.1's share rule — with 3
firing, a 3-0 split would read `strong-*` (≥3 firing AND share ≥ 0.5); a
2-1 split reads plain `tailwind`/`headwind`.

## 18. Appendix B — wire/data contracts

- **The snapshot** (`InsightsSnapshotSchema`): `generatedAt`,
  `pricesAsOf?` (serve-time), `summary{global,australia}` (the question
  gauges' lines — unrelated to gold), `readings[]` (exactly one per known
  id), `changedThisWeek[]`, `calendar[]`, `ruleVersion?`,
  `displayMode?: 'public'` (the licence-legal projection). The
  `goldSummary?` field is RETIRED (OI-3/GB-S7); old snapshots carrying it
  parse clean.
- **`GoldSummarySchema`** (kept as the frozen engine's output contract):
  `netScore`, `label`, `firingVoters`, `tailwindVoters`, `headwindVoters`,
  `laneCounts{tailwind,headwind,mixed}`, `subGauges[]`
  (`lane/reading/tailwindVoters/headwindVoters`),
  `modelVsReality{chip,modelDirection,realityDirection,realityBasis,realityValue}`.
- **KV**: `insights:snapshot` · `insights:hist:<id>` · `insights:status`
  (namespace RATES; no TTLs).
- **API**: `GET /api/insights` (the snapshot whole; the live-prices
  overlay spread preserves unknown fields); `GET /api/insights/:id/history`
  (the 10-year series the trend charts ride).

## 19. Appendix C — i18n copy surface (EN + fa)

All gold copy lives in `apps/web/src/i18n/insights-copy-{en,fa}.ts`,
behind the Persian-copy audit gate (`pnpm copy:audit`; the manifest
`docs/localization/persian-copy-manifest.json`):

- `signals.goldScore.laneNames` (5), `voterNames` (the seated voters),
  `evidenceWords` (rising/falling/high in its decade/low in its decade),
  `tiltWords` (building/fading/steady — fed by `breakevenTiltLean`).
- `signals.balance.*` — the verdict words, the counts parts, the lane
  chip/tally/split copy, the empty-side sentences (R9-08), the context
  line, the measured note.
- `signals.verdictStates[state][metal]` — the seven Outlook states' exact
  bilingual sentences; `signals.metals`, `mergedTitle`, `footingTitle`.
- `signals.goldHighYieldsWarning` — the C12 banner sentence.

The retired panels' copy keys (goldScore panel labels,
goldModelVsReality) retired with the panels (OI-3/GB-S7).

## 20. Appendix D — document & evidence index

Primary (read these first): this document ·
`docs/specs/gold-balance-consolidation/01..05` ·
`docs/specs/gold-meter-gapfill/{README,01-FILL-SPEC,PROGRESS}.md` ·
`docs/insights/GOLD_SCORE_SPEC.md` ·
`docs/insights/BACKTEST-GOLD{,-LANES}.md` + `GOLD_BACKTEST_SPEC.md` ·
`docs/insights/GOLD-METER-AUDIT-REPORT.md`.

Evidence (every number's runnable record):
`docs/specs/gold-meter-gapfill/evidence/gf-p0-calibration-2026-11-05.md`
(the threshold derivations + every scenario's measured tables) ·
`gf-p{1..5}-*-2026-11-0{5,6,7}.md` (the per-phase verify/acceptance
walks) · `gf-s13-flip-2026-11-07.md` (the display-class flips) ·
`wgc-authorisation-draft-2026-11-07.md` (the owner's lever) · the
corpora under `packages/insights/fixtures/`.

Change history: `CHANGELOG.md` (the repo-wide log) · the round reports
under `docs/insights/` (R9/R10) · the Persian copy rounds
(`docs/localization/persian-copy-round-{53,55,56,76..81}-gold-*.md` — the
gold card's bilingual copy trail).

---

*Maintained as the consolidated reference. When the system changes under
a new owner-gated program, update §5 (the table + lineage), §14 (the
constants), and add the program's record to §12 — and re-verify every
number against the code before writing it down (D-GF-5).*
