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

## GA-S3 — the coverage matrix + the half-implementation audit (the live kickoff)

```
You are working in the Currena repo at the repo root. This is the GA-S3
session of the gold meter audit program — the owner's continuation of the
gold program. Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
The gold balance consolidation program is COMPLETE and LIVE (closed
2026-11-04 at GB-S7; its record: docs/specs/gold-balance-consolidation/
PROGRESS.md — the consolidated lane balance is THE gold card for every
visitor on currena.ir). The owner then instructed: "As a financial investor
with 20 years specialization in gold exchange, create an audit program to
make sure that our gold meter has all the required indicators which
classically show the direction of gold price. Make sure nothing is missed
or half-implemented." The spec set is docs/specs/gold-meter-audit/.
THE DENOMINATOR IS LOCKED: GA-S1 (2026-11-04) delivered the 82-row taxonomy
v1; on 2026-11-05 the owner delegated the research-and-lock to the audit
("I trust your research and judgement. if you think its enough, it's enough
and locked by me."), the GA-S2-completion session's pre-lock research pass
cross-checked the coverage against the canonical driver frameworks
(Chicago Fed Letter 464 · WGC demand-side), re-verified every named free
source live, added 3 rows (S13 · F16 · X7 — the owner's recorded pre-lock
amendment) and LOCKED 02-REFERENCE-TAXONOMY.md as **v1.1 = 85 rows**
(the lock record with the verbatim owner instruction is at 02's foot).
From here additions are owner-recorded amendments with dates only (D-GA-1).
A2 IS COMPLETE (GA-S2 2026-11-04 source-side + GA-S2-completion 2026-11-05
the deferred halves — PROGRESS rows A and B both ✅):
  - evidence/inventory.md — the 161-row readings table (the mirror sweep:
    voter 21 · context 63 · not-gold 77 = 161), the 25 derived-series
    recipes, the rung map (RUNGS.md canonical), AND §5 the voters table:
    the 21 seats of GOLD_LANE_VOTERS (gold-score.ts:155-184) verbatim with
    line numbers and THE EVALLEG RULE PER SEAT — 4 of 21 carry a
    SIGNAL_LEG_MOVE threshold (real-yield-10y 0.1 pts · us10y 0.15 ·
    dollar-basket 1.0 · breakeven-5y5y 0.1, connections.ts:575-585), 17 are
    LEVEL-LEG ONLY; the level leg = percentile10y bands <0.2/>0.8 over the
    trailing-3650d of the LEVEL series (scoring.ts:63/115-120, ≥30-obs gate
    scoring.ts:72); the monthly seats express previous-release change
    (scoring.ts:425-427); usdjpy is the only pct seat; breakeven-tilt the
    only context-status seat (readable() admits it, gold-balance.ts:127-129).
  - evidence/wiring.md — the full chain for EACH of the 21 voters (source
    endpoint → adapter file:fn → rung → reading + staleness → evalLeg
    inputs → seat → the visitor's member line, MergedCard.tsx:113/220-224),
    NO TRACE-BROKEN hops, + the 63 context traces (D-GA-4) ending in
    "never votes", + five recorded findings: (1) cftc-gold-positioning the
    never-fires seat; (2) us-japan-10y-gap the intermittent percentile
    (ingest/run.ts:886-899); (3) gold-silver the thin union base;
    (4) ecb-dfr — the failed-fetch hold drops both derived fields
    (snapshot.ts:451-465 — the 2026-11-05 drift question answered);
    (5) the structural 17-of-21 level-only finding.
  - evidence/history-depths-2026-11-05.txt — the committed run of the
    read-only keyless fetchless packages/insights/scripts/
    ga-s2-history-depths.sh (the corpus fixture + source parses only):
    15 voters PASS (bases 2,495–3,649 pts), the monthly three 118–119 pts,
    the suspects numbered — cftc 1 pt / base 0 / 0-of-9 archive days;
    us-japan-10y-gap 21 pts / base 20 / pct 6-of-9 · ch30d 1-of-9 days;
    gold-silver 122 pts / base 119 / ch30d 0-of-19 days (both fields
    present on the 2026-11-04/05 wires — the live tail aged past 30 days).
  - The scan family: ga-s2-wire-scan.sh + wire-scan-2026-11-04/-05.txt
    (the day-to-day drift record; re-run it fresh this session if useful —
    read-only, keyless).
Repo state: main holds the GA-S2-completion merge (PR "gold meter audit
(GA-S2 completion): the wiring evidence pack" — the lock + A2 complete);
git pull --rebase before starting.

WHAT THIS SESSION IS
GA-S3 (01 §2 A3; 03 §3–§4): **the coverage matrix classified + the
half-implementation defect list** — the audit's first verdict-bearing
session. Every one of the 85 taxonomy rows gets exactly one class from the
fixed rubric (01 §6: COVERED · PARTIAL · MISSING-FREE · MISSING-PAID ·
CONTEXT-ONLY-BY-DESIGN · NOT-APPLICABLE), every one of the 21 voters maps
to exactly one row (or is flagged UNCLASSICATED — a defect by definition),
and the H1–H7 half-implementation checks run per voter. The output:
evidence/coverage-matrix.md + evidence/half-implementation.md, with the
header arithmetic stated (01 §5: rows classified = 85; voters mapped = 21).
This session still edits NO meter code (D-GA-3) and deploys nothing.

WORK ITEMS (in order)
1. READ FIRST: docs/specs/gold-meter-audit/README.md (the decision log —
   D-GA-1..10), 01-AUDIT-SPEC.md (§5 the completeness guarantee, §6 the
   rubric — the classes' necessary-and-sufficient conditions),
   02-REFERENCE-TAXONOMY.md (the LOCKED v1.1 denominator — 85 rows; the
   lock record at the foot), 03-METHOD-AND-EVIDENCE.md (§3 the matrix
   columns, §4 the H1–H7 checks — this session's procedures),
   04-REPORT-AND-FILL-DESIGN.md (the severity components your "fill
   program?" column seeds), PROGRESS.md (all session blocks), PROMPTS.md;
   then the evidence pack (inventory.md + wiring.md +
   history-depths-2026-11-05.txt + the wire scans), and the code itself:
   gold-score.ts, connections.ts (evalLeg + SIGNAL_LEG_MOVE), gold-balance.ts,
   definitions.ts, gauges.ts. Then git pull --rebase.
2. THE COVERAGE MATRIX (03 §3): evidence/coverage-matrix.md — one row per
   taxonomy row (all 85, including the three v1.1 additions S13/F16/X7 —
   S13's object is ALREADY INGESTED as michigan-sentiment, a growth-health
   voter: a promotion-class row the matrix must resolve), columns: taxonomy
   id + name · current footprint (the reading(s)/voter(s) by id, or none —
   wiring.md is the citation source) · Class (one of six, per §6's
   necessary-and-sufficient conditions — no COVERED without a wiring
   citation and a fire-history that shows the voter can actually fire in
   the current corpus era; no NOT-APPLICABLE where the honest class is
   CONTEXT-ONLY-BY-DESIGN without a recorded decision) · Reason (one line,
   citing wiring.md's row or the absence) · fill program? (yes/no + the
   severity components, 04 §3). Cross-listed rows resolve to their
   primaries (I5→R7, I6→R8, X6→I10) — state that in the header.
3. THE VOTER MAPPING: every one of the 21 voters maps to exactly one
   taxonomy row (or UNCLASSICATED — a defect; the owner decides which).
   Known live questions to resolve honestly: the yield-curve seats
   (yield-curve-10y2y/10y3m vs R4 — the polarity the frozen spec itself
   calls ambiguous); cftc-gold-positioning (F1 — the never-fires number is
   the PARTIAL evidence); us10y/us30y (R1's belt-and-braces or their own
   rows?); copper-gold (X3 — a growth-health seat holding a gold-family
   claim); michigan-sentiment's mirror-sweep mark (not-gold — now
   revisitable against S13, though the card itself is not a gold-lane
   voter and S13's class is the matrix's to assign).
4. THE HALF-IMPLEMENTATION AUDIT (03 §4): evidence/half-implementation.md —
   the H1–H7 checks per voter, any yes = a defect row with evidence and
   the proposed fill-program treatment (repair / promote / re-seat /
   accept-with-note). The wiring pack already quantified the H2 evidence
   (history-depths) and the H1 evidence (cadence vs the 4-threshold
   move-rule coverage); H5's expected findings (CFTC solo in stress, the
   dollar lane's thin third seat) now have exact counts to cite.
5. RECORD: PROGRESS.md — the session block + milestone row C → COMPLETE;
   CHANGELOG.md — a dated entry in the house style; rewrite the GA-S4
   prompt in PROMPTS.md from the template with the exact state.

CONSTRAINTS (standing, every session of this program)
- D-GA-3: read-only against the code. No edits to gold-score.ts,
  gold-balance.ts, GOLD_LANE_VOTERS, harness tables, schemas, adapters,
  copy dictionaries. Docs + read-only scripts only. Deploy NOTHING.
- D-GA-2: no forecasting claim anywhere; coverage/honesty language only —
  the severity ranking is classic-literature importance × data
  availability × wiring cost, never a backtest of proposed voters.
- D-GA-1/D-GA-6: the denominator is LOCKED (v1.1 = 85 rows); if the owner
  amends in-session, record it in 02 as an owner-recorded decision with
  its date and restate the arithmetic downstream. One class per row, no
  silent waves.
- Every number from a run or a citation (01 §4.3): the counts, the
  fire-ability verdicts, the defect rows — each with the script, file or
  query that produced it (wiring.md + history-depths-2026-11-05.txt are
  the citation base; re-run ga-s2-history-depths.sh / ga-s2-wire-scan.sh
  read-only if you need today's numbers).
- Branch ga/s3-matrix; PR "gold meter audit (GA-S3): the coverage matrix
  + the half-implementation defects"; push after each milestone; merge
  yourself when the exit gate holds; CI green on main verified.
  Docs/scripts-only: no deploy.

EXIT GATE
evidence/coverage-matrix.md complete: 85 rows classified (one class each,
the cross-lists resolved to primaries), every reason citing wiring.md or a
recorded absence, the fill-program column filled; the header arithmetic
stated (rows classified = 85, voters mapped = 21); evidence/
half-implementation.md complete: the H1–H7 defect rows with evidence and
treatments; PROGRESS row C COMPLETE; the GA-S4 prompt written, committed,
pushed, merged; the prompt printed in your final message with a 5-line
summary (what shipped, the defect counts, what the owner must decide —
OI-GA-2..6 are GA-S4's proposal territory).

AT THE END (the standing close-out, every session)
1. PROGRESS.md session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
(D-GA-9: the owner asked for a next-session prompt at the end of EVERY
session — never end without one.)
```

---

## GA-S4 — the report + the fill program (to be rewritten by GA-S3)
Will follow 04: `docs/insights/GOLD-METER-AUDIT-REPORT.md`, the severity
ranking, the owner's decision list, the fill program's phase design and its
GF-S1.. prompts. Branch `ga/s4-report`.
