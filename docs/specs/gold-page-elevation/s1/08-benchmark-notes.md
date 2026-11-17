> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/08 — Benchmark Notes: International & Persian Gold Platforms

*Consolidated from two parallel research tasks (institutional: WGC
Goldhub, LBMA, CME; retail: Kitco, Trading Economics, Investing.com,
goldprice.org, TGJU, Persian news sites), each examined live on
16–17 Nov 2026 with rendered-browser or curl fallback and explicit
access notes. Deep dives with more source links = S4.*

## 1. World Gold Council — Goldhub (gold.org) — the reference institution

- **Data hub in 4 categories:** Price & Premiums (incl. **local
  premium/discount for India & China vs USD price**), Performance
  Metrics (returns, vol, **correlation matrix**, volumes), Demand &
  Supply (quarterly demand by 5 segments, supply by 3, ETF flows for
  100+ funds, **AISC cost curves**, COT positioning, above-ground
  stock), Central Banks (reserves by country, monthly purchases).
- **GRAM — Gold Return Attribution Model:** decomposes gold returns
  monthly into buckets: *Economic Expansion · Risk & Uncertainty ·
  Opportunity Cost (FX) · Opportunity Cost (Rates) · Momentum* — with
  published methodology. This is the intellectual template for
  Currena's five lanes (and for Idea 1's narrative).
- **Standardized data disclosure** on every dataset: length/frequency,
  update schedule, units, methodology, sources. The discipline Currena's
  `docs/SOURCES.md` already mirrors.
- **Dual-depth architecture:** Goldhub (professional) vs invest.gold
  (retail, simplified). Validates Currena's Core/Supporting/Advanced
  tiering plan.
- **Licence note:** LBMA historical price data was *removed* from
  Goldhub at ICE's request (2025) — licensing is real and enforced;
  Currena's L3 fail-closed wall is the correct posture.

## 2. LBMA (lbma.org.uk) — market plumbing & free institutional data

- Gold auction price **2× daily, free with midnight delay**; real-time
  and historical require IBA licence.
- **London vault data monthly** (Oct 2026: 9,850t gold, ~788k bars) —
  free, licence-clean, a genuine institutional-stock indicator.
- **Clearing volumes monthly; gold/silver ratio** included.
- **Annual analyst forecast survey + accuracy retrospective** (2025
  gold: consensus $2,735 vs actual $3,431 — a memorable honesty device).
- Takeaway for Currena: vault-holdings card + a "market plumbing"
  education track are cheap and credible additions (S4 verifies the
  licence text precisely).

## 3. CME Group — inaccessible, and that is the finding

IP-blocked (HTTP 403 anti-scraping) to both browser and curl from this
environment; no Wayback fallback. Verified only their *stance*: website
data treated as licensed commercial data. **Implication:** any
CME-derived feature (settlements, volume/OI, FedWatch) must come via
licensed redistributors or free public alternatives — prediction markets
(Kalshi/Polymarket, as the competitor uses) are the licence-clean
Fed-probability route; CFTC's own CoT CSVs are public domain for
positioning.

## 4. Kitco — the education benchmark

- **"What Moves the Gold Price" — 5 named drivers** (real rates/Fed,
  inflation/debasement, USD, CB buying, safe-haven/ETF flows) bound
  next to the live chart — the exact explainer pattern Currena lacks
  (G4).
