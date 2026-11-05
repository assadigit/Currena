# AGENT_HANDOFF — Currena: the gold meter audit program (CLOSED) → the gold meter gap-fill program (GF-S1 next)

> The owner's **gold meter audit** program (`docs/specs/gold-meter-audit/`)
> is **CLOSED — COMPLETE 2026-11-05 at GA-S4**: A1–A4 whole (the taxonomy
> LOCKED v1.1 = 85 rows · the inventory + wiring pack · the coverage
> matrix + the 18 half-implementation defects · the report + the
> fill-program design). The audit's verdict:
> `docs/insights/GOLD-METER-AUDIT-REPORT.md` — the owner-readable record
> of what the meter sees and what it does not. The successor — the
> **gold meter gap-fill program** (owner-gated; its home
> `docs/specs/gold-meter-gapfill/` is created by its first session) —
> executes the fills phase by phase on the owner's recorded go. The
> predecessor gold balance consolidation is COMPLETE, LIVE and CLOSED
> (2026-11-04, GB-S7): the consolidated lane balance is THE gold card
> for every visitor on currena.ir. Never record credentials here.

## A. What comes next

The **GF-S1 session** — the gap-fill program's first: the P0
recalibration pre-registration (the fill design's GF-P0 phase, the
audit report §6.1). Its kickoff prompt is at the foot of
`docs/specs/gold-meter-audit/PROMPTS.md` (the D-GA-9 convention handed
over) — paste it into a fresh session at the repo root.

| Program | Milestone | Branch |
|---|---|---|
| gold meter audit — **CLOSED (2026-11-05)** | GA-S1 (the taxonomy, LOCKED v1.1 = 85) · GA-S2 + completion (the inventory + wiring pack) · GA-S3 (the matrix + the defects) · GA-S4 (the report + the fill design) | `ga/s1-taxonomy` · `ga/s2-inventory` · `ga/s2-wiring` · `ga/s3-matrix` · `ga/s4-report` — all merged |
| gold meter gap-fill — **GF-S1 NEXT** | P0 the recalibration pre-registration (the proposed voter set in new read-only harness tables beside the frozen ones; the lane rule re-derived per the GB-S1 C1/C2 protocol; the OI-GA-2 lane count; the D-1 threshold calibration) → P1 repairs → P2 promotions → P3 new free sources → P4 context additions → P5 acceptance + flip | `gf/p0-recalibration` |

## B. The standing rules (read before any session)

1. **The per-seat approval rule** (D-GB-9 as amended at GB-S7): every
   `gold-score.ts` / `GOLD_LANE_VOTERS` edit requires the owner's
   RECORDED approval **per seat change** — the audit report's §4 row is
   the justification attached to each approval. GF-P0 adds no product
   code at all.
2. **No forecasting claim, ever** (D-GA-2): the fill program adds
   coverage of the classic condition set, nothing more. The no-edge
   record (GOLD_BACKTEST_SPEC §5) stands; copy says "conditions".
3. **The beam formula, the honesty rules and the no-edge record are
   inherited unchanged**; the min-2 lane rule is re-derived, not
   assumed (GF-P0's whole point).
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

## C. The state of the world (as the GA-S4 close left it, 2026-11-05)

- **THE AUDIT'S VERDICT** (`docs/insights/GOLD-METER-AUDIT-REPORT.md`):
  rows classified = 85 · voters mapped = 21 (20 + 1 UNCLASSICATED —
  `euro-hicp`, finding N-1) · defects = 18 (D-1 the structural
  17-of-21 level-only finding … D-18 the fake-steady finding) · the
  class tally COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID
  10 · CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3 — and the headline:
  **the meter fully covers 8/85 (≈ 9.4%) of the classic rows as healthy
  voting claims; 15/85 (≈ 17.6%) with any voting expression**. The
  RANKED 47-row backlog (severity W×A×C, the tie-break cascade
  recorded) maps every gap to its GF phase with its named free source.
  The evidence: `docs/specs/gold-meter-audit/evidence/` (the matrix ·
  the defects · the wiring · the inventory · the four committed runs).
- **THE OWNER'S DECISION LIST gates the fill program** (the report §5,
  each with the audit's recommendation): OI-GA-2 (a fifth flows & demand
  lane — ADD recommended) · OI-GA-3 (the S6-M6.4 shadow pair D5/S6 —
  fold into GF-P2) · OI-GA-4 (WGC quarterly — context-first) · OI-GA-5
  (EODHD — no use proposed) · OI-GA-6 (copy rounds 79+) · N-1
  (euro-hicp — AMEND recommended, the denominator becomes 86) · the
  D-7/D-8 yield-curve sign decision (context demotion recommended) ·
  the D-18 readable-rule question (input-presence rule recommended) ·
  the D-1 threshold question (derive, don't assume) · the 12
  zero-new-fetch promotion go/no-gos (PROMOTE ×8 · CONTEXT ADD ×3 · D7
  seat-or-context). **Nothing executes without the recorded go.**
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
- The freshest wire truth: `evidence/lean-check-2026-11-05.txt`
  (re-run at the GA-S4 close → identical): 6 seats fire, 14 honestly
  steady, ecb-dfr unread, all four lanes `neutral`.

## D. If a session is interrupted

Commit and push the branch anyway (nothing is lost if the session dies);
the next session `git pull --rebase`s and re-reads the authoritative
record — the audit program's `docs/specs/gold-meter-audit/PROGRESS.md`
(CLOSED) and, once created, the fill program's
`docs/specs/gold-meter-gapfill/PROGRESS.md`. If PROMPTS.md's latest
prompt disagrees with PROGRESS.md, PROGRESS.md wins and the prompt gets
rewritten.
