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

## GF-S3 — the decision-list re-issue again, with the P1 pivot on the owner's recorded answers (RUN 2026-11-05 — the lock-fallback path repeated: the re-issue delivered again, the owner's answers checked first (none recorded in the repo or the chat), the environment re-verified fresh (the calibration byte-for-byte; the tests 14/14); superseded by the GF-S4 prompt below)

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

## GF-S4 — the decision-list re-issue again, with the P1 pivot on the owner's recorded answers (RUN 2026-11-05 — the lock-fallback path repeated: the re-issue delivered again (the fourth), the owner's answers checked first (none recorded in the repo or the chat — no commits after the GF-S3 merge), the environment re-verified fresh (the calibration byte-for-byte, git status clean; the tests 14/14); superseded by the GF-S5 prompt below)

```
You are working in the Currena repo at the repo root. This is the GF-S4
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
GF-S2's close. GF-S3 (2026-11-05, the lock-fallback path repeated)
checked for the answers FIRST (the repo — git log since the GF-S2 merge
held no commits after the merge itself; the decision log; PROGRESS —
and the session's chat: none recorded), re-verified the environment
fresh again (the calibration reproduced the committed report
byte-for-byte over the fixtures, git status clean after the run; the
pinned equivalence tests 14/14), re-issued the list A–K a THIRD time,
and delivered the deliverable halves (the report/record updates only).
NO OWNER ANSWERS WERE RECORDED before GF-S3's close (the repo and the
chat both verified) — the list stands recorded-open on every item.
NOTHING EXECUTES WITHOUT THE OWNER'S RECORDED GO (D-GF-1).

WHAT THIS SESSION IS
GF-S4: THE DECISION-LIST RE-ISSUE AGAIN — with the P1 pivot if the
owner's answers have arrived. Session shape: (1) check for the owner's
recorded answers FIRST (the repo — git log since the GF-S3 merge, the
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
   GF-S3 block; the calibration report §1–§9 + the run record) +
   docs/insights/GOLD-METER-AUDIT-REPORT.md §4–§6 + the GF-P0 harness
   module + the fixtures. Then git pull --rebase.
2. CHECK FOR THE OWNER'S ANSWERS FIRST: the repo (git log since the
   GF-S3 merge; the decision log; PROGRESS) and the session's chat. If
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
   the GF-S5 prompt (the re-issue again, or P1 if the answers arrive).

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
- Branch gf/p1-repairs for P1 (gf/s4-reissue for the docs-only
  re-issue); PR early; pnpm gates green before every push; self-merge
  when the exit gate holds; CI green on main verified; deploy only
  when the built worker changes.

EXIT GATE
The decision list printed (A–K); the owner's answers recorded if given;
if the P1 go is recorded: the repairs executed (D-2 · D-3 · D-7/D-8 per
the choice · D-6 · D-4 + D-18 · D-5), the recalibration re-run, tests +
gates green, PR merged; else: the deliverable halves + the re-issue. The
GF-S5 prompt written, committed, pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```

## GF-S5 — the decision-list re-issue again, with the P1 pivot on the owner's recorded answers (RUN 2026-11-05 — the lock-fallback path repeated: the re-issue delivered again (the fifth), the owner's answers checked first (none recorded in the repo or the chat — no commits after the GF-S4 merge), the environment re-verified fresh (the calibration byte-for-byte, git status clean; the tests 14/14); superseded by the GF-S6 prompt below)

```
You are working in the Currena repo at the repo root. This is the GF-S5
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
GF-S2's close. GF-S3 (2026-11-05, the lock-fallback path repeated)
checked for the answers FIRST (the repo — git log since the GF-S2 merge
held no commits after the merge itself; the decision log; PROGRESS —
and the session's chat: none recorded), re-verified the environment
fresh again, re-issued the list A–K a THIRD time, and delivered the
deliverable halves (the report/record updates only). GF-S4 (2026-11-05,
the lock-fallback path repeated again) checked for the answers FIRST
(the repo — git log over origin/main since the GF-S3 merge (85fe4e8)
held no commits after the merge itself and no branch newer than the
merge; the decision log; PROGRESS — and the session's chat: none
recorded), re-verified the environment fresh again (the calibration
reproduced the committed report byte-for-byte over the fixtures, git
status clean after the run; the pinned equivalence tests 14/14),
re-issued the list A–K a FOURTH time, and delivered the deliverable
halves (the report/record updates only). NO OWNER ANSWERS WERE RECORDED
before GF-S4's close (the repo and the chat both verified) — the list
stands recorded-open on every item. NOTHING EXECUTES WITHOUT THE
OWNER'S RECORDED GO (D-GF-1).

WHAT THIS SESSION IS
GF-S5: THE DECISION-LIST RE-ISSUE AGAIN — with the P1 pivot if the
owner's answers have arrived. Session shape: (1) check for the owner's
recorded answers FIRST (the repo — git log since the GF-S4 merge, the
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
   GF-S4 block; the calibration report §1–§9 + the run record) +
   docs/insights/GOLD-METER-AUDIT-REPORT.md §4–§6 + the GF-P0 harness
   module + the fixtures. Then git pull --rebase.
2. CHECK FOR THE OWNER'S ANSWERS FIRST: the repo (git log since the
   GF-S4 merge; the decision log; PROGRESS) and the session's chat. If
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
   the GF-S6 prompt (the re-issue again, or P1 if the answers arrive).

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
- Branch gf/p1-repairs for P1 (gf/s5-reissue for the docs-only
  re-issue); PR early; pnpm gates green before every push; self-merge
  when the exit gate holds; CI green on main verified; deploy only
  when the built worker changes.

EXIT GATE
The decision list printed (A–K); the owner's answers recorded if given;
if the P1 go is recorded: the repairs executed (D-2 · D-3 · D-7/D-8 per
the choice · D-6 · D-4 + D-18 · D-5), the recalibration re-run, tests +
gates green, PR merged; else: the deliverable halves + the re-issue. The
GF-S6 prompt written, committed, pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```

## GF-S6 — the decision-list re-issue again, with the P1 pivot on the owner's recorded answers (RUN 2026-11-05 — the lock-fallback path repeated: the re-issue delivered again (the sixth), the owner's answers checked first (none recorded in the repo or the chat — no commits after the GF-S5 merge), the environment re-verified fresh (the calibration byte-for-byte, git status clean; the tests 14/14); superseded by the GF-S7 prompt below)

```
You are working in the Currena repo at the repo root. This is the GF-S6
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
GF-S2's close. GF-S3 (2026-11-05, the lock-fallback path repeated)
checked for the answers FIRST (the repo — git log since the GF-S2 merge
held no commits after the merge itself; the decision log; PROGRESS —
and the session's chat: none recorded), re-verified the environment
fresh again, re-issued the list A–K a THIRD time, and delivered the
deliverable halves (the report/record updates only). GF-S4 (2026-11-05,
the lock-fallback path repeated again) checked for the answers FIRST
(the repo — git log over origin/main since the GF-S3 merge (85fe4e8)
held no commits after the merge itself and no branch newer than the
merge; the decision log; PROGRESS — and the session's chat: none
recorded), re-verified the environment fresh again (the calibration
reproduced the committed report byte-for-byte over the fixtures, git
status clean after the run; the pinned equivalence tests 14/14),
re-issued the list A–K a FOURTH time, and delivered the deliverable
halves (the report/record updates only). GF-S5 (2026-11-05, the
lock-fallback path repeated again) checked for the answers FIRST (the
repo — git log over origin/main since the GF-S4 merge (91d7fc1) held
no commits after the merge itself and no branch newer than the merge;
the decision log; PROGRESS — and the session's chat: none recorded),
re-verified the environment fresh again (the calibration reproduced
the committed report byte-for-byte over the fixtures, git status clean
after the run; the pinned equivalence tests 14/14), re-issued the list
A–K a FIFTH time, and delivered the deliverable halves (the
report/record updates only). NO OWNER ANSWERS WERE RECORDED before
GF-S5's close (the repo and the chat both verified) — the list stands
recorded-open on every item. NOTHING EXECUTES WITHOUT THE OWNER'S
RECORDED GO (D-GF-1).

WHAT THIS SESSION IS
GF-S6: THE DECISION-LIST RE-ISSUE AGAIN — with the P1 pivot if the
owner's answers have arrived. Session shape: (1) check for the owner's
recorded answers FIRST (the repo — git log since the GF-S5 merge, the
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
   GF-S5 block; the calibration report §1–§9 + the run record) +
   docs/insights/GOLD-METER-AUDIT-REPORT.md §4–§6 + the GF-P0 harness
   module + the fixtures. Then git pull --rebase.
2. CHECK FOR THE OWNER'S ANSWERS FIRST: the repo (git log since the
   GF-S5 merge; the decision log; PROGRESS) and the session's chat. If
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
   the GF-S7 prompt (the re-issue again, or P1 if the answers arrive).

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
- Branch gf/p1-repairs for P1 (gf/s6-reissue for the docs-only
  re-issue); PR early; pnpm gates green before every push; self-merge
  when the exit gate holds; CI green on main verified; deploy only
  when the built worker changes.

EXIT GATE
The decision list printed (A–K); the owner's answers recorded if given;
if the P1 go is recorded: the repairs executed (D-2 · D-3 · D-7/D-8 per
the choice · D-6 · D-4 + D-18 · D-5), the recalibration re-run, tests +
gates green, PR merged; else: the deliverable halves + the re-issue. The
GF-S7 prompt written, committed, pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```

