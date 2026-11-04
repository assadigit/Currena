# 04. The report and the fill program

## 1. The report

File: `docs/insights/GOLD-METER-AUDIT-REPORT.md` (GA-S4's deliverable,
A4). Shape:

1. **Header arithmetic** (the completeness guarantee stated up front):
   taxonomy rows v1, rows classified, voters mapped, defects found — and
   the headline: *how much of the classic condition set the meter sees
   today* (the COVERED+healthy share, stated as a fraction with the row
   count).
2. **The coverage matrix**, condensed (the full matrix lives in
   `evidence/coverage-matrix.md`; the report shows per-family summaries +
   every non-COVERED row in full).
3. **The half-implementation defects** (from `evidence/half-implementation.md`),
   each with severity.
4. **The gap backlog**: every `PARTIAL`, `MISSING-FREE` and promote-worthy
   `CONTEXT-ONLY-BY-DESIGN` row, ranked (§3 below), each with its named
   free source and the fill phase it lands in.
5. **The owner's decision list**: OI-GA-1..5 (plus anything new), each with
   the audit's recommendation and the recorded-open status.
6. **The honesty footer**: no forecasting claim (01 §4.1); the fill program
   adds coverage of the classic condition set, nothing more.

## 2. Severity components (fixed here)

Each backlog item scores three components, each 1–3, stated explicitly:

| Component | 1 | 2 | 3 |
|---|---|---|---|
| Classic weight (per 02's families) | context-leaning family (H, X) | secondary channel (I-persistence, S-secondary, G-slow) | core channel (R, D, S-primary, F-positioning, D5/G1 structural) |
| Availability | MISSING-PAID / ToS-thin | free but laggy or coarse (quarterly/monthly) | free, keyless, daily–weekly |
| Wiring cost | new lane or engine-visible change | new source + rung + voter | promotion of an ingested series, or a rule repair |

`Severity = weight × availability × cost` (max 27); the ranking is the sort
order, ties broken toward cheaper wiring first. **No backtest component —
ever** (01 §4.1).

## 3. The fill program (designed here, executed only on the owner's go)

Name: the **gold meter gap-fill program**. Home:
`docs/specs/gold-meter-gapfill/` (created by its first session). Sessions
`GF-S1..`. Every session ends with the next prompt (D-GA-9 lineage). The
beam formula, the honesty rules and the no-edge record are **inherited
unchanged**; the min-2 lane rule is **re-derived, not assumed** (P0 below).

| Phase | Content | Gate |
|---|---|---|
| GF-P0 — recalibration pre-registration | The proposed voter set (post-fill) added to the read-only harness as **new tables beside the frozen ones**; the lane rule (min-firing) re-derived per the GB-S1 protocol (C1/C2 criteria); lane count decided (OI-GA-2). No product code. | The calibration report updated; the owner's recorded go on the voter set |
| GF-P1 — repairs | Fix the half-implemented voters (H1–H7 defects): CFTC history backfill + extreme-based rule question, thin-voter treatments, sign decisions (the yield-curve polarity, H3), granularity where cheap. | Tests green; the meter's honesty tests re-run; PR merged |
| GF-P2 — promotions | The D-GA-4 winners: ingested-but-unwired series promoted to voters (expected candidates per 02: EBP/OFr-FSI-class stress, GPR-class event risk, M2/Michigan-class inflation, COFER/TIC-class sovereign — the matrix decides). Zero new fetches where possible. | The owner's recorded go per lane change; recalibration re-run if the set changed materially |
| GF-P3 — new free sources | The MISSING-FREE gaps worth their wiring: HY OAS (FRED), DTWEXBGS, DFII5/DFII2, Michigan 5–10y, WGC/ETF/Mint (per the ranking). Each with its licence row, rung, staleness window. | Licences documented (L0/L1 rules); gates green; deploy when the worker changes |
| GF-P4 — context additions | The context-only winners (X/G/H families) as cards/context lines with EN+fa copy (round 79+). | copy:audit clean |
| GF-P5 — acceptance + flip | The full acceptance walk (the GB 04 §6 precedent, re-written for this change set); the production matrix; the owner's recorded go before anything user-visible changes. | AC table green; deploy verified |

Ordering note: P1 before P2/P3 (repair is cheaper than expand and re-baselines
the audit honestly); P0 wraps around every voter-set change. GF sessions may
compress phases exactly as GB sessions did (the PROGRESS record is
authoritative).

## 4. Standing constraints for the fill program

- The frozen lineage (D-GB-9 as amended at GB-S7): `gold-score.ts` edits now
  require the owner's recorded approval **per seat change** — the audit's
  matrix is the justification attached to each such approval.
- The `?balance=lanes` parameter is inert; no preview-flag mechanism exists
  post-flip — any user-visible change ships behind the owner's recorded go,
  staged on a branch, per the P5 precedent.
- Full `pnpm gates` green before every push; branch + PR per phase; CI green
  verified on main; deploy only when the built worker changes.
- No forecasting claim accompanies any addition — copy says "conditions",
  the measured note + backtest link stay visible (AC-8 lineage).
- Every number in the report or PROGRESS comes from a run (01 §4.3).

## 5. The end state

When the fill program closes, the meter reads over a voter set that (a)
covers every classic family the owner locked in 02 v1, (b) contains no
half-implemented seat (every H1–H7 defect repaired or accepted-on-record),
and (c) still claims nothing about the future. That is the owner's
instruction, delivered: *nothing missed, nothing half-implemented.*
