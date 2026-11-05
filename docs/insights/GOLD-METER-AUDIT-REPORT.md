# The gold meter audit — the report

**Status: delivered 2026-11-05 by the GA-S4 session** — the gold meter
audit program's closing deliverable (A4, 01 §2; the report shape 04 §1).
**The denominator was amended v1.1 → v1.2 on 2026-11-05 by the owner's
RECORDED answer G (the GF-S7 answer sheet — the N-1 amendment, executed
at GF-P2 by the GF-S8 session): 02-REFERENCE-TAXONOMY = 86 rows** (the
v1.2 amendment adds N-A1, the euro-area realised-inflation row the
checklist itself missed; the live-state arithmetic below restates to 86
— the dated session records in the audit's own PROGRESS/PROMPTS keep
their recorded 85). The audited object: the consolidated lane balance live
for every visitor on currena.ir — the frozen 21-voter table
`GOLD_LANE_VOTERS` (`gold-score.ts:155-184`, 4 lanes: borrowing costs 8 ·
dollar 3 · market stress 5 · inflation 5), the evaluator `evalLeg`
(`connections.ts:595-614`), the consolidation (`gold-balance.ts`,
`GOLD_LANE_MIN_FIRING = 2`), the derived Outlook and the context pill.
The evidence base (every number below cites one of these):
`evidence/coverage-matrix.md` (the classification) ·
`evidence/half-implementation.md` (the defects) · `evidence/wiring.md`
(the 21 traces + the 63 context traces) · `evidence/inventory.md` (the
161-row readings table + the voters table §5) · the four committed runs —
`history-depths-2026-11-05.txt` (`ga-s2-history-depths.sh`) ·
`wire-scan-2026-11-04/-05.txt` (`ga-s2-wire-scan.sh`) ·
`lean-check-2026-11-05.txt` (`ga-s3-lean-check.sh`). The audit changed
nothing: no meter code, no wire, no copy (D-GA-3); every fill executes in
the owner-gated gap-fill program (§6 below).

---

## 1. The header arithmetic (the completeness guarantee, stated up front)

