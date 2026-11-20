# Gold Page Redesign — Session 1: Duplicate & Overlap Matrix

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Method.** Every row below is supported by component/data evidence (source file + line, or live-DOM attribute), not by name similarity alone (per Session 1 acceptance criteria). "Presentation" = a visual rendering a visitor can see; "input" = a model input that must be preserved even when a presentation is deduplicated (master plan §4.2: "Do not remove the underlying model input just because one visual presentation is redundant").

**Verdict scale:** CONFIRMED duplicate/overlap · BY-DESIGN reuse (acceptable, keep) · DISTINCT (looks similar, genuinely different — evidence given) · PENDING (needs Session 2 decision).

---

## DUP-1 — CFTC gold positioning: one input, four presentations — **CONFIRMED**

| Presentation | Component (file:line evidence) | What it shows |
|---|---|---|
| Flows-lane seat chips (2) | `GoldSeats.tsx` renders both ids as `[data-seat=cftc-gold-positioning]` / `[data-seat=cftc-gold-gross-long]` (lane `flows`) | voter name + lean word + evidence word |
| FLOWS & POSITIONING context cards (2) | `GoldContext.tsx` renders both ids as `[data-context-card]` + `id="gold-card-cftc-*"` with COT band chip (`data-cot-band`), crowd gauge, convention note | value + 10-y band + meaning + band chip |
| Gold Positions visual bars (2) | `GoldPositions.tsx` renders `[data-gold-position-card=cftc-gold-positioning]` (−100..100 signed track) + `[data-gold-position-card=cftc-gold-gross-long]` (0–100) with 30-day change | value + marker + fill + change |
| (subset) band chips inside context cards | `data-cot-band` chips repeat the percentile band the Positions section could carry | band word |

- **Data evidence:** all four surfaces read the same two canonical ids from the same projection (`readings` by id — `GoldPositions.tsx` reads projection readings directly; `GoldContext` entries from `goldContextCards(readings)`; `GoldSeats` lanes from `goldSeatLanes(hero.balance)`). No second data source exists.
- **User impact:** the same weekly CFTC number is explained in four visual forms on one page. The master plan names this exact case: "Deduplicate CFTC positioning and gross-long measures across the context cards and dedicated Gold Positions section."
- **Constraint:** both ids are **voters** (flows lane) — the seats and the model input must stay; only the redundant presentations can consolidate.
- **Session 2 input:** one canonical detailed presentation (Positions bars are the most explanatory) + seat chips + anchored links from the rest.

## DUP-2 — The gold-balance verdict: summary-strength renderings — **CONFIRMED (the core IA problem)**

| Presentation | Component (evidence) | Strength |
|---|---|---|
| Hero brass scale + verdict word | `GoldHero.tsx` + `GoldBalanceClassic.tsx` (`data-hero-verdict`) | full summary |
| Hero Conditions-outlook line + 4 counts + 30-day context | `GoldHero.tsx` (`data-hero-outlook-line`) | full summary |
| **Second full BalanceScale** (lane drivers, ledger, banner, footing) | `signals/MergedCard.tsx` via `Signals.tsx` (`#insights-signals`) | full summary |
| Narrative five family lines (lane lean + tally + movers) | `narrative/GoldNarrative.tsx` (`data-narrative-family`) | per-lane summary |
| Collapsed Signals summary line (lean + counts + footing band) | `Signals.tsx` (`data-signals-summary`) | full summary |
| On-ramp five driver rows' live closes (lane count + lane word) | `GoldOnRamp.tsx` (`data-onramp-driver`) | per-lane summary |

- **Data evidence:** all six derive from the **same engine outputs** — `goldBalance(readings)` / `evaluateSignal('gold', …)` / `goldOutlookOf` (GB-S5: the outlook is computed from the same balance). Live DOM: hero verdict "Leaning against gold" and the Signals BalanceScale show the identical verdict/counts (1 for · 3 against · 1 not leaning).
- **User impact:** VLM full-page review independently flagged it: "a near-identical repetition of the same balance-scale story… resets attention… driver info appears three times." Directly blocks the owner's locked hero-priority decision (one dominant element; no repeated balance verdict nearby).
- **Distinct-but-related (must NOT be merged):** the time machine's *historical* per-date readings (different data plane, clearly labelled) — distinct.
- **Session 2 input:** one canonical balance presentation (hero); everything else either anchors to it or shows strictly less.

## DUP-3 — `real-yield-10y`: four surfaces — **CONFIRMED, PARTLY BY-DESIGN**

| Surface | Component | What it adds |
|---|---|---|
| Borrowing-costs seat chip | `GoldSeats.tsx` | voter verdict |
| Yield-decomposition real leg | `GoldYieldDecomposition.tsx` (`data-yield-leg=real-yield-10y`) | decomposition + identity (additive) |
| Signals real-yield condition | `signals/verdict.tsx` / `MergedCard.tsx` condition chip | restates the seat as a condition |
| Correlation chart's right axis | `GoldCorrelation.tsx` (yield history fetch) | 52-week rolling correlation (additive) |

- **Verdict:** decomposition and correlation are **distinct, additive presentations** (BY-DESIGN). The Signals condition chip is a **third restatement** of the seat (CONFIRMED redundancy with the seat chip + the decomposition card, both of which already surface the value).
- **Session 2 input:** canonical placement rules — seat chip (verdict) + decomposition (structure) + correlation (relationship) stay; the Signals condition chip rides whatever the Signals section becomes.

