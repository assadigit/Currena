# Gold lane calibration — the P0 pre-registered run (gold-balance consolidation, 02 §6)

Generated from the recorded KV corpus (`packages/insights/fixtures/gold-backtest-corpus.json`, recorded 2026-11-03T04:43:54.969Z — the same corpus, the same 2512 windows (2016-11-07 → 2026-11-03), the same frozen clock and the same no-lookahead truncation as BACKTEST-GOLD.md; the mature base is the same ≥ 2021-09-23 split). The lane engine evaluated here is the harness-local `laneBalanceOverVoters` — 02 §3's algorithm over the SAME frozen 21-voter production table (`GOLD_LANE_VOTERS`) and the SAME shared evaluator (`evalLeg`); the production engine (`gold-balance.ts`, rollout phase P1) will import the same sources. The frozen tables and their report are untouched: this file ADDS the two lane rules beside them.

**The purpose, restated:** choose `GOLD_LANE_MIN_FIRING` (2 default, 1 fallback) on stated legibility criteria, NEVER on forward returns. NO FORECASTING EDGE IS CLAIMED OR IMPLIED for either rule or for the consolidated balance: the gold backtest's own measured record over this corpus (BACKTEST-GOLD.md: mature-base sign-agreements 46.8 / 42.2 / 32.7% at 5/20/60td, all departing below the coin) stands unchanged; the balance reads conditions today, not direction. The confusion tables at the end are LINEAGE ONLY — labelled "not used for selection" — exactly as 02 §6 pre-registered.

## The two rules under test

- **MIN2** (D-GB-3, the default): a lane votes only when at least 2 of its voters fire, then by strict majority of the firing voters; a tie reads split and sits in the neutral tray. One firing voter never moves a lane.
- **MIN1** (the pre-registered fallback): a lane votes by majority of its firing voters with no crowd minimum — a single firing voter can tip the whole lane.

Both rules share everything else: the 21 voters, their lanes and polarities (the frozen production table), the evaluator, the beam-angle formula (D-GB-8, unchanged: |net| / (for + against) × 10 degrees, clamped to [3, 10], level at net = 0), the verdict words. The ONLY difference is the crowd minimum.

## The pre-registered criteria (fixed before the run)

- **C1 — not degenerate:** the balance is level in at most 70% of all windows AND fully tipped (10 degrees, one-sided) in at most 60% of all windows.
- **C2 — smoother than the old count:** the median verdict flips per 60 trading days is not higher than the same figure for the 21-voter net sign.
- **Decision rule:** use MIN2 if C1 and C2 hold; else use MIN1 if C1 and C2 hold; if neither passes, STOP and bring the numbers to the owner — do not ship.

Definitions used (stated so every cell is checkable): "level" = net 0 across the 4 lane votes (the all-unread `none` state is counted within level and ALSO reported separately — it never occurred beyond 0 windows in this corpus); "fully tipped" = |net| = for + against (the one-sided 10-degree tip); "verdict flip" = a day-to-day change of the balance state (tipped-for / level / tipped-against / none); "flips per 60 trading days" = the MEDIAN, over every window of 60 consecutive trading days, of the flip count inside that window; the beam-angle bands are 0 (level), (0, 6] and (6, 10] degrees.

### MIN2 — all windows (n = 2512)

| Balance state | n | share |
|---|---|---|
| tipped for gold | 885 | 35.2% |
| level | 628 | 25.0% |
| tipped against gold | 999 | 39.8% |
| all four lanes unread (none) | 0 | 0.0% |

| Beam-angle band | n | share |
|---|---|---|
| 0° (level) | 628 | 25.0% |
| 3°–6° | 636 | 25.3% |
| 6°–10° | 1248 | 49.7% |
| — of which fully tipped (10°, one-sided) | 1248 | 49.7% |

| Lane | unread n | unread share | split n | split share |
|---|---|---|---|---|
| borrowing-costs | 0 | 0.0% | 160 | 6.4% |
| dollar | 0 | 0.0% | 458 | 18.2% |
| stress | 0 | 0.0% | 91 | 3.6% |
| inflation | 0 | 0.0% | 128 | 5.1% |

