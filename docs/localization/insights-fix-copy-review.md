# Insights fix-spec copy review — Farsi (round `insights-fix-2026-10`)

Reference for the Persian-copy manifest triage of the strings added or
changed by **INSIGHTS_FIX_SPEC.md** (Parts A–C, implemented 14–15 Oct 2026).
This file is the traceable review basis the manifest points at
(`--round insights-fix-2026-10 --reference docs/localization/insights-fix-copy-review.md`).

## What changed

### New UI strings (Part A foundation + Part B label fixes)

- `ui.statusTitle`, `ui.statusTimeLocale`, `ui.statusGeneratedAt`,
  `ui.statusFailedSources`, `ui.statusAllSourcesOk`, `ui.statusFlaggedTests`,
  `ui.statusStaleCards`, `ui.statusNoStaleCards` — the "About this data"
  run-status block (A-08): snapshot time with time zone, failed sources,
  flagged validation tests, stale cards.
- `status.check-pending`, `ui.checkPendingTag`, `ui.checkPendingLine` — the
  new held-value status (A-04): a flagged card keeps its last good value and
  says why ("در انتظار بررسی — {reason}").
- `ui.attentionLine` — the A-02 generated needs-attention sentence:
  interpolated from the reading's own rule and value
  ("اکنون {value} — در ناحیه‌ای که قاعدهٔ آن پایش می‌کند: {rule}."), so the
  sentence can never contradict the number beside it.
- `ui.ruleVersionLine` (A-07), `ui.nextReleaseToday` (B-05),
  `ui.decidedEffectiveLine` (B-06: "تصمیم {decided} · اجرا {effective}"),
  `ui.belowPeakRecord` + `ui.peakBasisHigh`/`ui.peakBasisClose` (B-01:
  "{pct}٪ پایین‌تر از رکورد {value} در {date} ({basis})"),
  `ui.monthlyAverageNote` (B-15), `ui.highestSince` (B-19:
  "بالاترین سطح از {year}"), `ui.datesDiffer` + `ui.gapLegDates` (B-10),
  `money.realReturn` (B-18: real return on savings, before tax).
- `together.state.pending`, `together.rightNowShort.pending`,
  `together.passThroughLine`, `together.summaryPending`,
  `together.contextLeg`, `together.contextCaveat`,
  `together.phrases.overWindow`,
  `together.connections.iron-terms-aud.legs.dollar-basket` — the B-04
  relationship-card rewrite (pass-through pending for the RBA card, the US
  dollar context leg on iron ore, direction-over-window phrasing).

### New indicator cards (Part C additions)

`indicators.fed-expectations.*`, `indicators.us30y.*`,
`indicators.philly-fed.*`, `indicators.rba-expectations.*` — the four new
cards (C-03/C-04/C-05/C-06), plus the `ecb-2026-10` calendar title (C-07:
the ECB decision day, 29 Oct 2026).

### Changed strings (B-04 / B-14)

- `ui.pricesSubtitle` — oil is scored (B-14): the subtitle now says the
  prices section is context with oil scored, matching the hero count.
- `together.phrases.none` — the rewritten relationship "none meet their
  rule" phrase.

### Removed strings (by design)

- All 34 `meaning.*` entries — A-02 removed the hand-written `meaning`
  conclusions (generated text only; the needs-attention line is now
  interpolated from the reading itself).
- `together.connections.copper-china-growth.legs.m2-us` — B-04 removed the
  weak US-money-supply leg from the copper/growth card.
- `together.phrases.levelDir`, `together.phrases.levelOnly` — retired by the
  B-04 uniform direction-over-window leg phrasing.

## Translation decisions

1. **Conditions only, no forecasts** (the spec's wording rule): every new
   sentence describes a present condition ("قیمت‌گذاری خودِ بازار بالاتر از
   تنظیم امروز قرار دارد"), never a prediction. No Persian equivalents of
   "will / should / time to / expected to" were introduced.
2. **Persian numerals in static text** (e.g. «۲ ساله», «۳۰ ساله», «۲۹
   اکتبر»); dynamic numbers keep `Intl` fa-IR rendering at run time.
3. **Latin technical tickers kept verbatim** (`2-year gap`, `30-year`,
   `Philly Fed`, `3-year gap`, series IDs like `GACDFSA066MSFRBPHI` inside
   `whatItIs`), per the existing G8/N1 discipline (technical tags isolated
   `dir="ltr"`; FRED series IDs stay in English).
4. **Terminology follows the established corpus**: نرخ سیاستی (policy rate),
   بازده/بازدهی (yield), اختلاف (gap), نرخ نقدی (cash rate), گسترش/انقباض
   (expansion/contraction), تعدیل فصلی (seasonally adjusted). "markets
   expect from the Fed/RBA" is rendered «انتظارات بازار از …» — the card
   *name* quotes market pricing, and the body sentences describe what the
   gap is, not what the central bank will do.
5. **Peak/basis wording** (B-01) distinguishes بالاترین سقف روزانه (daily
   high) from بالاترین قیمت بستهٔ روزانه (daily close) so the basis is
   legible in Farsi exactly as it is on the card.
6. **Decided/effective** (B-06) uses «تصمیم {decided} · اجرا {effective}» —
   two distinct words, no ambiguity about which date is which.

## Review basis

Translations written alongside the English copy in the same commit by the
insights fix-spec implementation, following the corpus's established
conventions above. English source: `apps/web/src/i18n/insights-copy-en.ts`
(the type contract — fa must satisfy `InsightsCopy` exactly),
`data/insights-calendar.json` (titleFa).
