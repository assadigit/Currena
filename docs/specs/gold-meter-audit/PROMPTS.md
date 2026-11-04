# Session kickoff prompts — the gold meter audit program

The owner's continuation of the gold program (2026-11-04): after the gold
balance consolidation closed (GB-S7), **audit that the meter holds the full
classic indicator set for gold direction — nothing missed, nothing
half-implemented** — then design the owner-gated fill program. The spec set
is this folder: `README.md` (decisions D-GA-1..10, open items OI-GA-1..6) →
`01-AUDIT-SPEC.md` → `02-REFERENCE-TAXONOMY.md` (the checklist — the audit's
fixed denominator) → `03-METHOD-AND-EVIDENCE.md` → `04-REPORT-AND-FILL-DESIGN.md`
→ `PROGRESS.md` (the authoritative log).

**How to use this file.** Paste the next session's prompt into a fresh agent
session at the repo root. Before starting: `git pull --rebase`; make sure
`git push` works (the owner exports or pastes `GITHUB_TOKEN`; Cloudflare
credentials are not needed — this program deploys nothing). Never paste a
credential into a file, commit, log or test. At the end of every session the
agent rewrites the next prompt below (with the lessons learned and the exact
state), commits, pushes, and prints it. If an older prompt here was already
run, prefer the one the agent printed.

**Delivery discipline (D-GA-10).** Branch `ga/<phase>`, commit and push after
every milestone, open the PR early (draft is fine), self-merge when the
phase's exit gate holds, verify CI green on main. Docs/scripts-only sessions
deploy nothing — and every session of this program is docs/scripts-only
(D-GA-3: the audit never edits the meter).

**Program map.**

