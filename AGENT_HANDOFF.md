# AGENT_HANDOFF — Currena: the gold meter gap-fill program (P0 ANSWERED + P1 + P2 DELIVERED — GF-S8 executed the promotions; GF-S9 = the P3 new free sources next)

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

The **GF-S9 session** — the P3 new free sources (R2 DFII5 unlocks the
D-11/D-12 derived real curve and re-opens the D-7/D-8 sign question ·
D2 DTWEXBGS · D9 DTWEXEMEGS · F6 the Shanghai premium · F3/F4/F13 the
WGC/official flows per the recorded context-first answer · F7 · S9
DPCREDIT · I4 · I9). Its kickoff prompt is at the foot of
`docs/specs/gold-meter-gapfill/PROMPTS.md` (the D-GA-9 convention) —
paste it into a fresh session at the repo root.

| Program | Milestone | Branch |
|---|---|---|
| gold meter audit — **CLOSED (2026-11-05)** | GA-S1 (the taxonomy, LOCKED v1.1 = 85) · GA-S2 + completion (the inventory + wiring pack) · GA-S3 (the matrix + the defects) · GA-S4 (the report + the fill design) | `ga/s1-taxonomy` · `ga/s2-inventory` · `ga/s2-wiring` · `ga/s3-matrix` · `ga/s4-report` — all merged |
| gold meter gap-fill — **P0 ANSWERED + P1 + P2 DELIVERED (GF-S8, 2026-11-05); GF-S9 = the P3 new free sources NEXT** | GF-S1 delivered P0 (the calibration + the harness tables). GF-S2..GF-S6 re-issued the decision list A–K (the lock-fallback ×5). **GF-S7 recorded the owner's answers A–K + executed GF-P1; GF-S8 EXECUTED GF-P2**: the 32-seat five-lane voter table (6/5/10/9/2 — the measured POST-P2-5LANE composition; the F2 seat is the REAL OBJECT `cftc-gold-gross-long`, the in-session design decision recorded in PROGRESS's GF-S8 block) · the flows lane + GOLD_LANE_STRONG = 4-of-5 (the owner's recorded B) · the N-1 v1.2 taxonomy amendment (the denominator 86) · the D7 usdchf context card · the F2 data plane (the gross-legs parse + the gf-p2-backfill: 522 points written to production KV) · the D-GF-6 recalibration (the committed report byte-for-byte + the gf-p2-verify evidence: production ≡ POST-P2-5LANE in ALL 2512 windows, the F2 id mapping recorded) · the tests restated (insights 1311 · web 12617 — 14,602 total) · copy round-79 triaged. → GF-S9: the P3 new free sources (R2 DFII5 re-opens the D-7/D-8 sign question with the real curve) → P4 the context additions (I10 · X7 · I11 + the WGC family, copy round 80+) → P5 acceptance + flip | `gf/p0-recalibration` (merged) · `gf/s2-reissue`…`gf/s6-reissue` (merged) · `gf/p1-repairs` (merged at GF-S7) · `gf/p2-promotions` (merged at GF-S8) → `gf/p3-new-sources` next |

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

## C. The state of the world (as the GF-S8 close leaves it, 2026-11-05)

- **THE AUDIT'S VERDICT** (`docs/insights/GOLD-METER-AUDIT-REPORT.md`,
  restated to the v1.2 denominator at GF-P2):
  rows classified = 86 (the v1.1 → v1.2 amendment, the owner's recorded
  G — N-A1 the euro-area realised-inflation row; `euro-hicp` maps to
  it, N-1 RESOLVED) · voters mapped = 21, ALL CLASSIFIED · defects =
  18 (D-1 the structural
  17-of-21 level-only finding … D-18 the fake-steady finding) · the
  class tally COVERED 9 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID
  10 · CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3 — the headline
  restated: **9/86 (≈ 10.5%) of the classic rows as healthy voting
  claims**. The
  RANKED 47-row backlog (severity W×A×C) maps every gap to its GF phase
  with its named free source. **GF-P1 repaired D-2/D-3/D-4/D-5/D-6/
  D-7/D-8/D-18; GF-P2 repaired D-14 (the flows lane) + D-17 (the N-1
  amendment)** — the defects remaining: D-9/D-10
  accept-with-note (stand) · D-11/D-12 repair-if-filled (ride R2 at
  P3) · D-13/D-15/D-16 accept-with-note.
- **THE OWNER'S ANSWERS A–K ARE RECORDED** (GF-S7, 2026-11-05 — the
  answer sheet: the README's decision table, with the standing
  delegation "Generally, I trust your decisions. go full autonomously.").
  The P1 halves EXECUTED at GF-S7; the P2 halves (B the flows lane +
  STRONG 4-of-5 · C D5+S6 · G the N-1 amendment · K the twelve
  promotions) EXECUTED at GF-S8; **GF-P3 (the new free sources) is
  next**; the P4 context adds (I10 · X7 · I11 + the WGC family, D's
  context-first) gate GF-P4.
