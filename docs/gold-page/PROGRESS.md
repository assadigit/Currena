# PROGRESS — the Currena gold page additive programme

Checkpoint: branch `gold-page-additions` created 2026-11-27 from `main` @ db71c97a.
Hard rule: ADD ONLY — existing lines are never changed or removed; the only
edits to existing files are minimal mount insertions, proved by `git diff` per
phase (additions only).

## Session 1 (2026-11-27)

- [x] Safety checkpoint: branch `gold-page-additions` (db71c97a).
- [x] STEP A audit: full section-by-section read of the page, all 18
      gold-page components, the site chrome, the content library, all
      /api/gold routes, lib engines, prisma schema, watch workers,
      tools pages. AUDIT.md written.
- [x] STEP B plan: PLAN.md written (4 phases, Must-first).
- [x] STEP C Phase 1: Beginner FAQ + glossary + sources & honesty band
      SHIPPED (record below).
- [x] Verified in browser: EN + fa (RTL), desktop 1280px + mobile 375px,
      dark mode, details rows open/close, cross-link anchor jumps, nav
      chips scroll to the bands, copy-link with honest failure fallback,
      no horizontal overflow on 375px, no console/page errors.
      `bun run lint` clean. Additive diff proved: page.tsx +15 lines / 0
      removed / 0 changed; everything else new files only; db/custom.db
      restored to the checkpoint bytes after the earlier failed-sync
      writes (dev now runs on a copy at /tmp/currena-dev.db).
- [x] Committed on gold-page-additions: "Gold page: Phase 1 — beginner
      FAQ, glossary, sources & honesty band (additive)".

### Phase 1 record (shipped, 2026-11-27)

- New: `src/components/gold-page/faq.tsx` — FaqBand (id `gold-faq`):
  10 beginner Q&As as `<details>` rows (numbered badges, one-line
  answers, "See the section" anchor links to gold-balance, gold-bridge,
  gold-history, gold-dollar-trend, gold-sources) + 12-term mini
  glossary grid (troy ounce, mesghal, karat, حباب, spot, free dollar,
  اجرت, seller profit, VAT, gold fund, bar, coin) + "last reviewed"
  stamp (2026-11-27, localized date words).
- New: `src/components/gold-page/sources.tsx` — SourcesBand (id
  `gold-sources`): 11 named sources (EODHD, FRED, Yahoo Finance, TGJU,
  Trading Economics, WGC, LBMA, IMF, CFTC, US Federal Reserve, Currena
  rates) each with a home link, what it feeds, and a non-wrapping
  refresh badge; 4 honesty rules (stamps, fail-closed, labeled machine
  translations, cited historical bases); the page-level not-investment-
  advice disclaimer in the gold box; share row (navigator.share with
  clipboard fallback, "copied" confirm, honest failure line when the
  clipboard is refused).
- New assets: `public/icons/gold-faq-question-mark.png`,
  `public/icons/gold-sources-magnifier.png` — generated in the pack
  style (250×250 transparent PNG, edge flood-fill background removal,
  palette-quantized to pack-like sizes, VLM-verified).
- Plug-in edits to `src/app/page.tsx` (insertions only): 2 imports, 2
  nav chips (FAQ/«پرسش‌ها», Sources/«منابع» between gold-calculator and
  gold-relationships, matching page order), 2 mounts between
  PhysicalBand and RelationshipsBand.
- No globals.css edit, no content.ts edit, no data changes.

## Current status

- Phase 1: SHIPPED (2026-11-27).
- Next: Phase 2 — the buying guide (see PLAN.md).

## Assumptions (decided, not asked)

1. The repo at /home/z/currena is the source of truth; deployed worker
   behaviour matches it (redeploy is the owner's act — no deploy secrets used
   for deploys in this session; deployment to currena.ir is NOT part of the
   additive work unless asked).
2. Working files live in this repo under docs/gold-page/.
3. New sections mount between PhysicalBand and RelationshipsBand because the
   repo's own comments record the owner's asks: the map is "the page's closing
   view" and history is "the page's very last section".
4. New sections' copy lives inside the new component files (content.ts is
   existing code — untouched).
5. Nav chips for new sections are inserted into NAV_SECTIONS (one line each)
   — treated as the minimal mount insertion for navigation; no existing chip
   moves.
