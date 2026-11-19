# Persian copy round 88 — GPE S15 P3 the expectations strip + the calendar strip + the Episode Explorer (wave 3, second session)

**Session:** S15 of the Gold Page Elevation (GPE) program — the SIXTH
Phase-D implementation session (P3, the Supporting tier, wave 3's second
session: the Zone D expectations strip R28/F24, the calendar strip R29/F25
riding the SAME insights snapshot (zero new fetches), the Zone O Episode
Explorer R25/F6 — the nine-record editorial launch; the Kalshi leg is
DELIBERATELY ABSENT per the S15-D1 wording read, so the card renders
Polymarket + the calendar). **Date:** 2026-11-19. **Branch:**
`gold-elevation/p3-expectations` (off the S14 close `c47f4c3e`).
**Round:** 88 (continues from round 87, the GPE S14 wave-3 first session).

This round records the session's Persian-copy decisions in ONE round
(the S10–S15 single-round pattern): R28's expectations strip (the
trader-expectations framing — «فقط نمایش» the display-only word, the
five move words, the honest disclaimer, the Polymarket venue
attribution with the 30-minute refresh, the mismatch rule that renders
both sources separately rather than a wrong join) · R29's calendar
strip (the next-events title; the three zone words named at point of
use per the GPE-S3-10 lesson — the feed carries dates + zones, never
clock times) · R25's Episode Explorer (the nine records'
titles/annotations/interpretations/family readings/sources — the
s7/03 §3.2 launch list; the hasData honesty flag's shared no-data
sentence; the meter-era boundary note; the drop-gated honest waiting
states). The wording was reviewed in-session against the binding copy
rules (s6/02 C1–C7; the s7/02 + s7/03 §3.2 approved drafts as
reference wording; no em dashes in fa copy — verified over the whole
new block; Persian digits throughout; the honest-limits content binds:
no record shows a historical «حکم», the 37-factor composite is named
as existing only from 2016, a family without a covering series says
so, and the price path + comparison wait for the WGC workbook drop).

## The 140 NEW fa strings

All 140 are NEW; none CHANGED. 26 ride the expectations/calendar block
(`pd.gold.expect*` + `pd.gold.cal*`), 114 the episodes' editorial block
(`pd.gold.ep*`: 32 chrome + 67 record strings + 15 source names).

### R28 / F24 — the Zone D expectations strip (19)

- `expectTitle` «بازار چه انتظاری دارد» · `expectSubtitle` «جلسهٔ بعدی
  فدرال رزرو با قیمت‌های خودِ معامله‌گرها؛ فقط نمایش.» — the
  market's own expectations, never the site's forecast.
- `expectTopLine` «بعدی: فدرال رزرو {date} · احتمال {move}: {pct}» +
  `expectTopLineNoMarket` (the honest no-market state).
- The five move words («واحد پایه» the unit, Persian digits):
  `expectMoveHike50plus` «افزایش ۵۰ واحد پایه یا بیشتر» ·
  `expectMoveHike25` «افزایش ۲۵ واحد پایه» · `expectMoveHold` «بدون
  تغییر» · `expectMoveCut25` «کاهش ۲۵ واحد پایه» ·
  `expectMoveCut50plus` «کاهش ۵۰ واحد پایه یا بیشتر».
- `expectEventLine` «بازار: {title} · تا {date} تعیین تکلیف می‌شود»
  (the market settles — never a verdict word) · `expectVenue` «منبع:
  Polymarket؛ احتمالات ضمن بازار، هر ۳۰ دقیقه تازه می‌شود.».
- The honesty family: `expectDisclaimer` «این انتظار معامله‌گرهاست،
  نه پیش‌بینی ما.» · `expectAsOf` «تا {date}، ساعت {time} UTC» ·
  `expectRollNote` · `expectMismatchNote` (the ±45-day rule) ·
  `expectUnavailable` (the calm fail-closed line) · the toggles
  `expectShow` / `expectHide` · `expectLink` «دیدن بازار ↗».

### R29 / F25 — the calendar strip (7)

