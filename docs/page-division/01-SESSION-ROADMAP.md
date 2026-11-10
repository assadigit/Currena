# Currena — Page-Division Build · Session Roadmap

> **The 30-session execution plan** for the page-division spec
> (`02-PAGE-DIVISION-SPEC.md`), run under `AGENT-RULES.md` (docs/; consolidated into AGENTS.md §14).
> Every session reports progress as **`Session X/30 · Y remaining`**.
> Created 2026-11-07 · owner-approved order (D-20 + D-47).

---

## The session protocol (every session, no exceptions)

1. **Start:** read `../AGENT-RULES.md` → `01-SESSION-ROADMAP.md` (this file,
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

### ✅ S3 — Global page build · `Session 3/30` · delivered 2026-11-08
- The 10-tile verdict board (D-21), prices ribbon gold+brent+BTC (D-22),
  region chips with status dots (D-23), narrator line (D-24), dedollar
  context tile (D-25).
- **Gates:** one screen at 1440×900 AND 360×844; every tile shows verdict or
  explicit unread; ribbon shows live hourly values; chips link all 7
  destinations.
- **Deliverable:** the landing page (D-20).

**S3 delivery record (2026-11-08):** the landing page is REAL — `/` renders
the D-21 board on the S2 contract (`fetchPageProjection('global')` + the
markets/fx board attachments + the narrative client), with every verdict
re-derived client-side through the SAME pure engines (never invented
composites, D-48): `routes/page-division/global-tiles.ts` (the pure board
arithmetic — gauge tiles via `GAUGES`/`labelForVerdictStep`, the Gold
Balance via `goldBalance` + `goldOutlookOf`, the ribbon/dedollar readings,
the markets verdict via `marketsVerdictStep`, the fx §9.3 active count) +
`GlobalBoard.tsx`/`GlobalPage.tsx` (the tile views, the chips row, the
narrator line, the load/error/unread states, the last-good projection
cache). Two display-layer extractions landed verbatim with re-exports
(zero behavior change, the old tests green untouched):
`signals/outlook-core.ts` (the 7-state classifier) and
`world-markets/verdict-core.ts` (the markets verdict arithmetic) — both
needed lean-chunk-importable without the insights corpus's view modules.
**Three build-session decisions, recorded (not D-numbers — owner
ratification welcome, none blocking):** **BD-S3a** (the D-23 chip dots
mirror REAL engine verdicts only — Markets ← the markets verdict,
Currencies ← the fx signal; the four regions + commodities show the honest
neutral "no verdict at this layer yet" dot until their pages' own verdicts
exist, because averaging gauges/voters into a chip status would be an
invented composite, D-48); **BD-S3b** (the gauge tiles' links: the four
US-framed gauges → `/usa` where D-30's verdict strip tops the page, Dollar
Strength → `/currencies`, its detail cards' home by D-32); **BD-S3c** (the
mobile board is 2-col, not the spec §4 sketch's 1-col — ten verdict tiles
cannot fit 844px in one column without clipping, and D-11's zero-scroll
rule outranks the sketch; the ribbon rides as a regular row-layout tile).
**One honest deviation, recorded:** D-22's "day change" — the projection's
readings carry `change7d`/`change30d` (the live-merge fields) but NO
day-change field, so the ribbon shows the live value + the labelled
7-day change (screen-reader words included); a true day change needs the
history endpoint (3 extra fetches on the landing page) — S4's call, never
a silent guess. **One live defect found in dev and fixed:** the projection
client's promise cache poisoned later callers when one caller aborted
(React StrictMode's double-mount froze the page at loading forever) —
signal-carrying calls now bypass the cache and the page owns cancellation
via settled flags (the S3 test suite pins the paths). **The copy:** ~66
new `pd.global.*` keys (en+fa) with the verdict WORDS pinned
byte-for-byte to the insights corpus by `global-copy-pin.test.ts` (both
locales — one verdict language everywhere, D-48); 62 new fa strings
queued unreviewed in the Persian copy manifest (+2 retired S1 keys
removed). **Gates ALL GREEN (2m13s: secret scan 8/914 · tsc 6/6 · lint
0/0 · copy:audit clean · narrator in sync + eval 50 · layer1
11,819/11,819 · the suite **14,715 = +37** (global-tiles 19 · copy-pin
11 · GlobalPage characterization 7) · build + budgets held — entry
268.73/81.36, Insights 1592.34/368.99, **the new GlobalPage chunk
31.89/9.41 vs its new 36/11 budget row**). Browser-verified live (the
remote-dev Worker over real KV): one screen at 1440×900 AND 360×844 in
BOTH en and fa (RTL, Persian digits), every tile carrying its verdict or
unread state, the ribbon's live hourly values, all 7 chip links, the
narrator's real :50 artefact, the A11y tree naming every tile + chip dot
state, and a VLM visual review pass (which caught the first build's
Bitcoin-clipping ribbon — fixed to the row layout). Not deployed (the
Worker code is unchanged since S2; the deploy stays the owner's lever).

### ✅ S4 — Global gates & polish · `Session 4/30` · delivered 2026-11-08
- Verdict-consistency backtest: every Global tile byte-identical to engine
  snapshot values; narrator wired to the :50 cron artefact.
- Full mobile pass, keyboard/ARIA pass, empty/error states.
- **Gates:** all green; commit pushed; hand-off prompt for Phase B.

**S4 delivery record (2026-11-08):** Phase A is CLOSED — the landing page
is verified to the §21 zero-tolerance standard. **The verdict-consistency
backtest, both halves:** `global-backtest-core.ts` (the pure comparison —
the PAGE's `global-tiles` derivations over the served projection vs the
ENGINE's own arithmetic over the served snapshot, the engine side spelled
out through `gaugeReading`/`goldBalance`/`evaluateSignal`/`goldOutlookOf`/
`marketsVerdictStep`/`summarizeMarkets`/`summarizeFxRules`/`fxRuleView`,
never through the page module, so drift surfaces red) + the offline suite
test (`global-backtest.test.ts`, 8: the full pipeline over a synthetic
snapshot, the public-projection twin, the markets exit-buffer divergence
as a designed note, three FAIL-CLOSED proofs — a flipped voter, a mutated
ribbon value, a dropped gold voter — and the key-order-immune
`stableStringify`) + the LIVE script (`apps/web/scripts/pd-s4-backtest.ts`
— the five feeds aligned on generatedAt+pricesAsOf, zod-validated, the
narrator wiring walk incl. the raw-KV stateHash recompute over exactly
the documents the :50 cron reads). **THE LIVE RUN over the remote-dev
Worker on real KV: 84 checks · 84 green · 0 red** — every input rides the
projection (52/52), every gauge step+word+counts identical, the Gold
Balance [2,1,2,0] net 1 readable 5 outlook bullish identical, markets
attention/step 3/RAW 7-correction 2-bear identical (the buffered
nAttention 5 vs RAW 7 divergence reported as the designed S1-M1.6 #2
note, never a failure), fx normal/0/0 identical, the ribbon+dedollar
readings byte-identical (gold 4072.10 · brent 98.32 · btc 75808.37), and
**the narrator's stateHash recompute IDENTICAL — the stored one-liner
speaks about exactly the state the pages serve** (the artefact's overall
unit was last regenerated 2026-11-07; `doc.dataAsOf` 2026-11-07 vs the
snapshot store 2026-11-07T20:11Z reported honestly). **Two build-session
decisions recorded:** **BD-S4a** (the D-22 day-change call — the TRUE day
change rides the live-prices contract: `change1d`, optional + additive,
computed in `buildLivePriceEntry` as the live quote vs the PREVIOUS
SESSION'S CLOSE, the last series point strictly before the quote's own
bar — never `pointDaysBack(1)`, which would measure the quote against
its own session; the ribbon shows it with a VISIBLE window tag and falls
back to the labelled 7-day change until the deployed prices writer
carries the field; the history-endpoint option REJECTED — 3 full-series
fetches on the landing page against the lean-page discipline, and a
closes-only pair would not correspond to the displayed live hourly
value; D-48's colour+label discipline now covers changes: a bare percent
never rides without its window) and **BD-S4b** (the narrator display
discipline — the narrator's OWN TEXT renders VERBATIM, the template
fallback's trailing not-advice sentence included, never edited, never
sentence-suppressed; the line GAINS the legacy block's “Updated {time}”
stamp so the staleness story is visible). **The pass's finds, fixed
live:** the last-good-cache path painted UNLABELLED cached data (the
`fromCache` flag was dead — never set; the label now rides exactly the
states that render a cached copy, the M-17 pattern); the narrator's
Updated stamp sat at the clamped text's end (swallowed in every
locale/width — the VLM pass caught it) and the clamp bled a sliced third
line into the bottom padding (the clamp now lives on an inner
padding-free span with the stamp at the FRONT of line 1); a display
utility beside `line-clamp` overrode its `-webkit-box` (six unclamped
lines on mobile-fa — caught by the one-screen measurement, 844/844
restored); mobile chips wrapped to 2–3 lines (`whitespace-nowrap` keeps
the uniform single-line scrollable pills); reduced-motion guards (the
loader-dot bounce + the loading tile's pulse + the tile/chip transitions
now `motion-safe`); the mobile chips scroller's direction-aware fade
affordance; the ribbon's visible window tag `aria-hidden` (the sr-only
words carry it); and — found by the CLOSING verification pass, after the
records' first cut — **the two board attachments broke the last-good
discipline**: a failed markets/fx refresh REPLACED a good cached `ready`
with `empty` (the unread collapse while good data sat in localStorage —
the exact collapse the legacy route's world-feeds never does) and the
boards' boot-time `fromCache` flag was dead for display; fixed to the
full M-17 pattern (the functional keep-flagged setState + the tiles'
own "Last good copy · {date}" caption with the boards' stored dates,
en+fa, +1 characterization pinning the path). **Browser-verified live at
1440×900 AND 360×844 in en +
fa (RTL):** one screen exact in all four, ten tiles with live verdicts
over real KV, the keyboard walk (skip link → nav → tiles, focus rings
everywhere), dark mode one-screen, BOTH reduced-motion guards verified in
the live CSSOM, and the live last-good path (feed blocked → the labelled
cached board renders — re-verified over PRODUCTION post-fix: both board
feeds blocked → the tiles keep their cached verdicts with both captions,
0 unread tiles, one screen exact in en + fa). 5 new fa strings queued
unreviewed (the ribbon window tag + the narrator stamp pair + the
board-tiles' cached caption). **Deployed + live-verified at the
session's close** (version `637db8f8`, then the closing pass's M-17 fix
re-deployed as `b1cfa4fe` — both under the owner's standing "the
Worker deploy when you choose" + AGENTS.md §5): the §21 backtest re-run
against PRODUCTION 84/84 green twice (the 04:36 deploy; the 05:01
re-deploy — the narrator's stateHash IDENTICAL on the second run, the
04:50 :50 rung having caught up to the 04:35 snapshot store), one screen
at both widths on currena.ir,
the legacy surfaces intact — the full record in `docs/DEPLOY.md`
2026-11-08c.

## Phase B — Gold (S5–S6)

### ✅ S5 — Gold page build · `Session 5/30` · delivered 2026-11-08
- Hero (live gold price + Balance Scale + 7-state outlook + counts) → the
  37 seats grouped by 5 lanes (D-26) → context cards (D-27) → honest-record
  footnote.
- **Gates:** seat-level diff vs `/api/insights` = exact match; all 37 seats
  render lean + evidence word; blocked items shown as notes (§16).

**S5 delivery record (2026-11-08):** THE gold card is REAL — `/gold`
renders the 37-voter conditions meter on the S2 contract
(`fetchPageProjection('gold')` — the 48-reading payload: 14 homes + 34
mirror inputs), with every verdict re-derived client-side through the
SAME engines (never a second arithmetic, D-48): `gold-tiles.ts` (the
pure derivations — `goldBalance` + `goldOutlookOf` + `evaluateSignal`,
plus the BalanceScale's OWN `balanceVerdictOf`/`balanceTilt` imported
verbatim so the hero's beam and the legacy drawing's beam are ONE math)
+ `GoldHero.tsx` (the live price with the BD-S4a window-tagged change +
the 10-year position + the beam glyph + the verdict word + the 7-state
outlook + the for/against/not-leaning/unread counts + gold's own 30-day
context line, never counted) + `GoldSeats.tsx` (the five lane cards,
D-26's 7/7/11/10/2 — each seat chip: name · lean · evidence word · link
to the seat's home card per §7 wrap-up note 4, the homes derived from
the placement table via the new `homePageOfIndicator` helper, never
hand-copied; the three voters whose home card lives on THIS page link to
the `#gold-context` anchor) + `GoldContext.tsx` (the D-27 ratios +
flows groups with value/10-year-position/freshness per the §21
per-page trio, the four BLOCKED ids as honest notes only §16, and the
honest-record footnote D-29 — the measured sign-agreement record
46.8/42.2/32.7% at 5/20/60td, MIN2, the corpus's own measured-note
sentence + the backtest link) + `GoldPage.tsx` (the container: honest
loading/error states, the M-17 last-good cache labelled). **THE §21
SEAT-LEVEL DIFF — the S5 gate's own:** `gold-backtest-core.ts` (the
page side over the projection vs the engine side — `goldBalance` member
line by member line over the served snapshot, NEVER through the page
module) + the offline suite test (7: the full pipeline, the public-mode
twin, three FAIL-CLOSED proofs — a flipped voter, a mutated hero value,
a dropped context reading) + the LIVE script
`apps/web/scripts/pd-s5-backtest.ts` — **the live run against
PRODUCTION: 150 checks · 150 green · 0 red, twice** (before the deploy
and after it): every one of the 37 seats' impact + evidence identical
to the engine's own arithmetic, the hero verdict word + beam angle
identical, the hero price + all 14 context readings byte-identical
(stableStringify, key-order-immune), the licence-hidden quartet riding
`absentIds`. **The copy:** ~110 new `pd.gold.*` keys (en+fa) with the
verdict vocabulary pinned byte-for-byte to the insights corpus in BOTH
locales by `gold-copy-pin.test.ts` (24 tests: the lane names + intros,
all 37 voter names, the evidence words, the seat lean + lane state +
tally words, the verdict words + counts parts, the beam aria, the
context line, the measured note + link, all 14 card names, the units +
position + band + status words — the first run caught TWO real drifts
and both were fixed to the corpus's own words); 133 new fa strings
queued unreviewed in the Persian copy manifest (7,118 entries). **One
build-session decision recorded: BD-S5a** (the cached-copy header — when
the page renders the last-good copy, the fromCache sentence REPLACES the
plain data-as-of line instead of doubling the date; Global's header
keeps the S4 pattern until S19's polish aligns it — found by the
dark-mode VLM pass). **The browser verification pass** (the freshly
built SPA over real production data, both widths in en + fa): the hero
renders the live hourly price (US$4,072 +4.44% `7d`, top 9% of the
decade) with the beam at 3.33° "for" and the outlook Bullish, the five
lanes carry the REAL engine verdicts (borrowing-costs for · dollar
against · stress for · inflation split 1–1 · flows neutral — the SAME
2-for/1-against/2-not-leaning counts the Global tile's engine values
carry), all 37 seats with lean + evidence + working home links
(click-verified through the router), no horizontal scroll at any width,
dark mode, the keyboard walk, and the M-17 last-good path LIVE (feed
blocked → the cached page stays, labelled). **The VLM visual pass found
two real defects, both fixed:** the seat chips' lean+evidence lines
clipped mid-word by the first build's truncate classes (the chips now
wrap their words COMPLETE — name / lean / evidence stacked) and the
cached header's doubled date. Gates ALL GREEN (2m 15s: secret scan
8/930 · tsc 6/6 · eslint 0/0 · copy:audit clean · narrator in sync +
eval 50 · layer1 11,819/11,819 · **the suite 14,786 = +55** (gold-tiles
15 · gold-copy-pin 24 · GoldPage characterization 9 · gold-backtest 7)
· build + budgets held — entry 269.00/81.45 (the lazy /gold wiring),
GlobalPage UNTOUCHED at 24.26/6.21 (byte-identical hash), **the new
GoldPage chunk 26.25/6.88 vs its new 30/9 budget row**). **Deployed +
live-verified** (version `f2e74f3c` ~12:27 UTC, the owner's standing
applies — the session prompt marked the deploy optional and every gate
was green including the live backtest, so the Gold page is live for the
owner's review between sessions; S6's close can re-ship after its own
gates): currena.ir/gold renders the complete meter, the landing page +
legacy surfaces intact, the §21 backtest re-run against production
150/150 green post-deploy — the full record in `docs/DEPLOY.md`
2026-11-08d.

### ✅ S6 — Gold gates · `Session 6/30` · delivered 2026-11-08
- Verdict-consistency backtest (meter counts, lane votes, beam, outlook);
  frozen-scenario suite re-run against the page renderer; mobile + ARIA.
- **Gates:** byte-identical verdicts; 14,620-test harness green; hand-off.

**S6 delivery record (2026-11-08):** Phase B (Gold) is CLOSED — and the
session also carried THE OWNER'S IN-SESSION REQUEST (BD-S6a): "I want
the previous shape of Gold balance in gold dedicated page, it must be
alternated with this new proposed minimal design, just make it
smaller" — BUILT, GATED, AND DEPLOYED LIVE. **The alternation:** the
hero's balance block now switches between two designs through a real
radio group (native arrow-key walking, the group labelled en+fa, the
gold focus ring verified in the live CSSOM): the CLASSIC view — the
previous shape of the gold balance, the brass assay-office stage with
the five lane WEIGHTS on its pans + the not-leaning tray, rendered
SMALLER (the root capped at 480px → always the s-size metrics: pivot
56, dial 30, two weights per row) — and the MINIMAL view (the S5 beam
glyph, unchanged). Classic is the DEFAULT (the owner's ask); the
choice persists per visitor (`currena:pd:gold:balance-view`). The
verdict word + 7-state outlook + counts + context line render in BOTH
views (the engine's words — the two designs can never disagree);
pressing a lane weight scrolls to that lane's seat card (the seats'
lane cards gained `#gold-lane-{lane}` ids — the on-page answer to the
legacy ledger row). **One drawing, never restated (D-48):** the stage
+ tray were EXTRACTED VERBATIM from the legacy `BalanceScale` as the
exported `BalanceStage`/`BalanceTray` + `useBalanceVisualRootWidth` +
the narrow `BalanceStageCopy` interface — the legacy card feeds the
corpus's strings, the Gold hero feeds its corpus-pinned `pd.gold.*`
keys (19 of the 22 new keys pinned byte-for-byte to the corpus by
`gold-copy-pin.test.ts`, both locales: the pan captions, the
empty-pan sentences, the stage aria + count words, laneChipAria, the
split badge, the condition-state words, the tray trio — the classic
drawing speaks EXACTLY the legacy card's words); the 3 fresh view
words queued unreviewed (the Persian manifest at 7,140 entries).
**VERIFIED BYTE-IDENTICAL through the extraction:** the legacy card's
snapshot + all 51 gold-balance-lanes tests green untouched — the
Insights chunk measured UNCHANGED at 1569.16/362.08. **THE FROZEN-
SCENARIO SUITE (the S6 gate's own):** `gold-backtest-core.ts` gains
`backtestGoldPageVsHarness` — the PAGE renderer vs the FROZEN
HARNESS's own arithmetic (`gfLaneBalance` over the production
scenario composition `GF_VOTERS_P4_5LANE` with the recorded F2 seat
mapping applied at the consumer, MIN2, the D-18 input-presence rule,
the executed threshold map), with the S5 core's two-path shape so the
fail-closed proofs can diverge the sides; the frozen tables opened to
consumers via the new additive package export
`@currena/insights/gf-p0-proposed`. The offline suite
(`gold-frozen-scenarios.test.ts`, 9): the recorded corpus's 19
archive windows swept — page ≡ harness green on EVERY window (counts,
lane votes, beam, verdict, outlook); the S5 derivation families re-run
green over history (the input/context presence checks stay the LIVE
tool — the archives honestly predate the P2/P3/P4 promotions); the
18-scenario frozen family re-runs DETERMINISTICALLY over every
window; the production-composition pin; THREE fail-closed proofs; the
diverse-verdict-shapes guard. **THE LIVE §21 BACKTEST: 150 checks ·
150 green · 0 red, TWICE** (against production before the deploy and
after it — every seat's impact + evidence, the hero verdict + beam,
the price + all 14 context readings byte-identical). **The mobile +
ARIA pass:** browser-verified over real production data at 1440×900
AND 360×844 in BOTH en and fa (RTL, Persian digits) — the classic
stage at 308–480px, no horizontal scroll at any width, the keyboard
walk (the radio group's arrow keys with the visible focus ring, the
weights as real buttons), the weight→lane-card scroll (y 42→1556),
dark mode, and ZERO page errors; the VLM visual passes (en classic
clean; fa + dark-mode passes produced 6 small-font Persian
"garble"/mirroring reads — ALL SIX disproven against the DOM: the RTL
mirroring is correct by construction (the for pan on the right,
dipping +7.53px, beam rotate +3.33°), and the "garbled" words are the
corpus's own pinned wording («تمایل به نفع طلا», «تنش بازار»,
«جریان‌ها و تقاضا») — no fixes made, the machine's finds checked
against reality per the S5 discipline). **Gates ALL GREEN** (2m 20s:
secret scan 8/932 · tsc 6/6 · eslint 0/0 · copy:audit clean ·
narrator in sync + eval 50 · layer1 11,819/11,819 · **the suite
14,799 = +13** (the frozen-scenario suite 9 · the GoldPage
characterization +2 both-views tests) · build + budgets held — entry
269.00/81.45 UNTOUCHED, GlobalPage untouched, Insights UNTOUCHED,
GoldPage 31.23/8.06 vs its re-based 34/9 row, justified in
`check-bundle-budget.mjs`). **DEPLOYED + LIVE-VERIFIED** (version
`327c7761` ~14:55 UTC, the owner's S5 standing "re-ship only if S6
changes code" — it did): currena.ir/gold renders the alternation
(the classic balance the default), the Global landing page + the
legacy /insights intact — the full record in `docs/DEPLOY.md`
2026-11-08e. Decisions: BD-S6a + the frozen-scenario suite + the
deploy, all in `docs/DECISIONS.md`.

## Phase C — World Markets (S7–S8)

### ✅ S7 — World Markets build · `Session 7/30` · delivered 2026-11-08
- Reuse the existing world-index map as the hero (D-43); region grids (Asia ·
  Europe · Americas); status summaries; world risk & liquidity section (9
  cards).
- **Gates:** 16 indexes render with full metrics; map dots interactive; EODHD
  primary / Yahoo fallback behaves fail-closed.

**S7 delivery record (2026-11-08):** the World Markets page is REAL —
`/world-markets` renders the D-43 hero (the REUSED `WorldMap` module, ONE
drawing never restated: its copy prop loosened to the narrow structural
`WorldMapCopy` interface — the BalanceStageCopy pattern, the legacy
/insights route keeps passing the corpus which satisfies it structurally,
zero behavior change, all 49 world-markets component tests green
untouched) fed the corpus-pinned `pd.worldMarkets.map.*` keys through the
page's own adapter, beside the status summary (the board's OWN §5.3
rollup — signal + counts + worstGroup straight off the stored summary,
never re-computed — plus the RAW ≥10%/≥20% counts and the STATED rule
whose thresholds are the definitions' own `ATTENTION_COUNT`/
`UNUSUAL_COUNT`); the three region grids (Asia 7 · Europe 4 · Americas 5,
the membership riding `MARKET_GROUP_ORDER` × `MARKETS`, never a
hand-copied list — a real `<table>` at ≥900px + the mobile row list, the
MarketsTable pattern) with every row's five lenses (chg 1d/1w/1m/3m/1y,
the bright-ink triangles), the 52-wk range position (a visual track with
the position marker + the honest sr sentence), the ±1% trend band and
the −10%/−20% status pills, the A7 delayed + R6 old tags and the UI-27
local-currency note; and the world risk & liquidity section (the 9
placement homes — `pageHomeIds('world-markets')` — with the §21 trio:
value/10-year-position/freshness, the GoldContext pattern, `usd-tr`'s EN
prefix form included). Every value flows through the same pure helpers
the legacy section reads (`world-markets-tiles.ts`: verdict-core +
shared.tsx's trendOf/statusWordKeyOf/isOld/tradingDaysBehind — D-48,
never a second arithmetic); a market the board has no row for renders
the honest no-data row; the map's callout click scrolls to the market's
region-grid row (the on-page answer to the legacy detail panel). ~160
new `pd.worldMarkets.*` keys (en+fa) with the whole map block + the 16
entries' name/latin/country + the verdict/measure/count/table/status
vocabulary + the 9 card names + the unit/position/band/status words
pinned byte-for-byte to the insights corpus in BOTH locales by
`world-markets-copy-pin.test.ts` (the first run caught ONE real drift —
statusStale said 'Old data' where the corpus says 'Stale' — fixed to
the corpus's own word); 166 new fa strings queued unreviewed in the
Persian copy manifest (7,306 entries). **THE §21 DIFF (the S7 gate's
own):** `world-markets-backtest-core.ts` (the page side over the served
board + projection vs the engine side — `summarizeMarkets` + verdict-core
+ the shared helpers over the board's own rows and the served snapshot's
readings, NEVER through the page module) + the offline suite (7: the full
pipeline 57/57, the designed S1-M1.6 #2 buffered-vs-RAW divergence note,
THREE fail-closed proofs, the public-mode twin, the key-order-immune
stableStringify) + the live script `apps/web/scripts/pd-s7-backtest.ts`
— **the live run against PRODUCTION: 56 checks · 56 green · 0 red, twice
(before and after the deploy)**: every row's five lenses + fromHigh +
rangePos byte-identical to the stored board rows, the trend/status words
≡ the shared helpers, the region structure 7/4/5, and all 9 risk
readings byte-identical (stableStringify) between the projection and the
served snapshot. **The browser verification pass** (the freshly built
SPA over real production data, both widths in en + fa RTL): the status
summary (Mixed · the attention label · 7-of-16 ≥10% · 2 bears · the
4+/8+ rule), all 16 interactive map cards (the Dow card's 1D/1W/1M
changes + last close; the period switch driving the colours — 1Y turns
Dow's word Fall→Rise at +8.9%; the M11 roving tabindex arrow-walking),
the grids, the risk cards, the map-callout→row scroll, the keyboard
walk, dark mode, NO horizontal scroll, ZERO console/page errors; the
M-17 last-good path LIVE (the board blocked → the cached copy stays,
labelled). **The pass's ONE find, fixed:** the first build's 1080px
container squeezed the map stage to 1016px and re-exposed the 4×4px
stoxx50×hsi corner intersection the 2026-10-27 config round had tuned
away (the legacy shell renders the map at 1272px — measured in the DOM);
the container now matches the Global landing page's 1280px (stage 1216px,
ZERO overlaps measured in both locales); the VLM passes' other reads
each disproven against the DOM per the S5/S6 discipline. **Gates ALL
GREEN** (2m 20s: secret scan 8/943 · tsc 6/6 · eslint 0/0 · copy:audit
clean · narrator + eval 50 · layer1 11,819/11,819 · **the suite 14,839
= +40** (tiles 16 · copy-pin 8 · backtest 7 · characterization 9) ·
build + budgets held — entry 269.32/81.55, GlobalPage 24.33/6.23,
GoldPage 31.26/8.07, **the new WorldMarketsPage chunk 26.54/6.49 vs its
new 30/8 budget row**; the REUSED map tree rides the SHARED chunk — the
Insights chunk shrank 1569.16→1553.03 through the sharing, the map's
bytes paid once). **Deployed + live-verified** (version `6e515cf8`
~17:45 UTC, the owner's standing "the deploy at the close is the
owner's standing"): currena.ir/world-markets renders the complete page
(zero card overlaps, zero console errors), the §21 backtest re-run
against production post-deploy 56/56 green, the Global landing page (10
tiles) + the legacy /insights (16 cards, zero overlaps, the deprecation
banner) intact. Decisions: BD-S7a (the map-copy structural extraction)
+ BD-S7b (the 1280px container) + the deploy, all in
`docs/DECISIONS.md`.

### ✅ S8 — Regional zoom maps · `Session 8/30` · delivered 2026-11-08
- Zoomed continent maps for the region pages (Europe-only, Asia-only,
  Americas/US, AU) per D-13/D-44 — data from the same board payload.
- **Gates:** all four zooms render; consistency with the world map; hand-off.

**S8 delivery record (2026-11-08):** Phase C (World Markets) is CLOSED —
the four REGION pages render their D-44 index/map sections LIVE. **The
zooms:** the REUSED WorldMap module gained a `region` prop — ONE
drawing, never restated (D-48): the viewBox crops to REGION_ZOOMS'
hand-tuned windows into the SAME 1000×521 world box (Europe 148×120 ·
Asia 215×148 · US 155×92 · Australia 115×122 — the projection's own
coordinates), ONLY the region's indices seat pins + callout cards
(Europe 4 · Asia 6 · US 3 · AU 1: every world-map index seated in
EXACTLY ONE zoom except tsx/ibov per D-44, asx200 riding the AU zoom —
the 19-symbol AU Markets board is S16's own table, never map pins),
the per-zoom card positions/widths and label-anchor overrides live in
world-map-config.ts, and the stage carries its window's own aspect
ratio (height-capped at 600px so a near-square window never dominates
the page). **THE CONSISTENCY CONTRACT:** the rows' derivation
(EXTRACTED VERBATIM to world-map-rows.ts) normalises the relative
colour scale over ALL SIXTEEN board rows REGARDLESS of the region prop
— a zoomed market's colour weight and hero number are the world map's
own, by construction; the words ride the ONE shared corpus-pinned
adapter (useWorldMapCopy EXTRACTED to world-map-copy.ts — the S7 hero
re-exports it, the copy-pin test unchanged and green). **The pages:**
RegionIndexSection (the board's M-17 keep-flagged state + the zoom +
the board stamp + the honest cannot-read empty state; a card click —
and a mobile dot tap — opens the market's full home today,
/world-markets) + RegionPage (the destination's own shell + the honest
still-building chip + the placeholder body BELOW the index section —
DestinationBody extracted, zero copy duplication; the 1280px container
at lg per the S7 BD-S7b lesson) + the App wiring (the four region
routes leave the placeholder set, ONE lazy RegionPage chunk serves all
four). A small S7 fix rode along: the mobile dot tap now falls back to
the caller's onOpenMarket when no explorer tile exists — the
/world-markets mobile dot was dead (it now scrolls to the wm-row grid
row, verified live; the legacy /insights tile keeps its path). **THE
§21 DIFF (the S8 gate's own):** region-zoom-backtest-core.ts (the S7
two-path shape — the PAGE side through deriveWorldMapRows, the exact
function the drawing renders, vs the ENGINE side spelled out over the
board's own row fields through the config primitives, all-16 scale) +
the offline suite (7: the full pipeline, the old-data nulls, THREE
fail-closed proofs — the naive-subset scale, a mutated value, a
dropped row) + the live script pd-s8-backtest.ts — **the live run
against PRODUCTION: 13 checks · 13 green · 0 red, twice (before and
after the deploy)**. **The copy:** 5 fresh `pd.regionZoom.*` keys
(en+fa: the four section titles + the intro line) queued unreviewed in
the Persian manifest (7,311 entries); every word inside the drawing is
the pinned pd.worldMarkets.map block. **The browser verification pass**
(the freshly built SPA over real production data): 1440×900 AND
360×844 in BOTH en and fa (RTL, Persian digits) — all four zooms with
ZERO card overlaps measured in the DOM, the leader lines'
window-generalized math landing the pins at the exact world
coordinates, the country labels at the zoom overrides with zoom-scaled
sizes (Korea at local (74.4, 36.2) = the override anchor exactly; the
Eurozone label the world's own anchor cannot carry — outside the
window), NO horizontal scroll at any width, ZERO console/page errors
across every route in both locales (the legacy /insights + /gold +
/world-markets untouched by the extraction), the period switch driving
the zoomed hero (KOSPI 1D −5.3% → 1Y +34.5%), the keyboard walk, dark
mode, and the mobile dot taps; the VLM passes' negative reads (the
'clipped' cards, the 'cropped' western US, 'cut-off' Tasmania) each
disproven against the DOM — viewport folds and the window's own
designed edges. **Gates ALL GREEN** (2m 23s: secret scan 8/954 · tsc
6/6 · eslint 0/0 · copy:audit clean · narrator + eval 50 · layer1
11,819/11,819 · **the suite 14,877 = +38** (zoom 12 · zoom-component 9
· backtest 7 · RegionPage 10) · build + budgets held — entry
269.71/81.70, the NEW RegionPage chunk 3.95/1.56 vs its new 8/3 row,
WorldMarketsPage SHRANK 26.54→23.10 through the adapter sharing (the
map's bytes paid once), Insights 1553.13/356.56). **Deployed +
live-verified** (version `fde50a95` ~19:25 UTC, the owner's standing
"the deploy at the close is the owner's standing"): currena.ir/usa ·
/europe · /asia-pacific · /australia render their zooms over the live
board (Dow −3.4% 1D · ASX +2.6% · Nifty +2.4% — real values, zero
overlaps, zero errors), the Global landing page (10 tiles) + the Gold
page + the legacy /insights (16 map cards + the deprecation banner)
intact — the full record in `docs/DEPLOY.md` 2026-11-08g. Decisions:
BD-S8a (the one-drawing region prop) · BD-S8b (the zoom sections'
scope: the map now, the region's own cards in S9–S16; the AU board is
S16's table) · BD-S8c (the card-click → /world-markets home today) +
the mobile dot-tap fallback fix, all in `docs/DECISIONS.md`.

## Phase D — USA (S9–S11)

### ✅ S9 — USA verdicts + tiers 1–2 · `Session 9/30` · delivered 2026-11-09
- The 5 gauge verdicts atop (D-30); tier-1 "the world watches" 7 cards
  (D-29); tier-2 rates & the Fed.
- **Gates:** verdicts match Global's engine values; tier-1 cards complete.

**S9 delivery record (2026-11-09):** Phase D is OPEN — the USA page is
REAL. `/usa` now renders its own layers above the unchanged S8 zoom
section: **the D-30 verdict strip** (the five thematic gauges in GAUGES
order — the SAME computed verdicts as Global through ONE derivation:
`usaGaugeVerdicts` IS `globalGaugeTiles` re-exported, D-48 — with the
US-framed questions as the only fresh copy; the verdict WORDS and
why-lines ride the EXISTING `pd.global` keys, one verdict language
everywhere, zero duplicate fa strings; the honest step-0 'Cannot read
yet' path) · **tier-1 "the world watches" (D-29's seven)** and **tier-2
rates & the Fed (the placement's authoritative 19 — the spec's "(22)"
label is the recorded AF-2 drift)**, every card carrying the §21 trio
(value / 10-year position / freshness) through the same display
conventions the legacy cards read (`usaCardValueText` restating the
DISPLAY registry's own joins — pinned output-for-output against
`formatReadingValue` by test, so the lean restatement can never drift
from the legacy renderer: the fed-target true corridor '3.75–4.00%', the
25bp fallback, the trillion/billion scales, the auction ratio, percent
binding tight in both locales). The honest paths stay: absent readings
render 'Cannot read yet', the projection's M-17 last-good cache paints
labelled (the BD-S5a sentence), the In-build chip + the placeholder body
stay for tiers 3–6 + TIC (S10's scope, BD-S8b honoured), and the S8 zoom
stays on top through EVERY page state (a slow or dead projection never
takes the honest map away). **THE §21 DIFF (the S9 gate's own):**
`usa-backtest-core.ts` — THREE sides, one truth: the PAGE side
(`usaGaugeVerdicts` over the USA projection) ≡ the GLOBAL side
(`globalGaugeTiles` over the Global projection — D-30's 'the same
computed verdicts as Global' pinned LITERALLY, not assumed) ≡ the ENGINE
side (`gaugeReading` + `labelForVerdictStep` spelled out over the served
snapshot, never through a page module) — every gauge voter present on
all three feeds, every gauge's {step, votingCount, warningCount,
staleCount, word} byte-identical across the three sides, every one of
the 26 cards' §21 trio inputs byte-identical between the projection and
the snapshot (stableStringify, key-order-immune); the offline suite (6:
the full pipeline green over a synthetic snapshot — borrowing-costs
cautious and market-stress relaxed-with-a-stale-vix on ALL THREE sides;
the public-mode twin; THREE fail-closed proofs — a mutated page verdict,
a mutated page card value with the three feeds as INDEPENDENT copies
exactly like three HTTP payloads, a dropped input on EACH side redding
the completeness check AND the affected gauge; the key-order-immune
stableStringify) + the live script `pd-s9-backtest.ts` — **the live run
against PRODUCTION: 69 checks · 69 green · 0 red, TWICE (before the
deploy and after it)**. **The browser verification pass** (the freshly
built SPA through the local preview server, /api proxied to currena.ir):
1440×900 AND 360×844 in BOTH en and fa (RTL, Persian digits) — the
strip's five LIVE engine verdicts (Stressed · Stressed · Cautious ·
Stable · Cautious with the why-lines' real counts), the tiers with the
§21 trio on every card (us-cpi-yoy's warning status word; the context
us-nfp with NO status word; nyfed-custody 'US$2.81 trillion' · low ·
bottom 0%), the zoom with ZERO card overlaps measured in the DOM at the
973px stage (viewBox '185 92 155 92', --wm-zoom-ar '155 / 92'), the
period switch driving the zoomed hero (Dow 1D −3.4% Fall → 1Y +8.9%
Rise), the dollar-strength strip card → /currencies, the zoomed card
click → /world-markets, the mobile list layout with 26 cards and NO
horizontal scroll at any width in any locale, dark mode clean, ZERO
console/page errors across every route (the Global landing 10 tiles +
/gold + /world-markets + the legacy /insights 16 cards intact); the VLM
visual passes (dark-fa-1440 · mobile-en full): the mobile read NO
DEFECTS; the dark-fa read's one find («زیرک ۱۰۰», a 'clipped name')
disproven against the DOM — the card is «نزدک ۱۰۰» (Nasdaq 100, the
corpus's own Persian) misread at small font, and ZERO elements with
horizontal overflow measured. **Gates ALL GREEN** (2m 28s: secret scan
8/964 · tsc 6/6 · eslint 0/0 · copy:audit clean (7,370 entries — the 59
new `pd.usa.*` fa strings queued unreviewed; the queue now ~621) ·
narrator in sync + eval 50 · layer1 11,819/11,819 · **the suite 14,906
= +29** (usa-tiles 12 · copy-pin 4 · UsaPage 7 · backtest 6) · build +
budgets held — entry 270.04/81.81, **the NEW UsaPage chunk 15.21/4.29 vs
its new 20/6 row**, GlobalPage SHRANK 24.40→23.04 and RegionPage
3.95→1.65 through the shared global-tiles / RegionIndexSection chunks
(the derivations' and the zoom's bytes paid once, not per route),
Insights 1553.17/356.56 untouched). **Deployed + live-verified**
(version `36f64141` ~2026-11-08 20:35 UTC under the owner's standing
"the deploy at the close is the owner's standing"): currena.ir/usa
renders the complete page over the live board (zero overlaps, zero
errors, real values), the §21 backtest re-run against production
post-deploy 69/69 green, the Global + Gold + World Markets + legacy
surfaces intact — the full record in `docs/DEPLOY.md` 2026-11-09a.
Decisions: BD-S9a (the one-derivation strip + the shared vocabulary
riding pd.global) · BD-S9b (dollar-strength the only strip link) ·
BD-S9c (the zoom on top through every state; the placeholder body stays
until S10) + the deploy, all in `docs/DECISIONS.md`.

### ✅ S10 — USA tiers 3–6 + TIC + index section · `Session 10/30` · delivered 2026-11-09
- Tiers 3–6 (inflation · labor & growth · liquidity/stress/valuation · TIC
  "who finances America" D-31) + SPX/NDX/DOW zoom section (the zoom map
  itself already landed in S8 — S10 adds its per-index detail cards/rows
  if the spec's §7 item 8 asks beyond the map, else records the map as
  the section).

**S10 delivery record (2026-11-09):** /usa is the COMPLETE American bulk —
all 72 registry cards in five tiers (7 + 19 + the S10 tiers: inflation 12
· labor & growth 17 · liquidity/stress/valuation 17, every id from the
placement table's own groups via `pageGroupIds`) + the tier-6 TIC board
"Who finances America" (D-31). **The TIC board is the REUSED legacy
drawing (BD-S10a, D-48):** `TicCustodyCard` extracted to its own module
and `TicSection`'s copy contract narrowed to its own `tic` block (the S7
WorldMapCopy pattern; 14/14 legacy tests green through the refactor), fed
the corpus-pinned `pd.usa.tic.*` words through the ONE lean adapter
(`usa-tic-copy.ts`, pinned byte-for-byte in both locales) — the section
renders over the EXISTING route `GET /api/insights/tic` (one KV read,
own M-17 loader, independent of the projection): 21 foreign holders +
aggregates ($9.3tn total, the official/private split bar), 24-month
history (the Japan+China chart + sparklines), the custody-hub caveat (◆ +
Treasury's own warning), and the net TRANSACTIONS shown SEPARATELY from
the price effect (the two 12-month columns + the honest-difference note).
**The placeholder body RETIRED (BD-S10b)** — nothing promises future
tiers; the honest In-build chip stays for S11's gates/polish. **The §7
item-8 index section recorded as the S8 zoom (BD-S10c):** the spec asks
"SPX · NDX · DOW zoom map + cards" and the S8 zoom renders exactly that
(the zoomed map with the three cards seated) — the map IS the section,
nothing invented beyond the spec. **THE §21 DIFF (the S10 gate's own):**
`usa-backtest-core.ts` extended to the 72 cards + `backtestUsaTicBoard`
(page payload ≡ engine payload ≡ the derived rows RESTATED with the
helper's exact arithmetic — 3dp changes, raw-then-round sums — never
imported; the fail-closed proofs caught a shallow-copy seam in testing,
exactly what they exist for) + the live script `pd-s10-backtest.ts` with
the tier membership (7/19/12/17/17 + 72/72) and THE FRESHNESS AUDIT vs
the registry's own maxAgeDays — **the live run against PRODUCTION: 173
checks · 173 green · 0 red, TWICE (before and after the deploy)**
(govt-interest-revenue 221d beyond its 215d grace AND honestly carrying
the engine's stale status). **The browser pass** (the freshly built SPA
over real production data): 1440×900 AND 360×844 in BOTH en and fa (RTL,
Persian digits) — all six tiers with ZERO card overlaps measured in the
DOM, NO horizontal scroll at any width, the TIC table (8 columns, sort
with aria-sort) + the mobile card list with the Show-all-16 toggle, the
zoom period switch (Dow 1Y +8.9%) + the card click → /world-markets,
dark mode, the legacy /insights TIC section + custody card INTACT, ZERO
console/page errors across every route; the VLM passes (TIC desktop · fa
mobile: NO DEFECTS; dark-fa's 'clipped circle' find disproven against the
DOM — the logo ends 20px inside the viewport). **Gates ALL GREEN**
(2m24s: secret scan 8/968 · tsc 6/6 · eslint 0/0 · copy:audit clean
(7,486 entries — the 116 new `pd.usa.*` fa strings queued; the queue now
~737) · narrator + eval 50 · layer1 11,819/11,819 · **the suite 14,917
= +11** · build + budgets held — the UsaPage chunk re-based 24.49/6.38
vs 26/7, the NEW shared tic chunk 21.16/5.59 vs 24/7 with the Insights
chunk SHRINKING 1553.17→1532.14 through the same split — the drawing
paid once). **Deployed + live-verified** (version `18907d4d` 2026-11-08
22:24 UTC, the owner's standing "the deploy at the close is the owner's
standing"; the deploy-lock check ran first — S9's `36f64141` @ 100%):
currena.ir/usa renders the complete page (72 cards + the TIC board over
the live data, the deployed chunks BYTE-IDENTICAL to the local build),
the §21 diff re-run post-deploy 173/173 green, every other surface
intact. Decisions: BD-S10a (the TIC reuse through the narrowed
contract) · BD-S10b (the placeholder body retired) · BD-S10c (the zoom
recorded as the §7 item-8 section) + the deploy, all in
`docs/DECISIONS.md`.

### ✅ S11 — USA gates · `Session 11/30` · delivered 2026-11-09 · **Phase D CLOSED**
- Full card-render audit vs placement table; freshness within cadence
  grace; mobile/ARIA; hand-off.

**S11 delivery record (2026-11-09):** Phase D (USA) is CLOSED — the USA
gates session delivered the three S11-scope items over the S10-complete
/usa page (72 cards + the TIC board, no new layers — the gates + polish
session). **(a) The freshness audit formalized (BD-S11a — spec §21's
"Data audit" leg):** the freshness-within-cadence-grace audit the live
`pd-s10-backtest.ts` script carried inline is extracted into a PURE
function `auditUsaFreshness` in `usa-backtest-core.ts` — takes
`(readings, registry, cardIds, now)`, returns `{checks, withinGrace,
beyond[]}` where each beyond-grace finding carries an `honest` flag (true
iff `status === 'stale'`); the audit PASSES iff every beyond-grace card
honestly carries the engine's stale status (the govt-interest-revenue
case: 222d beyond its 215d grace AND status 'stale' — the page speaks the
engine's own word). The live script now calls the SAME function (no logic
drift between the test and the gate); the offline suite (5 new tests in
`usa-backtest.test.ts`): the GREEN path, the HONEST-STALE path (the
govt-interest-revenue twin), the FAIL-CLOSED proof (a beyond-grace card
the engine forgot to flag → RED — the audit catches the engine's own
miss), the EXEMPT path (per-change maxAge null + unavailable asOf null),
and the ABSENT-TWIN path. **(b) The mobile/ARIA polish (BD-S11b — spec
§18 D-48's "touch targets ≥ 44px" + the WAI-ARIA disclosure pattern):**
`TicSection.tsx` — the mobile card list's Show-all toggle already carried
`aria-expanded` (S10); it now carries `aria-controls` pointing to the list
it controls (the `useId()`-generated id — unique per instance so the
REUSED component renders on both /usa and /insights without an id
collision); `WorldMap.tsx` — the period switch's radio buttons bumped from
`min-h-[41px]`/`@max-[480px]:min-h-[37px]` to `min-h-[44px]` everywhere
(the spec §18 D-48 was below on small screens at 37px; the small-screen
padding/font reductions kept for horizontal fit). **(c) The In-build chip
retired (BD-S11c — BD-S10b's completion):** the USA page's honest "In
build" status chip is REMOVED from the heading block — the gates passed
(the §21 card audit 173/173 green, the freshness audit formalized, the
mobile/ARIA polish landed); the page's layers are complete and verified.
The `pd.statusBuilding` key stays for `RegionPage` + `PagePlaceholder`
(the genuinely-not-yet-built pages). **THE §21 DIFF (the S11 gate's own —
re-audited as the session's own gate):** the live `pd-s10-backtest.ts`
re-run against PRODUCTION with the pure `auditUsaFreshness` — **173 checks
· 173 green · 0 red, TWICE (before and after the deploy)** (115 page-diff +
48 TIC + 6 tier membership + 1 freshness + 3 feed). **The browser pass**
(the freshly built SPA through the local preview server, /api proxied to
currena.ir): 1440×900 AND 360×844 in BOTH en and fa (RTL, Persian digits)
— all six tiers with ZERO card overlaps measured in the DOM, NO horizontal
scroll at any width in any locale (overflow 0px on all 4 legs), the period
switch at 44px on all 4 legs, the Show-all toggle's aria-controls resolving
on all 4 legs, the In-build chip ABSENT on all 4 legs, ZERO console/page
errors across all 4 legs; the VLM visual pass (fa-360): 3 findings — ALL
THREE DISPROVEN against the DOM (the topbar's normal border; the actual
date "داده‌های ۱۴۰۵/۰۸/۱۷" fits scrollW===clientW — the VLM misread the
Persian digits; the actual question "آیا بازار آمریکا در تنش است؟" fits
scrollW===clientW — the VLM dropped "ن" from "تنش" at small font, exactly
the S10 precedent). **Gates ALL GREEN** (2m 21s: secret scan 8/968 · tsc
6/6 · eslint 0/0 · copy:audit clean · narrator + eval 50 · layer1
11,819/11,819 · **the suite 14,922 = +5** · build + budgets held — the
UsaPage chunk 24.20/6.29 vs 26/7 (the chip removal shaved ~288 bytes), the
shared tic chunk 21.20/5.61 vs 24/7 (the aria-controls + useId added ~39
bytes)). **Deployed + live-verified** (version `4f288272` 2026-11-09 00:42
UTC, the owner's standing "the deploy at the close is the owner's
standing"; the deploy-lock check ran first — S10's `18907d4d` @ 100%):
currena.ir/usa live-smoke-verified (72 cards · 5 strip · 6 tiers · In-build
ABSENT · period switch 44px · aria-controls resolves · 0px overflow · 0
page errors), the deployed UsaPage + tic chunks BYTE-IDENTICAL to the
local build (24,198 + 21,195 bytes, the hashed names match exactly), the
§21 backtest re-run post-deploy 173/173 green, every other surface intact.
Decisions: BD-S11a (the freshness audit formalized) · BD-S11b (the
mobile/ARIA polish — aria-controls + 44px touch target) · BD-S11c (the
In-build chip retired — BD-S10b's completion) + the deploy, all in
`docs/DECISIONS.md`.

## Phase E — Europe (S12–S13)

### ✅ S12 — Europe build + fills · `Session 12/30` · delivered 2026-11-09 · **Phase E OPEN**
- EU section & non-EU (UK) section apart (D-33); Europe zoom map.
- FRED-only fills (D-34): euro unemployment · industrial production ·
  ECB-SDMX liquidity — **verify each candidate series live before ingest**
  (Rule 5); unverifiable → discard + record.
- **Gates:** fills verified against publisher releases; EU/non-EU split
  correct; gates on cards.

**S12 delivery record (2026-11-09):** Phase E (Europe) is OPEN — the
Europe page build session delivered the page over the 8 placed ids with
the §15 fills verified-pending-ingest (Rule 5). **(a) The Europe page
(BD-S12b — spec §8 items 1–4; D-15/D-33):** the Europe route leaves the
region set for its own lazy chunk (the UsaPage pattern) — the EU section
(ecb-dfr · euro-hicp · euro-aaa-10y · bund-10y · btp-bund-spread ·
oecd-cli-de) and the non-EU United Kingdom section (gilt-10y · boe-rate)
listed APART per D-33, each card with the §21 trio (value · 10-year
position · freshness) through the PURE `europe-tiles.ts` (pinned
output-for-output against `config/display.ts`'s `formatReadingValue` by
`europe-tiles.test.ts`, the S9 usa-tiles pattern — 9 tests); the S8 zoom
section on top (`RegionIndexSection region='europe'` — the STOXX50E ·
DAX · CAC · FTSE zoom the S8 map already renders; the page's own layers
seat under it); the cross-links strip (§8 item 4: eur-usd · usdchf ·
usdtry → /currencies). The honest "In build" chip stays (the §15 fills
are verified-pending-ingest; the page is honestly still growing, the
spec §20 thin-region mitigation — the USA trajectory: S9/S10 chip → S11
retirement). **(b) The §15 FRED-only fills verified-pending-ingest
(BD-S12a — Rule 5):** the three D-34 Europe fills (euro-area
unemployment · industrial production · ECB-SDMX M3 liquidity) are NOT
ingested — the candidates were probed live against the publisher (Rule
5); none could be verified cleanly from the dev sandbox (FRED serves a
JS challenge to the sandbox IP — the production Worker reaches FRED
fine, the bund/gilt/italy mirrors prove the adapter works in egress; the
ECB M3 SDMX key needs the BSI dimension walk the production adapter
does for the Eurosystem-assets series). Per Rule 5, NO fill is ingested
unverified; the candidates + the verification status are recorded in
DECISIONS.md for the next session to verify from production egress +
ingest with the full §A discipline. The placement `eu-members` note
updated. **(c) The §21 backtest:** `europe-backtest-core.ts` (the page ≡
engine trio diff over the 8 cards, reusing S11's PURE
`auditUsaFreshness` for the freshness audit — one audit function, no
logic drift) + `europe-backtest.test.ts` (12 tests: the GREEN path, the
public-mode twin, four FAIL-CLOSED proofs, the stableStringify immunity,
+ the freshness audit's own cases on Europe's cadences) + the live
`pd-s12-backtest.ts` script. **(d) The copy pins:**
`europe-copy-pin.test.ts` (the 8 card names + units + position/band/
status words ↔ the corpus, both locales) + the 34 new `pd.europe.*` fa
strings queued unreviewed in the manifest (the S9/S10 pattern).
**THE §21 DIFF (the S12 gate's own — run LIVE twice, before and after
the deploy): 8 cards · 8 green · 0 red.** The live `pd-s12-backtest.ts`
against PRODUCTION: the 8 cards' trio inputs byte-identical (page ≡
engine — ecb-dfr 2.5 · euro-hicp 4.0 warning · euro-aaa-10y 3.29 ·
bund-10y 3.47 · btp-bund-spread 0.80 stale · oecd-cli-de 101.0 ·
gilt-10y 5.24 · boe-rate 4.0), the EU/non-EU group membership 6/2 +
8/8 carried, the freshness audit honest (btp-bund-spread 100d beyond
its 75d monthly grace AND carrying the engine's stale status — the page
speaks the word). **The browser pass** (the freshly built SPA through
the local preview server, /api proxied to currena.ir): 1440×900 AND
360×844 in BOTH en and fa (RTL, Persian digits) — the 8 cards with the
§21 trio rendering (8 values measured), the EU + UK sections + the zoom
+ the 3 cross-links all present, the In-build chip present, NO
horizontal scroll at any width in any locale (overflow 0px on all 4
legs), ZERO console/page errors across all 4 legs; the rendered values
match the live §21 data byte-for-byte. **Gates ALL GREEN** (2m 26s:
secret scan 8/968 · tsc 6/6 · eslint 0/0 · copy:audit clean · narrator
in sync + eval 50 · layer1 11,819/11,819 · **the suite 14,945 = +23**
(europe-tiles 9 · europe-copy-pin 2 · europe-backtest 12) · build +
budgets held — entry 270.28/81.86). **Deployed + live-verified**
(version `84833135` 2026-11-09 02:20 UTC, the owner's standing "the
deploy at the close is the owner's standing"; the deploy-lock check ran
first — S11's `4f288272` @ 100%): currena.ir/europe live-smoke-verified
at 1440×900 en (8 cards · the EU section · the UK section · the zoom ·
the 3 cross-links · the In-build chip present · 0px overflow · 0 page
errors · the live values ecb-dfr 2.50% · euro-hicp 4.0%), the §21
backtest re-run post-deploy 8/8 green, every other surface intact.
Decisions: BD-S12a (the §15 fills verified-pending-ingest — Rule 5) ·
BD-S12b (the Europe page build) + the deploy, all in `docs/DECISIONS.md`.

### ✅ S13 — Europe gates · `Session 13/30` · delivered 2026-11-09 · **Phase E CLOSED**
- Card audit, freshness, mobile/ARIA; hand-off. The In-build chip
  retires when the gates pass on the 8 placed ids (the USA trajectory:
  S9/S10 chip → S11 retirement). The §15 fill ingest (verified from
  production egress + the ECB M3 dimension walk) may land here or in a
  dedicated fill session — the candidates are recorded in DECISIONS.md
  (BD-S12a).

**S13 delivery record (2026-11-09):** Phase E (Europe) is CLOSED — the
Europe gates session delivered the S11 pattern applied to Europe over the
S12-complete /europe page (the 8 placed cards, no new layers — the
gates + polish session). **(a) The full card-render audit vs the
placement table (BD-S13a — the S11 UsaPage.test.tsx pattern mirrored for
Europe):** the new `EuropePage.test.tsx` render audit (7 tests) — the
shell (title + purpose + data-as-of, the In-build chip ABSENT), the S8
zoom on top through every state (4 STOXX50E/DAX/CAC/FTSE cards), the EU
section (6) + the non-EU UK section (2) listed apart (D-33), the 8
cards in placement order with the §21 trio (value · 10-year position ·
freshness — the percent/points/index joins pinned output-for-output
against `formatReadingValue`), the cross-links (3, 44px, → /currencies),
the fail-closed paths (an absent card → "Cannot read yet"; a dead
projection → the error state + retry; the M-17 last-good cached paint),
and the fa/RTL rendering. **(b) The freshness-within-cadence-grace
audit as the session's own gate (the pure `auditUsaFreshness` over
`EUROPE_CARD_IDS` — already wired in S12's `europe-backtest-core.ts` +
the offline suite, formalized the way S11 did for USA; S13 runs it live
as the gate):** the live `pd-s12-backtest.ts` against PRODUCTION —
btp-bund-spread 100d beyond its 75d monthly grace AND honestly carrying
the engine's `stale` status (the page speaks the engine's own word,
never a silent stale-by-age card the engine missed). **(c) The
mobile/ARIA pass (BD-S13b — spec §18 D-48):** the cross-link cards
already carry `min-h-[44px]` (S12 applied the S11 lessons), the section
headings carry the `<section aria-label>` + `<h2>` semantics (the
established USA pattern — `<article>` + `<h4>` for cards), and the RTL
flow rides the logical CSS + the `<bdi dir>` joins — the render audit
now PINS the 44px touch target + the section semantics + the fa/RTL
rendering, and the 4-leg browser pass confirmed all green. No code
change was needed (the S12 build carried the S11 lessons); the pass is
the verification + the pin. **(d) The In-build chip retired + the Europe
budget row (BD-S13c — BD-S12b's completion):** the Europe page's honest
"In build" status chip is REMOVED from the heading block — the 8 placed
ids' gates pass (§21 card audit 8/8 green, the freshness audit honest,
the mobile/ARIA pass landed); the page's 8 placed cards are complete and
verified, no honest "in build" claim remains. The `pd.statusBuilding`
key stays for `RegionPage` (Asia-Pacific/Australia) + `PagePlaceholder`
(Commodities/Currencies). The Europe lazy chunk gets its own budget row
(the S9/S10 pattern): measured 10.07/3.06 vs a 14/5 ceiling. **(e) The
§15 FRED-only fills carried forward (BD-S13d — verified-pending-ingest,
Rule 5):** the three D-34 Europe fills (euro-area unemployment ·
industrial production · ECB-SDMX M3 liquidity) are NOT ingested in S13
— the candidates stay verified-pending-ingest (Rule 5 — BD-S12a). S13's
scope is the display-layer gates; the ingest is an ENGINE-layer change
that deserves its own focused session, and the verification needs
production egress the dev sandbox can't reach; their absence does not
make the 8 placed cards "in build" (the chip retires on the gates pass,
the USA trajectory). **THE §21 DIFF (the S13 gate's own — re-audited as
the session's own gate, run LIVE twice pre-deploy and post-deploy): 8
cards · 8 green · 0 red.** The live `pd-s12-backtest.ts` against
PRODUCTION: the 8 cards' trio inputs byte-identical (page ≡ engine),
the EU/non-EU group membership 6/2 + 8/8 carried, the freshness audit
honest (btp-bund-spread 100d > 75d AND status 'stale'). **The browser
pass** (the freshly built SPA through the local preview server, /api
proxied to currena.ir): 1440×900 AND 360×844 in BOTH en and fa (RTL,
Persian digits) — 8 cards (EU=6/UK=2), the zoom (4 STOXX50E/DAX/CAC/
FTSE), the 3 cross-links all at 44px, the In-build chip ABSENT on all 4
legs, NO horizontal scroll at any width in any locale (overflow 0px on
all 4 legs), ZERO console/page errors across all 4 legs; the fa leg
dir=rtl + h1="اروپا". **Gates ALL GREEN** (secret scan 8/977 · tsc 6/6 ·
eslint 0/0 · copy:audit clean (no new fa strings — S13 only removed the
chip + added a test) · narrator vocabulary in sync + eval 50 · layer1
11,819/11,819 · **the suite 14,952 = +7** (EuropePage render audit) ·
build + budgets held — entry 270.28/81.87, the Europe lazy chunk
10.07/3.06 vs its new 14/5 row). **Deployed + live-verified** (version
`b11fd84f` 2026-11-09 ~03:44 UTC, the owner's standing "the deploy at
the close is the owner's standing"; the deploy-lock check ran first —
S12's `84833135` @ 100%): currena.ir/europe live-smoke-verified at
1440×900 en (8 cards · the EU section · the UK section · the zoom · the
3 cross-links · the In-build chip ABSENT · 0px overflow · 0 page errors
· the live value ecb-dfr 2.50%) + at 360×844 fa (RTL, dir=rtl,
h1="اروپا", 0px overflow · 0 page errors), the §21 backtest re-run
post-deploy 8/8 green, every other surface intact. Decisions: BD-S13a
(the card-render audit + the live §21 diff as the session's gate) ·
BD-S13b (the mobile/ARIA pass — 44px + semantics + RTL, pinned +
browser-verified) · BD-S13c (the In-build chip retired + the Europe
budget row — BD-S12b's completion) · BD-S13d (the §15 fills carried
forward — Rule 5) + the deploy, all in `docs/DECISIONS.md`.

## Phase F — Asia & Pacific (S14–S15)

### ✅ S14 — Asia build + fills · `Session 14/30` · delivered 2026-11-09 · **Phase F opens**
- Five sub-regions (D-35): China · Japan · Korea/Taiwan/HK · India ·
  Pacific (NZ, D-17); Asia zoom map; FRED CPI fills for JP/KR/IN (D-36,
  verify-first).

**S14 delivery record (2026-11-09):** Phase F (Asia & Pacific) is OPEN —
the Asia build + fills session delivered the /asia-pacific page over the
S13-complete codebase (the 11 placed cards + the S8 zoom + the cross-
links + the §21 backtest + the §15 CPI fills VERIFIED STALE — Rule 5).
**(a) The Asia page build (BD-S14b — spec §9 items 1–6; D-35):** the
five sub-regions organized by sub-region NOT by theme — China (§9 item
1: china-pmi · china-cpi · oecd-cli-cn · gpr-china · gpr-taiwan ·
china-property-investment · china-steel-output, 7 cards) · Japan (§9
item 2: jgb-10y · boj-rate, 2 cards) · Korea/Taiwan/HK (§9 item 3:
INDEX-ONLY today — the placement group is empty; KOSPI · TAIEX · HSI
ride the zoom; the Korea CPI fill is verified-pending-ingest) · India
(§9 item 4: INDEX-ONLY today — NIFTY50 rides the zoom; the India CPI
fill is verified-pending-ingest) · Pacific New Zealand (§9 item 5:
nz-short-rate · nz-10y, 2 cards) = 11 placed cards, each with the §21
trio (value · 10-year position · freshness) through the pure asia-tiles
(pinned output-for-output against config/display.ts's formatReadingValue
by asia-tiles.test.ts, the S9 usa-tiles / S12 europe-tiles pattern); the
S8 zoom section on top (RegionIndexSection region='asia' — the N225 ·
KOSPI · HSI · SSEC · TAIEX · NIFTY50 zoom already renders it); the
cross-links strip (§9: usdcny · usdjpy → /currencies + sge-gold →
/gold). The honest "In build" chip stays (BD-S14a — the §15 CPI fills
are verified-pending-ingest; retires at the S15 gates pass, the Europe
S12→S13 trajectory). china-steel-output's tonnes+scale (1e-2 → 73.6 m
tonnes) is the ONE Asia id beyond Europe's three-unit lean render — the
AsiaCardDisplayConfig carries an optional `scale` field, pinned output-
for-output against formatReadingValue over all four unit families. The
two index-only sections render an HONEST note (never an empty card grid)
— their markets ride the zoom, the §15 CPI fills are pending. **(b) The
§21 backtest (the S14 gate):** asia-backtest-core.ts (the page ≡ engine
trio diff over the 11 cards, reusing S11's pure auditUsaFreshness — one
audit function, no logic drift) + asia-backtest.test.ts (11 tests: the
GREEN path, the public-mode twin, four FAIL-CLOSED proofs, the
stableStringify immunity, + the freshness audit's own cases on Asia's
cadences — jgb-10y daily maxAge 4, china-pmi monthly maxAge 45, boj-rate
monthly maxAge 75 the honest-stale path; Asia has NO per-change id,
unlike Europe's boe-rate) + the live pd-s14-backtest.ts script. The copy
pins: asia-copy-pin.test.ts (the 11 card names + units + position/band/
status words ↔ the corpus, both locales) + the 47 new pd.asiaPacific.*
fa strings queued unreviewed in the manifest. **(c) The §15 FRED-only
CPI fills — VERIFIED STALE (BD-S14a, Rule 5):** the three D-36 Asia
fills (Japan · Korea · India CPI YoY) are NOT ingested in S14. The FRED
OECD mirror family candidates were probed LIVE (FRED was REACHABLE from
the dev sandbox this session, unlike the S12 Europe attempt which hit
the JS challenge); the candidates are VERIFIED STALE/discontinued:
JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06; KORCPIALLMINMEI +
CPALTT01KRM659N end 2023-11; INDCPIALLMINMEI + CPALTT01INM659N end
2025-03. The World Bank FP.CPI.TOTL.ZG (annual, fresh through 2025) is
a viable alternative but a different cadence + provider. The candidates
+ the alternative sources are recorded in DECISIONS.md (BD-S14a) for a
dedicated fill session. **THE §21 DIFF (the S14 gate's own, run LIVE
twice pre-deploy and post-deploy): 11 cards · 11 green · 0 red.** The
live pd-s14-backtest.ts against PRODUCTION: the 11 cards' trio inputs
byte-identical (page ≡ engine — china-pmi 49.3 warning · china-cpi 0.9
normal · oecd-cli-cn 97.41 context · gpr-china 0.84 context · gpr-taiwan
0.08 context · china-property-investment -20.6 context · china-steel-
output 7359 context · jgb-10y 2.696 context · boj-rate 1.043 context ·
nz-short-rate 3.25 context · nz-10y 4.94 context), the placement group
membership (china 7 / japan 2 / korea-taiwan-hk 0 index-only / india 0
index-only / pacific-nz 2) + 11/11 carried, the two index-only groups
honestly empty, the freshness audit honest (all 11 within cadence
grace). **The browser pass** (the freshly built SPA through the local
preview server, /api proxied to currena.ir): 1440×900 AND 360×844 in
BOTH en and fa (RTL, Persian digits) — 11 cards, the zoom (6 N225/KOSPI/
HSI/SSEC/TAIEX/NIFTY50), the 5 sections (3 card + 2 index-only), the 3
cross-links all at 44px, the In-build chip PRESENT on all 4 legs, NO
horizontal scroll at any width in any locale (overflow 0px on all 4
legs), ZERO console/page errors across all 4 legs; the fa leg dir=rtl +
h1="آسیا و اقیانوسیه". **Gates ALL GREEN** (2m 33s: secret scan 8/986 ·
tsc 6/6 · eslint 0/0 · copy:audit clean (818 queued, +47) · narrator
vocabulary in sync + eval 50 · layer1 11,819/11,819 · **the suite
14,985 = +33** (asia-tiles 13 · asia-backtest 11 · asia-copy-pin 2 ·
AsiaPage render audit 7) · build + budgets held — entry 270.48/81.90,
the Asia lazy chunk 12.47/3.47 vs its new 16/6 row). **Deployed + live-
verified** (version `68281479` 2026-11-09 ~04:55 UTC, the owner's
standing "the deploy at the close is the owner's standing"; the deploy-
lock check ran first — S13's `b11fd84f` @ 100%): currena.ir/asia-pacific
live-smoke-verified at 1440×900 en (11 cards · the 5 sections · the zoom
· the 3 cross-links · the In-build chip PRESENT · 0px overflow · 0 page
errors · the live value china-pmi 49.3 index) + the live §21 backtest
re-run post-deploy 11/11 green, every other surface intact. Decisions:
BD-S14a (the §15 CPI fills VERIFIED STALE — Rule 5) · BD-S14b (the Asia
page build) + the deploy, all in `docs/DECISIONS.md`.

### ✅ S15 — Asia gates · `Session 15/30` · delivered 2026-11-09 · **Phase F CLOSED**
- Fill verification vs national statistics releases; card audit; hand-off.

**S15 delivery record (2026-11-09):** Phase F (Asia & Pacific) is CLOSED —
the Asia gates session applied the S13 Europe-gates pattern to Asia over
the S14-complete /asia-pacific page (the 11 placed cards, no new layers —
the gates + polish session). **(a) The card-render audit + the live §21
diff as the session's own gate (BD-S15a — the S11 UsaPage.test.tsx /
S13 EuropePage.test.tsx pattern mirrored for Asia):** the S14
`AsiaPage.test.tsx` render audit (7 tests — ALREADY in place) is re-
audited as the session's own gate, its chip assertion flipped from
`getByText('In build').toBeTruthy()` → `queryByText('In build')
.toBeNull()` + a final `not.toContain('In build')` (the EuropePage S13
pattern). The live `pd-s14-backtest.ts` re-run against PRODUCTION twice
(pre-deploy and post-deploy): 11 cards · 11 green · 0 red (page ≡
engine byte-for-byte — china-pmi 49.3 warning · china-cpi 0.9 normal ·
oecd-cli-cn 97.41 context · gpr-china 0.84 context · gpr-taiwan 0.08
context · china-property-investment -20.6 context · china-steel-output
7359 context · jgb-10y 2.696 context · boj-rate 1.043 context ·
nz-short-rate 3.25 context · nz-10y 4.94 context), the placement group
membership china 7 / japan 2 / korea-taiwan-hk 0 index-only / india 0
index-only / pacific-nz 2 + 11/11 carried, the freshness audit honest
(all 11 within cadence grace — Asia has NO honest-stale path to
exercise, unlike Europe's btp-bund-spread). **(b) The freshness-within-
cadence-grace audit as the session's own gate** (the pure
`auditUsaFreshness` over `ASIA_CARD_IDS` — already wired in S14's
`asia-backtest-core.ts` + the offline suite; S15 runs it live as the
gate — the pd-s14-backtest.ts step 4, all 11 within grace). **(c) The
mobile/ARIA pass (BD-S15b — spec §18 D-48):** the cross-link cards
already carry `min-h-[44px]` (S14 applied the S11/S13 lessons), the
section headings carry the `<section aria-label>` + `<h2>` semantics,
the RTL flow rides the logical CSS + the `<bdi dir>` joins — the render
audit PINS the 44px + the section semantics + the fa/RTL rendering, and
the 4-leg browser pass confirmed all green. No code change was needed
(the S14 build carried the S11/S13 lessons); the pass is the
verification + the pin. **(d) The In-build chip retired + the Asia
budget row tightened (BD-S15c — BD-S14b's completion):** the Asia
page's honest "In build" status chip is REMOVED from the heading block
— the 11 placed ids' gates pass (§21 card audit 11/11 green, the
freshness audit honest, the mobile/ARIA pass landed); the page's 11
placed cards are complete and verified, no honest "in build" claim
remains. The `pd.statusBuilding` key stays for `RegionPage` (Australia)
+ `PagePlaceholder` (Commodities/Currencies). The Asia budget row's
COMMENT is tightened (the S13 Europe pattern): the 16/6 ceiling holds;
the chip removal shaved ~0.28kB raw (the measured chunk 12.47/3.47 →
12.19/3.37). **(e) The §15 FRED-only CPI fills carried forward
(BD-S15d — Rule 5):** the three D-36 Asia fills (Japan · Korea · India
CPI YoY) are NOT ingested in S15 — the candidates stay verified-
pending-ingest (Rule 5 — BD-S14a: the FRED OECD mirror family is
VERIFIED STALE/discontinued). A viable monthly source must be picked
(the national statistics bureaus directly, a fresh FRED/IMF IFS series,
or the World Bank annual as a lower-resolution fallback) — a dedicated
fill session. **THE BROWSER PASS** (the freshly built SPA through the
local preview server, /api proxied to currena.ir, over the REAL
production data): 1440×900 AND 360×844 in BOTH en and fa (RTL, Persian
digits) — 11 cards (China=7/Japan=2/NZ=2), the zoom (6 N225/KOSPI/HSI/
SSEC/TAIEX/NIFTY50), the 5 sections (3 card + 2 index-only), the 3
cross-links all at 44px, the In-build chip ABSENT on all 4 legs, NO
horizontal scroll at any width in any locale (overflow 0px on all 4
legs), ZERO console/page errors across all 4 legs; the fa legs dir=rtl
+ h1="آسیا و اقیانوسیه" + Persian digits (۴۹٫۳ به‌صورت شاخص · ۷۳٫۶
میلیون تن · ۲٫۷۰٪). **GATES ALL GREEN** (2m 31s: secret scan 8/986 ·
tsc 6/6 · eslint 0/0 · copy:audit clean (no new fa strings — S15 only
removed the chip + flipped the test assertion + tightened the budget
comment) · narrator vocabulary in sync + eval 50 · layer1
11,819/11,819 · **the suite 14,985** (unchanged from S14 — the test
count is the same; the assertions changed) · build + budgets held —
entry 270.48/81.91, the Asia lazy chunk 12.19/3.37 vs its 16/6 row).
**Deployed + live-verified** (version `6f96cd9a` 2026-11-09 ~13:56 UTC,
the owner's standing; the deploy-lock check ran first — S14's
`68281479` @ 100%): currena.ir/asia-pacific live-smoke-verified at
1440×900 en (11 cards · the 5 sections · the zoom · the 3 cross-links ·
the In-build chip ABSENT · 0px overflow · 0 page errors · the live
value china-pmi "49.3 index") + at 360×844 fa (RTL, dir=rtl,
h1="آسیا و اقیانوسیه", the live value china-pmi "۴۹٫۳ به‌صورت شاخص",
0px overflow · 0 page errors), the §21 backtest re-run against
production post-deploy 11/11 green, every other surface intact.
Decisions: BD-S15a (the card-render audit + the live §21 diff as the
session's gate) · BD-S15b (the mobile/ARIA pass — 44px + semantics +
RTL, pinned + browser-verified) · BD-S15c (the In-build chip retired +
the Asia budget row tightened — BD-S14b's completion) · BD-S15d (the
§15 CPI fills carried forward — Rule 5) + the deploy, all in
`docs/DECISIONS.md`.

## Phase G — Australia (S16)

### ✅ S16 — Australia build & gates · `Session 16/30` · delivered 2026-11-10 · **Phase G CLOSED**
- AU Markets board on top; the 5-gauge structure unchanged (D-37); 28 cards;
  moved-out seat chips link to new homes (currencies/commodities/asia/gold).
- **Gates:** seat chips resolve; board freshness; mobile/ARIA; hand-off.

**S16 delivery record (2026-11-10):** Phase G (Australia) is CLOSED — the
owner's home market, reorganized only (D-37), built + gated in ONE
session (M1 the pure tiles + copy + pins prior session `f078e37`; M2 the
page build prior session `ba188cb`; M3 the §21 backtest + the render
audit + the full gates + the In-build chip RETIRED, this session). **(a)
M1 — the pure australia-tiles + the en/fa pd.australia copy + the pins:**
the 28 card-display configs (the S9–S15 pattern — no new layers, no new
fetches) + the en/fa `pd.australia.*` copy (the 139 keys, corpus-pinned
by `australia-copy-pin.test.ts`) + the section/intro/loading/board copy.
**(b) M2 — the page build:** the REUSED AU Markets board (19 symbols:
All Ordinaries · Small Ordinaries · 10 ASX-200 sectors · 4 big banks ·
ASX 200 VIX · NZX50) via the lean adapter (no new drawing — the markets
board's own feed); the 5-gauge structure D-37 (3 voting — au-inflation-
rates 6 · au-households 11 · au-trade-currency 2; 2 shadow — au-activity
7 + au-external 1; + gpr-australia = 28 cards) with every card carrying
the §21 trio (value · 10-year position · freshness); the 11 moved-out
seat chips → their new homes (/currencies · /asia-pacific · /commodities
· /gold) at 44px. `RegionPage` was deleted in M2 (the Australia page is
its own build now); the `pd.statusBuilding` key stays for
`PagePlaceholder` (Commodities/Currencies). **(c) M3 — the §21 backtest
(BD-S16a):** the pure `australia-backtest-core.ts` reusing S11's
`auditUsaFreshness` over `AUSTRALIA_CARD_IDS` (28 cards) + the offline
suite (11 tests: the full pipeline + the public-mode twin + the 4 fail-
closed proofs [an absent card → "Cannot read yet"; a dead projection →
the error state + retry; the M-17 last-good cached paint; the public-mode
twin] + the key-order immunity + the 4 freshness cases) + the live
`pd-s16-backtest.ts` (the S14 `pd-s14-backtest.ts` asia pattern
mirrored). The live run vs production (pre-deploy): 28/28 green
(page ≡ engine byte-for-byte), the 6-group membership green (inflation-
rates 6/6 · households 11/11 · trade-currency 2/2 · activity 7/7 ·
external 1/1 · world-risk 1/1 = 28 cards; 11 moved-out disjoint), the
freshness audit HONEST. **(d) The render audit (BD-S16b):**
`AustraliaPage.test.tsx` (7 tests — the S15 AsiaPage.test.tsx pattern
scoped to Australia's 28 cards): fixture sanity + loading + the full
shell+zoom+board+5-gauges+world-risk render with the §21 trio spot
checks + the 11 seat chips at 44px resolving to /currencies + /asia-
pacific + /commodities + /gold + the fail-closed absent + the fail-
closed dead-projection + the M-17 last-good + the fa/RTL Persian
rendering. **(e) The In-build chip RETIRED at the gates pass (BD-S16c —
the S13 Europe / S15 Asia trajectory, BD-S15c mirrored):** the Australia
page's honest "In build" chip is REMOVED from the heading block — the
28 placed ids' gates pass (§21 card audit 28/28 green, the freshness
audit honest, the mobile/ARIA pass pinned). The AustraliaPage chunk
shrank 22.76→22.48 raw / 5.92→5.82 gzip (the chip removal's few bytes);
the 26/7 ceiling holds (the S13/S15 pattern — not re-based down so a
future fill-session has the same room). **(f) The freshness honest-stale
finding (BD-S16d — the S11 freshness-audit formalization mirrored, with
the AU honest-stale path EXERCISED unlike Asia's):** 7 AU cards beyond
cadence grace (au-unemployment 69d>60d · terms-of-trade 222d>215d ·
au-gdp-growth 222d>215d · au-population-growth 312d>270d ·
au-participation 69d>60d · au-underemployment 69d>60d · au-nom
312d>270d), ALL 7 honestly carrying the engine's stale status (0
unflagged); 19 within grace. The AU per-change ids (rba-cash-rate ·
rba-fed-gap) ride the exempt path (no cadence grace window to violate).
**THE LIVE §21 DIFF (pre-deploy + post-deploy re-verified): 28 cards · 28 green · 0 red**, the
6-group membership green, the freshness audit HONEST (19 within grace
+ 7 beyond grace all flagged), the two feeds one snapshot (generatedAt
aligned). **GATES ALL GREEN** (2m 35s: secret scan 8/994 · tsc 6/6 ·
eslint 0/0 · copy:audit clean · narrator vocabulary in sync + eval 50 ·
layer1 11,819/11,819 · **the suite 15,019** · build + budgets held —
entry 270.42/81.88, the AustraliaPage chunk 22.48/5.82 vs its 26/7 row).
**Deployed + live-verified** (version `9d60726b` 2026-11-10 ~20:30 UTC, the owner's standing): currena.ir/australia live-smoke-verified at 1440×900 en (28 cards · the 6 sections · the AU Markets board · the zoom · the 11 seat chips · the In-build chip ABSENT · 0px overflow · 0 page errors) + at 360×844 fa (RTL, dir=rtl, h1='استرالیا', Persian card values, 0px overflow · 0 page errors), the §21 backtest re-run against production post-deploy 28/28 green, every other surface intact. Production moved `6f96cd9a` → `9d60726b`.
Decisions: BD-S16a (the §21 australia backtest) · BD-S16b (the
AustraliaPage render audit) · BD-S16c (the In-build chip retired + the
Australia budget row) · BD-S16d (the freshness honest-stale finding) +
the deploy record (worker `9d60726b`), all in `docs/DECISIONS.md`.

## Phase H — Commodities (S17)

### ✅ S17 — Commodities build & gates · `Session 17/30` · delivered 2026-11-11 · **Phase H CLOSED**
- Energy · Metals · Agriculture · Digital groups + "Trade routes & supply"
  (D-38/D-39); live prices; gold cross-links (D-19/D-27).
- **Gates:** all 24 cards; chokepoint data within PortWatch cadence;
  hand-off.

**S17 delivery record (2026-11-11):** Phase H (Commodities) is CLOSED —
every commodity, exclusively here (D-19), reorganize-only, built + gated
in ONE session (M1 the pure tiles + copy + pins; M2 the page build + the
App.tsx wiring; M3 the §21 backtest + the render audit + the full gates +
the In-build chip RETIRED). **(a) M1 — the pure commodities-tiles + the
en/fa pd.commodities copy + the pins:** the 24 card-display configs (the
S9–S16 pattern — no new layers, no new fetches) + the en/fa
`pd.commodities.*` copy (the 57 keys, corpus-pinned by
`commodities-copy-pin.test.ts` — the 24 card names + the 5 unit words +
the position/band/status words) + the 5 group headings/intros + the gold
cross-link words + the loading/error lines (fresh). **(b) M2 — the page
build:** `CommoditiesTierCards.tsx` (the five group sections — Energy 9 ·
Metals 4 · Agriculture 3 · Digital 2 · Trade routes & supply 6 = 24 cards
with the §21 trio, every card context-only per G-5 — no gauges, no
verdict lines) + `CommoditiesPage.tsx` (the S2 projection contract + the
M-17 last-good localStorage pattern + the fail-closed loading/error
states) + the App.tsx wiring (/commodities leaves the placeholder set —
DESTINATION_ROUTES now holds only /currencies, S18). The metals group
carries the gold cross-link to /gold (§11 "Cross-links", D-19/D-27 — the
one commodity exception). **(c) M3 — the §21 backtest (BD-S17a):** the
pure `commodities-backtest-core.ts` reusing S11's `auditUsaFreshness` over
`COMMODITIES_CARD_IDS` (24 cards) + the offline suite (11 tests: the full
pipeline + the public-mode twin + the 4 fail-closed proofs + the
key-order immunity + the 4 freshness cases — the honest-stale path over
iron-ore monthly maxAge 60) + the live `pd-s17-backtest.ts` (the S16
`pd-s16-backtest.ts` pattern mirrored). The live run vs production (pre-
AND post-deploy): 24/24 green (page ≡ engine byte-for-byte), the 5-group
membership green (energy 9/9 · metals 4/4 · agriculture 3/3 · digital 2/2
· trade-routes-supply 6/6 = 24 cards), the freshness audit HONEST (24
within grace, 0 beyond — all fresh; unlike Australia's 7 honest-stale,
Commodities had NO honest-stale path to exercise). **(d) The render audit
(BD-S17b):** `CommoditiesPage.test.tsx` (7 tests — the S16
AustraliaPage.test.tsx pattern scoped to Commodities' 24 cards): fixture
sanity + loading + the full shell+5-sections+24-cards+gold-cross-link
render with the §21 trio spot checks (the usd prefix 'US$73.45' · the
barrels '416.7 m barrels' · the barrels-per-day '13.99m barrels a day' ·
the transits '65.3 transits a day' · the index '121.3 index') + the gold
link click-nav to /gold at 44px + the fail-closed absent + the fail-
closed dead-projection + the M-17 last-good + the fa/RTL Persian
rendering (h1='کالاها و انرژی' · brent='۷۳٫۴۵ دلار' · suez='۶۵٫۳ تردد
در روز' · dir=rtl). **(e) The In-build chip RETIRED at the gates pass
(BD-S17c — the S13 Europe / S15 Asia / S16 Australia trajectory,
BD-S16c mirrored):** the Commodities page's honest "In build" chip is
REMOVED from the heading block — the 24 placed ids' gates pass (§21 card
audit 24/24 green, the freshness audit honest, the render audit 7/7
green, the browser pass 4/4 green). The `pd.statusBuilding` key stays for
`PagePlaceholder` (Currencies — the last placeholder). The CommoditiesPage
chunk measured 11.93/3.41 vs its 16/5 ceiling (the leanest page-division
chunk — no zoom, no board, no gauges; not re-based down so a future
fill-session has the same room). **THE LIVE §21 DIFF (pre-deploy +
post-deploy re-verified): 24 cards · 24 green · 0 red**, the 5-group
membership green, the freshness audit HONEST (24 within grace, 0 beyond),
the two feeds one snapshot (generatedAt aligned), the projection declares
NO boards (the placement §11 contract). **GATES ALL GREEN** (typecheck
6/6 · eslint 0/0 · copy:audit clean · **the suite 15,053 = +34**
[commodities-tiles 14 · commodities-copy-pin 2 · commodities-backtest 11
· CommoditiesPage render audit 7] · build + budgets held — entry
270.69/81.95, the CommoditiesPage chunk 11.93/3.41 vs its 16/5 row).
**Deployed + live-verified** (version `08e0fc64` 2026-11-11, the owner's
standing — the deploy-lock check ran first: S16's `9d60726b` @ 100%, no
parallel deploy; production moved `9d60726b` → `08e0fc64`):
currena.ir/commodities live-smoke-verified at 1440×900 en (24 cards · the
5 sections · the gold cross-link → /gold · the In-build chip ABSENT · 0px
overflow · 0 page errors · the live value brent 'US$92.17' · eia-crude-
stocks '691.9 m barrels' · chokepoint-suez '43.0 transits a day') + at
360×844 fa (RTL, dir=rtl, h1='کالاها و انرژی', the live value brent
'۹۲٫۱۷ دلار' · chokepoint-suez '۶۵٫۳ تردد در روز', 0px overflow · 0 page
errors), the §21 backtest re-run against production post-deploy 24/24
green, every other surface intact. The 3 seat chips on /australia that
link to /commodities (iron-ore · coal-aus · lng-japan) now resolve to a
real page.
Decisions: BD-S17a (the §21 commodities backtest) · BD-S17b (the
CommoditiesPage render audit) · BD-S17c (the In-build chip retired + the
Commodities budget row) + the deploy record (worker `08e0fc64`), all in
`docs/DECISIONS.md`.

## Phase I — Currency Pairs (S18)

### ✅ S18 — Currencies build & gates · `Session 18/30` · delivered 2026-11-11 · **Phase I OPENED AND CLOSED IN ONE SESSION**
- The 7 rule lights hero (D-41); the 11-pair board (D-42) with moveRank &
  bigMove; the dollar-standing section (D-32); FX-board payload wiring;
  AUDNZD joins the board.
- **Gates:** rules match the FX board KV logic exactly; 11 pairs complete;
  hand-off.

**S18 delivery record (2026-11-11):** Phase I (Currency Pairs) is CLOSED —
the build and the gates delivered whole in ONE session (the S16/S17
one-session trajectory). **(a) The engine leg (BD-S18a — D-42, "AUDNZD
joins the board"):** FxPairIdSchema += 'audnzd' (ADDITIVE — pre-S18
stored snapshots keep parsing) · FX_PAIRS += the audnzd cross in its OWN
pacificLink group · FX_PAIR_CURRENCIES = ['NZD'] (the CAD/SEK
pass-through treatment — NZD rides the SAME single Frankfurter
timeseries request, zero new provider calls) · pairRateFromUsd +=
NZD÷AUD · the Yahoo NZD=X fallback symbol · the legacy corpus's own
words for the new surface (fx.groups.pacificLink · fx.entries.audnzd ·
currencyNames/Plural.NZD, en + fa, the 6 fa strings queued unreviewed).
The seven RULES, every threshold, every pattern check and the summary
rollup are UNTOUCHED (audnzd is not a rule input). **(b) The pure tiles
+ copy + pins (M1):** currencies-tiles.ts (the two group lists [7 + 7 =
the 14 placed registry cards] via pageGroupIds · the D-42 board order =
FX_PAIR_IDS itself · the 14 display configs pinned against the DISPLAY
registry · currenciesCardValueText EQUIVALENT to formatReadingValue
output-for-output over every id × both locales [the currency prefixes
'₺34.56'/'NZ$1.2283' EN · the fa suffixes «۳۴٫۵۶ لیر ترکیه» · the AED
suffix '3.67 AED' in both locales — the registry's own non-prefixed set,
caught by the equivalence pin · the tight percent '56.70%'] ·
currenciesRuleHeadlineKey [the downgraded warning KEEPS its warning
headline — the §6.4 discipline]) + the en/fa pd.currencies.* block
(~118 keys/locale: the rule-light names/headlines/everyday words, the
status/chip/noData/barLabel/reliability/downgradeCaution words, the
board's period words + tags + footer + the calm fx-empty line, the 11
pair names, the 14 card names, the 11 unit words and the
position/band/status words — ALL pinned to the corpus byte-for-byte by
currencies-copy-pin.test.ts) + currencies-tiles.test.ts (10 tests) ALL
GREEN. **(c) The page build (M2):** CurrenciesRuleLights.tsx (the
7-light hero through the SAME §9.3 fxRuleView mapping the legacy page
reads — never restated) + CurrenciesPairBoard.tsx (the 11 pair cards:
rate · d1/m1/m3/y1 via the legacy signedPct · moveRank + its bar · the
bigMove tag · the 52-week closes as the house stretched-SVG line · the
honest stale tag) + CurrenciesTierCards.tsx (the pair-context section +
the dollar-standing section — 14 §21-trio cards, every one context-only
per G-5) + CurrenciesPage.tsx (TWO feeds: the S2 projection + the FX
board [lib/fx.ts, the markets/fx last-good discipline — never an error
surface, the calm "being prepared" line] + the fail-closed states + the
M-17 last-good on BOTH feeds) + the App.tsx wiring (DESTINATION_ROUTES
is now EMPTY — every destination renders its own page chunk). **(d) The
§21 backtest (BD-S18b):** the pure currencies-backtest-core.ts with
THREE gates — the 14-card trio diff (the S17 pattern) · the RULES gate
("the rules match the FX board KV logic exactly": the §9.3 status table
row-by-row through the SAME fxRuleView + the renderable-domain
invariant + the stored summary ≡ the engine's own summarizeFxRules
recomputed over the stored rules, zero tolerance) · the BOARD gate
("11 pairs complete": the D-42 coverage + the bigMove ≡ moveRank ≥ 90
derivation + the stale-flag honesty) — + the offline suite (14 tests:
the full pipeline + the public-mode twin + 7 fail-closed proofs + the
freshness cases) + the live pd-s18-backtest.ts (three feeds). PRE-
deploy: cards 14/14 · rules 16/16 · per-row derivations green, the D-42
coverage leg honestly RED (audnzd not yet live — the deploy's own
to-do); POST-deploy: ALL GREEN — cards 14/14 · rules 16/16 · board
23/23 (11/11 pairs) · freshness 14 within grace. **(e) The render
audit + the chip retirement (BD-S18c):** CurrenciesPage.test.tsx (8
tests — every rule-outcome shape [warning+chip · watch · supportive ·
the downgraded wobble keeping its warning sentence + the caution line ·
nodata · the R7 context lead] + the §21 trio spot checks + the
fail-closed paths + the M-17 last-good on both feeds + the fa/RTL
rendering) + the In-build chip RETIRED at the gates pass (the
S16/S17 one-session trajectory — the LAST placeholder page is real; the
CurrenciesPage chunk measured 21.09/5.33 vs its new 24/6.5 row). **(f)
The freshness finding + the data refresh:** the post-deploy §21 run
crossed the UTC-midnight grace boundary on dollar-broad/dollar-eme
(asOf 2026-10-30, 11d > 10d, status normal) — a PRE-EXISTING upstream
lag (verified against FRED directly: the source now carries
2026-11-06; the last two ingest runs had seen only the 10-30 tail — the
FRED-at-rung-time edge staleness the adapter's own D-4 note documents);
fixed through the pipeline's own lever (a workflow_dispatch ingest run
#87 wrote the refreshed snapshot — dollar-broad 121.8803 @ 2026-11-06 ·
dollar-eme 130.7713 @ 2026-11-06; its designed exit-1 alerting fires
for two TRANSIENT P1 provider timeouts [ecb-dfr + gold-aud] held on
last-good, flagged stale — the next rung retries them). **GATES ALL
GREEN** (2m 34s: secret scan 8/1013 · tsc 6/6 · eslint 0/0 · copy:audit
clean · narrator vocabulary REGENERATED + eval 50 · layer1
11,819/11,819 · **the suite 15,088 = +35** · build + budgets held —
entry 271.02/82.06, the CurrenciesPage chunk 21.09/5.33 vs its 24/6.5
row). **Deployed + live-verified — BOTH workers** (2026-11-10 ~00:05
UTC, the owner's standing; the deploy-lock check ran first: S17's
`08e0fc64` @ 100%, no parallel deploy): currena-api **`51a0fe45`** (the
new SPA + the additive FxSnapshotSchema) → currena-markets
**`8f63c8fa`** (the fx engine's new pair rides its four crons — the
first session to redeploy the markets worker since the fx build era) →
the manual fx-run KV seed (the Path-B pattern: ONE live Frankfurter
call → the 11-pair snapshot → the KV REST write; 10 pairs held
same-date-stable + audnzd the new row: rate 1.22827 · asOf 2026-11-09 ·
moveRank 60.39 · 52 weekly closes). Post-deploy §21 ALL GREEN; the
4-leg browser pass (1440×900 + 360×844, en + fa) 4/4 GREEN — 7 lights
· 11 pair cards (audnzd last) · 14 registry cards · the In-build chip
ABSENT · 0px overflow · ZERO console/page errors on every leg · the fa
legs dir=rtl + Persian digits; the legacy surfaces intact (the
/insights fx table honestly showing the FOURTH group block
"Australia–New Zealand (1)" with the audnzd row — verified live).
Decisions: BD-S18a (the AUDNZD engine leg) · BD-S18b (the §21
currencies backtest) · BD-S18c (the render audit + the In-build chip
retired + the budget row) + the deploy record, all in
`docs/DECISIONS.md`.

## Phase J — Integration (S19–S21)

### ✅ S19 — Navigation, mobile & SEO polish · `Session 19/30` · delivered 2026-11-12 · **Phase J OPEN**
- Topbar/drawer final pass across all pages; sticky footers; meta/OG tags
  per page; breadcrumbs.

**S19 delivery record (2026-11-12):** Phase J (Integration) is OPEN — the
navigation, mobile & SEO polish delivered whole over the S18-complete
tree (every page real; the pass is the polish + verification session).
**(a) The topbar/drawer final pass + the language quick-toggle
(BD-S19a — the HANDOFF item 6):** the pass verified the D-45 topbar and
the mobile drawer on EVERY route × both widths × both locales (the
dropdowns + active states + the 44px drawer rows + the one-unwrapped-
line-at-1024 constraint all re-proven live); the HANDOFF item 6's
"theme words" read is DISPROVEN against the deployed DOM (both locales ×
both widths: the visible label is the target language's own word
'فا'/'EN', the aria-label was already the correct 'Toggle language'/
«تغییر زبان») — the polish that rides it: the accessible name + tooltip
now NAME THE TARGET ('Switch to Farsi' / «تغییر به انگلیسی»; the generic
'toggle language' retired from both dictionaries + the manifest). The
two S1-noted legacy-hero mobile items closed with it (BD-S19d): the ⓘ
wrap on the data-as-of line (the date + prices units are separate
non-breaking bdis — "UTC ⓘ" never orphans, verified in the live DOM)
and the state-pill icon spacing (the gap 0.375rem → 0.5rem + a touch
more padding). **(b) The breadcrumbs (BD-S19b):** the shared
`PageBreadcrumbs` — a REAL Home link routed through the path router
once (no reload), the current page as an aria-current span (the
WAI-ARIA pattern), the separator aria-hidden + mirrored in RTL, the
Footer's 32px hit-area precedent — wired into the EIGHT destinations'
heading blocks; Global IS Home (no trail) and the legacy /insights
keeps its deprecation banner as the wayfinding bridge; the wiring
pinned in every page's shell test + the component's own 4-test suite.
**(c) The per-page meta/OG (BD-S19c):** the pure `lib/route-meta`
table (the S1 titleKeyFor switch moved verbatim + regression-pinned)
feeds the App shell's extended <head> effect — per-route description
(the nine destinations REUSE their dictionary PURPOSE lines, D-48;
everything else the new app-wide `app.metaDescription`), og:title/
og:description/og:url/og:locale + twitter:title/description + the
canonical link, find-or-create idempotent writers (7 tests); the static
index.html defaults + the PWA manifest description refreshed from the
converter-era wording to the whole-product sentence; true per-route SSR
OG recorded as out of scope by the repo's own SPA-only rule.
**(d) The sticky footers (BD-S19d):** the shell's min-h-screen flex
column seats the footer at the viewport bottom on short pages — VERIFIED
on every route at both widths in both locales (Global exactly one
screen at 1440×900 AND 360×844, footer bottom = viewport height; long
pages push it below content, never overlapping); the rider that landed:
`.app-footer`'s padding-block-end respects the iOS home-indicator inset
on viewport-fit=cover devices. **(e) The S18 transient P1 glance (the
roadmap's own ask):** gold-aud SELF-CLEARED (asOf 2026-11-10, fresh at
the latest rung); ecb-drf still carries the stale flag (value 2.5 held
on last-good) — per the HANDOFF's own rule it now belongs to a
maintenance session. **GATES ALL GREEN** (2m 38s: secret scan 8/1018 ·
tsc 6/6 · eslint 0/0 · copy:audit clean (the 4 new fa strings queued
unreviewed) · narrator in sync + eval 50 · layer1 11,819/11,819 · the
suite **15,099 = +11** (PageBreadcrumbs 4 · route-meta 7) · build +
budgets held — entry 272.83/82.52, every page chunk within its row).
**The browser pass:** all 10 routes × 1440×900 + 360×844 × en + fa over
the live production data — the per-route titles/descriptions/canonicals/
og:locale, the trails on the 8 destinations only, the RTL-mirrored
chevron (CSSOM + VLM verified), the drawer + dropdowns, the language
toggle's new labels, the hero fixes in the live DOM, 0px overflow on
every leg, ZERO console/page errors. **Deployed + live-verified**
(currena-api **`74777037`**, the owner's standing — a WEB-ONLY deploy,
the markets worker untouched by the code-unchanged convention; the
deploy-lock check ran first: S18's `51a0fe45` @ 100%; the deployed
entry chunk byte-verified identical to the local build; the live
acceptance re-ran the checks on currena.ir — all green; rollback: one
`wrangler rollback`, every surface returns to the S18 shape).
Decisions: BD-S19a · BD-S19b · BD-S19c · BD-S19d + the deploy record
(`74777037`), all in `docs/DECISIONS.md`.

### ✅ S20 — Full-site regression + verdict backtest + data audit · `Session 20/30` · delivered 2026-11-12 · **Phase J (S20 done)**
- Every page × every gate from §21 of the spec; N=20 random-id source
  spot-check (Rule 5); performance budget check.

**S20 delivery record (2026-11-12):** the full-site regression delivered
whole — every page × every §21 gate re-run against the S19 tree AND
production, ALL GREEN, and NO deploy (nothing was fixed; the owner's
standing). **(a) The §21 data audit (Rule 5, BD-S20a):** the N=20
random-id source spot-check shipped as a re-runnable LIVE tool —
`apps/web/scripts/pd-s20-data-audit.ts` (the pd-* backtest family's own
pattern: manual, never in the suite, writes nothing) — with the sample
FROZEN for the record (seeded uniform random `random.Random(20261112)
.sample` over the 184 registry ids; 11 distinct providers: fred 6 · gpr
3 · eia 2 · derived 2 · abs/portwatch/frb/gold-api/sge/bazg/fiscaldata
1 each); each id's value fetched from ITS OWN upstream publisher through
the repo's own adapter parsers (imported verbatim through a new
ADDITIVE export block on `@currena/insights/adapters` — zero behavior
change), the derivation replicated exactly as the ingest computes it
(`yoyPctSeries` · the Pink Sheet copper÷gold ratio · the 4dp
`quantizedGap` DGS10−jgbcme discipline · the PortWatch MA7 · the SGE
month's OWN PDF), compared AT THE STORED asOf (freshness notes, never
silent mismatches; the platinum live-spot arm records the intraday move
as the §21 designed, explained difference). THE RUN (2026-11-10T04:07Z,
vs production): ALL 20 GREEN — 19 byte-exact + platinum the 0.25%
intraday spot move (recorded). **(b) The verdict backtests (§21 zero
tolerance):** ALL ELEVEN live pd-* scripts re-run against production —
715 checks, ALL GREEN (s4 Global 84 + the narrator raw-KV stateHash
recompute IDENTICAL · s5 Gold 150 · s7 World Markets 56 · s8 zooms 9 ·
s9 USA 115 · s10 USA tiers+TIC 115+48 · s12 Europe 8 · s14 Asia 11 ·
s16 Australia 28 · s17 Commodities 24 · s18 Currencies 14+16+23 +
freshness 14-within-grace). **(c) The placement audit:** `placement:
generate` reconciles — 184 ids + 6 boards · 0 unplaced · 0 duplicate
homes · zero diff. **(d) The gates:** ALL GREEN (2m 42s: secret scan
8/1019 · tsc 6/6 · eslint 0/0 · copy:audit clean · narrator in sync +
eval 50 · layer1 11,819/11,819 · the suite 15,099 — the S19 count
EXACTLY · build + budgets: entry 272.83/82.52, every page chunk within
its row, IDENTICAL to the S19 rows). **(e) The browser regression
(BD-S20b):** all 10 routes × 1440×900 + 360×844 × en + fa (40 legs,
LIVE on production) — the per-route titles/descriptions/canonicals +
og:locale (en_US/fa_IR), the trails on the EIGHT destinations only, the
legacy deprecation banner live, 0px horizontal overflow on every leg,
ZERO console/page errors on every leg, the Global one-screen rule WITH
the footer at BOTH widths, long pages push the footer below content,
dir=rtl + Persian titles on every fa leg, Global's 10 tiles
verdicts-or-designed-live-content (the prices ribbon matching the
snapshot byte-for-byte) + the 7 destination chips, Gold's 37 seats with
lean + evidence + the honest-record footnote, Currencies' 7 rule lights
+ 14 registry cards + 11-pair board, NO DEAD LINKS on any route, the
interaction golden path (the Global tile SPA navigation + the mobile
drawer). **(f) The performance budget check (BD-S20c):** the bundle
rows held + the measured live pass — COLD first visit at 1440×900: load
380ms, 485KB (the font + the shell dominate; the page code does not) ·
COLD /gold at 360×844: 76ms/14KB · WARM per route: DCL/load 59–81ms,
8–28KB. **(g) The close (BD-S20-deploy):** NO deploy — the session's
only tree changes are the manual audit script (dev tooling, never
shipped) + the additive adapters export block (zero runtime change);
production stays at currena-api `74777037` + currena-markets
`8f63c8fa`; this session's own 715-check live sweep + 40-leg browser
pass + 20-id upstream audit IS the proof that production serves exactly
this tree's behavior. The ecb-drf provider timeout stays a
maintenance-session item. Decisions: BD-S20a · BD-S20b · BD-S20c ·
BD-S20-deploy, all in `docs/DECISIONS.md`.

### ✅ S21 — Spec-vs-implementation audit · `Session 21/30` · delivered 2026-11-12 · **Phase J (S21 done — Phase J CLOSED)**
- Full diff: spec §4–§14 vs the live site; every deviation fixed or
  documented as a decision; placement table regenerated & reconciled.

**S21 delivery record (2026-11-12):** the full spec-vs-implementation
audit delivered whole — every §4–§14 section diffed against the code
(four parallel audit passes, every checklist item traced to file:line)
AND the live production site (every page's spec-visible structure
verified on currena.ir: the 10 Global tiles + 7 chips · Gold's 37
seats in 7/7/11/10/2 lanes + the honest-record footnote + the blocked
notes · World Markets' 16-map + the Asia-Pacific 7/Europe 4/Americas 5
grids + the 9 risk cards · USA's 5-verdict strip + 72 cards + the 6
tier headings + the 3-card zoom · Europe's eu/uk-apart sections + the
4 zoom + 3 cross-links · Asia's 5 sub-regions + 11 cards + the 6 zoom
+ cross-links · Australia's 19-row board + 28 cards + 11 seat chips + 2
shadow gauges · Commodities' 5 groups + 24 cards + the gold link ·
Currencies' 7 lights + 11 pairs + 4 sections · the legacy deprecation
banner). **The verdict: the spec is implemented faithfully** — every
prior recorded deviation (BD-S3…BD-S19) re-confirmed as holding; TWO
informational notes recorded (the narrator's 2-line clamp; the reused
map's always-visible cards vs the spec's loose "hover" phrasing).
**(a) Four deviations FIXED (BD-S21b/c/d):** the headline — the §9
item 5 NZX50 surface lands on /asia-pacific at last (the Pacific—NZ
section was missing NZX50 AND its intro falsely claimed it "rides the
Asia zoom map above" in both locales, verified live; the new
AsiaNzx50Card renders the AU Markets board's own nz50 row — the SAME
cached payload + formatting helpers, one board one vocabulary, the
corpus-pinned name, the close + window-tagged day change + the
52-week range sentence + as-of + stale word + the REAL /australia
link; honest "being prepared" on the dead path; M-17 last-good; the
§9.6 zoom deviation RECORDED — NZX50 is not a world-board index, a pin
would be engine-layer); the BD-S5a revisit clause discharged (the
Global cached header stops doubling the date); the three stale Asia
placement notes aligned with the BD-S14a/BD-S15d truth; the stale
code comments aligned with BD-S3c/BD-S4a. **(b) Two spec-side drift
findings RECORDED (AF-6/AF-7, info):** spec §6's Asia grid lists 6
indices while its own hero requires 16 (the registry renders 7 incl.
ASX200 — the AF-2 class); spec §10's "10 ASX-200 sectors" vs the
board's actual 11 (sums to 18≠19 — a spec typo, the code is right).
**(c) The §14 placement table regenerated & reconciled:** 184 ids · 0
unplaced · 0 duplicate homes · 0 unknown · 0 mirror overlaps — the
committed doc regenerated with the intentional notes + findings only.
**(d) The gates ALL GREEN** (2m 38s: secret scan 8/1020 · tsc 6/6 ·
eslint 0/0 · copy:audit clean [2 new fa strings queued, 1 triaged
needs-review] · narrator in sync + eval 50 · layer1 11,819/11,819 ·
the suite 15,102 = +3 · build + budgets held — every page chunk within
its row). **(e) The live verdict backtests:** ALL ELEVEN pd-*
scripts re-run vs production — 715 checks ALL GREEN (s4 84 + the
narrator raw-KV stateHash recompute IDENTICAL · s5 150 · s7 56 · s8 9
· s9 115 · s10 115+48 · s12 8 · s14 11 · s16 28 · s17 24 · s18
14+16+23). **(f) The §21 data audit (the S20 tool re-run):** 19/20
green (18 byte-exact + platinum's live-spot arm) + ONE red with a
fully-explained cause (BD-S21e): the probes hit the IMF PortWatch
endpoint's SCHEDULED Tuesday-maintenance window (the provider's own
banner: Tuesdays 6:00–9:00 AM ET — the probes ran 11:38–11:50 UTC =
6:38–6:50 AM ET); the stored values (asOf 2026-11-01, within the
14-day grace, the provider's own ~7-day lag) hold on last-good under
the fail-closed design; RE-RUN AFTER THE WINDOW (≥14:00 UTC): ALL 20
GREEN (see the close record below) — the runbook note for every future
audit: never run the portwatch leg Tuesdays 11:00–14:00 UTC.
**(g) The deploy (the owner's standing — something WAS fixed):**
deploy-lock clear (`74777037` @ 100%) → currena-api **`5593fd43`**
(WEB-ONLY; the markets worker stays `8f63c8fa`); the deployed entry
CSS+JS + the AsiaPage chunk byte-verified identical to the local
build; live acceptance ALL GREEN (the NZX50 card READY at both widths
en+fa with the live AU-board row · the false sentence GONE while the
Korea/India TRUE zoom sentences stay · the zoom still six cards · the
post-deploy backtests green [s4 + s14 re-run] · the 24-leg browser
regression: 0px overflow · NO dead links · ZERO console/page errors ·
RTL verified). Rollback: one `wrangler rollback` → the S19 shape.
Decisions: BD-S21a · BD-S21b · BD-S21c · BD-S21d · BD-S21e + the
deploy record, all in `docs/DECISIONS.md` + `docs/DEPLOY.md`.

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
| A Foundations | S1–S4 | ✅ S1 2026-11-07 · S2 2026-11-08 · S3 2026-11-08 · S4 2026-11-08 |
| B Gold | S5–S6 | ✅ S5 2026-11-08 (deployed `f2e74f3c`) · ✅ S6 2026-11-08 (deployed `327c7761`, BD-S6a's alternation) |
| C World Markets | S7–S8 | ✅ S7 2026-11-08 (deployed `6e515cf8`, the D-43 map hero + the region grids + the 9 risk cards) · ✅ S8 2026-11-08 (deployed `fde50a95`, the four REGION zoom maps — PHASE C CLOSED) |
| D USA | S9–S11 | ✅ S9 2026-11-09 (deployed `36f64141`, the D-30 verdict strip + tiers 1–2 — PHASE D OPEN) · ✅ S10 2026-11-09 (deployed `18907d4d`, tiers 3–5 + the TIC board — the 72 cards complete) · ✅ S11 2026-11-09 (deployed `4f288272`, the USA gates — the freshness audit formalized, the mobile/ARIA polish, the In-build chip retired — **PHASE D CLOSED**) |
| E Europe | S12–S13 | ✅ S12 2026-11-09 (deployed `84833135`, the EU + non-EU UK sections + the zoom + the cross-links — the 8 placed ids, the §15 fills verified-pending-ingest — Phase E OPEN) · ✅ S13 2026-11-09 (deployed `b11fd84f`, the Europe gates — the card-render audit, the freshness honest, the mobile/ARIA pass, the In-build chip retired — **PHASE E CLOSED**) |
| F Asia & Pacific | S14–S15 | ✅ S14 2026-11-09 (deployed `68281479`, the five sub-regions D-35 — China 7 · Japan 2 · Korea/Taiwan/HK index-only · India index-only · Pacific-NZ 2 = 11 placed cards, the S8 zoom, the cross-links, the §15 CPI fills VERIFIED STALE — Rule 5 — BD-S14a; the honest In-build chip stays until S15 — Phase F OPEN) · ✅ S15 2026-11-09 (deployed `6f96cd9a`, the Asia gates — the card-render audit, the freshness honest, the mobile/ARIA pass, the In-build chip retired — **PHASE F CLOSED**) |
| G Australia | S16 | ✅ S16 2026-11-10 (deployed `9d60726b` 2026-11-10 ~20:30 UTC — the Australia build & gates: the REUSED AU Markets board [19 symbols], the 5-gauge structure D-37, the 28 cards, the 11 moved-out seat chips, the §21 backtest + the render audit + the In-build chip RETIRED; the post-deploy §21 28/28 green + the 4-leg browser pass green — **PHASE G CLOSED**) |
| H Commodities | S17 | ✅ S17 2026-11-11 (deployed `08e0fc64`, the 4 commodity groups + the trade routes & supply group — 24 cards + the gold cross-link; the §21 backtest + the render audit + the In-build chip RETIRED; the post-deploy §21 24/24 green + the 4-leg browser pass green — **PHASE H CLOSED**) |
| I Currency Pairs | S18 | ✅ S18 2026-11-11 (deployed currena-api `51a0fe45` + currena-markets `8f63c8fa` + the fx-run KV seed — the rule lights hero + the 11-pair board [AUDNZD the 11th pair, D-42] + the dollar-standing cards; the §21 backtest [3 gates] + the render audit + the In-build chip RETIRED — **PHASE I CLOSED**) |
| J Integration | S19–S21 | ✅ S19 2026-11-12 (deployed `74777037`, the navigation/mobile/SEO polish — the breadcrumbs + the per-page meta/OG + the language-toggle polish + the sticky-footer verification + the two S1-noted hero items; the markets worker untouched — Phase J OPEN) · ✅ S20 2026-11-12 (NO deploy — the full-site regression + verdict backtest + data audit ALL GREEN: the 11 live pd-* backtests 715 checks · the N=20 source spot-check 20/20 · the 40-leg browser pass · the performance check · the placement reconciliation · the gates 15,099) · ✅ S21 2026-11-12 (deployed `5593fd43` — the spec-vs-implementation audit: the full §4–§14 diff vs the live site · four deviations FIXED [the NZX50 mirror card on /asia-pacific + the Global cached-header BD-S5a clause + the stale placement notes + the stale comments] · AF-6/AF-7 recorded · the placement reconciled · the gates 15,102 · the 11 backtests 715 green · the data audit re-run green after the PortWatch maintenance window — **PHASE J CLOSED**) |
| K Investor + final | S22–S24 | ☐ |
| Reserve | S25–S30 | ☐ |

**Current position: Session 21/30 delivered 2026-11-12 · 9 remaining — next
action: Session 22/30 (S22 — Phase K OPENS: the investor feedback → spec
v2 — collect the external investor's answers to spec §19, record them as
D-49+ in the strategy log, and produce the spec v2 entries; the owner's
lever is arranging the review — spec §19 lists the seven questions). The
§15 FRED-only CPI fills for Asia (BD-S14a/BD-S15d) stay carried forward
to a dedicated fill session — pick a viable monthly source for JP/KR/IN:
the national statistics bureaus directly, a fresh FRED/IMF IFS series, or
the World Bank annual as a lower-resolution fallback. The ecb-dfr
provider timeout from the S18 data-refresh runs (held on last-good at
2.5, flagged stale) did NOT self-clear across rungs — it belongs to a
maintenance session now (the runbook: docs/INDICATORS_AND_DATA_SOURCES.md
+ the /admin console's per-source status, which needs the owner's
REFRESH_SECRET). The S20 data-audit tool is re-runnable for any later
session's §21 data-audit gate: `pnpm --filter @currena/web exec tsx
../../apps/web/scripts/pd-s20-data-audit.ts` — RUNBOOK NOTE (BD-S21e):
never run it Tuesdays 11:00–14:00 UTC (the IMF PortWatch scheduled
maintenance window). The spec audit findings AF-1…AF-7 (the spec's own
hand-count drift) wait for the S22+ investor-review spec v2 pass — never
silent edits.**
