# Gold Page Redesign — Session 4: Visualization Mapping

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Session:** 4 of 9 — the metric→visual map for every indicator and module (`CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` §10, Session 4, tasks 5/9)
**Mode:** Design specification. No production implementation this session.
**Companion:** `11-visual-design-principles.md` (the art direction, the color/status semantics, the Composition Stack, the metric anatomy, the LABEL contract — all rules referenced here as §11-x live there) · `visual-references/` (the sketch sheet renders every primitive in this document)
**Method (master plan §6.2's own instruction):** "choose the visual form based on the real data type and the question a visitor needs answered." Each of the 68 canonical rows (08 §2.2's registry — the authority; never re-derived here) was mapped by reading its 09 record's `unit` · `dataType` · `cadence` · `referencePeriod` · `firingRule` · `visualReading` fields, then selecting from the closed vocabulary in §1. No generic gauge exists in the vocabulary; assignment is by data type and question, not by convenience.

---

## 1. The visual-form vocabulary — ten primitives

The closed set every /gold surface may draw from. Each primitive has a **full** (card), **compact** (inline), and **word** (aria/copy) fidelity, per the ladder rule (§11.5.2). All obey the LABEL contract (§11.8), the two-channel color rule (§11.4.3), the both-themes rule (tokens only), and the axis-direction rules (magnitude and time axes LTR in both locales; stacking order mirrors in RTL).

### 1.1 `RangeBand` — position in its own history *(the 10-year-range family)*

**Answers:** "Where does today's reading sit in its decade?" **For data types:** level · index · ratio · percent · percent-change (on its own basis). **Geometry:** horizontal track (10y min→max, end labels, `type-caption`); the 20th–80th percentile zone as a soft fill (`--color-border`-family); the current marker (16px dot, shipped style) + value; an optional 30-day trail (thin line) where the seat fires on a 30-day move. **Marker hue = impact state through polarity — never the position.** The band word (`bandWord` vocabulary) rides as the secondary label. **Word fidelity:** the record's `visualReading` sentence. **Reference-period disclosure:** technical tier mandatory, expanded tier simplified (§11.6.1). **Compact:** a 120×10 band with dot, no end labels (tooltip carries them). **Mobile:** full-width, unchanged geometry. **Specializations:** `RangeBandYoY` (the `m2-us`/CPI family — the band is over the YoY series, disclosed); `RangeBandStepped` (`fed-target`/`ecb-dfr` — plateau rendering where the level sits between steps, the record's own "stepped series" note).

### 1.2 `SignedDivergingBar` — signed position around a named zero

