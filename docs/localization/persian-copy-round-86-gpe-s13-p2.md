# Persian copy round 86 — GPE S13 P2 the interactive chart + the TA band + the on-ramp + the one-liners (wave 2)

**Session:** S13 of the Gold Page Elevation (GPE) program — the FOURTH
Phase-D implementation session (P2, wave 2's first session: the
interactive chart, the TA band, the education on-ramp, the one-liners).
**Date:** 2026-11-18. **Branch:** `gold-elevation/p2-chart-ta` (off the
S12 close `2e22c428`). **Round:** 86 (continues from round 85, the GPE
S12 P1-c prizes).

This round records the Persian-copy decisions for the session's rows in
ONE round (the S10–S12 single-round pattern): R18's interactive chart
chrome (the unit-aware header, the pan/zoom/log toggles, the DMA overlay
words, the honest-span chips) · R19's TA band (the C5 honesty copy, the
TGJU vocabulary «سطوح پیوت»/«حمایت»/«مقاومت», the decile grammar over
the stored basis) · R20's education on-ramp (the five drivers + the two
notes + the six-question FAQ — the s7/02 approved drafts are the
reference wording, D1 locked; the round polishes) · R21's one-liners
(the 13 plain meaning sentences + the Chain-7 «بازار فیزیکی» shared
line). The wording was reviewed in-session against the binding copy
rules (s6/02 C1–C7; the C5 honesty rules for the TA family; no em dashes
in fa copy; Persian digits throughout).

## The ninety-three NEW fa strings

All 93 are NEW (zero changed, zero removed — the session touched no
existing fa string; the GB-S6 snapshot re-pin is a markup change, not a
copy change).

### R18 / F7 — the interactive chart (15)

- The series line named at point of use (C1): `chartSeriesLine` «OHLC
  روزانهٔ XAUUSD (نقطه‌ای) · EODHD» — the EN renders "(spot)" as the
  honest instrument word; the fa carries «نقطه‌ای» (spot), the market's
  own distinction from the futures feed the hero price uses.
- The unit toggle: `chartUnitLabel` «واحد قیمت» · `chartUnitOz` «انس» ·
  `chartUnitGram` «گرم» · the tooltip suffixes `chartUnitOzShort` «بر
  انس» · `chartUnitGramShort` «بر گرم» · the disclosed conversion
  `chartGramNote` «هر انس تروا = ۳۱٫۱۰۳۵ گرم» (C1: the conversion
  stated where the gram unit is chosen).
- The scale + overlays: `chartLog` «لگاریتمی» · `chartSma50` «میانگین ۵۰
  روزه» · `chartSma200` «میانگین ۲۰۰ روزه» — the TGJU vocabulary the
  C5 rule mandates (the same words the TA band uses — one vocabulary,
  no parallel copy).
- The honest-span window words: `chartRangeAll` «همه» ·
  `chartSpanMonths` «{n} ماه» · `chartSpanYears` «{years} سال» — the
  All chip and the window delta name the span the loaded series
  ACTUALLY carries (the #01 grammar, now over the unbounded OHLC
  series; the words self-correct as the stored series grows).
- The a11y + affordance: `chartAria` «قیمت روزانهٔ XAUUSD، نمودار
  تعاملی: {span} تا {date}» · `chartPanHint` «برای جابه‌جایی بکشید ·
  برای بزرگ‌نمایی پینچ کنید یا اسکرول کنید» (the #17 lesson applied
  forward).

### R19 / F8 — the minimal TA band (33)

- The zone header + the honesty label (C5 rules 1 + 4): `taTitle`
  «سطوح مرجع» (the s6/02 C5 draft word) · `taSubtitle` «توصیف‌اند، نه
  تضمین؛ و هرگز سیگنال معاملاتی نیستند.»
- The series named at the table header (C1, the anti-GPE-S3-04 clause):
  `taSeriesNote` «میانگین متحرک سادهٔ ۲۰/۵۰/۱۰۰/۲۰۰ روزهٔ پایانی
  روزانهٔ XAUUSD، EODHD».
