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

## Batch 7 — (pending)

_Indicators: stress-stlfsi, nfci, vix, gold-silver, cftc-gold-positioning, walcl_

— pending — fill in when batch 7 copy is written.
