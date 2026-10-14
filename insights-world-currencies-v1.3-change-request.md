# Currena Insights — World currencies: v1.3 change request

**Status:** Draft for Ali's approval · written 2026-10-13
**Applies to:** the section built from `docs/specs/insights-world-currencies.md` (v1.2). Read that spec first. Where this file and the spec disagree, **this file wins**.
**Why:** Ali reviewed the live section (screenshots, "as of 12 October 2026"). Two requests: (1) check the data is correct, (2) make it understandable for a normal person who is not an economist.

---

## 1. Is the data correct? (accuracy check, 13 October 2026)

I compared the numbers in the screenshots with independent public sources.

| Number on the page | Independent check | Result |
|---|---|---|
| Dollar vs the world, 1 month **+3.2%** | US Dollar Index (DXY) up 3.21% over the past month (Trading Economics, 12 Oct) | Matches |
| Dollar vs the world, 1 year **+3.1%** | DXY up 3.34% over 12 months | Matches (a different basket, so a small gap is normal) |
| Dollar today **+0.2%** | DXY up 0.36% on 12 Oct | Same direction and size (our rate is the ECB's once-a-day fixing, not the closing price) |
| Euro vs US dollar, 1 month **−3.6%** | Trading Economics: −3.07% over a month (13 Oct); spot rate about 1.116 to 1.122 on 12 Oct; five weekly losses in a row | Right direction and size. A half-point gap is expected (the ECB fixes the rate at 14:15 Central European Time, and sources start the month on slightly different dates) |
| US dollar vs yen, 1 month **+3.0%** | Trading Economics: yen weaker by 2.64% over a month, about 158.4 per dollar; four weekly yen losses in a row | Matches within about 0.4 points |
| US stocks (S&P 500), 1 month **+2.0%** | S&P 500 was near record highs in early October (about 7,810 on 6 Oct against a record close of 7,798.99 on 13 Aug) | Plausible, not checked to the decimal |
| Euro vs Swiss franc **−1.5%** (1 month), US dollar vs yuan **−1.2%** (3 months), Australian dollar vs yen **+0.1%** (1 month), dollar 3 months **+1.5%**, Australian dollar vs US dollar | I could not find an independent figure for the same dates. The Australian dollar was reported below 0.70 on 12 Oct | **Not independently checked.** See the 2-minute checklist below |

**Do the pieces add up?** Yes. The dollar's +3.2% is consistent with the pair numbers: the euro, the yen, the Swiss franc and the Australian dollar all fell against the dollar, and the euro and the yen carry most of the weight.

**Conclusion:** the data is accurate to within about half a percentage point of public sources, which is normal between sources. It is good enough for a page about direction and size. The footer already says "ECB reference rates, once a day".

**2-minute checklist for Ali** (any public rates page, compare with the page's 1-month column):
1. Euro vs Swiss franc over one month: about −1.5%?
2. US dollar vs yuan over three months: about −1.2%?
3. Australian dollar vs US dollar over one month: about −3%?
4. S&P 500 over one month: about +2%?
If any is off by more than a point, tell the agent. It most likely means a date mix-up, not a wrong rate.

---

## 2. Logic bugs found in the screenshots (must fix)

| # | What the screenshot shows | What is wrong | Required fix |
|---|---|---|---|
| B1 | "Dollar or euro? … the euro moved 3.6% … while the dollar **barely moved (3.2%)** … That points to something in Europe" | The dollar moved 3.2%, which is **not** "barely". The euro fell and the dollar rose, which is the same story seen from two sides, so this is **dollar-led**. The rule wording in my spec was ambiguous ("moved the same way"), and the code read it literally | Use the corrected R7 definition in section 3.3 |
| B2 | Verdict says "Currency patterns: **calm**" and the headline says "**Dollar or euro?** is active" | A context card must never count as an active pattern or lead the headline. Calm and active contradict each other | The headline names only the leading **Active or Watching pattern that counts**. R7 never appears in the headline. When nothing counts, use the calm headline (section 10.3 of the spec, updated in section 3.2 below) |
| B3 | "**Held in 0 of the last 13 weeks**" with an empty dot row, on the "Dollar or euro?" card | That rule has no pattern check, so the line is meaningless and looks like a failure | Rules without a pattern check (R4, R7) show no dots, no "Held in" line and no end labels |
| B4 | "EURUSD", "DOLLAR", "EURCHF", "SP500", "USDCNY", "AUDJPY" on screen | Raw codes mean nothing to a normal person | Use the plain names in section 4.7 everywhere on screen |
| B5 | "EURUSD −3.6% · warning line +2.5% · DOLLAR +3.2% · warning line +1.5%" | A context card has no warning line. Signed moves next to unsigned lines are confusing | Context cards show no warning line. Other cards show the alarm level in words (section 4.3) |
| B6 | "Europe worry" appears in the closest-to-alarm row **and** again in the list of quiet patterns | Repeated item | The list shows the other quiet patterns only |
| B7 | Under "Dollar vs the world": "A strong dollar usually pressures gold and the Australian dollar" | The sentence is fixed, so it is wrong when the dollar is weak or steady | Make it follow the direction (section 4.9) |
| B8 | Verdict "calm" while the dollar had its biggest one-month gain in over a year | Misleading by omission. The real-world news this week is a strong dollar (highest since April 2025) | Section 3.1 and 3.2 |

---

## 3. Verdict honesty

### 3.1 R3 gets a fast-move trigger
The old rule only looks at three months (±4.0%), so a sharp one-month jump stays "calm". Add a one-month trigger:

| | Old | **New** |
|---|---|---|
| **R3 Warning** (strong dollar) | Dollar measure M3 ≥ +4.0 | Dollar measure **M1 ≥ +3.0** or M3 ≥ +4.0 |
| **R3 Supportive** (weak dollar) | Dollar measure M3 ≤ −4.0 | Dollar measure **M1 ≤ −3.0** or M3 ≤ −4.0 |

Config additions (starting values, tuned only by the evidence rule in the main spec): `R3_DOLLAR_M1_STRONG = +3.0`, `R3_DOLLAR_M1_WEAK = -3.0`.
Distance to warning for R3 uses the nearer of the two legs (M1 against ±3.0, M3 against ±4.0).

Verdict text for the one-month version (the three-month version stays as in the main spec):
- **We see (EN):** The US dollar is up {x}% against the big currencies over the past month. **Usually means (EN):** A strong dollar usually makes money harder to get around the world.
- **We see (FA):** دلار آمریکا در یک ماه گذشته {x} درصد در برابر ارزهای بزرگ تقویت شده است. **Usually means (FA):** دلار قوی معمولاً تأمین مالی را در سراسر جهان سخت‌تر می‌کند.
- Supportive mirror: "down {x}% … over the past month" / «… {x} درصد … تضعیف شده است» and "A weaker dollar usually makes money easier to get around the world." / «دلار ضعیف‌تر معمولاً تأمین مالی را در جهان آسان‌تر می‌کند.»

**Effect on the screenshot's numbers:** the dollar's M1 is +3.2, so R3 becomes **Active · Needs attention**, and the section reads "worry signs" instead of "calm". This matches the real week: the dollar is at its highest since April 2025, Fed rate-hike expectations are rising, and the yen and euro are falling. The agent's evidence run must report how often this new trigger fires (it should be rare, well under 15% of days). If it fires more than 25% of days, raise the line to the nearest value that fixes it and log the change.

### 3.2 Headline when calm but something big happened
A "calm" verdict with a visible big move reads as an error. Add one more headline template (section 10.3 of the spec). It applies when the section signal is Normal and there is a **big mover**: the dollar measure or any pair with |M1| ≥ 3.0%, or any pair with `big_move = true`.

| Situation | English | Persian |
|---|---|---|
| Normal with a big mover | No warning pattern is active, but {mover sentence}. | هیچ الگوی هشداردهنده‌ای فعال نیست، اما {mover sentence}. |

`{mover sentence}` (use the biggest mover only): "the US dollar is up {x}% this month" / «دلار آمریکا این ماه {x} درصد تقویت شده است»; or for a pair: "the euro lost {x}% against the US dollar this month" / «یورو این ماه {x} درصد در برابر دلار آمریکا تضعیف شده است».

### 3.3 Corrected R7 definition ("Dollar or euro?")
Work in terms of **dollar strength**. EUR/USD **down** means the dollar got stronger against the euro; EUR/USD **up** means it got weaker.
1. Show the card only if EUR/USD moved 2.5% or more (up or down) over a month.
2. Let `d` = the dollar measure's 1-month change (positive = dollar stronger). Let `e` = the dollar's change against the euro implied by EUR/USD (positive when EUR/USD fell).
3. **Dollar-led:** `d` has the same sign as `e` and `|d| ≥ 1.5`. The card says "Mostly a dollar story".
4. **Euro-led:** `|d| < 1.0`. The card says "Mostly a euro story".
5. Anything else (for example `d` moved the opposite way, or 1.0 to 1.5): **show no R7 card.** Do not guess.
In the screenshot, EUR/USD fell 3.6% (`e` = +3.6), and `d` = +3.2, the same sign and above 1.5, so it is **dollar-led**.
R7 copy for the numbers: the "we see" sentence uses the euro's own move ("The euro lost {x}% against the US dollar") rather than "moved".

---

## 4. The plain-language layer

**Goal:** a visitor with no finance education understands, in this order: what is happening, why it matters to them, how sure we are, and what would change it. All wording is fixed templates filled with numbers. **No AI calls at runtime.** Text is built on the page from the stored numbers, so KV does not grow (section 6).

### 4.1 Writing rules (apply to every string)
1. Sentences of 20 words or fewer. Everyday words. No unexplained acronyms: write "European Central Bank (ECB)", "market fear gauge (VIX)" on first use.
2. Never show a raw code (EURUSD, DOLLAR). Always plain names (section 4.7).
3. Always say **which currency got stronger or weaker**. Never "moved" or a bare "+3.6%".
4. Every percentage carries its period ("this month", "in three months").
5. Keep the three kinds of statement apart: **what we see** (numbers), **what it usually means** (hedged), **what to do about it**: never "buy" or "sell"; only everyday effects.
6. Persian: follow the existing Persian rules (Iranian terms, Persian digits, Jalali dates, «تقویت/تضعیف» for currencies, «رشد/افت» for stocks, «دلار آمریکا» and «دلار استرالیا», never a bare «دلار» for the Australian one).

### 4.2 New block: "In plain words" (directly under the verdict line)
Three to four short lines built from the numbers. This is what most visitors will read.

**S1 · The dollar** (dollar measure, 1 month; `{x}` is the size without a sign)
| When | English | Persian |
|---|---|---|
| M1 ≥ +3.0 | The US dollar got much stronger this month: up {x}% against six major currencies{, its strongest in a year}. | دلار آمریکا این ماه خیلی قوی‌تر شد: {x} درصد در برابر شش ارز مهم تقویت شده است{ و این قوی‌ترین حالتش در یک سال اخیر است}. |
| +1.0 ≤ M1 < +3.0 | The US dollar got stronger this month: up {x}% against six major currencies. | دلار آمریکا این ماه قوی‌تر شد: {x} درصد در برابر شش ارز مهم تقویت شده است. |
| −1.0 < M1 < +1.0 | The US dollar was steady this month ({x}%). | دلار آمریکا این ماه تقریباً ثابت بود ({x} درصد). |
| −3.0 < M1 ≤ −1.0 | The US dollar got weaker this month: down {x}% against six major currencies. | دلار آمریکا این ماه ضعیف‌تر شد: {x} درصد در برابر شش ارز مهم تضعیف شده است. |
| M1 ≤ −3.0 | The US dollar got much weaker this month: down {x}% against six major currencies{, its weakest in a year}. | دلار آمریکا این ماه خیلی ضعیف‌تر شد: {x} درصد در برابر شش ارز مهم تضعیف شده است{ و این ضعیف‌ترین حالتش در یک سال اخیر است}. |

The optional clause "its strongest / weakest in a year" appears only when the dollar measure is at its 52-week high or low. The cron job sets a flag for it (section 6).

**S2 · Biggest changes against the dollar.** Take the two currencies (euro, yen, pound, yuan, franc, Australian dollar) whose own change against the US dollar over a month is biggest. A currency's own change against the dollar = for pairs quoted as "X/USD" (euro, pound, Australian dollar): the pair's change; for pairs quoted as "USD/X" (yen, yuan, franc): `1 ÷ (1 + change) − 1`.
- **EN:** Against the dollar, the biggest changes this month: the {A} {lost|gained} {a}% and the {B} {lost|gained} {b}%.
- **FA:** در برابر دلار آمریکا، بیشترین تغییرات این ماه: {A} {a} درصد {تضعیف|تقویت} شد و {B} {b} درصد {تضعیف|تقویت} شد.
Currency names in the sentence: euro / یورو, yen / ین, pound / پوند, yuan / یوان, Swiss franc / فرانک سوئیس, Australian dollar / دلار استرالیا.

**S3 · The Australian dollar** (Australian dollar vs US dollar, 1 month; always shown)
| When | English | Persian |
|---|---|---|
| change ≤ −1.0 | The Australian dollar got weaker against the US dollar: down {x}% this month. Things priced in US dollars (many imports, overseas trips, online shopping) cost more. | دلار استرالیا این ماه {x} درصد در برابر دلار آمریکا تضعیف شد. کالاها و خدماتی که با دلار آمریکا قیمت‌گذاری می‌شوند (بسیاری از واردات، سفرهای خارجی، خرید آنلاین) گران‌تر می‌شوند. |
| change ≥ +1.0 | The Australian dollar got stronger against the US dollar: up {x}% this month. Overseas trips and imports priced in US dollars cost less. | دلار استرالیا این ماه {x} درصد در برابر دلار آمریکا تقویت شد. سفرهای خارجی و واردات با قیمت دلاری ارزان‌تر می‌شوند. |
| between | The Australian dollar was steady against the US dollar this month ({x}%). | دلار استرالیا این ماه در برابر دلار آمریکا تقریباً ثابت بود ({x} درصد). |

**S4 · The mood** (from the patterns)
| When | English | Persian |
|---|---|---|
| no counted Warning | No warning pattern is active. The closest to sounding the alarm is "{name}". | هیچ الگوی هشداردهنده‌ای فعال نیست. نزدیک‌ترین الگو به فعال شدن هشدار «{name}» است. |
| one or more | {n} warning pattern(s) active: {names}. | {n} الگوی هشداردهنده فعال است: {names}. |

**S5 · What it means in money** (one line, for **euro vs US dollar** and **Australian dollar vs US dollar**; the same line appears in every pair's detail panel using that pair's currencies)
- **Formula:** `old = new ÷ (1 + M1/100)` from the pair's stored rate and one-month change. Default amount: 1,000 of the first currency.
- **EN (worse):** If you had changed 1,000 euros into US dollars a month ago, you would have got about {old} dollars. Today you get about {new}, which is {diff} fewer.
- **EN (better):** … Today you get about {new}, which is {diff} more.
- **FA (worse):** اگر یک ماه پیش ۱٬۰۰۰ یورو را به دلار آمریکا تبدیل کرده بودید، حدود {old} دلار می‌گرفتید. امروز حدود {new} دلار می‌گیرید، یعنی {diff} دلار کمتر.
- **FA (better):** … یعنی {diff} دلار بیشتر.
Round to whole numbers. Round the "rate used" to 4 decimals in the detail panel. If |M1| < 0.5%, say "about the same" / «تقریباً همان مقدار».

### 4.3 Pattern cards: four plain answers
Every card answers four questions, in this order. **Level 1** (collapsed) now starts with a short **headline verdict**, then the two-part sentence. **Level 2** adds the line **"What would change this"** (replacing the old "warning line" row). **Level 3** adds **"In everyday terms"**.

| Question | Where it shows |
|---|---|
| What is happening? | Level 1: headline verdict, then "we see" |
| What does it usually mean? | Level 1: "usually means" |
| How sure are we? | Level 2: the 13 dots and "Held in {k} of the last 13 weeks". Only for rules with a pattern check |
| What would change this? | Level 2: the alarm level in words (table below) |
| Why does it work, and what does it mean for me? | Level 3: "In everyday terms", then the existing "why / seen before / for you" lines |

The **plain titles, headline verdicts, everyday explanation and alarm-in-words** for each rule are below. `{line}`, `{line1}`, `{line2}` are filled from the config thresholds (no sign, one decimal).

**R1 · Nervous or relaxed? · نگران یا آرام؟**
| | English | Persian |
|---|---|---|
| Headline: Warning | Investors look nervous | سرمایه‌گذاران نگران به نظر می‌رسند |
| Headline: Supportive | Investors look relaxed | سرمایه‌گذاران آرام به نظر می‌رسند |
| Headline: Watch | An early hint of nervousness | نشانهٔ اولیهٔ نگرانی |
| Headline: Quiet | No sign of nervousness | نشانه‌ای از نگرانی نیست |
| In everyday terms | When people get scared, they sell riskier money like the Australian dollar and buy the safer Japanese yen. This pair shows which way money is moving. | وقتی مردم می‌ترسند، پول‌های پرریسک‌تر مثل دلار استرالیا را می‌فروشند و ین ژاپن را که امن‌تر است می‌خرند. این جفت ارز نشان می‌دهد پول به کدام سمت می‌رود. |
| What would change this | The alarm sounds if the Australian dollar loses {line}% against the yen in a month while US stocks fall {line2}% or market fear (the VIX) is high. | هشدار وقتی فعال می‌شود که دلار استرالیا در یک ماه {line} درصد در برابر ین تضعیف شود و هم‌زمان سهام آمریکا {line2} درصد افت کند یا شاخص ترس بازار (VIX) بالا باشد. |

**R2 · Sudden yen jump · جهش ناگهانی ین** (the carry trade explained in the card)
| | English | Persian |
|---|---|---|
| Headline: Warning | The yen is jumping and markets may shake | ین جهش می‌کند و بازارها ممکن است بلرزند |
| Headline: Watch | The yen is very weak | ین بسیار ضعیف است |
| Headline: Quiet | No sudden yen moves | حرکت ناگهانی در ین دیده نمی‌شود |
| In everyday terms | Many investors borrow cheap yen to invest elsewhere (a "carry trade"). If the yen suddenly gets stronger, they must repay fast and sell their investments, which can hit stock markets worldwide. | بسیاری از سرمایه‌گذاران ین ارزان قرض می‌گیرند تا جای دیگر سرمایه‌گذاری کنند (به آن «کری ترید» می‌گویند). اگر ین ناگهان قوی شود، باید سریع بازپرداخت کنند و سرمایه‌گذاری‌هایشان را بفروشند که می‌تواند بازار سهام جهان را بزند. |
| What would change this | The alarm sounds if the yen gains {line}% against the US dollar in a month while Japanese stocks fall {line2}%. | هشدار وقتی فعال می‌شود که ین در یک ماه {line} درصد در برابر دلار آمریکا تقویت شود و هم‌زمان سهام ژاپن {line2} درصد افت کند. |

**R3 · Strong or weak dollar · دلار قوی یا ضعیف**
| | English | Persian |
|---|---|---|
| Headline: Warning | The dollar is getting much stronger | دلار آمریکا خیلی قوی‌تر می‌شود |
| Headline: Supportive | The dollar is getting much weaker | دلار آمریکا خیلی ضعیف‌تر می‌شود |
| Headline: Quiet | The dollar is moving normally | دلار آمریکا حرکت عادی دارد |
| In everyday terms | Oil, gold and a lot of loans are priced in US dollars. When the dollar gets stronger, they cost more for people who earn in other currencies. | نفت، طلا و بخش بزرگی از وام‌ها با دلار آمریکا قیمت‌گذاری می‌شوند. وقتی دلار قوی‌تر می‌شود، برای کسانی که با ارزهای دیگر درآمد دارند گران‌تر تمام می‌شوند. |
| What would change this | The alarm sounds if the dollar moves {line1}% in a month or {line2}% in three months against six major currencies. | هشدار وقتی فعال می‌شود که دلار آمریکا در یک ماه {line1} درصد یا در سه ماه {line2} درصد در برابر شش ارز مهم حرکت کند. |

**R4 · Where does money hide? · پول به کجا پناه می‌برد؟**
| | English | Persian |
|---|---|---|
| Headline: Flight to the dollar | Money is running to the dollar | پول به سمت دلار آمریکا می‌گریزد |
| Headline: Confidence wobble | Money is leaving even the dollar | پول از دلار آمریکا هم خارج می‌شود |
| Headline: Quiet | No rush to safety | هجومی به سمت پناهگاه امن دیده نمی‌شود |
| In everyday terms | In a scare, people usually move money into US dollars because it feels safe. When even the dollar is sold, trust is shaky, and gold often rises. | در زمان ترس، مردم معمولاً پول را به دلار آمریکا منتقل می‌کنند چون امن به نظر می‌رسد. وقتی دلار هم فروخته می‌شود، اعتماد لرزان است و طلا اغلب بالا می‌رود. |
| What would change this | The alarm sounds if US stocks fall {line1}% in a month while the dollar gains {line2}%. | هشدار وقتی فعال می‌شود که سهام آمریکا در یک ماه {line1} درصد افت کند و هم‌زمان دلار آمریکا {line2} درصد تقویت شود. |

**R5 · China link · پیوند با چین**
| | English | Persian |
|---|---|---|
| Headline: Warning | Worry about China's demand | نگرانی از تقاضای چین |
| Headline: Supportive | China's demand looks healthy | تقاضای چین سالم به نظر می‌رسد |
| Headline: Watch | An early hint of China worry | نشانهٔ اولیهٔ نگرانی از چین |
| Headline: Quiet | No sign of China worry | نشانه‌ای از نگرانی دربارهٔ چین نیست |
| In everyday terms | China is the biggest buyer of Australia's iron ore. When China's economy slows, the Australian dollar and the Chinese yuan often weaken together. | چین بزرگ‌ترین خریدار سنگ‌آهن استرالیاست. وقتی اقتصاد چین کند می‌شود، دلار استرالیا و یوان چین اغلب با هم تضعیف می‌شوند. |
| What would change this | The alarm sounds if both the yuan and the Australian dollar lose {line}% or more against the US dollar in three months. | هشدار وقتی فعال می‌شود که هم یوان و هم دلار استرالیا در سه ماه دست‌کم {line} درصد در برابر دلار آمریکا تضعیف شوند. |

**R6 · Europe worry · نگرانی از اروپا**
| | English | Persian |
|---|---|---|
| Headline: Warning | Investors are worried about Europe | سرمایه‌گذاران از اروپا نگران‌اند |
| Headline: Watch | The euro is slipping against the Swiss franc | یورو در برابر فرانک سوئیس ضعیف می‌شود |
| Headline: Quiet | No sign of Europe worry | نشانه‌ای از نگرانی دربارهٔ اروپا نیست |
| In everyday terms | The Swiss franc is a classic safe place for money. When Europeans get nervous they buy francs, so the euro falls against it. | فرانک سوئیس پناهگاه امن کلاسیک است. وقتی اروپایی‌ها نگران می‌شوند فرانک می‌خرند و یورو در برابر آن ضعیف می‌شود. |
| What would change this | The alarm sounds if the euro loses {line1}% against the Swiss franc in a month while European stocks also fall {line2}%. | هشدار وقتی فعال می‌شود که یورو در یک ماه {line1} درصد در برابر فرانک سوئیس تضعیف شود و هم‌زمان سهام اروپا هم {line2} درصد افت کند. |

**R7 · Dollar or euro? · دلار یا یورو؟** (context card; no alarm line, no dots)
| | English | Persian |
|---|---|---|
| Headline: dollar-led | Mostly a dollar story | بیشتر ماجرای دلار است |
| Headline: euro-led | Mostly a euro story | بیشتر ماجرای یورو است |
| In everyday terms | When the euro falls against the dollar, it can be because the dollar is strong everywhere (a world story) or because the euro itself is weak (a Europe story). This card tells you which. | وقتی یورو در برابر دلار ضعیف می‌شود، ممکن است دلار همه‌جا قوی شده باشد (ماجرای جهانی) یا خود یورو ضعیف باشد (ماجرای اروپا). این کارت می‌گوید کدام است. |

### 4.4 Quiet area wording
The **closest to alarm** row and every quiet row use the same plain format:
- **Line 1:** the pattern's plain title and its quiet headline, for example "Europe worry · No sign of Europe worry".
- **Line 2 (the numbers, in words):** "The euro is down 1.5% against the Swiss franc this month. The alarm sounds at 2.0%." / «یورو این ماه ۱٫۵ درصد در برابر فرانک سوئیس تضعیف شده است. هشدار در ۲٫۰ درصد فعال می‌شود.»
- **The bar:** label it "How close to the alarm" / «چقدر تا هشدار مانده». The text value is always shown next to it, so the bar is never the only information.
- Section title above it: **"Nearest to sounding the alarm"** / «نزدیک‌ترین به فعال شدن هشدار».
- The toggle: "{n} more quiet patterns" / «{n} الگوی آرام دیگر». The closest pattern is left out of this list (fix B6).

### 4.5 "How to read this section" (a small button next to the title; closed by default)
| # | English | Persian |
|---|---|---|
| 1 | This section watches the world's biggest currencies. When money moves between them in certain ways, it often says something about how worried or relaxed investors are. | این بخش ارزهای بزرگ جهان را زیر نظر دارد. وقتی پول به شکل‌های خاصی میان آن‌ها جابه‌جا می‌شود، اغلب نشان می‌دهد سرمایه‌گذاران چقدر نگران یا آرام‌اند. |
| 2 | A percentage such as −3.6% compares today with one month (or the period shown) ago. A minus means the first currency got weaker. | درصدی مثل ۳٫۶− امروز را با یک ماه (یا دورهٔ نشان‌داده‌شده) پیش مقایسه می‌کند. علامت منفی یعنی ارز اول ضعیف‌تر شده است. |
| 3 | A pattern is a link between currencies (sometimes stocks or gold) that has often shown up before market worries. | الگو پیوندی میان ارزها (و گاهی سهام یا طلا) است که پیش‌تر اغلب پیش از نگرانی‌های بازار دیده شده است. |
| 4 | Active means the pattern is showing right now. Watching means it is half there. Quiet means nothing to see. | «فعال» یعنی الگو همین حالا دیده می‌شود. «زیر نظر» یعنی نیمه‌کاره است. «آرام» یعنی چیزی دیده نمی‌شود. |
| 5 | Patterns are tendencies, not predictions. They can be wrong. | الگوها گرایش‌اند، نه پیش‌بینی. ممکن است اشتباه باشند. |

### 4.6 Glossary tooltips
A small "?" after a term opens a one-sentence definition (tap or keyboard, not hover only). Use these exact definitions.

| Term | English | Persian |
|---|---|---|
| Currency pair | Two currencies compared, for example the euro and the US dollar. The rate tells you how much of the second one you get for one of the first. | دو ارز که با هم مقایسه می‌شوند، مثلاً یورو و دلار آمریکا. نرخ نشان می‌دهد برای یک واحد از ارز اول چند واحد از ارز دوم می‌گیرید. |
| Stronger / weaker currency | A currency is stronger when one unit buys more of another currency than before. | ارزی که یک واحدش نسبت به قبل از ارز دیگر بیشتر می‌خرد، قوی‌تر شده است. |
| US dollar strength | Currena's own measure of how the US dollar is doing against six big currencies. It is not the official DXY index, but it moves in a similar way. | معیار خود Currena برای وضع دلار آمریکا در برابر شش ارز بزرگ. همان شاخص رسمی DXY نیست، اما رفتار مشابهی دارد. |
| Safe haven | A currency or asset people buy when they are scared, such as the Swiss franc, the yen, the US dollar or gold. | ارز یا دارایی‌ای که مردم در زمان ترس می‌خرند، مثل فرانک سوئیس، ین، دلار آمریکا یا طلا. |
| Carry trade | Borrowing in a currency with very low interest (often the yen) to invest in something that pays more. It works until the borrowed currency suddenly gets stronger. | قرض گرفتن به ارزی با بهرهٔ بسیار پایین (اغلب ین) برای سرمایه‌گذاری در چیزی که سود بیشتری دارد. تا وقتی کار می‌کند که ارز قرض‌گرفته‌شده ناگهان قوی نشود. |
| Central bank | The institution that sets interest rates and looks after a country's money, such as the US Federal Reserve or the European Central Bank (ECB). | نهادی که نرخ بهره را تعیین می‌کند و مراقب پول یک کشور است، مثل فدرال رزرو آمریکا یا بانک مرکزی اروپا (ECB). |
| Reference rate | An official rate the European Central Bank publishes once each working day. | نرخی رسمی که بانک مرکزی اروپا هر روز کاری یک بار منتشر می‌کند. |
| Alarm level | The size of move at which a pattern switches from Quiet to Active. | اندازهٔ حرکتی که با رسیدن به آن، الگو از «آرام» به «فعال» می‌رود. |
| Market fear gauge (VIX) | A number that rises when investors expect big swings in US stocks. | عددی که وقتی سرمایه‌گذاران انتظار نوسان بزرگ در سهام آمریکا دارند، بالا می‌رود. |
| Tendency | Something that usually happens, but not always. | چیزی که معمولاً رخ می‌دهد، اما نه همیشه. |

### 4.7 Plain names (use everywhere on screen)
| Code (never shown) | English | Persian |
|---|---|---|
| EURUSD | Euro vs US dollar | یورو در برابر دلار آمریکا |
| USDJPY | US dollar vs yen | دلار آمریکا در برابر ین |
| GBPUSD | Pound vs US dollar | پوند در برابر دلار آمریکا |
| USDCHF | US dollar vs Swiss franc | دلار آمریکا در برابر فرانک سوئیس |
| USDCNY | US dollar vs yuan | دلار آمریکا در برابر یوان |
| AUDUSD | Australian dollar vs US dollar | دلار استرالیا در برابر دلار آمریکا |
| AUDJPY | Australian dollar vs yen | دلار استرالیا در برابر ین |
| EURJPY | Euro vs yen | یورو در برابر ین |
| EURCHF | Euro vs Swiss franc | یورو در برابر فرانک سوئیس |
| AUDCNY | Australian dollar vs yuan | دلار استرالیا در برابر یوان |
| DOLLAR | US dollar strength | قدرت دلار آمریکا |
| SP500 | US stocks (S&P 500) | سهام آمریکا (اس‌اندپی ۵۰۰) |
| NIKKEI | Japanese stocks (Nikkei 225) | سهام ژاپن (نیکی ۲۲۵) |
| EUROSTOXX | European stocks (Euro Stoxx 50) | سهام اروپا (یورو استوکس ۵۰) |
| GOLD | Gold | طلا |
Chart line labels use these names too, and end with the period's change at the line's end ("Euro vs US dollar −3.6%").

### 4.8 Chart captions
- "Usually move together" → **When one goes up, the other usually goes up too** / «وقتی یکی بالا می‌رود، دیگری هم معمولاً بالا می‌رود».
- "Usually move in opposite directions" → **When one goes up, the other usually goes down** / «وقتی یکی بالا می‌رود، دیگری معمولاً پایین می‌آید».
- Both lines start at 100 so the reader can compare them. Add one line under the chart: "Both lines start at 100 six months ago." / «هر دو خط شش ماه پیش از ۱۰۰ شروع می‌شوند.»

### 4.9 "Dollar at a glance" row: the meaning line follows the direction
| Dollar 1 month | English | Persian |
|---|---|---|
| ≥ +1.0% | A stronger dollar usually pushes gold down and makes imports and overseas trips dearer for people in other countries. | دلار قوی‌تر معمولاً طلا را پایین می‌آورد و واردات و سفر خارجی را برای مردم کشورهای دیگر گران‌تر می‌کند. |
| ≤ −1.0% | A weaker dollar usually helps gold and makes imports and overseas trips cheaper for people in other countries. | دلار ضعیف‌تر معمولاً به طلا کمک می‌کند و واردات و سفر خارجی را برای مردم کشورهای دیگر ارزان‌تر می‌کند. |
| between | The dollar is steady, so no big effect is expected from it. | دلار ثابت است، پس اثر بزرگی از آن انتظار نمی‌رود. |
The row title becomes **"US dollar strength"** / «قدرت دلار آمریکا», with its "?" glossary tip.

---

## 5. Acceptance tests (use the screenshot's numbers)
Inputs: dollar M1 +3.2, M3 +1.5, Y1 +3.1, today +0.2; Euro vs US dollar M1 −3.6; US dollar vs yen M1 +3.0; Euro vs Swiss franc M1 −1.5; Australian dollar vs yen M1 +0.1; US dollar vs yuan M3 −1.2; S&P 500 M1 +2.0.

| # | Expected result |
|---|---|
| T1 | R3 is **Active · Needs attention**, headline "The dollar is getting much stronger", and the section reads "Currency patterns: worry signs" |
| T2 | R7 shows **"Mostly a dollar story"**. The words "barely moved" never appear for a move above 1.0% |
| T3 | R7 shows no dots, no "Held in" line, no alarm line and never leads the headline |
| T4 | R1, R2, R4, R5 and R6 are Quiet. The closest to the alarm is "Europe worry" at 75% of the way (1.5 of 2.0), and it is **not** repeated in the quiet list |
| T5 | No raw code (EURUSD, DOLLAR, EURCHF, SP500, USDCNY) appears anywhere on screen, in English or Persian |
| T6 | "In plain words" shows S1 ("The US dollar got much stronger this month: up 3.2%…"), S2 (euro and yen lost the most), S3 (Australian dollar line) and S4 (one warning pattern active) |
| T7 | The "Dollar at a glance" meaning line says "A stronger dollar usually pushes gold down…" and flips when the data flips |
| T8 | Test the opposite case: dollar M1 −3.2 gives R3 Supportive and the weaker-dollar sentences; dollar M1 +0.4 gives "steady" |
| T9 | R7 with `d` moving the opposite way to `e`: no R7 card |
| T10 | Every English string has its Persian twin; Persian digits and «تقویت/تضعیف» are used for currencies |
| T11 | Reading-level check: no sentence over 20 words in the plain layer; no acronym without its full name at first use |

---

## 6. Build notes
- **No new API calls.** All new text is built on the page from the stored numbers. Static copy lives in the language files.
- **Small additions to the stored object** (under 1 KB): `plain.dollar_year_extreme` (`"high" | "low" | null`, from the 52-week range of the dollar measure), `plain.movers` (each currency's own change against the US dollar for 1 month, the six currencies), and the `legs` list already in the spec. Everything else is derived on the page. The 20 KB limit on the public route still holds.
- **Evidence run:** re-run it with the new R3 one-month trigger and the corrected R7 definition. Report how often each fires.
- **Files to touch:** the rule engine (R3, R7, headline choice), the stored-object builder (`plain` fields), the UI (plain-words block, cards, quiet area, glossary, how-to-read), the language files (English and Persian), and the tests.
- **Do not change:** the data sources, the schedule, the KV key, or anything in the stock section.
