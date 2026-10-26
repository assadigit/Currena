# Insights Data Spec — approved additions (2026-10-26)

Companion to `INSIGHTS_GAP_AUDIT.md` (same session, AUDIT_ONLY). Every source below was probed live this session; the verified URL, the latest observation at probe time, and the licence finding are recorded per item. All additions follow the existing engineering rules: zod-validated loud parsing (an upstream layout change fails closed, never renders garbage), bilingual copy through the i18n dictionary with RTL-native logical properties, Persian digits and Jalali fetch stamps on the fa locale, attribution on every card, and no new KV keys (all additions extend the existing consolidated `insights:snapshot` family).

**Approved additions: A-1 … A-10.** Rejected proposals and their evidence live in the audit §3; they are not repeated here except where a rejected source is named as a cross-check.

| id | English name | Farsi name | gauge | cadence | rung |
|---|---|---|---|---|---|
| `yield-curve-10y3m` | US 10-year minus 3-month yield | انحنای منحنی بهرهٔ آمریکا (۱۰ ساله منهای ۳ ماهه) | borrowing-costs (global) | daily | 04:10 |
| `jgb-10y` (upgrade) | Japan 10-year government bond yield | بازده اوراق ۱۰ ساله ژاپن | borrowing-costs (global) | daily | 04:25 |
| `us-japan-10y-gap` | US−Japan 10-year yield gap | شکاف بازده ۱۰ سالهٔ آمریکا و ژاپن | dollar-strength (global) | daily (derived) | 04:25 |
| `gold-oil-ratio` | Gold measured in oil | نسبت طلا به نفت | prices-heat (global), context | daily (derived) | 04:25 |
| `rba-fed-gap` | RBA−Fed policy rate gap | شکاف نرخ بهرهٔ استرالیا و آمریکا | trade & currency (Australia) | daily (derived) | 04:25 |
| `eia-crude-stocks` | US crude oil inventories | موجودی نفت خام آمریکا | prices-heat (global), context | weekly | Sat 04:25 |
| `cftc-gold-positioning` | Trader positioning in gold (COT) | پوزیشن معامله‌گران طلا (COT) | market-stress (global) | weekly | Sat 04:25 |
| `oecd-cli-us` (+ CN, EA) | OECD leading indicator | شاخص پیشرو ترکیبی OECD | growth-health (global) | monthly | 1st-of-month 04:25 |
| `gpr-index` | Geopolitical Risk Index | شاخص ریسک ژئوپلیتیک | market-stress (global), context | monthly | 1st-of-month 04:25 |
| `epu-us` | US Economic Policy Uncertainty | شاخص عدم قطعیت سیاست اقتصادی آمریکا | growth-health (global), context | monthly | 1st-of-month 04:25 |

---

## A-1 `yield-curve-10y3m` — US 10-year minus 3-month yield

- **Source:** `https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y3M` (series page `https://fred.stlouisfed.org/series/T10Y3M`). Verified live: **0.78 @ 2026-10-23**. Keyless; rides the existing FRED bundle (T10Y2Y is already fetched in the same group), so no new subrequest.
- **Refresh:** daily with the 04:10 rung; `maxAgeDays` 4 (same as T10Y2Y); weekend guard as the other daily FRED series.
- **KV plan:** one new row in `insights:snapshot`; history key `insights:hist:yield-curve-10y3m` on change-detection (best-effort).
- **Everyday meaning (EN):** "When short-term rates top long-term rates, banks earn less on lending and the US economy has usually slowed within 6 to 24 months — a cue to be careful with big purchases and new debts."
- **Everyday meaning (FA):** «وقتی بهرهٔ کوتاه‌مدت از بهرهٔ بلندمدت بالاتر برود، سود بانک‌ها از وام‌دهی کم می‌شود و به‌طور تاریخی ظرف ۶ تا ۲۴ ماه بعدش اقتصاد آمریکا کند شده است؛ نشانه‌ای برای محتاط‌تر شدن در خریدهای بزرگ و بدهی‌های جدید.»
- **Needs attention:** below 0 (inverted). Reasoning: an inverted 10y−3m preceded every modern US recession, with 6–24 months of lead; the Fed itself watches this leg.
- **Unusual:** below −0.50 (deep inversion; historically the zone that made the Sahm rule fire later) or a 4-week rise of more than +1.00 pt immediately after a long inversion (the historic end-of-cycle steepening, which has often coincided with the onset of recessions).
- **Feeds:** the borrowing-costs gauge beside `yield-curve-10y2y` (0.31 today), and pairs on the page with `recession-probability` (62%) and `sahm-rule`.

