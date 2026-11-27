# AUDIT — the Currena gold page (currena.ir/gold)

First session: 2026-11-27. Repo: github.com/assadigit/Currena (branch `main` @ db71c97a,
working branch `gold-page-additions`). In the sandbox the page is the app's `/` route
(`src/app/page.tsx`); in production it is mounted at `currena.ir/gold` via
`NEXT_PUBLIC_BASE_PATH=/gold`.

---

## 1. Who the page is for, market, currency, language, units

- **Audience**: the average Iranian buyer/saver first (Persian reader), with an
  international English reader served by an optional Iran layer toggle. The page
  was explicitly rebuilt "for the average reader on Currena's own design tokens."
- **Country/market**: Iran (Tehran gold market) + the global USD market.
- **Currencies**: USD (global ounce) and toman (Iran layer; M/bn compact words in
  fa, rial÷10 = toman in data legs).
- **Language/Direction**: bilingual `Locale = "en" | "fa"` with full RTL for fa;
  one-language-per-page law; charts stay LTR in both locales (house convention);
  Persian digits via `faDigits` in fa.
- **Unit conventions**: troy ounce (31.1034768 g), gram, **mesghal = 4.6083 g**
  (× 0.705 pure content = 3.2488515 g), karats عیار (18k = 0.750, 24k = 0.9999),
  Tehran coins: Emami سکه امامی and Bahar Azadi بهار آزادی (8.136 g × 0.900 =
  7.3224 g pure), half نیم، quarter ربع، gram-coin گرمی (1.0111 g ≈ 0.91 g pure);
  Jalali calendar dates in fa (Intl fa-IR-u-ca-persian); Jalali↔Gregorian year
  labels on long histories.

## 2. Design system (new sections must reuse, not restyle)

- Currena tokens in `src/app/globals.css`: `--color-currena-blue(-deep)`,
  `--color-accent-gold(-deep/-strong)`, `--color-bridge-accent` (Iran sections),
  `--color-surface`, `--color-return-up/down`, `--color-currena-bg-light`,
  `--color-currena-soft`, `--cr-radius-md/lg`, type classes `type-kicker`,
  `type-label`, `type-caption`, `type-number-hero`.
- Section card pattern: `<section id="gold-…" class="gold-anchor-mt mt-3 …
  rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 ring-1
  ring-[var(--color-border)] shadow-[var(--cr-shadow-card)] sm:mt-5 sm:p-5">`.
- Sticky chip nav (`NAV_SECTIONS` in page.tsx) with IntersectionObserver scroll-spy;
  chips must match page order.
- Section icons: `PackIcon` renders `public/icons/*.png` at 128px beside the h2.
- Fail-closed pattern everywhere: "·"/unavailable line, never a guess, never a
  spinner forever. Money in `<bdi dir>` per locale. Inputs normalize fa/ar digits.
- Copy discipline: typed bilingual bundles; EN pluralization; Persian ٪;
  disclaimers where a tool touches money ("descriptive, never advice").

## 3. Section-by-section inventory (page order)