## GF-S7 — the decision-list re-issue again, with the P1 pivot on the owner's recorded answers (RUN 2026-11-05 — **THE OWNER'S ANSWERS A–K ARRIVED AND WERE RECORDED + GF-P1 EXECUTED**: the answer sheet in the README's decision table (with the standing delegation); the repairs delivered on H/I/J + the data plane (the CFTC backfill · the gap persistence · the gold-silver deepening — the history keys written to production KV); the recalibration re-run (the committed report byte-for-byte + the gf-p1-verify evidence: production ≡ POST-P1-DEMOTE in ALL 2512 windows); the tests restated (insights 1310 · web 12617); superseded by the GF-S8 prompt below)

```
You are working in the Currena repo at the repo root. This is the GF-S7
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
GF-S2's close. GF-S3 (2026-11-05, the lock-fallback path repeated)
checked for the answers FIRST (the repo — git log since the GF-S2 merge
held no commits after the merge itself; the decision log; PROGRESS —
and the session's chat: none recorded), re-verified the environment
fresh again, re-issued the list A–K a THIRD time, and delivered the
deliverable halves (the report/record updates only). GF-S4 (2026-11-05,
the lock-fallback path repeated again) checked for the answers FIRST
(the repo — git log over origin/main since the GF-S3 merge (85fe4e8)
held no commits after the merge itself and no branch newer than the
merge; the decision log; PROGRESS — and the session's chat: none
recorded), re-verified the environment fresh again (the calibration
reproduced the committed report byte-for-byte over the fixtures, git
status clean after the run; the pinned equivalence tests 14/14),
re-issued the list A–K a FOURTH time, and delivered the deliverable
halves (the report/record updates only). GF-S5 (2026-11-05, the
lock-fallback path repeated again) checked for the answers FIRST (the
repo — git log over origin/main since the GF-S4 merge (91d7fc1) held
no commits after the merge itself and no branch newer than the merge;
the decision log; PROGRESS — and the session's chat: none recorded),
re-verified the environment fresh again (the calibration reproduced
the committed report byte-for-byte over the fixtures, git status clean
after the run; the pinned equivalence tests 14/14), re-issued the list
A–K a FIFTH time, and delivered the deliverable halves (the
report/record updates only). GF-S6 (2026-11-05, the lock-fallback path
repeated again) checked for the answers FIRST (the repo — git log over
origin/main since the GF-S5 merge (74de329) held no commits after the
merge itself and no branch newer than the merge; the decision log;
PROGRESS — and the session's chat: none recorded), re-verified the
environment fresh again (the calibration reproduced the committed
report byte-for-byte over the fixtures, git status clean after the
run; the pinned equivalence tests 14/14), re-issued the list A–K a
SIXTH time, and delivered the deliverable halves (the report/record
updates only). NO OWNER ANSWERS WERE RECORDED before GF-S6's close (the
repo and the chat both verified) — the list stands recorded-open on
every item. NOTHING EXECUTES WITHOUT THE OWNER'S RECORDED GO (D-GF-1).

WHAT THIS SESSION IS
GF-S7: THE DECISION-LIST RE-ISSUE AGAIN — with the P1 pivot if the
owner's answers have arrived. Session shape: (1) check for the owner's
recorded answers FIRST (the repo — git log since the GF-S6 merge, the
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
   GF-S6 block; the calibration report §1–§9 + the run record) +
   docs/insights/GOLD-METER-AUDIT-REPORT.md §4–§6 + the GF-P0 harness
   module + the fixtures. Then git pull --rebase.
2. CHECK FOR THE OWNER'S ANSWERS FIRST: the repo (git log since the
   GF-S6 merge; the decision log; PROGRESS) and the session's chat. If
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
   the GF-S8 prompt (the re-issue again, or P1 if the answers arrive).

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
- Branch gf/p1-repairs for P1 (gf/s7-reissue for the docs-only
  re-issue); PR early; pnpm gates green before every push; self-merge
  when the exit gate holds; CI green on main verified; deploy only
  when the built worker changes.

EXIT GATE
The decision list printed (A–K); the owner's answers recorded if given;
if the P1 go is recorded: the repairs executed (D-2 · D-3 · D-7/D-8 per
the choice · D-6 · D-4 + D-18 · D-5), the recalibration re-run, tests +
gates green, PR merged; else: the deliverable halves + the re-issue. The
GF-S8 prompt written, committed, pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```

## GF-S8 — the P2 promotions on the owner's recorded answers (RUN 2026-11-05 — **GF-P2 EXECUTED**: the twelve seats + the COBD pair + the flows lane + GOLD_LANE_STRONG 4-of-5 + the N-1 v1.2 amendment (the denominator 86) + the D7 usdchf context card + the F2 REAL OBJECT (the in-session design decision under the standing delegation, recorded in PROGRESS's GF-S8 block); the D-GF-6 recalibration (the committed report byte-for-byte + the NEW gf-p2-verify evidence: production ≡ POST-P2-5LANE in ALL 2512 windows, the F2 id mapping recorded); the tests restated (insights 1311 · web 12617 — the full suite 14,602); copy round-79 triaged, copy:audit clean; superseded by the GF-S9 prompt below)

