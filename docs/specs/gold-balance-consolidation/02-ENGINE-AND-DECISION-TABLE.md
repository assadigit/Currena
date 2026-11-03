# 02. Engine and decision table

## 1. Placement and discipline

- New pure module: `packages/insights/src/gold-balance.ts`, exported from
  `packages/insights/src/index.ts`. Platform-free (AGENTS.md rule 2).
- It **imports** `GOLD_LANE_VOTERS`, `GOLD_LANES`, `GoldLane` and the voter
  readable rule from `gold-score.ts`, and `evalLeg` from `connections.ts`.
  It **does not edit** `gold-score.ts`, `goldSummary`, `GoldSummarySchema`,
  or any harness file (D-GB-9). The 21-voter table stays the single source
  of truth for which indicator belongs to which lane and with which polarity.
- Zero new fetches, zero new KV keys, zero new wire fields. The balance is
  derived in the SPA from the readings the page already holds, exactly like
  the voter list is today (the "one function, no drift" contract).

## 2. Types

```ts
export type GoldBalanceSide = 'for' | 'against' | 'neutral' | 'unread';

export interface GoldBalanceMember {
  id: IndicatorId;
  /** Gold-direction of this voter. 'steady' = readable, not firing. */
  impact: 'supports' | 'pressures' | 'steady' | 'unread';
  /** Evidence from evalLeg, only when impact is supports/pressures. */
  evidence: 'rising' | 'falling' | 'high' | 'low' | null;
}

export interface GoldBalanceLane {
  lane: GoldLane;                 // fixed order: GOLD_LANES
  side: GoldBalanceSide;
  /** true when side is 'neutral' because supports === pressures > 0. */
  split: boolean;
  readable: number;               // voters readable
  firing: number;                 // supports + pressures
  supports: number;
  pressures: number;
  members: GoldBalanceMember[];   // every voter of the lane, table order
}

export interface GoldBalanceReading {
  lanes: GoldBalanceLane[];       // exactly 4
  counts: { for: number; against: number; neutral: number; unread: number };
  net: number;                    // for - against
  readable: number;               // for + against + neutral
}

export const GOLD_LANE_MIN_FIRING = 2;   // D-GB-3 (calibration fallback: 1)
export const GOLD_LANE_STRONG = 3;       // Outlook strong bar (01 §5.2)

export function goldBalance(readings: readonly IndicatorReading[]): GoldBalanceReading;
```

Naming note: the engine uses `supports` / `pressures` (the Balance's own
vocabulary, "factors supporting / pressuring gold's price"). The words
tailwind / headwind remain only inside the frozen engine and `goldSummary`.

## 3. Algorithm

For each lane in `GOLD_LANES`:

1. For each voter of the lane in table order:
   - Not readable (missing, `stale`, `check-pending`, `unavailable`): `unread`.
   - `leg = evalLeg(id, reading)`. `leg.lean === 0`: `steady`.
   - Else `impact = leg.lean * polarity === 1 ? 'supports' : 'pressures'`;
     `evidence` as in the frozen engine (rising, falling, else high, else low).
2. `readable` = members not `unread`. `firing` = supports + pressures.
3. Lane side:
   - `readable === 0`: `unread`.
   - `firing < GOLD_LANE_MIN_FIRING`: `neutral`, `split = false`.
   - `supports > pressures`: `for`. `pressures > supports`: `against`.
   - `supports === pressures`: `neutral`, `split = true`.
4. `counts`, `net`, `readable` over the 4 lane sides.

`unread` (nothing could be read) and `neutral` (readable, nothing firing or
split) are never merged. This fixes problem P5.

Properties the tests must pin: deterministic and order independent for
readings; never throws on missing readings; a lane of all-stale voters is
`unread`; adding a stale voter never changes the side of a lane.

## 4. The voter table and the rule per indicator (the decision table)

