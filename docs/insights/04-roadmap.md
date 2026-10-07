# 04. Roadmap

## 1. Goal and non-goals

**Goal:** ship `#/insights`, a bilingual page with about 30 indicators, a transparent warning-count summary, trend and 10-year position on every card, a weekly "what changed" list, a key-dates calendar, and plain-language explanations, all using only data that may legally be displayed.

**Non-goals:** buy/sell recommendations, personal advice, price alerts, user accounts, per-indicator share links (later), licensed market data (P3 until decided).

## 2. Architecture

Three data tiers, by how fast the data moves:

| Tier | Examples | Runs where | How often |
|---|---|---|---|
| **Live** | Gold ounce (TGJU, already scraped), Frankfurter FX | Existing Worker cron and ladder | Existing cadence |
| **Daily** | FRED series, RBA CSVs, silver, Bitcoin | Ingestion runner (see below) | Once a day |
| **Slow** | ABS (monthly and quarterly), World Bank, Shiller CAPE, manual China PMI | Ingestion runner | Weekly check |

### Where ingestion runs (decision at Gate I0)

**Default: a scheduled GitHub Actions job (Node), not the Worker.** Reasons, all from Cloudflare's published limits: on Workers Free a cron gets 10 ms of CPU and 50 subrequests, and the Currena Worker already uses one of only five cron triggers. Parsing large CSV or JSON series will not fit. The repo already documents this pattern ("Path B", a GitHub Actions relay writing into KV) in `AGENTS.md` rule 8.

- The job fetches sources, validates everything with zod, computes percentiles, changes and states, and writes **one snapshot** to KV through the Cloudflare REST API.
- Secrets (FRED key, a KV-scoped Cloudflare token) live in GitHub Actions secrets. The owner creates them; the agent never sees or stores their values.
- The Worker only **reads** the precomputed snapshot and serves it (cheap, no heavy CPU).

**Alternative if the Worker is on the Paid plan:** run the same runner code from a second cron trigger inside the Worker (30 s CPU, up to 10,000 subrequests). The runner is written as pure functions behind an interface so this swap is a small change.

### Contracts and storage

- **Contracts** go in `packages/core/src/schemas.ts` as zod schemas (`AGENTS.md` rule 3): `IndicatorId`, `IndicatorDefinition` (static config: id, group, section, source, cadence, rule), `IndicatorReading` (value, asOf, change7d, change30d, percentile10y, status, sourceName, sourceUrl, updatedAt), `InsightsSnapshot` (generatedAt, global and australia summaries, readings, changedThisWeek, calendar), `CalendarEvent`.
- **Storage** goes behind a new `InsightsStore` interface (like `RateStore`) with a KV adapter, a REST-API writer for the runner, and an in-memory adapter for tests.
- **KV keys:** `insights:snapshot` (summary plus all card data, small), `insights:hist:<id>` (downsampled 10-year series, loaded when a card expands), `insights:status` (per-source freshness for the admin console).
- **Write budget:** about 30 history keys plus one snapshot per run is far below the KV daily write limits on the Free plan. Write only when data changed.

### API (Hono, `apps/api`)

- `GET /api/insights` returns the snapshot. ETag and `If-None-Match` support, like `/api/rates`.
- `GET /api/insights/:id/history` returns the series for one card.
- Both validated with the shared zod schemas and typed through Hono RPC.
- The existing `/admin` console gains per-source freshness rows for Insights.

### Package layout

- `packages/insights` (new, `@currena/insights`): source adapters, normalisers, the scoring engine. Pure TypeScript, tested with fixtures, no platform-specific imports.
- `apps/api/src/routes/insights.ts`: the two read routes.
- `scripts/insights-ingest.ts` and `.github/workflows/insights-ingest.yml`: the runner and its schedule.
- `apps/web/src/routes/Insights.tsx` (lazy-loaded) plus `apps/web/src/components/insights/*`.
- `data/insights-calendar.json` and `data/manual/china-pmi.json`: hand-maintained, zod-validated.

## 3. Phases

Every phase ends with typecheck and tests green, a `phase(I<n>): summary` commit, and an update to `docs/PROGRESS.md`. **✋ means stop and wait for owner approval.** Do not start the next phase without it.

### Phase I0: Preflight and decisions ✋

