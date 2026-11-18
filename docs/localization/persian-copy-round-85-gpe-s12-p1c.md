# Persian copy round 85 — GPE S12 P1-c the prizes (wave 1's second half)

**Session:** S12 of the Gold Page Elevation (GPE) program — the THIRD
Phase-D implementation session (P1-c, the prizes: Bridge-1 + the
CB-demand section, wave 1's second half). **Date:** 2026-11-18.
**Branch:** `gold-elevation/p1c-prizes` (off the S11 close `aae44dda`).
**Round:** 85 (continues from round 84, the GPE S11 P1-b explanation
band).

This round records the Persian-copy decisions for the session's rows in
ONE round, per the session plan (the S10/S11 single-round pattern):
R13's bridge lines + the حباب grammar + the four-move interpretation
paragraph · R14's tracker labels + the 27 country names · R16's pill
words. R15 (the GDT stack) slipped to P2 — no strings. R17 (the de-dup)
retired zero keys (the lane intro + tally keys stay in active use by
the hero's classic stage + the Signals ledger rows + the narrative).
The wording was reviewed in-session against the binding copy rules
(s6/02 C1–C7, the s7/01 §8 four-move grammar) and the terminology
glossary; no em dashes in fa copy; Persian digits throughout.

## The ninety-eight NEW fa strings

All 98 are NEW (zero changed, zero removed — the session touched no
existing fa string).

### R13 / F3a — the Iran bridge (41 + the board name)

The FA copy owns the market's own words: **حباب** (the coin premium —
the EN renders the gloss "premium over melt"), **دلار آزاد** (the
free-market dollar), **انس جهانی** (the global ounce), **آب‌شده**
(the melted-gold convention), **مثقال** (the mesghal unit). The C2
four-part grammar binds the block: the formula stated
(«ارزش ذاتی = انس جهانی × دلار آزاد × عیار خالص»), the decomposition
shown with both legs (the parity template names the toman-per-ounce
intermediate: «انس جهانی {ounce} دلار × دلار آزاد {dollar} تومان =
{perOunce} تومان به‌ازای هر انس»), the as-of stamped per row (TGJU's
own marketAt, Jalali at render), and the divergence taught (the
three-numbers-in-one-hour exhibit, dated ۲۰۲۶-۱۱-۱۷, attributed, the
wording documents and never mocks).

- `gold.gold-mesghal` — «مثقال» (the board row; the melt-gold weight
  unit joins the shared snapshot plane this session).
- `pd.gold.bridgeTitle` — «پل ایران» (the zone name, s6/01 zone F).
- `pd.gold.bridgeSubtitle` — the one-line decomposition sentence.
- The board chrome: `bridgeHeadPrice` «قیمت بازار» · `bridgeHeadPremium`
  «حباب» · `bridgePremiumShort` «حباب {v}» · `bridgeDiscountShort`
  «حباب منفی {v}» (a negative premium renders as a DISCOUNT — the
  honest signed word, never a minus-prefixed حباب) ·
  `bridgeMillionToman` «{v} میلیون تومان».
- The parity + decomposition templates (C1: every input named):
  `bridgeParityOunce` · `bridgeDecompLine` («← ارزش ذاتی … · بازار … ←
  حباب …» — the reader reproduces the arithmetic).
- The expand/collapse affordances: `bridgeRowExpand/Collapse`
  «نمایش/بستن برابری» · `bridgeShowMethod/HideMethod` «روش محاسبه/
  بستن روش» · `bridgeShowInterpretation/HideInterpretation`
  «معنای این جدول/بستن تفسیر».
- The method block (C2 rule 1): `bridgeMethodTitle` +
  `bridgeFormula` + `bridgeConstantsTitle` «طلای خالص هر ابزار
  (مشخصات ضرب بانک مرکزی)» + the four column heads +
  `bridgeGrams` «{v} گرم» + the three notes: `bridgeGeramiBandNote`
  (the ۰٫۹۰ تا ۰٫۹۲ g band, the pending pin, the ±۰٫۵٪ ambiguity —
  the s8/02 §2b fallback band, disclosed) · `bridgeMesghalNote`
  (the آب‌شده convention: ۴٫۶۰۸۳ گرم × عیار حدود ۰٫۷۰۵ ≈ ۳٫۲۴۹ گرم
  طلای خالص) · `bridgeVariantNote` (the CBI-primary ۸٫۱۳۶ گرم with
  the ۸٫۱۳۳ variant ۰٫۰۴ درصد apart).
- The four moves (s7/01 §8, binding order): `bridgeInterp1` (the
  decomposition taught + the Bridge-1 bound: today's answer needs two
  snapshots; the card decomposes the level, not the day's move) ·
  `bridgeInterp2` (the premium as a market-structure reading; the
  dated regime examples — «تاریخِ تاریخ‌دار است، نه پیش‌بینی») ·
  `bridgeInterp3` (the divergence lesson: TGJU ۷٫۸۸ / this method
  ۸٫۰۸ / the union press ۵٫۹۹ میلیون تومان; «رقبا حباب را بدون سند
  چاپ می‌کنند؛ عدد این کارت از فرمول اعلام‌شده بازتولیدشدنی است و
  تمام ادعا همین است») · `bridgeInterp4Pre` + `bridgeInterp4Post`
  (the Chain-2 close: the fragment wraps the name-matched link to the
  dollar lane «مسیر {دلار}» — anchors never invented).
- The attribution + states (C6's TGJU row): `bridgeSourceNote`
  «منبع: TGJU» · `bridgeRevisionNote` · `bridgeStaleNote` ·
  `bridgeNoParity` (one leg missing — the quotes still TGJU's own) ·
  `bridgeUnavailable` · `bridgeSnapshotNote` «اسنپ‌شات تهران ساعت
  {time} به UTC».

### R14 / F2a — the central-bank demand tracker (33 + 27 country names)

The reported-world honesty in every line (the S4-D4 labelling rule +
C6's IMF row + C7 rule 3); display-only (the governance sentence says
so once); «چرخش خریدار» carries the EN gloss at the annotation.

- The section + chart: `cbTitle` «تقاضای بانک‌های مرکزی» ·
  `cbSubtitle` · `cbChartTitle` «خرید خالص جهانی، ۱۲ ماه متحرک» ·
  `cbChartReportedWorld` «دنیای گزارش‌شده» (the honest label riding
  the caption — never claimed as the whole world) · `cbChartUnit`
  «تن در سال» · `cbAsOf` «داده‌ها تا {month}».
- The three dated episodes (the S12-D5 record — the annotations render
  the data's truth; the spec's pre-data "2014–2018 flip" phrase does
  not match the reported-world series): `cbEpGfc` «۲۰۰۹ تا ۲۰۱۱: موج
  پس از بحران مالی؛ فروش به خرید رسید» · `cbEpCatchup` «۲۰۱۵:
  به‌روزرسانی شش‌سالهٔ چین در یک ماه فرود آمد» (the step the chart
  shows is the catch-up PRINT, taught as such) · `cbEpRotation` «۲۰۲۲:
  چرخش خریدار» · `cbCurrentPace` «اکنون».
- The buyers table: the five column heads + `cbTonnesShort` «{v} تن» ·
  `cbSharePct` «{v}٪» + `cbShareNote` (the S12-D1 method in words:
  gold re-valued at the live price; «سهمِ در حال رشد می‌تواند حسابِ
  قیمت باشد، نه خرید فعال» — the C7-rule-3 caveat).
- The honest exceptions: `cbReportedWorldLine` «دنیای گزارش‌شده:
  {tonnes} تن در {n} گزارش‌دهنده؛ نه کل جهان.» · `cbMethodTitle` +
  `cbMethodLine` (the IL/IRFCL merge named; the aggregates + the BIS
  banking book + broken rows excluded — the session's additions) ·
  `cbRevisionNote` «داده‌های ماهانه بازنگری می‌شوند؛ بعضی خریداران
  با تأخیر گزارش می‌دهند.» (C6's IMF row verbatim requirement) ·
  `cbChinaNote` (China's reporting pattern taught) · `cbWgcLink`
  «جدول‌های مرتب‌شدهٔ شورای جهانی طلا» (the curated cross-reference)
  · `cbGovernanceNote` «این بخش فقط نمایشی است: داستان تقاضا را
  روایت می‌کند و در برآیند بالا رأی ندارد.» · `cbCaveat` «تقاضای
  بانک‌های مرکزی کُند، تکه‌تکه، با تأخیر و بازنگری‌شونده است؛
  فصل‌ها را توضیح می‌دهد، نه هفته‌ها را.» (the not-a-floor caveat,
  standing).
- The mirror framing (s6/01 §2b): `cbMirrorPre` + `cbMirrorPost` — the
  fragment wraps the name-matched link to the usd-reserve-share seat
  («دید آینه‌ای: سهم رو به رشد دلار از ذخایر ارزی، عامل بازدارندهٔ
  طلاست؛ ببینید {کارت}»). · `cbUnavailable`.
- The 27 country names (`cbCountries.*`): the standard Persian names
  (لهستان، چین، ازبکستان، قزاقستان، چک، برزیل، مالزی، اردن،
  استرالیا، قرقیزستان، صربستان، کامبوج، اندونزی، جمهوری آذربایجان،
  گرجستان، گواتمالا، فیلیپین، مصر، عراق، هند، ترکیه، قطر، روسیه،
  امارات، ارمنستان، سنگاپور، ایرلند) — the buyers table's current
  cast; an unmapped IMF code renders the code itself (technical,
  fail-closed, never a guessed name).

### R16 / F16b — the market-state pill (3)

- `marketPillOpen` «بازار باز است» · `marketPillClosed` «بازار بسته
  است» · `marketPillLabel` «{state} · قرارداد آتی طلا در کمکس،
  نیویورک ({tz})» — the reference market + its timezone named AT POINT
  OF USE (the GPE-S3-10 lesson, binding); «کمکس» is the market's own
  Persian-rendered name (COMEX), «قرارداد آتی طلا» the instrument.

## Terminology entries

Round 85 adds to `persian-terminology.md`: حباب (the coin premium over
melt — the bridge's owned word, EN gloss "premium"), دلار آزاد (the
free-market dollar — existing), آب‌شده (the melted-gold convention),
مثقال (the mesghal unit), چرخش خریدار (the buyer rotation — the CB
section's owned term), دنیای گزارش‌شده (the reported world — the
honest-label pattern), and the pill's قرارداد آتی طلا در کمکس.

**Counts:** 98 NEW · 0 CHANGED · 0 REMOVED. The manifest moves
8,032 → 8,130 entries; `pnpm copy:audit` exits 0 clean after the
update.
