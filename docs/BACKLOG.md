# BACKLOG — Autonomous Session 2026-09-24 (+ 2026-09-20 owner-UI session, + Insights I6 2026-10-07)

Ranked by impact ÷ effort. Tags: SECURITY / RELIABILITY / PERFORMANCE / BEST-PRACTICES / DX / UI-A11Y.
Priority: **Must** (data loss, security, correctness) · **Should** (robustness, perf, hygiene) · **Could** (polish).

Status legend: ☐ todo · 🔄 in progress · ✅ done (this session) · ⏸ escalated/deferred (see notes)

## Wave 11 — I18 the wrap-up audit fix (2026-10-08, fifth round)

A full wrap-up audit of the live I17 deploy (remote state, Worker
version, CI, spec cross-check, production browser QA at 375px) found
exactly one defect: ~37px of scrollable horizontal overflow on
`#/insights` at phone widths in en/LTR. Fixed, redeployed, re-verified.
Tests stayed 747/747 (one utility class changed; no behavioural test
touched).

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 63 | ✅ | UI-A11Y | The L2 group-header answer line (`min-w-0 flex-1`) could shrink below its longest word at 320–414px, bleeding 43–53px of scrollable overflow up to `<html>` (37px page pan at 375px). `min-w-0` removed — the answer wraps to its own full-width line on phones; desktop unchanged. The I17 QA missed it because RTL overflow at the left edge does not extend `scrollWidth` (fa checked first, honestly clean). All other routes + fa re-verified 375/375 | I17 post-deploy audit |

## Wave 10 — I17 the v2 wave (2026-10-08, fourth round)

