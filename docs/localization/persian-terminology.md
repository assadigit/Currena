# Persian financial terminology glossary

Approved wording for Currena's Persian (fa) UI, established by the two copy
rounds (`persian_site_copy_edited.md`, then the seven
`persian_site_copy_round2_part*_polished-translated.md` files) and enforced by
the copy audit (`pnpm copy:audit`). Use these terms for any new Persian copy;
if a new context genuinely needs a different form, add it here in the same PR.

Conventions that apply everywhere:

- **No em dashes** in user-facing Persian; use «،», «؛» or «(...)».
- **Placeholders stay intact**: `{n}`, `{date}`, `{rate}`, `{from}`, `{to}`,
  `{bandPos}`, `{bandLabel}` … may move within the sentence, never disappear.
- **Persian digits** in static copy (۲٪, ۱۰ ساله); dynamic numbers are
  formatted with the fa-IR `Intl` locale at render time.
- **Latin tickers stay Latin** (CPI, VIX, AUD/USD, Nikkei 225, FRED series
  ids). The FRED attribution notice stays verbatim English.
- ZWNJ (نیم‌فاصله) is meaningful: «نرخ‌های لحظه‌ای», «می‌گویند», «قیمت‌ها».

## Status and level words (fixed vocabulary — do not re-translate)

| English | Persian | Key(s) |
| --- | --- | --- |
| Warning / needs attention | نیازمند توجه | `ui.filterWarning`, `status.warning` |
| Unusual | غیرعادی | `status.unusual`, `ui.unusualWord` |
| Normal / typical | عادی | `status.normal` |
| Context (informational only) | صرفاً برای اطلاع | `status.context`, `ui.filterContext` |
| Stale (old snapshot) | قدیمی | `status.stale` |
| Limited history | سابقهٔ ناکافی | `status.no-history` |
| No data | داده در دسترس نیست | `status.unavailable` |
| Relaxed | پایدار | `label.relaxed` |
| Cautious | احتیاط | `label.cautious` |
| Stressed | پرتنش | `label.stressed` |
| Alarmed | بحرانی | `label.alarmed` (deliberately distinct from هشدار) |

Band position words: در محدودهٔ (inside), بالاتر از (above), پایین‌تر از
(below) — `ui.bandPos*`. Threshold rules: بیشتر از / کمتر از {value}
(`rule.thresholdAbove/Below`).

## World trade and shipping (gap-closure S4, round 68)

| English | Persian | Notes |
| --- | --- | --- |
| Chokepoint | گلوگاه | The narrow sea passage sense; `chokepoint-*` cards + the layer-1 glossary (round 68) |
| Transit (of ships) | تردد | The count word; "transits a day" → «تردد در روز» (`units.transits`) |
| Estimate (a data estimate) | برآورد | The honest PortWatch labelling; «برآورد» rides every chokepoint card |
| Supply chain | زنجیرهٔ تأمین | ZWNJ; established by the S3 rounds |
| Raw materials | مواد خام | The Australia-angle trade word (round 71; the Malacca/Taiwan `whyItMatters` — «صادرات مواد خام استرالیا») |
| The biggest buyers | بزرگ‌ترین خریداران | ZWNJ in بزرگ‌ترین; the superlative form chosen over a share claim (round 71 — tendencies only, never a number) |

## New Zealand (gap-closure S6, round 73)

| English | Persian | Notes |
| --- | --- | --- |
| New Zealand | نیوزیلند | `marketsAu.groups.newzealand` + every NZ card |
| S&P/NZX 50 | شاخص ۵۰ شرکت بزرگ نیوزیلند | `marketsAu.entries.nz50.name`; the Latin tag `S&P/NZX 50` stays |
| NZX (the exchange) | بورس نیوزیلند | `marketsAu.entries.nz50.what` |
| AUD/NZD | دلار استرالیا در برابر دلار نیوزیلند | the audusd pattern (`indicators.audnzd.name`) |
| New Zealand dollar | دلار نیوزیلند | `units.nzd` |
| The cross-Tasman pair | جفت‌ارز تاسمان | the audnzd layer-1 plainName (Tasman = تاسمان) |
| Short-term interest rate | نرخ بهرهٔ کوتاه‌مدت | `indicators.nz-short-rate` — never «نرخ رسمی بهره» (that is the RBA policy-rate word) |
| Money-market rate | نرخ بازار پول | the nz-short-rate whatItIs |
| 10-year government bond yield | بازده اوراق قرضه ۱۰سالهٔ دولت نیوزیلند | the au-10y pattern (`indicators.nz-10y.name`) |
| Reserve Bank of New Zealand | بانک مرکزی نیوزیلند | the «بانک مرکزی» glossary term |
| OECD (the organisation) | سازمان همکاری و توسعه اقتصادی | one convention everywhere (no hamza on توسعه) |

