# Gold-score backtest — the 2026-11-03 re-check re-run (the promoted 21-voter table over the grown corpus)

Generated from the recorded KV corpus (`packages/insights/fixtures/gold-backtest-corpus.json`, recorded 2026-11-03T04:43:54.969Z read-only via `pnpm --filter @currena/insights gold-corpus-dump` — the 2026-11-03 re-check refresh this report records: 19 archive days, the grown corpus the missed 2026-11-02 armed check was to carry; the stage blob it froze was written 2026-11-03T04:35:17.936Z, and the two FX voters' histories were sourced read-only from their own `insights:hist:*` keys — the venue note below). No live sites are touched; the harness reads recorded data only, at a frozen clock (no wall-clock reads anywhere). The voter table re-run here is the PROMOTED production table (Session 6, D-5: 21 voters — the S4-frozen 20 carried beside it as the lineage baseline); the thresholds and labels are unchanged from S1. NOTHING here changes production. Every cell carries its n.

## Method

- Engine: the PRODUCTION 21-voter table (`gold-score.ts` `GOLD_LANE_VOTERS` — the D-5 promotion, Session 6: `breakeven-tilt` in the inflation lane, polarity +1, level-leg only) evaluated through the shared signals evaluator (`connections.ts` `evalLeg` — a 30-day direction beyond the per-leg minimum move, else the decade-extreme level), the same `computeReading` percentile/change/stale math the ingest runs, and `scoreOverVoters` — a harness-local parameterized copy of the score arithmetic **pinned equal to the production engine by test** (`gold-backtest-core.test.ts`); the S4-frozen 20-voter table (`HARNESS_GOLD_VOTERS_20`, pinned to production-minus-the-tilt) rides beside it as the lineage baseline.
- Frozen clock: every window passes its own date (`<window-day>T04:10:00.000Z`, the main rung’s time-of-day); nothing reads the wall clock.
- No lookahead: every series is truncated at the window day BEFORE any scoring math (`seriesUpTo`); percentiles are computed strictly from observations at or before the as-of date. Truncated-vs-full equality and a future-spike mutation test pin this.
- The D-6 cross-fill is applied to the real-yield-10y SCORING INPUT exactly as in production (`realYieldScoringSeries` over the truncated pure DFII10 + the DGS10/T10YIE legs, the same decade window, 2003 floor, 4dp quantization and 5% cap), and the fill count is reported aloud below.
- Windows: EVERY gold trading day across the stored-history span (the realized series' own dates — the join needs no interpolation): 2016-11-07 → 2026-11-03, **2512 windows** (the daily grid; the compute budget allowed it).
- Realized moves: forward N-TRADING-DAY returns from `insights:hist:gold-usd` (the spec's B2 venue; 2512 observations, 2016-11-07 → 2026-11-03), EXACTLY N observations ahead — never interpolated. Horizons: 5 / 20 / 60 trading days.
- The flat band: the engine's OWN reality bar (±2% per 30 calendar days, `GOLD_REALITY_SPEED_PCT`) linearly scaled to each horizon's calendar length (5 trading days ≈ 7 calendar days → **±0.47%**; 20td ≈ 28d → **±1.87%**; 60td ≈ 84d → **±5.60%**). One constant, one scaling rule — no per-horizon tuning.
- The label axis folds the 5-step vocabulary to 3 buckets (tailwind / mixed / headwind; **mixed = balanced ∪ nothing-firing**); the move axis is up / flat / down against the band.
- Multiple testing is named: 3 horizons × 3 label buckets is already 9 cells per table — ALL are reported, none picked. One sensitivity split is stated (the mature-base subsample: windows ≥ 2021-09-23, i.e. a percentile base of at least ~5 years for the daily voters) and reported BESIDE the all-windows tables, never selected from.
- Archive era: the 19 archived days are re-scored from the readings the rungs ACTUALLY stamped (the live out-of-sample slice — the SPA's own re-derivation path), joined to the same forward returns. Tiny-n by construction; stated as such.

## The corpus (the §0 verification, at harness run time)

- Live API `https://currena.ir/api/insights` (checked at this re-check's session start, 2026-11-03 ~04:37 UTC): `goldSummary` PRESENT (netScore −1, label `headwind`, 5 firing — the 04:35 rung, stamped by the PROMOTED engine; borrowing-costs mixed 2/2 · dollar unreadable · stress unreadable · inflation cool 0/1) and `breakeven-tilt` present among the 161 readings (−0.20, asOf 2026-11-02, percentile10y 0.234 — mid-range, silent today). `/api/health` answered `ok:true` (kv ok, 2026-11-03T04:37:30Z). These are the re-run's "today" anchors.
- Read-only KV: **19 full archive days** (`insights:archive:v1:*`, 2026-10-15 → 2026-11-03; 2026-10-20 absent — a rung outage day, the only gap). The newest (2026-11-03) carries `goldSummary` (present on: 2026-10-31, 2026-11-01, 2026-11-02, 2026-11-03 — the field shipped with S2.1/S3 and the 10-31 rung was the first to stamp it).
- The stored-history span: the daily FRED family's stage series start 2016-09-26 — the harness's depth is ~10.1 years, exactly the depth production's percentile window sees.
- Venue note: the stage blob's gold-usd copy carries 2515 points (2016-11-02 → 2026-11-03); the realized-move series (`insights:hist:gold-usd`, the spec's venue) carries 2512 (2016-11-07 → 2026-11-03) — 3 points fewer at the head; both end 2026-11-03. The join uses the hist key; the difference is recorded, not silently reconciled. The KV history is a rolling ~10-year window: this refresh trimmed the head (2016-11-02…11-04 left the window) and dropped the 2026-10-31 Saturday seed point the S6 corpus carried at its tail while gaining 2026-11-02/11-03 — the net window count MOVED DOWN by 2 against the S6 run (2,514 → 2512), recorded, not softened. The FX voters' histories (dollar-basket, usdjpy) no longer ride the stage blob — the dump sourced them read-only from `insights:hist:<id>` (the gap-closure S5/S6 ingest rounds moved them); their values on common days are identical to the S6 corpus.

The asOf-watch (the S3 known-gap — did the trio keep moving WITH the decade group after the D-4 split?), newest 6 archive days:

| archive day | us10y | us30y | real-yield-10y | T5YIFR (decade group) | t5yie | trio status |
|---|---|---|---|---|---|---|
| 2026-10-29 | 2026-10-27 | 2026-10-27 | 2026-10-27 | 2026-10-28 | 2026-10-28 | warning ×3 |
| 2026-10-30 | 2026-10-28 | 2026-10-28 | 2026-10-28 | 2026-10-29 | 2026-10-29 | warning ×3 |
| 2026-10-31 | 2026-10-29 | 2026-10-29 | 2026-10-29 | 2026-10-30 | 2026-10-30 | warning ×3 |
| 2026-11-01 | 2026-10-29 | 2026-10-29 | 2026-10-29 | 2026-10-30 | 2026-10-30 | warning ×3 |
| 2026-11-02 | 2026-10-29 | 2026-10-29 | 2026-10-29 | 2026-10-30 | 2026-10-30 | warning ×3 |
| 2026-11-03 | 2026-10-30 | 2026-10-30 | 2026-10-30 | 2026-11-02 | 2026-11-02 | warning ×3 |

**Verdict (days 2–3, measured from the archive rows):** 2026-11-01, 2026-11-02, 2026-11-03 — the rungs after the S6 close. The trio-vs-decade-group offset in gold trading days at each of the last 6 archive days: 2026-10-29: offset 1 · 2026-10-30: offset 1 · 2026-10-31: offset 1 · 2026-11-01: offset 1 · 2026-11-02: offset 1 · 2026-11-03: offset 1. Every post-S6 rung holds the offset at EXACTLY 1 trading day — both groups HELD over the 11-01 weekend and at the 11-02 Monday rung, then both advanced exactly +1 trading day at the 11-03 rung (trio 2026-10-29 → 2026-10-30; decade group 2026-10-30 → 2026-11-02; values moved too: us10y 4.98 → 4.94). That is LOCKSTEP per GOLD_RECHECK_SPEC §4 (weekends and same-day holds are not divergence): **the watch closes as validated-by-watch — the honest wording, still not "proven"**. Days 4+ ride future re-checks.

## Coverage — the 21 voters over the stored histories

| Voter | Cadence | Span | Obs | Readable windows | Firing windows | Tailwind | Headwind | First firing | Gap notes |
|---|---|---|---|---|---|---|---|---|---|
| `real-yield-10y` | daily | 2016-09-26 → 2026-10-30 | 2524 | 2512 | 2277 | 980 | 1297 | 2016-11-08 | dense series — full-depth re-run |
| `us10y` | daily | 2016-09-26 → 2026-10-30 | 2524 | 2512 | 2081 | 756 | 1325 | 2016-11-08 | dense series — full-depth re-run |
| `us30y` | daily | 2016-09-26 → 2026-10-30 | 2524 | 2512 | 1828 | 525 | 1303 | 2016-11-08 | dense series — full-depth re-run |
| `fed-target` | daily | 2016-09-26 → 2026-11-02 | 3690 | 2512 | 1585 | 531 | 1054 | 2016-11-07 | forward-filled daily series (per-decision levels) — production semantics inherited |
| `fed-expectations` | daily | 2016-09-26 → 2026-10-30 | 2524 | 2512 | 1464 | 1008 | 456 | 2016-11-08 | dense series — full-depth re-run |
| `ecb-dfr` | daily | 2016-09-26 → 2026-11-03 | 3691 | 2512 | 2040 | 1436 | 604 | 2016-11-07 | forward-filled daily series (per-decision levels) — the percentile base weights long-held rates by calendar days; production semantics inherited |
| `yield-curve-10y2y` | daily | 2016-09-26 → 2026-11-02 | 2525 | 2512 | 1375 | 1143 | 232 | 2016-11-08 | dense series — full-depth re-run |
| `yield-curve-10y3m` | daily | 2016-09-26 → 2026-11-02 | 2525 | 2512 | 1425 | 1126 | 299 | 2016-11-09 | dense series — full-depth re-run |
| `dollar-basket` | daily | 2016-11-04 → 2026-11-02 | 2557 | 2512 | 1868 | 903 | 965 | 2016-12-05 | dense series — full-depth re-run |
| `usdjpy` | daily | 2016-11-04 → 2026-11-02 | 2557 | 2512 | 1774 | 499 | 1275 | 2016-12-16 | dense series — full-depth re-run |
| `us-japan-10y-gap` | daily | 2026-10-01 → 2026-10-30 | 21 | 24 | 0 | 0 | 0 | — | the monthly jgb backfill LEFT the stored stage window between the S6 and this corpus (97 → 21 points; the remaining span is the 2026-10-01 → 2026-10-30 MOF daily-upgrade era) — unreadable in every re-run window before 2026-10, fired in 0 windows |
| `stress-stlfsi` | weekly | 2016-09-30 → 2026-10-23 | 526 | 2512 | 1061 | 332 | 729 | 2017-04-28 | dense series — full-depth re-run |
| `nfci` | weekly | 2016-09-30 → 2026-10-23 | 526 | 2512 | 1061 | 529 | 532 | 2017-04-28 | dense series — full-depth re-run |
| `vix` | daily | 2016-09-26 → 2026-10-30 | 2572 | 2512 | 884 | 664 | 220 | 2016-11-07 | dense series — full-depth re-run |
| `gold-silver` | daily | 2016-10-01 → 2026-11-03 | 122 | 238 | 100 | 63 | 37 | 2019-04-01 | percentile history is the World Bank monthly backfill; the 2026-10-08 → 10-31 daily seeds the S6 corpus carried are gone from the stage window (the current daily seeds are 2026-11-02/03) — a daily-cadence reading over a monthly-density series is stale most windows |
| `cftc-gold-positioning` | weekly | 2026-10-27 → 2026-10-27 | 1 | 6 | 0 | 0 | 0 | — | stored history = 1 point (2026-10-27 — the CFTC series only began accumulating): never fires in the re-run era; the stress lane effectively ran 4-voter |
| `us-cpi-yoy` | monthly | 2016-10-01 → 2026-09-01 | 119 | 2512 | 800 | 506 | 294 | 2019-05-01 | dense series — full-depth re-run |
| `us-pce-core-yoy` | monthly | 2016-10-01 → 2026-09-01 | 120 | 2512 | 781 | 527 | 254 | 2019-05-01 | dense series — full-depth re-run |
| `euro-hicp` | monthly | 2016-10-01 → 2026-09-01 | 120 | 2510 | 886 | 524 | 362 | 2019-05-01 | dense series — full-depth re-run |
| `breakeven-5y5y` | daily | 2016-09-26 → 2026-11-02 | 2525 | 2512 | 1693 | 1089 | 604 | 2016-11-07 | dense series — full-depth re-run |
| `breakeven-tilt` | daily | 2016-09-26 → 2026-11-02 | 2525 | 2512 | 1173 | 264 | 909 | 2016-11-08 | derived series (T5YIFR − T5YIE inner join on common dates) — dense full-depth re-run; the 21st voter since the D-5 promotion (Session 6), level-leg only |

**The effective table:** cftc-gold-positioning never fires, us-japan-10y-gap never fires in this stored window (its monthly backfill left the stage — see the coverage note), and gold-silver fires only near its sparse observation dates — the re-run era's real voter pool averaged **10.4 firing voters per window** (of 21). The stress lane therefore ran 4-voter and the dollar lane 2-voter. Every denominator is stated; nothing is silently interpolated.

## B1 — the historical re-run (frozen clock)

Windows: **2512** (2016-11-07 → 2026-11-03, every gold trading day). Label distribution: strong-tailwind ×232, balanced ×232, headwind ×740, strong-headwind ×390, tailwind ×918.
Average firing voters 10.4 · average netScore +0.26 · netScore range -9 to 10.

**The D-6 cross-fill, counted aloud:** 0 fill day(s) applied across all 2512 windows. The stored series are dense (each healthy rung re-fetches the full decade window), so the historical re-run sees ~0 fills — the audit's healthy-day expectation (GOLD_FRED_GAPFILL_SPEC §5 G1a). The fill's production value is freshness-rescue on TRANSIENT degraded days, which a dense stored corpus cannot replay — stated, not hidden.

Month-end traces (the label + firing counts the frozen table produced):

| Window day | Label | Net | Firing (T/H) | Lane readings |
|---|---|---|---|---|
| 2016-11-30 | headwind | -2 | 10 (4/6) | borrowing-costs:mixed · dollar:unreadable · stress:unreadable · inflation:hot |
| 2016-12-30 | strong-headwind | -2 | 4 (1/3) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:cool |
| 2017-01-31 | strong-tailwind | +2 | 4 (3/1) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:mixed |
| 2017-02-28 | strong-tailwind | +3 | 3 (3/0) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:hot |
| 2017-03-31 | strong-tailwind | +4 | 6 (5/1) | borrowing-costs:mixed · dollar:stress · stress:unreadable · inflation:hot |
| 2017-04-28 | headwind | -1 | 9 (4/5) | borrowing-costs:relief · dollar:stress · stress:calm · inflation:cool |
| 2017-05-31 | tailwind | +2 | 12 (7/5) | borrowing-costs:relief · dollar:stress · stress:calm · inflation:cool |
| 2017-06-30 | headwind | -1 | 11 (5/6) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:cool |
| 2017-07-31 | tailwind | +2 | 10 (6/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:hot |
| 2017-08-31 | strong-tailwind | +9 | 9 (9/0) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:hot |
| 2017-09-29 | headwind | -1 | 7 (3/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:unreadable |
| 2017-10-31 | headwind | -3 | 7 (2/5) | borrowing-costs:relief · dollar:strong · stress:calm · inflation:cool |
| 2017-11-30 | balanced | +0 | 8 (4/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:unreadable |
| 2017-12-29 | tailwind | +2 | 8 (5/3) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:cool |
| 2018-01-31 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:stress · stress:mixed · inflation:hot |
| 2018-02-28 | headwind | -2 | 12 (5/7) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:mixed |
| 2018-03-29 | strong-tailwind | +7 | 11 (9/2) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:hot |
| 2018-04-30 | headwind | -1 | 13 (6/7) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2018-05-31 | headwind | -2 | 12 (5/7) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:cool |
| 2018-06-29 | balanced | +0 | 8 (4/4) | borrowing-costs:mixed · dollar:unreadable · stress:elevated · inflation:cool |
| 2018-07-31 | balanced | +0 | 8 (4/4) | borrowing-costs:mixed · dollar:unreadable · stress:unreadable · inflation:hot |
| 2018-08-31 | headwind | -2 | 8 (3/5) | borrowing-costs:mixed · dollar:unreadable · stress:calm · inflation:unreadable |
| 2018-09-28 | headwind | -3 | 11 (4/7) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:hot |
| 2018-10-31 | headwind | -1 | 9 (4/5) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:unreadable |
| 2018-11-30 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2018-12-31 | strong-tailwind | +6 | 12 (9/3) | borrowing-costs:mixed · dollar:unreadable · stress:elevated · inflation:mixed |
| 2019-01-31 | strong-tailwind | +5 | 7 (6/1) | borrowing-costs:mixed · dollar:stress · stress:unreadable · inflation:unreadable |
| 2019-02-28 | strong-tailwind | +4 | 8 (6/2) | borrowing-costs:mixed · dollar:unreadable · stress:calm · inflation:hot |
| 2019-03-29 | tailwind | +4 | 10 (7/3) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:unreadable |
| 2019-04-30 | tailwind | +2 | 6 (4/2) | borrowing-costs:mixed · dollar:unreadable · stress:calm · inflation:unreadable |
| 2019-05-31 | tailwind | +4 | 14 (9/5) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:cool |
| 2019-06-28 | tailwind | +4 | 12 (8/4) | borrowing-costs:mixed · dollar:stress · stress:unreadable · inflation:cool |
| 2019-07-31 | strong-tailwind | +8 | 12 (10/2) | borrowing-costs:relief · dollar:mixed · stress:unreadable · inflation:mixed |
| 2019-08-30 | strong-tailwind | +8 | 14 (11/3) | borrowing-costs:relief · dollar:mixed · stress:elevated · inflation:mixed |
| 2019-09-30 | tailwind | +2 | 14 (8/6) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:mixed |
| 2019-10-31 | strong-tailwind | +7 | 11 (9/2) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:cool |
| 2019-11-29 | tailwind | +2 | 10 (6/4) | borrowing-costs:relief · dollar:strong · stress:unreadable · inflation:cool |
| 2019-12-31 | strong-tailwind | +6 | 10 (8/2) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:mixed |
| 2020-01-31 | tailwind | +5 | 13 (9/4) | borrowing-costs:relief · dollar:strong · stress:mixed · inflation:mixed |
| 2020-02-28 | strong-tailwind | +6 | 12 (9/3) | borrowing-costs:relief · dollar:strong · stress:elevated · inflation:cool |
| 2020-03-31 | tailwind | +3 | 15 (9/6) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:mixed |
| 2020-04-30 | tailwind | +7 | 15 (11/4) | borrowing-costs:relief · dollar:mixed · stress:elevated · inflation:mixed |
| 2020-05-29 | tailwind | +7 | 15 (11/4) | borrowing-costs:relief · dollar:stress · stress:elevated · inflation:mixed |
| 2020-06-30 | tailwind | +5 | 13 (9/4) | borrowing-costs:relief · dollar:stress · stress:elevated · inflation:cool |
| 2020-07-31 | strong-tailwind | +6 | 12 (9/3) | borrowing-costs:relief · dollar:stress · stress:elevated · inflation:mixed |
| 2020-08-31 | tailwind | +4 | 12 (8/4) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:mixed |
| 2020-09-30 | tailwind | +1 | 13 (7/6) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:cool |
| 2020-10-30 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:cool |
| 2020-11-30 | tailwind | +3 | 11 (7/4) | borrowing-costs:relief · dollar:stress · stress:unreadable · inflation:cool |
| 2020-12-31 | tailwind | +4 | 12 (8/4) | borrowing-costs:relief · dollar:stress · stress:calm · inflation:mixed |
| 2021-01-29 | tailwind | +2 | 12 (7/5) | borrowing-costs:mixed · dollar:stress · stress:mixed · inflation:cool |
| 2021-02-26 | headwind | -1 | 11 (5/6) | borrowing-costs:mixed · dollar:stress · stress:mixed · inflation:cool |
| 2021-03-31 | headwind | -1 | 13 (6/7) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:mixed |
| 2021-04-30 | tailwind | +2 | 12 (7/5) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:mixed |
| 2021-05-28 | tailwind | +3 | 13 (8/5) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:mixed |
| 2021-06-30 | balanced | +0 | 12 (6/6) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:mixed |
| 2021-07-30 | tailwind | +6 | 14 (10/4) | borrowing-costs:mixed · dollar:stress · stress:calm · inflation:mixed |
| 2021-08-31 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:unreadable · stress:calm · inflation:mixed |
| 2021-09-30 | balanced | +0 | 14 (7/7) | borrowing-costs:mixed · dollar:strong · stress:mixed · inflation:mixed |
| 2021-10-29 | tailwind | +1 | 11 (6/5) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:mixed |
| 2021-11-30 | strong-tailwind | +6 | 12 (9/3) | borrowing-costs:relief · dollar:strong · stress:elevated · inflation:mixed |
| 2021-12-31 | tailwind | +3 | 11 (7/4) | borrowing-costs:mixed · dollar:strong · stress:calm · inflation:mixed |
| 2022-01-31 | headwind | -2 | 14 (6/8) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-02-28 | tailwind | +5 | 13 (9/4) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-03-31 | balanced | +0 | 14 (7/7) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-04-29 | tailwind | +2 | 16 (9/7) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-05-31 | balanced | +0 | 16 (8/8) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:mixed |
| 2022-06-30 | balanced | +0 | 16 (8/8) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-07-29 | tailwind | +4 | 14 (9/5) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-08-31 | balanced | +0 | 16 (8/8) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:hot |
| 2022-09-30 | headwind | -2 | 16 (7/9) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
| 2022-10-31 | tailwind | +2 | 16 (9/7) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:hot |
| 2022-11-30 | tailwind | +4 | 14 (9/5) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:mixed |
| 2022-12-30 | tailwind | +2 | 14 (8/6) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:hot |
| 2023-01-31 | tailwind | +6 | 14 (10/4) | borrowing-costs:mixed · dollar:mixed · stress:elevated · inflation:hot |
| 2023-02-28 | headwind | -2 | 14 (6/8) | borrowing-costs:mixed · dollar:strong · stress:elevated · inflation:mixed |
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
| 2025-01-31 | strong-headwind | -6 | 8 (1/7) | borrowing-costs:tight · dollar:strong · stress:calm · inflation:mixed |
| 2025-02-28 | headwind | -2 | 6 (2/4) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:cool |
| 2025-03-31 | headwind | -3 | 7 (2/5) | borrowing-costs:mixed · dollar:mixed · stress:unreadable · inflation:cool |
| 2025-04-30 | balanced | +0 | 6 (3/3) | borrowing-costs:mixed · dollar:stress · stress:elevated · inflation:unreadable |
| 2025-05-30 | headwind | -1 | 5 (2/3) | borrowing-costs:mixed · dollar:unreadable · stress:unreadable · inflation:hot |
| 2025-06-30 | strong-tailwind | +3 | 5 (4/1) | borrowing-costs:mixed · dollar:stress · stress:unreadable · inflation:unreadable |
| 2025-07-31 | strong-headwind | -5 | 7 (1/6) | borrowing-costs:tight · dollar:strong · stress:calm · inflation:hot |
| 2025-08-29 | balanced | +0 | 6 (3/3) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:hot |
| 2025-09-30 | headwind | -2 | 6 (2/4) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:hot |
| 2025-10-31 | strong-headwind | -6 | 6 (0/6) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:cool |
| 2025-11-28 | headwind | -2 | 2 (0/2) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:unreadable |
| 2025-12-31 | strong-headwind | -4 | 4 (0/4) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:unreadable |
| 2026-01-30 | strong-headwind | -4 | 6 (1/5) | borrowing-costs:tight · dollar:mixed · stress:unreadable · inflation:cool |
| 2026-02-27 | headwind | -3 | 7 (2/5) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:cool |
| 2026-03-31 | strong-headwind | -5 | 7 (1/6) | borrowing-costs:tight · dollar:strong · stress:elevated · inflation:cool |
| 2026-04-30 | headwind | -3 | 7 (2/5) | borrowing-costs:tight · dollar:mixed · stress:unreadable · inflation:mixed |
| 2026-05-29 | strong-headwind | -5 | 5 (0/5) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:cool |
| 2026-06-30 | strong-headwind | -5 | 5 (0/5) | borrowing-costs:tight · dollar:strong · stress:unreadable · inflation:unreadable |
| 2026-07-31 | headwind | -3 | 7 (2/5) | borrowing-costs:tight · dollar:mixed · stress:unreadable · inflation:hot |
| 2026-08-31 | strong-headwind | -5 | 7 (1/6) | borrowing-costs:tight · dollar:strong · stress:calm · inflation:hot |
| 2026-09-30 | strong-headwind | -6 | 8 (1/7) | borrowing-costs:tight · dollar:strong · stress:calm · inflation:hot |
| 2026-10-30 | headwind | -2 | 6 (2/4) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:cool |
| 2026-11-03 | headwind | -2 | 6 (2/4) | borrowing-costs:mixed · dollar:strong · stress:unreadable · inflation:cool |


## B2 — the realized-move join (5 / 20 / 60 trading days)

### Horizon 5 trading days (flat band ±0.47%; ≈ 7 calendar days)

Windows with a joinable forward return: **2507** of 2512 (the last 5 trading days have no forward observation — excluded, n stated). Mature-base subsample (≥ 2021-09-23): **1282** windows.

Sign-agreement (netScore sign vs forward-return sign, both readable — a model lean AND a move beyond the band): **950/1840 = 51.6%** (mature base: 454/971 = 46.8%). A coin is 50%; the ALL-windows move split is up 45.7% · flat 19.3% · down 35.0%.

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 545 [47%] | 230 [20%] | 375 [33%] | 1150 | 0.29% | 0.36% |
| **mixed** | 86 [37%] | 48 [21%] | 98 [42%] | 232 | -0.05% | 0.01% |
| **headwind** | 515 [46%] | 205 [18%] | 405 [36%] | 1125 | 0.28% | 0.27% |
| *all windows* | 1146 | 483 | 878 | 2507 | 0.26% | 0.28% |

Confusion table — mature-base windows (≥ 5 years of percentile base):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 155 [48%] | 58 [18%] | 111 [34%] | 324 | 0.39% | 0.36% |
| **mixed** | 52 [40%] | 22 [17%] | 55 [43%] | 129 | -0.00% | 0.04% |
| **headwind** | 406 [49%] | 124 [15%] | 299 [36%] | 829 | 0.40% | 0.39% |
| *all windows* | 613 | 204 | 465 | 1282 | 0.36% | 0.35% |

Label-conditional forward returns (the full 5-step vocabulary, every row kept):

| Label | n | mean | median |
|---|---|---|---|
| strong-tailwind | 232 | 0.17% | 0.22% |
| tailwind | 918 | 0.32% | 0.41% |
| balanced | 232 | -0.05% | 0.01% |
| headwind | 735 | 0.27% | 0.19% |
| strong-headwind | 390 | 0.32% | 0.49% |
| null | 0 | —% | —% |

### Horizon 20 trading days (flat band ±1.87%; ≈ 28 calendar days)

Windows with a joinable forward return: **2492** of 2512 (the last 20 trading days have no forward observation — excluded, n stated). Mature-base subsample (≥ 2021-09-23): **1267** windows.

Sign-agreement (netScore sign vs forward-return sign, both readable — a model lean AND a move beyond the band): **676/1429 = 47.3%** (mature base: 329/780 = 42.2%). A coin is 50%; the ALL-windows move split is up 39.5% · flat 37.1% · down 23.4%.

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 431 [37%] | 447 [39%] | 272 [24%] | 1150 | 0.99% | 0.62% |
| **mixed** | 72 [31%] | 94 [41%] | 66 [28%] | 232 | 0.22% | -0.06% |
| **headwind** | 481 [43%] | 384 [35%] | 245 [22%] | 1110 | 1.34% | 1.07% |
| *all windows* | 984 | 925 | 583 | 2492 | 1.08% | 0.69% |

Confusion table — mature-base windows (≥ 5 years of percentile base):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 140 [43%] | 109 [34%] | 75 [23%] | 324 | 1.33% | 1.50% |
| **mixed** | 49 [38%] | 46 [36%] | 34 [26%] | 129 | 0.70% | 0.78% |
| **headwind** | 376 [46%] | 249 [31%] | 189 [23%] | 814 | 1.63% | 1.36% |
| *all windows* | 565 | 404 | 298 | 1267 | 1.46% | 1.34% |

Label-conditional forward returns (the full 5-step vocabulary, every row kept):

| Label | n | mean | median |
|---|---|---|---|
| strong-tailwind | 232 | 0.38% | 0.30% |
| tailwind | 918 | 1.14% | 0.72% |
| balanced | 232 | 0.22% | -0.06% |
| headwind | 733 | 1.20% | 0.93% |
| strong-headwind | 377 | 1.63% | 1.82% |
| null | 0 | —% | —% |

### Horizon 60 trading days (flat band ±5.60%; ≈ 84 calendar days)

Windows with a joinable forward return: **2452** of 2512 (the last 60 trading days have no forward observation — excluded, n stated). Mature-base subsample (≥ 2021-09-23): **1227** windows.

Sign-agreement (netScore sign vs forward-return sign, both readable — a model lean AND a move beyond the band): **455/1028 = 44.3%** (mature base: 202/618 = 32.7%). A coin is 50%; the ALL-windows move split is up 35.0% · flat 54.6% · down 10.4%.

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 340 [30%] | 691 [60%] | 119 [10%] | 1150 | 2.51% | 2.02% |
| **mixed** | 64 [28%] | 146 [63%] | 22 [9%] | 232 | 2.20% | 1.24% |
| **headwind** | 454 [42%] | 501 [47%] | 115 [11%] | 1070 | 4.79% | 4.29% |
| *all windows* | 858 | 1338 | 256 | 2452 | 3.48% | 2.95% |

Confusion table — mature-base windows (≥ 5 years of percentile base):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **tailwind** | 124 [38%] | 157 [48%] | 43 [13%] | 324 | 3.60% | 4.10% |
| **mixed** | 40 [31%] | 70 [54%] | 19 [15%] | 129 | 2.65% | 1.61% |
| **headwind** | 373 [48%] | 323 [42%] | 78 [10%] | 774 | 5.58% | 5.22% |
| *all windows* | 537 | 550 | 140 | 1227 | 4.75% | 4.40% |

Label-conditional forward returns (the full 5-step vocabulary, every row kept):

| Label | n | mean | median |
|---|---|---|---|
| strong-tailwind | 232 | 1.16% | 0.32% |
| tailwind | 918 | 2.85% | 2.44% |
| balanced | 232 | 2.20% | 1.24% |
| headwind | 722 | 4.41% | 4.15% |
| strong-headwind | 348 | 5.57% | 4.81% |
| null | 0 | —% | —% |

## B2 (archive era) — the live out-of-sample slice, tiny-n, stated as such

The 19 archived days re-scored from the readings the rungs actually stamped (the SPA's own re-derivation — the honest as-rung state, including the rung-time data lags the historical re-run cannot replay):

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
| 2026-10-26 | -6 | strong-headwind | -1.70% | down |
| 2026-10-27 | -6 | strong-headwind | -3.53% | down |
| 2026-10-28 | -2 | headwind | — (past the series end) | — |
| 2026-10-29 | -2 | headwind | — (past the series end) | — |
| 2026-10-30 | -3 | headwind | — (past the series end) | — |
| 2026-10-31 | -2 | headwind | — (past the series end) | — |
| 2026-11-01 | -2 | headwind | — (past the series end) | — |
| 2026-11-02 | -2 | headwind | — (past the series end) | — |
| 2026-11-03 | -2 | headwind | — (past the series end) | — |

Joinable at 5td: **12** of 19 days (the last 5 trading days of the corpus have no forward observation). Sign-agreement: 12/12 = 100%. At 20td and 60td: **0 joinable days** (the archive era began 2026-10-15 — no archive day has 20 trading days of forward gold inside a corpus ending 2026-11-03). **n is too small for any claim — this slice verifies the live path produces the same shape as the re-run, nothing more.**

The stamped-vs-rederived `goldSummary` no-drift contract, every stamped archive day:

| Archive day | stamped (netScore / label) | promoted re-derivation | S4-frozen re-derivation | reading |
|---|---|---|---|---|
| 2026-10-31 | -2 / headwind | -2 / headwind | -2 / headwind | matches both (the tilt silent that day) |
| 2026-11-01 | -2 / headwind | -2 / headwind | -2 / headwind | matches both (the tilt silent that day) |
| 2026-11-02 | -2 / headwind | -2 / headwind | -2 / headwind | matches both (the tilt silent that day) |
| 2026-11-03 | -2 / headwind | -2 / headwind | -2 / headwind | matches both (the tilt silent that day) |

**The no-drift contract HOLDS on every stamped day** — the 2026-10-31 stamp is the pre-promotion engine's (the S6 deploy boundary, 2026-10-31 ~16:07 UTC) and every later stamp is the promoted engine's own re-derivation. The S1 contract (one pure function, ingest and SPA, no drift) is verified on the grown corpus.

## B4 — the promotion delta (the S4-frozen 20-voter baseline vs the promoted production 21)

The S4-frozen 20-voter baseline (`HARNESS_GOLD_VOTERS_20` — the pre-promotion production table, kept verbatim for lineage) over the same 2512 windows:

- Label distribution: strong-tailwind ×277, headwind ×633, strong-headwind ×375, balanced ×237, tailwind ×990.
- The promoted voter itself — `breakeven-tilt` (the shared evaluator, level-leg only, like every voter without a 30-day move threshold) — fired in **1173** of 2512 windows (46.7%): tailwind 264 · headwind 909.
- Net-score delta (promoted − baseline): -1 ×909, +0 ×1339, +1 ×264.
- Label-bucket flips (tailwind/mixed/headwind changing side): **263** windows (10.5%).

- Horizon 5td: sign-agreement 950/1840 = 51.6% (baseline: 944/1844 = 51.2%) · tailwind mean return 0.29% vs 0.24% · headwind mean return 0.28% vs 0.32% (n: 1150/1267 tailwind, 1125/1003 headwind).
- Horizon 20td: sign-agreement 676/1429 = 47.3% (baseline: 666/1421 = 46.9%) · tailwind mean return 0.99% vs 0.82% · headwind mean return 1.34% vs 1.47% (n: 1150/1267 tailwind, 1110/988 headwind).
- Horizon 60td: sign-agreement 455/1028 = 44.3% (baseline: 449/1013 = 44.3%) · tailwind mean return 2.51% vs 2.20% · headwind mean return 4.79% vs 5.26% (n: 1150/1267 tailwind, 1070/948 headwind).

**5td, the S4-frozen baseline's confusion table (±0.47% band) — the tables the S4 report carried as its primary:**

| Model ↓ / Move → | up | flat | down | n |
|---|---|---|---|---|
| **tailwind** | 588 | 249 | 430 | 1267 |
| **mixed** | 88 | 57 | 92 | 237 |
| **headwind** | 470 | 177 | 356 | 1003 |

**20td, the S4-frozen baseline's confusion table (±1.87% band) — the tables the S4 report carried as its primary:**

| Model ↓ / Move → | up | flat | down | n |
|---|---|---|---|---|
| **tailwind** | 456 | 490 | 321 | 1267 |
| **mixed** | 94 | 91 | 52 | 237 |
| **headwind** | 434 | 344 | 210 | 988 |

**60td, the S4-frozen baseline's confusion table (±5.60% band) — the tables the S4 report carried as its primary:**

| Model ↓ / Move → | up | flat | down | n |
|---|---|---|---|---|
| **tailwind** | 356 | 770 | 141 | 1267 |
| **mixed** | 79 | 136 | 22 | 237 |
| **headwind** | 423 | 432 | 93 | 948 |

**The honest delta:** the tilt fired in 46.7% of windows (mostly headwind: 909 of 1173 — the tilt sat at decade lows, i.e. fading, for most of the corpus) and moved the label bucket in 10.5%. The measured associations barely moved: 5td +0.4pp · 20td +0.4pp · 60td -0.1pp — **no material difference in the measured association** — the promoted table is not better or worse on this corpus, only noisier in its label vocabulary. The promotion is the owner's MADE call (D-5, decided-YES on this evidence in S4's B4); this section is its measured record — the delta, not a recommendation. The no-edge conclusion of the S4 report carries into the promoted primary tables above unchanged in substance.

Archive era: the tilt's reading exists only from the 2026-10-31 archive (it shipped in S3) — earlier archives score the promoted table with the tilt SILENT (the reading is absent, readable() mutes it), so the two models agree there by construction; the one day that differs is stated in the archive table above, never averaged into significance.

## Honesty rules (B3) — the known gaps, stated

1. **Every cell carries n.** All 9 confusion cells per horizon per table-set are reported (all-windows AND mature-base), plus the 6-row label-conditional tables and both models' sign-agreements — nothing picked.
2. **The corpus depth is ~10.1 years, not decades.** The stored histories begin 2016-09-26 (the FRED family's stage window). Windows before ~2021-09-23 ride percentile bases shorter than 5 years — on a young base a value near the running max reads "high" more easily, which is exactly why the mature-base tables sit BESIDE the all-windows tables rather than replacing them.
3. **Three voters are structurally thin in the re-run era:** cftc-gold-positioning (1 stored point — never fires), us-japan-10y-gap (the monthly jgb backfill left the stored window between the S6 and this corpus — 21 points over 2026-10 only; 0 firing windows), gold-silver (monthly percentile history + the newest daily seeds). The stress lane therefore ran 4-voter and the dollar lane 2-voter — stated, not interpolated.
4. **The cross-fill cannot be replayed historically** (0 fills across 2512 windows): the stored series are the accumulated dense fetches; the fill earns its keep on TRANSIENT degraded days the stored corpus no longer shows. Its production effect is freshness, not a historical score change.
5. **The realized series is one venue, two provenances:** the backfill is the Yahoo GC=F ~10-year daily record; the tail points are the accumulated live-price seed appends (gold-api spot at append time). The join treats them identically; the mix is recorded here.
6. **Multiple testing:** 3 horizons × 3 buckets × 2 table-sets × 2 models + the archive slice is ~110 reported numbers; with these n's, ±2–3 percentage-point wobbles are noise. The conclusion below only claims what a stated-in-advance rule can see — the tables themselves make no claim.
7. **The archive era is plumbing, not power:** 19 days, 12 joinable at 5td, 0 at 20td/60td. It verifies the live path's shape; it cannot verify an edge.
8. **The asOf-watch (S3's known gap):** days 2–3 OBSERVED at this re-check — lockstep (the offset stayed exactly 1 trading day at every post-S6 rung, both groups holding over the weekend and advancing +1 together at the 11-03 rung): **validated-by-watch — the honest wording, still not "proven"**. Carried to GOLD_RECHECK_SPEC §5 / GOLD_BACKTEST_SPEC §5.

## Conclusion — would this have been visible ex-ante?

The rule was fixed before the run: a directional edge is claimed ONLY if, on the MATURE-BASE subsample, the sign-agreement at some horizon departs from 50% by more than 2 binomial standard errors (2 × √(0.25/n)) AND the tailwind-minus-headwind mean-return spread keeps its sign at all three horizons. Anything else reads as "no measurable edge at these horizons over this corpus" — the outcome the spec explicitly permits.

The mature-base measurements (2021-09-23 → 2026-11-03):

- 5td: sign-agreement 454/971 = 46.8% (2-SE band around 50%: ±3.2% — DEPARTS BELOW 50%) · tailwind−headwind mean spread -0.01%
- 20td: sign-agreement 329/780 = 42.2% (2-SE band around 50%: ±3.6% — DEPARTS BELOW 50%) · tailwind−headwind mean spread -0.30%
- 60td: sign-agreement 202/618 = 32.7% (2-SE band around 50%: ±4.0% — DEPARTS BELOW 50%) · tailwind−headwind mean spread -1.98%

By the stated rule: **no edge in the table's own direction — the measurable association runs the OTHER way over this corpus.** Every horizon's sign-agreement departs BELOW 50% and the tailwind-minus-headwind mean spread is negative at every horizon: over 2021-09-23 → 2026-11-03, headwind labels preceded LARGER forward rises than tailwind labels did (the 60td spread is -1.98%: headwind windows rose 5.58% on average against tailwind's 3.60%, mature base). This decade's gold advance ran THROUGH tight real rates and a strong dollar — the classical headwinds — so a conditions-reading table built on those relationships reads persistently against the move it lived through. The panel's caption ("conditions, not advice") is not just a disclaimer here; it is the operative description: the table reads the macro regime, and in this regime the regime's direction and gold's direction diverged.

The ex-ante test, answered honestly: the voter table and its thresholds were authored from classical driver relationships BEFORE this harness computed anything (S1, 2026-10-31; the single change since — the 21st seat — was the owner's scope call on S4's B4 delta, not a parameter this harness tuned, and its measured effect is the promotion-delta section above), so the numbers are what an observer with the same table and the same stored histories would have measured at each window — no fitted parameters, no selection. The honest caveat runs the other way: the FLAT BAND, the three horizons and the bucket folds were chosen by the harness author in this session; the stated-in-advance rule above is the guard against that freedom, and the mature-base/all-windows split is reported so the short-base effect is visible, not hidden.

