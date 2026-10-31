# 01. Master spec: one balance for gold

## 1. Problem

The gold card on `/insights` shows the same question through two metaphors
and two engines:

| | Gold Balance | Wind meter ("Gold tailwind score") | Outlook card |
|---|---|---|---|
| Code | `BalanceScale.tsx` fed by `signals.ts` | `gold-score.ts`, `GoldTailwindPanel.tsx` | `verdict.tsx` `outlookOf()` |
| Inputs | 4 conditions | 21 voters in 4 lanes | 5 conditions (the 4, plus gold's own 30-day move) |
| Rule per indicator | Mixed: `evalLeg` for real yield and dollar; a status rule for expectations; an index-sign rule for stress | `evalLeg` for every voter | Same as the Balance, plus footing |
| 2026-10-31 reading | Balanced, beam level | Headwind, net -2, 6 of 21 firing | Bearish |

Audited problems (2026-10-31, evidence in the chat audit and
`BACKTEST-GOLD.md`):

- P1. Two metaphors double the cognitive load for the same answer.
- P2. The engines disagree on shared indicators. Dollar: Balance neutral, wind
  "strong". Inflation expectations: Balance neutral, wind headwind. Stress:
  Balance "against" (both indexes below zero), wind "no read".
- P3. The Outlook "Bearish" is partly circular: footing is "against" whenever
  gold's own 30-day change is negative, then the card says gold may fall.
- P4. The wind meter's equal-voter count is dominated by borrowing costs (8 of
  21 voters, highly collinear).
- P5. The wind meter's "no read" conflates "nothing readable" with "readable
  but steady".
- P6. The model has no measured edge (mature base 2021 to 2026: sign agreement
  46.8%, 42.5%, 32.7% at 5, 20, 60 trading days; 60 day headwind windows rose
  5.94% on average versus 2.85% for tailwind). The wind metaphor implies a
  push on future price that the data does not support.

## 2. Goal

One instrument for gold: the Balance. It answers one question:

> Which of the main macro conditions lean for gold's price today, which lean
> against it, and which do not lean?

It does not answer "where will gold go".

## 3. Principles

1. **One metaphor.** The balance is the only gold instrument. No wind icon, no
   "tailwind", "headwind", or net-score number in the UI.
2. **One rule per indicator.** Every indicator is read once, by the shared
   evaluator, with one polarity. No view re-reads an indicator by its own rule.
3. **Equal weight per lane.** Four lanes, one vote each. No invented weights
   (the `BalanceScale.tsx` rule "never fabricate" stands).
4. **Honest about thin evidence.** One firing voter never moves a lane. The
   counts line always says how much evidence stands behind the beam.
5. **Conditions, not forecast.** The copy, the footnote and the Outlook card
   describe conditions. Price is shown as context and never counted as evidence.
6. **Additive and frozen lineage.** The new engine is a new module. The frozen
   20/21-voter engine, `goldSummary` and the harness keep working untouched.
7. **No hidden data.** Every voter the wind meter showed stays reachable, one
   tap from its lane chip.

## 4. The consolidated model (summary; precise rules in 02)

```
21 voters --evalLeg--> lean per voter (for gold / against / steady / unread)
   |
   +-- grouped into 4 lanes (borrowing costs, dollar, market stress, inflation)
          |
          +-- lane vote: for | against | neutral (steady or split) | unread
                 |
                 +-- balance: lanes on the for pan, the against pan,
                     the neutral tray, the unread tray
                        |
                        +-- beam angle, verdict word, counts line
                        +-- gold Outlook card (derived)
```

A lane chip is a pan item. Its tally ("3 of 8 drivers firing") and, when the
lane is split, its split ("2 for, 2 against") are visible on the chip. Its
members are in the detail panel.

## 5. The verdict

### 5.1 Balance verdict (unchanged words)

`net = lanesFor - lanesAgainst`. Verdict word: `verdictFor`, `verdictBalanced`,
`verdictAgainst`, `verdictNone` (all four lanes unread). Beam angle:
`|net| / (for + against) x 10 degrees`, clamped to [3, 10], level when
`net = 0`, level with the not-enough line when fewer than 3 lanes are readable
(the existing UI-40 rule, readable = for + against + neutral).

### 5.2 Outlook card (derived)

Let `L` = lanes for, `A` = lanes against, over the 4 lanes.

1. All four lanes unread: no outlook (`null`, the existing "nothing could be read").
2. `L >= 3`: `strong-bullish`. `A >= 3`: `strong-bearish`.
   (3 of 4 mirrors today's "4 of 5" bar. Constant `GOLD_LANE_STRONG = 3`.)
3. Range evidence (unchanged): gold's `|30-day change| < 2%` and its 10 year
   position is in the typical band, and `|L - A| <= 1`: `range-bound`.
   This uses price only to describe consolidation, never as direction.
4. `L == A`: `mixed` if `L > 0`, else `neutral`.
5. Otherwise `bullish` if `L > A`, else `bearish`.

Footing no longer counts anywhere in this function. Silver's Outlook is not
changed (OI-4).

## 6. Footing as context

Under the verdict box, one non-voting line: "Gold over the last 30 days:
{change}. Shown for context. It is not counted in the balance." Source:
`gold-usd` `change30d`. Hidden when the value is missing. This replaces the
model-vs-reality chip: the user still sees what price did, without a second
metaphor and without a "model was right/wrong" implication.

## 7. Worked example (hand computed from the 2026-10-31 live snapshot)

Voters firing, from the wind panel HTML supplied by the owner:

| Lane | Firing voters | Result under D-GB-3 (min 2 firing) |
|---|---|---|
| Borrowing costs | real yields falling (+), US 10y falling (+), US 30y high (-), Fed expectations high (-) | 2 vs 2: split, neutral tray |
| Dollar | USD/JPY high (-) | 1 firing: neutral |
| Market stress | none | neutral (assuming readable) |
| Inflation | 5y5y falling (-) | 1 firing: neutral |

`L = 0`, `A = 0`: the balance is level, verdict "Balanced", 4 neutral.
Outlook: `neutral`, or `range-bound` if gold's 30-day move is under 2% and its
position is typical. Today's page shows Balance "Balanced" and Outlook
"Bearish"; the consolidated result is a single, consistent "Balanced / Neutral".

If the minimum were 1 (the fallback rule L1 in 02 §6), the dollar and
inflation lanes would each vote against, and the beam would tip the full 10
degrees against gold on two single-voter lanes. That is the overclaim D-GB-3
prevents. The numbers above must be reproduced by a fixture test (04 §4).

Expected consequence for users: the page will say "Neutral" on days when it
used to say "Bearish" because gold had fallen. The price chart directly above
still shows the fall. This is intended.

## 8. Honesty rules (binding)

1. The heading, subtitle and footnote say the balance describes today's
   conditions and is not a forecast.
2. The measured note and the "Read the full backtest" link stay on the card
   and visible without a tap (reuse `signals.goldScore.measuredNote*` copy).
3. No UI word implies a push on future price ("tailwind", "headwind", "wind").
4. No colour-only meaning (existing rule): every state has a word and an icon.
5. Any change to a lane rule, a polarity or a threshold goes through the
   harness (02 §6) and an owner round. Results never silently edit the table
   (`GOLD_BACKTEST_SPEC.md` rule).

## 9. Non-goals

Forecasting. Weighting lanes or voters. New indicators. Changing silver.
Replacing the beam geometry. Removing `goldSummary`.
