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
| GA-S3 | The coverage matrix classified; the half-implementation defects | `ga/s3-matrix` | no |
| GA-S4 | The audit report + the fill-program design + its prompts | `ga/s4-report` | no |

A session that finishes early pulls the next milestone forward (the GB-S1
precedent). PROGRESS.md is the authoritative state.

---

## GA-S1 — the reference taxonomy: verify, sweep, lock-draft — RUN (2026-11-04)

Delivered: 02 is **v1** — 82 rows (v0 72 + 10 sweep adds − 0 strikes), every
row verified live, the sweep + pre-scan recorded; PROGRESS.md row A. The
runnable record: `packages/insights/scripts/ga-s1-fred-verify.sh`. **The
owner's lock (OI-GA-1) is still OPEN — the GA-S2 prompt below starts by
resolving it.**

---

## GA-S2 — the inventory + the wiring evidence pack (the live kickoff)

```
You are working in the Currena repo at the repo root. This is session GA-S2
of the gold meter audit program — the owner's continuation of the gold
program. Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
The gold balance consolidation program is COMPLETE and LIVE (closed
2026-11-04 at GB-S7; its record: docs/specs/gold-balance-consolidation/
PROGRESS.md — the consolidated lane balance is THE gold card for every
visitor on currena.ir). The owner then instructed: "As a financial investor
with 20 years specialization in gold exchange, create an audit program to
make sure that our gold meter has all the required indicators which
classically show the direction of gold price. Make sure nothing is missed
or half-implemented." The spec set is docs/specs/gold-meter-audit/; GA-S1
DELIVERED (2026-11-04, PROGRESS.md row A): 02-REFERENCE-TAXONOMY.md is v1 —
82 rows (v0 72 + 10 blind-spot adds − 0 strikes), every row verified
against the live sources (the FRED id fixes, the ICE BofA pre-approval +
rolling ~3-year-window re-class, the S9 DPCREDIT pin, the WGC URL
amendments — all in 02's foot changelog), the presence pre-scan appended
(PRESENT-VOTER 15 · PRESENT-CONTEXT 23 · ABSENT 41 · UNKNOWN 0 — directional
only, not coverage). Repo state: main holds the GA-S1 merge (PR "gold
meter audit (GA-S1): the taxonomy v1", CI green); git pull --rebase before
starting.

RESOLVE THE LOCK FIRST (OI-GA-1)
BEFORE any inventory or wiring work: ask the owner to LOCK or AMEND the
82-row v1 taxonomy. D-GA-1 is absolute: the taxonomy is the fixed
denominator — do not map any wiring against an unlocked checklist. If the
owner amends: record the amendment in 02 as an owner-recorded decision
with its date (a dated amendment block at the file's foot; the row count
restated), in PROGRESS.md's session block, and re-state the arithmetic in
any downstream file that quotes it. If the owner locks: write the lock
line into 02's status header ("LOCKED by the owner, <date>" — after that,
additions are owner-recorded amendments only) and PROCEED. If the owner is
not reachable in-session: do the inventory's source-side work (03 §1.2–
§1.4: the readings table transcription and the rungs) which locks nothing,
but STOP before the voter wiring trace (03 §2) and end the session with
the lock question printed — the trace needs the locked denominator.

WHAT THIS SESSION IS
The inventory + wiring evidence pack (01 §2 A2; 03 §1–§2): enumerate the
voters, the readings, the derived recipes and the rungs completely; trace
all 21 voters source → reading → seat with file-and-line citations; run
the mirror sweep (every ingested series marked gold-relevant or not); get
the history-depth numbers from the stored corpus. This session still
classifies NOTHING (GA-S3's job) and edits no meter code (D-GA-3).

WORK ITEMS (in order)
1. READ FIRST: docs/specs/gold-meter-audit/README.md, 01-AUDIT-SPEC.md,
   02-REFERENCE-TAXONOMY.md (v1 — the locked denominator),
   03-METHOD-AND-EVIDENCE.md (§1–§2 are this session's procedures),
   04-REPORT-AND-FILL-DESIGN.md, PROGRESS.md (the GA-S1 block — it holds
   the verified source/URL record you will cite), PROMPTS.md; then
   docs/INDICATORS_AND_DATA_SOURCES.md, the audited object's record
   (docs/specs/gold-balance-consolidation/02-ENGINE-AND-DECISION-TABLE.md
   §4 — the 21-voter table), docs/insights/GOLD_SCORE_SPEC.md, and the
   code itself: packages/insights/src/gold-score.ts (GOLD_LANE_VOTERS),
   connections.ts (evalLeg), gold-balance.ts. Then git pull --rebase.
2. THE INVENTORY (03 §1): transcribe the 21 voters verbatim from
   gold-score.ts WITH LINE NUMBERS (id, lane, polarity, the evalLeg rule
   that applies); transcribe the full indicator table (~145 ids) with id,
   source, cadence, staleness window, layer, licence row, plus the live
   wire's reading set (GET /api/insights — the ground truth of what the
   meter can see today; use the raw archive JSON pre-parse if a stored
   field matters, the GB-S7 rule); enumerate every derived-series recipe
   with its exact formula and inputs (breakeven-tilt, dollar-basket,
   gold-silver, fed-expectations, us-japan-10y-gap, copper-gold, ...); map
   the rungs (04:10/04:20/04:25/04:27/04:40, Saturday, first-of-month)
   to the sources. Output: docs/specs/gold-meter-audit/evidence/
   inventory.md — the three tables + the mirror-sweep column (every series
   marked voter / context / not-gold with a one-word reason — 01 §5.4,
   D-GA-4).
3. THE WIRING TRACE (03 §2): for EACH of the 21 voters, one row in
   evidence/wiring.md — source endpoint → adapter (file, fn) → rung →
   reading id → staleness window → evalLeg inputs (which history, which
   percentile basis) → seat (lane, polarity) → what the visitor sees.
   Cite path:line for every hop; a hop that cannot be shown is
   TRACE-BROKEN — itself a finding. Abbreviated traces for every
   context-marked gold-relevant series, ending in the card it renders on
   and the explicit note "never votes".
4. THE HISTORY DEPTHS (03 §2, the numbers GA-S3 needs): read the stored
   corpus (packages/insights/fixtures/ archives + the KV dump scripts'
   fixtures — read-only; do NOT run the production worker or write KV) and
   count, per voter, the points evalLeg can reach today — the quantified
   basis for the known suspects (cftc-gold-positioning "one stored point",
   gold-silver, us-japan-10y-gap) and every other voter. Read-only scripts
   under packages/insights/scripts/ (the ga-s1-fred-verify.sh and
   gold-corpus-dump precedents).
5. RECORD: PROGRESS.md — the GA-S2 session block (what you did, the
   mirror-sweep tally, the history-depth numbers with the script that
   printed each, the lock resolution) and update the milestone table's
   row B. CHANGELOG.md — a dated entry in the house style. Rewrite the
   GA-S3 prompt in PROMPTS.md from the template with the exact state.

CONSTRAINTS (standing, every session of this program)
- D-GA-3: read-only against the code. No edits to gold-score.ts,
  gold-balance.ts, GOLD_LANE_VOTERS, harness tables, schemas, adapters,
  copy dictionaries. Docs + read-only scripts only. Deploy NOTHING.
- D-GA-2: no forecasting claim anywhere; coverage/honesty language only.
- D-GA-5/D-GA-6: free-first sourcing; NO classification this session —
  the rubric is GA-S3's; the inventory records facts, not classes.
- Every number from a run or a citation (the 01 §4.3 rule): the history
  depths, the mirror-sweep counts, the wire's reading count — each with
  the script or query that produced it.
- Branch ga/s2-inventory; PR "gold meter audit (GA-S2): the inventory +
  wiring evidence pack"; push after each milestone; merge yourself when
  the exit gate holds; CI green on main verified. Docs/scripts-only: no
  deploy.

EXIT GATE
evidence/inventory.md complete (voters verbatim with line numbers; the
full readings table with the mirror-sweep column; the derived recipes;
the rungs); evidence/wiring.md complete (all 21 voters traced with no
unexplained hops; context traces with their never-votes notes); the
history-depth numbers stated per voter with their scripts; PROGRESS row B
complete; the GA-S3 prompt written, committed, pushed, merged; the prompt
printed in your final message with a 5-line summary (what shipped, what is
blocked, what the owner must do).

AT THE END (the standing close-out, every session)
1. PROGRESS.md session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
(D-GA-9: the owner asked for a next-session prompt at the end of EVERY
session — never end without one.)
```

---

## GA-S3 — the coverage matrix + the half-implementation audit (to be rewritten by GA-S2)

Will follow 03 §3–§4: every taxonomy row classified (the six classes), every
voter mapped or flagged UNCLASSICATED, the H1–H7 defect list, the header
arithmetic. Branch `ga/s3-matrix`.

## GA-S4 — the report + the fill program (to be rewritten by GA-S3)

Will follow 04: `docs/insights/GOLD-METER-AUDIT-REPORT.md`, the severity
ranking, the owner's decision list, the fill program's phase design and its
GF-S1.. prompts. Branch `ga/s4-report`.
