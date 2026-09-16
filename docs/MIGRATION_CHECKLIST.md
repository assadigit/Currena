# MIGRATION_CHECKLIST — Keep / Defer / Cut (Phase 1 recommendations)

> **Status: APPROVED at GATE 1 — 2026-09-16.** The owner answered all five open
> questions (decisions recorded at the bottom); verdicts below are final for this
> build. Every legacy feature observed on the live site is accounted for (source:
> `docs/FEATURE_MAP.md`). Verdicts map features onto the mission's target
> architecture (§4–§8). Check the box in the "Done" column when rebuilt.

Legend: **K** = Keep · **D** = Defer · **C** = Cut. Phase = build phase in the new repo.

| # | Feature (legacy evidence) | Verdict | Rebuild as | Phase | Done |
|---|---------------------------|---------|------------|-------|------|
| 1 | Converter core: 17-currency selects, swap, thousand-separated amount input, custom-rate override, result popup w/ LIVE/CACHED indicator, rate + source, Jalali+Gregorian timestamps, copy, share-as-image | **K** | SPA converter route. State machine per mission §8 (idle→fetching≥700ms shimmer→result odometer ~800ms). **All math local via `@currena/core`; network once per freshness window** — amount edits/swap/reverse = zero network. Custom rate stays client-side (`source: "Manual"` parity). Share-image via lazy-loaded html2canvas chunk | 5 | ☐ |
| 2 | Rate sourcing: TGJU for IRR pairs, Frankfurter for international, manual override | **K** | Mission §5 ladder verbatim (TGJU→cached+stale banner→503; Frankfurter likewise; never cross). Legacy behavior already matches the routing rule — direct port | 3–4 | ☐ |
| 3 | Toman unit under code `IRR` | **K** | Canonical `code:'IRR'` + `unit:'TOMAN'`; normalization only in scraper (AGENTS.md §6) | 3–4 | ☐ |
| 4 | Live Rates page: 8 cards, auto-refresh 30s, refresh button, TGJU source links | **K** | Route reading **one** `GET /api/rates` snapshot (replaces 8 separate convert calls — same data, 1 request); auto-refresh honored client-side; source links from `/api/meta` | 5 | ☐ |
| 5 | Cache-warning banner ("Using Cached Rates — Last updated: X ago") + CACHED DATA popup state | **K** | `stale: true` + `notice` from `RatesResponse` → stale banner (mission §6 semantics) | 5 | ☐ |
| 6 | Offline support (SW caching of convert responses, "Offline Cache" source, 503 friendly error) | **K** | vite-plugin-pwa app-shell precache + **last-good snapshot in client storage** → "offline — rates from X" state. Server-side ladder replaces SW response-fabrication | 5 | ☐ |
| 7 | Calculator (eval + live-converted running result) | **K** | SPA route; rate fetched once per pair via `/api/rates` snapshot, math local; **safe expression parser instead of `eval`** | 5 | ☐ |
| 8 | Conversion History (localStorage, 50 max, Jalali+Gregorian dates, source badges, clear-all) | **K** | Same UX; localStorage via typed store; Jalali via `Intl` (fa-IR calendar) or jalaali port in `@currena/core`; dates localized per locale | 5 | ☐ |
| 9 | Receipt Generator: item rows w/ 7 categories + notes, date, **multi-day**, **per-item currency**, **item times**, **budget tracking**, **split**, total summary, receipt paper, **PDF/Image/Excel export**, share | **K** | SPA route. jsPDF + html2canvas + xlsx as **route-level lazy chunks** (legacy loaded 3 CDNs upfront — budget killer). Multi-currency items resolve against the one snapshot locally | 5 | ☐ |
| 10 | Expense Splitter (total, people count, second-currency view, breakdown) | **K** | SPA route; pure local math; second currency from snapshot | 5 | ☐ |
| 11 | Split & Settle (groups, expenses w/ receipt photos, balances, greedy settlements, mark-settled, emoji groups, Android back handling) | **K** | SPA route; localStorage/IndexedDB typed store (photos → IndexedDB, dataURLs bloat localStorage); greedy settlement algorithm ported to `@currena/core` + tests; `popstate` handling kept (Capacitor-ready) | 5 | ☐ |
| 12 | Price Scanner (camera/upload → server OCR → convert; currency candidates; scan history w/ CSV/PDF; server image gallery) | **D** | **Deferred completely at Gate 1** (owner: "defer price-scanner ocr completely"). Revisit post-cutover; when revived, client-side OCR (Tesseract.js WASM, lazy chunk) keeps the mission §7 API surface intact (no `/api/scan-price` on the Worker) and works offline in Capacitor | post-cutover | ☐ |
| 13 | Batch Converter (bulk textarea w/ tolerant parsing, per-item notes, 3 quick templates, totals, CSV export, copy/share) | **K** | SPA route; single snapshot fetch, all math local; CSV export local | 5 | ☐ |
| 14 | About page (tagline, 5 feature bullets, creator, version) | **K** | SPA route from i18n dictionary | 5 | ☐ |
| 15 | Light/dark theme w/ persistence | **K** | Tailwind `dark:` + localStorage (same key `theme`), pre-paint init | 5 | ☐ |
| 16 | "View on TGJU.org" per-currency profile links | **K** | From `/api/meta` (maps code→profile URL) | 4–5 | ☐ |
| 17 | PWA manifest + icons | **K** | vite-plugin-pwa manifest; **icons actually generated** (legacy declared 72–512 icons but they 404 — its installability is broken [L]) | 5 | ☐ |
| 18 | Persian localization | **K (add)** | Mission-mandated: fa dictionary (translated from the extracted en strings), `dir=rtl`, CSS logical properties, `Intl.NumberFormat('fa-IR')`, Vazirmatn font. Legacy had en-only — this is an intentional addition, not a port | 5 | ☐ |
| 19 | Jalali calendar display | **K** | Render-time formatting only (no stored formatted dates) | 5 | ☐ |
| 20 | Server-side scanned-image gallery (`GET /api/scanned-images`, images retained on server) | **D** | **Deferred at Gate 1** (owner: "defer scanning for now" — deferred, not cut). Revisit post-cutover; when revived, client-side gallery (IndexedDB) — no user-image storage on the Worker; privacy-positive, zero infra | post-cutover | ☐ |
| 21 | Django admin | **C** | Replaced by Phase 6 `/admin` stub (per-source status + manual refresh + future source toggles; robots noindex; Cloudflare Access later) | 6 | ☐ |
| 22 | Server-side convert endpoint doing per-conversion math (`POST /api/convert`) | **K\*\*** | `GET /api/convert?from&to&amount` per mission §7 (server math via core), but the SPA converts **locally** from its snapshot; the endpoint remains for external/API use and parity | 4 | ☐ |
| 23 | Historical charts | **N/A** | **The legacy has NO charts** (verified: no charting library, no chart routes, no chart UI — only html2canvas/jsPDF/xlsx/jalaali as externals). The Gate-1 charts question resolves to *nothing to defer*. If charts are *wanted* later, that's the D1-history work already listed as post-cutover | — | — |
| 24 | `robots.txt` / `sitemap.xml` | **C** | Legacy 404s both. New SPA: sensible robots.txt + `/admin` noindex (Phase 6) | 6 | ☐ |

