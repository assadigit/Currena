# AGENT_HANDOFF — Currena: the gold meter gap-fill program (P0 ANSWERED + P1 DELIVERED at GF-S7, GF-S8 = the P2 promotions next)

> The owner's **gold meter audit** program (`docs/specs/gold-meter-audit/`)
> is **CLOSED — COMPLETE 2026-11-05 at GA-S4**: A1–A4 whole (the taxonomy
> LOCKED v1.1 = 85 rows · the inventory + wiring pack · the coverage
> matrix + the 18 half-implementation defects · the report + the
> fill-program design). The audit's verdict:
> `docs/insights/GOLD-METER-AUDIT-REPORT.md` — the owner-readable record
> of what the meter sees and what it does not. The successor — the
> **gold meter gap-fill program** (owner-gated; its home
> `docs/specs/gold-meter-gapfill/`) — executes the fills phase by phase
> on the owner's recorded go. **The owner's answers A–K are RECORDED
> (GF-S7, 2026-11-05 — the answer sheet: the README's decision table,
> with the standing delegation "Generally, I trust your decisions. go
> full autonomously.")**; GF-P1 is DELIVERED. The predecessor gold balance
> consolidation is COMPLETE, LIVE and CLOSED (2026-11-04, GB-S7): the
> consolidated lane balance is THE gold card for every visitor on
> currena.ir. Never record credentials here.

## A. What comes next

The **GF-S8 session** — the P2 promotions on the owner's recorded
answers (B/C/G/K: the twelve promote seats + the flows lane +
GOLD_LANE_STRONG 4-of-5 + the N-1 amendment). Its kickoff prompt is at
the foot of `docs/specs/gold-meter-gapfill/PROMPTS.md` (the D-GA-9
convention) — paste it into a fresh session at the repo root.

| Program | Milestone | Branch |
|---|---|---|
| gold meter audit — **CLOSED (2026-11-05)** | GA-S1 (the taxonomy, LOCKED v1.1 = 85) · GA-S2 + completion (the inventory + wiring pack) · GA-S3 (the matrix + the defects) · GA-S4 (the report + the fill design) | `ga/s1-taxonomy` · `ga/s2-inventory` · `ga/s2-wiring` · `ga/s3-matrix` · `ga/s4-report` — all merged |
| gold meter gap-fill — **P0 ANSWERED + P1 DELIVERED (GF-S7, 2026-11-05); GF-S8 = the P2 promotions NEXT** | GF-S1 delivered P0 (the calibration + the harness tables). GF-S2..GF-S6 re-issued the decision list A–K (the lock-fallback ×5). **GF-S7 recorded the owner's answers A–K + executed GF-P1**: the D-7/D-8 context demotion (21 → 19 voters: 6/3/5/5) · the five derived thresholds in the production SIGNAL_LEG_MOVE · the D-18 input-presence rule · the data plane (the CFTC archive parse production-owned + the one-off gf-p1-backfill — the three `insights:hist:*` keys written to production KV; the rung-2 gap persistence repair; the gold-silver base deepening over Yahoo GC=F÷SI=F) · the D-GF-6 recalibration (the committed report byte-for-byte + the gf-p1-verify evidence: production ≡ POST-P1-DEMOTE in ALL 2512 windows) · the tests restated (insights 1310 · web 12617). → GF-S8: the P2 promotions (the twelve seats + the flows lane + STRONG 4-of-5 + the N-1 amendment) → P3 the new free sources (R2 DFII5 re-opens the D-7/D-8 sign question with the real curve) → P4 the context additions (I10 · X7 · I11 + the WGC family, copy round 79+) → P5 acceptance + flip | `gf/p0-recalibration` (merged) · `gf/s2-reissue`…`gf/s6-reissue` (merged) · `gf/p1-repairs` (merged at GF-S7) → `gf/p2-promotions` next |

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

## C. The state of the world (as the GF-S7 close leaves it, 2026-11-05)

- **THE AUDIT'S VERDICT** (`docs/insights/GOLD-METER-AUDIT-REPORT.md`):
  rows classified = 85 · voters mapped = 21 (20 + 1 UNCLASSICATED —
  `euro-hicp`, finding N-1) · defects = 18 (D-1 the structural
  17-of-21 level-only finding … D-18 the fake-steady finding) · the
  class tally COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID
  10 · CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3 — and the headline:
  **the meter fully covers 8/85 (≈ 9.4%) of the classic rows as healthy
  voting claims; 15/85 (≈ 17.6%) with any voting expression**. The
  RANKED 47-row backlog (severity W×A×C) maps every gap to its GF phase
  with its named free source. **GF-P1 repaired D-2/D-3/D-4/D-5/D-6/
  D-7/D-8/D-18** — the defects remaining for the fill program: D-9/D-10
  accept-with-note (stand) · D-11/D-12 repair-if-filled (ride R2 at
  P3) · D-13/D-15/D-16 accept-with-note · D-14 (the flows lane —
  rides the P2 re-seat) · D-17 (the N-1 amendment — rides the P2 work).
- **THE OWNER'S ANSWERS A–K ARE RECORDED** (GF-S7, 2026-11-05 — the
  answer sheet: the README's decision table, with the standing
  delegation "Generally, I trust your decisions. go full autonomously.").
  The P1 halves EXECUTED at GF-S7; the P2 halves (B the flows lane +
  STRONG 4-of-5 · C D5+S6 · G the N-1 amendment · K the twelve
  promotions) gate GF-S8; the P4 context adds (I10 · X7 · I11 + the WGC
  family, D's context-first) gate GF-P4.
- **THE GF-P1 RECALIBRATION IS DELIVERED AND REPRODUCIBLE** (the D-GF-6
  re-derivation): the committed calibration report
  (`evidence/gf-p0-calibration-2026-11-05.md`) reproduces byte-for-byte
  post-P1, and the NEW `evidence/gf-p1-verify-2026-11-05.md` + its run
  record pin **the production engine ≡ the measured POST-P1-DEMOTE
  scenario in ALL 2512 windows** (the composition equality + the
  threshold-map equality pinned by test). The verdict restated under
  the owner's recorded A: MIN2 all-windows C1 PASS · C2 FAIL (8 vs 7)
  — keep the criteria + MIN2 on judgment, the recorded price of the
  coverage.
- **THE DATA-PLANE BACKFILLS ARE WRITTEN** (production KV, the owner's
  environment-only credentials): `insights:hist:cftc-gold-positioning`
  (522 points — the 565-week CFTC archive) · `insights:hist:
  us-japan-10y-gap` (2350 points — DGS10 × MOF, persisted; rung-2 now
  merges its derive with the accumulation) · `insights:hist:gold-silver`
  (2555 points — the Yahoo GC=F÷SI=F deepening, stored values winning
  on collision). The readings heal on their own cadences (cftc at the
  next Saturday rung — the D-18 rule renders it honestly `unread`
  until then).
- **THE GF-P0 CALIBRATION EVIDENCE STANDS**
  (`evidence/gf-p0-calibration-2026-11-05.md` + the run record + the
  fixtures; the harness tables in `packages/insights/src/gf-p0-proposed.ts`):
  the FROZEN baseline reproduced BACKTEST-GOLD-LANES.md cell-for-cell;
  every proposed set FAILS the pre-registered C2 on the all-windows
  scope under both crowd rules (the STOP branch — resolved by the
  owner's recorded A); OI-GA-2 measured (the flows lane votes
  759/2512 = 30.2% post-backfill, MIN2); the D-1 thresholds derived
  (the five values — EXECUTED into production at GF-P1); the per-seat
  firing tables (§6) — the go/no-go evidence for every P2 promotion.
- **The taxonomy is LOCKED** (02 v1.1 = 85 rows, LOCKED 2026-11-05 by
  the owner's delegated instruction — the lock record at 02's foot).
  Additions are owner-recorded amendments with dates only (D-GA-1); the
  N-1 AMEND (the owner's recorded G) executes with the P2 work — the
  denominator becomes 86.
- Production: currena-api serving the consolidated lane balance for
  every visitor; `goldSummary` retired from the wire (GB-S7). **The
  audited object AS OF GF-P1**: the 19-voter table (borrowing costs 6 ·
  dollar 3 · market stress 5 · inflation 5 — the two yield-curve seats
  demoted to context per the owner's recorded H), `evalLeg` (the
  30-day move beyond the per-leg minimum — 7 of 19 seats carry one now,
  the P1 five included), the min-2 lane rule (MIN2 — the owner's
  recorded A), the D-18 input-presence rule, the derived Outlook, the
  context pill.
- The GF-P1-repaired seats: `cftc-gold-positioning` (the 565-week base
  written — fires from the next Saturday rung; the D-18 rule renders it
  honestly `unread` until then), `us-japan-10y-gap` (the persisted
  2350-point history + the rung-2 merge — the intermittent percentile
  repaired), `gold-silver` (the base deepened to 2555 points),
  `fed-expectations`/`usdjpy`/`fed-target` (the derived thresholds —
  the move legs live).

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
byte-for-byte (re-verified at GF-S2..GF-S6 and again POST-P1 at GF-S7;
the GF-P1 verify record: `scripts/gf-p1-verify.ts` + the backfill
`scripts/gf-p1-backfill.ts`; the credentials live in the environment
only, never in the repo).
