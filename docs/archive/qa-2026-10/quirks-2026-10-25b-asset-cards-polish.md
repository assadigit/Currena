# QA — 2026-10-25b asset-cards polish: Persian copy review basis

The round: the owner's asset-cards polish task (title/unit header,
one-line price + currency, semantic detail sections, verified instrument
notes). This document is the review basis for the round's Persian copy
(the `persian-copy-manifest.json` round-51 entries reference it).

Review method: every string was written against the task's own Persian
examples where given (its §4/§6/§9 tables are quoted verbatim below),
checked for ZWNJ (نیم‌فاصله) correctness, hamze forms (محدودهٔ), and
consistency with the card corpus's established vocabulary
(«هفت روز گذشته», «تغییر روزانه», «{pct} پایین‌تر از میانگین ۲۰۰ روزهٔ
خود»). No string repeats a number the card already shows, and none
makes a causal or predictive claim.

## New strings

| Key | Text | Basis |
|---|---|---|
| `ui.priceCardTitles.*` | قیمت طلا / قیمت نقره / قیمت نفت برنت / قیمت بیت‌کوین | Task §4's own example («قیمت طلا»); plain names, no tickers, no unit inside the title |
| `ui.priceCardUnits.gold-usd`, `-silver` | هر اونس تروی | Task §6's table, verbatim; «اونس تروی» is the established Persian for troy ounce |
| `ui.priceCardUnits.brent` | هر بشکه | Task §6's table, verbatim (Brent quoted per barrel) |
| `ui.priceCardUnits.btc-usd` | هر بیت‌کوین | Task §6's table, verbatim (ZWNJ in بیت‌کوین) |
| `ui.sectionChanges` | تغییرات قیمت | Task §9A's heading, verbatim |
| `ui.section52w` | محدودهٔ قیمت در ۵۲ هفتهٔ گذشته | Task §9B's heading, verbatim (hamze on محدودهٔ) |
| `ui.sectionRecords` | سوابق تاریخی قیمت | Task §9C's heading, verbatim |
| `ui.sectionReferences` | جایگاه قیمت نسبت به شاخص‌های مرجع | Task §9D's heading, verbatim |
| `ui.sectionSource` | منبع داده و زمان به‌روزرسانی | Task §9E's heading, verbatim |
| `ui.priceBelow10yHigh` | {pct} پایین‌تر از بیشترین قیمت ۱۰ سال اخیر | Same construction as the reviewed `ui.ma200Below` («{pct} پایین‌تر از میانگین ۲۰۰ روزهٔ خود»); the distance sign rides in the wording, the placeholder takes the magnitude |
| `ui.priceFuturesNote` | قیمت نمایش‌داده‌شده، قرارداد آتی با نزدیک‌ترین سررسید است، نه قیمت نقدی. | Standard Persian futures terminology (قرارداد آتی; front-month = نزدیک‌ترین سررسید). Rendered ONLY when the served attribution is a futures quote (task §10) |
| `ui.priceBrentBlendNote` | سری برنت بر پایهٔ قیمت نقدی EIA است و پس از آخرین تاریخ انتشار، با قرارداد آتی BZ=F ادامه یافته است. | Describes the actual EOD Brent series (EIA spot ∪ BZ=F gap-fill — `packages/insights/src/adapters/derived.ts`); rendered only for Brent's blended EOD attribution |
| `ui.priceFetchedAt` | زمان دریافت قیمت: {time} | The app's fetch time, distinct from the observation date (task §9E's "distinguish the observation timestamp from the application's fetch time") |
| `ui.btcCompanions` | با قیمت فعلی، یک بیت‌کوین معادل {gold} اونس طلا یا حدود {silver} اونس نقره است. | One sentence joining the two previously separate ratio lines — fa's second ratio («یا حدود {value} اونس نقره است») was a continuation fragment that read broken as its own bullet |

## Changed strings

| Key | Was | Now | Basis |
|---|---|---|---|
| `ui.change30dLabel` | ۳۰ روز | ۳۰ روز گذشته | Task §9A: one consistent «X گذشته» label family (matches the reviewed «هفت روز گذشته») |
| `ui.change90dLabel` | ۹۰ روز | ۹۰ روز گذشته | Same |
| `ui.stat6mChange` | تغییر ۶ ماهه | ۶ ماه گذشته | Same — the old family mixed «تغییر X» and bare «X روز» forms |
| `ui.stat1yChange` | تغییر ۱ ساله | ۱ سال گذشته | Same |
| `ui.statRecordHigh` | بیشترین مقدار تاریخی | بیشترین قیمت ۱۰ سال اخیر | Task §9C: the record is the 10-YEAR window's peak (`computePeaks` reads the 10-year Yahoo histories; Brent's series is capped to the same window) — «تاریخی» claimed all-time coverage the data does not have |

## Technical literal

The round reuses the already-triaged locale percent glyph `٪` (the
`fromRecord` placeholder joins it exactly as the reviewed `ma200`
interpolation in the same file does — kind `technical`, round-49/50
precedent).

## English mirror

Every key above carries its en mirror in `insights-copy-en.ts`
(`priceCardTitles`, `priceCardUnits`, `sectionChanges`, `section52w`,
`sectionRecords`, `sectionReferences`, `sectionSource`,
`priceBelow10yHigh`, `priceFuturesNote`, `priceBrentBlendNote`,
`priceFetchedAt`, `btcCompanions`, and the five relabelled keys) —
en/fa parity is enforced by the audit's MISSING-TRANS check and the
compile-time `InsightsCopy` shape.