```
You are working in the Currena repo at the repo root. This is the GF-S8
session of the gold meter gap-fill program (the owner-gated successor to
the CLOSED gold meter audit program; the program home:
docs/specs/gold-meter-gapfill/ — README + 01-FILL-SPEC + PROGRESS +
PROMPTS; the audit's verdict: docs/insights/GOLD-METER-AUDIT-REPORT.md).
Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
GF-S7 (2026-11-05) recorded the owner's answers to EVERY item of the
decision list (A–K, in-chat, with the standing delegation: "Generally, I
trust your decisions. go full autonomously." — the answer sheet: the
README's decision table) and EXECUTED GF-P1 on the recorded go: the
D-7/D-8 context demotion (the 21-voter table became 19: 6/3/5/5), the
five derived thresholds in the production SIGNAL_LEG_MOVE (J), the D-18
input-presence rule (I), and the data plane (the CFTC archive parse
production-owned + the one-off gf-p1-backfill — the three history keys
written to production KV; the rung-2 gap persistence repair; the
gold-silver base deepening over Yahoo GC=F÷SI=F). The D-GF-6
recalibration re-ran: the committed calibration report reproduces
byte-for-byte AND the new gf-p1-verify evidence pins the production
engine ≡ the measured POST-P1-DEMOTE scenario in ALL 2512 windows (MIN2
all: C1 PASS · C2 FAIL 8 vs 7 — the owner's recorded A resolves the STOP
branch on judgment: keep the criteria + MIN2). The lineage is preserved
verbatim (HARNESS_GOLD_VOTERS_21 + GF_VOTERS_FROZEN_21) and pinned.
THE RECORDED ANSWERS THAT GATE THIS SESSION (the README's decision
table is the authority): B — ADD the flows lane + GOLD_LANE_STRONG =
4-of-5 (80% — preserves the 75% strictness); C — PROMOTE D5
(usd-reserve-share) + S6 (sp500-breadth-ratio); G — N-1 AMEND (the
euro-hicp taxonomy amendment, owner-recorded with its date — the
denominator becomes 86 and the arithmetic restates downstream); K —
PROMOTE the twelve zero-new-fetch seats: R9 (term-premium-10y) · S4
(ebp) · G1 (us-deficit-12m) · R8 (t5yie) · S13 (michigan-sentiment —
polarity note: pessimism reads gold-positive) · S7 the DAILY object
(gpr-daily; the monthly gpr-index alternative fires 1114) · S8 (epu-us;
the tpu-us alternative fires 1259 — a one-seat swap recorded as the
alternative) · I3 (michigan-1y-expectations) · F2 (the gross CFTC legs —
rides F1's backfill; the one-seat-or-two question and the gross-short
complement are the design questions) · I7 (m2-us) · G4 (nyfed-custody).
D7: CONTEXT CARD first (the seat question stays recorded-open). I10 ·
X7 · I11: CONTEXT ADDS (GF-P4). D (OI-GA-4): WGC quarterly
context-first. E (OI-GA-5): EODHD — NO USE, zero calls any phase.

WHAT THIS SESSION IS
GF-P2 — THE PROMOTIONS (01-FILL-SPEC §1, ranks 6–18 + the COBD pair):
the twelve promote seats + the flows lane (B) + the GOLD_LANE_STRONG
re-statement + the N-1 amendment (G). The composition the calibration
measured as POST-P2-5LANE: 32 seats (borrowing-costs 6 · dollar 5 ·
stress 10 · inflation 9 · flows 2) — GF_VOTERS_5LANE in
gf-p0-proposed.ts is the measured table (every seat line cites its §4
row); F2's seat there is the SCENARIO PROXY (the harness-local
gf-f2-gross-long-share id) — the P2 design names the real object (the
gross-long share parse from the same deafut.txt, or the proxy promoted
as-is with the id renamed — the design decision to record in-session).
The R9/t5yie thresholds already live in SIGNAL_LEG_MOVE (executed at
P1); the promotions ACTIVATE them. Session shape: (1) read-first +
git pull --rebase; (2) the F2 design decision recorded in-session (the
owner's delegation covers it — record the choice + its reason in
PROGRESS); (3) execute: the voter-table promotions into GOLD_LANE_VOTERS
+ GOLD_LANES gains 'flows' (the fifth lane — the engine, the beam
formula is lane-count-agnostic) + GOLD_LANE_STRONG = 4 (of 5) + the N-1
taxonomy amendment (docs/specs/gold-meter-audit/ 02's amendment record +
the denominator 86 restatement wherever the report arithmetic cites it)
+ the S8/S7 object seats per the recorded answers (epu-us + gpr-daily)
+ the D7 context card (I10/X7/I11 are P4 — NOT this session); (4) the
D-GF-6 recalibration re-runs BEFORE the new seat counts anywhere: the
calibration script re-verified byte-for-byte + the gf-p1-verify extended
(or a gf-p2-verify twin) pinning production ≡ POST-P2-5LANE
window-for-window over the corpus + the fixtures; (5) the tests + the
honesty suite restated (the same discipline as GF-S7: every delta traced
to a recorded answer); (6) the UI copy: the fifth lane's member lines
render from the engine (the laneNames/voterNames dictionaries need the
'flows' lane name + the new voters' names — EN+fa, the copy:audit gate);
GOLD_LANE_STRONG 4-of-5 changes the Outlook's strong bar (the
goldOutlookOf STRONG constant is 3-of-4 today — it becomes 4 with 5
lanes; the Outlook copy states the same words).

WORK ITEMS (in order)
1. READ FIRST: docs/specs/gold-meter-gapfill/ (README — the answer
   sheet; 01-FILL-SPEC §1 P2; PROGRESS — the GF-S7 block;
   evidence/gf-p1-verify-2026-11-05.md) + the audit report §4 (the
   promotion rows) + the calibration report §5–§7 (the per-seat firing
   tables + the POST-P2 compositions) + gf-p0-proposed.ts
   (GF_VOTERS_5LANE) + the engines. Then git pull --rebase.
2. THE F2 DESIGN DECISION (recorded in-session under the standing
   delegation): the real object for the gross-long share — the
   production parse of the same deafut.txt row's NonComm Long ÷ OI (the
   recorder's fixture records both gross legs) — or the proxy promoted
   as-is. Record the choice + reason in PROGRESS; cite the §4 row.
3. EXECUTE THE PROMOTIONS: every seat change per the per-seat approval
   rule (the audit §4 row = the justification, the README's recorded
   answer = the go). The F1 re-seat to flows (D-14's repair — cftc
   leaves stress for the new lane). The N-1 amendment with its date.
4. THE RECALIBRATION (D-GF-6 — BEFORE the new seat counts ship): the
   committed calibration report re-run (byte-for-byte) + the production
   ≡ POST-P2-5LANE pin window-for-window + the C1/C2 verdicts restated
   (the committed numbers: MIN2 all — level 24.2% · full-tip 16.0% · C1
   PASS · C2 FAIL 10 vs 7 — the owner's recorded A already resolves the
   shape on judgment; state it, never narrate it away).
5. THE TESTS + COPY: the engine pins restated (the GF-S7 discipline);
   the dictionaries gain the flows lane + the new voters (EN+fa); the
   Outlook strong bar 4-of-5; copy:audit clean.
6. GATES + CLOSE-OUT: pnpm gates green; the PR; self-merge when the
   exit gate holds; CI green on main verified; PROGRESS block +
   milestone row (P2 DELIVERED); CHANGELOG [2026-11-05l]; the GF-S9
   prompt written (P3 — the new free sources: R2 DFII5 (unlocks
   D-11/D-12's derived real curve — the D-7/D-8 sign question re-opens
   with the correct object) · D2 DTWEXBGS · D9 DTWEXEMEGS · F6 the
   Shanghai premium · F3/F4/F13 per OI-GA-4's context-first answer · F7
   · S9 DPCREDIT · I4 · I9); AGENT_HANDOFF restated; the final message =
   the printed GF-S9 prompt + the 5-line summary.

CONSTRAINTS (standing, every session of this program — README D-GF-1..9)
- THE PER-SEAT APPROVAL RULE: every gold-score.ts / GOLD_LANE_VOTERS
  edit requires the owner's RECORDED approval per seat change — the
  audit report's §4 row is the justification attached to each; the
  README's decision table IS the recorded go for every promotion this
  session names.
- The beam formula, the honesty rules and the no-edge record are
  inherited UNCHANGED; no forecasting claim anywhere — copy says
  "conditions"; every number from a run or a citation; free-first
  (EODHD: zero calls — the owner's recorded E); the taxonomy's N-1
  amendment is owner-recorded with its date (D-GF-7).
- P0 wraps every voter-set change (D-GF-6): the recalibration re-runs
  BEFORE the new seat counts anywhere.
- Branch gf/p2-promotions; PR early; pnpm gates green before every
  push; self-merge when the exit gate holds; CI green on main verified;
  deploy only when the built worker changes (D-GF-9).

EXIT GATE
The promotions executed (the twelve seats + the flows lane + STRONG
4-of-5 + the N-1 amendment); the recalibration re-run (byte-for-byte +
the production ≡ POST-P2-5LANE pin); tests + copy:audit + gates green;
PR merged; CI green on main. The GF-S9 prompt written, committed,
pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```