## DUP-4 — `gold-usd` price: three direct renderings — **CONFIRMED, PARTLY BY-DESIGN**

| Surface | Component | Note |
|---|---|---|
| Hero live price + changes + 10-y band | `GoldHero.tsx` | the canonical price presentation |
| Signals gold chip + price-footing strip | `signals/MergedCard.tsx` / `verdict.tsx` | second price display (chip context + footing row) |
| Narrative price fact (1d/30d/90d sentence) | `GoldNarrative.tsx` | editorial, links `#insights-signals` |

- **Verdict:** the narrative sentence is editorial (distinct). The Signals footing row is the designed "never counted in balance" context — but its **price display** duplicates the hero's. Master plan §4.1: "Avoid repeating the gold price in multiple hero-like cards."
- **Session 2 input:** keep hero as the single prominent price; Signals (or its successor) references rather than re-displays the big price.

## DUP-5 — Lane/lean information inside hero scale vs lane cards vs on-ramp vs narrative — **CONFIRMED**

- **Evidence:** lane state words + counts appear in `GoldBalanceClassic` tray labels, `GoldSeats` lane headers (`data-lane-side`/`data-lane-state`), `GoldOnRamp` driver closes, and `GoldNarrative` family lines. Live: "borrowing-costs: Works against. 4 of 6 drivers firing" appears (in different words) in at least four places.
- **Verdict:** the *five-group overview* is a locked owner decision ("one combined overview… five expandable/detail groups") — the goal is ONE overview + ONE detail per group, not four parallel overviews. Today: hero scale (overview), seats (detail), narrative (per-lane recap), on-ramp (education recap).
- **Session 2 input:** narrative and on-ramp should *link* lane states, not re-render them; the five-lane overview and the five detail groups are the two canonical tiers.

## DUP-6 — Silver analysis on the gold page — **PENDING (owner decision)**

- **Evidence:** `Signals.tsx`/`MergedCard.tsx` render a full silver verdict card (own conditions incl. `china-pmi`, `copper-gold`, `silver-usd`; own trend chart via `MetalTrendChart`; own collapsed verdict). Silver is not part of the gold model (enters only via `gold-silver` seat + if-bought row).
- **Verdict:** not a duplicate of a gold presentation — an *overlap of product scope* (a silver briefing inside the gold page). The master plan's hierarchy has no silver slot; removal touches a shipped feature → owner decision (audit F-14).

## DUP-7 — TA reference tables vs Signals chart overlays — **DISTINCT (by design, s2 §5c split)**

- **Evidence:** `GoldTaLevels.tsx` renders SMA/cross/pivot tables; `GoldPriceChart.tsx` renders DMA 50/200 overlays. The split is the recorded design ("the overlay rides the F7 chart in Zone E, the tables render here; the two renderings cross-link").
- **Verdict:** BY-DESIGN — keep, but Session 4 should restate both as one coherent "price context" visual system (master plan §4.3 Section 7: prefer a price map over walls of tables).

## DUP-8 — Freshness/timestamps — **CONFIRMED (minor)**

- **Evidence:** hero prints three timestamp forms ("Live prices as of…", market pill "(UTC−5)", "Data as of…"); sections below each print their own as-of. Per-item freshness is a locked requirement — the duplication issue is *format inconsistency in the hero*, not the existence of timestamps.
- **Session 2 input:** one freshness grammar across the hero; per-section stamps stay.

## Non-duplicates verified (recorded to prevent future false positives)

- `shanghai-gold-premium` (global SGE premium, context card) vs the Iran-bridge coin premiums (Tehran domestic TGJU): **different markets, different currencies, different sources** — distinct by data contract.
- `gold-silver` ratio seat vs silver's Signals verdict: ratio-vs-metal — distinct.
- Yield-decomposition's derived breakeven vs `breakeven-5y5y`/`t5yie` seats: the decomposition is an identity teaching card over `us10y`/`real-yield-10y`; the seats are separate voters (`T5YIFR`/`T5YIE` FRED series) — distinct data, complementary presentations.
- Time-machine historical readings vs live balance: different planes, labelled provenance — distinct.
- `usd-reserve-share` seat vs Global's dedollar tile: cross-page mirror with distinct presentation — by-design engine reuse (registry mirror pattern, S24).
- London vault (stock) vs CB tracker (flows): stock vs flow distinction maintained (different KV keys, different sources) — distinct.

---

## Summary for Session 2

| ID | Subject | Status | Protected inputs that must survive any consolidation |
|---|---|---|---|
| DUP-1 | CFTC ×4 presentations | CONFIRMED → consolidate | both voter ids + seats + model input |
| DUP-2 | Balance verdict ×6 renderings | CONFIRMED → one canonical summary | `goldBalance` engine, hero, seat lanes, time machine |
| DUP-3 | real-yield-10y ×4 | PARTLY → drop the Signals restatement | seat + decomposition + correlation |
| DUP-4 | gold price ×3 | PARTLY → single prominent price | hero price; footing stays as data if Signals stays |
| DUP-5 | lane state ×4 overviews | CONFIRMED → one overview + one detail tier | the five group summaries (locked) |
| DUP-6 | silver scope | PENDING owner | — |
| DUP-7 | TA tables vs chart | BY-DESIGN → unify visually in Session 4 | both data legs |
| DUP-8 | timestamp formats | CONFIRMED minor → one grammar | per-item freshness (locked) |
