# Currena Insights — "World currencies" section

**Status:** v1.2 · layout direction B chosen by Ali on 2026-10-12; interface audited with uiux-mentor the same day (section 9.1 lists the three decisions); currency list and hero-count feed approved
**Repo:** assadigit/Currena (Cloudflare Workers) · suggested path: `docs/specs/insights-world-currencies.md`
**Companion spec:** `docs/specs/insights-world-markets.md` (stock markets). This section reuses its components, its stored-data pattern, its two-tier status wording and its Persian rules.
**Audience for this file:** Ali (decisions) and the agentic coding session (build).

How to read: **DECIDE** = needs Ali's answer. **VERIFY** = the build agent must test it live, because these provider calls could not be run while writing this spec.

---

## 0. What this section is (and is not)

Ali's brief: this is **not a price table**. It must say **what the currency moves mean**, using rules and repeating connections between currencies, and it must only cover currencies whose rise or fall **affects the world**, plus the Australian dollar.

So the section has two layers:
1. **The verdict layer (the main part):** a small set of well-known currency patterns ("rules"). Each rule looks at the numbers and says: Warning, Watch, Supportive or Quiet, in one plain sentence, with the reason the pattern exists, when it appeared before, and what it means for the reader.
2. **The numbers layer:** the pair changes sit **inside each pattern** (only the pairs that pattern uses), plus one table of all pairs behind a button. The four periods **Today, 1 month, 3 months, 1 year** are shown as columns, so there is no period switch.

Verdicts come first on the page. The numbers support them.

Honesty rule for the whole section: these patterns are **tendencies, not laws**. The section checks whether each pattern has actually been working lately ("pattern check", section 6.4) and says so on screen.

---

## 1. Decisions and assumptions

| # | Item | Status |
|---|---|---|
| A1 | Main job: a mix, world mood first, with the Australian dollar and its links highlighted | Assumed from my proposal; Ali emphasised analysis and verdicts, which fits |
| A2 | Existing currency cards (USD/JPY, EUR/USD, USD/CNY, the dollar measure) stay where they are because they feed the verdict. The new section reuses the same stored data and adds no extra API calls | Assumed |
| A3 | Layout: **direction B, chosen by Ali.** Patterns first, each with its own chart and pair numbers inside it; all pairs in one table behind a button. No tile strip, no period switch | **Decided** |
| A4 | Free licences, end-of-day data, non-commercial site | Same as the stock section |
| A5 | The section signal feeds the hero count, like the stock section | **Approved by Ali** |
| A6 | All seven patterns live inside the currency section (no shared cross-section "combinations" block for now) | Assumed with direction B; tell me if the mixed patterns should move |
| A7 | On quiet days the patterns area shows the one pattern closest to its warning, with a small distance bar | Assumed (my recommendation) |
| V1 | Status words: patterns show only **Active, Watching or Quiet**. The page's own chips carry severity. Reliability is shown by the 13 dots, not by labels | **Decided by Ali** |
| V2 | A pattern card opens **short** (sentence, chart, 13 dots). The explanation and the numbers sit one tap deeper | **Decided by Ali** |
| V3 | Each section's verdict **names what it measures**, and the hero count shows the stock and currency sections as two separate indicators | **Decided by Ali** |
| D1 | Currency list (section 2): 7 currencies, Canadian dollar left out | **Approved by Ali** |
| D2 | The weights of Currena's own dollar measure (section 3.2) | **Approved by Ali** (defaults; the agent reuses an existing measure if one is already built) |
| D3 | Rule thresholds (section 6.3) | Starting values, tuned after the evidence run (build step 3). Ali approves the final numbers |

---

## 2. Which currencies, and why

