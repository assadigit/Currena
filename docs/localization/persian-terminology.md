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
| Precious metals | فلزات گران‌بها | |
| Indicator | شاخص | insights page «شاخص‌های اقتصادی» |
| Indicator card one-liner | توضیح یک‌خطی | fields: `whatItIs`, `whyItMatters`, `tendedToMean`, `cantTell`, `forYou` |
| Percent sign | ٪ (Persian) | glyph, not the word |
| Gold price in A$ | قیمت طلا به دلار استرالیا | `gold-aud` |

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