| # | Section (id) | What it does |
|---|---|---|
| 0 | Site header + drawer (chrome) | Real currena.ir nav, EN/fa toggle, dark mode, Tools drawer with all 10 tool pages |
| 1 | SectionNav (sticky chips) | 15 anchor chips, scroll-spy; Iran chips (bridge, race, yield) only when the layer shows |
| 2 | Heading block | Breadcrumb, gold-bar icon + «طلا», "data as of {date}" line, EN-only Iran-layer toggle |
| 3 | PriceCard (hero) | Spot USD/oz (observation store), 7d Δ, USD per-gram pill, 5 chips 1D/7D/30D/1Y/5Y, TraceChart, source note, history-echo sentence |
| 4 | BriefingCard (`gold-briefing`) | Market Brief: verdict headline, market paragraph, price-position line, now/outlook boxed rows, all-windows trend table, 5 factor dialogs (real yield, dollar basket, stress, CPI, CFTC) |
| 5 | TeCard (`gold-te-briefing`) | Trading Economics daily briefing, EN verbatim + stored Persian translation, waiting/fetch-failed/alert states, published/fetched stamps |
| 6 | WgcCard | WGC monthly commentary, same bilingual + honesty pattern, Jalali issue month |
| 7 | BalanceCard (`gold-balance`) | The brass see-saw, 5 force lanes, for/against lane chips, counted-record modals (37-seat tally) |
| 8 | ScenariosBand (`gold-scenarios`) | 4 dated scenario cards (FOMC, CPI, NFP, PCE) with why-modals + un-dated-risk disclaimer strip; contains CalendarBand: next events (flag, date in words, impact chip, why-it-matters modal), merged Polymarket expectations |
| 9 | CompareBand (`gold-compare`) | Gold vs silver/BTC/S&P/real-yield indexed chart, 6 windows, bar view, scorecard, correlation lesson behind tap |
| 10 | TaBand (`gold-ta`) | Plain-language 200-day verdict, support/resistance sandwich, pivots, golden/death crosses, Fibonacci behind modal, concept facts |
| 11 | CentralBanksBand (`gold-cb`) | CB demand chart + buyers/sellers tables, method notes |
| 12 | PositionsBand (`gold-positions`) | CFTC net-positioning thermometer, crowding note, gross-long share |
| 13 | DashboardBand (`gold-dashboard`) | Real yield + DXY + breakeven trio (FRED-stamped), rest indicators modal, ratios table with decile bands, currency grid (5 crosses + live toman), LBMA forecast retrospective |
| 14 | BridgeBand (`gold-bridge`, Iran) | Live Tehran board (ounce USD + all coins/weights in toman + حباب % each), premium history spark, coin budget machine (currency → Emami count + melt compare), 5-step parity ladder + method behind collapsible |
| 15 | DollarTrendBand (`gold-dollar-trend`, Iran) | 47-year gold-vs-dollar race since ۱۳۵۷: verdict chip, sync/diverge years, log chart, era chips, year table, decoupling table, growth decomposition donut, premium arc, method/sources |
| 16 | RaceYieldBand (`gold-race-yield`, Iran) | «طلا یا دلار؟» — toman sum, any year since ۱۳۵۷, grams vs dollars, both re-marked today |
| 17 | CalculatorBand (`gold-calculator`) | If-you'd-bought table (7D→5Y), wealth calculator (lump/DCA, 4 assets, 12 units incl. toman/grams), advanced leg: any past day's price + meter reading + assets head-to-head |
| 18 | PhysicalBand (`gold-other`) | Physical-market verdict (Shanghai premium etc.), London vault + clearing behind collapsible |
| 19 | RelationshipsBand (`gold-relationships`) | 25-record six-family force map, collapsed by default |
| 20 | HistoryBand (`gold-history`) | LongViewCard (1833 chart, 20y table + CAGR, multi-currency purchasing-power machine) + behind tap: 9-episode timeline + 90-bar if-you'd-bought chart |
| 21 | Footer (chrome, sticky) | "Made by Ali Assadi", Privacy/Terms/Contact links |

Unmounted legacy in repo (not part of the page): `components/gold/*` (the old
English-only AURUM desk), `gold-page/ifbought.tsx`, `gold-page/timemachine.tsx`.

## 4. Data sources (live)

| Source | Feeds | Cadence |
|---|---|---|
| EODHD (token in Worker secret) | observation store: XAUUSD, XAGUSD, DXY components, SPY, USO | once per UTC day, pull-on-render |
| FRED public CSV | DFII10, DGS10 (real/nominal yield), compare-leg real yield | request-driven |
| Yahoo public chart API | COMEX GC=F (1D/5Y/any-day), SI=F, BTC-USD, ^GSPC, 11 FX crosses | 30–90 s memory caches |
| TGJU | free-market dollar, geram18 (dollar-trend + fx legs) | request-driven, 5-min cache |
| currena.ir upstream (`/api/rates`, `/api/insights/*`) | Tehran board snapshot, OHLC, CB, LBMA vault, premium history, expectations, ifbought, meter, positions, projection/crosses | fetchLeg proxy, 5-min cache, 503 fail-closed |
| TE watch worker → D1 | Trading Economics daily briefing (+ Persian) | cron 05:00/16:00 UTC |
| WGC watch worker → D1 | WGC monthly commentary (+ Persian) | cron days 1–25 of month |
| Static cited tables | DOLLAR_FREE_TABLE ۱۳۵۷–۱۳۹۰, GOLD_ANNUAL 1833–2025, LBMA forecast series | embedded, validated vs LBMA |

## 5. Checklist evaluation

1. **Price now — HAVE.** Spot USD + per-gram + all windows table + 1D–5Y chart +
   "data as of" + per-section stamps; toman per-gram/ounce in the Iran layer.
   *Note (existing, not mine to fix): the hero spot rides the EODHD store (once-a-day
   gate; rate-limited days serve the last sync honestly) while the Tehran board's
   own ounce row is TGJU-live — two honestly-stamped sources can differ by a few
   days inside one view.*
2. **Local market view — HAVE.** Karats 18k/24k rows, full coin family with weights,
   premium حباب % per instrument + history + decomposition, melt-value comparison,
   5-step parity ladder in plain words. *Buy/sell spread: the board shows one market
   price + day high/low; no dealer spread — needs approval to change existing board.*
