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

RUN (2026-11-05) — **FALLBACK AGAIN (the lock still unresolved)**: the owner
was not reachable in-session (the second consecutive session) and left no
decision in the repo, so the session executed only this prompt's explicit
fallback — the lock-nothing re-verification: the drift record
`evidence/wire-scan-2026-11-05.txt` committed (the denominators, the GB-S7
retirement and all 21 voters verified holding; the day's deltas — the healed
dollar lane, `ecb-dfr` gone stale, `usdcny` the only `check-pending` — noted
in PROGRESS's session block). The voters table (03 §1.1) and the wiring
trace + the context traces + the history depths (03 §2) remain DEFERRED —
wiring work against the unlocked denominator (D-GA-1). **The prompt below is
re-issued with the exact state — the next session starts by resolving the
lock (OI-GA-1), whose question is printed in the GA-S2-completion session's
final message.**

```
You are working in the Currena repo at the repo root. This is the
GA-S2-completion session of the gold meter audit program — the owner's
continuation of the gold program. Read this whole prompt before doing
anything.

CONTEXT — WHERE WE STAND
The gold balance consolidation program is COMPLETE and LIVE (closed
2026-11-04 at GB-S7; its record: docs/specs/gold-balance-consolidation/
PROGRESS.md — the consolidated lane balance is THE gold card for every
visitor on currena.ir). The owner then instructed: "As a financial investor
with 20 years specialization in gold exchange, create an audit program to
make sure that our gold meter has all the required indicators which
classically show the direction of gold price. Make sure nothing is missed
or half-implemented." The spec set is docs/specs/gold-meter-audit/.
GA-S1 DELIVERED (2026-11-04, PROGRESS.md row A): the 82-row taxonomy v1,
verified live, swept, pre-scanned — delivered for the owner's lock.
GA-S2 ran (2026-11-04, PROGRESS.md row B PARTIAL): the owner was NOT
reachable in-session, so the session took the prompt's explicit fallback —
the inventory's SOURCE-SIDE work only (03 §1.2–§1.4) and a hard stop
before the voter wiring trace. What shipped: evidence/inventory.md (the
full 161-row readings table — every id with source · series ref, cadence,
staleness window, layer, licence, gauge role, the mirror-sweep mark and
the day's wire state; the mirror-sweep tally voter 21 · context 63 ·
not-gold 77 = 161; the 25 derived-series recipes with exact formulas and
path:line cites; the rung map per docs/gap-closure/RUNGS.md) and the
runnable record packages/insights/scripts/ga-s2-wire-scan.sh with its
committed run evidence/wire-scan-2026-11-04.txt (the wire: 161 readings,
goldSummary absent — the GB-S7 retirement verified holding; all 21 voters
present; the day's states recorded as facts). What did NOT ship: the
voters table (03 §1.1), the wiring trace + the context traces + the
history depths (03 §2) — deferred because the trace needs the LOCKED
denominator. 02-REFERENCE-TAXONOMY.md is untouched (v1, unlocked).
GA-S2-COMPLETION RAN (2026-11-05, PROGRESS.md row B still PARTIAL): the
owner was NOT reachable in-session AGAIN (the second consecutive session)
and left no decision in the repo (no commits after the GA-S2 merge,
PR #28 zero comments, no new issues; 02 still v1/unlocked), so the session
took this prompt's explicit fallback — the lock-nothing re-verification
ONLY: ga-s2-wire-scan.sh re-run against the fresh wire (the 20:10-UTC-sweep
snapshot, generatedAt 2026-11-04T20:10:18.690Z) with the dated drift record
committed as evidence/wire-scan-2026-11-05.txt. The holds: 161 readings =
161 DEFINITIONS ids; goldSummary absent — the GB-S7 retirement verified
holding, the second consecutive scan; all 21 voters present; the doc-table
159-row drift and the GAUGES 12/68/48 + 4-shadow cross-checks unchanged;
every static scan column identical across the two runs — no code moved.
The day's notable deltas (facts, in PROGRESS's session block): the dollar
lane healed (dollar-basket + usdjpy stale → normal, both evalLeg inputs
present); ecb-dfr flipped normal → stale (asOf unchanged, both inputs now
absent — the WHY is the post-lock wiring trace's job); usdcny the only
check-pending; 21/161 rows drifted, 140 identical. What did NOT ship
(again): the voters table (03 §1.1), the wiring trace + the context traces
+ the history depths (03 §2) — still deferred, still blocked on the lock.
02-REFERENCE-TAXONOMY.md is untouched (v1, unlocked).
Repo state: main holds the GA-S2-completion fallback merge (PR "gold meter
audit (GA-S2 completion): the wiring evidence pack" #29 — the fallback
scope is recorded in the PR body and PROGRESS row B); git pull --rebase
before starting.

RESOLVE THE LOCK FIRST (OI-GA-1)
BEFORE any wiring work: ask the owner to LOCK or AMEND the 82-row v1
taxonomy. D-GA-1 is absolute: the taxonomy is the fixed denominator — do
not map any wiring against an unlocked checklist. If the owner amends:
record the amendment in 02 as an owner-recorded decision with its date (a
dated amendment block at the file's foot; the row count restated), in
PROGRESS.md's session block, and re-state the arithmetic in any downstream
file that quotes it. If the owner locks: write the lock line into 02's
status header ("LOCKED by the owner, <date>" — after that, additions are
owner-recorded amendments only) and PROCEED with the work items below.
If the owner is not reachable in-session AGAIN (this fallback has now
fired twice — GA-S2 on 2026-11-04, GA-S2-completion on 2026-11-05): do
only the lock-nothing re-verification — re-run ga-s2-wire-scan.sh against
the fresh wire, commit dated output under evidence/ as
wire-scan-<date>.txt (the day-to-day drift record — the series
2026-11-04, 2026-11-05, … continues), note any deltas in PROGRESS.md's
session block — and end the session with the lock question printed. Do
NOT start the voters table, the wiring trace or the history depths: they
are wiring work against the denominator.

WHAT THIS SESSION IS
The completion of A2 (01 §2; 03 §1.1 + §2): the voters table, the wiring
trace, the context traces and the history depths — the wiring evidence
pack the partial GA-S2 deferred. This session still classifies NOTHING
(GA-S3's job) and edits no meter code (D-GA-3).

WORK ITEMS (in order)
1. READ FIRST: docs/specs/gold-meter-audit/README.md, 01-AUDIT-SPEC.md,
   02-REFERENCE-TAXONOMY.md (the LOCKED denominator — after the lock is
   resolved), 03-METHOD-AND-EVIDENCE.md (§1.1 + §2 are this session's
   procedures), 04-REPORT-AND-FILL-DESIGN.md, PROGRESS.md (the GA-S1 +
   GA-S2 + GA-S2-completion blocks — the verified source record, the
   delivered source-side inventory and the drift record), PROMPTS.md; then docs/INDICATORS_AND_DATA-
   SOURCES.md, the audited object's record (docs/specs/gold-balance-
   consolidation/02-ENGINE-AND-DECISION-TABLE.md §4 — the 21-voter table),
   docs/insights/GOLD_SCORE_SPEC.md, evidence/inventory.md + evidence/
   wire-scan-2026-11-04.txt + evidence/wire-scan-2026-11-05.txt (the
   delivered half + the drift records — build on them, do not redo them),
   and the code itself: packages/insights/src/gold-score.ts
   (GOLD_LANE_VOTERS), connections.ts (evalLeg + SIGNAL_LEG_MOVE —
   note: only 4 of the 21 voter ids carry a 30-day move threshold),
   gold-balance.ts. Then git pull --rebase.
2. THE VOTERS TABLE (03 §1.1): append to evidence/inventory.md — the 21
   seats of GOLD_LANE_VOTERS transcribed VERBATIM with line numbers
   (id, lane, polarity, the evalLeg rule that applies: which leg — move
   vs level — the voter can actually express, given SIGNAL_LEG_MOVE's
   coverage, and the percentile basis). The scan's §2 already prints each
   voter's gold-score.ts line number — verify against the code, never
   against the scan alone.
3. THE WIRING TRACE (03 §2): for EACH of the 21 voters, one row in
   evidence/wiring.md — source endpoint → adapter (file, fn) → rung →
   reading id → staleness window → evalLeg inputs (which history, which
   percentile basis) → seat (lane, polarity) → what the visitor sees.
   Cite path:line for every hop; a hop that cannot be shown is
   TRACE-BROKEN — itself a finding. Abbreviated traces for every
   context-marked gold-relevant series (the 63 of the mirror sweep),
   ending in the card it renders on and the explicit note "never votes".
   The rung column comes from inventory.md §3 (RUNGS.md is canonical).
4. THE HISTORY DEPTHS (03 §2, the numbers GA-S3 needs): read the stored
   corpus — packages/insights/fixtures/gold-backtest-corpus.json (the
   gold-corpus-dump record, recordedAt 2026-11-03T04:43:54Z: the staged
   series for the 21 voters + gold-usd + the tilt/cross-fill legs + the
   daily goldHist + the archive days) and the KV-dump fixtures — READ-ONLY;
   do NOT run the production worker or write KV. Write a read-only script
   under packages/insights/scripts/ (the ga-s1-fred-verify.sh /
   ga-s2-wire-scan.sh / gold-corpus-dump precedents) that counts, per
   voter, the points evalLeg can reach today — the quantified basis for
   the known suspects (cftc-gold-positioning, gold-silver,
   us-japan-10y-gap) and every other voter. Commit the script's output
   under evidence/ and cite it for every number.
5. RECORD: PROGRESS.md — the session block (what you did, the trace
   outcome incl. any TRACE-BROKEN rows, the history-depth numbers with
   the script that printed each, the lock resolution) and flip milestone
   row B to COMPLETE. CHANGELOG.md — a dated entry in the house style.
   Rewrite the GA-S3 prompt in PROMPTS.md from the template with the
   exact state.

CONSTRAINTS (standing, every session of this program)
- D-GA-3: read-only against the code. No edits to gold-score.ts,
  gold-balance.ts, GOLD_LANE_VOTERS, harness tables, schemas, adapters,
  copy dictionaries. Docs + read-only scripts only. Deploy NOTHING.
- D-GA-2: no forecasting claim anywhere; coverage/honesty language only.
- D-GA-5/D-GA-6: free-first sourcing; NO classification this session —
  the rubric is GA-S3's; the wiring trace records facts, not classes.
- Every number from a run or a citation (the 01 §4.3 rule): the history
  depths, the trace's hops, the mirror-sweep counts — each with the
  script, file or query that produced it.
- Branch ga/s2-wiring; PR "gold meter audit (GA-S2 completion): the
  wiring evidence pack"; push after each milestone; merge yourself when
  the exit gate holds; CI green on main verified. Docs/scripts-only: no
  deploy.

EXIT GATE
evidence/inventory.md complete (the voters table verbatim with line
numbers appended to the delivered source-side half; the readings table,
recipes and rungs already shipped); evidence/wiring.md complete (all 21
voters traced with no unexplained hops; the context traces with their
never-votes notes); the history-depth numbers stated per voter with their
scripts; PROGRESS row B COMPLETE; the GA-S3 prompt written, committed,
pushed, merged; the prompt printed in your final message with a 5-line
summary (what shipped, what is blocked, what the owner must do).

AT THE END (the standing close-out, every session)
1. PROGRESS.md session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md; 4. commit, push, PR, merge when
green; 5. final message = the printed next prompt + the 5-line summary.
(D-GA-9: the owner asked for a next-session prompt at the end of EVERY
session — never end without one.)
```

---

## GA-S3 — the coverage matrix + the half-implementation audit (to be rewritten by the GA-S2-completion session)

Will follow 03 §3–§4: every taxonomy row classified (the six classes), every
voter mapped or flagged UNCLASSICATED, the H1–H7 defect list, the header
arithmetic. Branch `ga/s3-matrix`.

## GA-S4 — the report + the fill program (to be rewritten by GA-S3)
Will follow 04: `docs/insights/GOLD-METER-AUDIT-REPORT.md`, the severity
ranking, the owner's decision list, the fill program's phase design and its
GF-S1.. prompts. Branch `ga/s4-report`.
