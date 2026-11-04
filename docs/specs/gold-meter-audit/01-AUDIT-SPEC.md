# 01. The audit spec

## 1. The problem being audited

The gold meter — the consolidated lane balance — answers *"what do the
conditions around gold say today?"* with **21 voters in 4 lanes** (borrowing
costs 8, dollar 3, market stress 5, inflation 5), a lane vote that needs at
least 2 firing voters, a beam angle and a derived Outlook. It is honest by
construction (equal lane weight, no forecasting claim, unread ≠ neutral) and
it is live for every visitor.

But honesty of the mechanism is not completeness of the evidence. A meter can
be perfectly calibrated over a voter set that misses half the classic
drivers, and it will read "Balanced" through conditions it cannot see. Three
specific risks motivate this audit:

- **Coverage risk.** The voter set was consolidated from two legacy engines,
  not derived from a systematic checklist of what classically moves gold.
  The classic flows/positioning family (CFTC crowding, ETF flows,
  central-bank buying, Asian premiums) holds exactly one seat today
  (`cftc-gold-positioning`) — and the repo ingests it with a history so thin
  the spec itself records "never fires today."
- **Half-implementation risk.** Voters whose cadence, history depth or
  polarity make them structurally unable to express the classic claim they
  stand for (monthly series under a 30-day-move rule; decade-extreme
  percentiles over one stored point; the yield-curve polarity the frozen
  spec itself calls "ambiguous").
- **Invisibility risk.** The repo ingests dozens of gold-classic series that
  never vote (GPR, EBP, OFR FSI, M2, Michigan expectations, term premium,
  COFER USD share, TIC holdings, Treasury auctions, liquidity block). To the
  meter they do not exist. The owner asked: nothing missed, nothing
  half-implemented.

## 2. The audit's contract

One sentence: **map the 21-voter meter against the locked classic checklist
(02), classify every cell, flag every half-implementation, and design the
owner-gated fill program** — without touching the meter (D-GA-3).

Formally, the audit delivers four artifacts:

| # | Artifact | Where | Session |
|---|---|---|---|
| A1 | The locked reference taxonomy (the checklist v1, owner-reviewed) | `02-REFERENCE-TAXONOMY.md` | GA-S1 |
| A2 | The inventory + wiring evidence pack (every voter and every gold-relevant ingested series, traced source → rung → reading → seat) | `docs/specs/gold-meter-audit/evidence/` | GA-S2 |
| A3 | The classified coverage matrix (every taxonomy row resolved; every voter mapped or flagged) + the half-implementation defect list | `docs/specs/gold-meter-audit/evidence/coverage-matrix.md` | GA-S3 |
| A4 | The audit report + the fill-program design with its session prompts | `docs/insights/GOLD-METER-AUDIT-REPORT.md` + `04-…` appendix | GA-S4 |

## 3. The audited object, precisely

- The voter table: `GOLD_LANE_VOTERS` in `packages/insights/src/gold-score.ts`
  (frozen; 21 seats as of 2026-11-04) and the lane constants.
- The evaluator: `evalLeg` in `connections.ts` — a 30-day move beyond the
  per-leg `SIGNAL_LEG_MOVE` minimum, else a decade-extreme level at
  percentile > 0.8 / < 0.2.
- The consolidation: `gold-balance.ts` (`GOLD_LANE_MIN_FIRING = 2`,
  `GOLD_LANE_STRONG = 3`), the beam formula (unchanged, D-GB-8), the derived
  Outlook `goldOutlookOf`, the context pill.
- The data plane feeding it: the ingest rungs (04:10 build / 04:20 patch),
  the 161 readings on the wire, the adapters and derived series, the
  staleness windows in `docs/INDICATORS_AND_DATA_SOURCES.md`.
- What the visitor sees of gold on currena.ir — the balance card, the
  collapsed takeaway, the Outlook sentence — is downstream of exactly these;
  nothing else is in scope.

## 4. The honesty rules (inherited, non-negotiable)

1. **No forecasting claim, anywhere, ever** (D-GA-2). The audit report may
   not rank gaps by "would have predicted" anything. The severity ranking
   (04 §3) is classic-literature importance × data availability × wiring
   cost — never a backtest of the proposed voters. Backtests of candidate
   voters, if ever run, are lineage-only and labelled so, under the GB-S1
   precedent.
2. **Pre-registration discipline** (D-GA-1): the checklist is locked before
   the wiring is mapped. Amendments after the lock are recorded as owner
   decisions with dates, never silently folded in.
3. **Every number from a run** (PROGRESS.md house rule): coverage counts,
   firing statistics, history depths — each stated with the script or query
   that produced it, reproducible from the repo.
