# PROGRESS — the gold meter gap-fill program

The running record of the owner-gated fill program (the spec set:
`docs/specs/gold-meter-gapfill/` — README + 01-FILL-SPEC + PROMPTS). One
line per milestone, one block per session; every number comes from a run or
a citation the session actually made. The predecessor programs are both
CLOSED: the gold meter audit (COMPLETE 2026-11-05 — its record:
`docs/specs/gold-meter-audit/PROGRESS.md`; its verdict:
`docs/insights/GOLD-METER-AUDIT-REPORT.md`) and the gold balance
consolidation (COMPLETE, LIVE 2026-11-04 — its record:
`docs/specs/gold-balance-consolidation/PROGRESS.md`). The audit changed
nothing (D-GA-3); every meter change is this program's, owner-gated
(the per-seat approval rule, D-GF-1).

## The milestone table

| ID | Milestone (spec ref) | State |
|---|---|---|
| P0 | The recalibration pre-registration: the program home; the proposed voter set in new read-only harness tables beside the frozen ones; the lane rule (min-firing) re-derived per the GB-S1 C1/C2 protocol; the OI-GA-2 lane-count scenarios; the D-1 threshold calibration proposal; the owner's decision list printed | ✅ **DELIVERED (awaiting the owner's go) — GF-S1 (2026-11-05)**: the program home (README + 01-FILL-SPEC + PROGRESS + PROMPTS); `packages/insights/src/gf-p0-proposed.ts` — the proposed voter tables + the parameterized engines BESIDE the frozen ones (pinned by test ×14, `gf-p0-proposed.test.ts`); the calibration delivered with its runnable record (`scripts/gf-p0-record-candidates.ts` + `scripts/gf-p0-calibration.ts` + the fixtures `gf-p0-candidates.json` · `gf-p0-cftc-backfill.json` · the report `evidence/gf-p0-calibration-2026-11-05.md` + the run `evidence/gf-p0-run-2026-11-05.txt`): the FROZEN baseline reproduced BACKTEST-GOLD-LANES.md cell-for-cell (the drift gate asserted); **the min-firing re-derivation: MIN2 re-affirmed on the frozen set; every proposed set FAILS the pre-registered C2 on the all-windows scope under both rules (flips 8–10 vs the sets' own net-sign 7) → the protocol's STOP branch — the numbers come to the owner**; the OI-GA-2 scenarios measured (the flows lane votes in 759/2512 windows post-backfill, MIN2); the D-1 derivation delivered (the anchors' median firing share 51.4%; five derived values: fed-expectations 0.13 · usdjpy 1.38 · fed-target 0.25 (the FOMC step grid) · term-premium-10y 0.07 · t5yie 0.1; the 22-seat accept-with-note walk); the decision list re-issued (the GA lock-fallback — no decisions recorded pre-session) — **the re-issue REPEATED at GF-S2 (2026-11-05) with the lane-rule question added as item A; still awaiting the owner's answers** |
| P1 | The repairs (ranks 1–5, 29): R6 the fed-expectations threshold (D-2) · D4 the usdjpy threshold (D-3) · R4 the yield-curve sign execution (D-7/D-8) · R10 the gap persistence (D-6) · F1 the CFTC backfill + D-18 the readable rule (D-4) · X1 the base deepening (D-5); D-11/D-12 ride R2 in P3 | ⏳ PENDING — owner-gated (the P0 go first) |
| P2 | The promotions (ranks 6–18, 23): the zero-new-fetch voting class R9 · S4 · G1 · R8 · S13 · S7 · F2 · S8 · I3 · D7 + the COBD questions D5 · I7 · S6 · G4 — every seat change individually owner-gated | ⏳ PENDING |
| P3 | The new free sources (ranks 19–22, 24–28, 32–33): R2 DFII5 · D2 DTWEXBGS · D9 DTWEXEMEGS · F6 the Shanghai premium · F3/F4/F13 per OI-GA-4 · F7 · S9 DPCREDIT · I4 · I9 | ⏳ PENDING |
| P4 | The context additions with EN+fa copy round 79+ (ranks 30–31, 34–47): I10 · X7 · I11 · F5 · F8 · F11 · F15 · F16 · G3 · X5 · R11 · F12 · H1–H4 | ⏳ PENDING |
| P5 | The acceptance walk + the flip (nothing user-visible without the owner's recorded go, staged on a branch) | ⏳ PENDING |

## Session log

### GF-S1 (2026-11-05) — the P0 recalibration pre-registration (P0 delivered; the owner's go awaited)

- **Read-first done**: the audit report (§1–§7 whole) + the full evidence
  pack (coverage-matrix · half-implementation · wiring · inventory ·
  history-depths · the wire scans · the lean check) + the GB-S1 calibration
  record (02 §6 + BACKTEST-GOLD-LANES.md) + the code (gold-score.ts ·
  gold-balance.ts · connections.ts · gold-backtest-core.ts ·
  gold-backtest.ts · the corpus fixtures) re-read before writing;
  `git pull --rebase` clean. **The owner's decisions: NONE recorded** (the
  repo + the chat hold no post-GA-S4 answers) → the GA lock-fallback
  precedent applies: scenario tables + the printed decision list.
- **The program home** (README + 01-FILL-SPEC + PROGRESS + PROMPTS): the
  decision log D-GF-1..9 (the per-seat approval rule · the beam formula
  inherited · the no-forecasting rule · free-first · every number from a
  run · P0-wraps-every-change · the taxonomy lock · the D-18-first rule ·
  the delivery discipline), the phases GF-P0..P5 loaded with the ranked
  backlog, the gates, the standing constraints, the end state.
- **The harness additions** (no product code, D-GF-1):
  `packages/insights/src/gf-p0-proposed.ts` — the proposed voter tables
  (GF_VOTERS_P2_4LANE = 31 seats 6/5/11/9, the yield-curve demotion per
  the audit's recommendation; GF_VOTERS_5LANE = 32 seats with the flows
  lane holding F1 + the F2 proxy) + GF_MOVE_P1_PROPOSED (the five derived
  thresholds) + the parameterized engines (gfEvalLeg · gfLaneBalance ·
  gfNetScore · gfCalibrationStats) — each equivalence PINNED BY TEST
  against the frozen evaluators (`gf-p0-proposed.test.ts`, 14 tests).
- **The recorder** (`scripts/gf-p0-record-candidates.ts`, read-only): the
  promotion candidates' staged series from the live KV stage blob
  (written 2026-11-04T04:35:18Z) + two disclosed fresh fetches through
  the repo's own adapters (ebp — absent from this week's stage; jgb-10y —
  the D-6 derivation input) → `fixtures/gf-p0-candidates.json` (16
  series); the CFTC legacy futures-only historical archive (the D-4
  backfill source: deacot2016..2026.zip, 11 files, the LONG-format gold
  rows passing the production parse's own arithmetic-identity assertions,
  0 failures) → `fixtures/gf-p0-cftc-backfill.json` (565 gold weeks
  2016-01-05 → 2026-10-27).
- **The calibration** (`scripts/gf-p0-calibration.ts` → the report
  `evidence/gf-p0-calibration-2026-11-05.md` + the run record
  `evidence/gf-p0-run-2026-11-05.txt`): the window assembly replicated
  gold-backtest.ts over the frozen corpus (2512 windows, the frozen
  clock, no lookahead, the D-6 cross-fill) + the post-P1 basis (the
  backfill, the derived gap us10y×jgb = 2375 pts, the candidates, the F2
  proxy). **The FROZEN baseline reproduced BACKTEST-GOLD-LANES.md
  cell-for-cell** (the script asserts the committed numbers — MIN2 all:
  885/628/999, fullTip 1248, flips 8 vs 9; …; the assertion passed).
  **The min-firing re-derivation**: the FROZEN set re-affirms MIN2 (C1
  PASS · C2 PASS on all windows); **every proposed set FAILS the
  pre-registered C2 on the all-windows scope under BOTH rules** (the
  repairs/promotions smooth each set's own net sign to 7 flips — 4 mature
  — while the lane verdict holds 8–10) → **the protocol's STOP branch:
  the min-firing rule for the proposed sets is NOT selectable on this
  corpus; the numbers come to the owner** (report §4, stated plainly).
  **OI-GA-2 measured**: the F-family's firing statistics are real over
  the backfilled history (F1 fires 1008/2512, the F2 proxy 1055/2512);
  the flows lane votes in 759 windows (30.2%) under MIN2 (for 286 ·
  against 473 · neutral 1753) — both compositions measured on C1/C2.
  **The D-1 derivation**: the anchors' median firing share 51.4% (the
  band 35.2–58.1%); five derived values (fed-expectations 0.13 pts ·
  usdjpy 1.38 pct · fed-target 0.25 pts — exactly the FOMC step grid ·
  term-premium-10y 0.07 pts · t5yie 0.10 pts) + the 22-seat
  accept-with-note walk, every reason cited. **The per-seat firing
  tables** (the 21 + the 15 candidates + the F2 proxy + the object
  alternatives gpr-index/tpu-us) — the owner's go/no-go evidence per row.
  **The D-18 rule measured**: 6 inputless windows over the frozen basis;
  the rule and the D-4 repair are complements.