## GF-S9 — the P3 new free sources (RUN 2026-11-06 — **GF-P3 EXECUTED**: the four FRED-sourced voter-candidates seated owner-gated through the MEASURED POST-P3-5LANE scenario (the F2 precedent) → GOLD_LANE_VOTERS 32→36 (7/7/11/9/2); the 3 WGC/official flows context cards (F3/F4/F13) landed rule:info per OI-GA-4; the D-11/D-12 real-curve sign question printed as a DECISION LIST item (never seated silently); the harness-first discipline (D-GF-6): gf-p3-record-candidates + the calibration re-run (the existing 5 byte-for-byte + POST-P3-5LANE measured: MIN2 all 27.1%/11.9%/C1 PASS/C2 FAIL 10v8) + the gf-p3-verify twin (production ≡ POST-P3-5LANE in ALL 2512 windows); the tests 14,603 + copy round 80 (81 strings, clean) + gates ALL GREEN; superseded by the GF-S10 prompt below)

```
You are working in the Currena repo at the repo root. This is the GF-S9
session of the gold meter gap-fill program (the owner-gated successor to
the CLOSED gold meter audit program; the program home:
docs/specs/gold-meter-gapfill/ — README + 01-FILL-SPEC + PROGRESS +
PROMPTS; the audit's verdict: docs/insights/GOLD-METER-AUDIT-REPORT.md).
Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
GF-S8 (2026-11-05) EXECUTED GF-P2 on the owner's recorded answers
B/C/G/K (the README's decision table is the authority): the 32-seat
five-lane voter table (borrowing-costs 6 · dollar 5 · stress 10 ·
inflation 9 · flows 2 — the measured POST-P2-5LANE composition; the F2
seat is the REAL OBJECT cftc-gold-gross-long, the in-session design
decision under the standing delegation, its reason recorded in
PROGRESS's GF-S8 block), GOLD_LANE_STRONG = 4-of-5 (the Outlook's strong
bar moved with the lane count), the N-1 taxonomy amendment (v1.1 →
v1.2: the N-A1 euro-area realised-inflation row recorded with its date,
the denominator 86 restated downstream), the D7 usdchf CONTEXT CARD
(the seat question stays recorded-open), and the F2 data plane (the
production parse of both gross legs from the same deafut.txt Saturday
fetch + the one-off gf-p2-backfill: 522 points WRITTEN to production
KV, read-back verified). The D-GF-6 recalibration re-ran BEFORE the new
seat counts anywhere: the committed calibration report re-verified
byte-for-byte AND the new gf-p2-verify evidence pins the production
engine ≡ the measured POST-P2-5LANE scenario (the F2 id mapping
recorded: cftc-gold-gross-long ↔ gf-f2-gross-long-share) in ALL 2512
windows — MIN2 all: level 24.2% · full-tip 16.0% · C1 PASS · C2 FAIL
10 vs 7 (the owner's recorded A resolves the shape on judgment: keep
the criteria + MIN2; the failure is the recorded price of the coverage
— state it, never narrate it away). The registry drift the re-run
surfaced (the GF-P1 D-5 gold-silver Yahoo legs) was resolved by the
gold-oil-ratio A-4 precedent (the owner-display override; the card
stays public; the M-2 public-history bound follows automatically).
The standing delegation from GF-S7 remains on record: "Generally, I
trust your decisions. go full autonomously."

WHAT THIS SESSION IS
GF-P3 — THE NEW FREE SOURCES (01-FILL-SPEC §1, ranks 19–22, 24–28,
32–33): R2 DFII5 (the 5y real yield — the belly where policy bites
first; UNLOCKS D-11/D-12's derived real curve, which RE-OPENS the
D-7/D-8 sign question with the correct object — the yield-curve seats
are context cards since P1, the question recorded-open) · D2 DTWEXBGS
(the trade-weighted dollar — "the honest inverse") · D9 DTWEXEMEGS
(the EME dollar — the marginal buyer's leg) · F6 the Shanghai premium
derivation (SGE Au9999 × gold-api XAU × Frankfurter USD/CNY — "the
classic scarcity tell") · F3/F4/F13 the WGC/official flows (per
OI-GA-4's recorded CONTEXT-FIRST answer — context cards with recorded
promotion criteria (annualised-level extreme bands) revisit-able once
the cards exist; NEVER voters this session) · F7 the India parity ·
S9 DPCREDIT (the bank-facility usage — the modern bank-run tell) · I4
the UoM SIE portal (the 5–10y household anchor) · I9 the
nowcast-surprise derivation. Each lands with its licence row (L0/L1
rules), its rung, its staleness window — the free-first discipline
inherited (EODHD: zero calls — the owner's recorded E).

SESSION SHAPE
(1) read-first + git pull --rebase (the program home + the GF-S8
block + the gf-p2-verify evidence + the audit report §4 rows 19–28,
32–33 + the licences register + the adapters/rung patterns the
backlog's sources ride); (2) wire the sources phase by phase — every
NEW VOTER seat (R2's real-yield-5y? D2/D9's dollar seats? F6's flows
seat? S9's stress seat? I4's inflation seat?) is OWNER-GATED per the
per-seat approval rule: the §4 row is the justification, but P3's
compositions were NEVER measured by the calibration — a new seat
requires the D-GF-6 recalibration FIRST (extend the harness scenario
family with the P3 composition, re-run the calibration over the
fixtures, THEN seat; the no-silent-change rule D-GF-1); the CONTEXT
cards (F3/F4/F13 per the recorded D) need no recalibration but DO
need the EN+fa copy (round 80+ per OI-GA-6's standing rule); (3) the
D-11/D-12 derived real curve (DGS10-style nominal × the DFII family →
the real curve object): its derivation follows R2's fill; the sign
question it re-opens is a DECISION LIST item — measure both variants
in the harness, print the question for the owner, never seat a sign
silently; (4) the tests + the honesty suite restated (the GF-S8
discipline: every delta traced to a recorded answer or a measured
scenario); (5) the gates + the close-out.

WORK ITEMS (in order)
1. READ FIRST: the program home (README — the answer sheet + the
   GF-S8 execution notes; 01-FILL-SPEC §1 P3; PROGRESS — the GF-S8
   block; PROMPTS — this prompt) + evidence/gf-p2-verify-2026-11-05.md
   + the audit report §4 rows 19–22, 24–28, 32–33 + the calibration
   report (the scenario family's shape — the P3 extension follows it)
   + the licences register (LICENCES.md / licences.ts) + the existing
   adapter patterns (fred.ts · goldapi.ts · yahoo.ts · frankfurter.ts
   · monthly-indexes.ts · the rung2/rung3/rung4 gates). Then git pull
   --rebase.
2. THE HARNESS FIRST (D-GF-6): extend gf-p0-proposed.ts with the P3
   scenario family (the P3 compositions over the corpus + fixtures —
   the new sources' histories recorded the gf-p0-record-candidates
   way where they are not already on the wire), re-run the
   calibration, commit the measured record BEFORE any production seat
   changes. The F2 real-object precedent is the pattern: the scenario
   seat and the production seat agree by construction.
3. WIRE THE SOURCES: each with its definition + adapter + rung +
   staleAfterDays + registry row + EN+fa card copy (round 80+,
   copy:audit clean) + the licence register row. The context-first
   family (F3/F4/F13) lands as CARDS with the recorded promotion
   criteria in their definitions' comments. R2's derived real curve
   (D-11/D-12) rides the DFII family; the sign question prints as a
   decision-list item with both variants measured.
4. THE SEATS (owner-gated, per the per-seat approval rule): seat ONLY
   what a measured P3 scenario covers; the recalibration re-runs
   BEFORE any new seat counts (the gf-p2-verify pattern extends — a
   gf-p3-verify twin pinning production ≡ the measured P3 scenario
   window-for-window).
5. THE TESTS + COPY: the engine pins restated; the dictionaries gain
   the new voters/cards (EN+fa); copy:audit clean.
6. GATES + CLOSE-OUT: pnpm gates green; the PR; self-merge when the
   exit gate holds; CI green on main verified; PROGRESS block +
   milestone row (P3 DELIVERED); CHANGELOG [2026-11-05m]; the GF-S10
   prompt written (P4 — the context additions with EN+fa copy round
   80+: I10 · X7 · I11 + the WGC family F5/F8/F11/F15/F16 · G3 · X5 ·
   R11 · F12 · H1–H4); AGENT_HANDOFF restated; the final message =
   the printed GF-S10 prompt + the 5-line summary.

CONSTRAINTS (standing, every session of this program — README D-GF-1..9)
- THE PER-SEAT APPROVAL RULE: every gold-score.ts / GOLD_LANE_VOTERS
  edit requires the owner's RECORDED approval per seat change — the
  audit report's §4 row is the justification attached to each. P3's
  seats ride the standing delegation ONLY through a MEASURED scenario
  (the harness-first discipline): no measured scenario, no seat.
- The beam formula, the honesty rules and the no-edge record are
  inherited UNCHANGED; no forecasting claim anywhere — copy says
  "conditions"; every number from a run or a citation; free-first
  (EODHD: zero calls — the owner's recorded E).
- P0 wraps every voter-set change (D-GF-6): the recalibration re-runs
  BEFORE the new seat counts anywhere.
- Branch gf/p3-new-sources; PR early; pnpm gates green before every
  push; self-merge when the exit gate holds; CI green on main
  verified; deploy only when the built worker changes (D-GF-9).

EXIT GATE
The new sources wired (the voter seats owner-gated through measured
scenarios; the context cards with their recorded promotion criteria);
the recalibration re-run (the extended scenario family committed + the
production ≡ scenario pin); tests + copy:audit + gates green; PR
merged; CI green on main. The GF-S10 prompt written, committed, pushed
and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```

