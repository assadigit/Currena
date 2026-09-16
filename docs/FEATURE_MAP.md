# FEATURE_MAP — Legacy Inventory (Phase 1)

> **Provenance & fidelity caveat.** The Django backup (`./legacy/`) was **not present**
> in the working environment. This inventory was reconstructed from the **live
> production site** — every feature below was verified against
> https://aliassadi1993.pythonanywhere.com/ on **2026-09-16** (raw captures in
> `legacy-captures/`, gitignored). Nothing here is invented: if it is listed, it was
> observed running. What CANNOT be recovered from outside (models.py, views.py
> source, management commands, admin config, exact server-side scraper selectors,
> cache TTLs) is listed in **§10 Unknowns** and must be re-verified when the
> backup is provided. Evidence tags: **[L]** = exercised live · **[C]** = captured file.

## 1. Overview

| | |
|---|---|
| Product | Currena — Currency Converter (PWA) |
| Live URL | https://aliassadi1993.pythonanywhere.com/ |
| Framework | Django (server-rendered pages + JSON API), classic multi-page app |
| Default language | **English** (`<html lang="en">`, LTR). Persian appears only as the About-page tagline `نرخ ارز لحظه‌ای، تبدیل آسان` |
| PWA | Yes — `/static/manifest.json` + `/sw.js` (cache-first convert API, offline fallback) |
| Author | Ali Assadi ("Made with ❤️ by Ali Assadi") |
| Theme | Light (default) + dark mode toggle, persisted in `localStorage.theme` |
| Font | Google Fonts **Poppins** (300–800) |
| Viewport | Mobile-first, `user-scalable=no`, container max-width 500px mobile / 1200px desktop |
| Title pattern | `<Page> - Currena` |

## 2. Route map (10 routes, all verified live)