- **THE GF-P2 RECALIBRATION IS DELIVERED AND REPRODUCIBLE** (the D-GF-6
  re-derivation): the committed calibration report
  (`evidence/gf-p0-calibration-2026-11-05.md`) reproduces byte-for-byte
  post-P2, and the NEW `evidence/gf-p2-verify-2026-11-05.md` + its run
  record pin **the production engine ≡ the measured POST-P2-5LANE
  scenario in ALL 2512 windows** (the F2 id mapping recorded:
  cftc-gold-gross-long ↔ gf-f2-gross-long-share; the composition + the
  threshold-map equality pinned by test). The verdict under
  the owner's recorded A: MIN2 all-windows C1 PASS (level 24.2% ·
  full-tip 16.0%) · C2 FAIL (10 vs 7)
  — keep the criteria + MIN2 on judgment, the recorded price of the
  coverage. (The P1-era pin `evidence/gf-p1-verify-2026-11-05.md`
  stands as the dated record — the p2 evidence supersedes it as the
  live pin.)
- **THE DATA-PLANE BACKFILLS ARE WRITTEN** (production KV, the owner's
  environment-only credentials): `insights:hist:cftc-gold-positioning`
  (522 points — the 565-week CFTC archive) · `insights:hist:
  cftc-gold-gross-long` (522 points — the F2 gross-long share, the
  same archive; read-back verified 56.3806 @ 2026-10-27) ·
  `insights:hist:
  us-japan-10y-gap` (2350 points — DGS10 × MOF, persisted; rung-2 now
  merges its derive with the accumulation) · `insights:hist:gold-silver`
  (2555 points — the Yahoo GC=F÷SI=F deepening, stored values winning
  on collision). The readings heal on their own cadences (both cftc
  seats at the next Saturday rung — the D-18 rule renders them
  honestly `unread` until then).
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
- **The taxonomy is LOCKED** (02 v1.2 = 86 rows — v1.1 LOCKED 2026-11-05
  by the owner's delegated instruction; the v1.1 → v1.2 amendment is the
  owner's RECORDED answer G, executed at GF-P2 with its date — the
  amendment record at 02's head; additions remain owner-recorded
  amendments with dates only, D-GA-1).
- Production: currena-api serving the consolidated lane balance for
  every visitor; `goldSummary` retired from the wire (GB-S7). **The
  audited object AS OF GF-P2**: the **32-voter five-lane table**
  (borrowing costs 6 · dollar 5 · market stress 10 · inflation 9 ·
  flows 2 — the measured POST-P2-5LANE composition; cftc re-seated
  into flows with the F2 real object `cftc-gold-gross-long`, D-14's
  repair), `evalLeg` (the 30-day move beyond the per-leg minimum —
  the derived thresholds live, the R9/t5yie pair ACTIVATED with the
  promotions), the min-2 lane rule (MIN2 — the owner's recorded A),
  the D-18 input-presence rule, **GOLD_LANE_STRONG = 4-of-5** (the
  owner's recorded B), the derived Outlook, the context pill.
  Deployed worker version 9311eaf3-e2c0-4265-9e77-73993b8fb398 (the
  live verification: for 2 · against 0 · neutral 2 · unread 1 — the
  flows lane honestly `unread` until Saturday's rung).
- The GF-P2-promoted seats fire live (the live verification's
  members): term-premium-10y (R9) · ebp (S4) · michigan-sentiment
  (S13) · sp500-breadth-ratio (S6) · usd-reserve-share (D5) ·
  nyfed-custody (G4) — the rest of the twelve seated and steady on
  their own cadences (gpr-daily · epu-us · t5yie ·
  michigan-1y-expectations · m2-us · us-deficit-12m · the two flows
  seats unread until Saturday). The GF-P1-repaired seats stand as
  recorded (`us-japan-10y-gap` — the persisted 2350-point history +
  the rung-2 merge; `gold-silver` — the 2555-point base;
  `fed-expectations`/`usdjpy`/`fed-target` — the derived thresholds'
  move legs live).

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
byte-for-byte (re-verified at GF-S2..GF-S6 and again POST-P1 at GF-S7
and POST-P2 at GF-S8; the GF-P1 verify record: `scripts/gf-p1-verify.ts`
+ the backfill `scripts/gf-p1-backfill.ts`; the GF-P2 verify record:
`scripts/gf-p2-verify.ts` + the backfill `scripts/gf-p2-backfill.ts`;
the credentials live in the environment
only, never in the repo).