| Session | Milestone (01 §8) | Branch | Deploys? |
|---|---|---|---|
| GA-S1 | The taxonomy verified + v1 delivered for the owner's lock; the blind-spot sweep; the presence pre-scan | `ga/s1-taxonomy` | no |
| GA-S2 | The inventory + wiring evidence pack; the mirror sweep | `ga/s2-inventory` | no |
| GA-S2-completion | The voters table + the wiring trace + the history depths (A2's deferred half, after the lock) | `ga/s2-wiring` | no |
| GA-S3 | The coverage matrix classified; the half-implementation defects | `ga/s3-matrix` | no |
| GA-S4 | The audit report + the fill-program design + its prompts | `ga/s4-report` | no |

A session that finishes early pulls the next milestone forward (the GB-S1
precedent). PROGRESS.md is the authoritative state.

---

## GA-S1 — the reference taxonomy: verify, sweep, lock-draft — RUN (2026-11-04)

Delivered: 02 is **v1** — 82 rows (v0 72 + 10 sweep adds − 0 strikes), every
row verified live, the sweep + pre-scan recorded; PROGRESS.md row A. The
runnable record: `packages/insights/scripts/ga-s1-fred-verify.sh`. **The
owner's lock (OI-GA-1) is still OPEN — the GA-S2-COMPLETION prompt below
starts by resolving it.**

---

## GA-S2 — the inventory + the wiring evidence pack (the live kickoff)

RUN (2026-11-04) — **PARTIAL, by design (the lock fallback)**: the owner was
not reachable in-session, so the session delivered the inventory's
**source-side half only** (03 §1.2–§1.4) and stopped before the voter
wiring trace. Delivered: `evidence/inventory.md` (the 161-row readings
table with the mirror-sweep column — **voter 21 · context 63 · not-gold 77
= 161** — the 25 derived-series recipes, the rung map) + the runnable
record `packages/insights/scripts/ga-s2-wire-scan.sh` with its committed
run `evidence/wire-scan-2026-11-04.txt`. Deferred: the voters table
(03 §1.1), the wiring trace + the context traces + the history depths
(03 §2) — all wiring work, all blocked on **OI-GA-1 (the taxonomy lock,
still OPEN)**. **The next session is the GA-S2-COMPLETION prompt below,
which starts by resolving the lock.**

---

## GA-S2-COMPLETION — the wiring evidence pack (A2's deferred half; the live kickoff)

RUN (2026-11-05, attempt 3) — **COMPLETE: THE LOCK RESOLVED + A2 DELIVERED.**
The owner reached back in chat and **delegated the research-and-lock**
("I trust your research and judgement. if you think its enough, it's enough
and locked by me."). The session's pre-lock research pass cross-checked the
coverage against the canonical driver frameworks (Chicago Fed Letter 464's
four-driver set · the WGC demand-side framework), re-verified every named
free source live (52 FRED ids + 11 providers — the identical live/dead
pattern GA-S1 recorded), **added 3 rows** (S13 US household pessimism /
Michigan `UMCSENT` — the Chicago Fed's named pessimism driver, already
ingested as `michigan-sentiment` (promotion-class) · F16 Swiss gold net
exports by destination — BAZG SwissImpex verified live · X7 gold/platinum
ratio — gold-api XPT verified live), recorded the rest as
considered-not-added with reasons, and **LOCKED 02 as v1.1 = 85 rows**
(the lock record at 02's foot). Then A2 completed against the locked
denominator: `inventory.md` §5 (the 21-seat voters table, verbatim, with
the evalLeg rule per seat), `evidence/wiring.md` (the 21 full traces — no
TRACE-BROKEN hops — + the 63 context traces + five recorded findings,
including the ANSWER to the 2026-11-05 drift record's ecb-dfr question:
the failed-fetch hold drops both derived fields, snapshot.ts:451-465), and
`evidence/history-depths-2026-11-05.txt` (the runnable
`ga-s2-history-depths.sh`: cftc **1 pt / base 0 / 0-of-9 days**;
us-japan-10y-gap **21 pts / base 20 / pct 6-of-9 days**; gold-silver
**122 pts / base 119 / ch30d 0-of-19 days**). PROGRESS row B → COMPLETE.

---

## GA-S3 — the coverage matrix + the half-implementation audit

RUN (2026-11-05) — **COMPLETE: A3 DELIVERED — the audit's first
verdict-bearing session.** All 85 taxonomy rows classified with exactly
one class each (`evidence/coverage-matrix.md`; header arithmetic stated:
rows classified = 85 = 82 own classes + the 3 cross-lists resolved to
primaries I5→R7 · I6→R8 · X6→I10 · voters mapped = 21): **COVERED 8 ·
PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 · CONTEXT-ONLY-BY-DESIGN
18 · NOT-APPLICABLE 3**; the fill column seeds the backlog (yes 47, the
27-band: R4 · R6 · R8 · R9 · R10 · D4 · S4 · S7 · S13 · F1 · F2 · G1).
The 21-voter mapping resolved the named live questions honestly: us10y/
us30y → R1's belt-and-braces (H4 accept-with-note, the real object
healthy); breakeven-tilt → **R7's change accent** (02 R13's own "free
proxy" note corrected — the repo's tilt has no swap leg; R13 classes
MISSING-PAID on its own footing); cftc → F1 PARTIAL (the never-fires
number); the yield-curve pair → R4 PARTIAL (the H3 sign defect);
michigan-sentiment's mirror mark revisited against S13 (S13 =
MISSING-FREE promotion-class, the sign nuance recorded) — and **1
UNCLASSICATED: euro-hicp (finding N-1 — the locked checklist holds no
euro-area realised-inflation row; the owner decides amend-vs-re-seat)**.
The half-implementation audit (`evidence/half-implementation.md`): the
H1–H7 checks per voter, **18 defect rows** (D-1 the structural 17-of-21
level-only finding + 17 per-voter rows across 10 voters; H1 3 · H2 3 ·
H3 2 · H4 5 · H5 4 · **H6 1 — D-18 the fake-steady finding: cftc reads
`steady`, not `unread`** · H7 0-verified), treatments proposed (repair 6
· repair-if-filled 2 · re-seat 2 · owner-decisions 3 · accept-with-note
5). The session's one runnable addition: `ga-s3-lean-check.sh` + its
committed run `evidence/lean-check-2026-11-05.txt` — 6 seats fire on the
fresh wire (2 move-leg · 4 level-leg), all four lanes `neutral` today.
PROGRESS row C → COMPLETE. **The next session is the GA-S4 prompt
below.**