| # | URL | Page title | Purpose | Key behaviors [evidence] |
|---|-----|-----------|---------|--------------------------|
| 1 | `/` | Currena - Currency Converter | Main converter | Form `#converterForm`, 17-currency selects, swap, amount with thousand-separator formatting, custom-rate override, result popup with LIVE/CACHED indicator, Jalali + Gregorian timestamps, copy/share (image via html2canvas), TGJU source link, cache-warning banner, saves to history [L][C: index.html, inline-script.js] |
| 2 | `/about` | About Currena | Static about | Logo, Persian tagline, 5 feature bullets, "Created by Ali Assadi", "Version 1.0.0" [L][C: about.html] |
| 3 | `/live-rates` | Live Rates - TGJU | Iranian Toman rates board | 8 rate cards (USD EUR AUD GBP CAD TRY AED CNY → IRR), each fetched via `POST /api/convert {amount:1}`, **auto-refresh every 30s**, manual refresh FAB, per-card "View on TGJU.org" link, "Last updated" time [L][C: live-rates.html] |
| 4 | `/calculator` | Calculator - Currena | Calculator + live conversion | Basic eval calculator (±×÷), input/output currency selects, fetches rate **once per pair**, shows live-converted result line as you type [L][C: calculator.html] |
| 5 | `/history` | Conversion History | Conversion history | Reads `localStorage.conversionHistory` (max 50), Jalali dates (jalaali-js CDN, English month names) + Gregorian + time, per-entry rate & source badge, clear-all with confirm [L][C: history.html] |
| 6 | `/receipt-generator` | Receipt Generator - Currena | Expense receipt builder | Expense item rows (category select w/ 7 categories + notes), from/to currency, receipt date, **multi-day receipts**, **per-item currency**, **add time to items**, **budget tracking** (daily budget + remaining), **split expenses** (per person), sticky total summary, generates "🧾 EXPENSE RECEIPT" paper; exports **PDF (jsPDF) / Image (html2canvas) / Excel (xlsx)** + share; desktop two-pane layout [L][C: receipt-generator.html] |
| 7 | `/expense-splitter` | Expense Splitter | Simple bill split | Total amount, currency, number of people (1–100), optional second-currency display, breakdown list [L][C: expense-splitter.html] |
| 8 | `/split-settle` | Split & Settle - Currena | Group expense tracking | Groups (emoji, members), expenses (description, amount, currency, paid-by, split-between checkboxes, **receipt photo** as dataURL), balances per member, **greedy settlement suggestions** (largest-debtor→largest-creditor), mark-as-settled (inserts settlement expense), FAB, Android back-button handling [L][C: split-settle.html] |
| 9 | `/price-scanner` | Price Scanner - Currena | OCR price scanning | Camera (`getUserMedia`, rear camera preferred) **or** image upload (≤5MB) → `POST /api/scan-price` (server-side OCR) → detected price + currency; ambiguous currency → candidate chooser; instant conversion to target currency; scan history (last 50) w/ CSV & PDF export; **server-side image gallery** (`GET /api/scanned-images`) [L][C: price-scanner.html] |
| 10 | `/batch-converter` | Batch Converter - Currena | Multi-price conversion | Bulk textarea (one amount/line, ignores currency suffixes) or individual fields with notes; quick templates (Shopping 5 / Comparison 3 / Wishlist 10 items); converts all with one rate fetch; totals + converted totals; copy/share/**export CSV** [L][C: batch-converter.html] |

No other routes exist: `/admin`, `/robots.txt`, `/sitemap.xml`, `/api` (bare), `/convert`, `/contact` all return **404** [L].

Side menu (all pages): Home, Receipt Generator, Calculator, Live Rates, Expense Splitter, Split & Settle, Price Scanner, Batch Converter, History, About [C: index.html].

## 3. JSON API surface (Django backend, all verified live)

### `POST /api/convert` — the workhorse (used by 7 pages)

Request:
```json
{ "amount": 100, "from_currency": "USD", "to_currency": "IRR", "manual_rate": null }
```

Success response:
```json
{
  "success": true,
  "result": 23050000.0,
  "rate": 230500,
  "source": "TGJU",            // "TGJU" | "Frankfurter" | "Manual"
  "is_cached": false,
  "offline_mode": false,        // observed in SW fallback path
  "cache_age": null,            // timestamp of the cached snapshot when cached
  "cached_at": null,            // ISO string variant (SW writes this)
  "timestamp": "2026-09-16T17:26:10.906807"
}
```

Error response (e.g. unknown currency): `{ "success": false, "error": "Unable to fetch exchange rate. Please try again." }`

Observed behaviors [L]:
- IRR pairs → `source: "TGJU"`; international pairs (e.g. EUR→USD) → `source: "Frankfurter"` — **the legacy already implements the mission's §5 routing rule**
- Same currency (USD→USD) → rate 1 via "Frankfurter"
- `manual_rate` overrides everything → `source: "Manual"`
- Client always sends `manual_rate` (null when unused)

### `POST /api/scan-price` — server-side OCR [L via client code; endpoint not exercised with an image]

Multipart `image` file → `{ success, price, currency, needs_confirmation, candidates[] }`.
When `needs_confirmation` is true the client renders a currency-candidate chooser.

### `GET /api/scanned-images` — server-side scan gallery [L]

Returns `{ "success": true, "count": 3, "images": [...] }` — scanned images are retained
server-side (Django media). **Decision needed:** see MIGRATION_CHECKLIST #16.

### `GET /sw.js` — service worker [C: sw.js]

- Precaches `/` + logo
- Network-first for everything; **special-cases `POST /api/convert`**: caches the last
  response per `(from,to)` pair in a dedicated cache (`currena-rates-v1`); on network
  failure responds from cache with `source + " (Offline Cache)"`, `is_cached: true`,
  `offline_mode: true`, recomputing `result = amount × cached rate`; 503 with a
  friendly message when no cache exists.

## 4. Rate sourcing — full extraction

### TGJU (Iranian open-market, Toman) — 16 currency profiles

Every IRR-involving conversion and every Live-Rates card is backed by a TGJU profile
page [C: inline-script.js `currencyUrls`]:

| Code | TGJU profile URL |
|------|------------------|
| USD | `https://www.tgju.org/profile/price_dollar_rl` |
| EUR | `https://www.tgju.org/profile/price_eur` |
| GBP | `https://www.tgju.org/profile/price_gbp` |
| AUD | `https://www.tgju.org/profile/price_aud` |
| CAD | `https://www.tgju.org/profile/price_cad` |
| TRY | `https://www.tgju.org/profile/price_try` |
| AED | `https://www.tgju.org/profile/price_aed` |
| CNY | `https://www.tgju.org/profile/price_cny` |
| CHF | `https://www.tgju.org/profile/price_chf` |
| JPY | `https://www.tgju.org/profile/price_jpy` |
| KRW | `https://www.tgju.org/profile/price_krw` |
| MYR | `https://www.tgju.org/profile/price_myr` |
| IDR | `https://www.tgju.org/profile/price_idr` |
| PHP | `https://www.tgju.org/profile/price_php` |
| VND | `https://www.tgju.org/profile/price_vnd` |
| NZD | `https://www.tgju.org/profile/price_nzd` |

"View on TGJU.org" links point at these profiles (converter popup + live-rates cards).

**Server-side scraping internals (selectors, parser, UA, cache TTL) live in the Django
code — NOT recoverable from outside.** §10. What IS known:
- Served values match TGJU Toman quotes (see unit convention below)
- The server has a cache layer: responses can carry `is_cached: true` + `cache_age`
  (the converter shows a "Using Cached Rates" banner and a CACHED DATA popup indicator)
- The SW adds a *second*, client-side cache layer for offline use

### Frankfurter (international pairs)

`source: "Frankfurter"` for non-IRR pairs [L]. Exact endpoint/params are server-side
(§10) — mission §5 specifies `https://api.frankfurter.dev` for the rebuild, which is
behaviorally consistent with observed rates (EUR→USD 1.1537 ≈ ECB reference).

### Toman vs Rial convention — CANONICAL: **TOMAN**

Evidence chain [L]:
1. `POST /api/convert USD→IRR` → `rate: 230500` — the TGJU `price_dollar_rl` quote in **Toman** (a true Rial figure would be 10×)
2. UI label for `IRR` is **"Iranian Toman"** everywhere (flag labels, option lists)
3. PWA manifest description: *"Modern currency converter with live Iranian Toman rates"*
4. About page: addresses "the Iranian Toman" explicitly

⇒ The legacy uses ISO code `IRR` as the *label* for **Toman-denominated** values.
**Rebuild rule (AGENTS.md §6):** canonical form is `code: 'IRR'` + `unit: 'TOMAN'`;
any Rial↔Toman conversion happens only inside the scraper normalizer, never in UI.

### Persian-digit handling

The legacy UI is English/LTR and formats numbers with `toLocaleString('en-US')`; no
Persian digits are rendered anywhere [C]. Persian-digit *input* normalization is
therefore not present in legacy client code — the mission adds it for the fa locale
(`packages/core` normalizer, Phase 3). TGJU pages themselves serve Persian digits in
some elements — the scraper must normalize ۰-۹ (+ Arabic-Indic variants) regardless.

## 5. Asset list (canonical codes + display names)

17 currencies [C: index.html selects, expense/receipt selects]:

| Code | Display name (legacy, English) | Type | Source |
|------|-------------------------------|------|--------|
| USD | US Dollar | currency | TGJU `price_dollar_rl` / Frankfurter |
| IRR | Iranian Toman | currency | TGJU base (unit: TOMAN) |
| EUR | Euro | currency | TGJU `price_eur` / Frankfurter |
| GBP | British Pound | currency | TGJU `price_gbp` / Frankfurter |
| AUD | Australian Dollar | currency | TGJU `price_aud` / Frankfurter |
| CAD | Canadian Dollar | currency | TGJU `price_cad` / Frankfurter |
| AED | Emirati Dirham / "UAE Dirham" (inconsistent legacy labels) | currency | TGJU `price_aed` / Frankfurter |
| CNY | Chinese Yuan | currency | TGJU `price_cny` / Frankfurter |
| NZD | New Zealand Dollar | currency | TGJU `price_nzd` / Frankurter |
| TRY | Turkish Lira | currency | TGJU `price_try` / Frankfurter |
| CHF | Swiss Franc | currency | TGJU `price_chf` / Frankfurter |
| JPY | Japanese Yen | currency | TGJU `price_jpy` / Frankfurter |
| KRW | South Korean Won | currency | TGJU `price_krw` / Frankfurter |
| MYR | Malaysian Ringgit | currency | TGJU `price_myr` / Frankfurter |
| IDR | Indonesian Rupiah | currency | TGJU `price_idr` / Frankfurter |
| PHP | Philippine Peso | currency | TGJU `price_php` / Frankfurter |
| VND | Vietnamese Dong | currency | TGJU `price_vnd` / Frankfurter |

> **Gate 1 decision (2026-09-16):** the rebuild standardizes all display names on
> **international common names** (ISO 4217 / CLDR en) — AED renders as
> **"UAE Dirham"**, resolving the legacy inconsistency.

**No crypto, gold, or coin assets exist in the legacy app** (the mission's example
codes `COIN_EMAMI`/`GOLD_18K` do not apply — noted for the record).

Per-page subsets: Live Rates shows 8 (USD EUR AUD GBP CAD TRY AED CNY); Split&Settle
expense currency offers 8; Price Scanner target offers 7; Batch Converter offers 11;
Receipt Generator & Expense Splitter offer all 17.

Static assets: `/static/images/currena-logo.png` (33KB [C]), per-currency flag PNGs
`/static/images/flags/<code>.png` [C], PWA icons 72–512 declared in manifest but
**404 on the live site** (not deployed — the legacy PWA install is broken) [L].

## 6. Client-side data models (localStorage)

| Key | Shape | Cap | Used by |
|-----|-------|-----|---------|
| `conversionHistory` | `{amount, from, to, result, rate, source, is_cached, cache_age, timestamp}[]` | 50 (newest first) | converter (write), history (read) |
| `priceHistory` | `{price, currency, converted, targetCurrency, rate, timestamp}[]` | 50 | price scanner |
| `splitSettleGroups` | `{id, name, emoji, members: string[], expenses: {id, description, amount, currency, paidBy, splitBetween: string[], date, photo: dataURL|null, isSettlement}[], settlements: [], createdAt}[]` | unbounded | split & settle |
| `theme` | `'light' \| 'dark'` | — | all pages |

## 7. External dependencies (CDN)

| Library | Where | Purpose |
|---------|-------|---------|
| html2canvas 1.4.1 | converter, receipt | share-image rendering |
| jsPDF 2.5.1 | receipt | PDF export |
| SheetJS (xlsx) 0.18.5 | receipt | Excel export |
| jalaali-js 1.2.6 | history | Jalali date conversion |
| Google Fonts Poppins | all pages | typography |

(Converter implements its own `gregorianToJalali` inline — duplicated logic across pages.)

## 8. Visual identity (for the Phase 5 port)

- **Palette (CSS variables):** soft `#E8F4F8`, primary blue `#4A90E2`, cyan accent
  `#7DD3C0`, coral accent `#F8A978`, text `#2C3E50` / muted `#6B7280`, warning
  `#FF6B6B`, success `#4CAF50`, CTA gradient `linear-gradient(135deg,#667eea,#764ba2)`
- **Light mode:** bg `#F8FAFB`, white cards, 25px card radius, soft shadows
  (`0 8px 30px rgba(0,0,0,0.08)`); **Dark mode:** bg `#1a1d2e`, cards `#252941`
- **Amount input:** cream/gold gradient panel (`#FFF9E6→#FFE999`, border `#FFE066`)
- **Navbar:** fixed 65px (80px desktop), blur backdrop, logo left; theme toggle 🌙/☀️ + hamburger right; slide-in side menu from the right (280px) with emoji menu items
- **Motion:** 0.3s ease transitions, button shine sweep, loader = 3 bouncing dots
  (blue/cyan/coral), result popup slide-up 0.4s, live-dot pulse, warning pulse
- **Emojis as icon system** throughout (💵💰🔄📊🧾…)
- **Layout:** single 500px column on mobile; converter = flags row → selector grid →
  amount panel → collapsible custom-rate → CTA; receipt page = two-pane desktop grid
- **Manifest identity:** name "Currency Converter Pro", short "CurrencyPro",
  theme `#D4AF37` (gold), background `#1a1a2e`, standalone, portrait

## 9. i18n status

- Default and only UI language: **English**; `dir` always `ltr`
- Sole Persian string: About tagline `نرخ ارز لحظه‌ای، تبدیل آسان` ("real-time rates, easy conversion")
- Jalali months rendered as English transliterations (Farvardin…Esfand)
- Full string extraction (all 10 pages) → `apps/web/src/i18n/{en,fa}.ts`
  (en = verbatim legacy strings; fa = translation, mission-mandated addition)

## 10. Unknowns — require `./legacy/` to verify (blocked items)

1. **Django models** — unknown whether rates/history are persisted server-side or
   scraped per-request (response `timestamp` + `is_cached` implies *some* server cache)
2. **Scraper internals** — exact TGJU request details (User-Agent, headers), parser
   (regex/BeautifulSoup/selectors), Frankfurter endpoint & params, timeout/retry policy
3. **Cache TTLs** — server-side freshness window for TGJU/Frankfurter quotes
4. **Management commands** — any scrape/cron jobs (PythonAnywhere scheduled tasks)
5. **Admin** — Django admin exists? (`/admin/` 404s publicly; could be URL-remapped)
6. **OCR implementation** — which engine powers `/api/scan-price` (pytesseract? cloud?)
7. **Rate limiting / abuse guards** on the API
8. **`/api/scanned-images` retention policy** (3 images currently retained server-side)

**These unknowns do not block Gate 1** — the mission's target architecture (§4–§8)
replaces the server internals by design (KV ladder, fixtures, zod contracts) — but
#1–#3 should be cross-checked when the backup arrives to catch any behavioral nuance
(e.g. buy/sell spreads, change-percent) the outside view can't see.
