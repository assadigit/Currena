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

## Batch 3 — borrowing-costs B + dollar-strength (8 indicators)

_Indicators: euro-aaa-10y, boe-rate, boj-rate, dollar-basket, usdjpy, us-japan-10y-gap, eur-usd, usdtry_
_(borrowing-costs is now complete at 18/18; dollar-strength complete at 5/5)_

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `euro-aaa-10y` | ifRising | Rising safe euro long rates make European loans dearer. | — | widely-taught: the AAA long rate floors euro lending | widely-taught |
| `euro-aaa-10y` | ifFalling | Cheap safe money eases European loans and asset prices. | — | widely-taught (inverse) | widely-taught |
| `boe-rate` | ifRising | A higher Bank Rate makes UK loans/mortgages dearer, saving pays more. | — | widely-taught | widely-taught |
| `boe-rate` | ifFalling | A lower Bank Rate eases UK borrowing; saving pays less. | — | widely-taught (inverse) | widely-taught |
| `boj-rate` | ifRising | Tightening BoJ pulls cheap Japanese money home; world markets shake at times. | — | widely-taught (2024–26 hikes episode) | widely-taught |
| `boj-rate` | ifFalling | Near-zero BoJ policy stays easy fuel for world borrowing. | — | widely-taught (1999–2024 era) | widely-taught |
| `dollar-basket` | ifRising | A stronger dollar pressures world prices, debts, other currencies. | — | widely-taught: dollar pricing of trade/commodities/debt | widely-taught |
| `dollar-basket` | ifFalling | A weaker dollar eases world trade and debt pressure. | — | widely-taught (inverse) | widely-taught |
| `usdjpy` | ifRising | Japanese goods/travel get cheaper for other-currency holders. | — | widely-taught (mechanical purchasing-power effect) | widely-taught |
| `usdjpy` | ifFalling | A rising yen often means worry; borrowed yen moves home fast. | — | widely-taught: yen-strength = de-risking/carry unwind (2008, Aug 2024) | widely-taught |
| `us-japan-10y-gap` | ifRising | A wider gap grows the reward for the cheap-yen trade. | — | widely-taught: the gap is the carry trade's fuel | widely-taught |
| `us-japan-10y-gap` | ifFalling | A narrow gap pays the trade less; its retreat can shake markets. | — | widely-taught (Aug 2024 unwind) | widely-taught |
| `eur-usd` | ifRising | A stronger dollar vs the euro often pressures world prices. | — | widely-taught (same dollar-strength channel) | widely-taught |
| `eur-usd` | ifFalling | A weaker dollar eases world price/trade pressure. | — | widely-taught (inverse) | widely-taught |
| `usdtry` | ifRising | Lira slides make Turkish imports dearer. | — | widely-taught: pass-through of depreciation | widely-taught |
| `usdtry` | ifFalling | A firmer lira means calmer inflation, rare stability. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 3)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `euro-aaa-10y` | `ecb-dfr` | The ECB policy rate anchors the short end; this is the safe long end. | reliable | widely-taught: term structure | widely-taught |
| `euro-aaa-10y` | `bund-10y` | The German monthly mirror tells the same story with a delay. | usually | widely-taught (approved copy documents the monthly lag) | widely-taught |
| `boe-rate` | `gilt-10y` | Bank sets the short rate; gilts carry the long one. | usually | widely-taught: term structure | widely-taught |
| `boj-rate` | `jgb-10y` | The BoJ steers the 10-year bond market heavily. | usually | widely-taught: YCC history, BoJ holdings | widely-taught |
| `boj-rate` | `usdjpy` | The yen moves with what the BoJ does. | usually | widely-taught | widely-taught |
| `dollar-basket` | `gold-usd` | A stronger dollar often weighs on gold. | usually | widely-taught (inverse dollar-gold relationship) | widely-taught |
| `dollar-basket` | `eur-usd` | The euro is the biggest weight in the basket. | reliable | definitional (basket construction) | widely-taught |
| `usdjpy` | `us-japan-10y-gap` | The rate gap is the reward keeping the yen carry trade alive. | reliable | widely-taught (approved wording) | widely-taught |
| `usdjpy` | `boj-rate` | The BoJ's rate is the yen's home base. | usually | widely-taught | widely-taught |
| `us-japan-10y-gap` | `usdjpy` | Dollar-yen is the trade; the gap is its fuel line. | reliable | widely-taught (approved wording) | widely-taught |
| `us-japan-10y-gap` | `us10y` | The US side of the gap is the 10y Treasury. | reliable | definitional | widely-taught |
| `us-japan-10y-gap` | `jgb-10y` | The Japan side is the 10y JGB. | reliable | definitional | widely-taught |
| `eur-usd` | `dollar-basket` | The euro is the biggest single basket weight. | reliable | definitional | widely-taught |
| `eur-usd` | `fed-target` | The Fed steers the dollar side; the ECB the euro's. | usually | widely-taught: policy differentials move FX | widely-taught |
| `usdtry` | `dollar-basket` | Turkey is outside the big-currency basket; lira trouble often comes with a strong dollar. | sometimes | less-certain: EM stress often coincides with dollar strength but not always | less-certain |

### Australia angle (batch 3)
| id | claim | basis | status |
|---|---|---|---|
| `dollar-basket` | A stronger US dollar usually weighs on the AUD and commodity prices. | australia-specific: AUD vs USD inverse; USD commodity pricing | needs-expert-check |
| `usdjpy` | Yen surges on worry usually sag the AUD with other risk currencies. | australia-specific: AUD as a risk currency; AUD/JPY risk barometer | needs-expert-check |
| `us-japan-10y-gap` | A fast-narrowing gap often weakens the AUD with other carry favorites. | australia-specific: AUD is a classic carry target vs JPY | needs-expert-check |

---

## Batch 4 — growth-health A (8 indicators)

_Indicators: us-unemployment, sahm-rule, china-pmi, china-cpi, copper-gold, michigan-sentiment, initial-jobless-claims, philly-fed_

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `us-unemployment` | ifRising | A steady climb usually means a cooling US economy and softer pay rises. | — | widely-taught: Okun's law territory | widely-taught |
| `us-unemployment` | ifFalling | Falling joblessness usually means a strong jobs market, steadier pay growth. | — | widely-taught (inverse) | widely-taught |
| `sahm-rule` | ifRising | A fast rise usually means a downturn has already started. | — | widely-taught: the Sahm rule's documented record since 1970 | widely-taught |
| `sahm-rule` | ifFalling | A falling reading usually means the jobs market is out of alarm territory. | — | widely-taught (inverse; construction) | widely-taught |
| `china-pmi` | ifRising | Busier Chinese factories are often good news for world trade. | — | widely-taught: China's weight in world manufacturing | widely-taught |
| `china-pmi` | ifFalling | Slowing Chinese factories often weigh on world trade and commodity prices. | — | widely-taught | widely-taught |
| `china-cpi` | ifRising | Overheating in the world's factory often ripples into world goods prices. | — | widely-taught: export-price pass-through | widely-taught |
| `china-cpi` | ifFalling | Weak Chinese demand usually drags world trade and commodity prices. | — | widely-taught (2023–25 episode) | widely-taught |
| `copper-gold` | ifRising | A rising copper/gold measure usually means markets pay up for growth. | — | widely-taught: "Dr Copper" vs the fear hedge | widely-taught |
| `copper-gold` | ifFalling | A falling measure usually means money shifts to safe havens, often with slowdowns. | — | widely-taught (inverse) | widely-taught |
| `michigan-sentiment` | ifRising | Confident households usually keep spending, supporting the economy. | — | widely-taught: consumption ~2/3 of US GDP | widely-taught |
| `michigan-sentiment` | ifFalling | Gloomy households usually cut back first. | — | widely-taught (approved copy's caveat: mood is not spending) | widely-taught |
| `initial-jobless-claims` | ifRising | Rising claims usually mean layoffs are picking up — the earliest jobs-market sign. | — | widely-taught: claims are the classic high-frequency labor signal | widely-taught |
| `initial-jobless-claims` | ifFalling | Rare layoffs usually mean a tight jobs market. | — | widely-taught (inverse) | widely-taught |
| `philly-fed` | ifRising | More growing manufacturers is an early sign of US strength. | — | widely-taught: early-month diffusion survey | widely-taught |
| `philly-fed` | ifFalling | More shrinking manufacturers is an early sign of US weakness. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 4)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `us-unemployment` | `sahm-rule` | The Sahm alarm is built from the jobless rate. | reliable | definitional (approved copy: 3-month average vs 12-month low) | widely-taught |
| `us-unemployment` | `us-nfp` | Jobs added and the jobless rate come from the same monthly report. | reliable | definitional (BLS Employment Situation) | widely-taught |
| `sahm-rule` | `us-unemployment` | The alarm watches the rate's climb from its recent low. | reliable | definitional | widely-taught |
| `sahm-rule` | `recession-probability` | The model and the alarm read the same downturn from different angles. | usually | widely-taught: both are recession nowcasters | widely-taught |
| `china-pmi` | `china-cpi` | The factory pulse plus the price gauge judge Chinese demand. | usually | widely-taught: activity + prices = demand picture | widely-taught |
| `china-pmi` | `copper-usd` | Copper often moves with Chinese factory strength. | usually | widely-taught: China is the biggest copper consumer | widely-taught |
| `china-cpi` | `china-pmi` | Same pairing, from the price side. | usually | widely-taught | widely-taught |
| `copper-gold` | `copper-usd` | Copper is the growth leg of the measure. | reliable | definitional | widely-taught |
| `copper-gold` | `gold-usd` | Gold is the safety leg. | reliable | definitional | widely-taught |
| `michigan-sentiment` | `michigan-1y-expectations` | The price-worry number rides inside this survey. | reliable | definitional (approved copy) | widely-taught |
| `michigan-sentiment` | `retail-sales` | Mood often leads actual spending. | usually | widely-taught (with the approved caveat that mood ≠ spending) | widely-taught |
| `initial-jobless-claims` | `us-unemployment` | Weekly claims feed the monthly jobless rate. | reliable | widely-taught: claims flow into the unemployment stock | widely-taught |
| `initial-jobless-claims` | `sahm-rule` | Claim surges arrive long before the alarm can ring. | usually | widely-taught: the claims lead (approved copy: "weeks before monthly, months before Sahm") | widely-taught |
| `philly-fed` | `us-gdp-growth` | Factory surveys often turn before the headline growth number. | usually | widely-taught: leading behavior of diffusion surveys | widely-taught |

