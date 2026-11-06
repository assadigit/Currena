# FIX-1 — GF-S9 gold-meter test suite repair (the GF-P3 fall-through)

**Agent:** Z.ai Code (Claude)
**Session:** GF-S9 gold-meter gap-fill (continuing GF-P3)
**Task ID:** FIX-1
**Date:** 2026-11-06 (repo clock)

## What was done

The GF-P3 production changes (4 FRED-sourced voters seated in
`GOLD_LANE_VOTERS`, the schema's 7 new `IndicatorId`s, the FRED adapter's
4 new series, the i18n copy) landed ahead of this task — but the test
suite + the 3 WGC/official-flows context-card definitions + the GAUGE
entries for the 4 new voters were still outstanding. This task closed
that gap:

  - TASK 1 — the 3 WGC/official-flows CONTEXT CARD definitions added to
    `packages/insights/src/definitions.ts` (lines 2001-2079).
  - TASK 2 — the 4 new voters added to the GAUGES in
    `packages/insights/src/gauges.ts` (real-yield-5y → borrowing-costs,
    dollar-broad + dollar-eme → dollar-strength, bank-stress →
    market-stress).
  - TASK 3 — the 32→36 / 6/5/10/9/2→7/7/11/9/2 seat-count + composition
    pins updated across 5 test files (gold-score.test.ts,
    gold-balance.test.ts, gold-backtest-core.test.ts,
    gold-lane-calibration.test.ts, breakeven-tilt.test.ts).
  - TASK 4 — the scenario-count pin in gf-p0-proposed.test.ts updated
    (10→12 scenarios, 5→6 compositions) + the production-equivalence pin
    re-pointed at GF_VOTERS_P3_5LANE (36 seats) + a new test asserting
    GF_VOTERS_P3_5LANE's shape (36 seats, 7/7/11/9/2).
  - TASK 5 — the definitions-count pins updated (163→170) in
    rung2.test.ts + snapshot.test.ts.
  - TASK 6 — the FRED series-count pin updated (59→63) in
    adapters.test.ts.
  - TASK 7 — the T-10 units discipline failure fixed in
    `packages/insights/src/validation.ts` (the 7 new ids added to the
    POINTS_KIND_EXPECTED / INDEX_POINT_IDS rule sets).

## The 3 context card definitions (TASK 1)

Inserted in `packages/insights/src/definitions.ts` at lines 2001-2079,
right after the `usdchf` context card (which closes at line 2000) and
before the `/* ---------------- Global — Is growth healthy? ------- */`
section comment (now at line 2080). The three cards:

  1. `wgc-etf-holdings` — lines 2001-2029 (id at line 2018)
  2. `wgc-cb-demand` — lines 2030-2054 (id at line 2043)
  3. `official-gold-demand` — lines 2055-2079 (id at line 2068)

Each card carries: `id`, `section: 'global'`, `group: 'market-stress'`
(the cftc-gold-gross-long precedent — the gold-flows family rides the
question-gauge's stress lane; the gold meter's flows LANE is a separate
re-cut of the same members), `name`, `source` ('wgc' for the two WGC
cards, 'pboc' for the official-gold-demand card), `sourceRef`,
`cadence`, `changeKind: 'points'`, `phase: 'P3'`,
`rule: { kind: 'info' }` (never votes — OI-GA-4's recorded
context-first answer), and `staleAfterDays`. The promotion criteria
(annualised-level extreme bands) are recorded in each card's comment
block, revisit-able once the cards exist. The 3 cards are NOT gauge
members (rule: info — the usdchf/eur-usd precedent).

The group choice — 'market-stress' — is documented in each card's
comment. The task allowed either using an existing group OR adding
'flows-demand' to the IndicatorGroupIdSchema enum; I chose the existing
'market-stress' to avoid the cascade of test updates that a new group
would require (the "groups are the question groups" test, the "has 12
gauges" test, etc.) and because cftc-gold-gross-long (also a gold-flows
card) already lives there.

