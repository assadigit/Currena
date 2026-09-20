# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
as a private monorepo, releases are tracked by date and Workers version rather
than a semver tag.

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
