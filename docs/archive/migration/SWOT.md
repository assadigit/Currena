# SWOT — Currena Deep Audit v2 (2026-09-20 session)

Re-run of the 2026-09-18/24 SWOT against today's tree (`origin/main` = `e3896ec`).
Method: full re-probe of production https://currena.ir (health/rates/status/history/
meta/admin GET+POST/ETag round-trip), `pnpm audit`, 308/308 tests + 4/4 typecheck
re-verified, bundle baseline re-measured (290.28 kB / 87.77 kB gz initial JS,
58 precache entries / 2042.89 KiB — identical to hand-off), and a delta read of
everything that landed since the last SWOT (cron keep-warm, server-side rate
history, gold quotes, LED shopfront boards, scraper retry policy, admin view
secret, ETag/304, PWA register hook).

## What changed since the last SWOT (delta context)

- **Cron is LIVE** (`wrangler.jsonc` crons `* * * * *`): keep-warm + TGJU
  cache-bust + server-side rate-history recording (93+ generations in KV at
  probe time). Cold-start 503s and the expiry-moment stampede are gone.
- **Server history** (`/api/history`, 94 generations at probe) feeds the
  sparklines — the fake client-only history is retired.
- **Gold & coins board** landed (TGJU طلا و سکه, Toman-canonical ÷10) with the
  full physical LED language (bezel frames, DSEG7, subgrid column tables).
- **xlsx CVE package replaced** by a zero-dep writer → `pnpm audit` is CLEAN
  (T1 resolved; no known vulnerabilities).
- **Admin is gated**: `GET /admin` → 401 without `ADMIN_VIEW_SECRET` (probed);
  POST without secret → 401 (T3 mitigated).
- **ETag/If-None-Match → 304 works in production** (4.0 s cold → 0.27 s
  revalidate at probe) (O3 delivered).
- **PWA**: `virtual:pwa-register` + hourly `registration.update()` (T9 fixed);
  autoUpdate still skipWaiting+reload on controllerchange.
- **Scraper retry policy exists** (`fetchWithRetry`: 12 s abort, 2 retries,
  300/800 ms backoff, 4xx-not-429 not retried).

## Strengths (preserve — unchanged unless noted)

1. Ports-and-adapters discipline (`RateStore` port, injected store/scrapers/clock) — unchanged, still the backbone.
2. Zod at every trust boundary incl. `getStatus` validation (W4 fixed last cycle) and poisoned-KV-as-absent tests.
3. Money math policy (12-sig-digit rounding, fuzz-pinned round-trips, legacy-parity goldens).
4. Fallback ladder exhaustively tested (91 API tests); graceful KV-write degradation + scrape deadline + value-compared lock release all landed.
5. i18n/RTL discipline (typed dictionaries, logical properties only, `Intl` at render, `Intl` caches fixing the 60 Hz Odometer churn).
6. Zero-dep culture — now stronger: hand-rolled XLSX writer replaced the CVE-laden `xlsx` dep (T1 killed).
7. Secret hygiene + admin XSS hardening (CSP, escape-everything, view-secret gate).
8. Error boundary per route with i18n'd recovery UI (W17 fixed).
9. Ever-green cron: keep-warm + cache-bust + history recording — the reliability spine for a 1-source product.
10. Scraper `HttpError` carries HTTP status + retry classification; `ScraperError` carries machine-readable `code`.

## Weaknesses (today's code)

| # | Sev | Weakness | Where |
|---|-----|----------|-------|
| W1 | **HIGH (maintainability)** | The monolith set is untouched and growing riskier as features land on top: `Settle.tsx` 937, `Receipt.tsx` 917, `Converter.tsx` 556, `BatchConverter.tsx` 554, `LiveRates.tsx` 503, `History.tsx` 426, `ResultPopup.tsx` 400, `api/index.ts` 608 (9 routes + cron inline), `scraper/tgju.ts` 432, i18n dicts 438/435 | Phase C backlog |
| W2 | MED | i18n violations in export/share paths persist: `'🧾 EXPENSE RECEIPT'`, `'Rate:'`, `'TOTAL:'`, `toFixed(2)` raw digits (fa users get Latin digits + English in copied/shared text) | `Receipt.tsx:316-444,825-841`, `BatchConverter.tsx:125,223-241` |
| W3 | MED | `Odometer` rAF count-up ignores `prefers-reduced-motion` (CSS-only coverage elsewhere) | `Odometer.tsx:20-30` |
| W4 | MED | No rate limit on `POST /admin` / `/internal/refresh` secret-guessing (per-isolate best-effort still open) | `index.ts:384,475` |
| W5 | MED | `/api/health` is bare `{ok,service,time}` — no version, no KV reachability (deploy smoke relies on /api/rates for depth) | `index.ts:161` |
| W6 | MED | `splitEvenly` still lives in `Splitter.tsx` (untested, outside core) | `Splitter.tsx` |
| W7 | MED | `parseBatchLines` still unbounded (no line/char/amount caps); calc parser gaps (U+00A0/newline, unary plus, deep-nesting `RangeError`) | `core/batch.ts`, `core/calc.ts` |
| W8 | MED | `HttpError` has `status` but no machine-readable `code` (timeout/dns/blocked/rate_limited) for ladder telemetry | `scraper/http.ts:34` |
| W9 | MED | Settle lacks multi-tab `storage` sync (History has it) — two tabs silently fork the group store | `Settle.tsx` |
| W10 | LOW | `downloadBlob` ×3 dupes; toast-dismiss effect ×6; `fetchMeta` effect ×2 | web routes |
| W11 | LOW | Duplicated i18n dictionary mass (438 lines each) — domain split pending (Phase C) | `i18n/en.ts`/`fa.ts` |
| W12 | LOW | Web test suite still thin (2 files / 17 tests; `--passWithNoTests`): `rate-history`, `recent-pairs`, `router`, `display`, meta parity untested | `apps/web` |
| W13 | LOW | `/api/status` discloses upstream error internals publicly (messages carry URLs/payload hints) | `index.ts:333` |
| W14 | LOW | Homepage (pre-restructure) desktop dashboard is a two-column split; mobile has no boards at all — addressed THIS session per owner wireframe | `Converter.tsx:328` |