## De-dollarization and concentration (gap-closure S6)

| English | Persian | Notes |
| --- | --- | --- |
| US dollar share of world FX reserves | سهم دلار از ذخایر ارزی جهان | `indicators.usd-reserve-share.name`; «سهم دلار از ذخایر جهان» in layer 1 |
| Reserve share | سهم ذخایر | the ticker (`indicators.usd-reserve-share.ticker`) |
| Reserve diversification | تنوع‌بخشی ذخایر | the slow structural story — the measured phrasing only, never a prediction |
| Equal-weight index | شاخص هم‌وزن | the glossary term; every company counts once |
| Cap-weighted | وزن‌مبنا | `indicators.sp500-breadth-ratio.name` («S&P 500 هم‌وزن در برابر وزن‌مبنا (نسبت)») |
| Breadth ratio | نسبت گستردگی | the ticker (`indicators.sp500-breadth-ratio.ticker`) |
| Two scales / two yardsticks | دو ترازو | the layer-1 plainName («بازار بزرگ آمریکا، با دو ترازو») |
| Market concentration | تمرکز بازار | the why-it-matters language; the card is honestly a proxy for the giants' share |
| Proxy measure | سنجهٔ جایگزین | the honest label on sp500-breadth-ratio (the level is arbitrary; the movement is the signal) |
| Italy–Germany 10-year spread | فاصلهٔ ۱۰سالهٔ ایتالیا و آلمان | `indicators.btp-bund-spread.name`; «فاصلهٔ استقراض ایتالیا و آلمان» in layer 1 |
| BTP / Bund | BTP / بوند | the Italian and German government-bond tickers; the Latin BTP stays (the ticker `BTP–Bund`) |
| Sovereign spread | فاصلهٔ حاکمیتی | the glossary term — what two governments pay to borrow for the same term |

## Exchange rates and conversion

| English | Persian | Notes |
| --- | --- | --- |
| Exchange rate | نرخ ارز | |
| Live rates | نرخ‌های لحظه‌ای | ZWNJ; section + nav (`nav.liveRates`) |
| Converter | مبدل / مبدل ارز | page title «کورنا، مبدل ارز» |
| Iranian Toman (open market) | تومان (بازار آزاد) | IRR label now «تومان (IRR)» — Persian name first |
| Currency pair | جفت‌ارز | ZWNJ |
| Convert (verb) | تبدیل‌کردن | |
| Rate alerts | هشدارهای نرخ ارز | `alerts.sectionTitle` |
| Buy / sell (board) | خرید / فروش | |
| Rate snapshot | عکس‌فوری نرخ‌ها | `snapshot.*` |
| Receipt | رسید | generator = «ساخت رسید» |
| Batch conversion | تبدیل گروهی | |

## Markets and indices

