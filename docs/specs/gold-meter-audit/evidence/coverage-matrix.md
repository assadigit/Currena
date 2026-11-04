# GA-S3 evidence — the coverage matrix (A3's first half, 03 §3)

**Status: delivered 2026-11-05 by the GA-S3 session, against the LOCKED
denominator** (02-REFERENCE-TAXONOMY v1.1 = 85 rows, LOCKED 2026-11-05 —
the owner's delegated instruction; the lock record at 02's foot). This file
classifies every taxonomy row and maps every voter; the H1–H7
half-implementation defect audit lives beside it in
`evidence/half-implementation.md`.

## The header arithmetic (01 §5 — stated up front)

| Guarantee | Count | Basis |
|---|---|---|
| **rows classified** | **85 = the taxonomy** | 82 rows carry exactly one class below + **3 cross-lists resolved to their primaries** (I5→R7 · I6→R8 · X6→I10 — they carry the primary's class, no class of their own) |
| **voters mapped** | **21 = the voter table** | 20 of the 21 `GOLD_LANE_VOTERS` seats map to exactly one row each (§1); **1 is flagged `UNCLASSICATED` — a defect by definition** (`euro-hicp`: the locked checklist holds no euro-area realised-inflation row) |
| class tally | **COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 · CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3** | 8+7+36+10+18+3 = 82 own classes + 3 cross-lists = 85 |
| fill-program seeds | **yes 47** (7 PARTIAL + 36 MISSING-FREE + 4 promote-worthy CONTEXT-ONLY-BY-DESIGN) · **no 35** (8 COVERED + 10 MISSING-PAID + 14 non-promote COBD + 3 NA) | the severity ranking is GA-S4's; this column only seeds the backlog (04 §3) |
| the headline seed | **the meter fully covers 8 of the 85 classic rows as voting claims** (R1 · R5 · R7 · D1 · I1 · I2 · S1 · S5) — plus 7 half-implemented voter rows, 63 context-traced series, and 36 missing-with-free-source rows (**12 of them need ZERO new fetches** — the promotion class: R9 · I3 · I10 · S4 · S7 · S8 · S13 · G1 · X7 · F2 · D7 · I11's US legs) | the COVERED+healthy share, for 04 §1.1's report header |

**Citation rules (01 §4.3).** Every `Class` satisfies 01 §6's
necessary-and-sufficient conditions. Every footprint cites the wiring pack:
`w§1:<n>` = wiring.md §1 trace row n (the 21 voters), `w§2:<id>` = wiring.md
§2's context row (never votes), `inv §2` = inventory.md's derived-recipe
table; every depth/availability number cites the committed runs — `HD` =
`evidence/history-depths-2026-11-05.txt` (the `ga-s2-history-depths.sh`
run, corpus 2026-11-03; re-run this session: identical), `WS` =
`evidence/wire-scan-2026-11-05.txt` (the `ga-s2-wire-scan.sh` run; re-run
this session 2026-11-05 00:30 +0330: **byte-identical** — the same
20:10-UTC snapshot served), `LC` = `evidence/lean-check-2026-11-05.txt`
(the `ga-s3-lean-check.sh` run this session — the per-seat lean check that
replicates read-only the exact client-side computation at
MergedCard.tsx:113: **6 seats fire on the fresh wire** — real-yield-10y
supports · us10y supports (both MOVE-leg fires beyond their 0.1/0.15
thresholds) · us30y · fed-expectations · usdjpy pressures (LEVEL-leg fires
at decade highs 0.984/0.826/0.946) · breakeven-5y5y pressures (a MOVE-leg
fire); the other 14 readable seats sit honestly `steady` mid-band; ecb-dfr
reads `unread` (the hold); **all four lanes read `neutral` today**
(borrowing-costs a 2/2 split)); recorded absences cite 02's pre-scan marks +
02's own live-source verification lines (GA-S1/lock-record, 2026-11-04/05).
Every number from a run or a citation — no "probably" (03 §6).

**The fill column (04 §2, fixed).** `yes — W·A·C = severity`, the three
components each 1–3: **W** classic weight (3 core channel: R, D,
S-primary, F-positioning, D5/G1 structural · 2 secondary · 1
context-leaning H/X family or context-only treatment) · **A** availability
(3 free/keyless daily–weekly, or already ingested · 2 free but
laggy/coarse/portal-scrape · 1 paid/ToS-thin) · **C** wiring cost (3
promotion of an ingested series or a rule repair · 2 new source + rung +
voter · 1 new lane or engine-visible change). Severity = W×A×C (max 27);
ties break toward cheaper wiring (GA-S4's job — this column only seeds).
**No backtest component, ever (D-GA-2): the ranking is
classic-literature importance × data availability × wiring cost, never a
forecasting claim.** One class per row, no silent waves (D-GA-6).

---

## 1. The voter mapping — all 21 seats (01 §5.2)

| # | voter (seat @ gold-score.ts) | lane · polarity | taxonomy row | the mapping's one-line justification |
|---|---|---|---|---|
| 1 | `real-yield-10y` @158 | borrowing-costs · −1 | **R1** | the row's exact object (FRED DFII10, 02 R1's own source) — w§1:1 |
| 2 | `us10y` @159 | borrowing-costs · −1 | **R1** (belt-and-braces) | the nominal 10y = real + breakeven; H4 accepts it as belt-and-braces ONLY because `real-yield-10y` (the real object) is healthy — 03 §4's own example; w§1:2 |
| 3 | `us30y` @160 | borrowing-costs · −1 | **R1** (belt-and-braces) | same nominal-proxy footing at the long end; H4 accept-with-note — w§1:3 |
| 4 | `fed-target` @161 | borrowing-costs · −1 | **R5** | the row's exact object (DFEDTARL/U corridor) — w§1:4 |
| 5 | `fed-expectations` @162 | borrowing-costs · −1 | **R6** | the row's own named derivation ("2y yield, or a fed-expectations derivation") — w§1:5 |
| 6 | `ecb-dfr` @163 | borrowing-costs · −1 | **R10** | the row's named ECB DFR leg — w§1:6 |
| 7 | `yield-curve-10y2y` @164 | borrowing-costs · −1 | **R4** | the curve regime row's 10y−2y leg (nominal, H3/H4 defects recorded) — w§1:7 |
| 8 | `yield-curve-10y3m` @165 | borrowing-costs · −1 | **R4** | the same row's 10y−3m leg — w§1:8 |
| 9 | `dollar-basket` @168 | dollar · −1 | **D1** | the row's exact object ("the basket a DXY-style index is built from" — the repo's DXY-recipe derivation, inv §2) — w§1:9 |
| 10 | `usdjpy` @169 | dollar · −1 | **D4** | the row's exact cross (Frankfurter USD→JPY) — w§1:10 |
| 11 | `us-japan-10y-gap` @170 | dollar · −1 | **R10** | the row's "+ policy gaps" leg (the US−Japan rates gap; an H4 market-vs-policy-gap note recorded) — w§1:11 |
| 12 | `stress-stlfsi` @173 | stress · +1 | **S5** | the row's named composite (STLFSI4) — w§1:12 |
| 13 | `nfci` @174 | stress · +1 | **S5** | the row's named composite (NFCI) — w§1:13 |
| 14 | `vix` @175 | stress · +1 | **S1** | the row's exact object (VIXCLS) — w§1:14 |
| 15 | `gold-silver` @176 | stress · +1 | **X1** | the row's exact object ("the repo's gold-silver derivation", 02 X1's own source note) — w§1:15 |
| 16 | `cftc-gold-positioning` @177 | stress · −1 | **F1** | the row's exact object (net non-commercial share of OI, `deafut.txt`) — w§1:16 |
| 17 | `us-cpi-yoy` @179 | inflation · +1 | **I1** | the row's exact object (CPIAUCNS YoY) — w§1:17 |
| 18 | `us-pce-core-yoy` @180 | inflation · +1 | **I2** | the row's core-PCE leg (PCEPILFE YoY) — w§1:18 |
| 19 | `euro-hicp` @181 | inflation · +1 | **UNCLASSICATED — a defect** | the locked checklist holds **no euro-area realised-inflation row** (the I-family is US-centric; R10 is foreign *policy rates*; I11 is the global *liquidity* aggregate — verified by walking all 85). Either the checklist missed a classic indicator (euro-area realised inflation as a hedge-demand channel — an owner amendment, D-GA-1) or the voter has no classic justification in the locked set (a re-seat question). **The owner decides — recorded as the matrix's finding N-1, for GA-S4's decision list.** The wiring trace itself is complete (w§1:19); the defect is the mapping's, not the wiring's |
| 20 | `breakeven-5y5y` @182 | inflation · +1 | **R7** | the row's exact object (T5YIFR) — w§1:20 |
| 21 | `breakeven-tilt` @183 | inflation · +1 | **R7** (the change accent) | the tilt = T5YIFR−T5YIE = the *expectations term-structure tilt* — R7's own treatment phrase ("the classic 'expectations tilt'", 02 R7) and the D-5 record's own rationale ("the priced ACCELERATION of inflation", gold-score.ts:183). It is **not** R13's object (the breakeven-vs-*swap* liquidity basis has no swap leg in the repo's derivation, inv §2 `breakeven-tilt`); 02 R13's "free proxy" note is corrected here honestly — see R13's row — w§1:21 |

