# Evidence — 2026-10-19f: the sparklines draw honest trends

The owner (screenshot `before-owner-screenshot.png`, the USD→IRT card on the
converter home): "The graph seems irregular and like a placeholder or
buggy." — the sparkline was a violent, perfectly regular sawtooth.

## Root cause (production forensics, pre-fix)

`/api/history?source=tgju` (`api-before-history-noise.json`): 240 recorded
generations, window 2026-10-13T07:54 → 2026-10-15T20:42, ALL distinct:

- **TGJU re-quotes jitter on nearly every 6-minute tick** — median per-tick
  move 0.01–0.04% (EUR/GBP/CHF changed on 229–235 of 239 ticks). The
  exact-value dedup recorded every tick, burning the 240-slot window in
  ~24 h of noise.
- **The USD quote itself bobs between two levels ~0.375% apart** (3.747e-6
  ×32 and 3.733e-6 ×30 — i.e. 266,888 / 267,882 tomans): 155 transitions,
  38 clean a-b-a patterns. A genuinely served quote — never rewritten here.
- **The UI drew raw points min-max-normalized** — last 40 (converter card)
  / all 240 (result popup, /live-rates board) — so sub-percent noise filled
  the full plot height: the sawtooth. The real signal (USD +3.1% over the
  window) was invisible.

## The fix (one commit, `9724040` before docs)

1. **`apps/api/src/history.ts`** — a generation records only when a rate
   moves ≥ `HISTORY_RECORD_DEADBAND` (0.05%) vs the last RECORDED level
   (hysteresis; rate-set changes always record). Jitter never accumulates
   into a record; genuine drift records at its first crossing.
2. **`apps/web/src/lib/live-rate.ts`** — `bucketMean(series, TREND_BUCKETS
   = 48)`: the DRAWN polyline is bucket-averaged; trend chips, ranges,
   check counts and the delta-vs-previous stay computed from the RAW
   series. Applied at all three call sites (LiveRateLine, ResultPopup,
   LiveRates board) — the drawn window now spans the whole recorded
   history, not the last 40 ticks.
3. **`apps/web/src/components/Sparkline.tsx`** — honest amplitude: the
   plot domain pads to ≥2.5% of the series' mid-level (always containing
   the data), so sub-noise wiggles render proportionally calm and real
   trends still fill the plot.
4. **One-time KV prune** (`/home/z/currena-tools/prune-history.py`, run
   2026-10-16T23:49Z via the KV REST API): the stored window re-filtered
   with the SAME deadband — tgju 240 → 188 gens (USD 259,600 → 267,900,
   the real −3.10% rate move = the +3.1% price rise); frankfurter already
   clean (21 gens, no write).

## What production shows now (`api-after-history-pruned.json` + screenshots)

- `prod-home-converter.png` / `prod-fa-mobile375.png` — the owner's exact
  card (fa, 375 px, "۱ USD = ۲۶۷٬۹۰۰ تومان (IRR)" + «بدون تغییر»): the
  sparkline is a smooth, gently-rising line — the real multi-day trend.
- `prod-result-popup.png` — "TREND: LAST 189 UPDATES · +3.2% · low 256,895
  · high 267,900" with the honest footnote, calm chart.
- `prod-live-board.png` / `prod-live-cards.png` — the /#/live-rates board:
  USD +3.2%, AUD +1.92%, EUR +3.22% — smooth trend lines, 8 sparklines
  rendered.
- Zero console/page errors; 375 px scrollWidth === 375 (no overflow).

## Gates at close

- tests 1,431 green (core 191 · scraper 67 · insights 462 · markets 13 ·
  api 237 · web 461) — +12: the deadband (sub-band no-op / at-band record /
  hysteresis / rate-set change / cap), bucketMean (passthrough / exact
  split / mass conservation / alternation melt / empty), Sparkline
  (calm band / full swing / trend visible)
- typecheck 6/6 · lint 0 errors (15 pre-existing advisories) · copy:audit
  clean
- budgets held (entry 295.15 kB raw / 88.76 gzip vs 296/89.5; Insights
  lazy 594.68/141.60 vs 604/142.8)
- deploy currena-api `ed79e2cc-fb2f-44ce-bcad-00d73dc57eed` (cron + KV +
  SITE_MODE=public intact)
