# Gold Page Redesign — Session 3: Indicator Explanations (fa/en)

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Session:** 3 of 9 — the bilingual explanation records for every unique indicator on `/gold`.
**Schema:** `08-indicator-content-schema.md` (the field contract below follows it exactly).
**Relationships:** referenced by record id (`R-xx`) → `10-indicator-relationship-map.md`.
**Content status:** authored to the Persian-copy workflow standards (native voice, no em dashes, glossary terms, Persian digits in static text). Runtime integration (dictionaries + manifest round) happens in Session 5; these markdown records are the content of record until then.

## How to read a record

Every indicator record carries, in order: the identity line (canonical id · plain label EN · label FA · technical name), the measurement line (unit · data type · cadence · reference period · firing rule · polarity · source), then the ten content dimensions in both locales. `Analogy` may read `— (omitted: ...)` — the only field allowed to be absent (08 §3.5). Blocked records (§5) carry the `blocked` object instead of a firing rule.

**Polarity legend:** `−1` = the indicator's positive direction (rising/high) **pressures** gold; `+1` = rising/high **supports** gold (from `GOLD_LANE_VOTERS` — the source of truth; the rise/fall copy is written through this polarity). `level-only` = the seat fires on the 10-year position band alone (no 30-day move threshold). `n/a` = context record, never votes.

---

## 3. The 37 voters, by lane

### 3.A Borrowing costs · «نرخ بهره و هزینهٔ استقراض» (7 seats, all polarity −1: tight = headwind, relief = tailwind)

#### 3.1 `real-yield-10y` — Real yields (inflation-adjusted)
**Label FA:** بازده واقعی ۱۰ساله (خالص از تورم) · **Tech:** 10-Year Treasury Inflation-Indexed Security (TIPS) constant-maturity yield, FRED `DFII10` · «بازده واقعی اوراق ۱۰ساله»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.10 pt, else the decade band (high > 80th / low < 20th percentile) · **polarity −1** · source: FRED (DFII10)
- **EN default:** What a 10-year US government bond really earns after expected inflation. High real yields are gold's classic headwind; falling ones its classic tailwind.
- **FA default:** بازدهی واقعیِ اوراق ۱۰سالهٔ آمریکایی پس از کسر تورمِ انتظاری. بازده واقعی بالا، تهدید کلاسیک طلاست و افت آن، پشتیبان کلاسیک.
- **EN What/Why:** This measures the inflation-adjusted return of lending to the US government for ten years. Gold pays no yield, so its strongest headwind is a high real rate — holding gold then means giving up a solid guaranteed real return — and its strongest tailwind is a falling one. The market trades the expectation, not just the level: a rate rise fully priced in can be a non-event.
- **FA What/Why:** این شاخص بازدهی واقعیِ قرض‌دادن پول به دولت آمریکا برای ده سال را می‌سنجد، یعنی پس از کسر تورمِ انتظاری. طلا بهره نمی‌پردازد؛ وقتی نرخ واقعی بالاست، نگه‌داشتن طلا یعنی چشم‌پوشی از یک درآمد تضمینیِ خوب، و این تهدید کلاسیک طلاست. بازار انتظار را معامله می‌کند، نه فقط سطح فعلی را؛ رشد نرخی که از قبل در قیمت‌ها دیده شده می‌تواند بی‌اثر بماند.
- **EN Rises:** A sustained rise typically pressures gold — the opportunity cost of a zero-yield asset grows. Caveat: since 2022 this old rule has visibly weakened; real yields rose sharply while gold rose too, because the marginal buyer changed (central-bank buying). The link is an association that varies across regimes, not a law.
- **EN Falls:** A fall — especially toward or below zero — typically supports gold; cash savings lose to inflation and gold's lack of yield matters less.
- **FA Rises:** رشد پایدار معمولاً بر طلا فشار می‌آورد؛ هزینهٔ فرصتِ داراییِ بدون‌بهره بزرگ‌تر می‌شود. اما این قاعدهٔ قدیمی از ۲۰۲۲ به‌وضوح ضعیف‌تر شده است؛ بازده واقعی به‌شدت بالا رفت و طلا هم بالا رفت، چون خریدارِ مرزی عوض شده است (خرید بانک‌های مرکزی). این همبستگی در رژیم‌های مختلف تغییر می‌کند و قانونی ثابت نیست.
- **FA Falls:** افت، به‌ویژه نزدیک یا زیر صفر، معمولاً از طلا حمایت می‌کند؛ پس‌انداز نقدی در برابر تورم می‌بازد و بی‌بهره‌بودن طلا اهمیتش را از دست می‌دهد.
- **Analogy:** EN: like choosing between a savings account that reliably beats inflation and gold under the mattress that earns nothing: the better the savings account pays, the harder it is to justify the mattress. · FA: مثل انتخاب میان حساب پس‌اندازی که با اطمینان از تورم جلوتر است و طلایی که زیر تشک است و هیچ بهره‌ای نمی‌دهد؛ هرچه آن حساب بهتر بپردازد، نگه‌داشتن زیر تشک توجیه‌ش کمتر می‌شود.
- **EN Visual:** On the seat chip the lean word shows today's reading; the yield-decomposition card shows this as the "real" leg of the nominal 10-year yield; the correlation companion plots gold against this series with a 52-week rolling correlation. The 10-year range bar shows where today's level sits in its decade — a marker near the top edge means high-for-the-decade, not "bad".
- **FA Visual:** روی کارتِ کرسی، واژهٔ گرایش قرائت امروز را نشان می‌دهد؛ کارت تفکیک بازده این را به‌عنوان پایهٔ «واقعی» بازده اسمی ۱۰ساله نشان می‌دهد؛ و کارت همبستگی، طلا را در برابر همین سری با همبستگی غلتان ۵۲هفته‌ای رسم می‌کند. نوار دامنهٔ ده‌ساله نشان می‌دهد سطح امروز کجای ده سال اخیر است؛ نشانگر نزدیک لبهٔ بالا یعنی بالای دامنهٔ ده‌ساله، نه «بد».
- **Relations:** R-01 (real yields ↔ gold, the see-saw), R-03 (nominal decomposition), R-15 (Fed path chain).
- **Notes:** 4 surfaces today (seat + decomposition + Signals condition + correlation axis — DUP-3); Session 2's placement decides which stay. The repo's own backtest measured no directional edge in the voter table as a whole — the honest-record footer carries it.

#### 3.2 `us10y` — US 10-year Treasury yield
**Label FA:** بازده ۱۰ساله آمریکا · **Tech:** 10-Year Treasury Constant Maturity Rate, FRED `DGS10` (Treasury-direct primary since R07) · «بازده اوراق ۱۰سالهٔ آمریکا»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.15 pt, else decade band · **polarity −1** · source: US Treasury (DGS10 basis; FRED fallback)
- **EN default:** The headline interest rate the US government pays to borrow for ten years. Through this page's meter it counts as a gold headwind when it climbs.
- **FA default:** نرخ بهرهٔ اصلی‌ای که دولت آمریکا برای قرض‌گیری ده‌ساله می‌پردازد. در این صفحه، رشد آن به‌عنوان فشار بر طلا شمرده می‌شود.
- **EN What/Why:** The nominal 10-year yield is the borrowing cost that anchors mortgages, corporate debt and the dollar. For gold, what matters is what the rise is made of: a rise driven by the real (inflation-adjusted) rate is the classic headwind; one driven by inflation expectations (the breakeven) is neutral-to-positive for gold. The decomposition card splits exactly this.
- **FA What/Why:** بازده اسمی ۱۰ساله، هزینهٔ استقراضی است که وام مسکن، بدهی شرکت‌ها و دلار را لنگر می‌اندازد. برای طلا مهم است که رشد از چه چیزی ساخته شده است: رشدِ محرکِ نرخ واقعی، تهدید کلاسیک است؛ رشدِ محرکِ انتظارات تورمی (سربه‌سر) برای طلا خنثی تا مثبت است. کارت تفکیک بازده دقیقاً همین را باز می‌کند.
- **EN Rises:** A rise counts against gold in this meter's fixed reading. The honest nuance: the meaning depends on the real/breakeven split — check the decomposition card before reading a rise as purely bad for gold.
- **EN Falls:** A fall (easing) typically supports gold — cheaper money weakens the dollar and the rival yield.
- **FA Rises:** رشد آن در این متر به‌عنوان فشار بر طلا خوانده می‌شود؛ اما معنای دقیقش به تفکیک «واقعی/سربه‌سر» بستگی دارد؛ پیش از تعبیرِ صرفاً منفی، کارت تفکیک بازده را ببینید.
- **FA Falls:** افت آن (آرام‌شدن پول) معمولاً از طلا حمایت می‌کند؛ پولِ ارزان‌تر دلار و بازدهِ رقیب را ضعیف می‌کند.
- **Analogy:** — (omitted: the concept is covered by 3.1's analogy and the decomposition card's own teaching).
- **EN Visual:** Seat chip (lean word) + the decomposition card's "nominal" top row. The bar shows the decade position of today's level.
- **FA Visual:** کارت کرسی (واژهٔ گرایش) + ردیف «اسمی» در کارت تفکیک بازده. نوار، جایگاه سطح امروز را در دامنهٔ ده‌ساله نشان می‌دهد.
- **Relations:** R-03 (the decomposition identity), R-01 (through the real leg), R-15 (the Fed path).
- **Notes:** The decomposition derives the breakeven from this minus the real yield on matching as-of dates only.

#### 3.3 `us30y` — US 30-year Treasury yield
**Label FA:** بازده ۳۰ساله آمریکا · **Tech:** 30-Year Treasury Constant Maturity Rate, FRED `DGS30` · «بازده اوراق ۳۰سالهٔ آمریکا»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · **level-only** (fires on the decade band alone) · **polarity −1** · source: US Treasury (DGS30 basis; FRED fallback)
- **EN default:** What the US government pays to borrow for thirty years — the long-horizon price of money. High-for-its-decade readings count against gold in this meter.
- **FA default:** بهره‌ای که دولت آمریکا برای قرض‌گیری سی‌ساله می‌پردازد؛ قیمت بلندمدتِ پول. قرائت‌های بالای دامنهٔ ده‌ساله در این متر به ضرر طلا شمرده می‌شود.
- **EN What/Why:** The long bond sets the discount rate for the far future — mortgages, infrastructure, pension math. It is the yield most sensitive to term premium and fiscal supply, so it moves somewhat independently of the Fed. For gold the same opportunity-cost channel applies, read through the decade position.
- **FA What/Why:** اوراق بلندمدت، نرخ تنزیلِ آیندهٔ دور را تعیین می‌کند؛ وام مسکن، زیرساخت و محاسبات صندوق‌های بازنشستگی. این بازده به صرف سررسید و عرضهٔ مالی بیشترین حساسیت را دارد و مستقل از فدرال رزرو حرکت می‌کند. برای طلا همان کانال هزینهٔ فرصت برقرار است که از جایگاه ده‌ساله خوانده می‌شود.
- **EN Rises:** A high or rising 30-year yield typically pressures gold — long money is well paid. Rises driven by term premium (fiscal fear) are the partial exception (see the term-premium seat, 3.19).
- **EN Falls:** A low or falling long yield typically supports gold — the long end offers little competition.
- **FA Rises:** بازدهٔ ۳۰سالهٔ بالا یا رونده معمولاً بر طلا فشار می‌آورد؛ پولِ بلندمدت خوب پرداخت می‌کند. استثنای نسبی، رشدِ محرکِ صرف سررسید (ترس مالی) است (کرسی صرف سررسید را ببینید، ۳٫۱۹).
- **FA Falls:** بازدهٔ بلندمدتِ پایین یا نزولی معمولاً از طلا حمایت می‌کند؛ انتهای بلند منافس چندانی نمی‌گذارد.
- **Analogy:** — (omitted: same channel as 3.1/3.2; a second analogy adds no clarity).
- **EN Visual:** Seat chip only; the level marker on the decade range. Notice this seat fires on level, not 30-day moves — a decade-extreme parking spot still leans.
- **FA Visual:** فقط کارت کرسی؛ نشانگر سطح روی دامنهٔ ده‌ساله. توجه: این کرسی از روی «سطح» فعال می‌شود نه حرکت ۳۰روزه؛ پارک‌کردن در انتهای دامنهٔ ده‌ساله هم گرایش ایجاد می‌کند.
- **Relations:** R-03, R-04 (term premium), R-01.
- **Notes:** —

