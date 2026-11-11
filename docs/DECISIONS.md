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

## 2026-11-12 — BD-S18-parallel-3: the THIRD S18 session's counterpart close — a late duplicate (resumed from the interrupted session's local M1a/M1b, its M2 built against a stale view) reconciled onto the deployed tree; its duplicate page build preserved on `archive/s18-duplicate-m2`, its one unique salvage (the local-seed NZD fixture) landed, and the shipped S18 INDEPENDENTLY re-verified once more (gates + live §21 + the 4-leg browser pass, ALL GREEN); no re-deploy, no shipped-code change

- **Event (the third arrival, from its own side):** a third S18 session
  started from the same standing prompt. Its sandbox carried the
  INTERRUPTED first duplicate session's local checkpoints (M1a `4fea60a`
  + M1b `59b0388` — already merged into origin/main at `c28b930`,
  resolved to the deployed `pacificLink` implementation) and a clean
  `git status`, so the session read the tree as "M1 done, M2/M3 to
  build" and built its OWN M2 (a3eb390: a `CurrenciesFxSections`
  hero+board variant + its own copy keys + budget rows + a
  PagePlaceholder/DestinationBody retirement). Only its first `git
  push` — rejected as non-fast-forward — revealed that origin/main had
  meanwhile closed S18 whole (the primary's deploy `51a0fe45`/
  `8f63c8fa` + the first duplicate's reconciliation,
  BD-S18-parallel/-2, HEAD `52a378b`). No push of the duplicate ever
  landed on main.
- **Resolution (the deployed-state rule, honoured a third time):** the
  duplicate M2 was preserved on the pushed branch
  `archive/s18-duplicate-m2` (nothing lost, nothing merged), local main
  was reset to `origin/main` (`52a378b`) — no force-push, no history
  rewrite — and the tree diffed line-by-line against the duplicate:
  everything the duplicate's page carried already ships richer in the
  deployed build (their per-rule outcome-specific headline sentences,
  the reliability line + the §6.7 progress bar, `thPair`, the ECB
  `boardFooter`, the calm empty line, their own 24/6.5 budget row; the
  remote kept PagePlaceholder/DestinationBody with
  `DESTINATION_ROUTES` empty — their documented choice). ONE unique
  contribution survived the diff and landed as `1fc94e0`: the
  `scripts/local-seed-fixtures.ts` NZD line (dev-harness only — without
  it a locally seeded fx snapshot carries 10 pairs, V4/V7 holds the
  audnzd row out, so a local /currencies render can never exercise the
  11th pair; verified: the harness now writes 11 pairs).
