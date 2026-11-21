# Persian copy round 94 — GUX S8 M3 the accessibility text equivalents (11 §8's LABEL contract)

**Session:** S8 of the Gold UX Redesign program, milestone M3 — the
interaction contract (2026-11-2x) · **Scope:** four new fa strings, all
chart accessibility names (the screen-reader text equivalents the master
plan's Session 8 requires — every important chart meaning has a word
form): the interactive chart's keyboard-inspector readout
(`pd.gold.chartPointReadout`), the premium-history chart's full reading
(`pd.gold.prChartAria` + the one-coin fallback `pd.gold.prChartAriaOne`),
and the London-vault stock sparkline's reading
(`pd.gold.lbmaVaultSparkAria`). · **Manifest:** 9,265 → 9,269 entries
(4 new, all `processed` under this round).

## The wording decisions (authored against the neighboring keys + the established glossary)

1. **`chartPointReadout` — «نقطهٔ برگزیده: {value} {unit}، {date}».**
   The inspector's live-region sentence: the selected point's value +
   unit + full date, mirroring the visible tooltip's content exactly
   (value + the unit short word + the localized full date). «نقطهٔ
   برگزیده» (the chosen point) is plain Persian; the comma (،) separates
   the date — no em dash, per the workflow.

2. **`prChartAria` — «حباب هر دو سکه بر ارزش ذوب، از {from} تا {to}.
   آخرین: امامی {emami}، بهار {bahar}.»** Both coins' premium over
   melt, the window's own span (the honest-window rule — the same
   {from}→{to} the visible chart prints), then the latest readings.
   «حباب» and «ارزش ذوب» are the established terms (the card's own
   method line says «فرمول ذوب»); the coin names «امامی» / «بهار» match
   the figcaption and `gold.coin-*` keys byte-for-byte.

3. **`prChartAriaOne` — «حباب بر ارزش ذوب، از {from} تا {to}. آخرین:
   {emami}.»** The defensive one-coin fallback (a snapshot whose Bahar
   series is empty): the same sentence minus the second coin — never an
   invented number.

4. **`lbmaVaultSparkAria` — «موجودی طلا در {n} ماه: {tonnes} تن تا
   {month}.»** The stock level + the months count + the as-of month —
   the same three facts the topline prints («خزانه‌های لندن {tonnes} تن
   طلا دارند» + the month chip), with «تن» the established tonnes word
   (the topline's own unit).

All four keep `{placeholders}` intact, use Persian digits only in static
text (none here — all numerals arrive interpolated via `formatNumber`),
and contain no em dashes. The EN mirrors live in `en.ts` beside their
fa keys (`chartPointReadout` · `prChartAria` · `prChartAriaOne` ·
`lbmaVaultSparkAria`).

*Reviewed in-context over the fixture server (fa/RTL, the premium chart
open at 390, the vault card expanded) — the sentences read naturally
beside their cards' visible copy.*
