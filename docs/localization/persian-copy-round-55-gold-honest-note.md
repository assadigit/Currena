# Persian copy round 55 — the gold panel's measured-reality note (Session 5 / C4a)

**Date:** 2026-10-31 · **Scope:** 2 flagged fa strings in
`apps/web/src/i18n/insights-copy-fa.ts` — the gold tailwind panel's
measured-reality note (`signals.goldScore.measuredNote`, 1 string) and
its link word (`signals.goldScore.measuredNoteLink`, 1 string), both
rendered under the panel's S2.1 footnote inside the merged gold card.

**Basis:** the owner's Session-5 decision C4(a) — "Minimal honest note
(recommended)" — on the S4 backtest's verdict
(`docs/insights/GOLD_BACKTEST_SPEC.md` §5: the mature-base
sign-agreements 46.8% / 42.5% / 32.7% at 5/20/60 trading days, all
below the coin by more than 2 SE, and the tailwind−headwind mean spread
negative at every horizon — headwind labels preceded LARGER forward
rises; the 60td spread −3.09%). The public copy now carries the
measured reality: the table reads conditions, not direction, and the
full report is one link away (the repository is public — the same
surface the About section already links for contact). No change to the
score engine, the voter table, thresholds, or labels.

## Terminology decisions

| Concept | Persian | Rationale |
| --- | --- | --- |
| The measured-reality note | سنجش این جدول با حرکت واقعی طلا … نشان داد | «سنجش» (measurement) keeps the claim quantitative, matching the report's own vocabulary; the sentence states what was measured, never a recommendation. |
| 5–60-day forward moves | ۵ تا ۶۰ روز آیندهٔ قیمت | Persian digits in static copy (the glossary's rule); «روز آینده» = the forward horizon, plain-language for the backtest's "trading days ahead". |
| No positive association | ارتباط مثبتی نداشت | The measured word («ارتباط»), not causation; mirrors the report's "no edge in the table's own direction". |
| If anything, the other way | اگر هم ارتباطی دیده می‌شد، برعکس بود | The honest hedge carried over verbatim in meaning; «برعکس» states the direction without drama. |
| Headwind readings came before larger rises | برچسب باد مخالف پیش از رشدهای بزرگ‌تر می‌آمد | «باد مخالف» and «برچسب» reuse round-53's own label vocabulary; past continuous keeps it a measured observation, not a prediction. |
| Conditions, not direction | این جدول شرایط را می‌خواند، نه جهت را | Echoes the panel footnote's round-53 «تصویری از شرایط است، نه پیش‌بینی و نه توصیه» and the panel's own title «نمرهٔ جهت‌گیری طلا» — the note answers exactly what that title might over-promise. |
| The link word | گزارش کامل این سنجش | Self-referential to the note's «سنجش» — plainer than any transliteration of "backtest"; the anchor points at `docs/insights/BACKTEST-GOLD.md` in the public repository. |
| Latin tokens kept Latin | (none new) | The note carries no tickers; the years and horizons are Persian digits. |

## Process record

1. Copy authored in `insights-copy-en.ts` + `insights-copy-fa.ts`
   (shape type-checked against `InsightsCopy`; both dictionaries gain
   the same two keys).
2. `pnpm copy:audit` flagged the 2 fa strings as NEW.
3. Reviewed against the glossary + the round-53/54 gold-panel
   vocabulary (the note deliberately reuses «باد مخالف», «جهت‌گیری»,
   «شرایط»); no em dashes, Persian digits, ZWNJ hygiene checked.
4. This document written as the round's record; the manifest updated
   with `pnpm copy:audit:update --status processed --round round-55
   --reference persian-copy-round-55-gold-honest-note.md`.
5. `pnpm copy:audit` exits 0.