### Australia angle (batch 4)
| id | claim | basis | status |
|---|---|---|---|
| (none — batch 4 ids are US/China global indicators; the china-pmi/china-cpi AU relevance stays in the approved copy, and D-08's australiaAngle list does not include them.) | — | — | — |

---

## Batch 5 — growth-health B (8 indicators)

_Indicators: recession-probability, oecd-cli-us, m2-us, retail-sales, housing-permits, job-openings, us-gdp-growth, us-nfp_

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `recession-probability` | ifRising | Rising odds mean the data looks like past downturns; models trail. | — | widely-taught: the model's design (approved copy: publishes a month or two behind) | widely-taught |
| `recession-probability` | ifFalling | Falling odds read like normal expansion. | — | widely-taught (inverse) | widely-taught |
| `oecd-cli-us` | ifRising | A rising early gauge usually means improvement several months out. | — | widely-taught: the CLI's ~6-month lead (OECD convention) | widely-taught |
| `oecd-cli-us` | ifFalling | A falling gauge usually means a slowdown ahead. | — | widely-taught (inverse) | widely-taught |
| `m2-us` | ifRising | Money growth builds spending power, which can feed inflation later. | — | widely-taught with a lag caveat (monetarist long-run) | widely-taught |
| `m2-us` | ifFalling | Shrinking money has clustered around US downturns. | — | widely-taught: historical record (2022–23) | widely-taught |
| `retail-sales` | ifRising | Spending usually carries the economy. | — | widely-taught: consumption ~2/3 of GDP | widely-taught |
| `retail-sales` | ifFalling | A pullback opens the door to recession talk. | — | widely-taught | widely-taught |
| `housing-permits` | ifRising | Rising permits mean builders see enough demand. | — | widely-taught: permits = housing pipeline front | widely-taught |
| `housing-permits` | ifFalling | Shelves projects: the classic early response to expensive money. | — | widely-taught: housing is the most rate-sensitive sector | widely-taught |
| `job-openings` | ifRising | Rising openings mean employers still want workers. | — | widely-taught | widely-taught |
| `job-openings` | ifFalling | Fading openings usually lead rising joblessness. | — | widely-taught: the Powell-era leading edge (approved copy) | widely-taught |
| `us-gdp-growth` | ifRising | Faster US growth usually keeps world rates higher for longer. | — | widely-taught: growth → policy reaction function | widely-taught |
| `us-gdp-growth` | ifFalling | Weak growth brings rate-cut hopes and recession talk. | — | widely-taught (inverse) | widely-taught |
| `us-nfp` | ifRising | Strong hiring usually keeps world interest rates higher. | — | widely-taught: the jobs report moves the Fed | widely-taught |
| `us-nfp` | ifFalling | Job losses bring recession talk and rate-cut hopes. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 5)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `recession-probability` | `sahm-rule` | The alarm and the model read the same downturn from different angles. | usually | widely-taught: both are recession nowcasters | widely-taught |
| `recession-probability` | `us-gdp-growth` | The model weighs many inputs (growth among them) and publishes with a lag. | usually | widely-taught: the Chauvet model's multi-indicator design + lag | widely-taught |
| `oecd-cli-us` | `recession-probability` | Read the early gauge beside the recession odds. | usually | widely-taught: complementary horizons | widely-taught |
| `oecd-cli-us` | `initial-jobless-claims` | Claims confirm turns much faster. | usually | widely-taught: weekly vs monthly-with-lag cadence | widely-taught |
| `m2-us` | `us-cpi-yoy` | Money growth is one input in inflation debates. | sometimes | less-certain: money→inflation is a long-run, debated relationship | less-certain |
| `m2-us` | `walcl` | The central bank's balance sheet is one engine behind the money pool. | usually | widely-taught: QE expanded both (2020–22) | widely-taught |
| `retail-sales` | `michigan-sentiment` | Mood often leads this spending number. | usually | widely-taught (caveat in approved copy: mood ≠ spending) | widely-taught |
| `retail-sales` | `us-gdp-growth` | Spending is most of the US economy. | reliable | definitional (consumption share) | widely-taught |
| `housing-permits` | `mortgage-30y` | Permits are the market's answer to the mortgage rate. | usually | widely-taught: housing demand vs financing cost | widely-taught |
| `job-openings` | `us-unemployment` | Openings usually turn before the jobless rate. | usually | widely-taught (2022–24 soft-landing episode) | widely-taught |
| `job-openings` | `initial-jobless-claims` | One counts employers pulling back, the other workers let go. | usually | widely-taught (approved forYou wording) | widely-taught |
| `us-gdp-growth` | `retail-sales` | Spending is most of what GDP measures. | reliable | definitional | widely-taught |
| `us-gdp-growth` | `us-nfp` | Jobs and growth usually move together. | usually | widely-taught: Okun's law | widely-taught |
| `us-nfp` | `us-unemployment` | Both come from the same monthly jobs report. | reliable | definitional (BLS) | widely-taught |
| `us-nfp` | `fed-target` | The Fed reads this number closely. | reliable | widely-taught (the dual mandate) | widely-taught |

### Australia angle (batch 5)
| id | claim | basis | status |
|---|---|---|---|
| (none — US growth/labour indicators; no D-08 AU link.) | — | — | — |

---

## Batch 6 — growth-health C (7 indicators)

_Indicators: usdcny, michigan-1y-expectations, cfnai, oecd-cli-cn, oecd-cli-de, epu-us, copper-usd_
_(growth-health is now complete at 23/23)_

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `usdcny` | ifRising | A firmer dollar-yuan makes Chinese goods cheaper abroad; trade politics sharpen. | — | widely-taught: the managed rate's trade channel | widely-taught |
| `usdcny` | ifFalling | A softer dollar-yuan calms trade politics. | — | widely-taught (inverse) | widely-taught |
| `michigan-1y-expectations` | ifRising | Households bracing for inflation can feed wage demands. | — | widely-taught: expectations → wage-price dynamics (the Fed's stated concern) | widely-taught |
| `michigan-1y-expectations` | ifFalling | Calmer price expectations. | — | widely-taught (inverse) | widely-taught |
| `cfnai` | ifRising | Above-normal US activity. | — | widely-taught (index construction: zero = trend) | widely-taught |
| `cfnai` | ifFalling | Below-normal readings cluster around downturns. | — | widely-taught (approved copy) | widely-taught |
| `oecd-cli-cn` | ifRising | China's direction improves several months out. | — | widely-taught: CLI lead (OECD) | widely-taught |
| `oecd-cli-cn` | ifFalling | A Chinese slowdown sits months ahead. | — | widely-taught (inverse) | widely-taught |
| `oecd-cli-de` | ifRising | Europe's largest economy improving months out. | — | widely-taught: CLI lead | widely-taught |
| `oecd-cli-de` | ifFalling | A European slowdown sits months ahead. | — | widely-taught (inverse) | widely-taught |
| `epu-us` | ifRising | Businesses delay investment and hiring under policy uncertainty. | — | widely-taught: Baker-Bloom-Davis's own finding | widely-taught |
| `epu-us` | ifFalling | Quieter policy backdrop lets plans proceed. | — | widely-taught (inverse) | widely-taught |
| `copper-usd` | ifRising | Dearer copper lifts wiring, appliance and building costs. | — | widely-taught (approved copy) | widely-taught |
| `copper-usd` | ifFalling | Cheaper copper helps builders, manufacturers, renovations. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 6)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `usdcny` | `china-pmi` | A weaker yuan often appears when Chinese factories slow. | sometimes | less-certain: managed rate; policy often drives it independently | less-certain |
| `michigan-1y-expectations` | `michigan-sentiment` | The number rides inside the mood survey. | reliable | definitional | widely-taught |
| `michigan-1y-expectations` | `us-cpi-yoy` | Worry tends to track what prices already did. | usually | widely-taught: backward-looking household expectations | widely-taught |
| `cfnai` | `us-gdp-growth` | Same economy; this one updates monthly. | reliable | definitional (CFNAI is a monthly activity blend) | widely-taught |
| `cfnai` | `recession-probability` | Low stretches line up with the recession model. | usually | widely-taught: both are activity-based nowcasters | widely-taught |
| `oecd-cli-cn` | `china-pmi` | The factory pulse confirms what the CLI leads. | usually | widely-taught: lead-lag between the two | widely-taught |
| `oecd-cli-cn` | `oecd-cli-us` | The US and China gauges frame world industry. | usually | widely-taught: the two largest economies | widely-taught |
| `oecd-cli-de` | `oecd-cli-us` | Siblings in the same leading-indicator family. | reliable | definitional (same OECD framework) | widely-taught |
| `oecd-cli-de` | `bund-10y` | German borrowing costs echo the growth picture. | usually | widely-taught: growth → yields | widely-taught |
| `epu-us` | `michigan-sentiment` | The mood pair: policy noise beside household mood. | usually | widely-taught (approved forYou pairing) | widely-taught |
| `copper-usd` | `china-pmi` | Copper often moves with Chinese factory strength. | usually | widely-taught: China is the biggest copper consumer | widely-taught |
| `copper-usd` | `copper-gold` | Copper is the growth leg of the metal measure. | reliable | definitional | widely-taught |

### Australia angle (batch 6)
| id | claim | basis | status |
|---|---|---|---|
| `usdcny` | A weaker yuan often drags on the AUD through the China trade channel. | australia-specific: AUD/CNY competitive channel | needs-expert-check |

---

## Batch 7 — market-stress A (6 indicators)