All 21 voters use the **same** evaluator: `evalLeg` (a 30 day move beyond the
per-leg minimum `SIGNAL_LEG_MOVE`, else a decade-extreme level at percentile
above 0.8 or below 0.2). Polarity is taken unchanged from `GOLD_LANE_VOTERS`.
"Supports" means the lean is a favourable condition for gold's price.

| Lane | Voter id | Polarity | Rule | Note |
|---|---|---|---|---|
| Borrowing costs | `real-yield-10y` | -1 | `evalLeg` | The textbook driver. Falling or low supports. |
| | `us10y` | -1 | `evalLeg` | |
| | `us30y` | -1 | `evalLeg` | |
| | `fed-target` | -1 | `evalLeg` | |
| | `fed-expectations` | -1 | `evalLeg` | |
| | `ecb-dfr` | -1 | `evalLeg` | |
| | `yield-curve-10y2y` | -1 | `evalLeg` | Polarity is ambiguous in the frozen spec. Unchanged here (not this stream's call). |
| | `yield-curve-10y3m` | -1 | `evalLeg` | Same. |
| Dollar | `dollar-basket` | -1 | `evalLeg` | The Balance's own dollar condition. |
| | `usdjpy` | -1 | `evalLeg` | |
| | `us-japan-10y-gap` | -1 | `evalLeg` | Structurally thin (stale most windows in the backtest). |
| Market stress | `stress-stlfsi` | +1 | `evalLeg` | Replaces the index-sign rule. |
| | `nfci` | +1 | `evalLeg` | Replaces the index-sign rule. |
| | `vix` | +1 | `evalLeg` | |
| | `gold-silver` | +1 | `evalLeg` | Thin history. |
| | `cftc-gold-positioning` | -1 | `evalLeg` | One stored point: never fires today. |
| Inflation | `us-cpi-yoy` | +1 | `evalLeg` | |
| | `us-pce-core-yoy` | +1 | `evalLeg` | |
| | `euro-hicp` | +1 | `evalLeg` | |
| | `breakeven-5y5y` | +1 | `evalLeg` | Replaces the "warning status only" rule. See 4.2. |
| | `breakeven-tilt` | +1 | `evalLeg` (level leg only) | The D-5 promoted voter. Its phrase (building, fading, steady) stays in the inflation lane detail. |

### 4.1 Conflicts between the old engines, resolved

| Case | Balance (old) | Wind (old) | Consolidated rule | Visible effect |
|---|---|---|---|---|
| Dollar | `dollar-basket` only | 3 voters | 3 voters, lane rule | One firing voter (USD/JPY) no longer counts as the dollar. Needs 2. |
| Inflation expectations | `breakeven-5y5y` supportive only on warning status, never against | `evalLeg`, falling reads as pressuring | `evalLeg` for `breakeven-5y5y` and `breakeven-tilt`, as one lane member each | Falling expectations can pressure, but only counts when the lane has 2 firing voters. |
| Stress | `stlfsi`/`nfci` sign: any above 0 supports, both below 0 "against" | `evalLeg` per voter | `evalLeg` per voter | Calm (index below zero but typical) is **neutral**, no longer "against". Only a decade-low extreme reads as calm pressure. |
| Real yield | `evalLeg` | `evalLeg` | unchanged | none |
| Gold's own footing | a condition in the Outlook, excluded from the Balance | not a voter | not a voter; context line only (01 §6) | The Outlook stops being circular. |

Why calm is neutral and not "against": absence of a safe-haven bid is not a
force pushing price down. Counting it as pressure was an overclaim in the old
Balance. This is flagged to the owner in the PR description as the one
semantic change not requested explicitly (the owner can reverse it; the engine
change is one line).

### 4.2 Copy constraint kept: B-12

The old rule existed so the page never says "elevated long-run inflation
expectations" beside an indicator card reading Normal. The consolidated model
keeps that guarantee in the **copy**: the member line for `breakeven-5y5y`
shows the indicator card's own status word next to the lean phrase, and no
member line may use the word "elevated" unless the card status is `warning`.
A test pins this (04 §4).

## 5. Lane vote design: alternatives considered

| Option | Rejected because |
|---|---|
| Count all 21 voters as pan items | 21 chips is the cognitive load being removed. Borrowing costs would hold 8 of 21 (38%) of the beam. |
| Count voters, group by lane | Same weighting problem, only prettier. |
| Weight real yields extra ("the textbook driver") | Invented weights. Not supported by the backtest. |
| Keep the 4 old conditions, drop the other 17 voters | Throws away the richer evidence and leaves P2 (rule conflicts) partly unfixed. |
| Lane votes by plain majority of firing voters (min 1) | One firing voter tips a lane. Kept only as the calibration fallback (6). |
| Lane votes only when a majority of **readable** voters agree | Too strict for an 8 voter lane (5 needed). Likely always level. |

The old Balance's 4 conditions map 1:1 to the 4 lanes (real yield to
borrowing costs, expectations to inflation, stress to stress, dollar to
dollar). The consolidation upgrades each single-indicator condition to the
lane's full evidence, so users keep the mental model they already learned.

