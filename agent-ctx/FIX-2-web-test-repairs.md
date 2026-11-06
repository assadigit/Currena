# FIX-2 — GF-S9 gold-meter WEB test suite repair (the 9 GF-P3 fall-throughs)

**Agent:** Z.ai Code (Claude)
**Session:** GF-S9 gold-meter gap-fill (continuing GF-P3, after FIX-1)
**Task ID:** FIX-2
**Date:** 2026-11-06 (repo clock)

## What was done

FIX-1 closed the INSIGHTS-package side of the GF-P3 fall-through (1312 tests,
0 failures). This task FIX-2 closes the WEB-package side: the 9 web test
failures that the GF-P3 production changes (4 FRED-sourced voters seated in
`GOLD_LANE_VOTERS`, the 7 new `IndicatorId`s, the 3 WGC/PBoC context-card
definitions, the FRED adapter's 4 new series, the i18n copy) left behind.

  - TASK 1 — the Farsi corpus count pin updated (163 → 170) in
    `apps/web/src/lib/insights.test.ts`.
  - TASK 2 — the FRED series-count + licence-count + kill-switch-state pins
    updated (52 → 56 series, 3 → 4 licences, on → mixed) in
    `apps/web/src/components/insights/about-sources.test.ts`.
  - TASK 3 — the 3 WGC/PBoC context-card `READING_SOURCES` entries added to
    `packages/insights/src/adapters/derived.ts` + the registry regenerated.
  - TASK 4 — the `voterNames` dictionary entries (EN + FA) for the 4 new
    voters added to `apps/web/src/i18n/insights-copy-en.ts` and
    `apps/web/src/i18n/insights-copy-fa.ts`.
  - TASK 5 — the `gold-balance-lanes.test.tsx` fixtures rebuilt over the
    36-voter table (ALL_VOTERS, DIRECTIONAL, FOR, STACK) + 6 test
    assertions updated + the byte-stability snapshot REGENERATED
    consciously.

## The count updates (TASK 1 + TASK 2)

  - `apps/web/src/lib/insights.test.ts` line 587:
    `expect(Object.keys(insightsCopyFa.indicators)).toHaveLength(163)` →
    `toHaveLength(170)`. The comment chain now prefixes the GF-P3 note:
    "+7 — the 4 FRED-sourced voters (real-yield-5y, dollar-broad,
    dollar-eme, bank-stress) + the 3 WGC/PBoC context cards
    (wgc-etf-holdings, wgc-cb-demand, official-gold-demand)".

  - `apps/web/src/components/insights/about-sources.test.ts`:
      - Test name (line 54): "fred: 52 series, …" → "fred: 56 series, …"
        (the test-name suffix now carries "; the 2026-11-06 GF-P3 round
        adds the four FRED-sourced voter series — DFII5, DTWEXBGS,
        DTWEXEMEGS, DPCREDIT").
      - seriesCount assertion (line 57): `toBe(52)` → `toBe(56)`. The
        comment chain now suffixes "GF-P3 (2026-11-06) adds the four
        FRED-sourced voter series — DFII5 (real-yield-5y), DTWEXBGS
        (dollar-broad), DTWEXEMEGS (dollar-eme), DPCREDIT (bank-stress)".
      - licence-count assertion (line 67): `toBe(3)` → `toBe(4)`. The
        comment now reads "4 distinct licence names across the 56 series
        (public-domain, citation-required, the unofficial-endpoint "no
        reuse" one, and the GF-P3 "copyright not scanned (fail closed)"
        class for the four new FRED-sourced voters whose T-16 scan lands
        with the data adapters at GF-S10)".
      - NEW assertion (line 72): `expect(fred!.licences).toContain('FRED
        series — copyright not scanned (fail closed)')` — pins the 4th
        licence name (the honest "fail closed" state for the 4 new
        series).
      - kill-switch-state assertion (line 77): `toBe('on')` →
        `toBe('mixed')`. The comment explains: "GF-P3: the four new
        FRED-sourced voters ride the 'fail closed' licence (their T-16
        copyright scan lands with the data adapters at GF-S10) → the
        provider's kill-switch state is MIXED (52 of 56 enabled — the
        four new series sit disabled until the scan promotes them)".
      - NEW assertion (line 78): `expect(fred!.enabledCount).toBe(52)` —
        pins the enabled count (56 total − 4 fail-closed = 52 enabled).

