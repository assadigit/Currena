# The yearly lens — verification record (owner round 5)

Round 47 / owner round 5: "add yearly view to the stocks indexes." Branch
`feature/markets-yearly-lens` (off main @ ad89404). The feature is a
contract + pipeline change (a real `chg1y`), so the verification covers
both the data layer and every view surface.

## Gates (all green)

- typecheck 6/6 · lint 0 errors / 15 baseline advisories
- tests: 1,612 green (core 191 · scraper 67 · insights 466 · markets 13 ·
  api 238 · web 637) — +6 new guards this round
- copy:audit clean (2,215 entries; round `markets-yearly-lens-2026-10-19`)
- build + budgets: entry 295.29/88.81 (untouched); Insights lazy
  **660.88/158.00** vs 661.00/158.50 — held, no bump

## The data layer

- `chg1y` (OPTIONAL) added to `MarketEntrySchema`; `buildEntry` derives it
  via `yearAgoAnchor`: the strict 365-day rolling anchor, falling back to
  the series' earliest close when it falls inside the ±15-day band around
  the target (the `yoyPctSeries` year-on-year convention) — because both
  free providers cut history at exactly one year (verified live
  2026-10-19: EODHD free and Yahoo `range=1y` both start at the year-ago
  date). A window starting closer than 350 days omits the field.
- Yahoo fallback fetch moved `range=1y` → `range=2y` (live check: 251 →
  501 points; the yearly anchor always has real closes with margin).
- Unit guards: `markets.test.ts` pins the strict anchor, the one-year-window
  fallback (260 trading days), and the <350-day omission (240 days); the
  Yahoo URL test pins `range=2y`; the api route test asserts the 16-market
  payload stays under 13 KB WITH `chg1y` derived on every row.

## Local harness (wrangler dev 8787, fresh build, SW unregistered + caches cleared)

KV seeded with the LIVE production markets snapshot enriched with REAL
`chg1y` values computed exactly as the pipeline will (Yahoo `range=2y`
closes → `parseYahooChartResponse` → `yearAgoAnchor` → round2, anchored at
each row's own `asOf`): TAIEX +70.4, KOSPI +51.2, IBOV +44.5, N225 +35.3,
TSX +18.8, NDX +18.4, S&P 500 +15.5, FTSE +15.3, DOW +13.2, STOXX 50
+9.8, DAX +5.6, ASX 200 −2.9, CAC −2.8, SSE −5.1, Nifty 50 −9.5 — and
Hang Seng deliberately left WITHOUT `chg1y` to reproduce the honest
backfill state in the same capture.

### EN desktop 1600

- The radiogroup renders FIVE lenses — Daily | Weekly | Monthly |
  Quarterly | **Yearly** — Quarterly checked on load (the NORMAL lens,
  owner round 44, unchanged).
- Clicking Yearly: breadth heading "Yearly performance", coverage note
  **"15 of 16 indices carry this period."**, movers "Selected period:
  Yearly" — Biggest gain TAIEX +70.4%, Biggest fall Nifty 50 −9.5% (the
  true chg1y extrema, matching the seeded values); the Hang Seng tile
  shows the honest "—" with the aria "no data for this period over
  Yearly"; TAIEX tile +70.4%.
- Performance map on Yearly: TAIEX +70.4% ▲, Hang Seng — (neutral), the
  legend present.
- Full table: headers Market · Today · 1 week · 1 month · 3 months ·
  **1 year** · From 52-week high · Trend · Status · Last close; S&P 500
  +15.5% in the 1-year column; Hang Seng — in it.
- VLM acceptance (list + heatmap + table): all checks PASS (five pills
  with Yearly active; counts; tiles; the em-dash; the 1 year column; no
  clipping/overlap).
- Zero console errors, zero page errors.

### fa RTL desktop 1600

- dir=rtl lang=fa; the radiogroup aria is «انتخاب بازهٔ عملکرد شاخص‌ها»;
  five pills روزانه | هفتگی | ماهانه | سه‌ماهه | **سالانه**.
- «سالانه» selected: breadth «عملکرد سالانه» with ۱۱ مثبت / ۴ منفی /
  بدون تغییر; coverage «۱۵ شاخص از ۱۶ شاخص دادهٔ این بازه را دارند.»;
  movers caption «بازهٔ انتخاب‌شده: سالانه»; tiles render Persian digits
  (تایکس +۷۰٫۴٪); the Hang Seng tile «—» with «این بازه داده ندارد».
- Table headers carry «بازده یک سال» between «بازده سه‌ماهه» and «فاصله
  از اوج یک‌ساله»; the local-currency note renders unchanged.
- VLM acceptance: heading/badge, the breadth strip + coverage note,
  movers, pills, RTL, Persian digits — all PASS.

### Mobile 390 (EN + fa)

- Zero horizontal overflow in both locales (scrollWidth === clientWidth);
  the five-pill radiogroup fits (no clipped pills); tiles render the
  yearly values; VLM: pills with «سالانه» active, Persian digits, no
  cutoff — PASS.

## Backfill expectation (production)

Existing stored rows lack `chg1y` until each market's next close (the R5
same-date stability rule holds the old row verbatim), so the Yearly lens
opens with dashes + the coverage note for at most a trading day or two
per market — then the nightly cron rewrites every row with real yearly
values. This is the same honest-roll-in behavior round 46's weekly lens
used. (The EODHD one-year window lands inside the ±15-day tolerance band,
so the anchor rule fires on the primary provider too.)

## Screenshots

`docs/insights/screenshots/yearly-lens/` — en-desktop-list-1600,
en-desktop-heatmap-1600, en-desktop-table-1600, fa-desktop-list-1600,
fa-desktop-table-1600, en-mobile-390, fa-mobile-390.

## Delivery state

See DEPLOY.md CURRENT DEPLOYMENT after the round's deploy.
