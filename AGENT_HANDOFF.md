# AGENT_HANDOFF — Currena: the gold meter gap-fill program (P0 delivered + re-issued ×3, GF-S4 next)

> The owner's **gold meter audit** program (`docs/specs/gold-meter-audit/`)
> is **CLOSED — COMPLETE 2026-11-05 at GA-S4**: A1–A4 whole (the taxonomy
> LOCKED v1.1 = 85 rows · the inventory + wiring pack · the coverage
> matrix + the 18 half-implementation defects · the report + the
> fill-program design). The audit's verdict:
> `docs/insights/GOLD-METER-AUDIT-REPORT.md` — the owner-readable record
> of what the meter sees and what it does not. The successor — the
> **gold meter gap-fill program** (owner-gated; its home
> `docs/specs/gold-meter-gapfill/`) — executes the fills phase by phase
> on the owner's recorded go. The predecessor gold balance consolidation
> is COMPLETE, LIVE and CLOSED (2026-11-04, GB-S7): the consolidated lane
> balance is THE gold card for every visitor on currena.ir. Never record
> credentials here.

## A. What comes next

The **GF-S4 session** — the decision-list re-issue again, with the P1
pivot on the owner's recorded answers (the program home:
`docs/specs/gold-meter-gapfill/`). Its kickoff prompt is at the foot of
`docs/specs/gold-meter-gapfill/PROMPTS.md` (the D-GA-9 convention) —
paste it into a fresh session at the repo root. **The owner's answers
(A–K) gate everything**; if they arrive before GF-S4 starts, the session
pivots to the P1 repairs per its work item 4.

| Program | Milestone | Branch |
|---|---|---|
| gold meter audit — **CLOSED (2026-11-05)** | GA-S1 (the taxonomy, LOCKED v1.1 = 85) · GA-S2 + completion (the inventory + wiring pack) · GA-S3 (the matrix + the defects) · GA-S4 (the report + the fill design) | `ga/s1-taxonomy` · `ga/s2-inventory` · `ga/s2-wiring` · `ga/s3-matrix` · `ga/s4-report` — all merged |
| gold meter gap-fill — **P0 DELIVERED (GF-S1) + the decision list RE-ISSUED (GF-S2 + GF-S3, 2026-11-05); the owner's answers gate P1; GF-S4 NEXT** | GF-S1 delivered P0: the program home + the proposed voter set in new read-only harness tables (pinned by test ×14) + the calibration with its runnable record — **the FROZEN baseline reproduced cell-for-cell; every proposed set FAILS the pre-registered C2 on the all-windows scope (the STOP branch — the numbers are with the owner); OI-GA-2 measured (the flows lane votes 30.2% of windows post-backfill); the D-1 thresholds derived (five values + the 22-seat walk)**. GF-S2 (the lock-fallback: no answers recorded) re-issued the list A–K, **added the lane-rule question as item A of the living list (the README's decision table)**, re-verified the environment (the calibration reproduced byte-for-byte; the tests 14/14). GF-S3 (the lock-fallback repeated: still no answers recorded — repo and chat both verified) checked for the answers FIRST, re-verified the environment again (byte-for-byte; 14/14) and re-issued the list a third time → the owner's answers gate P1 (repairs) → P2 promotions → P3 new free sources → P4 context additions → P5 acceptance + flip | `gf/p0-recalibration` (merged) · `gf/s2-reissue` (merged) · `gf/s3-reissue` (merged) → `gf/p1-repairs` next (or `gf/s4-reissue` if the answers are still absent) |

## B. The standing rules (read before any session)

1. **The per-seat approval rule** (D-GB-9 as amended at GB-S7, inherited
   as D-GF-1): every `gold-score.ts` / `GOLD_LANE_VOTERS` edit requires
   the owner's RECORDED approval **per seat change** — the audit
   report's §4 row is the justification attached to each approval.
2. **No forecasting claim, ever** (D-GA-2): the fill program adds
   coverage of the classic condition set, nothing more. The no-edge
   record (GOLD_BACKTEST_SPEC §5) stands; copy says "conditions".