**Answers:** "Which side of zero (or the average), and by how much?" **For:** zero-anchored indexes and net-positioning measures. **Geometry:** a track with a centre zero tick; the fill grows from the centre toward the reading; domain end labels (−100…+100 or the series' decade range); the value as `type-number` in a `bdi`. **Zero is a labeled rule, not an implication.** **Compact:** a 60×8 bar with tick. **Mobile:** full-width. **The two named instances:** CFTC net (−100..+100, §4.6) and the zero-average stress indexes (STLFSI/NFCI — the track spans the decade range, the zero line labeled "average").

### 1.3 `ShareBar` — a share of a whole, 0–100

**Answers:** "How much of the whole?" **For:** gross-long share of OI; percent-of-GDP style readings when the whole is the point. **Geometry:** a track from 0 to 100 with the fill from the origin; the complement stays track-colored (the unfilled part is *not* "against" — this bar carries no impact hue on the complement; impact rides the state word). **Distinct from `SignedDivergingBar` by construction: no zero-centre, no negative side — and the two never appear without their labels** (the CFTC pair's definitional clarity requirement, master plan §6.2 "make long/short/net/gross definitions unambiguous").

### 1.4 `StackedComposition` — an identity, decomposed

**Answers:** "What is this total made of?" **For:** additive identities only (the yield decomposition nominal = real + breakeven; the bridge parity ounce × USD → toman). **Geometry:** one horizontal bar (or a compact stacked strip) with the components as labeled segments; component names at point of use; the total at the end; segments use neutral analytical inks (the components are not supports/pressures — the *decomposition* is the story; the 30-day "which piece moved" line carries the direction). **Totals reconcile by construction** (same-asOf rule printed — the shipped discipline). **Banned for:** non-additive sets (the five lanes are NOT a StackedComposition — they are five separate LaneBars, because lanes vote independently and a single stacked bar would imply they sum to one thing).

### 1.5 `HouseTimeSeries` — the chart grammar

**Answers:** "What did it do over this named window?" **For:** price history, demand series, premium history, indexed comparisons. **Geometry:** the shipped house grammar verbatim (stretched SVG + HTML text, LTR root, hover/keyboard inspector, named series and windows, honest spans). **Colors:** gold series `--color-accent-gold-strong` (to be defined, §11.2.2); comparison series `--color-text-secondary`; gridlines dashed; zero axis a labeled rule where signed. **Sub-forms:** `DualAxisPair` (the correlation companion: gold left, comparison right, axes labeled at both ends — kept as shipped); `IndexedLines` (cross-asset comparisons re-based to 100 at a named date — the only legal way unlike units share a chart, master plan §6.2).

### 1.6 `CorrelationStrip` — rolling correlation over time

**Answers:** "How has the co-movement itself moved?" **Geometry:** an r-line over −1 / 0 / +1 gridlines (labeled), the rolling window named verbatim ("52-week"), regime markers dated (the 2022 rotation). **The anti-causation guard:** the strip is always paired with the standing line "correlation is one factor, not a forecast formula" (the shipped wording) and never with causal verbs. **Compact:** a sparkline of the r-series with end value.

### 1.7 `FlowColumn` — a flow per period, distinct from stock

**Answers:** "How much moved *this period*?" **For:** monthly flow series (SGE withdrawals, Swiss flows). **Geometry:** the current period as a column against its decade range (a vertical RangeBand: min–max rails, the 20–80 zone, the current column); a trailing 12-month column strip beside it (context, `type-caption`); period labels ("this month", the month name). **The flows-vs-stocks rule (§4.4):** a flow column NEVER renders where a stock/level is the data, and vice versa; the two never share a track. Stock companions (London vault) render `LevelSpark` (1.8).

### 1.8 `LevelSpark` — a stock level with its history

**Answers:** "How much is held/existing, and its recent path?" **For:** stock-at-a-point series (vault inventories, would-be ETF holdings, custody). **Geometry:** the shipped sparkline (normalized polyline, honesty padding, end dot) + the level as `type-number` + its decade band word. **Never tinted by direction** (the shared `Sparkline`'s neutral tone rule); direction belongs to the signed delta beside it.

### 1.9 `ProbabilityRow` — a market-implied event probability

**Answers:** "What do prediction-market traders price for this event?" **For:** Polymarket event rows. **Geometry:** a 0–100 track with the fill to the probability, the percentage as `type-number`, the event + date + venue named, the as-of chip. **The double-guard (locked):** labeled "market-implied expectation, not an outcome" (the shipped disclaimer family) AND never a gold-move probability (§8.4). **Never a dial.** **Compact:** "72% (Polymarket, Dec 18)" as a chip.

### 1.10 `PriceMap` — levels around the current price

**Answers:** "Where is the price relative to its reference levels?" **For:** technical reference levels (SMA family, pivots). **Geometry:** a vertical price axis (LTR-irrelevant; vertical) with horizontal level rules — SMA 20/50/100/200 as labeled rules (the 200 heaviest), daily/weekly pivots as dashed rules, the current price as the marker with distance labels ("+2.1% above 200-day"); crossings dated inline. **Levels are descriptive references** — the "reference, not prediction" sentence rides the block (locked). **Mobile:** the map stays (it is already narrow); the table rides the technical disclosure. **This replaces the wall-of-tables default** (master plan §4.3 Section 7's own direction).

### Plus two composite patterns (built from the primitives + the §11 grammar)

- **`LaneBar`** (§11.5.3) — the lane summary pill (not a metric primitive; the composition grammar's unit).
- **`CompositionStack`** (§11.5.1) — balance + lanes + ledger (the conditions block).
- **`BriefingCard`** (§11.10) — the outlook container.
- **`EpisodeCard`** — period + narrative + `HouseTimeSeries` path (drop-gated half renders the honest waiting state) + family-reading chips.
- **`RatioCard`** — the comparison card: the ratio's `RangeBand` + "what it compares" sentence (the 09 context records' `whatItMeasures`) + optional `IndexedLines` pair in the expanded tier.

---

## 2. The mapping — 37 voters by lane

Marker = the default-tier mark; expanded tier adds the record's whyGold/rises/falls/analogy/relationships; technical tier adds the disclosure (all rows, uniformly — §11.7). "Band" = `RangeBand` (with its specializations noted); impact hues per §11.4 through the row's polarity (08 §2.2).

### 2.A Borrowing costs (7 seats, polarity −1 — tight = headwind)

| # | id | Data type (09) | Default mark | Rationale / notes |
|---|---|---|---|---|
| 3.1 | `real-yield-10y` | level (pp), 30d-move or band | **Band + trail** | The textbook driver gets the canonical band; the trail shows the firing move. Expanded links the decomposition (R-03) + correlation (R-01). The `visualReading`'s "top edge ≠ bad" teaching is the word fidelity. |
| 3.2 | `us10y` | level (pp), 30d or band | **Band**, decomposition-linked | The record's own nuance (which leg moved) is carried by the R-03 link — the card links the `StackedComposition`, never re-renders it (canonical placement). |
| 3.3 | `us30y` | level, **level-only** | **Band**, no trail | Level-only: no 30-day trail renders (the honest absence of a move rule is visible — trail omitted, not blank-filled). |
| 3.4 | `fed-target` | level (pp), stepped | **BandStepped** | Plateau rendering; the step threshold is the technical tier's firing rule. |
| 3.5 | `fed-expectations` | level (pp), derived | **Band + trail** | Unread state carries the why-line (the record's upstream-stopped case); never guesses. |
| 3.6 | `ecb-dfr` | level, level-only | **BandStepped** | Same plateau form as 3.4 — the family reads consistently. |
| 3.7 | `real-yield-5y` | level (pp), 30d or band | **Band + trail** | 3.1's twin: identical form, the record's "faster pulse" note rides the expanded tier. |

### 2.B The US dollar (7 seats, polarity −1)

| # | id | Data type | Default mark | Rationale / notes |
|---|---|---|---|---|
| 3.8 | `dollar-basket` | index | **Band** | The headline dollar: the band + the basket composition in the technical tier (six currencies, EUR/JPY/GBP/CAD/SEK/CHF — no AUD, the AGENTS.md §C recipe). |
| 3.9 | `usdjpy` | level (yen/$) | **Band + trail** | The analogy record (credit-card) lives in words in the expanded tier (§11.9.3). |
| 3.10 | `us-japan-10y-gap` | level (pp), level-only | **Band** | The gap renders around its own decade range; the R-12 chain link explains why a gap (not a level) matters. |
| 3.11 | `usd-reserve-share` | level (% reserves), quarterly | **Band** (sparse-tick) | Quarterly cadence renders fewer trail points; the custody-hub caveat (R-13) rides expanded. |
| 3.12 | `nyfed-custody` | level (mn USD), weekly | **Band** | Cross-page home noted (the /global TIC card is canonical there; /gold links, never duplicates — F-12). |
| 3.13 | `dollar-broad` | index | **Band** | Trade-weighted: distinct from 3.8 only by label + source; the pair teaches "two dollar lenses" in expanded. |
| 3.14 | `dollar-eme` | index | **Band** | Same form; the EM lens note (R-02's breaks hit EM hardest) in expanded. |

### 2.C Market stress & uncertainty (11 seats, mixed polarity — the two inverted seats marked)

| # | id | Data type | Default mark | Rationale / notes |
|---|---|---|---|---|
| 3.15 | `stress-stlfsi` | index, **zero = average** | **SignedDivergingBar + decade range** | The zero-average semantic demands the diverging form: the reading *is* the distance from average. Zero line labeled "average of its history". |
| 3.16 | `nfci` | index, zero = average | **SignedDivergingBar** | 3.15's twin; the pair never stacks visually (one is enough per view; the ledger lists both). |
| 3.17 | `vix` | index (own scale) | **Band** | VIX has no zero-average semantics (its own points scale) — the band, not the diverging bar; the fire-insurance analogy in expanded. |
| 3.18 | `gold-silver` | ratio | **Band** (ratio scale) | The engine's own framing: a high ratio IS the stress read. The bunker-vs-pickup analogy in expanded. Polarity +1: high = supports ink. |
| 3.19 | `term-premium-10y` | index (model estimate) | **Band + "model estimate" tag** | The estimate label rides the mark (§11.6.5); the R-04 exception (liquidity-phase) in expanded. |
| 3.20 | `ebp` | index, monthly | **Band** | Monthly cadence; the fear-compensation channel (R-04/R-05) links. |
| 3.21 | `michigan-sentiment` | index, **inverted** | **Band (inverted axis annotation)** | LOW mood = gold-positive: the band renders normally, the impact ink flips (low percentile → supports ink). The inverted-polarity annotation (08's own mark) renders in the technical tier — the visible card just shows impact honestly. |
| 3.22 | `gpr-daily` | index, ~6d lag | **Band** | The lag is the AsOfChip's delayed state; the bid-then-fade pattern (R-07) in expanded. |
| 3.23 | `epu-us` | index, monthly | **Band** | Family form with 3.22; the domestic-rules flavor note in expanded. |
| 3.24 | `sp500-breadth-ratio` | percent, **inverted** | **Band (inverted annotation)** | Falling breadth = gold-positive (the parade analogy in expanded); same inverted-ink treatment as 3.21. |
| 3.25 | `bank-stress` | level (pp), 30d or band | **Band + trail** | The discount-window price: the plumbing-stress member of the stress family. |

### 2.D Inflation & inflation expectations (10 seats, polarity +1)

| # | id | Data type | Default mark | Rationale / notes |
|---|---|---|---|---|
| 3.26 | `us-cpi-yoy` | percent-change (YoY) | **RangeBandYoY** | The band is over the YoY series, disclosed; the since-previous-release firing rule in technical. The adjacent-months method label (the shipped CPI treatment) rides technical. |
| 3.27 | `us-pce-core-yoy` | percent-change | **RangeBandYoY** | The Fed's gauge: same form, the "core" distinction taught in expanded (never treated as a duplicate of 3.26 — the 08 §5.4 multiple-views rule). |
| 3.28 | `euro-hicp` | percent-change | **RangeBandYoY** | The global-inflation member (pairs with 3.6's global-policy member). |
| 3.29 | `breakeven-5y5y` | level (percent) | **Band** | The weather-vs-climate analogy (the record's own) in expanded. |
| 3.30 | `breakeven-tilt` | level (pp), level-only by design | **Band (delta annotation)** | The tilt (5y5y minus 5y — the building-tilt reading): the band renders the tilt series; the construction prints in technical. |
| 3.31 | `t5yie` | level (percent) | **Band** | The 5-year market breakeven; R-25's household-vs-market divergence note links. |
| 3.32 | `michigan-1y-expectations` | level (percent), monthly | **Band** | The household lens; the unread why-line case (the record's) renders honestly. |
| 3.33 | `m2-us` | level read as **YoY percentile** | **RangeBandYoY (disclosed basis)** | The basis exception (08 §3.2): the YoY-basis disclosure is mandatory at expanded+technical; the tickets analogy in expanded. |
| 3.34 | `us-deficit-12m` | level (% GDP) | **Band** | The fiscal-debasement channel (R-10's disputed flag links). |
| 3.35 | `michigan-5y-expectations` | level (percent), level-only | **Band** | The slow anchor under the fast one (R-25); the I3-precedent note in technical. |

### 2.E Trader positioning & flows (2 seats, polarity −1 — crowded = fragile)

| # | id | Data type | Default mark | Rationale / notes |
|---|---|---|---|---|
| 3.36 | `cftc-gold-positioning` | level (% of OI), −100..+100 | **SignedDivergingBar** (net track) | The §4.6 difficult case: centre-zero, fill from centre, unclamped by design (anomalies render past the end — the shipped honesty rule). The fuel-gauge analogy in expanded. |
| 3.37 | `cftc-gold-gross-long` | level (% of OI), 0..100 | **ShareBar** | The two-track discipline: net vs gross never share a geometry without labels (§1.3). |

---

## 3. The mapping — 11 context readings, 4 blocked, 16 modules

### 3.1 The context readings (non-voters: value + position + freshness; no impact hue — the `context` state)

| # | id | Data type | Default mark | Rationale / notes |
|---|---|---|---|---|
| 4.1 | `gold-usd` | level (USD/oz), live | **`HouseTimeSeries`** (hero price block) + the price's own **Band** (decade position, secondary) | The price is the answer: `type-number` prominence, signed window change with the visible window tag, the sparkline/pan-zoom chart per the shipped grammar. The hero's *only* price rendering (F-06's dedup: narrative references anchor here). |
| 4.2 | `gold-btc` | ratio (BTC/oz) | **RatioCard** (band + compare sentence) | The referendum framing (R-19) in expanded. |
| 4.3 | `gold-aud` | level (AUD/oz) | **RatioCard** + `IndexedLines` (expanded) | The numeraire lesson (R-16) is this card's story; the /australia mirror links. |
| 4.4 | `gold-oil-ratio` | ratio (bbl/oz) | **RatioCard** | The common-tide cancellation story (R-20). |
| 4.5 | `gold-platinum` | ratio | **RatioCard** | The industrial-vs-monetary pair (R-20). |
| 4.6 | `real-gold-price` | level (1982–84 USD) | **Band + long-history line (expanded)** | The decades-scale purchasing-power record; the full CPI history prints in technical (the record's own note). |
| 4.7 | `copper-gold` | ratio, monthly | **RatioCard** | The growth-vs-defense mood (R-21). |
| 4.8 | `gold-equities-ratio` | ratio | **RatioCard** + `IndexedLines` (expanded) | The rotation waves (R-23's sign-switch flag). |
| 4.9 | `sge-gold-withdrawals` | **flow** (tonnes/month) | **FlowColumn** | The §4.4 difficult case: flow form, never a level line. |
| 4.10 | `swiss-gold-flow` | **flow** (tonnes/month) | **FlowColumn** | The hub's monthly import column; the proxy caveat rides the mark. |
| 4.11 | `shanghai-gold-premium` | level (percent) | **Band** | The arbitrage-gap read (R-27); the §16 never-a-voter note in technical. |

### 3.2 The blocked quartet (never data-shaped marks — §11.4.1's fifth state)

| # | id | Render | Rationale |
|---|---|---|---|
| 5.1 | `wgc-etf-holdings` | **BlockedNote** (recessed, lock glyph, reason word, owner lever) in the publication-notes disclosure; the would-show story (09 §5.1) is the note's expanded text | Licence (WGC L3). Would-be form if ever unblocked: `LevelSpark` (holdings stock + monthly flow column pair). |
| 5.2 | `wgc-cb-demand` | **BlockedNote** + the live pointer to the IMF tracker module (the licence-clean companion) | Licence. Would-be: `HouseTimeSeries` quarterly demand. The R-09 record still explains the mechanism conceptually. |
| 5.3 | `official-gold-demand` | **BlockedNote** with the revival lever named | Source dead (PBoC 404). Would-be: monthly step column (the lumpy-report caveat taught in 09). |
| 5.4 | `etf-short-interest` | **BlockedNote** | No licence-clean venue. Would-be: `ShareBar` (short share) — the mirror of the CFTC pair. |

### 3.3 The 16 modules (surfaces, not series — the module record's `whatItShows` is the content contract)

| # | Module | Visual form | Specification notes |
|---|---|---|---|
| 1 | `GoldNarrative` | **Text-first card** + per-family `LaneBar` compact renderers | The five family lines become LaneBar rows (word+fidelity down from the stack); the price-fact sentence anchors to 4.1's chart, never re-renders it. |
| 2 | `GoldYieldDecomposition` | **`StackedComposition`** + the 30-day "which piece moved" sentence + three-configuration legend | The identity prints verbatim (same-asOf); the premium leg wears the model-estimate tag; the gilt exception in expanded. Difficult case §4.2. |
| 3 | `GoldOnRamp` | Education accordion: mechanism → honest limits → **`LaneBar`** close per driver | The lane closes reuse the LaneBar (one renderer, all surfaces). Collapsed default (shipped). |
| 4 | `GoldExpectations` | **`ProbabilityRow`** set + the calendar strip (compact event timeline: dated rows, tz named) | Event-probability framing locked; the mismatch note + disclaimer as shipped. |
| 5 | `GoldIranBridge` | Regional board: coin rows (price + premium chips) + **`StackedComposition`** parity (collapsed method) | Fully separated visual treatment: the regional chapter card carries its own chrome (the "clearly regional" rule) — a distinct border accent from the global sections, labeled Toman/IRR. |
| 6 | `GoldPremiumHistory` | **`HouseTimeSeries`** (two-coin premium %, melt 0-line, backfill/live boundary marker) + decile chips | The honesty line on the chart itself (the boundary marker) is kept verbatim; the attribution strip stays the exact-identity text block it is. |
| 7 | `Signals` (merged card) | **Demoted per DUP-2/Q3:** the gold chip keeps `HouseTimeSeries` + its lean line; the **second BalanceScale retires**; silver's presentation waits on Q3 | This session's spec: whatever survives, no second instrument (§11.5 rules bind all surfaces). |
| 8 | `GoldTimeMachine` | Date control + verdict word + counts + five `LaneBar` compact rows + provenance line | The historical reading renders in the same lane grammar (one system across time); era-bounded rejection messages as shipped. |
| 9 | `GoldTaLevels` | **`PriceMap`** (the §4.7 difficult case) + the 200-DMA distance sentence + tables into the technical disclosure | The takeaway sentence survives as the default reading; the map replaces the wall-of-tables default. |
| 10 | `GoldCbDemand` | **`HouseTimeSeries`** (rolling-12m line + signed area to the zero axis, dated episode annotations) + buyers table (stacked rows < sm) | The shipped form is already the spec's exemplar — kept, with the table's mobile stacked form as the standard. |
| 11 | `GoldLondonVault` | **`LevelSpark`** pair (gold/silver stock) + clearing sentence rows | Stock form (never flow); the koz→tonnes disclosure in technical; collapsed default kept. |
| 12 | `GoldCorrelation` | **`DualAxisPair`** + **`CorrelationStrip`** | The §4.3 difficult case; pre-registered windows + the sampling-day caveat print verbatim. |
| 13 | `GoldForecastRetrospective` | Honest-record table (17 rows) under the honest-record footer | The "even the consensus misses" framing; the pending-row convention; no visualization of misses beyond the table (a chart would dramatize what is an honesty record, not a signal). |
| 14 | `GoldEpisodes` | **`EpisodeCard`** list (editorial default; the `HouseTimeSeries` price path renders its honest waiting state until the WGC drop) | History ≠ current: the episode band carries its "historical" label as a standing element; the comparison table rides the record. |
| 15 | `GoldIfBought` | Calculator card (year picker, asset chips) + outcome **`HouseTimeSeries`**/table + decile chips | Assumptions visible; the same-length-window decile basis named; "historical results are not future returns" stays on the card. |
| 16 | `GoldPublicationNotes` | The collapsed disclosure: absent-count line + the four **BlockedNote** rows + the one sources link-out | The BD-S43 placement contract kept; the disclosure's own visual is the recessed well + lock glyph family. |

---

## 4. The difficult cases (task 9's named set — specified before implementation)

### 4.1 Historical percentile (the band family's honesty)

The trap (master plan §3.7): a percentile hides its population; a band implies a universal good/bad scale. The spec: **the population prints at the technical tier always; the simplified "past ten years" phrase at expanded; the band word at default; the marker hue is impact-through-polarity only; basis exceptions (YoY for M2/CPI-family; same-length windows for if-bought deciles) are disclosed wherever the band renders them** (RangeBandYoY carries its own disclosure slot). The word-fidelity sentence (09's `visualReading`) is the aria name — the teaching ("top of its decade ≠ bad") ships with every instance.

### 4.2 Yield decomposition (the identity)

`nominal = real + breakeven` (+ the premium identity) renders as **`StackedComposition`**: one labeled bar, components in neutral inks, total reconciled by construction, same-asOf printed. The 30-day line names *which piece moved* — the story the record teaches — with each piece linked to its own record's band (3.1/3.31/3.19). **The component segments never wear impact hues**: the decomposition is arithmetic, not votes; impact lives on the three records' own cards. The 2022 gilt exception (R-04) rides expanded. Totals that do not reconcile never render (the same-asOf guard — a mismatched-date set shows the honest "cannot decompose" state rather than a fake bar).

### 4.3 Rolling correlation (the co-movement of co-movement)

The shipped companion is already the exemplar and is kept as the canonical R-01 visualization: the `DualAxisPair` (gold vs real-yield-10y, **not inverted** — the honest presentation of the raw relationship) above the `CorrelationStrip` (r over −1/0/+1, the 52-week window named verbatim, the 2022 rotation dated). **Anti-causation guards:** no causal verbs anywhere on the surface (the 08 §6.2 verb lists bind); the "correlation is one factor, not a forecast formula" line stays; the strip never renders without its window label. **Charting rule (10 §5's contract):** no other relationship gets history until its coverage is verified — the explorer's edges respect this (§5).

### 4.4 Flows vs stocks (the category error guard)

The two data kinds never share a form: **flows** (per-period volumes: SGE withdrawals, Swiss imports, would-be CB quarterly demand) render `FlowColumn` — a *period* column against its decade range; **stocks** (point-in-time holdings: London vault, custody, would-be ETF holdings) render `LevelSpark` — a *level* + path. The verbal guard rides both families' expanded tiers ("volume is not price: flows explain where metal went, not what the price did" — R-27's own line). The CB tracker is the instructive pair: its *rolling-12m* series is a flow-aggregate line (kept as shipped); the buyers-table's *holdings* column is stock — the two are visually distinct in the table (the holdings column gets the level treatment, the 12m column the change treatment).

### 4.5 CFTC positioning (the two-track discipline)

`cftc-gold-positioning` (net, −100..+100) renders `SignedDivergingBar` — centre-zero tick, fill from centre toward the reading, **unclamped** (an anomalous reading renders past the end, the shipped rule — a clamp would lie). `cftc-gold-gross-long` (gross, 0..100) renders `ShareBar` — origin-anchored fill, complement neutral. The two cards render **adjacent, never merged**; each names its definition ("net non-commercial as % of open interest" / "gross long as % of open interest" — technical tier verbatim from the records). Impact (polarity −1, crowded = fragile): the *state word* carries it; the bars' fills use the return hues only for the signed 30-day change chips beside them (two-channel rule). **Dedup (F-05):** the Gold Positions section is the canonical presentation; the lane seats + the flows context cards anchor here; the COT band chips inside context cards retire at S6 (the master plan's own §4.2 requirement).

### 4.6 Technical reference levels (the map, not the wall)

`GoldTaLevels` defaults to the **`PriceMap`**: a vertical price ladder with the SMA family as labeled rules (20/50/100/200; the 200-day heaviest), pivots dashed, the current price marked with distance labels; the dated 50/200 crosses print inline at their level. The takeaway sentence (the 200-DMA distance read) survives as the block's first line. The full tables move into the technical disclosure (the master plan's "visual explanations rather than specialist tables as the default"). **The locked guard:** "reference levels, not predictions" rides the block (the module record's own honest state); no support/resistance language anywhere (08 §6.4's no-advice rule).

---

## 5. The relationship explorer — visual specification (10 §5's contract, prototyped)

**Scope (master plan §4.3 Section 8):** the advanced map of how gold's forces connect, secondary to the briefing, rendering only the 24 verified records. Session 6 implements; this is the visual contract.

### 5.1 The layout

- **Desktop:** a **radial hub graph** — gold at center (the accent-gold node), the five lane clusters arranged around it (each cluster = the lane's node + its member indicators), the market-structure/comparison nodes (BTC, commodities, equities, physical flows, ETF-blocked) on the outer ring. Edges connect per the records (lane↔gold, indicator↔indicator, break-pattern records as edges between clusters). Pan/zoom canvas (the world map's shipped interaction grammar), plus a **list-first fallback panel** (filter by class/lane; every record findable without the canvas — the accessibility guarantee).
- **Mobile:** **list-first** (the canvas is secondary, behind a toggle — a pan/zoom graph at 390 px is legal but never the only path; the master plan's §7.1 progressive-disclosure rule). Each list row: the two concepts, the class chip, the one-liner; tapping opens the record (the popover pattern with the full one-liner + evidence basis + regime flags + the linked indicator records).

### 5.2 The edge grammar (class always visible — shape + dash + label, never hue alone)

| Class | Edge stroke | Label token | The rule |
|---|---|---|---|
| **M** mechanism | solid, 2px | "M · mechanism" chip | The mechanism one-liner on tap; copy discipline: "the channel works through…" |
| **C** correlation | **dashed** (4-3), 2px | "C · correlation" chip | "have tended to move together/opposite" wording only |
| **X** conditional | solid with the **flag token** (a small "conditions apply" pennant at the edge's midpoint, amber ink) | "X · conditional" chip | The break episodes named in the record; the pennant is *never fine print* (10 §5's own rule) |
| **K** causal-with-evidence | solid, 3.5px (heaviest) + the **evidence tag** (a small document glyph) | "K · documented" chip | Names its evidence inline (today only R-09's post-2022 shift carries K) |

- **X-flags may attach to M/C/K records** (the taxonomy allows it): the pennant renders on those edges too.
- **Blocked edges (R-26 ETF flows):** render **in the legend only** — a muted row "ETF flows ↔ gold — explained conceptually; no data under licence" — never as a canvas edge (a blocked edge drawn as an edge would imply charted evidence).
- **Blocked-class records in §4's matrix** (the PBoC/BTC regression rows) do not appear at all; the excluded-claims list lives in the legend's honesty footer.

### 5.3 The honesty footer (the standing anchor)

The explorer carries the meter's own measured record verbatim — no directional edge in the 37-voter table; sign-agreements 46.8/42.2/32.7% at 5/20/60 trading days (10 §2's standing rule 5) — so no visitor mistakes the map of conventional thinking for a proven system. It renders at the explorer's foot (both locales) and in the list view's header slot.

### 5.4 The word fidelity

Every edge's accessible name: "«A» to «B»: «class word». «the one-liner». «exceptions if X»." The canvas is `role="application"` with the list as the SR path; the class chips are real text (never icon-only). The sketch: `visual-references/` panel 10.

---

## 6. The outlook/scenario presentation — the prototype spec (Q1/Q2-gated content, §11.10's container)

The **container** (`BriefingCard`) is §11.10. The **scenario extension** (activates only if Q2 approves a horizon method):

- **The scenario row:** three text-first cards — an upside path, a downside path, and a sideways path — each: its *conditional* framing ("if X, then historically…"), its trigger conditions (the record-linked evidence), and its non-promise guard. **No probabilities, no target prices, no path charts with price axes** (the §8.4 locks; a drawn price path would manufacture exactly the false precision the owner banned). The visual difference between scenarios is *typographic and structural* (position + label), never *dramatic* (no rocket icons, no red/green scenario skins — scenario direction words carry the reading).
- **The horizon chip:** renders beside the headline only where a validated horizon publishes ("over the next 1–3 months" / «در ۱ تا ۳ ماه پیش رو» — 08 §8.3's drafts); today none renders (F-02: no method exists).
- **The five-state conditions word** (08 §8.1's drafts) is the *summary spine* candidate, replacing the 7-state presentation **only on Q1's approval**; the honest caveat line ships beside whichever wording the owner picks (the mapping note's own requirement).

The sketch sheet renders the container with placeholder-gated slots marked "Q1"/"Q2" so the owner can see exactly what is and is not decided.

---

## 7. Mobile variant summary (the pre-implementation record)

| Pattern | Mobile (< lg, 390 px) form |
|---|---|
| CompositionStack | BeamGlyph + five full-width LaneBars within the first 1.5 viewports; the brass stage on tap (advanced affordance) |
| BriefingCard | Full-width; headline → summary → reasons (stacked) → caveat → footer; no scenario row until Q2 |
| Closed card | One column; the mark full-width under the label row; opener = the whole card (bottom sheet) |
| Popover/Sheet | Bottom sheet (88dvh cap), the shipped panel contract |
| RangeBand / SignedDivergingBar / ShareBar | Full-width, same geometry (width-adaptive by construction) |
| FlowColumn / LevelSpark | Unchanged (already compact) |
| HouseTimeSeries | Fewer ticks, same grammar; pan/zoom touch as shipped |
| PriceMap | Unchanged (narrow-native); tables in the disclosure |
| Explorer | List-first; canvas behind a toggle |
| ProbabilityRow | Full-width rows; the calendar strip horizontal-scrolls (the shipped chip-scroller pattern) |
| BlockedNote | The disclosure's stacked rows (unchanged) |

---

## 8. Conflicts flagged (the assignment's instruction: flag, never rewrite S1/S3)

1. **S1 F-08's "four lane rows with mini-rings"** — not present in the shipped hero code (the actual lane visuals: `.bal-lanes-bar`, weights' rims, TM chips). The finding's substance (competing hero signals) stands; the phrasing is retired (recorded S4-D12).
2. **09's `visualReading` fields reference current surfaces** (e.g. 3.1 names the seat chip, decomposition, correlation companion) — correctly, per 08 §3.3's authoring rule. Where this mapping *changes* the surface (e.g. the default card's band replaces the word-only seat presentation), the record's visual-reading text remains the *word fidelity* and needs only surface-name reconciliation at S5 integration (a wording pass, not a content change — flagged for the manifest round).
3. **The 08 §8 five-state drafts vs the shipped 7-state line** — no conflict (drafts are explicitly owner-review), but the *container* spec (§6) depends on Q1's resolution; both renderings are sketched.
4. **Master plan §6.2's "five visual lanes feeding/explaining one aggregate balance"** vs the shipped **four-lane** rendering inside the merged Signals card's balance (the flows lane renders in seats/TM but the merged card's driver set excludes it) — this mapping specifies **all five lanes** in the CompositionStack (the engine's truth); the four-lane rendering is a Signals-card artifact that retires or reconciles when Q3 resolves that surface's fate.

---

## 9. Acceptance walk (this deliverable's own criteria)

- **Every one of the 68 rows has a named visual form** — §2 (37 voters), §3.1 (11 context), §3.2 (4 blocked → BlockedNote, the honest non-form), §3.3 (16 modules). ✅
- **Assignment is by data type + question** (master plan §6.2's table applied row-by-row; the specializations — YoY basis, stepped levels, inverted polarity annotations, model-estimate tags — follow the 09 records' own fields). ✅
- **No generic gauge** — the vocabulary has none; the only instrument is the composition balance (§11.9.1's metaphor rules). ✅
- **Difficult cases specified before implementation** — §4.1–§4.6, each with its honesty guard. ✅
- **The explorer contract honored** — 10 §5's six clauses render as §5.1–5.4 (classes visible, X-flags never fine print, blocked edges legend-only, charting rule respected, one-liners as full edge text, the honesty footer). ✅
- **The outlook prototype honors the locks** — no probabilities/targets/confidence numbers anywhere in the spec; Q1/Q2 gates flagged on the sketch. ✅

*The sketches for every primitive and the six difficult cases: `visual-references/core-patterns-sketch.html` (+ the PNG captures). The rules these forms obey: `11-visual-design-principles.md`.*