- **The independent re-verification (this session's own, all green):**
  (1) the FULL GATES on the reconciled tree — ALL GREEN in 2m 38s
  (secret scan 8/1014 · tsc 6/6 · eslint 0/0 · copy:audit clean ·
  narrator in sync + eval 50 · layer1 11,819/11,819 · the suite 15,088 ·
  build + budgets held, entry 271.02/82.05, the CurrenciesPage chunk
  21.09/5.33); (2) the CANONICAL live `pd-s18-backtest.ts` vs
  production — ALL CHECKS GREEN (cards 14/14 · the rules gate 16/16 ·
  the board gate 23/23 with audnzd live at moveRank 60.39 · freshness
  14 within grace); (3) the 4-leg browser pass (1440×900 + 360×844,
  en + fa): h1 'Currency Pairs'/«جفت‌ارزها» · the 7 rule lights (the
  live r5 watch «نشانهٔ اولیهٔ نگرانی از چین») · the 11 pair rows
  (audnzd last, rate 1.2283 / «۱٫۲۲۸۳ دلار نیوزیلند») · the 14
  §21-trio cards («۵۰٫۱۴ لیر ترکیه» · «۵۶٫۷۰٪») · the In-build chip
  ABSENT on all four legs · 0px overflow · ZERO console/page errors;
  (4) the cross-surfaces: the legacy /insights fx table's fourth group
  "Australia–New Zealand (1)" with the audnzd row, and the /australia
  seat chips (audusd · audjpy · audnzd) resolving to the real page.
- **Who decided:** this session, under the deployed-state rule (the
  production truth stands; a third implementation over a live, gated,
  twice-verified one buys nothing but risk).
- **Revisit:** the owner post-mortem now covers THREE S18 sessions
  launched from one prompt (the primary + two duplicates; zero
  production collisions — neither duplicate ever deployed or pushed to
  main). The standing instruction hardens: **launch exactly ONE
  session per roadmap slot — S19 first, then wait for its hand-off
  before any further session.**

## 2026-11-12 — BD-S19a: the HANDOFF item 6 language quick-toggle pass — the "theme words" read DISPROVEN against the deployed DOM; the polish that rides it: the accessible name + tooltip now NAME THE TARGET language

- **Context:** the HANDOFF (item 6, first recorded at S9's close) carried
  a "pre-existing display quirk" for the Header's language quick-toggle:
  "the button shows the theme words as its visible label (its aria-label
  is correct)" — slated for S19's polish pass.
- **The verification (this session, against the DEPLOYED site + the
  freshly built SPA):** the claim does not reproduce. On every leg
  (currena.ir + the local preview, en + fa, 1440×900 + 360×844) the
  button's visible label is the TARGET language's own word ('فا' in en ·
  'EN' in fa) and its aria-label + title are the correct
  'Toggle language' / «تغییر زبان» strings. The source has carried this
  exact behaviour since the S1 topbar rebuild (`cdc5e7c`) and the
  deployed bundle (byte-verified `51a0fe45`) matches it — the S9-era
  read is disproven against the DOM (the S5/S6/S10/S11 discipline: the
  machine's finds checked against reality).
- **The polish (what actually rides the pass):** the accessible name +
  tooltip now NAME THE TARGET in the current locale's language —
  `nav.switchToFa` 'Switch to Farsi' (en) / `nav.switchToEn`
  «تغییر به انگلیسی» (fa) — clearer for assistive-tech users than the
  retired generic 'Toggle language' («تغییر زبان», removed from both
  dictionaries + the manifest). The visible label stays 'فا'/'EN' (the
  standard quick-toggle convention). 2 fresh fa strings queued
  unreviewed (the manifest round note).
- **Who decided:** this session (S19), per the roadmap's own scope line
  ("the known Header language quick-toggle display quirk … rides this
  pass").
- **Revisit:** none needed — the HANDOFF item closes verified.

## 2026-11-12 — BD-S19b: the breadcrumbs' scope — the eight destinations render Home › Page; Global IS Home (no trail) and the legacy /insights keeps its deprecation banner as the wayfinding bridge

- **Decision:** the shared `PageBreadcrumbs` component renders the
  honest two-level trail the D-46 routes actually have — every
  destination is a TOP-LEVEL sibling of Home, so the trail is exactly
  `Home › <Page>`: Home is a REAL link (routed through the path router
  once, no reload — the house pattern), the current page is a plain
  span with `aria-current="page"` (the WAI-ARIA breadcrumb pattern),
  the separator is aria-hidden and mirrored in RTL
  (`rtl:-scale-x-100`), and the Home link rides the Footer's 32px
  `py-2` hit-area precedent (WCAG 2.5.8 AA floor with room to spare —
  full 44px buttons would bloat a caption-size wayfinding row).
- **Scope:** the EIGHT destinations beyond Global render it (gold ·
  world-markets · usa · europe · asia-pacific · australia ·
  commodities · currencies — wired inside each page's own heading
  block, so it renders in the ready + cached states). Global gets NO
  trail (a "Home › Global" row on the landing page is noise — the
  landing IS Home). The legacy /insights keeps its deprecation banner
  as the wayfinding bridge (retirement ahead at D-9/D-46; the banner
  already links home). The tool routes keep the topbar.
- **Options considered:** (a) a three-level trail through "Regions" for
  the four region pages — REJECTED: "Regions" is a nav group, not a
  page; a breadcrumb crumb that is not a page is an anti-pattern;
  (b) App-level rendering above <main> — REJECTED: each page owns its
  container widths/paddings (the S7 BD-S7b lesson), so an App-level
  row would break the per-page layout rhythm.
- **Who decided:** this session (S19), per the roadmap's S19 scope
  line ("breadcrumbs").
- **Revisit:** if a future session adds second-level routes (e.g.
  per-indicator pages), the component grows a middle crumb then.

## 2026-11-12 — BD-S19c: the per-page meta/OG tags — the SPA-honest client-side pass (the destinations' PURPOSE lines as descriptions) + the refreshed static defaults; true per-route SSR OG is out of scope by the repo's own SPA-only rule

- **Decision:** a pure `lib/route-meta` table (the S1 `titleKeyFor`
  switch moved verbatim + regression-pinned byte-for-byte) feeds the
  App shell's extended <head> effect: per-route `<title>` (unchanged
  behaviour) + meta description + `og:title` / `og:description` /
  `og:url` / `og:locale` + `twitter:title` / `twitter:description` +
  the canonical link — all find-or-create idempotent writers (safe on
  every route change). The NINE destinations (incl. Global) reuse
  their DICTIONARY PURPOSE lines as descriptions (D-48: one wording
  per concept — the spec §4–§12 "Purpose" sentences ARE the meta
  descriptions, never a second copy); every other route falls back to
  the new app-wide `app.metaDescription` (the whole product in one
  sentence). The static `index.html` defaults + the PWA manifest
  description carry the same sentence (refreshed from the converter-era
  "LED boards" wording).
- **The honesty (why not SSR OG):** this is a client-rendered SPA —
  the tags serve every JS-executing reader (browsers, the PWA,
  JS-aware crawlers); non-JS crawlers see the static defaults for
  every route. TRUE per-route server-rendered OG would need SSR —
  forbidden by the repo's own SPA-only rule (AGENTS.md §14 rule 4).
  The limitation is recorded here rather than silently absorbed.
- **Options considered:** per-route HTML injection in the Worker
  (rewrite <head> per navigation request) — REJECTED: the platform's
  SPA fallback serves the static shell for non-asset navigations;
  routing them through the Worker for a meta rewrite is an infra-level
  change with real risk, out of a display-layer session's scope.
- **Who decided:** this session (S19), per the roadmap's S19 scope
  line ("meta/OG tags per page").
- **Revisit:** if the owner ever wants link-previews per route for
  non-JS crawlers (Telegram/X cards), the options are SSR/prerender or
  the Worker-side injection above — an owner decision.

## 2026-11-12 — BD-S19d: the sticky-footer verification + the mobile safe-area rider (and the two S1-noted legacy-hero mobile items closed)

- **The sticky footers (spec §18):** the shell's `min-h-screen` flex
  column with `main.flex-1` already seats the footer at the viewport
  bottom on short pages and below long content otherwise — VERIFIED on
  every route at both widths in both locales (Global: footerBottom =
  viewport height exactly, one screen at 1440×900 AND 360×844; the
  long pages: the footer pushed below content, never overlapping).
  No layout change needed; the pass is the verification.
- **The rider that DID land:** `.app-footer` gains
  `padding-block-end: max(1.25rem, env(safe-area-inset-bottom, 0px))`
  — the footer now respects the iOS home-indicator inset on
  viewport-fit=cover devices (the standalone PWA), with the design's
  own 20px padding as the floor on devices without an inset.
- **The two S1-noted legacy-hero mobile items (the S1 VLM pass's
  finds, carried since 2026-11-07):** (1) the ⓘ wrap on the
  data-as-of line — the date sentence and the prices sentence (+ its
  ⓘ) are now separate non-breaking `<bdi>` units, so a narrow viewport
  wraps ONLY between units ("UTC ⓘ" never orphans — verified in the
  live DOM: 2 nowrap bdis, the ⓘ inside the second, never alone);
  (2) the "Global-gauge emoji spacing" — the `.ei-state-pill`
  icon-to-word gap widens 0.375rem → 0.5rem + a touch more inline
  padding (the state artwork's full-bleed glyph visually merged with
  the verdict word at 360px; the DOM-measured 12px section-icon gap
  was already correct — the pill was the offender).
- **Who decided:** this session (S19), per the roadmap's S19 scope
  ("sticky footers") + the S1 delivery record's own note ("pre-
  existing mobile polish items on the legacy hero noted for S19").
- **Revisit:** none needed.

## 2026-11-12 — BD-S19-deploy: the S19 deploy record — DEPLOYED LIVE (currena-api `74777037`, the owner's standing; a WEB-ONLY deploy — the markets worker untouched, the code-unchanged convention)

- **Scope (page-division S19, Navigation, mobile & SEO polish — Phase J
  opens):** display-layer only — the SPA (the breadcrumbs component +
  the 8 page wirings, the route-meta module + the App <head> effect,
  the language-toggle labels, the footer safe-area rider, the two
  legacy-hero mobile fixes), the dictionaries (4 new keys, 1 retired),
  the Persian copy manifest, the static index.html defaults + the PWA
  manifest description, and the tests (11 new: PageBreadcrumbs 4 ·
  route-meta 7; + the 8 pages' breadcrumb wiring pins + the 3 title
  assertions tightened to the h1 role). NO engine change, NO API-code
  change, NO wire-contract change — the markets worker is untouched
  (the code-unchanged convention, the S4–S17 web-only pattern).
- **Gates before the deploy (ALL GREEN, 2m 38s):** secret scan 8/1018
  · typecheck 6/6 · eslint 0/0 · copy:audit clean (the 4 new fa
  strings queued unreviewed) · narrator in sync + eval 50 · layer1
  11,819/11,819 · the full suite **15,099 = +11** · build + budgets
  held — entry 272.83/82.52, every page chunk within its row.
- **The deploy-lock check ran first** (the D-43 lesson): the active
  version was S18's `51a0fe45` @ 100% — no parallel deploy.
- **The deploy:** `pnpm --filter @currena/web build` + `wrangler
  deploy` → **currena-api `74777037` @ 100%** (version
  `74777037-2007-47b6-ad73-69904ceea8ba`, 2026-11-10 ~03:1x UTC).
  The deployed entry chunk byte-verified IDENTICAL to the local build
  (`index-IjAwPQA1.js`). Production smoke: /api/health 200 · / 200 ·
  /gold 200.
- **The live acceptance (ALL GREEN):** currena.ir verified at
  1440×900 + 360×844 in en + fa — the breadcrumb trails on the eight
  destinations (en `Home › Gold` · fa «صفحهٔ اصلی›طلا» with the
  RTL-mirrored chevron, scale −1 1 verified in the CSSOM + the VLM
  read), NO trail on Global + /insights (BD-S19b), the per-route
  titles/descriptions/canonicals + og:locale en_US/fa_IR live on every
  route, the language quick-toggle's new labels
  ('Switch to Farsi'/«تغییر به انگلیسی», visible 'فا'/'EN'), the
  /insights hero fixes live in the DOM (the 2 nowrap bdis + the 8px
  pill gap), 0px horizontal overflow on every route in every leg,
  ZERO console/page errors, the Global one-screen rule intact WITH the
  footer (docScrollH = 900 at 1440×900), the footer at the viewport
  bottom on short pages + pushed below content on long pages, the
  topbar on ONE unwrapped line at exactly 1024×768 (the S1
  constraint), the mobile drawer's 19 rows all ≥44px with the
  active-route highlighting + the navigation + auto-close verified.
- **The S18 transient P1 glance (the roadmap's own ask):** gold-aud
  SELF-CLEARED (asOf 2026-11-10, status context — fresh at the latest
  rung); ecb-dfr still carries the stale flag (asOf 2026-11-09,
  value 2.5 held on last-good) — it did NOT self-clear at the 00:23Z
  rung, so per the HANDOFF's own rule it now belongs to a maintenance
  session (recorded in the hand-off; the fail-closed design is holding
  the correct value honestly).
- **Rollback:** `npx wrangler rollback` from apps/api — every surface
  returns to the S18 shape (`51a0fe45`): the trails, the meta pass,
  the labels, the rider and the two hero fixes vanish; nothing else
  moves (the S19 change is display-layer only).
- **Who decided:** this session (S19) under the owner's standing
  delegation ("the deploy at the close is the owner's standing").
  **Revisit:** the record is final; the next session (S20) is the
  full-site regression + verdict backtest + data audit.

## 2026-11-12 — BD-S20a: the §21 data audit — the N=20 random-id source spot-check (Rule 5) shipped as a re-runnable LIVE tool and run ALL GREEN against production

- **What was decided:** the S20 data audit is a NEW manual script
  (`apps/web/scripts/pd-s20-data-audit.ts`, the pd-* backtest family's
  own pattern — never in the test suite, writes nothing, read-only
  against production AND the upstream publishers), with the sample
  FROZEN for the record: a seeded uniform random draw
  (`random.Random(20261112).sample` over the 184 registry ids — seed
  20261112, sorted, recorded in the script header) → N=20 across 11
  distinct providers (fred 6 · gpr 3 · eia 2 · derived 2 · abs 1 ·
  portwatch 1 · frb 1 · gold-api 1 · sge 1 · bazg 1 · fiscaldata 1) —
  a fair provider spread, no cherry-picking.
- **The method (the honest arm of Rule 5):** each id's value is
  fetched from ITS OWN upstream publisher through the repo's own
  adapter parsers (imported verbatim — never re-implemented) from the
  audit machine's venue, the derivation replicated exactly as the
  ingest computes it (`yoyPctSeries` for the WPI/PCE YoY cards, the
  Pink Sheet copper÷gold ratio, the 4dp `quantizedGap` discipline for
  the US−Japan 10y gap, the PortWatch MA7 window, the SGE month's OWN
  PDF — never only the newest), and compared AT THE STORED asOf; a
  newer upstream point past the stored asOf is a freshness NOTE (the
  freshness gate owns that), never a silent mismatch.
- **The two live-price arms:** `platinum` is the designed,
  explained-difference arm (the stored value is the :13 hourly rung's
  own snapshot of a continuously-moving market — the intraday move is
  recorded, <2% passes); the FRED venue quirk (fredgraph.csv is
  TLS-fingerprint-blocked from the audit machine's curl but Node's
  undici fetch passes — the same venue behavior past sessions hit the
  other way round) is recorded in the script header.
- **The result (this session's own run, 2026-11-10T04:07Z):** ALL 20
  CROSS-CHECKS GREEN — 19 byte-exact matches (au-wage-growth ABS WPI
  YoY 3.2030749519538757 · chokepoint-malacca MA7 202.7 · copper-gold
  3.5342265529841654 · ebp −0.26533114775416333 · fed-target DFEDTARL
  3.75 · the GPR trio · ICSA 189000 · UMCSENT 48.1 · RSAFS 745021 ·
  SGE 92.08 tonnes · STLFSI4 −0.5224 · BAZG 227.9 · the auction
  bid-to-cover 2.77 · WCRFPUS2 14003 · the DGS10−jgbcme gap 2.164 ·
  PCEPILFE YoY 3.1211596029620208 · WCSSTUS1 282184) + platinum the
  0.25% intraday spot move (1581 vs 1577, recorded).
- **The additive export surface:** the audit needs the repo's own
  parsers through the public door — `@currena/insights/adapters` gains
  a clearly-commented export block (fetch/parse for GPR, EBP,
  PortWatch, auctions, EIA stocks, BAZG, SGE monthly, MOF +
  `insightsFetch`/`CURRENA_UA` + `combineSeries`). Every symbol was
  already exported from its own module; the block changes ZERO
  behavior (the web bundle discipline is untouched — the adapters are
  server-side tooling).
- **Who decided:** this session (S20) per the roadmap's own S20 scope
  ("the N=20 random-id source spot-check (Rule 5)").
  **Revisit:** the tool is re-runnable (`pnpm --filter @currena/web
  exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts`) — every later
  session's data audit can re-run it or freeze a NEW seed; the §21
  gate is satisfied by ANY recorded N=20 run.

## 2026-11-12 — BD-S20b: the S20 full-site regression + verdict backtest — every page × every §21 gate re-run against the S19 tree AND production, ALL GREEN

- **The gates run (local, the S19 tree + the audit toolkit):** ALL
  GREEN in 2m 42s — secret scan 8/1019 · typecheck 6/6 · eslint 0/0 ·
  copy:audit clean · narrator in sync + eval 50 · layer1
  11,819/11,819 · the full suite 15,099 (the S19 count EXACTLY — the
  session's code adds a manual script + additive exports, no test
  change) · build + budgets: entry 272.83/82.52, every page chunk
  within its row (IDENTICAL to the S19 rows — the display layer did
  not move).
- **The placement audit (§21):** `pnpm placement:generate` reconciles —
  184 registry ids + 6 boards · 0 unplaced · 0 duplicate homes · zero
  diff on the committed table.
- **The verdict-consistency backtests (§21 zero tolerance), ALL 11
  re-run LIVE against production (currena.ir, 715 checks):** pd-s4
  Global 84/84 (+ the narrator wiring: the raw-KV stateHash recompute
  IDENTICAL — the artefact narrates exactly the state the pages serve)
  · pd-s5 Gold 150/150 (the seat-level diff) · pd-s7 World Markets
  56/56 · pd-s8 zooms 9/9 · pd-s9 USA 115/115 · pd-s10 USA tiers+TIC
  115+48 · pd-s12 Europe 8/8 · pd-s14 Asia 11/11 · pd-s16 Australia
  28/28 · pd-s17 Commodities 24/24 · pd-s18 Currencies 14+16+23 +
  freshness 14-within-grace.
- **The browser regression (the §21 per-page gates, LIVE on
  production):** all 10 routes × 1440×900 + 360×844 × en + fa (40
  legs) — the per-route titles/descriptions/canonicals + og:locale
  (en_US/fa_IR) on every route, the breadcrumb trails on the EIGHT
  destinations only (Global IS Home; the legacy keeps its deprecation
  banner — verified live: "This page is being reorganised…"), 0px
  horizontal overflow on every leg, ZERO console/page errors on every
  leg, the Global one-screen rule WITH the footer at BOTH widths
  (footerGap 0), long pages push the footer below content (never
  overlapping), dir=rtl + Persian titles on every fa leg. The
  page-specific gates: Global's 10 tiles all show verdicts or their
  designed live content (the prices ribbon — Gold US$4,120 +0.1%
  matching the snapshot byte-for-byte — + the dedollarization context
  tile) and the 7 destination chips all link; Gold's 37 seats render
  with lean + evidence + the honest-record footnote ("Measured against
  gold's actual moves over 2016 to 2026…"); Currencies' 7 rule lights +
  14 registry cards + 11-pair board; USA's 72 cards; Europe 8 · Asia
  11 · Australia 28 · Commodities 24. NO DEAD LINKS on any route (every
  internal href resolves to a known route; zero empty/javascript:
  links). The interaction golden path: the Global tile navigation
  (→ /world-markets, SPA-routed, no reload) + the mobile drawer (19
  rows) verified live.
- **Who decided:** this session (S20) per the roadmap's own S20 scope.
  **Revisit:** none — the regression record stands; S21 (the
  spec-vs-implementation audit) is the next session's own pass.

## 2026-11-12 — BD-S20c: the S20 performance budget check — the bundle rows held + the measured live pass at both widths

- **The bundle budget (the gates' own row check):** entry
  272.83/82.52 kB (raw/gzip) — IDENTICAL to the S19 row; every page
  lazy chunk within its row (the rows from the S16–S19 budget table:
  Currencies 24/6.5 · Gold 1540/355.5 · every other page at or under
  its ceiling; the measured Insights lazy 1519.63/349.51).
- **The live performance pass (production, measured this session):**
  COLD first visit at 1440×900 — load 380ms, 485KB total transfer (the
  Vazirmatn variable font 109KB + the entry chunk 84KB + the main app
  chunk 80KB + the logo 33KB — the biggest items are the font and the
  app shell, not the page code) · COLD /gold at 360×844 — load
  76ms/14KB · WARM navigation per route — DOMContentLoaded 59–81ms,
  load 59–81ms, 8–28KB transferred (the per-route lazy chunks are
  single-digit-KB gzip). ZERO console errors on every measured leg.
- **The reading:** the page-division split is doing its job — every
  destination's code arrives as a small lazy chunk; the entry shell +
  the font dominate the cold path (the PWA service worker then caches
  them). No budget breach, no performance debt found.
- **Who decided:** this session (S20) per the roadmap's own S20 scope.
  **Revisit:** the next full performance re-measure belongs to a
  reserve session (S25–S30) if one is ever needed; nothing is red.

## 2026-11-12 — BD-S20-deploy: the S20 close — NO deploy (the owner's standing; nothing was fixed)

- **The decision:** S20 is a verification session; its only tree
  changes are (a) the manual audit script (dev tooling — the Vite
  build never ships apps/web/scripts/) and (b) the additive
  `@currena/insights/adapters` export block (a package export surface
  for tooling; zero runtime behavior change — the api worker and the
  web bundle import the same modules as before). NOTHING was fixed —
  every gate, every backtest, every audit came back green on the first
  or second run (the two first-run audit failures were the audit
  script's own fetch bugs: a wrong ABS key parameter + a custom UA the
  SGE venue 403s — fixed in the script, never in shipped code).
- **Production stays at currena-api `74777037`** (the S19 surface, the
  markets worker at `8f63c8fa`) — and this session's own 715-check
  live backtest sweep + the 40-leg browser pass + the 20-id upstream
  audit IS the proof that production serves exactly this tree's
  behavior (the deployed entry chunk was byte-verified at S19; the S20
  tree adds no shipped-code change).
- **Rollback story:** unchanged from S19 — one `npx wrangler
  rollback` from apps/api.
- **Who decided:** this session (S20) under the owner's standing ("the
  deploy at the close is the owner's standing — expected: none, unless
  something is fixed"). **Revisit:** S21 (the spec-vs-implementation
  audit) may surface fixes; its own session decides its own deploy.

## 2026-11-10 — BD-S21a: the spec-vs-implementation audit (the full §4–§14 diff vs the live site) — the method + the verdict

- **The decision (method):** the S21 diff ran as a four-way parallel code
  audit (spec §4–§5 Global+Gold · §6–§7 World Markets+USA · §8–§10
  Europe+Asia+Australia · §11–§13 Commodities+Currencies+Legacy — each
  checklist item traced to file:line evidence, every recorded BD-S3…S20
  deviation re-confirmed as holding) + a live production verification of
  every page's spec-visible structure (the 10 tiles · 37 seats in
  7/7/11/10/2 lanes · the Asia-Pacific 7-row grid · the 72 USA cards ·
  the 8+11+28+24+14 cards · the 7 lights + 11 pairs · the deprecation
  banner — all confirmed on currena.ir) + the §14 placement regeneration
  (184 ids · 0 unplaced · 0 duplicate homes · 0 unknown · 0 mirror
  overlaps — reconciles, zero unintentional diff).
- **The verdict:** the spec is implemented faithfully — 100+ checklist
  items MATCH or hold as RECORDED deviations (BD-S3a/b/c · BD-S4a/b ·
  BD-S5a · BD-S6a · BD-S7a/b · BD-S8a/b/c · BD-S9a/b/c · BD-S10a/b/c ·
  BD-S11a/b/c · BD-S12a/b · BD-S13a/b/c/d · BD-S14a/b · BD-S15a/b/c/d ·
  BD-S16a/b/c/d · BD-S17a/b/c · BD-S18a/b/c · BD-S19a/b/c/d — every one
  re-confirmed against the code this session). NEW findings: four fixed
  (BD-S21b/c/d below) + two spec-side drift findings recorded as AF-6
  and AF-7 (info class, the AF-2 family) + two informational notes:
  (i) the Global narrator line renders with a 2-line clamp (the spec
  sketch's "one line" — BD-S4b's verbatim text + Updated stamp needs
  the second line; the S4 record's own clamp-tuning history; recorded
  here, no change), and (ii) the REUSED world map (D-43) shows
  always-visible per-index Day/Week/Month callout cards with hover for
  emphasis, not the spec's loose "hover = 1d/1w/1m changes" phrasing —
  the reuse mandate governs the wording; the substance is delivered
  permanently, which exceeds hover.
- **The S20 tools re-used:** the re-runnable data audit (see BD-S21e)
  and the eleven live pd-* backtests — ALL GREEN, 715 checks (s4 Global
  84 + the narrator raw-KV stateHash recompute IDENTICAL · s5 Gold 150 ·
  s7 56 · s8 9 · s9 115 · s10 115+48 · s12 8 · s14 11 · s16 28 · s17
  24 · s18 14+16+23).
- **Who decided:** this session (S21) per the roadmap's own scope. No
  owner input needed (the fixes ride standing decisions; the records
  ride the established BD pattern).

## 2026-11-10 — BD-S21b: the §9 item 5 NZX50 surface lands on /asia-pacific (the BD-S8b commitment wired at last)

- **The finding:** spec §9 item 5 lists the Pacific—New Zealand section
  as "nz-short-rate · nz-10y · NZX50" — but the page carried only the
  two registry cards, and BOTH locales' section intro claimed "The
  NZX50 rides the Asia zoom map above" (en.ts/fa.ts) while the Asia
  zoom (BD-S8a's one-drawing region cut over the world board's 16
  indices) carries only the six world-board Asian indices. NZX50 is not
  a world-board index — it lives on the AU Markets board (S6-M6.1's
  NZD rider), whose home is /australia. Verified LIVE on production
  (the false sentence rendered with 6 zoom cards). BD-S8b had recorded
  the gap with the commitment "S14/S16 wire that page section —
  recorded, never silently faked" — never discharged on /asia-pacific
  (S16 wired the board on /australia instead).
- **The fix (display-layer ONLY — no engine, no new provider, no KV
  change):** the new `AsiaNzx50Card` renders the AU Markets board's own
  nz50 row inside the Pacific—NZ section — the SAME payload through the
  SAME cached `GET /api/insights/markets-au` route + the SAME
  `au-markets/shared` formatting helpers the board's own table reads
  (one board, one vocabulary — D-48), the corpus-pinned name
  (`pd.australia.boardCopy.entries.nz50` — the same key the AU board
  copy pins), the close + the window-tagged day change (never a bare
  percent) + the 52-week range sentence (`pd.worldMarkets.rangeSr`) +
  the as-of + the stale word when the row is stale, and a REAL link to
  the board's home `/australia` (spec §3.2: mirrors are links; the
  BD-S8c zoom-card precedent for board rows). States: the M-17 last-good
  localStorage paint, the honest "being prepared" line on the dead path
  (the AU board's own loading/empty discipline), never a fake value.
- **The §9.6 zoom-map deviation RECORDED (not fixed by design):** the
  spec's Asia zoom list includes NZX50 — seating it would require a pin
  on the world map, i.e. NZX50 joining the 16-index world board (a
  fetch + KV + engine change), which is outside the display-layer-only
  program (§3.3). The zoom keeps its six world-board Asian indices; the
  NZX50 surface is the section card.
- **The copy:** the false sentence replaced in both locales (en: "…
  plus the S&P/NZX 50 index from the AU Markets board."; fa: «…،
  به‌همراه شاخص ۵۰ شرکت بزرگ نیوزیلند از تابلوی بازار استرالیا.»); the
  two new fa strings (nzxPreparing · nzxBoardLink) queued unreviewed
  (round 57), pacificNz.intro triaged needs-review — copy:audit clean
  (7,892 entries).
- **The gates:** AsiaPage +3 tests (the dead-feed fail-closed proof ·
  the M-17 cached paint · the /australia link navigation) + the
  Pacific—NZ section assertions extended (the card's full content +
  the fixed copy asserted in en, the corpus-pinned fa name asserted);
  the AsiaPage chunk 15,679/4,036 bytes vs its 16,000/6,000 row (held).
- **Who decided:** this session (S21). **Revisit:** if the owner ever
  wants NZX50 as a world-board pin (the zoom-map literal reading), that
  is an engine-layer change with its own session + gates.

## 2026-11-10 — BD-S21c: the Global header's cached path stops doubling the date (BD-S5a's revisit clause discharged)

- **The finding:** BD-S5a (S5) fixed the Gold page's cached header (the
  fromCache sentence REPLACES the plain data-as-of line — printing both
  read as a garbled duplicate) and recorded "Global's header keeps the
  S4 pattern until S19's polish pass aligns it" — but S19/S20 never
  touched it and no deferral was recorded. GlobalPage.tsx rendered
  dataAsOf + pricesAsOf + fromCache together on the cached path.
- **The fix (the two lines BD-S5a promised):** the exclusive pattern —
  fromCache replaces the data-as-of line; the prices stamp stays (it
  carries the ribbon's own price time, a different fact from the
  snapshot date). Pinned by the extended cached-path test (the
  data-global-cached element + no doubled "Data as of").
- **Who decided:** this session (S21), executing BD-S5a's own recorded
  clause.

## 2026-11-10 — BD-S21d: the stale doc notes + comments aligned with the recorded truth (AF-6/AF-7 recorded)

- **The finding (doc drift):** the three Asia placement notes still said
  the §15 CPI fills "land with S14" — contradicting BD-S14a/BD-S15d
  (the FRED OECD mirror candidates VERIFIED STALE and discarded; the
  fills carried forward to a dedicated session). The Europe note had
  been updated; the Asia notes had not — and the stale text propagated
  into PLACEMENT.generated.md.
- **The fix:** the japan/korea-taiwan-hk/india notes now speak the
  BD-S14a/BD-S15d truth; the pacific-nz note names the AU Markets board
  (BD-S21b); PLACEMENT.generated.md regenerated (reconciles — 184 · 0
  · 0; the diff is the intentional notes + the two new findings only).
- **The spec-side drift recorded (never corrected in the spec):**
  **AF-6** — spec §6 item 2 lists the Asia grid as 6 indices while its
  own §6 hero requires 16 (the three grid lists total 15, missing
  ASX200); the registry is the authority (Asia-Pacific 7 incl. ASX200 ·
  Europe 4 · Americas 5) and the /world-markets grid renders the
  registry's 7 under the heading "Asia-Pacific" — verified live. The
  AF-2 class: recorded, nobody "fixes" the grid to match the typo.
  **AF-7** — spec §10 says "19 symbols: … 10 ASX-200 sectors …" but
  2+10+4+1+1 = 18 ≠ its own 19; the board carries ELEVEN GICS sector
  rows and totals 19 ✓ — the "10" is a spec typo; the code is right.
  Both added to PLACEMENT_AUDIT_FINDINGS + the doc + the test pin
  (AF-1…AF-7).
- **The stale comments fixed:** GlobalBoard.tsx (BD-S3c's 2-col mobile
  vs the header's "1-col stack"; BD-S4a's LANDED change1d vs the
  ribbon comments' "not part of the projection contract" transitional
  note), asia-tiles.ts + AsiaTierCards.tsx + world-map-config.ts (the
  NZX50 wiring notes). Zero behavior change — a future auditor reading
  the headers alone would no longer mis-conclude.
- **Who decided:** this session (S21). **Revisit:** the spec itself is
  never edited silently — AF-6/AF-7 wait for the investor-review spec
  v2 pass (S22+) alongside AF-1…AF-5.

## 2026-11-10 — BD-S21e: the §21 data audit's one RED — the PortWatch Tuesday maintenance window (recorded, explained; the re-run closes it)

- **The finding:** the S20 data-audit tool's re-run (the frozen
  seed-20261112 N=20 sample) returned 19/20 green (18 byte-exact +
  platinum's live-spot arm) and ONE red: chokepoint-malacca — "the
  PortWatch collection carried no chokepoint-malacca series". The
  probes: the IMF's ArcGIS FeatureServer (services9 …/Daily_
  Chokepoints_Data/FeatureServer/0) answered **499 Token Required**
  to EVERYTHING from this venue (metadata, bare query, the filtered
  query) at 11:38–11:50 UTC.
- **The root cause (the provider's own banner, live on portwatch.imf.org
  during the probes):** "Scheduled Maintenance: Every Tuesday from
  6:00 AM to 9:00 AM (ET), Daily Ports and Daily Chokepoints Data will
  be temporarily unavailable while we perform routine data updates."
  2026-11-10 is a Tuesday; 11:38–11:50 UTC = 6:38–6:50 AM ET — inside
  the window. The S20 green run (04:07 UTC = Monday 23:07 ET) sat
  before it. NOT a policy change, NOT a data error, NOT a code defect.
- **The disposition:** the re-run after the window closes (≥ 14:00 UTC)
  is the audit's own gate — this session re-ran it and records the
  result (see the delivery record). The stored production values (all
  five chokepoints, asOf 2026-11-01 — the provider's own ~7-day
  publication lag, status context, WITHIN the 14-day maxAge grace) are
  the last-good verified copy; the fail-closed design + the engine's
  own stale status govern any future gap. **Operational note for every
  future §21 data audit: never run the portwatch leg Tuesdays
  11:00–14:00 UTC** (the maintenance window).
- **Who decided:** this session (S21). **Revisit:** none (the window is
  the provider's own schedule; the runbook note above is the fix).

## 2026-11-10 — BD-S21-parallel: the duplicate S21 arrival's counterpart close — the shipped S21 (already delivered at HEAD `84486c0`, deployed as currena-api `5593fd43`/currena-markets `8f63c8fa`, Phase J CLOSED) honoured under the deployed-state rule and INDEPENDENTLY re-verified by this session's own gates; no re-deploy, no shipped-code change

- **Event (the fourth arrival pattern, this time on S21):** this session
  started from the standing S21 kickoff prompt ("Session 21/30 · Phase J ·
  the spec-vs-implementation audit") — but the fresh clone showed
  origin/main already carries the S21 delivery whole (M1 `733302d` + M2
  `f170fd3` + M3 `84486c0`: the four fixes, AF-6/AF-7, the placement
  regeneration, the BD-S21a–e records, the DEPLOY.md session record, the
  roadmap delivery record + progress board, the HANDOFF rewritten for
  S22) with a clean working tree — the slot was executed and closed
  before this arrival ran. Per the hardened rule from BD-S18-parallel-3
  ("launch exactly ONE session per roadmap slot"), this session did NOT
  re-execute S21; it ran the counterpart close instead.
- **The independent re-verification (this session's own, all green):**
  (1) the FULL GATES on the shipped tree — ALL GREEN in 2m 46s (secret
  scan 8/1020 · tsc 6/6 · eslint 0/0 · copy:audit clean · narrator in
  sync + eval 50 · layer1 11,819/11,819 · the suite **15,102 — exactly
  the S21 record's count** · build + budgets held, entry 272.88/82.55 —
  byte-identical to the record); `pnpm placement:generate` regenerated
  the §14 table with ZERO diff against the committed doc (184 ids · 0
  unplaced · 0 duplicate homes · the AF-1…AF-7 findings section). (2)
  ALL ELEVEN live pd-* backtests re-run vs production currena.ir —
  **715 checks ALL GREEN** (s4 Global 84/84 + the narrator raw-KV
  stateHash recompute IDENTICAL · s5 150 · s7 56 · s8 9 · s9 115 ·
  s10 115+48 · s12 8 · s14 11 · s16 28 · s17 24 · s18 14+16+23). (3)
  The §21 data audit (the S20 tool, frozen seed) re-run — **ALL 20
  GREEN** (19 byte-exact + platinum's recorded live-spot arm at a 0.90%
  intraday move), with chokepoint-malacca verified green OUTSIDE the
  PortWatch Tuesday-maintenance window exactly per BD-S21e's runbook
  note (the probes ran ~17:50 UTC, after the 14:00 UTC window close).
  (4) The production deploy-state cross-check via the Cloudflare API:
  currena-api's latest version is **`5593fd43`** (version 358, uploaded
  2026-11-10T11:48:55Z — the S21 deploy; version 357 = `74777037`, the
  rollback lever) and currena-markets' latest is **`8f63c8fa`** (version
  31) — the deployed truth the records state. (5) The browser pass on
  production: the S21 surfaces re-proven — the NZX50 card READY on
  /asia-pacific at 1440×900 + 360×844 in en + fa (en: "S&P/NZX 50 ·
  14,167.41 · +1.3% 1d · 100 percent of its 52-week range · Data as of
  Nov 10, 2026"; fa: «شاخص ۵۰ شرکت بزرگ نیوزیلند | ۱۴٬۱۶۷٫۴۱ | +۱٫۳٪
  ۱ روز | طی روز گذشته | ۱۰۰ درصد از دامنهٔ یک‌ساله خود») with its
  REAL /australia link; the false "rides the Asia zoom map" sentence
  GONE in both locales while the Korea/India TRUE zoom sentences stay
  and the zoom still seats its six world-board Asian indices; the
  Global header verified BOTH ways (the fresh path's single data-as-of
  line; the cached path — exercised live by blocking the API — renders
  "Showing the last good copy — data as of Nov 10, 2026" REPLACING the
  plain line, the prices stamp staying: the BD-S21c fix); 0px
  horizontal overflow on every leg; ZERO console/page errors on all
  10 routes; every internal link resolves (no dead links).
- **Who decided:** this session, under the deployed-state rule (the
  BD-S18-parallel-2/-3 precedent: the production truth stands; a second
  execution over a live, gated, deployed one buys nothing but risk).
- **Revisit:** the owner-side launch discipline stands — exactly ONE
  session per roadmap slot; S22 (Phase K, the investor feedback) is the
  next slot, and its scope is already written in HANDOFF.md.

## 2026-11-12 — BD-S22: the S22 waiting-slot close — the investor review NOT yet arranged (verified against every record the program can read); the slot closed honestly as a WAITING slot, and the first reserve session (the §15 Asia CPI fill session) PULLED FORWARD into the Session 23 slot

- **Event:** the S22 kickoff (Session 22/30 · Phase K OPENS — the investor
  feedback → spec v2) arrived with its standing scope — collect the
  external investor's answers to spec §19, record them as D-49+ in the
  strategy log, produce the spec v2 entries (the AF-1…AF-7 spec-side
  drift findings riding the pass) — but the session carried **no investor
  answers**, and no investor-side artifact exists anywhere the program
  can read: origin/main (HEAD `384dfd1`, the S21 counterpart close, clean
  tree) holds nothing past the S21 records; the GitHub issues/PRs carry
  nothing since PR #47 (2026-11-08, the root tidy-up); no uploaded file
  accompanied the session; and HANDOFF's owner-side lever #8 ("Arrange the
  investor review — the S22 gate") still stands unanswered. **The review is
  not yet arranged; the S22 input does not exist.**
- **The close (honest, per the owner's standing instruction for this slot
  and the roadmap's own reserve rule):** S22 closes as a **WAITING slot** —
  NO answers collected, NO D-49+ recorded (the strategy log §5 carries the
  explicit Round-4 pending marker instead), NO spec v2 entries produced,
  and the AF-1…AF-7 spec-side drift findings REMAIN parked for the spec v2
  pass (never silent edits — the spec file was not touched). No deploy: a
  records session; nothing was fixed, so nothing shipped. The slot is
  consumed honestly — **Session 22/30 · 8 remaining.**
- **The reserve pull-forward (the roadmap's reserve rule — the buffer
  exists for delayed work):** the first reserve session is pulled forward
  into the **Session 23 slot**: **the §15 Asia CPI fill session** — the
  dedicated fill session carried since S14 (BD-S14a/BD-S15d), whose source
  options the roadmap's current-position note already records (the
  national statistics bureaus directly — the Statistics Bureau of Japan,
  KOSTAT, MoSPI; a fresh FRED/IMF IFS series; or the World Bank annual as
  the lower-resolution fallback). S23's own scope (feedback build changes)
  is **DEFERRED** — it is blocked on the same investor input; when the
  answers arrive, the next free slot re-opens the investor round (collect
  → D-49+ → spec v2 → the build). The ecb-drf provider timeout stays
  queued for a later maintenance slot (unchanged).
- **Who decided:** this session (S22), under the owner's standing
  instruction ("if the investor's review is NOT yet arranged, S22 becomes
  a waiting slot: close it honestly as such and pull a reserve session
  (S25+) forward per the roadmap's rule — do not invent work").
- **Revisit:** the owner's lever stays — **arrange the investor's review
  of spec §19 (the seven questions)**; the S22 collection work re-opens at
  the next free slot the moment the answers exist. Until then Phase K's
  investor-dependent slots wait and the reserve/buffer work (the fill
  session first) keeps the program moving.

## 2026-11-12 — BD-S23a: the §15 Asia CPI fills — the viable monthly source PICKED AND VERIFIED (the IMF SDMX 3.0 CPI dataflow; Rule 5 satisfied at BOTH venues + three national-bureau second voices; the FRED OECD mirror family stays DEAD)

- **Decision:** the three D-36 Asia §15 fills (Japan · Korea · India CPI
  YoY) ingest from the **IMF's own SDMX 3.0 CPI dataflow**
  (`IMF.STA/CPI/5.0.0`, the dedicated Consumer Price Index dataset on
  the SAME api.imf.org host the COFER adapter already rides —
  gap-closure S6-M6.3). One keyless request per country
  (`{CC}.CPI._T.YOY_PCH_PA_PT.M`) serves the provider's OWN
  year-over-year percent-change transformation (never a Currena-derived
  YoY) with the full monthly history (JPN 849 obs 1956-M01→ · KOR 891
  obs 1952-M08→ · IND 823 obs 1958-M01→) — exactly the "fresh FRED/IMF
  IFS series" option the roadmap names (the IMF reorganized the old IFS
  prices block into the dedicated CPI dataflow; the venue, licence and
  adapter pattern are the recorded COFER precedent).
- **Rule 5 verification (all green, 2026-11-10/12):**
  - **Sandbox venue:** all three URLs answer HTTP 200 `application/json`
    (~56–61 kB each, ~1.4 s) with fresh monthly tails — JPN through
    2026-M09, KOR through 2026-M10, IND through 2026-M07.
  - **Production (Worker) egress venue — the temp-probe pattern
    (S1-M1.1/S6-M6.3, a throwaway `currena-probe` run through
    `wrangler dev --remote`, deleted after the read):** all three URLs
    answer HTTP 200 `application/json`, **byte-identical to the sandbox
    fetches** (JPN 58,498 B · KOR 61,187 B · IND 56,625 B; the SHA-256
    of each response's first 4 kB matches the sandbox fetch exactly),
    ~0.4–1.2 s.
  - **Second voices (the BD-S14a cross-check publishers):**
    - **Japan** — the Statistics Bureau's own latest-results page (live
      read): Sep 2026 all-items **+2.1% YoY** (2025-base, published
      2026-10-23) vs the IMF's 2.2321% on the pre-revision base — same
      month, same series lineage; the 0.13pp wedge is the bureau's
      Aug-2026 2025-base re-weighting (the IMF continues the previous
      base; its own IX series internally reproduces its YoY exactly:
      114.5 ÷ 112.0 = +2.232%). Vintage verified CURRENT via the
      bureau's own release schedule (Sep out Oct 23; Oct out Nov 20 —
      the mirror carries the freshest print that exists).
    - **Korea** — the national release itself (2026년 10월
      소비자물가동향, served via the 국가데이터처 press-release portal;
      kostat.go.kr's own site is under maintenance): October consumer
      prices **+2.8% YoY** — the IMF mirror (2.8189% → 2.8%) matches
      EXACTLY, and it is the freshest print (published ~Nov 1).
    - **India** — MoSPI's own July 2026 press note (fetched live from
      mospi.gov.in): all-India CPI **4.45% (Provisional)** vs the IMF's
      4.4412% → 4.44% — the same number within display rounding. The
      mirror's India publication lag is MEASURED (the frozen vintage
      dataflows + today's live read): the IMF ingests India with a
      T+1..T+3-month lag (today: MoSPI's freshest is Sep 2026 = 5.54%
      per its own homepage; the IMF carries Jul) — the card's honest
      maxAge is set accordingly (150 days, labelled in copy) and the
      India card names the mirror's lag.
    - **World Bank annual cross-check:** the IMF monthly YoY 2025
      averages reproduce the World Bank's independently-compiled
      `FP.CPI.TOTL.ZG` annual figures (recorded live in BD-S14a)
      EXACTLY — JPN 3.178 vs 3.17 · KOR 2.123 vs 2.12 · IND 2.426 vs
      2.40.
- **Options considered:** (A) the national bureaus directly — REJECTED
  for this session: KOSTAT's own site is under maintenance (only the
  KOSIS/국가데이터처 portals answer, and KOSIS is a JS portal with no
  keyless data route); MoSPI serves its numbers through press-note PDFs
  (no PDF parser in the Worker stack) and a per-month item-level XLSX
  (7.8 MB, one month per file, unstable timestamped URLs — a fragile
  multi-file chain for one card); e-stat (Japan's portal) requires an
  appId. (B) the IMF SDMX 3.0 CPI dataflow (CHOSEN — the
  already-integrated venue, the provider's own YoY series, full
  history per fetch, keyless, L1 licence recorded since COFER). (C)
  the World Bank annual fallback — rejected as the lower-resolution
  option (annual, not the monthly cadence the spec §15 asks for) now
  that a verified monthly source exists.
- **The cadence gates:** Japan rides at T+0 (the mirror carries the
  bureau's freshest print); Korea at T+0; India at T+1..T+3 — the
  staleAfterDays are set per country (JP 75 · KR 75 — the monthly
  convention; IN 150 — the honest mirror-lag grace, labelled in the
  card copy), and the fetch rides rung2's first-of-month gate + the
  missing-history bootstrap (3 subrequests on the 1st, ~11 total on
  the rung — the ceiling arithmetic stays safe).
- **Who decided:** this session (S23, the pulled-forward S25 fill
  session) under Rule 5 + the roadmap's recorded source options.
  **Revisit:** the India mirror's lag — if the IMF's India ingestion
  ever stalls past the 150-day grace, the card honestly reads stale
  (the fail-closed design); a later maintenance session may re-check
  whether the IMF rebases Japan onto the bureau's 2025-base (the
  0.13pp wedge closes when it does) or whether MoSPI grows a stable
  keyless machine-readable route.

## 2026-11-12 — BD-S23-parallel: the duplicate Session-23 arrival reconciled onto the pushed implementation (BD-S18-parallel-3/BD-S21-parallel discipline); this session runs the counterpart close — the KV seed + the live verify + the records

- **Event:** two agents worked the SAME pulled-forward Session-23 slot
  (S25, the §15 Asia CPI fill session) in parallel. The parallel arrival
  landed M0–M5 on origin/main (M0+M1 `6bfe87b` [the shared opening —
  BD-S23a's source verification]; M2+M3+M4 `67afc3b`; M5 `5ce9925`) and
  DEPLOYED currena-api **`2c61c187`** @ 100% (2026-11-10 ~23:04 UTC —
  the new Worker code + the new SPA; the deployed entry chunk
  `index-De-odUOp.js` byte-matches the local build of `5ce9925`); this
  session's own M2–M5 work (a parallel implementation of the same fills:
  prices-heat lane · P1 · full-history fixtures · the same AF-8 +
  docs discipline) was pushed FIRST and REJECTED — the fast-forward
  refusal exposed the collision.
- **The reconciliation (the hardened parallel-session rule, BD-S18-
  parallel-3 / BD-S21-parallel):** one prompt = one session = one slot —
  the slot was NOT yet fully delivered (no KV seed, no live verify, no
  close records), so this session does NOT re-execute and does NOT
  merge two implementations: the local duplicate is preserved verbatim
  on the local branch `archive/s23-duplicate-m2-m5` (the
  `archive/s18-duplicate-m2` precedent) and the tree is reset onto
  origin/main — the PUSHED implementation is the record.
- **The independent re-verification (never trust, verify):** this
  session re-verified the shipped tree with its OWN gates + its OWN
  live reads: (a) the fixtures/s25 captures' tails match THIS session's
  OWN independent live fetches EXACTLY (JPN 2.232142857142857 @
  2026-M09 · KOR 2.818940555271674 @ 2026-M10 · IND 4.44121915820029 @
  2026-M07 — the BD-S23a-verified values, Rule 5 re-satisfied at the
  sandbox venue by a second agent); (b) the FULL `pnpm gates` re-run on
  the shipped tree — ALL GREEN, 2m 45s (secret scan 8/1025 · typecheck
  6/6 · eslint 0/0 · copy:audit clean · narrator 193×2 + eval 50 ·
  layer1 11,969/11,969 · the suite 15,267 · build + budgets held — the
  AsiaPage chunk 16.20/4.07 within its re-based 16.5/6.0 row); (c) the
  browser pass over the freshly built SPA (the local preview, /api
  proxied to currena.ir): 14 cards (china 7 · japan 3 ·
  korea-taiwan-hk 1 · india 1 · pacific-nz 2), the zoom's 6 indices,
  0px overflow at 1440×900 + 360×844 in en + fa/RTL, ZERO console/page
  errors, the three CPI cards honestly "Cannot read yet" against the
  not-yet-seeded feed.
- **The recorded implementation deltas (the pushed implementation
  governs; recorded for the record, none blocking):** the lane is
  growth-health (beside china-cpi) not prices-heat; phase P2 (no
  P1-unavailable page-degraded alert for the fill cards); the fixtures
  are decade-trimmed captures (129–130 obs, floor ≥60) not full-history
  captures; layer-1 entries ARE written (the vocabulary 193×2); the
  AsiaPage budget row re-based 16/6 → 16.5/6.0 (justified in the
  changelog).
- **The counterpart continuation (this session's remaining M6):** the
  KV seed (rung2-run --imf-cpi — the landing lever) + the live verify
  (pd-s14 vs production + the browser pass on currena.ir) + the close
  records. First seed attempt 2026-11-10 23:24 UTC: the THREE FETCHES
  SUCCEEDED (japan-cpi 2.232142857142857 @ 2026-09-30 pct10y 64% ·
  korea-cpi 2.818940555271674 @ 2026-10-31 pct10y 73% · india-cpi
  4.44121915820029 @ 2026-07-31 pct10y 46% — computed readings, exactly
  the BD-S23a values) but the KV WRITE hit the account's daily
  free-tier cap (HTTP 429 code 10048, the documented ~19:00-UTC
  exhaustion, DEPLOY.md's insights-ingestion note) — the phase aborted
  BEFORE any write (the snapshot PUT is the first write; the clean
  re-run re-does everything). The seed re-runs after the 00:00 UTC
  counter reset.
- **Who decided:** this session (the second arrival) under the hardened
  parallel-session rule. **Revisit:** none — the reconciliation is the
  record; the KV-cap pattern is the documented operational reality (the
  04:20 UTC GHA/Worker rungs self-heal any missed seed).

## 2026-11-12 — BD-S24: the S24 legacy retirement readiness review — the D-9 condition MET (every one of the 187 ids verified categorized; 18 checks green via the new re-runnable audit); the retirement checklist landed spec-grade; the execution does NOT ship (the timing is investor question §19.6); the audit's doc-side drift reconciled same-session, doc-only

- **Event:** the Session 24 slot ran the D-9 audit — the retirement gate
  D-9 (strategy log Round 1: "the old all-in-one page is kept for now;
  retired only when every indicator is properly categorized") + spec
  §13's "the retirement readiness review is roadmap S24". The investor's
  §19 answers had NOT arrived (verified: the kickoff scopes S24;
  origin/main at HEAD `9fa6b85` = the S23 close; the GitHub issues/PRs
  hold nothing since PR #47 [2026-11-08]), so per the kickoff prompt the
  slot ran S24, not the investor round.
- **The audit (the deliverable's §2, `pnpm s24:d9-audit` —
  `scripts/s24-d9-audit.ts`, deterministic, exits non-zero on red):**
  18 checks across the three layers, ALL GREEN — registry ↔ DEFINITIONS
  1:1 (187 = 187, per-id group + section match) · one lane per id + the
  13 lanes' counts reconcile · the gauge membership (one gauge per
  member; the registry's own `area.gauge` field ↔ GAUGES 1:1 [74 named,
  113 null]; the documented B-14 brent record — the one gauge≠lane id;
  the voting/shadow coherence: the 8 voting gauges score exactly the 54
  scored rules, the 4 shadow gauges mirror only context members per
  G-5) · the placement (`reconcilePlacement` green: 187 placed · 0
  unplaced · 0 duplicates · 0 unknown · 0 mirror overlaps; one home per
  id; Global zero homes by design) · the gold meter's 37 voters ⊆ the
  registry (the documented dual-membership engine, spec §3.3) · the
  role counts (54 V + 133 C = 187; the gauges' 74 members = 54 voters +
  20 shadow context) · the lane-render exceptions (17 + 6 + 7) all
  categorized · the §A record (every id present, roles correct, header
  counts match). PLACEMENT.generated.md regenerated byte-identical.
- **The findings + the reconciliation (doc-only, zero code, zero
  deploy):** the code layers had ZERO structural drift; the DOC layers
  had drifted — AGENTS §A's headers were three program-generations
  stale (161/48/113 + 125/32 + 36/16 vs the registry truth
  187/54/133 + 149/38 + 38/16), 23 rows were missing (the GF-P2/P3
  voters real-yield-5y + bank-stress + cftc-gold-gross-long + the
  dollar twins + the UoM 5y seat; the context families rstar-us ·
  debt-to-gdp · real-curve-10y5y · usdchf · cpi-nowcast · cpi-surprise
  · gold-equities-ratio · global-liquidity; the gold-system block
  incl. the DISABLED quartet), and the S4-M4.4 §A update had placed
  coal-aus + lng-japan + gas-europe under the geo-fragmentation heading
  while the definitions carry them in au-trade-currency (×2) +
  prices-heat. All reconciled this session: §A now carries exactly the
  registry's 187 rows (the new H checks pin it inside the audit —
  future §A drift fails `pnpm s24:d9-audit`); IADS §1 (the 187/54/133
  header + the gauge-table voter counts + the 25 missing alphabetical
  rows); 04-INDICATORS (the 187 header, growth-health 27 → 30 — the
  three CPI fills + michigan-1y-expectations, the 04-side gap — §10's
  183-of-187 public line).
- **The retirement checklist (the deliverable's §4–§8,
  `docs/page-division/06-LEGACY-RETIREMENT-S24.md`):** the per-item
  "what breaks" with per-item evidence (R-1 the route + redirect — the
  A/B decision: plain normalization vs the card-aware redirect via
  `homePageOfIndicator`, option B recommended, presented for the owner;
  R-2 the banner/nav/copy-keys exit; R-3 the region verdicts only
  /insights carries; R-4 the two global shadow-gauge question headers;
  R-5 the details panels + the per-id history — the largest gap, the
  port recommended; R-6 the narrator's full set; R-7 the
  watchlist/search/exports; R-8 the calendar/About/Together/MoneyPanel/
  US-global-reach) + the per-page gap table + the
  sign-off-gated execution plan (Gate 0 = the owner's §19.6 answer) +
  the execution session's done criteria. Every claim verified against
  the tree this session (the DetailsPanel single-import grep, the
  destination cards' non-interactivity, the component-render maps, the
  router's boot-guard behaviour).
- **Execution does NOT ship:** spec §19.6 asks the investor "when would
  you retire the legacy page: after the placement audit (S24, now
  done), or after a burn-in period of parallel running?" — the owner +
  the investor round own the timing; the execution rides a reserve
  session (S26–S30) behind the recorded sign-off. NO deploy: the
  session touched docs + one new devDependency-free script only; the
  full gates re-ran ALL GREEN on the records tree (the suite 15,268 =
  exactly the S23 close count — zero code changed); production stays
  currena-api `33ff60c0` + currena-markets `8f63c8fa`.
- **Who decided:** this session (S24) under the roadmap's S24 scope +
  D-9's own condition. **Revisit:** Gate 0 of the execution plan — the
  owner's §19.6 answer (directly, or via the investor round when the
  §19 answers arrive); the accepted-losses list (R-3/R-4/R-6/R-7/R-8)
  is decided at that same gate, recorded in DECISIONS.md with the
  burn-in evidence.

## 2026-11-12 — BD-S25: the first reserve session runs the ecb provider-timeout maintenance — the failing leg is the ECB HICP fetch (not the DFR the handoff note named); the provider-side cause measured live (the ECB gateway's ~30.2 s HTTP 504 roulette on ANY request from Worker egress); the fix ships the stable full-history HICP request + the 45 s patient single attempt; the rung-level proof rides the standing sweeps

- **Event:** the Session 25 slot. The owner's kickoff supplied NO investor
  §19 answers (only the session credentials), so per the kickoff's own
  rule the slot ran the first reserve item — the queued ecb-drf provider
  timeout maintenance (HANDOFF's owner-side lever #7). The retirement
  execution stayed untouched (behind the recorded §19.6 sign-off, per the
  S24 checklist's Gate 0).
- **The diagnosis (evidence-first, per Rule 5):** the live status blob
  (KV `insights:status`) + the public `/status` + the KV daily archives
  pinned the failing row: the ECB **HICP** leg
  `HICP/M.U2.N.000000.4D0.ANR` — "The operation was aborted due to
  timeout" at the 12 s default, every rung 2026-11-06 → 2026-11-11
  (04:10 + the 10:10 sweep), while DFR + AAA stayed green (the DFR's
  one Nov-10 manual-run blip self-healed). The last healthy HICP fetch:
  2026-11-05 04:10 (the morning the 2026-10 flash landed).
  `euro-hicp` held on last-good 4.0 @ 2026-10 — Eurostat's own
  2026-11-04 flash print, verified EXACTLY (4.0 Oct · 3.8 Sep · 3.2 Aug
  against the publisher's own releases). The handoff note had named the
  lever "ecb-drf" (the source row's own name); the maintenance session
  corrected the record: the failing LEG is HICP — the note's substance
  (a provider timeout held honestly) was right, its id was wrong.
- **The venue probe matrix (the temp-probe pattern, a throwaway worker
  via `wrangler dev --remote`, deleted after):** the ECB API gateway
  INTERMITTENTLY answers HTTP 504 after ~30.2 s on ANY request from
  Worker egress — any series, any shape (probe v2: a no-filter HICP
  request 504'd in one minute and answered 200 in ~1.9 s the next; the
  DFR control itself 504'd in the same probe run while four HICP shapes
  — csvdata filtered/unfiltered · dataonly · jsondata · lastN —
  answered 200 in <2 s; the sandbox venue fast throughout). A
  per-request roulette, UNDOCUMENTED by the provider (their
  status-codes page covers only 500s as "an issue on our side… try
  again later"; the portal's feedback form lists "Performance problems /
  API issues" as known categories). Options considered: request-shape
  changes (disproven — no shape avoids the roulette); a retry (rejected
  — F-11 forbids retry loops; the 10:10/20:10 sweeps ARE the designed
  hours-level retry); a second venue (the Eurostat-origin dissemination
  API — RECORDED as the escalation if the leg keeps failing, a
  new-adapter session of its own: Rule 5 + the licence read + the §A
  discipline).
- **The fix (strictly-improving-or-neutral on every path):**
  `ecbHicpUrl()` = the stable unfiltered full-history URL (the DFR
  discipline — the same URL every day, never the rolling startPeriod;
  content verified at both venues: 358 rows 1997-01 → 2026-10, the old
  decade window byte-equal as the tail) + `ECB_PORTAL_TIMEOUT_MS =
  45_000` on all four portal legs (DFR · HICP · AAA · BSI; F-11 kept —
  ONE honest attempt, more patient; the COFER 15 s + brent 15 s
  precedents) + the two regression pins in `adapters.test.ts` + the
  truthfulness updates (sources.ts ecb-portal usedFor → all four legs +
  the notes record; RISK_REGISTER row + change-log row; IADS §2 ecb
  row). NO indicator, definition, placement or §A row changed — the
  D-9 standing audit re-run MET (belt-and-braces).
- **Gates + deploy:** the full gates ALL GREEN twice (2m 39s + 2m 41s;
  the suite 15,270 = +2 pins; budgets held); deployed currena-api
  `3e568964` (12:12 UTC) then `9861a927` (12:21 UTC — the
  evidence-corrected tree; production ≡ HEAD `0568232`); currena-markets
  untouched (`8f63c8fa`); the SPA byte-identical; the post-deploy smoke
  green (the API + all 10 routes). The rung-level proof rides the
  standing schedule: tonight's 20:10 sweep (the status still carries
  failures → it fires) + tomorrow's 04:10 rung — mind the KV write-cap
  window (the 04:10 rung always lands fresh).
- **Who decided:** this session (S25) under the roadmap's reserve
  scope + the handoff's queued item. **Revisit:** the next session's
  FIRST check — the status endpoint's ecb row after the coming
  rungs/sweeps; if the HICP leg still fails across multiple days, the
  recorded escalation options (the ECB provider channel; the
  Eurostat-origin fallback session) come to the owner for the choice.
- **Addendum (mid-session evidence, 2026-11-11 11:57:33 UTC):** a
  Node-venue ingest ran mid-session (a GHA `insights-ingest`
  workflow_dispatch — the FETCHED F2 row proves the Node venue; the
  tree was the pre-fix S24 close): the HICP leg FETCHED (a good
  roulette window — same value 4.0 @ 2026-10) while the AAA leg timed
  out in the SAME run. The roulette is therefore PER-REQUEST and
  venue-independent (Worker egress + the production schedule + the
  GitHub-runner venue all carry it; this session's sandbox stayed fast
  throughout — an egress-routing outlier, not a fix). The posture is
  unchanged; the evidence got stronger.

## 2026-11-11 — BD-S26: the second reserve session runs the ecb FIRST-CHECK follow-through — the live status at session open was still the PRE-FIX 11:57 run (no post-fix rung had carried the new code yet), so the session generated the missing evidence itself via the belt-and-braces path: the post-fix full collect (DFR ❌ 504 · AAA ✅ · HICP ❌ 504 — the honest designed failure shape), the held/fresh card values verified EXACTLY against the publisher's own API, and the roulette now measured at ALL THREE observed venues (the sandbox included); the verdict stays PENDING, riding tonight's 20:10 sweep + tomorrow's 04:10 rung

- **Event:** the Session 26 slot. The owner's kickoff supplied NO investor
  §19 answers (only the session credentials), so per the kickoff's own rule
  the slot ran the standing branch's reserve items: the FIRST CHECK (the
  S25 follow-up) + the post-fix evidence generation. The retirement
  execution stayed untouched (behind the recorded §19.6 sign-off, per the
  S24 checklist's Gate 0).
- **The first check read (the honest state at session open, 2026-11-11
  ~14:05 UTC):** the live status blob (KV `insights:status` + the public
  `/status`) was generatedAt **2026-11-11T11:57:33.966Z** — the mid-day
  Node-venue run on the PRE-FIX tree — carrying ONE red row (the AAA leg's
  12 s timeout abort; 51/52 green). The S25 fix was verified deployed
  (currena-api `9861a927` @ 100 %, created 12:21:26Z, via the Cloudflare
  deployments API) but **NO scheduled rung had carried the new code yet**
  — the first is the 20:10 UTC sweep tonight (armed: the status carries
  `kind: failed` rows → `sweepShouldFire` true). NEITHER kickoff branch
  applied (not green-with-clean-rungs; not failing-across-multiple-days of
  the new code): the verdict was **PENDING** on evidence that did not yet
  exist.
- **The record correction (S25's addendum, one detail):** the 11:57 run
  was the daily **schedule** event (the 04:20 cron delayed ~7.6 h by
  GitHub's scheduler queue — the week's scheduled runs landed 11:22–13:00
  UTC every day), NOT a `workflow_dispatch` as BD-S25's addendum recorded;
  the GitHub API's run record (id 43016096779, `event: schedule`, head
  `6cb5d54`) is the authority. The substance stands unchanged (the Node
  venue, the pre-fix tree, the HICP-fetched + AAA-timed-out same-run
  evidence); the belt-and-braces schedule delay is itself worth knowing —
  the 04:20 belt-and-braces has effectively become a ~12:00 UTC run in
  practice (still inside the fresh KV slice, still belt-and-braces for the
  Worker's own 04:10–04:40 rungs which run on time).
- **The post-fix evidence run (the session's action):** the sanctioned
  manual lever — a GHA `insights-ingest` `workflow_dispatch` on main
  (`ab1f316` ≡ the production tree; run id 43036550865, 14:14:23Z →
  14:17:17Z, ~2 m 51 s) — executed the FIRST post-fix full collect: **DFR
  ❌ HTTP 504 · AAA ✅ fetched · HICP ❌ HTTP 504** (the BSI leg rides
  rung2's monthly `liquidityMonthly` gate and did not run today); 50/52
  rows green; the two voting cards (`ecb-dfr`, `euro-hicp`) held on
  last-good and flagged stale; the run exited 1 BY DESIGN (the P1
  alerting). The error shape is exactly what S25 built: the honest row
  "HTTP 504 from data-api.ecb.europa.eu — single attempt, no retry
  (F-11)" — the gateway's OWN answer surfaced truthfully (not a client
  abort), the 45 s patience giving slow-but-alive paths the room the 12 s
  default denied. Within one day the roulette hit a DIFFERENT pair of
  legs than the 11:57 run (AAA↔HICP swapped, DFR newly bitten) — the
  per-request finding re-confirmed at the leg level.
- **The Rule-5 publisher verification (the same-series second voice,
  fetched live from the sandbox venue this session):** DFR **2.5 @
  2026-11-11** · HICP **4.0 @ 2026-10** (tail 3.2 Aug · 3.8 Sep · 4.0 Oct)
  · AAA **3.3308865271 @ 2026-11-10** — ALL THREE match the served/held
  card values EXACTLY (the run's own P1 lines agree digit-for-digit; the
  HICP tail re-matches Eurostat's 2026-11-04 flash sequence verified in
  S25). The public page remains truthful: the held cards carry the
  publisher's own freshest prints, the fresh card carries today's fetch.
- **The roulette evidence grew one venue further:** the SANDBOX hit it
  too, this session (the DFR control: HTTP 504 at ~31 s, then HTTP 200 in
  ~2 s one minute later on the identical request) — all three observed
  venues (Worker egress · the GitHub runner · the work sandbox) now carry
  the per-request roulette; S25's "sandbox fast throughout" was luck, not
  immunity. The provider-side condition is ACTIVE today, undocumented by
  the provider.
- **The verdict:** **PENDING** — the new code works exactly as designed
  (honest 504 rows, held-true cards, the sweep armed), but the post-fix
  posture is hours old; the kickoff's escalation trigger ("an ecb leg
  still fails across multiple days" of the NEW code) needs the coming
  days' rungs. The designed healing paths are all armed: tonight's 20:10
  sweep (the status carries failed rows) — mind the KV write cap (~19:00
  UTC; if the cap eats the sweep's writes, tomorrow's 04:10 rung owns the
  heal, harmless by design) — tomorrow's 04:10–04:40 Worker rungs + the
  ~12:00 belt-and-braces. The KV budget at the evidence run: 16 writes,
  0 cap-retries (the cap not yet hit at 14:16 UTC).
- **Who decided:** this session (S26) under the roadmap's reserve scope +
  the kickoff's FIRST-CHECK instruction + BD-S25's revisit clause.
  **Revisit:** the next session's FIRST check — the status endpoint's ecb
  rows after tonight's sweep + tomorrow's rungs (the real Worker-venue
  rung-level proof); if the post-fix days keep failing (the cards going
  user-visibly stale past their maxAge windows — not just honest failed
  rows on held-true values), the recorded escalation options (the ECB
  provider channel; the Eurostat-origin dissemination-API fallback
  session) come to the owner for the choice. NO deploy this session —
  the code is unchanged (production already `9861a927` ≡ HEAD); the
  evidence + the records are the deliverable.

## 2026-11-11 — BD-S27: the third reserve session (the buffer slot) runs the ecb first-check ROUND 3 + the buffer health pass — the 20:10 sweep's writes did NOT land (the blob unchanged at 20:17 UTC, the designed no-update branch: the post-~19:00 KV write-cap window), so the verdict stays PENDING riding tomorrow's 04:10–04:40 rungs; the maintenance item stays OPEN with NO escalation trigger (no card is user-visibly stale past its maxAge window); the buffer health pass ALL GREEN and production verified unchanged

- **Event:** the Session 27 slot — the third reserve session. The owner's
  kickoff supplied NO investor §19 answers and NO §19.6 sign-off, so per the
  kickoff's own rule the slot ran the reserve branch: the FIRST CHECK (the
  BD-S26 revisit, round 3) + the buffer health pass. The retirement
  execution stayed untouched (behind the recorded §19.6 sign-off, per the
  S24 checklist's Gate 0). The slot ran as ONE session across an
  interruption: an earlier instance opened it (M0, commit `cc1f069`,
  ~17:07 UTC — the parallel-session rule verified: origin/main at HEAD
  `8561e1d` = the S26 close, no S27 records existed) and landed M2a (the
  strategy-log §8 back-fill, commit `8dcde14`); this continuation
  re-verified the state, finished the slot's remaining milestones and
  closed it — the pushed implementation governs, nothing duplicated.
- **The first-check round 3 (the honest state, read at open and re-read
  through the session):** the live status blob (the public `/status` AND
  the raw KV `insights:status` read via the Cloudflare API) stayed
  generatedAt **2026-11-11T14:15:19.239Z** — the S26 post-fix evidence run
  — carrying exactly two `kind: failed` ecb rows (DFR + HICP, both
  "HTTP 504 from data-api.ecb.europa.eu — single attempt, no retry
  (F-11)") beside the green AAA row; 14/14 public validation checks green;
  the GHA run history confirms no run since the 14:14 dispatch. Production
  verified UNCHANGED: currena-api **`9861a927`** (the newest of 362
  versions, `modified_on` 12:21:27Z — nothing deployed since the S25 fix)
  + currena-markets **`8f63c8fa`** (newest; the markets endpoint serves
  200). The kickoff's evidence window (the 20:10 sweep + the 04:10–04:40
  rungs + the ~12:00 belt-and-braces) was NOT yet closed at open — the
  session watched the FIRST carrier live instead.
- **The buffer health pass (M2, 18:11–18:31 UTC, ALL GREEN):** the full
  `pnpm gates` 9/9 in 2m 45s — **the suite 15,270 = the S26 close count
  exactly** (the records-only tree; secret scan 8/1027 · typecheck 6/6 ·
  lint 0/0 · copy:audit · narrator in sync + eval 50 · layer1
  11,969/11,969 · build + budgets held, entry 272.88/82.55) — plus the
  D-9 standing audit re-run **18/18 PASS** (belt-and-braces, exit 0) and
  the live pd-* backtests **ALL ELEVEN ALL CHECKS GREEN against
  production**: pd-s4 Global 84/84 (incl. the raw-KV stateHash recompute
  IDENTICAL over the CF API) · pd-s5 Gold 150/150 · pd-s7 World Markets
  56/56 · pd-s8 zooms 9/9 · pd-s9 USA 115/115 · pd-s10 USA 115/115 + the
  TIC sub-gate · pd-s12 Europe 8/8 · pd-s14 Asia 14/14 · pd-s16 Australia
  28/28 · pd-s17 Commodities 24/24 · pd-s18 Currencies 14/14 + the
  rules/board gates. The beyond-grace cards (pd-s10/pd-s12 one each,
  pd-s16 seven) all honestly carry the engine's stale status — designed,
  none failing.
- **The sweep outcome read (M3, 20:16–20:17 UTC):** the blob UNCHANGED
  after the 20:10 sweep — the raw KV read confirms generatedAt
  **14:15:19.239Z**, the same two failed ecb rows, and the public
  snapshot still serves the held values (AAA **3.3308865271 @ 2026-11-10**
  fresh · DFR **2.5 @ 2026-11-11** held-stale · HICP **4.0 @ 2026-10**
  held-stale). This is the DESIGNED no-update branch: the account's free
  KV write budget (saturated by the ever-green crons by ~18:30–19:00 UTC
  daily) refused the sweep's writes at 20:10 — or the sweep did not fire;
  the two are indistinguishable on the available surface (the Workers
  observability telemetry query API answers success but projects zero
  rows for every query shape tried this session), and the designed
  fallback is IDENTICAL either way: **tomorrow's 04:10–04:40 Worker rungs
  own the heal in the fresh KV window.** The blob keeping the 14:15 stamp
  is harmless by design — the served cards stay publisher-true.
- **The verdict: PENDING (round 3).** The CLOSE branch did not apply (no
  rung or sweep carried the new code clean into the observable state
  today). The ESCALATION branch did not apply either: the trigger is
  "honest failed rows persisting across MULTIPLE DAYS of the NEW code
  with the cards going user-visibly stale past their maxAge windows" —
  the new code has ONE post-fix day, and NO card is past its window
  (DFR asOf 2026-11-11 = today, maxAge 7 · AAA asOf 2026-11-10, maxAge 7
  · HICP asOf 2026-10-01 = day 41 of 60). The escalation choice stays
  recorded and dormant (the ECB provider channel; the Eurostat-origin
  dissemination-API fallback session — BD-S25/BD-S26 + RISK_REGISTER).
- **The session's deliverable:** the evidence + the records + the M2a
  back-fill; **NO deploy** (zero code changed; production ≡ HEAD modulo
  the records commits; both workers verified unchanged above).
- **Who decided:** this session (S27) under the roadmap's reserve scope +
  the kickoff's FIRST-CHECK instruction + BD-S26's revisit clause.
  **Revisit:** the NEXT session's FIRST check — round 4: read the blob
  after tomorrow's 04:10–04:40 Worker rungs (the fresh-window carriers;
  the ~12:00 belt-and-braces behind them) and apply the same two
  branches: green ecb rows → the maintenance item CLOSES; failed rows
  persisting across the post-fix days with the cards going
  user-visibly stale past their maxAge windows → the escalation choice
  comes to the owner.

## 2026-11-11 — BD-S27-parallel: the Session 27 duplicate arrival reconciled (the counterpart close) — TWO concurrent instances ran the slot; the pushed close `a052631` governs and already integrates the earlier instance's M0/M2a; the later instance's local M4 close (rejected at push, zero force) is archived on `archive/s27-duplicate-m4`; the earlier instance's UNIQUE evidence now folded into the record: the 17:29 UTC live Rule-5 publisher verification (ALL EXACT), the HICP full-history backward growth at the provider, the pricesAsOf 20:13:18Z cron-alive + quota-tail evidence narrowing the sweep ambiguity, and the S20 data audit 20/20 GREEN

- **Event:** at 20:30 UTC the later instance's S27 close commit was
  REJECTED at push — origin/main had moved (`64de135` + `a052631`, the
  continuation's M2 checkpoint + M4 close, pushed 18:14→20:30 UTC) while
  the later instance was writing its own close from the shared base
  `8dcde14`. The hardened parallel-session rule applied verbatim: the
  PUSHED implementation governs; the local duplicate was NOT forced —
  it is preserved on the archive branch **`archive/s27-duplicate-m4`**
  (commit `9446094`); local main reset to `a052631`; this counterpart
  close reconciles and finishes the slot. Both instances ran the SAME
  session scope from the SAME kickoff (the duplicate-arrival pattern of
  BD-S18-parallel-3 / BD-S21-parallel / BD-S23-parallel; the S27 twist:
  the arrivals were CONCURRENT, ~3.5 h apart, each reading the other's
  commits as it went — the continuation's close already names the
  earlier instance's M0 `cc1f069` + M2a `8dcde14` as kept, nothing
  duplicated).
- **The independent re-verification (this counterpart, on the pushed
  tree):** the pushed BD-S27 record checked against the earlier
  instance's own concurrent ground truth — CONSISTENT on every material
  point (the 14:15:19Z blob with the two honest ecb failed rows through
  the session; the sweep-read no-update outcome; the verdict PENDING
  round 3 with the maxAge arithmetic; production `9861a927` +
  `8f63c8fa` unchanged; the gates 15,270; the 11 backtests green — two
  independent runs each, 17:2x and 18:2x UTC). FOUR pieces of the
  earlier instance's evidence were NOT in the pushed record; they are
  folded in by this entry (the substance, so no doc rewrite is needed):
- **(1) The 17:29 UTC Rule-5 LIVE publisher verification (the earlier
  instance, from the sandbox — a good roulette window):** all three ecb
  legs answered HTTP 200 in 2.0–4.0 s on single patient attempts —
  **DFR 2.5 @ 2026-11-11 · HICP 4.0 @ 2026-10 (tail 3.2/3.8/4.0) · AAA
  3.3308865271 @ 2026-11-10 — ALL EXACT matches** to the served/held
  values. The pushed record's "the served cards stay publisher-true"
  now rests on a same-day live fetch, not only S26's 14:20 one.
- **(2) The HICP full-history observation:** the provider's unfiltered
  series now returns **429 distinct monthly periods, 1991-01 → 2026-10**
  (zero duplicates — verified), vs the S25-recorded 358 rows from
  1997-01: the provider EXTENDED the history backward (~71 months)
  since the S25 probe. Content-neutral by construction (the parser is
  window-agnostic; the engine slices its own 10-year windows; the tail
  identical) — recorded for the ecb thread's continuity.
- **(3) The pricesAsOf 20:13:18.136Z evidence (narrows the pushed
  record's "indistinguishable" reading):** the :13 hourly prices rung's
  KV write LANDED at 20:13:18 — the Worker minute-cron was alive at the
  sweep minute, and the account's write quota was still serving at
  20:13. With the sweep's fire-path deterministic on the two
  `kind: failed` rows, the prior now strongly favors **the sweep FIRED
  and the cap refused its write chain** over "the sweep did not fire"
  (not certain — the prices rung is one write; the sweep's chain is
  snapshot+status+public and the refusal could have bitten between
  them — but the cron-alive + quota-tail evidence is new and material).
  The designed fallback is unchanged either way: tomorrow's 04:10–04:40
  rungs.
- **(4) The S20 data audit 20/20 GREEN (the buffer health pass's fourth
  leg):** the earlier instance ran `pd-s20-data-audit.ts` (seed
  20261112, ~17:33 UTC) — the N=20 random-id upstream cross-check over
  the stored 14:15 snapshot, **20/20 GREEN** (100 % match; platinum the
  one designed live-spot arm at 0.83 % intraday). The pushed record
  carries the gates + the D-9 audit + the 11 backtests; the data audit
  completes the pass at four legs, matching the S20/S21 regression
  standard.
- **Who decided:** the later instance under the hardened
  parallel-session rule (BD-S18-parallel-3 / BD-S21-parallel /
  BD-S23-parallel — the pushed implementation governs, the duplicate
  archived, the reconciliation recorded, the slot finished).
  **Revisit:** none — the slot's own revisit (BD-S27's round-4 first
  check) stands unchanged. NO deploy; zero code changed by either
  instance.
