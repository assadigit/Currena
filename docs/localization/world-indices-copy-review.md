# World-indices round — Persian copy review

**Round id:** `handoff-world-indices`
**Task:** the editorial market-briefing redesign of the world stock indices
area on the Insights page (the 2026-10-18 handoff: `01-new-session-prompt.md`,
`02-ui-spec.md`, `03-agent-rules.md`, `ASSET-MAP.md`).
**This document** is the review reference recorded in
`docs/localization/persian-copy-manifest.json` for every fa string the round
added or changed (workflow `docs/localization/persian-copy-workflow.md` §5).

The handoff's §7 "UX writing examples" are directionally preferred phrases,
explicitly subordinated to the repository's terminology dictionary
(`persian-terminology.md`) — the decisions below follow that hierarchy.

## Terminology decisions (this round)

- The 52-week-high family keeps the established terms: «سقف یک‌ساله»
  (tile tag, below-high line) and «اوج یک‌ساله» (table column, spec §8.1's
  checked Iranian-site terms). The handoff's suggested «سقف ۵۲هفته‌ای» was
  **not** adopted — the repo dictionary is the final authority (02-ui-spec §7).
- «بازارهای سهام جهان» (the old section title) → «نبض بازارهای جهان» —
  the owner-directed editorial title (the handoff README's "Key product
  decision"). The descriptive label «شاخص‌های بورسی جهان» rides under it.
  The glossary's `markets.title` row is updated in the same change.
- The measures are «شاخص» everywhere; «بورس» stays reserved for actual
  exchanges (the handoff's naming discipline; e.g. ASX 200's context copy
  keeps «بورس استرالیا» for the exchange itself).
- Period lenses: «روزانه / هفتگی / ماهانه / سه‌ماهه» — adjectival forms
  (the handoff's preferred labels), replacing the old «امروز / یک هفته /
  یک ماه» while «سه‌ماهه» is unchanged. Standard Iranian-market usage
  (بازدهی روزانه/هفتگی/ماهانه/سه‌ماهه).
- Movers: «بیشترین رشد» / «بیشترین افت» — رشد/افت are the established
  rise/fall words (spec §8.1).
- Breadth: «شاخص‌های مثبت» / «شاخص‌های منفی» / «بدون تغییر» — «بدون تغییر»
  already exists as the flat trend word; مثبت/منفی are the natural Persian
  financial adjectives (consistent with the LED board's coloring copy).
- View switch: «فهرست» / «نقشهٔ عملکرد» (with ezafe), aria «انتخاب نحوهٔ
  نمایش شاخص‌ها».
- Missing data: «داده‌های این بازه هنوز در دسترس نیست.» follows the fixed
  "داده در دسترس نیست" vocabulary family, scoped to the period.

## Per-string review

All new/changed strings, with basis:

| Manifest id | Text (fa) | Basis |
| --- | --- | --- |
| `markets.title` (CHANGED) | نبض بازارهای جهان | owner-directed (handoff README "Key product decision", 02-ui-spec §3.1) |
| `markets.sectionLabel` (NEW) | شاخص‌های بورسی جهان | handoff §1 naming discipline + §3.1 |
| `markets.subtitle` (CHANGED) | عملکرد شاخص‌های بورسی منتخب تا پایان آخرین جلسهٔ معاملاتی | handoff §3.1 descriptor, polished (ezafe on جلسهٔ) |
| `markets.lastCloseBadge` (NEW) | آخرین داده‌ها · پایان جلسهٔ معاملاتی | handoff §7 "Last close" preferred direction; never "live" |
| `markets.viewSwitchAria` (CHANGED) | انتخاب بازهٔ عملکرد شاخص‌ها | the switch now selects a period, not "which value each card shows" |
| `markets.viewDaily` (NEW) | روزانه | handoff §3.3 (replaces `markets.viewToday`) |
| `markets.viewWeekly` (NEW) | هفتگی | handoff §3.3 (replaces `markets.viewWeek`) |
| `markets.viewMonthly` (NEW) | ماهانه | handoff §3.3 (replaces `markets.viewMonth`) |
| `markets.viewQuarterly` (NEW) | سه‌ماهه | unchanged text, renamed key (was `markets.view3m`) |
| `markets.displaySwitchAria` (NEW) | انتخاب نحوهٔ نمایش شاخص‌ها | list/heatmap switch (§3.6) |
| `markets.viewList` (NEW) | فهرست | handoff §3.6 |
| `markets.viewHeatmap` (NEW) | نقشهٔ عملکرد | handoff §3.6, polished (ezafe) |
| `markets.heatmapLegendLabel` (NEW) | شدت رنگ نسبت به بازهٔ انتخاب‌شده است | §3.6's "explain the dynamic normalization" |
| `markets.heatmapValueAria` (NEW) | {name}، {country}: {value} در بازهٔ {period} | §9's screen-reader sentence (name, country, period, value) |
| `markets.noReadingAria` (NEW) | این بازه داده ندارد | §9 "whether the value is missing"; «داده ندارد» vocabulary |
| `markets.breadthPeriod` (NEW) | عملکرد {period} | §3.2 "the selected period must be visible in the card" |
| `markets.breadthUp` (NEW) | شاخص‌های مثبت | handoff §3.2 recommended label |
| `markets.breadthDown` (NEW) | شاخص‌های منفی | handoff §3.2 recommended label |
| `markets.breadthFlat` (NEW) | بدون تغییر | existing flat-word (trendFlat) reused |
| `markets.coverageNote` (NEW) | {count} شاخص از {total} شاخص دادهٔ این بازه را دارند. | §8 honest denominator |
| `markets.belowHighLine` (NEW) | {n} شاخص از {count} شاخص دست‌کم ۱۰ درصد پایین‌تر از سقف یک‌ساله خود قرار دارند | §3.2; mirrors the established takeawaySome sentence family |
| `markets.moverGain` (NEW) | بیشترین رشد | handoff §3.4 |
| `markets.moverLoss` (NEW) | بیشترین افت | handoff §3.4 |
| `markets.moverPeriodLabel` (NEW) | بازهٔ انتخاب‌شده: {period} | handoff §7 "Selected timeframe" direction |
| `markets.moversNone` (NEW) | داده‌های این بازه هنوز در دسترس نیست. | handoff §7 "Missing history" direction, aligned to the fixed vocabulary |
| `markets.entries.*.country` (NEW ×16) | ژاپن، استرالیا، کرهٔ جنوبی، هنگ‌کنگ، چین، تایوان، هند، منطقهٔ یورو، آلمان، فرانسه، بریتانیا، آمریکا ×۳، کانادا، برزیل | ASSET-MAP.md country column, reconciled with the entries' existing context copy (کرهٔ جنوبی، منطقهٔ یورو، هنگ‌کنگ as a market label) |

Removed (no source key anymore; manifest entries deleted in the same commit
per workflow §"Rules of thumb"): `markets.viewToday`, `markets.viewWeek`,
`markets.viewMonth`, `markets.view3m`, `markets.viewFromHigh` — the period
switch offers exactly the four horizons the stored contract carries
(02-ui-spec §3.3; see `world-markets/briefing.ts`).

## Technical note

The percent glyph «٪» stays a technical character: the legend renders it
through the new `percentGlyph()` helper in `world-markets/shared.tsx`, whose
occurrence is already claimed by the manifest's
`technical.worldMarkets.percentSign` entry (same file, same glyph). No new
hardcoded literal ships.
