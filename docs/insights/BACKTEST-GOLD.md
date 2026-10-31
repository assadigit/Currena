# Gold-score backtest — Session 4

Generated from the recorded KV corpus (`packages/insights/fixtures/gold-backtest-corpus.json`, recorded 2026-10-31T12:34:24.654Z read-only via `pnpm --filter @currena/insights gold-corpus-dump`; the stage blob it froze was written 2026-10-31T04:20:18.220Z). No live sites are touched; the harness reads recorded data only, at a frozen clock (no wall-clock reads anywhere). The voter table, thresholds and labels are the frozen S1–S3 production values — NOTHING here changes them. This report is the D-5 evidence the owner reads; every cell carries its n.

## Method

- Engine: the FROZEN 20-voter table (`gold-score.ts` `GOLD_LANE_VOTERS`) evaluated through the shared signals evaluator (`connections.ts` `evalLeg` — a 30-day direction beyond the per-leg minimum move, else the decade-extreme level), the same `computeReading` percentile/change/stale math the ingest runs, and `scoreOverVoters` — a harness-local parameterized copy of the score arithmetic **pinned equal to the production engine by test** (`gold-backtest-core.test.ts`).
- Frozen clock: every window passes its own date (`<window-day>T04:10:00.000Z`, the main rung’s time-of-day); nothing reads the wall clock.
- No lookahead: every series is truncated at the window day BEFORE any scoring math (`seriesUpTo`); percentiles are computed strictly from observations at or before the as-of date. Truncated-vs-full equality and a future-spike mutation test pin this.
- The D-6 cross-fill is applied to the real-yield-10y SCORING INPUT exactly as in production (`realYieldScoringSeries` over the truncated pure DFII10 + the DGS10/T10YIE legs, the same decade window, 2003 floor, 4dp quantization and 5% cap), and the fill count is reported aloud below.
- Windows: EVERY gold trading day across the stored-history span (the realized series' own dates — the join needs no interpolation): 2016-11-02 → 2026-10-31, **2514 windows** (the daily grid; the compute budget allowed it).
- Realized moves: forward N-TRADING-DAY returns from `insights:hist:gold-usd` (the spec's B2 venue; 2514 observations, 2016-11-02 → 2026-10-31), EXACTLY N observations ahead — never interpolated. Horizons: 5 / 20 / 60 trading days.
- The flat band: the engine's OWN reality bar (±2% per 30 calendar days, `GOLD_REALITY_SPEED_PCT`) linearly scaled to each horizon's calendar length (5 trading days ≈ 7 calendar days → **±0.47%**; 20td ≈ 28d → **±1.87%**; 60td ≈ 84d → **±5.60%**). One constant, one scaling rule — no per-horizon tuning.
- The label axis folds the 5-step vocabulary to 3 buckets (tailwind / mixed / headwind; **mixed = balanced ∪ nothing-firing**); the move axis is up / flat / down against the band.
- Multiple testing is named: 3 horizons × 3 label buckets is already 9 cells per table — ALL are reported, none picked. One sensitivity split is stated (the mature-base subsample: windows ≥ 2021-09-23, i.e. a percentile base of at least ~5 years for the daily voters) and reported BESIDE the all-windows tables, never selected from.
- Archive era: the 16 archived days are re-scored from the readings the rungs ACTUALLY stamped (the live out-of-sample slice — the SPA's own re-derivation path), joined to the same forward returns. Tiny-n by construction; stated as such.

## The corpus (the §0 verification, at harness run time)

- Live API `https://currena.ir/api/insights` (checked at session start, 2026-10-31 ~12:15 UTC): `goldSummary` PRESENT (netScore −2, label `headwind`, the 04:20 rung) and `breakeven-tilt` present among the 102 readings — the S2.1+S3 state stands.
- Read-only KV: **16 full archive days** (`insights:archive:v1:*`, 2026-10-15 → 2026-10-31; 2026-10-20 absent — a rung outage day, the only gap). The newest (2026-10-31) carries `goldSummary` (present on: 2026-10-31 — the field shipped with S2.1/S3 and the 10-31 rung was the first to stamp it).
- The stored-history span: the daily FRED family's stage series start 2016-09-23 — the harness's depth is ~10.1 years, exactly the depth production's percentile window sees.
- Venue note: the stage blob's gold-usd copy carries 2516 points; the realized-move series (`insights:hist:gold-usd`, the spec's venue) carries 2514 — 2 points fewer at the head (2016-11-02 vs 2016-10-31); both end 2026-10-31. The join uses the hist key; the difference is recorded, not silently reconciled.

The asOf-watch (the S3 known-gap — did the trio keep moving WITH the decade group after the D-4 split?), newest 6 archive days:

| archive day | us10y | us30y | real-yield-10y | T5YIFR (decade group) | t5yie | trio status |
|---|---|---|---|---|---|---|
| 2026-10-26 | 2026-10-22 | 2026-10-22 | 2026-10-22 | 2026-10-23 | 2026-10-23 | warning ×3 |
| 2026-10-27 | 2026-10-23 | 2026-10-23 | 2026-10-23 | 2026-10-26 | 2026-10-26 | warning ×3 |
| 2026-10-28 | 2026-10-26 | 2026-10-26 | 2026-10-26 | 2026-10-27 | 2026-10-27 | warning ×3 |
| 2026-10-29 | 2026-10-27 | 2026-10-27 | 2026-10-27 | 2026-10-28 | 2026-10-28 | warning ×3 |
| 2026-10-30 | 2026-10-28 | 2026-10-28 | 2026-10-28 | 2026-10-29 | 2026-10-29 | warning ×3 |
| 2026-10-31 | 2026-10-29 | 2026-10-29 | 2026-10-29 | 2026-10-30 | 2026-10-30 | warning ×3 |

**Verdict:** day 1 (the 2026-10-31 archive — the first S3 rung) shows the trio and the decade group advancing in lockstep, both +1 trading day at the same rung (trio 2026-10-28 → 2026-10-29, decade group 2026-10-29 → 2026-10-30; values moved too: us10y 5.05 → 4.98). Days 2–3 are NOT YET OBSERVABLE: the corpus ends 2026-10-31 at the S4 run time (2026-10-31 ~12:20 UTC — the 11-01/11-02 rungs have not fired). The watch stays open; nothing here claims it proven.

## Coverage — the 20 voters over the stored histories (+ the tilt under evaluation)

| Voter | Cadence | Span | Obs | Readable windows | Firing windows | Tailwind | Headwind | First firing | Gap notes |
|---|---|---|---|---|---|---|---|---|---|
| `real-yield-10y` | daily | 2016-09-23 → 2026-10-29 | 2524 | 2514 | 2276 | 978 | 1298 | 2016-11-02 | dense series — full-depth re-run |
| `us10y` | daily | 2016-09-23 → 2026-10-29 | 2524 | 2514 | 2081 | 753 | 1328 | 2016-11-02 | dense series — full-depth re-run |
| `us30y` | daily | 2016-09-23 → 2026-10-29 | 2524 | 2514 | 1822 | 519 | 1303 | 2016-11-07 | dense series — full-depth re-run |
| `fed-target` | daily | 2016-09-23 → 2026-10-30 | 3690 | 2514 | 1591 | 534 | 1057 | 2016-11-02 | forward-filled daily series (per-decision levels) — production semantics inherited |
| `fed-expectations` | daily | 2016-09-23 → 2026-10-29 | 2524 | 2514 | 1462 | 1007 | 455 | 2016-11-08 | dense series — full-depth re-run |
| `ecb-dfr` | daily | 2016-09-23 → 2026-10-31 | 3691 | 2514 | 2043 | 1439 | 604 | 2016-11-02 | forward-filled daily series (per-decision levels) — the percentile base weights long-held rates by calendar days; production semantics inherited |
| `yield-curve-10y2y` | daily | 2016-09-23 → 2026-10-30 | 2525 | 2514 | 1377 | 1143 | 234 | 2016-11-07 | dense series — full-depth re-run |
| `yield-curve-10y3m` | daily | 2016-09-23 → 2026-10-30 | 2525 | 2514 | 1426 | 1127 | 299 | 2016-11-09 | dense series — full-depth re-run |
| `dollar-basket` | daily | 2016-09-23 → 2026-10-30 | 2586 | 2514 | 1878 | 892 | 986 | 2016-11-02 | dense series — full-depth re-run |
| `usdjpy` | daily | 2016-09-23 → 2026-10-30 | 2586 | 2514 | 1720 | 406 | 1314 | 2016-11-07 | dense series — full-depth re-run |
| `us-japan-10y-gap` | daily | 2016-11-01 → 2026-10-29 | 97 | 332 | 76 | 8 | 68 | 2020-10-01 | jgb-10y was monthly until the 2026-10-26 MOF daily upgrade — 97 sparse points; a daily-cadence reading over a monthly-density series is stale most windows (fires only near each observation) |
| `stress-stlfsi` | weekly | 2016-09-23 → 2026-10-23 | 527 | 2514 | 1057 | 328 | 729 | 2017-04-28 | dense series — full-depth re-run |
| `nfci` | weekly | 2016-09-23 → 2026-10-23 | 527 | 2514 | 1081 | 534 | 547 | 2017-04-21 | dense series — full-depth re-run |
| `vix` | daily | 2016-09-23 → 2026-10-29 | 2572 | 2514 | 884 | 665 | 219 | 2016-11-04 | dense series — full-depth re-run |
| `gold-silver` | daily | 2016-10-01 → 2026-10-31 | 142 | 256 | 104 | 63 | 41 | 2019-04-01 | percentile history is the World Bank monthly backfill; daily seed points only since 2026-10-08 — a daily-cadence reading over a monthly-density series is stale most windows |
| `cftc-gold-positioning` | weekly | 2026-10-27 → 2026-10-27 | 1 | 5 | 0 | 0 | 0 | — | stored history = 1 point (2026-10-27 — the CFTC series only began accumulating): never fires in the re-run era; the stress lane effectively ran 4-voter |
| `us-cpi-yoy` | monthly | 2016-10-01 → 2026-09-01 | 119 | 2514 | 800 | 506 | 294 | 2019-05-01 | dense series — full-depth re-run |
| `us-pce-core-yoy` | monthly | 2016-10-01 → 2026-09-01 | 120 | 2514 | 781 | 527 | 254 | 2019-05-01 | dense series — full-depth re-run |
| `euro-hicp` | monthly | 2016-10-01 → 2026-09-01 | 120 | 2514 | 886 | 524 | 362 | 2019-05-01 | dense series — full-depth re-run |
| `breakeven-5y5y` | daily | 2016-09-23 → 2026-10-30 | 2525 | 2514 | 1690 | 1089 | 601 | 2016-11-07 | dense series — full-depth re-run |
| `breakeven-tilt` (B4) | daily | 2016-09-23 → 2026-10-30 | 2525 | 2514 | 1174 | 264 | 910 | 2016-11-08 | dense series — full-depth re-run |

**The effective table:** cftc-gold-positioning never fires, and us-japan-10y-gap / gold-silver fire only near their sparse observation dates — the re-run era's real voter pool averaged **10.0 firing voters per window** (of 20). Every denominator is stated; nothing is silently interpolated.

## B1 — the historical re-run (frozen clock)

Windows: **2514** (2016-11-02 → 2026-10-31, every gold trading day). Label distribution: headwind ×634, tailwind ×966, strong-tailwind ×274, balanced ×244, strong-headwind ×396.
Average firing voters 10.0 · average netScore +0.42 · netScore range -8 to 9.

**The D-6 cross-fill, counted aloud:** 0 fill day(s) applied across all 2514 windows. The stored series are dense (each healthy rung re-fetches the full decade window), so the historical re-run sees ~0 fills — the audit's healthy-day expectation (GOLD_FRED_GAPFILL_SPEC §5 G1a). The fill's production value is freshness-rescue on TRANSIENT degraded days, which a dense stored corpus cannot replay — stated, not hidden.

Month-end traces (the label + firing counts the frozen table produced):

| Window day | Label | Net | Firing (T/H) | Lane readings |
|---|---|---|---|---|
| 2016-11-30 | headwind | -5 | 11 (3/8) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:hot |
| 2016-12-30 | strong-headwind | -2 | 4 (1/3) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:unreadable |
| 2017-01-31 | strong-tailwind | +3 | 3 (3/0) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:hot |
| 2017-02-28 | tailwind | +2 | 2 (2/0) | borrowing-costs:relief · dollar:unreadable · stress:unreadable · inflation:hot |
| 2017-03-31 | strong-tailwind | +3 | 5 (4/1) | borrowing-costs:mixed · dollar:stress · stress:unreadable · inflation:hot |
| 2017-04-28 | headwind | -2 | 8 (3/5) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:cool |
| 2017-05-31 | tailwind | +2 | 10 (6/4) | borrowing-costs:relief · dollar:stress · stress:calm · inflation:cool |
| 2017-06-30 | balanced | +0 | 10 (5/5) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:cool |
| 2017-07-31 | tailwind | +1 | 9 (5/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:hot |
| 2017-08-31 | strong-tailwind | +7 | 9 (8/1) | borrowing-costs:relief · dollar:stress · stress:calm · inflation:unreadable |
| 2017-09-29 | headwind | -1 | 7 (3/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:unreadable |
| 2017-10-31 | headwind | -2 | 6 (2/4) | borrowing-costs:relief · dollar:strong · stress:calm · inflation:unreadable |
| 2017-11-30 | balanced | +0 | 8 (4/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:unreadable |
| 2017-12-29 | tailwind | +3 | 7 (5/2) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:unreadable |
| 2018-01-31 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:stress · stress:mixed · inflation:hot |
| 2018-02-28 | headwind | -1 | 11 (5/6) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:hot |
| 2018-03-29 | strong-tailwind | +7 | 11 (9/2) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:hot |
| 2018-04-30 | balanced | +0 | 12 (6/6) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2018-05-31 | headwind | -2 | 10 (4/6) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:cool |
| 2018-06-29 | tailwind | +1 | 7 (4/3) | borrowing-costs:mixed · dollar:unreadable · stress:elevated · inflation:unreadable |
| 2018-07-31 | balanced | +0 | 8 (4/4) | borrowing-costs:mixed · dollar:unreadable · stress:unreadable · inflation:hot |
| 2018-08-31 | headwind | -2 | 8 (3/5) | borrowing-costs:mixed · dollar:unreadable · stress:calm · inflation:unreadable |
| 2018-09-28 | headwind | -3 | 11 (4/7) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:hot |
| 2018-10-31 | headwind | -1 | 9 (4/5) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:unreadable |
| 2018-11-30 | balanced | +0 | 10 (5/5) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:unreadable |
| 2018-12-31 | tailwind | +5 | 11 (8/3) | borrowing-costs:mixed · dollar:unreadable · stress:elevated · inflation:cool |
| 2019-01-31 | strong-tailwind | +5 | 7 (6/1) | borrowing-costs:mixed · dollar:stress · stress:unreadable · inflation:unreadable |
| 2019-02-28 | strong-tailwind | +4 | 8 (6/2) | borrowing-costs:mixed · dollar:unreadable · stress:calm · inflation:hot |
| 2019-03-29 | tailwind | +4 | 10 (7/3) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:unreadable |
| 2019-04-30 | tailwind | +2 | 6 (4/2) | borrowing-costs:mixed · dollar:unreadable · stress:calm · inflation:unreadable |
| 2019-05-31 | tailwind | +4 | 14 (9/5) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:cool |
| 2019-06-28 | tailwind | +4 | 12 (8/4) | borrowing-costs:mixed · dollar:stress · stress:unreadable · inflation:cool |
| 2019-07-31 | strong-tailwind | +7 | 11 (9/2) | borrowing-costs:relief · dollar:mixed · stress:unreadable · inflation:mixed |
| 2019-08-30 | strong-tailwind | +7 | 13 (10/3) | borrowing-costs:relief · dollar:mixed · stress:elevated · inflation:cool |
| 2019-09-30 | tailwind | +1 | 13 (7/6) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:cool |
| 2019-10-31 | strong-tailwind | +6 | 10 (8/2) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:cool |
| 2019-11-29 | tailwind | +2 | 10 (6/4) | borrowing-costs:relief · dollar:strong · stress:unreadable · inflation:cool |
| 2019-12-31 | strong-tailwind | +6 | 8 (7/1) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:mixed |
| 2020-01-31 | strong-tailwind | +6 | 12 (9/3) | borrowing-costs:relief · dollar:strong · stress:mixed · inflation:mixed |
| 2020-02-28 | strong-tailwind | +7 | 11 (9/2) | borrowing-costs:relief · dollar:strong · stress:elevated · inflation:cool |
| 2020-03-31 | tailwind | +1 | 13 (7/6) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:cool |
| 2020-04-30 | tailwind | +6 | 14 (10/4) | borrowing-costs:relief · dollar:mixed · stress:elevated · inflation:mixed |
| 2020-05-29 | tailwind | +6 | 14 (10/4) | borrowing-costs:relief · dollar:stress · stress:elevated · inflation:cool |
| 2020-06-30 | tailwind | +4 | 12 (8/4) | borrowing-costs:relief · dollar:unreadable · stress:elevated · inflation:cool |
| 2020-07-31 | strong-tailwind | +6 | 12 (9/3) | borrowing-costs:relief · dollar:stress · stress:elevated · inflation:mixed |
| 2020-08-31 | tailwind | +4 | 12 (8/4) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:mixed |
| 2020-09-30 | tailwind | +1 | 13 (7/6) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:cool |
| 2020-10-30 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:cool |
| 2020-11-30 | tailwind | +4 | 10 (7/3) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:cool |
| 2020-12-31 | tailwind | +5 | 11 (8/3) | borrowing-costs:relief · dollar:stress · stress:calm · inflation:mixed |
| 2021-01-29 | tailwind | +3 | 11 (7/4) | borrowing-costs:mixed · dollar:stress · stress:mixed · inflation:cool |
| 2021-02-26 | balanced | +0 | 10 (5/5) | borrowing-costs:mixed · dollar:stress · stress:mixed · inflation:unreadable |
| 2021-03-31 | balanced | +0 | 12 (6/6) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:hot |
| 2021-04-30 | tailwind | +3 | 11 (7/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:hot |
| 2021-05-28 | tailwind | +4 | 12 (8/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:hot |
| 2021-06-30 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:mixed |
| 2021-07-30 | strong-tailwind | +7 | 13 (10/3) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:hot |
| 2021-08-31 | tailwind | +2 | 10 (6/4) | borrowing-costs:mixed · dollar:unreadable · stress:calm · inflation:hot |
| 2021-09-30 | balanced | +0 | 14 (7/7) | borrowing-costs:mixed · dollar:strong · stress:mixed · inflation:hot |
| 2021-10-29 | tailwind | +2 | 10 (6/4) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:hot |
| 2021-11-30 | strong-tailwind | +7 | 11 (9/2) | borrowing-costs:relief · dollar:strong · stress:elevated · inflation:hot |
| 2021-12-31 | tailwind | +4 | 10 (7/3) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:hot |
| 2022-01-31 | headwind | -1 | 13 (6/7) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-02-28 | strong-tailwind | +6 | 12 (9/3) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2022-03-31 | tailwind | +1 | 13 (7/6) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2022-04-29 | tailwind | +3 | 15 (9/6) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2022-05-31 | tailwind | +1 | 15 (8/7) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:mixed |
| 2022-06-30 | tailwind | +1 | 15 (8/7) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-07-29 | tailwind | +5 | 13 (9/4) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2022-08-31 | balanced | +0 | 16 (8/8) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2022-09-30 | headwind | -2 | 16 (7/9) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-10-31 | tailwind | +2 | 16 (9/7) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:hot |
| 2022-11-30 | tailwind | +4 | 14 (9/5) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:mixed |
| 2022-12-30 | tailwind | +2 | 14 (8/6) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:hot |
| 2023-01-31 | tailwind | +6 | 14 (10/4) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:hot |
| 2023-02-28 | headwind | -1 | 13 (6/7) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2023-03-31 | tailwind | +6 | 14 (10/4) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:hot |
| 2023-04-28 | headwind | -3 | 13 (5/8) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2023-05-31 | headwind | -1 | 13 (6/7) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2023-06-30 | headwind | -1 | 13 (6/7) | borrowing-costs:mixed · dollar:mixed · stress:mixed · inflation:hot |
| 2023-07-31 | headwind | -1 | 13 (6/7) | borrowing-costs:mixed · dollar:mixed · stress:mixed · inflation:hot |
| 2023-08-31 | strong-headwind | -6 | 12 (3/9) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:cool |
| 2023-09-29 | headwind | -3 | 11 (4/7) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:hot |
| 2023-10-31 | headwind | -2 | 12 (5/7) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2023-11-30 | balanced | +0 | 12 (6/6) | borrowing-costs:mixed · dollar:mixed · stress:calm · inflation:cool |
| 2023-12-29 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:mixed · stress:calm · inflation:unreadable |
| 2024-01-31 | headwind | -4 | 12 (4/8) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:hot |
| 2024-02-29 | headwind | -5 | 11 (3/8) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:unreadable |
| 2024-03-28 | headwind | -3 | 11 (4/7) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:unreadable |
| 2024-04-30 | headwind | -4 | 12 (4/8) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:hot |
| 2024-05-31 | headwind | -2 | 12 (5/7) | borrowing-costs:mixed · dollar:mixed · stress:calm · inflation:hot |
| 2024-06-28 | headwind | -1 | 13 (6/7) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:hot |
| 2024-07-31 | tailwind | +2 | 10 (6/4) | borrowing-costs:mixed · dollar:mixed · stress:unreadable · inflation:hot |
| 2024-08-30 | balanced | +0 | 10 (5/5) | borrowing-costs:mixed · dollar:mixed · stress:unreadable · inflation:hot |
| 2024-09-30 | balanced | +0 | 10 (5/5) | borrowing-costs:mixed · dollar:mixed · stress:unreadable · inflation:hot |
| 2024-10-31 | strong-headwind | -6 | 8 (1/7) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:unreadable |
| 2024-11-29 | strong-headwind | -6 | 8 (1/7) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:cool |
| 2024-12-31 | strong-headwind | -4 | 6 (1/5) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:hot |
| 2025-01-31 | strong-headwind | -5 | 7 (1/6) | borrowing-costs:tight · dollar:strong · stress:calm · inflation:hot |
| 2025-02-28 | headwind | -1 | 5 (2/3) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:unreadable |
| 2025-03-31 | headwind | -2 | 6 (2/4) | borrowing-costs:mixed · dollar:mixed · stress:unreadable · inflation:unreadable |
| 2025-04-30 | balanced | +0 | 6 (3/3) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:unreadable |
| 2025-05-30 | headwind | -1 | 5 (2/3) | borrowing-costs:mixed · dollar:unreadable · stress:unreadable · inflation:hot |
| 2025-06-30 | strong-tailwind | +3 | 5 (4/1) | borrowing-costs:mixed · dollar:stress · stress:unreadable · inflation:unreadable |
| 2025-07-31 | strong-headwind | -5 | 7 (1/6) | borrowing-costs:tight · dollar:strong · stress:calm · inflation:hot |
| 2025-08-29 | balanced | +0 | 6 (3/3) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:hot |
| 2025-09-30 | headwind | -2 | 6 (2/4) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:hot |
| 2025-10-31 | strong-headwind | -6 | 6 (0/6) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:cool |
| 2025-11-28 | headwind | -2 | 2 (0/2) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:unreadable |
| 2025-12-31 | strong-headwind | -4 | 4 (0/4) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:unreadable |
| 2026-01-30 | strong-headwind | -3 | 5 (1/4) | borrowing-costs:tight · dollar:mixed · stress:unreadable · inflation:unreadable |
| 2026-02-27 | headwind | -2 | 6 (2/4) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:cool |
| 2026-03-31 | strong-headwind | -4 | 6 (1/5) | borrowing-costs:tight · dollar:strong · stress:elevated · inflation:unreadable |
| 2026-04-30 | headwind | -2 | 6 (2/4) | borrowing-costs:tight · dollar:mixed · stress:unreadable · inflation:hot |
| 2026-05-29 | strong-headwind | -4 | 4 (0/4) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:unreadable |
| 2026-06-30 | strong-headwind | -5 | 5 (0/5) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:unreadable |
| 2026-07-31 | headwind | -3 | 7 (2/5) | borrowing-costs:tight · dollar:mixed · stress:unreadable · inflation:hot |
| 2026-08-31 | strong-headwind | -5 | 7 (1/6) | borrowing-costs:tight · dollar:strong · stress:calm · inflation:hot |
| 2026-09-30 | strong-headwind | -6 | 8 (1/7) | borrowing-costs:tight · dollar:strong · stress:calm · inflation:hot |
| 2026-10-31 | headwind | -2 | 6 (2/4) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:cool |


## B2 — the realized-move join (5 / 20 / 60 trading days)

### Horizon 5 trading days (flat band ±0.47%; ≈ 7 calendar days)

Windows with a joinable forward return: **2509** of 2514 (the last 5 trading days have no forward observation — excluded, n stated). Mature-base subsample (≥ 2021-09-23): **1281** windows.

Sign-agreement (netScore sign vs forward-return sign, both readable — a model lean AND a move beyond the band): **952/1842 = 51.7%** (mature base: 456/975 = 46.8%). A coin is 50%; the ALL-windows move split is up 45.7% · flat 19.3% · down 35.1%.

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 583 [47%] | 242 [20%] | 415 [33%] | 1240 | 0.26% | 0.35% |
| **mixed** | 88 [36%] | 60 [25%] | 96 [39%] | 244 | 0.04% | 0.09% |
| **headwind** | 475 [46%] | 181 [18%] | 369 [36%] | 1025 | 0.29% | 0.28% |
| *all windows* | 1146 | 483 | 880 | 2509 | 0.25% | 0.28% |

Confusion table — mature-base windows (≥ 5 years of percentile base):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 180 [47%] | 67 [17%] | 139 [36%] | 386 | 0.30% | 0.32% |
| **mixed** | 53 [43%] | 22 [18%] | 49 [40%] | 124 | 0.23% | 0.21% |
| **headwind** | 380 [49%] | 115 [15%] | 276 [36%] | 771 | 0.40% | 0.39% |
| *all windows* | 613 | 204 | 464 | 1281 | 0.36% | 0.35% |

Label-conditional forward returns (the full 5-step vocabulary, every row kept):

| Label | n | mean | median |
|---|---|---|---|
| strong-tailwind | 274 | 0.32% | 0.36% |
| tailwind | 966 | 0.24% | 0.34% |
| balanced | 244 | 0.04% | 0.09% |
| headwind | 629 | 0.30% | 0.22% |
| strong-headwind | 396 | 0.28% | 0.45% |
| null | 0 | —% | —% |

### Horizon 20 trading days (flat band ±1.87%; ≈ 28 calendar days)

Windows with a joinable forward return: **2494** of 2514 (the last 20 trading days have no forward observation — excluded, n stated). Mature-base subsample (≥ 2021-09-23): **1266** windows.

Sign-agreement (netScore sign vs forward-return sign, both readable — a model lean AND a move beyond the band): **663/1415 = 46.9%** (mature base: 330/776 = 42.5%). A coin is 50%; the ALL-windows move split is up 39.5% · flat 37.1% · down 23.5%.

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 452 [36%] | 474 [38%] | 314 [25%] | 1240 | 0.84% | 0.55% |
| **mixed** | 94 [39%] | 90 [37%] | 60 [25%] | 244 | 0.65% | 0.44% |
| **headwind** | 438 [43%] | 361 [36%] | 211 [21%] | 1010 | 1.44% | 1.06% |
| *all windows* | 984 | 925 | 585 | 2494 | 1.06% | 0.69% |

Confusion table — mature-base windows (≥ 5 years of percentile base):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 159 [41%] | 129 [33%] | 98 [25%] | 386 | 1.09% | 1.30% |
| **mixed** | 58 [47%] | 38 [31%] | 28 [23%] | 124 | 1.07% | 1.52% |
| **headwind** | 348 [46%] | 237 [31%] | 171 [23%] | 756 | 1.72% | 1.35% |
| *all windows* | 565 | 404 | 297 | 1266 | 1.46% | 1.35% |

Label-conditional forward returns (the full 5-step vocabulary, every row kept):

| Label | n | mean | median |
|---|---|---|---|
| strong-tailwind | 274 | 0.27% | 0.17% |
| tailwind | 966 | 1.00% | 0.70% |
| balanced | 244 | 0.65% | 0.44% |
| headwind | 628 | 1.36% | 0.93% |
| strong-headwind | 382 | 1.58% | 1.77% |
| null | 0 | —% | —% |

### Horizon 60 trading days (flat band ±5.60%; ≈ 84 calendar days)

Windows with a joinable forward return: **2454** of 2514 (the last 60 trading days have no forward observation — excluded, n stated). Mature-base subsample (≥ 2021-09-23): **1226** windows.

Sign-agreement (netScore sign vs forward-return sign, both readable — a model lean AND a move beyond the band): **446/1016 = 43.9%** (mature base: 203/620 = 32.7%). A coin is 50%; the ALL-windows move split is up 35.0% · flat 54.5% · down 10.5%.

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 350 [28%] | 748 [60%] | 142 [11%] | 1240 | 2.19% | 1.60% |
| **mixed** | 80 [33%] | 144 [59%] | 20 [8%] | 244 | 3.25% | 2.98% |
| **headwind** | 428 [44%] | 446 [46%] | 96 [10%] | 970 | 5.16% | 4.54% |
| *all windows* | 858 | 1338 | 258 | 2454 | 3.47% | 2.94% |

Confusion table — mature-base windows (≥ 5 years of percentile base):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 137 [35%] | 187 [48%] | 62 [16%] | 386 | 2.85% | 2.82% |
| **mixed** | 45 [36%] | 68 [55%] | 11 [9%] | 124 | 3.89% | 3.28% |
| **headwind** | 355 [50%] | 295 [41%] | 66 [9%] | 716 | 5.94% | 5.52% |
| *all windows* | 537 | 550 | 139 | 1226 | 4.76% | 4.40% |

Label-conditional forward returns (the full 5-step vocabulary, every row kept):

| Label | n | mean | median |
|---|---|---|---|
| strong-tailwind | 274 | 1.36% | 0.71% |
| tailwind | 966 | 2.42% | 1.77% |
| balanced | 244 | 3.25% | 2.98% |
| headwind | 616 | 4.97% | 4.52% |
| strong-headwind | 354 | 5.50% | 4.63% |
| null | 0 | —% | —% |

## B2 (archive era) — the live out-of-sample slice, tiny-n, stated as such

The 16 archived days re-scored from the readings the rungs actually stamped (the SPA's own re-derivation — the honest as-rung state, including the rung-time data lags the historical re-run cannot replay):

| Archive day | netScore | label | 5td return | 5td bucket |
|---|---|---|---|---|
| 2026-10-15 | -6 | strong-headwind | -2.63% | down |
| 2026-10-16 | -6 | strong-headwind | -4.14% | down |
| 2026-10-17 | -6 | strong-headwind | -4.14% | down |
| 2026-10-18 | -6 | strong-headwind | -4.14% | down |
| 2026-10-19 | -6 | strong-headwind | -2.93% | down |
| 2026-10-21 | -4 | strong-headwind | -2.37% | down |
| 2026-10-22 | -2 | headwind | -0.71% | down |
| 2026-10-23 | -6 | strong-headwind | -2.72% | down |
| 2026-10-24 | -6 | strong-headwind | -2.72% | down |
| 2026-10-25 | -6 | strong-headwind | -2.72% | down |
| 2026-10-26 | -6 | strong-headwind | -4.01% | down |
| 2026-10-27 | -6 | strong-headwind | — (past the series end) | — |
| 2026-10-28 | -2 | headwind | — (past the series end) | — |
| 2026-10-29 | -2 | headwind | — (past the series end) | — |
| 2026-10-30 | -3 | headwind | — (past the series end) | — |
| 2026-10-31 | -2 | headwind | — (past the series end) | — |

Joinable at 5td: **11** of 16 days (the last 5 trading days of the corpus have no forward observation). Sign-agreement: 11/11 = 100%. At 20td and 60td: **0 joinable days** (the archive era began 2026-10-15 — no archive day has 20 trading days of forward gold inside a corpus ending 2026-10-31). **n is too small for any claim — this slice verifies the live path produces the same shape as the re-run, nothing more.**

`goldSummary` as the rungs stamped it (the wire field) exists on 2026-10-31 — netScore -2, label headwind; the re-derivation above produces netScore -2, label headwind. The two agree, as the S1 contract (one pure function, ingest and SPA, no drift) requires.

## B4 — the tilt-augmented 21-voter variant (the D-5 evidence)

The 21-voter table (`HARNESS_GOLD_VOTERS_21` — the frozen 20 + `breakeven-tilt` in the inflation lane, polarity +1, evaluated by the SAME shared evaluator: level-leg only, like every voter without a 30-day move threshold) over the same 2514 windows:

- The tilt voter fired in **1174** of 2514 windows (46.7%): tailwind 264 · headwind 910.
- Label distribution: headwind ×741, tailwind ×907, strong-tailwind ×226, balanced ×236, strong-headwind ×404.
- Net-score delta (21-voter − 20-voter): -1 ×910, +0 ×1340, +1 ×264.
- Label-bucket flips (tailwind/mixed/headwind changing side): **256** windows (10.2%).

- Horizon 5td: sign-agreement 958/1840 = 52.1% (20-voter: 952/1842 = 51.7%) · tailwind mean return 0.30% vs 0.26% · headwind mean return 0.26% vs 0.29% (n: 1133/1240 tailwind, 1140/1025 headwind).
- Horizon 20td: sign-agreement 680/1429 = 47.6% (20-voter: 663/1415 = 46.9%) · tailwind mean return 1.02% vs 0.84% · headwind mean return 1.30% vs 1.44% (n: 1133/1240 tailwind, 1125/1010 headwind).
- Horizon 60td: sign-agreement 452/1029 = 43.9% (20-voter: 446/1016 = 43.9%) · tailwind mean return 2.50% vs 2.19% · headwind mean return 4.74% vs 5.16% (n: 1133/1240 tailwind, 1085/970 headwind).

**5td, 21-voter confusion table (±0.47% band):**

| Model ↓ / Move → | up | flat | down | n |
|---|---|---|---|---|
| **tailwind** | 542 | 224 | 367 | 1133 |
| **mixed** | 89 | 50 | 97 | 236 |
| **headwind** | 515 | 209 | 416 | 1140 |

**20td, 21-voter confusion table (±1.87% band):**

| Model ↓ / Move → | up | flat | down | n |
|---|---|---|---|---|
| **tailwind** | 430 | 436 | 267 | 1133 |
| **mixed** | 72 | 96 | 68 | 236 |
| **headwind** | 482 | 393 | 250 | 1125 |

**60td, 21-voter confusion table (±5.60% band):**

| Model ↓ / Move → | up | flat | down | n |
|---|---|---|---|---|
| **tailwind** | 336 | 677 | 120 | 1133 |
| **mixed** | 65 | 149 | 22 | 236 |
| **headwind** | 457 | 512 | 116 | 1085 |

**The honest delta:** the tilt fired in 46.7% of windows (mostly headwind: 910 of 1174 — the tilt sat at decade lows, i.e. fading, for most of the corpus) and moved the label bucket in 10.2%. The measured associations barely moved: 5td +0.4pp · 20td +0.7pp · 60td +0.0pp — **no material difference in the measured association** — the 21-voter variant is not better or worse on this corpus, only noisier in its label vocabulary. Whether promotion is worth it is the owner's D-5 call; the evidence here is the delta, not a recommendation.

Archive era: the tilt's reading exists only from the 2026-10-31 archive (it shipped in S3) — the 21-voter archive slice has n ≤ 1 and is NOT a meaningful table; stated rather than computed into significance.

## Honesty rules (B3) — the known gaps, stated

1. **Every cell carries n.** All 9 confusion cells per horizon per table-set are reported (all-windows AND mature-base), plus the 6-row label-conditional tables and both models' sign-agreements — nothing picked.
2. **The corpus depth is ~10.1 years, not decades.** The stored histories begin 2016-09-23 (the FRED family's stage window). Windows before ~2021-09-23 ride percentile bases shorter than 5 years — on a young base a value near the running max reads "high" more easily, which is exactly why the mature-base tables sit BESIDE the all-windows tables rather than replacing them.
3. **Three voters are structurally thin in the re-run era:** cftc-gold-positioning (1 stored point — never fires), us-japan-10y-gap (97 sparse points — jgb-10y was monthly until the 2026-10-26 MOF upgrade; the reading is stale most windows), gold-silver (monthly percentile history + daily seed points only since 2026-10-08). The stress lane therefore ran 4-voter — stated, not interpolated.
4. **The cross-fill cannot be replayed historically** (0 fills across 2514 windows): the stored series are the accumulated dense fetches; the fill earns its keep on TRANSIENT degraded days the stored corpus no longer shows. Its production effect is freshness, not a historical score change.
5. **The realized series is one venue, two provenances:** the backfill is the Yahoo GC=F ~10-year daily record; the tail points are the accumulated live-price seed appends (gold-api spot at append time). The join treats them identically; the mix is recorded here.
6. **Multiple testing:** 3 horizons × 3 buckets × 2 table-sets × 2 models + the archive slice is ~110 reported numbers; with these n's, ±2–3 percentage-point wobbles are noise. The conclusion below only claims what a stated-in-advance rule can see — the tables themselves make no claim.
7. **The archive era is plumbing, not power:** 16 days, 11 joinable at 5td, 0 at 20td/60td. It verifies the live path's shape; it cannot verify an edge.
8. **The asOf-watch (S3's known gap):** day 1 in lockstep; days 2–3 pending the 11-01/11-02 rungs — the corpus ends 2026-10-31 at the S4 run time. Carried to spec §5.

## Conclusion — would this have been visible ex-ante?

The rule was fixed before the run: a directional edge is claimed ONLY if, on the MATURE-BASE subsample, the sign-agreement at some horizon departs from 50% by more than 2 binomial standard errors (2 × √(0.25/n)) AND the tailwind-minus-headwind mean-return spread keeps its sign at all three horizons. Anything else reads as "no measurable edge at these horizons over this corpus" — the outcome the spec explicitly permits.

The mature-base measurements (2021-09-23 → 2026-10-31):

- 5td: sign-agreement 456/975 = 46.8% (2-SE band around 50%: ±3.2% — DEPARTS BELOW 50%) · tailwind−headwind mean spread -0.10%
- 20td: sign-agreement 330/776 = 42.5% (2-SE band around 50%: ±3.6% — DEPARTS BELOW 50%) · tailwind−headwind mean spread -0.63%
- 60td: sign-agreement 203/620 = 32.7% (2-SE band around 50%: ±4.0% — DEPARTS BELOW 50%) · tailwind−headwind mean spread -3.09%

By the stated rule: **no edge in the table's own direction — the measurable association runs the OTHER way over this corpus.** Every horizon's sign-agreement departs BELOW 50% and the tailwind-minus-headwind mean spread is negative at every horizon: over 2021-09-23 → 2026-10-31, headwind labels preceded LARGER forward rises than tailwind labels did (the 60td spread is -3.09%: headwind windows rose 5.94% on average against tailwind's 2.85%, mature base). This decade's gold advance ran THROUGH tight real rates and a strong dollar — the classical headwinds — so a conditions-reading table built on those relationships reads persistently against the move it lived through. The panel's caption ("conditions, not advice") is not just a disclaimer here; it is the operative description: the table reads the macro regime, and in this regime the regime's direction and gold's direction diverged.

The ex-ante test, answered honestly: the 20-voter table and its thresholds were authored from classical driver relationships BEFORE this harness computed anything (S1, 2026-10-31; zero threshold changes since), so the numbers above are what an observer with the same table and the same stored histories would have measured at each window — no fitted parameters, no selection. The honest caveat runs the other way: the FLAT BAND, the three horizons and the bucket folds were chosen by the harness author in this session; the stated-in-advance rule above is the guard against that freedom, and the mature-base/all-windows split is reported so the short-base effect is visible, not hidden.

