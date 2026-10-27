# Layer 1 — Copy review (factual-claims register)

Per spec §11: a table of every factual claim in the Layer-1 copy — each
`ifRising`, `ifFalling`, each `connection`, each `australiaAngle` — with its
strength and the plain basis ("widely taught: …"). Claims that are
Australia-specific or less-certain are marked **needs expert check** so the
owner may have a qualified person review them.

**Status key:** `widely-taught` (mainstream macro textbook relationship),
`australia-specific` (AU-only relationship), `less-certain` (softened +
`sometimes` strength in the copy), `needs-expert-check` (flagged for human review).

**Strength** matches the copy's `connection.strength`: `reliable` /
`usually` / `sometimes`.

The claims below are written **by indicator, as the copy lands**. This file
is filled in incrementally as each batch ships; entries marked `— pending —`
are written when that indicator's copy is written. The owner can stop at any
row and have a reviewer verify the basis column against a standard macro
textbook (e.g. Mankiw, Mishkin) or the RBA's own statements.

---

## Batch 1 — borrowing-costs (8 indicators)

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `yield-curve-10y2y` | ifRising | A widening gap (steepening) usually accompanies growth or inflation pressure. | — | widely-taught: a normal upward-sloping curve reflects growth/inflation expectations | widely-taught |
| `yield-curve-10y2y` | ifFalling | A small/negative gap (inversion) has preceded most US recessions. | — | widely-taught: the inverted yield curve is the canonical recession predictor (Fed NY Lit. J. Kim/Vigfusson) | widely-taught |
| `yield-curve-10y3m` | ifRising | A steep 10y−3m curve usually comes with growth or inflation pressure. | — | widely-taught (same as 10y2y; the 3m leg is the Fed's preferred recession gauge) | widely-taught |
| `yield-curve-10y3m` | ifFalling | Deep 3m inversions have preceded every modern US recession. | — | widely-taught (Fed research, Engstrom & Sharpe 2018) | widely-taught |
| `us10y` | ifRising | Higher 10y yields usually mean home-loan and business-credit rates follow, with a lag. | — | widely-taught: the 10y Treasury is the benchmark for mortgage and corporate rates | widely-taught |
| `us10y` | ifFalling | Lower 10y yields are usually supportive for loans and asset prices. | — | widely-taught: lower discount rates raise present values | widely-taught |
| `us30y` | ifRising | Higher long yields usually mean mortgages and long-dated borrowing cost more. | — | widely-taught: the 30y anchors US mortgage pricing | widely-taught |
| `us30y` | ifFalling | Lower long yields usually ease mortgages and long borrowing. | — | widely-taught | widely-taught |
| `real-yield-10y` | ifRising | Higher real yields tend to make non-interest assets (like gold) less attractive. | — | widely-taught: higher real yields raise the opportunity cost of holding non-yielding assets | widely-taught |
| `real-yield-10y` | ifFalling | Lower real yields tend to make non-interest assets more attractive. | — | widely-taught (inverse of above) | widely-taught |
| `fed-target` | ifRising | A higher Fed target usually means loans and mortgages cost more and saving pays more. | — | widely-taught: the policy rate is the floor for retail lending and savings rates | widely-taught |
| `fed-target` | ifFalling | A lower Fed target usually eases loans and mortgages and pays savers less. | — | widely-taught (inverse) | widely-taught |
| `ecb-dfr` | ifRising | A higher ECB deposit rate usually tightens euro-area loans and pays savers more. | — | widely-taught: the DFR is the ECB's main policy lever | widely-taught |
| `ecb-dfr` | ifFalling | A lower ECB deposit rate usually eases euro-area loans and pays savers less. | — | widely-taught (inverse) | widely-taught |
| `fed-expectations` | ifRising | When markets price higher Fed rates, borrowing costs usually rise before the move. | — | widely-taught: the 2y Treasury embeds rate expectations and leads the policy move | widely-taught |
| `fed-expectations` | ifFalling | When markets price lower Fed rates, borrowing costs usually ease before the move. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 1)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `yield-curve-10y2y` | `recession-probability` | The two curve legs and the recession-probability model tell the same story from different angles. | usually | widely-taught: same underlying recession signal | widely-taught |
| `yield-curve-10y3m` | `recession-probability` | Same as above, the 3m leg is the Fed's preferred angle. | usually | widely-taught | widely-taught |
| `us10y` | `mortgage-30y` | The 10y Treasury is the benchmark the 30y mortgage follows. | reliable | widely-taught: mortgage pricing is anchored to the 10y Treasury | widely-taught |
| `us10y` | `real-yield-10y` | The nominal yield is roughly the real yield plus expected inflation. | reliable | widely-taught (Fisher relation) | widely-taught |
| `us30y` | `mortgage-30y` | The 30y Treasury is the longest mortgage-pricing anchor. | reliable | widely-taught | widely-taught |
| `real-yield-10y` | `gold-usd` | Higher real yields tend to weigh on gold. | usually | widely-taught: higher real yields raise the opportunity cost of gold | widely-taught |
| `fed-target` | `us10y` | The policy rate anchors the short end; the 10y carries the long expectation. | reliable | widely-taught: the term structure | widely-taught |
| `ecb-dfr` | `euro-aaa-10y` | The DFR anchors the short end of the euro curve. | reliable | widely-taught | widely-taught |
| `fed-expectations` | `fed-target` | The 2y-implied path is the market's reading of where the Fed goes. | usually | widely-taught: expectations hypothesis | widely-taught |