- **Gates**: typecheck green · lint green (0/0) · the new test file 14/14
  · the full suite + build run in the PR gate before the merge; P0
  deploys nothing.
- **The decision list re-issued** (the report §8 + the README) — the
  GF-S2 prompt written (the decision-list re-issue with the owner's
  answers gate P1; PROMPTS.md).

### GF-S2 (2026-11-05) — the decision-list re-issue (the lock-fallback path: the deliverable halves only; the owner's answers still gate P1)

- **Read-first done**: the program home (README + 01-FILL-SPEC + PROGRESS
  + PROMPTS) + the calibration report §1–§9 + the run record + the audit
  report §4–§6 + the GF-P0 harness module (`gf-p0-proposed.ts`) + the
  fixtures (`gf-p0-candidates.json` · `gf-p0-cftc-backfill.json` · the
  frozen corpus) re-read before writing; `git pull --rebase` clean
  (origin/main at the GF-S1 merge, 0b81218). **The owner's decisions:
  NONE recorded** — the repo holds no post-GF-S1 answers (verified:
  `git log --all --since=2026-11-05` = the GF-S1 merge commits only) and
  the session's chat carried no answers → the GA lock-fallback precedent
  applies again: the deliverable halves (the report/record updates only),
  the decision list re-issued, P1 stays gated.
