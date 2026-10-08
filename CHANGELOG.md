# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
as a private monorepo, releases are tracked by date and Workers version rather
than a semver tag.

## [2026-10-08] — I15 the owner-spec wave: question gauges, the prices board, and the details panel

Eighth round — the uploaded 2026-10-08 owner specs (`01-insights-ui-ux-instructions.md`
+ `02-insights-data-api-spec.md` + `dollar_basket.py`) implemented end to end:
the data/API spec's new indicators, the Currena dollar basket, per-series
freshness limits and question gauges; the UI spec's v1 blocks (hero verdict
meters, prices board, indicator lanes, compact rows + alert cards, the
side-panel/bottom-sheet details, states, notices). The v2/v2-gated blocks
(T1 connection cards, S1–S3 signals) deliberately NOT built — the spec says
wait. Leftover backlog closed first: #38 Settle multi-tab storage sync +
#29 web-test remainder (rate-history/recent-pairs/display/parity).
Tests 634 → **708 green** (core 183 · scraper 67 · insights 165 · api 119 ·
web 174).

### Added

- **New indicators (11)** — `fed-target` (FRED DFEDTARL/U midpoint, shown as
  the 25bp corridor "3.50–3.75%"), `ecb-dfr` (ECB Data Portal DFR), `us-cpi-yoy`
  (CPIAUCSL 12-month change), `nfci` (Chicago Fed NFCI), `dollar-basket`
  (the Currena dollar basket — `dollar_basket.py`'s recipe ported to
  `src/basket.ts`: DXY weights, 50.14348112 scaling, selftest transplanted),
  `eur-usd`, `au-home-loan` (RBA F6 FLRHOOTA by Series ID — the stable
  identifier; venue-verified 6.21%), `au-wage-growth` (ABS WPI + the new
  **below-aux rule** comparing wage growth with CPI), `au-rent-yoy` +
  `au-petrol-yoy` (ABS monthly CPI Rents/Automotive-fuel — series identified
  by data signature + published-figure cross-checks), `btc-usd` +
  `copper-usd` (gold-api BTC/HG live prices; HG converted to USD/mt to join
  the World Bank history). **`dollar-broad` retired** (DTWEXBGS lags ~5d
  upstream; the basket replaces it). TGJU retired from Insights (unverified
  licence) — gold now from gold-api XAU like silver; the TGJU cross-check
  row retired with it (Bitstamp remains the BTC check).
- **Question gauges** (`src/gauges.ts`) — the spec §4 regime: each lane
  group IS a gauge (share of members in alert → steps 1–4), a region's
  verdict = rounded average of gauge steps escalated when any gauge sits at
  step 4; `summarizeByGauges` writes the same wire shape the old flat-share
  summary did, so /admin and the CSV export agree with the hero by
  construction. 16 global + 13 Australian voting members, exactly the
  spec's v1 lists.
- **Per-series freshness limits** (`staleAfterDays` on definitions, data
  spec §3) — Brent 12 (the EIA weekly-batch false alarm, fixed at the
  root), NFCI 14, ECB 7, Fed 5, basket/EUR 4, metals/BTC/copper 2, F6 70.
  Spec numbers that assumed RELEASE-date aging were adjusted to the
  engine's OBS-date aging with documented reasons (us-cpi 75, ABS monthly
  95, WPI 200, ABS quarter-start items 215 — the latent Oct-8→28 window
  the 190d quarterly grace false-alarms in).
- **moveScore (Block H3)** — the big-mover z-score at ingest ((latest
  change − mean)/std over the 10y window; 30d basis for dailies, 1-period
  for slower series; ≥30-change floor; stale items never carry it) + the
  ONE hero callout replacing the "biggest 30-day changes" list.
- **I15 UI blocks** — `HeroBlock`/`VerdictMeter` (H1: four-step segmented
  meters + verdict word + plain sentence + "n of m in alert" + alert-chips
  by name H2 + the Australia-first order with the swap setting),
  `NextUpStrip` (H6: next-3 events + full calendar grouped by month with
  merged duplicate titles + Gregorian hover), `PricesBoard` (PB1–3: six
  price rows with units, position words, as-of dates, gold's USD+AUD line,
  the Bitcoin context ratios), `LaneSwitch` (L1: remembered
  Global|Australia, thumb-reachable sticky bar on phones), `AlertCard`
  (F1: accent border + tint, sparkline) + `CompactRow` (F2), `DetailsPanel`
  (F5: side sheet on wide screens, bottom sheet on phones, focus trap +
  Escape + focus return + scroll lock + deep links), the sticky section
  nav (P1: Status/Prices/Indicators/About with scroll-spy), SVG status
  icons (G5), the position-word bar with end labels + alert-zone tick
  (G9/F3), design tokens + four type roles + 7:1 secondary ink (G2/G3/G4),
  the FRED® notice + attribution lines (N1), ONE disclaimer line (N2), and
  `Data as of {date}` with the daily-snapshot tooltip (H4).
- **Consequence lines (F4 + data spec §6)** — state-keyed
  (`highRising/highEasing/typical/low/jumping`) plain-language lines with
  hedged wording, stated positions, ≤15 words: 39 indicators × 2 languages
  in the copy corpus; `consequenceLine()` picks by position band + 30-day
  direction with oneLiner fallback.
- **Backlog closes** — #38 Settle multi-tab `storage` sync
  (lib/settle-storage.ts, the alerts-store pattern; +9 tests) and #29's
  remainder (rate-history +17, recent-pairs +9, display/parity +6).

### Changed

- **Groups are questions now** (I15 restructure): borrowing-costs,
  prices-heat, market-stress, dollar-strength, growth-health,
  prices-board (not a gauge), au-inflation-rates, au-households,
  au-trade-currency — replacing the asset-class groups; brent/gold/silver/
  copper/btc/gold-btc/silver-btc live on the prices board (Brent keeps its
  25%/13w rule for its own row but is not a gauge member), iron-ore stays
  a trade-gauge member AND rides the prices board.
