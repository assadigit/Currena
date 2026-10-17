# 2026-10-18b — the world stock markets board returns to public mode

The owner's report: *"This insights page used to show World important stock
exchanges, but currently it's vanished."* — investigated, culprit found,
section recovered.

## The culprit (investigated, not guessed)

The section never left the codebase — `WorldMarkets.tsx`, the 16-exchange
definitions and the currena-markets cron pipeline all shipped continuously.
It vanished from the PUBLIC page through a chain of three deliberate
2026-10-19b decisions (the "page goes public" owner decree):

1. `apps/api/wrangler.jsonc` set `SITE_MODE=public`.
2. The generated `data/site-mode-overrides.json` declared
   `hiddenBoards: ["markets", "fx"]` (EODHD/Yahoo-backed boards were judged
   not public-display-ok under the owner's then-EODHD plan).
3. The API refused `/api/insights/markets` with 404 `hidden_site_mode`, and
   the public projection (`displayMode:'public'`) made the web hide the
   section entirely — no render, no fetch.

The 2026-10-19e owner directive already restored the four prices tiles the
same way; this round extends it to the world MARKETS board (the owner
supplied their own EODHD key — already the `currena-markets`
`EODHD_API_TOKEN` secret; the standing snapshot is 15/16 EODHD-sourced,
FTSE falls back to Yahoo because the plan carries no EODHD code for it).

Secondary finding while investigating: the KV snapshot was one trading day
stale (Thursday's closes; the Friday 23:30 main run and the Saturday 01:30
retry had not landed). Refreshed manually via the repo's own runner
(`pnpm --filter @currena/insights markets-run`, live EODHD fetch →
write-if-changed, 15 eodhd + 1 yahoo, written 2026-10-17T16:46:43Z) so the
recovered section opened with Friday's closes. The standing crons continue.

## The restoration (one mechanism, honest trail)

- `scripts/generate-indicators-registry.ts` gains
  `OWNER_PUBLIC_BOARD_OVERRIDE` for {markets} with a dated evidence note —
  the overrides file's `hiddenBoards` is now `['fx']` and the directive
  rides in the file as `ownerBoardDirectives`.
- `scripts/check-site-mode.mjs` (T-15): the fx board must stay hidden; the
  markets board must stay PUBLIC (key-pinned, only the owner can re-hide)
  and its directive note must be present.
- `apps/api/src/routes/insights.ts`: the `/markets` and `/fx` public-mode
  refusals are now driven by `HIDDEN_BOARDS` (the generated file) — one
  source of truth; a future generator run that re-hides a board arms the
  404 again automatically.
- `apps/web/src/routes/Insights.tsx`: per-board feed gating — the route
  bundles the same generated overrides file; markets fetches/renders in
  public mode, fx stays licence-hidden, and the US-shares AUD view (which
  needs BOTH feeds) rides the stricter of the two gates.
- Budget bump: Insights lazy chunk 607.00/145.20 → 608.00/145.60 (measured
  607.21/145.24 — the bundled overrides JSON + gating).

## Gates

- Tests 1,486 green (insights 462 · api 238 (+1 public-markets serve test,
  fx 404 pinned) · web 515 · core 191 · scraper 67 · markets 13);
  typecheck 6/6; lint 0 errors / 15 accepted advisories; copy:audit clean;
  `SITE_MODE=public` web build + T-15 passed; bundle budgets held.

## Deployed + production verified (2026-10-17)

- `currena-api` version **`c476307f-4c12-4879-88b2-41cbd844ea65`** (web
  build + worker; SITE_MODE=public, currena-markets untouched), then
  **`9f66a82c-d0d4-494e-a3cd-524eac3b557b`** after integrating remote
  main's PWA fix (`sw.js` no-store — verified `cache-control: no-store`
  live); the final build re-passed the full gates (1,486 tests, T-15,
  budgets) and the section re-verified in the browser.
- `api-before-404.json` / `api-after.json`: `/api/insights/markets` went
  404 `hidden_site_mode` → 200 with 16 markets, asOf 2026-10-16,
  `summary.signal: attention`. `/api/insights/fx` still 404 (by design);
  `/api/insights` still 200 `displayMode:public` (32 readings).
- Browser: the section renders on https://currena.ir/insights in EN and FA
  (heading, as-of line, verdict box, 3 groups Asia-Pacific (7) / Europe (4)
  / Americas (5), 16 tiles); tile detail panel opens (Nikkei 225), the
  "Show full table" disclosure opens (17 rows); the page's own network log
  shows `GET /api/insights/markets → 200`; zero console/page errors; fa
  mobile 375 px scrollWidth === 375 (no overflow).
- Screenshots: `en-desktop-1280-markets.png`, `fa-mobile-375-markets.png`,
  `en-desktop-table-open.png`, `en-desktop-markets-first-paint.png`.
