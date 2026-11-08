# Currena — Page-Division Spec

> **v1.0 · 2026-11-07 · Phase 2 deliverable for external investor review.**
> This document specifies the split of Currena's single all-in-one Insights
> page into 10 destinations. It is written to be *reviewable by a financial
> professional*: every page states its purpose, audience, layout, and exact
> indicator membership; every placement traces to a recorded owner decision
> (D-1…D-48 in `03-STRATEGY-LOG.md`).
> Reviewers are asked to challenge §19 (the questions we want your judgement on).

---

## Table of contents

1. [Product objective & audience](#1-product-objective--audience)
2. [The 10 destinations at a glance](#2-the-10-destinations-at-a-glance)
3. [Governing principles](#3-governing-principles)
4. [Global — the world scan](#4-global--the-world-scan)
5. [Gold](#5-gold)
6. [World Markets](#6-world-markets)
7. [USA](#7-usa)
8. [Europe](#8-europe)
9. [Asia & Pacific](#9-asia--pacific)
10. [Australia](#10-australia)
11. [Commodities & Energy](#11-commodities--energy)
12. [Currency Pairs](#12-currency-pairs)
13. [Legacy & retirement](#13-legacy--retirement)
14. [The full placement table — 184 ids + 6 boards](#14-the-full-placement-table--184-ids--6-boards)
15. [New data to add (thin-region fills)](#15-new-data-to-add-thin-region-fills)
16. [Deliberately excluded & blocked](#16-deliberately-excluded--blocked)
17. [Engine & verdict language](#17-engine--verdict-language)
18. [Navigation, routes & visual language](#18-navigation-routes--visual-language)
19. [Questions for the investor](#19-questions-for-the-investor)
20. [Risks](#20-risks)
21. [Acceptance criteria & test gates](#21-acceptance-criteria--test-gates)
22. [Build order & session plan](#22-build-order--session-plan)

---

## 1. Product objective & audience

Currena today serves ~184 registry indicators, 6 boards, and a 37-voter gold
meter **on one page**. The objective (owner's words): *different pages based
on categories which are important and people actually read.*

**Audiences, in priority order:**

| Audience | Their page | Their need |
|---|---|---|
| The fast scanner | **Global** | "What is the state of the world's economy, right now?" — one screen, verdicts, zero scrolling |
| The gold follower | **Gold** | The 37-voter conditions meter + everything gold |
| The region reader | USA · Europe · Asia & Pacific · Australia | "What's happening *there*?" — tiered by world-impact |
| The market watcher | World Markets | 16 country indexes on one map |
| The commodity/energy reader | Commodities & Energy | Energy · Metals · Agriculture · Digital |
| The FX trader | Currency Pairs | The 7 rule lights first, the pair board second |
| The existing audience | Legacy `/insights` | Unchanged during migration (D-9) |

**The honest premise carries over everywhere:** the meters are *descriptive
condition readers*, not forecasters. No forecasting edge is claimed or
implied — the measured sign-agreement record is printed on the Gold page and
the claim discipline is a hard copy rule (§17).

## 2. The 10 destinations at a glance

| # | Page | Route | Registry cards | Boards / extras | Decisions |
|---|---|---|---|---|---|
| 1 | Global | `/` | 0 (verdict board) | 10 tiles · ribbon · chips · narrator | D-7, D-10…D-11, D-21…D-25 |
| 2 | Gold | `/gold` | 13 + 4 blocked-notes | 37-voter meter · price hero | D-5, D-26…D-29 |
| 3 | World Markets | `/world-markets` | 9 | 16-index board + world map | D-13, D-43, D-47 |
| 4 | USA | `/usa` | ~72 in 6 tiers | TIC board (21) · index section | D-14, D-29…D-32 |
| 5 | Europe | `/europe` | 8 (+3–4 fills) | Europe zoom map | D-15, D-33, D-34 |
| 6 | Asia & Pacific | `/asia-pacific` | 11 (+3 fills) | Asia zoom map | D-16, D-17, D-35, D-36 |
| 7 | Australia | `/australia` | 28 | AU Markets board (19) | D-6, D-37 |
| 8 | Commodities & Energy | `/commodities` | 24 | live prices | D-2, D-19, D-38…D-40 |
| 9 | Currency Pairs | `/currencies` | 14 | 7 rule lights hero | D-18, D-32, D-41, D-42 |
| 10 | Legacy | `/insights` | today's page | deprecation banner | D-9, D-46 |

Count check: ~72 + 13 + 9 + 8 + 11 + 28 + 24 + 14 = **184** registry ids
placed (+4 blocked ids as Gold-page notes). Session 2 of the build generates
the authoritative table from `data/indicators.json` and reconciles it against
§14 — any drift is an audit finding, not a silent fix (Agent Rule 5).

## 3. Governing principles

1. **The Global-Impact Rule (D-10).** Very important + global impact →
   briefly mentioned (or verdicted) on Global; details live on the category
   page. Gold is global; iron/copper are not; oil is global. This rule governs
   the Global tile set *and* the duplication policy everywhere.
2. **One home per card; mirrors are links.** Every indicator card has exactly
   one home page. Verdicts, seat chips, and map dots may appear elsewhere, but
   they are displays of the same computed value, linking to the home card.
   Nothing is computed twice.
3. **Engine and display are separate layers.** Gauge membership, the gold
   voter table, thresholds, and calibration live in the engine and DO NOT
   change during this project. Page placement is a display-layer concern
   only. (Gold voters keep voting no matter where their cards live.)
4. **Fail-closed data discipline.** Every adapter already fails closed
   (unverifiable → `unread`, never guessed). This carries to the UI: a tile
   that can't read says "can't read" — Agent Rule 5 makes it permanent.
5. **Honest verdicts (D-48).** The existing engine language everywhere:
   5-step gauge verdicts, the gold meter's 7-state outlook, MIN2 crowd
   minimums, unread states. Never bare traffic-lights, never invented
   composites without calibration.

## 4. Global — the world scan

**Purpose:** the one-screen answer to *"how is the world's economy doing
right now?"* — for people who scan fast.
**Audience:** the fast scanner (primary); every visitor's entry point
(landing page, D-20).
**Layout (strictly one screen, D-11):**

```
┌─ VERDICT BOARD (10 tiles, 5×2 desktop / 1-col mobile) ────────────┐
│ ① GOLD BALANCE      ② BORROWING COSTS   ③ INFLATION HEAT          │
│ ④ MARKET STRESS     ⑤ DOLLAR STRENGTH   ⑥ GROWTH HEALTH          │
│ ⑦ FX LIGHTS         ⑧ WORLD MARKETS     ⑨ PRICES RIBBON          │
│ ⑩ DEDOLLARIZATION (context)                                        │
├─ REGION CHIPS: USA ● Europe ● Asia&Pacific ● Australia ●          │
│                Markets ● Commodities ● Currencies ●               │
├─ NARRATOR: "what changed today" (one line)                        │
└───────────────────────────────────────────────────────────────────┘
```

**Tile definitions (D-21):**

| Tile | Shows | Links to |
|---|---|---|
| Gold Balance | compact 7-state outlook + for/against counts of the 37-voter meter | `/gold` |
| Borrowing Costs · Inflation Heat · Market Stress · Dollar Strength · Growth Health | the 5 thematic gauge verdicts (5-step scale + one-line why) | the pages holding their detail cards |
| FX Lights | unusual/attention status + count of active rules (R1–R7) | `/currencies` |
| World Markets | stressed/correction/bear counts over the 16 indexes | `/world-markets` |
| Prices ribbon | gold · brent · BTC — live hourly, day change (D-22) | `/gold`, `/commodities` |
| Dedollarization | reserve-share level + custody direction, display-only (D-25) | `/currencies` |

**Explicitly absent:** detail cards, history charts, long lists, scrolling.
Everything deep lives one click away.

## 5. Gold

**Purpose:** THE gold card for every visitor — the conditions meter plus the
complete gold picture.
**Layout (D-26):**

1. **Hero** — live gold price (hourly overlay + 10-year context) + the
   Balance Scale verdict + 7-state outlook + for/against/neutral/unread counts.
2. **The 37 seats, grouped by the 5 lanes** — borrowing-costs (7) · dollar
   (7) · stress (11) · inflation (10) · flows (2, contrarian). Each seat chip:
   name · lean (supports/pressures/neutral/unread) · evidence word
   (rising/falling/high/low) · link to the seat's home card.
3. **Context cards** — ratios & flows (table below).
4. **Honest-record footnote** — the measured sign-agreement record, MIN2
   calibration, "descriptive conditions meter, no forecasting edge."

**Membership:**

| Group | ids |
|---|---|
| Ratios (D-27) | gold-usd (hero) · gold-silver · gold-btc · gold-aud · gold-oil-ratio · gold-platinum · real-gold-price · copper-gold · gold-equities-ratio |
| Flows & positioning | cftc-gold-positioning · cftc-gold-gross-long · sge-gold-withdrawals · swiss-gold-flow · shanghai-gold-premium |
| Blocked (notes only, §16) | wgc-etf-holdings · wgc-cb-demand · official-gold-demand · etf-short-interest |

Silver/platinum/copper **prices** live on Commodities (D-19/D-27); the gold
**ratios** stay here. Gold crosses (XAUUSD, XAUAUD) stay here (D-18).

## 6. World Markets

**Purpose:** the state of world equities at a glance + the world's risk
backdrop.
**Layout:**

1. **Hero — the world map** (REUSE the existing insights world-index map,
   D-43): one dot per index, colour = trend/status, hover = 1d/1w/1m changes;
   status summary (unusual ≥8 stressed · attention ≥4).
2. **Region grids:** Asia (N225 · KOSPI · HSI · SSEC · TAIEX · NIFTY50) ·
   Europe (STOXX50E · DAX · CAC · FTSE) · Americas (SP500 · NDX · DOW · TSX ·
   IBOV) — each row: chg 1d/1w/1m/3m/1y, 52-wk range position, trend band,
   status (correction −10% / bear −20%).
3. **World risk & liquidity section:** gpr-index · gpr-threats · gpr-acts ·
   gpr-daily · gpr-russia · gpr-ukraine · gpr-israel · gpr-saudi ·
   global-liquidity.

Regional pages get **zoomed continent maps** (D-13/D-44); TSX/IBOV stay here
until the future OECD page (D-16). Build slot: right after Gold (D-47) — the
board already runs daily; this is a reorganize, not a rebuild.

## 7. USA

**Purpose:** the American bulk — the deepest page, tiered by world-impact
(D-14): *the numbers the planet reacts to first; the numbers that mostly
matter to Americans last.*

**Layout:**

1. **Top — the 5 thematic gauge verdicts** (same computed verdicts as
   Global, US-framed copy: "Is borrowing getting costlier in America?") (D-30).
2. **Tier 1 — "The world watches" (7 cards, D-29):** fed-target ·
   fed-expectations · us-cpi-yoy · us-pce-core-yoy · us-nfp ·
   us-unemployment · us10y.
3. **Tier 2 — Rates & the Fed (22):** yield-curve-10y2y · yield-curve-10y3m ·
   real-yield-10y · real-yield-5y · real-curve-10y5y · us30y · us-2y · sofr ·
   mortgage-30y · nyfed-custody · us-deficit-monthly · us-deficit-12m ·
   treasury-auction-10y · treasury-auction-10y-indirect ·
   treasury-auction-30y · treasury-auction-30y-indirect · rstar-us ·
   debt-to-gdp · govt-interest-revenue.
4. **Tier 3 — Inflation (13):** us-cpi-core-yoy · median-cpi · sticky-cpi ·
   us-wages · t5yie · breakeven-5y5y · breakeven-10y · breakeven-tilt ·
   cpi-nowcast · cpi-surprise · michigan-5y-expectations.
5. **Tier 4 — Labor & growth (19):** initial-jobless-claims ·
   continuing-claims · job-openings · sahm-rule · recession-probability ·
   michigan-sentiment · oecd-cli-us · philly-fed · empire-state · cfnai ·
   gdpnow · us-gdp-growth · retail-sales · housing-permits · epu-us ·
   tpu-us · m2-us.
6. **Tier 5 — Liquidity, stress & valuation (17):** walcl · tga ·
   reverse-repo · bank-reserves · repo-stress · net-liquidity ·
   stress-stlfsi · nfci · vix · bank-stress · ebp · ofr-fsi ·
   sloos-ci-tightening · term-premium-10y · shiller-cape · shiller-ecy ·
   sp500-breadth-ratio.
7. **Tier 6 — "Who finances America" (D-31):** the TIC board — 21 foreign
   holders of Treasuries + aggregates, 24-month history each.
8. **Bottom — US index section (D-44):** SPX · NDX · DOW zoom map + cards.

The dollar's 9 detail cards live on Currency Pairs (D-32); the
dollar-strength verdict still tops this page via D-30.

## 8. Europe

**Purpose:** the European picture — EU members and non-EU members **listed
apart** (D-33).

**Layout:**

1. **EU section:** ecb-dfr · euro-hicp · euro-aaa-10y · bund-10y ·
   btp-bund-spread · oecd-cli-de (+ fills §15: euro-area unemployment,
   industrial production, liquidity).
2. **Non-EU section — United Kingdom:** gilt-10y · boe-rate · FTSE (map).
3. **Europe zoom map (D-13/D-43):** STOXX50E · DAX · CAC · FTSE.
4. **Cross-links:** eur-usd · usdchf · usdtry → `/currencies`; euro-HICP
   seat chip on the Gold inflation lane → here.

Policy: reorganize what exists, ship, fill only what's embarrassing (D-15);
the FRED-only fills (D-34) are the only new data in v1 (§15).

## 9. Asia & Pacific

**Purpose:** the world's growth engine region — organized **by sub-region**
(D-35), not by theme.

**Layout:**

1. **China:** china-pmi · china-cpi · oecd-cli-cn · gpr-china · gpr-taiwan ·
   china-property-investment · china-steel-output (+ SGE links → `/gold`).
2. **Japan:** jgb-10y · boj-rate (+ fill: Japan CPI, §15).
3. **Korea · Taiwan · Hong Kong:** KOSPI · TAIEX · HSI (+ fill: Korea CPI).
4. **India:** NIFTY50 (+ fill: India CPI).
5. **Pacific — New Zealand (D-17):** nz-short-rate · nz-10y · NZX50.
6. **Asia zoom map:** N225 · KOSPI · HSI · SSEC · TAIEX · NIFTY50 · NZX50.

usdjpy / us-japan-10y-gap / usdcny cards live on Currency Pairs (D-32);
usdcny cross-links into the China section.

## 10. Australia

**Purpose:** the owner's home market — the already-strong AU section,
reorganized only (D-37).

**Layout:**

1. **Top — AU Markets board (19 symbols):** All Ordinaries · Small
   Ordinaries · 10 ASX-200 sectors · 4 big banks (CBA/NAB/ANZ/WBC) ·
   ASX 200 VIX · NZX50.
2. **The 3 voting gauges + 2 shadow gauges (unchanged structure):**
   au-inflation-rates (6) · au-households (11) · au-trade-currency (10) ·
   au-activity (7, shadow) · au-external (4, shadow) — minus the ids that
   moved out (below), plus gpr-australia.
3. **Remaining members (28 cards):** au-cpi · au-trimmed-mean ·
   rba-expectations · au-10y · au-us-10y-gap · au-petrol-yoy · au-home-loan ·
   au-wage-growth · au-rent-yoy · au-household-debt-arrears ·
   au-unemployment · au-home-values · au-housing-finance · rba-cash-rate ·
   au-deposit-rate · au-saving-ratio · au-job-vacancies · terms-of-trade ·
   rba-fed-gap · au-gdp-growth · au-household-spending ·
   au-building-approvals · au-population-growth · au-nom · au-participation ·
   au-underemployment · au-trade-balance · gpr-australia.

**Moved out:** audusd · audjpy · audnzd → `/currencies` (D-32/D-42) ·
nz-short-rate · nz-10y · china-property-investment · china-steel-output →
`/asia-pacific` (D-17/D-35) · iron-ore · coal-aus · lng-japan →
`/commodities` (D-19) · gold-aud → `/gold` (D-27). Their seat chips remain
in the AU gauges and link to the new homes.

## 11. Commodities & Energy

**Purpose:** every commodity, exclusively here (D-19) — "not the main focus
for now," so reorganize-only.

**Layout — four groups + supply (D-38/D-39):**

| Group | ids |
|---|---|
| **Energy (9)** | brent (live) · wti · natgas · gas-europe · lng-japan · coal-aus · eia-crude-stocks · us-spr · us-crude-production |
| **Metals (4)** | silver-usd · platinum · copper-usd · iron-ore |
| **Agriculture (3)** | food-index · wheat · maize |
| **Digital (2)** | btc-usd · crypto-fng (D-28/D-40) |
| **Trade routes & supply (6)** | chokepoint-suez · chokepoint-panama · chokepoint-bab-el-mandeb · chokepoint-malacca · chokepoint-taiwan · gscpi |

Cross-links: gold → `/gold` (the Global-Impact Rule's one commodity
exception); gold ratios → `/gold` (D-27).

## 12. Currency Pairs

**Purpose:** the FX picture — **rules first** (the assistant's delegated
layout decision, confirmed as F21-A / D-41).

**Layout:**

1. **Hero — the 7 rule lights (R1–R7)** with plain-language explanations:
   R1 risk-mood · R2 carry unwind · R3 dollar strength · R4 money-hiding ·
   R5 China link · R6 Europe worry · R7 dollar-or-euro attribution.
2. **The pair board — 11 pairs (D-42):** EURUSD · USDJPY · GBPUSD · USDCHF ·
   USDCNY · AUDUSD · AUDJPY · EURJPY · EURCHF · AUDCNY · **AUDNZD** — each:
   rate, d1/m1/m3/y1 changes, moveRank (0–100), bigMove flag, 52-week closes.
3. **Dollar standing section (D-32):** dollar-basket · dollar-broad ·
   dollar-eme · us-japan-10y-gap · usdtry · usdaed · usd-reserve-share.

Gold crosses (XAUUSD, XAUAUD) remain on `/gold` (D-18).

## 13. Legacy & retirement

- Today's all-in-one Insights page moves to **`/insights`**, unchanged, with
  a deprecation banner linking to `/` (D-46).
- It is retired **only** when every indicator is verified categorized (D-9)
  — the retirement readiness review is roadmap S24; execution is S25–S30
  (reserve).
- Bookmarks to the old URL keep working until then.

## 14. The full placement table — 184 ids + 6 boards

The authoritative per-id table is **generated programmatically** in build
Session 2 from `data/indicators.json` + this spec's rules, then committed as
`docs/page-division/PLACEMENT.generated.md`. The lists below are the spec's
intent; the generator reconciles and reports drift.

| Page | Registry ids (detail-card home) | Count |
|---|---|---|
| **Global** | — (verdict board only; mirrors link out) | 0 |
| **Gold** | gold-usd · gold-silver · gold-btc · gold-aud · gold-oil-ratio · gold-platinum · real-gold-price · copper-gold · gold-equities-ratio · cftc-gold-positioning · cftc-gold-gross-long · sge-gold-withdrawals · swiss-gold-flow · shanghai-gold-premium *(+4 blocked: wgc-etf-holdings · wgc-cb-demand · official-gold-demand · etf-short-interest)* | 14 + 4 |
| **World Markets** | gpr-index · gpr-threats · gpr-acts · gpr-daily · gpr-russia · gpr-ukraine · gpr-israel · gpr-saudi · global-liquidity | 9 |
| **USA** | tier 1–6 as listed in §7 | ~72 |
| **Europe** | ecb-dfr · euro-hicp · euro-aaa-10y · bund-10y · btp-bund-spread · oecd-cli-de · gilt-10y · boe-rate | 8 |
| **Asia & Pacific** | china-pmi · china-cpi · oecd-cli-cn · gpr-china · gpr-taiwan · china-property-investment · china-steel-output · jgb-10y · boj-rate · nz-short-rate · nz-10y | 11 |
| **Australia** | the 28 listed in §10 | 28 |
| **Commodities & Energy** | the 24 listed in §11 | 24 |
| **Currency Pairs** | dollar-basket · dollar-broad · dollar-eme · usdjpy · us-japan-10y-gap · eur-usd · usdchf · usdtry · usdaed · usdcny · usd-reserve-share · audusd · audjpy · audnzd | 14 |

**Boards:** FX board → `/currencies` · World Markets board → `/world-markets`
· AU Markets board → `/australia` · Prices live board → feeds Global ribbon +
Gold hero + Commodities live · TIC board → `/usa` · Companies board (flag
OFF) → parked.

**Dual-membership ids** (michigan-sentiment, sp500-breadth-ratio, gold voters
that are also gauge voters) get ONE home per the table; engine membership is
untouched (§3.3).

## 15. New data to add (thin-region fills)

The only new data in v1 — all from providers already integrated (FRED
mirrors / existing ECB SDMX adapter), all licence-clean (L0/L1), all
**verify-before-ingest** (Agent Rule 5: candidate series are verified live
against the source before an adapter merges; unverifiable → discarded):

| Region | Fill | Candidate source | Verify |
|---|---|---|---|
| Europe (D-34) | euro-area unemployment | FRED OECD mirror family | series id + live value vs Eurostat release |
| Europe | euro-area industrial production | FRED OECD mirror family | same |
| Europe | euro-area liquidity (M3-style) | ECB SDMX (existing adapter) | series key + live value vs ECB press |
| Asia (D-36) | Japan CPI YoY | FRED OECD mirror family | live value vs Japan Statistics Bureau |
| Asia | Korea CPI YoY | FRED OECD mirror family | vs KOSTAT release |
| Asia | India CPI YoY | FRED OECD mirror family | vs MoSPI release |

PMIs (euro-area, China Caixin, Japan au-Jibun) are deliberately **deferred**
to the investor review (§19) — licence-heavy sources, worth doing once, not
twice.

## 16. Deliberately excluded & blocked

| Item | Status | Why |
|---|---|---|
| WGC ETF holdings · WGC CB demand | blocked (L3) | needs prior written authorisation — draft prepared; owner action |
| official-gold-demand (PBoC/CBR) | blocked | PBoC English URL 404; venue re-find pending |
| etf-short-interest | blocked | no licence-clean venue |
| FTSE on EODHD | Yahoo-only | unavailable on the free key |
| SGE premium as a *voter* | context-only | archive depth insufficient for decade calibration |
| MCX India gold · ICE BofA spreads | rejected | venue-blocked / FRED copyright tag |
| Companies board (49) | feature-flag OFF | EODHD free quota (20/day) shared with markets |
| Gold crosses on Currency Pairs | excluded by D-18 | gold information stays on the Gold page |
| Any new composite verdicts on Global | excluded by D-48 | only existing calibrated engines; no invented composites without calibration |

## 17. Engine & verdict language

- **5-step gauge verdicts** (relaxed → alarmed): share = warnings ÷ fresh
  voters; section verdicts alarmed/stressed/cautious/relaxed.
- **Gold meter:** 37 voters · 5 lanes · MIN2 lane minimum · beam angle ·
  7-state Outlook (strong-bullish → strong-bearish + range-bound/mixed/
  neutral) · unread discipline (D-18 input-presence rule).
- **7 FX rule lights** (R1–R7) with the both-voices-agree discipline.
- **Markets status:** correction −10% / bear −20% from 52-week highs;
  unusual/attention summaries.
- **Copy discipline:** descriptive conditions language everywhere; no
  directional claims; the Gold page prints the measured sign-agreement
  record; "can't read" and "not enough readable voters" are first-class
  displayed states.

## 18. Navigation, routes & visual language

- **Grouped topbar (D-45):** Global · Gold · World Markets · Currencies ·
  Commodities · **Regions ▾** (USA · Europe · Asia & Pacific · Australia);
  mobile: hamburger drawer.
- **Routes (D-46):** `/` `/gold` `/world-markets` `/currencies`
  `/commodities` `/usa` `/europe` `/asia-pacific` `/australia` · legacy
  `/insights` with deprecation banner.
- **Visual language (D-48):** colour + label verdicts (5-step / 7-state),
  honest unread states, 10-year percentile bars on context cards, live
  hourly prices where they exist. Responsive mobile-first; sticky footers;
  touch targets ≥ 44px.
- **Landing:** `/` = Global (D-20).

## 19. Questions for the investor

1. **The Global 10-tile set (§4)** — is this the right "world scan"? Anything
   you'd swap in/out (e.g., a global-PMI tile would need a new, calibrated
   composite — we excluded that by D-48)?
2. **USA tier-1 (§7)** — the seven numbers the planet reacts to: fed-target,
   fed-expectations, CPI, core PCE, payrolls, unemployment, 10Y. Missing
   anything you'd rank higher?
3. **Thin regions (§15)** — FRED-only fills for Europe/Asia now; PMIs
   deferred. Would you prioritise PMIs (licence-heavy) ahead of the FRED
   fills, or agree with the zero-risk-first order?
4. **GPR family on World Markets (§6)** — world geopolitical risk indexes
   (Russia, Ukraine, Israel, Saudi…) live under World Markets. Right home,
   or would you give them a "World risk" section on Global (at the cost of
   the one-screen rule)?
5. **Commodities split (§5/§11)** — silver & platinum *prices* on
   Commodities while their gold *ratios* stay on Gold. Sensible to a
   metals reader?
6. **Retirement timing (§13)** — when would you retire the legacy page:
   after the placement audit (S24), or after a burn-in period of parallel
   running?
7. **Anything missing** for "pages people actually read" — one indicator or
   page you'd add that we deliberately excluded (§16)?

## 20. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Thin regions undermine credibility (EU ~8 ids, Asia ~11) | medium | fills §15 now; PMIs after investor review; pages labelled "growing" honestly |
| Yahoo refusal (403/429/999) stalls Markets/AU boards | medium | existing fail-closed behaviour; Yahoo politeness discipline; EODHD primary where licensed |
| EODHD free quota (20/day) shared between world markets & (parked) companies | low | companies stay OFF; quota reserved for world markets |
| WGC/PBoC gold-demand gap persists | medium | authorisation letter (owner action); venue re-find; blocked notes displayed, not hidden |
| SGE archive depth (~2024) | low | premium stays context-only, never a voter |
| Migration breaks the existing audience | medium | legacy route + banner (D-46); retirement only after placement audit (D-9) |
| Hand-counted placement drifts from the live registry | medium | Session 2 generates the authoritative table programmatically; drift = audit finding |
| Verdict misreading by new audiences | medium | honest-verdict copy rules; "can't read" states; no forecasting language anywhere |

## 21. Acceptance criteria & test gates

Per Agent Rule 4, every build session runs **testing, backtesting,
auditing** gates; per-page acceptance:

- **Global:** one screen at 1440×900 and 360×844; every tile shows a verdict
  or an explicit unread state; ribbon shows live hourly prices; chips link
  to all 7 destinations.
- **Gold:** meter counts match `/api/insights` exactly (seat-level diff);
  all 37 seats render with lean + evidence; honest-record footnote present.
- **Every page:** all listed cards render with value, 10-year position, and
  freshness within cadence grace; no dead links; source & licence badges
  visible; mobile layout passes.
- **Verdict consistency (backtest):** page-rendered verdicts byte-identical
  to the engine's stored verdicts for the same snapshot — zero tolerance.
- **Placement audit:** the generated table (§14) reconciles to 184 ids +
  6 boards with zero unplaced and zero duplicated homes.
- **Data audit:** spot-check N=20 random ids against their upstream sources;
  100% match or a recorded, explained difference.

## 22. Build order & session plan

**Order (D-20 + D-47):** Global → Gold → World Markets → USA → Europe →
Asia & Pacific → Australia → Commodities → Currency Pairs → integration →
investor feedback → legacy retirement.

**30 sessions, always "Session X/30 · Y remaining"** — full plan in
`01-SESSION-ROADMAP.md`; permanent working rules in `../AGENT-RULES.md` (consolidated into AGENTS.md §14).

| Phase | Sessions | Scope |
|---|---|---|
| A Foundations | S1–S4 | routes/nav/legacy · data layer + placement generator · Global build · Global gates |
| B Gold | S5–S6 | build · gates |
| C World Markets | S7–S8 | board + map reuse · zoom maps + gates |
| D USA | S9–S11 | verdicts + tiers 1–2 · tiers 3–6 + TIC + index · gates |
| E Europe | S12–S13 | build + fills (verify-first) · gates |
| F Asia & Pacific | S14–S15 | build + fills · gates |
| G Australia | S16 | restructure + AU board + gates |
| H Commodities | S17 | groups + trade routes + gates |
| I Currency Pairs | S18 | rules hero + 11 pairs + dollar standing + gates |
| J Integration | S19–S21 | nav/mobile/SEO · full regression + verdict backtest + data audit · spec-vs-implementation audit |
| K Investor + final | S22–S24 | feedback → spec v2 · feedback build · retirement readiness |
| Reserve | S25–S30 | fix rounds, performance, retirement execution |

---

*Spec v1.0 ends. Changes after investor review are recorded as spec v1.x
entries in `03-STRATEGY-LOG.md` §8 — never silent edits.*
