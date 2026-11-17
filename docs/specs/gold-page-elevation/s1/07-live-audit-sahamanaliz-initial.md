> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/07 — Initial Live Audit: sahamanaliz.com/pages/gold (the competitor)

*Survey audit from a rendered browser session on 16–17 Nov 2026 (desktop
1440×900 FA, 390×844 mobile). Deep audit = S3. The site is a Shopify
store + content hybrid (store tools exposed in page; sells stock
analysis subscriptions; "ورود مشترکین" login).*

## 1. Verified inventory (top → bottom)

| # | Section | Contents observed |
|---|---|---|
| 1 | Top bar | Home · Contest (مسابقه) · Subscriber login |
| 2 | Hero quotes | Gold $3,857.35 −0.03% & silver $47.06 +0.26% — live (1-min refresh), per-gram prices, prior-session close, "market open" state |
| 3 | Auto-narrative | Generated paragraph linking the day's move to real-yield (+0.26pp w/w) and DXY (+1.9% w/w) moves with mechanism sentence + "not advice" line |
| 4 | Price chart | Gold/silver toggle · 1m/6m/1y/5y/20y · **50 & 200 DMA overlays** + auto-computed statements ("13.6% below the 200-DMA… description, not a forecast") — 20y range verified working ($316→$5,709 axis) |
| 5 | Inflation & rates | CPI 4.0% (Oct 2026, prior 3.7%), core 2.8%, 10y breakeven 2.2% (w/y deltas), PPI 6.5% — each with plain-language meaning; **assembled reading paragraph**: "nominal 5.1%, market sees 2.2% inflation → real ≈ 2.9%… holding gold is costly" |
| 6 | 10-year inflation chart | Headline/core/PPI lines vs 2% Fed target |
| 7 | Gold vs real yields | Dual-axis chart + **stated rolling correlation −0.13 with the post-2022 central-bank explanation** ("از ۲۰۲۲ خرید سنگین بانک‌های مرکزی این رابطه را کمرنگ کرده") + data-gap note (Oct 2025 shutdown) |
| 8 | Fed decision market | Kalshi + Polymarket probabilities for Dec 9, 2026 (hike 0.25%: 90/92%), 30-min refresh, source links, "traders' forecast, not ours" |
| 9 | Gold/silver ratio | 82.1 vs 20y average 71, range 32–126, plain meaning ("با پول یک اونس طلا ۸۲ اونس نقره…") |
| 10 | Economic calendar | Next Fed (Dec 9, 23 days) + next CPI (Dec 10) with local-time conversion |
| 11 | Main factors list | Real yields 2.92% (w/y deltas, "most important factor"), 10y nominal 5.12%, DXY 103.6, **COT gold net 112,341 (longs/shorts/date) "mid 1-year range"**, **COT silver 3,615 "near 1y lows — high pessimism"** |
| 12 | Asset comparison table | Gold/silver/S&P/BTC over 1/5/10/20y with honest footnotes (no dividends, BTC history, best-in-period shading) |
| 13 | Miners & ETFs | 13 live-quoted tickers (NEM, AEM, B, WPM, FNV, RGLD, KGC, AU, PAAS, HL, AG, CDE) + GLD/IAU/SLV/GDX/GDXJ/SIL links — each ticker opens their stock-analysis product |
| 14 | Jewelry calculator (USD) | Weight × karat (24/22/21/18/14) × اجرت% × tax% → pure value + approximate price, live-computed |
| 15 | DCA calculator | $X/month since year Y (2006–2025) → gold vs silver vs S&P vs BTC cumulative (e.g. $100/mo since 2016: gold +121%, S&P +111%, BTC +1,646%) |
| 16 | Education (bottom) | How prices are set; real yields as key factor; dollar; CB/ETF/speculators; silver's dual nature |
| 17 | FAQ | 5 expandable questions (gram pricing, 18k, rates↑→gold↓?, Au/Ag ratio, 50/200DMA) |
| 18 | Sources footer | gold-api.com (live), COMEX near futures (charts), BLS (inflation), Treasury (yields), Kalshi/Polymarket (Fed) + disclaimer |

Mobile: no overflow at 390px; everything stacks; calculators usable.

## 2. What they do better than Currena (be specific, be honest)

1. **The daily narrative.** Their single best feature. One paragraph that
   *answers the reader's actual question* ("why is gold flat today?
   because real yields and the dollar rose") with mechanism + disclaimer.
   Currena has nothing equivalent.
