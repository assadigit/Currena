# 03 — Logic and data spec

**Context:** pure presentation logic for the gold and silver cards. It reads the factor states the page already computes. It does not change how those states are computed.

## Rules for the agent
1. Find where the current card gets its factor states, values, "couldn't read" list and price-footing state. Reuse them.
2. Add the logic below as one pure function (no DOM, no fetch). Put it in the repo's usual place for utilities. `reference/lean-logic.js` is the reference implementation and `reference/lean-logic.test.js` holds the tests. Port both to the repo's language and test runner, or reuse them as they are.
3. Add new fields to the existing data only when a field is missing (see "Fields"). Do not add network calls.

## Fields per asset
```ts
type FactorState = "supports" | "pressures" | "neutral" | "unread";
type Asset = {
  id: "gold" | "silver";
  price: number; priceCurrency: "USD";
  rangePos10y: number;            // 0..1 position of price inside its 10-year range
  change30dPct: number;           // signed, e.g. -5.31
  footing: "holding" | "fading" | "mixed";   // from the existing price-footing state
  asOf: string;                   // ISO time of the newest reading
  sourcesCount: number;
  factors: Factor[];              // drivers only; price is NOT a factor
};
type Factor = {
  id: string; name: {en:string; fa:string};
  state: FactorState;
  value?: number; unit?: "%" | "idx" | "pts";
  rangePos?: number;              // 0..1, position within the usual range
  asOf?: string; source?: string;
  unreadReason?: "source_unavailable" | "stale" | "not_available_yet";
  lastKnown?: { value:number; asOf:string };
  flip?: { dir: "below" | "above"; at: number };   // only if the existing config defines the threshold
};
```
Gold drivers: real yields, inflation expectations, market stress, US dollar (total 4).
Silver drivers: the same four plus industrial demand (total 5).
Map the old "Price footing" rows to `footing`. Map the old "Couldn't read" chips to factors with `state: "unread"`.

## Derived values (the function)
Input: the `factors` array. Output: object below.
```
total    = factors.length
S, P, N, U = counts of supports, pressures, neutral, unread
read     = total - U
need     = ceil(0.75 * total)
enough   = read >= need
net      = P - S                       // > 0 means pressures heavier
mag      = (enough and net != 0) ? min(7, 3 + 1.5 * (abs(net) - 1)) : 0   // degrees
tilt     = sign(net) * mag             // degrees, positive = pressures lower
coverage = read / total
confidence = coverage == 1 ? "high" : coverage >= 0.75 ? "medium" : "low"
verdict:
  not enough  → "insufficient"                          (enough == false)
  nothing read → "none"                                 (read == 0)
  net == 0    → "balanced"
  else side = net > 0 ? "against" : "for"
       strength = abs(net) == 1 ? "slight" : abs(net) == 2 ? "lean" : "strong"
       → verdict = strength + "_" + side
```
`enough == false` takes priority over the lean. `none` takes priority over `insufficient`.

## Flip line
```
if enough and net != 0:
  heavier = net > 0 ? pressures : supports
  candidates = heavier factors that have flip and a numeric value
  pick the one with the smallest abs(value - flip.at) / max(abs(flip.at), 1e-9)
  text key = abs(net) == 1 ? "flip_balance" : "flip_ease"
else: no line
```

## Test vectors (gold, total 4, need 3)
| # | P | S | N | U | read | enough | net | tilt° | verdict | confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 0 | 0 | 3 | 1 | no | 1 | 0 | insufficient | low |
| 2 | 1 | 0 | 2 | 1 | 3 | yes | 1 | 3 | slight_against | medium |
| 3 | 2 | 1 | 1 | 0 | 4 | yes | 1 | 3 | slight_against | high |
| 4 | 3 | 1 | 0 | 0 | 4 | yes | 2 | 4.5 | lean_against | high |
| 5 | 4 | 0 | 0 | 0 | 4 | yes | 4 | 7 | strong_against | high |
| 6 | 2 | 2 | 0 | 0 | 4 | yes | 0 | 0 | balanced | high |
| 7 | 0 | 3 | 0 | 1 | 3 | yes | -3 | -6 | strong_for | medium |
| 8 | 0 | 0 | 0 | 4 | 0 | no | 0 | 0 | none | low |
Silver (total 5, need 4):
| # | P | S | N | U | read | enough | net | tilt° | verdict | confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 9 | 2 | 1 | 1 | 1 | 4 | yes | 1 | 3 | slight_against | medium |
| 10 | 1 | 1 | 1 | 2 | 3 | no | 0 | 0 | insufficient | low |

## Staleness
If the repo already marks stale data, keep that. If it does not, treat a reading as unread with reason `stale` when its age exceeds 3 days (daily series) or 10 days (weekly series). Show the last known value in the row.

## Data handling
1. Round displayed values: 2 decimals for yields and percentages, no decimals for prices above 1000, 2 decimals below.
2. Use the existing KV reads. Do not add new reads for this card.
3. Escape all text rendered into the DOM.
