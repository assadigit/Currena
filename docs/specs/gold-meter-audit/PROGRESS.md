# PROGRESS — the gold meter audit program

The running record of the owner's audit program (the spec set:
`docs/specs/gold-meter-audit/` — README + 01–04 + PROMPTS; the session plan
GA-S1..GA-S4). One line per milestone, one block per session; every number
comes from a run or a citation the session actually made. The audited
predecessor program (gold balance consolidation) is CLOSED — COMPLETE,
LIVE 2026-11-04 (its record: `docs/specs/gold-balance-consolidation/
PROGRESS.md`); this program changes nothing it shipped (D-GA-3).

## The milestone table

| ID | Milestone (spec ref) | State |
|---|---|---|
| A | The reference taxonomy verified + v1 delivered for the owner's lock; the blind-spot sweep; the presence pre-scan (01 §2 A1; 02) | ⏳ PENDING — GA-S1 |
| B | The inventory + wiring evidence pack; the mirror sweep (01 §2 A2; 03 §1–§2) | ⏳ PENDING — GA-S2 |
| C | The coverage matrix classified + the half-implementation defect list; the header arithmetic (01 §2 A3, §5; 03 §3–§4) | ⏳ PENDING — GA-S3 |
| D | The audit report `docs/insights/GOLD-METER-AUDIT-REPORT.md` (01 §2 A4; 04 §1–§2) | ⏳ PENDING — GA-S4 |
| E | The fill-program design + its GF-S1.. prompts; the owner's decision list stated (04 §3–§5) | ⏳ PENDING — GA-S4 |

## Session log

### Spec session (2026-11-04) — the program specified

- **Delivery:** the spec set written and delivered on `spec/gold-meter-audit`
  (this PR) — README (decisions D-GA-1..10, open items OI-GA-1..6),
  01-AUDIT-SPEC (the contract, honesty rules, completeness guarantee,
  classification rubric), 02-REFERENCE-TAXONOMY (draft v0: 9 families,
  72 rows, every row with classic claim + sign + free source + cadence +
  treatment), 03-METHOD-AND-EVIDENCE (inventory, wiring trace, matrix,
  H1–H7 defect checks, evidence rules), 04-REPORT-AND-FILL-DESIGN (report
  shape, severity components, the GF-P0..P5 fill phases, standing
  constraints), PROMPTS (the GA-S1 kickoff prompt, full), PROGRESS (this
  file). AGENT_HANDOFF.md rewritten for the audit program; CHANGELOG entry.
- **Grounding facts used (verified against the repo at spec time):** the
  21-voter table (borrowing costs 8 · dollar 3 · market stress 5 ·
  inflation 5; `docs/specs/gold-balance-consolidation/
  02-ENGINE-AND-DECISION-TABLE.md` §4); the self-flagged thin voters
  (`cftc-gold-positioning` "one stored point: never fires today";
  `us-japan-10y-gap` "stale most windows"; `gold-silver` "thin history";
  the yield-curve polarity "ambiguous"); the ingested-but-not-voting
  context set (`docs/INDICATORS_AND_DATA_SOURCES.md`: gpr-* ×10, ebp,
  ofr-fsi, sloos-ci-tightening, term-premium-10y, tga, reverse-repo,
  bank-reserves, repo-stress, net-liquidity, m2-us,
  michigan-1y-expectations, usd-reserve-share [the dedollar shadow,
  S6-M6.4 pending], sp500-breadth-ratio, us-deficit-12m,
  govt-interest-revenue, treasury-auction-10y/30y + indirect, nyfed-custody,
  btp-bund-spread, t5yie, breakeven-10y, median-cpi, sticky-cpi,
  gold-oil-ratio, gold-btc, gold-aud, copper-gold); the free-source
  licence table (L0/L1). None of this pre-classifies anything — the matrix
  is GA-S3's, against the locked taxonomy (D-GA-1).
- **Nothing audited yet.** The program's first finding will be GA-S1's.

## Owner must decide

1. **OI-GA-1 — the taxonomy lock** (after GA-S1 delivers v1): amend or lock.
   The audit cannot count coverage against an unlocked denominator.
2. OI-GA-2..OI-GA-6 — as scheduled in the README's table (GA-S4's decision
   list, unless the owner calls them earlier in chat).

## Standing constraints (every session)

- D-GA-3: read-only against the meter — no edits to `gold-score.ts`,
  `gold-balance.ts`, `GOLD_LANE_VOTERS`, the harness tables, schemas,
  adapters or copy dictionaries; docs + read-only scripts only; deploy
  nothing.
- D-GA-2: no forecasting claim, anywhere, ever (the no-edge record stands).
- D-GA-1: the taxonomy is the fixed denominator; amendments after the lock
  are owner-recorded decisions with dates.
- Every number from a run or a citation; recommendations re-checked against
  code before they are written down (the owner's 2026-10-31 instruction).
- Full gates green before every push; branch + PR per phase; self-merge when
  the exit gate holds; CI green verified on main after every merge.
- D-GA-9: end every session with the next prompt rewritten, committed,
  pushed, and printed.
