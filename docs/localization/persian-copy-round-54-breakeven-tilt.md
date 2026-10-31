# Persian copy round 54 — the breakeven-tilt card + the gold panel's tilt phrase (Session 3 / G2)

**Date:** 2026-10-31 · **Scope:** 30 flagged fa strings in
`apps/web/src/i18n/insights-copy-fa.ts` — the G2 interplay card
(`indicators.breakeven-tilt.*`, 12 strings), its Layer-1 plain-language
entry (`layer1.indicators.breakeven-tilt.*`, 15 strings including the
Latin connection `with`/`strength` tokens and the glossary term ids), and
the gold panel's inflation-lane context phrase
(`signals.goldScore.tiltWords.*`, 3 strings).

**Basis:** GOLD_FRED_GAPFILL_SPEC.md §3 (Session 3's G2, the owner-ratified
spec): "EN + fa copy behind the Persian-copy audit gate (round-54,
docs/localization/), shown as context on the gold panel's inflation lane."
The copy follows `persian-terminology.md` and reuses the site's established
vocabulary (see the decisions below). Rendering in the real UI context is
asserted by `apps/web/src/components/insights/signals/gold-panels.test.tsx`
(fa locale, Persian digits, RTL-safe `bdi` isolation, the lane-phrase
mount) and `layer1.test.ts` (G1–G7); both were run green before this
record was written, and the card was eyeballed live on currena.ir in both
locales after the S3 deploy.

## Terminology decisions

| Concept | Persian | Rationale |
| --- | --- | --- |
| Breakeven tilt (the card + panel phrase) | شیب انتظارات تورمی | The spec's suggested name («شیب انتظارات تورمی»); «شیب» (tilt/slope) is new to the site but reads naturally beside the family's «سربه‌سر» cards. Plain-language verified: no jargon-list hits. |
| Building / fading (the tilt's lean) | در حال شدت‌گیری / در حال فروکش | The spec's own suggested pair (§3 G2a), matching the site's existing use of «فروکش» for easing pressure (the t5yie card's «فروکش آن نشست»). |
| Steady (inside the ±0.1pt deadband) | انتظارات ثابت | The site's fixed «ثابت» (steady); the panel phrase reads «انتظارات ثابت». |
| The far window / the near window | پنجرهٔ دورتر / پنجرهٔ نزدیک | «پنجره» (window) already names the horizon concept in the breakeven cards («پنجرهٔ نزدیک‌تر», «پنجرهٔ فراتر از پنج سال»); the comparative forms keep the family's voice. |
| Forward minus spot (the card's definition) | سربه‌سر پیش‌روی پنج‌تاده‌ساله منهای سربه‌سر نقطه‌ای پنج‌ساله | «سربه‌سر» is the family's established word for breakeven; «پیش‌رو» (forward) and «نقطه‌ای» (spot) follow the 5y5y card's existing phrasing. |
| Ticker | دور منهای نزدیک | Pure Persian (no mixed-script token); the breakeven family's tickers are Persian («سربه‌سر ۱۰ ساله»). |
| Lane context joiner | · | The gold panel's lane rows already join word + count with «·»; the tilt phrase joins the same way (round-53's lane-count line pattern). |
| Latin tokens kept Latin | T5YIFR, T5YIE, FRED, t5yie, breakeven-5y5y, breakeven-10y, reliable, inflation, breakeven | The Layer-1 connection `with`/`strength` values and glossary term ids are machine tokens (the EN dictionary carries the identical values); the FRED series ids in `whatItIs` follow the breakeven-10y card's precedent («T10YIE در FRED»). |

## Process record

1. Copy authored in `insights-copy-en.ts` + `insights-copy-fa.ts` (shape
   type-checked against `InsightsCopy`; the EN text is the source of
   record for the §8 registry text).
2. `pnpm copy:audit` flagged all 30 fa strings as NEW.
3. Reviewed against the glossary + the existing dictionary (the
   breakeven family's own cards were the primary reference); the Layer-1
   validator (G1–G7: length limits, jargon, banned words, Farsi hygiene,
   Persian digits) ran green after two oneLine tightenings recorded in the
   branch history.
4. This document written as the round's record; the manifest updated with
   `pnpm copy:audit:update --status processed --round round-54
   --reference persian-copy-round-54-breakeven-tilt.md` (the file name
   below is authoritative).
5. `pnpm copy:audit` exits 0.
