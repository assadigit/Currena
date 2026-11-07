# Currena — Gold-Specific Indicators: Methods & Sources

> **Phase 0 audit document** · generated 2026-11-07 from the source of truth
> (`packages/insights/src/gold-score.ts`, `gold-balance.ts`, `connections.ts`,
> the adapter set, and `data/indicators.json` v4 @ commit `41e7ccf`).
> Companion to `04-INDICATORS-COMPLETE-INVENTORY.md` (the full 184-id registry).
> Everything gold that Currena fetches, computes, votes on, or deliberately
> refuses to fetch — with the exact method and source for each.

---

## Table of contents

1. [The gold system in one page](#1-the-gold-system-in-one-page)
2. [The 37-voter table — every seat, rule, source](#2-the-37-voter-table)
3. [The evaluation method — how a seat fires](#3-the-evaluation-method)
4. [The engine — lane aggregation & the balance](#4-the-engine)
5. [Gold context indicators (non-voting)](#5-gold-context-indicators)
6. [Gold data sources — fetch methods](#6-gold-data-sources--fetch-methods)
7. [Gold derived formulas](#7-gold-derived-formulas)
8. [Disabled & blocked gold items](#8-disabled--blocked-gold-items)
9. [Deliberate exclusions from voting](#9-deliberate-exclusions-from-voting)
10. [The honest record — backtest & calibration](#10-the-honest-record)
11. [Governance — how the meter may change](#11-governance)

---

## 1. The gold system in one page

**ONE question, ONE instrument:** *which of five macro conditions lean FOR
gold's price today, which lean AGAINST, and which do not lean.*

- A **descriptive conditions meter** — it reads conditions today, never
  direction; no forecasting edge is claimed or implied (measured: sign
  agreements 46.8 / 42.2 / 32.7% at 5/20/60 trading days — below coin flip).
- **5 lanes · 37 voters** (7 borrowing-costs · 7 dollar · 11 stress ·
  10 inflation · 2 flows). Every seat = exactly 1 vote; every lane = exactly
  1 vote. **No numeric weights exist in the code.**
- A lane votes only when **≥2 of its voters fire** (MIN2 crowd minimum);
  the Outlook strong bar is **4-of-5 lanes (80%)**.
- Live at https://currena.ir as THE gold card for every visitor; the frozen
  engine (`goldTailwindScore`) and backtest harness preserved for lineage.
- File map: voters `gold-score.ts` · engine `gold-balance.ts` · evaluator
  `connections.ts` (`evalLeg` + `SIGNAL_LEG_MOVE`) · UI `signals/BalanceScale.tsx`,
  `signals/verdict.tsx` · full spec `docs/insights/GOLD_SYSTEM_COMPLETE_REFERENCE.md`.

**Lane semantics (tailwind word / headwind word):**

| Lane | For-side word | Against-side word | Classic claim (hedged) |
|---|---|---|---|
| borrowing-costs (7) | relief | tight | real rates are gold's opportunity cost |
| dollar (7) | stress | strong | gold is USD-priced; strong $ = headwind |
| stress (11) | elevated | calm | safe-haven bid; calm only removes the bid |
| inflation (10) | hot | cool | hedge demand when inflation runs hot |
| flows (2) | *contrarian* | *contrarian* | crowded longs are fragile — both seats polarity −1 |

---

## 2. The 37-voter table

Gold-direction = **lean × polarity** (+1 → tailwind / supports; −1 → headwind /
pressures). "Move" = 30-day change threshold (SIGNAL_LEG_MOVE); "level" = decade
percentile (<0.2 low, >0.8 high). All 37 ids: enabled, public, licence ≤ L2.

### Lane 1 — borrowing-costs (7 seats, all polarity −1)

| # | id | Rule | Provider | Series · URL | Cadence |
|---|---|---|---|---|---|
| 1 | `real-yield-10y` | move 0.10 pt + level | FRED | DFII10 · fred.stlouisfed.org/series/DFII10 | daily |
| 2 | `us10y` | move 0.15 pt + level | FRED | DGS10 · fred.stlouisfed.org/series/DGS10 | daily |
| 3 | `us30y` | level only | FRED | DGS30 · fred.stlouisfed.org/series/DGS30 | daily |
| 4 | `fed-target` | move 0.25 pt (FOMC step) + level | FRED | DFEDTARL+U corridor · fred.stlouisfed.org/series/DFEDTARU | daily |
| 5 | `fed-expectations` | move 0.13 pt + level | derived | DGS2 − midpoint · fred.stlouisfed.org/series/DGS2 | daily |
| 6 | `ecb-dfr` | level only | ECB | FM/D.U2.EUR.4F.KR.DFR.LEV · data.ecb.europa.eu | daily |
| 7 | `real-yield-5y` | move 0.10 pt + level | FRED | DFII5 · fred.stlouisfed.org/series/DFII5 | daily |

### Lane 2 — dollar (7 seats, all polarity −1)

| # | id | Rule | Provider | Series · URL | Cadence |
|---|---|---|---|---|---|
| 8 | `dollar-basket` | move 1.0 pt + level | derived | 6-ccy DXY-recipe basket · frankfurter.dev | daily |
| 9 | `usdjpy` | move 1.38 **%** + level | Frankfurter | USD→JPY · frankfurter.dev | daily |
| 10 | `us-japan-10y-gap` | level only | derived | DGS10 − MOF 10Y · fred.stlouisfed.org/series/DGS10 | daily |
| 11 | `usd-reserve-share` | level only | IMF | COFER USD share % · data.imf.org/en/datasets/IMF.STA:COFER | quarterly |
| 12 | `nyfed-custody` | level only | FRED | WSEFINTL1 · fred.stlouisfed.org/series/WSEFINTL1 | weekly |
| 13 | `dollar-broad` | move 1.0 pt + level | FRED | DTWEXBGS · fred.stlouisfed.org/series/DTWEXBGS | daily |
| 14 | `dollar-eme` | move 1.0 pt + level | FRED | DTWEXEMEGS · fred.stlouisfed.org/series/DTWEXEMEGS | daily |

### Lane 3 — market stress (11 seats)

| # | id | Polarity | Rule | Provider | Series · URL | Cadence |
|---|---|---|---|---|---|---|
| 15 | `stress-stlfsi` | +1 | level only | FRED | STLFSI4 · fred.stlouisfed.org/series/STLFSI4 | weekly |
| 16 | `nfci` | +1 | level only | FRED | NFCI · fred.stlouisfed.org/series/NFCI | weekly |
| 17 | `vix` | +1 | level only | FRED | VIXCLS (© Cboe) · fred.stlouisfed.org/series/VIXCLS | daily |
| 18 | `gold-silver` | +1 | level only | derived | XAU ÷ XAG · gold-api.com | daily |
| 19 | `term-premium-10y` | +1 | move 0.07 pt + level | FRED | THREEFYTP10 (Kim–Wright) | daily |
| 20 | `ebp` | +1 | level only | FRB | ebp_csv.csv ebp col · federalreserve.gov | monthly |
| 21 | `michigan-sentiment` | **−1** | level only | FRED | UMCSENT (pessimism = gold-positive) | monthly |
| 22 | `gpr-daily` | +1 | level only | GPR | GPRD_MA7 · matteoiacoviello.com/gpr.htm | daily |
| 23 | `epu-us` | +1 | level only | EPU | Baker–Bloom–Davis US index · policyuncertainty.com | monthly |
| 24 | `sp500-breadth-ratio` | **−1** | level only | Yahoo | RSP ÷ SPY · finance.yahoo.com/quote/RSP | daily |
| 25 | `bank-stress` | +1 | move 0.10 pt + level | FRED | DPCREDIT (discount window) | weekly |

### Lane 4 — inflation (10 seats, all polarity +1)

| # | id | Rule | Provider | Series · URL | Cadence |
|---|---|---|---|---|---|
| 26 | `us-cpi-yoy` | level only | FRED | CPIAUCNS 12-mo % | monthly |
| 27 | `us-pce-core-yoy` | level only | FRED | PCEPILFE 12-mo % | monthly |
| 28 | `euro-hicp` | level only | ECB | HICP annual rate · data.ecb.europa.eu | monthly |
| 29 | `breakeven-5y5y` | move 0.10 pt + level | FRED | T5YIFR | daily |
| 30 | `breakeven-tilt` | level only (by design) | derived | T5YIFR − T5YIE | daily |
| 31 | `t5yie` | move 0.10 pt + level | FRED | T5YIE | daily |
| 32 | `michigan-1y-expectations` | level only | FRED | MICH | monthly |
| 33 | `m2-us` | level only (YoY percentile basis) | FRED | M2SL | monthly |
| 34 | `us-deficit-12m` | level only | derived | rolling 12-mo Σ MTSDS133FMS | monthly |
| 35 | `michigan-5y-expectations` | level only | UoM | SIE Table 33 · data.sca.isr.umich.edu | monthly |

### Lane 5 — flows & demand (2 seats, both polarity −1, CONTRARIAN)

| # | id | Rule | Provider | Series · URL | Cadence |
|---|---|---|---|---|---|
| 36 | `cftc-gold-positioning` | level only | CFTC | (NonComm L−S) ÷ OI ×100 · cftc.gov/dea/newcot/deafut.txt | weekly |
| 37 | `cftc-gold-gross-long` | level only | CFTC | NonComm Long ÷ OI ×100 (same row) | weekly |

---

## 3. The evaluation method

### 3.1 `evalLeg` — the shared evaluator (connections.ts)

```
evalLeg(id, reading) → { direction, level, lean }

DIRECTION (the move leg):  if SIGNAL_LEG_MOVE[id] exists AND change30d finite:
   change30d > +threshold → 'rising'   → lean +1
   change30d < −threshold → 'falling'  → lean −1
   else                   → 'steady'
LEVEL (the fallback leg):  if percentile10y defined:
   < 0.2 → 'low'   (> −1 if steady)
   > 0.8 → 'high'  (+1 if steady)
   else  → 'typical'
LEAN = direction wins; level only decides when the move leg is steady or absent.
```

**The full `SIGNAL_LEG_MOVE` threshold map (18 entries):**

| id | Threshold | Units | Measured firing share |
|---|---|---|---|
| real-yield-10y / real-yield-5y | 0.10 | points | — |
| gold-usd / silver-usd | 3 | pct | the reality objects |
| brent | 5 | pct | — |
| dollar-basket / dollar-broad / dollar-eme | 1.0 | points | — |
| breakeven-5y5y / t5yie | 0.10 | points | 50.7% (t5yie) |
| us10y | 0.15 | points | — |
| copper-gold | 0.08 | points | — |
| china-pmi | 0.25 | points | — |
| fed-expectations | 0.13 | points | 50.7% |
| usdjpy | 1.38 | **pct** | 51.4% (the only pct seat) |
| fed-target | 0.25 | points | 7.0% (the FOMC step grid) |
| term-premium-10y | 0.07 | points | 49.2% |
| bank-stress | 0.10 | points | — |

13 of 37 voters carry a move threshold; the other 24 are level-leg-only.

### 3.2 The D-18 input-presence rule

A seat whose evaluator returns **neither** a direction **nor** a level reads
`unread` — never `steady`. (Kills the "fake-steady" class that manufactured
false confidence for ~30 weeks before the 2026-11 audit.)

---

## 4. The engine

`goldBalance(readings)` (gold-balance.ts) — pure, deterministic, order-independent:

1. Per lane, per seat: `unread` if missing/stale/check-pending/unavailable, or
   D-18 input-absent; else `steady` if lean 0; else
   **supports** (lean × polarity = +1) or **pressures** (= −1),
   with evidence word `rising / falling / high / low`.
2. **Lane vote:** unread if nothing readable; **neutral if firing < 2 (MIN2)**;
   for / against by majority; neutral-split on a tie.
3. **Counts:** for · against · neutral · unread over the five lane sides.
   `net = for − against`; `readable = for + against + neutral`.
   Unread and neutral are never merged.
4. **Beam angle:** |net| ÷ (for+against) × 10°, clamped [3°, 10°];
   0° exactly when net = 0; full tip at |net| = for+against.
5. **Verdict words:** 0 readable → "can't read"; 1–2 → "not enough readable"
   (sparse rule UI-40: beam stays level); else for / against / balanced.

### 4.1 The Outlook — 7-state classifier (verdict.tsx)

```
1. all 5 unread            → null
2. for ≥ 4                 → strong-bullish
3. against ≥ 4             → strong-bearish     (the 4-of-5 strong bar)
4. |gold 30d| < 2% AND typical AND |for−against| ≤ 1 → range-bound
5. for = against           → mixed (>0) / neutral (=0)
6. else                    → bullish / bearish
```
Price enters **only** at step 4 (consolidation, never direction).

### 4.2 Model-vs-reality (frozen engine)

`goldTailwindScore` / `goldSummaryOf`: 5-step label
(strong-tailwind → strong-headwind), strong bar ≥50% of firing voters and ≥3
firing; reality bar |30-day move| ≥ 2%; chips aligned-tailwind · aligned-headwind ·
diverging-up · diverging-down · neutral · no-read.

---

## 5. Gold context indicators

Non-voting cards that complete the gold picture (all enabled & public):

| id | What it is | Source · method | Cadence |
|---|---|---|---|
| `gold-usd` | Gold spot $/oz — the meter's reality object | gold-api XAU (keyless JSON) + hourly Yahoo GC=F overlay; history = World Bank Pink Sheet monthly + daily accumulation | daily (+hourly) |
| `gold-silver` | Gold/silver ratio — stress-lane voter #18 | XAU ÷ XAG same-date; WB decade base | daily |
| `gold-btc` | Bitcoin priced in gold (BTC/oz) | XAU ÷ BTC same snapshot | daily |
| `gold-aud` | Gold in AUD | XAU × Frankfurter USD→AUD | daily |
| `gold-oil-ratio` | Barrels of Brent per ounce | gold-usd ÷ brent | daily |
| `gold-platinum` | Gold/platinum ratio | gold-usd ÷ platinum (XPT) | daily |
| `real-gold-price` | CPI-deflated gold (1982–84 $) | gold month-close ÷ CPIAUCNS × 100 | monthly |
| `copper-gold` | Copper/gold ratio (growth seat, excluded from gold voting) | WB copper ÷ WB gold | monthly |
| `shanghai-gold-premium` | SGE Au99.99 vs converted London, % | SGE CNY/g ÷ (XAU × USDCNY ÷ 31.1034768) − 1 | daily |
| `sge-gold-withdrawals` | China physical-demand proxy, tonnes | SGE monthly Data Highlights PDF (withdrawal volume) | monthly |
| `swiss-gold-flow` | Swiss gold imports, tonnes | BAZG CSV, HS 7108 rows summed monthly | monthly |
| `gold-equities-ratio` | Gold vs equities rotation | Yahoo GLD ÷ SPY 10-yr join, 4 dp | daily |
| `cpi-nowcast` | Cleveland current-month CPI nowcast | HTML MoM table; Currena accumulates the history the publisher doesn't serve | daily refresh |
| `cpi-surprise` | Realised CPI − final nowcast, pp | CPIAUCSL MoM − frozen final nowcast | monthly |
| `shanghai-gold-premium` percentile | 488-point stored history base | percentile rides the KV accumulation | — |
| `yield-curve-10y2y` / `-10y3m` / `real-curve-10y5y` | Demoted GF-P1 context cards | regime-dependent polarity — never seated silently | daily |

---

## 6. Gold data sources — fetch methods

### gold-api.com (`adapters/goldapi.ts`) — L1, keyless
- `GET https://api.gold-api.com/price/{SYMBOL}` — XAU, XAG, BTC, HG, XPT.
- One request per symbol on the main 04:10 rung; zod-validated
  (symbol echo, price > 0, currency USD, ISO updatedAt).
- Terms permit commercial web display (owner read §9 first-hand 2026-10-16).
- Serves: gold-usd, silver-usd, btc-usd, copper-usd, platinum + the spot legs
  of every derived gold ratio. BTC cross-checked against Bitstamp (<3% drift).

### Shanghai Gold Exchange (`adapters/sge.ts`, `sge-monthly.ts`) — L2 © SGE
- **Daily:** `https://www.sge.com.cn/sjzx/quotation_daily_new?start_date=…&end_date=…&p=1`
  HTML table, `daily_new_table` marker asserted, Au99.99 rows only (never
  iAu99.99 — the international board); one page over the trailing 7-day window.
- **Monthly:** `https://en.sge.com.cn/data_MonthlyReport` → newest
  "Data Highlights" PDF → a hand-written PDF text extractor (FlateDecode via
  `DecompressionStream`, ToUnicode CMap bfchar/bfrange decoding) → the
  "Withdrawal Volume (Present Month)" line, Gold column (kg → tonnes).
- Venue facts: ranges >45 days serve empty; archive reaches only ~2024 —
  which is why the premium never became a calibrated voter (F6, recorded-open).

### Cleveland Fed nowcasting (`adapters/cleveland.ts`) — L2, owner-accepted
- `https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting` (HTML).
- Three embedded tables (MoM, YoY, quarterly); MoM CPI column + "Updated" cell;
  blank CPI cell = the venue's own released marker (the surprise join freezes it).
- **The publisher serves no history** — Currena accumulates daily rows into
  `insights:hist:cpi-nowcast` (fetched-wins on collision); cpi-surprise joins
  the BLS print (CPIAUCSL SA MoM) against the frozen final nowcast.

### CFTC Commitments of Traders (`adapters/cftc.ts`) — L0
- Weekly `https://www.cftc.gov/dea/newcot/deafut.txt` + yearly archives
  `…/dea/history/deacot{year}.zip` (used by the GF-P1/P2 backfills).
- The exact row `"GOLD - COMMODITY EXCHANGE INC."` (contract 088691, never the
  MICRO sibling); the file's own arithmetic identity is asserted
  (NonComm Long + Spread + Comm Long = Total Reportable Long, both sides).
- Both seats come from the SAME row — zero extra requests.

### IMF COFER (`adapters/cofer.ts`) — L1
- `https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/COFER/7.0.1/*`
  (SDMX 3.0 JSON, keyless; the 2.1 host is dead).
- Dimension set pinned; series key by dimension ids G001/AFXRA/CI_USD/SHRO_PT/Q;
  quarter-end dating; values in (0,100); ≥20 quarterly points required.
- Verified live: 56.70% @ 2026-Q2 matches the IMF brief exactly.

### Yahoo Finance chart API (`adapters/yahoo.ts`, `gold-equities.ts`, `sp500-breadth.ts`) — L2, owner-accepted
- `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=10y&interval=1d`
  — GLD & SPY (gold-equities-ratio), RSP & SPY (breadth), GC=F / SI=F / BTC-USD
  (history & hourly live), sequential calls (Yahoo politeness).
- Honest UA only; a Yahoo refusal (403/429/999/bot-check) is a BLOCK → fail closed.

### World Bank Pink Sheet (`adapters/worldbank.ts`) — L1
- Link discovery on the commodity-markets page → the single
  `CMO-Historical-Data-Monthly.xlsx` → "Monthly Prices" sheet: Gold ($/troy oz),
  Silver, Platinum, Copper — the decade percentile bases for gold history.

### Swiss customs BAZG (`adapters/bazg.ts`) — L1
- `https://ocean.bazg.admin.ch/open-data-reports/TN8_controlCode_Gold_IMP_en_v1/….csv`
  (~2.4 MB, semicolon); HS8 tariff 7108 import rows summed per month → tonnes.

### Frankfurter (`adapters/frankfurter.ts`) — L1
- `https://api.frankfurter.dev/v1/{start}..?from=USD&to=…` — one call; feeds
  the dollar-basket (gold voter #8), usdjpy (#9), USDCNY (premium leg), AUD leg.

### FRED (`adapters/fred.ts`) — L0/L2
- `https://fred.stlouisfed.org/graph/fredgraph.csv?id=…` bulk groups; serves
  20 of the 37 voters (all the yield/dollar/stress/inflation FRED seats).

---

## 7. Gold derived formulas

| Indicator | Formula | Constants |
|---|---|---|
| dollar-basket | 50.14348112 × EUR^0.576 × JPY^0.136 × GBP^0.119 × CAD^0.091 × SEK^0.042 × CHF^0.036 | DXY recipe; weights sum 1 (asserted) |
| gold-silver | XAU ÷ XAG (live); WB gold ÷ WB silver (history) | — |
| gold-btc | XAU ÷ BTC | 6 significant decimals |
| gold-aud | XAU × USD→AUD | 4 dp |
| gold-oil-ratio | gold-usd ÷ brent | barrels per ounce |
| gold-platinum | gold-usd ÷ platinum | — |
| real-gold-price | gold month-close ÷ CPIAUCNS × 100 | 1982–84 dollars |
| shanghai-gold-premium | SGE(CNY/g) ÷ (XAU × USDCNY ÷ 31.1034768) − 1 | GRAMS_PER_TROY_OUNCE = 31.1034768 |
| cpi-surprise | CPIAUCSL MoM% − frozen final Cleveland nowcast | one immutable point/month |
| cftc-gold-positioning | (NonComm Long − NonComm Short) ÷ OI × 100 | bounded [−100, 100] |
| cftc-gold-gross-long | NonComm Long ÷ OI × 100 | bounded [0, 100] |
| breakeven-tilt | T5YIFR − T5YIE | ±0.1 pt deadband |
| us-deficit-12m | rolling 12-month Σ MTSDS133FMS | $ millions |
| fed-expectations | DGS2 − (DFEDTARL + DFEDTARU) ÷ 2 | points |
| copper-gold | WB copper ÷ WB gold | monthly averages |

---

## 8. Disabled & blocked gold items

| id | Intended data | Blocker | Lever to unblock |
|---|---|---|---|
| `wgc-etf-holdings` | World gold ETF holdings, tonnes | WGC terms require **prior written authorisation** (L3) — never fetched | authorisation draft prepared (`docs/specs/gold-meter-gapfill/evidence/wgc-authorisation-draft-2026-11-07.md`); owner sends + records reply |
| `wgc-cb-demand` | Central-bank net purchases, t/quarter | same WGC class (L3) | same draft |
| `official-gold-demand` | PBoC/SAFE + CBR monthly purchases | PBoC English URL 404 (venue restructured); no licence-clean mirror | re-find the venue |
| `etf-short-interest` | Gold ETF units sold short | no licence-clean venue (Nasdaq TIMEOUT, NYSE 403, FINRA gated) | a clean venue |
| SGE premium **seat** (F6) | shanghai-gold-premium as voter | SGE archive only reaches ~2024 — can't calibrate a decade percentile | a deeper archive |
| MCX India gold (F7) | India gold futures positioning | venue-blocked HTTP 403 | — |

---

## 9. Deliberate exclusions from voting

Never re-seat without the governance process (§11):

- `govt-interest-revenue` — contested signal (kept as a borrowing-costs gauge voter, **not** a gold voter)
- the whole growth-health lane — `copper-gold` is already a ratio *about* gold
- `brent` in the inflation lane — supply shocks ≠ hedge-demand channel
- `yield-curve-10y2y` / `-10y3m` — GF-P1 decision H: regime-dependent polarity, demoted to context
- `real-curve-10y5y` — both signs measured near-identical (26.8/12.3 vs 27.3/11.3); stays `rule: info`, sign question printed, never seated silently
- `gold-btc`, `gold-oil-ratio` — standing spec rule: context-only
- EODHD paid candidates — the register fail-closes the class
- Hormuz chokepoint (data-side AIS gap), ICE BofA spreads (FRED copyright tag)

---

## 10. The honest record

- **Corpus:** 2,512 daily windows (2016-11-07 → 2026-11-03), mature base n=1,287.
- **Sign agreements (21-voter frozen table, mature base): 46.8 / 42.2 / 32.7%**
  at 5/20/60 trading days — all below coin flip. **No forecasting edge is
  claimed or implied anywhere in product copy.**
- **MIN2 calibration:** passed both pre-registered criteria twice
  (C1: level 25.0% ≤ 70%, full-tip 49.7% ≤ 60%; C2: 8 flips per 60 td vs 9).
- **Lineage:** 20 (S4 frozen) → 21 (Session 6) → 19 (GF-P1) → 32 (GF-P2) →
  36 (GF-P3) → **37 (GF-S10, current: 7/7/11/10/2)** — every change owner-gated
  and measured; frozen scenario tables in `gf-p0-proposed.ts`.
- **GF-S12/P5 acceptance:** calibration re-run byte-for-byte identical
  (sha 212ece76…), 14,620 tests green, live matrix: for 2 · against 1 ·
  neutral 2 · unread 0 — 5 of 5 lanes readable.

---

## 11. Governance

Any change to the voter table, lane set, thresholds, or engine constants is an
**owner-gated program** on the per-seat discipline: propose → measure in the
harness (frozen scenarios) → owner's recorded answer → ship → record lineage.
The code wins over any document; the authoritative files are
`gold-score.ts` (voters), `gold-balance.ts` (engine), `connections.ts`
(evaluator). The full governance contract is
`docs/insights/GOLD_SYSTEM_COMPLETE_REFERENCE.md` §12–§13.

---

*Phase 0 inventory complete. Next: the page-division strategy discussion
(GOLD · USA-domestic · USA-global · Australia · Indexes · Currency pairs —
see the conversation for the proposed alternatives).*