## A-2 `jgb-10y` upgrade — Japan 10-year government bond yield (daily)

- **Source:** `https://www.mof.go.jp/english/jgbs/reference/interest_rate/jgbcme.csv` — Japan Ministry of Finance, verified live, keyless. Latest row **2026/10/22** with the 10-year at **2.914** (15 maturity columns, 1y…40y; the 10th yield column is the 10y). The parser must assert the header row (it names each maturity, "1年…40年" in the header block) rather than trust column indices.
- **Refresh:** daily on the 04:25 rung (MOF publishes next business day); `maxAgeDays` 4. Keep the OECD mirror (IRLTLT01JPM156N) as a labelled fallback for MOF outages; retire it after two clean weeks, per the repo's fix-or-retire discipline.
- **KV plan:** replaces the mirror's row in `insights:snapshot` (same id, better data); history key unchanged and grows backward-compatible (the mirror's monthly history stays as the tail).
- **Everyday (EN):** "What Japan pays to borrow for ten years: the anchor of one of the world's biggest saver economies, and the other half of the yen carry trade."
- **Everyday (FA):** «ژاپن برای قرض‌گرفتنِ ده‌ساله چقدر می‌پردازد؛ این عدد لنگر یکی از بزرگ‌ترین اقتصادهای پس‌انداز دنیاست و نیمهٔ دیگر «کری ترید ین» به شمار می‌رود.»
- **Needs attention:** above 2.50 (a level unseen for Japan in three decades; signals global long-end pressure and BoJ normalization risk) or a 30-day rise of more than +0.40 pt.
- **Unusual:** below 0.50 (return to the old-world floor) or a 5-day move of ±0.30 pt (a JGB tantrum; historically forces margin calls in global rates).
- **Feeds:** borrowing-costs context row (as today), and the new `us-japan-10y-gap` (A-3).

## A-3 `us-japan-10y-gap` — US−Japan 10-year yield gap

