# FINAL_REPORT — Currena Autonomous Session 2026-09-24

**Branch:** `improve/autonomous-session-2026-09-24` (14 commits on top of `bf61524`; main untouched)
**Scope:** Full-repo audit → prioritized backlog → 27 implemented, verified, and committed improvements.
**Method:** Every change: read-before-write → focused fix → regression test(s) → `pnpm -r typecheck && pnpm -r test && pnpm -r build` green → atomic conventional commit → self-review of the diff.

---

## 1 · Measured improvements vs. baseline

| Metric | Before | After | Δ |
|---|---|---|---|
| Tests | 224 (0 in apps/web) | **279** (17 in apps/web) | +55, zero regressions |
| `pnpm audit` | **2 HIGH** (xlsx CVEs) | **0 vulnerabilities** | supply-chain risk eliminated |
| Production build | 4.5 s | 3.9 s | −13% |
| PWA precache payload | 2,399.90 KiB | 1,999.67 KiB | **−400 KiB (−16.7%)** |
| Receipt Excel lazy chunk | 423.91 kB (141.25 gz) | 5.58 kB (1.86 gz) | **−98.7%** |
| `formatNumber` ('fa-IR', this runner) | 19,511 µs/call | 624 µs/call | **31× faster** |
| Odometer animation main-thread cost | ~1.2 s formatting/anim | ~37 ms | ~32× less jank |
| `/api/status` + `/admin` KV round-trips | 4–8 sequential | 2–4 parallel | latency halved+ |
| SPA 30 s polls (same generation) | full payload re-parse | **304 Not Modified** | bytes ≈ 0 |
| Fresh-window `/api/rates` KV reads | 1/request | ~0 (5 s isolate memo) | billed reads ↓ |
| Worst-case failed-scrape request | up to ~2.5 min hang | ≤ 25 s → stale fallback | bounded latency |
| Outdated deps | 3 (all dev, minor) | 3 (unchanged, incl. TS 7 major — deliberately not attempted) | — |

## 2 · What was fixed, and why (highlights — full log in SESSION_LOG.md)

**Data-integrity bugs (reproduced, fixed, regression-tested):**
- `computeBalances` prototype-key corruption — a participant named `__proto__` silently vanished shares and bypassed the duplicate guard. Now Map-based with a null-prototype result.
- `settleDebts` silently dropped unclaimed money on unbalanced input. Now a typed `unbalanced_balances` error with a float-drift-proof tolerance.
- History delete race — two rapid deletes removed the wrong entry (index shift). Now identity-keyed deletes.
- Settle mount-persist wipe — storage was momentarily `'[]'` before hydration (crash = all groups lost; StrictMode doubled the window). Now hydration-gated.
- Same-millisecond entity IDs collided into duplicate React keys/double-mutations. Now `Date.now()*1000 + counter`.
- `roundSignificant` rounded negative/positive .5 ties in opposite directions at ≥1e12.
- Batch CSV totals could disagree with the displayed rows by a cent; notes could execute as spreadsheet formulas (OWASP CSV injection).

**Security:**
- `xlsx@0.18.5` (2 HIGH CVEs, unmaintained npm build) replaced by a 5.58 kB zero-dependency OOXML writer — output independently validated (Python zipfile/ElementTree) and covered by 7 structural tests including an independent CRC-32 cross-check.
- Unauthenticated `GET /admin` (full ops console disclosure) → opt-in `ADMIN_VIEW_SECRET` gate: zero-KV-read 401 gate page, HttpOnly/Strict HMAC cookie session, wrong secrets never render the console, a valid refresh secret cannot bypass the gate. **Unset = previous public behavior + warning banner — the owner flips it on at deploy.**
- KV `status:` entries now zod-validated on read (same poisoned-entry defense as snapshots); `SourceStatusSchema` added to the core contracts; remaining numeric admin interpolations escaped.
- `POST /admin` body capped (413, zero KV reads); `Retry-After` on 503s.

**Reliability:**
- Overall 25 s scrape deadline + lock TTL raised to 30 s + token-scoped lock release (an overran holder can no longer delete a successor's lock; legacy KV lock markers still parse).
- KV write failures degrade gracefully: fresh scrape data is served even when caching/status writes fail; failed lock releases fall back to TTL reclaim.
- Route-level error boundary (localized recovery UI); PWA update prompt (open sessions now learn about new builds instead of running a stale shell); manual refresh FAB no longer lies while fresh.
- `/api/convert` propagates the ladder's `stale`/`notice`.

**Performance (all measured, see §1):** Intl formatter caches (31×), ETag/304, isolate snapshot micro-cache, parallelized status reads, memoized board cards (one card's flash no longer re-renders 8 sparklines), hoisted History formatters.

**Hygiene:** `sourceForPair` (rule-8 routing) consolidated into core (was 6 copies); dead `priceScanner` i18n block (~120 lines) removed; `SCRAPER_VERSION` synced; settlement records carry the group's dominant currency instead of hardcoded `'IRR'`.

## 3 · Remaining risks & recommended next sessions

1. **TGJU single point of failure (product-level, biggest open risk).** Every IRR pair dies with TGJU (rule #8 forbids Frankfurter fallback for IRR). Mitigations, in order of leverage:
   - **Cron pre-warmer** (recommended first): add `[triggers] crons = ["*/4 * * * *"]` to `wrangler.jsonc` + a `scheduled` handler that runs the ladder for both sources. Kills cold-start 503s and the expiry-moment stampede. *Owner decision: increases TGJU request cadence ~from on-demand to every 4 min.*
   - **Path B relay** (GitHub Actions → KV snapshots) as the documented additive fallback if TGJU ever blocks Workers egress.
2. **Enable `ADMIN_VIEW_SECRET` in production** (`wrangler secret put ADMIN_VIEW_SECRET`) — the mechanism is deployed; the console is public until this is set.
3. **Settle multi-currency ledgers:** balances still sum raw amounts across mixed-currency expenses (legacy parity, documented). A per-currency ledger split is the proper fix.
4. **zod `.strict()` on stored contracts** — deferred (stored-KV compatibility tradeoff).
5. **Web test depth:** 17 tests now cover history + the xlsx writer; the next highest-value targets are `rate-history`, `recent-pairs`, `router`, and a meta-schema parity test between `apps/web/src/lib/api.ts` and `apps/api/src/meta.ts` (the fork is documented drift risk).
6. **`/api/status` public detail:** `lastError` messages still expose upstream URLs/shape hints; consider truncating for anonymous callers.
7. **Frankfurter freshness semantics:** the `date` field is ignored (weekend-stale ECB rates read as "fresh").
8. **TypeScript 7 (5.9 → 7.0.2)** — major upgrade, untouched this session.

## 4 · Artifacts

- `docs/BASELINE.md` — pre-session metrics
- `docs/SWOT.md` — audit findings with file:line references
- `docs/BACKLOG.md` — 39 items, 27 ✅ this session, statuses current
- `docs/SESSION_LOG.md` — per-commit what/why/evidence
- Branch pushed to `origin/improve/autonomous-session-2026-09-24` (main untouched; no deploy performed)
