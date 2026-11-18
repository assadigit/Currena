> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S11 M1 — Citation re-verification + the R07 Treasury-direct read re-check

**Session:** S11 of the Gold Page Elevation (GPE) program — the SECOND
Phase-D implementation session (P1-b, the explanation band, wave 1).
**Date:** 2026-11-18 (~12:0x–12:4x UTC). **Branch:**
`gold-elevation/p1b-explanation-band` (off
`gold-elevation/p1a-credibility-floor` at `ec57261e` — the S10 close.
The prompt's "main at the S10 close — production f0844e59" is this tree:
git `main` still sits at the R-5 close `19131b0`; the P1-a rows R01–R06
and the s10 docs live on the p1a branch, and production `f0844e59` is
built from it — so the fresh branch bases on the p1a tip, exactly as the
S10 session based its own branch on the then-closest main HEAD).
**Status:** Done in code (this milestone), not yet deployed (the
session's deploy is M3).

The gate state at session start (verified, not assumed): the CP-C lock
is COMPLETE (s9/CP-C-RECORD.md §1 + its S9b/S9c addenda); the Phase-D
gate is OPEN (the owner's GO at S10); P1-a DELIVERED + DEPLOYED +
LIVE-VERIFIED — production verified via the Cloudflare deployments API
at session open (~12:1x UTC): **currena-api `f0844e59` @ 100%** (created
2026-11-18T11:37:29Z, the newest deployment; no drift since the S10
close — the D-43 record). Today is Wednesday — the §21 portwatch window
(Tuesday 11:00–14:00 UTC) is clear for the session's deploy.

## M1.0 — Citation re-verification (the session's mandated first step)

Per the S10-established discipline (the CP-C record §3 + s10/M1 §M1.0),
every file path the rows R07–R12 cite was re-verified read-only against
the working tree at the branch base `ec57261e` (the R-5 no-renames
constraint + the `s6/03 §2` module map govern). Zero drift since the
S10 close — S10's own commits touched the gold feature tree
(TrendChart, GoldPositions, GoldSeats, gold-tiles, the dictionaries)
and none of the R07–R12 citation targets moved.

| Row | Cite | Verified at `ec57261e` |
|---|---|---|
| R07 | `packages/insights/src/shared/adapters/collect.ts` — the FRED bulk-group fetch + the 2026-10-22 Treasury FALLBACK block | ✅ present (the fallback triggers at `fred.DGS10 === undefined …`; `fetchTreasuryCurves`, `treasuryT10y2y` imported; `mergeSeries` overlay semantics: the later layer wins date collisions) |
| R07 | `packages/insights/src/domains/usa/adapters/treasury.ts` — the Treasury adapter | ✅ present (162 l; `TREASURY_BASE`/`treasuryCurveUrl` year-scoped pattern; nominal columns 2/10/30 Yr; real column 10 YR; 45 s timeout) |
| R07 | `packages/insights/src/shared/adapters/fred.ts` — `FRED_BULK_GROUPS` (7 groups; the yield family rides groups 1, 2, 3) | ✅ present (group 1 full: DGS10/DGS30; group 2 since-2003: DFII10/DFII5; group 3 decade: T10Y2Y/T10Y3M/DGS2 …12 ids) |
| R07 | `packages/insights/src/shared/adapters/derived.ts` — `buildIndicatorSeries` (the yield-family puts + the derived gaps) | ✅ present (`put('yield-curve-10y2y', fred.T10Y2Y)` … `us-japan-10y-gap`/`au-us-10y-gap` from `fred.DGS10`) |
| R07 | `packages/insights/src/shared/sources.ts` — the `us-treasury` source row | ✅ present (L0, `runtime: 'worker'`, the FALLBACK-ONLY note — the row's `usedFor`/`notes` are updated by R07 to the primary posture) |
| R07 | `packages/insights/src/shared/ingest/run.ts` — `HIGHEST_SINCE_IDS` (the full-history basis) | ✅ present (highest-since reads the in-memory merged series — the swap must keep the FRED full-history group as the basis layer) |
| R08 | `apps/web/src/features/gold/GoldHero.tsx` — the outlook line (Zone C) | ✅ present (the sr-only `pd.global.goldOutlookLabel` + `OUTLOOK_WORD_KEY[hero.outlook]` + `countsParts` co-render at lines ~386–399) |
| R08 | `apps/web/src/shared/i18n/insights-copy-en.ts`/`-fa.ts` — the `verdictStates` sentences + `verdictTitle` + `collapsedVerdict` | ✅ present ("Signs point to a potential decline in gold prices." / «نشانه‌ها حاکی از احتمال افت قابل‌توجه قیمت طلاست.» — the forecast-adjacent family GPE-S2-11 flagged) |
| R08 | `apps/web/src/features/gold/outlook.test.ts` — the pins | ✅ present (pins the seven-state classification + the sentences at lines 169–170) |
| R09 | `packages/insights/src/page-division/placement.ts` — `BLOCKED_NOTES` (the quartet) | ✅ present (wgc-etf-holdings · wgc-cb-demand · official-gold-demand · etf-short-interest, one `why` line each) |
| R09 | `apps/web/src/features/gold/GoldContext.tsx` — the wall rendering + `pd.gold.blocked*` copy | ✅ present (`GOLD_BLOCKED_NOTES.map` at ~247; the title + 4 one-liners at en.ts ~877–881) |
| R10 | `apps/web/src/features/gold/gold-tiles.ts` — the `homePage` pattern (`homePageOfIndicator`) | ✅ present (the seat model carries `homePage`; the anchor builder extends this pattern) |
| R10 | `apps/web/src/features/gold/GoldSeats.tsx` — the lane cards' ids + `seatHref` | ✅ present (lane sections `id={`gold-lane-${lane.lane}`}` — the only other consumer is GoldBalanceClassic's scroll; `seatHref` links the PAGE route without the card hash — the #18 gap) |
| R10 | destination card anchors — `usa-card-*` / `currencies-card-*` | ✅ present (`id={`usa-card-${entry.id}`}` UsaTierCards:211; the CurrenciesTierCards twin) |
| R11 | `apps/web/src/features/gold/GoldPage.tsx` — Zone D's slot (between the hero at ~212 and Signals at ~223) | ✅ present; the derivations (`goldHero`/`goldSeatLanes`/`goldContextCards`) are pure functions over the projection readings — the F1/F5 derivations join them |
| R11 | `packages/insights/src/domains/gold/gold-balance.ts` — the engine (lanes, members, counts) | ✅ present (`GoldBalanceReading`/`GoldBalanceLane`/`GoldBalanceMember` — the narrative's input model) |
| R12 | the legs — `us10y` · `real-yield-10y` · `term-premium-10y` (FRED THREEFYTP10) readings + derived breakeven | ✅ present (all three ids in the projection; `term-premium-10y` is a market-stress seat on /usa) |
| R12 | `apps/web/src/features/gold/GoldPage.tsx` Zone D + the module map's landing spots | ✅ (`features/gold/narrative/GoldNarrative.tsx` + `features/gold/GoldYieldDecomposition.tsx` + the pure engines `packages/insights/src/domains/gold/{narrative,yield-decomposition}.ts` are new modules — the s6/03 §2 addresses verified free) |

**Citation drift since the S10 close: none.** The S10 commits
(`6841887`…`ec57261e`) touched the gold feature tree and both
dictionaries; no R07–R12 citation target moved.

## M1.1 — The R07 Treasury-direct read re-check (FRED's venue state)

Per the S10 close's carried item + this session's M1: FRED's venue state
was re-verified at build time (2026-11-18 ~12:2x UTC), three ways:

1. **This environment (the Node/scripts venue):** FRED is UP.
   `fredgraph.csv?id=DGS10` (no-cosd full) → HTTP 200, 269,423 B in
   0.11 s, latest row **2026-11-16 = 5.12**. `?id=T10Y2Y` → 200, latest
   **2026-11-17 = 0.30**. `?id=DFII10&cosd=2003-01-02` → 200, latest
   2026-11-16 = 2.92. `?id=DGS2,DGS3MO,DFII5` → 200, latest 2026-11-16
   (4.83 / 4.34 / 2.68). The s8/02 §1-5 transient (timeouts + a 520)
   did not reproduce.
2. **Production (the Worker venue — the 04:10 rung's own evidence):**
   the live status blob (`/api/insights/status`, generated
   2026-11-18T04:35:18Z) reports `failedSources: [rba]` only — every
   FRED group green on today's production rung; the live readings carry
   FRED-fresh values (T10Y2Y @ 2026-11-17).
3. **The Treasury venue (the swap's primary):** both CSVs serve 200
   from this environment — nominal (17,930 B, 19.2 s) with the latest
   row **11/17/2026** (10 Yr 5.10, 2 Yr 4.80, 3 Mo 4.33, 30 Yr 5.46)
   and real (7,962 B, 18.2 s) with the latest row **11/17/2026**
   (5 YR 2.64, 10 YR 2.89). The year-scoped URL pattern answers; the
   14 nominal maturities + the 5 real tenors are all present.

**The freshness gap, measured today:** FRED's no-cosd/cosd answers for
the yield family's freshest members sit at **Nov 16** while
Treasury-direct serves **Nov 17** — the competitor-freshness gap R07
exists to close is live and confirmed. **The cross-check, measured
today:** on the common date Nov 16 the venues agree exactly (Treasury
10 Yr 5.12 = FRED DGS10 5.12 · 30 Yr 5.46 = DGS30 5.46 · 2 Yr 4.83 =
DGS2 4.83 · real 10 YR 2.92 = DFII10 2.92 · real 5 YR 2.68 = DFII5
2.68 · 3 Mo 4.34 = DGS3MO 4.34). The computed spreads differ from
FRED's own T10Y2Y/T10Y3M by ≤ 0.01 (the 2-decimal legs' rounding —
5.12−4.83 = 0.29 vs FRED's 0.30) — the cross-check tolerance for
computed spread legs is 0.02, for direct levels 0.01.

**M1 verdict: FRED is UP → R07 SHIPS** (Treasury primary, FRED
fallback/cross-check — the D10 locked posture). Had FRED been down, R07
would have deferred to a later session and the rest of P1-b proceeded;
that branch was not taken.

## The row plan (M2 order, dependency-driven)

R07 (the data leg — R12's inputs bind it) → R08 (hero copy) → R09 (the
wall copy) → R10 (the anchor/consistency infrastructure — R11/R12
consume it) → R11 (the F1 narrative) → R12 (the F5 yield card). One
commit per row, each verified (typecheck + the touched suites +
copy:audit) before the next.