- [x] Read `AGENTS.md`, `docs/PROGRESS.md`, `docs/BACKLOG.md`, and this folder.
- [x] Confirm the Cloudflare plan (Free or Paid) with the owner and decide the ingestion venue. **DECIDED 2026-10-06: Free, permanently; heavy ingestion via a daily GitHub Actions runner writing compact snapshots to KV; light live sources stay on the existing Worker cron.**
- [x] ~~Owner creates a free FRED API key~~ **Not needed** — the keyless `fredgraph.csv` route serves every planned series (probe 2026-10-06). GitHub/Cloudflare secrets are deferred to Phase I3 setup (one KV-scoped Cloudflare token as a GitHub secret).
- [x] Run the verify-first probe for every source in `03-data-sources.md`; record results there. **Done 2026-10-06 — full verdict register, including blocked sources and licence findings.**
- [x] Decide the substitutes for the blocked items (credit spread, VIX, S&P 500, breadth). **STLFSI4; VIX link-out; S&P/breadth out of v1 (P3); CAPE deferred to P3.**
- [x] Decide silver and Bitcoin sources after reading their terms. **gold-api.com primary (spot), Bitstamp OHLC (BTC history), World Bank Pink Sheet (silver history).**
- [x] Confirm who reviews the disclaimer and copy for Australian financial-services rules. **D4 — ANSWERED 2026-10-06: no disclaimer for v1 (owner: "I dont need disclaimer for now"); the no-advice-wording rule stays.**
- **Exit:** `03-data-sources.md` fully verified ✅; open decisions answered in `docs/PROGRESS.md` ✅ (D1–D4 all answered). **Gate I0 APPROVED 2026-10-06 (owner: "Proceed").**

### Phase I1: Contracts and scoring engine (no network)

- [x] Add the zod schemas to `packages/core`. **Done 2026-10-06** — `IndicatorId`, `WarningRule` (7 atom kinds + flat any-of), `IndicatorDefinition`, `IndicatorReading`, `SummaryLine`, `ChangedEvent`, `CalendarEvent`, `InsightsSnapshot`.
- [x] Build `packages/insights` scoring: percentile, 7/30-day change, rule evaluation (all rule types in `01-indicator-spec.md`), summary vote and label, "what changed this week", stale handling. **Done 2026-10-06** — plus fixture parsers (the parse halves of the I2 adapters) and the 28-definition table.
- [x] Table-driven unit tests for every rule type and edge case (empty series, short history, direction, ties). **69 tests** (plus 18 new core contract tests; repo total 400 green).
- [x] Recorded historical fixtures for 2008, 2020 and 2022, and a backtest script that writes `docs/insights/BACKTEST.md`. **Fixtures: FRED ×10, Frankfurter, World Bank Pink Sheet, ABS CPI ×2 + unemployment (RBA absent — sandbox-blocked).**
- **Exit:** tests green ✅; backtest written and agent-reviewed ✅ — **awaiting owner review of `docs/insights/BACKTEST.md` (approve or adjust thresholds).**

### Phase I2: Source adapters and fixtures

- [x] One adapter per provider (FRED, RBA CSV, ABS, World Bank, silver, Bitcoin — Shiller deferred to P3 per Gate I0 D2), each validated with zod and returning a canonical series. **Done 2026-10-06** — `packages/insights/src/adapters/` (fred / frankfurter / abs / worldbank / goldapi / bitstamp / tgju / rba / manual) + the dependency-free web-standard XLSX reader + the derived-series assembly (`buildIndicatorSeries`, the production twin of the backtest SERIES map). Import surface split: package root stays pure for the SPA; `@currena/insights/adapters` carries the fetch halves.
- [x] Record small fixtures per adapter; tests run only against fixtures. **Done** — gold-api ×2, Bitstamp OHLC, Frankfurter small timeseries, ABS SDMX ×5 (live response format), the full real World Bank XLSX, and the real RBA bytes fetched from the ingestion venue (probe run 37492764171). 110 package tests, all fixture-backed.
- [x] Failure behaviour: an upstream change fails loudly in the adapter and produces a stale or unavailable reading, never wrong data. **Done** — every adapter throws (zod contracts, header/series/unit identity checks, ascending assertions); the one-off live run prints per-source failures and marks affected indicators unavailable (RBA from the sandbox is the standing example).
- [x] P1 indicators first; P2 adapters after. **Done** — all P2 adapters with verified sources are in (FRED T5YIFR/M2SL/govt-pair/DCOILBRENTEU, WB copper/iron-ore, ABS TTR/RES_DWELL_ST, RBA E2 debt-to-income); the manual china-pmi loader is fixture-tested, data population is Phase I5/I6 content work.
- **Exit:** adapters green on fixtures ✅; a manual one-off live run prints sane values for every P1 indicator ✅ — final venue run (GitHub Actions, 2026-10-06): 27/27 fetches OK, `P1 COMPLETE`, Global relaxed 1/8, Australia cautious 3/10 (0 excluded). **Awaiting Gate I2 review.**