Stability: median verdict flips per 60 trading days **8**, beside the 21-voter net-sign figure **9** over the same windows (C2's comparison; "not higher than" passes).

### MIN2 — mature base (≥ 2021-09-23) (n = 1287)

| Balance state | n | share |
|---|---|---|
| tipped for gold | 277 | 21.5% |
| level | 249 | 19.3% |
| tipped against gold | 761 | 59.1% |
| all four lanes unread (none) | 0 | 0.0% |

| Beam-angle band | n | share |
|---|---|---|
| 0° (level) | 249 | 19.3% |
| 3°–6° | 182 | 14.1% |
| 6°–10° | 856 | 66.5% |
| — of which fully tipped (10°, one-sided) | 856 | 66.5% |

| Lane | unread n | unread share | split n | split share |
|---|---|---|---|---|
| borrowing-costs | 0 | 0.0% | 80 | 6.2% |
| dollar | 0 | 0.0% | 358 | 27.8% |
| stress | 0 | 0.0% | 44 | 3.4% |
| inflation | 0 | 0.0% | 29 | 2.3% |

Stability: median verdict flips per 60 trading days **8**, beside the 21-voter net-sign figure **8** over the same windows (C2's comparison; "not higher than" passes).

### MIN1 — all windows (n = 2512)

| Balance state | n | share |
|---|---|---|
| tipped for gold | 902 | 35.9% |
| level | 656 | 26.1% |
| tipped against gold | 954 | 38.0% |
| all four lanes unread (none) | 0 | 0.0% |

| Beam-angle band | n | share |
|---|---|---|
| 0° (level) | 656 | 26.1% |
| 3°–6° | 1289 | 51.3% |
| 6°–10° | 567 | 22.6% |
| — of which fully tipped (10°, one-sided) | 567 | 22.6% |

| Lane | unread n | unread share | split n | split share |
|---|---|---|---|---|
| borrowing-costs | 0 | 0.0% | 160 | 6.4% |
| dollar | 0 | 0.0% | 458 | 18.2% |
| stress | 0 | 0.0% | 91 | 3.6% |
| inflation | 0 | 0.0% | 128 | 5.1% |

Stability: median verdict flips per 60 trading days **8**, beside the 21-voter net-sign figure **9** over the same windows (C2's comparison; "not higher than" passes).

### MIN1 — mature base (≥ 2021-09-23) (n = 1287)

| Balance state | n | share |
|---|---|---|
| tipped for gold | 254 | 19.7% |
| level | 348 | 27.0% |
| tipped against gold | 685 | 53.2% |
| all four lanes unread (none) | 0 | 0.0% |

| Beam-angle band | n | share |
|---|---|---|
| 0° (level) | 348 | 27.0% |
| 3°–6° | 544 | 42.3% |
| 6°–10° | 395 | 30.7% |
| — of which fully tipped (10°, one-sided) | 395 | 30.7% |

| Lane | unread n | unread share | split n | split share |
|---|---|---|---|---|
| borrowing-costs | 0 | 0.0% | 80 | 6.2% |
| dollar | 0 | 0.0% | 358 | 27.8% |
| stress | 0 | 0.0% | 44 | 3.4% |
| inflation | 0 | 0.0% | 29 | 2.3% |

Stability: median verdict flips per 60 trading days **6**, beside the 21-voter net-sign figure **8** over the same windows (C2's comparison; "not higher than" passes).

## The C1 / C2 verdicts (mechanical, computed from the tables above)

| Rule | Scope | n | level share (≤ 70%) | full-tip share (≤ 60%) | C1 | lane flips / 60td | net-sign flips / 60td | C2 |
|---|---|---|---|---|---|---|---|---|
| MIN2 | all windows | 2512 | 25.0% | 49.7% | PASS | 8 | 9 | PASS |
| MIN2 | mature base | 1287 | 19.3% | 66.5% | FAIL | 8 | 8 | PASS |
| MIN1 | all windows | 2512 | 26.1% | 22.6% | PASS | 8 | 9 | PASS |
| MIN1 | mature base | 1287 | 27.0% | 30.7% | PASS | 6 | 8 | PASS |

**DECISION: use MIN2 (`GOLD_LANE_MIN_FIRING = 2`, D-GB-3's default).** Both C1 and C2 hold over all windows — the pre-registered rule selects the default, no fallback needed. The mature base does NOT fully agree (C1 fails · C2 holds there) — stated, not hidden; the pre-registered criteria apply to ALL windows, and the mature-base row is context.

The selection used ONLY the legibility criteria above. Whatever the realised-move tables below show, they did not enter this decision — that is the point of the pre-registration.

## Lineage only — realised-move confusion tables (NOT USED FOR SELECTION)

These mirror BACKTEST-GOLD.md's B2 tables with the lane balance's state as the model side (tipped-for / level / tipped-against; the flat band is the same scaled ±2%/30d bar). They are recorded for lineage — the consolidated balance's measured association over the corpus — and are explicitly NOT used for the rule selection above. **No forecasting edge is claimed for the lane balance in either direction.**

### MIN2, horizon 5td (flat band ±0.47%)

Joinable windows: **2507** of 2512 (mature base: 1282). Sign-agreement (lane net sign vs forward-return sign, both readable): 794/1529 = 51.9% (mature base: 432/871 = 49.6%).

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 425 [48%] | 179 [20%] | 281 [32%] | 885 | 0.31% | 0.39% |
| **level** | 267 [43%] | 130 [21%] | 228 [36%] | 625 | 0.19% | 0.17% |
| **against** | 454 [46%] | 174 [17%] | 369 [37%] | 997 | 0.25% | 0.25% |
| *all windows* | 1146 | 483 | 878 | 2507 | 0.26% | 0.28% |

Confusion table — mature base (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 145 [52%] | 56 [20%] | 76 [27%] | 277 | 0.60% | 0.51% |
| **level** | 105 [43%] | 39 [16%] | 102 [41%] | 246 | 0.15% | 0.10% |
| **against** | 363 [48%] | 109 [14%] | 287 [38%] | 759 | 0.33% | 0.32% |
| *all windows* | 613 | 204 | 465 | 1282 | 0.36% | 0.35% |

### MIN2, horizon 20td (flat band ±1.87%)

Joinable windows: **2492** of 2512 (mature base: 1267). Sign-agreement (lane net sign vs forward-return sign, both readable): 552/1185 = 46.6% (mature base: 317/702 = 45.2%).

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 330 [37%] | 339 [38%] | 216 [24%] | 885 | 0.93% | 0.69% |
| **level** | 237 [38%] | 242 [39%] | 145 [23%] | 624 | 0.87% | 0.51% |
| **against** | 417 [42%] | 344 [35%] | 222 [23%] | 983 | 1.34% | 0.81% |
| *all windows* | 984 | 925 | 583 | 2492 | 1.08% | 0.69% |

Confusion table — mature base (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 133 [48%] | 95 [34%] | 49 [18%] | 277 | 1.71% | 1.71% |
| **level** | 96 [39%] | 84 [34%] | 65 [27%] | 245 | 0.87% | 0.84% |
| **against** | 336 [45%] | 225 [30%] | 184 [25%] | 745 | 1.56% | 1.07% |
| *all windows* | 565 | 404 | 298 | 1267 | 1.46% | 1.34% |

### MIN2, horizon 60td (flat band ±5.60%)

Joinable windows: **2452** of 2512 (mature base: 1227). Sign-agreement (lane net sign vs forward-return sign, both readable): 332/808 = 41.1% (mature base: 193/529 = 36.5%).

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 222 [25%] | 568 [64%] | 95 [11%] | 885 | 1.92% | 0.99% |
| **level** | 255 [41%] | 318 [51%] | 51 [8%] | 624 | 4.06% | 4.11% |
| **against** | 381 [40%] | 452 [48%] | 110 [12%] | 943 | 4.55% | 3.95% |
| *all windows* | 858 | 1338 | 256 | 2452 | 3.48% | 2.95% |

Confusion table — mature base (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 114 [41%] | 141 [51%] | 22 [8%] | 277 | 4.38% | 4.32% |
| **level** | 109 [44%] | 97 [40%] | 39 [16%] | 245 | 4.12% | 4.59% |
| **against** | 314 [45%] | 312 [44%] | 79 [11%] | 705 | 5.11% | 4.40% |
| *all windows* | 537 | 550 | 140 | 1227 | 4.75% | 4.40% |

### MIN1, horizon 5td (flat band ±0.47%)

Joinable windows: **2507** of 2512 (mature base: 1282). Sign-agreement (lane net sign vs forward-return sign, both readable): 746/1499 = 49.8% (mature base: 352/779 = 45.2%).

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 432 [48%] | 177 [20%] | 293 [32%] | 902 | 0.29% | 0.37% |
| **level** | 254 [39%] | 131 [20%] | 271 [41%] | 656 | 0.04% | 0.01% |
| **against** | 460 [48%] | 175 [18%] | 314 [33%] | 949 | 0.37% | 0.39% |
| *all windows* | 1146 | 483 | 878 | 2507 | 0.26% | 0.28% |

Confusion table — mature base (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 123 [48%] | 51 [20%] | 80 [31%] | 254 | 0.49% | 0.39% |
| **level** | 143 [41%] | 49 [14%] | 156 [45%] | 348 | 0.07% | -0.08% |
| **against** | 347 [51%] | 104 [15%] | 229 [34%] | 680 | 0.45% | 0.50% |
| *all windows* | 613 | 204 | 465 | 1282 | 0.36% | 0.35% |

### MIN1, horizon 20td (flat band ±1.87%)

Joinable windows: **2492** of 2512 (mature base: 1267). Sign-agreement (lane net sign vs forward-return sign, both readable): 573/1202 = 47.7% (mature base: 268/645 = 41.6%).

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 365 [40%] | 337 [37%] | 200 [22%] | 902 | 1.17% | 0.85% |
| **level** | 190 [29%] | 291 [44%] | 175 [27%] | 656 | 0.47% | -0.10% |
| **against** | 429 [46%] | 297 [32%] | 208 [22%] | 934 | 1.42% | 1.42% |
| *all windows* | 984 | 925 | 583 | 2492 | 1.08% | 0.69% |

Confusion table — mature base (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 122 [48%] | 81 [32%] | 51 [20%] | 254 | 1.62% | 1.69% |
| **level** | 117 [34%] | 130 [37%] | 101 [29%] | 348 | 0.77% | -0.03% |
| **against** | 326 [49%] | 193 [29%] | 146 [22%] | 665 | 1.76% | 1.79% |
| *all windows* | 565 | 404 | 298 | 1267 | 1.46% | 1.34% |

### MIN1, horizon 60td (flat band ±5.60%)

Joinable windows: **2452** of 2512 (mature base: 1227). Sign-agreement (lane net sign vs forward-return sign, both readable): 338/837 = 40.4% (mature base: 169/508 = 33.3%).

Confusion table — all windows (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 233 [26%] | 588 [65%] | 81 [9%] | 902 | 2.24% | 1.42% |
| **level** | 207 [32%] | 379 [58%] | 70 [11%] | 656 | 2.53% | 2.19% |
| **against** | 418 [47%] | 371 [41%] | 105 [12%] | 894 | 5.42% | 4.98% |
| *all windows* | 858 | 1338 | 256 | 2452 | 3.48% | 2.95% |

Confusion table — mature base (n per cell; row share in brackets):

| Model ↓ / Move → | up | flat | down | n | mean ret | median ret |
|---|---|---|---|---|---|---|
| **for** | 99 [39%] | 131 [52%] | 24 [9%] | 254 | 3.86% | 4.17% |
| **level** | 123 [35%] | 179 [51%] | 46 [13%] | 348 | 2.75% | 1.99% |
| **against** | 315 [50%] | 240 [38%] | 70 [11%] | 625 | 6.22% | 5.85% |
| *all windows* | 537 | 550 | 140 | 1227 | 4.75% | 4.40% |

## Honesty notes

1. **Thin lanes, stated (never interpolated):** no lane is unread in most windows under either rule (the per-lane tables above carry the measured shares; the stress lane's sparse voters — gold-silver monthly, cftc 1 point — sit beside two dense weekly/daily voters, so the lane itself stays readable; the dollar lane ran 2-voter after us-japan-10y-gap's backfill left the stored window).
2. **The corpus is the 2026-11-03 re-check refresh** (19 archive days; the rolling ~10-year history window trimmed the head and dropped the 2026-10-31 Saturday seed point — windows 2,514 → 2512, recorded in BACKTEST-GOLD.md). The us-japan-10y-gap monthly backfill left the stored stage window, so the dollar lane effectively ran 2-voter and us-japan-10y-gap fired in 0 windows.
3. **No forecasting edge is claimed** — for either rule, for the consolidated balance, or for the frozen tables. The measured record over this corpus (BACKTEST-GOLD.md, mature base: sign-agreements 46.8 / 42.2 / 32.7% at 5/20/60td, all departing below the coin; headwind windows rose MORE than tailwind windows at 20td/60td) is the standing reality the round-55 honest note describes: the gold panel reads conditions, not direction.
4. **Every cell carries n.** The beam-angle band edges, the flip window and the two criteria were fixed before the run (02 §6 + this file's definitions paragraph); the decision above is mechanical, computed from the tables, and would fall the same way for any observer with the same corpus.