#### 3.4 `fed-target` — The Fed's policy rate
**Label FA:** نرخ سیاستی فدرال رزرو · **Tech:** Federal funds target range midpoint (DFEDTARL + DFEDTARU) · «نرخ سیاستی فدرال رزرو»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.25 pt (one FOMC step) or decade band · **polarity −1** · source: FRED
- **EN default:** The overnight interest rate the Federal Reserve sets — the base price of dollar money. A high setting counts against gold in this meter.
- **FA default:** نرخ بهرهٔ شبانه‌ای که فدرال رزرو تعیین می‌کند؛ قیمت پایهٔ پول دلاری. تنظیم بالا در این متر به ضرر طلا شمرده می‌شود.
- **EN What/Why:** The policy rate is the floor every other dollar rate stands on. When it is high in real terms, cash and short bonds pay well and gold's zero yield is a real cost; when the Fed cuts toward or below inflation, gold's case strengthens. Markets trade the expected path (see 3.5) more than today's setting.
- **FA What/Why:** نرخ سیاستی، کفِ همهٔ نرخ‌های دلاری دیگر است. وقتی به‌طور واقعی بالاست، پول نقد و اوراق کوتاه خوب می‌پردازند و بی‌بهرگی طلا هزینهٔ واقعی دارد؛ وقتی فدرال رزرو به سمت تورم یا زیر آن می‌رود، جایگاه طلا محکم‌تر می‌شود. بازار بیش از تنظیم امروز، مسیرِ مورد انتظار را معامله می‌کند (۳٫۵ را ببینید).
- **EN Rises:** A high or rising policy rate typically pressures gold — tight money. The step threshold means one FOMC move per month is a real signal, less is noise.
- **EN Falls:** A falling path (cuts) typically supports gold — easier money weakens the dollar and the yield rival.
- **FA Rises:** نرخ سیاستیِ بالا یا رونده معمولاً بر طلا فشار می‌آورد؛ پولِ سفت. آستانهٔ پله‌ای یعنی یک حرکت کامل فدرال رزرو در ماه، سیگنال واقعی است و کمتر از آن نوفه.
- **FA Falls:** مسیر نزولی (کاهش نرخ) معمولاً از طلا حمایت می‌کند؛ پولِ آسان‌تر دلار و بازدهِ رقیب را تضعیف می‌کند.
- **Analogy:** — (omitted: 3.1's mattress-versus-savings account already carries the family).
- **EN Visual:** Seat chip + decade-range marker. A stepped series: the level sits in plateaus; the position word tells you whether the plateau is high or low for the decade.
- **FA Visual:** کارت کرسی + نشانگر دامنهٔ ده‌ساله. این سری پله‌ای است؛ سطح در سکوها می‌نشیند و واژهٔ جایگاه می‌گوید سکوی فعلی در ده سال اخیر بالا است یا پایین.
- **Relations:** R-15 (the policy chain), R-01 (through real yields), R-14 (dollar).
- **Notes:** The expectations row (§6, the GoldExpectations module) shows what markets price for the NEXT decision — a different object from this seat's current setting.

#### 3.5 `fed-expectations` — Where markets see the Fed next
**Label FA:** انتظارات بازار از فدرال رزرو · **Tech:** 2-year Treasury yield minus the policy midpoint (derived, FRED DGS2 basis) · «انتظارات بازار از فدرال رزرو»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.13 pt or decade band · **polarity −1** · source: derived (DGS2 − policy midpoint)
- **EN default:** What short-term market rates imply about the Fed's next moves. A market pricing higher-for-longer counts against gold here.
- **FA default:** آنچه نرخ‌های کوتاه‌مدت بازار دربارهٔ حرکت بعدی فدرال رزرو می‌گویند. قیمت‌گذاریِ «بالاتر برای مدت طولانی‌تر» در اینجا به ضرر طلا شمرده می‌شود.
- **EN What/Why:** The 2-year yield sits where the average expected policy rate over the next couple of years is; subtracting today's setting leaves the market's expected change. Because gold trades the expectation, this seat often moves before the policy rate itself. Hawkish repricing (a rising gap) tightens financial conditions and typically pressures gold; dovish repricing does the reverse.
- **FA What/Why:** بازده دوساله تقریباً همان میانگینِ نرخ سیاستیِ مورد انتظار برای دو سال آینده است؛ با کم‌کردنِ تنظیم امروز، تغییرِ مورد انتظارِ بازار می‌ماند. چون طلا انتظار را معامله می‌کند، این کرسی اغلب پیش از خودِ نرخ سیاستی حرکت می‌کند. بازقیمت‌گذاریِ انقباضی (بالا رفتن شکاف) شرایط مالی را سفت می‌کند و معمولاً بر طلا فشار می‌آورد؛ عکس آن هم برقرار است.
- **EN Rises:** The market pricing a higher path than before typically pressures gold.
- **EN Falls:** Pricing cuts sooner or deeper typically supports gold.
- **FA Rises:** قیمت‌گذاریِ مسیر بالاتر از قبل معمولاً بر طلا فشار می‌آورد.
- **FA Falls:** قیمت‌گذاریِ کاهش زودتر یا عمیق‌تر معمولاً از طلا حمایت می‌کند.
- **Analogy:** — (omitted: derivative of 3.4; an analogy would add a layer, not clarity).
- **EN Visual:** Seat chip; the decade-range marker. When the reading is unreadable the chip shows its honest why-line (the upstream feed stopped); it never guesses.
- **FA Visual:** کارت کرسی و نشانگر دامنهٔ ده‌ساله. وقتی قرائت ممکن نیست، کارت دلیل صادقانه‌اش را نشان می‌دهد (توقف منبع بالادستی)؛ هرگز حدس نمی‌زند.
- **Relations:** R-15, R-01, R-14.
- **Notes:** Honest state at S1 capture: unread (upstream stopped). Distinct from the Polymarket expectations module (market-implied event probabilities, §6) — this seat is a rate-derived level, that is a prediction-market price.

#### 3.6 `ecb-dfr` — ECB deposit rate
**Label FA:** نرخ سپردهٔ بانک مرکزی اروپا · **Tech:** ECB Deposit Facility Rate (Data Portal FM/D.U2…DFR.LEV) · «نرخ تسهیلات سپرده‌دهی بانک مرکزی اروپا»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · **level-only** · **polarity −1** · source: ECB Data Portal
- **EN default:** The eurozone's equivalent of the Fed's policy rate — what banks earn parking money at the ECB. High global policy rates count against gold here.
- **FA default:** معادلِ نرخ سیاستی فدرال رزرو در منطقهٔ یورو؛ بهره‌ای که بانک‌ها برای سپرده‌گذاری نزد بانک مرکزی اروپا می‌گیرند. نرخ‌های سیاستی بالای جهانی در اینجا به ضرر طلا شمرده می‌شود.
- **EN What/Why:** Gold is a global asset priced against world real rates, not only America's. When the ECB holds rates high, euro cash and bonds also out-compete a zero-yield ounce, and European jewelry and investment demand feels it. This seat adds the second-largest monetary bloc's stance to the meter.
- **FA What/Why:** طلا دارایی جهانی است و در برابر نرخ‌های واقعیِ جهان قیمت می‌خورد، نه فقط آمریکا. وقتی بانک مرکزی اروپا نرخ را بالا نگه می‌دارد، پول و اوراق یورویی هم از اونسِ بدون‌بهره جلو می‌زنند و تقاضای اروپایی هم این را حس می‌کند. این کرسی سیاستِ دومین بلوک پولی جهان را به متر اضافه می‌کند.
- **EN Rises:** A high or rising ECB rate typically pressures gold — the zero-yield rival spreads beyond the dollar.
- **EN Falls:** An easing ECB typically supports gold globally.
- **FA Rises:** نرخ بالای یا روندهٔ بانک مرکزی اروپا معمولاً بر طلا فشار می‌آورد؛ رقیبِ بدون‌بهره فقط به دلار محدود نمی‌ماند.
- **FA Falls:** سیاست انبساطی بانک مرکزی اروپا معمولاً در جهان از طلا حمایت می‌کند.
- **Analogy:** — (omitted: same family as 3.4).
- **EN Visual:** Seat chip; level-only marker on the decade range.
- **FA Visual:** کارت کرسی؛ نشانگرِ فقط-سطحی روی دامنهٔ ده‌ساله.
- **Relations:** R-15 (global policy), R-01.
- **Notes:** —

#### 3.7 `real-yield-5y` — Real yields, 5-year
**Label FA:** بازده واقعی ۵ساله · **Tech:** 5-Year Treasury Inflation-Indexed Security (TIPS) constant-maturity yield, FRED `DFII5` · «بازده واقعی اوراق ۵ساله»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.10 pt or decade band · **polarity −1** · source: FRED (DFII5)
- **EN default:** The inflation-adjusted return on 5-year US government lending — the part of the curve where Fed policy bites first.
- **FA default:** بازدهی واقعیِ قرض‌دادن ۵ساله به دولت آمریکا؛ بخشی از منحنی که سیاست فدرال رزرو زودتر از همه اثرش را نشان می‌دهد.
- **EN What/Why:** The 5-year real yield is the belly of the curve: it moves fastest with policy expectations because it is long enough to carry the expected path and short enough to reprice quickly. It is the 10-year's twin (3.1) with a faster pulse — often the earliest clean signal of a real-rate turn.
- **FA What/Why:** بازده واقعی ۵ساله شکمِ منحنی است: هم به اندازهٔ کافی بلند است که مسیرِ مورد انتظار سیاست را حمل کند و هم به اندازهٔ کافی کوتاه که سریع بازقیمت‌گذاری شود. دوقلوی ِ بازده ۱۰ساله (۳٫۱) با نبض تندتر است؛ اغلب نخستین سیگنال تمیزِ چرخش نرخ واقعی.
- **EN Rises:** A rise typically pressures gold — the fastest-moving part of the real curve is repricing against it.
- **EN Falls:** A fall typically supports gold, often leading the 10-year leg.
- **FA Rises:** رشد آن معمولاً بر طلا فشار می‌آورد؛ سریع‌ترین بخش منحنی واقعی در حال بازقیمت‌گذاری علیه طلاست.
- **FA Falls:** افت آن معمولاً از طلا حمایت می‌کند و اغلب جلوتر از پایهٔ ۱۰ساله حرکت می‌کند.
- **Analogy:** — (omitted: 3.1's analogy covers the channel).
- **EN Visual:** Seat chip; decade-range marker. Watch divergences with the 10-year leg — the belly turning before the long end is a classic early move.
- **FA Visual:** کارت کرسی؛ نشانگر دامنهٔ ده‌ساله. واگرایی با پایهٔ ۱۰ساله را ببینید؛ چرخشِ زودترِ شکم منحنی یک حرکت کلاسیک آغازین است.
- **Relations:** R-01, R-15, R-03.
- **Notes:** Seated at GF-P3; the real-curve sign question (D-11/D-12) remains a recorded decision-list item — this record describes the shipped polarity only.

### 3.B The US dollar · «دلار آمریکا» (7 seats, all polarity −1: strong = headwind, under stress = tailwind)

#### 3.8 `dollar-basket` — The dollar against six big currencies
**Label FA:** دلار در برابر شش ارز بزرگ · **Tech:** Currena DXY-style weighted basket (EUR 57.6% · JPY 13.6% · GBP 11.9% · CAD 9.1% · SEK 4.2% · CHF 3.6%), derived from Frankfurter legs · «شاخص دلار»
**Measure:** index points · index · daily · ref: rolling 10-year window · fires: 30-day move ≥ 1.0 pt or decade band · **polarity −1** · source: derived (Frankfurter)
- **EN default:** The US dollar's strength against six major currencies in one weighted number. A stronger dollar usually weighs on gold.
- **FA default:** قدرت دلار آمریکا در برابر شش ارز اصلی در یک عدد وزنی. دلار قوی‌تر معمولاً بر طلا فشار می‌آورد.
- **EN What/Why:** Gold is priced in dollars, so a stronger dollar tends to make the same ounce more expensive in euros, yen or yuan — and demand tends to soften, even when nothing about gold itself changed. The basket is the page's own DXY-style gauge of that strength.
- **FA What/Why:** طلا به دلار قیمت می‌خورد؛ دلار قوی‌تر یعنی همان اونس برای یورو، ین یا یوان گران‌تر می‌شود و تقاضا معمولاً نرم می‌شود، حتی وقتی هیچ‌چیز دربارهٔ خود طلا عوض نشده است. این سبد، سنجهٔ صفحه برای همان قدرت است.
- **EN Rises:** A rise typically pressures gold — the classic inverse pattern. Two famous breaks: in market stress the dollar and gold are bid together (the same flight-to-safety trade), and in de-dollarization episodes both rise.
- **EN Falls:** A weaker dollar typically supports gold — the ounce gets cheaper for the rest of the world.
- **FA Rises:** رشد معمولاً بر طلا فشار می‌آورد؛ الگوی معکوس کلاسیک. دو استثنای مشهور: در تنش بازار، دلار و طلا با هم خریداری می‌شوند (یک معاملهٔ فرار به امنیت) و در دوره‌های کنار گذاشتن دلار، هر دو بالا می‌روند.
- **FA Falls:** دلار ضعیف‌تر معمولاً از طلا حمایت می‌کند؛ اونس برای بقیهٔ دنیا ارزان‌تر می‌شود.
- **Analogy:** — (omitted: the pricing-currency point is already plain).
- **EN Visual:** Seat chip + the Signals section's dollar condition. The marker on the 10-year range shows whether the dollar's level is high or low for its decade.
- **FA Visual:** کارت کرسی + وضعیت دلار در بخش سیگنال‌ها. نشانگر روی دامنهٔ ۱۰ساله می‌گوید سطح دلار در ده سال اخیر بالا است یا پایین.
- **Relations:** R-02 (dollar ↔ gold), R-14 (rates → dollar chain), R-22 (stress break).
- **Notes:** Six currencies, the DXY recipe, no AUD (GPE-S2-28 reconciliation — the AGENTS.md §C drift item, corrected).

#### 3.9 `usdjpy` — Dollar against the yen
**Label FA:** دلار در برابر ین ژاپن · **Tech:** USD/JPY exchange rate, Frankfurter · «دلار در برابر ین ژاپن»
**Measure:** yen per dollar · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 1.38% or decade band · **polarity −1** · source: Frankfurter
- **EN default:** How many yen one dollar buys. A rising dollar-yen usually means dollar strength and carry appetite — both lean against gold.
- **FA default:** هر دلار چند ین می‌خرد. رشد دلار/ین معمولاً یعنی قدرت دلار و اشتها به معاملهٔ کَری؛ هر دو بر طلا فشار می‌آورند.
- **EN What/Why:** The yen is the classic funding currency: traders borrow cheap yen to buy higher-yielding assets (the carry trade). A rising USD/JPY usually signals risk appetite plus dollar strength — both on gold's pressure side. Violent yen strength (the pair falling fast) often marks carry unwinds — historically a stress moment when many assets, sometimes including gold at first, get sold for dollars.
- **FA What/Why:** ین، ارز تأمین مالی کلاسیک است: معامله‌گران ینِ ارزان قرض می‌گیرند تا دارایی‌های پربازده بخرند (معاملهٔ کَری). رشد دلار/ین معمولاً نشانهٔ اشتها به ریسک به‌علاوهٔ قدرت دلار است؛ هر دو در سمت فشار بر طلا. ینِ به‌شدت قوی (سقوط سریع جفت‌ارز) اغلب نشانهٔ بازگشایی معاملات کَری است؛ از نظر تاریخی لحظه‌ای پرتنش که در آن بسیاری از دارایی‌ها، گاه حتی طلا در ابتدا، برای دلار فروخته می‌شوند.
- **EN Rises:** A rise typically pressures gold (dollar strength + risk-on). 
- **EN Falls:** A steady fall typically supports gold; a violent fall is the stress exception — first liquidity, haven later.
- **FA Rises:** رشد معمولاً بر طلا فشار می‌آورد (قدرت دلار به‌علاوهٔ ریسک‌پذیری).
- **FA Falls:** افتِ آرام معمولاً از طلا حمایت می‌کند؛ افتِ شدید استثنای پرتنش است؛ نخست نقدینگی، بعد پناه‌گاه.
- **Analogy:** EN: the yen behaves like the market's credit card: cheap to borrow in good times; when the bill is called at once (everyone repays yen simultaneously), markets wobble. · FA: رفتار ین مثل کارت اعتباریِ بازار است: در روزهای خوب قرض‌گرفتنش ارزان است؛ اما وقتی یک‌باره همه سررسید می‌شود (همه همزمان ین پس بدهند)، بازار تکان می‌خورد.
- **EN Visual:** Seat chip; decade-range marker. The pair is the only percent-change seat (threshold 1.38% over 30 days).
- **FA Visual:** کارت کرسی؛ نشانگر دامنهٔ ده‌ساله. این جفت‌ارز تنها کرسیِ درصدی است (آستانه ۱٫۳۸ درصد در ۳۰ روز).
- **Relations:** R-02, R-14, R-12 (carry).
- **Notes:** —

#### 3.10 `us-japan-10y-gap` — US–Japan 10-year yield gap
**Label FA:** شکاف بازده ۱۰سالهٔ آمریکا و ژاپن · **Tech:** FRED DGS10 − MOF jgbcme 10-year, derived · «شکاف ۱۰سالهٔ آمریکا و ژاپن»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · **level-only** · **polarity −1** · source: derived (FRED + MOF)
- **EN default:** How much more the US pays to borrow for ten years than Japan. A wider gap pulls money toward dollars — usually gold's pressure side.
- **FA default:** آمریکا برای قرض‌گیری ده‌ساله چقدر بیشتر از ژاپن می‌پردازد. شکاف بازتر، پول را به سمت دلار می‌کشد؛ معمولاً سمت فشار بر طلا.
- **EN What/Why:** The yield gap is the carry trade's fuel: the wider it is, the stronger the incentive to borrow yen and hold dollar assets, which supports the dollar. A wide-for-its-decade gap here marks a dollar-friendly configuration for gold.
- **FA What/Why:** شکاف بازده، سوخت معاملهٔ کَری است؛ هرچه بازتر باشد، انگیزهٔ قرض‌گرفتن ین و نگه‌داشتن دارایی دلاری قوی‌تر می‌شود و این از دلار حمایت می‌کند. شکافِ باز در دامنهٔ ده‌ساله، یک آرایش دلارپسند برای طلا علامت می‌گذارد.
- **EN Rises:** A wider gap typically pressures gold through the dollar channel.
- **EN Falls:** A narrowing gap (or a US fall toward Japan's levels) typically eases that pressure.
- **FA Rises:** شکاف بازتر معمولاً از راه دلار بر طلا فشار می‌آورد.
- **FA Falls:** بسته‌شدن شکاف معمولاً این فشار را آرام می‌کند.
- **Analogy:** — (omitted: 3.9's credit-card analogy carries the family).
- **EN Visual:** Seat chip, level-only marker. Unreadable periods render the honest why-line, never a guess.
- **FA Visual:** کارت کرسی، نشانگرِ فقط-سطحی. دوره‌های ناخوانا با دلیل صادقانه نمایش داده می‌شوند؛ هرگز حدس زده نمی‌شوند.
- **Relations:** R-12 (carry), R-14, R-02.
- **Notes:** Honest state at S1 capture: unread (upstream stopped).

#### 3.11 `usd-reserve-share` — The dollar's share of world reserves
**Label FA:** سهم دلار از ذخایر ارزی جهان · **Tech:** IMF COFER, USD share of world allocated FX reserves (quarterly) · «سهم دلار از ذخایر ارزی»
**Measure:** percent of allocated reserves · level · quarterly (with publication lag) · ref: rolling 10-year window · **level-only** · **polarity −1** · source: IMF (SDMX, COFER)
- **EN default:** What share of the world's foreign-exchange reserves sits in dollars. A rising share means the world is still concentrating on the dollar — gold's pressure side.
- **FA default:** چه سهمی از ذخایر ارزی جهان به دلار نگه داشته می‌شود. سهم بالاتر یعنی جهان هنوز بر دلار متمرکز است؛ سمتِ فشار بر طلا.
- **EN What/Why:** Central banks hold reserves mostly in currencies; the dollar's share is the cleanest single number for dollar dominance in official portfolios. A falling share is the de-dollarization signal — the long-run channel through which central banks diversify into gold. This seat reads the inverse: a high or rising share leans against gold.
- **FA What/Why:** بانک‌های مرکزی ذخایرشان را عمدتاً به ارز نگه می‌دارند و سهم دلار، تمیزترین عددِ واحد برای سلطهٔ دلار در سبدهای رسمی است. سهمِ نزولی، سیگنالِ کنار گذاشتن تدریجی دلار است؛ همان کانال بلندمدتی که بانک‌های مرکزی از راه آن به طلا تنوع می‌بخشند. این کرسی عکس آن را می‌خواند: سهم بالا یا رونده به ضرر طلا گرایش دارد.
- **EN Rises:** A rising dollar share typically pressures gold — the world is not diversifying away.
- **EN Falls:** A falling share is the classic long-run gold-supportive configuration (reserve diversification into gold, visible in the central-bank demand section).
- **FA Rises:** سهمِ روندهٔ دلار معمولاً بر طلا فشار می‌آورد؛ جهان در حال دور شدن از دلار نیست.
- **FA Falls:** سهمِ نزولی، آرایش کلاسیکِ حامی طلا در بلندمدت است (تنوع‌بخشیِ ذخایر به طلا که در بخش تقاضای بانک‌های مرکزی دیده می‌شود).
- **Analogy:** — (omitted: slow structural series; an everyday analogy would trivialize the multi-decadal pace).
- **EN Visual:** Seat chip, level-only, quarterly cadence — expect step-changes, not daily moves. Also feeds the Global page's de-dollarization tile (cross-page mirror, by design).
- **FA Visual:** کارت کرسی، فقط-سطحی، با چرخهٔ فصلی؛ تغییرات پله‌ای انتظار کنید نه حرکت روزانه. همین داده در صفحهٔ جهانی به کارت کنار گذاشتن دلار هم می‌رود (آینهٔ بین‌صفحه‌ای، عمدی).
- **Relations:** R-09 (CB demand ↔ gold), R-02.
- **Notes:** Quarterly with lag — the honest as-of is printed; no month-level claims.

#### 3.12 `nyfed-custody` — Foreign official custody at the NY Fed
**Label FA:** دارایی‌های رسمی خارجی نزد فدرال رزرو نیویورک · **Tech:** Treasuries held in custody for foreign official accounts, FRED `WSEFINTL1` (Wednesday level) · «دارایی‌های رسمی خارجی نزد فدرال رزرو نیویورک»
**Measure:** millions of USD · level · weekly · ref: rolling 10-year window · **level-only** · **polarity −1** · source: FRED (WSEFINTL1)
- **EN default:** US government bonds held for foreign central banks at the New York Fed. Rising custody means official demand for dollar assets — gold's pressure side here.
- **FA default:** اوراق دولتی آمریکا که به نمایندگی از بانک‌های مرکزی خارجی نزد فدرال رزرو نیویورک نگه داشته می‌شود. رشد آن یعنی تقاضای رسمی برای دارایی دلاری؛ در اینجا سمت فشار بر طلا.
- **EN What/Why:** A slice of the world's dollar reserves physically sits in a custody account at the New York Fed. When that pile grows, official sectors are accumulating dollar assets (dollar-positive); when it shrinks — as after 2022's reserve freeze — the diversification story (and gold's structural bid) strengthens. The custody-hub caveat from the TIC data applies: these accounts also hold assets managed for others.
- **FA What/Why:** بخشی از ذخایر دلاری جهان به‌صورت فیزیکی در حساب امانی نزد فدرال رزرو نیویورک می‌نشیند. وقتی این انبار رشد کند، بخش‌های رسمی در حال انباشتن دارایی دلاری‌اند (دلار-مثبت)؛ وقتی کوچک شود، مانند پس از انجماد ذخایر در ۲۰۲۲، روایتِ تنوع‌بخشی و تقاضای ساختاری طلا تقویت می‌شود. توجه: این حساب‌ها دارایی‌هایی را هم نگه می‌دارند که به نمایندگی از دیگران مدیریت می‌شود.
- **EN Rises:** Rising custody typically pressures gold (official dollar demand).
- **EN Falls:** Falling custody typically supports the diversification story.
- **FA Rises:** رشد امانت‌ها معمولاً بر طلا فشار می‌آورد (تقاضای رسمی دلار).
- **FA Falls:** کاهش امانت‌ها معمولاً روایت تنوع‌بخشی را تقویت می‌کند.
- **Analogy:** — (omitted: paired with 3.11; one structural story suffices).
- **EN Visual:** Seat chip, level-only, weekly Wednesday level. On /global it renders inside the TIC section (one reading, one surface there — HIDDEN_FROM_LANE_IDS).
- **FA Visual:** کارت کرسی، فقط-سطحی، سطحِ چهارشنبه‌ها. در صفحهٔ جهانی همین قرائت داخل بخش TIC می‌نشیند (یک قرائت، یک سطح نمایش).
- **Relations:** R-09, R-02, R-13 (TIC composite).
- **Notes:** The TIC section's custody-hub caveat (Belgium, Luxembourg, Cayman and others hold much that belongs to others) applies to this family's interpretation.

#### 3.13 `dollar-broad` — The broad trade-weighted dollar
**Label FA:** دلار آمریکا (شاخص گسترده) · **Tech:** Broad Trade-Weighted Dollar Index, FRED `DTWEXBGS` · «دلار (گسترده)»
**Measure:** index points · index · daily · ref: rolling 10-year window · fires: 30-day move ≥ 1.0 pt or decade band · **polarity −1** · source: FRED (DTWEXBGS)
- **EN default:** The dollar against a wide basket of US trading partners' currencies — the honest inverse of gold's usual pattern.
- **FA default:** دلار در برابر سبدی گسترده از ارزهای شرکای تجاری آمریکا؛ معکوسِ صادقانهٔ الگوی معمول طلا.
- **EN What/Why:** The six-currency basket (3.8) is the trader's dollar; this broad index weights dozens of partners by trade. Because it captures the whole trading world, it is the cleanest single dollar gauge for the dollar-gold inverse — when the inverse pattern is working, this is where it shows first.
- **FA What/Why:** سبدِ شش‌ارزی (۳٫۸) دلارِ معامله‌گران است؛ این شاخص گسترده ده‌ها شریک تجاری را با وزن تجاری جمع می‌کند. چون کل دنیای تجاری را می‌پوشاند، تمیزترین سنجهٔ واحد برای معکوسِ دلار-طلاست؛ وقتی الگوی معکوس کار می‌کند، اول همین‌جا دیده می‌شود.
- **EN Rises:** A rise typically pressures gold (the broad inverse).
- **EN Falls:** A fall typically supports gold broadly, not just against the majors.
- **FA Rises:** رشد معمولاً بر طلا فشار می‌آورد (معکوسِ گسترده).
- **FA Falls:** افت معمولاً به‌طور گسترده از طلا حمایت می‌کند، نه فقط در برابر ارزهای اصلی.
- **Analogy:** — (omitted: 3.8 covers the channel).
- **EN Visual:** Seat chip; decade-range marker.
- **FA Visual:** کارت کرسی؛ نشانگر دامنهٔ ده‌ساله.
- **Relations:** R-02, R-14.
- **Notes:** Seated at GF-P3.

#### 3.14 `dollar-eme` — The dollar vs emerging markets
**Label FA:** دلار آمریکا در برابر اقتصادهای نوظهور · **Tech:** Emerging Markets Trade-Weighted Dollar Index, FRED `DTWEXEMEGS` · «دلار (کشورهای نوظهور)»
**Measure:** index points · index · daily · ref: rolling 10-year window · fires: 30-day move ≥ 1.0 pt or decade band · **polarity −1** · source: FRED (DTWEXEMEGS)
- **EN default:** The dollar against emerging-market currencies — the marginal gold buyer's leg. EME dollar strength squeezes the buyers who set the price at the margin.
- **FA default:** دلار در برابر ارزهای بازارهای نوظهور؛ پایِ خریدارِ مرزی طلا. قدرت دلار در این بازارها، خریدارانی را می‌فشارد که در لبهٔ قیمت اثر می‌گذارند.
- **EN What/Why:** Much of the world's physical gold demand — jewelry, savings, small investment — lives in emerging markets. When their currencies weaken against the dollar, local gold prices spike and demand softens; when EME currencies are firm, the marginal buyer is back. This seat reads that squeeze.
- **FA What/Why:** بخش بزرگی از تقاضای فیزیکی طلا، از جواهر تا پس‌انداز و سرمایه‌گذاری خرد، در بازارهای نوظهور زندگی می‌کند. وقتی ارزهایشان در برابر دلار ضعیف می‌شود، قیمتِ محلی طلا جهش می‌کند و تقاضا نرم می‌شود؛ وقتی ارزها محکم‌اند، خریدارِ مرزی برمی‌گردد. این کرسی همان فشار را می‌خواند.
- **EN Rises:** A rising EME dollar typically pressures gold — the world's price-sensitive buyers are squeezed.
- **EN Falls:** EME currency strength typically supports physical demand.
- **FA Rises:** رشد دلار در بازارهای نوظهور معمولاً بر طلا فشار می‌آورد؛ خریدارانِ حساس به قیمت جهان زیر فشارند.
- **FA Falls:** قدرت ارزهای نوظهور معمولاً از تقاضای فیزیکی حمایت می‌کند.
- **Analogy:** — (omitted: the marginal-buyer point is stated plainly above).
- **EN Visual:** Seat chip; decade-range marker. Often moves with the broad index — divergences (EME weakness while the broad dollar is calm) are the interesting readings.
- **FA Visual:** کارت کرسی؛ نشانگر دامنهٔ ده‌ساله. غالباً همراهِ شاخص گسترده حرکت می‌کند؛ واگرایی‌ها (ضعف نوظهورها در آرامشِ دلار گسترده) قرائت‌های جالبی‌اند.
- **Relations:** R-02, R-09 (EME official demand).
- **Notes:** Seated at GF-P3.

### 3.C Market stress & uncertainty · «تنش و عدم قطعیت بازار» (11 seats, mixed polarity: elevated = tailwind for +1 seats; two inverted seats marked)

#### 3.15 `stress-stlfsi` — US financial stress index
**Label FA:** شاخص تنش مالی آمریکا (سن‌لویی) · **Tech:** St. Louis Fed Financial Stress Index, FRED `STLFSI4` · «تنش در بازارهای پول آمریکا»
**Measure:** index points (zero = average) · index · weekly · ref: rolling 10-year window · **level-only** · **polarity +1** · source: FRED (STLFSI4)
- **EN default:** A single number for how stressed US money markets and funding are — zero means historically average. Elevated stress usually feeds gold's safe-haven bid.
- **FA default:** یک عدد برای سطح تنش در بازار پول و تأمین مالی آمریکا؛ صفر یعنی میانگینِ تاریخی. تنش بالا معمولاً تقاضای پناه‌گاهی طلا را تقویت می‌کند.
- **EN What/Why:** The index blends yields, spreads and volatility signals into one stress gauge. When funding markets tighten, investors reduce risk and some of that money historically runs to gold. In the sharpest panic weeks the opposite can briefly happen — gold gets sold to raise cash (liquidity spiral) — the haven usually arrives after policy responds.
- **FA What/Why:** این شاخص بازده‌ها، اسپردها و نوسان‌ها را در یک سنجهٔ تنش جمع می‌کند. وقتی بازارهای تأمین مالی سفت می‌شوند، سرمایه‌گذاران ریسک را کم می‌کنند و بخشی از آن پول از نظر تاریخی به طلا می‌رود. در هفته‌های اوج هراس، لحظه‌ای برعکس هم دیده شده است؛ طلا برای تأمین نقدینگی فروخته می‌شود (مارپیچ نقدینگی) و پناه‌گاه معمولاً پس از پاسخ سیاستی می‌رسد.
- **EN Rises:** Rising stress typically supports gold (the haven channel) — with the panic-week exception above.
- **EN Falls:** Calm typically removes the haven bid — one of gold's usual supports switches off, not a verdict on gold itself.
- **FA Rises:** تنشِ رونده معمولاً از طلا حمایت می‌کند (کانال پناه‌گاه)؛ با همان استثنای هفته‌های هراس.
- **FA Falls:** آرامش معمولاً تقاضای پناه‌گاهی را برمی‌دارد؛ یکی از پشتیبان‌های همیشگی طلا خاموش می‌شود، نه حکمی دربارهٔ خود طلا.
- **Analogy:** EN: like a blood-pressure cuff for the financial system: a reading far above normal means the system is working hard, and history says gold often gets bought when that reading is elevated. · FA: مانند فشارسنجِ خون برای نظام مالی: قرائت بسیار بالاتر از نرمال یعنی سیستم زیر فشار کار می‌کند و تجربه می‌گوید طلا در چنین لحظه‌هایی اغلب خریده می‌شود.
- **EN Visual:** Seat chip; level-only marker on the decade range. Above zero = tighter than the historical average; the 2008 and 2020 spikes are the reference extremes on the range's edge.
- **FA Visual:** کارت کرسی؛ نشانگرِ فقط-سطحی روی دامنهٔ ده‌ساله. بالای صفر یعنی سفت‌تر از میانگین تاریخی؛ جهش‌های ۲۰۰۸ و ۲۰۲۰ مرجع‌های انتهای دامنه‌اند.
- **Relations:** R-05 (stress ↔ gold), R-22 (stress-dollar break).
- **Notes:** —

#### 3.16 `nfci` — US financial conditions index
**Label FA:** شاخص شرایط مالی آمریکا (شیکاگو) · **Tech:** Chicago Fed National Financial Conditions Index, FRED `NFCI` · «شرایط مالی آمریکا»
**Measure:** index points (zero = average) · index · weekly · ref: rolling 10-year window · **level-only** · **polarity +1** · source: FRED (NFCI)
- **EN default:** The Chicago Fed's alternative reading of US financial conditions — how easy or tight money is across markets. Tight conditions usually lean toward gold.
- **FA default:** قرائت جایگزین بانک مرکزی شیکاگو از شرایط مالی آمریکا؛ پول در بازارها چقدر راحت یا سفت است. شرایطِ سفت معمولاً به نفع طلا گرایش دارد.
- **EN What/Why:** A cousin of 3.15 built from a wider set of money-market, debt and leverage indicators. Two gauges of the same underlying thing means more honest confidence when both point the same way — and a useful split when they disagree.
- **FA What/Why:** خواهرِ ۳٫۱۵ که از مجموعهٔ گسترده‌تری از شاخص‌های بازار پول، بدهی و اهرم ساخته شده است. دو سنجه برای یک پدیده یعنی وقتی هر دو یک سو را نشان می‌دهند اعتماد بیشتری شکل می‌گیرد و وقتی جدا می‌شوند، خودش یک قرائت مفید است.
- **EN Rises:** Tightening conditions typically support gold's haven role.
- **EN Falls:** Easy conditions typically remove it.
- **FA Rises:** سفت‌شدن شرایط معمولاً نقش پناه‌گاهی طلا را تقویت می‌کند.
- **FA Falls:** شرایطِ آسان معمولاً آن را برمی‌دارد.
- **Analogy:** — (omitted: 3.15's blood-pressure analogy covers the family).
- **EN Visual:** Seat chip; level-only; read together with 3.15 — agreement is signal, divergence is context.
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ همراه ۳٫۱۵ خوانده شود؛ هم‌جهتی سیگنال است و واگرایی، بافت.
- **Relations:** R-05.
- **Notes:** —

#### 3.17 `vix` — The stock market's fear gauge
**Label FA:** شاخص ترس بازار (VIX) · **Tech:** CBOE Volatility Index (30-day S&P 500 implied volatility), FRED `VIXCLS` · «شاخص ترس بازار»
**Measure:** index points · index · daily · ref: rolling 10-year window · **level-only** · **polarity +1** · source: FRED (VIXCLS)
- **EN default:** The price the options market charges for insurance against stock-market drops. Expensive insurance means fear — and fear usually feeds gold.
- **FA default:** قیمتی که بازار اختیار معامله برای بیمه در برابر سقوط بورس می‌گیرد. بیمهٔ گران یعنی ترس؛ و ترس معمولاً به طلا سوخت می‌دهد.
- **EN What/Why:** The VIX is implied volatility: what traders expect the market to swing over the next month. It is the fastest public fear thermometer. High VIX regimes historically coincide with gold haven demand. Caveat: the VIX measures equity fear specifically; gold can stay flat in equity panics when the dollar absorbs the haven bid (2008's first weeks).
- **FA What/Why:** VIX یعنی نوسانِ ضمنی: بازار انتظار دارد شاخص‌ها در ماه آینده چقدر تاب بخورند. سریع‌ترین دماسنج عمومی ترس است. دوره‌های VIX بالا از نظر تاریخی با تقاضای پناه‌گاهی طلا همراه بوده است. توجه: VIX فقط ترسِ بازار سهام را می‌سنجد؛ در هراس‌های سهامی که دلار نقش پناه‌گاه را می‌گیرد، طلا می‌تواند بی‌حرکت بماند (هفته‌های نخست ۲۰۰۸).
- **EN Rises:** A rising VIX typically supports gold through the haven channel — with the dollar-absorbs-first exception.
- **EN Falls:** A subdued VIX typically removes that support.
- **FA Rises:** VIX رونده معمولاً از راه کانال پناه‌گاه از طلا حمایت می‌کند؛ با استثنای اینکه گاهی نخست دلار این نقش را می‌گیرد.
- **FA Falls:** VIX آرام معمولاً این حمایت را برمی‌دارد.
- **Analogy:** EN: like the price of fire insurance in a dry summer: when the premium jumps, you know the market sees smoke even before any fire. · FA: مثل قیمت بیمهٔ آتش‌سوزی در تابستانی خشک: وقتی حق بیمه جهش می‌کند، یعنی بازار دود را پیش از شعله دیده است.
- **EN Visual:** Seat chip; level-only; the decade range's upper edge is the 2020 pandemic spike — today's marker is read against that history.
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ لبهٔ بالای دامنهٔ ده‌ساله جهش همه‌گیری ۲۰۲۰ است و نشانگر امروز در برابر همان تاریخ خوانده می‌شود.
- **Relations:** R-05, R-22.
- **Notes:** The corpus name «شاخص ترس بازار» is kept as the fa label (established).

#### 3.18 `gold-silver` — The gold-to-silver ratio
**Label FA:** نسبت طلا به نقره · **Tech:** XAU ÷ XAG (gold-api legs; history basis World Bank Pink Sheet) · «نسبت طلا به نقره»
**Measure:** ratio (ounces of silver per ounce of gold) · ratio · daily · ref: rolling 10-year window · **level-only** (percentile of the ratio itself) · **polarity +1** (a high ratio IS the monetary-stress read) · source: derived
- **EN default:** How many ounces of silver one ounce of gold buys. A very high ratio is a classic fear reading — markets paying up for monetary metal over industrial metal.
- **FA default:** هر اونس طلا چند اونس نقره می‌خرد. نسبتِ بسیار بالا قرائتی کلاسیک از ترس است؛ بازار برای فلز پولی بیش از فلز صنعتی هزینه می‌کند.
- **EN What/Why:** Silver is both a monetary and an industrial metal; gold is purely monetary. When fear dominates, gold outperforms silver and the ratio spikes; when growth optimism dominates, silver catches up and the ratio falls. The ratio is therefore a stress gauge built from precious metals themselves — this seat reads that stress.
- **FA What/Why:** نقره هم فلز پولی است هم صنعتی؛ طلا فقط پولی است. وقتی ترس غالب می‌شود، طلا از نقره پیشی می‌گیرد و نسبت جهش می‌کند؛ وقتی خوش‌بینی به رشد غالب است، نقره جبران می‌کند و نسبت می‌افتد. این نسبت در واقع سنجهٔ تنشی است که از دلِ خود فلزهای گران‌بها ساخته شده و این کرسی همان تنش را می‌خواند.
- **EN Rises:** A ratio high in its decade typically marks monetary fear — the engine's tailwind side. Historical spikes: 1991, 2008, 2020 (the pandemic extreme printed above 120).
- **EN Falls:** A falling ratio typically reads as risk appetite returning — the engine's headwind side for this seat.
- **FA Rises:** نسبتِ بالای دامنهٔ ده‌ساله معمولاً نشانهٔ ترس پولی است؛ سمتِ حامی در موتور. جهش‌های تاریخی: ۱۹۹۱، ۲۰۰۸ و ۲۰۲۰ (افزایش همه‌گیری بالای ۱۲۰ چاپ شد).
- **FA Falls:** نسبتِ نزولی معمولاً بازگشت اشتها به ریسک را نشان می‌دهد؛ سمتِ فشار برای این کرسی.
- **Analogy:** EN: like comparing the price of a bunker to the price of a pickup truck: when the bunker gets relatively expensive, you learn what people are preparing for. · FA: مثل مقایسهٔ قیمت پناهگاه زیرزمینی با قیمت وانت: وقتی پناهگاه نسبتاً گران می‌شود، می‌فهمید مردم برای چه آماده می‌شوند.
- **EN Visual:** Seat chip + the ratios context card (the same number shown as a comparison); the level marker sits on the ratio's own decade range. The ratio is ABOUT gold — the meter reads it as stress, not as a price.
- **FA Visual:** کارت کرسی + کارت نسبت‌ها (همان عدد به‌عنوان یک مقایسه)؛ نشانگر سطح روی دامنهٔ ده‌سالهٔ خودِ نسبت می‌نشیند. این نسبت دربارهٔ خود طلاست؛ متر آن را به‌عنوان تنش می‌خواند نه قیمت.
- **Relations:** R-06 (the ratio ↔ stress), R-05.
- **Notes:** Level-only rule (ratio percentile); the history base was deepened at GF-P1 (World Bank). Distinct from silver's own Signals verdict (04's non-duplicate verification).

#### 3.19 `term-premium-10y` — The 10-year term premium
**Label FA:** صرف سررسید ۱۰سالهٔ آمریکا · **Tech:** 10-Year Term Premium, Kim–Wright model estimate, FRED `THREEFYTP10` · «صرف سررسید ۱۰ سالهٔ آمریکا»
**Measure:** percentage points · index (model estimate) · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.07 pt or decade band · **polarity +1** · source: FRED (THREEFYTP10)
- **EN default:** The extra yield investors demand for holding long-dated bonds beyond expected short rates — the fear-and-supply compensation. A rising premium has historically supported, not hurt, gold.
- **FA default:** بازدهی اضافی که سرمایه‌گذاران برای نگه‌داشتن اوراق بلندمدت، فراتر از نرخ‌های کوتاه‌مدتِ مورد انتظار، مطالبه می‌کنند؛ جبرانِ ترس و عرضه. رشد این صرف از نظر تاریخی به طلا کمک کرده است نه اینکه آسیب بزند.
- **EN What/Why:** Long yields have two engines: expected policy and this premium. When the premium lifts the yield — fiscal fear, bond-supply worry, inflation-risk compensation — the "yields are 5%, why isn't gold collapsing?" question answers itself: it is the debasement configuration, historically gold-supportive. The exception: inside funding stress, a premium spike can first hit gold through margin spirals (the 2022 gilt episode's analog) before the hedge bid dominates.
- **FA What/Why:** بازده بلندمدت دو موتور دارد: سیاستِ مورد انتظار و همین صرف. وقتی صرف، بازده را بالا می‌برد (ترس مالی، نگرانی از عرضهٔ اوراق، جبران ریسک تورم) پرسشِ «بازده ۵٪ است، چرا طلا سقوط نمی‌کند؟» خودش جواب می‌شود: این آرایشِ کلاسیکِ فرسایش پول است و از نظر تاریگی به نفع طلا بوده است. استثنا: در تنش تأمین مالی، جهش صرف می‌تواند نخست از راه مارپیچ وثیقه به طلا ضربه بزند (همتای بحران گیلت ۲۰۲۲) و بعد تقاضای پوشش غالب شود.
- **EN Rises:** A rising term premium typically supports gold (the fear compensation channel) — with the funding-stress exception noted.
- **EN Falls:** A compressed premium typically removes that specific support.
- **FA Rises:** صرف سررسیدِ رونده معمولاً از طلا حمایت می‌کند (کانال جبران ترس)؛ با استثنای تنش تأمین مالی.
- **FA Falls:** صرفِ فشرده معمولاً این حمایتِ خاص را برمی‌دارد.
- **Analogy:** — (omitted: the decomposition card's education block already teaches this leg; a second analogy would compete).
- **EN Visual:** Seat chip + the decomposition card's "premium" leg with its model-estimate disclosure (revised over time, not a market quote). Watch which leg drives a nominal-yield move — real, breakeven or premium — before reading it for gold.
- **FA Visual:** کارت کرسی + پایهٔ «صرف» در کارت تفکیک بازده همراه با افشای برآوردِ مدل بودن (در گذر زمان بازنگری می‌شود، نقل‌قول بازار نیست). پیش از تعبیر برای طلا ببینید کدام پایه حرکت اسمی را می‌راند: واقعی، سربه‌سر یا صرف.
- **Relations:** R-04 (premium ↔ gold), R-03.
- **Notes:** The 0.07-pt threshold activated at GF-P2.

#### 3.20 `ebp` — Excess bond premium
**Label FA:** صرف اضافی اوراق شرکت‌ها · **Tech:** Excess Bond Premium (Gilchrist–Zakrajšek), Federal Reserve Board FEDS Notes · «صرف اضافی اوراق قرضه»
**Measure:** index points · index · monthly · ref: rolling 10-year window · **level-only** · **polarity +1** · source: Federal Reserve Board (frb-ebp)
- **EN default:** The extra yield corporate bonds pay beyond what their expected defaults justify — the research literature's preferred risk-appetite gauge. Elevated readings lean toward gold.
- **FA default:** بازدهی اضافیِ اوراق شرکت‌ها فراتر از آنچه نکولِ مورد انتظارشان توجیه می‌کند؛ سنجهٔ ترجیحیِ ادبیات پژوهشی برای اشتها به ریسک. قرائت‌های بالا به نفع طلا گرایش دارند.
- **EN What/Why:** When investors charge companies more than credit risk alone explains, it signals broad risk aversion in credit markets — often earlier and deeper than equity volatility. Historically, elevated EBP marks risk-off phases in which gold's haven role gets bid.
- **FA What/Why:** وقتی سرمایه‌گذاران از شرکت‌ها بیش از توجیهِ ریسک اعتباری مایل می‌گیرند، نشانهٔ بی‌میلیِ فراگیر به ریسک در بازار اعتبار است؛ اغلب زودتر و عمیق‌تر از نوسان سهام. از نظر تاریخی، EBP بالا فازهای گریز از ریسک را علامت می‌زند که در آن‌ها نقش پناه‌گاهی طلا تقویت می‌شود.
- **EN Rises:** A rising EBP typically supports gold (deepening risk aversion).
- **EN Falls:** A falling EBP typically reads as risk appetite returning.
- **FA Rises:** رشد EBP معمولاً از طلا حمایت می‌کند (عمیق‌ترشدن بی‌میلی به ریسک).
- **FA Falls:** افت EBP معمولاً بازگشت اشتها به ریسک خوانده می‌شود.
- **Analogy:** — (omitted: 3.17's insurance analogy carries the family; a second would dilute).
- **EN Visual:** Seat chip; level-only; monthly cadence — slow-moving, read the level not the wiggle.
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ چرخهٔ ماهانه؛ حرکت کند است، سطح را بخوانید نه تکانه‌ها را.
- **Relations:** R-05.
- **Notes:** —

#### 3.21 `michigan-sentiment` — US consumer mood
**Label FA:** حال و هوای مصرف‌کنندهٔ آمریکا · **Tech:** University of Michigan Consumer Sentiment Index, FRED `UMCSENT` · «حال و هوای مصرف‌کنندهٔ آمریکا»
**Measure:** index points · index · monthly · ref: rolling 10-year window · **level-only** · **polarity −1 (inverted: LOW mood = the gold-positive side)** · source: FRED (UMCSENT)
- **EN default:** How cheerful or gloomy American households feel about the economy. Gloom is the gold-positive side of this seat — pessimism historically feeds haven demand.
- **FA default:** آمریکایی‌ها دربارهٔ اقتصاد چقدر خوش‌حال یا نگران‌اند. بدبختی، سمتِ طلا-مثبتِ این کرسی است؛ بدبینی از نظر تاریخی تقاضای پناه‌گاهی را تقویت می‌کند.
- **EN What/Why:** A survey-based mood gauge that moves with gas prices, jobs and inflation experience. Pessimistic consumers coincide with uncertainty-heavy periods in which gold's insurance role gets bought; optimistic consumers coincide with risk-on phases. The engine reads it inverted (falling = supports).
- **FA What/Why:** سنجه‌ای پیمایشی از حال‌وهوا که با قیمت بنزین، اشتغال و تجربهٔ تورم حرکت می‌کند. مصرف‌کنندهٔ بدبین با دوره‌های پرهیجانِ عدم قطعیت همراه است که در آن‌ها نقش بیمه‌ای طلا خریداری می‌شود؛ خوش‌بینی با فازهای ریسک‌پذیری همراه است. موتور آن را معکوس می‌خواند (افت = حمایت).
- **EN Rises:** Rising cheer typically pressures gold (risk-on).
- **EN Falls:** Falling mood typically supports gold — the haven channel through pessimism.
- **FA Rises:** شادیِ رونده معمولاً بر طلا فشار می‌آورد (اشتها به ریسک).
- **FA Falls:** افت حال‌وهوا معمولاً از طلا حمایت می‌کند؛ کانال پناه‌گاه از راه بدبینی.
- **Analogy:** — (omitted: survey concept is plain).
- **EN Visual:** Seat chip; level-only; the why-line renders honestly when the UoM feed is stopped (the current unread state).
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ وقتی جریان دادهٔ میشیگان قطع است، دلیلش صادقانه نمایش داده می‌شود (وضعیت ناخوانای کنونی).
- **Relations:** R-05, R-08 (mood ↔ inflation expectations).
- **Notes:** Honest state at S1 capture: unread (UoM upstream stopped). The three UoM seats share one cause-class why-line.

#### 3.22 `gpr-daily` — Geopolitical risk (7-day)
**Label FA:** ریسک ژئوپلیتیک (۷روزه) · **Tech:** Geopolitical Risk Index, 7-day moving average of the daily series (GPRD_MA7), Caldara–Iacoviello · «ریسک ژئوپلیتیک (۷روزه)»
**Measure:** index points · index · daily (with ~6-day publication lag) · ref: rolling 10-year window · **level-only** · **polarity +1** · source: GPR (matteoiacoviello.com)
- **EN default:** How much war, terror and tension coverage fills the world's newspapers this week. Spikes usually feed gold's headline bid — often briefly.
- **FA default:** هفتهٔ گذشته اخبار جنگ، ترور و تنش چه حجمی از روزنامه‌های جهان را پر کرده است. جهش‌ها معمولاً تقاضای سرفصل‌دار طلا را تقویت می‌کنند؛ اغلب گذرا.
- **EN What/Why:** A newspaper-based index counting geopolitical words across major outlets. Gold often rallies on escalation fear and fades when the feared consequences do not materialize — the classic two-phase event pattern (bid the rumor, settle the news). Position readings rather than headlines usually matter more for gold's direction beyond the event window.
- **FA What/Why:** شاخصی بر پایهٔ روزنامه‌ها که واژه‌های ژئوپلیتیک را در نشریات اصلی می‌شمارد. طلا اغلب با ترس از تشدید بالا می‌رود و وقتی پیامدهای ترسیده‌شده رخ نمی‌دهد، فروکش می‌کند؛ الگوی دوفازی کلاسیک رخداد (خرید با شایعه، تسویه با خبر). برای جهتِ طلا فراتر از پنجرهٔ رخداد، معمولاً قرائت‌های ساختاری مهم‌تر از تیترها هستند.
- **EN Rises:** A spike typically supports gold near-term; historically much of the event premium fades within days to weeks when consequences don't materialize.
- **EN Falls:** Easing coverage typically removes the event bid.
- **FA Rises:** جهش معمولاً در کوتاه‌مدت از طلا حمایت می‌کند؛ از نظر تاریخی بخش زیادی از صرفِ رخداد در چند روز تا چند هفته فروکش می‌کند اگر پیامدها محقق نشوند.
- **FA Falls:** آرام‌شدن پوشش خبری معمولاً تقاضای رخدادمحور را برمی‌دارد.
- **Analogy:** — (omitted: the headline-fade pattern is the useful idea and it is already plain above).
- **EN Visual:** Seat chip; level-only; ~6-day lag is printed (pipeline-lag why-line when late).
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ تأخیر حدوداً شش‌روزه چاپ می‌شود (وایل‌لاینِ تأخیر خط لوله در صورت دیررسیدن).
- **Relations:** R-07 (GPR ↔ gold).
- **Notes:** The owner's object choice: the daily MA7 over the monthly gpr-index (fires 1316 vs 1114 windows — the recorded seat decision).

#### 3.23 `epu-us` — US economic policy uncertainty
**Label FA:** عدم قطعیت سیاست اقتصادی آمریکا · **Tech:** Economic Policy Uncertainty Index (Baker–Bloom–Davis), EPU · «عدم قطعیت سیاست اقتصادی آمریکا»
**Measure:** index points · index · monthly · ref: rolling 10-year window · **level-only** · **polarity +1** · source: EPU (policyuncertainty.com)
- **EN default:** How uncertain US policy looks — elections, regulation, fiscal fights. Elevated uncertainty raises gold's hedging premium.
- **FA default:** سیاست آمریکا چقدر غیرقابل‌پیش‌بینی به نظر می‌رسد؛ انتخابات، مقررات، چانه‌زنی‌های بودجه‌ای. عدم قطعیت بالا، صرف پوششی طلا را بالا می‌برد.
- **EN What/Why:** A newspaper-based index tracking policy-uncertainty coverage. Unlike war risk (3.22), this is domestic-policy noise: shutdowns, tariff fights, election cliffs. Uncertainty about rules raises the value of an asset outside any single policy regime — gold's insurance case.
- **FA What/Why:** شاخصی روزنامه‌محور که پوششِ عدم قطعیت سیاستی را دنبال می‌کند. برخلاف ریسک جنگ (۳٫۲۲)، این نوفهٔ سیاست داخلی است: تعطیلی دولت، جنگ تعرفه، پرتگاه انتخاباتی. وقتی قواعد بازی مبهم می‌شوند، ارزش دارایی‌ای که بیرون از هر رژیم سیاستی می‌ایستد بالا می‌رود؛ همان دفاعهٔ بیمه‌ای طلا.
- **EN Rises:** Rising policy uncertainty typically supports gold's hedging demand.
- **EN Falls:** Settled policy typically removes it.
- **FA Rises:** عدم قطعیت سیاستیِ رونده معمولاً تقاضای پوششی طلا را تقویت می‌کند.
- **FA Falls:** سیاستِ آرام معمولاً آن را برمی‌دارد.
- **Analogy:** — (omitted: 3.22 covers the event-family; the domestic-policy distinction is stated above).
- **EN Visual:** Seat chip; level-only; monthly.
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ ماهانه.
- **Relations:** R-07, R-05.
- **Notes:** The tpu-us alternative (trade-policy column) was the recorded one-seat swap candidate — kept out per the seat decision.

#### 3.24 `sp500-breadth-ratio` — Stock market breadth
**Label FA:** گستردگی بازار سهام آمریکا · **Tech:** S&P 500 equal-weight ÷ cap-weight proxy (RSP ÷ SPY, Yahoo closes) · «گستردگی بازار سهام آمریکا»
**Measure:** percent (ratio ×100) · ratio · daily · ref: rolling 10-year window · **level-only** · **polarity −1 (inverted: FALLING breadth = the gold-positive side)** · source: Yahoo (RSP/SPY)
- **EN default:** Whether the stock rally is broad or carried by a handful of giants. Narrowing breadth is the risk-off side — gold-positive in this meter.
- **FA default:** رشد سهام فراگیر است یا بر دوش چند غول. تنگ‌شدن گستردگی، سمتِ گریز از ریسک است؛ در این متر به نفع طلا.
- **EN What/Why:** When the equal-weight fund lags the cap-weight index, the market's advance concentrates in its largest names — historically a late-stage, fragile pattern. Falling breadth often precedes risk-off phases in which gold's haven demand builds. The engine reads it inverted (falling = supports).
- **FA What/Why:** وقتی صندوقِ هم‌وزن از شاخصِ ارزش‌بازاری عقب می‌ماند، یعنی رشد بازار در چند نام بزرگ متمرکز شده است؛ از نظر تاریخی الگویی دیرهنگام و شکننده. افت گستردگی اغلب پیش از فازهای گریز از ریسک می‌آید که در آن‌ها تقاضای پناه‌گاهی طلا شکل می‌گیرد. موتور آن را معکوس می‌خواند (افت = حمایت).
- **EN Rises:** Rising breadth (broad participation) typically pressures gold (healthy risk appetite).
- **EN Falls:** Falling breadth typically supports gold (fragile, narrowing advance).
- **FA Rises:** گستردگیِ رونده (مشارکت فراگیر) معمولاً بر طلا فشار می‌آورد (اشتها به ریسکِ سالم).
- **FA Falls:** افت گستردگی معمولاً از طلا حمایت می‌کند (رشدِ شکننده و متمرکز).
- **Analogy:** EN: like a parade where only the brass band is still marching: the show continues, but fewer and fewer marchers are actually walking. · FA: مانند رژه‌ای که فقط گروه موسیقی هنوز در حال حرکت است: نمایش ادامه دارد، اما رژه‌روهای کمتر و کمتری واقعاً راه می‌روند.
- **EN Visual:** Seat chip; level-only; labelled a proxy in its layer-1 copy (the RSP/SPY construction is disclosed).
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ در متن لایهٔ یکم به‌عنوان «تقریب» معرفی می‌شود (ساختار RSP/SPY افشا شده است).
- **Relations:** R-05, R-23 (equities ↔ gold).
- **Notes:** Proxy construction (equal/cap weight) disclosed per the S6 discipline.

#### 3.25 `bank-stress` — Bank stress (discount window price)
**Label FA:** تنش بانکی (قیمت پنجره تنزیل) · **Tech:** Discount-window primary credit rate, FRED `DPCREDIT` · «تنش بانکی»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.1 pt or decade band · **polarity +1** · source: FRED (DPCREDIT)
- **EN default:** The price at which banks borrow emergency cash from the Fed's standing facility. This rate moving is itself the signal — it normally only moves when banks are stressed.
- **FA default:** قیمتی که بانک‌ها از تسهیلات دائمی فدرال رزرو پول اضطراری می‌خرند. حرکتِ خودِ این نرخ سیگنال است؛ در حالت عادی فقط وقتی حرکت می‌کند که بانک‌ها در تنش باشند.
- **EN What/Why:** The primary credit rate is a standing facility price — mostly a ceiling that sits above the policy rate. It changes when the Fed adjusts the corridor or when stress episodes (2008, 2023's regional-bank scare) make emergency borrowing and its pricing newsworthy. Elevated readings mark banking-system stress, historically a strong gold-haven trigger.
- **FA What/Why:** نرخ اعتبار اولیه، قیمتِ یک تسهیلات دائمی است؛ عمدتاً سقفی که بالای نرخ سیاستی می‌نشیند. وقتی فدرال رزرو دهانه را تنظیم می‌کند یا وقتی تنش (۲۰۰۸، ترس بانک‌های منطقه‌ای ۲۰۲۳) قرض‌گرفتن اضطراری را خبرساز می‌کند، این نرخ تغییر می‌کند. قرائت‌های بالا، تنش نظام بانکی را علامت می‌زنند که از نظر تاریخی محرکی قوی برای پناه‌گاه طلا بوده است.
- **EN Rises:** A move up typically marks stress feeding gold's haven bid.
- **EN Falls:** A return to the quiet ceiling typically reads as normalization.
- **FA Rises:** حرکت به بالا معمولاً تنشی را علامت می‌زند که تقاضای پناه‌گاهی طلا را تغذیه می‌کند.
- **FA Falls:** بازگشت به سقفِ آرام، معمولاً عادی‌شدن وضعیت خوانده می‌شود.
- **Analogy:** — (omitted: "the emergency-room price" framing is already in the default copy's idea; enough).
- **EN Visual:** Seat chip; the series is a step function — long flat, rare jumps; the decade marker contextualizes any jump.
- **FA Visual:** کارت کرسی؛ سری پله‌ای است؛ مدت‌ها صاف و گاه جهشی؛ نشانگر ده‌ساله به هر جهش بافت می‌دهد.
- **Relations:** R-05.
- **Notes:** The GF-S10 name repair is recorded: DPCREDIT is the discount-window primary credit rate (the "commercial paper" description was corrected at seat level). Seated at GF-P3.

### 3.D Inflation & inflation expectations · «تورم و انتظارات تورمی» (10 seats, all polarity +1: running hot = tailwind, cooling = headwind)

#### 3.26 `us-cpi-yoy` — US consumer inflation
**Label FA:** تورم مصرف‌کنندهٔ آمریکا · **Tech:** CPI, all items, 12-month percent change (CPIAUCNS), FRED · «تورم آمریکا (CPI)»
**Measure:** percent YoY · percent-change · monthly (with release lag) · ref: rolling 10-year window · fires: 30-day change ≥ 0.15 pt (since-previous-release) or decade band · **polarity +1** · source: FRED (CPIAUCNS)
- **EN default:** How fast US consumer prices are rising over the past year. Hot inflation feeds gold's hedge demand — but how the Fed responds matters more for the price (see real rates).
- **FA default:** قیمت‌های مصرف‌کنندهٔ آمریکا در سال گذشته چقدر رشد کرده است. تورم داغ، تقاضای پوششی طلا را تقویت می‌کند؛ اما برای قیمت طلا، واکنش فدرال رزرو مهم‌تر است (بازده واقعی را ببینید).
- **EN What/Why:** The headline cost-of-living measure. Gold's reputation as an inflation hedge is earned over decades, not weeks: over long horizons it tracks purchasing power; over a few quarters what matters most is the policy response to inflation, which is why real rates (3.1) are the better day-to-day guide. In this meter, a hot print is the hedge-demand side.
- **FA What/Why:** سنجهٔ اصلی هزینهٔ زندگی. اعتبار طلا به‌عنوان پوشش تورم در دهه‌ها ساخته شده است، نه در چند هفته؛ در افق بلند قدرت خرید را دنبال می‌کند و در چند فصل، واکنش سیاستی به تورم مهم‌ترین چیز است؛ به همین دلیل بازده واقعی (۳٫۱) راهنمای روزمرهٔ بهتری است. در این متر، چاپ داغ، سمت تقاضای پوششی است.
- **EN Rises:** Hotter inflation typically supports the hedge case. The nuance: if it brings hawkish policy, the real-rate channel can dominate and pressure gold.
- **EN Falls:** Cooling inflation typically weakens the immediate hedge case.
- **FA Rises:** تورم داغ‌تر معمولاً دفاعهٔ پوششی را تقویت می‌کند؛ نکته این است که اگر سیاست انقباضی بیاورد، کانال نرخ واقعی می‌تواند غالب شود و به طلا فشار بیاورد.
- **FA Falls:** خنک‌شدن تورم معمولاً دفاعهٔ پوششیِ فوری را ضعیف می‌کند.
- **Analogy:** — (omitted: hedge concept is common knowledge at this altitude; the decomposition card teaches the mechanism better).
- **EN Visual:** Seat chip; the month-on-release change fires the seat (adjacent-months method label when the gap-method lights); the decade range shows where today's inflation sits (the 2022 peak is the top edge).
- **FA Visual:** کارت کرسی؛ تغییر نسبت به انتشار قبلی کرسی را فعال می‌کند (برچسب روش ماه‌های مجاور وقتی روش شکاف روشن شود)؛ دامنهٔ ده‌ساله نشان می‌دهد تورم امروز کجاست (قلهٔ ۲۰۲۲ لبهٔ بالاست).
- **Relations:** R-08 (inflation ↔ gold), R-01 (the response channel), R-24 (supply chain pass-through).
- **Notes:** Honest upstream-gap why-line class exists for late data (adjacent-months method).

#### 3.27 `us-pce-core-yoy` — US core inflation (the Fed's gauge)
**Label FA:** تورم هسته‌ای آمریکا (PCE) · **Tech:** Personal Consumption Expenditures excluding food and energy, 12-month change (PCEPILFE), FRED · «تورم هسته‌ای آمریکا (PCE)»
**Measure:** percent YoY · percent-change · monthly (with release lag) · ref: rolling 10-year window · **level-only** · **polarity +1** · source: FRED (PCEPILFE)
- **EN default:** The Fed's preferred inflation gauge — the stickier, food-and-energy-excluded measure. Persistent core inflation keeps the hedge case alive.
- **FA default:** سنجهٔ تورمی محبوب فدرال رزرو؛ نسخهٔ چسبنده‌تر بدون غذا و انرژی. تورم هسته‌ایِ مداوم، دفاعهٔ پوششی را زنده نگه می‌دارد.
- **EN What/Why:** Core PCE strips the noisy categories to show the underlying trend the Fed actually targets. Because policy responds to this number, it links the inflation story to the rates story: hot core keeps policy tight, which is why the two channels can pull gold in opposite directions.
- **FA What/Why:** PCE هسته‌ای دسته‌های پرنوسان را کنار می‌گذارد تا روند زیرین، همان که فدرال رزرو هدفش می‌گیرد، دیده شود. چون سیاست به همین عدد پاسخ می‌دهد، روایت تورم را به روایت نرخ بهره وصل می‌کند؛ هستهٔ داغ سیاست را سفت نگه می‌دارد و به همین دلیل دو کانال می‌توانند طلا را به دو سو بکشند.
- **EN Rises:** Rising core inflation supports the hedge case; the policy response may counter it.
- **EN Falls:** Cooling core typically weakens it.
- **FA Rises:** تورم هسته‌ایِ رونده از دفاعهٔ پوششی حمایت می‌کند؛ پاسخ سیاستی ممکن است خنثیش کند.
- **FA Falls:** هستهٔ خنک‌شونده معمولاً آن را ضعیف می‌کند.
- **Analogy:** — (omitted: 3.26 carries the family).
- **EN Visual:** Seat chip; level-only; monthly.
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ ماهانه.
- **Relations:** R-08, R-01, R-15.
- **Notes:** —

#### 3.28 `euro-hicp` — Euro-area inflation
**Label FA:** تورم منطقهٔ یورو · **Tech:** Harmonised Index of Consumer Prices, annual rate (HICP), ECB Data Portal · «تورم منطقهٔ یورو (HICP)»
**Measure:** percent YoY · percent-change · monthly · ref: rolling 10-year window · **level-only** · **polarity +1** · source: ECB Data Portal
- **EN default:** Eurozone consumer inflation — the other half of the rich-world inflation picture gold is priced against.
- **FA default:** تورم مصرف‌کنندهٔ منطقهٔ یورو؛ نیمهٔ دیگرِ تصویر تورمی جهان ثروتمندی که طلا در برابرش قیمت می‌خورد.
- **EN What/Why:** The euro area is the second-largest economic bloc; its inflation drives the ECB (3.6) and European savers' hedge behavior. Global inflation rather than any single country's drives the worldwide gold-hedge bid — this seat widens the lane beyond America.
- **FA What/Why:** منطقهٔ یورو دومین بلوک اقتصادی جهان است؛ تورمش بانک مرکزی اروپا (۳٫۶) و رفتار پوششی پس‌اندازکنندگان اروپایی را هدایت می‌کند. تقاضای پوششیِ جهانی طلا را تورمِ جهانی می‌سازد نه تورم یک کشور؛ این کرسی دامنهٔ خانواده را از آمریکا فراتر می‌برد.
- **EN Rises:** Hot euro-area inflation supports the global hedge case.
- **EN Falls:** Euro disinflation weakens it.
- **FA Rises:** تورم داغ منطقهٔ یورو دفاعهٔ پوششی جهانی را تقویت می‌کند.
- **FA Falls:** کاهش تورم یورو آن را ضعیف می‌کند.
- **Analogy:** — (omitted).
- **EN Visual:** Seat chip; level-only; monthly.
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ ماهانه.
- **Relations:** R-08.
- **Notes:** The v1.2 taxonomy amendment records this as the euro-area realized-inflation row (the owner's recorded G, 2026-11-05).

#### 3.29 `breakeven-5y5y` — Long-horizon inflation expectations
**Label FA:** انتظارات تورمی بلندمدت (۵ تا ۱۰ سال آینده) · **Tech:** 5-Year, 5-Year Forward Inflation Expectation Rate, FRED `T5YIFR` · «انتظارات تورمی ۵ تا ۱۰ ساله»
**Measure:** percent (annualized) · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.1 pt or decade band · **polarity +1** · source: FRED (T5YIFR)
- **EN default:** The inflation rate markets expect for the five years starting five years from now — the cleanest read on long-run faith in money. Rising long expectations are gold's side.
- **FA default:** تورمی که بازار برای پنج سالِ آغازشده از پنج سال بعد انتظار دارد؛ تمیزترین قرائتِ اعتماد بلندمدت به پول. انتظارات بلندمدتِ رونده، سمتِ طلاست.
- **EN What/Why:** By skipping the near-term noise, this forward rate captures what bond markets believe about inflation in the long run. It is the market-priced version of "will money hold its value" — the question underneath gold's structural case. When it climbs, the debasement worry is building.
- **FA What/Why:** با کنار گذاشتن نوفهٔ کوتاه‌مدت، این نرخِ آینده‌نگر نشان می‌دهد بازار اوراق دربارهٔ تورمِ بلندمدت چه باور دارد. این نسخهٔ قیمت‌گذاری‌شدهٔ این پرسش است که «آیا پول ارزشش را حفظ می‌کند»؛ همان پرسشی که زیربنای جایگاه ساختاری طلاست. وقتی بالا می‌رود، نگرانی فرسایش پول در حال ساخته‌شدن است.
- **EN Rises:** Rising long-horizon expectations typically support gold's structural case.
- **EN Falls:** Falling long expectations typically cool it.
- **FA Rises:** انتظارات بلندمدتِ رونده معمولاً دفاعهٔ ساختاری طلا را تقویت می‌کند.
- **FA Falls:** انتظارات بلندمدتِ نزولی معمولاً آن را خنک می‌کند.
- **Analogy:** EN: like asking not "will it rain this week?" but "is the climate getting wetter?" — the forward rate answers the climate question about money. · FA: مثل این نیست که بپرسیم «این هفته باران می‌آید؟» بلکه «آیا آب‌وهوا رو به مرطوب‌تر شدن است؟»؛ نرخ آینده‌نگر به پرسش اقلیمی دربارهٔ پول پاسخ می‌دهد.
- **EN Visual:** Seat chip + the Signals expectations condition; decade-range marker. The 2022 spike is the range's top reference.
- **FA Visual:** کارت کرسی + وضعیت انتظارات در بخش سیگنال‌ها؛ نشانگر دامنهٔ ده‌ساله. جهش ۲۰۲۲ مرجع بالای دامنه است.
- **Relations:** R-08, R-03 (the breakeven family), R-10 (debasement).
- **Notes:** —

#### 3.30 `breakeven-tilt` — The tilt of inflation expectations
**Label FA:** شیب انتظارات تورمی · **Tech:** T5YIFR − T5YIE (long-horizon minus 5-year breakeven), derived · «شیب انتظارات تورمی»
**Measure:** percentage points · level · daily · ref: rolling 10-year window · **level-only by design (D-5)** · **polarity +1** (a building tilt is the tailwind side) · source: derived (FRED legs)
- **EN default:** Whether long-run inflation expectations are pulling ahead of near-term ones — expectations building rather than receding.
- **FA default:** آیا انتظارات تورمیِ بلندمدت از کوتاه‌مدت جلو می‌زنند؛ انتظارات در حال شدت‌گیری‌اند یا فروکش.
- **EN What/Why:** The gap between what markets price for the far future (3.29) and the medium term (3.31). A widening tilt says the market is extending inflation into the long run rather than treating it as a passing spike — the difference between a scare and a regime shift, which is exactly the distinction gold's structural case cares about.
- **FA What/Why:** فاصلهٔ آنچه بازار برای آیندهٔ دور قیمت می‌گذارد (۳٫۲۹) و میان‌مدت (۳٫۳۱). شیبِ بازشونده یعنی بازار تورم را به بلندمدت گسترش می‌دهد نه اینکه جهشی گذرا ببیند؛ همین تمایز میان یک هراس و یک تغییر رژیم است که دفاعهٔ ساختاری طلا به آن اهمیت می‌دهد.
- **EN Rises:** A widening tilt (long expectations pulling ahead) is the tailwind side.
- **EN Falls:** A narrowing tilt (expectations folding back to the near term) is the headwind side.
- **FA Rises:** شیب بازشونده (جلوزدن انتظارات بلندمدت) سمتِ حامی است.
- **FA Falls:** شیب بسته‌شونده (بازگشت انتظارات به افق نزدیک) سمتِ فشار است.
- **Analogy:** — (omitted: 3.29's climate analogy carries the family).
- **EN Visual:** Seat chip; the lean phrase rides the gold panel's inflation lane beside the lane word (the D-5 promotion's own recorded placement).
- **FA Visual:** کارت کرسی؛ عبارت گرایش کنار واژهٔ خانوادهٔ تورم در پنل طلا می‌نشیند (جایگاه ثبت‌شدهٔ ارتقای D-5).
- **Relations:** R-08, R-03.
- **Notes:** The 21st voter (D-5, Session 6): polarity +1, level-leg only — the promotion is a scope choice, not an edge claim (the B4 delta was immaterial).

#### 3.31 `t5yie` — 5-year breakeven inflation
**Label FA:** انتظار تورم ۵سالهٔ آمریکا · **Tech:** 5-Year Breakeven Inflation Rate, FRED `T5YIE` · «انتظار تورم ۵ سالهٔ آمریکا»
**Measure:** percent (annualized) · level · daily · ref: rolling 10-year window · fires: 30-day move ≥ 0.1 pt or decade band · **polarity +1** · source: FRED (T5YIE)
- **EN default:** The inflation markets expect over the next five years, read off the yield gap between nominal and inflation-protected bonds.
- **FA default:** تورمی که بازار برای پنج سال آینده انتظار دارد؛ از فاصلهٔ بازده اوراق اسمی و حفاف از تورم خوانده می‌شود.
- **EN What/Why:** The spot-level twin of 3.29: near-term expected inflation as priced in the bond market. It moves with growth, oil and policy news; when the near horizon reprices higher, the hedge bid historically follows. Watch it against the long horizon (the tilt, 3.30) to see whether the market treats inflation as passing or persistent.
- **FA What/Why:** دوقلوی سطحیِ ۳٫۲۹: تورمِ مورد انتظارِ افق نزدیک، همان‌طور که در بازار اوراق قیمت خورده. با اخبار رشد، نفت و سیاست حرکت می‌کند؛ وقتی افق نزدیک بالاتر بازقیمت‌گذاری می‌شود، تقاضای پوششی از نظر تاریخی همراهش می‌آید. در برابر افق بلند بخوانیدش (شیب، ۳٫۳۰) تا ببینید بازار تورم را گذرا می‌داند یا ماندگار.
- **EN Rises:** Rising near-term expectations typically support the hedge case.
- **EN Falls:** Falling expectations typically cool it.
- **FA Rises:** انتظارات نزدیک‌مدتِ رونده معمولاً از دفاعهٔ پوششی حمایت می‌کند.
- **FA Falls:** انتظارات نزولی معمولاً آن را خنک می‌کند.
- **Analogy:** — (omitted: 3.29's weather/climate pair covers the family).
- **EN Visual:** Seat chip; decade-range marker.
- **FA Visual:** کارت کرسی؛ نشانگر دامنهٔ ده‌ساله.
- **Relations:** R-08, R-03, R-24.
- **Notes:** The 0.10-pt threshold activated at GF-P2.

#### 3.32 `michigan-1y-expectations` — Households' 1-year inflation expectations
**Label FA:** تورم مورد انتظار خانوارها (سال آینده) · **Tech:** University of Michigan 1-Year Expected Inflation, FRED `MICH` · «تورم مورد انتظار سال آینده»
**Measure:** percent · level · monthly · ref: rolling 10-year window · **level-only** · **polarity +1** · source: FRED (MICH)
- **EN default:** What American households expect prices to do next year. Households often price inflation in before markets do.
- **FA default:** خانوارهای آمریکایی از قیمت‌ها در سال آینده چه انتظاری دارند. خانوارها اغلب تورم را پیش از بازارها در محاسباتشان می‌آورند.
- **EN What/Why:** Survey-based expectations capture felt inflation (the gas-pump experience) that bonds price later. Households' expectations feed wage demands and spending behavior — the inflation psychology channel. Rising household expectations historically precede the market's repricing.
- **FA What/Why:** انتظارات پیمایشی، تورمِ تجربه‌شده (حسِ پمپ بنزین) را می‌گیرند که بازار اوراق دیرتر قیمت می‌گذارد. انتظارات خانوار به مطالبهٔ دستمزد و رفتار خرج‌کردن راه پیدا می‌کند؛ کانال روان‌شناسی تورم. رشد انتظارات خانوار از نظر تاریخی پیش از بازقیمت‌گذاری بازار می‌آید.
- **EN Rises:** Rising household expectations support the hedge case.
- **EN Falls:** Falling expectations cool it.
- **FA Rises:** انتظارات روندهٔ خانوار از دفاعهٔ پوششی حمایت می‌کند.
- **FA Falls:** انتظارات نزولی آن را خنک می‌کند.
- **Analogy:** — (omitted).
- **EN Visual:** Seat chip; level-only; honest unread why-line while the UoM feed is stopped.
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ وایل‌لاین صادقانهٔ ناخوانا تا وقتی جریان میشیگان قطع است.
- **Relations:** R-08, R-25 (household ↔ market expectations).
- **Notes:** Honest state at S1 capture: unread (UoM upstream stopped).

#### 3.33 `m2-us` — US money supply growth
**Label FA:** حجم پول آمریکا (M2) · **Tech:** M2 Money Stock, FRED `M2SL`, read at its YoY percentile basis · «حجم پول آمریکا (M2)»
**Measure:** billions of USD, read as YoY percentile · level · monthly · ref: rolling 10-year window on the **YoY basis** (percentileBasis: yoy) · **level-only** · **polarity +1** · source: FRED (M2SL)
- **EN default:** How fast the US money stock is growing. Fast money growth is the debasement channel — the long-horizon argument for owning the asset outside the banking system.
- **FA default:** موجودی پول آمریکا چقدر سریع رشد می‌کند. رشد سریع پول، کانال فرسایش است؛ استدلال بلندمدتِ داشتن دارایی‌ای بیرون از نظام بانکی.
- **EN What/Why:** M2 counts cash, deposits and near-money. More money chasing the same goods eventually shows up in prices; gold is the classic outside-the-system store of value whose long-run price tracks the money stock's path. Honest caveat: this is a decades-scale association, weak at quarterly horizons and contested as a standalone driver — the meter reads it as one seat among ten.
- **FA What/Why:** M2 پول نقد، سپرده‌ها و شبه‌پول را می‌شمارد. پولِ بیشتر در پی کالای ثابت سرانجام در قیمت‌ها دیده می‌شود و طلا store کلاسیک ارزشِ بیرون از سیستم است که قیمت بلندمدتش مسیر موجودی پول را دنبال می‌کند. نکتهٔ صادقانه: این همبستگی در مقیاس دهه‌هاست، در افق فصلی ضعیف است و به‌عنوان محرک مستقل محل نزاع؛ متر آن را یکی از ده کرسی می‌خواند.
- **EN Rises:** Fast money growth supports the long-horizon debasement case.
- **EN Falls:** Contraction or stagnation weakens it.
- **FA Rises:** رشد سریع پول از دفاعهٔ بلندمدت فرسایش حمایت می‌کند.
- **FA Falls:** انقباض یا رکود آن را ضعیف می‌کند.
- **Analogy:** EN: like the number of tickets printed for a fixed number of prizes: print many more tickets and each ticket's claim on a prize shrinks. · FA: مثل تعداد بلیت‌های چاپ‌شده برای جایزه‌های ثابت: بلیت‌های بسیار بیشتر چاپ کن و سهم هر بلیت از جایزه کوچک‌تر می‌شود.
- **EN Visual:** Seat chip; the position reads M2's own YoY growth against its decade (a distinct basis the technical tier names).
- **FA Visual:** کارت کرسی؛ جایگاه، رشد سالانهٔ خودِ M2 را در برابر ده سالش می‌خواند (مبنایی متمایز که لایهٔ فنی نامش را می‌برد).
- **Relations:** R-10 (debasement), R-08.
- **Notes:** The percentileBasis: yoy is the one lane exception to the level-reading rule — disclosed here and in the technical tier.

#### 3.34 `us-deficit-12m` — The US federal deficit (12-month)
**Label FA:** کسری بودجهٔ فدرال آمریکا (۱۲ماهه) · **Tech:** Rolling 12-month sum of the federal deficit, FRED `MTSDS133FMS`, derived · «کسری بودجهٔ فدرال آمریکا (۱۲ماهه)»
**Measure:** percent of GDP · level · monthly · ref: rolling 10-year window · **level-only** · **polarity +1** (the fiscal-debasement channel) · source: derived (FRED MTSDS133FMS)
- **EN default:** How much more Washington spends than it collects, over the trailing year. Big sustained deficits are the fiscal leg of the debasement argument.
- **FA default:** واشنگتن در یک سال گذشته چقدر بیشتر از درآمدش خرج کرده است. کسری‌های بزرگِ مداوم، پایِ مالیِ استدلال فرسایش‌اند.
- **EN What/Why:** Deficits must be financed — by borrowing, by printing, or by growth. Sustained large deficits raise the term premium (3.19), pressure bond supply and, in the strong version of the argument, erode faith in the currency over time. Gold is the asset that prices that erosion.
- **FA What/Why:** کسری باید تأمین مالی شود؛ با قرض، با چاپ پول یا با رشد. کسری بزرگِ مداوم، صرف سررسید (۳٫۱۹) را بالا می‌برد، عرضهٔ اوراق را تحت فشار می‌گذارد و در نسخهٔ قوی استدلال، به‌تدریج اعتماد به ارز را می‌فرساید. طلا دارایی‌ای است که همین فرسایش را قیمت می‌گذارد.
- **EN Rises:** A wider deficit supports the fiscal-debasement case (slow channel).
- **EN Falls:** A narrowing deficit weakens it.
- **FA Rises:** کسری بازتر از دفاعهٔ فرسایش مالی حمایت می‌کند (کانال کُند).
- **FA Falls:** کسری بسته‌شونده آن را ضعیف می‌کند.
- **Analogy:** — (omitted: 3.33's tickets analogy carries the debasement family).
- **EN Visual:** Seat chip; level-only; monthly. The yield-decomposition card links out to this seat's story (the supply leg).
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ ماهانه. کارت تفکیک بازده به روایت این کرسی پیوند دارد (پایهٔ عرضه).
- **Relations:** R-10, R-04.
- **Notes:** —

#### 3.35 `michigan-5y-expectations` — Households' long-run inflation expectations
**Label FA:** انتظار تورم خانوارها (۵ تا ۱۰ سال) · **Tech:** University of Michigan 5–10 Year Expected Inflation (UoM SIE Table 33) · «انتظار تورم ۵ تا ۱۰ ساله»
**Measure:** percent · level · monthly · ref: rolling 10-year window · **level-only (the I3 precedent)** · **polarity +1** · source: UoM (SIE Table 33)
- **EN default:** The inflation rate American households expect for the next 5–10 years — the slow, household version of the long breakeven.
- **FA default:** نرخ تورمی که خانوارهای آمریکایی برای ۵ تا ۱۰ سال آینده انتظار دارند؛ نسخهٔ کُند و خانوارمحورِ سربه‌سر بلندمدت.
- **EN What/Why:** The 5–10y horizon is the regime label households carry — what they believe money will do across a full cycle. It is the slow companion of the market-priced 5y5y (3.29): when households' long-run expectations shift, the psychology underneath gold's structural case has moved.
- **FA What/Why:** افق ۵ تا ۱۰ ساله برچسب رژیمی است که خانوارها با خود حمل می‌کنند؛ باورشان دربارهٔ کاری که پول در یک چرخهٔ کامل می‌کند. هم‌قدمِ کُندِ سربه‌سر ۵ به ۵ سالِ بازار (۳٫۲۹) است: وقتی انتظارات بلندمدت خانوار جابه‌جا شود، روان‌شناسیِ زیربنای دفاعهٔ ساختاری طلا حرکت کرده است.
- **EN Rises:** Rising household long-run expectations support the structural case.
- **EN Falls:** Falling expectations cool it.
- **FA Rises:** انتظارات بلندمدتِ روندهٔ خانوار از دفاعهٔ ساختاری حمایت می‌کند.
- **FA Falls:** انتظارات نزولی آن را خنک می‌کنند.
- **Analogy:** — (omitted).
- **EN Visual:** Seat chip; level-only; honest unread why-line while the UoM feed is stopped.
- **FA Visual:** کارت کرسی؛ فقط-سطحی؛ وایل‌لاین صادقانهٔ ناخوانا تا وقتی جریان میشیگان قطع است.
- **Relations:** R-08, R-25.
- **Notes:** Seated at GF-S10; level-leg only (the I3 precedent). Honest state at S1 capture: unread (UoM upstream stopped).

### 3.E Trader positioning & flows · «پوزیشن معامله‌گران و جریان‌ها» (2 seats, both polarity −1: crowded = headwind, capitulated/calm = tailwind)

#### 3.36 `cftc-gold-positioning` — Trader positioning in gold
**Label FA:** پوزیشن معامله‌گران طلا · **Tech:** CFTC Commitments of Traders, net noncommercial position as % of open interest, GOLD - COMEX (futures-only, deafut.txt) · «پوزیشن معامله‌گران طلا»
**Measure:** percent of open interest · level · weekly (with days lag) · ref: rolling 10-year window · **level-only** · **polarity −1 (crowded longs are fragile)** · source: CFTC
- **EN default:** What futures speculators are doing in gold — the market's fuel gauge. Very crowded long positions are historically fragile.
- **FA default:** سفته‌بازان بازار آتی با طلا چه می‌کنند؛ سوخت‌سنجِ بازار. پوزیشن‌های خریدِ خیلی شلوغ از نظر تاریخی شکننده‌اند.
- **EN What/Why:** The net speculative position (longs minus shorts) as a share of all open contracts. Positioning is fuel, not a driver: at extremes it marks crowded trades that can unwind fast (the squeeze-then-slump zone); mid-range it carries little information. The meter deliberately reads it contrarian with a short horizon (days to weeks).
- **FA What/Why:** پوزیشن خالص سفته‌بازی (خرید منهای فروش) به‌عنوان سهمی از همهٔ قراردادهای باز. پوزیشن سوخت است نه محرک: در انتهای دامنه، شرط‌بندی‌های شلوغ را علامت می‌زند که می‌توانند سریع بازگشایش شوند (ناحیهٔ فشردگی و سپس سقوط)؛ در میانهٔ دامنه اطلاعات کمی دارد. متر آن را عامدانه برخلافِ هوشمندیِ جمعی و با افق کوتاه (چند روز تا چند هفته) می‌خواند.
- **EN Rises:** A net-long share high in its decade is the headwind side — crowded longs are fragile, prone to sharp squeezes.
- **EN Falls:** A very low or net-short share is the tailwind side — capitulated positioning leaves room to rebuild.
- **FA Rises:** سهمِ خریدِ خالصِ بالای دامنهٔ ده‌ساله سمتِ فشار است؛ خریدهای شلوغ شکننده‌اند و به فشردگی‌های تند مستعدند.
- **FA Falls:** سهمِ بسیار پایین یا فروشِ خالص، سمتِ حامی است؛ پوزیشنِ تسلیم‌شده جای بازسازی می‌گذارد.
- **Analogy:** EN: like a boat where everyone has run to one side: nothing is wrong until a small wave comes — then the tilt amplifies it. · FA: مانند قایقی که همه به یک سمتش رفته‌اند: تا موج کوچکی نیامده هیچ مشکلی نیست؛ بعدش کج‌شدن، موج را تقویت می‌کند.
- **EN Visual:** Today rendered on the Gold Positions signed bar (−100…+100) and the context card's band chip; the seat chip carries the lean word. One canonical detailed presentation is Session 2's dedup decision (DUP-1).
- **FA Visual:** امروز روی نوار علامت‌دارِ پوزیشن‌ها (۱۰۰− تا ۱۰۰+) و تراشهٔ دامنهٔ کارت زمینه‌ای نمایش داده می‌شود؛ کارت کرسی واژهٔ گرایش را حمل می‌کند. یک نمایش تفصیلیِ اصلی، تصمیم کسر تکرار نشست ۲ است (DUP-1).
- **Relations:** R-11 (positioning ↔ gold), R-26 (the flows family).
- **Notes:** Weekly COT with publication lag; honest stale states render. Four presentations exist today (DUP-1) — this record is the one explanation, whatever surfaces survive.

#### 3.37 `cftc-gold-gross-long` — Gross long positioning
**Label FA:** پوزیشن خریدِ معامله‌گران طلا · **Tech:** COT noncommercial LONG contracts ÷ open interest (same deafut.txt gold row) · «پوزیشن خریدِ معامله‌گران طلا»
**Measure:** percent of open interest · level · weekly (with days lag) · ref: rolling 10-year window · **level-only** · **polarity −1** · source: CFTC
- **EN default:** How much of the gold futures market is outright long — the crowd gauge without the shorts netted out.
- **FA default:** چه سهمی از بازار آتی طلا خریدِ صرف است؛ سنجهٔ ازدحام بدون کسرِ پوزیشن‌های فروش.
- **EN What/Why:** The net number (3.36) hides composition: heavy gross longs AND heavy gross shorts can net to zero while the market is extremely crowded. The gross-long share exposes one side of that crowd. High gross-long readings mark one-sided enthusiasm — the fragile configuration the flows lane reads.
- **FA What/Why:** عدد خالص (۳٫۳۶) ترکیب را پنهان می‌کند: خریدِ صرفِ سنگین و فروشِ صرفِ سنگین می‌توانند خالصِ صفر بدهند در حالی که بازار به‌شدت شلوغ است. سهمِ خریدِ صرف یک سوی این ازدحام را نشان می‌دهد. قرائت‌های بالای خریدِ صرف، شوقِ یک‌سویه را علامت می‌زند؛ همان آرایش شکننده‌ای که خانوادهٔ جریان‌ها می‌خواند.
- **EN Rises:** A gross-long share high in its decade is the headwind side (one-sided crowd).
- **EN Falls:** A low gross-long share is the tailwind side (room to rebuild).
- **FA Rises:** سهمِ خریدِ صرفِ بالای دامنه سمتِ فشار است (ازدحام یک‌سویه).
- **FA Falls:** سهمِ پایین خریدِ صرف سمتِ حامی است (جای بازسازی هست).
- **Analogy:** — (omitted: 3.36's boat carries the family).
- **EN Visual:** The Gold Positions 0–100 track (value, marker, fill, 30-day change); the seat chip carries the lean word.
- **FA Visual:** مسیر ۰ تا ۱۰۰ پوزیشن‌ها (مقدار، نشانگر، پرشدگی، تغییر ۳۰روزه)؛ کارت کرسی واژهٔ گرایش را حمل می‌کند.
- **Relations:** R-11, R-26.
- **Notes:** F2's real object (the production parse of the same COT row, not a harness proxy). Rides F1's backfill.

---

## 4. The 11 non-voter present readings (context homes)

Context records never vote (G-5); their state vocabulary is value + decade position + freshness. The gold-impact states (supports/pressures) do not apply — these cards frame comparisons rather than lean.

#### 4.1 `gold-usd` — The gold price
**Label FA:** قیمت طلا (هر اونس) · **Tech:** XAU/USD spot, US dollars per troy ounce (gold-api ingest; live Yahoo GC=F COMEX futures overlay, sourceName at point of use) · «قیمت طلا، هر اونس»
**Measure:** USD per troy ounce (0 dp) · level · live hourly refresh (:13 rung) + daily ingest · ref: the 10-year position band on the hero; 30/90-day windows on the narrative · **n/a (never a voter — the price itself; the "never counted in balance" footing discipline)** · source: gold-api + Yahoo (GC=F)
- **EN default:** The world price of one troy ounce of gold in US dollars — the question this whole page answers.
- **FA default:** قیمت جهانی یک اونس طلا به دلار آمریکا؛ پرسشی که تمام این صفحه به آن پاسخ می‌دهد.
- **EN What/Why:** The global benchmark price. It is the page's primary number: the hero shows it with its day and week changes; every driver lane explains what pushes or presses on it. It is deliberately not a voter — the balance measures conditions around the price, never the price against itself.
- **FA What/Why:** قیمت مرجع جهانی. عددِ اصلی صفحه است: قهرمان صفحه آن را همراه تغییرات روز و هفته نشان می‌دهد و هر خانوادهٔ عامل توضیح می‌دهد چه چیزی آن را بالا یا پایین می‌برد. عمداً رأی‌دهنده نیست؛ ترازو شرایطِ پیرامون قیمت را می‌سنجد، نه خود قیمت را در برابر خودش.
- **EN Rises:** A higher price is the market's current verdict — observed movement, kept strictly separate from the conditions balance and any outlook.
- **EN Falls:** A lower price is likewise an observation, not a signal by itself.
- **FA Rises:** قیمت بالاتر حکم فعلی بازار است؛ حرکتِ مشاهده‌شده، که عمداً از ترازوی شرایط و از هر چشم‌اندازی جدا نگه داشته می‌شود.
- **FA Falls:** قیمت پایین‌تر هم همین‌طور یک مشاهده است، نه سیگنالی خودبسته.
- **Analogy:** — (omitted: it is the object itself, not a proxy needing explanation).
- **EN Visual:** The hero price block: the big number, the day/7-day changes with named windows, the 10-year position band line. The same value reappears inside derived ratios — the hero is the one prominent price (DUP-4's rule).
- **FA Visual:** بلوک قیمت قهرمان: عدد بزرگ، تغییرات روز و هفت روز با پنجره‌های نام‌گذاری‌شده، خط نوار جایگاه ده‌ساله. همین مقدار درون نسبت‌های مشتق دوباره ظاهر می‌شود؛ قهرمان، تنها قیمت برجسته است (قاعدهٔ DUP-4).
- **Relations:** R-01, R-02 (the two classic inverse patterns), R-16 (numeraire effects).
- **Notes:** The live leg is the Yahoo minute-board (GC=F COMEX futures) named at point of use; gold-api remains the ingest source for its own legs. The COMEX market-state pill names the same reference market.

#### 4.2 `gold-btc` — Bitcoin priced in gold
**Label FA:** بیت‌کوین به اونس طلا · **Tech:** BTC per ounce, XAU ÷ BTC derived · «بیت‌کوین به ازای هر اونس طلا»
**Measure:** BTC per ounce (4 dp) · ratio · daily (grace) · ref: rolling 10-year window · **n/a (context)** · source: derived
- **EN default:** How many bitcoin one ounce of gold buys — the two "hard money" stores measured against each other.
- **FA default:** هر اونس طلا چند بیت‌کوین می‌خرد؛ دو خزانهٔ «پول سخت» در برابر هم.
- **EN What/Why:** A relative-value comparison between the oldest and the newest non-sovereign store of value. The "digital gold" narrative makes their relative pricing a running referendum on which store the market prefers; their correlation is episodic, not stable.
- **FA What/Why:** مقایسهٔ ارزش نسبی میان قدیمی‌ترین و جدیدترین خزانهٔ غیرحاکمی. روایت «طلای دیجیتال» باعث می‌شود قیمت نسبی‌شان همه‌پرسیِ پیوسته‌ای باشد دربارهٔ اینکه بازار کدام خزانه را ترجیح می‌دهد؛ همبستگی‌شان مقطعی است نه پایدار.
- **EN Rises:** Bitcoin outperforming gold — the market pricing the newcomer's case more aggressively.
- **EN Falls:** Gold outperforming — the store-of-value bid rotating toward the incumbent.
- **FA Rises:** بیت‌کوین از طلا پیشی می‌گیرد؛ بازار دفاعهٔ تازه‌وارد را جسورانه‌تر قیمت می‌گذارد.
- **FA Falls:** طلا پیشی می‌گیرد؛ تقاضای خزانه‌دار به سمت کهنه‌کار برمی‌گردد.
- **Analogy:** — (omitted: the comparison is its own explanation).
- **EN Visual:** The ratios context card: value + decade position band + freshness. A context comparison — no green/red state.
- **FA Visual:** کارت نسبت‌ها: مقدار + نوار جایگاه ده‌ساله + تازگی. یک مقایسهٔ زمینه‌ای بدون وضعیت سبز/قرمز.
- **Relations:** R-19 (BTC ↔ gold).
- **Notes:** —

#### 4.3 `gold-aud` — Gold in Australian dollars
**Label FA:** طلا به دلار استرالیا · **Tech:** XAU × AUD/USD (Frankfurter), derived · «قیمت طلا به دلار استرالیا»
**Measure:** AUD per ounce (0 dp) · level · daily · ref: rolling 10-year window · **n/a (context)** · source: derived
- **EN default:** The ounce price through the Australian dollar's lens — gold in a commodity-currency mirror.
- **FA default:** قیمت اونس از دریچهٔ دلار استرالیا؛ طلا در آینهٔ یک ارز کالایی.
- **EN What/Why:** For an Australian saver this is the actual local gold price; for everyone else it shows how much of a "gold move" is really a currency move. The on-ramp's rule: check the price in another currency before calling a gold move global.
- **FA What/Why:** برای پس‌اندازکنندهٔ استرالیایی این قیمت واقعی محلی طلاست؛ برای بقیه نشان می‌دهد چه بخشی از «حرکت طلا» در واقع حرکت ارز است. قاعدهٔ پلهٔ آموزش: پیش از جهانی خواندن یک حرکت طلا، قیمت را در ارزی دیگر ببینید.
- **EN Rises:** Either gold rose in USD or the AUD fell — the card reads as the local price, the decomposition is the reader's to check.
- **EN Falls:** The mirror.
- **FA Rises:** یا طلا به دلار بالا رفته یا دلار استرالیا پایین آمده؛ کارت قیمت محلی را نشان می‌دهد و تفکیکش با خواننده است.
- **FA Falls:** برعکسِ همین.
- **Analogy:** — (omitted).
- **EN Visual:** The ratios context card; also mirrors on the Australia page (cross-page mirror, by design).
- **FA Visual:** کارت نسبت‌ها؛ همان قرائت در صفحهٔ استرالیا هم آینه می‌شود (آینهٔ بین‌صفحه‌ای، عمدی).
- **Relations:** R-16 (numeraire effects), R-02.
- **Notes:** —

#### 4.4 `gold-oil-ratio` — Gold measured in oil
**Label FA:** طلا به نفت · **Tech:** Gold ÷ Brent, barrels per ounce · «طلا بر حسب نفت»
**Measure:** barrels of Brent per ounce (1 dp) · ratio · daily · ref: rolling 10-year window · **n/a (context)** · source: derived
- **EN default:** How many barrels of oil one ounce of gold buys — the commodity-family exchange rate.
- **FA default:** هر اونس طلا چند بشکه نفت می‌خرد؛ نرخ تبدیل خانوادهٔ کالاها.
- **EN What/Why:** Both commodities are inflation-sensitive and globally priced, so their ratio strips the common inflation tide and leaves the relative story: energy shocks, mining supply, or demand shifts. Historically the ratio wanders but revisits familiar territory — a mean-reverting context, not a trading rule.
- **FA What/Why:** هر دو کالا به تورم حساس‌اند و جهانی قیمت می‌خورند؛ نسبتشان جزر و مدِ مشترک تورمی را کنار می‌گذارد و روایت نسبی را نگه می‌دارد: شوک انرژی، عرضهٔ معدنی یا تغییر تقاضا. از نظر تاریخی این نسبت سرگردان است اما به محدوده‌های آشنا بازمی‌گردد؛ بافتی بازگشت‌به‌میانگین است، نه قاعدهٔ معاملاتی.
- **EN Rises:** Gold outpacing oil — either fear bid, mining supply, or an energy glut.
- **EN Falls:** Oil outpacing gold — energy-led inflation phases.
- **FA Rises:** طلا از نفت جلو می‌زند؛ یا تقاضای هراسی، یا عرضهٔ معدنی، یا فراوانی انرژی.
- **FA Falls:** نفت از طلا جلو می‌زند؛ فازهای تورمِ پیشران انرژی.
- **Analogy:** — (omitted).
- **EN Visual:** The ratios context card; the decade band is the familiar-territory reference.
- **FA Visual:** کارت نسبت‌ها؛ نوار ده‌ساله مرجعِ محدوده‌های آشناست.
- **Relations:** R-20 (commodity family).
- **Notes:** Brent is the oil leg (fred source, 12-day stale window).

#### 4.5 `gold-platinum` — Gold to platinum ratio
**Label FA:** نسبت طلا به پلاتین · **Tech:** Gold ÷ platinum, same-date closes (gold-api legs) · «نسبت طلا به پلاتین»
**Measure:** ratio (2 dp) · ratio · daily · ref: rolling 10-year window · **n/a (context)** · source: derived
- **EN default:** How many ounces of platinum one ounce of gold buys — the monetary metal against the industrial one.
- **FA default:** هر اونس طلا چند اونس پلاتین می‌خرد؛ فلز پولی در برابر فلز صنعتی.
- **EN What/Why:** Platinum is precious but industrial (catalysts, vehicles), so this ratio reads like the gold-silver ratio with an industrial-cycle accent: high ratios mark fear-and-industrial-weakness phases; low ratios mark growth and platinum-demand phases.
- **FA What/Why:** پلاتین گران‌بها اما صنعتی است (کاتالیزور، خودرو)؛ این نسبت مانند نسبت طلا به نقره است با لهجهٔ چرخهٔ صنعتی: نسبت‌های بالا فازهای ترس و ضعف صنعتی را علامت می‌زنند و نسبت‌های پایین فازهای رشد و تقاضای پلاتین را.
- **EN Rises:** Gold commanding more platinum — fear-led or platinum-weak phases.
- **EN Falls:** Platinum catching up — industrial demand optimism.
- **FA Rises:** طلا پلاتین بیشتری می‌خرد؛ فازهای هراسی یا ضعف پلاتین.
- **FA Falls:** پلاتین جبران می‌کند؛ خوش‌بینی به تقاضای صنعتی.
- **Analogy:** — (omitted: 3.18's bunker/truck analogy covers the monetary-vs-industrial family).
- **EN Visual:** The ratios context card with the decade band.
- **FA Visual:** کارت نسبت‌ها با نوار ده‌ساله.
- **Relations:** R-06, R-20.
- **Notes:** —

#### 4.6 `real-gold-price` — The real gold price
**Label FA:** قیمت واقعی طلا (خالص از تورم) · **Tech:** Gold month-close ÷ CPIAUCNS × 100 (1982–84 dollars), derived · «قیمت واقعی طلا (تصحیح تورمی)»
**Measure:** USD (0 dp, 1982–84 basis) · level · monthly · ref: rolling 10-year window (and the full CPI history in the technical tier) · **n/a (context)** · source: derived (CPI deflator)
- **EN default:** The gold price with US inflation taken out — what an ounce has actually preserved over the decades.
- **FA default:** قیمت طلا پس از حذف تورم آمریکا؛ اونس طلا در این دهه‌ها واقعاً چه چیزی حفظ کرده است.
- **EN What/Why:** Dividing the dollar price by the consumer-price index restates gold in constant purchasing power. This is the long-run proof and the caution in one number: gold's 1980 and 2011 peaks looked similar in nominal dollars but different in real terms, and whole decades passed where gold lost to inflation. It is the honest base rate under the hedge narrative.
- **FA What/Why:** تقسیم قیمت دلاری بر شاخص قیمت مصرف‌کننده، طلا را به قدرت خرید ثابت بازمی‌گوید. این عدد هم مدرک بلندمدت است و هم هشدار: قله‌های ۱۹۸۰ و ۲۰۱۱ طلا در دلار اسمی شبیه اما در اصطلاح واقعی متفاوت بودند و دهه‌هایی هم گذشته که طلا در برابر تورم باخته است. نرخ پایهٔ صادقانهٔ زیرِ روایت پوششی همین است.
- **EN Rises:** A rising real price = genuine purchasing-power gain beyond inflation.
- **EN Falls:** A falling real price = gold losing ground to inflation — the honest possibility the hedge story must admit.
- **FA Rises:** قیمت واقعیِ رونده یعنی سود قدرت خرید فراتر از تورم.
- **FA Falls:** قیمت واقعیِ نزولی یعنی طلا در برابر تورم عقب می‌رود؛ همین احتمالِ صادقانه را روایت پوشش باید بپذیرد.
- **Analogy:** — (omitted: the number IS the analogy-free truth of the hedge claim).
- **EN Visual:** The ratios context card; monthly cadence; the 1980 real peak remains the history's high-water reference.
- **FA Visual:** کارت نسبت‌ها؛ ماهانه؛ قلهٔ واقعیِ ۱۹۸۰ هنوز مرجع اوج تاریخ است.
- **Relations:** R-08, R-10.
- **Notes:** —

#### 4.7 `copper-gold` — Copper versus gold
**Label FA:** مس در برابر طلا · **Tech:** World Bank copper ÷ gold, derived · «نسبت قیمت مس به طلا»
**Measure:** ratio (2 dp) · ratio · monthly · ref: rolling 10-year window · **n/a (context)** · source: derived (World Bank)
- **EN default:** The growth metal against the hedge metal — one number for whether the world is pricing growth or protection.
- **FA default:** فلز رشد در برابر فلز پوشش؛ یک عدد برای اینکه جهان رشد را قیمت می‌گذارد یا حفاظت را.
- **EN What/Why:** Copper demand tracks construction and manufacturing (China above all); gold tracks fear and debasement. The ratio compresses the growth/defensive mix into one line — it is the same story the growth-health lane tells on /usa from its own seats, and a linkages card on other pages; on /gold it is context.
- **FA What/Why:** تقاضای مس ساخت‌وساز و تولید را دنبال می‌کند (بیش از همه چین)؛ طلا ترس و فرسایش را. نسبت، آمیزهٔ رشد/دفاعی را در یک خط فشرده می‌کند؛ همان روایتی که خانوادهٔ سلامت رشد در صفحهٔ آمریکا از کرسی‌های خودش می‌گوید و در صفحات دیگر یک کارت پیوند است؛ در صفحهٔ طلا بافت است.
- **EN Rises:** Copper outpacing gold — growth optimism (the anti-hedge configuration).
- **EN Falls:** Gold outpacing copper — protection winning the mix.
- **FA Rises:** مس از طلا جلو می‌زند؛ خوش‌بینی به رشد (آرایش ضدپوششی).
- **FA Falls:** طلا از مس جلو می‌زند؛ حفاظت در این آمیزه برنده است.
- **Analogy:** — (omitted: the growth-vs-protection framing is already the plain story).
- **EN Visual:** The ratios context card (also a USA mirror — cross-page, by design).
- **FA Visual:** کارت نسبت‌ها (در صفحهٔ آمریکا هم آینه می‌شود؛ عمدی).
- **Relations:** R-21 (copper-gold ↔ growth), R-05.
- **Notes:** The growth-health lane stays OUT of the gold voter set by the engine's own curation (gold-score.ts's membership note: copper-gold is already a ratio ABOUT gold) — this record explains the card, not a vote.

#### 4.8 `gold-equities-ratio` — Gold versus stocks
**Label FA:** طلا در برابر سهام آمریکا · **Tech:** GLD ÷ SPY closes, derived · «نسبت طلا به سهام (GLD/SPY)»
**Measure:** ratio (4 dp) · ratio · daily · ref: rolling 10-year window · **n/a (context)** · source: derived (Yahoo)
- **EN default:** Gold's ETF against the S&P 500's — the risk-appetite see-saw in one line.
- **FA default:** صندوق طلای طلا در برابر صندوق S&P 500؛ الگوی اهرمی اشتها به ریسک در یک خط.
- **EN What/Why:** The classic allocation trade: money rotating between the zero-earnings hedge and the earnings engine. The ratio's long waves mark regime changes (the 2000s gold bull, the 2010s equity bull, the 2020s re-diversification). Correlation is typically low and switches sign across regimes — a context, not a rule.
- **FA What/Why:** معاملهٔ تخصیص کلاسیک: چرخش پول میان پوششِ بدون‌سود و موتورِ سودآور. امواج بلند نسبت، تغییر رژیم را علامت می‌زنند (گاوی طلا در دههٔ ۲۰۰۰، گاوی سهام در دههٔ ۲۰۱۰، بازتنوع‌بخشی دههٔ ۲۰۲۰). همبستگی معمولاً پایین است و علامتش در رژیم‌ها عوض می‌شود؛ بافت است نه قاعده.
- **EN Rises:** Gold outperforming stocks — defensive rotation.
- **EN Falls:** Stocks outperforming — risk-on rotation.
- **FA Rises:** طلا از سهام جلو می‌زند؛ چرخش دفاعی.
- **FA Falls:** سهام جلو می‌زند؛ چرخش به ریسک.
- **Analogy:** — (omitted: see-saw framing is in the default copy).
- **EN Visual:** The ratios context card; the decade band marks where the current rotation sits.
- **FA Visual:** کارت نسبت‌ها؛ نوار ده‌ساله نشان می‌دهد چرخش فعلی کجای دامنه است.
- **Relations:** R-23 (equities ↔ gold), R-05.
- **Notes:** Proxy construction (GLD/SPY) disclosed on the card.

#### 4.9 `sge-gold-withdrawals` — Shanghai gold withdrawals
**Label FA:** برداشت طلا از صرافی شانگهای · **Tech:** Shanghai Gold Exchange monthly withdrawals, tonnes (SGE Data Highlights) · «برداشت طلای صرافی شانگهای (ماهانه)»
**Measure:** tonnes (0 dp) · flow (monthly volume) · monthly · ref: rolling 10-year window · **n/a (context)** · source: SGE
- **EN default:** How much gold left Shanghai Gold Exchange vaults last month — the busiest physical-gold market's demand proxy.
- **FA default:** ماه گذشته چه حجمی طلا از خزانه‌های صرافی طلای شانگهای خارج شد؛ سنجهٔ تقاضا در پرترددترین بازار فیزیکی طلا.
- **EN What/Why:** In China's two-tier market, metal withdrawn from SGE vaults is roughly what entered use — jewelry, bars, industrial. It is a lagged, imperfect proxy (withdrawal ≠ final consumption; months are noisy), but it is the cleanest public window on the world's largest physical demand.
- **FA What/Why:** در بازار دولایهٔ چین، فلزی که از خزانهٔ SGE خارج می‌شود تقریباً همان است که به مصرف رسیده؛ جواهر، شمش، صنعت. سنجه‌ای تأخیردار و ناقص است (برداشت مساوی مصرف نهایی نیست و ماه‌ها پرنوفه‌اند) اما تمیزترین پنجرهٔ عمومی بر بزرگ‌ترین تقاضای فیزیکی جهان است.
- **EN Rises:** Heavy withdrawals mark firm Chinese physical demand.
- **EN Falls:** Light months mark soft demand (price or income effects).
- **FA Rises:** برداشت‌های سنگین نشانهٔ تقاضای فیزیکی محکم چین است.
- **FA Falls:** ماه‌های سبک نشانهٔ تقاضای ضعیف (اثر قیمت یا درآمد).
- **Analogy:** — (omitted: the withdrawal-as-consumption caveat is the point, and it is stated).
- **EN Visual:** The physical-demand context card; monthly tonnes with the decade band. A flow measure — compare months, not with stock numbers.
- **FA Visual:** کارت تقاضای فیزیکی؛ تنِ ماهانه با نوار ده‌ساله. سنجهٔ جریان است؛ ماه‌ها را با هم مقایسه کنید نه با اعداد موجودی.
- **Relations:** R-09, R-27 (physical demand family).
- **Notes:** Distinct from the Shanghai premium (4.11) — volume vs price gap.

#### 4.10 `swiss-gold-flow` — Swiss gold imports
**Label FA:** واردات طلا به سوئیس · **Tech:** Swiss Federal Customs (BAZG) open data, gold imports, tonnes (HS 7108) · «واردات طلا به سوئیس (ماهانه)»
**Measure:** tonnes (0 dp) · flow (monthly volume) · monthly · ref: rolling 10-year window · **n/a (context)** · source: BAZG
- **EN default:** How much gold crossed into Switzerland last month — the world's refining hub's intake gauge.
- **FA default:** ماه گذشته چه حجمی طلا وارد سوئیس شد؛ سنجهٔ ورودیِ قطب پالایش جهان.
- **EN What/Why:** Most of the world's mine and scrap supply passes through Swiss refineries to be re-cast for Asian and Western buyers. Import volumes trace where physical metal is heading (or pausing): big UK-bound exports after ETF booms, big East-bound flows when premiums beckon.
- **FA What/Why:** بیشتر عرضهٔ معدنی و قراضهٔ جهان از پالایشگاه‌های سوئیسی می‌گذرد تا برای خریداران آسیایی و غربی بازریخته شود. حجم واردات نشان می‌دهد فلز فیزیکی به کجا می‌رود (یا کجا مکث می‌کند): صادرات بزرگ به انگلیس پس از رونق ETF، جریان بزرگ به شرق وقتی صرف‌ها می‌کشند.
- **EN Rises:** Heavy imports mean the hub is busy — metal moving toward some buyer.
- **EN Falls:** Quiet months mean physical trade is paused, not that demand everywhere stopped.
- **FA Rises:** واردات سنگین یعنی قطب فعال است؛ فلز به سمت خریداری حرکت می‌کند.
- **FA Falls:** ماه‌های آرام یعنی تجارت فیزیکی مکث کرده، نه اینکه تقاضا همه‌جا متوقف شده است.
- **Analogy:** — (omitted).
- **EN Visual:** The physical-demand context card; monthly tonnes; a flow — read direction and size, not levels alone.
- **FA Visual:** کارت تقاضای فیزیکی؛ تنِ ماهانه؛ جریان است؛ جهت و اندازه را بخوانید، نه فقط سطح را.
- **Relations:** R-27, R-09.
- **Notes:** —

#### 4.11 `shanghai-gold-premium` — The Shanghai premium
**Label FA:** صرف طلای شانگهای · **Tech:** SGE Au99.99 (CNY/g) vs the implied international price (XAU × USDCNY ÷ 31.1034768), percent · «صرف طلای شانگهای»
**Measure:** percent (2 dp) · level · daily · ref: rolling 10-year window · **n/a (context; never a voter §16 — the SGE archive reaches only ~2024, the seat unmeasurable over the corpus)** · source: derived
- **EN default:** How much more gold costs in Shanghai than the world price — China's demand pressure gauge.
- **FA default:** طلا در شانگهای چقدر گران‌تر از قیمت جهانی است؛ فشارسنج تقاضای چین.
- **EN What/Why:** China's capital controls let the local price drift from the world price; the gap is the premium. A positive premium pulls bullion east (via the Swiss hub, 4.10); a discount means China is a seller. It is the cleanest daily physical-demand signal that exists.
- **FA What/Why:** کنترل سرمایهٔ چین اجازه می‌دهد قیمت محلی از قیمت جهانی فاصله بگیرد؛ همین فاصله صرف است. صرف مثبت شمش را به شرق می‌کشد (از راه قطب سوئیس، ۴٫۱۰)؛ تخفیف یعنی چین فروشنده است. تمیزترین سیگنال روزانهٔ تقاضای فیزیکی که وجود دارد همین است.
- **EN Rises:** A wider premium = stronger Chinese pull on world supply.
- **EN Falls:** A discount = China's demand soft enough to export metal back.
- **FA Rises:** صرف بازتر یعنی کشش قوی‌تر چین بر عرضهٔ جهانی.
- **FA Falls:** تخفیف یعنی تقاضای چین آن‌قدر نرم است که فلز را برمی‌گرداند.
- **Analogy:** — (omitted: 4.10's hub story and the premium's own plain statement suffice).
- **EN Visual:** The physical-demand context card; percent premium with the decade band. Completely distinct from the Iran bridge's coin premiums (different market, currency, source — 04's verified non-duplicate).
- **FA Visual:** کارت تقاضای فیزیکی؛ درصد صرف با نوار ده‌ساله. کاملاً متمایز از صرف سکه‌های پل ایران (بازار، ارز و منبع متفاوت؛ تأییدشده در سند ۰۴).
- **Relations:** R-27, R-09.
- **Notes:** Never a voter — the §16 record: the SGE archive reaches only ~2024; the seat question is recorded-open with the coverage fact printed. Its own card copy carries the construction formula.

---

## 5. The 4 licence-blocked absentees (blocked records)

These records exist so the honest disclosure can explain each absence. They render nowhere as data; the publication-notes tail carries their blocked notes (collapsed by default, BD-S43). The `blocked` object is part of the record; the explanation fields describe what the indicator WOULD show.

#### 5.1 `wgc-etf-holdings` — World gold ETF holdings (BLOCKED)
**Label FA:** موجودی صندوق‌های طلای جهان (مسدود) · **Tech:** World Gold Council Gold ETF holdings, monthly · blocked: **licence (WGC L3)**
- **What it would show:** Total gold held by exchange-traded funds worldwide — the investment-demand stock and its monthly flows. Gold-backed ETFs make the safe-haven channel visible daily (the on-ramp's driver-5 story).
- **Why it matters for gold:** ETF flows are the clearest public measure of Western investment demand; sustained inflows bid the price, outflows release supply. Two channels hide inside "safe haven": the headline premium (fades in days or weeks) and the structural shift (persists years) — holdings data helps tell them apart.
- **چرا برای طلا مهم است:** جریان ETF تمیزترین سنجهٔ عمومی تقاضای سرمایه‌گذاری غربی است؛ ورودیِ مداوم قیمت را بالا می‌برد و خروجی عرضه اضافه می‌کند. درون «دارایی امن» دو کانال پنهان است: صرفِ سرفصلی (در چند روز یا هفته فروکش می‌کند) و جابه‌جایی ساختاری (سال‌ها می‌ماند)؛ دادهٔ موجودی کمک می‌کند این دو از هم جدا شوند.
- **Why blocked / disclosure:** WGC licence class L3 does not permit redistribution; the honest blocked note renders in the publication-notes tail with the one sources link-out. Owner lever: the WGC authorization letter (info@gold.org, D9) or an alternative licensed source.
- **Relations it would join:** R-26 (flows family), R-05.
- **Notes:** The page's honest treatment: never faked, never silently dropped (Rule 5).

#### 5.2 `wgc-cb-demand` — Central-bank gold demand, WGC (BLOCKED)
**Label FA:** تقاضای بانک‌های مرکزی برای طلا (WGC؛ مسدود) · **Tech:** World Gold Council quarterly central-bank demand, tonnes · blocked: **licence (WGC L3)**
- **What it would show:** Quarterly official-sector purchases in tonnes — the demand wave that roughly doubled after the 2022 reserve freeze.
- **Why it matters for gold:** Central banks are among the largest holders; their post-2022 buying is comparatively price-insensitive, raised gold's floor and visibly weakened the old real-rates rule. The honest limits: slow, lumpy, reported with delay and revisions; it explains a floor rising over quarters, not support in every drawdown.
- **چرا برای طلا مهم است:** بانک‌های مرکزی از بزرگ‌ترین دارندگان‌اند؛ خریدشان پس از انجماد ذخایر ۲۰۲۲ تقریباً دو برابر شد، نسبتاً به قیمت بی‌اعتناست، کفِ طلا را بالا برد و قاعدهٔ قدیمی نرخ واقعی را به‌وضوح ضعیف کرد. محدودیت‌های صادقانه: کُند، تکه‌تکه، با تأخیر و بازنگری گزارش می‌شود؛ کفِ در حال رشد را در افق چندفصلی توضیح می‌دهد نه حمایت در هر افت کوچک.
- **Why blocked / disclosure:** WGC L3 licence. The page instead carries the IMF's own tracker (the CB-demand module — a different, permitted source covering the same story through IMF data). Owner lever: the WGC drop (data/wgc/…) or the authorization letter.
- **Relations it would join:** R-09 (CB demand ↔ gold).
- **Notes:** The IMF tracker module (§6) is the shipped, licence-clean companion.

#### 5.3 `official-gold-demand` — PBoC official gold purchases (BLOCKED)
**Label FA:** خرید رسمی طلا توسط بانک مرکزی چین (مسدود) · **Tech:** People's Bank of China monthly reported gold reserves · blocked: **source dead (PBoC URL 404)**
- **What it would show:** China's officially reported gold reserve changes — the single largest reported official buyer's monthly step.
- **Why it matters for gold:** The PBoC's reported buying has been the demand story's headline leg in several phases; a resumption or pause moves the structural-demand narrative. Caveats: reported with lumps and months of silence; reported reserves understate true flows (SAF-style purchases sit elsewhere).
- **چرا برای طلا مهم است:** خریدهای گزارش‌شدهٔ بانک مرکزی چین در چند فاز، تیترِ روایت تقاضا بوده است؛ از سرگیری یا توقفش روایت تقاضای ساختاری را جابه‌جا می‌کند. محدودیت‌ها: تکه‌ای و با ماه‌ها سکوت گزارش می‌شود و ذخایر گزارش‌شده جریان واقعی را کمتر از واقعیت نشان می‌دهند.
- **Why blocked / disclosure:** The PBoC page went 404 (the source died); the honest note renders with the revival lever named (the owner's browser can re-verify the URL; the moment it revives, the adapter path ships ready).
- **Relations it would join:** R-09.
- **Notes:** —

#### 5.4 `etf-short-interest` — Gold ETF short interest (BLOCKED)
**Label FA:** پوزیشن فروش صندوق‌های طلا (مسدود) · **Tech:** Short interest in gold ETFs (fund pages), monthly · blocked: **no licence-clean venue**
- **What it would show:** How heavily traders are short gold ETFs — the bearish side of the positioning crowd the CFTC seats (3.36/3.37) do not capture.
- **Why it matters for gold:** Short interest adds the downside crowd to the upside crowd: very heavy shorts are the mirror of fragile positioning — squeeze fuel. It would complete the flows lane's crowd picture.
- **چرا برای طلا مهم است:** فروشِ صرف، سمتِ نزولی ازدحام را به سمت صعودیِ کرسی‌های CFTC اضافه می‌کند؛ فروش‌های بسیار سنگین آینهٔ پوزیشن شکننده و سوختِ فشردگی‌اند. تصویر ازدحام در خانوادهٔ جریان‌ها را کامل می‌کرد.
- **Why blocked / disclosure:** No venue serves it under terms this repo can republish; the honest note names the search and the blocker. Revisit when a licence-clean source exists.
- **Relations it would join:** R-11, R-26.
- **Notes:** —

---

## 6. The 16 module records (non-indicator surfaces)

Reduced schema per 08 §7: what it shows (en/fa) · honest state (en/fa) · reads from · indicator records it visualizes · copy home. Module copy largely exists in the shipped dictionaries; these records pin the explanation content so Sessions 4–5 can map and reuse rather than re-author.

| # | Module | What it shows (EN) · «FA» | Honest states (EN · FA) | Reads from | Records it visualizes | Copy home |
|---|---|---|---|---|---|---|
| 1 | `GoldNarrative` (Why gold moved) | One price-fact sentence (1d/30d/90d) + the five driver-family lines with tally and movers + the standing coincidence caveat. · «یک جملهٔ واقعیت قیمت (۱/۳۰/۹۰ روزه) + پنج خط خانوادهٔ عامل‌ها با شمارش و حرکت‌آفرین‌ها + سلب مسئولیت هم‌زمانی.» | Renders only over a healthy projection; error → the page's honest error state. · «فقط روی پروجکشن سالم رندر می‌شود؛ خطا → حالت خطای صادقانهٔ صفحه.» | pure engine `goldNarrative()` over the projection | all five lanes (§3) | `pd.gold.*` dictionaries |
| 2 | `GoldYieldDecomposition` | The nominal 10y yield split into real + breakeven + the term-premium identity, the 30-day "which piece moved", the three configurations + the 2022 gilt exception. · «تفکیک بازده اسمی به واقعی + سربه‌سر + صرف سررسید با اتحاد حسابی، قطعهٔ متحرک ۳۰روزه، سه آرایش و استثنای گیلت ۲۰۲۲.» | Same-asOf rule printed; premium leg labelled a model estimate. · «قاعدهٔ هم‌تاریخگی چاپ می‌شود؛ پایهٔ صرف، برآوردِ مدل است.» | projection (us10y, real-yield-10y, term-premium-10y) | 3.1, 3.2, 3.19, 3.31-family | `pd.gold.yield*` |
| 3 | `GoldOnRamp` (education) | The five-driver education: mechanism → honest limits → live lane close, two notes (positioning-is-fuel; five-drivers-vs-five-lanes), six-question FAQ. · «آموزش پنج عامل: سازوکار → محدودیت‌های صادقانه → وضعیت زندهٔ خانواده، دو یادداشت و شش پرسش متداول.» | Collapsed by default; lane closes render live states incl. unread. · «به‌طور پیش‌فرض بسته؛ وضعیت‌های زندهٔ خانواده شامل ناخوانا رندر می‌شود.» | static copy + `goldBalance` | all five lanes | `pd.gold.driver*`, `note*` |
| 4 | `GoldExpectations` (Polymarket + calendar) | What prediction-market traders price for the NEXT Fed decision (probability rows), the event line, the mismatch note, the disclaimer, the Fed/CPI calendar strip. · «معامله‌گران بازار پیش‌بینی برای تصمیم بعدی فدرال رزرو چه قیمتی می‌گذارند (ردیف‌های احتمال)، خط رخداد، نکتهٔ ناهمخوانی، سلب مسئولیت و نوار تقویم فدرال رزرو/CPI.» | Venue + as-of named; "traders' prices, not ours"; probabilities are event-probabilities, never gold-move probabilities. · «نام محل و تاریخ چاپ می‌شود؛ «قیمت معامله‌گران، نه ما»؛ احتمال‌ها احتمالِ رخدادند، نه احتمال حرکت طلا.» | KV `insights:gold-expectations:v1` + snapshot calendar | (a market-expectations surface; links to 3.4/3.5) | `pd.gold.expect*` |
| 5 | `GoldIranBridge` (Bridge-1) | The Tehran coin board (coins + karat prices + per-row premium حباب), the parity decomposition (ounce × USD → toman), the method block (formula, constants, gerami band), the interpretation. · «تابلوی سکهٔ تهران (سکه‌ها و قیمت‌های عیار + صرف هر ردیف حباب)، تجزیهٔ برابری (اونس × دلار → تومان)، بلوک روش و تفسیر.» | Fail-closed unavailable frame without a snapshot; per-row as-of; the premium is a market-structure reading, not a forecast. · «بدون اسنپ‌شات، قابِ غیرقابل‌دسترس صادقانه؛ تاریخ هر ردیف؛ صرف، قرائت ساختار بازار است نه پیش‌بینی.» | App-boot TGJU snapshot + client `coinPremium` | (regional; separate from the global model by contract) | `pd.gold.bridge*` |
| 6 | `GoldPremiumHistory` (Bridge-2) | The حباب premium history chart (Emami/Bahar, backfill/live boundary), the deciles + band stats, the day-move attribution strip (Δln identity, printed verbatim). · «نمودار تاریخچهٔ صرف حباب (امامی/بهار، مرز بازسازی/زنده)، صدک‌ها و آمار دامنه، نوار تفکیک حرکت روز (اتحاد لگاریتمی، عیناً چاپ‌شده).» | «تفکیک حسابی است، نه برآورد آماری» printed; honest sub-30 waiting line for deciles. · «تفکیک حسابی است، نه برآورد آماری» چاپ می‌شود؛ خط انتظار صادقانه زیر ۳۰ نمونه. | KV `insights:gold-premium-history:v1` | (regional) | `pd.gold.premium*` |
| 7 | `Signals` (merged gold+silver card) | The verdict strip (gold chip + chart), the second BalanceScale, the lane ledger, the C12 banner, the price-footing strip. · «نوار حکم (تراشهٔ طلا + نمودار)، ترازوی دوم، دفتر خانواده‌ها، بنر C12، نوار پایهٔ قیمت.» | Footing "never counted in balance"; silver keeps its own legacy verdict sentence (OI-4). DUP-2's core — its future shape is Session 2's call. · «پایهٔ قیمت «هرگز در ترازو شمرده نمی‌شود»؛ نقره حکم مستقل خودش را دارد. هستهٔ DUP-2؛ آینده‌اش با نشست ۲ است.» | `/api/insights` (second fetch) + silver history | the balance (all lanes), 4.1, silver | `signals.*`, `pd.gold.*` |
| 8 | `GoldTimeMachine` | A picked date's meter reading: verdict + lane counts + provenance (backfill vs live) + the versioned-table line. · «قرائت متر در تاریخ انتخابی: حکم + شمارش خانواده‌ها + منشأ (بازسازی یا زنده) + خط نسخهٔ جدول رأی‌دهی.» | Era-bounded 2016-11+; future/malformed dates rejected; "no reading exists or is synthesized before the era". · «محدود به عصر ۲۰۱۶-۱۱ به بعد؛ تاریخ آینده/ناقص رد می‌شود؛ پیش از عصر «هیچ قرائتی وجود ندارد یا ساخته نمی‌شود».» | KV `insights:gold-meter-history:v1:<YYYY>` | the balance (historical) | `pd.gold.tm*` |
| 9 | `GoldTaLevels` | SMA 20/50/100/200 rows, dated 50/200 crosses, classic daily + weekly pivots, the 200-DMA distance sentence. · «ردیف‌های میانگین متحرک ۲۰/۵۰/۱۰۰/۲۰۰، تقاطع‌های مؤرخ ۵۰/۲۰۰، پیوت‌های روزانه و هفتگی، جملهٔ فاصله از میانگین ۲۰۰روزه.» | "Reference levels, not predictions"; window named at point of use. · «سطوح مرجع‌اند نه پیش‌بینی؛ پنجره در محل استفاده نام‌گذاری می‌شود.» | shared OHLC (KV `insights:gold-xau:v1`) | 4.1 (the price) | `pd.gold.ta*` |
| 10 | `GoldCbDemand` (IMF tracker) | The rolling-12m central-bank demand chart + three dated episode annotations + the buyers table (country, latest, 12m, holdings, share-of-reserves). · «نمودار تقاضای غلتان ۱۲ماههٔ بانک‌های مرکزی + سه حاشیه‌نویسی مؤرخ + جدول خریداران (کشور، آخرین، ۱۲ماهه، موجودی، سهم از ذخایر).» | The caveat (delay/revisions); the method block in details; share computed from the page's own gold-usd. · «سلب مسئولیت (تأخیر/بازنگری)؛ بلوک روش در جزئیات؛ سهم از قیمت خودِ صفحه محاسبه می‌شود.» | KV `insights:gold-cb:v1` (IMF SDMX) | 5.2's shipped companion | `pd.gold.cb*` |
| 11 | `GoldLondonVault` | The London vault stock (gold + silver rows, 124-month sparkline) + the LPMCL clearing rider. · «موجودی خزانهٔ لندن (ردیف طلا و نقره، اسپارک‌لاین ۱۲۴ماهه) + ردیف تسویهٔ LPMCL.» | Vault T+2.5wk, clearing month−2 lags printed; koz→tonnes conversion disclosed. · «تأخیرهای خزانه و تسویه چاپ می‌شود؛ تبدیل koz به تن افشا شده است.» | KV `insights:gold-lbma:v1` | (stock vs the CB tracker's flow — distinct) | `pd.gold.lbma*` |
| 12 | `GoldCorrelation` | Gold vs the 10y real yield (dual-axis, NOT inverted) + the 52-week rolling-correlation strip + the 2022 buyer-rotation teaching line. · «طلا در برابر بازده واقعی ۱۰ساله (دومحوره، بدون معکوس) + نوار همبستگی غلتان ۵۲هفته + خط آموزشی چرخش خریداران ۲۰۲۲.» | Pre-registered windows printed; "correlation is one factor, not a forecast formula; a different sampling day moves the number". · «پنجره‌های پیش‌ثبت‌شده چاپ می‌شوند؛ «همبستگی یک عامل است نه فرمول پیش‌بینی؛ روز نمونه‌گیری دیگر، عدد دیگر».» | shared OHLC + `real-yield-10y/history` | 3.1, 4.1, R-01 | `pd.gold.corr*` |
| 13 | `GoldForecastRetrospective` | The LBMA analyst-survey vs actual record 2010–2025: headline stats (10/16 under-forecast, means, 2024/25 misses), the 17-row table, the miss convention. · «سابقهٔ نظرسنجی تحلیلگران LBMA در برابر واقعیت ۲۰۱۰–۲۰۲۵: آمارهای اصلی، جدول ۱۷ردیفی، قرارداد خطا.» | "Even the consensus misses" framing; the pending row never scored early; Currena claims no forecasting edge. · «چارچوبِ «حتی اجماع هم خطا می‌کند»؛ ردیف در انتظار هرگز زودتر نمره نمی‌گیرد؛ ما ادعای پیش‌بینی نداریم.» | static `LBMA_FORECAST_SERIES` | (the honest-record companion) | `pd.gold.fr*` |
| 14 | `GoldEpisodes` (Zone O) | Nine historical episodes (period, context, interpretation, family readings with hasData flags) + the drop-gated price path + comparison table. · «نه رخداد تاریخی (دوره، بافت، تفسیر، قرائت خانواده‌ها با پرچم داده) + مسیر قیمتِ دروازه‌دار + جدول مقایسه.» | The honest waiting state until the WGC prices workbook lands (API 503 by design); history ≠ current conditions. · «حالت انتظار صادقانه تا رسیدن فایل قیمت WGC (۵۰۳ عمدی)؛ تاریخ ≠ شرایط امروز.» | static records + KV `insights:gold-episodes:v1` (drop-gated) | the lanes (historical), 4.1 | `pd.gold.ep*` |
| 15 | `GoldIfBought` | The "if you'd bought" calculator: year picker, 4 assets (gold/S&P/BTC/silver), lump multiple + $100/month DCA + the same-length-window decile. · «ماشین‌حساب «اگر خریده بودید»: انتخاب سال، چهار دارایی، خرید یکجا + خرید ماهانهٔ ۱۰۰ دلاری + صدک پنجرهٔ هم‌طول.» | Assumptions visible; first-year note; honest waiting line < 30 windows; "historical results are not future returns". · «فرض‌ها نمایان؛ نکتهٔ سال اول؛ خط انتظار زیر ۳۰ پنجره؛ «نتایج گذشته، بازده آینده نیست».» | KV `insights:gold-ifbought:v1` | 4.1 + the assets | `pd.gold.ib*` |
| 16 | `GoldPublicationNotes` | The absent-count line + the §16 licence wall: the blocked quartet's honest notes + the ONE sources link-out. · «خط شمارش غایب‌ها + دیوار مجوز §۱۶: یادداشت‌های صادقانهٔ چهارگانۀ مسدود + تنها پیوند به منابع.» | Collapsed by default (BD-S43); the #gold-blocked anchor kept; each reason tailored (licence / dead source / no venue). · «پیش‌فرض بسته (BD-S43)؛ لنگر #gold-blocked حفظ شده؛ هر دلیل متناسب با علتش.» | projection `absentIds` + static notes | §5's four records | `pd.gold.blocked*` |

---

## 7. Explanation coverage report

Audit of the complete-field contract (08 §3.5): every unique indicator × every required dimension, both locales. Legend: ✓ = present and within budget · ✓* = present with an honest caveat/why-line noted · — = optional field deliberately omitted with reason · B = blocked record (carries the blocked object + would-show explanation). The length budget: default ≤ 2 sentences; what ≤ 2; why ≤ 3; rises/falls ≤ 2 each.

### 7.1 The 52 indicator records

| # | id | label en+fa | tech | unit/type/cadence | ref period | what en+fa | why en+fa | rises en+fa | falls en+fa | analogy | visual en+fa | relations | default en+fa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3.1 | real-yield-10y | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.2 | us10y | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | — | ✓ | ✓ | ✓ |
| 3.3 | us30y | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | — | ✓ | ✓ | ✓ |
| 3.4 | fed-target | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.5 | fed-expectations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓* | ✓ | ✓ |
| 3.6 | ecb-dfr | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.7 | real-yield-5y | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.8 | dollar-basket | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | — | ✓ | ✓ | ✓ |
| 3.9 | usdjpy | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.10 | us-japan-10y-gap | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓* | ✓ | ✓ |
| 3.11 | usd-reserve-share | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.12 | nyfed-custody | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.13 | dollar-broad | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.14 | dollar-eme | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.15 | stress-stlfsi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.16 | nfci | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.17 | vix | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.18 | gold-silver | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.19 | term-premium-10y | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | — | ✓ | ✓ | ✓ |
| 3.20 | ebp | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.21 | michigan-sentiment | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓* | ✓ | ✓ |
| 3.22 | gpr-daily | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | — | ✓ | ✓ | ✓ |
| 3.23 | epu-us | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.24 | sp500-breadth-ratio | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.25 | bank-stress | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.26 | us-cpi-yoy | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | — | ✓* | ✓ | ✓ |
| 3.27 | us-pce-core-yoy | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | — | ✓ | ✓ | ✓ |
| 3.28 | euro-hicp | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.29 | breakeven-5y5y | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.30 | breakeven-tilt | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.31 | t5yie | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.32 | michigan-1y-expectations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓* | ✓ | ✓ |
| 3.33 | m2-us | ✓ | ✓ | ✓ | ✓* | ✓ | ✓ | ✓* | ✓ | ✓ | ✓* | ✓ | ✓ |
| 3.34 | us-deficit-12m | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 3.35 | michigan-5y-expectations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓* | ✓ | ✓ |
| 3.36 | cftc-gold-positioning | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | ✓ | ✓* | ✓ | ✓ |
| 3.37 | cftc-gold-gross-long | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.1 | gold-usd | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.2 | gold-btc | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.3 | gold-aud | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.4 | gold-oil-ratio | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.5 | gold-platinum | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.6 | real-gold-price | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.7 | copper-gold | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.8 | gold-equities-ratio | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.9 | sge-gold-withdrawals | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.10 | swiss-gold-flow | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 4.11 | shanghai-gold-premium | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| 5.1 | wgc-etf-holdings | ✓ | ✓ | B | B | ✓ (would-show) | ✓ en + fa summary | — (blocked) | — (blocked) | — | — (blocked) | ✓ | — (blocked) |
| 5.2 | wgc-cb-demand | ✓ | ✓ | B | B | ✓ (would-show) | ✓ en + fa summary | — (blocked) | — (blocked) | — | — (blocked) | ✓ | — (blocked) |
| 5.3 | official-gold-demand | ✓ | ✓ | B | B | ✓ (would-show) | ✓ en + fa summary | — (blocked) | — (blocked) | — | — (blocked) | ✓ | — (blocked) |
| 5.4 | etf-short-interest | ✓ | ✓ | B | B | ✓ (would-show) | ✓ en + fa summary | — (blocked) | — (blocked) | — | — (blocked) | ✓ | — (blocked) |

**Coverage verdict: 52/52 indicator records complete.** The blocked quartet's `—` fields are the documented reason (they cannot render and must not read as data); their blocked object, would-show explanation and both-locale why-it-matters summaries are present. Analogies: 9 present (3.1, 3.9, 3.15, 3.17, 3.18, 3.24, 3.29, 3.33, 3.36) — selectively, per owner decision 19; every other record names its omission reason (mostly: a family analogy already covers the channel, or the concept needs no analogy).

### 7.2 The 16 module records

All 16 module rows in §6 carry what-it-shows (en+fa) + honest states (en+fa) + reads-from + record-links + copy-home: 16/16 complete against the reduced schema (08 §7).

### 7.3 Honest gaps and dependencies declared

1. **Q1/Q2-dependent wording** (flagged per the assignment): the outlook vocabulary drafts (08 §8) — the five states, the evidence-consistency words, the horizon labels, and the fate of the "Conditions outlook: Bearish" line — are owner-review items; no record above depends on them (records describe conditions, never forecasts). Silver's own labels ride DUP-6's owner decision (Q3 in S1-D6's numbering); this file records silver only via the flows seat 3.18 and the module row 7.
2. **fa runtime integration is Session 5's work** — the fa copy here is authored to workflow standards; the manifest round + `pnpm copy:audit` happen when the strings enter the dictionaries (08 §6.3). No runtime string changed this session.
3. **Placement wording references current surfaces** (per 02's map); Session 2's eventual placement table may rename surfaces — the indicator facts do not change with placement.
4. **The `usd-reserve-share` / `nyfed-custody` cross-page mirrors** and `gold-aud` / `copper-gold` mirrors are noted per-record; their other-route cards ride those routes' own copy (out of /gold scope by F-12).
