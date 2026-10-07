# BACKLOG — Autonomous Session 2026-09-24 (+ 2026-09-20 owner-UI session, + Insights I6 2026-10-07)

Ranked by impact ÷ effort. Tags: SECURITY / RELIABILITY / PERFORMANCE / BEST-PRACTICES / DX / UI-A11Y.
Priority: **Must** (data loss, security, correctness) · **Should** (robustness, perf, hygiene) · **Could** (polish).

Status legend: ☐ todo · 🔄 in progress · ✅ done (this session) · ⏸ escalated/deferred (see notes)

## Wave 6 — Insights SWOT re-check + I7 hardening (2026-10-07, I6 session)

Post-UI/UX-pass SWOT of the Insights feature (audit doc: `docs/insights/05-ux-audit-I6.md`).
Done this session: ✅ I7 item 1 below (admin staleness alerting, 3 tests) and the
performance-budget + precache re-measure (documented in the audit doc — entry 288.75 kB /
87.77 gz unchanged, Insights chunk 105.98 kB / 31.94 gz, precache 60 / ~2172 KiB).

**SWOT verdict:** Strengths — bilingual honest data page, all states designed, a11y bar
now WCAG-AA-verified in both themes, lazy chunk within budget. Weaknesses — KV daily-write
cap limits re-ingest flexibility; five indicators still un-backtestable (RBA venue block,
short manual series). Opportunities — per-indicator share links (spec §10), chart hover
tooltips, print stylesheet. Threats — GitHub git-write 500s (runbook exists), TGJU venue
blocks, stale cron going unnoticed (now visible on /admin; push notification still owner-side).

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 45 | ✅ | RELIABILITY | /admin Insights card: staleness alerting — pill flips to "stale — no run for N h" + role=alert past 36 h (was healthy-looking while the snapshot aged); tests admin 108→111 | I7 / NEXT_SESSION_PROMPT |
| 46 | ✅ | RELIABILITY | Failed-ingest push notification — Telegram step in insights-ingest.yml (`if: failure()`; posts run + sha + URL when `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` secrets exist, clean no-op until the owner adds them); YAML-validated | I7 |
| 47 | ✅ | DX | Performance-budget CI gate — `.github/workflows/ci.yml` (push/PR: typecheck + tests + build + budget) + `scripts/check-bundle-budget.mjs` (entry 289 kB / 88 kB gz, Insights 110 / 33) | I7 |
| 48 | ✅ | UI-A11Y | Insights chart hover/focus tooltip — pointermove tracks the nearest point (guide line + dot + date/value tooltip), ← → Home End keyboard stepping, touch-pan-y keeps mobile scrolling; SR table stays the text path | I6 audit F16 |
| 49 | ✅ | UI | Print stylesheet — @media print in index.css: theme forced to the light palette, header chrome + nav buttons hidden (logo kept), cards/sections/figures break-inside: avoid, external links spell out their URL, SVG/LED colors kept exact; verified via PDF export + VLM | I6 audit F16 |
| 50 | ✅ | UI | Per-indicator share links — query-tolerant hash router (`parseRouteAndQuery`, +7 tests), `?card=<id>` deep links open + scroll to the card once per mount, share pill copies the URL with inline feedback, jump targets get scroll-mt-24 | spec §10 |

## Wave 5 — Owner UI wireframe + a11y session (2026-09-20, from SWOT v2)

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 40 | ✅ | UI-A11Y | "Live" non-color signifier next to the green status dot (at-a-glance card) — superseded by the LED boards' existing LIVE text label once the homepage restructure lands | Owner audit |
| 41 | ✅ | UI-A11Y | Contrast ≥4.5:1: amount-input amber placeholder (light+dark) + "no change" delta pill text (light+dark) | Owner audit |
| 42 | ✅ | UI | Nav utility group unified (install / فا / theme / hamburger): one bordered icon-button container, equal hit areas | Owner audit |
| 43 | ✅ | UI-TRUST | Footer: Privacy Policy + Terms of Service links (About-page sections) + contact method next to the credit line | Owner audit |
| 44 | ✅ | UI | Homepage single-column stack: full-width converting box → gold+currency LED two-up row → full-width tools section (at-a-glance mini-board retired) | Owner wireframe |
| 45 | ✅ | UI | Shared LED board component with a CURRENT-only variant (compact placement on homepage; Live Rates keeps day high/low) — one component, two pages, zero drift | Owner wireframe |
| 46 | ✅ | UI-RTL | Full fa RTL audit: every screen mirrored properly (nav order, form alignment, icon flipping); digit-language decision documented (Persian digits in UI text, Latin in DSEG7 modules) | Owner audit |