### Phase I3: Ingestion runner and storage ✋

- [x] Implement `InsightsStore` and its adapters. **Done 2026-10-07** — contract in `@currena/insights/store` (`InsightsReader`/`InsightsWriter` interfaces, key names, `InMemoryInsightsStore` for tests, `RestInsightsStore` — the Cloudflare REST writer with injected fetch and 429/10048 daily-cap retry); the Worker's read half is `apps/api/src/adapters/insights-store.ts` (`KvInsightsReader`, poisoned-entry defense like `KvRateStore`). Wire formats are core contracts: `IndicatorHistory` (epoch-day pairs) + `InsightsStatus` (+ `InsightsSourceReport`). Keys live in the EXISTING RATES namespace (no new binding), domain-separated by the `insights:` prefix, NO TTLs (freshness is data, history never expires).
- [x] Runner script plus the scheduled workflow (daily, plus a weekly slow-tier check). **Done 2026-10-07** — `scripts/ingest.ts` (+ shared `collect.ts`, the extracted live-run fetch phase so the two cannot drift) and `.github/workflows/insights-ingest.yml`: cron **04:20 UTC daily** + `workflow_dispatch` with a `dry_run` input. One schedule instead of daily+weekly: the fetches are cheap and every source is health-checked daily; slow-tier history writes are change-detected (read-compare) so the weekly distinction had no budget effect. 04:20 UTC is deliberately inside the fresh post-midnight slice of the account's 1,000 KV REST writes/day (the write counter crosses 1,000 around ~19:00 UTC — Phase I3 record in 03-data-sources.md). Exit code 1 when any P1 indicator is unavailable (a red run is the stale-feed signal until I7 alerting).
- [x] 10-year history backfill (World Bank monthly, Bitcoin daily candles in chunks, RBA F11 monthly). **Done with recorded scope cuts** — every FRED/Frankfurter/ABS/RBA/WB series already arrives with full history and feeds `insights:hist:<id>` (downsampled to ≤520 points, epoch-day encoded, single-point live cards get no key). The Bitstamp 10-year candle backfill and RBA F11 were **skipped: no v1 consumer** — gold-btc/silver-btc/gold-aud are single-point by spec (no verified daily gold history exists to pair with BTC/FX history), and FX percentiles come from Frankfurter's 10-year window. Bitstamp stays as the live BTC cross-check. Revisit if a BTC-price or longer-history card is ever added.
- [x] Worker routes `/api/insights` and `/api/insights/:id/history`, ETag, security headers like the rest of the API. **Done 2026-10-07** — `apps/api/src/routes/insights.ts` mounted in index.ts; content-addressed ETags + If-None-Match 304s (`"insights:<generatedAt>"`, `"insights-hist:<id>:<n>:<lastEpochDay>"`), `public, max-age=60`/`300` (the /api/history precedent), RatesError envelopes, shared security-header middleware, exactly ONE KV read per request; `makeInsightsReader` injection for route tests.
- [x] Admin console rows for per-source freshness. **Done 2026-10-07** — `insights:status` rendered as a zero-JS Insights card (last run, mode, per-source ✅/❌ rows); the read is failure-tolerant (a broken KV read omits the card, never breaks the console).
- **Exit ✋:** dry run in production with real keys; owner reviews the live JSON before any UI work depends on it. **DONE 2026-10-07** — venue dry-run (Actions run 37518740313, no writes): 27/27 fetches OK incl. all three RBA tables, `P1 COMPLETE`. Production write-run (Actions run 37550035289, dispatched 00:04 UTC after the KV counter reset): 28/28 readings, 24 history keys + snapshot + status written (26 writes / 25 reads — vs 1,000/day), `P1 COMPLETE`, zero retries. Live serve verified on workers.dev AND currena.ir: `/api/insights` 200 + ETag/304, `/api/insights/:id/history` 200 (501-point us10y; 120-point monthlies; 40-point quarterlies; 3 single-point cards correctly key-less). **Gate I3 APPROVED 2026-10-07 (owner: "Approved.", pasting the live JSON from `/api/insights` for review).**

### Phase I4: The page

