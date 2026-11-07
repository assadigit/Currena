# Currena — Page-Division Build · Session Roadmap

> **The 30-session execution plan** for the page-division spec
> (`02-PAGE-DIVISION-SPEC.md`), run under `AGENT-RULES.md` (root).
> Every session reports progress as **`Session X/30 · Y remaining`**.
> Created 2026-11-07 · owner-approved order (D-20 + D-47).

---

## The session protocol (every session, no exceptions)

1. **Start:** read `AGENT-RULES.md` → `01-SESSION-ROADMAP.md` (this file,
   your session's entry) → `02-PAGE-DIVISION-SPEC.md` (the sections your
   session touches) → the previous session's hand-off prompt.
2. **Work:** exactly one session's scope. Commit + push at every checkpoint
   (Rule 2).
3. **Gate:** run the session's test/backtest/audit gates (Rule 4). Red → fix
   now or roll back; never pass red forward.
4. **Close:** push final commit; output the hand-off prompt with the
   progress counter `Session X/30 · Y remaining` and the next session's
   scope (Rule 3).

**Status legend:** ☐ not started · 🔄 in progress · ✅ done & gated.

---

## Phase A — Foundations (S1–S4)

### ✅ S1 — Scaffold & navigation · `Session 1/30` · delivered 2026-11-07
- Route structure: `/` (Global placeholder), `/gold`, `/world-markets`,
  `/usa`, `/europe`, `/asia-pacific`, `/australia`, `/commodities`,
  `/currencies`.
- Move today's all-in-one Insights page → `/insights` with a deprecation
  banner linking to `/` (D-46). **Zero content loss** — verify every section
  still renders.
- Grouped topbar (D-45) + mobile drawer.
- **Gates:** all 10 routes render (incl. legacy intact at `/insights`);
  typecheck + lint clean; nav at 360px width; commit pushed.
- **Deliverable:** the skeleton every later session fills.

**S1 delivery record (2026-11-07):** all routes scaffolded and gated green —
`routes/page-division/` holds the Global migration hub + the shared
destination placeholder (purpose · membership · build sessions · decision
traceability per spec §4–§12); the topbar is the D-45 group with two
disclosure dropdowns (Regions ▾ · Tools ▾) and the legacy Insights pill
(badged); the drawer groups Markets · Legacy · Tools; the deprecation
banner rides atop `/insights` in every load state; 55 new fa strings queued
as unreviewed in the Persian copy manifest. **One build-session decision,
flagged for owner ratification (not a D-number — those are owner
decisions):** the Converter — the eager entry-chunk route until S1 — moved
**unchanged** to `/converter`, because D-20 makes Global the landing page
and D-46 gives `/` to Global; zero content loss (the page is byte-identical,
now lazy-loaded, reachable from Tools ▾ / the drawer; the ErrorBoundary
"Go to converter" button points there too). Gates run: tsc 6/6 packages ·
eslint 0/0 repo-wide · copy:audit clean (6,920 entries) · secret scan clean
(8 patterns / 893 files) · suite 14,621 (web 12,618 — +1 router test) ·
build + budgets held (entry 267.63/80.93 kB gz vs 296/89.5 budgets; Insights
chunk 1,613.28/373.82 vs 1,620/377) · all 10 routes browser-verified with
live production data · nav at 360×844 and 1024×768 · RTL/fa verified ·
VLM visual review pass (pre-existing mobile polish items on the legacy hero
noted for S19: the Global-gauge emoji spacing, the ⓘ wrap on the data-as-of
line). Pre-existing display quirk observed, not touched: none in S1 scope.

### ✅ S2 — Data layer & the authoritative placement table · `Session 2/30` · delivered 2026-11-08
- Page-level data projections from the existing API (per-page payloads or
  query params) + shared types.
- **Generate `docs/page-division/PLACEMENT.generated.md`** from
  `data/indicators.json` + the spec §14 rules; reconcile to 184 ids + 6
  boards; report drift (drift = audit finding, recorded, not silently
  fixed).
- **Gates:** projection endpoints return complete data for every page's
  membership; placement table reconciles to zero unplaced / zero duplicate
  homes (or drift documented with owner-visible notes).
- **Deliverable:** the contract between engine and pages.