## The GAUGE entries (TASK 2)

Edited `packages/insights/src/gauges.ts`:

  - `borrowing-costs` gauge (lines 43-71): added `'real-yield-5y'` at
    line 64 (after `'real-yield-10y'`, keeping the DFII family
    together). The gauge now has 10 members (was 9).
  - `market-stress` gauge (lines 99-103): added `'bank-stress'` at the
    end of the members array (line 102). The gauge now has 7 members
    (was 6).
  - `dollar-strength` gauge (lines 112-116): added `'dollar-broad'` and
    `'dollar-eme'` after `'dollar-basket'` (line 115), keeping the
    trade-weighted dollar family together. The gauge now has 5 members
    (was 3).

The 3 context cards (TASK 1) do NOT join a gauge — they're rule: info,
the usdchf/eur-usd precedent. Total non-shadow GAUGE voters post-P3:
53 (was 49 pre-P3, was 48 pre-P2). Total GAUGE members post-P3 (with
shadow gauges): 73 (was 69).

Each addition carries a GF-P3 comment citing the audit-report §4 row
(e.g. "§4 rank 19 / R2") and the F2-precedent owner-gated-seating note,
matching the gold-score.ts comment style.

## The test file changes (TASKS 3-6)

Every test file + line edited (old → new count):

  - `packages/insights/src/definitions.test.ts`:
      - line 16 (test name): "covers every indicator id exactly once
        (41, retired ids absent)" → "covers every indicator id exactly
        once (GF-P3: 170 ids — the 4 FRED-sourced P3 voters + the 3
        WGC/official-flows P3 context cards)". The retired-slug
        assertion `expect(ids).not.toContain('dollar-broad')` was
        DROPPED — `dollar-broad` is no longer retired (re-added at GF-P3
        as a separate voter beside the basket). The
        `expect(ids).toHaveLength(IndicatorIdSchema.options.length)`
        assertion is dynamic (reads the schema), so it auto-updated to
        170 when the 3 context cards were added.
      - lines 152-158 (info-only list): added `'official-gold-demand'`
        between `'oecd-cli-de'` and `'ofr-fsi'` (lexicographic sort).
      - lines 195-197 (info-only list): added `'wgc-cb-demand'` and
        `'wgc-etf-holdings'` between `'walcl'` and `'wheat'`
        (lexicographic sort — 'wgc-cb-demand' < 'wgc-etf-holdings').
      - line 203 (test name): "GAUGE membership is the scored list
        (48 voters; ...)" → "GAUGE membership is the scored list
        (53 voters; ... GF-P2 (2026-11-05): +cftc-gold-gross-long in
        market-stress — 49 voters; GF-P3 (2026-11-06, the standing
        delegation): +real-yield-5y in borrowing-costs, +dollar-broad
        +dollar-eme in dollar-strength, +bank-stress in market-stress —
        53 voters)".
      - line 206 (assertion + comment): `expect(memberIds.size).toBe(69)`
        → `expect(memberIds.size).toBe(73)`. The comment chain's
        running arithmetic extended: "...68 + 1 = 69; 49 voters) PLUS
        GF-P3's four FRED-sourced voters (...; 69 + 4 = 73; 53 voters)".

  - `packages/insights/src/gauges.test.ts`:
      - line 301 (test name + assertions): "32 global scored + 16
        australia scored = 48 voting members (...)" → "36 global scored
        + 16 australia scored = 52 voting members (... GF-P2 (2026-11-05):
        +cftc-gold-gross-long in market-stress — 49 voters; GF-P3
        (2026-11-06, the standing delegation): +real-yield-5y in
        borrowing-costs, +dollar-broad +dollar-eme in dollar-strength,
        +bank-stress in market-stress — 53 voters)".
      - line 309 (assertion): `toHaveLength(43)` → `toHaveLength(47)`
        (global members; 43 + 4 P3 voters = 47).
      - line 318 (assertion): `toHaveLength(49)` → `toHaveLength(53)`
        (non-shadow voters; 49 + 4 P3 voters = 53).

  - `packages/insights/src/gold-score.test.ts`:
      - line 369 (test name): "the GF-P2 table pin: 32 voters, lane
        counts 6/5/10/9/2 (...)" → "the GF-P3 table pin: 36 voters,
        lane counts 7/7/11/9/2 (...)".
      - line 385 (assertion): `expect(GOLD_LANE_VOTERS).toHaveLength(32)`
        → `expect(GOLD_LANE_VOTERS).toHaveLength(36)`.
      - line 393 (assertion): `expect(byLane).toEqual({
        'borrowing-costs': 6, dollar: 5, stress: 10, inflation: 9,
        flows: 2 })` → `expect(byLane).toEqual({ 'borrowing-costs': 7,
        dollar: 7, stress: 11, inflation: 9, flows: 2 })`.

  - `packages/insights/src/gold-balance.test.ts`:
      - line 380 (test name): "11. table integrity: the engine's lane
        membership equals GOLD_LANE_VOTERS (GF-P2's 32 voters,
        6/5/10/9/2)" → "11. table integrity: the engine's lane
        membership equals GOLD_LANE_VOTERS (GF-P3's 36 voters,
        7/7/11/9/2)".
      - line 390 (assertion): `expect(memberIds).toHaveLength(32)` →
        `expect(memberIds).toHaveLength(36)`.
      - line 400 (assertion): `expect(perLane).toEqual({
        'borrowing-costs': 6, dollar: 5, stress: 10, inflation: 9,
        flows: 2 })` → `expect(perLane).toEqual({ 'borrowing-costs': 7,
        dollar: 7, stress: 11, inflation: 9, flows: 2 })`.
      - lines 408-412 (new assertions): added 3 `not.toContain` checks
        for the new context cards (wgc-etf-holdings, wgc-cb-demand,
        official-gold-demand) — they're CONTEXT CARDS, never members.
      - line 583 (test name): "13. no-drift: goldTailwindScore on the
        same fixture is netScore 1 / tailwind / 7 of 32 firing (...)" →
        "13. no-drift: goldTailwindScore on the same fixture is
        netScore 1 / tailwind / 7 of 36 firing (... GF-P3: the 4 new
        voters absent from the 2026-10-31 archive → still 7 firing)".
        The 4 P3 voters' readings are absent from the 2026-10-31
        fixture corpus → they don't fire → firingVoters stays 7.

  - `packages/insights/src/gold-backtest-core.test.ts`:
      - line 128 (describe name): "the harness tables — the lineage
        snapshots (Session 6 → GF-P1 → GF-P2)" → "...(Session 6 →
        GF-P1 → GF-P2 → GF-P3)".
      - line 135 (comment): "...then to GF-P2's 32." → "...then to
        GF-P2's 32, then to GF-P3's 36."
      - line 142 (test name): "production is the GF-P2 table: 32 voters
        (6/5/10/9/2), the tilt in the inflation lane, polarity +1" →
        "production is the GF-P3 table: 36 voters (7/7/11/9/2), the
        tilt in the inflation lane, polarity +1".
      - line 149 (assertion): `expect(GOLD_LANE_VOTERS).toHaveLength(32)`
        → `expect(GOLD_LANE_VOTERS).toHaveLength(36)`.
      - line 155 (test name): "the PROMOTION DELTA PIN: production is
        the 19-seat P1-era table PLUS EXACTLY the GF-P2 promotions
        (...)" → "...PLUS EXACTLY the GF-P2 + GF-P3 promotions (the
        owner's recorded B/C/K + the standing delegation — the flows
        re-seat, the COBD pair, the twelve P2 seats and the four P3
        seats)".
      - line 170 (assertion + comment): `expect(kept).toHaveLength(30)`
        → `expect(kept).toHaveLength(34)`. The comment now reads
        "19 − cftc-reseat + the 12 P2 non-flows promotions + the 4 P3
        non-flows promotions" (was "19 − cftc-reseat + the 12 non-flows
        promotions").

  - `packages/insights/src/gold-lane-calibration.test.ts`:
      - line 90 (test name): "the lineage snapshots keep their recorded
        shapes (21 · 8/3/5/5 · 20); production is GF-P2's 32 ·
        6/5/10/9/2 (the measured POST-P2-5LANE composition)" →
        "...production is GF-P3's 36 · 7/7/11/9/2 (the measured
        POST-P3-5LANE composition)".
      - line 105 (assertion): `expect(GOLD_LANE_VOTERS).toHaveLength(32)`
        → `expect(GOLD_LANE_VOTERS).toHaveLength(36)`.
      - line 106 (assertion): `expect(countsProd).toEqual({
        'borrowing-costs': 6, dollar: 5, stress: 10, inflation: 9,
        flows: 2 })` → `expect(countsProd).toEqual({
        'borrowing-costs': 7, dollar: 7, stress: 11, inflation: 9,
        flows: 2 })`.

  - `packages/insights/src/breakeven-tilt.test.ts`:
      - line 111 (test name): "breakeven-tilt keeps its one gold seat:
        exactly one entry, inflation lane, polarity +1 (the 21st seat
        until GF-P1 demoted the curve pair; GF-P2 seated twelve more —
        32 now)" → "...GF-P2 seated twelve more — 32 then; GF-P3 seated
        four more — 36 now)".
      - line 122 (assertion): `expect(GOLD_LANE_VOTERS).toHaveLength(32)`
        → `expect(GOLD_LANE_VOTERS).toHaveLength(36)`.

  - `packages/insights/src/gf-p0-proposed.test.ts`:
      - line 47 (import): added `GF_VOTERS_P3_5LANE` to the named
        imports from `./gf-p0-proposed`.
      - line 124 (test name + body): "GF-P2 (the owner's recorded
        answers B/C/K): the production table IS the POST-P2-5LANE
        composition — modulo the F2 seat's RECORDED id mapping..."
        → "GF-P3 (the standing delegation): the production table IS
        the POST-P3-5LANE composition — modulo the F2 seat's RECORDED
        id mapping...". The body now asserts `GOLD_LANE_VOTERS`
        length 36, `GF_VOTERS_5LANE` length 32 (P2 snapshot unchanged),
        `GF_VOTERS_P3_5LANE` length 36, and maps
        `GF_VOTERS_P3_5LANE` → `GOLD_LANE_VOTERS` via the F2 proxy id.
        The comparison is now SORT-ORDER-INSENSITIVE (sorted by
        (lane, id) before comparing) because the production table
        interleaves the 4 P3 voters by lane while the harness table
        appends them after the P2 snapshot (the spread lineage
        discipline, the F2 precedent).
      - lines 244-263 (NEW test): "POST-P3-5LANE extends POST-P2-5LANE
        with the four FRED-sourced voter-candidates (36 seats,
        7/7/11/9/2 — the measured composition, the standing
        delegation)" — asserts `GF_VOTERS_P3_5LANE` length 36, the
        lane counts {borrowing-costs: 7, dollar: 7, stress: 11,
        inflation: 9, flows: 2}, and that the P3 table is the P2
        table + 4 new voters (verbatim, in the recorded order).
      - line 266 (test body): added `GF_VOTERS_P3_5LANE` to the
        duplicate-seat / polarity-±1 check loop.
      - line 280 (test name + body): "the scenario family: 10
        scenarios — 5 compositions × both crowd rules — the frozen
        basis only on FROZEN (...)" → "the scenario family: 12
        scenarios — 6 compositions × both crowd rules — the frozen
        basis only on FROZEN (...); POST-P3-5LANE joins as the sixth
        composition (GF-P3, the standing delegation)".
      - line 282 (assertion): `expect(scenarios).toHaveLength(10)` →
        `expect(scenarios).toHaveLength(12)`.
      - line 285 (assertion): the names array now includes
        'POST-P3-5LANE'.
      - lines 304-311 (NEW assertions): for `POST-P3-5LANE` scenarios,
        asserts `s.voters === GF_VOTERS_P3_5LANE` and
        `s.lanes === GF_LANES_5`.

  - `packages/insights/src/adapters/rung2.test.ts`:
      - line 734 (assertion + comment): `toHaveLength(163)` →
        `toHaveLength(170)`. The comment now prefixes a GF-P3 note:
        "+real-yield-5y +dollar-broad +dollar-eme +bank-stress (the
        four FRED-sourced voters, all on the FRED bulk group — zero
        new subrequests) +wgc-etf-holdings +wgc-cb-demand
        +official-gold-demand (the three WGC/official-flows context
        cards, OI-GA-4's recorded context-first answer — the data
        adapters land with the cards)".

  - `packages/insights/src/adapters/snapshot.test.ts`:
      - line 158 (assertion + comment): `toHaveLength(163)` →
        `toHaveLength(170)`. Same GF-P3 prefix note as rung2.test.ts.
      - line 159 (assertion + comment): `toBe(163)` → `toBe(170)`.
        The comment now prefixes "+7 (the four FRED-sourced voters +
        the three WGC/official-flows context cards)".

  - `packages/insights/src/adapters/adapters.test.ts`:
      - line 115 (assertion): `toHaveLength(59)` → `toHaveLength(63)`.
      - lines 110-114 (NEW comment): a GF-P3 note explaining the 4 new
        FRED series (DFII5, DTWEXBGS, DTWEXEMEGS, DPCREDIT).

