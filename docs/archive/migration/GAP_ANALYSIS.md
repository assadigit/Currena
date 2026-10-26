# Currena Gap Analysis — Missing & Suggested Indicators

> **Generated:** 2026-10-22 · **Baseline:** `docs/INDICATOR_INVENTORY.md` (65 indicators, 62 public, at `main @ 8f9360e`).
> **Method:** every "available now" claim below was verified live on 2026-10-22 (gold-api symbol probes, Frankfurter EM-currency probe, Pink Sheet workbook column enumeration, FRED bulk-group audit). Series IDs marked *(verify)* must be confirmed at implementation time — FRED/OECD mirror series are occasionally discontinued or re-keyed.
> **Discipline reminder:** every new source must pass the fail-closed licence register (`packages/insights/src/licences.ts` — no register entry ⇒ no public display, T-15 blocks it), and every claim below respects the register's existing keys first.

> **ANNOTATED — 2026-10-23 by `docs/EXPERT_REVIEW.md` (the economist's pass); markers re-issued later the same day after an owner directive.** This document is unchanged below this line; the annotations record only where the expert priorities shift. Markers: **✓** agree (expert priority noted) · **↑/↓** re-prioritized · **✗** not recommended (noise discipline or — for Iran items — scope exclusion) · **＋** expert-only addition not present in this document. Full reasoning, the domain scorecard, the audience decision-journeys, and the reconciliation table live in `docs/EXPERT_REVIEW.md` §7.
>
> **Owner directive (chat, 2026-10-23 — decision D-41): Iran's economy is excluded from Currena's insights entirely.** The Iran-track items in this document — the §1 map's "single biggest gap" row, §3.6 WDI Iran trio, §3.7 TGJU converter path into insights, Tier-2's SCI Iran CPI probe, and roadmap Phase 4's audience bet — are **✗ excluded by that directive** (a scope decision, not a noise judgement). They remain in the body below unchanged, as the engineering record. The TGJU *converter's* own standing instruction is untouched. OD numbers below follow EXPERT_REVIEW v2's renumbered list.
>
> - **Tier 0:** DGS2 ✓P0 · T10YIE ✓P0 · hidden trio → owner decisions OD-1 (Shiller unhide) / OD-2 (china-pmi unhide after attribution fix) · **ETH re-add ✗** — keep retired (OD-3)
> - **Tier 1 FRED pack:** PCE/core-PCE ✓P0 · ICSA ✓P0 · credit spreads (HY) ✓P0 — single largest domain upgrade · SOFR ✓P0 · RECPROUSM156N ✓P0 · UMCSENT ✓P0 · MORTGAGE30US ✓P1 · WALCL ✓P1 · JOLTS ↓P1 · RSAFS ✓P1 (expert session verified this series live — (verify) cleared) · **INDPRO ↓P2** (below retail sales/permits/CFNAI in card value) · UK/Japan CPI mirrors **✗** (OD-6 — breadth for breadth) · China CPI ✓P1
> - **Tier 1 ECB:** AAA 10y ✓P0 (exact series key still (verify) — four candidate keys probed live 2026-10-23, all 404) · HICP ✓P1 · euro-area unemployment ↓P2
> - **Tier 1 Frankfurter:** USD/TRY ↓P1 (re-verified live 49.628; demoted from the first draft's P0 — its audience anchor was the now-excluded Iran track; the EM-pressure rationale stands on its own) · EM block ↓P2 (after TRY proves the slot) · EUR/GBP, EUR/CNY ↓P2
> - **Tier 1 gold-api:** **Palladium ✗** (OD-4 — collector logic, not advisor logic) · Platinum→daily ✓P1 · ETH ✗ (OD-3) · PGM ratio cards ✗
> - **Tier 1 Pink Sheet:** Food index + wheat/maize ✓P0 — the headline unlock (grocery inflation for both audiences) · aluminum/nickel/urea/cotton ↓P2 · TTF ↓P2
> - **Tier 1 WDI Iran trio:** **✗ — excluded by owner directive D-41** (was ✓P0 in the first-draft annotation, same day)
> - **Tier 1 TGJU converter path (into insights):** **✗ — excluded by owner directive D-41** (was ✓P0-strategic in the first-draft annotation; the converter feed itself keeps its standing instruction)
> - **Tier 2 venue probes:** ✓ agree as a parallel afternoon (P2) — **minus the SCI Iran CPI probe (D-41)**
> - **Tier 3 holds:** ✓ co-signed in full
> - **＋ Expert-only additions (absent above):** the AU leading edge — housing finance commitments, household saving ratio, job vacancies, consumer confidence probe · CFNAI (composite activity) · US housing permits · US wages (AHETPI) · the subtraction set — retire nzd-usd & silver-btc, demote m2-us scored→context, honest "monthly average, lagged" relabel for the five OECD mirrors, boj/boe fix-or-retire (OD-7)
> - **＋ Ordering challenge (C-5):** the roadmap below is effort-ordered; the expert review proposes value-ordered waves (§8 there) with owner decisions front-loaded — the owner approves one of the two.

---

## 1. Where coverage stands — the map

| Economy / domain | Indicators today | Assessment |
|---|---|---|
| **United States** | 23 (incl. 2 hidden Shiller) | Deep — rates, CPI, labor, money, growth, stress |
| **Australia** | 19 | Deep — the second editorial pillar |
| **World prices & FX** | 16 | Good breadth at daily cadence |
| **Crypto** | 4 | BTC-centric |
| **Euro area** | 1 (`ecb-dfr`) + stoxx50 board | **Thin** — policy rate only, no inflation/growth |
| **Germany** | 1 (`bund-10y`, monthly OECD) | Thin + monthly-only |
| **UK** | 2 (`gilt-10y`, `boe-rate`, monthly) + ftse board | Thin + monthly-only |
| **Japan** | 2 (`jgb-10y`, `boj-rate`, monthly) + n225 board | Thin + monthly-only |
| **China** | 1 (`china-pmi`, hidden, manual) + ssec board | **Thin + not even public** |
| **Iran — the primary audience** | **0 in insights** (17 currencies + 9 gold items live in the converter only) | **The single biggest gap** |

The site's centre of gravity (US + Australia) reflects its history; the audience (currena.ir, Toman converter, Iranian gold coins) is nowhere in the insights layer.

---

## 2. Tier 0 — already collected, just not displayed (zero new source work)

| Item | Status today | Suggestion |
|---|---|---|
| **US 2-year yield (DGS2)** | Fetched daily (FRED bulk group 2 + Treasury fallback); only used as the `fed-expectations` leg | Give it its own card next to us10y/us30y — completes the Treasury curve display and makes `yield-curve-10y2y` self-explanatory |
| **US 10-year breakeven (T10YIE)** | Fetched daily; validation-only (T-01) | Display beside `breakeven-5y5y` — the short/long inflation-expectations pair |
| **`china-pmi`, `shiller-cape`, `shiller-ecy`** | Collected + validated, hidden by site-mode | Unhide when display terms are agreed (china-pmi's manual-source attribution, Shiller's L1 academic licence currently limits it to private mode — needs the owner's call) |
| **ETH price** | Retired 2026-10-21c (66→65, KV-migration lesson recorded). gold-api.com serves ETH live (verified 2026-10-22, $2,381) | Re-add `eth-usd` if the retirement was display-taste rather than licence — the KV-migration playbook for id retirement/return already exists |

---

## 3. Tier 1 — zero-new-source adds (existing registered providers only)

### 3.1 FRED bulk-group extensions (same adapter, same licence row, US public domain)

| Suggested indicator | Series | Cadence | Fits card |
|---|---|---|---|
| PCE inflation yoy | `PCEPI` *(verify vs PCEPI today)* | monthly | prices-heat — the Fed's preferred gauge beside CPI |
| Core PCE yoy | `PCEPILFE` | monthly | prices-heat |
| Initial jobless claims | `ICSA` | weekly | growth-health — the fastest labor pulse |
| Job openings (JOLTS) | `JTSJOL` | monthly | growth-health |
| Michigan consumer sentiment | `UMCSENT` | monthly | growth-health |
| Recession probability | `RECPROUSM156N` | monthly | growth-health (beside sahm-rule) |
| Industrial production | `INDPRO` | monthly | growth-health |
| Retail sales | `RSAFS` *(verify)* | monthly | growth-health |
| 30-year mortgage rate | `MORTGAGE30US` | weekly | borrowing-costs — pairs with AU home-loan for a household-cost story |
| SOFR | `SOFR` | daily | borrowing-costs — the funding rate |
| Fed balance sheet | `WALCL` | weekly | market-stress (QT tracking) |
| High-yield credit spread | `BAMLH0A0HYM2` *(licence: ICE BofA via FRED — add register row first; precedent: VIXCLS/NFCI ride the same FRED-terms pattern)* | daily | market-stress — the classic risk-appetite dial |
| BBB corporate spread | `BAMLC0A4CMBB` *(same licence note)* | daily | market-stress |
| Euro-area HICP yoy | `CP0000EZ19M086NNMB` *(verify; alternatively ECB direct below)* | monthly | a new euro-area group |
| UK CPI yoy | `GBRCPIALLMINMEI` (OECD MEI mirror) *(verify)* | monthly | euro-area/UK/Japan group |
| Japan CPI yoy | `JPNCPIALLMINMEI` *(verify)* | monthly | ditto |
| China CPI yoy | `CHNCPIALLMINMEI` *(verify)* | monthly | growth-health (China leg) |

### 3.2 ECB Data Portal (the `ecb` register key already exists)

| Suggested indicator | Dataset | Cadence | Note |
|---|---|---|---|
| **Euro-area 10-year AAA benchmark yield** | ECB yield-curve dataset (YC) — exact key *(verify)* | **daily** | **Fixes the monthly bund gap with a daily euro-benchmark** — the single highest-value rates add; licence posture identical to the already-cleared `ecb-dfr` |
| Euro-area HICP (annual rate) | ICP.M.U2.N.000000.4.ANR *(verify)* | monthly | Cleaner than the FRED mirror |
| Euro-area unemployment rate | LFS dataset *(verify)* | monthly | First euro labor indicator |

### 3.3 Frankfurter / ECB reference rates (verified served today)

| Suggested addition | Verified | Note |
|---|---|---|
| **USD/TRY pair in the FX module** | ✅ 2026-10-22 (49.63) | Regional-currency stress — the most audience-relevant pair after USD/IRR; zero new source (TRY is in the ECB 30 list and the TGJU converter already) |
| USD/INR, USD/MXN, USD/ZAR, USD/BRL pairs | ✅ 2026-10-22 | EM block; feeds an EM-currency pattern rule |
| EUR/GBP, EUR/CNY crosses | derivable | Deepens the dollar-or-euro rule |

### 3.4 gold-api.com (verified today: XAU ✅ XAG ✅ XPT ✅ **XPD ✅** BTC ✅ **ETH ✅** HG ✅)

| Suggested indicator | Symbol | Note |
|---|---|---|
| **Palladium** | `XPD` ($1,079 verified) | Completes the PGM pair beside platinum; daily cadence beats Pink Sheet monthly |
| Platinum daily | `XPT` ($1,573 verified) | Upgrade the monthly Pink Sheet platinum to daily (keep Pink Sheet for history) |
| **ETH** | `ETH` | See Tier 0 — the retired id |
| Gold/palladium, silver/platinum ratios | derived | Same pattern as gold-silver |

### 3.5 World Bank Pink Sheet — same workbook, zero new requests (columns enumerated 2026-10-22)

The monthly .xlsx already downloaded daily carries **~70 commodities + 7 indices**; only 6 columns are parsed today. High-value unlocks, all CC BY-4.0:

| Group | Available columns (exact Pink Sheet headers) |
|---|---|
| **Energy** | Crude oil average · Crude oil Dubai · **Coal, Australian** · **Natural gas, Europe (TTF)** · Liquefied natural gas, Japan · Natural gas index |
| **Base metals** | **Aluminum** · **Lead** · **Tin** · **Nickel** · **Zinc** (copper + iron ore already in) |
| **Grains / food** | **Wheat US SRW/HRW** · **Maize** · **Soybeans** + meal/oil · **Rice Thai 5%** · Barley · Sorghum |
| **Softs** | **Cocoa** · **Coffee Arabica/Robusta** · **Tea** ×4 · **Sugar, world** · Orange · Banana ×2 |
| **Edible oils** | **Palm oil** · Soybean oil · Rapeseed oil · Sunflower oil · Coconut oil |
| **Proteins** | **Beef** · **Chicken** · Lamb · Shrimps |
| **Fertilizers** | **Urea** · **DAP** · TSP · Phosphate rock · Potassium chloride |
| **Materials** | **Cotton** · **Rubber ×2** · Logs/Sawnwood ×4 · Plywood · Tobacco |
| **Indices (Monthly Indices sheet)** | **Total** · **Energy** · **Non-energy** · **Agriculture** · **Food** · **Fertilizers** · **Metals & Minerals** · Precious Metals (2010=100) |

Suggested headline picks (audience-weighted): a **Food price index** card (Agriculture/Food indices + wheat/maize/rice/palm oil), **European gas** (the household-energy story next to US natgas), **aluminum + nickel** (industrial demand beside copper), **urea/DAP** (fertilizer costs → food inflation chain), **cotton** (textiles). An "energy index" vs "food index" pairing is a natural new gauge.

### 3.6 World Bank WDI API (the `world-bank` register key already exists — CC BY-4.0)

| Suggested indicator | WDI series | Cadence |
|---|---|---|
| **Iran CPI inflation** | `FP.CPI.TOTL.ZG` | annual (the honest, licence-safe Iran series) |
| **Iran GDP growth** | `NY.GDP.MKTP.KD.ZG` | annual |
| **Iran unemployment** | `SL.UEM.TOTL.ZS` | annual |

Annual cadence is slow, but it is the only licence-safe Iran macro available without new venue/licence work — and it puts the audience's economy on the page for the first time.

### 3.7 The TGJU converter path (owner directive required — see §6)

| Suggested indicator | Source | Note |
|---|---|---|
| **USD/IRR free-market rate** | the live converter feed (call1.tgju.org ajax.json) already collected minute-fresh | The single number the audience most wants in insights, with history; **requires the owner's licence directive** — the 2026-10-22 round disqualified TGJU's *economics pages* (frozen + footer prohibition), while the *converter* path stays live under the standing owner directive. Same decision class as the markets board (2026-10-18b) and currencies board (2026-10-21c) |
| Gold 18k / coin prices in Toman | same feed (9 items already on the gold board) | An Iranian gold section in insights; gold-aud already exists as the pattern |

---

## 4. Tier 2 — needs a venue probe from the Cloudflare egress (probe before promising)

| Gap | Candidate | Probe notes |
|---|---|---|
| **Gilt 10y daily** | Bank of England statistical database (IADB) / gilt-yield-curve dataset | DMO is JS-rendered (dead end, 2026-10-22 round); BoE CSV endpoints untested from the CF venue |
| **JGB 10y daily** | BoJ time-series statistics portal | MoF Japan moved (2026-10-22 round); BoJ portal CSV untested |
| **China PMI automation** | NBS stats.gov.cn | Manual entry today; direct scrape needs venue + Farsi/中文 parsing + licence read |
| **Iran monthly CPI** | SCI (sci.org.ir) | Farsi parsing + venue risk; manual-entry candidate first (china-pmi pattern) |
| **UK/Japan CPI direct** | ONS API (OGL v3) · e-Stat Japan | Only if the FRED OECD mirrors (§3.1) prove stale/discontinued |
| **au-10y daily restore** | EODHD AU government bond tickers (owner key) | GBOND-UK was the 403/404 paywall; AU tickers untested; RBA F2 Akamai 403 stands |

## 5. Tier 3 — blocked / paywalled (documented holds, not action items)

- **ISM Manufacturing & Services PMI (US)** — paywalled; `philly-fed` is the deliberate free stand-in. *The US-PMI gap stands until ISM terms or a mirror appear.*
- **Caixin China PMI** — paywalled.
- **S&P Global flash PMI** — paywalled.
- **Official DXY (ICE)** — licence-restricted; `dollar-basket` is the free equivalent by design.
- **MOVE index (bond volatility)** — ICE paywall.
- **LME real-time metals** — restrictive terms; gold-api HG daily + Pink Sheet monthly cover the need.
- **USD/RUB** — ECB dropped RUB from reference rates; MOEX sanctioned/licence-blocked.
- **RBA F2 daily** — Akamai 403 from the CF venue (standing known issue; monthly F2.1 carries au-10y honestly).

---

## 6. Suggested roadmap (my recommendation, in order)

**Phase 1 — display what we already collect (days, zero risk):** us-2y + 10y breakeven cards; Pink Sheet Food/Energy index + European gas + aluminum/nickel + urea + cotton (same workbook parse); palladium + platinum-daily + ETH (gold-api); USD/TRY + one EM block (Frankfurter); unhide decision on the trio.

**Phase 2 — one new licence row each (small, high value):** ECB euro-area 10y AAA daily (fixes bund-monthly with an already-cleared provider posture); FRED US macro pack (PCE, ICSA, JOLTS, UMCSENT, MORTGAGE30US, SOFR, RECPROUSM156N, INDPRO — one bulk-group edit); FRED OECD CPI mirrors (UK/JP/CN/EA); World Bank WDI Iran trio; credit spreads (needs the ICE-via-FRED register row).

**Phase 3 — venue probes (one afternoon of probing, then decide):** BoE gilts daily, BoJ JGB daily, EODHD au-10y, SCI Iran CPI, NBS PMI automation.

**Phase 4 — the audience bet (owner decisions, not engineering):** USD/IRR free rate + Iranian gold in insights under an owner licence directive (the TGJU converter feed is already collected minute-fresh); a China/euro-area section unhide/rebuild.

## 7. What I would deliberately NOT add

- **Official DXY / MOVE / ISM / Caixin** — paywalled or licence-restricted; the free equivalents (dollar-basket, STLFSI+NFCI, philly-fed, NBS PMI) are already on the page and honest about what they are.
- **Real-time futures feeds (CME/NYMEX/LME)** — licence + cost + the 50-subrequest budget; EOD closes serve the display cadence.
- **Intraday FX in insights** — ECB reference rates are daily by design; the converter already serves live.
- **More US noise (every regional Fed survey)** — depth is already US-heavy; the marginal value is in euro-area/China/Iran breadth, not a 24th US series.

---

*Companion: `docs/INDICATOR_INVENTORY.md` (the full "what we track today" baseline). The 2026-10-22 data-reliability round's worklog (FRED egress root cause, Treasury/EIA fallbacks, TGJU disqualification evidence) is in `docs/DEPLOY.md`.*