_Indicators: stress-stlfsi, nfci, vix, gold-silver, cftc-gold-positioning, walcl_

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `stress-stlfsi` | ifRising | Rising stress tightens lending in the US and often worldwide. | — | widely-taught: stress indices track funding conditions | widely-taught |
| `stress-stlfsi` | ifFalling | Calm plumbing eases lending. | — | widely-taught (inverse) | widely-taught |
| `nfci` | ifRising | Tighter conditions slow lending. | — | widely-taught (the Chicago Fed's own framing) | widely-taught |
| `nfci` | ifFalling | Easier conditions support credit and spending. | — | widely-taught (inverse) | widely-taught |
| `vix` | ifRising | A rising gauge usually means big, fast world share swings loom. | — | widely-taught: the VIX is the fear thermometer (approved copy) | widely-taught |
| `vix` | ifFalling | Calm settles over share markets. | — | widely-taught (inverse) | widely-taught |
| `gold-silver` | ifRising | Gold favoured over silver = fear leads. | — | widely-taught: the classic hard-asset ratio (approved copy) | widely-taught |
| `gold-silver` | ifFalling | Silver dearer = industrial strength shows. | — | widely-taught (inverse) | widely-taught |
| `cftc-gold-positioning` | ifRising | Crowded gold bets unwind hardest. | — | widely-taught: crowded-book risk (approved copy) | widely-taught |
| `cftc-gold-positioning` | ifFalling | Thinning crowds; rare net-short stretches near price floors. | — | widely-taught (approved copy) | widely-taught |
| `walcl` | ifRising | A growing balance sheet floods the system, emergency-style. | — | widely-taught: QE mechanics | widely-taught |
| `walcl` | ifFalling | Steady draining of money from the system. | — | widely-taught: quantitative tightening | widely-taught |

### Connections (batch 7)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `stress-stlfsi` | `nfci` | The Chicago cousin reads the same stress with a wider lens. | reliable | definitional: two Fed stress indices over overlapping inputs | widely-taught |
| `stress-stlfsi` | `vix` | Market fear rises with money-market stress. | usually | widely-taught: co-movement in stress episodes | widely-taught |
| `nfci` | `stress-stlfsi` | The sister gauge from the St Louis Fed reads it differently. | reliable | definitional | widely-taught |
| `vix` | `gpr-index` | War and tension news often lifts the fear gauge. | usually | widely-taught: geopolitics → risk-off | widely-taught |
| `vix` | `stress-stlfsi` | Fear and money-market stress move together. | usually | widely-taught | widely-taught |
| `gold-silver` | `gold-usd` | Gold is the fear leg of the measure. | reliable | definitional | widely-taught |
| `gold-silver` | `silver-usd` | Silver is the half-industrial leg. | reliable | definitional | widely-taught |
| `cftc-gold-positioning` | `vix` | Stress plus crowding unwinds hardest. | usually | widely-taught (approved forYou wording) | widely-taught |
| `cftc-gold-positioning` | `gold-usd` | The bets gauged are on this metal. | reliable | definitional | widely-taught |
| `walcl` | `m2-us` | One is the central bank's money creation; the other the banking system's. | reliable | definitional/widely-taught (approved forYou wording) | widely-taught |
| `walcl` | `fed-target` | The Fed's two levers: the price and the quantity of money. | reliable | widely-taught: policy toolkit | widely-taught |

### Australia angle (batch 7)
| id | claim | basis | status |
|---|---|---|---|
| (none — the nfci approved copy notes offshore-funding relevance for AU banks, but D-08's australiaAngle list does not include nfci/walcl, so no australiaAngle is written.) | — | — | — |

---

## Batch 8 — market-stress B (4 indicators) — Milestone 1 complete

_Indicators: crypto-fng, shiller-cape, shiller-ecy, gpr-index_
_(market-stress is now complete at 10/10; M1 ends at 56/129 unique ids)_

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `crypto-fng` | ifRising | Building greed; extreme greed has often appeared near sharp turns. | — | widely-taught (approved copy's own "tendency, not a rule" framing) | widely-taught |
| `crypto-fng` | ifFalling | Deepening fear; extreme fear has often sat near rebounds. | — | widely-taught (contrarian tendency, hedged) | widely-taught |
| `shiller-cape` | ifRising | Dearer shares vs earnings have often meant weaker decade-ahead returns. | — | widely-taught: Shiller's own long-run finding (wide variation) | widely-taught |
| `shiller-cape` | ifFalling | Cheaper shares have often come with better decade-ahead returns. | — | widely-taught (inverse) | widely-taught |
| `shiller-ecy` | ifRising | A fatter cushion for shares over safe money. | — | widely-taught (ECY construction) | widely-taught |
| `shiller-ecy` | ifFalling | Safe money competing harder has weighed on decade-ahead returns. | — | widely-taught (Shiller's ECY paper) | widely-taught |
| `gpr-index` | ifRising | War and tension usually lift oil and gold, and shares often slip. | — | widely-taught: the canonical geopolitics reaction (approved copy) | widely-taught |
| `gpr-index` | ifFalling | A calmer news backdrop usually supports risk-taking. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 8)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `crypto-fng` | `btc-usd` | The mood gauge and the Bitcoin price read the same market. | usually | definitional-ish: the index is built partly from BTC measures | widely-taught |
| `shiller-cape` | `shiller-ecy` | The companion reading puts shares against safe government money. | reliable | definitional (Shiller's two published series) | widely-taught |
| `shiller-cape` | `real-yield-10y` | The safe-money leg of the companion reading is the real return. | reliable | definitional (ECY = earnings yield − real 10y) | widely-taught |
| `shiller-ecy` | `shiller-cape` | Both read the same share prices; this one subtracts safe money. | reliable | definitional | widely-taught |
| `gpr-index` | `vix` | The fear gauge often rises with war news. | usually | widely-taught: geopolitics → risk-off | widely-taught |
| `gpr-index` | `brent` | Oil often jumps on war and supply scares. | usually | widely-taught (approved copy) | widely-taught |
| `gpr-index` | `gold-usd` | Gold often rises on worry. | usually | widely-taught: gold's safe-haven role | widely-taught |

### Australia angle (batch 8)
| id | claim | basis | status |
|---|---|---|---|
| (none — sentiment/valuation/geopolitics context cards; no D-08 AU link.) | — | — | — |

---

## Batch 9 — prices-board (5 indicators)

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `brent` | ifRising | Costlier Brent usually means petrol, heating and delivery prices climb, feeding inflation nearly everywhere. | — | widely-taught: oil is the canonical cost-push inflation channel (approved copy: "Oil feeds fuel, transport and electricity costs everywhere") | widely-taught |
| `brent` | ifFalling | Cheaper oil usually eases household budgets and inflation pressure. | — | widely-taught (inverse) | widely-taught |
| `gold-usd` | ifRising | Rising gold usually means jewellery and coins cost more; often driven by safe-haven seeking. | — | widely-taught: gold's safe-haven + jewellery demand role (approved copy: "the classic fear + inflation asset") | widely-taught |
| `gold-usd` | ifFalling | Falling gold usually means cheaper coins and jewellery, often while worry fades. | — | widely-taught (inverse) | widely-taught |
| `silver-usd` | ifRising | Rising silver usually means dearer jewellery and electronics; silver often swings harder than gold. | — | widely-taught: silver's dual precious/industrial role (approved copy: "half precious metal, half industrial input") | widely-taught |
| `silver-usd` | ifFalling | Cheaper silver usually eases metal costs for electronics, solar-panel and jewellery makers. | — | widely-taught (inverse) | widely-taught |
| `btc-usd` | ifRising | A rising bitcoin usually brightens crypto mood across digital assets. | — | widely-taught: bitcoin as the crypto flagship (approved copy) | widely-taught |
| `btc-usd` | ifFalling | A falling bitcoin usually darkens crypto mood and can fall fast (famously jumpy). | — | widely-taught (approved copy: "Famously volatile") | widely-taught |
| `gold-btc` | ifRising | A rising reading means the market values the new digital money over old metal money. | — | definitional: the ratio's construction (gold oz per BTC) | widely-taught |
| `gold-btc` | ifFalling | A falling reading means gold holds its worth while bitcoin falls out of favour. | — | definitional (inverse) | widely-taught |

### Connections (batch 9)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `brent` | `wti` | The American oil twin tracks this world price closely. | reliable | widely-taught: Brent/WTI move together (same global crude market; approved copy calls WTI "the American twin") | widely-taught |
| `brent` | `eia-crude-stocks` | The storage-tanks card explains what oil prices react to. | usually | widely-taught: inventory builds/draws are a standard oil-price input | widely-taught |
| `brent` | `us-cpi-yoy` | Costlier oil usually feeds into US inflation readings with a lag. | usually | widely-taught: energy weight in CPI | widely-taught |
| `gold-usd` | `dollar-basket` | A stronger US dollar often weighs on the gold price. | usually | widely-taught: gold is priced in USD (approved copy same claim) | widely-taught |
| `gold-usd` | `real-yield-10y` | Higher real yields tend to pull money away from gold. | usually | widely-taught: opportunity-cost channel (approved copy same claim) | widely-taught |
| `gold-usd` | `silver-usd` | Silver usually follows gold, only with bigger swings. | usually | widely-taught: silver's higher volatility beta to gold | widely-taught |
| `silver-usd` | `gold-usd` | Silver usually follows its bigger sibling, only harder. | usually | widely-taught (same as above, mirrored) | widely-taught |
| `silver-usd` | `gold-silver` | Silver is one leg of the gold-versus-silver reading. | reliable | definitional | widely-taught |
| `btc-usd` | `crypto-fng` | The daily mood gauge reads the same market. | usually | widely-taught (approved copy same claim) | widely-taught |
| `btc-usd` | `gold-btc` | The bitcoin price is the new-money leg of the gold reading. | reliable | definitional | widely-taught |
| `gold-btc` | `btc-usd` | Bitcoin is the new-money leg. | reliable | definitional | widely-taught |
| `gold-btc` | `gold-usd` | Gold is the old-money leg. | reliable | definitional | widely-taught |

### Australia angle (batch 9)
| id | claim | basis | status |
|---|---|---|---|
| `brent` | Australia imports much of its fuel, so local petrol prices usually track world oil with a delay. | widely-taught: Australia imports the bulk of its refined fuel (AU government energy statistics); feeds au-petrol-yoy | widely-taught |
| `gold-usd` | Australians pay this price through the local dollar: a weaker AUD makes each ounce dearer locally. | definitional + widely-taught (feeds the gold-aud card) | widely-taught |

---

## Batch 10 — prices-heat A (8 indicators)

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `us-cpi-yoy` | ifRising | Higher US inflation usually keeps world rates high for longer. | — | widely-taught: US inflation drives the Fed, the world rate anchor (approved copy same claim) | widely-taught |
| `us-cpi-yoy` | ifFalling | Cooling US inflation usually opens the door to cheaper borrowing worldwide. | — | widely-taught (inverse) | widely-taught |
| `us-pce-core-yoy` | ifRising | A sticky high core-PCE usually keeps the Fed tough and world borrowing dearer. | — | widely-taught: the Fed's reaction function runs on this number (approved copy) | widely-taught |
| `us-pce-core-yoy` | ifFalling | Cooling toward the Fed goal usually brings cheaper-money talk closer. | — | widely-taught (inverse) | widely-taught |
| `euro-hicp` | ifRising | Higher euro-area inflation usually means a higher ECB rate and dearer euro loans. | — | widely-taught: ECB's 2% target (approved copy) | widely-taught |
| `euro-hicp` | ifFalling | Calmer euro-area inflation usually lets cheaper money return. | — | widely-taught (inverse) | widely-taught |
| `breakeven-5y5y` | ifRising | Markets pricing more future inflation usually keeps long rates high. | — | widely-taught: expected inflation is a component of nominal long rates (approved copy same claim) | widely-taught |
| `breakeven-5y5y` | ifFalling | Weak future-inflation pricing is the setting that invites easy money. | — | widely-taught: deflation fear → easing bias (approved copy) | widely-taught |
| `us-cpi-core-yoy` | ifRising | A rising core usually keeps the Fed tough for longer. | — | widely-taught: core is the Fed's steadier read (approved copy) | widely-taught |
| `us-cpi-core-yoy` | ifFalling | A cooling core usually signals inflation fading at its roots. | — | widely-taught (inverse) | widely-taught |
| `us-wages` | ifRising | Faster pay sustains spending but can feed inflation, the loop central banks watch. | — | widely-taught: the wage-price loop (approved copy cites the Fed's persistence argument) | widely-taught |
| `us-wages` | ifFalling | Pay growing slower than prices usually squeezes household budgets. | — | widely-taught (approved copy same claim) | widely-taught |
| `breakeven-10y` | ifRising | Bond markets pricing more future inflation usually lifts long-term rates. | — | widely-taught: nominal = real + expected inflation (approved copy same claim) | widely-taught |
| `breakeven-10y` | ifFalling | Weak inflation pricing ahead invites easy money. | — | widely-taught (inverse) | widely-taught |
| `t5yie` | ifRising | More medium-term inflation pricing usually lifts long rates. | — | widely-taught (same construction as 10y) | widely-taught |
| `t5yie` | ifFalling | Soft inflation pricing ahead invites easy money. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 10)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `us-cpi-yoy` | `fed-target` | The Fed reacts to this number when moving its main rate. | usually | widely-taught: the Fed's price-stability mandate | widely-taught |
| `us-cpi-yoy` | `us-cpi-core-yoy` | The core companion strips the food and energy swings. | reliable | definitional (CPILFENS excludes food/energy) | widely-taught |
| `us-cpi-yoy` | `michigan-1y-expectations` | Household expectations tend to follow actual prices. | usually | widely-taught (approved copy same claim) | widely-taught |
| `us-pce-core-yoy` | `fed-target` | The Fed's stated inflation goal is defined on this measure. | reliable | definitional (the 2% target is on core PCE) | widely-taught |
| `us-pce-core-yoy` | `us-cpi-yoy` | Both read US prices; this is the Fed's own yardstick. | reliable | definitional | widely-taught |
| `us-pce-core-yoy` | `us-cpi-core-yoy` | The other US core gauge reads the same stripped-out prices. | reliable | definitional (two core measures of the same prices) | widely-taught |
| `euro-hicp` | `ecb-dfr` | The ECB's policy rate answers this number. | reliable | widely-taught: the ECB targets HICP (approved copy) | widely-taught |
| `euro-hicp` | `us-cpi-yoy` | US and euro readings frame world inflation. | usually | widely-taught | widely-taught |
| `breakeven-5y5y` | `breakeven-10y` | The ten-year companion reads the nearer window. | reliable | definitional (both from the Treasury gap family) | widely-taught |
| `breakeven-5y5y` | `us10y` | Expected inflation is one building block of long-term rates. | reliable | widely-taught: nominal-rate decomposition | widely-taught |
| `breakeven-5y5y` | `fed-target` | Central banks watch it to judge their credibility. | usually | widely-taught (approved copy: "the thing central banks watch to keep their credibility") | widely-taught |
| `us-cpi-core-yoy` | `us-cpi-yoy` | Both come from the same monthly price report. | reliable | definitional (CPIAUCNS/CPILFENS, same BLS survey) | widely-taught |
| `us-cpi-core-yoy` | `us-pce-core-yoy` | The Fed's core gauge reads the same underlying direction. | usually | widely-taught | widely-taught |
| `us-wages` | `us-cpi-yoy` | The gap between pay and price growth decides whether households gain ground. | usually | widely-taught: real-wage logic (approved copy same claim) | widely-taught |
| `us-wages` | `fed-target` | The Fed watches the pay-and-price loop when setting rates. | usually | widely-taught (approved copy cites the Fed citing wages) | widely-taught |
| `breakeven-10y` | `breakeven-5y5y` | The far-ahead companion reads the window beyond five years. | reliable | definitional | widely-taught |
| `breakeven-10y` | `t5yie` | The five-year companion reads the nearer window. | reliable | definitional | widely-taught |
| `breakeven-10y` | `us10y` | Expected inflation is one building block of the ten-year rate. | reliable | widely-taught: nominal-rate decomposition | widely-taught |
| `t5yie` | `breakeven-10y` | The ten-year companion reads the wider window. | reliable | definitional | widely-taught |
| `t5yie` | `breakeven-5y5y` | The far-ahead companion reads beyond it. | reliable | definitional | widely-taught |

### Australia angle (batch 10)
| id | claim | basis | status |
|---|---|---|---|
| (none — global inflation/prices context cards; not in the D-08 AU-required set.) | — | — | — |

---

## Batch 11 — prices-heat B (8 indicators)

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `wti` | ifRising | Costlier WTI usually means dearer US petrol and delivery, feeding US inflation. | — | widely-taught (approved copy same claim) | widely-taught |
| `wti` | ifFalling | Cheaper WTI usually eases US fuel costs and inflation pressure. | — | widely-taught (inverse) | widely-taught |
| `natgas` | ifRising | Costlier US gas usually means higher winter heating and power bills. | — | widely-taught (approved copy same claim) | widely-taught |
| `natgas` | ifFalling | Cheaper gas usually eases heating and electricity bills. | — | widely-taught (inverse) | widely-taught |
| `eia-crude-stocks` | ifRising | Building inventories (a glut) have often dragged crude and pump prices down. | — | widely-taught: inventory levels vs price (approved copy same claim) | widely-taught |
| `eia-crude-stocks` | ifFalling | Fast-draining tanks can signal a supply squeeze that pushes petrol up. | — | widely-taught (approved copy same claim) | widely-taught |
| `platinum` | ifRising | Costlier platinum usually means dearer jewellery and car metal parts. | — | widely-taught: platinum's jewellery + industrial use (approved copy) | widely-taught |
| `platinum` | ifFalling | Cheaper platinum usually helps jewellers and car-part makers. | — | widely-taught (inverse) | widely-taught |
| `gold-oil-ratio` | ifRising | Gold buying more barrels is the mix that has often marked fear-rich eras. | — | widely-taught: the long-run relative-value check (approved copy: "the setting that has historically favoured holding gold") | widely-taught |
| `gold-oil-ratio` | ifFalling | Fewer barrels per ounce is the mix of energy-dominant eras. | — | widely-taught (approved copy: "the inflation-era pattern of energy dominance") | widely-taught |
| `food-index` | ifRising | Wholesale food spikes usually reach grocery bills months later, hardest on poorer households. | — | widely-taught (approved copy same claim) | widely-taught |
| `food-index` | ifFalling | Cheaper wholesale food usually brings grocery relief months ahead. | — | widely-taught (inverse) | widely-taught |
| `wheat` | ifRising | Costlier wheat usually means dearer flour, bread and animal feed. | — | widely-taught (approved copy same claim) | widely-taught |
| `wheat` | ifFalling | Cheaper wheat usually eases bread and feed budgets. | — | widely-taught (inverse) | widely-taught |
| `maize` | ifRising | Costlier maize usually means dearer feed, meat and eggs. | — | widely-taught: the feed-grain pass-through (approved copy same claim) | widely-taught |
| `maize` | ifFalling | Cheap feed usually eases meat and dairy budgets. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 11)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `wti` | `brent` | The world twin usually trades close to WTI. | reliable | widely-taught: the two crude benchmarks track each other | widely-taught |
| `wti` | `eia-crude-stocks` | The tanks gauge explains the supply side of the price. | usually | widely-taught | widely-taught |
| `wti` | `natgas` | Oil and gas together steer US household energy bills. | usually | widely-taught | widely-taught |
| `natgas` | `brent` | Oil and gas together steer the energy line of budgets. | usually | widely-taught | widely-taught |
| `natgas` | `us-cpi-yoy` | Gas moves the energy line of US inflation readings. | usually | widely-taught (approved copy: "the price feeds US household energy bills and inflation readings") | widely-taught |
| `eia-crude-stocks` | `brent` | Prices react to how full or empty the tanks run. | usually | widely-taught (approved copy: "the tanks explain what the prices are reacting to") | widely-taught |
| `eia-crude-stocks` | `wti` | The American price reads these tanks closely. | usually | widely-taught | widely-taught |
| `platinum` | `gold-usd` | The precious-metal cousin usually moves with gold, only harder. | usually | widely-taught (precious-metals family) | widely-taught |
| `platinum` | `silver-usd` | Both metals straddle jewellery and factory demand. | usually | widely-taught (approved copy: "half precious, half industrial") | widely-taught |
| `gold-oil-ratio` | `gold-usd` | Gold is one leg of the reading. | reliable | definitional | widely-taught |
| `gold-oil-ratio` | `brent` | Oil is the other leg. | reliable | definitional | widely-taught |
| `food-index` | `wheat` | Wheat is a ground-truth grain inside the basket. | reliable | definitional (Pink Sheet composition) | widely-taught |
| `food-index` | `maize` | Maize is the feed grain behind meat prices in the basket. | reliable | definitional + widely-taught pass-through | widely-taught |
| `food-index` | `brent` | Food and fuel together move the household cost of living. | usually | widely-taught (approved copy: "read it beside the energy cards") | widely-taught |
| `wheat` | `food-index` | The food basket leans on this staple grain. | reliable | definitional | widely-taught |
| `wheat` | `maize` | The two grains swap in feed and food demand at times. | sometimes | widely-taught substitution in feed demand, marked sometimes | widely-taught |
| `maize` | `food-index` | The feed grain inside the food basket. | reliable | definitional | widely-taught |
| `maize` | `wheat` | The two grains swap in feed and food demand at times. | sometimes | same as above, mirrored | widely-taught |

### Australia angle (batch 11)
| id | claim | basis | status |
|---|---|---|---|
| (none — global energy/metals/food context cards; not in the D-08 AU-required set.) | — | — | — |

---

## Batch 12 — au-inflation-rates (6 indicators)

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `au-cpi` | ifRising | Higher Australian inflation usually means the RBA keeps rates higher: dearer loans, better saving pay. | — | widely-taught: the RBA's 2-3% target (approved copy) | widely-taught |
| `au-cpi` | ifFalling | Cooling inflation usually opens the door to RBA rate cuts. | — | widely-taught (inverse) | widely-taught |
| `au-trimmed-mean` | ifRising | A rising underlying reading usually keeps the RBA tough on rates. | — | widely-taught: the RBA targets the trimmed mean (approved copy) | widely-taught |
| `au-trimmed-mean` | ifFalling | Cooling underlying inflation usually opens the door to RBA cuts. | — | widely-taught (inverse) | widely-taught |
| `au-10y` | ifRising | Rising Australian 10-year borrowing usually lifts fixed home-loan and term-deposit rates. | — | widely-taught (approved copy: "fixed home-loan rates and term deposits price off this curve") | widely-taught |
| `au-10y` | ifFalling | Falling long rates usually mean cheaper fixed home loans and thinner long savings pay. | — | widely-taught (inverse) | widely-taught |
| `rba-expectations` | ifRising | A widening positive gap usually means markets price a rising cash-rate path. | — | widely-taught (approved copy: positive gaps appeared when the market priced a rising path) | widely-taught |
| `rba-expectations` | ifFalling | A negative gap usually means markets price cuts ahead, the run-up pattern of past cut cycles. | — | widely-taught (approved copy: negative gaps preceded past cutting cycles) | widely-taught |
| `au-us-10y-gap` | ifRising | Australia paying clearly more than the US usually draws global money and supports the AUD. | — | widely-taught: the yield-gap carry channel (approved copy: "a mix that tends to support the AUD") | widely-taught |
| `au-us-10y-gap` | ifFalling | US rates above Australia's have usually weighed on the AUD. | — | widely-taught (approved copy: "the setting that has usually weighed on the AUD") | widely-taught |
| `au-petrol-yoy` | ifRising | Rising fuel inflation usually squeezes family budgets and freight costs first. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-petrol-yoy` | ifFalling | Cheaper fuel is the rare reading that eases household budgets. | — | widely-taught (approved copy same claim) | widely-taught |

### Connections (batch 12)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `au-cpi` | `rba-cash-rate` | The RBA moves its main rate in answer to this scoreboard. | usually | widely-taught: the RBA mandate | widely-taught |
| `au-cpi` | `au-trimmed-mean` | The steadier companion shows the underlying direction. | reliable | definitional (same ABS CPI family) | widely-taught |
| `au-cpi` | `au-petrol-yoy` | Petrol is one of the jumpy items inside the CPI basket. | reliable | definitional (automotive fuel is a CPI component) | widely-taught |
| `au-trimmed-mean` | `au-cpi` | The headline swings more; the trimmed mean shows the steady core. | reliable | definitional | widely-taught |
| `au-trimmed-mean` | `rba-cash-rate` | The RBA steers the cash rate by this reading first. | reliable | widely-taught: the RBA's preferred target measure | widely-taught |
| `au-10y` | `rba-cash-rate` | The cash rate anchors the short end; the 10-year is the market long rate. | reliable | widely-taught: the curve structure | widely-taught |
| `au-10y` | `au-us-10y-gap` | The gap card compares this yield with the US one. | reliable | definitional | widely-taught |
| `rba-expectations` | `rba-cash-rate` | The gap is measured against today's cash rate. | reliable | definitional | widely-taught |
| `rba-expectations` | `au-10y` | The long-rate companion shows the ten-year window. | reliable | definitional | widely-taught |
| `au-us-10y-gap` | `au-10y` | The Australian leg of the gap. | reliable | definitional | widely-taught |
| `au-us-10y-gap` | `us10y` | The US leg. | reliable | definitional | widely-taught |
| `au-us-10y-gap` | `audusd` | The dollar often follows this pull of money across the Pacific. | usually | widely-taught: rate-gap flows into the AUD | widely-taught |
| `au-petrol-yoy` | `au-cpi` | Fuel is a jumpy item inside the inflation basket. | reliable | definitional | widely-taught |
| `au-petrol-yoy` | `brent` | World oil and the local dollar usually drive the pump together. | reliable | widely-taught: pump price = world oil × AUD | widely-taught |

### Australia angle (batch 12)
| id | claim | basis | status |
|---|---|---|---|
| `au-cpi` | Australia's own cost-of-living gauge; the number behind nearly every home-loan rate move. | widely-taught (approved copy: the RBA target drives rate decisions) | widely-taught |
| `au-trimmed-mean` | The RBA's preferred gauge; outside the target band, mortgage relief usually waits. | widely-taught (approved copy: "the reading that usually keeps rates high") | widely-taught |
| `au-10y` | This long rate, not just the cash rate, prices Australia's multi-year money: fixed loans and term deposits follow it. | widely-taught (approved copy same claim) | widely-taught |
| `rba-expectations` | A positive gap means money priced dearer ahead; a negative one has usually come before rate-cut cycles. | widely-taught (approved copy same claim) | widely-taught |
| `au-us-10y-gap` | A quiet lever on the AUD: when the US pays clearly more, the AUD usually sags. | widely-taught (approved copy same claim) | widely-taught |
| `au-petrol-yoy` | The bowser is Australia's most visible weekly price; it feeds headline inflation and the RBA's mood. | widely-taught (approved copy: fuel feeds headline CPI; "petrol usually leads headline CPI's turning points") | widely-taught |

---

## Batch 13 — au-households A (6 indicators)

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `rba-cash-rate` | ifRising | RBA hikes usually flow into variable home loans and savings rates within weeks. | — | widely-taught (approved copy same claim) | widely-taught |
| `rba-cash-rate` | ifFalling | Cuts usually bring borrower relief and thinner savings pay, with a lag. | — | widely-taught (inverse) | widely-taught |
| `au-unemployment` | ifRising | Rising joblessness usually means harder job hunting and softer spending. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-unemployment` | ifFalling | Plentiful jobs usually support wages and confidence. | — | widely-taught (approved copy: "usually good news for wages and confidence") | widely-taught |
| `au-wage-growth` | ifRising | Faster pay usually catches up, though it can feed prices. | — | widely-taught: the wage-price loop, AU edition (approved copy) | widely-taught |
| `au-wage-growth` | ifFalling | Pay growing slower than prices covers less each hour. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-rent-yoy` | ifRising | Fast rent growth usually squeezes renters hardest at renewal. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-rent-yoy` | ifFalling | Weak rent growth is the rare renters' relief. | — | widely-taught (inverse) | widely-taught |
| `au-home-loan` | ifRising | Rising average mortgage rates squeeze monthly budgets. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-home-loan` | ifFalling | Relief usually reaches variable loans first, with a lag. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-deposit-rate` | ifRising | Higher term-deposit rates usually mean more interest on offer for savers. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-deposit-rate` | ifFalling | Lower deposit rates mean cash savings earn less. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 13)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `rba-cash-rate` | `fed-target` | The Fed sets the US twin of this dial. | reliable | definitional | widely-taught |
| `rba-cash-rate` | `au-home-loan` | Home-loan rates follow this dial with a lag. | reliable | widely-taught (approved copy: within weeks) | widely-taught |
| `rba-cash-rate` | `au-deposit-rate` | Savings rates ride on it too. | reliable | widely-taught (approved copy: term deposits track the cash rate) | widely-taught |
| `au-unemployment` | `au-job-vacancies` | Vacancies usually turn before the jobless rate. | reliable | widely-taught (approved copy: vacancies roll over first) | widely-taught |
| `au-unemployment` | `rba-cash-rate` | The RBA watches the jobs market when setting rates. | usually | widely-taught (approved copy: jobs drive rate decisions) | widely-taught |
| `au-wage-growth` | `au-cpi` | The pay-vs-price gap shows whether pay is winning. | usually | widely-taught: real-wage logic (approved copy same claim) | widely-taught |
| `au-wage-growth` | `au-unemployment` | A strong jobs market usually keeps pay rising. | usually | widely-taught: Phillips-curve logic, softened | widely-taught |
| `au-rent-yoy` | `au-cpi` | Rent is a big weight inside the inflation basket. | reliable | definitional (CPI rents component) | widely-taught |
| `au-rent-yoy` | `au-home-values` | Rent and house prices often move together, but not always. | sometimes | widely-taught, marked sometimes | widely-taught |
| `au-rent-yoy` | `rba-cash-rate` | Rate moves usually cool the housing market with a delay. | usually | widely-taught | widely-taught |
| `au-home-loan` | `rba-cash-rate` | Each cash-rate move flows in with a lag. | reliable | widely-taught (approved copy: moves with each RBA decision) | widely-taught |
| `au-home-loan` | `au-deposit-rate` | The savings twin: pays versus earns. | reliable | definitional pairing (approved copy: "the savings twin of the home-loan card") | widely-taught |
| `au-home-loan` | `mortgage-30y` | The US twin shows the American story. | reliable | definitional pairing | widely-taught |
| `au-deposit-rate` | `rba-cash-rate` | Term-deposit rates track the cash rate with a short lag. | reliable | widely-taught (approved copy same claim) | widely-taught |
| `au-deposit-rate` | `au-home-loan` | The borrowing twin of this savings rate. | reliable | definitional pairing | widely-taught |
| `au-deposit-rate` | `au-cpi` | Real saving power depends on the gap to inflation. | usually | widely-taught: real-return logic (approved copy: the real-rate row) | widely-taught |

### Australia angle (batch 13)
| id | claim | basis | status |
|---|---|---|---|
| `rba-cash-rate` | Every variable mortgage in Australia reprices with this dial; savings follow. | widely-taught (approved copy: flows directly into mortgage, deposit and business costs) | widely-taught |
| `au-unemployment` | A half-point rise off a low has often marked the start of an AU slowdown. | widely-taught (approved copy: "rises of half a point off a low have often marked turning points") | widely-taught |
| `au-wage-growth` | Through much of the inflation era, pay lagged prices, squeezing real budgets. | widely-taught (approved copy: wages vs inflation comparison) | widely-taught |
| `au-rent-yoy` | Rent is the biggest weekly bill for roughly a third of Australian households. | approved copy verbatim | widely-taught |
| `au-home-loan` | Home loans are the biggest debt of most AU households; this is the rate they pay. | approved copy verbatim | widely-taught |
| `au-deposit-rate` | The twin of the mortgage card: earns-on-savings vs pays-on-loans. | approved copy ("the savings twin of the home-loan card") | widely-taught |

---

## Batch 14 — au-households B (5 indicators)

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `au-home-values` | ifRising | Rising home prices usually mean richer owners, harder entry for first-home buyers. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-home-values` | ifFalling | Cheaper homes ease entry, but falls are rare and brief in Australia. | — | widely-taught (approved copy: falls rare, mostly brief) | widely-taught |
| `au-household-debt-arrears` | ifRising | With heavy debt, every rate rise bites harder; arrears follow with a lag. | — | widely-taught (approved copy: trouble shows up in arrears with a lag after rate rises) | widely-taught |
| `au-household-debt-arrears` | ifFalling | Balance sheets mending softens the blow of rate moves. | — | widely-taught (inverse) | widely-taught |
| `au-housing-finance` | ifRising | Strong new lending usually means households committing, demand ahead. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-housing-finance` | ifFalling | Weak lending is the leading edge of a housing slowdown. | — | widely-taught (approved copy: "the leading edge of a housing slowdown") | widely-taught |
| `au-job-vacancies` | ifRising | More vacancies usually mean employers still hungry to hire. | — | widely-taught (approved copy same claim) | widely-taught |
| `au-job-vacancies` | ifFalling | Employers pull back postings before unemployment rises. | — | widely-taught (approved copy: "employers pulling back before unemployment rises") | widely-taught |
| `au-saving-ratio` | ifRising | Rising saving usually means caution; spending softens before income does. | — | widely-taught (approved copy: "households save more and spending falls before any income does") | widely-taught |
| `au-saving-ratio` | ifFalling | Thin saving means households stretched, or confident enough to spend it all. | — | widely-taught (approved copy same claim) | widely-taught |

### Connections (batch 14)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `au-home-values` | `au-housing-finance` | New lending usually turns before home values. | reliable | widely-taught (approved copy: a commitment is signed months before it shows in values) | widely-taught |
| `au-home-values` | `rba-cash-rate` | Rate rises usually cool the market with a delay. | usually | widely-taught (approved copy: 2022-23 with rate hikes) | widely-taught |
| `au-household-debt-arrears` | `rba-cash-rate` | High debt is why RBA moves dominate household budgets. | reliable | widely-taught (approved copy: a key sensitivity the RBA weighs) | widely-taught |
| `au-household-debt-arrears` | `au-home-loan` | Home loans are the biggest slice of household debt. | reliable | definitional | widely-taught |
| `au-housing-finance` | `au-home-values` | Loans are signed months before they show in values. | reliable | widely-taught (approved copy verbatim) | widely-taught |
| `au-housing-finance` | `rba-cash-rate` | Lending cools after rises, warms after cuts. | reliable | widely-taught (approved copy: collapsed with each hike cycle, recovered with each cut) | widely-taught |
| `au-job-vacancies` | `au-unemployment` | Vacancies lead, joblessness lags. | reliable | widely-taught (approved copy: "one leads, one lags") | widely-taught |
| `au-job-vacancies` | `rba-cash-rate` | Hiring strength is one input the RBA reads. | usually | widely-taught | widely-taught |
| `au-saving-ratio` | `au-housing-finance` | Caution and borrowing usually move in opposite directions. | usually | widely-taught (approved copy: read beside the lending card) | widely-taught |
| `au-saving-ratio` | `au-cpi` | A saving cushion softens the sting of price rises. | usually | widely-taught: buffer logic (approved copy: buffers funded spending) | widely-taught |

### Australia angle (batch 14)
| id | claim | basis | status |
|---|---|---|---|
| `au-home-values` | Housing is the biggest asset and debt source for AU households; prices feed wealth and confidence. | approved copy verbatim | widely-taught |
| `au-household-debt-arrears` | AU households carry among the world's heaviest debt loads; rate moves dominate the national mood. | approved copy ("among the world's highest"; "rate moves dominate Australian household finances") | widely-taught |
| `au-housing-finance` | The AU leading edge: loan commitments turn first, home values follow. | approved copy ("This is the AU leading edge") | widely-taught |
| `au-job-vacancies` | Vacancies roll over long before joblessness; the early-warning line for Australia. | approved copy ("the labor market's early-warning line for the AU audience") | widely-taught |
| `au-saving-ratio` | The hunkering-down gauge: with uncertainty, households save more and spend less first. | approved copy verbatim ("the hunkering-down gauge") | widely-taught |

---

## Batch 15 — au-trade-currency (6 indicators) — Milestone 2 complete

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `audusd` | ifRising | A stronger AUD usually means cheaper imports and overseas travel for Australians. | — | widely-taught (approved copy same claim) | widely-taught |
| `audusd` | ifFalling | A weaker AUD usually means dearer imports and travel, cheaper exports abroad. | — | widely-taught (approved copy same claim) | widely-taught |
| `audjpy` | ifRising | A firm AUD vs yen usually means cheaper Japan travel; risk appetite builds. | — | widely-taught (approved copy: travel + carry logic) | widely-taught |
| `audjpy` | ifFalling | A fast fall is the classic world de-risking signal as borrowed yen rushes home. | — | widely-taught (approved copy: "the classic world de-risking signal") | widely-taught |
| `terms-of-trade` | ifRising | Export prices beating import prices make the country richer without shipping more. | — | widely-taught (approved copy verbatim) | widely-taught |
| `terms-of-trade` | ifFalling | Import prices winning squeezes national income, budgets and the dollar. | — | widely-taught (approved copy same claim) | widely-taught |
| `rba-fed-gap` | ifRising | A wider AU-premium gap usually draws carry money toward the AUD. | — | widely-taught (approved copy: carry money tends to flow in) | widely-taught |
| `rba-fed-gap` | ifFalling | AU rates below US rates usually push money toward the higher US yield, weakening the AUD. | — | widely-taught (approved copy: money tends to leave for the higher yield) | widely-taught |
| `gold-aud` | ifRising | Gold priced dearer in AUD usually means dearer coins, jewellery and local metal. | — | widely-taught (approved copy same claim) | widely-taught |
| `gold-aud` | ifFalling | Gold cheaper in AUD is the rare local discount. | — | widely-taught (approved copy: "the local metal at a rare discount") | widely-taught |
| `iron-ore` | ifRising | Dearer iron ore usually fattens mining jobs, profits and government budgets. | — | widely-taught (approved copy same claim) | widely-taught |
| `iron-ore` | ifFalling | Cheaper iron ore pressures mining profits, budgets and the dollar. | — | widely-taught (approved copy same claim) | widely-taught |

### Connections (batch 15)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `audusd` | `rba-fed-gap` | The rate gap between the two central banks pulls this pair. | reliable | widely-taught: the policy-gap channel (approved copy) | widely-taught |
| `audusd` | `iron-ore` | Commodity booms usually lift the Australian dollar. | usually | widely-taught (approved copy: sustained AUD strength with commodity booms) | widely-taught |
| `audusd` | `dollar-basket` | This pair is one thread in the dollar's overall strength. | usually | definitional-adjacent (the AUD is one of the basket's reference currencies) | widely-taught |
| `audjpy` | `us-japan-10y-gap` | The US-Japan rate gap keeps the carry trade alive behind this pair. | reliable | widely-taught (approved copy: "Australian dollars are held for their yield while the yen funds that carry") | widely-taught |
| `audjpy` | `audusd` | The dollar's own strength often shows up here too. | usually | widely-taught | widely-taught |
| `audjpy` | `boj-rate` | The Bank of Japan anchors the yen side. | usually | widely-taught (approved copy: both central banks' policies move it) | widely-taught |
| `terms-of-trade` | `iron-ore` | Iron ore is the biggest export weight in this measure. | reliable | definitional (approved copy: Australia's single biggest export) | widely-taught |
| `terms-of-trade` | `audusd` | Export-vs-import strength usually steers the dollar over the years. | usually | widely-taught (approved copy: the gap steers the Australian dollar) | widely-taught |
| `rba-fed-gap` | `audusd` | This gap is a key pull on the key pair. | reliable | widely-taught (approved copy: read beside the AUD/USD card) | widely-taught |
| `rba-fed-gap` | `rba-cash-rate` | The RBA side of the gap. | reliable | definitional | widely-taught |
| `rba-fed-gap` | `fed-target` | The Fed side. | reliable | definitional | widely-taught |
| `gold-aud` | `gold-usd` | The world price is the main ingredient of the local one. | reliable | definitional (approved copy: live ounce × AUD rate) | widely-taught |
| `gold-aud` | `audusd` | A weaker local dollar usually makes gold dearer in Australia. | reliable | definitional (approved copy: either can move it) | widely-taught |
| `iron-ore` | `terms-of-trade` | Iron ore is the biggest weight in Australia's export prices. | reliable | definitional | widely-taught |
| `iron-ore` | `china-pmi` | Chinese factory strength usually drives this demand. | usually | widely-taught (approved copy: China's cycle dominates) | widely-taught |
| `iron-ore` | `audusd` | The dollar often rides on iron-ore fortunes. | usually | widely-taught (approved copy: a big swing factor in the AUD) | widely-taught |

### Australia angle (batch 15)
| id | claim | basis | status |
|---|---|---|---|
| `audusd` | Australia's key pair: prices imports, exports and travel in one number. | approved copy verbatim | widely-taught |
| `audjpy` | A watched world risk barometer, and the rate for Australian travel and shopping in Japan. | approved copy ("a watched risk barometer"; "the rate that matters for Australian travel and shopping in Japan") | widely-taught |
| `terms-of-trade` | Mining booms lift Australian budgets, jobs and the dollar together. | approved copy (mining booms sent it soaring) | widely-taught |
| `rba-fed-gap` | The short-term money pull between the two dollars; a wide gap either way usually moves the AUD. | approved copy (the policy-setting gap that drives short-term carry flows) | widely-taught |
| `gold-aud` | For coins, jewellery and metal funds priced in Australia, this is the real price, not the US-dollar one. | approved copy verbatim | widely-taught |
| `iron-ore` | Iron ore funds miners, budgets and the export-price story; China's building cycle dominates demand. | approved copy ("funds Australian miners, budgets and the broader terms of trade"; "China's property and stimulus cycle dominates") | widely-taught |

---

## Batch 16 — world stock markets: Asia-Pacific (7)

Per D-11/D-17: markets carry NO `australiaAngle` (D-08 scope) and the
approved per-market `what`/`why`/`you` copy is reused untouched (D-02).
New Layer-1 fields only. Index names in the new copy drop the digit
suffixes (Nikkei 225 → Japan's biggest companies; D-18 — G6 bans digits
in new fields; the official name with its number stays on the tile).

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `n225` | ifRising | Big Japanese firms faring well is often a sign of healthy world trade. | — | widely-taught (Japan's exporters as a trade bellwether; approved copy: many are exporters) | widely-taught |
| `n225` | ifFalling | A strong yen or weak world demand is often behind a Nikkei fall. | — | widely-taught (approved copy: "a weak yen usually helps exporters, and a sudden yen jump can hit this index hard") | widely-taught |
| `asx200` | ifRising | ASX gains often come with firm iron-ore and metal prices. | — | widely-taught (approved copy: "It follows iron ore, China's demand and the big banks") | widely-taught |
| `asx200` | ifFalling | ASX pressure usually comes from weaker iron ore or soft Chinese demand. | — | widely-taught (same basis) | widely-taught |
| `kospi` | ifRising | Korean chipmakers/exporters doing well = strong world electronics demand. | — | widely-taught (approved copy: "bellwether for the world's computer-chip cycle") | widely-taught |
| `kospi` | ifFalling | Korea's exporters struggle on weaker phone/car/chip demand. | — | widely-taught (same basis) | widely-taught |
| `hsi` | ifRising | Rising Hang Seng = investors feel better about Chinese business. | — | widely-taught (approved copy: the main door foreign investors use for China) | widely-taught |
| `hsi` | ifFalling | Falling Hang Seng = worry about China's economy or politics. | — | widely-taught (approved copy: reacts fast to China news) | widely-taught |
| `ssec` | ifRising | A stronger mainland market usually means stronger Chinese shoppers and demand for oil/metals. | — | widely-taught (approved copy: a read on China's domestic economy driving oil, iron ore, copper) | widely-taught |
| `ssec` | ifFalling | A cold mainland market usually cools China's demand for oil, metals, imports. | — | widely-taught (same basis) | widely-taught |
| `taiex` | ifRising | A strong TAIEX usually means strong world appetite for advanced chips. | — | widely-taught (approved copy: TSMC carries a huge weight; AI-chip supply chain) | widely-taught |
| `taiex` | ifFalling | A falling TAIEX often means chip demand cooling or Taiwan trouble being priced. | — | widely-taught (approved copy: geopolitical risk around Taiwan) | widely-taught |
| `nifty50` | ifRising | A rising Nifty usually means investor confidence in India's fast growth. | — | widely-taught (approved copy: one of the fastest-growing big economies) | widely-taught |
| `nifty50` | ifFalling | Foreign money often leaves India on growth or world-risk worries. | — | widely-taught (approved copy: money moving into or out of India shifts emerging-market funds) | widely-taught |

### Connections (batch 16)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `n225` | `usdjpy` | Japan's market usually moves with the yen; a cheaper yen helps exporters. | usually | widely-taught (approved copy: "It moves with the yen") | widely-taught |
| `n225` | `r2_carry_trade` | The yen-jump alarm reads this market beside USD/JPY. | reliable | definitional (FX rule R2's chart series = usdjpy + n225) | widely-taught |
| `asx200` | `iron-ore` | The home market follows iron ore closely. | usually | widely-taught (approved copy) | widely-taught |
| `asx200` | `china-pmi` | Chinese factory strength usually steers Australian company fortunes. | usually | widely-taught (approved copy: follows China's demand) | widely-taught |
| `asx200` | `audusd` | A firm home market and a firm local dollar sometimes move together. | sometimes | empirically loose correlation — softened + `sometimes` | needs-expert-check |
| `kospi` | `sp500` | Korea's market usually follows America's lead. | usually | widely-taught (US leads global risk appetite) | widely-taught |
| `kospi` | `hsi` | The two Asian hubs often share the same regional mood. | usually | widely-taught (regional risk sentiment) | widely-taught |
| `hsi` | `ssec` | Both read China's mood from different doors. | usually | widely-taught (onshore vs offshore China doors) | widely-taught |
| `hsi` | `china-pmi` | China's factory strength often lifts both doors. | usually | widely-taught | widely-taught |
| `ssec` | `china-pmi` | Factory strength usually leads the home market's mood. | usually | widely-taught (real economy leads equities) | widely-taught |
| `ssec` | `iron-ore` | China buys much of Australia's iron ore; the mood reaches Australian exports. | usually | widely-taught (approved copy: China buys a large share of Australia's iron ore) | widely-taught |
| `taiex` | `kospi` | Both ride the world's chip cycle. | reliable | widely-taught (the two chip-cycle bourses) | widely-taught |
| `taiex` | `ndx` | America's technology mood usually washes over Taiwan's. | usually | widely-taught | widely-taught |
| `nifty50` | `hsi` | India and China sometimes compete for the same global investor money. | sometimes | widely-taught (approved copy: competes with China for global investor money) — softened | widely-taught |
| `nifty50` | `sp500` | Falls in America often pull money out of emerging markets like India. | usually | widely-taught (US risk-off pulls EM flows) | widely-taught |

---

## Batch 17 — world stock markets: Europe + Americas A (8)

Same rules as batch 16 (D-08: no australiaAngle; D-02: approved
what/why/you reused; D-18: digit-free plain names).

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `stoxx50` | ifRising | Euro-area blue chips doing well = healthy world trade + steady European demand. | — | widely-taught (approved copy: one number for the health of the euro area) | widely-taught |
| `stoxx50` | ifFalling | Euro-area business struggling = worry about the euro-area economy. | — | widely-taught (same basis) | widely-taught |
| `dax` | ifRising | Busy German factories/exporters = a good sign for world trade. | — | widely-taught (approved copy: Germany sells goods worldwide) | widely-taught |
| `dax` | ifFalling | Struggling German industry = an early sign of slowing world trade. | — | widely-taught (approved copy: weakness can signal slowing world trade) | widely-taught |
| `cac` | ifRising | French business doing well, often with luxury/banks/energy in demand. | — | widely-taught (approved copy names the sectors) | widely-taught |
| `cac` | ifFalling | French business pressured by soft home spending or weaker world demand. | — | widely-taught | widely-taught |
| `ftse` | ifRising | The global mining/oil/banking giants earn well (most earn abroad). | — | widely-taught (approved copy: works like a gauge of commodities and world growth) | widely-taught |
| `ftse` | ifFalling | World-facing giants struggle, often with oil and metals down. | — | widely-taught (same basis) | widely-taught |
| `sp500` | ifRising | Confident US business; world markets usually follow America higher. | — | widely-taught (approved copy: "when it falls sharply, markets almost everywhere follow") | widely-taught |
| `sp500` | ifFalling | US pressure often drags markets almost everywhere down. | — | widely-taught (approved copy same claim, hedged) | widely-taught |
| `ndx` | ifRising | Investors want technology/growth stories and accept risk. | — | widely-taught (approved copy: shows the mood for technology and growth stocks) | widely-taught |
| `ndx` | ifFalling | Investors pulling back from technology and pricier growth stories. | — | widely-taught (approved copy: falls mean investors are pulling back from risk) | widely-taught |
| `dow` | ifRising | A rising Dow often lifts the mood of markets that open next. | — | widely-taught (approved copy: "can set the mood for every market that opens after New York") | widely-taught |
| `dow` | ifFalling | A falling Dow often sours the mood of later-opening markets. | — | widely-taught (same basis) | widely-taught |
| `tsx` | ifRising | Canadian energy/banking/mining earn well, often with firm oil and metals. | — | widely-taught (approved copy: heavy in energy, banks and mining; moves with oil) | widely-taught |
| `tsx` | ifFalling | Canadian firms struggle, often with oil and metals down. | — | widely-taught (same basis) | widely-taught |

### Connections (batch 17)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `stoxx50` | `dax` | The German and euro-wide lists usually tell one European story. | usually | widely-taught (core-europe correlation) | widely-taught |
| `stoxx50` | `eurusd` | Europe's health often shows in its money too. | usually | widely-taught (growth ↔ currency channel) | widely-taught |
| `stoxx50` | `r6_europe_worry` | The Europe-worry alarm reads this list beside EUR/CHF. | reliable | definitional (FX rule R6's chart series = eurchf + stoxx50) | widely-taught |
| `dax` | `oecd-cli-de` | The German leading indicator usually turns with this market. | usually | widely-taught (the OECD CLI is built to lead the cycle) — term listed in glossaryTerms | widely-taught |
| `dax` | `stoxx50` | Germany's list usually leads Europe's. | usually | widely-taught (biggest euro-area economy) | widely-taught |
| `dax` | `ssec` | China's demand pulls hard on German exports. | usually | widely-taught (approved copy: a good read on demand from China) | widely-taught |
| `cac` | `dax` | France and Germany usually tell one European story. | usually | widely-taught (approved copy: alongside the DAX and Euro Stoxx 50) | widely-taught |
| `cac` | `stoxx50` | France's list is a big slice of Europe's widest one. | usually | definitional-adjacent (CAC members are Stoxx constituents) | widely-taught |
| `cac` | `eurusd` | France's list usually moves with the euro too. | usually | widely-taught (approved copy: moves with the euro and European rates) | widely-taught |
| `ftse` | `brent` | A big slice of this list sells oil, so Brent often moves it. | usually | widely-taught (approved copy: full of global miners and oil companies; often rises with oil) | widely-taught |
| `ftse` | `gbpusd` | The pound usually tells a UK story beside this world-facing list. | usually | widely-taught (approved gbpusd copy: a pound-only move is usually a UK story) | widely-taught |
| `sp500` | `vix` | The market fear gauge usually climbs when this list falls. | usually | definitional (the VIX is priced from S&P option swings) | widely-taught |
| `sp500` | `dow` | The two most-quoted US lists usually tell one story; this one is the broader. | usually | widely-taught (approved copy: the S&P is the better measure) | widely-taught |
| `sp500` | `r4_money_hiding` | The money-hiding alarm reads this list beside the dollar and gold. | reliable | definitional (FX rule R4's series = sp500 + dollar + gold) | widely-taught |
| `ndx` | `sp500` | This list usually swings harder than the broad one. | usually | widely-taught (approved copy: "It usually swings harder than the S&P 500") | widely-taught |
| `ndx` | `btc-usd` | Falls here often ripple into crypto. | usually | widely-taught (approved copy: "can ripple into crypto and growth funds") — softened to `usually` | widely-taught |
| `ndx` | `taiex` | The chip chain links Taiwan's list to this one. | usually | widely-taught (the AI-chip supply chain spans both) | widely-taught |
| `dow` | `sp500` | Both tell the US story; the broad list is the better measure. | reliable | widely-taught (approved copy: "the S&P 500 above is the better measure") | widely-taught |
| `dow` | `ndx` | The technology list reads the same country, louder. | sometimes | softened co-movement claim | needs-expert-check |
| `tsx` | `brent` | Canada sells a lot of oil, so Brent often moves this list. | usually | widely-taught (approved copy: a read on oil and metal prices) | widely-taught |
| `tsx` | `sp500` | Canada's market usually follows its giant next-door neighbour. | usually | widely-taught (approved copy: Canada is the US's closest trading partner) | widely-taught |

---

## Batch 18 — world stock markets rest + the remaining FX pairs (7)

Same rules (D-08: no australiaAngle on markets/pairs; D-02: approved
`what`/`you` reused; pairs carry the FX-board entries' approved names).
The shared-id pairs (usdjpy/usdcny/audusd/audjpy) were done in earlier
batches and are reused by the FX board — not duplicated here (D-11).

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `ibov` | ifRising | A rising Bovespa usually means investors are fine with riskier emerging markets and raw-material exporters. | — | widely-taught (approved copy: stand-in for emerging markets and commodity exporters) | widely-taught |
| `ibov` | ifFalling | Investors fleeing riskier markets usually comes with a stronger US dollar nearby. | — | widely-taught (approved copy: "A sharp fall often goes with a stronger US dollar and weaker emerging-market currencies") | widely-taught |
| `eurusd` | ifRising | A stronger euro usually makes dollar-priced goods cheaper for euro earners. | — | widely-taught (purchasing-power mechanics) | widely-taught |
| `eurusd` | ifFalling | A weaker euro usually makes imports and travel dearer for euro earners. | — | widely-taught (inverse) | widely-taught |
| `gbpusd` | ifRising | A stronger pound usually makes dollar-priced goods and travel cheaper for Britons. | — | widely-taught (same mechanics) | widely-taught |
| `gbpusd` | ifFalling | A weaker pound usually makes imports and US travel dearer for Britons. | — | widely-taught (inverse) | widely-taught |
| `usdchf` | ifRising | The dollar gains on the franc through broad strength or as world worry fades. | — | widely-taught (the franc weakens in calm; the dollar's broad moves dominate crosses) | widely-taught |
| `usdchf` | ifFalling | The franc gaining on the dollar is often a sign of world worry. | — | widely-taught (approved copy: the franc is a classic safe haven) | widely-taught |
| `eurjpy` | ifRising | A stronger euro against the yen often goes with calm world moods; cheaper Japan trips for Europeans. | — | widely-taught (yen weakens in calm / risk appetite) | widely-taught |
| `eurjpy` | ifFalling | A falling euro against the yen usually means worried investors rushing back into the yen. | — | widely-taught (approved copy: a second opinion on world mood, Europe's money vs the safe-haven yen) | widely-taught |
| `eurchf` | ifRising | The euro gaining on the franc often means worry about Europe is fading. | — | widely-taught (approved copy: it falls when worry about Europe rises) | widely-taught |
| `eurchf` | ifFalling | The franc gains when investors worry about Europe; a fast fall is a classic warning. | — | widely-taught (approved copy: "Europe's safe-haven pair") | widely-taught |
| `audcny` | ifRising | The AUD usually gains on the yuan when China's demand looks healthy. | — | widely-taught (AUD as the China-demand currency) | widely-taught |
| `audcny` | ifFalling | The AUD usually sags against the yuan when China's economy cools. | — | widely-taught (inverse) | widely-taught |

### Connections (batch 18)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `ibov` | `dollar-basket` | Emerging-market falls usually go with broad dollar strength. | usually | widely-taught (approved copy same claim) | widely-taught |
| `ibov` | `brent` | Brazil's oil and mining giants ride world raw-material prices. | usually | widely-taught (approved copy: large oil, mining and bank companies) | widely-taught |
| `eurusd` | `dollar-basket` | The euro is the biggest single weight in the dollar basket. | reliable | definitional (the reused basket's weights) | widely-taught |
| `eurusd` | `ecb-dfr` | The European Central Bank steers the euro's side. | usually | widely-taught (policy rate → currency) — term listed: central-bank | widely-taught |
| `eurusd` | `r7_dollar_or_euro` | The dollar-or-euro pattern explains this pair's moves. | reliable | definitional (FX rule R7's series = eurusd + dollar) | widely-taught |
| `gbpusd` | `boe-rate` | The Bank of England steers the pound's side. | usually | widely-taught — term listed: central-bank | widely-taught |
| `gbpusd` | `dollar-basket` | The pound is one thread in the dollar's overall strength. | usually | definitional (GBP is one of the basket's seven reference currencies) | widely-taught |
| `usdchf` | `dollar-basket` | The franc is one thread in the dollar's overall strength. | usually | definitional (CHF is one of the basket's reference currencies) | widely-taught |
| `usdchf` | `eurchf` | Europe's worry pair reads this same franc. | reliable | definitional (same quote currency) | widely-taught |
| `eurjpy` | `audjpy` | The Australian-dollar pair reads the same mood; a shared fall is the stronger signal. | reliable | widely-taught (approved R1 copy: "Confirmed by the euro against the yen") | widely-taught |
| `eurjpy` | `eurusd` | The euro's own health shows in both pairs. | usually | widely-taught (common base currency) | widely-taught |
| `eurjpy` | `boj-rate` | The Bank of Japan anchors the yen side. | usually | widely-taught — term listed: central-bank | widely-taught |
| `eurchf` | `stoxx50` | The Europe-worry alarm reads this pair beside Europe's main company list. | reliable | definitional (FX rule R6's series = eurchf + stoxx50) | widely-taught |
| `eurchf` | `r6_europe_worry` | This pattern card is built around this pair. | reliable | definitional | widely-taught |
| `audcny` | `iron-ore` | Iron ore is the biggest trade behind the link. | usually | widely-taught (approved copy: Australia's biggest customer) | widely-taught |
| `audcny` | `usdcny` | The yuan against the US dollar is this pair's other half. | reliable | definitional (the cross's quote-side leg) | widely-taught |
| `audcny` | `r5_china_link` | The China-link pattern watches exactly these two legs. | reliable | definitional (FX rule R5's series = audusd + usdcny) | widely-taught |

---

## Batch 19 — the 7 FX pattern cards (129/129 complete)

Per D-09: `ifRising`/`ifFalling` are null + `skipReason` on every pattern
card (they describe a RELATIONSHIP between two/three moving lines, not a
level). Connections follow the "the legs + one related card" shape (≤3).
No `australiaAngle` (D-08).

| id | field | claim (paraphrased) | strength | basis | status |
|---|---|---|---|---|---|
| `r1_risk_mood` | oneLine | In calm times the Australian dollar and US stocks usually move together. | — | widely-taught (approved R1 copy: risk currencies and stocks rise together in calm moods) | widely-taught |
| `r2_carry_trade` | oneLine | A sudden yen surge usually shakes the carry trade and world markets. | — | widely-taught (approved R2 copy: "the carry trade... can hit stock markets worldwide"; term listed: carry-trade) | widely-taught |
| `r3_dollar_strength` | oneLine | The US dollar and gold usually move in opposite directions. | — | widely-taught (the classic dollar-gold seesaw; approved R3 copy: "a strong dollar usually pressures gold") | widely-taught |
| `r4_money_hiding` | oneLine | In a scare money usually runs to the US dollar; if it leaves the dollar, gold often shines. | — | widely-taught (approved R4 copy: "when even the dollar is sold, trust is shaky, and gold often rises") | widely-taught |
| `r5_china_link` | oneLine | China's demand usually moves the Australian dollar and the yuan in mirror-image ways. | — | widely-taught (approved R5 copy: AUD and CNY often weaken together vs the dollar — stated in the pattern's own opposite-direction terms) | widely-taught |
| `r6_europe_worry` | oneLine | When Europe worries, the euro usually slips against the franc and European companies fall. | — | widely-taught (approved R6 copy: nervous Europeans buy francs, so the euro-franc pair falls; European shares follow) | widely-taught |
| `r7_dollar_or_euro` | oneLine | EUR/USD moves are either a dollar story or a euro story; this card tells which. | — | definitional (approved R7 copy: "This card tells you which") | widely-taught |

### Connections (batch 19)
| id | connection.with | claim | strength | basis | status |
|---|---|---|---|---|---|
| `r1_risk_mood` | `audjpy` | The mood leg: a growth currency priced in yen. | reliable | definitional (R1's series) | widely-taught |
| `r1_risk_mood` | `sp500` | The mood's other leg: America's main company list. | reliable | definitional (R1's series) | widely-taught |
| `r1_risk_mood` | `eurjpy` | A second yen pair often confirms the same mood. | usually | widely-taught (approved R1 confirmLine: "Confirmed by the euro against the yen") | widely-taught |
| `r2_carry_trade` | `usdjpy` | The pair this alarm reads. | reliable | definitional (R2's series) | widely-taught |
| `r2_carry_trade` | `n225` | The stock leg: Japan's main company list. | reliable | definitional (R2's series) | widely-taught |
| `r2_carry_trade` | `us-japan-10y-gap` | The rate gap that keeps this trade alive. | reliable | widely-taught (approved copy: the carry trade's fuel) | widely-taught |
| `r3_dollar_strength` | `dollar-basket` | The dollar leg: the dollar against six big currencies. | reliable | definitional (R3's series) | widely-taught |
| `r3_dollar_strength` | `gold-usd` | The gold leg: the world price of an ounce. | reliable | definitional (R3's series) | widely-taught |
| `r3_dollar_strength` | `real-yield-10y` | Higher US lending returns often lift the dollar and weigh on gold. | usually | widely-taught (higher real yields raise the opportunity cost of gold) | widely-taught |
| `r4_money_hiding` | `sp500` | The risk leg: America's main company list. | reliable | definitional (R4's series) | widely-taught |
| `r4_money_hiding` | `dollar-basket` | The safety leg: the dollar against six currencies. | reliable | definitional (R4's series) | widely-taught |
| `r4_money_hiding` | `gold-usd` | The second safety leg: the world gold price. | reliable | definitional (R4's series) | widely-taught |
| `r5_china_link` | `audusd` | One leg: Australia's key pair. | reliable | definitional (R5's series) | widely-taught |
| `r5_china_link` | `usdcny` | The other leg: the yuan against the dollar. | reliable | definitional (R5's series) | widely-taught |
| `r5_china_link` | `iron-ore` | The trade behind the link: iron ore, China's biggest import from Australia. | usually | widely-taught (approved R5 copy: China is the biggest buyer of Australia's iron ore) | widely-taught |
| `r6_europe_worry` | `eurchf` | The money leg: the euro against Switzerland's franc. | reliable | definitional (R6's series) | widely-taught |
| `r6_europe_worry` | `stoxx50` | The company leg: Europe's main company list. | reliable | definitional (R6's series) | widely-taught |
| `r6_europe_worry` | `ecb-dfr` | The European Central Bank's rate often steers Europe's mood. | usually | widely-taught (policy rate → growth/mood; term listed: central-bank) | widely-taught |
| `r7_dollar_or_euro` | `eurusd` | The pair being explained. | reliable | definitional (R7's series) | widely-taught |
| `r7_dollar_or_euro` | `dollar-basket` | The yardstick that separates the two stories. | reliable | definitional (R7's series) | widely-taught |
| `r7_dollar_or_euro` | `stoxx50` | A weak-euro story often shows here too. | sometimes | softened co-movement claim | needs-expert-check |

---

## Final status — Milestone 3 complete (129/129)

All 129 unique ids have complete EN+FA Layer-1 copy (133 inventory table
rows; the 4 shared FX ids counted once). Glossary holds 23 terms in both
languages (no new terms were needed in M3 — the reused terms:
leading-indicator on dax, central-bank on eurusd/gbpusd/eurjpy/
r6_europe_worry, carry-trade on r2_carry_trade). The full strict gate
(LAYER1_STRICT=1) + the whole per-batch gate list re-run from a clean
state are the final session's first job (per D-07/D-12), followed by the
owner's deploy-lock check (docs/DEPLOY.md) and the deploy itself.

**Final-session addendum (2026-10-28):** all of the above completed — the
strict gate re-verified green from a clean state (7809/7809), the
deploy-lock check ran clear (last prior upload `27f42b9c`,
2026-10-27T18:31Z, the R10 deploy), currena-api `c02d736a` deployed and
live-verified (both locales, 1280/360px, all four surfaces + the D-11
shared ids). The complete verification handoff for the checking agent —
including the independent re-audit of this file's claims and the honest
caveats (the 10 `needs-expert-check` rows above are itemized there) — is
**`FINAL-REPORT.md`** in this folder.
