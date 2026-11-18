# Persian copy round 84 — GPE S11 P1-b the explanation band (wave 1)

**Session:** S11 of the Gold Page Elevation (GPE) program — the SECOND
Phase-D implementation session (P1-b, the explanation band, wave 1).
**Date:** 2026-11-18. **Branch:** `gold-elevation/p1b-explanation-band`
(off `gold-elevation/p1a-credibility-floor` `ec57261e`, the S10 close).
**Round:** 84 (continues from round 83, the GPE S10 P1-a wave-0 floor).

This round records the Persian-copy decisions for the six wave-1 rows
R07–R12 (s8/01 §2) in ONE round, per the session plan. Per the CP-C
record §4's pre-flight + D1 locked A (the s7/02 + s6/02 drafts are the
approved reference wording — the round polishes; the structure and
honest-limits content bind), the wording was reviewed in-session against
the approved drafts and the terminology glossary; no em dashes in fa
copy. R07 (the Treasury-direct yield switch) touched zero copy — its
strings are the source-name lines the readings carry (English technical
provenance, not fa copy).

## The fifty-seven fa strings (22 CHANGED + 35 NEW)

### CHANGED — reviewed text drifted (needs-review → processed)

**R08 / F15 — the outlook conditions grammar (17, C3's four clauses):**

- **`pd.global.goldOutlookLabel`** (`fa.ts`) — «چشم‌انداز طلا» →
  «چشم‌انداز شرایط» (clause 1: the noun re-scopes from "gold" to
  "conditions"; the line never reads "gold outlook").
- **`signals.verdictTitle`** (`insights-copy-fa.ts`) — «چشم‌انداز» →
  «چشم‌انداز شرایط» (the same clause 1 re-scope on the section word).
- **`signals.collapsedVerdict`** (`insights-copy-fa.ts`) —
  «چشم‌انداز: {verdict}» → «چشم‌انداز شرایط: {verdict}» (clause 1 +
  clause 3: the collapsed line keeps the derivation's frame).
- **`signals.verdictStates.{bearish,bullish,mixed,neutral,range-bound,
  strong-bearish,strong-bullish}.{gold,silver}`** (14, `insights-copy-fa.ts`)
  — the forecast-adjacent family GPE-S2-11 flagged, re-worded to the
  conditions grammar: «نشانه‌ها حاکی از احتمال افت قیمت طلاست.» →
  «شرایط به زیان طلا متمایل است.» (and the seven parallel states ×
  gold/silver). Clause 2: the no-forecast line «این توصیف شرایط فعلی
  است، نه پیش‌بینی» now co-renders in the same visual unit (the new
  `verdictCaveat` keys below). Clause 4: every intensifier
  («قابل‌توجه», «سنگین») is gone — strength rides the existing
  strong/moderate ladder alone («به‌وضوح» on the two strong states is
  the ladder's own adverb, not a decline intensifier).

**R09 / F13 — the licence wall sharpened (5, C7 rule 5 + #22):**

- **`pd.gold.blockedTitle`** — «منتشر نمی‌شود — محدود به مجوز یا منبع
  داده» → «منتشر نمی‌شود: محدود به مجوز یا منبع داده» (the em dash
  retired per the C7 rule 1 no-em-dash rule; the colon carries the
  same rhythm).
- **`pd.gold.blockedWgcEtf`** — the per-item why (the WGC licence class
  requires prior written authorisation) + the owner's lever (the
  authorisation letter to info@gold.org, drafted and ready to send).
- **`pd.gold.blockedWgcCb`** — the same gate named compactly + the same
  lever (the WGC CB line retires as Tier-2 lands, D7).
- **`pd.gold.blockedOfficial`** — the publishers' English pages moved +
  the fail-closed posture (nothing shown until the new addresses are
  verified) + the lever (the venue re-find, on the owner's list).
- **`pd.gold.blockedEtfShort`** — the honest why (no licence-clean venue
  exists today) + what unlocking takes (a new venue or negotiated
  terms).

### NEW — untriaged Persian strings (processed)

**R08 / F15 (2):**

- **`signals.verdictCaveat`** (`insights-copy-fa.ts`) —
  «این توصیف شرایط فعلی است، نه پیش‌بینی» ("this describes current
  conditions, not a forecast" — clause 2's inline adjacent line, the
  S2 audit's distance lesson closed).
- **`pd.global.outlookCaveat`** (`fa.ts`) — the same sentence on the
  gold hero's outlook unit (the fa.ts mirror of the corpus line; the
  corpus pin test keeps the two byte-identical).

**R09 / F13 (2):**

- **`pd.gold.blockedLearnMore`** — «چرا هر عددِ این صفحه مجوزِ نمایش
  دارد: نردبان مجوزها و شرایط تک‌تک منبع‌ها، در سند عمومی منابع
  داده.» (the #22 one link-out's label — the licence ladder + every
  source's terms live in the public data-sources document).
- **`pd.gold.absentWhyLink`** — «شرح دلایل» ("see why" — the inline
  link word on each absent item).

**R11 / F1 — the daily narrative (11 + 1 technical):**

- **`pd.gold.narrativeTitle`** — «چرا طلا حرکت کرد» ("Why gold moved" —
  the feature's name of record, S3's co-equal-Core verdict).
- **`pd.gold.narrativePriceFact`** — «قیمت طلا {windows} تغییر کرده
  است ({series}، به‌روزرسانی {date}).» (the price fact — series +
  as-of named at point of use, C1; no attribution language, s7/03 §2.1
  item 1).
- **`pd.gold.narrativePriceJoin`** — «{a} و {b}» (the two-window
  joiner).
- **`pd.gold.narrativeWindow1d` / `Window30d` / `Window90d`** —
  «{v} در روز گذشته» / «{v} در ۳۰ روز گذشته» / «{v} در ۹۰ روز
  گذشته» (the three named windows — C1; Persian digits ۳۰/۹۰).
- **`pd.gold.narrativePriceMissing`** — «قیمت لحظه‌ای طلا هنوز خوانده
  نشده است.» (the fail-closed price line — dashes never prose,
  s7/03 §2.2's staleness rule).
- **`pd.gold.narrativeMover`** — «{name} {delta} در ۳۰ روز گذشته»
  (the family-sentence mover grammar — raw deltas, never attribution
  shares; the window named, C1/C7).
- **`pd.gold.narrativeDeltaPts`** — «{v} واحد» (the points unit).
- **`pd.gold.narrativeDeltaPct`** — «{v}٪» (the percent unit — the U+066A
  glyph).
- **`pd.gold.narrativeCaveat`** — «برآیند، شرایط را توصیف می‌کند، نه
  حرکت قیمت را» (the standing caveat, s7/03 §2.1 item 4 — renders
  adjacent every day. NOTE: s6/02's C7 rule 2 record («توصیف می‌کند»)
  is the wording of record; s7/03's draft sketch («توضیح می‌دهد») is
  one word apart — the implemented «توصیف» (describes) is the more
  conservative verb and the C7 record wins; harmonized deliberately).
- **`hardcoded.apps.web.src.features.gold.narrative.GoldNarrative.a489ae36`**
  — «٪» (the U+066A Arabic percent glyph at the delta line — a
  technical character, not copy; the PriceDetails round-52 / bands
  round-59 precedent, same text + hash).

**R12 / F5 — the yield-decomposition card (19):**

- **`pd.gold.yieldTitle`** — «بازدهی ۱۰ ساله، تجزیه‌شده» ("The
  10-year yield, decomposed").
- **`pd.gold.yieldIdentity`** — «واقعی {real} + سربه‌سر {be} = اسمی
  {nominal} (سربه‌سر مشتق شده است: اسمی منهای واقعی)» (the EXACT
  relation rendered — real + breakeven = nominal, the breakeven
  derived; the term premium sits beside as the model estimate, never a
  false additive fourth leg).
- **`pd.gold.yieldMovedTitle`** — «کدام قطعه در این ماه حرکت کرد»
  ("Which piece moved this month").
- **`pd.gold.yieldLegNominal` / `LegReal` / `LegBreakeven` /
  `LegPremium`** — «اسمی ۱۰ ساله» / «واقعی ۱۰ ساله» / «سربه‌سر» /
  «صرف مدت» (the four leg labels).
- **`pd.gold.yieldGlossNominal`** — «نرخ بهرهٔ سادهٔ اوراق؛ عدد تیتر
  روزنامه‌ها.» — **byte-identical to the s7/02 §2.4 approved draft.**
- **`pd.gold.yieldGlossReal`** — «نرخ اسمی منهای تورم انتظاری؛ آنچه
  سپرده‌گذار واقعاً به دست می‌آورد؛ رقیب کلاسیک طلا.» — **s7/02 §2.4
  draft, byte-identical.**
- **`pd.gold.yieldGlossBreakeven`** — «تورمی که بازار در شکاف دو نرخ
  می‌گنجاند؛ تورم انتظاری، خوانده‌شده از منحنی بازدهی.» — **s7/02
  §2.4 draft, byte-identical.**
- **`pd.gold.yieldGlossPremium`** — «بهرهٔ اضافه‌ای که وام‌دهنده برای
  بلندمدت نگه‌داشتن مطالبه می‌کند؛ جبران ترس و عرضه. وقتی این قطعه،
  بازدهی را بالا می‌برد، تاریخ با طلا بوده است، نه علیه آن.» —
  **s7/02 §2.4 draft, byte-identical.**
- **`pd.gold.yieldAsOf`** — «به‌روزرسانی {date}» (the as-of word — C1
  at point of use).
- **`pd.gold.yieldPremiumNote`** — «صرف مدت یک برآوردِ مدلی است (کیم-
  رایت/ACM از طریق FRED)؛ در گذر زمان بازنگری می‌شود و نرخ بازار
  نیست.» (the model-provenance + revision disclosure, Idea 5's binding
  note; the Latin tokens ACM/FRED per the pinned-English rule).
- **`pd.gold.yieldConfigTitle`** — «سه پیکربندی» (the three named
  configurations' header).
- **`pd.gold.yieldConfigReal`** — «رشدِ محرکِ «واقعی»، تهدید کلاسیک
  طلاست؛ طلا بهره نمی‌پردازد و بازده واقعی بالاترِ اوراق، جایگاهش را
  ضعیف می‌کند.» (real-driven = the classic headwind, s7/01 §4 item 3).
- **`pd.gold.yieldConfigBreakeven`** — «رشدِ محرکِ «سربه‌سر» برای طلا
  خنثی تا مثبت است؛ کانال پوشش تورمی.» (breakeven-driven =
  neutral-to-positive, the inflation-hedge channel).
- **`pd.gold.yieldConfigPremium`** — «رشدِ محرکِ «صرف مدت»، پیکربندی
  کاهش ارزش پول است؛ تاریخ در این حالت با طلا بوده است. این پاسخ
  پرسش «بهره ۵٪ است، چرا طلا ریزش نمی‌کند؟» است.» (term-premium-driven
  = the debasement configuration — the headline teaching, the "yields
  are 5%, why is gold not collapsing?" answer).
- **`pd.gold.yieldException`** — «استثنا: در بحران تأمین مالی، جهش
  صرف مدت می‌تواند ابتدا از مسیر مارجین و چرخه‌های نقدشوندگی به طلا
  ضربه بزند (همتای بحران گیلت ۲۰۲۲) و سپس تقاضای پناهگاه چیره شود.»
  (the funding-stress twist, inline before a reader meets it in the
  wild — s7/01 §4 item 4; «می‌تواند» is the hedged can, the dated 2022
  example cited).
- **`pd.gold.yieldSeats`** — «کرسی‌های زنده:» (the live-seats label —
  the chain's voters term-premium-10y + us-deficit-12m, R10's
  card-level links).

## Terminology

This round introduces no new glossary entries. «سربه‌سر» (breakeven)
and «صرف مدت» (term premium) are the standard finance-Persian terms
already in the corpus's vocabulary (the breakeven-tilt card family,
round 54); «تجزیه» (decomposition) follows the same register.

## Method

Per `docs/localization/persian-copy-workflow.md`: the audit flagged the
57 strings (22 CHANGED + 35 NEW); the wording was reviewed in-session
against the s7/02 + s6/02 + s7/01 + s7/03 approved reference drafts
(D1 locked: A — the four leg glosses byte-identical to the s7/02 §2.4
table; the outlook grammar per C3's four clauses; the wall per C7 rule
5 + #22; the narrative per s7/03 §2's binding rules); the
`pnpm copy:audit:update` command recorded each decision (status
`processed`, round `round-84`, reference this file); `pnpm copy:audit`
re-run exits 0 (clean). No em dashes in fa copy. T-07 reviewed: the
R08 re-wording REMOVES the forecast-phrase family the gate exists to
catch; the R12 exception clause's «می‌تواند» is the hedged modal on a
dated historical mechanism (education copy, s7/01 §4 item 4's mandated
treatment), not a forecast.