The owner granted full approval ("nothing from spec must remain, finish all
tasks"), lifting the v2/v2-gated deferral. Tests 711 → 747 green; Insights
chunk 270.01/69.50 vs the justified 280/72 budget (entry untouched).

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 59 | ✅ | UI-TRUST | T1 "Together" connection cards — six relationships (see-saw, dollar/commodities, the oil chain, the growth mix, the export chain, the household rate chain) with leg leans (per-leg change30d thresholds + F3 level bands), a polarity-aware uniform state rule (active/partly/inactive/disagree/unknown), live-value leg chips that open the details panel, RTL-mirroring relation arrows, the computed right-now line, and "evidence: to verify" tags per the spec note | 2026-10-08 UI spec Part 6 (T1) |
| 60 | ✅ | COMPLIANCE | S1–S3 "What the signals say" cards — five gold conditions + silver's industrial sixth (tagged mixed), lean + "n of m conditions met", the three plain checks, the two-sides checklist, and the always-visible "before you act" box; `SIGNALS_ENABLED` flag shipped true (the wording-review gate satisfied by the owner's full approval; one flip from off); no green/red for supportive/against (icons + words); no bare buy/sell wording in EN or FA | 2026-10-08 UI spec Part 6 (S1–S3) |
| 61 | ✅ | UI-A11Y | The Together pill joins the sticky section nav (P1's v2 five-pill list completed); scroll-spy keeps it active through the signals block | 2026-10-08 UI spec P1 |
| 62 | ✅ | BEST-PRACTICES | Bilingual copy corpus for both sections (en + native fa, compile-checked parity + token-set/wording tests); telegraphic leg phrases so no verb agreement breaks across languages | 2026-10-08 UI spec T1/S1 + house i18n rules |

## Wave 9 — I16 the daily-accumulation fix (2026-10-08, third round)

Found by the post-I15 production verification pass (NEXT_SESSION_PROMPT
mission list); both bugs live in the I15 accumulated-daily mechanism.

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 57 | ✅ | RELIABILITY | Same-day live refresh in `withLivePoint` — the seeded price rows kept the first-of-day price while the unseeded gold-silver ratio carried the live one, so same-date cards disagreed in production (68.74 implied vs 69.97 shown); same-date points now replaced by the run's live observation, strictly-newer history still guarded; +2 tests | I15 follow-up verification |
| 58 | ✅ | RELIABILITY | The btc-usd accumulation bootstrap — `buildHistoryFile` `minPoints` option (default 2; ingest passes 1 for the accumulated-daily rows) so a row with no monthly base persists its first daily point; gold-silver joins SEED_IDS (derived.ts already plumbed its seed); +1 test; 3-run/2-day simulation proof | I15 follow-up verification |

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

## Wave 8 — I15 the owner-spec wave (2026-10-08, second round)

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 52 | ✅ | RELIABILITY | Per-series freshness limits (`staleAfterDays`) — Brent's EIA weekly-batch false alarm fixed at the root (12d), NFCI 14, ECB 7, Fed 5, ABS items 95–215; spec release-date numbers adjusted to obs-date aging with documented reasons | 2026-10-08 data spec §3 + ST1 |
| 53 | ✅ | BEST-PRACTICES | Currena dollar basket — dollar_basket.py's recipe ported to TS (weights/scaling/selftest), computed at ingest from the Frankfurter fetch; dollar-broad retired | 2026-10-08 data spec §3 |
| 54 | ✅ | UI-A11Y | The I15 v1 UI blocks: hero verdict meters (LED retired), alert chips by name, big-mover callout, next-up strip, prices board, lane switch, alert cards + compact rows, details side-panel/bottom sheet with focus discipline, sticky scroll-spy nav, SVG status icons, position-word bars, design tokens + type roles + 7:1 secondary ink, FRED notice + attributions, one disclaimer | 2026-10-08 UI spec Parts 0–7 (v1) |
| 55 | ✅ | BEST-PRACTICES | Question gauges + 11 new indicators (fed-target, ecb-dfr, us-cpi-yoy, nfci, dollar-basket, eur-usd, au-home-loan, au-wage-growth, au-rent-yoy, au-petrol-yoy, btc-usd, copper-usd) + below-aux rule + moveScore + bilingual consequence-line corpus | 2026-10-08 data spec §3/§4/§6 |
| 56 | ✅ | COMPLIANCE | v2/v2-gated blocks BUILT AND SHIPPED as I17 (Wave 10: #59–#62) with the owner's full approval — the wording-review gate satisfied in chat ("you have full approval… nothing from spec must remain"); the S3-note legal read (a qualified Australian financial-services review) stays a standing owner-side reminder, and `SIGNALS_ENABLED` is the one-flip off-switch | 2026-10-08 UI spec Part 6 |

## Wave 7 — I14 rate-alerts (2026-10-08, post-sandbox-reset round)

| # | Status | Tag | Item | Origin |
|---|--------|-----|------|--------|
| 51 | ✅ | UI-TRUST | Rate alerts (user-facing): core alerts module (strict parse, inclusive boundary, one-way trigger stamps, cap 20; +11 tests), web store with cross-tab storage-event sync (+12 tests incl. the storage suite — the #38 pattern proven), app-wide evaluation on every snapshot generation via the liveRateView honesty gate, converter section row (unseen-triggered badge with seenAt stamp, A shortcut, live counts), lazy AlertsDialog (create/review/delete, Persian-digit input, honest open-app footer), 26 copy strings × en/fa, two measured contrast fixes (radio 2.35→8.94:1, badge 2.78→6.59:1); budgets held WITHOUT a bump (lazy dialog) | I13 hand-off "strongest remaining user-facing candidate" |

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
| 29 | ✅ | DX | First web tests: `history.ts`, `rate-history.ts`, `recent-pairs.ts`, `router.ts`, `display.ts`, meta-schema parity test | SWOT W9/W23 — `history.ts`/`router.ts` covered; **snapshot-store.ts covered by the I12 wave** (first store tests: boot/freshness/retry-ladder/degraded/ensureSnapshot, 8 tests); closed out 2026-10-08: rate-history (17 — window append/dedupe-by-`at`/cap/quota survival/corrupt-file degradation, seriesForPair core math + unresolvable-pair skips, trendOf, hydrateServerHistory merge/one-shot/silent-failure with stubbed fetch), recent-pairs (9 — corrupt input, unknown-code drops, direction dedupe + move-to-front, cap, quota), display (6 — codeLabel IRR (Toman) rule + en/fa dictionary parity vs core CURRENCIES, no orphans either way); web tests 133→174 |
| 30 | ✅ | BEST-PRACTICES | `splitEvenly` → core (+ tests) next to settle — done in the I13 wave (packages/core/src/split.ts: typed `SplitError`, input validation, exact-sum largest-remainder, +7 tests; Splitter imports from core) | SWOT O2 |
| 31 | ✅ | BEST-PRACTICES | Settle: use group currency for settlement records (stop hardcoding `'IRR'`) | SWOT T8 |
| 32 | ✅ | BEST-PRACTICES | `parseBatchLines` bounds (line/char caps) + calc parser: U+00A0/newline whitespace, unary plus, typed `RangeError` guard — done in the I13 wave (500-line/500-char caps → typed `BatchError` + localized toasts; NBSP/CR/LF whitespace; unary plus; `CalcError('too_deep')` at 128 nesting; +7 tests) | SWOT W24 |
| 33 | ✅ | BEST-PRACTICES | `HttpError` machine-readable code (timeout/dns/blocked/rate_limited) | SWOT W24 |
| 34 | ✅ | BEST-PRACTICES | Odometer: respect `prefers-reduced-motion`; normalize digits in calc input | SWOT W25/W24 |
| 35 | ⏸ | RELIABILITY | Cron pre-warmer: ship `scheduled` handler + **commented** `[triggers]` config — enable-on-deploy is an owner decision (upstream load tradeoff) | SWOT O4 |
| 36 | ⏸ | RELIABILITY | TGJU Path-B relay (GitHub Actions → KV) — architectural, deferred with evidence | SWOT T2 |
| 37 | ⏸ | BEST-PRACTICES | zod `.strict()` on all schemas — contract change affecting stored-KV compatibility; deferred | SWOT W8(core) |
| 38 | ✅ | COULD | Settle multi-tab `storage` sync (History has it) | SWOT W12 — done 2026-10-08: Settle's persistence layer extracted to `lib/settle-storage.ts` (same `splitSettleGroups` shape) with `subscribeSettleGroups`; the route re-hydrates on foreign writes incl. `key === null` (clear), with an equality guard so a value-identical write-back never echoes; +9 tests (corrupt-input fail-soft, quota best-effort, storage-event suite) |
| 39 | ✅ | COULD | `/api/health` enrich (version + KV reachability) | SWOT O8 |
