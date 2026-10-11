# Currena Insights — "World stock markets" section

**Status:** v1.1 · decisions D1, D4, D5, D6 answered by Ali on 2026-10-11 (see section 1)
**Repo:** assadigit/Currena (Cloudflare Workers) · suggested path: `docs/specs/insights-world-markets.md`
**Audience for this file:** Ali (decisions) and the agentic coding session (build).

How to read: **DECIDE** = needs Ali's answer before build. **VERIFY** = the build agent must test it live, because these provider calls could not be run while writing this spec.

---

## 1. Decisions

| # | Question | Answer |
|---|---|---|
| D1 | Data licence | **Stay on the free licences for now** (the site is not commercial). Credit the sources in the footer. Revisit before Currena earns money. |
| D2 | List of 14 markets (section 2) | Assumed approved unless Ali says otherwise. |
| D3 | Freshness | Assumed: end-of-day, refreshed once per weekday. Not live. |
| D4 | Feed a world-markets signal into the hero count | **Yes.** Thresholds are set in section 5.3 as starting values, and the build agent back-tests them on the last year of data. |
| D5 | History depth | **One year of data is enough for v1.** The 10-year position is dropped from v1 (section 5.4). |
| D6 | Persian wording | **Use terms Iranian users already know from Iranian stock websites** (section 8.1). |

---

## 2. The 14 markets

Order inside each group follows the trading day, so the section shows the world "waking up" from east to west.

| id | English name | Persian name | Country | Group | Yahoo symbol | EODHD code (VERIFY) |
|---|---|---|---|---|---|---|
| n225 | Nikkei 225 | نیکی ۲۲۵ | Japan | Asia-Pacific | ^N225 | N225.INDX |
| asx200 | ASX 200 | ای‌اس‌ایکس ۲۰۰ | Australia | Asia-Pacific | ^AXJO | AXJO.INDX |
| kospi | KOSPI | کوسپی | South Korea | Asia-Pacific | ^KS11 | KS11.INDX |
| hsi | Hang Seng | هنگ‌سنگ | Hong Kong | Asia-Pacific | ^HSI | HSI.INDX |
| ssec | Shanghai Composite | کامپوزیت شانگهای | China | Asia-Pacific | 000001.SS | VERIFY (000001.SHG or similar) |
| taiex | TAIEX | تایکس | Taiwan | Asia-Pacific | ^TWII | TWII.INDX |
| nifty50 | Nifty 50 | نیفتی ۵۰ | India | Asia-Pacific | ^NSEI | NSEI.INDX |
| stoxx50 | Euro Stoxx 50 | یورو استوکس ۵۰ | Eurozone | Europe | ^STOXX50E | STOXX50E.INDX |
| dax | DAX | داکس | Germany | Europe | ^GDAXI | GDAXI.INDX |
| ftse | FTSE 100 | فوتسی ۱۰۰ | United Kingdom | Europe | ^FTSE | FTSE.INDX |
| sp500 | S&P 500 | اس‌اندپی ۵۰۰ | United States | Americas | ^GSPC | GSPC.INDX |
| ndx | Nasdaq 100 | نزدک ۱۰۰ | United States | Americas | ^NDX | NDX.INDX |
| tsx | S&P/TSX Composite | تی‌اس‌ایکس کانادا | Canada | Americas | ^GSPTSE | GSPTSE.INDX |
| ibov | Ibovespa | بووسپا | Brazil | Americas | ^BVSP | BVSP.INDX |

Notes
- All EODHD codes above are best guesses. Build step 0 (section 3.6) confirms each one against EODHD's symbol list for the INDX exchange.
- The VIX already exists elsewhere on the page. It is **not** part of this table.
- Index values are in each market's local currency. The UI only compares percentages, never levels across countries.

---

## 3. Data sources and reliability

### 3.1 Principles
1. **No free, official, global index feed exists.** Reliability comes from a chain of two providers, sanity checks, and honest "old data" labels.
2. **End-of-day, one refresh per weekday.** The page is for understanding, so a closing value is enough. This is also what keeps the free limits safe.
3. **The page never calls a data provider.** Only a scheduled job does. Visitors only read a stored copy.

### 3.2 Providers

