# Persian copy round 89 — GPE S16 P3 Bridge-2: the premium history (wave 3, third session)

**Session:** S16 of the Gold Page Elevation (GPE) program — the SEVENTH
Phase-D implementation session (P3, the Supporting tier, wave 3's third
session: R30/F3b Bridge-2 — the حباب premium HISTORY, the premium
DECILES, the day-move attribution strip with the exact identity
arithmetic, the one-time TGJU profile-history backfill and the forward
accumulation beside the R13 snapshot plane; the CBI gerami pin attempt
fired — the band stands, the s16 M1 §3 record). **Date:** 2026-11-19.
**Branch:** `gold-elevation/p3-bridge2` (off the S15 close `1a4b35d1`).
**Round:** 89 (continues from round 88, the GPE S15 expectations +
episodes round).

This round records the session's Persian-copy decisions in ONE round
(the S10–S16 single-round pattern): 18 dictionary keys (the premium
card's three blocks — the day-move strip with its BINDING disclosure,
the history chart, the deciles — plus the honesty line and the method
footer) and 4 technical entries (the parser's own upstream column-name
matchers + the failure messages that quote them — never rendered to
users, the round-2 `technical.tgju.dayHighLabel` precedent).

## The wording decisions

- **تاریخچهٔ حباب** — the card's title. حباب rides its round-85
  terminology entry (the bridge's owned word); the history framing
  («تاریخچه») names exactly what is new (the series — nobody else in
  the ecosystem has it).
- **نوار تفکیک حرکت روز** — the day-move attribution strip. «تفکیک»
  (decomposition) chosen over «اسنابد» (attribution/تخصیص): the strip
  DECOMPOSES an exact identity; the EN gloss is "decomposition" too
  (the s1/11 §5 decomposition wording the bridge already renders).
- **اتحادِ دقیق** — the exact identity. The BINDING disclosure
  (s7/01 §8): «Δln(سکه) = Δln(انس) + Δln(دلار) + Δln(۱+حباب)؛ سه عامل
  در حرکت سکه ضرب می‌شوند، نه جمع. تفکیک حسابی است، نه برآورد آماری
  (رگرسیون)». The formula prints VERBATIM at point of use; the
  multiply-not-add clause is the anti-sum misreading guard; the final
  sentence is the NEVER-REGRESSION clause (GRAM-style regression is the
  incumbent's method — the distinction is the moat, named on the card).
  The Δln notation stays Latin (the mathematical notation, like the
  bridge's own formula block).
- **مِلت** — melt (the 0% reference line's label). The gold-trade's own
  Persian word (آب‌شده's cousin — the melt the آبشده convention itself
  references); one glyph on the chart's axis.
- **خط صداقت** — the honesty line. The R25/S15 family's own word
  (صداقت — the honest record's brand); the two provenances named in one
  sentence: «بازسازی‌شده از تاریخچهٔ منبع» (reconstructed from TGJU's
  own daily closes) vs «محاسبهٔ زنده از اسنپ‌شات‌های خودمان» (computed
  live from our own snapshots) — the s1/11 §6 wording pair, rendered
  verbatim.
- **آغاز محاسبهٔ زنده** — the boundary marker's chart label (the first
  live day; the honesty line's own pointer).
- **جایگاه حباب در پنجرهٔ خودش** — the deciles block's title; the
  decile grammar rides the round-86 stored-window posture («صدک … از
  بازهٔ ذخیره‌شده» → here «پنجرهٔ خودش», the same honest-window family,
  the window named per row with its dates + point count; the sub-30
  waiting line says the number plainly: «صدک با رسیدن به ۳۰ روز روشن
  می‌شود»).
- **کمینه / میانه / بیشینه / صدک ۱۰ / صدک ۹۰** — the band line's
  statistics vocabulary (the established statistical words; Persian
  digits throughout).
- **ثبت روزانه** — the method footer's capture-convention word: «هر شب
  حدود ۰۰:۰۳ به وقت تهران، آخرین اسنپ‌شات روز یک ردیف می‌شود» — the
  day-close convention named at point of use (Tehran's clock, never
  UTC); «بازسازی و حباب از همین پایه‌ها محاسبه شده، نه از سایت برداشت
  شده» — the never-scraped-as-a-claim clause (s1/11 §6 item 2).
- The strip's frame: «امروز نسبت به {date}» — the base day's own date
  (Jalali in fa) always in the sentence, so the two observations are
  both named (the comparison is never implicit).

## The technical entries (never rendered)

The four `hardcoded.packages.scraper.src.tgju-history.*` entries are
the parser's own matchers — «پایانی» + «تاریخ / میلادی» (the history
table's column signature TGJU's own pages print) — and the two failure
messages that quote them (the fail-loud error text, English with the
Persian anchors embedded). They are parse anchors and diagnostics, not
copy; the round-2 `technical.tgju.dayHighLabel` precedent (the
`kind: "technical"` triage, "never rendered to users") applies verbatim.

## Review evidence

The wording was reviewed in-session against the binding copy rules
(s6/02 C1–C7 — the formula + the convention named at point of use; no
em dashes in fa copy — verified over the whole new block; Persian
digits throughout; the {placeholders} intact), then checked in the real
UI on the locally built SPA over the production API + the session's own
backfill fixture: EN desktop 1440 (the strip rendering the LIVE factors
against the stored Nov 18 base — the exact identity visible end-to-end),
fa/RTL desktop (the Jalali dates «۱۴۰۵/۰۸/۲۷», the Persian digits, the
formula verbatim), and mobile 390 fa fresh-load (collapsed by default
per the 390 rule, no horizontal overflow before or after expanding;
zero console errors on every surface exercised). The screenshots:
`docs/specs/gold-page-elevation/s16/verify-*.png`.

## Terminology additions (persian-terminology.md)

- **نوار تفکیک حرکت روز** — the day-move decomposition strip (the
  exact-identity framing; «تفکیک حسابی، نه برآورد آماری» is the
  never-regression clause, binding copy).
- **اتحادِ دقیق** — the exact identity (Δln arithmetic family; the
  three factors multiply, never add).
- **مِلت** — melt (the 0% premium reference; the melt-value word the
  bridge's ارزش ذاتی already points at).
- **خط صداقت** — the honesty line (the provenance pair: reconstructed
  from source history vs computed live from our snapshots).