| English | Persian | Notes |
| --- | --- | --- |
| Stock markets | بازارهای سهام | `markets.title` — the section's editorial title is now «نبض بازارهای جهان» with «شاخص‌های بورسی جهان» as the descriptive label (`markets.sectionLabel`, handoff-world-indices round) |
| Index (stock) | شاخص | same word as economic indicator — context disambiguates |
| World currencies | ارزهای مهم جهان | section title |
| Verdict meter | وضعیت در مقیاس چهارسطحی | `markets.verdictMeterLabel`; hero = «وضعیت در یک نگاه» |
| Chart value | ارزش در نمودار | `markets.chartValueAria` |
| Performance period (daily/weekly/monthly/quarterly) | بازهٔ عملکرد؛ روزانه / هفتگی / ماهانه / سه‌ماهه | `markets.viewDaily…viewQuarterly` (handoff-world-indices: adjectival lens labels) |
| Biggest gain / biggest fall | بیشترین رشد / بیشترین افت | `markets.moverGain` / `markets.moverLoss` |
| Indices up / down / flat | شاخص‌های مثبت / شاخص‌های منفی / بدون تغییر | `markets.breadthUp/Down/Flat` |
| List / performance map | فهرست / نقشهٔ عملکرد | `markets.viewList` / `markets.viewHeatmap` |
| Country / market label (per index) | کشور/بازار هر شاخص | `markets.entries.*.country` — ژاپن، استرالیا، کرهٔ جنوبی، هنگ‌کنگ (بازار، نه کشور), چین، تایوان، هند، منطقهٔ یورو (نه یک کشور), آلمان، فرانسه، بریتانیا، آمریکا، کانادا، برزیل |

## Bonds, yields, interest rates

| English | Persian | Notes |
| --- | --- | --- |
| Interest rate | نرخ بهره | the default everywhere |
| Policy rate (RBA) | نرخ رسمی بهره | «تصمیم بانک مرکزی استرالیا دربارهٔ نرخ رسمی بهره» (calendar) |
| Bond yield | بازده | «بازده اوراق قرضه» in full form; «بازده ۱۰ ساله» short form |
| Yield curve | منحنی بازده | inverted = «وارونه» |
| Real yield | بازده واقعی | |
| Federal Reserve | فدرال رزرو | transliterated, no «بانک مرکزی آمریکا» in card copy |
| Central bank (generic/AU) | بانک مرکزی | |
| Cash rate / deposit rate | نرخ سود سپرده | money-panel wording |
| Inflation target | هدف تورمی | «بازهٔ هدف تورمی ۲ تا ۳ درصدی بانک مرکزی استرالیا» (`au-cpi.band.label`) |
| Breakeven / market inflation expectations | تورم مورد انتظار | `breakeven-5y5y` card: «تورم مورد انتظار آمریکا در پنج تا ده سال آینده» |

## Inflation and growth

| English | Persian | Notes |
| --- | --- | --- |
| Inflation | تورم | |
| Core inflation | تورم هسته‌ای | |
| CPI (consumer prices) | شاخص قیمت مصرف‌کننده | full form; ticker stays CPI |
| trimmed mean | تورم زیرین | AU trimmed-mean card (`au-trimmed-mean`) |
| Economic growth | رشد اقتصادی | |
| Recession | رکود | «رکود تورمی» = stagflation context |
| Unemployment | بیکاری | `us-unemployment` |
| Jobs report | گزارش وضعیت بازار کار | calendar titles |
| Inflation expectations | انتظارات تورمی | |
| GDP / real GDP | تولید ناخالص داخلی / تولید واقعی | the `au-gdp-growth` card + glossary (round 72) |
| Household spending | هزینه‌کرد خانوار | `au-household-spending` (the HSI successor to the discontinued Retail Trade series) |
| Dwelling approval | مجوز ساخت مسکن | `au-building-approvals` + glossary; the supply pipeline's leading edge |
| Population growth | رشد جمعیت | `au-population-growth` |
| Net overseas migration | مهاجرت خالص خارجی | `au-nom` + glossary (round 72); NOTE: the EN layer-1 plainName reads "Net overseas movement" because the copy validator's jargon scan matches substrings — "migration" contains "ratio" (round 72's live finding) |
| Participation rate | نرخ مشارکت | `au-participation` + glossary |
| Underemployment | کم‌کاری | `au-underemployment` + glossary; NOT «بیکاری پنهان» (the hidden-slack phrase rides the card copy instead) |
| Trade balance (goods) | تراز تجاری کالا | `au-trade-balance` + glossary |

## Household budget, shared expenses, settlement