## Budget & architecture guardrails carried from the mission (Phase 5 acceptance)

- Initial JS **< 200KB gzipped**; converter route ships first; receipt/scanner/admin lazy
- Network **once per freshness window**; all math local (§8 performance model)
- Skeletons exactly match final layout; min-700ms fetching shimmer even on cache hits
- PWA offline shows last good rates with "offline — rates from X" state

## Gate 1 decisions (owner answers, 2026-09-16) — GATE 1 PASSED

1. **Missing inputs** — credentials provided (Cloudflare Workers token + account ID +
   GitHub PAT) → push and Phase 2 deploy are unblocked. `./legacy/` Django backup is
   still absent → **confirmed: proceed live-site-only**; FEATURE_MAP §10 unknowns stay
   flagged for re-verification if the backup ever arrives.
2. **Price Scanner OCR (#12)** — **"defer price-scanner ocr completely"** → verdict
   #12 flips K\* → **D**. Revisit post-cutover; Tesseract.js remains the recommended
   approach at that time.
3. **Server-side scan gallery (#20)** — **"defer scanning for now"** → verdict #20
   flips C → **D** (deferred, not cut). Revisit post-cutover; client-side IndexedDB
   gallery remains the recommended approach at that time.
4. **AED naming** — **"use international common name"** → standardize on
   **"UAE Dirham"** (ISO 4217 / CLDR en). General rule added to AGENTS.md §5: currency
   display names use international common names in English; the fa locale renders
   proper Persian names from the i18n dictionary.
5. **Same-currency conversions** — **approved** ("Okay"): rebuild short-circuits
   locally (rate 1, no network) instead of routing through Frankfurter.

**Verdict tallies after decisions: 19 Keep · 2 Defer · 2 Cut · 1 N/A** (was 20/0/3/1).

## Gate 2 decision (owner answer, 2026-09-16) — GATE 2 PASSED

**Path A — the Worker scrapes TGJU directly** (owner: "A. if A failed, path B.").
Path B (GitHub Actions relay writing snapshots into Workers KV) is **not built
now**; it stays the documented additive fallback to adopt only if TGJU ever
blocks Workers egress IPs in production (per Phase-2 evidence, egress currently
works from HKG + ATL colos). Temporary Gate-2 diagnostics deleted after the
decision: `apps/probe`, `.github/workflows/tgju-probe.yml`, and the deployed
`currena-probe` Worker. Phases 3–7 are unblocked; scraper must include quick
retries (one transient CF `error 1042` was observed in Phase 2).