| Guarantee | Count | Basis |
|---|---|---|
| **rows classified** | **86 = the taxonomy (v1.2)** | 82 v1 rows carry exactly one class + the 3 cross-lists resolved to their primaries (I5→R7 · I6→R8 · X6→I10 — they carry the primary's class, no class of their own) + the v1.2 amendment's N-A1 (euro-area realised inflation, COVERED — the owner's recorded answer G, 2026-11-05: the row the checklist itself missed, `euro-hicp` maps to it) — coverage-matrix.md §2 + 02's v1.1→v1.2 amendment record |
| **voters mapped** | **21 = the voter table, ALL CLASSIFIED** | the 20 seats that always mapped to exactly one row each + `euro-hicp` — UNCLASSICATED at the audit (finding N-1) — RESOLVED by the v1.2 amendment (the owner's recorded G: the row is recorded, the voter maps to it; striking a healthy voter reduces coverage with no classic-literature basis) — coverage-matrix.md §1 + 02's amendment record |
| **defects found** | **18** | D-1 the structural finding (17 of 21 seats level-leg only) + 17 per-voter defect rows across 10 voters (11 voters carry none) — half-implementation.md §2 |
| class tally | **COVERED 9 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 · CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3** | 9+7+36+10+18+3 = 83 own classes + 3 cross-lists = 86 |
| fill-program backlog | **47 rows** | 7 PARTIAL + 36 MISSING-FREE + 4 promote-worthy CONTEXT-ONLY-BY-DESIGN (D5 · I7 · S6 · G4) — ranked in §4 below |

**The headline — how much of the classic condition set the meter sees
today (restated to the v1.2 denominator, 2026-11-05):**

> **The meter fully covers 9 of the 86 classic rows as healthy voting
> claims — 9/86 (≈ 10.5%).** Another 7 rows (8.1%) carry a voting seat
> that is half-implemented in a recorded way (the PARTIAL seven), so
> **16/86 (≈ 18.6%) of the classic set has any voting expression at
> all**; the remaining 67 rows are context-only by design (18), missing
> with a free source in reach (36), missing behind paid sources (10), or
> not applicable to a conditions meter (3) — plus the 3 cross-lists
> riding their primaries' classes. The one row the checklist itself
> missed — the 21st voter's (N-1) — was recorded by the owner's v1.2
> amendment (2026-11-05); the pre-amendment fractions were 8/85 (≈ 9.4%)
> and 15/85 (≈ 17.6%).

Read plainly, that fraction is not a criticism of the meter's mechanics —
it is the shape of the answer to the owner's question. **The meter's four
headline channels are covered at the primary-object level**: the
opportunity-cost core (R1 the 10y real yield — "THE textbook driver" seat
with both legs, R5 the policy anchor, R7 the long-run breakeven), the
dollar denominator (D1 the basket), realised + core inflation (I1 · I2),
and market stress (S1 VIX, S5 the composites). That is exactly the
Chicago-Fed-classic core. **What the meter does not see is the classic
set's breadth**: the flows/positioning family (16 rows) holds exactly one
seat anywhere and it cannot fire (F1); the stress family's
literature-preferred object (S4 EBP) is a context card; the fiscal
family's core channel (G1) is a context card; the term premium (R9) — the
priced channel the whole G-family trades through — is a context card. 63
of the repo's 161 ingested readings are gold-relevant context that never
votes (the mirror sweep, inventory.md §4): the data plane is far richer
than the voter set.

**What the visitor sees today (the lean check, `lean-check-2026-11-05.txt`):**
6 of 21 seats fire on the fresh wire — real-yield-10y and us10y
**supports** (move-leg fires beyond their 0.1/0.15-pt thresholds) ·
us30y · fed-expectations · usdjpy **pressures** (level-leg fires at
decade highs 0.984/0.826/0.946 — the structural finding's live proof that
level-only seats do fire at the bands) · breakeven-5y5y **pressures** (a
move-leg fire); 14 readable seats sit honestly `steady` mid-band;
ecb-dfr reads `unread` (the verified honest hold); **all four lanes read
`neutral` today** (borrowing-costs a 2/2 split; dollar 1 firing; stress
0; inflation 1 — the min-2 rule holding the lanes honest on a day with
firing evidence but no crowd).

---

## 2. The coverage matrix, condensed

The full matrix is `evidence/coverage-matrix.md` (every row, every
reason, every citation). Here: the per-family summaries, the COVERED
core, and every non-COVERED row in full. **The report re-classifies
nothing** (D-GA-6) — every class below is the matrix's own, restated
with its citation.

### 2.1 The per-family summaries

| Family | Rows | COVERED | PARTIAL | MISSING-FREE | MISSING-PAID | CONTEXT-ONLY-BY-DESIGN | NOT-APPLICABLE | In the backlog |
|---|---|---|---|---|---|---|---|---|
| R · Real rates & policy | 14 | 3 (R1 · R5 · R7) | 4 (R4 · R6 · R8 · R10) | 3 (R2 · R9 · R11) | 2 (R3 · R13) | 1 (R14) | 1 (R12) | 7 |
| D · The dollar | 9 | 1 (D1) | 1 (D4) | 3 (D2 · D7 · D9) | — | 4 (D3 · D5 · D6 · D8) | — | 5 (incl. D5 ★) |
| I · Inflation & purchasing power | 12 | 3 (I1 · I2 · N-A1) | — | 5 (I3 · I4 · I9 · I10 · I11) | — | 2 (I7 · I8) | — | 6 (incl. I7 ★) |
| S · Stress, risk & haven demand | 13 | 2 (S1 · S5) | — | 5 (S4 · S7 · S8 · S9 · S13) | 3 (S2 · S3 · S12) | 3 (S6 · S10 · S11) | — | 6 (incl. S6 ★) |
| F · Flows, positioning & demand | 16 | — | 1 (F1) | 12 (F2–F8 · F11–F13 · F15 · F16) | 3 (F9 · F10 · F14) | — | — | 13 |
| X · Cross-asset relative value | 7 | — | 1 (X1) | 2 (X5 · X7) | — | 3 (X2 · X3 · X4) | — | 3 |
| G · Fiscal & sovereign | 7 | — | — | 2 (G1 · G3) | 1 (G7) | 4 (G2 · G4 · G5 · G6) | — | 3 (incl. G4 ★) |
| H · Supply | 4 | — | — | 4 (H1–H4) | — | — | — | 4 |
| M · Meta (non-voting) | 4 | — | — | — | 1 (M2) | 1 (M1) | 2 (M3 · M4) | 0 |
| **Total** | **86** | **9** | **7** | **36** | **10** | **18** | **3** | **47** |

### 2.2 The COVERED core — 9 rows (the meter's honest heart)

Each with a wiring citation AND a fire-history (the COVERED bar, 01 §6).
The ninth — N-A1 — joined at the v1.2 amendment (2026-11-05, the owner's
recorded answer G): the `euro-hicp` voter was always healthy and
wiring-complete; the row it maps to is the amendment's own record.

- **R1 · US 10y real yield** — `real-yield-10y` votes with BOTH legs
  (move 0.1 pts + level; base 2,497; 18/19 recorded days) and FIRES on
  the fresh wire (supports via the falling move); us10y/us30y ride
  beside it as belt-and-braces nominal proxies (D-9/D-10
  accept-with-note — legal because the real object is healthy).
- **R5 · Policy rate** — `fed-target` votes, the level-led claim; base
  3,649, 18/19 days; honestly steady mid-band today (pct 0.676).
- **R7 · Long-run breakeven (5y5y)** — `breakeven-5y5y` votes with both
  legs (threshold 0.1; base 2,495) and FIRES today (pressures via the
  falling move); the `breakeven-tilt` accent seat rides beside it (the
  D-5 promotion's recorded variant).
- **D1 · Dollar basket** — `dollar-basket` votes with BOTH legs
  (threshold 1.0 + level; base 2,555, 19/19 days; healed to y/y on the
  fresh wire).
- **I1 · US headline CPI YoY** — `us-cpi-yoy` votes (base 118 = a decade
  of monthlies; pct 18/19 days); the momentum complement is the displayed
  previous-release change (recorded, not a defect).
- **I2 · Core CPI / core PCE** — `us-pce-core-yoy` votes (base 119; pct
  10/10 present-days); the CPI-core twin stays context.
- **S1 · VIX** — `vix` votes (base 2,544, 18/19 days); the term-slope
  complement is a recorded absence.
- **S5 · Financial-stress composites** — `stress-stlfsi` + `nfci` vote
  (bases 521 = a decade of weeklies, 18/19 days); `ofr-fsi` rides as
  context — belt-and-braces.
- **N-A1 · Euro-area realised inflation (HICP)** — the v1.2 amendment's
  own row (2026-11-05, the owner's recorded answer G): `euro-hicp` votes
  (base 119 = a decade of monthlies, 18/19 recorded days, fires mid-band
  on the lean check) — the wiring was always complete; the row the
  checklist missed is now recorded (02's v1.1→v1.2 amendment record).

### 2.3 Every non-COVERED row (the 74 own-class rows + the 3 cross-lists, in full)

Class and reason as the matrix states them (citations: `w§1:<n>`/`w§2`
= wiring.md trace rows; `HD` = history-depths-2026-11-05.txt; `WS` =
wire-scan-2026-11-05.txt; `LC` = lean-check-2026-11-05.txt; `inv §2` =
inventory.md's derived-recipe table). Backlog column = §4's rank → phase. The ★ marks the 4 promote-worthy
CONTEXT-ONLY-BY-DESIGN rows (D5 · I7 · S6 · G4 — the recorded open owner
questions), counted inside their families' totals; the 3 cross-lists
(I5→R7 · I6→R8 · X6→I10) ride their primaries' fates and add no backlog
rows of their own.

**R. Real rates & policy**

| Row | Class | The gap, one line (cited) | Backlog |
|---|---|---|---|
| R2 · US 5y real yield | MISSING-FREE | no voter, no input; the free object is live (FRED DFII5, verified 2026-11-04/05) — the belly where policy bites first | #19 → GF-P3 |
| R3 · Front-end real yield (2y) | MISSING-PAID | the exact 2y real object exists only via paid swap decomposition (DFII2 404, verified); the free proxy routes are R2's fill and R6's nominal path | — (proxies carry it) |
| R4 · Real curve | PARTIAL | two seats exist and fire (bases 2,495) but the sign is fixed −1 where the classic is regime-dependent (D-7/D-8), they read the NOMINAL curve where the classic object is real (D-11/D-12), and the classic treatment is context/secondary — the meter votes it twice | #3 → GF-P1 (+ the real-curve half rides R2) |
| R6 · Market-implied policy path | PARTIAL | the row's own named derivation (`fed-expectations`) votes but the classic treatment is change-led and the seat is LEVEL-ONLY (D-2) — the priced-path MOVE is unvotable | #1 → GF-P1 |
| R8 · Spot breakevens | PARTIAL | `t5yie`/`breakeven-10y` are ingested (one feeds the tilt voter) but the row's own claim — the SPOT level's sign — has no voting expression; a spot-only rise moves the tilt the OPPOSITE way | #9 → GF-P2 |
| R9 · Term premium (10y) | MISSING-FREE | no voter or input reads the repo's own healthy card (THREEFYTP10, L0, live through 2026-10-30) — "the cheapest promotion candidate on the board" | #6 → GF-P2 |
| R10 · Foreign policy rates + gaps | PARTIAL | the ECB leg is healthy (base 3,649, 19/19 days) but the gap seat's percentile is INTERMITTENT (21 staged pts, base 20 < 30, pct 6/9 recorded days — D-6) and the BoJ/BoE legs never vote | #4 → GF-P1 |
| R11 · R-star / neutral rate | MISSING-FREE | no voter, no input; NY Fed HLW free, quarterly; the row's own treatment is context-only (the regime label) | #42 → GF-P4 |
| R12 · Negative-yielding debt | NOT-APPLICABLE | the row ITSELF records the candidacy (post-2022 the stock is ~0; "none free since ~2022, verified: no FRED series exists" — the era reason, not convenience) | — |
| R13 · TIPS liquidity / breakeven–swap basis | MISSING-PAID | the exact object (breakeven vs inflation SWAP) has no free series (verified); the repo's tilt (T5YIFR−T5YIE) has NO swap leg — it is R7's tilt, the honest correction of 02 R13's own "free proxy" note | — |
| R14 · JGB 10y / YCC regime | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment ("context; pairs with D4 and R10's Japan leg"); the card exists, never votes, its data reaches the meter through the R10 gap seat | — |

**D. The dollar**

| Row | Class | The gap | Backlog |
|---|---|---|---|
| D2 · Broad trade-weighted dollar | MISSING-FREE | no reading; FRED DTWEXBGS verified live (daily → 2026-10-30) — "the honest inverse" the classic caution wants (DXY is 57% euro) | #20 → GF-P3 |
| D3 · EUR/USD | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (cross-check / context); the basket (D1) carries the voting claim | — |
| D4 · USD/JPY | PARTIAL | the exact cross votes and FIRES today (pressures at its decade-high 0.946) but the classic treatment is "change emphasis" and the seat is level-only — the only pct-changeKind seat, its changeKind set up but unconsumed (D-3) | #2 → GF-P1 |
| D5 · USD share of world FX reserves | CONTEXT-ONLY-BY-DESIGN **(promote-worthy)** | the G-5 shadow design + the OPEN S6-M6.4 promotion question (OI-GA-3); the object is ingested (COFER SDMX, quarterly) and never votes | #13 → GF-P2 (owner question) |
| D6 · Gold in non-USD terms | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment is context; the family is partially expressed (XAU×AUD — exactly one live observation, a recorded wiring fact) and never votes | — |
| D7 · USD/CHF (haven cross) | MISSING-FREE | no reading; the free leg is ALREADY FETCHED (CHF is one of the six basket currencies, one Frankfurter fetch) — a derived-series add with zero new fetches | #23 → GF-P2 |
| D8 · EM devaluation episodes | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (event / extreme band; context); the EM-pressure card (`usdtry`) carries it as context | — |
| D9 · EME trade-weighted dollar | MISSING-FREE | no reading; FRED DTWEXEMEGS verified live (→ 2026-10-30) — the EM-heavy marginal-buyer leg (gold demand is EM-heavy) | #21 → GF-P3 |

**I. Inflation & purchasing power**

| Row | Class | The gap | Backlog |
|---|---|---|---|
| I3 · Michigan 1y expectations | MISSING-FREE | the free object is INGESTED but rendered as a companion line inside the `michigan-sentiment` card that never votes (w§2); the classic claim is voting-class ("households pricing inflation in BEFORE the market does") | #16 → GF-P2 |
| I4 · Michigan 5–10y expectations | MISSING-FREE | no series; the free source is the UoM SIE portal (a download, not a feed — FRED carries no 5–10y series, verified); the long-run household anchor, "the slow version of R7" | #32 → GF-P3 |
| I5 · Market long-run expectations | cross-listed → R7 | carries the primary's class (COVERED) | — |
| I6 · Spot breakevens | cross-listed → R8 | carries the primary's class (PARTIAL) | — |
| I7 · Money supply (M2) growth | CONTEXT-ONLY-BY-DESIGN **(promote-worthy)** | the row's own locked treatment ("YoY level; context-leaning") — but the fill design itself names "M2/Michigan-class inflation" as an expected GF-P2 promotion candidate | #14 → GF-P2 (owner question) |
| I8 · Inflation persistence | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (level; context-leaning); both cards (`median-cpi`, `sticky-cpi`) exist beside the inflation lane and never vote | — |
| I9 · Inflation surprises vs nowcasts | MISSING-FREE | no series; the free source is the Cleveland Fed nowcasting page (verified live) vs realised prints — an event/short-window derivation; the row's own treatment context-leaning | #33 → GF-P3 |
| I10 · Real gold price vs long-run range | MISSING-FREE | no reading — but BOTH legs are already on the wire (`gold-usd` + the CPI index feeding `us-cpi-yoy`): a zero-new-fetch derived context card (the Jastram valuation anchor) | #30 → GF-P4 |
| I11 · Global liquidity / CB aggregate | MISSING-FREE | the US legs (`walcl` · `reverse-repo` · `bank-reserves` · `tga` · `net-liquidity`) are ingested as context cards; the aggregate derivation is not built and the ECB/BoJ legs are absent (the row's treatment: YoY growth; context-leaning) | #34 → GF-P4 |

**S. Stress, risk & haven demand**

| Row | Class | The gap | Backlog |
|---|---|---|---|
| S2 · High-yield credit spread | MISSING-PAID | served keyless BUT carries the pre-approval licence class the repo's register fail-closes (LICENCES.md OD-5) AND a rolling ~3y served window (first obs 2023-11-06/07, verified) — ToS-thin for this repo; the free proxy (the S5 composites) ALREADY VOTES | — (OI-GA-5 note) |
| S3 · Investment-grade spread | MISSING-PAID | the same honest re-class (the same ICE BofA tag + 3y window); same voting proxy | — (OI-GA-5 note) |
| S4 · Excess bond premium (EBP) | MISSING-FREE | no voter or input reads the repo's own healthy card (Fed Board ebp_csv.csv, live 44,606 B); the classic claim is voting-class — "the de-trended risk-appetite signal the literature PREFERS to raw spreads"; the top promotion candidate | #7 → GF-P2 |
| S6 · Equity drawdown / breadth | CONTEXT-ONLY-BY-DESIGN **(promote-worthy)** | the G-5 shadow design + the OPEN S6-M6.4 question (OI-GA-3's second half); `sp500-breadth-ratio` is a shadow member that never votes | #17 → GF-P2 (owner question) |
| S7 · Geopolitical risk (GPR) | MISSING-FREE | the canonical objects are ingested (`gpr-*` ×10, L0, monthly + the daily 7d-MA variant — the repo's own rung-2 first-of-month ingest) and never vote; the classic claim is voting-class ("threats lead, acts confirm") | #11 → GF-P2 (which object — owner) |
| S8 · Policy uncertainty (EPU, TPU) | MISSING-FREE | the objects are ingested (`epu-us` + `tpu-us`, live) and never vote; the classic treatment is "level" — a voting-class read | #15 → GF-P2 |
| S9 · Bank stress / facility usage | MISSING-FREE | nothing ingested; the free object verified live (FRED DPCREDIT weekly → 2026-11-02) — the modern bank-run tell is absent from the data plane | #28 → GF-P3 |
| S10 · Repo-market stress | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (level; context); the derived SOFR−IORB card exists and never votes | — |
| S11 · EU sovereign stress | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (context-leaning); the derived OECD-mirror BTP–Bund card exists and never votes | — |
| S12 · EM sovereign stress (EMBI) | MISSING-PAID | the clean object is JPMorgan-paid (verified: no FRED series); the named free proxies are the S5 composites (voting) + D9/D8 (the fills above) | — (proxies carry it) |
| S13 · US household pessimism ★ v1.1 | MISSING-FREE | the Chicago Fed's named pessimism driver is already ingested as the FREE FEED object (UMCSENT, 887 pts 1952-12→2026-09, re-verified 2026-11-05) as a growth-health voter — its GOLD claim is unwired; promotion-class with a sign nuance: the growth rule reads bottom-quintile sentiment as growth-NEGATIVE, S13's claim reads pessimism as gold-POSITIVE | #10 → GF-P2 (owner polarity decision) |

**F. Flows, positioning & demand** — the family the meter least sees

| Row | Class | The gap | Backlog |
|---|---|---|---|
| F1 · CFTC net speculative length | PARTIAL | the exact object votes in form but CANNOT fire in the current corpus era: **1 staged point, percentile base 0, 0/9 archive days with either input** (HD §2/§3) — the level leg needs ~30 accumulated Saturdays before it can exist; on the fresh wire it reads `steady` — readable with NEITHER input (D-18, the fake-steady finding) | #5 → GF-P1 |
| F2 · CFTC gross long & short | MISSING-FREE | no reading; the free source is the SAME file already ingested (`deafut.txt` carries the gross legs) — an adapter-parse extension riding F1's backfill | #12 → GF-P2 |
| F3 · Gold ETF holdings & flows | MISSING-FREE | no reading; the clean free object is the WGC monthly ETF XLSX (verified live); the classic claim voting-class ("the Western investor bid, visible daily") | #24 → GF-P3 (OI-GA-4) |
| F4 · Central-bank net purchases | MISSING-FREE | no reading; the WGC GDT quarterly page verified live — "the 2022–2026 regime driver" | #25 → GF-P3 (OI-GA-4) |
| F5 · Total demand vs supply balance | MISSING-FREE | no reading; the row's own treatment is context (the annual balance frames everything else) | #35 → GF-P4 |
| F6 · Shanghai/Asia premium | MISSING-FREE | no reading; the free-first derivation legs ALL verified (SGE Au9999 UA-sensitive × gold-api XAU × Frankfurter USD/CNY) — "the classic scarcity tell" | #22 → GF-P3 |
| F7 · India premium/discount | MISSING-FREE | no reading; the import-parity legs free (Frankfurter INR; MCX delayed free-view); the row's own treatment context-leaning | #27 → GF-P3 |
| F8 · COMEX warehouse stocks | MISSING-FREE | no reading; CME published reports free-view but automation-hostile (403 from this venue); the repo's Node-venue fetch pattern (the auctions precedent) is the recorded route; the row's own treatment context | #36 → GF-P4 |
| F9 · Lease rates / forward rates | MISSING-PAID | no free successor series exists (GOFO died 2015; the benchmarks paid/thin — verified); the proxy route is the owner's EODHD key (OI-GA-5) or CME free-view | — (OI-GA-5) |
| F10 · Futures term structure | MISSING-PAID | the row's primary named source is EODHD (OI-GA-5) with CME delayed free-view beside it; the row's own treatment context | — (OI-GA-5) |
| F11 · Retail coin & small-bar demand | MISSING-FREE | no reading; usmint.gov free but venue-blocked (403, recorded), WGC's free monthly republication the named fallback — "the retail fear gauge" | #37 → GF-P4 |
| F12 · ETF short interest / GLD volume | MISSING-FREE | no reading; the honest source class is "free-ish (fund pages)" — scrape-class, the lowest availability that still clears free; the v1 pruning note recorded it context | #43 → GF-P4 |
| F13 · Official-sector monthly purchases ★ v1 | MISSING-FREE | no reading; the free official sources named (PBoC/SAFE monthly gold-reserve tables + CBR) — the monthly-resolution twin of F4 | #26 → GF-P3 (OI-GA-4) |
| F14 · COMEX–LBMA EFP basis ★ v1 | MISSING-PAID | the clean EFP needs both a live futures leg (CME: 403) and the London price (bot-challenged); no free clean series; the free proxies = F8's drains + F6's premium direction | — |
| F15 · SGE monthly withdrawals ★ v1 | MISSING-FREE | no reading; SGE monthly statistics free (UA-sensitive, site verified) — the China physical-demand proxy | #38 → GF-P4 |
| F16 · Swiss gold net exports ★ v1.1 | MISSING-FREE | no reading; BAZG SwissImpex verified live 2026-11-05 (free/keyless, monthly by country 2012→) — the flow evidence behind the F6/F7 premium rows | #39 → GF-P4 |

**X. Cross-asset relative value**

| Row | Class | The gap | Backlog |
|---|---|---|---|
| X1 · Gold/silver ratio | PARTIAL | the exact object votes with the right sign (+1, "a high ratio IS the monetary-stress read") but the union base is THIN: 122 staged points, percentile base 119 (vs the ~250 bar), change30d 0/19 recorded days (the live leg was <30d old across the corpus record; both fields present on the fresh wires — the live tail aged past 30 days) | #29 → GF-P1 (the base deepening) |
| X2 · Gold/oil ratio | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (context); the derived card exists and never votes | — |
| X3 · Gold/copper | CONTEXT-ONLY-BY-DESIGN | the frozen curation comment itself (gold-score.ts:127-131: "copper-gold is already a ratio ABOUT gold") + the row's own locked treatment; the growth-health seat holds the GROWTH gauge's claim, not a gold claim | — |
| X4 · Gold/Bitcoin | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (context); the one-live-point object recorded as a wiring fact | — |
| X5 · Gold vs equities (GLD/SPY) | MISSING-FREE | no reading; the source free (Yahoo, L2 owner-accepted per the repo's register); the long-horizon rotation gauge | #41 → GF-P4 |
| X6 · Gold real price percentile | cross-listed → I10 | carries the primary's class (MISSING-FREE) | — |
| X7 · Gold/platinum ratio ★ v1.1 | MISSING-FREE | no ratio reading; both legs already sit in the repo's price-row family (`platinum` + `gold-usd`; gold-api XPT verified live beside XAU) — a zero-new-fetch derived add | #31 → GF-P4 |

**G. Fiscal & sovereign**

| Row | Class | The gap | Backlog |
|---|---|---|---|
| G1 · Federal deficit (% GDP, 12m) | MISSING-FREE | no voter, no input; the free object is INGESTED and healthy (FRED MTSDS133FMS, monthly; the repo's own `us-deficit-12m` derivation) — "fiscal dominance is the classic long-run gold narrative", a core-structural channel (04 §2 names D5/G1 structural) | #8 → GF-P2 |
| G2 · Net interest burden | CONTEXT-ONLY-BY-DESIGN | the recorded decision is verbatim in the code ("a fiscal-sustainability share whose gold signal is contested — high interest costs argue both ways", gold-score.ts:127-129) + the row's own context-leaning treatment | — (the owner may revisit) |
| G3 · Debt/GDP | MISSING-FREE | no reading; FRED GFDEGDQ188S verified live (quarterly → 2026-04-01) — the structural anchor, context treatment | #40 → GF-P4 |
| G4 · Foreign official Treasury holdings | CONTEXT-ONLY-BY-DESIGN **(promote-worthy)** | the row's own locked treatment (trend; context-leaning) — but the fill design names "COFER/TIC-class sovereign" as an expected GF-P2 candidate; `nyfed-custody` (WSEFINTL1, weekly) + the rung-3 TIC SLT fetch exist and never vote | #18 → GF-P2 (owner question) |
| G5 · Treasury auction demand | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (event-leaning; context); the four Node-venue auction cards exist and never vote | — |
| G6 · Debt-ceiling / shutdown risk | CONTEXT-ONLY-BY-DESIGN | the row's own locked treatment (context note; never a standing voter); if ever added it would be a copy note, never a series | — |
| G7 · US sovereign CDS (5y) | MISSING-PAID | paid (Markit); the named free proxy (T-bill dislocation around ceilings) is itself absent — the ceiling-window tell is carried only by G6's copy-class note | — (OI-GA-5) |

**H. Supply** — H1 mine production · H2 recycling · H3 jewellery +
technology fabrication · H4 producer hedging: all **MISSING-FREE**, no
reading for any; WGC GDT verified live (H1's secondary source USGS
venue-blocked 405, recorded); the family's own header: classically
context-only for a conditions meter — "no desk times the month's
direction off mine output". All four → GF-P4 context cards (#44–#47).

**M. Meta** — M1 gold's own price move: **CONTEXT-ONLY-BY-DESIGN** (the
circularity record D-GB-5: "counting a falling price as evidence of
falling is the exact defect removed. Context pill only.") · M2 gold
volatility (GVZ): **MISSING-PAID** ("context if ever free") · M3
seasonality: **NOT-APPLICABLE** ("Calendar, not a condition") · M4 the
two-factor residual: **NOT-APPLICABLE** ("An analytic device, not an
observable condition. Research-only.").

---

## 3. The half-implementation defects (18, with severity)

From `evidence/half-implementation.md` — the H1–H7 checks per voter.
Severity components per the matrix's fill column (04 §2: the same defects
seen from the row side; `—` = the accept-with-note rows on COVERED
seats, no fill proposed). **Treatments are proposals — the owner-gated
fill program executes.**

| # | Defect | H-check | Evidence (cited) | Severity (row) | Proposed treatment |
|---|---|---|---|---|---|
| **D-1** | **THE STRUCTURAL FINDING — 17 of 21 seats are LEVEL-LEG ONLY** | H1 | `SIGNAL_LEG_MOVE` defines thresholds for only 4 gold-lane ids (connections.ts:575-585: real-yield-10y 0.1 · us10y 0.15 · dollar-basket 1.0 · breakeven-5y5y 0.1), so for 17 seats `direction` stays `null` whatever change30d does and the ONLY fire path is the decade-extreme percentile — **a readable-but-typical seat reads `steady` by construction** | structural (no single row) | **accept-with-note pending the D-1 threshold question** — the GF-P0 calibration derives per-seat thresholds; the two seats whose classic treatment DEMANDS the move leg are D-2/D-3 |
| D-2 | `fed-expectations` — the change-led claim with no move leg | H1 | R6's treatment is "change + level vs decade range"; the seat is level-only (w§1:5), base 2,497 healthy | **27** (R6) | **repair** — a per-leg threshold for the fed-expectations gap (GF-P1) |
| D-3 | `usdjpy` — "change emphasis" with no move leg | H1 | D4's treatment is "change emphasis"; the only pct-changeKind seat, its changeKind unconsumed (w§1:10), base 2,555 | **27** (D4) | **repair** — a pct-units threshold (GF-P1) |
| D-4 | `cftc-gold-positioning` — the never-fires seat, numbered | H2 | 1 staged point, percentile base 0 (≥30 required), 0/9 archive days with either input; one weekly point per fetch — the level leg needs ~30 accumulated clean Saturdays | **27** (F1) | **repair** — the free CFTC historical-archive backfill + the extreme-based rule question (GF-P1) |
| D-5 | `gold-silver` — the thin union base | H2 | 122 points, base 119 vs the ~250 bar; change30d 0/19 recorded days (the live leg <30d old through the record; both fields present on the fresh wires) | **9** (X1; the live stress-lane seat argues for the repair — recorded) | **repair** — deepen the base with the free daily ratio history (Yahoo XAU=X/XAG=X-class, L2-accepted); the move leg self-heals as the live tail ages (GF-P1) |
| D-6 | `us-japan-10y-gap` — the intermittent percentile | H2 | 21 staged points, base 20 < 30; the reading-time join (run.ts:886-899) reaches a deep-enough base only sometimes — pct10y 6/9, change30d 1/9 recorded days | **27** (R10) | **repair** — persist the derived gap series' history instead of re-deriving at reading time (GF-P1) |
| D-7 | `yield-curve-10y2y` — the fixed polarity on a regime-dependent claim | H3 | the seat carries −1 ("steep = reflation; inverted = stress/easing ahead", gold-score.ts:164); 02 R4's claim is regime-dependent and the frozen spec itself recorded the polarity as ambiguous; the seat fires (base 2,495) — the defect is the SIGN's honesty | **27** (R4) | **re-seat** — the owner's sign decision, four options recorded (§5) |
| D-8 | `yield-curve-10y3m` — the same sign question at the 3m leg | H3 | same fixed −1 (gold-score.ts:165); the two seats vote together — one decision covers the pair | **27** (R4) | **re-seat** (with D-7) |
| D-9 | `us10y` — nominal where the classic is real | H4 | the 03 §4 example itself: belt-and-braces ONLY IF real-yield-10y is healthy — it IS (base 2,497, both legs, 18/19 days) | — (R1 COVERED) | **accept-with-note** (recorded; no fill while the real object carries the claim) |
| D-10 | `us30y` — nominal-vs-real, and level-only | H4 | same belt-and-braces footing + the us10y/us30y threshold asymmetry (the D-1 finding) | — (R1 COVERED) | **accept-with-note**; the threshold question may revisit the asymmetry |
| D-11 | `yield-curve-10y2y` — the nominal curve where the classic is real | H4 | R4's object is the REAL curve (DFII10−DFII5 in practice); the seat reads nominal T10Y2Y | 18 (riding R2) | **repair-if-filled** — the derived real curve becomes buildable the day R2's DFII5 is ingested (GF-P3); accept-with-note until then |
| D-12 | `yield-curve-10y3m` — the same granularity question | H4 | nominal T10Y3M vs the real-curve classic | 18 (riding R2) | **repair-if-filled** (with D-11) |
| D-13 | `us-japan-10y-gap` — the market gap vs the policy gap | H4 | R10's object is the policy-rate gap (DFF−BoJ-class); the seat reads the 10y MARKET gap — "the desk's carry gauge" | — (R10's fill carries it) | **accept-with-note**; the policy-gap complement rides the R10 fill |
| D-14 | `cftc-gold-positioning` — the F-family's only seat ANYWHERE | H5 | with `GOLD_LANE_MIN_FIRING = 2` the positioning claim can never tip the lane alone even once it learns to fire; the F-family (16 rows) holds exactly one voter, seated in market stress — **OI-GA-2's exact evidence** | **27** (F1) | **owner decision** — OI-GA-2 (a fifth lane, or a re-seat) |
| D-15 | `gold-silver` — the only X-family seat in stress | H5 | solo in its lane; can never tip stress alone (min-2); the lane is not fragile (S-family co-seats healthy) | 9 (X1) | **accept-with-note** (the D-5 repair is the actionable half) |
| D-16 | `us-japan-10y-gap` — the dollar lane's thin third seat | H5 | the only R-family seat in the dollar lane; co-fire-dependent AND intermittent (D-6) | **27** (R10) | the **D-6 repair** is the actionable half; accept-with-note on the lane composition (the R10 fill decides the gap family's second expression) |
| D-17 | `euro-hicp` — the inflation lane's solo euro leg | H5 | solo with NO locked taxonomy row behind it (finding N-1); the H5 fact rides whichever N-1 answer | — (N-1) | **owner decision** — N-1 (§5) |
| **D-18** | **`cftc-gold-positioning` — the fake-steady finding (the lean check's discovery)** | H6 | the never-fires seat does NOT read `unread` — it reads **`steady`**: its fresh warning-status value (46.99 % @ 2026-10-27) passes `readable()` (gold-balance.ts:127-129 — only stale/check-pending/unavailable never fire) while NEITHER evalLeg input exists, so the member line renders "steady — readable, honestly not firing" when the evaluator had nothing to evaluate; it will do so for ~30 weeks of clean Saturdays — **the exact false-confidence class D-GA-7 named** | **27** (F1) | **repair** — the D-4 backfill fixes the inputs; whether `readable()` should also require evalLeg-input presence is the **D-18 readable-rule question** for the owner (§5) |

**Verified honest (no defect):** the ecb-dfr hold — a failed fetch holds
value+asOf with status `stale` and drops both derived fields
(adapters/snapshot.ts:451-465), so the member reads `unread`, never a
fake steady (the designed degradation mechanism, WS + LC confirmed);
the real-yield cross-fill (the staleness degradation still applies, so
the fill cannot fake freshness); **H7 copy coherence — verified
coherent on all 21 lines** (the member line speaks only the evaluator's
own evidence words, MergedCard.tsx:187-195/220-224; the B-12 pin holds;
the breakeven-tilt dual-role quirk — a context-status card holding a
voting seat — recorded for the owner).

---

## 4. The gap backlog, RANKED (47 rows)

**The method (04 §2, fixed).** Each backlog row carries three
components, each 1–3, from the matrix's fill column: **W** classic
weight (3 core channel: R, D, S-primary, F-positioning, D5/G1
structural · 2 secondary · 1 context-leaning H/X family or context-only
treatment) · **A** availability (3 free/keyless daily–weekly, or already
ingested · 2 free but laggy/coarse/portal-scrape · 1 paid/ToS-thin) ·
**C** wiring cost (3 promotion of an ingested series, or a rule repair ·
2 new source + rung + voter · 1 new lane or engine-visible change).
**Severity = W × A × C** (max 27). **No backtest component — ever
(D-GA-2): the ranking is classic-literature importance × data
availability × wiring cost, never a forecasting claim.**

**The tie-break cascade (GA-S4's recorded application of "ties broken
toward cheaper wiring"):** (1) severity descending; (2) higher C first
(promotion/rule-repair before new-source); (3) repair before expand
(04 §3's ordering note — repair is cheaper than expand and re-baselines
the audit honestly), so GF-P1 items precede GF-P2 items inside a band;
(4) zero-new-fetch before new-fetch; (5) higher W.

**One arithmetic restatement, disclosed:** the matrix's §3 band-tally
line placed F6 in the 12-band, but F6's own fill cell states **3·3·2 =
18** (the components of record — W3 the "classic scarcity tell", A3 all
legs free/keyless, C2 the derived premium + seats). The ranking below
follows the per-row cells: **F6 ranks at 18**, in the 18-band. The class
(MISSING-FREE) and the fill (yes) are untouched — no re-classification.

| Rank | Row | Class | W·A·C | Severity | The gap (one line) | Named free source | Phase |
|---|---|---|---|---|---|---|---|
| 1 | **R6** | PARTIAL | 3·3·3 | **27** | the change-led policy-path claim with no move leg (D-2) | the object already on the wire (`fed-expectations`, DGS2-derived) | **GF-P1** |
| 2 | **D4** | PARTIAL | 3·3·3 | **27** | the "change emphasis" carry cross with the pct changeKind unconsumed (D-3) | the object already on the wire (`usdjpy`, Frankfurter) | **GF-P1** |
| 3 | **R4** | PARTIAL | 3·3·3 | **27** | the fixed −1 sign on the regime-dependent curve claim (D-7/D-8) + the nominal-vs-real curve (D-11/D-12) | sign: none needed; the real curve rides R2's DFII5 | **GF-P1** (+P3 half) |
| 4 | **R10** | PARTIAL | 3·3·3 | **27** | the intermittent gap-seat percentile (D-6) — persist the derived history | the objects already on the wire (DGS10 × jgbcme) | **GF-P1** |
| 5 | **F1** | PARTIAL | 3·3·3 | **27** | the never-fires seat: 1 point / base 0 / 0-of-9 days (D-4) + the fake-steady word (D-18) | the free CFTC historical archive (the same site's legacy COT history) | **GF-P1** |
| 6 | **R9** | MISSING-FREE | 3·3·3 | **27** | the term premium never votes — "the cheapest promotion candidate on the board" | FRED `THREEFYTP10` (already ingested as the card) | **GF-P2** |
| 7 | **S4** | MISSING-FREE | 3·3·3 | **27** | EBP never votes — the literature's PREFERRED risk-appetite signal | Fed Board `ebp_csv.csv` (already ingested as the card) | **GF-P2** |
| 8 | **G1** | MISSING-FREE | 3·3·3 | **27** | the deficit never votes — fiscal dominance, the classic long-run narrative | FRED `MTSDS133FMS` (already ingested as `us-deficit-12m`) | **GF-P2** |
| 9 | **R8** | PARTIAL | 3·3·3 | **27** | the spot breakevens' own claim has no voting expression (the tilt expresses the spread, not the level) | FRED `T5YIE` (already ingested as context) | **GF-P2** (owner-gated) |
| 10 | **S13** | MISSING-FREE | 3·3·3 | **27** | the Chicago Fed's pessimism driver unwired for gold (the polarity nuance recorded) | FRED `UMCSENT` (already ingested as `michigan-sentiment`) | **GF-P2** (owner polarity) |
| 11 | **S7** | MISSING-FREE | 3·3·3 | **27** | GPR ingested ×10 and never votes — the event-risk channel | the GPR export (already ingested; the object choice is the owner's) | **GF-P2** (owner) |
| 12 | **F2** | MISSING-FREE | 3·3·3 | **27** | the gross CFTC legs — richer than net — not parsed | the SAME `deafut.txt` already fetched (rides F1's backfill) | **GF-P2** |
| 13 | **D5** | COBD ★ | 3·2·3 | 18 | the dedollar shadow pair never votes (OI-GA-3 / S6-M6.4) | IMF COFER SDMX (already ingested, shadow member) | **GF-P2** (owner) |
| 14 | **I7** | COBD ★ | 2·3·3 | 18 | M2 ingested, never votes — the debasement channel (GF-P2's own named candidate) | FRED `M2SL` (already ingested as `m2-us`) | **GF-P2** (owner) |
| 15 | **S8** | MISSING-FREE | 2·3·3 | 18 | EPU/TPU ingested, never votes — the regime-uncertainty premium | the BBD workbooks (already ingested `epu-us`/`tpu-us`) | **GF-P2** |
| 16 | **I3** | MISSING-FREE | 2·3·3 | 18 | Michigan 1y is a companion line that never votes (a rule + card change) | FRED `MICH` (already ingested as the companion) | **GF-P2** (owner) |
| 17 | **S6** | COBD ★ | 2·3·3 | 18 | the breadth shadow member never votes (OI-GA-3's second half) | the repo's `sp500-breadth-ratio` (already ingested, shadow) | **GF-P2** (owner) |
| 18 | **G4** | COBD ★ | 2·3·3 | 18 | custody + TIC ingested/fetched, never votes — the foreign-financing retreat | FRED `WSEFINTL1` + TIC SLT (already in the repo) | **GF-P2** (owner) |
| 19 | **R2** | MISSING-FREE | 3·3·2 | 18 | no 5y real yield — the belly where policy bites first; unlocks D-11/D-12's real curve | FRED `DFII5` (live, verified; not yet ingested) | **GF-P3** |
| 20 | **D2** | MISSING-FREE | 3·3·2 | 18 | no trade-weighted dollar — "the honest inverse" | FRED `DTWEXBGS` (live; not yet ingested) | **GF-P3** |
| 21 | **D9** | MISSING-FREE | 3·3·2 | 18 | no EME dollar — the marginal buyer's leg | FRED `DTWEXEMEGS` (live; not yet ingested) | **GF-P3** |
| 22 | **F6** | MISSING-FREE | 3·3·2 | 18 | no Shanghai premium — "the classic scarcity tell" | SGE Au9999 × gold-api XAU × Frankfurter USD/CNY (all live) | **GF-P3** |
| 23 | **D7** | MISSING-FREE | 2·3·2 | 12 | no USD/CHF — the haven pair's other leg; zero new fetches (CHF already in the basket fetch) | Frankfurter CHF leg (already fetched) | **GF-P2** |
| 24 | **F3** | MISSING-FREE | 3·2·2 | 12 | no ETF holdings/flows — the Western investor bid (OI-GA-4) | WGC monthly ETF XLSX (live) | **GF-P3** |
| 25 | **F4** | MISSING-FREE | 3·2·2 | 12 | no central-bank purchases — "the 2022–2026 regime driver" (OI-GA-4) | WGC GDT quarterly (live) | **GF-P3** |
| 26 | **F13** | MISSING-FREE | 3·2·2 | 12 | no official-sector monthly purchases — F4's monthly twin (OI-GA-4) | PBoC/SAFE tables + CBR (free official sites) | **GF-P3** |
| 27 | **F7** | MISSING-FREE | 2·3·2 | 12 | no India premium — the secondary physical bid | Frankfurter INR + MCX delayed free-view | **GF-P3** |
| 28 | **S9** | MISSING-FREE | 2·3·2 | 12 | no bank-facility usage — the modern bank-run tell, absent from the data plane | FRED `DPCREDIT` (live, weekly) | **GF-P3** |
| 29 | **X1** | PARTIAL | 1·3·3 | 9 | the thin union base (122/119) behind a live stress-lane seat (D-5) | the free daily ratio history (Yahoo XAU=X/XAG=X-class, L2-accepted) | **GF-P1** |
| 30 | **I10** | MISSING-FREE | 1·3·3 | 9 | no real-gold-price card — the Jastram valuation anchor; both legs already on the wire | derived: `gold-usd` ÷ the CPI index | **GF-P4** |
| 31 | **X7** | MISSING-FREE | 1·3·3 | 9 | no gold/platinum ratio — the second precious-bloc ratio; both legs already on the wire | derived: `gold-usd` ÷ `platinum` | **GF-P4** |
| 32 | **I4** | MISSING-FREE | 2·2·2 | 8 | no 5–10y household anchor — "the slow version of R7" | UoM SIE portal (free download, no API) | **GF-P3** |
| 33 | **I9** | MISSING-FREE | 2·2·2 | 8 | no inflation-surprise object (Cleveland nowcasts vs realised) | Cleveland Fed nowcasting page (live) | **GF-P3** |
| 34 | **I11** | MISSING-FREE | 2·2·2 | 8 | no global-liquidity aggregate (US legs ingested; ECB/BoJ legs absent) | FRED `WALCL` + ECB + BoJ (free legs) | **GF-P4** |
| 35 | **F5** | MISSING-FREE | 2·2·2 | 8 | no demand/supply balance card (the annual frame) | WGC GDT (live) | **GF-P4** |
| 36 | **F8** | MISSING-FREE | 2·2·2 | 8 | no COMEX warehouse stocks (deliverable-stock drains) | CME published reports (Node-venue fetch — the auctions precedent) | **GF-P4** |
| 37 | **F11** | MISSING-FREE | 2·2·2 | 8 | no retail coin/bar demand — "the retail fear gauge" | usmint.gov (venue-blocked 403) / WGC monthly republishing | **GF-P4** |
| 38 | **F15** | MISSING-FREE | 2·2·2 | 8 | no SGE withdrawals — the China physical proxy | SGE monthly statistics (UA-sensitive, verified live) | **GF-P4** |
| 39 | **F16** | MISSING-FREE | 2·2·2 | 8 | no Swiss flow read — the evidence behind F6/F7 | BAZG SwissImpex (verified live 2026-11-05) | **GF-P4** |
| 40 | **G3** | MISSING-FREE | 2·2·2 | 8 | no debt/GDP card — the structural anchor | FRED `GFDEGDQ188S` (live, quarterly) | **GF-P4** |
| 41 | **X5** | MISSING-FREE | 1·3·2 | 6 | no gold-vs-equities rotation gauge | Yahoo GLD/SPY (L2 owner-accepted) | **GF-P4** |
| 42 | **R11** | MISSING-FREE | 1·2·2 | 4 | no r-star — the regime label (context-only by treatment) | NY Fed HLW (quarterly xlsx, live) | **GF-P4** |
| 43 | **F12** | MISSING-FREE | 2·1·2 | 4 | no ETF short interest — the squeeze-tell complement | fund pages (free-ish, scrape-class) | **GF-P4** |
| 44 | **H1** | MISSING-FREE | 1·2·2 | 4 | no mine-production card | WGC GDT (+ USGS, venue-blocked 405) | **GF-P4** |
| 45 | **H2** | MISSING-FREE | 1·2·2 | 4 | no recycling card | WGC GDT | **GF-P4** |
| 46 | **H3** | MISSING-FREE | 1·2·2 | 4 | no fabrication card (the elasticity lives here) | WGC GDT | **GF-P4** |
| 47 | **H4** | MISSING-FREE | 1·2·2 | 4 | no producer-hedging card | WGC GDT | **GF-P4** |

**The bands, restated:** 27 ×12 (R4 · R6 · R8 · R9 · R10 · D4 · S4 ·
S7 · S13 · F1 · F2 · G1 — every one a core-channel claim with the data
in hand) · 18 ×10 (D5 · I7 · S8 · I3 · S6 · G4 · R2 · D2 · D9 · F6) ·
12 ×6 (D7 · F3 · F4 · F13 · F7 · S9) · 9 ×3 (X1 · I10 · X7) · 8 ×9
(I4 · I9 · I11 · F5 · F8 · F11 · F15 · F16 · G3) · 6 ×1 (X5) · 4 ×6
(R11 · F12 · H1–H4). **Every one of the 27-band is a promotion, a rule
repair, or a sign decision — zero new daily sources in the top band.**
The cheapest 12 wins on the board (ranks 1–12) would move the COVERED
share from 9/86 (8/85 pre-amendment) to at most 21/86 — eleven of them
with zero new fetches, the twelfth (F1) with a free backfill from the
historical archive of the site the repo already ingests. That is the
arithmetic the owner's promotion decisions (§5) actually buy.

---

## 5. The owner's decision list

GA-S4 PROPOSES; the owner decides. Nothing below executes in the audit —
every item opens (or closes) a gate in the fill program. Status:
**recorded-open** unless noted.

| # | The decision | The evidence (cited) | The audit's recommendation |
|---|---|---|---|
| **OI-GA-2** | **A fifth lane — flows & demand?** | D-14: the F-family (16 rows) holds exactly one voter anywhere (`cftc-gold-positioning`), seated in market stress where it can never tip the lane alone (min-2) — and it cannot even fire (D-4). The family's only voting expression is one dead, solo seat; 13 of its rows are in the backlog | **Add a flows & demand lane** in GF-P0 — the calibration re-derives the lane rule with the F-family seated (F1+F2 after the backfill; the F3/F4/F6/F13 fills join as they land). The alternative (fold into 4 lanes) leaves a 16-row classic family structurally muted — exactly the "missed" the owner asked the audit to prevent |
| **OI-GA-3** | **The S6-M6.4 shadow promotion** (D5 `usd-reserve-share` + S6 `sp500-breadth-ratio` — the dedollar shadow pair) | The G-5 shadow design recorded "never votes until the S6-M6.4 promotion decision"; both objects are ingested and healthy; D5 carries structural weight (severity 18, W=3) | **Fold into GF-P2 as two owner-gated promotion questions** (ranks 13 and 17). The audit recommends promoting D5 (the reserve-share trend is the classic long-run channel) and deciding S6 with the calibration evidence in hand (breadth is context-leaning by its own row) |
| **OI-GA-4** | **WGC quarterly: voters or context-first?** (F3 · F4 · F5 · F13 · F15 · F16 · H1–H4) | All are free but quarterly/monthly with lag; the rows' own treatments are context or "context-voter debate"; a quarterly series under a daily meter fires rarely and coarsely (the monthly three's cadence semantics are the in-repo precedent) | **Context-first** (the classic answer — they set the structural regime, not the month's direction), with recorded promotion criteria (e.g. annualised-level extreme bands) revisit-able after the cards exist. The owner calls; GF-P3/P4 wire whichever reading is chosen |
| **OI-GA-5** | **EODHD per-item policy** (F9 · F10 · S2 · S3 · G7) | Each is MISSING-PAID with the free proxies named (S5 carries S2/S3; F8+F6 carry F9/F10's proxies; G6's copy note carries G7). Free-first is D-GA-5; the repo's register fail-closes the ICE BofA class (OD-5) | **No EODHD use proposed by the audit** — the free proxies already carry these channels; any per-item EODHD use needs the owner's recorded approval and its own licence row. Flagged, not seeded |
| **OI-GA-6** | **The copy rounds for any new context line** | Any new card/context line gets fresh EN + fa copy (round 79+ in the persian-copy manifest); GF-P4's gate already carries `copy:audit` clean | **Accepted as standing** — no decision needed beyond the round numbering when GF-P4 runs |
| **N-1 (new)** | **`euro-hicp` UNCLASSICATED: amend the taxonomy or re-seat the voter?** | The locked checklist holds NO euro-area realised-inflation row (the I-family is US-centric; R10 is foreign policy rates; I11 the global liquidity aggregate — verified by walking all 85). The voter is wiring-complete and healthy (base 119, monthly semantics, fires mid-band); its claim — euro-area realised inflation as a hedge-demand channel — is classic desk practice (the 2022–24 European retail gold demand episode) | **AMEND** (the audit's recommendation): record a euro-area realised-inflation row in 02 as an owner-recorded amendment with its date (D-GA-1) — the denominator becomes 86 and the arithmetic restates downstream (rows classified = 86; the COVERED share 8/86). The alternative — re-seat/remove — would strike a healthy, wiring-complete voter and reduce coverage; the audit finds no classic-literature basis for calling euro realised inflation non-classic. **RESOLVED at GF-P2 (2026-11-05, the owner's recorded answer G — the GF-S7 answer sheet): the v1.2 amendment EXECUTED** — the N-A1 row recorded (02's amendment record), `euro-hicp` maps to it, the denominator 86 restated in this report's header arithmetic and headline |
| **The D-7/D-8 sign decision** | **The yield-curve polarity** (four recorded options) | The fixed −1 on a regime-dependent claim ("a steepening-from-inversion marks an easing cycle, historically gold's BEST regime; not a standalone direction bet" — 02 R4); the frozen spec itself recorded the polarity as ambiguous; the meter votes the row TWICE | **(b) the context demotion** — per R4's own locked treatment ("context / secondary"): at most one seat, or none, with the curve moving to a context card. Minimal-change fallback: **(d) accept-with-note**. Option (a) (the regime-conditional event rule) and option (c) (the polarity flip) are recorded but not recommended — (a) is an event-detector the evaluator has no vocabulary for, (c) accepts the reflation reading as headwind against the row's own text. The real-curve derivation (riding R2, GF-P3) re-opens the question with the correct object in hand |
| **The D-18 readable-rule question** | **Should `readable()` require evalLeg-input presence?** (an inputless-but-fresh seat reading `unread`, not `steady`) | D-18: cftc reads `steady` with NEITHER input — its fresh warning-status value passes `readable()` (gold-balance.ts:127-129) while the evaluator had nothing to evaluate; the word renders "readable, honestly not firing" — false confidence for ~30 weeks | **Adopt the input-presence rule** in the fill program (a harness-visible rule nuance, owner-gated, proposed — never silent): a seat with neither evalLeg input reads `unread`. The D-4 backfill fixes the only current instance regardless; the rule prevents the class, not just the instance |
| **The D-1 threshold question** | **Which of the 17 level-only seats deserve move thresholds?** | connections.ts:575-585 defines thresholds for 4 ids only; 17 seats' only fire path is the decade-extreme percentile; the lean check proves level-only seats DO fire at the bands (3 fired today) — the question is which classic treatments are change-led | **Derive, don't assume**: the GF-P0 calibration walks the 17 seats against their 02 treatments and proposes thresholds only where the treatment is change-led. The audit names two on the evidence (already repair items): fed-expectations (D-2) and usdjpy (D-3); the monthly three are cadence-exempt (previous-release semantics); the rest accept-with-note pending the calibration |
| **The per-row promotion go/no-go** — the 12 zero-new-fetch class | R9 · I3 · I10 · S4 · S7 · S8 · S13 · G1 · X7 · F2 · D7 · I11 | Each is an ingested object or an on-the-wire derivation away from a seat/card — the cheapest 12 wins on the board (see §4) | Per row: **R9 PROMOTE** (the priced fiscal/inflation-risk channel; the card is healthy) · **I3 PROMOTE** (voting-class claim; needs the companion promoted to its own card) · **I10 CONTEXT ADD** (the Jastram anchor, treatment context-only) · **S4 PROMOTE** (the top promotion candidate — the literature's preferred risk-appetite signal) · **S7 PROMOTE** (the object choice is the owner's — the daily 7d-MA variant is the desk's everyday object, already ingested) · **S8 PROMOTE** (a voting-class level read) · **S13 PROMOTE** (with the polarity decision — pessimism is gold-POSITIVE under S13's claim) · **G1 PROMOTE** (the classic long-run narrative, core structural) · **X7 CONTEXT ADD** (GF-P4's expected class) · **F2 PROMOTE** (riding F1's backfill) · **D7 SEAT OR CONTEXT** (the audit leans a context card per the row's own context-leaning treatment; a seat is defensible as the haven pair's other leg — the owner calls) · **I11 CONTEXT ADD first** (the aggregate + the ECB/BoJ legs; promotion revisit-able once the card exists) |

---

## 6. The fill program (the design, made concrete)

**Name: the gold meter gap-fill program.** Home:
`docs/specs/gold-meter-gapfill/` (created by its first session, GF-S1).
Sessions `GF-S1..`, each ending with the next prompt (the D-GA-9
convention handed over). **The beam formula, the honesty rules and the
no-edge record are inherited unchanged; the min-2 lane rule is
re-derived, not assumed.** The program executes only on the owner's
recorded go, phase by phase.

### 6.1 The phases, loaded with the ranked backlog

| Phase | Content (04 §3, loaded with §4's ranks) | Gate |
|---|---|---|
| **GF-P0 — recalibration pre-registration** | The proposed voter set (post-fill) added to the read-only harness as **new tables beside the frozen ones** — no product code; the lane rule (min-firing) re-derived per the GB-S1 protocol (the C1/C2 criteria); **the lane count decided (OI-GA-2)**; **the D-1 threshold calibration proposal** (§5); the proposed set assembled from the owner's recorded decisions (undecided items default to the current seating — no silent changes) | The calibration report updated; **the owner's recorded go on the proposed voter set** |
| **GF-P1 — repairs** (ranks 1–5, 29) | **R6** the fed-expectations threshold (D-2) · **D4** the usdjpy pct threshold (D-3) · **R4** the yield-curve sign execution (D-7/D-8, once the owner records the choice) · **R10** the gap-series persistence (D-6) · **F1** the CFTC archive backfill + the extreme-based rule question (D-4) + the D-18 readable-rule fix · **X1** the gold-silver base deepening (D-5); plus the **repair-if-filled D-11/D-12** (the derived real curve) executing beside **R2's fill** in GF-P3 | Tests green; the meter's honesty tests re-run; PR merged |
| **GF-P2 — promotions** (ranks 6–18, 23) | The zero-new-fetch voting promotions: **R9 · S4 · G1 · R8 · S13 · S7 · F2 · S8 · I3 · D7** — plus the promote-worthy COBD questions: **D5 · I7 · S6 · G4** (OI-GA-3's territory). Every seat change individually owner-gated with the matrix row as its justification | The owner's recorded go per lane change; recalibration re-run if the set changed materially |
| **GF-P3 — new free sources** (ranks 19–22, 24–28, 32–33) | **R2** DFII5 (unlocks D-11/D-12) · **D2** DTWEXBGS · **D9** DTWEXEMEGS · **F6** the Shanghai premium derivation · **F3/F4/F13** the WGC/official flows (per OI-GA-4's answer) · **F7** the India parity · **S9** DPCREDIT · **I4** the UoM portal · **I9** the nowcast-surprise derivation. Each with its licence row, rung, staleness window | Licences documented (L0/L1 rules); gates green; deploy when the worker changes |
| **GF-P4 — context additions** (ranks 30–31, 34–47) | The context winners with EN+fa copy (round 79+): **I10** the real gold price · **X7** gold/platinum · **I11** global liquidity · **F5 · F8 · F11 · F15 · F16** the flows/supply context cards · **G3** debt/GDP · **X5** gold-vs-equities · **R11** r-star · **F12** · **H1–H4** | `copy:audit` clean |
| **GF-P5 — acceptance + flip** | The full acceptance walk (the GB 04 §6 precedent, re-written for this change set); the production matrix; nothing user-visible ships without the owner's recorded go, staged on a branch, per the P5 precedent | AC table green; deploy verified |

**Ordering:** P1 before P2/P3 (repair is cheaper than expand and
re-baselines the audit honestly); **P0 wraps around every voter-set
change** — no new voter counts before the recalibration re-runs. GF
sessions may compress phases exactly as GB sessions did (the PROGRESS
record is authoritative).

### 6.2 The standing constraints (04 §4, restated)

- **The per-seat approval rule** (D-GB-9 as amended at GB-S7): every
  `gold-score.ts` edit requires the owner's recorded approval **per seat
  change** — this report's §4 row is the justification attached to each
  approval.
- The `?balance=lanes` parameter is inert; no preview-flag mechanism
  exists post-flip — any user-visible change ships behind the owner's
  recorded go, staged on a branch, per the P5 precedent.
- Full `pnpm gates` green before every push; branch + PR per phase; CI
  green verified on main; deploy only when the built worker changes.
- **No forecasting claim accompanies any addition** — copy says
  "conditions", the measured note + backtest link stay visible (AC-8
  lineage).
- Every number in any fill-program report or PROGRESS comes from a run
  (01 §4.3 lineage).

### 6.3 The end state (04 §5)

When the fill program closes, the meter reads over a voter set that
**(a)** covers every classic family the owner locked in 02 v1 (every
row COVERED, PARTIAL-repaired, CONTEXT-ONLY-BY-DESIGN on record, or
MISSING with the owner's recorded accept), **(b)** contains no
half-implemented seat (every D-1..D-18 defect repaired or
accepted-on-record), and **(c)** still claims nothing about the future.
That is the owner's instruction, delivered: *nothing missed, nothing
half-implemented.*

---

## 7. The honesty footer

This report measures **coverage and honesty of the classic condition
set — nothing else** (01 §4.1, D-GA-2). No claim anywhere in it, in the
ranked backlog, in the severity components, or in the fill program
asserts or implies predictive power for any existing or proposed voter;
the standing no-edge record (GOLD_BACKTEST_SPEC §5) stays operative.
The severity ranking is classic-literature importance × data
availability × wiring cost — never a backtest of proposed voters. The
fill program adds **coverage of the classic condition set, nothing
more**: the meter's meaning stays "conditions today" (D-GB-7). Every
number above comes from the committed evidence files and runs
(`coverage-matrix.md` · `half-implementation.md` · `wiring.md` ·
`inventory.md` · `history-depths-2026-11-05.txt` ·
`wire-scan-2026-11-04/-05.txt` · `lean-check-2026-11-05.txt`), each
produced by a script in `packages/insights/scripts/` and reproducible
from the repo. The audit edited no meter code and deployed nothing
(D-GA-3); the fill program executes only on the owner's recorded go.

*The audit program: GA-S1 (the taxonomy, locked v1.1 = 85 rows) · GA-S2
+ GA-S2-completion (the inventory + wiring pack) · GA-S3 (the matrix +
the defects) · GA-S4 (this report + the fill design). Closed 2026-11-05
— the record: `docs/specs/gold-meter-audit/PROGRESS.md`.*
