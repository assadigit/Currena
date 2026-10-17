# QA record — 2026-10-17 — the Persian dollar convention (round-47 copy)

## The owner's rule (verbatim)

> As a convention, in farsi only say دلار
> not دلار آمریکا
> because farsi speakers already knows what dollar is.
>
> only mention dollar nationality when it's for australia or canada.

## The convention, codified

1. **USD** reads **«دلار»** — never «دلار آمریکا». In Persian financial
   usage the unqualified «دلار» already means the US dollar; the qualifier
   is noise.
2. **Nationality is reserved**: the only dollar phrases that keep a country
   qualifier are **«دلار استرالیا»** (AUD) and **«دلار کانادا»** (CAD).
3. Non-dollar currencies are untouched (پوند بریتانیا، یوان چین، لیر ترکیه…),
   and **cents are untouched** («۶۲ سنت آمریکا» keeps its qualifier — the
   rule speaks about دلار only).

## What changed (114 tracked keys)

- `apps/web/src/i18n/insights-copy-fa.ts` — 113 strings: every «دلار آمریکا»
  → «دلار». Notable shapes that remain natural after the swap:
  - `fx.dollarRowTitle` «قدرت دلار» (was «قدرت دلار آمریکا»)
  - `fx.currencyNames.USD` / `fx.currencyPlural.USD` «دلار» (AUD keeps its
    qualifier in both maps — the AUD-vs-dollar pair sentences still read
    «دلار استرالیا … در برابر دلار»)
  - `units.usd` «دلار» → every indicator value, board tile and chart line
    that priced in USD now suffixes «دلار» («۱۱۳٫۹۶ دلار»)
  - the AUD-section sentences that juxtaposed the two currencies
    («یک ماه: {usd} به دلار · {aud} به دلار استرالیا …»)
- `apps/web/src/i18n/fa.ts` — `currencies.USD: 'دلار'`; the converter picker
  renders `{code} · {name}` so the row reads «USD · دلار».
- EN copy untouched (US$, US dollar stay as-is). Data, scoring and formatting
  logic untouched — this is a copy-only round.

## The NZD edge call (flagged for the owner)

The map also held `NZD: 'دلار نیوزیلند'`. The rule's second clause reserves
dollar nationality to Australia and Canada, so NZD was shortened to «دلار»
as well. Wherever NZD appears the currency code rides beside the name
(converter picker: «NZD · دلار»), so nothing becomes ambiguous. **If the
owner wants the qualifier back for NZD, it is a one-line revert in
`fa.ts` `currencies.NZD`.**

## Comment-only consistency (not audited, not user-facing)

Doc-comment examples that taught the old phrase were updated so the source
no longer models it: `VerdictMeter.tsx`, `PricesBoard.tsx`,
`config/display.ts` (×2), `lib/live-rate.ts`.

## Tests re-pinned to the new strings

`live-rate.test.ts` (fa share-line fixture + expectation),
`fx-presentation.test.ts` (r3 sentence),
`insights.test.ts` (fa brent value), `fx-v13.test.ts` (chart label,
dollarRowTitle, s1 sentence).

## Audit trail

Manifest round-47: the 114 keys re-triaged as `processed` against this
document via `scripts/update-persian-copy-manifest.mjs`; `pnpm copy:audit`
clean.
