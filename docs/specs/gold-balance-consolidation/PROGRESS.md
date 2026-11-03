# PROGRESS — the gold balance consolidation program

The running record of the owner's program (the spec set:
`docs/specs/gold-balance-consolidation/` — README + 01–05 + the reference
prototype; the session plan: `PROMPTS.md` GB-S1..GB-S7). One line per
milestone, one block per session; every number comes from a run the session
actually executed. The gap-closure program that ran in parallel is CLOSED
(2026-11-03d) — it is not reopened here.

## The milestone table

| ID | Milestone (spec ref) | State |
|---|---|---|
| A | The missed 2026-11-02 armed re-check, run manually (GOLD_RECHECK_SPEC §3 steps 1–7) | ✅ DONE (GB-S1, 2026-11-03) — watch days 2–4 LOCKSTEP → validated-by-watch; no escalation; corpus 19 days; §1/§5 records + CHANGELOG |
| B | The P0 lane calibration (02 §6): HARNESS_GOLD_LANES_MIN2/_MIN1 beside the frozen tables; C1/C2 over all windows + the mature base | ✅ DONE (GB-S1, 2026-11-03) — MIN2: C1 PASS (level 25.0%, full-tip 49.7%) · C2 PASS (flips 8 vs net-sign 9); MIN1: PASS/PASS (26.1% / 22.6% · 8 vs 9); mature base reported (MIN2 C1 FAIL there — stated, context); frozen tables pinned byte-identical (gold-lane-calibration.test.ts, 29 tests + the session's old-code-vs-new-code run diff) |
| C | docs/insights/BACKTEST-GOLD-LANES.md (the calibration report) + the decision section appended to GOLD_BACKTEST_SPEC.md | ✅ DONE (GB-S1, 2026-11-03) — every cell with n; lineage-only tables labelled "not used for selection"; no forecasting edge claimed |
| D | The decision: MIN2 if C1+C2, else MIN1 if C1+C2, else STOP | ✅ DONE (GB-S1, 2026-11-03) — **GOLD_LANE_MIN_FIRING = 2** (D-GB-3's default; both criteria hold over all windows; no fallback needed, no STOP) |

Next: GB-S2 (P1 — the pure engine `gold-balance.ts`, 04 §3), then GB-S3
(P2a behind `?balance=lanes`), GB-S4 (P2b the visual redesign), GB-S5
(P3+P4), GB-S6 (P5 — **the owner-gated flip**), GB-S7 (OI-3, its own owner
round).

## Session log

### GB-S1 (2026-11-03 ~04:35–06:1x UTC) — P0: the missed re-check + the lane calibration

- **Branch:** `gold-balance/p0-calibration` — **PR #12**
  `gold-balance(P0): the lane calibration` (draft opened early, self-merged
  when the exit gate held — the owner's incremental-merge instruction; the
  merge SHA is the PR's merge commit on main, printed in the session's
  closing report and pinned by GB-S2's prompt at its start).
- **Commits** (this branch, in order):
  1. `insights(gold-balance P0): the missed 2026-11-02 re-check, run manually + the lane calibration — the corpus refreshed (19 archive days; the FX voters re-venued read-only to insights:hist:*), the watch days 2–4 LOCKSTEP (validated-by-watch), the no-drift contract holding on every stamped day, BACKTEST-GOLD.md regenerated (the runner's stale S6 prose corrected, the frozen tables' numbers verified byte-identical over the same corpus), and HARNESS_GOLD_LANES_MIN2/_MIN1 + laneBalanceOverVoters + the C1/C2 statistics (gold-lane-calibration.test.ts, 29 tests) + BACKTEST-GOLD-LANES.md — DECISION: GOLD_LANE_MIN_FIRING = 2`
  2. `docs(gold-balance P0): the records — GOLD_RECHECK_SPEC §1/§5 + the §3 venue note, GOLD_BACKTEST_SPEC §5's re-check + calibration sections, AGENTS.md's P0-CALIBRATED paragraph, PROGRESS.md, the GB-S2 prompt rewrite + the lessons log, CHANGELOG 2026-11-03f`
- **A — the re-check:** §3 steps 1–7 all ran (the armed one-shot never
  fired). Live anchors: health ok; goldSummary −1/headwind/5 firing;
  breakeven-tilt −0.20 @ 11-02 (p10y 0.234). Real KV read passed (19 keys).
  Corpus: 19 archive days (10-15 → 11-03; 10-20 absent), recordedAt
  2026-11-03T04:43:54Z. Run: 2,512 windows (2016-11-07 → 2026-11-03);
  sign-agreements 51.6 / 47.3 / 44.3% (S6: 52.1 / 47.6 / 43.9); tilt 1,173
  (46.7%, in band); flips 263 (10.5%); mature 46.8 / 42.2 / 32.7%, spreads
  −0.01 / −0.30 / −1.98% (the 5td a hair below the 2-SE band edge — the
  S6 "just inside" reversed; the mechanical wording returns to the S4 form,
  the borderline stated; no edge claim either way). Watch days 2–4:
  LOCKSTEP — validated-by-watch. No-drift: holds on all 4 stamped days.
  No escalation rule fired. **Venue findings recorded:** the FX voters
  (dollar-basket, usdjpy) left the stage blob → the dump sources them
  read-only from `insights:hist:<id>` (gold-corpus-dump.ts, additive);
  the KV histories are rolling ~10-year windows (head trim + the dropped
  10-31 Saturday seed → windows −2); us-japan-10y-gap's monthly backfill
  left the stored window (97 → 21 points; the dollar lane ran 2-voter).
- **B — the calibration:** `HARNESS_GOLD_LANES_MIN2` / `_MIN1` in
  `gold-backtest-core.ts` (the SAME frozen 21-voter table + the crowd
  minimum) + `laneBalanceOverVoters` (02 §3's algorithm) +
  `medianFlipsPer60` / `laneCalibrationStats` (the C1/C2 arithmetic) + the
  runner's lane section. Additive only; the frozen tables' outputs pinned
  byte-identical by `gold-lane-calibration.test.ts` (29 tests: the lane
  rules, the beam-angle parity fact, the flip statistic, the C1/C2
  boundaries, the frozen-tables JSON pins) and verified live by re-running
  the pre-change runner over the same corpus (31 diff lines, all prose;
  zero numeric changes).
- **C — the report:** `docs/insights/BACKTEST-GOLD-LANES.md` (277 lines:
  the state/beam/lane tables per rule per scope, the C1/C2 verdict table,
  the mechanical decision, the lineage-only confusion tables labelled "not
  used for selection", the honesty notes) + `GOLD_BACKTEST_SPEC.md` §5's
  two 2026-11-03 sections.
- **D — the decision:** **MIN2** (`GOLD_LANE_MIN_FIRING = 2`). The mature
  base's C1 disagreement (MIN2 full-tip 66.5% > 60% there) is recorded in
  the report and the spec — the criteria were pre-registered on ALL
  windows; the mature row is context.
- **Verified for GB-S2:** the real 2026-10-31 archive in the corpus
  reproduces 01 §7 exactly under the lane engine (level · 4 neutral ·
  borrowing-costs split 2v2 · dollar 1 firing · inflation 1 firing) with
  `goldTailwindScore` = −2/headwind/6 firing on the same fixture — the
  04 §4.1 fixture test is directly constructable from
  `fixtures/gold-backtest-corpus.json`'s `archives["2026-10-31"]`.
- **Gates:** the full `pnpm gates` ran green before the push (the exact
  figures in the session's close-out note in the PR/CHANGELOG). No deploy
  (scripts + tests + docs only; the app code never imports the harness —
  the built worker is unchanged).

### GB-S1b (2026-11-03 ~05:20–06:00 UTC) — the second variant: the parallel-session union (P0 verified twice)

A second GB-S1 session ran concurrently from 10f3e65 (both variants
discovered the same 04:35 UTC Frankfurter stage-blob finding within
~50 minutes of each other). This variant's path and its record:

- **The other pre-registered resolution:** the fixture stayed on the
  **corpus-of-record** (16 days, recorded 2026-10-31T15:17:40Z —
  02 §6's calibration venue is "the same windows as the S4
  report"); the fresh dump's blocker was recorded and the fixture
  reverted. The §3 re-check over it reproduced every S6 number
  exactly (`BACKTEST-GOLD.md` byte-identical); the watch days 2–4
  read lockstep from the fresh archive reads the dump performed
  (11-01/11-02 holding over the weekend; 11-03 both +1 trading day)
  — validated-by-watch; the 11-01/02/03 `goldSummary` stamps
  (−2/headwind) === the promoted-table re-derivation, re-derived
  read-only from the archived readings (no drift; the tilt silent on
  all three).
- **The independent calibration measurement** (a separate
  implementation `lanesOverVoters`, discarded per the first-landed
  union precedent — zero code diff vs PR #12): 2,514 windows;
  MIN2 C1 level **24.7%** / full-tip **49.6%**, C2 median **9** = the
  net-sign **9**; MIN1 25.9% / 22.0%, median 8 vs 9; the same
  mature-base nuance (MIN2 full-tip 65.9% there). The 2026-10-31
  worked example reproduced 01 §7 under both rules.
- **The union result: the first-landed variant stands whole (PR #12,
  merged as 98168b4); this variant's measurement is recorded as the
  decision's robustness check** (GOLD_BACKTEST_SPEC §5 + CHANGELOG
  [2026-11-03g]): two independent implementations over two different
  corpora reached the same criteria verdicts and the same decision,
  **MIN2** — the choice is not an artifact of either corpus venue
  or either hand.
- **Main verified end-to-end post-merge (re-run and measured):** CI
  green on 98168b4; both reports regenerate byte-identically from the
  committed corpus; the full gates ALL 9 GREEN — 14,548 tests,
  Insights lazy 1522.88/351.96 (the built worker unchanged).

## Owner must decide

1. **Confirm the calibration decision** (or reverse it): the pre-registered
   rule selected **MIN2** (`GOLD_LANE_MIN_FIRING = 2`, D-GB-3's default) —
   and the parallel-session union measured it TWICE, independently, over two
   different corpora (the corpus-of-record 16-day run and the fresh 19-day
   run): the same criteria verdicts, the same decision, from two hands.
   The measured tables are in `docs/insights/BACKTEST-GOLD-LANES.md`; the
   one number worth your eyes is the mature-base row: from 2021-09-23 the
   MIN2 balance reads fully tipped (10°, one-sided) in **66.5%** of windows
   (over ALL windows: 49.7%, inside the ≤60% criterion). That is the
   honest shape of 2021–2026's macro (the same era the frozen table reads
   headwind-heavy) — if you want a calmer recent beam, MIN1's mature
   full-tip is 30.7% (and MIN1 also passed C1+C2); one constant decides.
   Reversing later means a dedicated gated session (the 02 §6 protocol
   again), never a silent edit.
2. **OI-1 remains open:** the Outlook sentences still state a forecast the
   backtest does not support — the rewording (03 §6) needs an FA copy round
   (round-76 is next) and rides GB-S5 (P4).
3. **OI-2 remains open:** the "mixed" lane badge label ("Split" proposed).
4. No other open item moved this session (OI-3's precondition — the re-check
   record — is now satisfied; OI-4/OI-5/OI-6 unchanged).

## Standing constraints (every session)

- D-GB-9: `gold-score.ts`, `goldSummary`, `GoldSummarySchema`,
  `snapshot.ts`, `apps/api/**` and the frozen harness tables are NEVER
  edited by this program; the new work is additive.
- No forecasting edge is claimed anywhere, ever — the standing no-edge
  record (GOLD_BACKTEST_SPEC §5, the round-55 note) is the operative
  description until a stated-in-advance rule says otherwise.
- Full `pnpm gates` green before every push; branch + PR per phase;
  self-merge when the phase's exit gate holds; deploy only when the built
  worker changes (docs + scripts + tests sessions deploy nothing).
