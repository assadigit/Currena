# AGENT_HANDOFF — Currena: the gold meter gap-fill program (P0 ANSWERED + P1 + P2 + P3 DELIVERED WHOLE — GF-S10 landed the remainder + the P3 deploy; GF-S11 = the owner's decision round + P4 the context additions next)

> The owner's **gold meter audit** program (`docs/specs/gold-meter-audit/`)
> is **CLOSED — COMPLETE 2026-11-05 at GA-S4**: A1–A4 whole (the taxonomy
> LOCKED v1.2 = 86 rows · the inventory + wiring pack · the coverage
> matrix + the 18 half-implementation defects · the report + the
> fill-program design). The audit's verdict:
> `docs/insights/GOLD-METER-AUDIT-REPORT.md` — the owner-readable record
> of what the meter sees and what it does not. The successor — the
> **gold meter gap-fill program** (owner-gated; its home
> `docs/specs/gold-meter-gapfill/`) — executes the fills phase by phase
> on the owner's recorded go. **The owner's answers A–K are RECORDED
> (GF-S7, 2026-11-05 — the answer sheet: the README's decision table,
> with the standing delegation "Generally, I trust your decisions. go
> full autonomously.")**; GF-P1/P2/P3 delivered whole. The predecessor
> gold balance consolidation is COMPLETE, LIVE and CLOSED (2026-11-04,
> GB-S7): the consolidated lane balance is THE gold card for every
> visitor on currena.ir. Never record credentials here.

## A. What comes next

The **GF-S11 session** — TWO TRACKS: (1) **the owner's decision round**
(the GF-S10 open questions, printed in
`evidence/gf-p4-verify-2026-11-06.md` §4–§5 and in the GF-S11 prompt:
(a) the real-curve sign — context card / PLUS / MINUS / re-open the
object question, BOTH variants already measured; (b) the SGE display
class (question (e) — the Shanghai premium serves PRIVATE until the
owner's acceptance); (c) the WGC authorisation (question (f) — unlocks
F3/F4 + the whole WGC family or leaves it context-blocked); check the
repo + the chat for answers FIRST — the GF-S7 precedent; absent → the
GA lock-fallback: docs-only, the list re-issued, NO owner-gated
execution); (2) **P4 the context additions** (the free-first family:
I10 · X7 · I11 · G3 · X5 · R11 · F12 — the WGC family only if (c)
resolves). Then if budget allows: the P5 acceptance-walk preparation.
Its kickoff prompt is at the foot of `docs/specs/gold-meter-gapfill/
PROMPTS.md` (the D-GA-9 convention) — paste it into a fresh session at
the repo root.

| Program | Milestone | Branch |
|---|---|---|
| gold meter audit — **CLOSED (2026-11-05)** | GA-S1 (the taxonomy, LOCKED v1.2 = 86) · GA-S2 + completion (the inventory + wiring pack) · GA-S3 (the matrix + the defects) · GA-S4 (the report + the fill design) | `ga/s1-taxonomy` … `ga/s4-report` — all merged |
| gold meter gap-fill — **P0 ANSWERED + P1 + P2 + P3 DELIVERED WHOLE (GF-S10, 2026-11-06); GF-S11 = the owner's decision round + P4 NEXT** | GF-S1 delivered P0 (the calibration + the harness tables). GF-S2..GF-S6 re-issued the decision list (the lock-fallback ×5). GF-S7 recorded the owner's answers A–K + executed GF-P1. GF-S8 executed GF-P2 (the 32-seat table + the flows lane + STRONG 4-of-5 + the N-1 v1.2 amendment). GF-S9 executed GF-P3 (the four FRED voters → 36). **GF-S10 executed the REMAINDER (the recovery landing of two interrupted sessions — every claim re-verified from the recovery's own runs)**: I4 the UoM 5–10y anchor seated through the MEASURED POST-P4-5LANE scenario → **GOLD_LANE_VOTERS 37 (7/7/11/10/2)** · the D-11/D-12 real curve as the CONTEXT CARD with BOTH sign variants measured + the question PRINTED (a)–(d) · F6 the Shanghai premium context card + the SGE adapter + the rung-2 wiring + the backfill EXECUTED (488 points in production KV, read-back verified) · F7/I9 recorded-open (MCX 403 / no nowcast history) · F3/F4/F13 honestly DO NOT land (the WGC terms) · the P3 deploy live-verified (the worker 4b8dcfc7: for 2 · against 2 · neutral 1 · unread 0, 5 of 5 lanes readable) · the gf-p4-verify twin (production ≡ POST-P4-5LANE in ALL 2512 windows) · tests 14,605 · copy round 81 (45 strings) · gates ALL GREEN → GF-S11: the decision round + P4 → P5 acceptance + flip | `gf/p0-recalibration` (merged) · `gf/s2-reissue`…`gf/s6-reissue` (merged) · `gf/p1-repairs` (merged) · `gf/p2-promotions` (merged) · `gf/p3-new-sources` (merged) · `gf/p3-remainder-and-p4` (merged at GF-S10) → `gf/p4-context-additions` next |

## B. The standing rules (read before any session)

1. **The per-seat approval rule** (D-GB-9 as amended at GB-S7, inherited
   as D-GF-1): every `gold-score.ts` / `GOLD_LANE_VOTERS` edit requires
   the owner's RECORDED approval **per seat change** — the audit
   report's §4 row is the justification attached to each approval.
   **NEVER seat a sign silently** (the real-curve question (a) is the
   live example).
2. **No forecasting claim, ever** (D-GA-2): the fill program adds
   coverage of the classic condition set, nothing more. The no-edge
   record (GOLD_BACKTEST_SPEC §5) stands; copy says "conditions".
3. **The beam formula, the honesty rules and the no-edge record are
   inherited unchanged**; the min-2 lane rule is re-derived, not
   assumed.
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

## C. The state of the world (as the GF-S10 close leaves it, 2026-11-06)

- **THE AUDIT'S VERDICT** (`docs/insights/GOLD-METER-AUDIT-REPORT.md`,
  restated to the v1.2 denominator): rows classified = 86 · voters
  mapped, ALL CLASSIFIED · defects = 18 (D-1…D-18; GF-P1 repaired
  D-2/3/4/5/6/7/8/18; GF-P2 repaired D-14 + D-17; GF-P3/GF-S10 filled
  the D-11/D-12 ride — the real curve now EXISTS as context with both
  sign variants measured); the defects remaining: D-9/D-10/D-13/D-15/
  D-16 accept-with-note (stand).
- **THE OWNER'S ANSWERS A–K ARE RECORDED** (GF-S7) + **the standing
  delegation**. GF-S10's NEW open questions are printed in the
  gf-p4-verify evidence §4–§5 and the GF-S11 prompt: **(a)** the
  real-curve sign · **(b)** the SGE display class (e) · **(c)** the WGC
  authorisation (f).
- **THE ENGINE (as deployed)**: the **37-voter five-lane table**
  (borrowing costs 7 · dollar 7 · market stress 11 · inflation 10 ·
  flows 2 — the measured POST-P4-5LANE composition), `evalLeg`, MIN2,
  the D-18 input-presence rule, GOLD_LANE_STRONG = 4-of-5. Deployed
  worker **4b8dcfc7-6817-4991-825d-78932dc9b323** (the live verification
  over the fresh snapshot: for 2 · against 2 · neutral 1 · unread 0 — 5
  of 5 lanes readable; the I4 seat firing at the 90th percentile of its
  decade; the four GF-P3 seats on their cadences; the real curve
  context 0.25 @ 2026-11-04; the Shanghai premium PRIVATE).
- **THE D-GF-6 PINS STAND**: the committed calibration report
  (`evidence/gf-p0-calibration-2026-11-05.md` — extended with the
  POST-P4-5LANE + REALCURVE rows) reproduces byte-for-byte;
  **`evidence/gf-p4-verify-2026-11-06.md`** is the live pin — production
  ≡ POST-P4-5LANE in ALL 2512 windows (the F2 id mapping recorded).
  The verdict under the owner's recorded A: MIN2 all-windows C1 PASS
  (level 30.6% · full-tip 11.2%) · C2 FAIL (11 vs 7) — keep the
  criteria + MIN2 on judgment, the recorded price of the coverage.
- **THE DATA PLANE**: the SGE premium history is WRITTEN
  (`insights:hist:shanghai-gold-premium` — 488 points, read-back
  verified 0.25% @ 2026-11-05; the rung-2 phase deepens it daily); the
  UoM anchor's full monthly history arrives with every rung (the SIE
  POST); the earlier GF backfills stand (cftc 522+522 · the gap 2350 ·
  gold-silver 2555). The Shanghai premium card serves PRIVATE (the SGE
  L2 licence — question (e)).