4. **Recommendations re-checked against code before being written down** —
   the owner's 2026-10-31 standing instruction, restated in the GB README.
   No "probably wired" in the report; file-and-line or it did not happen.
5. **The retired-stamp era is handled** (GB-S7): `goldSummary` is gone from
   the wire; any audit script that needs the historical engine output reads
   the raw archive JSON pre-parse, exactly like `gold-corpus-dump`.

## 5. The completeness guarantee (how "nothing missed" is enforced)

1. The denominator is the taxonomy: **every row must end GA-S3 with exactly
   one class from §6, plus a one-line reason.** A row with no class fails
   the GA-S3 exit gate.
2. The numerator is the voter table: **every one of the 21 voters must map
   to exactly one taxonomy row.** A voter with no row is `UNCLASSICATED` —
   reported as a defect (either the checklist missed a classic indicator, or
   the voter has no classic justification; the owner decides which).
3. The blind-spot sweep: GA-S1 ends with a deliberate second pass over the
   families asking "what does a 20-year gold desk watch that is NOT in this
   checklist?" — appendix additions before the lock, not after (D-GA-1).
4. The mirror sweep: GA-S2 ends with the reverse list — every ingested
   series (the full indicator table, ~90 rows) marked gold-relevant or not,
   so "ingested but not wired" can never be discovered later by accident
   (D-GA-4).
5. The report carries the arithmetic: `rows classified = rows in taxonomy`;
   `voters mapped = 21`; the counts are restated in the report's header.

## 6. The classification rubric (fixed here, D-GA-6)

| Class | Meaning (necessary and sufficient) |
|---|---|
| `COVERED` | A voter (or a derived input a voter reads) exists, its rule expresses the classic claim with the classic sign, and its cadence/history let it actually fire in the era being measured. |
| `PARTIAL` | A voter exists but one of: wrong granularity for the classic claim (e.g. nominal where the classic is real), a rule that can only express part of the claim (one-sided), a cadence/history that mutes it most windows, or a sign the literature treats as regime-dependent while ours is fixed. |
| `MISSING-FREE` | No voter or input; a free, keyless, licence-clean source exists that could feed it (named, with cadence and lag). |
| `MISSING-PAID` | No voter or input; only paid or ToS-thin sources exist. A free proxy is named where one exists; EODHD coverage is noted but flagged (OI-GA-5). |
| `CONTEXT-ONLY-BY-DESIGN` | The series is (or would be) on the page as context but deliberately never votes — with the recorded reason (structural/quarterly, circularity like gold's own price, or owner decision). This class must cite the decision that made it context. |
| `NOT-APPLICABLE` | The classic claim does not apply to this meter's contract ("conditions today, not a forecast") or to the page's scope — with the reason stated. |

Rules of use: one class per row, no `COVERED` without a wiring citation, no
`NOT-APPLICABLE` for convenience. `PARTIAL` and `MISSING-FREE` are the two
classes that seed the fill program's backlog (04 §3).

## 7. What the audit is not

- It is not a rewrite of the meter: no engine edits, no threshold changes, no
  new voters (D-GA-3). The fill program does that, owner-gated.
- It is not a re-litigation of shipped decisions: the beam formula (D-GB-8),
  the min-2 lane rule (the GB-S1 calibration), the Outlook derivation, the
  copy. Those are recorded and closed; the audit may only *note* where a
  shipped decision interacts with a gap (e.g. a solo voter structurally
  cannot tip a lane — that is by design; whether its family deserves a lane
  is OI-GA-2).
- It is not a forecast-quality study (§4.1).

## 8. Sessions and gates

| Session | Milestone | Exit gate |
|---|---|---|
| GA-S1 | The taxonomy verified + locked-draft (v1) for the owner; the blind-spot sweep done; the presence pre-scan recorded | 02 complete through the sweep; PROGRESS row A; the GA-S2 prompt written |
| GA-S2 | The inventory + wiring evidence pack; the mirror sweep (every ingested series marked) | A2 complete, every voter traced file-and-line; PROGRESS row B; the GA-S3 prompt |
| GA-S3 | The coverage matrix classified + the half-implementation defect list | Every row classed, every voter mapped, arithmetic stated (§5); PROGRESS row C; the GA-S4 prompt |
| GA-S4 | The report + the fill-program design + its prompts | A4 merged; the owner's decision list (OI-GA-1..5 + any new) stated; PROGRESS rows D/E; the fill program's GA-S1 prompt printed |

Each session: branch `ga/<phase>`, PR, CI green, merge (D-GA-10); deploy
nothing. If a session finishes its milestone early it pulls the next one
forward (the GB-S1 precedent) — the PROGRESS.md record, not this table, is
the authoritative state.
