# GA-S3 evidence — the half-implementation audit (A3's second half, 03 §4)

**Status: delivered 2026-11-05 by the GA-S3 session, against the LOCKED
denominator** (02 v1.1 = 85 rows) and the GA-S2 evidence pack
(`inventory.md` §5 — the voters table; `wiring.md` — the 21 traces + the
63 context traces + the five findings; `history-depths-2026-11-05.txt` —
the depths; `wire-scan-2026-11-05.txt` — the day states; and this
session's `lean-check-2026-11-05.txt` — the `ga-s3-lean-check.sh` run, the
per-seat lean check replicating read-only the exact client-side
computation at MergedCard.tsx:113). The
classification that interprets these defects lives in
`evidence/coverage-matrix.md`.

**Method (03 §4).** For each of the 21 voters, the seven H-questions below;
**every `yes` is worded as a defect row with evidence and a proposed
fill-program treatment** (repair / promote / re-seat / accept-with-note —
the treatments are proposals for the owner-gated fill program; this session
changes nothing, D-GA-3). Citations: `w§1:<n>` = wiring.md §1 trace row n ·
`HD` = the committed `ga-s2-history-depths.sh` run (re-run this session:
identical) · `WS` = the committed `ga-s2-wire-scan.sh` run (re-run this
session: byte-identical — the same 20:10-UTC snapshot served) · `LC` =
the committed `ga-s3-lean-check.sh` run this session (per-seat leans on
the fresh wire: **6 seats fire** — 2 move-leg · 4 level-leg; the other 14
readable seats honestly `steady`, ecb-dfr `unread`, and **all four lanes
read `neutral` today**, borrowing-costs a 2/2 split) · code cites
are `path:line`, re-read this session. The one non-H defect —
`euro-hicp`'s UNCLASSICATED mapping flag — is recorded in the matrix
(§1 there, finding N-1) and cross-referenced here; it is a
taxonomy-coverage defect, not a half-implementation.

## The H-questions (03 §4, verbatim shorthand)

| # | Check |
|---|---|
| H1 | Cadence fit — does the cadence give evalLeg's 30-day-move rule enough points, or does the voter sit `steady` by construction? |
| H2 | History depth — does the decade-extreme percentile have ≥ ~250 points behind it? |
| H3 | Sign vs classic — does the seat's polarity match 02's classic claim? |
| H4 | Granularity — the classic object or a proxy of it? |
| H5 | Solo-muting — the only voter of its classic family in its lane (min-2 rule)? |
| H6 | Degradation — honest `unread` on staleness, no fake steady? |
| H7 | Copy coherence — the member line states the claim without overclaiming? |

## §1 The per-voter verdict table (21 × H1–H7)

`✓` = no defect · `✗ D-n` = defect row D-n in §2 · `n D-n` = no per-voter
defect, but the shared finding D-n applies (recorded). Depth and
archive-day numbers: HD §2/§3. Day states: WS §2 (the 2026-11-04/05 wires
— both evalLeg inputs present unless noted).