- **Copy corpus rewrite** — plain names first (F6: "What the US government
  pays to borrow for 10 years"), technical tags as small `ticker` labels
  (G8, isolated dir="ltr"), the old five-section detail panel reordered
  life-effects-first (F5), status word Warning→Alert (en) / هشدار (fa,
  kept), and every ui string for the new sections — en source of truth,
  fa native + shape-checked (1044 ZWNJ, Persian digits, no buy/sell
  wording per acceptance test 6 — the disclaimer reworded to match).
- **Ingest seeds accumulated daily history** for the live-priced rows
  (gold/silver/btc/copper) from the stored KV histories so 7/30-day
  changes are measurable (data spec §3 note); first runs degrade honestly
  (no changes until history accrues).
- **RBA parsing by Series ID** (parseRbaTableCsv seriesId option) — F6's
  FLRHOOTA matched the way external parsers do it; the title-match path
  stays for F1.1/F2/E2.

### Fixed

- **The Brent false-alarm** (production showed it stale at 2026-09-29 with
  data 8 days old): the 12-day freshness limit replaces the 3-day daily
  grace — EIA publishes daily Brent in weekly batches, "as of {date}" says
  so on the row (PB3).
- The ABSENT FRED notice (spec Block N1: "Check that the notice is present
  today. The screenshot shows no such notice") — now prominent in
  About-the-data with the terms link.
- Chart tick labels raised to caption size (F5) and the SR data table with
  them; the tooltip renders at the caption role too (G3: no visible text
  below the caption).

### Budget

- **Insights lazy chunk 133.85/38.88 → 235.80/61.92, budget 134/39 →
  240/64** — the bilingual corpus doubled (41 indicators × plain names +
  detail fields + state-keyed consequence lines × 2 languages), the
  side-panel/bottom-sheet architecture, the prices board + meters + lane
  switch, and the GAUGES table joining the chunk. ENTRY chunk untouched
  (290.12/87.76 vs 296/89.5) — the money page is protected. Justified
  above; the gate stays enforced in CI.

## [2026-10-08] — I14 rate-alerts wave

Seventh round of the day — the sandbox was RESET between rounds (the whole
`/home/z/currena` working copy wiped; re-cloned at `a6df82c` with a fresh
owner token, remote scrubbed). A full production QA matrix ran FIRST
against the live I13 Worker `69550e36` (entry asset byte-matched the last
recorded build): 30 insight cards, conversion 100 USD → 26,320,000 IRR,
CSV/ics/filter/shortcuts/deep-link all verified en/fa × desktop/375 ×
light/dark, zero console errors, zero overflow — one VLM contrast flag on
the converter's «از/به» labels REFUTED by measurement (6.1:1 AA). This
wave then ships the strongest remaining user-facing feature from the
I13 hand-off: **rate alerts**.

- **`@currena/core` alerts module** — the persisted alert shape (pair,
  direction, threshold, one-way `triggeredAt`/`triggeredRate` stamps),
  strict `parseRateAlerts` (unknown entries dropped, cap 20 — recent-pairs
  fail-open discipline), and the pure `crossesAlert` test: inclusive at the
  boundary (">= 280,000" fires AT 280,000), never re-fires once stamped.
  Platform-free like settle/split; +11 core tests.
- **Web alerts store** (`lib/alerts.ts`) — the browser side in
  snapshot-store's external-store shape (`useSyncExternalStore`): every
  surface (section row badge, dialog list, evaluation engine) reads ONE
  live state; `currena:rate-alerts` + `currena:rate-alerts-seen` in
  localStorage; **cross-tab `storage`-event sync** (the pattern BACKLOG #38
  wants for Settle, proven here first); +12 web tests including the
  storage-event suite.
- **App-wide evaluation** (`useAlertEvaluation`) — mounted in the App
  shell so alerts are checked on EVERY route, not just the converter:
  each snapshot-store emission (boot hydration, fresh fetch, degraded
  rung) re-evaluates every waiting alert through the same
  `liveRateView` honesty gate (unresolvable pairs never false-fire).
  Crossings stamp + persist (reload keeps the ✅ state, no re-fire —
  verified live) and feed a 6s toast (pair + threshold, "+N more" tail).
- **Converter section row + `A` shortcut** — the one-tap door between the
  converter card and the pair chips: 🔔 title, live waiting/triggered
  counts (Persian digits in fa), an unseen-triggered badge with the
  one-way seenAt stamp (a reload never re-nags), and the `A` kbd pill
  (desktop-only, the same guard family as Insights' / J K — typing,
  modifiers and open dialogs all opt out).
- **AlertsDialog (lazy chunk, 7.00 kB / 2.59 kB gz)** — create + review +
  delete in one overlay (ResultPopup a11y pattern: role=dialog,
  aria-modal, Escape, backdrop click, initial focus). The create form
  pre-fills the converter's current pair, mirrors the current live rate
  under the target input, parses Persian digits + thousands separators
  (AmountInput's parser), and an above/below segmented control (radiogroup).
  List rows are honest per alert: ⏳ waiting (with the live rate) or
  ✅ triggered (rate + relative time). The footer says what alerts ARE:
  "Checked while Currena is open — no background notifications" (fa:
  «هشدارها فقط زمانی بررسی می‌شوند که کورنا باز باشد»).
- **26 new copy strings × en/fa** (native Farsi, «نرخ هدف», «بالاتر برود
  از», «فعال شد در ۲۶۳٬۲۰۰», «۱ دقیقه پیش» …).
- **Contrast fixes found by measurement during QA** — the first selected-
  radio styling (white on `currena-blue`) measured **2.35:1** dark and the
  first badge pill (white on `currena-warning`) 2.78:1; both now follow the
  I6-audited pattern (tinted surface + `-deep` ink token, dark badge
  `#1A222E` on `#FF8080`): re-measured **8.94:1** and **6.59:1**. VLM
  PASS ×2 (fa 375 dark dialog + section row); converter + insights
  regressions green, zero console errors, zero 375px overflow.
- **Bundle budget: held WITHOUT a bump** — the dialog is a lazy chunk, so
  the entry actually DROPPED to 290.12 kB / 87.00 gz (I13: 295.11/88.55,
  budgets 296/89.5); Insights untouched 133.85/38.88 (budgets 134/39).
  Tests **611 → 634 green** (core 183 · scraper 67 · insights 132 ·
  api 119 · web 133).

## [2026-10-08] — I13 data-portability & power-reader wave

Sixth round of the day — and the deploy round: the owner pushed the
**26-commit stack** (I7 share/print/chart/CI/alerting + I8 findability +
I9 zoom + I10 personal + I11 live-rate + I12 resilience, `2803932..7467853`)
and the Worker went out at version `dbccaed3` — production smoke green
(health ok, 30 readings, frankfurter cache age 523 s reports **fresh:
true**, the incident window is closed at the root). Post-deploy QA walked
every I7–I12 feature live in the full matrix (fa/en × desktop/375 ×
light/dark): share deep-links open+scroll+focus, chart tooltip + keyboard
stepping, zoom ranges, watchlist pins, reading progress, LiveRateLine
always-on rate, popular/recent pairs, VLM PASS ×2, zero console errors,
zero 375px overflow. This wave then adds the Insights power-reader set:
the snapshot **CSV export** (data portability — localized headers over
ASCII machine-readable values, OWASP formula-injection guard), **j/k
keyboard card-walking** (Gmail muscle memory, pairs with I9's "/" search,
respects the active filter), the **remembered chart zoom** (a chosen
10y/5y/1y range persists across visits — plottability still rules per
series), and a **shortcut legend** in the filter bar (kbd pills,
desktop-only). Plus two BACKLOG hygiene closes: #30 `splitEvenly` →
core (typed `SplitError`, exact-sum largest-remainder, +7 tests) and
#32 parser hardening (batch line/char bounds with typed `BatchError` +
localized toasts; calc accepts NBSP/CR/LF whitespace + unary plus;
typed `too_deep` guard replaces the bare native RangeError on
pathological nesting). Tests 585 → **611 green** (+15 core, +11 web).
Insights chunk 128.42 → 133.82 kB raw / 38.87 kB gz — budget consciously
bumped 132 → 134 kB (gzip still under 39; the growth is the export's
localized column wording, not logic). Entry chunk untouched at
295.11/88.55.

### Added
- **Insights snapshot CSV export** (`apps/web` insights-csv.ts +
  AboutTheData): "Download the data (CSV)" — 12 stable columns (id,
  indicator, ticker, value, unit, status, 7d/30d change, 10-year
  position, as-of, snapshot time, source) in snapshot order; values are
  plain ASCII numbers (period decimal, no separators — parses as numbers
  in ANY spreadsheet locale) while headers/status words localize (en/fa);
  name/ticker/source columns carry the OWASP formula-injection guard
  (same `csvNeutralizeFormula` as the batch export); RFC 4180 CRLF;
  filename `currena-insights-YYYY-MM-DD.csv` stamped from the snapshot.
  8 unit tests.
- **j/k card navigation** (Insights route): `j` opens+scrolls to the next
  visible card, `k` the previous — anchor is the last walked card, else
  the topmost card in view; respects the active filter; same
  typing/modifier guards as "/"; desktop keeps multi-open while walking.
- **Remembered chart zoom** (HistoryChart + chart-range.ts): the chosen
  10y/5y/1y persists in localStorage (`currena:insights:chart-range`),
  every chart opens there on the next visit; strict parsing falls back
  to 10y; storage failures fail OPEN (default, never an error); 5 tests.
- **Shortcut legend** (FilterBar): `/ search · J next card · K previous`
  as kbd pills — desktop-only (`hidden md:flex`), hidden on paper.

### Changed (BACKLOG #30, #32 — hygiene closes)
- `splitEvenly` moved from the Splitter route into `@currena/core`
  (split.ts) with typed `SplitError` (invalid_people / invalid_decimals /
  invalid_total) and input validation; the exact-sum largest-remainder
  arithmetic is unchanged. +7 tests incl. float-noise (0.1+0.2 style)
  and remainder-distribution cases.
- `parseBatchLines` now enforces input bounds — ≤500 non-blank lines and
  ≤500 chars/line — throwing typed `BatchError` codes the BatchConverter
  catches into one localized toast (fa/en copy added) instead of an
  unhandled throw or a per-line wall. +3 tests.
- `evaluateExpression` hardening: NBSP (U+00A0) and CR/LF are skipped as
  whitespace (HTML-copy/multi-line paste reality); unary plus accepted
  (`2*+3`, legacy-eval parity); nesting beyond 128 parens throws typed
  `CalcError('too_deep')` instead of the bare native RangeError. +4 tests.

## [2026-10-08] — I12 freshness & resilience wave

Fifth round of the day. Production QA re-measured the 2026-10-07 incident
LIVE and got the exact shape: with the I6 Worker still deployed (fix
pending), `/api/convert` for international pairs (frankfurter) hard-500'd
from 20:35:30 to 20:46:03 UTC — the cache TTL (5 min) expires 5 min into
each 15-min cron refresh cycle, so **~10.5 minutes of every 15 (70% of
all minutes)** every fetch-context request hit the stale path, tried the
single-flight lock, and (KV writes failing from fetch context) 500'd.
The incident's own fix (I11's ladder degradation) turns those 500s into
"Using cached rates" 200s once deployed — this wave closes the windows
at the ROOT: frankfurter's fresh window is now 15 min, aligned with the
quarter-hour cron, so fetch-context requests stay on the fresh-cache
rung between ticks regardless of KV health. And the SPA stops leaving
first-time visitors dead during any outage window: the snapshot store
grew a self-healing retry ladder and the converter's failure card became
honest (server-vs-network copy), actionable (Try again), and alive
(live countdown + automatic completion when the outage passes). Tests
575 → **585 green** (+2 api frankfurter-window, +8 web — the FIRST
snapshot-store unit tests). Production still serves the I6 Worker
`954f0034` (deploy pending, owner credentials).

### Fixed (incident root-cause mitigation)
- **Per-source fresh windows** (`@currena/core`): `FRESH_TTL_SEC` (one
  global 300 s) is now `FRESH_TTL_SEC_BY_SOURCE` + `freshTtlSec(source)`
  — tgju keeps the 5-min open-market window; **frankfurter gets 15 min**,
  matching the quarter-hour cron refresh cadence (ECB reference data
  updates ~once per business day; a 12-min-old snapshot is MORE than
  fresh). Server (rates-service freshness gate + status fresh flag +
  admin display) and client (snapshot-store staleness) share the same
  per-source semantics, so the client also stops re-fetching frankfurter
  every 5 min. Zero extra KV writes, zero extra scrapes — the stale
  window between cron ticks simply ceases to exist for frankfurter.
  +2 api tests (12-min ECB snapshot → fresh-cache rung with zero
  network; 16-min → honest stale ladder).
- **Failure-card copy honesty** (converter): the API ANSWERING with an
  error (500/5xx envelope — the incident's exact user experience) now
  says "The rate service is temporarily unavailable / Retrying
  automatically" instead of implying the USER's connection is broken
  ("check your connection" while their network is fine was misleading).
  Network-layer failures and offline keep the connection-flavored copy.

### Added
- **Self-healing retry ladder** (snapshot-store): a source that settles
  in the error state (nothing to serve — a first visit during an outage
  window) schedules automatic retries with capped backoff
  **15 s → 30 s → 60 s (60 s cap)**; any success clears the schedule and
  resets the ladder; offline settles never schedule (the online event
  refreshes directly); degraded mode (last-good still serving)
  intentionally does NOT poll — existing triggers cover it. Steady-state
  cost while an outage persists: one request per source per minute, the
  same order as the LiveRates poll. `nextRetryAt` (immutable epoch-ms
  stamp) exposes the schedule to the UI.
- **Failure card redesign** (converter, money page): role=alert card
  with the warning icon in a tinted circle, kind-aware honest copy
  (above), a localized **Try again** button that re-runs the conversion,
  a **live countdown** («Retrying in 14s» / «تلاش مجدد تا ۱۴ ثانیه دیگر»,
  Persian digits in fa, self-ticking every second, aria-live) while the
  store self-heals, and **automatic completion**: when the failing
  source recovers (error → ready) while the card is on screen, the
  interrupted conversion finishes BY ITSELF — the user already asked
  for it (verified end-to-end in the browser: mock 500s → card +
  countdown → unmock → result popup appears with no user action).
- **First snapshot-store unit tests** (web, backlog #29 partially
  closed): boot hydration + per-source freshness (12-min frankfurter
  local snapshot not stale, no fetch; 16-min refetches), the full retry
  ladder (15/30/60 escalation, cap at 60 s, success clears + no zombie
  retries), degraded no-poll, offline no-schedule + online-event
  takeover, ensureSnapshot semantics. Fake timers, faked fetchRates,
  in-memory localStorage.

### Changed
- **WCAG contrast sweep — raw `text-currena-warning` ink**: every
  user-facing warning TEXT rendered with the raw coral `#FF6B6B`
  (≈2.9:1 on light surfaces — fails AA) now uses the I6 `-deep` token
  (`#B92E2E` light ≈ 6.0:1 / `#FF8080` dark ≈ 6.6:1): the failure-card
  title + countdown, StaleBanner title (converter + LiveRates), Insights
  load-error + from-cache banner titles, Splitter network-error line,
  BatchConverter invalid-line label, AmountInput validation message,
  Receipt clear button, Insights card history-error. Measured in-browser
  before/after; dark mode is token-neutral (both map to #FF8080).
- **Admin runtime-config card**: the fresh-window line now shows the
  per-source values («300s / 900s») with the rationale hint.
- **Entry budget bumped 293 → 296 kB raw / 88 → 89.5 kB gz**
  (scripts/check-bundle-budget.mjs): the retry ladder + failure card +
  11 copy strings × 2 locales on the money page. gzip +1.49 kB for
  first-visit-outage recovery — incident-driven resilience, not bloat.
  Insights chunk untouched (128.42/37.78 vs 132/39).

## [2026-10-08] — I11 live-rate wave + rates-ladder incident hardening

Fourth round of the day. Production QA surfaced a REAL incident: starting
19:52:30 UTC, KV writes on the RATES namespace failed — first totally
(19:52–~20:10, cron included: status/history froze, the SPA masked tgju
via SW cache while frankfurter visibly 500'd), then selectively (the
cron's writes recovered while HTTP-context writes — by elimination the
single-flight lock PUT — still failed from at least the HKG colo, so
`/api/rates` + `/api/convert` 500'd instantly during every TTL-expiry
window with a good snapshot sitting in KV). Root cause beyond "KV
writes failing from fetch context" needs `wrangler tail` (owner —
DEPLOY.md incident note has the runbook); the daily-budget hypothesis
was tested against the evidence and DISPROVEN. The code answer shipped
regardless: the ladder now degrades exactly as its spec promises
(stale-cache rung instead of a 500) — turning this entire incident class
into a "Using cached rates" notice. And the converter homepage gains
the one thing every rate site answers instantly — the pair's live rate,
always on. Tests 555 → **575 green** (+6 api incident-degradation, +14
web LiveRateLine helpers). Production still serves the I6 Worker
`954f0034` (deploy pending, owner credentials).

### Fixed (production incident 2026-10-07 19:52 UTC)
- **`RatesService.getRates` store-failure degradation**: a snapshot READ
  failure now treats the cache as absent and continues down the ladder; a
  status-read or lock-acquire failure SKIPS the live rung entirely (the
  single-flight lock is a store guarantee — no lock, no scrape) and falls
  to the cached rungs — stale-with-notice when a ≤7-day snapshot exists,
  the honest 503 `source_unavailable` otherwise. Only `RatesServiceError`
  ever escapes the service now; the route's 500 backstop becomes
  unreachable for store errors. +6 unit tests replaying the incident
  (writes-dead + fresh-TTL-expired → stale cache with notice, status-read
  failure, snapshot-read failure with a working scraper, forced refresh
  semantics, and the exact 19:57 UTC sequence). Docs: DEPLOY.md incident
  note with the write-budget math and owner recommendations.

### Added
- **LiveRateLine (converter homepage)**: the selected pair's mid-market
  rate is always visible between the currency row and the CTA — previously
  it only existed inside the result popup, so "what's the dollar?" needed
  an amount + a tap. Pure local math over the already-booted snapshot
  (swap/currency changes re-render instantly, zero network): rate +
  inverse display (legacy precision rules — Toman integers, 4 decimals,
  8 for sub-1), `SourceBadge` (TGJU/Frankfurter), relative freshness
  («Updated 2 minutes ago» / «به‌روزرسانی ۲ دقیقه پیش»), ▲/▼ delta vs
  the previous recorded generation (`RateDeltaChip`), a 40-point
  `Sparkline` from the same rate-history the ResultPopup micro-trend uses
  (LTR axis in fa — documented analytical-axis decision), and a copy
  button producing a localized share line
  (`1 Euro = 295,260 Iranian Toman · Currena — currena.ir` /
  «۱ دلار آمریکا = ۲۳۰٬۵۰۰ تومان ایرانی · کورنا — currena.ir») with a
  2-second "Copied!" acknowledgment (clipboard failures no-op, same
  pattern as the Insights share pill). Honest states: hidden for
  same-currency pairs, pairs unresolvable from the pair's snapshot (the
  conversion itself would fail identically), no snapshot yet, and while a
  custom rate overrides the market; a confirmed-stale snapshot tints the
  line warning-amber with a ⚠ freshness line instead of hiding it. Pure
  helpers (`liveRateView`, `sparklineWindow`, `rateDecimals`,
  `rateShareText`) unit-tested in `lib/live-rate.test.ts` (+14 web tests).
- **Popular pairs (first-run)**: until the first conversion exists the
  pair-chips section shows five TGJU open-market suggestions (USD/EUR/
  GBP/AED/TRY → IRR) instead of nothing — first-time visitors see what
  the app is for; after the first conversion their own recents take over
  (existing behavior). Same chip DNA, 🔥 label («جفت‌ارزهای پرطرفدار»).

### Changed
- **Print polish (converter)**: the rate line PRINTS (it is the headline
  number on paper — verified in the PDF text layer); the interactive
  chrome around it (pair chips, quick tools grid, copy button) gains
  `.no-print`. Reduced-motion discipline: the quick-amount and pair-chip
  hover lifts are now `motion-safe:`-prefixed.
- **Entry budget bumped 289 → 293 kB raw** (scripts/check-bundle-budget.mjs,
  gz unchanged at 88): the LiveRateLine + popular pairs grow the entry
  288.80/86.98 → 292.57/87.88 — raw +3.77 kB but gzip-NEUTRAL (under the
  88 kB gz budget), i.e. users download ~zero extra bytes. The money page
  answering "what's the dollar?" without a conversion is the
  highest-value entry growth since launch. Insights chunk untouched
  (128.41/37.79 vs 132/39 budget).

## [2026-10-08] — I10 personal & portable wave: watchlist pins, .ics export, reading progress, relative freshness

Third round of the day, autonomously scoped after a clean QA sweep (production
+ local all green; API 30 readings / 0 unavailable / 14 events). Four features
close the loop on "a page readers return to": personalisation, portability and
orientation. Tests 545 → **555 green** (+10: 4 pinned-storage, 6 RFC 5545).
Presentation-layer only — no scoring, thresholds, sources, KV keys or API
changes. Production still serves the I6 Worker `954f0034` (deploy pending,
owner credentials).

### Added
- **Personal watchlist ("My watchlist" / «دیده‌بان من»)**: every card's
  expanded action row gains an aria-pressed pin pill (☆/★, house pill DNA);
  pinned cards MOVE into a dedicated section above the groups — "stay on
  top" — with its own warning-count line (the pinned set's own status,
  group headers keep describing full data). Persisted in localStorage
  (`currena.insights.pinned.v1`; `parsePinnedIds` degrades any malformed
  value to "nothing pinned", unknown ids drop silently) and synced across
  tabs via the `storage` event. The collapsed card shows a ★ badge (in the
  expand button's accessible name via sr-only text) so pin state reads
  without expanding. Play-nice with everything that locates cards by DOM
  id: share deep links (`?card=` opens + scrolls to a pinned card),
  WhatChanged rows, focusCard's filter-reset (a hidden pinned card is
  found after the filter clears), JumpNav gains the watchlist pill, the
  section hides under the no-match state. Pure helpers unit-tested.
