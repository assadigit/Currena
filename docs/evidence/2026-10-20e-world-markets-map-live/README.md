# 2026-10-20e — the world markets map goes live (the Insights world-stock-markets geographic layer)

The `feature/insights-world-map` branch (4 commits, all §9 gates green
pre-merge) merged to `main` as `5d6c5ad` and deployed: **currena-api
`1f96deaa-e610-4387-92a2-d999cc446a16`** (the built SPA + the new
packages/core schema) and **currena-markets `6465694c-8e56-4726-8e5c-d011e9f35c99`**
(the D1/D2 freshness fields join the stored contract — `open` +
`quoteTime` start landing in `insights:markets:v1` with the 23:30 UTC
run; the pre-deploy snapshot honestly renders Closed until then, per D2).

## Live captures (currena.ir, 2026-10-20 ~15:40 UTC)

- `en-1440-map.png` — the map layout: 173-path Natural-Earth land, the
  nine west-to-east cards over leader lines, halo'd dots, the Today /
  1 month / 1 year switch, the one-row legend, "Updated 11:30 PM UTC ·
  16 h ago". VLM pass: land + cards + dots + switch + legend all
  readable, no overlap/clipping defects.
- `fa-1440-map.png` — the same at 1440 in Farsi: RTL page, LTR
  (unmirrored) map, Persian digits (۵ از ۹ بازار امروز مثبت), U+2212
  minus, ٪ glyph.
- `en-390-list.png` — the phone list layout: the small card-less map
  (container < 960px), the explorer list below carrying the entries
  (M13's dot-tap target), zero horizontal overflow.

## DOM assertions behind the captures

173 `[data-iso]` land paths · exactly 9 tinted (`s-r`/`s-fl`/`s-sf`/`s-sr`
matching the served rows: DAX −1.18% strong fall, KOSPI +1.76% strong
rise…) · 9 dots + 9 halos + 9 leader lines · 9 cards in §4.1 order ·
`/api/insights/markets` 200 with 16 rows · zero console/page errors.