## The 3 READING_SOURCES entries (TASK 3)

Added to `packages/insights/src/adapters/derived.ts` at lines 1018-1034,
right after the 4 GF-P3 FRED-sourced voter entries (lines 1013-1017) and
before the `us10y` entry (now line 1035). The three entries:

```typescript
// GF-P3 (2026-11-06, audit §4 — OI-GA-4's recorded context-first answer).
// The three WGC/PBoC context cards: their data adapters ship at GF-S10
// (the cards display "awaiting data" honestly until then), but the source
// metadata is complete so the registry entry carries the source name +
// link the B-11/T-13 discipline requires.
'wgc-etf-holdings': {
  name: 'World Gold Council (ETF holdings)',
  url: 'https://www.gold.org/goldhub/data/global-gold-backed-etf-holdings-and-flows',
},
'wgc-cb-demand': {
  name: 'World Gold Council (Gold Demand Trends)',
  url: 'https://www.gold.org/goldhub/data/central-bank-gold-purchases',
},
'official-gold-demand': {
  name: "People's Bank of China / SAFE (official reserve assets)",
  url: 'https://www.pbc.gov.cn/en/3688110/index.html',
},
```

After adding, ran `pnpm registry:generate` to regenerate
`data/indicators.json` (170 indicators) + `data/indicator-audit.json`
(170 audit entries). The registry-sync test (B-11/T-13 discipline) now
passes: every entry carries a source name + an `https://` link.

## The voterNames entries (TASK 4)

### EN — `apps/web/src/i18n/insights-copy-en.ts` lines 9257-9268

Added right after the GF-P2 block (the `cftc-gold-gross-long` entry at
line 9256) and before the `evidenceWords` block (now line 9270). A GF-P3
comment header explains the family precedents.

```typescript
// GF-P3 (2026-11-06, the standing delegation — audit §4 ranks 19–21,
// 28: R2/D2/D9/S9): the four FRED-sourced voters' names — compact
// forms of their indicator cards' own names, same family as every
// entry above. real-yield-5y is the DFII5 twin of real-yield-10y
// (the belly of the curve); dollar-broad and dollar-eme are the
// trade-weighted dollar family beside dollar-basket; bank-stress is
// the 30-day commercial paper rate, the funding-stress sibling of
// ebp/repo-stress.
'real-yield-5y': 'Real yield (5y)',
'dollar-broad': 'Dollar (broad)',
'dollar-eme': 'Dollar (EME)',
'bank-stress': 'Bank stress',
```

### FA — `apps/web/src/i18n/insights-copy-fa.ts` lines 2681-2691

Added right after the GF-P2 block (the `cftc-gold-gross-long` entry at
line 2680) and before the `evidenceWords` block (now line 2693). A GF-P3
comment header in Persian explains the family precedents.

```typescript
// GF-P3 (۲۰۲۶-۱۱-۰۶، نمایندگی قائم — رتبه‌های ۱۹–۲۱ و ۲۸ ممیزی:
// R2/D2/D9/S9): نام چهار رأی‌دهندهٔ جدید — صورت‌های فشردهٔ نام
// کارت‌های خودشان، هم‌خانوادهٔ بقیهٔ موارد. real-yield-5y هم‌زادِ
// DFII5ِ real-yield-10y است (میانهٔ منحنی)؛ dollar-broad و
// dollar-eme خانوادهٔ شاخص دلارِ وزنی بر اساس تجارت در کنار
// dollar-basket هستند؛ bank-stress نرخ اوراق تجاری ۳۰روزه است،
// هم‌ردیفِ ebp و repo-stress در تنشِ تأمین مالی.
'real-yield-5y': 'بازده واقعی (۵ساله)',
'dollar-broad': 'دلار (گسترده)',
'dollar-eme': 'دلار (کشورهای نوظهور)',
'bank-stress': 'تنش بانکی',
```