- [x] Route `/insights`, nav entry, lazy loading, i18n keys (en and fa), typed. **Done 2026-10-07** — `ROUTES` + lazy `routes/Insights.tsx` + `nav.insights`/`insights.title` in the eager dictionaries; the ~600-line copy corpus (28 indicators × 6 fields + structural strings, both locales) lives in shape-checked lazy modules (`i18n/insights-copy-en.ts` / `-fa.ts`, en source of truth, fa compile-time shape-checked) inside the route chunk — entry bundle +0.10 kB gzip (288.75 kB / 87.78 kB gzip vs 288.45 / 87.68 baseline), the whole feature in the lazy `Insights-*.js` chunk (100 kB / 30.4 kB gzip).
- [x] Components: summary block with explainer, what-changed, key dates, section, indicator card, disclaimer bar, about-the-data. **Done 2026-10-07** — `components/insights/`: SummaryBlock (two LED-count lines — the page's one recognisable Currena element, `led-cell-hot` DSEG7 modules for the headline warning counts only — voting-rule explainer panel, excluded note, one-line disclaimer bar linking to the full text), WhatChanged (changedThisWeek + quiet-week state + five biggest 30-day moves ranked by relative magnitude so pct/point changes compare fairly), ComingUp (7-day highlight, empty state honest — the calendar populates in I5), JumpNav (sideways-scrolling buttons + scrollIntoView, not hash anchors — the app is a hash router), IndicatorCard (APG accordion: real button inside the card heading, aria-expanded/controls, labelled region; collapsed = name+ticker, value, ±7/30-day changes in dir="ltr" runs, icon+word status chip, 10-year position bar with the rule's watched tail shaded, one-liner, updated/source footer; expanded = plain-language rule sentence, the five explainer sections, 10-year chart + screen-reader data table, linked source), PositionBar (role="meter" with valuetext), AboutTheData (sources, schedule, how warning is decided, full disclaimer).
- [x] All states from `02-page-design-spec.md` (loading, stale, error, info-only, quiet week). **Done** — skeletons (summary + card grids); stale/unavailable cards greyed (opacity-60) + stale-since note, excluded from counts server-side; feed error = message + retry (observed working during a local proxy outage); info-only "Context" chip + "never votes" line; quiet week pointing at Coming up; offline = last-good localStorage snapshot (zod-validated on read) with a "saved data from {date}" banner (verified by aborting the API route in the browser).
- [x] Persian digits, Jalali dates with bidi isolation, charts with left-to-right time axes, mirror-correct layout. **Done** — all numbers via `formatNumber`('fa-IR'), asOf/generatedAt Jalali in fa (Gregorian in en), change runs and chart axes in dir="ltr" spans (± signs never scramble), tickers/`bdi` isolation, CSS logical properties only; the 10-year chart and the position bar keep LTR value/time axes in Farsi (documented decision — they are analytical axes, mirroring everything else).
- [x] Accessibility: icon plus label status, real buttons, chart table alternatives, reduced motion. **Done** — every status chip pairs icon + word (never colour alone); jump links and explainer are real buttons; chart has an aria-label summary + a real `<details><table>` alternative (first/last/min/max + evenly sampled rows); position bar is role="meter" with valuetext; scrollIntoView honours prefers-reduced-motion; heading order h1→h2→h3→h4→h5.
- [x] Verify with agent-browser in en and fa, light and dark, desktop and 375 px; zero console errors; no horizontal overflow. Check the bundle does not regress. **Done 2026-10-07** — verified against the exact production snapshot (fetched from currena.ir, served locally through the real Worker code path on seeded miniflare KV + a byte-identical replay shim): en/fa × light/dark × desktop/375px; VLM-assisted visual inspections clean (RTL mirroring, Persian digits, no bidi scrambling, dark contrast); card expand → chart + table + rule + source; mobile single-open (opening one card closes the previous); jump nav scroll+focus; offline fallback; sticky footer at document end; zero console/page errors. Found & fixed during verification: mobile horizontal overflow from implicit `auto` grid tracks (explicit `grid-cols-1`/flex stacks everywhere).
- **Exit ✋:** owner visual review on production-like data. **Deployed 2026-10-07 as Worker version `201590d8-89e3-41ce-94b5-295e3e190553` (deploy + smoke record in DEPLOY.md §Insights page deploy). Gate I4 APPROVED 2026-10-07 (owner: "Approved." with the live `/api/insights` JSON pasted) — with one change requested and applied the same session: the GLOBAL section now renders before AUSTRALIA (page order, jump nav, summary-block row order, spec §4 updated).**

### Phase I5: Content and legal ✋