**In scope (7):** US dollar (USD), euro (EUR), Japanese yen (JPY), British pound (GBP), Swiss franc (CHF), Chinese yuan (CNY), Australian dollar (AUD, Ali's home currency, always included).

Why these: they are among the most traded currencies in the Bank for International Settlements 2025 survey, and each plays a role other markets react to: the dollar is on one side of almost 9 in 10 trades, the euro is the second pillar, the yen is the world's cheap borrowing currency, the franc is a classic safe haven, the pound anchors London's trading hub, and the yuan's pairing with the dollar has become one of the three busiest pairs in the world.

**Left out on purpose:**
- **Canadian dollar:** mostly a US–Canada oil story. It can be added later.
- **New Zealand dollar, Hong Kong dollar (pegged to the US dollar):** little extra signal.
- **Emerging-market and regional currencies** (Korean won, Indian rupee, Mexican peso, Brazilian real, Turkish lira and so on): they mostly reflect domestic conditions. Their world effect already shows up through the dollar, the yuan and the stock markets.
- **Iranian rial and toman:** not a world signal. They stay in the existing live-rates part of Currena.

---

## 3. Pairs and the dollar measure

### 3.1 The 10 pairs
Pairs are shown in market-standard order. A **positive change means the first currency got stronger against the second**. The interface always says this in words (for example "Euro +1.2% vs US dollar"), so nobody has to read pair maths.

| id | Pair | Group | Why it is here (the reason) |
|---|---|---|---|
| eurusd | EUR/USD | Dollar vs the world | The world's busiest pair, about 21% of all currency trading (BIS 2025). The two biggest economic blocs |
| usdjpy | USD/JPY | Dollar vs the world | The yen is the world's main cheap-borrowing currency and a safe haven. Sharp moves have shaken stock markets |
| gbpusd | GBP/USD | Dollar vs the world | The pound is the fourth most traded currency (about 10% of trading). Mostly context for the dollar measure; rarely a world alarm on its own |
| usdchf | USD/CHF | Dollar vs the world | The franc is a classic safe haven. Shows whether worried investors prefer the franc or the dollar |
| usdcny | USD/CNY | Dollar vs the world | One of the three busiest pairs (about 8% of trading). The yuan is steered by China's central bank, so big moves are deliberate signals |
| audusd | AUD/USD | Dollar vs the world | Ali's home pair. Follows China's demand, commodity prices and the world's appetite for risk |
| audjpy | AUD/JPY | Warning lights | The classic "risk-measuring pair". Falls when investors get nervous |
| eurjpy | EUR/JPY | Warning lights | A second opinion on world mood. Confirms or questions what AUD/JPY says |
| eurchf | EUR/CHF | Warning lights | Europe's safe-haven pair. Falls when worry about Europe rises |
| audcny | AUD/CNY | Australia–China link | The Australian dollar against its biggest customer's currency |

### 3.2 The dollar measure (headline row)
"Dollar vs the world": Currena's own weighted measure of the US dollar against EUR, JPY, GBP, CNY, CHF and AUD. It is **not** the official dollar index (DXY).
- **VERIFY first:** the repo may already contain the "fresher dollar measure" computed from the currency data Currena already pulls (an earlier decision). If so, **reuse it exactly** and only add what is missing. Do not build a second one.
- If it does not exist, compute it as a weighted geometric average of the dollar's moves, rebased to 100 at the start of the data. Up means a stronger dollar.
  `measure = 100 × Π ( USDX_t / USDX_0 ) ^ weight_X`, where USDX is units of currency X per 1 US dollar.
- Default weights (approved, kept in the config block): EUR 0.40, JPY 0.20, GBP 0.15, CNY 0.15, CHF 0.05, AUD 0.05. This follows the idea of the official index, which is dominated by the euro, yen and pound, with the yuan added because of its weight in world trade.
- Label it clearly as Currena's measure.

---

## 4. Data

### 4.1 Principles
1. **One daily refresh per weekday.** The page is for understanding, so end-of-day values are enough.
2. **Reuse first.** Before adding any API call, the agent checks what currency data Currena already stores. If it already has about 400 daily points for these currencies from a reliable source, use it and add only what is missing.
3. **The page never calls a provider.** Only the scheduled job does. Visitors read one stored copy.
4. **All 10 pairs come from one request.** Crosses (EUR/JPY, AUD/JPY, EUR/CHF, AUD/CNY) are calculated in code from the dollar rates, so there is no extra call.

### 4.2 Providers

| Role | Provider | How | Notes (checked October 2026) |
|---|---|---|---|
| **Primary** | Frankfurter (European Central Bank reference rates) | One time-series request with the dollar as base: `https://api.frankfurter.dev/v1/{start}..?base=USD&symbols=EUR,JPY,GBP,CHF,CNY,AUD` with `start` = about 400 days ago | Free, no key, no documented rate cap (fair use). History back to 1999. Official central-bank rates, published once per working day around 16:00 Central European Time. Weekends and holidays repeat the last published rate. Not tradable quotes |
| **Fallback** | Yahoo Finance chart endpoint | `https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=1y&interval=1d`. Symbols: `EURUSD=X`, `JPY=X` (USD/JPY), `GBPUSD=X`, `CHF=X` (USD/CHF), `CNY=X` (USD/CNY), `AUDUSD=X`, `EURJPY=X`, `AUDJPY=X`, `EURCHF=X`, `AUDCNY=X` | Unofficial, can be blocked or change, personal use. 10 calls. Used only if the primary fails |
| Manual spot-check | FRED (US Federal Reserve daily rates): `DEXUSEU`, `DEXJPUS`, `DEXUSUK`, `DEXSZUS`, `DEXCHUS`, `DEXUSAL` | For the build agent's one-off comparison only | Updated weekly, so never used live |

**Pin the version.** Frankfurter's `v1` is the frozen ECB-only version. The newer `v2` blends rates from 50+ central banks, which would change the numbers. **VERIFY** that `v1` still answers. If it is gone, use v2 with the ECB as the chosen provider and record that in the data-check file.

**Why not EODHD here:** the free EODHD key allows 20 calls per day in total, and the stock section already uses 14 of them.

**What "Today" means:** change since the previous day's ECB reference rate. Label the data "ECB reference rate, once a day" in the footer.

### 4.3 Validation (the accuracy guard)
| Rule | If it fails |
|---|---|
| V1. Rate is a number greater than 0 | Reject, use the fallback |
| V2. New date is not older than the stored date | Reject |
| V3. A one-day move of more than 5% in any pair | Hold the old value and ask the fallback. Accept only if both agree within 0.5% (real moves of that size are very rare) |
| V4. At least 200 daily points returned for every currency | Reject, use the fallback |
| V5. If both providers were used the same day, latest values agree within 0.5% | Show the primary value, log a warning |
| V6. Last date is more than 5 calendar days old | Mark `stale = true` (the UI shows "Old data") |
| V7. Never show zero, blank or NaN | Show the last good value with its date |

### 4.4 Schedule
- **Main run:** weekdays at 17:00 UTC (after the ECB's afternoon publication in both summer and winter time).
- **Retry:** weekdays at 19:00 UTC, only for pairs that are missing or stale.
- **Cron slots:** the free plan allows 5 cron triggers per account, and the stock section already uses 2. **VERIFY** how many are free.
  - If 2 are free: give this section its own two triggers (best: failures and CPU time stay isolated).
  - If not: run this job inside the stock section's two triggers as a separate function with its own error handling, and log CPU time. If a CPU-limit error ever appears, move this job to its own trigger.

---

## 5. Cloudflare free-tier budget

Limits (Cloudflare documentation, October 2026): KV reads 100,000 per day · KV writes 1,000 per day · same key 1 write per second · subrequests 50 per invocation · cron triggers 5 per account · CPU 10 ms per invocation on the free plan.

| Resource | This section | Free limit | Share |
|---|---|---|---|
| KV writes per day | 1 normal write + at most 2 retries = **3 or fewer**, and only when the data changed | 1,000 | about 0.3% |
| KV reads per day (visitors) | 1 key, with a 1-hour edge cache in front | 100,000 | under 1% |
| KV reads per day (the scheduled job) | a handful (this section's old copy, the stock key, and the few existing indicator keys the rules need) | 100,000 | negligible |
| Provider calls per run | 1 (Frankfurter); 10 more only on fallback | 50 per invocation | within |
| Cron triggers | 0 to 2 new (see 4.4) | 5 per account | check |

### Rules
1. **One KV key for the section** (`insights:fx:v1`). No per-pair keys, no `list()`.
2. **Write only if the content changed** (compare a hash).
3. **All analysis is done in the scheduled job.** The page route just returns the stored result. It never reads the other indicator keys.
4. **Cache the public route:** `Cache-Control: public, max-age=300, s-maxage=3600`.
5. **Weekly closes only** (52 points per pair) are stored for charts and pattern checks, not daily history. Each pattern also stores 26 weekly points per chart line (rebased to 100) and its 13 weekly agree/not-agree flags. The whole object should stay around 14 KB.
6. **Escape hatch:** if KV ever gets tight, move this key to D1 or R2 (much larger free write allowances).
7. After one week live, check the KV metrics in the Cloudflare dashboard. Target: this section stays under 1% of reads and 1% of writes. Record the numbers in the data-check file.

### Stored object (value of `insights:fx:v1`)
```json
{
  "v": 1,
  "generated_at": "2026-10-13T17:01:10Z",
  "dollar_measure": { "as_of": "2026-10-12", "value": 0, "chg": { "d1": 0.0, "m1": 0.0, "m3": 0.0, "y1": 0.0 }, "weekly": [0] },
  "pairs": [
    {
      "id": "eurusd",
      "as_of": "2026-10-12",
      "rate": 0,
      "chg": { "d1": 0.0, "m1": 0.0, "m3": 0.0, "y1": 0.0 },
      "move_rank": 0,
      "big_move": false,
      "source": "frankfurter | yahoo",
      "stale": false,
      "weekly": [0]
    }
  ],
  "rules": [
    {
      "id": "r1_risk_mood",
      "outcome": "warning | watch | supportive | quiet | nodata",
      "counted": true,
      "numbers": { "audjpy_m1": 0.0, "sp500_m1": 0.0 },
      "confirmed_by": ["eurjpy"],
      "progress": 0,
      "legs": [ { "name": "audjpy_m1", "value": 0.0, "line": -3.0, "met": false }, { "name": "sp500_m1", "value": 0.0, "line": -2.0, "met": false } ],
      "pattern": { "status": "holding | mixed | not_holding | nodata", "agree_weeks": 0, "of_weeks": 13, "weeks": [true] },
      "chart": { "expect": "together | opposite", "series": [ { "id": "audjpy", "points": [0] }, { "id": "sp500", "points": [0] } ] }
    }
  ],
  "summary": { "signal": "normal | attention | unusual", "counted_warnings": 0, "headline_rule": "r1_risk_mood | null" }
}
```
All zeros are schema placeholders. Real values come from the providers.

---

## 6. The analysis engine (the verdict layer)

All of this runs in the scheduled job. No AI is called at runtime. The wording comes from fixed templates (section 7) filled with the numbers.

### 6.1 Changes
For each pair and the dollar measure, calculate the change over **1 day, 1 month, 3 months and 1 year**: last value versus the last value on or before the same date one period earlier. Positive means the first currency (or the dollar) got stronger.

### 6.2 "Unusually large move" tag
Each pair is judged against **its own past year**, so a calm pair and a jumpy cross are treated fairly. `move_rank` = the share of rolling one-month moves in the last 365 days that are smaller than today's one-month move (ignoring direction). If `move_rank` is 90 or more, the pair gets the tag "Unusually large move" in the pairs table and in its detail panel.

### 6.3 The seven rules
Each rule has up to four outcomes:
- **Warning** (counts toward the section signal)
- **Watch** (one part of the pattern is present, the rest has not confirmed; does not count)
- **Supportive** (the healthy side of the same pattern)
- **Quiet** (nothing to say)
- **No data** (an input from another section is missing or stale; the rule says so and never guesses)

These outcome names are internal: the engine stores and tests them under these names. On screen they appear as **Active / Watching / Quiet** plus the page's severity chips (section 9.3).

Other-section inputs (S&P 500, Nikkei 225, Euro Stoxx 50 from the stock key; gold and the VIX status from the existing indicator data) are **read from what is already stored**. The agent finds where they live. No new API calls.

All numbers below are starting values, in the config block:
```
# ---- CONFIGURATION (World currencies) ----
CURRENCIES        = USD, EUR, JPY, GBP, CHF, CNY, AUD
HISTORY_DAYS      = 400
DOLLAR_WEIGHTS    = EUR 0.40, JPY 0.20, GBP 0.15, CNY 0.15, CHF 0.05, AUD 0.05
BIG_MOVE_PERCENTILE = 90
R1_AUDJPY_M1_WARN = -3.0    R1_SP500_M1_WARN = -2.0    R1_AUDJPY_M1_OK = +2.0    R1_SP500_M1_OK = 0.0
R1_CONFIRM_EURJPY_M1 = -3.0
R2_USDJPY_M1_WARN = -4.0    R2_NIKKEI_M1_WARN = -3.0   R2_USDJPY_M3_PRESSURE = +6.0
R3_DOLLAR_M3_STRONG = +4.0  R3_DOLLAR_M3_WEAK = -4.0
R4_DOLLAR_M1_UP = +2.0      R4_SP500_M1_DOWN = -3.0    R4_DOLLAR_M1_DOWN = -2.0   R4_GOLD_M1_UP = +3.0
R5_USDCNY_M3_WEAK = +2.0    R5_AUDUSD_M3_FALL = -2.0   R5_USDCNY_M3_FIRM = -1.5   R5_AUDUSD_M3_RISE = +2.0
R6_EURCHF_M1_WARN = -2.0    R6_EUROSTOXX_M1_WARN = -2.0
R7_EURUSD_M1_MOVE = 2.5     R7_DOLLAR_FOLLOWS = 1.5    R7_DOLLAR_QUIET = 1.0
PATTERN_WEEKS = 13          PATTERN_HOLDING_MIN = 9    PATTERN_MIXED_MIN = 7
VERDICT_ATTENTION_COUNT = 1 VERDICT_UNUSUAL_COUNT = 3
# -------------------------------------------
```
(All "M1" = 1-month change in percent, "M3" = 3-month change.)

| Rule | Name | Warning | Supportive | Watch |
|---|---|---|---|---|
| **R1** | Nervous or relaxed? | AUD/JPY M1 ≤ −3.0 **and** (S&P 500 M1 ≤ −2.0 **or** VIX status is Needs attention or worse) | AUD/JPY M1 ≥ +2.0 **and** S&P 500 M1 ≥ 0 | AUD/JPY M1 ≤ −3.0 but stocks and VIX do not confirm. If EUR/JPY M1 ≤ −3.0 too, add "confirmed by EUR/JPY" to any Warning or Watch |
| **R2** | Yen carry trade | USD/JPY M1 ≤ −4.0 **and** Nikkei 225 M1 ≤ −3.0 (the yen is jumping while Japanese stocks fall) | none | USD/JPY M3 ≥ +6.0 (the yen is falling fast; "intervention risk") |
| **R3** | Strong or weak dollar | Dollar measure M3 ≥ +4.0 | Dollar measure M3 ≤ −4.0 | none |
| **R4** | Where does money hide? | "Flight to the dollar": dollar M1 ≥ +2.0 **and** S&P 500 M1 ≤ −3.0. **"Confidence wobble" (forces the section to Unusual):** dollar M1 ≤ −2.0 **and** S&P 500 M1 ≤ −3.0 **and** gold M1 ≥ +3.0 | none | none |
| **R5** | China link | USD/CNY M3 ≥ +2.0 **and** AUD/USD M3 ≤ −2.0 | USD/CNY M3 ≤ −1.5 **and** AUD/USD M3 ≥ +2.0 | one of the two conditions only |
| **R6** | Europe worry | EUR/CHF M1 ≤ −2.0 **and** Euro Stoxx 50 M1 ≤ −2.0 | none | EUR/CHF M1 ≤ −2.0 alone (Swiss central bank moves can cause this) |
| **R7** | Dollar or euro? | Context only, never a warning. If EUR/USD M1 moves 2.5% or more: "dollar-led" if the dollar measure moved the same way by 1.5% or more, "euro-led" if the dollar measure moved less than 1.0% | | |

### 6.4 Pattern check ("is the usual pattern working lately?")
Each rule with a partner series gets a quick health check over the **last 13 weeks** (using the stored weekly closes): count the weeks in which the two series moved the way the pattern says (weeks with no change are skipped).

| Rule | Expected behaviour over the weeks |
|---|---|
| R1 | AUD/JPY and S&P 500 move in the **same** direction |
| R2 | USD/JPY and Nikkei 225 move in the **same** direction |
| R3 | Dollar measure and gold move in **opposite** directions |
| R5 | AUD/USD and USD/CNY move in **opposite** directions |
| R6 | EUR/CHF and Euro Stoxx 50 move in the **same** direction |

Labels: **Holding** = 9 or more of 13 weeks · **Mixed** = 7 or 8 · **Not holding lately** = 6 or fewer.
- On screen, reliability is shown by the 13 dots and the count ("Held in 10 of the last 13 weeks"), not by a label. Only a downgrade adds a caution line.
- A rule that is **Warning but Not holding lately** is downgraded to **Watch** and does not count. The row says: "The usual pattern has not been reliable lately."
- 13 weeks is a short window. This is a quick health check, not a statistical test, and the footer says so.
- Store each of the 13 weekly results (agreed or not) so the interface can draw the 13 dots. Weeks with no change are stored as "skipped" and drawn as a small dash.

### 6.5 Section verdict (feeds the hero count)
Count the **counted Warnings**.

| Signal | Rule |
|---|---|
| Normal | 0 counted Warnings |
| Needs attention | 1 or 2 counted Warnings |
| Unusual | 3 or more counted Warnings, **or** "Confidence wobble" (R4) is active |

The headline sentence names the most serious active rule (section 9). The signal uses the same two-tier tokens and chip wording as the stock section and the rest of the page. Active Warnings also appear in the existing named-alerts block, using the existing mechanism (no new card).

### 6.6 Evidence run (one-off, build step 3, not at runtime)
The thresholds above are starting points, so the agent tests them against history before the UI is built. On Ali's own computer (or in the agent's sandbox), pull **10 years of daily data**: currencies from Frankfurter (one call reaches back to 1999), and the S&P 500, Nikkei 225, Euro Stoxx 50 and gold from Yahoo as a one-off (not from the free EODHD quota). Then for each rule report:
1. How many separate times it hit **Warning**, and the share of days spent in Warning (target: well under 15%; a rule that is almost always on, or never on, is useless).
2. After each Warning, what the S&P 500 did over the next month (how many times it was lower, and the middle result).
3. Whether the known episodes show up: 2008, the euro crisis of 2010–2012, 2015, 2018–2019, March 2020, 2022, August 2024, April 2025.
4. How often the 13-week pattern check was Holding, Mixed and Not holding.
The agent writes this into `docs/specs/insights-world-currencies-evidence.md` and **pauses for Ali** with proposed changes to any threshold. The evidence table is for tuning. Showing "this has appeared N times in 10 years" on screen is an optional later improvement.

### 6.7 Distance to warning (what quiet days show)
Each rule except R7 stores a `progress` number from 0 to 100: how far its **main leg** has moved toward its warning line. 0 means no move, 100 means the line has been reached. The main leg is the first entry in `legs`, and the same entries feed the "warning line" row on the card.
- Main legs: R1 = AUD/JPY 1-month change · R2 = USD/JPY 1-month change · R3 = dollar measure 3-month change (toward whichever side is nearer) · R4 = S&P 500 1-month change · R5 = USD/CNY 3-month change · R6 = EUR/CHF 1-month change.
- `progress = clamp( value ÷ warn_at × 100 , 0 , 100 )`, counting only moves in the warning direction.
- A rule at 100 on its main leg but missing its confirmation is **Watch**, not Quiet.
- The quiet area shows the Quiet rule with the highest `progress` as "closest to warning". Expanding it lists all quiet rules with their bars. This makes the rules transparent and keeps the section useful on calm days.

---

## 7. Rule content (English and Persian)

Every verdict is a **two-part sentence**: **what we see** (the real numbers) and **what it usually means** (the interpretation, always hedged with words like "usually", "often" or "points to"). Splitting them keeps the page honest: the numbers are fact, the meaning is a tendency.

Placeholders: `{x}`, `{y}`, `{g}`, `{d}` are move sizes in percent (no sign, one decimal; the sentence carries the direction word). `{stocks}` and `{leg}` are short phrases chosen by which part of the rule was met:
- `{stocks}` (R1 Warning): "the S&P 500 is down {y}%" or "market fear (the VIX) is elevated" · FA: «اس‌اندپی ۵۰۰ {y} درصد افت کرده است» or «شاخص ترس بازار (VIX) بالا است».
- `{leg}` (R5 Watch): "the yuan is down {x}% against the US dollar" or "the Australian dollar is down {y}% against the US dollar" · FA: «یوان {x} درصد در برابر دلار آمریکا تضعیف شده» or «دلار استرالیا {y} درصد در برابر دلار آمریکا تضعیف شده».

The headings below use the rule's internal outcome names (Warning, Supportive, Watch). On screen they appear as **Active** (with a severity chip) or **Watching** (section 9.3). The "why it works", "seen before" and "for you" lines sit **one tap deeper** in the card (Level 3). The words "a tendency, not a prediction" appear once in the section footer.

### R1 · Nervous or relaxed? · نگران یا آرام؟

- **Warning — we see (EN):** The Australian dollar is down {x}% against the yen over the past month, while {stocks}.
- **Warning — usually means (EN):** This usually goes with nervous investors.
- **Warning — we see (FA):** دلار استرالیا در یک ماه گذشته {x} درصد در برابر ین تضعیف شده، در حالی که {stocks}.
- **Warning — usually means (FA):** این معمولاً با نگرانی سرمایه‌گذاران همراه است.
- **Supportive — we see (EN):** The Australian dollar is up {x}% against the yen over the past month, and the S&P 500 is up {y}%.
- **Supportive — usually means (EN):** This usually goes with relaxed investors who are willing to take risk.
- **Supportive — we see (FA):** دلار استرالیا در یک ماه گذشته {x} درصد در برابر ین تقویت شده و اس‌اندپی ۵۰۰ {y} درصد رشد کرده است.
- **Supportive — usually means (FA):** این معمولاً با آرامش سرمایه‌گذاران و تمایل آن‌ها به ریسک‌پذیری همراه است.
- **Watch — we see (EN):** The Australian dollar is down {x}% against the yen over the past month, but stocks have not followed yet.
- **Watch — usually means (EN):** If stocks join in, it would point to nervous investors.
- **Watch — we see (FA):** دلار استرالیا در یک ماه گذشته {x} درصد در برابر ین تضعیف شده، اما سهام هنوز همراه نشده است.
- **Watch — usually means (FA):** اگر سهام هم همراه شود، نشانهٔ نگرانی سرمایه‌گذاران خواهد بود.
- **Why (EN):** Investors borrow cheap yen to buy higher-paying assets like the Australian dollar. When fear rises they sell those assets and buy yen back, so the pair falls.
- **Why (FA):** سرمایه‌گذاران ین ارزان قرض می‌گیرند تا دارایی‌های پربازده‌تری مثل دلار استرالیا بخرند. وقتی ترس بالا می‌گیرد، آن‌ها را می‌فروشند و ین را پس می‌خرند؛ پس این جفت ارز افت می‌کند.
- **Seen before (EN):** 2008, August 2024, April 2025.
- **Seen before (FA):** ۲۰۰۸، اوت ۲۰۲۴، آوریل ۲۰۲۵.
- **For you (EN):** Nervous periods often come with falling share prices and retirement balances. A weaker Australian dollar also makes imports and overseas travel dearer.
- **For you (FA):** دوره‌های نگرانی اغلب با افت قیمت سهام و حساب‌های بازنشستگی همراه است. ضعیف‌شدن دلار استرالیا هم واردات و سفر خارجی را گران‌تر می‌کند.
- **Confirmation line (EN / FA):** Confirmed by the euro against the yen. / با افت یورو در برابر ین هم تأیید شده است.

### R2 · Yen carry trade · کری ترید ین

- **Warning (carry-trade unwind) — we see (EN):** The yen is up {x}% against the US dollar over the past month, while Japanese stocks (Nikkei 225) are down {y}%.
- **Warning (carry-trade unwind) — usually means (EN):** This often means carry trades are being unwound, as in August 2024.
- **Warning (carry-trade unwind) — we see (FA):** ین در یک ماه گذشته {x} درصد در برابر دلار آمریکا تقویت شده، در حالی که سهام ژاپن (نیکی ۲۲۵) {y} درصد افت کرده است.
- **Warning (carry-trade unwind) — usually means (FA):** این اغلب یعنی معاملات کری ترید در حال برچیده شدن است، مثل اوت ۲۰۲۴.
- **Watch (yen under pressure) — we see (EN):** The yen is down {x}% against the US dollar over the past three months.
- **Watch (yen under pressure) — usually means (EN):** Japan has stepped in to support the yen after sharp falls before (2022, 2024), and a sudden reversal can shake markets.
- **Watch (yen under pressure) — we see (FA):** ین در سه ماه گذشته {x} درصد در برابر دلار آمریکا تضعیف شده است.
- **Watch (yen under pressure) — usually means (FA):** ژاپن پیش‌تر پس از افت‌های شدید برای حمایت از ین وارد بازار شده است (۲۰۲۲ و ۲۰۲۴) و بازگشت ناگهانی می‌تواند بازارها را بلرزاند.
- **Why (EN):** Japan's very low interest rates make the yen the cheapest money to borrow. When the yen jumps, borrowers rush to repay, which forces sales of shares and other assets worldwide.
- **Why (FA):** نرخ بهرهٔ بسیار پایین ژاپن، ین را به ارزان‌ترین پول برای قرض گرفتن تبدیل کرده است. وقتی ین جهش می‌کند، وام‌گیرندگان برای بازپرداخت عجله می‌کنند و این فروش سهام و دارایی‌ها را در سراسر جهان به دنبال دارد.
- **Seen before (EN):** 2008, August 2024.
- **Seen before (FA):** ۲۰۰۸، اوت ۲۰۲۴.
- **For you (EN):** A yen jump can pull down share markets and crypto at the same time, even when nothing is wrong locally.
- **For you (FA):** جهش ین می‌تواند هم‌زمان بازار سهام و ارز دیجیتال را پایین بکشد، حتی اگر در محل مشکلی نباشد.

### R3 · Strong or weak dollar · دلار قوی یا ضعیف

- **Warning — we see (EN):** The US dollar is up {x}% against the big currencies over the past three months.
- **Warning — usually means (EN):** A strong dollar usually makes money harder to get around the world.
- **Warning — we see (FA):** دلار آمریکا در سه ماه گذشته {x} درصد در برابر ارزهای بزرگ تقویت شده است.
- **Warning — usually means (FA):** دلار قوی معمولاً تأمین مالی را در سراسر جهان سخت‌تر می‌کند.
- **Supportive — we see (EN):** The US dollar is down {x}% against the big currencies over the past three months.
- **Supportive — usually means (EN):** A weaker dollar usually makes money easier to get around the world.
- **Supportive — we see (FA):** دلار آمریکا در سه ماه گذشته {x} درصد در برابر ارزهای بزرگ تضعیف شده است.
- **Supportive — usually means (FA):** دلار ضعیف‌تر معمولاً تأمین مالی را در جهان آسان‌تر می‌کند.
- **Why (EN):** Oil, gold and much of the world's debt are priced or borrowed in dollars. When the dollar rises they cost more for everyone else, which usually pressures gold, commodities and emerging markets.
- **Why (FA):** نفت، طلا و بخش بزرگی از بدهی‌های جهان با دلار قیمت‌گذاری یا وام‌گرفته می‌شود. وقتی دلار بالا می‌رود برای بقیهٔ دنیا گران‌تر تمام می‌شود و معمولاً به طلا، کالاها و بازارهای نوظهور فشار می‌آورد.
- **Seen before (EN):** 2022 (strong dollar), 2017 (weak dollar).
- **Seen before (FA):** ۲۰۲۲ (دلار قوی)، ۲۰۱۷ (دلار ضعیف).
- **For you (EN):** A strong US dollar usually means a weaker Australian dollar, so imports and overseas travel cost more.
- **For you (FA):** دلار آمریکای قوی معمولاً یعنی دلار استرالیای ضعیف‌تر؛ پس واردات و سفر خارجی گران‌تر می‌شود.

### R4 · Where does money hide? · پول به کجا پناه می‌برد؟

- **Warning (flight to the dollar) — we see (EN):** The S&P 500 is down {y}% over the past month, while the US dollar is up {x}%.
- **Warning (flight to the dollar) — usually means (EN):** In a scare, money usually runs to the dollar.
- **Warning (flight to the dollar) — we see (FA):** اس‌اندپی ۵۰۰ در یک ماه گذشته {y} درصد افت کرده، در حالی که دلار آمریکا {x} درصد تقویت شده است.
- **Warning (flight to the dollar) — usually means (FA):** در زمان وحشت معمولاً پول به سمت دلار می‌گریزد.
- **Unusual (confidence wobble) — we see (EN):** Over the past month the S&P 500 is down {y}%, the US dollar is down {x}% and gold is up {g}%.
- **Unusual (confidence wobble) — usually means (EN):** Money is leaving the dollar as well as stocks, which is unusual (seen in April 2025).
- **Unusual (confidence wobble) — we see (FA):** در یک ماه گذشته اس‌اندپی ۵۰۰ {y} درصد افت کرده، دلار آمریکا {x} درصد تضعیف شده و طلا {g} درصد بالا رفته است.
- **Unusual (confidence wobble) — usually means (FA):** پول از دلار هم مثل سهام خارج می‌شود که غیرمعمول است (مثل آوریل ۲۰۲۵).
- **Why (EN):** In a fright the dollar is normally the safe place to be. When it fails at that job, investors are doubting something deeper, such as US policy or US debt.
- **Why (FA):** در زمان ترس معمولاً دلار پناهگاه امن است. وقتی این نقش را از دست می‌دهد، سرمایه‌گذاران به چیزی عمیق‌تر مثل سیاست‌ها یا بدهی آمریکا شک کرده‌اند.
- **Seen before (EN):** March 2020 and 2022 (usual pattern), April 2025 (unusual).
- **Seen before (FA):** مارس ۲۰۲۰ و ۲۰۲۲ (الگوی معمول)، آوریل ۲۰۲۵ (غیرمعمول).
- **For you (EN):** When money leaves stocks and the dollar together, gold often rises.
- **For you (FA):** وقتی پول هم‌زمان از سهام و دلار خارج می‌شود، طلا اغلب بالا می‌رود.

### R5 · China link · پیوند با چین

- **Warning — we see (EN):** Over the past three months the yuan is down {x}% and the Australian dollar is down {y}% against the US dollar.
- **Warning — usually means (EN):** This often points to worry about China's demand.
- **Warning — we see (FA):** در سه ماه گذشته یوان {x} درصد و دلار استرالیا {y} درصد در برابر دلار آمریکا تضعیف شده‌اند.
- **Warning — usually means (FA):** این اغلب نشانهٔ نگرانی دربارهٔ تقاضای چین است.
- **Supportive — we see (EN):** Over the past three months the yuan is up {x}% and the Australian dollar is up {y}% against the US dollar.
- **Supportive — usually means (EN):** China's demand looks supportive.
- **Supportive — we see (FA):** در سه ماه گذشته یوان {x} درصد و دلار استرالیا {y} درصد در برابر دلار آمریکا تقویت شده‌اند.
- **Supportive — usually means (FA):** تقاضای چین حمایتگر به نظر می‌رسد.
- **Watch — we see (EN):** Only one of the two has moved so far: {leg}.
- **Watch — usually means (EN):** If both move together, it often points to China's demand.
- **Watch — we see (FA):** فقط یکی از این دو تاکنون حرکت کرده است: {leg}.
- **Watch — usually means (FA):** اگر هر دو هم‌جهت حرکت کنند، اغلب نشانهٔ وضع تقاضای چین است.
- **Why (EN):** China buys much of Australia's iron ore, so the Australian dollar tends to follow China's economy. The yuan is steered by China's central bank, so a big move is a deliberate signal.
- **Why (FA):** چین بخش بزرگی از سنگ‌آهن استرالیا را می‌خرد؛ پس دلار استرالیا معمولاً از اقتصاد چین پیروی می‌کند. یوان را بانک مرکزی چین هدایت می‌کند، پس حرکت بزرگ آن یک پیام عمدی است.
- **Seen before (EN):** 2015 (yuan devaluation), 2018–2019 (trade war).
- **Seen before (FA):** ۲۰۱۵ (کاهش ارزش یوان)، ۲۰۱۸ تا ۲۰۱۹ (جنگ تجاری).
- **For you (EN):** Weaker Chinese demand hurts Australian mining incomes, and a weaker Australian dollar raises import prices.
- **For you (FA):** ضعف تقاضای چین به درآمد معدنی استرالیا آسیب می‌زند و ضعف دلار استرالیا قیمت واردات را بالا می‌برد.

### R6 · Europe worry · نگرانی از اروپا

- **Warning — we see (EN):** The euro is down {x}% against the Swiss franc over the past month, and the Euro Stoxx 50 is down {y}%.
- **Warning — usually means (EN):** Money often moves to the franc when investors worry about Europe.
- **Warning — we see (FA):** یورو در یک ماه گذشته {x} درصد در برابر فرانک سوئیس تضعیف شده و یورو استوکس ۵۰ {y} درصد افت کرده است.
- **Warning — usually means (FA):** وقتی نگرانی از اروپا بالا می‌رود، پول اغلب به سمت فرانک می‌رود.
- **Watch — we see (EN):** The euro is down {x}% against the Swiss franc over the past month, but European shares have not followed.
- **Watch — usually means (EN):** Moves by the Swiss central bank can also cause this.
- **Watch — we see (FA):** یورو در یک ماه گذشته {x} درصد در برابر فرانک سوئیس تضعیف شده، اما سهام اروپا همراه نشده است.
- **Watch — usually means (FA):** اقدام‌های بانک مرکزی سوئیس هم می‌تواند این حرکت را ایجاد کند.
- **Why (EN):** The Swiss franc is a classic safe haven. When Europeans get nervous they buy francs, so the euro-franc pair falls.
- **Why (FA):** فرانک سوئیس پناهگاه امن کلاسیک است. وقتی اروپایی‌ها نگران می‌شوند فرانک می‌خرند و جفت یورو-فرانک افت می‌کند.
- **Seen before (EN):** the euro crisis of 2010–2012, 2015.
- **Seen before (FA):** بحران یورو در ۲۰۱۰ تا ۲۰۱۲، ۲۰۱۵.
- **For you (EN):** Trouble in Europe can spill into world share markets and weaken the euro, which matters for travel and global funds.
- **For you (FA):** مشکل در اروپا می‌تواند به بازار سهام جهان سرایت کند و یورو را ضعیف کند؛ این برای سفر و صندوق‌های جهانی اهمیت دارد.

### R7 · Dollar or euro? · دلار یا یورو؟ (context only)

- **Context (dollar-led) — we see (EN):** The euro moved {x}% against the US dollar over the past month, and the dollar moved {d}% against all the big currencies in the same direction.
- **Context (dollar-led) — usually means (EN):** That points to the dollar, which makes it a world story.
- **Context (dollar-led) — we see (FA):** یورو در یک ماه گذشته {x} درصد در برابر دلار آمریکا حرکت کرده و دلار آمریکا هم‌جهت با آن {d} درصد در برابر همهٔ ارزهای بزرگ حرکت کرده است.
- **Context (dollar-led) — usually means (FA):** این به دلار برمی‌گردد و پس یک ماجرای جهانی است.
- **Context (euro-led) — we see (EN):** The euro moved {x}% against the US dollar over the past month, while the dollar barely moved ({d}%) against the other big currencies.
- **Context (euro-led) — usually means (EN):** That points to something in Europe, such as interest rates, growth or politics.
- **Context (euro-led) — we see (FA):** یورو در یک ماه گذشته {x} درصد در برابر دلار آمریکا حرکت کرده، در حالی که دلار آمریکا در برابر ارزهای بزرگ دیگر تقریباً ثابت مانده است ({d} درصد).
- **Context (euro-led) — usually means (FA):** این به چیزی در اروپا برمی‌گردد، مثل نرخ بهره، رشد یا سیاست.
- **Why (EN):** Telling the two apart shows whether the cause is global or local.
- **Why (FA):** تشخیص این دو از هم نشان می‌دهد علت جهانی است یا محلی.

---

## 8. Context content for each pair (English and Persian)

Three short lines per pair. Persian pair names follow Iranian usage (section 10.1).

| id | Persian name | What it is / why it matters (EN) | What it is / why it matters (FA) | What it usually signals for you (EN) | (FA) |
|---|---|---|---|---|---|
| eurusd | یورو – دلار | The world's busiest pair, about a fifth of all currency trading. It follows the interest-rate gap between the US Fed and the European central bank. | پرمعامله‌ترین جفت ارز جهان، حدود یک‌پنجم کل معاملات ارز. از فاصلهٔ نرخ بهره میان فدرال رزرو آمریکا و بانک مرکزی اروپا پیروی می‌کند. | A falling euro means a stronger dollar, which usually weighs on gold. | افت یورو یعنی دلار قوی‌تر که معمولاً به طلا فشار می‌آورد. |
| usdjpy | دلار – ین | The yen is the world's main cheap-borrowing currency and a safe haven. The pair follows the interest-rate gap between the US and Japan. | ین اصلی‌ترین پول ارزان برای قرض گرفتن و یک ارز امن است. این جفت ارز از فاصلهٔ نرخ بهره آمریکا و ژاپن پیروی می‌کند. | A sudden yen jump can shake share markets worldwide. | جهش ناگهانی ین می‌تواند بازار سهام را در سراسر جهان بلرزاند. |
| gbpusd | پوند – دلار | The pound is the fourth most traded currency and London is the world's biggest trading hub. Mostly context for the dollar measure. | پوند چهارمین ارز پرمعامله جهان است و لندن بزرگ‌ترین مرکز معاملات ارز است. بیشتر زمینه‌ای برای شاخص دلار است. | A pound-only move is usually a UK story, not a world one. | حرکت فقط پوند معمولاً ماجرای بریتانیاست نه جهان. |
| usdchf | دلار – فرانک | The Swiss franc is a classic safe haven. The pair shows whether worried investors prefer the franc or the dollar. | فرانک سوئیس پناهگاه امن کلاسیک است. این جفت ارز نشان می‌دهد سرمایه‌گذاران نگران، فرانک را ترجیح می‌دهند یا دلار را. | A franc rising against the dollar can mean worry about the US specifically. | تقویت فرانک در برابر دلار می‌تواند نشانهٔ نگرانی از خود آمریکا باشد. |
| usdcny | دلار – یوان | One of the three busiest currency pairs. The yuan is steered by China's central bank, so big moves are deliberate signals about China's economy and trade. | یکی از سه جفت ارز پرمعامله. یوان را بانک مرکزی چین هدایت می‌کند؛ پس حرکت‌های بزرگ پیام‌های عمدی دربارهٔ اقتصاد و تجارت چین است. | A weaker yuan can mean weaker Chinese demand for oil, metals and Australian exports. | ضعف یوان می‌تواند یعنی تقاضای کمتر چین برای نفت، فلزات و صادرات استرالیا. |
| audusd | دلار استرالیا – دلار آمریکا | Your home pair. It follows China's demand, commodity prices and the world's appetite for risk. | جفت ارز خانگی شما. از تقاضای چین، قیمت کالاها و اشتهای جهان برای ریسک پیروی می‌کند. | A falling Australian dollar makes imports and overseas travel dearer. | افت دلار استرالیا واردات و سفر خارجی را گران‌تر می‌کند. |
| audjpy | دلار استرالیا – ین | The classic "risk-measuring pair": a growth currency against the safe-haven yen. | «جفت ارز ریسک‌سنج» کلاسیک: یک ارز رشدمحور در برابر ین، ارز امن. | A sharp fall usually means investors are getting nervous. | افت شدید معمولاً یعنی سرمایه‌گذاران نگران می‌شوند. |
| eurjpy | یورو – ین | A second opinion on world mood: Europe's money against the safe-haven yen. | نظر دوم دربارهٔ حال‌وهوای جهان: پول اروپا در برابر ین امن. | If it falls with AUD/JPY, the nervous signal is stronger. | اگر همراه با دلار استرالیا – ین افت کند، سیگنال نگرانی قوی‌تر است. |
| eurchf | یورو – فرانک | Europe's safe-haven pair: it falls when worry about Europe rises. | جفت ارز امن اروپا: وقتی نگرانی از اروپا بالا می‌رود افت می‌کند. | A fall alongside falling European shares is a warning. | افت همراه با افت سهام اروپا یک هشدار است. |
| audcny | دلار استرالیا – یوان | The Australian dollar against its biggest customer's currency. | دلار استرالیا در برابر پول بزرگ‌ترین مشتری‌اش. | Shows the China link in one number. | پیوند با چین را در یک عدد نشان می‌دهد. |
| dollar | شاخص دلار (محاسبه‌شده در Currena) | The US dollar against six big currencies (euro, yen, pound, yuan, franc, Australian dollar), by Currena's own weights. Not the official DXY. | دلار آمریکا در برابر شش ارز بزرگ (یورو، ین، پوند، یوان، فرانک، دلار استرالیا) با وزن‌های خود Currena. همان شاخص رسمی DXY نیست. | A strong dollar usually pressures gold and the Australian dollar. | دلار قوی معمولاً به طلا و دلار استرالیا فشار می‌آورد. |

---

## 9. Information architecture and layout (uiux-mentor) — direction B, audited

**Lens:** experience / product (non-commercial). **Audience:** people without finance education who need leads, not charts. **Outcome:** in 5 seconds a visitor can say whether the big currencies are showing calm or worry and which pattern says so. On a calm day they can say "calm" and name the pattern closest to a warning. After opening one card they can explain that pattern in their own words.

### 9.1 Decision record
| Option | Verdict |
|---|---|
| A. Verdict, patterns, tile strip, table | Not chosen. Five layers, tiles that cannot show a relationship, and chips that repeat the list |
| **B. Patterns first, with the pair numbers inside each pattern and all pairs in one table behind a button** | **Chosen by Ali.** Two layers instead of four. The analysis is the main content and the prices serve it |
| C. One shared "World markets" block with tabs | Not chosen. Tabs hide content, and it would reshape the stock section |

**Audit decisions (Ali, 2026-10-12)**
| Question | Decision |
|---|---|
| How many status words | **Fewer.** Patterns show only Active, Watching or Quiet. The page's own chips carry severity. Reliability is shown by the 13 dots, not by labels |
| What a card shows when it opens | **Short:** the sentence, the chart and the 13 dots. The explanation and the numbers sit one tap deeper |
| When stocks and currencies disagree | **Each verdict names what it measures,** and the hero count shows both sections as separate indicators |

**Improvements applied with the audit:** two-part verdict sentences (what we see, then what it usually means); the warning line shown on each card; the repeated "Last date" column removed (all pairs share one ECB date, shown once); a legend for which currency is "first" in a pair; end labels on the dots for right-to-left readers.

Principles: progressive disclosure, Gestalt common fate (two lines that move together are seen as one pattern), recognition over recall (dots and a chart instead of a label to decode), Hick's Law (fewer words and choices), consistency (one severity vocabulary across the page).

### 9.2 Where it sits
Attention order stays: verdict, named alerts, prices, world stock markets, **world currencies (new)**, what it means for my money, calendar. It follows the stock markets because the two sections explain each other.

### 9.3 Anatomy (top to bottom)
1. **Header row:** title, and "As of {date}" once (Jalali in Farsi).
2. **Verdict line:** the **measure label** ("Currency patterns: calm / worry signs / several warnings at once", section 9.10), the page's severity chip, and one short headline sentence (section 10.3). No chips naming the patterns, because the cards below already do.
3. **Pattern cards (the main part):**
   - **Which ones show:** patterns that are Active or Watching, most serious first: Unusual, then Needs attention, then Watching, then Active with a Normal chip (the healthy side), then context cards. Ties go by rule number. At most 3 cards are shown; the rest sit behind "{n} more patterns".
   - R7 ("Dollar or euro?") appears only when EUR/USD has moved 2.5% or more in a month.
   - **Status on screen** (engine names stay internal):

     | Engine outcome | Status word | Severity chip (the page's own) | Counts toward the section signal |
     |---|---|---|---|
     | Warning | Active | Needs attention | Yes |
     | Warning, confidence wobble (R4) | Active | Unusual | Yes, and forces the section to Unusual |
     | Supportive | Active | Normal | No |
     | Watch | Watching | none | No |
     | Context (R7) | Active | none | No |
     | Quiet | Quiet | none | No |
     | No data | "Not enough data right now" | none | No |

     If "Active · Normal" reads oddly in the visual check, show no chip on Supportive patterns and keep the sentence. Do not invent a new word.
   - **Level 1, the collapsed row:** pattern name, status word, severity chip, then the two-part sentence on two short lines: **what we see** (with the real numbers) and **what it usually means**. This looks the same on a phone and on desktop.
   - **Level 2, the opened card** (only the first card is open by default):
     1. **A two-line chart of the last 26 weeks** with the pattern's two series (R4 can show three), both starting at 100 so they can be compared. A caption says "Usually move together" or "Usually move in opposite directions". Lines are told apart by direct labels and solid vs dashed style, not by colour alone.
     2. **The warning line:** one row such as "AUD/JPY −4.1% this month · warning line −3.0%". It shows the numbers behind the sentence and how the pattern triggers. A rule with two legs shows both.
     3. **13 dots, "How the pattern held in the last 13 weeks":** a filled dot for each week it held, a hollow dot for each week it did not, a small dash for a week with no change, plus the count ("Held in 10 of the last 13 weeks"). Small end labels read "13 weeks ago" on the left and "now" on the right, in Farsi too.
     4. **A caution line** only if the pattern was downgraded: "The usual pattern has not been reliable lately."
   - **Level 3, one tap deeper** (a single toggle, "Why it works, and the numbers"): the three meaning lines (why the pattern exists, when it appeared before, what it means for you; section 7), and **"Pairs used in this pattern"**, a small table with the four periods (Today, 1 month, 3 months, 1 year) for only the pairs this pattern uses. Tapping a pair name opens its detail panel (9.4).
4. **Quiet area (collapsed):**
   - Always shows **one row: the quiet pattern closest to its warning**, with the status word "Quiet", a thin distance bar and the text value, for example "AUD/JPY −1.2% (warning at −3.0%)".
   - A toggle "{n} patterns are quiet" opens the list of all quiet patterns, each with its own bar.
   - When no pattern is active, this row is the first thing under the verdict, so the section is never empty.
5. **Dollar at a glance:** one slim row, "Dollar vs the world", with its four period changes and one meaning line.
6. **"Show all currency pairs"** (closed by default): one table of the 10 pairs.
   - Columns: Pair (in words, for example "Euro vs US dollar") · Today · 1 month · 3 months · 1 year · Trend. There is no "Last date" column, because every pair shares the ECB date shown in the header. A pair with old data gets the chip "Old data · date" beside its name.
   - A one-line legend under the header: "▲ = first currency stronger".
   - Three group rows inside the table: **Dollar vs the world · Warning lights · Australia–China**.
   - The tag "Unusually large move" sits beside a pair's name when `big_move` is true. It is the only extra tag in the section, and it lives inside the closed table.
   - One sort only: by the size of the 1-month move. CSV goes in the existing Tools menu.
   - On a phone: a list of rows showing the 1-month change; tapping a row shows all four periods.
7. **Footer line:** "ECB reference rates, once a day. A pattern is a tendency, not a prediction." The one shared page disclaimer stays in the page footer as decided.

There is no tile strip and no period switch anywhere. All four periods are columns.

### 9.4 Pair detail panel
Opens from the table or from a pattern's pair list. Three lines from section 8, a 1-year line chart from the weekly series (time left to right in Farsi too), the latest rate with its date, the four period changes, and a list of the patterns that use this pair (each links back to its card).

### 9.5 States
| State | What the person sees |
|---|---|
| Loading | Skeleton verdict line, two skeleton pattern rows, the quiet row and the dollar row, with the table button already in place |
| Never populated | One calm line: "Currency data is being prepared. Check back after the next daily update." |
| A pattern's input is missing | That pattern's row says "Not enough data right now" in grey, never a guess, and it is left out of the closest-to-warning choice |
| One pair old | Its table row shows "Old data · date" |
| Everything stale (over 5 days) | The section collapses to one line with the last update date |
| All patterns quiet | Verdict "calm", then the closest-to-warning row, then the dollar row and the table button |
| Weekend or holiday | Nothing special: the latest working-day date is shown in the header |

### 9.6 Farsi, right-to-left and numbers
- The order of blocks follows reading direction. Table columns mirror in Farsi.
- **Time always runs left to right**, inside the charts and in the 13-dot strip, as already decided for the page. The dots' end labels ("13 weeks ago" … "now") make the direction explicit.
- Numbers stay left to right inside their own span, with Persian digits and Jalali dates as on the rest of the page.
- In the Persian text always write **«دلار آمریکا»** for the US dollar the first time and **«دلار استرالیا»** for the Australian dollar, never a bare «دلار» for the Australian one.

### 9.7 Accessibility
- Pattern rows are real buttons with `aria-expanded`, and so is the Level 3 toggle. The table is a real `<table>` with `<th scope>`.
- Every chart has a text summary ("The two lines moved together in 10 of the last 13 weeks"). The dots are readable as text ("Held in 10 of the last 13 weeks"). The distance bar and the warning line always have their values in text.
- Direction is never shown by colour alone: arrow glyph, sign and words. Filled vs hollow dots, solid vs dashed lines.
- Tab order: verdict, pattern rows (each with its Level 3 toggle), quiet toggle, dollar row, table button. Touch targets are at least 44 × 44 px.
- Colour choices go to **color-palette-advisor**. The strategic rule for it: neutral ink for up and down, and the page's existing warning tokens only for Needs attention and Unusual.

### 9.8 Not in v1
A tile strip, a period switch, reliability labels (Holding / Mixed), live or intraday rates, the Canadian dollar and regional currencies, per-pair alerts, trading signals ("buy"/"sell"), the 10-year evidence counts on screen, a currency-strength ranking, and a shared cross-section "combinations" block.

### 9.9 Metrics this should move
First-glance test: a new visitor names the active pattern within 5 seconds, or on a calm day says "calm" and names the pattern closest to a warning. Understanding test: after opening one card, a visitor can explain the pattern in their own words. Secondary: the share of visitors who open at least one pattern card (learning), and the share who open the pairs table.

### 9.10 Consistency with the stock section (verdicts name what they measure)
The stock section can say "calm" (far from peaks) while a currency pattern warns (a falling AUD/JPY). Both can be true, because they measure different things. To avoid a visitor reading this as a contradiction, **every section verdict starts with a measure label**, followed by the page's severity chip:

| Section | Normal | Needs attention | Unusual |
|---|---|---|---|
| Currencies (EN) | Currency patterns: calm | Currency patterns: worry signs | Currency patterns: several warnings at once |
| Currencies (FA) | الگوهای ارزی: آرام | الگوهای ارزی: نشانه‌های نگرانی | الگوهای ارزی: چند هشدار هم‌زمان |
| Stocks (EN) | Stock markets: near their yearly highs | Stock markets: several well below their highs | Stock markets: far below their highs |
| Stocks (FA) | بازارهای سهام: نزدیک سقف یک‌ساله | بازارهای سهام: چند بازار دور از سقف یک‌ساله | بازارهای سهام: فاصلهٔ زیاد از سقف یک‌ساله |

**Hero count:** the stock section and the currency section are two separate indicators in the transparent count, each shown with its own measure label and chip. They are never merged into one. Active patterns appear in the named-alerts block with their pattern names. No special "mixed signals" line is needed, because each label says what it covers.

---

## 10. Interface wording

### 10.1 Persian terms (checked against Iranian finance websites)
Terms below follow Khane Sarmaye, Tabdeal, Arzdigital and Iran Broker (the sources used for the stock section's wording and for the currency education pages).

| Concept | Persian term to use |
|---|---|
| Currency pair | جفت ارز |
| Dollar index | شاخص دلار (DXY) |
| Safe haven | پناهگاه امن / ارز امن |
| The risk-measuring pair (AUD/JPY) | جفت ارز ریسک‌سنج |
| Carry trade / unwinding it | کری ترید / برچیده شدن معاملات کری ترید |
| Strengthen / weaken | تقویت / تضعیف |
| Exchange rate | نرخ برابری |
| Intervention by a central bank | مداخلهٔ ارزی |
| Today / 1 month / 3 months / 1 year | امروز / یک ماه / سه ماه / یک سال |
| Old data | داده قدیمی |

Cautions: in Iran «دلار» alone means the US dollar. Always add «آمریکا» or «استرالیا» as above. Use «تقویت / تضعیف» for a currency getting stronger or weaker, and keep «رشد / افت» for share markets.

### 10.2 Interface wording
| Element | English | Persian |
|---|---|---|
| Section title | World currencies | ارزهای مهم جهان |
| Subtitle | What the big currencies are telling us | ارزهای بزرگ چه می‌گویند |
| Group names | Dollar vs the world · Warning lights · Australia–China | دلار در برابر جهان · چراغ‌های هشدار · استرالیا و چین |
| Pattern status | Active · Watching · Quiet | فعال · زیر نظر · آرام |
| Reliability detail (under the dots) | Held in {k} of the last 13 weeks | در {k} هفته از ۱۳ هفتهٔ اخیر برقرار بود |
| Table tag | Unusually large move | حرکت غیرمعمولاً بزرگ |
| Quiet patterns line | {n} patterns are quiet | {n} الگو آرام است |
| Closest to warning | Closest to warning | نزدیک‌ترین الگو به هشدار |
| Distance bar text | {name} {value} (warning at {threshold}) | {name} {value} (هشدار در {threshold}) |
| More patterns | {n} more patterns | {n} الگوی دیگر |
| Chart caption (together) | Usually move together | معمولاً هم‌جهت حرکت می‌کنند |
| Chart caption (opposite) | Usually move in opposite directions | معمولاً خلاف جهت هم حرکت می‌کنند |
| Dots title | How the pattern held in the last 13 weeks | الگو در ۱۳ هفتهٔ اخیر چطور عمل کرد |
| Dots legend | Held · Did not hold · No change | برقرار بود · برقرار نبود · بدون تغییر |
| Pairs used | Pairs used in this pattern | جفت ارزهای این الگو |
| Dollar row title | Dollar vs the world | دلار در برابر جهان |
| As-of header | As of {date} | تا تاریخ {date} |
| Warning line | {pair} {value} · warning line {threshold} | {pair} {value} · خط هشدار {threshold} |
| Dots end labels | 13 weeks ago · now | ۱۳ هفته پیش · اکنون |
| Downgrade caution | The usual pattern has not been reliable lately. | این الگو اخیراً قابل‌اتکا نبوده است. |
| Level 3 toggle | Why it works, and the numbers | چرا کار می‌کند و اعداد |
| Direction legend | ▲ = first currency stronger | ▲ یعنی ارز اول تقویت شده است |
| What we see / usually means (small labels, optional) | We see · Usually means | آنچه می‌بینیم · معمولاً یعنی |
| No-data row | Not enough data right now | فعلاً داده کافی نیست |
| Table disclosure | Show all currency pairs / Hide pairs | نمایش همهٔ جفت ارزها / پنهان کردن |
| Empty state | Currency data is being prepared. Check back after the next daily update. | داده‌های ارز در حال آماده‌سازی است. پس از به‌روزرسانی روزانهٔ بعدی دوباره سر بزنید. |
| Footer line | ECB reference rates, once a day. A pattern is a tendency, not a prediction. | نرخ‌های مرجع بانک مرکزی اروپا، روزی یک بار. الگو یک گرایش است، نه پیش‌بینی. |

Severity always uses the chip wording already on the page (Normal / Needs attention / Unusual). The status words above (Active, Watching, Quiet) only say whether a pattern's condition is met. The measure labels for the section verdict are in section 9.10.

### 10.3 Headline templates (generated from the numbers, no AI call)
The measure label (section 9.10) and the severity chip come first. The headline is one short sentence that names the leading pattern; the detail lives in the cards.

| Situation | English | Persian |
|---|---|---|
| Calm (Normal) | No pattern is active. Closest to a warning: "{name}". | هیچ الگویی فعال نیست. نزدیک‌ترین الگو به هشدار: «{name}». |
| One or two active | "{top name}" is active{, plus {n} more}. | «{top name}» فعال است{، به‌علاوهٔ {n} الگوی دیگر}. |
| Unusual (three or more) | Several patterns are active at once, led by "{top name}". | چند الگو هم‌زمان فعال‌اند که مهم‌ترینشان «{top name}» است. |
| Confidence wobble | Money is leaving stocks and the dollar together, which is unusual. | پول هم‌زمان از سهام و دلار آمریکا خارج می‌شود که غیرمعمول است. |

---

## 11. Build plan for the agentic session

Work in order. Loop on each step until its test passes, then continue. Match the code patterns already in the repo and reuse the stock section's components.

| Step | Task | Test that proves it is done |
|---|---|---|
| 0 | Look at the repo: what currency data and what "dollar measure" already exist, where gold, VIX and the stock values are stored, and how many cron slots are free. Then run the provider check: Frankfurter `v1` for all 6 currencies, and the Yahoo fallback for all 10 pairs | A data-check file with the findings, and the latest value of each pair from both providers side by side. **Pause: Ali checks at least three pairs against a trusted rate page** |
| 1 | Provider adapters returning one common shape, plus the cross-rate calculation | Unit tests with saved sample responses; EUR/JPY from dollar rates matches the direct value within 0.1% |
| 2 | Calculations: the four period changes, `move_rank`, dollar measure, weekly series, validation V1 to V7 | Unit tests for every validation rule, including a fake 6% one-day jump and a stale date |
| 3 | **Evidence run (section 6.6)** | Evidence file committed. **Pause: Ali reviews the table and approves or changes thresholds** |
| 4 | Rule engine R1 to R7, pattern check with the 13 weekly flags, downgrade rule, distance to warning, 26-week chart series, section signal | Unit tests for each outcome of each rule (including "no data" and "downgraded to Watch"), for `progress`, and a replay of the last year |
| 5 | Scheduled job(s), the single KV key, write only if changed | Running the job twice with the same data causes exactly one write |
| 6 | Public read route with cache headers | Under 20 KB, correct headers, works when KV is empty |
| 7 | UI as in section 9: verdict line with its measure label, pattern rows (Level 1), opened card (Level 2: chart, warning line, 13 dots), Level 3 toggle, quiet area with distance bars, dollar row, pairs table, pair detail panel, all states in 9.5 | Visual check in English and Farsi (right to left), phone and desktop. The first card opens by default at Level 2 only; Level 3 stays closed until tapped; a quiet day still shows the closest-to-warning row; the vocabulary on screen is only Active, Watching, Quiet plus the page's chips |
| 8 | Wording from sections 7, 8, 9.10 and 10 in both languages | All 7 rules (each outcome with its two-part sentence) and 11 pair rows present in both languages; Persian digits and Jalali dates in Farsi |
| 9 | Accessibility pass (9.7) | Keyboard-only walkthrough; no meaning carried by colour alone |
| 10 | Budget test | Simulated 24 hours: 3 or fewer KV writes, a few reads, 1 provider call per run, CPU time logged |
| 11 | Hero integration (6.5 and 9.10): the currency signal appears as its own indicator with its measure label, next to the stock section's, never merged; active patterns appear in the alerts block | Section signals appear separately in the transparent count and in alerts when raised |

**Finish line:** all steps pass; the section shows the calm "being prepared" state, never an error, when the provider is down or KV is empty; the evidence file is committed; and the data-check file records KV usage after one week live.

## 12. Risks
- **Rules are tendencies.** Relationships between currencies change over time. That is why every rule has a reliability label and a downgrade, and why thresholds are tuned on history before launch.
- **Once-a-day rates.** A fast move that happens and reverses between two ECB fixes will not show. That is acceptable for a page about understanding, and the footer says so.
- **Provider changes.** Frankfurter could retire `v1`, and Yahoo can change without notice. Keep the fallback working and the "Old data" chip honest.
- **Double counting.** R3 and R4 can both fire in the same scare. The verdict thresholds (1 to 2 and 3 or more) were set with that in mind; the build-step-4 replay should show whether the signal looks too jumpy.
- **Licence.** ECB reference data is openly available. The Yahoo fallback is personal-use only. Fine for today's non-commercial site, and revisit before Currena earns money.
- **Thin history check.** The evidence run reaches back 10 years, but the stock inputs come from a different source than the live ones. Small level differences do not matter, because the rules use percentage moves.