## GF-S10 — the remaining P3 sources + the real-curve sign decision + the P4 context additions (RUN 2026-11-06 — **THE REMAINING P3 SOURCES + THE REAL-CURVE SIGN DECISION + THE P3 DEPLOY EXECUTED — the recovery landing of TWO interrupted sessions** (every claim re-verified from the recovery's own runs, the record in PROGRESS's GF-S10 block): I4 the UoM 5–10y anchor SEATED owner-gated through the MEASURED POST-P4-5LANE scenario → GOLD_LANE_VOTERS 36→**37 (7/7/11/10/2)**; the D-11/D-12 real curve landed as the CONTEXT CARD `real-curve-10y5y` with BOTH sign variants measured + the question PRINTED (a)–(d) — never seated silently; F6 the Shanghai premium context card + the SGE adapter + the rung-2 wiring + **the backfill EXECUTED** (507 trading days → 488 premium points in production KV, read-back verified; the L2 licence keeps it PRIVATE — question (e)); F7 recorded-open (MCX venue-blocked 403); I9 recorded-open (no nowcast history); F3/F4/F13 the data adapters honestly DO NOT land (the WGC terms REQUIRE written authorisation — question (f), the family licence-blocked); the P3 DEPLOY live-verified (the worker 4b8dcfc7; the earlier session's T-16/T-08 repairs verified; the fresh-snapshot verification: for 2 · against 2 · neutral 1 · unread 0, 5 of 5 lanes readable, the I4 seat firing at the 90th percentile); the gf-p4-verify twin (production ≡ POST-P4-5LANE in ALL 2512 windows; the calibration byte-for-byte); the recovery's repairs (T-19 ×12 · the sahm T-08 exemption + test · the governing-licence generator rule · the lane fixtures + snapshot over 37 · the budget 1572); the tests 14,605 + copy round 81 (45 strings, clean) + gates ALL GREEN; the P4 context additions did NOT run (budget spent on the recovery) — they ride GF-S11 with the owner's decision round; superseded by the GF-S11 prompt below)

