# AGENT_HANDOFF — Currena: the gold meter audit program (GA-S1 DELIVERED — GA-S2 next, the lock question open)

> The owner's **gold meter audit** program (`docs/specs/gold-meter-audit/`,
> session plan GA-S1..GA-S4 in its `PROMPTS.md`) was **specified
> 2026-11-04** as the continuation of the gold program. The predecessor —
> the gold balance consolidation (`docs/specs/gold-balance-consolidation/`)
> — is **COMPLETE, LIVE and CLOSED** (2026-11-04, closed at GB-S7): the
> consolidated lane balance is THE gold card for every visitor on
> currena.ir; its PROGRESS.md is the authoritative record of that delivery.
> Never record credentials here.

## A. What this program is

The owner's instruction (2026-11-04): *"As a financial investor with 20
years specialization in gold exchange, create an audit program to make sure
that our gold meter has all the required indicators which classically show
the direction of gold price. Make sure nothing is missed or
half-implemented."* Four audit sessions against a **pre-registered classic
checklist** (the 72-row, 9-family reference taxonomy in 02), ending in the
owner-gated **gap-fill program** (design + prompts, GA-S4):

| Session | Milestone | Branch |
|---|---|---|
| GA-S1 | The taxonomy verified + v1 for the owner's lock; the blind-spot sweep; the presence pre-scan | `ga/s1-taxonomy` — **DONE (2026-11-04): 02 is v1, 82 rows, verified live; OI-GA-1 (the lock) OPEN** |
| GA-S2 | The inventory + wiring evidence pack; the mirror sweep | `ga/s2-inventory` — **next; starts by resolving the lock** |
| GA-S3 | The coverage matrix classified + the half-implementation defects | `ga/s3-matrix` |
| GA-S4 | The report + the fill-program design + its prompts | `ga/s4-report` |

The next session's prompt is PROMPTS.md's live kickoff (GA-S2 — the
inventory + wiring; it opens by resolving the owner's taxonomy lock,
OI-GA-1). Paste it into a fresh session at the repo root.

## B. The standing rules (read before any session)

1. **Read-only against the meter** (D-GA-3): no edits to `gold-score.ts`,
   `gold-balance.ts`, `GOLD_LANE_VOTERS`, the harness tables, schemas,
   adapters or copy dictionaries. Docs + read-only scripts only.
   **Deploy nothing** — every session of this program is docs/scripts-only.
2. **No forecasting claim, ever** (D-GA-2): the audit measures coverage of
   the classic condition set, never predictive power. The no-edge record
   (GOLD_BACKTEST_SPEC §5) stands.
3. **Pre-registration** (D-GA-1): the taxonomy is locked (OI-GA-1, the
   owner's call after GA-S1) BEFORE wiring is mapped; later amendments are
   owner-recorded decisions with dates.
4. **Free-first sourcing** (D-GA-5): FRED/ECB/IMF/CFTC/Treasury/WGC/US
   Mint/SGE/Cleveland Fed/NY Fed first; EODHD (the owner's key) only with
   a recorded per-item approval.
5. **Every number from a run; every recommendation re-checked against
   code before it is written down** (the owner's 2026-10-31 instruction).
6. **Delivery discipline** (D-GA-10): branch, PR early, gates/CI green,
   self-merge on the exit gate, CI green verified on main. `git pull
   --rebase` before touching shared files (CHANGELOG, AGENTS.md, the
   indicator tables).
7. **End every session with the next prompt** (D-GA-9): rewritten in
   PROMPTS.md, committed, pushed, and printed in the final message — never
   end a session without one.

## C. The state of the world (as GA-S1 left it, 2026-11-04)

- **GA-S1 delivered:** `02-REFERENCE-TAXONOMY.md` is **v1 — 82 rows**
  (v0 72 + 10 sweep adds − 0 strikes; R14+D9+I11+S12+F15+X6+G7+H4+M4),
  every row verified against live sources this session (the runnable
  record `packages/insights/scripts/ga-s1-fred-verify.sh`; the full
  URL/HTTP log in the audit PROGRESS.md's GA-S1 block), the pre-scan
  appended (15 voter · 23 context · 41 absent · 0 unknown — directional
  only). **OI-GA-1 (the owner's lock or amend) is OPEN — GA-S2 must
  resolve it before any wiring trace (D-GA-1).**

- Production: currena-api serving the consolidated lane balance for every
  visitor; `goldSummary` retired from the wire (GB-S7, PR #24/#25; worker
  versions and deployment IDs in the GB program's PROGRESS.md §GB-S7 and
  docs/DEPLOY.md [2026-11-04e]). The retirement rung (first ingest rung
  after the GB-S7 deploy) writes the field out of the stored snapshot —
  automatic, nothing to do.
- The audited object: the 21-voter table (borrowing costs 8 · dollar 3 ·
  market stress 5 · inflation 5), `evalLeg` (30-day move beyond the
  per-leg minimum, else decade-extreme percentile), `GOLD_LANE_MIN_FIRING
  = 2`, the derived Outlook, the context pill. All frozen.
- Known weak seats the audit will quantify (self-flagged in the GB program's
  own 02 §4): `cftc-gold-positioning` (one stored point — never fires
  today), `us-japan-10y-gap` (stale most windows), `gold-silver` (thin
  history), the yield-curve polarity ("ambiguous" per the frozen spec).
- The ingested-but-not-voting context set (D-GA-4's target): GPR ×10, EBP,
  OFR FSI, SLOOS, term premium, TGA/reverse-repo/bank-reserves/repo-stress/
  net-liquidity, M2, Michigan 1y, `usd-reserve-share` (the dedollar shadow
  with the pending S6-M6.4 promotion — OI-GA-3), sp500-breadth, the fiscal
  block (us-deficit-12m, govt-interest-revenue, TIC/custody, auctions),
  breakeven-10y/t5yie, median/sticky CPI, the gold ratios (oil/btc/aud/
  copper). The full table: `docs/INDICATORS_AND_DATA_SOURCES.md`.

## D. If a session is interrupted

Commit and push the branch anyway (nothing is lost if the session dies);
the next session `git pull --rebase`s and re-reads PROGRESS.md, which is
the authoritative state. If PROMPTS.md's latest prompt disagrees with
PROGRESS.md, PROGRESS.md wins and the prompt gets rewritten.