| English | Persian | Notes |
| --- | --- | --- |
| Household budget | بودجهٔ خانوار / هزینه‌های روزمره | money panel: «اثر بر هزینه‌های روزمره» |
| Expense splitter | تقسیم هزینه | tool name |
| Split & settle | تسویهٔ گروهی | `nav.splitSettle` (with هٔ ezafe) |
| Settlement (group) | تسویه | |
| Home loan | وام مسکن | money area «وام مسکن و اجاره» |
| Rent | اجاره (اجاره‌بها in formal sentences) | |
| Savings / deposit interest | پس‌انداز / سود سپرده | |
| Petrol and transport | بنزین و حمل‌ونقل | money area |

## Metals, commodities, indicators

| English | Persian | Notes |
| --- | --- | --- |
| Gold | طلا | |
| Silver | نقره | |
| Copper | مس | |
| Oil (crude) | نفت | |
| Iron ore | سنگ‌آهن | |
| Property development investment (China, YTD) | سرمایه‌گذاری توسعهٔ املاک (چین، از ابتدای سال) | `china-property-investment` + glossary؛ رقم تجمعی ژانویه تا ماه اعلام‌شده در سنجش با مدت مشابه سال قبل |
| Crude steel output | تولید فولاد خام | `china-steel-output` + glossary؛ واحد ده‌هزار تنی ادارهٔ آمار چین، روی کارت به میلیون تن مقیاس می‌شود |
| Steel mill / steelmaker | فولادساز / کارخانهٔ فولاد | the `china-demand-iron-ore` card |
| Precious metals | فلزات گران‌بها | |
| Indicator | شاخص | insights page «شاخص‌های اقتصادی» |
| Indicator card one-liner | توضیح یک‌خطی | fields: `whatItIs`, `whyItMatters`, `tendedToMean`, `cantTell`, `forYou` |
| Percent sign | ٪ (Persian) | glyph, not the word |
| Gold price in A$ | قیمت طلا به دلار استرالیا | `gold-aud` |

## Gold balance lanes (gold-balance consolidation, rounds 76–77)