| Role | Provider | How | Limits and terms (checked October 2026) |
|---|---|---|---|
| **Primary** | EODHD, free key | End-of-day endpoint, one call per index, asking for the last ~400 days: `https://eodhd.com/api/eod/{CODE}?api_token={KEY}&fmt=json&period=d&from={YYYY-MM-DD}` | Free plan: 20 calls per day, one year of history, personal use only. One call returns a full year, so every number in the table comes from that single call. 14 calls per run leaves 6 spare per day. |
| **Fallback** | Yahoo Finance chart endpoint | `https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=1y&interval=1d` | No key, but unofficial: it can return 429 or change without notice, and it is personal use only. The older quote endpoint (v7) returns 401 since January 2026, do not use it. |
| Plan B | EODHD "EOD Historical Data – All World" | Same endpoint as above | About $19.99 per month, 100,000 calls per day. Still a personal-use licence; business use needs a custom plan. |

**VERIFY first:** EODHD's own pages disagree on whether the free key serves non-demo tickers (one says any ticker for the past year, another says six demo tickers). Test one index with a free key before building. If it fails, use Yahoo as primary and treat Plan B as the paid upgrade.

### 3.3 Sources checked and rejected
- **Stooq:** since March/April 2026 it needs an API key obtained through a CAPTCHA, answers scripts with a JavaScript bot check, and is non-commercial. Not usable from a Worker.
- **Twelve Data (free):** free plan covers US markets, forex and crypto only, and the licence is evaluation / non-display.
- **Financial Modeling Prep (free):** US-only, personal use, and showing data needs a display licence.
- **FRED:** has the S&P 500 (10 years only), Nasdaq 100 and Nikkei 225, but its notes forbid reproducing S&P and Nikkei data without permission. Use only as a manual cross-check, never as a displayed source.

### 3.4 Refresh logic (scheduled job)
```
run at 23:30 UTC, Monday to Friday          (all 14 markets have closed by then)
retry at 01:30 UTC, Tuesday to Saturday     (only re-fetches markets that failed or look old)

for each market that needs data:
    try EODHD
    if it failed or failed validation: try Yahoo
    if both failed: keep last stored values and mark stale = true
merge into the single stored object
write only if the content changed
```

### 3.5 Validation rules (the accuracy guard)
| Rule | If it fails |
|---|---|
| R1. Close is a number greater than 0 | Reject, try the next provider |
| R2. New date is not older than the stored date | Reject |
| R3. One-day move is under 15% in either direction | Hold the old value, ask the other provider. Use the new value only if both providers agree within 0.5% |
| R4. At least 200 daily closes were returned | Reject, try the next provider |
| R5. When both providers were used on the same day, the latest closes agree within 0.5% | Show the primary value, log a warning |
| R6. Last-close date is no more than 5 calendar days old | Mark `stale = true` (the UI shows "Old data") |
| R7. Never display 0, blank, or NaN | Show the last good value with its date, or the stale chip |