- The SMA family: `taSmaTitle` «چهار میانگین متحرک استاندارد» (the
  deliberate-subset word — «چهار بازهٔ استاندارد» without implying the
  others exist, the classic-only guard's copy side) · the shared
  one-liner `taSmaOneLiner` (the s7/02 §2.3 draft verbatim — «توصیف است،
  نه تضمین») · `taSmaRow` «میانگین {n} روزه» · the honest short-window
  state `taSmaNone`.
- The distance-decile grammar (C5 rule 3, the S13-D1 honest basis):
  `taDistance` «{pct} {dir} میانگین ۲۰۰ روزهٔ XAUUSD؛ {decile} از
  بازهٔ ذخیره‌شدهٔ {window}» — the basis window named, never a "دهه"
  the free-tier data cannot support; `taDistanceNoDecile` (the honest
  too-short state) · `taDirAbove` «بالاتر از» · `taDirBelow` «پایین‌تر
  از» · `taDecile` «صدک {n}» · the chart cross-link `taChartLink`
  «نمودار را ببینید».
- The cross events (C5 rule 2 — dated events, never signals):
  `taCrossTitle` «تلاقی ۵۰ و ۲۰۰ روزه؛ رویدادهای تاریخ‌دار» · the
  one-liner (the s7/02 draft, «برگشت‌های کاذب هم شامل») ·
  `taCrossGolden` «تلاقی طلایی (۵۰ بالای ۲۰۰)» · `taCrossDeath`
  «تلاقی نزولی (۵۰ زیر ۲۰۰)» — «تلاقی» (the market's own crossover
  word; «کراس» is the Latin loan the incumbent uses, «تلاقی» is the
  cleaner Persian) · `taCrossFollow` «سپس {v} در ۲۰ جلسهٔ بعدی»
  («جلسه» — the page's existing session vocabulary) · the truncated
  edge state · `taCrossNone`.
- The classic pivots (the TGJU vocabulary «سطوح پیوت»): `taPivotsDailyTitle`
  «پیوت‌های کلاسیک روزانه» · `taPivotsWeeklyTitle` «پیوت‌های کلاسیک
  هفتگی» · the two one-liners (the s7/02 §2.3 drafts verbatim) ·
  `taPivotSupport` «حمایت» · `taPivotResistance` «مقاومت» ·
  `taPivotFrom` «از جلسهٔ {date}» (the source bar's date disclosed) ·
  `taPivotNone` · the show/hide toggles + `taUnavailable`.

### R20 / F4a — the education on-ramp (34)

- The accordion chrome: `onRampTitle` «چه چیزی طلا را حرکت می‌دهد» ·
  `onRampSubtitle` · the toggle words · `onRampSeeCards` «کارت‌های
  سنجش:».
- The five drivers (the s7/02 §1.1–§1.5 FA drafts, polished): the
  mechanism → the honest limits → the LIVE close («امروز این عامل را
  خانوادهٔ … می‌سنجد؛ {count} عامل از ۳۷، وضعیت فعلی: {laneWord}» —
  the {count} + {laneWord} interpolate from the projection, never
  hand-copied; pinned by test to the hero's own numbers). The 2022-break
  clause (driver 1), the persistence clause (driver 2), the two famous
  breaks (driver 3), the display-only governance close (driver 4 —
  «فعلاً» carried honestly), the two safe-haven channels (driver 5) —
  each the chain's exception stated inline (s7/01 rule 2).
- The two closing notes (§1.7–§1.8): `noteFuelTitle` «پوزیشن‌دهی سوخت
  است، نه راننده» (Chain 6's mandated treatment) · `noteFuelBody` ·
  `noteGovTitle` · `noteGovBody` (the governance asymmetry taught as
  education — the differentiator Kitco cannot copy).
- The FAQ tail (§3, the six questions): the questions verbatim from the
  s7/02 drafts; the answers ≤3 sentences each, every close on its
  anchor (Q1 the inflation lane · Q2 the F5 card + Zone K · Q3 the
  gold-aud card, the honest degrade until R26 · Q4 the honest record ·
  Q5 the bridge · Q6 the seats).

### R21 / F4b — the one-liners + the physical grouping (15)

- The 13 plain meaning sentences (the s7/02 §2.1–§2.2 drafts verbatim,
  complete against the non-hero card ids) — each one line under the
  card's value, no number restated, no forecast; the COT mid-range
  lesson («نقاط افراطی … وسط بازه حرف چندانی نمی‌زند») and the
  sensor-not-verdict premium framing ride their own sentences.
- The Chain-7 physical grouping: `physicalHeader` «بازار فیزیکی» (the
  mini-header, s7/01 §7) + `physicalLine` — the ONE shared reading line
  (renders once under the header, not per card): «حق‌بهای پایدار،
  فازهایی را نشان می‌دهد که تقاضای فیزیکی (عمدتاً آسیایی) خریدار
  مرزی است؛ تخفیف، فازهای رهبری‌شده توسط سرمایه‌گذاری غربی را.»

## Terminology (the glossary entries this round adds)

- «تلاقی» — the 50/200 crossover (cleaner than the incumbent's «کراس»
  loan-word; «تلاقی طلایی/نزولی» for golden/death).
- «سطوح مرجع» — the TA zone's honest name (the C5 draft word —
  "reference levels", never "support/resistance guarantees").
- «پیوت» — the pivot levels (TGJU's own word, kept; «سطوح پیوت» the
  phrase the Persian reader knows).
- «بازار فیزیکی» — the physical market (the Chain-7 grouping's header).
- «حسگر نه حکم» — the sensor-not-verdict framing family (the shared
  physical line's grammar; matches the Shanghai premium's one-liner).

## Decisions

- The wording follows the s7/02 reference drafts (D1 locked: the
  structure and honest-limits content bind; the rounds polish) — the
  polish pass kept the drafts' own vocabulary, tightened two sentences,
  and normalized the digits to Persian throughout.
- The honest-span grammar: the window words state the spans the stored
  series carries («{n} ماه» / «{years} سال» — computed at render); the
  free tier stores ~14 months today, so no «دهه» (decade) claim exists
  anywhere in the new copy (S13-D1's posture, carried in the wording).
- No em dashes in fa copy (the «؛» semicolon and the «·» middot carry
  the pauses, per the repo rule).
