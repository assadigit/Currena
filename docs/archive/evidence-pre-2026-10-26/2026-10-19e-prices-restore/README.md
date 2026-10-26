# Evidence — 2026-10-19e: the prices board returns to public mode

The owner: "Still there aren't GOLD BITCOIN SILVER price, like it used to.
please read previous version you will findout there was a dedicated nice
section with images for it."

## What this folder proves

1. **api-before-28-readings.json** — the production public projection BEFORE
   the restore: 28 readings, all four price tiles (brent, gold-usd,
   silver-usd, btc-usd) absent (the Oct-19b licence-cautious hide; the
   `+prices:none` etag suffix refers to the hourly live-prices key, which
   public mode never reads — it is NOT the prices-board state).
2. **api-after-32-readings.json** — the same endpoint AFTER the rebuild: 32
   readings; brent 109.13, gold 4,164.70, silver 57.27, bitcoin 81,180.14
   (US$), displayMode public, ruleVersion 2, zero hidden-id leaks.
3. **prod-prices-desktop.png / prod-prices-mobile375.png** — the live
   `#insights-prices` section on currena.ir/insights: the four tiles render
   WITH their images (`/assets/icons/{oil,gold,silver,bitcoin}.png` — the
   images never left production; the tiles were data-starved), each with
   7-day/30-day changes, status (oil = expensive), context sentence and
   record notes. Mobile 375 px: scrollWidth 375 (no overflow), 4 tiles.
4. The money panel's "Petrol and transport" row returned with brent
   (verified in the live DOM: "Petrol and transport — Becoming more
   expensive — US$109.13 Oil price (Brent)") — data-driven, as diagnosed in
   the 2026-10-19d investigation.

## The change (one commit, 81ca3e3 before docs)

- `scripts/generate-indicators-registry.ts`: `OWNER_PUBLIC_DISPLAY_OVERRIDE`
  for exactly {brent, gold-usd, silver-usd, btc-usd} — lifts ONLY the
  public-display disposition of the worst-leg walk, with a dated, honest
  evidence trail appended to every card. The underlying licence facts stay
  verbatim; the Yahoo legs stay in the engine (the private page is
  unchanged); the world boards (markets/fx) and all other non-'yes'
  verdicts stay hidden.
- The three generated JSONs regenerated (hidden set 24 → 20) — the audit
  cross-check test, the LR-02 pin and T-15 all stay consistent by
  construction.

## Gates at close

- tests 1,419 green (core 191 · scraper 67 · insights 462 · markets 13 ·
  api 233 · web 453) — +1: the new pin that the four owner-directive tiles
  must never be re-hidden
- typecheck 6/6 · lint 0 errors (15 pre-existing advisories) · copy:audit
  clean
- budgets held (entry 294.78 kB raw / 89.39 gzip vs 296/89.5; Insights
  lazy 594.68/142.02 vs 604/142.8)
- T-15 in SITE_MODE=public: PASSED — 20 indicators + the markets/fx boards
  hidden; every displayed source is public-display-ok
- deploy currena-api `d40211f9-970b-4756-970c-8424f6062b20`; public
  projection rebuilt from the stored snapshot (52 → 32 public-ok; KV ops
  2 reads / 1 write)
- production browser: zero console/page errors; 375 scrollWidth === 375