## Wave 1 — Security & data integrity (Must)

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 1 | ✅ | SECURITY | Fix `__proto__` ledger corruption in `computeBalances` (null-prototype/Map + duplicate guard) + regression tests | SWOT W1 |
| 2 | ✅ | SECURITY | `settleDebts`: reject unbalanced input with typed error (Σ≈0 invariant) + tests | SWOT W3 |
| 3 | ✅ | SECURITY | Add `SourceStatusSchema` to core; validate `getStatus` on KV read + corrupt-status test | SWOT W4 |
| 4 | ✅ | SECURITY | Escape the 3 numeric interpolations in admin HTML (defense in depth with #3) | SWOT W5 |
| 5 | ✅ | SECURITY | Opt-in `ADMIN_VIEW_SECRET`: gate `GET /admin` behind a view secret when configured (public mode preserved when unset; wrong-secret no longer renders full page); cap `POST /admin` body size | SWOT T3/T4/T10 |
| 6 | ✅ | SECURITY | Replace CVE-laden `xlsx@0.18.5` with a zero-dependency XLSX writer (valid .xlsx via stored-zip + sheet XML), keep `Receipt` export UX identical; kills both HIGH CVEs + 424 kB dep | SWOT T1 |
| 7 | ✅ | RELIABILITY | Fix History delete race (recompute index at delete time / delete-then-animate) + test for `removeHistoryEntry` semantics | SWOT W2 |
| 8 | ✅ | RELIABILITY | Fix Settle mount-persist wipe (hydrate before persist / skip first effect run) | SWOT W12 |

## Wave 2 — Reliability (Must/Should)

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 9 | ✅ | RELIABILITY | Graceful degradation on KV write failure in the ladder (serve fresh data anyway; log, never 500 with data in hand) + tests | SWOT W6 |
| 10 | ✅ | RELIABILITY | Overall scrape deadline (~30 s) covering the whole ajax→16-page chain; align `LOCK_TTL_SEC`; value-compared `releaseLock` | SWOT W7/W8 |
| 11 | ✅ | RELIABILITY | Concurrency stampede test: two simultaneous `getRates` with delayed scraper must deduplicate | SWOT W12(api) |
| 12 | ✅ | BEST-PRACTICES | `Retry-After` HTTP header on 503s (body value already exists) | SWOT O5 |
| 13 | ✅ | RELIABILITY | Propagate `stale`/`notice` through `/api/convert` so SPA can banner stale conversions | SWOT W24 |
| 14 | ✅ | RELIABILITY | Unique IDs: replace bare `Date.now()` with monotonic `now()-counter` helper | SWOT W11 |
| 15 | ✅ | RELIABILITY | Route-level error boundary with i18n'd recovery UI | SWOT W17 |
| 16 | ✅ | RELIABILITY | Refresh FAB: force-refetch (bypass freshness) or honest disable | SWOT W15 |
| 17 | ✅ | RELIABILITY | PWA: `virtual:pwa-register` + update toast instead of silent stale shell | SWOT T9 |
| 18 | ✅ | RELIABILITY | In-memory per-isolate rate limit on `POST /admin` + `/internal/refresh` (best-effort, documented) | SWOT T3 |

## Wave 3 — Performance (Should — measured)

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 19 | ✅ | PERFORMANCE | `Intl.NumberFormat` + `DisplayNames` cache in core `format.ts`/frankfurter (fixes 60 Hz Odometer + per-row History churn) — benchmark before/after | SWOT O1/W13 |
| 20 | ✅ | PERFORMANCE | LiveRates: memoized `<BoardCard>` (stop re-rendering 8 sparklines per tick/flash) | SWOT W14 |
| 21 | ✅ | PERFORMANCE | History: hoist `Intl.DateTimeFormat` construction out of the per-entry loop | SWOT W13 |
| 22 | ✅ | PERFORMANCE | `ETag`/`If-None-Match`→304 on `/api/rates`; parallelize `status()` KV reads | SWOT O3/O5 |

## Wave 4 — Best practices & hygiene (Should/Could)

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 23 | ✅ | BEST-PRACTICES | Move `sourceForPair` to `@currena/core` (+ tests); dedupe 5 copies in web routes | SWOT W10 |
| 24 | ✅ | BEST-PRACTICES | Extract `downloadBlob` to `apps/web/src/lib/`; dedupe 3 copies | SWOT W22 — done in the I10 wave (lib/download.ts; Receipt + BatchConverter deduped; the Insights .ics export is the third consumer) |
| 25 | ✅ | BEST-PRACTICES | `roundSignificant`: symmetric negative-tie rounding + test | SWOT W19 |
| 26 | ✅ | BEST-PRACTICES | CSV: total = sum of rounded rows (display consistency) + formula-injection guard (`'` prefix on `=+-@` notes) | SWOT W18 |
| 27 | ✅ | BEST-PRACTICES | i18n: replace ~15 hardcoded English strings + `toFixed(2)` with dictionary keys + `formatNumber` in Receipt/Batch export paths | SWOT W16 |
| 28 | ✅ | BEST-PRACTICES | Dead code: remove `readHistory`, `priceScanner` dict block, pointless `useMemo`; sync `SCRAPER_VERSION` | SWOT W21 |
| 29 | 🔄 | DX | First web tests: `history.ts`, `rate-history.ts`, `recent-pairs.ts`, `router.ts`, `display.ts`, meta-schema parity test | SWOT W9/W23 — `history.ts`/`router.ts` covered; **snapshot-store.ts covered by the I12 wave** (first store tests: boot/freshness/retry-ladder/degraded/ensureSnapshot, 8 tests); rate-history + recent-pairs + display + parity still open |
| 30 | ☐ | BEST-PRACTICES | `splitEvenly` → core (+ tests) next to settle | SWOT O2 |
| 31 | ✅ | BEST-PRACTICES | Settle: use group currency for settlement records (stop hardcoding `'IRR'`) | SWOT T8 |
| 32 | ☐ | BEST-PRACTICES | `parseBatchLines` bounds (line/char caps) + calc parser: U+00A0/newline whitespace, unary plus, typed `RangeError` guard | SWOT W24 |
| 33 | ✅ | BEST-PRACTICES | `HttpError` machine-readable code (timeout/dns/blocked/rate_limited) | SWOT W24 |
| 34 | ✅ | BEST-PRACTICES | Odometer: respect `prefers-reduced-motion`; normalize digits in calc input | SWOT W25/W24 |
| 35 | ⏸ | RELIABILITY | Cron pre-warmer: ship `scheduled` handler + **commented** `[triggers]` config — enable-on-deploy is an owner decision (upstream load tradeoff) | SWOT O4 |
| 36 | ⏸ | RELIABILITY | TGJU Path-B relay (GitHub Actions → KV) — architectural, deferred with evidence | SWOT T2 |
| 37 | ⏸ | BEST-PRACTICES | zod `.strict()` on all schemas — contract change affecting stored-KV compatibility; deferred | SWOT W8(core) |
| 38 | ☐ | COULD | Settle multi-tab `storage` sync (History has it) | SWOT W12 |
| 39 | ✅ | COULD | `/api/health` enrich (version + KV reachability) | SWOT O8 |
