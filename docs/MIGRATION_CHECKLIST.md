# MIGRATION_CHECKLIST — Keep / Defer / Cut (Phase 1 recommendations)

> **Status: DRAFT — awaiting GATE 1 human approval.** Nothing below is cut until you
> approve. Every legacy feature observed on the live site is accounted for (source:
> `docs/FEATURE_MAP.md`). Verdicts map features onto the mission's target
> architecture (§4–§8). Check the box in the "Done" column when rebuilt in Phase 5.

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
| 12 | Price Scanner (camera/upload → server OCR → convert; currency candidates; scan history w/ CSV/PDF; server image gallery) | **K\*** | SPA route with **client-side OCR (Tesseract.js WASM, lazy chunk)** — keeps the mission §7 API surface intact (no `/api/scan-price` on the Worker) and works offline in Capacitor. *Needs your nod — see Open Questions #2* | 5 | ☐ |
| 13 | Batch Converter (bulk textarea w/ tolerant parsing, per-item notes, 3 quick templates, totals, CSV export, copy/share) | **K** | SPA route; single snapshot fetch, all math local; CSV export local | 5 | ☐ |
| 14 | About page (tagline, 5 feature bullets, creator, version) | **K** | SPA route from i18n dictionary | 5 | ☐ |
| 15 | Light/dark theme w/ persistence | **K** | Tailwind `dark:` + localStorage (same key `theme`), pre-paint init | 5 | ☐ |
| 16 | "View on TGJU.org" per-currency profile links | **K** | From `/api/meta` (maps code→profile URL) | 4–5 | ☐ |
| 17 | PWA manifest + icons | **K** | vite-plugin-pwa manifest; **icons actually generated** (legacy declared 72–512 icons but they 404 — its installability is broken [L]) | 5 | ☐ |
| 18 | Persian localization | **K (add)** | Mission-mandated: fa dictionary (translated from the extracted en strings), `dir=rtl`, CSS logical properties, `Intl.NumberFormat('fa-IR')`, Vazirmatn font. Legacy had en-only — this is an intentional addition, not a port | 5 | ☐ |
| 19 | Jalali calendar display | **K** | Render-time formatting only (no stored formatted dates) | 5 | ☐ |
| 20 | Server-side scanned-image gallery (`GET /api/scanned-images`, images retained on server) | **C** (see OQ #3) | Client-side gallery (IndexedDB) instead — no user-image storage on the Worker; privacy-positive, zero infra. Server retention not portable to the target architecture | — | ☐ |
| 21 | Django admin | **C** | Replaced by Phase 6 `/admin` stub (per-source status + manual refresh + future source toggles; robots noindex; Cloudflare Access later) | 6 | ☐ |
| 22 | Server-side convert endpoint doing per-conversion math (`POST /api/convert`) | **K\*\*** | `GET /api/convert?from&to&amount` per mission §7 (server math via core), but the SPA converts **locally** from its snapshot; the endpoint remains for external/API use and parity | 4 | ☐ |
| 23 | Historical charts | **N/A** | **The legacy has NO charts** (verified: no charting library, no chart routes, no chart UI — only html2canvas/jsPDF/xlsx/jalaali as externals). The Gate-1 charts question resolves to *nothing to defer*. If charts are *wanted* later, that's the D1-history work already listed as post-cutover | — | — |
| 24 | `robots.txt` / `sitemap.xml` | **C** | Legacy 404s both. New SPA: sensible robots.txt + `/admin` noindex (Phase 6) | 6 | ☐ |

## Budget & architecture guardrails carried from the mission (Phase 5 acceptance)

- Initial JS **< 200KB gzipped**; converter route ships first; receipt/scanner/admin lazy
- Network **once per freshness window**; all math local (§8 performance model)
- Skeletons exactly match final layout; min-700ms fetching shimmer even on cache hits
- PWA offline shows last good rates with "offline — rates from X" state

## Open questions for Gate 1 (need your decision)

1. **Missing inputs** — `./legacy/` (Django backup) and `credentials.md` are absent
   from the environment. Consequences: (a) inventory is live-site-derived — see
   FEATURE_MAP §10 unknowns; (b) **no `git push` is possible yet** (repo private,
   no token) — commits are local; (c) Phase 2 deploy needs the Cloudflare token.
   → Please provide both (or confirm proceeding live-site-only).
2. **Price Scanner OCR (#12)** — recommend client-side Tesseract.js (keeps API surface
   pure, offline-capable, no per-scan Worker cost). Alternative: Workers AI vision
   (adds an endpoint + cost) or Cut the feature. Your call.
3. **Server-side scan gallery (#20)** — recommend Cut (client-side gallery instead).
   Alternative: keep server storage via R2 (new binding + cost). Your call.
4. **AED naming inconsistency** — legacy shows both "Emirati Dirham" and "UAE Dirham"
   on different pages. Rebuild will standardize on **"UAE Dirham"** unless you prefer
   the other.
5. **Same-currency conversions** — legacy routes USD→USD through Frankfurter (rate 1).
   Rebuild short-circuits locally (rate 1, no network). Cosmetic-only difference.