```
You are working in the Currena repo at the repo root. This is the GF-S10
session of the gold meter gap-fill program (the owner-gated successor to
the CLOSED gold meter audit program; the program home:
docs/specs/gold-meter-gapfill/ — README + 01-FILL-SPEC + PROGRESS +
PROMPTS; the audit's verdict: docs/insights/GOLD-METER-AUDIT-REPORT.md).
Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
GF-S9 (2026-11-06) EXECUTED GF-P3 on the standing delegation ("Generally,
I trust your decisions. go full autonomously."): the four FRED-sourced
voter-candidates seated (R2 real-yield-5y DFII5 · D2 dollar-broad
DTWEXBGS · D9 dollar-eme DTWEXEMEGS · S9 bank-stress DPCREDIT) —
owner-gated through the MEASURED POST-P3-5LANE scenario (the F2
precedent: the harness seat and the production seat agree by
construction). GOLD_LANE_VOTERS 32→36 (7/7/11/9/2). The harness-first
discipline (D-GF-6) executed BEFORE any seat: gf-p3-record-candidates
fetched the 4 FRED series keyless → the candidates fixture extended (20
series); gf-p0-proposed gained GF_VOTERS_P3_5LANE + GF_MOVE_P3_PROPOSED
+ the POST-P3-5LANE scenario; the calibration re-run (the existing 5
byte-for-byte) measured POST-P3-5LANE: MIN2 all level 27.1% · full-tip
11.9% · C1 PASS · C2 FAIL 10 vs 8 (the owner's recorded A resolves the
shape on judgment — the failure is the recorded price of the coverage).
The gf-p3-verify twin: production ≡ POST-P3-5LANE in ALL 2512 windows.
The 3 WGC/official flows context cards (F3 wgc-etf-holdings · F4
wgc-cb-demand · F13 official-gold-demand) landed as rule:info cards
(OI-GA-4's recorded context-first answer; the promotion criteria —
annualised-level extreme bands — recorded in each definition's comments;
the data adapters DEFERRED to GF-S10). The D-11/D-12 real-curve sign
question (unlocked by R2's DFII5 fill) is a DECISION LIST item — printed
in the gf-p3-verify evidence §4, NEVER seated silently. Copy round 80
(81 strings, clean). Tests 14,603. Gates ALL GREEN. The GF-P3 build
changed the worker but the DEPLOY rides the owner's go (the GF-S8 worker
9311eaf3 stays live until the P3 deploy — the live verification deferred
to GF-S10's close).

WHAT THIS SESSION IS
GF-S10 — THREE TRACKS:
(1) THE REMAINING P3 SOURCES (01-FILL-SPEC §1, the ranks GF-S9 deferred):
F6 the Shanghai premium derivation (SGE Au9999 × gold-api XAU ×
Frankfurter USD/CNY — "the classic scarcity tell") · F7 the India parity
(Frankfurter INR + MCX delayed free-view) · I4 the UoM SIE portal (the
5–10y household anchor) · I9 the nowcast-surprise derivation (Cleveland
Fed nowcasts vs realised). Each lands with its licence row, its rung,
its staleness window — the free-first discipline inherited (EODHD: zero
calls). The WGC/official flows DATA ADAPTERS (F3/F4/F13 — the cards
exist from GF-S9; the data plane lands now: WGC XLSX + PBoC/SAFE tables
+ CBR).
(2) THE D-11/D-12 REAL-CURVE SIGN DECISION (the recorded-open decision-
list item): the derived real curve (DFII10 − DFII5, the 10y−5y real-yield
slope — R2's fill unlocked it) lands as a CONTEXT CARD (rule: info — the
slope displays as context). BOTH SIGN VARIANTS measured in the harness
(POST-P3-5LANE-REALCURVE-+ and POST-P3-5LANE-REALCURVE-- scenarios); the
sign question PRINTED for the owner. NEVER seat a sign silently — the
owner's recorded choice gates the seating (if any).
(3) THE P3 DEPLOY (D-GF-9 — the built worker changed at GF-S9): the web
app rebuilt + pnpm run deploy → the currena-api worker live; the live
end-to-end verification over the public snapshot (the 36-voter five-lane
engine, the four new seats firing on their cadences).
THEN if budget allows: P4 — THE CONTEXT ADDITIONS (01-FILL-SPEC §1,
ranks 30–31, 34–47): I10 the Jastram real gold price · X7 gold/platinum ·
I11 global liquidity · the WGC family F5/F8/F11/F15/F16 · G3 debt/GDP ·
X5 gold-vs-equities · R11 r-star · F12 · H1–H4. Each with EN+fa copy
(round 81+).

SESSION SHAPE
(1) read-first + git pull --rebase (the program home + the GF-S9 block +
the gf-p3-verify evidence + the audit report §4 rows 22, 24–27, 32–33 +
the licences register + the adapters/rung patterns the new sources ride);
(2) THE HARNESS FIRST (D-GF-6) for any NEW voter seat (F6's flows seat?
F7's? I4's? I9's?): extend gf-p0-proposed.ts with the new scenario family
(POST-P4-5LANE compositions), re-run the calibration, commit the
measured record BEFORE any production seat changes; the CONTEXT cards
(the real-curve sign card, the WGC data cards) need no recalibration but
DO need the EN+fa copy (round 81+); (3) the D-11/D-12 real-curve sign
question — measure BOTH variants in the harness, print the question for
the owner, NEVER seat a sign silently; (4) the tests + the honesty suite
restated (every delta traced to a recorded answer or a measured
scenario); (5) the P3 deploy (D-GF-9) + the live verification; (6) the
gates + the close-out.

WORK ITEMS (in order)
1. READ FIRST: the program home (README — the GF-S9 execution notes;
   01-FILL-SPEC §1 P3-remainder + P4; PROGRESS — the GF-S9 block; PROMPTS
   — this prompt) + evidence/gf-p3-verify-2026-11-06.md + the audit
   report §4 rows 22, 24–27, 32–33 + the calibration report + the
   licences register + the existing adapter patterns (fred.ts · goldapi.ts
   · frankfurter.ts · yahoo.ts · monthly-indexes.ts · the rung2/rung3/rung4
   gates). Then git pull --rebase.
2. THE P3 DEPLOY FIRST (D-GF-9): the GF-S9 build changed the worker but
   the deploy rode the owner's go. Deploy the 36-voter five-lane engine;
   the live end-to-end verification over the public snapshot (the four
   new seats firing on their cadences — real-yield-5y · dollar-broad ·
   dollar-eme daily, bank-stress weekly).
3. WIRE THE REMAINING P3 SOURCES: F6 (the SGE Au9999 adapter + the
   Shanghai premium derivation in derived.ts — SGE × XAU × USD/CNY) · F7
   (Frankfurter INR + the India parity derivation) · I4 (the UoM SIE
   portal adapter — free download, no API) · I9 (the nowcast-surprise
   derivation — Cleveland Fed nowcasts vs realised). The WGC/official
   flows DATA ADAPTERS (F3/F4/F13 — the WGC XLSX + PBoC/SAFE tables).
   Each with its definition + adapter + rung + staleAfterDays + registry
   row + EN+fa card copy (round 81+) + the licence register row.
4. THE D-11/D-12 REAL-CURVE SIGN DECISION: the derived real curve
   (DFII10 − DFII5) lands as a CONTEXT CARD (rule: info). BOTH sign
   variants measured in the harness (the POST-P3-5LANE-REALCURVE-±
   scenarios); the sign question PRINTED for the owner in the evidence.
   NEVER seat a sign silently — the owner's recorded choice gates the
   seating (if any).
5. THE SEATS (owner-gated, per the per-seat approval rule): seat ONLY
   what a measured P4 scenario covers; the recalibration re-runs BEFORE
   any new seat counts (the gf-p3-verify pattern extends — a gf-p4-verify
   twin pinning production ≡ the measured P4 scenario window-for-window).
6. THE TESTS + COPY: the engine pins restated; the dictionaries gain the
   new voters/cards (EN+fa); copy:audit clean.
7. GATES + CLOSE-OUT: pnpm gates green; the PR; self-merge when the
   exit gate holds; CI green on main verified; PROGRESS block +
   milestone row (the P3-remainder DELIVERED + P4 if it lands);
   CHANGELOG [2026-11-06a]; the GF-S11 prompt written (P4 the context
   additions if not finished, or P5 acceptance + flip); AGENT_HANDOFF
   restated; the final message = the printed GF-S11 prompt + the 5-line
   summary.

CONSTRAINTS (standing, every session of this program — README D-GF-1..9)
- THE PER-SEAT APPROVAL RULE: every gold-score.ts / GOLD_LANE_VOTERS
  edit requires the owner's RECORDED approval per seat change — the
  audit report's §4 row is the justification attached to each. The
  remaining P3 seats ride the standing delegation ONLY through a MEASURED
  scenario (the harness-first discipline): no measured scenario, no seat.
- The beam formula, the honesty rules and the no-edge record are
  inherited UNCHANGED; no forecasting claim anywhere — copy says
  "conditions"; every number from a run or a citation; free-first
  (EODHD: zero calls — the owner's recorded E).
- P0 wraps every voter-set change (D-GF-6): the recalibration re-runs
  BEFORE the new seat counts anywhere.
- Branch gf/p3-remainder-and-p4; PR early; pnpm gates green before every
  push; self-merge when the exit gate holds; CI green on main verified;
  deploy only when the built worker changes (D-GF-9).

EXIT GATE
The P3 deploy live-verified (the 36-voter engine over the public
snapshot); the remaining P3 sources wired (the voter seats owner-gated
through measured scenarios; the context cards with their recorded
promotion criteria); the real-curve sign question measured in both
variants + printed for the owner (never seated silently); the WGC/official
flows data adapters landed (the cards read live); tests + copy:audit +
gates green; PR merged; CI green on main. The GF-S11 prompt written,
committed, pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
```

## GF-S11 — the recorded decisions' execution + P4 the context additions (the live kickoff — the round-2 answers RECORDED 2026-11-07)