## Opportunities

| # | Impact | Opportunity |
|---|--------|-------------|
| O1 | **HIGH** | Phase C modularization (owner-mission): extract per-route components/libs with the 308-test + bundle-size + zero-visual-change gate. Every extraction shrinks review surface for all later features. |
| O2 | HIGH | This session's homepage restructure: single-column stack + shared LED-board instances (gold+currency two-up, CURRENT-only columns) — one shared component, two placements, no drift. |
| O3 | MED-HIGH | `/api/history` micro-cache (per-isolate, 30–60 s): it re-reads + re-parses a 94-generation KV blob on every hit while cron only appends 1/min. |
| O4 | MED | A11y polish wave: WCAG contrast fixes (amount placeholder, no-change pill), non-color "Live" signifier, unified nav utility group — all in this session; then focus-trap dialogs, Escape-close menu, reduced-motion Odometer. |
| O5 | MED | Route-level `React.lazy` audit after restructure (Settle/Receipt already lazy; check entry chunk growth from board components on homepage). |
| O6 | MED | TGJU history backfill from TGJU's own history API (scope-guarded last session) — would deepen sparklines beyond the 94-generation horizon. |
| O7 | LOW | Precache diet: 2042.89 KiB / 58 entries — jspdf (399 kB) + html2canvas (199 kB) chunks dominate; both are already lazy. Evaluate `cleanupOutdatedCaches` + font subsetting; low urgency (offline-first is a stated feature). |
| O8 | LOW | Property-based money fuzz loops in core tests (zero-dep); TGJU fixture variants pinning the first-match-wins regex risk (T7 last cycle). |

## Threats

| # | Sev | Threat |
|----|-----|--------|
| T1 | **HIGH (product)** | TGJU single point of failure for every IRR pair (rule 8 forbids Frankfurter fallback). Cron keep-warm + 7-day stale ladder soften it, but TGJU down >7 d = hard 503 for ALL Iranian conversions. Path B relay (GitHub Actions → KV) still documented-not-built. |
| T2 | MED | KV eventual consistency across PoPs (accepted): single-flight lock + min-interval can double-scrape at freshness boundaries under multi-region load. Harmless (idempotent writes), costs TGJU goodwill. |
| T3 | MED | Unbounded `POST /admin` body + no rate limit: with the view secret set the blast radius is KV-read amplification per guess only, but it's still a guessable-secret surface (mitigated by 401-before-render). |
| T4 | MED | `/api/status` public upstream-internals disclosure (W13). |
| T5 | MED | Bundle creep risk as homepage gains LED boards (entry chunk carries `LedRateBoard`+`LedGoldBoard`+`LedParts` today via LiveRates; homepage placement must not duplicate markup — shared components only). |
| T6 | LOW | TGJU profile-page regex first-match-wins on 3 identical spans — a prepended hidden/zeroed span could parse a wrong-but-valid price (fixture corpus doesn't cover it). |
| T7 | LOW | Verified non-issues carried forward: no SSRF, no header injection, no open redirect, no `dangerouslySetInnerHTML`, ReDoS-linear regexes, snapshot poisoning neutralized on read. |

---

**Feeds:** `docs/BACKLOG.md` (updated queue). Session focus per owner mission:
UI wireframe changes (homepage stack + shared boards + trust footer + a11y
contrast/signifier + nav unification) first, then BACKLOG wave items #18/#27/#33/#34/#39,
then Phase C modularization with its gates.
