# Persian copy round 83 — GPE S10 P1-a the credibility floor (wave 0)

**Session:** S10 of the Gold Page Elevation (GPE) program — the FIRST
Phase-D implementation session (P1-a, the credibility floor, wave 0).
**Date:** 2026-11-18. **Branch:** `gold-elevation/p1a-credibility-floor`
(off `main` `19131b0`). **Round:** 83 (continues from round 82, the
GF-S11 decisions' execution + P4).

This round records the Persian-copy decisions for the six wave-0 rows
R01–R06 (s8/01 §1). Per the CP-C record §4's pre-flight + D1 locked
A (the s7/02 + s6/02 drafts are the approved reference wording — the
round polishes; the structure and honest-limits content bind), the
wording was reviewed in-session against the approved drafts and the
terminology glossary; no em dashes in fa copy.

## The ten fa strings (1 CHANGED + 9 NEW)

### CHANGED — reviewed text drifted (needs-review → processed)

- **`pd.gold.unitTonnes`** (`apps/web/src/shared/i18n/fa.ts`) — R02
  (GPE-S2-02, the «میلیون تن» → «تن» unit error on the SGE-withdrawals
  and Swiss-flow cards).
  - **was:** `میلیون تن` (a corpus unit string reused from China-steel
    data — a 1,000,000× error on two cards whose values are tonnes).
  - **now:** `تن` (the correct unit — the values themselves were always
    correct, S2 §7 rows 17–18 verified; only the label was wrong).
  - **decision:** processed — the corrected wording is the plain Persian
    word for "tonnes", consistent with the EN parity "tonnes" and the
    terminology glossary. The gold page's copy-pin test pins the
    divergence from the insights corpus's `units.tonnes` («میلیون تن»,
    the China-steel vocabulary) by design.

### NEW — untriaged Persian strings (processed)

- **`ui.rangeWindowYears`** (`apps/web/src/shared/i18n/insights-copy-fa.ts`)
  — R01 (GPE-S2-01, the "10 years"/5.2-year window truth fix). The
  flagship chart's decade chip's word is now COMPUTED from the span the
  loaded series actually carries (`{years} سال`); the number renders
  through `formatNumber` (Persian digits in fa).
  - **fa:** `{years} سال` (the `{years}` placeholder renders Persian
    digits via formatNumber at the call site).

- **`pd.gold.positionsChangeWindow`** (`apps/web/src/shared/i18n/fa.ts`)
  — R03 (GPE-S2-09, the unlabeled "−8.8 pts" 30-day change). The Gold
  Positions change line gains its window word.
  - **fa:** `تغییر ۳۰ روزه` ("30-day change" — the section speaks the
    weekly CFTC report, so the unlabeled points no longer parse as
    week-over-week).

- **`pd.gold.seatWhyUpstreamStopped`** (`apps/web/src/shared/i18n/fa.ts`)
  — R04 (F16a, the why-unread lines, the upstream-stopped cause class).
  The UoM family ("source stopped publishing — Sep 2026").
  - **fa:** `منبع داده انتشار را متوقف کرده (آخرین داده: {month})`
    ("the data source has stopped publishing (last data: {month})" —
    `{month}` is the last published month, formatted in the page's
    calendar).

- **`pd.gold.seatWhyUpstreamGap`** (`apps/web/src/shared/i18n/fa.ts`)
  — R04 (the upstream-gap cause class). The CPI seat (the S4-D1
  shutdown-gap case — its label becomes the S4-D1 sentence once R05
  lands).
  - **fa:** `ماهِ مبنای سال گذشته بالادست منتشر نشد (شکست انتشار)`
    ("last year's base month was not published upstream (publication
    gap)").

- **`pd.gold.seatWhyPipelineLag`** (`apps/web/src/shared/i18n/fa.ts`)
  — R04 (the pipeline-lag cause class). The CFTC/GPR seats ("data
  published upstream, next ingest will carry it" — honest for as long
  as the two operational P0s persist).
  - **fa:** `داده در منبع منتشر شده است؛ تازه‌سازی بعدی آن را می‌آورد`
    ("the data is published at the source; the next refresh will carry
    it").

- **`pd.gold.seatWhyRuleDriven`** (`apps/web/src/shared/i18n/fa.ts`)
  — R04 (the rule-driven cause class). The US−Japan gap ("value
  mid-range; no decile history for this seat yet").
  - **fa:** `مقدار به‌روز است؛ تاریخچهٔ ده‌ساله برای این کرسی هنوز موجود نیست`
    ("the value is current; no ten-year history exists for this seat
    yet").

- **`pd.global.yoyGapBaseLabel`** (`apps/web/src/shared/i18n/fa.ts`)
  — R05 (INF-2, the CPI shutdown-gap policy per S4-D1). The
  point-of-use method label for a YoY reading whose prior-year base
  month was missing upstream (the disclosed, reproducible method; the
  flag auto-expires when the base month returns).
  - **fa:** `مبنا: میانگین دو ماه مجاور (شکست انتشار {month})`
    ("base: average of the two adjacent months ({month} publication
    gap)").

- **`pd.global.pricesAsOfLastSuccessful`** (`apps/web/src/shared/i18n/fa.ts`)
  — R06/#23 (GPE-S2-23, the live-prices "last successful" qualifier).
  When the projection rendering is the cached last-good copy (an
  outage), the live-prices line qualifies its timestamp.
  - **fa:** `قیمت‌های لحظه‌ای (آخرین تازه‌سازی موفق) {time}`
    ("live prices (last successful refresh) {time}").

- **`ui.silverKeepSmallNote`** (`apps/web/src/shared/i18n/insights-copy-fa.ts`)
  — R06/F17 (S5-D3 keep-small closure, made visible). The silver
  verdict chip's footer note — silver's depth is a deliberate
  positioning decision (the ratio cards verify exact; a silver
  conditions strip returns only on measured reader demand), not an
  oversight.
  - **fa:** `عمقِ نقره یک انتخابِ آگاهانه است: کارت‌های نسبت دقیق می‌مانند و نوارِ مستقلِ شرایطِ نقره در صورت سنجشِ تقاضای خواننده بازمی‌گردد.`
  - **T-07 note:** the wording was reviewed against the forbidden-
    forecast-phrase list (` will ` / ` should ` / ` expected to ` / `
    time to `); the fa copy carries no forecast phrasing (the EN
    parity was reworded from "will return" → "returns only on" to
    pass the same T-07 gate).

## Terminology

This round introduces no new terminology entries. The four cause-class
names (upstream-stopped / upstream-gap / pipeline-lag / rule-driven) are
the S2 §3 decomposition's own labels, already recorded in the GPE
research; they render as copy keys, not as terminology glossary entries
(the glossary covers cross-domain Persian terms; these are gold-page-
section-specific strings).

## Method

Per `docs/localization/persian-copy-workflow.md`: the audit flagged the
10 strings (1 CHANGED + 9 NEW); the wording was reviewed in-session
against the s7/02 + s6/02 approved reference drafts (D1 locked: A); the
`pnpm copy:audit:update` command recorded each decision (status
`processed`, round `round-83`, reference this file); `pnpm copy:audit`
re-run exits 0 (clean). No em dashes in fa copy.