| voter | H1 | H2 | H3 | H4 | H5 | H6 | H7 |
|---|---|---|---|---|---|---|---|
| real-yield-10y | ✓ (move 0.1 + level) | ✓ 2,497 | ✓ (R1 −) | ✓ the exact object | ✓ | ✓ + n (the cross-fill) | ✓ |
| us10y | ✓ (move 0.15 + level) | ✓ 2,497 | ✓ (R1 − via the nominal proxy) | ✗ D-9 (nominal-vs-real) | ✓ | ✓ | ✓ |
| us30y | n D-1 (level-only) | ✓ 2,497 | ✓ (R1 − via the nominal proxy) | ✗ D-10 (nominal-vs-real) | ✓ | ✓ | ✓ |
| fed-target | n D-1 + n (the step note, §3.3) | ✓ 3,649 | ✓ (R5 −) | ✓ the exact object | ✓ | ✓ | ✓ |
| fed-expectations | ✗ D-1+D-2 (change-led claim, no threshold) | ✓ 2,497 | ✓ (R6 −) | ✓ the row's own derivation | ✓ | ✓ | ✓ |
| ecb-dfr | n D-1 (level-only) | ✓ 3,649, 19/19 d | ✓ (R10 −) | ✓ the exact object | ✓ | ✓ + n (the hold — verified honest, §3) | ✓ |
| yield-curve-10y2y | n D-1 (level-only) | ✓ 2,495 | ✗ D-7 (R4 regime-dependent vs fixed −1) | ✗ D-11 (nominal curve vs real curve) | ✓ (the pair votes together) | ✓ | ✓ |
| yield-curve-10y3m | n D-1 (level-only) | ✓ 2,495 (9/9 present-days) | ✗ D-8 (same sign question) | ✗ D-12 (same granularity) | ✓ | ✓ | ✓ |
| dollar-basket | ✓ (move 1.0 + level) | ✓ 2,555, 19/19 d | ✓ (D1 −) | ✓ the row's exact object (DXY-class; the trade-weighted complement is D2's own row) | ✓ | ✓ | ✓ |
| usdjpy | ✗ D-1+D-3 ("change emphasis", no threshold — the pct changeKind unconsumed) | ✓ 2,555, 19/19 d | ✓ (D4 −) | ✓ the exact object | ✓ (dollar-basket beside it) | ✓ | ✓ |
| us-japan-10y-gap | n D-1 (level-only) | ✗ D-6 (base 20, intermittent pct 6/9 d) | ✓ (R10 −: wide gap = dollar-positive = headwind) | ✗ D-13 (the 10y market gap vs R10's policy-gap object) | ✗ D-16 (the only R-family seat in the dollar lane) | ✓ | ✓ |
| stress-stlfsi | n D-1 (level-only) | ✓ 521, 18/19 d | ✓ (S5 +) | ✓ the exact object | ✓ (nfci beside it) | ✓ | ✓ |
| nfci | n D-1 (level-only) | ✓ 521, 18/19 d | ✓ (S5 +) | ✓ the exact object | ✓ (stlfsi beside it) | ✓ | ✓ |
| vix | n D-1 (level-only) | ✓ 2,544, 18/19 d | ✓ (S1 +) | ✓ the exact object | ✓ | ✓ | ✓ |
| gold-silver | n D-1 (level-only) | ✗ D-5 (base 119, ch30d 0/19 recorded days) | ✓ (X1 +) | ✓ the exact object | ✗ D-15 (the only X-family seat in stress) | ✓ | ✓ |
| cftc-gold-positioning | n D-1 + n (weekly, one point per fetch, §3.6) | ✗ D-4 (1 pt, base 0, 0/9 d) | ✓ (F1 − contrarian-at-extremes; the level leg expresses it) | ✓ the exact object (net non-comm share of OI) | ✗ D-14 (the F-family's only seat ANYWHERE) | ✗ D-18 (reads `steady`, not `unread` — the fake-steady finding) | n D-18 (the member line says "steady" for an inputless seat) |
| us-cpi-yoy | n D-1 + n (monthly, previous-release change, §3.1) | n (118 = a decade of monthlies, §3.2) | ✓ (I1 +) | ✓ the exact object | ✓ (PCE beside it) | ✓ | ✓ |
| us-pce-core-yoy | n D-1 + n (monthly, §3.1) | n (119, §3.2) | ✓ (I2 +) | ✓ the exact object | ✓ (CPI beside it) | ✓ | ✓ |
| euro-hicp | n D-1 + n (monthly, §3.1) | n (119, §3.2) | **UNCLASSICATED** (the matrix's N-1 — no locked row to check against; the owner decides) | — (same flag) | ✗ D-17 (solo euro leg in the inflation lane) | ✓ | ✓ |
| breakeven-5y5y | ✓ (move 0.1 + level) | ✓ 2,495, 18/19 d | ✓ (R7 +) | ✓ the exact object | ✓ (the tilt beside it) | ✓ | ✓ (the B-12 status-word fix rides this seat, MergedCard.tsx:187-195) |
| breakeven-tilt | n D-1 + n (level-only BY the D-5 record, §3.4) | ✓ 2,495 (4/4 present-days) | ✓ (R7's tilt accent +) | ✓ the row's own derivation | ✓ (5y5y beside it) | ✓ + n (context-status admitted — the D-5 variant) | ✓ + n (the dual-role quirk, §3.5) |

**Arithmetic: 17 per-voter defect rows (the ✗ marks) across 10 voters ·
11 voters carry none** (5 of the 11 carry the shared D-1 finding + §3
notes). The shared structural finding D-1 is one row covering 17 seats.

## §2 The defect rows (every `yes`, with evidence and treatment)

### H1 — cadence fit / move-rule coverage

**D-1 · THE STRUCTURAL FINDING — 17 of 21 seats are LEVEL-LEG ONLY.**
`SIGNAL_LEG_MOVE` defines a 30-day threshold for only 4 gold-lane ids
(connections.ts:575-585: real-yield-10y 0.1 · us10y 0.15 · dollar-basket
1.0 · breakeven-5y5y 0.1 — the other five entries are not gold-lane
seats), so for 17 seats `direction` stays `null` whatever change30d does
(connections.ts:596-606) and the ONLY fire path is the decade-extreme
percentile (>0.8/<0.2 of the trailing-3650d level,
connections.ts:608-613). **A readable-but-typical seat reads `steady` by
construction** — wiring.md §1's finding 5, quantified per seat by HD §3's
bases. The 17 seats: us30y · fed-target · fed-expectations · ecb-dfr ·
yield-curve-10y2y · yield-curve-10y3m · usdjpy · us-japan-10y-gap ·
stress-stlfsi · nfci · vix · gold-silver · cftc-gold-positioning ·
us-cpi-yoy · us-pce-core-yoy · euro-hicp · breakeven-tilt.
*Treatment:* one shared finding for GA-S4's per-seat threshold question —
the two seats whose classic treatment DEMANDS the move leg get their own
defect rows (D-2, D-3); the rest are **accept-with-note** pending the
owner-gated calibration (a threshold change is a harness-visible edit,
D-GB-9 lineage — never silent).

**D-2 · `fed-expectations` — the change-led claim with no move leg.** R6's
classic claim is change-led ("the priced path is what MOVES gold before
the Fed does"; treatment "change + level vs decade range" — 02 R6); the
seat is level-only (no threshold, w§1:5) with a healthy base (2,497, 18/19
days, HD §3). The priced-path MOVE — the claim's own expression — is
unvotable; only decade extremes fire. *Treatment:* **repair** — a per-leg
`SIGNAL_LEG_MOVE` threshold for the fed-expectations gap (points), GF-P1's
rule-repair class (severity 3·3·3 = 27, the matrix's R6 row).

**D-3 · `usdjpy` — "change emphasis" with no move leg.** D4's classic
treatment is "change emphasis" (02 D4) — the carry-unwind channel is a MOVE
story; the seat is level-only and is the only pct-changeKind seat (w§1:10
— the pct changeKind is set up but no threshold consumes it), base 2,555,
19/19 days. *Treatment:* **repair** — a pct-units threshold for usdjpy,
GF-P1 (severity 3·3·3 = 27, the matrix's D4 row).

### H2 — history depth

**D-4 · `cftc-gold-positioning` — the never-fires seat, numbered.** The
staged series holds **1 point** (2026-10-27); percentile base **0** (≥30
required, scoring.ts:72); over the 9 recorded archive days **0/9 carried
either input** (HD §2/§3). One weekly point per fetch (cftc.ts:35-44,
104-117; the file carries only the latest week — inventory §2), so the
level leg needs ~30 accumulated clean Saturdays after the rung-2 Saturday
gate began before it can exist at all. WS confirms: `warning` status with
NEITHER evalLeg input on both fresh wires. *Treatment:* **repair** — the
free CFTC historical-archive backfill (the legacy COT history is
free/keyless) + the extreme-based rule question (whether the contrarian
claim wants the percentile rule or an extreme-band rule on the backfilled
history) — GF-P1's named item (severity 3·3·3 = 27, the matrix's F1 row).

**D-5 · `gold-silver` — the thin union base.** The union series (WB monthly
decade ∪ KV seeds ∪ live XAU/XAG, inv §2) holds **122 points, percentile
base 119** — THIN vs the ~250 bar (HD §3); **change30d was absent 19/19
recorded days** (the live leg was <30 days old across the whole corpus
record, so no move input could exist yet); both fields ARE present on the
2026-11-04/05 wires (WS — the live tail aged past 30 days). The level leg
does fire (pct present 15/19 recorded days). *Treatment:* **repair** —
deepen the percentile base with the free daily ratio history (Yahoo
XAU=X/XAG=X-class legs, the repo's L2-accepted register class), so the
decade-extreme percentile is daily-grain; the move leg self-heals as the
live tail ages (accept-with-note on that half). GF-P1 (severity 1·3·3 = 9
with the live stress-lane seat noted for GA-S4's ranking, the matrix's X1
row).

**D-6 · `us-japan-10y-gap` — the intermittent percentile.** The staged
series is **21 points (base 20 < 30)**; the reading-time derivation joins
the staged us10y against the stored-jgb accumulation + the OECD monthly
mirror tail (run.ts:886-899, the mirror path run.ts:864-873), so the live
reading's percentile appears only when that join runs deep enough — **6/9
recorded days had pct10y, 1/9 had change30d** (HD §2). The self-flagged
"stale most windows" is now "the level leg is intermittent, the move leg
effectively absent" (wiring.md §1 finding 2). *Treatment:* **repair** —
persist the derived gap series' history (write the join's output to the
staged history instead of re-deriving at reading time), so the base
accumulates like every other derived seat. GF-P1 (severity 3·3·3 = 27,
the matrix's R10 row).

### H3 — sign vs classic

**D-7 · `yield-curve-10y2y` — the fixed polarity on a regime-dependent
claim.** The seat carries polarity −1 ("steep = reflation; inverted =
stress/easing ahead", gold-score.ts:164): a high/steep curve reads
`pressures`, a low/inverted curve `supports`. The classic claim (02 R4) is
regime-dependent — "a steepening-from-inversion marks an easing cycle,
historically gold's BEST regime; not a standalone direction bet" — and
the frozen spec itself recorded the polarity as ambiguous (D-GA-7's own
note). The seat fires today (base 2,495, 18/19 days, HD §3) — the defect
is the SIGN's honesty, not the wiring's. *Treatment:* **re-seat** — the
owner's sign/regime decision, options recorded: (a) the
regime-conditional reading (fire only the steepening-from-inversion event,
the classic's best-regime marker), (b) the context demotion (per R4's own
"context / secondary" treatment — one seat or none), (c) the polarity
flip (accepting the reflation reading as headwind), or (d)
accept-with-note (the fixed sign as one recorded reading of a
regime-dependent claim). GA-S4 proposes; the owner decides (severity
3·3·3 = 27, the matrix's R4 row).

**D-8 · `yield-curve-10y3m` — the same sign question at the 3m leg.** The
same fixed −1 on the same regime-dependent claim (gold-score.ts:165); the
same options as D-7 apply, and the two seats vote TOGETHER in
borrowing-costs (the classic treatment's "context / secondary" vs the
meter's double vote is part of the same owner decision). *Treatment:*
**re-seat** (one decision covering the pair; severity as R4).

### H4 — granularity

**D-9 · `us10y` — nominal where the classic is real.** The 03 §4 example
itself: "nominal us10y/us30y where the classic is the real rate —
acceptable as belt-and-braces ONLY IF `real-yield-10y` is healthy". It IS
healthy (base 2,497, move 0.15 + level both live, 18/19 days, HD §3).
*Treatment:* **accept-with-note** (recorded in the matrix as R1's
belt-and-braces; no fill needed while the real object carries the claim).

**D-10 · `us30y` — nominal where the classic is real, and level-only.**
The same belt-and-braces footing at the long end, with the added asymmetry
that us30y carries NO move threshold while us10y does (the D-1 finding).
*Treatment:* **accept-with-note** (as D-9); GA-S4's threshold question may
revisit the asymmetry.

**D-11 · `yield-curve-10y2y` — the nominal curve where the classic is the
real curve.** 02 R4's object is the REAL curve (10y−2y real; in practice
10y−5y TIPS, DFII10−DFII5 — the row's own derivation note); the seat
reads the NOMINAL T10Y2Y (w§1:7). The real-curve repair pairs with R2's
DFII5 fill (a derived real curve becomes buildable the day DFII5 is
ingested). *Treatment:* **repair-if-filled** (the derived real curve,
GF-P3 riding R2) — until then accept-with-note (the nominal curve is the
desk's everyday proxy).

**D-12 · `yield-curve-10y3m` — the same granularity question.** The
nominal T10Y3M vs the real-curve classic (w§1:8); rides D-11's treatment
and R2's fill.

**D-13 · `us-japan-10y-gap` — the market gap vs the policy gap.** R10's
classic object is the policy-rate gap ("Foreign policy rates … + policy
gaps" — a DFF−BoJ-class object), the seat reads the 10y MARKET gap (DGS10 −
jgbcme 10Y) — the classic carry-fuel proxy, the code's own comment ("a wide
gap is carry fuel — a dollar-positive"). *Treatment:* **accept-with-note**
(the 10y gap is the desk's carry gauge; the policy-gap complement rides
the R10 fill, the matrix's row).

### H5 — solo-muting

**D-14 · `cftc-gold-positioning` — the F-family's only seat anywhere.**
The positioning/flows family (02 F: 16 rows — CFTC, ETF flows,
central-bank buying, Asian premiums, …) holds exactly ONE voter in the
whole meter, seated in market stress where it is also the only F-family
member: with `GOLD_LANE_MIN_FIRING = 2` (gold-balance.ts:113), the
positioning claim can never tip the lane alone even once it learns to fire
(after D-4's repair) — its family's evidence is structurally muted. This
is OI-GA-2's exact question ("A fifth lane? … exactly one voter … hidden
inside market stress, where it can never tip the lane alone").
*Treatment:* the **OI-GA-2 lane decision** (promote-class: a flows/demand
lane, or a re-seat) — GA-S4 proposes with the matrix's F-family evidence:
36 MISSING-FREE/PARTIAL rows' only voting expression in the family is this
one dead seat.

**D-15 · `gold-silver` — the only X-family seat in stress.** The ratio
claim (X1) is solo in its lane; it can never tip stress alone (min-2).
With the S-family's three healthy co-seats the lane is not fragile, and
the family-lane question is OI-GA-2's, not this seat's. *Treatment:*
**accept-with-note** (the H2 repair D-5 is the actionable half).

**D-16 · `us-japan-10y-gap` — the dollar lane's thin third seat.** The
only R-family seat in the dollar lane (dollar-basket/usdjpy are D-family):
the carry-fuel claim is structurally co-fire-dependent AND its percentile
is intermittent (D-6) — the expected finding ("the dollar lane's thin
third seat"), now with exact counts: 21 staged points, base 20, pct 6/9
recorded days (HD §2/§3). *Treatment:* the **D-6 repair** is the
actionable half (accept-with-note on the lane composition; the R10 fill
decides whether the gap family earns a second expression).

**D-17 · `euro-hicp` — the inflation lane's solo euro leg.** Recorded with
its UNCLASSICATED flag (the matrix §1, finding N-1): the euro-area
realised-inflation claim is solo in the inflation lane with NO locked
taxonomy row behind it — the owner's decision (amend the checklist or
re-seat the voter) decides the seat's fate; the H5 fact rides whichever
answer. *Treatment:* the **N-1 owner decision** (GA-S4's decision list).

### H6 — degradation: 1 defect row; the rest verified honest

**D-18 · `cftc-gold-positioning` — the fake-steady finding (the lean
check's discovery).** The never-fires seat does NOT read `unread` on the
wire — it reads **`steady`** (LC): its reading carries a fresh value
(46.99 % @ 2026-10-27) with wire status `warning`, which `readable()`
ADMITS (only stale/check-pending/unavailable never fire —
gold-balance.ts:127-129), so evalLeg runs with **neither input present**
(change30d and percentile10y both absent — WS), returns lean 0, and the
member line renders **"steady — readable, honestly not firing"**
(gold-balance.ts:170-171) when the evaluator had nothing to evaluate. The
degradation path (H6's honest `unread`) never engages because the CFTC
fetch SUCCEEDS each Saturday — the value is fresh; only the derived fields
are absent (the D-4 history gap). The seat will render `steady` for ~30
weeks of clean Saturdays before its level leg can exist — the exact
false-confidence class D-GA-7 named ("a voter that can never fire…
manufactures false confidence"), now with the member-line word recorded.
*Treatment:* **repair** — the D-4 backfill fixes the inputs; whether
`readable()` should also require evalLeg-input presence (an
inputless-but-fresh seat reading `unread`, not `steady`) is a fill-program
question for the owner (a harness-visible rule nuance, proposed — never
silent).

- **The ecb-dfr hold, verified.** The 2026-11-05 drift record's question
  ("why did the ECB seat age out between the snapshots with BOTH inputs
  gone?") is answered by the mechanism the wiring pack cited and this
  session re-read: a failed fetch HOLDS the last good value with its
  ORIGINAL asOf and status `stale` (adapters/snapshot.ts:451-465 — the H3
  comment block), and the held line carries NO derived fields —
  change30d/percentile10y drop with the rebuild. `readable()` excludes
  `stale` (gold-balance.ts:127-129), so the member reads `unread` — never
  a fake steady, never a fake lean. The fresh wire confirms (WS: ecb-dfr
  `stale` with −/− fields; LC: the one `unread` member today). **No
  defect: the degradation path is the designed honesty mechanism.**
- **The real-yield cross-fill, noted.** The real-yield scoring input
  carries the counted DGS10−T10YIE cross-fill on fetch-gap days
  (real-yield-fill.ts; the stored history stays pure DFII10 — w§1:1). The
  staleness degradation still applies (asOf ages → stale → unread), so the
  fill cannot fake freshness. Noted, no defect.

### H7 — copy coherence: VERIFIED COHERENT for the words it says; one
inputless-seat caveat (D-18's)

- **The member line can only speak the evaluator's own words.** The ledger
  row renders id · impact (supports/pressures/steady/unread) · the
  evaluator's evidence word (rising/falling/high/low) —
  MergedCard.tsx:220-224 via `memberEvidenceOf` (:187-195); the evidence
  vocabulary has no lane word in it, and the B-12 fix pins the one
  interaction (the breakeven-5y5y line carries the card's own status word
  "so the member list can never say 'elevated' beside a card reading
  Normal" — the code's own comment, pinned by test). No overclaim found on
  any of the 21 lines — with the one caveat that is D-18's, not a copy
  defect: `cftc-gold-positioning`'s member line says "steady" only
  because the inputless seat renders as readable-not-firing (the H6
  finding); the word itself is the vocabulary's honest "not firing", and
  the fix is the backfill's, not the copy's.

## §3 The accept-with-note records (the honest non-defects)

1. **The monthly three (`us-cpi-yoy`, `us-pce-core-yoy`, `euro-hicp`).**
   Monthly cadence under the shared evaluator: no threshold applies (none
   defined), and `cadenceUsesPreviousRelease` (scoring.ts:425-427; the
   branch at :492-497) makes change30d the change-since-previous-release —
   the honest monthly semantics, by the code's own design. The level legs
   fire (pct 18/19, 10/10, 10/10 present-days; HD §2). The classic
   treatments' momentum complement (I1's "3m annualised") is not built —
   recorded as the matrix's COVERED notes, not defects.
2. **The monthly depths, read honestly.** Bases 118–119 = a full decade at
   monthly cadence — the H2 bar's own "a decade of monthlies" reading
   (03 §4's parenthetical; wiring.md §3's interpretation). The script's
   fixed 250-cutoff marks them THIN; the audit records both readings and
   files NO defect for the monthly three.
3. **The fed-target step.** The step direction (cuts ease the carry
   penalty) rides the displayed change30d/lastChange (scoring.ts:505-506),
   never the lean (no threshold) — the level leg carries R5's level-led
   claim. Recorded; GA-S4's threshold question may revisit.
4. **The breakeven-tilt level-only variant** is the D-5 record itself
   (gold-score.ts:148-153 — "exactly the B4-measured variant", the owner's
   call) — not a defect to re-litigate (01 §7); noted for the threshold
   question like every level-only seat.
5. **The breakeven-tilt dual-role quirk.** A `context`-status card (its
   DEFINITIONS rule is `info`) holding a voting seat — `readable()`
   admits context-status readings (gold-balance.ts:127-129), so the tilt
   fires while its own card on prices-heat renders as context. The copy is
   coherent on both surfaces; the quirk is recorded for the owner (GA-S4
   may propose a status-rule harmonization in the fill program — never
   silently).
6. **The cftc cadence.** Weekly with one point per fetch (the legacy
   file's own shape — inventory §2): even with a threshold, a 30-day move
   on a weekly series sees ~4 points. The never-fires verdict is D-4's
   (history, not cadence); the cadence note rides the backfill question.
7. **The fresh-wire lean record (the LC run).** `ga-s3-lean-check.sh`
   (this session's read-only addition, the `ga-s2-wire-scan.sh` precedent
   style) replicates the client-side balance computation per seat:
   **6 seats fire on the fresh wire** — real-yield-10y supports · us10y
   supports (both move-leg fires beyond their thresholds) · us30y ·
   fed-expectations · usdjpy pressures (level-leg fires at decade highs
   0.984/0.826/0.946 — the structural finding's live proof that level-only
   seats DO fire at the bands) · breakeven-5y5y pressures (a move-leg
   fire); 14 readable seats sit honestly `steady` mid-band; ecb-dfr reads
   `unread` (the hold); **all four lanes read `neutral` today**
   (borrowing-costs a 2/2 split; dollar 1 firing; stress 0 firing;
   inflation 1) — the min-2 rule holding the lanes honest on a day with
   firing evidence but no crowd. The committed run:
   `evidence/lean-check-2026-11-05.txt`.

## §4 The count summary and the handoff

**Defect rows: 18** (D-1..D-18) — the shared structural finding D-1
covering 17 seats + **17 per-voter defect rows across 10 voters**
(us10y · us30y · fed-expectations · yield-curve-10y2y · yield-curve-10y3m ·
usdjpy · us-japan-10y-gap · gold-silver · cftc-gold-positioning ·
euro-hicp — the ✗ arithmetic of §1). **H1: 3 rows (D-1 shared · D-2 ·
D-3) · H2: 3 (D-4 · D-5 · D-6) · H3: 2 (D-7 · D-8) · H4: 5 (D-9..D-13) ·
H5: 4 (D-14..D-17) · H6: 1 (D-18, the fake-steady finding) · H7: 0
(verified coherent; D-18's caveat is H6's).** 11 voters carry no
per-voter defect. **Treatments proposed:**
repair 6 (D-2 · D-3 · D-4 · D-5 · D-6 · D-18 — the last riding D-4's
backfill + the readable-rule question) + repair-if-filled 2 (D-11 ·
D-12, riding R2) · re-seat 2 (D-7 · D-8, one sign decision) ·
owner-decisions 3 (D-14 = OI-GA-2 · D-16's lane half · D-17 = the matrix's
N-1) · accept-with-note 5 (D-9 · D-10 · D-13 · D-15 + the structural D-1
acceptance pending GA-S4's threshold question). Every defect's severity
components live in the matrix's fill column (the same defects seen from
the row side); GA-S4 ranks, proposes, and gates — nothing here changes the
meter (D-GA-3), and no number above lacks its run or file citation
(01 §4.3).
