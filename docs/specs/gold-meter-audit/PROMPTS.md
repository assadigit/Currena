# Session kickoff prompts — the gold meter audit program (CLOSED) → the gold meter gap-fill program

The owner's continuation of the gold program (2026-11-04): after the gold
balance consolidation closed (GB-S7), **audit that the meter holds the full
classic indicator set for gold direction — nothing missed, nothing
half-implemented** — then design the owner-gated fill program. The spec set
is this folder: `README.md` (decisions D-GA-1..10, open items OI-GA-1..6) →
`01-AUDIT-SPEC.md` → `02-REFERENCE-TAXONOMY.md` (the checklist — the audit's
fixed denominator) → `03-METHOD-AND-EVIDENCE.md` → `04-REPORT-AND-FILL-DESIGN.md`
→ `PROGRESS.md` (the authoritative log).

**PROGRAM STATUS: CLOSED 2026-11-05 at GA-S4** — A1–A4 whole (the taxonomy
locked v1.1 = 85 rows · the inventory + wiring pack · the coverage matrix
+ the 18 defects · the report + the fill design). The audit's verdict:
`docs/insights/GOLD-METER-AUDIT-REPORT.md`. **The successor — the gold
meter gap-fill program (`docs/specs/gold-meter-gapfill/`, created by its
first session) — receives the D-GA-9 convention: its GF-S1 kickoff prompt
is at the foot of this file** (the live kickoff; paste it into a fresh
session at the repo root).

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
| GA-S4 | The audit report + the fill-program design + its prompts | `ga/s4-report` — **DONE (2026-11-05): the program CLOSED; the GF-S1 prompt at the foot of this file is the live kickoff** | no |

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

## GA-S4 — the report + the fill program

RUN (2026-11-05) — **COMPLETE: A4 DELIVERED — THE AUDIT PROGRAM CLOSES.**
`docs/insights/GOLD-METER-AUDIT-REPORT.md` delivered per 04 §1: the
header arithmetic up front (**rows classified = 85 · voters mapped = 21
· defects = 18**; the headline as fractions — **COVERED 8/85 ≈ 9.4% ·
any voting expression 15/85 ≈ 17.6%**), the condensed coverage matrix
(per-family summaries + the COVERED core + every non-COVERED row in
full — the 74 own-class rows + the 3 cross-lists), the 18 defects with
severity and treatment, **the RANKED 47-row backlog** (the tie-break
cascade recorded; F6's band-tally slip disclosed and restated at 18 per
its own fill cell; the bands 27×12 · 18×10 · 12×6 · 9×3 · 8×9 · 6×1 ·
4×6), the owner's decision list with the audit's recommendation per
item (OI-GA-2 add-the-lane · OI-GA-3 fold-into-GF-P2 · OI-GA-4
context-first · OI-GA-5 no-EODHD-use-proposed · OI-GA-6 standing · N-1
AMEND · D-7/D-8 context-demotion · D-18 input-presence-rule · D-1
derive-don't-assume · the 12 promotion go/no-gos: PROMOTE ×8 · CONTEXT
ADD ×3 · D7 seat-or-context), the fill-program design concretized
(**GF-P0..P5 loaded with the ranked backlog**, the standing
constraints, the end state), and the honesty footer. The lean check
re-run fresh → identical on every seat. PROGRESS rows D AND E →
COMPLETE — **A1–A4 whole; the program is CLOSED**. CHANGELOG
[2026-11-05d]. AGENT_HANDOFF restated for the successor. **The
successor program — the gold meter gap-fill program (`docs/specs/
gold-meter-gapfill/`, created by ITS first session) — receives the
D-GA-9 convention: its GF-S1 kickoff prompt is below and printed in the
GA-S4 final message.**

---

## GF-S1 — the gap-fill program's first session: the P0 recalibration pre-registration (the live kickoff)

