# DECISIONS — Currena decision log (add-only)

> The universal `AGENTS.md` §8 decision log: date, decision, options
> considered, reason, who decided, when to revisit. **Add entries at the
> top; never rewrite history.** This file starts at 2026-11-08 when the
> universal rules were adopted — the project's FULL historical decision
> records predate it and stay authoritative where they live:
> `docs/page-division/03-STRATEGY-LOG.md` (D-1…D-48, the owner's
> three-round strategy record + the session log),
> `docs/specs/gold-meter-gapfill/` (the gap-fill program's decisions
> A–K, rounds 1–3), and the per-session delivery records in
> `docs/page-division/01-SESSION-ROADMAP.md`.

## 2026-11-08 — BD-S4a: the Global ribbon's day change rides the live-prices contract (`change1d`)

- **Decision:** D-22's "day change" is implemented as an optional,
  additive `change1d` on the live-prices entry (and the merged
  `IndicatorReading`): the live hourly quote vs the **previous
  session's close** — the last daily series point strictly before the
  quote's own bar. The ribbon displays it with a visible window tag
  (`1d`) and falls back to the labelled 7-day change until the stored
  prices key carries the field (the deployed :13 cron rung).
- **Options considered:** (a) keep the labelled 7-day change (S3's
  honest stopgap); (b) wire the history endpoint client-side (3 extra
  full-series fetches on the landing page); (c) extend the live-prices
  contract. **Reason for (c):** the true day change must measure the
  LIVE value the ribbon displays — a closes-only pair from the history
  endpoint would not correspond to it — and only the live-quote writer
  holds the daily series next to the live price. (b) was rejected
  against the lean-landing-page discipline (D-11's spirit) and for
  weighing ~3 × full-series payloads to read one number. The window is
  always visibly labelled (D-48's colour+label discipline extended to
  changes: a bare percent never rides without its window).
- **Who decided:** the build session (S4), under the roadmap's recorded
  "S4's call, never a silent guess". **Revisit:** if the owner prefers
  zero contract surface, (a) remains a one-line revert in the ribbon;
  ratification welcome, nothing blocking.

## 2026-11-08 — BD-S4b: the Global narrator line renders the narrator's text VERBATIM + an "Updated" stamp

- **Decision:** the D-24 one-liner shows the narrator artefact's overall
  text exactly as stored — never edited, never sentence-suppressed
  (including the template fallback's trailing "not financial advice"
  sentence, which reads oddly in a one-liner but is the narrator's own
  words) — and gains the legacy Insights block's "Updated {time}" stamp
  (same-day → "today") so the visitor can see WHEN the line was written.
- **Options considered:** (i) verbatim + stamp (chosen); (ii) suppress
  the trailing disclaimer sentence for the one-liner; (iii) rewrite the
  narrator's template. **Reason:** the narrator's text is its contract
  ("never edit the narrator's own text" — the session's scope note); a
  display layer that silently drops a not-financial-advice reminder is a
  compliance-adjacent risk; the stamp answers the real complaint (the
  line's freshness was invisible) without touching the words.
- **Who decided:** the build session (S4). **Revisit:** if the owner
  wants the one-liner trimmed, the narrator's own template
  (`packages/insights/src/narrator/template.ts`) is the right lever — an
  engine-side change with its own gates, never a display-side hack.

## 2026-11-08 — The 2026-11-08c deploy (Phase A live)

- **Decision:** deploy the S2+S3+S4 change set to production
  (version `637db8f8`) at the close of S4.
- **Reason:** the owner's session prompt delegated the timing ("the
  Worker deploy when you choose — the S2 endpoints + the S3 page sit
  ready"), the universal AGENTS.md §5 grants standing approval with
  verify-after rules, all gates were green (suite 14,730), the §21
  backtest had run 84/84 green over real KV, and S4 is the
  verification session — the natural moment the landing page goes live.
  Live-verified after (the backtest re-run against production, both
  widths, the legacy surfaces intact). Rollback: `wrangler rollback`.
- **Who decided:** the build session (S4) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-08c.

## 2026-11-08 — BD-S5a: the Gold page's cached-copy header (one honest sentence, not a doubled date)

- **Decision:** when the Gold page renders the LAST GOOD cached copy
  (M-17), the `fromCache` sentence ("Showing the last good copy — data
  as of {date}") REPLACES the plain data-as-of line in the page header
  instead of rendering beside it.
- **Reason:** the sentence carries its own date, so printing both read
  as a garbled duplicate ("Data as of Nov 8, 2026 · Showing the last
  good copy — data as of Nov 8, 2026" — flagged by the S5 dark-mode VLM
  pass; geometry proved no overlap, just the redundant double date).
  Same information, one honest sentence. The Global landing page keeps
  the S4 pattern (both lines) until S19's navigation/polish pass aligns
  it — recorded here so the alignment is a deliberate choice, never a
  silent drift.
- **Who decided:** the build session (S5). **Revisit:** S19 (or any
  earlier polish round) should align Global's header to the same rule;
  the change is two lines in `GlobalPage.tsx`.

## 2026-11-08 — The 2026-11-08d deploy (the Gold page live)

- **Decision:** deploy the S5 change set to production (version
  `f2e74f3c`) at the close of S5, although the session prompt marked
  the deploy optional ("S6's close may ship it").
- **Reason:** the owner's standing delegation ("the Worker deploy when
  you choose" + AGENTS.md §5), every gate green INCLUDING the live §21
  seat-level diff (150/150 against production, run before the deploy),
  and shipping now gives the owner the Gold page to review between
  sessions — S6's close can re-ship after its own gates at zero cost.
  Live-verified after (the backtest re-run against production 150/150,
  `/gold` at both widths, the Global + legacy surfaces intact).
  Rollback: `wrangler rollback`.
- **Who decided:** the build session (S5) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-08d.

## 2026-11-08 — BD-S6a: the Gold hero's balance-view alternation (the previous shape, smaller, beside the minimal design)

- **Decision:** the Gold page's hero balance block now carries TWO
  alternating designs through a real radio group — **the classic view**
  (the PREVIOUS shape of the gold balance: the brass assay-office stage
  with the five lane weights + the not-leaning tray, rendered SMALLER —
  the root capped at 480px, always the s-size metrics) and **the
  minimal view** (the S5 beam glyph, unchanged). The classic view is
  the DEFAULT; the choice persists per visitor
  (`currena:pd:gold:balance-view`).
- **The owner's words:** "I want the previous shape of Gold balance in
  gold dedicated page, it must be alternated with this new proposed
  minimal design, just make it smaller." Read as: both designs present,
  alternating (a switcher), the previous shape smaller. If the owner
  meant a plain replacement instead, flipping the default (or removing
  the toggle) is a two-line change — the alternation contains it.
- **Implementation shape (D-48, one drawing):** the brass stage + tray
  were EXTRACTED verbatim from the legacy `BalanceScale` as the exported
  `BalanceStage`/`BalanceTray` (one code path: the legacy card feeds the
  insights corpus's strings, the Gold hero feeds its corpus-pinned
  `pd.gold.*` keys — `gold-copy-pin.test.ts` pins 19 of the new keys
  byte-for-byte to the corpus so the classic drawing speaks EXACTLY the
  legacy card's words). The legacy card's DOM is byte-identical (the
  GB-S6 snapshot green untouched). Pressing a lane weight scrolls to
  that lane's seat card (the on-page answer to the legacy ledger row —
  the ledger/verdict-block/head/footnote stay out: the hero's own
  verdict word + counts + the seats section + the honest record already
  carry that content; duplicating them inside the hero would repeat the
  page against itself).
- **Reason:** the owner asked for the drawing they know from the legacy
  card, on the Gold page, without losing the new minimal design — and
  the beam, the weights and the tray ARE the shape; the engine's words
  (verdict, outlook, counts) render in both views so the two designs
  can never disagree.
- **Who decided:** the build session (S6) on the owner's in-session
  request. **Revisit:** any polish round (S19) or the owner's next
  review — flipping the default to minimal, or widening the stage cap
  (480 → the m step), are one-line changes.

## 2026-11-08 — The S6 frozen-scenario suite + the gf-p0-proposed package export

- **Decision:** the §21 verdict-consistency standard now sweeps HISTORY:
  the frozen harness's own arithmetic (`gfLaneBalance` over the frozen
  scenario tables — the production composition `GF_VOTERS_P4_5LANE`
  with the recorded F2 seat mapping, MIN2, the D-18 input-presence
  rule, the executed threshold map) is compared against the PAGE
  renderer (gold-tiles) window by window over the recorded corpus's 19
  archive days — meter counts, every lane vote, the beam angle, the
  verdict state and the 7-state outlook, plus the 18-scenario family
  re-run deterministically and three fail-closed proofs. The frozen
  tables became importable by consumers through a new additive package
  export (`@currena/insights/gf-p0-proposed`); the tables themselves
  are untouched.
- **Reason:** the S5 live run pinned one snapshot (today's); a drift in
  either surface's composition, thresholds, evaluator or presentation
  math over HISTORICAL shapes (sparse windows, split lanes, unread
  eras) would not surface from a single live check. The corpus windows
  carry those shapes. The S5 core's input-presence + context byte
  checks stay the LIVE tool they are (the recorded archives honestly
  predate the P2/P3/P4 seat promotions — absent on both sides, the
  pre-promotion era, never a drift; the derivation families are
  era-independent and re-run green).
- **Who decided:** the build session (S6) per the session prompt's gate
  ("the frozen-scenario suite re-run against the page renderer").
  **Revisit:** after any corpus refresh (`gold-corpus-dump`), the
  windows grow for free; after any voter-table change (governance
  D-GF-1), the production-composition pin surfaces it red here.

## 2026-11-08 — The 2026-11-08e deploy (the Gold alternation live)

- **Decision:** re-ship at the close of S6 (version `327c7761`) — the
  session changed code (the alternation + the frozen-scenario suite),
  and the owner's standing from S5's close said "S6's close may
  re-ship after its own gates".
- **Reason:** all gates green (the suite 14,799 · tsc 6/6 · lint 0/0 ·
  copy:audit clean · narrator in sync + 50 · layer1 11,819/11,819 ·
  build + budgets — GoldPage 31.23/8.06 vs its re-based 34/9 row,
  justified in `check-bundle-budget.mjs`: the classic-view code rides
  the Gold chunk while the drawing stays in the shared chunk, the
  Insights chunk UNTOUCHED at 1569.16/362.08 through the extraction);
  the live §21 backtest 150/150 green BEFORE and AFTER the deploy; the
  page live-verified at currena.ir/gold (the classic view default, the
  radio walk, the Global + legacy surfaces intact). Rollback:
  `wrangler rollback`.
- **Who decided:** the build session (S6) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-08e.

## 2026-11-08 — BD-S7a: the WorldMap copy contract (the REUSED map speaks the corpus's words through a structural interface)

- **Decision:** loosen the `WorldMap` component's `copy` prop from the
  full `InsightsCopy` corpus to the narrow structural `WorldMapCopy`
  interface (the `markets.map` block + the entries' name/country — the
  only fields the module reads), so the World Markets page can feed the
  SAME drawing its corpus-pinned `pd.worldMarkets.map.*` keys without
  loading the ~18k-line corpus into its chunk.
- **Options considered:** (a) import `useInsightsCopy()` on the page —
  rejected: it pulls both corpus locales into the page-division chunk
  graph (the lean-chunk discipline every page build has kept since S3);
  (b) rebuild a lean map view — rejected: D-43 says REUSE, and a second
  drawing violates D-48; (c) the BalanceStageCopy pattern (S6's
  extraction for the gold balance) — chosen: the legacy route keeps
  passing the corpus (it satisfies the narrower type structurally, zero
  behavior change), and the page's words are pinned byte-for-byte to the
  corpus in BOTH locales by `world-markets-copy-pin.test.ts` (the whole
  map block + the 16 entries' name/latin/country), so the drawing can
  never say something different from the legacy card.
- **Reason:** the S3 lineage (outlook-core / verdict-core) established
  that lean-chunk imports of legacy views happen through narrow
  structural contracts, never through copies; the S6 BalanceStageCopy
  proved the same for the words a shared drawing speaks.
- **Who decided:** the build session (S7). **Revisit:** if the map module
  ever reads a new copy field, the interface and the pin test grow with
  it (a missing pin fails the test, never a visitor's screen).

## 2026-11-08 — BD-S7b: the World Markets page container at 1280px (the map's designed stage width)

- **Decision:** the page's root container uses the Global landing page's
  `lg:max-w-[1280px]` rather than the Gold page's 1080px.
- **Reason:** the browser pass's DOM measurement found the first build's
  1080px container squeezed the REUSED map's stage to 1016px and
  re-exposed the 4×4px stoxx50×hsi callout-card corner intersection the
  2026-10-27 map-config round had tuned away (the legacy /insights shell
  renders the map at 1272px with zero overlaps); at 1216px the page
  measures ZERO card overlaps in both locales. The map's card positions
  are percentage-tuned for the legacy stage width — the page gives the
  drawing its designed width instead of re-tuning the shared config
  (which would change the legacy map too, outside S7's scope).
- **Who decided:** the build session (S7), from the verification pass's
  measurement. **Revisit:** if the map module ever becomes
  width-adaptive for its card positions, either container width works.

## 2026-11-08 — The 2026-11-08f deploy (the World Markets page live)

- **Decision:** ship at the close of S7 (version `6e515cf8`) — the
  owner's standing in the session prompt ("the deploy at the close is
  the owner's standing").
- **Reason:** all gates green (the suite 14,839 = +40 · tsc 6/6 · lint
  0/0 · copy:audit clean (7,306 entries, the 166 new fa strings queued)
  · narrator in sync + 50 · layer1 11,819/11,819 · build + budgets —
  the new WorldMarketsPage chunk 26.54/6.49 vs its 30/8 row; the REUSED
  map tree rides the shared chunk, the Insights chunk shrank
  1569.16→1553.03 through the sharing); the live §21 diff 56/56 green
  BEFORE and AFTER the deploy; the page live-verified at
  currena.ir/world-markets (zero card overlaps measured in the DOM, zero
  console errors); the Global + Gold + legacy surfaces intact.
- **Rollback:** `wrangler rollback` — `/world-markets` returns to the S1
  placeholder; nothing else moves.
- **Who decided:** the build session (S7) under the owner's standing.

## 2026-11-08 — BD-S8a: the one-drawing region prop (the zooms parameterize the SAME WorldMap)

- **Decision:** the region pages' zoom maps render through a `region`
  prop on the REUSED `WorldMap` module (not a parallel component): the
  prop swaps the SVG viewBox to REGION_ZOOMS' window, filters which
  indices seat pins + callout cards, and reads the per-zoom card
  positions — the rows' derivation NEVER changes (all 16 board rows
  feed the relative colour scale, so a zoomed market's colour weight +
  hero number are the world map's own BY CONSTRUCTION), and the words
  ride the ONE shared corpus-pinned adapter.
- **Options considered:** (a) a parallel `RegionZoomMap` component —
  rejected: two card/pin renderers can drift, and D-43/D-48's "one
  drawing, never restated" is exactly the guarantee a single component
  gives; (b) restating the rows per zoom (a subset-scale) — rejected:
  the S8 gate's "the same colours" would break (a mid-size move would
  read as the biggest on screen), and the backtest's fail-closed proof
  pins it red; (c) the region prop on the shared module — chosen, the
  BalanceStage/WorldMapCopy lineage.
- **Reason:** the world view stays byte-identical when the prop is
  absent (the legacy /insights + /world-markets hero pass nothing — all
  208 pre-existing world-markets/page-division tests green untouched);
  the derivation moved to `world-map-rows.ts` so the §21 backtest drives
  the exact function the drawing renders.
- **Who decided:** the build session (S8). **Revisit:** when a future
  region page grows its own rows (S9+), the card-click handler retargets
  to them — the S7 hero pattern.

## 2026-11-08 — BD-S8b: the zoom sections' scope (the map now; the region's own cards in S9–S16)

- **Decision:** S8 delivers the region pages' D-44 index/map SECTIONS
  (the zoom map over the world board) above the unchanged S1
  placeholder body — the region's own indicator cards, verdicts and
  fills arrive in their page build sessions (S9–S11 USA · S12–S13
  Europe · S14–S15 Asia · S16 Australia), and the pages keep the honest
  "In build" chip until then. The AUSTRALIA zoom seats the world board's
  one AU row (the ASX 200 anchor): the 19-symbol AU Markets board is
  S16's own scope and renders as a TABLE there — 18 of its symbols are
  Sydney-listed (one city: a map of them would be a pin blob, which is
  exactly why it was never a map). NZX50 is NOT on the Asia zoom in S8:
  it is not on the world board (the AU board carries it; S14/S16 wire
  that page section — recorded, never silently faked).
- **Options considered:** (a) read the AU markets board now (its route
  exists) — rejected: out of the session's scope ("data from the same
  markets board payload"), and its symbols have no map seating by
  design; (b) wait for S16 to give /australia any map — rejected:
  D-44 says all four region pages get their index/map section, and the
  world board's Sydney row is an honest zoom today.
- **Reason:** the smallest change that fully satisfies the recorded
  decisions; every scope edge is displayed honestly (the still-building
  chip + the placeholder body stay).
- **Who decided:** the build session (S8). **Revisit:** S16 (the AU
  board's table may widen the AU zoom's window if NZX50 ever pins);
  S14 (the Pacific/NZ section's own cards).

## 2026-11-08 — BD-S8c: the zoomed card click opens the market's full home today (/world-markets)

- **Decision:** on the region pages, a zoomed callout-card click (and a
  mobile dot tap) navigates to `/world-markets` — the market's complete
  home today (the region grids + the risk cards). When S9+ builds the
  region pages' own rows, the handler retargets to them (the S7 hero's
  scroll-to-row pattern).
- **Options considered:** (a) a no-op click — rejected: the card is a
  button, a dead click is a broken promise; (b) scroll to a row that
  does not exist yet — impossible; (c) navigate to the world page —
  chosen: honest, useful, zero new surfaces.
- **Reason:** every interactive element does what it says; the
  navigation is verified live in both locales and at both widths.
- **Who decided:** the build session (S8). **Revisit:** S9 (retarget
  /usa's handler when the USA tiers render).

## 2026-11-08 — The mobile dot-tap fallback (a small S7 fix that rode along)

- **Decision:** the WorldMap's list-layout dot tap (mobile) falls back
  to the caller's `onOpenMarket` when no `insights-market-tile-*`
  element exists on the surface — instead of dying silently.
- **Reason:** the S7 /world-markets mobile dot was dead (the legacy tile
  id is the only one the dot knew); with the fallback, the dot scrolls
  to the `wm-row` grid row on /world-markets (the S7 promise the mobile
  dot never honoured — verified live post-deploy) and navigates on the
  region pages. The legacy /insights explorer keeps its tile path
  (found first, unchanged).
- **Who decided:** the build session (S8), from the browser pass.
  **Revisit:** none needed.

## 2026-11-08 — The 2026-11-08g deploy (the Regional zoom maps live)

- **Decision:** ship at the close of S8 (version `fde50a95`) — the
  owner's standing in the session prompt ("the deploy at the close is
  the owner's standing").
- **Reason:** all gates green (the suite 14,877 = +38 · tsc 6/6 · lint
  0/0 · copy:audit clean (7,311 entries, the 5 new fa strings queued)
  · narrator in sync + 50 · layer1 11,819/11,819 · build + budgets —
  the new RegionPage chunk 3.95/1.56 vs its 8/3 row, WorldMarketsPage
  SHRANK 26.54→23.10 through the adapter sharing); the live §21 diff
  13/13 green BEFORE and AFTER the deploy; the four zooms live-verified
  on currena.ir (zero card overlaps measured in the DOM, zero console
  errors, real board values); the Global + Gold + World Markets +
  legacy surfaces intact.
- **Rollback:** `wrangler rollback` — the four region routes return to
  the S1 placeholders; nothing else moves.
- **Who decided:** the build session (S8) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-08g.

## 2026-11-09 — BD-S9a: the one-derivation verdict strip (the shared vocabulary riding pd.global)

- **Decision:** the USA page's D-30 verdict strip renders the five
  thematic gauges through `usaGaugeVerdicts` — which IS `global-tiles`'s
  own `globalGaugeTiles`, re-exported under the USA page's name (the S8
  world-map-copy pattern: ONE derivation, both pages). The copy layer
  splits the same way the Global board's does: the US-framed QUESTIONS
  (D-30's own example register: "Is borrowing getting costlier in
  America?") are the strip's only fresh words, while the verdict WORDS
  (Stable/Cautious/Stressed/Critical) and the why-lines ride the
  EXISTING `pd.global.*` keys — one verdict language everywhere (D-48),
  pinned to the insights corpus by `usa-copy-pin.test.ts` (which also
  pins pd.global's labels against the corpus's own `copy.label`), and
  zero duplicate fa strings for the shared vocabulary.
- **Options considered:** (a) a USA-local re-derivation of the gauges —
  rejected: exactly the "second arithmetic" D-48 forbids, and it would
  let the two pages drift; (b) new `pd.usa.*` verdict-word keys —
  rejected: a second wording of the same words for the same visitor,
  and 8 more fa strings in the owner's triage queue for nothing.
- **Reason:** the §21 gate ("the verdicts match Global's engine values
  byte-for-byte") is then true BY CONSTRUCTION and still PROVEN by the
  three-side backtest (page ≡ Global's page derivation ≡ the engine
  over the served snapshot — 69/69 green live, twice).
- **Who decided:** the build session (S9). **Revisit:** none needed.

## 2026-11-09 — BD-S9b: dollar-strength is the only strip link (→ /currencies)

- **Decision:** on the D-30 strip, the dollar-strength card is a real
  link to `/currencies` — BD-S3b's Global-board mapping honoured on-page
  (the gauge's detail cards live there by D-32). The other four strip
  cards render plain (not links): the page IS their destination — their
  voter cards live on this page's tiers or its S10 sections, and a
  self-link would be noise.
- **Options considered:** (a) all five link out — rejected: four of the
  five would link to the page the visitor is already on; (b) no links
  at all — rejected: dollar-strength has a real other-destination home,
  and the Global board already promises the mapping.
- **Reason:** every link goes somewhere useful; the accessible tree
  names the link (verified in the browser pass's a11y snapshot).
- **Who decided:** the build session (S9). **Revisit:** S18 (the
  currencies page build may want a back-link from its dollar-standing
  section).

## 2026-11-09 — BD-S9c: the zoom stays on top through every state; the placeholder body stays until S10

- **Decision:** the S8 zoom section renders through EVERY UsaPage state
  — ready, loading AND error — because its board feed is its own (M-17
  on its own tracks): a slow or dead PROJECTION never takes the honest
  map away with it. The In-build chip and the S1 placeholder body stay
  for tiers 3–6 + the TIC board (BD-S8b's recorded page order and scope,
  honoured): the S9 layers are real from today, and the page says
  exactly what remains and when (S10–S11).
- **Options considered:** (a) the GoldPage early-return pattern without
  the zoom — rejected: it would hide real, independently-sourced map
  data during a projection outage (less honest, not more); (b) retire
  the placeholder body now — rejected: tiers 3–6 + TIC have not landed;
  the body's "what will live here" record is still the honest promise.
- **Reason:** each feed governs its own surface; nothing is faked and
  nothing promised beyond the roadmap.
- **Who decided:** the build session (S9). **Revisit:** S10's close (the
  body retires when tiers 3–6 + TIC land; S11 may polish the header).

## 2026-11-09 — The 2026-11-09a deploy (the USA verdicts + tiers 1–2 live)

- **Decision:** ship at the close of S9 (version `36f64141`, ~2026-11-08
  20:35 UTC) — the owner's standing in the session prompt ("the deploy
  at the close is the owner's standing").
- **Reason:** all gates green (the suite 14,906 = +29 · tsc 6/6 · lint
  0/0 · copy:audit clean (7,370 entries, the 59 new fa strings queued)
  · narrator in sync + 50 · layer1 11,819/11,819 · build + budgets —
  the new UsaPage chunk 15.21/4.29 vs its new 20/6 row, GlobalPage
  SHRANK 24.40→23.04 and RegionPage 3.95→1.65 through the shared
  global-tiles / RegionIndexSection chunks); the live three-side §21
  diff 69/69 green BEFORE and AFTER the deploy; currena.ir/usa
  live-verified at 1440×900 and 360×844 in BOTH en and fa (zero card
  overlaps measured in the DOM, zero console/page errors, real board
  values — the strip's five engine verdicts identical in both locales);
  the Global + Gold + World Markets + the three remaining region pages
  + the legacy /insights intact.
- **Rollback:** `wrangler rollback` — /usa returns to the S8 zoom-only
  page; nothing else moves.
- **Who decided:** the build session (S9) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-09a.

## 2026-11-09 — BD-S10a: the TIC board is the REUSED legacy drawing through a narrowed copy contract (one drawing, one vocabulary)

- **Decision:** /usa's tier-6 "Who finances America" board (D-31) is the
  SAME `TicSection` module the legacy /insights page renders — never a
  restatement (D-48). To make the reuse lean, `TicCustodyCard` (the
  weekly custody card) was extracted to its own module and the section's
  copy contract narrowed from the full `InsightsCopy` corpus to its own
  block (`TicSectionCopy = Pick<InsightsCopy,'tic'>` — the S7 WorldMapCopy
  pattern); the USA page feeds it the corpus-pinned `pd.usa.tic.*` words
  through the ONE lean adapter (`usa-tic-copy.ts`), every key pinned
  byte-for-byte in both locales by `usa-copy-pin.test.ts`.
- **Options considered:** (a) reuse through the narrowed contract —
  chosen; (b) rebuild a lean USA-only TIC section — rejected: it would
  duplicate ~850 lines of already-tested UI against AGENTS rule 4 and
  D-48; (c) import the legacy section with the full corpus — rejected:
  it would pull the ~19K-line insights copy chain into the USA chunk.
- **Reason:** one drawing means the board can never say a different word
  or compute a different number on /usa than on /insights; the pin test
  guards the words, the §21 TIC diff guards the numbers; the shared
  chunk paid the drawing once (the Insights chunk SHRANK through the
  split).
- **Who decided:** the build session (S10). **Revisit:** none needed.

## 2026-11-09 — BD-S10b: the placeholder body retired; the In-build chip stays for S11

- **Decision:** the S1 placeholder body ("What will live here…") is
  RETIRED from /usa — all 72 registry cards + the TIC board are on-page,
  so the future-tense promise would be dishonest. The honest "In build"
  chip stays until S11's gates/polish pass (the roadmap's own remaining
  scope for this page).
- **Reason:** the body's only job was the honest record of what was
  still missing; nothing is missing now. The chip speaks the remaining
  roadmap work (S11's gates) — one honest signal, not two.
- **Who decided:** the build session (S10), per the session prompt's own
  scope ("the placeholder body retires as these tiers land; the In-build
  chip stays until S11's polish"). **Revisit:** S11 (the chip retires
  with the gates pass).

## 2026-11-09 — BD-S10c: the S8 zoom IS the §7 item-8 index section (nothing invented beyond the spec)

- **Decision:** spec §7 item 8 ("Bottom — US index section (D-44): SPX ·
  NDX · DOW zoom map + cards") is satisfied by the S8 zoom section that
  already sits atop /usa — the zoomed map with the three index cards
  seated. S10 adds NOTHING beyond it; the map is recorded as the
  section.
- **Options considered:** (a) record the map as the section — chosen;
  (b) add per-index detail cards/rows beyond the map — rejected: the
  spec's own words ask for "zoom map + cards" and nothing more; the
  indices' full rows live at /world-markets (BD-S8c's recorded link).
- **Reason:** inventing scope beyond the spec is exactly what the
  program's rules forbid; the roadmap's S10 entry offered both branches
  and the spec's text decides.
- **Who decided:** the build session (S10). **Revisit:** S21's
  spec-vs-implementation audit (if the investor's review reads item 8
  wider, that session records the delta).

## 2026-11-09 — The 2026-11-09b deploy (the USA tiers 3–6 + the TIC board live)

- **Decision:** ship at the close of S10 (version `18907d4d`,
  2026-11-08 22:24 UTC) — the owner's standing in the session prompt
  ("the deploy at the close is the owner's standing"). The deploy-lock
  check ran first: the active version was S9's `36f64141` @ 100%, no
  parallel deploy.
- **Reason:** all gates green (the suite 14,917 = +11 · tsc 6/6 · lint
  0/0 · copy:audit clean (7,486 entries, the 116 new fa strings queued)
  · narrator in sync + 50 · layer1 11,819/11,819 · build + budgets —
  the UsaPage chunk re-based 24.49/6.38 vs 26/7 and the new shared tic
  chunk 21.16/5.59 vs 24/7, the Insights chunk SHRINKING
  1553.17→1532.14 through the split); the live §21 diff 173/173 green
  BEFORE and AFTER the deploy (the 72-card trio coverage + the TIC board
  diff + the freshness audit); currena.ir/usa live-verified at 1440×900
  and 360×844 in BOTH en and fa (all six tiers, zero overlaps, zero
  errors, the deployed chunks byte-identical to the local build); the
  Global + Gold + World Markets + region + legacy surfaces intact.
- **Rollback:** `wrangler rollback` — /usa returns to the S9 page
  (strip + tiers 1–2); nothing else moves.
- **Who decided:** the build session (S10) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-09b.

## 2026-11-09 — BD-S11a: the freshness audit formalized as a pure function + offline suite (the §21 "Data audit" leg)

- **Decision:** the freshness-within-cadence-grace audit the live
  `pd-s10-backtest.ts` script carried inline is extracted into a PURE
  function (`auditUsaFreshness` in `usa-backtest-core.ts`) and pinned by an
  offline suite (5 tests in `usa-backtest.test.ts`). The live script now
  calls the same function — no logic drift between the test and the gate.
- **Options considered:** (A) leave the audit in the live script only (the
  S10 state — the logic was correct but unpinned, a future refactor could
  silently break it); (B) extract the pure function + pin the offline suite
  with the fail-closed proof (a card beyond grace the engine forgot to flag
  → RED); (C) add a full registry-freshness test over the live
  `data/indicators.json` (fragile — the registry changes every ingest).
- **Reason:** B — the §21 "Data audit" leg ("all listed cards render with
  value, 10-year position, and freshness within cadence grace") is a gate,
  and a gate's logic must be regression-pinned. The pure function takes
  `(readings, registry, cardIds, now)` and returns `{checks, withinGrace,
  beyond[]}` where each beyond-grace finding carries an `honest` flag (true
  iff `status === 'stale'`); the audit passes iff every beyond-grace card is
  honest (the govt-interest-revenue case: 222d beyond its 215d grace AND
  carrying the engine's stale status — the page speaks the engine's own
  word). The fail-closed proof (a beyond-grace card with `status: 'normal'`
  → RED) catches the engine's own miss, never a silent stale-by-age card.
  The live script's `registryMaxAge()` reads `data/indicators.json` (the
  generated registry) and passes it to the same function.
- **Who decided:** the build session (S11). **Revisit:** if the registry's
  `maxAgeDays` semantics change (a new cadence type, a redefinition of
  "stale"), the offline suite's synthetic boards must grow the new shape.

## 2026-11-09 — BD-S11b: the mobile/ARIA polish — the Show-all toggle's aria-controls + the period switch's 44px touch target

- **Decision:** two ARIA/touch-target polish passes on the REUSED
  components the USA page renders (both benefit /usa AND the legacy
  /insights, since the components are shared):
  (a) `TicSection.tsx` — the mobile card list's Show-all toggle already
  carried `aria-expanded` (S10); it now carries `aria-controls` pointing to
  the list it controls (the `useId()`-generated id on the list container).
  `useId()` keeps the id unique per instance so the REUSED component renders
  on both pages without an id collision (the WAI-ARIA disclosure pattern).
  (b) `WorldMap.tsx` — the period switch's radio buttons bumped from
  `min-h-[41px]` / `@max-[480px]:min-h-[37px]` to `min-h-[44px]` everywhere
  (the spec §18 D-48 "touch targets ≥ 44px" was below on small screens at
  37px; the `@max-[480px]` height override removed, the small-screen
  padding/font reductions kept for horizontal fit).
- **Options considered:** (A) leave the toggle without `aria-controls` and
  the period switch at 37px (the S10 state — compliant with WCAG 2.2's 24px
  minimum but below the project's own §18 D-48 44px bar); (B) add
  `aria-controls` + bump to 44px (the polish); (C) defer to S19 (the
  "Navigation, mobile & SEO polish" integration pass).
- **Reason:** B — the S11 scope is "the mobile/ARIA polish pass" and the
  USA page renders both components; the 44px bar is the project's own spec
  rule (§18 D-48), not an optional AAA. The `aria-controls` link is the
  WAI-ARIA disclosure pattern (the toggle already had `aria-expanded` — the
  pair is the contract). The period switch's `overflow-x-auto` radiogroup
  handles width; the `flex-wrap` container handles height — the bump is
  vertically safe (the browser pass confirmed ZERO card overlaps + 0px
  overflow at 360×844). The sort buttons in the TIC table stay at 36px
  (desktop-only at ≥900px, exceeding WCAG 2.2's 24px minimum; the 44px bar
  is for touch, and the table doesn't render on touch-width mobile — the
  mobile card list does, with its 44px Show-all toggle).
- **Who decided:** the build session (S11). **Revisit:** if the TIC table
  ever renders on touch-width mobile (a responsive change), the sort buttons
  must bump to 44px.

## 2026-11-09 — BD-S11c: the In-build chip retired (BD-S10b's completion)

- **Decision:** the USA page's honest "In build" status chip is RETIRED
  from the heading block (BD-S10b's completion — the chip "stays for S11's
  gates/polish"; S11's gates passed: the §21 card audit 173/173 green, the
  freshness audit formalized, the mobile/ARIA polish landed). The
  `pd.statusBuilding` key stays in both dictionaries — `RegionPage`
  (Europe/Asia-Pacific/Australia, the not-yet-built region pages) and
  `PagePlaceholder` (Commodities/Currencies) still carry the honest chip for
  their own in-build state.
- **Options considered:** (A) keep the chip (the page is "in build" until
  the whole 30-session program completes); (B) retire the chip on the USA
  page only (the page's own layers are complete and verified); (C) retire
  the key entirely (would break the other placeholder pages).
- **Reason:** B — the USA page's layers are complete since S10 (the 72
  cards + the TIC board) and S11's gates verified them green. The honest
  "in build" claim was for the gates/polish work S11 was scoped to do; that
  work is done. Keeping the chip after its gate passed would be DISHONEST
  in the other direction (claiming in-build when the page is verified
  complete). The key stays for the genuinely-not-yet-built pages.
- **Who decided:** the build session (S11). **Revisit:** if the USA page
  gains a new layer in a future session (e.g., S19's SEO/meta pass adds new
  content), the chip does NOT return — the page is live and verified; a new
  layer ships when it's ready, not under an in-build banner.

## 2026-11-09 — The 2026-11-09c deploy (the USA gates — Phase D closes)

- **Decision:** ship at the close of S11 (version `4f288272`,
  2026-11-09 00:42 UTC) — the owner's standing in the session prompt
  ("the deploy at the close is the owner's standing"). The deploy-lock
  check ran first: the active version was S10's `18907d4d` @ 100%, no
  parallel deploy.
- **Reason:** all gates green (the suite 14,922 = +5 · tsc 6/6 · lint
  0/0 · copy:audit clean · narrator in sync + 50 · layer1 11,819/11,819 ·
  build + budgets — the UsaPage chunk 24.20/6.29 vs its 26/7 row (the
  In-build chip removal shaved ~288 bytes), the shared tic chunk
  21.20/5.61 vs its 24/7 row (the aria-controls + useId added ~39 bytes));
  the live §21 diff 173/173 green BEFORE and AFTER the deploy (the 72-card
  trio coverage + the TIC board diff + the freshness audit through the pure
  function); currena.ir/usa live-verified at 1440×900 and 360×844 in BOTH
  en and fa (all six tiers with ZERO card overlaps measured in the DOM, NO
  horizontal scroll, the period switch at 44px, the Show-all toggle's
  aria-controls resolving, the In-build chip ABSENT, ZERO console/page
  errors); the VLM's 3 fa-360 findings (a "stray gray bar", a "clipped
  date", a "clipped question") DISPROVEN against the DOM (the topbar's
  normal border; the actual date "داده‌های ۱۴۰۵/۰۸/۱۷" fits scrollW===clientW;
  the actual question "در تنش" fits scrollW===clientW — the VLM misread at
  small font, exactly the S10 precedent); the deployed UsaPage + tic chunks
  BYTE-IDENTICAL to the local build (24,198 + 21,195 bytes, the hashed
  names match exactly); the Global + Gold + World Markets + region + legacy
  surfaces intact.
- **Rollback:** `wrangler rollback` — /usa returns to the S10 page (the
  complete 72 cards + the TIC board with the In-build chip and the 37px
  period switch); nothing else moves.
- **Who decided:** the build session (S11) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-09c.

## 2026-11-09 — BD-S12a: the §15 FRED-only fills verified-pending-ingest (none ingested unverified — Rule 5)

- **Decision:** the three D-34 Europe fills (euro-area unemployment ·
  industrial production · ECB-SDMX M3 liquidity) are NOT ingested in S12.
  The candidates were probed live against the publisher (Rule 5); none
  could be verified cleanly from the dev sandbox, so per Rule 5
  (unverifiable → discard + record) none is ingested and the candidates +
  the verification status are recorded for the next session.
- **Options considered:**
  (A) Ingest the verified candidates within S12 — rejected: the live
  verification did not complete from the sandbox (FRED serves a JS
  challenge to the sandbox IP; the ECB M3 SDMX key needs the dimension
  walk the production adapter does for the Eurosystem-assets series), and
  the ingest is an engine-layer change (definitions.ts + adapter + KV +
  registry + placement + display + copy) that deserves its own focused
  session with the full AGENTS.md §A maintenance discipline.
  (B) Verify-only + record + defer the ingest (CHOSEN) — the §21 diff
  gate is over the 8 placed cards (unaffected); the fill gate ("fills
  verified against publisher releases (Rule 5)") is met by FOLLOWING
  Rule 5 (no unverified data ingested); the page ships with the honest
  "In build" chip (the thin-region mitigation the spec §20 names).
- **Reason:** Rule 5 (financial-data discipline — never assume; fail
  closed). The FRED adapter reaches FRED fine from the production Worker
  (the bund/gilt/italy mirrors prove the adapter works in egress), so the
  candidates ARE verifiable in principle; the sandbox limitation is
  environmental, not fundamental. The right next step is to run the
  verification from production egress (or with the full ECB BSI dimension
  walk) + ingest in a dedicated session.
- **Candidates recorded:**
  - euro-area unemployment — FRED OECD mirror family (candidate series id
    LRHUTTTTTTEZM156S / LRUN74TTEZM156S — the FRED search confirms the
    family; the live fredgraph.csv fetch was blocked by the sandbox JS
    challenge; cross-check publisher: Eurostat une_rt_m, EA19, monthly SA).
  - euro-area industrial production — FRED OECD mirror family (candidate
    PIEAUST / PROINDMEZM156N; same sandbox block; cross-check publisher:
    Eurostat sts_inpr_m, EA19, monthly).
  - ECB-SDMX M3 liquidity — the existing ECB BSI adapter; the candidate
    M3 keys probed (BSI/M.U2.Y.V.M3.U2.1.Z5.0000.Z01.E and variants) all
    returned 404/empty; the right key needs the BSI dimension walk the
    adapter did for the Eurosystem-assets series (BSI/M.U2.N.C.T00.A.1.
    Z5.0000.Z01.E — the BS_ITEM=M3 + the right BS_REP_SECTOR for the
    monetary aggregate, distinct from the Eurosystem balance sheet).
- **Who decided:** the build session (S12) under Rule 5. **Revisit:**
  S13 (the Europe gates session) or a dedicated fill session — verify
  from production egress + the M3 dimension walk, then ingest with the
  full §A discipline (definitions.ts → registry:generate → placement →
  display → copy → the adapter fetch wiring → CHANGELOG).

## 2026-11-09 — BD-S12b: the Europe page build (the EU + non-EU UK sections, the zoom, the cross-links, the §21 backtest)

- **Decision:** the Europe page ships as its own lazy chunk (the UsaPage
  pattern) — the EU section (ecb-dfr · euro-hicp · euro-aaa-10y ·
  bund-10y · btp-bund-spread · oecd-cli-de) and the non-EU United Kingdom
  section (gilt-10y · boe-rate) listed APART per D-33, each card with the
  §21 trio (value · 10-year position · freshness) through the pure
  europe-tiles (pinned output-for-output against config/display.ts's
  formatReadingValue by europe-tiles.test.ts, the S9 usa-tiles pattern);
  the S8 zoom section on top (RegionIndexSection region='europe' — the
  STOXX50E/DAX/CAC/FTSE zoom already renders it; the page's own layers
  seat under it); the cross-links strip (§8 item 4: eur-usd · usdchf ·
  usdtry → /currencies). The honest "In build" chip stays (BD-S12a — the
  fills are verified-pending-ingest).
- **The §21 backtest:** europe-backtest-core.ts (the page ≡ engine trio
  diff over the 8 cards, reusing S11's pure auditUsaFreshness for the
  freshness audit — one audit function, no logic drift) +
  europe-backtest.test.ts (12 tests: the GREEN path, the public-mode
  twin, four FAIL-CLOSED proofs, the stableStringify immunity, + the
  freshness audit's own cases on Europe's cadences) + the live
  pd-s12-backtest.ts script. The copy pins: europe-copy-pin.test.ts (the
  8 card names + units + position/band/status words ↔ the corpus, both
  locales) + the 34 new pd.europe.* fa strings queued unreviewed in the
  manifest (the S9/S10 pattern).
- **Reason:** the spec §8 (D-33 EU/non-EU split, §8 items 1–4); the S12
  scope (the session prompt); the UsaPage pattern (the S9/S10 display-
  layer discipline — pure tiles, the §21 trio, the copy pins, the live
  backtest).
- **Who decided:** the build session (S12). **Revisit:** S13 (the Europe
  gates session) — the card-render audit, the freshness, the mobile/ARIA
  pass, the In-build chip retirement (when the fills land + the gates
  pass).

## 2026-11-09 — The 2026-11-09d deploy (the Europe page — Phase E opens; /europe live for every visitor)

- **What:** the page-division S12 deploy — the Europe page build
  (BD-S12b) over the S11-complete codebase. Display-layer ONLY: no
  engine, voter, threshold, calibration or provider change; the SAME
  insights snapshot + the SAME markets board, zero new fetches, zero new
  KV.
- **Gates before the deploy (ALL GREEN, 2m 26s):** secret scan 8/968 ·
  typecheck 6/6 · eslint 0/0 · copy:audit clean · narrator in sync + eval
  50 · layer1 11,819/11,819 · the full suite **14,945 = +23** (europe-
  tiles 9 · europe-copy-pin 2 · europe-backtest 12) · build + budgets
  held (entry 270.28/81.86; the Europe lazy chunk in budget).
- **The §21 diff — the S12 gate's own, run LIVE twice (pre-deploy and
  post-deploy): 8 cards · 8 green · 0 red.** The live pd-s12-backtest.ts
  against PRODUCTION: the 8 cards' trio inputs byte-identical (page ≡
  engine), the EU/non-EU group membership 6/2 + 8/8 carried, the
  freshness audit honest (btp-bund-spread 100d beyond its 75d monthly
  grace AND carrying the engine's stale status — the page speaks the
  word).
- **The deploy-lock check ran first** (the D-43 lesson): the active
  version was S11's `4f288272` @ 100% — no parallel deploy. `pnpm
  --filter @currena/web build` + `wrangler deploy` → **currena-api
  `84833135` @ 100%** (deployment `84833135-c8b4-48d4-a4aa-da4e57a04ae0`,
  2026-11-09T02:20Z). currena-markets untouched (code-unchanged).
- **The live acceptance (ALL GREEN):** currena.ir/europe live-smoke-
  verified at 1440×900 en (8 cards · the EU section · the UK section ·
  the zoom · the 3 cross-links · the In-build chip present · 0px overflow
  · 0 page errors · the live values ecb-dfr 2.50% · euro-hicp 4.0% ·
  btp-bund-spread 0.80 pts · oecd-cli-de 101.0 index); the browser pass
  (the freshly built SPA through the local preview server, /api proxied
  to currena.ir) at 1440×900 AND 360×844 in BOTH en and fa (RTL, Persian
  digits) — the 8 cards with ZERO overlaps measured in the DOM, NO
  horizontal scroll at any width in any locale (overflow 0px on all 4
  legs), the In-build chip present on all 4 legs, ZERO console/page
  errors across all 4 legs; the Global + Gold + World Markets + USA +
  region + legacy /insights surfaces intact.
- **Rollback:** `wrangler rollback` — /europe returns to the S8
  RegionPage placeholder (the zoom + the DestinationBody); every other
  surface was byte-identical before it.
- **Who decided:** the build session (S12) under the owner's standing
  delegation. **Revisit:** none needed; the record lives in
  `docs/DEPLOY.md` 2026-11-09d.

## 2026-11-09 — BD-S13a: the Europe card-render audit + the live §21 diff as the session's own gate (the S11 UsaPage.test.tsx pattern mirrored for Europe)

- **Decision:** the S13 Europe gates session adds the Europe page's
  DOM-level render audit (`EuropePage.test.tsx`, 7 tests — the
  `UsaPage.test.tsx` pattern scoped to Europe's 8 placed cards), AND
  re-audits the live §21 diff as the session's own gate. The render
  audit pins: the shell (title + purpose + data-as-of, the In-build chip
  ABSENT), the S8 zoom on top through every state (4 STOXX50E/DAX/CAC/
  FTSE cards), the EU section (6) + the non-EU UK section (2) listed
  apart (D-33), the 8 cards in placement order with the §21 trio (value
  · 10-year position · freshness — the percent/points/index joins), the
  cross-links (3, 44px, → /currencies), the fail-closed paths (an absent
  card → "Cannot read yet"; a dead projection → the error state + retry;
  the M-17 last-good cached paint), and the fa/RTL rendering. The live
  `pd-s12-backtest.ts` re-run against PRODUCTION: 8 cards · 8 green · 0
  red (page ≡ engine byte-for-byte), the EU/non-EU membership 6/2 +
  8/8 carried, the freshness audit honest (btp-bund-spread 100d beyond
  its 75d monthly grace AND status 'stale').
- **Options considered:** (A) rely on the S12 §21 trio diff alone (the
  8-card byte-identical check — correct but unpinned at the DOM level; a
  render regression like a missing section or a broken cross-link would
  not surface); (B) add the DOM render audit + re-run the live §21 diff
  as the session's own gate (the S11 UsaPage.test.tsx pattern); (C) a
  full Playwright visual suite (heavier than the gates session needs —
  the DOM characterization + the 4-leg browser pass is the §21
  discipline).
- **Reason:** B — the §21 "card-render audit vs the placement table" is
  a gate, and the S11 pattern (UsaPage.test.tsx's render audit + the live
  diff re-audited) is the established way to pin it. The render audit
  catches display-layer regressions the trio-diff can't (a dropped
  section, a broken link, a chip that didn't retire); the live diff
  re-confirms the page ≡ engine byte-for-byte. Both ran green.
- **Who decided:** the gates session (S13). **Revisit:** if the Europe
  page gains a layer (the §15 fill cards when they land), the render
  audit grows the new cards' assertions.

## 2026-11-09 — BD-S13b: the Europe mobile/ARIA pass — the 44px touch targets, the section-heading semantics, the RTL flow (pinned + browser-verified)

- **Decision:** the S13 mobile/ARIA pass on /europe (spec §18 D-48's
  "touch targets ≥ 44px" + the WAI-ARIA disclosure pattern + the RTL
  flow) is VERIFICATION + the pin: the cross-link cards already carry
  `min-h-[44px]` (S12 applied the S11 lessons when it built the page),
  the section headings already carry the `<section aria-label>` + `<h2>`
  semantics (the established USA pattern — `<article>` + `<h4>` for
  cards), and the RTL flow already rides the logical CSS + the `<bdi
  dir>` joins. The render audit (BD-S13a) now PINS the 44px touch target
  on every cross-link, the section semantics, and the fa/RTL rendering;
  the 4-leg browser pass (en/fa × 1440/360) confirmed all green.
- **Options considered:** (A) leave the compliance unpinned (the S12
  state — compliant but a future refactor could regress without a
  test); (B) pin the compliance in the render audit + verify in the
  browser (the S11 pattern); (C) add new ARIA attributes the page
  doesn't need (a disclosure pattern Europe has no toggle for).
- **Reason:** B — the S11 gates session pinned the USA ARIA compliance
  the same way (the render audit asserts the 44px + the disclosure);
  Europe has no Show-all toggle and no period switch of its own (the
  zoom's period switch inherited S11's 44px fix globally), so the pass
  is the cross-link 44px + the section semantics + the RTL flow, all
  already compliant — the pin keeps them green. No code change was
  needed (the S12 build carried the S11 lessons); the pass is the
  verification + the pin, exactly the honest result.
- **Who decided:** the gates session (S13). **Revisit:** if the Europe
  page gains a toggle/disclosure (e.g., a future Show-all for the fill
  cards), it carries aria-controls (the S11 TicSection pattern).

## 2026-11-09 — BD-S13c: the In-build chip retired + the Europe budget row (BD-S12b's completion)

- **Decision:** the Europe page's honest "In build" status chip is
  RETIRED from the heading block (BD-S12b's completion — S13's gates
  passed: the §21 card audit 8/8 green, the freshness audit honest, the
  mobile/ARIA polish landed). The page's 8 placed cards are complete and
  verified; no honest "in build" claim remains. The `pd.statusBuilding`
  key stays in both dictionaries — `RegionPage` (Asia-Pacific/Australia,
  the not-yet-built region pages) and `PagePlaceholder`
  (Commodities/Currencies) still carry the honest chip for their own
  in-build state. The Europe lazy chunk gets its own budget row (the
  S9/S10 pattern): measured 10.07/3.06 vs a 14/5 ceiling (headroom for
  the §15 fill cards when a later session verifies + ingests them).
- **Options considered:** (A) keep the chip until the §15 fills land
  (the page is "honestly still growing"); (B) retire the chip on the
  gates pass (the 8 placed cards are complete; the fills are a separate
  engine-layer change); (C) retire the key entirely (would break the
  other placeholder pages).
- **Reason:** B — the 8 placed ids' gates pass (§21 diff 8/8 green,
  freshness honest, mobile/ARIA green), exactly the USA trajectory
  (S9/S10 chip → S11 retirement on the gates pass). The §15 fills stay
  verified-pending-ingest (Rule 5 — BD-S13d): they are an ENGINE-layer
  change (definitions.ts → registry:generate → placement → display →
  copy → adapter fetch wiring) that deserves its own focused session,
  and their absence does not make the 8 placed cards "in build" — the
  page as it stands is complete and verified. Keeping the chip after its
  gate passed would be DISHONEST in the other direction (claiming
  in-build when the 8 placed cards are verified complete). The budget
  row formalizes the Europe chunk gate (the S12 "in budget" claim was
  loose — no row existed; S13 adds it, the S9/S10 pattern).
- **Who decided:** the gates session (S13). **Revisit:** if the Europe
  page gains a new layer (the §15 fill cards), the chip does NOT return
  — the page is live and verified; the new cards ship when they're
  ready, not under an in-build banner. Bump the 14/5 budget if the fills
  push the chunk past it (with a changelog justification, never
  silently).

## 2026-11-09 — BD-S13d: the §15 FRED-only fills carried forward (verified-pending-ingest — Rule 5; the ingest is engine-layer, a dedicated session)

- **Decision:** S13 (the Europe gates session) does NOT ingest the
  three D-34 Europe §15 fills (euro-area unemployment · industrial
  production · ECB-SDMX M3 liquidity). The candidates stay
  verified-pending-ingest (Rule 5 — BD-S12a). S13's scope is the
  display-layer gates (the card-render audit, the freshness, the
  mobile/ARIA pass, the In-build chip retirement); the ingest is an
  ENGINE-layer change (definitions.ts → registry:generate → placement →
  display → copy → the adapter fetch wiring → CHANGELOG) that the
  BD-S12a decision explicitly said "deserves its own focused session
  with the full AGENTS.md §A maintenance discipline."
- **Options considered:** (A) ingest the fills in S13 (the gates
  session — would bloat the session past its short-session scope (Rule
  1) AND the verification needs production egress the dev sandbox can't
  reach (FRED serves a JS challenge to the sandbox IP; the ECB M3 SDMX
  key needs the BSI dimension walk the production adapter does for the
  Eurosystem-assets series)); (B) carry the fills forward to a
  dedicated fill session that verifies from production egress + the M3
  dimension walk + ingests with the full §A discipline (CHOSEN); (C)
  discard the candidates (rejected — they are verifiable in principle,
  the production Worker reaches FRED fine).
- **Reason:** Rule 1 (short sessions — the gates session's scope is the
  display-layer gates) + Rule 5 (financial-data discipline — never
  assume; the candidates can't be verified from the dev sandbox, and an
  unverified ingest is forbidden). The In-build chip retires on the 8
  placed ids' gate pass (BD-S13c) — the fills' absence does not make
  the 8 placed cards "in build." The dedicated fill session carries the
  candidates (BD-S12a's recorded series ids + cross-check publishers).
- **Who decided:** the gates session (S13) under Rule 1 + Rule 5.
  **Revisit:** a dedicated fill session (S14's sibling or a one-off) —
  verify from production egress + the ECB M3 dimension walk, then ingest
  with the full §A discipline; the §21 diff grows to cover the new cards.

## 2026-11-09 — The 2026-11-09e deploy (the Europe gates — Phase E closes; the In-build chip retired live at /europe)

- **What:** the page-division S13 deploy — the Europe gates (BD-S13a/b/c/d)
  over the S12-complete codebase. Display-layer ONLY: no engine, voter,
  threshold, calibration or provider change; the SAME insights snapshot +
  the SAME markets board, zero new fetches, zero new KV. The only
  user-visible change is the In-build chip RETIRED at /europe (BD-S12b's
  completion — the 8 placed ids' gates pass); the EuropePage render audit
  + the Europe budget row are test/build-gate additions (never in the
  bundle's user-visible surface).
- **Gates before the deploy (ALL GREEN):** secret scan 8/977 · typecheck
  6/6 · eslint 0/0 · copy:audit clean (no new fa strings — S13 only
  removed the chip + added a test) · narrator vocabulary in sync + eval
  50 · layer1 11,819/11,819 · the full suite **14,952 = +7** (EuropePage
  render audit) · build + budgets held — entry 270.28/81.87, the Europe
  lazy chunk 10.07/3.06 vs its new 14/5 row.
- **The §21 diff — the S13 gate's own, run LIVE twice (pre-deploy and
  post-deploy): 8 cards · 8 green · 0 red.** The live `pd-s12-backtest.ts`
  against PRODUCTION: the 8 cards' trio inputs byte-identical (page ≡
  engine), the EU/non-EU group membership 6/2 + 8/8 carried, the
  freshness audit honest (btp-bund-spread 100d beyond its 75d monthly
  grace AND carrying the engine's stale status — the page speaks the
  word).
- **The deploy-lock check ran first** (the D-43 lesson): the active
  version was S12's `84833135` @ 100% — no parallel deploy. `pnpm
  --filter @currena/web build` + `wrangler deploy` → **currena-api
  `b11fd84f` @ 100%** (deployment `b11fd84f-7e43-4aa2-a932-66749807d557`,
  2026-11-09 ~03:44Z). currena-markets untouched (code-unchanged).
- **The live acceptance (ALL GREEN):** currena.ir/europe live-smoke-
  verified at 1440×900 en (8 cards · the EU section · the UK section ·
  the zoom · the 3 cross-links · the In-build chip ABSENT · 0px overflow
  · 0 page errors · the live value ecb-dfr 2.50%) + at 360×844 fa (RTL,
  dir=rtl, h1="اروپا", 0px overflow · 0 page errors); the browser pass
  (the freshly built SPA through the local preview server, /api proxied
  to currena.ir) at 1440×900 AND 360×844 in BOTH en and fa — the 8 cards
  (EU=6/UK=2), the zoom (4 STOXX50E/DAX/CAC/FTSE), the 3 cross-links all
  at 44px, the In-build chip ABSENT on all 4 legs, NO horizontal scroll
  at any width in any locale (overflow 0px on all 4 legs), ZERO
  console/page errors across all 4 legs; the Global + Gold + World
  Markets + USA + region + legacy /insights surfaces intact.
- **Rollback:** `wrangler rollback` — /europe returns to the S12 page
  (the 8 placed cards + the In-build chip present); nothing else moves
  (the S13 change is the chip removal + the test/budget additions only).
- **Who decided:** the gates session (S13) under the owner's standing
  delegation ("the deploy at the close is the owner's standing").
  **Revisit:** none needed; the record lives in `docs/DEPLOY.md`
  2026-11-09e.

## 2026-11-09 — BD-S14a: the §15 FRED-only CPI fills for Asia — candidates VERIFIED STALE, discarded (Rule 5; none ingested unverified)

- **Decision:** the three D-36 Asia §15 FRED-only CPI fills (Japan ·
  Korea · India CPI YoY) are NOT ingested in S14. The FRED OECD mirror
  family candidates were probed LIVE against the publisher (Rule 5 —
  FRED was REACHABLE from the dev sandbox this session, unlike the S12
  Europe attempt which hit the JS challenge); the candidates are
  VERIFIED STALE/discontinued, so per Rule 5 (unverifiable as viable
  ongoing sources → discard + record) none is ingested and the
  candidates + the verification status + the alternative sources are
  recorded for the next session.
- **Options considered:**
  (A) Ingest the freshest alternative (the World Bank FP.CPI.TOTL.ZG,
  annual) within S14 — rejected: the spec §15 names the FRED OECD
  mirror family (the monthly cadence the dashboard needs); the World
  Bank series is ANNUAL (a different cadence + a different provider
  than "already integrated"), and the ingest is an engine-layer change
  (definitions.ts + adapter + KV + registry + placement + display +
  copy) that deserves its own focused session with the full AGENTS.md
  §A maintenance discipline.
  (B) Verify-only + record + defer the ingest (CHOSEN) — the §21 diff
  gate is over the 11 placed cards (unaffected); the fill gate ("fills
  verified against publisher releases (Rule 5)") is met by FOLLOWING
  Rule 5 (the candidates are verified STALE — a stronger finding than
  S12's "unverifiable from the sandbox"; no stale data ingested); the
  page ships with the honest "In build" chip (the thin-region
  mitigation the spec §20 names) + the two index-only sections' honest
  notes.
- **Reason:** Rule 5 (financial-data discipline — never assume; fail
  closed). The FRED OECD mirror family for JP/KR/IN CPI is
  discontinued: JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06;
  KORCPIALLMINMEI + CPALTT01KRM659N end 2023-11; INDCPIALLMINMEI +
  CPALTT01INM659N end 2025-03. Ingesting a discontinued series would
  serve STALE data silently — exactly what Rule 5 forbids. The World
  Bank FP.CPI.TOTL.ZG (annual, fresh through 2025) is a viable
  alternative source but a DIFFERENT cadence + provider than the spec
  §15 names; the national statistics bureaus (the Statistics Bureau of
  Japan, KOSTAT, MoSPI) publish fresh monthly CPI but are NOT already-
  integrated providers (would need a new adapter — out of scope for a
  display-layer session).
- **Candidates recorded (verified LIVE 2026-11-09):**
  - Japan CPI YoY — FRED OECD mirror `JPNCPIALLMINMEI` (the OECD MEI
    CPI all items) + `CPALTT01JPM659N` (the OECD CPI all items); BOTH
    end 2021-06 — discontinued. Cross-check publisher: the Statistics
    Bureau of Japan (e-stat.go.jp, CPI monthly, fresh).
  - Korea CPI YoY — FRED OECD mirror `KORCPIALLMINMEI` +
    `CPALTT01KRM659N`; BOTH end 2023-11 — discontinued. Cross-check
    publisher: KOSTAT (kostat.go.kr, CPI monthly, fresh).
  - India CPI YoY — FRED OECD mirror `INDCPIALLMINMEI` +
    `CPALTT01INM659N`; BOTH end 2025-03 — stale (the OECD mirror lags
    ~8 months, likely discontinued). Cross-check publisher: MoSPI
    (mospi.gov.in, CPI monthly, fresh).
  - Alternative source noted: the World Bank `FP.CPI.TOTL.ZG`
    (inflation, consumer prices annual %) is FRESH through 2025 for all
    three (JPN 3.17% · KOR 2.12% · IND 2.40%) — but ANNUAL, not monthly.
- **Who decided:** the build session (S14) under Rule 5. **Revisit:** a
  dedicated fill session (S15's sibling or a one-off) — pick a viable
  monthly source (the national statistics bureaus directly, or a fresh
  FRED/IMF IFS series, or the World Bank annual as a lower-resolution
  fallback), verify from production egress, then ingest with the full
  §A discipline (definitions.ts → registry:generate → placement →
  display → copy → the adapter fetch wiring → CHANGELOG); the §21 diff
  grows to cover the new cards. The chip retires at the S15 gates pass
  on the 11 placed cards (the USA S11 / Europe S13 trajectory — the
  fills' absence does not make the 11 placed cards "in build").

## 2026-11-09 — BD-S14b: the Asia & Pacific page build (the five sub-regions, the zoom, the cross-links, the §21 backtest)

- **Decision:** the Asia & Pacific page ships as its own lazy chunk
  (the UsaPage/EuropePage pattern) — the five sub-regions organized by
  sub-region NOT by theme (D-35): China (§9 item 1: china-pmi ·
  china-cpi · oecd-cli-cn · gpr-china · gpr-taiwan · china-property-
  investment · china-steel-output, 7 cards) · Japan (§9 item 2: jgb-10y
  · boj-rate, 2 cards) · Korea/Taiwan/HK (§9 item 3: INDEX-ONLY today —
  KOSPI · TAIEX · HSI ride the zoom; the Korea CPI fill is verified-
  pending-ingest, Rule 5 — BD-S14a) · India (§9 item 4: INDEX-ONLY
  today — NIFTY50 rides the zoom; the India CPI fill is verified-
  pending-ingest) · Pacific New Zealand (§9 item 5: nz-short-rate ·
  nz-10y, 2 cards) = 11 placed cards, each with the §21 trio (value ·
  10-year position · freshness) through the pure asia-tiles (pinned
  output-for-output against config/display.ts's formatReadingValue by
  asia-tiles.test.ts, the S9 usa-tiles / S12 europe-tiles pattern);
  the S8 zoom section on top (RegionIndexSection region='asia' — the
  N225 · KOSPI · HSI · SSEC · TAIEX · NIFTY50 zoom already renders it;
  the page's own layers seat under it); the cross-links strip (§9:
  usdcny · usdjpy → /currencies + sge-gold → /gold). The honest "In
  build" chip stays (BD-S14a — the §15 CPI fills are verified-pending-
  ingest; the two index-only sections honestly note their fills are
  pending).
- **china-steel-output's tonnes+scale:** the ONE Asia id beyond
  Europe's three-unit lean render — the NBS's own 10,000-ton unit
  scaled to millions of tonnes (1e-2 → 73.6 m tonnes). The
  AsiaCardDisplayConfig carries an optional `scale` field; the
  asiaCardValueText render applies it before formatting, pinned
  output-for-output against formatReadingValue over all four unit
  families (percent · points · index · tonnes) × both locales.
- **The two index-only sections:** Korea/Taiwan/HK + India render an
  HONEST note (never an empty card grid) — their markets ride the zoom
  map above, and the §15 CPI fills are verified-pending-ingest (Rule 5).
  The spec §20 "pages labelled 'growing' honestly" mitigation.
- **The §21 backtest:** asia-backtest-core.ts (the page ≡ engine trio
  diff over the 11 cards, reusing S11's pure auditUsaFreshness for the
  freshness audit — one audit function, no logic drift) +
  asia-backtest.test.ts (11 tests: the GREEN path, the public-mode
  twin, four FAIL-CLOSED proofs, the stableStringify immunity, + the
  freshness audit's own cases on Asia's cadences — jgb-10y daily maxAge
  4, china-pmi monthly maxAge 45, boj-rate monthly maxAge 75 the
  honest-stale path; Asia has NO per-change id, unlike Europe's
  boe-rate) + the live pd-s14-backtest.ts script. The copy pins:
  asia-copy-pin.test.ts (the 11 card names + units + position/band/
  status words ↔ the corpus, both locales) + the 47 new pd.asiaPacific.*
  fa strings queued unreviewed in the manifest (the S9/S10/S12 pattern).
- **Reason:** the spec §9 (D-35 sub-region split, §9 items 1–6); the
  S14 scope (the session prompt); the UsaPage/EuropePage pattern (the
  S9/S10/S12 display-layer discipline — pure tiles, the §21 trio, the
  copy pins, the live backtest).
- **Who decided:** the build session (S14). **Revisit:** S15 (the Asia
  gates session) — the fill verification (a viable monthly source) +
  the card-render audit + the freshness + the mobile/ARIA pass + the
  In-build chip retirement (when the fills land OR the gates pass on
  the 11 placed cards, the USA S11 / Europe S13 trajectory).

## 2026-11-09 — BD-S15a: the Asia card-render audit + the live §21 diff as the session's own gate (the S11 UsaPage.test.tsx / S13 EuropePage.test.tsx pattern mirrored for Asia)

- **Decision:** the S15 Asia gates session re-audits the Asia page's
  DOM-level render audit (`AsiaPage.test.tsx`, 7 tests — the
  `UsaPage.test.tsx` / `EuropePage.test.tsx` pattern scoped to Asia's
  11 placed cards, ALREADY in place from S14) as the session's own gate,
  AND re-runs the live §21 diff (`pd-s14-backtest.ts`) as the session's
  own gate. The render audit pins: the shell (title + purpose + data-
  as-of, the In-build chip ABSENT — BD-S15c's retirement), the S8 zoom
  on top through every state (6 N225/KOSPI/HSI/SSEC/TAIEX/NIFTY50 cards),
  the China section (7) + the Japan section (2) + the two index-only
  sections (Korea/Taiwan/HK, India — honest notes, never empty grids) +
  the Pacific-NZ section (2), the 11 cards in placement order with the
  §21 trio (value · 10-year position · freshness — the percent/points/
  index/tonnes joins, including china-steel-output's scale 1e-2 → 73.6 m
  tonnes), the cross-links (3, 44px → /currencies + /gold), the fail-
  closed paths (an absent card → "Cannot read yet"; a dead projection →
  the error state + retry; the M-17 last-good cached paint), and the
  fa/RTL rendering. The live `pd-s14-backtest.ts` re-run against
  PRODUCTION twice (pre-deploy and post-deploy): 11 cards · 11 green ·
  0 red (page ≡ engine byte-for-byte), the placement group membership
  china 7 / japan 2 / korea-taiwan-hk 0 index-only / india 0 index-only
  / pacific-nz 2 + 11/11 carried, the freshness audit honest (all 11
  within cadence grace — Asia has NO honest-stale path to exercise,
  unlike Europe's btp-bund-spread).
- **Options considered:** (A) rely on the S14 §21 trio diff alone (the
  11-card byte-identical check — correct but unpinned at the DOM level;
  a render regression like a missing section or a chip that didn't
  retire would not surface); (B) re-audit the DOM render audit + re-run
  the live §21 diff as the session's own gate (the S11/S13 pattern);
  (C) a full Playwright visual suite (heavier than the gates session
  needs — the DOM characterization + the 4-leg browser pass is the §21
  discipline).
- **Reason:** B — the §21 "card-render audit vs the placement table" is
  a gate, and the S11/S13 pattern (the render audit + the live diff re-
  audited) is the established way to pin it. The render audit catches
  display-layer regressions the trio-diff can't (a dropped section, a
  broken link, a chip that didn't retire — exactly the BD-S15c
  retirement the S15 audit now PINS chip-ABSENT on); the live diff re-
  confirms the page ≡ engine byte-for-byte. Both ran green (pre- and
  post-deploy).
- **Who decided:** the gates session (S15). **Revisit:** if the Asia
  page gains a layer (the §15 fill cards when they land), the render
  audit grows the new cards' assertions.

## 2026-11-09 — BD-S15b: the Asia mobile/ARIA pass — the 44px touch targets, the section-heading semantics, the RTL flow (pinned + browser-verified)

- **Decision:** the S15 mobile/ARIA pass on /asia-pacific (spec §18
  D-48's "touch targets ≥ 44px" + the WAI-ARIA disclosure pattern + the
  RTL flow) is VERIFICATION + the pin: the cross-link cards already
  carry `min-h-[44px]` (S14 applied the S11/S13 lessons when it built
  the page), the section headings already carry the `<section
  aria-label>` + `<h2>` semantics (the established USA/Europe pattern —
  `<article>` + `<h4>` for cards), and the RTL flow already rides the
  logical CSS + the `<bdi dir>` joins. The render audit (BD-S15a) PINS
  the 44px touch target on every cross-link, the section semantics, and
  the fa/RTL rendering; the 4-leg browser pass (en/fa × 1440/360,
  pre-deploy over the freshly built SPA + post-deploy on the live
  currena.ir) confirmed all green (chip ABSENT, 11 cards, the zoom (6),
  the 5 sections, the 3 cross-links @ 44px, overflow 0px, 0 page errors
  on every leg; the fa legs dir=rtl, h1="آسیا و اقیانوسیه", Persian
  digits).
- **Options considered:** (A) leave the compliance unpinned (the S14
  state — compliant but a future refactor could regress without a
  test); (B) pin the compliance in the render audit + verify in the
  browser (the S11/S13 pattern); (C) add new ARIA attributes the page
  doesn't need (a disclosure pattern Asia has no toggle for).
- **Reason:** B — the S11 gates session pinned the USA ARIA compliance
  the same way (the render audit asserts the 44px + the disclosure);
  Asia has no Show-all toggle and no period switch of its own (the
  zoom's period switch inherited S11's 44px fix globally), so the pass
  is the cross-link 44px + the section semantics + the RTL flow, all
  already compliant — the pin keeps them green. No code change was
  needed (the S14 build carried the S11/S13 lessons); the pass is the
  verification + the pin, exactly the honest result.
- **Who decided:** the gates session (S15). **Revisit:** if the Asia
  page gains a toggle/disclosure (e.g., a future Show-all for the fill
  cards), it carries aria-controls (the S11 TicSection pattern).

## 2026-11-09 — BD-S15c: the In-build chip retired + the Asia budget row tightened (BD-S14b's completion)

- **Decision:** the Asia page's honest "In build" status chip is
  RETIRED from the heading block (BD-S14b's completion — S15's gates
  passed: the §21 card audit 11/11 green, the freshness audit honest,
  the mobile/ARIA polish landed). The page's 11 placed cards are
  complete and verified; no honest "in build" claim remains. The
  `pd.statusBuilding` key stays in both dictionaries — `RegionPage`
  (Australia, the not-yet-built region page) and `PagePlaceholder`
  (Commodities/Currencies) still carry the honest chip for their own
  in-build state. The Asia budget row's COMMENT is tightened (the S13
  Europe pattern): the 16/6 ceiling holds (room for the §15 FRED-only
  fill cards when a later session verifies + ingests them); the chip
  removal shaved ~0.28kB raw (the measured chunk 12.47/3.47 → 12.19/
  3.37 — the few bytes of the `<span>` + its classes).
- **Options considered:** (A) keep the chip until the §15 fills land
  (the page is "honestly still growing"); (B) retire the chip on the
  gates pass (the 11 placed cards are complete; the fills are a
  separate engine-layer change); (C) retire the key entirely (would
  break the other placeholder pages).
- **Reason:** B — the 11 placed ids' gates pass (§21 diff 11/11 green,
  freshness honest, mobile/ARIA green), exactly the USA S11 / Europe
  S13 trajectory (build-session chip → gates-session retirement on the
  gates pass). The §15 fills stay verified-pending-ingest (Rule 5 —
  BD-S15d): they are an ENGINE-layer change (definitions.ts →
  registry:generate → placement → display → copy → adapter fetch
  wiring) that deserves its own focused session, and their absence does
  not make the 11 placed cards "in build" — the page as it stands is
  complete and verified. Keeping the chip after its gate passed would
  be DISHONEST in the other direction (claiming in-build when the 11
  placed cards are verified complete). The budget ceiling stays 16/6
  (the S13 Europe pattern — the ceiling is not re-based down so a
  future fill-session has the same room the S14 row gave it).
- **Who decided:** the gates session (S15). **Revisit:** if the Asia
  page gains a new layer (the §15 fill cards), the chip does NOT return
  — the page is live and verified; the new cards ship when they're
  ready, not under an in-build banner. Bump the 16/6 budget if the
  fills push the chunk past it (with a changelog justification, never
  silently).

## 2026-11-09 — BD-S15d: the §15 FRED-only CPI fills carried forward (verified-pending-ingest — Rule 5; the ingest is engine-layer, a dedicated session)

- **Decision:** S15 (the Asia gates session) does NOT ingest the
  three D-36 Asia §15 FRED-only CPI fills (Japan · Korea · India CPI
  YoY). The candidates stay verified-pending-ingest (Rule 5 — BD-S14a:
  the FRED OECD mirror family is VERIFIED STALE/discontinued —
  JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06; KORCPIALLMINMEI +
  CPALTT01KRM659N end 2023-11; INDCPIALLMINMEI + CPALTT01INM659N end
  2025-03). S15's scope is the display-layer gates (the card-render
  audit, the freshness, the mobile/ARIA pass, the In-build chip
  retirement); the ingest is an ENGINE-layer change (definitions.ts →
  registry:generate → placement → display → copy → the adapter fetch
  wiring → CHANGELOG) that the BD-S14a decision explicitly said
  "deserves its own focused session with the full AGENTS.md §A
  maintenance discipline."
- **Options considered:** (A) ingest the fills in S15 (the gates
  session — would bloat the session past its short-session scope (Rule
  1) AND the viable-source pick needs its own verification (the FRED
  OECD mirror family is discontinued; a viable monthly source must be
  picked: the national statistics bureaus directly (the Statistics
  Bureau of Japan, KOSTAT, MoSPI), a fresh FRED/IMF IFS series, or the
  World Bank FP.CPI.TOTL.ZG annual as a lower-resolution fallback));
  (B) carry the fills forward to a dedicated fill session that picks a
  viable monthly source + verifies from production egress + ingests
  with the full §A discipline (CHOSEN); (C) discard the candidates
  (rejected — the national bureaus publish fresh monthly CPI; the
  candidates are verifiable in principle, the FRED OECD mirror was the
  stale leg).
- **Reason:** Rule 1 (short sessions — the gates session's scope is the
  display-layer gates) + Rule 5 (financial-data discipline — never
  assume; the FRED OECD mirror is discontinued, and a viable
  replacement source must be verified live before an adapter merges
  it). The In-build chip retires on the 11 placed ids' gate pass
  (BD-S15c) — the fills' absence does not make the 11 placed cards "in
  build." The dedicated fill session carries the candidate sources
  (BD-S14a's recorded FRED OECD mirror verification + the three
  alternative sources: the national statistics bureaus, a fresh FRED/IMF
  IFS series, the World Bank annual).
- **Who decided:** the gates session (S15) under Rule 1 + Rule 5.
  **Revisit:** a dedicated fill session (S16's sibling or a one-off) —
  pick a viable monthly source (the national statistics bureaus
  directly, or a fresh FRED/IMF IFS series, or the World Bank annual as
  a lower-resolution fallback), verify from production egress, then
  ingest with the full §A discipline; the §21 diff grows to cover the
  new cards.

## 2026-11-09 — The 2026-11-09g deploy (the Asia gates — Phase F closes; the In-build chip retired live at /asia-pacific)

- **What:** the page-division S15 deploy — the Asia gates (BD-S15a/b/c/d)
  over the S14-complete codebase. Display-layer ONLY: no engine, voter,
  threshold, calibration or provider change; the SAME insights snapshot
  + the SAME markets board, zero new fetches, zero new KV. The only
  user-visible change is the In-build chip RETIRED at /asia-pacific
  (BD-S14b's completion — the 11 placed ids' gates pass); the AsiaPage
  render audit's chip-ABSENT assertion is a test-gate addition (never in
  the bundle's user-visible surface).
- **Gates before the deploy (ALL GREEN):** secret scan 8/986 · typecheck
  6/6 · eslint 0/0 · copy:audit clean (no new fa strings — S15 only
  removed the chip + flipped the test assertion + tightened the budget
  comment) · narrator vocabulary in sync + eval 50 · layer1
  11,819/11,819 · the full suite **14,985** (unchanged from S14 — the
  test count is the same; the assertions changed) · build + budgets
  held — entry 270.48/81.91, the Asia lazy chunk 12.19/3.37 vs its 16/6
  row (the chip removal shaved ~0.28kB raw).
- **The §21 diff — the S15 gate's own, run LIVE twice (pre-deploy and
  post-deploy): 11 cards · 11 green · 0 red.** The live `pd-s14-backtest.ts`
  against PRODUCTION: the 11 cards' trio inputs byte-identical (page ≡
  engine — china-pmi 49.3 warning · china-cpi 0.9 normal · oecd-cli-cn
  97.41 context · gpr-china 0.84 context · gpr-taiwan 0.08 context ·
  china-property-investment -20.6 context · china-steel-output 7359
  context · jgb-10y 2.696 context · boj-rate 1.043 context ·
  nz-short-rate 3.25 context · nz-10y 4.94 context), the placement
  group membership china 7 / japan 2 / korea-taiwan-hk 0 index-only /
  india 0 index-only / pacific-nz 2 + 11/11 carried, the freshness
  audit honest (all 11 within cadence grace — no honest-stale path,
  unlike Europe's btp-bund-spread), the two feeds one snapshot
  (generatedAt aligned).
- **The deploy-lock check ran first** (the D-43 lesson): the active
  version was S14's `68281479` @ 100% — no parallel deploy. `pnpm
  --filter @currena/web build` + `wrangler deploy` → **currena-api
  `6f96cd9a` @ 100%** (deployment `3ff880ea`, version
  `6f96cd9a-1dee-4611-9309-9872322fd584`, 2026-11-09 ~13:56Z; SITE_MODE
  =public, the RATES KV + AI + ASSETS bindings intact). currena-markets
  untouched (code-unchanged).
- **The live acceptance (ALL GREEN):** the live `pd-s14-backtest.ts`
  re-run post-deploy 11/11 green; currena.ir/asia-pacific live-smoke-
  verified at 1440×900 en (11 cards · the China section · the Japan
  section · the 2 index-only sections · the Pacific-NZ section · the
  zoom (6) · the 3 cross-links @ 44px · the In-build chip ABSENT · 0px
  overflow · 0 page errors · the live value china-pmi "49.3 index") +
  at 360×844 fa (RTL, dir=rtl, h1="آسیا و اقیانوسیه", the live value
  china-pmi "۴۹٫۳ به‌صورت شاخص", 0px overflow · 0 page errors); the
  pre-deploy 4-leg browser pass (the freshly built SPA through the
  local preview server, /api proxied to currena.ir) at 1440×900 AND
  360×844 in BOTH en and fa — the 11 cards (China=7/Japan=2/NZ=2), the
  zoom (6 N225/KOSPI/HSI/SSEC/TAIEX/NIFTY50), the 5 sections (3 card +
  2 index-only), the 3 cross-links all at 44px, the In-build chip
  ABSENT on all 4 legs, NO horizontal scroll at any width in any locale
  (overflow 0px on all 4 legs), ZERO console/page errors across all 4
  legs; the fa legs dir=rtl + Persian digits (۴۹٫۳ به‌صورت شاخص ·
  ۷۳٫۶ میلیون تن · ۲٫۷۰٪); the Global + Gold + World Markets + USA +
  Europe + Australia + legacy /insights surfaces intact.
- **Rollback:** `wrangler rollback` — /asia-pacific returns to the S14
  page (the 11 placed cards + the In-build chip present); nothing else
  moves (the S15 change is the chip removal + the test assertion flip +
  the budget comment only).
- **Who decided:** the gates session (S15) under the owner's standing
  delegation ("the deploy at the close is the owner's standing").
  **Revisit:** none needed; the record lives in `docs/DEPLOY.md`
  2026-11-09g.

## 2026-11-10 — BD-S16a: the §21 Australia backtest — the pure australia-backtest-core reusing S11's auditUsaFreshness over AUSTRALIA_CARD_IDS (28 cards) + the offline suite (11 tests) + the live pd-s16-backtest.ts (the S14 asia pattern mirrored)

- **Decision:** the S16 Australia build & gates session ships the §21
  backtest for Australia: the pure `australia-backtest-core.ts`
  reusing S11's `auditUsaFreshness` over `AUSTRALIA_CARD_IDS` (28
  cards — the 5-gauge structure D-37: au-inflation-rates 6 ·
  au-households 11 · au-trade-currency 2 · au-activity 7 (shadow) ·
  au-external 1 (shadow) + gpr-australia = 28), the offline suite
  (11 tests — the full pipeline + the public-mode twin + the 4 fail-
  closed proofs [an absent card → "Cannot read yet"; a dead projection
  → the error state + retry; the M-17 last-good cached paint; the
  public-mode twin over the same input] + the key-order immunity + the
  4 freshness cases), and the live `pd-s16-backtest.ts` (the S14
  `pd-s14-backtest.ts` asia pattern mirrored — fetches the production
  /api/insights/pages/australia + the markets board, runs the trio
  audit + the freshness audit). The live run vs production (pre-
  deploy): 28/28 cards green (page ≡ engine byte-for-byte), the 6-group
  membership green (inflation-rates 6/6 · households 11/11 · trade-
  currency 2/2 · activity 7/7 · external 1/1 · world-risk 1/1 = 28
  cards; 11 moved-out disjoint), the freshness audit HONEST (19
  within grace + 7 beyond grace all honestly flagged — BD-S16d).
- **Options considered:** (A) rely on the render audit + the trio diff
  alone (correct but the trio diff unpinned at the byte level — S11's
  lesson was that a regression like a missing card or a stale-unflagged
  reading could slip); (B) ship the pure core + the offline suite +
  the live runner (the S11 USA / S14 Asia pattern — CHOSEN); (C) a
  full Playwright visual suite (heavier than the gates session needs).
- **Reason:** B — the §21 "card-render audit vs the placement table"
  is a gate, and the S11/S14 pattern (the pure core reused over the
  page's CARD_IDS + the offline suite + the live runner re-audited
  pre/post-deploy) is the established way to pin it. The live runner
  catches the page ≡ engine byte-identity; the offline suite pins the
  fail-closed + key-order + freshness paths; both ran green (pre-
  deploy; post-deploy pending the close-out).
- **Who decided:** the build & gates session (S16). **Revisit:** if
  the Australia page gains a layer (a §15 fill card when it lands),
  the AU CARD_IDS grow + the §21 diff grows with them.

## 2026-11-10 — BD-S16b: the AustraliaPage render audit — the S15 AsiaPage.test.tsx pattern scoped to Australia's 28 cards (7 tests)

- **Decision:** the S16 render audit (`AustraliaPage.test.tsx`, 7 tests
  — the S11 UsaPage.test.tsx / S13 EuropePage.test.tsx / S15
  AsiaPage.test.tsx pattern scoped to Australia's 28 cards): fixture
  sanity (the projection's 28 ids + the §21 trio inputs match the
  placement table) + loading (the skeleton renders before the
  projection resolves) + the full shell+zoom+board+5-gauges+world-risk
  render with the §21 trio spot checks (the value · 10-year position ·
  freshness joins over the percent/points/index families) + the 11
  moved-out seat chips at 44px resolving to /currencies + /asia-
  pacific + /commodities + /gold + the fail-closed absent (an absent
  card → "Cannot read yet") + the fail-closed dead-projection (a dead
  projection → the error state + retry, the M-17 last-good cached
  paint) + the fa/RTL Persian rendering (dir=rtl + Persian digits).
  The In-build chip is asserted ABSENT (BD-S16c's retirement, the
  EuropePage S13 / AsiaPage S15 pattern mirrored).
- **Options considered:** (A) rely on the §21 trio diff alone (no DOM
  pin — a render regression like a missing gauge or a chip that
  didn't retire would not surface); (B) ship the render audit (the
  S11/S13/S15 pattern — CHOSEN); (C) a full Playwright visual suite
  (heavier than needed).
- **Reason:** B — the render audit catches display-layer regressions
  the trio-diff can't (a dropped gauge, a broken seat-chip link, a
  chip that didn't retire — exactly the BD-S16c retirement the audit
  now PINS chip-ABSENT on). Both the render audit + the live §21 diff
  ran green (the render audit 7/7, the live §21 diff 28/28 pre-deploy).
- **Who decided:** the build & gates session (S16). **Revisit:** if
  the Australia page gains a layer (a §15 fill card), the audit grows
  the new cards' assertions.

## 2026-11-10 — BD-S16c: the In-build chip RETIRED at the S16 gates pass — the S13 Europe / S15 Asia trajectory (BD-S15c mirrored); the AustraliaPage chunk shrank 22.76→22.48 / 5.92→5.82

- **Decision:** the Australia page's honest "In build" status chip is
  RETIRED from the heading block (the 28 placed ids' gates pass — §21
  card audit 28/28 green, the freshness audit honest, the mobile/ARIA
  pass pinned). The page's 28 placed cards are complete and verified;
  no honest "in build" claim remains. The `pd.statusBuilding` key
  stays in both dictionaries — `PagePlaceholder` (Commodities/
  Currencies) still carries the honest chip for its own in-build
  state; `RegionPage` was DELETED in M2 (the Australia page is its own
  build now, not a region placeholder). The AustraliaPage chunk
  shrank 22.76→22.48 raw / 5.92→5.82 gzip (the chip removal's few
  bytes — the `<span>` + its classes). The 26/7 budget ceiling holds
  (the S13/S15 pattern — not re-based down so a future fill-session
  has the same room).
- **Options considered:** (A) keep the chip until the §15 Asia fills
  land (the page is "honestly still growing" — but the §15 fills are
  Asia's, not Australia's, and Australia's 28 placed ids are
  complete); (B) retire the chip on the gates pass (the 28 placed ids'
  gates pass — the USA S11 / Europe S13 / Asia S15 trajectory,
  CHOSEN); (C) retire the key entirely (would break PagePlaceholder).
- **Reason:** B — the 28 placed ids' gates pass (§21 diff 28/28 green,
  freshness honest, mobile/ARIA green), exactly the USA S11 / Europe
  S13 / Asia S15 trajectory (build-session chip → gates-session
  retirement on the gates pass). Keeping the chip after its gate
  passed would be DISHONEST (claiming in-build when the 28 placed
  cards are verified complete). The `pd.statusBuilding` key stays for
  PagePlaceholder; `RegionPage` was deleted in M2 (the Australia page
  is its own build now).
- **Who decided:** the build & gates session (S16). **Revisit:** if
  the Australia page gains a new layer (a §15 fill card), the chip
  does NOT return — the page is live and verified; the new card ships
  when it's ready, not under an in-build banner. Bump the 26/7 budget
  if the fill pushes the chunk past it (with a changelog
  justification, never silently).

## 2026-11-10 — BD-S16d: the freshness honest-stale finding — 7 AU cards beyond cadence grace, ALL 7 honestly carrying the engine's stale status (0 unflagged); the AU per-change ids ride the exempt path (the S11 freshness-audit formalization mirrored, with the AU honest-stale path EXERCISED unlike Asia's)

- **Decision:** the S16 freshness audit (the pure `auditUsaFreshness`
  over `AUSTRALIA_CARD_IDS`, reusing S11's formalization — already
  wired in the `australia-backtest-core.ts` + the offline suite; S16
  runs it live as a gate via the live `pd-s16-backtest.ts`) found 7 AU
  cards BEYOND cadence grace, ALL 7 honestly carrying the engine's
  stale status (0 unflagged): au-unemployment 69d>60d · terms-of-trade
  222d>215d · au-gdp-growth 222d>215d · au-population-growth
  312d>270d · au-participation 69d>60d · au-underemployment 69d>60d ·
  au-nom 312d>270d. The remaining 19 AU cards are within cadence
  grace. The AU per-change ids (rba-cash-rate · rba-fed-gap) ride the
  exempt path (no cadence grace window to violate — they're change
  readings, not point-in-time readings). The freshness audit is
  HONEST (the engine flags the 7 stale, the page renders the stale
  flag, the §21 trio carries the freshness status byte-identically
  page ≡ engine). This MIRRORS the S11 freshness-audit formalization
  and EXERCISES the honest-stale path that Asia's 11 cards (all
  within grace) did NOT — the Australia page is the first page with a
  material honest-stale surface (the cadence gaps in the AU national-
  accounts data are real, the engine reports them honestly).
- **Options considered:** (A) suppress the stale flags on the 7 cards
  (DISHONEST — would hide the cadence gaps from the visitor);
  (B) report the stale flags honestly + pin the honesty in the §21
  backtest (the S11 pattern, CHOSEN); (C) re-ingest the 7 stale cards
  from a fresh source (out of S16's display-layer scope — an ENGINE-
  layer change that deserves its own focused session, like the §15
  Asia fills).
- **Reason:** B — Rule 5 (financial-data discipline — never assume;
  the cadence gaps are real, the engine reports them honestly, the
  page renders them honestly). The §21 trio carries the freshness
  status byte-identically page ≡ engine; the live §21 diff 28/28
  green confirms it. A dedicated fill session (the §15 Asia fills'
  sibling) picks fresh sources for the 7 stale AU cards if the owner
  wants them fresher; their current stale-honest state does not make
  the 28 placed cards "in build" — the chip retires on the gates
  pass (BD-S16c).
- **Who decided:** the build & gates session (S16) under Rule 5.
  **Revisit:** a dedicated AU fill session if the owner wants the 7
  stale cards fresher — pick viable monthly/quarterly sources,
  verify from production egress, ingest with the full §A discipline;
  the §21 diff grows to cover the new readings. The honest-stale
  state is the verified current state until then.

## 2026-11-10 — BD-S16-deploy: the S16 deploy record — DEPLOYED LIVE (worker `9d60726b` @ 100%, the owner's standing)

- **Deploy record:** S16 deployed live as the currena-api worker version
  `9d60726b` @ 100% (the owner's standing — the deploy-lock check
  skipped: no deploy-lock script in the repo; the web build green
  [AustraliaPage chunk 21.95 KiB]; the deploy uploaded 48 assets, 95
  already on CDN; the worker startup 47ms; production moved `6f96cd9a`
  → `9d60726b`). The post-deploy §21 backtest 28/28 green; the browser
  pass 4/4 green; the In-build chip ABSENT on all 4 legs; the rollback
  lever `npx wrangler rollback` from apps/api if needed. Display-layer
  ONLY: no engine, voter, threshold, calibration or provider change;
  the SAME insights snapshot + the SAME markets board, zero new
  fetches, zero new KV. The user-visible change: /australia went from
  the S8 RegionPage placeholder (the honest In-build chip) to the full
  Australia build (the REUSED AU Markets board + the 5-gauge structure
  D-37 + the 28 cards with the §21 trio + the 11 moved-out seat chips
  → their new homes); the In-build chip RETIRED (BD-S16c).
- **Gates before the deploy (ALL GREEN, 2m 35s):** secret scan 8/994
  · typecheck 6/6 · eslint 0/0 · copy:audit clean · narrator
  vocabulary in sync + eval 50 · layer1 11,819/11,819 · **the full
  suite 15,019** · build + budgets held — entry 270.42/81.88, the
  AustraliaPage lazy chunk 22.48/5.82 vs its 26/7 row (the chip
  retirement shaved ~0.28kB raw).
- **The §21 diff — the S16 gate's own, run LIVE pre-deploy: 28 cards
  · 28 green · 0 red.** The live `pd-s16-backtest.ts` against
  PRODUCTION: the 28 cards' trio inputs byte-identical (page ≡
  engine), the 6-group membership green (inflation-rates 6 ·
  households 11 · trade-currency 2 · activity 7 · external 1 ·
  world-risk 1 = 28), the freshness audit HONEST (19 within grace +
  7 beyond grace all honestly stale-flagged — BD-S16d), the two
  feeds one snapshot (generatedAt aligned).
- **Close-out steps (all RUN, all GREEN):** (1) the browser pass —
  1440×900 + 360×844 in en + fa, the freshly built SPA through the
  local preview server, /api proxied to currena.ir, over the REAL
  production data (28 cards · the 6 sections · the zoom · the AU
  Markets board · the 11 seat chips @ 44px · the In-build chip
  ABSENT · 0px overflow · 0 page errors on every leg; the fa legs
  dir=rtl + Persian digits) — 4/4 GREEN; (2) the deploy —
  `pnpm --filter @currena/api deploy` under the owner's standing
  delegation — worker `9d60726b` @ 100% (the prior active version was
  S15's `6f96cd9a` @ 100%); (3) the post-deploy live §21 re-verify —
  the live `pd-s16-backtest.ts` re-run against production 28/28 green
  + currena.ir/australia live-smoke-verified (HTTP 200 + 33 readings
  + boards markets-au).
- **Rollback:** `npx wrangler rollback` from apps/api — /australia
  returns to the prior surface (`6f96cd9a`, S15 — the S8 RegionPage
  placeholder with the honest In-build chip present); nothing else
  moves (the S16 change is the /australia page build + the §21
  backtest + the render audit + the chip retirement only).
- **Who decided:** the build & gates session (S16) under the owner's
  standing delegation ("the deploy at the close is the owner's
  standing") — the deploy ran 2026-11-10 ~20:30 UTC. **Revisit:** the
  deploy record is final; the full deploy narrative lives in
  `docs/DEPLOY.md`.

## 2026-11-11 — BD-S17a: the §21 Commodities backtest — the pure commodities-backtest-core reusing S11's auditUsaFreshness over COMMODITIES_CARD_IDS (24 cards) + the offline suite (11 tests) + the live pd-s17-backtest.ts (the S16 australia pattern mirrored)

- **Decision:** the S17 §21 diff is the pure `commodities-backtest-core.ts`
  reusing S11's `auditUsaFreshness` over `COMMODITIES_CARD_IDS` (24 cards —
  the 4 commodity groups + the supply group: energy 9 · metals 4 ·
  agriculture 3 · digital 2 · trade-routes-supply 6) + the offline suite
  (`commodities-backtest.test.ts`, 11 tests: the full pipeline + the
  public-mode twin + the 4 fail-closed proofs + the key-order immunity +
  the 4 freshness cases — the honest-stale path over iron-ore monthly
  maxAge 60) + the live `pd-s17-backtest.ts` (the S16 `pd-s16-backtest.ts`
  pattern mirrored). The live run vs production (pre- AND post-deploy):
  24/24 cards green (page ≡ engine byte-for-byte), the 5-group membership
  green (energy 9/9 · metals 4/4 · agriculture 3/3 · digital 2/2 ·
  trade-routes-supply 6/6 = 24 cards), the freshness audit honest (24
  within grace, 0 beyond — all fresh).
- **Options considered:** (a) a Commodities-specific freshness function
  (rejected — logic drift from the USA/Europe/Asia/Australia gates); (b)
  reusing S11's `auditUsaFreshness` (chosen — one audit function, no logic
  drift, the S12/S14/S16 pattern).
- **Reason:** spec §21's "verdict consistency" + "data audit" legs, applied
  to the 24 commodity cards. The §21 trio (value · 10-year position ·
  freshness) is the per-page gate; the freshness audit rides the same
  pure function the other gates read.
- **Who decided:** the build & gates session (S17). **Revisit:** the
  backtest is final; a future fill-session that adds commodity ids grows
  the `COMMODITIES_CARD_IDS` list + the offline suite.

## 2026-11-11 — BD-S17b: the CommoditiesPage render audit — the S16 AustraliaPage.test.tsx pattern scoped to Commodities' 24 cards (7 tests)

- **Decision:** `CommoditiesPage.test.tsx` (7 tests — the S16
  AustraliaPage.test.tsx pattern, scoped to Commodities' 24 cards):
  fixture sanity + the loading line + the full shell + 5-sections +
  24-cards + gold-cross-link render with the §21 trio spot checks (the
  usd prefix 'US$73.45' · the barrels '416.7 m barrels' · the
  barrels-per-day '13.99 m barrels a day' · the transits '65.3 transits
  a day' · the index '121.3 index') + the gold link click-nav to /gold at
  44px + the fail-closed absent + the fail-closed dead-projection + the
  M-17 last-good + the fa/RTL Persian rendering (h1='کالاها و انرژی' ·
  brent='۷۳٫۴۵ دلار' · suez='۶۵٫۳ تردد در روز' · dir=rtl). The In-build
  chip is asserted ABSENT (BD-S17c's retirement, the S16 trajectory).
- **Reason:** spec §21's "every page: all listed cards render with value,
  10-year position, and freshness" + the mobile/ARIA pass (spec §18 D-48:
  touch targets ≥ 44px). The render audit is the DOM-level pin the browser
  pass re-verifies live.
- **Who decided:** the build & gates session (S17). **Revisit:** the
  render audit is final; a future fill-session that adds cards grows the
  spot checks.

## 2026-11-11 — BD-S17c: the In-build chip RETIRED at the S17 gates pass — the S13 Europe / S15 Asia / S16 Australia trajectory (BD-S16c mirrored); the CommoditiesPage chunk measured 11.93/3.41 vs its 16/5 ceiling (the leanest page-division chunk)

- **Decision:** the Commodities page's honest "In build" chip is REMOVED
  from the heading block — the 24 placed ids' gates pass (§21 card audit
  24/24 green vs production, the freshness audit honest, the render audit
  7/7 green, the browser pass 4/4 green). The page's 24 placed cards are
  complete and verified; no honest "in build" claim remains. The
  `pd.statusBuilding` key stays for `PagePlaceholder` (Currencies — the
  last placeholder). The CommoditiesPage budget row: ceiling 16/5,
  measured 11.93/3.41 (the leanest page-division chunk — no zoom, no
  board, no gauges; not re-based down so a future fill-session has the
  same room).
- **Reason:** BD-S15c/BD-S16c's reasoning: the build and the gates ship
  in ONE session (the roadmap's Phase H is a single S17), so once the
  §21 diff + the freshness audit + the render audit + the browser pass
  are green, keeping the chip would be dishonest in the other direction
  (the page IS built + verified). The S13 Europe / S15 Asia / S16
  Australia retirement trajectory mirrored.
- **Who decided:** the build & gates session (S17). **Revisit:** the
  retirement is final; the chip never returns to /commodities.

## 2026-11-11 — BD-S17-deploy: the S17 deploy record — DEPLOYED LIVE (worker `08e0fc64` @ 100%, the owner's standing)

- **Deploy record:** S17 deployed live as the currena-api worker version
  `08e0fc64` @ 100% (the owner's standing — the deploy-lock check ran
  first: the active version was S16's `9d60726b` @ 100%, no parallel
  deploy; `pnpm --filter @currena/web build` + `pnpm --filter @currena/api
  exec wrangler deploy` → currena-api `08e0fc64` @ 100%; production moved
  `9d60726b` → `08e0fc64`). The post-deploy §21 backtest 24/24 green; the
  browser pass 4/4 green; the In-build chip ABSENT on all 4 legs; the
  rollback lever `npx wrangler rollback` from apps/api if needed.
  Display-layer ONLY: no engine, voter, threshold, calibration or
  provider change; the SAME insights snapshot, zero new fetches, zero
  new KV. The user-visible change: /commodities went from the S1
  PagePlaceholder (the honest In-build chip) to the full Commodities
  build (the 4 commodity groups + the supply group — 24 cards with the
  §21 trio + the gold cross-link to /gold); the In-build chip RETIRED
  (BD-S17c). The 3 seat chips on /australia that link to /commodities
  (iron-ore · coal-aus · lng-japan) now resolve to a real page.
- **Gates before the deploy (ALL GREEN):** typecheck 6/6 · eslint 0/0 ·
  copy:audit clean (exit 0 — the 57 new pd.commodities.* fa entries
  queued unreviewed) · **the full suite 15,053 = +34** (commodities-tiles
  14 · commodities-copy-pin 2 · commodities-backtest 11 · CommoditiesPage
  render audit 7) · build + budgets held — entry 270.69/81.95, the
  CommoditiesPage lazy chunk 11.93/3.41 vs its 16/5 row.
- **The §21 diff — the S17 gate's own, run LIVE twice (pre-deploy and
  post-deploy): 24 cards · 24 green · 0 red.** The live `pd-s17-backtest.ts`
  against PRODUCTION: the 24 cards' trio inputs byte-identical (page ≡
  engine), the 5-group membership green (energy 9 · metals 4 ·
  agriculture 3 · digital 2 · trade-routes-supply 6 = 24), the freshness
  audit honest (24 within grace, 0 beyond — all fresh), the two feeds
  one snapshot (generatedAt aligned), the projection declares NO boards
  (the placement §11 contract — no zoom, no markets board).
- **Close-out steps (all RUN, all GREEN):** (1) the pre-deploy live §21
  diff — 24/24 green; (2) the deploy — worker `08e0fc64` @ 100%; (3) the
  post-deploy live §21 re-verify — 24/24 green; (4) the 4-leg browser
  pass — 1440×900 + 360×844 in en + fa, over the REAL production data
  (24 cards · the 5 sections · the gold cross-link → /gold · the In-build
  chip ABSENT · 0px overflow · 0 page errors on every leg; the fa legs
  dir=rtl + h1='کالاها و انرژی' + Persian digits ['۹۲٫۱۷ دلار' · '۶۵٫۳
  تردد در روز']) — 4/4 GREEN.
- **Rollback:** `npx wrangler rollback` from apps/api — /commodities
  returns to the prior surface (`9d60726b`, S16 — the S1 PagePlaceholder
  with the honest In-build chip); nothing else moves (the S17 change is
  the /commodities page build + the §21 backtest + the render audit + the
  chip retirement + the App.tsx wiring only).
- **Who decided:** the build & gates session (S17) under the owner's
  standing delegation ("the deploy at the close is the owner's standing")
  — the deploy ran 2026-11-11. **Revisit:** the deploy record is final;
  the full deploy narrative lives in `docs/DEPLOY.md`.

## 2026-11-11 — BD-S18a: AUDNZD joins the FX board — the D-42 engine leg (the 11th pair, its own pacificLink group; NZD rides the single Frankfurter request, zero new provider calls)

- **Decision:** the fx engine gains the 11th pair — `audnzd` (D-42: "AUDNZD
  becomes the 11th pair on Currency Pairs"; the roadmap S18 scope's own
  "AUDNZD joins the board"). The change set: `FxPairIdSchema` += 'audnzd'
  (an ADDITIVE wire-contract change — stored pre-S18 snapshots keep
  parsing), `FX_PAIRS` += `{ id: 'audnzd', group: 'pacificLink',
  derivation: 'cross' }` (its OWN fourth group — never shoe-horned into
  the Australia–China block), `FX_PAIR_CURRENCIES = ['NZD']` (the
  pass-through treatment in the job: a miss degrades to the previous
  audnzd row, never a whole-run failure — the CAD/SEK discipline),
  `pairRateFromUsd` += audnzd → NZD÷AUD, the Yahoo fallback's `NZD=X`
  symbol, and the legacy corpus's own words for the new surface
  (fx.groups.pacificLink 'Australia–New Zealand' · fx.entries.audnzd
  {name/what/you} — the name IS the audnzd registry card's name, one
  vocabulary per D-48 — · currencyNames/Plural.NZD, en + fa, all six
  strings queued unreviewed in the Persian-copy manifest). The seven
  RULES, every threshold, the pattern checks and the summary rollup are
  UNTOUCHED (audnzd is not a rule input — the page-division display-layer
  discipline holds; the only engine change is the board's own membership,
  which the roadmap's S18 scope names explicitly).
- **Options considered:** (a) render the 11th pair from the audnzd
  registry reading (rejected — D-42's board fields [rate · d1/m1/m3/y1 ·
  moveRank · bigMove · 52-week closes] are the fx snapshot's own shape;
  the registry reading carries none of them — a second, invented
  derivation); (b) audnzd in the chinaLink group (rejected — wrong
  semantics, and it would rename reviewed copy); (c) its own pacificLink
  group (chosen — the honest block, additive copy only).
- **Verified:** fx.test.ts 51 tests (+1: the audnzd cross derives as
  NZD÷AUD, the absent-NZD leg degrades loudly); the fx-presentation
  corpus anchors extended (11 entries + the group + the NZD names); the
  dry-run fx-run over the LIVE provider computed 11 pairs with ONE
  Frankfurter call (the same single timeseries request — NZD joined the
  symbols list, zero extra calls); the live board post-deploy carries
  the audnzd row (rate 1.22827, asOf 2026-11-09, 52 weekly closes).
- **Who decided:** the build & gates session (S18) under D-42 + the
  roadmap's S18 scope. **Revisit:** none — the pair is permanent; the
  legacy /insights table honestly renders the fourth group block
  ("Australia–New Zealand (1)", verified live).

## 2026-11-11 — BD-S18b: the §21 Currencies backtest — the pure currencies-backtest-core (the 14-card trio diff + the RULES gate + the BOARD gate) + the offline suite (14 tests) + the live pd-s18-backtest.ts

- **Decision:** the S18 §21 diff is the pure `currencies-backtest-core.ts`
  with THREE gates over the page's TWO feeds + the served snapshot: (1)
  the 14 registry cards' trio diff (the S17 pattern — projection ≡
  snapshot on value/range/percentile10y/asOf/status, key-order-immune,
  absent-on-both green, absent-on-one red); (2) the RULES gate ("the
  rules match the FX board KV logic exactly"): the §9.3 status table
  applied row-by-row through the SAME `fxRuleView` the legacy page reads
  + the renderable-domain invariant (every stored state carries a
  headline, the noData word, or is a legitimately silent quiet-R7; an
  undowngraded R3/R4 watch is a display hole, RED) + the stored summary ≡
  the engine's own `summarizeFxRules` recomputed over the stored rules
  (zero tolerance); (3) the BOARD gate ("11 pairs complete"): the D-42
  coverage over FX_PAIR_IDS + the bigMove ≡ moveRank ≥ 90 derivation per
  row + the stale-flag honesty against the asOf age (the FX_STALE_DAYS
  ladder). The freshness audit rides S11's `auditUsaFreshness` over the
  14 cards (the one-audit-function discipline). The offline suite (14
  tests: the full pipeline + the public-mode twin + 7 fail-closed proofs
  + the freshness cases) + the live `pd-s18-backtest.ts` (the pd-s17
  pattern, three feeds).
- **Options considered:** (a) only the card trio diff (rejected — the
  session prompt names the rules + the 11-pairs gates explicitly); (b)
  the full three-gate core (chosen).
- **The live runs:** PRE-deploy — cards 14/14 green · rules 16/16 green ·
  per-row derivations green · the D-42 coverage leg honestly RED (audnzd
  not yet on the live board — the deploy's own to-do, the S16-shaped
  pre-deploy record); POST-deploy (after the fx-run KV seed) — ALL GREEN:
  cards 14/14 · rules 16/16 · board 23/23 (11/11 pairs) · freshness 14
  within grace.
- **Who decided:** the build & gates session (S18). **Revisit:** the
  backtest is final; S20's full-site regression re-runs it.

## 2026-11-11 — BD-S18c: the CurrenciesPage render audit (8 tests) + the In-build chip RETIRED at the S18 gates pass + the budget row (24/6.5)

- **Decision:** `CurrenciesPage.test.tsx` (8 tests — the S17
  CommoditiesPage.test.tsx pattern scoped to Currencies' surfaces):
  fixture sanity + loading + the full shell + 7-rule-lights + 11-pair
  board + 2 card sections render with the §21 trio spot checks (the
  currency prefixes '₺34.56'/'NZ$1.2283' EN · the fa suffixes '۳۴٫۵۶ لیر
  ترکیه'/'۱٫۲۲۸۳ دلار نیوزیلند' · the AED suffix '3.67 AED' · the tight
  percent '56.70%') + every rule-outcome shape (warning + chip · watch ·
  supportive · the downgraded wobble keeping its warning sentence + the
  caution line · nodata · the R7 context lead) + the bigMove tag + the
  stale tag + the fail-closed paths (an absent card · a dead fx feed
  rendering the calm "being prepared" line, never an error · a dead
  projection with retry) + the M-17 last-good path (BOTH feeds cached)
  + the fa/RTL rendering. The In-build chip is RETIRED at the gates pass
  (the S16/S17 one-session trajectory — the render audit asserts it
  ABSENT); the pd.statusBuilding key stays for any future not-yet-built
  destination (PagePlaceholder serves no route today). The
  CurrenciesPage lazy chunk measured 21.09/5.33 vs its new 24/6.5 row
  (the tight convention's ~2.9 kB raw headroom).
- **Who decided:** the build & gates session (S18). **Revisit:** none.

## 2026-11-11 — BD-S18-deploy: the S18 deploy record — DEPLOYED LIVE (currena-api `51a0fe45` + currena-markets `8f63c8fa` + the fx-run KV seed, the owner's standing)

- **Deployed:** BOTH workers, in the schema-safe order — (1) currena-api
  `51a0fe45` (the new SPA + the FxSnapshotSchema that accepts both the
  10-pair and 11-pair stored documents) — the deploy-lock check ran first
  (S17's `08e0fc64` @ 100%, no parallel deploy); (2) currena-markets
  `8f63c8fa` (the fx engine's new pair rides its four crons — the first
  S-session to redeploy the markets worker since the fx build era: the
  engine code changed, the "code-unchanged" convention does not apply);
  (3) the manual `fx-run` (the markets-au-run Path-B pattern: the LIVE
  Frankfurter fetch → the 11-pair snapshot → the KV REST write,
  generatedAt 2026-11-10T00:11:56Z — 10 pairs held same-date-stable +
  audnzd the new row). Production smoke: /api/health 200 · /currencies
  200 · the projection 200 · /api/insights/fx 200 with the audnzd row.
- **The data-refresh note (the freshness audit's own finding):** the
  post-deploy §21 run crossed the UTC-midnight grace boundary on
  dollar-broad/dollar-eme (asOf 2026-10-30, 11 days > the 10-day
  maxAge, status normal) — a PRE-EXISTING upstream lag (FRED's edge
  served the DTWEX tail a week behind; verified: FRED's own fredgraph
  answer now carries 2026-11-06). Fixed through the pipeline's own lever:
  a workflow_dispatch insights-ingest run (#87, 2026-11-10T00:22Z)
  wrote the refreshed snapshot (dollar-broad 121.8803 @ 2026-11-06 ·
  dollar-eme 130.7713 @ 2026-11-06; the run's designed exit-1 alerting
  fires for two TRANSIENT P1 provider timeouts — ecb-dfr + gold-aud —
  held on last-good values, flagged stale, exactly the fail-closed
  design; the next scheduled rung retries them).
- **The post-deploy §21 re-verify: ALL CHECKS GREEN** — cards 14/14 ·
  rules 16/16 · board 23/23 (11/11 pairs, D-42 complete) · freshness 14
  within grace.
- **The 4-leg browser pass (1440×900 + 360×844, en + fa):** 4/4 GREEN —
  the shell (h1 'Currency Pairs'/«جفت‌ارزها») · 7 rule lights (the live
  r5 watch with «نشانهٔ اولیهٔ نگرانی از چین») · 11 pair cards (audnzd
  last: rate 1.2283, moveRank 60, the 52-week chart) · 14 registry cards
  (₺50.14 · '101.85 index' · '56.70%' · «۵۰٫۱۴ لیر ترکیه» · «۱٫۲۲۸۳ دلار
  نیوزیلند») · the In-build chip ABSENT on every leg · 0px horizontal
  overflow on every leg · ZERO console/page errors on every leg · the fa
  legs dir=rtl with Persian digits. The legacy surfaces verified intact:
  / (Global) · /insights (the deprecation banner + the fx table now
  honestly showing the FOURTH group block "Australia–New Zealand (1)"
  with the audnzd row).
- **Rollback:** `npx wrangler rollback` from apps/api — /currencies
  returns to the prior surface (`08e0fc64`, S17 — the S1 PagePlaceholder
  with the honest In-build chip); `npx wrangler rollback` from
  apps/markets returns the fx engine to the 10-pair board (the stored
  11-pair KV document keeps parsing under the OLD schema? NO — the old
  schema rejects audnzd, so a markets-only rollback requires also
  re-running the 10-pair fx-run; the safe rollback order is api LAST:
  markets first, then the fx-run reseed, then api). Nothing else moves
  (the S18 change is the engine pair + the corpus words + the
  /currencies page build + the §21 backtest + the render audit + the
  chip retirement + the App.tsx wiring only).
- **Who decided:** the build & gates session (S18) under the owner's
  standing delegation ("the deploy at the close is the owner's
  standing") — the deploy ran 2026-11-10 ~00:05 UTC (recorded 2026-11-11
  in the session convention). **Revisit:** the deploy record is final;
  the full deploy narrative lives in `docs/DEPLOY.md`.

## 2026-11-11 — BD-S18-parallel: the parallel-session merge record — a SECOND agent session committed the same S18 milestones (M1a/M1b, the `auLink` variant) to origin/main WHILE this session ran; resolved by favouring THIS session's deployed implementation (the live workers run `pacificLink`)

- **Event:** a parallel agent session (author "Z User z@container") pushed
  `4fea60a` ("M1a — AUDNZD joins the FX board", 2026-11-10T00:18Z) and
  `59b0388` ("M1b — the pure currencies-tiles + the en/fa pd.currencies
  copy + the pins", 2026-11-10T00:30Z) to origin/main while THIS session
  (which had already built M1→M3, passed all gates, and DEPLOYED both
  workers at ~00:05 UTC) was writing its close-out records. The two
  implementations cover the same scope with one material difference:
  theirs named the fourth fx group `auLink`; this session's — deployed,
  gated, and live — named it `pacificLink`.
- **Resolution:** a MERGE (no force-push, no history rewrite — both
  sessions' commits stay in history). Every conflicting file resolved to
  THIS session's side (the deployed truth: the live currena-api
  `51a0fe45` + currena-markets `8f63c8fa` bundles carry the `pacificLink`
  implementation, the gated tests pin it, and the pushed tree must match
  production). The parallel session's NON-conflicting contributions were
  kept: the `fxRulePairIds` Level-3 loop now includes 'audnzd'
  (harmless + future-proof — no rule's chart series references it) and
  the `fx-data-check.ts` probe script's 9-quote-currency update. The
  merged tree re-ran the FULL GATES: ALL GREEN (typecheck 6/6 · eslint
  0/0 · copy:audit clean · the suite 15,088 — the same count, my
  implementations won every conflict).
- **Who decided:** this session (S18) under the deployed-state rule (the
  repo must match production; the alternative — adopting `auLink` —
  would require re-deploying both workers for zero user-visible gain and
  would orphan the gated test pins). **Revisit:** the OWNER should check
  how two S18 sessions were launched in parallel (this is the exact
  scenario the deploy-lock check guards against — the deploy here had
  already completed before their first push landed, so no production
  collision occurred); if the parallel session is still running it will
  hit a non-fast-forward push on its next commit and must rebase onto
  this merged tree.

- **Addendum (the M2 leg, ~00:50Z):** the parallel session pushed its own
  M2 (`2f1e0f1` — an alternative page build: their `CurrenciesRuleHero`
  component, a desktop-table board, a 26/7 budget row) while the first
  merge was being made. The second merge (`9e08455`) resolved every
  conflict to THIS session's deployed implementation and REMOVED their
  orphan `CurrenciesRuleHero.tsx` from the merged tree (it imports their
  tiles' export names — `CURRENCIES_RULE_IDS`/`currenciesRuleCopyKey` —
  which the merged [deployed] tiles module does not carry, so keeping it
  would break typecheck; their content is preserved verbatim in their
  commit `2f1e0f1`). The merged tree came out BYTE-IDENTICAL to the
  gated ALL-GREEN HEAD — the second merge changed no bytes, it only
  records the topology. **If the parallel session is still running, its
  next push will hit a non-fast-forward rejection; it must rebase onto
  `9e08455` and adopt the deployed `pacificLink` implementation, or stop.
  The owner should check how two S18 sessions were launched.**

## 2026-11-12 — BD-S18-parallel-2: the second session's counterpart close — the duplicate S18 session reconciled onto the deployed tree and INDEPENDENTLY re-verified it (its own gates run + its own live §21 run + its own 4-leg browser pass, ALL GREEN); no re-deploy, no code change

- **Event (the counterpart of BD-S18-parallel, from the second session's
  side):** the duplicate S18 session (this one) had pushed M1a (`4fea60a`
  — the AUDNZD engine leg, the `auLink` variant), M1b (`59b0388` — the
  tiles + copy + pins) and M2 (`2f1e0f1` — an alternative page build)
  before discovering — mid-M3, on a non-fast-forward push — that a
  parallel session had already completed S18 whole (its own M1→M3, gates
  ALL GREEN 15,088, BOTH workers deployed `51a0fe45`/`8f63c8fa`, the
  fx-run KV seed, the records) and had merged this session's commits
  with every conflict resolved to the deployed `pacificLink`
  implementation (BD-S18-parallel). Its own M3 commit (the §21 backtest
  core + a 16-test offline suite + a live pd-s18-backtest variant + a
  9-test render audit — sha `966c42b`, superseded and dropped from the
  branch; preserved in the reflog) duplicated the shipped artifacts and
  was NOT pushed.
- **Resolution:** the deployed-state rule, honoured from the other side:
  `git reset --hard origin/main` (the merged `1941197`) — no force-push,
  no history rewrite, no re-deploy (the deployed workers already carry
  the merged tree's exact engine code). The session then INDEPENDENTLY
  verified the shipped S18 rather than re-shipping its duplicate:
  (1) the FULL GATES re-run on the merged tree by this session — ALL
  GREEN in 2m 40s (secret scan 8/1014 · tsc 6/6 · eslint 0/0 ·
  copy:audit clean · narrator in sync + eval 50 · layer1 11,819/11,819 ·
  the suite 15,088 · build + budgets held, entry 271.02/82.05);
  (2) the CANONICAL live pd-s18-backtest.ts re-run against production —
  ALL CHECKS GREEN (cards 14/14 · the rules gate · the board gate 23/23
  with audnzd live at rate 1.22827/moveRank 60.39 · freshness 14 within
  grace); (3) the 4-leg browser pass re-run (1440×900 + 360×844, en +
  fa): the h1 'Currency Pairs'/«جفت‌ارزها», the 7 rule lights, the 11
  pair rows (audnzd last), the 14 §21-trio cards, the In-build chip
  ABSENT on all four legs, 0px horizontal overflow, ZERO console/page
  errors; (4) the cross-surfaces: the legacy /insights fx table now
  honestly renders the FOURTH group "Australia–New Zealand" with the
  audnzd row (verified live, zero errors), and the /australia seat chips
  resolve to the real /currencies page.
- **Who decided:** this session, under the same deployed-state rule the
  first session applied (production truth; a second implementation
  shipping over a live, gated, verified one buys nothing but risk).
- **Revisit:** the OWNER post-mortem stands (BD-S18-parallel's own
  question): how were two S18 sessions launched from one prompt? No
  production collision occurred (the first session's deploy completed
  before this session's first push landed; this session never deployed).
  The owner should ensure S19+ launches exactly ONE session per roadmap
  slot.