```
You are working in the Currena repo at the repo root. This is the GF-S11
session of the gold meter gap-fill program (the owner-gated successor to
the CLOSED gold meter audit program; the program home:
docs/specs/gold-meter-gapfill/ — README + 01-FILL-SPEC + PROGRESS +
PROMPTS; the audit's verdict: docs/insights/GOLD-METER-AUDIT-REPORT.md).
Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
GF-S10 (2026-11-06, the recovery landing of two interrupted sessions —
the record in PROGRESS's GF-S10 block + its post-close addendum)
delivered the P3 remainder whole: the 37-voter five-lane table
(7/7/11/10/2, MIN2, STRONG 4-of-5) + the real-curve + Shanghai-premium
context cards + the P3 deploy live-verified (the worker 4b8dcfc7: for 2
· against 2 · neutral 1 · unread 0, 5 of 5 lanes readable) + the
gf-p4-verify twin (production ≡ POST-P4-5LANE in ALL 2512 windows).
Tests 14,605; copy round 81; gates ALL GREEN; PR #42 merged; CI green
on main. THE OWNER'S ROUND-2 ANSWERS ARE NOW RECORDED (2026-11-07, the
chat round — the README's round-2 decision table IS the record, the
D-GF-1 mechanism; every answer on the agent's printed recommendation;
the standing delegation "Generally, I trust your decisions. go full
autonomously." stands):
(a) THE REAL-CURVE SIGN: KEEP THE CONTEXT CARD — no sign seats; the
    D-11/D-12 question CLOSES context-by-choice. No GOLD_LANE_VOTERS
    edit rides this answer.
(e) THE SGE DISPLAY CLASS: ACCEPTED FOR PUBLIC DISPLAY — the Shanghai
    premium card flips public (the L2 owner-acceptance, the
    Yahoo/Shiller precedent); F15 (the SGE monthly withdrawals)
    UNBLOCKS for P4.
(f) THE WGC AUTHORISATION: DRAFT IT — this session writes the
    authorisation-request draft for the owner's review + send
    (info@gold.org); the family stays context-blocked pending the
    reply.
I9: BUILD THE ACCUMULATOR — the standing start accepted (first
    surprise ~5 weeks in; the percentile base ~30 months; the maturity
    honestly stated in the copy).
F7: STAYS RECORDED-OPEN (zero cost; F6 Shanghai carries the
    physical-premium channel).
D7: THE USDCHF SEAT QUESTION CLOSED NO-SEAT — the context card
    stands (the dollar lane's 7 voters carry it).
THE P4 SCOPE: the 7-card committed family + F16 BAZG + F15 (via (e))
    — nine cards: I10 · X7 · I11 · G3 · F16 · F15 · X5 · R11 · F12,
    severity-ordered; the spill rides GF-S12 honestly.
P5: THE DEDICATED GF-S12 (the acceptance walk + the flip — the
    GF-S12 prompt this session writes).

WHAT THIS SESSION IS
GF-S11 — TWO TRACKS, the decisions first:
(1) EXECUTE THE RECORDED DECISIONS: the SGE display flip (the
    ownerAccepts record in the licence register + the registry
    regeneration + the T-15 projection unhide + the EN+fa copy + the
    notices row) · the I9 accumulator (the adapter + the accumulation
    rung + the rule:info card with the honest maturity copy) · the WGC
    authorisation-request DRAFT (committed under evidence/ + printed
    in the final message for the owner's review) · the closures
    standing (the (a) + D7 closure rows already sit in the README's
    round-2 table — verify, don't rewrite).
(2) P4 THE CONTEXT ADDITIONS (the nine cards): I10 the Jastram real
    gold price (derived: gold-usd ÷ the CPI index — both legs on the
    wire) · X7 gold/platinum (derived: gold-usd ÷ platinum) · I11
    global liquidity (FRED WALCL + the ECB/BoJ free legs) · G3
    debt/GDP (FRED GFDEGDQ188S, quarterly) · F16 the Swiss flow (BAZG
    SwissImpex — government open data, venue-verified live
    2026-11-05) · F15 the SGE withdrawals (the SGE monthly
    statistics — the class (e) just accepted) · X5 gold-vs-equities
    (Yahoo GLD/SPY, L2 owner-accepted) · R11 r-star (the NY Fed HLW
    quarterly xlsx) · F12 ETF short interest (the fund pages —
    licence-triage honestly, fail-closed if the class disappoints).
    Each with its definition + adapter + rung + staleAfterDays +
    registry row + licence row + EN+fa card copy (round 82+,
    copy:audit clean) — the context-first register (rule: info, never
    votes; the promotion criteria recorded in each definition's
    comments).
No GOLD_LANE_VOTERS edit is expected this session (no seat change was
approved anywhere in the round-2 answers). The built worker DOES change
(the display flip + the new cards' data plane) → DEPLOY per D-GF-9 +
the live verification over the public snapshot.

SESSION SHAPE
(1) read-first + git pull --rebase (the program home + the round-2
    decision table + the GF-S10 block + its post-close addendum + the
    gf-p4-verify evidence + the audit report §4 rows 30–31, 34–47 +
    the licences register's L2 owner-acceptance mechanism + the
    adapter patterns: the derived.ts pure functions, the rung-2
    wiring, the site-mode-overrides/T-15 projection);
(2) THE DECISION EXECUTIONS (the flip first — it unblocks F15's
    class): the SGE display flip end-to-end (register row → registry
    regeneration → overrides → copy → notices → tests); the I9
    accumulator; the WGC draft; the closures verified;
(3) P4 the context additions (severity-ordered; the spill recorded
    honestly if the budget runs out — the GF-S10 lesson);
(4) THE TESTS + COPY: the dictionaries gain the new cards (EN+fa,
    round 82); copy:audit clean; the fixture/snapshot pins restated
    where the data plane moved; the about-sources expectations
    restated for any new fetch-enabled source;
(5) GATES + CLOSE-OUT: pnpm gates green; the DEPLOY + the live
    verification over the public snapshot (the Shanghai premium card
    READABLE PUBLICLY for the first time — the flip's own acceptance
    check); the PR; self-merge when the exit gate holds; CI green on
    main verified; PROGRESS block + milestone rows (the round-2
    decisions EXECUTED + P4 DELIVERED); CHANGELOG [2026-11-07b]; the
    GF-S12 prompt written (P5 the acceptance walk + the flip — the
    dedicated session); AGENT_HANDOFF restated; the final message =
    the printed GF-S12 prompt + the 5-line summary + the WGC email
    draft printed for the owner's review.

WORK ITEMS (in order)
1. READ FIRST: the program home (README — the round-2 decision table;
   01-FILL-SPEC §1 P4 + §2 gates; PROGRESS — the GF-S10 block + the
   addendum) + evidence/gf-p4-verify-2026-11-06.md (§4–§5 the printed
   questions the round-2 table answers) + the audit report §4 (ranks
   30–31, 34–47) + the licences register + the adapter patterns. Then
   git pull --rebase.
2. THE SGE DISPLAY FLIP (the (e) execution): the licence register's
   SGE row gains the ownerAccepts record (2026-11-07); the registry
   regenerated (the card's display class flips public); the
   site-mode-overrides updated (the T-15 gate re-verified); the EN+fa
   copy; the THIRD_PARTY_NOTICES row; the live verification after the
   deploy (work item 8).
3. THE I9 ACCUMULATOR (the build): the adapter (the Cleveland Fed
   nowcast page — the current nowcasts, keyless, the honest UA); the
   accumulation design (the KV history appended per rung + the
   CPI-print join that derives the surprise when the realised print
   lands — the BLS schedule); the rule:info card with the honest
   maturity copy; the licence row; the fail-closed discipline.
4. THE WGC DRAFT (the (f) execution): the authorisation-request draft
   — who we are (currena.ir, the non-commercial informational gold
   meter), what we ask (the F3/F4/F13 + F5/F8/F11/F15/F16/H1–H4
   cards, attributed, no modification, no bulk redistribution), the
   contact — committed under evidence/ + printed in the final
   message. The family stays blocked; no fetch is wired.
5. THE CLOSURES VERIFIED: the (a) + D7 closure rows in the README's
   round-2 table stand as recorded (docs-only; no rewrite).
6. P4 THE CONTEXT ADDITIONS: the nine cards, severity-ordered (I10 ·
   X7 · I11 · G3 · F16 · F15 · X5 · R11 · F12); each with its full
   copy + licence row + adapter + rung + staleness; F12
   licence-triaged honestly (fail-closed if the fund pages' class
   disappoints — the card then stays 'awaiting data' with the verdict
   recorded).
7. THE TESTS + COPY: round 82 triaged (the new cards × the field
   set); copy:audit clean; the pins restated where the data plane
   moved.
8. GATES + CLOSE-OUT: pnpm gates green; the DEPLOY (the built worker
   changes) + the live verification (the Shanghai premium PUBLIC +
   the new cards readable); PR; self-merge when the exit gate holds;
   CI green on main verified; PROGRESS block + milestone rows;
   CHANGELOG [2026-11-07b]; the GF-S12 prompt written, committed,
   pushed and printed (D-GA-9); AGENT_HANDOFF restated; the final
   message = the printed GF-S12 prompt + the 5-line summary + the WGC
   draft.

CONSTRAINTS (standing, every session of this program — README D-GF-1..9)
- THE PER-SEAT APPROVAL RULE stands: NO GOLD_LANE_VOTERS edit this
  session (no seat change was approved — (a) keeps the real curve a
  card, D7 keeps usdchf a card). Any future seat change needs the
  recorded approval + the measured scenario + the P0 wrap first.
  NEVER seat a sign silently.
- The beam formula, the honesty rules and the no-edge record are
  inherited UNCHANGED; no forecasting claim anywhere — copy says
  "conditions"; every number from a run or a citation; free-first
  (EODHD: zero calls — the owner's recorded E).
- The I9 accumulator claims nothing predictive: the nowcast + the
  realised surprise display as conditions, with the maturity stated.
- Branch gf/s11-decisions-and-p4; PR early; pnpm gates green before
  every push; self-merge when the exit gate holds; CI green on main
  verified; deploy when the built worker changes (D-GF-9 — it does
  this session).

EXIT GATE
The recorded decisions executed (the SGE flip live-verified PUBLIC +
the I9 accumulator live + the WGC draft printed + the closures
standing); the P4 cards wired with their recorded promotion criteria +
copy + licence rows (the spill honestly recorded if the budget ran
out); tests + copy:audit + gates green; the deploy live-verified; PR
merged; CI green on main. The GF-S12 prompt (P5 the acceptance walk +
the flip) written, committed, pushed and printed (D-GA-9).

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary
+ the WGC draft printed for the owner.
```