- [x] Write the explanation, "tended to mean", "can't tell you" and "what this means for you" text for every card, in both languages (Farsi written natively). **Delivered with the I4 page** (`i18n/insights-copy-en.ts` + `-fa.ts`, 28 indicators × 6 fields, shape-checked by tests); the I5 pass re-reviewed it — the only "buy/sell" string anywhere is the disclaimer's own negation ("nothing here is a recommendation to buy, sell or hold anything"), zero imperative advice wording in either locale.
- [x] Populate the calendar JSON from official schedules. **Done 2026-10-07** — `data/insights-calendar.json`: 14 events, 2026-10-28 → 2027-05-04, every date read from the official schedule pages (RBA Board Meeting Schedules — 2026 + 2027 meeting dates, decision = second day; federalreserve.gov FOMC calendar — 2026 + 2027, decision = second day; abs.gov.au CPI releases — Sep quarter 28 Oct, Oct 25 Nov, Dec 27 Jan, Jan 24 Feb; the 28 Oct CPI date cross-confirmed by the RBA homepage "Next update"). Past events drop off client-side; the file is the maintain-by-hand queue.
- [x] ~~Disclaimer text reviewed by an Australian financial-services-qualified person.~~ **Closed as declined at D4** (owner: "I dont need disclaimer for now") — no reviewer in v1; the no-"buy/sell"-wording rule stays mechanically enforced (see above). Revisit any time.
- [x] *(added during I5)* China-PMI manual series populated — `data/manual/china-pmi.json`: 10 observations (2025-12 → 2026-09), each value the official NBS headline cross-checked against ≥2 independent reports of the release with month-over-month arithmetic reconciled; provenance table in `data/manual/README.md`. The card goes live (value 50.1, normal, change30d +0.3 pts); the 10-year position bar stays honestly hidden until the 30-observation percentile floor is met. Future releases: one observation per month, appended by hand.
- **Exit ✋:** owner sign-off on the copy (reviewer sign-off was declined at D4). **Deployed 2026-10-07 15:03 UTC — main @ `f77bdd4` pushed; Worker version `bef6f65b`; a dispatched ingest run made the calendar + china-pmi live (zero unavailable indicators); Global-first order verified in production (en/fa). Deploy record in DEPLOY.md.**

### Phase I6: Second wave (P2)

- [ ] Housing, terms of trade, household debt and arrears, CAPE, government interest/revenue, oil, breakevens, China, copper/gold, iron ore, US M2.
- [ ] Re-run the backtest with the full indicator set.
- **Exit:** all P2 cards live with sources verified.

### Phase I7: Hardening and launch ✋

- [ ] Stale-feed alerting (admin console and a failed-workflow notification).
- [ ] Performance budget check and PWA precache impact.
- [ ] SWOT-style re-check of the feature; update `docs/BACKLOG.md`.
- [ ] CHANGELOG, PROGRESS, final production smoke test (health, snapshot, each card, en/fa).
- **Exit ✋:** owner approves launch.

### Later (P3 and v2)

Licensed items (VIX, S&P 500 / Gold, breadth), per-indicator share links, a global-liquidity composite.

## 4. Testing

- Unit tests for scoring and adapters; fixtures only, never live sites.
- A frozen-clock test for "this week" logic.
- A snapshot of the zod schemas so contract changes are deliberate.
- Browser verification in both locales and both themes, with DOM geometry checks for RTL (not screenshots alone).

## 5. Security and secrets

- Secrets only in GitHub Actions secrets or `wrangler secret`. Never in the repo, logs, docs, or commit messages.
- A KV token for the runner has the minimum scope (KV write on the one namespace).
- The new endpoints are read-only. Reuse the existing rate limiting and security headers.

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A source changes format or disappears | zod validation, fixtures, stale state, per-source status in `/admin` |
| Licence problem with a provider | Verify-first rule; blocked items stay out until resolved |
| Free-plan CPU and subrequest limits | Ingestion runs outside the Worker by default |
| Thresholds give misleading labels | Backtest gate; equal weights; every threshold shown on the card |
| Legal exposure from advice-like wording | General-information framing, no buy/sell language, disclaimer review gate |
| Bundle growth hurts the converter | Lazy-load the route; check bundle size at each phase |
| Farsi copy reads as translated | Native writing, native review before launch |

## 7. Definition of done

- All P1 and P2 indicators live, each with value, trend, 10-year position, source and update date.
- Summary line, what-changed, calendar and explainer working in en and fa.
- Backtest documented; thresholds approved by the owner.
- Tests green, typecheck clean, no regression in the converter, bundle budget held.
- Copy and disclaimer reviewed; no advice wording.
- `CHANGELOG.md`, `docs/PROGRESS.md` and these docs updated.
