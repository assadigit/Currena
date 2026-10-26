# Evidence — 2026-10-24b: the market view switch grows the weekly and monthly lenses

Owner request (verbatim, this session):

> "Ok now they're back add monthly and weekly views of how percentages changed
> as well. I mean for here: [the Insights page's market view switch radiogroup]"

## What shipped (round 46)

- **Contract**: `MarketEntry` gains OPTIONAL `chg1w` — last close vs the last
  close on/before the same date one week earlier (the same rolling-anchor
  rule chg1m/chg3m use). `chg1m` (1-month, already in the contract for the
  currencies rules) now also serves the monthly lens.
- **Compute**: `buildEntry` derives `chg1w` (7-day anchor) and keeps the
  omit-when-missing rule (never a guess).
- **UI**: the view switch reads **Today | 1 week | 1 month | 3 months |
  From 52-week high** (ascending duration; default stays the NORMAL 3-month
  timeframe, owner round 44). A row without a lens yet renders the honest
  dash (—) and no direction glyph.
- **Table** (desktop + mobile list): two new columns beside Today.
- **CSV** (Tools menu): Week/Month columns APPENDED at the end (stable
  positional API for scripts); a missing lens exports an empty field.
- **Full export** (MD/TXT/CSV/XLSX): the markets sheet gains the two lenses
  on the EXISTING flat slots 7 (`change7d`) and 10 (`chg1m`) — no flat
  position moves.
- **Data**: `markets-run` held every row (R5 same-date stability — the
  weekend closes are identical to the stored ones), so the lens fields were
  backfilled by the new one-off `markets-backfill` runner: resolve with
  prev=undefined (fresh provider answers, closes measured 0.000% from
  stored), write-only-if-changed against the true stored snapshot. The KV
  key was never deleted (no "being prepared" window).
- **Budgets**: route payload budget 12 KB → **13 KB** (live after backfill
  12,225 B; realistic fixture 12,370 B; the old ceiling left 63 B of slack).
  Insights lazy chunk 608.00 → **609.00 kB raw** (measured 608.78/145.54 gz
  — gzip-neutral vs the 145.60 budget).

## Deployed

- `currena-markets` version `0135290c-b78a-4537-9223-b079fdb73df9` (cron
  runs now compute chg1w on every rewrite).
- `currena-api` version `36a4eeab-fb2a-4926-918b-b3400f520a92` (serve path
  passes chg1w through; the built SPA rides the same deploy).
- KV `insights:markets:v1` backfilled (runDate 2026-10-17, asOf 2026-10-16
  Friday closes, generatedAt 2026-10-17T17:48:20Z, payload 12,225 B).

## Verified (browser, currena.ir/insights)

- EN: the radiogroup offers Today / 1 week / 1 month / 3 months / From
  52-week high; default 3 months checked.
- 1-week lens, tile values vs `GET /api/insights/markets` (all match):
  Nikkei −5.4 (API −5.37) · ASX +1.0 (1.03) · KOSPI −14.5 (−14.46) ·
  Hang Seng −0.1 (−0.1) · Shanghai −2.6 (−2.56) · TAIEX −4.5 (−4.47) ·
  Nifty +2.8 (2.78).
- 1-month lens, tile values vs API (all match): Nikkei +2.2 (2.19) ·
  ASX +1.3 (1.27) · KOSPI −15.6 (−15.63) · Hang Seng −2.1 (−2.13).
- Full table (desktop ≥900px): 9 columns — Market | Today | 1 week |
  1 month | 3 months | From 52-week high | Trend | Status | Last close;
  16 rows worst-first (KOSPI first); KOSPI row +2.1 / −14.5 / −15.6 /
  −16.9 / −37.8 — all matching the API.
- FA (RTL): the switch reads امروز | یک هفته | یک ماه | سه‌ماهه | فاصله از
  اوج یک‌ساله; tiles render Persian digits (−۵٫۴٪) matching the API; the
  table headers read بازده امروز / بازده یک هفته / بازده یک ماه / …
- 375px: scrollWidth 375 === 375 (no overflow); the radiogroup scrolls
  inside its own container; 1280px clean. Zero console errors. Zero page
  errors.
- VLM visual QA (2 screenshots): EN desktop — five-option switch with
  "1 week" selected, signed percentages + arrows, no layout defects;
  FA mobile 375 — five Persian options, correct RTL + Persian digits, no
  overlap/cut-off/overflow.

## Files

- `api-before-round46.json` — the live snapshot before this round
  (generatedAt 2026-10-17T16:46:43Z, 12,018 B, no chg1w).
- `api-after-chg1w.json` — after the backfill (16/16 rows with chg1w +
  chg1m, 12,225 B).
- `en-desktop-1280-weekly.png` / `en-desktop-1280-table.png`
- `fa-desktop-1280-weekly.png` / `fa-desktop-1280-table.png`
- `fa-mobile-375-weekly.png`
