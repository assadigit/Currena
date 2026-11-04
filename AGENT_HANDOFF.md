# AGENT_HANDOFF — Currena: the gold meter audit program (A3 COMPLETE — the GA-S4 session next)

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
| GA-S2 | The inventory + wiring evidence pack; the mirror sweep | `ga/s2-inventory` — **RUN PARTIAL (2026-11-04): the source-side inventory delivered (03 §1.2–§1.4 — `evidence/inventory.md`, 161-row readings table + mirror sweep voter 21 · context 63 · not-gold 77, the recipes, the rungs; the runnable record `ga-s2-wire-scan.sh`); the voters table + the wiring trace + the history depths DEFERRED — the owner was not reachable in-session (the prompt's fallback)** |
| GA-S2-completion | A2's deferred half: the voters table, the wiring trace, the context traces, the history depths | `ga/s2-wiring` — **DONE (2026-11-05): THE LOCK RESOLVED + A2 COMPLETE — the owner delegated the research-and-lock in chat; the pre-lock research pass added S13 · F16 · X7 and LOCKED 02 as v1.1 = 85 rows; then the voters table (inventory.md §5), `evidence/wiring.md` (21 full traces, no TRACE-BROKEN, + 63 context traces + five findings) and `evidence/history-depths-2026-11-05.txt` (`ga-s2-history-depths.sh`: cftc 1 pt / base 0 / 0-of-9 days; us-japan-10y-gap 21 pts / base 20 / pct 6-of-9; gold-silver 122 pts / base 119 / ch30d 0-of-19) delivered** |
| GA-S3 | The coverage matrix classified + the half-implementation defects | `ga/s3-matrix` — **DONE (2026-11-05): A3 COMPLETE — all 85 rows classified (COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 · CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3 + the 3 cross-lists to primaries); 21 voters mapped (20 rows + 1 UNCLASSICATED: `euro-hicp` — finding N-1, the owner decides amend-vs-re-seat); 18 half-implementation defect rows (D-1 the structural 17-of-21 level-only finding + 17 per-voter across 10 voters; H6 1 = **D-18 the fake-steady finding: cftc reads `steady`, not `unread`**); the fill backlog seeded (yes 47, the 27-band: R4 · R6 · R8 · R9 · R10 · D4 · S4 · S7 · S13 · F1 · F2 · G1); the new runnable `ga-s3-lean-check.sh` + `evidence/lean-check-2026-11-05.txt` (6 seats fire on the fresh wire; all four lanes `neutral` today)** |
| GA-S4 | The report + the fill-program design + its prompts | `ga/s4-report` — **NEXT: the live kickoff prompt is PROMPTS.md's GA-S4** |

The next session's prompt is PROMPTS.md's **GA-S4** kickoff (the report +
the fill-program design + its prompts — the audit program's closing
deliverable). Paste it into a fresh session at the repo root.

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

## C. The state of the world (as the GA-S3 run left it, 2026-11-05)

- **THE TAXONOMY IS LOCKED — OI-GA-1 RESOLVED (2026-11-05).** The owner
  reached back in chat and delegated the research-and-lock ("I trust your
  research and judgement. if you think its enough, it's enough and locked
  by me."). The pre-lock research pass cross-checked the coverage against
  the canonical driver frameworks (Chicago Fed Letter 464 · WGC
  demand-side), re-verified every named free source live (52 FRED ids +
  11 providers — the identical live/dead pattern GA-S1 recorded), added
  3 rows (**S13** US household pessimism — `UMCSENT`, already ingested as
  `michigan-sentiment`, promotion-class · **F16** Swiss gold net exports
  by destination — BAZG SwissImpex verified live · **X7** gold/platinum
  ratio — gold-api XPT verified live), and **LOCKED 02 as v1.1 = 85
  rows**. The lock record (the verbatim owner instruction + the research
  record) is at 02's foot. From here additions are owner-recorded
  amendments with dates only (D-GA-1).

- **A2 IS COMPLETE (rows A + B both ✅):** the inventory — `evidence/
  inventory.md` (the 161-row readings table + mirror sweep voter 21 ·
  context 63 · not-gold 77, the recipes, the rungs, AND §5 the voters
  table — the 21 seats verbatim with the evalLeg rule per seat: 4 move-
  threshold seats, 17 level-only); the wiring pack — `evidence/wiring.md`
  (the 21 full traces, NO TRACE-BROKEN hops, the 63 context traces, five
  findings — cftc never-fires; us-japan-10y-gap intermittent percentile;
  gold-silver thin base; **ecb-dfr's 2026-11-05 drift answered: the
  failed-fetch hold drops both derived fields, snapshot.ts:451-465**; the
  structural 17-of-21 level-only finding); the history depths —
  `evidence/history-depths-2026-11-05.txt` (the runnable
  `ga-s2-history-depths.sh`: 15 voters PASS bases 2,495–3,649; cftc 1 pt
  / base 0 / 0-of-9 days; us-japan-10y-gap 21 pts / base 20 / pct 6-of-9;
  gold-silver 122 pts / base 119 / ch30d 0-of-19). The scan family:
  `ga-s2-wire-scan.sh` + wire-scan-2026-11-04/-05.txt.
- **A3 IS COMPLETE (row C ✅): the audit's first verdict-bearing session.**
  `evidence/coverage-matrix.md` — all **85 rows classified, one class
  each** (COVERED 8 · PARTIAL 7 · MISSING-FREE 36 · MISSING-PAID 10 ·
  CONTEXT-ONLY-BY-DESIGN 18 · NOT-APPLICABLE 3, + the 3 cross-lists
  resolved to primaries; the header arithmetic stated: rows classified =
  85, voters mapped = 21), the fill column seeding the backlog (yes 47;
  the 27-band: R4 · R6 · R8 · R9 · R10 · D4 · S4 · S7 · S13 · F1 · F2 ·
  G1). The voter mapping: 20 seats to exactly one row each — **us10y/
  us30y → R1 belt-and-braces** (H4 accept-with-note), **breakeven-tilt →
  R7's change accent** (02 R13's "free proxy" note corrected: no swap
  leg — R13 classes MISSING-PAID), cftc → F1 PARTIAL, the yield-curve
  pair → R4 PARTIAL — + **1 UNCLASSICATED: `euro-hicp` (finding N-1 —
  the locked checklist holds no euro-area realised-inflation row; the
  owner decides amend-vs-re-seat)**. `evidence/half-implementation.md`
  — the H1–H7 checks per voter, **18 defect rows** (D-1 the structural
  17-of-21 level-only finding + 17 per-voter rows across 10 voters;
  H6 1 = **D-18 the fake-steady finding: cftc reads `steady`, not
  `unread`** — its warning status passes readable() with neither input;
  H7 verified coherent); treatments proposed (repair 6 · repair-if-filled
  2 · re-seat 2 · owner-decisions 3 · accept-with-note 5). The new
  runnable `ga-s3-lean-check.sh` + `evidence/lean-check-2026-11-05.txt`:
  **6 seats fire on the fresh wire** (2 move-leg + 4 level-leg), 14
  honestly steady, ecb-dfr unread, **all four lanes `neutral` today**.
- Production: currena-api serving the consolidated lane balance for every
  visitor; `goldSummary` retired from the wire (GB-S7, PR #24/#25; worker
  versions and deployment IDs in the GB program's PROGRESS.md §GB-S7 and
  docs/DEPLOY.md [2026-11-04e]). The retirement rung (first ingest rung
  after the GB-S7 deploy) writes the field out of the stored snapshot —
  automatic, nothing to do.
- The audited object: the 21-voter table (borrowing costs 8 · dollar 3 ·
  market stress 5 · inflation 5), `evalLeg` (30-day move beyond the
  per-leg minimum — only 4 of 21 seats carry one, else decade-extreme
  percentile), `GOLD_LANE_MIN_FIRING = 2`, the derived Outlook, the
  context pill. All frozen.
- Known weak seats the audit HAS NOW QUANTIFIED (the numbers in
  history-depths-2026-11-05.txt): `cftc-gold-positioning` (1 staged
  point — never fires today), `us-japan-10y-gap` (percentile intermittent
  — 6/9 recorded days), `gold-silver` (base 119 — thin), the yield-curve
  polarity ("ambiguous" per the frozen spec — GA-S3's H3).
- The ingested-but-not-voting context set (D-GA-4's target, traced in
  wiring.md §2): GPR ×10, EBP, OFR FSI, SLOOS, term premium,
  TGA/reverse-repo/bank-reserves/repo-stress/net-liquidity, M2, Michigan
  1y + **Michigan sentiment (the S13 object, a growth-health voter
  outside the gold lanes — promotion-class)**, `usd-reserve-share` (the
  dedollar shadow with the pending S6-M6.4 promotion — OI-GA-3),
  sp500-breadth, the fiscal block (us-deficit-12m,
  govt-interest-revenue, TIC/custody, auctions), breakeven-10y/t5yie,
  median/sticky CPI, the gold ratios (oil/btc/aud/copper) + platinum.
  The full table: `docs/INDICATORS_AND_DATA_SOURCES.md`.

## D. If a session is interrupted

Commit and push the branch anyway (nothing is lost if the session dies);
the next session `git pull --rebase`s and re-reads PROGRESS.md, which is
the authoritative state. If PROMPTS.md's latest prompt disagrees with
PROGRESS.md, PROGRESS.md wins and the prompt gets rewritten.
