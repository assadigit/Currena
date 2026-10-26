# QA record — the prices board cards re-drawn from the owner's sketch (2026-10-17)

## The owner's directive (verbatim requirements)

> For the given part I actually want this new design.
> 1. Picture next to Unit name and price
> 2. Daily / Weekly / Monthly/ Quarterly Percentages
> 3. Descriptions and verdict
> 4. some more meta data facts and percentages (must be in bullet point)
> 5. very small text showing update time.

Two attachments: a hand-drawn card sketch (price + "Price per ounce" caption on
one side, the artwork at the top's far end, four stacked percentage lines
"daily % / weekly % / monthly % / quarterly change %", a big "Description"
heading, then bullet rows "More percentages and details") and a screenshot of
the then-current four-tile prices board (Bitcoin, Silver, Gold, Brent) that the
redesign replaces.

## How each requirement maps to the shipped card

| # | Requirement | Shipped as |
|---|---|---|
| 1 | Picture next to unit name and price | Header row: big digits (the fa unit on its own small line UNDER the digits so every fa tile has the same price-block height) + the indicator name in its fixed two-line slot at the start; the tinted PriceIconBox (96px mobile / 72px desktop) at the row's far end. RTL mirrors automatically (icon top-left in fa, top-right in EN — the sketch's own shape). |
| 2 | Daily / Weekly / Monthly / Quarterly percentages | Four full-width rows under the header: `priceChangeDaily/Weekly/Monthly/Quarterly`, values end-aligned, quiet "—" when a window does not exist. Weekly/Monthly/Quarterly = the feed's change7d/change30d/change90d (production-verified present on all four tiles); Daily = derived from stored history (price-stats.ts). |
| 3 | Descriptions and verdict | A "Description" label row (`descriptionLabel`) whose far end carries the price-position verdict word (cheap/normal/expensive — the R31 status ink) above the existing hedged consequence line. |
| 4 | More meta data facts and percentages, bullet points | A `role="list"` bullet block: derived facts first (6-month change, 1-year change, 52-week range — price-stats.ts, ≤3-day nearest-point rule, ≥300-day span gate for the "52-week" name), then the tile's existing context lines (futures note, gold A$ companion, Bitcoin ratios, 200-day gap, record distance). A fact that cannot be measured stays OFF the card. |
| 5 | Very small update-time text | The "as of" line drops from the caption size to 10px tertiary ink, pinned to the tile's bottom with mt-auto so the four footers align on the stretch grid. |

## New copy keys (9, EN + fa, ui section)

`priceChangeDaily`, `priceChangeWeekly`, `priceChangeMonthly`,
`priceChangeQuarterly`, `descriptionLabel`, `stat6mChange`, `stat1yChange`,
`stat52wRange`, `rangeJoin`.

fa renderings (reviewed against the dictionary's house style):

| Key | EN | FA |
|---|---|---|
| priceChangeDaily | Daily | روزانه |
| priceChangeWeekly | Weekly | هفتگی |
| priceChangeMonthly | Monthly | ماهانه |
| priceChangeQuarterly | Quarterly | سه‌ماهه |
| descriptionLabel | Description | توضیحات |
| stat6mChange | 6-month change | تغییر ۶ ماهه |
| stat1yChange | 1-year change | تغییر ۱ ساله |
| stat52wRange | 52-week range | محدودهٔ ۵۲ هفته |
| rangeJoin | – | تا |

`days7` / `days30` are NOT repurposed (AlertCard, HeroBlock and CompactRow
still speak them). The 52-week range renders EN 'US$2,895 – US$4,305' /
fa «۲٬۸۹۵ تا ۴٬۳۰۵ دلار آمریکا» — `rangeJoin` is the joiner word only.

## Honesty rules carried over / tightened (price-stats.ts)

- All derived numbers come from the stored history series ALONE — the live
  reading value is never mixed into a window.
- A window's reference is the stored point NEAREST to N days back and only
  within ≤3 days; a sparse series yields an absent window, never a stretched
  number.
- NEW: the last stored point can no longer be its own reference (the old R30
  derivation could fabricate a 0% change when nothing sat within tolerance —
  caught by the new tests).
- The "52-week range" is only NAMED when the stored window really spans
  ≥300 days.
- Zero baselines yield absent changes, never Infinity.

## Manifest round-46

The 9 new fa keys above are recorded as NEW `processed` entries (round-46,
reference = this file) in docs/localization/persian-copy-manifest.json;
`pnpm copy:audit` is clean afterward.