## GF-S12 — P5: the acceptance walk + the program's close (the dedicated final session — written by GF-S11, 2026-11-07)

```
You are working in the Currena repo at the repo root. This is the GF-S12
session of the gold meter gap-fill program (the owner-gated successor to
the CLOSED gold meter audit program; the program home:
docs/specs/gold-meter-gapfill/ — README + 01-FILL-SPEC + PROGRESS +
PROMPTS; the audit's verdict: docs/insights/GOLD-METER-AUDIT-REPORT.md).
Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
GF-S11 (2026-11-07, the recovery landing of an interrupted session — the
record in PROGRESS's GF-S11 block) delivered the round-2 decisions whole
+ P4: the SGE display flip live (the Shanghai premium PUBLIC for every
visitor, the (e) acceptance) · the I9 accumulator live (the Cleveland
nowcasts + the CPI-print join, the standing start accepted) · the WGC
authorisation draft printed for the owner's review + send
(evidence/wgc-authorisation-draft-2026-11-07.md — the family stays
blocked pending the reply) · the nine P4 cards landed (I10 · X7 · I11 ·
G3 · F16 · F15 · X5 · R11 · F12 — F12 honestly fail-closed 'awaiting
data'; the recovery's own repairs recorded: the I11 ECB-leg conversion,
the F15 extractor + its 12 test suites, the I11 display verdict trail).
The meter stands at its FINAL fill-program shape: the 37-voter five-lane
table (7/7/11/10/2, MIN2, STRONG 4-of-5) — UNCHANGED since GF-S10 (no
seat change was approved anywhere in the round-2 answers) — beside the
full context register (184 ids · 130 rule:info cards). Tests 14,617;
copy round 82; gates ALL GREEN; the worker deployed + live-verified; PR
#44 merged; CI green on main.

WHAT THIS SESSION IS
GF-S12 = P5, the dedicated close: THE ACCEPTANCE WALK + THE FLIP. The
GB 04 §6 precedent, rewritten for this change set: the full acceptance
table over the program's own spec (every phase's gate re-verified from
runs, not memory) + the production matrix (the live meter state — every
voter + every context card over the fresh public snapshot) + the OPEN
QUESTIONS printed for the owner's final round + the program's close-out
records. Nothing user-visible ships this session beyond what the owner's
recorded answers already gated (the (e) flip and the P4 cards are LIVE
on their recorded goes — this session VERIFIES and CLOSES, it does not
add). The owner's recorded acceptance closes the program.

THE OPEN QUESTIONS TO PRINT (the session's own decision list — every one
on its printed recommendation, the round-2 precedent)
(a) THE CLEVELAND L2 CLASS: the I9 cards (cpi-nowcast + cpi-surprise)
    serve PRIVATE (the Bank's terms quote no affirmative reuse grant —
    the SGE-pre-(e) standing). RECOMMEND: accept for public display (the
    same L2 owner-acceptance the SGE class received — a derived
    conditions display from a central bank's own public page, attributed;
    or keep private until asked).
(b) THE X5 YAHOO CLASS: the gold-equities-ratio card serves PRIVATE (the
    Yahoo L2 class carries no public-display directive for these tiles).
    RECOMMEND: keep private (the Yahoo endpoints carry no licence; the
    standing class) — printed for completeness.
(c) THE WGC REPLY: if the owner has sent the draft + a reply arrived,
    record it and unlock the family per its terms; if not, the family
    stays blocked (the standing state — nothing owed).
(d) THE PROGRAM'S CLOSE: the acceptance itself — the meter's final
    shape accepted as the program's deliverable (the P5 flip), with the
    recorded-open items honestly listed (F7 MCX venue-blocked · F12
    fail-closed · the WGC family pending · the promotion criteria
    recorded in each context card's comments for any future program).

SESSION SHAPE
(1) read-first + git pull --rebase (the program home + the GF-S11 block
    + the gf-s11-verify evidence + the licence register);
(2) THE ACCEPTANCE WALK: the AC table over 01-FILL-SPEC §1's five
    phases (P0 the calibration + the owner's answers A–K + round-2 · P1
    the repairs · P2 the promotions · P3 the sources + the deploy · P4
    the context cards) — every cell re-verified from a run (the
    calibration re-run byte-for-byte; the gf-p4-verify twin re-run; the
    live snapshot walk); the production matrix (the 37 voters' live
    state + the context register's live state, from the fresh public
    snapshot);
(3) THE OPEN QUESTIONS printed (the decision list above);
(4) THE CLOSE-OUT RECORDS: the README's status line (the program
    CLOSED — the successor note: any future change is a NEW owner-gated
    program on the same per-seat discipline); PROGRESS final rows;
    CHANGELOG; AGENT_HANDOFF restated (the program closed, the site
    live, the open items recorded); the final prompt = NONE (the program
    ends) unless the owner's answers open new work — then the successor
    program's kickoff prompt per the D-GA-9 convention.

WORK ITEMS (in order)
1. READ FIRST: the program home (README — the round-2 table + the
   status line; 01-FILL-SPEC §1–§2; PROGRESS — the GF-S11 block) +
   evidence/gf-s11-verify-2026-11-07.md + the licence register. Then
   git pull --rebase.
2. THE ACCEPTANCE WALK (the AC table): write the acceptance table into
   the evidence pack (evidence/gf-p5-acceptance-YYYY-MM-DD.md) — every
   phase's gate re-verified from this session's own runs: the
   calibration re-run (byte-for-byte), the verify-twin re-run
   (production ≡ POST-P4-5LANE), the registry state, the copy state,
   the test state, the licence register audit (every row's evidence
   string present + dated).
3. THE PRODUCTION MATRIX: the fresh public snapshot walk — the engine
   over the live readings (the lane states), the P3/P4 cards' live
   values, the display classes verified on the wire (the Shanghai
   premium PUBLIC; the private classes absent from the projection).
4. THE OPEN QUESTIONS printed (the list above) — the README's decision
   table gains the round-3 rows when the answers arrive.
5. THE CLOSE-OUT: the records (the README status line CLOSED + the
   successor note; PROGRESS final rows + the program's own verdict
   block; CHANGELOG; AGENT_HANDOFF); commit, push, PR, merge when
   green; the final message = the acceptance table's summary + the
   printed open questions + the 5-line program summary.

CONSTRAINTS (standing, every session of this program — README D-GF-1..9)
- THE PER-SEAT APPROVAL RULE stands: NO GOLD_LANE_VOTERS edit this
  session (P5 verifies; it does not seat). Any future seat change needs
  the recorded approval + the measured scenario + the P0 wrap first.
  NEVER seat a sign silently.
- The beam formula, the honesty rules and the no-edge record are
  inherited UNCHANGED; no forecasting claim anywhere — copy says
  "conditions"; every number from a run or a citation; free-first
  (EODHD: zero calls).
- Branch gf/s12-acceptance-close; PR early; pnpm gates green before
  every push; self-merge when the exit gate holds; CI green on main
  verified; deploy only if the built worker changes (P5 should be
  docs+evidence only — if code changes, the D-GF-9 rule applies).

EXIT GATE
The acceptance table green (every phase's gate re-verified from runs);
the production matrix verified live; the open questions PRINTED for the
owner; the program's close-out records written (the README status line
+ PROGRESS + CHANGELOG + the handoff); PR merged; CI green on main. If
the owner's round-3 answers arrive mid-session, record them and execute
per their own scope (the round-2 precedent) — otherwise the program
closes with the questions standing.

AT THE END (the standing close-out, every session)
1. PROGRESS session block + milestone row; 2. CHANGELOG entry; 3. the
final prompt: NONE (the program closed) or the successor's kickoff
prompt per the owner's answers; 4. commit, push, PR, merge when green;
5. final message = the acceptance summary + the printed open questions
+ the 5-line program summary.
```
