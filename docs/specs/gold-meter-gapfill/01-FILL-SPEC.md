# 01. The fill spec — the phases, the gates, the constraints, the end state

The founding spec: the audit's `04-REPORT-AND-FILL-DESIGN.md` §3–§5 (the
fill design) + the audit report's §6 (the same design made concrete, loaded
with §4's ranked 47-row backlog). This file loads both; it changes nothing
about them. The ranked backlog itself lives in the report §4 (rank, W·A·C
severity, the named free source, the GF phase per row) — restated here only
as the per-phase loading, with the phase gates.

**Name: the gold meter gap-fill program.** Sessions `GF-S1..`, each ending
with the next prompt (the D-GA-9 convention handed over). The program
executes only on the owner's recorded go, phase by phase. The beam formula,
the honesty rules and the no-edge record are inherited unchanged (D-GF-2);
the min-2 lane rule is **re-derived, not assumed** (GF-P0's whole point).

## 1. The phases, loaded with the ranked backlog (the report §4 → §6.1)

| Phase | Content (ranks, rows) | Gate |
|---|---|---|
| **GF-P0 — recalibration pre-registration** | The proposed voter set (post-fill) added to the read-only harness as **new tables beside the frozen ones** — no product code; the lane rule (min-firing) re-derived per the GB-S1 protocol (the C1/C2 criteria over the corpus); **the lane count measured (OI-GA-2: 4-lane vs 5-lane scenarios)**; **the D-1 threshold calibration proposal** (the 17 level-only seats walked against their 02 treatments + the corpus distributions); the proposed set assembled from the owner's recorded decisions — undecided items default to the current seating, no silent changes; undecided decisions delivered as clearly-labelled SCENARIO tables + the printed decision list (the GA lock-fallback precedent) | The calibration report committed with its runnable record; **the owner's recorded go on the proposed voter set** |
| **GF-P1 — repairs** (ranks 1–5, 29) | **R6** the fed-expectations move threshold (D-2) · **D4** the usdjpy pct threshold (D-3) · **R4** the yield-curve sign execution (D-7/D-8, once the owner records the choice) · **R10** the gap-series persistence (D-6) · **F1** the CFTC archive backfill + the extreme-based rule question (D-4) + the D-18 readable-rule fix (the input-presence rule, owner-gated) · **X1** the gold-silver base deepening (D-5); plus the **repair-if-filled D-11/D-12** (the derived real curve) executing beside **R2's fill** in GF-P3 | Tests green; the meter's honesty tests re-run; the recalibration re-run if the set changed materially; PR merged |
| **GF-P2 — promotions** (ranks 6–18, 23) | The zero-new-fetch voting promotions: **R9 · S4 · G1 · R8 · S13 · S7 · F2 · S8 · I3 · D7** — plus the promote-worthy COBD questions: **D5 · I7 · S6 · G4** (OI-GA-3's territory). Every seat change individually owner-gated with the report's §4 row as its justification; the N-1 amendment executes with the owner's recorded answer | The owner's recorded go per lane change; recalibration re-run if the set changed materially |
| **GF-P3 — new free sources** (ranks 19–22, 24–28, 32–33) | **R2** DFII5 (unlocks D-11/D-12's derived real curve) · **D2** DTWEXBGS · **D9** DTWEXEMEGS · **F6** the Shanghai premium derivation · **F3/F4/F13** the WGC/official flows (per OI-GA-4's answer — context-first recommended) · **F7** the India parity · **S9** DPCREDIT · **I4** the UoM portal · **I9** the nowcast-surprise derivation. Each with its licence row, rung, staleness window | Licences documented (L0/L1 rules); gates green; deploy when the worker changes |
| **GF-P4 — context additions** (ranks 30–31, 34–47) | The context winners with EN+fa copy (round 79+ per OI-GA-6): **I10** the real gold price · **X7** gold/platinum · **I11** global liquidity · **F5 · F8 · F11 · F15 · F16** the flows/supply context cards · **G3** debt/GDP · **X5** gold-vs-equities · **R11** r-star · **F12** · **H1–H4** | `copy:audit` clean |
| **GF-P5 — acceptance + flip** | The full acceptance walk (the GB 04 §6 precedent, re-written for this change set); the production matrix; nothing user-visible ships without the owner's recorded go, staged on a branch, per the P5 precedent | AC table green; deploy verified |

**Ordering (the report §6.1):** P1 before P2/P3 (repair is cheaper than
expand and re-baselines the audit honestly); **P0 wraps around every
voter-set change** — no new voter counts before the recalibration re-runs.
GF sessions may compress phases exactly as GB sessions did (the PROGRESS
record is authoritative).

## 2. The gates, stated once

- **The owner's recorded go** — per seat change (the per-seat approval rule,
  D-GF-1); per phase (the phase gate above); the owner's go on the proposed
  voter set closes P0.
- **`pnpm gates` green before every push** (D-GF-9): secret scan first
  (credentials never enter the repo), typecheck, lint, copy:audit, the full
  test suite, build + budget. Branch + PR per phase; CI green verified on
  main; merge yourself when the exit gate holds.
- **The recalibration re-run** whenever the voter set changed materially
  (D-GF-6): the C1/C2 verdicts + the lane stats re-derived over the corpus
  BEFORE the new seat counts anywhere.
- **Deploy only when the built worker changes** (D-GF-9): docs/scripts-only
  sessions (P0) deploy nothing.

## 3. The standing constraints (the audit's 04 §4, restated — binding every session)

1. **The per-seat approval rule** (D-GB-9 as amended at GB-S7, inherited as
   D-GF-1): every `gold-score.ts` / `GOLD_LANE_VOTERS` edit requires the
   owner's recorded approval per seat change — the audit report's §4 row is
   the justification attached to each approval.
2. The `?balance=lanes` parameter is inert; no preview-flag mechanism exists
   post-flip — any user-visible change ships behind the owner's recorded go,
   staged on a branch, per the P5 precedent.
3. No forecasting claim accompanies any addition — copy says "conditions",
   the measured note + backtest link stay visible (AC-8 lineage; D-GF-3).
4. Every number in any fill-program report or PROGRESS comes from a run
   (D-GF-5) — the GA evidence-pack convention: the script + the committed
   output.
5. Free-first (D-GF-4): every new source is free/keyless/licence-clean;
   EODHD only with the owner's recorded per-item approval (none proposed).
6. The taxonomy stays LOCKED (D-GF-7); N-1's answer, if
   AMEND, is an owner-recorded amendment with its date — the denominator
   becomes 86 and the report's arithmetic restates downstream. **EXECUTED
   at GF-P2 (2026-11-05, the owner's recorded answer G): the v1.1 → v1.2
   amendment** — the N-A1 euro-area realised-inflation row recorded; the
   denominator is 86.

## 4. The end state (the audit's 04 §5)

When the fill program closes, the meter reads over a voter set that **(a)**
covers every classic family the owner locked in 02 v1 (every row COVERED,
PARTIAL-repaired, CONTEXT-ONLY-BY-DESIGN on record, or MISSING with the
owner's recorded accept), **(b)** contains no half-implemented seat (every
D-1..D-18 defect repaired or accepted-on-record), and **(c)** still claims
nothing about the future. That is the owner's instruction, delivered:
*nothing missed, nothing half-implemented.*