### FA conventions followed

  - **Persian digits** in the real-yield-5y name (۵ساله — the 5-year
    maturity), matching the existing FA style (e.g. `انتظار تورم ۵ سالهٔ
    آمریکا` for t5yie at line 2676).
  - **ZWNJ** where meaningful (none needed in these 4 short names — the
    parenthetical forms don't split words).
  - **Latin tickers / FRED codes stay Latin**: none in these short names
    (the FRED series codes DFII5/DTWEXBGS/DTWEXEMEGS/DPCREDIT stay in
    `whatItIs` per the COPY-1 precedent, not in `voterNames`).
  - **Terminology**: "بازده واقعی" (real yield — matches the existing
    real-yield-10y entry `بازده واقعی اوراق قرضه`); "دلار" (dollar —
    matches dollar-basket `شاخص دلار`); "تنش بانکی" (bank stress — uses
    the native "تنش" which matches stress-stlfsi `تنش در بازارهای پول
    آمریکا` rather than the borrowed "استرس", for consistency with the
    existing stress vocabulary).
  - **EME translation**: "کشورهای نوظهور" (emerging economies — the
    standard Persian term for EMEs, used in financial journalism).
  - **No em dashes** in the Persian strings (the localization convention).

The voterNames dictionary now covers EXACTLY the 36-voter
`GOLD_LANE_VOTERS` table (32 pre-P3 + 4 P3 = 36), satisfying the
dictionary-coverage test's `Object.keys(g.voterNames).sort()` equality
check.

## The fixture rebuild (TASK 5)

`apps/web/src/components/insights/signals/gold-balance-lanes.test.tsx`:

### ALL_VOTERS (lines 134-179)

The `ALL_VOTERS` array grew from 32 → 36 voters. The 4 new voters
appended after `cftc-gold-gross-long` (in the recorded lane order:
real-yield-5y, dollar-broad, dollar-eme, bank-stress). The comment
header updated: "Every one of the 32 voters (GF-P2…)" → "Every one of
the 36 voters (GF-P3, 2026-11-06, the standing delegation: GF-P2's
twelve promotions + the COBD pair + the flows pair + GF-P3's four
FRED-sourced voters; the two yield-curve seats stay demoted)".

### DIRECTIONAL (lines 232-241)

Added 4 `quiet()` entries for the 4 new voters right before the
`gold-usd` context row. The comment: "GF-P3 (the standing delegation):
the four FRED-sourced voters as quiet rows — the synthetic fixture's
lanes stay readable, the new seats fire nowhere on this case
(DIRECTIONAL: 1 for · 2 against · 2 neutral)". The lane-level counts
are unchanged (the 4 new voters are quiet, so they don't affect the
firing counts).

### FOR (lines 282-288)

Same 4 `quiet()` entries added. The comment: "GF-P3 (the standing
delegation): the four FRED-sourced voters as quiet rows — the FOR
case's 3-0-2 shape holds (3 for · 0 against · 2 neutral)".

### STACK (lines 332-338)

