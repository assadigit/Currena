# Evidence — 2026-10-20c · the gold/silver analysis charts grow the 10-year view (the owner's request)

The owner, one message after the verdict-chip redesign shipped: **"Add 10
year View of the gold and silver price as well."** — the metals' Estimation
chips ("Conditions right now" strip) offered only Quarter · 1 year · 5 years;
the decade was missing, although the history feed already serves the complete
10-year daily series for both metals.

## What changed (UI-only — no copy keys, no data, no scoring)

- `apps/web/src/components/insights/TrendChart.tsx` — the shared trend panel:
  - `TrendRange` grows `'10y'` (3653 days — the details panel's exact 10-year
    window incl. leap-day slack); `TREND_RANGE_COPY_KEY` maps it to the
    EXISTING `range10y` copy key ('10 years' / «۱۰ سال») — zero new strings.
  - NEW optional `ranges` prop (defaults to the old Quarter · 1y · 5y list),
    so ONLY callers that opt in grow the decade chip. `TREND_RANGES` (the
    full ordered list) is now exported as the canonical order/test seam.
  - The money panel and every other TrendPanel caller are UNCHANGED (the
    owner asked for gold and silver specifically).
- `apps/web/src/components/insights/signals/verdict.tsx` — `StripRange`
  grows `'10y'`; `MetalTrendChart` passes
  `ranges={['quarter', '1y', '5y', '10y']}` so both metals' analysis chips
  offer the decade. Plottability is gated by the same ≥2-points rule as the
  sibling chips (the feed's 2514/2513-point series make the window always
  plottable in practice).

## Pre-flight data check (production)

`/api/insights/gold-usd/history` → **2514 points, 2016-10-18 → 2026-10-16**,
last 4164.70; `/api/insights/silver-usd/history` → **2513 points**, same
span, last 57.27. The decade is fully served — no API change needed.

## Verified live (agent-browser against production, deploy `4e8a54e0`)

- Served `Insights-MDaP0MNn.js` byte-identical to the local build
  (sha256 `39d1e4eab4106b0ab2ffc732f94dad6235907df9dabf911e2763f22647220b8e`,
  recorded in `prod-Insights-chunk.js.txt` — inert `.txt`, never linted).
- **EN desktop 1440** (`01-en-desktop-10y.png`): both chips show FOUR range
  buttons — Quarter · 1 year · 5 years · **10 years** — clicking 10 years
  activates it (aria-pressed), redraws the plot across the full decade
  (X ticks "Oct 2016 · Oct 2021 · Oct 2026"), and the signed window delta
  reads **+230.3% 10 years** (gold) / **+225.6% 10 years** (silver); the
  aria label becomes "Price history for gold, the last 10 years". Plot
  stays 208px (h-52); the header price keeps its muted ink (US$4,165 /
  US$57.27) — the trend remains the emphasis.
- **Money panel untouched**: its trend charts still render exactly three
  chips (Quarter · 1 year · 5 years) — verified on the same page load.
- **EN mobile 375** (`02-en-mobile375-10y.png`): same anatomy, same four
  chips, 10 years active on both metals, plot h-40 (160px) × 205px,
  scrollWidth 375 = no horizontal overflow.
- **fa RTL mobile 375** (`03-fa-mobile375-10y.png`): chips «سه‌ماهه ·
  یک سال · پنج سال · **۱۰ سال**»; delta in Persian digits «+۲۳۰٫۳% ۱۰ سال»
  / «+۲۲۵٫۶% ۱۰ سال»; aria «روند قیمت طلا در ۱۰ سال گذشته»; X ticks render
  the Jalali calendar (مهر ۱۳۹۵ → مهر ۱۴۰۵); dir=rtl, no overflow.
- **fa RTL desktop** (`04-fa-desktop-10y.png`): the same decade view in the
  RTL chip anatomy.
- **Details panel untouched**: the per-card HistoryChart keeps its own
  10y/5y/1y zoom (it already had the decade).
- Zero page errors / zero console errors across all four passes.

## Files

- `01-en-desktop-10y.png` — EN desktop 1440, both metals on 10 years.
- `02-en-mobile375-10y.png` — EN mobile 375, both metals on 10 years.
- `03-fa-mobile375-10y.png` — fa RTL mobile 375, «۱۰ سال» active, Jalali ticks.
- `04-fa-desktop-10y.png` — fa RTL desktop, both metals on 10 years.
- `measurements.txt` — the raw measured values from the browser session.
- `prod-status.txt` — the served Insights page shell (HTTP 200).
- `prod-Insights-chunk.js.txt` — the production lazy chunk capture
  (byte-identical to the deployed build; renamed `.txt` per the 2026-10-20b
  lesson — minified captures must never enter the linted tree as `.js`).

## Gates (pre-deploy)

`copy:audit` clean · full workspace tests green (exit 0 — web 461, api 237,
insights/core/scraper/markets as before, 1,431 total) · typecheck 6/6 ·
lint 0 errors / 15 accepted advisories · budgets held — entry
295.15/88.76 kB gz (budget 296/89.5); **Insights lazy 593.58/141.30 kB gz**
(budget 604/142.8; +0.07 kB gz for the fourth chip).

## Deploy

currena-api **`4e8a54e0-fda4-4ce7-bc1e-9ba245c1bfc9`** (SITE_MODE=public
untouched; currena-markets untouched `9b5ff7e0`).
