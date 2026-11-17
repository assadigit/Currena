> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S7/02 — The "Why Gold Moves" Education Layer: F4's Content Architecture (M2)

**Session:** S7 of the Gold Page Elevation program (Phase B, session 2 of 2
before CP-B) · **Date:** 2026-11-17 · **Branch:** `docs/gold-page-elevation`

**What this is:** the content design of F4 — the education on-ramp that
closes the page's largest single dimension gap (education 2 vs the
competitor's 4.5, matrix §1 cell 9). Three deliverables: **(1) the
five-driver on-ramp copy architecture** (the Kitco pattern, S4/02 §2a, with
Currena's twist — every driver paragraph closes at the voters/lane that
measure it, linked by the #18 anchor pattern); **(2) the one-line plain
meanings** for every ratio card and TA level (the #12 family, GPE-S2-12);
**(3) the FAQ-shaped format decision** (a format choice of the on-ramp, per
the S3-matrix disposal note in `s5/02 §3`). Every FA string below is a
**draft for the Phase-D Persian-copy manifest rounds** (`pnpm copy:audit`,
C7 rule 1; no em dashes in fa copy) — the binding element is the rule and
the architecture; the strings are the reference wording the rounds start
from. All content complies with C1–C7 (`s6/02`), cited per element.

**Placement (s6/01 Zone D, fixed):** the on-ramp renders collapsed in the
Zone D explanation band; at 390 it expands to an accordion, one driver per
row, closing at its lane anchor (`s6/03 §1` Zone D). The one-liners render
under each card's value (Zone I) and inside the TA band's expandable
(Zone H). The FAQ is the on-ramp's tail sub-section (the decision in §4).

---

## 1. The five-driver architecture (the Kitco pattern, the Currena twist)

### 1.0 The taxonomy decision (weighed, binding)

**Adopted: Kitco's five drivers** (S4/02 §2a verbatim set: real interest
rates and the Fed · inflation and currency debasement · the U.S. dollar ·
central banks · safe-haven and investment demand), each re-cut for
Currena's evidence and **closing at its measuring surface**, plus **two
closing notes** (§2.7–§2.8) that teach the meter's honest asymmetries.

**Weighed against the alternative** — Currena's five *lanes* as the five
drivers (opportunity cost / dollar / stress / inflation / flows), which
would map the on-ramp 1:1 onto the meter. Rejected because: (a) the
on-ramp answers the *market* question ("why does gold move?"), not the
*meter* question ("what are the lanes?") — the reader arrives from the
price, not from the beam; (b) the lanes-as-drivers cut would have to
teach positioning (the flows lane) as a "driver", contradicting Chain 6's
mandated fuel-not-driver framing (`s7/01 §7`); (c) the central-bank
driver — the structural story of the decade — would be demoted out of
the five, contradicting the S3-D1 co-equal-Core sequencing of the demand
prize; (d) S4/02 §2a's recorded pattern is "each driver paragraph ends at
the voters/lane that measures it" — five paragraphs, Kitco's five, the
market's lingua franca. The cost is accepted and taught openly: driver 4
(central banks) closes at a *section*, not a voting lane — which is
itself the governance lesson (§2.8).

**The three-move paragraph skeleton (binding for all five):** every
driver paragraph is exactly three moves, in order — **(i) the mechanism
in plain language** (2 sentences max, no jargon without an inline gloss);
**(ii) the honest limits** (the chain's exception, inline — `s7/01` rule
2: a mechanism without its break is a half-truth); **(iii) the close**
(one sentence + links): "measured today by [the lane family word] — [N]
of the 37 factors, currently [lane word]" with #18 anchor links to the
two named seats, or the display-only close for driver 4. The close is
what Kitco cannot do (S4/02 §2a: "Kitco has no meter; Currena can close
the loop 'here is the driver, here is its gauge today'").

### 1.1 Driver 1 — Real interest rates and the Fed (هزینهٔ فرصت)

**EN reference draft:**

> Gold pays no yield, so its strongest headwind is a high real
> (inflation-adjusted) interest rate and its strongest tailwind is a
> falling one. But the market trades the *expectation*, not the level: a
> rate rise that is fully priced in is a non-event, and a dovish surprise
> inside a hiking cycle can lift gold. Since 2022 the old rule has
> visibly weakened — real yields rose sharply while gold rose too,
> because the marginal buyer changed (see Central banks below). Measured
> today by the borrowing-costs family — 7 of the 37 factors, currently
> [lane word] — see the [10-year real yield] and [Fed expectations] cards.

**FA draft (for the manifest rounds; no em dashes):**

> طلا سودی نمی‌پردازد، پس قوی‌ترین عامل بازدارندهٔ آن، نرخ بهرهٔ واقعی
> (بهره منهای تورم) بالاست و قوی‌ترین عامل تقویت‌کننده، نزول آن. اما
> بازار با «انتظار» معامله می‌کند، نه با سطح نرخ: افزایش نرخی که از قبل
> در قیمت لحاظ شده رویداد محسوبی نیست و یک شگفتی انبساطی وسط چرخهٔ
> افزایش نرخ هم می‌تواند طلا را بالا ببرد. از سال ۲۰۲۲ این قاعدهٔ قدیمی
> کم‌رنگ شده است: بازدهی واقعی به‌طور محسوس بالا رفت اما طلا هم بالا
> رفت، چون خریدار مرزی عوض شد (بانک‌های مرکزی، پایین‌تر). امروز این
> عامل را خانوادهٔ «هزینهٔ قرض» می‌سنجد، ۷ عامل از ۳۷ عامل، وضعیت
> فعلی: [واژهٔ لاین]. کارت‌های [بازدهی واقعی ۱۰ ساله] و [انتظارات فدرال
> رزرو] را ببینید.

**Anchors:** the borrowing-costs lane card (Zone G, `#lane-borrowing-costs`);
the seats `usa-card-real-yield-10y` and `usa-card-fed-expectations` (the
#18 pattern — name-matched link text, card-level hash). **Compliance:** C1
(no numbers in the static copy — the lane word and count render live from
the projection); C4 (no forecasts — "can lift gold" is a mechanism
statement, not a call); the 2022-break clause is the `s7/01 §2` binding
exception, stated in move (ii).

### 1.2 Driver 2 — Inflation and currency debasement (تورم و کاهش ارزش پول)

**EN reference draft:**

> Gold's reputation as an inflation hedge is earned over decades, not
> weeks: over long horizons it tracks purchasing power; over a few
> quarters what matters most is how the Fed *responds* to inflation,
> which is why real rates (above) are the better day-to-day guide. The
> cleanest single summary is the gap between today's inflation and the
> inflation the market expects (breakevens): when the gap closes through
> hawkish policy, that pressures gold; when it closes through lost
> credibility, that supports it. Watch the gap over months, not one
> month — single months are noise. Measured today by the inflation
> family — 10 of the 37 factors, currently [lane word] — see the [CPI]
> and [5y5y breakeven] cards.

**FA draft:**

> شهرت طلا به‌عنوان پوشش تورم در بازهٔ چندده‌ساله ساخته شده، نه چند
> هفته: در افق بلند، طلا قدرت خرید را دنبال می‌کند؛ در چند فصل، مهم‌ترین
> چیز «واکنش فدرال رزرو» به تورم است و به همین دلیل بازدهی واقعی
> (بالاتر) راهنمای روزانهٔ بهتری است. ساده‌ترین جمع‌بندی، شکاف میان
> تورم امروز و تورمی که بازار انتظار دارد (نقطهٔ سربه‌سر) است: اگر این
> شکاف با سیاست انقباضی بسته شود، برای طلا فشار است؛ اگر با فرسایش
> اعتماد بسته شود، برای طلا حمایت. این شکاف را در بازهٔ چند ماه ببینید،
> نه یک ماه؛ دادهٔ یک ماه نویز است. امروز این عامل را خانوادهٔ «تورم»
> می‌سنجد، ۱۰ عامل از ۳۷، وضعیت فعلی: [واژهٔ لاین]. کارت‌های [CPI] و
> [سربه‌سر ۵ به ۵ سال] را ببینید.

**Anchors:** the inflation lane card; `usa-card-us-cpi-yoy` and
`usa-card-breakeven-5y5y`. **Compliance:** the persistence clause is the
Chain-5 binding exception (`s7/01 §5`); C7 rule 6 (dates and regimes, not
numbers — no live gap value in the static copy; the F1 narrative states
it numerically when it moves, from the projection).

### 1.3 Driver 3 — The U.S. dollar (دلار آمریکا)

**EN reference draft:**

> Gold is priced in dollars, so a stronger dollar tends to weigh on the
> gold price and a weaker one tends to lift it — even when nothing about
> gold itself has changed. The rule has two famous breaks: in market
> stress the dollar and gold are bid *together* (the same
> flight-to-safety trade), and in de-dollarization episodes both rise
> (reserve diversification). Gold can also sit at all-time highs in euros
> or yen while consolidating in dollars — check the [currency grid] before
> calling a gold move "global". Measured today by the dollar family — 7
> of the 37 factors, currently [lane word] — see the [dollar basket] card.

**FA draft:**

> طلا به دلار قیمت می‌خورد؛ پس دلار قوی‌تر معمولاً بر قیمت طلا فشار
> می‌آورد و دلار ضعیف‌تر آن را بالا می‌برد، حتی وقتی هیچ‌چیز دربارهٔ خود
> طلا عوض نشده است. این قاعده دو استثنای معروف دارد: در استرس بازار،
> دلار و طلا با هم تقاضا می‌شوند (یک معاملهٔ گریز به امنیت) و در دوره‌های
> کنارگذاری دلار، هر دو بالا می‌روند (تنوع‌بخشی ذخایر). طلا همچنین می‌تواند
> بر حسب یورو یا یِن در سقف تاریخی باشد اما بر حسب دلار در محدوده
> بماند؛ پیش از «جهانی» خواندن حرکت طلا، [جدول ارزها] را ببینید. امروز
> این عامل را خانوادهٔ «دلار» می‌سنجد، ۷ عامل از ۳۷، وضعیت فعلی:
> [واژهٔ لاین]. کارت [سبد دلار] را ببینید.

**Anchors:** the dollar lane card; `currencies-card-dollar-basket`; the
F10 grid (Zone I, when it lands — the copy's bracketed link degrades to
the ratio cards' gold-aud/gold-in-EUR rows until wave 3, then points at
the grid). **Compliance:** the two regime breaks + the local-currency ATH
case are the Chain-2 binding exceptions (`s7/01 §4`), dated examples per
C7 rule 6 at copy-round time.

### 1.4 Driver 4 — Central banks (بانک‌های مرکزی)

**EN reference draft:**

> Central banks are among the largest holders of gold, and after the 2022
> freezing of Russia's reserves their buying roughly doubled — a
> comparatively price-insensitive demand that raised gold's floor and
> weakened the old real-rates rule. The honest limits: this buying is
> slow, lumpy and reported with delay and revisions; it explains a floor
> rising over quarters, not support in every drawdown — and a rising gold
> share of reserves can be price arithmetic, not new buying. This is the
> one driver our 37-factor meter deliberately does not vote on (yet):
> meter membership is a governed, backtested decision, so the demand
> story lives in its own data section — see [Central-bank demand] below.

**FA draft:**

> بانک‌های مرکزی از بزرگ‌ترین دارندگان طلا هستند و پس از انجماد ذخایر
> روسیه در سال ۲۰۲۲، خریدشان تقریباً دو برابر شد؛ تقاضایی نسبتاً
> بی‌حساس به قیمت که کف طلا را بالا برد و قاعدهٔ قدیمی بازدهی واقعی را
> کم‌رنگ کرد. حدود صادقانه: این خرید کُند، تکه‌تکه و با تأخیر و بازنگری
> گزارش می‌شود؛ کفِ در حال بالا رفتن در افق چند فصل را توضیح می‌دهد، نه
> حمایت در هر افت را. ضمناً سهم بالاتر طلا از ذخایر می‌تواند فقط حساب
> قیمتی باشد، نه خرید جدید. این تنها عاملی است که برآیند ۳۷ عاملی ما
> (فعلاً) دربارهٔ آن رأی نمی‌دهد: عضویت در برآیند تصمیمی حاکمیتی و
> پس‌آزموده است، پس روایت تقاضا در بخش دادهٔ خودش زندگی می‌کند؛
> [تقاضای بانک‌های مرکزی] را پایین‌تر ببینید.

**Anchors:** the Zone K section anchor (`#gold-zone-k`); the tracker
chart; (the physical cards' mini-header is the pass-through, `s7/01 §7`).
**Compliance:** the governance sentence is the S6-D2 display-only record
rendered as education (the asymmetry taught, not hidden — §2.8); the
not-a-floor + price-arithmetic clauses are the Chain-4 binding exceptions
(`s7/01 §6`); C6's IMF attribution renders in Zone K itself, not in the
on-ramp.

### 1.5 Driver 5 — Safe-haven and investment demand (گریز از ریسک و تقاضای سرمایه‌گذاری)

**EN reference draft:**

> In periods of market stress, geopolitical risk or currency uncertainty,
> investors move into gold — and flows into and out of gold-backed ETFs
> make that demand visible daily. Two channels hide inside "safe haven":
> the *headline premium* (a war or shock bid that often fades within
> days or weeks when the consequences don't materialize) and the
> *structural shift* (sanctions and reserve freezes change official-sector
> behavior for years). Don't conflate them. Measured today by the stress
> family — 11 of the 37 factors, currently [lane word] — see the [VIX]
> card, and the [ETF flows] card for the visible demand.

**FA draft:**

> در دوره‌های استرس بازار، ریسک ژئوپلیتیکی یا نامطمئنی ارز،
> سرمایه‌گذاران به طلا می‌آیند و جریان ورود و خروج از صندوق‌های ETF
> طلا، این تقاضا را هر روز قابل‌دیدن می‌کند. دو کانال در «محل امن» پنهان
> است: حق‌بهای تیتر روزنامه‌ها (تقاضای ناشی از جنگ یا شوک که اگر
> پیامدهایش محقق نشود، طی چند روز یا چند هفته فروکش می‌کند) و تغییر
> ساختاری (تحریم و انجماد ذخایر که رفتار بخش رسمی را برای سال‌ها عوض
> می‌کند). این دو را با هم اشتباه نگیرید. امروز این عامل را خانوادهٔ
> «استرس» می‌سنجد، ۱۱ عامل از ۳۷، وضعیت فعلی: [واژهٔ لاین]. کارت [VIX]
> و برای تقاضای قابل‌دیدن، کارت [جریان ETF] را ببینید.

**Anchors:** the stress lane card; `usa-card-vix`; the F9 ETF card (Zone
K). **Compliance:** the two-channel distinction is the s1/02 §F education
finding rendered as the honest-limits move; C4 (no forecast).

### 1.6 The lane-word and count placeholders (the live close)

Every close's bracketed values ([lane word], [N of 37]) render **live
from the same page projection the hero reads** — never hand-copied into
the dictionary. The lane words are the meter's own (`relief/tight` for
borrowing-costs, `stress/strong` for dollar, `elevated/calm` for stress,
`hot/cool` for inflation — `gold-score.ts`'s `LANE_TAILWIND_WORD`/
`LANE_HEADWIND_WORD`, rendered in the page's existing bilingual lane
vocabulary). A consistency test pins the on-ramp's counts to the hero's
counts byte-for-byte (the one-projection rule, `s7/03 §2.4`).

### 1.7 Closing note A — the fuel gauge (سوخت، نه راننده)

**EN reference draft:**

> One thing this page deliberately does *not* teach as a driver: crowded
> positioning. Futures speculators' books are the market's fuel gauge —
> at extremes they mark fragile, crowded trades (in either direction);
> in the middle of the range they carry little information. The flows
> family measures it with a deliberately short horizon (days to weeks).
> See the [gold positions] cards.

**FA draft:**

> یک چیز که این صفحه آگاهانه به‌عنوان «راننده» آموزش نمی‌دهد: پوزیشن‌های
> شلوغ. دفتر سفته‌بازان آتی، نمایشگر سوخت بازار است؛ در نقاط افراطی،
> معاملهٔ شلوغ و شکننده را نشان می‌دهند (در هر دو جهت) و وسط بازه،
> اطلاعات کمی دارند. خانوادهٔ «جریان‌ها» آن را با افق کوتاه (چند روز تا
> چند هفته) می‌سنجد. کارت‌های [پوزیشن‌های طلا] را ببینید.

**Anchors:** the flows lane card; the COT one-liners (§3). **This note is
Chain 6's mandated treatment** (`s7/01 §7`) — the fuel-not-driver framing
given its structural home at the on-ramp's close.

### 1.8 Closing note B — how the meter votes (the governance asymmetry, taught)

**EN reference draft:**

> Why five drivers here and five lanes in the meter, but not the same
> five? Because the meter only votes on relations that measured stable
> enough to backtest: growth was excluded (its members' gold relation was
> unstable), trend lives in the reference-levels band (not a vote), and
> central-bank demand is presented, not voted (its own section below).
> Every exclusion is a recorded decision, not a gap — the honest record
> at the bottom of the page lists them.

**FA draft:**

> چرا پنج راننده اینجا و پنج لاین در برآیند، اما یکسان نیستند؟ چون
> برآیند فقط دربارهٔ روابطی رأی می‌دهد که به‌اندازهٔ کافی پایدار از آب
> درآمده باشند تا پس‌آزمایش شوند: رشد حذف شده (رابطهٔ اعضایش با طلا
> ناپایدار بود)، روند قیمت در بخش «سطوح مرجع» زندگی می‌کند (بدون رأی) و
> تقاضای بانک‌های مرکزی فقط ارائه می‌شود، نه رأی (بخش جداگانهٔ پایین‌تر).
> هر حذف یک تصمیم ثبت‌شده است، نه یک جای خالی؛ فهرستشان در «سابقهٔ
> صادق» پایین صفحه است.

**Anchors:** the honest-record zone (Zone M); the TA band (Zone H); Zone
K. **Compliance:** this note renders the GRAM mapping's honest
divergences (S4/01 §2: growth has no lane; momentum has no vote; flows is
Currena's extra bucket) as reader-facing education — the recorded rule is
that F1/F4 "must not invent a growth story the meter doesn't have";
teaching *why* is the strongest compliance.

---

## 2. The one-line plain meanings (the #12 family, GPE-S2-12)

**The rule (binding):** every context card and every TA level renders one
plain-language sentence under its value — what the object *is*, in words a
general reader owns, with the honest note where the object carries one
(the COT mid-range lesson; the sensor-not-verdict premium). No number
restated, no forecast, no advice; series named only where C1 demands it
(the TA rows and the premium rows carry their series/convention notes in
their existing places — the one-liner stays plain). The list below is the
complete set of record: the 13 context cards (gold-usd is the hero price,
no one-liner needed — its "meaning" is the market-state pill and the
as-of line, Zone B) + the TA family + the F5 legs.

### 2.1 Zone I — the ratio cards (9)

| Card | EN one-liner | FA draft (for the rounds) |
|---|---|---|
| `gold-silver` | "How many ounces of silver one ounce of gold buys — when the ratio is high, silver is cheap relative to gold." | «هر انس طلا چند انس نقره می‌خرد؛ وقتی نسبت بالاست، نقره نسبت به طلا ارزان است.» |
| `gold-btc` | "The ounce-to-bitcoin exchange rate — the two debasement hedges priced against each other." | «نرخ تبدیل انس طلا به بیت‌کوین؛ دو پناهگاه در برابر کاهش ارزش پول، در برابر هم قیمت می‌خورند.» |
| `gold-aud` | "Gold priced in Australian dollars — how the metal reads for a commodity-currency holder." | «قیمت طلا به دلار استرالیا؛ طلا از دید دارندهٔ یک ارز کالایی چقدر خوانده می‌شود.» |
| `gold-oil-ratio` | "How many barrels of oil one ounce of gold buys — gold's energy purchasing power." | «هر انس طلا چند بشکه نفت می‌خرد؛ قدرت خرید انرژی با طلا.» |
| `gold-platinum` | "Gold against its industrial precious sibling — the monetary metal's rarity premium made visible." | «طلا در برابر خواهر صنعتی‌اش، پلاتین؛ حق‌بهای کمیابی فلز پولی، نمایان.» |
| `real-gold-price` | "Today's gold price in inflation-adjusted dollars — the long-horizon value gauge (what an ounce has been worth across decades)." | «قیمت امروز طلا به دلار تعدیل‌شده با تورم؛ سنجهٔ ارزش در افق بلند (انس طلا در طول دهه‌ها چقدر بوده است).» |
| `copper-gold` | "Gold against copper — the monetary metal versus the industrial cycle in one number." | «طلا در برابر مس؛ فلز پولی در برابر چرخهٔ صنعتی، در یک عدد.» |
| `gold-equities-ratio` | "Gold against the S&P 500 — the defensive-versus-risk balance over the long cycle." | «طلا در برابر شاخص S&P 500؛ توازن دفاعی در برابر ریسک در چرخهٔ بلند.» |
| `gold-btc` (dup guard) | — | *(see above; listed once)* |

### 2.2 Zone J — the flows and physical cards (5)

| Card | EN one-liner | FA draft |
|---|---|---|
| `cftc-gold-positioning` | "What gold futures speculators hold net long — the crowd gauge. Extremes mark fragile trades; the middle of the range tells you little." | «خالص خرید سفته‌بازان آتی طلا؛ نمایشگر ازدحام. نقاط افراطی معاملهٔ شکننده را نشان می‌دهند و وسط بازه حرف چندانی نمی‌زند.» |
| `cftc-gold-gross-long` | "The gross long share of open interest — how one-sided the speculative book is." | «سهم خرید ناخالص از کل قراردادهای باز؛ دفتر سفته‌بازان چقدر یک‌طرفه است.» |
| `sge-gold-withdrawals` | "How much gold left Shanghai vaults for delivery — China's physical demand pulse." | «چه مقدار طلا برای تحویل از خزانه‌های شانگهای خارج شد؛ نبض تقاضای فیزیکی چین.» |
| `swiss-gold-flow` | "Switzerland's gold imports and exports — where the world's refining hub is sending the metal." | «واردات و صادرات طلا از سوئیس؛ هاب پالایش جهان فلز را به کجا می‌فرستد.» |
| `shanghai-gold-premium` | "The Shanghai-over-London price gap — the market's own sensor for where the physical buyer is." | «شکاف قیمت شانگهای نسبت به لندن؛ حسگر خود بازار برای یافتن جای خریدار فیزیکی.» |

**The shared physical-market reading line** (`s7/01 §7`, renders once
under the «بازار فیزیکی» mini-header, not per card): EN — "Persistent
premiums mark phases when physical (mainly Asian) demand is the marginal
bid; discounts mark Western-investment-led phases." FA — «حق‌بهای پایدار،
فازهایی را نشان می‌دهد که تقاضای فیزیکی (عمدتاً آسیایی) خریدار مرزی
است؛ تخفیف، فازهای رهبری‌شده توسط سرمایه‌گذاری غربی را.»

### 2.3 Zone H — the TA levels (the C5 family)

| Object | EN one-liner | FA draft |
|---|---|---|
| SMA rows (shared, once per table) | "The average close of the last N days — the trend's reference line, named for its window; a descriptive reference, not a guarantee." | «میانگین قیمت پایانی N روز اخیر؛ خط مرجع روند، به نام پنجرهٔ خود. توصیف است، نه تضمین.» |
| Distance-from-200DMA | "How far the price sits from its 200-day average — the trend's stretch, shown as a percentile of the decade." | «قیمت چقدر از میانگین ۲۰۰ روزهٔ خود فاصله دارد؛ کشیدگی روند، به‌صورت صدک دهه.» |
| Cross events | "The day the 50-day crossed the 200-day — a dated event with what followed, whipsaws included." | «روز عبور میانگین ۵۰ روزه از ۲۰۰ روزه؛ رویدادی تاریخ‌دار همراه با آنچه بعدش آمد، برگشت‌های کاذب هم شامل.» |
| Classic pivots (daily) | "Yesterday's high, low and close turned into today's reference levels — levels the market watched, not promises." | «سقف، کف و پایانی دیروز، تبدیل به سطوح مرجع امروز؛ سطوحی که بازار تماشایش می‌کند، نه وعده‌ای.» |
| Classic pivots (weekly) | "The same arithmetic on last week's session — the swing trader's reference grid." | «همان محاسبه بر جلسهٔ هفتهٔ پیش؛ شبکهٔ مرجع نوسان‌گیر.» |

**Compliance:** C5 rules 1–3 (descriptive reference; dated events with
whipsaws; the decile grammar) are *restated inside* the one-liners —
the vocabulary is TGJU's (میانگین متحرک، سطوح پیوت) per C5's vocabulary
rule, and the honesty clauses ride the same sentence.

### 2.4 Zone D — the F5 legs (each row's inline gloss, C1's series naming)

| Leg | EN inline gloss | FA draft |
|---|---|---|
| Nominal 10y | "The Treasury's plain interest rate — the headline number." | «نرخ بهرهٔ سادهٔ اوراق؛ عدد تیتر روزنامه‌ها.» |
| Real 10y | "The nominal rate minus expected inflation — what a saver actually earns; gold's classic rival." | «نرخ اسمی منهای تورم انتظاری؛ آنچه سپرده‌گذار واقعاً به دست می‌آورد؛ رقیب کلاسیک طلا.» |
| Breakeven | "The inflation the market prices into the gap — expected inflation, read off the yield curve." | «تورمی که بازار در شکاف دو نرخ می‌گنجاند؛ تورم انتظاری، خوانده‌شده از منحنی بازدهی.» |
| Term premium | "The extra yield lenders demand for holding long — the fear-and-supply compensation; when this piece lifts the yield, history has supported, not hurt, gold." | «بهرهٔ اضافه‌ای که وام‌دهنده برای بلندمدت نگه‌داشتن مطالبه می‌کند؛ جبران ترس و عرضه. وقتی این قطعه، بازدهی را بالا می‌برد، تاریخ با طلا بوده است، نه علیه آن.» |

*(The F5 configuration reading block — the three named configurations —
is spec'd in `s7/01 §4`; the leg glosses above are the one-liner layer
inside the card.)*

---

## 3. The FAQ-shaped format decision (the S3-matrix disposal, decided)

**Decision: the FAQ is the on-ramp's tail sub-section** — a "common
questions" block at the end of the F4 accordion (Zone D), not a separate
zone, not omitted. Six questions, each answer ≤3 sentences, each closing
at its anchor.

**Weighed:** (a) *a separate FAQ section* — rejected: the S6 map has no
zone for it (S6-D1's 16 zones are the map of record; adding a 17th for
content the on-ramp can carry contradicts the density mechanics), and
SA's FAQ works *because* it is their only education surface — Currena's
has five driver paragraphs to carry the same load; (b) *no FAQ* —
rejected: the format is proven with the Persian reader (SA's five
questions verified accurate and accessible, GPE-S3's education 4.5
partially rides them) and the disposal note (`s5/02 §3`) names it "a
format choice of the on-ramp"; (c) *the tail sub-section* — chosen: it
catches the questions the driver paragraphs provoke but don't answer
(the meta-questions), at zero new zones.

**The six questions (order = the reading arc; EN + FA drafts):**

1. **"Is gold a good inflation hedge?"** — the Chain-5 answer: decades
   yes, quarters it depends on the Fed's response; the gap summary;
   closes at the inflation lane + the CPI/breakeven cards. FA:
   «آیا طلا پوشش خوبی برای تورم است؟» (پاسخ: در افق چندده‌ساله بله؛ در
   چند فصل بستگی به واکنش فدرال رزرو دارد.)
2. **"Yields went up and gold went up too — why?"** — the Chain-3/4
   answer: which piece of the yield moved (the F5 card), and the buyer
   rotated (Zone K); closes at F5 + Zone K. FA: «بهره بالا رفت و طلا هم
   بالا رفت؛ چرا؟»
3. **"Gold is at a record in euros but not in dollars — which is real?"**
   — the Chain-2 answer: both are real; the currency grid separates the
   dollar story from the global one; closes at the F10 grid. FA: «طلا بر
   حسب یورو رکورد زده اما بر حسب دلار نه؛ کدام واقعی است؟»
4. **"Does the 37-factor meter predict the price?"** — the no: it
   describes conditions; the published no-edge backtest is the page's own
   evidence; closes at the honest record (Zone M). FA: «برآیند ۳۷ عاملی
   قیمت را پیش‌بینی می‌کند؟»
5. **"What is the coin's حباب, and why does every site show a different
   number?"** — the C2 divergence lesson: the premium over melt value;
   the three-numbers-in-one-hour exhibit; this page's number reconciles
   visibly; closes at Zone F. FA: «حباب سکه چیست و چرا هر سایت عدد
   متفاوتی نشان می‌دهد؟»
6. **"Why do some factors say 'couldn't be read'?"** — the F16 why-lines
   as education: the four cause classes (upstream stopped / publication
   gap / pipeline lag / rule-driven), each with its "when back" where
   known; closes at the seats (Zone G). FA: «چرا بعضی عوامل «خوانده نشد»
   هستند؟»

**Compliance:** C3's clause 4 family (Q4 must not weaken the outlook
resolution — the answer repeats the conditions-not-forecast frame, never
"so ignore the meter"); C4 (no forecast numbers in any answer); Q5's
wording follows C2 rule 4 (documents, never mocks); Q6 converts the
known pipeline state into education — the two operational P0s (CFTC,
GPR) stay owned by the modularization-closeout window (S2-D4, cited, not
re-litigated); the why-lines render honestly for as long as they persist.

---

## 4. The manifest-gate note (binding for Phase D)

Every FA string in this document — the five driver paragraphs, both
closing notes, the six FAQ answers, all one-liners, the shared physical
reading, the F5 leg glosses — enters the repo through the Persian-copy
manifest rounds: new dictionary keys under the gold feature's i18n
namespace, fingerprinted in `docs/localization/persian-copy-manifest.json`,
reviewed and recorded per `docs/localization/persian-copy-workflow.md`
until `pnpm copy:audit` is green (C7 rule 1). **No em dashes in fa copy**
(the drafts above comply; the rounds verify). The EN strings ship through
the EN dictionary in the same change. The lane-word/count placeholders
(§1.6) are interpolated at render time from the projection — they are
never dictionary literals, and a test pins them to the hero's values.

## 5. Method and limitations

The architecture adopts the recorded pattern (S4/02 §2a, S4/05 §6) and
resolves the three decisions this session owns: the taxonomy (§1.0,
weighed), the one-liner set of record (§2, complete against the 14
context-card ids + the TA family + the F5 legs read from `gold-tiles.ts`
at this session's checkout), and the FAQ format (§3, weighed). The EN
paragraphs are reference wording (the structure and the honest-limits
content are binding; the prose itself is editable at copy-round time).
The FA drafts are first-pass translations for the rounds — a native
review pass is part of the manifest workflow, and terminology follows
`docs/localization/persian-terminology.md` (terms like نقطهٔ سربه‌سر for
breakeven to be confirmed/added there in Phase D). Limitations: no code
exists or was touched (standing constraint); the F10/Q3 answer degrades
gracefully until wave 3 (noted in §1.3); the live-close rendering needs
the projection fields the S8 spec will name.