```
You are working in the Currena repo at the repo root. This is the GF-S1
session of the gold meter gap-fill program — the owner-gated successor
to the CLOSED gold meter audit program (GA-S1..GA-S4, CLOSED 2026-11-05;
its record: docs/specs/gold-meter-audit/PROGRESS.md; the audit's
verdict: docs/insights/GOLD-METER-AUDIT-REPORT.md — READ THE REPORT
FIRST, especially §4 the ranked backlog, §5 the owner's decision list
and §6 the fill design). Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
The gold meter audit program is CLOSED and DELIVERED (2026-11-05):
against the LOCKED taxonomy (02 v1.1 = 85 rows) it classified all 85
rows (COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 ·
CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3 + the 3 cross-lists),
mapped all 21 voters (20 rows + 1 UNCLASSICATED — euro-hicp, finding
N-1), found 18 half-implementation defects (D-1 the structural
17-of-21 level-only finding … D-18 the fake-steady finding), ranked the
47-row backlog, and stated the owner's decision list with the audit's
recommendations. The predecessor gold balance consolidation is COMPLETE
and LIVE (GB-S7, 2026-11-04): the consolidated lane balance is THE gold
card for every visitor on currena.ir.
THE METER IS FROZEN — the audit changed nothing (D-GA-3). Every change
is THIS program's, owner-gated: the per-seat approval lineage (D-GB-9
as amended at GB-S7) — every gold-score.ts / GOLD_LANE_VOTERS edit
requires the owner's RECORDED approval per seat change, with the audit
report's §4 row as the justification attached to each approval.
THE OWNER'S DECISION LIST (the report §5) GATES THE VOTER SET:
OI-GA-2 (a fifth flows & demand lane? — the audit recommends ADDING) ·
OI-GA-3 (the S6-M6.4 shadow pair D5/S6 — fold into GF-P2) · OI-GA-4
(WGC quarterly — context-first recommended) · OI-GA-5 (EODHD — no use
proposed) · OI-GA-6 (copy rounds 79+) · N-1 (euro-hicp: AMEND the
taxonomy — an owner-recorded amendment with its date, D-GA-1 — or
re-seat; AMEND recommended, the denominator becomes 86) · the D-7/D-8
yield-curve sign decision (context demotion recommended) · the D-18
readable-rule question (input-presence rule recommended) · the D-1
threshold question (derive, don't assume) · the per-row go/no-go for
the 12 zero-new-fetch class (R9 · I3 · I10 · S4 · S7 · S8 · S13 · G1 ·
X7 · F2 · D7 · I11 — PROMOTE ×8 · CONTEXT ADD ×3 · D7 seat-or-context).
NOTHING EXECUTES WITHOUT THE OWNER'S RECORDED GO. If decisions are
recorded (in chat or the repo), assemble the proposed voter set from
them; if not, run the calibration over the CURRENT frozen set + the
audit's ranked candidates as clearly-labelled SCENARIO tables, and
print the decision list for the owner (the GA lock-fallback precedent).

WHAT THIS SESSION IS
GF-S1 (the fill design's GF-P0 phase, the report §6.1): THE
RECALIBRATION PRE-REGISTRATION — (1) create the fill program's home
docs/specs/gold-meter-gapfill/ (README with the decision log +
01-FILL-SPEC + PROGRESS + PROMPTS — the audit program's structure as
the template, the audit's 04 §3–§5 as the founding spec); (2) the
proposed voter set (post-fill) added to the read-only harness as NEW
TABLES BESIDE THE FROZEN ONES — no product code; (3) the lane rule
(min-firing) re-derived per the GB-S1 protocol (the C1/C2 criteria
over the corpus); (4) the lane-count question (OI-GA-2) answered with
the calibration evidence (4-lane vs 5-lane scenarios, the F-family's
D-14 evidence in hand); (5) the D-1 threshold calibration proposal
(which of the 17 level-only seats deserve move thresholds — derive
from the corpus distributions + the 02 treatments; D-2/D-3's two
repairs are already P1 items).

WORK ITEMS (in order)
1. READ FIRST: docs/insights/GOLD-METER-AUDIT-REPORT.md (the whole
   verdict) + the audit's evidence pack (docs/specs/gold-meter-audit/
   evidence/ — coverage-matrix.md + half-implementation.md + the
   committed runs) + the gold-balance consolidation's GB-S1 calibration
   record (docs/specs/gold-balance-consolidation/ — the C1/C2 protocol
   and the min-2 derivation) + gold-score.ts / gold-balance.ts / the
   harness (read-only). Then git pull --rebase.
2. THE PROGRAM HOME: docs/specs/gold-meter-gapfill/ — README.md (the
   decision log D-GF-*: the inherited constraints — the per-seat
   approval rule, the beam formula unchanged, the no-forecasting rule,
   free-first, every number from a run, the D-GA-9 prompt convention)
   + 01-FILL-SPEC.md (the phases GF-P0..P5 loaded with the ranked
   backlog from the report §4/§6, the gates, the standing constraints,
   the end state) + PROGRESS.md (the milestone table: rows for P0..P5)
   + PROMPTS.md (this prompt as the first record).
3. THE CALIBRATION (GF-P0 proper): the proposed voter set as new
   read-only harness tables beside the frozen ones (a
   GF-proposed-voters table + the calibration scripts, the GB-S1
   precedent — no product code, no deploy); the min-firing rule
   re-derived per the C1/C2 criteria over the corpus; the lane-count
   scenarios for OI-GA-2; the D-1 threshold proposal (per-seat,
   derived, with the 02-treatment justification per seat).
4. THE CALIBRATION REPORT: committed under the fill program's evidence
   folder with its runnable record (the script + the committed output —
   the GA evidence-pack convention); the proposed voter set stated for
   the owner's go, with every scenario table labelled.
5. RECORD: the fill program's PROGRESS session block + milestone row;
   CHANGELOG (house style); the GF-S2 prompt (the next phase per the
   owner's decisions — P1 repairs if the go is recorded, else the
   decision-list re-issue).

CONSTRAINTS (standing, every session of this program)
- THE PER-SEAT APPROVAL RULE: every gold-score.ts / GOLD_LANE_VOTERS
  edit requires the owner's RECORDED approval per seat change — the
  audit report's §4 row is the justification attached to each. GF-P0
  adds NO product code at all (the proposed set lives in new read-only
  tables beside the frozen ones).
- The beam formula, the honesty rules and the no-edge record are
  inherited UNCHANGED (D-GB-8 lineage); the min-2 lane rule is
  RE-DERIVED, not assumed (this session's whole point).
- No forecasting claim anywhere (D-GA-2 lineage): the calibration
  measures firing statistics and lane behaviour, never predictive
  power; copy says "conditions".
- Free-first (D-GA-5 lineage): every new source the backlog names is
  free/keyless/licence-clean; EODHD only with the owner's recorded
  per-item approval (none proposed).
- Every number from a run or a citation; recommendations re-checked
  against code before they are written down.
- Branch gf/p0-recalibration; PR "gold meter gapfill (GF-S1): the P0
  recalibration pre-registration"; push after each milestone; merge
  yourself when the exit gate holds; CI green on main verified. P0
  deploys nothing.

EXIT GATE
docs/specs/gold-meter-gapfill/ exists (README + 01-FILL-SPEC + PROGRESS
+ PROMPTS); the calibration report committed with its runnable record;
the proposed voter set stated in new read-only tables beside the frozen
ones (no product code); the lane-rule re-derivation + the OI-GA-2
lane-count scenarios + the D-1 threshold proposal delivered; the
owner's decision list printed; the GF-S2 prompt written, committed,
pushed and printed (D-GA-9). The owner's recorded go on the proposed
voter set closes P0 — if the owner is not reachable in-session, the GA
lock-fallback precedent applies (deliver everything deliverable, print
the decision list, re-issue).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```