**Mapping arithmetic:** 21 seats = 8 borrowing-costs + 3 dollar + 5 stress +
5 inflation (gold-score.ts:155-184, verified in inventory.md §5); 20
mapped to 14 distinct rows (R1 ×3 · R4 ×2 · R7 ×2 · S5 ×2 · R5/R6/R10 ×2/
D1/D4/S1/X1/F1/I1/I2 ×1) + 1 UNCLASSICATED. Every mapping decision above is
recorded with its reason — the four judgment calls the GA-S3 prompt named
are resolved as stated: the yield-curve seats → R4 (the polarity defect is
H3's, below); cftc → F1 (PARTIAL, the never-fires number is the evidence);
us10y/us30y → R1's belt-and-braces (H4 accept-with-note, the real object
healthy); michigan-sentiment is NOT one of the 21 (its S13 resolution is
S13's row, below).

---

## 2. The matrix — one row per taxonomy row (02 v1.1, the 85)

### R. Real rates & policy (14 rows)

| Row (02) | Current footprint | Class | Reason (one line, cited) | fill program? |
|---|---|---|---|---|
| R1 · US 10y real yield | `real-yield-10y` (voter, w§1:1) + `us10y` + `us30y` (belt-and-braces, w§1:2-3) | **COVERED** | the exact object votes with BOTH legs (move 0.1 pts, connections.ts:576, + level; base 2,497, ch/pct 18/19 recorded days, HD §3) and **FIRES on the fresh wire** (real-yield-10y + us10y supports via the falling move; us30y pressures via its decade-high level — LC: 2 move-leg fires + 1 level-leg fire under this row); the two nominal seats ride beside it (H4 notes, half-implementation.md) | no |
| R2 · US 5y real yield | none (02-pre ABSENT; no 5y-real reading in the 161) | **MISSING-FREE** | no voter, no input; the free object is live (FRED DFII5, verified 2026-11-04/05, 02 R2) | yes — 3·3·2 = 18 (new source+rung+seat; the belly where policy bites first) |
| R3 · Front-end real yield (2y) | none as an object; the proxy legs exist (`real-yield-10y` votes; `us-2y` context, w§2) | **MISSING-PAID** | the exact 2y real object exists only via paid swap decomposition (DFII2 404, verified, 02 R3); the free proxies named (DFII5 = R2's fill; the nominal path = R6's seat) | no (the proxy routes are R2/R6's own rows) |
| R4 · Real curve | `yield-curve-10y2y` + `yield-curve-10y3m` (voters, w§1:7-8) | **PARTIAL** | two seats exist and fire (bases 2,495, HD §3), but (a) the sign is fixed −1 where the classic is regime-dependent (H3, the frozen spec's own "ambiguous" record) and (b) they read the NOMINAL curve where the classic object is the real curve (H4) and (c) the classic treatment is "context / secondary" — the meter votes it twice | yes — 3·3·3 = 27 (the sign/re-seat decision + the real-curve derivation, which pairs with R2) |
| R5 · Policy rate (Fed target) | `fed-target` (voter, w§1:4) | **COVERED** | the exact object votes, level-led claim ("the level of the nominal anchor"); base 3,649, 18/19 days, HD §3; honestly `steady` mid-band on the fresh wire (pct 0.676 — LC; the bands are reachable by construction over the trailing decade, and the level leg's live fire-path is proven by the seats at the bands today, LC); the step direction rides the displayed change/lastChange, never the lean (recorded, half-implementation.md H1 note) | no |
| R6 · Market-implied policy path | `fed-expectations` (voter, w§1:5) + `us-2y` (context, w§2) | **PARTIAL** | the row's own named derivation votes, but the classic treatment is change-led ("the priced path is what MOVES gold") and the seat is LEVEL-ONLY (no threshold, w§1:5) — a rule that can only express part of the claim (H1) | yes — 3·3·3 = 27 (the threshold repair) |
| R7 · Long-run breakeven (5y5y) | `breakeven-5y5y` (voter, w§1:20) + `breakeven-tilt` (voter, the change accent, w§1:21) | **COVERED** | the level+move seat (threshold 0.1, base 2,495, 18/19 days) **FIRES on the fresh wire** (breakeven-5y5y pressures via the falling move −0.14, LC) PLUS the tilt accent seat (the D-5 promotion's recorded variant; honestly `steady` mid-band, LC) — the row's own "level + change (the classic 'expectations tilt')" treatment expressed by voting seats; the tilt's context-status quirk recorded (half-implementation.md H7 note) | no |
| R8 · Spot breakevens (5y, 10y) | `t5yie` + `breakeven-10y` (context, never vote, w§2) — and T5YIE feeds the `breakeven-tilt` voter as a derived input (inv §2) | **PARTIAL** | the free healthy objects are ingested and one feeds a voter, but the row's own claim (the SPOT level's sign: "falling spot breakevens read as disinflation pressure") has no voting expression — the tilt expresses the spread, not the level, and a spot-only rise moves the tilt the OPPOSITE way (rising spot → falling tilt → pressures); no recorded decision parks the spot levels (D-5 chose the tilt's promotion, not the spot's exclusion) | yes — 3·3·3 = 27 (the promotion question — `t5yie` into the meter's voting plane, owner-gated) |
| R9 · Term premium (10y) | `term-premium-10y` (context card, never votes, w§2; rung-4, staleness 14d) | **MISSING-FREE** | no voter or input reads the repo's own card (THREEFYTP10, L0 public domain, live through 2026-10-30 per 02 R9's verification); the classic claim is voting-class ("rises with fiscal/inflation-risk fear, gold-positive"; the G-family's priced channel) — the cheapest promotion candidate on the board | yes — 3·3·3 = 27 (promotion, zero new fetches) |
| R10 · Foreign policy rates + gaps | `ecb-dfr` (voter, w§1:6) + `us-japan-10y-gap` (voter, w§1:11) + `boj-rate`/`boe-rate`/`jgb-10y` (context, w§2) | **PARTIAL** | the ECB leg is healthy (base 3,649, 19/19 days, HD §3) but the row's "level of gaps" treatment is expressed by a seat whose percentile is INTERMITTENT (21 staged pts, base 20 < 30, pct 6/9 recorded days — HD §2/§3, the H2 defect) and the BoJ/BoE legs never vote | yes — 3·3·3 = 27 (the gap-seat derivation repair; the crosses stay context per the row's own treatment) |
| R11 · R-star / neutral rate | none (02-pre ABSENT) | **MISSING-FREE** | no voter, no input; free source verified live (NY Fed HLW, quarterly — 02 R11); the row's own treatment is context-only ("the regime label") | yes — 1·2·2 = 4 (a GF-P4 context-class add, not a voter) |
| R12 · Negative-yielding debt | none (02-pre ABSENT) | **NOT-APPLICABLE** | the row ITSELF records the candidacy ("NOT-APPLICABLE candidate (post-2022 the stock is ~0)"; "none free since ~2022, verified: no FRED series exists" — 02 R12, the lock-record re-verification): the classic object died with the phenomenon; this is the era reason, not convenience | no |
| R13 · TIPS liquidity / breakeven–swap basis | none as the exact object (no swap-basis series; the repo's tilt expresses the expectations term-structure, w§1:21) | **MISSING-PAID** | the exact object (breakeven vs inflation SWAP) has no free series — the row's own verification ("inflation swaps are OTC — MISSING-PAID (verified: no FRED series)"); 02 R13's "free proxy" note named the repo's tilt, but the tilt's derivation (T5YIFR−T5YIE, inv §2) has NO swap leg — it is R7's tilt, recorded here as the honest correction | no (the exact object stays paid; the row's own treatment is a context quality-flag, not a direction bet) |
| R14 · JGB 10y / YCC regime | `jgb-10y` (context, never votes, w§2) + it feeds the `us-japan-10y-gap` voter (inv §2, run.ts:886-899) | **CONTEXT-ONLY-BY-DESIGN** | the recorded decision is the row's own locked treatment ("context; pairs with D4 and R10's Japan leg" — 02 R14): the card exists, never votes, and its data reaches the meter through the R10 gap seat | no |

### D. The dollar (9 rows)

| Row | Current footprint | Class | Reason | fill program? |
|---|---|---|---|---|
| D1 · DXY / dollar basket | `dollar-basket` (voter, w§1:9) | **COVERED** | the exact object (the DXY-recipe basket, inv §2) votes with BOTH legs (threshold 1.0 + level; base 2,555, 19/19 days, HD §3; healed to y/y on the fresh wire, WS) | no |
| D2 · Broad trade-weighted dollar | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the free object verified live (FRED DTWEXBGS, daily → 2026-10-30, 02 D2) — "the honest inverse" per the row's own claim | yes — 3·3·2 = 18 (new source+rung+seat) |
| D3 · EUR/USD | `eur-usd` (context, never votes, w§2) | **CONTEXT-ONLY-BY-DESIGN** | the recorded decision is the row's own locked treatment ("cross-check / context" — 02 D3); the basket (D1) carries the voting claim | no |
| D4 · USD/JPY | `usdjpy` (voter, w§1:10) | **PARTIAL** | the exact cross votes and **fires on the fresh wire** (pressures via its decade-high level 0.946 — LC; base 2,555, 19/19 days), but the classic treatment is "change emphasis" and the seat is LEVEL-ONLY — the only pct-changeKind seat, its changeKind set up but no threshold consumes it (H1) | yes — 3·3·3 = 27 (the pct-threshold repair) |
| D5 · USD share of world FX reserves | `usd-reserve-share` (shadow-gauge member, context-only until S6-M6.4 — w§2; gauges.ts isShadowGauge, the G-5 design) | **CONTEXT-ONLY-BY-DESIGN** | the recorded decision is the G-5 shadow design + the OPEN S6-M6.4 promotion question (README OI-GA-3: "never votes until the S6-M6.4 promotion decision. Is that decision part of the fill program?") — the object is ingested (COFER SDMX, quarterly) and never votes | **yes (promote-worthy) — 3·2·3 = 18** (the OI-GA-3 owner decision) |
| D6 · Gold in non-USD terms | `gold-aud` (context, one-live-point derivation, inv §2) + `usdaed` (context, w§2) + `eur-usd` (context, w§2) | **CONTEXT-ONLY-BY-DESIGN** | the row's own locked treatment is context; the family is partially expressed (XAU×AUD; the FX legs) and never votes — the thinness of `gold-aud` (exactly one live observation, inv §2) recorded as a wiring fact | no |
| D7 · USD/CHF (haven cross) | none (02-pre ABSENT — no USD/CHF reading) | **MISSING-FREE** | no reading; the free leg is ALREADY FETCHED (CHF is one of the six `dollar-basket` currencies, one Frankfurter fetch, inv §2) — a derived-series add with zero new fetches | yes — 2·3·2 = 12 (new derived series + seat; the row's own treatment is context-leaning) |
| D8 · EM devaluation episodes | `usdtry` (context, never votes, w§2) | **CONTEXT-ONLY-BY-DESIGN** | the row's own locked treatment ("event / extreme band; context"; "USD-gold impact is regime-dependent" — 02 D8); the EM-pressure card carries it as context | no |
| D9 · EME trade-weighted dollar | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the free object verified live (FRED DTWEXEMEGS → 2026-10-30, 02 D9) — the EM-heavy marginal-buyer leg the D-family wants | yes — 3·3·2 = 18 (new source+rung+seat) |

### I. Inflation & purchasing power (11 rows)

| Row | Current footprint | Class | Reason | fill program? |
|---|---|---|---|---|
| I1 · US headline CPI YoY | `us-cpi-yoy` (voter, w§1:17) | **COVERED** | the exact object votes (base 118 = a decade of monthlies, pct 18/19 days, HD §3); the claim is level-led and the level leg carries it; the momentum complement is the displayed previous-release change, not the 3m-annualised classic (recorded, half-implementation.md H1 note) | no |
| I2 · Core CPI / core PCE | `us-pce-core-yoy` (voter, w§1:18) + `us-cpi-core-yoy` (context, w§2) | **COVERED** | the row's core-PCE leg votes (base 119, pct 10/10 present-days, HD §3; y/y on the fresh wire, WS); the CPI-core twin stays context; same momentum note as I1 | no |
| I3 · Michigan 1y expectations | `michigan-1y-expectations` (COMPANION-ONLY inside the `michigan-sentiment` card, definitions.ts:2081; w§2) | **MISSING-FREE** | no voter, no voter-input — the free object is ingested but rendered as a companion line that "never votes" (w§2; the vote belongs to the parent card per its own definition); the classic claim is voting-class ("households pricing inflation in BEFORE the market does") | yes — 2·3·3 = 18 (the promotion question — owner-gated; companion-only means a rule + card change) |
| I4 · Michigan 5–10y expectations | none (02-pre ABSENT; FRED carries no such series — verified, 02 I4) | **MISSING-FREE** | the free source is the UoM SIE portal (a download, not a feed — the row's own honest availability); the long-run household anchor, "the slow version of R7" | yes — 2·2·2 = 8 (portal-scrape source + rung + seat) |
| I5 · Market long-run expectations | — | **cross-listed → R7** | resolves to the primary (COVERED); the cross-list rule stated per 02's own row-count section | (R7's answer) |
| I6 · Spot breakevens | — | **cross-listed → R8** | resolves to the primary (PARTIAL) | (R8's answer) |
| I7 · Money supply (M2) growth | `m2-us` (context, never votes, w§2; growth-health card) | **CONTEXT-ONLY-BY-DESIGN** | the recorded decision is the row's own locked treatment ("YoY level; context-leaning" — 02 I7) — but the fill design (04 §3 GF-P2) itself names "M2/Michigan-class inflation" as an expected promotion candidate: recorded as promote-worthy | **yes (promote-worthy) — 2·3·3 = 18** (the GF-P2 question, owner-gated) |
| I8 · Inflation persistence | `median-cpi` + `sticky-cpi` (context, never vote, w§2) | **CONTEXT-ONLY-BY-DESIGN** | the row's own locked treatment ("level; context-leaning" — 02 I8); both cards exist beside the inflation lane and never vote | no |
| I9 · Inflation surprises vs nowcasts | none (02-pre ABSENT) | **MISSING-FREE** | no series; the free source is the Cleveland Fed nowcasting page (verified live, 02 I9) vs realised prints — an event/short-window derivation | yes — 2·2·2 = 8 (a derived event object + rung; the row's own treatment context-leaning) |
| I10 · Real gold price vs long-run range | none (02-pre ABSENT: "derived, not built") | **MISSING-FREE** | no reading — but BOTH legs are already on the wire (`gold-usd` + the CPI index feeding `us-cpi-yoy`): a zero-new-fetch derived context card (the Jastram valuation anchor) | yes — 1·3·3 = 9 (a derived context card, GF-P4) |
| I11 · Global liquidity / CB aggregate | the US legs: `walcl` · `reverse-repo` · `bank-reserves` · `tga` · `net-liquidity` (all context, never vote, w§2); no ECB/BoJ legs, no aggregate | **MISSING-FREE** | no voter, no input; the free legs exist (FRED WALCL verified, 02 I11) and the US legs are already ingested as context cards — the aggregate derivation is not built (the row's own treatment: "YoY growth; context-leaning") | yes — 2·2·2 = 8 (a derived aggregate + the ECB/BoJ legs; GF-P4-context-class per the treatment) |

### S. Stress, risk & haven demand (13 rows)

| Row | Current footprint | Class | Reason | fill program? |
|---|---|---|---|---|
| S1 · VIX level (+ term slope) | `vix` (voter, w§1:14) | **COVERED** | the primary object votes (base 2,544, 18/19 days, HD §3); the parenthetical term-slope complement is NOT ingested (a recorded absence — the 161 holds no VIX-term-structure id); the conditional-haven nuance is the S-family's design (the lanes read the regime together) | no |
| S2 · High-yield credit spread | none (02-pre ABSENT — "no HY-spread card (the OD-5 no-go)") | **MISSING-PAID** | the object is served keyless BUT carries the pre-approval licence class the repo's register fail-closes (LICENCES.md OD-5) AND a rolling ~3y served window (first obs 2023-11-06/07, verified both sessions) — ToS-thin for this repo; the free proxy (the S5 composites) ALREADY VOTES (S5) | no (the proxy is in place; the owner's EODHD policy OI-GA-5 could revisit — flagged, not seeded) |
| S3 · Investment-grade spread | none (02-pre ABSENT) | **MISSING-PAID** | same honest re-class as S2 (the same ICE BofA tag + 3y window, 02 S3); same voting proxy | no (OI-GA-5 note) |
| S4 · Excess bond premium (EBP) | `ebp` (context, never votes, w§2; rung-4 Saturday, L0) | **MISSING-FREE** | no voter or input reads the repo's own healthy card (Fed Board ebp_csv.csv, live 44,606 B — the card's own file, 02 S4); the classic claim is voting-class ("the de-trended risk-appetite signal the literature PREFERS to raw spreads") — the top promotion candidate | yes — 3·3·3 = 27 (promotion, zero new fetches) |
| S5 · Financial-stress composites | `stress-stlfsi` + `nfci` (voters, w§1:12-13) + `ofr-fsi` (context, w§2) | **COVERED** | two of the row's three named composites vote (bases 521 = a decade of weeklies, 18/19 days, HD §3); the third rides as context — belt-and-braces | no |
| S6 · Equity drawdown / breadth | `sp500-breadth-ratio` (shadow-gauge member, context-only until S6-M6.4 — w§2) + the Shiller pair (context, not-gold valuation cards, inv §1.3) | **CONTEXT-ONLY-BY-DESIGN** | the recorded decision is the G-5 shadow design + the OPEN S6-M6.4 promotion question (OI-GA-3's second half); the row's own treatment is context-leaning | **yes (promote-worthy) — 2·3·3 = 18** (the OI-GA-3 owner decision) |
| S7 · Geopolitical risk (GPR) | `gpr-*` ×10 (context, never vote, w§2 — incl. the daily 7d-MA variant) | **MISSING-FREE** | no voter, no input; the canonical objects are ingested (L0, monthly + daily, the repo's own rung-2 first-of-month ingest) and never vote — the classic claim is voting-class ("threats lead, acts confirm") | yes — 3·3·3 = 27 (the promotion question — which GPR object, owner-gated; the GF-P2 expected candidate) |
| S8 · Policy uncertainty (EPU, TPU) | `epu-us` + `tpu-us` (context, never vote, w§2) | **MISSING-FREE** | no voter, no input; the objects are ingested (the repo's own live first-of-month BBD ingest grounds the venue-blocked source, 02 S8) and never vote; the classic treatment is "level" — a voting-class read | yes — 2·3·3 = 18 (the promotion question; S-secondary weight) |
| S9 · Bank stress / facility usage | none (02-pre ABSENT — no facility-usage series) | **MISSING-FREE** | the free object verified live (FRED DPCREDIT weekly → 2026-11-02; the era series dated, 02 S9); nothing ingested — the modern bank-run tell is absent from the data plane | yes — 2·3·2 = 12 (new source+rung; the row's own treatment event-leaning/context) |
| S10 · Repo-market stress | `repo-stress` (context, never votes, w§2; the derived SOFR−IORB card, inv §2) | **CONTEXT-ONLY-BY-DESIGN** | the row's own locked treatment ("level; context" — 02 S10); the derived card exists and never votes | no |
| S11 · EU sovereign stress | `btp-bund-spread` (context, never votes, w§2) | **CONTEXT-ONLY-BY-DESIGN** | the row's own locked treatment ("context-leaning" — 02 S11); the card exists (the derived OECD-mirror spread, inv §2) and never votes | no |
| S12 · EM sovereign stress (EMBI) | none (02-pre ABSENT) | **MISSING-PAID** | the clean object is JPMorgan-paid (verified: no FRED series, 02 S12); the named free proxies are the S5 composites (voting) + D9/D8 (the fills above) | no (the proxies carry the channel) |
| S13 · US household pessimism (Michigan) ★ v1.1 | `michigan-sentiment` — a SCORED VOTER in growth-health (definitions.ts:2066-2077, percentile tail low; gauges.ts growth-health member), NEVER a gold-lane seat (the mirror sweep's `not-gold — consumer-mood` mark was correct as a wiring fact) | **MISSING-FREE** | no gold-lane voter, no gold-lane input — the Chicago Fed's named pessimism driver is already ingested as the FREE FEED object (UMCSENT, 887 pts 1952-12→2026-09, re-verified 2026-11-05, 02 S13) but its gold claim is unwired; the mirror-sweep mark is revisited and RECORDED here: the object matches S13, the gold-lane expression is absent — promotion-class (the cheapest fill on the board, with a sign nuance: the growth rule reads bottom-quintile sentiment as growth-NEGATIVE; S13's claim reads pessimism as gold-POSITIVE — the re-seat needs the owner's polarity decision) | yes — 3·3·3 = 27 (the re-seat/promotion, owner-gated) |

### F. Flows, positioning & demand (16 rows)

| Row | Current footprint | Class | Reason | fill program? |
|---|---|---|---|---|
| F1 · CFTC net speculative length | `cftc-gold-positioning` (voter, w§1:16) | **PARTIAL** | the exact object votes in form (net non-comm share of OI, the row's own classic object) but CANNOT FIRE in the current corpus era: **1 staged point, percentile base 0, 0/9 archive days with either input** (HD §2/§3) — the level leg needs ≥30 accumulated Saturdays (scoring.ts:72) before it can exist; the never-fires number is the PARTIAL evidence; on the fresh wire the seat reads `steady` — readable (its warning status passes readable()) with NEITHER input, the member-line truth the lean check exposed (LC, half-implementation.md D-18) | yes — 3·3·3 = 27 (the history backfill from the free CFTC archive + the extreme-based rule question — GF-P1's named repair) |
| F2 · CFTC gross long & short | none (02-pre ABSENT: "net-share only, no gross legs") | **MISSING-FREE** | no reading; the free source is the SAME file already ingested (`deafut.txt` carries the gross legs, 02 F2) — an adapter-parse extension | yes — 3·3·3 = 27 (the parse extension + seats; rides F1's backfill) |
| F3 · Gold ETF holdings & flows | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the clean free object is the WGC monthly ETF XLSX (verified live, 02 F3); the classic claim voting-class ("the Western investor bid, visible daily") | yes — 3·2·2 = 12 (new source+rung; the OI-GA-4 monthly/quarterly voter-vs-context debate) |
| F4 · Central-bank net purchases | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the WGC GDT quarterly page verified live (02 F4) — "the 2022–2026 regime driver" | yes — 3·2·2 = 12 (the OI-GA-4 debate; the classic answer context-first, the owner calls) |
| F5 · Total demand vs supply balance | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the row's own treatment is context ("the annual balance frames everything else") — a GF-P4-class add | yes — 2·2·2 = 8 (context card) |
| F6 · Shanghai/Asia premium | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the free-first derivation legs ALL verified (SGE Au9999 UA-sensitive × gold-api XAU × Frankfurter USD/CNY, 02 F6) — "the classic scarcity tell" | yes — 3·3·2 = 18 (the derived premium + seats) |
| F7 · India premium/discount | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the import-parity legs free (Frankfurter INR; MCX delayed free-view, 02 F7); the row's own treatment context-leaning | yes — 2·3·2 = 12 (the derivation; context-leaning treatment) |
| F8 · COMEX warehouse stocks | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the source is CME published reports — free-view but automation-hostile (403 from this venue, 02 F8); the repo's own Node-venue fetch pattern (the auctions precedent, inventory §3 rung-4) is the recorded route | yes — 2·2·2 = 8 (Node-venue fetch + context card; the row's own treatment context) |
| F9 · Lease rates / forward rates | none | **MISSING-PAID** | the row's own verification: "no free successor series exists" (GOFO died 2015; the benchmarks paid/thin, 02 F9); the proxy route is the owner's EODHD key (OI-GA-5) or CME free-view | no (OI-GA-5's item-by-item policy, flagged) |
| F10 · Futures term structure | none | **MISSING-PAID** | the row's primary named source is EODHD (the owner key, OI-GA-5) with CME delayed free-view beside it (02 F10); the row's own treatment context | no (OI-GA-5 note) |
| F11 · Retail coin & small-bar demand | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the source is usmint.gov (free, venue-blocked 403 to this audit) with WGC's free monthly republication as the named fallback (02 F11) — "the retail fear gauge" | yes — 2·2·2 = 8 (new source+rung; context-leaning treatment) |
| F12 · ETF short interest / GLD volume | none | **MISSING-FREE** | no reading; the honest source class is "free-ish (fund pages)" (02 F12) — scrape-class, the lowest availability that still clears free | yes — 2·1·2 = 4 (context-class; the v1 pruning note recorded it context) |
| F13 · Official-sector monthly purchases ★ v1 | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the free official sources named (PBoC/SAFE monthly gold-reserve tables + CBR, 02 F13) — the monthly-resolution twin of F4 | yes — 3·2·2 = 12 (new source+rung; the OI-GA-4 family) |
| F14 · COMEX–LBMA EFP basis ★ v1 | none | **MISSING-PAID** | the row's own class note ("MISSING-PAID-class — verified: the clean EFP needs both a live futures leg (CME: 403) and the London price (bot-challenged); no free clean series", 02 F14); the free proxies = F8's drains + F6's premium direction (the fills above) | no |
| F15 · SGE monthly withdrawals ★ v1 | none (02-pre ABSENT) | **MISSING-FREE** | no reading; SGE monthly statistics free (UA-sensitive, site verified, 02 F15) — the China physical-demand proxy | yes — 2·2·2 = 8 (new source+rung; context-leaning treatment) |
| F16 · Swiss gold net exports ★ v1.1 | none (02-pre ABSENT: "no Swiss-flow row") | **MISSING-FREE** | no reading; BAZG SwissImpex verified live 2026-11-05 (free/keyless monthly by country 2012→, 02 F16) — the flow evidence behind F6/F7 | yes — 2·2·2 = 8 (new source+rung; context-leaning treatment) |

### X. Cross-asset relative value (7 rows)

| Row | Current footprint | Class | Reason | fill program? |
|---|---|---|---|---|
| X1 · Gold/silver ratio | `gold-silver` (voter, w§1:15) | **PARTIAL** | the exact object votes with the right sign (+1, "a high ratio IS the monetary-stress read") but the union base is THIN: **122 staged points, percentile base 119** (HD §3) with change30d **0/19 recorded days** (the live leg was <30d old through the corpus record; both fields present on the 2026-11-04/05 wires, WS) — the H2 suspect the wiring pack numbered | yes — 1·3·3 = 9 (the history deepening from free daily legs; the live stress-lane seat argues for more weight — GA-S4's ranking call, recorded) |
| X2 · Gold/oil ratio | `gold-oil-ratio` (context, never votes, w§2) | **CONTEXT-ONLY-BY-DESIGN** | the row's own locked treatment ("context" — 02 X2); the derived card exists (inv §2) and never votes | no |
| X3 · Gold/copper | `copper-gold` — a SCORED VOTER in growth-health (definitions.ts:2172-2183, percentile tail low), never a gold-lane seat (w§2: "never votes — ratio") | **CONTEXT-ONLY-BY-DESIGN** | the recorded decision is the frozen curation comment itself ("the growth-health lane stays out entirely (its members' gold relation is weak or two-sided; copper-gold is already a ratio ABOUT gold)" — gold-score.ts:127-131) + the row's own locked treatment ("context: the growth-vs-fear axis" — 02 X3); the growth-health seat holds the GROWTH gauge's claim, not a gold claim | no |
| X4 · Gold/Bitcoin | `gold-btc` (context, never votes, w§2; exactly one live observation, no history — inv §2's own honest note) | **CONTEXT-ONLY-BY-DESIGN** | the row's own locked treatment ("context" — 02 X4); the one-live-point object recorded as a wiring fact | no |
| X5 · Gold vs equities (GLD/SPY) | none (02-pre ABSENT: "ratio not built") | **MISSING-FREE** | no reading; the source free (Yahoo, L2 owner-accepted per the repo's register, 02 X5); the long-horizon rotation gauge | yes — 1·3·2 = 6 (new derived series + context card) |
| X6 · Gold real price percentile | — | **cross-listed → I10** | resolves to the primary (MISSING-FREE) | (I10's answer) |
| X7 · Gold/platinum ratio ★ v1.1 | `platinum` (context price row, w§2) + `gold-usd` (context price tile, w§2) — both legs ingested, NO ratio reading (02-pre ABSENT: "the platinum price row exists but no ratio reading") | **MISSING-FREE** | no ratio reading, no voter; both legs already sit in the repo's price-row family (gold-api XPT verified live beside XAU, 2026-11-05, 02 X7) — a zero-new-fetch derived add | yes — 1·3·3 = 9 (a derived context card, the GF-P4 expected class) |

### G. Fiscal & sovereign (7 rows)

| Row | Current footprint | Class | Reason | fill program? |
|---|---|---|---|---|
| G1 · Federal deficit (% GDP, 12m) | `us-deficit-12m` + `us-deficit-monthly` (context, never vote, w§2; the derived rolling-12m + the raw series, inv §2) | **MISSING-FREE** | no voter, no input; the free object is INGESTED and healthy (FRED MTSDS133FMS, monthly; the repo's own derivation) — "fiscal dominance is the classic long-run gold narrative", a core-structural channel (04 §2 names D5/G1 structural) | yes — 3·3·3 = 27 (promotion, zero new fetches) |
| G2 · Net interest burden | `govt-interest-revenue` — a borrowing-costs GAUGE voter deliberately EXCLUDED from the gold lanes (w§2: "never votes — excluded-by-design") | **CONTEXT-ONLY-BY-DESIGN** | the recorded decision is verbatim in the code ("govt-interest-revenue stays out (a fiscal-sustainability share whose gold signal is contested — high interest costs argue both ways)" — gold-score.ts:127-129) + the row's own context-leaning treatment (02 G2) | no (the contested-sign exclusion stands; the owner may revisit) |
| G3 · Debt/GDP | none (02-pre ABSENT) | **MISSING-FREE** | no reading; the free object verified live (FRED GFDEGDQ188S quarterly → 2026-04-01, 02 G3) — the structural anchor, context treatment | yes — 2·2·2 = 8 (new source+rung+context card) |
| G4 · Foreign official Treasury holdings | `nyfed-custody` (context, never votes, w§2; FRED WSEFINTL1 weekly, the S2-M2.4 custody card) + the rung-3 TIC SLT dataset (the ingest fetch exists; no public reading id in the 161) | **CONTEXT-ONLY-BY-DESIGN** | the recorded decision is the row's own locked treatment ("trend; context-leaning" — 02 G4); the custody card exists and never votes — but the fill design names "COFER/TIC-class sovereign" as an expected GF-P2 candidate: recorded as promote-worthy | **yes (promote-worthy) — 2·3·3 = 18** (the GF-P2 question, owner-gated) |
| G5 · Treasury auction demand | `treasury-auction-10y/30y` + both `-indirect` companions (context, never vote, w§2; the Node-venue-only cards) | **CONTEXT-ONLY-BY-DESIGN** | the row's own locked treatment ("event-leaning; context" — 02 G5); the four cards exist and never vote | no |
| G6 · Debt-ceiling / shutdown risk | none (a calendar object; 02-pre ABSENT) | **CONTEXT-ONLY-BY-DESIGN** | the recorded reason is the row's own locked treatment ("context note; never a standing voter" — 02 G6): if ever added it would be a copy note, never a series — the absence recorded | no |
| G7 · US sovereign CDS (5y) | none | **MISSING-PAID** | paid (Markit, 02 G7); the named free proxy (T-bill dislocation around ceilings) is itself absent — the ceiling-window tell is carried only by G6's copy-class note | no |

### H. Supply (4 rows)

| Row | Current footprint | Class | Reason | fill program? |
|---|---|---|---|---|
| H1 · Mine production | none (02-pre ABSENT) | **MISSING-FREE** | no reading; WGC GDT verified live + USGS (venue-blocked 405, recorded, 02 H1); the family's own header: classically context-only for a conditions meter | yes — 1·2·2 = 4 (GF-P4 context card) |
| H2 · Recycling supply | none (02-pre ABSENT) | **MISSING-FREE** | no reading; WGC GDT (02 H2) | yes — 1·2·2 = 4 (GF-P4) |
| H3 · Jewellery + technology fabrication | none (02-pre ABSENT) | **MISSING-FREE** | no reading; WGC GDT (02 H3) — "the elasticity lives here" but context-treated | yes — 1·2·2 = 4 (GF-P4) |
| H4 · Producer hedging / de-hedging ★ v1 | none (02-pre ABSENT) | **MISSING-FREE** | no reading; WGC GDT (02 H4) — the 1999 Washington-Agreement-era lesson, context | yes — 1·2·2 = 4 (GF-P4) |

### M. Meta — deliberately non-voting (4 rows)

| Row | Current footprint | Class | Reason | fill program? |
|---|---|---|---|---|
| M1 · Gold's own price move | `gold-usd` (the price tile, context, never votes, w§2) | **CONTEXT-ONLY-BY-DESIGN** | the recorded reason is the row's own locked text ("Circularity — counting a falling price as evidence of falling is the exact defect D-GB-5 removed. Context pill only." — 02 M1) | no |
| M2 · Gold volatility (GVZ) | none (02-pre ABSENT) | **MISSING-PAID** | the row's own note: real-time implied vol is paid (Cboe); "context if ever free" (02 M2) | no |
| M3 · Seasonality | none (a calendar, never a series) | **NOT-APPLICABLE** | the row's own locked reason ("Calendar, not a condition; belongs in copy notes if anywhere" — 02 M3): a calendar pattern is not a today-condition under the meter's contract | no |
| M4 · The two-factor residual | none (an analytic device) | **NOT-APPLICABLE** | the row's own locked reason ("An analytic device, not an observable condition. Research-only." — 02 M4) | no |

---

## 3. The tallies, the defect flag, and the handoff

**The class arithmetic, restated:** every one of the 85 rows is resolved
above — COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 ·
CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3, plus the 3 cross-lists
carrying their primaries' classes (I5→R7 COVERED · I6→R8 PARTIAL ·
X6→I10 MISSING-FREE). **One class per row, no silent waves (D-GA-6).**

**The `UNCLASSICATED` defect (the matrix's finding N-1).** `euro-hicp` —
an inflation-lane voter since the lane consolidation, wiring-complete
(w§1:19) — maps to NO row in the locked checklist: the I-family is
US-centric, R10 is foreign *policy rates*, I11 the global *liquidity*
aggregate. The exit-guarantee (01 §5.2) makes the flag mandatory and the
owner decides which: **(a)** the checklist missed a classic indicator
(euro-area realised inflation as a hedge-demand channel — an owner-recorded
amendment to 02 with its date, D-GA-1) or **(b)** the voter has no classic
justification in the locked set (a re-seat/remove question for the fill
program). The audit records the flag and both readings; it does not
pre-decide.

**The severity bands (the fill seeds, for GA-S4's ranking):** the 27-band
(severity 27, 12 rows) — R4 · R6 · R8 · R9 · R10 · D4 · S4 · S7 · S13 ·
F1 · F2 · G1 — every one a core-channel claim with the data in hand (a
rule repair, a promotion, or a sign decision; ties break toward cheaper
wiring). The 18-band: R2 · D2 · D5 · D9 · I3 · I7 · S6 · S8 · G4. The
12-band: D7 · S9 · F3 · F4 · F6 · F7 · F13. The ≤9 tail: R11 · I4 · I9 ·
I10 · I11 · F5 · F8 · F11 · F15 · F16 · X1 · X5 · X7 · G3 · H1–H4 · F12.
**No backtest component (D-GA-2) — the ranking is classic-literature
importance × availability × wiring cost only.**

**What GA-S4 receives from this matrix:** the 8 COVERED rows (the
meter's honest core), the 7 PARTIAL rows (with the H-evidence in
`half-implementation.md`), the 36 MISSING-FREE rows (16 with the free
object already ingested — the promotion class), the 10 MISSING-PAID rows
(with the OI-GA-5 flags where EODHD could cleanly cover), the 4
promote-worthy CONTEXT-ONLY-BY-DESIGN rows (the recorded open owner
questions D5/I7/S6/G4 — OI-GA-3's territory), the 3 NOT-APPLICABLE rows,
and the one UNCLASSICATED defect for the owner's decision list. The
owner's OI-GA-2..6 questions now have their exact evidence base.
