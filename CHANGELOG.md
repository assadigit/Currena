# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
as a private monorepo, releases are tracked by date and Workers version rather
than a semver tag.

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