- **The environment re-verified fresh this session, before any record
  was written (D-GF-5)**: the calibration re-run over the committed
  fixtures (`pnpm exec tsx scripts/gf-p0-calibration.ts`) → **the
  committed report reproduced byte-for-byte** (`git status` clean after
  the run — the drift gate holds on the GF-S2 re-run); the pinned
  equivalence tests re-run → **14/14 green** (`gf-p0-proposed.test.ts`).
  No number in this session's records departs from the GF-S1 committed
  evidence.
- **The decision list re-issued (A–K)** — printed in the session's final
  message with the answer sheet; **the NEW lane-rule question (A — the
  C2 STOP branch) added to the living list**: the README's decision-list
  table now carries it as its first item (labelled A, the GF-P0 report
  §4's measured reading attributed — the one item the audit's §5 could
  not carry), and the OI-GA-2 row carries the calibration's measured
  addition (the flows lane 759/2512 = 30.2%, both compositions measured).
  The list remains recorded-open on every item.
- **The deliverable halves delivered** (docs/records only — no product
  code, no meter edit, nothing deployed, D-GF-1/D-GF-9): the README
  decision-list update above; this PROGRESS block + the P0 milestone row
  extended with the re-issue record; the CHANGELOG entry
  [2026-11-05f]; the GF-S3 prompt written (PROMPTS.md — the re-issue
  again, with the P1 pivot if the owner's answers arrive); the handoff
  restated for GF-S3 (AGENT_HANDOFF.md).
- **Gates**: docs-only session — typecheck + lint + the full suite +
  build run in the PR gate before the merge (`pnpm gates`); GF-S2
  deploys nothing.