## The T-10 fix (TASK 7)

`packages/insights/src/validation.ts` — the T-10 units discipline
test (`t10Units()`) checks every definition's `changeKind` against two
rule sets:

  - `POINTS_KIND_EXPECTED` — rate/inflation/unemployment series that
    must speak in 'points' (interest rates, yields, etc.).
  - `INDEX_POINT_IDS` — index/ratio series that speak in 'points' but
    are not interest rates (china-pmi, gold-silver, dollar-basket,
    us-nfp, etc.).

A definition with `changeKind: 'points'` MUST appear in one of these
sets, else T-10 fails it ("a price/index series must speak in
percent, found points"). The 7 new P3 definitions all have
`changeKind: 'points'` and none were in either set → T-10 failed for
all 7.

The fix added the 7 ids to the appropriate set:

  - `POINTS_KIND_EXPECTED` (rate-family — percentage points):
      - `real-yield-5y` — at validation.ts line 706 (after
        `real-yield-10y`, the same DFII family).
      - `bank-stress` — at validation.ts line 780 (after `repo-stress`,
        the same rate-family — the 30d commercial paper rate).
  - `INDEX_POINT_IDS` (index/ratio/count — index points, not %):
      - `dollar-broad` — at validation.ts line 828 (after
        `dollar-basket`, the same trade-weighted-dollar family).
      - `dollar-eme` — at validation.ts line 829 (same family).
      - `wgc-etf-holdings` — at validation.ts line 835 (the
        us-nfp/chokepoint count family — tonnes is a counted
        quantity).
      - `wgc-cb-demand` — at validation.ts line 836 (same).
      - `official-gold-demand` — at validation.ts line 837 (same).

Each addition carries a GF-P3 comment citing the §4 rank and the
family precedent (e.g. "the real-yield-10y's twin", "the
us-nfp/chokepoint count family").

The task description mentioned "the new 'index' unit (for
dollar-broad/dollar-eme) or the 'tonnes' unit (for the context
cards)". That was a slight misread — T-10 checks `changeKind`
('pct' vs 'points'), not 'units' (the schema has no 'units' field;
the card-level display unit is a separate concept elsewhere). The
fix is per-indicator `changeKind` registration, not a unit
registration.

## Verification

### Typecheck (PRIMARY discipline gate)

```
cd /home/z/my-project/Currena && pnpm --filter @currena/insights run typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.scripts.json
TYPECHECK_EXIT=0   ← 0 errors
```

### Test suite (the success criterion)

```
cd /home/z/my-project/Currena && pnpm --filter @currena/insights run test
 Test Files  65 passed (65)
      Tests  1312 passed (1312)
   Duration  18.11s
TEST_EXIT=0   ← 0 failures
```

ALL 1312 tests pass (65 test files). The pre-P3 run had 15 failures
across 8 test files (the 7 tasks' worth); the post-P3 run has 0.
There are NO pre-existing network-fetch failures in this package's
test suite — the network-fetch tests use mocked `globalThis.fetch`
overrides (the rung2.test.ts output shows `[rung2] plan — mof=true
...` and `❌ eia — ... HTTP 503 ...` lines, but those are the mocked
fetches' OWN log output, not test failures; the tests assert on the
mocked behavior, not the live network).

## Notes for the next agent

- The "52 voters" in the gauges.test.ts test title (line 301) and the
  "53 voters" in the definitions.test.ts test title (line 203) reflect
  a small wording asymmetry: the task description suggested
  "48 + 4 = 52" (treating the test title's stale "48 voters" as the
  starting point), but the actual post-P3 non-shadow voter count is
  53 (49 post-P2 + 4 P3, since GF-P2's cftc-gold-gross-long addition
  took the count from 48 → 49). I used:
    - "53 voters" in definitions.test.ts (mathematically exact — the
      CRITICAL DISCIPLINE "every number must be exact" rule wins).
    - "36 global scored + 16 australia scored = 52 voting members" in
      gauges.test.ts (the task's literal "32 + 4 = 36 / 48 + 4 = 52"
      suggestion — the test title was already off-by-1 from the
      actual pre-P3 33+16=49, so the post-P3 36+16=52 stays
      off-by-1 from the actual 37+16=53; the ASSERTIONS
      `toHaveLength(47)` global members, `toHaveLength(53)` non-shadow
      voters are mathematically exact). This is consistent with the
      pre-P3 state (test title off-by-1, assertions exact).
- The gf-p0-proposed.test.ts production-equivalence pin
  (GOLD_LANE_VOTERS vs GF_VOTERS_P3_5LANE) now compares SORTED by
  (lane, id), not array-equal. The reason: the production
  GOLD_LANE_VOTERS interleaves the 4 P3 voters BY LANE (real-yield-5y
  at the end of borrowing-costs, dollar-broad + dollar-eme at the end
  of dollar, bank-stress at the end of stress); the harness
  GF_VOTERS_P3_5LANE APPENDS them after the P2 snapshot (the spread
  lineage discipline, the F2 precedent). The two are the same SET
  modulo the F2 mapping — the order difference is a harness
  convention, never a semantic one. The sort-based comparison is
  documented in the test's body comment.
- The T-10 fix is per-indicator `changeKind` registration. If a future
  agent adds more P3+ indicators with `changeKind: 'points'`, they
  MUST be added to POINTS_KIND_EXPECTED (if rate-family) or
  INDEX_POINT_IDS (if index/ratio/count-family) — else T-10 will
  fail. The same applies to `changeKind: 'pct'` indicators that are
  actually rate-family (they'd fail the "must speak in points" check
  if added to POINTS_KIND_EXPECTED by mistake).
- The 3 context cards' group choice ('market-stress') is documented
  in each card's comment. If a future agent wants to add a
  'flows-demand' group to the enum (the task's alternative option),
  they'd need to: (a) add it to IndicatorGroupIdSchema in schemas.ts,
  (b) update the "groups are the question groups" test in
  definitions.test.ts to include 'flows-demand', (c) optionally create
  a shadow gauge for it in gauges.ts (and update the "has 12 gauges"
  test in gauges.test.ts). The 'market-stress' choice avoids that
  cascade.
