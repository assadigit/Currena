# PROMPTS — the gold meter gap-fill program

The session plan, one block per session, each ending with the FULL next
session's prompt (the D-GA-9 convention handed over from the audit program:
rewritten here, committed, pushed, and printed in the final message — never
end a session without one). The authoritative record is PROGRESS.md; if a
prompt disagrees with it, PROGRESS.md wins and the prompt gets rewritten.

## GF-S1 — the P0 recalibration pre-registration (RUN 2026-11-05 — P0 DELIVERED, awaiting the owner's go; superseded by the GF-S2 prompt below)

The kickoff prompt, verbatim (from the audit program's PROMPTS.md, the
GA-S4 close-out's handover):

```
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

## GF-S2 — the decision-list re-issue + the P1 repairs on the owner's recorded go (RUN 2026-11-05 — the lock-fallback path: the re-issue delivered, the lane-rule question added to the living list, NO owner answers recorded; superseded by the GF-S3 prompt below)

The kickoff prompt, verbatim (from the GF-S1 close-out's handover):

```
You are working in the Currena repo at the repo root. This is the GF-S2
session of the gold meter gap-fill program (the owner-gated successor to
the CLOSED gold meter audit program; the program home:
docs/specs/gold-meter-gapfill/ — README + 01-FILL-SPEC + PROGRESS +
PROMPTS; the audit's verdict: docs/insights/GOLD-METER-AUDIT-REPORT.md).
Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
GF-S1 (2026-11-05) delivered the P0 recalibration pre-registration:
the program home; the proposed voter set in NEW read-only harness tables
beside the frozen ones (packages/insights/src/gf-p0-proposed.ts — the
equivalences pinned by test, gf-p0-proposed.test.ts 14/14); the
calibration with its runnable record (docs/specs/gold-meter-gapfill/
evidence/gf-p0-calibration-2026-11-05.md + gf-p0-run-2026-11-05.txt +
the fixtures gf-p0-candidates.json · gf-p0-cftc-backfill.json). The
FROZEN baseline reproduced BACKTEST-GOLD-LANES.md cell-for-cell (the
drift gate asserted). THE HEADLINE FINDINGS, all measured:
(1) THE LANE RULE: the FROZEN set re-affirms MIN2 (C1 PASS · C2 PASS,
all windows) — but EVERY proposed set FAILS the pre-registered C2 on
the all-windows scope under BOTH crowd rules (the repairs/promotions
smooth each set's own net sign to 7 flips/60td while the lane verdict
holds 8–10) → the GB 02 §6 protocol's own STOP branch: the min-firing
rule for the proposed sets is NOT selectable on this corpus — the
numbers come to the owner (report §4).
(2) OI-GA-2: the F-family's firing statistics are real over the
backfilled history (F1 fires 1008/2512, the F2 proxy 1055/2512); the
flows lane votes in 759/2512 windows (30.2%) under MIN2 — both lane
counts measured.
(3) THE D-1 THRESHOLDS: five derived values (fed-expectations 0.13 pts
· usdjpy 1.38 pct · fed-target 0.25 pts — the FOMC step grid ·
term-premium-10y 0.07 pts · t5yie 0.10 pts) + the 22-seat
accept-with-note walk.
NOTHING EXECUTES WITHOUT THE OWNER'S RECORDED GO (D-GF-1). No decisions
were recorded before GF-S1's close.

WHAT THIS SESSION IS
GF-S2: THE DECISION-LIST RE-ISSUE — the owner's answers gate
everything. Session shape: (1) present the decision list to the owner
(the report §8 + the README's list + the NEW lane-rule question the
calibration opened — see below); (2) if the owner records answers
in-session, execute what the answers gate — the P1 repairs (01-FILL-SPEC
§1) if the go is recorded per item, else the deliverable halves only;
(3) if the owner is not reachable, deliver everything deliverable and
re-issue (the GA lock-fallback precedent).

THE DECISION LIST (the owner's recorded answers, one by one)
A. THE LANE RULE FOR THE PROPOSED SETS (the C2 STOP branch — the
   calibration's new question): the pre-registered criteria (GB 02 §6,
   unchanged) reject every proposed set on the all-windows scope. The
   owner's options, each owner-gated: (a) keep the criteria and the
   MIN2 rule as the default for the proposed sets on judgment (the
   measured shape: richer lanes vote more — the price of the coverage;
   the absolute smoothness stays comparable: 9–10 vs the frozen 8
   flips/60td); (b) amend the criteria (an owner-recorded amendment
   with its date — e.g. re-basing C2's comparison on the FROZEN
   production net sign, or a flips ceiling) and re-run the calibration
   before any new seat counts; (c) hold the promotions. NOTHING SHIPS
   ON (a) WITHOUT THE RECORDED CHOICE.
B. OI-GA-2 — the fifth lane: ADD recommended (the audit) + both
   compositions now measured (the flows lane votes 30.2% of windows
   post-backfill, MIN2); the GOLD_LANE_STRONG re-statement (3-of-4 →
   3-of-5 or 4-of-5) rides the decision.
C. OI-GA-3 — the D5/S6 shadow promotions (both seats' firing stats
   measured).
D. OI-GA-4 — WGC quarterly: context-first recommended.
E. OI-GA-5 — EODHD: no use proposed.
F. OI-GA-6 — copy rounds 79+ (standing).
G. N-1 — euro-hicp: AMEND recommended (the denominator becomes 86).
H. THE D-7/D-8 SIGN DECISION — context demotion recommended (both
   variants measured: POST-P1 and POST-P1-DEMOTE).
I. THE D-18 READABLE-RULE QUESTION — the input-presence rule
   recommended (its measured effect: 6 windows over the frozen basis;
   nil once the backfill lands).
J. THE D-1 THRESHOLDS — the five derived values (the GF-P1 proposal;
   the derivation + the walk: the report §3).
K. THE 12 ZERO-NEW-FETCH GO/NO-GOS — R9 · I3 · I10 · S4 · S7 · S8 ·
   S13 · G1 · X7 · F2 · D7 · I11 (PROMOTE ×8 · CONTEXT ADD ×3 · D7
   seat-or-context; every promotion's firing stats measured: report
   §6).

WORK ITEMS (in order)
1. READ FIRST: docs/specs/gold-meter-gapfill/ (README + 01-FILL-SPEC +
   PROGRESS + the calibration report §1–§9 + the run record) +
   docs/insights/GOLD-METER-AUDIT-REPORT.md §4–§6 + the GF-P0 harness
   module + the fixtures. Then git pull --rebase.
2. PRINT the decision list for the owner (the final message carries
   it). If the owner answers in-chat: record each answer (the decision
   log + PROGRESS), then execute what the answers gate.
3. IF THE GO IS RECORDED — GF-P1 (the repairs, 01-FILL-SPEC §1):
   R6 the fed-expectations threshold (D-2, 0.13 pts) · D4 the usdjpy
   threshold (D-3, 1.38 pct) · R4 the yield-curve sign execution
   (D-7/D-8 per the recorded choice) · R10 the gap-series persistence
   (D-6) · F1 the CFTC archive backfill (D-4 — the recorder's parse is
   the design's head start) + the D-18 readable-rule fix (I) + the
   X1 gold-silver base deepening (D-5). Every edit per the per-seat
   approval rule; the recalibration re-runs after the set changes
   (D-GF-6); tests + the honesty suite green; branch gf/p1-repairs.
4. IF THE GO IS NOT RECORDED: deliver the deliverable halves (the
   report/record updates only), re-issue the decision list, and write
   the GF-S3 prompt (the re-issue again, or P1 if the answers arrive).

CONSTRAINTS (standing, every session of this program — README D-GF-1..9)
- THE PER-SEAT APPROVAL RULE: every gold-score.ts / GOLD_LANE_VOTERS
  edit requires the owner's RECORDED approval per seat change — the
  audit report's §4 row is the justification attached to each.
- The beam formula, the honesty rules and the no-edge record are
  inherited UNCHANGED; no forecasting claim anywhere — copy says
  "conditions"; every number from a run or a citation; free-first
  (EODHD only with the owner's recorded per-item approval — none
  proposed); the taxonomy stays LOCKED (N-1's AMEND is an
  owner-recorded amendment with its date).
- Branch gf/p1-repairs for P1; PR early; pnpm gates green before every
  push; self-merge when the exit gate holds; CI green on main verified;
  deploy only when the built worker changes.

EXIT GATE
The decision list printed (A–K); the owner's answers recorded if given;
if the P1 go is recorded: the repairs executed (D-2 · D-3 · D-7/D-8 per
the choice · D-6 · D-4 + D-18 · D-5), the recalibration re-run, tests +
gates green, PR merged; else: the deliverable halves + the re-issue. The
GF-S3 prompt written, committed, pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```

## GF-S3 — the decision-list re-issue again, with the P1 pivot on the owner's recorded answers (the live kickoff)

```
You are working in the Currena repo at the repo root. This is the GF-S3
session of the gold meter gap-fill program (the owner-gated successor to
the CLOSED gold meter audit program; the program home:
docs/specs/gold-meter-gapfill/ — README + 01-FILL-SPEC + PROGRESS +
PROMPTS; the audit's verdict: docs/insights/GOLD-METER-AUDIT-REPORT.md).
Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
GF-S1 (2026-11-05) delivered the P0 recalibration pre-registration:
the program home; the proposed voter set in NEW read-only harness tables
beside the frozen ones (packages/insights/src/gf-p0-proposed.ts — the
equivalences pinned by test, gf-p0-proposed.test.ts 14/14); the
calibration with its runnable record (docs/specs/gold-meter-gapfill/
evidence/gf-p0-calibration-2026-11-05.md + gf-p0-run-2026-11-05.txt +
the fixtures gf-p0-candidates.json · gf-p0-cftc-backfill.json). The
FROZEN baseline reproduced BACKTEST-GOLD-LANES.md cell-for-cell (the
drift gate asserted). THE HEADLINE FINDINGS, all measured:
(1) THE LANE RULE: the FROZEN set re-affirms MIN2 (C1 PASS · C2 PASS,
all windows) — but EVERY proposed set FAILS the pre-registered C2 on
the all-windows scope under BOTH crowd rules (the repairs/promotions
smooth each set's own net sign to 7 flips/60td while the lane verdict
holds 8–10) → the GB 02 §6 protocol's own STOP branch: the min-firing
rule for the proposed sets is NOT selectable on this corpus — the
numbers come to the owner (report §4).
(2) OI-GA-2: the F-family's firing statistics are real over the
backfilled history (F1 fires 1008/2512, the F2 proxy 1055/2512); the
flows lane votes in 759/2512 windows (30.2%) under MIN2 — both lane
counts measured.
(3) THE D-1 THRESHOLDS: five derived values (fed-expectations 0.13 pts
· usdjpy 1.38 pct · fed-target 0.25 pts — the FOMC step grid ·
term-premium-10y 0.07 pts · t5yie 0.10 pts) + the 22-seat
accept-with-note walk.
GF-S2 (2026-11-05, the lock-fallback path) re-issued the decision list
A–K — the NEW lane-rule question (A) now carried by the LIVING list
(the README's decision table, its first item — the one item the audit's
§5 could not carry, the question having opened at the calibration) —
and re-verified the environment fresh before writing (the calibration
reproduced the committed report byte-for-byte over the fixtures; the
pinned equivalence tests 14/14). NO OWNER ANSWERS WERE RECORDED before
GF-S2's close (the repo and the chat both verified) — the list stands
recorded-open on every item. NOTHING EXECUTES WITHOUT THE OWNER'S
RECORDED GO (D-GF-1).

WHAT THIS SESSION IS
GF-S3: THE DECISION-LIST RE-ISSUE AGAIN — with the P1 pivot if the
owner's answers have arrived. Session shape: (1) check for the owner's
recorded answers FIRST (the repo — git log since the GF-S2 merge, the
decision log, PROGRESS — and the session's chat); (2) present the
decision list to the owner (the final message carries it, with the
answer sheet — one line per item); (3) if the owner records answers
in-session (any subset: the answers gate per item): record each answer
(the decision log + PROGRESS), then execute what the answers gate —
the P1 repairs (01-FILL-SPEC §1) on the per-item go, the P2
composition questions on their own answers; (4) if no answers are
recorded, deliver the deliverable halves (the report/record updates
only) and re-issue again (the GA lock-fallback precedent, standing).

THE DECISION LIST (the owner's recorded answers, one by one)
A. THE LANE RULE FOR THE PROPOSED SETS (the C2 STOP branch — the
   calibration's question, now the living list's first item): the
   pre-registered criteria (GB 02 §6, unchanged) reject every proposed
   set on the all-windows scope. The owner's options, each owner-gated:
   (a) keep the criteria and the MIN2 rule as the default for the
   proposed sets on judgment (the measured shape: richer lanes vote
   more — the price of the coverage; the absolute smoothness stays
   comparable: 9–10 vs the frozen 8 flips/60td); (b) amend the
   criteria (an owner-recorded amendment with its date — e.g.
   re-basing C2's comparison on the FROZEN production net sign, or a
   flips ceiling) and re-run the calibration before any new seat
   counts; (c) hold the promotions. NOTHING SHIPS ON (a) WITHOUT THE
   RECORDED CHOICE — the P1 go rides this item (the STOP branch's own
   demand: the criteria cannot re-affirm the lane rule over the
   post-P1 set on their own).
B. OI-GA-2 — the fifth lane: ADD recommended (the audit) + both
   compositions now measured (the flows lane votes 30.2% of windows
   post-backfill, MIN2); the GOLD_LANE_STRONG re-statement (3-of-4 →
   3-of-5 or 4-of-5) rides the decision.
C. OI-GA-3 — the D5/S6 shadow promotions (both seats' firing stats
   measured).
D. OI-GA-4 — WGC quarterly: context-first recommended.
E. OI-GA-5 — EODHD: no use proposed.
F. OI-GA-6 — copy rounds 79+ (standing).
G. N-1 — euro-hicp: AMEND recommended (the denominator becomes 86).
H. THE D-7/D-8 SIGN DECISION — context demotion recommended (both
   variants measured: POST-P1 and POST-P1-DEMOTE).
I. THE D-18 READABLE-RULE QUESTION — the input-presence rule
   recommended (its measured effect: 6 windows over the frozen basis;
   nil once the backfill lands).
J. THE D-1 THRESHOLDS — the five derived values (the GF-P1 proposal;
   the derivation + the walk: the report §3).
K. THE 12 ZERO-NEW-FETCH GO/NO-GOS — R9 · I3 · I10 · S4 · S7 · S8 ·
   S13 · G1 · X7 · F2 · D7 · I11 (PROMOTE ×8 · CONTEXT ADD ×3 · D7
   seat-or-context; every promotion's firing stats measured: report
   §6).

WORK ITEMS (in order)
1. READ FIRST: docs/specs/gold-meter-gapfill/ (README — the decision
   list carries A as its first item; 01-FILL-SPEC; PROGRESS — the
   GF-S2 block; the calibration report §1–§9 + the run record) +
   docs/insights/GOLD-METER-AUDIT-REPORT.md §4–§6 + the GF-P0 harness
   module + the fixtures. Then git pull --rebase.
2. CHECK FOR THE OWNER'S ANSWERS FIRST: the repo (git log since the
   GF-S2 merge; the decision log; PROGRESS) and the session's chat. If
   answers are recorded (any subset), proceed to the execution item
   they gate; the unanswered items stay recorded-open and ride the
   re-issue.
3. PRINT the decision list for the owner (the final message carries
   it, with the answer sheet — one line per item, one recorded answer
   per line gates its half). If the owner answers in-chat: record each
   answer (the decision log + PROGRESS), then execute what the answers
   gate.
4. IF THE P1 GO IS RECORDED (with A's answer riding it — see A) —
   GF-P1 (the repairs, 01-FILL-SPEC §1): R6 the fed-expectations
   threshold (D-2, 0.13 pts) · D4 the usdjpy threshold (D-3, 1.38
   pct) · R4 the yield-curve sign execution (D-7/D-8 per the recorded
   choice) · R10 the gap-series persistence (D-6) · F1 the CFTC
   archive backfill (D-4 — the recorder's parse is the design's head
   start) + the D-18 readable-rule fix (I) + the X1 gold-silver base
   deepening (D-5). Every edit per the per-seat approval rule; the
   recalibration re-runs after the set changes (D-GF-6) — under the
   amended criteria first if A's answer is (b); tests + the honesty
   suite green; branch gf/p1-repairs.
5. IF THE GO IS NOT RECORDED: deliver the deliverable halves (the
   report/record updates only), re-issue the decision list, and write
   the GF-S4 prompt (the re-issue again, or P1 if the answers arrive).

CONSTRAINTS (standing, every session of this program — README D-GF-1..9)
- THE PER-SEAT APPROVAL RULE: every gold-score.ts / GOLD_LANE_VOTERS
  edit requires the owner's RECORDED approval per seat change — the
  audit report's §4 row is the justification attached to each.
- The beam formula, the honesty rules and the no-edge record are
  inherited UNCHANGED; no forecasting claim anywhere — copy says
  "conditions"; every number from a run or a citation; free-first
  (EODHD only with the owner's recorded per-item approval — none
  proposed); the taxonomy stays LOCKED (N-1's AMEND is an
  owner-recorded amendment with its date).
- Branch gf/p1-repairs for P1 (gf/s3-reissue for the docs-only
  re-issue); PR early; pnpm gates green before every push; self-merge
  when the exit gate holds; CI green on main verified; deploy only
  when the built worker changes.

EXIT GATE
The decision list printed (A–K); the owner's answers recorded if given;
if the P1 go is recorded: the repairs executed (D-2 · D-3 · D-7/D-8 per
the choice · D-6 · D-4 + D-18 · D-5), the recalibration re-run, tests +
gates green, PR merged; else: the deliverable halves + the re-issue. The
GF-S4 prompt written, committed, pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```
