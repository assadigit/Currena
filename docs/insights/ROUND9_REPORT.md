# ROUND 9 REPORT — the owner's nine UI changes (2026-10-27)

**Mode:** AUDIT_AND_IMPLEMENT. **Repo:** `assadigit/Currena`, branch `main`,
base `6b65b34` (the 16-failure-fix session's head). **Live site:**
https://currena.ir/#/insights — deployed and verified in a real browser, both
locales, in this session.

**Baseline at start (all green, recorded before any change):** typecheck 6/6 ·
tests **1955/1955** · lint 0 errors (15 pre-existing warnings, unchanged) ·
`copy:audit` clean · selfcheck all-green · bundle budget 890/215 held ·
100 indicators, 48 voting, zero stale/broken/hidden.

**Baseline at end (all green):** typecheck 6/6 · tests **1975/1975** (core 191 ·
scraper 67 · insights 644 · markets 13 · api 344 · web **716**) · lint 0 errors
(15 pre-existing warnings) · `copy:audit` clean (2960 manifest entries) ·
selfcheck all-green (six live source probes OK, export + SELF_AUDIT written) ·
bundle budget **896/217** (bumped with a changelog note — see R9 budget below).

---

## The nine items

### R9-01 — Remove the "US shares to Australian dollars" section — DONE

- Deleted `apps/web/src/routes/insights-sections/UsSharesNotes.tsx` (the
  `UsSharesAudBox` — S&P 500 / NASDAQ 100 in AUD with the "each pair from one
  date" note), its render site + import in `routes/Insights.tsx`, and the
  now-dead `apps/web/src/lib/us-shares-aud.ts` + its test (3 tests retired
  with the feature).
- Removed the five `usAud*` copy entries from BOTH dictionaries
  (`usAudTitle`, `usAudLevel` — already unused, `usAudSameDate`,
  `usAudDatesDiffer`, `usAudChange`) and their five manifest fingerprints —
  `pnpm copy:audit` stayed clean (no orphaned fa strings).
- Verified live: the box is gone in EN and fa; the markets/fx boards it sat
  between are untouched.

### R9-02 — Exchange logos instead of country flags for STOXX and TSX — DONE

- Added the per-market `useExchangeLogo` flag to `MarketDefinition`
  (`packages/insights/src/markets/definitions.ts`) for `stoxx50` and `tsx` —
  the definitions file (the repo's CONFIG FIRST block) now owns the
  logo-vs-flag decision, exactly as the task's architecture asked.
- `marketLogoUrl` (`apps/web/src/components/icons/currena.tsx`) consults the
  flag: `useExchangeLogo === true` → `/assets/markets/{id}.jpg` (the
  Euronext/STOXX wordmark and the TSX mark). The morning round's
  `MARKET_LOGO_OVERRIDES` flag map is retired (kept as a documented, EMPTY
  extension point). The **world map is untouched** — it colours by country
  tint and never reads this.
- Verified live at both breakpoints: exactly one `stoxx50.jpg` and one
  `tsx.jpg` render, zero `flags/eur` / `flags/cad` images; every rendered box
  keeps the ≥96×96 owner floor (the MarketLogo frame is unchanged).

### R9-03 — Show ALL with/against reasons on the balance itself — DONE

BalanceScale v8 (the v7 mechanics — one rotating beam group, plumb pan
translations, per-frame hangers, needle + arc — kept verbatim):

- `BALANCE_PAN_CAPACITY` (2) and the fixed stage-height constants are
  **retired**: every supporting/pressuring driver renders ON ITS PAN as a
  compact chip; there is no "+{n} more" pill and no separate full-list
  section anymore.
- The pan is now the LOAD's height: pure `balancePanHeightPx(chips, isSm)`
  gives the arithmetic reserve (chips 40px mobile / 32px ≥sm, 6px gaps, pan
  padding, 118/88 empty floor), `balanceStageHeightPx(for, against, isSm)`
  reserves pan-top + the taller pan + the 10° swing envelope, and a
  ResizeObserver on both pans tracks the measured truth (a wrapped label or
  the long empty sentence can only RAISE the reserve — never clip).
- Tested at 360px and 1280px: **zero horizontal overflow** in both locales
  (live + local fixture renders); the case-H harness (6 vs 3 drivers) pins
  that all nine chips rest on the pans with no pills and a taller stage.

### R9-04 — Merge "Is the dollar strong?" into the currencies section — DONE

- `LANE_GROUP_ORDER` (config/sections.ts): the lane renders global without
  the dollar-strength group; `GROUP_ORDER` stays the FULL gauge order so the
  R18 counting invariant and the hero's gauge names are untouched.
- New `DollarStrengthCards` (`world-currencies/DollarStrength.tsx`): the six
  cards (dollar-basket, usdjpy, us-japan-10y-gap + context eur-usd, usdtry,
  usdcny) render INSIDE the WorldCurrencies container — sub-heading (the same
  question, «آیا دلار قوی است؟») + the gauge reading (step meter + word +
  count, from the SAME `gaugesForSection` computation) + the cards in the
  lane's own anatomy (needs-attention first, `insights-card-{id}` deep-link
  anchors preserved). The block rides the container in EVERY section state
  (it reads the insights snapshot, not the fx feed).
- `HIDDEN_FROM_LANE_IDS` keeps the six ids out of their old lane group (one
  reading, one surface).
- Verified: **hero count and gauge steps are unchanged** — the live
  `/api/insights` still reports global 32 voting (the GAUGES membership is
  untouched); the standalone lane heading is gone; the sub-headed block
  renders with all six cards in EN + fa.

### R9-05 — Consolidate ALL Australian indicators into one container — DONE

- `SUBHEADING_SECTIONS = {australia}`: the three lane groups
  (au-inflation-rates, au-households, au-trade-currency) render as
  SUB-headed card groups (compact label scale, the gauge reading + count kept)
  inside the ONE Australia mother container. The section heading + the hero's
  Australia verdict are unchanged, and **the three gauges stay separate** —
  each sub-heading still carries its own step meter, word and count.
- Verified live in both locales («آیا تورم و نرخ بهره…»، «آیا خانوارها تحت
  فشارند؟»، «وضعیت تجارت و دلار استرالیا چگونه است؟»).

### R9-06 — Specialized box for today's exchange/indice performance — DONE

`MarketsVerdictBox` redesigned into the section's own breadth headline:

- THREE LARGE numbers (up / down / flat) in the bright return inks, one
  block per kind (the dt→dd DOM contract is kept, so the briefing tests and
  screen readers read "Indices up: 1" as before).
- A **proportional breadth bar** under them: green/red/grey segments sized
  by each count's share of the valid rows (decorative, `aria-hidden` — the
  numbers carry the meaning; colour never rides alone). In RTL the row
  mirrors with the document direction.
- The period's own label + the honest coverage note ride the block's header;
  the verdict word + state artwork + meter stay the box's crown; the takeaway
  sentence stays below.
- The box sits ABOVE the map and tiles (position unchanged — first thing
  after the section heading). Verified live: 1 up / 3 down / 12 flat with the
  bar segments 1/3/12 on Today; switching the lens re-reads every surface
  (verified locally: 0/1/15 + the bar followed); Persian digits in fa
  (۱/۳/۱۲).

### R9-07 — Special container for US-based indicators that affect global markets — DONE

- The nine indicators (`real-yield-10y`, `us10y`, `us30y`, `euro-hicp`,
  `us-cpi-yoy`, `us-pce-core-yoy`, `walcl`, `stress-stlfsi`, `nfci`) render
  in ONE dedicated container (`UsGlobalReachGroup`) that closes the Global
  section — pulled out of their lanes via `US_GLOBAL_REACH_IDS` +
  `HIDDEN_FROM_LANE_IDS` (their GAUGE memberships are untouched: the three
  gauges' steps and the hero count still count them).
- The **analytical brief is generated from the live values** — the
  consequenceLine discipline: a pure, rule-based generator
  (`config/us-global-reach.ts`, 14 unit tests) reads the nine readings and
  builds a three-sentence paragraph (borrowing costs · inflation ·
  stress/liquidity) whose WORDS are chosen by band (costs high/mid/low from
  the yields' 10-year percentiles with any needs-attention status counting
  as high; inflation above/near and stress strained/calm from the engine's
  own warning statuses) and whose VALUES are interpolated from the cards' own
  formatted numbers (an unreadable value renders the honest em dash).
- Live example (EN, today's real readings): *"US borrowing costs sit high in
  their ten-year range (10-year at 4.96%, 30-year at 5.29%, real yield at
  2.64%), which tends to tighten financial conditions worldwide, pressure
  emerging-market currencies and weigh on risk assets. Inflation is still
  above the central banks' goals (…) …"*
- Bilingual: nine new copy blocks (heading + intro + the six band sentences ×
  the calm/strained pair) in EN + fa, triaged in the copy manifest (round
  `2026-10-27-r9-us-global-reach`, terminology per the glossary — no em
  dashes, Persian digits in static copy). Verified live in fa with Persian
  digits (۴٫۹۶٪) and RTL.

### R9-08 — Balance empty state: the full sentence INSIDE the balance box — DONE

- An empty side's evidence-based FULL sentence («در حال حاضر، نشانهٔ
  معناداری از حمایت عوامل بررسی‌شده از رشد قیمت طلا دیده نمی‌شود.» / "None
  of the factors checked shows a meaningful signal supporting gold's price
  right now.") renders INSIDE the pan itself — centred, muted, keeping the
  complete pan shape. The v6 small pill («نشانهٔ معتبری نیست») and the
  separate list-area card are retired; `panEmpty`/`panUnreadable` left both
  dictionaries + the manifest. When nothing could be read at all, BOTH pans
  carry the shared unavailable sentence inside the drawing.
- Verified live: the for pan carries the full sentence while the against pan
  carries its two chips — exactly the owner's ask.

### R9-09 — Table of top companies across world exchanges — BLOCKED (quota)

**The data-source question, answered with live probes (2026-10-27, the
owner's own key, three polite requests):**

- The EODHD API **does serve stock-level EOD data on the owner's plan**:
  `/api/eod/AAPL.US` and `/api/eod/SAP.XETRA` both returned real daily bars
  (AAPL 2026-10-23 close 347.725; SAP 2026-10-22 close 216.65). Symbol
  coverage is NOT the blocker.
- The blocker is the **quota**: the free personal plan allows **20 API calls
  per day in total** (repo-recorded in `docs/specs/insights-world-markets.md`
  §quotas and the currencies spec's "Why not EODHD here"), and the markets
  board already consumes ~16–18 of them (16 indices + retries). A ~50-company
  table needs ~50 more calls per day — far over the ceiling.
- The efficient path is also gated: `/api/bulk-last-day/{exchange}` (one
  call per exchange — the whole 50-company list in ~5 calls) answers with
  the plan-upgrade page (HTTP 404 + "Upgrade Plan" HTML), the same
  subscription wall the documented au-10y probe hit on 2026-10-25.
- **What plan level is needed:** any EODHD paid tier that either (a) lifts
  the daily request quota above ~70 calls/day (16 index + ~50 company +
  margin) or (b) unlocks the Bulk API (`bulk-last-day`) — the cheaper path:
  ~5 extra calls/day covers the whole table. Per EODHD's pricing page the
  entry paid tier historically sits around US$19.99/month ("All World");
  the owner should confirm the current tier at https://eodhd.com/pricing.
- No half-feature was shipped: no stale rotating subset (mixed dates would
  violate the house honesty rules), no un-keyed scraping of a paid source.
  When the owner upgrades, the build is straightforward: a hardcoded
  ~50-ticker list per exchange, a `companies` fetch rung on the markets
  worker (bulk-last-day per exchange, or per-symbol EOD split across the
  50-subrequest budget), a new `insights:companies:v1` KV key + public
  endpoint, and a table below the index tiles (company name, exchange,
  price, daily change %, sparkline from a short history).

---

## Self-audit (STEP 10) — all green

| gate | result |
|---|---|
| `pnpm -r typecheck` | 6/6 packages green |
| `pnpm -r test` | **1975/1975** (web 696→716: +14 brief-generator, +8 lane-presentation, +1 balance-v8, −3 retired us-shares-aud) |
| `pnpm lint` | 0 errors, 15 pre-existing warnings (unchanged set) |
| `pnpm copy:audit` | clean — 2960 entries (9 new usGlobalReach triaged processed; 7 retired fingerprints removed) |
| `pnpm --filter @currena/insights selfcheck` | all-green; rung-2 plan live probes OK (MOF, EIA, CFTC, OECD, GPR, EPU); export + SELF_AUDIT regenerated |
| `pnpm --filter @currena/web build` → `check-bundle-budget.mjs` | held: entry 295.28/88.81 (296/89.50), Insights lazy **892.44/215.72** — budget bumped 890→896 raw, 215→217 gz with the justification comment in the script + this changelog note: the two new section components, the lane-presentation config and the bilingual brief templates outweigh the removed AUD box (+2.44 raw / +0.72 gz over the M8 tree) |
| existing behaviour | the 100 readings keep their values/dates (live `/api/insights` still 100 readings, global 32 voting — the GAUGES membership untouched); the markets board and fx module untouched except the STOXX/TSX logo pin |

## Local render verification (STEP 10c)

- The repo's own visual harness (`visual:test`) is **pre-existing-broken**
  (see Assumptions #3), so a local stub server served the BUILT dist with a
  schema-valid 100-reading fixture snapshot + the markets fixture + a
  constructed fx snapshot. In a real headless browser (agent-browser):
  - every R9 item verified present/absent as specified, in EN and fa;
  - zero console errors, zero page errors in both locales;
  - **360px and 1280px: zero horizontal overflow** (scrollWidth ==
    innerWidth);
  - core interactions: a balance chip opens its explanation panel; the
    markets period lens re-reads the breadth counts and the bar; the fx
    table disclosure works;
  - VLM inspection of the screenshots confirms the markets verdict box
    (three large numbers + the 3-colour bar), the US-global-reach container
    (heading + intro + tinted brief with live numbers + card grid) and the
    balance (all chips on the pans, intact geometry, no see-more).
  - Screenshots: `docs/insights/screenshots-r9/` (en-1280, en-360, fa-360,
    en-us-global-reach, en-balance + the live trio below).

## Deploy session record (STEP 11)

- **Deploy-lock check first** (the D-43 lesson): the Cloudflare versions
  API showed the last currena-api upload at **2026-10-27T00:57:10Z**
  (version 224 — the previous session's 16-failure fix), over three hours
  before this session's deploy → no parallel session.
- `pnpm --filter @currena/web build` → `pnpm --filter @currena/api exec
  wrangler deploy` (the owner's token from the repo's own recorded
  credential path, env-only, never persisted): currena-api
  **`babce831-c52e-400e-a410-166d888e1bb5`**.
- currena-markets redeployed to keep deployed code in sync with the shared
  `markets/definitions.ts` change (the additive `useExchangeLogo` flag —
  the worker's logic never reads it): **`fd842cc4-b5be-47a5-9567-277260bacf99`**.
- **Live verification on https://currena.ir in a real browser:** all nine
  items verified in BOTH locales (RTL, Persian digits ۴٫۹۶٪/۱/۳/۱۲, Jalali
  stamps), zero console errors, zero overflow at 360/1280; the live brief
  quotes today's real readings (10Y 4.96%, 30Y 5.29%, real yield 2.64%).
  API sweep: `/api/health` 200, `/api/insights` 100 readings (generatedAt
  2026-10-26T20:10Z), `/api/insights/markets` 200, `/api/insights/fx` 200,
  `/api/insights/status` 200. Screenshots:
  `docs/insights/screenshots-r9/live-{en,fa}-1280.png`, `live-en-360.png`.
- Nothing needed a rollback; the temporary rung pattern was not used (this
  round changed UI only — the 04:10/20:10 rungs kept writing the same
  snapshots through the deploys).

## Assumptions (decisions made without asking, per the runbook)

1. **R9-04 coupling**: the merged dollar-strength block rides the world
   currencies section's visibility (if a future site-mode ever re-hides the
   fx board, the six cards hide with it). Both boards are public today
   (owner directives 2026-10-18b/2026-10-21c, `hiddenBoards: []`), so the
   merge is licence-clean; recorded here so the coupling is a known,
   owner-directed consequence, not a surprise.
2. **R9-07 placement**: the US-global-reach container closes the Global
   section (after growth-health) with its own question-scaled heading; the
   nine cards keep their lane anatomy (tiering, companions, deep-link
   anchors). euro-hicp is included exactly as the owner listed it (it is
   euro-area data, not US — kept per the literal list).
3. **Pre-existing visual-harness breakage**: `apps/web/visual/build-fixtures.ts`
   has lacked row specs for the 47 ids added by the M4→M8 waves since before
   this round (`no row spec for 'yield-curve-10y3m'`), and the committed
   `visual/fixtures/snapshot.json` (54 readings, 2026-10-21) no longer passes
   the snapshot schema. This round did NOT silently rebuild that pipeline
   (it would also require re-pinning the U-test counts to a 100-reading
   fixture world); local + live browser verification covered the render
   gates instead. Recommended as its own small work item.
4. **Bundle budget bump** (890→896 / 215→217): documented in the budget
   script's history comment and the changelog, per the gate's own rule —
   never silently.
5. **Balance stage height**: the v6 "fixed stage height" rule is superseded
   by the owner's R9-03 directive (all chips on the pans); the tilt law,
   the plumb-translation law and the reserved swing envelope are unchanged
   and still unit-pinned (46 balance tests).
6. **EODHD probes**: three polite requests against the owner's key
   (AAPL.US, SAP.XETRA, bulk-last-day/US) — within the free-tier norms the
   2026-10-26 audit set (six probes); the markets board's own rungs were
   untouched (0 requests against its quota).
7. **Token rotation, again**: the Cloudflare token used for this deploy is
   the one living in git history (`d3f64bb`, removed from the tree in
   `5b74dde`). It works; it must still be rotated per OWNER_SETUP §10 —
   this report reiterates the owner action.

## Owner actions

1. **Rotate the Cloudflare API token** (OWNER_SETUP §10) — still the
   standing security item.
2. **R9-09**: decide whether to upgrade the EODHD plan (~US$19.99/month
   entry tier) to unlock the companies table (or the Bulk API path), then
   hand the round back with that directive.