- **THE WGC FAMILY IS LICENCE-BLOCKED** (GF-S10's measured verdict: the
  WGC terms REQUIRE prior written authorisation for any scraping or
  redistribution; the GoldHub downloads are registration-gated; the
  PBoC English URL 404s) — F3/F4/F13 + F5/F8/F11/F15/F16/H1–H4 stay
  'awaiting data' until question (f) resolves.
- **The taxonomy is LOCKED** (02 v1.2 = 86 rows; additions remain
  owner-recorded amendments with dates only, D-GA-1).
- Tests **14,605**; copy round **81** (45 strings, clean); gates ALL
  GREEN; main at the GF-S10 merge.

## D. If a session is interrupted

Commit and push the branch anyway (nothing is lost if the session dies);
the next session `git pull --rebase`s and re-reads the authoritative
records — the audit program's `docs/specs/gold-meter-audit/PROGRESS.md`
(CLOSED) and the fill program's `docs/specs/gold-meter-gapfill/
PROGRESS.md` (authoritative for the fill). If PROMPTS.md's latest prompt
disagrees with PROGRESS.md, PROGRESS.md wins and the prompt gets
rewritten. The GF-P0 calibration's runnable record:
`packages/insights/scripts/gf-p0-record-candidates.ts` +
`gf-p0-calibration.ts` over the committed fixtures — re-running
reproduces the committed report byte-for-byte (re-verified POST-P1/P2/
P3/P4). The verify-twin lineage: `scripts/gf-p1-verify.ts` →
`gf-p2-verify.ts` → `gf-p3-verify.ts` → **`gf-p4-verify.ts` (the live
pin)**; the backfill lineage: `gf-p1-backfill.ts` → `gf-p2-backfill.ts`
→ `gf-p4-backfill.ts` (the SGE premium); the credentials live in the
environment only, never in the repo. **The GF-S10 record itself is the
intrecovery discipline's proof**: two sessions died (one with its work
uncommitted, one with a premature backfill claim); the recovery verified
every claim from its own runs before writing any of them down.
