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

## Screenshots (local harness)

`docs/insights/screenshots/yearly-lens/` — en-desktop-list-1600,
en-desktop-heatmap-1600, en-desktop-table-1600, fa-desktop-list-1600,
fa-desktop-table-1600, en-mobile-390, fa-mobile-390. (Production captures
below carry the `prod-` prefix.)

## Production (post-deploy live verification, 2026-10-19)

Deployed through the established pipeline with the owner-provided Cloudflare
credentials (env-only, never persisted): `pnpm --filter @currena/web build`
→ `pnpm --filter @currena/api exec wrangler deploy` → currena-api
**96c4a467-1d2b-49d8-bfb7-748ca30d3486**; `pnpm --filter @currena/markets
exec wrangler deploy` → currena-markets **18cf040e-70f0-4f08-8582-a0b3e0c2d29e**
(both crons `30 23 * * 1-5` / `30 1 * * 2-6` re-armed; `EODHD_API_TOKEN`
secret verified present, unchanged). Deterministic rebuild of main @ f0bfa83:
served chunks exactly `index-Blojx-aS.js` + `Insights-BAeV8pAq.js`, budgets
re-checked 295.29/88.81 and 660.88/158.00 — held.

Live checks (currena.ir, fresh profile, SW unregistered + caches cleared
first; workers.dev health 200 on the same build):

- **EN desktop 1600** — the five-pill radiogroup (Daily | Weekly | Monthly |
  Quarterly | Yearly), Quarterly default; Yearly click → "Yearly
  performance", breadth zeroed (0 up / 0 down / 0 flat), coverage note
  **"0 of 16 indices carry this period."**, movers "No data for this period
  yet.", every list row an honest "—" with the aria "…: no data for this
  period over Yearly, …", the 52-week context intact per row; the full
  table carries the **"1 year"** column between "3 months" and "From
  52-week high" with em-dashes while the other columns show live values;
  the performance map's cells all read "no data for this period over
  Yearly". VLM acceptance 4/4 PASS (pills + active state, honest no-data
  surface, no visual defects, 52-week context).
- **fa RTL desktop 1600** — «انتخاب بازهٔ عملکرد شاخص‌ها» with
  روزانه | هفتگی | ماهانه | سه‌ماهه | **سالانه**; «عملکرد سالانه»,
  Persian digits throughout, «۰ شاخص از ۱۶ شاخص دادهٔ این بازه را دارند.»,
  movers «بیشترین رشد/افت: داده‌های این بازه هنوز در دسترس نیست.», the
  local-currency note unchanged. VLM acceptance 4/4 PASS (RTL, Persian
  digits, no clipping, production quality).
- **Mobile 390 (fa + EN)** — zero page-level horizontal overflow in both
  locales; the hero carousel still opens Global-first with the swipe cue;
  fa: all five pills fit in-row (291px) with «سالانه» active + the fa
  coverage note; EN: the pill row is the approved `overflow-x-auto`
  segmented control — at rest the Yearly pill is partially visible and a
  row swipe reveals it fully (measured: row 326px client / 354px content,
  scrollLeft 28 → Yearly fully visible, `aria-checked` pill reachable —
  the same rest-state clipping as this round's own local en-mobile-390
  capture, i.e. the shipped round-5 build's designed behavior, not a
  deploy regression).
- **Hero regression (round 4)** — two signals panels live ("World signals"
  with the production markets bullet + "Australia signals" with real
  production data: "Inflation & rates · Critical: 2 of 2…", "Households ·
  Stressed: 2 of 5…", "Trade & currency · Stable"); no rule toggle on
  either card.
- **Zero console errors, zero page errors** on every capture.

**Backfill watch:** the stored markets snapshot at deploy time was written
by the pre-round-5 markets worker (2026-10-17T17:48Z, no `chg1y` on any
row), so the Yearly lens opens on the honest dashes + "0 of 16" coverage
note until the NEW currena-markets worker's first cron run — tonight
23:30 UTC (a Monday; `30 23 * * 1-5`) — rewrites every row with real
yearly values, with the 01:30 UTC retry covering a bounced write. This is
the same honest roll-in round 46's weekly lens used; verified against the
live `/api/insights/markets` response (16 rows, `chg1y` absent on all,
as designed for the pre-backfill window).

Production screenshots (`prod-` prefix, same folder):
prod-en-hero-au-signals, prod-en-yearly-list-1600,
prod-en-yearly-table-1600, prod-en-yearly-heatmap-1600,
prod-fa-yearly-1600, prod-fa-mobile-yearly-390, prod-en-mobile-hero-390,
prod-en-mobile-yearly-390, prod-en-mobile-yearly-scrolled-390.

## Delivery state

- **Git: DELIVERED.** `feature/markets-yearly-lens` @ 80e15bd pushed and
  fast-forward-merged to main (ad89404..80e15bd); GitHub CI on the main
  push: **completed / success**.
- **Production deploy: DEPLOYED + LIVE-VERIFIED 2026-10-19** (see the
  Production section above) — all THREE commands ran with the
  owner-provided Cloudflare credentials: web build → currena-api
  `96c4a467` → currena-markets `18cf040e` (the worker whose cron computes
  `chg1y`; both crons re-armed, `EODHD_API_TOKEN` verified present and
  unchanged). The nightly 23:30/01:30 UTC runs now backfill `chg1y` per
  market as each next close lands — the same honest roll-in round 46's
  weekly lens used. Rollback: `wrangler rollback` on currena-api (previous
  version b1067b0a, the australia-signals round) or redeploy any prior
  main commit.