3. **Simple calculators — PARTIAL.** On-page: coin budget machine, wealth
   calculator (12 units), race-yield, purchasing-power machine. The full unit/karat
   converters and jewelry price estimator (weight × karat + اجرت/سود/VAT 7/7/9)
   exist at `/tools/gold-calculators` — but the gold page body has **zero in-content
   links to any tool** (header drawer only). Missing on-page: ounce↔gram↔mesghal
   converter.
4. **Key price drivers — HAVE.** Five forces (borrowing costs, dollar, stress,
   inflation, flows) with 37 seats each carrying a plain one-sentence mechanism +
   current reading + arrows; dashboard trio; central-bank section. **ETF holdings:
   MISSING — blocked** (R-26 licensing, legend-only by design).
5. **"Gold in 30 seconds" — HAVE (Market Brief + TE daily card + trend table), but
   static-authored** (hand-updated per batch, not date-stamped) and its disclaimer
   lives on scenarios/calculator, not on the brief itself.
6. **Long-term perspective — HAVE.** 20y table + CAGR (USD), 1833 chart,
   if-you'd-bought (4 assets), 47y toman race, decomposition. **All-time high and
   distance from it: MISSING.** Inflation comparison on-page: only the "real gold
   price" ratio card (the full CPI comparison lives on the compound-wealth tool).
7. **Buying guide — MISSING (the biggest gap).** No ways-to-own rundown (سکه/شمش,
   jewelry, gold funds, digital), no purity-check education, no storage/scam
   education, no buy-side fee explainer (the حباب concept exists but is not framed
   as a buyer's checklist). Tax basics: the tools' own invoice convention (VAT on
   اجرت+سود) exists only off-page.
8. **Why people hold gold — PARTIAL.** Episodes + relationship map educate by
   example; no plain "role in a portfolio / how much do people commonly allocate"
   education block.
9. **Upcoming events — HAVE.** Calendar with why-it-matters modals, fixed FOMC dates
   + rule-computed releases, impact chips.
10. **Why did gold move today — HAVE.** TE daily briefing (+ Persian), trend table,
    history echo, Market Brief.
11. **Gold vs silver — HAVE.** Compare band + gold/silver ratio card with one-line
    meaning.
12. **FAQ and mini glossary — MISSING.** No beginner FAQ, no user-facing glossary
    (fa-glossary.ts is an internal translation pass). TA terms have concept facts,
    but بازار terms (حباب, عیار, مثقال, اجرت…) are only explained inside scattered
    sections.
13. **Trust — PARTIAL.** Many sections name sources + asOf; fail-closed states are
    exemplary. Missing: one page-level "sources & methodology" block and a clear
    page-level not-financial-advice disclaimer (site footer carries none).
14. **Experience — PARTIAL.** Mobile-first, scannable, fast. **Sharing: MISSING**
    (no share/copy affordance). Price alerts: no visitor notification channel exists
    in the project (watch rules are owner-only) — dropped, would need new infra.

## 6. Gaps kept (prioritized)

| Gap | Checklist | Importance | Effort | Risk | Value for the visitor |
|---|---|---|---|---|---|
| Beginner FAQ + mini glossary (bilingual) | 12 | Must | small–medium | none (static, new files) | plain answers to the questions this page's own vocabulary raises |
| Sources & honesty band (named sources, methodology, page-level disclaimer, share) | 13, 14 | Must | small | none (static, reuses audit facts) | trust at a glance; one honest disclaimer |
| Buying guide for Iran (ways to own, purity, fees, storage, scams) | 7 | Must | medium–large | none (static education; tax only via the site's own invoice convention) | the #1 missing education for a first-time buyer |
| "Gold in 30 seconds" + record watch (ATH + distance) | 5, 6 | Should | medium | low (rides existing trend API + store) | one dated plain-language read + the record context |
| Why people hold gold (portfolio role, common allocations) | 8 | Should | small | none (static education) | frames the whole page for a saver |
| In-content tools links strip (calculators, converter, live rates) | 3, 14 | Should | tiny | none (links to existing routes) | the jewelry estimator and karat converter become discoverable |
| Share buttons | 14 | Nice | tiny | none (navigator.share + clipboard) | one-tap sharing of the page |
| Buy/sell spread on Tehran board | 2 | Needs approval | medium | edits existing bridge board | dealer spread visibility |
| ETF holdings driver | 4 | BLOCKED (licensing) | — | — | R-26 deliberately blocked upstream |
| Price alerts | 14 | Dropped | large | new infra (email/telegram) | no visitor channel exists today |
| Hero vs Tehran-board ounce staleness | 1 | Needs approval (existing design) | — | — | both are stamped; unifying would change existing code |

Dropped as not-missed-by-the-average-buyer: a dedicated technical-analysis
glossary (already translated into plain verdicts); more pro positioning stats.