### Australia angle (batch 1)
| id | claim | basis | status |
|---|---|---|---|
| `us10y` | Australian mortgages and the AUD feel higher US yields through global rate co-movement. | australia-specific: AU long rates move with US long rates | needs-expert-check |
| `us30y` | (none — direction effects are global; AU angle carried by `us10y`.) | — | — |
| `fed-target` | The Fed's moves set the tone for global rates, including what the RBA can credibly do. | australia-specific: the RBA watches the Fed's stance | needs-expert-check |
| `real-yield-10y` | High US real yields tend to pressure the AUD and gold. | australia-specific: real-yield differentials move the AUD | needs-expert-check |

---

## Batch 2 — borrowing-costs rest A (7 indicators)

_Indicators: govt-interest-revenue, us-2y, sofr, mortgage-30y, jgb-10y, bund-10y, gilt-10y_
_(the remaining borrowing-costs ids — euro-aaa-10y, boe-rate, boj-rate — land in batch 3)_

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `govt-interest-revenue` | ifRising | A bigger interest slice usually sharpens US budget fights. | — | widely-taught: interest crowding-out of other spending is standard public-finance | widely-taught |
| `govt-interest-revenue` | ifFalling | A smaller slice usually leaves more room for other spending. | — | widely-taught (inverse) | widely-taught |
| `us-2y` | ifRising | A rising 2y usually means markets price higher Fed rates; near-term borrowing follows. | — | widely-taught: the 2y Treasury embeds policy expectations (expectations hypothesis) | widely-taught |
| `us-2y` | ifFalling | A falling 2y usually means markets price lower Fed rates, earlier borrower relief. | — | widely-taught (inverse) | widely-taught |
| `sofr` | ifRising | Daily-reset (floating) loans usually get more expensive when overnight money rises. | — | widely-taught: SOFR is the base rate for floating-rate lending | widely-taught |
| `sofr` | ifFalling | Cheaper overnight money usually eases short-term borrowing. | — | widely-taught (inverse) | widely-taught |
| `mortgage-30y` | ifRising | Higher mortgage rates raise new-loan payments and price buyers out. | — | widely-taught: payment-vs-rate arithmetic; approved copy says each point cuts borrowing power roughly 10% | widely-taught |
| `mortgage-30y` | ifFalling | Cheaper mortgages let buyers borrow more. | — | widely-taught (inverse) | widely-taught |
| `jgb-10y` | ifRising | Rising Japanese yields usually pull cheap Japanese money home; world markets feel it. | — | widely-taught: Japan's saver scale + the carry trade's funding leg | widely-taught |
| `jgb-10y` | ifFalling | Cheap Japanese money usually stays available to world borrowers. | — | widely-taught (inverse; three decades of near-zero JGBs) | widely-taught |
| `bund-10y` | ifRising | German yields usually raise borrowing costs across Europe. | — | widely-taught: the Bund is the euro-area benchmark | widely-taught |
| `bund-10y` | ifFalling | Falling Bunds usually ease European borrowing. | — | widely-taught (inverse) | widely-taught |
| `gilt-10y` | ifRising | UK mortgages and business loans usually get dearer with gilts. | — | widely-taught: gilts steer UK fixed-rate mortgage pricing | widely-taught |
| `gilt-10y` | ifFalling | Cheaper gilts usually help UK loans and house prices. | — | widely-taught (inverse; 2022 mini-budget episode) | widely-taught |

### Connections (batch 2)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `govt-interest-revenue` | `us10y` | Higher long rates raise the government's interest bill over time. | usually | widely-taught: debt rolls over at prevailing rates | widely-taught |
| `us-2y` | `fed-expectations` | The Fed-expectations card is built from the 2y rate. | reliable | definitional (approved copy: DGS2 minus the policy midpoint) | widely-taught |
| `us-2y` | `yield-curve-10y2y` | The 2y is the short leg of the 10y−2y gap. | reliable | definitional | widely-taught |
| `sofr` | `fed-target` | SOFR normally sits just under the top of the Fed's target range. | reliable | widely-taught: SOFR's normal corridor behaviour (Sept 2019 the famous exception) | widely-taught |
| `mortgage-30y` | `us10y` | The 30y mortgage follows the 10y Treasury. | reliable | widely-taught: mortgage pricing anchored to the 10y | widely-taught |
| `mortgage-30y` | `fed-target` | Policy reaches the mortgage through the long end, with a delay. | usually | widely-taught: transmission chain | widely-taught |
| `jgb-10y` | `us-japan-10y-gap` | The US-Japan gap card is built from the JGB rate. | reliable | definitional | widely-taught |
| `jgb-10y` | `boj-rate` | The BoJ still leans heavily on the JGB market. | usually | widely-taught: yield-curve-control history, BoJ holdings | widely-taught |
| `bund-10y` | `euro-aaa-10y` | The daily euro AAA rate and the monthly Bund mirror tell one story. | usually | widely-taught: both are the euro safe long rate (approved copy notes the monthly lag) | widely-taught |
| `bund-10y` | `ecb-dfr` | The ECB's policy rate is the base the Bund floats above. | usually | widely-taught: term structure | widely-taught |
| `gilt-10y` | `boe-rate` | The BoE sets the short base; the gilt is the market's long rate. | usually | widely-taught: term structure | widely-taught |

### Australia angle (batch 2)
| id | claim | basis | status |
|---|---|---|---|
| (none — batch 2 ids are US/EA/JP/UK borrowing costs with no direct AU household link per D-08.) | — | — | — |

---

## Batch 3 — (pending)

_Indicators: euro-aaa-10y, boe-rate, boj-rate, dollar-basket, usdjpy, us-japan-10y-gap, eur-usd, usdtry_

— pending — fill in when batch 3 copy is written.
