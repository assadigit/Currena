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
| P0 | The recalibration pre-registration: the program home; the proposed voter set in new read-only harness tables beside the frozen ones; the lane rule (min-firing) re-derived per the GB-S1 C1/C2 protocol; the OI-GA-2 lane-count scenarios; the D-1 threshold calibration proposal; the owner's decision list printed | ✅ **DELIVERED (GF-S1, 2026-11-05) → ANSWERED (GF-S7, 2026-11-05)**: the program home (README + 01-FILL-SPEC + PROGRESS + PROMPTS); `packages/insights/src/gf-p0-proposed.ts` (pinned by test, `gf-p0-proposed.test.ts`); the calibration with its runnable record (`scripts/gf-p0-calibration.ts` + the fixtures + the report `evidence/gf-p0-calibration-2026-11-05.md` + the run record): the FROZEN baseline reproduced BACKTEST-GOLD-LANES.md cell-for-cell; the min-firing re-derivation (MIN2 re-affirmed on the frozen set; every proposed set FAILS the pre-registered C2 on the all-windows scope → the STOP branch); the OI-GA-2 scenarios measured (the flows lane 759/2512 = 30.2%); the D-1 derivation (five values + the 22-seat walk). The decision list was re-issued six times (GF-S2..GF-S6, the lock-fallback). **The owner's answers A–K arrived and were RECORDED at GF-S7 (2026-11-05, in-chat, with the standing delegation "Generally, I trust your decisions. go full autonomously.") — every item answered; the answer sheet: the README's decision table** |
| P1 | The repairs (ranks 1–5, 29): R6 the fed-expectations threshold (D-2) · D4 the usdjpy threshold (D-3) · R4 the yield-curve sign execution (D-7/D-8) · R10 the gap persistence (D-6) · F1 the CFTC backfill + D-18 the readable rule (D-4) · X1 the base deepening (D-5); D-11/D-12 ride R2 in P3 | ✅ **DELIVERED (GF-S7, 2026-11-05)** — on the owner's recorded answers A (the P1 go: keep the criteria + MIN2) · H ((b) the D-7/D-8 context demotion — the 21-voter table became 19: 6/3/5/5) · I (the D-18 input-presence rule: a readable seat with neither evalLeg input reads `unread`, never `steady`) · J (the five derived thresholds into the production `SIGNAL_LEG_MOVE`: fed-expectations 0.13 · usdjpy 1.38 · fed-target 0.25 · term-premium-10y 0.07 · t5yie 0.10). The data plane: the CFTC archive parse production-owned (`adapters/cftc.ts`) + the one-off seeder `scripts/gf-p1-backfill.ts` (565 gold weeks → 522 pts · the gap DGS10×MOF 2379 pts persisted — rung-2 now MERGES its derive with the stored accumulation (the run.ts repair) · the gold-silver base deepened over Yahoo GC=F÷SI=F, 2513 daily points — the spot symbols XAU=X/XAG=X 404 on Yahoo's chart endpoint, probed and disclosed); the history keys WRITTEN to production KV via the script's --write run. **The D-GF-6 recalibration**: the committed calibration report re-run reproduces byte-for-byte (git clean) + the NEW `evidence/gf-p1-verify-2026-11-05.md` — the production engine ≡ the measured POST-P1-DEMOTE scenario in ALL 2512 windows; the C1/C2 rows reproduced (MIN2 all: C1 PASS · C2 FAIL 8 vs 7 — the owner's recorded A resolves the STOP branch on judgment). Tests: insights 1310 · web 12617 (the fixture pins restated — every delta traced to a recorded decision; the snapshot regenerated consciously) |
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

### GF-S3 (2026-11-05) — the decision-list re-issue again (the lock-fallback path repeated: the deliverable halves only; the owner's answers still gate P1)

