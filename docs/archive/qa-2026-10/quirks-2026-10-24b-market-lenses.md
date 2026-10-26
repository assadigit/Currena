# QA quirk — 2026-10-24b: the market view switch grows the weekly and monthly lenses

Owner request (verbatim, this session):

> "Ok now they're back add monthly and weekly views of how percentages changed
> as well. I mean for here: [the Insights page's market view switch radiogroup]"

The section's view switch offered three lenses (Today / 3 months / From
52-week high). Round 46 adds the two missing durations so the switch reads
**Today | 1 week | 1 month | 3 months | From 52-week high** — one ascending
arc, the 52-week distance last. The same two numbers join the full table
(a column each beside Today), the Tools-menu CSV (appended at the end —
stable positional API) and the full export (the existing 7-day/1-month flat
slots, so no position moves).

## The six new Persian strings (round 46 wording decisions)

| Key | Text | Basis |
| --- | --- | --- |
| `markets.viewWeek` | «یک هفته» | The span form the fx table already uses (`thM1: «یک ماه»`); pairs with «سه‌ماهه» as a duration, never a cadence word. |
| `markets.viewMonth` | «یک ماه» | Same convention; matches the currencies section's «یک ماه». |
| `markets.thWeek` | «بازده یک هفته» | The markets table's own header convention prefixes «بازده» (see `thToday: «بازده امروز»`, `th3m: «بازده سه‌ماهه»`). |
| `markets.thMonth` | «بازده یک ماه» | Same prefix rule. |
| `markets.csvColWeek` | «بازده یک هفته (درصد)» | The CSV column convention appends «(درصد)» (see `csvCol3m`). |
| `markets.csvColMonth` | «بازده یک ماه (درصد)» | Same convention. |

Rules kept: no em dashes, no placeholders (none needed), terminology follows
the established markets/fx glossary («بازده» for a return over a window,
«درصد» spelled out in CSV headers, digits never embedded in copy).

## Data basis (same bar as every stored number)

- `chg1w` — last close vs the last close on/before the same date **one week
  earlier** (rolling 7-day anchor on the daily series, the exact rule chg1m
  and chg3m use). New OPTIONAL contract field, back-compat like `chg1m`:
  a stored row without it renders the honest dash (—), never a guess.
- `chg1m` — already in the contract and already on every live row
  (the currencies rules read it); it now serves the monthly lens too.

## Verification checklist

- [x] copy:audit clean after triage (this file is the round-46 reference)
- [x] EN + FA render on /insights (view switch, tiles, full table, CSV, export)
- [x] tiles switch their number per lens; a missing lens shows — and no arrow
- [x] `GET /api/insights/markets` carries `chg1w` on every row
