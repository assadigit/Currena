# Evidence — 2026-10-20 · the gold/silver verdict chips redrawn as analysis cards (the owner's sketch)

The owner drew the chip UI for the gold and silver analysis ("Conditions
right now" / «شرایط فعلی» strip): the header carries the boxed artwork, the
metal name + verdict, and the PRICE in a **lighter ink** ("the price is
already mentioned once in upper section. the emphasis must be on the TREND,
not the price necessarily"), with one BIG chart filling the rest of the card
— **"DO THE SAME FOR MOBILE VIEW."**

## What changed

- `apps/web/src/components/insights/signals/verdict.tsx` — the VerdictStrip
  chip anatomy rebuilt:
  - NEW `MetalIconBox`: the metal artwork moves into a small tinted corner
    box (56/64px — was a bare 96/128px artwork owning a whole column); gold
    keeps the brand-gold tint, silver the quiet soft tint (the price tiles'
    language).
  - Header row: boxed artwork · name (bold, primary ink) + verdict word with
    the direction artwork (verdict ink) · the current price at the far end
    in the muted secondary ink (`--type-label`, tabular, nowrap).
  - The chart IS the body now: `MetalTrendChart` gained `plotHeightClass`
    and opens at **h-40 mobile / h-52 desktop** (was h-20 everywhere); the
    old artwork-column-vs-chart side split (`sm:w-40`, `sm:border-s`,
    `min-h-[136px]`) is GONE — ONE anatomy for mobile and desktop.
  - The verdict word keeps its floored two-line slot (the round-34
    alignment rule survives by structure).
  - Range chips (Quarter/1y/5y) + the signed window delta unchanged.
- `apps/web/src/components/insights/signals/MergedCard.tsx` — computes each
  metal's display price from the SAME snapshot readings
  (`formatIndicatorValue('gold-usd'|'silver-usd', …)`) and passes
  `prices={{ gold, silver }}` to the strip; honest absence → no price
  rendered, no placeholder.

No copy changes (the price is the same formatted value the prices board
leads with — no new strings, no label), no data/scoring change.

## Gates (all green)

- `pnpm copy:audit` clean · full workspace tests **1,431 green** (core 191 ·
  scraper 67 · insights 462 · markets 13 · api 237 · web 461) · typecheck
  all · lint **0 errors** / 15 accepted advisories · budgets held: entry
  295.15/88.76 gz; Insights lazy 593.51/141.27 gz (+0.9 kB raw for the new
  header, budgets 604/142.8).

## Deploy + production verification (browser-checked)

- Deployed currena-api **`757cb15b-45ae-4a61-8f4a-d808a515968d`**
  (SITE_MODE=public untouched; currena-markets untouched `9b5ff7e0`).
- Desktop 1280 EN: both chips render; plot height **208px**; header prices
  "US$4,165" / "US$57.27" in the muted ink; the sketch's anatomy verbatim.
- Mobile 375 EN: same anatomy (no side split), `scrollWidth === 375` (no
  overflow).
- fa RTL (the owner's locale): icon box at the START (right), verdict
  sentence in red beside it, price «۴٬۱۶۵ دلار آمریکا» muted at the END
  (left), big chart with Jalali month ticks + همه‌ها/یک سال/پنج سال chips
  + delta — the sketch mirrored, one line on desktop.
- Prices board above: 4 tiles + 4 icons untouched. Page/console errors: none.

## Files

- `verdict-fa-desktop.png` — fa desktop, the sketch realised (RTL).
- `verdict-fa-mobile.png` — fa mobile 375px, same anatomy.
- `verdict-desktop.png` — EN desktop 1280px.
- `verdict-mobile.png` — EN mobile 375px.
- `measurements.txt` — the measured plot heights, header prices, overflow
  and error checks.