- **Read-first done**: the program home (README — the decision list with
  A as its first item; 01-FILL-SPEC; PROGRESS — the GF-S2 block; PROMPTS
  — the GF-S3 prompt) + the calibration report §1–§9 + the run record +
  the audit report §4–§6 + the GF-P0 harness module
  (`packages/insights/src/gf-p0-proposed.ts`) + the fixtures
  (`gf-p0-candidates.json` · `gf-p0-cftc-backfill.json` · the frozen
  corpus) re-read before writing; `git pull --rebase` clean (origin/main
  at the GF-S2 merge, 772d6da). **The owner's decisions: NONE recorded**
  — the repo holds no post-GF-S2 answers (verified: `git log --all`
  since the GF-S2 merge = no commits after 772d6da — HEAD was the merge
  itself; the decision log + this file's GF-S2 block carry no answers)
  and the session's chat carried no answers → the GA lock-fallback
  precedent applies a third time: the deliverable halves (the
  report/record updates only), the decision list re-issued, P1 stays
  gated.
- **The environment re-verified fresh this session, before any record
  was written (D-GF-5)**: the calibration re-run over the committed
  fixtures (`pnpm --filter @currena/insights gf-p0-calibration`) →
  **the committed report reproduced byte-for-byte** (`git status` clean
  after the run — the drift gate holds on the GF-S3 re-run); the pinned
  equivalence tests re-run → **14/14 green** (`gf-p0-proposed.test.ts`).
  No number in this session's records departs from the GF-S1 committed
  evidence.
- **The decision list re-issued (A–K)** — printed in the session's final
  message with the answer sheet (one line per item, one recorded answer
  per line gates its half); the list stands as the README's decision
  table carries it (A the lane-rule question first — the C2 STOP branch,
  the P1 go rides it; the calibration's measured additions at ⚙). Still
  recorded-open on every item.
- **The deliverable halves delivered** (docs/records only — no product
  code, no meter edit, nothing deployed, D-GF-1/D-GF-9): the README
  decision-list status line updated (the GF-S3 re-issue recorded, the
  third re-issue); this PROGRESS block + the P0 milestone row extended
  with the third re-issue record; the CHANGELOG entry [2026-11-05g]; the
  GF-S4 prompt written (PROMPTS.md — the re-issue again, with the P1
  pivot if the owner's answers arrive); the handoff restated for GF-S4
  (AGENT_HANDOFF.md).
- **Gates**: docs-only session — typecheck + lint + the full suite +
  build run in the PR gate before the merge (`pnpm gates`); GF-S3
  deploys nothing.

### GF-S4 (2026-11-05) — the decision-list re-issue again (the lock-fallback path repeated: the deliverable halves only; the owner's answers still gate P1)

- **Read-first done**: the program home (README — the decision list with
  A as its first item; 01-FILL-SPEC; PROGRESS — the GF-S3 block; PROMPTS
  — the GF-S4 prompt) + the calibration report §1–§9 + the run record +
  the audit report §4–§6 + the GF-P0 harness module
  (`packages/insights/src/gf-p0-proposed.ts`) + the fixtures
  (`gf-p0-candidates.json` · `gf-p0-cftc-backfill.json` · the frozen
  corpus) re-read before writing; `git pull --rebase` clean (origin/main
  at the GF-S3 merge, 85fe4e8). **The owner's decisions: NONE recorded**
  — the repo holds no post-GF-S3 answers (verified: `git log` over
  origin/main since the GF-S3 merge = no commits after 85fe4e8 — HEAD
  was the merge itself; no branch newer than the merge; the decision log
  + this file's GF-S3 block carry no answers) and the session's chat
  carried no answers → the GA lock-fallback precedent applies a fourth
  time: the deliverable halves (the report/record updates only), the
  decision list re-issued, P1 stays gated.
- **The environment re-verified fresh this session, before any record
  was written (D-GF-5)**: the calibration re-run over the committed
  fixtures (`pnpm --filter @currena/insights gf-p0-calibration`) → **the
  committed report reproduced byte-for-byte** (`git status` clean after
  the run — the drift gate holds on the GF-S4 re-run); the pinned
  equivalence tests re-run → **14/14 green** (`gf-p0-proposed.test.ts`).
  No number in this session's records departs from the GF-S1 committed
  evidence.
- **The decision list re-issued (A–K)** — printed in the session's final
  message with the answer sheet (one line per item, one recorded answer
  per line gates its half); the list stands as the README's decision
  table carries it (A the lane-rule question first — the C2 STOP branch,
  the P1 go rides it; the calibration's measured additions at ⚙). Still
  recorded-open on every item.
- **The deliverable halves delivered** (docs/records only — no product
  code, no meter edit, nothing deployed, D-GF-1/D-GF-9): the README
  decision-list status line updated (the GF-S4 re-issue recorded, the
  fourth re-issue); this PROGRESS block + the P0 milestone row extended
  with the fourth re-issue record; the CHANGELOG entry [2026-11-05h];
  the GF-S5 prompt written (PROMPTS.md — the re-issue again, with the P1
  pivot if the owner's answers arrive); the handoff restated for GF-S5
  (AGENT_HANDOFF.md).
- **Gates**: docs-only session — typecheck + lint + the full suite +
  build run in the PR gate before the merge (`pnpm gates`); GF-S4
  deploys nothing.

### GF-S5 (2026-11-05) — the decision-list re-issue again (the lock-fallback path repeated: the deliverable halves only; the owner's answers still gate P1)

- **Read-first done**: the program home (README — the decision list with
  A as its first item; 01-FILL-SPEC; PROGRESS — the GF-S4 block; PROMPTS
  — the GF-S5 prompt) + the calibration report §1–§9 + the run record +
  the audit report §4–§6 + the GF-P0 harness module
  (`packages/insights/src/gf-p0-proposed.ts`) + the fixtures
  (`gf-p0-candidates.json` · `gf-p0-cftc-backfill.json` · the frozen
  corpus) re-read before writing; `git pull --rebase` clean (origin/main
  at the GF-S4 merge, 91d7fc1). **The owner's decisions: NONE recorded**
  — the repo holds no post-GF-S4 answers (verified: `git log` over
  origin/main since the GF-S4 merge = no commits after 91d7fc1 — HEAD
  was the merge itself; no branch newer than the merge; the decision log
  + this file's GF-S4 block carry no answers) and the session's chat
  carried no answers → the GA lock-fallback precedent applies a fifth
  time: the deliverable halves (the report/record updates only), the
  decision list re-issued, P1 stays gated.
- **The environment re-verified fresh this session, before any record
  was written (D-GF-5)**: the calibration re-run over the committed
  fixtures (`pnpm --filter @currena/insights gf-p0-calibration`) → **the
  committed report reproduced byte-for-byte** (`git status` clean after
  the run — the drift gate holds on the GF-S5 re-run); the pinned
  equivalence tests re-run → **14/14 green** (`gf-p0-proposed.test.ts`).
  No number in this session's records departs from the GF-S1 committed
  evidence.
- **The decision list re-issued (A–K)** — printed in the session's final
  message with the answer sheet (one line per item, one recorded answer
  per line gates its half); the list stands as the README's decision
  table carries it (A the lane-rule question first — the C2 STOP branch,
  the P1 go rides it; the calibration's measured additions at ⚙). Still
  recorded-open on every item.
- **The deliverable halves delivered** (docs/records only — no product
  code, no meter edit, nothing deployed, D-GF-1/D-GF-9): the README
  decision-list status line updated (the GF-S5 re-issue recorded, the
  fifth re-issue); this PROGRESS block + the P0 milestone row extended
  with the fifth re-issue record; the CHANGELOG entry [2026-11-05i]; the
  GF-S6 prompt written (PROMPTS.md — the re-issue again, with the P1
  pivot if the owner's answers arrive); the handoff restated for GF-S6
  (AGENT_HANDOFF.md).
- **Gates**: docs-only session — typecheck + lint + the full suite +
  build run in the PR gate before the merge (`pnpm gates`); GF-S5
  deploys nothing.

### GF-S6 (2026-11-05) — the decision-list re-issue again (the lock-fallback path repeated: the deliverable halves only; the owner's answers still gate P1)

- **Read-first done**: the program home (README — the decision list with
  A as its first item; 01-FILL-SPEC; PROGRESS — the GF-S5 block; PROMPTS
  — the GF-S6 prompt) + the calibration report §1–§9 + the run record +
  the audit report §4–§6 + the GF-P0 harness module
  (`packages/insights/src/gf-p0-proposed.ts`) + the fixtures
  (`gf-p0-candidates.json` · `gf-p0-cftc-backfill.json` · the frozen
  corpus) re-read before writing; `git pull --rebase` clean (origin/main
  at the GF-S5 merge, 74de329). **The owner's decisions: NONE recorded**
  — the repo holds no post-GF-S5 answers (verified: `git log` over
  origin/main since the GF-S5 merge = no commits after 74de329 — HEAD
  was the merge itself; no branch newer than the merge (the three
  unmerged remote branches are stale pre-GF feature branches, last
  touched 2026-10-17/18 and 2026-11-03, before this program opened); the
  decision log + this file's GF-S5 block carry no answers) and the
  session's chat carried no answers → the GA lock-fallback precedent
  applies a sixth time: the deliverable halves (the report/record
  updates only), the decision list re-issued, P1 stays gated.
- **The environment re-verified fresh this session, before any record
  was written (D-GF-5)**: the calibration re-run over the committed
  fixtures (`pnpm --filter @currena/insights gf-p0-calibration`) → **the
  committed report reproduced byte-for-byte** (`git status` clean after
  the run — the drift gate holds on the GF-S6 re-run); the pinned
  equivalence tests re-run → **14/14 green** (`gf-p0-proposed.test.ts`).
  No number in this session's records departs from the GF-S1 committed
  evidence.
- **The decision list re-issued (A–K)** — printed in the session's final
  message with the answer sheet (one line per item, one recorded answer
  per line gates its half); the list stands as the README's decision
  table carries it (A the lane-rule question first — the C2 STOP branch,
  the P1 go rides it; the calibration's measured additions at ⚙). Still
  recorded-open on every item.
- **The deliverable halves delivered** (docs/records only — no product
  code, no meter edit, nothing deployed, D-GF-1/D-GF-9): the README
  decision-list status line updated (the GF-S6 re-issue recorded, the
  sixth re-issue); this PROGRESS block + the P0 milestone row extended
  with the sixth re-issue record; the CHANGELOG entry [2026-11-05j]; the
  GF-S7 prompt written (PROMPTS.md — the re-issue again, with the P1
  pivot if the owner's answers arrive); the handoff restated for GF-S7
  (AGENT_HANDOFF.md).
- **Gates**: docs-only session — typecheck + lint + the full suite +
  build run in the PR gate before the merge (`pnpm gates`); GF-S6
  deploys nothing.

### GF-S7 (2026-11-05) — THE OWNER'S ANSWERS A–K RECORDED + GF-P1 EXECUTED (the repairs landed on the recorded go)

- **Read-first done**: the program home (README — the decision list; 01-FILL-SPEC — the P1 loading; PROGRESS — the GF-S6 block; PROMPTS — the GF-S7 prompt) + the calibration report §1–§9 + the run record + the audit report §3–§6 + the engines (`gold-score.ts` · `gold-balance.ts` · `gold-backtest-core.ts` · `connections.ts` · `gf-p0-proposed.ts` · the calibration + recorder scripts) + the data plane (`ingest/run.ts` · `adapters/cftc.ts` · `adapters/derived.ts` · `adapters/yahoo.ts` · `store.ts` · the nbs-backfill precedent) re-read before writing. The environment rebuilt fresh (the sandbox had reset — the repo re-cloned, `pnpm install --frozen-lockfile`, main verified at the GF-S6 merge 1024982).
- **THE OWNER'S ANSWERS ARRIVED AND WERE RECORDED** (the GF-S7 session's chat, 2026-11-05): every item A–K answered, with the standing delegation recorded beside them ("Generally, I trust your decisions. go full autonomously."). **The answer sheet: the README's decision table** (the recorded answer per row). The headline answers: **A (a) KEEP the criteria + MIN2** — the agent's judgment endorsed as the decision (C2's substance is not violated; (b) is not a clean fix — the 5-lane set still fails marginally under a frozen-net-sign re-basing (10 > 9); (c) would freeze the 8/85 coverage) — **the P1 go RECORDED**; **B ADD the flows lane + GOLD_LANE_STRONG = 4-of-5** (80% — preserves the 75% strictness; executes with P2); **C PROMOTE D5 + S6** (P2); **D context-first** (annualised-level extreme bands revisit-able once the cards exist); **E NO USE** (zero EODHD calls any phase — the key stays unused); **F standing**; **G AMEND N-1** (the denominator becomes 86 — executes with the P2 work); **H (b) the D-7/D-8 CONTEXT DEMOTION** (executed at P1); **I the D-18 INPUT-PRESENCE RULE** (executed at P1); **J the five derived values** (executed at P1); **K PROMOTE ×12** (R9 · S4 · G1 · S13 · S7-the-daily-object · S8 · I3 · F2 · R8 · I7 · G4) + **D7 context card first** (the seat question stays recorded-open) + **I10/X7/I11 context adds** (P2/P4).
- **GF-P1 EXECUTED** (branch `gf/p1-repairs`; every edit per the per-seat approval rule with the audit §4 row as the justification):
  - **H — the D-7/D-8 context demotion**: `GOLD_LANE_VOTERS` 21 → 19 (6/3/5/5) — the two yield-curve seats leave the voter set (context cards only; the sign question re-opens with the real curve at GF-P3/R2). The lineage preserved VERBATIM: `HARNESS_GOLD_VOTERS_21` (gold-backtest-core) + `GF_VOTERS_FROZEN_21` (gf-p0-proposed) — pinned equal, and production pinned ≡ `GF_VOTERS_P1_DEMOTE` (the measured POST-P1-DEMOTE scenario — the shipped meter and the measured scenario are the same object).
  - **J — the five derived thresholds** entered the production `SIGNAL_LEG_MOVE` (fed-expectations 0.13 · usdjpy 1.38 pct · fed-target 0.25 — the FOMC step grid · term-premium-10y 0.07 · t5yie 0.10 — the term-premium/t5yie thresholds activate with their P2 promotions); the map exported for the pins.
  - **I — the D-18 input-presence rule**: the production `goldBalance` member rule — a readable seat with neither evalLeg input (no threshold-or-change30d, no percentile10y) reads `unread`, never `steady`; the check rides evalLeg's own outputs so the rule and the evaluator cannot drift. `laneBalanceOverVoters` gains the `inputPresence` parameter (default false = the frozen lineage semantics).
  - **The data plane**: the CFTC legacy-archive parse production-owned (`adapters/cftc.ts` — `parseCftcGoldArchiveAnnual` + `fetchCftcGoldArchiveYear`, the recorder's own per-row assertions); the rung-2 gap persistence repair (`ingest/run.ts` — the derived gap MERGES with the stored accumulation instead of resetting to the stage window, the D-6 defect's root cause); the one-off `scripts/gf-p1-backfill.ts` (the nbs-backfill discipline: report-only default, `--write` gated, credentials environment-only): the CFTC 565 gold weeks 2016-01-05 → 2026-10-27 (11 files, 0 failures — the recorder's numbers reproduced exactly) → 522 points in the 10y history window · the gap FRED DGS10 × MOF all-file 2379 points (2016-09-20 → 2026-11-02 — the exact derivation the calibration simulated, 4 points fresher than the fixture) · the gold-silver base deepened over Yahoo **GC=F ÷ SI=F** (2513 daily points 2016-11-07 → 2026-11-05 — the spot-style XAU=X/XAG=X symbols return HTTP 404 on Yahoo's chart endpoint, probed and disclosed; the futures pair is the repo's OWN existing Yahoo metal pair, L2 owner-accepted, both legs same-day so the term structure cancels in the division). The three `insights:hist:*` keys WRITTEN to production KV through the Cloudflare REST store; the readings heal on their own cadences (gold-silver at the next 04:10 main build · the gap at the next 04:20 MOF rung · cftc at the next Saturday rung — until then the D-18 rule renders the seat honestly `unread`).
  - **The D-GF-6 recalibration**: the committed calibration report re-run over the fixtures → **byte-for-byte reproduction** (git clean after the run — the drift gate holds post-P1); the NEW `scripts/gf-p1-verify.ts` → `evidence/gf-p1-verify-2026-11-05.md` + the run record: **the production engine ≡ the measured POST-P1-DEMOTE scenario in ALL 2512 windows** (every lane field + the rollups) and the committed C1/C2 rows reproduced exactly (MIN2 all: level 20.6% · full-tip 48.1% · C1 PASS · C2 FAIL 8 vs 7 — **the owner's recorded A resolves the STOP branch on judgment: the criteria stay, MIN2 stays**; the single mature-scope MIN1 pass stated for completeness, not a selection).
  - **The tests restated** (every delta traced to a recorded decision): insights 1310 green (gf-p0-proposed.test: the production-config pins + the lineage pins via the new `gfScoreOverVoters`; gold-balance.test: the D-18 block + the fixture worked example recomputed — borrowing-costs FOR 3v1 (J), stress readable 4 with the unread cftc member (I), 19 members (H); gold-score/gold-backtest-core/gold-lane-calibration: the snapshot + demotion pins; eia-cftc.test: the archive-parse block) · web 12617 green (the lane-view fixture pins restated — the hero "Leaning for gold", the counts "1 for · 0 against · 3 not leaning", the outlook bullish; the split test rebuilt on a constructed 2v2 battery; the D-18 unread group now renders naturally in the stress row; the byte-stability snapshot regenerated consciously; the en+fa voterNames retired for the demoted seats) · core 195 · api 399.
- **Gates**: ALL GREEN — secret scan clean (8 patterns · 841 files) · typecheck 6 packages · lint 0/0 · copy:audit clean (the two retired voterNames manifest entries removed with the seats — the indicator CARD copy stays) · narrator vocabulary regenerated + in sync · layer1 strict 11819/11819 · **the full suite 14,601** (core 195 · scraper 67 · insights 1310 · markets 13 · api 399 · web 12617) · build + budget. PR #39 → CI green on the head → self-merged (39975f4) → **CI green on main verified**.
- **DEPLOYED (D-GF-9 — the built worker changed)**: the web app rebuilt + `pnpm run deploy` → the currena-api worker version ba315f31-58ff-4181-a60d-7f12ffada6da live (the same Worker serves the SPA — the 19-voter engine, the D-18 rule and the new thresholds are user-visible NOW; the SPA derives the balance client-side). **The live end-to-end verification**: the production engine over the LIVE public snapshot (generatedAt 2026-11-05T10:10:18Z, 161 readings) reads **for 1 · against 0 · neutral 3** — borrowing-costs FOR 3v1 (real-yield-10y falling · us10y falling · the fed-expectations threshold flip, against us30y high), the cftc member UNREAD (the D-18 rule live until Saturday's rung), 19 members (6/3/5/5) — exactly the GF-P1 shape, live for every visitor.
- **The close-out**: this PROGRESS block + the milestone rows (P0 answered · P1 delivered); the README decision table carries the answer sheet; the CHANGELOG entry [2026-11-05k]; the GF-S8 prompt written (PROMPTS.md — the P2 execution per the recorded answers B/C/K); the handoff restated (AGENT_HANDOFF.md).
