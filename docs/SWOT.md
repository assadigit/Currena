# SWOT — Currena Deep Audit (2026-09-24)

Synthesized from a full read of all 4 packages (~13.9k LOC, every src + test file),
runtime probes of money-math behavior, and dependency/tooling analysis.
File:line references point at the pre-session tree (base `bf61524`).

---

## Strengths (preserve)

1. **Ports-and-adapters discipline** — `RateStore` port (`packages/scraper/src/store.ts:33-48`), `KvRateStore` adapter, injected store/scrapers/clock in `RatesService` (`apps/api/src/rates-service.ts:85-90`). The whole fallback ladder runs in vitest with zero Workers/KV.
2. **Zod at (nearly) every trust boundary** (rule #3) — scraper outputs, belt-and-braces re-parse in the ladder, poisoned-KV-as-absent, `?source=` enum, build-time-validated meta. One hole: `getStatus` (`apps/api/src/adapters/kv-store.ts:48`).
3. **Money math is deliberate** — documented precision policy (`packages/core/src/math.ts:1-29`): raw doubles in storage, 12-sig-digit rounding on computed results. Fuzzed `1/(1/x)` round-trips: the double rounding repaired 200k/200k adversarial samples. Golden legacy-parity tests pin `100 USD → 23,050,000 IRR`.
4. **Fallback ladder exactly per spec and exhaustively tested** — fresh-cache zero-network, live+status, min-interval, lock-held, force semantics, hard-TTL refusal, invalid-snapshot-as-failure (74 API tests).
5. **i18n/RTL discipline in the SPA** — typed dot-path translation keys, fa dictionary type-checked against en; zero `ml-/mr-/pl-/pr-` hits (logical properties only); numbers via `Intl` at render.
6. **Zero-dep culture** — hand-rolled hash router, CSV via Blob, pure-SVG Sparkline, largest-remainder splitter, Jalali dates via `Intl`; heavy libs (jspdf/xlsx/html2canvas) all behind dynamic imports.
7. **Secret hygiene** — constant-time-ish compare, uniform unauthorized message, 501 fail-safe when `REFRESH_SECRET` unset, never logged.
8. **Admin page XSS-hardened** — CSP `default-src 'none'`, HTML-escape helper everywhere, malicious-KV test.
9. **TS strict everywhere** — `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`; zero `@ts-ignore`/`eslint-disable` in `apps/api`.
10. **localStorage/IndexedDB reads all guarded** — zod/shape-validated, versioned rate-history, corrupt storage never renders.
11. **Scraper tests never hit live sites** (rule #7) — real captured fixtures with documented provenance; loud typed errors on upstream layout change.

## Weaknesses

| # | Sev | Weakness | Where |
|---|-----|----------|-------|
| W1 | **HIGH** | `computeBalances` uses plain objects with `in` checks — a participant literally named `__proto__` silently corrupts the ledger (confirmed repro: 50 units vanish; duplicate guard bypassed) | `packages/core/src/settle.ts:57-84` |
| W2 | **HIGH** | History delete race: `removeEntry` captures index, waits 260 ms for animation, then deletes — two rapid deletes remove the **wrong entry** | `apps/web/src/routes/History.tsx:141-151` |
| W3 | **HIGH** | `settleDebts` accepts unbalanced input and silently drops the residue (exported API, no `Σ≈0` invariant) | `packages/core/src/settle.ts:97-130` |
| W4 | MED | `getStatus` returns unvalidated `JSON.parse(raw) as SourceStatus` — violates rule #3; poisoned status flows into ladder decisions, `/api/status`, `/admin` | `apps/api/src/adapters/kv-store.ts:47-53` |
| W5 | MED | Derived: three numeric admin interpolations unescaped (`ageSec`, `rates.length`, `lastDurationMs`) — stored-XSS-through-poisoned-KV chain with W4 | `apps/api/src/admin.ts:106,110,120` |
| W6 | MED | KV write failures during the ladder escape as 500s **even with fresh data in hand** (failed `putSnapshot`/`putStatus`/`releaseLock` aborts fall-through to stale) | `apps/api/src/rates-service.ts:114-136` |
| W7 | MED | Lock TTL (25 s) ≪ worst-case scrape (~185 s: 16 pages × 3 attempts × 12 s at 4-concurrency) — no overall deadline; lock take-over mid-scrape → duplicate scrapes | `rates-service.ts:32`, `http.ts:45-47`, `tgju.ts:177-211` |
| W8 | MED | `releaseLock` deletes unconditionally — overran holder A deletes successor B's lock, admitting a 3rd scrape | `kv-store.ts:73-75` |
| W9 | MED | **apps/web has ZERO tests** (`--passWithNoTests`) — pure-logic modules (history, rate-history, splitEvenly, router, recent-pairs) untested | `apps/web/package.json:13` |
| W10 | MED | `sourceForPair()` (rule-8 routing logic!) copy-pasted 5× across routes | Converter/Calculator/Receipt/Batch/Splitter `.tsx` |
| W11 | MED | `Date.now()` IDs for receipt items / settle groups / batch fields — same-ms clicks collide → duplicate React keys, `patchItem` mutates two rows | `Receipt.tsx:240,254,281`, `Settle.tsx:261,334,359` |
| W12 | MED | Settle mount-persist race: `useEffect(persist, [groups])` fires with initial `[]` before hydration lands → storage momentarily `'[]'` (crash in window = **all groups lost**) | `Settle.tsx:217-219` |
| W13 | MED | `new Intl.NumberFormat` **per call** in `formatNumber` — Odometer calls ~60×/s; History builds 2 formatters per entry per render | `packages/core/src/format.ts:92-98`, `History.tsx:302-305`, `Odometer.tsx:20-30` |
| W14 | MED | LiveRates re-renders all 8 cards (sparkline + delta chip) on every store tick/flash/copy | `LiveRates.tsx:221-349` |
| W15 | MED | Manual refresh FAB is a silent no-op while fresh (returns without fetching or spinning — lies to the user) | `LiveRates.tsx:374`, `snapshot-store.ts:192-197` |
| W16 | MED | i18n violations in export/share paths: hardcoded English (`'🧾 EXPENSE RECEIPT'`, `'Rate:'`, `'Total:'`…) + raw `toFixed(2)` instead of `formatNumber` (fa users get Latin digits) — ~15 sites | `Receipt.tsx:317-444,827-857`, `BatchConverter.tsx:223-241,375` |
| W17 | MED | No error boundary anywhere — any render throw white-screens the SPA | `apps/web/src/App.tsx` |
| W18 | MED | CSV: rows rounded per-line but total computed on raw values (displayed sum ≠ Total by cents); no spreadsheet-formula-injection guard | `packages/core/src/batch.ts:180-199` |
| W19 | MED | `roundSignificant` rounds negative ties toward +∞ in the ≥1e12 branch (asymmetric with positive) | `math.ts:49-52` |
| W20 | MED | TGJU rates stored as raw unrounded reciprocals (`1/230500 = 4.3383948809…e-06`) — latent trap for any future direct consumer | `tgju.ts:119` |
| W21 | LOW | Dead code: `readHistory()` never imported; `priceScanner` dictionary block has no route; `SCRAPER_VERSION` ('0.2.0') ≠ package.json ('0.1.0') | `rate-history.ts:127-129`, `en.ts:323-352`/`fa.ts:324-353`, `scraper/src/index.ts:20` |
| W22 | LOW | Duplicated helpers: `downloadBlob` ×3, toast-dismiss effect ×6, `SOURCE_KEY` map ×2, `fetchMeta` effect ×2, `normalizeTgjuNumber` vs core `normalizeDigits` (and they **diverge** on `،` handling) | web routes + `tgju.ts:57-76` vs `format.ts:35-51` |
| W23 | LOW | `MetaResponseSchema` forked between api and web (documented trade-off, but no parity test) | `apps/web/src/lib/api.ts:102-123` vs `apps/api/src/meta.ts` |
| W24 | LOW | `parseBatchLines` unbounded (no line/char/amount caps); `/api/convert` drops `stale`/`notice`; `HttpError` has no machine-readable code; calc parser: no unary plus, no U+00A0/newline whitespace, deep nesting → `RangeError` not `CalcError` | `batch.ts:123-141`, `index.ts:178`, `http.ts:35-43`, `calc.ts:75,211-227` |
| W25 | LOW | A11y gaps: no focus trap in dialogs, Odometer rAF ignores `prefers-reduced-motion`, side menu no Escape close | `ResultPopup.tsx:233-246`, `Odometer.tsx:20-30`, `Header.tsx:143-190` |

## Opportunities

| # | Impact | Opportunity |
|---|--------|-------------|
| O1 | **HIGH** | `Intl.NumberFormat`/`DisplayNames` cache keyed by locale+options — fixes 60 Hz Odometer churn + per-row History formatters (`format.ts:92-98`, `frankfurter.ts:40`) |
| O2 | HIGH | First-ever web tests: pure-logic modules are perfectly testable; extracting `sourceForPair`/`splitEvenly` to core makes rule-8 routing unit-testable |
| O3 | MED-HIGH | Edge caching: `ETag`/`If-None-Match`→304 and/or `s-maxage=30, stale-while-revalidate` on `/api/rates` — everything is `no-store` today, so every SPA load pays Worker+KV reads |
| O4 | MED-HIGH | Cron pre-warmer (`[triggers] crons`) to kill cold-start 503s and the expiry-moment stampede (deploy-gated; needs owner approval) |
| O5 | MED | `Retry-After` HTTP header on 503s (value already exists in the body); isolate-level micro-cache of fresh snapshot; parallelize `status()` (4 sequential KV reads); co-locate status with snapshot to halve reads |
| O6 | MED | Property-based testing for money invariants (round-trip, conservation, idempotence) — zero-dep seeded fuzz loops possible |
| O7 | MED | PWA update flow: `virtual:pwa-register` + reload toast instead of silent `autoUpdate` (`vite.config.ts:31`) |
| O8 | LOW | TGJU fixture corpus variants (attribute order, single-quoted attrs, decimal price) to pin loud-failure behavior; ETag/`Retry-After` in `http.ts`; jittered backoff; `/api/health` enrich (KV reachability + version) |

## Threats

| # | Sev | Threat |
|---|-----|--------|
| T1 | **HIGH (supply chain)** | `xlsx@0.18.5` — 2 HIGH CVEs (prototype pollution GHSA-4r6h-8v6p-xvw6, ReDoS GHSA-5pgg-2g8v-p4x9). npm build unmaintained; fixes only on SheetJS CDN. Exploitability low (own-data `aoa_to_sheet` only) but audit-gating and 424 kB of lazy bundle |
| T2 | **HIGH (product)** | TGJU is a single point of failure for every IRR pair (rule #8 forbids Frankfurter fallback). TGJU down + cache >7 d = hard 503 for all Iranian conversions. Path B relay documented but **not built**; no scheduled warmer |
| T3 | MED-HIGH | **Unauthenticated `GET /admin`** serves the full ops console (ladder status, upstream error internals, full rate tables) to anyone — Cloudflare Access only "planned" (`admin.ts:250`). No rate limiting on secret-guessing surfaces; each wrong guess still renders the full page (~8 KV reads) — billing/DoS amplifier |
| T4 | MED | Public `/api/status` discloses upstream error messages (URLs, payload-shape hints) |
| T5 | MED | KV eventual consistency undermines single-flight + min-interval cross-PoP (documented, accepted) — duplicate TGJU scrapes at freshness boundaries under multi-region load |
| T6 | MED | Cold-cache stampede: N simultaneous requests → 1 wins lock, rest get immediate 503 while a scrape is in flight (no coalescing) |
| T7 | MED | TGJU profile regex is first-match-wins on 3 identical spans — a prepended hidden/zeroed span could silently parse a **wrong-but-valid** price (not loud, untested) |
| T8 | MED | Settle: balances sum raw amounts across **mixed currencies**; `markSettled` hardcodes `currency: 'IRR'` — USD-magnitude transfer labeled "IRR (Toman)" |
| T9 | MED | PWA `autoUpdate` with no registration hook — sessions run a stale shell until natural reload |
| T10 | LOW-MED | Unbounded `POST /admin` body read; `photo-store` has no migration path (DB_VERSION 1, silent `null` on blocked); fire-and-forget `deletePhotos` orphans blobs |
| T11 | LOW | Verified non-issues: no SSRF (hardcoded URLs), no header injection, no open redirect, no `dangerouslySetInnerHTML`, no ReDoS (all regexes linear), snapshot poisoning neutralized on read, zod strip-mode drops `__proto__` keys |

---

**Feeds:** `docs/BACKLOG.md` (prioritized execution queue for this session).