2. **Assembled macro reading.** They *combine* separate numbers into one
   taught sentence (nominal − expectations → real ≈ 2.9% → cost of
   holding gold). Currena's voters sit next to each other; nobody does
   the arithmetic for the reader.
3. **The correlation lesson.** Stated rolling correlation + the 2022
   central-bank explanation — exactly the honest-nuance content the
   master prompt demands. Rare even in English.
4. **Prediction-market Fed probabilities** (Kalshi/Polymarket) — a
   licence-clean, modern alternative to CME FedWatch, refreshed 30-min,
   with attribution and disclaimers.
5. **Interactivity that serves comprehension**: 20y chart with MA
   overlays + auto-generated "distance from MA" sentences; calculators
   (jewelry, DCA) that convert prices into personal meaning.
6. **Calendar proximity**: next Fed/CPI dates with countdown —
   event-orientation Currena lacks.
7. **Data-gap transparency**: the Oct-2025 shutdown gap explained with
   the interpolation method disclosed.
8. **On-page education + FAQ** with the same no-advice discipline.

## 3. What they do poorly / Currena beats them at

1. **No systematic framework.** The page is a well-written *collection*,
   not a *model*: no lane structure, no range/decile statistics, no
   "conditions" abstraction — today's reading of the same numbers can
   drift with the writer's template.
2. **No governance/backtest.** Nothing like Currena's honest record; the
   "auto-note" is trusted because it reads well, not because it is
   measured.
3. **Depth ceiling on data**: ~10 macro numbers vs Currena's 37 voters;
   no term premium, no stress indexes, no reserve-share metrics, no
   physical-market cards (SGE/Swiss/Shanghai premium).
4. **Charts are thin**: single line + MAs; no ratio/context overlays,
   no percentile framing.
5. **No history beyond 20y chart** and no episodes.
6. **Positioning without percentiles**: COT levels stated with soft
   readings ("mid range") but no statistical range framing.
7. **Persian-only, EN absent** (Currena is fully bilingual).
8. **Commerce-driven layout**: subscription login, contest, stock
   tickers pulling toward their store; the page sells as much as it
   teaches.

## 4. Adopt / Improve / Avoid (for Currena)

**Adopt (concept, not copy):** the daily narrative (→ Idea 1, bound to
the meter); the assembled macro reading (→ yield-decomposition card,
Idea 5); prediction-market Fed probabilities (new data source, licence
check in S4); event calendar (next Fed/CPI with Tehran time); personal
calculators (DCA "if you'd bought" — fits Currena's statistical
identity).

**Improve on their version:** correlation (make it the rolling panel
with regime annotation, Idea 3, vs their one static number); COT
(percentiles + extremes, Idea 9, vs their soft prose); education
(episodes + chain explainers vs their FAQ fragments).

**Avoid:** stock-ticker sprawl (different business); single-writer
template drift (Currena's model governance is the moat); commerce CTAs
on the data surface.

## 5. Head-to-head snapshot (initial; full matrix in S3)

| Dimension | Currena | Saham Analiz | Edge |
|---|---|---|---|
| Analytical model | 37-voter meter, governed, backtested | Narrative template | **Currena** |
| Daily interpretation | None | Auto-narrative | **SA** |
| Macro education | Fragments | Assembled, on-page | **SA** |
| Data breadth | 37 voters + ratios + physical | ~10 factors | **Currena** |
| Statistics/deciles | Everywhere | Rare | **Currena** |
| Charts | Fixed-range sparklines | 20y + MAs + statements | **SA** |
| Fed expectations | Voter (firing) | Kalshi/Polymarket probabilities | **SA** (novel data) |
| Positioning | 2 voters + bars, stale-flagged | Levels + soft readings | ~Even |
| Physical market | SGE/Swiss/Shanghai premium | Absent | **Currena** |
| History/episodes | None | None | — (open field) |
| Calculators | None | Jewelry + DCA | **SA** |
| Bilingual | FA+EN native | FA only | **Currena** |
| Trust infrastructure | Licence wall + backtest record | Source footer + disclaimers | **Currena** |

**Reading:** Currena wins on *infrastructure and rigor*; the competitor
wins on *explanation and immediacy*. The elevation program's thesis is
that the second is buildable on the first — and much harder the other
way around.