- **KGX** — a dollar-influence-stripped gold index ("did gold really
  rise, or was it the dollar?") — the conceptual ancestor of Currena's
  multi-currency grid and the Iran-bridge decomposition.
- Unit-aware quote header (bid/ask, day range, 30d/1y change, session
  open/closed state), karat calculators, global session hubs
  (HK/Mumbai/London/NY), data journalism ("gold vs presidents since
  1971").
- Cautionary tale: 10-item nav sprawl + dealer CTAs — depth *with*
  clutter.

## 5. Trading Economics — the narrative+macro-cross-link pattern

- Gold page = chart + **daily summary paragraph explaining the move via
  named macro causes** (hawkish Fed rhetoric, 19-month dollar high,
  December hike odds) — the same narrative idea as the competitor's,
  at larger scale.
- **Forecasts as headline data** (Q4 3,834 / 12M 3,532, "global macro
  models") — Currena should NOT copy the authority claim (unverifiable
  models); if forecasts ever appear, label methodology honestly or not
  at all.
- Related-indicator cross-linking (gold ↔ reserves ↔ inflation ↔
  rates) — Currena's voter→indicator-page links already do this better.

## 6. Investing.com / goldprice.org — access-blocked / chart-utilitarian

- Investing.com fully blocked (Cloudflare 403) — could not verify its
  TA panel firsthand; indirect evidence (TGJU analyses citing its MA/
  oscillator/pivot summaries, incl. RSI-14 45.6, classic pivots)
  confirms the pattern exists and that **Iranian analysts hand-copy it
  into Persian** — a productization gap (parked per S1/05 §7).
- goldprice.org: TradingView embed, 160 currencies, holdings calculator
  (purchase-price P&L what-if — the DCA calculator's sibling), but
  **machine-translated Persian with no IRR** — the anti-pattern
  validation for "few currencies, interpreted, bilingual-native".

## 7. TGJU — the Persian incumbent

- The de-facto Iranian price terminal: every local instrument (مثقال،
  ۱۸ عیار، آبشده، سکه‌ها + حباب per coin), global ounce, funds
  (عیار، لوتوس…), EMA/SMA tables (5→200d), **pivot tables in 5
  methods**, user-contributed analyses, 25s auto-refresh, Jalali dates.
- Its global-ounce coverage is **quote-only** — no real yields, no
  drivers, no decomposition; everything-terminal sprawl + heavy ads.
- Confirms the market's *habits* (coin premium tracking, MA tables,
  comparators) and its *gap* (interpretation).

## 8. Persian news sites (eghtesadonline, tejaratnews)

- Gold prices as *articles* — daily snapshot tables with update stamps,
  charts inside articles, prediction op-eds; tejaratnews prices in
  toman (TGJU in rial) — the rial/toman duality is unaddressed market-
  wide. No data-product thinking.

## 9. The Persian-market gap map (what nobody owns)

1. **Global-macro ↔ local-price integration** — no Persian page shows
   global drivers and local decomposition as one coherent story. The
   single clearest ownable position (Ideas 1+8).
2. **Persian-native structured analysis** — TGJU has MA/pivot tables;
   nobody has a governed conditions model (Currena already owns this).
3. **Bilingual credibility** — nobody is genuinely FA+EN native.
4. **Interpreted multi-currency gold** — nobody shows gold in EUR/JPY/
   CNY with meaning.
5. **History & episodes** — nobody in Persian.
6. **Data-honesty infrastructure** — nobody discloses licences, gaps,
   backtests (Currena already owns this).

## 10. Top-10 adoptable concepts (merged, ranked for Currena)

| # | Concept (source) | Maps to |
|---|---|---|
| 1 | GRAM driver taxonomy + attribution narrative (WGC) | Idea 1; lanes already mirror it |
| 2 | Daily move narrative with named macro causes (TE, SA) | Idea 1 |
| 3 | "What moves gold" 5-driver on-page explainer (Kitco) | G4 education layer |
| 4 | Quarterly demand stack visualization (WGC) | Chain 4; behind WGC letter |
| 5 | Data-disclosure block per dataset (WGC/LBMA) | Already Currena's culture; formalize on-page |
| 6 | Local premium/discount concept — Tehran edition (WGC India/China) | Idea 8 |
| 7 | Session-state honesty + unit-aware header (Kitco) | Small upgrades |
| 8 | DCA / holdings calculator (TGJU, goldprice.org) | Adopt in Currena's statistical voice |
| 9 | LBMA vault/clearing monthly cards (LBMA) | Cheap institutional depth |
| 10 | Forecast-survey + accuracy retrospective (LBMA) | Advanced/editorial, later phases |
