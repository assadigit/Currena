# The Economist's Review — Currena's indicator set

> **Generated:** 2026-10-23 (session 2026-10-22 23:52 UTC → 2026-10-23; **revised later the same day** — Iran scope removed per owner directive) · owner timezone Asia/Tehran · **Baseline:** `main @ 8c7c7c2` · **Audience:** the owner (Ali) — a decision document, not an engineering ticket.
> **Method (mandated):** the independent expert pass — domain scorecard, cycle map, two audience decision-journeys, subtraction list — was **drafted and sealed before `docs/GAP_ANALYSIS.md` was opened**. The engineering document was read only afterwards, for reconciliation (§7). Feasibility annotates this review; it does not lead it.
> **Verification discipline:** every "available now" claim in this review was either probed live this session (values cited in §10) or carries an explicit `(verify)` mark. Unverified series ids are never stated as fact.
> **Scope:** analysis only. No code, no deploys, no schema changes, no cron changes. Phase 2 (implementation) is a later session on the owner's approval.
> **Scope revision (owner directive, chat 2026-10-23 — recorded as D-41):** **Iran's economy is out of scope for Currena's insights — entirely.** No Iran-economy indicator is proposed or retained anywhere in this review. The first draft of this document (commit `1bbc57c`, same day) carried an Iranian-audience track — a decision journey, an Iran scorecard row, USD/IRR + Iranian gold/coins/coin-premium and WDI-Iran P0 recommendations, a dedicated owner decision and build wave; **this revision removes that track in full.** The TGJU *converter's* standing instruction is a separate owner directive and is untouched here.

---

## 1. Executive summary

**The verdict.** Currena's insights dashboard is a well-built *US rates-and-prices monitor with a genuinely deep Australian household annex* — better than most retail-bank dashboards on its home turf (real yields, the curve, Sahm, trimmed mean, deposit rates, arrears, terms of trade are not retail furniture). But through a strategist's eyes it has three structural defects, in this order:

1. **It cannot see a cycle turn coming.** Every labor series is monthly (unemployment, Sahm, NFP) — Sahm by *construction* fires months after a recession starts; there is no weekly claims pulse, **no credit spreads at all** (HY/IG OAS — the market's real-time default-risk repricing and the classic turn signal), no consumer sentiment (Michigan — the D+ domain), no recession-probability model, no composite activity gauge. The dashboard detects recessions; it does not warn of them.
2. **The transmission chain the product is proudest of breaks twice.** Policy rate ✓ → **funding (no SOFR) ✗** → long end ✓ → **private borrowing (no credit spreads, no US mortgage rate) ✗** → real economy (weakly). A desk that watches the Fed without SOFR and credit is watching the throttle, not the drivetrain.
3. **Its global leg runs a month behind.** The BoJ/BoE policy rates and the Bund/JGB/Gilt 10y legs ride OECD *monthly mirrors* — 32–92 days stale in the freshness table. At a global policy turn the dashboard shows yesterday's world, and a month-old policy rate is worse than none. The daily fixes are queued (the ECB AAA 10y — series key still to verify at build time; BoE/BoJ venue probes in Wave 4); until they land, the honest relabel (§5.2) is the stopgap.

**The counterweight (subtraction before addition):** 23 of 65 indicators are US and several are padding — `nzd-usd` serves an audience that doesn't exist, `silver-btc` is the weaker twin of `gold-btc`, the BoJ/BoE policy rates are *monthly OECD mirrors* that can show a month-old policy rate while markets reprice (actively misleading), and `m2-us` is a scored gauge member of a monetarist framework the product doesn't otherwise run. The single cheapest honesty fix on the whole dashboard is relabelling the five OECD-mirror rows "monthly average, lagged."

**What I would approve tomorrow (P0):** the early-warning pack — initial jobless claims (ICSA), HY credit spread (BAMLH0A0HYM2), SOFR, smoothed recession probability (RECPROUSM156N), core PCE, Michigan sentiment — all live on FRED today (verified, §10), one bulk-group edit plus one licence-register row. Then the household-costs wave: the Pink Sheet food index + wheat/maize (already downloaded daily, unparsed) and the ECB euro-area AAA 10y to fix the monthly-Bund sore. Then the owner unlock with the biggest strategic payoff: **unhiding the Shiller pair** — the best free equity-valuation series in existence is collected, validated, and invisible.

**What I would not do:** re-add ETH (the retirement was right — no decision information in a second crypto price line), add palladium and PGM ratio cards (card-count inflation), or chase UK/Japan CPI breadth (informs neither audience). ETH, palladium, and the UK/JP CPI mirrors are the visible disagreements with the engineering pass (§7) — the owner should see both sides.

**The one-sentence owner decision list:** approve OD-1/OD-2 (the unhides) and OD-5 (the credit-spread licence row) — and let the P0/P1 waves in §8 follow in value order.

---

## 2. Domain scorecard (A–F)

| # | Domain | Grade | In one line |
|---|---|---|---|
| 1 | Monetary policy & transmission | **B** | Excellent core; chain breaks at funding, private credit, and balance sheet |
| 2 | Inflation | **B−** | CPI + core + 5y5y + energy; missing the Fed's own gauge, near-term expectations, wages, food |
| 3 | Labor | **C+** | All monthly; no weekly claims; no openings/quits; no US wages |
| 4 | Growth & nowcasting | **C** | GDP is rear-view; no PMI-licence path, no consumer, no housing, no composite |
| 5 | Credit & financial stability | **C−** | Good plumbing trio (STLFSI/NFCI/VIX); zero private-credit pricing |
| 6 | Liquidity & CB balance sheets | **C** | M2 + STLFSI only; QT invisible |
| 7 | Sentiment & positioning | **D+** | No consumer sentiment for either audience; VIX + crypto-F&G only |
| 8 | Commodities | **B** | Metals/energy good; no agriculture (the household's grocery inflation); platinum monthly on a daily-capable source |
| 9 | FX | **B−** | G10 + basket good; no EM pressure block (texture, not core) |
| 10 | Equity valuation | **C+** | Best free valuation series in existence — collected and hidden |
| 11 | Crypto | **B** | Disciplined BTC-centric scope; ETH retirement correct |
| 12 | Australia household (primary audience, cross-domain) | **B+** | Deep; missing the *leading* edge, not levels |

**Reasoning per domain:**

**1 · Monetary policy & transmission — B.** Policy rate, market path (2y gap), 10y/30y, real 10y, the curve, the fiscal interest bill, ECB deposit rate — a professional skeleton. The chain the domain is named for breaks three times: (a) *front-end funding* — no SOFR/EFFR, so "rate set" vs "rate transmitted" is unobservable (year-end repo pressure, 2018–19-style plumbing squeezes — the exact stress STLFSI measures one link downstream); (b) *private borrowing costs* — no credit spreads, no US mortgage rate: the chain stops at the government curve and never reaches the household; (c) *balance-sheet channel* — no Fed assets (QT). The global leg (BoJ/BoE rates, Bund/JGB/Gilt 10y) rides OECD *monthly* mirrors → structurally stale (32–92 days in the freshness table); at a global policy turn the dashboard shows yesterday's world, and a month-old policy rate is worse than none. Chain grades: setting A · funding C · long end A · private credit F · real-economy link C.

**2 · Inflation — B−.** Headline, core, 5y5y-forward expectations, and the energy pipeline is a fair retail skeleton. Missing: **PCE/core PCE** (the Fed's actual target — a Fed-watching product that cannot show the number the Fed reacts to), *near-term* expectations (the 10y breakeven T10YIE is already collected and unshown; the 5y is one FRED fetch away), the **wage leg** (AU has wage growth; the US has none — the wage-price loop is the "will it persist" question), and the **food complex** (groceries are the most-felt line of household inflation on both audience maps; wheat/maize/soy/sugar sit unparsed in the daily Pink Sheet download).

**3 · Labor — C+.** Level (UNRATE), recession trigger (Sahm), flow (NFP) — but all monthly, so the product is structurally a month-plus late to every labor turn. Missing: **initial jobless claims** (the canonical weekly leading indicator — claims move weeks before payrolls, months before unemployment; at turns it is the single highest-value series in this review), openings/quits (JOLTS), and US wages (cross-listed above). AU labor: unemployment (monthly, timely) + wages (quarterly) — missing vacancies (leading).

**4 · Growth & nowcasting — C.** GDP (lagging), one regional survey (Philly Fed), M2, copper-gold, a hidden manual China PMI. Missing: the canonical monthly pulse (ISM is paywalled — the engineering pass's Tier-3 hold is correct; CFNAI is the free composite substitute), **US consumer spending** (retail sales — ~68% of GDP, zero coverage), **housing** (permits — the classic long-leading, most rate-sensitive sector; pairs with the rates complex already on the page), and the weekly pulse (claims, again).

**5 · Credit & financial stability — C−.** STLFSI4 + NFCI + VIX is a solid *funding-stress* trio; gold-silver adds the defensive leg. But **private credit pricing is entirely absent** — no HY OAS, no IG OAS. Desks watch credit first at turns: HY OAS turned ahead of equities in 2007, 2015 and 2020; VIX is a fear spike, credit is a default-risk repricing. Also missing: credit supply (SLOOS net tightening) and US household balance-sheet stress (card delinquencies — AU has arrears via RBA E2; the US, nothing).

**6 · Liquidity & CB balance sheets — C.** M2 (monthly stock) + STLFSI. The balance-sheet story — the defining liquidity driver of 2020–26 — is invisible: no WALCL (Fed assets under QT), no bank reserves, no repo rate (SOFR, cross-listed with domain 1). M2 alone cannot separate money supply from money demand.

**7 · Sentiment & positioning — D+.** VIX (market fear) + crypto-fng (one asset class). **No consumer sentiment anywhere** — no Michigan (US), no Westpac-MI (AU). For a household-audience product this is a double gap: sentiment is the series households recognize from the news, it leads spending, and Michigan carries the 1-year inflation-expectations leg the inflation domain needs. Small business (NFIB) is second tier; positioning (AAII, put/call, CFTC) is noise here — correctly skipped.

**8 · Commodities — B.** Gold/silver/copper daily, platinum monthly, Brent/WTI/natgas, iron ore. Two defects: no agriculture (wheat/maize/rice/palm oil/Food-index — the grocery-inflation experience, already downloaded), and a cadence inconsistency — platinum monthly on Pink Sheet while gold-api serves XPT daily (engineering-verified 2026-10-22). Uranium/lithium: thematic; skip until an editorial case exists.

**9 · FX — B−.** The Currena dollar basket plus 10 G10-heavy pairs; 30 ECB currencies collected for the converter but only 10 surfaced. Missing: the **EM pressure block** — optionally **TRY** first (the canonical high-inflation currency; ECB reference rate, free, verified live), then INR/MXN/ZAR/BRL. Under the no-Iran scope (D-41) this is monitoring breadth for the allocation reader, not a household decision — texture, not core (§5.2). RUB is correctly out (ECB stopped publishing, 2022).

**10 · Equity valuation — C+.** The markets board is performance-only, which is its job — but the best free valuation series in existence (Shiller CAPE + ECY) is collected, validated, and hidden behind the licence register's L1 posture. "Are shares expensive?" is a top-3 household question (for Australians with super, *the* question) and the product cannot currently answer it publicly. ECY-vs-real-yield is the equity-vs-bond comparison an advisor actually uses.

**11 · Crypto — B.** BTC price + fear/greed + gold/silver ratio legs is disciplined scope for a savings audience. The ETH retirement (2026-10-21c) was correct: a second price line adds no decision information for this audience.

**12 · Australia household — B+.** Trimmed mean, deposit rates, outstanding mortgage rate, arrears, terms of trade, gold-in-AUD — most retail dashboards have none of these. What's missing is the *leading edge*, not padding: **housing finance commitments** (the mortgage-pipeline/demand gauge; leads home values), **household saving ratio** (the hunkering-down gauge; same ABS national-accounts flow already used for terms-of-trade), **job vacancies** (leading labor), and consumer confidence (venue/licence to probe). AU breakevens: nice-to-have; series-source unclear.

---

## 3. Cycle coverage map

**Classification of the current 65:**

| Cycle role | Indicators (today) |
|---|---|
| **Leading — short (1–6m)** | fed-expectations · philly-fed · copper-gold · china-pmi *[hidden]* · VIX (contrarian spikes) · breakeven-5y5y (repricing) · gold-silver (late-cycle defensive tilt) |
| **Leading — long (6–18m) / secular** | yield-curve-10y2y · m2-us (contested) · shiller-cape / shiller-ecy *[hidden]* |
| **Coincident** | us-cpi-yoy · us-cpi-core-yoy · us-nfp · policy rates (settings) · dollar-basket · all 10 FX pairs · brent · wti · natgas · gold · silver · copper · iron-ore · au-cpi · au-trimmed-mean · au-petrol-yoy · au-10y · rba-expectations · au-us-10y-gap · audusd · audjpy · terms-of-trade · crypto-fng · platinum (monthly cadence) |
| **Lagging** | us-unemployment · us-gdp-growth · govt-interest-revenue (deeply) · au-wage-growth · au-home-values · au-household-debt-arrears · bund-10y / jgb-10y / gilt-10y / boj-rate / boe-rate (OECD monthly — lagged *by construction*) · rba-cash-rate (per-change, a setting) · au-home-loan / au-deposit-rate (monthly outstanding) · au-rent-yoy (sticky) |
| **The missing leading block** | initial claims · HY OAS · Michigan · permits · retail sales (short lead) · recession probability · CFNAI |

**Where the dashboard is blind, exactly at the turns:**

| Regime transition | What's covered | What's invisible |
|---|---|---|
| Expansion → late-cycle | curve flattening (10y2y); real yields | credit spreads tight-but-rising; wage acceleration; CAPE (hidden) |
| Late-cycle → recession | Sahm (fires months *after* the turn, by construction); curve (12m lead); STLFSI/NFCI (plumbing) | claims surge (weeks of warning); HY OAS blowout (the market-pricing turn); recession probability; consumer-sentiment rollover |
| Recession → recovery | curve re-steepening; breakevens rising | claims peaking; PMI bottoming (Philly only; China hidden) |

**The mandate's question — is Sahm + yield curve + STLFSI/NFCI a complete recession toolkit?** No. It is the *detection core*, not a toolkit. It lacks three layers a professional outlook desk would not go without: (1) the **weekly early-warning layer** — initial claims; (2) the **market-pricing layer** — HY/IG credit spreads and a smoothed recession-probability model (RECPROUSM156N); (3) the **composite activity layer** — CFNAI (or equivalent). All three are on FRED, free, today (§10).

---

## 4. The two audience decision-journeys

### 4.1 The Australian household (primary audience)

| Real decision | Can insights answer it today? | What completes it |
|---|---|---|
| "Fix or ride variable?" | **Near-complete.** Cash rate, market path (3y gap), the rate people actually pay (F6). | New-lending rate (verify RBA series) — nice-to-have only |
| "Rent or buy?" | **Well covered.** Rents, home values, unemployment, mortgage rates. | **Housing finance commitments** (leads both prices and rents) [my addition — absent from the engineering pass] |
| "Save (term deposit) vs offset vs invest?" | **Covered** — deposit rate vs cash rate vs CPI. | A derived **real term-deposit rate** (deposit − CPI) at zero source cost |
| "Is my job safe?" | **Decent** — unemployment (monthly, timely) + wages (quarterly). | **Job vacancies** (leading); consumer confidence (leads spending → jobs) |
| "Are we cutting back?" | **Partly** — CPI/trimmed/petrol/rents show the cost side. | **Household saving ratio** (the hunkering-down gauge; same ABS national-accounts flow already used for terms-of-trade) |

AU verdict: the set is deep; the completions are at the *leading edge* (finance commitments, saving ratio, vacancies, confidence) — not more levels.

### 4.2 The allocation reader — the owner's own seat (US-centered macro)

Persona: a saver-allocator holding cash, broad-equity ETFs, some gold and BTC — makes three or four allocation decisions a year and wants the dashboard to say when the odds are changing.

| Real decision | Can insights answer it today? | What completes it |
|---|---|---|
| "Is now a bad time to add to equities?" | **Half.** The markets board shows performance; the recession radar detects (Sahm, curve) but cannot *warn* (no claims, credit, sentiment or probability model); and valuation is collected but hidden (Shiller). | The early-warning pack (Wave 1) + unhide the Shiller pair (OD-1) |
| "Is the Fed about to cut — or about to surprise?" | **Half.** The 2y gap and the curve show the market's path; but the Fed's own gauge (core PCE) and near-term expectations (Michigan 1y) are absent. | `us-pce-core-yoy` + `michigan-sentiment` (both P0) |
| "Hold cash — or is the pain over for bonds and gold?" | **Partly.** Real 10y, the dollar basket and the gold ratios are professional-grade; but cash's actual yield (SOFR) and the QT story (WALCL) are invisible — the funding leg of the whole rates panel. | `sofr` (P0) + `walcl` (P1) |
| "Am I about to be blindsided by credit stress?" | **No.** STLFSI/NFCI see *plumbing* stress after the fact; the private-credit repricing (HY/IG OAS) — the 2007/2015/2020 leading signal — is absent. | `hy-oas` (P0) + `ig-oas` (P1) |
| "Is gold expensive insurance or the late-cycle trade?" | **Good.** Real yields + dollar + stress + the metal ratios is already the strongest panel on the page. | Nothing required |
| "Crypto — entry or exit?" | **Honest scope.** BTC + fear/greed, no noise; the ETH retirement was right. | Nothing (noise discipline) |

Priority order for this audience: (1) the early-warning pack; (2) the Shiller unhide; (3) `sofr` + `walcl` (the funding/liquidity pair); (4) retail sales, permits, CFNAI (the real-economy confirmations).

---

## 5. The recommendation table

Format per the mandate: id · name (EN; FA note) · placement · rationale (decision + cycle role) · cadence · source & licence · tier (0 collected / 1 existing provider / 2 venue-probe / 3 paywalled-hold) · priority · dependencies.
All FRED claims in this table were probed live this session — values in §10. **Effort tiers use the engineering pass's definitions**; priorities are the economist's.

### 5.1 P0 — the core completions

| ID | Name (EN) | Placement | Rationale — decision & cycle role | Cadence | Source & licence | Tier | Priority | Dependencies |
|---|---|---|---|---|---|---|---|---|
| `initial-jobless-claims` | New unemployment claims (FA copy new) | growth-health, scored | The weekly early-warning layer. Informs "is the labor market cracking *now*" — weeks before monthly data, months before Sahm. **Leading.** | weekly | FRED `ICSA` (verified) · fred register row | 1 | **P0** | — |
| `hy-oas` | The extra yield risky companies pay (FA new) | market-stress, scored | The market's default-risk repricing — the turn signal VIX structurally cannot give (2007/2015/2020). Informs every risk-on/off reading on the page. **Leading at turns.** | daily | FRED `BAMLH0A0HYM2` (verified 3.33%) · ICE BofA via FRED — **new register row** (precedent: VIXCLS/NFCI ride FRED terms) | 1 | **P0** | owner licence row (OD-5) |
| `sofr` | The overnight funding rate (FA new) | borrowing-costs, scored or context | Completes policy→funding; makes "rate set = rate transmitted" checkable; the repo-stress leg. **Coincident, leading at funding squeezes.** | daily | FRED `SOFR` (verified 3.88%) · fred row | 1 | **P0** | — |
| `recession-probability` | US recession probability (FA new) | growth-health, beside sahm-rule | The single-number probability that completes the Sahm/curve toolkit (Chauvet smoothed probs). **Coincident with 1–3m lead at turns.** | monthly | FRED `RECPROUSM156N` (verified 0.24) · fred row | 1 | **P0** | — |
| `us-pce-core-yoy` | The Fed's preferred inflation gauge (FA new) | prices-heat, scored | The number the Fed actually targets; CPI alone mis-frames the policy reaction function. **Coincident.** | monthly | FRED `PCEPILFE` index (verified 130.13) → derived YoY (existing derived pattern) · fred row | 1 | **P0** | — |
| `michigan-sentiment` | US consumer mood, Michigan (FA new) | growth-health, scored | The consumer pulse households recognize from the news; leads spending; carries the 1y expectations leg (FRED `MICH`, verified 4.2%). **Leading.** | monthly | FRED `UMCSENT` (verified 55.2) · fred row | 1 | **P0** | — |
| `us-2y` (display) | What the US pays to borrow for 2 years (FA new) | borrowing-costs, context | Completes the Treasury-curve display; makes `yield-curve-10y2y` self-explanatory; the market's policy path. **Coincident/short-leading.** | daily | **already collected** (bulk group 2 + Treasury fallback) · fred row | **0** | **P0** | — |
| `breakeven-10y` (display) | Expected US inflation, ten years ahead (FA new) | prices-heat, context | The near/long expectations pair with 5y5y — both legs of the anchoring story. **Leading (repricing).** | daily | **already collected** (`T10YIE`, validation-only today) · fred row | **0** | **P0** | — |
| `euro-aaa-10y` | What the safest euro-area governments pay for 10 years (FA new) | borrowing-costs, context (replaces/supersedes monthly `bund-10y`) | The daily euro long-end — the fix for the structurally stale OECD mirror. Informs the global-rates reading at policy turns. **Coincident.** | daily | ECB Data Portal YC dataset — **exact series key (verify)**; four candidate keys probed live and 404'd (§10) · ecb register row exists | 1 | **P0** | build-time key verification |
| `food-index` (+`wheat`, `maize`) | World food prices (FA new) | prices board + prices-heat context | Groceries are the most-felt line of household inflation on both audience maps; the energy-vs-food pairing is a natural gauge. Already downloaded daily, unparsed. **Coincident.** | monthly | Pink Sheet Monthly Indices (Food/Agriculture) + grain columns (enumerated 2026-10-22) · world-bank row | **0** | **P0** | — |
| **unhide** `shiller-cape` + `shiller-ecy` | US share prices vs long-run earnings · Excess CAPE Yield (FA copy **already written**: «قیمت سهام آمریکا در برابر سود بلندمدت (شیلر CAPE)») | market-stress context (or valuation slot) | Makes "are shares expensive?" answerable — the top-3 household question; ECY vs real yield is the equity-vs-bond call. **Secular valuation timing.** | monthly | **already collected** · licence register currently L1 private-only | **0** | **P0** | **OD-1** (owner licence call) |
| **unhide** `china-pmi` | Chinese factory activity (FA copy already written: «شاخص فعالیت کارخانه‌های چین») | growth-health (already scored!) | China demand for AU exports (iron ore, copper) and global trade; a *scored* member hidden from the public is a transparency oddity. **Leading.** | monthly (manual today) | **already collected** (manual) | **0** | **P0** | cadence/attribution honesty fix; automation probe (§5.3); **OD-2** |

### 5.2 P1 — the leading edge

| ID | Name | Placement | Rationale & role | Cadence | Source | Tier | Priority | Dependencies |
|---|---|---|---|---|---|---|---|---|
| `mortgage-30y` | The US 30-year home-loan rate (FA new) | borrowing-costs, context | The US household's borrowing cost — pairs with AU home-loan for the two-audience household story. **Coincident, transmission leg.** | weekly | FRED `MORTGAGE30US` (verified 7.40%) | 1 | P1 | — |
| `walcl` | The Fed's balance sheet (FA new) | market-stress, context | QT tracking — the liquidity driver of 2020–26; pairs with M2. **Leading (liquidity).** | weekly | FRED `WALCL` (verified 6,755,639) | 1 | P1 | — |
| `retail-sales` | US consumer spending (FA new) | growth-health, context | The consumption pulse (~68% of GDP) — the missing real-economy link of the transmission chain. **Coincident, short lead.** | monthly | FRED `RSAFS` (verified 739,322) | 1 | P1 | — |
| `housing-permits` | US building permits (FA new) | growth-health, context | The classic long-leading, most rate-sensitive sector; completes the rates→housing narrative. **Leading (long).** | monthly | FRED `PERMIT` (verified 1,403) | 1 | P1 | — |
| `cfnai` | US economic activity scorecard (Chicago Fed) (FA new) | growth-health, context | The composite activity gauge — the free ISM substitute given ISM's paywall (Tier-3 hold stands). **Coincident with lead.** | monthly | FRED `CFNAI` (verified +0.08) | 1 | P1 | — |
| `ig-oas` | The extra yield safer companies pay (FA new) | market-stress, context | Second credit leg — IG vs HY breadth tells whether stress is confined or broad. **Leading at turns.** | daily | FRED `BAMLC0A0CM` (verified 0.87%); engineering's BBB variant `BAMLC0A4CMBB` (verify) | 1 | P1 | OD-5 row covers both |
| `job-openings` | US job openings (JOLTS) (FA new) | growth-health, context | Openings roll over before unemployment rises — the Powell-era labor dashboard's leading edge. **Leading.** | monthly | FRED `JTSJOL` (verified 7,335k) | 1 | P1 | — |
| `t5yie` | Expected US inflation, five years ahead (FA new) | prices-heat, context | Near-term market expectations — the missing middle leg between 1y Michigan and 5y5y. *Not currently collected* (my audit initially mis-tagged it as collected; corrected in reconciliation §7). | daily | FRED `T5YIE` (verified 2.40%) | 1 | P1 | — |
| `us-wages` | US wage growth (FA new) | prices-heat, context | The wage leg of the wage-price loop — AU has one, the US doesn't. **Coincident/lagging.** | monthly | FRED `AHETPI` $/hour (verified $32.53) → derived YoY | 1 | P1 | — |
| `euro-hicp` | Euro-area prices vs a year ago (FA new) | new euro-area slot (beside ecb-dfr) | The euro area has only a policy rate — no inflation, no growth; HICP starts fixing the thinnest major economy on the map. **Coincident.** | monthly | ECB `ICP.M.U2.N.000000.4.ANR` *(verify)*; FRED mirror *(verify)* · ecb row | 1 | P1 | — |
| `china-cpi` | Chinese prices vs a year ago (FA new) | growth-health, China leg | China's inflation matters to the AU trade story and global demand; mirrors the china-pmi logic. **Coincident.** | monthly | FRED OECD mirror `CHNCPIALLMINMEI` *(verify)* | 1 | P1 | — |
| `usdtry` (FX pair) | Dollar vs Turkish lira (FA new) | FX module (+ optional card) | The canonical high-inflation EM currency — a live case study in the inflation→devaluation dynamic, and the first member of an optional EM-pressure block. Monitoring breadth for the allocation reader, not a household decision — hence P1, not P0. **Coincident.** | daily | Frankfurter/ECB (verified 49.628 this session; engineering verified 49.63 on 2026-10-22) · frankfurter row | 1 | P1 | — |
| `au-housing-finance` | New Australian home loans (FA new) | au-households, scored | The mortgage pipeline — leads home values and housing demand; the AU *leading* edge. **Leading.** | monthly | ABS Lending Indicators *(series verify)* · abs row | 1 | P1 | — |
| `au-saving-ratio` | The Australian household saving rate (FA new) | au-households, context | The hunkering-down gauge — same ABS national-accounts flow as terms-of-trade. **Coincident.** | quarterly | ABS ANA *(series verify)* · abs row | 1 | P1 | — |
| `au-job-vacancies` | Australian job vacancies (FA new) | au-households, context | Leading labor for the AU jobs card. **Leading.** | quarterly | ABS Vacancies *(series verify)* · abs row | 1 | P1 | — |
| `platinum` → daily | (existing card, cadence fix) | prices board | XPT answers daily on gold-api (engineering-verified $1,573, 2026-10-22); monthly Pink Sheet stays as history. | daily | gold-api XPT · gold-api row | **0/1** | P1 | — |
| OECD-mirror honest relabel | bund/jgb/gilt/boj/boe "monthly average, lagged" | borrowing-costs context row copy | A month-old policy rate shown as current is actively misleading; the honest relabel costs nothing and buys time for the daily-source probes. — | — | copy change only | **0** | P1 | — |
| `m2-us` demotion | (existing, scored → context) | growth-health | Monetarist framing overweighted as a *scored* member; keep the series, lose the vote. — | — | config change only | **0** | P1 | — |
| **retire** `nzd-usd` | — | — | An indicator card for an audience that doesn't exist (no NZ coverage anywhere; not in the FX module's 10 pairs). — | — | removal (registry/UX) | **0** | P1 | owner nod (OD-7) |

### 5.3 P2 — texture, second legs, and probes

| ID | Name | Placement | Rationale & role | Cadence | Source | Tier | Priority | Dependencies |
|---|---|---|---|---|---|---|---|---|
| `sloos` | US banks tightening lending (FA new) | market-stress, context | Credit supply — the crunch gauge that pricing can't show alone. **Leading.** | quarterly | FRED `DRTSCILM` (verified 8.1) | 1 | P2 | — |
| `bank-reserves` | US bank reserves (FA new) | market-stress, context | The plumbing level behind repo squeezes. | weekly | FRED `WRESNS` *(verify — CSV endpoint served a challenge page this session, §10)* | 1 | P2 | — |
| `card-delinquencies` | US credit-card delinquencies (FA new) | market-stress, context | US household balance-sheet stress — the AU-arrears equivalent. **Lagging.** | quarterly | FRED *(series verify)* | 1 | P2 | — |
| EM FX block | USD/INR · USD/MXN · USD/ZAR · USD/BRL pairs (FA new) | FX module | The EM pressure basket after TRY; feeds an EM-currency rule. **Coincident.** | daily | Frankfurter (engineering-verified served, 2026-10-22) | 1 | P2 | after TRY proves the slot |
| `au-consumer-confidence` | Australian consumer mood (FA new) | au-households, scored | The AU sentiment canonical — leads spending. | monthly | Westpac-MI *(venue + licence probe)* | 2 | P2 | probe outcome |
| Derived pair | AU real term-deposit rate · US real mortgage rate | respective cards | Makes the real-return conversation explicit; zero new sources. | varies | derived | 1 | P2 | — |
| Aluminum · nickel | (Pink Sheet unlocks) | prices board context | Industrial demand beside copper. **Coincident.** | monthly | Pink Sheet (already downloaded) | **0** | P2 | — |
| Urea / DAP · TTF gas · cotton | (Pink Sheet unlocks) | prices board context | Fertilizer→food chain; European household energy; textiles. Real, but second-derivative for these audiences — below the food index. | monthly | Pink Sheet (already downloaded) | **0** | P2 | editorial case |
| Venue probes (parallel afternoon) | BoE gilt daily · BoJ JGB daily · EODHD au-10y · NBS china-pmi automation | fixes the OECD staleness at the source | Probe before promising (engineering Tier-2 list, agreed). — | — | venue probes | 2 | P2 | — |
| **retire** `silver-btc` | — | — | The weaker twin of gold-btc; two cards for one idea. — | — | removal | **0** | P2 | owner nod (OD-7) |
| `boj-rate`/`boe-rate` fix-or-retire | — | — | If the BoE/BoJ probes fail: relabel honestly or retire — a stale policy rate is worse than none. — | — | — | 2 | P2 | probe outcome |
| INDPRO | US industrial production (FA new) | growth-health, context | Classic coincident gauge — but below retail sales/permits/CFNAI in card real-estate value (a visible downgrade vs the engineering pass's pack, §7). | monthly | FRED `INDPRO` *(verify)* | 1 | P2 | — |

---

## 6. What I would NOT add — and why (noise discipline)

- **Iran-economy indicators — USD/IRR in insights, Iranian gold/coins, a derived coin premium, Iran CPI/GDP/unemployment, TEDPIX, SCI feeds** — **excluded outright by the owner's standing directive (2026-10-23, decision D-41 — see scope note): not a noise judgement, a scope decision.** Insights stays a global product; the TGJU *converter's* separate standing instruction is untouched.
- **PPI / import prices / supercore** — second-tier inflation; CPI+PCE+expectations+wages covers the household question.
- **Labor-force participation, EPOP, unemployment duration** — analyst texture; the household question is "are jobs disappearing" (claims, openings, unemployment).
- **AAII, put/call, CFTC positioning** — retail/professional positioning noise; no decision content for savers.
- **More G10 pairs** — the FX module's 10 plus the basket is complete; breadth belongs in EM (TRY first).
- **More crypto** — ETH stays retired (OD-3); stablecoin metrics, on-chain data: not a savings-decision input.
- **GDPNow / nowcast duels** — venue-awkward, heavily revised; CFNAI + claims + retail sales is the honest free stack.
- **Baltic Dry, Citi surprises, REER** — professional-culture noise; no audience decision touched.
- **Conference Board LEI** — a composite of things we'd rather show (or skip) individually.
- **Palladium + gold/palladium + silver/platinum ratios** — the visible disagreement with the engineering pass (§7): completing the PGM set is collector logic, not advisor logic. XPD answers (engineering-verified $1,079) — that's a reason it *could* be added, not a reason it *should*.
- **UK CPI, Japan CPI** — informs neither audience; breadth for breadth (euro-area HICP and China CPI earn their slots; these don't).
- **ECB/BoJ balance sheets, MOVE, official DXY, ISM, Caixin, S&P flash PMIs, LME realtime, USD/RUB** — paywalled/licence-blocked; the engineering pass's Tier-3 holds are correct and I co-sign them.
- **EGP/ARS and other licence-opaque frontier venues** — not worth the register risk; the EM block starts with TRY on an already-cleared provider (Frankfurter).

---

## 7. Reconciliation with `docs/GAP_ANALYSIS.md`

*Method reminder: the expert pass was sealed first; the engineering document was read afterwards. Where the two disagree, the disagreement stays visible — the owner decides.*

### 7.1 Agreements (strong convergence — independent arrival)

The engineering pass and this review **independently converged** on: ICSA · credit spreads (HY + second leg) · SOFR · MORTGAGE30US · WALCL · RECPROUSM156N · Michigan (UMCSENT) · core PCE · retail sales · JOLTS · the ECB euro-area AAA 10y as the bund fix (their "single highest-value rates add") · USD/TRY (both probed live: 49.63 vs 49.628, same day) · the Pink Sheet unlock with food as the headline · the unhide question for the hidden trio · DGS2 + T10YIE as Tier-0 displays · the Tier-3 paywall holds (ISM/Caixin/DXY/MOVE/LME/RUB) · no intraday FX in insights. That two passes anchored differently (feasibility vs decisions) landed on the same list is the strongest signal in this round: **these are the real gaps.**

*(Note: the two passes had also converged on the WDI Iran trio and the TGJU converter path into insights; the owner's D-41 directive — issued after both passes — takes those off the board. The engineering document's Iran items are re-marked in its annotation layer, not deleted from it.)*

### 7.2 What the engineering pass missed (this review's additions)

1. **The AU leading edge — entirely absent from GAP_ANALYSIS.** Housing finance commitments, household saving ratio, job vacancies, consumer confidence. The engineering pass treats AU as "deep, done" (19 indicators); the advisor pass shows the depth is all *levels* — the leading edge is missing.
2. **CFNAI** — the composite-activity layer of the recession toolkit; the free ISM substitute.
3. **Housing permits** — the long-leading sector; pairs with the rates complex the product already has.
4. **US wages (`AHETPI`)** — the missing wage leg of the inflation story.
5. **All subtractions.** The engineering pass adds, full stop. An advisor subtracts first: `nzd-usd` and `silver-btc` retirements, the `m2-us` demotion, the OECD-mirror honest relabel, the boj/boe fix-or-retire. Nothing in GAP_ANALYSIS proposes removing a single indicator.
6. **Corrections it prompted in my own audit (honesty note):** my pass assumed the 5y breakeven (T5YIE) was already collected — wrong; only the **10y (T10YIE)** is in bulk group 2. T5YIE is a Tier-1 *new fetch* (verified available). The engineering baseline was right; my audit stands corrected.

### 7.3 Challenges — where the two views disagree (owner decides)

| # | Item | Engineering pass | Economist's view |
|---|---|---|---|
| C-1 | **ETH re-add** | Re-add if the retirement was display-taste (served live, playbook exists) | **Keep retired.** A second crypto price line adds no decision information for a savings audience; BTC + fear/greed + the gold ratio covers the crypto-savings story. (OD-3) |
| C-2 | **Palladium + PGM ratios** | Complete the PGM pair; XPD verified | **Skip.** Card-count inflation; no decision for either audience. Ratio cards doubly so. (OD-4) |
| C-3 | **UK/Japan CPI mirrors** | Tier-1 candidates (verify) | **Skip** — breadth for breadth; informs neither audience. Euro-area HICP and China CPI earn slots; UK/JP don't. (OD-6) |
| C-4 | **INDPRO in the FRED pack** | Phase-2 pack member | **Downgrade to P2** — card real estate is scarce; retail sales + permits + CFNAI cover the growth question with more decision content. |
| C-5 | **Roadmap ordering** | Effort/risk-ordered: display-tier first (Phase 1), FRED pack second, probes third, audience last (Phase 4) | **Value-ordered** (§8): the owner decisions can land in week one (they're decisions, not work); the early-warning pack is the analytical core, not "one more pack"; the Shiller unhide is the strategic unlock, not an afterthought. The engineering order is the right *build* order inside a wave; the economist order is the right *priority* order across waves. |
| C-6 | **AU completeness** | "Deep — the second editorial pillar" (map §1) | Deep in levels, missing its leading edge (§7.2 item 1) — "deep" is doing less work in that sentence than it appears to. |

---

## 8. Proposed Phase-2 implementation order (for the owner to approve — a later session implements)

Waves are value-ordered; inside each wave the build order follows the engineering pass's effort tiers (Tier 0 before Tier 1). Nothing here starts without the owner's approval; OD items gate where marked.

- **Wave 0 — owner decisions (no engineering; days):** OD-1 Shiller unhide · OD-2 china-pmi unhide (attribution honesty) · OD-3 ETH stays retired · OD-4 palladium: no · OD-5 credit-spread register row · OD-6 UK/JP CPI: skip · OD-7 retirement set · OD-8 wave approval.
- **Wave 1 — the early-warning pack (the analytical core; one FRED bulk-group edit + one register row):** `initial-jobless-claims` · `hy-oas` · `sofr` · `recession-probability` · `us-pce-core-yoy` · `michigan-sentiment` + the two Tier-0 displays (`us-2y`, `breakeven-10y`). All FRED series verified live (§10).
- **Wave 2 — the household-costs & euro long-end wave:** Pink Sheet `food-index` + wheat/maize · `euro-aaa-10y` (after build-time key verification) · `usdtry` (the EM-pressure first member).
- **Wave 3 — the leading edge:** `mortgage-30y` · `walcl` · `retail-sales` · `housing-permits` · `cfnai` · `ig-oas` · `job-openings` · `t5yie` · `us-wages` · `euro-hicp` · `china-cpi` · platinum-daily · OECD relabels · m2 demotion · `nzd-usd` retirement · AU trio (`au-housing-finance`, `au-saving-ratio`, `au-job-vacancies`).
- **Wave 4 — probes + texture:** the venue-probe afternoon (BoE · BoJ · EODHD au-10y · NBS automation) · `sloos` · `bank-reserves` *(verify)* · `card-delinquencies` *(verify)* · EM FX block · `au-consumer-confidence` probe · derived pair · aluminum/nickel/urea/TTF/cotton as editorial cases arise · `silver-btc` retirement · boj/boe fix-or-retire.

---

## 9. Open owner decisions

Each numbered, each with my recommendation. Nothing below was decided unilaterally; no changes were made on the owner's behalf this session. (The owner's own Iran-exclusion directive — D-41 — is already decided and is therefore not listed among the open calls.)

| # | Decision | My recommendation | Why |
|---|---|---|---|
| **OD-1** | **Unhide the Shiller pair** (licence register currently L1 private-only) | **Yes, after confirming display terms** | FA copy with attribution is already written («با ارجاع به رابرت شیلر، دانشگاه ییل»); the best free valuation series shouldn't be invisible. If the licence posture can't be confirmed, it stays private — the register stays fail-closed either way. |
| **OD-2** | **Unhide `china-pmi`** | **Yes, once the manual-source attribution/cadence honesty is fixed** (automation probe optional) | It is already a *scored* growth-health member — hiding a scored member from the public is a transparency oddity. China demand matters to both the AU trade story and the global-growth reading. |
| **OD-3** | **ETH re-add** (engineering's Tier-0/3.4 suggestion) | **No — keep retired** | No decision information for a savings audience; the retirement (2026-10-21c) was correct. Overridable if owner has audience evidence of ETH demand (e.g., analytics). |
| **OD-4** | **Palladium + gold/palladium + silver/platinum ratios** | **No** | Collector logic, not advisor logic. The platinum-*daily* upgrade (XPT) is the only PGM change worth making. |
| **OD-5** | **Credit-spread licence row** (ICE BofA indices via FRED) | **Yes** | Same posture as the VIXCLS/NFCI precedent; the analytical payoff (domain 5 C− → B) is the largest single-domain upgrade on the board. |
| **OD-6** | **UK/Japan CPI mirrors** | **Skip** | Breadth for breadth; informs neither audience. Euro-area HICP + China CPI proceed; UK/JP CPI do not. |
| **OD-7** | **The retirement/demotion set:** `nzd-usd` retire · `silver-btc` retire · `m2-us` scored→context · OECD-mirror relabels | **Yes** | Subtraction discipline; every item reversible; the relabels are the cheapest honesty fix on the dashboard. |
| **OD-8** | **Phase-2 wave order approval** (§8) | **Approve as proposed** | Value-ordered across waves, effort-ordered inside them; owner decisions front-loaded (Wave 0) so nothing downstream stalls on a pending call. |

---

## 10. Verification evidence (live probes by the 2026-10-23 expert session; the later same-day revision session added no probes — docs only)

**FRED fredgraph CSV endpoint** (the pipeline's own mechanism; probed from this sandbox — note the CF-venue fallback machinery from the 2026-10-22 round applies at build time):

| Series | Last observation returned | Series |
|---|---|---|
| `ICSA` | 200,000 @ 2026-10-10 | `RECPROUSM156N` 0.24 @ 2026-07 |
| `BAMLH0A0HYM2` | 3.33 @ 2026-10-20 | `UMCSENT` 55.2 @ 2026-07 |
| `BAMLC0A0CM` | 0.87 @ 2026-10-20 | `MICH` 4.2 @ 2026-07 |
| `SOFR` | 3.88 @ 2026-10-20 | `PCEPILFE` 130.133 @ 2026-07 |
| `MORTGAGE30US` | 7.40 @ 2026-10-15 | `PCEPI` 131.172 @ 2026-07 |
| `WALCL` | 6,755,639 @ 2026-10-14 | `AHETPI` $32.53 @ 2026-08 |
| `RSAFS` | 739,322 @ 2026-08 | `CFNAI` +0.08 @ 2026-07 |
| `PERMIT` | 1,403 @ 2026-08 | `JTSJOL` 7,335 @ 2026-07 |
| `T5YIE` | 2.40 @ 2026-10-21 | `DRTSCILM` 8.1 @ 2026-04 |

**Negatives (verified as *not* confirmed — marked (verify) throughout):** `WRESNS` — the fredgraph CSV endpoint served a challenge page, series unverified from this sandbox · ECB Data Portal euro-area AAA 10y — four candidate series keys (`FM/B.U2.EUR.4F.KR.U2_10Y.YLD`, `.LEV`, `YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y` and a G_N_C variant) all returned 404/no-data; **the exact key must be found at build time** (the ecb-dfr integration proves the portal works from this stack).

**Other providers:** Frankfurter USD→TRY **49.628 @ 2026-10-22** (live). *(The first-draft session also probed the World Bank WDI API's Iran series live; that evidence was withdrawn from this document together with the Iran scope — decision D-41 — and is recorded in the session worklog.)*

**Cited from the engineering pass (verified 2026-10-22, attributed — not re-probed):** gold-api XPT $1,573 · XPD $1,079 · ETH $2,381 · Frankfurter EM pairs served · Pink Sheet column enumeration.

**Credentials this session:** GitHub ✓ (repo API + clone/push) · Cloudflare token ✓ (verify endpoint: active; read-scopes not probed — not needed for a docs session) · EODHD ✓ (`/api/user`: 17/20 daily, extraLimit 278 — **quota untouched**; no market-data requests made this session).

---

## Appendix — defects & notes for the implementing session (analysis-only outputs)

1. **Inventory defect:** `au-petrol-yoy` is missing from `docs/INDICATOR_INVENTORY.md` §1's indicator tables (present in the registry and only mentioned in the §2 money-cards row). One-line fix for the next docs round.
2. **A scored member is hidden:** `china-pmi` carries gaugeMembership "scored member" while being site-mode hidden (OD-2) — worth an explicit policy: hidden ids shouldn't vote in public gauges, or unhide shouldn't wait.
3. **No FA copy exists yet for any proposed id** — every FA name lands through the manifest-audited copy workflow; the FA names quoted in §5.1 are the *already-written* entries for the hidden trio.
4. This session changed no code, no schema, no cron, no deploys — `docs/EXPERT_REVIEW.md` (this revision), the annotation block in `docs/GAP_ANALYSIS.md` (markers re-issued for D-41 and the OD renumbering), `docs/DECISIONS_FOR_ALI.md` (D-41 — the owner's own directive, recorded), and the worklog are the only outputs.

*Companion documents: `docs/INDICATOR_INVENTORY.md` (the baseline) · `docs/GAP_ANALYSIS.md` (the engineering-first pass, now annotated with this review's priority markers) · `docs/DECISIONS_FOR_ALI.md` (the running decisions log — D-41 records the owner's Iran-exclusion directive; the open decisions above are the owner's to close).*
