# 02. The reference taxonomy — the classic gold-direction checklist

**Status: DRAFT v0 (spec session, 2026-11-04).** This is the audit's fixed
denominator. GA-S1 verifies every row (definition, sign, source, availability),
runs the blind-spot sweep, and delivers it as **v1** for the owner's lock
(OI-GA-1). Nothing in here describes the current meter — by design (D-GA-1).
Where a row's wording brushes the current voter set that is accident, not
input.

**How to read a row.** *Classic claim*: the sign convention a 20-year gold
desk applies — what the condition says about gold's direction and why (the
channel). *Source*: the free, keyless, licence-clean canonical source (D-GA-5;
`MISSING-PAID` sources named for completeness). *Treatment*: how the classic
literature reads it — level, change, z-score/extreme, or context-only.

**The families.** R real rates & policy · D the dollar · I inflation &
purchasing power · S stress, risk & haven demand · F flows, positioning &
demand · X cross-asset relative value · G fiscal & sovereign · H supply ·
M meta (deliberately non-voting).

---

## R. Real rates & policy — the opportunity cost of holding gold

The single most documented driver: gold pays no coupon, so its price is
anchored to what a holder forgoes. Real, not nominal — the classic desk rule
is "watch DFII10 before anything else."

| ID | Indicator | Classic claim (sign → channel) | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| R1 | US 10y real yield (TIPS) | **−**: the forgone long real return; falling real yields cut the carry penalty on gold, rising raises it | FRED `DFII10` | daily / 0 | level vs decade range + 30–90d change |
| R2 | US 5y real yield | **−**: the belly is where policy expectations bite first | FRED `DFII5` | daily / 0 | same |
| R3 | US 2y real yield | **−**: the front end is the purest policy-path real rate | FRED `DFII2` | daily / 0 | same |
| R4 | Real curve (10y−2y real) | regime-dependent: a steepening-from-inversion marks an easing cycle, historically gold's best regime; not a standalone direction bet | derived (R1−R3) | daily | context / secondary |
| R5 | Policy rate (Fed target range) | **−**: the level of the nominal anchor; cuts ease the carry penalty | FRED `DFEDTARU`/`DFEDTARL`, `DFF` | daily (on change) / 0 | level + step direction |
| R6 | Market-implied policy path | **−**: the priced path is what moves gold before the Fed does (2y yield, or the repo's own fed-expectations derivation) | FRED `DGS2` | daily / 0 | change + level vs decade range |
| R7 | Long-run breakeven (5y5y) | **+**: the market's priced long-run inflation — the hedge reason to hold gold at all | FRED `T5YIFR` | daily / 0 | level + change (the classic "expectations tilt") |
| R8 | Spot breakevens (5y, 10y) | **+**: near-horizon hedge demand; falling spot breakevens read as disinflation pressure on gold | FRED `T5YIE`, `T10YIE` | daily / 0 | level + change |
| R9 | Term premium (10y) | **+**: compensation demanded for holding duration — rises with fiscal/inflation-risk fear, gold-positive | ACM via NY Fed (free); repo already ingests `term-premium-10y` | daily-ish / days | level + change |
| R10 | Foreign policy rates (ECB DFR, BoJ, BoE) + policy gaps | **−** for gold in USD: gold is priced against the *global* rate structure; falling foreign real rates debase the alternatives | ECB Data Portal; BoJ/BoE sites (all free, keyless) | on change / 0 | level of gaps; context for the crosses |
| R11 | R-star / neutral-rate estimates | context: when policy sits above r*, the real penalty is restrictive — the regime label for the R-family | NY Fed HLW (free, quarterly) | quarterly / ~1q | context-only |
| R12 | Negative-yielding debt universe | **+** historically (the 2015–2021 bid); the free compilations died with the phenomenon | none free since ~2022 | — | NOT-APPLICABLE candidate (post-2022 the stock is ~0); GA-S1 records the era note |

## D. The dollar — the denominator of the gold price

Gold is quoted in USD; a stronger dollar mechanically cheapens it for the
world's buyers and vice versa. The classic caution: DXY is euro-heavy — the
*trade-weighted* dollar is the honest measure.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| D1 | DXY / dollar basket | **−**: the headline inverse | ECB reference rates via Frankfurter (the repo's own basket) | daily / 0 | level vs decade range + change |
| D2 | Broad trade-weighted dollar | **−**: the honest inverse — trade weights, not the DXY's 57% euro | FRED `DTWEXBGS` | daily / 0 | level + change |
| D3 | EUR/USD | **−** via the DXY mechanics (the euro leg) | Frankfurter | daily / 0 | cross-check / context |
| D4 | USD/JPY | **−**: the global carry pressure gauge; a falling USD/JPY marks unwinds that bid gold | Frankfurter | daily / 0 | change emphasis |
| D5 | USD share of world FX reserves (COFER) | **−** for gold (long-run): reserve diversification away from USD is the structural gold bid | IMF COFER via api.imf.org SDMX (free; the repo already ingests it) | quarterly / ~1q | slow trend; context-voter debate (OI-GA-3/4) |
| D6 | Gold in non-USD terms (XAU/EUR, XAU/AED…) | context: regional price pressure and the "gold is really doing this" check that strips the dollar | Frankfurter × gold-api (both free; the repo derives gold-aud today) | daily / 0 | context |

## I. Inflation & purchasing power — the hedge reason

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| I1 | US headline CPI YoY + momentum | **+**: the realised-inflation channel of the hedge case | FRED `CPIAUCSL` (derived YoY) | monthly / ~2–4w | level + 3m annualised momentum |
| I2 | Core CPI / core PCE YoY | **+**: the persistent core the Fed actually targets | FRED `CPILFESL`, `PCEPILFE` | monthly / ~2–5w | level + momentum |
| I3 | Michigan 1-year inflation expectations | **+**: households pricing inflation in before the market does | UoM Surveys of Consumers (SIE, free; repo ingests) | monthly / ~2w | level + change |
| I4 | Michigan 5–10-year expectations | **+**: the long-run household anchor — the slow version of R7 | UoM SIE (free) | monthly / ~2w | level + change |
| I5 | Market long-run expectations | cross-listed R7 | FRED `T5YIFR` | daily / 0 | as R7 |
| I6 | Spot breakevens | cross-listed R8 | FRED `T5YIE`/`T10YIE` | daily / 0 | as R8 |
| I7 | Money supply (M2) growth | **+** on the debasement channel, slow-moving and regime-scale | FRED `M2SL` | monthly / ~4w | YoY level; context-leaning |
| I8 | Inflation persistence (median CPI, sticky CPI) | **+**: breadth and stickiness distinguish regimes from blips | Cleveland Fed (via FRED `MEDCPIM158SFRBCML`), Atlanta/Sticky (repo ingests both) | monthly | level; context-leaning |
| I9 | Inflation surprises vs expectations | **+**: upside surprises reprice the hedge case fast | Cleveland Fed nowcasts vs realised (free) | daily-ish | event/short-window; context-leaning |
| I10 | Real gold price vs its long-run range | context: the valuation anchor — how expensive gold is in purchasing-power terms | derived (gold ÷ CPI; Shiller-method) | monthly | context-only |

## S. Stress, risk & haven demand

The classic nuance: safe-haven demand is *conditional* — in a rates-driven
selloff (2022) gold can fall with equities; in a credit/geopolitical shock
it bids. The family measures which regime is running.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| S1 | VIX level (+ term slope) | **+**: equity fear bids gold — unless the fear *is* a real-rate shock | CBOE via FRED `VIXCLS` | daily / 0 | level vs range |
| S2 | High-yield credit spread | **+**: the classic risk gauge — widening HY is the credit-stress regime where gold's haven bid is cleanest | FRED `BAMLH0A0HYM2` | daily / 0 | level + change |
| S3 | Investment-grade spread | **+** (secondary): confirms S2 is systemic, not idiosyncratic | FRED `BAMLC0A0CM` | daily / 0 | level + change |
| S4 | Excess bond premium (EBP) | **+**: the de-trended risk-appetite signal the literature prefers to raw spreads | Fed Board file (free; repo ingests `ebp`) | monthly | level |
| S5 | Financial-stress composites (NFCI, STLFSI, OFR FSI) | **+**: broad stress composites | Chicago/St. Louis/OFR (all free; repo ingests all three) | weekly | level |
| S6 | Equity drawdown / breadth | **+**: drawdowns and narrowing breadth mark the risk-off regime | Yahoo SPY/RSP (free; the repo derives breadth) | daily / 0 | drawdown depth; context-leaning |
| S7 | Geopolitical risk (GPR, + acts/threats split) | **+**: the event-risk channel; threats lead, acts confirm | Caldara–Iacoviello export (free; repo ingests 10 series incl. daily) | daily & monthly | level vs own history |
| S8 | Policy uncertainty (EPU, TPU) | **+**: regime uncertainty raises the hedging premium | Baker–Bloom–Davis (free; repo ingests) | monthly | level |
| S9 | Bank stress / facility usage | **+**: discount-window and standby-facility usage is the modern bank-run tell (2023) | NY Fed / FRED (free) | weekly | event-leaning; context |
| S10 | Repo-market stress (SOFR−IORB etc.) | **+**: plumbing stress marks the funding-fear regime | FRED (free; the repo already ingests `repo-stress`) | daily | level; context |
| S11 | EU sovereign stress (BTP–Bund) | **+**: the regional haven magnet that competes for the same bid | ECB/FRED mirrors (free; repo ingests) | daily | context-leaning |

## F. Flows, positioning & demand — the COT school

Who is actually buying, and how crowded the boat is. The classic treatment is
**contrarian at extremes** (crowded longs = fragility) and **confirming in
the middle**; this family is the least represented in the current meter.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| F1 | CFTC managed-money net length (share of OI) | contrarian at extremes: record-crowded longs mark fragile tops, record shorts mark capitulation bottoms | CFTC legacy COT `deafut.txt` (free, keyless; repo ingests but thin) | weekly / ~3d | z-score / decade percentile of net share |
| F2 | CFTC gross long & short | richer than net: long-only and short-only extremes tell different stories | same | weekly / ~3d | percentiles |
| F3 | Gold ETF holdings & flows (GLD tonnes / world total) | **+** trend-confirming: the Western investor bid, visible daily | SPDR page + WGC monthly (both free; GLD daily is scrapeable) | daily–monthly | level trend + flow direction |
| F4 | Central-bank net purchases | **+** structural: the 2022–2026 regime driver — official-sector buying floors the price | WGC Gold Demand Trends (free, quarterly) | quarterly / ~3–5w | annualised level; context-voter debate (OI-GA-4) |
| F5 | Total demand vs supply balance | context: the annual balance frames everything else | WGC GDT (free) | quarterly | context |
| F6 | Shanghai/Asia premium (SGE vs LBMA) | **+**: the Eastern physical bid's premium is the classic scarcity tell | SGE en.sge.com.cn daily quotes × LBMA PM (both free) | daily / 0 | premium level vs its own range |
| F7 | India premium/discount | **+** secondary physical bid (monsoon/Diwali seasonality lives here) | MCX delayed + import-parity derivation (free-ish) | daily | seasonal band; context-leaning |
| F8 | COMEX warehouse stocks (registered) | context: deliverable-stock drains mark squeeze regimes | CME published reports (free) | daily / ~1d | level; context |
| F9 | Lease rates / forward rates | **+**: true physical scarcity pricing (GOFO died 2015; the successor benchmarks are paid/thin) | LBMA/broker data — MISSING-PAID; proxy via futures calendar spreads (EODHD or CME delayed) | daily | context; OI-GA-5 |
| F10 | Futures term structure (contango slope) | context: carry cost of the long position; backwardation = exceptional | EODHD (owner key, OI-GA-5) or CME delayed | daily | context |
| F11 | Retail coin & small-bar demand (US Mint) | **+**: the retail fear gauge — coin-sales spikes mark panic bids | usmint.gov bullion sales (free) | monthly | level vs range; context-leaning |
| F12 | Gold-backed ETF short interest / GLD volume | context: the squeeze-tell complements F1 | free-ish (fund pages) | weekly | context |

## X. Cross-asset relative value

Ratios the desk watches as regime shorthand. Mostly context by nature — but
one of them (`gold-silver`) is already a voter, so the family is here in
full for the matrix.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| X1 | Gold/silver ratio | regime gauge: high = monetary-fear regime; falling = industrial-risk-on — reads **+** for gold's haven character when rising | gold-api (free tier; repo derives it) | daily / 0 | level vs decade range |
| X2 | Gold/oil ratio | context: the real-energy purchasing-power shorthand | gold-api × EIA (both free; repo derives) | daily / 0 | context |
| X3 | Gold/copper | context: the growth-vs-fear axis | gold-api × copper (repo derives `copper-gold`) | daily / 0 | context |
| X4 | Gold/Bitcoin | context: the store-of-value competition, post-2017 | gold-api × Bitstamp (both free; repo derives `gold-btc`) | daily / 0 | context |
| X5 | Gold vs equities (GLD/SPY) | context: the long-horizon rotation gauge | Yahoo (free) | daily / 0 | context |
| X6 | Gold real price percentile | cross-listed I10 | derived | monthly | context |

## G. Fiscal & sovereign — the debasement trade

The post-2020 family: the deficit channel the gold market prices through
term premia (R9) and reserve behaviour (D5). The repo already ingests most
of it — as context.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| G1 | Federal deficit (% GDP, 12m rolling) | **+**: fiscal dominance is the classic long-run gold narrative | FRED / Treasury MTS (free; repo ingests `us-deficit-12m`) | monthly | level; slow voter or context |
| G2 | Net interest burden | **+**: interest crowding out the budget is the accelerator of G1 | FRED (free; repo ingests `govt-interest-revenue`) | quarterly | level; context-leaning |
| G3 | Debt/GDP | **+** structural anchor | FRED `GFDEGDQ188S` | quarterly | context |
| G4 | Foreign official Treasury holdings (TIC SLT + NY Fed custody) | **−** when falling: the foreign financing retreat that pairs with D5 | Treasury TIC + NY Fed (free; repo ingests both) | monthly / ~1.5m | trend; context-leaning |
| G5 | Treasury auction demand (indirect bids, tails) | **+** when weak: auction indigestion marks the regime's stress points | Treasury (free; repo ingests auctions + indirect) | per auction | event-leaning; context |
| G6 | Debt-ceiling / shutdown risk | **+** episodic: the classic event spikes | calendar/manual (free) | episodic | context note; never a standing voter |
| G7 | US sovereign CDS (5y) | **+**: the market's tail price on US credit | paid (Markit); free proxy = T-bill dislocation around ceilings | — | MISSING-PAID; OI-GA-5 |

## H. Supply — mine, scrap, fabrication

Slow, annual-scale, and classically **context-only** for a conditions meter:
no desk times the month's direction off mine output. Recorded so the audit
can say the family was examined, not forgotten.

| ID | Indicator | Classic claim | Free source | Cadence | Treatment |
|---|---|---|---|---|---|
| H1 | Mine production | context (supply ceiling, very slow) | WGC/USGS (free) | quarterly–annual | context |
| H2 | Recycling supply | context (price-elastic scrap) | WGC (free) | quarterly | context |
| H3 | Jewellery + technology fabrication | context (the price-sensitive demand floor) | WGC (free) | quarterly | context |
| H4 | Producer hedging / de-hedging | context (forward sales add latent supply) | WGC (free) | quarterly | context |

## M. Meta — deliberately non-voting, recorded so the audit is exhaustive

| ID | Item | Why it is not a voter |
|---|---|---|
| M1 | Gold's own price move / footing | Circularity — counting a falling price as evidence of falling is the exact defect D-GB-5 removed. Context pill only. |
| M2 | Gold volatility (GVZ) | Real-time implied vol is paid (CBOE); second-order for a conditions meter. Context if ever free. |
| M3 | Seasonality (Diwali, Lunar New Year, wedding season) | Calendar, not a condition; belongs in copy notes if anywhere. |
| M4 | The two-factor residual (real rates + dollar model) | An analytic device, not an observable condition. Research-only. |

---

## Row count and the sweep

Draft v0: **R12 + D6 + I10 + S11 + F12 + X6 + G7 + H4 + M4 = 72 rows**
(cross-listed rows R7/R8/I5/I6 and X6/I10 counted once in their primary
family). GA-S1's blind-spot sweep (01 §5.3) may append rows **before** the
v1 lock; after the lock, additions are owner-recorded amendments only.
The classification (GA-S3) must account for every row — the arithmetic is
part of the report header (01 §5.5).