---

## GA-S4 — the report + the fill program (the live kickoff)

```
You are working in the Currena repo at the repo root. This is the GA-S4
session of the gold meter audit program — the owner's continuation of the
gold program, and the audit program's LAST session (01 §8). Read this
whole prompt before doing anything.

CONTEXT — WHERE WE STAND
The gold balance consolidation program is COMPLETE and LIVE (closed
2026-11-04 at GB-S7 — the consolidated lane balance is THE gold card for
every visitor on currena.ir; its record: docs/specs/gold-balance-
consolidation/PROGRESS.md). The owner then instructed: "As a financial
investor with 20 years specialization in gold exchange, create an audit
program to make sure that our gold meter has all the required indicators
which classically show the direction of gold price. Make sure nothing is
missed or half-implemented." The spec set is docs/specs/gold-meter-audit/.
THE DENOMINATOR IS LOCKED: 02-REFERENCE-TAXONOMY.md is v1.1 = 85 rows,
LOCKED 2026-11-05 by the owner's delegated instruction (the lock record
with the verbatim instruction at 02's foot; from here additions are
owner-recorded amendments with dates only, D-GA-1).
A1+A2 ARE COMPLETE (GA-S1 + GA-S2 + GA-S2-completion — PROGRESS rows A
and B ✅): the taxonomy, the 161-row readings table with the mirror sweep
(voter 21 · context 63 · not-gold 77), the 25 derived-series recipes, the
rung map, the 21-seat voters table with the evalLeg rule per seat
(4 move-threshold seats · 17 level-only), the 21 full wiring traces (no
TRACE-BROKEN hops) + the 63 context traces, the history depths
(evidence/history-depths-2026-11-05.txt), and the wire-scan family
(ga-s2-wire-scan.sh + the 2026-11-04/-05 runs).
A3 IS COMPLETE (GA-S3, 2026-11-05 — PROGRESS row C ✅), the audit's
first verdict-bearing session:
  - evidence/coverage-matrix.md — ALL 85 rows classified, one class each
    (COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 ·
    CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3, + the 3 cross-lists
    resolved to primaries I5→R7 · I6→R8 · X6→I10; the header arithmetic
    stated: rows classified = 85, voters mapped = 21), every reason
    citing wiring.md or a recorded absence, the fill column seeding the
    backlog (yes 47 = 7 PARTIAL + 36 MISSING-FREE + 4 promote-worthy COBD,
    the severity components per 04 §2; the 27-band: R4 · R6 · R8 · R9 ·
    R10 · D4 · S4 · S7 · S13 · F1 · F2 · G1 — 12 rows, every one a
    core-channel claim with the data in hand).
  - THE VOTER MAPPING, 21 seats: 20 to exactly one row each (R1 ×3 —
    real-yield-10y the exact object + us10y/us30y as belt-and-braces
    nominal proxies, H4 accept-with-note; R4 ×2; R5; R6; R7 ×2 —
    breakeven-tilt mapped to R7's change accent, 02 R13's own "free
    proxy" note corrected honestly: the repo's tilt T5YIFR−T5YIE has no
    swap leg, so R13 classes MISSING-PAID on its own footing; R10 ×2;
    D1; D4; S1; S5 ×2; X1; F1; I1; I2) + **1 UNCLASSICATED — finding
    N-1: euro-hicp** (the locked checklist holds no euro-area
    realised-inflation row; the owner decides amend-vs-re-seat).
    michigan-sentiment's mirror-sweep mark was revisited and recorded
    against S13 (S13 = MISSING-FREE promotion-class — the exact UMCSENT
    object already ingested as a growth-health voter; the re-seat needs
    the owner's polarity decision: the growth rule reads bottom-quintile
    sentiment as growth-NEGATIVE, S13's claim reads pessimism as
    gold-POSITIVE).
  - evidence/half-implementation.md — the H1–H7 checks per voter, 18
    defect rows: D-1 THE STRUCTURAL FINDING (17 of 21 seats level-leg
    only — connections.ts:575-585 defines move thresholds for just 4 ids,
    so a readable-but-typical seat reads steady by construction) + 17
    per-voter rows across 10 voters (11 carry none): H1 3 (D-2
    fed-expectations — R6's change-led claim with no move leg; D-3
    usdjpy — D4's "change emphasis", the pct changeKind unconsumed) ·
    H2 3 (D-4 cftc 1 pt / base 0 / 0-of-9 days; D-5 gold-silver
    122 pts / base 119 / ch30d 0-of-19 recorded days; D-6
    us-japan-10y-gap 21 pts / base 20 / pct 6-of-9 days) · H3 2 (D-7/D-8
    the yield-curve pair: the fixed −1 polarity on R4's
    regime-dependent claim — the frozen spec's own "ambiguous" record;
    the re-seat options stated for the owner) · H4 5 (D-9/D-10 us10y/
    us30y nominal-vs-real belt-and-braces; D-11/D-12 the nominal curve
    vs the real curve, riding R2's DFII5 fill; D-13 the 10y market gap
    vs R10's policy-gap object) · H5 4 (D-14 cftc — the F-family's only
    seat anywhere, OI-GA-2's exact evidence; D-15 gold-silver the only
    X in stress; D-16 us-japan-10y-gap the dollar lane's thin third
    seat; D-17 euro-hicp the solo euro leg, riding N-1) · H6 1 (**D-18
    the fake-steady finding, the lean check's discovery: cftc reads
    `steady`, NOT `unread`** — its fresh warning-status value passes
    readable() at gold-balance.ts:127-129 while neither evalLeg input
    exists) · H7 0 (verified coherent — the member line speaks only the
    evaluator's own evidence words, the B-12 pin holds). The ecb-dfr
    hold verified honest (adapters/snapshot.ts:451-465). Treatments
    proposed: repair 6 (D-2 · D-3 · D-4 · D-5 · D-6 · D-18) ·
    repair-if-filled 2 (D-11/D-12 riding R2) · re-seat 2 (D-7/D-8, one
    sign decision) · owner-decisions 3 (D-14 = OI-GA-2 · D-16's lane
    half · D-17 = N-1) · accept-with-note 5 (D-9 · D-10 · D-13 · D-15 +
    the structural D-1 acceptance pending the threshold question).
  - The lean check: packages/insights/scripts/ga-s3-lean-check.sh (the
    new read-only keyless script, the ga-s2-wire-scan.sh precedent) +
    its committed run evidence/lean-check-2026-11-05.txt — 6 seats fire
    on the fresh wire (real-yield-10y + us10y move-leg supports; us30y +
    fed-expectations + usdjpy level-leg pressures at decade highs
    0.984/0.826/0.946; breakeven-5y5y move-leg pressures), 14 readable
    seats honestly steady, ecb-dfr unread (the hold), ALL FOUR LANES
    `neutral` today (borrowing-costs a 2/2 split — the min-2 rule
    holding). Re-run it fresh this session if useful (read-only,
    keyless).
  - The pre-classification re-verification runs: ga-s2-history-depths.sh
    re-run → identical; ga-s2-wire-scan.sh re-run → byte-identical to
    the committed 11-05 run.
Repo state: main holds the GA-S3 merge (PR "gold meter audit (GA-S3):
the coverage matrix + the half-implementation defects"); git pull
--rebase before starting.

WHAT THIS SESSION IS
GA-S4 (01 §2 A4; 04 §1–§5): **the audit report + the fill-program design
with its session prompts** — the program's closing deliverable. Two
artifacts and the record: (1) docs/insights/GOLD-METER-AUDIT-REPORT.md
per 04 §1's shape — the header arithmetic up front (rows classified = 85
· voters mapped = 21 · defects found = 18 · the headline: how much of
the classic condition set the meter sees today, the COVERED+healthy
share stated as a fraction with the row count), the condensed coverage
matrix (per-family summaries + every non-COVERED row in full), the
half-implementation defects with severity, the gap backlog RANKED (every
PARTIAL + MISSING-FREE + promote-worthy COBD row, sorted by the 04 §2
severity with ties broken toward cheaper wiring, each with its named
free source and the fill phase it lands in), the owner's decision list
stated (below), and the honesty footer (no forecasting claim, 01 §4.1 —
the fill program adds coverage of the classic condition set, nothing
more); (2) the fill-program design per 04 §3–§4 made concrete: the
GF-P0..P5 phases loaded with the ranked backlog (which rows land in
which phase), the standing constraints restated, the end state (04 §5),
and the GF-S1 kickoff prompt WRITTEN IN PROMPTS.md from this program's
template convention (the fill program's home docs/specs/gold-meter-
gapfill/ is created by ITS first session, not this one) — PRINTED in
your final message per D-GA-9. GA-S4 still edits NO meter code (D-GA-3)
and deploys nothing — the fill program executes only on the owner's
recorded go, phase by phase.

WORK ITEMS (in order)
1. READ FIRST: docs/specs/gold-meter-audit/README.md (the decision log
   D-GA-1..10 + the open items OI-GA-1..6), 01-AUDIT-SPEC.md (§7 what
   the audit is not), 02-REFERENCE-TAXONOMY.md (the LOCKED v1.1 = 85
   rows), 03-METHOD-AND-EVIDENCE.md, 04-REPORT-AND-FILL-DESIGN.md (§1
   the report shape, §2 the severity components, §3 the GF phases, §4
   the standing constraints, §5 the end state — THIS session's spec),
   PROGRESS.md (all session blocks), PROMPTS.md; then the whole A3
   evidence pack (evidence/coverage-matrix.md + half-implementation.md +
   lean-check-2026-11-05.txt + the GA-S2 pack: inventory.md + wiring.md
   + history-depths-2026-11-05.txt + the wire scans). Then git pull
   --rebase.
2. THE REPORT: docs/insights/GOLD-METER-AUDIT-REPORT.md per 04 §1 —
   every number restated from the evidence files with their citations
   (the arithmetic 85/21/18; the COVERED share 8/85; the class tally;
   the backlog 47 with the severity sort; the defects with treatments).
   The report is the OWNER-READABLE verdict: plain about what the meter
   sees and what it does not, honest about every promote-worthy and
   repairable gap, no hedging that hides a defect, no forecasting claim
   anywhere (D-GA-2).
3. THE FILL-PROGRAM DESIGN: concretize 04 §3 — map the ranked backlog
   to the phases (GF-P1 repairs: the 6 repair defects + the 2
   repair-if-filled; GF-P2 promotions: the 12 zero-new-fetch class +
   the promote-worthy COBD questions; GF-P3 new free sources: the
   MISSING-FREE fills that need a fetch; GF-P4 context additions: the
   X/G/H context winners; GF-P0 wrapping every voter-set change with
   the recalibration; GF-P5 acceptance+flip), restate the standing
   constraints (04 §4 — the per-seat owner approval for every
   gold-score.ts edit, the recalibration before any new voter counts,
   the gates, the copy rounds), and state the end state (04 §5).
4. THE OWNER'S DECISION LIST, stated in the report (04 §1.5) and in
   PROGRESS's Owner-must-decide: OI-GA-2 (a fifth lane? — with D-14's
   evidence: the F-family's only seat anywhere is dead and solo) ·
   OI-GA-3 (the S6-M6.4 promotion — D5/S6, the dedollar shadow pair) ·
   OI-GA-4 (WGC quarterly: voter vs context-first for F3/F4/F5/F13/
   F15/F16/H1–H4) · OI-GA-5 (EODHD per-item policy: F9/F10/S2/S3/G7) ·
   OI-GA-6 (the copy rounds for any new context line) · **NEW N-1**
   (euro-hicp UNCLASSICATED: amend the taxonomy — an owner-recorded
   amendment with its date, D-GA-1 — or re-seat/remove the voter) ·
   **the D-7/D-8 yield-curve sign decision** (the four recorded options)
   · **the D-18 readable-rule question** (accept-with-note or the
   input-presence rule) · **the D-1 threshold question** (which of the
   17 level-only seats deserve move thresholds — the calibration
   proposal) · the per-row promotion go/no-go for the 12 zero-new-fetch
   class (R9 · I3 · I10 · S4 · S7 · S8 · S13 · G1 · X7 · F2 · D7 ·
   I11). Each with the audit's recommendation and the recorded-open
   status — GA-S4 PROPOSES, the owner decides; nothing executes here.
5. RECORD: PROGRESS.md — the session block + milestone rows D AND E →
   COMPLETE (the program closes: A1–A4 whole); CHANGELOG.md — a dated
   entry in the house style; PROMPTS.md — the GF-S1 kickoff prompt
   written from the template with the exact state (the fill program's
   first session, its branch gf/p0-recalibration per the 04 §3 P0
   phase, its exit gate = the calibration report + the owner's recorded
   go on the proposed voter set), and the GA-S4 prompt superseded by
   its completion record.

CONSTRAINTS (standing, every session of this program)
- D-GA-3: read-only against the code. No edits to gold-score.ts,
  gold-balance.ts, GOLD_LANE_VOTERS, harness tables, schemas, adapters,
  copy dictionaries. Docs + read-only scripts only. Deploy NOTHING.
- D-GA-2: no forecasting claim anywhere; coverage/honesty language only
  — the severity ranking is classic-literature importance × data
  availability × wiring cost, never a backtest of proposed voters
  (01 §4.1; the standing no-edge record stays operative).
- D-GA-1/D-GA-6: the denominator is LOCKED (v1.1 = 85 rows); if the
  owner amends in-session (e.g. the N-1 euro-inflation row), record it
  in 02 as an owner-recorded decision with its date and restate the
  arithmetic downstream. One class per row already fixed — the report
  may not re-classify anything the matrix classed.
- Every number from a run or a citation (01 §4.3): restate only what the
  evidence files and the committed runs carry (the citation base:
  coverage-matrix.md + half-implementation.md + wiring.md + the four
  committed runs; re-run the read-only scripts if you need today's
  numbers).
- Branch ga/s4-report; PR "gold meter audit (GA-S4): the report + the
  fill-program design"; push after each milestone; merge yourself when
  the exit gate holds; CI green on main verified. Docs-only: no deploy.

EXIT GATE
docs/insights/GOLD-METER-AUDIT-REPORT.md merged: the header arithmetic
stated (rows classified = 85 · voters mapped = 21 · defects = 18 · the
COVERED share as a fraction), the condensed matrix + every non-COVERED
row, the defects with severities, the RANKED backlog with phases, the
owner's decision list stated (OI-GA-2..6 + N-1 + the sign/readable-rule/
threshold questions + the per-row promotions), the honesty footer; the
fill-program design concretized (GF-P0..P5 loaded, the standing
constraints, the end state); PROGRESS rows D AND E COMPLETE (the
program closes); the GF-S1 kickoff prompt written, committed, pushed,
merged, printed in your final message with a 5-line summary (what
shipped, the verdict's headline numbers, the owner's decision list).

AT THE END (the standing close-out, every session)
1. PROGRESS.md session block + milestone rows; 2. CHANGELOG entry; 3.
the next prompt (the GF-S1 kickoff) rewritten in PROMPTS.md; 4. commit,
push, PR, merge when green; 5. final message = the printed next prompt
+ the 5-line summary. (D-GA-9: the owner asked for a next-session prompt
at the end of EVERY session — never end without one; the GA program's
last session hands the convention to the fill program's first.)
```