### 3.6 Build step 0 (acceptance test, do before any UI)
For each of the 14 markets: call both providers, print the last close and date side by side, and write the table into `docs/specs/insights-world-markets-data-check.md`. Ali (or the agent via the exchange's own website) confirms at least three of them by eye, including one Asian and one European market.

---

## 4. Cloudflare free-tier budget

Limits (Cloudflare documentation, October 2026): KV reads 100,000 per day · KV writes 1,000 per day (different keys), 1 write per second on the same key · Workers subrequests 50 per invocation · cron triggers 5 per account · CPU 10 ms per invocation.

| Resource | What this section uses | Free limit | Share |
|---|---|---|---|
| KV writes per day | 1 normal write + at most 2 retries = **3 or fewer** (only when data changed, so usually 1) | 1,000 | about 0.3% |
| KV reads per day | 1 key. Edge cache of 1 hour in front, so typically a few dozen per day, worst case a few hundred | 100,000 | under 1% |
| Provider calls per run | 14 (EODHD) plus fallback calls only for failed markets | 50 per invocation, 20 per day on EODHD | within both |
| Cron triggers | 2 (main and retry) | 5 per account, shared with your other jobs | check how many are already used |

### Rules
1. **One KV key for the whole section** (`insights:markets:v1`). No per-market keys, no `list()`.
2. **Write only if changed.** Compare a hash of the new content to the stored one. Weekends and holidays then cost zero writes.
3. **Own cron triggers**, separate from the jobs that fetch your other dozen APIs. This keeps each invocation under the 50-subrequest cap.
4. **No provider calls on page requests.** The public route only reads KV.
5. **Cache the public route:** `Cache-Control: public, max-age=300, s-maxage=3600`, and use the Cache API in the Worker. KV reads use `cacheTtl: 3600`.
6. **Keep CPU low:** ask providers only for the last ~400 days, compute the numbers, keep only the results. If a CPU-limit error ever appears, split into two runs of 7 markets (same total calls).
7. **Weekly 52-point series** per market for the detail chart (not the daily history). Whole object stays around 7 to 9 KB.
8. **Escape hatch:** if KV ever gets tight, move this one key to D1 or R2. Both have much larger free write allowances than KV.
9. **After the first week,** check the KV metrics in the Cloudflare dashboard. Target: this section stays under 1% of reads and 1% of writes. Record the numbers in the data-check file.

### Stored object (value of `insights:markets:v1`)
```json
{
  "v": 1,
  "generated_at": "2026-10-12T23:31:02Z",
  "markets": [
    {
      "id": "sp500",
      "as_of": "2026-10-09",
      "close": 0,
      "chg_1d": 0.0,
      "chg_1m": 0.0,
      "high_52w": 0,
      "low_52w": 0,
      "from_high": 0.0,
      "range_pos": 0,
      "trend": "up | flat | down",
      "status": "normal | correction | bear",
      "source": "eodhd | yahoo",
      "stale": false,
      "weekly": [0]
    }
  ],
  "summary": {
    "count": 14,
    "rose_today": 0,
    "n_attention": 0,
    "n_unusual": 0,
    "signal": "normal | attention | unusual",
    "worst_group": "asia | europe | americas | null"
  }
}
```
(All zeros above are placeholders for the schema. Real values come from the providers.)

---

## 5. Derived numbers

### 5.1 Per market
- `chg_1d` = last close vs the previous close, in percent.
- `chg_1m` = last close vs the last close on or before the same date one month earlier.
- `high_52w` / `low_52w` = highest and lowest daily close in the last 365 days.
- `from_high` = last close vs `high_52w`, in percent (zero or negative).
- `range_pos` = (last − low) ÷ (high − low) × 100.
- `trend`: compare last close to the 50-day average. Up if more than 1% above, down if more than 1% below, otherwise flat. **VERIFY:** if the existing cards already define trend arrows, reuse that exact rule.

### 5.2 Per-market status
Based on `from_high`. The 10% and 20% lines are the same ones Iranian stock sites use to separate a price correction from a bear market.

| Status | Enters when | Goes back when | Persian term | Counts as (page tier) |
|---|---|---|---|---|
| Normal | less than 10% below the 52-week high | | عادی | Normal |
| Correction | 10% or more below | back above −8% | اصلاح قیمتی | Needs attention |
| Bear market | 20% or more below | back above −18% | بازار خرسی | Unusual |

The 2-point buffer on the way back stops a tile from flipping every day when a market hovers near a line. The previous status is kept inside the stored object, so this costs no extra KV keys.

### 5.3 Section signal (feeds the hero count) — thresholds set (D4)
Let **n** = how many of the 14 markets are in Correction or Bear market. The signal is the **highest** of the rows that match.

| Signal | Matches when |
|---|---|
| Normal | n is 3 or fewer, and neither the S&P 500 nor the Nasdaq 100 is in Correction |
| Needs attention | n is 4 to 7, **or** the S&P 500 or Nasdaq 100 is in Correction |
| Unusual | n is 8 or more, **or** the S&P 500 or Nasdaq 100 is in Bear market |

Why these numbers
- **3 is tolerated** because a few markets (Hang Seng, Shanghai, Ibovespa) can sit far below their yearly highs for long stretches for local reasons. That alone should not make the world look stressed.
- **8 of 14** means more than half the world is hurting, so stress is clearly global.
- **The US override** exists because the rest of the world follows the S&P 500 and Nasdaq 100. A fall there matters even when many other markets are fine.

Keep all numbers in one config block at the top of the code, so Ali can change them without touching logic:
```
CORRECTION_PCT   = -10   # market status: Correction
BEAR_PCT         = -20   # market status: Bear market
EXIT_BUFFER_PTS  = 2     # points a market must recover before the status gets milder
ATTENTION_COUNT  = 4     # markets in Correction or worse → Needs attention
UNUSUAL_COUNT    = 8     # markets in Correction or worse → Unusual
SHOCK_DAY_FALL   = -2    # one-day fall in percent counted for the shock-day line
SHOCK_DAY_COUNT  = 5     # markets that must fall that much on the same day
```

**Back-test (build step 2):** the agent replays the last year of daily data for all 14 markets through these rules and reports the share of days in each signal and the dates the signal changed. These are starting values. They are right if Normal covers most of the year and Unusual appears only in genuinely stressful weeks. If not, the agent proposes new numbers to Ali before building the UI. I could not run this back-test while writing, because the data is not reachable from here.

If the section signal is Needs attention or Unusual, it appears in the named-alerts block with its numbers, using the existing alert mechanism (no new card).

**Shock-day line (takeaway text only, not part of the count):** if SHOCK_DAY_COUNT or more markets fell by at least SHOCK_DAY_FALL percent on their latest close, the takeaway line says so (section 8.3).

### 5.4 Not in v1: 10-year position
Decided: one year of data is enough to start. The detail panel shows the 52-week range only. A 10-year view can be added later from a one-time seed file, without changing anything above.

---

## 6. Information architecture and layout (uiux-mentor)

**Lens:** experience / product (non-commercial). **Audience:** people without finance education who want a fast read. **Outcome:** a first-time visitor can say in 5 seconds whether world stock markets are calm or stressed, and name the worst region.

### 6.1 Options considered
| Option | Verdict |
|---|---|
| A. Always-open table of 14 rows | Rejected. Adds the density you already found tiring (Hick's Law, Miller's Law). |
| **B. Compact strip of 14 tiles in 3 groups, with the full table behind one tap** | **Chosen.** Progressive disclosure: the strip answers the first question, the table serves the curious. |
| C. Separate "Markets" page | Rejected for now. It hides objective 1 (the world at a glance). Revisit if the list grows past about 30 markets. |

### 6.2 Where it sits on the page
Attention order stays: verdict, named alerts, prices, **world stock markets (new)**, what it means for my money, calendar. It sits right after the commodity prices, because both answer "what is moving". It is **never above** the verdict or alerts.

### 6.3 Anatomy (top to bottom)
1. **Header row:** title, and the "as of" date on the far side (Jalali date in Farsi).
2. **Takeaway line:** one sentence generated from the numbers (section 8).
3. **View switch:** one segmented control **Today | 1 month | From 52-week high**. Default Today.
4. **Strip:** three labelled groups, **Asia-Pacific (7) · Europe (3) · Americas (4)**. No group has more than 7 tiles.
   - **Tile:** short name, percentage, arrow glyph. Two lines at most.
   - **Quiet by default:** only a market in Correction or Bear market gets an extra tag, for example "−12% below 52-week high" (Persian: «۱۲٪ زیر سقف یک‌ساله»). Normal markets stay plain, so problems stand out without colour tricks.
   - Tapping a tile opens its detail panel under that group. Only one panel is open at a time.
5. **"Show full table"** disclosure (closed by default).
6. **Footer line:** source, "end-of-day", "local currency". The page footer keeps the single shared disclaimer and "Before you act" box, as already decided.

### 6.4 Full table (desktop, 900 px and wider)
Columns: Market · Today · 1 month · From 52-week high · Trend · Status · Last close.
Fixed group order. One sort only: "From 52-week high" (worst first). Row click opens the same detail panel. CSV of this table goes into the existing Tools menu.
On mobile there is no table; the disclosure shows a vertical list of rows with the same three numbers.

### 6.5 Detail panel (one per market)
Three plain-language lines (section 7: what it is, why it matters to the world, what it means for you), then a 52-week line chart from the weekly series, then the numbers: last close level and date, 52-week high and low. Time runs **left to right** on the chart in Farsi too.

### 6.6 States (decided up front)
| State | What the person sees |
|---|---|
| Loading | 14 grey skeleton tiles with the three group labels already in place |
| Never populated | One calm line: "Market data is being prepared. Check back after the next daily update." No zeros, no empty tiles |
| One market failed or old | That tile shows its last good value with an "Old data · date" chip |
| Everything stale (more than 5 days) | The section collapses to a single line with the last update date |
| Market holiday | Nothing special: the tile just shows that market's own last-close date |

Live "open / closed" dots are **not** in v1, because they would be wrong on holidays and that costs trust (Nielsen: visibility of system status).

### 6.7 Farsi, right-to-left and numbers
- Group order follows reading direction: in Farsi, Asia-Pacific sits at the right.
- Numbers and percentages stay left-to-right inside their own span; Persian digits and Jalali dates, as already decided for the page.
- English index names are kept in small Latin text next to the Persian name in the table and detail panel.

### 6.8 Accessibility
- Direction is never shown by colour alone: arrow glyph, plus or minus sign, and text chips carry the meaning.
- Tiles are real buttons with `aria-expanded`. The table is a real `<table>` with `<th scope>`. The view switch works with arrow keys. Tab order: view switch, groups, tiles, table disclosure.
- Touch targets are at least 44 × 44 px.
- Colour choices go to **color-palette-advisor**. The strategic rule for it: up/down use neutral ink with the glyph; the page's existing warning tokens are used only for Correction and Bear market. No red/green pair as the only signal (colour-blind readers, and some cultures reverse the meaning).

### 6.9 Not in v1
Live open/closed dots, mini-charts inside tiles, index levels inside the strip, market-vs-market comparison charts, per-market alerts, extra markets (Dow Jones, Russell, Saudi, Tehran).

### 6.10 Metrics this should move
First-glance test passes for a new visitor within 5 seconds. Secondary: share of visitors who open at least one detail panel (shows learning), and share who open the table.

---

## 7. Context content for each market

Each market has three lines: **What it is · Why it matters to the world · What it means for you.**
Keep these lines as written unless the build agent finds a factual error.

### n225 · Nikkei 225 · نیکی ۲۲۵
- EN what: 225 large Japanese companies, many of them exporters.
- EN why: It moves with the yen (you already track USD/JPY): a weak yen usually helps exporters, and a sudden yen jump can hit this index hard.
- EN you: Big yen swings can shake global markets, as happened in August 2024.
- FA what: ۲۲۵ شرکت بزرگ ژاپنی که بسیاری‌شان صادرکننده‌اند.
- FA why: به ین وابسته است (دلار به ین را هم دنبال می‌کنید): ین ضعیف معمولاً به سود صادرکنندگان است و جهش ناگهانی ین می‌تواند این شاخص را سخت بزند.
- FA you: نوسان شدید ین می‌تواند بازارهای جهانی را بلرزاند؛ مثل اوت ۲۰۲۴.

### asx200 · ASX 200 · ای‌اس‌ایکس ۲۰۰
- EN what: The 200 largest companies on the Australian Securities Exchange, led by banks and miners.
- EN why: Your home market. It follows iron ore, China's demand and the big banks.
- EN you: Most Australian super funds hold a large slice of these companies, so it affects your retirement savings.
- FA what: ۲۰۰ شرکت بزرگ بورس استرالیا که بانک‌ها و معدنی‌ها در آن غالب‌اند.
- FA why: بازار خانگی شما: از سنگ‌آهن، تقاضای چین و بانک‌های بزرگ تأثیر می‌گیرد.
- FA you: بیشتر صندوق‌های بازنشستگی استرالیا سهم بزرگی از این شرکت‌ها دارند؛ پس روی پس‌انداز بازنشستگی اثر می‌گذارد.

### kospi · KOSPI · کوسپی
- EN what: South Korea's main stock index, led by Samsung Electronics and SK Hynix.
- EN why: A bellwether for the world's computer-chip cycle and for AI hardware demand.
- EN you: Chip demand shapes the cost and availability of phones, cars and AI services.
- FA what: شاخص اصلی بورس کره جنوبی، با محوریت سامسونگ الکترونیکس و اس‌کی هاینیکس.
- FA why: معیاری برای چرخهٔ جهانی تراشه‌های کامپیوتری و تقاضای سخت‌افزار هوش مصنوعی.
- FA you: تقاضای تراشه روی قیمت و موجودی گوشی، خودرو و خدمات هوش مصنوعی اثر دارد.

### hsi · Hang Seng · هنگ‌سنگ
- EN what: Hong Kong's biggest companies, including many Chinese technology and finance firms.
- EN why: The main door through which foreign investors buy into China, so it reacts fast to China news.
- EN you: Sharp moves here are an early hint of how global investors feel about China.
- FA what: بزرگ‌ترین شرکت‌های هنگ‌کنگ، از جمله بسیاری از شرکت‌های فناوری و مالی چین.
- FA why: دروازهٔ اصلی ورود سرمایه‌گذاران خارجی به چین است و به خبرهای چین سریع واکنش نشان می‌دهد.
- FA you: حرکت‌های شدید آن نشانهٔ زودهنگام حس سرمایه‌گذاران جهانی نسبت به چین است.

### ssec · Shanghai Composite · کامپوزیت شانگهای
- EN what: All stocks listed on the Shanghai Stock Exchange.
- EN why: A read on China's domestic economy, which drives demand for oil, iron ore and copper.
- EN you: China buys a large share of Australia's iron ore, so a weak China market can mean weaker Australian exports and a softer Australian dollar.
- FA what: همهٔ سهام فهرست‌شده در بورس شانگهای.
- FA why: نشانی از وضع اقتصاد داخلی چین است که تقاضا برای نفت، سنگ‌آهن و مس را تعیین می‌کند.
- FA you: چین خریدار بزرگ سنگ‌آهن استرالیاست؛ ضعف بازار چین می‌تواند صادرات استرالیا و ارزش دلار استرالیا را تضعیف کند.

### taiex · TAIEX · تایکس
- EN what: Taiwan's main stock index. TSMC, which makes most of the world's most advanced chips, carries a huge weight.
- EN why: Shows the health of the AI-chip supply chain, and carries geopolitical risk around Taiwan.
- EN you: Trouble in Taiwan would ripple through every technology and AI company.
- FA what: شاخص اصلی بورس تایوان؛ شرکت TSMC که بیشتر پیشرفته‌ترین تراشه‌های جهان را می‌سازد وزن بسیار بزرگی دارد.
- FA why: سلامت زنجیرهٔ تأمین تراشه‌های هوش مصنوعی و ریسک ژئوپلیتیک پیرامون تایوان را نشان می‌دهد.
- FA you: مشکل در تایوان روی همهٔ شرکت‌های فناوری و هوش مصنوعی اثر می‌گذارد.

### nifty50 · Nifty 50 · نیفتی ۵۰
- EN what: The 50 largest companies on India's National Stock Exchange.
- EN why: India is one of the fastest-growing big economies and competes with China for global investor money.
- EN you: Money moving into or out of India can shift emerging-market funds and demand for oil and gold.
- FA what: ۵۰ شرکت بزرگ بورس ملی هند.
- FA why: هند یکی از سریع‌ترین اقتصادهای بزرگ در حال رشد است و در جذب پول سرمایه‌گذاران جهانی با چین رقابت می‌کند.
- FA you: جابه‌جایی پول به هند یا از آن می‌تواند صندوق‌های بازارهای نوظهور و تقاضا برای نفت و طلا را تغییر دهد.

### stoxx50 · Euro Stoxx 50 · یورو استوکس ۵۰
- EN what: The 50 biggest companies in the eurozone.
- EN why: One number for the health of the euro area, one of the world's largest economic blocs.
- EN you: It affects the euro and European interest rates, which matter for imports, travel and global funds.
- FA what: ۵۰ شرکت بزرگ منطقهٔ یورو.
- FA why: یک عدد برای سلامت منطقهٔ یورو، یکی از بزرگ‌ترین بلوک‌های اقتصادی جهان.
- FA you: بر ارزش یورو و نرخ بهره اروپا اثر می‌گذارد که روی واردات، سفر و صندوق‌های جهانی تأثیر دارد.

### dax · DAX · داکس
- EN what: The 40 largest German companies, heavy in cars, chemicals and machinery.
- EN why: Germany sells goods worldwide, so the DAX is a good read on global trade and on demand from China.
- EN you: Weakness can signal slowing world trade, which tends to cool growth and commodity prices.
- FA what: ۴۰ شرکت بزرگ آلمانی، با سهم زیاد خودرو، شیمی و ماشین‌آلات.
- FA why: آلمان کالا به سراسر جهان می‌فروشد؛ پس داکس نشانهٔ خوبی از تجارت جهانی و تقاضای چین است.
- FA you: ضعف آن می‌تواند نشانهٔ کند شدن تجارت جهانی باشد که رشد و قیمت کالاها را خنک می‌کند.

### ftse · FTSE 100 · فوتسی ۱۰۰
- EN what: The 100 largest companies on the London Stock Exchange.
- EN why: Full of global miners, oil companies and banks that earn most of their money abroad, so it works more like a gauge of commodities and world growth than of the UK itself.
- EN you: It often rises when oil and metal prices rise, even if the UK economy is weak.
- FA what: ۱۰۰ شرکت بزرگ بورس لندن.
- FA why: پر از شرکت‌های معدنی، نفتی و بانک‌هایی است که بیشتر درآمدشان از خارج بریتانیا می‌آید؛ پس بیشتر مقیاسی از کالاها و رشد جهانی است تا اقتصاد بریتانیا.
- FA you: اغلب با بالا رفتن قیمت نفت و فلزات بالا می‌رود، حتی اگر اقتصاد بریتانیا ضعیف باشد.

### sp500 · S&P 500 · اس‌اندپی ۵۰۰
- EN what: The 500 biggest companies listed in the United States.
- EN why: It is the world's main stock-market benchmark; when it falls sharply, markets almost everywhere follow.
- EN you: Many super and index funds hold US shares, so its moves reach your retirement savings.
- FA what: ۵۰۰ شرکت بزرگ بورس آمریکا.
- FA why: معیار اصلی بازار سهام جهان است؛ وقتی شدید افت کند، تقریباً همه‌جا دنبالش می‌آیند.
- FA you: بسیاری از صندوق‌های بازنشستگی و شاخصی سهام آمریکا دارند، پس حرکتش به پس‌انداز شما هم می‌رسد.

### ndx · Nasdaq 100 · نزدک ۱۰۰
- EN what: The 100 largest non-financial companies on the Nasdaq exchange, led by big technology and AI firms.
- EN why: Shows the mood for technology and growth stocks. It usually swings harder than the S&P 500.
- EN you: Falls here often mean investors are pulling back from risk, which can ripple into crypto and growth funds.
- FA what: ۱۰۰ شرکت بزرگ غیرمالی بورس نزدک، با تمرکز روی فناوری و هوش مصنوعی.
- FA why: حال‌وهوای سهام فناوری و رشد را نشان می‌دهد و معمولاً بیشتر از اس‌اندپی ۵۰۰ نوسان دارد.
- FA you: افت آن اغلب یعنی سرمایه‌گذاران از ریسک فاصله می‌گیرند؛ اثرش می‌تواند به ارز دیجیتال و صندوق‌های رشد هم برسد.

### tsx · S&P/TSX Composite · تی‌اس‌ایکس کانادا
- EN what: Canada's main stock index, heavy in energy, banks and mining.
- EN why: A read on oil and metal prices, and Canada is the US's closest trading partner.
- EN you: It often moves with oil prices, which affect what you pay for petrol.
- FA what: شاخص اصلی بورس کانادا، با سهم زیاد انرژی، بانک و معدن.
- FA why: نشانی از قیمت نفت و فلزات است و کانادا نزدیک‌ترین شریک تجاری آمریکاست.
- FA you: اغلب با قیمت نفت بالا و پایین می‌شود؛ قیمتی که روی بنزین شما اثر دارد.

### ibov · Ibovespa · بووسپا
- EN what: Brazil's main stock index, with large oil, mining and bank companies.
- EN why: The usual stand-in for emerging markets and commodity exporters. It drops when investors flee riskier countries.
- EN you: A sharp fall often goes with a stronger US dollar and weaker emerging-market currencies.
- FA what: شاخص اصلی بورس برزیل، با شرکت‌های بزرگ نفتی، معدنی و بانکی.
- FA why: نمایندهٔ معمول بازارهای نوظهور و صادرکنندگان کالاست؛ وقتی سرمایه‌گذاران از کشورهای پرریسک فرار می‌کنند، افت می‌کند.
- FA you: افت شدید آن اغلب همراه با دلار قوی‌تر و ارزهای ضعیف‌تر کشورهای نوظهور است.

---

## 8. Interface wording

### 8.1 Persian terms (checked against Iranian stock websites)
The market terms below are the ones Iranian stock education and news sites use (Khane Sarmaye, Eghtesadnews, Aftab News, Nabz-e Bourse, Faradars). Use these words, not literal translations.

| Concept | Persian term to use | English label |
|---|---|---|
| 52-week high | سقف یک‌ساله (short form: سقف قیمتی) | 52-week high |
| 52-week low | کف یک‌ساله | 52-week low |
| Distance from the 52-week high | فاصله از سقف یک‌ساله | From 52-week high |
| Return today / 1 month | بازدهی امروز / بازدهی یک‌ماهه | Today / 1 month |
| Stock index | شاخص | Index |
| Latest closing value | آخرین مقدار پایانی | Last close |
| 10–20% below the high | اصلاح قیمتی | Correction |
| 20% or more below the high | بازار خرسی | Bear market |
| A sharp fall | ریزش | Sharp fall |
| Rise / fall | رشد / افت | Rise / fall |
| Trend | روند: صعودی / خنثی / نزولی | Up / flat / down |
| Normal | عادی | Normal |
| Old data | داده قدیمی | Old data |

Two cautions
- In Iranian usage «سقف» can also mean the **daily price limit** (دامنه نوسان). So always write «سقف یک‌ساله» or «سقف قیمتی», never «سقف» alone.
- «بازار گاوی» (bull market) is the matching known term. It is not shown in the interface, but it can go in a glossary tooltip next to «بازار خرسی».

### 8.2 Interface wording

| Element | English | Persian |
|---|---|---|
| Section title | World stock markets | بازارهای سهام جهان |
| Subtitle | Last close · end-of-day data | آخرین مقدار پایانی · داده‌های پایان روز |
| View switch | Today · 1 month · From 52-week high | امروز · یک ماه · فاصله از سقف یک‌ساله |
| Groups | Asia-Pacific · Europe · Americas | آسیا و اقیانوسیه · اروپا · قاره آمریکا |
| Tile tag | {x}% below 52-week high | {x}٪ زیر سقف یک‌ساله |
| Status labels | Normal · Correction · Bear market | عادی · اصلاح قیمتی · بازار خرسی |
| Old-data chip | Old data · {date} | داده قدیمی · {date} |
| Table disclosure | Show full table / Hide table | نمایش جدول کامل / پنهان کردن جدول |
| Table headers | Market · Today · 1 month · From 52-week high · Trend · Status · Last close | بازار · بازدهی امروز · بازدهی یک‌ماهه · فاصله از سقف یک‌ساله · روند · وضعیت · آخرین مقدار پایانی |
| Empty state | Market data is being prepared. Check back after the next daily update. | داده‌های بازار در حال آماده‌سازی است. پس از به‌روزرسانی روزانهٔ بعدی دوباره سر بزنید. |
| Footer line | Source: EODHD (Yahoo Finance as backup). End-of-day values in each market's local currency. | منبع: EODHD (با پشتیبان Yahoo Finance). مقادیر پایان روز، به ارز محلی هر بازار. |

How the status labels connect to the rest of the page: Correction uses the page's "Needs attention" tier and Bear market uses the "Unusual" tier, so colours, counts and alerts stay consistent. The section signal itself (Normal / Needs attention / Unusual) uses the chip wording already on the page.

Percent signs: tiles use ٪ to save space; sentences use the word «درصد», as Iranian news sites do.

### 8.3 Takeaway line templates
The build agent generates these from the numbers. No AI call at runtime.

| Situation | English | Persian |
|---|---|---|
| Calm (signal Normal) | {up} of 14 markets rose today. None is far below its 52-week high. | امروز {up} بازار از ۱۴ بازار رشد کردند و هیچ‌کدام فاصلهٔ زیادی با سقف یک‌ساله ندارند. |
| Some stress | {n} of 14 markets are 10% or more below their 52-week high, mostly in {group}. | {n} بازار از ۱۴ بازار دست‌کم ۱۰ درصد زیر سقف یک‌ساله‌اند، بیشترشان در {group}. |
| Heavy stress | {n} of 14 markets are 10% or more below their 52-week high. The fall is widespread. | {n} بازار از ۱۴ بازار دست‌کم ۱۰ درصد زیر سقف یک‌ساله‌اند. ریزش گسترده است. |
| Shock day (added to any line above) | A sharp one-day fall hit {k} markets. | امروز در {k} بازار ریزش تند ثبت شد. |

The one shared disclaimer stays in the page footer. Its final wording still needs the review by someone qualified in Australian financial-services rules, as already decided.

---

## 9. Build plan for the agentic session

Work in this order. Loop on each step until its test passes, then continue. Match the code patterns already in the repo.

| Step | Task | Test that proves it is done |
|---|---|---|
| 0 | Provider check (section 3.6) | Data-check file committed, 14 markets, both providers compared |
| 1 | Provider adapters (EODHD, Yahoo) returning one common shape | Unit tests using saved sample responses for both |
| 2 | Calculation, status and signal rules (sections 3.5, 5), plus the back-test over the last year | Unit tests for rules R1 to R7 (including a fake 20% jump and a fake stale date), for the 2-point buffer, and for the US override. The back-test table is committed for Ali to review |
| 3 | Scheduled jobs and the single KV key with write-only-if-changed | Test: running the job twice with the same data causes exactly one write |
| 4 | Public read route with cache headers | Response under 12 KB, correct headers, works when KV is empty |
| 5 | UI: strip, view switch, detail panel, table, all states in 6.6 | Visual check in English and Farsi (right-to-left), phone and desktop widths |
| 6 | Wording and context text (sections 7, 8) in both languages | All 14 markets present in both languages, Persian digits and Jalali date in Farsi |
| 7 | Accessibility pass (6.8) | Keyboard-only walkthrough; no meaning carried by colour alone |
| 8 | Budget test | Simulated 24 hours: 3 or fewer KV writes, a few reads, 14 provider calls per run, no subrequest over 50 |
| 9 | Hero integration (5.3) | Section signal appears in the transparent count and in alerts when raised |

**Finish line:** all steps pass, the section works with the provider keys missing (shows the "being prepared" state, never errors), and the data-check file records the KV usage after one week live.

## 10. Risks to keep in mind
- **Provider drift:** Yahoo can change or block at any time. That is why it is only the fallback, and why stale data is labelled instead of hidden.
- **Licence:** both free sources are personal-use. Fine for today's non-commercial site with credit given; revisit before Currena earns money (D1).
- **Thin free quota:** EODHD free has 6 spare calls per day. The retry job only re-fetches failed markets to protect it.
- **Holidays:** a market can be closed for days. Each tile shows its own last-close date, so this is never a bug.