Added 4 `reading()` entries with the 4 new voters FIRING ON THE
AGAINST side of their polarities (matching the STACK case's "all 5
lanes against" intent):
  - `real-yield-5y`: value 2.4, percentile 0.95 (high real yield
    pressures — polarity −1)
  - `dollar-broad`: value 130, percentile 0.95 (strong broad dollar
    pressures — polarity −1)
  - `dollar-eme`: value 130, percentile 0.95 (strong EME dollar
    pressures — polarity −1)
  - `bank-stress`: value 0.1, percentile 0.05 (calm funding market
    pressures — polarity +1, so LOW = against)

The comment: "GF-P3 (the standing delegation): the four FRED-sourced
voters fire on the against side of their polarities (STACK: 0 for · 5
against)".

### Test assertion updates

  - **"the open row lists the firing members"** (lines 595-607):
    The borrowing-costs lane now has 7 members (3 supports + 1 pressure
    + 2 steady + 1 unread). The unread member is `real-yield-5y`
    (absent from the 2026-10-31 archive). Updated:
      - Comment: "The 19 voters are all reachable (AC-2): 6 members in
        this lane (GF-P1 H: the two yield-curve seats demoted — 8 → 6)."
        → "The 36-voter table's borrowing-costs lane has 7 members
        (GF-P1 H: the two yield-curve seats demoted — 8 → 6; GF-P3:
        real-yield-5y seated — 6 → 7)."
      - Assertion: `expect(members.querySelectorAll('[data-balance-member]').length).toBe(6)`
        → `toBe(7)`.
      - NEW assertions: the unread group renders with 1 member
        (`'Could not be read (1)'` + `'Real yield (5y)'`).

  - **"an unread member group renders only when a voter could not be
    read"** (lines 626-679):
    The staled-clone case now has 3 unread members (ecb-dfr + fed-target
    staled + real-yield-5y absent). The clean-fixture case now has 1
    unread member (real-yield-5y absent — the clean fixture is no longer
    "clean" for the borrowing-costs row). The stress row's unread group
    grew from 6 → 7 (bank-stress added). Updated:
      - Staled-clone: `'Could not be read (2)'` → `'Could not be read (3)'`;
        `length).toBe(2)` → `toBe(3)`.
      - Clean-fixture: changed from `toBeNull()` (no unread group) to
        `not.toBeNull()` + `'Could not be read (1)'` + `'Real yield (5y)'`.
      - Stress row: `'Could not be read (6)'` → `'Could not be read (7)'`;
        NEW assertion `'Bank stress'` in the stress unread text.
      - Flows row: unchanged (2 unread, no new flows voters).

  - **"the rendered rim matches the ledger counts on the recorded
    fixture (V-4)"** (lines 872-891):
    The borrowing-costs rim now has 7 segments (3 supports + 1 pressure
    + 2 steady + 1 unread). Updated:
      - Comment: "3 supports, 1 pressure, 2 steady — 6 members" →
        "3 supports, 1 pressure, 2 steady, 1 unread — 7 members".
      - Rim segments: `length).toBe(6)` → `toBe(7)`.
      - NEW rim assertion: `[data-bal-seg="unread"]').length).toBe(1)`.
      - NEW ledger assertion:
        `[data-balance-member-impact="unread"]').length).toBe(1)`.

  - **RTL test — the dollar lane tally** (lines 995-1001):
    The dollar lane now has 7 readable voters (5 pre-P3 + dollar-broad
    + dollar-eme as quiet in DIRECTIONAL). Updated:
      - Comment: "2 of its 5 voters firing" → "2 of its 7 voters firing
        (GF-P2 C/K: D5 + G4 seat — the quiet rows read steady; GF-P3:
        the broad + EME dollar twins join as quiet rows — 5 → 7
        readable)".
      - Assertion: `'۲ مورد از ۵ عامل فعال است'` → `'۲ مورد از ۷ عامل
        فعال است'` (Persian digits ۵ → ۷).

### The byte-stability snapshot REGENERATED consciously

`apps/web/src/components/insights/signals/__snapshots__/gold-balance-lanes.test.tsx.snap`
— regenerated via `npx vitest run -u`. The diff was verified BEFORE
acceptance:

  - **Rim segments**: the `data-bal-seg` count went from 64 → 72
    entries. The unread segment count went from 26 → 34 (+8 = 4 new
    voters × 2 appearances each: once in the disc, once in the ledger
    row's unread group). The supports (8), pressures (6), and steady
    (24) counts are UNCHANGED — confirming the GF-P3 voters are all
    unread (not firing) in the archive, exactly as expected.
  - **Lane tallies**: UNCHANGED. The borrowing-costs tally stays "4 of
    6 drivers firing" (real-yield-5y is unread, not readable, so the
    readable count stays 6). The dollar tally stays "1 of 3 drivers
    firing" (dollar-broad + dollar-eme are unread). The stress tally
    stays "No driver firing". The inflation tally stays "1 for, 1
    against" (split). This confirms the 4 new voters are unread in the
    archive — they don't change the readable counts or firing counts
    of their lanes.
  - **The verdict block, the beam tilt, the pan weights, the tray
    weights**: all UNCHANGED — the lane-level counts (1 for · 0
    against · 3 not leaning · 1 unread) are unchanged because the 4
    new voters are unread at the voter level but their lanes stay
    readable (the lanes still have other readable voters).

This is the expected GF-P3 change: the snapshot now carries the 4 new
voters' unread segments in the borrowing-costs, dollar, and stress
discs + ledger rows, with no other drift. The regeneration is
conscious per the GF-S8 precedent.

## Verification

### Typecheck (PRIMARY discipline gate)

```
cd /home/z/my-project/Currena && pnpm --filter @currena/web run typecheck
> tsc --noEmit
TYPECHECK_EXIT=0   ← 0 errors
```

### Web test suite (the success criterion)

```
cd /home/z/my-project/Currena && pnpm --filter @currena/web run test
 Test Files  51 passed (51)
      Tests  12617 passed (12617)
   Duration  32.30s
TEST_EXIT=0   ← 0 failures
```

ALL 12617 web tests pass (51 test files). The pre-FIX-2 run had 9
failures across 4 test files; the post-FIX-2 run has 0.

### Insights test suite (the no-regression gate)

```
cd /home/z/my-project/Currena && pnpm --filter @currena/insights run test
 Test Files  65 passed (65)
      Tests  1312 passed (1312)
   Duration  18.13s
TEST_EXIT=0   ← 0 failures
```

The 3 `READING_SOURCES` additions (TASK 3) did NOT break any insights
tests. The 1312 insights tests still pass (65 test files). This
confirms the `READING_SOURCES` entries are well-formed and the
registry regeneration produced a consistent `data/indicators.json`.

## Notes for the next agent

  - The 4 new FRED-sourced voters (real-yield-5y, dollar-broad,
    dollar-eme, bank-stress) ride the "fail closed" licence class
    ("FRED series — copyright not scanned (fail closed)") because their
    T-16 copyright scan hasn't been run yet. The about-sources test now
    pins this honest state (4 licences, mixed kill-switch, 52 of 56
    enabled). When a future agent runs the FRED copyright scan on
    DFII5/DTWEXBGS/DTWEXEMEGS/DPCREDIT (the `pnpm fred:copyright-scan`
    script or equivalent), the 4 series will be promoted to either
    public-domain or citation-required, the licence count will drop
    back to 3, the kill-switch state will return to "on", and the
    enabled count will return to 56. The test will need to be updated
    back at that point. This is the GF-S10 data-adapter task's
    concern — the scan is a data-generation step, not a production-logic
    change.

  - The byte-stability snapshot now carries 72 rim segments (was 64).
    If a future agent adds MORE voters to `GOLD_LANE_VOTERS`, the
    snapshot will need regeneration again — the unread segment count
    will grow by 2× the number of new voters (once in the disc, once
    in the ledger row's unread group, assuming the new voters are
    absent from the archive fixture). The supports/pressures/steady
    counts will only change if the new voters are PRESENT in the
    archive (which would require backfilling the
    `gold-backtest-corpus.json` archive).

  - The `voterNames` dictionary must cover EXACTLY the
    `GOLD_LANE_VOTERS` table — no more, no less. The
    dictionary-coverage test asserts
    `Object.keys(g.voterNames).sort()).toEqual([...new Set(tableIds)].sort())`.
    If a future agent adds a voter to `GOLD_LANE_VOTERS` without
    adding a `voterNames` entry (EN + FA), this test will fail. The 4
    GF-P3 entries added here keep the dictionary in sync with the
    36-voter table.

  - The `ALL_VOTERS` array in `gold-balance-lanes.test.tsx` is the
    synthetic fixtures' shared quiet-row list. It must mirror
    `GOLD_LANE_VOTERS` (same ids, any order — the array is used by
    `ALL_UNREAD` and `SPARSE` which don't care about order). If a
    future agent adds a voter to `GOLD_LANE_VOTERS` without adding it
    to `ALL_VOTERS`, the `ALL_UNREAD` and `SPARSE` fixtures will be
    inconsistent (the new voter would be absent → unread, which is
    fine for `ALL_UNREAD` but might break `SPARSE`'s "1 readable lane"
    intent if the new voter lands in the borrowing-costs lane and is
    kept readable by the `slice(8)` logic). The safest practice is to
    append new voters to the END of `ALL_VOTERS` (so `SPARSE`'s
    `slice(8)` still stakes them).

  - The `DIRECTIONAL`, `FOR`, and `STACK` synthetic fixtures list
    every voter explicitly (quiet or firing). If a future agent adds a
    voter to `GOLD_LANE_VOTERS`, they should also add a `quiet()` (or
    `reading()`) entry for it in these 3 fixtures — otherwise the new
    voter would be absent → unread, which changes the lane's
    readable/unread composition and might break the lane-level count
    assertions (e.g. DIRECTIONAL's `expect(b.counts).toEqual({ for: 1,
    against: 2, neutral: 2, unread: 0 })`).

  - The `gold-backtest-corpus.json` archive (`2026-10-31`) predates
    GF-P3, so the 4 new voters are absent from it. The
    `fixtureReadings()`-based tests honestly show the 4 new voters as
    unread (the archive-verified state). If a future agent backfills
    the archive with the 4 new voters' readings, the
    `fixtureReadings()`-based tests would need to be re-pinned (the
    unread groups in the borrowing-costs, dollar, and stress rows
    would shrink; the rim segment counts would change; the
    byte-stability snapshot would need regeneration). This is the
    GF-S10 data-adapter task's concern.