**S2 delivery record (2026-11-08):** the contract between engine and pages
is shipped whole — **`packages/insights/src/page-division/`** holds the
placement table (spec §14's homes hand-encoded with typed `IndicatorId`
membership) + the ENGINE-DERIVED mirror sets (the gauge voters, the gold
meter's 37 voters, the AU gauges' moved-out seats — derived from `GAUGES` +
`GOLD_LANE_VOTERS`, never hand-copied, so an engine change surfaces as
visible doc drift) + `reconcilePlacement` + `projectSnapshotToPage` + the
deterministic doc builder. The wire contracts (PageDivisionPageId ·
BoardAttachmentId · PageProjection · PageIndex) live in `packages/core`
(zod, rule 3). **The endpoints:** `GET /api/insights/pages` (the 9-destination
index — counts, boards, decisions — deploy-static, content-hash ETag,
max-age=3600) + `GET /api/insights/pages/:page` (one destination's curated
payload: home + mirror + blocked readings in placement order, the boards
manifest, honest `absentIds`) — mounted INSIDE the insights gate + M-4 data
bucket, BEFORE `/:id/history`, reusing the mode-aware reader and the
live-prices overlay merge (inherited disciplines, not reinvented: the
ribbon/hero live values + the licence hides behave exactly like the legacy
route's). Boards are attachments (manifest ids), not embedded payloads —
each page fetches the existing cached board routes. The SPA client
(`apps/web/src/lib/page-division.ts`, zod-validated, per-page promise cache)
is ready for the S3+ page builds. **The authoritative table:**
`docs/page-division/PLACEMENT.generated.md` (pnpm placement:generate —
`scripts/generate-placement-table.ts`), committed GREEN: **184 ids + 6
boards · 0 unplaced · 0 duplicate homes · 0 unknown ids · 0 mirror/home
overlaps** — the sync test (`doc.test.ts`) pins the committed file
byte-for-byte against the regeneration (registry-sync discipline). **Audit
findings recorded (never silently fixed):** AF-1 (spec §2's own count line
sums to 179; Gold is 14 per §5/§14, not §2's 13) · AF-2 (spec §7's tier
hand-counts drift from their own lists: 22→19 · 13→11 · 19→17) · **AF-3
(OWNER RATIFICATION PENDING: `michigan-1y-expectations` — the 184th id —
is absent from every §7/§14 list; the generator places it USA tier-3
beside its 5y twin per evident intent — same pattern as S1's /converter
decision)** · AF-4 (gpr-australia: AU home, GLOBAL registry section — both
true at their layers) · AF-5 (spec §10's gauge numbers are display-group
counts; the engine's scored AU voters are 26). Gates ALL GREEN (2m 10s:
secret scan 8/906 · tsc 6/6 · eslint 0/0 · copy:audit clean · narrator in
sync + eval 50 · layer1 11,819/11,819 · **the suite 14,678 = +57 new**
(placement 13 · projection 18 · doc-sync 3 · api routes 15 · web client 9)
· build + budgets held — entry 267.63/80.93 gz · Insights chunk
1,613.28/373.82, the new client tree-shaken out of the entry graph).
Not deployed (data-layer session — the Worker code changed but the deploy
stays the owner's lever, unchanged from S1).

### ☐ S3 — Global page build · `Session 3/30`
- The 10-tile verdict board (D-21), prices ribbon gold+brent+BTC (D-22),
  region chips with status dots (D-23), narrator line (D-24), dedollar
  context tile (D-25).
- **Gates:** one screen at 1440×900 AND 360×844; every tile shows verdict or
  explicit unread; ribbon shows live hourly values; chips link all 7
  destinations.
- **Deliverable:** the landing page (D-20).

### ☐ S4 — Global gates & polish · `Session 4/30`
- Verdict-consistency backtest: every Global tile byte-identical to engine
  snapshot values; narrator wired to the :50 cron artefact.
- Full mobile pass, keyboard/ARIA pass, empty/error states.
- **Gates:** all green; commit pushed; hand-off prompt for Phase B.

## Phase B — Gold (S5–S6)

### ☐ S5 — Gold page build · `Session 5/30`
- Hero (live gold price + Balance Scale + 7-state outlook + counts) → the
  37 seats grouped by 5 lanes (D-26) → context cards (D-27) → honest-record
  footnote.
- **Gates:** seat-level diff vs `/api/insights` = exact match; all 37 seats
  render lean + evidence word; blocked items shown as notes (§16).

### ☐ S6 — Gold gates · `Session 6/30`
- Verdict-consistency backtest (meter counts, lane votes, beam, outlook);
  frozen-scenario suite re-run against the page renderer; mobile + ARIA.
- **Gates:** byte-identical verdicts; 14,620-test harness green; hand-off.

## Phase C — World Markets (S7–S8)

### ☐ S7 — World Markets build · `Session 7/30`
- Reuse the existing world-index map as the hero (D-43); region grids (Asia ·
  Europe · Americas); status summaries; world risk & liquidity section (9
  cards).
- **Gates:** 16 indexes render with full metrics; map dots interactive; EODHD
  primary / Yahoo fallback behaves fail-closed.

### ☐ S8 — Regional zoom maps · `Session 8/30`
- Zoomed continent maps for the region pages (Europe-only, Asia-only,
  Americas/US, AU) per D-13/D-44 — data from the same board payload.
- **Gates:** all four zooms render; consistency with the world map; hand-off.

## Phase D — USA (S9–S11)

### ☐ S9 — USA verdicts + tiers 1–2 · `Session 9/30`
- The 5 gauge verdicts atop (D-30); tier-1 "the world watches" 7 cards
  (D-29); tier-2 rates & the Fed.
- **Gates:** verdicts match Global's engine values; tier-1 cards complete.

### ☐ S10 — USA tiers 3–6 + TIC + index section · `Session 10/30`
- Tiers 3–6 (inflation · labor & growth · liquidity/stress/valuation · TIC
  "who finances America" D-31) + SPX/NDX/DOW zoom section.

### ☐ S11 — USA gates · `Session 11/30`
- Full card-render audit vs placement table; freshness within cadence
  grace; mobile/ARIA; hand-off.

## Phase E — Europe (S12–S13)

### ☐ S12 — Europe build + fills · `Session 12/30`
- EU section & non-EU (UK) section apart (D-33); Europe zoom map.
- FRED-only fills (D-34): euro unemployment · industrial production ·
  ECB-SDMX liquidity — **verify each candidate series live before ingest**
  (Rule 5); unverifiable → discard + record.
- **Gates:** fills verified against publisher releases; EU/non-EU split
  correct; gates on cards.

### ☐ S13 — Europe gates · `Session 13/30`
- Card audit, freshness, mobile/ARIA; hand-off.

## Phase F — Asia & Pacific (S14–S15)

### ☐ S14 — Asia build + fills · `Session 14/30`
- Five sub-regions (D-35): China · Japan · Korea/Taiwan/HK · India ·
  Pacific (NZ, D-17); Asia zoom map; FRED CPI fills for JP/KR/IN (D-36,
  verify-first).

### ☐ S15 — Asia gates · `Session 15/30`
- Fill verification vs national statistics releases; card audit; hand-off.

## Phase G — Australia (S16)

### ☐ S16 — Australia build & gates · `Session 16/30`
- AU Markets board on top; the 5-gauge structure unchanged (D-37); 28 cards;
  moved-out seat chips link to new homes (currencies/commodities/asia/gold).
- **Gates:** seat chips resolve; board freshness; mobile/ARIA; hand-off.

## Phase H — Commodities (S17)

### ☐ S17 — Commodities build & gates · `Session 17/30`
- Energy · Metals · Agriculture · Digital groups + "Trade routes & supply"
  (D-38/D-39); live prices; gold cross-links (D-19/D-27).
- **Gates:** all 24 cards; chokepoint data within PortWatch cadence;
  hand-off.

## Phase I — Currency Pairs (S18)

### ☐ S18 — Currencies build & gates · `Session 18/30`
- The 7 rule lights hero (D-41); the 11-pair board (D-42) with moveRank &
  bigMove; the dollar-standing section (D-32); FX-board payload wiring;
  AUDNZD joins the board.
- **Gates:** rules match the FX board KV logic exactly; 11 pairs complete;
  hand-off.

## Phase J — Integration (S19–S21)

### ☐ S19 — Navigation, mobile & SEO polish · `Session 19/30`
- Topbar/drawer final pass across all pages; sticky footers; meta/OG tags
  per page; breadcrumbs.

### ☐ S20 — Full-site regression + verdict backtest + data audit · `Session 20/30`
- Every page × every gate from §21 of the spec; N=20 random-id source
  spot-check (Rule 5); performance budget check.

### ☐ S21 — Spec-vs-implementation audit · `Session 21/30`
- Full diff: spec §4–§14 vs the live site; every deviation fixed or
  documented as a decision; placement table regenerated & reconciled.

## Phase K — Investor + final (S22–S24)

### ☐ S22 — Investor feedback → spec v2 · `Session 22/30`
- Collect the investor's answers to spec §19; record as D-49+ in the
  strategy log; produce spec v2 entries.

### ☐ S23 — Feedback build changes · `Session 23/30`
- Implement the accepted v2 deltas (e.g., PMI program if approved).

### ☐ S24 — Legacy retirement readiness · `Session 24/30`
- The D-9 audit: every indicator verified categorized; retirement checklist
  produced (execution itself may wait for a burn-in period — investor
  question §19.6).

## Reserve (S25–S30)

### ☐ S25–S30 — Fix rounds · performance · retirement execution
- Buffer sessions for anything red, slow, or delayed; the final legacy
  retirement + redirect when the owner signs off. If unused, the project
  simply finishes early — counter still reports `Session X/30`.

---

## Progress board (update every session)

| Phase | Sessions | Status |
|---|---|---|
| A Foundations | S1–S4 | 🔄 S1 ✅ 2026-11-07 · S2 ✅ 2026-11-08 · S3 next |
| B Gold | S5–S6 | ☐ |
| C World Markets | S7–S8 | ☐ |
| D USA | S9–S11 | ☐ |
| E Europe | S12–S13 | ☐ |
| F Asia & Pacific | S14–S15 | ☐ |
| G Australia | S16 | ☐ |
| H Commodities | S17 | ☐ |
| I Currency Pairs | S18 | ☐ |
| J Integration | S19–S21 | ☐ |
| K Investor + final | S22–S24 | ☐ |
| Reserve | S25–S30 | ☐ |

**Current position: Session 2/30 delivered 2026-11-08 · 28 remaining — next
action: Session 3/30 (S3, the Global page build: D-21 tiles · D-22 ribbon ·
D-23 chips · D-24 narrator · D-25 dedollar context tile).**