## 6. Pre-registered calibration protocol (runs before any UI work)

Purpose: choose `GOLD_LANE_MIN_FIRING` (2 default, 1 fallback) on stated
legibility criteria, never on forward returns.

Venue: the existing read-only harness (`packages/insights/scripts/gold-backtest.ts`,
`src/gold-backtest-core.ts`, the stored corpus under `packages/insights/fixtures/`).
Add the lane engine as a **new** table beside the frozen ones
(`HARNESS_GOLD_LANES_MIN2`, `HARNESS_GOLD_LANES_MIN1`). Do not alter
`HARNESS_GOLD_VOTERS_21` / `_20`.

Corpus: the same windows as the S4 report (2514 daily windows), reported both
for all windows and for the mature base (from 2021-09-23).

Reported for each rule (every cell states n):

1. Distribution of the balance state: level, tipped for, tipped against;
   and the distribution of the beam angle in bands (0, 3 to 6, 6 to 10).
2. Share of windows where a lane is `unread`, per lane.
3. Stability: day-to-day side changes of the verdict per 60 trading days,
   next to the same figure for the 21-voter net sign.
4. For lineage only (no claim): the same realised-move confusion tables as
   BACKTEST-GOLD, labelled "not used for selection".

Criteria, fixed in advance:

- C1 (not degenerate): the balance is level in at most 70% of all windows AND
  tipped fully (10 degrees, one-sided) in at most 60% of all windows.
- C2 (smoother than the old count): median verdict flips per 60 trading days
  is not higher than the 21-voter net-sign figure.
- Decision: use `MIN2` if C1 and C2 hold. Else use `MIN1` if C1 and C2 hold.
  If neither holds, stop and bring the numbers to the owner. Do not ship.

Output: `docs/insights/BACKTEST-GOLD-LANES.md` (new file), plus a short
section appended to `GOLD_BACKTEST_SPEC.md` recording the decision. The
conclusion line must restate that no forecasting edge is claimed.

If the measured shares show a lane that is `unread` in most windows (the
stress lane is expected to run thin in the early corpus), say so; do not
interpolate.

## 7. Public API summary

| Export | Kind | Notes |
|---|---|---|
| `goldBalance(readings)` | pure fn | The consolidated reading |
| `GOLD_LANE_MIN_FIRING`, `GOLD_LANE_STRONG` | consts | Thresholds above |
| types `GoldBalanceReading`, `GoldBalanceLane`, `GoldBalanceMember`, `GoldBalanceSide` | types | |
| `goldTailwindScore`, `goldSummaryOf`, `modelVsReality` | unchanged | Frozen. Still used by ingest and the recheck. |

`packages/insights/src/gold-balance.test.ts` is the unit test home (04 §4).
