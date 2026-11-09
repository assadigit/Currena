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