3. **The beam formula, the honesty rules and the no-edge record are
   inherited unchanged**; the min-2 lane rule is re-derived, not
   assumed (GF-P0's whole point — and the re-derivation's C2 STOP
   branch is now decision item A, the owner's to answer).
4. **Free-first sourcing** (D-GA-5): every backlog source named by the
   audit is free/keyless/licence-clean; EODHD only with the owner's
   recorded per-item approval (none proposed).
5. **Every number from a run; every recommendation re-checked against
   code before it is written down** (the owner's 2026-10-31
   instruction).
6. **Delivery discipline** (D-GA-10 lineage): branch, PR early,
   gates/CI green, self-merge on the exit gate, CI green verified on
   main. `git pull --rebase` before touching shared files (CHANGELOG,
   AGENTS.md, the indicator tables). Deploy only when the built worker
   changes.
7. **End every session with the next prompt** (D-GA-9): rewritten in
   PROMPTS.md, committed, pushed, and printed in the final message —
   never end a session without one.

## C. The state of the world (as the GF-S3 close leaves it, 2026-11-05)

- **THE AUDIT'S VERDICT** (`docs/insights/GOLD-METER-AUDIT-REPORT.md`):
  rows classified = 85 · voters mapped = 21 (20 + 1 UNCLASSICATED —
  `euro-hicp`, finding N-1) · defects = 18 (D-1 the structural
  17-of-21 level-only finding … D-18 the fake-steady finding) · the
  class tally COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID
  10 · CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3 — and the headline:
  **the meter fully covers 8/85 (≈ 9.4%) of the classic rows as healthy
  voting claims; 15/85 (≈ 17.6%) with any voting expression**. The
  RANKED 47-row backlog (severity W×A×C) maps every gap to its GF phase
  with its named free source.
- **THE GF-P0 CALIBRATION IS DELIVERED AND REPRODUCIBLE**
  (`docs/specs/gold-meter-gapfill/evidence/gf-p0-calibration-2026-11-05.md`
  + the run record + the fixtures; the harness tables in
  `packages/insights/src/gf-p0-proposed.ts`, pinned by test ×14 —
  re-verified at GF-S2 and again at GF-S3: the committed report
  reproduces byte-for-byte):
  the FROZEN baseline reproduced BACKTEST-GOLD-LANES.md cell-for-cell;
  **every proposed set FAILS the pre-registered C2 on the all-windows
  scope under both crowd rules → the GB 02 §6 STOP branch: the
  min-firing rule for the proposed sets is NOT selectable on this
  corpus — the numbers are with the owner (decision item A)**; OI-GA-2
  measured (the flows lane votes 759/2512 = 30.2% post-backfill, MIN2);
  the D-1 thresholds derived (fed-expectations 0.13 · usdjpy 1.38 ·
  fed-target 0.25 — the FOMC step grid · term-premium-10y 0.07 ·
  t5yie 0.10; the 22-seat accept-with-note walk).
- **THE OWNER'S DECISION LIST (A–K) gates the fill program** — the
  living list is the README's decision table (`docs/specs/gold-meter-gapfill/README.md`):
  **A** the lane rule for the proposed sets (the C2 STOP branch —
  keep-criteria+MIN2 / amend-and-rerun / hold; the P1 go rides it) ·
  OI-GA-2 the fifth flows & demand lane (ADD recommended) · OI-GA-3 the
  D5/S6 shadow pair (fold into GF-P2) · OI-GA-4 WGC quarterly
  (context-first) · OI-GA-5 EODHD (no use proposed) · OI-GA-6 copy
  rounds 79+ (standing) · N-1 euro-hicp (AMEND recommended, the
  denominator becomes 86) · the D-7/D-8 yield-curve sign decision
  (context demotion recommended) · the D-18 readable-rule question
  (input-presence rule recommended) · the D-1 threshold question (the
  five derived values) · the 12 zero-new-fetch promotion go/no-gos
  (PROMOTE ×8 · CONTEXT ADD ×3 · D7 seat-or-context). **Nothing
  executes without the recorded go; every item stands recorded-open
  (re-issued at GF-S1, GF-S2 and GF-S3).**
- **The taxonomy is LOCKED** (02 v1.1 = 85 rows, LOCKED 2026-11-05 by
  the owner's delegated instruction — the lock record at 02's foot).
  Additions are owner-recorded amendments with dates only (D-GA-1).
- Production: currena-api serving the consolidated lane balance for
  every visitor; `goldSummary` retired from the wire (GB-S7). The
  audited object: the 21-voter table (borrowing costs 8 · dollar 3 ·
  market stress 5 · inflation 5), `evalLeg` (30-day move beyond the
  per-leg minimum — only 4 of 21 seats carry one), the min-2 lane rule,
  the derived Outlook, the context pill — all frozen until the fill
  program's owner-gated changes land.
- The known weak seats, quantified (history-depths-2026-11-05.txt):
  `cftc-gold-positioning` (1 staged point — never fires today; reads
  `steady` not `unread` — D-18), `us-japan-10y-gap` (percentile
  intermittent — 6/9 recorded days), `gold-silver` (base 119 — thin),
  the yield-curve polarity (fixed −1 on a regime-dependent claim — the
  owner's sign decision).

## D. If a session is interrupted

Commit and push the branch anyway (nothing is lost if the session dies);
the next session `git pull --rebase`s and re-reads the authoritative
records — the audit program's `docs/specs/gold-meter-audit/PROGRESS.md`
(CLOSED) and the fill program's `docs/specs/gold-meter-gapfill/
PROGRESS.md` (authoritative for the fill). If PROMPTS.md's latest prompt
disagrees with PROGRESS.md, PROGRESS.md wins and the prompt gets
rewritten. The GF-P0 calibration's runnable record:
`packages/insights/scripts/gf-p0-record-candidates.ts` +
`gf-p0-calibration.ts` over the committed fixtures (`packages/insights/
fixtures/gf-p0-*.json`) — re-running reproduces the committed report
byte-for-byte (re-verified at GF-S2 and GF-S3; the credentials live in
the environment only, never in the repo).