- `calNextTitle` «رویدادهای بعدی» — «رویداد» kept for calendar events
  (the page's established word), deliberately distinct from «رخداد»
  the Episode Explorer's records.
- The zones named at point of use (GPE-S3-10): `calZoneNY` «به وقت
  نیویورک» · `calZoneFrankfurt` «به وقت فرانکفورت» · `calZoneSydney`
  «به وقت سیدنی».
- The day family: `calDaysAway` «{n} روز دیگر» · `calToday` «امروز»
  · `calTomorrow` «فردا».

### R25 / F6 — the Episode Explorer (114)

- The chrome (32): `epTitle` «طلا در تاریخ» · `epSubtitle` «نه رخداد
  از پایان برتون‌ودز تا امروز؛ سابقهٔ صادق: زنجیره‌ها چه کردند، نه
  حکم تاریخی.» · the toggles `epShow` / `epHide` · `epMeterEraNote`
  — the meter-era boundary (the 37-factor composite exists only from
  2016; before it the chains teach, after it the record says what the
  state was, never «باید چه می‌بود») · `epLivingBadge` «زنده» +
  `epLivingNote` (the 2024 record's dated-edit discipline, never
  silent rewriting) · `epFamilyNoData` «برای این خانواده در این
  دوره سری داده‌ای نیست.» (the hasData flag's shared sentence —
  never a guess) · the six family labels `epFam*` (هزینهٔ قرض، دلار،
  استرس، تورم، جریان‌ها، تقاضای بانک‌های مرکزی) · the sources
  chrome (`epSourcesTitle`, `epLicenceL1` public domain,
  `epLicenceL2` attribution required, `epLinksTitle` the out-bound
  links) · the drop-gated waiting pair `epPathWaiting` +
  `epComparisonWaiting` (the WGC workbook named, nothing drawn until
  the drop, no interim spine) · `epPathExtremes` / `epPathSource`
  («میانگین ماهانه» the spine's unit, the 1978 start named) · the
  window words `epWindow1y/5y/10y/20y` + `epWindowNoData` «تاریخچهٔ
  ذخیره‌شده کافی نیست» · `epSinceTitle` «از پایان این رخداد» +
  `epPastReturnsNote` «بازده گذشته تضمینی برای آینده نیست.» ·
  `epPeriodNow` «تا امروز».
- The nine records (67): each record's `Title` / `Annotation` /
  `Interpretation` / `Fam*` readings — «پایان برتون‌ودز» (1971),
  «اوج ولکر» (1980), «کف براون» (1999), «بحران مالی» (2008), «سقف
  دوران تسهیل‌کمی» (2011), «تشنج کاهش تدریجی» (2013), «کرونا»
  (2020), «چرخش تحریمی» (2022), «صعود و اصلاح» (2024, the living
  one). One interpretation example (`ep2022Interpretation`): the
  February 2022 reserve freeze nearly doubled official-sector buying
  — a price-insensitive buyer that lifted the floor and broke the old
  real-yields rule; the March ~2070 top and the September ~1615 low
  while real yields passed +1.5%; closes on the meter-era posture
  («وضعیت واقعاً چه بود، نه چه باید می‌بود»).
- The source names (15): `epSrc*` — named as what they are (the US
  Treasury's official gold-price chronology with the 35/38/42.22
  steps, the Fed's October 1979 policy-change record, the documented
  extremes per record, the BoE auction announcements 1999–2002, the
  Washington Agreement on Gold, TIPS real-yield history, the WGC
  demand series).

## Terminology (the glossary entries this round adds)

- «واحد پایه» — the basis point (bp). The five move words' unit; the
  Fed-rate grammar with Persian digits («افزایش ۲۵ واحد پایه»).
- «احتمال ضمن بازار» / «احتمالات ضمن بازار» — the market-implied
  probability/probabilities. The strip's wording for what Polymarket's
  prices are — the traders' expectations, refreshed every 30 minutes;
  never a «پیش‌بینی» word (the disclaimer binds).
- «رخداد» — the episode (the Episode Explorer's records; «نه رخداد
  از پایان برتون‌ودز تا امروز»). Deliberately distinct from
  «رویداد» (a calendar event, `calNextTitle`); the pair is
  context-locked.
- «میانگین ماهانه» — the monthly average (the WGC price workbook's
  spine, the path-extremes line's unit: «دلار بر انس، میانگین
  ماهانه»; the 1978 start named at point of use).

## Decisions

- No em dashes in the fa copy (verified over the whole new block; the
  «؛» semicolon and the «·» middot carry the pauses, per the repo
  rule).
- The honest-limits content binds structurally: the hasData shared
  no-data sentence, the meter-era note, the drop-gated waiting states,
  the past-returns note — none may be softened into a claim the data
  cannot support (S15-D4: no interim price spine; the fail-closed
  rule wins over a partial render).
- The expectations strip never predicts: «فقط نمایش» in the subtitle,
  the disclaimer in the footer, «تعیین تکلیف می‌شود» for what the
  market settles; the mismatch rule renders both sources separately
  rather than a wrong join.
- The episode records are history, not verdicts: every interpretation
  closes on what the chains did; the meter-era note names the 2016
  boundary; the 2024 record is the only living one and says so with
  dated edits.
- Latin tickers/names stay Latin (Polymarket, WGC, TIPS, VIX, S&P);
  every EN twin shipped in the same commit (S15-D7: all editorial
  text lives in the `pd.gold` dictionaries, the typed records carry
  structure only).