6. Static educational facts carry a visible "last reviewed" date; numbers
   inside FAQ/glossary come only from the repo's own engines/constants
   (coin-premium.ts specs, tools invoice convention 7/7/9 VAT-on-اجرت+سود,
   troy ounce 31.1034768 g, mesghal 4.6083 g, 18k=750, 24k=999.9).
7. "Common allocation ~5–10% of a portfolio" is presented as a widely-cited
   convention in education wording, never advice (Phase 3; sources: WGC and
   major advisers' public guidance — wording kept generic).
8. The sandbox dev server must be started with
   `DATABASE_URL="file:/tmp/currena-dev.db" EODHD_TOKEN=… bun run dev`
   (a COPY of db/custom.db outside the watched tree) because: (a) the
   sandbox shell exports a conflicting DATABASE_URL pointing at
   /home/z/my-project/db/custom.db which Next.js will not override, and
   (b) when the day's EODHD sync cannot land a live row (rate-limited
   today, 2026-11-27), every /api/gold request re-runs the failed sync
   and upserts SourceSync rows — rewriting db/custom.db inside the dev
   watcher's tree, which turbopack treats as a file change and reloads
   the page, a self-sustaining reload loop. Running on the copy keeps
   the desk-of-record db byte-stable (it was restored to the checkpoint
   bytes after the first runs). Production (D1, no file watcher) is
   unaffected.
9. (S3) NAV_SECTIONS chip placement: the four new chips sit immediately
   before `gold-faq` (i.e. after `gold-calculator`) — inside the
   prompt's "between gold-other and gold-faq" range and the closest
   match to true page order, because the bands mount after
   CalculatorBand AND after PhysicalBand while the pre-existing
   `gold-other` chip already sits earlier in the row than its band (an
   existing condition, untouched).
10. (S3) The prompt's "2 import lines" read as "one import line per new
    band, per the house style" (Phase 1's record used the same
    per-band counting for its two bands) → 4 import lines for 4 bands;
    the additive proof stays additions-only either way.
11. (S3) The four-prices Tehran row hides entirely when the Iran layer
    is off (the owner's layer law: no Iranian numbers for the
    international reader) and one quiet line names the hidden fourth
    price without any numbers — the section title stays honest in EN.
12. (S3) The venues band's Tehran card renders for every reader: it is
    static education with no live numbers (the FAQ's own EN answers
    already name Tehran and the حباب the same way); the layer law
    governs live Iranian data, not the world-map education that names
    the fourth venue.
13. (S3) The futures term calendar anchors on the front's own expiry
    parsed from the feed's contract name ("Gold Dec 26"); if the feed
    ever stops naming it, the calendar falls back to today's UTC date
    walked to the nearest quarterly — every symbol that fails to quote
    is dropped honestly.
14. (S3) The record watch's "highest level" is the highest CLOSE in the
    5-year stitched window (a close-basis record), while the futures
    52-week high and the projection's peak carry their own bases
    (intraday/daily-high) — the three numbers can differ by design and
    each is labeled with its own basis and stamp, never blended.

## BLOCKED items

- ETF holdings driver (checklist 4): R-26 is `blocked: true` in
  relationships.ts (licensing); no free reliable holdings feed wired into the
  desk today. Stays a legend-only record unless the owner supplies a source.

## Needs my approval (existing problems found — NOT fixed, by rule)

1. **Hero spot vs Tehran board ounce can disagree by days.** The hero price
   card rides the EODHD observation store (once-per-UTC-day sync; on
   rate-limited days it serves the last sync, stamped "data as of"), while
   the Iran bridge board's own ounce row rides the live TGJU snapshot
   (fetchedAt minutes old). Today in the sandbox: hero 3532.83 (2026-11-22)
   vs board ounce 3643.59 (2026-11-27). Both are honestly stamped, but a
   reader comparing them sees different numbers. Fixing it would change the
   existing price card or bridge board — needs your approval.
2. **No buy/sell (dealer) spread on the Tehran board** — one market price per
   instrument plus day high/low; TGJU's snapshot carries p_min/p_max upstream
   that the board does not show. Adding it edits the existing bridge board —
   needs your approval.
