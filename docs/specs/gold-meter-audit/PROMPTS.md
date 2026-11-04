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

## GA-S1 — the reference taxonomy: verify, sweep, lock-draft

```
You are working in the Currena repo at the repo root. This is session GA-S1
of the gold meter audit program — the owner's continuation of the gold
program. Read this whole prompt before doing anything.

CONTEXT — WHERE WE STAND
The gold balance consolidation program is COMPLETE and LIVE (closed
2026-11-04 at GB-S7; its record: docs/specs/gold-balance-consolidation/
PROGRESS.md — the consolidated lane balance is THE gold card for every
visitor on currena.ir; worker currena-api, latest deployment, verified).
The owner then instructed: "As a financial investor with 20 years
specialization in gold exchange, create an audit program to make sure that
our gold meter has all the required indicators which classically show the
direction of gold price. Make sure nothing is missed or half-implemented."
The spec set for that audit already exists: docs/specs/gold-meter-audit/
(README.md, 01-AUDIT-SPEC.md, 02-REFERENCE-TAXONOMY.md [DRAFT v0],
03-METHOD-AND-EVIDENCE.md, 04-REPORT-AND-FILL-DESIGN.md, PROGRESS.md).
This session is GA-S1, the first session: THE TAXONOMY.

WHAT THIS SESSION IS
Deliver 02-REFERENCE-TAXONOMY.md as v1: verified row by row (definition,
classic sign, free source, cadence/lag, treatment), completed with the
blind-spot sweep, and handed to the owner for the lock (OI-GA-1). The
taxonomy is the audit's FIXED DENOMINATOR (D-GA-1): it must be complete
and correct BEFORE any wiring is mapped. This session does NOT audit the
code's coverage — it audits the checklist itself. One exception: a light
PRESENCE PRE-SCAN (item 4 below) is allowed and required, because the
owner expects an early honest signal of obvious holes; it must be labelled
pre-scan, not coverage, and must not leak into the taxonomy's content.

WORK ITEMS (in order)
1. READ FIRST, in this order: docs/specs/gold-meter-audit/README.md,
   01-AUDIT-SPEC.md, 02-REFERENCE-TAXONOMY.md (draft v0), 03-METHOD-AND-
   EVIDENCE.md, 04-REPORT-AND-FILL-DESIGN.md, PROGRESS.md; then the
   audited object's own record: docs/specs/gold-balance-consolidation/
   02-ENGINE-AND-DECISION-TABLE.md (the 21-voter table) and
   docs/insights/GOLD_SCORE_SPEC.md. Then git pull --rebase.
2. VERIFY EVERY ROW of the draft taxonomy (9 families, 72 rows). For each
   row, confirm: (a) the definition matches the canonical series (right
   FRED id where named; right provider; the UoM/SIE series for Michigan;
   WGC's public tables for the demand rows); (b) the classic claim and
   sign are the standard treatment in the gold literature (the
   opportunity-cost frame for R, the trade-weighted caution for D, the
   conditional-haven nuance for S, the contrarian-at-extremes rule for F);
   (c) the free source is really free, keyless and licence-compatible with
   docs/insights/LICENCES.md (L0/L1) — if a named source fails this
   (paywalled, ToS-thin, discontinued), re-source it or re-class the row's
   availability honestly (D-GA-5). Use web search/fetch to verify current
   availability and the exact series ids — do not trust memory for FRED
   ids or provider URLs. Record, per row you changed, a one-line
   changelog at the file's foot.
3. THE BLIND-SPOT SWEEP (01 §5.3). Deliberately ask: what does a 20-year
   gold desk watch that is NOT yet in the checklist? Walk the families
   once more with this question — checking at minimum: other real-rate
   tenors and TIPS liquidity/breakeven decomposition; JGB/YCC and yen-
   funding regimes; EM dollar-debt stress; gold leasing/forward
   dislocations; Swiss franc and haven flows; CBRT/EM central-bank gold
   behaviour; miner hedging books; jewellery-demand price elasticity
   notes; the gold-oil-energy-inflation loop; the COMEX/LBMA dual-market
   structure; currency-devaluation events; gold's monetary-aggregate
   anchors. Append anything genuinely classic that is missing as new rows
   BEFORE the v1 stamp (after the lock, additions are owner-recorded
   amendments only). Also prune: if a v0 row is honestly not classic
   (desk-lore, not literature), say so and strike it with the reason.
4. THE PRESENCE PRE-SCAN (labelled, bounded). Against
   docs/INDICATORS_AND_DATA_SOURCES.md ONLY (no deep wiring work — that
   is GA-S2), mark each taxonomy row: PRESENT-VOTER / PRESENT-CONTEXT /
   ABSENT / UNKNOWN. Put this in a short section at the taxonomy file's
   foot titled "Pre-scan (GA-S1, not coverage)". It is directional
   information for the owner, not evidence; GA-S2/GA-S3 decide.
5. WRITE the v1: 02-REFERENCE-TAXONOMY.md updated in place (status:
   v1 — delivered for the owner's lock, OI-GA-1), the row count restated,
   the sweep's additions/strikes listed, the pre-scan table appended.
6. RECORD: PROGRESS.md — the GA-S1 session block (what you did, what you
   verified, every source you checked with its URL, the row-count
   arithmetic: v0 rows -> adds -> strikes -> v1 rows) and update the
   milestone table's row A. CHANGELOG.md — a dated entry in the house
   style ([2026-11-XXx] gold-meter-audit GA-S1: ...). Rewrite the GA-S2
   prompt in PROMPTS.md from the template below with the exact state.

CONSTRAINTS (standing, every session of this program)
- D-GA-3: read-only against the code. No edits to gold-score.ts,
  gold-balance.ts, GOLD_LANE_VOTERS, harness tables, schemas, adapters,
  copy dictionaries. Docs + read-only scripts only. Deploy NOTHING.
- D-GA-2: no forecasting claim anywhere; the severity/coverage language is
  about the classic condition set, never predictive power.
- D-GA-5/D-GA-6: free-first sourcing; the classification rubric is not
  used yet (GA-S3's job) — the pre-scan's four marks are not classes.
- Every number or URL you write must come from something you actually
  opened or ran this session. Cite URLs for source verifications.
- Branch ga/s1-taxonomy; PR "gold meter audit (GA-S1): the taxonomy v1";
  push after each milestone; merge yourself when the exit gate holds; CI
  green on main verified. Docs-only session: no deploy.
- If the taxonomy lock question (OI-GA-1) is still open when the session
  ends, the GA-S2 prompt must START by resolving it (ask the owner to
  lock or amend; do not map wiring against an unlocked denominator).

EXIT GATE
02 is v1: every row verified or amended with its reason; the sweep recorded
(adds + strikes, with literature/URL support); the pre-scan present and
labelled; the row arithmetic states itself; PROGRESS row A complete; the
GA-S2 prompt written, committed, pushed, merged; the prompt printed in your
final message with a 5-line summary (what shipped, what is blocked, what
the owner must do — the lock decision first among them).

AT THE END (the standing close-out, every session)
1. PROGRESS.md session block + milestone row; 2. CHANGELOG entry; 3. the
next prompt rewritten in PROMPTS.md from the template below; 4. commit,
push, PR, merge when green; 5. final message = the printed next prompt +
the 5-line summary. (D-GA-9: the owner asked for a next-session prompt at
the end of EVERY session — never end without one.)

TEMPLATE FOR THE NEXT PROMPT (rewrite, do not copy blindly)
- Context: program, session number, what the previous sessions delivered
  (cite PROGRESS.md rows), the repo state (branch, PR, CI).
- This session is: [milestone, from 01 §8 / 03's procedures, with the
  exact artifacts and files].
- Work items: ordered, concrete, with the evidence rules of 03.
- Constraints: the standing block above, restated.
- Exit gate: the milestone's gate, verifiable.
- At the end: the standing close-out.
```

---

## GA-S2 — the inventory + the wiring evidence pack (to be rewritten by GA-S1)

Will follow 03 §1–§2: the voters/readings/rungs tables, the mirror sweep,
the per-voter wiring trace with file-and-line citations and the
history-depth counts from the stored corpus. Branch `ga/s2-inventory`.

## GA-S3 — the coverage matrix + the half-implementation audit (to be rewritten by GA-S2)

Will follow 03 §3–§4: every taxonomy row classified (the six classes), every
voter mapped or flagged UNCLASSICATED, the H1–H7 defect list, the header
arithmetic. Branch `ga/s3-matrix`.

## GA-S4 — the report + the fill program (to be rewritten by GA-S3)

Will follow 04: `docs/insights/GOLD-METER-AUDIT-REPORT.md`, the severity
ranking, the owner's decision list, the fill program's phase design and its
GF-S1.. prompts. Branch `ga/s4-report`.
