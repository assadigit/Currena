# داشبورد شاخص‌ها: پنل پول، سیگنال‌ها، ارتباط‌ها و جمله‌های معنا + تقویم و موارد پراکنده (جزء ۳ از ۷)

**Persian copy Round 2 · Part 3 of 7 · Insights dashboard: money, signals, connections & meaning + calendar & inline bits**

بخش‌های کوچک‌تر صفحهٔ شاخص‌ها: پنل «رو هزینه‌های من چه تأثیری داره؟»، سیگنال‌های طلا و نقره، ارتباط میان شاخص‌ها و جمله‌های معنا؛ به‌علاوهٔ عنوان رویدادهای تقویم و سه مورد پراکنده. در این جزء ۱۶۶ مورد هست.

هفت جزء: part1 رابط کاربری و واژگان شاخص‌ها · part2 بازارهای سهام و الگوهای ارزی · part3 پنل پول، سیگنال‌ها، ارتباط‌ها و تقویم · part4 کارت‌های شاخص جهانی · part5 کارت‌های شاخص استرالیا · part6 مبدل و نرخ‌های لحظه‌ای و طلا · part7 ابزارها. نام کامل فایل‌ها: persian_site_copy_round2_part1_ui_vocabulary.md تا persian_site_copy_round2_part7_tools.md و فهرست کامل یکجا در persian_site_copy_round2.md.

## نحوهٔ کار

- روبه‌روی هر «جدید:» متن جدید را بنویسید؛ اگر خالی بماند، همان متن فعلی می‌ماند.
- ساختار فایل را تغییر ندهید: کلیدها (مثل `ui.retry`) همان شناسه‌های کد هستند؛ سطرهای «فعلی:» را ویرایش نکنید و موردی را حذف نکنید.
- جای‌نگه‌دارهای داخل آکولاد مثل `{date}` و `{n}` را دقیقاً حفظ کنید؛ جای آن‌ها در جمله قابل جابه‌جایی است.
- در متن جدید از خط تیرهٔ بلند (em dash) استفاده نکنید؛ کاما، نقطه‌ویرگول یا پرانتز جایگزین خوبی است.
- هر جزء مستقل است؛ هر کدام را که پر کردید، همان را می‌توانید جداگانه پس بدهید.

## A5. پنل پول (money.*)، ۲۳ مورد

بخش «رو هزینه‌های من چه تأثیری داره؟»: جملهٔ حالت آرام، واژه‌های جهت (احتمال افزایش هزینه‌ها/دریافت سود بیشتر)، و برای هر حوزه (بنزین، وام مسکن، پس‌انداز، خرید) نام، جملهٔ غیرعادی و جملهٔ آرام.

**`money.calmLine`**
- فعلی: الان هیچ حوزهٔ پولی سر و صدا ندارد: پس‌زمینه‌ای آرام برای بودجهٔ خانه.
- جدید:

**`money.direction.cost.down`**
- فعلی: ارزان‌تر می‌شود
- جدید:

**`money.direction.cost.flat`**
- فعلی: جهت روشنی ندارد
- جدید:

**`money.direction.savings.down`**
- فعلی: سود کمتری می‌گیرید
- جدید:

**`money.direction.savings.flat`**
- فعلی: جهت روشنی ندارد
- جدید:

### `petrol` · Petrol and transport

**`money.areas.petrol.name`**
- فعلی: بنزین و حمل‌ونقل
- جدید:

**`money.areas.petrol.unusual`**
- فعلی: نفت در نقطهٔ غیرعادی بازهٔ ده‌سالهٔ خودش است: قیمت پمپ می‌تواند مدتی بیشتر از همیشه جابه‌جا شود.
- جدید:

**`money.areas.petrol.calm`**
- فعلی: هزینهٔ سوخت کارِ غیرمعمولی نمی‌کند.
- جدید:

### `homeLoan` · Home loan and rent

**`money.areas.homeLoan.name`**
- فعلی: وام مسکن و اجاره
- جدید:

**`money.areas.homeLoan.unusual`**
- فعلی: یک رقم وام یا اجاره در نقطهٔ غیرعادی بازهٔ ده‌سالهٔ خودش است: فضای بودجهٔ خانه می‌تواند جابه‌جا شود.
- جدید:

**`money.areas.homeLoan.calm`**
- فعلی: وضعیت وام و اجاره فعلاً قابل توجه نیست.
- جدید:

### `savings` · Savings and interest

**`money.areas.savings.unusual`**
- فعلی: نرخ‌های پس‌انداز در نقطهٔ غیرعادی بازه‌شان نشسته‌اند: بهرهٔ سپردهٔ مدت‌دار جدید با آن جابه‌جا می‌شود.
- جدید:

**`money.areas.savings.calm`**
- فعلی: نرخ پس‌انداز و تورم در وضعیت معمولی‌اند: بهرهٔ سپردهٔ مدت‌دار جدید تقریباً از نرخ رسمی بانک مرکزی پیروی می‌کند.
- جدید:

### `shop` · Shop prices and bills

**`money.areas.shop.unusual`**
- فعلی: یکی از سنجه‌های تورم در نقطهٔ غیرعادی بازهٔ ده‌سالهٔ خودش است: قبض‌ها می‌توانند مدتی غافلگیر کنند.
- جدید:

**`money.areas.shop.calm`**
- فعلی: قیمت فروشگاه و قبض‌ها کارِ غیرمعمولی نمی‌کنند.
- جدید:

### `overseas` · Overseas money

**`money.areas.overseas.name`**
- فعلی: پول خارجی
- جدید:

**`money.areas.overseas.attention`**
- فعلی: دلار استرالیا در نقطهٔ غیرعادی بازهٔ خودش است: خریدهای خارجی و پول سفر معمولاً زود اثرش را حس می‌کنند.
- جدید:

**`money.areas.overseas.unusual`**
- فعلی: نرخ ارز در نقطهٔ غیرعادی بازهٔ ده‌سالهٔ خودش است: پول خارجی ممکن است مدتی بیشتر، یا کمتر، خرج بردارد.
- جدید:

**`money.areas.overseas.calm`**
- فعلی: نرخ ارزها برای پول خارجی کارِ غیرمعمولی نمی‌کنند.
- جدید:

### `jobs` · Jobs and pay

**`money.areas.jobs.name`**
- فعلی: شغل و دستمزد
- جدید:

**`money.areas.jobs.attention`**
- فعلی: یک رقم شغل یا دستمزد از بازهٔ معمولش بیرون زده: استخدام و رشد دستمزد معمولاً چند فصل در همان جهت مانده‌اند.
- جدید:

**`money.areas.jobs.unusual`**
- فعلی: یک رقم شغل یا دستمزد در نقطهٔ غیرعادی بازهٔ ده‌سالهٔ خودشان است.
- جدید:

**`money.areas.jobs.calm`**
- فعلی: وضعیت شغل و دستمزد فعلاً قابل توجه نیست.
- جدید:

## A6. سیگنال‌های طلا و نقره (signals.*)، ۲۹ مورد

شرایط شش‌گانه، واژه‌های حالت هر شرط، حکم نهایی (بالا/پایین/خنثی)، نوار جایگاه و سرعت تغییر.

**`signals.mergedSubtitle`**
- فعلی: این دو فلز بیشتر محرک‌هایشان مشترک است: شرایط مشترک یک‌بار فهرست می‌شود.
- جدید:

**`signals.conditionsMet`**
- فعلی: {met} از {total} شرایط برقرار است
- جدید:

**`signals.lean.mostly-supportive`**
- فعلی: عمدتاً حامی
- جدید:

**`signals.lean.mixed`**
- فعلی: مختلط
- جدید:

**`signals.metals.gold`**
- فعلی: طلا
- جدید:

**`signals.metals.silver`**
- فعلی: نقره
- جدید:

**`signals.verdictUp`**
- فعلی: حمایت می‌کند
- جدید:

**`signals.verdictFlat`**
- فعلی: مختلط
- جدید:

**`signals.verdictNone`**
- فعلی: هنوز قابل قرائت نیست
- جدید:

**`signals.sideSupportive`**
- فعلی: حمایت می‌کند
- جدید:

**`signals.sideNeutral`**
- فعلی: خنثی است
- جدید:

**`signals.sideUnknown`**
- فعلی: الان قابل خواندن نیست
- جدید:

**`signals.conditionState.supportive`**
- فعلی: برقرار است
- جدید:

**`signals.conditionState.against`**
- فعلی: در تضاد است
- جدید:

**`signals.conditionState.neutral`**
- فعلی: خنثی
- جدید:

**`signals.conditionState.unknown`**
- فعلی: قابل خواندن نیست
- جدید:

**`signals.conditionStateShort.supportive`**
- فعلی: حمایت می‌کند
- جدید:

**`signals.conditionStateShort.neutral`**
- فعلی: خنثی
- جدید:

**`signals.conditionStateShort.unknown`**
- فعلی: قابل خواندن نیست
- جدید:

**`signals.conditions.stress.name`**
- فعلی: تنش بازار
- جدید:

**`signals.conditions.dollar.name`**
- فعلی: دلار آمریکا
- جدید:

**`signals.conditions.industrial.name`**
- فعلی: تقاضای صنعتی
- جدید:

**`signals.conditions.industrial.tag`**
- فعلی: مختلط
- جدید:

**`signals.notEnoughData`**
- فعلی: دادهٔ تازه برای خواندن این کارت کافی نیست.
- جدید:

**`signals.collapsedFooting`**
- فعلی: قیمت در {band} بازهٔ ۱۰ سال گذشته
- جدید:

**`signals.collapsedVerdict`**
- فعلی: شرایط: {verdict}
- جدید:

**`signals.bandTop`**
- فعلی: بالاترین {p}٪
- جدید:

**`signals.bandBottom`**
- فعلی: پایین‌ترین {p}٪
- جدید:

**`signals.bandMid`**
- فعلی: میانهٔ
- جدید:

## A7. ارتباط میان شاخص‌ها (together.*)، ۷۴ مورد

واژه‌های وضعیت هر ارتباط (فعال/نیمه‌فعال/غیرفعال/متناقض/نامعلوم)، جمله‌های «همین حالا»، فعل‌های حرکت، و سه ارتباط (بازده واقعی و طلا، نفت و انتظارات، مس و رشد چین) با پاها و رابطه‌شان.

**`together.state.active`**
- فعلی: فعال
- جدید:

**`together.state.partly`**
- فعلی: نیمه‌فعال
- جدید:

**`together.state.inactive`**
- فعلی: غیرفعال
- جدید:

**`together.state.disagree`**
- فعلی: سیگنال‌ها ناهم‌جهت‌اند
- جدید:

**`together.state.unknown`**
- فعلی: دادهٔ تازه کافی نیست
- جدید:

**`together.summaryActive`**
- فعلی: {n} فعال
- جدید:

**`together.summaryPartly`**
- فعلی: {n} نیمه‌فعال
- جدید:

**`together.summaryInactive`**
- فعلی: {n} غیرفعال
- جدید:

**`together.summaryDisagree`**
- فعلی: {n} ناهم‌جهت
- جدید:

**`together.summaryUnknown`**
- فعلی: {n} ناخوانا
- جدید:

**`together.viewLegCard`**
- فعلی: دیدن این شاخص
- جدید:

**`together.rightNowShort.partly`**
- فعلی: بخشی از الگوی همیشگی الان پیداست.
- جدید:

**`together.rightNowShort.inactive`**
- فعلی: الان برای خواندن بیش از حد آرام است.
- جدید:

**`together.rightNowShort.disagree`**
- فعلی: الگوی همیشگی برقرار نیست: {a}، {b}.
- جدید:

**`together.rightNowShort.unknown`**
- فعلی: الان دادهٔ تازه کافی نیست.
- جدید:

**`together.moves.high`**
- فعلی: {name} بالا است
- جدید:

**`together.moves.low`**
- فعلی: {name} پایین است
- جدید:

**`together.moves.mid`**
- فعلی: {name} در میانه است
- جدید:

**`together.phrases.levelDir`**
- فعلی: {name}: {level} و {direction}
- جدید:

**`together.phrases.none`**
- فعلی: {name}: دادهٔ تازه‌ای نیست
- جدید:

**`together.level.high`**
- فعلی: بالا
- جدید:

**`together.level.typical`**
- فعلی: میانه
- جدید:

**`together.level.low`**
- فعلی: پایین
- جدید:

**`together.direction.steady`**
- فعلی: ثابت
- جدید:

### `real-yields-gold` · Real yields and gold

**`together.connections.real-yields-gold.legs.gold-usd`**
- فعلی: طلا
- جدید:

**`together.connections.real-yields-gold.rightNow.active`**
- فعلی: الان {a} در حالی که {b}: الاکلنگِ همیشگی کار می‌کند.
- جدید:

**`together.connections.real-yields-gold.rightNow.partly`**
- فعلی: الان {a}؛ {b}: فقط بخشی از الگو پیداست.
- جدید:

**`together.connections.real-yields-gold.rightNow.inactive`**
- فعلی: الان {a} و {b}: هر دو برای خواندن بیش از حد آرام‌اند.
- جدید:

**`together.connections.real-yields-gold.rightNow.disagree`**
- فعلی: الان {a} و {b}: هر دو یک‌سو کشیده شده‌اند؛ الاکلنگِ همیشگی برقرار نیست.
- جدید:

**`together.connections.real-yields-gold.rightNow.unknown`**
- فعلی: یکی از طرف‌های این رابطه الان دادهٔ تازه ندارد.
- جدید:

### `dollar-gold-oil` · The dollar, gold and oil

**`together.connections.dollar-gold-oil.name`**
- فعلی: دلار، طلا و نفت
- جدید:

**`together.connections.dollar-gold-oil.legs.dollar-basket`**
- فعلی: دلار
- جدید:

**`together.connections.dollar-gold-oil.legs.gold-usd`**
- فعلی: طلا
- جدید:

**`together.connections.dollar-gold-oil.legs.brent`**
- فعلی: نفت
- جدید:

**`together.connections.dollar-gold-oil.relation`**
- فعلی: قیمت طلا و نفت به دلار آمریکاست؛ دلار قوی معمولاً بر آن‌ها فشار می‌آورد و دلار ضعیف معمولاً بالا می‌شانَد.
- جدید:

**`together.connections.dollar-gold-oil.rightNow.active`**
- فعلی: الان {a}، در حالی که {b} و {c}: فشار دلاریِ همیشگی پیداست.
- جدید:

**`together.connections.dollar-gold-oil.rightNow.partly`**
- فعلی: الان {a}؛ {b}، {c}: فقط بخشی از الگو پیداست.
- جدید:

**`together.connections.dollar-gold-oil.rightNow.inactive`**
- فعلی: الان {a}، {b}، {c}: هر سه برای خواندن بیش از حد آرام‌اند.
- جدید:

**`together.connections.dollar-gold-oil.rightNow.disagree`**
- فعلی: الان {a}، اما {b} و {c}: فشار دلاریِ همیشگی دیده نمی‌شود.
- جدید:

**`together.connections.dollar-gold-oil.rightNow.unknown`**
- فعلی: یکی از طرف‌های این رابطه الان دادهٔ تازه ندارد.
- جدید:

### `oil-expectations-costs` · Oil, inflation expectations and borrowing costs

**`together.connections.oil-expectations-costs.legs.brent`**
- فعلی: نفت
- جدید:

**`together.connections.oil-expectations-costs.rightNow.active`**
- فعلی: الان {a}، {b}، {c}: زنجیره برقرار است.
- جدید:

**`together.connections.oil-expectations-costs.rightNow.partly`**
- فعلی: الان {a}، {b}، {c}: زنجیره فقط نیمه‌درگیر است.
- جدید:

**`together.connections.oil-expectations-costs.rightNow.inactive`**
- فعلی: الان {a}، {b}، {c}: زنجیره آرام است.
- جدید:

**`together.connections.oil-expectations-costs.rightNow.disagree`**
- فعلی: الان {a}، {b}، {c}: حلقه‌ها علیه هم نشانه می‌روند.
- جدید:

**`together.connections.oil-expectations-costs.rightNow.unknown`**
- فعلی: یکی از حلقه‌های این زنجیره الان دادهٔ تازه ندارد.
- جدید:

### `copper-china-growth` · Copper demand, Chinese factories and money

**`together.connections.copper-china-growth.legs.copper-gold`**
- فعلی: قیمت مس نسبت به طلا
- جدید:

**`together.connections.copper-china-growth.legs.china-pmi`**
- فعلی: فعالیت کارخانه‌های چین
- جدید:

**`together.connections.copper-china-growth.legs.m2-us`**
- فعلی: حجم پول آمریکا
- جدید:

**`together.connections.copper-china-growth.rightNow.active`**
- فعلی: الان {a}، {b}، {c}: ترکیبِ رشد برقرار است.
- جدید:

**`together.connections.copper-china-growth.rightNow.partly`**
- فعلی: الان {a}، {b}، {c}: ترکیبِ رشد فقط نیمه‌پیداست.
- جدید:

**`together.connections.copper-china-growth.rightNow.inactive`**
- فعلی: الان {a}، {b}، {c}: ترکیبِ رشد آرام است.
- جدید:

**`together.connections.copper-china-growth.rightNow.disagree`**
- فعلی: الان {a}، {b}، {c}: پاره‌ها علیه هم نشانه می‌روند.
- جدید:

**`together.connections.copper-china-growth.rightNow.unknown`**
- فعلی: یکی از پاره‌های این ترکیب الان دادهٔ تازه ندارد.
- جدید:

### `iron-terms-aud` · Iron ore, the terms of trade and the Australian dollar

**`together.connections.iron-terms-aud.name`**
- فعلی: سنگ‌آهن، نسبت مبادله و دلار استرالیا
- جدید:

**`together.connections.iron-terms-aud.legs.iron-ore`**
- فعلی: سنگ‌آهن
- جدید:

**`together.connections.iron-terms-aud.legs.terms-of-trade`**
- فعلی: نسبت مبادله
- جدید:

**`together.connections.iron-terms-aud.legs.audusd`**
- فعلی: دلار استرالیا
- جدید:

**`together.connections.iron-terms-aud.relation`**
- فعلی: سنگ‌آهن از بزرگ‌ترین صادرات استرالیاست؛ قیمت‌های محکم صادرات معمولاً نسبت مبادله را بالا می‌بَرد و با گذر زمان، دلار استرالیا را هم تقویت می‌کند.
- جدید:

**`together.connections.iron-terms-aud.rightNow.active`**
- فعلی: الان {a}، {b}، {c}: زنجیرهٔ صادرات برقرار است.
- جدید:

**`together.connections.iron-terms-aud.rightNow.partly`**
- فعلی: الان {a}، {b}، {c}: فقط بخشی از زنجیرهٔ صادرات پیداست.
- جدید:

**`together.connections.iron-terms-aud.rightNow.inactive`**
- فعلی: الان {a}، {b}، {c}: زنجیرهٔ صادرات آرام است.
- جدید:

**`together.connections.iron-terms-aud.rightNow.disagree`**
- فعلی: الان {a}، {b}، {c}: حلقه‌ها علیه هم نشانه می‌روند.
- جدید:

**`together.connections.iron-terms-aud.rightNow.unknown`**
- فعلی: یکی از حلقه‌های این زنجیره الان دادهٔ تازه ندارد.
- جدید:

### `rba-loan-debt` · The RBA rate, home loans and household debt

**`together.connections.rba-loan-debt.name`**
- فعلی: نرخ RBA، وام مسکن و بدهی خانوار
- جدید:

**`together.connections.rba-loan-debt.legs.rba-cash-rate`**
- فعلی: نرخ رسمی RBA
- جدید:

**`together.connections.rba-loan-debt.legs.au-home-loan`**
- فعلی: نرخ وامی که مردم می‌پردازند
- جدید:

**`together.connections.rba-loan-debt.legs.au-household-debt-arrears`**
- فعلی: نسبت‌های بدهی خانوار
- جدید:

**`together.connections.rba-loan-debt.relation`**
- فعلی: وقتی بانک مرکزی نرخ رسمی را بالا می‌برد، نرخ وامی که مردم واقعاً می‌پردازند معمولاً همراهش می‌رود و بار بازپرداخت بدهی سنگین‌تر می‌شود.
- جدید:

**`together.connections.rba-loan-debt.rightNow.active`**
- فعلی: الان {a}، {b}، {c}: زنجیرهٔ نرخ خانوار درگیر است.
- جدید:

**`together.connections.rba-loan-debt.rightNow.partly`**
- فعلی: الان {a}، {b}، {c}: زنجیرهٔ نرخ خانوار نیمه‌درگیر است.
- جدید:

**`together.connections.rba-loan-debt.rightNow.inactive`**
- فعلی: الان {a}، {b}، {c}: زنجیرهٔ نرخ خانوار آرام است.
- جدید:

**`together.connections.rba-loan-debt.rightNow.disagree`**
- فعلی: الان {a}، {b}، {c}: حلقه‌ها علیه هم نشانه می‌روند.
- جدید:

**`together.connections.rba-loan-debt.rightNow.unknown`**
- فعلی: یکی از حلقه‌های این زنجیره الان دادهٔ تازه ندارد.
- جدید:

## A8. جمله‌های معنا (meaning.*)، ۲۳ مورد

جملهٔ یک‌خطی معنا که زیر نام برخی کارت‌ها می‌آید؛ کلید هر مورد نام همان شاخص است.

**`meaning.yield-curve-10y2y`**
- فعلی: بهرهٔ ۱۰ ساله زیر ۲ ساله نشسته است: نمودار وارونه‌ای که معمولاً نشانهٔ پایان دورهٔ رشد بوده است.
- جدید:

**`meaning.fed-target`**
- فعلی: نرخ سیاست پولی آمریکا در سقف یک دهه است: وام تازه و بدهی کارتی گران‌تر شده‌اند.
- جدید:

**`meaning.ecb-dfr`**
- فعلی: نرخ سیاست پولی منطقهٔ یورو در سقف یک دهه است: وام‌های یورویی گران‌تر شده‌اند.
- جدید:

**`meaning.govt-interest-revenue`**
- فعلی: بهره سهمِ بزرگی از درآمد دولت آمریکا را می‌بلعد: جا برای هزینه‌کرد یا کاستن مالیات کمتر می‌شود.
- جدید:

**`meaning.breakeven-5y5y`**
- فعلی: بازارها انتظار دارند تورم آمریکا پنج تا ده سال آینده بالا بماند.
- جدید:

**`meaning.stress-stlfsi`**
- فعلی: بازارهای پول آمریکا بیش از حد معمول در تنش‌اند: تأمین مالی سخت‌تر و گران‌تر می‌شود.
- جدید:

**`meaning.nfci`**
- فعلی: شرایط مالی آمریکا سخت‌تر از حد معمول است: گرفتن وام دشوارتر می‌شود.
- جدید:

**`meaning.gold-silver`**
- فعلی: طلا در برابر نقره به‌لحاظ تاریخی گران است: نقره سمتِ ارزانِ این جفت است.
- جدید:

**`meaning.dollar-basket`**
- فعلی: دلار در برابر ارزهای بزرگ در سقف یک دهه است: واردات برای بقیهٔ دنیا گران‌تر می‌شود.
- جدید:

**`meaning.usdjpy`**
- فعلی: دلار برابر ین به‌سرعت افت کرده است: کالا و سفر ژاپن برای دارندگان دلار ارزان‌تر شده است.
- جدید:

**`meaning.china-pmi`**
- فعلی: کارخانه‌های چین در حال انقباض‌اند: بزرگ‌ترین خریدار مواد خام دنیا عقب می‌کشد.
- جدید:

**`meaning.us-unemployment`**
- فعلی: بیکاری آمریکا برای دهه‌اش بالاست: افزایش پیوسته‌اش معمولاً نخستین نشانهٔ کندشدن اقتصاد آمریکا است.
- جدید:

**`meaning.sahm-rule`**
- فعلی: هشدار رکود فعال شده: بیکاری آمریکا بیش از ۰٫۵۰ نقطه از کف اخیرش بالا رفته؛ الگویی که با آغاز رکودهای گذشتهٔ آمریکا همراه بوده است.
- جدید:

**`meaning.vix`**
- فعلی: ترس بازار در بخش بالایی بازهٔ ده‌ساله‌اش است: بازارهای سهام جهان بی‌قرارند.
- جدید:

**`meaning.copper-gold`**
- فعلی: مس در برابر طلا به‌لحاظ تاریخی ارزان است: تقاضای صنعتی سرد است.
- جدید:

**`meaning.au-us-10y-gap`**
- فعلی: پول ۱۰ سالهٔ آمریکا از استرالیا گران‌تر شده است: وضعیتی که معمولاً به ضرر دلار استرالیا بوده است.
- جدید:

**`meaning.au-rent-yoy`**
- فعلی: اجاره با تندترین آهنگ یک دهه رشد می‌کند: سهم مسکن از بودجهٔ خانوار بزرگ‌تر می‌شود.
- جدید:

**`meaning.au-home-values`**
- فعلی: قیمت خانه‌ها چند دوره پشت‌سرهم افت کرده است: ارزش دارایی مالکان کوچک‌تر می‌شود.
- جدید:

**`meaning.au-household-debt-arrears`**
- فعلی: سهمِ خانوارهایی که در پرداخت قسط عقب‌مانده‌اند به‌لحاظ تاریخی بزرگ است: فشار در اعتبارات خودش را نشان می‌دهد.
- جدید:

**`meaning.audusd`**
- فعلی: دلار استرالیا برابر دلار آمریکا در کف یک دهه است: واردات و سفر خارجی گران‌تر می‌شود.
- جدید:

**`meaning.audjpy`**
- فعلی: دلار استرالیا برابر ین به‌سرعت افت کرده است: سفر ژاپن گران‌تر می‌شود.
- جدید:

**`meaning.terms-of-trade`**
- فعلی: قیمت صادرات در برابر واردات عقب می‌نشیند: درآمد ملی فشار را حس می‌کند.
- جدید:

**`meaning.iron-ore`**
- فعلی: سنگ‌آهن در کف یک دهه است: بزرگ‌ترین منبع درآمد صادراتی استرالیا ضعیف است.
- جدید:

## رویدادهای تقویم، ۱۴ مورد

عنوان فارسی رویدادهایی که در دور ۱ بازبینی نشدند (۸ رویداد abs-jobs و Fed در دور ۱ به‌روزشدند). عنوان انگلیسی فقط برای زمینه است؛ چیزی که بازبینی می‌شود «جدید:» فارسی است.

**`us-cpi-2026-09`** (2026-10-14 · us-cpi)
- EN: US consumer price index: September 2026
- فعلی: شاخص قیمت مصرف‌کننده آمریکا: سپتامبر ۲۰۲۶
- جدید:

**`abs-cpi-2026-09`** (2026-10-28 · abs-cpi)
- EN: ABS monthly CPI: September 2026
- فعلی: شاخص قیمت مصرف‌کننده ماهانه استرالیا: سپتامبر ۲۰۲۶
- جدید:

**`rba-2026-11`** (2026-11-03 · rba)
- EN: RBA cash rate decision
- فعلی: تصمیم نرخ بهره رسمی استرالیا
- جدید:

**`us-jobs-2026-10`** (2026-11-06 · us-jobs)
- EN: US jobs report (Employment Situation): October 2026
- فعلی: گزارش اشتغال آمریکا: اکتبر ۲۰۲۶
- جدید:

**`us-cpi-2026-10`** (2026-11-10 · us-cpi)
- EN: US consumer price index: October 2026
- فعلی: شاخص قیمت مصرف‌کننده آمریکا: اکتبر ۲۰۲۶
- جدید:

**`abs-cpi-2026-10`** (2026-11-25 · abs-cpi)
- EN: ABS monthly CPI: October 2026
- فعلی: شاخص قیمت مصرف‌کننده ماهانه استرالیا: اکتبر ۲۰۲۶
- جدید:

**`us-jobs-2026-11`** (2026-12-04 · us-jobs)
- EN: US jobs report (Employment Situation): November 2026
- فعلی: گزارش اشتغال آمریکا: نوامبر ۲۰۲۶
- جدید:

**`rba-2026-12`** (2026-12-08 · rba)
- EN: RBA cash rate decision
- فعلی: تصمیم نرخ بهره رسمی استرالیا
- جدید:

**`us-cpi-2026-11`** (2026-12-10 · us-cpi)
- EN: US consumer price index: November 2026
- فعلی: شاخص قیمت مصرف‌کننده آمریکا: نوامبر ۲۰۲۶
- جدید:

**`abs-cpi-2026-12`** (2027-01-27 · abs-cpi)
- EN: ABS monthly CPI: December 2026
- فعلی: شاخص قیمت مصرف‌کننده ماهانه استرالیا: دسامبر ۲۰۲۶
- جدید:

**`rba-2027-02`** (2027-02-09 · rba)
- EN: RBA cash rate decision
- فعلی: تصمیم نرخ بهره رسمی استرالیا
- جدید:

**`abs-cpi-2027-01`** (2027-02-24 · abs-cpi)
- EN: ABS monthly CPI: January 2027
- فعلی: شاخص قیمت مصرف‌کننده ماهانه استرالیا: ژانویه ۲۰۲۷
- جدید:

**`rba-2027-03`** (2027-03-23 · rba)
- EN: RBA cash rate decision
- فعلی: تصمیم نرخ بهره رسمی استرالیا
- جدید:

**`rba-2027-05`** (2027-05-04 · rba)
- EN: RBA cash rate decision
- فعلی: تصمیم نرخ بهره رسمی استرالیا
- جدید:

## موارد پراکنده خارج از دیکشنری‌ها، ۳ مورد

چند متن فارسی مستقیماً داخل خودِ کد نوشته شده‌اند (بیرون از دیکشنری‌ها)؛ بعد از اعمال، همان‌جا به‌روز می‌شوند:

**`inline.ics-calendar-name`**
- فعلی: رویدادهای اقتصادی کورنا
- جدید:

نام تقویم فایل ICS که کاربر در تقویم خودش وارد می‌کند (دکمهٔ «افزودن به تقویم» در بخش شاخص‌ها).

**`inline.header-language-chip`**
- فعلی: فا
- جدید:

حروف کوچکی که روی دکمهٔ تغییر زبان می‌نشیند وقتی رابط در حالت انگلیسی است (معادل «EN» در حالت فارسی).

**`inline.header-language-menu`**
- فعلی: فارسی
- جدید:

نام زبان فارسی در فهرست/برچسب تغییر زبان هدر.

سه مورد دیگر هم عیناً از کلیدهای `common.justNow` و `common.minutesAgo` و `common.hoursAgo` و `common.daysAgo` (بخش B2، جزء ۶) در `packages/core/src/format.ts` کپی شده‌اند؛ بازبینی همان چهار کلید کافی است و هنگام اعمال همگام می‌شوند.

## پیوست: چیزهایی که عمداً در این فایل نیستند

- متن‌هایی که فارسی ندارند: نام‌های لاتین بازارها (Nikkei 225 و…)، اعلان انگلیسی FRED (طبق قاعدهٔ انتساب فدرال رزرو باید عیناً انگلیسی بماند)، و برچسب‌های تیکر لاتین.
- نمادها به‌جای واژه: علامت درصد فارسی (٪)، جداکنندهٔ هزارگان و نماد ارزی درهم (د.إ) که نماد استاندارد است، نه جمله.
- متن‌های دور ۱: هرچه در `persian_site_copy_edited.md` بود و اعمال شد، عمداً حذف شده تا دوباره بازبینی نشود؛ فقط به‌صورت زمینه (فهرست فیلدهای به‌روزشده) بالای کارت‌ها آمده است.
- کامنت‌های فارسی داخل کد (مستندات توسعه، نه متن سایت) و فایل‌های تست (خودکار با اعمال به‌روزرسانی می‌شوند).