3. **The Market Brief's verdict text is hand-authored per batch** (no date
   stamp on it): it can read stale between batches even while every number
   around it updates. A dated "last reviewed" line on the brief, or wiring
   its verdict to the live outlook classifier, would touch existing code —
   needs your approval.
4. **The failed-sync reload loop in sandbox dev**: when EODHD cannot land a
   live row for the day, every /api/gold request re-runs the failed sync and
   re-upserts SourceSync rows (db write per request). In sandbox dev that
   write lands in db/custom.db inside the watcher tree → page reload loop
   (observed 2026-11-27; mitigated locally by running dev on a db copy).
   Production Worker + D1 is unaffected (no file watcher). A code fix
   (e.g. backing off failed syncs within the day, or ignoring the db file in
   the watcher) edits existing sync code — needs your approval.
5. **The gold page body links to no tool page** — fixed additively in Phase 4
   via a new strip, but the deeper option (in-content links inside existing
   sections like the calculator) would edit existing copy — left as is.
6. **Two unmounted legacy component sets** (components/gold/* AURUM desk,
   ifbought.tsx, timemachine.tsx) ride the repo unused. Removal is a deletion
   — forbidden by the additive rule; listed for your decision.

## Session log

- S1 (2026-11-27): audit → plan → Phase 1 shipped (FAQ + glossary + sources
  band + share row, 2 new pack-style icons, additive proof clean). Phases
  2–4 remain; final review after Phase 4.
- S2 (2026-11-27): the owner asked for proposed additive sections (wants:
  futures market + physical market with reliable data) before further
  implementation. Live source-verification pass run from the sandbox
  (Yahoo chart+spark futures OK, front "Gold Dec 26"; CME direct blocked;
  LBMA blocked from sandbox; EODHD daily quota hit; TGJU ajax + per-indicator
  OK with fresh coin/حباب/PAXG rows). Proposals written to PROPOSALS.md
  (menu: A futures band, B1 four-prices unifier, B2 venues explainer,
  B3 digital-gold row, plus recap of Phases 2–4). No page code touched —
  docs only (this file + PROPOSALS.md). Awaiting owner approval.

- S2b (2026-11-27, same day): the owner APPROVED A, B1, B2, B3, the ATH
  record watch, and "Gold in 30 seconds" — and asked for an implementation
  prompt for the next session. Prepared: SESSION-3-PROMPT.md written
  (self-contained work order: scope, placement + chip lines, verified
  sources, per-item specs, icons, quality gates, additive proof rules);
  PROPOSALS.md carries the owner decision; PLAN.md carries Phase 5.
  Anchor checks done for the prompt: mount-site scope in page.tsx
  (data/projection/rates/showIran in scope between PhysicalBand and
  FaqBand), NAV_SECTIONS chip shape, /api/gold/trend range=all windows,
  projection readings shape (48 readings, shanghai-gold-premium via byId),
  TGJU per-indicator verified for tether_gold_xaut. NOT approved this
  round: Phase 2 (buying guide), why-hold-gold cards. Docs only again —
  no page code touched.

- S3 (2026-11-27/28): ALL FOUR approved items shipped, one additive commit
  each, per SESSION-3-PROMPT.md. Sources re-verified live at session start
  (Yahoo chart GC=F "Gold Dec 26" $3,668.5 + spark GCG27…GCZ27 OK; TGJU
  tether_gold_xaut $3,567.41 dated 2026-11-26 OK). Shipped:

  - **A — the COMEX futures band** (`gold-futures`, commit d77ec000):
    new `src/lib/gold-page/futures.ts` (chart + spark legs, the trend
    layer's own fetch grammar, 90 s warm / 60 s fail TTL cache, honest
    nulls, term symbols computed off the front's own expiry read from
    the feed's contract name), new `/api/gold/futures` route (503 when
    both legs fail), new `src/components/gold-page/futures.tsx` (front
    card with contract name/price/day change/day range/volume/updated ·
    delayed stamp/52-week line labeled COMEX; the basis row vs the hero
    store spot with BOTH stamps + the carry why-line; the delivery
    calendar table with $ vs front and the curve verdict chip
    contango/flat/backwardation, all translated; the Globex open/closed
    chip computed from the New York clock client-side; the plain-words
    `<details>` with the #gold-positions cross-link; the Yahoo source
    line), icon `gold-futures-paper-market.png`.
  - **B1+B3 — "one metal, four prices" + the digital-gold card**
    (`gold-four-prices`, commit 39c828d2): new
    `/api/gold/digital-gold` route (TGJU tether_gold_xaut per-indicator
    leg, house fx pattern, 5-min cache, 503 fail-closed, the row's OWN
    date stamped), new `src/components/gold-page/four-prices.tsx` — one
    table, four rows, each row its own source + stamp + one-line why:
    the store spot (EODHD stamp), the COMEX front (Yahoo, delayed,
    shared react-query key with the futures band — one fetch), the
    Shanghai premium (the projection's own shanghai-gold-premium
    reading, same as PhysicalBand), Tehran's Emami حباب (the SAME
    coin-premium engine + rates snapshot the bridge board renders —
    browser-verified identical: +5.4% on both); the Tehran row rides
    the owner's Iran layer (hidden for the EN reader without the
    toggle, one quiet naming line instead); the B3 card under the
    table — PAXG/XAUt price + change + own date + gap vs store spot +
    the not-an-endorsement caveat; icon `gold-one-metal-prices.png`.
  - **B2 — the physical venues explainer** (`gold-venues`, commit
    46971c5b): new `src/components/gold-page/venues.tsx` — four static
    education cards (London OTC, COMEX New York, Shanghai SGE, Tehran
    bazaar + union) with the house CountryFlag glyphs, each card
    cross-linked to the section carrying its live numbers, the
    takeaway line in the loud gold box, "last reviewed" stamped; no
    data, no fetch; icon `gold-market-venues.png`.
  - **"Gold in 30 seconds" + the ATH record watch**
    (`gold-thirty-seconds`, commit 30d4c074): new
    `src/components/gold-page/thirty-seconds.tsx` — four verdict rows
    (day/week/month/1 year, up-down-sideways per the house 0.15% flat
    band, house colors, EN "down 9%" / fa «۹٪ پایین‌تر» word orders,
    each row's own source label) riding the SAME trend payload the
    briefing table uses (passed from the page's own query — zero new
    fetches); the record watch in the loud gold box — the highest
    close in the 5-year window labeled exactly "the highest level in
    our stored price history (from {date})" (never an unqualified
    "all-time high") + the distance from it + the futures market's own
    52-week high with its own stamp (shared futures cache); the
    why-it-moved line quoting ONLY fetched numbers (trend windows +
    the projection's gold-usd percentile/from-peak when loaded, else
    the honest neutral sentence) + the #gold-briefing link; the
    descriptive-never-advice disclaimer; icon
    `gold-thirty-seconds.png`.

  Verified per item before its commit (and once more across all four at
  the end): `bun run lint` clean; browser EN + fa (full RTL), 375 px (no
  horizontal overflow) + desktop 1280 px, light + dark modes; every nav
  chip scrolls to its band (all 21 chips now); `<details>` open/close;
  money in `<bdi dir>`; fa digits in fa; fail-closed proven live by
  blocking each new route in the browser (futures, digital-gold, trend)
  — every case renders its honest unavailable line, never a stuck
  spinner; no console/page errors; `/api/gold/futures` and
  `/api/gold/digital-gold` curl-verified with real numbers and stamps.
  Icons: the S1 pack recipe rebuilt (v3 — gradient-background
  flood-following removal, dark-shadow pass, P-mode per-entry tRNS like
  the pack's own files, 250×250, 15–23 KB), every icon VLM-verified
  against the pack on dark + light composites (the stopwatch needed
  three regenerations + a saturation-core cut: the generator kept
  baking ground shadows; final icon is clean on both backgrounds).
  Additive proof: `git diff fb79cf61..HEAD` = 2,294 insertions, 0
  deletions; page.tsx receives exactly 4 import lines, 4 chip lines, 4
  mount lines (+ their comment blocks); every other file is new.
  Sandbox note: the desk's dev server ran on the sandbox's one exposed
  port (3000) per the S1 runbook (/tmp db copy + EODHD token); the
  sandbox's own scaffold server was stopped for the session — no repo
  change involved.