- **Source:** derived in the runner: `DGS10 − jgb-10y(MOF)`. Both components verified live (4.96 @ Oct 22 vs 2.914 @ Oct 22 → gap ≈ +2.05 today). Zero new fetches.
- **Refresh:** daily on the 04:25 rung after both parents land; `maxAgeDays` 5. Fail closed: absent parents render "Can't tell", never a stale gap (the repo's `dates differ` honesty already used on au-us-10y-gap).
- **KV plan:** one new row in `insights:snapshot`; history key on change.
- **Everyday (EN):** "The interest gap between the US and Japan powers the yen carry trade — when it narrows, borrowed yen can rush home fast and world markets wobble."
- **Everyday (FA):** «شکاف بهرهٔ آمریکا و ژاپن سوخت «کری ترید ین» است؛ وقتی این شکاف تنگ شود، پولی که با ین قرض گرفته شده می‌تواند یک‌شبه به ژاپن برگردد و بازارهای دنیا را تکان دهد.»
- **Needs attention:** below 2.00. Reasoning: carry unwinds historically accelerate as the gap compresses toward the funding-cost line (Aug-2024 style); below 2 the trade's risk-reward inverts.
- **Unusual:** below 1.50 (carry fully unprofitable; historic JPY-short squeeze zone) or above 4.00 (an extreme that has usually coincided with USD/JPY blow-off tops).
- **Feeds:** shown beside `usdjpy` (¥156.80) in the dollar lane; also referenced by the growth lane as a risk-appetite input.

## A-4 `gold-oil-ratio` — gold measured in oil

- **Source:** derived: `gold-usd ÷ brent` (both collected; ≈ 3,997 ÷ 111.7 ≈ 35.8 barrels per ounce today). Zero new fetches. Display both directions on the card ("one ounce buys 35.8 barrels").
- **Refresh:** daily; `maxAgeDays` 3 (both parents are 1–2 day feeds).
- **KV plan:** one row in `insights:snapshot`; history key on change.
- **Everyday (EN):** "How many barrels of oil one ounce of gold buys — a long-run value check between the two biggest commodities in the world."
- **Everyday (FA):** «یک اونس طلا چند بشکه نفت می‌خرد؛ سنجه‌ای بلندمدت برای ارزش نسبی دو کالای بزرگ دنیا.»
- **Needs attention / unusual:** percentile-based, not fixed numbers: attention in the lowest 10% of its 10-year range (gold historically cheap against oil, the pattern of inflation-era energy dominance); unusual in the lowest 2% or a 30-day fall steeper than 2 standard deviations. Reasoning: the ratio's range shifts across regimes (1970s ~30, 2015 ~20, 2020s wide); fixed numbers age badly, percentiles do not. First-classing percentile thresholds also matches how the page already scores T10Y2Y-style series.
- **Feeds:** prices-heat context row; referenced by the gold beam ("What the signals say") as a neutral factor.

## A-5 `rba-fed-gap` — RBA−Fed policy rate gap

- **Source:** derived: `rba-cash-rate − fed-target midpoint` (4.60 − 3.875 = +0.725 today). Zero new fetches.
- **Refresh:** per-change of either parent (both are decision-table feeds); no staleness window (same as rba-cash-rate).
- **KV plan:** one row in `insights:snapshot`; history key on change.
- **Everyday (EN):** "When Australian rates fall far below US rates, money tends to leave for the higher yield — the Australian dollar weakens and imports cost more."
- **Everyday (FA):** «وقتی بهرهٔ استرالیا از بهرهٔ آمریکا پایین‌تر بیفتد، سرمایه به سود بالاتر می‌رود؛ دلار استرالیا ضعیف می‌شود و واردات گران‌تر تمام می‌شود.»
- **Needs attention:** below −1.00 (RBA cuts far below the Fed; historic AUD-carry-outflow setting, import inflation pressure) or above +1.50.
- **Unusual:** below −1.50 or above +2.00 (regime extremes; the 2022-23 cycle visited both tails).
- **Feeds:** the trade & currency gauge beside `audusd` (US$0.7022); completes the AU rate story that `au-us-10y-gap` (−0.01) already tells for the long end.

## A-6 `eia-crude-stocks` — US crude oil inventories

- **Source:** `https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCRSTUS1&f=W` (US ending stocks of crude oil, weekly, thousands of barrels). Verified live 200. The EIA v2 API also works but requires a free registered key (403 `API_KEY_MISSING` without one); the website route needs no key, and the repo already parses this page family for Brent/WTI/Henry Hub, so the adapter pattern exists.
- **Refresh:** weekly with the Wednesday Petroleum Status Report; fetch on the Saturday 04:25 rung; `maxAgeDays` 12.
- **KV plan:** one row in `insights:snapshot`; history key on change (weekly values only).
- **Everyday (EN):** "America's oil tank levels: more oil in storage usually points to cheaper petrol ahead, while fast drains can signal supply squeezes."
- **Everyday (FA):** «میزان نفت ذخیره‌شده در انبارهای آمریکا؛ موجودی بیشتر معمولاً به بنزین ارزان‌تر در آینده اشاره می‌کند و تخلیهٔ سریع آن نشانهٔ کمبود عرضه است.»
- **Needs attention:** 4-week build above +20 million barrels (glut; historically drags Brent and pump prices) or 4-week draw below −20 million.
- **Unusual:** a single-week change beyond ±15 million barrels outside a known storm/outage window; or the 10-year position entering the top or bottom 5% (storage at the walls, the historic squeeze/ glut extremes of 2020 and 2022).
- **Feeds:** prices-heat context row beside `brent` (US$111.70) and `wti`; supplies the oil leg of the "dollar, gold and oil" relationship card.

## A-7 `cftc-gold-positioning` — trader positioning in gold (COT)

- **Source:** `https://www.cftc.gov/dea/newcot/deafut.txt` (futures-only Commitments of Traders). Verified live 200; the file contains "GOLD - COMMODITY EXCHANGE INC." (2026-10-20 data in the current file) plus WTI and USD-index rows, so the same fetch can later serve oil and dollar legs at zero extra cost. Metric: net non-commercial position as a share of open interest.
- **Refresh:** weekly (Tuesday data, Friday 17:30 ET publish); fetch Saturday 04:25; `maxAgeDays` 12.
- **KV plan:** one row in `insights:snapshot`; history key on change.
- **Everyday (EN):** "What big speculators are betting on gold right now; crowded bets have historically unwound violently."
- **Everyday (FA):** «معامله‌گران بزرگ الان روی طلا چه شرطی بسته‌اند؛ شرط‌های شلوغ به‌طور تاریخی با خروج ناگهانی جمع شده‌اند.»
- **Needs attention:** net long above 45% of open interest (crowded long; historic squeeze-then-slump zone) or below 0 (net short, rare and extreme pessimism usually near price floors).
- **Unusual:** a 4-week swing of more than 20 points of open interest, or the 10-year percentile entering the top/bottom 2%.
- **Feeds:** market-stress lane as context beside `vix` (19.03); referenced by the gold beam as a positioning factor.

## A-8 `oecd-cli-us` — OECD leading indicator (US, plus China and euro area)

- **Source:** `https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.1/all?format=csvfilewithlabels&startPeriod=2026-01` (filter `REF_AREA` to USA, CHN, EA19 at parse time). Verified live 200 (773 KB CSV; `format=jsondata` also verified). Amplitude-adjusted CLI is the series to store.
- **Refresh:** monthly, roughly a 5-week lag; fetch on the first-of-month 04:25 rung; `maxAgeDays` 75.
- **KV plan:** one row per country in `insights:snapshot` (`oecd-cli-us`, `oecd-cli-cn`, `oecd-cli-ea`); history keys on change. Three rows from one fetch.
- **Everyday (EN):** "A leading gauge of the world economy's direction about six months ahead; it has turned down before recessions and up before recoveries."
- **Everyday (FA):** «سنجه‌ای پیشرو برای جهت اقتصاد جهانی حدود شش ماه جلوتر؛ این شاخص پیش از رکودها به‌سوی پایین و پیش بهبودها به‌سوی بالا چرخیده است.»
- **Needs attention:** 6-month annualized growth of the CLI below −1 (turning down), or three consecutive monthly falls.
- **Unusual:** below −2 (historic recession-approach zone) or a 3-month rise steeper than +2 (rare V-turns, historically policy-driven).
- **Feeds:** growth-health gauge beside `china-pmi` (50.1) and `cfnai`; this is the owner's licensed-PMI replacement, so the growth lane gains its leading edge without ISM/S&P data.

## A-9 `gpr-index` — Geopolitical Risk Index

- **Source:** `https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls` (Iacoviello, monthly). Verified live 200 (2.7 MB XLS; the repo's dependency-free XLSX reader already handles Pink Sheet workbooks; `.xls` CDFV2 needs the same path the Shiller pipeline uses — if the legacy binary format is a blocker, fall back to `data_gpr_export.dta`→ skip; see the honest note below).
- **Refresh:** monthly, first-of-month 04:25 rung; `maxAgeDays` 75.
- **KV plan:** one row in `insights:snapshot`; history key on change.
- **Everyday (EN):** "A measure of war and tension in the news; spikes have usually pushed oil and gold up and shares down."
- **Everyday (FA):** «سنجه‌ای از جنگ و تنش در اخبار؛ جهش‌های آن به‌طور تاریخی نفت و طلا را بالا و سهام را پایین برده است.»
- **Needs attention:** the monthly average more than 1 standard deviation above its 10-year mean (the historic war-scare zone).
- **Unusual:** more than 2 standard deviations above (2001, 2022-03 and 2023-10-class episodes); store the mean and SD as rolling 10-year values recomputed monthly.
- **Feeds:** market-stress context row; referenced by the "dollar, gold and oil" card as a shock input.

## A-10 `epu-us` — US Economic Policy Uncertainty

- **Source:** `https://policyuncertainty.com/media/US_Policy_Uncertainty_Data.xlsx` (Baker-Bloom-Davis, monthly headline EPU index; linked from `https://policyuncertainty.com/us_monthly.html`). Verified live 200 (71 KB XLSX, OOXML — the Pink Sheet parser path handles it directly).
- **Refresh:** monthly, first-of-month 04:25 rung; `maxAgeDays` 75.
- **KV plan:** one row in `insights:snapshot`; history key on change.
- **Everyday (EN):** "How uncertain economic-policy news is in the US; high uncertainty has historically slowed business investment and hiring."
- **Everyday (FA):** «اخبار سیاست اقتصادی آمریکا چقدر نامطمئن است؛ عدم قطعیت بالا به‌طور تاریخی سرمایه‌گذاری و استخدام شرکت‌ها را کند کرده است.»
- **Needs attention:** above 1 SD of its 10-year mean (elections, tariff fights, debt-ceiling episodes).
- **Unusual:** above 2 SD (the 2016-11, 2018-12, 2020-03 historic spikes).
- **Feeds:** growth-health context row; pairs with `michigan-sentiment` (48.1) as the confidence leg.

---

## Cross-cutting integration rules (all additions)

1. **Fail closed.** Any parse mismatch, out-of-range value or missing parent renders "Stale / Can't tell", never a fabricated verdict; loud zod contracts, exactly as the existing adapters do.
2. **Thresholds on display scales.** Threshold atoms must pass through the card's display scale (the M4 scale-fix rule), so "below 2.00" reads as 2.00, never 0.02.
3. **Percentile basis.** A-4, A-6 (position), A-7 (position), A-9 and A-10 use rolling 10-year percentile/SD bases recomputed on write, never hardcoded regime numbers, except the fixed numbers explicitly justified above (curve inversion at 0, carry gap at 2.00, target-relative inflation lines).
4. **Bilingual copy.** All fa strings go through the i18n dictionary and the persian-copy manifest gate (`pnpm copy:audit`); no em dashes in fa copy; Persian digits and Jalali stamps on the fa locale; logical CSS properties only.
5. **Attribution.** New cards carry "Source: <publisher>" with the verified URL in the card's View-source link and the About panel rows (MOF, EIA, CFTC, OECD, Iacoviello GPR, Baker-Bloom-Davis EPU, St. Louis Fed).
6. **No new KV keys.** Everything extends `insights:snapshot` and the `insights:hist:*` family. The serve path stays at exactly one KV read per request.
7. **Budget check after each wave.** Record the rung's fetch rows and write count in the deploy session record, as the standing practice does; the 04:10 rung must never exceed 50 subrequests (hence MOF and the weekly/monthly feeds live on the 04:25 rung).
8. **Rejection register.** Sources rejected in the audit (ICE BofA spreads, Cboe put/call, WGC, PBoC, BIS, daily Bund) stay out until a source revives; revisit quarterly.

## Honest build note on A-9

The GPR export is a legacy `.xls` (CDFV2 binary). The repo's web-standard reader path handles OOXML (Pink Sheet). If the legacy format cannot be parsed without a dependency, record it as blocked with the exact failing step (the repo's three-honest-attempts rule), and ship A-10 (OOXML) first; GPR can also be re-exported by the author to `.xlsx` at source. Do not ship a hand-entered GPR.
