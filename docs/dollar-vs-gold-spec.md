# The Dollar-vs-Gold Trend — `روند نرخ طلا در برابر دلار` — the spec

**Status:** proposed (this document is the build contract for the next session · 2026-11-25)
**Owner's ask, verbatim:** *"a new section called روند نرخ طلا در برابر دلار in it, we compare price points of gold against usd dollar from 1979 till today, so we get to find out in which points of history/years, which asset yielded more profit and how their prices was more in sync and when was the most diversion."*
**Owner's framing, verbatim:** *"IN iran, gold's price (per gram) is not usually same with the global market, because the central bank and forces of domestic market, change it's value against dollar consistently, for example gold is everywhere down, but up in iran, because of manipulating of price and rampant inflation which causes everything to go up regardless of it's natural price movement in the global scene."*
**Evergreen law, verbatim (the owner's note):** *"We once fetch prices of gold / dollar from 1979, but to make the data every green we need a source to update the dollar/gold price every year, which we use tgju itself (we already have the data)."*

---

## 0. The one-sentence product

One section that shows, from the revolution (۱۳۵۷ / 1978-79) to today, **the race between holding gold and holding dollars in Iran** — both marked in toman — and the **decoupling story**: the years global gold fell while Iranian gold rose, because the rial fell faster than the world's gold.

## 1. The concept and the seat

The reader sits **in Tehran**. In ۱۳۵۷ they had a choice: **one gram of gold** or **one US dollar** (held as cash). Every year since, both are re-marked **in toman at the free-market rate's own terms**:

- **The dollar leg** = the free-market dollar rate itself (toman per USD). Holding $1 yields exactly the rate's move.
- **The gold leg** = the gold gram's toman price — which is `global gold (USD) × free dollar (toman/USD) ÷ 31.1034768` at parity, plus the domestic market's own premium (حباب) where the real market exists.

This makes the owner's mechanism visible by construction: Iranian gold's toman return ≈ **the rial's fall × the world's gold move × the domestic premium**. When the first factor dominates, gold rises in Iran even as it falls globally.

**The three-layer honesty (each labelled at point of use):**

| Era | Dollar (toman/USD) | Gold (toman/gram, 18k) | Basis label |
|---|---|---|---|
| ۱۳۵۷ → ۱۳۹۰/۱ (1978→2011-11) | embedded static table (cited) | **parity-derived** from the embedded global-gold annual × the dollar table | «برآورد تاریخی/برابری» — "historical / parity estimate" |
| 2011-11 → 2013-06 (TGJU dollar only) | TGJU `price_dollar_rl` actuals | parity-derived (same formula, TGJU dollar leg) | mixed, named |
| 2013-07 → today | TGJU `price_dollar_rl` actuals | **TGJU `geram18` actual market price** | «بازار تهران» — the real market |
| The running year | TGJU's latest row | TGJU's latest row (cross-checked against the live board) | «زنده» — live |

Where both exist (the ۱۳۹۰ overlap, 2011-11→2012-03), **the live source (TGJU) wins over the static table** — the house's live-over-backfill rule, stated in the method line.

## 2. The data plane (all verified this session, 2026-11-25)

### 2.1 Series A — global gold, USD per ounce (CLOSED past + live)

**Reuse `GOLD_ANNUAL` verbatim** (`src/lib/gold-page/longview.ts`): annual London averages 1833→, validated within 1% against LBMA post-1968 (1979 = $306.75, 1980 = $612.51…). Only the 1979+ slice is used. The **running year never comes from the embed** — it rides the page's live spot (the long-view convention), so the desk and this section never disagree.

### 2.2 Series B — the free-market dollar, toman per USD

**B1. The static table, ۱۳۵۷→۱۳۹۰** — extracted and verified this session from the Persian Wikipedia table «نوسان نرخ ارزهای خارجی در ایران» (https://fa.wikipedia.org/wiki/نوسان_نرخ_ارزهای_خارجی_در_ایران, accessed 2026-11-25; the page carries its own footnotes — jamaran's "نرخ غیررسمی دلار از سال ۵۷ تاکنون" corroborates the orders: the free dollar went from ~۷-۱۰ toman in ۱۳۵۷ to ~۳۱,۰۰۰ in ۱۳۹۹, ≈×1,145 over 42 years). Values are the free-market («آزاد») rate, **toman per USD, one figure per Jalali year** (the table's own year-level convention; official «رسمی» rate kept for the method note, never drawn):

```
1357:10,  1358:14,  1359:20,  1360:27,  1361:35,  1362:45,  1363:58,
1364:61,  1365:74,  1366:99,  1367:96,  1368:120, 1369:141, 1370:142,
1371:149, 1372:180, 1373:263, 1374:403, 1375:444, 1376:478, 1377:646,
1378:863, 1379:813, 1380:792, 1381:799, 1382:832, 1383:874, 1384:904,
1385:922, 1386:935, 1387:966, 1388:1000, 1389:1100, 1390:1980
```

Embed as a typed module (`src/lib/gold-page/dollar-trend.ts`) with the citation as a doc comment. Cross-check discipline before shipping: spot-verify ≥4 rows against a second source (jamaran / iromart) and record the checks in the PR text; any disagreement ≥10% gets named in the method line, never silently smoothed.

**B2. The evergreen leg** — **TGJU `price_dollar_rl`** daily rows, 2011-11-26 (۱۳۹۰-۰۹-۰۵) → today, fetched through the **proven pattern already in the repo** (`src/app/api/gold/fx/route.ts`): `https://api.tgju.org/v1/market/indicator/summary-table-data/price_dollar_rl?lang=fa&formated=1&responseType=full`, quotes are RIAL → ÷10 = toman, month-ends/year-ends pivoted from the daily rows, memory-cached, fail-closed. Verified live this session: 4,012 daily rows, 2011-11→2026-11, newest 2,787,000 rial (۲۷۸,۷۰۰ toman).

### 2.3 Series C — Iranian gold, toman per gram (18 عیار)

**C1. TGJU `geram18`** — verified live this session: daily rows 2013-07-22 → today (3,564 rows), RIAL per gram ÷10 = toman (newest: 240,888,000 rial = ۲۴,۰۸۸,۸۰۰ toman/gram). Same fetch pattern as B2.

**C2. The parity derivation, ۱۳۵۷→geram18's start** (and only there):

```
goldToman18k(year) = GOLD_ANNUAL(year) × dollarFree(year) / 31.1034768 × 0.75
```

(0.75 = 18/24 purity; 31.1034768 = grams per troy ounce — both already house constants). Labelled «برآورد برابری» at point of use — the same equation the Iran bridge teaches as ارزش ذاتی, so the section and the bridge agree by construction. **Never presented as a market price.**

### 2.4 The evergreen answer (the owner's own note, discharged)

Nothing in this section needs a yearly manual update:

- ۱۳۵۷→۱۳۹۰ static tables = closed past, immutable;
- 2011-11→today = TGJU, re-fetched per request (5-min cache), self-extending every day;
- the running year's global gold = the page's live spot;
- GOLD_ANNUAL's embed is only read up to 2013 — no new-year maintenance for this feature.

## 3. The wire contract — `GET /api/gold/dollar-trend`

Server-side only, `dynamic = "force-dynamic"`, memory-cached 5 min, **fail-closed per leg** (a TGJU leg that fails is absent, never zero — the static layer always renders, the live tail shows its honest line):

```ts
interface DollarTrendPayload {
  v: 1;
  asOf: string;                    // TGJU's newest row date
  // year-end values per Jalali year, toman — the static layer merged with TGJU
  dollar:  Array<{ jy: number; toman: number; basis: "static" | "tgju" }>;
  gold18:  Array<{ jy: number; toman: number; basis: "parity" | "tgju" }>;
  goldUsd: Array<{ jy: number; usdOz: number }>;   // the global context line (GOLD_ANNUAL slice + live running year)
  running: { jy: number; dollarToman: number | null; gold18Toman: number | null; goldUsdOz: number | null; live: true };
}
```

The pivot: for each Jalali year, the **last TGJU row dated before the next Farvardin 1** (Jalali boundaries ≈ March 20/21; compute via the known leap rule or the simple March-21 approximation — the last-row-before-boundary rule makes off-by-one days harmless). The running year = the newest row, flagged `live`.

## 4. The pure engine — `src/lib/gold-page/dollar-trend.ts`

Pure arithmetic over the payload, computed **client-side** (the if-bought pattern: the route serves data, never results):

1. **The race** — `race(startJy)`: gold multiple vs dollar multiple from any start year (default ۱۳۵۷), both toman: `now/start`. Verdict line: «از ۱۳۵۷: طلا ×{g} در برابر دلار ×{d} — طلا {ratio}× برنده».
2. **The year-by-year winners** — per Jalali year: gold's annual return, dollar's annual return, the winner, and the global gold (USD) return as the third column — the reader sees *why* (rial vs world).
3. **The decoupling list** (the owner's story, the section's signature): every year where **global gold fell (USD, < 0) while Iranian gold rose (toman, > 0)** — each row: the year, global gold's fall, Iranian gold's rise, the dollar's own rise (the cause). Expected canon (the engine must COMPUTE these, never hardcode): ۱۳۹۱-۹۲ (sanctions, rial collapse), ۱۳۹۶ (global gold's 2017 flat-to-down patches), ۱۳۹۷ (US JCPOA exit), ۱۴۰۰-۰۱ (2021-22), ۱۴۰۳-۰۴ (2024-25).
4. **The sync score** — (a) same-direction years count («در {n} سال از {m}، هر دو با هم بالا رفتند»); (b) rolling 5-year correlation of the two annual-return series, drawn as a thin strip with the max-sync and max-divergence windows NAMED («بیشترین هم‌حرکتی: {years} — بیشترین واگرایی: {years}»).
5. **The premium arc** (TGJU era only): `geram18 actual ÷ parity` per year — the حباب's long arc, one line + the current value cross-checked against the bridge board's own premium (the two must agree within rounding; the bridge stays the live authority).

## 5. The UI — `DollarTrendBand` (`src/components/gold-page/dollar-trend.tsx`)

**Placement: a new top-level section immediately after the Iran bridge (پل ایران), before the calculator** — the reader who just learned the حباب decomposition gets the 47-year payoff. `id="gold-dollar-trend"`, registered in the page's nav. (Alternative considered: beside «طلا در دو سده» at the foot — rejected: this is an Iran story, not a world story.)

Zones (one card, the house grammar — tokens only, LTR root, RTL content in fa, `overflow-x-auto` wrappers, no fixed px):

1. **Header + the headline verdict chip**: «روند نرخ طلا در برابر دلار» / "Gold against the dollar" + the since-۱۳۵۷ verdict (zone 4.1's race output).
2. **The chart** (bespoke stretched SVG, the long-view grammar): two lines **indexed to 100 at the start year** — gold (gold token) vs dollar (the currena-blue family) — **log Y by default** (47 years, multiples in the tens of thousands — linear would be a cliff); a thin third line: global gold in USD, indexed too, so the "everywhere down" years show as the context line dipping while the gold-toman line climbs. The start-year picker (۱۳۵۷ → the last year, default ۱۳۵۷). Era seams as quiet dashed verticals at the rial-collapse years (۱۳۹۱, ۱۳۹۷, ۱۴۰۰) + the basis seams (۲۰۱۱ TGJU / ۲۰۱۳ geram18). Hover trace = the year's three values + the winner word. On-chart line labels, never a legend-only chart.
3. **The race table**: one row per Jalali year — سال | طلا (تومان) | دلار (تومان) | طلا جهانی (دلار) | برنده. Winner chip in the winner's token at low emphasis (the batch-L noise law: no loud red/green walls — the WINNER word carries it, ink stays quiet). The table rides an expand from ~the last 10 years open (the full 47 behind the tap), with the computed summary line always visible.
4. **The decoupling list** — the signature: «در جهان پایین، در ایران بالا» — the years gold fell globally but rose in Iran, each with its three numbers. If a year's cause needs words, the copy carries the event's name in the row (سانکشن‌ها، خروج آمریکا از برجام…) — only as the historical label, never as an unverified causal claim beyond the numbers shown.
5. **The sync verdict words + the rolling strip** (4.4).
6. **The method + sources line** (11px, tertiary): the three bases named (تاریخی/برابری/بازار تهران), the live-over-static rule, the two citations (Wikipedia fa table + TGJU + the GOLD_ANNUAL provenance), the fail-closed statement.

**Locale law (batch-L hardened):** fa = Persian digits everywhere (`fmt.num` / `faDigits`), Jalali years on the fa axis (۱۳۵۷…), Gregorian on the EN axis (1978…) with the "Jalali years run March→March" note; EN money in USD/large toman via the existing M/bn toman convention; every window named at point of use; display-only, never advice.

**Honest states:** TGJU leg down → the static layer + the honest unavailable line («دمِ زنده خوانده نشد — بخش تاریخی باقی است»), the live tail of each line simply absent (never frozen-at-zero); payload empty → the card's own unavailable line; the parity era always labelled.

## 6. Copy blocks (content.ts, `t.dollarTrend`, EN + fa)

Full bilingual block: eyebrow, title («روند نرخ طلا در برابر دلار» / "Gold against the dollar"), subtitle (the owner's framing in the site's voice — «طلا در ایران همیشه با جهان یکی نیست؛ دلارِ آزاد و حبابِ بازار داخلی، قیمتش را از مسیر جهانی خارج می‌کنند — این جدول ۴۷ سالِ این دو دارایی در برابر هم است.»), chartAria, startLabel («از سال»), the race/verdict/decoupling/sync templates, the table column heads, the method + sources lines, the honest states. Persian numerals in every fa string (the batch-L law).

## 7. Tests + verification checklist

- Engine tests: the pivot (year-end boundaries), the parity math (3 spot years recomputed by hand in the test), the race, the winners, the decoupling detector (fixture with a known global-down/iran-up year), the rolling correlation, the premium arc, the basis seams, TGJU-wins-overlap.
- Route tests: fail-closed per leg, the 5-min cache, the payload shape.
- Component tests: the honest states, the log-axis default, the picker.
- Browser verification (the house bar): fa + EN, the verdict chip's numbers recomputed against the served payload, the premium arc vs the bridge board (must agree), 375px scrollWidth 375, zero console errors, lint green; then build → deploy → live-verify on currena.ir/gold.

## 8. Open questions (the defaults the next session builds unless the owner overrides)

1. **The gold instrument**: ۱۸-عیار gram, `geram18` (default — the owner said "per gram") — vs the Emami coin (`sekee`, starts 2010) vs pure-ounce parity all the way.
2. **The pre-2013 gold series**: parity-derived, labelled (default) — vs hunting a cited historical Iranian gold-price table.
3. **The chart lines**: gold-toman + dollar-toman indexed + global-gold-USD context (default) — vs dropping the context line.
4. **Granularity**: one point per Jalali year, running year live (default) — vs monthly for the TGJU era.
5. **Placement**: after the Iran bridge (default) — vs the page's foot.
6. **The start year**: ۱۳۵۷ fixed as the default with the picker (default — "from 1979" in the owner's words = the revolution window).