- **Calendar export (.ics)**: the Coming up header gains a "Download
  calendar (.ics)" pill exporting exactly the events listed (upcoming,
  localized titles). `buildInsightsIcs` in `components/insights/ics.ts` is
  a pure RFC 5545 builder — CRLF endings, TEXT escaping (ASCII `;` `,` `\`
  and newlines; the Persian ؛/، code points correctly untouched), octet-safe
  75-octet folding (never splits a UTF-8 sequence — Persian titles are the
  point), all-day `DTSTART;VALUE=DATE` with the exclusive `DTEND` (+1 day,
  month-boundary verified), stable `<event>-<date>@currena.ir` UIDs so
  re-imports update instead of duplicating, deterministic `DTSTAMP` (now
  passed in tests). Downloads via the shared `lib/download.ts`.
- **Shared download helper** (BACKLOG #24): `downloadBlob` extracted from
  its two route-local copies (Receipt PNG/XLSX, BatchConverter CSV) into
  `apps/web/src/lib/download.ts`; the Insights export is its third consumer.
- **Reading progress bar**: a 3px `role="progressbar"` pinned above the app
  header (z-1001), filling from the inline-start edge in both directions
  (RTL grows from the right — native block flow). rAF-throttled passive
  listeners (the JumpNav scrollspy pattern); `aria-valuemin/max/now` keep it
  honest; hidden on paper.
- **Relative freshness**: the header's generated line now reads
  "Updated {ago} · {exact datetime}" ("3 hours ago", «۳ ساعت پیش») via the
  existing core `formatRelative` (zero entry-bundle growth — it was already
  there); the from-cache banner leads with the relative age too (the exact
  timestamp stays one line above).

### Fixed
- **Persian-digit sweep (fa prose numbers)**: section headers, group headers
  and the days-away counter rendered Latin digits («3 از 6 شاخص», «21 روز
  دیگر») while values, charts and chips used Persian digits. All prose
  numbers now render through `formatNumber(numberLocale)` — «۳ از ۶ شاخص
  در وضعیت هشدار», «۲۱ روز دیگر», the excluded-note count, and the new
  watchlist count line. The LED seven-segment values stay Latin by the
  documented Wave-5 #46 decision.

### Budget
- Insights chunk 121.30/35.85 → **128.36/37.78 kB/gz** — gate consciously
  bumped 125/37 → 132/39 with this entry as justification (watchlist UI +
  section + persistence, ics builder, progress bar, digit sweep, 9 new copy
  strings × 2 locales). Entry untouched: 288.80/86.98 vs 289/88.
  Precache 61 entries.

## [2026-10-08] — I9 feedback & analytical-zoom wave: chart ranges, chip counts, summary jumps, "/"-shortcut

Second stable-state round of the day: re-verified production + local standing
state (all green), fixed one I8 gap found during review, then four features.
Tests 528 → 537 → **545 green** (+8 range/count tests). Presentation-layer
only — no scoring, thresholds, sources or API changes. Still awaiting the
owner-credentialled deploy (production serves I6 Worker `954f0034`).

### Fixed
- **focusCard × filter interaction (I8 gap)**: clicking a WhatChanged row
  (or any focus-card path) while the active filter hides that card used to
  silently do nothing visible. The reader's "show me THIS card" intent now
  wins — the filter resets (chips + query), then the card opens, scrolls
  and receives focus.

### Added
- **Chart range toggle — 10y / 5y / 1y** (`HistoryChart`): a segmented
  control in the figcaption (the house pill DNA at chart-local size).
  `sliceHistoryToRange` / `rangeIsPlottable` are pure, unit-tested helpers
  in `config.ts`; the window anchors on the series' LAST point (honest even
  when the feed is days old); ranges that cannot show ≥2 points disable
  themselves; the mid-axis year tick suppresses itself when it would repeat
  an end year (1y windows show exactly 2 ticks); the I7 tooltip + keyboard
  stepping operate on the sliced series; the SR data table follows the
  visible range. **The 10-year position bar and percentiles never change**
  — they are the indicator's server-side decade placement. Hidden on paper.
- **Live counts on the filter chips** — "All (30) / Warning (6) / Normal
  (15) / Context (7)": the reader sees what a chip does before pressing it
  (`statusCounts`, pure, tested; Persian digits in fa). Same semantics as
  the filter: stale/unavailable count only under All.
- **Summary lines are jump buttons**: the two LED summary lines now scroll
  to their sections — the summary block doubles as the page's table of
  contents (hover affordance, direction-neutral ↓ chevron, sr-only "View
  section", reduced-motion-aware).
- **"/" focuses the filter search** — Gmail/GitHub/YouTube muscle memory.
  Ignores modifier combos (never swallows browser shortcuts) and never
  fires while typing in any field; `aria-keyshortcuts="/"` declared on the
  input.

### Changed
- **Insights chunk budget 120/35.5 → 125/37 kB/gz**
  (`scripts/check-bundle-budget.mjs`): the range control + slicing, chip
  counts, summary buttons, shortcut wiring and 12 more copy strings × 2
  locales grow the lazy chunk 117.27/34.83 → 121.30/35.85. The entry chunk
  is untouched (288.76 kB / 86.95 gz — money-page budget held).
- Spec §5 (indicator card) now records the range control and §4 the summary
  jump behaviour (additive documentation).

## [2026-10-08] — I8 findability wave: filter toolbar, story→card links, hover polish

Stable-state session: full QA pass first (production standing state + every
Wave 6 feature re-verified locally with agent-browser — share links, chart
tooltip/keyboard, print, zero errors), then the next coherent improvement.
30 cards across two sections is a lot to scan; three presentation-layer
changes, no scoring/threshold/API contract changes. Tests 528 → **537 green**
(+9 filter tests). Not yet deployed — ships with the Wave 6+ work at the next
owner-credentialled deploy (production still serves I6 Worker `954f0034`).

### Added
- **Card-grid filter toolbar** (`FilterBar.tsx`, new): status chips
  (All / Warning / Normal / Context — 44px pills, `aria-pressed`, the I6
  deep-ink active tones) plus text search over name + ticker. Persian
  search is normalised like a native would expect: Arabic-keyboard
  yeh/kaf map to Persian, ZWNJ acts as a word separator, bidi marks are
  stripped — «بیت کوین», «بیت‌کوین» and «بيكاري» all match their cards.
  The result count line is `aria-live` with a Clear-filters reset;
  fully-filtered-out sections, groups and JumpNav pills hide; a no-match
  panel replaces the grid; the toolbar is hidden on paper (`.no-print`).
  Filtering is a VIEW tool only — section/group warning-count lines keep
  describing the full snapshot, and stale/unavailable cards only appear
  under All.
- **Story blocks now link into the grid**: every WhatChanged row (state
  changes + the five biggest 30-day moves) is a button that opens and
  scrolls to its indicator card through the shared `focusCard` path (the
  I7 share-link behaviour, extracted); the chevron mirrors per locale and
  the accessible name carries "View card".
- **Pure filter helpers** in `config.ts` (`indicatorMatchesFilter`,
  `filterVisibleIds`) with 9 unit tests incl. the Persian-normalisation
  cases.

### Changed
- **Insights chunk budget 110/33 → 120/35.5 kB/gz**
  (`scripts/check-bundle-budget.mjs`): the toolbar + visibility wiring +
  26 copy strings × 2 locales grow the lazy chunk 109.36/32.91 →
  117.27/34.83 — a conscious, justified bump; the entry chunk is
  untouched (288.76 kB / 86.96 gz, money-page budget held).
- **Card hover polish**: desktop-only, `motion-safe` 2px lift + deeper
  shadow on indicator cards (reduced-motion and touch unaffected).
- Spec §4 (page structure) now records the toolbar row between "Coming
  up" and the sections (additive documentation of the I8 change).

## [2026-10-07] — BACKLOG Wave 6 closed: CI gate, chart tooltip, print, share links, ingest alerting

Owner direction ("Proceed based on your phases") → the ranked Wave 6 backlog
from the I6 session, completed end-to-end. Tests 521 → **528 green**; every
commit CI-verified on GitHub (the new gate itself, green on each push).

### Added
- **CI workflow** (`.github/workflows/ci.yml`, BACKLOG #47): every push to
  main + PRs runs typecheck, the full test suite, the SPA build, and a
  **bundle-budget gate** (`scripts/check-bundle-budget.mjs`) — entry chunk
  ≤ 289 kB / 88 kB gz, Insights lazy chunk ≤ 110 / 33; budgets are the
  documented numbers and bumps require a changelog justification.
- **Chart hover/focus reading** (#48, audit F16): pointermove tracks the
  nearest point on the 10-year chart (dashed guide line + highlighted dot +
  date/value tooltip — Jalali + Persian digits in fa); the chart is
  keyboard-focusable with ←/→/Home/End stepping; `touch-pan-y` keeps mobile
  scrolling intact; the SR data table remains the text path.
- **Per-indicator share links** (#50, spec §10 "later"): the hash router is
  now query-tolerant (`parseRouteAndQuery`, pure + 7 new unit tests);
  `#/insights?card=<id>` opens exactly that card and scrolls to it once per
  mount (single-open discipline on phones; unknown ids ignored); each
  expanded card carries a "Share this card" pill (en / «اشتراک این کارت»
  fa) that copies the deep URL with inline "Link copied" feedback.

### Changed
- **Print stylesheet** (#49, audit F16): `@media print` in index.css — dark
  mode prints the light palette, header chrome/nav pills hidden (logo kept),
  cards/sections/figures never break across pages, external links spell out
  their URL, SVG/LED colors kept exact. Verified via PDF export + VLM
  review.
- **Jump targets land below the fixed header**: Insights sections + the card
  anchor get `scroll-mt-24` (the About route's existing convention) —
  JumpNav jumps and share deep links no longer hide their target's title
  behind the navbar.
- **Failed-ingest alerting** (#46): a `if: failure()` Telegram step in
  `insights-ingest.yml` — posts run/sha/URL to the owner when
  `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` secrets exist, a clean no-op until
  then (red run + the 36 h /admin staleness pill remain the standing
  signals).

### Verified
- Local: every feature agent-browser-verified en+fa × desktop/375px (tooltip
  values + keyboard stepping, deep links desktop + mobile single-open,
  clipboard flow with stubbed API, print PDF URL spelling, zero console
  errors, no overflow). CI: **5/5 runs green** on GitHub.
- Bundle: entry 288.76 kB / 86.95 gz (≤ budgets); Insights chunk
  109.36 kB / 32.91 gz after tooltip + share (inside the 110/33 gate —
  growth justified above).

## [2026-10-07] — Insights UI/UX pass (Phase I6) + completeness sweep (I6 backtest re-run + I7 hardening)

Owner agenda ("Improving UI/UX of the Insights page, and making sure nothing is
left behind"). Presentation-layer only — no scoring, thresholds, sources, KV
keys or API contracts touched. Evidence-first audit
(`docs/insights/05-ux-audit-I6.md`) → five implementation commits → backtest
re-run → I7 hardening → production smoke.

### Fixed — Accessibility (audit F1–F5, F7, F10)
- **WCAG AA in light theme** (was failing on all 30 cards): status chips
  2.78–3.29:1, group h3s 3.14:1, panel h5s + source pill ~3.3:1, latent
  what-changed rows 2.78:1, coming-up "soon" coral 1.92:1. Four ink-grade
  `-deep` accent tokens added to the theme (blue #245E9F, success #256D29,
  warning #B92E2E, coral #9C5019 — ≥4.5:1 on white, page bg, and their own
  /10–/15 tints); dark mode remaps them to the existing bright hues
  (≥6.5:1). Both themes re-measured programmatically: 4.62–10.47:1.
- **Stale-card grey-out no longer sinks text below AA** (was 2.33:1 light /
  1.96:1 dark through a blanket opacity-60): grey-out is now a softened
  surface tint + muted value colour with every string ≥4.5:1.
- **Tap targets**: JumpNav pills 30→44px; chart-data `<summary>` 16px→a
  full-width 44px row; "How this is calculated" + disclaimer links get
  padded hit areas (layout unchanged).
- **Accessible names**: the card expand button's name was the entire
  collapsed card (~33 words); heading + button are now labelled
  "name (+ticker), status" via `aria-labelledby`.
- **Summary block landmark** was labelled "Global" (duplicate of the real
  Global section) with no heading — now `ui.summaryTitle` (en "Market
  summary" / native fa «خلاصهٔ وضعیت بازار») + a visually-hidden h2.

### Fixed — UX (audit F6, F8, F9, F11–F15)
- **JumpNav scrollspy**: active-section awareness while scrolling (passive
  rAF listener, `aria-current="true"`, tinted active pill; bottom-of-page
  pins the last section).
- **Chart year labels** no longer carry thousands separators ("2,016" /
  "۲٬۰۱۶" → "2016" / "۲۰۱۶" — `formatNumber` learns `useGrouping:false`,
  formatter-cache key extended); a **mid-axis year tick** orients the
  decade span; position bar 8→10px with a 30% warning-zone tint.
- **Expanded panel readability**: rule sentence text-xs→text-sm, section
  titles 0.72→0.75rem with more lead-in, sections gap-3→gap-4 — the five
  blocks scan as anchors instead of a wall of text.
- **fa typography**: Jalali date+time joined with the Persian comma «،» in
  core `formatJalaliDate` (ICU emitted a Latin ", ") — also fixes the
  converter ResultPopup timestamp.
- Card footer/group status/meta lines 0.68→0.7rem; disclaimer bar softened
  to read as a footnote, not a system alert.

### Changed
- `docs/insights/BACKTEST.md` regenerated against the full 30-indicator
  definition set: `gold-usd`/`silver-usd` reported honestly as info-only
  never-votes (was "undefined"), `china-pmi`'s note reflects its populated
  10-observation manual series; zero numbers changed, I1 findings
  re-affirmed with an I6 re-run verdict. No threshold changes proposed.
- `/admin` Insights card (I7): pill flips to "stale — no run for N h" with
  a `role=alert` action line past 36 h without a run — previously a dead
  cron kept the card "healthy" while the snapshot aged. Live-verified
  fresh + stale paths on local wrangler.
- `docs/BACKLOG.md` Wave 6: post-I6 SWOT re-check + explicit backlog
  (failed-ingest push notification, performance-budget CI gate, chart
  hover tooltip, print stylesheet, per-indicator share links).

### Verified
- Every commit: typecheck 5/5, tests green **516 → 521** (core +2 useGrouping/
  Jalali-comma, admin +3 staleness), bundle budget held — entry 288.75 kB /
  87.77 kB gz unchanged, Insights lazy chunk 104.54 → 105.98 kB (31.49 →
  31.94 kB gz, +0.45 gz for scrollspy + labels), precache 60 / ~2172 KiB.
- agent-browser en/fa × desktop/375px × light/dark: contrast sweep
  re-measured, RTL geometry intact, Persian digits + Jalali dates, chart
  LTR-in-fa, mobile single-open, language switch keeps scroll + open
  cards, zero console errors, no horizontal overflow.
- Production standing state: `/api/health` ok; `/api/insights` 30 readings,
  fresh `generatedAt`, 14 calendar events, quiet week, Global-first order
  (first Australia id at index 18); history endpoints 200 + 404-for-single-
  point + 400-unknown + ETag 304; today's scheduled (04:20 UTC) and
  dispatched ingest runs green on the Actions tab.

## [2026-10-07] — Session wrap-up: shipped state re-verified + next-session brief

Owner direction ("Proceed to next phase if anything is remaining and wrap up
this session… The new session agenda: Improving UI/UX of Insights page, and
making sure nothing is left behind"). No runtime changes — the evening
re-verified the 2026-10-07 feature set end-to-end and closed the session.

### Verified
- Gates re-run: typecheck 5/5, tests **516/516 green** (core 157 · scraper
  67 · insights 132 · web 52 · api 108).
- Production smoke (`currena.ir`): `/api/health` ok; `/api/insights` 30
  readings — `gold-usd` 4107.7 / `silver-usd` 60.109 at the top of the
  metals group, all 18 global ids before the first Australia id, 14 calendar
  events, fresh `generatedAt`, zero unavailable indicators.
- Redeploy from the final HEAD (version of record in
  `docs/DEPLOY.md` §"Session wrap-up, 2026-10-07 evening") — runtime
  identical to the deployed `b69375c` build; docs-only commits around it.

### Changed
- `docs/NEXT_SESSION_PROMPT.md` rewritten as the hand-off brief for the next
  agenda: **Insights UI/UX pass + completeness sweep** (Phase A audit against
  `02-page-design-spec.md`, Phase B presentation-layer improvements, Phase C
  = the I6 backtest re-run + I7 hardening checklist + standing-state
  verification).
- `docs/PROGRESS.md` status row + decisions log: owner direction recorded
  (I5 effectively closed; next phase reframed as the UI/UX agenda).

## [2026-10-07] — Insights: gold and silver ounce prices in the precious-metals group

Owner request ("I want the ounce price of Gold and ounce price of Silver to be
added in the precious metals part"): two new info-only cards at the top of
**Metals, crypto and hard assets** — `gold-usd` and `silver-usd`. They render
first in the group (prices before the ratios built from them), never vote, and
so leave every summary count unchanged. 30 indicators total (19 P1 / 11 P2).
Tests 514 → **516 green**; typecheck 5/5.

### Added
- `gold-usd` — Gold price (ounce), US$ per troy ounce: live TGJU world-market
  ounce quote with World Bank Pink Sheet monthly history backfill (the exact
  `gold-silver` recipe with the raw price as the live point). Displayed as
  `US$4,104`-style whole dollars; carries the 10-year position bar and chart.
- `silver-usd` — Silver price (ounce), US$ per troy ounce: live gold-api.com
  XAG spot with the same World Bank monthly backfill. Displayed to 2 decimals
  (`US$60.13`).
- Bilingual copy corpus entries (en + native fa) for both cards; spec table
  amendment in `docs/insights/01-indicator-spec.md`.

### Changed
- `IndicatorIdSchema` (core contract), `DEFINITIONS`, `buildIndicatorSeries`
  and `READING_SOURCES` (@currena/insights), `DISPLAY` (apps/web) — the two
  ids wired through every layer; degradation ladders tested (no World Bank →
  single live point; no live source → monthly history reads stale, honest).
- Count-pinning tests updated (core id set 30; definitions 19/11; snapshot 30
  readings; fa copy coverage 30 keys).

### Deployed
- Worker version `b1a5e80e-b61e-4f21-994d-4342557de5ba` (922.73 KiB upload,
  gzip 159.88 KiB, 15 new assets) — live on currena.ir + workers.dev; entry
  bundle byte-identical to the I5 baseline.
- Ingestion dispatched manually (Actions run 37646617580, `success` on
  `b69375c`): production snapshot `generatedAt 2026-10-07T15:46:25.777Z`,
  30 readings — `gold-usd` 4107.7 and `silver-usd` 60.109, both `context`
  with ≈92% 10-year position; new `insights:hist:gold-usd|silver-usd` keys
  (120 points each); voting counts unchanged (global 3/11, australia 3/10).
  Browser-verified en+fa, desktop+375px: cards lead the metals group, charts
  + SR tables + source links render, zero console errors, no overflow.

## [2026-10-07] — Insights Phase I5: content (calendar, china-pmi) + Gate I4 ordering fix

Gate I4 approved (owner: "Approved." + the live `/api/insights` JSON) with
one requested change, applied first: **the Global section now renders
before Australia** — section order (`SECTION_ORDER`), jump-nav target
order, and the summary block's two LED lines all flipped; the design spec
§4 records the owner decision (the original "reader is in Australia"
rationale is retired). Then Phase I5's content work: the key-dates calendar
populated from official schedules and the China-PMI manual series seeded
from documented official releases. Tests stay **514 green**; typecheck 5/5;
the reorder is render-order only (no bundle-gated code changed).

### Added
- `data/insights-calendar.json` — 14 events (2026-10-28 → 2027-05-04):
  RBA cash-rate decisions (2026: 3 Nov, 8 Dec; 2027: 9 Feb, 23 Mar, 4 May —
  from the RBA Board Meeting Schedules page, decision = second day), FOMC
  decisions (2026: 28 Oct, 9 Dec; 2027: 27 Jan, 17 Mar, 28 Apr — from
  federalreserve.gov), ABS CPI releases (Sep quarter 28 Oct, Oct 25 Nov,
  Dec 27 Jan, Jan 24 Feb — from abs.gov.au, cross-checked against the RBA
  homepage "Next update"). Bilingual titles; events within 7 days highlight
  client-side; past events drop off.
- `data/manual/china-pmi.json` — 10 NBS manufacturing-PMI observations
  (2025-12 → 2026-09), every value the official headline cross-checked
  against ≥2 independent reports of the release with month-over-month
  arithmetic reconciled; full provenance table in `data/manual/README.md`.
  The china-pmi card goes live (50.1, normal, +0.30 pts 30-day change);
  its position bar stays hidden until the 30-observation percentile floor.

### Changed
- `apps/web/src/components/insights/config.ts`, `routes/Insights.tsx`,
  `components/insights/SummaryBlock.tsx` — Global before Australia
  (section order, jump nav, summary rows).
- `docs/insights/02-page-design-spec.md` §4 — page structure reordered to
  match the owner's decision; rationale line rewritten.

### Documentation
- Roadmap: I4 exit records Gate I4 approval + the ordering change; the I5
  checklist closed out (copy corpus delivered in I4 + re-reviewed with a
  mechanical no-buy/sell check; calendar populated; disclaimer reviewer
  declined at D4; china-pmi seeded as an added I5 item).
- `data/manual/README.md` — china-pmi provenance table + growth rule.

### Deployed
- Pushed `f3a8101..f77bdd4` to `main` and redeployed the Worker (version
  `bef6f65b-e5b6-4655-8d14-25f7945b2e19`, 922.70 KiB upload, 13 new assets —
  the reordered `Insights-oh-TxMJf.js`). A manually dispatched
  `insights-ingest` run (Actions run 37641720806, success) wrote the first
  production snapshot carrying the calendar (14 events) and the live
  china-pmi reading (50.1, normal) — zero unavailable indicators. Verified
  on `currena.ir/#/insights` in en and fa: Global before Australia in
  sections, jump nav, and summary rows; card expand → chart + table +
  source link; 375px no overflow; zero console errors. Deploy record in
  `docs/DEPLOY.md` §Insights reorder + I5 content deploy.

## [2026-10-07] — Insights Phase I4: the page

Gate I3 approved (owner: "Approved." with the live `/api/insights` JSON
pasted for review). Phase I4 builds the reader-facing page: `#/insights`,
28 expandable indicator cards, both languages, both themes, every state in
the design spec. **Entry bundle +0.10 kB gzip** (288.75 kB / 87.78 kB gzip
vs the 288.45 / 87.68 baseline) — the whole feature, including the ~600-line
bilingual copy corpus, lives in the lazy route chunk (100 kB / 30.4 kB gzip).
Tests **479 → 514 — all green** (+35 web); typecheck clean in all five
packages. Browser-verified in en/fa × light/dark × desktop/375px against
the exact production snapshot: zero console errors, no horizontal overflow
(one overflow defect found and fixed during verification), offline fallback
through the last-good localStorage snapshot, mobile single-open cards.
Deployed and smoke-verified on currena.ir — awaiting the owner's visual
review (Gate I4).

### Added
- `apps/web/src/routes/Insights.tsx` — lazy `/insights` route (ROUTES, nav
  entry, per-route title). Australia before Global, jump links, about-the-data
  + full disclaimer.
- `apps/web/src/lib/insights.ts` — typed API client (zod-validated snapshot +
  per-card history with expected-404 → null), localStorage last-good fallback.
- `apps/web/src/i18n/insights-copy-en.ts` / `insights-copy-fa.ts` — the copy
  corpus (28 indicators × 6 fields + structural strings per locale), lazy in
  the route chunk, fa compile-time shape-checked against en.
- `apps/web/src/components/insights/` — SummaryBlock (LED warning counts +
  explainer + disclaimer bar), WhatChanged, ComingUp, JumpNav, IndicatorCard,
  HistoryChart (+ screen-reader table), PositionBar, StatusChip, AboutTheData,
  display config + pure helpers.
- 35 web tests: client contract/error/cache paths, value/change/rule
  formatting (en + fa), warning zones, movers ranking, group counts, history
  sampling, copy coverage.

## [2026-10-07] — Insights Phase I3: ingestion runner, storage, API routes, production write-run green

Gate I2 approved ("continue proceed"). Phase I3 builds the feature's serving
pipeline end to end: the GitHub Actions ingestion runner, the KV storage
contract, the read-only API routes, and the admin freshness card. **First
Insights deploy** (new routes on `currena-api`, Worker version `3ab1a97a`;
the SPA bundle is unchanged — insights imports are type-only on the worker
side). Tests **441 → 479 — all green** (+38); typecheck clean in all five
packages. Production evidence: venue dry-run (Actions run 37518740313)
27/27 sources OK; real write-run (Actions run 37550035289) wrote 24 history
keys + snapshot + status in 26 KV writes with `P1 COMPLETE`; live JSON
verified at `/api/insights` on workers.dev and currena.ir.

### Ingestion runner (`packages/insights`)

- `scripts/ingest.ts` — the production twin of live-run: collect → assemble →
  score → write. Loads `data/insights-calendar.json` + `data/manual/*.json`
  (soft-absent, loudly validated when present), reads the previous snapshot
  for `changedThisWeek` continuity (fresh events carried, week-window
  filtered), writes `insights:snapshot` + `insights:status` (critical) and
  `insights:hist:<id>` only on change (read-compare), prints the source
  report + readings + KV-op budget. Exit 1 when any P1 indicator is
  unavailable — a red workflow run is the stale-feed signal.
- `src/adapters/collect.ts` — the live-run fetch phase extracted verbatim so
  the diagnostic script and the runner cannot drift (live-run refactored onto
  it; output unchanged).
- `src/adapters/snapshot.ts` — pure assembly: `buildInsightsSnapshot`
  (readings + summaries + changedThisWeek merge + calendar),
  `buildHistoryFile` (10-year window anchored on the newest observation,
  downsampled to ≤520 points, `[epochDay, value]` encoding; single-point live
  cards get no history key), `buildInsightsStatus`.

### Storage contract

- `@currena/insights/store` (new export entry): `InsightsReader` /
  `InsightsWriter` interfaces + key names + `InMemoryInsightsStore` (tests) +
  `RestInsightsStore` — the Cloudflare REST KV writer with injected fetch,
  429/10048 daily-cap retry ladder, and op counters. The SPA-facing root
  export stays untouched.
- Core wire contracts: `IndicatorHistory` (strictly-ascending epoch-day
  pairs), `InsightsStatus` + `InsightsSourceReport` (admin freshness).
- `apps/api/src/adapters/insights-store.ts` — `KvInsightsReader` (the
  Worker's read half, poisoned-entry defense like `KvRateStore`). Keys live
  in the existing RATES namespace under the `insights:` prefix, NO TTLs.

### API + admin

- `GET /api/insights` — the precomputed snapshot; `503 insights_not_ready`
  before the first run; ETag `"insights:<generatedAt>"` + 304s; 60s public
  cache; exactly ONE KV read.
- `GET /api/insights/:id/history` — one indicator's downsampled series;
  `400 invalid_indicator` / honest `404 history_not_found`; ETag + 304s;
  300s public cache.
- `/admin` gains a zero-JS Insights card (last run, mode, per-source ✅/❌
  rows) fed by `insights:status`; the read is failure-tolerant (a broken KV
  read omits the card, never breaks the console).

### Workflow + ops findings

- `.github/workflows/insights-ingest.yml` — the repo's first workflow on
  main: cron **04:20 UTC daily** + `workflow_dispatch` with `dry_run`;
  pnpm from `packageManager`, frozen lockfile, 15-minute timeout, no
  overlapping runs.
- **KV write-budget finding (pre-existing, refined by live observation)**: the
  account's write counter crosses the 1,000 free writes/day around ~19:00 UTC
  (ever-green rates cron ~1,000/day + the second worker ~450/day). The cap's
  enforcement was observed on the **KV REST API** (429/10048) — the exact
  path the ingestion runner uses; Workers **binding writes are not blocked**
  (the rates app kept writing fresh snapshots after the trip, so production
  is unaffected). The ingestion is therefore scheduled at 04:20 UTC into the
  fresh post-midnight counter and retries capped writes. Recorded in
  docs/PROGRESS.md decisions log + docs/insights/03-data-sources.md §Phase I3.
- Scope cuts recorded: Bitstamp 10-year candle backfill + RBA F11 skipped
  (no v1 consumer); one daily schedule instead of daily+weekly
  (change-detected writes).

## [2026-10-06] — Insights Phase I2: source adapters, venue-verified RBA, live-run green

Gate I1 approved ("Continue." — backtest thresholds locked as-is). Phase I2
builds the feature's data layer — **still no app code; web/api bundles
unchanged; nothing deployed.** Tests **400 → 441 — all green** (insights 69 →
110); typecheck clean in all five packages; runner-side gates green from the
ingestion venue.

### Source adapters (`packages/insights/src/adapters/`, via `@currena/insights/adapters`)

- Import surface SPLIT from the pure root export: the SPA-safe `.` entry
  stays platform-/fetch-free; the new `./adapters` entry carries the fetch
  halves (web-standard fetch only — runs identically in the GitHub Actions
  runner and a Worker). `@currena/insights` gains a `@currena/scraper`
  dependency (fetchWithRetry + the production TGJU gold parser).
- fred / frankfurter / abs / worldbank / goldapi / bitstamp / tgju / rba /
  manual-series loader + `derived.ts` (`buildIndicatorSeries` — the
  production twin of the backtest SERIES map: ratio joins, yoy derivation,
  inverse/cross FX, live-point info cards, WB-brent fallback) +
  `READING_SOURCES` (per-card attribution).
- `xlsx.ts` — dependency-free XLSX reader (ZIP central directory +
  `DecompressionStream('deflate-raw')` + shared strings) for the World Bank
  Pink Sheet; the workbook URL is re-discovered from the commodity-markets
  page every run because the thedocs.worldbank.org document hash rotates.
- `parsers.ts` additions: `parseAbsSdmxCsv` (live SDMX response; header-driven
  columns — order varies by flow; sorts unordered answers; skips blank
  OBS_VALUE) and `parseRbaTableCsv` (title/header/metadata rows; both RBA
  date formats; skips pre-scaffolded empty future quarters).
- Loud-failure everywhere: zod response contracts (gold-api, Bitstamp,
  manual), table/series/unit identity checks (RBA prefix, WB header+units,
  ABS DATAFLOW), ascending assertions, ingestion-UA pinned for FRED (its
  Akamai edge hangs on the Chrome fingerprint).

### RBA venue verification (the I0 blocker, closed)

- Temporary branch `probe/i2-rba-venue` + a branch-only workflow ran the
  probe from the GitHub Actions runner: F1.1 / F2 / E2 / F11.1 CSVs all
  **HTTP 200**; the bytes are committed as fixtures. The sandbox stays
  Akamai-403 (loud-unavailable there — honest by design).
- `au-household-debt-arrears` resolved to **RBA E2 'Household debt to
  income'** (the ABS Data API has no household-ratios flow; catalogue
  searched in full). `au-us-10y-gap` cadence daily → weekly (F2 publishes
  T+2..4). I0's "4.60% cash rate" reference note retired (F1.1: 4.36).

### Fixtures & tests

- New recorded fixtures: gold-api XAG/BTC, Bitstamp OHLC, Frankfurter small
  timeseries, ABS SDMX ×5 (live response format), the full real World Bank
  XLSX, RBA F1.1/F2/E2 (venue bytes). 41 new tests (110 total in the
  package), all fixture-backed; the XLSX integration test parses the real
  workbook end-to-end (1960M01 → 2026M09).

### Live run (I2 exit criterion)

- `pnpm --filter @currena/insights live-run` — the one-off manual run that
  fetches every source, assembles all 28 indicator series and prints the
  sanity table + summaries. Final venue run: **27/27 fetches OK, every P1
  indicator printed a sane value (`P1 COMPLETE`)** — Global relaxed 1/8
  voting, Australia cautious 3/10 (0 excluded); TGJU-gold vs gold-api XAU
  0.04%, gold-api BTC vs Bitstamp 0.02%. Sandbox runs identical except RBA
  (403 → unavailable rows, as designed).

## [2026-10-06] — Insights Phase I1: contracts, scoring engine, backtest

Gate I0 approved same day (D4 answered: no disclaimer for v1). Phase I1 adds
the feature's computational core — **no app code touched; the web/api bundles
are unchanged; nothing deployed.** Tests **313 → 400 — all green**; typecheck
clean in all five workspace packages.

### Contracts (`packages/core/src/schemas.ts`)

- New Insights contracts (rule 3 — single source of truth): `IndicatorId`
  (28 v1 ids; licence-blocked items excluded), group/section/cadence/phase/
  source enums, `WarningRule` (the spec's seven atom kinds plus a flat
  `any-of` OR-composite for us10y), `IndicatorDefinition`, `IndicatorReading`
  (status vocabulary: warning / normal / context / stale / no-history /
  unavailable; `value`/`asOf` are null exactly when unavailable — enforced by
  refine), `SummaryLine` (label is null when nothing votes), `ChangedEvent`,
  `CalendarEvent`, `InsightsSnapshot` (unique-id refine). All exported from
  `@currena/core`; contract tests include deliberate shape-pinning.

### New package: `packages/insights` (`@currena/insights`)

- Pure, platform-free (AGENTS.md rule 2): no node:*, DOM, fetch or clock
  reads — every time reference is an explicit parameter (frozen-clock
  friendly). zod-validating throughout.
- `series.ts` — epoch-day date math, binary-search `pointAtOrBefore`,
  `combineSeries` inner join (ratios/crosses), `yoyPctSeries`.
- `parsers.ts` — FRED CSV / Frankfurter JSON / World Bank monthly / ABS
  period parsers; loud failures; missing markers dropped, never zero-filled.
  These are the parse halves of the Phase I2 adapters.
- `definitions.ts` — all 28 indicator definitions, rules verbatim from
  `01-indicator-spec.md`.
- `scoring.ts` — strict-lower 10-year percentiles; threshold rules incl.
  sustained-weeks anchored on the latest observation; percentile tails;
  pct/points change rules with anchor tolerance (sparse series show dashes,
  never mislabelled windows); yoy-negative; consecutive-decline; above-low;
  info → context; stale detection; `computeReading`, `summarize`
  (sections resolved via the definitions table), `changedSince`.
- **69 tests**: table-driven coverage of every rule type plus edge cases
  (empty series, short history, direction, ties, boundaries, frozen clock).

### Recorded fixtures + backtest

- `packages/insights/fixtures/` (14 files + provenance README, captured
  2026-10-06): 10 FRED series (2004+ / full), Frankfurter USD→JPY/AUD/CNY
  (2004→2026-10-05), World Bank Pink Sheet monthly (2004M01→2026M09), ABS
  headline CPI + trimmed mean quarterly, ABS unemployment monthly. RBA
  absent (Akamai-blocked from the sandbox — documented).
- `pnpm --filter @currena/insights backtest` writes
  **`docs/insights/BACKTEST.md`**: weekly frozen-clock runs across GFC 2008,
  COVID 2020, inflation 2022 and calm contrast 2017/2025, plus a today-run.
  Labels move correctly in every window (2008 global peaks *stressed*
  Oct-2008 7/12 and Australia *alarmed* Dec-08→Mar-09; 2022 *stressed* for
  20 of 52 weeks; 2017 *relaxed* 43 of 52; today: global *cautious* 3/11,
  Australia *stressed* 3/6). Engine constants calibrated against the
  fixtures during the run and documented there (stale thresholds from real
  release lags: 3/16/95/190 days by cadence; percentile floor 30 periods;
  observation-anchored sustained window). Owner-tunable candidates are
  listed with recommendations — spec thresholds themselves are unchanged.

Awaiting Gate I1 approval (backtest / threshold review) before Phase I2.

## [2026-10-06] — Insights Phase I0: source verification + Gate I0 decisions

Docs-only session (no code, no bundle impact). Planning set from commit
`240deb1` read in full; the verify-first probe ran against **every** source in
`docs/insights/03-data-sources.md` with throwaway scripts (nothing committed).

### Data sources — verified register (`docs/insights/03-data-sources.md`)

- **FRED:** 11/11 series live and current, **keyless** via
  `fredgraph.csv` (including the identified government pair
  `A091RC1Q027SBEA` ÷ `W006RC1Q027SBEA`) — **no FRED API key needed**.
  All used series are U.S.-government public domain; `DCOILBRENTEU`
  is EIA-sourced.
- **RBA:** licence **CC BY 4.0** confirmed (via alternate egress); the
  whole domain Akamai-403s the build sandbox — CSV bytes must be
  re-probed from the ingestion venue before Phase I2.
- **ABS:** Data API keyless on `/rest/` — `LF`, `CPI_Q`, `ANA_AGG`,
  `RES_DWELL_ST` current; `CPI_M` stale (keyed Indicator API only if
  monthly cadence is wanted); stale RPPI **replaced by `RES_DWELL_ST`**;
  household ratios → `E2` (verify in I2). Licence CC BY 4.0.
- **Silver / Bitcoin (D3):** gold-api.com primary for both spots (terms
  explicitly permit commercial display); Bitstamp public OHLC for BTC
  history; World Bank Pink Sheet (CC BY 4.0, monthly 1960M01→2026M09)
  for silver history and P2 commodities.
- **Blocked (licence/terms/access):** Coinbase (display prohibited),
  CoinGecko free (screenshots-only + 365-day cap), Coin Metrics
  community (CC BY-NC, 7 points), MetalCharts (nonexistent), Cboe VIX
  (link-out only), S&P 500 / breadth (P3), Stooq (bot gate),
  Blockchain.com (API degraded). **Shiller CAPE deferred P2→P3**
  (Yale data frozen at 2023-09, no licence).
- **Re-verified:** TGJU `ajax.json` (963 symbols, gold ounce fresh) and
  Frankfurter (2026-10-05), cross-consistent. China PMI manual-entry
  plan confirmed (no machine-readable NBS feed).

### Gate I0 decisions (recorded in `docs/PROGRESS.md`)

- **D1 — Cloudflare Free, permanently.** Heavy ingestion via a daily
  GitHub Actions runner writing one compact snapshot per source to KV
  through the Cloudflare REST API; the Worker only reads. Compact
  encoding (consolidated keys, arrays, integer-scaled fixed-point,
  epoch-day dates, rendered series only) keeps usage at ~100–150 KV
  writes/day vs the 1,000 free limit — **no indicator is omitted for
  tier reasons**. KV free limits re-verified live (100k reads/day,
  1k writes/day, 1 GB, **1 KV operation per Worker invocation** → the
  single `insights:snapshot` serve path).
- **D2 — substitutes accepted:** STLFSI4 for stress; VIX link-out;
  S&P/breadth out of v1; CAPE to P3.
- **D3 — silver/BTC sources accepted** (gold-api, Bitstamp, World Bank).
- **D4 — open:** disclaimer reviewer nomination (owner; needed before
  Phase I5, not blocking I1–I4).

Awaiting Gate I0 approval before Phase I1 (contracts + scoring engine).

## [2026-09-20] — Owner wireframe homepage + SWOT v2 + reliability wave

4 commits on `main` (`e3896ec` → this session), 2026-09-20.
Tests **308 → 313 — all green** at every gate; bundle gate held
(288.38 kB / 87.65 kB gz initial JS vs the 290.28/87.77 baseline — the
retired sidebar rail more than paid for the new homepage sections);
precache 59 entries / 2049.25 KiB (+1 entry, +6.4 KiB — About legal
sections + CSS). Every change browser-verified locally (agent-browser
DOM geometry + VLM, en + fa, desktop + 375 px, light + dark) and on
production after deploy.

### Phase A — SWOT v2 (fresh audit against today's code)

- **docs:** `docs/SWOT.md` re-run — production re-probed (health/rates/
  status/history/meta/admin/ETag 304 round-trip), `pnpm audit` CLEAN
  (xlsx CVEs long gone), bundle baseline re-measured identical, delta
  read of everything landed since 2026-09-24 (cron, server history,
  gold, LED boards, retry policy, admin gate). New weakness set is
  maintainability-shaped (the monolith files), the old security set is
  retired. `docs/BACKLOG.md` gained Wave 5 (this session's owner UI
  items) with statuses.

### Owner wireframe — homepage single-column stack (the 8 UI directives)

- **feat(web):** homepage rebuilt per the owner wireframe — full-width
  converting box → **GOLD & CURRENCY LED boards two-up** (gold start
  side; both in the compact CURRENT-only placement) → full-width Quick
  tools section → footer. The desktop two-column dashboard and the
  "at a glance" mini-board (`ConverterAside`) are retired; mobile now
  gets the boards too (`dbd05e2`).
- **feat(web):** ONE shared board component, two placements —
  `LedRateBoard`/`LedGoldBoard` take `showDayStats` (default true);
  `false` removes the DAY HIGH/DAY LOW cells from the DOM and collapses
  the shared subgrid ladder to two tracks at EVERY viewport
  (`.led-current-only`, index.css — re-asserts subgrid so column widths
  stay shared). `/live-rates` untouched: full 3-column board verified.
- **fix(web,a11y):** WCAG 1.4.1 — the retired mini-board's color-only
  live dot is superseded by the boards' text LIVE/CACHED/OFFLINE label.
- **fix(web,a11y):** WCAG 1.4.3 contrast — amount placeholder
  #B39B45→#806215 (≈2.7→5.6:1), dark #5B6B80→#9CA3AF (≈2.6→5.5:1),
  caret #C79100→#8A6D1F; "no change" delta pill muted→gray-700/gray-300
  (≈4.0→8.6:1 light, ≈4.5→8.0:1 dark).
- **feat(web):** nav utility group unified — install · فا · theme ·
  hamburger share one bordered icon-button container
  (`HEADER_ICON_BUTTON_CLASS`), equal 40px hit areas, both themes.
- **feat(web):** trust signals — footer carries Privacy · Terms ·
  Contact · About next to the credit line; the About route gains
  Privacy Policy / Terms of Service / Contact sections (en+fa) with
  sessionStorage-staged deep-link scroll; contact = GitHub (the only
  owner-supplied public channel — no email exists in the repo).
- **rtl:** full fa audit re-run across all 9 routes (en+fa, desktop+
  375 px, light+dark): boards mirror to the start side, no overflow, no
  console errors; digit language decision documented — Persian digits
  (۰۱۲۳) in all standard UI text via `Intl` fa-IR, Latin digits inside
  the DSEG7 LED modules (hardware font, matching the board-date rule).

### Phase B — reliability & i18n wave (BACKLOG items)

- **fix(api):** `/api/health` enriched (BACKLOG #39) — version +
  KV reachability probe (cheapest read); KV failure → 503 + `ok:false`
  for monitors; tests for both shapes (`ae6d6d9`).
- **fix(api):** rate limiting (BACKLOG #18) — per-isolate, per-IP token
  bucket (10 burst / 5 per min) on `POST /admin` +
  `POST /internal/refresh`, checked BEFORE body read or secret work
  (kills the wrong-secret KV amplification); 429 + Retry-After; bounded
  map; documented best-effort (per-PoP isolates). 3 tests.
- **fix(scraper):** `HttpError.code` (BACKLOG #33) — machine-readable
  classification (timeout / dns_or_network / rate_limited / blocked /
  http_4xx / http_5xx) derived from status or abort type; flows into
  `errorToCodeMessage` → status/admin telemetry. All six codes pinned.
- **fix(web):** Odometer respects `prefers-reduced-motion` (BACKLOG #34)
  — final value lands immediately, no rAF count-up.
- **fix(web,i18n):** Receipt/Batch export+share paths through the
  dictionary + `formatNumber` (BACKLOG #27) — fa users now get Persian
  labels AND Persian digits in share text, the receipt paper
  (۲۵٫۵۰ TRY / ۱۲۲٬۸۲۱ IRR (تومان)) and Excel headers; bulk-template
  prefill locale-aware; `navigator.share` titles localized (`58135e6`).

### Verification summary

308 → 313 tests (core 134 · web 17 · scraper 66→67 · api 91→95),
typecheck 4/4 at every commit; agent-browser: golden path (100 USD →
result + LIVE UPDATE), footer deep-links scroll to the About sections,
fa RTL mirroring (gold board start-side), Live Rates full board
unchanged (CURRENT + DAY HIGH + DAY LOW, 0 compact tables), zero
console/page errors everywhere; wrangler dev: enriched health JSON +
11th rapid `/internal/refresh` → 429.

## [2026-09-19] — Ever-green rates + LED shopfront boards session

19 commits on `main` (`732d2df` → `d28f57c`), 2026-09-18 evening → 2026-09-19.
Production live at **https://currena.ir** through Workers versions
`093aaf72` → … → `982cbc43` (final). Tests **279 → 308 — all green** at every
gate; every change browser-verified locally (agent-browser DOM audits + VLM)
and on production, en + fa, desktop + 375 px.

### Ever-green data (fixes the "3-hour-stale rates" report)

- **fix(api):** added the `scheduled` handler + cron `* * * * *` — the same
  ladder runs every minute regardless of visitor traffic (tgju each tick,
  frankfurter on 15-min cadence, fresh-guard caps real scrapes at ~1/5 min);
  measured data age with **zero user traffic: ≤ ~5-6 min** (`732d2df`).
- **fix(scraper):** TGJU cache-bust — `?cb=<epoch-ms>` on `ajax.json`, since
  TGJU's own edge served stale HITs (age 30 min on a 5-min max-age).
- **feat(api):** server-recorded rate history — KV `history:<source>`
  generations, content-fingerprint dedupe (writes only on real value changes —
  free-tier safe), capped 240; recorded from cron + live `/api/rates` scrapes;
  new `GET /api/history` (60 s cache + ETag). Sparklines across the app now
  draw from a shared server history merged into each client at boot — the
  "every currency has the same graph shape" report root-caused (identical
  min-max-normalized local series) and truly fixed (`d28f57c`).

### LED shopfront boards (owner-driven visual identity)

- **feat(web):** dot-matrix LED rate board as the Live Rates hero — DSEG7
  Classic (OFL-1.1) price digits, ghost segments + bulb gradient + halo,
  ticking clock, per-value flash (WCAG-safe), honest derived-quote footnote
  (`732d2df`), then rebuilt as a physical panel: bevel → perforated grid →
  recessed wells → ghosts → dot-matrix bulbs (`824257f`).
- **feat(scraper,core,web):** TGJU's real daily stats — current / day-high /
  day-low ride the snapshot `Rate` entries end-to-end; no invented dealer
  spread (`17169ea`). Shared **CSS subgrid** column lock (headers + every row
  share ONE track definition; measured spread 0.0 px per column) + hot CURRENT
  emphasis (`e8c5837`); currency names +40-50 % / weight 700 with a
  name-first caption layout below md (`a475058`).
- **feat(core,scraper,web):** **GOLD & COINS panel** — 9 TGJU gold/coin
  symbols (ounce in USD, Tehran market), graceful per-item dash degradation,
  same panel language (`b622cee`); gold-heal guard self-fixes visitors holding
  pre-gold snapshots (`8ec6842`); Tehran items converted Rial→**Toman** at the
  one sanctioned place (scraper normalizer) with self-migrating legacy
  snapshots (`97292b1`); phones show a single big CURRENT column on both boards
  (`97292b1`).
- **feat(web):** flags at 2× on the name line; headers/clock/dates in readable
  sans (LED look reserved for price digits) (`5fe3abf`); metal bezel frames —
  six-stop 135° steel + gold ramps with specular highlights, glass-recessed
  boards (`4170a96`, `4eacce9`); per-board headings with emoji, live TGJU
  link pill and last-updated stamp (`1204cba`).
- **feat(led):** fa board date as **«28 شهریور 1405»** (Persian month name,
  day-first logical order) then owner-refined to the RTL `[year][month][day]`
  frame at clock size; TGJU wordmark; `$` prefix on the USD gold-ounce
  modules (`2d91461`, `bf08bf8`).

### PWA & honesty fixes

- **fix(web):** "cached rates" banner/LED blink on boot — banners now render
  only on **confirmed** staleness (server-stale generation or failed fetch),
  never the transient boot hydration (`d782264`).
- **fix(web):** PWA `registerType: 'autoUpdate'` + `skipWaiting` +
  `clientsClaim` + hourly `registration.update()` — every deploy self-applies;
  the "stuck on the previous version" report root-caused (waiting service
  worker that a plain reload never activates) and permanently fixed
  (`6c75ccb`).
- **fix(web,api):** SWOT audit round — receipt/share/history staleness unified
  on `isConfirmedStale`; manifest rebranded **Currena** (was installing as
  "CurrencyPro"); og/twitter share cards; worker security headers (nosniff,
  X-Frame-Options, Referrer-Policy, Permissions-Policy) (`4bd5a9b`).
- **feat(pwa):** Android packaging prep — manifest `id`, real store
  screenshots (narrow 390×844 + wide 1280×720, VLM-verified), app shortcuts
  (Live Rates / Calculator), in-app 📲 install CTA (header + side menu, en+fa,
  `beforeinstallprompt`-driven). The site is fully **PWABuilder-ready**:
  paste currena.ir → Package for Stores → Android → signed APK/AAB
  (`1a80012`).
- **fix(web):** mobile result popup compacted — 3 stacked header rows → 1,
  single Jalali+time line, tightened spacing; measured **378 px** tall at
  390×844 (was viewport-filling), desktop unchanged (`d28f57c`).

### Known considerations

- TGJU remains a single upstream (inherent) — mitigated by cache-busting, the
  ladder, honest notices, the gold self-heal guard, and now server-side
  history (trend data survives upstream hiccups).
- Rate history began accumulating at deploy (2026-09-19 ~04:00Z); shapes
  genuinely diverge as TGJU re-quotes over the coming days. Optional future
  work: seed deeper history from TGJU's own history API (scope-guarded out).

### Open items (next session)

See the hand-off prompt in `docs/BACKLOG.md` lineage — SWOT re-run,
modularization of `apps/web/src/App.tsx` and the route monoliths, performance
& reliability optimization, TGJU history backfill, rate-limit on admin POST.

## [2026-09-18] — Autonomous hardening session

Branch `improve/autonomous-session-2026-09-24` (15 commits, +2,598/−491 lines,
49 files). Live in production at **https://currena.ir** since Worker version
`ddde3962-d0f0-4aab-85c4-04e744638185`.
Audit trail: `docs/BASELINE.md` → `docs/SWOT.md` → `docs/SESSION_LOG.md` →
`docs/FINAL_REPORT.md` (open items live in `docs/BACKLOG.md`).

### Headline metrics

| Metric | Before | After |
| --- | --- | --- |
| Tests (pnpm -r test) | 224 | **279 — all green** |
| Known vulnerabilities (pnpm audit) | 2 HIGH (`xlsx`) | **0** |
| Export-feature vendor chunk | 423.9 kB | **5.6 kB** (zero-dep writer) |
| `Intl` number formatting, 10k ops | 19,511 µs | **624 µs** (31× faster) |
| Web precache bundle | ~2,400 KiB | **1,999.67 KiB** (54 entries) |

### Security & data integrity (Wave 1)

- **fix(core):** settle ledger `__proto__` prototype-key corruption — a crafted
  note could poison `Object.prototype` and corrupt every ledger; added a money
  conservation invariant on persist (`a4bff42`).
- **fix(api):** hardened `/admin` + the KV status trust boundary —
  `SourceStatusSchema` validation on cached status, numeric-field HTML escaping,
  opt-in `ADMIN_VIEW_SECRET` gate (401 + `Retry-After`), 8 KB POST body cap
  (`005fae7`).
- **fix(web):** replaced CVE-laden `xlsx@0.18.5` with a zero-dependency XLSX
  writer; audit went 2 HIGH → 0 and the export chunk shrank 423.9 → 5.6 kB
  (`dd4ebc4`).
- **fix(web):** History delete race (identity-keyed delete) + Settle
  hydration-gated persist — closed a data-loss window on remount (`9b64442`).

### Reliability (Wave 2)

- **fix(api):** scrape-ladder reliability — 25 s scrape deadline, 30 s lock TTL,
  token-scoped locks (crash-safe release), graceful KV-write degradation,
  stale-value propagation on source failure; all covered by tests including a
  real-interleaving stampede test (`da8284f`).
- **feat(web):** reliability pass — ErrorBoundary, prompt-mode PWA update toast
  (workbox-window), honest forced-refresh FAB, collision-safe `uniqueId()` for
  entity IDs (`1ced3d1`).

### Performance (Wave 3)

- **perf(core):** memoized `Intl` formatters — `fa-IR` number formatting 31×
  faster (`b38aca9`).
- **perf(api,web):** `ETag`/`If-None-Match` → **304** on `/api/rates`, 5 s
  isolate snapshot micro-cache, parallel `status()` fan-out, memoized
  `<BoardCardView>`, History formatter hoist (`d041fa3`).

### Correctness & hygiene (Wave 4)

- **fix(core):** symmetric tie rounding (banker-style for .5 remainders),
  display-consistent CSV totals, CSV formula-injection guard, `sourceForPair`
  consolidated into core (6 copies → 1) (`c695fb5`).
- **chore(web,scraper):** dead-code removal (priceScanner block, `readHistory`,
  SCRAPER_VERSION sync) + settle settlement-currency label fix (`db3e22b`).
- **test(core):** penny-mismatch assertion fix — empty note renders as an empty
  CSV field (`76dae79`).

### Documentation & process

- **docs:** pre-session baseline snapshot (`bfc7240`); SWOT audit + prioritized
  39-item session backlog from three parallel deep audits (`2aaefff`); session
  log + final report (`9d91ffb`); production deployment record with the
  `printf`-vs-`echo` secret gotcha (`75866ac`).

### Deployment

- Single deployment topology: Worker `currena-api` serves API + built SPA +
  admin console; Custom Domain **currena.ir** + workers.dev URL, bindings (KV
  `RATES`, `ASSETS`) intact, secrets (`REFRESH_SECRET`, `ADMIN_VIEW_SECRET`)
  persist across versions.
- Post-deploy smoke: **12/12 green** — health, TGJU rates, USD→IRR convert
  parity, AED→EUR 503 messaging, admin gate (401/303/cookie), robots.txt, SPA
  deep link, ETag→304, `/api/status` parallel shape, 413 body cap.
- **Admin gate enabled in production.** Rotate with
  `printf '%s' '<secret>' | pnpm --filter @currena/api exec wrangler secret put ADMIN_VIEW_SECRET`
  (never `echo` — it stores the trailing newline and breaks constant-time
  compare). Delete the secret to return to public mode.
- Rollback: `pnpm --filter @currena/api exec wrangler rollback`
  (previous deployment 2026-09-17T03:12Z).

### Open items (prioritized — see `docs/BACKLOG.md`)

1. Owner rotates `ADMIN_VIEW_SECRET` to their own value
2. Legacy pythonanywhere origin decommission (owner decision, outside repo)
3. Cron pre-warmer `[triggers]` decision
4. TGJU Path-B relay (fallback scrape path)
5. Multi-currency settle ledgers
6. zod `.strict()` request contracts
7. Expanded web tests (rate-history, recent-pairs, router, meta parity)

### Wrap-up (2026-09-18 ~16:20 UTC) — pushed & redeployed

- Final gate re-run at HEAD: typecheck **4/4 packages**, tests **279/279 green**.
- `main` (17 commits, through the changelog wrap-up) and branch
  `improve/autonomous-session-2026-09-24` pushed to
  `github.com/assadigit/Currena` — `origin/main` now matches local exactly.
- Production redeployed from the final HEAD to pin the version marker (runtime
  identical to `ddde3962…` — every commit after `9d91ffb` is docs-only).
- Post-deploy smoke re-verified live: health, TGJU rates, USD→IRR convert
  parity, admin gate.
- Credentials hygiene: push/deploy tokens were supplied via environment
  variables only and were never written to disk, config, or git history.

## Earlier history

See `git log` for the pre-session history on `main` (through `bf61524`).