The consolidated lane balance behind `?balance=lanes`
(`signals.balance.*`; the lane/voter/evidence words under
`signals.goldScore` are round-53's, reused as they are):

| English | Persian | Notes |
| --- | --- | --- |
| Split (a contested neutral lane) | دوپاره | `signals.balance.splitBadge` (OI-2's default) — the single most important disclosure: a neutral lane that is contested, not empty |
| Split: {supports} for, {pressures} against | دوپاره: {supports} موافق، {pressures} مخالف | `signals.balance.laneStateSplit`; the contest line itself is `laneSplit` «{supports} موافق، {pressures} مخالف» |
| {firing} of {readable} drivers firing | {firing} مورد از {readable} عامل فعال است | `signals.balance.laneTally` — the lane chip's second line |
| No driver firing | هیچ عاملی فعال نیست | `signals.balance.laneTallyNone` — a readable lane with zero firing voters |
| For gold / Against gold / Not leaning / Unread (lane states) | به نفع طلا / علیه طلا / بدون گرایش / قابل ارزیابی نبود | `signals.balance.laneState*` (round-77); the tray's own title is «بدون گرایش» |
| Not leaning (the tray) | بدون گرایش | `signals.balance.trayTitle`; trayNote: «سنجیده شد، اما گرایش روشنی نیست» |
| Supports gold / Pressures gold (members) | به نفع قیمت طلا / علیه قیمت طلا | `signals.balance.memberSupports` / `memberPressures` (the engine's supports/pressures vocabulary) |
| Not firing ({n}) | غیرفعال ({n}) | `signals.balance.membersSteadyTitle` — the steady voters' collapsed group |
| Could not be read ({n}) | قابل ارزیابی نبود ({n}) | `signals.balance.membersUnreadTitle` — the «قابل ارزیابی» family (round-76's polish) |
| {n} for / {n} not leaning / {n} unread (counts) | {n} موافق / {n} بدون گرایش / {n} ناخوانده | `signals.balance.verdictCount*` (round-77); against mirrors «{n} مخالف» |
| Gold over the last 30 days: … not counted in the balance | طلا در ۳۰ روز گذشته: … برای زمینه نشان داده می‌شود و در ترازو حساب نمی‌شود | `signals.balance.contextLine` — the non-voting footing line (01 §6) |
| Borrowing costs / Dollar / Market stress / Inflation (the four lanes) | هزینهٔ استقراض / دلار / تنش بازار / تورم | `signals.goldScore.laneNames.*` (round-53, reused — the lane model keeps the wind panel's lane vocabulary) |

## Time, freshness, and time-ago

| English | Persian | Notes |
| --- | --- | --- |
| just now | همین حالا | `common.justNow` **and** its `format.ts` mirror |
| {n} minutes ago | {n} دقیقه پیش | idem |
| {n} hours ago | {n} ساعت پیش | idem |
| {n} days ago | {n} روز پیش | idem |
| Updated | به‌روزرسانی | `ui.updatedAgo` «به‌روزرسانی {ago} · {date}» |
| Fresh reading | دادهٔ به‌روز | `together.phrases.none` «دادهٔ به‌روز در دسترس نیست» |
| Steady (direction) | بدون تغییر محسوس | `together.direction.steady` |

## Errors, warnings, buttons, accessibility

| English | Persian | Notes |
| --- | --- | --- |
| Retry | تلاش دوباره | `ui.retry`, `app.errorRetry` |
| Something went wrong | خطایی رخ داده است | `app.errorTitle` |
| Data unavailable | فعلاً داده‌ای … در دسترس نیست | `ui.loadError` |
| Copied! | کپی شد | context-specific variants allowed (`converter.rateCopied`) |
| Search | جست‌وجو | with «و» joined by ZWNJ-less hyphen form جست‌وجو |
| Filter | فیلتر | `ui.filterLabel` «فیلتر بر اساس سطح وضعیت» |
| All | همه | `ui.filterAll` |
| View section / card | رفتن به بخش / مشاهدهٔ کارت | `ui.viewSection`, `ui.viewCard` |
| Pin card | سنجاق‌کردن | `ui.pin*` |
| Download CSV | دریافت داده‌ها (CSV) | `ui.downloadCsv`, `markets.csvDownload` |
| Download calendar | دریافت تقویم (.ics) | `ui.icsDownload` |
| Language chip (fa) | فا | inline, Header |
| Keyboard shortcut | Latin key label (e.g. `A`) | `alerts.shortcut` — stays Latin, never translated |

## Context-sensitive pairs (do NOT unify)

- **هشدار** (warning chip) vs **بحرانی** (alarmed level): deliberately
  different words so the chip and the gauge label never blur.
- **نرخ بهره** (generic interest rate) vs **نرخ رسمی بهره** (RBA policy
  rate) vs **نرخ سود سپرده** (deposit rate): different concepts.
- **عادی** (status: normal) vs **معمولاً/معمول** (adverb: usually): share a
  root but different jobs.
- **غیرعادی** (status word) vs **غیرمعمول** (descriptive adjective in money
  panel sentences): the status chip always uses غیرعادی.
- **دادهٔ تازه** vs **دادهٔ به‌روز**: round 2 settled on «دادهٔ به‌روز» for
  the together panel; do not mix in new copy without a reason.

## The gold page's Iran bridge + CB demand (GPE rounds 85)

- **حباب** — THE coin premium over melt. The bridge's owned word
  (round 85): the EN side renders the gloss "premium (over melt)";
  a negative premium renders «حباب منفی» (a discount), never a
  minus-prefixed حباب.
- **دلار آزاد** — the free-market dollar (the TGJU price_dollar_rl
  leg). Established; the bridge's parity line reuses it verbatim.
- **انس جهانی** — the global (troy) ounce. The parity line's first leg.
- **آب‌شده** — the melted-gold convention (the mesghal quote's bazaar
  standard: ۴٫۶۰۸۳ گرم × عیار حدود ۰٫۷۰۵). Keep the ezafe-free
  compound «طلای آب‌شده».
- **مثقال** — the mesghal unit itself; the board row's name.
- **ارزش ذاتی** — intrinsic value (the melt value). Pairs with
  «قیمت بازار» (the market price) in the decomposition template.
- **چرخش خریدار** — the buyer rotation (the CB section's owned term
  for the 2022 episode; the EN gloss rides the annotation).
- **دنیای گزارش‌شده** — the reported world (the IMF tracker's honest
  label: the sum over reporters, never claimed as the whole world).
- **قرارداد آتی طلا در کمکس** — COMEX gold futures (the market pill's
  named reference market; کمکس is the venue's Persian-rendered name).

## The gold page's chart + TA band + on-ramp (GPE round 86)

- **تلاقی** — the 50/200 crossover. Round 86's choice over the
  incumbent's Latin loan «کراس»; «تلاقی طلایی» (golden) and «تلاقی
  نزولی» (death) keep the pair's direction words honest (طلایی is the
  market's own golden-cross word).
- **سطوح مرجع** — "reference levels", the TA zone's name (the C5
  draft word). Never «حمایت/مقاومت تضمینی» — the honesty clause rides
  the subtitle («توصیف است، نه تضمین»).
- **سطوح پیوت** — the pivot levels. TGJU's own phrase, kept verbatim
  (the C5 vocabulary rule: meet the reader where TGJU put them);
  «پیوت‌های کلاسیک روزانه/هفتگی» for the classic-only guard.
- **بازار فیزیکی** — the physical market (the Chain-7 mini-header
  grouping the SGE/Swiss/Shanghai cards).
- **حسگر، نه حکم** — the sensor-not-verdict framing family (the shared
  physical reading line + the Shanghai premium's one-liner).
- **میانگین متحرک ساده** — the SMA (TGJU's «میانگین متحرک» kept whole
  with ساده added for the honest "simple" qualifier); the row label is
  «میانگین {n} روزه».
- **صدک … از بازهٔ ذخیره‌شده** — the decile grammar over the STORED
  basis (round 86's S13-D1 posture): the basis window is named («{n}
  ماه» / «{years} سال»), never a «دهه» claim the free-tier data
  cannot support.
- **جلسه** — the trading session (the cross events' «۲۰ جلسهٔ بعدی»
  and the pivots' «از جلسهٔ {date}») — the page's established session
  vocabulary, reused for the TA family.

## The gold page's Supporting tier (GPE round 87)

- **چرخش خریدار** — the 2022 buyer rotation. The mandated R22
  annotation vocabulary (s7/01 §3), carried from the approved drafts:
  «۲۰۲۲: خریدار چرخید» the dated label, «فوریهٔ ۲۰۲۲» the freeze date.
- **خزانهٔ لندن** / **تسویهٔ لندن** — the London vault stock / the
  clearing volumes. LBMA's own institutional concepts translated
  plainly (the rider cards' names); «موجودی خزانهٔ لندن» the stock's
  full form.
- **جملهٔ اعتبارسنجی** — the KGX validation sentence (the currency
  grid's verdict line). «اعتبارسنجی» keeps the verification sense; the
  sentence states counts and directs to the rows, never a signal word.
- **کتاب معاملاتی شلوغ** — the crowded book (the crowd-gauge flag's
  phrase; the futures market's own metaphor, kept literal). Rides with
  **افق روزها تا هفته‌ها** — the days–weeks horizon, structurally
  inside every crowd line (the Chain-6 "always renders" mandate).
- **پنجرهٔ ذخیره‌شده** — the stored window (the crosses' decile basis,
  round 87 carrying round 86's S13-D1 posture forward: the window
  named per row, never a «دهه» claim the ~1-year free-tier data
  cannot support).
- **نسبت به دههٔ خودش** — "vs its decade" (the COT band chip's frame;
  the COT series genuinely carries the decade, so the word is earned
  there — unlike the crosses, where the stored-window word applies).

## The gold page's expectations + episodes (GPE round 88)

- **واحد پایه** — the basis point (bp). The expectations strip's five
  move words' own unit (the Fed-rate grammar: «افزایش ۲۵ واحد پایه»,
  «کاهش ۵۰ واحد پایه یا بیشتر», «بدون تغییر»); Persian digits
  throughout.
- **احتمال ضمن بازار** / **احتمالات ضمن بازار** — the
  market-implied probability / probabilities. The strip's wording for
  what Polymarket's prices are: the traders' own expectations,
  refreshed every 30 minutes — never a «پیش‌بینی» word (the
  disclaimer binds: «این انتظار معامله‌گرهاست، نه پیش‌بینی ما»).
- **رخداد** — the episode (the Episode Explorer's records; «نه رخداد
  از پایان برتون‌ودز تا امروز»). Deliberately distinct from
  **رویداد** — the calendar event (`calNextTitle` «رویدادهای بعدی»);
  the pair is context-locked, never unified.
- **میانگین ماهانه** — the monthly average (the WGC price workbook's
  spine, the path-extremes line's unit: «دلار بر انس، میانگین
  ماهانه»; the 1978 start named at point of use, never a daily claim
  the workbook cannot support).

## The gold page's premium history (GPE round 89)

- **نوار تفکیک حرکت روز** — the day-move decomposition strip (R30's
  headline block; the exact-identity framing — «تفکیک حسابی است، نه
  برآورد آماری (رگرسیون)» is the never-regression clause, binding
  copy per s7/01 §8).
- **اتحادِ دقیق** — the exact identity (the Δln arithmetic family:
  Δln(سکه) = Δln(انس) + Δln(دلار) + Δln(۱+حباب); the three factors
  MULTIPLY into the coin's move, never add — the anti-sum misreading
  guard rides the same sentence).
- **مِلت** — melt (the 0% premium reference line; the melt-value word
  the bridge's «ارزش ذاتی» already points at — the gold trade's own
  Persian).
- **خط صداقت** — the honesty line (the provenance pair, one sentence:
  «بازسازی‌شده از تاریخچهٔ منبع» vs «محاسبهٔ زنده از اسنپ‌شات‌های
  خودمان» — the s1/11 §6 wording pair rendered verbatim on the card).

## The gold page's Advanced tier (GPE round 90)

- **ماشین زمان** — the time machine (R31's Zone C control; the meter's
  historical surface. The era-boundary note carries the anti-synthesis
  rule in its own words: «هیچ قرائتِ پیش از آن وجود ندارد یا ساخته
  نمی‌شود»).
- **جدول رأی‌دهی** — the voter table (the versioned registry's own
  object: «زیر جدول رأی‌دهی {version} ({seats} کرسی)» — the seats are
  named at point of use, the table version rides every row).
- **بازسازی از سری‌های ذخیره‌شده** — reconstructed from the stored
  series (the backfill provenance; the live twin is «اسنپ‌شاتِ خودِ آن
  روز» — the two-row honesty story rendered at point of use, the R30
  «خط صداقت» discipline carried forward).
- **حتی اجماع هم خطا می‌کند** — even the consensus misses (R32's
  headline; the honesty device's own framing — «اجماع» is the
  analysts' consensus, the word the financial press uses, never
  «پیش‌بینی ما»).
- **گذشته‌نگری** — the retrospective (R32's own noun; «گذشته‌نگریِ
  دقتِ پیش‌بینی» — the forecast-accuracy retrospective, a
  deliberately learned compound for the honest-record zone's register).
- **اگر خریده بودید** — if you'd bought (R33's title; the
  subjunctive past the SA precedent's own grammar maps to, one
  sentence: «اگر خریده بودید»).
- **پایانیِ ماه** — the month-end close (the calculator's series unit;
  «پایانی‌های ماه {from} تا {to}» — the month-ends named on every
  result row, never a bare "monthly").
- **پنجرهٔ هم‌طول** — the same-length window (the decile framing's
  basis: «صدکِ {d} از {n} پنجرهٔ هم‌طول» — the R19 posture's own
  object, min base 30, the waiting line «صدک از {min} پنجرهٔ هم‌طول
  روشن می‌شود»).
- **خرید ماهانه** — the DCA (the SA convention named plainly:
  «{amount} دلار در هر پایانیِ ماه» — no transliterated "DCA" in
  fa copy; the Latin ticker rides only the EN sentence).

## Gold UX Redesign S3 — the content-system additions (2026-11-2x, triaged in round 91 at S5 M1)

> Recorded now so the manifest round at Session 5's integration has its
> reference (the strings enter `apps/web/src` dictionaries only then —
> `docs/gold-redesign/08-indicator-content-schema.md` §6.3 is the contract).
> No em dashes in any of these; Persian digits in static text.

**The five driver-group labels** (S3-D4; the engine lane ids stay frozen):

| English | Persian | Notes |
| --- | --- | --- |
| Interest rates & borrowing costs | نرخ بهره و هزینهٔ استقراض | The `borrowing-costs` lane; adds the plain "interest rates" anchor to the shipped «هزینهٔ استقراض» |
| The US dollar | دلار آمریکا | The `dollar` lane (unchanged family) |
| Market stress & uncertainty | تنش و عدم قطعیت بازار | The `stress` lane; names the uncertainty channel the lane measures |
| Inflation & inflation expectations | تورم و انتظارات تورمی | The `inflation` lane (unchanged family) |
| Trader positioning & flows | پوزیشن معامله‌گران و جریان‌ها | The `flows` lane; «پوزیشن» stays per the shipped corpus |

**The outlook-condition drafts** (S3-D7; owner-review wording over the
master plan §2.1 locked semantics — five states, not the shipped seven-word
outlook family):

| English | Persian |
| --- | --- |
| Conditions strongly support gold | شرایط به‌شدت از طلا حمایت می‌کند |
| Conditions moderately support gold | شرایط در حد متوسط از طلا حمایت می‌کند |
| Conditions are mixed or unclear | شرایط مختلط یا نامشخص است |
| Conditions moderately pressure gold | شرایط در حد متوسط بر طلا فشار می‌آورد |
| Conditions strongly pressure gold | شرایط به‌شدت بر طلا فشار می‌آورد |

**Evidence consistency** (S3-D7): Evidence is broadly aligned → «شواهد عمدتاً
هم‌جهت‌اند» · Evidence is mixed → «شواهد مختلط‌اند» · Evidence is limited →
«شواهد محدودند».

**Horizon labels** (S3-D7): over the next 1–2 weeks → «در ۱ تا ۲ هفتهٔ پیش
رو» · 1–3 months → «در ۱ تا ۳ ماه پیش رو» · 6–12 months → «در ۶ تا ۱۲ ماه
پیش رو». (Publish-only-what-a-method-supports governs whether any of these
ever render; none is validated today.)

**Explanation-register anchors** (the records' recurring phrasings, pinned so
the manifest round polishes consistently): «معمولاً بر طلا فشار می‌آورد»
(typically pressures gold) · «معمولاً از طلا حمایت می‌کند» (typically
supports) · «هزینهٔ فرصت» (opportunity cost, spelled out as the
give-up-a-guaranteed-return idea in the records) · «دارایی امن» (safe haven;
the established corpus term, kept) · «سوخت‌سنج بازار» (the market's fuel
gauge; the on-ramp's positioning framing, reused) · «در دامنهٔ ده‌ساله» /
«بالای دامنهٔ ده‌ساله» / «پایین دامنهٔ ده‌ساله» (the decade-range position
family, matching the shipped `evidenceHigh/Low` words).

**The lane condition words** (GUX-S5 M2, 11 §5.3 — the LaneBar's state
vocabulary, the lane's OWN condition with the impact carried by ink):
relief → «آرامش» · tight → «فشرده» (borrowing costs) · stress → «تحت
فشار» · strong → «قوی» (the dollar) · elevated → «تشدید» / «شلوغ» ·
calm → «آرام» (stress uses «تشدید/آرام»; flows uses «شلوغ/آرام» —
شلوغ matches the lane intro's own «شرط‌بندی‌های شلوغ») · hot → «داغ» ·
cool → «خنک» (inflation) · split → «مختلط ({supports}·{pressures})».

**The freshness vocabulary** (GUX-S5 M2, 11 §6.4 — the AsOfChip): as of
{time} → «تا {time}» · fresh → «تازه» · delayed → «با تأخیر» · stale →
«کهنه» · waiting → «در انتظار» · last successful → «آخرین تازه‌سازی
موفق» (the shipped pricesAsOfLastSuccessful wording, verbatim).
